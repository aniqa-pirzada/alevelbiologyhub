// Shared models and artwork for 3.1.6 (Living organisms vary) and Required Practical 3 (chromatography of leaf
// pigments). Loaded before data/content/3.1.6.js, data/consolidation/3.1.6.js, js/views/interactives-variation.js
// and js/views/bench-chroma.js. All models are documented here, in KNOWN_LIMITATIONS.md (6i–6k) and in
// SCIENTIFIC_ACCURACY_AUDIT.md; representative values are validated in tests/run.js independently of the drawing code.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", SAGE = "#6b9a7f", NAVY = "#1e3a5f", AMBER = "#c8902a", ROSE = "#b4504f", MINT = "#d6efec";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ""}>${s}</text>`;

  // ================= STATISTICS MODEL =================
  // Seeded pseudo-random generator (mulberry32) so that every sampling activity is reproducible for testing; student
  // activities seed from the clock unless a seed is given.
  const rng = (seed = Date.now() >>> 0) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // Standard normal pdf, cdf (Abramowitz–Stegun 7.1.26 approximation of erf, |error| < 1.5e-7) and Box–Muller sampling.
  const pdf = (x, mu = 0, sd = 1) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
  const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  const cdf = (x, mu = 0, sd = 1) => 0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2)));
  const within = (k) => cdf(k) - cdf(-k); // fraction within ±k SD: 0.6827, 0.9545, 0.9973
  const randn = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // Descriptive statistics. sd(x) is the sample standard deviation (n − 1); popSd divides by n. Both are shown in the
  // optional calculator; the pages say which is which and that students are not required to calculate either.
  const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
  const sd = (x) => { if (x.length < 2) return 0; const m = mean(x); return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1)); };
  const popSd = (x) => { const m = mean(x); return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / x.length); };
  const median = (x) => { const s = [...x].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  // Population for the Sampling Investigation Simulator: N individuals (e.g. limpets on a shore) laid out on a grid with a
  // measurable characteristic (shell length / mm) drawn from a normal distribution, plus a spatial gradient so that
  // convenience sampling near one edge is biased. Reproducible for a given seed.
  const population = ({ N = 400, mu = 30, sigma = 4, gradient = 6, seed = 20261102 } = {}) => { const r = rng(seed); const cols = 25, rows = Math.ceil(N / cols); const ind = []; for (let i = 0; i < N; i++) { const col = i % cols, row = Math.floor(i / cols); const x = (col + 0.5) / cols, y = (row + 0.5) / rows; const v = mu + sigma * randn(r) + gradient * (x - 0.5); ind.push({ i, x, y, v: +Math.max(mu - 4 * sigma, v).toFixed(1) }); } return { individuals: ind, mean: +mean(ind.map((d) => d.v)).toFixed(2), sd: +popSd(ind.map((d) => d.v)).toFixed(2), N }; };
  // Sampling methods. random: each individual equally likely (without replacement). convenience: the n individuals
  // nearest the "access point" (left edge), the classic biased sample. deliberate: the largest-looking individuals, as a
  // student choosing "good specimens" would. systematic: every k-th individual from a random start (unbiased here).
  const sample = (pop, n, method = "random", r = rng()) => { const ind = pop.individuals; if (method === "random") { const idx = ind.map((d) => d.i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx.slice(0, n).map((i) => ind[i]); } if (method === "convenience") return [...ind].sort((a, b) => a.x - b.x || a.y - b.y).slice(0, n); if (method === "deliberate") return [...ind].sort((a, b) => b.v - a.v).slice(0, n); if (method === "systematic") { const k = Math.max(1, Math.floor(ind.length / n)); const start = Math.floor(r() * k); return ind.filter((d, i) => (i - start) % k === 0).slice(0, n); } return []; };
  B.statsModel = { rng, pdf, cdf, erf, within, randn, mean, sd, popSd, median, population, sample };

  // ================= CHROMATOGRAPHY MODEL =================
  // Paper chromatography of a propanone extract of leaf pigments. Each pigment is given an Rf RANGE for each solvent
  // system; a run draws a value from the range (seeded) so that no pigment has a single "universal" Rf. The ranges are
  // illustrative but ordered as reported for non-polar solvents on paper: carotene (most soluble in the mobile phase,
  // least retained by the polar stationary phase) runs highest; chlorophyll b (two polar groups) lowest. In the more polar
  // solvent (propanone-rich) all bands run higher and separate less. Anthocyanins (water-soluble, in red/purple leaves)
  // are poorly extracted by propanone and hardly move in a non-polar solvent: they stay at or near the origin.
  const PIG = {
    carotene: { name: "carotene", colour: "#e8a020", rf: { nonpolar: [0.88, 0.96], polar: [0.95, 0.99] } },
    phaeophytin: { name: "phaeophytin (grey-brown; chlorophyll breakdown)", colour: "#8a8373", rf: { nonpolar: [0.74, 0.84], polar: [0.86, 0.94] } },
    xanthophyll: { name: "xanthophyll", colour: "#d9c62b", rf: { nonpolar: [0.58, 0.72], polar: [0.78, 0.88] } },
    chla: { name: "chlorophyll a", colour: "#2f7d3a", rf: { nonpolar: [0.42, 0.56], polar: [0.64, 0.76] } },
    chlb: { name: "chlorophyll b", colour: "#6aa84f", rf: { nonpolar: [0.26, 0.38], polar: [0.48, 0.60] } },
    anthocyanin: { name: "red water-soluble pigment (anthocyanin; betacyanin in red beet): barely moves", colour: "#8e3a6b", rf: { nonpolar: [0.00, 0.06], polar: [0.05, 0.18] } },
  };
  // Leaf samples: which pigments are present and their relative amounts (band intensity 0–1). Illustrative.
  const LEAVES = {
    spinach: { label: "Spinach (green leaf; trialled in the handbook)", pigments: { carotene: 0.55, xanthophyll: 0.6, chla: 1, chlb: 0.6, phaeophytin: 0.15 } },
    autumn: { label: "Yellowing autumn leaf", pigments: { carotene: 0.6, xanthophyll: 0.8, chla: 0.2, chlb: 0.1, phaeophytin: 0.35 } },
    purple: { label: "Red leaf (e.g. red-leaved beet, trialled in the handbook)", pigments: { carotene: 0.4, xanthophyll: 0.45, chla: 0.8, chlb: 0.5, anthocyanin: 0.7 } },
    // Shade-tolerant leaves typically have a lower chlorophyll a : b ratio (more chlorophyll b; about 2.2-2.5 against
    // about 3 in sun leaves; Boardman 1977, Lichtenthaler et al. 1981) and relatively less carotenoid. Illustrative amounts.
    shade: { label: "Shade-tolerant plant (e.g. ivy from deep shade)", pigments: { carotene: 0.35, xanthophyll: 0.5, chla: 1, chlb: 0.85, phaeophytin: 0.1 } },
    variegated: { label: "White part of a variegated leaf", pigments: { carotene: 0.1, xanthophyll: 0.12, chla: 0.08, chlb: 0.05 } },
  };
  const SOLVENTS = { nonpolar: { label: "propanone : petroleum ether 1 : 9 (mostly non-polar)", note: "good separation of the four main pigments" }, polar: { label: "propanone only (polar)", note: "all pigments run high; bands crowd near the front" } };
  // A run (OxfordAQA practical handbook exemplar for RP3): origin 2 cm from the bottom of a 130 mm strip; 3 cm3 of solvent
  // stands about 10 mm deep in a boiling tube; the front rises with a decelerating
  // profile (paper chromatography fronts slow as the solvent climbs) and is stopped when it reaches 100 mm from the origin
  // unless the student removes the paper earlier. Pigment distance = Rf × front distance at every instant.
  const run = ({ leaf = "spinach", solvent = "nonpolar", seed = 1, errors = {} } = {}) => { const r = rng(seed); const bands = Object.entries(LEAVES[leaf].pigments).map(([k, amt]) => { const [lo, hi] = PIG[k].rf[solvent]; return { key: k, name: PIG[k].name, colour: PIG[k].colour, amount: amt, rf: +(lo + (hi - lo) * r()).toFixed(2) }; }).sort((a, b) => b.rf - a.rf); if (errors.inkOrigin) bands.push({ key: "ink", name: "ink from the origin line (artefact)", colour: "#2c4fa3", amount: 0.9, rf: +(0.3 + 0.5 * r()).toFixed(2), artefact: true }); return { leaf, solvent, bands, frontMax: 100, originMm: 20, solventLevelMm: 10, stripMm: 130 }; };
  const frontAt = (tMin, frontMax = 100) => +(frontMax * (1 - Math.exp(-tMin / 9))).toFixed(1); // mm beyond the origin after t minutes
  const rf = (pigmentMm, frontMm) => (frontMm > 0 ? +(pigmentMm / frontMm).toFixed(2) : 0);
  B.chromaModel = { PIG, LEAVES, SOLVENTS, run, frontAt, rf };

  // ================= ARTWORK =================
  // Normal curve with SD bands (axis in the units of the variable). mu, sd; shade: number of SDs to shade (0–3).
  const normalCurve = ({ mu = 30, sd = 4, mu2 = null, sd2 = null, shade = 1, width = 560, height = 300, xLabel = "measurement", xmin = null, xmax = null, labels = true } = {}) => { const padL = 40, padR = 20, padT = 20, padB = 46; const lo = xmin ?? Math.min(mu - 4 * sd, mu2 == null ? Infinity : mu2 - 4 * sd2), hi = xmax ?? Math.max(mu + 4 * sd, mu2 == null ? -Infinity : mu2 + 4 * sd2); const X = (x) => padL + ((x - lo) / (hi - lo)) * (width - padL - padR); const ymax = Math.max(pdf(mu, mu, sd), mu2 == null ? 0 : pdf(mu2, mu2, sd2)) * 1.12; const Y = (y) => padT + (height - padT - padB) * (1 - y / ymax); const curve = (m, s) => { let d = ""; for (let i = 0; i <= 200; i++) { const x = lo + ((hi - lo) * i) / 200; d += (i ? "L" : "M") + X(x).toFixed(1) + " " + Y(pdf(x, m, s)).toFixed(1); } return d; }; let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" style="max-width:100%;height:auto" role="img" aria-label="normal distribution curve with mean ${mu} and standard deviation ${sd}">`; svg += `<line x1="${padL}" y1="${Y(0)}" x2="${width - padR}" y2="${Y(0)}" stroke="${INK}" stroke-width="1.2"/>`;
    if (shade > 0) { const a = mu - shade * sd, b = mu + shade * sd; let d = `M${X(a)} ${Y(0)}`; for (let i = 0; i <= 100; i++) { const x = a + ((b - a) * i) / 100; d += ` L${X(x).toFixed(1)} ${Y(pdf(x, mu, sd)).toFixed(1)}`; } d += ` L${X(b)} ${Y(0)}z`; svg += `<path d="${d}" fill="${MINT}" opacity=".9"/>`; }
    svg += `<path d="${curve(mu, sd)}" fill="none" stroke="${TEAL}" stroke-width="2.5"/>`; if (mu2 != null) svg += `<path d="${curve(mu2, sd2)}" fill="none" stroke="${ROSE}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    for (let k = -3; k <= 3; k++) { const x = mu + k * sd; if (x < lo || x > hi) continue; svg += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(0) + 5}" stroke="${INK}"/>` + T(X(x), Y(0) + 18, (k === 0 ? "mean" : (k > 0 ? "+" : "−") + Math.abs(k) + " SD"), { s: 9.5, c: k === 0 ? INK : GREY }) + T(X(x), Y(0) + 31, String(+x.toFixed(1)), { s: 9.5, c: GREY }); if (labels && k !== 0) svg += `<line x1="${X(x)}" y1="${Y(pdf(x, mu, sd))}" x2="${X(x)}" y2="${Y(0)}" stroke="${GREY}" stroke-dasharray="3 3"/>`; }
    if (labels && shade > 0) svg += T(X(mu), Y(pdf(mu, mu, sd) * 0.45), `≈ ${(100 * within(shade)).toFixed(shade === 1 ? 0 : 1)} % of values within ±${shade} SD`, { s: 11, w: 700, c: NAVY });
    svg += T((padL + width - padR) / 2, height - 4, xLabel, { s: 11, w: 600 }); return svg + "</svg>"; };
  // Dot plot of a sample against a population mean line
  const dotPlot = (values, { mu, lo, hi, width = 560, height = 90, colour = TEAL } = {}) => { const padL = 20, padR = 20; const X = (x) => padL + ((x - lo) / (hi - lo)) * (width - padL - padR); const counts = {}; let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" style="max-width:100%;height:auto" role="img" aria-label="dot plot of sample values">`; svg += `<line x1="${padL}" y1="${height - 20}" x2="${width - padR}" y2="${height - 20}" stroke="${INK}"/>`; [lo, (lo + hi) / 2, hi].forEach((v) => { svg += T(X(v), height - 6, String(+v.toFixed(0)), { s: 9.5, c: GREY }); }); values.forEach((v) => { const b = Math.round(v); counts[b] = (counts[b] || 0) + 1; svg += `<circle cx="${X(b)}" cy="${height - 26 - (counts[b] - 1) * 7}" r="3" fill="${colour}" opacity=".85"/>`; }); if (mu != null) svg += `<line x1="${X(mu)}" y1="8" x2="${X(mu)}" y2="${height - 20}" stroke="${ROSE}" stroke-dasharray="4 3"/>` + T(X(mu), 8, "population mean", { s: 9, c: ROSE }); const m = mean(values); svg += `<line x1="${X(m)}" y1="14" x2="${X(m)}" y2="${height - 20}" stroke="${NAVY}" stroke-width="2"/>`; return svg + "</svg>"; };
  // Chromatogram strip. front and bands in mm from the origin; strip drawn vertically. Options: showFrontMark, showRuler,
  // solventLevel (mm from bottom), errors flags affect drawing (spot below solvent: bands smeared into the solvent).
  const chromatogram = (res, { frontMm = 100, width = 220, height = 360, showRuler = true, showFrontMark = true, dipped = false, label = "" } = {}) => { const stripW = 60, x0 = 60, top = 20, pxPerMm = (height - 60) / res.stripMm; const yOf = (mmFromBottom) => top + (res.stripMm - mmFromBottom) * pxPerMm; let s = `<svg viewBox="0 0 ${width} ${height}" width="${width}" style="max-width:100%;height:auto" role="img" aria-label="chromatogram strip ${label}">`; s += `<rect x="${x0}" y="${top}" width="${stripW}" height="${res.stripMm * pxPerMm}" fill="#fbf8ef" stroke="#c9c2b0"/>`; const solventTopMm = Math.min(res.stripMm, res.originMm + frontMm); s += `<rect x="${x0}" y="${yOf(solventTopMm)}" width="${stripW}" height="${(solventTopMm) * pxPerMm}" fill="#e9f2f7" opacity=".7"/>`;
    if (!dipped) res.bands.forEach((b) => { const d = res.originMm + b.rf * frontMm; const h = Math.max(4, 6 + 10 * b.amount); s += `<rect x="${x0 + 6}" y="${yOf(d) - h / 2}" width="${stripW - 12}" height="${h}" rx="3" fill="${b.colour}" opacity="${0.35 + 0.65 * b.amount}"/>`; }); else s += `<rect x="${x0 + 4}" y="${yOf(res.originMm + 6)}" width="${stripW - 8}" height="${10 * pxPerMm}" fill="#5f8f46" opacity=".35"/>` + T(x0 + stripW / 2, yOf(res.originMm) + 16, "pigments dissolved", { s: 8, c: GREY }) + T(x0 + stripW / 2, yOf(res.originMm) + 26, "into the solvent", { s: 8, c: GREY });
    s += `<line x1="${x0 - 4}" y1="${yOf(res.originMm)}" x2="${x0 + stripW + 4}" y2="${yOf(res.originMm)}" stroke="#444" stroke-width="1.2"/>` + T(x0 + stripW + 8, yOf(res.originMm) + 4, "origin (pencil)", { s: 9, c: GREY, a: "start" });
    if (showFrontMark) s += `<line x1="${x0 - 4}" y1="${yOf(solventTopMm)}" x2="${x0 + stripW + 4}" y2="${yOf(solventTopMm)}" stroke="#444" stroke-width="1.2" stroke-dasharray="3 2"/>` + T(x0 + stripW + 8, yOf(solventTopMm) + 4, "solvent front", { s: 9, c: GREY, a: "start" });
    if (showRuler) { s += `<rect x="${x0 - 30}" y="${top}" width="18" height="${res.stripMm * pxPerMm}" fill="#f3e6b8" stroke="#9c7b3a"/>`; for (let mm = 0; mm <= res.stripMm; mm += 10) { const yy = yOf(mm); s += `<line x1="${x0 - 30}" y1="${yy}" x2="${x0 - 22}" y2="${yy}" stroke="#5a4631"/>` + (mm % 20 === 0 ? T(x0 - 34, yy + 3, String(mm), { s: 7.5, c: "#5a4631", a: "end" }) : ""); } s += T(x0 - 40, top + 8, "mm", { s: 7.5, c: "#5a4631", a: "end" }); }
    if (label) s += T(x0 + stripW / 2, height - 6, label, { s: 10, w: 600 }); return s + "</svg>"; };
  // Static diagram of the apparatus
  const apparatus = () => { let s = `<svg viewBox="0 0 760 360" width="760" role="img" aria-label="paper chromatography apparatus: a strip of chromatography paper with a pencil origin line and pigment spot suspended in a boiling tube containing solvent below the origin, with a bung">`; s += `<path d="M300 40 v240 a60 60 0 0 0 120 0 v-240" fill="#f4f9ff" stroke="#476a85" stroke-width="3"/><rect x="302" y="270" width="116" height="40" fill="#cfe6ff"/><path d="M302 270 v10 a58 58 0 0 0 116 0 v-10" fill="#cfe6ff"/><rect x="290" y="28" width="140" height="26" rx="6" fill="#8c6f4e" stroke="#5a4631" stroke-width="2"/>`; s += `<rect x="340" y="54" width="40" height="230" fill="#fbf8ef" stroke="#c9c2b0"/><line x1="340" y1="250" x2="380" y2="250" stroke="#444"/><circle cx="360" cy="250" r="5" fill="#2f7d3a"/><line x1="360" y1="54" x2="360" y2="40" stroke="#444"/>`; const lab = (x, y, tx, ty, t, a = "start") => `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="${GREY}"/>` + T(tx + (a === "start" ? 4 : -4), ty + 4, t, { s: 11, w: 600, a }); s += lab(430, 40, 520, 40, "bung with drawing pin holding the paper (keeps the tube saturated with vapour)") + lab(380, 120, 520, 100, "chromatography paper strip, hung straight, not touching the sides") + lab(380, 250, 520, 230, "PENCIL origin 2 cm from the bottom; leaf disc crushed onto it") + lab(418, 290, 520, 300, "3 cm³ solvent, level BELOW the origin line") + lab(300, 160, 180, 140, "boiling tube", "end"); s += T(380, 346, "Schematic. The spot must sit above the solvent; the paper is removed and the front marked at once when the solvent nears the top.", { s: 10, c: GREY }); return s + "</svg>"; };
  B.variationArt = { T, normalCurve, dotPlot, chromatogram, apparatus, colours: { INK, GREY, TEAL, SAGE, NAVY, AMBER, ROSE, MINT } };
})(window.BIO);
