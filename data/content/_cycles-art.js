// Nutrient cycle and carbon cycle models and drawings for 3.3.5.1 Principles of nutrient cycling and 3.3.5.2 The carbon
// cycle (Phase 5 Batch 3, author B1). Specification and review: scratchpad p5b3/B1-MODEL.md (reviewed in MR-B1).
//
// B.cyclesModel
//   recycle     qualitative route model. Matter layers (carbon, nitrogen, phosphorus) are closed loops: pool -> oak ->
//               caterpillar (-> blue tit) -> dead matter -> decomposers -> pool. The energy layer is acyclic: Sun -> oak ->
//               caterpillar -> blue tit, every organism and the decomposers -> heat; nothing returns to the producer.
//   litter      litter-bag decomposition (hypothetical): M(t) = 100 e^(-k t) % of the initial dry mass, t in weeks,
//               k = 0.040 x 2^((T - 15) / 10) x f; f = 1 (moist, aerated), 0.30 (dry), 0.25 (waterlogged); sterilised
//               leaves and soil (control): k = 0. Valid T 0 to 30 degrees C (refused outside). Single exponential decay
//               (Olson 1963); Q10 = 2 is an assumption; no denaturation modelled.
//   carbon      stores (GtC) and fluxes (GtC per year), approximate, with sources; 2023 human-caused budget from the
//               Global Carbon Budget 2024: atmosphere change = (10.1 + 1.0) - (2.9 + 2.3) = 5.9 GtC per year.
//   co2         genuine NOAA GML Mauna Loa data: monthly means Jan 2017 to Dec 2021 (all measured at Mauna Loa) with
//               NOAA's de-seasonalised values, and NOAA annual means 1960 to 2020 every 5 years plus 2023. Units ppm (mole
//               fraction in dry air). amplitude(y) = max - min of the 12 monthly means (used only in validate()).
//   greenhouse  schematic only: 8 infrared arrows leave the surface; absorbed 0 / 5 / 6 (none, 1750, 2019); each absorbed
//               arrow is re-emitted as two half-width arrows (one down, one up); escaping width = (8 - a) + a / 2.
//   climate     hypothetical data sets A (aphids), B (wheat in the field), C (growth chambers); Spearman's rank from
//               B.photoModel (ranks with ties averaged; critical value 0.648 for n = 10, P = 0.05; |rs| >= critical value
//               is significant).
//   answered(qid), LOCKS: answers that a model could print stay hidden until their question has been answered.
//   validate()  returns the failures of the hand-computed test cases in B1-MODEL.md ([] when all pass).
// Sources (checked 17 November 2026): NOAA GML Trends in Atmospheric CO2 (gml.noaa.gov/ccgg/trends/; monthly values from
// the public-domain mirror of co2_mm_mlo.txt in the datasets/co2-ppm package, checked against NOAA's annual means and its
// trends page); NOAA GML methane trends; IPCC AR6 WGI SPM A.1.1 and A.2.1; IPCC AR6 WGI Chapter 7 Table 7.15; Friedlingstein
// et al. (2025) Global Carbon Budget 2024, ESSD 17, 965 to 1039; IPCC AR6 WGI Figure 5.12 caption; Schmittner, Introduction
// to Climate Science (Oregon State), chapter "Carbon". Everything else is hypothetical.
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ answered / locks
  // a question counts as answered once it has full marks, a self-marked attempt, or two attempts (the answer is then shown)
  const answered = (qid) => { try { const a = B.store.get().attempts.filter((x) => x.qid === qid); return a.some((x) => x.score === x.max || x.mode === "self") || a.length >= 2; } catch (e) { return false; } };
  const LOCKS = { budget: "q-3.3.5.2-cc3", gh1750: "q-3.3.5.2-gh4", rsA: "q-3.3.5.2-cd1", rsB: "q-3.3.5.2-cd4" };

  // ------------------------------------------------------------------ 1. nutrient recycling routes
  const NODES = {
    sun: "the Sun", air: "the air", soil: "soil water", oak: "the oak tree", cat: "the caterpillar", tit: "the blue tit",
    dead: "dead matter and waste", dec: "the decomposers", heat: "heat lost to the surroundings",
  };
  const ELEMENTS = {
    C: { name: "Carbon", inorganic: "carbon dioxide", release: "carbon dioxide", organic: "every organic molecule: carbohydrates, lipids, proteins and nucleic acids", uptake: "photosynthesis", active: false, pool: "air" },
    N: { name: "Nitrogen", inorganic: "nitrate ions (and ammonium ions)", release: "ammonium ions", organic: "amino acids and proteins, nucleotides (DNA, RNA and ATP) and chlorophyll", uptake: "active transport", active: true, pool: "soil" },
    P: { name: "Phosphorus", inorganic: "phosphate ions", release: "phosphate ions", organic: "phospholipids and nucleotides (DNA, RNA and ATP)", uptake: "active transport", active: true, pool: "soil" },
  };
  // matter edges for one element: [from, to, process, caption]
  function matterEdges(el) {
    const E = ELEMENTS[el]; const pool = E.pool;
    const up = el === "C"
      ? "Photosynthesis. The oak takes in carbon dioxide through its stomata and fixes it into glucose, from which it makes all its other organic molecules."
      : `Uptake. Root hair cells absorb ${E.inorganic} from soil water by active transport. The oak incorporates ${el === "N" ? "the nitrogen into amino acids, proteins, nucleotides (DNA, RNA, ATP) and chlorophyll" : "the phosphate into phospholipids and nucleotides (DNA, RNA, ATP)"}.`;
    const eat = (who, food) => `Feeding. ${who} eats ${food}. Digestion hydrolyses the large, insoluble molecules into small, soluble ones that are absorbed. Assimilation: ${who.toLowerCase()} uses them to build its own ${el === "C" ? "organic molecules" : el === "N" ? "proteins and nucleic acids" : "phospholipids and nucleic acids"}.`;
    const edges = [
      [pool, "oak", el === "C" ? "photosynthesis" : "uptake by roots", up],
      ["oak", "cat", "feeding: digestion and assimilation", eat("The caterpillar", "oak leaves")],
      ["cat", "tit", "feeding: digestion and assimilation", eat("The blue tit", "caterpillars")],
      ["oak", "dead", "leaf fall and death", "Leaf fall and death. Dead leaves and wood still contain the element in organic molecules."],
      ["cat", "dead", el === "N" ? "faeces, urine, death" : "faeces and death", `Egestion and death. Food that was not digested leaves in faeces${el === "N" ? "; urea from the breakdown of absorbed amino acids leaves in urine" : ""}. Dead bodies join the dead matter.`],
      ["tit", "dead", el === "N" ? "faeces, urine, death" : "faeces and death", `Egestion and death. Undigested food leaves in faeces${el === "N" ? ", urea in urine" : ""}, and the blue tit eventually dies.`],
      ["dead", "dec", "saprophytic nutrition", "Saprophytic nutrition. Bacteria and fungi secrete enzymes onto the dead matter (extracellular digestion) and absorb the small, soluble products."],
      ["dec", pool, `released as ${E.release}`, el === "C" ? "Release. The decomposers respire the absorbed products, releasing the carbon as carbon dioxide, a simple inorganic molecule." : el === "N" ? "Release. The decomposers break down proteins and other nitrogen compounds and release the nitrogen as ammonium ions (ammonification; the rest of the nitrogen cycle is in 3.3.5.3)." : "Release. The decomposers release the phosphorus as phosphate ions into the soil water."],
    ];
    if (el === "C") ["oak", "cat", "tit"].forEach((k) => edges.push([k, "air", "respiration", `Respiration. ${k === "oak" ? "The oak" : k === "cat" ? "The caterpillar" : "The blue tit"} respires some of its organic molecules, releasing carbon dioxide into the air.`]));
    return edges;
  }
  const ENERGY_EDGES = [
    ["sun", "oak", "light energy", "Light energy is transferred to chemical energy in organic molecules by photosynthesis."],
    ["oak", "cat", "chemical energy in food", "Chemical energy passes to the caterpillar in the organic molecules it digests and assimilates."],
    ["cat", "tit", "chemical energy in food", "Chemical energy passes to the blue tit in the same way. Only a small fraction is passed on at each step."],
    ["oak", "dead", "chemical energy", "Dead leaves and wood still hold chemical energy."],
    ["cat", "dead", "chemical energy", "Faeces and dead bodies hold chemical energy."],
    ["tit", "dead", "chemical energy", "Faeces and dead bodies hold chemical energy."],
    ["dead", "dec", "chemical energy", "Decomposers obtain their energy from the dead matter."],
    ["oak", "heat", "heat from respiration", "The oak's respiration releases energy that is finally lost to the surroundings as heat."],
    ["cat", "heat", "heat from respiration", "Most of the energy the caterpillar takes in is released in respiration and lost as heat."],
    ["tit", "heat", "heat from respiration", "The blue tit loses heat from respiration, including the heat that keeps its body warm."],
    ["dec", "heat", "heat from respiration", "Even the decomposers lose their energy as heat. None of it goes back to the oak."],
  ];
  const ROUTES = {
    C: ["air", "oak", "cat", "dead", "dec", "air"],
    N: ["soil", "oak", "cat", "tit", "dead", "dec", "soil"],
    P: ["soil", "oak", "cat", "dead", "dec", "soil"],
    E: ["sun", "oak", "cat", "tit", "heat"],
  };
  const recycle = {
    NODES, ELEMENTS, ROUTES,
    edges: (layer) => (layer === "E" ? ENERGY_EDGES : matterEdges(layer)),
    edge(layer, a, b) { return recycle.edges(layer).find((e) => e[0] === a && e[1] === b) || null; },
    route(layer) { const r = ROUTES[layer]; return r.slice(1).map((b, i) => recycle.edge(layer, r[i], b)); },
  };

  // ------------------------------------------------------------------ 2. litter bags
  const WATER = { moist: { f: 1, name: "Moist and aerated" }, dry: { f: 0.3, name: "Dry" }, wet: { f: 0.25, name: "Waterlogged" } };
  const litter = {
    WATER, K15: 0.04, M0: 5.0, TEMPS: [5, 10, 15, 20, 25, 30],
    k(T, water, sterile) { if (!(T >= 0 && T <= 30)) return null; if (sterile) return 0; const w = WATER[water]; if (!w) return null; return 0.04 * Math.pow(2, (T - 15) / 10) * w.f; },
    pct(T, water, sterile, t) { const k = litter.k(T, water, sterile); return k === null ? null : 100 * Math.exp(-k * t); },
    grams(T, water, sterile, t) { const p = litter.pct(T, water, sterile, t); return p === null ? null : (litter.M0 * p) / 100; },
  };

  // ------------------------------------------------------------------ 3. carbon stores and fluxes
  const carbon = {
    STORES: {
      atm: { name: "Atmosphere", value: "about 890 GtC (2023); about 590 GtC in 1750", what: "carbon dioxide (and a little methane) in the air", src: "Global Carbon Budget 2024" },
      plants: { name: "Land plants", value: "about 450 GtC", what: "organic molecules in living plants", src: "Schmittner, from IPCC AR6" },
      soil: { name: "Soils", value: "soils and permafrost together: more than 2 500 GtC (estimate)", what: "dead organic matter in soil, peat and frozen ground", src: "derived from Schmittner: land more than 3 000 GtC minus plants about 450 GtC" },
      ocean: { name: "Oceans", value: "about 39 000 GtC", what: "mostly dissolved carbon dioxide, hydrogencarbonate and carbonate ions in deep water", src: "Schmittner, from IPCC AR6" },
      fossil: { name: "Fossil fuels", value: "very large (thousands of GtC)", what: "coal (from peat formed by land plants) and oil and natural gas (from marine plankton buried in sediments), formed from remains that did not fully decompose", src: "" },
      rock: { name: "Rocks", value: "the largest store of all", what: "limestone and chalk, formed from shells and skeletons of marine organisms", src: "" },
    },
    FLUXES: {
      ps: { name: "Photosynthesis", from: "atm", to: "plants", value: "more than 100 GtC per year on land; net uptake by land plants 2.3 GtC per year in 2023", what: "Plants fix carbon dioxide into glucose and other organic molecules.", human: true },
      resp: { name: "Respiration", from: "plants", to: "atm", value: "on land, about the same as photosynthesis, in the opposite direction", what: "Plants and animals respire organic molecules and release carbon dioxide." },
      decomp: { name: "Decomposition", from: "soil", to: "atm", value: "included in the respiration on land", what: "Decomposers digest dead organic matter and release carbon dioxide in respiration." },
      death: { name: "Death and leaf fall", from: "plants", to: "soil", value: "", what: "Dead leaves, wood, faeces and dead animals add organic matter to the soil." },
      fossil: { name: "Fossilisation on land", from: "soil", to: "fossil", value: "very slow: over millions of years", what: "In waterlogged, anaerobic or acidic conditions dead matter is not fully decomposed. Over millions of years, peat from land plants can form coal." },
      fossilSea: { name: "Fossilisation in the sea", from: "ocean", to: "fossil", value: "very slow: over millions of years", what: "The remains of marine plankton buried in sea-floor sediments are not fully decomposed. Over millions of years they can form oil and natural gas." },
      burn: { name: "Combustion of fossil fuels", from: "fossil", to: "atm", value: "10.1 GtC per year in 2023", what: "Burning coal, oil and gas releases carbon that was locked away for millions of years.", human: true },
      luc: { name: "Deforestation and land-use change", from: "plants", to: "atm", value: "1.0 GtC per year in 2023 (net)", what: "Burning or decay of cleared forest releases carbon dioxide, and fewer trees are left to photosynthesise. Land both releases carbon (deforestation) and takes it up (plant growth).", human: true },
      oceanIn: { name: "Dissolving in the oceans", from: "atm", to: "ocean", value: "about 54 GtC per year each way; net uptake 2.9 GtC per year in 2023", what: "Carbon dioxide dissolves in sea water; some is used by phytoplankton in photosynthesis.", human: true },
      oceanOut: { name: "Release from the oceans", from: "ocean", to: "atm", value: "about 54 GtC per year", what: "Carbon dioxide also comes out of solution back into the air." },
      sed: { name: "Shells and sediment", from: "ocean", to: "rock", value: "very slow", what: "Marine organisms make calcium carbonate shells; these settle and, over millions of years, form limestone and chalk." },
    },
    BUDGET2023: { fossil: 10.1, luc: 1.0, ocean: 2.9, land: 2.3, atm: 5.9 },
    atmChange(b) { return Math.round((b.fossil + b.luc - b.ocean - b.land) * 100) / 100; },
    SORT: [["Carbon dioxide in the atmosphere", "store"], ["Carbon in land plants", "store"], ["Dead organic matter in soils", "store"], ["Carbon dissolved in the oceans", "store"], ["Coal, oil and natural gas", "store"], ["Photosynthesis", "flux"], ["Respiration", "flux"], ["Combustion of fossil fuels", "flux"], ["Carbon dioxide dissolving in the oceans", "flux"], ["Fossilisation", "flux"]],
  };

  // ------------------------------------------------------------------ 4. CO2 data (NOAA GML, Mauna Loa)
  const MONTHLY = {
    2017: [406.36, 406.66, 407.54, 409.22, 409.89, 409.08, 407.33, 405.32, 403.57, 403.82, 405.31, 407.00],
    2018: [408.15, 408.52, 409.59, 410.45, 411.44, 410.99, 408.90, 407.16, 405.71, 406.19, 408.21, 409.27],
    2019: [411.03, 411.96, 412.18, 413.54, 414.86, 414.15, 411.96, 410.17, 408.76, 408.74, 410.47, 411.97],
    2020: [413.59, 414.32, 414.72, 416.42, 417.28, 416.58, 414.58, 412.75, 411.50, 411.49, 413.10, 414.23],
    2021: [415.49, 416.72, 417.61, 419.01, 419.09, 418.93, 416.90, 414.42, 413.26, 413.90, 414.97, 416.67],
  };
  // NOAA's de-seasonalised values (same file), shown as the trend with the seasonal cycle removed
  const DESEASON = {
    2017: [406.04, 405.80, 406.05, 406.37, 406.37, 406.68, 407.01, 407.31, 407.17, 407.23, 407.36, 407.71],
    2018: [407.83, 407.61, 408.06, 407.65, 407.98, 408.60, 408.60, 409.17, 409.30, 409.56, 410.24, 409.99],
    2019: [410.69, 410.97, 410.71, 410.92, 411.47, 411.74, 411.64, 412.10, 412.26, 412.09, 412.50, 412.71],
    2020: [413.22, 413.41, 413.35, 413.92, 413.98, 414.16, 414.19, 414.60, 414.91, 414.79, 415.12, 414.91],
    2021: [415.23, 415.80, 416.17, 416.58, 415.88, 416.48, 416.48, 416.27, 416.63, 417.14, 416.93, 417.37],
  };
  const ANNUAL = [[1960, 316.91], [1965, 320.04], [1970, 325.68], [1975, 331.13], [1980, 338.76], [1985, 346.35], [1990, 354.45], [1995, 360.97], [2000, 369.71], [2005, 379.98], [2010, 390.10], [2015, 401.01], [2020, 414.21], [2023, 421.08]];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const co2 = {
    MONTHLY, DESEASON, ANNUAL, MONTHS,
    monthly() { const out = []; Object.keys(MONTHLY).forEach((y) => MONTHLY[y].forEach((v, m) => out.push({ y: +y, m, v, d: DESEASON[y][m], t: +y + (m + 0.5) / 12 }))); return out; },
    amplitude(y) { const a = MONTHLY[y]; return Math.round((Math.max(...a) - Math.min(...a)) * 100) / 100; },
    annualOf(y) { const r = ANNUAL.find((p) => p[0] === y); return r ? r[1] : null; },
    rate(y1, y2) { const a = co2.annualOf(y1), b = co2.annualOf(y2); return a === null || b === null ? null : (b - a) / (y2 - y1); },
    SITE: "Mauna Loa Observatory, Hawaii (19.5° N), 3 400 m above sea level, NOAA Global Monitoring Laboratory",
  };

  // ------------------------------------------------------------------ 5. greenhouse schematic
  const greenhouse = {
    RAYS: 8,
    PRESETS: {
      none: { name: "No greenhouse gases (imaginary)", absorbed: 0, co2Icons: 0, ch4Icons: 0 },
      y1750: { name: "1750", absorbed: 5, co2Icons: 10, ch4Icons: 2 },
      y2019: { name: "2019", absorbed: 6, co2Icons: 15, ch4Icons: 5 },
    },
    escaping(p) { const a = greenhouse.PRESETS[p].absorbed; return greenhouse.RAYS - a + a / 2; },
    CO2: { now: "410 ppm in 2019 (IPCC); 47 % higher than in 1750", y1750: "about 279 ppm (calculated from the IPCC figures); estimates for 1750 are about 278 to 280 ppm" },
    CH4: { now: "1866 ppb in 2019 (IPCC); 156 % higher than in 1750. Global mean about 1935 ppb in June 2026 (NOAA, checked 17 November 2026)", y1750: "about 729 ppb (calculated from the IPCC figures)" },
  };

  // ------------------------------------------------------------------ 6. climate, crop and pest data (hypothetical)
  const climate = {
    CRIT10: 0.648,
    A: { name: "A. Aphids and winter temperature", note: "Hypothetical data from one suction trap over ten years.", x: { k: "temp", label: "Mean January to February temperature / °C", v: [2.1, 3.4, 4.0, 2.8, 5.2, 3.9, 6.1, 4.6, 1.5, 5.7] },
      ys: [{ k: "flight", label: "First flight / day of the year", v: [148, 131, 127, 140, 105, 124, 98, 118, 155, 109], lock: "rsA" }, { k: "count", label: "Aphids caught / thousands per year", v: [3.1, 4.6, 5.8, 4.9, 9.6, 6.7, 8.9, 6.3, 3.4, 8.2] }] },
    B: { name: "B. Wheat yield in the field", note: "Hypothetical data for one region over ten years.", y: { k: "yield", label: "Grain yield / t ha⁻¹", v: [7.9, 7.6, 7.4, 7.1, 8.3, 7.0, 7.5, 8.0, 7.8, 7.2] },
      xs: [{ k: "temp", label: "Mean June to July temperature / °C", v: [15.2, 16.8, 14.6, 17.9, 16.1, 15.7, 18.4, 14.9, 17.2, 16.4], lock: "rsB" }, { k: "rain", label: "June to July rainfall / mm", v: [128, 112, 70, 62, 135, 55, 96, 120, 105, 80] }] },
    C: { name: "C. Growth-chamber experiment", note: "Hypothetical data. One wheat variety; six plants per treatment, one growth chamber per treatment; light, water, mineral ions and humidity kept the same; plants allocated to chambers at random.", temps: [15, 18, 21, 24, 27, 30], c400: [4.2, 4.8, 5.0, 4.5, 3.6, 2.4], c700: [4.8, 5.6, 5.9, 5.2, 4.0, 2.5] },
    spearman(x, y) { const s = B.photoModel.spearman(x, y); return { n: s.n, sumD2: s.sumD2, rs: s.rs, sig: Math.abs(s.rs) >= climate.CRIT10 - 1e-12 }; },
    pctIncrease(a, b) { return ((b - a) / a) * 100; },
  };

  const r3 = (x) => Math.round(x * 1000) / 1000;
  // ------------------------------------------------------------------ validator (Node-runnable)
  function validate() {
    const bad = []; const eq = (a, b, msg, tol = 1e-9) => { if (typeof b === "number" ? !(Math.abs(a - b) <= tol) : JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${msg}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); };
    // R1 to R7
    eq(["N", "C", "P"].map((e) => ELEMENTS[e].release), ["ammonium ions", "carbon dioxide", "phosphate ions"], "R1 release forms");
    ["C", "N", "P"].forEach((e) => { const r = ROUTES[e]; eq(r[0] === ELEMENTS[e].pool && r[r.length - 1] === r[0], true, `R2 ${e} route is a closed loop`); eq(recycle.route(e).every(Boolean), true, `R2 ${e} route uses real edges`); });
    { const succ = (n) => ENERGY_EDGES.filter((x) => x[0] === n).map((x) => x[1]); const reach = (n, seen = new Set()) => { if (n === "heat") return true; if (seen.has(n)) return false; seen.add(n); return succ(n).some((m) => reach(m, new Set(seen))); };
      const cyc = (n, path) => succ(n).some((m) => path.includes(m) || cyc(m, [...path, m]));
      eq(cyc("sun", ["sun"]), false, "R3 energy graph has no cycle"); eq(["sun", "oak", "cat", "tit", "dead", "dec"].every((n) => reach(n)), true, "R3 every node reaches heat");
      eq(ENERGY_EDGES.some((x) => x[0] === "heat" || x[1] === "sun"), false, "R3 nothing leaves heat or enters the Sun");
      eq(ENERGY_EDGES.filter((x) => x[1] === "oak").map((x) => x[0]), ["sun"], "R4 energy into the oak only from the Sun"); }
    eq(["C", "N", "P"].filter((e) => matterEdges(e).some((x) => x[2] === "respiration")), ["C"], "R5 respiration edges for carbon only");
    eq(["C", "N", "P", "E"].map((e) => recycle.route(e).length), [5, 6, 5, 4], "R6 route lengths");
    eq(["C", "N", "P"].filter((e) => ELEMENTS[e].active), ["N", "P"], "R7 active transport for N and P");
    // L1 to L10
    const L = (T, w, s, t) => Math.round(litter.pct(T, w, s, t) * 10) / 10; const G = (T, w, s, t) => Math.round(litter.grams(T, w, s, t) * 100) / 100;
    eq([L(15, "moist", false, 12), G(15, "moist", false, 12)], [61.9, 3.09], "L1"); eq([L(25, "moist", false, 12), G(25, "moist", false, 12)], [38.3, 1.91], "L2");
    eq([L(5, "moist", false, 12), G(5, "moist", false, 12)], [78.7, 3.93], "L3"); eq([L(25, "wet", false, 12), G(25, "wet", false, 12)], [78.7, 3.93], "L4");
    eq([L(25, "dry", false, 12), G(25, "dry", false, 12)], [75.0, 3.75], "L5"); eq([L(20, "moist", true, 12), G(20, "moist", true, 12)], [100, 5], "L6");
    eq(L(15, "moist", false, 24), 38.3, "L7"); eq([L(30, "moist", false, 12), G(30, "moist", false, 12)], [25.7, 1.29], "L8"); eq(litter.k(35, "moist", false), null, "L9 refused above 30 °C");
    eq(Math.round((Math.log(2) / 0.04) * 10) / 10, 17.3, "L10 half-life");
    eq(Math.round(litter.pct(30, "moist", false, 12) * 1e3) / 1e3, 25.727, "L8 exact (0.25727)", 1e-9);
    // C1 to C7
    const b = carbon.BUDGET2023; eq(carbon.atmChange(b), 5.9, "C1 budget"); eq(Math.round((b.atm / (b.fossil + b.luc)) * 1000) / 10, 53.2, "C2 share in air");
    eq([Math.round((b.ocean / 11.1) * 1000) / 10, Math.round((b.land / 11.1) * 1000) / 10], [26.1, 20.7], "C3 shares"); eq(Math.round((890 / 419.31) * 100) / 100, 2.12, "C4 GtC per ppm");
    eq(Math.round((5.9 / (890 / 419.31)) * 100) / 100, 2.78, "C5 ppm"); eq(Math.round(((890 - 590) / 590) * 1000) / 10, 50.8, "C6");
    eq([carbon.SORT.filter((s) => s[1] === "store").length, carbon.SORT.filter((s) => s[1] === "flux").length], [5, 5], "C7 sorting key");
    // D1 to D9
    eq([co2.amplitude(2019), co2.amplitude(2017), co2.amplitude(2020), co2.amplitude(2021), co2.amplitude(2018)], [6.12, 6.32, 5.79, 5.83, 5.73], "D1 to D4 amplitudes");
    eq(Object.keys(MONTHLY).map((y) => MONTHLY[y].indexOf(Math.max(...MONTHLY[y]))), [4, 4, 4, 4, 4], "D5 maximum in May");
    eq(r3(co2.rate(2010, 2020)), 2.411, "D6 rate 2010 to 2020"); eq(r3(co2.rate(1960, 1970)), 0.877, "D7 rate 1960 to 1970");
    eq(Math.round(((421.08 - 316.91) / 316.91) * 1000) / 10, 32.9, "D8 % increase"); eq(Math.round((MONTHLY[2019].reduce((s, v) => s + v, 0) / 12) * 100) / 100, 411.65, "D9 2019 annual mean");
    eq(co2.monthly().length, 60, "D monthly count");
    // G1 to G7
    eq(Math.round((410 / 1.47) * 10) / 10, 278.9, "G1"); eq(Math.round((1866 / 2.56) * 10) / 10, 728.9, "G2");
    eq(["none", "y1750", "y2019"].map((p) => greenhouse.escaping(p)), [8, 5.5, 5], "G3 escaping widths");
    eq(Math.round(410 / 1.866), 220, "G6 CO2 per CH4"); eq([Math.round(10 * 1.47), Math.round(2 * 2.56)], [15, 5], "G7 icon counts");
    eq([greenhouse.PRESETS.y1750.co2Icons, greenhouse.PRESETS.y2019.co2Icons, greenhouse.PRESETS.y1750.ch4Icons, greenhouse.PRESETS.y2019.ch4Icons], [10, 15, 2, 5], "G7 presets");
    // Spearman and data set C (only when the photosynthesis model, which supplies spearman(), is loaded)
    if (B.photoModel && B.photoModel.spearman) {
      const s = (x, y) => climate.spearman(x, y);
      const a1 = s(climate.A.x.v, climate.A.ys[0].v), a2 = s(climate.A.x.v, climate.A.ys[1].v), b1 = s(climate.B.xs[0].v, climate.B.y.v), b2 = s(climate.B.xs[1].v, climate.B.y.v);
      eq([a1.sumD2, r3(a1.rs), a1.sig], [326, -0.976, true], "S-A1"); eq([a2.sumD2, r3(a2.rs), a2.sig], [16, 0.903, true], "S-A2");
      eq([b1.sumD2, r3(b1.rs), b1.sig], [202, -0.224, false], "S-B1"); eq([b2.sumD2, r3(b2.rs), b2.sig], [6, 0.964, true], "S-B2");
      eq(B.photoModel.CRIT[10], 0.648, "critical value n = 10");
    } else bad.push("B.photoModel.spearman missing");
    const C = climate.C; const pi = (i) => Math.round(climate.pctIncrease(C.c400[i], C.c700[i]) * 10) / 10;
    eq([pi(2), pi(5), pi(0)], [18, 4.2, 14.3], "S-C1 to C3"); eq([C.temps[C.c400.indexOf(Math.max(...C.c400))], C.temps[C.c700.indexOf(Math.max(...C.c700))]], [21, 21], "S-C4 optimum");
    eq(Math.round(((C.c400[2] - C.c400[5]) / C.c400[2]) * 100), 52, "S-C5");
    eq(Object.values(LOCKS).length, 4, "locks defined");
    return bad;
  }
  B.cyclesModel = { answered, LOCKS, recycle, litter, carbon, co2, greenhouse, climate, validate };
})(window.BIO);

