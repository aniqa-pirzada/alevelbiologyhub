// Shared model and artwork for 3.1.9 (Genetic diversity may arise by meiosis). Loaded before data/content/3.1.9.1.js,
// data/consolidation/3.1.9.js and js/views/interactives-meiosis.js. Every drawing is schematic SVG drawn in code from
// the chromosome model below, so that the counts printed beside a drawing and the drawing itself can never disagree.
//
// Conventions (checked against the OxfordAQA 9610 v5.1 wording, page 18, and standard A-level texts):
// - Chromosomes are counted by centromeres (drawn as dark bars or dots). A replicated chromosome (two sister chromatids
//   joined at one centromere) is ONE chromosome.
// - Maternal chromosomes are rose-red, paternal chromosomes blue. Members of a homologous pair have the same length,
//   the same centromere position and the same loci (white tags carry the allele letters).
// - Crossing over is drawn only between NON-SISTER chromatids of a homologous pair (the two inner chromatids of a pair).
//   The chiasma is drawn in the simplified textbook form: the two non-sister chromatids cross; they break and rejoin
//   there, exchanging equivalent sections. After the homologues separate, the exchanged sections show as two-colour
//   (recombinant) chromatids.
// - Spindle poles are drawn left and right; the equator is vertical. In the first division homologous pairs sit on the
//   equator with one homologue facing each pole; in the second division (and in mitosis) single chromosomes sit on the
//   equator with one sister chromatid facing each pole.
// - DNA content per cell is given in units of x, the DNA content of one haploid gamete: 2x before replication, 4x after
//   replication, 2x after the first division, x after the second division.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", NAVY = "#1e3a5f", AMBER = "#c8902a", MINT = "#d6efec";
  const MAT = "#c0504d", PAT = "#2f6db5", CELL = "#f8f3e6", CELLS = "#b49a63";
  const COL = { M: MAT, P: PAT, F1: "#1e3f7a", F2: "#6fa3dc", M1: "#8e2f2c", M2: "#e39a8f" };
  const W = 9, SP = 12; // chromatid stroke width; centre-to-centre spacing of sister chromatids
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}>${s}</text>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 1.5}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.cap ? ` stroke-linecap="${o.cap}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  // Marker ids are suffixed per drawing so that copies of one diagram on a page never share an id.
  let cnt = 0, U = ""; const uid = () => (U = "-m" + (++cnt));
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9z" fill="${col}"/></marker>`;
  const svg = (w, h, aria, inner, width = w) => `<svg viewBox="0 0 ${w} ${h}" width="${width}" role="img" aria-label="${aria}" style="max-width:100%;height:auto">${inner}</svg>`;

  // ================= MODEL =================
  // Model organisms. len = drawn length (px at scale 1); cen = centromere position as a fraction of the length from the
  // top; loci = gene loci with the maternal (M) and paternal (P) alleles; f = position of the chiasma when crossing over
  // is switched on for that pair (placed between two loci so that it produces a new combination of alleles).
  const ORGS = {
    two: { label: "2n = 4", pairs: [{ len: 92, cen: 0.38, f: 0.62, loci: [{ p: 0.13, M: "A", P: "a" }, { p: 0.84, M: "B", P: "b" }] }, { len: 54, cen: 0.26, loci: [{ p: 0.72, M: "D", P: "d" }] }] },
    three: { label: "2n = 6", pairs: [{ len: 92, cen: 0.38, f: 0.62, loci: [{ p: 0.13, M: "A", P: "a" }, { p: 0.84, M: "B", P: "b" }] }, { len: 54, cen: 0.26, loci: [{ p: 0.72, M: "D", P: "d" }] }, { len: 72, cen: 0.55, loci: [{ p: 0.2, M: "E", P: "e" }] }] },
    four: { label: "2n = 8", pairs: [{ len: 90, cen: 0.45, loci: [] }, { len: 70, cen: 0.3, loci: [] }, { len: 56, cen: 0.5, loci: [] }, { len: 34, cen: 0.2, loci: [] }] },
  };
  const homologue = (pair, o, rep = true) => ({ len: pair.len, cen: pair.cen, o, cds: Array.from({ length: rep ? 2 : 1 }, () => ({ segs: [{ a: 0, b: 1, o }], al: pair.loci.map((l) => ({ p: l.p, t: l[o] })), rec: false })) });
  // Crossing over between the inner (non-sister) chromatids: maternal chromatid 1 and paternal chromatid 0 exchange
  // the sections below the chiasma at fraction f.
  const crossPair = (pair, Mc, Pc) => {
    const f = pair.f; const other = { M: "P", P: "M" };
    const swap = (cd, o) => ({ segs: [{ a: 0, b: f, o }, { a: f, b: 1, o: other[o] }], al: pair.loci.map((l) => ({ p: l.p, t: l.p < f ? l[o] : l[other[o]] })), rec: true });
    Mc.cds[1] = swap(Mc.cds[1], "M"); Pc.cds[0] = swap(Pc.cds[0], "P");
  };
  const single = (c, i) => ({ len: c.len, cen: c.cen, o: c.o, cds: [c.cds[i]] });
  // Build every stage of meiosis for an organism and a state { cross: [bool per pair], orient: [bool per pair] }.
  // orient[i] true = the maternal homologue of pair i faces the left pole in the first division.
  function build(orgKey, state = {}) {
    const org = ORGS[orgKey] || orgKey; const n = org.pairs.length;
    const cross = state.cross || org.pairs.map(() => false); const orient = state.orient || org.pairs.map(() => true);
    const g1 = org.pairs.flatMap((p) => [homologue(p, "M", false), homologue(p, "P", false)]);
    const rep = org.pairs.flatMap((p) => [homologue(p, "M"), homologue(p, "P")]);
    const bivs = org.pairs.map((p, i) => { const M = homologue(p, "M"), P = homologue(p, "P"); const x = !!(cross[i] && p.f != null); if (x) crossPair(p, M, P); return { M, P, f: x ? p.f : null, i }; });
    const left = bivs.map((b, i) => (orient[i] ? b.M : b.P)), right = bivs.map((b, i) => (orient[i] ? b.P : b.M));
    const gametes = [left.map((c) => single(c, 0)), left.map((c) => single(c, 1)), right.map((c) => single(c, 0)), right.map((c) => single(c, 1))];
    return { org, n, cross, orient, g1, rep, bivs, divI: [left, right], gametes };
  }
  const alleles = (chrs) => chrs.flatMap((c) => c.cds[0].al.map((a) => a.t)).join(" ");
  const recombinant = (chrs) => chrs.some((c) => c.cds.some((cd) => cd.rec));
  // Counts per cell at each point (n = number of homologous pairs).
  const POINTS = ["g1", "rep", "paired", "cross", "metI", "afterI", "metII", "end"];
  const counts = (pt, n) => ({ g1: [1, 2 * n, 1, 2, "diploid"], rep: [1, 2 * n, 2, 4, "diploid"], paired: [1, 2 * n, 2, 4, "diploid"], cross: [1, 2 * n, 2, 4, "diploid"], metI: [1, 2 * n, 2, 4, "diploid"], afterI: [2, n, 2, 2, "haploid"], metII: [2, n, 2, 2, "haploid"], end: [4, n, 1, 1, "haploid"] }[pt]).reduce((o, v, i) => ((o[["cells", "chromosomes", "chromatidsPer", "dnaX", "ploidy"][i]] = v), o), {});
  const big = (n) => BigInt(2) ** BigInt(n);
  const fmt = (b) => String(b).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sci = (b) => { const s = String(b); if (s.length <= 6) return fmt(b); let e = s.length - 1; let m = Math.round(Number(s.slice(0, 4)) / 10); if (m >= 1000) { m = 100; e += 1; } const ms = String(m); return `${ms[0]}.${ms.slice(1, 3)} × 10${String(e).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("")}`; };
  B.meiosisModel = { ORGS, build, alleles, recombinant, counts, POINTS, combos: (n) => big(n), zygotes: (n) => big(n) * big(n), fmt, sci, homologue };

  // ================= DRAWING PRIMITIVES =================
  const colAt = (cd, p) => { const g = cd.segs.find((s) => p >= s.a && p <= s.b) || cd.segs[0]; return COL[g.o]; };
  const tag = (x, y, t, c) => `<rect x="${x - 5.5}" y="${y - 6.5}" width="11" height="13" rx="3" fill="#fff" stroke="${c}" stroke-width="1.4"/>` + T(x, y + 3.6, t, { s: 9.5, w: 700 });
  function chromatid(cd, x, y0, len, clip) {
    let s = "";
    for (const g of cd.segs) {
      let pieces = [[g.a, g.b]];
      if (clip) pieces = pieces.flatMap(([a, b]) => { const r = []; if (a < clip[0]) r.push([a, Math.min(b, clip[0])]); if (b > clip[1]) r.push([Math.max(a, clip[1]), b]); return r; });
      for (const [a, b] of pieces) if (b > a) s += `<line x1="${x}" y1="${(y0 + a * len).toFixed(1)}" x2="${x}" y2="${(y0 + b * len).toFixed(1)}" stroke="${COL[g.o]}" stroke-width="${W}"/>`;
    }
    return s + `<circle cx="${x}" cy="${y0}" r="${W / 2}" fill="${colAt(cd, 0)}"/><circle cx="${x}" cy="${y0 + len}" r="${W / 2}" fill="${colAt(cd, 1)}"/>`;
  }
  const centromere = (x, yc, two) => (two ? `<rect x="${x - SP / 2 - 3.5}" y="${yc - 4}" width="${SP + 7}" height="8" rx="4" fill="${INK}"/>` : `<circle cx="${x}" cy="${yc}" r="4.8" fill="${INK}"/>`);
  // One chromosome, top at y0, centred on x. o.cds overrides the chromatid order; o.clip = per-chromatid [a,b] gaps.
  function chr(c, x, y0, o = {}) {
    const cds = o.cds || c.cds; const two = cds.length === 2; const xs = two ? [x - SP / 2, x + SP / 2] : [x];
    let s = cds.map((cd, i) => chromatid(cd, xs[i], y0, c.len, o.clip && o.clip[i])).join("");
    s += centromere(x, y0 + c.cen * c.len, two);
    if (o.tags !== false) s += cds.map((cd, i) => cd.al.map((a) => tag(xs[i], y0 + a.p * c.len, a.t, colAt(cd, a.p))).join("")).join("");
    return s;
  }
  // A homologous pair side by side (the left homologue L, the right homologue R), with the recombinant chromatid of each
  // placed on the inside so that any exchange is between non-sister chromatids. chiasma: draw the crossing strands.
  const BD = 13; // half the distance between the centromeres of the two homologues in a pair
  function biv(Lc, Rc, x, y0, o = {}) {
    const ordL = Lc.cds[0].rec ? [Lc.cds[1], Lc.cds[0]] : Lc.cds; const ordR = Rc.cds[1].rec ? [Rc.cds[1], Rc.cds[0]] : Rc.cds;
    const f = o.f, len = Lc.len; let s = "";
    if (o.chiasma && f != null) {
      const d = 11 / len; const clip = [f - d, f + d];
      s += chr(Lc, x - BD, y0, { cds: ordL, clip: [null, clip], tags: o.tags }) + chr(Rc, x + BD, y0, { cds: ordR, clip: [clip, null], tags: o.tags });
      const xi = x - BD + SP / 2, xj = x + BD - SP / 2, ya = y0 + clip[0] * len, yb = y0 + clip[1] * len;
      s += `<line x1="${xi}" y1="${ya}" x2="${xj}" y2="${yb}" stroke="${colAt(ordL[1], clip[0] - 0.01)}" stroke-width="${W}" stroke-linecap="round"/>`;
      s += `<line x1="${xj}" y1="${ya}" x2="${xi}" y2="${yb}" stroke="${colAt(ordR[0], clip[0] - 0.01)}" stroke-width="${W}" stroke-linecap="round"/>`;
      // re-draw tags on top of the crossing strands
      if (o.tags !== false) s += [[ordL[1], xi], [ordR[0], xj]].map(([cd, xx]) => cd.al.map((a) => tag(xx, y0 + a.p * len, a.t, colAt(cd, a.p))).join("")).join("");
    } else s += chr(Lc, x - BD, y0, { cds: ordL, tags: o.tags }) + chr(Rc, x + BD, y0, { cds: ordR, tags: o.tags });
    return s;
  }
  const itemW = (it) => (it.biv ? 2 * BD + SP + W : it.c.cds.length === 2 ? SP + W : W);
  const itemLen = (it) => (it.biv ? it.L.len : it.c.len);
  const drawItem = (it, x, y0, tags) => (it.biv ? biv(it.L, it.R, x, y0, { f: it.f, chiasma: it.chiasma, tags }) : chr(it.c, x, y0, { tags }));

  // ---- Cells (local coordinates centred on 0,0) ----
  // layout "row": items side by side (interphase-like, pairing, daughter cells, gametes);
  // layout "stack": items on a vertical equator (first division: pairs; second division and mitosis: single chromosomes).
  function cell(items, o = {}) {
    const lay = o.layout || "row", tags = o.tags; let s = "", rx, ry;
    if (lay === "row") {
      const gap = o.gap || 30; const ws = items.map(itemW); const tot = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
      const hmax = Math.max(...items.map(itemLen)); rx = Math.max(tot / 2 + 48, o.minR || 60); ry = Math.max(hmax / 2 + 38, o.minR || 60);
      let x = -tot / 2; const jig = o.jig === false ? [0] : [-7, 6, -3, 8, -6, 4, -8, 5];
      items.forEach((it, i) => { const cx = x + ws[i] / 2; s += drawItem(it, cx, -itemLen(it) / 2 + jig[i % jig.length], tags); x += ws[i] + gap; });
    } else {
      const gap = 14; const tot = items.map(itemLen).reduce((a, b) => a + b, 0) + gap * (items.length - 1); const wmax = Math.max(...items.map(itemW));
      ry = tot / 2 + 26; rx = Math.max(wmax / 2 + 74, ry * 0.78, o.minR || 0); const px = rx - 15; let y = -tot / 2;
      let fib = "";
      items.forEach((it) => { const yc = y + (it.biv ? it.L.cen * it.L.len : it.c.cen * it.c.len);
        if (o.spindle !== false) { if (it.biv) { fib += L(-px, 0, -BD - SP / 2 - 3.5, yc, { c: "#9aa8b5", w: 1 }) + L(px, 0, BD + SP / 2 + 3.5, yc, { c: "#9aa8b5", w: 1 }); } else { fib += L(-px, 0, -SP / 2 - 3.5, yc, { c: "#9aa8b5", w: 1 }) + L(px, 0, SP / 2 + 3.5, yc, { c: "#9aa8b5", w: 1 }); } }
        s += drawItem(it, 0, y, tags); y += itemLen(it) + gap; });
      s = (o.spindle !== false ? fib + `<circle cx="${-px}" cy="0" r="4" fill="${GREY}"/><circle cx="${px}" cy="0" r="4" fill="${GREY}"/>` : "") + L(0, -ry + 8, 0, ry - 8, { c: AMBER, w: 1.2, d: "4 4" }) + s;
    }
    const env = o.envelope ? `<ellipse cx="0" cy="0" rx="${rx - 14}" ry="${ry - 14}" fill="none" stroke="${GREY}" stroke-width="1.2" stroke-dasharray="5 4"/>` : "";
    return { svg: `<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="${CELL}" stroke="${CELLS}" stroke-width="2"/>${env}${s}`, rx, ry };
  }
  const place = (c, cx, cy, k = 1) => `<g transform="translate(${cx} ${cy}) scale(${k})">${c.svg}</g>`;

  // Items for each point of meiosis from a build() result. side selects one daughter cell (0/1) or gamete (0–3).
  function stageItems(m, pt, side = 0) {
    if (pt === "g1") return m.g1.map((c) => ({ c }));
    if (pt === "rep") return m.rep.map((c) => ({ c }));
    if (pt === "paired") return m.bivs.map((b) => ({ biv: true, L: b.M, R: b.P, f: null }));
    if (pt === "cross") return m.bivs.map((b) => ({ biv: true, L: b.M, R: b.P, f: b.f, chiasma: true }));
    if (pt === "metI") return m.bivs.map((b, i) => ({ biv: true, L: m.orient[i] ? b.M : b.P, R: m.orient[i] ? b.P : b.M, f: b.f, chiasma: true }));
    if (pt === "afterI" || pt === "metII") return m.divI[side].map((c) => ({ c }));
    if (pt === "end") return m.gametes[side].map((c) => ({ c }));
    if (pt === "mitosis") { const r = m.rep; const mat = r.filter((c) => c.o === "M"), pat = r.filter((c) => c.o === "P"); return (r.length === 4 ? [r[0], r[3], r[1], r[2]] : [...mat, ...pat.slice(1), pat[0]]).map((c) => ({ c })); }
    return [];
  }
  // One cell at a given point, ready to place.
  function stageCell(m, pt, side = 0, o = {}) {
    const stack = pt === "metI" || pt === "metII" || pt === "mitosis";
    return cell(stageItems(m, pt, side), Object.assign({ layout: stack ? "stack" : "row", envelope: pt === "g1" || pt === "rep" || pt === "end" || o.envelope }, o));
  }
  // A single cell as a complete SVG (used by the counting challenge and by questions).
  function cellFigure(m, pt, side = 0, o = {}) {
    uid(); const c = stageCell(m, pt, side, o); const k = Math.min(o.k || 1, (o.maxH || 190) / c.ry); const w = Math.ceil(2 * c.rx * k + 24), hgt = Math.ceil(2 * c.ry * k + 24 + (o.caption ? 22 : 0));
    return svg(w, hgt, o.aria || "drawing of a cell with chromosomes", place(c, w / 2, c.ry * k + 12, k) + (o.caption ? T(w / 2, hgt - 8, o.caption, { s: 11, c: GREY }) : ""), o.width || w);
  }
  const legend = (x, y) => `<rect x="${x}" y="${y - 9}" width="22" height="9" rx="4" fill="${MAT}"/>` + T(x + 28, y, "maternal", { a: "start", s: 11 }) + `<rect x="${x + 92}" y="${y - 9}" width="22" height="9" rx="4" fill="${PAT}"/>` + T(x + 120, y, "paternal", { a: "start", s: 11 }) + `<rect x="${x + 186}" y="${y - 9}" width="20" height="9" rx="4" fill="${INK}"/>` + T(x + 212, y, "centromere", { a: "start", s: 11 });
  const arrow = (x1, y1, x2, y2, col = GREY) => L(x1, y1, x2, y2, { c: col, w: 2, m: "ma" });

  // ================= DIAGRAMS =================
  // D1. Overview: one diploid parent cell to four haploid cells, with the counts per cell under each panel.
  function overview() {
    uid(); const m = build("two", { cross: [true, false], orient: [true, true] }); const n = 2;
    let s = `<defs>${marker("ma", GREY)}</defs>`;
    const cols = [95, 280, 470, 660, 860]; const titles = [["Parent cell", "before DNA replication"], ["DNA has replicated", "each chromosome: 2 chromatids"], ["Homologous pairs form;", "crossing over"], ["After the first division", "homologous chromosomes separated"], ["After the second division", "sister chromatids separated"]];
    titles.forEach(([a, b], i) => { s += T(cols[i], 22, a, { s: 12.5, w: 700 }) + T(cols[i], 38, b, { s: 10.5, c: GREY }); });
    const c1 = stageCell(m, "g1"), c2 = stageCell(m, "rep"), c3 = stageCell(m, "cross");
    s += place(c1, cols[0], 200, 0.64) + place(c2, cols[1], 200, 0.6) + place(c3, cols[2], 200, 0.74);
    const d0 = stageCell(m, "afterI", 0, { envelope: true }), d1 = stageCell(m, "afterI", 1, { envelope: true });
    s += place(d0, cols[3], 125, 0.72) + place(d1, cols[3], 285, 0.72);
    const gy = [100, 190, 280, 370]; m.gametes.forEach((g, i) => { s += place(stageCell(m, "end", i, { minR: 50 }), cols[4] - 18, gy[i], 0.52) + T(cols[4] + 40, gy[i] + 4, m.gametes[i].map((c) => c.cds[0].al.map((a) => a.t).join("")).join(" "), { s: 10.5, w: 700, a: "start" }); });
    s += arrow(160, 200, 198, 200) + arrow(362, 200, 392, 200) + arrow(548, 186, 600, 140) + arrow(548, 214, 600, 270) + arrow(712, 115, 800, 100) + arrow(712, 135, 800, 185) + arrow(712, 275, 800, 275) + arrow(712, 295, 800, 362);
    s += T(560, 116, "division I", { s: 10.5, c: TEAL, w: 700 }) + T(760, 210, "division II", { s: 10.5, c: TEAL, w: 700 });
    // counts table
    const rows = [(c) => `${c.chromosomes} chromosomes per cell`, (c) => (c.chromatidsPer === 1 ? "1 chromatid per chromosome" : "2 chromatids per chromosome"), (c) => `DNA per cell: ${c.dnaX === 1 ? "x" : c.dnaX + "x"}`, (c) => c.ploidy];
    const pts = ["g1", "rep", "cross", "afterI", "end"]; s += `<rect x="8" y="420" width="944" height="94" rx="10" fill="#f4f7f9" stroke="#dfe6ec"/>`;
    rows.forEach((fn, r) => { const y = 440 + r * 21; pts.forEach((p, i) => { const c = counts(p, n); s += T(cols[i], y, fn(c), { s: r === 3 ? 12.5 : 11.5, w: r === 3 ? 700 : 500, c: r === 3 ? (c.ploidy === "diploid" ? NAVY : TEAL) : INK }); }); });
    s += legend(250, 536) + T(700, 536, "x = DNA content of one gamete", { s: 11, c: GREY });
    return svg(960, 546, "Overview of meiosis in a cell with two homologous pairs: a diploid parent cell replicates its DNA, homologous chromosomes pair and cross over, the first division separates homologous chromosomes into two haploid cells, and the second division separates sister chromatids to give four genetically different haploid cells; counts of chromosomes, chromatids and DNA are given under each panel", s);
  }

  // D2. Chromosome, chromatid and homologous pair.
  function homologues() {
    uid(); let s = `<defs>${marker("ma", GREY)}</defs>`; const p = ORGS.two.pairs[0], q = ORGS.two.pairs[1];
    const un = homologue(p, "M", false), rM = homologue(p, "M"), rP = homologue(p, "P"), other = homologue(q, "P");
    const y0 = 70;
    s += T(90, 26, "Before replication", { s: 12, w: 700 }) + T(90, 41, "1 chromosome =", { s: 10.5, c: GREY }) + T(90, 54, "1 DNA molecule", { s: 10.5, c: GREY });
    s += chr(un, 90, y0);
    s += T(270, 26, "After replication", { s: 12, w: 700 }) + T(270, 41, "still 1 chromosome,", { s: 10.5, c: GREY }) + T(270, 54, "made of 2 sister chromatids", { s: 10.5, c: GREY });
    s += chr(rM, 270, y0);
    s += L(250, y0 + 70, 216, y0 + 92, { c: GREY, w: 1 }) + T(212, y0 + 104, "sister chromatids", { s: 10.5, a: "end" }) + T(212, y0 + 117, "(identical copies)", { s: 10, a: "end", c: GREY });
    s += L(285, y0 + p.cen * p.len, 298, y0 + p.cen * p.len - 14, { c: GREY, w: 1 }) + T(301, y0 + p.cen * p.len - 16, "centromere", { s: 10.5, a: "start" });
    s += `<rect x="372" y="12" width="250" height="250" rx="12" fill="#f6f9fb" stroke="#dfe6ec"/>`;
    s += T(497, 32, "A homologous pair", { s: 12.5, w: 700 }) + T(497, 47, "(both replicated)", { s: 10.5, c: GREY });
    s += biv(rM, rP, 470, y0 + 4, {});
    const yA = y0 + 4 + 0.13 * p.len, yB = y0 + 4 + 0.84 * p.len;
    s += L(504, yA, 532, yA, { c: GREY, w: 1 }) + T(536, yA - 2, "same locus,", { s: 10, a: "start" }) + T(536, yA + 10, "alleles A and a", { s: 10, a: "start" });
    s += L(504, yB, 532, yB, { c: GREY, w: 1 }) + T(536, yB - 2, "same locus,", { s: 10, a: "start" }) + T(536, yB + 10, "alleles B and b", { s: 10, a: "start" });
    s += T(436, y0 + 112, "maternal", { s: 10.5, c: MAT, w: 700, a: "end" }) + T(505, y0 + 112, "paternal", { s: 10.5, c: PAT, w: 700, a: "start" });
    s += T(497, 196, "same length, same centromere position,", { s: 10.5 }) + T(497, 210, "same genes at the same loci;", { s: 10.5 }) + T(497, 224, "the alleles may differ", { s: 10.5 }) + T(497, 246, "one from each parent", { s: 10.5, c: GREY });
    s += T(700, 26, "Not homologous", { s: 12, w: 700 }) + T(700, 41, "with the pair shown", { s: 10.5, c: GREY });
    s += chr(other, 700, y0 + 10);
    s += T(700, y0 + 84, "different length,", { s: 10.5 }) + T(700, y0 + 98, "centromere and genes", { s: 10.5 });
    s += legend(250, 290);
    return svg(780, 300, "An unreplicated chromosome, a replicated chromosome made of two sister chromatids joined at a centromere, a homologous pair (one maternal and one paternal chromosome of the same length and centromere position carrying alleles A and a, and B and b, at the same loci) and a shorter chromosome that is not homologous with them", s);
  }

  // D3. Crossing over in three steps.
  function crossing() {
    uid(); let s = `<defs>${marker("ma", GREY)}</defs>`; const p = ORGS.two.pairs[0];
    const M0 = homologue(p, "M"), P0 = homologue(p, "P"); const M1 = homologue(p, "M"), P1 = homologue(p, "P"); crossPair(p, M1, P1);
    const y0 = 66; const xs = [120, 380, 640];
    [["1  Homologous chromosomes pair", "4 chromatids side by side"], ["2  Non-sister chromatids cross", "at a chiasma, break and rejoin"], ["3  Sections have been exchanged", "new combinations of alleles"]].forEach(([a, b], i) => { s += T(xs[i], 22, a, { s: 12, w: 700 }) + T(xs[i], 38, b, { s: 10.5, c: GREY }); });
    s += biv(M0, P0, xs[0], y0, {});
    // panel 2: the crossing strands of the two non-sister chromatids, each keeping its own colour
    s += biv(M1, P1, xs[1], y0, { f: p.f, chiasma: true });
    const yf = y0 + p.f * p.len; s += L(xs[1] + 2, yf + 2, xs[1] + 46, yf + 64, { c: GREY, w: 1 }) + T(xs[1] + 48, yf + 76, "chiasma", { s: 11, a: "start", w: 700 });
    // panel 3: homologues drawn apart so that each chromatid can be read
    const pl = (c, x) => chr(c, x, y0, { cds: c.cds });
    s += pl({ ...M1, cds: [M1.cds[0], M1.cds[1]] }, xs[2] - 34) + pl({ ...P1, cds: [P1.cds[0], P1.cds[1]] }, xs[2] + 34);
    s += T(xs[2] - 34, y0 + p.len + 24, "maternal", { s: 10.5, c: MAT, w: 700 }) + T(xs[2] + 34, y0 + p.len + 24, "paternal", { s: 10.5, c: PAT, w: 700 });
    s += T(xs[2], y0 + p.len + 46, "AB and ab: parental", { s: 10.5 }) + T(xs[2], y0 + p.len + 61, "Ab and aB: recombinant (new)", { s: 10.5, w: 700 });
    s += arrow(175, 112, 335, 112) + arrow(430, 112, 580, 112);
    s += T(390, 246, "Only non-sister chromatids (one from each homologue) exchange sections; sister chromatids of one chromosome do not.", { s: 10.5, c: GREY });
    s += legend(250, 272);
    return svg(780, 282, "Crossing over in three steps: a homologous pair of replicated chromosomes carrying alleles A and B (maternal) and a and b (paternal); two non-sister chromatids cross at a chiasma, break and rejoin; the result is four chromatids with allele combinations AB, Ab, aB and ab, two of them recombinant", s);
  }

  // D4. Independent segregation: two possible orientations of two pairs give four combinations.
  function segregation() {
    uid(); let s = `<defs>${marker("ma", GREY)}</defs>`;
    const rows = [[true, true], [true, false]]; const ys = [130, 340];
    s += T(130, 22, "First division: pairs on the equator", { s: 12, w: 700 }) + T(400, 22, "Two haploid cells", { s: 12, w: 700 }) + T(640, 22, "Gametes (after the second division)", { s: 12, w: 700 });
    rows.forEach((orient, r) => { const m = build("two", { cross: [false, false], orient }); const y = ys[r];
      s += T(18, y - 86, r === 0 ? "Arrangement 1" : "Arrangement 2", { s: 11, w: 700, a: "start", c: TEAL });
      s += place(stageCell(m, "metI", 0, { tags: false }), 130, y, 0.62);
      s += place(stageCell(m, "afterI", 0, { tags: false, minR: 52, jig: false }), 400, y - 50, 0.55) + place(stageCell(m, "afterI", 1, { tags: false, minR: 52, jig: false }), 400, y + 50, 0.55);
      s += arrow(212, y - 10, 340, y - 44) + arrow(212, y + 10, 340, y + 44) + arrow(452, y - 50, 562, y - 50) + arrow(452, y + 50, 562, y + 50);
      const desc = (cs) => cs.map((c, k) => (c.o === "M" ? "maternal" : "paternal") + (k === 0 ? " long" : " short")).join(" + ");
      s += place(stageCell(m, "end", 0, { tags: false, minR: 44, jig: false }), 610, y - 50, 0.5) + T(660, y - 54, desc(m.divI[0]), { s: 10, a: "start" }) + T(660, y - 41, "(×2)", { s: 10, a: "start", c: GREY });
      s += place(stageCell(m, "end", 2, { tags: false, minR: 44, jig: false }), 610, y + 50, 0.5) + T(660, y + 46, desc(m.divI[1]), { s: 10, a: "start" }) + T(660, y + 59, "(×2)", { s: 10, a: "start", c: GREY }); });
    s += L(16, 236, 944, 236, { c: "#dfe6ec", w: 1 });
    s += T(480, 462, "Each pair lines up independently of the other, so either homologue can face either pole: 2 pairs give 2² = 4 combinations of maternal and paternal chromosomes.", { s: 11 });
    s += T(480, 479, "Crossing over is left out here so that independent segregation can be seen on its own.", { s: 10.5, c: GREY }) + legend(330, 502);
    return svg(960, 512, "Independent segregation: two homologous pairs can line up on the equator in two different arrangements; arrangement 1 gives gametes with both maternal chromosomes or both paternal chromosomes, arrangement 2 gives gametes with one maternal and one paternal chromosome; four combinations in total", s);
  }

  // D5. DNA content per cell through meiosis.
  function dnaGraph() {
    uid(); let s = `<defs>${marker("ma", INK)}</defs>`; const x0 = 90, y0 = 260, sx = 1, sy = 50; // 1x = 50 px
    s += L(x0, y0, x0, 30, { m: "ma" }) + L(x0, y0, 720, y0, { m: "ma" });
    [0, 1, 2, 3, 4].forEach((k) => { s += L(x0 - 5, y0 - k * sy, x0, y0 - k * sy) + T(x0 - 10, y0 - k * sy + 4, k === 0 ? "0" : k === 1 ? "x" : k + "x", { a: "end", s: 11.5 }); if (k) s += L(x0, y0 - k * sy, 700, y0 - k * sy, { c: "#e6ecf1", w: 1 }); });
    s += T(30, 150, "DNA content per cell", { s: 11.5, w: 600 }).replace("<text", `<text transform="rotate(-90 30 150)"`);
    const pts = [[x0, 2], [190, 2], [270, 4], [420, 4], [420, 2], [560, 2], [560, 1], [690, 1]]; void sx;
    s += `<polyline points="${pts.map(([x, v]) => `${x},${y0 - v * sy}`).join(" ")}" fill="none" stroke="${TEAL}" stroke-width="3" stroke-linejoin="round"/>`;
    s += T(140, y0 + 18, "parent cell", { s: 10.5 }) + T(230, y0 + 18, "DNA replication", { s: 10.5 }) + T(345, y0 + 18, "pairing, crossing over", { s: 10.5 }) + T(420, y0 + 34, "first division", { s: 10.5, w: 700, c: TEAL }) + T(490, y0 + 18, "two cells", { s: 10.5 }) + T(560, y0 + 34, "second division", { s: 10.5, w: 700, c: TEAL }) + T(625, y0 + 18, "four cells", { s: 10.5 });
    s += T(140, y0 - 2 * sy - 8, "2x (diploid)", { s: 10.5 }) + T(345, y0 - 4 * sy - 8, "4x", { s: 10.5, w: 700 }) + T(490, y0 - 2 * sy - 8, "2x (haploid, 2 chromatids)", { s: 10.5 }) + T(625, y0 - sy - 8, "x (gamete)", { s: 10.5, w: 700 });
    s += T(724, y0 + 4, "time", { s: 11, a: "start" }) + T(400, 312, "x = the DNA content of one haploid gamete. Each division halves the DNA in a cell; only the first halves the chromosome number.", { s: 10.5, c: GREY });
    return svg(760, 322, "Graph of DNA content per cell through meiosis: 2x in the parent cell, rising to 4x during DNA replication, falling to 2x at the first division and to x at the second division", s);
  }

  // D6. Random fertilisation: 4 kinds of sperm × 4 kinds of egg = 16 combinations (n = 2, crossing over ignored).
  function fertilisation() {
    uid(); let s = ""; const stick = (x, y, len, c) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + len}" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
    const gam = (x, y, a, b, r = 22) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${CELL}" stroke="${CELLS}" stroke-width="1.5"/>` + stick(x - 6, y - 14, 28, a) + stick(x + 6, y - 8, 16, b);
    const F = [["F1", "F1"], ["F1", "F2"], ["F2", "F1"], ["F2", "F2"]], Mo = [["M1", "M1"], ["M1", "M2"], ["M2", "M1"], ["M2", "M2"]];
    const gx = 360, gy = 142, dx = 150, dy = 80;
    s += T(gx + 1.5 * dx, 26, "Sperm from the father: 2² = 4 kinds", { s: 12, w: 700, c: NAVY });
    s += T(130, gy + 1.5 * dy - 10, "Eggs from the", { s: 12, w: 700, c: MAT }) + T(130, gy + 1.5 * dy + 6, "mother: 4 kinds", { s: 12, w: 700, c: MAT });
    F.forEach(([a, b], i) => { s += gam(gx + i * dx, 66, COL[a], COL[b]); });
    Mo.forEach(([a, b], j) => { s += gam(250, gy + j * dy, COL[a], COL[b]); });
    F.forEach(([a, b], i) => Mo.forEach(([c, d], j) => { const x = gx + i * dx, y = gy + j * dy; s += `<rect x="${x - 44}" y="${y - 30}" width="88" height="60" rx="10" fill="#fff" stroke="#dfe6ec"/>` + stick(x - 24, y - 18, 34, COL[a]) + stick(x - 12, y - 18, 34, COL[c]) + stick(x + 12, y - 9, 18, COL[b]) + stick(x + 24, y - 9, 18, COL[d]); }));
    s += T(480, 436, "In this grid only: blue = from the father, red = from the mother; the shade shows which grandparent each chromosome came from.", { s: 10.5, c: GREY, w: 700 }) + T(480, 455, "Any sperm can fuse with any egg: 4 × 4 = 16 combinations of chromosomes in the zygote, (2ⁿ)² with n = 2. Crossing over is ignored.", { s: 11 });
    const key = (x, c, t) => `<rect x="${x}" y="470" width="20" height="8" rx="4" fill="${c}"/>` + T(x + 26, 478, t, { a: "start", s: 10.5 });
    s += key(70, COL.F1, "father's chromosome from his father") + key(320, COL.F2, "from his mother") + key(470, COL.M1, "mother's chromosome from her father") + key(730, COL.M2, "from her mother");
    return svg(960, 486, "Grid showing random fertilisation: four kinds of sperm, each with a different combination of the father's two chromosomes, and four kinds of egg combine to give sixteen different zygotes", s);
  }

  // D7. Telling the divisions apart in a drawing.
  function whichDivision() {
    uid(); let s = ""; const m = build("two", { cross: [true, false], orient: [true, false] });
    const xs = [160, 480, 800];
    const head = [["First division of meiosis", "homologous chromosomes in pairs on the equator"], ["Second division of meiosis", "single chromosomes on the equator; haploid number"], ["Mitosis (3.2.10, for comparison)", "single chromosomes on the equator; diploid number"]];
    head.forEach(([a, b], i) => { s += T(xs[i], 24, a, { s: 12.5, w: 700, c: i === 2 ? GREY : INK }) + T(xs[i], 40, b, { s: 10.5, c: GREY }); });
    [["metI", xs[0]], ["metII", xs[1]], ["mitosis", xs[2]]].forEach(([pt, x]) => { const c = stageCell(m, pt, 0, { tags: false }); s += place(c, x, 182, Math.min(0.8, 128 / c.ry)); });
    const facts = [["4 chromosomes (count the centromeres)", "each chromosome: 2 chromatids", "diploid: homologues side by side, one each", "side of the equator; chiasmata visible"], ["2 chromosomes", "each chromosome: 2 chromatids", "haploid: no two chromosomes match", "(sister chromatids may differ: crossing over)"], ["4 chromosomes", "each chromosome: 2 chromatids", "diploid: matching chromosomes present", "but NOT paired; no chiasmata"]];
    facts.forEach((f, i) => f.forEach((t, k) => { s += T(xs[i], 330 + k * 16, t, { s: 10.5, w: k === 0 ? 700 : 500 }); }));
    s += T(480, 404, "Spindle poles left and right (grey dots); dashed line = equator.", { s: 10.5, c: GREY }) + T(480, 419, "Whole homologues face opposite poles in the first division; sister chromatids face opposite poles in the second division and in mitosis.", { s: 10.5, c: GREY });
    s += legend(330, 444);
    return svg(960, 454, "Three dividing cells compared: in the first division of meiosis homologous pairs sit on the equator; in the second division the haploid number of single chromosomes sits on the equator; in mitosis the diploid number of single chromosomes sits on the equator without pairing", s);
  }

  // Labelling figure: a homologous pair with a chiasma and numbered markers.
  function labelPair() {
    uid(); const p = ORGS.two.pairs[0]; const M1 = homologue(p, "M"), P1 = homologue(p, "P"); crossPair(p, M1, P1);
    const x = 300, y0 = 56; let s = biv(M1, P1, x, y0, { f: p.f, chiasma: true });
    const num = (cx, cy, n) => `<circle cx="${cx}" cy="${cy}" r="12" fill="${NAVY}"/>` + T(cx, cy + 4.5, n, { s: 12, w: 700, c: "#fff" });
    const yc = y0 + p.cen * p.len, yf = y0 + p.f * p.len, yA = y0 + p.loci[0].p * p.len;
    s += L(x + BD + SP / 2 + 4, yc, 420, yc - 20, { c: GREY, w: 1 }) + num(432, yc - 24, 1);
    s += L(x + 2, yf + 2, 420, yf + 26, { c: GREY, w: 1 }) + num(432, yf + 28, 2);
    const xl = x - BD; s += `<path d="M${xl - SP / 2 - 6} ${y0 - 10} v-6 h${SP + 12} v6" fill="none" stroke="${GREY}" stroke-width="1.2"/>` + L(xl, y0 - 16, xl - 60, y0 - 26, { c: GREY, w: 1 }) + num(xl - 72, y0 - 28, 3);
    s += L(xl - SP / 2 - 6, yA, 210, yA + 30, { c: GREY, w: 1 }) + num(198, yA + 34, 4);
    s += `<path d="M${x - 34} ${y0 + p.len + 14} v8 h68 v-8" fill="none" stroke="${GREY}" stroke-width="1.2"/>` + L(x, y0 + p.len + 22, x, y0 + p.len + 36, { c: GREY, w: 1 }) + num(x, y0 + p.len + 48, 5);
    s += legend(190, 222);
    return svg(600, 232, "A homologous pair of replicated chromosomes with a chiasma; numbered markers point to the centromere (1), the chiasma (2), the two chromatids of the left chromosome (3), a gene locus tag (4) and the whole pair (5)", s, 600);
  }

  B.meiosisArt = { overview, homologues, crossing, segregation, dnaGraph, fertilisation, whichDivision, labelPair, cell, place, stageCell, stageItems, cellFigure, legend, chr, biv, colours: { MAT, PAT, INK, GREY, TEAL, NAVY, AMBER, MINT, CELL, CELLS }, uid: () => uid(), marker: (id, c) => marker(id, c), svg, T, L };
})(window.BIO);
