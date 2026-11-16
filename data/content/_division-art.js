// Shared model and artwork for 3.2.10.1 The cell cycle and 3.2.10.2 Mitosis (Phase 4 Batch 4, owned by the 3.2.10.1–2
// author). Loaded after data/content/_meiosis-art.js and before data/content/3.2.10.1.js, 3.2.10.2.js and
// js/views/interactives-division.js. Every drawing is schematic SVG drawn in code from the chromosome model below, so
// the counts printed beside a drawing are DERIVED from the same data that draws it (B.divisionModel.counts) and the
// picture and the numbers cannot disagree. tools: the author's test script checks every frame against EXPECT.
//
// Conventions (checked against the OxfordAQA 9610 v5.1 wording, printed p.25, and the 3.1.9 meiosis artwork):
// - Model cell 2n = 4: two homologous pairs, told apart by SIZE (a long pair and a short pair). Within each pair the
//   maternal chromosome is rose-red and the paternal chromosome blue (the 3.1.9 colours).
// - Chromosomes are counted by CENTROMERES. A replicated chromosome (two sister chromatids joined at one centromere) is
//   ONE chromosome. When the sister chromatids separate at anaphase, each separated chromatid has its own centromere and
//   is counted as a chromosome (so a cell in anaphase holds 8 in this model: 4 moving to each pole).
// - DNA content per cell in relative units: 1 unit = the DNA of one haploid set (one long + one short chromosome, single
//   chromatid). G1 = 2 units; replication in S doubles it to 4; it stays 4 until cytokinesis; each daughter cell has 2.
//   The chromosome NUMBER does not change in S: each chromosome becomes two chromatids.
// - Spindle poles are left and right; the equator is vertical (as in the 3.1.9 drawings). In metaphase each chromosome
//   lies along the equator with one sister chromatid facing each pole; in anaphase the centromere leads and the arms
//   trail behind (V shapes).
// - Interphase chromatin is drawn as a grainy nucleus with no separate chromosomes (as under a light microscope); render
//   option threads: true draws it as faint countable threads instead (used by the animation when counts are shown).
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", NAVY = "#1e3a5f", AMBER = "#b7791f";
  const MAT = "#c0504d", PAT = "#2f6db5", CELL = "#f8f3e6", CELLS = "#b49a63", NUC = "#efe6f3", NUCS = "#7d5a94";
  const SPIN = "#7c8ea3", WALL = "#6f8f3a", PCELL = "#f3f7e6", PLATE = "#4c7a2a", NUCL = "#a57bbd";
  const COL = { M: MAT, P: PAT };
  let cnt = 0, U = ""; const uid = () => (U = "-dv" + (++cnt));
  const r1 = (x) => Math.round(x * 10) / 10;
  const T = (x, y, s, o = {}) => { const lines = String(s).split("\n"); const lh = (o.s || 14) * 1.18; const y0 = y - ((lines.length - 1) * lh) / 2 * (o.mid ? 1 : 0);
    return `<text x="${r1(x)}" y="${r1(y0)}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}>${lines.map((l, i) => `<tspan x="${r1(x)}" dy="${i ? lh.toFixed(1) : 0}">${l}</tspan>`).join("")}</text>`; };
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.c || INK}" stroke-width="${o.w || 1.5}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.cap ? ` stroke-linecap="${o.cap}"` : ""}${o.op != null ? ` opacity="${o.op}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9z" fill="${col}"/></marker>`;
  const svg = (w, h, aria, inner, width = w) => `<svg viewBox="0 0 ${w} ${h}" width="${width}" role="img" aria-label="${aria}" style="max-width:100%;height:auto" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">${inner}</svg>`;

  // ================= MODEL =================
  const PAIRS = [{ id: "L", len: 64, cen: 0.38, name: "long" }, { id: "S", len: 38, cen: 0.3, name: "short" }];
  const HAP = PAIRS.reduce((a, p) => a + p.len, 0); // DNA of one haploid set, in drawn length units
  const IDS = [{ id: "LM", p: 0, o: "M" }, { id: "LP", p: 0, o: "P" }, { id: "SM", p: 1, o: "M" }, { id: "SP", p: 1, o: "P" }];
  const kindOf = (c) => PAIRS[c.p].id + c.o;

  // Counts derived from the frame data: used by every display AND by the test script.
  function counts(cell) {
    const chrs = cell.chrs; const sum = (cs, f) => cs.reduce((a, c) => a + f(c), 0);
    const per = [...new Set(chrs.map((c) => c.cds))];
    const dnaOf = (cs) => Math.round((1000 * sum(cs, (c) => c.cds * PAIRS[c.p].len)) / HAP) / 1000;
    const sides = [...new Set(chrs.map((c) => c.side || 0))].filter((s) => s !== 0);
    const groupBy = sides.length === 2 ? sides.sort().map((s) => chrs.filter((c) => c.side === s)) : null;
    const groups = groupBy ? groupBy.map((cs) => ({ chromosomes: cs.length, chromatids: sum(cs, (c) => c.cds), dna: dnaOf(cs), kinds: cs.map(kindOf).sort().join(",") })) : null;
    return { chromosomes: chrs.length, chromatids: sum(chrs, (c) => c.cds), chromatidsPer: per.length === 1 ? per[0] : null, dna: dnaOf(chrs), kinds: chrs.map(kindOf).sort().join(","), groups, groupName: groups ? (cell.nuclei && cell.nuclei.length === 2 ? "nucleus" : "pole") : null, nuclei: (cell.nuclei || []).length };
  }
  const frameCounts = (f) => ({ cells: f.cells.length, cell: f.cells.map(counts) });
  // Independent expectations written out by hand for 2n = 4 (the test script compares counts() with these).
  const EXPECT = {
    g1: { cells: 1, chromosomes: 4, chromatidsPer: 1, dna: 2 },
    g2: { cells: 1, chromosomes: 4, chromatidsPer: 2, dna: 4 },
    pro1: { cells: 1, chromosomes: 4, chromatidsPer: 2, dna: 4 },
    pro2: { cells: 1, chromosomes: 4, chromatidsPer: 2, dna: 4 },
    meta: { cells: 1, chromosomes: 4, chromatidsPer: 2, dna: 4 },
    ana1: { cells: 1, chromosomes: 8, chromatidsPer: 1, dna: 4, group: { chromosomes: 4, dna: 2 } },
    ana2: { cells: 1, chromosomes: 8, chromatidsPer: 1, dna: 4, group: { chromosomes: 4, dna: 2 } },
    telo: { cells: 1, chromosomes: 8, chromatidsPer: 1, dna: 4, group: { chromosomes: 4, dna: 2 } },
    cyto: { cells: 2, chromosomes: 4, chromatidsPer: 1, dna: 2 },
  };
  const PARENT_KINDS = IDS.map((c) => PAIRS[c.p].id + c.o).sort().join(",");
  // Returns a list of problems (empty = every frame agrees with EXPECT and the daughters are identical to the parent).
  function check(frs) {
    const bad = [];
    for (const f of frs) { const e = EXPECT[f.id]; const fc = frameCounts(f); if (!e) { bad.push(f.id + ": no expectation"); continue; }
      if (fc.cells !== e.cells) bad.push(`${f.id}: cells ${fc.cells} ≠ ${e.cells}`);
      fc.cell.forEach((c, i) => { if (c.chromosomes !== e.chromosomes) bad.push(`${f.id}[${i}]: chromosomes ${c.chromosomes} ≠ ${e.chromosomes}`);
        if (c.chromatidsPer !== e.chromatidsPer) bad.push(`${f.id}[${i}]: chromatids per chromosome ${c.chromatidsPer} ≠ ${e.chromatidsPer}`);
        if (c.dna !== e.dna) bad.push(`${f.id}[${i}]: DNA ${c.dna} ≠ ${e.dna}`);
        if (e.group) { if (!c.groups) bad.push(`${f.id}: no groups`); else c.groups.forEach((g) => { if (g.chromosomes !== e.group.chromosomes || g.dna !== e.group.dna) bad.push(`${f.id}: group ${g.chromosomes}/${g.dna}`); if (g.kinds !== PARENT_KINDS) bad.push(`${f.id}: group kinds ${g.kinds}`); }); }
        else if (c.groups) bad.push(`${f.id}: unexpected groups`);
        if (f.id === "cyto" && c.kinds !== PARENT_KINDS) bad.push(`cyto[${i}]: daughter kinds ${c.kinds} ≠ parent ${PARENT_KINDS}`); });
      for (const c of f.cells || []) for (const p of [...(c.centrosomes || []), ...((c.spindle && c.spindle.poles) || [])]) { const m = 12; const v = ((p[0] - c.cx) / (c.rx - m)) ** 2 + ((p[1] - c.cy) / (c.ry - m)) ** 2; if (v > 1) bad.push(`${f.id}: spindle pole or centrosome at ${p[0]},${p[1]} is not inside the cell`); }
      if (f.id === "g1" || f.id === "g2") { if (fc.cell[0].kinds !== PARENT_KINDS) bad.push(f.id + ": parent kinds"); } }
    return bad;
  }

  // ---- Frame builder: one cell (or two daughter cells) per frame, for an animal or a plant cell ----
  const W = 720, H = 370, CX = 360, CY = 185;
  const G1POS = { LM: [-28, -30, 25], LP: [15, 30, 20], SM: [35, -35, 110], SP: [-50, 37, -50] }; // [dx, dy, angle] in the interphase nucleus
  const TPOS = { LM: [-14, -12, 85], SP: [14, -32, 100], LP: [12, 12, 70], SM: [-8, 46, 30] }; // telophase nucleus
  const mk = (id, o) => { const base = IDS.find((x) => x.id === id.split(".")[0]); return Object.assign({ id, p: base.p, o: base.o, cds: 1, x: 0, y: 0, ang: 0, cond: 0, side: 0, k: 1 }, o); };
  function metaStack(cx, cy, gap = 15) { // centromere positions on a vertical equator
    const order = ["LM", "SP", "LP", "SM"]; const tot = order.reduce((a, id) => a + PAIRS[IDS.find((x) => x.id === id).p].len, 0) + gap * 3; let y = cy - tot / 2; const out = {};
    for (const id of order) { const pr = PAIRS[IDS.find((x) => x.id === id).p]; out[id] = y + pr.cen * pr.len; y += pr.len + gap; } return out; }
  function frames(type = "animal") {
    const an = type === "animal"; const cx = CX, cy = CY; const ys = metaStack(cx, cy, an ? 15 : 7); // plant: smaller gaps so the stack clears the walls
    const nucG = { cx, cy, rx: 88, ry: 82, state: "whole", nucleolus: 1 };
    const interChr = (cds, cond = 0, k = 1, ox = cx, oy = cy) => IDS.map(({ id }) => { const [dx, dy, a] = G1POS[id]; return mk(id, { cds, cond, x: ox + dx * k, y: oy + dy * k, ang: a, k }); });
    const poleX = an ? [222, 498] : [215, 505]; // spindle poles well inside the cell (teacher 2026-11-15: centrioles had been drawn outside the cell)
    const cellA = (o) => Object.assign({ kind: type, cx, cy, rx: an ? 158 : 165, ry: an ? 128 : 128, waist: 0, plate: 0, nuclei: [], spindle: null, centrosomes: [], chrs: [] }, o);
    const F = [];
    // Interphase G1
    F.push({ id: "g1", stage: "interphase", sub: "G1", title: "Interphase (G1)", cells: [cellA({ rx: an ? 150 : 165, ry: an ? 122 : 128, nuclei: [nucG], centrosomes: an ? [[cx, 78]] : [], chrs: interChr(1) })],
      marks: [{ t: "nuclear envelope", x: cx - 88, y: cy }, { t: "nucleolus", x: cx + 12, y: cy + 5 }, { t: "chromatin\n(uncoiled chromosomes)", x: cx - 50, y: cy - 22 }, an ? { t: "centrosome\n(supporting)", x: cx + 8, y: 78 } : { t: "cell wall", x: cx + 165, y: cy - 70 }, an ? { t: "cell surface\nmembrane", x: cx + 124, y: cy + 69 } : { t: "cytoplasm", x: cx + 100, y: cy + 95 }] });
    // Interphase G2 (after S)
    F.push({ id: "g2", stage: "interphase", sub: "G2 (after S)", title: "Interphase (G2, after DNA replication)", cells: [cellA({ rx: an ? 162 : 165, ry: an ? 132 : 128, nuclei: [nucG], centrosomes: an ? [[cx - 22, 78], [cx + 22, 78]] : [], chrs: interChr(2) })],
      marks: [{ t: "nuclear envelope", x: cx - 88, y: cy }, { t: "nucleolus", x: cx + 12, y: cy + 5 }, { t: "chromatin (DNA\nreplicated in S)", x: cx - 50, y: cy - 22 }, an ? { t: "two centrosomes\n(supporting)", x: cx + 26, y: 78 } : { t: "cell wall", x: cx + 165, y: cy - 70 }] });
    // Early prophase
    F.push({ id: "pro1", stage: "prophase", sub: "early prophase", title: "Prophase (early)", cells: [cellA({ rx: an ? 162 : 165, ry: an ? 132 : 128, nuclei: [Object.assign({}, nucG, { nucleolus: 0.35 })], centrosomes: an ? [[cx - 96, 108], [cx + 96, 108]] : [], spindle: { on: 0.6, poles: an ? [[cx - 96, 108], [cx + 96, 108]] : [[cx - 125, cy], [cx + 125, cy]], forming: true }, chrs: interChr(2, 0.5) })],
      marks: [{ t: "chromosomes\ncondensing", x: cx - 46, y: cy - 25 }, { t: "nuclear envelope\nstill intact", x: cx - 86, y: cy + 25 }, { t: "nucleolus\ndisappearing", x: cx + 12, y: cy + 5 }, an ? { t: "centrosomes move\napart; spindle forms", x: cx + 96, y: 108 } : { t: "spindle\nforming", x: cx + 125, y: cy - 18 }] });
    // Late prophase (the end of prophase; called prometaphase in some books: supporting)
    const proPos = { LM: [-45, -45, 35], LP: [25, 45, -30], SM: [40, -42, 80], SP: [-48, 40, 60] };
    F.push({ id: "pro2", stage: "prophase", sub: "late prophase", title: "Prophase (late)", cells: [cellA({ rx: an ? 168 : 165, ry: an ? 132 : 128, nuclei: [Object.assign({}, nucG, { state: "breaking", nucleolus: 0 })], centrosomes: an ? [[poleX[0], cy], [poleX[1], cy]] : [], spindle: { on: 1, poles: [[poleX[0], cy], [poleX[1], cy]], attach: ["LM", "SP"] }, chrs: IDS.map(({ id }) => { const [dx, dy, a] = proPos[id]; return mk(id, { cds: 2, cond: 1, x: cx + dx, y: cy + dy, ang: a }); }) })],
      marks: [{ t: "nuclear envelope\nbreaking down", x: cx + 62, y: cy + 59 }, { t: "condensed\nchromosome (two\nsister chromatids)", x: cx + 40 + 12, y: cy - 42 - 4 }, { t: "centromere", x: cx - 45, y: cy - 45 }, { t: "spindle fibres", x: cx - 120, y: cy - 22 }, { t: an ? "spindle pole\n(centrioles)" : "spindle pole", x: poleX[0], y: cy }] });
    // Metaphase
    const metaChr = IDS.map(({ id }) => mk(id, { cds: 2, cond: 1, x: cx, y: ys[id], ang: 90 }));
    F.push({ id: "meta", stage: "metaphase", sub: "", title: "Metaphase", cells: [cellA({ rx: an ? 170 : 165, ry: an ? 132 : 128, centrosomes: an ? [[poleX[0], cy], [poleX[1], cy]] : [], spindle: { on: 1, poles: [[poleX[0], cy], [poleX[1], cy]], attach: "all" }, equator: true, chrs: metaChr })],
      marks: [{ t: "chromosomes line up\non the equator", x: cx + 2, y: ys.SM + 16 }, { t: "centromere", x: cx - 9, y: ys.LM }, { t: "sister chromatids", x: cx + 5, y: ys.LP - 18 }, { t: "spindle fibre attached\nto the centromere", x: cx + 80, y: cy + (ys.SP - cy) * 0.55 }, { t: an ? "spindle pole\n(centrioles)" : "spindle pole", x: poleX[0], y: cy }] });
    // Anaphase (early, late)
    const anaChr = (dx, sq, th) => IDS.flatMap(({ id }) => [-1, 1].map((s) => mk(id + (s < 0 ? ".a" : ".b"), { cds: 1, cond: 1, x: cx + s * dx, y: cy + (ys[id] - cy) * sq, ang: 90, side: s, v: th })));
    F.push({ id: "ana1", stage: "anaphase", sub: "early anaphase", title: "Anaphase (early)", cells: [cellA({ rx: an ? 176 : 165, ry: an ? 130 : 128, centrosomes: an ? [[poleX[0] - 6, cy], [poleX[1] + 6, cy]] : [], spindle: { on: 1, poles: [[poleX[0] - 6, cy], [poleX[1] + 6, cy]], attach: "all" }, chrs: anaChr(52, 0.95, 28) })],
      marks: [{ t: "centromere divides;\nsister chromatids pulled\napart", x: cx - 52, y: cy + (ys.LM - cy) * 0.95 }, { t: "spindle fibres\nshorten", x: cx + 125, y: cy + (ys.LP - cy) * 0.95 * 0.5 + 0 }, { t: "centromere leads,\narms trail behind", x: cx + 52, y: cy + (ys.SM - cy) * 0.95 }] });
    F.push({ id: "ana2", stage: "anaphase", sub: "late anaphase", title: "Anaphase (late)", cells: [cellA({ rx: an ? 182 : 165, ry: an ? 126 : 128, waist: an ? 0.08 : 0, centrosomes: an ? [[poleX[0] - 12, cy], [poleX[1] + 12, cy]] : [], spindle: { on: 1, poles: [[poleX[0] - (an ? 12 : 4), cy], [poleX[1] + (an ? 12 : 4), cy]], attach: "all" }, chrs: anaChr(an ? 120 : 112, 0.8, 32) })],
      marks: [{ t: "chromatids reach\nthe poles", x: cx - (an ? 120 : 112), y: cy + (ys.LM - cy) * 0.8 }, { t: "each group: one copy\nof every chromosome", x: cx + (an ? 120 : 112), y: cy + (ys.SM - cy) * 0.8 }, { t: "cell elongates", x: cx + (an ? 182 : 165), y: cy + 20 }] });
    // Telophase
    const tN = an ? 122 : 100; const tNuc = [-1, 1].map((s) => ({ cx: cx + s * tN, cy, rx: 48, ry: 68, state: "forming", nucleolus: 0.55 }));
    const teloChr = IDS.flatMap(({ id }) => [-1, 1].map((s) => { const [dx, dy, a] = TPOS[id]; return mk(id + (s < 0 ? ".a" : ".b"), { cds: 1, cond: 0.5, x: cx + s * tN + s * dx, y: cy + dy, ang: s < 0 ? 180 - a : a, side: s }); }));
    F.push({ id: "telo", stage: "telophase", sub: "", title: "Telophase", cells: [cellA({ rx: an ? 185 : 165, ry: an ? 124 : 128, waist: an ? 0.5 : 0, plate: an ? 0 : 0.55, centrosomes: [], spindle: { on: 0.3, poles: [[cx - tN, cy], [cx + tN, cy]] }, nuclei: tNuc, chrs: teloChr })],
      marks: [{ t: "nuclear envelope\nre-forms", x: cx - tN - 48, y: cy }, { t: "chromosomes\nuncoil", x: cx - tN - 14, y: cy - 30 }, { t: "nucleolus\nreappears", x: cx + tN + 2, y: cy + 2 }, an ? { t: "cleavage furrow\n(cytokinesis begins)", x: cx, y: cy - 124 * 0.5 - 4 } : { t: "cell plate forming\n(cytokinesis begins)", x: cx, y: cy - 30 }] });
    // Cytokinesis complete: two daughter cells in G1
    const dk = 0.58; const dX = an ? 108 : 82.5;
    const daughter = (s) => { const ox = cx + s * dX; return cellA({ cx: ox, rx: an ? 100 : 82.5, ry: an ? 96 : 128, nuclei: [{ cx: ox, cy, rx: 52, ry: 50, state: "whole", nucleolus: 1, r: 9 }], centrosomes: an ? [[ox, cy - 72]] : [], chrs: IDS.map(({ id }) => { const [dx, dy, a] = G1POS[id]; return mk(id + (s < 0 ? ".a" : ".b"), { cds: 1, cond: 0, x: ox + dx * dk, y: cy + dy * dk, ang: a, k: dk }); }) }); };
    F.push({ id: "cyto", stage: "cytokinesis", sub: "supporting", title: "Cytokinesis complete: two daughter cells", cells: [daughter(-1), daughter(1)],
      marks: [{ t: "daughter nucleus:\nsame 4 chromosomes", x: cx - dX - 52, y: cy }, an ? { t: "cell surface membrane\ndivides the cytoplasm", x: cx + dX + 70, y: cy + 60 } : { t: "new cell wall", x: cx, y: cy - 90 }, { t: "two genetically\nidentical cells", x: cx + dX + 52, y: cy - 10 }] });
    return F;
  }

  // ================= DRAWING =================
  // A chromosome. cond 1 = condensed rods; cond 0.5 = long thin threads (prophase, telophase); cond 0 = faint chromatin.
  function chrSVG(c, o = {}) {
    const pr = PAIRS[c.p]; const col = COL[c.o]; const k = c.k || 1; let s = "";
    const rad = (c.ang * Math.PI) / 180; const ux = Math.cos(rad), uy = Math.sin(rad), nx = -uy, ny = ux;
    if (c.cond >= 0.99) {
      const len = pr.len * k, wd = 7.5 * k, sp = 9 * k; const up = pr.cen * len, dn = (1 - pr.cen) * len;
      if (c.cds === 2) {
        for (const off of [-sp / 2, sp / 2]) s += L(c.x - ux * up + nx * off, c.y - uy * up + ny * off, c.x + ux * dn + nx * off, c.y + uy * dn + ny * off, { c: col, w: wd, cap: "round" });
        s += L(c.x - nx * (sp / 2 + 2), c.y - ny * (sp / 2 + 2), c.x + nx * (sp / 2 + 2), c.y + ny * (sp / 2 + 2), { c: INK, w: 6 * k, cap: "round" });
      } else if (c.side) { // anaphase V: centromere towards the pole (side), arms trail back towards the equator
        const th = ((c.v || 28) * Math.PI) / 180; const back = -c.side; // direction towards the equator
        const a1 = [back * Math.cos(th), -Math.sin(th)], a2 = [back * Math.cos(th), Math.sin(th)];
        s += `<path d="M${r1(c.x + a1[0] * up)} ${r1(c.y + a1[1] * up)} L${r1(c.x)} ${r1(c.y)} L${r1(c.x + a2[0] * dn)} ${r1(c.y + a2[1] * dn)}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round"/>`;
        s += `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${4.6 * k}" fill="${INK}"/>`;
      } else {
        s += L(c.x - ux * up, c.y - uy * up, c.x + ux * dn, c.y + uy * dn, { c: col, w: wd, cap: "round" }) + `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${4.6 * k}" fill="${INK}"/>`;
      }
      return s;
    }
    // threads: a wavy line along the axis (chord = length factor × drawn length)
    const thin = c.cond < 0.25; const f = thin ? 1.25 : 1.15; const chord = pr.len * f * k; const amp = (thin ? 4 : 3) * Math.max(0.7, k); const wl = thin ? 11 : 15;
    const wd = thin ? 1.7 : 3.6; const op = thin ? 0.75 : 1; const n = Math.max(8, Math.round(chord / 3));
    const path = (off) => { let d = ""; for (let i = 0; i <= n; i++) { const t = i / n; const along = (t - 0.5) * chord; const w = amp * Math.sin((along / wl) * 2 * Math.PI) + off; const x = c.x + ux * along + nx * w, y = c.y + uy * along + ny * w; d += (i ? " L" : "M") + r1(x) + " " + r1(y); } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`; };
    if (c.cds === 2) s += path(-(thin ? 2 : 3.4)) + path(thin ? 2 : 3.4); else s += path(0);
    if (!thin) { const cpos = (pr.cen - 0.5) * chord; s += `<circle cx="${r1(c.x + ux * cpos)}" cy="${r1(c.y + uy * cpos)}" r="3.2" fill="${INK}"/>`; }
    return s;
  }
  // centromere position (for spindle attachment) of a condensed chromosome; for a cds-2 chromosome returns both faces
  function cenPts(c) { if (c.cds === 2) { const rad = (c.ang * Math.PI) / 180; const nx = -Math.sin(rad), ny = Math.cos(rad); const d = 9 / 2 + 3; return [[c.x - nx * d, c.y - ny * d], [c.x + nx * d, c.y + ny * d]]; } return [[c.x, c.y]]; }
  function centrosome(x, y, aster = true) { let s = ""; if (aster) for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; s += L(x + Math.cos(a) * 9, y + Math.sin(a) * 9, x + Math.cos(a) * 17, y + Math.sin(a) * 17, { c: SPIN, w: 1, op: 0.7 }); }
    return s + `<rect x="${x - 6}" y="${y - 2.5}" width="12" height="5" rx="1.5" fill="${NAVY}"/><rect x="${x - 2.5}" y="${y - 6}" width="5" height="12" rx="1.5" fill="${NAVY}" opacity="0.85"/>`; }
  function outline(cell) {
    if (cell.kind === "plant") { const x0 = cell.cx - cell.rx, y0 = cell.cy - cell.ry; return `<rect x="${x0}" y="${y0}" width="${2 * cell.rx}" height="${2 * cell.ry}" rx="6" fill="${PCELL}" stroke="${WALL}" stroke-width="7"/><rect x="${x0 + 5}" y="${y0 + 5}" width="${2 * cell.rx - 10}" height="${2 * cell.ry - 10}" rx="3" fill="none" stroke="${CELLS}" stroke-width="1"/>`; }
    let d = ""; const N = 96; for (let i = 0; i <= N; i++) { const t = (i / N) * 2 * Math.PI; const ct = Math.cos(t); const pinch = 1 - (cell.waist || 0) * Math.exp(-(ct * ct) / 0.03); d += (i ? " L" : "M") + r1(cell.cx + cell.rx * ct) + " " + r1(cell.cy + cell.ry * Math.sin(t) * pinch); }
    return `<path d="${d}Z" fill="${CELL}" stroke="${CELLS}" stroke-width="2.5"/>`;
  }
  // grainy chromatin: small dots spread evenly (deterministic) through a nucleus, avoiding the nucleolus
  function stipple(n) { let s = "", seed = Math.round(n.cx * 7 + n.cy * 3); const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const N = Math.round((n.rx * n.ry) / 26); const ncx = n.cx + 12 * (n.rx / 88), ncy = n.cy + 5, nr = (n.r || 13) + 3;
    for (let i = 0; i < N; i++) { const a = rnd() * 2 * Math.PI, rr = Math.sqrt(rnd()) * 0.9; const x = n.cx + rr * n.rx * Math.cos(a), y = n.cy + rr * n.ry * Math.sin(a); if (Math.hypot(x - ncx, y - ncy) < nr) continue; s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(1.3 + rnd() * 1.1)}" fill="${NUCS}" opacity="0.5"/>`; }
    return s; }
  function nucleus(n) {
    const dash = n.state === "breaking" ? ' stroke-dasharray="12 9"' : n.state === "forming" ? ' stroke-dasharray="5 4"' : "";
    const fo = n.state === "breaking" ? 0.35 : n.state === "forming" ? 0.6 : 1;
    let s = `<ellipse cx="${n.cx}" cy="${n.cy}" rx="${n.rx}" ry="${n.ry}" fill="${NUC}" fill-opacity="${fo}" stroke="${NUCS}" stroke-width="2.5"${dash}/>`;
    if (n.nucleolus > 0) s += `<circle cx="${n.cx + 12 * (n.rx / 88)}" cy="${n.cy + 5}" r="${n.r || (n.state === "forming" ? 8 : 13)}" fill="${NUCL}" opacity="${n.nucleolus}"/>`;
    return s;
  }
  function spindle(cell) {
    const sp = cell.spindle; if (!sp) return ""; let s = ""; const [pl, prt] = sp.poles; const op = sp.on;
    if (sp.forming) { for (const dy of [-14, 0, 14]) s += `<path d="M${pl[0]} ${pl[1]} Q ${(pl[0] + prt[0]) / 2} ${pl[1] - 40 + dy} ${prt[0]} ${prt[1]}" fill="none" stroke="${SPIN}" stroke-width="1.3" opacity="${op}"/>`; return s; }
    // polar fibres (pole to beyond the equator), faint
    for (const dy of [-1, 1]) { const my = cell.cy + dy * (cell.ry * 0.62); s += `<path d="M${pl[0]} ${pl[1]} Q ${cell.cx} ${my} ${prt[0]} ${prt[1]}" fill="none" stroke="${SPIN}" stroke-width="1.2" opacity="${0.55 * op}"/>`; }
    if (sp.attach) for (const c of cell.chrs) { if (sp.attach !== "all" && !sp.attach.includes(c.id)) continue; const pts = cenPts(c);
      if (c.cds === 2) { const [a, b] = pts; const left = a[0] <= b[0] ? a : b, right = a[0] <= b[0] ? b : a; s += L(pl[0], pl[1], left[0], left[1], { c: SPIN, w: 1.5, op }) + L(prt[0], prt[1], right[0], right[1], { c: SPIN, w: 1.5, op }); }
      else { const pole = c.side < 0 ? pl : prt; s += L(pole[0], pole[1], c.x, c.y, { c: SPIN, w: 1.5, op }); } }
    if (cell.kind === "plant") for (const p of sp.poles) s += `<ellipse cx="${p[0]}" cy="${p[1]}" rx="5" ry="14" fill="${SPIN}" opacity="${0.45 * op}"/>`;
    return s;
  }
  function plate(cell) { if (cell.kind !== "plant" || !cell.plate) return ""; const h = cell.plate * (2 * cell.ry - 14); let s = ""; const n = Math.round(h / 9); for (let i = 0; i <= n; i++) s += `<circle cx="${cell.cx + (i % 2 ? 1.5 : -1.5)}" cy="${r1(cell.cy - h / 2 + (i * h) / Math.max(1, n))}" r="3.6" fill="${PLATE}" opacity="0.8"/>`; return s; }
  // Draws a frame. opts: { labels: "text" | "num" | false, counts: bool, title: bool }. Returns { inner, w, h, key }.
  function render(f, o = {}) {
    uid(); let s = ""; const cells = f.cells;
    for (const cell of cells) { s += outline(cell); }
    if (cells.length === 2 && cells[0].kind === "plant") s += L(CX, CY - cells[0].ry, CX, CY + cells[0].ry, { c: WALL, w: 8 });
    // Interphase chromatin (release review 2026-11-15): drawn as a grainy nucleus with no separate chromosomes, as it
    // looks under a light microscope, unless o.threads asks for the countable faint threads (the animation's "show counts").
    for (const cell of cells) { const grain = !o.threads && cell.chrs.length && cell.chrs.every((c) => c.cond < 0.25);
      s += plate(cell) + (cell.nuclei || []).map((n) => nucleus(n) + (grain ? stipple(n) : "")).join("") + spindle(cell);
      if (cell.equator) s += L(cell.cx, cell.cy - cell.ry + 10, cell.cx, cell.cy + cell.ry - 10, { c: AMBER, w: 1.5, d: "6 5" });
      for (const c of cell.centrosomes || []) s += centrosome(c[0], c[1], !!cell.spindle && !cell.spindle.forming || (cell.spindle && cell.spindle.forming));
      if (!grain) for (const c of cell.chrs) s += chrSVG(c); }
    const key = []; let h = H;
    if (o.labels) {
      const marks = f.marks.map((m, i) => ({ ...m, n: i + 1, lines: m.t.split("\n").length }));
      const cols = { L: marks.filter((m) => m.x < CX - 1 || (m.x <= CX + 1 && m.n % 2 === 1 && false)), R: [] };
      cols.R = marks.filter((m) => !cols.L.includes(m));
      for (const [side, arr] of Object.entries(cols)) {
        arr.sort((a, b) => a.y - b.y); const lh = o.labels === "num" ? 30 : 17;
        const hgt = (m) => (o.labels === "num" ? 28 : m.lines * lh + 8);
        let y = 14; for (const m of arr) { m.ly = Math.max(m.y - (hgt(m) - 8) / 2, y); y = m.ly + hgt(m); }
        let over = y - (H - 6); if (over > 0) for (let i = arr.length - 1; i >= 0; i--) { arr[i].ly -= over; const prev = arr[i - 1]; if (prev) { const need = prev.ly + hgt(prev) - arr[i].ly; over = need > 0 ? need : 0; } }
        for (const m of arr) { const tx = side === "L" ? 165 : 555; const cyL = m.ly + (hgt(m) - 8) / 2;
          if (o.labels === "num") { s += L(tx + (side === "L" ? 13 : -13), cyL, m.x, m.y, { c: INK, w: 1.2 }) + `<circle cx="${m.x}" cy="${m.y}" r="2.6" fill="${INK}"/><circle cx="${tx}" cy="${cyL}" r="13" fill="${NAVY}"/>` + T(tx, cyL + 5, String(m.n), { s: 14, w: 700, c: "#fff" }); key.push([m.n, m.t.replace(/\n/g, " ")]); }
          else { s += L(side === "L" ? tx + 4 : tx - 4, cyL, m.x, m.y, { c: INK, w: 1.2 }) + `<circle cx="${m.x}" cy="${m.y}" r="2.6" fill="${INK}"/>` + T(side === "L" ? tx : tx, m.ly + 14, m.t, { a: side === "L" ? "end" : "start", s: 14 }); } } }
    }
    if (o.counts) { const fc = frameCounts(f); const c = fc.cell[0]; h = H + 34;
      const line = fc.cells === 2 ? `Each daughter cell: ${c.chromosomes} chromosomes, ${c.chromatidsPer} chromatid each; DNA ${c.dna} units` : `This cell: ${c.chromosomes} chromosomes (centromeres), ${c.chromatidsPer} chromatid${c.chromatidsPer === 1 ? "" : "s"} each; DNA ${c.dna} units${c.groups ? `; ${c.groups[0].chromosomes} per ${c.groupName}` : ""}`;
      s += `<rect x="40" y="${H + 2}" width="${W - 80}" height="28" rx="8" fill="#eef4f8"/>` + T(CX, H + 21, line, { s: 14, w: 600, c: NAVY }); }
    return { inner: s, w: W, h, key };
  }
  const frameSVG = (f, o = {}) => { const r = render(f, o); const lh = o.legend ? 24 : 0; return svg(r.w, r.h + lh, o.aria || `${f.title}: schematic ${f.cells[0].kind} cell with 2n = 4`, r.inner + (o.legend ? legend(W / 2 - 230, r.h + 16) : ""), o.width || r.w); };
  const legend = (x, y) => `<rect x="${x}" y="${y - 10}" width="22" height="9" rx="4" fill="${MAT}"/>` + T(x + 28, y, "maternal", { a: "start", s: 12 }) + `<rect x="${x + 98}" y="${y - 10}" width="22" height="9" rx="4" fill="${PAT}"/>` + T(x + 126, y, "paternal", { a: "start", s: 12 }) + `<circle cx="${x + 205}" cy="${y - 5}" r="4.5" fill="${INK}"/>` + T(x + 214, y, "centromere", { a: "start", s: 12 }) + T(x + 316, y, "two pairs: long and short", { a: "start", s: 12, c: GREY });

  // ================= 3.2.10.1 FIGURES =================
  // Cell-cycle phases (times: Cooper and Hausman, The Cell: A Molecular Approach, 4th ed., 2007, p.650, via BioNumbers
  // ID 112260: a typical rapidly proliferating human cell in culture with a 24 h cycle; approximate values).
  const PHASES = [
    { id: "G1", name: "G1 phase", h: 11, col: "#5fa36b" },
    { id: "S", name: "S phase", h: 8, col: "#2f6db5" },
    { id: "G2", name: "G2 phase", h: 4, col: "#8a6aa0" },
    { id: "M", name: "Mitosis and cytokinesis", h: 1, col: "#c0504d" },
  ];
  const TOTAL_H = PHASES.reduce((a, p) => a + p.h, 0);
  const arc = (cx, cy, R, r, a0, a1) => { const p = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; const lg = a1 - a0 > Math.PI ? 1 : 0; const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, r), [x3, y3] = p(a0, r); return `M${r1(x0)} ${r1(y0)} A${R} ${R} 0 ${lg} 1 ${r1(x1)} ${r1(y1)} L${r1(x2)} ${r1(y2)} A${r} ${r} 0 ${lg} 0 ${r1(x3)} ${r1(y3)}Z`; };
  // The cycle as a ring; o.sel highlights a phase id; o.checkpoints shows the supporting checkpoints; o.g0 shows G0.
  function cycleRing(o = {}) {
    uid(); const cx = 235, cy = 225, R = 150, r = 92; let s = `<defs>${marker("ca", GREY)}</defs>`; let a = -Math.PI / 2; const mid = {};
    for (const p of PHASES) { const da = (p.h / TOTAL_H) * 2 * Math.PI; const a1 = a + da; const on = !o.sel || o.sel === p.id || (o.sel === "C" && p.id === "M");
      s += `<path d="${arc(cx, cy, R, r, a, a1)}" fill="${p.col}" opacity="${on ? 1 : 0.28}" stroke="#fff" stroke-width="3"/>`; mid[p.id] = [a, a1, (a + a1) / 2]; a = a1; }
    const lab = (id, t, rr, sz = 22) => { const m = mid[id][2]; return T(cx + rr * Math.cos(m), cy + rr * Math.sin(m) + sz * 0.36, t, { s: sz, w: 700, c: "#fff" }); };
    const NUM = o.numbers; const nb = (id, n, rr) => { const m = mid[id][2]; const x = cx + rr * Math.cos(m), y = cy + rr * Math.sin(m); return `<circle cx="${r1(x)}" cy="${r1(y)}" r="15" fill="${NAVY}" stroke="#fff" stroke-width="2"/>` + T(x, y + 5.5, String(n), { s: 16, w: 800, c: "#fff" }); };
    if (NUM) s += nb("G1", NUM.G1, (R + r) / 2) + nb("S", NUM.S, (R + r) / 2) + nb("G2", NUM.G2, (R + r) / 2); else s += lab("G1", "G1", (R + r) / 2) + lab("S", "S", (R + r) / 2) + lab("G2", "G2", (R + r) / 2);
    const mm = mid.M[2]; s += L(cx + (R + 2) * Math.cos(mm), cy + (R + 2) * Math.sin(mm), cx - 30, cy - R - 30, { c: INK, w: 1.2 }) + (NUM ? `<circle cx="${cx - 46}" cy="${cy - R - 36}" r="15" fill="${NAVY}"/>` + T(cx - 46, cy - R - 30.5, String(NUM.M), { s: 16, w: 800, c: "#fff" }) : T(cx - 34, cy - R - 34, "M: mitosis + cytokinesis", { a: "end", s: 15, w: 700, c: "#c0504d" }));
    const ia0 = mid.G1[0], ia1 = mid.G2[1]; const RR = R + 16; s += `<path d="M${r1(cx + RR * Math.cos(ia0 + 0.05))} ${r1(cy + RR * Math.sin(ia0 + 0.05))} A${RR} ${RR} 0 1 1 ${r1(cx + RR * Math.cos(ia1 - 0.03))} ${r1(cy + RR * Math.sin(ia1 - 0.03))}" fill="none" stroke="${NAVY}" stroke-width="3" opacity="0.65"/>`;
    s += T(cx, cy + R + 44, "INTERPHASE = G1 + S + G2 (outer arc)", { s: 15, w: 800, c: NAVY });
    s += `<path d="M${r1(cx + 60 * Math.cos(-2.3))} ${r1(cy + 60 * Math.sin(-2.3))} A60 60 0 0 1 ${r1(cx + 60 * Math.cos(-0.85))} ${r1(cy + 60 * Math.sin(-0.85))}" fill="none" stroke="${GREY}" stroke-width="2.5" marker-end="url(#ca${U})"/>` + T(cx, cy + 10, "one cell", { s: 14, c: GREY }) + T(cx, cy + 28, "cycle", { s: 14, c: GREY });
    if (o.g0 !== false) { const g = mid.G1[0] + 0.55; const sx = cx + (R + 20) * Math.cos(g), sy = cy + (R + 20) * Math.sin(g); const gx = 470, gy = 70;
      s += `<path d="M${r1(sx)} ${r1(sy)} Q ${r1(gx - 60)} ${r1(gy + 10)} ${gx - 36} ${gy}" fill="none" stroke="${GREY}" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#ca${U})"/>` + `<circle cx="${gx}" cy="${gy}" r="30" fill="#fff" stroke="${GREY}" stroke-width="2" stroke-dasharray="6 4"/>` + T(gx, gy + 6, "G0", { s: 18, w: 700, c: GREY }) + T(gx + 40, gy - 4, "cells that stop", { s: 13, c: GREY, a: "start" }) + T(gx + 40, gy + 12, "dividing (supporting)", { s: 13, c: GREY, a: "start" }); }
    let ky = 150; if (NUM) return svg(720, 470, "The cell cycle drawn as a ring with numbered phases", s.replace(/INTERPHASE = G1 \+ S \+ G2 \(outer arc\)/, "outer arc = interphase"));
    if (o.checkpoints) { const cp = [["1", mid.G1[1], r - 2], ["2", mid.G2[1], r - 2], ["3", mid.M[2], R + 2]]; for (const [t, ang, rr] of cp) { const x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang); s += `<rect x="${r1(x - 9)}" y="${r1(y - 9)}" width="18" height="18" rx="3" fill="${AMBER}" stroke="#fff" stroke-width="2" transform="rotate(45 ${r1(x)} ${r1(y)})"/>` + T(x, y + 4.5, t, { s: 12, w: 800, c: "#fff" }); } }
    s += T(470, ky, "Approximate times, human cell", { a: "start", s: 13, c: GREY }) + T(470, ky + 16, "in culture (24 h cycle)", { a: "start", s: 13, c: GREY }); ky += 42;
    for (const p of PHASES) { s += `<rect x="470" y="${ky - 13}" width="16" height="16" rx="3" fill="${p.col}"/>` + T(494, ky, `${p.id}: about ${p.h} h`, { a: "start", s: 14, w: 600 }); ky += 25; }
    s += T(470, ky + 4, "Interphase: about 23 h", { a: "start", s: 14, w: 700, c: NAVY }) + T(470, ky + 22, "Times vary between cell types.", { a: "start", s: 12, c: GREY });
    if (o.checkpoints) { ky += 50; s += T(470, ky, "Checkpoints (supporting):", { a: "start", s: 13, w: 700, c: AMBER }); ["1 G1/S: is the cell ready to", "   copy its DNA?", "2 G2/M: is the DNA copied", "   correctly?", "3 spindle: are all chromosomes", "   attached to the spindle?"].forEach((t, i) => (s += T(470, ky + 17 + i * 16, t, { a: "start", s: 12, c: INK }))); }
    return svg(720, 470, "The cell cycle drawn as a ring: G1, S and G2 together form interphase, which takes most of the cycle; mitosis and cytokinesis (M) take a short segment; G0 is shown off the cycle as a supporting idea", s);
  }
  // DNA content per cell through one cycle and into the daughter cells, with chromosome and chromatid rows derived
  // from the model frames.
  function dnaGraph(o = {}) {
    uid(); const x0 = 90, x1 = 680, y0 = 250, yTop = 60; const ux = (x1 - x0) / 10; const Y = (d) => y0 - ((y0 - yTop) * d) / 4.5;
    // schematic widths (not to scale): G1 3, S 2.5, G2 1.5, mitosis 1.6 (P M A T), daughter G1 1.4
    const seg = [["G1", 0, 3], ["S", 3, 5.5], ["G2", 5.5, 7], ["P", 7, 7.5], ["M", 7.5, 7.9], ["A", 7.9, 8.3], ["T", 8.3, 8.6], ["G1", 8.6, 10]];
    let s = `<defs>${marker("da", INK)}</defs>`;
    for (const [id, a, b] of seg) { const fill = { G1: "#e7f3e9", S: "#e4edf8", G2: "#efe8f4" }[id] || "#f8e6e5"; const on = !o.sel || o.sel === id || (o.sel === "M" && "PMAT".includes(id) && id.length === 1 && id !== "G1") || (o.sel === "C" && id === "T");
      s += `<rect x="${r1(x0 + a * ux)}" y="${yTop - 10}" width="${r1((b - a) * ux)}" height="${y0 - yTop + 10}" fill="${fill}" opacity="${on ? 1 : 0.35}"/>`; s += T(x0 + ((a + b) / 2) * ux, y0 + 20, id, { s: id.length > 1 ? 15 : 13, w: 700, c: "PMAT".includes(id) && id.length === 1 ? "#c0504d" : INK }); }
    s += L(x0, y0, x1 + 8, y0, { c: INK, w: 1.6, m: "da" }) + L(x0, y0, x0, yTop - 22, { c: INK, w: 1.6, m: "da" });
    for (const d of [0, 1, 2, 3, 4]) s += L(x0 - 5, Y(d), x0, Y(d), { c: INK, w: 1.2 }) + T(x0 - 10, Y(d) + 5, String(d), { a: "end", s: 13 });
    s += T(26, (y0 + yTop) / 2, "", {}) + `<text x="30" y="${(y0 + yTop) / 2}" transform="rotate(-90 30 ${(y0 + yTop) / 2})" text-anchor="middle" font-size="14" font-weight="600" fill="${INK}">DNA per cell / relative units</text>`;
    s += T((x0 + x1) / 2, y0 + 42, "Time (phases drawn schematically, not to scale)", { s: 13, c: GREY });
    const P = (x, d) => `${r1(x0 + x * ux)} ${r1(Y(d))}`;
    s += `<path d="M${P(0, 2)} L${P(3, 2)} L${P(5.5, 4)} L${P(8.6, 4)} L${P(8.6, 2)} L${P(10, 2)}" fill="none" stroke="${NAVY}" stroke-width="3.5" stroke-linejoin="round"/>`;
    s += T(x0 + 4.25 * ux - 6, Y(3) - 10, "DNA replicates", { s: 13, w: 600, c: NAVY, a: "end" }) + T(x0 + 8.6 * ux + 6, Y(3), "cytokinesis:", { s: 12, a: "start", c: NAVY }) + T(x0 + 8.6 * ux + 6, Y(3) + 15, "two cells", { s: 12, a: "start", c: NAVY });
    // rows derived from the model frames
    const fr = frames("animal"); const by = (id) => frameCounts(fr.find((f) => f.id === id)).cell[0];
    const rows = [["Chromosomes per cell", [[1.5, by("g1").chromosomes], [4.25, by("g1").chromosomes], [6.25, by("g2").chromosomes], [7.55, by("meta").chromosomes + "*"], [9.3, by("cyto").chromosomes]]],
      ["Chromatids per chromosome", [[1.5, by("g1").chromatidsPer], [4.25, "1 → 2"], [6.25, by("g2").chromatidsPer], [7.55, by("meta").chromatidsPer + " → " + by("ana1").chromatidsPer], [9.3, by("cyto").chromatidsPer]]]];
    let ry = y0 + 70; for (const [lab, vals] of rows) { s += T(12, ry, lab, { a: "start", s: 12.5, w: 600, c: GREY }); for (const [x, v] of vals) s += T(x0 + x * ux, ry + 19, String(v), { s: 15, w: 700, c: NAVY }); ry += 46; }
    // o.notes === false (the Cell-Cycle Explorer): the two footnotes are shown as HTML text under the graph (dnaGraphNotes)
    if (o.notes === false) return svg(720, ry - 16, "Graph of DNA content per cell through the cell cycle: 2 units in G1, rising to 4 during S, staying at 4 through G2 and mitosis, then 2 in each daughter cell after cytokinesis; rows below give chromosomes per cell and chromatids per chromosome", s, 720);
    s += T(12, ry - 4, `* ${by("ana1").chromosomes} in the cell in anaphase and telophase, when each separated chromatid is counted as a chromosome (4 going to, then in, each new nucleus).`, { a: "start", s: 12, c: GREY }) + T(12, ry + 13, "P, M, A, T = prophase, metaphase, anaphase, telophase. One relative unit = the DNA of one haploid set.", { a: "start", s: 12, c: GREY }); ry += 16;
    return svg(720, ry + 20, "Graph of DNA content per cell through the cell cycle: 2 units in G1, rising to 4 during S, staying at 4 through G2 and mitosis, then 2 in each daughter cell after cytokinesis; rows below give chromosomes per cell and chromatids per chromosome", s, 720);
  }
  const dnaGraphNotes = () => { const by = (id) => frameCounts(frames("animal").find((f) => f.id === id)).cell[0]; return [`* ${by("ana1").chromosomes} in the cell in anaphase and telophase, when each separated chromatid is counted as a chromosome (4 going to, then in, each new nucleus).`, "P, M, A, T = prophase, metaphase, anaphase, telophase. One relative unit = the DNA of one haploid set."]; };
  // One chromosome through the cycle (the key counting idea)
  function oneChromosome() {
    uid(); let s = `<defs>${marker("oa", GREY)}</defs>`; const xs = [70, 205, 345, 485, 640], cy = 120; const len = 96, cen = 0.38;
    const rod = (x, y, col, w = 11) => L(x, y - cen * len, x, y + (1 - cen) * len, { c: col, w, cap: "round" });
    // G1
    s += rod(xs[0], cy, MAT) + `<circle cx="${xs[0]}" cy="${cy}" r="6" fill="${INK}"/>`;
    // S: partly replicated (upper part already copied: two thinner strands; lower part not yet)
    s += L(xs[1] - 6, cy - cen * len, xs[1] - 6, cy + 14, { c: MAT, w: 7, cap: "round" }) + L(xs[1] + 6, cy - cen * len, xs[1] + 6, cy + 14, { c: MAT, w: 7, cap: "round" }) + `<path d="M${xs[1] - 6} ${cy + 14} L${xs[1]} ${cy + 26} L${xs[1] + 6} ${cy + 14}" fill="none" stroke="${MAT}" stroke-width="7" stroke-linejoin="round"/>` + L(xs[1], cy + 26, xs[1], cy + (1 - cen) * len, { c: MAT, w: 11, cap: "round" }) + `<rect x="${xs[1] - 12}" y="${cy - 5}" width="24" height="10" rx="5" fill="${INK}"/>` + T(xs[1] + 16, cy + 30, "fork", { a: "start", s: 11, c: GREY });
    // G2 / metaphase: two sister chromatids
    for (const x of [xs[2], xs[3]]) s += L(x - 7, cy - cen * len, x - 7, cy + (1 - cen) * len, { c: MAT, w: 10, cap: "round" }) + L(x + 7, cy - cen * len, x + 7, cy + (1 - cen) * len, { c: MAT, w: 10, cap: "round" }) + `<rect x="${x - 14}" y="${cy - 5}" width="28" height="10" rx="5" fill="${INK}"/>`;
    s += L(xs[3] - 70, cy, xs[3] - 22, cy, { c: SPIN, w: 1.6 }) + L(xs[3] + 22, cy, xs[3] + 70, cy, { c: SPIN, w: 1.6 });
    // anaphase: two separate chromatids
    for (const [dx, sd] of [[-34, -1], [34, 1]]) { const x = xs[4] + dx; s += `<path d="M${x - sd * 16} ${cy - 34} L${x} ${cy} L${x - sd * 20} ${cy + 56}" fill="none" stroke="${MAT}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x}" cy="${cy}" r="5.5" fill="${INK}"/>`; }
    for (let i = 0; i < 4; i++) s += L(xs[i] + (i === 3 ? 74 : 26), cy, xs[i + 1] - (i === 2 ? 74 : i === 3 ? 66 : 26), cy, { c: GREY, w: 2, m: "oa" });
    const heads = ["G1", "S (replicating)", "G2", "Metaphase", "Anaphase"]; const rows = [["1", "1", "1", "1", "2"], ["1", "1 → 2", "2", "2", "1 each"], ["1", "1 → 2", "2", "2", "1 each"]];
    heads.forEach((t, i) => (s += T(xs[i], 26, t, { s: 15, w: 700 })));
    const lab = ["chromosomes", "chromatids per chromosome", "DNA molecules per chromosome"]; let y = 216;
    rows.forEach((r, j) => { s += T(12, y, lab[j], { a: "start", s: 12, c: GREY }); r.forEach((v, i) => (s += T(xs[i], y + 18, v, { s: 15, w: 700, c: NAVY }))); y += 44; });
    s += T(12, y + 2, "Drawn condensed so that it can be seen; in G1, S and G2 the chromosome is uncoiled chromatin.", { a: "start", s: 12, c: GREY }) + T(12, y + 18, "One chromatid = one DNA molecule.", { a: "start", s: 12, c: GREY });
    return svg(720, y + 30, "One chromosome followed through the cycle: in G1 one chromatid; during S it replicates; in G2 and metaphase it is still one chromosome made of two sister chromatids joined at the centromere; in anaphase the chromatids separate and each becomes a chromosome", s);
  }
  // Cells growing through interphase (organelle numbers illustrative)
  function phaseCell(ph, o = {}) {
    uid(); const P = { G1a: { r: 62, mito: 3, ribo: 26, cds: 1, cen: 1, t: "Start of G1" }, G1: { r: 74, mito: 6, ribo: 46, cds: 1, cen: 1, t: "End of G1" }, S: { r: 76, mito: 6, ribo: 50, cds: 2, cen: 1, t: "End of S" }, G2: { r: 86, mito: 9, ribo: 70, cds: 2, cen: 2, t: "End of G2" } }[ph];
    const cx = o.cx || 100, cy = o.cy || 100; let s = `<circle cx="${cx}" cy="${cy}" r="${P.r}" fill="${CELL}" stroke="${CELLS}" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${P.r * 0.42}" fill="${NUC}" stroke="${NUCS}" stroke-width="2"/>`;
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < P.ribo; i++) { const a = rnd() * 2 * Math.PI, rr = P.r * (0.5 + 0.42 * rnd()); s += `<circle cx="${r1(cx + rr * Math.cos(a))}" cy="${r1(cy + rr * Math.sin(a))}" r="1.6" fill="#555"/>`; }
    for (let i = 0; i < P.mito; i++) { const a = (i / P.mito) * 2 * Math.PI + 0.4, rr = P.r * 0.72; const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a); s += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="9" ry="4.5" fill="#f0c9a6" stroke="#b5643a" stroke-width="1.4" transform="rotate(${r1((a * 180) / Math.PI + 90)} ${r1(x)} ${r1(y)})"/>`; }
    const k = (P.r * 0.42) / 88; IDS.forEach(({ id }) => { const [dx, dy, a] = G1POS[id]; s += chrSVG(mk(id, { cds: P.cds, cond: 0, x: cx + dx * k, y: cy + dy * k, ang: a, k })); });
    for (let i = 0; i < P.cen; i++) s += centrosome(cx - (P.cen - 1) * 9 + i * 18, cy - P.r * 0.55, false);
    return o.raw ? { s, P } : svg(200, 200, P.t, s);
  }
  function growth() {
    uid(); let s = ""; const xs = [92, 268, 448, 626]; const ids = ["G1a", "G1", "S", "G2"];
    ids.forEach((id, i) => { const r = phaseCell(id, { raw: true, cx: xs[i], cy: 120 }); s += r.s + T(xs[i], 236, r.P.t, { s: 15, w: 700 }) + T(xs[i], 256, `${r.P.mito} mitochondria`, { s: 12.5, c: GREY }) + T(xs[i], 272, r.P.cds === 1 ? "1 chromatid each" : "2 chromatids each", { s: 12.5, c: GREY }); });
    s += `<defs>${marker("ga", GREY)}</defs>`; for (let i = 0; i < 3; i++) s += L(xs[i] + 80, 120, xs[i + 1] - 88, 120, { c: GREY, w: 2, m: "ga" });
    s += T(182, 20, "G1: grows; more protein,", { s: 13, c: "#3d7a46", w: 600 }) + T(182, 36, "mitochondria and ribosomes", { s: 13, c: "#3d7a46", w: 600 }) + T(360, 20, "S: DNA", { s: 13, c: PAT, w: 600 }) + T(360, 36, "replicated", { s: 13, c: PAT, w: 600 }) + T(540, 20, "G2: rapid growth,", { s: 13, c: "#6a4a80", w: 600 }) + T(540, 36, "protein synthesis", { s: 13, c: "#6a4a80", w: 600 });
    s += T(360, 298, "Illustrative numbers of organelles; sizes not to scale. Brown ovals = mitochondria, dots = ribosomes.", { s: 12, c: GREY });
    return svg(720, 310, "Four cells at the start of G1, end of G1, end of S and end of G2: the cell gets larger and gains mitochondria and ribosomes; after S each chromosome has two chromatids", s);
  }

  // ================= 3.2.10.2 FIGURES =================
  function strip(type, ids, o = {}) {
    uid(); const fr = frames(type); const pick = ids.map((id) => fr.find((f) => f.id === id)); const cols = 2; const sc = 0.5; const cw = 360, chh = (o.counts ? 248 : 222);
    let s = ""; pick.forEach((f, i) => { const r = render(f, {}); const col = i % cols, row = Math.floor(i / cols); const x = col * cw, y = row * chh;
      s += `<g transform="translate(${x} ${y + 30}) scale(${sc})">${r.inner}</g>` + T(x + cw / 2, y + 22, `${i + 1}. ${f.title.replace(" complete: two daughter cells", " (supporting)")}`, { s: 15, w: 700 });
      if (o.counts) { const c = frameCounts(f).cell[0]; s += T(x + cw / 2, y + 30 + H * sc + 16, frameCounts(f).cells === 2 ? `each cell: ${c.chromosomes} chromosomes × ${c.chromatidsPer} chromatid; DNA ${c.dna}` : `${c.chromosomes} chromosomes × ${c.chromatidsPer} chromatid${c.chromatidsPer > 1 ? "s" : ""}; DNA ${c.dna}${c.groups ? ` (${c.groups[0].chromosomes} per ${c.groupName})` : ""}`, { s: 13.5, w: 600, c: NAVY }); } });
    const rows = Math.ceil(pick.length / cols); const hh = rows * chh + 26;
    s += `<g transform="translate(${cw - 230 + 0} ${hh - 4})">${legend(0, 0)}</g>`;
    return svg(cols * cw, hh + 6, o.aria || `Stages of mitosis in ${type === "plant" ? "a plant" : "an animal"} cell`, s);
  }
  function spindleCloseUp() {
    uid(); let s = ""; const len = 120, cen = 0.4;
    const panel = (ox, title) => T(ox + 175, 24, title, { s: 16, w: 700 });
    // metaphase
    let x = 175, y = 165; s += panel(0, "Metaphase: fibres from both poles"); s += L(x, 44, x, 296, { c: AMBER, w: 1.5, d: "6 5" }) + T(x + 6, 300, "equator", { a: "start", s: 12, c: AMBER });
    s += L(x - 8, y - cen * len, x - 8, y + (1 - cen) * len, { c: MAT, w: 13, cap: "round" }) + L(x + 8, y - cen * len, x + 8, y + (1 - cen) * len, { c: MAT, w: 13, cap: "round" }) + `<rect x="${x - 17}" y="${y - 6}" width="34" height="12" rx="6" fill="${INK}"/>`;
    s += `<rect x="${x - 24}" y="${y - 9}" width="6" height="18" rx="2" fill="${TEAL}"/><rect x="${x + 18}" y="${y - 9}" width="6" height="18" rx="2" fill="${TEAL}"/>`;
    for (const dy of [-5, 0, 5]) s += L(28, y, x - 24, y + dy, { c: SPIN, w: 1.6 }) + L(322, y, x + 24, y + dy, { c: SPIN, w: 1.6 });
    s += centrosome(22, y) + centrosome(328, y);
    const lab = (tx, ty, t, px, py, a = "start") => L(px, py, tx + (a === "start" ? -4 : 4), ty - 4, { c: INK, w: 1.1 }) + `<circle cx="${px}" cy="${py}" r="2.4" fill="${INK}"/>` + T(tx, ty, t, { a, s: 13 });
    s += lab(212, 70, "sister chromatid", x + 8, y - 30) + lab(226, 236, "centromere", x, y + 4) + lab(60, 255, "kinetochore\n(supporting)", x - 21, y + 7, "start") + lab(70, 115, "spindle fibres", 90, y - 2, "start") + lab(260, 286, "pole", 328, y + 18, "start");
    // anaphase
    const ox = 370; x = ox + 175; s += panel(ox, "Anaphase: fibres shorten");
    for (const [dx, sd] of [[-62, -1], [62, 1]]) { const cx2 = x + dx; s += `<path d="M${cx2 - sd * 40} ${y - 40} L${cx2} ${y} L${cx2 - sd * 52} ${y + 58}" fill="none" stroke="${MAT}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${cx2}" cy="${y}" r="7" fill="${INK}"/><rect x="${cx2 + sd * 6 - 3}" y="${y - 8}" width="6" height="16" rx="2" fill="${TEAL}"/>`; for (const dy of [-5, 0, 5]) s += L(sd < 0 ? ox + 28 : ox + 322, y, cx2 + sd * 9, y + dy, { c: SPIN, w: 1.6 }); }
    s += centrosome(ox + 22, y) + centrosome(ox + 322, y) + `<defs>${marker("sa", NAVY)}</defs>` + L(x - 40, y + 86, x - 100, y + 86, { c: NAVY, w: 2.5, m: "sa" }) + L(x + 40, y + 86, x + 100, y + 86, { c: NAVY, w: 2.5, m: "sa" }) + T(x, y + 116, "each chromatid pulled to an opposite pole,", { s: 13, w: 600, c: NAVY }) + T(x, y + 132, "centromere first", { s: 13, w: 600, c: NAVY });
    return svg(720, 310, "Close-up of one chromosome: at metaphase spindle fibres from opposite poles attach to the centromere, one on each side; at anaphase the fibres shorten and pull the sister chromatids apart, centromere first, to opposite poles", s);
  }
  function versusMeiosis() {
    uid(); let s = `<defs>${marker("va", GREY)}</defs>`;
    const small = (cx, cy, ids, r = 44, lab = "") => { let t = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${CELL}" stroke="${CELLS}" stroke-width="2"/>`; ids.forEach((id, i) => { const c = IDS.find((x) => x.id === id); const n = ids.length; const x = cx - (n - 1) * 9 + i * 18; const len = PAIRS[c.p].len * 0.62; t += L(x, cy - len / 2, x, cy + len / 2, { c: COL[c.o], w: 7, cap: "round" }) + `<circle cx="${x}" cy="${cy - len / 2 + PAIRS[c.p].cen * len}" r="3.4" fill="${INK}"/>`; }); return t + (lab ? T(cx, cy + r + 18, lab, { s: 13, w: 600 }) : ""); };
    s += small(90, 210, ["LM", "LP", "SM", "SP"], 52, "parent cell, 2n = 4") + T(90, 290, "(G1, before replication)", { s: 12, c: GREY });
    s += L(146, 190, 250, 105, { c: GREY, w: 2, m: "va" }) + L(146, 232, 250, 312, { c: GREY, w: 2, m: "va" });
    s += T(200, 128, "mitosis", { s: 15, w: 700, c: TEAL, a: "end" }) + T(214, 262, "meiosis (3.1.9)", { s: 15, w: 700, c: AMBER, a: "start" });
    s += small(320, 92, ["LM", "LP", "SM", "SP"]) + small(430, 92, ["LM", "LP", "SM", "SP"]) + T(560, 72, "2 cells, diploid (2n = 4)", { a: "start", s: 14, w: 700, c: TEAL }) + T(560, 90, "genetically identical to", { a: "start", s: 13 }) + T(560, 106, "each other and the parent", { a: "start", s: 13 }) + T(560, 124, "one division", { a: "start", s: 13, c: GREY });
    const g = [["LM", "SP"], ["LM", "SP"], ["LP", "SM"], ["LP", "SM"]]; g.forEach((ids, i) => (s += small(285 + i * 70, 320, ids, 30)));
    s += T(560, 302, "4 cells, haploid (n = 2)", { a: "start", s: 14, w: 700, c: AMBER }) + T(560, 320, "genetically different from", { a: "start", s: 13 }) + T(560, 336, "the parent (and, with crossing", { a: "start", s: 13 }) + T(560, 352, "over, from each other)", { a: "start", s: 13 }) + T(560, 370, "two divisions", { a: "start", s: 13, c: GREY });
    s += T(360, 400, "Meiosis shown without crossing over, with one of the possible arrangements of the pairs.", { s: 12, c: GREY });
    return svg(760, 412, "Comparison: a parent cell with 2n = 4 divides by mitosis into two diploid cells identical to it, or by meiosis into four haploid cells, each with one long and one short chromosome, genetically different from the parent", s);
  }
  // Photograph with original marker rings drawn over it (positions checked by eye on each image by the author).
  const PHOTOS = {
    "roottip-stages": { src: "assets/img/roottip-stages.jpg", w: 2000, h: 1500, credit: "Natalierussell77", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Mitosis_in_Onion_Root_-_various_stages_(Metaphase_and_Telophase).jpg" },
    "roottip-field": { src: "assets/img/roottip-field.jpg", w: 1122, h: 1150, credit: "staticd", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Onion_root_mitosis.jpg" },
    "roottip-600x": { src: "assets/img/roottip-600x.jpg", w: 1024, h: 768, credit: "John Alan Elson", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Mitosisonionroottip600x1.jpg" },
    "roottip-400x": { src: "assets/img/roottip-400x.jpg", w: 1024, h: 768, credit: "John Alan Elson", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Mitosisonionroottip400x1.jpg" },
  };
  // marks: [{ t: "A", x, y, r, lx?, ly? }] in image pixels
  function photoMarked(slot, marks, o = {}) {
    const p = PHOTOS[slot]; const fs = Math.round(p.w / 22); let ov = "";
    for (const m of marks) { const lx = m.lx != null ? m.lx : m.x - m.r * 0.78, ly = m.ly != null ? m.ly : m.y - m.r * 0.78;
      ov += `<circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="none" stroke="#ffd23f" stroke-width="${Math.round(p.w / 260)}"/><circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="${Math.round(p.w / 700)}"/>`;
      ov += `<circle cx="${r1(lx)}" cy="${r1(ly)}" r="${Math.round(fs * 0.72)}" fill="#ffd23f" stroke="#16263a" stroke-width="${Math.round(p.w / 400)}"/><text x="${r1(lx)}" y="${r1(ly + fs * 0.36)}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#16263a" font-family="system-ui, sans-serif">${m.t}</text>`; }
    return `<figure class="photo div-photo" style="margin:.6rem 0"><div style="position:relative;max-width:${o.max || 560}px"><img src="${p.src}" alt="${o.alt || "Light micrograph of stained onion root-tip cells with lettered rings drawn round selected cells"}" style="width:100%;height:auto;display:block;border-radius:8px" loading="lazy" decoding="async"><svg viewBox="0 0 ${p.w} ${p.h}" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;left:0;top:0;width:100%;height:100%">${ov}</svg></div><figcaption class="tiny muted">${o.caption ? o.caption + " " : ""}Rings and letters added. <a href="${p.page}" target="_blank" rel="noopener">Image</a>: ${p.credit} · ${p.licence}. No scale bar: do not use for size calculations.</figcaption></figure>`;
  }

  B.divisionModel = { PAIRS, IDS, HAP, counts, frameCounts, frames, EXPECT, check, PARENT_KINDS, PHASES, TOTAL_H, W, H };
  B.divisionArt = { render, frameSVG, legend, cycleRing, dnaGraph, dnaGraphNotes, oneChromosome, phaseCell, growth, strip, spindleCloseUp, versusMeiosis, photoMarked, PHOTOS, chrSVG, svg, T, L, colours: { INK, GREY, TEAL, NAVY, AMBER, MAT, PAT } };
})(window.BIO);
