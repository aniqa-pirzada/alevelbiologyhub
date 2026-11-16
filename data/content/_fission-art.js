// Shared model and artwork for 3.2.10.3 Binary fission (Phase 4 Batch 4, owned by the 3.2.10.3 author). Loaded before
// data/content/3.2.10.3.js, data/consolidation/3.2.10.js and js/views/interactives-fission.js.
//
// B.fissionModel: a SIMPLIFIED, seeded model of plasmid sharing in binary fission (an illustration, never a measurement).
//   Assumptions (stated on the page and in the simulator):
//   - every cell divides once per generation, all at the same time; no cell dies; no mutation;
//   - the circular chromosomal DNA is replicated exactly once and each daughter cell receives one copy;
//   - default mode: every plasmid is copied exactly once before division, so a cell with p plasmids has 2p at division;
//     optional "copy-number control" mode (supporting): a cell that has at least one plasmid makes copies until it has
//     2 × the starting number before it divides (a cell with none can make none);
//   - the 2p plasmids are shared at random: each one independently goes to either daughter with probability 0.5
//     (a reasonable picture for small plasmids present in many copies; many real plasmids also have partitioning
//     systems that make sharing more even, stretch).
// B.fissionArt: original schematic SVG drawings (not to scale). Bacteria are drawn as rods: a thick outer cell wall, a
//   thin cell-surface membrane just inside it, cytoplasm with ribosomes (small amber dots), one circular chromosome (a
//   closed navy loop, drawn folded to show it is long) and small purple rings for plasmids. Mitosis drawings follow the
//   3.1.9 conventions (poles left and right, equator vertical, maternal red, paternal blue, chromosomes counted by
//   centromeres).
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5f6f7f", WALL = "#3f6f62", MEMB = "#86b3a5", CYTO = "#eef6f1", DNA = "#1e3a5f";
  const PLAS = "#7b3f98", RIBO = "#c8902a", PILUS = "#b4504f", RES = "#d0661a", TEAL = "#1f8a8a", AMBER = "#b07a1c";
  const CYTO2 = "#f6efe0", WALL2 = "#8a6a2f"; // a second species (recipient of another species)
  const MAT = "#c0504d", PAT = "#2f6db5", ECELL = "#f8f3e6", ESTROKE = "#a88f5c";

  // ---------------- model ----------------
  // mulberry32, the same generator as B.statsModel.rng, so a seed always gives the same result
  const rng = (seed = 1) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // copies made before division
  const replicate = (p, opts = {}) => (opts.control ? (p > 0 ? 2 * (opts.target || p) : 0) : 2 * p);
  // share n plasmids at random between two daughters
  const share = (n, r) => { let a = 0; for (let i = 0; i < n; i++) if (r() < 0.5) a++; return [a, n - a]; };
  const divide = (cell, r, opts = {}) => { const n = replicate(cell.p, opts); const [a, b] = share(n, r); return [{ p: a, chrom: 1 }, { p: b, chrom: 1 }]; };
  // generations: gens[g] = array of cells (each {p, chrom, parent index}); 2^g cells in generation g
  const grow = ({ p0 = 4, gens = 5, seed = 1, control = false } = {}) => {
    const r = rng(seed); const out = [[{ p: p0, chrom: 1, parent: -1 }]];
    for (let g = 1; g <= gens; g++) { const next = []; out[g - 1].forEach((c, i) => divide(c, r, { control, target: p0 }).forEach((d) => next.push(Object.assign(d, { parent: i })))); out.push(next); }
    return out;
  };
  const stats = (cells) => { const ps = cells.map((c) => c.p); const tot = ps.reduce((a, b) => a + b, 0); const dist = {}; ps.forEach((p) => (dist[p] = (dist[p] || 0) + 1));
    return { cells: cells.length, chrom: cells.length, total: tot, mean: tot / cells.length, min: Math.min(...ps), max: Math.max(...ps), none: ps.filter((p) => p === 0).length, dist }; };
  // number of cells after n divisions from N0 cells (every cell divides every generation)
  const cellsAfter = (n, N0 = 1) => N0 * 2 ** n;
  B.fissionModel = { rng, replicate, share, divide, grow, stats, cellsAfter };

  // ---------------- drawing helpers ----------------
  let cnt = 0, U = ""; const uid = () => (U = "-fz" + (++cnt));
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 13}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}>${s}</text>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 1.5}"${o.d ? ` stroke-dasharray="${o.d}"` : ""} stroke-linecap="round"${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const marker = (id, col) => `<marker id="${id}${U}" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto"><path d="M0 0 L12 6 L0 12z" fill="${col}"/></marker>`;
  const defs = () => `<defs>${marker("ar", INK)}${marker("arg", GREY)}${marker("arp", PLAS)}${marker("art", TEAL)}</defs>`;
  const svg = (w, h, aria, inner, width = w) => `<svg viewBox="0 0 ${w} ${h}" width="${width}" role="img" aria-label="${aria}" style="max-width:100%;height:auto">${inner}</svg>`;
  const badge = (x, y, n, c = TEAL) => `<circle cx="${x}" cy="${y}" r="12" fill="${c}"/>` + T(x, y + 4.5, n, { s: 13, w: 700, c: "#fff" });
  // pseudo-random but fixed scatter (so every drawing is identical each time it is made)
  const scatter = (n, seed, w, h) => { const r = rng(seed); return Array.from({ length: n }, () => [(r() - 0.5) * w, (r() - 0.5) * h]); };

  // a folded closed loop = circular DNA. cx, cy centre; rx, ry size; k folding
  const loop = (cx, cy, rx, ry, o = {}) => { const k = o.k || 5, ph = o.ph || 0, N = 72; let d = "";
    for (let i = 0; i <= N; i++) { const t = (i / N) * 2 * Math.PI; const f = 1 + 0.2 * Math.sin(k * t + ph) + 0.08 * Math.sin(3 * t + 1 + ph); d += (i ? "L" : "M") + (cx + rx * f * Math.cos(t)).toFixed(1) + " " + (cy + ry * f * Math.sin(t)).toFixed(1); }
    return `<path d="${d}Z" fill="none" stroke="${o.c || DNA}" stroke-width="${o.w || 2.4}" stroke-linejoin="round"/>`; };
  const plasmid = (x, y, o = {}) => `<circle cx="${x}" cy="${y}" r="${o.r || 5}" fill="#fff" stroke="${PLAS}" stroke-width="${o.w || 2.8}"/>` + (o.res ? `<path d="M${x - (o.r || 5)} ${y} A${o.r || 5} ${o.r || 5} 0 0 1 ${x} ${y - (o.r || 5)}" fill="none" stroke="${RES}" stroke-width="${(o.w || 2.8) + 0.6}"/>` : "");
  // rod-shaped bacterium centred on (cx, cy). o.chroms: [[dx, dy, rx, ry]]; o.plas: [[dx, dy]]; o.septum: 0–1 (wall growing in)
  const rod = (cx, cy, w, h, o = {}) => {
    const x = cx - w / 2, y = cy - h / 2, fill = o.fill || CYTO, wall = o.wall || WALL; let s = "";
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${wall}" stroke-width="4.5"/>`;
    s += `<rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" rx="${(h - 10) / 2}" fill="none" stroke="${MEMB}" stroke-width="1.6"/>`;
    if (o.ribo !== false) scatter(Math.round((w * h) / 300), o.seed || 7, w - 2 * h * 0.35, h - 20).forEach(([dx, dy]) => (s += `<circle cx="${(cx + dx).toFixed(1)}" cy="${(cy + dy).toFixed(1)}" r="1.9" fill="${RIBO}"/>`));
    (o.chroms || []).forEach(([dx, dy, rx, ry, ph]) => (s += loop(cx + dx, cy + dy, rx, ry, { ph: ph || 0 })));
    (o.plas || []).forEach(([dx, dy, res]) => (s += plasmid(cx + dx, cy + dy, { res: res || o.res })));
    if (o.septum) { const d = (h / 2 - 2) * o.septum; s += `<path d="M${cx - 5} ${y} L${cx + 5} ${y} L${cx + 2} ${y + d} L${cx - 2} ${y + d}Z" fill="${wall}"/><path d="M${cx - 5} ${y + h} L${cx + 5} ${y + h} L${cx + 2} ${y + h - d} L${cx - 2} ${y + h - d}Z" fill="${wall}"/>`; }
    return s;
  };
  // two daughter cells side by side
  const pair = (cx, cy, w, h, pa, pb, o = {}) => { const g = o.gap || 8, xa = cx - g / 2 - w / 2, xb = cx + g / 2 + w / 2;
    const spots = (n, s) => scatter(n, s, w - h * 0.9, h - 24).map(([dx, dy]) => [dx, dy]);
    return rod(xa, cy, w, h, { chroms: [[0, 0, w * 0.2, h * 0.24]], plas: spots(pa, 31 + pa), seed: 3, res: o.res }) + rod(xb, cy, w, h, { chroms: [[0, 0, w * 0.2, h * 0.24, 1]], plas: spots(pb, 41 + pb), seed: 5, res: o.res }); };

  // ---------------- 1. binary fission stages (2 columns x 3 rows) ----------------
  const fissionStages = () => { uid(); const W = 480, PW = 240, PH = 215; let s = defs();
    const cap = (i, a, b) => { const cx = (i % 2) * PW + PW / 2, y0 = Math.floor(i / 2) * PH; return T(cx, y0 + 168, a, { s: 13.5 }) + T(cx, y0 + 186, b, { s: 13.5 }) + badge((i % 2) * PW + 22, y0 + 22, i + 1); };
    const C = (i) => [(i % 2) * PW + PW / 2, Math.floor(i / 2) * PH + 92];
    let [x, y] = C(0); s += rod(x, y, 150, 64, { chroms: [[0, 0, 26, 15]], plas: [[-50, -12], [48, 12]], seed: 11 }) + cap(0, "Parent cell: one circular DNA", "molecule and two plasmids");
    [x, y] = C(1); s += rod(x, y, 164, 64, { chroms: [[-9, -2, 26, 14], [9, 3, 26, 14, 2]], plas: [[-56, -13], [-47, -8], [50, 10], [59, 15]], seed: 12 }) + cap(1, "The circular DNA and the", "plasmids replicate");
    [x, y] = C(2); s += rod(x, y, 206, 64, { chroms: [[-48, 0, 24, 14], [48, 0, 24, 14, 2]], plas: [[-88, -10], [-6, 14], [12, -16], [86, 10]], seed: 13 }) + cap(2, "The cell grows longer and the", "two DNA copies move apart");
    [x, y] = C(3); s += rod(x, y, 206, 64, { chroms: [[-50, 0, 24, 14], [50, 0, 24, 14, 2]], plas: [[-88, -10], [-22, 14], [-20, -16], [86, 10]], seed: 13, septum: 0.75 }) + cap(3, "Membrane and wall grow in", "across the middle");
    [x, y] = C(4); s += pair(x, y, 100, 60, 3, 1) + cap(4, "Cytoplasm divides: two cells,", "each with one circular DNA");
    // key
    const kx = PW + 28, ky = 2 * PH + 34; s += T(kx - 6, ky - 8, "Key", { a: "start", s: 14, w: 700 });
    s += `<rect x="${kx}" y="${ky + 4}" width="34" height="16" rx="8" fill="${CYTO}" stroke="${WALL}" stroke-width="4"/>` + T(kx + 46, ky + 17, "cell wall (outer line)", { a: "start", s: 13 });
    s += `<line x1="${kx}" y1="${ky + 37}" x2="${kx + 34}" y2="${ky + 37}" stroke="${MEMB}" stroke-width="2.2"/>` + T(kx + 46, ky + 42, "cell-surface membrane", { a: "start", s: 13 });
    s += loop(kx + 17, ky + 63, 13, 8) + T(kx + 46, ky + 67, "circular DNA", { a: "start", s: 13 });
    s += plasmid(kx + 17, ky + 88) + T(kx + 46, ky + 92, "plasmid", { a: "start", s: 13 });
    s += `<circle cx="${kx + 17}" cy="${ky + 110}" r="2.6" fill="${RIBO}"/>` + T(kx + 46, ky + 115, "ribosome", { a: "start", s: 13 });
    s += T(kx - 6, ky + 146, "Schematic, not to scale.", { a: "start", s: 12, c: GREY });
    return svg(W, 3 * PH, "Five numbered stages of binary fission in a rod-shaped bacterium, with a key", s); };

  // ---------------- 2. plasmid sharing: numbers may vary ----------------
  const plasmidSharing = () => { uid(); const W = 480, H = 400; let s = defs();
    s += rod(110, 70, 150, 60, { chroms: [[0, 0, 24, 14]], plas: [[-50, -10], [44, 13], [-14, 16]], seed: 21 }) + T(110, 128, "Parent: 3 plasmids", { s: 14, w: 600 });
    s += L(196, 70, 266, 70, { m: "ar", w: 2 }) + T(231, 58, "replicate", { s: 12.5, c: GREY });
    s += rod(370, 70, 166, 60, { chroms: [[-9, -2, 24, 13], [9, 3, 24, 13, 2]], plas: [[-58, -10], [-50, -2], [46, 13], [55, 6], [-16, 17], [-6, 19]], seed: 22 }) + T(370, 128, "6 plasmids before division", { s: 14, w: 600 });
    s += T(W / 2, 170, "Three of the possible ways the 6 plasmids can be shared:", { s: 14, w: 700 });
    [[3, 3, "3 and 3"], [4, 2, "4 and 2"], [6, 0, "6 and 0"]].forEach(([a, b, lab], i) => { const cx = 80 + i * 160; s += `<rect x="${cx - 76}" y="190" width="152" height="120" rx="12" fill="#fff" stroke="#c9d6d2" stroke-width="1.5"/>` + pair(cx, 240, 66, 44, a, b, { gap: 6 }) + T(cx, 290, lab, { s: 15, w: 700 }); });
    s += T(W / 2, 340, "Every daughter cell has ONE copy of the circular DNA;", { s: 13.5 }) + T(W / 2, 360, "the number of plasmids may vary, and can even be zero.", { s: 13.5 });
    s += T(W / 2, 388, "Schematic. Real cells often have many more plasmid copies.", { s: 12, c: GREY });
    return svg(W, H, "A parent bacterium with three plasmids replicates them to six, and three possible daughter pairs share them 3 and 3, 4 and 2, and 6 and 0", s); };

  // ---------------- 3. conjugation ----------------
  // one scene: donor on the left, recipient on the right, inside a box of width 240 centred on cx. stage 1–6
  const conjScene = (cx, cy, stage, o = {}) => { const other = !!o.other; const rw = 96, rh = 50; let gap = stage <= 2 ? 34 : 6; if (stage === 6) gap = 34;
    const dx = cx - gap / 2 - rw / 2, rx = cx + gap / 2 + rw / 2; let s = "";
    const recipFill = other ? CYTO2 : CYTO, recipWall = other ? WALL2 : WALL;
    const recipHas = stage >= 5; const half = stage === 4; // 4: single strand crossing
    s += rod(dx, cy, rw, rh, { chroms: [[-8, 0, 20, 12]], plas: [[28, -8, true]], seed: 51 });
    s += rod(rx, cy, rw, rh, { chroms: [[8, 0, 20, 12, 1]], plas: recipHas ? [[-28, -8, true]] : [], seed: 52, fill: recipFill, wall: recipWall });
    if (stage === 2) { s += `<path d="M${dx + rw / 2 - 2} ${cy + 4} C ${cx - 6} ${cy - 6}, ${cx + 6} ${cy + 10}, ${rx - rw / 2 + 2} ${cy + 2}" fill="none" stroke="${PILUS}" stroke-width="3"/>`; }
    if (stage === 3 || stage === 4 || stage === 5) s += `<rect x="${cx - 6}" y="${cy - 7}" width="12" height="14" rx="3" fill="${PILUS}" opacity="0.85"/>`;
    // the single strand runs from the donor's plasmid through the cell-to-cell connection into the recipient
    if (half) { s += `<path d="M${dx + 34} ${cy - 5} C ${cx - 12} ${cy - 5}, ${cx - 8} ${cy}, ${cx} ${cy} S ${cx + 12} ${cy - 5}, ${rx - 30} ${cy - 6}" fill="none" stroke="${PLAS}" stroke-width="2.4" stroke-dasharray="5 3" marker-end="url(#arp${U})"/>`; }
    return s; };
  const CONJ = [
    ["Donor and recipient", "Donor has a plasmid; recipient does not"],
    ["Pilus makes contact", "A pilus from the donor attaches"],
    ["Cells drawn together", "The pilus shortens; a link forms"],
    ["Plasmid DNA passes across", "A copy of one DNA strand moves over"],
    ["Both cells complete it", "Complementary strands are made"],
    ["Cells separate", "Both have the plasmid: still 2 cells"],
  ];
  const conjugation = () => { uid(); const W = 480, PW = 240, PH = 150; let s = defs();
    [2, 3, 4, 6].forEach((st, i) => { const cx = (i % 2) * PW + PW / 2, y0 = Math.floor(i / 2) * PH; s += badge((i % 2) * PW + 20, y0 + 20, i + 1) + T((i % 2) * PW + 38, y0 + 25, CONJ[st - 1][0], { a: "start", s: 13.5, w: 700 }) + conjScene(cx, y0 + 72, st) + T(cx, y0 + 124, CONJ[st - 1][1], { s: 12.5 }); });
    s += T(PW / 2 - 66, 111, "donor", { s: 11.5, c: GREY }) + T(PW / 2 + 66, 111, "recipient", { s: 11.5, c: GREY });
    s += plasmid(W / 2 - 96, 2 * PH + 18, { res: true }) + T(W / 2 - 84, 2 * PH + 22, "plasmid carrying a gene (orange segment)", { a: "start", s: 12 });
    s += T(W / 2, 2 * PH + 46, "Cells before: 2. Cells after: 2. No new cell is made, so this is not reproduction.", { s: 12.5, w: 700, c: TEAL });
    return svg(W, 2 * PH + 58, "Four stages of conjugation: a pilus from the donor attaches to the recipient, the cells are drawn together, a copy of the plasmid DNA passes across, and the cells separate, both now with the plasmid; there are still two cells", s); };

  // ---------------- 4. vertical v horizontal transmission ----------------
  const transmission = () => { uid(); const W = 480, H = 410; let s = defs();
    const tree = (x0, fill, wall, name, plasAt) => { let t = T(x0, 26, name, { s: 14, w: 700 });
      const lv = [[x0], [x0 - 52, x0 + 52], [x0 - 78, x0 - 26, x0 + 26, x0 + 78]]; const ys = [70, 170, 280];
      lv.forEach((xs, g) => xs.forEach((x, i) => { if (g) { const px = lv[g - 1][Math.floor(i / 2)]; t += L(px, ys[g - 1] + 18, x, ys[g] - 20, { c: GREY, w: 1.6, m: "arg" }); }
        const has = plasAt(g, i); t += rod(x, ys[g], g === 2 ? 44 : 60, g === 2 ? 28 : 32, { chroms: [[0, 0, g === 2 ? 8 : 11, 6]], plas: has ? [[g === 2 ? 12 : 17, -5]] : [], ribo: false, fill, wall, res: true }); }));
      return t; };
    // species 1 has the plasmid throughout; species 2 gains it in generation 2 (right-hand cell, index 1) by conjugation
    s += tree(120, CYTO, WALL, "Species 1", () => true);
    s += tree(360, CYTO2, WALL2, "Species 2", (g, i) => (g === 1 && i === 0) || (g === 2 && i < 2));
    s += `<path d="M206 160 C 228 138, 252 138, 274 160" fill="none" stroke="${PLAS}" stroke-width="2.6" stroke-dasharray="6 4" marker-end="url(#arp${U})"/>` + T(240, 128, "conjugation:", { s: 13, w: 700, c: PLAS }) + T(240, 144, "horizontal", { s: 13, w: 700, c: PLAS });
    s += `<text transform="translate(16 175) rotate(-90)" text-anchor="middle" font-size="12.5" font-weight="600" fill="${GREY}">binary fission: vertical</text>`;
    s += T(W / 2, 334, "Vertical: genes pass from a parent cell to its daughter cells.", { s: 13 }) + T(W / 2, 354, "Horizontal: genes pass between existing cells, even of", { s: 13 }) + T(W / 2, 372, "different species, without any cell dividing.", { s: 13 });
    s += plasmid(160, 396, { res: true }) + T(172, 400, "plasmid carrying a gene", { a: "start", s: 12, c: GREY });
    return svg(W, H, "Two family trees of bacteria. In species 1 every cell has a plasmid, passed on by binary fission. A dashed arrow labelled conjugation, horizontal, carries the plasmid to one cell of species 2, whose daughter cells then also have it", s); };

  // ---------------- 5. binary fission v mitosis v meiosis ----------------
  // small eukaryotic cell with chromosomes: list of [len, colour]
  const ecell = (cx, cy, r, chrs, o = {}) => { let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ECELL}" stroke="${ESTROKE}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="#fff" stroke="#8c7aa6" stroke-width="1.4"/>`;
    const n = chrs.length, sp = (r * 0.9) / Math.max(n, 2); chrs.forEach(([len, c], i) => { const x = cx - ((n - 1) * sp) / 2 + i * sp; s += `<line x1="${x}" y1="${cy - len / 2}" x2="${x}" y2="${cy + len / 2}" stroke="${c}" stroke-width="${o.w || 4}" stroke-linecap="round"/>`; }); return s; };
  const DIP = [[16, MAT], [16, PAT], [9, MAT], [9, PAT]];
  const comparison = () => { uid(); const W = 480, H = 470; let s = defs(); const rowY = [78, 222, 372];
    const lab = (y, a, b) => T(14, y - 52, a, { a: "start", s: 15, w: 700 }) + T(14, y - 34, b, { a: "start", s: 12.5, c: GREY });
    // binary fission
    s += lab(rowY[0], "Binary fission", "prokaryotes; one division");
    s += rod(70, rowY[0] + 6, 96, 44, { chroms: [[0, 0, 16, 10]], plas: [[30, -6]], seed: 61 }) + L(126, rowY[0] + 6, 186, rowY[0] + 6, { m: "ar", w: 2 });
    s += rod(260, rowY[0] + 6, 76, 40, { chroms: [[0, 0, 13, 9]], plas: [[22, -5], [-22, 6]], seed: 62 }) + rod(352, rowY[0] + 6, 76, 40, { chroms: [[0, 0, 13, 9, 1]], plas: [], seed: 63 });
    s += T(400, rowY[0] + 44, "2 cells, each with one circular DNA;", { a: "end", s: 12.5 }) + T(400, rowY[0] + 60, "plasmid numbers may differ", { a: "end", s: 12.5 });
    // mitosis
    s += lab(rowY[1], "Mitosis", "eukaryotes; one division of the nucleus");
    s += ecell(70, rowY[1] + 4, 34, DIP) + T(70, rowY[1] + 54, "2n = 4", { s: 12.5, w: 700 }) + L(116, rowY[1] + 4, 186, rowY[1] + 4, { m: "ar", w: 2 });
    s += ecell(250, rowY[1] + 4, 30, DIP) + ecell(340, rowY[1] + 4, 30, DIP) + T(250, rowY[1] + 50, "2n = 4", { s: 12.5, w: 700 }) + T(340, rowY[1] + 50, "2n = 4", { s: 12.5, w: 700 });
    s += T(470, rowY[1] - 2, "2 cells,", { a: "end", s: 12.5 }) + T(470, rowY[1] + 14, "genetically", { a: "end", s: 12.5 }) + T(470, rowY[1] + 30, "identical", { a: "end", s: 12.5 });
    // meiosis
    s += lab(rowY[2], "Meiosis", "eukaryotes; two divisions; gametes");
    s += ecell(70, rowY[2] + 4, 34, DIP) + T(70, rowY[2] + 54, "2n = 4", { s: 12.5, w: 700 }) + L(116, rowY[2] + 4, 166, rowY[2] + 4, { m: "ar", w: 2 });
    const hap = [[[16, MAT], [9, PAT]], [[16, MAT], [9, PAT]], [[16, PAT], [9, MAT]], [[16, PAT], [9, MAT]]];
    hap.forEach((c, i) => (s += ecell(204 + i * 62, rowY[2] + 4, 26, c) + T(204 + i * 62, rowY[2] + 46, "n = 2", { s: 12, w: 700 })));
    s += T(W - 10, rowY[2] + 68, "4 cells, haploid, genetically different", { a: "end", s: 12.5 });
    s += T(14, H - 8, "Red and blue: chromosomes from the two parents. Schematic; crossing over not shown.", { a: "start", s: 11.5, c: GREY });
    return svg(W, H, "Three rows comparing divisions: binary fission makes two bacteria each with one circular DNA molecule; mitosis makes two diploid cells identical to the parent; meiosis makes four haploid cells that differ", s); };

  // ---------------- 6. mitosis stage drawings (for stage recognition in the 3.2.10 consolidation) ----------------
  // a plant cell (root-tip meristem shape) centred on (cx, cy), 150 x 116, 2n = 4 (long and short pair; red maternal, blue paternal)
  const CHR = [[24, MAT], [24, PAT], [14, MAT], [14, PAT]];
  const chromatidPair = (x, y, len, c, ang = 0) => `<g transform="translate(${x} ${y}) rotate(${ang})"><line x1="-3" y1="${-len / 2}" x2="-3" y2="${len / 2}" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/><line x1="3" y1="${-len / 2}" x2="3" y2="${len / 2}" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/><rect x="-5" y="-2.4" width="10" height="4.8" rx="2.4" fill="${INK}"/></g>`;
  const vShape = (x, y, len, c, dir) => { const a = len * 0.55, b = len * 0.45; // apex (centromere) at (x, y), arms trail back towards the equator
    return `<path d="M${x - dir * a * 0.75} ${y - a * 0.62} L${x} ${y} L${x - dir * b * 0.75} ${y + b * 0.62}" fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="3" fill="${INK}"/>`; };
  const mitosisCell = (cx, cy, stage) => { const w = 150, h = 116; let s = `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="7" fill="${ECELL}" stroke="${ESTROKE}" stroke-width="3"/>`;
    const pole = 56; const spindle = (targets) => targets.map(([x, y, side]) => L(cx + side * pole, cy, x, y, { c: "#9aa9b6", w: 1 })).join("");
    if (stage === "interphase") { s += `<ellipse cx="${cx}" cy="${cy}" rx="32" ry="28" fill="#ece6f4" stroke="#6a5a8a" stroke-width="2"/><circle cx="${cx + 8}" cy="${cy - 4}" r="6" fill="#6a5a8a"/>`;
      scatter(9, 71, 40, 34).forEach(([dx, dy], i) => (s += `<path d="M${cx + dx - 5} ${cy + dy} q 3 -4 6 0 t 6 0" fill="none" stroke="#9c8cb8" stroke-width="1.2"/>`)); }
    if (stage === "prophase") { s += `<ellipse cx="${cx}" cy="${cy}" rx="34" ry="30" fill="#f4f0f8" stroke="#6a5a8a" stroke-width="1.6" stroke-dasharray="5 3"/>`;
      [[-14, -10, 30], [12, -12, -40], [-12, 14, 70], [14, 12, 10]].forEach(([dx, dy, a], i) => (s += chromatidPair(cx + dx, cy + dy, CHR[i][0], CHR[i][1], a))); }
    if (stage === "metaphase") { const ys = [-38.5, -14.5, 14.5, 38.5]; s += spindle(ys.flatMap((dy) => [[cx - 3, cy + dy, -1], [cx + 3, cy + dy, 1]]));
      s += L(cx, cy - 52, cx, cy + 52, { c: AMBER, w: 1, d: "3 3" });
      [2, 0, 1, 3].forEach((k, i) => (s += chromatidPair(cx, cy + ys[i], CHR[k][0], CHR[k][1]))); }
    if (stage === "anaphase") { const ys = [-30, -10, 10, 30]; [-1, 1].forEach((side) => { [2, 0, 1, 3].forEach((k, i) => { const x = cx + side * 34, y = cy + ys[i] * 0.85; s += L(cx + side * pole, cy, x, y, { c: "#9aa9b6", w: 1 }) + vShape(x, y, CHR[k][0], CHR[k][1], side); }); }); }
    if (stage === "telophase") { s += L(cx, cy - h / 2 + 4, cx, cy + h / 2 - 4, { c: "#8a7a4f", w: 2.2, d: "4 3" });
      [-1, 1].forEach((side) => { const nx = cx + side * 38; s += `<ellipse cx="${nx}" cy="${cy}" rx="24" ry="26" fill="#f4f0f8" stroke="#6a5a8a" stroke-width="1.5" stroke-dasharray="4 3"/>`;
        CHR.forEach(([len, c], i) => (s += `<path d="M${nx - 9 + i * 6} ${cy - len / 2} q 3 ${len / 4} 0 ${len / 2} t 0 ${len / 2}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`)); }); }
    return s; };
  const STAGES = ["interphase", "prophase", "metaphase", "anaphase", "telophase"];
  // a set of numbered cells: order = list of stage names in number order
  const mitosisSet = (order, o = {}) => { uid(); const W = 520, cols = 3; const H = Math.ceil(order.length / cols) * 160 + 24; let s = "";
    order.forEach((st, i) => { const row = Math.floor(i / cols), inRow = Math.min(cols, order.length - row * cols), col = i % cols; const cx = W / 2 + (col - (inRow - 1) / 2) * 172, cy = 82 + row * 160;
      s += mitosisCell(cx, cy, st) + badge(cx - 75, cy - 58, i + 1, INK) + (o.names ? T(cx, cy + 78, st, { s: 13, w: 600 }) : ""); });
    s += T(W / 2, H - 6, "Drawings of onion root-tip cells (2n = 4 shown for clarity; onion has 2n = 16). Not to scale.", { s: 11.5, c: GREY });
    return svg(W, H, "Numbered drawings of plant cells at different stages of the cell cycle", s); };

  // ---------------- labelled single bacterium (for the label question) ----------------
  const labelledBacterium = (o = {}) => { uid(); const W = 480, H = 230; let s = defs(); const cx = 240, cy = 112;
    s += rod(cx, cy, 300, 96, { chroms: [[-20, 0, 40, 24]], plas: [[90, -20], [-104, 22]], seed: 81 });
    s += `<circle cx="${cx + 62}" cy="${cy + 28}" r="2.6" fill="${RIBO}"/>`;
    const pts = [[1, 101, 82, 40, 40, "cell wall"], [2, 112, 146, 40, 196, "cell-surface membrane"], [3, 220, 92, 210, 22, "circular DNA"], [4, cx + 94, cy - 24, 420, 40, "plasmid"], [5, cx + 64, cy + 30, 420, 196, "ribosome"]];
    pts.forEach(([n, x, y, lx, ly, name]) => { s += L(x, y, lx, ly, { c: GREY, w: 1.3 }) + `<circle cx="${lx}" cy="${ly}" r="12" fill="#fff" stroke="${INK}" stroke-width="1.6"/>` + T(lx, ly + 4.5, o.names ? name : n, { s: 13, w: 700 }); });
    return svg(W, H, "A rod-shaped bacterium with five numbered structures", s); };

  B.fissionArt = { colours: { INK, GREY, WALL, MEMB, CYTO, DNA, PLAS, RIBO, PILUS, RES, TEAL, AMBER, CYTO2, WALL2, MAT, PAT }, T, L, svg, defs, uid: () => uid(), loop, plasmid, rod, pair, badge, scatter,
    fissionStages, plasmidSharing, conjScene, CONJ, conjugation, transmission, ecell, DIP, comparison, mitosisCell, mitosisSet, STAGES, labelledBacterium };
})(window.BIO);
