// B.pulseModel: the ILLUSTRATIVE pulse-rate model behind RP5 (Phase 4 Batch 5, RP5 author).
// Investigation into the effect of a specific variable on human heart rate or pulse rate (OxfordAQA 9610 Practical
// Handbook (2019), Exemplar for Required Practical 5, pp. 70–72: the effect of exercise on pulse rate).
//
// Every pulse count on the RP5 virtual bench and in the RP5 data questions comes from this model. The participants
// are FICTIONAL (P1, P2 …, generated from a seed); nothing here is a measurement of a real person, and the student's
// own pulse is never asked for or stored. Results are labelled "simulated" wherever they appear.
//
// ASSUMPTIONS (documented here and on the page; see ASSUMPTIONS below for the student-facing wording)
//  1. Resting heart rate of a seated 16–17-year-old after 10 minutes' rest: drawn for each fictional participant from a
//     normal distribution, mean 72, SD 8 beats min⁻¹, kept within 56–92. Healthy people vary widely; most adolescents
//     in a class sit somewhere between about 60 and 80 beats min⁻¹. (British Heart Foundation: a resting rate between
//     60 and 100 bpm is usual for adults; the narrower class-typical spread is this site's assumption.)
//  2. Maximum heart rate = 208 − 0.7 × age (Tanaka, Monahan and Seals, J Am Coll Cardiol 2001;37:153–6), with an
//     individual difference of SD 6 beats min⁻¹. Used only to scale the size of the rise; no participant gets near it.
//  3. Exercise (squatting while holding a bench): the rate rises from resting towards a steady level
//       rest + k × g × (HRmax − rest), where k = 0.32, 0.45 or 0.58 for 20, 30 or 40 squats per minute (illustrative
//       calibration) and g (0.8–1.2) is the participant's own response factor (fitness and other individual differences).
//     The rise is continuous, never a jump: 70 % of it with a time constant of 25–45 s (participant), 30 % with 120 s.
//     So longer exercise (up to the handbook maximum of 5 min) gives a higher, or nearly equal, end-of-exercise rate.
//  4. Recovery after stopping: the excess above resting falls as the sum of a fast and a slow exponential:
//       excess(s) = E0 × [a × e^(−s/τf) + (1 − a) × e^(−s/τs)], τf 30–60 s, τs 80–160 s, a = 0.60–0.75 less 0.03 per
//     minute of exercise, kept within 0.35–0.70 (longer exercise leaves a larger slow part). Fast early fall, then slower (the two-phase shape
//     described for post-exercise heart rate recovery; Imai et al., J Am Coll Cardiol 1994;24:1529–35).
//  5. Variation: a slow, smooth fluctuation (three sine waves, periods 35–110 s, amplitudes 0.6–1.4 beats min⁻¹ each, so
//     the sum is usually within about ±2 and at most about ±4 beats min⁻¹)
//     and breathing-linked variation (about ±2 beats min⁻¹, period about 4 s) on top of the expected rate. Beat times
//     carry a very small timing jitter (SD 12 ms). All seeded: the same seed always gives the same run.
//  6. Beats are discrete. The instantaneous rate is integrated to give beat times; a 20 s count is the whole number of
//     beat times in [t0, t0 + 20 s). Pulse rate = count × 60 ÷ window (× 3 for 20 s). One beat more or less changes a
//     20 s rate by 3 beats min⁻¹ (the resolution). Pulse rate is taken to equal heart rate (a regular rhythm: every
//     ventricular contraction produces one pulse wave in the radial artery).
//  7. Method errors the bench can model: resting only 2 minutes instead of 10 (a residual excess of 9–14 beats min⁻¹
//     that decays with a 3-minute time constant); a delay before the first recovery count; a body-position offset for
//     the handbook's suggested adaptation (lying about 4–8 lower, standing about 7–13 higher than sitting: direction is
//     standard physiology, size illustrative).
// It does NOT model: irregular rhythms, medicines, caffeine, temperature, emotion, posture changes during counting,
// or anything that would let it judge whether a real person's heart rate is healthy. It is not a health check.
window.BIO = window.BIO || {};
(function (B) {
  // ---------- seeded random numbers (mulberry32, as in bench-potometer.js) ----------
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (...a) => { let h = 2166136261; for (const ch of a.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const normal = (g) => { const u = Math.max(1e-9, g()), v = g(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r1 = (x) => Math.round(x * 10) / 10;

  const CADENCE = { 20: 0.32, 30: 0.45, 40: 0.58 }; // fraction of heart-rate reserve approached (illustrative)
  const RESTING_COUNTS = [0, 60, 120, 180, 240]; // s: handbook step 3 diagram (counts start at 0, 1, 2, 3, 4 min)
  const RECOVERY_COUNTS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270]; // s after stopping: handbook step 5 diagram
  const EX_START = 300; // the squatting starts when the five resting counts (0–5 min) are finished
  const MAX_EX_MIN = 5; // handbook step 4: "should not be longer than 5 minutes"

  // ---------- fictional participants ----------
  function participant(seed) {
    const g = rng(hash("participant", seed));
    const rest = r1(clamp(72 + 8 * normal(g), 56, 92));
    const age = 16 + (g() < 0.5 ? 0 : 1);
    const hrmax = r1(clamp(208 - 0.7 * age + 6 * normal(g), 184, 208));
    const p = {
      seed, rest, age, hrmax,
      gain: 0.8 + 0.4 * g(), tauOn: 25 + 20 * g(), af: 0.6 + 0.15 * g(), tauF: 30 + 30 * g(), tauS: 80 + 80 * g(),
      wob: [0, 1, 2].map(() => ({ a: 0.6 + 0.8 * g(), P: 35 + 75 * g(), ph: 2 * Math.PI * g() })),
      rsa: { a: 1.5 + 1 * g(), P: 3.6 + 1.2 * g(), ph: 2 * Math.PI * g() },
      pos: { lying: -r1(4 + 4 * g()), sitting: 0, standing: r1(7 + 6 * g()) },
      shortRest: 9 + 5 * g(), phase0: g(),
    };
    return p;
  }

  // The same fictional participant on another day (for repeat runs): resting rate shifts by up to about ±2 beats min⁻¹,
  // the response factor by ±10 %, and the fluctuations are new. Day 0 is the participant as generated.
  function onDay(p, day) {
    if (!day) return p; const g = rng(hash("day", p.seed, day));
    return Object.assign({}, p, { day, rest: r1(clamp(p.rest + 1.2 * clamp(normal(g), -1.7, 1.7), 54, 94)), gain: p.gain * (0.9 + 0.2 * g()),
      wob: p.wob.map((w) => ({ a: w.a, P: w.P, ph: 2 * Math.PI * g() })), rsa: Object.assign({}, p.rsa, { ph: 2 * Math.PI * g() }), phase0: g() });
  }

  // protocol: { exMin 0–5, cadence 20|30|40, restMin 10|2, position "sitting"|"lying"|"standing", delay s (0 = immediately) }
  const PROTO = { exMin: 2, cadence: 30, restMin: 10, position: "sitting", delay: 0 };
  const proto = (o) => Object.assign({}, PROTO, o || {});
  const exEnd = (pr) => EX_START + clamp(pr.exMin, 0, MAX_EX_MIN) * 60;
  const amplitude = (p, pr) => (CADENCE[pr.cadence] || CADENCE[30]) * p.gain * (p.hrmax - p.rest);
  const riseFrac = (p, s) => (s <= 0 ? 0 : 1 - 0.7 * Math.exp(-s / p.tauOn) - 0.3 * Math.exp(-s / 120));
  const fastFrac = (p, pr) => clamp(p.af - 0.03 * pr.exMin, 0.35, 0.7);

  // Expected (noise-free) excess above the participant's resting rate at absolute time t (s; t = 0 is the first resting count).
  function excess(p, t, pr) { return excessN(p, t, proto(pr)); }
  function excessN(p, t, pr) {
    const e = exEnd(pr); const A = pr.exMin > 0 ? amplitude(p, pr) : 0;
    if (t < EX_START || A === 0) return 0;
    if (t <= e) return A * riseFrac(p, t - EX_START);
    const E0 = A * riseFrac(p, e - EX_START), s = t - e, a = fastFrac(p, pr);
    return E0 * (a * Math.exp(-s / p.tauF) + (1 - a) * Math.exp(-s / p.tauS));
  }
  // Instantaneous pulse rate (beats min⁻¹). opts.noise false gives the expected rate (used by validate()).
  function rate(p, t, pr, opts = {}) { return rateN(p, t, proto(pr), opts.noise !== false); }
  function rateN(p, t, pr, noisy) {
    let hr = p.rest + (p.pos[pr.position] || 0) + excessN(p, t, pr);
    if (pr.restMin < 10) hr += p.shortRest * Math.exp(-(t + 20) / 180); // rested too briefly: still settling
    if (noisy) { for (const w of p.wob) hr += w.a * Math.sin((2 * Math.PI * t) / w.P + w.ph); hr += p.rsa.a * Math.sin((2 * Math.PI * t) / p.rsa.P + p.rsa.ph); }
    return hr;
  }

  // Beat times (s) for a whole run, from integrating the instantaneous rate; seeded jitter of 12 ms.
  function beats(p, pr, seed = p.seed) {
    pr = proto(pr); const end = exEnd(pr) + pr.delay + 300 + 30; const g = rng(p.day ? hash("beats", seed, p.seed, p.day) : hash("beats", seed, p.seed));
    // beat to beat: each interval is 60 ÷ (rate at the middle of the interval), the midpoint rule for integrating the rate
    const out = []; let t = -30 + (1 - p.phase0) * (60 / rateN(p, -30, pr, true));
    while (t < end) { out.push(t); const h = 60 / rateN(p, t, pr, true); t += 60 / rateN(p, t + h / 2, pr, true); }
    for (let i = 0; i < out.length; i++) out[i] += 0.012 * clamp(normal(g), -3, 3);
    out.sort((a, b) => a - b); return out;
  }
  const count = (bt, t0, w = 20) => { let n = 0; for (const b of bt) { if (b >= t0 + w) break; if (b >= t0) n++; } return n; };
  const toRate = (c, w = 20) => (c * 60) / w;
  const resolution = (w = 20) => 60 / w;

  // The count windows of one run (absolute start times).
  function windows(pr) {
    pr = proto(pr); const e = exEnd(pr);
    return { rest: RESTING_COUNTS.map((s) => ({ t: s, abs: s })), recovery: RECOVERY_COUNTS.map((s) => ({ t: s + pr.delay, abs: e + pr.delay + s })) };
  }
  // One complete run (the counts the bench "auto count" would give). Counts are whole numbers of beats in 20 s.
  function run(p, pr, opts = {}) {
    pr = proto(pr); const w = opts.window || 20; const bt = opts.beats || beats(p, pr, opts.seed == null ? p.seed : opts.seed); const W = windows(pr);
    return { participant: p.seed, protocol: pr, window: w, exStart: EX_START, exEnd: exEnd(pr),
      rest: W.rest.map((x) => ({ t: x.t, abs: x.abs, count: count(bt, x.abs, w) })), recovery: W.recovery.map((x) => ({ t: x.t, abs: x.abs, count: count(bt, x.abs, w) })), beats: bt };
  }

  // ---------- processing (the same arithmetic the student does) ----------
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const range = (a) => [Math.min(...a), Math.max(...a)];
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  // Recovery time (platform convention, stated on the page): time after stopping at which the first count starts whose
  // rate is no more than one resolution step (3 beats min⁻¹ for 20 s counts) above the mean resting rate; null if never.
  function recoveryTime(restCounts, recov, w = 20) { const m = mean(restCounts.map((c) => toRate(c, w))); const hit = recov.find((r) => toRate(r.count, w) <= m + resolution(w) + 1e-9); return hit ? hit.t : null; }
  function summary(restCounts, recov, w = 20) {
    const restRates = restCounts.map((c) => toRate(c, w)), recRates = recov.map((r) => toRate(r.count, w));
    const restMean = mean(restRates), peak = Math.max(...recRates), first = recRates[0];
    return { restRates, recRates, restMean, peak, first, increase: peak - restMean, pct: ((peak - restMean) / restMean) * 100, recovery: recoveryTime(restCounts, recov, w) };
  }

  const ASSUMPTIONS = [
    "Fictional participants only. Each has a resting rate (seated, after 10 minutes' rest) drawn from a spread centred on 72 beats min⁻¹ (most between about 60 and 80, all between 56 and 92). Healthy people differ a lot, so a different participant gives a different resting rate and a different response.",
    "During squatting the rate rises smoothly (no instant jump) towards a level set by the squat pace and by the participant's own response; longer exercise, up to the 5-minute maximum, gives a higher or nearly equal rate at the moment of stopping.",
    "After stopping, the rate falls quickly at first and then more slowly (a fast and a slow exponential fall). Longer exercise leaves more of the slow part, so recovery can take longer.",
    "Small natural fluctuations (breathing and slow drifts) are added, so repeated resting counts differ by a beat or two. Everything is seeded: the same participant and settings always give the same counts.",
    "A count is the whole number of beats inside the 20-second window; pulse rate = count × 3. Pulse rate is treated as equal to heart rate (a regular rhythm).",
    "The model is an illustration for practising the method and the data analysis. It cannot say anything about a real person's health.",
  ];
  const SOURCES = [
    { id: "bhf", citation: "British Heart Foundation, Checking your pulse", url: "https://www.bhf.org.uk/informationsupport/tests/checking-your-pulse", usedFor: "usual adult resting range (60–100 bpm); counting the radial pulse with fingers, not the thumb" },
    { id: "tanaka", citation: "Tanaka H., Monahan K.D., Seals D.R. (2001) J Am Coll Cardiol 37:153–156", url: "https://pubmed.ncbi.nlm.nih.gov/11153730/", usedFor: "HRmax = 208 − 0.7 × age (scales the rise only)" },
    { id: "imai", citation: "Imai K. et al. (1994) J Am Coll Cardiol 24:1529–1535", url: "https://pubmed.ncbi.nlm.nih.gov/7930286/", usedFor: "qualitative two-phase (fast then slow) shape of heart-rate recovery" },
    { id: "handbook", citation: "OxfordAQA 9610 Practical Handbook (2019), Exemplar for Required Practical 5, pp. 70–72", url: "", usedFor: "timings: 10 min rest; 20 s counts every 1 min for 5 min; exercise ≤ 5 min; 20 s counts every 30 s for 5 min" },
  ];

  // ---------- validator (Node-runnable): returns an array of problems, empty when the model behaves as documented ----------
  function validate() {
    const bad = []; const P = (s) => participant(s); const seeds = Array.from({ length: 60 }, (_, i) => 1001 + i * 37);
    // participants: plausible resting rates, individual variation
    const rests = seeds.map((s) => P(s).rest); const mr = mean(rests);
    if (rests.some((r) => r < 55 || r > 95)) bad.push("resting rate outside 55–95");
    if (mr < 66 || mr > 78) bad.push("mean resting rate of 60 participants not 66–78: " + mr.toFixed(1));
    if (Math.max(...rests) - Math.min(...rests) < 15) bad.push("participants do not vary (range of resting rates < 15)");
    for (const s of seeds.slice(0, 10)) {
      const p = P(s);
      // resting stable: noise-free rate constant over the resting counts; noisy counts within ±2 beats of rest/3
      const r0 = run(p, { exMin: 2 });
      if (RESTING_COUNTS.some((t) => Math.abs(rate(p, t, { exMin: 2 }, { noise: false }) - p.rest) > 1e-9)) bad.push(`P${s}: expected resting rate not constant`);
      if (r0.rest.some((x) => Math.abs(x.count - p.rest / 3) > 2.5)) bad.push(`P${s}: resting count far from rest/3`);
      // 0-minute exercise gives no rise
      const z = run(p, { exMin: 0 }); if (Math.abs(excess(p, 400, { exMin: 0 })) > 0 || z.recovery.some((x) => Math.abs(x.count - p.rest / 3) > 2.5)) bad.push(`P${s}: 0-min exercise gives a rise`);
      // longer exercise gives a higher or equal peak (expected rate at stopping, and first-count expectation)
      let prev = -1; for (const m of [0, 0.5, 1, 2, 3, 4, 5]) { const pr = { exMin: m }; const v = rate(p, exEnd(pr), pr, { noise: false }); if (v < prev - 1e-9) bad.push(`P${s}: peak falls with longer exercise at ${m} min`); prev = v; }
      for (const cad of [20, 30, 40]) for (const m of [1, 3]) { const pr = { exMin: m, cadence: cad };
        // no instantaneous jumps: expected rate changes by < 1.5 beats min⁻¹ per 0.5 s everywhere
        for (let t = 0; t < exEnd(pr) + 300; t += 0.5) if (Math.abs(rate(p, t + 0.5, pr, { noise: false }) - rate(p, t, pr, { noise: false })) > 1.5) { bad.push(`P${s}: jump at ${t} s`); break; }
        // recovery monotonic (non-increasing) in expectation; fast fall early
        let last = Infinity; for (let u = 0; u <= 300; u += 5) { const v = rate(p, exEnd(pr) + u, pr, { noise: false }); if (v > last + 1e-9) { bad.push(`P${s}: recovery not monotonic`); break; } last = v; }
        const e = exEnd(pr), d1 = rate(p, e, pr, { noise: false }) - rate(p, e + 60, pr, { noise: false }), d2 = rate(p, e + 120, pr, { noise: false }) - rate(p, e + 180, pr, { noise: false });
        if (!(d1 > d2)) bad.push(`P${s}: recovery not faster in the first minute`);
        // physiological bounds
        for (let t = -10; t < e + 330; t += 2) { const v = rate(p, t, pr); if (v < 45 || v > 200 || v > p.hrmax) { bad.push(`P${s}: rate out of bounds ${v.toFixed(0)} at ${t}`); break; } }
        // counts consistent with bpm/3: |count − expected beats in the window| ≤ 1
        const R = run(p, pr); for (const x of [...R.rest, ...R.recovery]) { let integ = 0; for (let u = 0; u < 20; u += 0.05) integ += (rate(p, x.abs + u + 0.025, pr) / 60) * 0.05; if (Math.abs(x.count - integ) > 1.05) { bad.push(`P${s}: count ${x.count} vs expected ${integ.toFixed(2)} beats`); break; } }
        if (![...R.rest, ...R.recovery].every((x) => Number.isInteger(x.count))) bad.push("counts are not integers");
      }
      // heart-rate drop in the first minute after 2 min of 30 squats per minute: plausible 10–45 beats min⁻¹
      const pr2 = { exMin: 2 }; const hrr = rate(p, exEnd(pr2), pr2, { noise: false }) - rate(p, exEnd(pr2) + 60, pr2, { noise: false }); if (hrr < 8 || hrr > 45) bad.push(`P${s}: first-minute fall ${hrr.toFixed(1)}`);
      // position adaptation: standing > sitting > lying
      if (!(p.pos.standing > 0 && p.pos.lying < 0)) bad.push(`P${s}: position offsets wrong way`);
      // resting only 2 minutes: higher resting mean, counts falling across the five
      const sh = run(p, { restMin: 2 }); if (!(mean(sh.rest.map((x) => x.count)) > mean(r0.rest.map((x) => x.count)))) bad.push(`P${s}: short rest not higher`);
    }
    // averages across participants: higher peak for longer exercise and faster pace
    const firstMean = (pr) => mean(seeds.slice(0, 16).map((s) => run(P(s), pr).recovery[0].count));
    const f = [0.5, 1, 2, 3, 5].map((m) => firstMean({ exMin: m })); for (let i = 1; i < f.length; i++) if (f[i] < f[i - 1] - 0.2) bad.push("mean first recovery count falls with longer exercise");
    if (!(firstMean({ exMin: 2, cadence: 40 }) > firstMean({ exMin: 2, cadence: 20 }))) bad.push("faster pace does not raise the rate");
    // individual variation in the response
    const peaks = seeds.slice(0, 16).map((s) => run(P(s), { exMin: 2 }).recovery[0].count * 3); if (Math.max(...peaks) - Math.min(...peaks) < 20) bad.push("everyone responds the same (peak range < 20)");
    if (peaks.some((x) => x > 190 || x < 80)) bad.push("first recovery rate outside 80–190 after 2 min of squats");
    // seeds reproducible; different seeds differ
    const a = run(P(77), { exMin: 3 }), b = run(P(77), { exMin: 3 }), c = run(P(78), { exMin: 3 });
    if (JSON.stringify([a.rest, a.recovery]) !== JSON.stringify([b.rest, b.recovery])) bad.push("same seed not reproducible");
    if (JSON.stringify([a.rest, a.recovery]) === JSON.stringify([c.rest, c.recovery])) bad.push("different seeds give identical runs");
    // another day: same participant, slightly different counts, reproducible
    const d1 = run(onDay(P(77), 1), { exMin: 3 }), d1b = run(onDay(P(77), 1), { exMin: 3 });
    if (JSON.stringify(d1.recovery) !== JSON.stringify(d1b.recovery)) bad.push("repeat-day run not reproducible");
    if (JSON.stringify(d1.recovery) === JSON.stringify(a.recovery)) bad.push("repeat-day run identical to day 0");
    if (Math.abs(mean(d1.rest.map((x) => x.count)) - mean(a.rest.map((x) => x.count))) > 2) bad.push("repeat-day resting mean differs by more than 6 beats min⁻¹");
    // arithmetic helpers
    if (toRate(23, 20) !== 69 || resolution(20) !== 3 || resolution(15) !== 4 || resolution(60) !== 1) bad.push("toRate/resolution arithmetic");
    const steady = []; for (let i = 0; i < 200; i++) steady.push(i + 0.5); if (count(steady, 0, 20) !== 20) bad.push("count of a 60 bpm train over 20 s is not 20");
    // timeline matches the handbook diagrams
    const W = windows({ exMin: 2 }); if (W.rest.length !== 5 || W.recovery.length !== 10 || W.recovery[1].t !== 30 || W.rest[4].t !== 240) bad.push("timeline differs from the handbook");
    return bad;
  }

  B.pulseModel = { ASSUMPTIONS, SOURCES, CADENCE, RESTING_COUNTS, RECOVERY_COUNTS, EX_START, MAX_EX_MIN, rng, hash, participant, onDay, proto, exEnd, excess, rate, beats, count, toRate, resolution, windows, run, mean, range, sd, recoveryTime, summary, validate };
})(window.BIO);
