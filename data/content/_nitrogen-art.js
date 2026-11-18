// Nitrogen cycle models and drawings for 3.3.5.3 The nitrogen cycle (Phase 5 Batch 3, author B2).
// Specification and answer key reviewed before building: scratchpad p5b3/B2-MODEL.md (review MR-B2, changes applied).
//
// B.nitrogenModel
//   cycle    pools and processes of the nitrogen cycle. Every arrow points from the source pool to the product pool:
//            fixR  N2 -> producers      nitrogen fixation, Rhizobium in root nodules of legumes (mutualism)
//            fixF  N2 -> ammonium       nitrogen fixation, free-living bacteria in soil (e.g. Azotobacter)
//            amm   dead -> ammonium     ammonification, saprophytic bacteria and fungi
//            nit1  ammonium -> nitrite  nitrification (oxidation, needs oxygen), e.g. Nitrosomonas
//            nit2  nitrite -> nitrate   nitrification (oxidation, needs oxygen), e.g. Nitrobacter
//            den   nitrate -> N2        denitrification, denitrifying bacteria, anaerobic (waterlogged) soil
//            upt   nitrate -> producers absorption by root hair cells, active transport (not bacterial)
//            feed  producers -> consumers (digestion and assimilation); dieP, dieC to dead organisms and waste.
//            Not modelled: ammonium uptake by plants, lightning, Haber process, leaching, denitrification intermediates.
//            rates(soil, legumes): qualitative levels 0 none, 1 slow, 2 normal, 3 fast (arrow thickness).
//              aerated: nit 2, den 1, upt 2; waterlogged: nit 1, den 3, upt 1 (roots short of oxygen for the aerobic
//              respiration that supplies ATP for active transport). legumes absent: fixR 0; present: fixR 2.
//              fixF, amm, feed, dieP, dieC always 2. The effect of waterlogging on nodules is not modelled.
//            predict(change, guesses): soil aerated->waterlogged: nitrification slower, denitrification faster;
//              waterlogged->aerated: the reverse; legumes absent->present: nitrogen fixation faster (MR-B2 major 1).
//   field    illustrative one-season field model (constants chosen for clarity, not measured):
//            A = S + a*F (S = 100 kg N/ha from soil organic matter; a = 1 artificial, 0.5 manure);
//            U = min(r*A, Umax) (r = 0.8, Umax = 200); X = A - U; L = k*X (k = 0.2 dry, 0.6 heavy rain);
//            soil = X - L; Y = 100*U/Umax (% of maximum yield); manure organic N kept = (1 - a)*F;
//            risk: L < 20 low, < 60 moderate, otherwise high (illustrative categories). Harvest removes U.
//   lake     eight stages of eutrophication with relative levels 0 to 3 (illustrative, not measurements).
//   compare  13 statements sorted into carbon only, nitrogen only or both (key reviewed in MR-B2).
//   answered(qid) a question counts as answered with full marks, a self-marked attempt, or two attempts.
//   validate() returns the failures of the hand-worked test cases in B2-MODEL.md; [] when all pass.
// Sources (checked 17 November 2026): OxfordAQA 9610 specification v5.1, 3.3.5.3; OpenStax Biology 2e (2018), 46.3.
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ cycle
  const POOLS = {
    air: { n: "Nitrogen gas in the air", f: "N₂" },
    prod: { n: "Producers (plants)", f: "proteins, nucleic acids" },
    cons: { n: "Consumers (animals)", f: "proteins, nucleic acids" },
    dead: { n: "Dead organisms and waste", f: "faeces, urine (urea)" },
    nh4: { n: "Ammonium ions", f: "NH₄⁺ in the soil" },
    no2: { n: "Nitrite ions", f: "NO₂⁻" },
    no3: { n: "Nitrate ions", f: "NO₃⁻ in the soil" },
  };
  const PROC = [
    { k: "fixR", from: "air", to: "prod", name: "Nitrogen fixation", bact: true, who: "Rhizobium bacteria, living in root nodules of legumes such as clover, peas and beans", what: "Nitrogen gas is converted into ammonia, which the plant uses to make amino acids. The plant supplies the bacteria with carbohydrates: both benefit (mutualism).", cond: "Only where legumes grow." },
    { k: "fixF", from: "air", to: "nh4", name: "Nitrogen fixation", bact: true, who: "Free-living nitrogen-fixing bacteria in the soil (for example Azotobacter)", what: "Nitrogen gas is converted into ammonia, which forms ammonium ions in the soil.", cond: "Bacteria in the soil, not inside a plant." },
    { k: "amm", from: "dead", to: "nh4", name: "Ammonification", bact: true, who: "Saprophytic bacteria and fungi (decomposers)", what: "They break down proteins, nucleic acids and urea in dead organisms and waste, releasing ammonia, which forms ammonium ions.", cond: "Wherever there is dead organic matter." },
    { k: "nit1", from: "nh4", to: "no2", name: "Nitrification", bact: true, who: "Nitrifying bacteria (for example Nitrosomonas)", what: "Ammonium ions are oxidised to nitrite ions.", cond: "Needs oxygen: aerated soil." },
    { k: "nit2", from: "no2", to: "no3", name: "Nitrification", bact: true, who: "Nitrifying bacteria (for example Nitrobacter)", what: "Nitrite ions are oxidised to nitrate ions.", cond: "Needs oxygen: aerated soil." },
    { k: "den", from: "no3", to: "air", name: "Denitrification", bact: true, who: "Denitrifying bacteria", what: "Nitrate ions are converted into nitrogen gas, which returns to the air. This lowers the nitrate in the soil.", cond: "Anaerobic conditions, for example waterlogged soil." },
    { k: "upt", from: "no3", to: "prod", name: "Absorption by roots", bact: false, who: "Root hair cells of plants", what: "Nitrate ions are absorbed by active transport and used to make amino acids, proteins and nucleotides (DNA, RNA, ATP).", cond: "Active transport needs ATP from aerobic respiration in the root cells." },
    { k: "feed", from: "prod", to: "cons", name: "Feeding", bact: false, who: "Consumers", what: "Proteins and nucleic acids in food are digested; the products are absorbed and assimilated into the consumer's own molecules.", cond: "" },
    { k: "dieP", from: "prod", to: "dead", name: "Death", bact: false, who: "", what: "Dead plants and fallen leaves add organic nitrogen to the dead matter.", cond: "" },
    { k: "dieC", from: "cons", to: "dead", name: "Death, excretion", bact: false, who: "", what: "Dead animals, faeces and urine (containing urea) add nitrogen compounds to the dead matter and waste.", cond: "" },
  ];
  const proc = (k) => PROC.find((p) => p.k === k);
  function rates(soil = "aerated", legumes = "absent") {
    const wet = soil === "waterlogged";
    return { fixR: legumes === "present" ? 2 : 0, fixF: 2, amm: 2, nit1: wet ? 1 : 2, nit2: wet ? 1 : 2, den: wet ? 3 : 1, upt: wet ? 1 : 2, feed: 2, dieP: 2, dieC: 2 };
  }
  const nitrateText = (soil) => (soil === "waterlogged" ? "falls: less is made by nitrification and more is converted into nitrogen gas by denitrification" : "kept up by nitrification");
  // change: "wet" (aerated -> waterlogged), "dry" (waterlogged -> aerated), "legume" (absent -> present)
  const KEY = { wet: { nit: "slower", den: "faster" }, dry: { nit: "faster", den: "slower" }, legume: { fix: "faster" } };
  const predict = (change, g) => { const k = KEY[change]; return Object.keys(k).every((p) => g[p] === k[p]); };
  const cycle = { POOLS, PROC, proc, rates, nitrateText, KEY, predict, BACT: PROC.filter((p) => p.bact).map((p) => p.k) };

  // ------------------------------------------------------------------ field (illustrative constants)
  const FIELD = { S: 100, a: { artificial: 1, natural: 0.5 }, r: 0.8, Umax: 200, k: { dry: 0.2, heavy: 0.6 }, Fmax: 300, step: 25 };
  function field(type, F, weather) {
    const a = FIELD.a[type], k = FIELD.k[weather];
    if (a === undefined || k === undefined || !(F >= 0) || F > FIELD.Fmax) return null;
    const A = FIELD.S + a * F; const U = Math.min(FIELD.r * A, FIELD.Umax); const X = A - U; const L = k * X;
    const r = (x) => Math.round(x * 1e6) / 1e6;
    return { A: r(A), U: r(U), X: r(X), L: r(L), soil: r(X - L), Y: r((100 * U) / FIELD.Umax), organic: type === "natural" ? r((1 - a) * F) : 0, risk: L < 20 ? "low" : L < 60 ? "moderate" : "high" };
  }

  // ------------------------------------------------------------------ lake (eutrophication stages, relative 0 to 3)
  const VARS = ["nitrate", "algae", "light", "plants", "dead", "bacteria", "oxygen", "fish"];
  const STAGES = [
    { t: "Before: nitrate (or phosphate) is the limiting factor for the growth of algae.", v: [1, 1, 3, 3, 1, 1, 3, 3] },
    { t: "Nitrate from fertiliser is leached from the fields into the lake.", v: [3, 1, 3, 3, 1, 1, 3, 3] },
    { t: "Algae grow and reproduce rapidly, forming an algal bloom at the surface.", v: [3, 3, 3, 3, 1, 1, 3, 3] },
    { t: "The bloom blocks light from reaching the plants below the surface.", v: [3, 3, 1, 3, 1, 1, 3, 3] },
    { t: "The plants below cannot photosynthesise enough (light is limiting) and die; many algae die too.", v: [3, 2, 1, 0, 3, 1, 3, 3] },
    { t: "Saprophytic bacteria decompose the dead plants and algae, and their population increases.", v: [3, 2, 1, 0, 3, 3, 3, 3] },
    { t: "The bacteria use up the dissolved oxygen in aerobic respiration.", v: [3, 2, 1, 0, 3, 3, 1, 3] },
    { t: "Fish and other aerobic organisms die from lack of oxygen.", v: [3, 2, 1, 0, 3, 3, 1, 0] },
  ];
  const lake = { VARS, STAGES, at: (i) => Object.fromEntries(VARS.map((k, j) => [k, STAGES[i].v[j]])) };

  // ------------------------------------------------------------------ compare (carbon v nitrogen cycles)
  const ITEMS = [
    { s: "Saprophytic microorganisms release it from dead organisms and waste.", k: "both", why: "Carbon is released as carbon dioxide in their respiration; nitrogen as ammonia, forming ammonium ions (ammonification)." },
    { s: "Producers incorporate it into organic molecules.", k: "both", why: "Carbon into sugars and every other organic molecule; nitrogen into amino acids and nucleotides." },
    { s: "Digestion and assimilation pass it along food chains.", k: "both", why: "Both elements are in the organic molecules that consumers digest, absorb and assimilate." },
    { s: "It is found in every amino acid and every nucleotide.", k: "both", why: "Amino acids and nucleotides contain both carbon and nitrogen." },
    { s: "Photosynthesis removes it from the atmosphere.", k: "carbon", why: "Producers fix carbon dioxide in photosynthesis." },
    { s: "Plants and animals return it to the air as a gas in respiration.", k: "carbon", why: "Respiration releases carbon dioxide. Plants and animals do not release nitrogen gas." },
    { s: "Its concentration in the air rises and falls each year because of photosynthesis and respiration.", k: "carbon", why: "The yearly fluctuation in carbon dioxide concentration." },
    { s: "Methane, one of its compounds, is released by microorganisms in waterlogged soils and enhances the greenhouse effect.", k: "carbon", why: "Methane (CH₄) contains carbon." },
    { s: "Bacteria convert the gas that makes up most of the air into ammonia.", k: "nitrogen", why: "Nitrogen fixation." },
    { s: "Plant roots absorb it from the soil as ions, by active transport.", k: "nitrogen", why: "Nitrate (and ammonium) ions. Land plants take their carbon from the air, not the soil." },
    { s: "Bacteria in aerated soil oxidise one of its ions to another.", k: "nitrogen", why: "Nitrification: ammonium to nitrite, then nitrite to nitrate." },
    { s: "Bacteria in waterlogged soil convert its ions into the gas that makes up most of the air.", k: "nitrogen", why: "Denitrification: nitrate to nitrogen gas." },
    { s: "Its ions in artificial fertiliser are leached from fields into rivers and can cause eutrophication.", k: "nitrogen", why: "Nitrate ions are very soluble and are easily leached." },
  ];
  const compare = { ITEMS, score: (ans) => ITEMS.reduce((n, it, i) => n + (ans[i] === it.k ? 1 : 0), 0), complete: (ans) => ITEMS.every((_, i) => !!ans[i]) };

  const answered = (qid) => { try { const a = B.store.get().attempts.filter((x) => x.qid === qid); return a.some((x) => x.score === x.max || x.mode === "self") || a.length >= 2; } catch (e) { return false; } };

  // ------------------------------------------------------------------ validate (hand-worked cases, B2-MODEL.md)
  function validate() {
    const f = []; const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) f.push(`${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); };
    const pick = (o, ks) => ks.map((k) => o[k]);
    const R = ["fixR", "fixF", "amm", "nit1", "nit2", "den", "upt"];
    eq(pick(rates("aerated", "absent"), R), [0, 2, 2, 2, 2, 1, 2], "N1"); eq(/kept up/.test(nitrateText("aerated")), true, "N1 nitrate");
    eq(pick(rates("waterlogged", "absent"), R), [0, 2, 2, 1, 1, 3, 1], "N2"); eq(/^falls/.test(nitrateText("waterlogged")), true, "N2 nitrate");
    eq(pick(rates("aerated", "present"), R), [2, 2, 2, 2, 2, 1, 2], "N3");
    eq(pick(rates("waterlogged", "present"), R), [2, 2, 2, 1, 1, 3, 1], "N4");
    eq(cycle.BACT, ["fixR", "fixF", "amm", "nit1", "nit2", "den"], "N5 bacterial"); eq(PROC.filter((p) => !p.bact).map((p) => p.k), ["upt", "feed", "dieP", "dieC"], "N5 not bacterial");
    eq(PROC.filter((p) => p.to === "air").map((p) => p.k), ["den"], "N6 only denitrification ends at air");
    eq(PROC.filter((p) => p.from === "air").map((p) => p.k), ["fixR", "fixF"], "N6 fixation starts at air");
    eq(PROC.some((p) => (p.from === "no3" && p.to === "nh4") || (p.from === "nh4" && p.to === "air")), false, "N6 no reversed arrows");
    eq(PROC.filter((p) => /fixation/i.test(p.name)).some((p) => p.to === "no2" || p.to === "no3"), false, "N6 fixation never gives nitrite or nitrate");
    eq(PROC.filter((p) => /^Nitrification/.test(p.name)).some((p) => p.from === "no3"), false, "N6 nitrification never starts at nitrate");
    eq([predict("wet", { nit: "slower", den: "faster" }), predict("wet", { nit: "faster", den: "faster" }), predict("wet", { nit: "slower", den: "no change" })], [true, false, false], "N7");
    eq([predict("legume", { fix: "faster" }), predict("legume", { fix: "no change" }), predict("legume", { fix: "slower" })], [true, false, false], "N8 (MR-B2)");
    eq(["Nitrogen fixation", "Ammonification", "Nitrification", "Denitrification"].map((n) => PROC.filter((p) => p.name === n).length), [2, 1, 2, 1], "N9");
    try { const svg = art.quiz(); eq(/fixation|ammonification|nitrification|denitrification|rhizobium|azotobacter|nitrosomonas|nitrobacter|absorption|feeding/i.test(svg), false, "N10 quiz drawing gives no answers"); } catch (e) { f.push("N10 " + e.message); }
    const F = (t, n, w) => { const o = field(t, n, w); return [o.A, o.U, o.X, o.L, o.soil, o.Y, o.organic, o.risk]; };
    eq(F("artificial", 0, "dry"), [100, 80, 20, 4, 16, 40, 0, "low"], "F1");
    eq(F("artificial", 150, "dry"), [250, 200, 50, 10, 40, 100, 0, "low"], "F2");
    eq(F("artificial", 150, "heavy"), [250, 200, 50, 30, 20, 100, 0, "moderate"], "F3");
    eq(F("artificial", 300, "heavy"), [400, 200, 200, 120, 80, 100, 0, "high"], "F4");
    eq(F("natural", 150, "dry"), [175, 140, 35, 7, 28, 70, 75, "low"], "F5");
    eq(F("natural", 300, "heavy"), [250, 200, 50, 30, 20, 100, 150, "moderate"], "F6");
    eq(F("artificial", 100, "heavy"), [200, 160, 40, 24, 16, 80, 0, "moderate"], "F7");
    eq(F("artificial", 225, "dry"), [325, 200, 125, 25, 100, 100, 0, "moderate"], "F8");
    eq([field("artificial", 300, "heavy").Y - field("artificial", 150, "heavy").Y, field("artificial", 300, "heavy").L / field("artificial", 150, "heavy").L], [0, 4], "F9");
    eq(F("artificial", 0, "heavy"), [100, 80, 20, 12, 8, 40, 0, "low"], "F10");
    for (const t of ["artificial", "natural"]) for (const w of ["dry", "heavy"]) for (let n = 0; n <= 300; n += 25) { const o = field(t, n, w); if (!(o.U <= 200 && o.Y <= 100 && o.L >= 0 && o.soil >= 0 && Math.abs(o.L + o.soil + o.U - o.A) < 1e-9)) f.push(`field conservation ${t} ${n} ${w}`); }
    eq([field("artificial", -25, "dry"), field("artificial", 325, "dry"), field("other", 50, "dry")], [null, null, null], "field refuses invalid input");
    const S = STAGES.map((s) => s.v); const col = (j) => S.map((r) => r[j]); const firstChange = (j) => col(j).findIndex((x, i) => i > 0 && x !== col(j)[i - 1]);
    eq(col(0).every((x, i) => i === 0 || x >= col(0)[i - 1]), true, "L1 nitrate never falls");
    eq(firstChange(2) >= firstChange(1), true, "L2 light falls after algae rise");
    eq(firstChange(3) > firstChange(2), true, "L3 plants die after light falls");
    eq(firstChange(5) > firstChange(4), true, "L4 bacteria rise after dead matter rises");
    eq(firstChange(6) > firstChange(5), true, "L5 oxygen falls after bacteria rise");
    eq(firstChange(7) > firstChange(6), true, "L6 fish die after oxygen falls");
    eq(col(6).map((x, i) => (i > 0 && x !== col(6)[i - 1] ? i : -1)).filter((i) => i >= 0), [6], "L7 oxygen changes only at stage 6");
    eq(STAGES.length, 8, "L8 eight stages");
    eq(["both", "carbon", "nitrogen"].map((k) => ITEMS.filter((i) => i.k === k).length), [4, 4, 5], "C1 key counts");
    eq(compare.score(ITEMS.map((i) => i.k)), 13, "C2 all correct");
    eq(compare.complete(ITEMS.map((i, j) => (j === 3 ? "" : i.k))), false, "C3 incomplete");
    { const a = ITEMS.map((i) => i.k); a[5] = "both"; eq(compare.score(a), 12, "C4 item 6 as both is wrong"); }
    { const a = ITEMS.map((i) => i.k); a[0] = "nitrogen"; eq(compare.score(a), 12, "C5 item 1 as nitrogen is wrong"); }
    return f;
  }

  // ================================================================== drawings (B.nitrogenArt)
  const INK = "#16263a", GREY = "#5f6f7f", BAC = "#1c7c7c", OTH = "#6b7c88", SEL = "#1f66b0";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 16}" font-weight="${o.w || 600}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}>${s}</text>`;
  const mk = (id, c, sz = 13) => `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="${sz}" markerHeight="${sz}" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  let uidN = 0; const uid = () => "n" + (++uidN).toString(36) + Math.random().toString(36).slice(2, 5);
  const BOX = { air: [400, 36, 400, 52], prod: [150, 160, 250, 60], cons: [130, 305, 210, 60], dead: [160, 435, 250, 60], nh4: [560, 435, 190, 60], no2: [600, 310, 180, 60], no3: [580, 180, 180, 60] };
  const FILL = { air: ["#e8f1fb", "#3d6fa8"], prod: ["#e4f3e1", "#2f7d32"], cons: ["#fdf0dc", "#a3620f"], dead: ["#efe6da", "#7a5a3a"], nh4: ["#f3eefa", "#6c4b9a"], no2: ["#f3eefa", "#6c4b9a"], no3: ["#f3eefa", "#6c4b9a"] };
  // arrow geometry: path, pill centre, pill lines
  const GEO = {
    fixR: { d: "M255 62 L185 128", p: [105, 95], l: ["Nitrogen fixation", "Rhizobium (legumes)"] },
    fixF: { d: "M600 36 H775 Q815 36 815 76 V395 Q815 435 775 435 H657", p: [815, 240], l: ["Nitrogen", "fixation"] },
    amm: { d: "M287 435 L461 435", p: [375, 435], l: ["Ammonification"] },
    nit1: { d: "M582 404 L596 343", p: [640, 374], l: ["Nitrification"] },
    nit2: { d: "M598 279 L586 213", p: [640, 246], l: ["Nitrification"] },
    den: { d: "M598 149 L558 65", p: [640, 100], l: ["Denitrification"] },
    upt: { d: "M488 178 L278 163", p: [383, 171], l: ["Absorption"] },
    feed: { d: "M100 192 L100 273", p: [100, 233], l: ["Feeding"] },
    dieP: { d: "M255 192 L255 403", p: [255, 362], l: ["Death"] },
    dieC: { d: "M130 337 L130 403", p: [130, 372], l: ["Death, excretion"] },
  };
  const pillW = (l) => Math.max(...l.map((s) => s.length)) * 15 * 0.56 + 18;
  const art = {
    // full cycle. o = { sel: process key, rates: {k: level}, labels: true, legumesAbsent: bool }
    cycle(o = {}) {
      const id = uid(); const W = 870, H = 500; const rt = o.rates || rates();
      const pools = Object.entries(BOX).map(([k, [cx, cy, w, h]]) => { const [fill, st] = FILL[k]; const p = POOLS[k];
        return `<g><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${st}" stroke-width="2"/>${T(cx, cy - 4, p.n)}${T(cx, cy + 17, p.f, { s: 15, w: 500, c: GREY })}</g>`; }).join("");
      const arrows = PROC.map((p) => { const g = GEO[p.k]; const lv = rt[p.k]; const on = o.sel === p.k; const base = p.bact ? BAC : OTH; const c = on ? SEL : base;
        const sw = lv === 0 ? 1.6 : [0, 2, 3.6, 6.5][lv]; const m = on ? "s" : p.bact ? "b" : "o";
        const line = lv === 0 ? `<path d="${g.d}" fill="none" stroke="#b9c4cc" stroke-width="1.6" stroke-dasharray="6 5"/>` : `<path d="${g.d}" fill="none" stroke="${c}" stroke-width="${sw}" marker-end="url(#${id}${m})"/>`;
        const pw = pillW(g.l), ph = g.l.length * 18 + 8; const [px, py] = g.p;
        const pill = `<rect x="${(px - pw / 2).toFixed(1)}" y="${py - ph / 2}" width="${pw.toFixed(1)}" height="${ph}" rx="9" fill="#fff" stroke="${on ? SEL : lv === 0 ? "#c9d3dc" : base}" stroke-width="${on ? 2.4 : 1.3}"/>` + g.l.map((s, i) => T(px, py - ph / 2 + 18 + i * 18, s, { s: i === 0 ? 15 : 14, w: i === 0 ? 700 : 500, c: lv === 0 ? "#8a98a4" : i === 0 ? (on ? SEL : INK) : GREY })).join("");
        return `<g data-proc="${p.k}" tabindex="0" role="button" aria-label="${p.name}: from ${POOLS[p.from].n.toLowerCase()} to ${POOLS[p.to].n.toLowerCase()}${lv === 0 ? " (not happening: no legumes)" : ""}" style="cursor:pointer"><path d="${g.d}" fill="none" stroke="transparent" stroke-width="22"/>${line}${pill}</g>`; }).join("");
      const legend = `<g>${T(20, 494, "Teal arrows: carried out by bacteria (ammonification also by fungi). Grey: not bacterial.", { a: "start", s: 14, w: 500, c: GREY })}</g>`;
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="The nitrogen cycle. Each arrow points from a source to its product; select an arrow to read about the process." style="max-width:100%;height:auto;background:#fff"><defs>${mk(id + "b", BAC)}${mk(id + "o", OTH)}${mk(id + "s", SEL)}</defs>${pools}${arrows}${legend}</svg>`;
    },
    // numbered drawing for the labelling question: no process names, no Rhizobium arrow (MR-B2 major 2)
    quiz() {
      const id = uid(); const C = "#55636e";
      const box = (cx, cy, w, s, sub) => `<rect x="${cx - w / 2}" y="${cy - 26}" width="${w}" height="52" rx="11" fill="#f4f7f9" stroke="#7b8a96" stroke-width="2"/>${T(cx, cy + (sub ? -3 : 8), s, { s: 22, w: 700 })}${sub ? T(cx, cy + 20, sub, { s: 20, w: 500, c: GREY }) : ""}`;
      const ar = (d) => `<path d="${d}" fill="none" stroke="${C}" stroke-width="3" marker-end="url(#${id})"/>`;
      const num = (x, y, n) => `<circle cx="${x}" cy="${y}" r="17" fill="#fff" stroke="${INK}" stroke-width="2.2"/>${T(x, y + 7, n, { s: 20, w: 800 })}`;
      return `<svg viewBox="0 0 650 440" width="650" role="img" aria-label="Nitrogen cycle with six numbered arrows to name" style="max-width:100%;height:auto;background:#fff"><defs>${mk(id, C)}</defs>
        ${ar("M470 34 H590 Q622 34 622 66 V363 Q622 395 590 395 H480")}${ar("M242 395 L362 395")}${ar("M432 369 L460 309")}${ar("M470 254 L456 189")}${ar("M462 134 L424 62")}${ar("M394 160 L204 145")}${ar("M80 166 L80 242")}${ar("M190 166 L190 366")}${ar("M90 296 L90 366")}
        <path d="M534 372 H552 V182 H534" fill="none" stroke="${INK}" stroke-width="2"/>
        ${box(320, 34, 290, "N₂ in the air")}${box(105, 140, 190, "Producers")}${box(95, 270, 170, "Consumers")}${box(125, 395, 230, "Dead matter, waste")}${box(420, 395, 116, "NH₄⁺", "ammonium")}${box(475, 280, 104, "NO₂⁻", "nitrite")}${box(452, 160, 104, "NO₃⁻", "nitrate")}
        ${num(622, 215, 1)}${num(302, 395, 2)}${num(572, 277, 3)}${num(443, 98, 4)}${num(299, 152, 5)}${num(80, 204, 6)}</svg>`.replace(/\s*\n\s*/g, " ");
    },
    // field cross-section. o = field() result plus { type, F, weather }
    field(o) {
      const W = 560, H = 330, ground = 150, Y = o ? o.Y : 0; const plantH = 18 + (Y / 100) * 62;
      const plants = Array.from({ length: 9 }, (_, i) => { const x = 40 + i * 42; return `<path d="M${x} ${ground} V${ground - plantH}" stroke="#3f8a3a" stroke-width="3"/><path d="M${x} ${ground - plantH * 0.55} q-14 -8 -18 -20 M${x} ${ground - plantH * 0.75} q14 -8 18 -20" stroke="#3f8a3a" stroke-width="2.5" fill="none"/><ellipse cx="${x}" cy="${ground - plantH - 6}" rx="4.5" ry="9" fill="#c9a43a"/><path d="M${x} ${ground} l-10 34 M${x} ${ground} l2 44 M${x} ${ground} l10 32" stroke="#a7825a" stroke-width="1.6" fill="none"/>`; }).join("");
      const rain = o && o.weather === "heavy" ? Array.from({ length: 22 }, (_, i) => `<line x1="${20 + (i * 19) % 400}" y1="${8 + (i * 13) % 40}" x2="${14 + (i * 19) % 400}" y2="${22 + (i * 13) % 40}" stroke="#4f86c6" stroke-width="2"/>`).join("") : "";
      const Lw = o ? Math.min(26, 2 + o.L / 5) : 2;
      const river = o ? { low: "#7fb2dc", moderate: "#7fbfa4", high: "#5d9e4a" }[o.risk] : "#7fb2dc";
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Field with a crop, the soil below and a river at the side; the arrow below the roots shows nitrate being leached towards the river" style="max-width:100%;height:auto;background:#fff">
        <defs><marker id="fld-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" markerUnits="strokeWidth" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#2f6fb0"/></marker></defs>
        <rect x="0" y="0" width="${W}" height="${ground}" fill="#f4f9fd"/>${rain}
        <rect x="0" y="${ground}" width="${W}" height="${H - ground}" fill="#efe3d1"/><rect x="0" y="${ground + 120}" width="${W}" height="${H - ground - 120}" fill="#e2d2bb"/>
        <path d="M430 ${ground} Q470 ${ground + 8} 500 ${ground + 4} L${W} ${ground + 4} L${W} ${ground + 70} L430 ${ground + 70} Z" fill="#efe3d1"/>
        <rect x="440" y="${ground + 6}" width="${W - 440}" height="46" fill="${river}"/>
        ${plants}
        <path d="M200 ${ground + 70} C 260 ${ground + 140}, 360 ${ground + 120}, 446 ${ground + 36}" fill="none" stroke="#2f6fb0" stroke-width="${Lw.toFixed(1)}" stroke-opacity=".8" marker-end="url(#fld-a)"/>
        ${T(20, ground + 100, "Soil", { a: "start", s: 20, c: "#6a4a2a" })}${T(498, ground + 36, "River", { s: 20, c: "#123a5a" })}${T(20, H - 12, "Below the roots", { a: "start", s: 19, w: 500, c: "#6a4a2a" })}
        ${T(320, ground + 142, "Nitrate leached", { s: 20, c: "#1f4f86" })}${T(20, 26, o && o.weather === "heavy" ? "Heavy rain soon after spreading" : "Dry weeks after spreading", { a: "start", s: 19, w: 600, c: "#2f4f6f" })}
      </svg>`.replace(/\s*\n\s*/g, " ");
    },
    // lake cross-section at stage i
    lake(i) {
      const v = lake.at(i); const W = 560, H = 330, surf = 70;
      const algaeH = [0, 4, 10, 22][v.algae]; const lightDepth = [0, 40, 120, 220][v.light];
      const rays = [120, 200, 280, 360].map((x) => `<line x1="${x}" y1="${surf}" x2="${x - 18}" y2="${surf + lightDepth}" stroke="#f2c230" stroke-width="3" stroke-dasharray="7 6" opacity=".9"/>`).join("");
      const plant = (x) => { const c = v.plants ? "#3f8a3a" : "#8a6a42"; return `<path d="M${x} 300 C ${x - 10} 270, ${x + 10} 250, ${x} 220 M${x} 280 q-16 -6 -20 -18 M${x} 255 q16 -6 20 -18" stroke="${c}" stroke-width="3" fill="none"/>`; };
      const deadH = [0, 4, 8, 14][v.dead];
      const bact = Array.from({ length: [0, 3, 6, 18][v.bacteria] }, (_, j) => `<ellipse cx="${150 + (j * 37) % 260}" cy="${300 - deadH - 6 - ((j * 7) % 14)}" rx="4" ry="2.4" fill="#7b3f98"/>`).join("");
      const fish = (x, y) => (v.fish ? `<g><path d="M${x} ${y} q18 -12 36 0 q-18 12 -36 0 z" fill="#d9772b"/><path d="M${x + 36} ${y} l10 -7 v14 z" fill="#d9772b"/><circle cx="${x + 8}" cy="${y - 2}" r="1.8" fill="#16263a"/></g>` : `<g transform="translate(0,${surf + 6 - y})"><path d="M${x} ${y} q18 12 36 0 q-18 -12 -36 0 z" fill="#b8a49a"/><path d="M${x + 36} ${y} l10 7 v-14 z" fill="#b8a49a"/></g>`);
      const oxH = (v.oxygen / 3) * 160;
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Lake at stage ${i} of eutrophication" style="max-width:100%;height:auto;background:#fff">
        <rect x="0" y="0" width="${W}" height="${surf}" fill="#f4f9fd"/><circle cx="60" cy="34" r="20" fill="#f6c945"/>
        <path d="M0 ${surf} H460 V300 Q440 316 410 316 H40 Q0 316 0 290 Z" fill="#cfe6f5"/>
        ${rays}<rect x="0" y="${surf}" width="460" height="${algaeH}" fill="#4f9a3a" opacity=".85"/>
        ${[110, 190, 270, 350].map(plant).join("")}<rect x="40" y="${300 - deadH}" width="380" height="${deadH}" fill="#8a6a42"/>${bact}
        ${fish(120, 160)}${fish(300, 190)}
        ${v.nitrate === 3 ? `<path d="M0 ${surf + 26} h46" stroke="#2f6fb0" stroke-width="7" marker-end="url(#lk-a)"/>` : ""}
        <defs><marker id="lk-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" markerUnits="strokeWidth" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#2f6fb0"/></marker></defs>
        <rect x="488" y="110" width="36" height="160" rx="6" fill="#fff" stroke="#7b8a96" stroke-width="2"/><rect x="491" y="${267 - oxH + 3}" width="30" height="${Math.max(0, oxH - 3)}" rx="4" fill="#2f6fb0"/>
        ${T(506, 82, "Dissolved", { s: 14 })}${T(506, 98, "oxygen", { s: 14 })}${T(506, 292, ["none", "low", "medium", "high"][v.oxygen], { s: 14, w: 500, c: GREY })}
        ${v.algae >= 2 ? `<text x="230" y="${surf + algaeH + 20}" text-anchor="middle" font-size="16" font-weight="600" fill="#255d1c" stroke="#cfe6f5" stroke-width="5" paint-order="stroke">Algal bloom</text>` : ""}${T(230, 324, v.dead >= 2 ? "Dead matter with saprophytic bacteria" : "Lake bed", { s: 15, w: 500, c: "#5a3f22" })}
        ${v.nitrate === 3 ? T(8, surf + 54, "Nitrate in", { a: "start", s: 15, c: "#1f4f86" }) : ""}
      </svg>`.replace(/\s*\n\s*/g, " ");
    },
  };
  B.nitrogenArt = art;
  B.nitrogenModel = { cycle, field, FIELD, lake, compare, answered, validate };
})(window.BIO);
