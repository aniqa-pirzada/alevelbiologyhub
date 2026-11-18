// Models for 3.3.3.3 Aerobic respiration and 3.3.3.4 Respiratory substrates (Phase 5 Batch 2, author A2). Loaded after
// 3.3.3.1.js, 3.3.3.2.js and _mito-art.js, before 3.3.3.3.js, 3.3.3.4.js and js/views/interactives-mito.js.
// Specified in the scratch file A2-MODEL.md (checked by an independent reviewer before it was built, 2026-11-17).
//
// Namespaces
//   B.respModel.GLYCOLYSIS   per-glucose glycolysis counts agreed with author A1 (3.3.3.1): net 2 ATP, 2 reduced NAD.
//   B.krebsModel             link reaction and Krebs cycle accounting, basis "pyruvate" or "glucose", never mixed.
//   B.oxphosModel            oxidative phosphorylation: electron flow, proton gradient, ATP synthase (arbitrary units).
//   B.rqModel                respiratory quotient: unit handling, calculation, marking and tentative interpretation.
//   B.respModel.validate()   runs every worked test case of A2-MODEL.md; returns a list of failures (empty = pass).
//
// Scientific conventions
// - Pyruvate (3C) enters the matrix by active transport; it is oxidised to acetate (2C) with release of CO2 and the
//   reduction of one NAD; acetate + coenzyme A -> acetylcoenzyme A; acetylcoenzyme A + four-carbon molecule -> six-carbon
//   molecule, coenzyme A released; Krebs cycle: 6C -> 5C + CO2 (reduced NAD), 5C -> 4C + CO2 (reduced NAD, ATP),
//   4C regenerated (reduced FAD, reduced NAD). Per pyruvate: 3 CO2, 4 reduced NAD, 1 reduced FAD, 1 ATP.
//   Per glucose: everything doubled. The carbon count on screen includes the four-carbon acceptor and the CO2 released,
//   not coenzyme A (a carrier, released unchanged). Accounting is by molecule counts; in the real cycle the CO2 released
//   in one turn does not contain that turn's acetyl carbon atoms (beyond the specification, not shown to students).
// - Oxidative phosphorylation: protons are pumped by electron carriers FROM THE MATRIX INTO THE INTERMEMBRANE SPACE and
//   diffuse back FROM THE INTERMEMBRANE SPACE INTO THE MATRIX through ATP synthase, whose head (ADP + Pi -> ATP) is in
//   the matrix. Oxygen is the final electron acceptor and forms water in the matrix.
window.BIO = window.BIO || {};
(function (B) {
  B.respModel = B.respModel || {};
  B.respModel.GLYCOLYSIS = { basis: "glucose", atpUsed: 2, atpMade: 4, atpNet: 2, reducedNAD: 2, pyruvate: 2, triosePhosphate: 2 };

  // ===================================== Link reaction and Krebs cycle =====================================
  // Each step: the molecules on screen (carbon chains), and the cumulative products, for ONE pyruvate.
  const STEPS = [
    { id: "start", title: "Pyruvate from glycolysis", where: "cytoplasm", mol: { pyr: 1, acc: 1 }, d: {},
      text: "Glycolysis in the cytoplasm has made pyruvate, a three-carbon molecule. In the matrix of the mitochondrion is a four-carbon molecule that will accept the carbon atoms later." },
    { id: "enter", title: "Pyruvate enters the matrix", where: "matrix", mol: { pyr: 1, acc: 1 }, d: {},
      text: "Pyruvate is moved into the matrix by <strong>active transport</strong> (it needs a carrier protein and energy)." },
    { id: "ox", title: "Link reaction: pyruvate is oxidised to acetate", where: "matrix", mol: { ace: 1, acc: 1 }, d: { co2: 1, nadh: 1 },
      text: "Pyruvate (3C) is <strong>oxidised to acetate</strong> (2C). Hydrogen is removed and <strong>NAD is reduced</strong> (one reduced NAD); one carbon atom is released as <strong>carbon dioxide</strong>." },
    { id: "coa", title: "Link reaction: acetylcoenzyme A forms", where: "matrix", mol: { acoa: 1, acc: 1 }, d: {},
      text: "Acetate combines with <strong>coenzyme A</strong> to form <strong>acetylcoenzyme A</strong>. This is the end of the link reaction." },
    { id: "c6", title: "Acetylcoenzyme A reacts with the four-carbon molecule", where: "matrix", mol: { c6: 1 }, d: {},
      text: "Acetylcoenzyme A (2C) reacts with the <strong>four-carbon molecule</strong>, forming a <strong>six-carbon molecule</strong>. <strong>Coenzyme A is released</strong> and can combine with more acetate. <span class=\"badge\">supporting</span> The 4C molecule is oxaloacetate and the 6C molecule is citrate; you do not need these names." },
    { id: "c5", title: "Krebs cycle: 6C → 5C", where: "matrix", mol: { c5: 1 }, d: { co2: 1, nadh: 1 },
      text: "The six-carbon molecule is <strong>oxidised</strong>: hydrogen is removed (NAD is reduced) and one carbon is released as <strong>CO₂</strong>, leaving a five-carbon molecule." },
    { id: "c4", title: "Krebs cycle: 5C → 4C", where: "matrix", mol: { c4: 1 }, d: { co2: 1, nadh: 1, atp: 1 },
      text: "The five-carbon molecule is oxidised again: another <strong>CO₂</strong> is released, NAD is reduced and one <strong>ATP</strong> is made directly, leaving a four-carbon molecule." },
    { id: "regen", title: "Krebs cycle: the four-carbon molecule is regenerated", where: "matrix", mol: { acc: 1 }, d: { fadh: 1, nadh: 1 },
      text: "A series of <strong>oxidation-reduction</strong> reactions changes this four-carbon molecule back into the one that accepts acetylcoenzyme A. Hydrogen is removed twice: <strong>FAD is reduced</strong> once and <strong>NAD is reduced</strong> once. The cycle can turn again." },
  ];
  const CARBONS = { pyr: 3, ace: 2, acoa: 2, c6: 6, c5: 5, c4: 4, acc: 4 };
  // states(basis): cumulative state at every step; basis "pyruvate" (x1) or "glucose" (x2: two pyruvate, two turns)
  function kStates(basis = "pyruvate") {
    const k = basis === "glucose" ? 2 : 1; let cum = { co2: 0, nadh: 0, fadh: 0, atp: 0 };
    return STEPS.map((s) => { cum = { co2: cum.co2 + (s.d.co2 || 0), nadh: cum.nadh + (s.d.nadh || 0), fadh: cum.fadh + (s.d.fadh || 0), atp: cum.atp + (s.d.atp || 0) };
      const mol = {}; for (const [m, n] of Object.entries(s.mol)) mol[m] = n * k;
      return { step: s.id, basis, k, mol, co2: cum.co2 * k, nadh: cum.nadh * k, fadh: cum.fadh * k, atp: cum.atp * k }; });
  }
  const kCarbon = (st) => Object.entries(st.mol).reduce((a, [m, n]) => a + CARBONS[m] * n, 0) + st.co2;
  B.krebsModel = { STEPS, CARBONS, states: kStates, carbon: kCarbon,
    PER_PYRUVATE: { co2: 3, nadh: 4, fadh: 1, atp: 1 }, LINK_PER_PYRUVATE: { co2: 1, nadh: 1 }, KREBS_PER_PYRUVATE: { co2: 2, nadh: 3, fadh: 1, atp: 1 } };

  // ===================================== Oxidative phosphorylation =====================================
  // Arbitrary units. G: proton gradient 0..100 (100 = steepest gradient the chain can pump against).
  // Electron flow e = S * Ox * Cn * (1 - G/100); pumping = 10 e; flow through ATP synthase = 0.1 * Y * G;
  // leak through an uncoupled membrane = 0.4 * U * G; dG/dt = pumping - ATP synthase flow - leak.
  // Indices relative to normal (S = 1, no disruption: G = 50, e = 0.5): oxygen uptake 200 e, gradient 2 G,
  // ATP 2 Y G, extra heat 8 U G; NAD returned to the Krebs cycle follows oxygen uptake. One disruption at a time.
  const DIS = {
    none: { name: "No disruption", Ox: 1, Cn: 1, Y: 1, U: 0 },
    noO2: { name: "Oxygen removed", Ox: 0, Cn: 1, Y: 1, U: 0 },
    cyanide: { name: "Cyanide", Ox: 1, Cn: 0, Y: 1, U: 0 },
    atps: { name: "ATP synthase blocked", Ox: 1, Cn: 1, Y: 0, U: 0 },
    uncoupler: { name: "Uncoupler (stretch)", Ox: 1, Cn: 1, Y: 1, U: 1 },
  };
  const par = (dis, S) => { const d = DIS[dis] || DIS.none; return { ...d, S: Math.max(0.25, Math.min(1, S == null ? 1 : S)) }; };
  const flows = (p, G) => { const e = p.S * p.Ox * p.Cn * Math.max(0, 1 - G / 100); return { e, pump: 10 * e, fs: 0.1 * p.Y * G, fl: 0.4 * p.U * G }; };
  const indices = (p, G) => { const f = flows(p, G); const o2 = 200 * f.e; return { G, e: f.e, o2, gradient: 2 * G, atp: 2 * p.Y * G, heat: 8 * p.U * G, nad: o2, water: o2 }; };
  function steady(dis, S) { const p = par(dis, S); const K = p.S * p.Ox * p.Cn; const G = (10 * K) / (0.1 * K + 0.1 * p.Y + 0.4 * p.U); return indices(p, Math.min(100, Math.max(0, G))); }
  // one Euler step (animation); returns the new gradient
  function step(G, dis, S, dt = 0.05) { const p = par(dis, S); const f = flows(p, G); return Math.min(100, Math.max(0, G + dt * (f.pump - f.fs - f.fl))); }
  function run(G0, dis, S, n, dt = 0.05) { let G = G0; const path = [G]; for (let i = 0; i < n; i++) { G = step(G, dis, S, dt); path.push(G); } return path; }
  // qualitative word for an index compared with normal (100)
  const word = (v) => (v < 0.5 ? "stops" : v < 99.5 ? "falls" : v > 100.5 ? "rises" : "no change");
  // Disruption Challenge: scenarios, rows and accepted answers (A2-MODEL.md Model 4, with reviewer changes)
  const CH_ROWS = ["o2", "gradient", "atp", "krebs"];
  const CH_NAMES = { o2: "Oxygen uptake", gradient: "Proton gradient", atp: "ATP made by ATP synthase", krebs: "Krebs cycle" };
  const CH_CHOICES = [["rises", "rises"], ["no change", "no change"], ["falls", "falls"], ["stops", "stops"]];
  const SCEN = {
    noO2: { dis: "noO2", S: 1, name: "Oxygen removed", setup: "The cells are kept in a solution with no oxygen.",
      ans: { o2: ["stops"], gradient: ["falls", "stops"], atp: ["stops"], krebs: ["stops"] },
      why: { o2: "There is no oxygen to take up.", gradient: "Without a final electron acceptor, electrons cannot leave the chain, so it stops; no protons are pumped, and those already in the intermembrane space flow back through ATP synthase until the gradient has gone.", atp: "Once the gradient has gone, no protons flow through ATP synthase, so oxidative phosphorylation stops. Only glycolysis (anaerobic respiration) still makes ATP.", krebs: "Reduced NAD and reduced FAD are not oxidised, so NAD and FAD are not regenerated; with no coenzyme to accept hydrogen, the link reaction and Krebs cycle stop." } },
    cyanide: { dis: "cyanide", S: 1, name: "Cyanide", setup: "Cyanide stops the last carrier in the chain passing electrons to oxygen. Oxygen is still present.",
      ans: { o2: ["stops"], gradient: ["falls", "stops"], atp: ["stops"], krebs: ["stops"] },
      why: { o2: "Oxygen is present but cannot accept electrons, so none is used.", gradient: "Electrons cannot pass along the chain, so no protons are pumped; the gradient runs down as protons flow back through ATP synthase.", atp: "No gradient means no flow through ATP synthase, so no ATP from oxidative phosphorylation. This is why cyanide is so poisonous.", krebs: "Reduced NAD is not oxidised, so no NAD is regenerated for the link reaction and Krebs cycle, which stop." } },
    atps: { dis: "atps", S: 1, name: "ATP synthase blocked", setup: "An inhibitor blocks the channel through ATP synthase, so protons cannot flow through it.",
      ans: { o2: ["stops", "falls"], gradient: ["rises"], atp: ["stops"], krebs: ["stops", "falls"] },
      why: { o2: "Protons build up in the intermembrane space until the carriers cannot pump against the steep gradient; electron flow, and so oxygen uptake, slows to a very low rate (the model shows it stopping).", gradient: "Protons are still pumped into the intermembrane space at first but cannot flow back, so the gradient becomes steeper.", atp: "No protons pass through ATP synthase, so no ATP is made by oxidative phosphorylation.", krebs: "As electron flow slows, reduced NAD is no longer oxidised, so NAD runs out and the Krebs cycle slows to a stop." } },
    lowS: { dis: "none", S: 0.5, name: "Less respiratory substrate", setup: "Less respiratory substrate is available, so less reduced NAD is supplied to the chain (half the usual supply).",
      ans: { o2: ["falls"], gradient: ["falls"], atp: ["falls"], krebs: ["falls"] },
      why: { o2: "Fewer electrons enter the chain each second, so less oxygen is needed to accept them.", gradient: "Less electron flow pumps fewer protons, so the gradient is smaller.", atp: "Fewer protons flow through ATP synthase, so less ATP is made.", krebs: "With less substrate, fewer acetyl groups enter the Krebs cycle, so it turns more slowly." } },
    uncoupler: { dis: "uncoupler", S: 1, name: "Uncoupler (stretch)", setup: "A chemical makes the inner membrane leaky to protons, so they can cross it without passing through ATP synthase.",
      ans: { o2: ["rises"], gradient: ["falls"], atp: ["falls"], krebs: ["rises"] },
      why: { o2: "With a smaller gradient the carriers pump more easily, so electrons flow faster and more oxygen is used.", gradient: "Protons leak back into the matrix, so the gradient stays small.", atp: "Most protons return through the leaks, not through ATP synthase, so less ATP is made; the energy is released as heat.", krebs: "Reduced NAD is oxidised faster, so NAD is regenerated faster and the Krebs cycle turns faster, using more respiratory substrate." } },
  };
  // the model's own answer for a challenge row (used to check that SCEN.ans agrees with the model)
  const modelWord = (k, row) => { const s = SCEN[k]; const r = steady(s.dis, s.S); return word(row === "krebs" ? r.nad : r[row]); };
  B.oxphosModel = { DIS, steady, step, run, indices: (dis, S, G) => indices(par(dis, S), G), word, CH_ROWS, CH_NAMES, CH_CHOICES, SCEN, modelWord };

  // ===================================== Respiratory quotient =====================================
  const UNITS = { mol: { kind: "amount", f: 1, name: "mol" }, mmol: { kind: "amount", f: 0.001, name: "mmol" },
    mm3: { kind: "volume", f: 0.001, name: "mm³" }, cm3: { kind: "volume", f: 1, name: "cm³" }, dm3: { kind: "volume", f: 1000, name: "dm³" } };
  const fmt = (x) => { const r = Math.round(x * 10000) / 10000; return String(r); };
  // calc(co2, co2Unit, o2, o2Unit) -> { ok, rq, rq2 (2 d.p. number), shown (string), conv (words) } or { ok: false, msg }
  function calc(co2, cu, o2, ou) {
    const a = Number(co2), b = Number(o2);
    if (!isFinite(a) || !isFinite(b) || co2 === "" || o2 === "" || co2 == null || o2 == null) return { ok: false, code: "nan", msg: "Enter a number for each gas." };
    if (a < 0 || b < 0) return { ok: false, code: "neg", msg: "Values must be 0 or more: a gas cannot be produced or consumed in a negative amount." };
    const U1 = UNITS[cu], U2 = UNITS[ou]; if (!U1 || !U2) return { ok: false, code: "unit", msg: "Choose a unit for each gas." };
    if (U1.kind !== U2.kind) return { ok: false, code: "kind", msg: "Give both gases in the same kind of unit: both as amounts (mol) or both as volumes. RQ must compare like with like." };
    if (a === 0 && b === 0) return { ok: false, code: "none", msg: "No gas exchange measured, so RQ cannot be calculated." };
    if (b === 0) return { ok: false, code: "noO2", msg: "RQ cannot be calculated: no oxygen was consumed (consistent with only anaerobic respiration)." };
    const base = U1.kind === "amount" ? "mol" : "cm3"; const A = a * U1.f / UNITS[base].f, Bv = b * U2.f / UNITS[base].f;
    let conv = ""; if (cu !== ou) { const parts = []; if (cu !== base) parts.push(`${fmt(a)} ${U1.name} = ${fmt(A)} ${UNITS[base].name}`); if (ou !== base) parts.push(`${fmt(b)} ${U2.name} = ${fmt(Bv)} ${UNITS[base].name}`); conv = parts.join("; "); }
    const rq = A / Bv; const h = Math.round(rq * 100); return { ok: true, rq, rq2: h / 100, hundredths: h, shown: (h / 100).toFixed(2), conv, co2: A, o2: Bv, unit: UNITS[base].name };
  }
  // mark(studentValue, result): compared in whole hundredths with the displayed 2 d.p. value, tolerance 1 hundredth
  function mark(student, res) { const v = Number(String(student).trim().replace(",", ".")); if (String(student).trim() === "" || !isFinite(v)) return null; return Math.abs(Math.round(v * 100) - res.hundredths) <= 1; }
  // interpret(rq2): tentative wording, band on the 2 d.p. value
  const TENT = "Other mixtures of substrates could give the same value, so this conclusion is tentative.";
  function interpret(rq2) {
    const h = Math.round(rq2 * 100); let band, text;
    if (h < 65) { band = "low"; text = "This is lower than expected for any single respiratory substrate. Check the data; another process may be taking up carbon dioxide (for example photosynthesis in green tissue). <span class=\"badge\">stretch</span> Oily seeds converting lipid to carbohydrate take up oxygen without releasing much carbon dioxide."; }
    else if (h <= 74) { band = "lipid"; text = "Close to 0.7: consistent with mainly <strong>lipid</strong> being respired."; }
    else if (h <= 84) { band = "mixLP"; text = "Between the values for lipid and carbohydrate: consistent with <strong>protein</strong> (about 0.8 to 0.9) or a <strong>mixture</strong> of lipid and carbohydrate."; }
    else if (h <= 94) { band = "protein"; text = "Close to 0.9: consistent with <strong>protein</strong>, or a <strong>mixture</strong> of carbohydrate and lipid."; }
    else if (h <= 105) { band = "carb"; text = "Close to 1.0: consistent with mainly <strong>carbohydrate</strong> being respired."; }
    else { band = "high"; text = "Above 1: more carbon dioxide is released than oxygen is used. This is consistent with <strong>some anaerobic respiration</strong> alongside aerobic respiration. <span class=\"badge\">stretch</span> Converting carbohydrate to lipid also releases carbon dioxide."; }
    return { band, text, tentative: TENT };
  }
  const PRESETS = [
    { k: "A", name: "A: germinating wheat grains", note: "Hypothetical data. Starchy grains, measured over one hour at the same temperature and pressure.", co2: 24.0, cu: "cm3", o2: 24.0, ou: "cm3" },
    { k: "B", name: "B: germinating castor oil seeds", note: "Hypothetical data. Oily seeds, measured over one hour at the same temperature and pressure.", co2: 2.1, cu: "cm3", o2: 3.0, ou: "cm3" },
    { k: "C", name: "C: yeast, little oxygen", note: "Hypothetical data. Yeast in glucose solution with little oxygen, over 10 minutes.", co2: 18, cu: "cm3", o2: 12, ou: "cm3" },
    { k: "D", name: "D: mixed units", note: "Hypothetical data. A small mammal over one minute; the two gases were recorded in different volume units.", co2: 0.0171, cu: "dm3", o2: 22.5, ou: "cm3" },
  ];
  B.rqModel = { UNITS, calc, mark, interpret, PRESETS, TENT };

  // ===================================== validate(): the worked test cases of A2-MODEL.md =====================================
  function validate() {
    const errs = []; const eq = (a, b, msg, tol = 1e-6) => { if (Math.abs(a - b) > tol) errs.push(`${msg}: ${a} != ${b}`); };
    // Model 2
    const P = kStates("pyruvate"), Gl = kStates("glucose");
    P.forEach((st) => eq(kCarbon(st), 7, "carbon per pyruvate at " + st.step)); Gl.forEach((st) => eq(kCarbon(st), 14, "carbon per glucose at " + st.step));
    const at = (L, id) => L.find((s) => s.step === id);
    eq(at(P, "ox").co2, 1, "T1 CO2"); eq(at(P, "ox").nadh, 1, "T1 NADH");
    if (!at(P, "c6").mol.c6) errs.push("T2 six-carbon molecule missing");
    const e1 = P[P.length - 1], e2 = Gl[Gl.length - 1];
    [["co2", 3], ["nadh", 4], ["fadh", 1], ["atp", 1]].forEach(([k, v]) => eq(e1[k], v, "T3 per pyruvate " + k));
    [["co2", 6], ["nadh", 8], ["fadh", 2], ["atp", 2]].forEach(([k, v]) => eq(e2[k], v, "T4 per glucose " + k));
    eq(at(Gl, "ox").co2, 2, "T5 link per glucose CO2"); eq(at(Gl, "ox").nadh, 2, "T5 link per glucose NADH");
    const c3 = at(P, "coa"); [["co2", 2], ["nadh", 3], ["fadh", 1], ["atp", 1]].forEach(([k, v]) => eq(e1[k] - c3[k], v, "T7 Krebs only " + k));
    P.forEach((st, i) => ["co2", "nadh", "fadh", "atp"].forEach((k) => eq(Gl[i][k], 2 * st[k], "per glucose = 2 x per pyruvate " + k)));
    eq(e1.co2, CARBONS.pyr, "CO2 carbon = pyruvate carbon"); eq(e2.co2, 6, "CO2 per glucose = glucose carbon");
    const G0 = B.respModel.GLYCOLYSIS; eq(G0.reducedNAD + e2.nadh, 10, "whole glucose reduced NAD"); eq(G0.atpNet + e2.atp, 4, "ATP before oxidative phosphorylation");
    // Model 3
    const cases = [["none", 1, 50, 100, 100, 100, 0], ["noO2", 1, 0, 0, 0, 0, 0], ["cyanide", 1, 0, 0, 0, 0, 0], ["atps", 1, 100, 200, 0, 0, 0], ["uncoupler", 1, 50 / 3, 100 / 3, 500 / 3, 100 / 3, 400 / 3], ["none", 0.5, 100 / 3, 200 / 3, 200 / 3, 200 / 3, 0]];
    cases.forEach(([d, S, G, gr, o2, atp, heat]) => { const r = steady(d, S); eq(r.G, G, `oxphos ${d} S=${S} G`, 0.01); eq(r.gradient, gr, `oxphos ${d} gradient`, 0.01); eq(r.o2, o2, `oxphos ${d} O2`, 0.01); eq(r.atp, atp, `oxphos ${d} ATP`, 0.01); eq(r.heat, heat, `oxphos ${d} heat`, 0.01);
      const f = flows(par(d, S), r.G); eq(f.pump, f.fs + f.fl, `oxphos ${d} proton balance`, 1e-6); });
    const path = run(0, "none", 1, 600); if (Math.abs(path[600] - 49.88) > 0.02) errs.push("oxphos dynamic G600 " + path[600]); if (path.some((g, i) => i && g < path[i - 1])) errs.push("oxphos not monotonic");
    Object.keys(SCEN).forEach((k) => CH_ROWS.forEach((row) => { if (!SCEN[k].ans[row].includes(modelWord(k, row))) errs.push(`challenge ${k} ${row}: model says ${modelWord(k, row)}`); }));
    // Model 5
    const R = (a, cu, b, ou) => calc(a, cu, b, ou);
    [[12.0, "cm3", 12.0, "cm3", "1.00", "carb"], [3.5, "cm3", 5.0, "cm3", "0.70", "lipid"], [4.5, "mmol", 5.0, "mmol", "0.90", "protein"], [18, "cm3", 12, "cm3", "1.50", "high"], [0.0156, "dm3", 20.0, "cm3", "0.78", "mixLP"], [450, "mm3", 0.5, "cm3", "0.90", "protein"], [0.0300, "dm3", 33.3, "cm3", "0.90", "protein"],
      [24, "cm3", 24, "cm3", "1.00", "carb"], [2.1, "cm3", 3.0, "cm3", "0.70", "lipid"], [1.7, "cm3", 2.4, "cm3", "0.71", "lipid"], [4.2, "cm3", 6.0, "cm3", "0.70", "lipid"], [0.0225, "dm3", 25.0, "cm3", "0.90", "protein"], [0.0171, "dm3", 22.5, "cm3", "0.76", "mixLP"]]
      .forEach(([a, cu, b, ou, s, band]) => { const r = R(a, cu, b, ou); if (!r.ok || r.shown !== s) errs.push(`RQ ${a}${cu}/${b}${ou}: ${r.shown || r.msg} != ${s}`); else if (interpret(r.rq2).band !== band) errs.push(`RQ band ${s}: ${interpret(r.rq2).band} != ${band}`); });
    if (R(5, "cm3", 0, "cm3").code !== "noO2") errs.push("R6 O2 = 0"); if (R(4.5, "mmol", 5.0, "cm3").code !== "kind") errs.push("R7 mixed kinds"); if (R(-1, "cm3", 5, "cm3").code !== "neg") errs.push("R9 negative"); if (R(0, "cm3", 0, "cm3").code !== "none") errs.push("R13 no gas exchange");
    const r2 = R(3.5, "cm3", 5.0, "cm3"), r10 = R(0.0300, "dm3", 33.3, "cm3");
    if (mark("0.71", r2) !== true) errs.push("R11 0.71 for 0.70 should be accepted"); if (mark("0.72", r2) !== false) errs.push("R12 0.72 for 0.70 should be rejected"); if (mark("0.69", r2) !== true) errs.push("0.69 for 0.70 accepted");
    if (mark("0.89", r10) !== true || mark("0.91", r10) !== true || mark("0.92", r10) !== false) errs.push("R10 symmetric tolerance about 0.90"); if (mark("", r2) !== null) errs.push("blank answer not marked");
    // stoichiometry used in the notes: glucose 6/6, triolein 57/80, tristearin 114/163
    eq(Math.round(6 / 6 * 100), 100, "glucose RQ"); eq(Math.round(57 / 80 * 100), 71, "triolein RQ"); eq(Math.round(114 / 163 * 100), 70, "tristearin RQ");
    return errs;
  }
  B.respModel.validate = validate;
  if (typeof console !== "undefined") { const e = validate(); if (e.length) console.warn("respiration models (A2): validate() failed", e); }
})(window.BIO);
