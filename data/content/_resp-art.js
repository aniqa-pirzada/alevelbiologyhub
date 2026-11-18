// Drawings and models for 3.3.3.1 Glycolysis and 3.3.3.2 Anaerobic respiration (Phase 5 Batch 2, author A1, 2026-11-17).
// Loaded before 3.3.3.1.js, 3.3.3.2.js and js/views/interactives-glyco.js.
// Namespaces: B.respArt (drawings), B.glycoModel (glycolysis accounting), B.fermentModel (NAD regeneration model and the
// anaerobic respiration challenge). The model specification, reviewed before building, is A1-MODEL.md (review MR-A1).
//
// Scientific conventions (9610 v5.1 p.28; OpenStax Biology 7.2 and 7.5; Plants in Action 18.3.1; checked 2026-11-17):
// - Basis: everything is counted PER ONE MOLECULE OF GLUCOSE. Glycolysis: 2 ATP invested (glucose -> glucose phosphate
//   using ATP; a second phosphorylation, supporting, gives hexose bisphosphate), hexose bisphosphate (6C) splits into 2
//   triose phosphate (3C); each triose phosphate is oxidised to pyruvate (3C): NAD accepts the hydrogen (1 reduced NAD)
//   and 2 ATP are made. Per glucose: 4 ATP made, net 2 ATP, 2 reduced NAD, 2 pyruvate. No CO2, no oxygen used.
// - Lactate pathway: pyruvate (3C) + reduced NAD -> lactate (3C) + NAD. No CO2.
// - Ethanol pathway: pyruvate (3C) -> ethanal (2C, supporting) + CO2; ethanal + reduced NAD -> ethanol (2C) + NAD.
// - Neither pathway makes ATP: anaerobic respiration gives net 2 ATP per glucose, all from glycolysis.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5b6573", WHITE = "#ffffff", CYTO = "#f3f6fa", CYTOS = "#9fb0c2";
  const CARB = "#4b4b4b", PH = "#e9e2c9", PHS = "#8a7a3c", ATPC = "#a8520c", NADC = "#6a3893", NADO = "#1c7aa3";
  const GLU = "#2f6f3e", TPC = "#b25a12", PYR = "#7a4a12", LAC = "#b3261e", ETH = "#2f62a6", CO2C = "#4a4a4a";
  const SEL = "#e0a400", SELF = "#fff4c8", FADE = "#c3cad1";
  let cnt = 0, U = ""; const uid = () => (U = "-rs" + (++cnt));
  const r1 = (x) => Math.round(x * 10) / 10;
  const esc1 = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const T = (x, y, s, o = {}) => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}>${s}</text>`;
  const P = (d, o = {}) => `<path d="${d}" fill="none" stroke="${o.c || INK}" stroke-width="${o.w || 2}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="10" markerHeight="10" refX="7.5" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10z" fill="${col}"/></marker>`;
  const defs = (list) => `<defs>${list.map(([i, c]) => marker(i, c)).join("")}</defs>`;
  const svg = (w, h, aria, inner) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${esc1(aria)}" style="max-width:100%;height:auto;display:block" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"><rect x="0" y="0" width="${w}" height="${h}" fill="${WHITE}"/>${inner}</svg>`;
  // a molecule as a chain of carbon atoms (beads) centred on x, with phosphate groups at one or both ends
  const SP = 18;
  function chain(x, y, n, col, o = {}) {
    const x0 = x - ((n - 1) * SP) / 2; let s = `<line x1="${r1(x0)}" y1="${y}" x2="${r1(x0 + (n - 1) * SP)}" y2="${y}" stroke="${col}" stroke-width="3"/>`;
    const ph = (px, side) => `<line x1="${r1(px)}" y1="${y}" x2="${r1(px + side * 13)}" y2="${y}" stroke="${PHS}" stroke-width="2"/><circle cx="${r1(px + side * 17)}" cy="${y}" r="5.5" fill="${PH}" stroke="${PHS}" stroke-width="1.4"/>`;
    if (o.p === "end" || o.p === "both") s += ph(x0 + (n - 1) * SP, 1);
    if (o.p === "start" || o.p === "both") s += ph(x0, -1);
    for (let i = 0; i < n; i++) s += `<circle cx="${r1(x0 + i * SP)}" cy="${y}" r="7" fill="${CARB}" stroke="${col}" stroke-width="2"/>`;
    return s;
  }
  const key = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="${CARB}"/>` + T(x + 13, y + 5, "carbon atom", { s: 14, a: "start" }) + `<circle cx="${x}" cy="${y + 22}" r="5.5" fill="${PH}" stroke="${PHS}" stroke-width="1.4"/>` + T(x + 13, y + 27, "phosphate group", { s: 14, a: "start" });

  // ===================================== Glycolysis Explorer drawing =====================================
  // step 0..4 (B.glycoModel.STEPS). Rows up to the current step are drawn in full, the current row is highlighted and
  // later rows are faded, so the student sees the whole pathway and where they are in it.
  function glycolysis(step) {
    uid(); const st = Math.max(0, Math.min(4, step | 0));
    const row = (k, inner) => `<g data-row="${k}"${k > st ? ' opacity="0.16"' : ""}>${inner}</g>`;
    const hl = (k, x, y, w, h) => (k === st ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${SELF}" stroke="${SEL}" stroke-width="2"/>` : "");
    const arr = (k, x1, y1, x2, y2) => P(`M${x1} ${y1} L${x2} ${y2}`, { c: k <= st ? INK : FADE, w: 2.4, m: "ink" });
    let s = defs([["ink", INK]]);
    s += `<rect x="6" y="6" width="628" height="436" rx="14" fill="${CYTO}" stroke="${CYTOS}" stroke-width="1.5"/>` + T(20, 32, "CYTOPLASM", { s: 15, w: 800, a: "start", c: "#3a4f66" });
    s += key(480, 18);
    // highlights first (behind everything)
    s += hl(0, 200, 52, 300, 36) + hl(1, 200, 127, 300, 36) + hl(2, 150, 200, 400, 36) + hl(3, 70, 282, 500, 54) + hl(4, 70, 388, 500, 50);
    // row 0: glucose
    s += row(0, chain(300, 70, 6, GLU) + T(364, 75, "glucose (6C)", { s: 15, w: 700, a: "start", c: GLU }));
    // step 1: phosphorylation using ATP
    s += row(1, arr(1, 300, 84, 300, 126) + T(288, 110, "ATP → ADP", { s: 14, w: 700, c: ATPC, a: "end" }) + T(312, 110, "phosphorylation", { s: 14, c: GREY, a: "start" }) +
      chain(300, 145, 6, GLU, { p: "end" }) + T(382, 150, "glucose phosphate (6C)", { s: 15, w: 700, a: "start", c: GLU }));
    // step 2: second phosphorylation (supporting)
    s += row(2, arr(2, 300, 159, 300, 200) + T(288, 184, "ATP → ADP", { s: 14, w: 700, c: ATPC, a: "end" }) + T(312, 184, "second phosphorylation (supporting)", { s: 14, c: GREY, a: "start" }) +
      chain(300, 218, 6, GLU, { p: "both" }) + T(382, 223, "hexose bisphosphate (6C)", { s: 15, w: 700, a: "start", c: GLU }));
    // step 3: splitting into two triose phosphate
    s += row(3, arr(3, 286, 232, 214, 286) + arr(3, 314, 232, 426, 286) + T(300, 270, "splits", { s: 14, c: GREY }) +
      chain(190, 300, 3, TPC, { p: "end" }) + chain(430, 300, 3, TPC, { p: "end" }) +
      T(198, 327, "triose phosphate (3C)", { s: 14, w: 700, c: TPC }) + T(438, 327, "triose phosphate (3C)", { s: 14, w: 700, c: TPC }));
    // step 4: oxidation of each triose phosphate to pyruvate
    s += row(4, arr(4, 190, 336, 190, 388) + arr(4, 430, 336, 430, 388) + T(310, 366, "oxidation", { s: 14, c: GREY }) +
      T(178, 357, "NAD → reduced NAD", { s: 14, w: 700, c: NADC, a: "end" }) + T(178, 377, "2 ADP → 2 ATP", { s: 14, w: 700, c: ATPC, a: "end" }) +
      T(442, 357, "NAD → reduced NAD", { s: 14, w: 700, c: NADC, a: "start" }) + T(442, 377, "2 ADP → 2 ATP", { s: 14, w: 700, c: ATPC, a: "start" }) +
      chain(190, 405, 3, PYR) + chain(430, 405, 3, PYR) + T(190, 431, "pyruvate (3C)", { s: 14, w: 700, c: PYR }) + T(430, 431, "pyruvate (3C)", { s: 14, w: 700, c: PYR }));
    const M = B.glycoModel.state(st);
    return svg(640, 448, `Glycolysis in the cytoplasm, per glucose, at step ${st} of 4: ${B.glycoModel.STEPS[st].title}. So far ${M.invested} ATP used, ${M.produced} ATP made, ${M.nadh} reduced NAD formed; carbon atoms: ${M.carbon}`, s);
  }

  // ===================================== Static figure: where glycolysis fits (3.3.3.1) =====================================
  function context() {
    uid(); let s = defs([["ink", INK], ["ox", NADO], ["an", LAC]]);
    s += `<rect x="40" y="14" width="560" height="262" rx="40" fill="${CYTO}" stroke="${CYTOS}" stroke-width="2"/>` + T(60, 44, "CYTOPLASM", { s: 15, w: 800, a: "start", c: "#3a4f66" });
    s += T(22, 118, "glucose", { s: 15, w: 700, a: "start", c: GLU }) + P("M58 128 L90 146", { w: 2.4, m: "ink" });
    s += `<rect x="94" y="122" width="180" height="56" rx="12" fill="${WHITE}" stroke="${GLU}" stroke-width="2.4"/>` + T(184, 147, "glycolysis", { s: 16, w: 800, c: GLU }) + T(184, 167, "net 2 ATP, 2 reduced NAD", { s: 13, c: GREY });
    s += P("M274 150 L300 150", { w: 2.4, m: "ink" }) + T(350, 146, "2 pyruvate", { s: 15, w: 700, c: PYR }) + T(350, 164, "(3C each)", { s: 13, c: GREY });
    // aerobic: into a mitochondrion
    s += `<ellipse cx="512" cy="84" rx="74" ry="40" fill="#fdf1e4" stroke="${TPC}" stroke-width="2.2"/>` + T(512, 80, "mitochondrion", { s: 14, w: 700, c: TPC }) + T(512, 98, "(3.3.3.3)", { s: 13, c: GREY });
    s += P("M398 132 C414 110 420 96 434 90", { c: NADO, w: 2.6, m: "ox" }) + T(404, 72, "oxygen available:", { s: 13, w: 700, c: NADO, a: "end" }) + T(404, 89, "aerobic respiration", { s: 13, c: NADO, a: "end" });
    // anaerobic: stays in the cytoplasm
    s += `<rect x="440" y="186" width="148" height="64" rx="12" fill="${WHITE}" stroke="${LAC}" stroke-width="2.2"/>` + T(514, 208, "lactate, or", { s: 14, w: 700, c: LAC }) + T(514, 226, "ethanol + CO₂", { s: 14, w: 700, c: LAC }) + T(514, 243, "(3.3.3.2)", { s: 13, c: GREY });
    s += P("M398 170 C414 196 420 212 434 216", { c: LAC, w: 2.6, m: "an" }) + T(404, 232, "no oxygen:", { s: 13, w: 700, c: LAC, a: "end" }) + T(404, 249, "anaerobic respiration", { s: 13, c: LAC, a: "end" });
    return svg(640, 290, "Glucose enters the cytoplasm, where glycolysis converts it to two molecules of pyruvate (3 carbon atoms each) with a net gain of 2 ATP and 2 reduced NAD. If oxygen is available, pyruvate enters a mitochondrion for aerobic respiration. If there is no oxygen, pyruvate stays in the cytoplasm and is converted to lactate, or to ethanol and carbon dioxide, in anaerobic respiration.", s);
  }

  // ===================================== Static figure: the two anaerobic pathways (3.3.3.2) =====================================
  function pathways() {
    uid(); let s = defs([["ink", INK], ["co", CO2C]]);
    const panel = (x, title, sub) => `<rect x="${x}" y="8" width="312" height="280" rx="14" fill="${CYTO}" stroke="${CYTOS}" stroke-width="1.5"/>` + T(x + 16, 34, title, { s: 16, w: 800, a: "start" }) + T(x + 16, 54, sub, { s: 13, c: GREY, a: "start" });
    s += panel(8, "Lactate pathway", "animal cells, some bacteria") + panel(328, "Ethanol pathway", "yeast, plant cells");
    // lactate
    s += chain(70, 96, 3, PYR) + T(110, 101, "pyruvate (3C)", { s: 15, w: 700, c: PYR, a: "start" });
    s += P("M70 112 L70 162", { w: 2.4, m: "ink" }) + T(84, 136, "reduced NAD → NAD", { s: 14, w: 700, c: NADC, a: "start" }) + T(84, 154, "pyruvate is reduced", { s: 13, c: GREY, a: "start" });
    s += chain(70, 180, 3, LAC) + T(110, 185, "lactate (3C)", { s: 15, w: 700, c: LAC, a: "start" });
    s += T(24, 228, "No carbon dioxide is released.", { s: 13, c: GREY, a: "start" }) + T(24, 246, "Per glucose: 2 lactate.", { s: 13, c: GREY, a: "start" });
    // ethanol
    s += chain(390, 96, 3, PYR) + T(430, 101, "pyruvate (3C)", { s: 15, w: 700, c: PYR, a: "start" });
    s += P("M390 112 L390 152", { w: 2.4, m: "ink" }) + P("M394 128 C410 140 424 144 448 144", { c: CO2C, w: 2.2, m: "co" }) + `<circle cx="466" cy="144" r="7" fill="${CARB}" stroke="${CO2C}" stroke-width="2"/>` + T(480, 149, "CO₂ (1C)", { s: 14, w: 700, c: CO2C, a: "start" });
    s += chain(390, 170, 2, ETH) + T(422, 175, "ethanal (2C) (supporting)", { s: 14, w: 700, c: ETH, a: "start" });
    s += P("M390 186 L390 226", { w: 2.4, m: "ink" }) + T(404, 210, "reduced NAD → NAD", { s: 14, w: 700, c: NADC, a: "start" });
    s += chain(390, 244, 2, ETH) + T(422, 249, "ethanol (2C)", { s: 15, w: 700, c: ETH, a: "start" });
    s += T(344, 276, "Per glucose: 2 ethanol and 2 CO₂.", { s: 13, c: GREY, a: "start" });
    return svg(648, 296, "Two pathways compared, each drawn with its carbon atoms. Lactate pathway, in animal cells and some bacteria: pyruvate (3 carbon atoms) is reduced by reduced NAD to lactate (3 carbon atoms), forming NAD; no carbon dioxide is released. Ethanol pathway, in yeast and plant cells: pyruvate (3 carbon atoms) loses carbon dioxide (1 carbon atom) to form ethanal (2 carbon atoms, supporting), which is reduced by reduced NAD to ethanol (2 carbon atoms), forming NAD.", s);
  }

  // ===================================== NAD regeneration model drawing (3.3.3.2) =====================================
  // st: B.fermentModel state; o.blocked: true when glycolysis could not run on the last tick.
  function ferment(st, o = {}) {
    uid(); const pw = st.pathway, none = pw === "none", Tn = B.fermentModel.T, red = Tn - st.nad;
    const fade = (on, col) => (on ? col : FADE);
    let s = defs([["ink", INK], ["nd", NADO], ["nr", NADC], ["at", ATPC], ["gr", "#9aa7b4"], ["pr", fade(!none, none ? FADE : (pw === "lactate" ? LAC : ETH))]]);
    s += `<rect x="6" y="6" width="648" height="368" rx="14" fill="${CYTO}" stroke="${CYTOS}" stroke-width="1.5"/>` + T(20, 364, "CYTOPLASM, no oxygen", { s: 15, w: 800, a: "start", c: "#3a4f66" });
    // glycolysis box
    const gStop = !!o.blocked;
    s += `<rect x="40" y="70" width="190" height="64" rx="12" fill="${WHITE}" stroke="${gStop ? LAC : GLU}" stroke-width="${gStop ? 3 : 2.4}"${gStop ? ' stroke-dasharray="7 5"' : ""}/>` + T(135, 96, "glycolysis", { s: 17, w: 800, c: GLU }) + T(135, 118, gStop ? "could not run: no NAD" : "glucose → 2 pyruvate", { s: 15, w: gStop ? 700 : 500, c: gStop ? LAC : GREY });
    s += P("M135 68 L135 56", { c: ATPC, w: 2.4, m: "at" }) + T(135, 46, `net ATP made: ${st.atp}`, { s: 15, w: 700, c: ATPC });
    // pyruvate pool
    s += P("M230 102 L276 102", { w: 2.4, m: "ink" }) + `<rect x="280" y="78" width="104" height="48" rx="10" fill="${WHITE}" stroke="${PYR}" stroke-width="2"/>` + T(332, 99, "pyruvate", { s: 15, w: 700, c: PYR }) + T(332, 118, String(st.pyr), { s: 15, w: 800, c: PYR });
    // pathway box
    const pcol = none ? GREY : pw === "lactate" ? LAC : ETH;
    s += P("M384 102 L426 102", { c: none ? FADE : INK, w: 2.4, m: none ? "gr" : "ink", d: none ? "5 5" : "" });
    s += `<rect x="430" y="70" width="200" height="64" rx="12" fill="${WHITE}" stroke="${pcol}" stroke-width="2.4"${none ? ' stroke-dasharray="7 5"' : ""}/>` + T(530, 96, none ? "no pathway" : pw === "lactate" ? "lactate pathway" : "ethanol pathway", { s: 17, w: 800, c: pcol }) + T(530, 118, none ? "(hypothetical)" : pw === "lactate" ? "pyruvate → lactate" : "pyruvate → ethanol + CO₂", { s: 15, c: GREY });
    // products above the pathway box
    const prod = pw === "ethanol" ? `ethanol: ${st.eth} · CO₂: ${st.co2}` : pw === "lactate" ? `lactate: ${st.lac} · CO₂: ${st.co2}` : "no products";
    s += P("M530 68 L530 56", { c: none ? FADE : pcol, w: 2.4, m: none ? "gr" : "pr" }) + T(530, 46, prod, { s: 15, w: 700, c: none ? GREY : pcol });
    // NAD bins
    const bin = (x, title, n, col, k) => { let g = `<g data-bin="${k}"><rect x="${x}" y="206" width="200" height="100" rx="12" fill="${WHITE}" stroke="${col}" stroke-width="2.2"/>` + T(x + 100, 228, `${title}: ${n}`, { s: 15, w: 800, c: col });
      for (let i = 0; i < Tn; i++) { const cx = x + 36 + (i % 5) * 32, cy = 254 + Math.floor(i / 5) * 32; g += i < n ? `<circle cx="${cx}" cy="${cy}" r="12" fill="${col}" stroke="${WHITE}" stroke-width="2"/>` : `<circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="${FADE}" stroke-width="1.5" stroke-dasharray="3 3"/>`; }
      return g + "</g>"; };
    s += bin(36, "NAD", st.nad, NADO, "nad") + bin(430, "reduced NAD", red, NADC, "nadh");
    // NAD goes into glycolysis; reduced NAD comes out
    s += P("M135 204 L135 138", { c: NADO, w: 2.6, m: "nd" }) + T(124, 176, "NAD in", { s: 15, w: 700, c: NADO, a: "end" });
    s += P("M200 136 L200 164 L490 164 L490 202", { c: NADC, w: 2.6, m: "nr" }) + T(345, 158, "reduced NAD out", { s: 15, w: 700, c: NADC });
    // reduced NAD used by the pathway; NAD returned
    s += P("M590 204 L590 138", { c: none ? FADE : NADC, w: 2.6, m: none ? "gr" : "nr", d: none ? "5 5" : "" }) + T(602, 176, "used", { s: 15, w: 700, c: none ? GREY : NADC, a: "start" });
    s += P("M630 118 L644 118 L644 340 L100 340 L100 310", { c: none ? FADE : NADO, w: 2.6, m: none ? "gr" : "nd", d: none ? "5 5" : "" }) + T(400, 362, none ? "NAD cannot be regenerated" : "NAD regenerated", { s: 15, w: 700, c: none ? GREY : NADO });
    return svg(660, 380, `Model cell with no oxygen. Pathway: ${none ? "none (hypothetical)" : pw}. NAD ${st.nad} of ${Tn}, reduced NAD ${red}; pyruvate ${st.pyr}; glucose used ${st.glucose}; net ATP ${st.atp}; lactate ${st.lac}; ethanol ${st.eth}; carbon dioxide ${st.co2}.${gStop ? " Glycolysis could not run because there is no NAD." : ""}`, s);
  }

  B.respArt = { glycolysis, context, pathways, ferment, chain, COLORS: { GLU, TPC, PYR, LAC, ETH, NADC, NADO, ATPC } };

  // ===================================== B.glycoModel =====================================
  // Five stages, cumulative, per one glucose. Carbon atoms: glucose and its phosphates 6, triose phosphate 3, pyruvate 3.
  const STEPS = [
    { title: "Start: glucose in the cytoplasm", text: "One molecule of glucose (6 carbon atoms) has entered the cytoplasm. Glycolysis happens here, in the cytoplasm, and does not need oxygen.", invested: 0, produced: 0, nadh: 0, mols: [["glucose", 1, 6]] },
    { title: "1. Phosphorylation using ATP", text: "Glucose is phosphorylated: a phosphate group from ATP is added, forming glucose phosphate. ATP is hydrolysed to ADP. Adding phosphate makes the sugar more reactive.", invested: 1, produced: 0, nadh: 0, mols: [["glucose phosphate", 1, 6]] },
    { title: "2. A second phosphorylation (supporting)", text: "A second ATP adds another phosphate group, giving a six-carbon sugar with two phosphate groups (hexose bisphosphate). So two ATP are used for each glucose before any ATP is made.", invested: 2, produced: 0, nadh: 0, mols: [["hexose bisphosphate", 1, 6]] },
    { title: "3. Splitting into two triose phosphate", text: "The six-carbon sugar phosphate splits into two molecules of triose phosphate, each with three carbon atoms and one phosphate group. From here on everything happens twice for each glucose.", invested: 2, produced: 0, nadh: 0, mols: [["triose phosphate", 2, 3]] },
    { title: "4. Oxidation of triose phosphate to pyruvate", text: "Each triose phosphate is oxidised: hydrogen is removed and accepted by NAD, forming reduced NAD. Each is converted to pyruvate (3 carbon atoms), and two ATP are made from ADP and phosphate for each triose phosphate. Per glucose: 2 reduced NAD and 4 ATP, so a net gain of 2 ATP.", invested: 2, produced: 4, nadh: 2, mols: [["pyruvate", 2, 3]] },
  ];
  const state = (k) => { const S = STEPS[Math.max(0, Math.min(4, k | 0))]; return { invested: S.invested, produced: S.produced, net: S.produced - S.invested, nadh: S.nadh, co2: 0, carbon: S.mols.reduce((a, [, n, c]) => a + n * c, 0), mols: S.mols }; };
  const run = (n) => { n = Math.max(0, Math.floor(+n || 0)); const s = state(4); return { invested: s.invested * n, produced: s.produced * n, net: s.net * n, nadh: s.nadh * n, pyruvate: 2 * n, co2: 0 }; };
  function gValidate() {
    const e = []; const eq = (a, b, m) => { if (a !== b) e.push(`${m}: got ${a}, expected ${b}`); };
    const want = [[0, 0, 0, 0], [1, 0, -1, 0], [2, 0, -2, 0], [2, 0, -2, 0], [2, 4, 2, 2]]; // G1 to G5
    want.forEach(([i, p, n, h], k) => { const s = state(k); eq(s.invested, i, `G${k + 1} invested`); eq(s.produced, p, `G${k + 1} produced`); eq(s.net, n, `G${k + 1} net`); eq(s.nadh, h, `G${k + 1} reduced NAD`); eq(s.carbon, 6, `G${k + 1} carbon`); eq(s.co2, 0, `G${k + 1} CO2`); });
    eq(state(3).mols[0][1], 2, "G4 two triose phosphate");
    const r50 = run(50); eq(r50.invested, 100, "G6 invested"); eq(r50.produced, 200, "G6 produced"); eq(r50.net, 100, "G6 net"); eq(r50.nadh, 100, "G6 reduced NAD"); eq(r50.pyruvate, 100, "G6 pyruvate");
    const r0 = run(0); eq(r0.invested + r0.produced + r0.net + r0.nadh + r0.pyruvate, 0, "G7 run(0)");
    return e;
  }
  B.glycoModel = { STEPS, state, run, validate: gValidate };

  // ===================================== B.fermentModel =====================================
  // Simplified model: a cell with no oxygen and a tiny fixed pool of NAD (T = 10 units). One tick offers one glucose.
  // 1. Glycolysis: if NAD >= 2: glucose +1, NAD -2, net ATP +2 (B.glycoModel.run(1).net), pyruvate +2; else it cannot run.
  // 2. Regeneration (lactate or ethanol pathway): k = min(pyruvate, reduced NAD); pyruvate -k, NAD +k; lactate +k, or
  //    ethanol +k and CO2 +k. ATP never changes in this step.
  // Invariants: 0 <= NAD <= T; carbon 6g = 3p + 3L + 2E + C; ATP = 2g; C = E (CO2 only ever comes with ethanol).
  // Switching: from "none" to a pathway keeps the state (so a stuck cell can recover); any other switch resets.
  const NT = 10, MAXT = 200;
  const create = (pathway = "none") => ({ pathway, nad: NT, glucose: 0, atp: 0, pyr: 0, lac: 0, eth: 0, co2: 0, ticks: 0 });
  function tick(s0) {
    const s = { ...s0 }; let ran = false, regen = 0; if (s.ticks >= MAXT) return { state: s, ran, regen, limit: true };
    s.ticks++;
    if (s.nad >= 2) { const g = B.glycoModel.run(1); s.glucose++; s.nad -= g.nadh; s.atp += g.net; s.pyr += g.pyruvate; ran = true; }
    if (s.pathway !== "none") regen = regenerate(s);
    return { state: s, ran, regen, limit: false };
  }
  const ticks = (s, n) => { let st = s; for (let i = 0; i < n; i++) st = tick(st).state; return st; };
  // switching a cell from "none" to a pathway keeps its state and runs the regeneration half at once (review RD-09)
  const regenerate = (s) => { const k = Math.min(s.pyr, NT - s.nad); s.pyr -= k; s.nad += k; if (s.pathway === "lactate") s.lac += k; else if (s.pathway === "ethanol") { s.eth += k; s.co2 += k; } return k; };
  const setPathway = (s, p) => { if (s.pathway === "none" && p !== "none") { const st = { ...s, pathway: p }; const k = regenerate(st); return { state: st, reset: false, regen: k }; } return { state: create(p), reset: s.pathway !== p || s.ticks > 0, regen: 0 }; };
  const check = (s) => { const e = []; if (s.nad < 0 || s.nad > NT) e.push("NAD out of range"); if (6 * s.glucose !== 3 * s.pyr + 3 * s.lac + 2 * s.eth + s.co2) e.push("carbon not conserved"); if (s.atp !== 2 * s.glucose) e.push("ATP is not 2 per glucose"); if (s.co2 !== s.eth) e.push("CO2 not equal to ethanol"); return e; };
  // per glucose (for the challenge); ATP from the glycolysis model, so there is one source
  const yields = (p) => { const atp = B.glycoModel.run(1).net; return p === "lactate" ? { lactate: 2, ethanol: 0, co2: 0, atp } : { lactate: 0, ethanol: 2, co2: 2, atp }; };
  // Anaerobic Respiration Challenge (A1 to A6 in A1-MODEL.md). ask: "co2,atp" or "glucose,co2,atp". n = glucose used.
  const CHALLENGE = [
    { id: "A1", text: "A leg muscle cell of a sprinter respires 6 molecules of glucose anaerobically, without oxygen.", pathway: "lactate", n: 6 },
    { id: "A2", text: "A yeast cell respiring anaerobically in bread dough uses 4 molecules of glucose.", pathway: "ethanol", n: 4 },
    { id: "A3", text: "A root cell respiring anaerobically in waterlogged soil uses 5 molecules of glucose.", pathway: "ethanol", n: 5 },
    { id: "A4", text: "A Lactobacillus bacterium making yoghurt respires 3 molecules of glucose anaerobically.", pathway: "lactate", n: 3 },
    { id: "A5", text: "A mammalian red blood cell, which has no mitochondria, respires 10 molecules of glucose anaerobically.", pathway: "lactate", n: 10 },
    { id: "A6", stretch: true, text: "A muscle cell respiring without oxygen has made 8 molecules of lactate. Work backwards.", pathway: "lactate", n: 4, askGlucose: true },
  ];
  const expected = (c) => { const y = yields(c.pathway); return { pathway: c.pathway, glucose: c.n, co2: y.co2 * c.n, atp: y.atp * c.n, lactate: y.lactate * c.n, ethanol: y.ethanol * c.n }; };
  function fValidate() {
    const e = []; const eq = (a, b, m) => { if (a !== b) e.push(`${m}: got ${a}, expected ${b}`); };
    const all = (s, m) => check(s).forEach((x) => e.push(`${m}: ${x}`));
    let s = ticks(create("none"), 3); all(s, "F1"); eq(s.glucose, 3, "F1 glucose"); eq(s.atp, 6, "F1 ATP"); eq(s.nad, 4, "F1 NAD"); eq(s.pyr, 6, "F1 pyruvate");
    s = ticks(create("none"), 8); all(s, "F2"); eq(s.glucose, 5, "F2 glucose"); eq(s.atp, 10, "F2 ATP"); eq(s.nad, 0, "F2 NAD"); eq(s.pyr, 10, "F2 pyruvate"); eq(tick(s).ran, false, "F2 blocked");
    s = ticks(create("lactate"), 8); all(s, "F3"); eq(s.glucose, 8, "F3 glucose"); eq(s.atp, 16, "F3 ATP"); eq(s.lac, 16, "F3 lactate"); eq(s.co2, 0, "F3 CO2"); eq(s.nad, 10, "F3 NAD"); eq(s.pyr, 0, "F3 pyruvate");
    s = ticks(create("ethanol"), 8); all(s, "F4"); eq(s.atp, 16, "F4 ATP"); eq(s.eth, 16, "F4 ethanol"); eq(s.co2, 16, "F4 CO2"); eq(s.nad, 10, "F4 NAD"); eq(s.pyr, 0, "F4 pyruvate");
    s = ticks(create("none"), 5); const sw5 = setPathway(s, "lactate"); eq(sw5.reset, false, "F5 state kept"); eq(sw5.regen, 10, "F5 switching regenerates 10 at once"); s = sw5.state; all(s, "F5");
    eq(s.glucose, 5, "F5 glucose"); eq(s.atp, 10, "F5 ATP"); eq(s.lac, 10, "F5 lactate"); eq(s.nad, 10, "F5 NAD"); eq(s.pyr, 0, "F5 pyruvate"); const t6 = tick(s); eq(t6.ran, true, "F5 next glucose respires"); s = t6.state; eq(s.glucose, 6, "F5 next glucose"); eq(s.atp, 12, "F5 next ATP"); eq(s.lac, 12, "F5 next lactate");
    s = ticks(create("ethanol"), 20); all(s, "F6"); eq(s.atp, 40, "F6 ATP"); eq(s.eth, 40, "F6 ethanol"); eq(s.co2, 40, "F6 CO2"); eq(ticks(create("lactate"), 20).atp, 40, "F6 lactate ATP equal");
    s = ticks(create("ethanol"), 2); const sw = setPathway(s, "lactate"); eq(sw.reset, true, "F7 reset"); s = sw.state; eq(s.glucose + s.atp + s.eth + s.co2 + s.lac + s.pyr, 0, "F7 all zero"); eq(s.nad, 10, "F7 NAD"); eq(s.pathway, "lactate", "F7 pathway");
    s = ticks(create("lactate"), 250); eq(s.ticks, MAXT, "tick limit"); all(s, "limit");
    const want = { A1: [0, 12, 12, "lactate"], A2: [8, 8, 8, "ethanol"], A3: [10, 10, 10, "ethanol"], A4: [0, 6, 6, "lactate"], A5: [0, 20, 20, "lactate"], A6: [0, 8, 8, "lactate"] };
    CHALLENGE.forEach((c) => { const x = expected(c), w = want[c.id]; eq(x.co2, w[0], c.id + " CO2"); eq(x.atp, w[1], c.id + " ATP"); eq(x.lactate + x.ethanol, w[2], c.id + " product"); eq(x.pathway, w[3], c.id + " pathway"); if (!/anaerobically|without oxygen/.test(c.text)) e.push(c.id + " does not say anaerobic"); });
    eq(expected(CHALLENGE[5]).glucose, 4, "A6 glucose");
    return e;
  }
  B.fermentModel = { T: NT, MAXT, create, tick, ticks, setPathway, check, yields, CHALLENGE, expected, validate: fValidate };
})(window.BIO);
