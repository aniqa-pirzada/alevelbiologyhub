// Shared models and artwork for 3.1.7 (DNA, genes and chromosomes). Loaded before the 3.1.7 content files, the
// consolidation page and js/views/interactives-dna.js. Every drawing is schematic SVG drawn in code.
// Conventions used in every drawing (checked against standard texts: Alberts et al., Molecular Biology of the Cell;
// Berg, Tymoczko & Stryer, Biochemistry; Watson & Crick 1953; the Sprinzl tRNA numbering for the clover leaf):
//   - sugar-phosphate backbone on the outside, bases on the inside, complementary pairs only (A–T, C–G; A–U in RNA);
//   - each strand has a 5′ end (phosphate on carbon 5′) and a 3′ end (free OH on carbon 3′); the two strands of a
//     double helix are antiparallel: in a horizontal ladder the top strand runs 5′→3′ left to right and the bottom
//     strand 3′→5′; the pentose is drawn with C1′ (carrying the base) towards the centre, C3′ towards the 3′ end and
//     C4′/C5′ towards the 5′ end, so the drawn sugar orientation itself flips between the strands;
//   - purines (A, G: two rings) are drawn as longer blocks and pyrimidines (C, T, U: one ring) as shorter blocks, so
//     every pair is one purine plus one pyrimidine and the ladder has a constant width;
//   - hydrogen bonds: two for A–T (and A–U), three for C–G (supporting detail).
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", SAGE = "#6b9a7f", NAVY = "#1e3a5f", AMBER = "#c8902a", ROSE = "#b4504f";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ""}${o.it ? ' font-style="italic"' : ""}>${s}</text>`;
  let cnt = 0, U = ""; const uid = () => (U = "-u" + (++cnt));
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${col}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 1.5}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;

  // ================= MODEL =================
  const PAIR = { A: "T", T: "A", C: "G", G: "C", U: "A" };
  const PAIR_RNA = { A: "U", U: "A", C: "G", G: "C", T: "A" };
  const PURINE = new Set(["A", "G"]);
  const comp = (seq, rna = false) => seq.toUpperCase().split("").map((b) => (rna ? PAIR_RNA : PAIR)[b] || "?").join("");
  // hydrogen bonds in a double-stranded stretch given one strand (supporting: A–T 2, C–G 3)
  const hbonds = (seq) => seq.toUpperCase().split("").reduce((n, b) => n + (b === "C" || b === "G" ? 3 : b === "A" || b === "T" || b === "U" ? 2 : 0), 0);
  // percentage composition of a single strand, or of the double-stranded molecule formed with its complement
  const composition = (seq, ds = false) => { const s = ds ? seq + comp(seq) : seq; const n = s.length; const c = (b) => (100 * s.split("").filter((x) => x === b).length) / n; return { A: c("A"), C: c("C"), G: c("G"), T: c("T") }; };
  // Chargaff's rules for double-stranded DNA: %A = %T and %C = %G, so %A + %G = 50
  const fromOne = (base, pct) => { const p = { A: 0, C: 0, G: 0, T: 0 }; p[base] = pct; p[PAIR[base]] = pct; const other = (100 - 2 * pct) / 2; for (const b of ["A", "C", "G", "T"]) if (b !== base && b !== PAIR[base]) p[b] = other; return p; };
  // Meselson–Stahl: fraction of DNA molecules in each density class after g generations in 14N, starting from 15N DNA.
  // semi: g = 0 all heavy; g ≥ 1 hybrid = 2/2^g, light = 1 − 2/2^g. conservative: heavy = 1/2^g, light = 1 − 1/2^g.
  // dispersive: one band whose 15N fraction is 1/2^g (every molecule a patchwork of old and new).
  const meselson = (model, g) => { const f = Math.pow(2, -g); if (model === "semi") return g === 0 ? { heavy: 1, hybrid: 0, light: 0 } : { heavy: 0, hybrid: 2 * f, light: 1 - 2 * f }; if (model === "conservative") return { heavy: f, hybrid: 0, light: 1 - f }; return { dispersed: f }; };
  B.dnaModel = { PAIR, PAIR_RNA, PURINE, comp, isPair: (a, b, rna) => (rna ? PAIR_RNA : PAIR)[a] === b, hbonds, composition, fromOne, meselson };

  // ================= PRIMITIVES =================
  const BASECOL = { A: ["#fbe3b0", AMBER], G: ["#d3ecd9", "#3f7a55"], C: ["#d4e6f5", "#2f5f8f"], T: ["#f6d2d2", ROSE], U: ["#e6dbf3", "#6a4a96"], "?": ["#eee", GREY] };
  const BASENAME = { A: "adenine", C: "cytosine", G: "guanine", T: "thymine", U: "uracil" };
  // pentagon centred on (x, y), radius r, with vertex k=0 at angle a0 (degrees, SVG coordinates)
  const pent = (x, y, r, a0) => Array.from({ length: 5 }, (_, k) => { const a = ((a0 + 72 * k) * Math.PI) / 180; return [+(x + r * Math.cos(a)).toFixed(2), +(y + r * Math.sin(a)).toFixed(2)]; });
  const poly = (pts, fill, stroke, w = 1.5) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
  const phos = (x, y, r = 8, col = AMBER, fill = "#fde9c8") => `<g data-part="phosphate"><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${col}" stroke-width="1.5"/>${T(x, y + r * 0.42, "P", { s: r * 1.2, w: 700, c: "#7a5a12" })}</g>`;

  // ---- Horizontal double-stranded ladder (the workhorse drawing) ----
  // nts: [{x, y, b, dir (+1 base points down, -1 up), col: backbone colour, join: true if joined to next nt in strand}]
  // Top strands (dir +1) run 5′→3′ left to right; bottom strands (dir −1) run 5′→3′ right to left.
  const G = { r: 9, bw: 18, Lp: 30, Ly: 20, gap: 10 }; G.W = 2 * G.r + G.Lp + G.Ly + G.gap; // backbone-to-backbone distance
  const baseLen = (b) => (PURINE.has(b) ? G.Lp : G.Ly);
  const strand = (nts, o = {}) => { // draws one strand: backbone, sugars, phosphates, bases
    let s = ""; const r = G.r;
    nts.forEach((n, i) => { // backbone segments first
      const nx = nts[i + 1]; if (nx && n.join !== false) { const px = (n.x + nx.x) / 2, py = n.y - n.dir * r * 1.1; s += `<path d="M${n.x + n.dir * r * 0.6} ${n.y - n.dir * r * 0.6} L${px} ${py} L${nx.x - n.dir * r * 0.6} ${nx.y - n.dir * r * 0.6}" fill="none" stroke="${n.col}" stroke-width="2.4" data-part="backbone"/>`; }
    });
    nts.forEach((n, i) => {
      const fill = n.fill || (n.col === TEAL ? "#d6efec" : "#e4ebf5");
      // sugar: C1′ vertex points at the base (down for dir +1, up for dir −1)
      s += `<g data-part="sugar">${poly(pent(n.x, n.y, r, n.dir > 0 ? 90 : 270), fill, n.col, 1.6)}</g>`;
      if (n.b) { const len = baseLen(n.b), [f, st] = BASECOL[n.b] || BASECOL["?"]; const y1 = n.dir > 0 ? n.y + r : n.y - r - len; s += `<g data-part="base"><rect x="${n.x - G.bw / 2}" y="${y1}" width="${G.bw}" height="${len}" rx="3" fill="${f}" stroke="${st}" stroke-width="1.4"/>${T(n.x, y1 + len / 2 + 4.5, n.b, { s: 12, w: 700, c: st })}</g>`; }
      const nx = nts[i + 1]; if (nx && n.join !== false) s += phos((n.x + nx.x) / 2, n.y - n.dir * r * 1.1, 7, n.col === TEAL ? TEAL : AMBER, n.col === TEAL ? "#e6f6f1" : "#fde9c8");
    });
    if (o.free) nts.forEach((n) => { const x5 = n.x - n.dir * 21, y5 = n.y - n.dir * r * 1.1; s = `<path d="M${n.x - n.dir * r * 0.6} ${n.y - n.dir * r * 0.6} L${x5 + n.dir * 6} ${y5}" stroke="${n.col}" stroke-width="2.4" fill="none"/>` + s + phos(x5, y5, 6, n.col === TEAL ? TEAL : AMBER, n.col === TEAL ? "#e6f6f1" : "#fde9c8"); });
    if (o.ends) { // nts are in 5′→3′ order: the 5′ end carries a phosphate, the 3′ end a free OH on carbon 3′
      const p5 = nts[0], p3 = nts[nts.length - 1], out = nts.length > 1 ? Math.sign(nts[0].x - nts[1].x) : -p5.dir; const x5 = p5.x + out * 26, y5 = p5.y - p5.dir * r * 1.1;
      s += `<path d="M${p5.x + out * r * 0.6} ${p5.y - p5.dir * r * 0.6} L${x5 - out * 7} ${y5}" stroke="${p5.col}" stroke-width="2.4" fill="none"/>` + phos(x5, y5, 7, p5.col === TEAL ? TEAL : AMBER, p5.col === TEAL ? "#e6f6f1" : "#fde9c8") + T(x5 + out * 18, y5 + 4, "5′", { s: 12, w: 700 });
      s += T(p3.x - out * 22, p3.y + 4, "3′", { s: 12, w: 700 }) + T(p3.x - out * 22, p3.y + 15, "OH", { s: 8.5, c: GREY }); }
    return s;
  };
  const hb = (x, y1, y2, n, col = GREY) => Array.from({ length: n }, (_, k) => { const dx = (k - (n - 1) / 2) * 5.5; return L(x + dx, y1, x + dx, y2, { c: col, w: 1.3, d: "2 2" }); }).join("");
  const pairBonds = (top, bot) => { const y1 = top.y + G.r + baseLen(top.b), y2 = bot.y - G.r - baseLen(bot.b); if (!B.dnaModel.isPair(top.b, bot.b) && !B.dnaModel.isPair(top.b, bot.b, true)) return T(top.x, (y1 + y2) / 2 + 4, "×", { s: 13, w: 700, c: "#b23" }); return `<g data-part="hbond">${hb(top.x, y1 + 1, y2 - 1, top.b === "C" || top.b === "G" ? 3 : 2)}</g>`; };

  // A double-stranded segment from one strand (top, 5′→3′) and an optional bottom strand (default: the complement)
  const ladder = ({ top, bottom, x0 = 70, y0 = 60, dx = 46, colTop = NAVY, colBot = NAVY, ends = true, rna = false } = {}) => {
    const bot = bottom || comp(top, rna); let s = "";
    const tn = top.split("").map((b, i) => ({ x: x0 + i * dx, y: y0, b, dir: 1, col: colTop })), bn = bot.split("").map((b, i) => ({ x: x0 + i * dx, y: y0 + G.W, b: b === "-" ? "" : b, dir: -1, col: colBot }));
    tn.forEach((t, i) => { if (bn[i].b) s += pairBonds(t, bn[i]); });
    return s + strand(tn, { ends }) + strand(bn.slice().reverse(), { ends });
  };
  const dsDiagram = ({ top = "ATGCCTAG", width = 760, title = true, rna = false } = {}) => { const n = top.length, dx = 46, x0 = (760 - (n - 1) * dx) / 2; let s = `<svg viewBox="0 0 760 236" width="${width}" role="img" aria-label="a short length of double-stranded DNA drawn untwisted as a ladder: two antiparallel sugar-phosphate backbones outside, complementary bases paired inside by hydrogen bonds">`; s += ladder({ top, x0, y0: 70 }); const xR = x0 + (n - 1) * dx;
    s += T(380, 24, "Two polynucleotide strands, drawn untwisted: backbone outside, bases paired inside", { s: 12.5, w: 700 });
    s += T(x0 - 50, 40, "strand 1 runs 5′ → 3′", { s: 10.5, c: GREY, a: "start" }) + T(xR + 50, 186, "strand 2 runs 5′ → 3′ the other way (antiparallel)", { s: 10.5, c: GREY, a: "end" });
    s += T(380, 222, "Dashed lines: hydrogen bonds. A pairs with T (2 bonds); C pairs with G (3 bonds). Long blocks: purines (A, G); short: pyrimidines (C, T).", { s: 10, c: GREY });
    s += T(xR + 34, 52, "sugar-phosphate", { s: 10, c: NAVY, a: "start", w: 700 }) + T(xR + 34, 64, "backbone", { s: 10, c: NAVY, a: "start", w: 700 });
    return s + "</svg>"; };

  // ---- General nucleotide (as the specification draws it): phosphate – pentose – base ----
  const nucleotideGeneral = ({ numbered = false, width = 520 } = {}) => { let s = `<svg viewBox="0 0 520 260" width="${width}" role="img" aria-label="general structure of a nucleotide: a phosphate group joined to a pentose sugar, which is joined to a nitrogen-containing base">`;
    const px = 120, py = 70, sx = 210, sy = 150, bx = 300, by = 128;
    const pts = pent(sx, sy, 38, -90); s += L(px + 22, py + 16, pts[4][0] + 4, pts[4][1] - 30, { w: 3 }) + L(pts[4][0] + 4, pts[4][1] - 30, pts[4][0], pts[4][1], { w: 3 }) + L(pts[1][0], pts[1][1], bx, by + 22, { w: 3 });
    s += `<g data-part="phosphate"><circle cx="${px}" cy="${py}" r="28" fill="#fde9c8" stroke="${AMBER}" stroke-width="2.5"/>${T(px, py + 6, "P", { s: 20, w: 700, c: "#7a5a12" })}</g>`;
    s += `<g data-part="pentose">${poly(pts, "#e4ebf5", NAVY, 2.5)}${T(sx, sy + 6, "pentose", { s: 12, w: 700, c: NAVY })}</g>`;
    s += `<g data-part="base"><rect x="${bx}" y="${by}" width="110" height="44" rx="8" fill="#d3ecd9" stroke="#3f7a55" stroke-width="2.5"/>${T(bx + 55, by + 27, "base", { s: 13, w: 700, c: "#3f7a55" })}</g>`;
    if (!numbered) s += `<g data-label="1">${T(px, py - 38, "phosphate group", { s: 13, w: 700 })}</g><g data-label="2">${T(sx, sy + 62, "pentose (5-carbon sugar)", { s: 13, w: 700 })}</g><g data-label="3">${T(bx + 55, by - 14, "nitrogen-containing", { s: 13, w: 700 })}${T(bx + 55, by + 64, "organic base", { s: 13, w: 700 })}</g>`;
    s += T(260, 248, "The general structure required by the specification. Schematic: shapes are conventions, not atoms.", { s: 10, c: GREY });
    return s + "</svg>"; };
  const numberMarks = (svg, marks) => svg.replace(/<g data-label="[^"]*">.*?<\/g>/gs, "").replace("</svg>", marks.map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="12" fill="${NAVY}"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">${n}</text>`).join("") + "</svg>");

  // ---- Detailed nucleotide with carbon numbering (supporting): deoxyribose v ribose ----
  const nucleotideDetail = ({ sugar = "deoxyribose", base = "A", phosphate = true, width = 560, note = true } = {}) => { const ribo = sugar === "ribose"; let s = `<svg viewBox="0 -40 560 340" width="${width}" role="img" aria-label="${ribo ? "an RNA" : "a DNA"} nucleotide with the carbons of the pentose numbered 1′ to 5′: base on carbon 1′, phosphate on carbon 5′ and ${ribo ? "OH" : "H"} on carbon 2′">`;
    const cx = 250, cy = 160, P = pent(cx, cy, 50, -90); // P[0] top = ring O, P[1] right = C1′, P[2] lower right = C2′, P[3] lower left = C3′, P[4] left = C4′
    s += `<g data-part="pentose">${poly(P, ribo ? "#efe6f8" : "#e4ebf5", ribo ? "#6a4a96" : NAVY, 2.5)}</g>`;
    s += T(P[0][0], P[0][1] - 8, "O", { s: 14, w: 700, c: ROSE });
    const lab = (p, t, dx, dy) => T(p[0] + dx, p[1] + dy, t, { s: 11, w: 700, c: GREY });
    s += lab(P[1], "1′", -18, 4) + lab(P[2], "2′", -8, -10) + lab(P[3], "3′", 10, -10) + lab(P[4], "4′", 18, 4);
    // C5′ up from C4′, then O–P
    const c5 = [P[4][0] - 10, P[4][1] - 58]; s += L(P[4][0], P[4][1], c5[0], c5[1], { w: 2.5 }) + T(c5[0] - 18, c5[1] + 4, "5′", { s: 11, w: 700, c: GREY }) + T(c5[0] + 22, c5[1] + 4, "CH₂", { s: 11, c: INK });
    if (phosphate) s += L(c5[0], c5[1], c5[0] - 40, c5[1] - 40, { w: 2.5 }) + `<g data-part="phosphate"><circle cx="${c5[0] - 58}" cy="${c5[1] - 56}" r="24" fill="#fde9c8" stroke="${AMBER}" stroke-width="2.5"/>${T(c5[0] - 58, c5[1] - 51, "P", { s: 18, w: 700, c: "#7a5a12" })}</g>` + T(c5[0] - 58, c5[1] - 88, "phosphate group (on carbon 5′)", { s: 11, w: 700, c: "#7a5a12" });
    // 3′ OH and 2′ group
    s += L(P[3][0], P[3][1], P[3][0] - 14, P[3][1] + 34, { w: 2.5 }) + T(P[3][0] - 20, P[3][1] + 50, "OH", { s: 13, w: 700 }) + T(P[3][0] - 20, P[3][1] + 64, "on carbon 3′", { s: 9.5, c: GREY });
    s += L(P[2][0], P[2][1], P[2][0] + 14, P[2][1] + 34, { w: 2.5 }) + T(P[2][0] + 20, P[2][1] + 50, ribo ? "OH" : "H", { s: 13, w: 700, c: ribo ? "#6a4a96" : NAVY }) + T(P[2][0] + 20, P[2][1] + 64, ribo ? "ribose: OH on 2′" : "deoxyribose: H on 2′", { s: 9.5, w: 700, c: ribo ? "#6a4a96" : NAVY });
    // base on C1′
    const [f, st] = BASECOL[base] || BASECOL["?"]; const bx = P[1][0] + 44; s += L(P[1][0], P[1][1], bx, P[1][1], { w: 2.5 }) + `<g data-part="base"><rect x="${bx}" y="${P[1][1] - 26}" width="${PURINE.has(base) ? 150 : 110}" height="52" rx="9" fill="${f}" stroke="${st}" stroke-width="2.5"/>${T(bx + (PURINE.has(base) ? 75 : 55), P[1][1] - 2, base, { s: 18, w: 700, c: st })}${T(bx + (PURINE.has(base) ? 75 : 55), P[1][1] + 16, `${BASENAME[base] || ""} (${PURINE.has(base) ? "purine" : "pyrimidine"})`, { s: 10, c: st })}</g>` + T(bx + 60, P[1][1] - 36, "base on carbon 1′", { s: 10.5, w: 700, c: st });
    s += T(cx, cy + 6, sugar, { s: 12, w: 700, c: ribo ? "#6a4a96" : NAVY });
    if (note) s += T(280, 292, "Supporting detail. Carbons of the sugar are numbered 1′–5′ (\"one prime\" to \"five prime\") to tell them from atoms in the base.", { s: 10, c: GREY });
    return s + "</svg>"; };

  // ---- One polynucleotide strand: phosphodiester bonds (supporting) ----
  const polynucleotide = ({ seq = "AGCT", rna = false, width = 760 } = {}) => { uid(); let s = `<svg viewBox="0 0 760 230" width="${width}" role="img" aria-label="a single polynucleotide strand of ${seq.length} nucleotides joined by phosphodiester bonds into a sugar-phosphate backbone, with a 5′ end and a 3′ end"><defs>${marker("pn-a", GREY)}</defs>`;
    const n = seq.length, dx = 110, x0 = 380 - ((n - 1) * dx) / 2; const nts = seq.split("").map((b, i) => ({ x: x0 + i * dx, y: 95, b, dir: 1, col: rna ? "#6a4a96" : NAVY, fill: rna ? "#efe6f8" : "#e4ebf5" }));
    s += strand(nts, { ends: true });
    // brace one nucleotide
    const a = nts[1]; s += `<rect x="${a.x - 50}" y="${a.y - 32}" width="64" height="${G.r + baseLen(a.b) + 42}" rx="10" fill="none" stroke="${TEAL}" stroke-width="1.5" stroke-dasharray="5 3"/>` + T(a.x - 18, a.y + G.r + baseLen(a.b) + 26, "one nucleotide", { s: 10.5, w: 700, c: TEAL });
    const p = [(nts[2].x + nts[3].x) / 2, nts[2].y - G.r * 1.1]; s += L(p[0] + 40, p[1] - 40, p[0] + 9, p[1] - 6, { c: GREY, w: 1.2, m: "pn-a" }) + T(p[0] + 44, p[1] - 44, "phosphodiester bond,", { s: 10.5, w: 700, a: "start" }) + T(p[0] + 44, p[1] - 31, "formed by condensation", { s: 10.5, w: 700, a: "start" });
    s += T(380, 24, rna ? "An RNA strand: ribose, and uracil instead of thymine" : "One polynucleotide (DNA) strand", { s: 12.5, w: 700 });
    s += T(380, 196, "Each condensation joins the phosphate of one nucleotide to carbon 3′ of the sugar of the previous one, releasing water.", { s: 10, c: GREY }) + T(380, 210, "The repeating sugar–phosphate chain is the backbone; the bases stick out from it. Supporting detail (not in the specification).", { s: 10, c: GREY });
    return s + "</svg>"; };

  // ---- Double helix (schematic projection) ----
  const helix = ({ width = 520 } = {}) => { uid(); const cx = 170, A = 62, P = 200, y0 = 44, len = 2.2 * P, H = y0 + len + 70; let back = "", front = "", rungs = ""; const N = 140;
    // strand 1 starts at the right (phase π/2) so the two strands begin apart; strand 2 is strand 1 shifted half a turn
    const th = (y) => (2 * Math.PI * (y - y0)) / P + Math.PI / 2, x1 = (y) => cx + A * Math.sin(th(y)), x2 = (y) => cx - A * Math.sin(th(y)), depth = (y) => Math.cos(th(y));
    for (let i = 0; i < N; i++) { const ya = y0 + (i * len) / N, yb = y0 + ((i + 1) * len) / N; const f1 = depth((ya + yb) / 2) > 0; const seg = (fx, col) => `<line x1="${fx(ya).toFixed(1)}" y1="${ya.toFixed(1)}" x2="${fx(yb).toFixed(1)}" y2="${yb.toFixed(1)}" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`; if (f1) { front += seg(x1, NAVY); back += seg(x2, "#9fb2c8"); } else { back += seg(x1, "#9fb2c8"); front += seg(x2, NAVY); } }
    const pairs = "ATGCGTACCATGGCTAAGTCAG"; for (let k = 0; k <= 22; k++) { const y = y0 + k * (P / 10); if (y > y0 + len) break; const a = x1(y), b = x2(y); if (Math.abs(a - b) < 10) continue; const m = (a + b) / 2, t = pairs[k % pairs.length], c = comp(t); rungs += `<line x1="${a.toFixed(1)}" y1="${y}" x2="${m.toFixed(1)}" y2="${y}" stroke="${BASECOL[t][1]}" stroke-width="5"/><line x1="${m.toFixed(1)}" y1="${y}" x2="${b.toFixed(1)}" y2="${y}" stroke="${BASECOL[c][1]}" stroke-width="5"/>`; }
    let s = `<svg viewBox="0 0 520 ${H}" width="${width}" role="img" aria-label="schematic DNA double helix: two antiparallel sugar-phosphate backbones twisted round each other with base pairs as rungs between them"><defs>${marker("hx-a", GREY)}</defs>` + back + rungs + front;
    const ye = y0 + len; s += T(x1(y0), y0 - 14, "5′", { s: 12, w: 700 }) + T(x2(y0), y0 - 14, "3′", { s: 12, w: 700 }) + T(x1(ye), ye + 24, "3′", { s: 12, w: 700 }) + T(x2(ye), ye + 24, "5′", { s: 12, w: 700 });
    const lab = (x, y, tx, ty, lines) => L(tx - 4, ty - 4, x, y, { c: GREY, w: 1, m: "hx-a" }) + lines.map((t, i) => T(tx, ty + i * 14, t, { s: 11.5, w: i === 0 ? 700 : 500, a: "start", c: i === 0 ? INK : GREY })).join("");
    s += lab(x1(y0 + 14) + 6, y0 + 14, 290, 50, ["sugar-phosphate backbone", "(one strand; the other runs", "the opposite way: antiparallel)"]);
    s += lab(cx + 30, y0 + 6 * (P / 10), 290, 150, ["base pair (a rung)", "complementary bases held", "together by hydrogen bonds"]);
    s += `<path d="M262 ${y0 + P} v${P} M256 ${y0 + P} h12 M256 ${y0 + 2 * P} h12" stroke="${GREY}" stroke-width="1" fill="none"/>` + T(290, y0 + 1.5 * P - 10, "one complete turn", { s: 11.5, w: 700, a: "start" }) + T(290, y0 + 1.5 * P + 4, "about 3.4 nm, about 10 base pairs", { s: 10.5, c: GREY, a: "start" }) + T(290, y0 + 1.5 * P + 18, "(supporting detail)", { s: 10, c: GREY, a: "start" });
    s += T(290, H - 40, "Schematic: the real molecule is about 2 nm wide", { s: 10, c: GREY, a: "start" }) + T(290, H - 27, "and has unequal major and minor grooves.", { s: 10, c: GREY, a: "start" });
    return s + "</svg>"; };

  // ---- mRNA strand ----
  const mRNA = ({ seq = "AUGGCAUCCGAAUGG", width = 760 } = {}) => { const n = seq.length, dx = 44, x0 = 380 - ((n - 1) * dx) / 2; let s = `<svg viewBox="0 0 760 210" width="${width}" role="img" aria-label="a molecule of messenger RNA: a single linear strand of RNA nucleotides with exposed bases read in groups of three">`;
    const nts = seq.split("").map((b, i) => ({ x: x0 + i * dx, y: 74, b, dir: 1, col: "#6a4a96", fill: "#efe6f8" })); s += strand(nts, { ends: true });
    for (let k = 0; k < n / 3; k++) { const a = nts[3 * k].x - 14, b = nts[Math.min(n - 1, 3 * k + 2)].x + 14; s += `<path d="M${a} 140 v8 h${b - a} v-8" fill="none" stroke="${TEAL}" stroke-width="1.6"/>` + T((a + b) / 2, 164, k === 0 ? "codon" : "codon", { s: 10, w: 700, c: TEAL }); }
    s += T(380, 24, "Messenger RNA (mRNA): a single, linear strand read as codons", { s: 12.5, w: 700 });
    s += T(380, 186, "Ribose, uracil instead of thymine, no paired second strand. The base sequence is copied from DNA; each group of three", { s: 10, c: GREY }) + T(380, 200, "bases (a codon) codes for one amino acid (3.1.8). Real mRNA molecules are hundreds to thousands of nucleotides long.", { s: 10, c: GREY });
    return s + "</svg>"; };

  // ---- tRNA clover leaf (Sprinzl numbering 1–76) ----
  // Built as an ordered list of nucleotide positions 5′→3′ plus a list of paired positions, so the topology is exact:
  // acceptor stem 1–7 : 66–72; D stem 10–13 : 22–25; anticodon stem 27–31 : 39–43; T stem 49–53 : 61–65;
  // anticodon 34–36 at the bottom of the anticodon loop; unpaired 73–76 (…CCA) at the 3′ end, where the amino acid binds.
  const tRNAgeom = () => { const P = {}; const set = (n, x, y) => (P[n] = [+x.toFixed(1), +y.toFixed(1)]);
    for (let i = 0; i < 7; i++) { set(1 + i, 360, 110 + i * 16); set(72 - i, 400, 110 + i * 16); }
    set(8, 348, 222); set(9, 334, 232);
    [318, 302, 286, 270].forEach((x, i) => { set(10 + i, x, 240); set(25 - i, x, 272); });
    for (let k = 0; k < 8; k++) { const a = ((-60 - (k * 240) / 7) * Math.PI) / 180; set(14 + k, 238 + 30 * Math.cos(a), 256 + 30 * Math.sin(a)); }
    set(26, 342, 288);
    for (let i = 0; i < 5; i++) { set(27 + i, 360, 304 + i * 16); set(43 - i, 400, 304 + i * 16); }
    for (let k = 0; k < 7; k++) { const a = ((-120 - k * 50) * Math.PI) / 180; set(32 + k, 380 + 30 * Math.cos(a), 410 + 30 * Math.sin(a)); }
    [[416, 294], [430, 304], [446, 302], [452, 290], [454, 280]].forEach(([x, y], i) => set(44 + i, x, y));
    [470, 486, 502, 518, 534].forEach((x, i) => { set(49 + i, x, 272); set(65 - i, x, 240); });
    for (let k = 0; k < 7; k++) { const a = ((120 - k * 40) * Math.PI) / 180; set(54 + k, 576 + 30 * Math.cos(a), 256 + 30 * Math.sin(a)); }
    for (let i = 0; i < 4; i++) set(73 + i, 400, 94 - i * 16);
    const pairs = []; for (let i = 0; i < 7; i++) pairs.push([1 + i, 72 - i]); for (let i = 0; i < 4; i++) pairs.push([10 + i, 25 - i]); for (let i = 0; i < 5; i++) pairs.push([27 + i, 43 - i]); for (let i = 0; i < 5; i++) pairs.push([49 + i, 65 - i]);
    return { P, pairs }; };
  const tRNA = ({ width = 700, labels = true } = {}) => { uid(); const { P, pairs } = tRNAgeom(); let s = `<svg viewBox="0 0 760 470" width="${width}" role="img" aria-label="transfer RNA drawn as a clover leaf: one strand of about 76 nucleotides folded back on itself, with base-paired stems held by hydrogen bonds, three loops, the anticodon at the bottom loop and the amino-acid binding site at the 3′ end at the top"><defs>${marker("tr-a", GREY)}</defs>`;
    const pts = Array.from({ length: 76 }, (_, i) => P[i + 1]); s += `<path data-part="backbone" d="M${pts.map((p) => p.join(" ")).join(" L")}" fill="none" stroke="#6a4a96" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<g data-part="hbond">${pairs.map(([a, b]) => L(P[a][0], P[a][1], P[b][0], P[b][1], { c: "#8d7aa8", w: 1.3, d: "2 2" })).join("")}</g>`;
    for (let n = 1; n <= 76; n++) { const [x, y] = P[n]; const anti = n >= 34 && n <= 36, end = n >= 74; s += `<circle cx="${x}" cy="${y}" r="${anti ? 7.5 : 5.2}" fill="${anti ? "#fbe3b0" : end ? "#d6efec" : "#efe6f8"}" stroke="${anti ? AMBER : end ? TEAL : "#6a4a96"}" stroke-width="${anti ? 2 : 1.3}"${anti ? ' data-part="anticodon"' : end ? ' data-part="aa-site"' : ""}/>`; }
    s += T(P[74][0] + 13, P[74][1] + 4, "C", { s: 10, w: 700, c: TEAL, a: "start" }) + T(P[75][0] + 13, P[75][1] + 4, "C", { s: 10, w: 700, c: TEAL, a: "start" }) + T(P[76][0] + 13, P[76][1] + 4, "A", { s: 10, w: 700, c: TEAL, a: "start" });
    s += T(P[1][0] - 12, P[1][1] - 6, "5′", { s: 12, w: 700, a: "end" }) + T(P[76][0] - 12, P[76][1] + 4, "3′", { s: 12, w: 700, a: "end" });
    if (labels) {
      s += `<g data-label="aa">${L(470, 40, P[76][0] + 22, P[76][1] - 2, { c: GREY, w: 1, m: "tr-a" })}${T(474, 40, "amino acid binding site", { s: 12, w: 700, a: "start" })}${T(474, 54, "(supporting: 3′ end, always …CCA)", { s: 10.5, c: GREY, a: "start" })}</g>`;
      s += `<g data-label="anti">${L(470, 446, P[37][0] + 10, P[37][1] + 6, { c: GREY, w: 1, m: "tr-a" })}${T(474, 446, "anticodon: three unpaired bases", { s: 12, w: 700, a: "start" })}${T(474, 460, "complementary to an mRNA codon", { s: 10.5, c: GREY, a: "start" })}</g>`;
      s += `<g data-label="hb">${L(200, 150, 352, 150, { c: GREY, w: 1, m: "tr-a" })}${T(196, 140, "hydrogen bonds between", { s: 12, w: 700, a: "end" })}${T(196, 154, "complementary base pairs", { s: 12, w: 700, a: "end" })}${T(196, 168, "hold the folded shape", { s: 10.5, c: GREY, a: "end" })}</g>`;
      s += `<g data-label="loop">${L(170, 330, 220, 274, { c: GREY, w: 1, m: "tr-a" })}${T(166, 340, "unpaired loop", { s: 11, w: 700, a: "end" })}</g>`;
      s += `<g data-label="strand">${T(600, 320, "one single strand of", { s: 11, w: 700 })}${T(600, 334, "RNA nucleotides (about 76)", { s: 11, w: 700 })}${T(600, 348, "folded into a clover leaf", { s: 11, w: 700 })}</g>`;
    }
    s += T(380, 18, "Transfer RNA (tRNA)", { s: 13, w: 700 });
    return s + "</svg>"; };

  // ---- Eukaryotic DNA packaging: DNA → nucleosomes on histones → coiled fibre → chromosome ----
  const packaging = ({ width = 760 } = {}) => { uid(); let s = `<svg viewBox="0 0 760 312" width="${width}" role="img" aria-label="how a linear eukaryotic DNA molecule is packaged: the double helix winds round groups of histone proteins, the string of beads coils further and the chromosome condenses for cell division"><defs>${marker("pk-a", GREY)}</defs>`;
    // panel 1: double helix
    let h1 = ""; for (let i = 0; i <= 40; i++) { const y = 70 + i * 4, a = 14 * Math.sin(i / 3.2); h1 += `${i ? "L" : "M"}${80 + a} ${y}`; } let h2 = ""; for (let i = 0; i <= 40; i++) { const y = 70 + i * 4, a = -14 * Math.sin(i / 3.2); h2 += `${i ? "L" : "M"}${80 + a} ${y}`; } s += `<path d="${h1}" stroke="${NAVY}" stroke-width="3" fill="none"/><path d="${h2}" stroke="${TEAL}" stroke-width="3" fill="none"/>` + T(80, 52, "DNA double helix", { s: 11.5, w: 700 }) + T(80, 254, "about 2 nm wide", { s: 10, c: GREY });
    s += L(118, 150, 150, 150, { c: GREY, w: 1.5, m: "pk-a" });
    // panel 2: beads on a string (DNA wound round histone groups)
    const beads = [[195, 110], [235, 150], [205, 195], [245, 235]]; s += `<path d="M168 88 C190 96 168 112 180 118 S230 128 222 144 S196 176 192 190 S238 214 232 230 S250 252 262 262" stroke="${NAVY}" stroke-width="2.4" fill="none"/>`;
    s += `<g data-part="histone">${beads.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#f6dcc0" stroke="${AMBER}" stroke-width="2"/><path d="M${x - 17} ${y - 5} q17 -14 34 0 M${x - 17} ${y + 5} q17 14 34 0" stroke="${NAVY}" stroke-width="2.4" fill="none"/>`).join("")}</g>`;
    s += T(220, 52, "DNA wound round histones", { s: 11.5, w: 700 }) + T(220, 66, "(proteins)", { s: 10.5, c: GREY }) + T(220, 280, "histones package and order the DNA", { s: 10, c: GREY });
    s += L(282, 150, 314, 150, { c: GREY, w: 1.5, m: "pk-a" });
    // panel 3: coiled fibre
    let p3 = ""; for (let i = 0; i <= 90; i++) { const t = i / 90, y = 80 + t * 150, x = 380 + 26 * Math.sin(t * Math.PI * 9); p3 += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; } s += `<path d="${p3}" stroke="${AMBER}" stroke-width="7" fill="none" opacity=".85"/><path d="${p3}" stroke="${NAVY}" stroke-width="1.6" fill="none"/>` + T(380, 52, "further coiling and folding", { s: 11.5, w: 700 }) + T(380, 66, "(supporting detail)", { s: 10.5, c: GREY });
    s += L(430, 150, 470, 150, { c: GREY, w: 1.5, m: "pk-a" });
    // panel 4: condensed chromosome (two chromatids after replication)
    s += `<g data-part="chromosome"><path d="M540 80 q-14 0 -14 14 v46 q0 10 12 12 q-12 2 -12 12 v60 q0 14 14 14 q14 0 14 -14 v-60 q0 -10 -6 -12 q6 -2 6 -12 v-46 q0 -14 -14 -14z" fill="#c9d8ea" stroke="${NAVY}" stroke-width="2"/><path d="M580 80 q-14 0 -14 14 v46 q0 10 6 12 q-6 2 -6 12 v60 q0 14 14 14 q14 0 14 -14 v-60 q0 -10 -12 -12 q12 -2 12 -12 v-46 q0 -14 -14 -14z" fill="#c9d8ea" stroke="${NAVY}" stroke-width="2"/><rect x="548" y="146" width="24" height="12" rx="5" fill="${NAVY}"/></g>`;
    s += T(560, 52, "chromosome as seen when", { s: 11.5, w: 700 }) + T(560, 66, "the cell divides", { s: 11.5, w: 700 }) + T(560, 260, "after replication: two identical", { s: 10, c: GREY }) + T(560, 273, "chromatids, joined at the centromere", { s: 10, c: GREY });
    s += T(680, 120, "One chromosome =", { s: 10.5, w: 700, a: "middle" }) + T(680, 134, "one very long linear", { s: 10.5, c: GREY }) + T(680, 148, "DNA molecule (before", { s: 10.5, c: GREY }) + T(680, 162, "replication) plus its", { s: 10.5, c: GREY }) + T(680, 176, "proteins", { s: 10.5, c: GREY });
    s += T(380, 22, "Eukaryotic nuclear DNA: linear molecules associated with proteins (histones)", { s: 12.5, w: 700 }) + T(380, 306, "Schematic, not to scale: each stage is many times more compact than the one before.", { s: 10, c: GREY });
    return s + "</svg>"; };

  // ---- Circular DNA: prokaryote, mitochondrion, chloroplast ----
  const circularDNA = ({ width = 760, only = null } = {}) => { const loop = (x, y, rx, ry, col = NAVY, w = 2.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${col}" stroke-width="${w}"/><ellipse cx="${x}" cy="${y}" rx="${rx - 4}" ry="${ry - 4}" fill="none" stroke="${TEAL}" stroke-width="1.4" stroke-dasharray="3 2"/>`;
    const panels = { prok: (ox) => `<g data-part="prokaryote"><rect x="${ox + 10}" y="70" width="210" height="120" rx="60" fill="#eef6ee" stroke="${SAGE}" stroke-width="3"/>${loop(ox + 112, 124, 66, 34)}${loop(ox + 192, 160, 9, 7, NAVY, 2)}${loop(ox + 52, 168, 8, 6, NAVY, 2)}${T(ox + 115, 54, "Prokaryotic cell", { s: 12, w: 700 })}${T(ox + 115, 212, "one circular DNA molecule, free in", { s: 10, c: GREY })}${T(ox + 115, 225, "the cytoplasm (no nucleus)", { s: 10, c: GREY })}${T(ox + 115, 240, "+ small circular plasmids (supporting)", { s: 10, c: GREY })}</g>`,
      mito: (ox) => { const cx = ox + 115, cy = 130, rx = 95, ry = 46; const yAt = (x, top) => cy + (top ? -1 : 1) * ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)); const crista = (x, top) => { const y0 = yAt(x, top), d = top ? 34 : -34; return `<path d="M${x - 4} ${y0} L${x - 4} ${y0 + d} Q${x} ${y0 + d + (top ? 6 : -6)} ${x + 4} ${y0 + d} L${x + 4} ${y0}" fill="#fbe9e1" stroke="${ROSE}" stroke-width="1.6"/>`; };
        return `<g data-part="mitochondrion"><ellipse cx="${cx}" cy="${cy}" rx="105" ry="56" fill="#fbe9e1" stroke="${ROSE}" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fdf3ee" stroke="${ROSE}" stroke-width="1.6"/>${[[ox + 52, true], [ox + 92, false], [ox + 132, true], [ox + 172, false]].map(([x, t]) => crista(x, t)).join("")}${loop(ox + 72, 130, 13, 10)}${loop(ox + 152, 130, 13, 10)}${T(ox + 115, 54, "Mitochondrion", { s: 12, w: 700 })}${T(ox + 115, 212, "several copies of a small circular", { s: 10, c: GREY })}${T(ox + 115, 225, "DNA molecule in the matrix", { s: 10, c: GREY })}</g>`; },
      chloro: (ox) => `<g data-part="chloroplast"><ellipse cx="${ox + 115}" cy="130" rx="108" ry="58" fill="#e6f4e3" stroke="#3f7a55" stroke-width="3"/>${[0, 1, 2, 3].map((k) => `<g>${[0, 1, 2, 3].map((j) => `<rect x="${ox + 40 + k * 42}" y="${112 + j * 7 - (k % 2) * 14}" width="26" height="5" rx="2" fill="#7fb98a"/>`).join("")}</g>`).join("")}${loop(ox + 72, 166, 13, 10)}${loop(ox + 162, 166, 13, 10)}${T(ox + 115, 54, "Chloroplast", { s: 12, w: 700 })}${T(ox + 115, 212, "several copies of a circular DNA", { s: 10, c: GREY })}${T(ox + 115, 225, "molecule in the stroma", { s: 10, c: GREY })}</g>` };
    const keys = only ? [only] : ["prok", "mito", "chloro"]; const W = keys.length * 250; let s = `<svg viewBox="0 0 ${Math.max(W, 250)} 290" width="${only ? 300 : width}" role="img" aria-label="circular DNA molecules in ${keys.map((k) => ({ prok: "a prokaryotic cell", mito: "a mitochondrion", chloro: "a chloroplast" })[k]).join(", ")}">`;
    keys.forEach((k, i) => (s += panels[k](i * 250 + 10)));
    if (!only) s += T(W / 2, 22, "Shorter, circular DNA, not associated with histone proteins", { s: 12.5, w: 700 }) + T(W / 2, 276, "Schematic, not to scale. Double line: the two strands of the circular double helix.", { s: 10, c: GREY });
    return s + "</svg>"; };

  // ---- Genes, loci, exons, introns and repeats ----
  const geneMap = ({ width = 760, bare = false } = {}) => { uid(); const t = (...a) => (bare ? "" : T(...a)); let s = `<svg viewBox="0 0 760 ${bare ? 245 : 330}" width="${width}" role="img" aria-label="part of a eukaryotic DNA molecule with three genes at fixed loci separated by non-coding multiple repeats; one gene is enlarged to show coding exons separated by non-coding introns"><defs>${marker("gm-a", GREY)}</defs>`;
    s += T(380, 22, "Part of one DNA molecule in a eukaryotic chromosome", { s: 12.5, w: 700 });
    s += `<rect x="40" y="60" width="680" height="26" rx="13" fill="#eef1f5" stroke="${GREY}" stroke-width="1.5"/>`;
    const genes = [[110, 90, "gene A"], [330, 130, "gene B"], [580, 80, "gene C"]]; genes.forEach(([x, w, nm]) => (s += `<g data-part="gene"><rect x="${x}" y="60" width="${w}" height="26" fill="#cfe6f5" stroke="#2f5f8f" stroke-width="1.6"/>${t(x + w / 2, 78, nm, { s: 11, w: 700, c: "#2f5f8f" })}</g>`));
    const rep = (x0, x1) => { let r = ""; for (let x = x0; x + 14 <= x1; x += 18) r += `<rect x="${x}" y="66" width="14" height="14" rx="2" fill="#f3d9b5" stroke="${AMBER}"/>`; return `<g data-part="repeats">${r}</g>`; }; s += rep(214, 322) + rep(472, 574) + rep(48, 104) + rep(666, 714);
    if (!bare) s += L(395, 120, 395, 90, { c: GREY, w: 1, m: "gm-a" }) + T(395, 134, "locus of gene B: its fixed position on this DNA molecule", { s: 10.5, w: 700 }) + L(268, 44, 268, 62, { c: GREY, w: 1, m: "gm-a" }) + T(268, 40, "non-coding multiple repeats between genes", { s: 10.5, w: 700, c: "#9a6f1e" });
    s += `<path d="M330 88 L80 176 M460 88 L700 176" stroke="${GREY}" stroke-dasharray="4 3" fill="none"/>`;
    const parts = [["exon 1", 80, 110, 1], ["intron 1", 190, 120, 0], ["exon 2", 310, 80, 1], ["intron 2", 390, 170, 0], ["exon 3", 560, 140, 1]];
    parts.forEach(([nm, x, w, ex]) => (s += `<g data-part="${ex ? "exon" : "intron"}"><rect x="${x}" y="176" width="${w}" height="34" ${ex ? `fill="#2f5f8f"` : `fill="#fff" stroke="${GREY}" stroke-width="1.5" stroke-dasharray="5 3"`}/>${t(x + w / 2, 198, nm, { s: 11.5, w: 700, c: ex ? "#fff" : GREY })}</g>`));
    if (!bare) { s += T(380, 234, "Exons (solid) code for the amino acid sequence; introns (dashed) are non-coding sequences that separate them.", { s: 10.5, w: 600 });
      s += T(380, 254, "The whole gene, exons and introns, is copied into pre-mRNA; the introns are removed before translation (3.1.8.2).", { s: 10, c: GREY });
      s += T(380, 284, "A gene is a section of DNA that codes for a polypeptide. Most genes are at a fixed locus on a particular DNA molecule;", { s: 10, c: GREY }) + T(380, 298, "the same gene is found at the same locus on both chromosomes of a homologous pair. Schematic, not to scale:", { s: 10, c: GREY }) + T(380, 312, "in humans introns are usually much longer than exons, and only about 1–2 % of nuclear DNA codes for polypeptides.", { s: 10, c: GREY }); }
    return s + "</svg>"; };

  // ---- Replication in steps (semi-conservative). step 0–4 ----
  // Parent strands navy; new strands teal. The left part stays paired until helicase reaches it (fork drawn at index f).
  const REP = "ATGCAGTCGA";
  const replication = (step = 0, { seq = REP, width = 760, bare = false } = {}) => { uid(); const n = seq.length, dx = 54, x0 = 400 - ((n - 1) * dx) / 2, W = G.W, yc = 176, S = 69; const f = step === 0 ? n : 3; const bot = comp(seq);
    let s = `<svg viewBox="0 0 760 370" width="${width}" role="img" aria-label="${["a parental DNA molecule", "DNA helicase unwinding the molecule and breaking hydrogen bonds", "free DNA nucleotides pairing with exposed bases on both template strands", "DNA polymerase joining the new nucleotides into strands", "two DNA molecules, each with one original and one new strand"][step]}">`;
    if (step < 4) {
      const sep = (i) => (i >= f ? S : 0);
      const top = seq.split("").map((b, i) => ({ x: x0 + i * dx, y: yc - W / 2 - sep(i), b, dir: 1, col: NAVY })), bo = bot.split("").map((b, i) => ({ x: x0 + i * dx, y: yc + W / 2 + sep(i), b, dir: -1, col: NAVY }));
      top.forEach((t, i) => { if (i < f) s += pairBonds(t, bo[i]); });
      if (step >= 2) { // new nucleotides paired to the exposed bases of each template strand
        const nb = seq.split("").map((b, i) => ({ x: x0 + i * dx, y: yc + W / 2 - S, b: bot[i], dir: -1, col: TEAL, join: step >= 3 })).slice(f), nt = bot.split("").map((b, i) => ({ x: x0 + i * dx, y: yc - W / 2 + S, b: seq[i], dir: 1, col: TEAL, join: step >= 3 })).slice(f);
        nb.forEach((m, k) => (s += pairBonds(top[f + k], m))); nt.forEach((m, k) => (s += pairBonds(m, bo[f + k])));
        if (step === 2) { nb.forEach((m) => s += strand([m], { free: true })); nt.forEach((m) => s += strand([m], { free: true })); }
        else { s += strand(nb.slice().reverse()) + strand(nt); }
        if (step === 3) { const pol = (x, y) => `<g data-part="polymerase"><ellipse cx="${x}" cy="${y}" rx="48" ry="13" fill="#e8d7f0" stroke="#6a4a96" stroke-width="2" opacity=".95"/>${bare ? "" : T(x, y + 4, "DNA polymerase", { s: 9.5, w: 700, c: "#4a2f73" })}</g>`; s += pol(x0 + (n - 4.5) * dx, yc + W / 2 - S + G.r * 1.1) + pol(x0 + (n - 1.5) * dx, yc - W / 2 + S - G.r * 1.1); }
        if (step === 2) { [[x0 + 0.3 * dx, 46, "G", 1], [x0 + 1.7 * dx, 52, "T", 1], [x0 + 1.0 * dx, 300, "C", -1]].forEach(([x, y, b, d]) => (s += strand([{ x, y, b, dir: d, col: TEAL }], { free: true }))); s += T(x0 - 40, 28, "free DNA nucleotides", { s: 10.5, c: TEAL, a: "start", w: 700 }); }
      }
      s += strand(top, { ends: true }) + strand(bo.slice().reverse(), { ends: true });
      if (step >= 1) { const hx = x0 + (f - 0.5) * dx; s += `<g data-part="helicase"><path d="M${hx - 24} ${yc} l22 -26 l0 52z" fill="#f3d9b5" stroke="${AMBER}" stroke-width="2"/></g>`; if (!bare) s += T(hx + 16, yc - 2, "DNA", { s: 9.5, w: 700, c: "#7a5a12", a: "start" }) + T(hx + 16, yc + 10, "helicase", { s: 9.5, w: 700, c: "#7a5a12", a: "start" }); }
    } else {
      // two daughter molecules: each one old (navy) + one new (teal) strand
      s += ladder({ top: seq, x0, y0: 44, colTop: NAVY, colBot: TEAL, ends: true }) + ladder({ top: seq, x0, y0: 196, colTop: TEAL, colBot: NAVY, ends: true });
      s += T(40, 44 + W / 2 + 6, "1", { s: 18, w: 700 }) + T(40, 196 + W / 2 + 6, "2", { s: 18, w: 700 });
    }
    if (bare) return s + "</svg>";
    s += `<g>${L(560, 356, 580, 356, { c: NAVY, w: 4 })}${T(586, 360, "original strand", { s: 10, a: "start" })}${L(660, 356, 680, 356, { c: TEAL, w: 4 })}${T(686, 360, "new strand", { s: 10, a: "start" })}</g>`;
    s += T(24, 360, step < 4 ? "Drawn untwisted for clarity; in the cell the helix unwinds as the strands separate." : "Each molecule: one original (conserved) strand + one new strand.", { s: 10, c: GREY, a: "start" });
    return s + "</svg>"; };
  const repSteps = [
    { t: "The parent molecule", d: "Two complementary strands held together by hydrogen bonds between base pairs. Both strands will act as templates." },
    { t: "Unwinding and breaking hydrogen bonds", d: "DNA helicase unwinds the double helix and breaks the hydrogen bonds between complementary base pairs, so the two strands separate and the bases on each are exposed." },
    { t: "Free nucleotides pair with exposed bases", d: "Free DNA nucleotides are attracted to the exposed bases on each template strand and pair by complementary base pairing (A with T, C with G); hydrogen bonds form between them. They are not yet joined to each other." },
    { t: "DNA polymerase joins the nucleotides", d: "DNA polymerase joins adjacent new nucleotides to each other, building a new sugar-phosphate backbone along each template strand. (Supporting: the bonds formed between nucleotides are phosphodiester bonds.)" },
    { t: "Two molecules, each semi-conserved", d: "Each new DNA molecule contains one strand from the parent molecule and one newly made strand. The two molecules have the same base sequence as the parent and as each other." },
  ];

  // ---- Meselson–Stahl tubes ----
  // fractions {heavy, hybrid, light} or {dispersed: 15N fraction}; band positions: heavy 0.72, hybrid 0.56, light 0.40 of tube height
  const msTube = (x, fr, label, { h = 170, y0 = 40 } = {}) => { const Y = (p) => y0 + h * p; let s = `<g><path d="M${x - 16} ${y0} v${h - 16} a16 16 0 0 0 32 0 v-${h - 16}" fill="#f4f8fb" stroke="${GREY}" stroke-width="1.8"/>`;
    const band = (p, f) => f > 0.001 ? `<rect x="${x - 15}" y="${Y(p) - 2 - 3 * f}" width="30" height="${4 + 6 * f}" rx="2" fill="${NAVY}" opacity="${0.3 + 0.7 * f}"/>` : "";
    if ("dispersed" in fr) s += band(0.40 + 0.32 * fr.dispersed, 1); else s += band(0.72, fr.heavy) + band(0.56, fr.hybrid) + band(0.40, fr.light);
    return s + T(x, y0 + h + 22, label, { s: 10.5, w: 700 }) + "</g>"; };
  const meselsonFig = ({ model = "semi", gens = 3, width = 760, observed = false } = {}) => { const n = gens + 1, gap = 120, x0 = 380 - ((n - 1) * gap) / 2 + 40; let s = `<svg viewBox="0 0 760 270" width="${width}" role="img" aria-label="${observed ? "observed" : "predicted"} positions of DNA bands after density-gradient centrifugation for generations 0 to ${gens}">`;
    s += T(52, 40 + 170 * 0.40 + 4, "light (¹⁴N/¹⁴N)", { s: 10, c: GREY, a: "start" }) + T(52, 40 + 170 * 0.56 + 4, "hybrid", { s: 10, c: GREY, a: "start" }) + T(52, 40 + 170 * 0.72 + 4, "heavy (¹⁵N/¹⁵N)", { s: 10, c: GREY, a: "start" });
    [0.40, 0.56, 0.72].forEach((p) => (s += L(150, 40 + 170 * p, 720, 40 + 170 * p, { c: "#dfe6ec", w: 1, d: "3 3" })));
    for (let g = 0; g < n; g++) s += msTube(x0 + g * gap, meselson(model, g), `generation ${g}`);
    s += T(380, 22, observed ? "Observed (Meselson and Stahl, 1958): matches the semi-conservative prediction" : `Predicted bands if replication were ${{ semi: "semi-conservative", conservative: "conservative", dispersive: "dispersive" }[model]}`, { s: 12, w: 700 });
    s += T(380, 262, "Top of tube = less dense. Band darkness shows the proportion of DNA. Schematic positions.", { s: 10, c: GREY });
    return s + "</svg>"; };

  B.dnaArt = { T, L, marker, uid, G, BASECOL, BASENAME, pent, strand, ladder, pairBonds, dsDiagram, nucleotideGeneral, nucleotideDetail, numberMarks, polynucleotide, helix, mRNA, tRNA, tRNAgeom, packaging, circularDNA, geneMap, replication, repSteps, msTube, meselsonFig, REP, colours: { INK, GREY, TEAL, SAGE, NAVY, AMBER, ROSE } };
})(window.BIO);
