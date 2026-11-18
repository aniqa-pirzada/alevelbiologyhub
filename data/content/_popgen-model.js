// Population genetics model B.popModel for 3.3.7.1 Principles and applications and 3.3.7.2 The Hardy-Weinberg
// principle (Phase 5 Batch 4, author C1). Specification and hand-worked test cases: scratchpad p5b4/C1-MODEL.md,
// reviewed in MR-C1 (Stage 2 changes applied). Nothing here is shown to students; the pages show one-line
// "Simplified model" notes.
//   count / countMany      allele counting: N diploid individuals carry 2N copies of an autosomal gene
//   driftRun / drift       Wright-Fisher genetic drift: the 2N copies of each generation are drawn at random, with
//                          replacement, from the parents' gene pool (binomial); no selection, mutation or migration
//   bottleneckRun / bottleneck   six alleles in 1000 beads (500 individuals); survivors' 2n copies drawn WITHOUT
//                          replacement (seeded shuffle); recovery N_t = min(500, n·2^t) with drift
//   breed                  selective breeding: hypothetical maize, five unlinked additive genes ("+" adds 10 g),
//                          growing conditions add normal noise (SD 8 g); top fraction of 40 plants used as parents
//   hw.*                   Hardy-Weinberg calculations; q² is never taken from a dominant-phenotype frequency
//   hwStep                 deterministic generation steps showing what breaks the Hardy-Weinberg prediction
//   checkFreq / checkCount the answer rule (significant-figure aware; MR-C1 M2)
//   gen                    the Hardy-Weinberg problem generator (templates G-A to G-E; never a locked value)
//   LOCKS / lockFor        data sets of questions, refused by the calculator until the question has been answered
// Random models use mulberry32 with explicit seeds, so every run can be replayed.
window.BIO = window.BIO || {};
(function (B) {
  const EPS = 1e-9;
  // ---------------------------------------------------------------- random numbers
  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const runSeed = (base, r) => ((base >>> 0) * 1000003 + r) >>> 0;
  const isWhole = (x) => typeof x === "number" && isFinite(x) && Math.abs(x - Math.round(x)) < EPS;
  const refuse = (code, err) => ({ ok: false, code, err });
  // decimal-safe rounding for display (round half away from zero on the decimal string)
  function round(x, dp) { if (!isFinite(x)) return x; if (Math.abs(x) < 0.5 * Math.pow(10, -dp)) return 0; const sg = x < 0 ? -1 : 1, [m, e] = Math.abs(x).toExponential(14).split("e"); return sg * Number(Math.round(Number(m + "e" + (Number(e) + dp))) + "e-" + dp); }
  const fmt = (x, dp = 4) => { const r = round(x, dp); return String(r); };
  const pct = (x, dp = 1) => fmt(x * 100, dp) + " %";

  // ---------------------------------------------------------------- Model 1: allele counting
  function count(g) {
    const v = [g.AA, g.Aa, g.aa];
    if (v.some((x) => typeof x !== "number" || !isFinite(x))) return refuse("num", "Enter a number of individuals for each genotype.");
    if (v.some((x) => x < 0)) return refuse("neg", "Numbers of individuals cannot be negative.");
    if (v.some((x) => !isWhole(x))) return refuse("whole", "Numbers of individuals must be whole numbers.");
    const [AA, Aa, aa] = v.map(Math.round), N = AA + Aa + aa; if (!N) return refuse("empty", "There are no individuals to count.");
    if (N > 1e6) return refuse("num", "Use a population of at most 1 000 000.");
    const A = 2 * AA + Aa, a = Aa + 2 * aa;
    return { ok: true, N, copies: 2 * N, A, a, p: A / (2 * N), q: a / (2 * N), fAA: AA / N, fAa: Aa / N, faa: aa / N };
  }
  function countMany(copies) { const s = copies.reduce((x, y) => x + y, 0); return s ? copies.map((c) => c / s) : copies.map(() => 0); }

  // ---------------------------------------------------------------- Model 2: genetic drift
  // starting copies from the slider index i (0 to 20, steps of 0.05): exact round half up of i·2N/20 (MR-C1 m1)
  const k0From = (i, N) => Math.floor((2 * i * 2 * N + 20) / 40);
  function driftRun(N, k0, gens, seed) {
    const r = rng(seed), C = 2 * N, p = [k0 / C]; let k = k0, fixedAt = k0 === C ? 0 : null, lostAt = k0 === 0 ? 0 : null;
    for (let t = 1; t <= gens; t++) { if (k > 0 && k < C) { const f = k / C; let n = 0; for (let j = 0; j < C; j++) if (r() < f) n++; k = n; if (k === C && fixedAt === null) fixedAt = t; if (k === 0 && lostAt === null) lostAt = t; } p.push(k / C); }
    return { p, fixedAt, lostAt, k };
  }
  function drift(o) {
    const N = o.N; if (!isWhole(N) || N < 2 || N > 1000) return refuse("N", "Choose a population of 2 to 1000 individuals.");
    let k0; if (o.k0 !== undefined) { if (!isWhole(o.k0) || o.k0 < 0 || o.k0 > 2 * N) return refuse("p0", "The starting number of copies must be between 0 and 2N."); k0 = Math.round(o.k0); }
    else if (o.index !== undefined) { if (!isWhole(o.index) || o.index < 0 || o.index > 20) return refuse("p0", "Choose a starting frequency between 0 and 1."); k0 = k0From(o.index, N); }
    else { if (typeof o.p0 !== "number" || !isFinite(o.p0) || o.p0 < 0 || o.p0 > 1) return refuse("p0", "Choose a starting frequency between 0 and 1."); k0 = Math.floor(o.p0 * 2 * N + 0.5 + EPS); }
    if (!isWhole(o.gens) || o.gens < 1 || o.gens > 500) return refuse("gens", "Choose 1 to 500 generations.");
    if (!isWhole(o.runs) || o.runs < 1 || o.runs > 20) return refuse("runs", "Choose 1 to 20 runs.");
    const runs = []; for (let r = 0; r < o.runs; r++) runs.push(driftRun(N, k0, o.gens, runSeed(o.seed || 1, r)));
    const fixed = runs.filter((x) => x.fixedAt !== null).length, lost = runs.filter((x) => x.lostAt !== null).length;
    return { ok: true, N, k0, p0Actual: k0 / (2 * N), runs, summary: { fixed, lost, segregating: runs.length - fixed - lost } };
  }

  // ---------------------------------------------------------------- Model 3: genetic bottleneck
  const BN = { names: ["A1", "A2", "A3", "A4", "A5", "A6"], copies: [400, 250, 150, 100, 60, 40], N0: 500 };
  function bottleneckRun(n, gens, seed) {
    const r = rng(seed), beads = []; BN.copies.forEach((c, i) => { for (let j = 0; j < c; j++) beads.push(i); });
    const take = 2 * n; for (let j = 0; j < take; j++) { const k = j + Math.floor(r() * (beads.length - j)); const t = beads[j]; beads[j] = beads[k]; beads[k] = t; }
    const surv = beads.slice(0, take); const cnt = BN.copies.map((_, i) => surv.filter((x) => x === i).length);
    const hist = [{ N: n, counts: cnt.slice(), freq: countMany(cnt) }];
    let f = countMany(cnt);
    for (let t = 1; t <= gens; t++) { const Nt = Math.min(BN.N0, n * Math.pow(2, t)), C = 2 * Nt; const cum = []; f.reduce((s, x, i) => (cum[i] = s + x), 0); const c = f.map(() => 0);
      for (let j = 0; j < C; j++) { const u = r(); let i = 0; while (i < cum.length - 1 && u >= cum[i]) i++; while (f[i] === 0) i = (i + 1) % f.length; c[i]++; }
      f = countMany(c); hist.push({ N: Nt, counts: c, freq: f }); }
    return { survivors: surv, counts: cnt, retained: cnt.filter((x) => x > 0).length, hist, finalRetained: hist[hist.length - 1].counts.filter((x) => x > 0).length };
  }
  function bottleneck(o) {
    const n = o.n, all = o.control === true;
    if (!all && (!isWhole(n) || n < 1 || n > 100)) return refuse("n", "Choose 1 to 100 survivors.");
    const gens = o.gens === undefined ? 0 : o.gens; if (!isWhole(gens) || gens < 0 || gens > 30) return refuse("gens", "Choose 0 to 30 recovery generations.");
    const runs = o.runs === undefined ? 1 : o.runs; if (!isWhole(runs) || runs < 1 || runs > 50) return refuse("runs", "Choose 1 to 50 runs.");
    const nn = all ? BN.N0 : n; const out = []; for (let k = 0; k < runs; k++) out.push(bottleneckRun(nn, gens, runSeed(o.seed || 1, k)));
    const hist = [0, 0, 0, 0, 0, 0, 0]; out.forEach((x) => hist[x.retained]++);
    const lostShare = BN.copies.map((_, i) => out.filter((x) => x.counts[i] === 0).length / runs);
    return { ok: true, n: nn, runs: out, histogram: hist, lostShare };
  }
  // theory (without replacement): P(allele with k copies lost) = C(1000 − k, 2n) / C(1000, 2n)
  function pLost(k, n, total = 1000) { let p = 1; for (let j = 0; j < 2 * n; j++) p *= (total - k - j) / (total - j); return Math.max(0, p); }
  const expectedRetained = (n) => BN.copies.reduce((s, k) => s + 1 - pLost(k, n), 0);

  // ---------------------------------------------------------------- Model 4: selective breeding
  const BR = { L: 5, base: 100, effect: 10, envSD: 8, fractions: [1, 0.5, 0.25, 0.1] };
  function breed(o) {
    const f = o.f, N = o.N === undefined ? 40 : o.N, p0 = o.p0 === undefined ? 0.3 : o.p0, gens = o.gens === undefined ? 10 : o.gens;
    if (!BR.fractions.includes(f)) return refuse("f", "Choose no selection, the top 50 %, the top 25 % or the top 10 %.");
    if (!isWhole(gens) || gens < 0 || gens > 15) return refuse("gens", "Choose 0 to 15 generations.");
    if (!isWhole(N) || N < 20 || N > 200) return refuse("N", "Choose 20 to 200 plants.");
    if (typeof p0 !== "number" || p0 < 0 || p0 > 1) return refuse("p0", "The starting frequency must be between 0 and 1.");
    const r = rng(o.seed || 1), L = BR.L;
    const normal = () => { let u = 0; while (u === 0) u = r(); const v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const yieldOf = (g) => Math.max(0, Math.round(BR.base + BR.effect * g.reduce((s, x) => s + x, 0) + BR.envSD * normal()));
    let pop = []; for (let i = 0; i < N; i++) { const g = []; for (let j = 0; j < 2 * L; j++) g.push(r() < p0 ? 1 : 0); pop.push(g); }
    const k = Math.max(2, Math.round(f * N)); const out = [];
    const summarise = (pop, ys) => { const plus = pop.reduce((s, g) => s + g.reduce((a, x) => a + x, 0), 0); let fixedPlus = 0, fixedMinus = 0;
      for (let l = 0; l < L; l++) { const c = pop.reduce((s, g) => s + g[2 * l] + g[2 * l + 1], 0); if (c === 2 * N) fixedPlus++; else if (c === 0) fixedMinus++; }
      return { yields: ys, mean: ys.reduce((a, b) => a + b, 0) / N, plusFreq: plus / (2 * N * L), fixedPlus, fixedMinus, variable: L - fixedPlus - fixedMinus }; };
    let ys = pop.map(yieldOf); out.push(summarise(pop, ys));
    for (let t = 1; t <= gens; t++) {
      const order = pop.map((_, i) => i).sort((a, b) => ys[b] - ys[a] || a - b).slice(0, k);
      const next = []; for (let i = 0; i < N; i++) { const a = order[Math.floor(r() * k)]; let b = a; while (b === a) b = order[Math.floor(r() * k)];
        const g = []; for (let l = 0; l < L; l++) { g.push(pop[a][2 * l + (r() < 0.5 ? 0 : 1)]); g.push(pop[b][2 * l + (r() < 0.5 ? 0 : 1)]); } next.push(g); }
      pop = next; ys = pop.map(yieldOf); out.push(summarise(pop, ys)); }
    return { ok: true, f, k, N, gens: out };
  }
  const select = (yields, k) => yields.map((y, i) => i).sort((a, b) => yields[b] - yields[a] || a - b).slice(0, k).map((i) => yields[i]);
  const geneticValue = (plus) => BR.base + BR.effect * plus;

  // ---------------------------------------------------------------- Model 5: Hardy-Weinberg calculations
  const res = (q) => { const p = 1 - q; return { ok: true, p, q, p2: p * p, twopq: 2 * p * q, q2: q * q, domPheno: p * p + 2 * p * q, check: p * p + 2 * p * q + q * q }; };
  const badF = (f) => typeof f !== "number" || !isFinite(f);
  const hw = {
    fromRecessive(f) { if (badF(f)) return refuse("num", "Enter a number."); if (f < 0 || f > 1) return refuse("range", "A frequency must be between 0 and 1."); const r = res(Math.sqrt(f)); r.q2 = f; r.from = "recessive"; return r; },
    fromRecessiveCount(r, N) { if (badF(r) || badF(N)) return refuse("num", "Enter numbers."); if (!isWhole(r) || !isWhole(N) || r < 0 || N < 1 || r > N) return refuse("count", "The number with the recessive phenotype must be a whole number from 0 to the total."); return Object.assign(hw.fromRecessive(r / N), { N }); },
    fromOneIn(n) { if (badF(n)) return refuse("num", "Enter a number."); if (n < 1) return refuse("oneIn", "\"1 in n\" needs n of at least 1."); return hw.fromRecessive(1 / n); },
    fromPercent(x, which) { if (badF(x)) return refuse("num", "Enter a number."); if (x < 0 || x > 100) return refuse("range", "A percentage must be between 0 and 100."); return which === "dominant" ? hw.fromDominant(x / 100) : hw.fromRecessive(x / 100); },
    // the recessive phenotype frequency is found FIRST (q² = 1 − dominant); a dominant frequency is never square rooted
    fromDominant(fd) { if (badF(fd)) return refuse("num", "Enter a number."); if (fd < 0 || fd > 1) return refuse("range", "A frequency must be between 0 and 1."); const r = hw.fromRecessive(1 - fd); r.from = "dominant"; return r; },
    fromCounts(AA, Aa, aa) { const c = count({ AA, Aa, aa }); if (!c.ok) return refuse("count", c.err); const r = res(c.q); r.p = c.p; r.counts = { AA: Math.round(AA), Aa: Math.round(Aa), aa: Math.round(aa) }; r.N = c.N; r.copies = c.copies; r.A = c.A; r.a = c.a;
      r.expected = { AA: r.p2 * c.N, Aa: r.twopq * c.N, aa: r.q2 * c.N }; r.diff = { AA: r.counts.AA - r.expected.AA, Aa: r.counts.Aa - r.expected.Aa, aa: r.counts.aa - r.expected.aa }; return r; },
    fromP(p) { if (badF(p)) return refuse("num", "Enter a number."); if (p < 0 || p > 1) return refuse("range", "A frequency must be between 0 and 1."); const r = res(1 - p); r.p = p; return r; },
    expected(r, M) { if (!isWhole(M) || M < 1) return refuse("count", "The population size must be a whole number of at least 1."); return { AA: r.p2 * M, Aa: r.twopq * M, aa: r.q2 * M }; },
  };

  // ---------------------------------------------------------------- answer rule (MR-C1 M2)
  // read a typed answer: decimal, fraction a/b or percentage; returns the value, the number of significant figures and
  // half a unit in the last typed place (as a frequency); null if it cannot be read
  function readTyped(s) {
    let t = String(s == null ? "" : s).trim().replace(/[−–—]/g, "-").replace(/\s+/g, "").replace(/,(?=\d{3}(\D|$))/g, ""); if (!t) return null;
    let perc = false; if (/%$/.test(t)) { perc = true; t = t.slice(0, -1); }
    const fr = t.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); if (fr) { const b = +fr[2]; if (!b) return null; return { v: (+fr[1] / b) / (perc ? 100 : 1), sf: 99, half: 0, perc, frac: true }; }
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
    const v = Number(t) / (perc ? 100 : 1); const dec = t.includes(".") ? t.split(".")[1].length : 0;
    const digits = t.replace(/^[+-]/, "").replace(".", "").replace(/^0+/, ""); const sf = digits.length;
    return { v, sf, half: (0.5 * Math.pow(10, -dec)) / (perc ? 100 : 1), perc, frac: false };
  }
  // exact: the exact value; alt: the value by the "q (or p) rounded to 2 dp" route
  function checkFreq(typed, exact, alt) {
    const t = readTyped(typed); if (!t) return { ok: false, unread: true };
    const vals = [exact].concat(alt === undefined ? [] : [alt]);
    if (vals.some((v) => Math.abs(t.v - v) < EPS)) return { ok: true, v: t.v };
    if (exact === 0 || exact === 1) return { ok: false, v: t.v, why: "exact" };
    if (t.sf < 2) return { ok: false, v: t.v, why: "sf" };
    const ok = vals.some((v) => Math.abs(t.v - v) <= t.half + EPS || Math.abs(t.v - v) <= 0.01 * Math.abs(v) + EPS);
    return { ok, v: t.v };
  }
  function checkCount(typed, exact, M, ownFreq) {
    const t = readTyped(typed); if (!t || t.perc) return { ok: false, unread: !t };
    if (Math.abs(t.v - exact) <= 1 + EPS) return { ok: true, v: t.v };
    if (typeof ownFreq === "number" && isFinite(ownFreq) && Math.abs(t.v - M * ownFreq) <= 1 + EPS) return { ok: true, v: t.v };
    return { ok: false, v: t.v };
  }

  // ---------------------------------------------------------------- locks (question data sets)
  const Q1 = (k) => `q-3.3.7.1-${k}`, Q2 = (k) => `q-3.3.7.2-${k}`, QC = (k) => `q-3.3.7-${k}`;
  const LOCKS = {
    q2: [{ v: 0.16, q: [Q2("hc1"), Q2("hc2")] }, { v: 0.25, q: [Q2("hc3")] }, { v: 0.36, q: [Q2("6"), Q2("12")] }, { v: 0.64, q: [Q2("12")] }, { v: 0.0025, q: [Q2("7")] },
      { v: 0.0004, q: [Q2("cf1"), Q2("cf2"), Q2("cf3")] }, { v: 0.0001, q: [QC("c16")] }, { v: 0.81, q: [QC("c18")] }, { v: 0.04, q: [QC("c21")] }, { v: 0.49, q: [Q2("qc4")] }, { v: 0.0144, q: [QC("c19")] }, { v: 0.7744, q: [QC("c19")] }, { v: 0.0225, q: [Q2("5")] }, { v: 0.7225, q: [Q2("5")] }, { v: 0.0625, q: ["q-clev-cs2-1"] }],
    p: [{ v: 0.85, q: [Q2("5")] }, { v: 0.15, q: [Q2("5")] }, { v: 0.12, q: [QC("c19")] }, { v: 0.88, q: [QC("c19")] }],
    counts: [{ c: [145, 250, 105], q: [Q2("9"), Q2("10")] }, { c: [490, 300, 210], q: [QC("c17")] }, { c: [20, 30, 30], q: [QC("c3")] }, { c: [72, 96, 32], q: [Q1("5")] }, { c: [50, 100, 50], q: [Q2("5b")] }, { c: [9, 12, 4], q: [Q1("gp2")] }],
  };
  const answered = (qid) => { try { const a = B.store.get().attempts.filter((x) => x.qid === qid); return a.some((x) => x.score === x.max) || a.length >= 2; } catch (e) { return false; } };
  // counts are compared as ratios, so doubled or halved counts are locked too (RQ-04)
  // kind "q2" (any recessive or dominant input, compared by q²), "p" (allele tab) or "counts" (either order)
  function lockFor(kind, val, done = answered) {
    const open = (L) => !L.q.every(done);
    if (kind === "q2") return LOCKS.q2.find((L) => Math.abs(L.v - val) < 1e-9 && open(L)) || null;
    if (kind === "p") return LOCKS.p.find((L) => Math.abs(L.v - val) < 1e-9 && open(L)) || null;
    if (kind === "counts") { const g = (a, b) => (b ? g(b, a % b) : a); const k = (c) => { const d = c.reduce((x, y) => g(x, Math.round(y)), 0) || 1; const r = c.map((x) => Math.round(x) / d); return [r[1], Math.min(r[0], r[2]), Math.max(r[0], r[2])].join(","); }; return LOCKS.counts.find((L) => k(L.c) === k(val) && open(L)) || null; }
    return null;
  }

  // ---------------------------------------------------------------- problem generator (templates G-A to G-E)
  const T = {
    A: { q: [100, 300, 950, 350, 450, 550, 650, 750], N: [400, 800, 1200, 2000, 4000] },
    B: [{ q: 30, k: 9, of: 10000 }, { q: 15, k: 9, of: 40000 }],
    C: [100, 300, 350, 650, 750],
    E: [50, 350, 450, 550, 650, 900],
  };
  const big = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const r2 = (x) => Math.round(x * 100 + 1e-9) / 100;
  const nf = (x) => { const s = String(Number(x.toPrecision(12))); return /^\d{4,}$/.test(s) ? big(s) : s; };
    function gen(seed, only) {
    const r = rng(seed), pick = (a) => a[Math.floor(r() * a.length)];
    const tpl = only || pick(["A", "A", "B", "C", "D", "E"]);
    if (tpl === "A") { const Qm = pick(T.A.q), N = pick(T.A.N), rec = (Qm * Qm * N) / 1e6; const q = Qm / 1000, p = 1 - q; const ask = pick(["q", "p", "2pq", "carriers"]);
      const story = `In a population, ${big(rec)} of ${big(N)} individuals (hypothetical) show the recessive phenotype of a gene with two alleles. Assume the Hardy-Weinberg conditions apply.`;
      const work = [`q² = ${big(rec)} ÷ ${big(N)} = ${nf(q * q)}`, `q = √${nf(q * q)} = ${nf(q)}`, `p = 1 − q = ${nf(p)}`, `2pq = 2 × ${nf(p)} × ${nf(q)} = ${nf(2 * p * q)}`];
      const A = { q: { label: "the frequency of the recessive allele, q", exact: q, kind: "freq", pit: [{ v: q * q, msg: "That is q², the frequency of the recessive phenotype. Take its square root to find q." }, { v: q * q / 2, msg: "Halving q² does not give q: take the square root." }] },
        p: { label: "the frequency of the dominant allele, p", exact: p, kind: "freq", pit: [{ v: 1 - q * q, msg: "1 − q² is the frequency of the dominant phenotype, not p. Find q = √q² first, then p = 1 − q." }, { v: Math.sqrt(1 - q * q), msg: "Do not take the square root of the dominant phenotype frequency: find q = √q², then p = 1 − q." }] },
        "2pq": { label: "the frequency of heterozygotes (carriers), 2pq", exact: 2 * p * q, kind: "freq", pit: [{ v: p * q, msg: "pq is only half of it: heterozygotes form in two ways, so the frequency is 2pq." }, { v: q * q, msg: "That is q², the homozygous recessive frequency." }] },
        carriers: { label: `the expected number of heterozygotes (carriers) among the ${big(N)}`, exact: 2 * p * q * N, M: N, kind: "count", pit: [{ v: p * q * N, msg: "You used pq: heterozygotes form in two ways, so use 2pq." }, { v: rec, msg: "That is the number with the recessive phenotype (q²), not the carriers." }] } }[ask];
      return Object.assign({ tpl, story, work: work.concat(ask === "carriers" ? [`Number = 2pq × ${big(N)} = ${nf(2 * p * q * N)}`] : []), q2: q * q, p, q }, A); }
    if (tpl === "B") { const s = pick(T.B), q = s.q / 1000, p = 1 - q;
      const story = `A recessive condition affects ${s.k} in every ${big(s.of)} people in a population (hypothetical). Assume the Hardy-Weinberg conditions apply.`;
      return { tpl, story, q2: q * q, p, q, label: "the percentage of people who are carriers (give a percentage)", exact: 2 * p * q, kind: "pct", pit: [{ v: p * q, msg: "pq is only half: carriers form in two ways, so use 2pq." }, { v: q, msg: "That is q, the allele frequency, not the carrier frequency 2pq." }],
        work: [`q² = ${s.k} ÷ ${big(s.of)} = ${nf(q * q)}`, `q = ${nf(q)}, p = ${nf(p)}`, `2pq = 2 × ${nf(p)} × ${nf(q)} = ${nf(2 * p * q)} = ${nf(2 * p * q * 100)} %`] }; }
    if (tpl === "C") { const Qm = pick(T.C), q = Qm / 1000, p = 1 - q, dom = 1 - q * q; const ask = pick(["q", "p"]);
      const story = `${nf(dom * 100)} % of a population (hypothetical) show the dominant phenotype of a gene with two alleles. Assume the Hardy-Weinberg conditions apply.`;
      const work = [`Recessive phenotype: q² = 1 − ${nf(dom)} = ${nf(q * q)}`, `q = √${nf(q * q)} = ${nf(q)}`, `p = 1 − q = ${nf(p)}`];
      return ask === "q" ? { tpl, story, work, q2: q * q, p, q, label: "the frequency of the recessive allele, q", exact: q, kind: "freq", pit: [{ v: Math.sqrt(dom), msg: "You took the square root of the dominant phenotype frequency. Dominant phenotypes include AA and Aa: find q² = 1 − (dominant frequency) first." }, { v: 1 - Math.sqrt(dom), msg: "Do not square root the dominant frequency: q² = 1 − (dominant frequency), then q = √q²." }, { v: q * q, msg: "That is q²: take its square root." }] }
        : { tpl, story, work, q2: q * q, p, q, label: "the frequency of the dominant allele, p", exact: p, kind: "freq", pit: [{ v: Math.sqrt(dom), msg: "p is not the square root of the dominant phenotype frequency (that frequency is p² + 2pq). Find q first." }, { v: dom, msg: "That is the dominant phenotype frequency, p² + 2pq." }] }; }
    if (tpl === "D") { let AA, Aa, aa, N; do { N = 100 * (1 + Math.floor(r() * 10)); AA = 1 + Math.floor(r() * (N - 2)); Aa = Math.floor(r() * (N - AA)); aa = N - AA - Aa; } while (aa < 1 || Aa < 1 || lockFor("counts", [AA, Aa, aa], () => false) || (() => { const c = count({ AA, Aa, aa }); const far = (a, b) => Math.abs(a - b) > 0.02 * Math.max(Math.abs(b), 1e-9);
        return lockFor("q2", round(c.q * c.q, 9), () => false) || lockFor("p", round(c.p, 9), () => false) || lockFor("p", round(c.q, 9), () => false) || !far(c.A / N, c.p) || !far(AA / N, c.p) || !far(Aa, 2 * c.p * c.q * N) || Math.abs(Aa - 2 * r2(c.p) * (1 - r2(c.p)) * N) <= Math.max(2, 0.02 * Aa) || c.p < 0.05 || c.p > 0.95; })());
      const c = count({ AA, Aa, aa }), p = c.p, q = c.q, ask = pick(["p", "het"]);
      const story = `Hypothetical data. The two alleles of a gene are codominant, so every genotype can be identified. A sample of ${N} individuals contains ${AA} AA, ${Aa} Aa and ${aa} aa.`;
      const work = [`Copies of the gene = 2 × ${N} = ${2 * N}`, `Copies of A = 2 × ${AA} + ${Aa} = ${c.A}`, `p = ${c.A} ÷ ${2 * N} = ${nf(round(p, 4))}`, `q = 1 − p = ${nf(round(q, 4))}`, `Expected Aa = 2pq × ${N} = ${nf(round(2 * p * q * N, 1))} (observed ${Aa})`];
      const alt = (x) => r2(x); const pa = alt(p);
      return ask === "p" ? { tpl, story, work, q2: q * q, p, q, counts: [AA, Aa, aa], label: "the frequency of allele A, p", exact: p, alt: pa, kind: "freq", pit: [{ v: c.A / N, msg: "You divided by the number of individuals. Each carries two copies, so divide by 2N." }, { v: AA / N, msg: "That is the frequency of the AA genotype, not of the allele A." }] }
        : { tpl, story, work, q2: q * q, p, q, counts: [AA, Aa, aa], label: "the expected number of Aa individuals if the population were in Hardy-Weinberg equilibrium", exact: 2 * p * q * N, alt: 2 * pa * (1 - pa) * N, M: N, kind: "count", pit: [{ v: Aa, msg: "That is the observed number. Use p and q to work out the expected number, 2pq × N." }, { v: p * q * N, msg: "Use 2pq, not pq." }] }; }
    { const Pm = pick(T.E), p = Pm / 1000, q = 1 - p, ask = pick(["p2", "dom"]);
      const story = `In a population (hypothetical) the frequency of the dominant allele, p, is ${nf(p)}. Assume the Hardy-Weinberg conditions apply.`;
      const work = [`q = 1 − p = ${nf(q)}`, `p² = ${nf(p * p)}`, `2pq = 2 × ${nf(p)} × ${nf(q)} = ${nf(2 * p * q)}`, `Dominant phenotype = p² + 2pq = ${nf(p * p + 2 * p * q)} (or 1 − q² = 1 − ${nf(q * q)})`];
      return ask === "p2" ? { tpl: "E", story, work, q2: q * q, p, q, label: "the frequency of homozygous dominant individuals", exact: p * p, kind: "freq", pit: [{ v: p, msg: "That is p, the allele frequency. The homozygous dominant frequency is p²." }, { v: 2 * p * q, msg: "That is 2pq, the heterozygotes." }] }
        : { tpl: "E", story, work, q2: q * q, p, q, label: "the frequency of individuals with the dominant phenotype", exact: p * p + 2 * p * q, kind: "freq", pit: [{ v: p * p, msg: "p² counts only the homozygous dominant individuals: heterozygotes (2pq) show the dominant phenotype too." }, { v: 2 * p * q, msg: "2pq is only the heterozygotes: add p²." }, { v: p, msg: "That is p, the allele frequency." }] }; }
  }
  // mark a generator answer; returns { ok, msg }
  function markGen(g, typed) {
    const t = readTyped(typed); if (!t) return { ok: false, msg: "Type a number (a decimal, a fraction or a percentage with %)." };
    if (g.kind === "count") { const c = checkCount(typed, g.exact, g.M, g.alt !== undefined ? g.alt / g.M : undefined); if (c.ok) return { ok: true }; }
    else { if (g.kind === "freq" && t.perc === false && t.v > 1) return { ok: false, msg: "Give a frequency between 0 and 1 (or type a percentage with %)." };
      const c = checkFreq(typed, g.exact, g.alt); if (c.ok) return { ok: true }; if (c.why === "sf") return { ok: false, msg: "Give at least 2 significant figures." }; }
    const hit = (g.pit || []).find((x) => Math.abs(t.v - x.v) <= Math.max(1e-6, 0.01 * Math.abs(x.v)) + (g.kind === "count" ? 1 : 0)); return { ok: false, msg: hit ? hit.msg : "Not quite. Check each step of your working." };
  }

  // ---------------------------------------------------------------- Model 6: Hardy-Weinberg conditions
  const HWf = (q) => ({ P: (1 - q) * (1 - q), H: 2 * q * (1 - q), Q: q * q });
  const qOf = (g) => g.Q + g.H / 2;
  // one generation: zygotes at birth → breeding adults (selection, migration) → gametes (mutation) → next zygotes
  function hwGen(zyg, cond, prm = {}) {
    let ad = { P: zyg.P, H: zyg.H, Q: zyg.Q };
    if (cond === "selection") { const s = prm.s, w = 1 - s * zyg.Q; ad = { P: zyg.P / w, H: zyg.H / w, Q: (zyg.Q * (1 - s)) / w }; }
    if (cond === "migration") { const m = prm.m, g = HWf(prm.qm); ad = { P: (1 - m) * zyg.P + m * g.P, H: (1 - m) * zyg.H + m * g.H, Q: (1 - m) * zyg.Q + m * g.Q }; }
    let q = qOf(ad); if (cond === "mutation") q = q + prm.u * (1 - q);
    const next = cond === "selfing" ? { P: ad.P + ad.H / 4, H: ad.H / 2, Q: ad.Q + ad.H / 4 } : HWf(q);
    return { adults: ad, qAdults: qOf(ad), next };
  }
  function hwStep(o) {
    const z = o.start, cond = o.cond || "none", prm = o.prm || {}, gens = o.gens === undefined ? 30 : o.gens;
    if (![z.P, z.H, z.Q].every((x) => typeof x === "number" && x >= -EPS) || Math.abs(z.P + z.H + z.Q - 1) > 1e-9) return refuse("start", "Genotype frequencies must be 0 or more and add up to 1.");
    if (!["none", "selection", "migration", "mutation", "selfing"].includes(cond)) return refuse("cond", "Unknown condition.");
    if (cond === "selection" && !(prm.s >= 0 && prm.s <= 1)) return refuse("s", "Selection strength must be between 0 and 1.");
    if (cond === "migration" && !(prm.m >= 0 && prm.m <= 0.5 && prm.qm >= 0 && prm.qm <= 1)) return refuse("m", "Migration must be 0 to 0.5 of the adults, from a population with a frequency between 0 and 1.");
    if (cond === "mutation" && !(prm.u >= 0 && prm.u <= 0.1)) return refuse("u", "The mutation rate must be between 0 and 0.1.");
    const out = []; let zyg = { P: z.P, H: z.H, Q: z.Q };
    for (let t = 0; t <= gens; t++) { const g = hwGen(zyg, cond, prm); out.push({ t, zyg, q: qOf(zyg), adults: g.adults, qAdults: g.qAdults, hwAdults: HWf(g.qAdults) }); zyg = g.next; }
    return { ok: true, gens: out };
  }

  // ---------------------------------------------------------------- validate (C1-MODEL.md test cases)
  function validate() {
    const f = [], near = (a, b, t, m) => { if (!(Math.abs(a - b) <= t)) f.push(`${m}: ${a} vs ${b}`); }, is = (c, m) => { if (!c) f.push(m); };
    // Model 1
    [[36, 48, 16, 200, 120, 80, 0.6], [10, 0, 0, 20, 20, 0, 1], [0, 0, 25, 50, 0, 50, 0], [0, 1, 0, 2, 1, 1, 0.5], [5, 10, 5, 40, 20, 20, 0.5], [4900, 4200, 900, 20000, 14000, 6000, 0.7], [30, 10, 60, 200, 70, 130, 0.35], [49, 42, 9, 200, 140, 60, 0.7]]
      .forEach(([AA, Aa, aa, C, A, a, p], i) => { const c = count({ AA, Aa, aa }); is(c.ok && c.copies === C && c.A === A && c.a === a && Math.abs(c.p - p) < EPS && Math.abs(c.p + c.q - 1) < 1e-12, "count C" + (i + 1)); });
    [[{ AA: -1, Aa: 5, aa: 5 }, "neg"], [{ AA: 2.5, Aa: 3, aa: 4 }, "whole"], [{ AA: 0, Aa: 0, aa: 0 }, "empty"], [{ AA: "abc", Aa: 1, aa: 1 }, "num"]].forEach(([g, code]) => is(count(g).code === code, "count refusal " + code));
    is(countMany([40, 25, 15, 10, 6, 4]).every((x, i) => Math.abs(x - [0.4, 0.25, 0.15, 0.1, 0.06, 0.04][i]) < EPS), "countMany");
    // Model 2 (fixed seeds, MR-C1 m2)
    const S = 20261118;
    { const a = drift({ N: 50, p0: 0, gens: 50, runs: 5, seed: S }); is(a.ok && a.runs.every((r) => r.p.every((x) => x === 0)) && a.summary.lost === 5, "D1 p0 = 0 stays lost"); }
    { const a = drift({ N: 50, p0: 1, gens: 50, runs: 5, seed: S }); is(a.ok && a.runs.every((r) => r.p.every((x) => x === 1)) && a.summary.fixed === 5, "D2 p0 = 1 stays fixed"); }
    { const a = drift({ N: 25, p0: 0.5, gens: 100, runs: 5, seed: S }), b = drift({ N: 25, p0: 0.5, gens: 100, runs: 5, seed: S }), c = drift({ N: 25, p0: 0.5, gens: 100, runs: 5, seed: S + 1 }), d = drift({ N: 25, p0: 0.5, gens: 100, runs: 10, seed: S });
      is(JSON.stringify(a.runs) === JSON.stringify(b.runs), "D3 same seed repeats"); is(JSON.stringify(a.runs) !== JSON.stringify(c.runs), "D3 new seed differs"); is(JSON.stringify(a.runs[2]) === JSON.stringify(d.runs[2]), "D3 run independent of number of runs"); }
    { const n = [0, 0, 0, 0, 0]; for (let r = 0; r < 4000; r++) n[driftRun(2, 2, 1, runSeed(S, r)).k]++; [0.0625, 0.25, 0.375, 0.25, 0.0625].forEach((e, k) => near(n[k] / 4000, e, 0.03, "D4 k=" + k)); }
    { let lost = 0; for (let r = 0; r < 4000; r++) if (driftRun(500, 1, 1, runSeed(S + 5, r)).k === 0) lost++; near(lost / 4000, 0.3677, 0.03, "D5 one copy lost in one generation"); }
    { let s = 0; for (let r = 0; r < 2000; r++) s += driftRun(10, 10, 20, runSeed(S + 6, r)).p[20]; near(s / 2000, 0.5, 0.04, "D6 mean unchanged"); }
    { let fx = 0, cap = 0; for (let r = 0; r < 2000; r++) { const x = driftRun(10, 5, 5000, runSeed(S + 7, r)); if (x.fixedAt !== null) fx++; if (x.fixedAt === null && x.lostAt === null) cap++; } near(fx / 2000, 0.25, 0.035, "D7 fixation probability = p0"); is(cap === 0, "D7 all runs absorbed"); }
    for (const [N, e] of [[10, 0.2994], [100, 0.4756]]) { let s = 0; for (let r = 0; r < 4000; r++) { const p = driftRun(N, N, 10, runSeed(S + 8 + N, r)).p[10]; s += 2 * p * (1 - p); } near(s / 4000, e, 0.02, "D8 heterozygosity N=" + N); }
    { const v = {}; for (const [N, e] of [[10, 0.16038], [500, 0.004953]]) { const xs = []; for (let r = 0; r < 2000; r++) xs.push(driftRun(N, N, 20, runSeed(S + 9 + N, r)).p[20]); const m = xs.reduce((a, b) => a + b, 0) / xs.length; v[N] = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1); near(v[N] / e, 1, 0.12, "D9 variance N=" + N); } is(v[10] > 10 * v[500], "D9 small > large"); }
    { let sets = 0; for (let k = 0; k < 200; k++) { const a = drift({ N: 5, p0: 0.5, gens: 100, runs: 10, seed: S + 100 + k }); if (a.summary.fixed + a.summary.lost > 0) sets++; a.runs.forEach((r) => { const t = r.fixedAt !== null ? r.fixedAt : r.lostAt; if (t !== null) is(r.p.slice(t).every((x) => x === r.p[t]), "D10 absorbing"); }); } is(sets >= 190, "D10 fixation or loss visible"); }
    [{ N: 1, p0: 0.5 }, { N: 2.5, p0: 0.5 }, { N: 1001, p0: 0.5 }, { N: 10, p0: -0.1 }, { N: 10, p0: 1.2 }, { N: 10, p0: "x" }, { N: 10, p0: 0.5, gens: 0 }, { N: 10, p0: 0.5, runs: 21 }]
      .forEach((o, i) => is(!drift(Object.assign({ gens: 10, runs: 1 }, o)).ok, "D11 refusal " + i));
    { const a = drift({ N: 5, p0: 0.25, gens: 1, runs: 1, seed: S }); is(a.k0 === 3 && a.p0Actual === 0.3, "D12 starting copies"); }
    { let bad = 0; for (const N of [5, 10, 25, 50, 100, 250, 500, 1000]) for (let i = 0; i <= 20; i++) if (k0From(i, N) !== Math.round((i * 2 * N) / 20 + 1e-9) && !((i * 2 * N) % 20 === 10 && k0From(i, N) === Math.ceil((i * 2 * N) / 20))) bad++; is(bad === 0, "m1 slider copies exact"); }
    is(drift({ N: 500, k0: 1, gens: 5, runs: 1, seed: S }).k0 === 1, "M1 one-copy start");
    // Model 3 (without replacement)
    near(pLost(40, 1), 0.92156, 1e-5, "B5 hand A6 n=1"); near(expectedRetained(5), 4.1958, 1e-3, "B1 theory");
    for (const [n, e, tol] of [[5, 4.1958, 0.05], [2, 2.7484, 0.05], [50, 5.985, 0.02], [10, 5.1155, 0.05], [25, 5.8303, 0.05], [1, 1.7405, 0.05]]) { const a = bottleneck({ n, runs: 50, seed: S }); let s = 0, mx = 0; for (let k = 0; k < 4000; k++) { const x = bottleneckRun(n, 0, runSeed(S + n, k)); s += x.retained; mx = Math.max(mx, x.retained); } near(s / 4000, e, tol, "B mean retained n=" + n); is(mx <= Math.min(6, 2 * n), "B retained <= 2n n=" + n); is(a.ok, "B ok n=" + n); }
    { let l6 = 0, l1 = 0; for (let k = 0; k < 4000; k++) { const x = bottleneckRun(5, 0, runSeed(S + 55, k)); if (!x.counts[5]) l6++; if (!x.counts[0]) l1++; } near(l6 / 4000, 0.66358, 0.025, "B1 A6 lost"); near(l1 / 4000, 0.00587, 0.006, "B1 A1 lost"); }
    { const x = bottleneckRun(5, 10, S); is(x.counts.reduce((a, b) => a + b, 0) === 10, "B6 survivors 2n"); is(x.hist.every((h) => Math.abs(h.freq.reduce((a, b) => a + b, 0) - 1) < 1e-9), "B6 sum 1");
      is(x.hist.map((h) => h.N).join() === "5,10,20,40,80,160,320,500,500,500,500", "B6 N_t"); for (let i = 0; i < 6; i++) if (!x.counts[i]) is(x.hist.every((h) => h.counts[i] === 0), "B6 lost stays lost"); }
    { let bad = 0; for (let k = 0; k < 200; k++) { const x = bottleneckRun(5, 10, runSeed(S + 66, k)); for (let i = 0; i < 6; i++) for (let t = 1; t < x.hist.length; t++) if (x.hist[t - 1].counts[i] === 0 && x.hist[t].counts[i] > 0) bad++; } is(bad === 0, "B6 no allele returns"); }
    { const a = bottleneck({ n: 5, gens: 3, runs: 3, seed: S }), b = bottleneck({ n: 5, gens: 3, runs: 3, seed: S }), c = bottleneck({ n: 5, gens: 3, runs: 3, seed: S + 1 }); is(JSON.stringify(a.runs) === JSON.stringify(b.runs) && JSON.stringify(a.runs) !== JSON.stringify(c.runs), "B7 repeatable"); }
    { const c = bottleneck({ control: true, seed: S }); is(c.ok && c.runs[0].counts.join() === BN.copies.join(), "m3 control returns the original gene pool"); }
    [{ n: 0 }, { n: 2.5 }, { n: 101 }, { n: 5, gens: 31 }, { n: 5, runs: 0 }, { n: "x" }].forEach((o, i) => is(!bottleneck(o).ok, "B8 refusal " + i));
    // Model 4
    is(geneticValue(6) === 160 && geneticValue(0) === 100 && geneticValue(10) === 200, "S1 genetic value");
    { const g = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 0, 0, 0, 0], [1, 1, 1, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]; const plus = g.flat().reduce((a, b) => a + b, 0); is(plus / 40 === 0.5, "S2 plus frequency"); }
    is(select([150, 172, 131, 190, 165, 120, 181, 144], 2).join() === "190,181" && select([150, 172, 131, 190, 165, 120, 181, 144], 4).join() === "190,181,172,165", "S3 ranking"); is(select([150, 150, 140], 1).length === 1, "S3 tie");
    { const a = breed({ f: 1, gens: 1, seed: S, p0: 1 }); is(a.gens.every((g) => g.fixedPlus === 5 && g.plusFreq === 1), "S5 all plus stays fixed"); const b = breed({ f: 1, gens: 1, seed: S, p0: 0 }); is(b.gens.every((g) => g.fixedMinus === 5), "S5b all minus"); }
    { let up = 0, upP = 0, dec = 0; for (let k = 0; k < 200; k++) { const a = breed({ f: 0.1, gens: 10, seed: S + k }); if (a.gens[10].mean > a.gens[0].mean) up++; if (a.gens[10].plusFreq > 0.3) upP++; for (let t = 1; t <= 10; t++) if (a.gens[t].fixedPlus + a.gens[t].fixedMinus < a.gens[t - 1].fixedPlus + a.gens[t - 1].fixedMinus) dec++; }
      is(up >= 198 && upP >= 198, "S7 selection raises yield and plus frequency"); is(dec === 0, "S6 fixed genes never decrease"); }
    { let d = 0; for (let k = 0; k < 400; k++) { const a = breed({ f: 1, gens: 10, seed: S + 1000 + k }); d += a.gens[10].plusFreq - a.gens[0].plusFreq; } near(d / 400, 0, 0.03, "S8 no selection: drift only");
      let r1 = 0, r5 = 0; for (let k = 0; k < 200; k++) { r1 += breed({ f: 0.1, gens: 3, seed: S + 2000 + k }).gens[3].plusFreq; r5 += breed({ f: 0.5, gens: 3, seed: S + 2000 + k }).gens[3].plusFreq; } is(r1 > r5, "S8 stronger selection faster (generation 3)"); }
    is(JSON.stringify(breed({ f: 0.25, gens: 5, seed: S })) === JSON.stringify(breed({ f: 0.25, gens: 5, seed: S })), "S9 repeatable");
    [{ f: 0.3 }, { f: 0.1, gens: 16 }, { f: 0.1, N: 10 }].forEach((o, i) => is(!breed(o).ok, "S9 refusal " + i));
    // S4 offspring of all-plus × all-minus: every offspring has 5 plus alleles (checked by hand-built cross)
    { const P1 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], P2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; const r = rng(S); let ok = true; for (let i = 0; i < 50; i++) { let s = 0; for (let l = 0; l < 5; l++) s += P1[2 * l + (r() < 0.5 ? 0 : 1)] + P2[2 * l + (r() < 0.5 ? 0 : 1)]; if (s !== 5) ok = false; } is(ok, "S4 offspring value 150"); }
    // Model 5
    const H = (r, q, p, p2, tpq, m) => { is(r.ok, m + " ok"); if (!r.ok) return; near(r.q, q, 1e-6, m + " q"); near(r.p, p, 1e-6, m + " p"); near(r.p2, p2, 1e-6, m + " p²"); near(r.twopq, tpq, 1e-6, m + " 2pq"); near(r.check, 1, 1e-12, m + " sum"); };
    H(hw.fromPercent(9, "recessive"), 0.3, 0.7, 0.49, 0.42, "H1"); H(hw.fromOneIn(2500), 0.02, 0.98, 0.9604, 0.0392, "H2"); H(hw.fromRecessive(0.25), 0.5, 0.5, 0.25, 0.5, "H3"); H(hw.fromRecessive(0), 0, 1, 1, 0, "H4"); H(hw.fromRecessive(1), 1, 0, 0, 0, "H5");
    H(hw.fromRecessiveCount(16, 400), 0.2, 0.8, 0.64, 0.32, "H6"); H(hw.fromPercent(91, "dominant"), 0.3, 0.7, 0.49, 0.42, "H7"); H(hw.fromCounts(30, 10, 60), 0.65, 0.35, 0.1225, 0.455, "H8"); H(hw.fromCounts(4900, 4200, 900), 0.3, 0.7, 0.49, 0.42, "H9");
    H(hw.fromOneIn(10000), 0.01, 0.99, 0.9801, 0.0198, "H10"); H(hw.fromRecessive(0.15), 0.3872983, 0.6127017, 0.3754033, 0.4745967, "H11"); H(hw.fromCounts(36, 48, 16), 0.4, 0.6, 0.36, 0.48, "H12"); H(hw.fromCounts(49, 42, 9), 0.3, 0.7, 0.49, 0.42, "M4 worked example");
    { const e = hw.fromCounts(30, 10, 60).expected; near(e.AA, 12.25, 1e-9, "H8 AA"); near(e.Aa, 45.5, 1e-9, "H8 Aa"); near(e.aa, 42.25, 1e-9, "H8 aa"); const e9 = hw.fromCounts(4900, 4200, 900).expected; near(e9.Aa, 4200, 1e-6, "H9 Aa"); const x = hw.expected(hw.fromRecessive(0.09), 500); near(x.AA, 245, 1e-9, "H1 AA"); near(x.Aa, 210, 1e-9, "H1 Aa"); near(x.aa, 45, 1e-9, "H1 aa"); }
    [[hw.fromRecessive(-0.1), "range"], [hw.fromRecessive(1.2), "range"], [hw.fromRecessiveCount(30, 20), "count"], [hw.fromRecessiveCount(5, 0), "count"], [hw.fromRecessive("abc"), "num"], [hw.fromPercent(101, "recessive"), "range"], [hw.fromOneIn(0.5), "oneIn"], [hw.fromCounts(-1, 2, 3), "count"]].forEach(([r, c], i) => is(!r.ok && r.code === c, "H refusal " + i));
    // answer rule (M2)
    const F = (t, e, a, want, m) => is(checkFreq(t, e, a).ok === want, "rule " + m + " " + t);
    F("0.47", 0.4745967, 2 * 0.61 * 0.39, true, "H11"); F("0.4758", 0.4745967, 0.4758, true, "H11"); F("0.48", 0.4745967, 0.4758, true, "H11"); F("0.5", 0.4745967, 0.4758, false, "H11");
    F("0.039", 0.0392, undefined, true, "H2"); F("0.04", 0.0392, undefined, false, "H2"); F("0.040", 0.0392, undefined, false, "H2"); F("3.9%", 0.0392, undefined, true, "H2"); F("0.38", 0.375, undefined, true, "2sf"); F("0.26", 0.255, undefined, true, "2sf"); F("0.12", 0.1225, undefined, true, "2sf"); F("0.030", 0.02955, undefined, true, "2sf");
    F("0.5", 0.5, undefined, true, "exact"); F("1/50", 0.02, undefined, true, "fraction"); F("0.71", 0.7, undefined, false, "pitfall separation"); F("0.020", 0.0198, undefined, true, "c16"); F("1", 1, undefined, true, "exact one"); F("0.99", 1, undefined, false, "exact one");
    is(checkCount("392", 392, 10000).ok && checkCount("390", 392, 10000, 0.039).ok && !checkCount("390", 392, 10000).ok && checkCount("990", 990, 50000).ok, "count rule");
    // generator (M3, m6): 300 seeds per template; no locked value; integers; pitfalls kept apart
    for (const tp of ["A", "B", "C", "D", "E"]) for (let k = 0; k < 300; k++) { const g = gen(S + k, tp);
      if (tp === "A") { const Qm = Math.round(g.q * 1000); is(Number.isInteger(Math.round(g.q * 1000)) && (Qm * Qm * 400) % 1e6 === 0, "G-A whole counts"); }
      is(g.exact >= 0 && (g.kind === "count" || g.exact <= 1), "gen range " + tp);
      is(!lockFor("q2", round(g.q2, 9), () => false) && !lockFor("p", round(g.p, 9), () => false) && !lockFor("p", round(g.q, 9), () => false), "gen never a locked value " + tp + " " + g.q2);
      if (g.counts) is(!lockFor("counts", g.counts, () => false), "gen counts not locked");
      const e2 = tp === "D" ? g.exact : g.exact; is(markGen(g, String(e2)).ok, "gen exact accepted " + tp);
      for (const p of g.pit || []) if (Math.abs(p.v - g.exact) > 1e-9) is(!markGen(g, String(round(p.v, 4))).ok || Math.abs(p.v - g.exact) < 0.01 * g.exact, "gen pitfall refused " + tp);
      is(JSON.stringify(gen(S + k, tp)) === JSON.stringify(g), "gen repeatable " + tp); }
    // independent second loop for the G-A answers
    for (const Qm of T.A.q) for (const N of T.A.N) { const rec = (Qm * Qm * N) / 1e6; const q = Math.sqrt(rec / N); near(q, Qm / 1000, 1e-12, "G-A second loop q"); near(2 * q * (1 - q) * N, (2 * Qm * (1000 - Qm) * N) / 1e6, 1e-6, "G-A second loop carriers"); }
    // locks
    is(lockFor("q2", 0.16, () => false) && !lockFor("q2", 0.16, () => true) && lockFor("counts", [32, 96, 72], () => false) && lockFor("counts", [4, 12, 9], () => false) && !lockFor("q2", 0.09, () => false), "locks");
    is(lockFor("counts", [980, 600, 420], () => false) && lockFor("counts", [40, 60, 60], () => false) && lockFor("counts", [290, 500, 210], () => false) && !lockFor("counts", [49, 42, 9], () => false), "RQ-04 scaled counts locked");
    { const g = { kind: "count", exact: 2 * 0.537 * 0.463 * 400, alt: 2 * 0.54 * 0.46 * 400, M: 400 }; is(markGen(g, String(Math.round(g.alt))).ok, "RQ-05 rounded-p route for expected counts"); }
    // Model 6
    const G = (o) => hwStep(o).gens; const nearG = (a, b, m) => { near(a.P, b[0], 1e-9, m + " P"); near(a.H, b[1], 1e-9, m + " H"); near(a.Q, b[2], 1e-9, m + " Q"); };
    { const g = G({ start: { P: 0.5, H: 0, Q: 0.5 }, gens: 5 }); nearG(g[1].zyg, [0.25, 0.5, 0.25], "E1"); is(g.every((x) => Math.abs(x.q - 0.5) < 1e-12), "E1 q constant"); nearG(g[5].zyg, [0.25, 0.5, 0.25], "E1 later"); }
    nearG(G({ start: { P: 0.6, H: 0.2, Q: 0.2 }, gens: 1 })[1].zyg, [0.49, 0.42, 0.09], "E2");
    { const g = G({ start: HWf(0.5), cond: "selection", prm: { s: 1 }, gens: 10 }); near(g[1].q, 1 / 3, 1e-12, "E3 q1"); near(g[2].q, 0.25, 1e-12, "E3 q2"); near(g[10].q, 0.5 / 6, 1e-12, "E3 q10"); nearG(g[0].adults, [1 / 3, 2 / 3, 0], "E3 adults"); nearG(g[0].hwAdults, [4 / 9, 4 / 9, 1 / 9], "E3 expected"); }
    near(G({ start: HWf(0.5), cond: "selection", prm: { s: 0.5 }, gens: 1 })[1].q, 3 / 7, 1e-12, "E4");
    { const g = G({ start: HWf(0.2), cond: "migration", prm: { m: 0.1, qm: 0.8 }, gens: 2 }); near(g[1].q, 0.26, 1e-12, "E5 q1"); near(g[2].q, 0.314, 1e-12, "E5 q2"); nearG(g[0].adults, [0.58, 0.32, 0.1], "E5 adults"); nearG(g[0].hwAdults, [0.5476, 0.3848, 0.0676], "E5 expected"); }
    { const g = G({ start: HWf(0), cond: "mutation", prm: { u: 0.0001 }, gens: 10 }); near(g[1].q, 0.0001, 1e-15, "E6 q1"); near(g[10].q, 1 - Math.pow(0.9999, 10), 1e-12, "E6 q10"); near(g[10].q, 0.00099955, 1e-8, "E6 hand"); }
    { const g = G({ start: { P: 0.25, H: 0.5, Q: 0.25 }, cond: "selfing", gens: 2 }); nearG(g[1].zyg, [0.375, 0.25, 0.375], "E7 gen1"); nearG(g[2].zyg, [0.4375, 0.125, 0.4375], "E7 gen2"); is(g.every((x) => Math.abs(x.q - 0.5) < 1e-12), "E7 q constant"); }
    [{ start: { P: 0.5, H: 0.2, Q: 0.2 } }, { start: HWf(0.5), cond: "selection", prm: { s: 1.5 } }, { start: HWf(0.5), cond: "migration", prm: { m: 0.6, qm: 0.5 } }, { start: HWf(0.5), cond: "migration", prm: { m: 0.1, qm: -0.1 } }].forEach((o, i) => is(!hwStep(o).ok, "E8 refusal " + i));
    // display rounding
    is(fmt(0.38729833) === "0.3873" && fmt(0.0392) === "0.0392" && fmt(0.6) === "0.6" && round(2.675, 2) === 2.68 && pct(0.0392) === "3.9 %" && fmt(4.7e-10, 4) === "0" && fmt(-3e-9, 2) === "0" && round(1e-7, 9) === 1e-7, "display rounding");
    return f;
  }

  B.popModel = { rng, runSeed, round, fmt, pct, count, countMany, k0From, driftRun, drift, BN, bottleneckRun, bottleneck, pLost, expectedRetained, BR, breed, select, geneticValue, hw, readTyped, checkFreq, checkCount, LOCKS, lockFor, answered, gen, markGen, HWf, hwStep, validate };
})(window.BIO);
