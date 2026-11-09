// Shared model and artwork for 3.1.8 Protein synthesis (3.1.8.1 the genetic code, 3.1.8.2 polypeptide synthesis,
// 3.1.8.3 protein folding). Loaded before data/content/3.1.8.*.js, data/consolidation/3.1.8.js and
// js/views/interactives-protein.js. Every drawing is schematic SVG drawn in code (no measured data).
// MODEL. The standard genetic code (NCBI translation table 1) is encoded in the usual compact form: bases in the order
// U, C, A, G for the first, second and third positions; AAS[16i + 4j + k] is the one-letter amino acid for codon
// (i, j, k) and "*" is a stop codon. It gives 64 codons: 61 coding for 20 amino acids and 3 stops (UAA, UAG, UGA);
// Leu, Ser and Arg have 6 codons each; Met (AUG) and Trp (UGG) have 1. Students are never asked to recall this table:
// every question and activity that needs it shows the table or the relevant codons. Base pairing used: DNA template
// base → mRNA base A→U, T→A, G→C, C→G; codon → anticodon A↔U, G↔C. Sequences are written with the mRNA and the DNA
// coding strand 5′→3′ left to right, and the template strand and anticodons 3′→5′ underneath, so that each base sits
// opposite its partner.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", SAGE = "#6b9a7f", NAVY = "#1e3a5f", AMBER = "#c8902a", ROSE = "#b4504f", MINT = "#d6efec", PLUM = "#8e3a6b";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.f ? ` font-family="${o.f}"` : ""}${o.st ? ` font-style="${o.st}"` : ""}>${s}</text>`;
  // Marker ids are suffixed per drawing so that copies of one diagram on a page never share an id.
  let cnt = 0, U = ""; const uid = () => (U = "-p" + (++cnt));
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${col}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 1.3}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  // ================= MODEL =================
  const BASES = "UCAG", AAS = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
  const CODE = {}; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) CODE[BASES[i] + BASES[j] + BASES[k]] = AAS[16 * i + 4 * j + k];
  const AA3 = { F: "Phe", L: "Leu", S: "Ser", Y: "Tyr", C: "Cys", W: "Trp", P: "Pro", H: "His", Q: "Gln", R: "Arg", I: "Ile", M: "Met", T: "Thr", N: "Asn", K: "Lys", V: "Val", A: "Ala", D: "Asp", E: "Glu", G: "Gly", "*": "STOP" };
  const AANAME = { Phe: "phenylalanine", Leu: "leucine", Ser: "serine", Tyr: "tyrosine", Cys: "cysteine", Trp: "tryptophan", Pro: "proline", His: "histidine", Gln: "glutamine", Arg: "arginine", Ile: "isoleucine", Met: "methionine", Thr: "threonine", Asn: "asparagine", Lys: "lysine", Val: "valine", Ala: "alanine", Asp: "aspartate", Glu: "glutamate", Gly: "glycine", STOP: "stop" };
  const up = (s) => String(s).toUpperCase().replace(/[^ACGTU]/g, "");
  const toRna = (s) => up(s).replace(/T/g, "U");
  const aa = (codon) => AA3[CODE[toRna(codon)]] || "?"; // accepts an mRNA codon or a DNA coding-strand triplet
  const templateToMrna = (t) => [...up(t)].map((b) => ({ A: "U", T: "A", G: "C", C: "G" })[b]).join("");
  const codingToMrna = (c) => toRna(c);
  const mrnaToTemplate = (m) => [...toRna(m)].map((b) => ({ A: "T", U: "A", G: "C", C: "G" })[b]).join("");
  const mrnaToCoding = (m) => toRna(m).replace(/U/g, "T");
  const dnaComplement = (d) => [...up(d)].map((b) => ({ A: "T", T: "A", G: "C", C: "G" })[b]).join("");
  const anticodon = (codon) => [...toRna(codon)].map((b) => ({ A: "U", U: "A", G: "C", C: "G" })[b]).join("");
  const codonFromAnticodon = (ac) => anticodon(ac); // complementary in both directions
  const codons = (m, frame = 0) => { const s = toRna(m), out = []; for (let i = frame; i + 3 <= s.length; i += 3) out.push(s.slice(i, i + 3)); return out; };
  const overlapping = (m) => { const s = toRna(m), out = []; for (let i = 0; i + 3 <= s.length; i++) out.push(s.slice(i, i + 3)); return out; }; // hypothetical: NOT how the code works
  // Translate in a frame; by default stop at (and not include) the first stop codon.
  const translate = (m, { frame = 0, stopAtStop = true } = {}) => { const out = []; for (const c of codons(m, frame)) { const a = aa(c); if (a === "STOP" && stopAtStop) break; out.push(a); } return out; };
  const codonsFor = (a3) => Object.keys(CODE).filter((c) => AA3[CODE[c]] === a3);
  const aminoAcids = Object.values(AA3).filter((x) => x !== "STOP").filter((x, i, a) => a.indexOf(x) === i).sort();
  const rng = (seed = Date.now() >>> 0) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // A random open reading frame: AUG, n − 2 sense codons, then a stop codon.
  const randomOrf = (n, r = rng()) => { const sense = Object.keys(CODE).filter((c) => CODE[c] !== "*" && c !== "AUG"), stops = ["UAA", "UAG", "UGA"]; const cs = ["AUG"]; for (let i = 0; i < n - 2; i++) cs.push(sense[Math.floor(r() * sense.length)]); cs.push(stops[Math.floor(r() * 3)]); return cs.join(""); };
  B.proteinModel = { CODE, AA3, AANAME, BASES, aa, toRna, templateToMrna, codingToMrna, mrnaToTemplate, mrnaToCoding, dnaComplement, anticodon, codonFromAnticodon, codons, overlapping, translate, codonsFor, aminoAcids, rng, randomOrf };

  // ================= HTML helpers: the code table supplied to students =================
  // Full table (first base = row, second base = column, third base within each cell), as in examination papers.
  const codeTableHTML = ({ highlight = [], caption = "The genetic code (mRNA codons). Provided: you do not need to learn it." } = {}) => {
    const hi = new Set(highlight.map(toRna)); const cell = (c) => { const a = aa(c); const on = hi.has(c); return `<div data-codon="${c}" style="white-space:nowrap;padding:1px 3px;border-radius:4px;${on ? "background:#fbe3b0;font-weight:700;outline:2px solid #c8902a;" : ""}${a === "STOP" ? "color:#b4504f;" : ""}"><span style="font-family:${MONO}">${c}</span> ${a === "STOP" ? "stop" : a}</div>`; };
    let s = `<div class="ps-code" style="overflow-x:auto;max-width:100%"><table class="tbl" style="font-size:.74rem;width:auto;margin:0" aria-label="genetic code table"><caption class="tiny muted" style="caption-side:top;text-align:left">${caption}</caption><thead><tr><th scope="col">1st base</th>${[..."UCAG"].map((b) => `<th scope="col">2nd: ${b}</th>`).join("")}<th scope="col">3rd</th></tr></thead><tbody>`;
    for (const b1 of "UCAG") { s += `<tr><th scope="row" style="font-size:1rem">${b1}</th>`; for (const b2 of "UCAG") s += `<td style="padding:2px 4px">${[..."UCAG"].map((b3) => cell(b1 + b2 + b3)).join("")}</td>`; s += `<td style="font-family:${MONO};color:#6b7d8f;padding:2px 4px">${[..."UCAG"].map((b) => `<div style="padding:1px 0">${b}</div>`).join("")}</td></tr>`; }
    return s + `</tbody></table></div>`;
  };
  // A short excerpt of the code for a question stem: only the codons given (as mRNA codons). No newlines (stems turn \n into <br>).
  const codonList = (list, { head = "mRNA codon" } = {}) => `<div style="overflow-x:auto;max-width:100%"><table class="tbl" style="width:auto;font-size:.85rem;margin:.4rem 0"><tbody><tr><th scope="row">${head}</th>${list.map((c) => `<td style="font-family:${MONO}">${toRna(c)}</td>`).join("")}</tr><tr><th scope="row">Amino acid</th>${list.map((c) => `<td>${aa(c) === "STOP" ? "stop" : aa(c)}</td>`).join("")}</tr></tbody></table></div>`;

  // ================= SVG primitives =================
  const FILL = { A: "#fbe3b0", T: "#f6cfcf", U: "#ead3f0", G: "#cdeee9", C: "#d5e1f2" }, EDGE = { A: AMBER, T: ROSE, U: PLUM, G: TEAL, C: NAVY };
  const box = (x, y, b, { w = 22, h = 22, fs = 12, op = 1, dash = false } = {}) => `<g opacity="${op}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${FILL[b] || "#fff"}" stroke="${EDGE[b] || GREY}" stroke-width="1.2"${dash ? ' stroke-dasharray="3 2"' : ""}/>${T(x + w / 2, y + h / 2 + fs * 0.36, b, { s: fs, w: 700, f: MONO })}</g>`;
  const row = (x0, y, seq, o = {}) => { const w = o.w || 22, g = o.gap ?? 2; return [...seq].map((b, i) => box(x0 + i * (w + g), y, b, o)).join(""); };
  const svgOpen = (w, h, label, extra = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" style="max-width:100%;height:auto" role="img" aria-label="${label}">${extra}`;
  const numBadge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="10" fill="#fff" stroke="${INK}" stroke-width="1.6"/>${T(x, y + 4, n, { s: 11, w: 700 })}`;

  // ================= 1. Base triplets → amino acids (3.1.8.1, 3.1.8.3) =================
  // coding: DNA coding strand 5′→3′ (multiple of 3).
  const tripletCode = ({ coding = "ATGTTCGGACATTGGTAA", title = true } = {}) => {
    uid(); const n = coding.length, w = 26, g = 2, x0 = 190, mr = codingToMrna(coding), tp = dnaComplement(coding), cs = codons(mr);
    const xe = x0 + n * (w + g) - g; const W = Math.max(760, xe + 60);
    let s = svgOpen(W, 330, "a DNA coding strand and template strand, the mRNA transcribed from the template, the mRNA divided into codons, and the amino acid each codon codes for", `<defs>${marker("tc-a", GREY)}</defs>`);
    const lab = (y, t, sub) => T(x0 - 12, y + 15, t, { a: "end", s: 12, w: 700 }) + (sub ? T(x0 - 12, y + 28, sub, { a: "end", s: 9.5, c: GREY }) : "");
    s += lab(20, "DNA coding strand", "(not transcribed)") + row(x0, 20, coding, { w }) + T(x0 - 2, 14, "5′", { s: 9, c: GREY, a: "end" }) + T(xe + 4, 14, "3′", { s: 9, c: GREY, a: "start" });
    for (let i = 0; i < n; i++) s += L(x0 + i * (w + g) + w / 2, 43, x0 + i * (w + g) + w / 2, 49, { c: "#9fb0bf", w: 1 });
    s += lab(50, "DNA template strand") + row(x0, 50, tp, { w }) + T(x0 - 2, 84, "3′", { s: 9, c: GREY, a: "end" }) + T(xe + 4, 84, "5′", { s: 9, c: GREY, a: "start" });
    s += L(x0 + 40, 80, x0 + 40, 112, { m: "tc-a", w: 1.6 }) + T(x0 + 50, 101, "transcription: mRNA is complementary to the template strand", { a: "start", s: 10.5, c: GREY });
    s += lab(120, "mRNA") + row(x0, 120, mr, { w }) + T(x0 - 2, 114, "5′", { s: 9, c: GREY, a: "end" }) + T(xe + 4, 114, "3′", { s: 9, c: GREY, a: "start" });
    cs.forEach((c, i) => { const xa = x0 + 3 * i * (w + g), xb = xa + 3 * (w + g) - g, xm = (xa + xb) / 2; s += `<path d="M${xa} 148 v6 H${xb} v-6" fill="none" stroke="${NAVY}" stroke-width="1.6"/>` + T(xm, 168, "codon " + (i + 1), { s: 9.5, c: NAVY }); const a = aa(c); s += L(xm, 172, xm, 192, { m: "tc-a" }); s += a === "STOP" ? `<rect x="${xm - 26}" y="196" width="52" height="26" rx="6" fill="#fff" stroke="${ROSE}" stroke-width="1.6"/>` + T(xm, 213, "stop", { s: 11, w: 700, c: ROSE }) : `<circle cx="${xm}" cy="209" r="17" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(xm, 213, a, { s: 11, w: 700 }); if (i < cs.length - 1 && aa(cs[i + 1]) !== "STOP") s += L(xm + 17, 209, xm + 3 * (w + g) - 17, 209, { c: INK, w: 2 }); });
    s += lab(195, "amino acids", "(from the table provided)") + lab(150, "triplets") ;
    if (title) { s += T(40, 252, "Each base triplet (on mRNA, a codon) codes for one amino acid. Codons are read in sequence, from a fixed starting point, without overlapping.", { a: "start", s: 10.5, c: INK }); s += T(40, 268, "The mRNA has the same sequence as the coding strand, with uracil (U) in place of thymine (T).", { a: "start", s: 10.5, c: INK }); s += T(40, 284, "A stop codon codes for no amino acid: translation ends there.", { a: "start", s: 10.5, c: INK }); s += T(40, 312, "Strand ends (5′, 3′) are shown for completeness; the examined idea is complementary base pairing and reading in triplets.", { a: "start", s: 9.5, c: GREY }); }
    return s + "</svg>";
  };

  // ================= 2. Properties of the code (3.1.8.1) =================
  const codeProperties = () => {
    uid(); const w = 24, g = 2; let s = svgOpen(760, 470, "three panels: the code is non-overlapping (nine bases give three codons, each base in one codon, compared with a hypothetical overlapping code giving seven triplets); degenerate (four codons all code for glycine); universal (the same codon codes for the same amino acid in a bacterium, a plant and a human)", `<defs>${marker("cp-a", GREY)}</defs>`);
    const seq = "AUGGCUAAA";
    // Panel A
    s += `<rect x="8" y="8" width="744" height="170" rx="12" fill="#f7fbfb" stroke="#cfe3e0"/>` + T(22, 30, "Non-overlapping", { a: "start", s: 14, w: 700, c: TEAL }) + T(160, 30, "each base belongs to only one triplet", { a: "start", s: 11, c: GREY });
    const xa = 40; s += T(xa, 54, "How the code is read", { a: "start", s: 11, w: 700 }) + row(xa, 62, seq, { w }); [0, 1, 2].forEach((i) => { const x1 = xa + 3 * i * (w + g), x2 = x1 + 3 * (w + g) - g, xm = (x1 + x2) / 2; s += `<path d="M${x1} 90 v6 H${x2} v-6" fill="none" stroke="${NAVY}" stroke-width="1.6"/>` + T(xm, 112, aa(seq.slice(3 * i, 3 * i + 3)), { s: 11, w: 700, c: NAVY }); }); s += T(xa, 136, "9 bases → 3 codons → 3 amino acids", { a: "start", s: 11 }) + T(xa, 152, "changing one base can change at most one codon", { a: "start", s: 10.5, c: GREY });
    const xb = 420; s += T(xb, 54, "If the code overlapped (it does not)", { a: "start", s: 11, w: 700, c: ROSE }) + row(xb, 62, seq, { w, op: 0.85 }); for (let i = 0; i < 7; i++) { const x1 = xb + i * (w + g) + 2, x2 = x1 + 3 * (w + g) - g - 4, y = 92 + i * 6; s += `<path d="M${x1} ${y - 4} v4 H${x2} v-4" fill="none" stroke="${ROSE}" stroke-width="1.2" stroke-dasharray="3 2"/>`; } s += T(xb, 152, "9 bases → 7 overlapping triplets; one base in up to 3 triplets", { a: "start", s: 10.5, c: GREY }) + T(xb, 168, "(a hypothetical code, shown only for comparison)", { a: "start", s: 9.5, c: GREY, st: "italic" });
    // Panel B
    s += `<rect x="8" y="188" width="744" height="140" rx="12" fill="#fbf7ee" stroke="#ecdcb5"/>` + T(22, 210, "Degenerate", { a: "start", s: 14, w: 700, c: AMBER }) + T(120, 210, "most amino acids are coded for by more than one triplet", { a: "start", s: 11, c: GREY });
    ["GGU", "GGC", "GGA", "GGG"].forEach((c, i) => { s += row(40, 224 + i * 25, c, { w: 20, h: 20, fs: 11 }) + L(108, 234 + i * 25, 182, 270, { c: GREY, m: "cp-a" }); }); s += `<circle cx="205" cy="272" r="20" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(205, 276, "Gly", { s: 12, w: 700 });
    s += row(330, 236, "AUG", { w: 20, h: 20, fs: 11 }) + L(398, 246, 446, 246, { m: "cp-a" }) + `<circle cx="468" cy="246" r="18" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(468, 250, "Met", { s: 11, w: 700 }) + row(330, 278, "UGG", { w: 20, h: 20, fs: 11 }) + L(398, 288, 446, 288, { m: "cp-a" }) + `<circle cx="468" cy="288" r="18" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(468, 292, "Trp", { s: 11, w: 700 });
    s += T(505, 240, "64 possible triplets (4 × 4 × 4)", { a: "start", s: 11 }) + T(505, 256, "but only 20 amino acids, so most", { a: "start", s: 11 }) + T(505, 272, "have 2, 3, 4 or 6 codons; a few", { a: "start", s: 11 }) + T(505, 288, "(here Met and Trp) have only one.", { a: "start", s: 11 }) + T(505, 310, "Values from the table provided.", { a: "start", s: 9.5, c: GREY });
    // Panel C
    s += `<rect x="8" y="338" width="744" height="124" rx="12" fill="#f3f6fb" stroke="#d3deee"/>` + T(22, 360, "Universal", { a: "start", s: 14, w: 700, c: NAVY }) + T(105, 360, "the same triplet codes for the same amino acid in (almost) all organisms", { a: "start", s: 11, c: GREY });
    const org = (x, name, shape) => shape + T(x, 450, name, { s: 11, w: 600 });
    s += row(60, 396, "UGG", { w: 22 }) + L(136, 407, 196, 407, { m: "cp-a" }) + T(166, 398, "codes for", { s: 9.5, c: GREY }) + `<circle cx="220" cy="407" r="18" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(220, 411, "Trp", { s: 11, w: 700 }) + T(250, 411, "in:", { a: "start", s: 11 });
    s += org(330, "bacterium", `<rect x="300" y="390" width="60" height="30" rx="15" fill="#e2efe6" stroke="${SAGE}" stroke-width="1.5"/>`);
    s += org(450, "plant", `<path d="M450 425 v-30 M450 405 c-14 -4 -20 -14 -18 -22 c12 2 18 10 18 22 M450 400 c12 -4 18 -12 18 -20 c-12 0 -18 8 -18 20" fill="#e2efe6" stroke="${SAGE}" stroke-width="1.5"/>`);
    s += org(570, "human", `<circle cx="570" cy="392" r="8" fill="#f6e6dc" stroke="#9c7b3a" stroke-width="1.5"/><path d="M570 400 v18 M558 408 h24 M570 418 l-8 12 M570 418 l8 12" stroke="#9c7b3a" stroke-width="1.8" fill="none"/>`);
    s += T(650, 400, "so a human gene", { a: "start", s: 9.5, c: GREY }) + T(650, 413, "expressed in bacteria", { a: "start", s: 9.5, c: GREY }) + T(650, 426, "gives the same", { a: "start", s: 9.5, c: GREY }) + T(650, 439, "polypeptide", { a: "start", s: 9.5, c: GREY });
    return s + "</svg>";
  };

  // ================= 3. Transcription scene (3.1.8.2; also used by the stepper) =================
  // coding: DNA coding strand 5′→3′. k: number of RNA nucleotides joined so far. phase: intact | open | run | done.
  // introns: [[start, end), ...] positions in the coding strand. numbered: label positions replaced with numbers.
  const transcriptionScene = ({ coding = "ATGTTCGGACATTGGTAA", k = 11, phase = "run", introns = [], labels = true, euk = false, free = true, predict = false } = {}) => {
    uid(); const n = coding.length, avail = 540, w = Math.min(26, Math.floor(avail / n) - 2), g = 2, step = w + g, x0 = 150, xe = x0 + n * step - g, fs = w < 22 ? 10 : 12;
    const tp = dnaComplement(coding), mr = codingToMrna(coding); const X = (i) => x0 + i * step;
    let s = svgOpen(760, 320, `transcription: the two DNA strands of a gene, the template strand being copied into ${euk ? "pre-mRNA" : "mRNA"} by RNA polymerase`, `<defs>${marker("tr-a", TEAL)}</defs>`);
    const inIntron = (i) => introns.some(([a, b]) => i >= a && i < b);
    const band = (y, h) => introns.map(([a, b]) => `<rect x="${X(a) - 1}" y="${y}" width="${(b - a) * step}" height="${h}" fill="none" stroke="#55606b" stroke-width="1.6" stroke-dasharray="4 3"/>`).join("");
    const helix = (xa, xb, ya, yb) => { let d = ""; for (let x = xa; x < xb; x += 4) { const t = (x - xa) / 36 * Math.PI; d += (x === xa ? "M" : "L") + x + " " + ((ya + yb) / 2 + Math.sin(t) * (yb - ya) / 2).toFixed(1) + " "; } let d2 = ""; for (let x = xa; x < xb; x += 4) { const t = (x - xa) / 36 * Math.PI; d2 += (x === xa ? "M" : "L") + x + " " + ((ya + yb) / 2 - Math.sin(t) * (yb - ya) / 2).toFixed(1) + " "; } return `<path d="${d}" fill="none" stroke="${NAVY}" stroke-width="2"/><path d="${d2}" fill="none" stroke="${ROSE}" stroke-width="2"/>`; };
    if (phase === "intact" || phase === "done") {
      const yc = phase === "done" ? 196 : 120, yt = yc + 26;
      s += row(x0, yc, coding, { w, fs }) + row(x0, yt, tp, { w, fs }) + band(yc - 4, 56); for (let i = 0; i < n; i++) s += L(X(i) + w / 2, yc + 22, X(i) + w / 2, yt, { c: "#9fb0bf", w: 1, d: "2 1" });
      s += helix(40, x0 - 6, yc + 2, yt + 20) + (744 - xe > 40 ? helix(xe + 6, 744, yc + 2, yt + 20) : "");
      if (labels) s += T(x0, yc - 12, "coding strand 5′ → 3′", { a: "start", s: 10.5, c: NAVY }) + T(x0, yt + 38, "template strand 3′ → 5′", { a: "start", s: 10.5, c: ROSE }) + (introns.length ? T(X(introns[0][0]) + (introns[0][1] - introns[0][0]) * step / 2, yc - 12, "intron", { s: 10.5, c: GREY, w: 700 }) : "");
      if (phase === "intact" && labels) s += T(380, 34, "The gene: two strands held together by hydrogen bonds between complementary bases (dotted).", { s: 11, c: GREY }) + T(380, 230, "Introns (if any) are part of the DNA of the gene and stay in the DNA.", { s: 10.5, c: GREY });
      if (phase === "done") { s += row(x0, 64, mr, { w, fs }) + L(x0, 62, xe, 62, { c: PLUM, w: 2 }); if (labels) s += T(x0 - 8, 80, euk ? "pre-mRNA" : "mRNA", { a: "end", s: 12, w: 700, c: PLUM }) + T(380, 112, euk ? "Pre-mRNA released: a copy of the whole gene, introns included. It is spliced next." : "mRNA released: ready for translation (in prokaryotes, ribosomes can attach at once).", { s: 11, c: INK }) + T(380, 128, "The DNA strands re-pair; RNA polymerase detaches at the end of the gene.", { s: 10.5, c: GREY }) + band(60, 30); }
      return s + "</svg>";
    }
    // open / run: strands separated
    const yc = 52, ym = 196, yt = 222;
    s += row(x0, yc, coding, { w, fs }) + row(x0, yt, tp, { w, fs }) + introns.map(([a, b]) => [yc - 4, yt - 4].map((y) => `<rect x="${X(a) - 2}" y="${y}" width="${(b - a) * step + 2}" height="30" rx="4" fill="none" stroke="#55606b" stroke-width="1.6" stroke-dasharray="4 3"/>`).join("")).join("");
    s += L(x0 - 4, yc - 3, xe + 4, yc - 3, { c: NAVY, w: 2 }) + L(x0 - 4, yt + 25, xe + 4, yt + 25, { c: ROSE, w: 2 });
    s += `<path d="M${x0 - 4} ${yc - 3} C ${x0 - 40} ${yc - 3}, ${x0 - 40} 132, ${x0 - 70} 132 L 40 132" fill="none" stroke="${NAVY}" stroke-width="2"/><path d="M${x0 - 4} ${yt + 25} C ${x0 - 40} ${yt + 25}, ${x0 - 40} 150, ${x0 - 70} 150 L 40 150" fill="none" stroke="${ROSE}" stroke-width="2"/>`;
    s += `<path d="M${xe + 4} ${yc - 3} C ${xe + 40} ${yc - 3}, ${xe + 40} 132, ${xe + 70} 132 L 744 132" fill="none" stroke="${NAVY}" stroke-width="2"/><path d="M${xe + 4} ${yt + 25} C ${xe + 40} ${yt + 25}, ${xe + 40} 150, ${xe + 70} 150 L 744 150" fill="none" stroke="${ROSE}" stroke-width="2"/>`;
    for (let x = 48; x < x0 - 74; x += 10) s += L(x, 134, x, 148, { c: "#9fb0bf", w: 1 }); for (let x = xe + 76; x < 744; x += 10) s += L(x, 134, x, 148, { c: "#9fb0bf", w: 1 });
    if (phase === "run" && k > 0) { s += row(x0, ym, mr.slice(0, k), { w, fs }) + L(x0, ym - 3, X(k - 1) + w, ym - 3, { c: PLUM, w: 2 }); for (let i = 0; i < k; i++) s += L(X(i) + w / 2, ym + 22, X(i) + w / 2, yt, { c: "#9fb0bf", w: 1, d: "2 1" }); }
    if (phase === "run") { const a = Math.max(0, k - 3), b = Math.min(n, k + 2); s += `<rect x="${X(a) - 6}" y="${ym - 30}" width="${(b - a) * step + 10}" height="${yt - ym + 62}" rx="16" fill="${TEAL}" fill-opacity=".14" stroke="${TEAL}" stroke-width="2"/>`; if (labels) s += T(X(a) - 6 + ((b - a) * step + 10) / 2, ym - 36, "RNA polymerase", { s: 11, w: 700, c: TEAL }); if (k < n && predict) s += `<rect x="${X(k) - 1}" y="${ym - 1}" width="${w + 2}" height="24" rx="3" fill="#fff" stroke="${AMBER}" stroke-width="2" stroke-dasharray="3 2"/>` + T(X(k) + w / 2, ym + 16, "?", { s: 13, w: 700, c: AMBER }); }
    if (free && phase === "run" && k < n) { const fx = Math.min(X(Math.min(n - 1, k + 1)) + 20, 640); ["A", "U", "G", "C", "U"].forEach((b, i) => { const x = fx + (i % 3) * 32, y = 98 + Math.floor(i / 3) * 34 + (i % 2) * 6; s += `<circle cx="${x - 4}" cy="${y + 11}" r="4" fill="#fff" stroke="${GREY}"/>` + box(x, y, b, { w: 20, h: 20, fs: 11 }); }); if (labels) s += T(Math.min(fx + 40, 690), 92, "free RNA nucleotides", { s: 10, c: GREY }); }
    if (labels) {
      s += T(x0, yc - 12, "5′   DNA coding strand (not transcribed)", { a: "start", s: 10.5, w: 700, c: NAVY }) + T(xe, yc - 12, "3′", { a: "end", s: 10.5, w: 700, c: NAVY }) + T(x0, yt + 42, "3′   DNA template strand", { a: "start", s: 10.5, w: 700, c: ROSE }) + T(xe, yt + 42, "5′", { a: "end", s: 10.5, w: 700, c: ROSE });
      if (phase === "run" && k > 0) s += T(x0, ym - 10, (euk ? "pre-mRNA" : "mRNA") + " 5′ →", { a: "start", s: 10.5, w: 700, c: PLUM });
      s += T(380, 98 + (phase === "open" ? 0 : 0), phase === "open" ? "Hydrogen bonds between the DNA strands break; the gene unwinds and its bases are exposed." : "", { s: 11, c: INK });
      s += L(x0 + 40, 290, x0 + 200, 290, { c: TEAL, w: 2, m: "tr-a" }) + T(x0 + 210, 294, "RNA polymerase moves along the template strand, joining RNA nucleotides", { a: "start", s: 10.5, c: TEAL });
      if (introns.length) s += T(X(introns[0][0]) + (introns[0][1] - introns[0][0]) * step / 2, 312, "dashed box: intron (copied into the pre-mRNA too)", { s: 10, c: GREY });
    }
    return s + "</svg>";
  };

  // ================= 4. Splicing (3.1.8.2) =================
  const splicing = () => {
    uid(); let s = svgOpen(760, 360, "eukaryote: a gene of exons and introns is transcribed to pre-mRNA containing both, then spliced so that introns are removed and exons joined to form mRNA; prokaryote: a gene without introns is transcribed directly to mRNA", `<defs>${marker("sp-a", GREY)}</defs>`);
    const seg = (x, y, w, kind, t) => kind === "exon" ? `<rect x="${x}" y="${y}" width="${w}" height="26" rx="4" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(x + w / 2, y + 17, t, { s: 10.5, w: 700, c: TEAL }) : `<rect x="${x}" y="${y + 6}" width="${w}" height="14" rx="3" fill="#e6e8ec" stroke="#8d99a6" stroke-width="1.2"/>` + T(x + w / 2, y + 17, t, { s: 9, c: "#55606b" });
    const gene = (x, y, kinds) => { let xx = x, out = ""; kinds.forEach(([k, w, t]) => { out += seg(xx, y, w, k, t); xx += w; }); return out; };
    const parts = [["exon", 70, "exon 1"], ["intron", 80, "intron"], ["exon", 70, "exon 2"], ["intron", 60, "intron"], ["exon", 70, "exon 3"]];
    s += T(220, 22, "Eukaryotic cell (in the nucleus)", { s: 13, w: 700, c: NAVY }) + T(620, 22, "Prokaryotic cell", { s: 13, w: 700, c: SAGE });
    s += L(470, 12, 470, 348, { c: "#d3dbe3", w: 1.5, d: "5 4" });
    s += T(30, 58, "gene (DNA)", { a: "start", s: 10.5, w: 700 }) + gene(100, 40, parts) + T(100, 82, "introns are non-coding sections of the gene; they stay in the DNA", { a: "start", s: 9.5, c: GREY });
    s += L(275, 90, 275, 118, { m: "sp-a", w: 1.6 }) + T(285, 108, "transcription (RNA polymerase)", { a: "start", s: 10, c: GREY });
    s += T(30, 142, "pre-mRNA", { a: "start", s: 10.5, w: 700, c: PLUM }) + gene(100, 124, parts) + T(100, 166, "a complementary copy of the whole gene: exons and introns", { a: "start", s: 9.5, c: GREY });
    s += L(275, 176, 275, 222, { m: "sp-a", w: 1.6 }) + T(285, 196, "splicing: introns removed,", { a: "start", s: 10, c: GREY }) + T(285, 209, "exons joined together", { a: "start", s: 10, c: GREY });
    s += `<rect x="120" y="184" width="64" height="12" rx="3" fill="#e6e8ec" stroke="#8d99a6" transform="rotate(-6 152 190)"/><rect x="128" y="204" width="50" height="12" rx="3" fill="#e6e8ec" stroke="#8d99a6" transform="rotate(5 153 210)"/>` + T(118, 232, "introns cut out", { a: "start", s: 9.5, c: GREY });
    s += T(30, 252, "mRNA", { a: "start", s: 10.5, w: 700, c: PLUM }) + gene(170, 234, [["exon", 70, "exon 1"], ["exon", 70, "exon 2"], ["exon", 70, "exon 3"]]);
    s += T(100, 282, "shorter than the pre-mRNA; carries only the coding sequence", { a: "start", s: 9.5, c: GREY }) + L(275, 290, 275, 318, { m: "sp-a", w: 1.6 }) + T(265, 308, "leaves through a nuclear pore", { a: "end", s: 10, c: GREY }) + T(220, 340, "translated at a ribosome in the cytoplasm", { s: 10.5, w: 600 });
    s += T(500, 58, "gene (DNA)", { a: "start", s: 10.5, w: 700 }) + gene(580, 40, [["exon", 150, "coding sequence"]]) + T(500, 82, "no introns", { a: "start", s: 9.5, c: GREY });
    s += L(655, 90, 655, 222, { m: "sp-a", w: 1.6 }) + T(665, 140, "transcription", { a: "start", s: 10, c: GREY }) + T(665, 153, "gives mRNA", { a: "start", s: 10, c: GREY }) + T(665, 166, "directly:", { a: "start", s: 10, c: GREY }) + T(665, 179, "no splicing", { a: "start", s: 10, c: GREY });
    s += T(500, 252, "mRNA", { a: "start", s: 10.5, w: 700, c: PLUM }) + gene(580, 234, [["exon", 150, "coding sequence"]]) + T(655, 282, "no nucleus: ribosomes can", { s: 9.5, c: GREY }) + T(655, 295, "start translating at once", { s: 9.5, c: GREY }) + T(655, 340, "Schematic; not to scale.", { s: 9.5, c: GREY });
    return s + "</svg>";
  };

  // ================= 5. tRNA (3.1.8.2) =================
  const trnaShape = (cx, top, { anti = "UAC", aa3 = "Met", scale = 1, labels = true } = {}) => {
    const stem = (x1, y1, x2, y2, nRungs) => { let o = ""; const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, px = -uy * 6, py = ux * 6; o += L(x1 + px, y1 + py, x2 + px, y2 + py, { c: PLUM, w: 2.2 }) + L(x1 - px, y1 - py, x2 - px, y2 - py, { c: PLUM, w: 2.2 }); for (let i = 1; i < nRungs; i++) { const t = i / nRungs; o += L(x1 + px + dx * t, y1 + py + dy * t, x1 - px + dx * t, y1 - py + dy * t, { c: "#c7a6bf", w: 1.2 }); } return o; };
    const cy = top + 120; let o = "";
    o += stem(cx, top + 30, cx, cy - 12, 6) + stem(cx - 12, cy, cx - 62, cy, 4) + stem(cx + 12, cy, cx + 62, cy, 4) + stem(cx, cy + 12, cx, cy + 62, 4);
    o += `<circle cx="${cx - 80}" cy="${cy}" r="18" fill="none" stroke="${PLUM}" stroke-width="2.2"/><circle cx="${cx + 80}" cy="${cy}" r="18" fill="none" stroke="${PLUM}" stroke-width="2.2"/><circle cx="${cx}" cy="${cy + 6}" r="13" fill="#fff" stroke="${PLUM}" stroke-width="2"/>`;
    o += `<path d="M${cx - 6} ${cy + 62} C ${cx - 40} ${cy + 70}, ${cx - 44} ${cy + 104}, ${cx - 30} ${cy + 110} M${cx + 6} ${cy + 62} C ${cx + 40} ${cy + 70}, ${cx + 44} ${cy + 104}, ${cx + 30} ${cy + 110}" fill="none" stroke="${PLUM}" stroke-width="2.2"/>`;
    o += row(cx - 37, cy + 106, anti, { w: 22, h: 22, fs: 12 });
    o += `<path d="M${cx + 6} ${top + 30} V ${top + 10}" stroke="${PLUM}" stroke-width="2.2"/><path d="M${cx - 6} ${top + 30} V ${top + 22}" stroke="${PLUM}" stroke-width="2.2"/>`;
    if (aa3) o += L(cx + 6, top + 10, cx + 6, top - 4, { c: INK, w: 2 }) + `<circle cx="${cx + 6}" cy="${top - 22}" r="18" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(cx + 6, top - 18, aa3, { s: 11, w: 700 });
    return o;
  };
  const trna = () => {
    uid(); let s = svgOpen(760, 360, "a transfer RNA molecule folded into a clover-leaf shape, with an amino-acid binding site at one end and an anticodon of three bases in a loop at the other, pairing with a complementary codon on mRNA", `<defs>${marker("tn-a", GREY)}</defs>`);
    s += trnaShape(200, 60, { anti: "UAC", aa3: "Met" });
    s += row(163, 312, "AUG", { w: 22, h: 22, fs: 12 }) + L(150, 336, 250, 336, { c: PLUM, w: 2 }) + T(140, 328, "mRNA", { a: "end", s: 11, w: 700, c: PLUM }) + T(262, 328, "codon AUG", { a: "start", s: 10.5, c: PLUM });
    for (let i = 0; i < 3; i++) s += L(174 + i * 24, 308, 174 + i * 24, 312, { c: INK, w: 1.4 });
    const lab = (x1, y1, x2, y2, t, t2) => L(x1, y1, x2, y2) + T(x2 + 6, y2 + 4, t, { a: "start", s: 11, w: 700 }) + (t2 ? T(x2 + 6, y2 + 18, t2, { a: "start", s: 10, c: GREY }) : "");
    s += lab(226, 38, 380, 38, "amino-acid binding site", "a specific amino acid attaches here (energy from ATP)");
    s += lab(206, 120, 380, 100, "single strand of RNA", "about 80 nucleotides, folded back on itself");
    s += lab(250, 180, 380, 162, "hydrogen bonds between paired bases", "hold the clover-leaf shape");
    s += lab(232, 296, 380, 244, "anticodon", "three bases complementary to one codon on mRNA");
    s += lab(240, 322, 380, 300, "complementary base pairing", "codon AUG pairs with anticodon UAC (A–U, U–A, G–C)");
    s += T(380, 348, "Each type of tRNA carries one specific amino acid, matching its anticodon. Schematic: real tRNA is folded further into an L shape.", { s: 9.5, c: GREY });
    return s + "</svg>";
  };

  // ================= 6. Translation scene (3.1.8.2; also used by the animation) =================
  // state: { codons: [...], p: first codon under the ribosome (null = no ribosome), trnas: [{ i, aas: [...] , arriving, leaving }],
  //          bond: highlight newest peptide bond, released: [aas] released chain, labels: false | "text" | "numbers" }
  const CW = 84;
  const translationScene = ({ codons: cs = ["AUG", "UUC", "GGA", "CAU", "UGG", "UAA"], p = 0, trnas = [], bond = false, released = null, labels = false, x0 = null, anim = false, width = 760 } = {}) => {
    uid(); const X0 = x0 ?? Math.max(20, Math.round((width - cs.length * CW) / 2)), cxOf = (i) => X0 + i * CW + 38, my = 290;
    let s = svgOpen(width, 372, "translation: a ribosome on mRNA holding two tRNA molecules whose anticodons pair with adjacent codons; the amino acids they carry are joined by peptide bonds into a growing polypeptide", anim ? `<style>.ps-arrive${U}{animation:psArrive${U} .7s ease-out both}.ps-leave${U}{animation:psLeave${U} .7s ease-in both}@keyframes psArrive${U}{from{transform:translateY(-70px);opacity:0}to{transform:none;opacity:1}}@keyframes psLeave${U}{from{transform:translate(70px,70px);opacity:1}to{transform:none;opacity:.55}}</style>` : "");
    s += `<defs>${marker("tl-a", GREY)}${marker("tl-m", TEAL)}</defs>`;
    // ribosome (behind)
    if (p != null) { const c = cxOf(p) + CW / 2; s += `<g data-part="ribosome"><ellipse cx="${c}" cy="198" rx="112" ry="86" fill="#e9eef8" fill-opacity=".85" stroke="${NAVY}" stroke-width="1.8"/><ellipse cx="${c}" cy="322" rx="110" ry="26" fill="#e9eef8" stroke="${NAVY}" stroke-width="1.8"/></g>`; }
    // mRNA
    s += L(X0 - 14, my + 24, X0 + cs.length * CW, my + 24, { c: PLUM, w: 2.4 }); cs.forEach((c, i) => { s += row(X0 + i * CW, my, c, { w: 24, h: 22, fs: 12 }); });
    if (labels !== "numbers") s += T(X0 - 10, my - 6, "5′", { s: 9, c: GREY }) + T(X0 + cs.length * CW - 2, my - 6, "3′", { s: 9, c: GREY });
    // tRNAs and chain
    const drawT = (t) => { const cx = cxOf(t.i), off = t.leaving ? "translate(-58 -96)" : ""; const cls = anim && t.arriving ? `ps-arrive${U}` : anim && t.leaving ? `ps-leave${U}` : ""; let o = `<g ${off ? `transform="${off}"` : ""}><g class="${cls}" ${t.leaving ? 'opacity=".55"' : ""}>`;
      o += `<rect x="${cx - 30}" y="196" width="60" height="58" rx="14" fill="#f5e9f2" stroke="${PLUM}" stroke-width="1.8"/><circle cx="${cx - 30}" cy="220" r="9" fill="#f5e9f2" stroke="${PLUM}" stroke-width="1.6"/><circle cx="${cx + 30}" cy="220" r="9" fill="#f5e9f2" stroke="${PLUM}" stroke-width="1.6"/><rect x="${cx - 5}" y="184" width="10" height="12" fill="#f5e9f2" stroke="${PLUM}" stroke-width="1.4"/>` + T(cx, 230, "tRNA", { s: 10, c: PLUM, w: 700 });
      o += row(cx - 38, 260, anticodon(cs[t.i]), { w: 24, h: 22, fs: 12 }) + [0, 1, 2].map((j) => L(cx - 26 + j * 26, 282, cx - 26 + j * 26, my, { c: INK, w: 1.2 })).join("");
      const aas = t.aas || []; const pos = (k) => [cx - 30 * k, 166 - 32 * k];
      for (let k = aas.length - 1; k >= 0; k--) { const [x, y] = pos(aas.length - 1 - k); if (k < aas.length - 1) { const [x2, y2] = pos(aas.length - 2 - k); o += L(x + 10, y + 11, x2 - 10, y2 - 11, { c: bond && k === aas.length - 2 ? AMBER : INK, w: bond && k === aas.length - 2 ? 4.5 : 3 }); } }
      if (aas.length) o += L(cx, 182, cx, 184, { c: INK, w: 2 });
      aas.forEach((a, k) => { const [x, y] = pos(aas.length - 1 - k); o += `<circle cx="${x}" cy="${y}" r="16" fill="${MINT}" stroke="${TEAL}" stroke-width="1.6"/>` + T(x, y + 4, a, { s: 10.5, w: 700 }); });
      return o + "</g></g>"; };
    trnas.filter((t) => t.leaving).forEach((t) => (s += drawT(t))); trnas.filter((t) => !t.leaving).forEach((t) => (s += drawT(t)));
    if (released) { let x = width - 40 - released.length * 30, y = 40; s += T(x - 22, y + 4, "released polypeptide", { a: "end", s: 10.5, c: GREY }); released.forEach((a, k) => { if (k) s += L(x + (k - 1) * 30 + 13, y, x + k * 30 - 13, y, { c: INK, w: 2.2 }); s += `<circle cx="${x + k * 30}" cy="${y}" r="13" fill="${MINT}" stroke="${TEAL}" stroke-width="1.4"/>` + T(x + k * 30, y + 4, a, { s: 9, w: 700 }); }); }
    if (labels === "text" || labels === "numbers") {
      const N = labels === "numbers"; let n = 0; const lab = (x1, y1, x2, y2, t, t2) => { n++; return L(x1, y1, x2, y2) + (N ? numBadge(x2 + 10, y2, n) : T(x2 + 6, y2 + 4, t, { a: "start", s: 11, w: 700 }) + (t2 ? T(x2 + 6, y2 + 18, t2, { a: "start", s: 9.5, c: GREY }) : "")); };
      const cA = cxOf(p), cB = cxOf(p + 1), xr = X0 + cs.length * CW - 8, lx = 590;
      s += lab(cA - 15, 150, lx, 64, "peptide bond", "joins adjacent amino acids");
      s += lab(cB + 16, 166, lx, 108, "amino acid", "carried by the tRNA");
      s += lab(cB + 39, 220, lx, 152, "tRNA", "anticodon matches the codon");
      s += lab(cB + 38, 271, lx, 196, "anticodon", "three bases on tRNA");
      s += lab(cB + 38, 301, lx, 240, "codon", "three bases on mRNA");
      s += lab(xr, 312, lx, 284, "mRNA", "read one codon at a time");
      s += lab(cA + 140, 332, lx, 330, "ribosome", "two subunits; holds two tRNAs");
      if (!N) s += T(20, 84, "a tRNA without its amino acid leaves to collect another", { a: "start", s: 9.5, c: GREY });
    }
    return s + "</svg>";
  };
  const translationStatic = (labels = "text") => translationScene({ codons: ["AUG", "UUC", "GGA", "CAU", "UGG"], p: 1, x0: 150, trnas: [{ i: 0, aas: [], leaving: true }, { i: 1, aas: ["Met", "Phe"] }, { i: 2, aas: ["Gly"] }], labels });

  // ================= 7. Overview: gene to functional protein =================
  const overview = () => {
    uid(); let s = svgOpen(760, 300, "flow diagram of protein synthesis in a eukaryotic cell: in the nucleus, DNA is transcribed by RNA polymerase into pre-mRNA, which is spliced into mRNA; mRNA leaves through a nuclear pore; in the cytoplasm ribosomes, tRNA and ATP translate it into a polypeptide, which folds, helped by chaperones, into a functional protein", `<defs>${marker("ov-a", INK)}</defs>`);
    s += `<rect x="10" y="30" width="350" height="210" rx="40" fill="#eef3fa" stroke="${NAVY}" stroke-width="2.5" stroke-dasharray="10 5"/>` + T(30, 22, "nucleus (eukaryote)", { a: "start", s: 11, w: 700, c: NAVY }) + T(560, 22, "cytoplasm", { s: 11, w: 700, c: GREY });
    const b = (x, y, w, t, sub, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="46" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>` + T(x + w / 2, y + 20, t, { s: 12, w: 700 }) + T(x + w / 2, y + 36, sub, { s: 9.5, c: GREY });
    const ar = (x1, y1, x2, y2, t, ty = -6) => L(x1, y1, x2, y2, { c: INK, w: 1.8, m: "ov-a" }) + (t ? T((x1 + x2) / 2, (y1 + y2) / 2 + ty, t, { s: 9.5, c: GREY, w: 600 }) : "");
    s += b(40, 50, 120, "DNA (gene)", "exons + introns", "#fff", NAVY) + b(210, 50, 120, "pre-mRNA", "copy of whole gene", "#f5e9f2", PLUM) + b(210, 160, 120, "mRNA", "introns removed", "#f5e9f2", PLUM);
    s += ar(160, 73, 208, 73, "") + T(185, 114, "transcription by RNA polymerase", { s: 9.5, c: TEAL, w: 600 }) + ar(270, 96, 270, 158, "") + T(282, 124, "splicing", { a: "start", s: 9.5, c: GREY, w: 600 });
    s += `<rect x="352" y="170" width="16" height="26" fill="#fff" stroke="${NAVY}" stroke-width="1.5"/>` + T(360, 214, "nuclear pore", { s: 9, c: NAVY }) + ar(330, 183, 420, 183, "");
    s += b(424, 160, 140, "ribosome", "+ tRNA + ATP", "#e9eef8", NAVY) + ar(494, 158, 494, 98, "") + T(504, 132, "translation", { a: "start", s: 9.5, c: GREY, w: 600 }) + b(424, 50, 140, "polypeptide", "amino-acid sequence", MINT, TEAL);
    s += ar(564, 73, 610, 73, "") + T(587, 64, "folds", { s: 9.5, c: GREY, w: 600 }) + b(612, 50, 138, "functional protein", "specific 3D shape", MINT, TEAL) + T(681, 116, "chaperone proteins", { s: 9.5, c: AMBER, w: 600 }) + T(681, 129, "assist folding", { s: 9.5, c: AMBER, w: 600 });
    s += T(380, 266, "In prokaryotes there is no nucleus and no splicing: transcription gives mRNA directly, and ribosomes can translate it straight away.", { s: 10.5, c: INK }) + T(380, 284, "Schematic flow, not to scale.", { s: 9.5, c: GREY });
    return s + "</svg>";
  };

  // ================= 8. Protein folding (3.1.8.3) =================
  const RCOL = { h: AMBER, p: TEAL, pos: NAVY, neg: ROSE, s: SAGE };
  const bead = (x, y, k, r = 8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${RCOL[k]}" fill-opacity=".85" stroke="#fff" stroke-width="1"/>` + (k === "pos" ? T(x, y + 4, "+", { s: 11, w: 700, c: "#fff" }) : k === "neg" ? T(x, y + 3, "−", { s: 11, w: 700, c: "#fff" }) : k === "s" ? T(x, y + 3.5, "S", { s: 9, w: 700, c: "#fff" }) : "");
  const folding = () => {
    uid(); let s = svgOpen(760, 370, "three stages of protein folding: primary structure as a chain of amino acids with different R groups; secondary structure as an alpha helix and a beta pleated sheet held by hydrogen bonds; tertiary structure as a compact folded shape with hydrophobic R groups inside and ionic bonds, hydrogen bonds and a disulfide bridge between R groups", `<defs>${marker("fo-a", GREY)}</defs>`);
    s += T(125, 24, "Primary structure", { s: 13, w: 700 }) + T(385, 24, "Secondary structure", { s: 13, w: 700 }) + T(640, 24, "Tertiary structure", { s: 13, w: 700 });
    // primary: wavy chain
    const seq = ["pos", "h", "p", "h", "s", "neg", "p", "h", "h", "pos", "p", "h", "s", "neg", "h", "p"]; const ppos = (i) => i < 8 ? [30 + i * 26, 70 + (i % 2) * 12] : [30 + (15 - i) * 26, 140 + (i % 2) * 12];
    seq.forEach((k, i) => { if (i && i !== 8) { const [a, b] = ppos(i - 1), [c, d] = ppos(i); s += L(a, b, c, d, { c: INK, w: 2 }); } }); { const [a, b] = ppos(7), [c, d] = ppos(8); s += `<path d="M${a} ${b} C ${a + 34} ${b}, ${c + 34} ${d}, ${c} ${d}" fill="none" stroke="${INK}" stroke-width="2"/>`; }
    seq.forEach((k, i) => { const [x, y] = ppos(i); s += bead(x, y, k); }); s += T(30, 172, "N-terminus at top left; peptide bonds join each pair", { a: "start", s: 9, c: GREY });
    s += T(125, 190, "the sequence of amino acids,", { s: 10.5 }) + T(125, 204, "joined by peptide bonds;", { s: 10.5 }) + T(125, 218, "set by the base sequence", { s: 10.5 }) + T(125, 232, "of the gene", { s: 10.5 });
    s += L(240, 110, 268, 110, { c: GREY, w: 2, m: "fo-a" });
    // secondary: helix + sheet
    let d = "M285 60"; for (let i = 0; i < 6; i++) d += ` c 30 0, 30 16, 0 16 c -10 0, -10 0, 0 0`; s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.2"/>`; for (let i = 0; i < 5; i++) s += L(300, 68 + i * 16, 300, 82 + i * 16, { c: TEAL, w: 1.4, d: "2 2" });
    s += T(300, 172, "α-helix", { s: 10.5, w: 700 });
    const zig = (y) => { let p = `M360 ${y}`; for (let i = 0; i < 6; i++) p += ` l 12 ${i % 2 ? -8 : 8}`; return `<path d="${p}" fill="none" stroke="${INK}" stroke-width="2.2"/>`; };
    s += zig(80) + zig(110) + zig(140); for (let i = 0; i < 6; i++) { s += L(366 + i * 12, 84 + (i % 2 ? 0 : 0), 366 + i * 12, 106, { c: TEAL, w: 1.4, d: "2 2" }) + L(366 + i * 12, 114, 366 + i * 12, 136, { c: TEAL, w: 1.4, d: "2 2" }); }
    s += T(400, 172, "β-pleated sheet", { s: 10.5, w: 700 }) + T(385, 196, "hydrogen bonds (dashed) between", { s: 10.5 }) + T(385, 210, "groups in the polypeptide", { s: 10.5 }) + T(385, 224, "backbone, not the R groups", { s: 10.5 });
    s += L(486, 110, 514, 110, { c: GREY, w: 2, m: "fo-a" });
    // tertiary: globule
    s += `<path d="M560 70 C 600 40, 700 50, 720 90 C 745 140, 700 180, 650 175 C 600 172, 560 165, 548 130 C 538 100, 545 80, 560 70z" fill="#f4f7f7" stroke="${INK}" stroke-width="2.4"/>`;
    s += `<path d="M575 90 C 610 70, 680 75, 700 105 C 712 128, 680 150, 640 150 C 600 150, 580 130, 595 112 C 610 96, 650 100, 660 118" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".6"/>`;
    s += bead(630, 110, "h") + bead(648, 124, "h") + bead(615, 128, "h") + bead(664, 104, "h") + bead(640, 92, "h");
    s += bead(590, 70, "pos") + bead(606, 64, "neg") + `<line x1="598" y1="67" x2="598" y2="67"/>` + bead(705, 82, "p") + L(566, 104, 578, 130, { c: TEAL, w: 1.6, d: "3 2" }) + bead(566, 104, "p") + bead(578, 132, "p") + L(537, 146, 568, 124, { c: GREY }) + T(535, 150, "hydrogen bond", { a: "end", s: 9.5, c: GREY }) + bead(715, 140, "s") + bead(690, 168, "s") + L(711, 148, 694, 160, { c: SAGE, w: 3 });
    s += T(640, 196, "further folding held by bonds", { s: 10.5 }) + T(640, 210, "between R groups: hydrogen,", { s: 10.5 }) + T(640, 224, "ionic and disulfide; hydrophobic", { s: 10.5 }) + T(640, 238, "R groups cluster inside", { s: 10.5 });
    s += L(598, 52, 580, 40, { c: GREY }) + T(578, 40, "ionic bond", { a: "end", s: 9.5, c: GREY }) + L(724, 154, 740, 170, { c: GREY }) + T(740, 184, "disulfide", { a: "end", s: 9.5, c: GREY }) + T(740, 196, "", { s: 9.5 }) + T(640, 160, "hydrophobic core", { s: 9, c: AMBER, w: 700 });
    // key
    const key = [["h", "hydrophobic R group"], ["p", "polar R group"], ["pos", "positively charged R group"], ["neg", "negatively charged R group"], ["s", "cysteine (–SH)"]];
    key.forEach(([k, t], i) => { const x = 30 + (i % 3) * 245, y = 280 + Math.floor(i / 3) * 24; s += bead(x, y, k, 7) + T(x + 14, y + 4, t, { a: "start", s: 10.5 }); });
    s += T(380, 340, "The positions of the R groups are fixed by the amino-acid sequence, so the sequence decides which bonds can form, and where:", { s: 10.5, w: 600 }) + T(380, 356, "it determines the protein's characteristic 3D shape. Schematic; quaternary structure (more than one polypeptide) is in 3.1.1.4.", { s: 10.5, w: 600 });
    return s + "</svg>";
  };

  // ================= 9. Chaperones (3.1.8.3) =================
  const chaperone = () => {
    uid(); let s = svgOpen(760, 330, "left: newly made polypeptides with exposed hydrophobic regions stick to each other and form a non-functional clump; right: a chaperone protein binds a partly folded polypeptide, preventing incorrect interactions, and releases it once it has folded into its correct shape", `<defs>${marker("ch-a", GREY)}</defs>`);
    s += T(190, 24, "Without help (crowded cytoplasm)", { s: 13, w: 700, c: ROSE }) + T(570, 24, "With a chaperone", { s: 13, w: 700, c: TEAL }) + L(380, 12, 380, 300, { c: "#d3dbe3", w: 1.5, d: "5 4" });
    const chain = (x, y, flip = 1) => `<path d="M${x} ${y} c 20 -20, 40 20, 60 0 s 40 20, 60 0" fill="none" stroke="${INK}" stroke-width="2.2" transform="scale(1 ${flip})" transform-origin="${x} ${y}"/>` + bead(x + 50, y + 4, "h") + bead(x + 70, y - 4, "h");
    s += chain(40, 70) + chain(40, 120) + T(60, 158, "new polypeptides with hydrophobic", { a: "start", s: 10, c: GREY }) + T(60, 171, "R groups still exposed", { a: "start", s: 10, c: GREY });
    s += L(190, 180, 190, 212, { c: GREY, w: 1.6, m: "ch-a" }) + T(200, 200, "hydrophobic regions stick together", { a: "start", s: 10, c: GREY });
    s += `<path d="M120 230 c 30 -20, 70 -10, 80 10 c 10 20, -20 40, -50 34 c -30 -6, -50 -28, -30 -44z M150 236 c 20 10, 40 4, 50 20 M135 255 c 10 -14, 40 -10, 55 0" fill="#f7e9e9" stroke="${INK}" stroke-width="2"/>` + bead(160, 248, "h") + bead(178, 252, "h") + bead(150, 260, "h") + T(190, 296, "misfolded, clumped (aggregated): not functional", { s: 10.5, w: 700, c: ROSE });
    // right
    s += `<path d="M450 70 c 20 -20, 40 20, 60 0" fill="none" stroke="${INK}" stroke-width="2.2"/>` + bead(480, 64, "h") + T(470, 100, "partly folded polypeptide", { s: 10, c: GREY });
    s += L(530, 70, 560, 70, { c: GREY, w: 1.6, m: "ch-a" });
    s += `<path d="M570 50 v60 a40 40 0 0 0 80 0 v-60" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3"/><path d="M590 80 c 10 -14, 30 14, 40 0" fill="none" stroke="${INK}" stroke-width="2"/>` + bead(610, 88, "h") + T(610, 170, "chaperone binds it,", { s: 10.5, w: 700, c: AMBER }) + T(610, 184, "shielding exposed regions", { s: 10, c: GREY }) + T(610, 197, "while it folds", { s: 10, c: GREY });
    s += L(660, 90, 690, 90, { c: GREY, w: 1.6, m: "ch-a" });
    s += `<path d="M700 70 C 720 55, 745 70, 742 92 C 740 112, 715 118, 702 106 C 690 96, 690 80, 700 70z" fill="${MINT}" stroke="${TEAL}" stroke-width="2"/>` + bead(718, 90, "h", 6) + T(720, 140, "correctly", { s: 10.5, w: 700, c: TEAL }) + T(720, 154, "folded protein", { s: 10.5, w: 700, c: TEAL }) + T(720, 168, "released", { s: 10, c: GREY });
    s += T(570, 236, "The chaperone does not supply the shape: the amino-acid", { s: 10.5 }) + T(570, 252, "sequence does. It stops wrong interactions so the chain", { s: 10.5 }) + T(570, 268, "can fold correctly. Many chaperones use energy from ATP.", { s: 10.5 }) + T(570, 296, "Schematic. Some chaperones (chaperonins) enclose the chain in a chamber.", { s: 9.5, c: GREY });
    return s + "</svg>";
  };

  // Tiny bar strip of a sequence split into labelled segments (used by the splicing activity)
  B.proteinArt = { T, box, row, codeTableHTML, codonList, tripletCode, codeProperties, transcriptionScene, splicing, trna, trnaShape, translationScene, translationStatic, overview, folding, chaperone, colours: { INK, GREY, TEAL, SAGE, NAVY, AMBER, ROSE, MINT, PLUM, FILL, EDGE }, MONO };
})(window.BIO);
