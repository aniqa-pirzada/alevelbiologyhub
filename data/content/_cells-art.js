// Shared SVG artwork for 3.1.2 (cells). Every drawing is a labelled schematic: organelles are drawn with the
// membrane arrangement the specification expects (double membrane for nucleus, mitochondrion, chloroplast; single
// for ER, Golgi, lysosome, vacuole; none for ribosomes) but NOT to scale. Groups carry data-org="<key>" so the
// explorers can make them clickable; labels are drawn only when opts.labels is true.
window.BIO = window.BIO || {};
(function () {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", SAGE = "#6b9a7f", AMB = "#c8902a", NAVY = "#1e3a5f", ROSE = "#c25f5f";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 600}" fill="${o.c || INK}">${s}</text>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 1.2}"/>`;
  const label = (x, y, tx, ty, text, a = "start") => L(x, y, tx, ty) + T(tx + (a === "start" ? 4 : -4), ty + 4, text, { a, s: 11, w: 600, c: INK });
  // Leader label (release review 2026-11-15): the leader runs from the structure (x, y) to (tx, ty) and the text starts at
  // the leader's end, on the side away from the structure, so a leader never runs back through its own label.
  // Text to the right of the end ("start") when the structure is to the left, to the left ("end") when it is to the
  // right, and centred above or below the end when the leader is (nearly) vertical. o.s = font size (default 12).
  const lab = (x, y, tx, ty, text, o = {}) => {
    const s = o.s || 12, gap = 4; let ax, bx, by;
    if (Math.abs(tx - x) < 6) { ax = "middle"; bx = tx; by = ty < y ? ty - gap - 3 : ty + s + 2; }
    else if (tx > x) { ax = "start"; bx = tx + gap; by = ty + s * 0.36; }
    else { ax = "end"; bx = tx - gap; by = ty + s * 0.36; }
    return L(x, y, tx, ty, { c: o.lc || GREY, w: 1.3 }) + T(bx, by, text, { a: ax, s, w: 600, c: o.c || INK });
  };

  // ---------- organelle primitives (centred at cx,cy) ----------
  // Nuclear envelope: two continuous membranes that join at the edges of each pore, so every gap passes through both.
  const envelope = (cx, cy, rO, rI, pores, d, sw) => pores.slice().sort((p, q) => p - q).map((a, i, arr) => {
    const s = a + d, e = (i + 1 < arr.length ? arr[i + 1] : arr[0] + 2 * Math.PI) - d, lg = e - s > Math.PI ? 1 : 0;
    const P = (r, t) => `${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
    return `<path d="M${P(rI, s)} L${P(rO, s)} A${rO} ${rO} 0 ${lg} 1 ${P(rO, e)} L${P(rI, e)} A${rI} ${rI} 0 ${lg} 0 ${P(rI, s)}Z" fill="#cfdae8" stroke="${NAVY}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }).join("");
  const nucleus = (cx, cy, r = 46) => `<g data-org="nucleus"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#e4ebf5"/>${envelope(cx, cy, r, r - 5, [0.3, 1.3, 2.4, 3.4, 4.3, 5.4], 0.07, 1.8)}<circle cx="${cx + r * 0.25}" cy="${cy - r * 0.15}" r="${r * 0.3}" fill="#1e3a5f" opacity=".75"/><path d="M${cx - r * 0.6} ${cy + r * 0.2} q10 -14 22 0 t22 0 M${cx - r * 0.5} ${cy + r * 0.5} q10 -12 20 0 t20 0" fill="none" stroke="${NAVY}" stroke-width="1.5" opacity=".6"/></g>`;
  const mito = (cx, cy, rot = 0, sx = 1) => `<g data-org="mitochondrion" transform="translate(${cx},${cy}) rotate(${rot}) scale(${sx})"><ellipse cx="0" cy="0" rx="34" ry="16" fill="#fbf0d8" stroke="${AMB}" stroke-width="2.5"/><ellipse cx="0" cy="0" rx="29" ry="11" fill="none" stroke="${AMB}" stroke-width="1.8"/><path d="M-22 -9 v8 M-14 11 v-9 M-6 -9 v10 M2 11 v-10 M10 -9 v9 M18 11 v-8" fill="none" stroke="${AMB}" stroke-width="1.8"/></g>`;
  const chloro = (cx, cy, rot = 0) => `<g data-org="chloroplast" transform="translate(${cx},${cy}) rotate(${rot})"><ellipse cx="0" cy="0" rx="36" ry="18" fill="#e2efe6" stroke="${SAGE}" stroke-width="2.5"/><ellipse cx="0" cy="0" rx="31" ry="13" fill="none" stroke="${SAGE}" stroke-width="1.5"/>${[-18, -6, 6, 18].map((x) => `<g stroke="#2f6b4a" stroke-width="1.6"><line x1="${x - 4}" y1="-6" x2="${x + 4}" y2="-6"/><line x1="${x - 4}" y1="-2" x2="${x + 4}" y2="-2"/><line x1="${x - 4}" y1="2" x2="${x + 4}" y2="2"/><line x1="${x - 4}" y1="6" x2="${x + 4}" y2="6"/></g>`).join("")}<line x1="-14" y1="-2" x2="-10" y2="-2" stroke="#2f6b4a" stroke-width="1"/><line x1="-2" y1="2" x2="2" y2="2" stroke="#2f6b4a" stroke-width="1"/><line x1="10" y1="-2" x2="14" y2="-2" stroke="#2f6b4a" stroke-width="1"/></g>`;
  // ER and Golgi cisternae are flattened sacs: each is drawn as a wide stroke with a pale lumen inside it
  const sac = (d, col, w = 7) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${w - 4}" stroke-linecap="round"/>`;
  const rer = (cx, cy, extra = "") => `<g data-org="rer" transform="translate(${cx},${cy})">${extra ? sac(extra, TEAL) : ""}${sac("M-40 -16 q40 -12 80 0 M-40 0 q40 -12 80 0 M-40 16 q40 -12 80 0", TEAL)}${[-34, -20, -6, 8, 22, 36].map((x) => [-16, 0, 16].map((y) => `<circle cx="${x}" cy="${(y - 6.5 - 24 * ((x + 40) / 80) * (1 - (x + 40) / 80)).toFixed(1)}" r="2.2" fill="${INK}"/>`).join("")).join("")}</g>`;
  const ser = (cx, cy) => `<g data-org="ser" transform="translate(${cx},${cy})">${sac("M-36 -10 c10 -14 20 14 30 0 s20 -14 30 0 M-36 6 c10 -14 20 14 30 0 s20 -14 30 0 M-30 22 c10 -12 20 12 30 0 s20 -12 24 0", TEAL, 6)}</g>`;
  const golgi = (cx, cy) => `<g data-org="golgi" transform="translate(${cx},${cy})">${sac("M-34 -15 q34 -10 68 0 M-36 -4 q36 -10 72 0 M-34 7 q34 -10 68 0 M-30 18 q30 -10 60 0", ROSE, 6.5)}<circle cx="-44" cy="-20" r="4" fill="none" stroke="${ROSE}" stroke-width="1.6"/><circle cx="44" cy="-22" r="4" fill="none" stroke="${ROSE}" stroke-width="1.6"/><circle cx="38" cy="26" r="4" fill="none" stroke="${ROSE}" stroke-width="1.6"/><circle cx="-38" cy="26" r="4" fill="none" stroke="${ROSE}" stroke-width="1.6"/></g>`;
  // lysosome: a filled vesicle with enzyme dots, larger than the open Golgi vesicles so the two are not confused
  const lyso = (cx, cy) => `<g data-org="lysosome"><circle cx="${cx}" cy="${cy}" r="11" fill="#efc1c1" stroke="${ROSE}" stroke-width="2"/><circle cx="${cx - 3}" cy="${cy - 2}" r="2.2" fill="#8f3d3d"/><circle cx="${cx + 3}" cy="${cy + 3}" r="2" fill="#8f3d3d"/><circle cx="${cx + 4}" cy="${cy - 4}" r="1.6" fill="#8f3d3d"/></g>`;
  const ribos = (pts) => `<g data-org="ribosome">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${INK}"/>`).join("")}</g>`;
  const vacuole = (cx, cy, rx, ry) => `<g data-org="vacuole"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#e6f6f1" stroke="${TEAL}" stroke-width="2.2"/>${T(cx, cy + 4, "cell sap", { s: 14, w: 500, c: GREY })}</g>`;

  // ---------- Animal cell ----------
  // Unlabelled: viewBox cropped to the cell. opts.labels (the explorers' "Show all labels"): a wider viewBox with the
  // labels in the margins, each leader ending at the edge of its label nearest the structure.
  function animalCell(opts = {}) {
    let s = `<path d="M150 80 C 260 20, 520 30, 620 110 C 700 175, 680 330, 560 380 C 440 430, 200 420, 130 330 C 70 250, 80 130, 150 80z" fill="#f6f8f7" stroke="${INK}" stroke-width="3"/>`;
    s = `<g data-org="membrane">${s}</g>`;
    // one rough ER sac runs on to the nuclear envelope (the ER is continuous with the outer nuclear membrane)
    s += nucleus(330, 220, 52) + mito(500, 150, -20) + mito(540, 300, 25) + rer(220, 150, "M40 16 q20 4 29 22") + ser(200, 300) + golgi(470, 230) + lyso(250, 370) + lyso(600, 230) + ribos([[400, 120], [420, 135], [390, 320], [360, 350], [440, 330], [160, 220], [600, 175], [630, 280]]);
    s += T(300, 306, "cytoplasm", { s: 14, w: 500, c: GREY });
    if (opts.labels) {
      const o = { s: 15 };
      s += lab(330, 168, 330, 44, "nucleus", o) + lab(400, 117, 450, 40, "ribosomes", o) + lab(529, 141, 690, 84, "mitochondrion", o) + lab(186, 138, 60, 100, "rough ER", o) + lab(166, 306, 60, 340, "smooth ER", o) + lab(470, 258, 470, 432, "Golgi apparatus", o) + lab(250, 381, 250, 432, "lysosome", o) + lab(560, 380, 640, 432, "cell-surface membrane", o);
      return `<svg viewBox="-80 0 930 470" width="930" role="img" aria-label="labelled diagram of an animal cell">${s}</svg>`;
    }
    return `<svg viewBox="60 20 680 420" width="680" role="img" aria-label="diagram of an animal cell">${s}</svg>`;
  }

  // ---------- Plant cell ----------
  function plantCell(opts = {}) {
    let s = `<g data-org="wall"><rect x="90" y="40" width="580" height="360" rx="40" fill="#e2efe6" stroke="${SAGE}" stroke-width="10"/></g>`;
    s += `<g data-org="membrane"><rect x="104" y="54" width="552" height="332" rx="30" fill="#f6f8f7" stroke="${INK}" stroke-width="2.5"/></g>`;
    s += vacuole(400, 230, 150, 95);
    // every organelle lies inside the cell-surface membrane (Golgi and ribosomes moved clear of the wall, 2026-11-15)
    s += nucleus(200, 150, 44) + chloro(560, 120, -15) + chloro(590, 330, 20) + chloro(170, 330, 10) + mito(300, 100, 10, 0.8) + mito(320, 368, -10, 0.8) + rer(210, 250) + golgi(490, 348) + ribos([[400, 90], [430, 100], [250, 72], [630, 200], [150, 250], [560, 368]]);
    s += T(603, 262, "cytoplasm", { s: 14, w: 500, c: GREY });
    if (opts.labels) {
      const o = { s: 15 };
      s += lab(91, 110, 40, 95, "cell wall", o) + lab(156, 150, 40, 150, "nucleus", o) + lab(171, 250, 40, 250, "rough ER", o) + lab(300, 88, 300, 30, "mitochondrion", o) + lab(450, 137, 450, 30, "permanent vacuole", o) + lab(594, 110, 700, 90, "chloroplast", o) + lab(630, 200, 700, 200, "ribosomes", o) + lab(490, 374, 490, 432, "Golgi apparatus", o) + lab(200, 386, 200, 432, "cell-surface membrane", o);
      return `<svg viewBox="-80 0 900 470" width="900" role="img" aria-label="labelled diagram of a plant cell">${s}</svg>`;
    }
    return `<svg viewBox="76 26 608 388" width="608" role="img" aria-label="diagram of a plant cell">${s}</svg>`;
  }

  // ---------- Organelle detail diagrams ----------
  // Inner mitochondrial membrane drawn as ONE closed outline: each crista is a finger-like infolding of it, so both arms
  // of every fold join the inner membrane and the intermembrane space continues into the fold.
  const mitoInner = (() => {
    const cx = 330, cy = 150, a = 232, b = 88, w = 8, f = (n) => n.toFixed(1);
    const hh = (x) => b * Math.sqrt(Math.max(0, 1 - ((x - cx) / a) ** 2));
    const side = (x0, x1, folds, s) => {
      const dir = Math.sign(x1 - x0), out = []; let x = x0 + dir * 4;
      for (const X of folds) {
        const xa = X - dir * w, xb = X + dir * w, tip = cy + s * 0.25 * hh(X);
        for (; dir * (xa - x) > 0; x += dir * 4) out.push(`L${f(x)} ${f(cy + s * hh(x))}`);
        out.push(`L${f(xa)} ${f(cy + s * hh(xa))}`, `L${f(xa)} ${f(tip)}`, `A${w} ${w} 0 0 0 ${f(xb)} ${f(tip)}`, `L${f(xb)} ${f(cy + s * hh(xb))}`);
        x = xb + dir * 4;
      }
      for (; dir * (x1 - x) > 0; x += dir * 4) out.push(`L${f(x)} ${f(cy + s * hh(x))}`);
      return out.join(" ") + ` L${f(x1)} ${cy}`;
    };
    return `<path d="M${cx - a} ${cy} ${side(cx - a, cx + a, [165, 275, 385, 495], -1)} ${side(cx + a, cx - a, [440, 330, 220], 1)}Z" fill="#fff8ea" stroke="${AMB}" stroke-width="3" stroke-linejoin="round"/>`;
  })();
  const mitoDetail = `<svg viewBox="0 0 760 300" width="760" role="img" aria-label="ultrastructure of a mitochondrion">
    <ellipse cx="330" cy="150" rx="250" ry="105" fill="#fbf0d8" stroke="${AMB}" stroke-width="4"/>
    ${mitoInner}
    ${[[225, 110], [345, 140], [420, 115], [470, 190], [285, 195]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${INK}"/>`).join("")}
    <path d="M300 112 c4 -14 24 -16 30 -8 c8 -8 26 -4 26 8 c0 12 -18 14 -28 8 c-8 8 -30 6 -28 -8z" fill="none" stroke="${NAVY}" stroke-width="2"/>
    ${lab(330, 45, 330, 26, "outer membrane (smooth)")}${lab(530, 106, 630, 62, "inner membrane")}${lab(448, 205, 556, 262, "cristae (folds of inner membrane)")}
    ${lab(300, 108, 168, 36, "small circular DNA")}${lab(285, 195, 190, 270, "70S ribosomes")}${lab(530, 150, 650, 200, "matrix")}
    ${T(380, 292, "Double membrane; inner membrane folded into cristae; matrix holds enzymes, DNA and ribosomes. Not to scale (1 to 10 µm long).", { s: 12, w: 500, c: GREY })}
  </svg>`;

  const chloroDetail = `<svg viewBox="0 0 760 310" width="760" role="img" aria-label="ultrastructure of a chloroplast">
    <ellipse cx="330" cy="160" rx="250" ry="110" fill="#e2efe6" stroke="${SAGE}" stroke-width="4"/>
    <ellipse cx="330" cy="160" rx="234" ry="94" fill="#eef6f1" stroke="${SAGE}" stroke-width="3"/>
    ${[[200, 130], [330, 110], [450, 150], [260, 210], [400, 215]].map(([x, y]) => [0, 1, 2, 3, 4].map((i) => `<rect x="${x - 26}" y="${y + i * 7 - 14}" width="52" height="5" rx="2.5" fill="#2f6b4a"/>`).join("")).join("")}
    <path d="M226 128 q40 -30 78 -18 M356 112 q50 10 68 36 M286 206 q40 -14 88 8 M476 150 q-30 40 -50 62" fill="none" stroke="#2f6b4a" stroke-width="2"/>
    <ellipse cx="500" cy="210" rx="26" ry="12" fill="#fff" stroke="${SAGE}" stroke-width="1.5"/>
    ${[[160, 180], [190, 160], [520, 120], [540, 180]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${INK}"/>`).join("")}
    <path d="M150 215 c4 -14 24 -16 30 -8 c8 -8 26 -4 26 8 c0 12 -18 14 -28 8 c-8 8 -30 6 -28 -8z" fill="none" stroke="${NAVY}" stroke-width="2"/>
    ${lab(330, 50, 330, 28, "double membrane (chloroplast envelope)")}
    ${lab(190, 116, 156, 44, "granum (thylakoid stack)")}${lab(395, 123, 556, 54, "lamella (thylakoid linking grana)")}
    ${lab(526, 210, 636, 236, "starch grain")}${lab(540, 180, 636, 290, "70S ribosomes")}${lab(152, 221, 110, 292, "circular DNA")}${lab(330, 238, 330, 290, "stroma (fluid with enzymes)")}
  </svg>`;

  const nucleusDetail = `<svg viewBox="0 0 760 300" width="760" role="img" aria-label="ultrastructure of the nucleus">
    <circle cx="330" cy="150" r="118" fill="#e4ebf5"/>
    ${envelope(330, 150, 118, 104, [0, 0.75, 1.55, 2.35, 3.05, 3.8, 4.35, 5.25], 0.055, 3)}
    <circle cx="360" cy="130" r="30" fill="${NAVY}" opacity=".7"/>
    <path d="M250 180 q20 -30 40 0 t40 0 t40 0 M240 215 q20 -24 40 0 t40 0 t40 0 M260 110 q16 -20 32 0 t32 0" fill="none" stroke="${NAVY}" stroke-width="2" opacity=".6"/>
    ${lab(330, 32, 330, 26, "nuclear envelope: two membranes, joined around each nuclear pore")}
    ${lab(360, 130, 556, 90, "nucleolus (makes ribosomes)")}${lab(355, 215, 516, 250, "chromatin (DNA + histone proteins)")}${lab(441, 150, 556, 186, "nuclear pore")}
    ${T(380, 292, "The outer membrane of the envelope is continuous with the rough ER. Schematic, not to scale (nucleus about 10 µm).", { s: 12, w: 500, c: GREY })}
  </svg>`;

  const erGolgiDetail = `<svg viewBox="0 0 760 362" width="760" role="img" aria-label="rough and smooth endoplasmic reticulum, Golgi apparatus and lysosome">
    ${sac("M60 80 q80 -20 160 0 M60 110 q80 -20 160 0 M60 140 q80 -20 160 0 M60 170 q80 -20 160 0", TEAL, 10)}
    ${[70, 100, 130, 160, 190, 212].map((x) => [80, 110, 140, 170].map((y) => { const t = (x - 60) / 160; return `<circle cx="${x}" cy="${(y - 40 * t * (1 - t) - 9).toFixed(1)}" r="3.2" fill="${INK}"/>`; }).join("")).join("")}
    ${T(140, 42, "rough ER", { s: 13, w: 700 })}${T(140, 200, "flattened sacs (cisternae) with", { s: 11, w: 500, c: GREY })}${T(140, 214, "ribosomes attached: synthesises and", { s: 11, w: 500, c: GREY })}${T(140, 228, "transports proteins", { s: 11, w: 500, c: GREY })}
    ${sac("M290 80 c20 -26 40 26 60 0 s40 -26 60 0 M290 110 c20 -26 40 26 60 0 s40 -26 60 0 M290 140 c20 -26 40 26 60 0 s40 -26 60 0 M300 170 c20 -24 40 24 60 0 s40 -24 50 0", TEAL, 9)}
    ${T(360, 42, "smooth ER", { s: 13, w: 700 })}${T(360, 200, "tubular, no ribosomes:", { s: 11, w: 500, c: GREY })}${T(360, 214, "synthesises, stores and transports", { s: 11, w: 500, c: GREY })}${T(360, 228, "lipids and carbohydrates", { s: 11, w: 500, c: GREY })}
    ${sac("M500 70 q70 -18 140 0 M496 96 q74 -18 148 0 M496 122 q74 -18 148 0 M500 148 q70 -18 140 0 M506 174 q64 -18 128 0", ROSE, 10)}
    ${[[482, 58], [662, 56], [474, 110], [682, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="${ROSE}" stroke-width="2"/>`).join("")}
    ${[[520, 200], [600, 205], [655, 192]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#f9e3e3" stroke="${ROSE}" stroke-width="2"/>`).join("")}
    ${T(570, 42, "Golgi apparatus", { s: 13, w: 700 })}${T(570, 240, "stack of curved cisternae; vesicles arrive from", { s: 11, w: 500, c: GREY })}${T(570, 254, "the ER, proteins are modified (e.g. glycoproteins)", { s: 11, w: 500, c: GREY })}${T(570, 268, "and packaged into Golgi vesicles; some become lysosomes", { s: 11, w: 500, c: GREY })}
    <circle cx="140" cy="312" r="18" fill="#f9e3e3" stroke="${ROSE}" stroke-width="2.5"/><circle cx="135" cy="309" r="3" fill="${ROSE}"/><circle cx="146" cy="317" r="2.5" fill="${ROSE}"/>
    ${T(230, 309, "lysosome: a Golgi vesicle (single membrane) containing", { s: 11, w: 500, c: GREY, a: "start" })}${T(230, 323, "hydrolytic enzymes (e.g. proteases, lipases); digests worn-out organelles and pathogens", { s: 11, w: 500, c: GREY, a: "start" })}
    ${T(380, 352, "All single-membrane systems; ribosomes have no membrane. Schematic, not to scale.", { s: 11, w: 500, c: GREY })}
  </svg>`;

  // ---------- Microscopy comparison (illustrative only) ----------
  const microscopyPanels = (() => {
    const cap3 = (x, lines) => lines.map((l, i) => T(x, 252 + i * 15, l, { s: 12, w: 500, c: GREY })).join("");
    return `<svg viewBox="0 0 760 312" width="760" role="img" aria-label="illustrative comparison of a cell seen with light, transmission electron and scanning electron microscopes">
    <rect x="20" y="40" width="226" height="190" rx="10" fill="#f3efe4" stroke="#b9c9c4"/>
    <ellipse cx="133" cy="135" rx="90" ry="62" fill="#efe0d6" stroke="#b07a62" stroke-width="2"/><circle cx="150" cy="128" r="22" fill="#9a6b8a" opacity=".7"/>
    ${T(133, 28, "Light microscope", { s: 14, w: 700 })}${cap3(133, ["colour; living cells possible;", "whole cell and nucleus visible,", "no organelle detail (≈ 0.2 µm)"])}
    <rect x="267" y="40" width="226" height="190" rx="10" fill="#d7d7d7" stroke="#b9c9c4"/>
    <ellipse cx="380" cy="135" rx="92" ry="64" fill="#c4c4c4" stroke="#333" stroke-width="2"/><circle cx="398" cy="128" r="24" fill="#8a8a8a" stroke="#333" stroke-width="2" stroke-dasharray="6 2"/><circle cx="404" cy="122" r="8" fill="#444"/>
    <ellipse cx="330" cy="150" rx="22" ry="10" fill="#b0b0b0" stroke="#333" stroke-width="1.5"/><path d="M316 146 v8 M324 154 v-8 M332 146 v8 M340 154 v-8" stroke="#333" stroke-width="1.2"/>
    <path d="M320 100 q30 -8 60 0 M322 110 q30 -8 60 0" fill="none" stroke="#333" stroke-width="1.5"/>${[325, 340, 355, 370].map((x) => `<circle cx="${x}" cy="${96}" r="1.5" fill="#222"/>`).join("")}
    ${T(380, 28, "TEM", { s: 14, w: 700 })}${cap3(380, ["greyscale 2D section showing", "ultrastructure: cristae, ER,", "ribosomes (≈ 0.1 nm)"])}
    <rect x="514" y="40" width="226" height="190" rx="10" fill="#cfd6d4" stroke="#b9c9c4"/>
    <ellipse cx="627" cy="140" rx="88" ry="60" fill="#e9eeec" stroke="#555" stroke-width="2"/><ellipse cx="610" cy="122" rx="60" ry="36" fill="#f7f9f8" opacity=".8"/><ellipse cx="640" cy="160" rx="40" ry="22" fill="#b9c4c0" opacity=".6"/>
    ${T(627, 28, "SEM", { s: 14, w: 700 })}${cap3(627, ["greyscale 3D surface view;", "no internal detail", "(≈ 20 nm)"])}
    ${T(380, 304, "Illustrative drawings, not micrographs. Resolutions are typical textbook values.", { s: 12, w: 500, c: GREY })}
  </svg>`;
  })();

  // ---------- Prokaryotic cell ----------
  function prokaryote(opts = {}) {
    let s = `<g data-org="capsule"><rect x="70" y="60" width="620" height="260" rx="130" fill="#eef4f2" stroke="${GREY}" stroke-width="2" stroke-dasharray="8 5"/></g>`;
    s += `<g data-org="wall"><rect x="100" y="90" width="560" height="200" rx="100" fill="#e2efe6" stroke="${SAGE}" stroke-width="8"/></g>`;
    s += `<g data-org="membrane"><rect x="112" y="102" width="536" height="176" rx="88" fill="#f6f8f7" stroke="${INK}" stroke-width="2.5"/></g>`;
    s += `<g data-org="nucleoid"><path d="M300 190 c-40 -70 120 -90 150 -30 c30 60 -70 110 -110 60 c-20 -25 -50 -5 -40 -30z" fill="none" stroke="${NAVY}" stroke-width="3"/></g>`;
    s += `<g data-org="plasmid"><circle cx="200" cy="150" r="14" fill="none" stroke="${NAVY}" stroke-width="2.5"/><circle cx="520" cy="230" r="12" fill="none" stroke="${NAVY}" stroke-width="2.5"/></g>`;
    s += `<g data-org="ribosome">${[[180, 230], [230, 250], [260, 140], [500, 130], [560, 190], [430, 250], [340, 260], [580, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${INK}"/>`).join("")}</g>`;
    s += `<g data-org="flagellum"><path d="M648 190 h42 c30 -30 50 30 80 0 c20 -20 40 20 60 0" fill="none" stroke="${INK}" stroke-width="3"/></g>`;
    // opts.big (the cell explorer, which shows this wide drawing at about half size): the region label is drawn larger,
    // still in the cytoplasm, ending just left of the nucleoid
    s += opts.big ? T(286, 214, "cytoplasm", { s: 18, w: 500, c: GREY, a: "end" }) : T(255, 208, "cytoplasm", { s: 13, w: 500, c: GREY });
    if (opts.labels) {
      const o = { s: 15 };
      s += lab(640, 66, 690, 30, "capsule", o) + lab(240, 90, 240, 40, "cell wall (murein)", o) + lab(450, 160, 470, 40, "circular DNA", o) + lab(196, 163, 150, 326, "plasmid", o) + lab(380, 278, 380, 326, "cell-surface membrane", o) + lab(430, 250, 560, 330, "70S ribosomes", o) + lab(770, 195, 770, 250, "flagellum", o);
    }
    return `<svg viewBox="0 0 860 360" width="860" role="img" aria-label="labelled diagram of a generalised bacterial cell">${s}</svg>`;
  }

  // ---------- Cell fractionation steps ----------
  const fractionation = `<svg viewBox="0 0 760 330" width="760" role="img" aria-label="the steps of cell fractionation and differential centrifugation">
    <defs><marker id="arrf" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${INK}"/></marker></defs>
    <rect x="24" y="60" width="122" height="104" rx="8" fill="#e6f6f1" stroke="${TEAL}" stroke-width="2"/><path d="M50 154 q35 -16 70 0" fill="none" stroke="${TEAL}" stroke-width="3"/>${T(85, 40, "1 Homogenise", { s: 13, w: 700 })}${["tissue in cold,", "isotonic,", "buffered", "solution"].map((l, i) => T(85, 86 + i * 15, l, { s: 12, w: 500, c: GREY })).join("")}
    <path d="M150 110 l26 0" stroke="${INK}" stroke-width="2" marker-end="url(#arrf)"/>
    <path d="M190 60 l80 0 l-30 60 l0 50 l-20 0 l0 -50z" fill="#fff" stroke="${TEAL}" stroke-width="2"/><rect x="236" y="126" width="8" height="34" fill="#9ed9c8"/>${T(230, 40, "2 Filter", { s: 13, w: 700 })}${T(230, 192, "removes whole", { s: 12, w: 500, c: GREY })}${T(230, 207, "cells and debris", { s: 12, w: 500, c: GREY })}
    <path d="M280 110 l20 0" stroke="${INK}" stroke-width="2" marker-end="url(#arrf)"/>
    ${[[330, "3 Low speed", ["pellet 1:", "nuclei"]], [450, "4 Higher", ["pellet 2:", "mitochondria*"]], [570, "5 Higher still", ["pellet 3:", "lysosomes,", "ER fragments"]], [690, "6 Highest", ["pellet 4:", "ribosomes"]]].map(([x, t, lines], i) => `<path d="M${x - 22} 60 l0 110 a22 22 0 0 0 44 0 l0 -110" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M${x - 20} 100 l0 70 a20 20 0 0 0 40 0 l0 -70z" fill="#e6f6f1" opacity="${1 - i * 0.18}"/><path d="M${x - 16} 176 a16 16 0 0 0 32 0z" fill="${["#1e3a5f", "#c8902a", "#c25f5f", "#16263a"][i]}"/>${T(x, 40, t, { s: 13, w: 700 })}${lines.map((l, k) => T(x, 214 + k * 15, l, { s: 12, w: k ? 500 : 600, c: k ? GREY : INK })).join("")}${i < 3 ? `<path d="M${x + 30} 110 l52 0" stroke="${INK}" stroke-width="2" marker-end="url(#arrf)"/>` : ""}`).join("")}
    ${T(380, 272, "Each spin pellets the components that sediment fastest (mainly the largest). The supernatant", { s: 12, w: 500, c: GREY })}
    ${T(380, 288, "(arrows) is spun again, faster and for longer. Each pellet is enriched in, not purely, one component.", { s: 12, w: 500, c: GREY })}
    ${T(380, 312, "* Plant tissue: chloroplasts pellet after the nuclei, just before the mitochondria; the two fractions overlap.", { s: 12, w: 500, c: GREY })}
  </svg>`;

  // ---------- Organisation: cell → tissue → organ → system ----------
  const organisation = (() => {
    // palisade cell: tall, with a nucleus and many chloroplasts
    const pal = (x, y, w, h, nr) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(8, w / 4)}" fill="#f1f7f2" stroke="${SAGE}" stroke-width="2"/>` + Array.from({ length: Math.floor(h / 13) }, (_, k) => `<circle cx="${x + (k % 2 ? w * 0.7 : w * 0.3)}" cy="${y + 8 + k * 12}" r="${nr}" fill="#5f9c63"/>`).join("") + `<ellipse cx="${x + w / 2}" cy="${y + h * 0.55}" rx="${w * 0.22}" ry="${w * 0.2}" fill="${NAVY}" opacity=".55"/>`;
    return `<svg viewBox="0 0 760 214" width="760" role="img" aria-label="levels of organisation from specialised cell to organ system">
    <defs><marker id="arro" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${GREY}"/></marker></defs>
    ${pal(52, 30, 36, 104, 4)}${T(70, 160, "specialised cell", { s: 13, w: 700 })}${T(70, 177, "palisade cell", { s: 12, w: 500, c: GREY })}
    <path d="M110 82 l40 0" stroke="${GREY}" stroke-width="2" marker-end="url(#arro)"/>
    ${[0, 1, 2, 3, 4].map((i) => pal(166 + i * 24, 34, 22, 96, 3)).join("")}${T(225, 160, "tissue", { s: 13, w: 700 })}${T(225, 177, "palisade mesophyll", { s: 12, w: 500, c: GREY })}
    <path d="M300 82 l40 0" stroke="${GREY}" stroke-width="2" marker-end="url(#arro)"/>
    <path d="M360 100 q40 -80 130 -40 q-20 70 -130 40z" fill="#cfe5d3" stroke="${SAGE}" stroke-width="2"/><path d="M360 100 q60 -36 126 -38" fill="none" stroke="${SAGE}" stroke-width="1.5"/><path d="M360 100 l-12 18" stroke="${SAGE}" stroke-width="3"/>${T(420, 160, "organ", { s: 13, w: 700 })}${T(420, 177, "leaf", { s: 12, w: 500, c: GREY })}
    <path d="M500 82 l40 0" stroke="${GREY}" stroke-width="2" marker-end="url(#arro)"/>
    <path d="M610 138 C 608 110, 612 80, 610 30" fill="none" stroke="#7a8f5f" stroke-width="4"/><path d="M610 96 q-34 -24 -50 -6 q22 24 50 6z M611 70 q34 -26 52 -8 q-22 26 -52 8z M610 44 q-24 -22 -38 -8 q16 18 38 8z" fill="#cfe5d3" stroke="${SAGE}" stroke-width="2"/><path d="M590 138 h40" stroke="#8a6d4a" stroke-width="3"/>${T(610, 160, "organ system", { s: 13, w: 700 })}${T(610, 177, "shoot system", { s: 12, w: 500, c: GREY })}
    ${T(380, 204, "Animal example: epithelial cell → epithelium → stomach → digestive system (3.2.2.1).", { s: 12, w: 500, c: GREY })}
  </svg>`;
  })();

  // ---------- Organelle data (shared by notes, explorers and consolidation) ----------
  const organelles = [
    { key: "membrane", name: "Cell-surface (plasma) membrane", membrane: "single", size: "about 7 nm thick", structure: "A phospholipid bilayer with proteins (fluid-mosaic model, 3.1.4.1); in electron micrographs it appears as two dark lines with a pale line between.", func: "Controls what enters and leaves the cell; separates the cell from its surroundings; carries receptors for cell signalling.", sf: "The hydrophobic core limits the passage of polar molecules, so proteins control transport selectively.", slot: null },
    { key: "wall", name: "Cell wall", membrane: "none", only: ["plant"], structure: "A rigid layer outside the membrane made of cellulose microfibrils in plants (chitin in fungi). Between neighbouring plant cells is a middle lamella.", func: "Provides mechanical strength, prevents the cell bursting when water enters by osmosis, gives the cell its shape.", sf: "Parallel cellulose chains hydrogen-bonded into microfibrils give high tensile strength (3.1.1.2).", slot: null },
    { key: "nucleus", name: "Nucleus", membrane: "double", size: "about 10 µm", structure: "Bounded by a nuclear envelope (two membranes) with nuclear pores. Contains chromatin (DNA wound around histone proteins) and one or more nucleoli. Largest organelle.", func: "Contains the genetic material; controls the cell's activities through transcription; the nucleolus makes ribosomal RNA and assembles ribosomes.", sf: "Pores let mRNA and ribosomal subunits leave while keeping the DNA inside; the envelope is continuous with the rough ER.", slot: null },
    { key: "mitochondrion", name: "Mitochondrion", membrane: "double", size: "1 to 10 µm long", structure: "Rod-shaped; outer smooth membrane and inner membrane folded into cristae; fluid matrix containing enzymes, small circular DNA and 70S ribosomes.", func: "Site of the later stages of aerobic respiration (Krebs cycle in the matrix, oxidative phosphorylation on the cristae), producing ATP (3.3.3.3).", sf: "Cristae give a large surface area for the electron transport chain and ATP synthase; cells with high energy demand (muscle, sperm, epithelium) have many mitochondria.", slot: "mitochondrion-tem" },
    { key: "chloroplast", name: "Chloroplast", membrane: "double", only: ["plant"], size: "2 to 10 µm long", structure: "Disc-shaped; double membrane (envelope); inside, flattened thylakoid membranes stacked into grana and linked by lamellae, surrounded by the fluid stroma, which contains enzymes, starch grains, circular DNA and 70S ribosomes.", func: "Site of photosynthesis: the light-dependent reaction on the thylakoid membranes (chlorophyll), the light-independent reaction in the stroma (3.3.2).", sf: "Stacked grana give a large membrane area for chlorophyll and the electron transport chain; the stroma holds the enzymes of the Calvin cycle close by.", slot: "chloroplast-tem" },
    { key: "golgi", name: "Golgi apparatus", membrane: "single", structure: "A stack of flattened, curved membrane sacs (cisternae) with small vesicles budding from the edges.", func: "Modifies proteins from the ER (adds carbohydrate to make glycoproteins) and also modifies lipids (e.g. making glycolipids); packages them into Golgi vesicles for secretion or for use in the cell; produces lysosomes.", sf: "Well developed in secretory cells (e.g. goblet cells, pancreatic cells).", slot: "golgi-tem" },
    { key: "lysosome", name: "Lysosome", membrane: "single", size: "up to 1 µm", structure: "A spherical vesicle, formed by the Golgi, containing many hydrolytic enzymes (e.g. proteases, lipases).", func: "Breaks down worn-out organelles and cells, and pathogens taken in by phagocytosis (3.2.5.1); releases enzymes outside the cell when needed.", sf: "The membrane keeps the enzymes away from the rest of the cell.", slot: null },
    { key: "ribosome", name: "Ribosome", membrane: "none", size: "about 25 nm (80S) / 20 nm (70S)", structure: "Two subunits of ribosomal RNA and protein; free in the cytoplasm or attached to the rough ER. Eukaryotic cytoplasmic ribosomes are 80S; those inside mitochondria and chloroplasts, and in prokaryotes, are smaller 70S.", func: "Site of protein synthesis (translation, 3.1.8.2).", sf: "Free ribosomes make proteins used in the cytoplasm; ER-bound ribosomes make proteins for export or for membranes.", slot: null },
    { key: "rer", name: "Rough endoplasmic reticulum", membrane: "single", structure: "A network of flattened membrane sacs (cisternae) continuous with the nuclear envelope, studded with ribosomes.", func: "Synthesises proteins on its ribosomes and transports them through the cell, usually to the Golgi.", sf: "Large surface area for ribosomes; extensive in cells that secrete protein.", slot: "rer-tem" },
    { key: "ser", name: "Smooth endoplasmic reticulum", membrane: "single", structure: "Tubular membrane network with no ribosomes.", func: "Synthesises, stores and transports lipids and carbohydrates.", sf: "Extensive in cells that make lipids or steroid hormones.", slot: null },
    { key: "vacuole", name: "Cell vacuole", membrane: "single", only: ["plant"], structure: "A large, permanent fluid-filled sac in mature plant cells, bounded by a single membrane called the tonoplast; contains cell sap (water, sugars, ions, pigments).", func: "Maintains turgor (pressure) that supports the cell and the plant; stores sugars and ions; may contain pigments or waste.", sf: "Pushing the cytoplasm against the wall keeps non-woody plants upright.", slot: null },
  ];
  const prokOrganelles = [
    { key: "wall", name: "Cell wall (murein)", membrane: "none", structure: "A rigid wall containing murein (peptidoglycan), a glycoprotein; always present.", func: "Protects the cell and prevents it bursting when water enters by osmosis.", note: "Chemically different from plant cell walls (cellulose) and fungal walls (chitin)." },
    { key: "membrane", name: "Cell-surface membrane", membrane: "single", structure: "Phospholipid bilayer with proteins, like the eukaryotic membrane.", func: "Controls entry and exit of substances; in prokaryotes many reactions of respiration take place on it, since there are no mitochondria." },
    { key: "nucleoid", name: "Circular DNA (nucleoid)", membrane: "none", structure: "A single, circular DNA molecule lying free in the cytoplasm, not associated with histone proteins and not enclosed by a membrane.", func: "Carries the genes for the cell's proteins.", note: "There is no nucleus: this is the defining difference from eukaryotes." },
    { key: "plasmid", optional: true, name: "Plasmid", membrane: "none", structure: "Small circular DNA molecule separate from the main chromosome; present in many but not all bacteria, in variable numbers.", func: "Carries extra genes, for example for antibiotic resistance; can be passed between bacteria (conjugation, 3.2.10.3) and is used as a vector in recombinant DNA technology (3.4.10.4)." },
    { key: "ribosome", name: "70S ribosome", membrane: "none", structure: "Smaller than the eukaryotic cytoplasmic (80S) ribosome.", func: "Protein synthesis.", note: "Some antibiotics act on 70S but not 80S ribosomes, which is why they harm bacteria but not our cells." },
    { key: "capsule", optional: true, name: "Capsule", membrane: "none", structure: "A slimy polysaccharide layer outside the cell wall; present in some bacteria only.", func: "Protects against drying out and against phagocytosis by white blood cells; helps cells stick together or to surfaces." },
    { key: "flagellum", optional: true, name: "Flagellum", membrane: "none", structure: "A long, thin protein filament (one or more) anchored in the membrane; present in some bacteria only. Structurally different from the eukaryotic flagellum.", func: "Rotates to move the cell." },
  ];

  window.BIO.cellArt = { organelles, prokOrganelles, animalCell, plantCell, prokaryote, mitoDetail, chloroDetail, nucleusDetail, erGolgiDetail, microscopyPanels, fractionation, organisation, T, L, label, lab };
})();
