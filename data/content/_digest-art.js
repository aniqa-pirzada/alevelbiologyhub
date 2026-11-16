// Shared artwork and the absorption model for 3.2.2 Digestion and absorption (Phase 4 Batch 1, owned by the 3.2.2
// author). Loaded before the 3.2.2 content files and js/views/interactives-digest.js. Every drawing is an original,
// schematic SVG. Orientation conventions used throughout (checked in the author report):
//   * digestive system: anterior (front) view, so the person's right side is on the viewer's LEFT (liver and caecum
//     on the left of the page, stomach and descending colon on the right);
//   * absorption drawings: LUMEN (microvilli, apical membrane) at the TOP, BLOOD / basal side at the BOTTOM.
// Nothing here is measured data. The co-transport model (B.digestModel) is illustrative and documented below.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5f6f7f", TEAL = "#1f8a8a", SAGE = "#5d8a6f", NAVY = "#1e3a5f", AMBER = "#b07a1c", ROSE = "#b4504f", PLUM = "#7a4f8c";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ""}>${s}</text>`;
  let cnt = 0, U = ""; const uid = () => (U = "-dg" + (++cnt));
  const mk = (id, col) => `<marker id="${id}${U}" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="8" refY="5.5" orient="auto"><path d="M0 0 L11 5.5 L0 11z" fill="${col}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 2}" fill="none"${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}${o.d ? ` stroke-dasharray="${o.d}"` : ""}/>`;
  const P = (d, o = {}) => `<path d="${d}" stroke="${o.c || INK}" stroke-width="${o.w || 2}" fill="${o.f || "none"}"${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.lc ? ` stroke-linecap="${o.lc}"` : ""}/>`;
  // min-width keeps label text legible on phones (QA R1): below that width the figure scrolls sideways inside its own
  // .fig-view container (overflow: auto) instead of shrinking; min-width wins over max-width when they conflict.
  const minW = (w) => (w >= 700 ? 680 : Math.round(w * 0.8));
  const svgOpen = (w, h, aria, extra = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${aria}" style="max-width:100%;min-width:${minW(w)}px;height:auto"${extra}>`;
  // small molecule glyphs
  const hex = (x, y, r = 9, fill = "#fbe9c8", stroke = AMBER) => { let p = ""; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; p += `${k ? "L" : "M"}${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)} `; } return `<path d="${p}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`; };
  const pent = (x, y, r = 9, fill = "#f6dede", stroke = ROSE) => { let p = ""; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; p += `${k ? "L" : "M"}${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)} `; } return `<path d="${p}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`; };
  const bead = (x, y, fill = "#e4ebf5", r = 9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${NAVY}" stroke-width="1.5"/>`;
  // BIG (set only while a drawing is made with big: true, for an interactive that scales it down): larger ion glyphs
  let BIG = false;
  const ion = (x, y, lab, col) => BIG ? `<circle cx="${x}" cy="${y}" r="14" fill="#fff" stroke="${col}" stroke-width="2"/>${T(x, y + 4.8, lab, { s: 13.5, w: 700, c: col })}` : `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${col}" stroke-width="2"/>${T(x, y + 3.5, lab, { s: 8.5, w: 700, c: col })}`;
  const na = (x, y) => ion(x, y, "Na⁺", NAVY), kk = (x, y) => ion(x, y, "K⁺", SAGE);
  const glc = (x, y) => hex(x, y, 8);
  const cut = (x, y, col = ROSE) => `<path d="M${x - 6} ${y - 14} L${x + 6} ${y + 14} M${x + 6} ${y - 14} L${x - 6} ${y + 14}" stroke="${col}" stroke-width="2.5"/>`;

  // =====================================================================================================
  // 1. Gross structure of the digestive system, drawn on a public-domain textbook diagram
  //    (assets/img/digestive-blank.jpg, 1100 x 2521 px; Mariana Ruiz (LadyofHats) and Jmarchn, Wikimedia Commons,
  //    public domain; no labels in the image). The trunk is a FRONT view (person's right on the viewer's left: liver
  //    and caecum on the left of the page); the head and neck are a section seen from the side, facing the viewer's
  //    left. Every label, leader, number and hotspot below is an SVG overlay in the image's own pixel coordinates, so
  //    it stays aligned at every width and zoom. Each leader dot was placed by eye on the structure and checked on
  //    zoomed crops of the image (author report ADIG).
  //    mode: "labels" | "numbered" | "none". o.highlight: a part key; o.interactive: hotspots focusable with hover
  //    styling; o.titles: false hides the <title> tooltips (the 'find it' challenge).
  //    Assessed structures (3.2.2.1): oesophagus, stomach, duodenum, ileum, colon, rectum, salivary glands, pancreas.
  //    Context only (grey, marked "context"): liver, gall bladder, bile duct, pancreatic duct, jejunum, anus.
  // =====================================================================================================
  const ASSESSED = ["salivary", "oesophagus", "stomach", "duodenum", "pancreas", "ileum", "colon", "rectum"];
  const NUMBERS = { salivary: 1, oesophagus: 2, stomach: 3, duodenum: 4, pancreas: 5, ileum: 6, colon: 7, rectum: 8 };
  const DIG_IMG = { src: "assets/img/digestive-blank.jpg", w: 1100, h: 2521, vb: [-380, 0, 1980, 2290],
    credit: "Diagram: Mariana Ruiz (LadyofHats) and Jmarchn, Wikimedia Commons, public domain; labels added" };
  // Release review (2026-11-15, R5-01): the drawing is shortened so that it fits a laptop screen beside its controls.
  // The image rows CUT[0] to CUT[1] (the oesophagus in the chest, with nothing else drawn there) are left out and the
  // rest of the trunk moves up by CUT[1] - CUT[0]; a break mark is drawn across the oesophagus at the join. Shapes,
  // labels and leader dots stay in image coordinates below and are mapped by dy() when drawn.
  const CUT = [830, 1110], CUT_D = CUT[1] - CUT[0];
  const dy = (y) => (y <= CUT[0] ? y : y >= CUT[1] ? y - CUT_D : CUT[0]);
  const mapPath = (d) => d.replace(/([ML])\s*(-?[\d.]+)[ ,](-?[\d.]+)/g, (m, c, x, y) => `${c}${x} ${dy(+y)}`);
  // hotspot outlines (image pixels). Drawn in this order, so later shapes lie on top where they overlap (as in the
  // image: oesophagus and stomach over the liver edge, pancreas over the stomach, colon over the duodenum and coils).
  const DIG_SHAPES = [
    ["liver", ["M212 1450 L236 1378 L300 1330 L420 1306 L560 1298 L700 1296 L812 1318 L800 1345 L700 1372 L630 1430 L560 1482 L470 1540 L400 1570 L330 1622 L262 1690 L228 1712 L212 1640 L206 1540 Z"]],
    ["gallbladder", ["M236 1526 L262 1502 L340 1494 L430 1500 L478 1512 L476 1532 L430 1546 L330 1556 L258 1552 Z"]],
    ["salivary", ["M500 362 L548 356 L568 380 L572 430 L562 482 L544 512 L512 518 L492 488 L490 420 Z", "M422 546 L440 528 L478 526 L500 540 L496 566 L470 578 L436 574 Z", "M348 500 L380 494 L430 504 L432 526 L396 534 L352 526 Z"]],
    ["oesophagus", ["M548 610 L582 610 L578 800 L568 900 L572 1000 L582 1100 L590 1200 L598 1300 L606 1410 L600 1452 L566 1440 L552 1380 L540 1300 L526 1200 L518 1100 L518 1000 L528 900 L544 800 Z"]],
    ["stomach", ["M600 1458 L650 1410 L720 1376 L800 1362 L845 1390 L862 1470 L860 1560 L836 1622 L792 1664 L720 1700 L650 1714 L590 1706 L548 1652 L512 1594 L540 1586 L600 1604 L632 1592 L612 1500 Z"]],
    ["duodenum", ["M516 1582 L470 1560 L410 1564 L366 1594 L342 1640 L338 1700 L346 1752 L372 1770 L428 1770 L420 1712 L432 1664 L470 1646 L520 1640 L534 1608 Z"]],
    ["pancreas", ["M432 1666 L472 1648 L530 1644 L600 1612 L680 1582 L760 1560 L830 1530 L858 1556 L850 1602 L780 1640 L700 1676 L620 1700 L566 1722 L560 1770 L436 1770 L424 1730 Z"]],
    ["jejunum", ["M316 1900 L460 1904 L620 1880 L760 1854 L880 1852 L884 1990 L700 2010 L520 2030 L314 2040 Z"]],
    ["ileum", ["M314 2040 L520 2030 L700 2010 L884 1990 L880 2084 L770 2140 L700 2200 L650 2262 L560 2292 L452 2292 L404 2262 L330 2180 L312 2110 Z"]],
    ["colon", ["M204 1722 L250 1706 L310 1712 L322 1770 L312 1900 L306 2100 L340 2142 L408 2160 L412 2232 L380 2262 L300 2276 L246 2262 L216 2200 L182 2100 L174 1900 L178 1790 Z",
      "M310 1720 L450 1764 L650 1758 L760 1716 L840 1660 L872 1650 L870 1760 L850 1848 L700 1862 L500 1904 L350 1912 L314 1872 Z",
      "M846 1700 L900 1642 L944 1700 L948 1900 L936 2120 L902 2230 L842 2300 L760 2340 L680 2346 L610 2322 L592 2290 L600 2262 L650 2252 L700 2256 L760 2232 L820 2150 L850 2000 L842 1800 Z"]],
    ["rectum", ["M505 2282 L592 2282 L596 2370 L590 2450 L566 2490 L548 2498 L522 2470 L506 2400 Z"]],
    ["anus", ["M530 2494 L570 2494 L572 2520 L528 2520 Z"]],
  ];
  // labels: [part, lines, side ("L" | "R"), label y, [leader dots], context?]. Label columns sit outside the image
  // (left column ends at x = -30, right column starts at x = 1130); leaders are straight and ordered so none cross.
  const DIG_LABELS = [
    ["liver", ["liver"], "L", 1392, [[296, 1420]], true],
    ["gallbladder", ["gall bladder"], "L", 1496, [[300, 1525]], true],
    ["bileduct", ["bile duct"], "L", 1600, [[497, 1557]], true],
    ["duodenum", ["duodenum"], "L", 1700, [[368, 1642]]],
    ["colon", ["colon", "(large intestine)"], "L", 1962, [[240, 1956]]],
    ["ileum", ["ileum"], "L", 2228, [[480, 2200]]],
    ["salivary", ["salivary glands"], "R", 478, [[534, 440], [466, 548]]],
    ["oesophagus", ["oesophagus"], "R", 806, [[548, 800]]],
    ["stomach", ["stomach"], "R", 1452, [[742, 1462]]],
    ["pancreas", ["pancreas"], "R", 1592, [[720, 1600]]],
    ["pancduct", ["pancreatic duct"], "R", 1700, [[640, 1655]], true],
    ["jejunum", ["jejunum"], "R", 1896, [[752, 1900]], true],
    ["rectum", ["rectum"], "R", 2398, [[552, 2400]]],
    ["anus", ["anus"], "R", 2486, [[550, 2506]], true],
  ];
  const DG_HL = "#e09a00";
  function digestiveSystem(o = {}) {
    if (typeof o === "string") o = { mode: o };
    const mode = o.mode || "labels"; uid(); const u = U; const [vx, vy, vw, vh] = DIG_IMG.vb;
    const hl = new Set([].concat(o.highlight || []));
    const aria = "Front view of the human digestive system (the person's right side is on the viewer's left; the head is shown in section from the side; the oesophagus is drawn shorter than in life)" + (mode === "labels" ? ", labelled: salivary glands, oesophagus, stomach, duodenum, pancreas, ileum, colon and rectum, with the liver, gall bladder, bile duct, pancreatic duct, jejunum and anus as context" : mode === "numbered" ? ", with the eight structures named in the specification numbered 1 to 8" : "");
    const css = `<style>.dg${u} .hs{fill:#fff;fill-opacity:0;stroke:none}.dg${u} [data-part]{outline:none}` +
      (o.interactive ? `.dg${u} [data-part]{cursor:pointer}.dg${u} [data-part]:hover .hs,.dg${u} [data-part]:focus .hs{fill:${DG_HL};fill-opacity:.2;stroke:${DG_HL};stroke-width:7}.dg${u} [data-part]:focus-visible .hs{stroke:#0f2e27;stroke-dasharray:18 8}` : "") +
      `.dg${u} .hl .hs,.dg${u} .hlon .hs{fill:${DG_HL};fill-opacity:.3;stroke:#7a4a00;stroke-width:8}</style>`;
    const clip = `<clipPath id="ct${u}"><rect x="0" y="0" width="${DIG_IMG.w}" height="${CUT[0]}"/></clipPath><clipPath id="cb${u}"><rect x="0" y="${CUT[0]}" width="${DIG_IMG.w}" height="${DIG_IMG.h}"/></clipPath>`;
    let s = `<svg viewBox="${vx} ${vy} ${vw} ${vh}" width="${o.width || 560}" role="img" aria-label="${aria}" class="dg${u}" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" style="max-width:100%;min-width:${o.minWidth === undefined ? 340 : o.minWidth}px;height:auto"><defs>${css}${clip}</defs>`;
    s += `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#ffffff"/><image href="${DIG_IMG.src}" x="0" y="0" width="${DIG_IMG.w}" height="${DIG_IMG.h}" clip-path="url(#ct${u})"/><image href="${DIG_IMG.src}" x="0" y="${-CUT_D}" width="${DIG_IMG.w}" height="${DIG_IMG.h}" clip-path="url(#cb${u})"/>`;
    // break mark across the oesophagus where the drawing is shortened
    const bw = (yy) => `M496 ${yy} q13 -9 26 0 t26 0 t26 0 t26 0 t26 0`;
    s += `<path d="${bw(CUT[0] - 9)} L626 ${CUT[0] + 9} q-13 9 -26 0 t-26 0 t-26 0 t-26 0 t-26 0 Z" fill="#fff" stroke="none"/><path d="${bw(CUT[0] - 9)}" fill="none" stroke="${GREY}" stroke-width="4"/><path d="${bw(CUT[0] + 9)}" fill="none" stroke="${GREY}" stroke-width="4"/>`;
    s += T(-360, 64, "person's RIGHT side", { s: 46, w: 800, c: NAVY, a: "start" }) + T(-360, 114, "(on your left)", { s: 44, w: 600, c: GREY, a: "start" });
    s += T(1580, 64, "person's LEFT side", { s: 46, w: 800, c: NAVY, a: "end" }) + T(1580, 114, "(on your right)", { s: 44, w: 600, c: GREY, a: "end" });
    // hotspots (always present, so the drawing can be highlighted; focusable only when interactive)
    const names = { liver: "Liver", gallbladder: "Gall bladder", salivary: "Salivary glands", oesophagus: "Oesophagus", stomach: "Stomach", duodenum: "Duodenum", pancreas: "Pancreas", jejunum: "Jejunum", ileum: "Ileum", colon: "Colon", rectum: "Rectum", anus: "Anus" };
    for (const [k, ds] of DIG_SHAPES) s += `<g data-part="${k}"${hl.has(k) ? ' class="hlon"' : ""}>${o.interactive && o.titles !== false ? `<title>${names[k]}</title>` : ""}${ds.map((d) => `<path class="hs" d="${mapPath(d)}"/>`).join("")}</g>`;
    if (mode !== "none") {
      const lead = (x1, y1, x2, y2, c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="7" stroke-opacity=".85"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="3"/><circle cx="${x2}" cy="${y2}" r="7" fill="${c}" stroke="#fff" stroke-width="2.5"/>`;
      for (const [part, lines, side, ly0, dots, ctx] of DIG_LABELS) {
        if (mode === "numbered" && (part === "bileduct" || part === "pancduct")) continue; // the ducts would point the way to 4 and 5
        const ly = dy(ly0);
        const L = side === "L", tx = L ? -30 : 1130, a = L ? "end" : "start", c = ctx ? "#6d7b88" : INK;
        const num = mode === "numbered" && !ctx;
        const R = 46; // number badge radius (numbered mode)
        const sx = num ? (L ? -30 - R : 1130 + R) : (L ? -18 : 1118), sy = ly - 15;
        s += `<g data-label="${part}" pointer-events="none">${dots.map(([px, py]) => lead(L ? sx + (num ? R : 0) : sx - (num ? R : 0), sy, px, dy(py), c)).join("")}`;
        if (num) s += `<circle cx="${sx}" cy="${sy}" r="${R}" fill="${NAVY}" stroke="#fff" stroke-width="4"/>${T(sx, sy + 18, NUMBERS[part], { s: 52, w: 800, c: "#fff" })}`;
        else if (ctx) s += T(tx, ly, lines[0], { s: 48, w: 600, c, a, i: true }) + T(tx, ly + 44, "(context)", { s: 44, c, a });
        else s += lines.map((t, i) => T(tx, ly + i * 46, t, i ? { s: 44, w: 600, c: GREY, a } : { s: 54, w: 800, c, a })).join("");
        s += "</g>";
      }
    }
    // o.credit === false (the explorer): the image credit is shown as HTML text under the drawing instead (DIG_CREDIT)
    if (o.credit !== false) s += T(-360, 2276, DIG_CREDIT, { s: 30, c: GREY, a: "start" });
    return s + "</svg>";
  }
  const DIG_CREDIT = "Image: public domain (LadyofHats, Jmarchn); labels added";

  // =====================================================================================================
  // 2. Carbohydrate digestion: starch → maltose (amylase) → glucose (membrane-bound maltase); other disaccharides.
  // =====================================================================================================
  function carbDigestion() {
    uid();
    let s = svgOpen(760, 360, "starch is hydrolysed by amylase to maltose, and maltose by the membrane-bound disaccharidase maltase to glucose; sucrose and lactose are hydrolysed by sucrase and lactase") + `<defs>${mk("cd", INK)}</defs>`;
    s += T(110, 22, "starch (polysaccharide)", { s: 12.5, w: 700 }) + T(390, 22, "maltose (disaccharide)", { s: 12.5, w: 700 }) + T(660, 22, "glucose (monosaccharide)", { s: 12.5, w: 700 });
    // starch: chain of glucose units
    // 10 glucose units cut at every second bond, so the 5 maltose and 10 glucose drawn to the right balance (QG2 R7).
    for (let k = 0; k < 10; k++) { const x = 20 + k * 20; s += hex(x, 70, 8); if (k < 9) s += L(x + 7, 70, x + 13, 70, { c: AMBER, w: 2 }); }
    [50, 90, 130, 170].forEach((x) => { s += `<path d="M${x - 3.5} 59 L${x + 3.5} 81 M${x + 3.5} 59 L${x - 3.5} 81" stroke="${ROSE}" stroke-width="2.2"/>`; });
    s += T(110, 102, "glucose units joined by glycosidic bonds", { s: 10, c: GREY });
    // amylase arrow
    s += L(220, 70, 300, 70, { w: 2.5, m: "cd" }) + T(260, 52, "amylase", { s: 12, w: 700, c: ROSE }) + T(260, 92, "+ H₂O", { s: 10, c: GREY }) + T(260, 120, "salivary glands → mouth;", { s: 9.5, c: GREY }) + T(260, 132, "pancreas → duodenum", { s: 9.5, c: GREY });
    // maltose pairs
    [[330, 60], [390, 60], [450, 60], [360, 92], [420, 92]].forEach(([x, y]) => { s += hex(x, y) + L(x + 8, y, x + 13, y, { c: AMBER, w: 2 }) + hex(x + 21, y); });
    // maltase arrow
    s += L(500, 70, 580, 70, { w: 2.5, m: "cd" }) + T(540, 52, "maltase", { s: 12, w: 700, c: ROSE }) + T(540, 92, "+ H₂O", { s: 10, c: GREY }) + T(540, 120, "membrane-bound on the", { s: 9.5, c: GREY }) + T(540, 132, "ileum epithelium", { s: 9.5, c: GREY });
    [[610, 58], [640, 58], [670, 58], [700, 58], [625, 86], [655, 86], [685, 86], [715, 86], [640, 112], [670, 112]].forEach(([x, y]) => { s += hex(x, y); });
    // divider and other disaccharides
    s += L(20, 160, 740, 160, { c: "#d4dce3", w: 1 }) + T(380, 182, "Other disaccharides are hydrolysed by their own membrane-bound disaccharidases", { s: 12, w: 700 });
    const row = (y, name, enz, a, b, aName, bName) => { let r = T(70, y + 4, name, { s: 12, w: 700, a: "middle" }); r += a(160, y) + L(168, y, 176, y, { c: AMBER, w: 2 }) + b(185, y); r += L(220, y, 330, y, { w: 2.5, m: "cd" }) + T(275, y - 10, enz, { s: 11.5, w: 700, c: ROSE }) + T(275, y + 16, "+ H₂O", { s: 10, c: GREY }); r += a(370, y) + T(370, y + 26, aName, { s: 10, c: GREY }) + T(400, y + 4, "+", { s: 14, w: 700 }) + b(430, y) + T(430, y + 26, bName, { s: 10, c: GREY }); return r; };
    s += row(225, "sucrose", "sucrase", hex, (x, y) => pent(x, y), "glucose", "fructose");
    s += row(290, "lactose", "lactase", hex, (x, y) => hex(x, y, 9, "#e2efe6", SAGE), "glucose", "galactose");
    s += `<rect x="490" y="200" width="250" height="118" rx="10" fill="#f4f7fa" stroke="#d4dce3"/>` + T(615, 222, "Where?", { s: 11.5, w: 700 }) + T(615, 242, "Disaccharidases are attached to the", { s: 10, c: GREY }) + T(615, 256, "cell-surface membranes (microvilli) of", { s: 10, c: GREY }) + T(615, 270, "the ileum epithelial cells, so the", { s: 10, c: GREY }) + T(615, 284, "monosaccharides are released right", { s: 10, c: GREY }) + T(615, 298, "beside the transport proteins.", { s: 10, c: GREY });
    s += T(380, 350, "Schematic. Hexagon = glucose; pentagon = fructose; green hexagon = galactose. Every arrow is a hydrolysis reaction.", { s: 10, c: GREY });
    return s + "</svg>";
  }

  // =====================================================================================================
  // 3. Lipid digestion: emulsification by bile salts (physical), then hydrolysis by lipase (chemical).
  // =====================================================================================================
  // bile salt glyph: a short bar, blue (hydrophilic) face outward, yellow (hydrophobic) face toward the lipid
  const bileSalt = (cx, cy, ang, len = 10) => { const a = (ang * Math.PI) / 180; const ux = Math.cos(a), uy = Math.sin(a), tx = -uy, ty = ux; const p = (sx, sy) => `${(cx + sx).toFixed(1)} ${(cy + sy).toFixed(1)}`; const h = len / 2; return `<path d="M${p(-tx * h, -ty * h)} L${p(tx * h, ty * h)} L${p(tx * h + ux * 3, ty * h + uy * 3)} L${p(-tx * h + ux * 3, -ty * h + uy * 3)}Z" fill="#9ec9f0" stroke="${NAVY}" stroke-width=".8"/><path d="M${p(-tx * h, -ty * h)} L${p(tx * h, ty * h)} L${p(tx * h - ux * 3, ty * h - uy * 3)} L${p(-tx * h - ux * 3, -ty * h - uy * 3)}Z" fill="#f3d88a" stroke="${AMBER}" stroke-width=".8"/>`; };
  const coatedDroplet = (x, y, r, n) => { let g = `<circle cx="${x}" cy="${y}" r="${r}" fill="#fbeab0" stroke="${AMBER}" stroke-width="1.5"/>`; for (let k = 0; k < n; k++) { const a = (k * 360) / n; const rad = (a * Math.PI) / 180; g += bileSalt(x + (r + 1.5) * Math.cos(rad), y + (r + 1.5) * Math.sin(rad), a); } return g; };
  // triglyceride glyph: glycerol bar with three tails (to the right); monoglyceride keeps the middle tail
  const tri = (x, y, tails = [1, 1, 1], col = AMBER) => { let g = `<rect x="${x - 4}" y="${y - 18}" width="8" height="36" rx="3" fill="#e4ebf5" stroke="${NAVY}" stroke-width="1.2"/>`; [-12, 0, 12].forEach((dy, i) => { if (tails[i]) g += P(`M${x + 4} ${y + dy} q 8 -4 14 0 t 14 0 t 14 0`, { c: col, w: 2.5 }); }); return g; };
  const fa = (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" stroke="${ROSE}" stroke-width="1.5"/>` + P(`M${x + 3} ${y} q 8 -4 14 0 t 14 0 t 14 0`, { c: AMBER, w: 2.5 });
  function lipidDigestion() {
    uid();
    let s = svgOpen(760, 330, "bile salts emulsify a large lipid droplet into many small droplets, increasing the surface area; lipase then hydrolyses triglycerides at the droplet surface into monoglycerides and fatty acids") + `<defs>${mk("ld", INK)}</defs>`;
    s += `<rect x="0" y="0" width="760" height="250" fill="#f2f8fc"/>` + T(14, 18, "watery contents of the duodenum and ileum", { s: 10, c: GREY, a: "start" });
    s += T(110, 40, "1 Large fat droplet", { s: 12.5, w: 700 }) + `<circle cx="110" cy="140" r="62" fill="#fbeab0" stroke="${AMBER}" stroke-width="2"/>` + T(110, 144, "triglycerides", { s: 11, c: AMBER, w: 600 }) + T(110, 226, "small surface area for its volume", { s: 10, c: GREY });
    s += L(185, 140, 245, 140, { w: 2.5, m: "ld" }) + T(215, 120, "bile salts", { s: 11.5, w: 700, c: NAVY }) + T(215, 166, "emulsify", { s: 10.5, c: NAVY });
    s += T(370, 40, "2 Emulsion: many tiny droplets", { s: 12.5, w: 700 });
    [[300, 90, 14], [345, 75, 12], [395, 92, 15], [440, 80, 11], [310, 140, 13], [360, 128, 15], [415, 138, 13], [330, 188, 12], [385, 182, 14], [440, 178, 12]].forEach(([x, y, r]) => { s += coatedDroplet(x, y, r, 10); });
    s += T(370, 226, "same volume of lipid, much larger surface area", { s: 10, c: GREY }) + T(370, 240, "physical change: no bonds are broken", { s: 10, c: NAVY, w: 700 });
    s += L(470, 140, 520, 140, { w: 2.5, m: "ld" }) + T(495, 120, "lipase", { s: 11.5, w: 700, c: ROSE }) + T(495, 166, "+ 2 H₂O", { s: 10, c: GREY });
    s += T(640, 40, "3 Hydrolysis at the droplet surface", { s: 12.5, w: 700 });
    s += tri(555, 110) + T(585, 146, "triglyceride", { s: 10, c: GREY });
    s += L(605, 110, 630, 110, { w: 2, m: "ld" });
    s += tri(650, 90, [0, 1, 0]) + T(678, 124, "monoglyceride", { s: 10, c: GREY }) + fa(650, 150) + fa(650, 166) + T(690, 188, "2 fatty acids", { s: 10, c: GREY });
    s += T(640, 226, "ester bonds hydrolysed: chemical change", { s: 10, c: ROSE, w: 700 });
    // key
    s += bileSalt(40, 282, 0, 14) + T(56, 286, "bile salt: hydrophilic face (blue) toward water, hydrophobic face (yellow) in the lipid", { s: 10.5, a: "start" });
    s += T(380, 312, "Bile salts contain no enzyme and hydrolyse nothing. Lipase is water-soluble and works only at the lipid–water interface,", { s: 10.5, c: GREY });
    s += T(380, 326, "so a larger interface means faster hydrolysis. Schematic; lipase removes the outer two fatty acids, leaving a monoglyceride.", { s: 10.5, c: GREY });
    return s + "</svg>";
  }

  // =====================================================================================================
  // 4. Protein digestion: endopeptidases (internal bonds) → exopeptidases (terminal amino acids) → membrane-bound
  //    dipeptidases (dipeptides). Beads = amino acids; N and C mark the amino and carboxyl ends.
  // =====================================================================================================
  function proteinDigestion() {
    uid();
    const chain = (x0, y, n, gap = 22, opt = {}) => { let g = ""; for (let k = 0; k < n; k++) { const x = x0 + k * gap; if (k < n - 1) g += L(x + 9, y, x + gap - 9, y, { c: NAVY, w: 2 }); g += bead(x, y, opt.fill || "#e4ebf5"); } if (opt.ends) g += T(x0 - 16, y + 4, "N", { s: 10, w: 700, c: GREY }) + T(x0 + (n - 1) * gap + 16, y + 4, "C", { s: 10, w: 700, c: GREY }); return g; };
    let s = svgOpen(760, 460, "endopeptidases hydrolyse peptide bonds inside a polypeptide, exopeptidases remove amino acids from the ends, and membrane-bound dipeptidases hydrolyse dipeptides into amino acids") + `<defs>${mk("pd", INK)}</defs>`;
    s += T(20, 26, "1 Endopeptidases hydrolyse peptide bonds WITHIN the polypeptide", { s: 12.5, w: 700, a: "start" }) + T(20, 42, "stomach (e.g. pepsin) and duodenum (e.g. trypsin from the pancreas)", { s: 10.5, c: GREY, a: "start" });
    s += chain(50, 75, 14, 22, { ends: true });
    [(50 + 3 * 22 + 11), (50 + 8 * 22 + 11)].forEach((x) => { s += cut(x, 75); });
    s += L(370, 75, 420, 75, { w: 2.5, m: "pd" });
    s += chain(450, 75, 4) + chain(560, 75, 5) + chain(450, 105, 5);
    s += T(600, 130, "shorter polypeptides: more ends", { s: 10.5, c: NAVY, w: 700 });
    s += L(20, 152, 740, 152, { c: "#d4dce3", w: 1 });
    s += T(20, 176, "2 Exopeptidases hydrolyse the peptide bond at an END, removing a terminal amino acid", { s: 12.5, w: 700, a: "start" }) + T(20, 192, "duodenum and ileum; act on the many ends made by endopeptidases", { s: 10.5, c: GREY, a: "start" });
    s += chain(70, 228, 5) + cut(70 + 11, 228) + cut(70 + 3 * 22 + 11, 228);
    s += L(200, 228, 250, 228, { w: 2.5, m: "pd" });
    s += bead(280, 228, "#e2efe6") + T(312, 232, "+", { s: 14, w: 700 }) + chain(340, 228, 3) + T(412, 232, "+", { s: 14, w: 700 }) + bead(440, 228, "#e2efe6");
    s += T(280, 256, "amino acid", { s: 10, c: GREY }) + T(362, 256, "shorter chain", { s: 10, c: GREY }) + T(440, 256, "amino acid", { s: 10, c: GREY });
    s += T(600, 222, "repeated until only", { s: 10.5, c: NAVY, w: 700 }) + T(600, 236, "dipeptides and free", { s: 10.5, c: NAVY, w: 700 }) + T(600, 250, "amino acids remain", { s: 10.5, c: NAVY, w: 700 });
    s += L(20, 276, 740, 276, { c: "#d4dce3", w: 1 });
    s += T(20, 300, "3 Membrane-bound dipeptidases hydrolyse the single peptide bond of a dipeptide", { s: 12.5, w: 700, a: "start" }) + T(20, 316, "attached to the cell-surface membranes (microvilli) of ileum epithelial cells", { s: 10.5, c: GREY, a: "start" });
    // epithelial surface with microvilli; the dipeptidase sits on the tip of one microvillus (x 222–236)
    s += `<rect x="40" y="400" width="680" height="40" fill="#e9f5f2"/>`;
    let mv = "M40 400"; for (let k = 0; k < 16; k++) { mv += ` h 14 v -26 a 7 7 0 0 1 14 0 v 26 h 14`; } s += `<path d="${mv}" fill="#e9f5f2" stroke="${TEAL}" stroke-width="2.5"/>`;
    s += T(380, 428, "ileum epithelial cell (cytoplasm)", { s: 10.5, c: TEAL, w: 600 }) + T(700, 352, "lumen", { s: 10.5, c: GREY });
    s += `<rect x="221" y="357" width="16" height="10" rx="3" fill="${PLUM}"/>` + L(150, 362, 219, 362, { c: GREY, w: 1 }) + T(146, 366, "dipeptidase", { s: 10.5, c: PLUM, w: 700, a: "end" });
    s += chain(219, 337, 2, 20) + cut(229, 337) + L(266, 337, 298, 337, { w: 2, m: "pd" }) + bead(318, 337, "#e2efe6") + bead(342, 337, "#e2efe6") + T(362, 341, "2 amino acids, released beside the co-transport proteins", { s: 10, c: GREY, a: "start" });
    s += T(380, 454, "Schematic. Circles = amino acids; lines = peptide bonds; crosses = bonds hydrolysed. Each hydrolysis uses one water molecule.", { s: 10, c: GREY });
    return s + "</svg>";
  }

  // =====================================================================================================
  // 5. Ileum histology at three magnifications (used by the diagram and the Villus and Microvillus Explorer).
  //    Scale bars are drawn to each drawing's VERTICAL scale; widths are exaggerated where stated in the caption.
  // =====================================================================================================
  function ileumWall() {
    uid();
    // vertical scale: 0.1 mm = 30 px. Villi ≈ 0.6 mm; mucosa below the villi ≈ 0.25 mm; submucosa ≈ 0.2 mm; muscle ≈ 0.2 mm.
    let s = svgOpen(760, 540, "section through the wall of the ileum: villi project into the lumen at the top; below are the submucosa, circular and longitudinal muscle layers and the serosa");
    s += `<rect x="0" y="0" width="760" height="60" fill="#fdf3e3"/>` + T(380, 22, "lumen of the ileum", { s: 12, w: 700 });
    const base = 250;
    for (let k = 0; k < 9; k++) { const x = 60 + k * 72; s += `<g data-part="villus"><path d="M${x} ${base} L${x} ${base - 160} C ${x} ${base - 186}, ${x + 46} ${base - 186}, ${x + 46} ${base - 160} L${x + 46} ${base}" fill="#f1d9cf" stroke="${ROSE}" stroke-width="2"/>${P(`M${x + 10} ${base} L${x + 10} ${base - 150} C ${x + 10} ${base - 168}, ${x + 36} ${base - 168}, ${x + 36} ${base - 150} L${x + 36} ${base}`, { c: "#c0504f", w: 1.2 })}<rect x="${x + 20}" y="${base - 150}" width="6" height="150" rx="3" fill="#fbf3c8" stroke="#c9a640" stroke-width="1"/></g>`; }
    s += `<rect x="40" y="${base}" width="680" height="72" fill="#f1d9cf" stroke="${ROSE}" stroke-width="1"/>`;
    for (let k = 0; k < 9; k++) { const x = 60 + k * 72 + 52; s += `<path d="M${x} ${base} L${x} ${base + 50} a 6 6 0 0 0 12 0 L${x + 12} ${base}" fill="#fff6f0" stroke="${ROSE}" stroke-width="1.2"/>`; }
    s += `<rect x="40" y="${base + 72}" width="680" height="54" fill="#f7eee1" stroke="#c9b28a" stroke-width="1"/>`;
    [[160, 4], [330, 5], [520, 4]].forEach(([x, r]) => { s += `<circle cx="${x}" cy="${base + 98}" r="${r + 3}" fill="#f6dede" stroke="${ROSE}"/><circle cx="${x + 24}" cy="${base + 100}" r="${r + 2}" fill="#e4ebf5" stroke="${NAVY}"/>`; });
    s += `<rect x="40" y="${base + 126}" width="680" height="36" fill="#e9c9c0" stroke="#a8674c" stroke-width="1"/>` + Array.from({ length: 29 }, (_, k) => L(48 + k * 23, base + 136, 62 + k * 23, base + 152, { c: "#b88070", w: 1 })).join("");
    s += `<rect x="40" y="${base + 162}" width="680" height="26" fill="#dfb5a9" stroke="#a8674c" stroke-width="1"/>` + Array.from({ length: 22 }, (_, k) => `<ellipse cx="${56 + k * 31}" cy="${base + 175}" rx="9" ry="4" fill="#cf9d90" stroke="#a8674c" stroke-width=".8"/>`).join("");
    s += `<rect x="40" y="${base + 188}" width="680" height="8" fill="#f4f4f4" stroke="#9aa7b3" stroke-width="1"/>`;
    // inline labels on the first villus (capillary, lacteal) and a crypt
    s += L(70, base - 120, -6, base - 120, { c: GREY, w: 1 }) + T(-66, base - 115, "capillary", { s: 9.5, c: GREY, a: "start" });
    s += L(83, base - 60, -6, base - 60, { c: GREY, w: 1 }) + T(-66, base - 55, "lacteal", { s: 9.5, c: GREY, a: "start" });
    s += T(83, base - 192, "villus", { s: 11, w: 700, c: ROSE });
    s += L(118, base + 40, 118, base + 60, { c: GREY, w: 1 }) + T(118, base + 70, "crypt", { s: 9.5, c: GREY });
    // legend under the drawing (avoids leader lines crossing the villi)
    // Round 2 (N6): short legend entries, so the two columns never run into each other when the labels are enlarged
    const rows = [["#f1d9cf", ROSE, "mucosa: villi, crypts, epithelium"], ["#f7eee1", "#c9b28a", "submucosa: larger vessels"], ["#e9c9c0", "#a8674c", "circular muscle"], ["#dfb5a9", "#a8674c", "longitudinal muscle"], ["#f4f4f4", "#9aa7b3", "serosa: thin outer covering"]];
    rows.forEach(([f, st, t], i) => { const x = i % 2 ? 400 : 40, y = base + 222 + Math.floor(i / 2) * 20; s += `<rect x="${x}" y="${y - 10}" width="16" height="12" fill="${f}" stroke="${st}"/>` + T(x + 22, y, t, { s: 10, a: "start" }); });
    // scale bar: 0.5 mm = 150 px at 30 px per 0.1 mm (vertical scale)
    s += `<line x1="742" y1="${base - 150}" x2="742" y2="${base}" stroke="${INK}" stroke-width="3"/><line x1="736" y1="${base - 150}" x2="748" y2="${base - 150}" stroke="${INK}" stroke-width="2"/><line x1="736" y1="${base}" x2="748" y2="${base}" stroke="${INK}" stroke-width="2"/>` + T(733, base - 75, "≈ 0.5 mm", { s: 10, w: 700, r: -90 });
    s += T(380, 534, "Schematic. Vertical scale approximate (bar ≈ 0.5 mm). Villi are drawn further apart than in life; capillaries and lacteals simplified.", { s: 9.5, c: GREY });
    // round 2: a 70-unit margin on the left holds the capillary and lacteal labels, which are enlarged in the explorer
    return s.replace('viewBox="0 0 760 540" width="760"', 'viewBox="-70 0 830 540" width="830"') + "</svg>";
  }

  // One villus: epithelium one cell thick with a brush border and goblet cells, capillary network, central lacteal.
  function villus({ labels = true } = {}) {
    uid();
    let s = svgOpen(760, 520, "a single villus: a finger-like fold covered by epithelium one cell thick, with a capillary network and a central lacteal") + `<defs>${mk("vb", ROSE)}${mk("vv", NAVY)}${mk("vl", "#8a6f1a")}</defs>`;
    s += `<rect x="0" y="0" width="760" height="520" fill="#fdf8ef"/>` + T(380, 20, "lumen of the ileum", { s: 11, c: GREY });
    const cx = 380, top = 60, bot = 450, hw = 92; // half-width of villus (exaggerated about 1.5×)
    // outer epithelium: a band of COLUMNAR cells (deeper than they are wide) following the outline. Band depth E = 34;
    // cells about 14 px wide along the surface; one nucleus per cell, towards the base (inner side) of the cell.
    const E = 34, CW = 14, CAP = 52; // CAP: capillary offset from the midline, just inside the epithelium (at hw - E = 58)
    const outline = `M${cx - hw} ${bot} L${cx - hw} ${top + hw} A ${hw} ${hw} 0 0 1 ${cx + hw} ${top + hw} L${cx + hw} ${bot}`;
    const inner = `M${cx - hw + E} ${bot} L${cx - hw + E} ${top + hw} A ${hw - E} ${hw - E} 0 0 1 ${cx + hw - E} ${top + hw} L${cx + hw - E} ${bot}`;
    s += `<g data-part="epithelium"><path d="${outline} Z" fill="#e9f5f2" stroke="${TEAL}" stroke-width="2.5"/>`;
    // brush border: a fringe of tiny microvilli along the outline
    let bb = ""; const N = 90; for (let k = 0; k <= N; k++) { const t = k / N; let x, y, nx, ny; const sL = bot - (top + hw), arc = Math.PI * hw, total = 2 * sL + arc, d = t * total; if (d < sL) { x = cx - hw; y = bot - d; nx = -1; ny = 0; } else if (d < sL + arc) { const a = Math.PI - (d - sL) / hw; x = cx + hw * Math.cos(a); y = top + hw - hw * Math.sin(a); nx = Math.cos(a); ny = -Math.sin(a); } else { x = cx + hw; y = top + hw + (d - sL - arc); nx = 1; ny = 0; } bb += `M${x.toFixed(1)} ${y.toFixed(1)} l${(nx * 6).toFixed(1)} ${(ny * 6).toFixed(1)} `; }
    s += `<path d="${bb}" stroke="${TEAL}" stroke-width="1.3"/>`;
    // goblet cells sit in the band at these positions (side, y); no nucleus is drawn in those cells
    const GOB = [[-1, 300], [1, 220], [1, 380]];
    const nuc = (x, y, ang) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="3.2" transform="rotate(${ang.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#b7d3e6" stroke="${NAVY}" stroke-width=".8"/>`;
    // straight sides: boundaries every CW px; nucleus in the inner (basal) half of each cell
    for (let y = bot - CW; y > top + hw; y -= CW) { s += L(cx - hw, y, cx - hw + E, y, { c: TEAL, w: 0.9 }) + L(cx + hw - E, y, cx + hw, y, { c: TEAL, w: 0.9 }); const yc = y + CW / 2; [-1, 1].forEach((side) => { if (!GOB.some(([g, gy]) => g === side && Math.abs(gy - yc) < CW)) s += nuc(cx + side * (hw - 22), yc, 0); }); }
    // dome: radial boundaries about CW apart at the outer surface, a nucleus between each pair
    const nA = Math.round((Math.PI * hw) / CW); for (let k = 0; k <= nA; k++) { const a = Math.PI - (k * Math.PI) / nA; s += L(cx + hw * Math.cos(a), top + hw - hw * Math.sin(a), cx + (hw - E) * Math.cos(a), top + hw - (hw - E) * Math.sin(a), { c: TEAL, w: 0.9 }); if (k < nA) { const am = a - Math.PI / nA / 2; s += nuc(cx + (hw - 22) * Math.cos(am), top + hw - (hw - 22) * Math.sin(am), (-am * 180) / Math.PI); } }
    s += `<path d="${inner} Z" fill="#fbeee8" stroke="${TEAL}" stroke-width="1.2"/></g>`;
    // goblet cells (mucus) in the epithelium: goblet-shaped, long axis across the band
    s += `<g data-part="goblet">${GOB.map(([side, y]) => { const x = cx + side * (hw - 17); return `<ellipse cx="${x}" cy="${y}" rx="13" ry="6.5" fill="#fff" stroke="${PLUM}" stroke-width="1.5"/><circle cx="${x - 3}" cy="${y - 1}" r="2" fill="${PLUM}" opacity=".5"/><circle cx="${x + 4}" cy="${y + 2}" r="2" fill="${PLUM}" opacity=".5"/>`; }).join("")}</g>`;
    // capillary network just beneath the epithelium: arteriole up one side, venule down the other, joined by a mesh
    s += `<g data-part="capillary">${P(`M${cx - CAP} ${bot} L${cx - CAP} ${top + 110} C ${cx - CAP} ${top + 18}, ${cx + CAP} ${top + 18}, ${cx + CAP} ${top + 110} L${cx + CAP} ${bot}`, { c: ROSE, w: 4 })}`;
    for (let y = top + 140; y < bot; y += 44) s += P(`M${cx - CAP} ${y} C ${cx - 20} ${y - 14}, ${cx + 20} ${y + 14}, ${cx + CAP} ${y}`, { c: "#c46a6a", w: 2 });
    s += "</g>";
    // lacteal: blind-ended lymph vessel in the centre
    s += `<g data-part="lacteal"><path d="M${cx - 10} ${bot} L${cx - 10} ${top + 130} a 10 10 0 0 1 20 0 L${cx + 10} ${bot}" fill="#fdf6cf" stroke="#b5952c" stroke-width="2"/></g>`;
    // base, then (on top of it) the vessel stubs and the flow arrows, so the direction of flow is visible
    s += `<rect x="${cx - 250}" y="${bot}" width="500" height="48" fill="#fbeee8" stroke="${TEAL}" stroke-width="1"/>`;
    s += L(cx - CAP, bot - 1, cx - CAP, bot + 28, { c: ROSE, w: 4 }) + L(cx + CAP, bot - 1, cx + CAP, bot + 28, { c: "#8a3f5a", w: 4 }) + `<rect x="${cx - 10}" y="${bot - 1}" width="20" height="29" fill="#fdf6cf" stroke="#b5952c" stroke-width="2"/>`;
    s += L(cx - CAP - 13, bot + 28, cx - CAP - 13, bot - 2, { c: ROSE, w: 2.5, m: "vb" }) + L(cx + CAP + 13, bot - 2, cx + CAP + 13, bot + 28, { c: NAVY, w: 2.5, m: "vv" }) + L(cx, bot + 4, cx, bot + 26, { c: "#8a6f1a", w: 2, m: "vl" });
    s += T(cx - CAP - 20, bot + 20, "blood in", { s: 10, w: 700, c: ROSE, a: "end" }) + T(cx + CAP + 20, bot + 20, "blood out", { s: 10, w: 700, c: NAVY, a: "start" }) + T(cx, bot + 42, "base of the villus: arteriole in (left), venule out (right); the lacteal drains into lymph vessels", { s: 10, c: GREY });
    if (labels) {
      const lab = (x1, y1, x2, y2, t, sub, a) => L(x1, y1, x2, y2, { c: GREY, w: 1 }) + T(x2 + (a === "end" ? -4 : 4), y2 + 4, t, { s: 12, w: 700, a: a || "start" }) + (sub ? T(x2 + (a === "end" ? -4 : 4), y2 + 18, sub, { s: 10, c: GREY, a: a || "start" }) : "");
      s += `<g data-label="epithelium">${lab(cx + hw - 10, 150, 520, 120, "epithelium one cell thick", "short diffusion distance")}</g>`;
      s += `<g data-label="microvilli">${lab(cx + 60, top + 22, 520, 60, "microvilli (brush border)", "on every epithelial cell")}</g>`;
      s += `<g data-label="capillary">${lab(cx + CAP, 300, 520, 300, "capillary network", "carries absorbed products away")}</g>`;
      s += `<g data-label="lacteal">${lab(cx - 8, 200, 240, 170, "lacteal (lymph vessel)", "absorbs chylomicrons", "end")}</g>`;
      s += `<g data-label="goblet">${lab(cx - hw + 6, 300, 240, 330, "goblet cell", "secretes mucus (supporting)", "end")}</g>`;
      s += `<g data-label="villus">${lab(cx - hw, 120, 240, 80, "villus", "finger-like fold of the wall", "end")}</g>`;
    }
    // honest scale: vertical scale 100 µm ≈ 70 px (villus drawn ≈ 560 µm tall); width exaggerated
    s += `<line x1="680" y1="380" x2="680" y2="450" stroke="${INK}" stroke-width="3"/><line x1="674" y1="380" x2="686" y2="380" stroke="${INK}" stroke-width="2"/><line x1="674" y1="450" x2="686" y2="450" stroke="${INK}" stroke-width="2"/>` + T(694, 420, "≈ 100 µm", { s: 10.5, w: 700, a: "start" }) + T(694, 434, "(vertical)", { s: 9.5, c: GREY, a: "start" });
    s += T(380, 512, "Schematic. Height drawn to the bar (≈ 0.55 mm); width and epithelial cells exaggerated about 1.5–2× so that the layers can be seen.", { s: 9.5, c: GREY });
    return s + "</svg>";
  }

  // One epithelial cell: microvilli at the top (lumen), many mitochondria, nucleus near the base, basal membrane
  // over the capillary. Scale: 10 µm = 140 px in BOTH directions, so the cell is drawn ≈ 21 µm tall and ≈ 10 µm wide
  // (columnar; real cells are about 7–10 µm wide). Microvilli drawn ≈ 1.1 µm long (16 px), fewer than in life.
  function epithelialCell({ labels = true } = {}) {
    uid();
    let s = svgOpen(760, 482, "a tall columnar ileum epithelial cell between two neighbours, with microvilli facing the lumen at the top, many mitochondria, endoplasmic reticulum, a nucleus near the base, the basal membrane at the bottom and a capillary below");
    s += `<rect x="0" y="0" width="760" height="70" fill="#fdf3e3"/>` + T(16, 22, "lumen of the ileum (top)", { s: 11.5, w: 700, a: "start" });
    const L0 = 310, R0 = 450, top = 80, bot = 380, NL = 170, NR = 590; // the cell, and the outer edges of its neighbours
    // neighbouring cells (same shape) to show a sheet one cell thick
    s += [[NL, L0], [R0, NR]].map(([x1, x2]) => `<rect x="${x1}" y="${top}" width="${x2 - x1}" height="${bot - top}" fill="#eef7f4" stroke="${TEAL}" stroke-width="1.5"/><ellipse cx="${(x1 + x2) / 2}" cy="318" rx="24" ry="36" fill="#e3ecf4" stroke="#8aa0b8" stroke-width="1.2"/>`).join("");
    let mvL = ""; for (let x = NL + 2; x < NR - 4; x += 8) { if (x > L0 - 6 && x < R0) continue; mvL += `M${x} ${top} v -14 a 3 3 0 0 1 6 0 v 14 `; } s += `<path d="${mvL}" fill="#eef7f4" stroke="${TEAL}" stroke-width="1"/>`;
    s += `<g data-part="cell"><rect x="${L0}" y="${top}" width="${R0 - L0}" height="${bot - top}" fill="#e3f3ef" stroke="${TEAL}" stroke-width="2.5"/></g>`;
    let mv = ""; for (let x = L0 + 2; x < R0 - 4; x += 8) mv += `M${x} ${top} v -16 a 3 3 0 0 1 6 0 v 16 `; s += `<g data-part="microvilli"><path d="${mv}" fill="#e3f3ef" stroke="${TEAL}" stroke-width="1.3"/></g>`;
    // tight junctions (stretch): small dark bars at the top of the lateral membranes
    s += `<g data-part="junction">${[L0, R0].map((x) => `<rect x="${x - 2}" y="${top + 2}" width="4" height="12" fill="${INK}"/>`).join("")}</g>`;
    // organelles (mitochondria ≈ 1–2 µm long: drawn 28 px ≈ 2 µm)
    s += `<g data-part="mito">${[[345, 112], [415, 120], [340, 196], [420, 205], [336, 262], [424, 258], [380, 150], [380, 236]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="7" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.4"/><path d="M${x - 9} ${y} q2.25 -4 4.5 0 t4.5 0 t4.5 0 t4.5 0" fill="none" stroke="${AMBER}" stroke-width="1"/>`).join("")}</g>`;
    s += `<g data-part="er">${P("M330 168 q 12.5 -9 25 0 t 25 0 t 25 0 t 25 0", { c: "#7a8fb0", w: 2 })}${P("M330 180 q 12.5 -9 25 0 t 25 0 t 25 0 t 25 0", { c: "#7a8fb0", w: 2 })}${P("M345 288 q 9 -7 18 0 t 18 0 t 18 0 t 18 0", { c: "#7a8fb0", w: 2 })}</g>`;
    s += `<g data-part="nucleus"><ellipse cx="380" cy="330" rx="26" ry="38" fill="#cfe0ef" stroke="${NAVY}" stroke-width="2"/><circle cx="386" cy="322" r="7" fill="#9fb8d3"/></g>`;
    // the cell's basal membrane (its own plasma membrane, emphasised), then the basement membrane under the sheet
    s += `<path d="M${L0} ${bot} H${R0}" stroke="${NAVY}" stroke-width="3.5"/>`;
    s += `<rect x="${NL}" y="${bot + 4}" width="${NR - NL}" height="5" fill="#d9dfe5" stroke="#9aa7b3" stroke-width=".8"/>`;
    s += `<g data-part="capillaryC"><rect x="${NL}" y="${bot + 22}" width="${NR - NL}" height="44" rx="22" fill="#f6dede" stroke="${ROSE}" stroke-width="2"/>${[220, 300, 380, 460, 540].map((x) => `<ellipse cx="${x}" cy="${bot + 44}" rx="16" ry="9" fill="#e7a3a3" stroke="${ROSE}" stroke-width="1"/>`).join("")}</g>`;
    if (labels) {
      const lab = (x1, y1, y2, t, sub) => L(x1, y1, 650, y2, { c: GREY, w: 1 }) + T(656, y2 + 4, t, { s: 11.5, w: 700, a: "start" }) + (sub ? T(656, y2 + 17, sub, { s: 9.5, c: GREY, a: "start" }) : "");
      s += `<g data-label="microvilli">${lab(436, top - 10, 60, "microvilli", "≈ 1 µm long")}</g>`;
      s += `<g data-label="mito">${lab(429, 120, 120, "mitochondria", "ATP for the pumps")}</g>`;
      s += `<g data-label="er">${lab(430, 180, 186, "endoplasmic", "reticulum")}</g>`;
      s += `<g data-label="nucleus">${lab(404, 336, 280, "nucleus")}</g>`;
      s += `<g data-label="basal">${lab(436, bot, 336, "basal membrane", "faces the blood")}</g>`;
      s += `<g data-label="basement">${L(560, bot + 7, 650, 382, { c: "#9aa7b3", w: 1 })}${T(656, 386, "basement membrane", { s: 9.5, c: GREY, a: "start" })}${T(656, 397, "(not part of the cell)", { s: 8.5, c: GREY, a: "start" })}</g>`;
      s += `<g data-label="capillaryC">${lab(584, bot + 44, 426, "capillary")}</g>`;
      s += `<g data-label="junction">${L(232, 48, L0 - 3, top + 8, { c: GREY, w: 1 })}${T(228, 44, "tight junction (stretch)", { s: 9.5, c: GREY, a: "end" })}</g>`;
    }
    s += `<line x1="70" y1="${bot - 140}" x2="70" y2="${bot}" stroke="${INK}" stroke-width="3"/><line x1="64" y1="${bot - 140}" x2="76" y2="${bot - 140}" stroke="${INK}" stroke-width="2"/><line x1="64" y1="${bot}" x2="76" y2="${bot}" stroke="${INK}" stroke-width="2"/>` + T(58, bot - 70, "≈ 10 µm", { s: 10.5, w: 700, r: -90 });
    s += T(380, 462, "Schematic, drawn to the bar in both directions: the cell is ≈ 21 µm tall and ≈ 10 µm wide (real cells are about 7–10 µm wide).", { s: 9.5, c: GREY });
    s += T(380, 476, "A real cell has thousands of microvilli; fewer are drawn here, slightly longer than in life.", { s: 9.5, c: GREY });
    return s + "</svg>";
  }

  // =====================================================================================================
  // 6. Sodium-dependent co-transport across an ileum epithelial cell (lumen at the TOP, blood at the BOTTOM).
  //    opts: naCell 0..1 (drawn Na⁺ level in the cell), glcCell 0..1, pumpOn, flux {co, pump, fd} 0..1 for arrow weight.
  // =====================================================================================================
  const COTRANSPORT_CAPTION = "Schematic, not to scale. Lumen at the top, blood at the bottom. The co-transporter uses no ATP itself: the Na⁺ gradient made by the pump drives it.";
  function cotransport({ pumpOn = true, naCell = 0.15, glcCell = 0.7, flux = { co: 1, pump: 1, fd: 1 }, labels = true, dots = true, caption = true, big = false } = {}) {
    uid(); BIG = !!big; const z = (a, b) => (big ? b : a);
    // big (the Simulator): the smaller labels and the ion glyphs are drawn larger, at the same anchor points
    // caption false (the Simulator): the caption line is left out and shown as HTML text under the drawing instead, so it
    // stays readable when the drawing is scaled to fit beside the controls
    const W = 760, H = caption ? 560 : 548; const top = 150, bot = 400;
    let s = svgOpen(W, H, "sodium-glucose co-transport: a co-transporter in the microvillus membrane at the top lets sodium ions in down their gradient carrying glucose; a sodium-potassium pump in the basal membrane at the bottom pumps 3 sodium ions out and 2 potassium ions in using ATP; glucose leaves into the blood by facilitated diffusion") + `<defs>${mk("cn", NAVY)}${mk("ck", SAGE)}${mk("cg", AMBER)}${mk("ca", ROSE)}</defs>`;
    // lumen
    s += `<rect x="0" y="0" width="${W}" height="${top - 24}" fill="#fdf3e3"/>` + T(16, 22, "LUMEN OF THE ILEUM", { s: 12, w: 700, a: "start" }) + T(16, 38, "Na⁺ concentration high", { s: 10.5, c: NAVY, a: "start" });
    if (dots) { [[60, 70], [110, 92], [170, 60], [520, 66], [600, 92], [680, 62], [430, 80], [720, 100]].forEach(([x, y]) => { s += na(x, y); }); [[90, 110], [560, 112], [650, 116]].forEach(([x, y]) => { s += glc(x, y); }); }
    // below the cell (drawn first so the basal proteins and their arrows sit on top): tissue fluid, then the capillary
    s += `<rect x="0" y="${bot}" width="${W}" height="${H - bot}" fill="#fbf4f4"/>` + T(16, bot + 50, "tissue fluid", { s: z(10, 12), c: GREY, a: "start" });
    s += `<rect x="40" y="${bot + 92}" width="680" height="44" rx="22" fill="#f6dede" stroke="${ROSE}" stroke-width="2"/>` + [90, 650].map((x) => `<ellipse cx="${x}" cy="${bot + 114}" rx="15" ry="8" fill="#e7a3a3" stroke="${ROSE}"/>`).join("") + T(z(250, 270), z(bot + 119, bot + 120), "BLOOD IN A CAPILLARY: glucose carried away", { s: z(11, 13), w: 700, c: ROSE });
    // epithelial cell with microvilli (apical membrane at y = top)
    s += `<rect x="40" y="${top}" width="680" height="${bot - top}" fill="#e9f5f2" stroke="${TEAL}" stroke-width="3"/>`;
    let mv = ""; for (let x = 44; x < 716; x += 26) { if (x > 196 && x < 300) continue; mv += `M${x} ${top} v -24 a 6 6 0 0 1 12 0 v 24 `; } s += `<path d="${mv}" fill="#e9f5f2" stroke="${TEAL}" stroke-width="2"/>`;
    s += T(700, top + 22, "EPITHELIAL CELL", { s: 11.5, w: 700, a: "end", c: TEAL });
    // co-transporter in the apical (microvillus) membrane
    // R5-32: the box is wider and reads "co-transport / protein" on two lines
    s += `<g data-part="co"><rect x="202" y="${top - 26}" width="96" height="52" rx="14" fill="#fff" stroke="${NAVY}" stroke-width="2.5"/>${T(250, z(top - 4, top - 3), "co-transport", { s: z(10, 13), w: 700, c: NAVY })}${T(250, z(top + 9, top + 13), "protein", { s: z(10, 13), w: 700, c: NAVY })}</g>`;
    const wCo = 1.5 + 3 * (flux.co || 0), wP = 1.5 + 3 * (flux.pump || 0), wF = 1.5 + 3 * Math.abs(flux.fd || 0);
    const op = (f) => (f > 0.02 ? 1 : 0.25);
    s += `<g opacity="${op(flux.co)}">${L(232, 60, 232, top - 30, { c: NAVY, w: wCo, m: "cn" })}${L(232, top + 30, 232, top + 78, { c: NAVY, w: wCo, m: "cn" })}${L(268, 60, 268, top - 30, { c: AMBER, w: wCo, m: "cg" })}${L(268, top + 30, 268, top + 78, { c: AMBER, w: wCo, m: "cg" })}</g>`;
    s += na(232, 48) + glc(268, 48);
    // inside the cell
    const naPct = Math.round(naCell * 100);
    s += `<rect x="70" y="${top + 86}" width="150" height="16" rx="8" fill="#fff" stroke="${NAVY}"/><rect x="70" y="${top + 86}" width="${Math.max(4, 150 * naCell)}" height="16" rx="8" fill="#9ec9f0"/>` + T(145, top + 118, `Na⁺ in cell: ${naCell < 0.35 ? "LOW" : naCell < 0.7 ? "rising" : "HIGH"}`, { s: z(10.5, 13), w: 700, c: NAVY });
    s += `<rect x="70" y="${top + 128}" width="150" height="16" rx="8" fill="#fff" stroke="${AMBER}"/><rect x="70" y="${top + 128}" width="${Math.max(4, 150 * glcCell)}" height="16" rx="8" fill="#f3d88a"/>` + T(145, top + 160, `glucose in cell: ${glcCell > 0.5 ? "HIGH" : glcCell > 0.2 ? "moderate" : "low"}`, { s: z(10.5, 13), w: 700, c: AMBER });
    s += `<g data-part="mito">${[[480, top + 128], [650, top + 118], [110, top + 215]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="24" ry="11" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.4"/><path d="M${x - 16} ${y} q4 -6 8 0 t8 0 t8 0 t8 0" fill="none" stroke="${AMBER}" stroke-width="1"/>`).join("")}${T(480, top + 154, "mitochondria make ATP", { s: z(9.5, 12), c: GREY })}</g>`;
    // basal membrane proteins: Na⁺/K⁺ pump and glucose carrier
    s += `<g data-part="pump"><rect x="${370 - 36}" y="${bot - 28}" width="72" height="56" rx="14" fill="${pumpOn ? "#fff" : "#eeeeee"}" stroke="${ROSE}" stroke-width="2.5"${pumpOn ? "" : ' stroke-dasharray="5 3"'}/>${T(370, z(bot - 4, bot - 3), "Na⁺/K⁺", { s: z(10, 13), w: 700, c: ROSE })}${T(370, z(bot + 9, bot + 13), pumpOn ? "pump" : big ? "pump off" : "pump stopped", { s: z(9, 12.5), w: 700, c: ROSE })}</g>`;
    s += `<g opacity="${op(flux.pump)}">${L(352, bot - 80, 352, bot - 32, { c: NAVY, w: wP, m: "cn" })}${L(352, bot + 32, 352, bot + 74, { c: NAVY, w: wP, m: "cn" })}${L(390, bot + 74, 390, bot + 32, { c: SAGE, w: wP, m: "ck" })}${L(390, bot - 32, 390, bot - 80, { c: SAGE, w: wP, m: "ck" })}</g>`;
    // ATP sits on the cytoplasmic side, just above and to the right of the pump, with its text directly beneath it, so
    // it reads as belonging to the pump and stays well clear of the glucose carrier at x 560 (QA finding D1)
    // R5-32: the "ATP → ADP + Pᵢ" text is now the last line of label 2 (left of the pump), clear of the glucose carrier
    s += `<circle cx="${436}" cy="${bot - 58}" r="16" fill="${pumpOn ? "#fbe3e3" : "#eeeeee"}" stroke="${ROSE}" stroke-width="1.5"/>` + T(436, z(bot - 54, bot - 53.5), "ATP", { s: z(9.5, 10.5), w: 700, c: ROSE }) + L(424, bot - 46, 409, bot - 30, { c: ROSE, w: 1.5, m: "ca" });
    s += `<g data-part="fd"><rect x="${560 - 30}" y="${bot - 28}" width="60" height="56" rx="14" fill="#fff" stroke="${AMBER}" stroke-width="2.5"/>${T(560, z(bot - 4, bot - 3), "glucose", { s: z(9, 12.5), w: 700, c: AMBER })}${T(560, z(bot + 9, bot + 13), "carrier", { s: z(9, 12.5), w: 700, c: AMBER })}</g>`;
    const fdDown = (flux.fd || 0) >= 0;
    s += `<g opacity="${op(Math.abs(flux.fd || 0))}">${fdDown ? L(560, bot - 80, 560, bot - 32, { c: AMBER, w: wF, m: "cg" }) + L(560, bot + 32, 560, bot + 82, { c: AMBER, w: wF, m: "cg" }) : L(560, bot + 82, 560, bot + 32, { c: AMBER, w: wF, m: "cg" }) + L(560, bot - 32, 560, bot - 80, { c: AMBER, w: wF, m: "cg" })}</g>`;
    // below the cell: tissue fluid then the capillary
    if (labels) {
      s += [["1 Na⁺ diffuses IN, DOWN its", NAVY], ["concentration gradient, carrying", NAVY], ["glucose IN AGAINST its gradient", AMBER]].map(([t, c], i) => T(z(300, 304), top + 52 + z(14, 17) * i, t, { s: z(10.5, 14.5), w: 700, c, a: "start" })).join("");
      const f2 = z(10.5, 14.5), g2 = z(14, 17);
      s += [["2 pump: 3 Na⁺ OUT,", ROSE], ["2 K⁺ IN (active", ROSE], ["transport)", ROSE], [pumpOn ? "ATP → ADP + Pᵢ" : "no ATP used", ROSE]].map(([t, c], i) => T(326, bot - 14 - g2 * (3 - i), t, { s: f2, w: 700, c, a: "end" })).join("");
      // label 3 sits in the tissue fluid beside the outgoing glucose arrow, clear of the cell's border (R5-32)
      s += ["3 glucose OUT by", "facilitated diffusion", "(down its gradient)"].map((t, i) => T(z(596, 592), bot + 42 + g2 * i, t, { s: f2, w: 700, c: AMBER, a: "start" })).join("");
      s += T(z(352, 346), z(bot + 86, bot + 88), "3 Na⁺", { s: z(9.5, 12), w: 700, c: NAVY }) + T(z(394, 400), z(bot + 86, bot + 88), "2 K⁺", { s: z(9.5, 12), w: 700, c: SAGE }) + T(16, z(bot + 18, bot + 20), "basal membrane", { s: z(9.5, 12), c: GREY, a: "start" }) + T(z(300, 302), top - 32, "microvillus membrane", { s: z(9.5, 14), c: GREY, a: "start" });
    }
    if (caption) s += T(380, H - 6, COTRANSPORT_CAPTION, { s: 9.5, c: GREY });
    BIG = false;
    return s + "</svg>";
  }

  // =====================================================================================================
  // 7. Lipid absorption: micelles → diffusion into the cell → smooth ER → Golgi → chylomicrons → exocytosis → lacteal.
  //    Each stage is a <g data-part="stN"> so the explorer can highlight one stage at a time.
  // =====================================================================================================
  const micelle = (x, y, r = 16) => { let g = `<circle cx="${x}" cy="${y}" r="${r - 3}" fill="#fbeab0" stroke="none"/>`; for (let k = 0; k < 10; k++) { const a = (k * 36 * Math.PI) / 180; g += bileSalt(x + r * Math.cos(a), y + r * Math.sin(a), k * 36, 8); } g += `<path d="M${x - 6} ${y - 3} q 4 -3 8 0 t 6 0" stroke="${AMBER}" stroke-width="1.5" fill="none"/><path d="M${x - 6} ${y + 4} q 4 -3 8 0 t 6 0" stroke="${AMBER}" stroke-width="1.5" fill="none"/>`; return g; };
  const chylo = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fbeab0" stroke="${PLUM}" stroke-width="2"/>${[0, 1, 2, 3].map((k) => { const a = (k * 90 + 45) * Math.PI / 180; return `<circle cx="${(x + r * Math.cos(a)).toFixed(1)}" cy="${(y + r * Math.sin(a)).toFixed(1)}" r="2.6" fill="${PLUM}"/>`; }).join("")}`;
  // a chylomicron inside a vesicle (the vesicle membrane drawn as a thin outer ring), as in the alt text (QA finding D5)
  const vesicle = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="#f7f0fa" stroke="${PLUM}" stroke-width="1.4"/>` + chylo(x, y, r);
  function lipidAbsorption({ stage = 0 } = {}) {
    uid();
    const W = 760, H = 590, top = 170, bot = 430;
    const g = (n, inner) => `<g data-part="st${n}" opacity="${stage && stage !== n ? 0.28 : 1}">${inner}</g>`;
    let s = svgOpen(W, H, "lipid absorption: micelles carry monoglycerides and fatty acids to the epithelial cell; these diffuse through the membrane; triglycerides are re-formed in the smooth endoplasmic reticulum, combined with proteins into chylomicrons, packaged in vesicles by the Golgi apparatus, and released by exocytosis into a lacteal") + `<defs>${mk("la", INK)}${mk("lp", PLUM)}</defs>`;
    s += `<rect x="0" y="0" width="${W}" height="${top - 22}" fill="#f2f8fc"/>` + T(16, 22, "LUMEN OF THE ILEUM", { s: 12, w: 700, a: "start" });
    // stage 1: micelles in the lumen
    s += g(1, micelle(90, 90) + micelle(170, 70) + micelle(250, 98) + T(170, 132, "1 micelles: bile salts + monoglycerides + fatty acids", { s: 10.5, w: 700, c: NAVY }));
    // stage 2: products released near the membrane, diffuse through the bilayer
    // epithelial cell
    s += `<rect x="0" y="${bot}" width="${W}" height="${H - bot}" fill="#fbf7ee"/>`;
    s += `<rect x="40" y="${top}" width="680" height="${bot - top}" fill="#e9f5f2" stroke="${TEAL}" stroke-width="3"/>`;
    let mv = ""; for (let x = 44; x < 716; x += 26) mv += `M${x} ${top} v -22 a 6 6 0 0 1 12 0 v 22 `; s += `<path d="${mv}" fill="#e9f5f2" stroke="${TEAL}" stroke-width="2"/>`;
    s += T(60, top + 22, "EPITHELIAL CELL", { s: 11, w: 700, c: TEAL, a: "start" });
    s += g(2, micelle(420, 100) + fa(470, 112) + `${L(500, 120, 520, top + 30, { c: AMBER, w: 2, m: "la" })}${L(460, 126, 468, top + 30, { c: AMBER, w: 2, m: "la" })}` + T(580, 60, "2 near the membrane the micelle", { s: 10.5, w: 700, c: AMBER, a: "start" }) + T(580, 74, "releases monoglycerides and", { s: 10.5, w: 700, c: AMBER, a: "start" }) + T(580, 88, "fatty acids; being lipid-soluble", { s: 10.5, w: 700, c: AMBER, a: "start" }) + T(580, 102, "they DIFFUSE through the", { s: 10.5, w: 700, c: AMBER, a: "start" }) + T(580, 116, "phospholipid bilayer", { s: 10.5, w: 700, c: AMBER, a: "start" }));
    s += T(560, 134, "bile salts stay in the lumen", { s: 9.5, c: GREY, a: "start" });
    // stage 3: smooth ER re-forms triglycerides
    s += g(3, `${P("M420 220 q 25 -14 50 0 t 50 0 t 50 0", { c: "#7a8fb0", w: 3 })}${P("M420 238 q 25 -14 50 0 t 50 0 t 50 0", { c: "#7a8fb0", w: 3 })}${P("M420 256 q 25 -14 50 0 t 50 0 t 50 0", { c: "#7a8fb0", w: 3 })}` + T(500, 284, "3 smooth ER: triglycerides re-formed", { s: 10.5, w: 700, c: "#4d6386" }) + T(500, 298, "by condensation (supporting)", { s: 10, c: GREY }));
    // stage 4: Golgi: triglycerides + proteins (and cholesterol, phospholipids) → chylomicrons
    s += g(4, `${[0, 1, 2, 3].map((k) => P(`M${250 + k * 2} ${300 + k * 12} q 40 -10 80 0`, { c: PLUM, w: 3 })).join("")}` + chylo(345, 290, 8) + vesicle(372, 332, 8) + T(290, 370, "4 chylomicrons: triglycerides + proteins", { s: 10.5, w: 700, c: PLUM }) + T(290, 384, "(packaged in the Golgi apparatus: supporting)", { s: 10, c: GREY }) + L(420, 250, 340, 300, { c: "#7a8fb0", w: 1.5, m: "la", d: "4 3" }));
    // stage 5: vesicles move to the basal/lateral membrane and leave by exocytosis into the lacteal
    s += g(5, vesicle(470, 360) + vesicle(520, 395) + `<path d="M590 ${bot} a 16 16 0 0 1 32 0" fill="none" stroke="${TEAL}" stroke-width="3"/>` + chylo(606, bot + 12) + L(540, 404, 588, 420, { c: PLUM, w: 2, m: "lp" }) + T(560, 330, "5 exocytosis: vesicles", { s: 10.5, w: 700, c: PLUM, a: "start" }) + T(560, 344, "carrying chylomicrons fuse", { s: 10, c: GREY, a: "start" }) + T(560, 357, "with the cell-surface membrane", { s: 10, c: GREY, a: "start" }));
    // below: lacteal and capillary
    s += g(6, `<rect x="420" y="${bot + 40}" width="300" height="56" rx="28" fill="#fdf6cf" stroke="#b5952c" stroke-width="2.5"/>` + chylo(480, bot + 68) + chylo(530, bot + 62) + chylo(600, bot + 72) + T(570, bot + 114, "6 LACTEAL (lymph): chylomicrons are too large to", { s: 10.5, w: 700, c: "#8a6f1a" }) + T(570, bot + 128, "enter the capillaries; lymph later drains into the blood", { s: 10, c: GREY }));
    s += `<rect x="40" y="${bot + 40}" width="320" height="44" rx="22" fill="#f6dede" stroke="${ROSE}" stroke-width="2"/>` + T(200, bot + 67, "blood capillary", { s: 10, c: ROSE, w: 700 });
    s += T(380, H - 6, "Schematic, not to scale: a micelle is a few nanometres across; chylomicrons are far larger (tens to hundreds of nanometres).", { s: 9.5, c: GREY });
    return s + "</svg>";
  }

  // =====================================================================================================
  // Co-transport model (illustrative, arbitrary units; documented for the simulator and the fixer report).
  // Revised 2026-11-05 after independent QA (finding S1): co-transport now depends on the Na⁺ gradient AND has a
  // thermodynamic limit, so without the pump the cell cannot take up glucose against its gradient.
  //   Na_L lumen Na⁺ = 140 (or 0 when removed); Na_T tissue-fluid Na⁺ = 140 (always); Na_C cell Na⁺ starts 15.
  //   Glucose: G_L lumen (20 at the start; a meal adds 20), G_C cell (starts 8), G_B blood fixed at 5.
  //   Pump          P  = kP · Na_C³/(Na_C³ + 20³)   only with the pump on AND ATP available (3 Na⁺ out per cycle;
  //                                                 the cube reflects the 3 Na⁺ binding sites, so the pump slows
  //                                                 sharply as cell Na⁺ falls)
  //   Co-transport  J  = kC · (Na_L − Na_C)/140 · G_L/(G_L + 2) · max(0, 1 − Na_C·G_C / (Na_L·G_L)); 0 if Na_L = 0
  //                 (1 Na⁺ with each glucose. The last factor is the thermodynamic limit: the Na⁺ gradient can hold
  //                 G_C/G_L at most Na_L/Na_C, so with no Na⁺ gradient no glucose is moved against its gradient.)
  //   Na⁺ leak      Lk = kL · max(0, Na_L − Na_C)/140 + kB · max(0, Na_T − Na_C)/140 (lumen side and tissue-fluid
  //                 side; the tissue-fluid leak is why cell Na⁺ settles near 11, not 0, when lumen Na⁺ is removed)
  //   Apical facilitated diffusion  A = kA · max(0, G_L − G_C)   (release review R5-11: kA = 0, so glucose enters only
  //                                 by co-transport, the route the specification teaches; the term is kept for clarity)
  //   Basal facilitated diffusion   F = kF · (G_C − G_B)         (sign gives direction; carriers work either way)
  //   Per step (4 Euler sub-steps of 0.25): ΔNa_C = J + Lk − 3P;  ΔG_C = J + A − F;  ΔG_L = −v·(J + A), v = 0.2
  //   Results from init(20) with kA = 0 are checked by the simulator's own messages; with no lumen Na⁺ nothing is
  //   absorbed, and with the pump stopped uptake falls to almost nothing once cell Na⁺ approaches the lumen value.
  // =====================================================================================================
  const digestModel = {
    K: { kP: 10.4, KP: 20, kC: 3.2, kL: 1.8, kB: 5, kA: 0, kF: 0.5, v: 0.2, NaT: 140, sub: 4 },
    init: (gL = 20) => ({ NaL: 140, NaC: 15, GL: gL, GC: 8, GB: 5, t: 0, absorbed: 0, against: 0 }),
    step(st, { pumpOn = true, atp = true } = {}) {
      const k = digestModel.K, s = { ...st }, dt = 1 / k.sub; const f = { pump: 0, co: 0, fd: 0, fa: 0, leak: 0 };
      for (let i = 0; i < k.sub; i++) {
        const P = pumpOn && atp ? (k.kP * s.NaC ** 3) / (s.NaC ** 3 + k.KP ** 3) : 0;
        const drive = s.NaL > 0 && s.GL > 0 ? Math.max(0, 1 - (s.NaC * s.GC) / (s.NaL * s.GL)) : 0;
        const J = s.NaL > 0 ? k.kC * Math.max(0, (s.NaL - s.NaC) / 140) * (s.GL / (s.GL + 2)) * drive : 0;
        const Lk = (k.kL * Math.max(0, s.NaL - s.NaC)) / 140 + (k.kB * Math.max(0, k.NaT - s.NaC)) / 140;
        const A = k.kA * Math.max(0, s.GL - s.GC);
        const F = k.kF * (s.GC - s.GB);
        const up = k.v * (J + A) * dt;
        if (s.GL < s.GC) s.against += k.v * J * dt; // glucose taken up while the lumen is below the cell
        s.NaC = Math.min(Math.max(s.NaL, k.NaT), Math.max(0, s.NaC + (J + Lk - 3 * P) * dt));
        s.GC = Math.max(0, s.GC + (J + A - F) * dt);
        s.GL = Math.max(0, s.GL - up); s.absorbed += up;
        f.pump += P * dt; f.co += J * dt; f.fd += F * dt; f.fa += A * dt; f.leak += Lk * dt;
      }
      s.t += 1;
      return { st: s, flux: f };
    },
  };

  // Figure d-3.2.2.3-2 (Phase 4 Batch 5): OpenStax "2418 Histology Small Intestines" panel (a), middle and right parts
  // (assets/img/ileum-villi-openstax.jpg: CC BY 3.0; cropped to x 386–1079, y 0–480 of the 1079 × 824 original and
  // enlarged ×2; all its English labels removed; the two duodenal (Brunner's) glands and their leader painted out because
  // they belong to the duodenum, not the ileum; the muscularis mucosae leader painted out). Overlay coordinates are the
  // ORIGINAL image's pixels (the image is drawn at x 386, 693 × 480). Where a published leader line crossed the drawing it
  // was kept and our leader is drawn exactly over it: lacteal (550,26)→(477,77); capillary (735,57)→(628,57); arteriole
  // (735,85)→(650,85); goblet cell (735,112)→(685,112); crypt (735,249)→(553,249); lymph vessel (559,373) downwards; the
  // microvilli bracket (1010,86)→(1010,104), (979–1039,104), legs to y 126. Not to scale.
  function ileumPhoto() {
    uid(); const X0 = 276, W = 803, H = 482, SUB = "#46566a";
    const ld = (pts, dot = true) => { const d = "M" + pts.map((p) => p.join(" ")).join(" L"); const [ex, ey] = pts[pts.length - 1];
      return `<path d="${d}" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>${dot ? `<circle cx="${ex}" cy="${ey}" r="3.6" fill="${INK}" stroke="#fff" stroke-width="1.2"/>` : ""}`; };
    const lab = (x, y, lines, a = "start") => lines.map((l, i) => { const sup = l.startsWith("~"); const t = l.replace(/^~/, "");
      return `<text x="${x}" y="${y + i * 18}" text-anchor="${a}" font-size="${sup ? 15 : 17}" font-weight="${sup ? 500 : 800}" fill="${sup ? SUB : INK}" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${t}</text>`; }).join("");
    let s = `<svg viewBox="${X0} 0 ${W} ${H}" width="${W}" role="img" aria-label="Two villi of the ileum in section and one epithelial cell magnified. Each villus is a finger-like fold covered by a single layer of epithelial cells, some of them goblet cells. Inside each villus is a central lacteal and a network of blood capillaries between an arteriole and a venule. A crypt dips down between the villi. The lacteals join a lymph vessel below. The magnified epithelial cell has a brush border of microvilli on its surface facing the lumen and many mitochondria." font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" style="max-width:100%;min-width:${minW(W)}px;height:auto">`;
    s += `<rect x="${X0}" y="0" width="${W}" height="${H}" fill="#ffffff"/><image href="assets/img/ileum-villi-openstax.jpg" x="386" y="0" width="693" height="480"/>`;
    s += ld([[386, 99], [440, 99]]) + lab(380, 104, ["Villus"], "end");
    s += lab(300, 34, ["~Lumen"]);
    s += ld([[550, 26], [477, 77]]) + lab(521, 20, ["Lacteal"]);
    s += ld([[734, 27], [662, 27]]) + lab(740, 22, ["Epithelium", "one cell thick"]);
    s += ld([[735, 57], [637, 58]]) + lab(740, 63, ["Capillaries"]); // R5-33: the dot sits on a capillary joining the arteriole (red) to the venule (blue)
    s += ld([[735, 85], [650, 85]]) + lab(740, 90, ["~Arteriole"]);
    s += ld([[735, 112], [685, 112]]) + lab(740, 117, ["~Goblet cell"]);
    s += ld([[735, 249], [553, 249]]) + lab(740, 254, ["~Crypt"]);
    s += ld([[559, 437], [559, 373]]) + lab(559, 454, ["~Lymph vessel"], "middle");
    s += ld([[1010, 86], [1010, 104]], false) + ld([[979, 126], [979, 104], [1039, 104], [1039, 126]], false) + lab(1010, 64, ["Microvilli", "~(brush border)"], "middle");
    s += ld([[990, 372], [962, 324]]) + ld([[1010, 372], [1021, 332]]) + lab(1000, 390, ["~Mitochondria"], "middle") + lab(1000, 420, ["~One epithelial cell", "~(magnified)"], "middle");
    return s + "</svg>";
  }

  B.digestArt = { COTRANSPORT_CAPTION, DIG_CREDIT, minW, digestiveSystem, DIG_IMG, DIG_SHAPES, DIG_LABELS, carbDigestion, lipidDigestion, proteinDigestion, ileumWall, ileumPhoto, villus, epithelialCell, cotransport, lipidAbsorption, ASSESSED, NUMBERS, colours: { INK, GREY, TEAL, SAGE, NAVY, AMBER, ROSE, PLUM }, T, glyph: { hex, pent, bead, na, kk, glc, micelle, chylo, vesicle, bileSalt, tri, fa } };
  B.digestModel = digestModel;
})(window.BIO);
