// Energy transfer models and drawings for 3.3.4.1 Energy transfer and 3.3.4.2 Energy and human food production
// (Phase 5 Batch 2, author A3). Specification and review: scratchpad p5b2/A3-MODEL.md (reviewed in MR-A3).
//
// B.energyModel
//   web        hypothetical, simplified farmland food web (14 organisms, 22 arrows "eaten -> eater"; arrows point in the
//              direction of energy transfer). chainsThrough(x) = paths from producers to x * paths from x to top
//              consumers; levels(x) = set of path lengths (in organisms, producer = 1) from a producer to x.
//   pyramid    shape(values) for bars listed bottom-up: "upright" | "inverted" | "partly inverted" | "upright-equal";
//              check(type, values) refuses non-positive values, non-whole numbers of organisms and any energy level that
//              is not strictly less than the level below (a pyramid of energy cannot be inverted).
//   efficiency pct(lower, higher) = higher / lower * 100 (same units, area and time); forwards(lower, pct, n).
//   production npp(gpp, r) = gpp - r; gpp(npp, r); N(I, F, U, R) = I - (F + U + R); R(I, F, U, N).
//   locks      input sets that belong to a question; the calculators refuse them until that question is answered.
//   validate() returns a list of failures of the hand-computed test cases (A3-MODEL.md); [] when all pass.
// Data sources (checked 17 November 2026): Silver Springs energy, English Channel biomass and both numbers pyramids from
// OpenStax Biology 2e (2018), Figure 46.10, which reproduces Odum (1957) for Silver Springs; Silver Springs biomass
// 809 / 37 / 11 / 1.5 and producer GPP 20 810 and NPP 8 833 (R = 11 977 derived) adapted from Odum (1957) as given in
// Kimball, Biology, 17.1B. Everything else is hypothetical.
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ food web
  const ORGS = [
    { k: "wheat", n: "Wheat", x: 470, y: 420, p: true }, { k: "grass", n: "Grass", x: 210, y: 420, p: true },
    { k: "grasshopper", n: "Grasshopper", x: 80, y: 330 }, { k: "rabbit", n: "Rabbit", x: 230, y: 330 }, { k: "slug", n: "Slug", x: 440, y: 330 }, { k: "aphid", n: "Aphid", x: 600, y: 330 },
    { k: "spider", n: "Spider", x: 345, y: 235 }, { k: "ladybird", n: "Ladybird", x: 505, y: 235 },
    { k: "shrew", n: "Shrew", x: 140, y: 140 }, { k: "thrush", n: "Thrush", x: 380, y: 140 }, { k: "bluetit", n: "Blue tit", x: 600, y: 140 },
    { k: "owl", n: "Owl", x: 70, y: 45 }, { k: "weasel", n: "Weasel", x: 270, y: 45 }, { k: "hawk", n: "Sparrowhawk", x: 500, y: 45 },
  ];
  const EDGES = [["wheat", "aphid"], ["wheat", "rabbit"], ["wheat", "slug"], ["grass", "rabbit"], ["grass", "slug"], ["grass", "grasshopper"],
    ["aphid", "ladybird"], ["aphid", "spider"], ["aphid", "bluetit"], ["ladybird", "spider"], ["grasshopper", "spider"], ["grasshopper", "shrew"],
    ["slug", "thrush"], ["slug", "shrew"], ["spider", "thrush"], ["spider", "shrew"], ["spider", "bluetit"],
    ["rabbit", "weasel"], ["shrew", "weasel"], ["shrew", "owl"], ["thrush", "hawk"], ["bluetit", "hawk"]];
  const org = (k) => ORGS.find((o) => o.k === k);
  const eats = (k) => EDGES.filter((e) => e[1] === k).map((e) => e[0]);
  const eatenBy = (k) => EDGES.filter((e) => e[0] === k).map((e) => e[1]);
  const producers = () => ORGS.filter((o) => o.p).map((o) => o.k);
  const tops = () => ORGS.filter((o) => !eatenBy(o.k).length).map((o) => o.k);
  // every chain from a producer to a top consumer (list of keys, bottom-up)
  const allChains = () => { const out = []; const go = (path) => { const last = path[path.length - 1]; const nx = eatenBy(last); if (!nx.length) { out.push(path); return; } nx.forEach((n) => go([...path, n])); }; producers().forEach((p) => go([p])); return out; };
  const chainsThrough = (k) => allChains().filter((c) => c.includes(k));
  const levels = (k) => [...new Set(allChains().filter((c) => c.includes(k)).map((c) => c.indexOf(k) + 1))].sort((a, b) => a - b);
  const LEVEL_NAME = { 1: "producer", 2: "primary consumer", 3: "secondary consumer", 4: "tertiary consumer", 5: "quaternary consumer", 6: "quinary consumer" };
  const web = { ORGS, EDGES, org, eats, eatenBy, producers, tops, allChains, chainsThrough, levels, LEVEL_NAME };

  // ------------------------------------------------------------------ pyramids
  const KCAL = "kcal m⁻² yr⁻¹", GDRY = "g m⁻² (dry mass)", PER01 = "individuals per 0.1 ha";
  const SS_NOTE = "Data: Odum (1957), Silver Springs, Florida, as reproduced in OpenStax Biology 2e (2018), Figure 46.10. Producer value = gross primary production; consumer values = energy assimilated by each level (gross production). Efficiencies calculated from other measures (for example net production) give different percentages. 1 kcal = 4.18 kJ.";
  const SETS = {
    ssEnergy: { name: "Silver Springs: energy", type: "energy", unit: KCAL, shape: "upright", levels: [["Plants (producers)", 20810], ["Insects and snails", 3368], ["Fish (secondary consumers)", 383], ["Fish (tertiary consumers)", 21]], note: SS_NOTE, side: "Decomposers (not a trophic level): 5 060 kcal m⁻² yr⁻¹." },
    ssBiomass: { name: "Silver Springs: biomass", type: "biomass", unit: GDRY, shape: "upright", levels: [["Plants (producers)", 809], ["Insects and snails", 37], ["Fish (secondary consumers)", 11], ["Fish (tertiary consumers)", 1.5]], note: "Adapted from Odum (1957), Silver Springs, Florida (as given in Kimball, Biology, 17.1B; one textbook gives 5 for the top level). Biomass at the time of sampling.", side: "Decomposers (not a trophic level): 5 g m⁻²." },
    channel: { name: "English Channel: biomass", type: "biomass", unit: GDRY, shape: "inverted", levels: [["Phytoplankton (producers)", 4], ["Zooplankton (primary consumers)", 21]], note: "Data from OpenStax Biology 2e (2018), Figure 46.10." },
    forest: { name: "Temperate forest: numbers", type: "number", unit: PER01, shape: "partly inverted", levels: [["Trees (producers)", 200], ["Herbivorous insects", 150000], ["Predatory insects", 120000], ["Birds", 5]], note: "Data from OpenStax Biology 2e (2018), Figure 46.10 (summer)." },
    grassland: { name: "Grassland: numbers", type: "number", unit: PER01, shape: "upright", levels: [["Grass plants (producers)", 1500000], ["Herbivorous insects", 200000], ["Predatory insects", 90000], ["Birds", 1]], note: "Data from OpenStax Biology 2e (2018), Figure 46.10 (summer)." },
  };
  const shape = (v) => { const up = v.slice(1).map((x, i) => Math.sign(x - v[i])); if (up.every((s) => s < 0)) return "upright"; if (up.every((s) => s > 0)) return "inverted"; if (up.every((s) => s <= 0)) return "upright-equal"; return "partly inverted"; };
  const SHAPE_TEXT = { upright: "upright", inverted: "inverted", "partly inverted": "partly inverted", "upright-equal": "upright, with two levels equal" };
  const widths = (v) => { const m = Math.max(...v); return v.map((x) => (x / m) * 100); };
  const check = (type, v) => {
    if (v.length < 2 || v.some((x) => !(typeof x === "number" && isFinite(x) && x > 0))) return { ok: false, msg: "Enter a positive value for every level." };
    if (type === "number" && v.some((x) => !Number.isInteger(x))) return { ok: false, msg: "Numbers of organisms must be whole numbers." };
    if (type === "energy") for (let i = 1; i < v.length; i++) if (!(v[i] < v[i - 1])) return { ok: false, energy: true, msg: "A pyramid of energy cannot be inverted: each level receives less energy than the level below. Check your values." };
    return { ok: true };
  };
  const pyramid = { SETS, shape, SHAPE_TEXT, widths, check, MIN_PCT: 1 };

  // ------------------------------------------------------------------ efficiency and production
  const sf3 = (x) => { if (x === 0) return "0"; const d = 3 - Math.ceil(Math.log10(Math.abs(x)) + 1e-12); const r = Number(x.toFixed(Math.max(0, Math.min(10, d)))); return d < 0 ? String(Number(x.toPrecision(3))) : r.toFixed(Math.max(0, d)); };
  const fmt = (x) => { const s = sf3(x); const [i, f] = s.split("."); const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, " "); return f ? ii + "." + f : ii; };
  const efficiency = {
    pct(lower, higher) { if (!(lower > 0) || !(higher > 0) || !(higher < lower)) return null; return (higher / lower) * 100; },
    forwards(lower, pct, n) { if (!(lower > 0) || !(pct > 0 && pct < 100) || !(n >= 1)) return null; const out = []; let x = lower; for (let i = 0; i < n; i++) { x = (x * pct) / 100; out.push(x); } return out; },
  };
  const production = {
    npp(gpp, r) { return gpp >= 0 && r >= 0 && r <= gpp ? gpp - r : null; },
    gpp(npp, r) { return npp >= 0 && r >= 0 ? npp + r : null; },
    rPlant(gpp, npp) { return gpp >= 0 && npp >= 0 && npp <= gpp ? gpp - npp : null; },
    N(I, F, U, R) { return [I, F, U, R].every((x) => x >= 0) && F + U + R <= I ? I - (F + U + R) : null; },
    R(I, F, U, N) { return [I, F, U, N].every((x) => x >= 0) && F + U + N <= I ? I - (F + U + N) : null; },
    PRESETS: { grazing: { name: "Bullock grazing outdoors", I: 100, F: 37, U: 3, R: 56 }, housed: { name: "Bullock housed indoors", I: 100, F: 37, U: 3, R: 53 } },
  };
  // marking a typed answer: correct if within 0.5 % of the exact value, or equal to it rounded to 2 or 3 significant figures
  const near = (given, exact) => { if (!(typeof given === "number" && isFinite(given))) return false; if (Math.abs(given - exact) <= 0.005 * Math.abs(exact) + 1e-9) return true; return [2, 3].some((s) => Number(exact.toPrecision(s)) === given); };

  // ------------------------------------------------------------------ locks (inputs that belong to a question)
  const same = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
  const LOCKS = {
    eff: [ // [lower, higher]
      { v: [20810, 3368], q: "q-3.3.4.1-ef1", where: "question 1 below this calculator" }, { v: [3368, 383], q: "q-3.3.4.1-ef2", where: "question 2 below this calculator" },
      { v: [20810, 21], q: "q-3.3.4.1-3", where: "a Check yourself question" }, { v: [1200, 60], q: "q-3.3.4.1-4", where: "a Check yourself question" },
      { v: [12000, 1080], q: "q-3.3.4-c2", where: "the topic assessment" }, { v: [1080, 86.4], q: "q-3.3.4-c2", where: "the topic assessment" },
      { v: [15000, 1200], q: "q-3.3.4-c6", where: "the topic assessment" }, { v: [1200, 96], q: "q-3.3.4-c6", where: "the topic assessment" }],
    fwd: [ // [lower, pct]
      { v: [50000, 10], q: "q-3.3.4.1-ef3", where: "question 3 below this calculator" },
      { v: [15000, 8], q: "q-3.3.4-c6", where: "the topic assessment" }, { v: [1200, 8], q: "q-3.3.4-c6", where: "the topic assessment" }, { v: [96, 8], q: "q-3.3.4-c6", where: "the topic assessment" }],
    plant: [ // sorted known values
      { v: [14400, 24000], q: "q-3.3.4.2-pc1", where: "question 1 below this calculator" }, { v: [3200, 4800], q: "q-3.3.4.2-3", where: "a Check yourself question" },
      { v: [22680, 36000], q: "q-3.3.4-c13", where: "the topic assessment" }],
    consumer: [ // [I, F, U, R or N]
      { v: [3000, 1650, 150, 1000], q: "q-3.3.4.2-pc2", where: "question 2 below this calculator" }, { v: [500, 200, 20, 30], q: "q-3.3.4.2-4", where: "a Check yourself question" },
      { v: [1200, 420, 60, 640], q: "q-3.3.4-c14", where: "the topic assessment" }],
  };
  // a question counts as answered once it has full marks, a self-marked attempt, or two attempts (the answer is then shown)
  const answered = (qid) => { try { const a = B.store.get().attempts.filter((x) => x.qid === qid); return a.some((x) => x.score === x.max || x.mode === "self") || a.length >= 2; } catch (e) { return false; } };
  const lockFor = (kind, v) => { const vv = kind === "plant" ? v.slice().sort((a, b) => a - b) : v; return (LOCKS[kind] || []).find((L) => same(L.v, vv) && !answered(L.q)) || null; };

  // ------------------------------------------------------------------ validate (hand-computed cases, A3-MODEL.md)
  function validate() {
    const f = []; const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) f.push(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); };
    const r3 = (x) => (x === null ? null : Number(x.toPrecision(3)));
    eq(allChains().length, 23, "W1 total chains"); eq(["weasel", "owl", "hawk"].map((k) => allChains().filter((c) => c[c.length - 1] === k).length), [8, 6, 9], "W1 chains per top consumer");
    eq(chainsThrough("spider").length, 12, "W2 spider"); eq(chainsThrough("shrew").length, 12, "W3 shrew"); eq(chainsThrough("rabbit").length, 2, "W4 rabbit");
    eq(chainsThrough("aphid").length, 9, "W5 aphid"); eq(chainsThrough("slug").length, 6, "W6 slug");
    const L = { aphid: [2], rabbit: [2], slug: [2], grasshopper: [2], ladybird: [3], spider: [3, 4], bluetit: [3, 4, 5], thrush: [3, 4, 5], shrew: [3, 4, 5], weasel: [3, 4, 5, 6], owl: [4, 5, 6], hawk: [4, 5, 6] };
    for (const [k, v] of Object.entries(L)) eq(levels(k), v, "W7 levels " + k);
    eq(tops().sort(), ["hawk", "owl", "weasel"], "W8 top consumers"); eq(Math.max(...allChains().map((c) => c.length)), 6, "W9 longest chain");
    eq([chainsThrough("wheat").length, chainsThrough("grass").length], [13, 10], "W10 chains from producers"); eq(EDGES.length, 22, "22 arrows");
    eq(widths([20810, 3368, 383, 21]).map(r3), [100, 16.2, 1.84, 0.101], "P1 widths"); eq(shape([20810, 3368, 383, 21]), "upright", "P1 shape");
    eq(widths([4, 21]).map(r3), [19, 100], "P2 widths"); eq(shape([4, 21]), "inverted", "P2 shape");
    eq(widths([200, 150000, 120000, 5]).map(r3), [0.133, 100, 80, 0.00333], "P3 widths"); eq(shape([200, 150000, 120000, 5]), "partly inverted", "P3 shape");
    eq(widths([1500000, 200000, 90000, 1]).map(r3), [100, 13.3, 6, 0.0000667], "P4 widths"); eq(shape([1500000, 200000, 90000, 1]), "upright", "P4 shape");
    eq(widths([809, 37, 11, 1.5]).map(r3), [100, 4.57, 1.36, 0.185], "P5 widths"); eq(shape([809, 37, 11, 1.5]), "upright", "P5 shape");
    eq(check("energy", [1000, 200, 250]).ok, false, "P6"); eq(check("energy", [1000, 1000]).ok, false, "P7");
    eq([check("number", [1, 400, 20]).ok, shape([1, 400, 20])], [true, "partly inverted"], "P8"); eq([check("biomass", [5, 0]).ok, check("biomass", [5, -1]).ok, check("biomass", [5, NaN]).ok], [false, false, false], "P9");
    eq(shape([10, 10, 2]), "upright-equal", "P10");
    for (const s of Object.values(SETS)) eq(shape(s.levels.map((l) => l[1])), s.shape, "data set shape " + s.name);
    const E = efficiency;
    eq(r3(E.pct(20810, 3368)), 16.2, "E1"); eq(20810 - 3368, 17442, "E1 not transferred"); eq(r3(E.pct(3368, 383)), 11.4, "E2"); eq(r3(E.pct(383, 21)), 5.48, "E3");
    eq(r3(E.pct(20810, 21)), 0.101, "E4"); eq(E.forwards(50000, 10, 2).map(r3), [5000, 500], "E5"); eq(E.forwards(15000, 8, 2).map(r3), [1200, 96], "E6");
    eq(E.pct(400, 500), null, "E7"); eq(E.pct(0, 5), null, "E8"); eq(r3(E.pct(1080, 86.4)), 8, "E9"); eq(r3(E.forwards(15000, 8, 3)[2]), 7.68, "c6 fourth level");
    const P = production;
    eq(P.npp(24000, 14400), 9600, "N1"); eq(r3((P.npp(24000, 14400) / 24000) * 100), 40, "N1 %"); eq(P.npp(20810, 11977), 8833, "N2"); eq(r3((8833 / 20810) * 100), 42.4, "N2 %");
    eq(P.gpp(3200, 4800), 8000, "N3"); eq(P.N(3000, 1650, 150, 1000), 200, "N4"); eq(r3((200 / 3000) * 100), 6.67, "N4 %"); eq(P.R(500, 200, 20, 30), 250, "N5");
    const g = P.PRESETS.grazing, h = P.PRESETS.housed; eq(P.N(g.I, g.F, g.U, g.R), 4, "N6"); eq(P.N(h.I, h.F, h.U, h.R), 7, "N7"); eq(r3(((7 - 4) / 4) * 100), 75, "N7 increase");
    eq(P.npp(1000, 1200), null, "N8"); eq(P.N(100, 60, 10, 40), null, "N9"); eq(P.N(1200, 420, 60, 640), 80, "N10"); eq(P.npp(36000, 22680), 13320, "c13");
    eq([near(16.2, 16.18), near(16, 16.18), near(17, 16.18), near(0.1, 0.1009), near(0.2, 0.1009)], [true, true, false, true, false], "answer marking tolerance");
    eq([fmt(17442), fmt(16.184), fmt(0.10091), fmt(96)], ["17 400", "16.2", "0.101", "96.0"], "display rounding (3 s.f.)");
    return f;
  }

  B.energyModel = { web, pyramid, efficiency, production, near, sf3, fmt, LOCKS, lockFor, answered, validate };

  // ================================================================== drawings (B.energyArt)
  const INK = "#16263a", GREY = "#5f6f7f";
  const COL = { prod: ["#e4f3e1", "#2f7d32"], cons: ["#fdf0dc", "#a3620f"], top: ["#fbe3e3", "#a33030"], sel: "#1f66b0", in: "#2f7d32", out: "#b0451c" };
  const tw = (s, fs) => s.length * fs * 0.56 + 22; // approximate box width for a label
  const art = {
    // food web: opts { sel, chain: [keys] | null }
    web(o = {}) {
      const W = 680, H = 470, fs = 15, bh = 32; const sel = o.sel, chain = o.chain || null;
      const box = (n) => ({ w: tw(n.n, fs), h: bh });
      const inChain = (a, b) => chain && chain.some((k, i) => k === a && chain[i + 1] === b);
      // arrow from eaten (a) to eater (b), clipped to the two boxes
      const clip = (o1, o2) => { const b1 = box(o1), b2 = box(o2); const dx = o2.x - o1.x, dy = o2.y - o1.y; const t = (b, s) => Math.min(Math.abs((b.w / 2 + 2) / (dx || 1e-9)), Math.abs((b.h / 2 + 2) / (dy || 1e-9))) * s; const t1 = t(b1, 1), t2 = 1 - t(b2, 1) - 0.0; return [o1.x + dx * t1, o1.y + dy * t1, o1.x + dx * t2, o1.y + dy * t2]; };
      const lines = EDGES.map(([a, b]) => { const A = org(a), Bo = org(b); const [x1, y1, x2, y2] = clip(A, Bo);
        let c = "#9aa8b4", wdt = 1.6, m = "ah"; if (chain) { if (inChain(a, b)) { c = COL.sel; wdt = 3.2; m = "ahs"; } else c = "#d5dce2"; } else if (sel) { if (b === sel) { c = COL.in; wdt = 2.8; m = "ahi"; } else if (a === sel) { c = COL.out; wdt = 2.8; m = "aho"; } else c = "#d5dce2"; }
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${wdt}" marker-end="url(#${m})"/>`; }).join("");
      const nodes = ORGS.map((n) => { const b = box(n); const top = !eatenBy(n.k).length; const [fill, st] = n.p ? COL.prod : top ? COL.top : COL.cons; const on = n.k === sel; const dim = chain ? !chain.includes(n.k) : false;
        return `<g data-org="${n.k}" tabindex="0" role="button" aria-label="${n.n}" style="cursor:pointer${dim ? ";opacity:.45" : ""}"><rect x="${(n.x - b.w / 2).toFixed(1)}" y="${n.y - bh / 2}" width="${b.w.toFixed(1)}" height="${bh}" rx="9" fill="${fill}" stroke="${on ? COL.sel : st}" stroke-width="${on ? 3.2 : 1.6}"/><text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${INK}">${n.n}</text></g>`; }).join("");
      const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Hypothetical farmland food web. Arrows point from each organism to the organism that eats it, the direction of energy transfer." style="max-width:100%;height:auto;background:#fff"><defs>${mk("ah", "#9aa8b4")}${mk("ahs", COL.sel)}${mk("ahi", COL.in)}${mk("aho", COL.out)}</defs>${lines}${nodes}</svg>`;
    },
    // pyramid: { levels: [[name, value]], unit, flagged(set of indexes drawn at minimum width) }
    // pyramid: { levels: [[name, value]], unit, aria, hideBars }. Name and value sit above each bar so that the labels stay
    // at least 12 px whether the drawing is shown beside the controls (about 520 px) or on a phone (about 320 px); a bar
    // under 1 % of the widest is drawn at a minimum width and marked with an asterisk.
    pyramid(o) {
      const v = o.levels.map((l) => l[1]); const w = widths(v); const n = v.length;
      const W = 320, cx = 160, maxW = 300, rh = 56, bh = 28, top = 28; const anySmall = w.some((x) => x < pyramid.MIN_PCT);
      const H = top + n * rh + (anySmall ? 24 : 6);
      const rows = o.levels.map((l, i) => { const y = top + (n - 1 - i) * rh; const small = w[i] < pyramid.MIN_PCT; const bw = Math.max(3, (w[i] / 100) * maxW);
        return `<text x="${cx}" y="${y + 14}" text-anchor="middle" font-size="15" font-weight="600" fill="${INK}">${l[0]}: ${fmtInt(l[1])}${small && !o.hideBars ? " *" : ""}</text>` + (o.hideBars ? `<rect x="${cx - maxW / 2}" y="${y + 20}" width="${maxW}" height="${bh}" fill="none" stroke="#c9d3dc" stroke-dasharray="5 4"/>` : `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y + 20}" width="${bw.toFixed(1)}" height="${bh}" fill="${i === 0 ? COL.prod[0] : COL.cons[0]}" stroke="${i === 0 ? COL.prod[1] : COL.cons[1]}" stroke-width="1.6"/>`); }).join("");
      const foot = anySmall && !o.hideBars ? `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="14" fill="${GREY}">* bar too small to draw to scale</text>` : "";
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${o.aria || "Pyramid"}" style="width:100%;max-width:440px;height:auto;background:#fff;display:block;margin:0 auto"><text x="${cx}" y="17" text-anchor="middle" font-size="14" fill="${GREY}">${o.unit}</text>${rows}${foot}</svg>`;
    },
    // energy bar: parts [[label, value, colour]]; the key is HTML (readable at any width), the bar is SVG
    bar(parts, total, unit) {
      const L = 600; let x = 0; const segs = parts.map(([lab, val, c]) => { const w = (val / total) * L; const r = `<rect x="${x.toFixed(1)}" y="0" width="${Math.max(0, w).toFixed(1)}" height="34" fill="${c}" stroke="#fff" stroke-width="1"/>`; x += w; return r; }).join("");
      const key = parts.map(([lab, val, c]) => `<li style="display:flex;gap:.4rem;align-items:center"><span aria-hidden="true" style="display:inline-block;width:.9rem;height:.9rem;background:${c};border-radius:2px;flex:none"></span>${lab}: ${fmtInt(val)} (${pct(val, total)} %)</li>`).join("");
      return `<svg viewBox="0 0 ${L} 34" width="${L}" role="img" aria-label="Bar showing where the energy goes, in ${unit}" preserveAspectRatio="none" style="width:100%;height:34px;background:#fff;display:block">${segs}</svg><ul class="small" style="list-style:none;padding:0;margin:.4rem 0 0;display:grid;gap:.2rem">${key}</ul>`;
    },
  };
  const pct = (val, total) => { const p = (val / total) * 100; const r = Math.round(p); return Math.abs(p - r) < 1e-9 ? String(r) : String(Number(p.toPrecision(3))); };
  const fmtInt = (x) => (Number.isInteger(x) ? String(x).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : String(x));
  art.fmtInt = fmtInt; art.pct = pct; art.COL = COL;
  B.energyArt = art;
})(window.BIO);
