// B.chiModel: chi-squared goodness-of-fit test for genetic ratios (3.3.6.2.s2), Phase 5 Batch 3, author B4.
// Specification, sources, test cases and answer key: scratchpad p5b3/B4-MODEL.md, reviewed in MR-B4 (approved with
// changes, all applied). Students see only a one-line "Simplified model" note; the model is documented here.
//
// ONE supported model: Pearson's goodness-of-fit test of whole-number counts O1..Ok (2 <= k <= 9) against a ratio
// r1:..:rk of whole numbers 1..99 that is fully specified before the data are collected.
//   Ei = N × ri / Σr (never rounded inside the model); χ² = Σ (Oi − Ei)² / Ei; degrees of freedom = k − 1.
//   χ² >= critical value (P = 0.05) => P <= 0.05 => the difference is significant => reject the null hypothesis.
//   χ² <  critical value              => P > 0.05  => not significant (probably due to chance) => accept the null
//   hypothesis; this supports the expected ratio but never proves it (OxfordAQA 9610 Practical Handbook 2019, p. 43).
// Refusals, checked in this order: few (k < 2), many (k > 9), len, count (negative, non-whole or non-number observed),
// ratio (part 0, negative, non-whole or > 99), zero-n (all observed 0), small-e (any expected value below 5).
// Not supported (no code path): tests of association (contingency tables); ratios using a value estimated from the
// same data (allele frequencies, recombination frequency), which would change the degrees of freedom; Yates'
// correction; exact or one-tailed tests; "expected ratios under linkage". For linked genes the only expected ratio is
// the null hypothesis of independent assortment (e.g. 1:1:1:1 in a test cross).
// Critical values: NIST/SEMATECH e-Handbook of Statistical Methods 1.3.6.7.4 (fetched 17 Nov 2026; page undated).
// Decisions use 4 decimal place values; students see the NIST values rounded to 2 dp, stored as strings. validate()
// recomputes every value from the regularised incomplete gamma function.
// Expected ratios are re-derived by enumerating every gamete combination of the stated parents (validate()).
// Real data: G2 only, Mendel (1866) First Experiment of section 8, 556 seeds (MendelWeb translation, fetched
// 17 Nov 2026). Every other data set is hypothetical or simulated and labelled so on screen.
window.BIO = window.BIO || {};
(function (B) {
  // ---------------- seeded random numbers (mulberry32, as in the other models) ----------------
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---------------- critical values ----------------
  const PS = [0.1, 0.05, 0.01, 0.001];
  const CRIT4 = { // df: [P = 0.10, 0.05, 0.01, 0.001], 4 dp
    1: [2.7055, 3.8415, 6.6349, 10.8276], 2: [4.6052, 5.9915, 9.2103, 13.8155], 3: [6.2514, 7.8147, 11.3449, 16.2662],
    4: [7.7794, 9.4877, 13.2767, 18.4668], 5: [9.2364, 11.0705, 15.0863, 20.5150], 6: [10.6446, 12.5916, 16.8119, 22.4577],
    7: [12.0170, 14.0671, 18.4753, 24.3219], 8: [13.3616, 15.5073, 20.0902, 26.1245] };
  const NIST = { // as printed by NIST (3 dp)
    1: [2.706, 3.841, 6.635, 10.828], 2: [4.605, 5.991, 9.210, 13.816], 3: [6.251, 7.815, 11.345, 16.266], 4: [7.779, 9.488, 13.277, 18.467],
    5: [9.236, 11.070, 15.086, 20.515], 6: [10.645, 12.592, 16.812, 22.458], 7: [12.017, 14.067, 18.475, 24.322], 8: [13.362, 15.507, 20.090, 26.125] };
  const SHOW = { // student display, 2 dp (exact values rounded; df 3 at P = 0.05 kept at 7.82, the value printed in UK biology tables and used across this site)
    1: ["2.71", "3.84", "6.63", "10.83"], 2: ["4.61", "5.99", "9.21", "13.82"], 3: ["6.25", "7.82", "11.34", "16.27"], 4: ["7.78", "9.49", "13.28", "18.47"],
    5: ["9.24", "11.07", "15.09", "20.52"], 6: ["10.64", "12.59", "16.81", "22.46"], 7: ["12.02", "14.07", "18.48", "24.32"], 8: ["13.36", "15.51", "20.09", "26.12"] };
  const crit05 = (df) => CRIT4[df][1];
  // RK-1: decisions use the numbers students compare: χ² rounded to 2 dp against the 2 dp critical value in the table
  // (χ² equal to or greater than the critical value is significant), so the sentence shown can never contradict itself.
  const r2 = (x) => Math.round(x * 100 + (x >= 0 ? 1e-9 : -1e-9)) / 100;
  const decide = (chi2, df) => { const c = r2(chi2), k = Number(SHOW[df][1]); return { significant: c >= k, borderline: Math.abs(c - k) <= 0.01 + 1e-9, chi2r: c, crit: k }; };

  // upper-tail probability of the chi-squared distribution, Q(df/2, x/2) (series and continued fraction; Numerical Recipes)
  const lnGamma = (z) => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let x = z, y = z, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const k of c) s += k / ++y; return -t + Math.log(2.5066282746310005 * s / x); };
  function upperTail(x, df) {
    const a = df / 2, z = x / 2; if (z <= 0) return 1;
    if (z < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 500; n++) { ap += 1; del *= z / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; } return 1 - sum * Math.exp(-z + a * Math.log(z) - lnGamma(a)); }
    let b = z + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d; for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; }
    return Math.exp(-z + a * Math.log(z) - lnGamma(a)) * h;
  }
  const critBisect = (df, p) => { let lo = 0, hi = 100; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (upperTail(m, df) > p) lo = m; else hi = m; } return (lo + hi) / 2; };

  // ---------------- display helpers ----------------
  const fmt2 = (x) => { const v = r2(x); return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2); };
  const fmtE = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (Math.round(x * 100 + 1e-9) / 100).toString());
  const ratioText = (r) => r.join(":");
  const pBandOf = (chi2, df) => { const c = SHOW[df].map(Number); chi2 = r2(chi2); if (chi2 < c[0]) return "P > 0.10"; if (chi2 < c[1]) return "0.05 < P ≤ 0.10"; if (chi2 < c[2]) return "0.01 < P ≤ 0.05"; if (chi2 < c[3]) return "0.001 < P ≤ 0.01"; return "P ≤ 0.001"; };

  // ---------------- the test ----------------
  const isWhole = (x) => typeof x === "number" && isFinite(x) && Math.abs(x - Math.round(x)) < 1e-12;
  function test({ observed, ratio, labels } = {}) {
    const O = observed || [], r = ratio || [];
    if (O.length < 2 || r.length < 2) return { ok: false, code: "few", err: "The test needs at least two categories." };
    if (O.length > 9 || r.length > 9) return { ok: false, code: "many", err: "This course uses tables for up to nine categories (8 degrees of freedom)." };
    if (O.length !== r.length) return { ok: false, code: "len", err: "Each category needs one observed number and one part of the ratio." };
    if (O.some((x) => !isWhole(x) || x < 0)) return { ok: false, code: "count", err: "Observed values must be counts of individuals (whole numbers, 0 or more), not percentages, means or proportions." };
    if (r.some((x) => !isWhole(x) || x < 1 || x > 99)) return { ok: false, code: "ratio", err: "Each part of the ratio must be a whole number from 1 to 99. Leave out a category that cannot occur: any individuals in it would already contradict the hypothesis." };
    const N = O.reduce((a, b) => a + b, 0); if (N === 0) return { ok: false, code: "zero-n", err: "There are no data: every observed number is 0." };
    const S = r.reduce((a, b) => a + b, 0), E = r.map((x) => (N * x) / S);
    if (E.some((e) => e < 5)) return { ok: false, code: "small-e", err: "At least one expected number is below 5, so the test would not be reliable. Collect more data, or combine categories only if the combined categories still test the same hypothesis (this also reduces the degrees of freedom).", expected: E };
    const diff = O.map((o, i) => o - E[i]), diffSq = diff.map((d) => d * d), contrib = diffSq.map((d, i) => d / E[i]);
    const chi2 = contrib.reduce((a, b) => a + b, 0), df = O.length - 1, c = crit05(df);
    const { significant, borderline } = decide(chi2, df);
    return { ok: true, N, labels: labels || O.map((_, i) => "Category " + (i + 1)), observed: O.slice(), ratio: r.slice(), expected: E, diff, diffSq, contrib, chi2, df,
      crit05: c, critShow: SHOW[df][1], critRow: CRIT4[df], pBand: pBandOf(chi2, df), significant, borderline,
      nullText: nullText(r), decisionText: decisionText(significant, df, chi2, borderline) };
  }
  const nullText = (r) => `There is no significant difference between the observed numbers and the numbers expected from a ${ratioText(r)} ratio.`;
  function decisionText(sig, df, chi2, borderline) {
    const cs = SHOW[df][1];
    const t = sig ? `χ² = ${fmt2(chi2)} is greater than or equal to the critical value of ${cs} (${df} degree${df === 1 ? "" : "s"} of freedom, P = 0.05), so P ≤ 0.05. The difference between the observed and expected numbers is significant: it is unlikely to be due to chance alone. Reject the null hypothesis.`
      : `χ² = ${fmt2(chi2)} is less than the critical value of ${cs} (${df} degree${df === 1 ? "" : "s"} of freedom, P = 0.05), so P > 0.05. The difference between the observed and expected numbers is not significant: it is probably due to chance. Accept the null hypothesis. This supports the expected ratio; it does not prove it.`;
    return t + (borderline ? " The value is very close to the critical value, so the conclusion is borderline." : "");
  }
  // marking typed answers
  const nearChi = (given, exact) => typeof given === "number" && isFinite(given) && Math.abs(given - exact) <= Math.max(0.02, 0.02 * Math.abs(exact)) + 1e-9;
  const nearE = (given, exact) => typeof given === "number" && isFinite(given) && Math.abs(given - exact) <= 0.05 + 1e-9;

  // ---------------- crosses: exhaustive enumeration of gametes ----------------
  // A cross: loci = [{ al: [alleles in display order] }], p1 and p2 = one [allele, allele] pair per locus (unlinked loci
  // assort independently; a sex-chromosome locus uses alleles such as "XR", "Xr", "Y"), pheno(genotype) -> class key.
  function gametesOf(parent) { let out = [[]]; for (const pair of parent) { const next = []; for (const g of out) for (const a of pair) next.push([...g, a]); out = next; } return out; } // 2^n, equal probability
  const orderPair = (locus, a, b) => (locus.al.indexOf(a) <= locus.al.indexOf(b) ? [a, b] : [b, a]);
  function enumerate(cross) {
    const g1 = gametesOf(cross.p1), g2 = gametesOf(cross.p2), cells = [], counts = {};
    for (const a of g1) for (const b of g2) { const geno = cross.loci.map((L, i) => orderPair(L, a[i], b[i])); const ph = cross.pheno(geno); counts[ph] = (counts[ph] || 0) + 1; cells.push({ a, b, geno, ph }); }
    const gcd = (x, y) => (y ? gcd(y, x % y) : x); const vals = cross.classes.map((k) => counts[k] || 0);
    const g = vals.filter((v) => v).reduce(gcd); const extra = Object.keys(counts).filter((k) => !cross.classes.includes(k));
    return { g1, g2, cells, counts, ratio: vals.map((v) => v / g), extra, total: cells.length };
  }
  const has = (pair, a) => pair.includes(a);
  const ONE = (A, a) => [{ al: [A, a] }];
  const TWO = (A, a, Bb, b) => [{ al: [A, a] }, { al: [Bb, b] }];
  const sup = (base, s) => `${base}<sup>${s}</sup>`;

  // Model 2 crosses (generic ids used by the practice generator) and the scenario crosses
  const CROSSES = {
    mono: { loci: ONE("A", "a"), p1: [["A", "a"]], p2: [["A", "a"]], pheno: (g) => (has(g[0], "A") ? "dom" : "rec"), classes: ["dom", "rec"], ratio: [3, 1] },
    mtest: { loci: ONE("A", "a"), p1: [["A", "a"]], p2: [["a", "a"]], pheno: (g) => (has(g[0], "A") ? "dom" : "rec"), classes: ["dom", "rec"], ratio: [1, 1] },
    codom: { loci: ONE("R", "W"), p1: [["R", "W"]], p2: [["R", "W"]], pheno: (g) => g[0].join(""), classes: ["RR", "RW", "WW"], ratio: [1, 2, 1] },
    dihyb: { loci: TWO("A", "a", "B", "b"), p1: [["A", "a"], ["B", "b"]], p2: [["A", "a"], ["B", "b"]], pheno: (g) => (has(g[0], "A") ? "A" : "a") + (has(g[1], "B") ? "B" : "b"), classes: ["AB", "Ab", "aB", "ab"], ratio: [9, 3, 3, 1] },
    dtest: { loci: TWO("A", "a", "B", "b"), p1: [["A", "a"], ["B", "b"]], p2: [["a", "a"], ["b", "b"]], pheno: (g) => (has(g[0], "A") ? "A" : "a") + (has(g[1], "B") ? "B" : "b"), classes: ["AB", "Ab", "aB", "ab"], ratio: [1, 1, 1, 1] },
    xlink: { loci: [{ al: ["XR", "Xr", "Y"] }], p1: [["XR", "Xr"]], p2: [["XR", "Y"]], pheno: (g) => (has(g[0], "Y") ? (has(g[0], "XR") ? "redM" : "whiteM") : (has(g[0], "XR") ? "redF" : "whiteF")), classes: ["redF", "redM", "whiteM"], ratio: [2, 1, 1] },
    abo: { loci: [{ al: ["A", "B", "O"] }], p1: [["A", "O"]], p2: [["B", "O"]], pheno: (g) => (has(g[0], "A") && has(g[0], "B") ? "AB" : has(g[0], "A") ? "A" : has(g[0], "B") ? "B" : "O"), classes: ["AB", "A", "B", "O"], ratio: [1, 1, 1, 1] },
    epiR: { loci: TWO("A", "a", "C", "c"), p1: [["A", "a"], ["C", "c"]], p2: [["A", "a"], ["C", "c"]], pheno: (g) => (!has(g[1], "C") ? "albino" : has(g[0], "A") ? "agouti" : "black"), classes: ["agouti", "black", "albino"], ratio: [9, 3, 4] },
    epiD: { loci: TWO("W", "w", "Y", "y"), p1: [["W", "w"], ["Y", "y"]], p2: [["W", "w"], ["Y", "y"]], pheno: (g) => (has(g[0], "W") ? "white" : has(g[1], "Y") ? "yellow" : "green"), classes: ["white", "yellow", "green"], ratio: [12, 3, 1] },
    comp: { loci: TWO("A", "a", "B", "b"), p1: [["A", "a"], ["B", "b"]], p2: [["A", "a"], ["B", "b"]], pheno: (g) => (has(g[0], "A") && has(g[1], "B") ? "purple" : "white"), classes: ["purple", "white"], ratio: [9, 7] },
  };

  // ---------------- Genetic Data Challenge scenarios ----------------
  // html(allele) gives the display form of an allele; names maps class key -> phenotype name; phen(key) names parents.
  const plainAl = (a) => a;
  const SCEN = [
    { id: "G1", title: "Tall and dwarf pea plants", tag: "Monohybrid cross", source: "Hypothetical data.",
      story: "Two tall pea plants, both heterozygous for the height gene (T, tall, is dominant to t, dwarf), were crossed. The seeds were sown and the offspring plants counted.",
      cross: { loci: ONE("T", "t"), p1: [["T", "t"]], p2: [["T", "t"]], pheno: (g) => (has(g[0], "T") ? "tall" : "dwarf"), classes: ["tall", "dwarf"] },
      names: { tall: "tall", dwarf: "dwarf" }, parents: ["tall", "tall"], al: plainAl, observed: [312, 88],
      options: [[3, 1], [1, 1], [1, 2, 1], [9, 3, 3, 1]],
      meaning: "The data are consistent with a monohybrid cross between two heterozygotes, with complete dominance." },
    { id: "G2", title: "Mendel's round and wrinkled, yellow and green peas", tag: "Dihybrid cross (real data)", source: "Real data: Mendel (1866), the first experiment on hybrids differing in two characters; 556 seeds from 15 plants.",
      story: "Mendel crossed plants grown from round yellow seeds, heterozygous for seed shape (R, round, dominant to r, wrinkled) and seed colour (Y, yellow, dominant to y, green), and counted the seeds produced. Assume the two genes are on different chromosomes.",
      cross: { loci: TWO("R", "r", "Y", "y"), p1: [["R", "r"], ["Y", "y"]], p2: [["R", "r"], ["Y", "y"]], pheno: (g) => (has(g[0], "R") ? "round " : "wrinkled ") + (has(g[1], "Y") ? "yellow" : "green"), classes: ["round yellow", "round green", "wrinkled yellow", "wrinkled green"] },
      names: null, parents: ["round yellow", "round yellow"], al: plainAl, observed: [315, 108, 101, 32],
      options: [[9, 3, 3, 1], [1, 1, 1, 1], [3, 1], [9, 3, 4]],
      meaning: "The data are consistent with two genes that assort independently.",
      stretch: "Stretch: Mendel's counts fit the expected numbers unusually closely. The statistician R. A. Fisher (1936) argued that Mendel's results, taken together, fit better than chance would usually allow." },
    { id: "G3", title: "ABO blood groups", tag: "Multiple alleles and codominance", source: "Hypothetical data, pooled from many families.",
      story: "In each family, one parent has genotype I<sup>A</sup>I<sup>O</sup> (blood group A) and the other I<sup>B</sup>I<sup>O</sup> (blood group B). I<sup>A</sup> and I<sup>B</sup> are codominant; both are dominant to I<sup>O</sup>. The blood groups of 200 of their children were recorded.",
      cross: CROSSES.abo, names: { AB: "group AB", A: "group A", B: "group B", O: "group O" }, parents: ["group A", "group B"], al: (a) => sup("I", a), observed: [54, 47, 44, 55],
      options: [[1, 1, 1, 1], [9, 3, 3, 1], [1, 2, 1], [3, 1]],
      meaning: "The data are consistent with three alleles of one gene, I<sup>A</sup> and I<sup>B</sup> codominant and both dominant to I<sup>O</sup>." },
    { id: "G4", title: "Eye colour in fruit flies", tag: "Sex-linkage", source: "Hypothetical data.",
      story: "In fruit flies the eye-colour gene is on the X chromosome; there is no copy on the Y chromosome. X<sup>R</sup> (red eyes) is dominant to X<sup>r</sup> (white eyes). A red-eyed female X<sup>R</sup>X<sup>r</sup> was crossed with a red-eyed male X<sup>R</sup>Y. No white-eyed females were found.",
      cross: CROSSES.xlink, names: { redF: "red-eyed female", redM: "red-eyed male", whiteM: "white-eyed male", whiteF: "white-eyed female" }, parents: ["red-eyed female", "red-eyed male"],
      al: (a) => (a === "Y" ? "Y" : sup("X", a.slice(1))), observed: [206, 98, 96],
      options: [[2, 1, 1], [1, 1, 1], [1, 1, 1, 1], [1, 2, 1]],
      meaning: "The data are consistent with an X-linked gene: every daughter receives her father's X<sup>R</sup>, so white eyes appear only in sons." },
    { id: "G5", title: "Body colour and wing shape in fruit flies", tag: "Autosomal linkage", source: "Hypothetical data.",
      story: "Grey body (G) is dominant to black (g) and long wings (L) are dominant to vestigial wings (l). Females heterozygous for both genes, GgLl (from a GGLL × ggll cross), were crossed with black, vestigial-winged males (ggll). The null hypothesis is that the two genes are not linked, so they assort independently.",
      cross: { loci: TWO("G", "g", "L", "l"), p1: [["G", "g"], ["L", "l"]], p2: [["g", "g"], ["l", "l"]], pheno: (g) => (has(g[0], "G") ? "grey" : "black") + (has(g[1], "L") ? " long" : " vestigial"), classes: ["grey long", "black vestigial", "grey vestigial", "black long"] },
      names: null, parents: ["grey long", "black vestigial"], al: plainAl, observed: [412, 396, 94, 98], nullLabel: "if the genes were not linked (the null hypothesis)",
      options: [[1, 1, 1, 1], [9, 3, 3, 1], [3, 1], [1, 2, 1]],
      meaning: "The difference is far too large to be due to chance. This is consistent with the two genes being linked on the same chromosome: grey long and black vestigial are the parental combinations, inherited together, while grey vestigial and black long (192 of 1000 flies) are recombinants produced by crossing over in prophase I of meiosis. The test does not prove that the genes are linked." },
    { id: "G6", title: "Coat colour in Labrador dogs", tag: "Epistasis", source: "Hypothetical data, pooled from many litters.",
      story: "B (black pigment) is dominant to b (brown, chocolate). A second, unlinked gene controls whether pigment is put into the hairs: ee dogs are yellow whatever their B/b alleles, so ee masks the B gene. Black dogs BbEe were crossed with each other.",
      cross: { loci: TWO("B", "b", "E", "e"), p1: [["B", "b"], ["E", "e"]], p2: [["B", "b"], ["E", "e"]], pheno: (g) => (!has(g[1], "E") ? "yellow" : has(g[0], "B") ? "black" : "chocolate"), classes: ["black", "chocolate", "yellow"] },
      names: null, parents: ["black", "black"], al: plainAl, observed: [86, 36, 38],
      options: [[9, 3, 4], [9, 3, 3, 1], [12, 3, 1], [9, 7]],
      meaning: "The data are consistent with epistasis: the ee genotype masks the B gene, so the 3 B_ee and 1 bbee offspring are all yellow (3 + 1 = 4)." },
    { id: "G7", title: "Green and albino maize seedlings", tag: "Monohybrid cross", source: "Hypothetical data.",
      story: "Maize plants heterozygous for a gene needed to make chlorophyll (G, green, dominant to g; gg seedlings are albino) were crossed. The seedlings were counted three weeks after sowing.",
      cross: { loci: ONE("G", "g"), p1: [["G", "g"]], p2: [["G", "g"]], pheno: (g) => (has(g[0], "G") ? "green" : "albino"), classes: ["green", "albino"] },
      names: null, parents: ["green", "green"], al: plainAl, observed: [330, 70],
      options: [[3, 1], [1, 1], [1, 2, 1], [9, 7]],
      meaning: "The difference is significant, but the test does not tell you why. One suggestion: albino seedlings have no chlorophyll, cannot photosynthesise and many may have died before they were counted. Unequal survival breaks one of the assumptions behind the 3:1 ratio." },
  ];
  SCEN.forEach((s) => { s.ratio = enumerate(s.cross).ratio; s.labels = s.cross.classes.map((k) => (s.names ? s.names[k] : k)); });

  // ---------------- guided presets ----------------
  const PRESETS = [
    { id: "P1", title: "Maize kernels (3:1)", source: "Hypothetical data.", story: "Kernels on cobs from a cross between two maize plants heterozygous for kernel colour (purple dominant to yellow).", labels: ["purple", "yellow"], observed: [290, 110], ratio: [3, 1] },
    { id: "P2", title: "Roan cattle (1:2:1)", source: "Hypothetical data, pooled from farm records.", story: "Calves from roan × roan matings. The alleles for red and white coat are codominant, so heterozygous cattle are roan.", labels: ["red", "roan", "white"], observed: [26, 65, 29], ratio: [1, 2, 1] },
    { id: "P3", title: "Tomato plants (9:3:3:1)", source: "Hypothetical data.", story: "Offspring of tomato plants heterozygous for two unlinked genes: stem colour (purple dominant to green) and leaf shape (cut dominant to potato-leaf).", labels: ["purple, cut", "purple, potato-leaf", "green, cut", "green, potato-leaf"], observed: [81, 37, 33, 9], ratio: [9, 3, 3, 1] },
  ];

  // ---------------- practice generator ----------------
  // The correct conclusion always comes from the student's data (χ² against the critical value), never from the
  // model that generated them. Null branch: counts drawn from the expected ratio; N with every E >= 10.
  // Alternative branch (N >= 400): dtest from linked genes (recombination frequency 0.10 to 0.30, parental classes
  // (1 − rf)/2 each); every other scenario with one class's probability multiplied by a survival factor 0.6 to 0.75 and
  // all class probabilities renormalised, N fixed.
  const PRACTICE = {
    mono: { story: "Pea plants from a cross between two plants heterozygous for flower colour (purple dominant to white).", labels: ["purple", "white"], alt: 1 },
    mtest: { story: "A test cross: heterozygous black guinea pigs (Bb) crossed with white guinea pigs (bb).", labels: ["black", "white"], alt: 1 },
    codom: { story: "Calves from roan × roan matings (red and white alleles codominant; roan is heterozygous).", labels: ["red", "roan", "white"], alt: 2 },
    dihyb: { story: "Pea plants from a cross between two plants heterozygous for two unlinked genes: seed shape (round dominant to wrinkled) and seed colour (yellow dominant to green).", labels: ["round yellow", "round green", "wrinkled yellow", "wrinkled green"], alt: 3 },
    dtest: { story: "A test cross in maize: plants heterozygous for kernel colour (coloured dominant to colourless) and kernel shape (smooth dominant to shrunken), from a cross of two pure-breeding lines, crossed with colourless shrunken plants. The null hypothesis is that the genes are not linked.", labels: ["coloured smooth", "coloured shrunken", "colourless smooth", "colourless shrunken"], linked: true },
    xlink: { story: "Fruit flies: a red-eyed female heterozygous for the X-linked eye-colour gene crossed with a red-eyed male. No white-eyed females were found.", labels: ["red-eyed female", "red-eyed male", "white-eyed male"], alt: 2 },
    abo: { story: "Children of parents with genotypes I<sup>A</sup>I<sup>O</sup> and I<sup>B</sup>I<sup>O</sup>, pooled from many families.", labels: ["group AB", "group A", "group B", "group O"], alt: 3 },
    epiR: { story: "Mice heterozygous for two unlinked genes, AaCc, crossed with each other. A (agouti) is dominant to a (black); cc mice are albino whatever their A/a alleles.", labels: ["agouti", "black", "albino"], alt: 2 },
    epiD: { story: "Squash plants WwYy crossed with each other (two unlinked genes). W gives white fruit whatever the Y/y alleles; in ww plants Y gives yellow fruit and yy green fruit.", labels: ["white", "yellow", "green"], alt: 2 },
    comp: { story: "Sweet pea plants AaBb crossed with each other (two unlinked genes). Purple flowers need at least one dominant allele of both genes; all other plants have white flowers.", labels: ["purple", "white"], alt: 1 },
  };
  const PRACTICE_IDS = Object.keys(PRACTICE);
  function generate(seed, ids = PRACTICE_IDS) {
    const R = rng(seed), pick = (a) => a[Math.floor(R() * a.length)];
    const id = pick(ids.filter((k) => PRACTICE[k])), P = PRACTICE[id], ratio = CROSSES[id].ratio, S = ratio.reduce((a, b) => a + b, 0), rmin = Math.min(...ratio);
    const alt = R() < 0.5; const mMin = Math.ceil(Math.max((10 * S) / rmin, alt ? 400 : 100) / S), mMax = Math.max(mMin, Math.floor((alt ? 800 : 600) / S));
    const N = S * (mMin + Math.floor(R() * (mMax - mMin + 1)));
    let probs = ratio.map((x) => x / S), altText = "";
    if (alt) { if (P.linked) { const rf = 0.1 + Math.round(R() * 20) / 100; probs = [(1 - rf) / 2, rf / 2, rf / 2, (1 - rf) / 2]; altText = `linked genes (${Math.round(rf * 100)} % of the offspring recombinant)`; }
      else { const f = 0.6 + Math.round(R() * 15) / 100, k = P.alt; probs = probs.map((p, i) => (i === k ? p * f : p)); const t = probs.reduce((a, b) => a + b, 0); probs = probs.map((p) => p / t); altText = `reduced survival of the ${P.labels[k]} class (${Math.round(f * 100)} % of them survived)`; } }
    const O = ratio.map(() => 0); for (let n = 0; n < N; n++) { let u = R(), i = 0; while (i < probs.length - 1 && u >= probs[i]) { u -= probs[i]; i++; } O[i]++; }
    return { seed, id, story: P.story, labels: P.labels, ratio: ratio.slice(), observed: O, N, simulatedFrom: alt ? "alt" : "null", altText };
  }
  // reveal note after a correct conclusion (M1: worded around what the data allow you to conclude)
  function practiceNote(g, significant) {
    if (g.simulatedFrom === "null") return significant
      ? "These data were simulated from the expected ratio, yet the difference was significant. By chance alone about 1 sample in 20 does this. Your conclusion is still the right one for these data: a statistical test can only tell you what the data allow you to conclude."
      : "These data were simulated from the expected ratio, and the difference was not significant, as happens in about 19 samples out of 20.";
    return significant
      ? `These data were simulated with ${g.altText}, and the test detected the difference.`
      : `These data were simulated with ${g.altText}, but the difference was too small to be detected with this sample size. Your conclusion is the right one for these data: failing to reject the null hypothesis does not prove it is true.`;
  }

  // ---------------- locks: data sets that belong to a question ----------------
  const LOCKS = [
    { observed: [140, 38, 46, 16], ratio: [9, 3, 3, 1], q: ["q-3.3.6-c16", "q-3.3.6-c17", "q-3.3.6-c18"], where: "the 3.3.6 topic assessment" },
    { observed: [180, 172, 26, 22], ratio: [1, 1, 1, 1], q: "q-3.3.6-c14", where: "the 3.3.6 topic assessment" },
  ];
  const answered = (qid) => { try { const a = B.store.get().attempts.filter((x) => x.qid === qid); return a.some((x) => x.score === x.max || x.mode === "self") || a.length >= 2; } catch (e) { return false; } };
  const pairsKey = (O, r) => O.map((o, i) => o + "/" + r[i]).sort().join(",");
  const lockFor = (O, r, extra = []) => [...LOCKS, ...extra].find((L) => L.observed.length === O.length && pairsKey(L.observed, L.ratio) === pairsKey(O, r) && ![].concat(L.q).every(answered)) || null;

  // ---------------- validate (hand-computed cases from B4-MODEL.md and the reviewer's reference) ----------------
  function validate() {
    const f = []; const close = (a, b, tol, m) => { if (!(Math.abs(a - b) <= tol)) f.push(`${m}: got ${a}, expected ${b}`); };
    const T = [ // observed, ratio, chi2 (hand), df, significant
      ["T1", [290, 110], [3, 1], 1.3333, 1, false], ["T2", [81, 37, 33, 9], [9, 3, 3, 1], 2.9333, 3, false], ["T3", [168, 34, 30, 168], [1, 1, 1, 1], 185.04, 3, true],
      ["T4", [104, 46, 50], [2, 1, 1], 0.48, 2, false], ["T5", [172, 70, 78], [9, 3, 4], 2.0722, 2, false], ["T6", [260, 140], [3, 1], 21.3333, 1, true],
      ["T7", [26, 65, 29], [1, 2, 1], 0.9833, 2, false], ["T8", [315, 108, 101, 32], [9, 3, 3, 1], 0.4700, 3, false], ["R9", [55, 45], [1, 1], 1.0, 1, false],
      ["G1", [312, 88], [3, 1], 1.92, 1, false], ["G3", [54, 47, 44, 55], [1, 1, 1, 1], 1.72, 3, false], ["G4", [206, 98, 96], [2, 1, 1], 0.38, 2, false],
      ["G5", [412, 396, 94, 98], [1, 1, 1, 1], 380.0, 3, true], ["G6", [86, 36, 38], [9, 3, 4], 1.4778, 2, false], ["G7", [330, 70], [3, 1], 12.0, 1, true],
      ["c16-18", [140, 38, 46, 16], [9, 3, 3, 1], 1.3630, 3, false], ["c14", [180, 172, 26, 22], [1, 1, 1, 1], 231.44, 3, true]];
    for (const [id, O, r, chi, df, sig] of T) { const t = test({ observed: O, ratio: r }); if (!t.ok) { f.push(id + " refused: " + t.err); continue; } close(t.chi2, chi, 1e-4, id + " χ²"); if (t.df !== df) f.push(id + " df"); if (t.significant !== sig) f.push(id + " decision"); }
    const t8 = test({ observed: [315, 108, 101, 32], ratio: [9, 3, 3, 1] }); [312.75, 104.25, 104.25, 34.75].forEach((e, i) => close(t8.expected[i], e, 1e-9, "T8 expected " + i)); [0.0162, 0.1349, 0.1013, 0.2176].forEach((c, i) => close(t8.contrib[i], c, 5e-5, "T8 contribution " + i));
    const cc = test({ observed: [140, 38, 46, 16], ratio: [9, 3, 3, 1] }); [135, 45, 45, 15].forEach((e, i) => close(cc.expected[i], e, 1e-9, "c16 expected " + i)); close(cc.contrib[1], 1.0889, 5e-5, "c17 contribution");
    if (pBandOf(1.3333, 1) !== "P > 0.10" || pBandOf(185.04, 3) !== "P ≤ 0.001" || pBandOf(12, 1) !== "P ≤ 0.001" || pBandOf(4.6, 1) !== "0.01 < P ≤ 0.05") f.push("P bands");
    // refusals, in order
    const R = [["R1", [10, 8, 9, 5], [9, 3, 3, 1], "small-e"], ["R2", [12.5, 30], [1, 1], "count"], ["R3", [30, 10], [9, 3, 3, 1], "len"], ["R4", [30, 10, 0], [2, 1, 0], "ratio"],
      ["R5", [40], [1], "few"], ["R6", Array(10).fill(20), Array(10).fill(1), "many"], ["R7", [-3, 50], [1, 1], "count"], ["R8", [0, 0], [3, 1], "zero-n"], ["R10", [30, 10], [3, 1.5], "ratio"]];
    for (const [id, O, r, code] of R) { const t = test({ observed: O, ratio: r }); if (t.ok || t.code !== code) f.push(`${id}: expected refusal ${code}, got ${t.ok ? "ok" : t.code}`); }
    // decision boundary and borderline flag
    const dec = (x, df) => { const d = decide(x, df); return { sig: d.significant, bl: d.borderline }; };
    if (!(dec(3.8415, 1).sig && dec(3.8415, 1).bl) || !dec(3.835, 1).sig || dec(3.834, 1).sig || !dec(3.834, 1).bl || dec(3.80, 1).bl || !dec(7.815, 3).sig || dec(7.8148, 3).sig) f.push("decision boundary");
    // RK-1 hand cases: 138, 62 against 3:1: E 150, 50; 144/150 + 144/50 = 0.96 + 2.88 = 3.84 = the critical value: significant.
    // 38, 52, 63, 63 against 1:1:1:1: E 54 each; (256 + 4 + 81 + 81)/54 = 422/54 = 7.8148, shown 7.81 < 7.82: not significant.
    { const a = test({ observed: [138, 62], ratio: [3, 1] }), b = test({ observed: [38, 52, 63, 63], ratio: [1, 1, 1, 1] });
      close(a.chi2, 3.84, 1e-9, "RK-1 138/62 χ²"); if (!a.significant || !/greater than or equal to the critical value of 3\.84/.test(a.decisionText) || !/χ² = 3\.84 /.test(a.decisionText)) f.push("RK-1 138/62 decision");
      close(b.chi2, 422 / 54, 1e-9, "RK-1 38/52/63/63 χ²"); if (b.significant || !/χ² = 7\.81 is less than the critical value of 7\.82/.test(b.decisionText)) f.push("RK-1 38/52/63/63 decision"); }
    // the decision sentence never contradicts its own numbers (every generated set and many random χ²)
    for (let df = 1; df <= 8; df++) for (let x = 0; x < 30; x += 0.0037) { const d = decide(x, df); if (d.significant !== (d.chi2r >= d.crit)) f.push("decide inconsistent"); }
    if (fmt2(7.815) !== "7.82" || fmt2(1.363) !== "1.36" || fmt2(0.38) !== "0.38") f.push("2 dp rounding");
    // critical values: bisection on the series tail, NIST table and stored 4 dp values agree (m2)
    for (let df = 1; df <= 8; df++) PS.forEach((p, j) => { const c = critBisect(df, p); if (Math.abs(c - CRIT4[df][j]) > 0.002 || Math.abs(c - NIST[df][j]) > 0.002) f.push(`critical value df ${df}, P ${p}: computed ${c.toFixed(4)}`);
      const q = upperTail(NIST[df][j], df); if (Math.abs(q - p) / p > 0.01) f.push(`tail at NIST value df ${df}, P ${p}: ${q}`);
      if (Math.abs(Number(SHOW[df][j]) - CRIT4[df][j]) > (df === 3 && j === 1 ? 0.0055 : 0.005)) f.push(`2 dp display df ${df}, P ${p}`); });
    close(upperTail(2 * Math.log(20), 2), 0.05, 1e-9, "df 2 closed form");
    // exact size of the test for k = 2 by enumerating every outcome (binomial), E >= 5
    const size = (N, p) => { let s = 0; const lf = [0]; for (let i = 1; i <= N; i++) lf[i] = lf[i - 1] + Math.log(i); for (let k = 0; k <= N; k++) { const t = test({ observed: [k, N - k], ratio: p === 0.75 ? [3, 1] : [1, 1] }); if (t.ok && t.chi2 >= crit05(1)) s += Math.exp(lf[N] - lf[k] - lf[N - k] + k * Math.log(p) + (N - k) * Math.log(1 - p)); } return s; };
    const s1 = size(100, 0.75), s2 = size(40, 0.5); if (!(s1 > 0.03 && s1 < 0.07)) f.push("exact size N 100: " + s1); if (!(s2 > 0.03 && s2 < 0.07)) f.push("exact size N 40: " + s2);
    close(s1, 0.0487, 0.0006, "exact size N 100 (reviewer)"); close(s2, 0.0385, 0.0006, "exact size N 40 (reviewer)");
    // every ratio re-derived by enumerating gametes
    for (const [id, c] of Object.entries(CROSSES)) { const e = enumerate(c); if (e.ratio.join() !== c.ratio.join()) f.push(`cross ${id}: enumerated ${e.ratio.join(":")}`); if (id !== "xlink" && e.extra.length) f.push(`cross ${id}: unlisted classes ${e.extra}`); if (id === "xlink" && e.extra.join() !== "") f.push("xlink: white-eyed females should not occur"); }
    const want = { G1: "3,1", G2: "9,3,3,1", G3: "1,1,1,1", G4: "2,1,1", G5: "1,1,1,1", G6: "9,3,4", G7: "3,1" };
    for (const s of SCEN) { if (s.ratio.join() !== want[s.id]) f.push(`${s.id} ratio ${s.ratio}`); if (s.options.filter((o) => o.join() === s.ratio.join()).length !== 1) f.push(`${s.id}: correct ratio not exactly once in options`); if (s.observed.length !== s.ratio.length || s.labels.length !== s.ratio.length) f.push(s.id + " lengths"); }
    for (const p of PRESETS) { const t = test(p); if (!t.ok) f.push(p.id + " refused"); }
    // generator: E >= 10, sums, reproducible, independent recomputation
    for (let seed = 1; seed <= 200; seed++) { const g = generate(seed), t = test(g); if (!t.ok) { f.push("generated set refused, seed " + seed + ": " + t.code); continue; }
      if (t.expected.some((e) => e < 10 - 1e-9)) f.push("generated E < 10, seed " + seed); if (g.observed.reduce((a, b) => a + b, 0) !== g.N) f.push("generated sum, seed " + seed);
      if (g.simulatedFrom === "alt" && g.N < 400) f.push("alternative N < 400, seed " + seed);
      let chi = 0; const S = g.ratio.reduce((a, b) => a + b, 0); for (let i = 0; i < g.ratio.length; i++) { const e = (g.N * g.ratio[i]) / S; chi += ((g.observed[i] - e) ** 2) / e; } close(t.chi2, chi, 1e-9, "generated χ² seed " + seed); }
    if (JSON.stringify(generate(42)) !== JSON.stringify(generate(42))) f.push("generator not reproducible");
    // locks are order-insensitive
    if (!lockFor([46, 140, 16, 38], [3, 9, 1, 3]) && !["q-3.3.6-c16", "q-3.3.6-c17", "q-3.3.6-c18"].every(answered)) f.push("lock not order-insensitive");
    return f;
  }

  B.chiModel = { PS, CRIT4, NIST, SHOW, crit05, decide, upperTail, critBisect, test, nullText, decisionText, pBandOf, fmt2, fmtE, ratioText, nearChi, nearE,
    CROSSES, enumerate, gametesOf, SCEN, PRESETS, PRACTICE, PRACTICE_IDS, generate, practiceNote, LOCKS, lockFor, answered, validate };
  try { const v = validate(); if (v.length) console.warn("B.chiModel checks failed", v); } catch (e) { console.warn("B.chiModel validate error", e); }
})(window.BIO);
