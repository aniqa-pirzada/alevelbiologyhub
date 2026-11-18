// Photosynthesis rate model for 3.3.2.3 and RP7 (Phase 5 Batch 1, author U3).
// B.photoModel: ONE illustrative model behind the 3.3.2.3 Photosynthesis Rate Simulator, the Experimental Data Challenge,
// the RP7 virtual bench (bubble counts), its tables, rates, graph, Spearman's rank test and every worked answer that uses
// simulated data. It is a TEACHING MODEL: it reproduces the shapes the 9610 specification asks students to explain, and
// says nothing about the exact rate of any real plant. Every page that uses it labels its numbers "simulated".
//
// PRINCIPLE (3.3.2.3.s1). Blackman's principle of limiting factors: at any moment the rate is set by the factor in shortest
// supply relative to what the plant could use. Three capacities, each in relative units (0 to about 100):
//   L(I)  light-limited capacity: the rate the light-dependent reaction can support (ATP and reduced NADP); rises almost
//         linearly at low light and levels off (a non-rectangular hyperbola: initial slope 2.2 per unit of light,
//         maximum 110, curvature 0.75). Light intensity I in arbitrary units, 0 to 100 (RP7 lamp distances can exceed 100
//         at 5 cm; the curve simply stays near its maximum).
//   C(c)  carbon dioxide capacity: the rate the supply of CO2 to rubisco can support; a rectangular hyperbola
//         c / (c + 0.08 %), scaled so that 0.15 % (the top of the simulator range) gives 100. 0.04 % (about the
//         atmospheric value) gives 51, so on a bright day CO2 is often limiting (standard C3 behaviour: doubling CO2
//         from 0.04 to 0.08 % raises the light-saturated rate about 1.5 times).
//   T(t)  temperature capacity: the rate the enzymes of the light-independent reaction, including rubisco, can support.
//         Rises with temperature (Q10 1.6, so 1.6 times faster per 10 °C) and falls steeply above about 33 °C as the
//         enzymes denature (a logistic loss of active enzyme, half lost at 36 °C, width 2.5 °C). Scaled so that its
//         maximum is 100; the optimum of this model plant is about 31 °C. Real optima differ between species.
//   rate = smooth minimum of L, C and T (pairwise non-rectangular minimum, curvature 0.98), so a curve rises while its
//   factor limits and then levels off (a plateau) when another factor becomes limiting; the corner is slightly rounded,
//   as in real data. The temperature curve rises to an optimum and then falls: it never rises indefinitely.
// LIMITING FACTOR shown to students: the smallest of L, C and T. If the second smallest is within 8 % of it, both are
// named ("two factors are close to limiting"). Temperature above the optimum is named "temperature (too high)".
// It does NOT model: photorespiration, stomata, the CO2 compensation point, light damage, water stress, mineral ions,
// acclimation, differences between C3 and C4 plants, or any interaction beyond the minimum rule. Rates are RELATIVE: the
// model claims no universal fixed rate of photosynthesis.
//
// RP7 (OxfordAQA 9610 Practical Handbook (2019), Exemplar for Required Practical 7, pp. 77–79): an aquatic plant (about
// 5 cm) in a boiling tube of 1 % sodium hydrogen carbonate in front of a lamp at a distance d of 5 to 30 cm.
//   light at the plant = 40 × (10 / d)² × lamp factor + 1.5 (room light). 40 units at 10 cm; the 1/d² law treats the
//     bulb as a point source (an assumption students evaluate). Lamp factor 1 for the trialled bulb; 0.3 for an
//     energy-saving bulb that gives poor results (the handbook teachers' notes: "some energy saving bulbs do not give
//     particularly good results").
//   1 % sodium hydrogen carbonate = a plentiful CO2 supply (0.15 % on the simulator scale); "water only" (a method error
//     the bench allows) = 0.012 %, so CO2 limits strongly.
//   water temperature 22 °C, drifting ±0.3 °C between runs (seeded). Warming by the lamp is NOT modelled.
//   material (handbook teachers' notes): fresh Cabomba (capacity 1.0; recommended, "much more reliable and bubbles more
//     quickly"); Cabomba kept in the lab for some time (capacity 0.5 and falling 1 % per minute of the session: "its
//     photosynthetic ability decreases with time, so fresh material should be used"); Elodea pre-illuminated 2–3 h in
//     dilute sodium hydrogen carbonate (capacity 0.7); Elodea not pre-illuminated (capacity 0.25 rising towards 0.7 with
//     a time constant of 25 min: few bubbles at first). Each piece of plant has its own factor 0.85–1.15 (seeded).
//   bubbles per minute (steady) = 0.6 × max(0, capacity × rate − 3); the 3 units stand for oxygen used in the plant's
//     own respiration, so no bubbles form in very dim light. About 30 bubbles min⁻¹ at 10 cm for fresh Cabomba.
//   After the lamp is moved, the bubbling rate moves to its new value with a time constant of 1.2 min (95 % after about
//     3.6 min), which is why the handbook leaves the plant for 5 minutes before counting.
//   Bubbles leave the cut end as a renewal process: each gap is gamma-distributed (shape 6, so bubbling is fairly
//     regular) with mean 60 / rate seconds; bubble sizes vary (cosmetic, and a point for evaluation) and the rate
//     wobbles slowly by up to ±4 % (seeded sine). A count is the whole number of bubbles leaving in [t0, t0 + 60 s).
// Everything is seeded: the same seed and the same choices always give the same bubbles, counts and answers.
// Statistics: light intensity = 1/d² (cm⁻²); Spearman's rank correlation coefficient rs = 1 − 6Σd²/(n(n² − 1)) on ranks
// (tied values share the mean of their ranks), checked against the Pearson correlation of the ranks in validate().
// Critical values of rs for P = 0.05 (two-tailed) are the standard published values (e.g. Zar, Biostatistical Analysis);
// validate() re-derives those for n = 5 to 8 by enumerating every permutation.
window.BIO = window.BIO || {};
(function (B) {
  // ---------- seeded random numbers (mulberry32, as in the RP5 and RP6 models) ----------
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (...a) => { let h = 2166136261; for (const ch of a.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------- the three capacities ----------
  const RANGES = { light: [0, 100], co2: [0, 0.15], temp: [0, 50] };
  const P = { alpha: 2.2, Lmax: 110, thL: 0.75, KC: 0.08, Q10: 1.6, Td: 36, w: 2.5, th: 0.98 };
  const smin = (a, b, th = P.th) => { const s = a + b; return (s - Math.sqrt(Math.max(0, s * s - 4 * th * a * b))) / (2 * th); };
  const capLight = (I) => { const a = P.alpha * Math.max(0, I); return (a + P.Lmax - Math.sqrt(Math.max(0, (a + P.Lmax) ** 2 - 4 * P.thL * a * P.Lmax))) / (2 * P.thL); };
  const CSCALE = 100 / (0.15 / (0.15 + P.KC));
  const capCO2 = (c) => { c = Math.max(0, c); return CSCALE * c / (c + P.KC); };
  const graw = (t) => Math.pow(P.Q10, (t - 30) / 10) / (1 + Math.exp((t - P.Td) / P.w));
  let GMAX = 0, TOPT = 0; for (let t = 0; t <= 50.0001; t += 0.01) { const v = graw(t); if (v > GMAX) { GMAX = v; TOPT = t; } }
  TOPT = Math.round(TOPT * 10) / 10;
  const capTemp = (t) => 100 * graw(clamp(t, -5, 60)) / GMAX;

  const NAMES = { light: "light intensity", co2: "carbon dioxide concentration", temp: "temperature" };
  // rate and limiting factor for one set of conditions { light, co2, temp }
  function rate(cond) {
    const I = cond.light, c = cond.co2, t = cond.temp;
    const caps = { light: capLight(I), co2: capCO2(c), temp: capTemp(t) };
    const r = smin(smin(caps.light, caps.co2), caps.temp);
    const order = Object.keys(caps).sort((a, b) => caps[a] - caps[b]);
    const lim = order[0], second = caps[order[1]] <= caps[lim] * 1.08 + 1e-9 ? order[1] : null;
    const hot = t > TOPT + 0.5;
    return { rate: r, caps, limiting: lim, also: second, hot, topt: TOPT };
  }
  // plain-language explanation for students (no formulas)
  function explain(cond) {
    const R = rate(cond); const k = R.limiting, also = R.also;
    const why = {
      light: "Light is in shortest supply: the light-dependent reaction cannot make ATP and reduced NADP any faster, so the light-independent reaction is held back. More light would increase the rate; more carbon dioxide or a better temperature would make almost no difference.",
      co2: "Carbon dioxide is in shortest supply: rubisco cannot combine carbon dioxide with RuBP any faster, so GP is made slowly and some ATP and reduced NADP go unused. More carbon dioxide would increase the rate; more light would not.",
      temp: R.hot
        ? "The temperature is above the optimum: enzymes of the light-independent reaction, including rubisco, are being denatured, so fewer active sites can work. Lowering the temperature towards the optimum would increase the rate; more light or carbon dioxide would not."
        : "The temperature is low: the enzymes of the light-independent reaction, including rubisco, work slowly because molecules have little kinetic energy and few enzyme–substrate complexes form. Warming towards the optimum would increase the rate; more light or carbon dioxide would not.",
    };
    let title = k === "temp" && R.hot ? "temperature (too high)" : NAMES[k];
    let text = why[k];
    if (also) { title += ` and ${also === "temp" && R.hot ? "temperature (too high)" : NAMES[also]}`; text = `Two factors are close to limiting, so increasing either one alone would raise the rate only a little before the other limits it. ${why[k].split(":")[0]}; ${NAMES[also]} is nearly as limiting.`; }
    if (R.rate < 0.5) text = k === "light" ? "In the dark there is no light energy to excite electrons in chlorophyll, so no ATP or reduced NADP is made and photosynthesis stops." : k === "co2" ? "With no carbon dioxide, rubisco has no substrate to fix, so no GP is made and photosynthesis stops." : why[k];
    return { title, text, rate: R.rate, limiting: k, also, hot: R.hot };
  }
  // a curve of rate against one factor with the other two fixed
  function curve(axis, cond, n = 100) {
    const [a, b] = RANGES[axis]; const out = [];
    for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; const c = Object.assign({}, cond, { [axis]: x }); out.push({ x, y: rate(c).rate }); }
    return out;
  }

  // ---------- RP7: aquatic plant, lamp, bubbles ----------
  const RP = { I10: 40, amb: 1.5, beta: 0.6, resp: 3, tau: 1.2, k: 6, wob: 0.04, temp: 22, tempDrift: 0.3, dmin: 5, dmax: 30 };
  const LAMPS = { filament: { label: "Trialled bench lamp", factor: 1 }, saver: { label: "Energy-saving bulb (not trialled)", factor: 0.3 } };
  const SOLUTIONS = { nahco3: { label: "1 % sodium hydrogen carbonate solution", co2: 0.15 }, water: { label: "Water only (method error)", co2: 0.012 } };
  const MATERIALS = {
    cabomba: { label: "Fresh Cabomba (recommended)", cap: () => 1 },
    oldCabomba: { label: "Cabomba kept in the lab for some time", cap: (tm) => 0.5 * Math.pow(0.99, tm) },
    elodeaPre: { label: "Elodea, pre-illuminated for 2 to 3 hours", cap: () => 0.7 },
    elodea: { label: "Elodea, not pre-illuminated", cap: (tm) => 0.7 - 0.45 * Math.exp(-tm / 25) },
  };
  const lightAt = (d, lamp = "filament") => RP.I10 * Math.pow(10 / d, 2) * (LAMPS[lamp] || LAMPS.filament).factor + RP.amb;
  const invSq = (d) => 1 / (d * d);
  // a new run (one piece of plant, one tube, one lamp). Time t in seconds from when the tube is first placed (lamp at d0).
  function newRun({ seed = 1, material = "cabomba", lamp = "filament", solution = "nahco3", d0 = 10 } = {}) {
    const g = rng(hash("rp7run", seed));
    const piece = 0.85 + 0.3 * g(), temp = +(RP.temp + RP.tempDrift * (2 * g() - 1)).toFixed(1), ph = 2 * Math.PI * g(), per = 70 + 50 * g();
    return { seed, material, lamp, solution, piece, temp, ph, per, t: 0, d: d0, events: [{ t: 0, d: d0, r0: steadyAt({ material, lamp, solution, piece, temp }, null, 0) }], counts: [] };
  }
  // steady bubbling rate (bubbles per minute) at distance d (null = room light only) at session time t (s)
  function steadyAt(run, d, t) {
    const I = d == null ? RP.amb : lightAt(d, run.lamp);
    const r = rate({ light: I, co2: SOLUTIONS[run.solution].co2, temp: run.temp }).rate;
    return RP.beta * Math.max(0, MATERIALS[run.material].cap(t / 60) * run.piece * r - RP.resp);
  }
  // instantaneous bubbling rate at time t, following the lamp moves recorded in run.events (relaxation, time constant tau)
  function baseAt(run, t) {
    let ev = run.events[0]; for (const e of run.events) if (e.t <= t) ev = e;
    const target = steadyAt(run, ev.d, t), start = ev.r0 == null ? target : ev.r0;
    return Math.max(0, target + (start - steadyAt(run, ev.d, ev.t)) * Math.exp(-(t - ev.t) / 60 / RP.tau));
  }
  const rateAt = (run, t) => baseAt(run, t) * (1 + RP.wob * Math.sin((2 * Math.PI * t) / run.per + run.ph));
  function moveTo(run, d) { const r0 = baseAt(run, run.t); run.d = d; run.events.push({ t: run.t, d, r0 }); return run; }
  function wait(run, s) { run.t += s; return run; }
  const allowed = (d) => Number.isFinite(d) && d >= RP.dmin && d <= RP.dmax;
  // bubble times (s, relative to the start of the window) leaving the cut end in a window of `dur` seconds from run.t
  function bubbleTimes(run, dur = 60, key = run.counts.length) {
    const g = rng(hash("rp7bub", run.seed, key, Math.round(run.t)));
    const gam = () => { let s = 0; for (let i = 0; i < RP.k; i++) s += -Math.log(Math.max(1e-12, g())); return s / RP.k; }; // mean 1
    const out = []; const t0 = run.t; let r = rateAt(run, t0); if (r < 0.05) return out;
    let t = (60 / r) * g(); // first bubble at a random point of an interval
    while (t < dur) { out.push({ t, size: 0.75 + 0.5 * g() }); r = rateAt(run, t0 + t); if (r < 0.05) break; t += (60 / r) * gam(); }
    return out;
  }
  // one 1-minute count at the current time; advances the clock by the minute plus 15 s to record and get ready
  function count(run) { const b = bubbleTimes(run, 60); const c = { d: run.d, t0: run.t, n: b.length }; run.counts.push(c); run.t += 75; return { ...c, bubbles: b }; }

  // The standard protocol of the handbook exemplar (and of the specimen data set): start at 10 cm, leave 5 min, three
  // 1-minute counts; then each further distance in turn, leaving 5 min after each move (the handbook's 5 minutes,
  // applied at each distance), three counts each.
  function protocolRun(opts = {}, distances = [10, 5, 15, 20, 25, 30], repeats = 3, settle = 300) {
    const run = newRun(Object.assign({ d0: distances[0] }, opts)); const rows = {};
    distances.forEach((d, i) => { if (i) moveTo(run, d); wait(run, settle); rows[d] = []; for (let k = 0; k < repeats; k++) rows[d].push(count(run).n); });
    return { run, rows };
  }

  // ---------- statistics ----------
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  // ranks, 1 = smallest; ties share the mean of their ranks
  function ranks(a) { const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && Math.abs(idx[j + 1][0] - idx[i][0]) < 1e-12) j++; const avg = (i + j + 2) / 2; for (let k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; } return r; }
  function pearson(x, y) { const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); }
  function spearman(x, y) { const n = x.length, rx = ranks(x), ry = ranks(y); const d = rx.map((v, i) => v - ry[i]); const d2 = d.map((v) => v * v); const sum = d2.reduce((s, v) => s + v, 0); return { n, rx, ry, d, d2, sumD2: sum, rs: 1 - (6 * sum) / (n * (n * n - 1)), rsRanks: pearson(rx, ry) }; }
  // critical values of rs, P = 0.05, two-tailed (the test asks only whether there is a correlation, not its direction), n pairs
  const CRIT = { 5: 1.0, 6: 0.886, 7: 0.786, 8: 0.738, 9: 0.700, 10: 0.648 }; // n = 9 and 10 checked by full enumeration offline (author U3, 2026-11-16)

  const ASSUMPTIONS = [
    "The rate is set by whichever of light intensity, carbon dioxide concentration and temperature is in shortest supply (the principle of limiting factors). Near the point where one factor takes over from another, both have some effect.",
    "Light and carbon dioxide curves rise and then level off when another factor becomes limiting.",
    "Temperature: the rate rises as enzymes, including rubisco, work faster, up to an optimum of about 31 °C for this model plant, then falls as the enzymes denature. Real optima differ between species.",
    "Rates are relative (arbitrary units): no real plant has one fixed rate of photosynthesis. Stomata, photorespiration, water and mineral supply are left out.",
  ];
  const RP7_ASSUMPTIONS = [
    "Light reaching the plant falls with the square of the distance from the lamp (1/d²), plus a little room light.",
    "1 % sodium hydrogen carbonate supplies plenty of carbon dioxide; the water stays at about 22 °C (warming by the lamp is not modelled).",
    "Bubbles leave the cut end fairly regularly; each bubble is mostly oxygen from photolysis, and the plant's own respiration uses a little of it. Bubble sizes vary.",
    "After the lamp is moved, the bubbling rate takes a few minutes to settle at its new value.",
    "Fresh Cabomba bubbles fastest; Cabomba kept in the lab loses photosynthetic ability over time; Elodea bubbles more slowly, and very slowly at first unless it has been pre-illuminated.",
  ];

  // ---------- validator (Node-runnable): returns a list of problems, empty when the model behaves as documented ----------
  function validate() {
    const bad = []; const R = (I, c, t) => rate({ light: I, co2: c, temp: t }).rate;
    // shapes: light and CO2 curves rise then plateau; temperature has an optimum and falls
    const lc = curve("light", { co2: 0.04, temp: 20 }, 50).map((p) => p.y); for (let i = 1; i < lc.length; i++) if (lc[i] < lc[i - 1] - 1e-9) { bad.push("light curve falls"); break; }
    if (!(lc[5] > 3 * lc[1] * 0.9)) bad.push("light curve not steep at low light");
    if (!(lc[50] - lc[30] < 0.05 * lc[50])) bad.push("light curve does not plateau at 0.04 % CO2, 20 °C");
    const cc = curve("co2", { light: 50, temp: 20 }, 50).map((p) => p.y); for (let i = 1; i < cc.length; i++) if (cc[i] < cc[i - 1] - 1e-9) { bad.push("CO2 curve falls"); break; }
    if (!(cc[50] - cc[35] < 0.05 * cc[50])) bad.push("CO2 curve does not plateau at light 50, 20 °C");
    const tc = curve("temp", { light: 100, co2: 0.15 }, 100); const pk = tc.reduce((a, p) => (p.y > a.y ? p : a));
    if (pk.x < 25 || pk.x > 36) bad.push("temperature optimum outside 25–36 °C: " + pk.x);
    if (!(R(100, 0.15, 45) < 0.2 * pk.y && R(100, 0.15, 50) < R(100, 0.15, 45))) bad.push("rate does not fall steeply above the optimum (denaturation)");
    if (!(R(100, 0.15, 10) < R(100, 0.15, 20) && R(100, 0.15, 20) < R(100, 0.15, 30))) bad.push("rate does not rise with temperature below the optimum");
    if (R(0, 0.04, 20) > 1e-9 || R(50, 0, 20) > 1e-9) bad.push("rate not zero in the dark or without CO2");
    // limiting factor logic: textbook cases
    const L = (I, c, t) => rate({ light: I, co2: c, temp: t });
    if (L(10, 0.04, 20).limiting !== "light") bad.push("dim light, 20 °C: light should limit");
    if (L(90, 0.04, 20).limiting !== "co2") bad.push("bright light, 0.04 %, 20 °C: CO2 should limit");
    if (L(90, 0.15, 8).limiting !== "temp" || L(90, 0.15, 8).hot) bad.push("bright, high CO2, 8 °C: low temperature should limit");
    const h = L(90, 0.15, 42); if (h.limiting !== "temp" || !h.hot) bad.push("42 °C: high temperature should limit");
    // principle: raising a non-limiting factor makes (almost) no difference; raising the limiting factor raises the rate
    const base = R(90, 0.04, 20); if (R(100, 0.04, 20) - base > 0.02 * base) bad.push("more light raised a CO2-limited rate");
    if (!(R(90, 0.06, 20) > base * 1.05)) bad.push("more CO2 did not raise a CO2-limited rate");
    const dim = R(10, 0.04, 20); if (R(10, 0.15, 20) - dim > 0.03 * dim || R(10, 0.04, 30) - dim > 0.03 * dim) bad.push("CO2 or temperature changed a light-limited rate");
    // ranges: rate within 0–100
    for (const I of [0, 25, 50, 100]) for (const c of [0, 0.02, 0.04, 0.1, 0.15]) for (const t of [0, 15, 25, 35, 50]) { const v = R(I, c, t); if (!(v >= 0 && v <= 100)) bad.push(`rate out of range at ${I}, ${c}, ${t}`); }
    // RP7: counts fall with distance; inverse square; handbook range; plausible bubble numbers; reproducible
    if (Math.abs(lightAt(20) - RP.amb - (lightAt(10) - RP.amb) / 4) > 1e-9) bad.push("lamp light does not follow 1/d²");
    if (Math.abs(invSq(10) - 0.01) > 1e-12 || Math.abs(invSq(5) - 0.04) > 1e-12) bad.push("1/d² arithmetic");
    const sp = protocolRun({ seed: 7 }); const m = [5, 10, 15, 20, 25, 30].map((d) => mean(sp.rows[d]));
    for (let i = 1; i < m.length; i++) if (!(m[i] < m[i - 1])) { bad.push("fresh Cabomba: mean count does not fall with distance " + m.map((x) => x.toFixed(1)).join()); break; }
    if (m[1] < 20 || m[1] > 45) bad.push("fresh Cabomba at 10 cm not 20–45 bubbles per minute: " + m[1]);
    if (m[5] < 2 || m[5] > 12) bad.push("fresh Cabomba at 30 cm not 2–12 per minute: " + m[5]);
    if (!(m[0] - m[1] < m[1] - m[2])) bad.push("no levelling off at short distances (another factor should start to limit)");
    const a = protocolRun({ seed: 11 }), b = protocolRun({ seed: 11 }), c = protocolRun({ seed: 12 });
    if (JSON.stringify(a.rows) !== JSON.stringify(b.rows)) bad.push("same seed not reproducible");
    if (JSON.stringify(a.rows) === JSON.stringify(c.rows)) bad.push("different seeds give identical counts");
    const cv = [5, 10, 15, 20].map((d) => sd(a.rows[d]) / mean(a.rows[d])); if (cv.some((x) => x > 0.25)) bad.push("repeat counts vary by more than 25 %");
    if (Object.values(a.rows).every((r) => r[0] === r[1] && r[1] === r[2])) bad.push("repeat counts never differ");
    // method choices behave as the teachers' notes say
    const saver = protocolRun({ seed: 7, lamp: "saver" }), water = protocolRun({ seed: 7, solution: "water" }), elo = protocolRun({ seed: 7, material: "elodea" }), pre = protocolRun({ seed: 7, material: "elodeaPre" }), old = protocolRun({ seed: 7, material: "oldCabomba" });
    if (!(mean(saver.rows[10]) < 0.6 * m[1])) bad.push("energy-saving bulb does not give poorer results");
    if (!(mean(water.rows[10]) < 0.5 * m[1])) bad.push("water only does not limit by CO2");
    if (!(mean(pre.rows[10]) < m[1] && mean(elo.rows[10]) < mean(pre.rows[10]))) bad.push("Elodea not slower than Cabomba, or pre-illumination does not help");
    if (!(mean(old.rows[10]) < 0.7 * m[1])) bad.push("old Cabomba not poorer");
    // settling: counting straight after a move gives a value between the old and new rates
    { const r = newRun({ seed: 3 }); wait(r, 300); const n10 = count(r).n; moveTo(r, 25); const now = count(r).n; wait(r, 300); const late = count(r).n; if (!(now > late && now < n10)) bad.push(`no settling after moving the lamp: ${n10}, ${now}, ${late}`); }
    // statistics: rs by formula equals the Pearson coefficient of the ranks when there are no ties; known examples
    const s1 = spearman([1, 2, 3, 4, 5, 6], [2, 1, 4, 3, 6, 5]); if (Math.abs(s1.rs - (1 - (6 * 6) / 210)) > 1e-12 || Math.abs(s1.rs - s1.rsRanks) > 1e-12) bad.push("Spearman formula");
    const s2 = spearman([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]); if (Math.abs(s2.rs + 1) > 1e-12) bad.push("Spearman perfect negative");
    const tr = ranks([3, 1, 3, 2]); if (tr.join() !== "3.5,1,3.5,2") bad.push("tied ranks");
    // critical values: for n = 5–8, the tabled value is the smallest |rs| with P(rs ≥ value) ≤ 0.025 under the null hypothesis
    for (const n of [5, 6, 7, 8]) { const dist = new Map(); const perm = [...Array(n).keys()]; let total = 0;
      const rec = (k) => { if (k === n) { let s = 0; for (let i = 0; i < n; i++) s += (i - perm[i]) ** 2; dist.set(s, (dist.get(s) || 0) + 1); total++; return; } for (let i = k; i < n; i++) { [perm[k], perm[i]] = [perm[i], perm[k]]; rec(k + 1); [perm[k], perm[i]] = [perm[i], perm[k]]; } }; rec(0);
      const rsOf = (s) => 1 - (6 * s) / (n * (n * n - 1)); const vals = [...dist.keys()].map(rsOf).sort((p, q) => q - p);
      let cum = 0, crit = null; for (const v of vals) { const cnt = [...dist.entries()].filter(([s]) => Math.abs(rsOf(s) - v) < 1e-9).reduce((p, [, c]) => p + c, 0); if ((cum + cnt) / total > 0.025 + 1e-12) break; cum += cnt; crit = v; }
      if (crit === null || Math.abs(crit - CRIT[n]) > 0.0105) bad.push(`critical value n = ${n}: table ${CRIT[n]}, exact ${crit}`); }
    return bad;
  }

  B.photoModel = { RANGES, NAMES, TOPT, rate, explain, curve, capLight, capCO2, capTemp, ASSUMPTIONS, RP7_ASSUMPTIONS,
    RP, LAMPS, SOLUTIONS, MATERIALS, lightAt, invSq, newRun, steadyAt, rateAt, moveTo, wait, allowed, bubbleTimes, count, protocolRun,
    rng, hash, mean, sd, ranks, pearson, spearman, CRIT, validate };
})(window.BIO);
