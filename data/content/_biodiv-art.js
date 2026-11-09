// Shared models and artwork for 3.1.11 Biodiversity within a community (Batch 9, owned by the 3.1.11 author).
// Loaded before data/content/3.1.11.1.js, 3.1.11.2.js, data/consolidation/3.1.11.js and js/views/interactives-biodiv.js.
//
// B.biodivModel (pure functions, no DOM):
//  - index(counts): the index of diversity exactly as the OxfordAQA 9610 v5.1 specification gives it (printed p.20),
//      d = N(N − 1) / Σn(n − 1), N = total number of organisms of all species, n = total number of organisms of each
//      species. Returns every intermediate value. Undefined cases are returned as { ok: false, code, reason } and NEVER
//      as Infinity or NaN: N = 0 ("empty"), N = 1 ("single"), Σn(n − 1) = 0 because every species has at most one
//      individual ("allSingletons"), or counts that are not whole numbers ≥ 0 ("invalid").
//      Property used in the notes (proved, not assumed): Σn(n − 1) = Σn² − N ≤ N² − N = N(N − 1), so whenever d is
//      defined d ≥ 1, with d = 1 only when one species is present.
//  - compare(a, b, opts): position-by-position comparison of two ALIGNED sequences (gap symbol "-").
//      Conventions (stated on the page): positions where either sequence has a gap are reported separately; with
//      gaps: "exclude" (the platform default) they are left out of the denominator, with gaps: "count" each gap
//      position counts as a difference and stays in the denominator. Sequences of unequal length are refused
//      (code "unaligned"): they must be aligned first. A DNA sequence may be compared with an mRNA sequence only
//      when tu: true (T in the DNA coding strand corresponds to U in mRNA). Protein v nucleic acid is refused.
//  - revcomp(dna), translate(coding DNA or mRNA, via B.proteinModel), naive(a, b) for the "compare without
//      aligning" demonstration, matrix(list) for pairwise amino-acid comparisons.
// All sequences on these pages are ILLUSTRATIVE (constructed for teaching) and are labelled so on the page.
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ model ------------------------------------------------------------------
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const round = (x, dp = 2) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 2) => round(x, dp).toFixed(dp);
  const REASONS = {
    invalid: "Counts must be whole numbers of zero or more.",
    empty: "No organisms were counted (N = 0). There is nothing to describe, so d cannot be calculated.",
    single: "Only one organism was counted (N = 1). Then N(N − 1) = 0 and Σn(n − 1) = 0, so the formula would give 0 ÷ 0, which has no value: d cannot be calculated.",
    allSingletons: "Every species is represented by at most one individual, so every n(n − 1) = 0 and Σn(n − 1) = 0. The formula would divide by zero, so d cannot be calculated with this formula. A larger sample is needed.",
  };
  const index = (counts) => {
    const ns = (counts || []).map((c) => (typeof c === "number" ? c : c && c.n));
    if (ns.some((n) => !Number.isInteger(n) || n < 0)) return { ok: false, code: "invalid", reason: REASONS.invalid, ns };
    const N = sum(ns), terms = ns.map((n) => n * (n - 1)), sigma = sum(terms), top = N * (N - 1), richness = ns.filter((n) => n > 0).length;
    const base = { ns, N, terms, sigma, top, richness };
    if (N === 0) return Object.assign({ ok: false, code: "empty", reason: REASONS.empty }, base);
    if (N === 1) return Object.assign({ ok: false, code: "single", reason: REASONS.single }, base);
    if (sigma === 0) return Object.assign({ ok: false, code: "allSingletons", reason: REASONS.allSingletons }, base);
    return Object.assign({ ok: true, d: top / sigma }, base);
  };
  const clean = (s) => String(s || "").replace(/\s+/g, "").toUpperCase();
  const kind = (s) => { const x = clean(s).replace(/-/g, ""); if (/^[ACGT]+$/.test(x)) return "DNA"; if (/^[ACGU]+$/.test(x)) return "RNA"; return "protein"; };
  const compare = (a0, b0, opts = {}) => {
    const a = clean(a0), b = clean(b0), gaps = opts.gaps || "exclude";
    const ka = kind(a), kb = kind(b), nucleic = (k) => k === "DNA" || k === "RNA";
    if (nucleic(ka) !== nucleic(kb)) return { ok: false, code: "kinds", reason: "A base sequence cannot be compared with an amino-acid sequence." };
    if (ka !== kb && !opts.tu) return { ok: false, code: "tu", reason: "One sequence is DNA and the other mRNA. Compare mRNA with the DNA coding strand, treating U in mRNA as equivalent to T in DNA." };
    if (a.length !== b.length) return { ok: false, code: "unaligned", reason: `The sequences are different lengths (${a.length} and ${b.length}), so they cannot be compared position by position until they have been aligned (gaps inserted where bases or amino acids are missing).`, la: a.length, lb: b.length };
    const eq = (x, y) => x === y || (opts.tu && ((x === "T" && y === "U") || (x === "U" && y === "T")));
    const cols = []; let identical = 0, subs = 0, gapCols = 0;
    for (let i = 0; i < a.length; i++) { const x = a[i], y = b[i]; let st; if (x === "-" && y === "-") st = "empty"; else if (x === "-" || y === "-") { st = "gap"; gapCols++; } else if (eq(x, y)) { st = "same"; identical++; } else { st = "sub"; subs++; } cols.push({ i, x, y, st }); }
    const empty = cols.filter((c) => c.st === "empty").length, L = a.length - empty;
    const denom = gaps === "count" ? L : L - gapCols, differences = subs + (gaps === "count" ? gapCols : 0);
    if (denom === 0) return { ok: false, code: "nothing", reason: "No positions are left to compare." };
    return { ok: true, cols, length: L, gapCols, compared: L - gapCols, denom, identical, subs, differences, pct: (100 * identical) / denom, gaps, tu: !!opts.tu, kind: ka === kb ? ka : "DNA/RNA" };
  };
  // Naive comparison of unaligned sequences over the shorter length (used only to show why alignment matters).
  const naive = (a0, b0) => { const a = clean(a0), b = clean(b0), n = Math.min(a.length, b.length); let same = 0; for (let i = 0; i < n; i++) if (a[i] === b[i]) same++; return { n, same, pct: (100 * same) / n }; };
  const COMP = { A: "T", T: "A", G: "C", C: "G", "-": "-" };
  const revcomp = (s) => clean(s).split("").reverse().map((c) => COMP[c] || "?").join("");
  const toRna = (s) => clean(s).replace(/-/g, "").replace(/T/g, "U");
  const translate = (s) => { const P = B.proteinModel; const m = toRna(s); const out = []; for (let i = 0; i + 3 <= m.length; i += 3) out.push({ codon: m.slice(i, i + 3), aa: P ? P.aa(m.slice(i, i + 3)) : "?" }); return out; };
  const matrix = (list) => list.map((p) => list.map((q) => { const r = compare(p.seq, q.seq); return { diff: r.differences, pct: r.pct, compared: r.denom }; }));
  const chunk = (s, k = 3) => clean(s).match(new RegExp(`.{1,${k}}`, "g")) || [];

  // ---- Illustrative sequences (constructed for teaching; NOT real sequences of any organism) ----
  // Every count and percentage quoted on the pages is computed from these strings by compare() and checked by hand.
  const SEQ = {
    // 1. substitutions only (DNA coding strand, 5'→3', 24 bases): 4 differences; 2 of them change an amino acid
    p: "ATGAAACTGGTTGCATGCTACGGA", q: "ATGAAGCTGATTGCATGTTACGCA",
    // 2. degeneracy: 5 differences, all at third positions, none changes an amino acid (30 bases, 10 codons)
    syn1: "ATGGCTAAAGGCTTACCTGAATCCGTTTGG", syn2: "ATGGCAAAAGGTTTGCCTGAGTCCGTCTGG",
    // 3. deletion of one codon (GGT) plus one substitution; j is 33 bases, k is 30 bases; kAligned has the gap
    j: "ATGGCACATTCCGAAGGTACCCTGAAATGGTTC", k: "ATGGCACATTCCGAAACCCTGAAGTGGTTC", kAligned: "ATGGCACATTCCGAA---ACCCTGAAGTGGTTC",
    // 4. DNA coding strand of species E with mRNA of species F (U ≡ T): 4 differences, 1 changes an amino acid
    e: "ATGTCTGGACGTTTAGACCAATAT", fRna: "AUGUCCGGACGUCUAGACCAGUGU",
    // 5. reverse-complement trap: species H's sequence was reported as the complementary strand, written 5'→3'
    g: "ATGCCAGATTTGAACGGTCTCATT", hCoding: "ATGCCGGATTTGAATGGTCTCATT",
    // 6. region matters: a conserved coding region and a variable non-coding region of the same two species
    s1: "ATGGCTGCCAAGATCGGTGAACTGCACTGG", t1: "ATGGCTGCCAAGATCGGCGAACTGCACTGG",
    s2: "GTAAGTCTTAACGATTTCAGGTATCCAGTA", t2: "GTAAGACTTCACGGTTACAGCTTTCCGGTT",
  };
  SEQ.hReported = revcomp(SEQ.hCoding);
  // 7. amino-acid sequences (one-letter codes) of a 20-residue region of one protein in five species V–Z
  const PROT = [
    { sp: "V", seq: "MSDLKAGEKVFRTHCASCHG" },
    { sp: "W", seq: "MSDLKAGERVFRTHCASCHG" },
    { sp: "X", seq: "MSDIKAGEKVFKTHCSSCHG" },
    { sp: "Y", seq: "MADLKANEKVFRSHCASCND" },
    { sp: "Z", seq: "MSELRTGQKILRTYCATCHG" },
  ];

  // ---- Illustrative communities for the index of diversity (counts invented for teaching) ----
  const COMMUNITIES = {
    evenA: { title: "Site A: five species, even abundances", place: "Quadrat samples from a meadow", kind: "meadow", species: [["Meadow buttercup", 20], ["Ribwort plantain", 20], ["Red clover", 20], ["Common daisy", 20], ["Yarrow", 20]] },
    unevenB: { title: "Site B: five species, one dominant", place: "Quadrat samples from a heavily fertilised grassland", kind: "meadow", species: [["Meadow buttercup", 2], ["Ribwort plantain", 2], ["Red clover", 2], ["Common daisy", 2], ["Perennial ryegrass", 92, 5]], note: "Site B shares four species with Site A; perennial ryegrass (F) replaces yarrow (E), so Site B also has five species" },
    margin: { title: "Field margin (uncropped strip)", place: "Invertebrates in pitfall traps along a 6 m grass margin", kind: "farm", species: [["Ground beetle sp. 1", 12], ["Wolf spider sp.", 9], ["Rove beetle sp.", 7], ["Ground beetle sp. 2", 6], ["Harvestman sp.", 4], ["Woodlouse sp.", 3], ["Centipede sp.", 2], ["Money spider sp.", 1]] },
    crop: { title: "Cropped field centre (wheat monoculture)", place: "Invertebrates in the same number of pitfall traps in the crop", kind: "farm", species: [["Ground beetle sp. 1", 30], ["Money spider sp.", 6], ["Rove beetle sp.", 3], ["Wolf spider sp.", 1]] },
    mangrove: { title: "Mangrove edge (five quadrats pooled)", place: "Animals on the mud surface among grey mangrove roots at low tide", kind: "coast", species: [["Fiddler crab sp.", 18], ["Mud creeper snail sp.", 25], ["Mudskipper sp.", 4], ["Barnacle sp. (on aerial roots)", 10], ["Burrowing worm sp.", 3]] },
    sandflat: { title: "Bare sand flat beside the mangrove (five quadrats pooled)", place: "The same method on open sand with no mangroves", kind: "coast", species: [["Mud creeper snail sp.", 30], ["Fiddler crab sp.", 5], ["Burrowing worm sp.", 2]] },
    singletons: { title: "Undefined case: every species seen once", place: "A very small sample", kind: "edge", species: [["Species 1", 1], ["Species 2", 1], ["Species 3", 1], ["Species 4", 1]] },
    one: { title: "Undefined case: one organism", place: "A single individual found", kind: "edge", species: [["Species 1", 1]] },
    empty: { title: "Undefined case: an empty quadrat", place: "Nothing found", kind: "edge", species: [["Species 1", 0], ["Species 2", 0]] },
  };
  const dOf = (key) => index(COMMUNITIES[key].species.map((s) => s[1]));
  // Symbol index (shape and letter) for each species of a community: the optional third entry, else its position.
  // Site B uses symbol 5 (F) for perennial ryegrass so that it is never drawn like Site A's yarrow (E).
  const syms = (key) => COMMUNITIES[key].species.map((s, k) => (s[2] == null ? k : s[2]));

  B.biodivModel = { index, REASONS, round, fix, compare, naive, revcomp, toRna, translate, matrix, chunk, kind, clean, SEQ, PROT, COMMUNITIES, dOf, syms };

  // ------------------------------------------------------------------ art ------------------------------------------------------------------
  const INK = "#16263a", GREY = "#5f6f7f", TEAL = "#1f8a8a", NAVY = "#1e3a5f", AMBER = "#b07a1c", ROSE = "#b4504f", SAGE = "#5d8a6f", MINT = "#d6efec", SAND = "#efe3c4", SEA = "#cfe6f2";
  const PAL = ["#1f8a8a", "#1e3a5f", "#b07a1c", "#b4504f", "#5d8a6f", "#6a4c93", "#8a6a3a", "#4a6d8c"];
  let cnt = 0, U = ""; const uid = () => (U = "-bd" + (++cnt));
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.f ? ` font-family="${o.f}"` : ""}${o.i ? ' font-style="italic"' : ""}>${s}</text>`;
  const R = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx == null ? 8 : o.rx}" fill="${o.f || "#fff"}" stroke="${o.st || "none"}" stroke-width="${o.sw || 1.5}"${o.da ? ` stroke-dasharray="${o.da}"` : ""}/>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 1.6}"${o.da ? ` stroke-dasharray="${o.da}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const marker = (id, c) => `<marker id="${id}${U}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  const open = (w, h, aria, defs = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${aria}" style="max-width:100%;height:auto">${defs ? `<defs>${defs}</defs>` : ""}`;
  const MONO = "ui-monospace, Menlo, Consolas, monospace";

  // Organism symbols for quadrat drawings: shape AND letter per species (never colour alone).
  const shape = (k, x, y, r, c) => {
    const p = (pts) => `<polygon points="${pts.map(([a, b]) => `${(x + a * r).toFixed(1)},${(y + b * r).toFixed(1)}`).join(" ")}" fill="${c}"/>`;
    switch (k % 8) {
      case 0: return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
      case 1: return `<rect x="${x - r * 0.9}" y="${y - r * 0.9}" width="${r * 1.8}" height="${r * 1.8}" rx="2" fill="${c}"/>`;
      case 2: return p([[0, -1.15], [1.05, 0.8], [-1.05, 0.8]]);
      case 3: return p([[0, -1.2], [1.1, 0], [0, 1.2], [-1.1, 0]]);
      case 4: return p([[-0.55, -1], [0.55, -1], [1.1, 0], [0.55, 1], [-0.55, 1], [-1.1, 0]]);
      case 5: return p([[0, -1.15], [1.1, -0.35], [0.7, 1], [-0.7, 1], [-1.1, -0.35]]);
      case 6: return `<rect x="${x - r * 1.15}" y="${y - r * 0.7}" width="${r * 2.3}" height="${r * 1.4}" rx="${r * 0.7}" fill="${c}"/>`;
      default: return p([[-0.35, -1.1], [0.35, -1.1], [0.35, -0.35], [1.1, -0.35], [1.1, 0.35], [0.35, 0.35], [0.35, 1.1], [-0.35, 1.1], [-0.35, 0.35], [-1.1, 0.35], [-1.1, -0.35], [-0.35, -0.35]]);
    }
  };
  const LETTERS = "ABCDEFGH";
  const symbol = (k, x, y, r = 8) => shape(k, x, y, r, PAL[k % 8]) + `<text x="${x}" y="${y + r * 0.42}" text-anchor="middle" font-size="${(r * 1.15).toFixed(1)}" font-weight="700" fill="#fff">${LETTERS[k]}</text>`;
  const rng = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  // Places counts[k] organisms of species k in distinct cells of a jittered grid, so symbols never overlap.
  const quadrat = (counts, o = {}) => {
    const size = o.size || 360, N = sum(counts), r0 = rng(o.seed || 7);
    const cols = Math.max(6, Math.ceil(Math.sqrt(Math.max(N, 1) * 1.5))), cell = size / cols, r = Math.min(10, cell * 0.36);
    const cells = Array.from({ length: cols * cols }, (_, i) => i); for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r0() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    let s = "", c = 0; const x0 = o.x || 0, y0 = o.y || 0;
    s += R(x0, y0, size, size, { f: o.bg || "#f3efe2", st: "#8a7a55", sw: 2.5, rx: 2 });
    for (let g = 1; g < 4; g++) s += L(x0 + (g * size) / 4, y0, x0 + (g * size) / 4, y0 + size, { c: "#cdbf9c", w: 0.8, da: "3 4" }) + L(x0, y0 + (g * size) / 4, x0 + size, y0 + (g * size) / 4, { c: "#cdbf9c", w: 0.8, da: "3 4" });
    counts.forEach((n, k) => { for (let m = 0; m < n && c < cells.length; m++, c++) { const ci = cells[c], cx = ci % cols, cy = Math.floor(ci / cols); const jx = (r0() - 0.5) * (cell - 2.4 * r), jy = (r0() - 0.5) * (cell - 2.4 * r); s += symbol(o.syms ? o.syms[k] : k, +(x0 + (cx + 0.5) * cell + jx).toFixed(1), +(y0 + (cy + 0.5) * cell + jy).toFixed(1), r); } });
    return s;
  };
  const quadratSVG = (counts, names, o = {}) => {
    uid(); const size = o.size || 360, W = size + 20, legendH = Math.ceil(names.length / 2) * 22 + 10, H = size + 20 + legendH;
    let s = open(W, H, o.aria || `sampling view: ${sum(counts)} organisms of ${counts.filter((n) => n > 0).length} species, each species drawn with its own shape and letter`);
    s += quadrat(counts, { size, x: 10, y: 10, seed: o.seed, bg: o.bg, syms: o.syms });
    names.forEach((nm, k) => { const col = k % 2, row = Math.floor(k / 2); const x = 22 + col * (W / 2), y = size + 34 + row * 22; s += symbol(o.syms ? o.syms[k] : k, x, y - 4, 8) + T(x + 14, y, nm, { a: "start", s: 11.5 }); });
    return s + "</svg>";
  };

  // D1 (3.1.11.1): the three ways of measuring genetic diversity named in the specification
  const measures = () => {
    uid(); let s = open(760, 300, "three panels: comparing base sequences of DNA or mRNA; comparing the frequency of alleles or base sequences in populations; comparing amino-acid sequences of a protein");
    const panel = (x, title, sub) => R(x, 10, 240, 280, { f: "#fff", st: "#b9c9c4", sw: 1.5, rx: 12 }) + T(x + 120, 34, title, { s: 13, w: 700 }) + T(x + 120, 52, sub, { s: 10.5, c: GREY });
    s += panel(10, "1. Base sequence", "of DNA or of mRNA") + panel(260, "2. Frequency", "of specific base sequences or alleles") + panel(510, "3. Amino-acid sequence", "of the encoded protein");
    const a = "ATGGCTAAA", b = "ATGGCAAAA";
    [a, b].forEach((q, r) => { s += T(30, 96 + r * 34, r ? "sp. 2" : "sp. 1", { a: "start", s: 10.5, c: GREY }); q.split("").forEach((c, i) => { const diff = a[i] !== b[i]; s += R(68 + i * 19, 80 + r * 34, 17, 22, { f: diff ? "#f6dede" : MINT, rx: 3, st: diff ? ROSE : "none", sw: 1.5 }) + T(76.5 + i * 19, 96 + r * 34, c, { s: 12, w: 700, f: MONO, c: diff ? ROSE : INK }); }); });
    s += T(130, 160, "aligned 5′→3′; 1 difference in 9", { s: 10.5 }) + T(130, 176, "= 8 / 9 identical (88.9 %)", { s: 10.5 });
    s += T(130, 210, "mRNA is compared with the", { s: 10.5, c: GREY }) + T(130, 225, "DNA coding strand (U in", { s: 10.5, c: GREY }) + T(130, 240, "mRNA ≡ T in DNA)", { s: 10.5, c: GREY }) + T(130, 268, "illustrative sequences", { s: 9.5, c: GREY, i: true });
    // allele frequency bars
    const pops = [["pop. P", [0.5, 0.3, 0.2]], ["pop. Q", [0.9, 0.1, 0]]];
    s += L(300, 80, 300, 210, { c: INK, w: 1.2 }) + L(300, 210, 490, 210, { c: INK, w: 1.2 }) + T(292, 84, "1.0", { a: "end", s: 9.5 }) + T(292, 213, "0", { a: "end", s: 9.5 });
    pops.forEach(([nm, f], p) => { f.forEach((v, k) => { const x = 312 + p * 92 + k * 24; const h = v * 130; s += R(x, 210 - h, 20, h, { f: PAL[k], rx: 1 }); s += T(x + 10, 224, `A${k + 1}`, { s: 9, c: GREY }); }); s += T(348 + p * 92, 240, nm, { s: 10.5, w: 600 }); });
    s += T(385, 258, "allele frequency of one gene", { s: 10.5 }) + T(385, 274, "P has more alleles, more evenly spread", { s: 10, c: GREY });
    // amino acid beads
    const aa1 = ["Met", "Ala", "Lys", "Gly", "Leu"], aa2 = ["Met", "Ala", "Arg", "Gly", "Leu"];
    [aa1, aa2].forEach((q, r) => { s += T(522, 100 + r * 44, r ? "sp. 2" : "sp. 1", { a: "start", s: 10.5, c: GREY }); q.forEach((c, i) => { const diff = aa1[i] !== aa2[i]; const x = 575 + i * 38; if (i) s += L(x - 21, 96 + r * 44, x - 17, 96 + r * 44, { c: INK, w: 2 }); s += `<circle cx="${x}" cy="${96 + r * 44}" r="16" fill="${diff ? "#f6dede" : "#e4ebf5"}" stroke="${diff ? ROSE : NAVY}" stroke-width="1.5"/>` + T(x, 100 + r * 44, c, { s: 10, w: 700, c: diff ? ROSE : NAVY }); }); });
    s += T(630, 176, "one amino acid differs in 5", { s: 10.5 }) + T(630, 210, "fewer differences in a protein", { s: 10.5, c: GREY }) + T(630, 225, "than in its gene are possible:", { s: 10.5, c: GREY }) + T(630, 240, "the genetic code is degenerate", { s: 10.5, c: GREY });
    return s + "</svg>";
  };

  // D2 (3.1.11.1): a static aligned comparison drawn from compare(); cells coloured AND marked (× substitution, – gap)
  const alignFig = (a, b, o = {}) => {
    uid(); const r = compare(a, b, o); const n = clean(a).length, cw = Math.min(24, 680 / n), W = Math.max(560, 70 + n * cw + 20), H = 196;
    let s = open(W, H, o.aria || `two aligned sequences compared position by position: ${r.subs} substitutions${r.gapCols ? ` and ${r.gapCols} gap positions` : ""} among ${r.length} positions`);
    const la = o.labels || ["species 1", "species 2"];
    s += T(10, 22, "5′", { a: "start", s: 11, w: 700, c: GREY }) + T(W - 10, 22, "3′", { a: "end", s: 11, w: 700, c: GREY });
    r.cols.forEach((c, i) => { const x = 70 + i * cw; const f = c.st === "same" ? MINT : c.st === "sub" ? "#f6dede" : "#eceff3"; [c.x, c.y].forEach((ch, k) => { s += R(x, 32 + k * 34, cw - 2, 26, { f, rx: 3, st: c.st === "sub" ? ROSE : "none", sw: 1.4 }) + T(x + (cw - 2) / 2, 50 + k * 34, ch, { s: Math.min(13, cw * 0.6), w: 700, f: MONO, c: c.st === "sub" ? ROSE : INK }); }); s += T(x + (cw - 2) / 2, 112, c.st === "sub" ? "×" : c.st === "gap" ? "–" : "", { s: 13, w: 700, c: c.st === "sub" ? ROSE : GREY }); if ((i + 1) % 3 === 0 && o.codons) s += L(x + cw - 1, 30, x + cw - 1, 94, { c: "#9aa9b8", w: 1, da: "2 2" }); });
    s += T(62, 50, la[0], { a: "end", s: 11, c: GREY }) + T(62, 84, la[1], { a: "end", s: 11, c: GREY });
    const line = r.gapCols ? `${r.length} aligned positions: ${r.identical} identical, ${r.subs} substitution${r.subs === 1 ? "" : "s"}, ${r.gapCols} gap positions` : `${r.length} positions: ${r.identical} identical, ${r.subs} substitution${r.subs === 1 ? "" : "s"} (×)`;
    s += T(W / 2, 140, line, { s: 12, w: 600 });
    s += T(W / 2, 162, r.gapCols ? `gaps excluded: ${r.identical} ÷ ${r.compared} × 100 = ${fix(r.pct, 1)} %   ·   gaps counted as differences: ${r.identical} ÷ ${r.length} × 100 = ${fix((100 * r.identical) / r.length, 1)} %` : `percentage similarity = ${r.identical} ÷ ${r.denom} × 100 = ${fix(r.pct, 1)} %`, { s: 11.5, c: NAVY, w: 600 });
    s += T(W / 2, 184, o.foot || "illustrative sequences, both written 5′→3′", { s: 10, c: GREY, i: true });
    return s + "</svg>";
  };

  // D3 (3.1.11.1): degeneracy — DNA differs, amino-acid sequence identical (computed via B.proteinModel)
  const synonymousFig = () => {
    uid(); const A1 = translate(SEQ.syn1), A2 = translate(SEQ.syn2); const r = compare(SEQ.syn1, SEQ.syn2);
    const aaSame = A1.filter((x, i) => x.aa === A2[i].aa).length;
    let s = open(760, 250, `two coding sequences of ten codons differ at ${r.subs} bases, all in the third position of a codon, yet both code for the same ten amino acids`);
    A1.forEach((c, i) => { const x = 20 + i * 73; const c2 = A2[i]; const diff = c.codon !== c2.codon;
      [c, c2].forEach((cc, k) => { const dna = cc.codon.replace(/U/g, "T"); s += R(x, 30 + k * 96, 66, 28, { f: diff ? "#fbf0d8" : MINT, rx: 4, st: diff ? AMBER : "none", sw: 1.4 }); dna.split("").forEach((b, j) => { const other = (k ? c : c2).codon.replace(/U/g, "T")[j]; s += T(x + 13 + j * 20, 50 + k * 96, b, { s: 13, w: 700, f: MONO, c: b !== other ? ROSE : INK }); }); s += T(x + 33, 76 + k * 96, cc.aa, { s: 11.5, w: 700, c: NAVY }); }); });
    s += T(10, 22, "species 1 (DNA coding strand, 5′→3′) and the amino acid each codon codes for", { a: "start", s: 11, c: GREY }) + T(10, 118, "species 2", { a: "start", s: 11, c: GREY });
    s += T(380, 210, `DNA: ${r.identical} of ${r.length} bases identical (${fix(r.pct, 1)} %)   ·   amino acids: ${aaSame} of ${A1.length} identical (${fix((100 * aaSame) / A1.length, 0)} %)`, { s: 12.5, w: 700 });
    s += T(380, 232, "every difference is in the third base of a codon and gives a codon for the same amino acid (illustrative sequences)", { s: 10.5, c: GREY });
    return s + "</svg>";
  };

  // D4 (3.1.11.1): differences matrix for the five illustrative proteins and the relationships it suggests
  const treeFig = () => {
    uid(); const M = matrix(PROT); let s = open(760, 300, "a table of the number of amino-acid differences between five species and a branching diagram suggesting that V and W are most closely related, then X, then Y, with Z least closely related");
    s += T(170, 22, "amino-acid differences (20 positions)", { s: 12, w: 700 });
    PROT.forEach((p, i) => { s += T(68 + i * 52, 50, p.sp, { s: 13, w: 700 }) + T(28, 82 + i * 38, p.sp, { s: 13, w: 700 }); PROT.forEach((q, j) => { const v = M[i][j].diff; const f = i === j ? "#eceff3" : v <= 1 ? MINT : v <= 4 ? "#e4ebf5" : v <= 7 ? "#fbf0d8" : "#f6dede"; s += R(44 + j * 52, 60 + i * 38, 48, 32, { f, rx: 4 }) + T(68 + j * 52, 81 + i * 38, i === j ? "–" : v, { s: 13, w: 600 }); }); });
    // tree drawn from the matrix pattern (V,W),X),Y),Z; branch lengths not to scale
    const yy = { V: 70, W: 110, X: 150, Y: 190, Z: 240 }, tx = 700;
    s += T(560, 22, "relationships suggested (not to scale)", { s: 12, w: 700 });
    s += L(640, 90, tx, 70, { c: NAVY, w: 2 }) + L(640, 90, tx, 110, { c: NAVY, w: 2 }) + L(600, 120, 640, 90, { c: NAVY, w: 2 }) + L(600, 120, tx, 150, { c: NAVY, w: 2 }) + L(560, 155, 600, 120, { c: NAVY, w: 2 }) + L(560, 155, tx, 190, { c: NAVY, w: 2 }) + L(500, 198, 560, 155, { c: NAVY, w: 2 }) + L(500, 198, tx, 240, { c: NAVY, w: 2 });
    Object.entries(yy).forEach(([k, y]) => (s += T(tx + 14, y + 5, k, { s: 13, w: 700, a: "start" })));
    s += T(560, 272, "fewer differences → more recent common ancestor", { s: 10.5, c: GREY }) + T(560, 288, "(a suggestion from one protein region, not proof)", { s: 10.5, c: GREY }) + T(170, 272, "illustrative sequences: see the notes", { s: 10.5, c: GREY, i: true });
    return s + "</svg>";
  };

  // D5 (3.1.11.1): allele frequencies of one gene in three populations
  const alleleFig = () => {
    uid(); const pops = [["Population 1", [0.45, 0.3, 0.15, 0.1]], ["Population 2", [0.4, 0.35, 0.15, 0.1]], ["Population 3 (small, isolated)", [0.85, 0.15, 0, 0]]];
    let s = open(760, 270, "bar chart of the frequencies of four alleles of one gene in three populations: populations 1 and 2 have four alleles at similar frequencies; population 3 has only two, one of them at a frequency of 0.85");
    s += L(70, 30, 70, 210, { c: INK, w: 1.2 }) + L(70, 210, 740, 210, { c: INK, w: 1.2 });
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => (s += L(66, 210 - v * 170, 740, 210 - v * 170, { c: "#e3e8ee", w: 1 }) + T(60, 214 - v * 170, v.toFixed(2), { a: "end", s: 10 })));
    s += `<text x="18" y="120" transform="rotate(-90 18 120)" text-anchor="middle" font-size="11" fill="${INK}">allele frequency</text>`;
    pops.forEach(([nm, f], p) => { const x0 = 100 + p * 215; f.forEach((v, k) => { const x = x0 + k * 42, h = v * 170; if (h > 0) s += R(x, 210 - h, 34, h, { f: PAL[k], rx: 2 }); s += T(x + 17, 205 - h, v ? v.toFixed(2) : "0", { s: 10, w: 600 }) + T(x + 17, 226, `A${k + 1}`, { s: 10.5, c: GREY }); }); s += T(x0 + 80, 248, nm, { s: 11.5, w: 700 }); });
    s += T(400, 266, "illustrative data: frequencies in each population add up to 1", { s: 10, c: GREY, i: true });
    return s + "</svg>";
  };

  // D6 (3.1.11.2): same richness, different evenness (computed with index())
  const evennessFig = () => {
    uid(); const A = COMMUNITIES.evenA.species.map((x) => x[1]), Bc = COMMUNITIES.unevenB.species.map((x) => x[1]); const dA = index(A), dB = index(Bc);
    const sA = syms("evenA"), sB = syms("unevenB");
    let s = open(760, 396, `two quadrat samples, each with five species and 100 organisms: site A with 20 of each of buttercup, plantain, clover, daisy and yarrow, index of diversity ${fix(dA.d)}; site B with 2 each of buttercup, plantain, clover and daisy and 92 perennial ryegrass, a species not in site A, index ${fix(dB.d)}`);
    s += quadrat(A, { size: 250, x: 40, y: 30, seed: 11, syms: sA }) + quadrat(Bc, { size: 250, x: 470, y: 30, seed: 12, syms: sB });
    s += T(165, 22, "Site A: 5 species, 20 of each", { s: 12.5, w: 700 }) + T(595, 22, "Site B: 5 species, one with 92", { s: 12.5, w: 700 });
    s += T(165, 300, `richness 5 · N = 100 · d = ${fix(dA.d)}`, { s: 12, w: 600, c: NAVY }) + T(595, 300, `richness 5 · N = 100 · d = ${fix(dB.d)}`, { s: 12, w: 600, c: NAVY });
    s += T(380, 160, "same", { s: 11, c: GREY }) + T(380, 176, "richness,", { s: 11, c: GREY }) + T(380, 192, "different", { s: 11, c: GREY }) + T(380, 208, "evenness", { s: 11, c: GREY });
    // legend: one entry per symbol used in either site (yarrow only in A, ryegrass only in B)
    const leg = []; COMMUNITIES.evenA.species.forEach((x, k) => leg.push([sA[k], x[0] + (COMMUNITIES.unevenB.species.some((y) => y[0] === x[0]) ? "" : " (Site A only)")]));
    COMMUNITIES.unevenB.species.forEach((x, k) => { if (!COMMUNITIES.evenA.species.some((y) => y[0] === x[0])) leg.push([sB[k], x[0] + " (Site B only)"]); });
    leg.forEach(([sy, nm], i) => { const x = 40 + (i % 3) * 245, y = 334 + Math.floor(i / 3) * 24; s += symbol(sy, x + 8, y - 4, 8) + T(x + 22, y, nm, { a: "start", s: 11.5 }); });
    s += T(380, 388, "each letter and shape is one species (illustrative counts)", { s: 10, c: GREY, i: true });
    return s + "</svg>";
  };

  // D7 (3.1.11.2): the calculation laid out step by step (field margin data)
  const indexFlow = (key = "margin") => {
    uid(); const c = COMMUNITIES[key], r = index(c.species.map((x) => x[1])); const rows = c.species.length, H = 120 + rows * 24 + 70;
    let s = open(760, H, `worked calculation of the index of diversity for ${c.title}: N = ${r.N}, sum of n(n − 1) = ${r.sigma}, d = ${fix(r.d)}`);
    s += T(380, 22, `d = N(N − 1) ÷ Σn(n − 1)   ·   ${c.title}`, { s: 13, w: 700 });
    const xs = [40, 330, 440, 560]; ["Species", "n", "n − 1", "n(n − 1)"].forEach((h, i) => (s += T(xs[i] + (i ? 40 : 0), 52, h, { a: i ? "middle" : "start", s: 12, w: 700, c: NAVY })));
    s += L(30, 60, 730, 60, { c: "#b9c9c4", w: 1.2 });
    c.species.forEach(([nm, n], i) => { const y = 80 + i * 24; s += T(40, y, nm, { a: "start", s: 11.5 }) + T(370, y, n, { s: 12, f: MONO }) + T(480, y, n - 1, { s: 12, f: MONO }) + T(600, y, n * (n - 1), { s: 12, w: 700, f: MONO }); });
    const yb = 80 + rows * 24; s += L(30, yb - 12, 730, yb - 12, { c: "#b9c9c4", w: 1.2 });
    s += T(40, yb + 8, "Totals", { a: "start", s: 12, w: 700 }) + T(370, yb + 8, `N = ${r.N}`, { s: 12, w: 700 }) + T(600, yb + 8, `Σ = ${r.sigma}`, { s: 12, w: 700 });
    s += R(40, yb + 24, 680, 52, { f: MINT, rx: 10 }) + T(380, yb + 46, `N(N − 1) = ${r.N} × ${r.N - 1} = ${r.top}`, { s: 12.5, w: 600 }) + T(380, yb + 66, `d = ${r.top} ÷ ${r.sigma} = ${fix(r.d, 4)} … = ${fix(r.d)} (2 decimal places)`, { s: 12.5, w: 700, c: NAVY });
    return s + "</svg>";
  };

  // D8 (3.1.11.2): two farm landscapes (schematic)
  const farmFig = () => {
    uid(); let s = open(760, 352, "two schematic farm landscapes: on the left large fields of one crop with hedgerows removed; on the right smaller fields with hedgerows, uncropped field margins, a pond and a woodland patch, and different crops in rotation");
    const field = (x, y, w, h, c, lab) => R(x, y, w, h, { f: c, rx: 2, st: "#c9b98a", sw: 1 }) + (lab ? T(x + w / 2, y + h / 2 + 4, lab, { s: 10.5, w: 600 }) : "");
    s += T(190, 22, "Intensive: larger fields, one crop", { s: 12.5, w: 700 }) + T(570, 22, "With conservation measures", { s: 12.5, w: 700 });
    s += field(20, 36, 340, 230, "#f1e2a6", "") + T(190, 140, "wheat monoculture", { s: 12, w: 600 }) + T(190, 158, "(hedgerows removed)", { s: 10.5, c: GREY });
    for (let i = 0; i < 10; i++) s += L(40 + i * 33, 50, 40 + i * 33, 250, { c: "#e3cf86", w: 1 });
    s += T(190, 304, "more area cropped; fewer habitats and food plants", { s: 10.5 }) + T(190, 320, "for wildlife; pesticides and fertiliser used widely", { s: 10.5 });
    // right landscape
    const X = 400, Y = 36; s += R(X, Y, 340, 230, { f: "#e7f0dc", rx: 2 });
    s += field(X + 14, Y + 14, 150, 92, "#f1e2a6", "wheat") + field(X + 178, Y + 14, 148, 92, "#d9e8b8", "beans") + field(X + 14, Y + 124, 150, 92, "#e9d7b0", "barley") + field(X + 178, Y + 124, 90, 92, "#d6e7c6", "grass ley");
    const hedge = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3f7a4f" stroke-width="7" stroke-linecap="round"/>`;
    s += hedge(X + 171, Y + 8, X + 171, Y + 222) + hedge(X + 8, Y + 115, X + 332, Y + 115);
    s += `<rect x="${X + 14}" y="${Y + 14}" width="150" height="92" fill="none" stroke="#9bc27f" stroke-width="6" opacity=".9"/>`;
    s += `<ellipse cx="${X + 302}" cy="${Y + 192}" rx="26" ry="16" fill="${SEA}" stroke="#7aa9c4"/>` + T(X + 302, Y + 196, "pond", { s: 9.5 });
    for (let i = 0; i < 5; i++) s += `<circle cx="${X + 290 + (i % 3) * 14}" cy="${Y + 136 + Math.floor(i / 3) * 14}" r="8" fill="#4f8a5c"/>`;
    s += T(X + 300, Y + 172, "trees", { s: 9.5, c: "#2f5a3a" });
    s += `<line x1="${X + 8}" y1="${Y + 250}" x2="${X + 36}" y2="${Y + 250}" stroke="#3f7a4f" stroke-width="7" stroke-linecap="round"/>` + T(X + 44, Y + 254, "hedgerow", { a: "start", s: 10.5, w: 600, c: "#2f5a3a" }) + `<rect x="${X + 130}" y="${Y + 244}" width="26" height="12" fill="#9bc27f"/>` + T(X + 162, Y + 254, "uncropped margin", { a: "start", s: 10.5, w: 600, c: "#4f7a3a" });
    s += T(570, 304, "less area cropped; more habitats, food and corridors", { s: 10.5 }) + T(570, 320, "for wildlife; costs and yield effects vary", { s: 10.5 });
    s += T(380, 344, "schematic, not to scale", { s: 10, c: GREY, i: true });
    return s + "</svg>";
  };

  // D9 (3.1.11.2): how human activities reduce biodiversity
  const threatsFig = () => {
    uid(); let s = open(760, 320, "flow diagram: human activities such as clearing land, intensive farming, pesticides and fertilisers, pollution, overexploitation, introduced species and climate change lead to fewer habitats, niches and food sources; some species are lost (lower richness) or a few come to dominate (lower evenness); either lowers the index of diversity", marker("th", GREY));
    const acts = ["Clearing land for farms, towns, roads, coasts", "Intensive farming: monoculture, hedgerow removal", "Pesticides, herbicides, fertiliser run-off", "Pollution of air, water and soil", "Overfishing and overharvesting", "Introduced (non-native) species; climate change"];
    acts.forEach((a, i) => { const y = 14 + i * 50; s += R(10, y, 262, 38, { f: "#fff", st: "#b9c9c4", rx: 8 }) + T(141, y + 23, a, { s: 10.5 }); s += L(274, y + 19, 312, 112 + i * 19, { c: "#9aa9b8", w: 1.3, m: "th" }); });
    s += R(316, 92, 168, 136, { f: "#fbf0d8", st: AMBER, rx: 12 }); ["Fewer habitats and", "niches; less food and", "shelter; organisms", "killed directly or", "out-competed; habitats", "fragmented"].forEach((t, i) => (s += T(400, 116 + i * 19, t, { s: 10.5, w: 600 })));
    s += L(486, 140, 512, 102, { c: GREY, w: 2, m: "th" }) + L(486, 182, 512, 218, { c: GREY, w: 2, m: "th" });
    s += R(516, 54, 132, 92, { f: "#f6dede", st: ROSE, rx: 12 }) + T(582, 82, "Some species", { s: 11, w: 700 }) + T(582, 97, "lost", { s: 11, w: 700 }) + T(582, 116, "→ lower species", { s: 10.5 }) + T(582, 131, "richness", { s: 10.5 });
    s += R(516, 174, 132, 92, { f: "#f6dede", st: ROSE, rx: 12 }) + T(582, 202, "A few species", { s: 11, w: 700 }) + T(582, 217, "dominate", { s: 11, w: 700 }) + T(582, 236, "→ less even", { s: 10.5 }) + T(582, 251, "abundances", { s: 10.5 });
    s += L(650, 100, 672, 142, { c: GREY, w: 2, m: "th" }) + L(650, 220, 672, 178, { c: GREY, w: 2, m: "th" });
    s += R(674, 122, 80, 76, { f: NAVY, rx: 12 }) + T(714, 152, "lower", { s: 11, w: 700, c: "#fff" }) + T(714, 167, "index of", { s: 11, w: 700, c: "#fff" }) + T(714, 182, "diversity", { s: 11, w: 700, c: "#fff" });
    s += T(582, 300, "either or both", { s: 10.5, c: GREY, i: true });
    return s + "</svg>";
  };

  // D10 (3.1.11.2): grey mangrove shore (schematic; facts from EAD sources cited on the page)
  const mangroveFig = () => {
    uid(); let s = open(760, 340, "schematic profile of a mangrove shore: sea on the left, grey mangrove trees with pencil-like aerial roots standing in mud between low and high tide levels, juvenile fish among the roots at high tide, crabs and snails on the mud, birds feeding, and land on the right", marker("mg", GREY));
    const mudY = (x) => 260 - (70 * x) / 560; // mud surface: a straight slope from (0, 260) to (560, 190)
    s += `<rect x="0" y="150" width="760" height="190" fill="${SEA}"/>` + `<polygon points="0,260 560,190 760,138 760,340 0,340" fill="#cdb98f"/>` + `<polygon points="560,190 760,138 760,340 560,340" fill="${SAND}"/>`;
    s += L(0, 150, 600, 150, { c: "#4a87ad", w: 1.6, da: "8 5" }) + T(8, 144, "high tide", { a: "start", s: 10.5, c: "#2f6a8f", w: 600 }) + L(0, 240, 160, 240, { c: "#4a87ad", w: 1.6, da: "8 5" }) + T(8, 234, "low tide", { a: "start", s: 10.5, c: "#2f6a8f", w: 600 });
    const tree = (x, k) => { const y = mudY(x); let t = `<path d="M${x} ${y} L${x} ${y - 60 * k}" stroke="#6b5a3a" stroke-width="${5 * k}"/>`; t += `<ellipse cx="${x}" cy="${y - 78 * k}" rx="${46 * k}" ry="${30 * k}" fill="#7f9a86"/><ellipse cx="${x - 22 * k}" cy="${y - 92 * k}" rx="${26 * k}" ry="${18 * k}" fill="#8faa95"/>`; for (let i = -4; i <= 4; i++) if (i) { const rx = x + i * 12 * k, ry = mudY(rx); t += `<line x1="${rx}" y1="${ry + 1}" x2="${rx}" y2="${ry - 17 * k}" stroke="#6b5a3a" stroke-width="2"/>`; } return t; };
    s += tree(250, 1) + tree(380, 1.1) + tree(500, 0.95);
    s += `<text x="380" y="62" text-anchor="middle" font-size="12.5" font-weight="700" fill="${INK}">grey mangrove, <tspan font-style="italic">Avicennia marina</tspan></text>`;
    s += T(110, 70, "leaves excrete excess", { s: 10.5 }) + T(110, 84, "salt through salt glands", { s: 10.5 }) + L(160, 92, 226, 124, { c: GREY, w: 1.2, m: "mg" });
    const fish = (x, y) => `<path d="M${x} ${y} q 10 -7 20 0 q -10 7 -20 0 z M${x + 20} ${y} l 7 -5 l 0 10 z" fill="${NAVY}"/>`;
    s += T(110, 172, "juvenile fish shelter among", { s: 10.5, c: NAVY }) + T(110, 186, "the roots at high tide", { s: 10.5, c: NAVY }) + fish(150, 206) + fish(185, 216) + fish(120, 222);
    const crab = (x) => `<ellipse cx="${x}" cy="${mudY(x) - 4}" rx="9" ry="5" fill="${ROSE}"/>`, snail = (x) => `<circle cx="${x}" cy="${mudY(x) - 4}" r="4" fill="#6b5a3a"/>`;
    s += crab(310) + crab(440) + snail(345) + snail(365) + snail(415) + T(380, 262, "crabs and snails on the mud", { s: 10.5 });
    s += L(530, mudY(530) - 10, 590, 226, { c: GREY, w: 1.2, m: "mg" }) + T(596, 232, "aerial roots (pneumatophores)", { a: "start", s: 10.5 }) + T(596, 246, "grow up from the waterlogged", { a: "start", s: 10.5 }) + T(596, 260, "mud and let air reach the roots", { a: "start", s: 10.5 });
    s += `<path d="M640 92 l 14 -10 l 14 10" stroke="${INK}" stroke-width="2" fill="none"/><path d="M600 70 l 12 -8 l 12 8" stroke="${INK}" stroke-width="2" fill="none"/>` + T(650, 116, "birds feed and roost", { s: 10.5 });
    s += T(712, 170, "land", { s: 11, c: "#6b5a3a", w: 600 }) + T(40, 206, "sea", { s: 11, c: "#2f6a8f", w: 600 }) + T(380, 332, "schematic profile, not to scale", { s: 10, c: GREY, i: true });
    return s + "</svg>";
  };

  // Label figure for a quadrat sample used in questions
  B.biodivArt = { colours: { INK, GREY, TEAL, NAVY, AMBER, ROSE, SAGE, MINT, PAL }, T, symbol, shape, quadrat, quadratSVG, measures, alignFig, synonymousFig, treeFig, alleleFig, evennessFig, indexFlow, farmFig, threatsFig, mangroveFig, LETTERS, rng };
})(window.BIO);
