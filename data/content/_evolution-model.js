// Evolution models for 3.3.8 (Phase 5 Batch 4, author C2). Specification and hand-worked test cases reviewed before
// building: scratchpad p5b4/C2-MODEL.md (review MR-C2). validate() re-checks every worked case; an empty list = pass.
//
// 1. selection: natural selection on one autosomal gene with two alleles, complete dominance (A dominant). Seeded
//    Wright-Fisher style simulation. Per generation: count p from the 2N allele copies (never from N); each individual
//    survives with the chance s of its phenotype (one draw each); survivors form a gamete pool weighted by f, the
//    relative number of offspring per survivor: p* = fD(2 nAA + nAa) / 2[fD(nAA + nAa) + fR naa]; N offspring each draw
//    two alleles independently (random mating, constant population size). No mutation, no migration, so p = 0 or 1 is
//    permanent. Relative fitness w = s × f. Expected (no-chance) line: p' = p wD / wbar, wbar = (1 − q²) wD + q² wR.
//    With equal fitness every change is genetic drift (chance), larger in small populations.
// 2. curves: a hypothetical histogram of beak depth (nine 1 mm classes, 8 to 16 mm, 200 birds) and survival in each
//    class for directional, stabilising and disruptive selection. After g generations frequency ∝ n × w^g (offspring
//    have the distribution of their surviving parents; no new variation). Mean and population standard deviation.
// 3. speciation: card sets with precedence rules (a partial order) so that every biologically valid order is accepted,
//    and the fertile-offspring test used at each stage of the Speciation Explorer.
window.BIO = window.BIO || {};
(function (B) {
  // mulberry32: small seeded generator, so every simulated run is repeatable
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---------------------------------------------------------------- 1. natural selection
  // presets: all values hypothetical (labelled on screen). dom/rec: phenotype names; A/a: allele symbols.
  const PRESETS = {
    sooty: { name: "Predation: moths, sooty trees", A: "C", a: "c", dom: "dark", rec: "pale", sD: 0.8, fD: 1, sR: 0.4, fR: 1, p0: 0.1, N: 100, pressure: "predation",
      say: "Birds hunt resting moths by sight. On dark bark, dark moths are harder to see." },
    clean: { name: "Predation: moths, clean trees", A: "C", a: "c", dom: "dark", rec: "pale", sD: 0.4, fD: 1, sR: 0.8, fR: 1, p0: 0.8, N: 100, pressure: "predation",
      say: "On pale, lichen-covered bark, pale moths are harder for birds to see." },
    disease: { name: "Disease present (plants)", A: "R", a: "r", dom: "resistant", rec: "susceptible", sD: 0.9, fD: 0.8, sR: 0.3, fR: 1, p0: 0.1, N: 100, pressure: "disease",
      say: "A fungus kills most susceptible plants. Resistant plants survive but make fewer seeds." },
    nodisease: { name: "Disease absent (plants)", A: "R", a: "r", dom: "resistant", rec: "susceptible", sD: 0.9, fD: 0.8, sR: 0.9, fR: 1, p0: 0.5, N: 100, pressure: "none",
      say: "No fungus this time. Both kinds survive equally well, but resistant plants still make fewer seeds." },
    compete: { name: "Competition: beetles, scarce food", A: "J", a: "j", dom: "large jaws", rec: "small jaws", sD: 0.7, fD: 1, sR: 0.5, fR: 0.7, p0: 0.2, N: 100, pressure: "competition",
      say: "Beetles with larger jaws get more of the scarce food, so they survive better and lay more eggs." },
    neutral: { name: "No selection (chance only)", A: "B", a: "b", dom: "brown", rec: "grey", sD: 0.6, fD: 1, sR: 0.6, fR: 1, p0: 0.5, N: 20, pressure: "none",
      say: "Brown and grey beetles have the same chance of surviving and the same number of offspring." },
  };
  const wbar = (p, wD, wR) => { const q = 1 - p; return (1 - q * q) * wD + q * q * wR; };
  const next = (p, wD, wR) => (p <= 0 ? 0 : p >= 1 ? 1 : (p * wD) / wbar(p, wD, wR));
  const expected = (p0, G, wD, wR) => { const out = [p0]; let p = p0; for (let t = 0; t < G; t++) { p = next(p, wD, wR); out.push(p); } return out; };
  const alleleFreq = (nAA, nAa, naa) => (2 * nAA + nAa) / (2 * (nAA + nAa + naa));
  // one simulated run. genotype codes: 2 = AA, 1 = Aa, 0 = aa (number of A copies)
  function run(o) {
    const r = rng(o.seed), N = o.N, G = o.G; const p = [], ph = []; let died = null, last = null;
    let pop = new Array(N); for (let i = 0; i < N; i++) pop[i] = (r() < o.p0 ? 1 : 0) + (r() < o.p0 ? 1 : 0);
    for (let t = 0; t <= G; t++) {
      let a = 0, dom = 0; for (const g of pop) { a += g; if (g > 0) dom++; } p.push(a / (2 * N)); ph.push(dom / N);
      if (t === G) break;
      let nAA = 0, nAa = 0, naa = 0; const surv = new Array(N);
      for (let i = 0; i < N; i++) { const g = pop[i]; const s = g > 0 ? o.sD : o.sR; surv[i] = r() < s; if (surv[i]) { if (g === 2) nAA++; else if (g === 1) nAa++; else naa++; } }
      last = { geno: pop.slice(0, 100), surv: surv.slice(0, 100), gen: t };
      if (nAA + nAa + naa === 0) { died = t; break; }
      const ps = (o.fD * (2 * nAA + nAa)) / (2 * (o.fD * (nAA + nAa) + o.fR * naa));
      const nx = new Array(N); for (let i = 0; i < N; i++) nx[i] = (r() < ps ? 1 : 0) + (r() < ps ? 1 : 0); pop = nx;
    }
    return { p, ph, died, last };
  }
  const runs = (o, seeds) => seeds.map((seed) => run(Object.assign({}, o, { seed })));

  // ---------------------------------------------------------------- 2. selection curves
  const CLASSES = [8, 9, 10, 11, 12, 13, 14, 15, 16];
  const BEFORE = [2, 8, 22, 40, 56, 40, 22, 8, 2];
  const W = {
    directional: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
    stabilising: [0.1, 0.2, 0.4, 0.7, 0.9, 0.7, 0.4, 0.2, 0.1],
    disruptive: [0.9, 0.8, 0.6, 0.3, 0.1, 0.3, 0.6, 0.8, 0.9],
  };
  const stats = (n) => { const S = n.reduce((a, b) => a + b, 0); const mean = n.reduce((a, b, i) => a + b * CLASSES[i], 0) / S; const v = n.reduce((a, b, i) => a + b * (CLASSES[i] - mean) ** 2, 0) / S; return { total: S, mean, sd: Math.sqrt(v), pct: n.map((x) => (100 * x) / S) }; };
  const after = (mode, g) => BEFORE.map((n, i) => n * W[mode][i] ** g);
  const curves = { CLASSES, BEFORE, W, stats, after, survivedPct: (mode) => (100 * after(mode, 1).reduce((a, b) => a + b, 0)) / 200 };

  // ---------------------------------------------------------------- 3. speciation
  // rules [x, y]: card x must come before card y. Distractors must be left out.
  const TASKS = {
    A: { title: "Lizards on two islands", kind: "allopatric", intro: "Hypothetical example. Build the sequence by which one population of lizards could become two species.",
      cards: { A1: "One population of lizards lives on a single large island; all can interbreed.", A2: "Sea level rises and splits the island into two.", A3: "There is no gene flow between the two populations.", A4: "New mutations arise independently in each population.", A5: "Different selection pressures on the two islands favour different alleles.", A6: "Over many generations, the allele frequencies of the two gene pools become very different.", A7: "Lizards from the two islands can no longer interbreed to produce fertile offspring.",
        X1: "The lizards change their alleles so that they become adapted to their island.", X2: "As soon as the island splits, the two populations are different species." },
      distractors: { X1: "Individuals cannot change their alleles to suit their surroundings: mutations arise by chance, and selection changes allele frequencies over generations.", X2: "Separation alone is not speciation: separated lizards could still interbreed to produce fertile offspring." },
      rules: [["A1", "A2", "The population must exist before it is split."], ["A2", "A3", "Gene flow stops because the island splits."], ["A3", "A4", "Mutations arise independently only once the populations are separated."], ["A3", "A5", "Different selection pressures act separately only once the populations are separated."], ["A4", "A6", "Gene pools become different as a result of mutation and selection, so this comes after them."], ["A5", "A6", "Gene pools become different as a result of mutation and selection, so this comes after them."], ["A6", "A7", "Members can no longer interbreed only after genetic differences have built up."]] },
    B: { title: "Fish in one lake", kind: "sympatric", intro: "Hypothetical example. Build the sequence by which one population of fish could become two species without being separated by a barrier.",
      cards: { B1: "One population of fish lives in a lake; all interbreed.", B2: "Some fish begin to feed and breed on the lake bottom, others in open water.", B3: "Fish mate mostly with fish from the same part of the lake.", B4: "Gene flow between the two groups is reduced, although they live in the same lake.", B5: "Different selection pressures in the two habitats favour different alleles.", B6: "The groups can no longer interbreed to produce fertile offspring.",
        Y1: "A landslide divides the lake into two separate lakes.", Y2: "Bottom-feeding fish develop bigger mouths because they use them more, and pass this on." },
      distractors: { Y1: "A barrier that separates the fish would make this allopatric, not sympatric, speciation.", Y2: "Characteristics acquired by use are not inherited; only alleles are passed on." },
      rules: [["B1", "B2", "The population must exist before some fish change their habits."], ["B2", "B3", "Fish can only mate mostly within a group once the groups exist."], ["B3", "B4", "Gene flow is reduced because mating is mostly within each group."], ["B2", "B5", "Different selection pressures act only once the fish use different habitats."], ["B4", "B6", "The groups cannot become separate species while genes still flow freely between them."], ["B5", "B6", "Genetic differences must build up before the groups can no longer interbreed."]] },
  };
  // returns { ok, broken: [reason], wrongIn: [distractor ids], missing: [ids] }
  function check(taskId, order) {
    const T = TASKS[taskId]; const real = Object.keys(T.cards).filter((k) => !T.distractors[k]);
    const wrongIn = order.filter((k) => T.distractors[k]); const missing = real.filter((k) => !order.includes(k));
    const pos = (k) => order.indexOf(k); const broken = [];
    for (const [x, y, why] of T.rules) if (pos(x) >= 0 && pos(y) >= 0 && pos(x) > pos(y)) broken.push(why);
    return { ok: !wrongIn.length && !missing.length && !broken.length, broken, wrongIn, missing };
  }
  const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  const countValid = (taskId) => { const T = TASKS[taskId]; const real = Object.keys(T.cards).filter((k) => !T.distractors[k]); return perms(real).filter((o) => check(taskId, o).ok).length; };
  // Speciation Explorer stages. test: would members of the two groups mate, produce offspring, and fertile offspring?
  const T3 = (mate, off, fert) => ({ mate, off, fert, one: mate && off && fert });
  const EXPLORER = {
    allo: { title: "Allopatric: ground beetles and a river", source: "Hypothetical example.", stages: [
      { k: "E0", head: "One population", text: "Ground beetles live on a wide plain. All of them can interbreed, so they share one gene pool.", test: T3(true, true, true) },
      { k: "E1", head: "A geographical barrier", text: "The river changes course and splits the population in two. The beetles cannot cross it, so the two populations are reproductively separated: there is no gene flow between them.", test: T3(true, true, true) },
      { k: "E2", head: "The gene pools change separately", text: "Over many generations different mutations arise on each side. The west bank is dry and sandy, the east bank damp, so different selection pressures favour different alleles. Chance (genetic drift) also changes allele frequencies, most strongly if a population is small. The allele frequencies of the two gene pools become more and more different.", test: T3(true, true, true) },
      { k: "E3", head: "The populations meet again", text: "Much later the river dries up and the beetles meet. Genetic differences now mean that the western beetles breed in spring and the eastern beetles in autumn, so they do not interbreed.", test: T3(false, false, false) },
    ] },
    sym: { title: "Sympatric: the apple maggot fly", source: "Real example (Bush, 1969; later work summarised by NSTA).", stages: [
      { k: "Y0", head: "One population", text: "In North America the flies laid their eggs in hawthorn fruit. Adults mate on the fruit, and the larvae grow inside it. All the flies shared one gene pool.", test: T3(true, true, true) },
      { k: "Y1", head: "A new host in the same area", text: "In 1864, in the Hudson River Valley, New York, flies were first recorded laying eggs in apples, which had been brought to the area. There was no geographical barrier: apple and hawthorn trees grow side by side.", test: T3(true, true, true) },
      { k: "Y2", head: "Mating mostly within each group", text: "Flies tend to mate on the kind of fruit they grew up in, and apples ripen about a month earlier than hawthorn fruit, so apple flies breed earlier. Most mating is within each group, so gene flow between them is reduced (hybrids make up about 4 to 6 %). Different selection pressures, such as the timing of development, change the allele frequencies of the two groups.", test: T3(true, true, true) },
      { k: "Y3", head: "Today: speciation in progress?", text: "The apple and hawthorn flies are two host races living in the same area. They can still interbreed and produce fertile offspring, so they are still one species. If genetic differences grow until they can no longer do this, they will be two species.", test: T3(true, true, true) },
    ] },
  };
  const speciation = { TASKS, check, countValid, EXPLORER };

  // ---------------------------------------------------------------- validate(): hand-worked cases from C2-MODEL.md
  function validate() {
    const f = []; const near = (a, b, t, msg) => { if (!(Math.abs(a - b) <= t)) f.push(`${msg}: got ${a}, expected ${b}`); };
    // Model 1 deterministic
    near(wbar(0.5, 1, 0.5), 0.875, 1e-9, "T1 wbar"); near(next(0.5, 1, 0.5), 4 / 7, 1e-9, "T1 p'");
    near(next(4 / 7, 1, 0.5), 28 / 44.5, 1e-9, "T2 p''"); near(expected(0.5, 2, 1, 0.5)[2], 0.6292, 1e-4, "T2 expected line");
    near(wbar(0.9, 0.8, 1), 0.802, 1e-9, "T3 wbar"); near(next(0.9, 0.8, 1), 0.8978, 1e-4, "T3 p'"); near(1 - next(0.9, 0.8, 1), 0.1022, 1e-4, "T3 q'");
    near(next(0.5, 0.6 * 1, 0.9 * 0.5), 0.5333, 1e-4, "T4 survival is not everything");
    near(next(0.5, 0.9 * 0.8, 0.9 * 1), 8 / 17, 1e-9, "T5 disease absent");
    near(next(0.1, 0.9 * 0.8, 0.3 * 1), 0.1896, 1e-4, "T6 disease present");
    { const p1 = next(0.1, 0.8, 0.4); near(p1, 0.1681, 1e-4, "T7 sooty p'"); near(1 - (1 - p1) ** 2, 0.3079, 1e-4, "T7 dark phenotype"); }
    near(next(0.3, 0.6, 0.6), 0.3, 1e-12, "T8 neutral"); near(next(0.5, 0.5, 0.25), 4 / 7, 1e-9, "T8 scaling");
    if (next(0, 1, 0.1) !== 0 || next(1, 0.1, 1) !== 1) f.push("T9 fixation not absorbing (expected)");
    { const r = run({ N: 50, p0: 0, G: 10, sD: 1, fD: 1, sR: 0.2, fR: 1, seed: 3 }); if (r.p.some((x) => x !== 0)) f.push("T9 fixation not absorbing (simulated)"); }
    near(alleleFreq(30, 50, 20), 0.55, 1e-12, "T10 allele counting");
    { const o = { N: 20, p0: 0.5, G: 10, sD: 0.6, fD: 1, sR: 0.6, fR: 1 }; const a = run(Object.assign({ seed: 7 }, o)), b = run(Object.assign({ seed: 7 }, o));
      if (a.p.join() !== b.p.join()) f.push("T11 same seed gives a different run");
      if (new Set(runs(o, [1, 2, 3, 4, 5]).map((x) => x.p[10])).size < 2) f.push("T11 seeds 1 to 5 give identical runs"); }
    // T12 drift statistics (fixed seeds, so deterministic)
    const drift = (N, k, seed0) => { const v = []; for (let i = 0; i < k; i++) v.push(run({ N, p0: 0.5, G: 20, sD: 1, fD: 1, sR: 1, fR: 1, seed: seed0 + i }).p[20]); const m = v.reduce((a, b) => a + b, 0) / k; return { m, v: v.reduce((a, b) => a + (b - m) ** 2, 0) / k }; };
    { const d = drift(20, 500, 1000); near(d.m, 0.5, 0.07, "T12 mean N = 20"); near(d.v, 0.1031, 0.3 * 0.1031, "T12 variance N = 20"); }
    { const d = drift(1000, 200, 5000); near(d.m, 0.5, 0.015, "T12 mean N = 1000"); near(d.v, 0.00261, 0.3 * 0.00261, "T12 variance N = 1000"); }
    { let s = 0; for (let i = 0; i < 200; i++) s += run({ N: 1000, p0: 0.5, G: 1, sD: 1, fD: 1, sR: 0.5, fR: 1, seed: 9000 + i }).p[1]; near(s / 200, 4 / 7, 0.01, "T13 selection mean"); }
    // presets point the right way on the expected line
    for (const [k, P] of Object.entries(PRESETS)) { const e = expected(P.p0, 10, P.sD * P.fD, P.sR * P.fR); const d = e[10] - P.p0; const want = { sooty: 1, clean: -1, disease: 1, nodisease: -1, compete: 1, neutral: 0 }[k]; if (Math.sign(Math.round(d * 1e9)) !== want) f.push("preset direction " + k); }
    // Model 2
    const st0 = stats(BEFORE); near(st0.total, 200, 1e-9, "curves before total"); near(st0.mean, 12, 1e-9, "curves before mean"); near(st0.sd ** 2, 2.32, 1e-9, "curves before variance");
    const C = (mode, g, tot, mean, sd, msg) => { const s = stats(after(mode, g)); near(s.total, tot, 1e-6, msg + " total"); near(s.mean, mean, 0.005, msg + " mean"); if (sd != null) near(s.sd, sd, 0.005, msg + " SD"); return s; };
    C("directional", 1, 100, 12.464, 1.4508, "C1"); C("directional", 2, 54.64, 12.8492, null, "C2"); C("directional", 3, 31.96, 13.186, null, "C3");
    { const s = C("stabilising", 1, 127.6, 12, 1.1254, "C4"); near(s.pct[4], 39.498, 0.01, "C4 class 12 mm"); }
    C("stabilising", 2, 92.28, 12, 0.894, "C5");
    { const s = C("disruptive", 1, 72.4, 12, 2.0437, "C6"); if (!(s.pct[2] > s.pct[4] && s.pct[6] > s.pct[4])) f.push("C6 two peaks"); }
    { const s = C("disruptive", 2, 37.08, 12, 2.4055, "C7"); near(s.pct[2], 21.36, 0.01, "C7 peak"); near(s.pct[4], 1.51, 0.01, "C7 middle"); }
    near(curves.survivedPct("directional"), 50, 1e-9, "survivors directional"); near(curves.survivedPct("stabilising"), 63.8, 1e-9, "survivors stabilising"); near(curves.survivedPct("disruptive"), 36.2, 1e-9, "survivors disruptive");
    for (let g = 1; g <= 3; g++) { const d0 = stats(after("directional", g - 1)), d1 = stats(after("directional", g)); if (!(d1.mean > d0.mean)) f.push("C8 directional mean rises g" + g);
      const s0 = stats(after("stabilising", g - 1)), s1 = stats(after("stabilising", g)); if (!(s1.sd < s0.sd) || Math.abs(s1.mean - 12) > 1e-9) f.push("C8 stabilising g" + g);
      const r0 = stats(after("disruptive", g - 1)), r1 = stats(after("disruptive", g)); if (!(r1.sd > r0.sd) || Math.abs(r1.mean - 12) > 1e-9 || !(r1.pct[4] < r1.pct[3] && r1.pct[4] < r1.pct[5])) f.push("C8 disruptive g" + g); }
    // Model 3
    const ok = (t, o, want, msg) => { if (check(t, o).ok !== want) f.push(msg); };
    ok("A", ["A1", "A2", "A3", "A4", "A5", "A6", "A7"], true, "Q1"); ok("A", ["A1", "A2", "A3", "A5", "A4", "A6", "A7"], true, "Q2");
    ok("A", ["A1", "A2", "A3", "A4", "A5", "A7", "A6"], false, "Q3"); ok("A", ["A1", "A3", "A2", "A4", "A5", "A6", "A7"], false, "Q4");
    ok("A", ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "X1"], false, "Q5 X1"); ok("A", ["A1", "X2", "A2", "A3", "A4", "A5", "A6", "A7"], false, "Q5 X2");
    ok("B", ["B1", "B2", "B3", "B4", "B5", "B6"], true, "Q6 a"); ok("B", ["B1", "B2", "B3", "B5", "B4", "B6"], true, "Q6 b"); ok("B", ["B1", "B2", "B5", "B3", "B4", "B6"], true, "Q6 c");
    if (countValid("B") !== 3) f.push("Q6 count " + countValid("B")); if (countValid("A") !== 2) f.push("Q7 count " + countValid("A"));
    const one = (m) => EXPLORER[m].stages.map((s) => s.test.one).join();
    if (one("allo") !== "true,true,true,false") f.push("Q8 allopatric tests"); if (one("sym") !== "true,true,true,true") f.push("Q8 sympatric tests");
    return f;
  }

  B.evolutionModel = { rng, PRESETS, wbar, next, expected, alleleFreq, run, runs, curves, speciation, validate };
})(window.BIO);
