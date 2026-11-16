// Shared artwork, illustrative data and the one documented model for 3.2.8.2 Phloem and the passage of organic substances
// through a plant (Phase 4 Batch 3, owned by the 3.2.8.2 author). Loaded before data/content/3.2.8.2.js and
// js/views/interactives-phloem.js.
//
// COLOURS used in every drawing: blue = water and xylem; orange = sucrose, phloem sap and sieve tubes; green = cells
// that photosynthesise (sources); brown/beige = sink cells and bark. Arrows always show the true direction of movement.
//
// DIRECTIONS (checked arrow by arrow in the author report): xylem water always moves UP the plant, from the roots towards
// the leaves (transpiration stream). Phloem sap moves from a SOURCE to a SINK, up or down: from a mature leaf down to the
// roots or a storage organ, and up to the shoot tip or a fruit above it. At the source, sucrose is loaded into the sieve
// tube elements and water enters them by osmosis, mostly from the xylem; at the sink, sucrose is unloaded and water leaves.
//
// B.phloemData: every number used in the Experimental Evidence Challenge and in the page's data questions. ALL of these
// data sets are ILLUSTRATIVE (invented for teaching, built to show the pattern that the published experiments found),
// and the page says so beside each one. Ranges quoted as real (sieve tube pressure 0.1 to 2.5 MPa measured with aphid
// stylets; sap up to about 30 % sugar; translocation typically about 0.3 m h⁻¹ and up to about 1 m h⁻¹) are cited on the
// page (Saupe, CSB/SJU Plant Physiology lecture notes "Phloem transport"; OpenStax Biology 2e §30.5; Kimball's Biology,
// LibreTexts §16.2B).
//
// B.phloemModel.trunk(): the daily change in trunk diameter used for the xylem experiment. ILLUSTRATIVE MODEL, NOT A
// MEASUREMENT. Transpiration each quarter hour comes from the shared B.plantModel.leaf (data/content/_plant-model.js)
// for a clear summer day (light 0 at night, rising and falling smoothly (sine squared) from 06:00 to 20:00 with a peak of 1400 µmol m⁻² s⁻¹ at 13:00; air 18 °C at 03:00 to 32 °C at 15:00;
// relative humidity 80 % at 03:00 to 30 % at 15:00; wind 1 m s⁻¹). Assumptions: the trunk shrinks in proportion to the
// tension in the xylem, which is taken as proportional to the transpiration rate smoothed with a 1.5 hour time constant
// (water stored in the trunk tissues delays the response); soil is moist, so the trunk fully recovers overnight; no
// growth. Scale chosen so the largest shrinkage is 150 µm, within the tens to a few hundred micrometres reported for tree
// trunks with dendrometers. The shape (narrowest in the afternoon, widest just before dawn) is the point, not the values.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#1d2b28", MUTED = "#5c6b68", WATER = "#1f63b5", WATER_L = "#dbe9f8", SUC = "#c0610f", SUC_L = "#fde8cf",
    WALL = "#7a5f3a", LEAF = "#4f8a3a", LEAF_L = "#e3f1d6", SINK = "#8a6a3b", SINK_L = "#f5ead8", BARK = "#8b5a2b",
    WOOD = "#f4e3b5", RED = "#b3261e", PURPLE = "#6a3d9a", GREY = "#9aa5a2";
  const uid = () => Math.random().toString(36).slice(2, 7);
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="${o.s || 14}" fill="${o.c || INK}" text-anchor="${o.a || "middle"}"${o.w ? ` font-weight="${o.w}"` : ""}${o.i ? ' font-style="italic"' : ""}>${s}</text>`;
  // multi-line text: lines array, line height lh
  const TL = (x, y, lines, o = {}) => lines.map((l, i) => T(x, y + i * (o.lh || (o.s || 14) * 1.25), l, o)).join("");
  const defs = (u, cols) => `<defs>${Object.entries(cols).map(([k, c]) => `<marker id="ah-${k}-${u}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join("")}</defs>`;
  const arrow = (u, k, d, c, w = 3, extra = "") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" marker-end="url(#ah-${k}-${u})" stroke-linecap="round"${extra}/>`;
  const num = (x, y, n, o = {}) => `<g><circle cx="${x}" cy="${y}" r="${o.r || 12}" fill="${o.fill || "#fff"}" stroke="${o.c || INK}" stroke-width="2"/>${T(x, y + 5, n, { s: o.s || 14, w: 700, c: o.c || INK })}</g>`;
  const lead = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${MUTED}" stroke-width="1.2"/><circle cx="${x2}" cy="${y2}" r="2.6" fill="${MUTED}"/>`;
  const svgOpen = (w, h, label, width) => `<svg viewBox="0 0 ${w} ${h}" width="${width || w}" role="img" aria-label="${label}" style="max-width:100%;height:auto">`;
  const mito = (x, y, rot = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse rx="9" ry="5" fill="#f6c9a6" stroke="#a0522d" stroke-width="1.2"/><path d="M-6 0q1.5-3 3 0t3 0t3 0" fill="none" stroke="#a0522d" stroke-width="0.9"/></g>`;

  // ---------------------------------------------------------------------------------------------------------------------
  // Photo overlay kit (Phase 4 Batch 5, also used by _aphid-art.js): a published or generated UNLABELLED picture is the
  // picture layer; every label, leader line, arrow and tag is an SVG overlay drawn in a fixed viewBox, so it stays aligned
  // at any width (the pattern of the 3.2.6.2 heart figure). Text has a white halo so it reads where it crosses the picture.
  const PK = (() => {
    const FONT = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", K_INK = "#16263a", K_SUB = "#46566a";
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const r1 = (v) => Math.round(v * 10) / 10;
    let n = 0; const id = () => "pk" + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
    const open = (W, H, aria, o = {}) => `<svg viewBox="0 0 ${W} ${H}" width="${o.width || 900}" role="img" aria-label="${esc(aria)}" font-family="${FONT}" style="max-width:100%;height:auto"${o.cls ? ` class="${o.cls}"` : ""}><rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
    // the crop c = [x, y, w, h] (picture pixels) of img {src, w, h}, drawn at (dx, dy) and scaled by s
    const pic = (img, c, dx, dy, s, extra = "") => `<svg x="${r1(dx)}" y="${r1(dy)}" width="${r1(c[2] * s)}" height="${r1(c[3] * s)}" viewBox="${c.join(" ")}" overflow="hidden"${extra}><image href="${img.src}" x="0" y="0" width="${img.w}" height="${img.h}"/></svg>`;
    // picture pixel -> canvas coordinates for the same crop and placement
    const map = (c, dx, dy, s) => (x, y) => [r1(dx + (x - c[0]) * s), r1(dy + (y - c[1]) * s)];
    const T = (x, y, str, o = {}) => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.a || "start"}" font-size="${o.s || 30}" font-weight="${o.w || 700}" fill="${o.c || K_INK}"${o.halo === false ? "" : ` stroke="#ffffff" stroke-width="${o.hw || 8}" stroke-linejoin="round" paint-order="stroke"`}${o.it ? ' font-style="italic"' : ""}>${str}</text>`;
    const lead = (x1, y1, x2, y2, c = K_INK) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-opacity=".9"/><line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${c}" stroke-width="3"/><circle cx="${r1(x2)}" cy="${r1(y2)}" r="6.5" fill="${c}" stroke="#ffffff" stroke-width="2.5"/>`;
    // a label: lines[0] is the main term (bold), further lines are secondary (smaller, grey). The leader starts at the text
    // edge (or o.from) and ends with a dot exactly on each pin. Returns the SVG.
    const label = (lines, x, y, a, pins, o = {}) => {
      const s = o.s || 30, s2 = o.s2 || Math.round(s * 0.87); const P = !pins || !pins.length ? [] : Array.isArray(pins[0]) ? pins : [pins];
      const sx = o.from ? o.from[0] : a === "end" ? x + 12 : a === "start" ? x - 12 : x, sy = o.from ? o.from[1] : y - s * 0.36;
      let g = P.map(([px, py]) => lead(sx, sy, px, py, o.lc || K_INK)).join("");
      lines.forEach((l, i) => { const main = o.same || (i === 0 && !o.allSub); g += T(x, i === 0 ? y : y + s * 0.18 + i * s2 * 1.16, l, { a, s: main ? s : s2, w: main ? (o.w || 800) : 600, c: main ? (o.c || K_INK) : (o.c2 || K_SUB) }); });
      return `<g class="pk-lab"${o.key ? ` data-lab="${o.key}"` : ""} pointer-events="none">${g}</g>`; };
    const marker = (u, k, c) => `<marker id="pk-${k}-${u}" viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}" stroke="#ffffff" stroke-width="1" stroke-linejoin="round"/></marker>`;
    // arrow with a white casing so it reads on any part of the picture
    const arrow = (u, k, d, c, w = 8, o = {}) => `<g pointer-events="none"${o.attr || ""}><path d="${d}" fill="none" stroke="#ffffff" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".92"${o.da ? ` stroke-dasharray="${o.da}"` : ""}/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#pk-${k}-${u})"${o.da ? ` stroke-dasharray="${o.da}"` : ""}${o.cls ? ` class="${o.cls}"` : ""}/></g>`;
    const ptsD = (pts) => "M" + pts.map((p) => r1(p[0]) + " " + r1(p[1])).join(" L");
    // coloured tag (pill) with white text, centred on x
    const pill = (x, y, str, c, s = 26) => { const w = str.length * s * 0.68 + s * 1.1, h = s * 1.45; return `<g pointer-events="none"><rect x="${r1(x - w / 2)}" y="${r1(y - h / 2)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h / 2)}" fill="${c}" stroke="#ffffff" stroke-width="3"/>${T(x, y + s * 0.36, str, { a: "middle", s, w: 800, c: "#ffffff", halo: false })}</g>`; };
    const textW = (str, s, bold = true) => str.length * s * (bold ? 0.53 : 0.5);
    // the aphid feeding picture (assets/img/aphid-stylet-section.jpg, generated for this platform, unlabelled, 1536 × 1024):
    // path = the stylets traced on the picture from the tip of the rostrum to the stylet tip, which is inside the lumen of
    // a sieve tube element; the other points were read off the picture and checked by rendering markers on it.
    const STYLET = { img: { src: "assets/img/aphid-stylet-section.jpg", w: 1536, h: 1024 },
      path: [[428, 210], [436, 232], [446, 262], [446, 285], [418, 310], [390, 335], [382, 370], [350, 400], [345, 430], [366, 465], [358, 495], [332, 525], [326, 548], [362, 570], [404, 595], [407, 630], [386, 670], [366, 710], [360, 750], [365, 790], [386, 812], [412, 832], [482, 843]] };
    // sap moving up the stylets: a translucent orange band along the traced stylet path (from the tip in the sieve tube to
    // the rostrum) with solid chevrons ON the stylet pointing towards the aphid, so no arrow sits inside a leaf cell
    const sapAlong = (P, col, o = {}) => { const up = STYLET.path.slice().reverse(); const pts = up.map(([x, y]) => P(x, y)); const k = o.k || 1;
      let g = `<path d="${ptsD(pts)}" fill="none" stroke="${col}" stroke-width="${16 * k}" stroke-opacity=".45" stroke-linecap="round" stroke-linejoin="round"/>`;
      for (const i of [6, 13, 20]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const a = Math.atan2(y1 - y0, x1 - x0), L = 17 * k, Wd = 12 * k; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        const tip = [mx + Math.cos(a) * L / 2, my + Math.sin(a) * L / 2], b1 = [mx - Math.cos(a) * L / 2 - Math.sin(a) * Wd, my - Math.sin(a) * L / 2 + Math.cos(a) * Wd], b2 = [mx - Math.cos(a) * L / 2 + Math.sin(a) * Wd, my - Math.sin(a) * L / 2 - Math.cos(a) * Wd];
        g += `<path d="M${r1(tip[0])} ${r1(tip[1])} L${r1(b1[0])} ${r1(b1[1])} L${r1(b2[0])} ${r1(b2[1])} Z" fill="${col}" stroke="#ffffff" stroke-width="${2.5 * k}" stroke-linejoin="round"/>`; }
      return `<g pointer-events="none" data-r="sap-up">${g}</g>`; };
    return { STYLET, sapAlong, FONT, INK: K_INK, SUB: K_SUB, esc, r1, id, open, pic, map, T, lead, label, marker, arrow, ptsD, pill, textW };
  })();
  B.photoKit = PK;
  // ---------------------------------------------------------------------------------------------------------------------
  // 1. Phloem structure: longitudinal section (two sieve tube elements, sieve plates, companion cells, plasmodesmata) and
  //    two transverse views (sieve plate face-on; sieve tube element with its companion cell). Schematic, not to scale.
  //    o.numbers {key: n} replaces the labels with numbered markers (label question); keys: ste, plate, pd, wall, cyto, cc,
  //    nuc, mito, pores.
  function structure(o = {}) {
    const u = uid(), nb = o.numbers || null;
    const X0 = 175, X1 = 305, CX1 = 375; // sieve tube element x 175–305; companion cells x 305–375
    let s = svgOpen(790, 580, o.title || "Structure of phloem: sieve tube elements, sieve plates and companion cells", 640) + `<rect width="790" height="580" fill="#fff"/>`;
    // sieve tube elements (two, end to end) with walls
    const plateYs = [40, 290, 540];
    s += `<rect x="${X0}" y="40" width="${X1 - X0}" height="500" fill="${SUC_L}" stroke="${WALL}" stroke-width="5"/>`;
    // thin peripheral cytoplasm (no nucleus, no vacuole) inside each element
    [[46, 284], [296, 534]].forEach(([a, b]) => { s += `<rect x="${X0 + 6}" y="${a}" width="${X1 - X0 - 12}" height="${b - a}" rx="6" fill="none" stroke="#e7b77f" stroke-width="5"/>`; });
    // a few small organelles near the walls (few mitochondria, as in sieve tube elements)
    s += mito(X0 + 16, 120, 90, 0.8) + mito(X1 - 16, 410, 90, 0.8);
    // sieve plates: wall with pores
    plateYs.forEach((y) => { for (let x = X0; x < X1; x += 18) s += `<rect x="${x}" y="${y - 5}" width="8" height="10" fill="${WALL}"/>`; });
    // companion cells: dense cytoplasm, large nucleus, many mitochondria
    [[60, 280], [310, 530]].forEach(([a, b], k) => {
      s += `<rect x="${X1}" y="${a}" width="${CX1 - X1}" height="${b - a}" rx="10" fill="#f2cf9c" stroke="${WALL}" stroke-width="4"/>`;
      for (let i = 0; i < 46; i++) { const px = X1 + 9 + ((i * 37) % 54), py = a + 12 + ((i * 53) % (b - a - 24)); s += `<circle cx="${px}" cy="${py}" r="1.3" fill="#9c6b3c"/>`; }
      const ny = a + (k ? 120 : 100); s += `<ellipse cx="${X1 + 35}" cy="${ny}" rx="22" ry="30" fill="#c9a2d6" stroke="${PURPLE}" stroke-width="2"/><circle cx="${X1 + 38}" cy="${ny - 4}" r="6" fill="${PURPLE}" opacity=".55"/>`;
      [[a + 30, 20], [a + 160, -30], [a + 190, 15], [b - 22, 70], [a + 52, 80]].forEach(([y, r], j) => { s += mito(X1 + 18 + (j % 2) * 32, y, r, 0.95); });
    });
    // plasmodesmata through the shared wall (x = X1)
    const pdYs = [150, 220, 360, 450];
    pdYs.forEach((y) => { s += `<rect x="${X1 - 5}" y="${y - 2.5}" width="10" height="5" fill="${SUC_L}" stroke="${SUC}" stroke-width="1.2"/><path d="M${X1 + 5} ${y}l7 -5M${X1 + 5} ${y}l7 5" stroke="${SUC}" stroke-width="1.2"/>`; });
    // labels or numbers (left side)
    const L = (key, text, tx, ty, px, py, anchor = "end") => {
      if (nb && nb[key] == null) return; // numbered mode: no leader for an unnumbered structure
      s += lead(anchor === "end" ? tx + 4 : tx - 4, ty - 4, px, py);
      if (nb && nb[key] != null) s += num(anchor === "end" ? tx - 10 : tx + 10, ty - 4, String(nb[key]));
      else if (!nb) s += TL(tx, ty, [].concat(text), { s: 16, a: anchor });
    };
    L("ste", ["sieve tube", "element"], 150, 150, 230, 160);
    L("plate", ["sieve plate", "(end wall", "with pores)"], 150, 284, X0 + 20, 290);
    L("pd", ["plasmodesmata"], 150, 368, X1 - 2, 360);
    L("wall", ["cell wall", "(cellulose)"], 150, 436, X0, 440);
    L("cyto", ["thin layer of", "cytoplasm; no", "nucleus or", "vacuole"], 150, 482, X0 + 8, 505);
    L("cc", ["companion cell"], 395, 70, 355, 75, "start");
    L("nuc", ["nucleus"], 395, 162, X1 + 50, 165, "start");
    L("mito", ["mitochondria", "(many)"], 395, 236, X1 + 50, 220, "start");
    // the lower companion cell gets no labels (same structures)
    // right panels: face view of a sieve plate, and transverse section
    s += T(625, 34, nb ? "End wall seen face-on" : "Sieve plate seen face-on", { s: 16, w: 700 }); /* the question version must not name the sieve plate */
    s += `<circle cx="625" cy="140" r="78" fill="${WALL}"/>`;
    [[0, 0], [-34, -30], [0, -46], [34, -30], [-46, 6], [46, 6], [-30, 40], [0, 50], [30, 40], [-18, -10], [18, -10], [-17, 24], [17, 24]].forEach(([dx, dy]) => { s += `<circle cx="${625 + dx}" cy="${140 + dy}" r="9.5" fill="${SUC_L}"/>`; });
    L("pores", ["sieve pores"], 556, 250, 604, 184);
    s += T(625, 318, "Transverse section", { s: 16, w: 700 });
    s += `<circle cx="605" cy="430" r="80" fill="${SUC_L}" stroke="${WALL}" stroke-width="5"/><circle cx="605" cy="430" r="73" fill="none" stroke="#e7b77f" stroke-width="5"/>`;
    s += `<circle cx="692" cy="498" r="30" fill="#f2cf9c" stroke="${WALL}" stroke-width="4"/><rect x="662" y="476" width="12" height="5" transform="rotate(38 668 479)" fill="${SUC_L}" stroke="${SUC}" stroke-width="1.2"/><ellipse cx="692" cy="498" rx="12" ry="14" fill="#c9a2d6" stroke="${PURPLE}" stroke-width="1.5"/>`;
    if (!nb) s += TL(605, 425, ["sieve tube", "element"], { s: 15, c: MUTED }) + TL(742, 432, ["companion", "cell"], { s: 15, c: MUTED }); // not in the label question: they would give away answers
    s += T(30, 572, "Schematic, not to scale. The direction of flow depends on where the source and sink are; it can change over time.", { s: 14, c: MUTED, a: "start" });
    return s + `</svg>`;
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // 2. The mass flow hypothesis as a schematic. Source cells, companion cell and the start of the sieve tube at one end;
  //    sink cells at the other; a xylem vessel alongside. o.focus (1–6) fades every step except that one. o.flip puts the
  //    SINK at the top (used when the sink is higher in the plant than the source), so the drawing always matches the plant
  //    and the xylem arrow always points UP. o.srcName / o.snkName label the two ends.
  function massFlow(o = {}) {
    const u = uid(), W = 780, H = 720, flip = !!o.flip, f = o.focus || 0;
    // o.notes === false (the Explorer): the right-hand text column is left out (massFlowNotes gives the same words as HTML),
    // the viewBox is cropped to the drawing (x 0 to 545) and the small labels are drawn larger (o.big) so they stay readable.
    const notes = o.notes !== false, big = !!o.big, z = (a, b) => (big ? b : a);
    const Y = (y) => (flip ? H - y : y);
    const op = (n) => (f && f !== n ? ' opacity="0.18"' : "");
    const srcName = o.srcName || "mature leaf", snkName = o.snkName || "root";
    let s = svgOpen(notes ? W : 545, H, o.title || "The mass flow hypothesis") + `<rect width="${W}" height="${H}" fill="#fff"/>` + defs(u, { w: WATER, s: SUC, k: INK });
    // y positions (unflipped): source block 70–250, sink block 500–680; sieve tube 110–640 at x 300–370; xylem 450–520
    const ST0 = 300, ST1 = 370, XV0 = 450, XV1 = 520;
    const yTop = Math.min(Y(100), Y(650)), yBot = Math.max(Y(100), Y(650));
    // xylem vessel (full height) with lignin thickening
    s += `<rect x="${XV0}" y="40" width="${XV1 - XV0}" height="${H - 80}" fill="${WATER_L}" stroke="${WATER}" stroke-width="3"/>`;
    for (let y = 50; y < H - 45; y += 22) s += `<path d="M${XV0 + 2} ${y}L${XV1 - 2} ${y + 9}" stroke="#7aa3d4" stroke-width="2"/>`;
    // sieve tube with sieve plates
    s += `<rect x="${ST0}" y="${yTop}" width="${ST1 - ST0}" height="${yBot - yTop}" fill="${SUC_L}" stroke="${WALL}" stroke-width="3"/>`;
    for (let y = yTop + 110; y < yBot - 40; y += 110) for (let x = ST0; x < ST1; x += 14) s += `<rect x="${x}" y="${y - 3}" width="7" height="6" fill="${WALL}"/>`;
    // source cells (green) and companion cell
    const srcY = Y(160), snkY = Y(590);
    const cellsAt = (cy, fill, stroke, grains) => { let g = ""; [[40, -70], [150, -70], [40, 10], [150, 10]].forEach(([x, dy]) => { const y = cy + dy - 10; g += `<rect x="${x}" y="${y}" width="100" height="70" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`; for (let i = 0; i < 6; i++) g += grains(x + 18 + (i % 3) * 32, y + 22 + Math.floor(i / 3) * 26); }); return g; };
    s += cellsAt(srcY, LEAF_L, LEAF, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#7cb95b"/>`);
    s += cellsAt(snkY, SINK_L, SINK, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="6" fill="#fff" stroke="${SINK}" stroke-width="1.2"/>`);
    [srcY, snkY].forEach((cy) => { s += `<rect x="255" y="${cy - 55}" width="45" height="110" rx="9" fill="#f2cf9c" stroke="${WALL}" stroke-width="2.5"/>`; });
    // end labels
    const lab = (cy, title, lines, col) => { const y0 = cy < H / 2 ? 40 : H - 30; return notes ? T(150, y0, title, { s: 16, w: 700, c: col }) : T(40, y0, title, { s: 16, w: 700, c: col, a: "start" }); };
    s += lab(srcY, `SOURCE: ${srcName}`, [], LEAF) + lab(snkY, `SINK: ${snkName}`, [], SINK);
    s += T(278, (srcY < H / 2 ? srcY - 64 : srcY + 74), "companion cell", { s: z(12, 14.5), c: MUTED });
    s += T(485, 30, "xylem vessel", { s: z(13, 15), c: WATER, w: 700 });
    s += TL(268, H / 2 - 22, ["sieve tube", "(sieve tube", "elements end", "to end)"], { s: z(13, 15), c: SUC, w: 700, a: "end", lh: z(16, 18) }) + lead(272, H / 2 - 26, ST0 + 4, H / 2 - 26);
    s += TL(268, H / 2 + 68, ["sieve plate"], { s: z(12.5, 15), c: WALL, a: "end" }) + lead(272, H / 2 + 64, ST0 + 6, yTop + 330);
    // xylem arrow: always up
    s += arrow(u, "w", `M485 ${H - 70}L485 80`, WATER, 4, ' stroke-dasharray="14 10"');
    // step 1: sucrose loading at the source (cells → companion cell → sieve tube)
    s += `<g${op(1)}>${arrow(u, "s", `M235 ${srcY}L262 ${srcY}`, SUC, 4)}${arrow(u, "s", `M285 ${srcY}L318 ${srcY}`, SUC, 4)}${num(250, srcY - 24, "1", { c: SUC })}</g>`;
    // step 2: water enters from the xylem by osmosis
    s += `<g${op(2)}>${arrow(u, "w", `M${XV0 - 2} ${srcY + 30}L${ST1 + 8} ${srcY + 30}`, WATER, 4)}${num(410, srcY + 6, "2", { c: WATER })}</g>`;
    // step 3: high hydrostatic pressure at the source end
    const b3 = flip ? srcY - 128 : srcY + 108;
    s += `<g${op(3)}>${num(335, flip ? srcY - 92 : srcY + 82, "3", { c: INK })}${T(335, b3, "high", { s: z(13, 14.5), w: 700 })}${T(335, b3 + z(14, 16), "pressure", { s: z(13, 14.5), w: 700 })}</g>`;
    // step 4: mass flow from source to sink
    const m0 = Y(320), m1 = Y(455);
    s += `<g${op(4)}>${arrow(u, "s", `M335 ${m0}L335 ${m1}`, SUC, 9)}${num(410, (m0 + m1) / 2, "4", { c: SUC })}</g>`;
    // step 5: unloading at the sink
    s += `<g${op(5)}>${arrow(u, "s", `M318 ${snkY}L285 ${snkY}`, SUC, 4)}${arrow(u, "s", `M262 ${snkY}L235 ${snkY}`, SUC, 4)}${num(250, snkY - 24, "5", { c: SUC })}</g>`;
    // step 6: water leaves the sieve tube at the sink (into the xylem and the sink cells); lower pressure
    s += `<g${op(6)}>${arrow(u, "w", `M${ST1 + 8} ${snkY + 30}L${XV0 - 2} ${snkY + 30}`, WATER, 4)}${num(410, snkY + 6, "6", { c: WATER })}${T(335, flip ? snkY + 90 : snkY - 104, "lower", { s: z(13, 14.5), w: 700 })}${T(335, (flip ? snkY + 90 : snkY - 104) + z(14, 16), "pressure", { s: z(13, 14.5), w: 700 })}</g>`;
    if (!notes) return s + `</svg>`;
    // right-hand annotation column
    const colX = 548;
    const block = (cy, lines, n) => TL(colX, (cy < H / 2 ? cy - 100 : cy - 52), lines, { s: 15, a: "start", lh: 20 });
    s += `<g${f && ![1, 2, 3].includes(f) ? ' opacity="0.35"' : ""}>${block(srcY, ["<tspan font-weight='700'>At the source</tspan>", "1 sucrose actively loaded", "   into sieve tube elements", "2 water potential of the sap", "   falls; water enters by", "   osmosis from the xylem", "3 hydrostatic pressure rises"])}</g>`;
    s += `<g${f && ![5, 6].includes(f) ? ' opacity="0.35"' : ""}>${block(snkY, ["<tspan font-weight='700'>At the sink</tspan>", "5 sucrose unloaded; used in", "   respiration or growth, or", "   stored as starch", "6 water potential of the sap", "   rises; water leaves by", "   osmosis: lower pressure"])}</g>`;
    s += `<g${op(4)}>${TL(colX, H / 2 - 14, ["<tspan font-weight='700'>4 Mass flow</tspan> of sap", "from high to low", "hydrostatic pressure,", "source to sink"], { s: 15, a: "start", lh: 20 })}</g>`;
    s += TL(colX, H / 2 + 80, ["Xylem: water moves", "up the plant", "(transpiration)"], { s: 14, a: "start", c: WATER, lh: 18 });
    return s + `</svg>`;
  }

  // The right-hand text of massFlow as HTML (same words, same fading for the focused step), for the Explorer, which shows
  // the drawing cropped beside or above this text so both stay readable on a laptop screen.
  const MF_NOTES = [
    { steps: [1, 2, 3], head: "At the source", lines: ["1 sucrose actively loaded", "   into sieve tube elements", "2 water potential of the sap", "   falls; water enters by", "   osmosis from the xylem", "3 hydrostatic pressure rises"] },
    { steps: [4], op: 0.18, head: "4 Mass flow", tail: " of sap", lines: ["from high to low", "hydrostatic pressure,", "source to sink"] },
    { steps: [5, 6], head: "At the sink", lines: ["5 sucrose unloaded; used in", "   respiration or growth, or", "   stored as starch", "6 water potential of the sap", "   rises; water leaves by", "   osmosis: lower pressure"] },
  ];
  function massFlowNotes(o = {}) {
    const f = o.focus || 0, j = (ls) => ls.map((l) => l.trim()).reduce((a, l) => (/^\d /.test(l) ? a.concat([l]) : a.length ? a.slice(0, -1).concat([a[a.length - 1] + " " + l]) : [l]), []);
    const blk = (b) => { const op = f && !b.steps.includes(f) ? (b.op || 0.35) : 1; const ls = j(b.lines);
      return `<div class="mf-note" style="opacity:${op}"><p><strong>${b.head}</strong>${b.tail || ""}${b.tail ? " " + ls.join(" ") : ""}</p>${b.tail ? "" : `<ul>${ls.map((l) => `<li>${l}</li>`).join("")}</ul>`}</div>`; };
    return `<div class="mf-notes">${blk(MF_NOTES[0])}${blk(MF_NOTES[1])}${blk(MF_NOTES[2])}<div class="mf-note mf-xylem"><p>Xylem: water moves up the plant (transpiration)</p></div></div>`;
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // 3. Active loading at the source (supporting): proton pump and H⁺–sucrose co-transport into a companion cell, then
  //    sucrose through plasmodesmata into the sieve tube element. One common route (apoplastic loading); some species load
  //    through plasmodesmata all the way (not needed).
  function loading(o = {}) {
    const u = uid();
    let s = svgOpen(780, 400, o.title || "Active loading of sucrose by a companion cell") + `<rect width="780" height="400" fill="#fff"/>` + defs(u, { w: WATER, s: SUC, k: INK, r: RED });
    // regions
    s += `<rect x="20" y="60" width="150" height="290" rx="14" fill="${LEAF_L}" stroke="${LEAF}" stroke-width="2.5"/>` + TL(95, 82, ["mesophyll or", "phloem parenchyma", "cell"], { s: 12.5, c: LEAF, w: 700, lh: 15 });
    s += `<rect x="170" y="60" width="66" height="290" fill="#f4f1ea"/>`; for (let y = 66; y < 350; y += 14) s += `<path d="M172 ${y}l62 10" stroke="#ddd3c2" stroke-width="1.2"/>`;
    s += TL(203, 380, ["cell wall", "(apoplast)"], { s: 12, c: MUTED, lh: 13 });
    s += `<rect x="236" y="60" width="300" height="290" rx="14" fill="#f8e3c4" stroke="${WALL}" stroke-width="3"/>` + T(386, 82, "companion cell", { s: 14, w: 700, c: WALL });
    s += `<rect x="556" y="60" width="200" height="290" rx="8" fill="${SUC_L}" stroke="${WALL}" stroke-width="3"/>` + T(656, 82, "sieve tube element", { s: 14, w: 700, c: SUC });
    for (let x = 556; x < 756; x += 16) s += `<rect x="${x}" y="345" width="8" height="10" fill="${WALL}"/>`;
    // plasma membrane of the companion cell (left edge) with two proteins
    s += `<path d="M244 64V346" stroke="#8c7a5b" stroke-width="5" stroke-dasharray="2 3"/>`;
    // proton pump
    s += `<rect x="232" y="118" width="26" height="46" rx="8" fill="#e9a3a0" stroke="${RED}" stroke-width="2"/>` + T(318, 116, "proton pump", { s: 12.5, w: 700, c: RED });
    s += arrow(u, "r", "M262 140L196 140", RED, 3) + T(186, 132, "H⁺", { s: 15, w: 700, c: RED });
    s += T(318, 158, "ATP → ADP + Pi", { s: 12.5, c: RED }) + mito(300, 186, 0, 1.2) + T(352, 190, "ATP from", { s: 11.5, c: MUTED, a: "start" }) + T(352, 203, "respiration", { s: 11.5, c: MUTED, a: "start" });
    // co-transporter
    s += `<rect x="232" y="238" width="26" height="52" rx="8" fill="#f1c27d" stroke="${SUC}" stroke-width="2"/>` + T(330, 236, "co-transporter", { s: 12.5, w: 700, c: SUC });
    s += arrow(u, "r", "M196 252L262 252", RED, 3) + T(186, 247, "H⁺", { s: 15, w: 700, c: RED });
    s += arrow(u, "s", "M196 278L262 278", SUC, 3.5) + TL(182, 300, ["sucrose"], { s: 12.5, w: 700, c: SUC });
    s += TL(420, 252, ["H⁺ moves back in down", "its gradient, carrying", "sucrose in against its", "concentration gradient"], { s: 12, c: INK, lh: 15 });
    // sucrose from mesophyll into the wall
    s += arrow(u, "s", "M140 278L170 278", SUC, 3.5);
    // high sucrose inside; plasmodesmata to the sieve tube
    s += T(400, 330, "high sucrose concentration", { s: 12.5, w: 700, c: SUC });
    [150, 230].forEach((y) => { s += `<rect x="536" y="${y - 6}" width="20" height="12" fill="${SUC_L}" stroke="${SUC}" stroke-width="1.5"/>` + arrow(u, "s", `M500 ${y}L585 ${y}`, SUC, 3.5); });
    s += TL(440, 112, ["sucrose passes", "through plasmodesmata"], { s: 12, c: MUTED, lh: 14 });
    s += TL(656, 200, ["sucrose", "concentration of", "the sap rises;", "water potential", "falls"], { s: 12.5, lh: 16 });
    s += T(20, 30, "High H⁺ concentration in the cell wall; low H⁺ concentration inside the companion cell.", { s: 12.5, c: RED, a: "start" });
    return s + `</svg>`;
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // 4. Potato plant for sources and sinks and the Phloem Translocation Explorer (Phase 4 Batch 5). Picture layer:
  //    assets/img/potato-plant.jpg (generated for this platform, unlabelled, 1536 × 1024); every label, tag, ring and arrow
  //    is an overlay in the picture's own pixel coordinates. Organs: tip (growing leaves at the shoot tip), upper (upper
  //    mature leaf), fruit (the flowers, which become the fruit: the key is kept so the Explorer's logic is unchanged),
  //    lower (lower mature leaf), store (storage organ: the tuber at the end of a stolon), root (root tips). node = the
  //    height (y) at which the organ's route joins the stem; arm = the route from the stem out to the organ (traced on the
  //    picture). Xylem arrows run just left of the stem and phloem arrows just right of it: a schematic separation (in the
  //    stem both tissues are in the same vascular bundles). o.source, o.sink: organ keys (or o.flows: [[source, sink], ...]);
  //    o.ring removes a ring of bark and phloem at RING_Y; o.interactive adds focusable data-part hotspots; o.flow false
  //    hides the arrows; o.big draws larger text for the Explorer; o.season adds the spring and summer note under the plant.
  //    The ring is a MODEL ring that removes only the phloem: a potato stem is herbaceous (no bark; Solanaceae also have
  //    internal phloem), so real ringing is done on woody stems (figure d-3.2.8.2-5); the Explorer says so.
  const PLANT_IMG = { src: "assets/img/potato-plant.jpg", w: 1536, h: 1024 };
  const STEM = [[40, 766], [120, 767], [240, 760], [360, 759], [440, 755], [560, 753], [700, 750], [1000, 748]]; // [y, centre x], measured
  const stemX = (y) => { for (let i = 1; i < STEM.length; i++) if (y <= STEM[i][0]) { const [y0, x0] = STEM[i - 1], [y1, x1] = STEM[i]; return x0 + ((x1 - x0) * Math.max(0, y - y0)) / (y1 - y0); } return STEM[STEM.length - 1][1]; };
  const PXat = (y) => PK.r1(stemX(y) + 17), XXat = (y) => PK.r1(stemX(y) - 17);
  // hit: hotspot ellipses [cx, cy, rx, ry]; lab: [lines, x, baseline y, anchor, pins] for the figure; big: the same for o.big
  const ORG = {
    tip: { node: 62, name: "growing leaves at the shoot tip", arm: [], hit: [[748, 50, 70, 44]],
      lab: [["growing leaves (shoot tip)"], 640, 44, "end", [[726, 52]]], big: [["growing leaves", "(shoot tip)"], 640, 46, "end", [[726, 52]]] },
    fruit: { node: 192, name: "flowers and developing fruit", arm: [[805, 162], [850, 132], [885, 112]], hit: [[925, 118, 82, 82]],
      lab: [["flowers (later fruit)"], 1030, 76, "start", [[962, 110]]], big: [["flowers", "(later the fruit)"], 1026, 70, "start", [[962, 110]]] },
    upper: { node: 324, name: "upper mature leaf", arm: [[800, 298], [880, 286], [965, 284]], hit: [[945, 292, 140, 72]],
      lab: [["upper mature leaf"], 1096, 300, "start", [[1012, 293]]], big: [["upper mature", "leaf"], 1096, 300, "start", [[1012, 293]]] },
    lower: { node: 602, name: "lower mature leaf", arm: [[712, 578], [650, 568], [580, 562]], hit: [[600, 572, 125, 66]],
      lab: [["lower mature leaf"], 466, 572, "end", [[566, 566]]], big: [["lower mature", "leaf"], 466, 566, "end", [[566, 566]]] },
    store: { node: 722, name: "storage organ (tuber)", arm: [[795, 736], [880, 745], [970, 748], [1052, 750]], hit: [[1090, 752, 60, 42], [410, 778, 58, 40], [1015, 900, 56, 38]],
      lab: [["storage organ", "(tuber)"], 1262, 746, "start", [[1116, 752]]], big: [["storage", "organ", "(tuber)"], 1262, 740, "start", [[1116, 752]]] },
    root: { node: 985, name: "root tips", arm: [], hit: [[748, 990, 40, 36], [486, 908, 36, 34], [918, 940, 36, 34]],
      lab: [["root tips"], 236, 910, "end", [[486, 912], [748, 1004]]], big: [["root tips"], 236, 910, "end", [[486, 912], [748, 1004]]] },
  };
  const RING_Y = 646;
  // polyline from the source organ to the sink organ through the stem phloem
  function phloemPath(src, snk) {
    const a = ORG[src], b = ORG[snk];
    const pts = [...a.arm.slice().reverse(), [PXat(a.node), a.node], [PXat(b.node), b.node], ...b.arm];
    return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  }
  const blockedByRing = (src, snk) => (ORG[src].node > RING_Y) !== (ORG[snk].node > RING_Y);
  // xylem paths: from the root up the stem to the shoot tip, and out along the stalks into the two labelled leaves and the flowers
  const xylemPaths = () => [[[XXat(990), 990], [XXat(78), 78]], [[stemX(338), 338], [804, 314], [880, 303], [950, 301]], [[stemX(616), 616], [706, 594], [646, 585], [592, 580]], [[stemX(206), 206], [812, 177], [852, 148], [884, 130]]];
  const ptsD = (pts) => PK.ptsD(pts);
  // cut a phloem route where it meets the ring
  const stopAtRing = (pts) => { const out = []; for (let i = 0; i < pts.length; i++) { out.push(pts[i]); const n = pts[i + 1]; if (n && (pts[i][1] - RING_Y) * (n[1] - RING_Y) < 0) { const y = pts[i][1] < RING_Y ? RING_Y - 16 : RING_Y + 16; out.push([PK.r1(pts[i][0] + ((n[0] - pts[i][0]) * (y - pts[i][1])) / (n[1] - pts[i][1])), y]); break; } } return out; };
  function plant(o = {}) {
    const u = PK.id(), W = PLANT_IMG.w, H0 = PLANT_IMG.h, H = H0 + (o.season ? 196 : 0), flow = o.flow !== false, big = !!o.big;
    const flows = o.flows || [[o.source || "lower", o.sink || "root"]]; const ring = !!o.ring;
    const srcs = new Set(flows.map((f) => f[0])), snks = new Set(flows.map((f) => f[1]));
    const s1 = big ? 40 : 30, s2 = big ? 35 : 26;
    let s = PK.open(W, H, o.title || "Sources and sinks in a potato plant", { width: o.width || 900 }) + `<defs>${PK.marker(u, "w", WATER)}${PK.marker(u, "s", SUC)}</defs>`;
    s += `<image href="${PLANT_IMG.src}" x="0" y="0" width="${W}" height="${H0}"/>`;
    // source and sink outlines
    for (const [k, org] of Object.entries(ORG)) { const role = srcs.has(k) ? "src" : snks.has(k) ? "snk" : ""; if (!role) continue; const c = role === "src" ? LEAF : PURPLE;
      s += `<g pointer-events="none" data-role="${role}-${k}">` + org.hit.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#ffffff" stroke-width="14" stroke-opacity=".85"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="7"/>`).join("") + "</g>"; }
    // ring of bark removed: the bark (and the phloem in it) is gone; the wood (xylem) is left
    if (ring) { const x = stemX(RING_Y); s += `<g data-r="ring" pointer-events="none"><rect x="${PK.r1(x - 15)}" y="${RING_Y - 14}" width="30" height="28" fill="#ffffff"/><rect x="${PK.r1(x - 9)}" y="${RING_Y - 14}" width="18" height="28" fill="${WOOD}" stroke="${BARK}" stroke-width="2"/></g>`; }
    if (flow) {
      xylemPaths().forEach((p, i) => { s += PK.arrow(u, "w", ptsD(p), WATER, i ? 5 : 6, { da: "16 11" }); });
      for (const [a, b] of flows) { let pts = phloemPath(a, b); const blocked = ring && blockedByRing(a, b); if (blocked) pts = stopAtRing(pts);
        s += PK.arrow(u, "s", ptsD(pts), SUC, 9, { attr: ' data-r="phloem"' });
        if (blocked) { const x = stemX(RING_Y) + 17; s += `<path d="M${x - 18} ${RING_Y - 14}l36 28M${x + 18} ${RING_Y - 14}l-36 28" stroke="#ffffff" stroke-width="12"/><path d="M${x - 18} ${RING_Y - 14}l36 28M${x + 18} ${RING_Y - 14}l-36 28" stroke="${RED}" stroke-width="6"/>`; } }
    }
    // hotspots (focusable when interactive)
    if (o.interactive) for (const [k, org] of Object.entries(ORG)) s += `<g data-part="${k}" tabindex="0" role="button" aria-label="${org.name}"><title>${org.name}</title>${org.hit.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" fill-opacity="0" stroke="none"/>`).join("")}</g>`;
    // labels, with a SOURCE or SINK tag beside the first line
    for (const [k, org] of Object.entries(ORG)) { const [lines, x, y, a, pins] = big ? org.big : org.lab; const role = srcs.has(k) ? "SOURCE" : snks.has(k) ? "SINK" : "";
      s += PK.label(lines, x, y, a, pins, { s: s1, key: k, same: true });
      if (role) { const c = role === "SOURCE" ? LEAF : PURPLE, ts = big ? 36 : 26, pw = role.length * ts * 0.68 + ts * 1.1, tw = PK.textW(lines[0], s1);
        let px = a === "end" ? x - tw - 14 - pw / 2 : x + tw + 14 + pw / 2, py = y - s1 * 0.36;
        if (px - pw / 2 < 6 || px + pw / 2 > W - 6) { px = a === "end" ? x - pw / 2 : x + pw / 2; py = y - s1 - ts * 0.9; }
        s += PK.pill(px, py, role, c, ts); } }
    // in the figure, sinks that are not part of the two example flows say so, so students do not read them as non-sinks
    if (o.season) { s += PK.T(1030, 112, "(also a sink)", { s: 26, w: 600, c: PURPLE }) + PK.T(236, 946, "(also a sink)", { a: "end", s: 26, w: 600, c: PURPLE }); }
    if (ring) s += PK.label(big ? ["model ring:", "phloem removed"] : ["model ring: phloem removed"], 790, big ? 630 : 652, "start", null, { s: big ? 36 : 28, same: true, c: BARK });
    s += PK.T(1234, 1000, "soil", { a: "end", s: big ? 36 : 28, w: 700, c: SINK });
    // key
    const ky = big ? 404 : 418, ks = big ? 36 : 27;
    s += `<g pointer-events="none"><path d="M1100 ${ky} H1170" stroke="${WATER}" stroke-width="6" stroke-dasharray="16 11"/>${PK.T(1182, ky + ks * 0.36, "xylem: water", { s: ks, w: 700, c: WATER })}<path d="M1100 ${ky + ks * 1.5} H1170" stroke="${SUC}" stroke-width="9"/>${PK.T(1182, ky + ks * 1.86, "phloem: sap", { s: ks, w: 700, c: SUC })}</g>`;
    if (o.season) { const y0 = H0 + 14; const box = (x, title, lines, c, fill) => `<rect x="${x}" y="${y0}" width="752" height="170" rx="18" fill="${fill}" stroke="${c}" stroke-width="3"/>${PK.T(x + 22, y0 + 44, title, { s: 30, w: 800, c, halo: false })}${lines.map((l, i) => PK.T(x + 22, y0 + 86 + i * 34, l, { s: 27, w: 600, c: INK, halo: false })).join("")}`;
      s += box(8, "Summer (shown): the tuber is a SINK", ["sucrose arrives in the phloem and is", "unloaded; it is stored as starch"], PURPLE, "#f6f0fb");
      s += box(776, "Spring: the tuber is a SOURCE", ["its starch is hydrolysed to sugars; sucrose is", "loaded and carried up to the new shoots"], LEAF, "#eef6e8"); }
    return s + `</svg>`;
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // 5. Ringing (girdling) experiment, Phase 4 Batch 5. Picture layer: assets/img/ringing-stem.jpg (generated for this
  //    platform, unlabelled, 1536 × 1024): left, a woody stem just after a ring of bark was removed (pale wood exposed);
  //    right, the same kind of stem some weeks later with the bark swollen just above the ring. Overlays: phloem sap arrows
  //    in the bark stop at the ring; the xylem arrow runs up through the wood, through the ring. The picture is drawn 70 px
  //    down to leave room for the panel titles.
  const RING_IMG = { src: "assets/img/ringing-stem.jpg", w: 1536, h: 1024 };
  function ringing(o = {}) {
    const u = PK.id(), W = 1536, H = 1094, dy = 70; const P = (x, y) => [x, y + dy];
    let s = PK.open(W, H, o.title || "A ringing experiment: a stem just after a ring of bark was removed, and some weeks later with the bark swollen above the ring", { width: o.width || 650 }) + `<defs>${PK.marker(u, "w", WATER)}${PK.marker(u, "s", SUC)}</defs>`;
    s += `<image href="${RING_IMG.src}" x="0" y="${dy}" width="${RING_IMG.w}" height="${RING_IMG.h}"/>`;
    s += PK.T(397, 46, "Just after ringing", { a: "middle", s: 34, w: 800 }) + PK.T(1192, 46, "Some weeks later", { a: "middle", s: 34, w: 800 });
    const A = (pts, k, c, w, da) => PK.arrow(u, k, PK.ptsD(pts.map(([x, y]) => P(x, y))), c, w, da ? { da } : {});
    // phloem: sap moving down in the bark stops at the ring (ring top: y 565 left, 575 right)
    s += A([[340, 300], [340, 540]], "s", SUC, 9) + A([[456, 300], [456, 540]], "s", SUC, 9);
    s += A([[1134, 330], [1134, 548]], "s", SUC, 9) + A([[1251, 330], [1251, 548]], "s", SUC, 9);
    // xylem: water moves up in the wood, through the ring, to the leaves
    s += A([[398, 985], [398, 130]], "w", WATER, 7, "18 12") + A([[1192, 985], [1192, 130]], "w", WATER, 7, "18 12");
    const L = (lines, x, y, a, pins, opt = {}) => PK.label(lines, x, y + dy, a, (pins || []).map(([px, py]) => P(px, py)), Object.assign({ s: 29, s2: 26 }, opt));
    // left panel: labels in the white space to the left of the stem
    s += L(["Sap moves down", "in the phloem"], 286, 330, "end", null, { c: SUC, c2: SUC });
    s += L(["Bark", "(contains the phloem)"], 300, 452, "end", [[338, 446]]);
    s += L(["Bark removed", "phloem cut; wood", "(xylem) left in place"], 300, 586, "end", [[350, 610]]);
    s += L(["Water moves up", "in the xylem (wood),", "through the ring"], 300, 812, "end", null, { c: WATER, c2: WATER });
    // right panel: labels in the white space to the left of the stem
    s += L(["Leaves stay turgid", "water still reaches them in the xylem"], 1050, 296, "end", [[990, 178]]);
    s += L(["Bark swells above the ring", "sugars accumulate here"], 1050, 444, "end", [[1082, 470]]);
    s += L(["Below the ring", "no sugars arrive; the roots", "eventually starve"], 1050, 790, "end", [[1124, 800]]);
    return s + `</svg>`;
  }
  // ---------------------------------------------------------------------------------------------------------------------
  // 6. Radioactive tracer: stem transverse section and the autoradiograph made from it after a leaf was given ¹⁴CO₂.
  //    Illustrative (drawn, not a real autoradiograph).
  // o.panel "section" or "film" draws one half only (so each can be shown full width on a phone)
  function autorad(o = {}) {
    const u = uid(); const cx1 = 175, cx2 = 545, cy = 190, R = 130;
    const vb = o.panel === "section" ? "0 0 380 380" : o.panel === "film" ? "380 0 380 380" : "0 0 760 380";
    let s = `<svg viewBox="${vb}" width="${o.panel ? 380 : 760}" role="img" aria-label="${o.title || "Stem section and autoradiograph after ¹⁴CO₂ was supplied to a leaf"}" style="max-width:100%;height:auto">` + `<rect width="760" height="380" fill="#fff"/>`;
    const bundles = (cx, film) => { let g = ""; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + Math.PI / 8; const r1 = 78, r2 = 100; const xx = cx + Math.cos(a) * r1, xy = cy + Math.sin(a) * r1, px = cx + Math.cos(a) * r2, py = cy + Math.sin(a) * r2;
      if (!film) g += `<circle cx="${xx}" cy="${xy}" r="14" fill="${WATER_L}" stroke="${WATER}" stroke-width="2"/><ellipse cx="${px}" cy="${py}" rx="12" ry="8" transform="rotate(${(a * 180) / Math.PI + 90} ${px} ${py})" fill="${SUC_L}" stroke="${SUC}" stroke-width="2"/>`;
      else g += `<ellipse cx="${px}" cy="${py}" rx="13" ry="9" transform="rotate(${(a * 180) / Math.PI + 90} ${px} ${py})" fill="#1c1c1c" opacity=".9"/>`; } return g; };
    s += `<circle cx="${cx1}" cy="${cy}" r="${R}" fill="#eef6e6" stroke="${LEAF}" stroke-width="3"/><circle cx="${cx1}" cy="${cy}" r="58" fill="#fbfaf4" stroke="#cfc9b8"/>` + bundles(cx1, false);
    s += T(cx1, cy + 4, "pith", { s: 12, c: MUTED }) + T(cx1, 352, "Stem section (stained drawing)", { s: 14, w: 700 });
    s += `<rect x="${cx2 - 150}" y="${cy - 150}" width="300" height="300" fill="#e9e7e1" stroke="#b8b4aa"/><circle cx="${cx2}" cy="${cy}" r="${R}" fill="none" stroke="#c6c2b8" stroke-dasharray="4 4"/>` + bundles(cx2, true);
    s += T(cx2, 360, "Autoradiograph of the same section", { s: 14, w: 700 });
    // keys
    s += `<circle cx="20" cy="22" r="8" fill="${WATER_L}" stroke="${WATER}" stroke-width="2"/>${T(34, 27, "xylem", { s: 12.5, a: "start", c: WATER })}<ellipse cx="100" cy="22" rx="9" ry="6" fill="${SUC_L}" stroke="${SUC}" stroke-width="2"/>${T(114, 27, "phloem", { s: 12.5, a: "start", c: SUC })}`;
    s += `<rect x="400" y="12" width="14" height="14" fill="#1c1c1c"/>${T(422, 24, "dark = film exposed by ¹⁴C", { s: 12.5, a: "start" })}`;
    return s + `</svg>`;
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // 7. Aphid stylet technique (Phase 4 Batch 5): (a) a feeding aphid with its stylets in one sieve tube element; (b) the
  //    aphid removed and the stylets cut: sap keeps flowing from the cut end. Picture layer: the crop x 130–650, y 50–900 of
  //    assets/img/aphid-stylet-section.jpg (PK.STYLET), used twice. In (b) the part of the picture above the leaf surface
  //    (the aphid) is covered with white and the cut stylet stub and the drop of sap are drawn as overlays.
  function aphid(o = {}) {
    const u = PK.id(), S = PK.STYLET, C = [130, 50, 520, 850], W = 1700, H = 960, ty = 92;
    const Pa = PK.map(C, 20, ty, 1), Pb = PK.map(C, 870, ty, 1);
    let s = PK.open(W, H, o.title || "Using aphid stylets to sample phloem sap: (a) an aphid feeding with its stylets in a sieve tube element; (b) the aphid removed and the stylets cut, with sap flowing from the cut end", { width: o.width || 900 }) + `<defs>${PK.marker(u, "s", SUC)}</defs>`;
    s += PK.pic(S.img, C, 20, ty, 1) + PK.pic(S.img, C, 870, ty, 1);
    s += PK.T(20, 46, "(a) An aphid feeding", { s: 32, w: 800 }) + PK.T(870, 46, "(b) Aphid removed, stylets cut", { s: 32, w: 800 });
    // (a) sap forced up the stylets
    s += PK.sapAlong(Pa, SUC, { k: 1.4 });
    const La = (lines, y, pin, opt = {}) => PK.label(lines, 556, y, "start", pin ? [Pa(...pin)] : null, Object.assign({ s: 29, s2: 26 }, opt));
    s += La(["Aphid"], 170, [292, 150]);
    s += La(["Sap forced up", "the stylets by its", "own pressure"], 280, [390, 335], { c: SUC, c2: SUC });
    s += La(["Stylets", "pass between cells"], 470, [349, 430]);
    s += La(["Xylem vessel"], 640, [462, 668]);
    s += La(["Sieve tube element", "the stylet tip is inside it;", "the nucleus beside it is", "in a companion cell"], 760, [560, 826]);
    // (b) cover the aphid (everything above the leaf surface), then draw the cut stylets and a drop of sap
    const cover = [[130, 50], [650, 50], [650, 214], [610, 219], [560, 221], [500, 221], [470, 225], [452, 231], [446, 233], [130, 233]];
    s += `<path d="${PK.ptsD(cover.map(([x, y]) => Pb(x, y)))} Z" fill="#ffffff" pointer-events="none"/>`;
    const [bx, by] = Pb(441, 236), [tx, tyy] = Pb(437, 190);
    s += `<g pointer-events="none"><path d="M${bx} ${by} L${tx} ${tyy}" stroke="#3a2a1c" stroke-width="7" stroke-linecap="butt"/><path d="M${tx - 14} ${tyy + 2} l28 -4" stroke="${RED}" stroke-width="4"/>` +
      `<path d="M${tx} ${tyy - 4} c-16 -10 -20 -36 0 -54 c20 18 16 44 0 54 z" fill="${SUC_L}" stroke="${SUC}" stroke-width="4"/></g>`;
    const Lb = (lines, y, pin, opt = {}) => PK.label(lines, 1406, y, "start", pin ? [pin] : null, Object.assign({ s: 29, s2: 26 }, opt));
    s += Lb(["Drop of phloem sap", "keeps flowing out for", "hours; collected with", "a fine glass tube"], 120, [tx + 14, tyy - 30], { c: SUC });
    s += Lb(["Cut stylets", "left in the plant"], 330, [tx + 4, tyy + 26]);
    s += Lb(["Sieve tube element", "its sap is under", "pressure"], 790, Pb(560, 826));
    return s + `</svg>`;
  }
  // ---------------------------------------------------------------------------------------------------------------------
  // 8. Generic line chart for the evidence data (one or two panels sharing an x axis). series: [{name, pts:[[x,y]], col,
  //    dash}], opts: {xLabel, yLabel, xMin, xMax, yMin, yMax, xTicks, yTicks, title, w, h, note}
  function chart(series, opts) {
    const W = opts.w || 640, H = opts.h || 330, L = 78, R = 24, TOP = 34, BOT = 62; const pw = W - L - R, ph = H - TOP - BOT;
    const sx = (x) => L + ((x - opts.xMin) / (opts.xMax - opts.xMin)) * pw, sy = (y) => TOP + ph - ((y - opts.yMin) / (opts.yMax - opts.yMin)) * ph;
    let s = svgOpen(W, H, opts.title || "graph") + `<rect width="${W}" height="${H}" fill="#fff"/>`;
    (opts.yTicks || []).forEach((t) => { s += `<path d="M${L} ${sy(t)}H${L + pw}" stroke="#e3e7e6"/>` + T(L - 8, sy(t) + 4.5, String(t), { s: 13, a: "end" }); });
    (opts.xTicks || []).forEach((t) => { s += `<path d="M${sx(t)} ${TOP + ph}v6" stroke="${INK}"/>` + T(sx(t), TOP + ph + 22, typeof opts.xFmt === "function" ? opts.xFmt(t) : String(t), { s: 13 }); });
    s += `<path d="M${L} ${TOP}V${TOP + ph}H${L + pw}" stroke="${INK}" stroke-width="1.5" fill="none"/>`;
    if (opts.zero !== undefined) s += `<path d="M${L} ${sy(opts.zero)}H${L + pw}" stroke="${MUTED}" stroke-dasharray="4 4"/>`;
    series.forEach((se) => { s += `<path d="M${se.pts.map(([x, y]) => `${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join("L")}" fill="none" stroke="${se.col}" stroke-width="3"${se.dash ? ' stroke-dasharray="7 5"' : ""}/>`; if (se.dots) se.pts.forEach(([x, y]) => { s += `<circle cx="${sx(x)}" cy="${sy(y)}" r="4" fill="${se.col}"/>`; }); });
    s += T(L + pw / 2, H - 14, opts.xLabel || "", { s: 13.5 }) + `<text transform="translate(18 ${TOP + ph / 2}) rotate(-90)" font-family="system-ui, sans-serif" font-size="13.5" text-anchor="middle" fill="${INK}">${opts.yLabel || ""}</text>`;
    if (series.length > 1) series.forEach((se, i) => { const lx = L + 12 + i * 220; s += `<path d="M${lx} ${TOP - 16}h26" stroke="${se.col}" stroke-width="3"${se.dash ? ' stroke-dasharray="7 5"' : ""}/>` + T(lx + 32, TOP - 11, se.name, { s: 12.5, a: "start" }); });
    if (opts.note) s += T(W - R, TOP - 11, opts.note, { s: 12, a: "end", c: MUTED });
    return s + `</svg>`;
  }
  // bar chart: bars [{label, v, col}], opts {yLabel, yMax, yTicks, title, unit}
  function bars(list, opts) {
    const W = opts.w || 640, H = opts.h || 320, L = 78, R = 20, TOP = 30, BOT = 74; const pw = W - L - R, ph = H - TOP - BOT;
    const sy = (y) => TOP + ph - (y / opts.yMax) * ph; const bw = pw / list.length;
    let s = svgOpen(W, H, opts.title || "bar chart") + `<rect width="${W}" height="${H}" fill="#fff"/>`;
    (opts.yTicks || []).forEach((t) => { s += `<path d="M${L} ${sy(t)}H${L + pw}" stroke="#e3e7e6"/>` + T(L - 8, sy(t) + 4.5, String(t), { s: 13, a: "end" }); });
    list.forEach((b, i) => { const x = L + i * bw + bw * 0.2, w = bw * 0.6; s += `<rect x="${x}" y="${sy(b.v)}" width="${w}" height="${sy(0) - sy(b.v)}" fill="${b.col || SUC}"/>` + T(x + w / 2, sy(b.v) - 6, String(b.v), { s: 13, w: 700 }) + TL(x + w / 2, TOP + ph + 20, [].concat(b.label), { s: 12.5, lh: 15 }); });
    s += `<path d="M${L} ${TOP}V${TOP + ph}H${L + pw}" stroke="${INK}" stroke-width="1.5" fill="none"/>`;
    s += `<text transform="translate(18 ${TOP + ph / 2}) rotate(-90)" font-family="system-ui, sans-serif" font-size="13.5" text-anchor="middle" fill="${INK}">${opts.yLabel || ""}</text>`;
    return s + `</svg>`;
  }

  // ------------------------------------------------------------------ model ------------------------------------------------------------------
  const round = (x, dp = 1) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 1) => round(x, dp).toFixed(dp);
  // daily weather for the trunk model
  const day = (h) => { const hh = ((h % 24) + 24) % 24; const light = hh > 6 && hh < 20 ? 1400 * Math.sin((Math.PI * (hh - 6)) / 14) ** 2 : 0;
    const c = Math.cos((2 * Math.PI * (hh - 15)) / 24); return { light, temp: 25 + 7 * c, rh: 0.55 - 0.25 * c, wind: 1 }; };
  let _trunk = null;
  function trunk() {
    if (_trunk) return _trunk; const PM = B.plantModel; const dt = 0.25, tau = 1.5; let sm = 0; const out = [];
    for (let t = 0; t <= 48 + 1e-9; t += dt) { const E = PM.leaf(day(t)).Emmol; sm += ((E - sm) * dt) / tau; if (t >= 24) out.push({ h: round(t - 24, 2), E, sm }); }
    const maxSm = Math.max(...out.map((p) => p.sm)), minSm = Math.min(...out.map((p) => p.sm));
    const pts = out.map((p) => ({ h: p.h, E: p.E, d: -150 * (p.sm - minSm) / (maxSm - minSm) }));
    const hourly = pts.filter((p) => Math.abs(p.h - Math.round(p.h)) < 1e-6);
    const minP = pts.reduce((a, p) => (p.d < a.d ? p : a)), maxE = pts.reduce((a, p) => (p.E > a.E ? p : a));
    _trunk = { pts, hourly, narrowest: minP.h, peakE: maxE.h, maxShrink: -minP.d };
    return _trunk;
  }
  const hhmm = (h) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

  // ------------------------------------------------------------------ illustrative data ------------------------------------------------------------------
  // dye speed in a shoot (xylem), from the shared plant model: speed taken as proportional to transpiration; 0.9 cm min⁻¹
  // set for the bright, breezy condition.
  const dyeCond = { bright: { light: 800, temp: 25, rh: 0.5, wind: 1 }, dim: { light: 50, temp: 25, rh: 0.5, wind: 1 }, humid: { light: 800, temp: 25, rh: 0.9, wind: 1 } };
  const dye = (() => { const PM = B.plantModel; const Eb = PM.leaf(dyeCond.bright).Emmol; const k = 0.9 / Eb; const r = {}; for (const [n, c] of Object.entries(dyeCond)) r[n] = round(k * PM.leaf(c).Emmol, 2); return r; })();
  const DATA = {
    ringing: { weeks: 4, // ring 2 cm wide cut 30 cm below the lowest leaves of young woody stems; 6 ringed, 6 unringed
      rows: [["Sucrose in bark 5 cm above the ring site (mg g⁻¹ dry mass)", 18, 41], ["Sucrose in bark 5 cm below the ring site (mg g⁻¹ dry mass)", 17, 4], ["Increase in root dry mass over 4 weeks (g)", 12.0, 1.5], ["Leaves wilted (number of plants out of 6)", 0, 0]] },
    tracer: { // ¹⁴CO₂ supplied to one mature leaf halfway up the stem for 20 minutes in light; plant harvested after 3 hours
      organs: [["Fed leaf", 61], ["Shoot tip (young leaves)", 14], ["Upper mature leaves", 1], ["Stem", 9], ["Roots", 15]], // % of the ¹⁴C recovered
      front: { dist: 0.6, min: 45 } }, // tracer first detected 0.6 m below the fed leaf after 45 minutes
    stylet: { // severed stylets on one willow stem, sap collected for 1 hour from each; then the leaves were shaded
      pos: [[10, 0.68], [50, 0.60], [90, 0.52]], // distance below the leaves (cm), sucrose (mol dm⁻³)
      rate: [["Leaves in light", 1.6, 0.68], ["Leaves shaded for 6 hours", 0.6, 0.41]] }, // exudation (mm³ h⁻¹), sucrose (mol dm⁻³) at 10 cm
    inhibitor: { // ¹⁴CO₂ pulse to one leaf, THEN treatment; % of ¹⁴C in the roots after 3 hours (mean of 5 plants)
      groups: [["Control (water only)", 15], ["Respiratory inhibitor on the fed leaf", 2], ["Respiratory inhibitor on 2 cm of stem", 11], ["Fed leaf kept at 2 °C", 3]] },
    dye,
  };
  B.phloemArt = { structure, massFlow, massFlowNotes, loading, plant, ringing, autorad, aphid, chart, bars, ORG, RING_Y, phloemPath, blockedByRing, xylemPaths, colours: { INK, WATER, SUC, LEAF, PURPLE, RED, SINK, MUTED } };
  B.phloemModel = { trunk, day, hhmm, round, fix, DATA, dyeCond };
})(window.BIO);
