// Yeast respiration (methylene blue decolourisation) model for Required Practical 8 (Phase 5 Batch 2, author A4).
// B.yeastModel: ONE illustrative model behind the RP8 virtual bench (the colour of each tube, its decolourisation time),
// the results tables, rates, graph and every worked answer that uses simulated data. It is a TEACHING MODEL calibrated to
// the sample results in the OxfordAQA 9610 Practical Handbook (2019), Exemplar for Required Practical 8, p. 82 (mean
// decolourisation times 275 s at 20 °C, 128 s at 35 °C, 145 s at 45 °C). Every page that uses it labels its numbers
// "simulated". Specification and review: scratch A4-MODEL.md (reviewed in MR-A4, 2026-11-17).
//
// MECHANISM. Dehydrogenation in glycolysis (cytoplasm), the link reaction and the Krebs cycle (mitochondrial matrix)
// produces reduced coenzymes (reduced NAD). Methylene blue, a redox indicator, accepts electrons (hydrogen) from them
// and is reduced: blue to colourless. Oxygen dissolved by the 10 s shake takes electrons first and re-oxidises reduced
// dye, so the tube stays blue until that oxygen is used; then the dye is reduced and the colour fades. Shaking again
// dissolves more oxygen and the blue returns. Faster respiration = shorter decolourisation time; rate = 1/time (s⁻¹).
//
// RULES (not shown to students; one "Simplified model" line is):
//  r(T) = 1.7^((T − 35)/10) / (1 + e^((T − 45)/2.5))           relative activity (Q10 1.7; half lost at 45 °C)
//  C = C_O2 + C_MB; C_O2 = 0.4; C_MB = 0.6 (working dye) or 0.3 (diluted 1:1)
//  t_d = C × K / (A × u × r(T_eff)), K = 128 × r(35) = 125.698 s   (fresh, working, equilibrated, 35 °C → 128 s)
//  A = 1 fresh dried yeast, 0.35 old stock yeast (handbook p. 80: stock yeast "did not give good results")
//  T_eff = T if the tubes were left to reach the bath temperature; otherwise T − 0.3 × (T − 22) (contents start at 22 °C)
//  u = 1 if the mixture was shaken before sampling; otherwise uniform 0.5–1.5 per tube (settled yeast)
//  watch mode records the press as t_acc + (press − t_acc)/speed, where t_acc is the model time when only 5 % of the dye
//    is still blue: the student's real reaction delay is kept, not multiplied by the speed (correction pass, RG-07)
//  observed t = round(t_d × e^(0.05 z)), z standard normal (seeded); bath reading = set point ± 0.5 °C (seeded)
//  reshake at s < t_d: t = s + t_d (decolourisation restarts); reshake after the colour has gone: blue again, recorded
//    time unchanged
//  colour: B(τ) = 1 while C τ ≤ C_O2, then 1 − (C τ − C_O2)/C_MB, 0 from τ = 1 (τ = elapsed / t_d); drawn intensity
//    B × C_MB / 0.6
//  cut-off 600 s: "did not decolourise within 600 s"; no time and no rate (rate only known to be below 1/600 s⁻¹)
// ASSUMPTIONS: one electron supply and one acceptor pool; temperature acts only on enzyme activity, inactivation above
// about 40 °C is immediate (not progressive); oxygen solubility constant; the room-temperature dye does not cool the tube;
// glucose does not run out. In these simulated results decolourisation is fastest near 40 °C; this is NOT presented as
// the optimum of yeast (WJEC TG19 trials were fastest at 60 °C with short exposure; the handbook says the optimum is not
// the aim and temperatures must be trialled).
// Sources checked 2026-11-17: OxfordAQA 9610 Practical Handbook (2019) pp. 80–83; WJEC TG19 "Investigation of
// dehydrogenase activity in yeast"; LibreTexts Chemistry "The Blue Bottle Demonstration" (reduced dye colourless;
// shaking dissolves oxygen, which re-oxidises it).
window.BIO = window.BIO || {};
(function (B) {
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (...a) => { let h = 2166136261; for (const ch of a.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const P = { Q10: 1.7, Td: 45, w: 2.5, tRef: 128, cO2: 0.4, room: 22, eqLag: 0.3, sigma: 0.05, cutoff: 600, accept: 0.05 };
  // Bench temperatures: capped at 45 °C, the highest handbook sample temperature (correction pass, RG-14). Above about
  // 45 °C the model's immediate, complete denaturation is its least defensible assumption, so 50 °C is not offered.
  const TEMPS = [10, 15, 20, 25, 30, 35, 40, 45];
  const YEASTS = { fresh: { label: "Freshly bought dried yeast, fermenting well (handbook)", A: 1 }, old: { label: "Dried yeast already in stock (old)", A: 0.35 } };
  const DYES = { working: { label: "Working solution (0.1 cm³ stock in 100 cm³ water)", cMB: 0.6 }, diluted: { label: "Working solution diluted 1:1 with water", cMB: 0.3 } };
  const act = (T) => Math.pow(P.Q10, (T - 35) / 10) / (1 + Math.exp((T - P.Td) / P.w));
  const K = P.tRef * act(35);
  const tEff = (T, eq) => (eq === false ? T - P.eqLag * (T - P.room) : T);
  // model decolourisation time (s) before per-tube variation; may exceed the cut-off
  function tD({ T = 35, yeast = "fresh", dye = "working", eq = true, u = 1 } = {}) {
    const C = P.cO2 + DYES[dye].cMB; return (C * K) / (YEASTS[yeast].A * u * act(tEff(T, eq)));
  }
  // fraction of dye still blue at elapsed time e (s) for a tube with decolourisation time td
  function blue(e, td, dye = "working") { const cMB = DYES[dye].cMB, C = P.cO2 + cMB; const used = C * Math.max(0, e) / td; if (used <= P.cO2) return 1; return Math.max(0, 1 - (used - P.cO2) / cMB); }
  const intensity = (e, td, dye = "working") => blue(e, td, dye) * DYES[dye].cMB / 0.6;
  // one temperature: five tubes. Returns per-tube td (true model time incl. variation, unrounded) and bath readings.
  function tubes({ T = 35, yeast = "fresh", dye = "working", eq = true, shakeMix = true, seed = 1, n = 5 } = {}) {
    const g = rng(hash("rp8", seed, T, yeast, dye, eq, shakeMix)); const out = [];
    for (let i = 0; i < n; i++) {
      const u = shakeMix ? 1 : 0.5 + g(); const off = (g() - 0.5); const Tb = +(T + off).toFixed(1);
      const z = Math.sqrt(-2 * Math.log(Math.max(1e-12, g()))) * Math.cos(2 * Math.PI * g());
      const td = tD({ T: Tb, yeast, dye, eq, u }) * Math.exp(P.sigma * z);
      out.push({ tube: i + 1, bath: Tb, u, td, time: td > P.cutoff ? null : Math.round(td) });
    }
    return out;
  }
  // a reshake at s (s) restarts the decolourisation; after the colour has gone the recorded time is unchanged
  // model time (from the last shake) when only P.accept of the dye is still blue: the earliest accepted press
  const tAccept = (td, dye = "working") => { const cMB = DYES[dye].cMB, C = P.cO2 + cMB; return td * (P.cO2 + (1 - P.accept) * cMB) / C; };
  // recorded time for a press at model time el, accepted end point at model time ta, clock speed k
  const pressTime = (el, ta, k = 1) => Math.round(el <= ta ? el : ta + (el - ta) / k);
  const withReshake = (td, s) => (s == null || s >= td ? td : s + td);
  const rate = (t) => (t == null || !(t > 0) ? null : 1 / t);
  const sf3 = (x) => (x == null ? "–" : x.toPrecision(3));
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

  const ASSUMPTIONS = [
    "Respiration supplies electrons at a rate set by enzyme activity; oxygen dissolved by the 10 s shake takes them first, then the methylene blue.",
    "Enzyme activity rises with temperature and falls above about 40 °C as enzymes denature (here the loss is immediate, not gradual).",
    "Old yeast respires much more slowly; diluting the dye means less dye has to be reduced.",
    "Each tube differs a little (number of yeast cells, judging the end point).",
  ];

  // ---------- validator (Node-runnable): returns a list of problems, empty when the model behaves as documented ----------
  function validate() {
    const bad = []; const near = (a, b, tol, msg) => { if (!(Math.abs(a - b) <= tol)) bad.push(`${msg}: ${a} (expected ${b})`); };
    near(K, 125.698, 0.001, "K");
    near(tD({ T: 35 }), 128, 1e-9, "35 °C fresh"); near(tD({ T: 20 }), 278.6, 0.05, "20 °C"); near(tD({ T: 45 }), 147.9, 0.05, "45 °C");
    near(tD({ T: 40 }), 109.5, 0.05, "40 °C"); near(tD({ T: 25 }), 213.8, 0.05, "25 °C"); near(tD({ T: 30 }), 164.3, 0.05, "30 °C");
    near(tD({ T: 15 }), 363.3, 0.05, "15 °C"); near(tD({ T: 10 }), 473.6, 0.05, "10 °C"); near(tD({ T: 50 }), 475.7, 0.05, "50 °C");
    if (Math.abs(tD({ T: 20 }) / 275 - 1) > 0.03 || Math.abs(tD({ T: 45 }) / 145 - 1) > 0.03) bad.push("handbook sample not within 3 %");
    if (!(act(40) > act(39) && act(40) > act(41) - 0.01 && act(41) > act(45))) bad.push("activity does not peak near 40 °C");
    for (let i = 1; i < TEMPS.length; i++) { const T = TEMPS[i]; if (T <= 40 && !(tD({ T }) < tD({ T: TEMPS[i - 1] }))) bad.push("time does not fall up to 40 °C"); }
    near(tD({ T: 35, yeast: "old" }), 365.7, 0.05, "old yeast 35 °C");
    if (!(tD({ T: 20, yeast: "old" }) > P.cutoff)) bad.push("old yeast 20 °C should exceed the cut-off");
    near(tD({ T: 35, dye: "diluted" }), 89.6, 0.05, "diluted 35 °C"); near(tD({ T: 35, yeast: "old", dye: "diluted" }), 256.0, 0.05, "old diluted 35 °C");
    near(tD({ T: 35, eq: false }), 155.2, 0.05, "no equilibration 35 °C"); near(tD({ T: 45, eq: false }), 113.4, 0.05, "no equilibration 45 °C");
    near(withReshake(128, 60), 188, 1e-9, "reshake at 60 s"); near(withReshake(128, 150), 128, 1e-9, "reshake after colour gone");
    near(blue(0.2 * 128, 128), 1, 1e-9, "colour τ 0.2"); near(blue(0.7 * 128, 128), 0.5, 1e-9, "colour τ 0.7"); near(blue(128, 128), 0, 1e-9, "colour τ 1");
    near(blue(0.8 * 89.6, 89.6, "diluted"), 0.4667, 0.0005, "diluted colour τ 0.8"); near(intensity(0.8 * 89.6, 89.6, "diluted"), 0.2333, 0.0005, "diluted intensity");
    { const tau = 1 - P.accept * DYES.working.cMB; near(blue(tau * 100, 100), P.accept, 1e-9, "acceptance threshold"); }
    near(tAccept(100), 97, 1e-9, "accepted end point, working dye"); near(tAccept(100, "diluted"), 100 * (0.4 + 0.95 * 0.3) / 0.7, 1e-9, "accepted end point, diluted dye");
    near(pressTime(130, 124, 20), 124, 1e-9, "press 6 model s late at ×20 adds 0.3 s"); near(pressTime(130, 124, 1), 130, 1e-9, "press at real time");
    if (TEMPS[TEMPS.length - 1] !== 45) bad.push("bench range must stop at 45 °C");
    near(rate(128), 0.0078125, 1e-12, "rate 1/128"); if (sf3(rate(128)) !== "0.00781") bad.push("rate rounding");
    // reproducibility and spread (fixed seeds)
    if (JSON.stringify(tubes({ T: 35, seed: 4 })) !== JSON.stringify(tubes({ T: 35, seed: 4 }))) bad.push("same seed not reproducible");
    if (JSON.stringify(tubes({ T: 35, seed: 4 })) === JSON.stringify(tubes({ T: 35, seed: 5 }))) bad.push("different seeds identical");
    for (let s = 1; s <= 20; s++) { const t = tubes({ T: 35, seed: s }).map((x) => x.td); const cv = sd(t) / mean(t); if (cv > 0.1) bad.push("CV > 10 % at seed " + s); }
    { let wide = 0; for (let s = 1; s <= 20; s++) { const t = tubes({ T: 35, seed: s, shakeMix: false }).map((x) => x.td); if (Math.max(...t) / Math.min(...t) > 1.6) wide++; } if (wide < 5) bad.push("unshaken mixture does not spread the times"); }
    // no impossible values on the bench grid
    for (const T of TEMPS) for (const yeast of Object.keys(YEASTS)) for (const dye of Object.keys(DYES)) for (const eq of [true, false]) for (const shakeMix of [true, false]) for (const x of tubes({ T, yeast, dye, eq, shakeMix, seed: 3 })) {
      if (x.time != null && !(x.time >= 1 && x.time <= P.cutoff && rate(x.time) > 1 / P.cutoff - 1e-12 && isFinite(rate(x.time)))) bad.push(`impossible value at ${T} ${yeast} ${dye}`);
      if (x.time == null && !(x.td > P.cutoff)) bad.push("null time below the cut-off"); }
    return bad;
  }

  B.yeastModel = { P, TEMPS, YEASTS, DYES, act, K, tEff, tD, blue, intensity, tubes, tAccept, pressTime, withReshake, rate, sf3, mean, sd, rng, hash, ASSUMPTIONS, validate };
})(window.BIO);