// =====================================================================================================================
// Drawings (B.cyclesArt). Every drawing sits on a white panel; labels at least 13 px in a 700-unit-wide viewBox.
(function (B) {
  const INK = "#16263a", GREY = "#5f6f7f", BLUE = "#1f66b0", HEAT = "#c0392b", LINE = "#9aa8b4", FAINT = "#d5dce2";
  const GREEN = ["#e4f3e1", "#2f7d32"], AMBER = ["#fdf0dc", "#a3620f"], BROWN = ["#efe6dc", "#6d4c2f"], SKY = ["#e6f0fa", "#2f5f8f"], SEA = ["#dcedf5", "#1d6a8a"], STONE = ["#eceae6", "#5f5a52"];
  const uid = () => Math.random().toString(36).slice(2, 7);
  const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  const box = (cx, cy, w, h, lines, col, opt = {}) => { const fs = opt.fs || 15; const y0 = cy - ((lines.length - 1) * (fs + 3)) / 2 + fs * 0.35;
    return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="10" fill="${col[0]}" stroke="${opt.on ? BLUE : col[1]}" stroke-width="${opt.on ? 3.2 : 1.6}"/>` + lines.map((l, i) => `<text x="${cx}" y="${(y0 + i * (fs + 3)).toFixed(1)}" text-anchor="middle" font-size="${fs}" font-weight="${i === 0 ? 700 : 400}" fill="${INK}">${l}</text>`).join(""); };

  // ---------------------------------------------------------------- nutrient recycling
  // positions (viewBox 700 x 440); each node has a box; edges are drawn between fixed anchor points
  const NR = {
    sun: { x: 60, y: 48 }, air: { x: 350, y: 42, w: 230, h: 46, l: ["Air", "carbon dioxide"], c: SKY },
    oak: { x: 120, y: 188, w: 170, h: 52, l: ["Oak tree", "producer"], c: GREEN }, cat: { x: 350, y: 188, w: 170, h: 52, l: ["Caterpillar", "primary consumer"], c: AMBER },
    tit: { x: 575, y: 188, w: 170, h: 52, l: ["Blue tit", "secondary consumer"], c: AMBER },
    dead: { x: 350, y: 292, w: 330, h: 48, l: ["Dead matter and waste", "dead leaves, bodies, faeces, urine"], c: BROWN },
    dec: { x: 470, y: 396, w: 260, h: 48, l: ["Decomposers", "saprophytic bacteria and fungi"], c: BROWN },
    soil: { x: 150, y: 396, w: 240, h: 48, l: ["Soil water", "mineral ions"], c: SKY },
  };
  // [from, to] -> path d and label position
  const NR_PATH = {
    "air>oak": ["M240 58 L148 160", [172, 104, "end"]], "oak>air": ["M108 160 L236 34", [100, 98, "end"]],
    "cat>air": ["M350 160 L350 68", [358, 118, "start"]], "tit>air": ["M560 160 L466 60", [530, 104, "start"]],
    "soil>oak": ["M130 370 L122 216", [134, 300, "start"]],
    "oak>cat": ["M206 188 L262 188", [234, 178, "middle"]], "cat>tit": ["M436 188 L488 188", [462, 178, "middle"]],
    "oak>dead": ["M150 216 L240 268", [150, 252, "end"]], "cat>dead": ["M350 216 L350 266", [358, 246, "start"]], "tit>dead": ["M560 216 L470 268", [568, 252, "start"]],
    "dead>dec": ["M420 318 L444 370", [440, 340, "start"]], "dec>soil": ["M338 396 L272 396", [305, 386, "middle"]],
    "dec>air": ["M600 390 L672 390 L672 42 L468 42", [678, 250, "end"]],
    "sun>oak": ["M78 66 L106 160", [96, 112, "start"]],
    "oak>heat": ["M60 214 L26 250", [20, 268, "start"]], "cat>heat": ["M300 160 L282 124", [276, 118, "end"]], "tit>heat": ["M640 160 L670 124", [676, 112, "end"]], "dec>heat": ["M600 404 L660 430", [600, 434, "end"]],
  };
  function recycler(o) {
    const M = B.cyclesModel.recycle; const layer = o.layer; const u = uid(); const hi = o.hi; // hi = "a>b" of the current edge
    const edges = M.edges(layer).filter((e) => NR_PATH[`${e[0]}>${e[1]}`]);
    const nodes = new Set(edges.flatMap((e) => [e[0], e[1]]));
    const isE = layer === "E"; const col = isE ? "#c77d0a" : "#2f7d32";
    const lines = edges.map((e) => { const key = `${e[0]}>${e[1]}`; const [d] = NR_PATH[key]; const on = key === hi; const heat = e[1] === "heat"; const c = on ? BLUE : heat ? HEAT : col;
      return `<g data-edge="${key}" tabindex="0" role="button" aria-label="${e[2]}: from ${M.NODES[e[0]]} to ${M.NODES[e[1]]}" style="cursor:pointer"><path d="${d}" fill="none" stroke="transparent" stroke-width="16"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${on ? 4.2 : 2.4}" ${heat ? 'stroke-dasharray="6 4"' : ""} marker-end="url(#${on ? "nb" : heat ? "nh" : "nc"}${u})"/></g>`; }).join("");
    const labels = isE ? ["oak>heat", "cat>heat", "tit>heat", "dec>heat"].map((k) => { const [, [x, y, a]] = NR_PATH[k]; return `<text x="${x}" y="${y}" text-anchor="${a}" font-size="15" font-weight="700" fill="${HEAT}">heat</text>`; }).join("") : "";
    const showNode = (k) => nodes.has(k) || ["oak", "cat", "tit", "dead", "dec"].includes(k);
    const nb = ["air", "soil", "oak", "cat", "tit", "dead", "dec"].filter((k) => showNode(k) && !(isE && (k === "air" || k === "soil"))).map((k) => { const n = NR[k]; return box(n.x, n.y, n.w, n.h, n.l, n.c); }).join("");
    const sun = isE ? `<circle cx="${NR.sun.x}" cy="${NR.sun.y}" r="24" fill="#ffe08a" stroke="#c99a00" stroke-width="1.6"/><text x="${NR.sun.x}" y="${NR.sun.y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}">Sun</text>` : "";
    const note = isE ? `<text x="350" y="40" text-anchor="middle" font-size="15" font-weight="700" fill="${HEAT}">Energy flows one way: in as light, out as heat</text>` : "";
    const aria = isE ? "Energy flow in a woodland: light energy enters the oak tree, chemical energy passes to the caterpillar, blue tit, dead matter and decomposers, and every organism loses heat. No energy returns to the oak." : `Recycling of ${B.cyclesModel.recycle.ELEMENTS[layer].name.toLowerCase()} in a woodland: from ${layer === "C" ? "the air" : "soil water"} into the oak tree, along the food chain, into dead matter, through the decomposers and back again.`;
    const vb = layer === "N" || layer === "P" ? "0 150 700 290" : "0 0 700 440"; const vh = layer === "N" || layer === "P" ? 290 : 440;
    return `<svg viewBox="${vb}" width="700" data-vh="${vh}" role="group" aria-label="${aria}" style="max-width:100%;height:auto;background:#fff;display:block"><defs>${mk("nc" + u, col)}${mk("nb" + u, BLUE)}${mk("nh" + u, HEAT)}</defs>${nb}${sun}${note}${lines}${labels}</svg>`;
  }

  // ---------------------------------------------------------------- generic line chart
  // o: { W, H, x: [min, max], y: [min, max], xTicks: [[v, label]], yTicks: [v], xLabel, yLabel, series: [{ pts: [[x, y]], col, dash, w, dots }],
  //      cursor: [x, y] | null, marks: [[x, y]], aria, yBreak }
  function chart(o) {
    const fs = o.fs || 14, tfs = fs > 14 ? fs - 3 : 14; const W = o.W || 640, H = o.H || 340, L = Math.round(36 + fs * 2), R = Math.max(28, Math.round(fs * 1.4)), T = 16, Bm = Math.round(22 + fs * 2.3); const pw = W - L - R, ph = H - T - Bm;
    const X = (v) => L + ((v - o.x[0]) / (o.x[1] - o.x[0])) * pw, Y = (v) => T + ph - ((v - o.y[0]) / (o.y[1] - o.y[0])) * ph;
    const grid = o.yTicks.map((v) => `<line x1="${L}" x2="${L + pw}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#e8edf1"/><text x="${L - 7}" y="${(Y(v) + fs * 0.35).toFixed(1)}" text-anchor="end" font-size="${fs}" fill="${INK}">${v}</text>`).join("");
    const xt = o.xTicks.map(([v, lab]) => `<line x1="${X(v).toFixed(1)}" x2="${X(v).toFixed(1)}" y1="${T + ph}" y2="${T + ph + 5}" stroke="${INK}"/><text x="${X(v).toFixed(1)}" y="${T + ph + fs + 7}" text-anchor="middle" font-size="${fs}" fill="${INK}">${lab}</text>`).join("");
    const ser = o.series.map((s) => { const d = s.pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(" ");
      return (s.line === false ? "" : `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="${s.w || 2.4}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ""}/>`) + (s.dots ? s.pts.map((p) => s.shape === "sq" ? `<rect x="${(X(p[0]) - 4.5).toFixed(1)}" y="${(Y(p[1]) - 4.5).toFixed(1)}" width="9" height="9" fill="${s.col}"/>` : `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${s.r || 4}" fill="${s.fill || s.col}" stroke="${s.col}" stroke-width="1.5"/>`).join("") : ""); }).join("");
    const cur = o.cursor ? `<line x1="${X(o.cursor[0]).toFixed(1)}" x2="${X(o.cursor[0]).toFixed(1)}" y1="${T}" y2="${T + ph}" stroke="${BLUE}" stroke-dasharray="4 3"/><circle cx="${X(o.cursor[0]).toFixed(1)}" cy="${Y(o.cursor[1]).toFixed(1)}" r="6.5" fill="none" stroke="${BLUE}" stroke-width="2.6"/>` : "";
    const marks = (o.marks || []).map((p, i) => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="7" fill="none" stroke="#a33030" stroke-width="2.6"/><text x="${(X(p[0]) + 9).toFixed(1)}" y="${(Y(p[1]) - 9).toFixed(1)}" font-size="${fs}" font-weight="700" fill="#a33030">${"AB"[i]}</text>`).join("");
    const brk = o.yBreak ? `<path d="M${L - 6} ${T + ph - 8} l12 -5 M${L - 6} ${T + ph - 2} l12 -5" stroke="${INK}" stroke-width="1.4"/>` : "";
    const axes = `<line x1="${L}" x2="${L}" y1="${T}" y2="${T + ph}" stroke="${INK}" stroke-width="1.4"/><line x1="${L}" x2="${L + pw}" y1="${T + ph}" y2="${T + ph}" stroke="${INK}" stroke-width="1.4"/>`;
    const labs = `<text x="${L + pw / 2}" y="${H - 8}" text-anchor="middle" font-size="${tfs}" fill="${INK}">${o.xLabel}</text><text transform="translate(${Math.round(fs + 2)} ${T + ph / 2}) rotate(-90)" text-anchor="middle" font-size="${tfs}" fill="${INK}">${o.yLabel}</text>`;
    return { svg: `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${o.aria}" style="max-width:100%;height:auto;background:#fff;display:block" ${o.focus ? 'tabindex="0" data-chart' : ""}>${grid}${axes}${brk}${xt}${ser}${marks}${cur}${labs}</svg>`, X, Y, L, T, pw, ph, W, H };
  }

  // ---------------------------------------------------------------- carbon cycle
  const CS = {
    atm: { x: 350, y: 44, w: 250, h: 52, c: SKY }, plants: { x: 100, y: 201, w: 186, h: 52, c: GREEN }, soil: { x: 100, y: 361, w: 186, h: 52, c: BROWN },
    ocean: { x: 600, y: 201, w: 160, h: 52, c: SEA }, fossil: { x: 340, y: 400, w: 170, h: 52, c: STONE }, rock: { x: 600, y: 400, w: 160, h: 52, c: STONE },
  };
  // [x1, y1, x2, y2, label, placement]: placement is a side (+1 or -1) for a label written along the arrow, or [x, y, anchor]
  const CF = {
    ps: [232, 72, 82, 173, "photosynthesis", -1], resp: [128, 173, 262, 72, "respiration", 1], luc: [194, 192, 300, 72, "deforestation", 1],
    decomp: [150, 333, 336, 72, "decomposition", 1], death: [100, 229, 100, 333, "death, waste", [108, 288, "start"]],
    fossil: [194, 384, 248, 396, "fossilisation", [205, 430, "middle"]], burn: [392, 372, 392, 72, "combustion", [400, 250, "start"]],
    oceanIn: [440, 72, 548, 173, "dissolves", -1], oceanOut: [604, 173, 470, 72, "released", -1], sed: [600, 229, 600, 372, "shells,|sediment", [608, 292, "start"]],
    fossilSea: [548, 229, 428, 372, "fossilisation", 1],
  };
  function carbonCycle(o) {
    const M = B.cyclesModel.carbon; const u = uid(); const human = !!o.human; const sel = o.sel;
    const stores = Object.entries(CS).map(([k, p]) => { const s = M.STORES[k]; const lines = [s.name]; if (k === "atm") lines.push(human ? o.atmLine || "change: ?" : "about 890 GtC (2023)"); else lines.push({ plants: "about 450 GtC", soil: "over 2 500 GtC (est.)", ocean: "about 39 000 GtC", fossil: "very large", rock: "largest store" }[k]);
      return `<g data-store="${k}" tabindex="0" role="button" aria-label="Store: ${s.name}" style="cursor:pointer">${box(p.x, p.y, p.w, p.h, lines, p.c, { on: sel === "s:" + k, fs: 15 })}</g>`; }).join("");
    const fl = Object.entries(CF).map(([k, [x1, y1, x2, y2, lab, pl]]) => { const f = M.FLUXES[k]; const on = sel === "f:" + k; const hum = human && f.human; const dim = human && !f.human;
      const c = on ? BLUE : hum ? "#b0451c" : dim ? "#c4ccd3" : "#4b6b52"; const m = on ? "cb" : hum ? "ch" : dim ? "cd" : "cn"; const d = `M${x1} ${y1} L${x2} ${y2}`;
      let t; const tc = `font-size="15" font-weight="${on || hum ? 700 : 500}" fill="${dim ? "#7c8792" : INK}" paint-order="stroke" stroke="#fff" stroke-width="4"`;
      if (Array.isArray(pl)) t = lab.split("|").map((ln, i) => `<text x="${pl[0]}" y="${pl[1] + i * 18}" text-anchor="${pl[2]}" ${tc}>${ln}</text>`).join("");
      else { let a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI; if (a > 90) a -= 180; if (a < -90) a += 180; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const r = (a * Math.PI) / 180; const nx = -Math.sin(r) * 9 * pl, ny = Math.cos(r) * 9 * pl;
        t = `<text x="${(mx + nx).toFixed(1)}" y="${(my + ny).toFixed(1)}" text-anchor="middle" dominant-baseline="${pl > 0 ? "hanging" : "auto"}" transform="rotate(${a.toFixed(1)} ${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)})" ${tc}>${lab}</text>`; }
      return `<g data-flux="${k}" tabindex="0" role="button" aria-label="Flux: ${f.name}" style="cursor:pointer"><path d="${d}" fill="none" stroke="transparent" stroke-width="16"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${on || hum ? 3.8 : 2.4}" marker-end="url(#${m}${u})"/>${t}</g>`; }).join("");
    return `<svg viewBox="0 0 700 440" width="700" role="group" aria-label="The carbon cycle: boxes are stores of carbon, arrows are fluxes between them." style="max-width:100%;height:auto;background:#fff;display:block"><defs>${mk("cn" + u, "#4b6b52")}${mk("cb" + u, BLUE)}${mk("ch" + u, "#b0451c")}${mk("cd" + u, "#c4ccd3")}</defs>${fl}${stores}</svg>`;
  }

  // ---------------------------------------------------------------- greenhouse schematic
  // step 1 to 4; preset key; viewBox 640 x 400. Space at top, atmosphere band 120 to 270, surface 330 to 400.
  function greenhouse(o) {
    const G = B.cyclesModel.greenhouse; const P = G.PRESETS[o.preset]; const st = o.step; const u = uid();
    const SUN = "#e0a100", IR = "#c0392b";
    let s = `<rect x="0" y="0" width="640" height="120" fill="#eef3f8"/><rect x="0" y="120" width="640" height="190" fill="#f6f9fc"/><rect x="0" y="310" width="640" height="90" fill="#e7efe0"/>`;
    s += `<text x="628" y="24" text-anchor="end" font-size="14" fill="${GREY}">space</text><text x="12" y="302" font-size="14" fill="${GREY}">atmosphere</text><text x="628" y="392" text-anchor="end" font-size="14" fill="${INK}">Earth's surface</text>`;
    s += `<circle cx="44" cy="44" r="26" fill="#ffe08a" stroke="#c99a00" stroke-width="1.6"/><text x="44" y="49" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}">Sun</text>`;
    // molecules (deterministic positions)
    const pos = (i, n, row) => [70 + ((i * 97 + row * 41) % 500), 160 + ((i * 53 + row * 29) % 110)];
    for (let i = 0; i < P.co2Icons; i++) { const [x, y] = pos(i, P.co2Icons, 0); s += `<g aria-hidden="true"><circle cx="${x - 7}" cy="${y}" r="4" fill="#d9534f"/><circle cx="${x}" cy="${y}" r="5" fill="#333"/><circle cx="${x + 7}" cy="${y}" r="4" fill="#d9534f"/></g>`; }
    for (let i = 0; i < P.ch4Icons; i++) { const [x, y] = pos(i + 3, P.ch4Icons, 1); s += `<g aria-hidden="true"><circle cx="${x}" cy="${y}" r="5" fill="#333"/>${[[0, -7], [7, 3], [-7, 3], [0, 7]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="2.8" fill="#fff" stroke="#555"/>`).join("")}</g>`; }
    // incoming solar (identical in every preset)
    if (st >= 1) { [110, 160, 210].forEach((x) => { s += `<path d="M${x - 40} 76 L${x} 326" stroke="${SUN}" stroke-width="4" marker-end="url(#gs${u})"/>`; }); s += `<path d="M196 20 L226 118 L256 20" fill="none" stroke="${SUN}" stroke-width="3" stroke-dasharray="6 4" marker-end="url(#gs${u})"/><text x="232" y="140" text-anchor="middle" font-size="14" fill="${INK}">reflected</text>`; }
    // infrared from the surface
    if (st >= 2) { const n = G.RAYS; const xs = Array.from({ length: n }, (_, i) => 296 + i * 41); const showAbs = st >= 3;
      xs.forEach((x, i) => { const absorbed = showAbs && i < P.absorbed; const ex = x + 18;
        if (!absorbed) s += `<path d="M${x} 318 L${ex} 40" stroke="${IR}" stroke-width="3" marker-end="url(#gi${u})"/>`;
        else { const ay = 200, cx = x + 9; s += `<path d="M${x} 318 L${x + 8} ${ay + 10}" stroke="${IR}" stroke-width="3"/><circle cx="${cx}" cy="${ay}" r="10" fill="#fff" stroke="${IR}" stroke-width="2"/><circle cx="${cx - 5}" cy="${ay}" r="3" fill="#d9534f"/><circle cx="${cx}" cy="${ay}" r="3.6" fill="#333"/><circle cx="${cx + 5}" cy="${ay}" r="3" fill="#d9534f"/>`;
          if (st >= 3) s += `<path d="M${cx + 3} ${ay - 10} L${x + 22} 40" stroke="${IR}" stroke-width="1.6" marker-end="url(#gi${u})"/><path d="M${cx - 7} ${ay + 7} L${x - 18} 318" stroke="${IR}" stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#gi${u})"/>`; } });
      s += `<text x="20" y="352" font-size="14" fill="${IR}" font-weight="700">infrared re-radiated by the warmed surface</text>`; }
    const aria = `Schematic greenhouse effect, step ${st} of 4, atmosphere ${P.name}: ${P.absorbed} of ${G.RAYS} infrared arrows from the surface are absorbed by greenhouse gas molecules.`;
    return `<svg viewBox="0 0 640 400" width="640" role="img" aria-label="${aria}" style="max-width:100%;height:auto;background:#fff;display:block"><defs>${mk("gs" + u, SUN)}${mk("gi" + u, IR)}</defs>${s}</svg>`;
  }

  B.cyclesArt = { recycler, chart, carbonCycle, greenhouse, NR_PATH, CF, COL: { INK, GREY, BLUE, HEAT } };
})(window.BIO);
