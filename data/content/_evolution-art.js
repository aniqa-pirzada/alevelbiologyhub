// Drawings for 3.3.8 Evolution may lead to speciation (Phase 5 Batch 4, author C2). B.evolutionArt.
// chain()                 the natural selection chain (figure d-3.3.8.1-1).
// lines(series, exp, o)   frequency against generation for the Natural Selection Simulator (five runs + expected line).
// strip(last, P)          the individuals of one generation of run 1: phenotype by colour AND shape; non-survivors faded
//                         and crossed.
// histogram(mode, g)      before and after distributions for the Selection Curve Explorer, with the survival line.
// scene(mode, i)          one stage of the Speciation Explorer (allopatric beetles or sympatric apple maggot flies).
// curvesFig()             consolidation figure: one distribution before selection and three after (P, Q, R).
// All pictures are drawn on a white figure panel; labels at least 13 user units in drawings shown near their viewBox
// width; values in the histogram come from B.evolutionModel.curves, so the picture and the readouts always agree.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5f6f7f", LINE = "#c9d3dc";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}>${s}</text>`;
  const svg = (w, h, label, body, o = {}) => `<svg viewBox="0 0 ${w} ${h}" width="${o.width || w}" role="img" aria-label="${label}" style="max-width:100%;height:auto;background:#fff">${body}</svg>`;
  const RUNC = ["#1f6fb4", "#c2410c", "#15803d", "#7b3f98", "#a16207"];

  // ---------------------------------------------------------------- natural selection chain (static figure)
  function chain() {
    const box = (x, y, w, h, title, sub, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${T(x + w / 2, y + 26, title, { w: 700 })}${sub.map((s, i) => T(x + w / 2, y + 49 + i * 19, s, { s: 15, c: GREY })).join("")}`;
    const arr = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6b8f8a" stroke-width="2.5" marker-end="url(#evch)"/>`;
    // three rows, so the figure stays readable when it fits a phone screen
    return svg(470, 462, "Flow chart of natural selection in five steps, with a dashed arrow from the last step back to the first, labelled repeated over many generations", `
      <defs><marker id="evch" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#6b8f8a"/></marker></defs>
      ${box(40, 10, 196, 104, "1. Variation", ["different alleles", "(from mutation) give", "different phenotypes"], "#d6efec", "#1f8a8a")}
      ${box(264, 10, 196, 104, "2. Selection pressure", ["predation, disease or", "competition for", "resources"], "#fdf0dc", "#a3620f")}
      ${box(264, 160, 196, 104, "3. Differential", ["survival and", "reproduction: some", "phenotypes do better"], "#fdf0dc", "#a3620f")}
      ${box(40, 160, 196, 104, "4. Alleles passed on", ["those with the", "advantage have more", "offspring"], "#efe7f6", "#7b3f98")}
      ${box(40, 310, 196, 104, "5. Allele frequency", ["of the favourable", "allele rises in the", "gene pool"], "#efe7f6", "#7b3f98")}
      ${arr(237, 62, 262, 62)}${arr(362, 115, 362, 158)}${arr(263, 212, 238, 212)}${arr(138, 265, 138, 308)}
      <path d="M39 362 H26 V62 H37" fill="none" stroke="#6b8f8a" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#evch)"/>
      <text x="13" y="212" font-size="14" font-weight="500" fill="${GREY}" text-anchor="middle" transform="rotate(-90 13 212)">repeated over many generations</text>
      ${T(235, 434, "Evolution: a change in the allele", { s: 14, w: 700 })}${T(235, 454, "frequencies in a population", { s: 14, w: 700 })}`);
  }

  // ---------------------------------------------------------------- simulator graph
  function lines(series, exp, o = {}) {
    const W = 520, H = 310, x0 = 64, x1 = 505, y0 = 260, y1 = 34; const G = o.G || 30;
    const X = (t) => x0 + ((x1 - x0) * t) / G, Y = (v) => y0 - (y0 - y1) * v;
    let g = ""; for (let k = 0; k <= 4; k++) { const v = k / 4; g += `<line x1="${x0}" y1="${Y(v)}" x2="${x1}" y2="${Y(v)}" stroke="${LINE}" stroke-width="1"/>${T(x0 - 8, Y(v) + 5, v.toFixed(2), { a: "end", s: 16 })}`; }
    const step = G <= 20 ? 5 : 10; for (let t = 0; t <= G; t += step) g += `<line x1="${X(t)}" y1="${y0}" x2="${X(t)}" y2="${y0 + 5}" stroke="${INK}"/>${T(X(t), y0 + 22, t, { s: 16 })}`;
    const path = (arr) => arr.map((v, t) => `${t ? "L" : "M"}${X(t).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const runs = series.map((s, i) => `<path d="${path(s)}" fill="none" stroke="${RUNC[i % 5]}" stroke-width="2.2" stroke-linejoin="round"/>` + (s.length - 1 < G ? `<text x="${X(s.length - 1) + 4}" y="${Y(s[s.length - 1]) - 4}" font-size="13" fill="${RUNC[i % 5]}">died out</text>` : "")).join("");
    const e = exp ? `<path d="${path(exp)}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-dasharray="7 5"/>` : "";
    return svg(W, H, o.label || "Line graph of frequency against generation for five simulated runs", `${g}<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="${INK}" stroke-width="1.5"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${INK}" stroke-width="1.5"/>
      ${runs}${e}${T((x0 + x1) / 2, H - 6, "Generation", { s: 16, w: 600 })}
      <text x="${(x0 + x1) / 2}" y="18" font-size="16" font-weight="600" fill="${INK}" text-anchor="middle">${o.ylab || "Frequency"}</text>`);
  }

  // ---------------------------------------------------------------- population strip (one generation of run 1)
  // dominant phenotype: dark rounded square; recessive phenotype: pale circle with an outline
  function strip(last, P) {
    const W = 640, cols = 20, cell = 28, x0 = 40, y0 = 10; const n = last ? last.geno.length : 0; const rows = Math.max(1, Math.ceil(n / cols));
    let body = ""; for (let i = 0; i < n; i++) { const cx = x0 + (i % cols) * cell + cell / 2, cy = y0 + Math.floor(i / cols) * cell + cell / 2; const dom = last.geno[i] > 0, live = last.surv[i];
      const shape = dom ? `<rect x="${cx - 9}" y="${cy - 9}" width="18" height="18" rx="4" fill="#3b3f46" stroke="#16263a" stroke-width="1.2"/>` : `<circle cx="${cx}" cy="${cy}" r="9.5" fill="#efe9da" stroke="#5f6f7f" stroke-width="1.6"/>`;
      body += `<g opacity="${live ? 1 : 0.28}">${shape}</g>` + (live ? "" : `<path d="M${cx - 8} ${cy - 8} L${cx + 8} ${cy + 8} M${cx + 8} ${cy - 8} L${cx - 8} ${cy + 8}" stroke="#b42318" stroke-width="2"/>`); }
    const h = y0 + rows * cell + 34; const ly = h - 12;
    const legend = `<rect x="40" y="${ly - 13}" width="16" height="16" rx="4" fill="#3b3f46"/>${T(62, ly, P.dom + " (" + P.A + P.A + " or " + P.A + P.a + ")", { a: "start", s: 13.5 })}<circle cx="268" cy="${ly - 5}" r="8.5" fill="#efe9da" stroke="#5f6f7f" stroke-width="1.6"/>${T(282, ly, P.rec + " (" + P.a + P.a + ")", { a: "start", s: 13.5 })}<path d="M452 ${ly - 13} L466 ${ly + 1} M466 ${ly - 13} L452 ${ly + 1}" stroke="#b42318" stroke-width="2"/>${T(474, ly, "did not survive to breed", { a: "start", s: 13.5 })}`;
    return svg(W, h, `${n} individuals of one generation: ${last ? last.geno.filter((g) => g > 0).length : 0} ${P.dom} and ${last ? last.geno.filter((g) => g === 0).length : 0} ${P.rec}; ${last ? last.surv.filter((s) => !s).length : 0} did not survive`, body + legend);
  }

  // ---------------------------------------------------------------- selection curves histogram
  const MODECOL = { directional: "#1f6fb4", stabilising: "#15803d", disruptive: "#7b3f98" };
  function histogram(mode, g) {
    const C = B.evolutionModel.curves; const b = C.stats(C.BEFORE).pct, a = C.stats(C.after(mode, g)).pct, w = C.W[mode];
    const W = 560, H = 340, x0 = 56, x1 = 500, y0 = 270, y1 = 40, ymax = 50; const bw = (x1 - x0) / 9;
    const Y = (v) => y0 - ((y0 - y1) * v) / ymax, YS = (v) => y0 - (y0 - y1) * v;
    let s = ""; for (let v = 0; v <= ymax; v += 10) s += `<line x1="${x0}" y1="${Y(v)}" x2="${x1}" y2="${Y(v)}" stroke="${LINE}"/>${T(x0 - 8, Y(v) + 5, v, { a: "end", s: 16 })}`;
    for (let k = 0; k <= 4; k++) s += T(x1 + 6, YS(k / 4) + 5, (k / 4).toFixed(2), { a: "start", s: 16, c: "#a3620f" });
    C.CLASSES.forEach((x, i) => { const cx = x0 + i * bw; s += `<rect x="${cx + 6}" y="${Y(b[i])}" width="${bw / 2 - 7}" height="${y0 - Y(b[i])}" fill="#b8c2cc"/><rect x="${cx + bw / 2 + 1}" y="${Y(a[i])}" width="${bw / 2 - 7}" height="${y0 - Y(a[i])}" fill="${MODECOL[mode]}"/>${T(cx + bw / 2, y0 + 22, x, { s: 16 })}`; });
    const sp = w.map((v, i) => `${i ? "L" : "M"}${(x0 + i * bw + bw / 2).toFixed(1)} ${YS(v).toFixed(1)}`).join(" ");
    s += `<path d="${sp}" fill="none" stroke="#a3620f" stroke-width="2.4" stroke-dasharray="6 4"/>` + w.map((v, i) => `<circle cx="${x0 + i * bw + bw / 2}" cy="${YS(v)}" r="3.5" fill="#a3620f"/>`).join("");
    s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="${INK}" stroke-width="1.5"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${INK}" stroke-width="1.5"/><line x1="${x1}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#a3620f" stroke-width="1.5"/>`;
    s += T((x0 + x1) / 2, y0 + 44, "Beak depth / mm (middle of each class)", { s: 16, w: 600 });
    s += `<text x="140" y="18" font-size="16" font-weight="600" fill="${INK}" text-anchor="middle">Percentage of birds</text>`;
    s += `<text x="420" y="18" font-size="16" font-weight="600" fill="#a3620f" text-anchor="middle">Chance of surviving</text>`;
    return svg(W, H, `Bar chart of beak depth: grey bars before selection, coloured bars after ${g} generation${g > 1 ? "s" : ""} of ${mode} selection; dashed line shows the chance of surviving in each class`, s);
  }

  // ---------------------------------------------------------------- speciation scenes
  const beetle = (x, y, col, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse cx="0" cy="0" rx="9" ry="6" fill="${col}" stroke="#16263a" stroke-width="1"/><line x1="-9" y1="0" x2="9" y2="0" stroke="#16263a" stroke-width=".8"/><circle cx="10" cy="0" r="3" fill="#16263a"/></g>`;
  const fly = (x, y, col) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="6" ry="3.5" fill="${col}" stroke="#16263a" stroke-width=".8"/><ellipse cx="-2" cy="-4" rx="5" ry="2.4" fill="#ffffffcc" stroke="#5f6f7f" stroke-width=".6"/><ellipse cx="2" cy="-4" rx="5" ry="2.4" fill="#ffffffcc" stroke="#5f6f7f" stroke-width=".6"/></g>`;
  const SPOTS = [[60, 70], [120, 140], [90, 200], [170, 90], [210, 180], [250, 60], [280, 130], [150, 230], [40, 150], [230, 225], [380, 70], [430, 150], [470, 90], [520, 200], [560, 60], [600, 140], [410, 220], [490, 230], [580, 220], [350, 180]];
  function scene(mode, i) {
    const W = 640, H = 260;
    if (mode === "allo") {
      const river = "M300 0 C 340 60, 270 120, 320 170 S 300 230, 330 260 L 360 260 C 330 230, 350 175, 342 170 C 300 120, 370 60, 332 0 Z";
      let bg = i === 0 ? `<rect width="${W}" height="${H}" fill="#e7efd8"/>` : `<rect width="322" height="${H}" fill="${i >= 2 ? "#efe3c2" : "#e7efd8"}"/><rect x="318" width="322" height="${H}" fill="${i >= 2 ? "#cfe0c6" : "#e7efd8"}"/>`;
      if (i === 1 || i === 2) bg += `<path d="${river}" fill="#8cc4e8" stroke="#3f88b8" stroke-width="1.5"/>`;
      if (i === 3) bg += `<path d="${river}" fill="#e9e1cf" stroke="#b6a98a" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      const westCol = i >= 2 ? "#c58a3a" : "#7a5a3a", eastCol = i >= 2 ? "#3d3226" : "#7a5a3a";
      let bugs = SPOTS.map(([x, y], k) => { let bx = x, by = y, col = x < 320 ? westCol : eastCol; if (i === 3 && k % 3 === 0) { bx = x < 320 ? x + 320 : x - 320; bx = Math.min(615, Math.max(25, bx)); }
        // keep beetles off the river band and clear of the labels and the key
        if (i >= 1) { if (bx > 280 && bx < 370) bx += bx < 325 ? -70 : 70; if (by > 205) by = 200; } if (i === 3 && bx < 345 && by < 92) by += 40;
        return beetle(bx, by, col, (k * 37) % 360); }).join("");
      let lab = "";
      const L = (x, y, t) => `<rect x="${x - t.length * 7.2 - 8}" y="${y - 22}" width="${t.length * 14.4 + 16}" height="30" rx="6" fill="#ffffffd9"/>` + T(x, y, t, { w: 700, s: 24 });
      if (i === 1) lab = L(150, 244, "West") + L(490, 244, "East") + L(410, 34, "River");
      if (i === 2) lab = L(150, 244, "Dry, sandy") + L(490, 244, "Damp");
      if (i === 3) lab = `<rect x="8" y="8" width="330" height="76" rx="8" fill="#ffffffe6" stroke="#c9d3dc"/>${beetle(30, 30, "#c58a3a")}${T(48, 37, "pale: spring breeders", { a: "start", s: 23, w: 700 })}${beetle(30, 62, "#3d3226")}${T(48, 69, "dark: autumn breeders", { a: "start", s: 23, w: 700 })}`;
      return svg(W, H, ["One population of beetles on a plain", "A river splits the beetles into west and east populations", "Beetles on the dry west bank are paler and those on the damp east bank darker", "The river has dried; pale spring-breeding and dark autumn-breeding beetles mix but do not interbreed"][i], bg + bugs + lab);
    }
    // sympatric: apple maggot fly
    const tree = (x, fruitCol, label) => `<rect x="${x - 6}" y="120" width="12" height="70" fill="#7a5a3a"/><ellipse cx="${x}" cy="100" rx="70" ry="52" fill="#7fae6a" stroke="#4d7a3f" stroke-width="1.5"/>${[[-35, 90], [-10, 70], [20, 95], [40, 75], [0, 115], [-45, 115], [48, 110]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${dy}" r="${fruitCol === "#c0392b" ? 8 : 5}" fill="${fruitCol}" stroke="#5a1d14" stroke-width=".8"/>`).join("")}${T(x - 12, 182, label, { w: 700, s: 24, a: "end" })}`;
    const HS = i >= 2 ? 300 : H; let s = `<rect width="${W}" height="${HS}" fill="#eef4e6"/><rect y="190" width="${W}" height="${HS - 190}" fill="#dfe8cf"/>`;
    s += tree(160, "#8e1b1b", "Hawthorn");
    if (i >= 1) s += tree(470, "#c0392b", "Apple");
    const hf = [[120, 60], [190, 50], [210, 130], [100, 135], [150, 30], [230, 90]], af = [[430, 55], [500, 45], [520, 130], [420, 140], [470, 25], [545, 85]];
    s += hf.map(([x, y]) => fly(x, y, "#2b2b2b")).join("");
    if (i >= 1) s += af.slice(0, i === 1 ? 2 : 6).map(([x, y]) => fly(x, y, "#2b2b2b")).join("");
    if (i === 1) s += `<path d="M240 70 C 300 30, 360 30, 410 55" fill="none" stroke="#5f6f7f" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#evsy)"/>`;
    if (i >= 2) { // ripening calendar, July to November: apples ripen about a month before hawthorn; each bar labelled
      const cx = (m) => 40 + 112 * m; s += [0, 1, 2, 3, 4, 5].map((k) => `<line x1="${cx(k)}" y1="206" x2="${cx(k)}" y2="292" stroke="#b9c7ae" stroke-width="1"/>`).join("");
      s += ["Jul", "Aug", "Sep", "Oct", "Nov"].map((m, k) => T(cx(k + 0.5), 224, m, { s: 22, c: GREY })).join("");
      s += `<rect x="${cx(1)}" y="232" width="${112 * 1.5}" height="24" rx="4" fill="#c0392b"/>${T(cx(1) - 8, 252, "Apple", { a: "end", s: 23, w: 700 })}`;
      s += `<rect x="${cx(2)}" y="264" width="${112 * 1.5}" height="24" rx="4" fill="#8e1b1b" stroke="#16263a" stroke-dasharray="4 3"/>${T(cx(2) - 8, 284, "Hawthorn", { a: "end", s: 23, w: 700 })}`; }
    if (i === 3) s += `<path d="M240 110 L 400 110" stroke="#7b3f98" stroke-width="2" stroke-dasharray="3 4"/>`;
    return svg(W, HS, ["Flies breeding on a hawthorn tree", "An apple tree in the same area; some flies move to it", "Flies on hawthorn and apple; a calendar shows apples ripening from August, about a month before hawthorn fruit", "Two host races of fly on hawthorn and apple, linked by a dotted line showing a little interbreeding"][i],
      `<defs><marker id="evsy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#5f6f7f"/></marker></defs>${s}`);
  }

  const CAPS = { allo: ["One population: one gene pool.", "The river separates west and east populations: no gene flow.", "Dry, sandy west bank: paler beetles. Damp east bank: darker beetles. Allele frequencies change in different ways.", "The river has dried and the beetles meet: western beetles breed in spring, eastern beetles in autumn."],
    sym: ["Flies breed on hawthorn fruit.", "Apple trees grow in the same area; some flies start to lay eggs in apples.", "Bars: apples ripen about a month before hawthorn fruit, so apple flies breed earlier.", "Two host races in the same area; the dotted line shows that a few hybrids are still produced."] };
  const sceneCaption = (mode, i) => CAPS[mode][i];

  // ---------------------------------------------------------------- consolidation figure: P, Q, R
  function curvesFig() {
    const W = 660, H = 220, pw = 150, gap = 20, top = 34, base = 170;
    const gauss = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
    const panel = (k, title, fn, col) => { const x0 = 10 + k * (pw + gap); const xs = []; for (let i = 0; i <= 60; i++) xs.push(-3.6 + (7.2 * i) / 60); /* wide enough for every curve to return to the axis */
      const before = xs.map((x) => gauss(x, 0, 1)), after = xs.map(fn); const mx = 1.9; /* every curve encloses the same area (same number of individuals) */
      const P = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${(x0 + (pw * i) / 60).toFixed(1)} ${(base - ((base - top) * v) / mx).toFixed(1)}`).join(" ");
      return `<line x1="${x0}" y1="${base}" x2="${x0 + pw}" y2="${base}" stroke="${INK}" stroke-width="1.3"/><line x1="${x0}" y1="${base}" x2="${x0}" y2="${top - 8}" stroke="${INK}" stroke-width="1.3"/>
        <path d="${P(before)}" fill="none" stroke="#8a96a3" stroke-width="2" stroke-dasharray="5 4"/>${col ? `<path d="${P(after)}" fill="none" stroke="${col}" stroke-width="2.6"/>` : ""}${T(x0 + pw / 2, 22, title, { w: 700, s: 15 })}${T(x0 + pw / 2, base + 22, "phenotype", { s: 13, c: GREY })}`; };
    return svg(W, H, "Four graphs of number of individuals against phenotype: the first shows the population before selection; graphs P, Q and R each show the same population before selection (dashed) and after selection (solid)",
      panel(0, "Before", () => 0, null).replace('stroke="#8a96a3" stroke-width="2" stroke-dasharray="5 4"', 'stroke="#16263a" stroke-width="2.6"') +
      panel(1, "P", (x) => gauss(x, 0.7, 1), "#1f6fb4") + panel(2, "Q", (x) => gauss(x, 0, 0.55) / 0.55, "#15803d") +
      panel(3, "R", (x) => (0.5 / 0.7) * (gauss(x, -1.2, 0.7) + gauss(x, 1.2, 0.7)), "#7b3f98") +
      T(330, 212, "Dashed line: before selection. Solid line: after selection. Vertical axis: number of individuals.", { s: 13, c: GREY }));
  }

  // curvesFig is used inside a question stem, where line breaks become <br>: return it on one line
  const curvesFig1 = () => curvesFig().replace(/\s*\n\s*/g, " ");
  B.evolutionArt = { chain, lines, strip, histogram, scene, sceneCaption, curvesFig: curvesFig1, RUNC, MODECOL };
})(window.BIO);
