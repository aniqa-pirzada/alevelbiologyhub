// Seedling competition model for Required Practical 9 (Phase 5 Batch 3, author B5).
// B.seedlingModel: ONE illustrative model behind the RP9 virtual bench (which seeds germinate on which day, the root and
// shoot length of every seedling), the results tables, statistics, graph and the checks on the worked answers that use
// simulated data. It is a TEACHING MODEL; every page that uses it labels its numbers "simulated". Specification, worked
// test cases and review: scratch p5b3/B5-MODEL.md, reviewed in MR-B5 (2026-11-17).
//
// METHOD (OxfordAQA 9610 Practical Handbook, 2019, Exemplar for Required Practical 9, printed pp. 84 to 86): five Petri
// dishes, filter paper wetted with the same amount of boiled water, base marked into segments (8 on this site), 1 seed
// per segment in dish 1 up to 5 seeds per segment in dish 5 (8, 16, 24, 32, 40 seeds), lids on, dark cupboard,
// germination recorded at the same time each day, root and shoot measured after about 3 days.
//
// MECHANISM. Intraspecific competition for water and space (handbook teachers' notes): the same volume of water and the
// same area are shared by more seeds as the sowing density d (seeds per segment) rises, so each seedling grows less.
// Darkness removes competition for light; boiled water and filter paper supply almost no mineral ions, and seedlings use
// their seed food stores over 3 days.
//
// RULES (code comments only; students see a one-line "Simplified model" note):
//  R(d) = 32 / (1 + 0.15 (d − 1)) mm, S(d) = 16 / (1 + 0.15 (d − 1)) mm   expected root / shoot of a germinated seedling
//  G(d) = 0.95 − 0.01 (d − 1)                                           probability a seed germinates by day 3
//  germination day 1, 2, 3 with probability 0.4, 0.5, 0.1; day factor 1.20, 0.96, 0.40 (mean factor exactly 1.00)
//  multiplier m = exp(0.15 z1 + 0.10 z − 0.01625), z1 (vigour, shared by root and shoot) and z (organ) standard normal
//    truncated to ±2, so 0.597 ≤ m ≤ 1.622
//  length = round(R or S × day factor × m × error factors), minimum 1 mm; seeds that do not germinate have no length
//  errors (only when chosen): water poured by eye: dish factor wf uniform 0.6–1.4, growth × (1 − 0.6 |wf − 1|);
//    warm windowsill: roots × 0.8, shoots × 0.6, G × 0.9; seeds handled / dirty dish: each segment mouldy with
//    probability 0.10 + 0.04 d, seeds in it germinate with probability 0.3 G and grow × 0.5
//  statistics as in the handbook (pp. 41 to 46): SD with n − 1, SE = SD/√n, 95 % CI = mean ± 1.96 SE; chi-squared for
//    germinated / not germinated (2 × 5 table, expected from the overall proportion, df = 4, critical value 9.49 at
//    P = 0.05, valid only when every expected value is at least 5)
// ASSUMPTIONS: constant temperature; one seed batch; water shared only within a dish; seed food stores last 3 days;
//  the same competition effect on roots and shoots; mould is treated as patchy by segment (really it can spread over
//  the shared filter paper); germination timing does not depend on density.
// SOURCES (checked 2026-11-17): the handbook pages above; Marciulioniene et al. (2005), Kalmar ECO-TECH '05, pp. 553–561:
//  cress controls in the dark at 24 °C, 25 seeds per 9 cm dish, 48 h: germination 96 ± 4 %, roots 25.6 to 36.0 mm
//  (plausibility check only, not shown as data).
window.BIO = window.BIO || {};
(function (B) {
  const P = { R1: 32, S1: 16, k: 0.15, G1: 0.95, gStep: 0.01, pDay: [0.4, 0.5, 0.1], fDay: [1.2, 0.96, 0.4], sV: 0.15, sO: 0.1, zMax: 2, segs: 8, densities: [1, 2, 3, 4, 5], capRoot: 65, capShoot: 35 };
  const C = (P.sV * P.sV + P.sO * P.sO) / 2; // 0.01625
  const R = (d) => P.R1 / (1 + P.k * (d - 1));
  const S = (d) => P.S1 / (1 + P.k * (d - 1));
  const G = (d) => P.G1 - P.gStep * (d - 1);
  const mult = (z1, z) => Math.exp(P.sV * z1 + P.sO * z - C);
  // one seedling, deterministic given its draws (used by the test cases)
  const seedling = (d, day, z1, z2, z3, f = {}) => ({
    root: Math.max(1, Math.round(R(d) * P.fDay[day - 1] * mult(z1, z2) * (f.root || 1))),
    shoot: Math.max(1, Math.round(S(d) * P.fDay[day - 1] * mult(z1, z3) * (f.shoot || 1))),
  });
  // seeded random numbers (mulberry32) and a truncated standard normal
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const znorm = (r) => { for (;;) { const u = r() || 1e-12, v = r(); const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); if (Math.abs(z) <= P.zMax) return z; } };

  // one dish: d seeds per segment; o = { water: "measured" | "byEye", place: "dark" | "windowsill", handling: "forceps" | "fingers" }
  function dish(d, o, r) {
    const wf = o.water === "byEye" ? 0.6 + 0.8 * r() : 1; const wg = 1 - 0.6 * Math.abs(wf - 1);
    const sill = o.place === "windowsill"; const fr = wg * (sill ? 0.8 : 1), fs = wg * (sill ? 0.6 : 1);
    const segs = [];
    for (let s = 0; s < P.segs; s++) {
      const mould = o.handling === "fingers" && r() < 0.1 + 0.04 * d;
      const g = G(d) * (sill ? 0.9 : 1) * (mould ? 0.3 : 1); const seeds = [];
      for (let i = 0; i < d; i++) {
        const u = r(), w = r(); const z1 = znorm(r), z2 = znorm(r), z3 = znorm(r); // draws taken for every seed so dishes are comparable
        if (u >= g) { seeds.push({ day: null }); continue; }
        const day = w < P.pDay[0] ? 1 : w < P.pDay[0] + P.pDay[1] ? 2 : 3;
        const m = mould ? 0.5 : 1; seeds.push(Object.assign({ day }, seedling(d, day, z1, z2, z3, { root: fr * m, shoot: fs * m })));
      }
      segs.push({ mould, seeds });
    }
    return { d, sown: d * P.segs, wf, segs };
  }
  // the whole experiment: five dishes set up together
  function experiment(o = {}) { const r = rng(o.seed || 1); return P.densities.map((d) => dish(d, o, r)); }
  const seedsOf = (D) => D.segs.flatMap((s) => s.seeds);
  const counts = (D) => [1, 2, 3].map((t) => seedsOf(D).filter((x) => x.day && x.day <= t).length); // germinated by day 1, 2, 3
  const lengths = (D, k) => seedsOf(D).filter((x) => x.day).map((x) => x[k]);

  // descriptive statistics (handbook pp. 41 to 42)
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  function stats(a) {
    const n = a.length; if (!n) return { n: 0 }; const m = mean(a); if (n < 2) return { n, mean: m };
    const sd = Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (n - 1)); const se = sd / Math.sqrt(n);
    return { n, mean: m, sd, se, lo: m - 1.96 * se, hi: m + 1.96 * se };
  }
  // chi-squared on germinated / not germinated at each density (expected from the overall proportion germinated)
  function chi2(sown, germ) {
    const N = sown.reduce((s, x) => s + x, 0), Gt = germ.reduce((s, x) => s + x, 0); const p = Gt / N; let chi = 0; const exp = [];
    sown.forEach((n, i) => { const eg = n * p, en = n * (1 - p); exp.push([eg, en]); if (eg > 0) chi += (germ[i] - eg) ** 2 / eg; if (en > 0) chi += (n - germ[i] - en) ** 2 / en; });
    const minE = Math.min(...exp.flat()); return { chi, df: (2 - 1) * (sown.length - 1), p, expected: exp, minE, valid: minE >= 5, crit: CRIT[(2 - 1) * (sown.length - 1)] };
  }
  const CRIT = { 1: 3.84, 2: 5.99, 3: 7.82, 4: 9.49 }; // chi-squared critical values at P = 0.05

  // ---- validate(): the worked test cases of B5-MODEL.md (hand results) plus range checks ----
  function validate() {
    const e = []; const near = (a, b, tol, msg) => { if (!(Math.abs(a - b) <= tol)) e.push(`${msg}: got ${a}, expected ${b}`); };
    near(R(1), 32, 1e-9, "T1 R(1)"); near(S(1), 16, 1e-9, "T1 S(1)"); near(G(1), 0.95, 1e-9, "T1 G(1)");
    near(R(3), 24.615, 0.001, "T2 R(3)"); near(S(3), 12.308, 0.001, "T2 S(3)"); near(24 * G(3), 22.32, 1e-9, "T2 germinated");
    near(R(5), 20, 1e-9, "T3 R(5)"); near(S(5), 10, 1e-9, "T3 S(5)"); near(40 * G(5), 36.4, 1e-9, "T3"); near(40 * G(5) * 0.4, 14.56, 1e-9, "T3 day 1"); near(40 * G(5) * 0.9, 32.76, 1e-9, "T3 day 2");
    near(P.pDay.reduce((s, p, i) => s + p * P.fDay[i], 0), 1, 1e-9, "mean day factor");
    near(seedling(2, 1, 1, -0.5, 0).root, 36, 0, "T4"); near(seedling(4, 3, -2, -2, 0).root, 5, 0, "T5");
    near(Math.round(32 * 0.96 * mult(0, 0) * (1 - 0.6 * 0.3)), 25, 0, "T6"); near(seedling(1, 1, 0, 0, 0, { shoot: 0.6 }).shoot, 11, 0, "T7");
    near(0.1 + 0.04 * 5, 0.3, 1e-9, "T8 mould"); near(0.3 * G(5), 0.273, 1e-9, "T8 germination");
    const t9 = stats([36, 29, 44, 33, 25, 39, 30, 20]); near(t9.mean, 32, 1e-9, "T9 mean"); near(t9.sd, 7.709, 0.001, "T9 SD"); near(t9.se, 2.726, 0.001, "T9 SE"); near(t9.lo, 26.66, 0.005, "T9 lower"); near(t9.hi, 37.34, 0.005, "T9 upper");
    const t10 = chi2([80, 160, 240, 320, 400], [77, 150, 222, 293, 362]); near(t10.chi, 4.0166, 0.0005, "T10 chi-squared"); near(t10.df, 4, 0, "T10 df"); if (!(t10.chi < t10.crit) || !t10.valid) e.push("T10 should be valid and not significant");
    // T11: expected root falls with density; simulation means and ranges
    for (let d = 2; d <= 5; d++) if (!(R(d) < R(d - 1))) e.push("T11 R not decreasing at " + d);
    const sums = P.densities.map(() => ({ r: 0, s: 0, n: 0 })); let bad = 0;
    for (let k = 1; k <= 400; k++) { const ex = experiment({ seed: 1000 + k }); ex.forEach((D, i) => { const c = counts(D); if (!(c[0] <= c[1] && c[1] <= c[2] && c[2] <= D.sown)) bad++; for (const x of seedsOf(D)) if (x.day) { sums[i].r += x.root; sums[i].s += x.shoot; sums[i].n++; if (x.root < 1 || x.root > P.capRoot || x.shoot < 1 || x.shoot > P.capShoot) bad++; } }); }
    if (bad) e.push(`${bad} impossible values in 400 simulated experiments`);
    sums.forEach((z, i) => { const d = i + 1; if (Math.abs(z.r / z.n / R(d) - 1) > 0.03) e.push(`T11 mean root at d = ${d} is ${(z.r / z.n).toFixed(2)}, model ${R(d).toFixed(2)}`); if (Math.abs(z.s / z.n / S(d) - 1) > 0.04) e.push(`T11 mean shoot at d = ${d}`); });
    for (const o of [{ water: "byEye" }, { place: "windowsill" }, { handling: "fingers" }]) for (let k = 1; k <= 40; k++) experiment(Object.assign({ seed: 7 + k }, o)).forEach((D) => { for (const x of seedsOf(D)) if (x.day && (x.root < 1 || x.shoot < 1 || x.root > P.capRoot || x.shoot > P.capShoot)) e.push("error run out of range"); });
    return e;
  }

  B.seedlingModel = { P, R, S, G, mult, seedling, experiment, dish, seedsOf, counts, lengths, mean, stats, chi2, CRIT, validate };
})(window.BIO);
