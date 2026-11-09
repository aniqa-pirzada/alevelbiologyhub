// Original BL01-style practice paper B (Batch 9, owned by the paper B author)
// All questions, data, passages and figures are original to this platform. Where data are illustrative
// (not taken from a published study) the question says so. Not an official OxfordAQA paper.
window.BIO = window.BIO || {}; window.BIO.papers = window.BIO.papers || {};
(function () {
  const INK = "#16263a", GREY = "#5b6b7c", GRID = "#e3e9ef", FONT = "font-family=\"system-ui, -apple-system, Segoe UI, Roboto, sans-serif\"";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 13}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ""}${o.style ? ` font-style="${o.style}"` : ""}>${s}</text>`;
  const fig = (svg, cap) => `<figure class="figure"><div class="fig-view">${svg}</div><figcaption>${cap}</figcaption></figure>`;
  // Tables sit in a horizontally scrollable wrapper so that a wide table never widens the page on a phone.
  const tbl = (head, rows, cap) => `<figure class="figure"><div style="overflow-x:auto;max-width:100%"><table class="paper-table"><thead><tr>${head.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div><figcaption>${cap}</figcaption></figure>`;

  // ---------------- Figure 1: drawing from a TEM of part of a silk gland cell ----------------
  const fig1 = (() => {
    let s = `<svg viewBox="0 0 640 430" width="640" ${FONT} role="img" aria-label="Drawing made from a transmission electron micrograph of part of a silk gland cell. Structure A is a set of parallel membranes studded with dots. Structure B is a stack of curved flattened sacs with small vesicles at its edges. M is an oval organelle with folded inner membranes. Part of the nucleus is at the bottom left. A scale bar is at the bottom right.">`;
    s += `<rect x="0" y="0" width="640" height="430" fill="#fff"/>`;
    // lumen and apical plasma membrane with microvilli
    s += `<rect x="20" y="14" width="600" height="34" fill="#f4f7fa"/>` + T(320, 36, "lumen of silk gland", { s: 12, c: GREY, style: "italic" });
    let mv = "M20 62"; for (let x = 20; x < 620; x += 20) mv += ` L${x + 4} 62 L${x + 4} 50 Q${x + 8} 45 ${x + 12} 50 L${x + 12} 62 L${x + 20} 62`;
    s += `<path d="${mv}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    // secretory vesicles near the apical membrane
    [[120, 84], [175, 92], [250, 82], [330, 90], [395, 80], [545, 88], [590, 82], [455, 96]].forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="${i % 2 ? 9 : 11}" fill="#e6e9ee" stroke="${INK}" stroke-width="1.6"/>`; });
    // RER: parallel pairs of membranes studded with ribosomes (A)
    for (let k = 0; k < 5; k++) {
      const y = 132 + k * 30, x1 = 46, x2 = 330;
      const top = `M${x1} ${y} C ${x1 + 90} ${y - 10}, ${x2 - 110} ${y + 10}, ${x2} ${y - 2}`;
      const bot = `M${x1} ${y + 9} C ${x1 + 90} ${y - 1}, ${x2 - 110} ${y + 19}, ${x2} ${y + 7}`;
      s += `<path d="${top}" fill="none" stroke="${INK}" stroke-width="1.6"/><path d="${bot}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
      for (let x = x1 + 6; x < x2; x += 11) {
        const t = (x - x1) / (x2 - x1);
        const yy = y + 2 * (1 - t) * (1 - t) * t * 0 + (-10 * 3 * t * (1 - t) * (1 - t) + 10 * 3 * t * t * (1 - t) - 2 * t * t * t) * 1;
        s += `<circle cx="${x}" cy="${(yy - 3.2).toFixed(1)}" r="2.2" fill="${INK}"/><circle cx="${x + 5}" cy="${(yy + 12.4).toFixed(1)}" r="2.2" fill="${INK}"/>`;
      }
    }
    // free ribosomes in the cytoplasm
    [[360, 140], [372, 168], [352, 200], [380, 232], [362, 262], [400, 150], [55, 290], [80, 300], [330, 300], [345, 330]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="2.2" fill="${INK}"/>`; });
    // Golgi apparatus (B)
    for (let k = 0; k < 5; k++) { const y = 130 + k * 12; s += `<path d="M440 ${y + 10} Q500 ${y - 12} 560 ${y + 10}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`; }
    [[432, 132], [568, 134], [436, 196], [566, 198], [500, 112], [520, 208]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="5" fill="#e6e9ee" stroke="${INK}" stroke-width="1.4"/>`; });
    // mitochondria (M and two others)
    const mito = (cx, cy, rx, ry, rot) => {
      let m = `<g transform="rotate(${rot} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f4f1e8" stroke="${INK}" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - 4}" ry="${ry - 4}" fill="none" stroke="${INK}" stroke-width="1"/>`;
      for (let x = cx - rx + 12; x < cx + rx - 8; x += 12) m += `<path d="M${x} ${cy + ry - 4} L${x} ${cy - 1} Q${x + 3} ${cy - 5} ${x + 6} ${cy - 1}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
      return m + `</g>`;
    };
    s += mito(470, 300, 45, 16, 0) + mito(580, 260, 26, 13, -30) + mito(420, 372, 28, 13, 15);
    // part of the nucleus (bottom left) with double envelope and pores
    s += `<path d="M20 430 L20 330 Q140 268 290 352 L290 430" fill="#eef1f6" stroke="none"/>`;
    s += `<path d="M20 330 Q140 268 290 352" fill="none" stroke="${INK}" stroke-width="2"/><path d="M20 338 Q140 277 290 360" fill="none" stroke="${INK}" stroke-width="2"/>`;
    [70, 130, 190, 245].forEach((x) => { const t = (x - 20) / 270; const y = (1 - t) * (1 - t) * 334 + 2 * (1 - t) * t * 272.5 + t * t * 356; s += `<rect x="${x - 3}" y="${(y - 6).toFixed(1)}" width="6" height="12" fill="#fff"/>`; });
    [[60, 380], [95, 365], [150, 395], [210, 380], [250, 405], [120, 415], [180, 360]].forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="${4 + (i % 3)}" fill="#c4cbd6"/>`; });
    // labels
    const lab = (lx, ly, x2, y2, t) => `<line x1="${lx}" y1="${ly}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="1.2"/>` + T(lx + (lx < x2 ? -10 : 10), ly + 5, t, { s: 16, w: 700 });
    s += lab(30, 112, 70, 133, "A") + lab(610, 152, 560, 150, "B") + lab(470, 352, 470, 316, "");
    s += T(470, 364, "M", { s: 16, w: 700 });
    // scale bar: 120 units represents 2 µm (mitochondrion M is 90 units long)
    s += `<line x1="480" y1="404" x2="600" y2="404" stroke="${INK}" stroke-width="4"/>` + T(540, 422, "2 µm", { s: 13, w: 600 });
    return s + `</svg>`;
  })();

  // ---------------- Figure 2 (Question 02): two lipids from sesame seeds ----------------
  // Glycerol and the ester or phosphate links are written as atoms; each fatty acid chain is a carbon skeleton
  // (every corner and end of the zigzag is a carbon atom, hydrogens omitted; a double line is a C=C double bond).
  // Segment k joins carbon k to carbon k + 1, where carbon 1 is the carbonyl carbon: palmitic acid (16 C) has
  // 15 segments; oleic acid (18 C, C=C at 9) has 17 with a double bond on segment 9; linoleic acid (18 C, C=C at
  // 9 and 12) has 17 with double bonds on segments 9 and 12. Each C=C bends the chain by 30° (a schematic cis kink).
  const figLipids = (() => {
    const L = 14;
    const chain = (x0, y0, n, dbs, turn) => {
      let x = x0, y = y0, head = 0, d = `M${x0} ${y0}`, extra = "";
      for (let k = 1; k <= n; k++) {
        const ang = head + (k % 2 ? -30 : 30), r = (ang * Math.PI) / 180;
        const nx = x + L * Math.cos(r), ny = y + L * Math.sin(r);
        d += ` L${nx.toFixed(1)} ${ny.toFixed(1)}`;
        if (dbs.includes(k)) {
          const o = k % 2 ? 5 : -5, ox = -Math.sin(r) * o, oy = Math.cos(r) * o;
          const ax = x + (nx - x) * 0.1 + ox, ay = y + (ny - y) * 0.1 + oy, bx = x + (nx - x) * 0.9 + ox, by = y + (ny - y) * 0.9 + oy;
          extra += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
          const mx = (x + nx) / 2 - Math.sin(r) * -o * 3.2, my = (y + ny) / 2 + Math.cos(r) * -o * 3.2 + 4;
          extra += T(mx.toFixed(1), my.toFixed(1), "C=C", { s: 11, w: 700, c: "#a5531c" });
          head += 30 * turn;
        }
        x = nx; y = ny;
      }
      return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` + extra;
    };
    const glyC = (y, t) => T(52, y + 5, t, { s: 15, a: "end" });
    const ester = (y) => `<line x1="55" y1="${y}" x2="65" y2="${y}" stroke="${INK}" stroke-width="2"/>` + T(73, y + 5, "O", { s: 15 }) +
      `<line x1="81" y1="${y}" x2="92" y2="${y}" stroke="${INK}" stroke-width="2"/>` + T(100, y + 5, "C", { s: 15 }) +
      `<line x1="97" y1="${y + 9}" x2="97" y2="${y + 22}" stroke="${INK}" stroke-width="2"/><line x1="103" y1="${y + 9}" x2="103" y2="${y + 22}" stroke="${INK}" stroke-width="2"/>` + T(100, y + 37, "O", { s: 15 });
    const vbond = (y1, y2) => `<line x1="40" y1="${y1}" x2="40" y2="${y2}" stroke="${INK}" stroke-width="2"/>`;
    let s = `<svg viewBox="0 0 360 590" width="360" ${FONT} role="img" aria-label="Structural formulas of two lipid molecules from sesame seeds. Molecule P: a glycerol backbone whose three carbons are each joined through an oxygen atom to the carbon of a C=O group at the start of a fatty acid chain. The bond labelled X is the bond between this oxygen and the C=O carbon in the top chain (an ester bond). Top chain: 16 carbon atoms, no carbon-carbon double bonds, straight zigzag. Middle chain: 18 carbon atoms with one C=C double bond, where the chain bends. Bottom chain: 18 carbon atoms with two C=C double bonds, bending at each. Molecule Q: a glycerol backbone joined to two fatty acid chains in the same way (top: 16 carbon atoms, no double bonds; middle: 18 carbon atoms, one C=C double bond) and, on the third carbon, joined through an oxygen atom to a phosphate-containing group.">`;
    s += `<rect x="0" y="0" width="360" height="590" fill="#fff"/>`;
    // Molecule P
    s += T(350, 22, "Molecule P", { s: 15, w: 700, a: "end" });
    [50, 130, 210].forEach((y, i) => { s += glyC(y, i === 1 ? "HC" : "H₂C") + ester(y); });
    s += vbond(59, 121) + vbond(139, 201);
    s += chain(108, 50, 15, [], 1) + chain(108, 130, 17, [9], -1) + chain(108, 210, 17, [9, 12], 1);
    s += `<rect x="63" y="34" width="46" height="60" rx="6" fill="none" stroke="#a5531c" stroke-width="1.6" stroke-dasharray="5 3"/>` + T(86, 26, "X", { s: 16, w: 700, c: "#a5531c" });
    // divider
    s += `<line x1="10" y1="318" x2="350" y2="318" stroke="${GRID}" stroke-width="1.5"/>`;
    // Molecule Q
    s += T(350, 342, "Molecule Q", { s: 15, w: 700, a: "end" });
    [372, 452, 532].forEach((y, i) => { s += glyC(y, i === 1 ? "HC" : "H₂C"); if (i < 2) s += ester(y); });
    s += vbond(381, 443) + vbond(461, 523);
    s += chain(108, 372, 15, [], 1) + chain(108, 452, 17, [9], -1);
    s += `<line x1="55" y1="532" x2="65" y2="532" stroke="${INK}" stroke-width="2"/>` + T(73, 537, "O", { s: 15 }) + `<line x1="81" y1="532" x2="94" y2="532" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="94" y="516" width="196" height="32" rx="16" fill="#eef1f6" stroke="${INK}" stroke-width="1.6"/>` + T(192, 537, "phosphate-containing group", { s: 14, w: 600 });
    return s + `</svg>`;
  })();

  // ---------------- Figure 4 (Question 05): RP2 percentage change in mass against sucrose concentration ----------------
  // All six results (0.00 to 0.80 mol dm⁻³) are plotted, joined by straight lines. The viewBox is narrower than the
  // rendered width and the labels are large so that they stay legible at phone width.
  const rp2 = [[0, 11.8], [0.1, 7.6], [0.2, 3.5], [0.4, -4.0], [0.6, -10.6], [0.8, -15.0]];
  const figRP2 = (() => {
    const X0 = 80, X1 = 452, Y0 = 18, Y1 = 298, xmax = 0.8, ytop = 14, ybot = -16;
    const px = (c) => X0 + (c / xmax) * (X1 - X0), py = (v) => Y0 + ((ytop - v) / (ytop - ybot)) * (Y1 - Y0);
    let s = `<svg viewBox="0 0 470 372" width="560" ${FONT} role="img" aria-label="Line graph of percentage change in mass of turnip cylinders against concentration of sucrose solution from 0 to 0.8 mol per dm cubed. Points: plus 11.8 per cent at 0, plus 7.6 at 0.1, plus 3.5 at 0.2, minus 4.0 at 0.4, minus 10.6 at 0.6 and minus 15.0 at 0.8, joined by straight lines. The line crosses zero between 0.2 and 0.4, just below 0.3.">`;
    s += `<rect x="0" y="0" width="470" height="372" fill="#fff"/>`;
    for (let k = 0; k <= 40; k++) { const c = k * 0.02; s += `<line x1="${px(c).toFixed(1)}" y1="${Y0}" x2="${px(c).toFixed(1)}" y2="${Y1}" stroke="${GRID}" stroke-width="${k % 5 === 0 ? 1.3 : 0.6}"/>`; }
    for (let v = ybot; v <= ytop; v += 1) s += `<line x1="${X0}" y1="${py(v).toFixed(1)}" x2="${X1}" y2="${py(v).toFixed(1)}" stroke="${GRID}" stroke-width="${v % 2 === 0 ? 1.3 : 0.6}"/>`;
    s += `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<line x1="${X0}" y1="${py(0)}" x2="${X1}" y2="${py(0)}" stroke="${INK}" stroke-width="1.6"/>`;
    for (let k = 0; k <= 8; k++) { const c = k / 10; s += `<line x1="${px(c)}" y1="${Y1}" x2="${px(c)}" y2="${Y1 + 6}" stroke="${INK}"/>` + T(px(c), Y1 + 24, c.toFixed(1), { s: 16 }); }
    for (let v = ybot; v <= ytop; v += 4) s += `<line x1="${X0 - 6}" y1="${py(v)}" x2="${X0}" y2="${py(v)}" stroke="${INK}"/>` + T(X0 - 10, py(v) + 6, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v), { s: 17, a: "end" });
    s += T((X0 + X1) / 2, 356, "Concentration of sucrose solution / mol dm⁻³", { s: 17, w: 600 });
    s += T(20, (Y0 + Y1) / 2, "Percentage change in mass / %", { s: 17, w: 600, rot: -90 });
    s += `<polyline points="${rp2.map(([c, v]) => `${px(c).toFixed(1)},${py(v).toFixed(1)}`).join(" ")}" fill="none" stroke="#1e3a5f" stroke-width="2.2"/>`;
    rp2.forEach(([c, v]) => { const x = px(c), y = py(v); s += `<line x1="${x - 6}" y1="${y - 6}" x2="${x + 6}" y2="${y + 6}" stroke="#1e3a5f" stroke-width="2.4"/><line x1="${x - 6}" y1="${y + 6}" x2="${x + 6}" y2="${y - 6}" stroke="#1e3a5f" stroke-width="2.4"/>`; });
    return s + `</svg>`;
  })();

  // ---------------- Figure 5 (Question 07): a cell of Haplopappus gracilis (2n = 4) at metaphase I ----------------
  // Each chromosome is two chromatids joined at a centromere (a light bar with an outline, so that it is visible on
  // shaded and unshaded chromosomes alike). Filled = inherited from the female parent; unfilled =
  // from the male parent. The two bivalents are oriented in opposite ways (filled to the left for the long pair,
  // filled to the right for the short pair). Each homologue's centromere is attached by spindle fibres to one pole.
  const figMeiosis = (() => {
    const DARK = "#1e3a5f";
    let s = `<svg viewBox="0 0 400 350" width="400" ${FONT} role="img" aria-label="Drawing of a cell from an anther of Haplopappus gracilis, which has four chromosomes in each body cell, at one stage of meiosis. There is a spindle with a pole at the left and a pole at the right, and a dashed line marks the equator. The four chromosomes are arranged as two pairs of homologous chromosomes, one long pair and one short pair. The two chromosomes of each pair lie side by side, one on each side of the equator, and each chromosome is made of two chromatids joined at a centromere. Spindle fibres attach the centromere of each chromosome to the pole on its own side. In each pair, one chromosome is shaded (inherited from the female parent) and one is unshaded (inherited from the male parent). In the long pair the shaded chromosome faces the left pole; in the short pair the shaded chromosome faces the right pole.">`;
    s += `<rect x="0" y="0" width="400" height="350" fill="#fff"/>`;
    s += `<ellipse cx="200" cy="160" rx="188" ry="126" fill="#fbfaf6" stroke="${INK}" stroke-width="2"/>`;
    const PL = [42, 160], PR = [358, 160];
    // faint pole-to-pole fibres
    [-60, -30, 30, 60].forEach((b) => { s += `<path d="M${PL[0]} ${PL[1]} Q200 ${160 + b * 1.6} ${PR[0]} ${PR[1]}" fill="none" stroke="#b9c3cf" stroke-width="1"/>`; });
    s += `<line x1="200" y1="44" x2="200" y2="276" stroke="${GREY}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
    const chromo = (x, cy, h, filled) => {
      const f = filled ? DARK : "#fff";
      return `<rect x="${x}" y="${cy - h / 2}" width="9" height="${h}" rx="4.5" fill="${f}" stroke="${DARK}" stroke-width="2"/><rect x="${x + 10}" y="${cy - h / 2}" width="9" height="${h}" rx="4.5" fill="${f}" stroke="${DARK}" stroke-width="2"/>` +
        // centromere: a light bar joining the two chromatids, drawn the same way on shaded and unshaded chromosomes
        `<rect x="${x + 5}" y="${cy - 4}" width="9" height="8" rx="2" fill="#f2c94c" stroke="${DARK}" stroke-width="1.5"/>`;
    };
    const fibres = (xFrom, cy, P) => [-3, 0, 3].map((d) => `<line x1="${xFrom}" y1="${cy + d}" x2="${P[0]}" y2="${P[1]}" stroke="${GREY}" stroke-width="1.2"/>`).join("");
    // long pair: centre y 105; short pair: centre y 218
    s += fibres(176, 105, PL) + fibres(224, 105, PR) + fibres(176, 218, PL) + fibres(224, 218, PR);
    s += chromo(176, 105, 76, true) + chromo(205, 105, 76, false);
    s += chromo(176, 218, 42, false) + chromo(205, 218, 42, true);
    s += `<circle cx="${PL[0]}" cy="${PL[1]}" r="4" fill="${INK}"/><circle cx="${PR[0]}" cy="${PR[1]}" r="4" fill="${INK}"/>`;
    s += T(200, 30, "equator", { s: 14, w: 600 }) + T(56, 190, "pole", { s: 14, w: 600 }) + T(344, 190, "pole", { s: 14, w: 600 });
    s += `<line x1="112" y1="248" x2="122" y2="196" stroke="${INK}" stroke-width="1.1"/>` + T(112, 264, "spindle fibres", { s: 14, w: 600 });
    // legend
    s += `<rect x="40" y="304" width="9" height="22" rx="4.5" fill="${DARK}" stroke="${DARK}" stroke-width="2"/>` + T(58, 320, "from the female parent", { s: 14, a: "start" });
    s += `<rect x="220" y="304" width="9" height="22" rx="4.5" fill="#fff" stroke="${DARK}" stroke-width="2"/>` + T(238, 320, "from the male parent", { s: 14, a: "start" });
    return s + `</svg>`;
  })();

  // ---------------- Figure 6 (Question 09): frequency polygons of date fruit mass ----------------
  const farmA = { 8: 1, 9: 6, 10: 19, 11: 31, 12: 27, 13: 12, 14: 3, 15: 1 };
  const farmB = { 3: 1, 4: 2, 5: 4, 6: 7, 7: 12, 8: 15, 9: 16, 10: 15, 11: 12, 12: 8, 13: 5, 14: 2, 15: 1 };
  const fig3 = (() => {
    const X0 = 80, X1 = 560, Y0 = 56, Y1 = 320, xmin = 2, xmax = 18, ymax = 35;
    const px = (m) => X0 + ((m - xmin) / (xmax - xmin)) * (X1 - X0), py = (n) => Y1 - (n / ymax) * (Y1 - Y0);
    let s = `<svg viewBox="0 0 600 395" width="600" ${FONT} role="img" aria-label="Frequency polygons of the mass of 100 date fruits from each of two farms. Farm A, solid line with circles, is narrow and tall with a peak of 31 fruits in the 11 to 12 gram class. Farm B, dashed line with squares, is wider and lower with a peak of 16 fruits in the 9 to 10 gram class.">`;
    s += `<rect x="0" y="0" width="600" height="395" fill="#fff"/>`;
    for (let m = xmin; m <= xmax; m++) s += `<line x1="${px(m)}" y1="${Y0}" x2="${px(m)}" y2="${Y1}" stroke="${GRID}"/>`;
    for (let n = 0; n <= ymax; n += 5) s += `<line x1="${X0}" y1="${py(n)}" x2="${X1}" y2="${py(n)}" stroke="${GRID}"/>` + `<line x1="${X0 - 5}" y1="${py(n)}" x2="${X0}" y2="${py(n)}" stroke="${INK}"/>` + T(X0 - 9, py(n) + 6, n, { s: 17, a: "end" });
    s += `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
    for (let m = xmin; m <= xmax; m += 2) s += `<line x1="${px(m)}" y1="${Y1}" x2="${px(m)}" y2="${Y1 + 5}" stroke="${INK}"/>` + T(px(m), Y1 + 24, m, { s: 17 });
    s += T((X0 + X1) / 2, 378, "Mass of fruit / g", { s: 17, w: 600 });
    s += T(24, (Y0 + Y1) / 2, "Number of fruits", { s: 17, w: 600, rot: -90 });
    const pts = (D, lo, hi) => { const a = []; for (let k = lo; k <= hi; k++) a.push([k + 0.5, D[k] || 0]); return a; };
    const A = pts(farmA, 7, 16), Bp = pts(farmB, 2, 16);
    s += `<polyline points="${Bp.map(([m, n]) => `${px(m).toFixed(1)},${py(n).toFixed(1)}`).join(" ")}" fill="none" stroke="#a5531c" stroke-width="2" stroke-dasharray="7 5"/>`;
    Bp.forEach(([m, n]) => { s += `<rect x="${(px(m) - 4).toFixed(1)}" y="${(py(n) - 4).toFixed(1)}" width="8" height="8" fill="#fff" stroke="#a5531c" stroke-width="2"/>`; });
    s += `<polyline points="${A.map(([m, n]) => `${px(m).toFixed(1)},${py(n).toFixed(1)}`).join(" ")}" fill="none" stroke="#1e3a5f" stroke-width="2.2"/>`;
    A.forEach(([m, n]) => { s += `<circle cx="${px(m).toFixed(1)}" cy="${py(n).toFixed(1)}" r="4.5" fill="#1e3a5f"/>`; });
    // legend in the top margin, above the plot area (clear of both curves)
    s += `<line x1="84" y1="24" x2="118" y2="24" stroke="#1e3a5f" stroke-width="2.2"/><circle cx="101" cy="24" r="4.5" fill="#1e3a5f"/>` + T(126, 29, "Farm A (drip irrigation)", { s: 15, a: "start" });
    s += `<line x1="334" y1="24" x2="368" y2="24" stroke="#a5531c" stroke-width="2" stroke-dasharray="7 5"/><rect x="347" y="20" width="8" height="8" fill="#fff" stroke="#a5531c" stroke-width="2"/>` + T(376, 29, "Farm B (flood irrigation)", { s: 15, a: "start" });
    return s + `</svg>`;
  })();

  // ---------------- Comprehension passage ----------------
  // Printed lines are separated by <br> inside paragraphs, so the runner numbers them (1, then every fifth line shown)
  // and gives every line a screen-reader "Line n" prefix. Lines are kept to 35 characters or fewer (non-breaking
  // spaces keep values with their units) so that each printed line also fits on one screen line at 390 px.
  // Line references in 11.1 to 11.5 count these lines (79 in all).
  const passageParas = [
    [
      "Along the sheltered lagoons and",
      "creeks of the United Arab Emirates",
      "grows one native mangrove, the grey",
      "mangrove, <em>Avicennia marina</em>. It is",
      "one of very few trees able to grow",
      "with its roots in seawater, and the",
      "water of the Arabian Gulf is",
      "saltier than most seawater. In",
      "summer the water around the roots",
      "can be warmer than 35\u00a0°C, and the",
      "air can be hotter than 45\u00a0°C.",
    ],
    [
      "Seawater in the Gulf has a water",
      "potential of about −3000\u00a0kPa. Most",
      "of the salt in the seawater never",
      "enters the tree: membranes of cells",
      "in the roots allow water to pass",
      "but prevent most of the sodium and",
      "chloride ions from entering the",
      "xylem. The root cells can still",
      "absorb water because they contain",
      "high concentrations of dissolved",
      "solutes.",
    ],
    [
      "Some salt does reach the leaves.",
      "There it is removed by salt glands,",
      "small groups of cells in the",
      "surface of the leaf. Cells in the",
      "salt glands move sodium and",
      "chloride ions out of the leaf",
      "against a concentration gradient.",
      "In electron micrographs these cells",
      "have dense cytoplasm containing",
      "many mitochondria. On hot",
      "afternoons, crystals of salt can be",
      "seen glittering on the leaves.",
    ],
    [
      "The mud in which the trees grow is",
      "waterlogged and contains very",
      "little oxygen, because bacteria in",
      "the mud use up the small amount",
      "that diffuses in from the water.",
      "The main roots of the grey mangrove",
      "spread out horizontally just below",
      "the surface of the mud. Hundreds of",
      "narrow, pencil-like roots called",
      "pneumatophores grow vertically",
      "upwards from them, out of the mud.",
      "At low tide the pneumatophores are",
      "exposed to the air. Their surface",
      "has many small pores called",
      "lenticels, and inside they contain",
      "a tissue with large air spaces that",
      "is continuous with the air spaces",
      "in the roots below the mud. A",
      "survey of mangrove shores in the",
      "Gulf found that the less oxygen the",
      "mud contained, the more",
      "pneumatophores the trees had.",
    ],
    [
      "The leaves of the grey mangrove are",
      "thick and have a waxy upper",
      "surface. The lower surface is",
      "covered by a dense layer of fine",
      "hairs, and most of the stomata are",
      "found on this lower surface,",
      "between the hairs.",
    ],
    [
      "Mangrove forests are important for",
      "coastal biodiversity. The tangle of",
      "roots provides shelter for young",
      "fish, crabs and shrimps, many of",
      "which later move out to seagrass",
      "beds and coral reefs. Herons and",
      "other birds feed in the mangroves,",
      "and insects feed on the leaves. In",
      "many parts of the world, mangroves",
      "have been cleared for coastal",
      "building, fish and shrimp ponds,",
      "and roads. In the UAE, large",
      "numbers of mangrove seedlings have",
      "been planted to restore and extend",
      "mangrove areas, and some mangrove",
      "areas are now protected.",
    ],
  ];
  const passage = passageParas.map((lines) => `<p>${lines.join("<br>")}</p>`).join("");

  // AO rule used for every part (OxfordAQA 9610 descriptors, specification section 4.3), with the teacher's ruling that
  // AO3 is never inferred merely because a graph, table or passage is present:
  //   AO1 knowledge and understanding: the credited answer is recall or explanation of specification content; a figure or
  //       context only names the item being asked about.
  //   AO2 application in familiar and novel contexts: the credit depends on using knowledge with the given information,
  //       including every calculation, every reading of a value that is then used, and every explanation of a new
  //       situation (a passage, a stated correlation or a context with data) that does not require the data to be
  //       described, analysed or evaluated.
  //   AO3 describe, analyse, interpret and evaluate scientific information presented in different forms: the credit is for
  //       describing a pattern in presented data (with figures), comparing data sets, interpreting results, or evaluating
  //       a conclusion or claim against the data and identifying limitations of that evidence.
  //   AO4 select, describe and evaluate scientific procedures: the credit is for describing, justifying, criticising,
  //       improving or comparing a method or technique (required practicals, biochemical tests, sampling).
  // A part whose marks fall under two AOs lists both, and is written so that one mark of a 2-mark part is earned under
  // each; marks then count equally to each.
  window.BIO.papers["bl01-b"] = {
    id: "bl01-b", unit: "3.1", code: "BL01", title: "Practice Paper B", status: "draft", minutes: 90, marks: 75,
    note: "Original platform paper written in the BL01 style. Not an official OxfordAQA paper. Paper B stands alone: it samples all eleven Unit 1 topics, two of the required practicals (RP1 and RP2) and the Unit 1 assessment-objective weightings, and it does not repeat the questions of Paper A.",
    aoTargets: { AO1: 30, AO2: 11, AO3: 19, AO4: 15 },
    aoTotals: { AO1: 30, AO2: 11, AO3: 19, AO4: 15 },
    topicMarks: { "3.1.1": 8, "3.1.2": 8, "3.1.3": 8, "3.1.4": 11, "3.1.5": 8, "3.1.6": 6, "3.1.7": 4, "3.1.8": 4, "3.1.9": 4, "3.1.10": 6, "3.1.11": 8 },
    practicalMarks: { RP1: 8, RP2: 7, RP3: 0 },
    questions: [
      // ======================= 01 Cells and microscopy =======================
      { num: "01", kind: "short", title: "Cells that secrete silk",
        intro: `<p>Silk is made mainly of the protein fibroin. In silkworm larvae (the caterpillars of the moth <em>Bombyx mori</em>), fibroin is made by cells that line part of a pair of silk glands and is secreted into the lumen of each gland.</p><p>Figure 1 is a drawing made from a transmission electron micrograph of part of one of these cells.</p>` + fig(fig1, "Figure 1. Part of a fibroin-secreting cell (drawing from a transmission electron micrograph). The lumen of the gland is at the top; part of the nucleus is at the bottom left."),
        parts: [
          { id: "p-bl01b-01-1", label: "01.1", ref: "3.1.2.1", stmts: ["3.1.2.1.s4", "3.1.2.1.s7"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Name the structures labelled <strong>A</strong> and <strong>B</strong> in Figure 1.",
            scheme: [{ point: "A: rough endoplasmic reticulum (accept RER; reject endoplasmic reticulum without 'rough'; reject smooth ER)", marks: 1 }, { point: "B: Golgi apparatus (accept Golgi body or Golgi complex)", marks: 1 }],
            model: "A is rough endoplasmic reticulum. B is the Golgi apparatus.",
            commonErrors: "Writing 'endoplasmic reticulum' without 'rough': the ribosomes on the membranes are the identifying feature. Calling the Golgi stack 'cristae' or 'thylakoids'." },
          { id: "p-bl01b-01-2", label: "01.2", ref: "3.1.2.1", stmts: ["3.1.2.1.s6"], ao: ["AO2"], type: "short", marks: 2,
            stem: "In the original micrograph the scale bar was 24 mm long and the image of mitochondrion <strong>M</strong> was 18 mm long.\nCalculate the actual length of mitochondrion <strong>M</strong>. Give your answer in µm.",
            scheme: [{ point: "Magnification = ×12 000 (24 000 µm ÷ 2 µm) OR correct ratio method shown (18 ÷ 24 × 2)", marks: 1 }, { point: "1.5 µm (correct answer with no working = 2 marks; 0.0015 mm or 1500 nm = 1 mark only, as the answer must be in µm)", marks: 1 }],
            model: "Magnification = image size ÷ actual size = 24 mm ÷ 2 µm = 24 000 µm ÷ 2 µm = ×12 000. Actual length of M = 18 mm ÷ 12 000 = 18 000 µm ÷ 12 000 = 1.5 µm. (Or: M is 18/24 of the scale bar, and 18/24 × 2 µm = 1.5 µm.)",
            commonErrors: "Not converting mm to µm (giving 0.0015). Inverting the formula (12 000 ÷ 18). Writing the magnification as 12 or 1 200 after a slip in unit conversion." },
          { id: "p-bl01b-01-3", label: "01.3", ref: "3.1.2.1", stmts: ["3.1.2.1.s4"], ao: ["AO1"], type: "short", marks: 2,
            stem: "These cells secrete large amounts of fibroin. Explain how structures <strong>A</strong> and <strong>B</strong> are involved in producing and secreting this protein.",
            scheme: [{ point: "A: ribosomes on the RER synthesise the protein / polypeptide, which the RER transports (in vesicles) to the Golgi (accept folds the protein)", marks: 1 }, { point: "B: Golgi modifies (and processes) the protein and packages it into (secretory) vesicles that fuse with the cell-surface membrane / release it by exocytosis", marks: 1 }],
            alternatives: "'Translation on ribosomes attached to the RER' for synthesis; 'vesicles move to the plasma membrane and release fibroin into the lumen' for secretion.",
            model: "Fibroin polypeptides are made by the ribosomes attached to the rough endoplasmic reticulum and pass into the RER, which transports them, in vesicles, to the Golgi apparatus. The Golgi apparatus modifies the protein and packages it into secretory vesicles, which move to the cell-surface membrane and fuse with it, releasing fibroin into the lumen.",
            commonErrors: "Saying the Golgi apparatus makes the protein. Describing lysosomes or digestion." },
          { id: "p-bl01b-01-4", label: "01.4", ref: "3.1.2.1", stmts: ["3.1.2.1.s1", "3.1.2.1.s2"], ao: ["AO1"], type: "short", marks: 2,
            stem: "The ribosomes on structure <strong>A</strong> can be seen in Figure 1, but they cannot be seen with an optical microscope.\nExplain why.",
            scheme: [{ point: "Resolution of an optical microscope is limited by the (long) wavelength of light (to about 0.2 µm)", marks: 1 }, { point: "Ribosomes are smaller than this / are about 20–30 nm so cannot be resolved (as separate objects)", marks: 1 }, { point: "Electrons have a shorter wavelength so the TEM has a higher resolution", marks: 1 }],
            alternatives: "Max 2. Ignore references to magnification unless resolution is also explained; 'the optical microscope cannot magnify enough' alone = 0.",
            model: "The resolution of an optical microscope is limited by the relatively long wavelength of light, to about 0.2 µm. Ribosomes are only about 20–30 nm across, so they cannot be resolved as separate objects. A beam of electrons has a much shorter wavelength, so the transmission electron microscope has a much higher resolution and the ribosomes can be distinguished.",
            commonErrors: "Answering only in terms of magnification. An optical image can be magnified further, but no extra detail appears because resolution is the limit." },
        ] },

      // ======================= 02 Biological molecules (lipids and protein) =======================
      { num: "02", kind: "short", title: "Oil and protein in sesame seeds",
        intro: `<p>Sesame seeds (from the plant <em>Sesamum indicum</em>) are ground to make tahini. About half of the mass of a seed is lipid and about one fifth is protein. Figure 2 shows two lipid molecules found in sesame seeds.</p>` +
          fig(figLipids, "Figure 2. Two lipids from sesame seeds. In each fatty acid chain, every corner and end of the zigzag line is a carbon atom; hydrogen atoms are not shown; a double line is a C=C double bond.") +
          tbl(["Fatty acid", "Number of carbon atoms", "Number of C=C double bonds", "Melting point / °C"], [["palmitic acid", "16", "0", "63"], ["stearic acid", "18", "0", "70"], ["oleic acid", "18", "1", "13"], ["linoleic acid", "18", "2", "−5"], ["linolenic acid", "18", "3", "−11"]], "Table 1. Melting points of some fatty acids (rounded to the nearest °C)."),
        parts: [
          { id: "p-bl01b-02-1", label: "02.1", ref: "3.1.1.3", stmts: ["3.1.1.3.s1", "3.1.1.1.s2"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Molecule <strong>P</strong> is formed from glycerol and fatty acids.\nName the type of bond labelled <strong>X</strong> in Figure 2, and give the number of water molecules produced when one molecule of <strong>P</strong> is formed.",
            scheme: [{ point: "X: ester bond (reject glycosidic or peptide bond)", marks: 1 }, { point: "3 (water molecules), one for each fatty acid joined to glycerol by condensation", marks: 1 }],
            model: "X is an ester bond. Three molecules of water are produced, because each of the three fatty acids is joined to glycerol by a condensation reaction that removes one molecule of water.",
            commonErrors: "Giving 1 water molecule for the whole triglyceride, or calling the bond a glycosidic bond." },
          { id: "p-bl01b-02-2", label: "02.2", ref: "3.1.1.3", stmts: ["3.1.1.3.s2", "3.1.1.3.s4"], ao: ["AO3"], type: "short", marks: 2,
            stem: "Molecule <strong>P</strong> is a typical triglyceride from sesame oil. Triglycerides made from fatty acids with lower melting points also have lower melting points.\nUse Figure 2 and Table 1 to suggest why sesame oil is a liquid at room temperature (20 °C).",
            scheme: [{ point: "Table 1: for fatty acids with the same number of carbon atoms (18), the melting point falls as the number of C=C double bonds increases / the unsaturated fatty acids melt below 20 °C and the saturated ones above it", marks: 1 }, { point: "Figure 2: two of the three fatty acids in P are unsaturated (one has one C=C, one has two; they match oleic and linoleic acid), so P / the oil has a melting point below 20 °C", marks: 1 }],
            alternatives: "For the first mark accept the structural explanation: C=C double bonds put bends (kinks) in the chains, so the molecules cannot pack closely together. The second mark needs the link to P's chains seen in Figure 2. Reject 'P has no saturated fatty acids' (its top chain is saturated).",
            model: "Table 1 shows that, for fatty acids with 18 carbon atoms, the more C=C double bonds there are, the lower the melting point: the unsaturated ones melt below 20 °C and the saturated ones well above it. In Figure 2, two of the three fatty acid chains in P contain C=C double bonds (one has one and one has two, like oleic and linoleic acid), so P has a low melting point, below room temperature, and the oil is liquid.",
            commonErrors: "Quoting a single melting point without describing the trend. Saying the oil is liquid because it contains no saturated fatty acids." },
          { id: "p-bl01b-02-3", label: "02.3", ref: "3.1.1.3", stmts: ["3.1.1.3.s3", "3.1.1.3.s4", "3.1.4.1.s1"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Molecule <strong>Q</strong> is a phospholipid. Explain how the structure of molecule <strong>Q</strong> allows phospholipids to form a bilayer in cell membranes.",
            scheme: [{ point: "The phosphate(-containing) group / head is hydrophilic (attracted to water)", marks: 1 }, { point: "The (two) fatty acid tails are hydrophobic, so in water the tails point inwards, away from the water, and the heads face the water on both sides (forming a bilayer)", marks: 1 }],
            alternatives: "Accept 'polar' for hydrophilic and 'non-polar' for hydrophobic. Reject 'the phosphate group is hydrophobic'.",
            model: "The phosphate-containing group is hydrophilic, so it is attracted to water, whereas the two fatty acid tails are hydrophobic. In water the phospholipids therefore form two layers with the tails pointing inwards, away from the water, and the hydrophilic heads facing the watery cytoplasm and tissue fluid on either side.",
            commonErrors: "Reversing hydrophilic and hydrophobic. Describing the tails as 'attracted to the inside of the cell'." },
          { id: "p-bl01b-02-4-r1", label: "02.4", ref: "3.1.1.4", stmts: ["3.1.1.4.s6"], ao: ["AO4"], type: "short", marks: 2,
            stem: "Describe how you could use the biuret test to show that ground sesame seeds contain protein.",
            scheme: [{ point: "Procedure: mix / shake the ground seeds with water (and filter or let the solids settle), then add biuret reagent to the liquid / add sodium hydroxide solution followed by (a few drops of) dilute copper(II) sulfate solution", marks: 1 }, { point: "Result: a purple / lilac / mauve colour shows protein is present (the reagent stays blue without protein; accept comparison with a control of water and biuret reagent, which stays blue)", marks: 1 }],
            alternatives: "Ignore warming. Reject heating in a boiling water bath as a required step (that belongs to the Benedict's test). Reject 'turns pink' alone.",
            model: "Shake some ground sesame seeds with water, let the solids settle and pour off the liquid. Add an equal volume of sodium hydroxide solution and then a few drops of dilute copper(II) sulfate solution (or add biuret reagent) and mix. A purple (lilac) colour shows that protein is present; a control of water with the reagents stays blue.",
            commonErrors: "Heating the mixture. Confusing the biuret result with the Benedict's colours." },
        ] },

      // ======================= 03 Protein synthesis =======================
      { num: "03", kind: "short", title: "From gene to polypeptide",
        intro: `<p>Figure 3 shows the base sequence of part of the template strand of a gene from a plant. Table 2 shows some mRNA codons and the amino acids they code for.</p>` +
          `<figure class="figure"><p style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.15rem;letter-spacing:.12em;text-align:center;margin:.4rem 0">TAC AAG CCT GTA ACC</p><figcaption>Figure 3. Part of the template strand of the gene (spaces are added between triplets only to help you read it).</figcaption></figure>` +
          tbl(["mRNA codon", "Amino acid", "mRNA codon", "Amino acid"], [["AAG", "Lys"], ["ACC", "Thr"], ["AUG", "Met"], ["CAU", "His"], ["CCU", "Pro"], ["GGA", "Gly"]].map((r, i) => r.concat([["GGG", "Gly"], ["GUA", "Val"], ["UAC", "Tyr"], ["UGG", "Trp"], ["UUC", "Phe"], ["UUU", "Phe"]][i])), "Table 2. Some mRNA codons and the amino acids they code for."),
        parts: [
          { id: "p-bl01b-03-1", label: "03.1", ref: "3.1.8.3", stmts: ["3.1.8.3.s3", "3.1.8.1.s1", "3.1.8.2.s1"], ao: ["AO2"], type: "short", marks: 2,
            stem: "Give the base sequence of the mRNA transcribed from the part of the template strand in Figure 3, and the sequence of amino acids it codes for.",
            scheme: [{ point: "mRNA: AUG UUC GGA CAU UGG (spaces not needed; reject any sequence containing T)", marks: 1 }, { point: "Met-Phe-Gly-His-Trp (allow correct translation of an incorrect mRNA sequence from the first mark: error carried forward)", marks: 1 }],
            model: "mRNA: AUG UUC GGA CAU UGG. Amino acids: Met-Phe-Gly-His-Trp.",
            commonErrors: "Reading the template strand as if it were the mRNA (changing T to U), which gives Tyr-Lys-Pro-Val-Thr. Writing T instead of U in the mRNA." },
          { id: "p-bl01b-03-2-r1", label: "03.2", ref: "3.1.7.2", stmts: ["3.1.7.2.s1"], ao: ["AO3"], type: "short", marks: 2,
            stem: `In the nucleus, the DNA of this gene is associated with proteins. Scientists isolated nuclei from cells of the plant. They treated two samples with an enzyme that cuts DNA only at places where no protein is bound to it:` +
              `<ul class="small"><li>sample 1: chromatin (the DNA together with its proteins)</li><li>sample 2: DNA from the same nuclei from which all the proteins had been removed.</li></ul>` +
              `The enzyme was allowed to act for only a short time, so it did not cut at every place it could. The scientists then measured the lengths of the DNA fragments.` +
              tbl(["Sample", "Lengths of the DNA fragments / base pairs"], [["1: chromatin", "almost all about 180, 360, 540, 720 or 900; fragments of other lengths were rare"], ["2: DNA with all proteins removed", "every length from about 50 to more than 2000; no length was more common than any other"]], "Table 3. Illustrative results.") +
              `A student concluded that, in chromatin, proteins are bound along the DNA at regular intervals.\nExplain how the results in Table 3 support this conclusion.`,
            scheme: [{ point: "Sample 1: the fragment lengths are all (whole-number) multiples of about 180 base pairs, so the enzyme cut only at places about 180 base pairs apart / the stretches of unprotected DNA are evenly spaced (with protein-protected DNA between them)", marks: 1 }, { point: "Sample 2: without proteins the DNA was cut at random places (fragments of every length), so the regular spacing in sample 1 is caused by the proteins, not by the DNA itself (sample 2 acts as a control)", marks: 1 }, { point: "The longer fragments in sample 1 (360, 540 and so on) are where one or more cutting places were missed in the short time, which is why every length is a multiple of 180", marks: 1 }],
            alternatives: "Max 2. At least one mark must use the fragment lengths in Table 3. Accept 'histones' for 'proteins'. Recall of DNA wound round histones with no reference to the results = 0.",
            model: "In sample 1 almost every fragment is a whole-number multiple of about 180 base pairs (180, 360, 540 and so on), so the enzyme could cut the DNA only at places about 180 base pairs apart; the DNA between these places must have been protected by bound protein, so the proteins are spaced regularly along the DNA. In sample 2, where the proteins had been removed, the DNA was cut at random and fragments of every length were produced. This control shows that the regular pattern in sample 1 is caused by the proteins and not by the DNA itself.",
            commonErrors: "Describing histones and chromosomes from memory without using the fragment lengths. Ignoring sample 2, which shows that the pattern depends on the proteins." },
          { id: "p-bl01b-03-3", label: "03.3", ref: "3.1.7.2", stmts: ["3.1.7.2.s5", "3.1.8.2.s2"], ao: ["AO1"], type: "short", marks: 2,
            stem: "In this plant, the pre-mRNA transcribed from the whole gene is 2860 nucleotides long. The mRNA that leaves the nucleus is 1630 nucleotides long.\nExplain the difference.",
            scheme: [{ point: "The gene contains introns / non-coding sequences (between the exons)", marks: 1 }, { point: "Pre-mRNA is spliced: the introns are removed (and the exons joined) to form mRNA", marks: 1 }],
            alternatives: "Accept 'base sequences copied from introns are removed'. Reject 'introns are removed from the DNA' or 'exons are removed'.",
            model: "The gene contains non-coding sequences called introns between the coding exons, and the pre-mRNA is a copy of the whole gene, including the introns. The pre-mRNA is then spliced: the sections copied from the introns are removed and the exons are joined, so the mRNA is shorter.",
            commonErrors: "Saying the introns are removed from the gene itself, or that the difference is due to the stop codon." },
          { id: "p-bl01b-03-4-r1", label: "03.4", ref: "3.1.8.2", stmts: ["3.1.8.2.s3"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Describe the role of tRNA and the role of ATP in translation.",
            scheme: [{ point: "tRNA: each tRNA carries a specific amino acid (to the ribosome) and has an anticodon that binds to the complementary codon on the mRNA, so amino acids are placed in the order set by the codons (either idea)", marks: 1 }, { point: "ATP: hydrolysis of ATP provides the energy to attach an amino acid to its tRNA OR provides the energy for (the formation of) peptide bonds between the amino acids / for joining the amino acids together", marks: 1 }],
            alternatives: "One mark for tRNA and one for ATP. For ATP, credit either energy to attach amino acids to tRNA or energy for peptide bond formation (the energy released from ATP is held in the bond between the amino acid and its tRNA and drives peptide bond formation at the ribosome). Do not credit 'ATP forms the peptide bond' or 'ATP is part of the peptide bond'. Do not credit 'ATP provides the energy to move the ribosome along the mRNA' (in cells GTP, not ATP, supplies this). 'ATP provides energy for translation' with no process named = 0.",
            model: "Each tRNA molecule carries a specific amino acid and has an anticodon that binds to the complementary codon on the mRNA at the ribosome, so the amino acids are lined up in the order set by the codons. ATP is hydrolysed to provide the energy that attaches each amino acid to its tRNA molecule; this energy is then used to form the peptide bonds that join the amino acids.",
            commonErrors: "Saying tRNA carries codons. Saying ATP 'is' the peptide bond or that ATP moves the ribosome." },
        ] },

      // ======================= 04 RP1 enzyme and pH =======================
      { num: "04", kind: "short", title: "An amylase used in baking", practical: "RP1",
        intro: `<p>An amylase from a fungus is added to bread dough. A student investigated the effect of pH on the activity of this amylase.</p><ol class="small"><li>Put 2 cm³ of amylase solution and 2 cm³ of a buffer solution into one test tube. Put 5 cm³ of 1% starch suspension into a second test tube. Stand both tubes in a water bath at 35 °C for 10 minutes.</li><li>Put one drop of iodine in potassium iodide solution into each well of a spotting tile.</li><li>Pour the starch into the amylase and buffer, mix, keep the tube in the water bath and start a timer. Every 20 seconds, transfer one drop of the mixture to a new well.</li><li>Record the first time at which the drop no longer gives a blue-black colour.</li><li>Repeat steps 1 to 4 with buffers of different pH.</li></ol>` +
          tbl(["pH", "Mean time for starch to disappear / s"], [["3", "more than 600 (blue-black colour still present at 600 s)"], ["4", "200"], ["5", "80"], ["6", "110"], ["7", "260"], ["8", "520"]], "Table 4. Illustrative results. Each value is the mean of three repeats."),
        parts: [
          { id: "p-bl01b-04-1", label: "04.1", ref: "3.1.3.2", stmts: ["3.1.3.2.s2", "3.1.3.2.s3"], ao: ["AO4"], type: "short", marks: 2, practical: "RP1",
            stem: "In step 1, the student put the amylase into the buffer, and left both tubes in the water bath for 10 minutes before mixing.\nExplain why.",
            scheme: [{ point: "Buffer: the enzyme is already at the required pH (and the pH stays constant) when it meets the starch, so the whole reaction happens at that pH", marks: 1 }, { point: "10 minutes: allows both solutions to reach 35 °C / the temperature of the water bath before the reaction starts, so temperature is controlled from the start", marks: 1 }],
            model: "Mixing the amylase with the buffer first means the enzyme is at the pH being tested before it meets the substrate, and the buffer keeps the pH constant, so the whole reaction takes place at that pH. Leaving both tubes for 10 minutes lets the amylase and the starch reach 35 °C before they are mixed, so the reaction takes place at the controlled temperature from the start.",
            commonErrors: "Saying the 10 minutes is 'to let the enzyme start working' or 'to activate the enzyme'." },
          { id: "p-bl01b-04-2", label: "04.2", ref: "3.1.3.2", stmts: ["3.1.3.2.s3", "3.1.3.1.s1"], ao: ["AO1"], type: "short", marks: 2, practical: "RP1",
            stem: "Explain why starch was still present after 600 s at pH 3.",
            scheme: [{ point: "Low pH / high concentration of H⁺ ions breaks ionic bonds and hydrogen bonds that maintain the tertiary structure OR H⁺ ions alter the charges on (R groups of amino acids in) the active site", marks: 1 }, { point: "So the shape of the active site changes and starch is no longer complementary OR the active site can no longer bind starch (as readily); fewer (or no) enzyme–substrate complexes form (accept denatured if explained this way)", marks: 1 }],
            alternatives: "Both routes are creditworthy (3.1.3.2: pH affects the ability of the active site to bind its substrate). A charge-based answer can score both marks without mentioning denaturation: e.g. 'H⁺ ions change the charges on the R groups in the active site, so starch binds less readily and fewer enzyme–substrate complexes form' = 2 marks. Reject temperature or kinetic-energy explanations.",
            model: "At pH 3, the high concentration of hydrogen ions disrupts the ionic and hydrogen bonds that hold the amylase in its tertiary structure. The active site changes shape, so starch molecules no longer fit (are no longer complementary) and few or no enzyme–substrate complexes form; the amylase is denatured, so starch is hydrolysed very slowly or not at all.",
            commonErrors: "Saying the enzyme is 'killed'. Using a temperature explanation (kinetic energy) for a pH effect." },
          { id: "p-bl01b-04-3", label: "04.3", ref: "3.1.3.2", stmts: ["3.1.3.2.s3"], ao: ["AO3"], type: "short", marks: 2, practical: "RP1",
            stem: "The student concluded that the optimum pH of this amylase is pH 5.\nUse Table 4 to evaluate this conclusion.",
            scheme: [{ point: "Support: the (mean) time is shortest / the rate is highest at pH 5 (80 s) of the pH values tested", marks: 1 }, { point: "Only whole-number pH values were tested, so the optimum could lie anywhere between pH 4 and pH 6; the time at pH 6 (110 s) is shorter than at pH 4 (200 s), which suggests it may be between pH 5 and 6", marks: 1 }, { point: "Only the means are given: without the range (or spread) of the three repeats it cannot be judged whether the difference between pH 5 and pH 6 (80 s v 110 s) is real", marks: 1 }],
            alternatives: "Max 2. A supporting point alone = 1 mark; both marks may come from limitations. Do not credit suggestions for improving the method unless a limitation of the conclusion is also stated.",
            model: "The data support the conclusion to some extent: starch disappeared fastest at pH 5 (80 s) of the pH values tested. However, the student tested only whole-number pH values, so the true optimum could be anywhere between pH 4 and pH 6; because the time at pH 6 (110 s) is much shorter than at pH 4 (200 s), it may well lie between pH 5 and 6. Also, only means are shown, so we cannot tell how much the repeats varied.",
            commonErrors: "Accepting the conclusion because pH 5 gave the shortest time, without considering the 1-unit intervals." },
          { id: "p-bl01b-04-4", label: "04.4", ref: "3.1.3.2", stmts: ["3.1.3.2.s2"], ao: ["AO4"], type: "short", marks: 2, practical: "RP1",
            stem: "Suggest <strong>one</strong> limitation of the method used in steps 3 and 4 and how it could be overcome.",
            scheme: [{ point: "Limitation: samples taken only every 20 s, so the end point could have been at any time in the previous 20 s / judging when the colour is no longer blue-black is subjective", marks: 1 }, { point: "Improvement linked to the limitation: sample more often, e.g. every 10 s / use a colorimeter to measure the colour (absorbance) / compare with a colour standard (e.g. iodine in water) / same person judges every end point", marks: 1 }],
            alternatives: "The improvement mark must match the limitation given.",
            model: "Drops were tested only every 20 seconds, so the true end point could be anywhere within the 20 seconds before it was recorded, which limits the precision of the times. Testing every 10 seconds (or measuring the colour continuously with a colorimeter) would give more precise times.",
            commonErrors: "Giving 'repeat more times' without saying why; repeats do not change the 20 s interval." },
        ] },

      // ======================= 05 RP2 osmosis =======================
      { num: "05", kind: "short", title: "Water potential of turnip tissue", practical: "RP2",
        intro: `<p>A student cut cylinders of turnip root tissue with a cork borer and trimmed each one to 30 mm. She blotted and weighed each cylinder, then put it in 20 cm³ of a sucrose solution in a water bath at 30 °C. After 40 minutes she blotted and reweighed each cylinder. Table 5 shows her results and Figure 4 shows them plotted as a graph.</p>` +
          tbl(["Sucrose conc. / mol dm⁻³", "Initial mass / g", "Final mass / g", "Change in mass / %"], [["0.00", "2.54", "2.84", "+11.8"], ["0.10", "2.49", "2.68", "+7.6"], ["0.20", "2.57", "2.66", "+3.5"], ["0.40", "2.52", "2.42", "−4.0"], ["0.60", "2.55", "2.28", "−10.6"], ["0.80", "2.47", "2.10", "−15.0"]], "Table 5. The last column is the percentage change in mass.") +
          fig(figRP2, "Figure 4. The student's results, with points joined by straight lines.") +
          tbl(["Sucrose conc. / mol dm⁻³", "Water potential of the solution / kPa"], [["0.20", "−540"], ["0.25", "−680"], ["0.30", "−820"], ["0.35", "−970"]], "Table 6. Approximate water potentials of sucrose solutions (values for 20 °C; at 30 °C they differ by only a few per cent)."),
        parts: [
          { id: "p-bl01b-05-1", label: "05.1", ref: "3.1.4.2", stmts: ["3.1.4.2.s5"], ao: ["AO4"], type: "short", marks: 1, practical: "RP2",
            stem: "Explain why the student calculated the percentage change in mass rather than the change in mass.",
            scheme: [{ point: "The cylinders had different initial masses, so percentage change allows a fair comparison", marks: 1 }],
            model: "The cylinders did not all start with the same mass, so calculating the percentage change allows the results for different cylinders to be compared fairly.",
            commonErrors: "'To make it more accurate' without a reason." },
          { id: "p-bl01b-05-2", label: "05.2", ref: "3.1.4.2", stmts: ["3.1.4.2.s5"], ao: ["AO2"], type: "short", marks: 2, practical: "RP2",
            stem: "Use Figure 4 and Table 6 to estimate the water potential of the turnip root cells. Show how you arrived at your answer.",
            scheme: [{ point: "Concentration where the line crosses 0% change (no net movement of water) read as 0.28–0.31 mol dm⁻³ (true crossing 0.293)", marks: 1 }, { point: "Water potential −760 to −850 kPa (or a value correctly read from Table 6 for the concentration given)", marks: 1 }],
            model: "The line crosses 0% change at about 0.29 mol dm⁻³. At this concentration there is no net movement of water, so the water potential of the cells equals that of the solution. From Table 6, 0.29 mol dm⁻³ lies between 0.25 (−680 kPa) and 0.30 (−820 kPa), at about −800 kPa.",
            commonErrors: "Reading the concentration at the highest or lowest point, or giving the water potential as a positive value." },
          { id: "p-bl01b-05-3", label: "05.3", ref: "3.1.4.2", stmts: ["3.1.4.2.s5"], ao: ["AO4"], type: "short", marks: 2, practical: "RP2",
            stem: "Another student blotted the cylinders before the final weighing but forgot to blot them before the initial weighing.\nExplain how this would affect this student's percentage changes in mass <strong>and</strong> their estimate of the water potential of the tissue.",
            scheme: [{ point: "Initial masses include surface water so are too high; the percentage changes would all be lower / more negative (smaller gains, larger losses)", marks: 1 }, { point: "The line would cross 0% at a lower concentration, so the estimated water potential would be too high / less negative", marks: 1 }],
            model: "The surface water would make each initial mass too high, so every percentage change would be lower than it should be: gains would be smaller and losses larger. The line would therefore cross 0% at a lower sucrose concentration, so the estimate of the water potential of the tissue would be too high (less negative).",
            commonErrors: "Saying the results would be 'inaccurate' without a direction. Concluding that the estimate would be more negative." },
          { id: "p-bl01b-05-4", label: "05.4", ref: "3.1.4.2", stmts: ["3.1.4.2.s5"], ao: ["AO4"], type: "short", marks: 2, practical: "RP2",
            stem: "A second student wanted to find out whether tissue from near the outside of a turnip root has the same water potential as tissue from its centre.\nDescribe how she should change the method to do this.",
            scheme: [{ point: "Cut cylinders from the outer region and from the centre (of the same roots), with the same cork borer and trimmed to the same length", marks: 1 }, { point: "Put cylinders from each region into the same range of sucrose concentrations, and find the concentration giving 0% change for each region separately (from a graph for each region)", marks: 1 }, { point: "Keep the volume of solution, temperature and time the same for both regions / use several cylinders (repeats) for each region at each concentration and calculate means", marks: 1 }],
            alternatives: "Max 2. A narrower range of concentrations around 0.3 mol dm⁻³ may be credited in place of the third point if both regions are tested over it.",
            model: "She should cut cylinders from the outer part of each root and from its centre, using the same cork borer and trimming them to the same length. She should put cylinders from each region into the same series of sucrose concentrations, with several cylinders at each concentration, keeping the volume, temperature and time the same, and plot a separate graph for each region to find the concentration giving no change in mass and so the water potential of each region.",
            commonErrors: "Changing the range of concentrations for one region only, or comparing a single cylinder from each region." },
        ] },

      // ======================= 06 Human gas exchange: ventilation =======================
      { num: "06", kind: "short", title: "Asthma and breathing out",
        intro: `<p>During an asthma attack the muscle in the walls of the bronchioles contracts, so the bronchioles become narrower. An inhaler contains a drug that relaxes this muscle.</p><p>A doctor tested a person with asthma using a spirometer, before and 15 minutes after the person used an inhaler. The person breathed in as deeply as possible and then breathed out as hard and as fast as possible.</p><ul class="small"><li>FVC is the total volume of air breathed out.</li><li>FEV<sub>1</sub> is the volume of air breathed out in the first second.</li></ul>` +
          tbl(["Measure", "Before inhaler", "After inhaler", "Healthy adult"], [["FEV<sub>1</sub> / dm³", "1.8", "2.7", "3.3"], ["FVC / dm³", "3.6", "3.8", "4.1"]], "Table 7. Illustrative spirometer results: before using the inhaler, 15 minutes after using it, and the typical value for a healthy adult of the same age, sex and height."),
        parts: [
          { id: "p-bl01b-06-1-r1", label: "06.1", ref: "3.1.5.2", stmts: ["3.1.5.2.s5"], ao: ["AO1"], type: "short", marks: 2,
            stem: "When a person breathes out at rest, the diaphragm and the external intercostal muscles relax.\nExplain how this causes air to move out of the lungs.",
            scheme: [{ point: "The diaphragm moves up / domes upwards and the ribs move down and in, so the volume of the thoracic cavity (and lungs) decreases", marks: 1 }, { point: "So the pressure in the lungs / thoracic cavity rises above atmospheric pressure and air moves out (down the pressure gradient)", marks: 1 }],
            alternatives: "The second mark needs the pressure change relative to atmospheric (or outside) pressure. Reject 'the lungs contract and push the air out'.",
            model: "The diaphragm moves up and the ribs move down and in, so the volume of the thoracic cavity decreases. The pressure in the lungs therefore rises above atmospheric pressure and air moves out.",
            commonErrors: "Reversing the pressure change, or saying the lungs 'push' the air out without a pressure change." },
          { id: "p-bl01b-06-2", label: "06.2", ref: "3.1.5.2", stmts: ["3.1.5.2.s7"], ao: ["AO3"], type: "short", marks: 2,
            stem: "The doctor said: 'These results show that this person's asthma mainly reduces how quickly air can be moved through the airways, rather than the volume of air the lungs can hold.'\nUse Table 7 to explain how the results support the doctor's statement.",
            scheme: [{ point: "FEV₁ (the volume breathed out in the first second, a measure of how fast air flows out) was much lower than the healthy value (1.8 v 3.3 dm³) and rose by 0.9 dm³ / 50% when the bronchioles were widened by the inhaler", marks: 1 }, { point: "FVC (the total volume) was close to the healthy value and changed little (3.6 to 3.8 dm³), so the volume of air the lungs hold was hardly affected", marks: 1 }, { point: "Narrow bronchioles slow the flow of air / widening the bronchioles lets air flow out more easily (with less resistance), so more is breathed out in the first second", marks: 1 }],
            alternatives: "Max 2. At least one mark must use values from Table 7 (quoted or compared).",
            model: "FEV₁, the volume breathed out in the first second, shows how fast air can be moved out. Before the inhaler it was only 1.8 dm³ compared with 3.3 dm³ for a healthy adult, and it rose by 0.9 dm³ (50%) once the drug had widened the bronchioles. FVC, the total volume breathed out, was already close to the healthy value and changed only from 3.6 to 3.8 dm³. So the asthma mainly slows the flow of air through the narrowed bronchioles rather than reducing the volume of the lungs.",
            commonErrors: "Describing only FEV₁ or only FVC. Saying the inhaler 'increases the size of the lungs'." },
        ] },

      // ======================= 07 Meiosis =======================
      { num: "07", kind: "short", title: "A plant with four chromosomes",
        intro: `<p><em>Haplopappus gracilis</em> (also called <em>Xanthisma gracile</em>) is a small desert plant of south-western North America. Its body cells contain only four chromosomes (2n = 4), so the chromosomes are easy to follow during cell division.</p><p>Figure 5 is a drawing of a cell from an anther of this plant during meiosis.</p>` +
          fig(figMeiosis, "Figure 5. A cell of <em>H. gracilis</em> during meiosis. Shaded chromosomes were inherited from the female parent and unshaded chromosomes from the male parent."),
        parts: [
          { id: "p-bl01b-07-1", label: "07.1", ref: "3.1.9.1", stmts: ["3.1.9.1.s1", "3.1.9.1.s5"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Describe what happens to the chromosomes of the cell in Figure 5 during the rest of meiosis to produce four haploid cells.",
            scheme: [{ point: "First division: the homologous chromosomes of each pair separate and move to opposite poles, so each of the two cells has one chromosome of each pair (two chromosomes, still of two chromatids)", marks: 1 }, { point: "Second division: the (sister) chromatids of each chromosome separate / the centromeres divide and the chromatids move to opposite poles, giving four cells each with two chromosomes (one long, one short)", marks: 1 }],
            alternatives: "Accept 'n = 2' for the number in each final cell. Reject 'chromatids separate in the first division'.",
            model: "In the first division the two chromosomes of each homologous pair separate and are pulled to opposite poles, so each new cell receives one long and one short chromosome, each still made of two chromatids. In the second division the chromatids of each chromosome separate and move to opposite poles, so four haploid cells are formed, each containing two chromosomes: one long and one short.",
            commonErrors: "Describing the first division as separating chromatids (as in mitosis). Giving four chromosomes in each final cell." },
          { id: "p-bl01b-07-2", label: "07.2", ref: "3.1.9.1", stmts: ["3.1.9.1.s2", "3.1.9.1.s3"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Figure 5 shows one way in which the two pairs of homologous chromosomes can be arranged.\nExplain how meiosis in this plant produces haploid cells that are genetically different from each other.",
            scheme: [{ point: "Independent segregation: each pair lines up (and separates) independently of the other / in either orientation, so the cells receive different combinations of maternal and paternal chromosomes (e.g. here one pole gets the shaded long and unshaded short chromosome; the other arrangement is equally likely)", marks: 1 }, { point: "Crossing over: (non-sister) chromatids of homologous chromosomes exchange sections (at chiasmata), producing new combinations of alleles on the chromatids", marks: 1 }],
            alternatives: "One mark for each mechanism: independent segregation earns its mark when it explains how the chromosomes are distributed and why the cells then differ, but it is not on its own a complete explanation of all the differences (crossing over is needed for the second mark). Reject random fertilisation (it does not act within one meiosis).",
            model: "Each homologous pair lines up on the equator independently of the other, so either the maternal or the paternal chromosome of each pair can go to a given pole. The cells produced therefore receive different combinations of maternal and paternal chromosomes. In addition, crossing over between chromatids of homologous chromosomes exchanges sections of chromatid, so the chromatids carry new combinations of alleles.",
            commonErrors: "Describing mutation or random fertilisation. Saying crossing over happens between sister chromatids." },
        ] },

      // ======================= 08 Index of diversity =======================
      { num: "08", kind: "short", title: "Insects in wildflower strips",
        intro: `<p>Some farmers sow strips of wild flowers along the edges of wheat fields. A student used a sweep net to sample insects in a wildflower strip and in the middle of the wheat field next to it. She used 30 sweeps of the net at each site. Table 8 shows her results.</p>` +
          tbl(["Insect species", "Number in wildflower strip", "Number in wheat field"], [["A", "12", "21"], ["B", "8", "6"], ["C", "5", "0"], ["D", "3", "2"], ["E", "2", "0"], ["F", "0", "1"], ["<strong>Total</strong>", "<strong>30</strong>", "<strong>30</strong>"]], "Table 8"),
        parts: [
          { id: "p-bl01b-08-1", label: "08.1", ref: "3.1.11.2", stmts: ["3.1.11.2.s3"], ao: ["AO2"], type: "short", marks: 2,
            stem: "The index of diversity for the wildflower strip was 4.03.\nCalculate the index of diversity for the wheat field. Give your answer to 3 significant figures.",
            scheme: [{ point: "Σn(n − 1) = 452 OR N(N − 1) = 870 (seen in working)", marks: 1 }, { point: "1.92 (the value to 3 significant figures; correct answer with no working = 2 marks)", marks: 1 }],
            alternatives: "1.9248 = 1.92 to 3 s.f. Award 1 mark only for an answer not given to 3 s.f. (1.9, 1.925, 1.9248) or for 1.93, which comes from rounding twice (1.9248 → 1.925 → 1.93).",
            model: "N(N − 1) = 30 × 29 = 870. Σn(n − 1) = (21 × 20) + (6 × 5) + (2 × 1) + (1 × 0) = 420 + 30 + 2 + 0 = 452. d = 870 ÷ 452 = 1.9248… = 1.92.",
            commonErrors: "Including species absent from the field, or counting species F as 1 × 1. Using N² instead of N(N − 1)." },
          { id: "p-bl01b-08-2", label: "08.2", ref: "3.1.11.2", stmts: ["3.1.11.2.s1", "3.1.11.2.s2"], ao: ["AO1", "AO3"], type: "short", marks: 2,
            stem: "The species richness of the two sites is similar. Explain why the index of diversity gives a more useful comparison of the two sites than species richness.",
            scheme: [{ point: "Species richness only counts the number of species (5 and 4)", marks: 1 }, { point: "The index also takes into account the number of individuals of each species; the wheat field is dominated by species A (21 of 30), so its diversity is much lower (1.92 v 4.03)", marks: 1 }],
            model: "Species richness is only the number of different species, 5 in the strip and 4 in the field, so it suggests the sites are similar. The index of diversity also takes into account how many individuals there are of each species. In the wheat field 21 of the 30 insects are species A, so the community is dominated by one species and its index (1.92) is less than half that of the strip (4.03).",
            commonErrors: "Saying the index 'is more accurate' without explaining what it includes." },
          { id: "p-bl01b-08-3", label: "08.3", ref: "3.1.11.2", stmts: ["3.1.11.2.s2"], ao: ["AO4"], type: "short", marks: 2,
            stem: "The student used 30 sweeps of the net at each site. Suggest <strong>two</strong> other things she should do so that the samples from the two sites can be compared validly.",
            scheme: [{ point: "Sample both sites on the same day / at the same time of day / in the same weather (insect activity changes with temperature, wind and time of day)", marks: 1 }, { point: "The same person uses the same sweeping technique (same length, speed and depth of each sweep / same net)", marks: 1 }, { point: "Choose the positions of the sweeps at random within each site / sweep along transects of the same length", marks: 1 }, { point: "Repeat the sampling (on several days or at several random positions) at each site and use the totals or means", marks: 1 }],
            alternatives: "Max 2: one mark for each different suggestion. Ignore 'use the same number of sweeps' (given in the stem).",
            model: "She should sample both sites on the same day, at the same time and in the same weather, because insect activity changes with temperature and time of day. She should also make every sweep the same way (the same person, length and speed of sweep) and place the sweeps at random within each site.",
            commonErrors: "Repeating the stem ('use the same number of sweeps'). Suggesting quadrats, which do not sample flying insects." },
        ] },

      // ======================= 09 Variation =======================
      { num: "09", kind: "short", title: "Variation in date fruits",
        intro: `<p>Date palms (<em>Phoenix dactylifera</em>) on commercial farms are usually grown from offshoots: young plants that grow from the base of a parent palm. All the palms of one cultivar (variety) are therefore clones and are genetically identical, apart from rare mutations.</p><p>A student compared the mass of fruits of one cultivar on two farms. Farm A used drip irrigation; farm B flooded the ground around the palms once a week. At each farm the student weighed a random sample of 100 ripe fruits. Figure 6 and Table 9 show the results.</p>` +
          fig(fig3, "Figure 6. Distribution of fruit mass at each farm (each point is plotted at the middle of a 1 g class; 100 fruits per farm).") +
          tbl(["Farm", "Mean mass of fruit / g", "Standard deviation / g"], [["A (drip irrigation)", "11.8", "1.3"], ["B (flood irrigation)", "9.6", "2.4"]], "Table 9"),
        parts: [
          { id: "p-bl01b-09-1", label: "09.1", ref: "3.1.6", stmts: ["3.1.6.s2"], ao: ["AO4"], type: "short", marks: 2,
            stem: "Describe how the student could select the 100 fruits at random at one farm.",
            scheme: [{ point: "Number the palms / use the rows and positions of palms as coordinates", marks: 1 }, { point: "Use a random number generator / random number table to choose the palms (and the bunches or fruits on each palm)", marks: 1 }, { point: "Select fruits from different (randomly chosen) positions on the bunch rather than choosing the largest or most accessible", marks: 1 }],
            alternatives: "Max 2. Reject 'pick fruits without looking' or 'pick them at random' without a method.",
            model: "Give every palm on the farm a number (or a row and position number). Use a random number generator to choose palms, then use random numbers again to choose a bunch and fruits from each chosen palm, until 100 fruits have been collected.",
            commonErrors: "Describing a quadrat method for a field of small plants, or 'choosing fruits without looking'." },
          { id: "p-bl01b-09-2-r1", label: "09.2", ref: "3.1.6", stmts: ["3.1.6.s4", "3.1.6.s3", "3.1.6.s6"], ao: ["AO3"], type: "short", marks: 2,
            stem: "Compare the variation in fruit mass at farm A and farm B. Use data from Figure 6 and Table 9 in your answer.",
            scheme: [{ point: "Fruit mass is more variable at farm B: its standard deviation is larger (2.4 g v 1.3 g, almost twice as large)", marks: 1 }, { point: "The range is wider at farm B: about 3 g to 16 g, compared with about 8 g to 16 g at farm A / farm B's fruits fall in 13 one-gram classes, farm A's in 8", marks: 1 }, { point: "Farm A's distribution is narrower with a higher peak (31 fruits in its modal class v 16 at farm B) / at farm A most fruits (77 of 100) are between 10 g and 13 g, whereas farm B's are spread more widely about the mean", marks: 1 }],
            alternatives: "Max 2. Each mark needs a comparison of the two farms supported by a value from Figure 6 or Table 9. A comparison of the means alone gains no credit (the mean is not a measure of variation). Ignore explanations of the cause of the variation.",
            model: "The fruit mass varies much more at farm B. Its standard deviation is 2.4 g, almost twice farm A's 1.3 g, and its fruits range from about 3 g to 16 g, whereas farm A's range only from about 8 g to 16 g. Farm A's distribution is narrow with a tall peak of 31 fruits in the 11 to 12 g class, while farm B's is flatter, with a peak of only 16 fruits.",
            commonErrors: "Comparing only the means. Quoting the standard deviations without saying which farm shows more variation." },
          { id: "p-bl01b-09-3-r1", label: "09.3", ref: "3.1.6", stmts: ["3.1.6.s6", "3.1.6.s5", "3.1.6.s2", "3.1.6.s4"], ao: ["AO3"], type: "short", marks: 2,
            stem: "The student concluded that drip irrigation causes date palms to produce heavier fruit.\nUse the information about how date palms are grown, Figure 6 and Table 9 to evaluate this conclusion.",
            scheme: [{ point: "Support: mean fruit mass is higher at farm A (11.8 g v 9.6 g); the palms are clones, so the difference is unlikely to be genetic and an environmental cause such as irrigation is possible", marks: 1 }, { point: "The farms may differ in other factors (soil, fertiliser, age of palms, pollination or source of pollen, shade, temperature), so the difference cannot be put down to irrigation alone", marks: 1 }, { point: "Only one farm with each irrigation method / no replicate farms", marks: 1 }, { point: "No statistical test, so the difference between the means could be due to chance (accept: the distributions / mean ± 1 SD ranges overlap, so a test is needed; overlap alone does not show the means are the same)", marks: 1 }],
            alternatives: "Max 2. Both marks may come from limitations; a supporting point alone scores max 1. For the supporting mark, the higher mean at farm A alone is enough. Credit as a limitation, never required: pollen from different male palms may be used at the two farms, and in date palms the pollen parent can affect fruit mass (metaxenia), so part of the difference could still be genetic.",
            model: "The data support the conclusion to some extent because the mean fruit mass at farm A (11.8 g) is higher than at farm B (9.6 g), and since the palms are clones the difference is unlikely to be genetic. However, the two farms will differ in other environmental factors, such as soil, fertiliser use and the age of the palms, so the difference cannot be attributed to irrigation alone; and there is only one farm for each method. The two distributions overlap and no statistical test was done to show whether the difference between the means is significant.",
            commonErrors: "Arguing that the difference must be genetic. Treating overlapping ± 1 SD ranges as proof that there is no difference." },
        ] },

      // ======================= 10 Species and classification =======================
      { num: "10", kind: "short", title: "Camels and their relatives",
        intro: `<p>The dromedary (one-humped camel) and the Bactrian camel (two-humped camel) are classified as two different species in the same genus. Both are domesticated animals. Table 10 shows the classification of the dromedary.</p>` +
          tbl(["Taxon", "Name"], [["Domain", "Eukarya"], ["Kingdom", "Animalia"], ["<strong>1</strong>", "Chordata"], ["Class", "Mammalia"], ["<strong>2</strong>", "Artiodactyla"], ["Family", "Camelidae"], ["Genus", "<em>Camelus</em>"], ["Species", "<em>dromedarius</em>"]], "Table 10. Classification of the dromedary."),
        parts: [
          { id: "p-bl01b-10-1", label: "10.1", ref: "3.1.10.2", stmts: ["3.1.10.2.s2"], ao: ["AO1"], type: "gap", marks: 2,
            stem: "Name the taxa labelled <strong>1</strong> and <strong>2</strong> in Table 10.",
            text: "Taxon 1: {{1}}   Taxon 2: {{2}}",
            answers: { 1: ["phylum", "phyla"], 2: ["order", "orders"] },
            explanation: "The hierarchy is domain, kingdom, phylum, class, order, family, genus, species. Chordata is a phylum and Artiodactyla (the even-toed hoofed mammals) is an order." },
          { id: "p-bl01b-10-2", label: "10.2", ref: "3.1.10.1", stmts: ["3.1.10.1.s4", "3.1.10.1.s2"], ao: ["AO3"], type: "short", marks: 2,
            stem: "Dromedaries and Bactrian camels can mate and produce hybrid offspring. These first-generation hybrids are fertile, and camel herders in parts of Central Asia have bred them for a long time.\nExplain why this makes it difficult to apply the definition of a species to these two camels.",
            scheme: [{ point: "A species is defined as the largest group of organisms that can interbreed to produce fertile offspring", marks: 1 }, { point: "Dromedaries and Bactrian camels produce fertile offspring, so by this definition they would be one species, yet they are classified as two", marks: 1 }, { point: "Both are domesticated (dromedaries no longer live in the wild) and the hybrids are produced by human breeding, so the data cannot show whether the two would interbreed naturally", marks: 1 }, { point: "When hybrids are mated with each other, the offspring are often weak or deformed, so the two do not form one fully interbreeding population (credit if the candidate knows this; it is not in the stem)", marks: 1 }],
            alternatives: "Max 2. Do not credit claims about the natural ranges of the two species overlapping or not: the dromedary has had no truly wild populations for about 2000 years (feral camels in Australia were introduced), and the wild two-humped camel, Camelus ferus, is a separate species from the domestic Bactrian camel.",
            model: "The definition says a species is the largest group of organisms that can interbreed to produce fertile offspring. Dromedaries and Bactrian camels interbreed and their first-generation hybrids are fertile, so under this definition they should be one species, yet they are classified as two species because they differ in many features. Both are domesticated and the hybrids are bred by people, so the data cannot show whether the two would interbreed under natural conditions.",
            commonErrors: "Saying the hybrids are infertile, which reverses the information given." },
          { id: "p-bl01b-10-3", label: "10.3", ref: "3.1.10.2", stmts: ["3.1.10.2.s3", "3.1.10.2.s1"], ao: ["AO3"], type: "short", marks: 2,
            stem: `Scientists can compare proteins from different species using antibodies. Albumin (a blood protein) from a dromedary was injected into a rabbit, which made antibodies against it. These antibodies were then mixed with albumin from other species. The antibodies bind only to albumin with a complementary shape: the more similar the amino acid sequence of an albumin is to that of dromedary albumin, the more antibody binds and the more precipitate forms.` +
              tbl(["Source of albumin", "Precipitate formed / % of that with dromedary albumin"], [["dromedary", "100"], ["Bactrian camel", "92"], ["llama", "68"], ["cattle", "27"], ["horse", "12"]], "Table 11. Illustrative results.") +
              `The llama is classified in the same family as the dromedary but in a different genus. Explain how the data in Table 11 support this classification.`,
            scheme: [{ point: "Llama (68%) gives less precipitate than the Bactrian camel (92%, same genus), so it is less closely related than a species in the same genus / albumin less similar", marks: 1 }, { point: "Llama gives much more precipitate than cattle (27%) or horse (12%), which are in other families, so it is more closely related than these / similar enough to be in the same family", marks: 1 }],
            alternatives: "Answers must use data comparatively; quoting values without comparison = max 1.",
            model: "Llama albumin gives 68% of the dromedary value, less than Bactrian camel albumin (92%). So llama albumin is less similar to dromedary albumin than that of a species in the same genus, consistent with the llama being in a different genus. However, the llama value is much higher than for cattle (27%) or horses (12%), which belong to other families, so the llama is more closely related to the dromedary than they are, consistent with being in the same family.",
            commonErrors: "Comparing only with the dromedary (100%)." },
        ] },

      // ======================= 11 Comprehension =======================
      { num: "11", kind: "comprehension", title: "Grey mangroves: living with salt",
        intro: "<p>Read the passage about the grey mangrove, then answer the questions. The lines of the passage are numbered: line 1 and every fifth line carry a number in the margin.</p>",
        passageTitle: "Grey mangroves: living with salt",
        passage,
        passageSource: "Original passage written for this paper.",
        parts: [
          { id: "p-bl01b-11-1-r1", label: "11.1", ref: "3.1.4.2", stmts: ["3.1.4.2.s5"], ao: ["AO1", "AO2"], type: "short", marks: 2,
            stem: "Use information in lines 12 to 22 and your knowledge of osmosis to explain how the root cells of the grey mangrove can absorb water from seawater.",
            scheme: [{ point: "Osmosis: (net) movement of water from a higher (less negative) water potential to a lower (more negative) water potential across a partially permeable membrane", marks: 1 }, { point: "The high concentration of dissolved solutes gives the root cells a water potential lower (more negative) than −3000 kPa / than the seawater, so water moves from the seawater into the root cells", marks: 1 }],
            alternatives: "First mark (knowledge): the definition of osmosis in terms of water potential and a partially permeable membrane; 'down a water potential gradient' with a partially permeable membrane is enough. Second mark (application): must compare the water potential of the root cells with that of the seawater or with −3000 kPa.",
            model: "Osmosis is the net movement of water from a higher (less negative) to a lower (more negative) water potential across a partially permeable membrane. The high concentration of dissolved solutes in the root cells gives them a water potential below that of the seawater (about −3000 kPa), so water moves from the seawater into the root cells by osmosis.",
            commonErrors: "Saying the cells have a higher water potential than seawater, or that salt is absorbed by osmosis." },
          { id: "p-bl01b-11-2", label: "11.2", ref: "3.1.4.3", stmts: ["3.1.4.3.s1", "3.1.4.3.s2", "3.1.2.1.s4"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Explain why the cells in the salt glands (lines 23 to 34) contain many mitochondria.",
            scheme: [{ point: "Ions are moved against a concentration gradient by active transport (using carrier proteins)", marks: 1 }, { point: "Active transport needs ATP, which is produced by (aerobic) respiration in mitochondria", marks: 1 }],
            alternatives: "Reject 'mitochondria produce energy'; accept 'mitochondria release energy (in respiration) to make ATP'.",
            model: "The cells move sodium and chloride ions against their concentration gradient, which is active transport by carrier proteins. Active transport uses ATP, and many mitochondria are needed to produce enough ATP by aerobic respiration.",
            commonErrors: "'Mitochondria make energy'. Describing diffusion or osmosis of the ions." },
          { id: "p-bl01b-11-3-r1", label: "11.3", ref: "3.1.5.2", stmts: ["3.1.5.2.s6"], ao: ["AO2"], type: "short", marks: 2,
            stem: "Lines 52 to 56 describe the results of a survey.\nUse information in lines 35 to 56 to suggest an explanation for these results.",
            scheme: [{ point: "At low tide oxygen from the air enters the pneumatophores through the lenticels and diffuses through the continuous air spaces to the roots below the mud", marks: 1 }, { point: "More pneumatophores give a larger total surface area / more lenticels through which oxygen can enter, so more oxygen reaches the roots", marks: 1 }, { point: "The less oxygen there is in the mud, the less can diffuse into the roots from the mud, so the roots depend more on oxygen supplied through the pneumatophores (for aerobic respiration)", marks: 1 }],
            alternatives: "Max 2. Reject 'pneumatophores absorb oxygen from the mud' or 'from the seawater'.",
            model: "Oxygen from the air enters the pneumatophores through their lenticels at low tide and diffuses through the continuous air spaces down to the roots in the mud. Where the mud contains less oxygen, the roots can obtain even less oxygen from the mud, so more pneumatophores, with a larger total surface area and more lenticels, are needed to supply enough oxygen to the root cells for aerobic respiration.",
            commonErrors: "Saying the pneumatophores take oxygen from the mud, which has very little. Describing the pneumatophores without linking their number to the oxygen supply." },
          { id: "p-bl01b-11-4", label: "11.4", ref: "3.1.5.2", stmts: ["3.1.5.2.s2"], ao: ["AO1"], type: "short", marks: 2,
            stem: "Explain how the hairs on the lower surface of the leaf (lines 57 to 63) reduce water loss.",
            scheme: [{ point: "Hairs trap (still, moist) air / water vapour next to the stomata", marks: 1 }, { point: "This reduces the water potential gradient (or the water vapour concentration gradient) between the inside of the leaf and the air, so less water diffuses out / evaporates through the stomata", marks: 1 }],
            model: "The hairs trap a layer of still, moist air next to the leaf surface around the stomata. This reduces the water potential (water vapour) gradient between the air spaces in the leaf and the outside air, so less water vapour diffuses out through the stomata.",
            commonErrors: "Saying the hairs 'block' or 'cover' the stomata, or that they reflect light." },
          { id: "p-bl01b-11-5-r1", label: "11.5", ref: "3.1.11.2", stmts: ["3.1.11.2.s4", "3.1.11.2.s1"], ao: ["AO3"], type: "short", marks: 2,
            stem: `Lines 64 to 74 describe how young fish shelter among mangrove roots and how mangroves have been cleared in many parts of the world.\nOn one coastline, mangroves were cleared for coastal building between 1990 and 2010. Every five years, divers recorded the number of species of fish on a coral reef 5 km from the coast. Table 12 shows the results.` +
              tbl(["Year", "Area of mangrove on the coastline / km²", "Number of fish species recorded on the reef"], [["1990", "42", "61"], ["1995", "35", "58"], ["2000", "27", "52"], ["2005", "21", "47"], ["2010", "18", "45"]], "Table 12. Illustrative results.") +
              `A report concluded that clearing the mangroves reduced the biodiversity of the reef.\nEvaluate this conclusion. Use Table 12 in your answer.`,
            scheme: [{ point: "Support: as the area of mangrove fell (from 42 to 18 km²), the number of fish species on the reef fell (from 61 to 45) / there is a positive correlation between mangrove area and the number of reef fish species", marks: 1 }, { point: "A correlation does not show that one causes the other: other factors may have changed over the same 20 years (e.g. sea temperature or coral bleaching, fishing, pollution or sediment from the coastal building)", marks: 1 }, { point: "There is no comparison (control) reef on a coast where mangroves were not cleared / only one reef and one coastline were studied", marks: 1 }, { point: "Only the number of fish species (species richness) was recorded, not the number of individuals of each species or other groups of organisms, so the biodiversity of the reef is only partly measured", marks: 1 }],
            alternatives: "Max 2. A supporting point alone scores max 1; both marks may come from limitations. The supporting mark needs values from Table 12 or a clear statement of the correlation. Ignore explanations of why fewer young fish would survive.",
            model: "The data support the conclusion to some extent: as the area of mangrove fell from 42 km² to 18 km², the number of fish species recorded on the reef fell from 61 to 45. However, this is only a correlation. Other things may have changed over the same 20 years, such as sea temperature, fishing or pollution from the building work, and there is no reef on an uncleared coast to compare with. Also only species richness of fish was recorded, so the data do not measure the whole biodiversity of the reef.",
            commonErrors: "Describing the trend and accepting the conclusion without any limitation. Saying 'correlation is not causation' without suggesting another factor that could have changed." },
        ] },
    ],
  };
})();
