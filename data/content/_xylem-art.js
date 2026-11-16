// Artwork and small models for 3.2.8.1 Xylem and the passage of water and mineral ions through a plant (Phase 4 Batch 3,
// owned by the 3.2.8.1 author). Loaded after data/content/_plant-model.js and before data/content/3.2.8.1.js and
// js/views/interactives-xylem.js.
//
// ROOT SECTION (rootTS): a transverse section of a young dicotyledonous root drawn to match the Ranunculus (buttercup)
// micrographs on the page (slots root-ranunculus and root-stele): one-cell-thick epidermis (root hairs grow from some
// epidermal cells in the root-hair zone only), a wide cortex of rounded parenchyma cells with air spaces between them,
// a single ring of endodermis cells (Casparian strip shown as dark marks in their radial walls), a single ring of
// pericycle, and a central xylem "star" with four arms (tetrarch, as in Ranunculus): narrow protoxylem at the tips of the
// arms next to the pericycle, wide metaxylem vessels at the centre; phloem groups lie BETWEEN the arms. The stele is drawn
// about three times wider, relative to the root, than in the micrograph so that its tissues can be seen and labelled.
//
// PATHWAY STRIP (pathwayStrip): one radial row of cells from soil to xylem with two neighbours above and below. Water moves
// from left (outside) to right (centre). The walls BETWEEN cells of the row (vertical in the drawing) are tangential walls;
// the walls shared with the rows above and below (horizontal in the drawing) are radial walls. The Casparian strip lies in
// the radial (and transverse) walls of endodermis cells only, so it is drawn on the horizontal walls of the endodermis
// column: a route along the cell walls (apoplast) reaches it and is blocked; to go on, water must cross the endodermis
// cell's partially permeable cell-surface membrane into the cytoplasm (symplast). Routes are lists of waypoints, so the
// diagram, the simulator and the questions use the same geometry.
//
// WATER POTENTIAL SCENARIOS (B.xylemModel.scenarios): illustrative values in kPa along the soil-plant-air pathway, built
// to typical textbook ranges (OpenStax Biology 2e §30.5: cytoplasm −500 to −1000 kPa, leaf about −1500 kPa, atmosphere
// about −100 000 kPa; S. Saupe, Plant Physiology lecture notes, College of St Benedict / St John's University: soil at
// field capacity −15 kPa, permanent wilting point −1500 kPa; air −93 500 kPa at 50 % relative humidity, 20 °C; root
// pressure about 200 to 300 kPa). The water potential of air is CALCULATED from relative humidity with the standard
// relation Ψ = (RT / V̄w) ln(RH) (R = 8.314 J mol⁻¹ K⁻¹, V̄w = 1.805 × 10⁻⁵ m³ mol⁻¹), which gives the figures above.
// Every arrow in the explorer is drawn by code ONLY where the next station has a lower water potential, so arrows always
// point down the water potential gradient. Values are illustrations, not measurements.
window.BIO = window.BIO || {};
(function (B) {
  let n = 0; const uid = () => "xy" + (++n).toString(36) + Math.random().toString(36).slice(2, 5);
  const r1 = (x) => Math.round(x * 10) / 10;
  const pt = (cx, cy, r, deg) => { const a = (deg * Math.PI) / 180; return [r1(cx + r * Math.cos(a)), r1(cy + r * Math.sin(a))]; };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const rnd = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 20}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.weight ? ` font-weight="${o.weight}"` : ""} fill="${o.fill || "#1d2b28"}"${o.italic ? ' font-style="italic"' : ""}>${esc(s)}</text>`;
  const arrowDef = (id, col) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${col}"/></marker>`;
  const sector = (cx, cy, ra, rb, a1, a2) => { const [x1, y1] = pt(cx, cy, rb, a1), [x2, y2] = pt(cx, cy, rb, a2), [x3, y3] = pt(cx, cy, ra, a2), [x4, y4] = pt(cx, cy, ra, a1);
    return `M${x1},${y1} A${rb},${rb} 0 0 1 ${x2},${y2} L${x3},${y3} A${ra},${ra} 0 0 0 ${x4},${y4} Z`; };
  const C = { ink: "#1d2b28", line: "#3d4a47", epi: "#f3e6bf", epiS: "#8a6d2b", cor: "#eaf1d6", corS: "#71844a", endo: "#f6d2a0", endoS: "#a0522d", casp: "#4a2408",
    peri: "#e6dcf2", periS: "#6b5b8a", xyl: "#ffffff", xylS: "#b3262d", phl: "#c9e7df", phlS: "#1f7a6a", stele: "#f7f3e6", water: "#1f5fa8", apo: "#c4511f", sym: "#2a6fd0", vac: "#7a3fb0", ion: "#b0207a", wall: "#e7d3a6", cyto: "#e3f0d0", vacu: "#d8ecf7" };

  // ============================================ Root transverse section ============================================
  const ROOT = { cx: 300, cy: 285, R: 250, epi: [236, 250], cortex: [98, 234], endo: [88, 98], peri: [80, 88], stele: 80 };
  const PARTS = ["roothair", "epidermis", "cortex", "endodermis", "pericycle", "xylem", "phloem"];
  const LABELS = { roothair: "Root hair", epidermis: "Epidermis", cortex: "Cortex", endodermis: "Endodermis", pericycle: "Pericycle", xylem: "Xylem", phloem: "Phloem" };
  // target point on the tissue and label position (right column, top to bottom so no leader lines cross)
  const LEAD = { roothair: { t: pt(300, 285, 290, 228), l: [14, 34], anchor: "start" },
    epidermis: { t: pt(300, 285, 243, -40), l: [600, 66] }, cortex: { t: pt(300, 285, 172, -20), l: [600, 150] },
    endodermis: { t: pt(300, 285, 93, -6), l: [600, 236] }, pericycle: { t: pt(300, 285, 84, 12), l: [600, 304] },
    xylem: { t: pt(300, 285, 40, 45), l: [600, 372] }, phloem: { t: pt(300, 285, 58, 90), l: [600, 446] } };
  function rootTS(o = {}) {
    const { cx, cy } = ROOT; const id = uid(); const hl = o.highlight || null; const inter = !!o.interactive; const labels = o.labels !== false; const nums = o.numbers || null;
    const casp = o.casparian !== false;
    const g = (k, inner) => `<g data-part="${k}"${inter ? ` tabindex="0" role="button" aria-label="${esc(LABELS[k])}"` : ""}${hl && hl !== k ? ' opacity="0.28"' : ""}${hl === k ? ' class="hl"' : ""}><title>${esc(LABELS[k])}</title>${inner}</g>`;
    // epidermis
    let epi = ""; const nE = 92; for (let i = 0; i < nE; i++) epi += `<path d="${sector(cx, cy, ROOT.epi[0], ROOT.epi[1], (360 * i) / nE, (360 * (i + 1)) / nE)}"/>`;
    // root hairs: tubular outgrowths of single epidermal cells (upper left)
    let hairs = ""; [[204, 52], [216, 60], [228, 54], [240, 46], [252, 40]].forEach(([a, L]) => { const [x1, y1] = pt(cx, cy, ROOT.R - 6, a), [x2, y2] = pt(cx, cy, ROOT.R + L, a);
      hairs += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.epiS}" stroke-width="9" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.epi}" stroke-width="5.5" stroke-linecap="round"/>`; });
    // cortex: rings of rounded parenchyma cells with intercellular air spaces
    let cor = ""; const R = rnd(7); const rings = [[106, 14], [121, 15.5], [137.5, 17], [155.5, 19], [175.5, 21], [197.5, 23], [221, 24]];
    rings.forEach(([rr, d], k) => { const m = Math.floor((2 * Math.PI * rr) / d); const off = k % 2 ? 180 / m : 0;
      for (let i = 0; i < m; i++) { const a = off + (360 * i) / m + (R() - 0.5) * 3; const [x, y] = pt(cx, cy, rr + (R() - 0.5) * 2, a); cor += `<circle cx="${x}" cy="${y}" r="${r1(d / 2 - 1.3 - R() * 0.8)}"/>`; } });
    const corBg = `<path d="M${cx - ROOT.cortex[1]},${cy} a${ROOT.cortex[1]},${ROOT.cortex[1]} 0 1 0 ${2 * ROOT.cortex[1]},0 a${ROOT.cortex[1]},${ROOT.cortex[1]} 0 1 0 ${-2 * ROOT.cortex[1]},0 Z M${cx - ROOT.cortex[0]},${cy} a${ROOT.cortex[0]},${ROOT.cortex[0]} 0 1 1 ${2 * ROOT.cortex[0]},0 a${ROOT.cortex[0]},${ROOT.cortex[0]} 0 1 1 ${-2 * ROOT.cortex[0]},0 Z" fill="#fbfcf5" fill-rule="evenodd" stroke="none"/>`;
    // endodermis with Casparian strip marks in each radial wall
    let endo = "", cmarks = ""; const nD = 52; for (let i = 0; i < nD; i++) { const a1 = (360 * i) / nD; endo += `<path d="${sector(cx, cy, ROOT.endo[0], ROOT.endo[1], a1, (360 * (i + 1)) / nD)}"/>`;
      if (casp) { const [x, y] = pt(cx, cy, 93, a1); cmarks += `<circle cx="${x}" cy="${y}" r="1.9"/>`; } }
    let peri = ""; const nP = 50; for (let i = 0; i < nP; i++) peri += `<path d="${sector(cx, cy, ROOT.peri[0], ROOT.peri[1], (360 * i) / nP + 3, (360 * (i + 1)) / nP + 3)}"/>`;
    // xylem: four arms (tetrarch); protoxylem (narrow) at the tips, metaxylem (wide) at the centre
    let xy = `<circle cx="${cx}" cy="${cy}" r="14"/>`; [45, 135, 225, 315].forEach((a) => [[24, 10], [43, 7.5], [59, 5.5], [72, 4]].forEach(([rr, s]) => { const [x, y] = pt(cx, cy, rr, a); xy += `<circle cx="${x}" cy="${y}" r="${s}"/>`; }));
    // phloem: groups of sieve tubes (larger) and companion cells (small, dense) between the arms
    let ph = ""; [0, 90, 180, 270].forEach((a) => { [[58, 0, 5], [57, 9, 4.5], [57, -9, 4.5], [67, 4, 3.6], [67, -4, 3.6], [49, 0, 3.6]].forEach(([rr, da, s]) => { const [x, y] = pt(cx, cy, rr, a + da); ph += `<circle cx="${x}" cy="${y}" r="${s}"/>`; });
      [[62, 5], [62, -5], [53, 6], [53, -6]].forEach(([rr, da]) => { const [x, y] = pt(cx, cy, rr, a + da); ph += `<circle cx="${x}" cy="${y}" r="1.8" fill="${C.phlS}"/>`; }); });
    const lab = (k) => { if (!labels && !(nums && nums[k])) return ""; const L = LEAD[k]; const [tx, ty] = L.t; const [lx, ly] = L.l; const right = L.anchor !== "start";
      const sx = right ? lx - 8 : lx + 112, sy = ly - 7; const line = `<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="${C.line}" stroke-width="1.6"/><circle cx="${tx}" cy="${ty}" r="3" fill="${C.line}"/>`;
      if (nums && nums[k]) return line + `<circle cx="${right ? lx + 16 : lx + 130}" cy="${ly - 7}" r="17" fill="#fff" stroke="${C.ink}" stroke-width="2"/>${T(right ? lx + 16 : lx + 130, ly, nums[k], { size: 20, anchor: "middle", weight: 700 })}`;
      return line + T(right ? lx : lx, ly, LABELS[k], { size: 23 }); };
    const parts = {
      roothair: `<g>${hairs}</g>`,
      epidermis: `<g fill="${C.epi}" stroke="${C.epiS}" stroke-width="1.1">${epi}</g>`,
      cortex: `${corBg}<g fill="${C.cor}" stroke="${C.corS}" stroke-width="1">${cor}</g>`,
      endodermis: `<g fill="${C.endo}" stroke="${C.endoS}" stroke-width="1.1">${endo}</g><g fill="${C.casp}">${cmarks}</g>`,
      pericycle: `<g fill="${C.peri}" stroke="${C.periS}" stroke-width="1">${peri}</g>`,
      xylem: `<g fill="${C.xyl}" stroke="${C.xylS}" stroke-width="2.6">${xy}</g>`,
      phloem: `<g fill="${C.phl}" stroke="${C.phlS}" stroke-width="1">${ph}</g>`,
    };
    const order = ["cortex", "epidermis", "roothair", "endodermis", "pericycle", "phloem", "xylem"];
    const steleBg = `<circle cx="${cx}" cy="${cy}" r="${ROOT.stele}" fill="${C.stele}" stroke="none"/>`;
    const title = o.title || "Transverse section of a young dicotyledonous root";
    const w = o.width || 860;
    return `<svg viewBox="0 0 860 570" width="${w}" role="img" aria-label="${esc(title)}" style="max-width:100%;height:auto" data-id="${id}"><title>${esc(title)}</title><rect width="860" height="570" fill="#fff"/>
      ${steleBg}${order.map((k) => g(k, parts[k])).join("")}
      ${PARTS.map(lab).join("")}
      ${o.scaleNote !== false ? T(14, 560, "Schematic: the stele is drawn larger than in a real root so its tissues can be seen.", { size: 16, fill: "#55625e" }) : ""}</svg>`;
  }

  // ============================================ Pathway strip (apoplast v symplast) ============================================
  const COLS = [{ k: "hair", x0: 60, x1: 175, name: "Root hair cell" }, { k: "c1", x0: 175, x1: 285, name: "Cortex" }, { k: "c2", x0: 285, x1: 395, name: "Cortex" }, { k: "c3", x0: 395, x1: 505, name: "Cortex" },
    { k: "endo", x0: 505, x1: 590, name: "Endodermis" }, { k: "peri", x0: 590, x1: 665, name: "Pericycle" }];
  const ROWS = [[50, 160], [160, 270], [270, 380]]; const XV = [665, 770]; const WALL = 6;
  // waypoints: [x, y, event] — event text keys are explained by the simulator; "m" marks a membrane crossing
  // The symplastic route runs in the band of cytoplasm BELOW each vacuole (never through a vacuole) and passes from cell to
  // cell through the plasmodesmata drawn at that height; after the Casparian strip the apoplastic water joins the
  // cytoplasm in the band ABOVE the endodermis vacuole. The pericycle cells have no vacuole drawn.
  const ROUTES = {
    sym: [[4, 215, "soil"], [20, 215, "m-in"], [72, 215, "cyto"], [74, 255, "cyto"], [175, 255, "pd"], [230, 255, "cyto"], [285, 255, "pd"], [340, 255, "cyto"], [395, 255, "pd"], [450, 255, "cyto"], [505, 255, "pd"], [547, 255, "endo-cyto"], [590, 255, "pd"], [627, 240, "cyto"], [668, 215, "m-out"], [717, 215, "xylem"], [717, 30, "up"]],
    apo: [[4, 200, "soil"], [63, 200, "wall"], [63, 160, "wall"], [175, 160, "wall"], [285, 160, "wall"], [395, 160, "wall"], [505, 160, "wall"], [521, 160, "casp"]],
    apoBlocked: [[530, 175, "m-in"], [547, 175, "endo-cyto"], [590, 175, "pd"], [627, 190, "cyto"], [668, 215, "m-out"], [717, 215, "xylem"], [717, 30, "up"]],
    apoOpen: [[590, 160, "wall"], [665, 160, "wall"], [669, 160, "pit"], [717, 160, "xylem"], [717, 30, "up"]],
  };
  function pathwayStrip(o = {}) {
    const id = uid(); const casp = o.casparian !== false; const show = o.routes || []; const labels = o.labels !== false;
    let s = `<svg viewBox="0 0 950 470" width="${o.width || 950}" role="img" aria-label="${esc(o.title || "Apoplastic and symplastic pathways across a root")}" style="max-width:100%;height:auto" data-id="${id}"><title>${esc(o.title || "Apoplastic and symplastic pathways across a root")}</title>
      <defs>${arrowDef(id + "a", C.apo)}${arrowDef(id + "s", C.sym)}${arrowDef(id + "w", C.water)}
      <pattern id="${id}soil" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#efe4d2"/><circle cx="6" cy="7" r="4" fill="#d3bf9c"/><circle cx="16" cy="16" r="3.4" fill="#c9b28a"/></pattern></defs>
      <rect width="950" height="470" fill="#fff"/>
      <rect x="0" y="40" width="62" height="350" fill="url(#${id}soil)"/>
      <rect x="${COLS[0].x0}" y="${ROWS[0][0]}" width="${XV[0] - COLS[0].x0}" height="${ROWS[2][1] - ROWS[0][0]}" fill="${C.wall}" stroke="#b89a5e" stroke-width="1"/>`;
    // root hair: a tube from the middle epidermal cell out into the soil
    s += `<rect x="4" y="197" width="70" height="36" rx="16" fill="${C.wall}" stroke="#6b5426" stroke-width="2"/>`;
    COLS.forEach((c, ci) => ROWS.forEach(([y0, y1], ri) => { const x = c.x0 + WALL, y = y0 + WALL, w = c.x1 - c.x0 - 2 * WALL, h = y1 - y0 - 2 * WALL;
      const fill = c.k === "endo" ? "#f6e2c2" : c.k === "peri" ? "#efe8f6" : C.cyto;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="#6b8f4e" stroke-width="1.4"/>`;
      if (c.k !== "peri") s += `<rect x="${x + 16}" y="${y + 18}" width="${w - 32}" height="${h - 36}" rx="14" fill="${C.vacu}" stroke="#7fa7c2" stroke-width="1"/>`;
      // plasmodesmata through the tangential wall on the right of each cell (to the next cell in the row)
      if (ci < COLS.length - 1) [y0 + 15, (y0 + y1) / 2, y1 - 15].forEach((py) => { s += `<rect x="${c.x1 - WALL - 2}" y="${py - 2}" width="${2 * WALL + 4}" height="4" fill="#2f6b3a"/>`; }); }));
    s += `<rect x="10" y="203" width="74" height="24" rx="11" fill="${C.cyto}"/>`; // hair cytoplasm continuous with the cell's
    // Casparian strip in the radial walls (horizontal in the drawing) of the endodermis column
    if (casp) [ROWS[0][0], ROWS[1][0], ROWS[2][0], ROWS[2][1]].forEach((y) => { s += `<rect x="526" y="${y - WALL}" width="38" height="${2 * WALL}" fill="${C.casp}"/>`; }); // a band in the middle of each radial wall
    // xylem vessel: dead, empty, lignified walls with pits
    s += `<rect x="${XV[0]}" y="20" width="${XV[1] - XV[0]}" height="370" fill="#fff"/>`;
    [[XV[0], XV[0] + 10], [XV[1] - 10, XV[1]]].forEach(([a, b]) => { s += `<rect x="${a}" y="20" width="${b - a}" height="370" fill="${C.xylS}"/>`; });
    [160, 215, 270].forEach((py) => { s += `<rect x="${XV[0] - 1}" y="${py - 7}" width="12" height="14" fill="${C.wall}"/>`; });
    for (let y = 34; y < 390; y += 26) s += `<line x1="${XV[0] + 10}" y1="${y}" x2="${XV[1] - 10}" y2="${y + 8}" stroke="${C.xylS}" stroke-width="3" opacity=".45"/>`;
    s += `<rect x="${XV[1]}" y="20" width="180" height="370" fill="#fff"/>`;
    // route lines
    const line = (pts, col, mk, dash) => `<polyline points="${pts.map((p) => p[0] + "," + p[1]).join(" ")}" fill="none" stroke="${col}" stroke-width="4.5" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ""} marker-end="url(#${id + mk})"/>`;
    if (show.includes("sym")) s += line(ROUTES.sym, C.sym, "s");
    // the route visibly passes THROUGH each plasmodesma: a wider dark green channel drawn round the line at every wall
    const pdOn = (pts) => pts.filter((p) => p[2] === "pd").map(([x, y]) => `<rect x="${x - WALL - 2}" y="${y - 7}" width="${2 * WALL + 4}" height="3" fill="#2f6b3a"/><rect x="${x - WALL - 2}" y="${y + 4}" width="${2 * WALL + 4}" height="3" fill="#2f6b3a"/>`).join("");
    if (show.includes("sym")) s += pdOn(ROUTES.sym);
    if (show.includes("apo")) { s += line(casp ? ROUTES.apo.slice(0, -1).concat([[519, 160]]) : ROUTES.apo.concat(ROUTES.apoOpen), C.apo, "a", "10 6");
      if (casp) s += line([[521, 160]].concat(ROUTES.apoBlocked), C.apo, "a", "3 5") + pdOn(ROUTES.apoBlocked); }
    if (labels) {
      s += T(8, 30, "Soil", { size: 20, weight: 700 }) + T(717, 15, "to the stem", { size: 20, anchor: "middle" });
      COLS.forEach((c, i) => { if (i === 2 || i === 3) return; const x = i === 1 ? (COLS[1].x0 + COLS[3].x1) / 2 : (c.x0 + c.x1) / 2; s += T(x, i % 2 ? 412 : 440, c.name, { size: 22, anchor: "middle" }); });
      s += `<line x1="${COLS[1].x0 + 6}" y1="396" x2="${COLS[3].x1 - 6}" y2="396" stroke="${C.line}" stroke-width="1.4"/>`;
      s += T(717, 440, "Xylem vessel", { size: 22, anchor: "middle" });
      s += T(782, 70, "Key", { size: 21, weight: 700 });
      s += `<rect x="782" y="82" width="22" height="14" fill="${C.wall}" stroke="#b89a5e"/>` + T(808, 95, "cell wall", { size: 19 });
      s += `<rect x="782" y="106" width="22" height="14" fill="${C.cyto}" stroke="#6b8f4e"/>` + T(808, 119, "cytoplasm", { size: 19 });
      s += `<rect x="782" y="130" width="22" height="14" fill="${C.vacu}" stroke="#7fa7c2"/>` + T(808, 143, "vacuole", { size: 19 });
      s += `<rect x="782" y="158" width="22" height="5" fill="#2f6b3a"/>` + T(808, 166, "plasmodesma", { size: 19 });
      if (casp) s += `<rect x="782" y="180" width="22" height="12" fill="${C.casp}"/>` + T(808, 191, "Casparian strip", { size: 19 });
      if (show.includes("apo")) s += `<line x1="782" y1="222" x2="804" y2="222" stroke="${C.apo}" stroke-width="4.5" stroke-dasharray="10 6"/>` + T(808, 228, "apoplast", { size: 19 });
      if (show.includes("sym")) s += `<line x1="782" y1="248" x2="804" y2="248" stroke="${C.sym}" stroke-width="4.5"/>` + T(808, 254, "symplast", { size: 19 });
      if (casp && show.includes("apo")) s += T(782, 330, "dotted: water", { size: 18, fill: "#55625e" }) + T(782, 352, "must cross a", { size: 18, fill: "#55625e" }) + T(782, 374, "membrane here", { size: 18, fill: "#55625e" });
    }
    return s + `<g data-r="overlay"></g></svg>`;
  }

  // ============================================ Xylem vessel structure ============================================
  function xylemStructure(o = {}) {
    const id = uid(); let s = `<svg viewBox="0 0 920 470" width="${o.width || 920}" role="img" aria-label="Structure of xylem vessels in longitudinal and transverse section" style="max-width:100%;height:auto" data-id="${id}"><title>Structure of xylem vessels</title><rect width="920" height="470" fill="#fff"/>`;
    // LS: a vessel of three elements, end walls gone (only a rim remains), lignin rings and spiral, bordered pits
    const x0 = 90, x1 = 200; s += `<rect x="${x0}" y="30" width="${x1 - x0}" height="400" fill="#fff" stroke="none"/>`;
    s += `<rect x="${x0 - 12}" y="30" width="12" height="400" fill="${C.xylS}"/><rect x="${x1}" y="30" width="12" height="400" fill="${C.xylS}"/>`;
    [163, 296].forEach((y) => { s += `<rect x="${x0}" y="${y - 3}" width="16" height="6" fill="${C.xylS}"/><rect x="${x1 - 16}" y="${y - 3}" width="16" height="6" fill="${C.xylS}"/>`; });
    for (let y = 44; y < 160; y += 22) s += `<ellipse cx="${(x0 + x1) / 2}" cy="${y}" rx="${(x1 - x0) / 2}" ry="5" fill="none" stroke="${C.xylS}" stroke-width="4"/>`;
    // spiral (helix): the near side of each turn runs down across the lumen (solid); the far side runs back (faint)
    for (let y = 172; y < 284; y += 18) s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y + 9}" stroke="${C.xylS}" stroke-width="4" stroke-linecap="round"/><line x1="${x1}" y1="${y + 9}" x2="${x0}" y2="${y + 18}" stroke="${C.xylS}" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;
    [[x1 + 6, 330], [x1 + 6, 370], [x1 + 6, 410], [x0 - 6, 350], [x0 - 6, 395]].forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y}" rx="7" ry="11" fill="#fff" stroke="#7a1c20" stroke-width="2"/>`; });
    s += `<line x1="${(x0 + x1) / 2}" y1="420" x2="${(x0 + x1) / 2}" y2="45" stroke="${C.water}" stroke-width="5" marker-end="url(#${id}w)" opacity=".85"/>`;
    s += `<defs>${arrowDef(id + "w", C.water)}</defs>`;
    const L = (y, ty, txt, txt2) => `<line x1="${x1 + 20}" y1="${y}" x2="330" y2="${ty - 6}" stroke="${C.line}" stroke-width="1.5"/>` + T(336, ty, txt, { size: 20 }) + (txt2 ? T(336, ty + 24, txt2, { size: 17, fill: "#55625e" }) : "");
    s += L(90, 62, "Lignin thickening in rings (annular)", "strengthens, waterproofs, resists collapse");
    s += L(200, 148, "or in a spiral (helical)", "allows the young vessel to stretch as it grows");
    s += `<line x1="${x1 - 8}" y1="296" x2="330" y2="232" stroke="${C.line}" stroke-width="1.5"/>` + T(336, 238, "Rim where an end wall broke down:", { size: 20 }) + T(336, 262, "cells joined end to end in a continuous tube", { size: 17, fill: "#55625e" });
    s += L(370, 318, "Pits: thin, unlignified areas", "water and ions move sideways between vessels");
    s += `<line x1="${(x0 + x1) / 2 + 6}" y1="400" x2="330" y2="400" stroke="${C.line}" stroke-width="1.5"/>` + T(336, 406, "Empty lumen: no cytoplasm, nucleus or end walls", { size: 20 }) + T(336, 430, "(dead cells), so little resistance to flow", { size: 17, fill: "#55625e" });
    s += T(145, 22, "Longitudinal section", { size: 17, anchor: "middle", fill: "#55625e" });
    // TS inset
    s += T(830, 22, "Transverse section", { size: 17, anchor: "middle", fill: "#55625e" });
    [[800, 80, 26], [856, 92, 20], [826, 140, 22], [870, 140, 12], [790, 130, 12]].forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${C.xylS}" stroke-width="5"/>`; });
    return s + T(14, 462, "Schematic, not to scale. Most vessels combine several patterns; mature vessels have heavily lignified walls with many pits.", { size: 15, fill: "#55625e" }) + `</svg>`;
  }

  // ============================================ Leaf: evaporation and diffusion ============================================
  function leafWater(o = {}) {
    const id = uid(); const open = o.open !== false; const labels = o.labels !== false; const steps = o.steps !== false;
    let s = `<svg viewBox="0 0 980 470" width="${o.width || 980}" role="img" aria-label="${esc(o.title || "Water leaving a leaf: from xylem to mesophyll cell walls, evaporation into air spaces and diffusion of water vapour out through a stoma")}" style="max-width:100%;height:auto" data-id="${id}"><title>${esc(o.title || "Water movement through a leaf")}</title>
      <defs>${arrowDef(id + "w", C.water)}${arrowDef(id + "k", C.ink)}</defs><rect width="980" height="470" fill="#fff"/><rect x="0" y="0" width="760" height="380" fill="#f2f6fa"/>`;
    s += `<rect x="0" y="16" width="760" height="5" fill="#d9c78a"/>`;
    for (let x = 0; x < 760; x += 76) s += `<rect x="${x + 2}" y="21" width="72" height="30" rx="4" fill="#f4f1df" stroke="#8a8a62"/>`;
    for (let x = 150; x + 50 <= 760; x += 50) s += `<rect x="${x + 2}" y="55" width="44" height="100" rx="14" fill="#cfe7b4" stroke="#5f8a3a"/>`; // every palisade cell inside the leaf
    const R = rnd(11); const sp = [[200, 200], [270, 230], [345, 195], [420, 235], [500, 200], [580, 240], [660, 205], [720, 260], [230, 290], [310, 300], [395, 300], [610, 300], [690, 320], [160, 250]];
    sp.forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y}" rx="${30 + R() * 6}" ry="${22 + R() * 5}" fill="#d9ecc4" stroke="#5f8a3a" stroke-width="1.4"/>`; });
    // the cell beside the air space above the stoma, its wet wall highlighted
    s += `<ellipse cx="455" cy="290" rx="34" ry="24" fill="#d9ecc4" stroke="${C.water}" stroke-width="3.5"/>`;
    s += `<rect x="0" y="340" width="760" height="30" fill="#f4f1df"/>`; for (let x = 0; x < 760; x += 76) if (Math.abs(x + 38 - 520) > 60) s += `<rect x="${x + 2}" y="340" width="72" height="30" rx="4" fill="#f4f1df" stroke="#8a8a62"/>`;
    s += `<rect x="0" y="370" width="760" height="4" fill="#d9c78a"/>`;
    const gap = open ? 12 : 1; s += `<ellipse cx="${520 - 20 - gap}" cy="356" rx="20" ry="15" fill="#b8dc8e" stroke="#4d7a2c" stroke-width="1.6"/><ellipse cx="${520 + 20 + gap}" cy="356" rx="20" ry="15" fill="#b8dc8e" stroke="#4d7a2c" stroke-width="1.6"/>`;
    // vein with xylem at the left
    s += `<circle cx="70" cy="245" r="52" fill="#eef3e4" stroke="#6b8f4e" stroke-width="1.5"/>`; [[55, 232, 11], [80, 236, 9], [64, 258, 8], [86, 260, 7], [46, 254, 6]].forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${C.xylS}" stroke-width="3"/>`; });
    // outside air and boundary layer
    s += `<line x1="380" y1="418" x2="760" y2="418" stroke="#7d8a87" stroke-width="1.6" stroke-dasharray="7 6"/>`;
    // water vapour molecules: dense in the air space, fewer outside (concentration gradient)
    const vap = [[470, 318], [490, 326], [508, 314], [530, 322], [496, 338], [522, 340], [512, 352], [516, 378], [524, 394], [508, 402], [534, 410], [560, 432], [600, 440], [660, 446]];
    vap.forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="4" fill="${C.water}" opacity=".75"/>`; });
    // numbered steps
    const step = (k, x, y) => `<circle cx="${x}" cy="${y}" r="15" fill="#fff" stroke="${C.ink}" stroke-width="2"/>` + T(x, y + 7, k, { size: 19, anchor: "middle", weight: 700 });
    s += `<path d="M120,245 L196,232" stroke="${C.water}" stroke-width="5" fill="none" marker-end="url(#${id}w)"/>`;
    s += `<path d="M196,262 C260,280 330,260 418,282" stroke="${C.water}" stroke-width="3.5" fill="none" stroke-dasharray="6 5" marker-end="url(#${id}w)"/>`;
    s += `<path d="M470,306 q8,-6 14,0 t14,0" stroke="${C.water}" stroke-width="3.5" fill="none" marker-end="url(#${id}w)"/>`;
    if (open) s += `<path d="M520,330 L520,402" stroke="${C.water}" stroke-width="5" fill="none" marker-end="url(#${id}w)"/><path d="M548,430 L700,452" stroke="${C.water}" stroke-width="3.5" fill="none" marker-end="url(#${id}w)"/>`;
    else s += T(520, 405, "stoma closed: very little vapour escapes", { size: 17, anchor: "middle", fill: "#7a1c20" });
    if (steps) s += step("1", 150, 214) + step("2", 330, 246) + step("3", 474, 284) + (open ? step("4", 548, 392) + step("5", 640, 428) : "");
    if (labels) {
      const lab = (x, y, ty, txt) => `<line x1="${x}" y1="${y}" x2="772" y2="${ty - 6}" stroke="${C.line}" stroke-width="1.3"/>` + T(778, ty, txt, { size: 18 });
      s += lab(740, 36, 40, "Upper epidermis");
      s += lab(735, 110, 98, "Palisade mesophyll");
      s += lab(722, 262, 168, "Spongy mesophyll");
      s += lab(640, 262, 230, "Air space");
      s += lab(560, 352, 300, "Guard cell");
      s += lab(520, 360, 340, open ? "Stoma (open)" : "Stoma (closed)");
      s += lab(750, 418, 418, "Still air layer");
      s += T(778, 440, "(boundary layer)", { size: 16, fill: "#55625e" });
      s += T(70, 170, "Xylem in", { size: 17, anchor: "middle" }) + T(70, 189, "a vein", { size: 17, anchor: "middle" });
    }
    return s + `</svg>`;
  }

  // ============================================ Xylem: cohesion, adhesion, tension ============================================
  function xylemColumn(o = {}) {
    const id = uid(); const emb = !!o.embolism; const labels = o.labels !== false;
    let s = `<svg viewBox="0 0 920 480" width="${o.width || 920}" role="img" aria-label="${esc(o.title || "Water columns in two xylem vessels: cohesion, adhesion and tension")}" style="max-width:100%;height:auto" data-id="${id}"><title>${esc(o.title || "Cohesion, adhesion and tension in xylem")}</title><defs>${arrowDef(id + "w", C.water)}${arrowDef(id + "k", C.ink)}</defs><rect width="920" height="480" fill="#fff"/>`;
    const V = [[110, 230], [262, 382]]; const top = 30, bot = 450;
    V.forEach(([a, b]) => { s += `<rect x="${a - 12}" y="${top}" width="12" height="${bot - top}" fill="${C.xylS}"/><rect x="${b}" y="${top}" width="12" height="${bot - top}" fill="${C.xylS}"/>`; });
    // pits in the shared walls (gaps in the lignified wall)
    [140, 330].forEach((y) => { s += `<rect x="228" y="${y - 12}" width="18" height="24" fill="${C.wall}"/><rect x="258" y="${y - 12}" width="18" height="24" fill="${C.wall}"/><rect x="240" y="${y - 12}" width="22" height="24" fill="${C.wall}" opacity=".6"/>`; });
    s += `<rect x="242" y="${top}" width="16" height="${bot - top}" fill="#f6efe0"/>`; [140, 330].forEach((y) => { s += `<rect x="242" y="${y - 12}" width="16" height="24" fill="${C.wall}"/>`; });
    const bubble = emb ? [200, 290] : null;
    const mol = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#cfe2f6" stroke="${C.water}" stroke-width="2"/>`;
    V.forEach(([a, b], vi) => { const xs = [a + 22, (a + b) / 2, b - 22]; const pts = [];
      for (let y = top + 18, k = 0; y < bot - 6; y += 26, k++) xs.forEach((x, j) => { const yy = y + (j === 1 ? 13 : 0); if (yy > bot - 10) return; if (vi === 0 && bubble && yy > bubble[0] - 8 && yy < bubble[1] + 8) return; pts.push([x, yy]); });
      // hydrogen bonds (cohesion) between neighbouring molecules
      pts.forEach(([x, y], i) => pts.slice(i + 1).forEach(([x2, y2]) => { const d = Math.hypot(x - x2, y - y2); if (d < 36) s += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#4d6fa0" stroke-width="1.5" stroke-dasharray="3 3"/>`; }));
      // adhesion to the walls
      pts.forEach(([x, y]) => { if (x === a + 22) s += `<line x1="${a}" y1="${y}" x2="${x - 9}" y2="${y}" stroke="#a35a18" stroke-width="2" stroke-dasharray="2 2"/>`; if (x === b - 22) s += `<line x1="${x + 9}" y1="${y}" x2="${b}" y2="${y}" stroke="#a35a18" stroke-width="2" stroke-dasharray="2 2"/>`; });
      pts.forEach(([x, y]) => { s += mol(x, y); }); });
    if (bubble) { s += `<rect x="${V[0][0] + 4}" y="${bubble[0]}" width="${V[0][1] - V[0][0] - 8}" height="${bubble[1] - bubble[0]}" rx="40" fill="#fff" stroke="#8b9693" stroke-width="2.5"/>` + T((V[0][0] + V[0][1]) / 2, (bubble[0] + bubble[1]) / 2 + 7, "air", { size: 22, anchor: "middle", fill: "#55625e" });
      s += `<path d="M170,440 L170,350 Q170,330 250,330 L300,330 Q322,330 322,300 L322,170 Q322,140 250,140 L190,140 Q170,140 170,110 L170,40" stroke="${C.water}" stroke-width="5" fill="none" marker-end="url(#${id}w)" opacity=".85"/>`; }
    else V.forEach(([a, b]) => { s += `<line x1="${(a + b) / 2}" y1="${bot - 8}" x2="${(a + b) / 2}" y2="${top + 8}" stroke="${C.water}" stroke-width="5" marker-end="url(#${id}w)" opacity=".5"/>`; });
    s += `<line x1="450" y1="120" x2="450" y2="40" stroke="${C.ink}" stroke-width="3" marker-end="url(#${id}k)"/>` + T(462, 70, "pulled up", { size: 18 }) + T(462, 92, "from the leaf", { size: 18 });
    if (labels) { const L = (x, y, ty, txt, t2) => `<line x1="${x}" y1="${y}" x2="592" y2="${ty - 6}" stroke="${C.line}" stroke-width="1.3"/>` + T(598, ty, txt, { size: 19 }) + (t2 ? T(598, ty + 22, t2, { size: 16, fill: "#55625e" }) : "");
      s += L(388, 200, 176, "Lignified wall of xylem vessel", "stops the vessel collapsing under tension");
      s += L(276, 330, 250, "Pit", "water can pass sideways between vessels");
      s += L(312, 380, 312, "Cohesion: hydrogen bonds", "between water molecules (dashed)");
      s += L(240, 420, 376, "Adhesion: water molecules", "attracted to the walls (brown dashes)");
      s += T(598, 440, emb ? "An air bubble breaks one column; water" : "Each column is under tension: a pull", { size: 16, fill: "#55625e" }) + T(598, 460, emb ? "goes round it through pits." : "transmitted down from the leaves.", { size: 16, fill: "#55625e" }); }
    return s + `</svg>`;
  }

  // ============================================ Root pressure ============================================
  function rootPressure(o = {}) {
    const id = uid(); let s = `<svg viewBox="0 0 920 430" width="${o.width || 920}" role="img" aria-label="Root pressure: active transport of mineral ions into the xylem lowers its water potential, water follows by osmosis and pushes the sap upwards" style="max-width:100%;height:auto" data-id="${id}"><title>Root pressure</title><defs>${arrowDef(id + "w", C.water)}${arrowDef(id + "i", C.ion)}</defs><rect width="920" height="430" fill="#fff"/>`;
    const cells = [[20, 150, "Cortex", C.cyto], [160, 270, "Endodermis", "#f6e2c2"], [280, 380, "Pericycle", "#efe8f6"]];
    s += `<rect x="14" y="70" width="380" height="250" fill="${C.wall}"/>`;
    cells.forEach(([a, b, nm, f]) => { s += `<rect x="${a + 6}" y="76" width="${b - a - 12}" height="238" rx="10" fill="${f}" stroke="#6b8f4e" stroke-width="1.4"/>` + T((a + b) / 2, 350, nm, { size: 19, anchor: "middle" }); });
    s += `<rect x="226" y="64" width="12" height="12" fill="${C.casp}"/><rect x="226" y="314" width="12" height="12" fill="${C.casp}"/>`;
    s += `<rect x="394" y="20" width="14" height="330" fill="${C.xylS}"/><rect x="408" y="20" width="110" height="330" fill="#fff"/><rect x="518" y="20" width="14" height="330" fill="${C.xylS}"/>` + T(463, 376, "Xylem vessel", { size: 19, anchor: "middle" });
    [150, 240].forEach((y) => { s += `<rect x="392" y="${y - 8}" width="18" height="16" fill="${C.wall}"/>`; });
    // ions actively transported into the xylem
    const ion = (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="${C.ion}"/>`;
    s += `<path d="M330,150 L438,150" stroke="${C.ion}" stroke-width="4" marker-end="url(#${id}i)"/>` + `<rect x="352" y="132" width="26" height="36" rx="8" fill="#fbe3f0" stroke="${C.ion}" stroke-width="2"/>` + T(365, 124, "ATP", { size: 16, anchor: "middle", weight: 700, fill: C.ion });
    [[440, 110], [470, 140], [452, 180], [490, 200], [430, 230], [478, 260], [500, 120], [445, 290]].forEach(([x, y]) => { s += ion(x, y); });
    s += `<path d="M60,240 L436,240" stroke="${C.water}" stroke-width="5" marker-end="url(#${id}w)"/>` + T(40, 226, "water follows by osmosis", { size: 17, fill: C.water });
    s += `<path d="M463,320 L463,40" stroke="${C.water}" stroke-width="6" marker-end="url(#${id}w)" opacity=".7"/>`;
    s += T(565, 60, "1  Endodermis and pericycle cells", { size: 18 }) + T(587, 82, "actively transport mineral ions", { size: 18 }) + T(587, 104, "into the xylem (uses ATP).", { size: 18 });
    s += T(565, 144, "2  Xylem sap now has a lower", { size: 18 }) + T(587, 166, "water potential.", { size: 18 });
    s += T(565, 206, "3  Water enters the xylem by", { size: 18 }) + T(587, 228, "osmosis from the cells around it.", { size: 18 });
    s += T(565, 268, "4  The extra water raises the", { size: 18 }) + T(587, 290, "pressure in the xylem and pushes", { size: 18 }) + T(587, 312, "the sap a short way up the stem.", { size: 18 });
    s += T(565, 352, "The Casparian strip stops the ions", { size: 16, fill: "#55625e" }) + T(565, 372, "leaking back out through the walls.", { size: 16, fill: "#55625e" });
    s += ion(30, 400) + T(44, 406, "mineral ion", { size: 16 }) + `<line x1="170" y1="400" x2="200" y2="400" stroke="${C.water}" stroke-width="5" marker-end="url(#${id}w)"/>` + T(210, 406, "water", { size: 16 }) + `<rect x="280" y="394" width="12" height="12" fill="${C.casp}"/>` + T(298, 406, "Casparian strip", { size: 16 });
    return s + `</svg>`;
  }

  // ============================================ Whole plant water potential chain ============================================
  // kPa values; air values are computed from RH. Order is the path water takes.
  const STATIONS = ["Soil water", "Root hair cell", "Root cortex", "Root xylem", "Stem xylem", "Leaf xylem", "Mesophyll cell walls", "Air spaces in the leaf", "Air outside the leaf"];
  const RT_V = (tC) => (8.314 * (tC + 273.15)) / 1.805e-5 / 1000; // kPa
  const psiAir = (rh, tC) => (rh >= 1 ? 0 : RT_V(tC) * Math.log(rh)); // kPa
  const SC = {
    sunny: { name: "Sunny, dry afternoon", rh: 0.5, t: 25, stomata: "open", flow: 1, psi: [-30, -250, -350, -550, -750, -950, -1100, null, null], airInRh: 0.99, note: "Stomata are open and the air is dry, so the water potential gradient from leaf to air is huge. Water vapour diffuses out fast; the xylem is under strong tension (negative pressure) and water is pulled up from the roots. Root pressure is negligible: the xylem sap is under tension, not pushed." },
    humid: { name: "Humid, still morning", rh: 0.92, t: 20, stomata: "open", flow: 0.35, psi: [-20, -120, -160, -260, -340, -420, -500, null, null], airInRh: 0.996, note: "Stomata are open but the air is nearly saturated, so the gradient for diffusion out of the leaf is much smaller and transpiration is slower. There is less tension in the xylem." },
    night: { name: "Night: stomata closed, wet soil", rh: 0.95, t: 18, stomata: "closed", flow: 0.06, psi: [-10, -40, -50, -60, -70, -80, -90, null, null], airInRh: 0.9992, rootP: true, note: "Stomata are closed, so almost no water vapour escapes and the xylem is no longer under tension. Mineral ions actively pumped into the root xylem lower its water potential; water follows by osmosis and root pressure pushes sap slowly upwards (the xylem pressure is now positive). In some plants this forces droplets out of leaf margins (guttation, supporting)." },
    drysoil: { name: "Dry soil, sunny day", rh: 0.5, t: 25, stomata: "partly closed", flow: 0.3, psi: [-1000, -1150, -1250, -1400, -1600, -1800, -1950, null, null], airInRh: 0.985, note: "Water potential is low all along the pathway because the soil holds its remaining water tightly. Every value is still lower than the one before, so water still moves, but stomata partly close (A-level link: abscisic acid, 3.4.5.3) and transpiration slows. Below about −1500 kPa in the soil many plants wilt." },
  };
  Object.values(SC).forEach((sc) => { sc.psi[7] = Math.round(psiAir(sc.airInRh, sc.t)); sc.psi[8] = Math.round(psiAir(sc.rh, sc.t) / 10) * 10; });
  // check: every chain falls monotonically (arrows can then always be drawn high → low)
  const monotonic = (p) => p.every((v, i) => i === 0 || v < p[i - 1]);
  // numbered points along the pathway, and where each value is printed beside its point ([x, y, anchor])
  const POS = [[50, 520], [140, 520], [228, 520], [300, 520], [300, 330], [372, 158], [448, 142], [522, 160], [640, 250]];
  const VAL = [[50, 558, "middle"], [140, 486, "middle"], [228, 558, "middle"], [322, 526, "start"], [276, 336, "end"], [366, 112, "end"], [470, 106, "start"], [588, 166, "start"], [640, 292, "middle"]];
  const fmtK = (v) => `${v < 0 ? "−" : ""}${Math.abs(v) >= 10000 ? Math.abs(v).toLocaleString("en-GB").replace(/,/g, " ") : Math.abs(v)} kPa`;
  // o.scenario, o.selected (index), o.bubble (air bubble in one stem vessel)
  function wholePlant(o = {}) {
    const id = uid(); const sc = SC[o.scenario || "sunny"]; const sel = o.selected == null ? -1 : o.selected; const night = o.scenario === "night"; const W = 760, H = 600, GY = 450, SX = 300;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${o.width || W}" role="img" aria-label="${esc("Plant with nine numbered points along the water pathway, each with its water potential: " + sc.name)}" style="max-width:100%;height:auto" data-id="${id}"><title>${esc("Water pathway: " + sc.name)}</title><defs>${arrowDef(id + "w", C.water)}</defs>
      <rect width="${W}" height="${H}" fill="${night ? "#e6e9f2" : "#f3f8fc"}"/><rect x="0" y="${GY}" width="${W}" height="${H - GY}" fill="${o.scenario === "drysoil" ? "#e8d7b6" : "#d8c3a0"}"/>`;
    s += night ? `<circle cx="44" cy="44" r="24" fill="#cfd6e6"/><circle cx="56" cy="36" r="22" fill="#e6e9f2"/>` : `<circle cx="44" cy="44" r="24" fill="#f7c948"/>`;
    s += T(82, 40, sc.name, { size: 20, weight: 700 }) + T(82, 64, `air ${Math.round(sc.rh * 100)} % humidity, ${sc.t} °C; stomata ${sc.stomata}`, { size: 17, fill: "#55625e" });
    // roots: a main root, a long side root running left (water enters near its tip, where the root hairs are) and others
    const rc = "#9b7b4f";
    s += `<path d="M${SX} ${GY} L ${SX} 590 M${SX} 520 L 120 520 M${SX} 494 L 390 466 M${SX} 560 L 390 590 M${SX} 500 L 236 466" stroke="${rc}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    for (let k = 0; k < 9; k++) { const x = 122 + k * 8; s += `<line x1="${x}" y1="514" x2="${x - 4}" y2="500" stroke="${rc}" stroke-width="1.6"/><line x1="${x}" y1="526" x2="${x - 4}" y2="540" stroke="${rc}" stroke-width="1.6"/>`; }
    // stem with three xylem vessels; leaves
    s += `<rect x="${SX - 13}" y="150" width="26" height="${GY - 150 + 4}" rx="6" fill="#6f9a4a"/>`;
    const vessel = (x, cut) => cut ? `<line x1="${x}" y1="156" x2="${x}" y2="414" stroke="#cfe3f5" stroke-width="2.6"/><line x1="${x}" y1="436" x2="${x}" y2="${GY}" stroke="#cfe3f5" stroke-width="2.6"/><circle cx="${x}" cy="425" r="8" fill="#ffffff" stroke="#1d2b28" stroke-width="2"/>` : `<line x1="${x}" y1="156" x2="${x}" y2="${GY}" stroke="#cfe3f5" stroke-width="2.6"/>`;
    s += vessel(SX - 7, !!o.bubble) + vessel(SX, false) + vessel(SX + 7, false);
    if (o.bubble) s += T(SX - 22, 432, "air bubble in one vessel", { size: 17, fill: "#1d2b28", weight: 700, anchor: "end" });
    const leaf = (x, y, len, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C ${len * 0.3} ${-len * 0.28} ${len * 0.75} ${-len * 0.25} ${len} 0 C ${len * 0.75} ${len * 0.25} ${len * 0.3} ${len * 0.28} 0 0 Z" fill="#9fcb72" stroke="#4d7a2c" stroke-width="2"/><path d="M0 0 L ${len * 0.95} 0" stroke="#4d7a2c" stroke-width="1.6"/></g>`;
    s += leaf(SX - 10, 400, 110, -158) + leaf(SX + 10, 370, 100, -18) + leaf(SX - 10, 290, 120, -150) + leaf(SX + 10, 250, 104, -26) + leaf(SX - 10, 190, 96, -140);
    // the leaf whose inside is followed (points 6 to 8)
    s += `<g transform="translate(${SX + 8} 160)"><path d="M0 0 C 70 -64 190 -66 270 -4 C 190 50 70 52 0 0 Z" fill="#b5d98e" stroke="#4d7a2c" stroke-width="2.4"/><path d="M0 0 L 262 -4" stroke="#4d7a2c" stroke-width="2"/></g>`;
    // arrows down the gradient only
    const p = sc.psi; for (let i = 0; i < 8; i++) { if (!(p[i + 1] < p[i])) continue; const [x1, y1] = POS[i], [x2, y2] = POS[i + 1]; const L = Math.hypot(x2 - x1, y2 - y1), k = 20 / L; const ax = x1 + (x2 - x1) * k, ay = y1 + (y2 - y1) * k, bx = x2 - (x2 - x1) * k * 1.25, by = y2 - (y2 - y1) * k * 1.25;
      const wdt = 1.8 + 4.5 * sc.flow; const closed = i === 7 && sc.stomata === "closed"; s += `<line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(bx)}" y2="${r1(by)}" stroke="${C.water}" stroke-width="${r1(closed ? 1.6 : wdt)}"${closed ? ' stroke-dasharray="3 5"' : ""} marker-end="url(#${id}w)"/>`; }
    // points and their values
    POS.forEach(([x, y], i) => { const on = i === sel; const [vx, vy, va] = VAL[i];
      s += `<g data-part="st${i}" tabindex="0" role="button" aria-label="${esc(`${i + 1}: ${STATIONS[i]}, ${fmtK(p[i])}`)}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="${on ? 17 : 15}" fill="${on ? "#1d2b28" : "#fff"}" stroke="#1d2b28" stroke-width="2.2"/>${T(x, y + 6, i + 1, { size: 18, anchor: "middle", weight: 700, fill: on ? "#fff" : "#1d2b28" })}</g>`;
      s += `<text x="${vx}" y="${vy}" font-size="18" font-weight="700" text-anchor="${va}" fill="${C.water}" stroke="#ffffff" stroke-width="5" stroke-linejoin="round" paint-order="stroke">${esc(fmtK(p[i]))}</text>`; });
    if (night) s += `<circle cx="${SX + 280}" cy="152" r="5" fill="${C.water}"/>` + T(SX + 284, 128, "guttation", { size: 17, anchor: "middle" });
    return s + `</svg>`;
  }

  // ============================================ Transpiration simulator stoma view ============================================
  // gsFrac 0–1 (stomatal opening), gb in mol m⁻² s⁻¹, rh 0–1, light 0–1500
  function stomaView({ gsFrac = 0.5, gb = 0.3, rh = 0.5, light = 600, wind = 0.5, temp = 25 } = {}) {
    const id = uid(); const W = 440, MX = W / 2; const bl = Math.max(14, Math.min(120, 30 / gb)); const gap = 2 + 20 * gsFrac; const outN = Math.round(4 + rh * 26);
    let s = `<svg viewBox="0 0 ${W} 300" width="${W}" role="img" aria-label="${esc(`Leaf surface with one stoma ${gsFrac < 0.1 ? "almost closed" : gsFrac < 0.5 ? "partly open" : "wide open"}; still air layer ${bl > 60 ? "thick" : bl > 30 ? "medium" : "thin"}`)}" style="max-width:100%;height:auto" data-id="${id}"><title>Stoma and boundary layer</title><defs>${arrowDef(id + "k", "#55625e")}</defs><rect width="${W}" height="300" fill="#f3f8fc"/>`;
    // leaf interior (air space, saturated)
    s += `<rect x="0" y="0" width="${W}" height="110" fill="#e6f1da"/>` + T(12, 28, "Air space inside the leaf: almost saturated", { size: 16, fill: "#3d4a47" });
    const R = rnd(3); for (let k = 0; k < 28; k++) s += `<circle cx="${r1(14 + R() * (W - 28))}" cy="${r1(44 + R() * 56)}" r="3.4" fill="${C.water}" opacity=".7"/>`;
    s += `<rect x="0" y="110" width="${W}" height="26" fill="#f4f1df" stroke="#8a8a62"/><rect x="0" y="136" width="${W}" height="4" fill="#d9c78a"/>`;
    s += `<rect x="${MX - gap / 2 - 2}" y="108" width="${gap + 4}" height="34" fill="#e6f1da"/><ellipse cx="${MX - gap / 2 - 26}" cy="123" rx="26" ry="16" fill="#b8dc8e" stroke="#4d7a2c" stroke-width="1.6"/><ellipse cx="${MX + gap / 2 + 26}" cy="123" rx="26" ry="16" fill="#b8dc8e" stroke="#4d7a2c" stroke-width="1.6"/>`;
    // boundary layer
    s += `<rect x="0" y="140" width="${W}" height="${r1(bl)}" fill="#dfe9f3"/><line x1="0" y1="${r1(140 + bl)}" x2="${W}" y2="${r1(140 + bl)}" stroke="#7d8a87" stroke-dasharray="7 6" stroke-width="1.5"/>`;
    s += T(W - 10, r1(140 + bl - 6), "still air (boundary layer)", { size: 15, anchor: "end", fill: "#3d4a47" });
    // vapour escaping from the pore into the boundary layer (density falls away from the pore)
    const esc_n = Math.round(gsFrac * 14 * (1 - rh)); for (let k = 0; k < esc_n; k++) { const a = R() * Math.PI, d = 8 + R() * (bl * 0.9); s += `<circle cx="${r1(MX + Math.cos(a) * d * 1.6)}" cy="${r1(144 + Math.sin(a) * d)}" r="3.4" fill="${C.water}" opacity=".7"/>`; }
    for (let k = 0; k < Math.round(outN * 0.7); k++) s += `<circle cx="${r1(10 + R() * (W - 20))}" cy="${r1(150 + bl + 8 + R() * Math.max(10, 140 - bl - 16))}" r="3" fill="${C.water}" opacity=".45"/>`;
    // wind arrows
    const nW = wind < 0.15 ? 0 : wind < 1 ? 1 : wind < 2.5 ? 2 : 3; for (let k = 0; k < nW; k++) s += `<line x1="30" y1="${262 - k * 14}" x2="${110 + wind * 30}" y2="${270 - k * 14}" stroke="#55625e" stroke-width="2.5" marker-end="url(#${id}k)"/>`;
    s += T(12, 292, wind < 0.15 ? "still air" : `air movement ${wind.toFixed(1)} m s⁻¹`, { size: 15, fill: "#3d4a47" });
    s += T(W - 10, 292, `outside air: ${Math.round(rh * 100)} % humidity`, { size: 15, anchor: "end", fill: "#3d4a47" });
    return s + `</svg>`;
  }

  // ============================================ Small line chart (model curves) ============================================
  // series: [{name, color, dash, pts:[[x,y]...]}]; returns svg string. One y axis only.
  const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"];
  function chart({ series, xLabel, yLabel, xMax, yMax, width = 640, height = 380, xTicks, yTicks, title, marker = null, fs = 1 }) {
    const id = uid(); const L = Math.round(78 * fs), Rm = 24, Tm = 34, Bm = Math.round(64 * fs); const W = width - L - Rm, H = height - Tm - Bm;
    const X = (x) => r1(L + (x / xMax) * W), Y = (y) => r1(Tm + H - (y / yMax) * H);
    let s = `<svg viewBox="0 0 ${width} ${height}" width="${width}" role="img" aria-label="${esc(title || yLabel + " against " + xLabel)}" style="max-width:100%;height:auto" data-id="${id}"><title>${esc(title || yLabel + " against " + xLabel)}</title><rect width="${width}" height="${height}" fill="#fff"/>`;
    (yTicks || []).forEach((v) => { s += `<line x1="${L}" y1="${Y(v)}" x2="${L + W}" y2="${Y(v)}" stroke="#e3e7e6" stroke-width="1"/>` + T(L - 8, Y(v) + 6, v, { size: Math.round(17 * fs), anchor: "end", fill: "#3d4a47" }); });
    (xTicks || []).forEach((v) => { s += `<line x1="${X(v)}" y1="${Tm + H}" x2="${X(v)}" y2="${Tm + H + 6}" stroke="#3d4a47"/>` + T(X(v), Tm + H + Math.round(26 * fs), v, { size: Math.round(17 * fs), anchor: "middle", fill: "#3d4a47" }); });
    s += `<line x1="${L}" y1="${Tm}" x2="${L}" y2="${Tm + H}" stroke="#3d4a47" stroke-width="1.5"/><line x1="${L}" y1="${Tm + H}" x2="${L + W}" y2="${Tm + H}" stroke="#3d4a47" stroke-width="1.5"/>`;
    s += T(L + W / 2, height - 12, xLabel, { size: Math.round(18 * fs), anchor: "middle" }) + `<text x="${Math.round(20 * fs)}" y="${Tm + H / 2}" font-size="${Math.round(18 * fs)}" fill="#1d2b28" text-anchor="middle" transform="rotate(-90 ${Math.round(20 * fs)} ${Tm + H / 2})">${esc(yLabel)}</text>`;
    series.forEach((se, i) => { const col = se.color || SERIES[i % 3]; s += `<polyline points="${se.pts.map(([x, y]) => X(x) + "," + Y(Math.min(y, yMax))).join(" ")}" fill="none" stroke="${col}" stroke-width="2.5"${se.dash ? ` stroke-dasharray="${se.dash}"` : ""} stroke-linejoin="round"/>`;
      if (se.label !== false) { const [lx, ly] = se.pts[se.pts.length - 1]; s += T(Math.min(X(lx) - 4, L + W - 4), Y(Math.min(ly, yMax)) - 10, se.name, { size: Math.round(16 * fs), anchor: "end", fill: "#1d2b28" }); } });
    if (marker) s += `<circle cx="${X(marker[0])}" cy="${Y(Math.min(marker[1], yMax))}" r="7" fill="#1d2b28" stroke="#fff" stroke-width="2"/>`;
    return s + `</svg>`;
  }
  // four-panel figure of the plant model: E against each factor, others at the base conditions
  const BASE = { light: 600, temp: 25, rh: 0.5, wind: 0.5 };
  // Compact 2 × 2 grid (about 420 px tall at 760 px wide). The wind panel is sampled every 0.2 m s⁻¹, so the model's
  // still-air floor (0.05 m s⁻¹) does not show as a kink at the start of the curve.
  function factorPanels() {
    const M = B.plantModel; const E = (c) => M.leaf(Object.assign({}, BASE, c)).Emmol; const rng = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
    const panels = [
      { xl: "Light intensity / arbitrary units", xm: 150, xt: [0, 50, 100, 150], s: [{ name: "", pts: rng(0, 150, 60).map((x) => [x, E({ light: x * 10 })]), label: false }] },
      { xl: "Temperature / °C", xm: 40, xt: [0, 10, 20, 30, 40], s: [{ name: "", pts: rng(5, 40, 70).map((x) => [x, E({ temp: x })]), label: false }] },
      { xl: "Relative humidity / %", xm: 100, xt: [0, 25, 50, 75, 100], s: [{ name: "", pts: rng(0, 100, 100).map((x) => [x, E({ rh: x / 100 })]), label: false }] },
      { xl: "Air movement / m s⁻¹", xm: 4, xt: [0, 1, 2, 3, 4], s: [{ name: "in light", pts: rng(0, 4, 20).map((x) => [x, E({ wind: x })]) }, { name: "in the dark", dash: "8 5", pts: rng(0, 4, 20).map((x) => [x, E({ wind: x, light: 0 })]) }] },
    ];
    const ymax = 3; const yt = [0, 1, 2, 3]; const PW = 545, PH = 300;
    return `<svg viewBox="0 0 1100 ${2 * PH + 10}" width="760" role="img" aria-label="Four graphs from the illustrative plant model: transpiration rate against light intensity, temperature, relative humidity and air movement" style="max-width:100%;height:auto"><title>Effects of four factors on transpiration (illustrative model)</title><rect width="1100" height="${2 * PH + 10}" fill="#fff"/>` +
      panels.map((p, i) => { const inner = chart({ series: p.s, xLabel: p.xl, yLabel: "Rate / mmol m⁻² s⁻¹", xMax: p.xm, yMax: ymax, xTicks: p.xt, yTicks: yt, width: PW, height: PH, fs: 1.25 }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
        return `<g transform="translate(${(i % 2) * 550 + 5},${Math.floor(i / 2) * PH + 5})">${inner}${T(118, 30, "ABCD"[i], { size: 26, weight: 700 })}</g>`; }).join("") + `</svg>`;
  }

  B.xylemArt = { rootTS, pathwayStrip, xylemStructure, leafWater, xylemColumn, rootPressure, wholePlant, stomaView, chart, factorPanels, COLS, ROUTES, ROOT, PARTS, LABELS, colours: C, SERIES };
  B.xylemModel = { STATIONS, SC, psiAir, RT_V, monotonic, BASE, POS };
})(window.BIO);
