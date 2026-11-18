// Drawings for 3.3.3.3 Aerobic respiration and 3.3.3.4 Respiratory substrates (Phase 5 Batch 2, author A2). Loaded
// after 3.3.3.2.js, before _resp-model.js, 3.3.3.3.js, 3.3.3.4.js and js/views/interactives-mito.js.
// B.mitoArt: mito (whole mitochondrion, Mitochondrion Explorer and the labelling question), krebs (Link and Krebs
// Stepper), oxphos (Oxidative Phosphorylation Model and Disruption Challenge), substrates (static figure, 3.3.3.4),
// rqScale (RQ Calculator scale).
// Conventions (A2-MODEL.md, reviewed 2026-11-17):
// - Membrane section: INTERMEMBRANE SPACE at the top, MATRIX at the bottom. Electron carriers pump protons UP, from the
//   matrix into the intermembrane space; protons flow DOWN through the channel of ATP synthase into the matrix; the
//   head of ATP synthase, where ADP + Pi -> ATP, is in the matrix. Oxygen accepts electrons and protons on the matrix
//   side of the last carrier, forming water. Every arrow has a drawn arrowhead and words, so direction is visible in a
//   still picture and with reduced motion.
// - Whole mitochondrion: schematic, not to scale; the cristae are infoldings of the inner membrane, so the space inside
//   each fold is continuous with the intermembrane space.
// Every label is our own SVG text, 13 to 15 units, at least 12 px at 1280 px wide.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5b6573", WHITE = "#ffffff";
  const CYTO = "#eef1f5", IMS = "#fbe1d6", MAT = "#fff3cc", OUTS = "#8f4f25", INS = "#b8561f", SEL = "#e0a400", HI = "#ffe08a";
  const MEM = "#f2e6bd", HEAD = "#cdb064", HP = "#b3261e", EL = "#1d5fae", ATPC = "#a8520c", OXY = "#1c7aa3", CARB = "#3b4a5a", CO2C = "#6d6d6d", NADC = "#2f7d4f";
  let cnt = 0, U = ""; const uid = () => (U = "-mt" + (++cnt));
  const r1 = (x) => Math.round(x * 10) / 10;
  const T = (x, y, s, o = {}) => { const lines = String(s).split("\n"); const lh = (o.s || 14) * 1.2;
    return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || INK}">${lines.map((l, i) => `<tspan x="${r1(x)}" dy="${i ? lh.toFixed(1) : 0}">${l}</tspan>`).join("")}</text>`; };
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.c || INK}" stroke-width="${o.w || 1.5}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const P = (d, o = {}) => `<path d="${d}" fill="${o.f || "none"}" stroke="${o.c || INK}" stroke-width="${o.w || 2}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="10" markerHeight="10" refX="7.5" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10z" fill="${col}"/></marker>`;
  const defs = (list) => `<defs>${list.map(([i, c]) => marker(i, c)).join("")}</defs>`;
  const svg = (w, h, aria, inner, cls) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${aria}"${cls ? ` class="${cls}"` : ""} style="max-width:100%;height:auto;display:block" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">${inner}</svg>`;
  const lead = (x1, y1, x2, y2) => L(x1, y1, x2, y2, { c: INK, w: 1.3 }) + `<circle cx="${r1(x2)}" cy="${r1(y2)}" r="2.6" fill="${INK}"/>`;
  const X = (x, y, s = 13) => `<g stroke="${HP}" stroke-width="5" stroke-linecap="round"><line x1="${x - s}" y1="${y - s}" x2="${x + s}" y2="${y + s}"/><line x1="${x + s}" y1="${y - s}" x2="${x - s}" y2="${y + s}"/></g>`;
  const hplus = (x, y, o = {}) => T(x, y, "H⁺", { s: o.s || 14, w: 700, c: o.c || HP });
  const numBadge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="17" fill="${INK}" stroke="${WHITE}" stroke-width="2"/>` + T(x, y + 7, String(n), { s: 20, w: 800, c: WHITE });

  // ===================================== Whole mitochondrion =====================================
  // o.labels (default true), o.sel (part key), o.stage ("glycolysis" | "entry" | "link" | "krebs" | "oxphos"), o.num (numbered
  // version for the labelling question: 1 outer membrane, 2 inner membrane, 3 crista, 4 matrix, 5 intermembrane space).
  // Outer membrane: stadium x 60..600, y 70..290 (end radius 110). Inner membrane: stadium inset 14 (y 84..276, radius 96)
  // with five infoldings (cristae) from the top and five from the bottom, depth 85, width 16.
  const TOPF = [200, 260, 320, 380, 440], BOTF = [230, 290, 350, 410, 470], FD = 85, FW = 8;
  function innerPath() {
    let d = "M170 84";
    for (const c of TOPF) d += ` L${c - FW} 84 L${c - FW} ${84 + FD - FW} A${FW} ${FW} 0 0 0 ${c + FW} ${84 + FD - FW} L${c + FW} 84`;
    d += " L490 84 A96 96 0 0 1 490 276";
    for (const c of [...BOTF].reverse()) d += ` L${c + FW} 276 L${c + FW} ${276 - FD + FW} A${FW} ${FW} 0 0 0 ${c - FW} ${276 - FD + FW} L${c - FW} 276`;
    return d + " L170 276 A96 96 0 0 1 170 84 Z";
  }
  // label anchor (text position) and leader end (on the structure) for each part
  const MLAB = {
    outer: { n: 1, name: "outer membrane", tx: 112, ty: 36, ex: 178, ey: 71 },
    inner: { n: 2, name: "inner membrane", tx: 300, ty: 36, ex: 290, ey: 85 },
    crista: { n: 3, name: "crista (fold of the\ninner membrane)", tx: 520, ty: 30, ex: 449, ey: 120 },
    matrix: { n: 4, name: "matrix", tx: 330, ty: 334, ex: 330, ey: 232 },
    ims: { n: 5, name: "intermembrane space", tx: 160, ty: 334, ex: 200, ey: 283 },
  };
  function mito(o = {}) {
    uid(); const labels = o.labels !== false, sel = o.sel || null, st = o.stage || null, num = !!o.num;
    const hi = (k) => sel === k || (st === "glycolysis" && k === "cyto") || ((st === "link" || st === "krebs") && k === "matrix") || (st === "oxphos" && (k === "inner" || k === "crista")) || (st === "entry" && k === "matrix");
    let s = defs([["ink", INK], ["pv", "#5d3d8c"]]);
    s += `<rect data-part="cyto" x="0" y="0" width="660" height="360" fill="${hi("cyto") ? HI : CYTO}" style="cursor:pointer"/>`;
    s += `<rect data-part="ims" x="60" y="70" width="540" height="220" rx="110" fill="${hi("ims") || (st === "oxphos") ? "#f7c3ad" : IMS}" stroke="${hi("outer") ? SEL : OUTS}" stroke-width="${hi("outer") ? 7 : 4}" style="cursor:pointer"/>`;
    // the outer membrane as its own clickable ring (a wide transparent stroke on top of the visible one)
    s += `<rect data-part="outer" x="60" y="70" width="540" height="220" rx="110" fill="none" stroke="transparent" stroke-width="12" style="cursor:pointer"/>`;
    const ip = innerPath(); const ihi = hi("inner") || (st === "oxphos");
    s += `<path data-part="matrix" d="${ip}" fill="${hi("matrix") ? HI : MAT}" stroke="${ihi ? SEL : INS}" stroke-width="${ihi ? 6.5 : 4}" stroke-linejoin="round" style="cursor:pointer"/>`;
    if (sel === "crista") s += TOPF.concat(BOTF).map((c, i) => { const top = i < TOPF.length; const y0 = top ? 84 : 276, d = top ? FD : -FD; return P(`M${c - FW} ${y0} L${c - FW} ${y0 + d - (top ? FW : -FW)} A${FW} ${FW} 0 0 ${top ? 0 : 1} ${c + FW} ${y0 + d - (top ? FW : -FW)} L${c + FW} ${y0}`, { c: SEL, w: 6.5 }); }).join("");
    s += `<path data-part="inner" d="${ip}" fill="none" stroke="transparent" stroke-width="12" style="cursor:pointer"/>`;
    // one crista outlined for the crista part (clicking any fold selects "crista")
    s += TOPF.concat(BOTF).map((c, i) => { const top = i < TOPF.length; const y0 = top ? 84 : 276, y1 = top ? 84 + FD : 276 - FD; return `<rect data-part="crista" x="${c - FW - 5}" y="${Math.min(y0, y1)}" width="${2 * FW + 10}" height="${FD}" fill="transparent" style="cursor:pointer"/>`; }).join("");
    if (st === "entry") s += P("M16 180 C50 180 70 180 136 180", { c: "#5d3d8c", w: 3.2, m: "pv" }) + T(4, 160, "pyruvate", { s: 13, w: 700, c: "#5d3d8c", a: "start" }) + T(150, 186, "active transport", { s: 13, w: 600, c: "#5d3d8c", a: "start" });
    if (labels && !num) for (const [k, l] of Object.entries(MLAB)) s += lead(l.tx, l.ty + (l.name.includes("\n") ? 22 : (l.ty > 100 ? -16 : 6)), l.ex, l.ey) + T(l.tx, l.ty, l.name, { s: 14, w: sel === k ? 800 : 600 });
    if (labels && !num) s += T(650, 352, "cytoplasm", { s: 14, w: 700, c: GREY, a: "end" });
    if (num) for (const l of Object.values(MLAB)) s += lead(l.tx, l.ty + (l.ty < 100 ? 14 : -14), l.ex, l.ey) + numBadge(l.tx, l.ty, l.n);
    return svg(660, 360, num ? "Drawing of a mitochondrion with five numbered structures" : "Section through a mitochondrion in the cytoplasm. A smooth outer membrane surrounds an inner membrane folded into cristae. The narrow intermembrane space lies between the two membranes and continues into each fold; the matrix fills the inside of the inner membrane.", s, "mito-svg");
  }

  // ===================================== Link reaction and Krebs cycle (stepper) =====================================
  // st: a state from B.krebsModel.states(basis); o.step: the step id. Carbon atoms are beads, so they can be counted.
  const beads = (cx, y, n, col = CARB) => { const x0 = cx - (n - 1) * 8; let s = ""; for (let i = 0; i < n; i++) s += (i ? L(x0 + (i - 1) * 16 + 6, y, x0 + i * 16 - 6, y, { c: col, w: 2.2 }) : "") + `<circle cx="${r1(x0 + i * 16)}" cy="${y}" r="6.5" fill="${col}"/>`; return s; };
  const coaTag = (x, y) => `<rect x="${x}" y="${y - 11}" width="40" height="22" rx="11" fill="#e3d4f3" stroke="#6a3893" stroke-width="1.6"/>` + T(x + 20, y + 5, "CoA", { s: 13, w: 700, c: "#4b2470" });
  const co2 = (x, y) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${CO2C}"/>` + T(x + 12, y + 5, "CO₂", { s: 14, w: 700, c: CO2C, a: "start" });
  const K = { cx: 450, cy: 178, r: 90 };
  const arc = (a0, a1) => { const p = (a) => [K.cx + K.r * Math.cos(a), K.cy + K.r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${r1(x0)} ${r1(y0)} A${K.r} ${K.r} 0 0 1 ${r1(x1)} ${r1(y1)}`; };
  // Layout: link reaction on the left (y 112); the cycle on the right (centre 450, 178), drawn clockwise; the four-carbon
  // acceptor waits outside the cycle on the left; the 6C, 5C and 4C molecules sit inside the cycle beside their arc; the
  // products of the current step are written outside the cycle beside the highlighted arc.
  const STEP_CO2 = { ox: 1, c5: 1, c4: 1 };
  function krebs(st, o = {}) {
    uid(); const id = st.step, two = st.k === 2; const tag = (x, y) => (two ? T(x, y, "× 2", { s: 14, w: 800, c: "#7a1f6b", a: "start" }) : "");
    let s = defs([["ink", INK], ["sel", "#9a6a00"], ["pv", "#5d3d8c"], ["cp", "#6a3893"]]);
    s += `<rect x="0" y="0" width="100" height="330" fill="${CYTO}"/><rect x="100" y="0" width="12" height="330" fill="${IMS}"/><rect x="112" y="0" width="548" height="330" fill="${MAT}"/>`;
    s += L(100, 0, 100, 330, { c: OUTS, w: 3 }) + L(112, 0, 112, 330, { c: INS, w: 3 });
    s += T(50, 22, "cytoplasm", { s: 14, w: 700, c: GREY }) + T(124, 22, "matrix of the mitochondrion", { s: 14, w: 700, c: "#7a5a00", a: "start" }) + T(K.cx, 40, "Krebs cycle", { s: 16, w: 800, c: "#7a5a00" });
    const segs = { c5: [-Math.PI / 2 + 0.18, -0.18], c4: [0.18, Math.PI / 2 - 0.18], regen: [Math.PI / 2 + 0.18, Math.PI - 0.18], c6: [Math.PI + 0.18, 1.5 * Math.PI - 0.18] };
    for (const [k, [a0, a1]] of Object.entries(segs)) { const on = k === id; s += P(arc(a0, a1), { c: on ? SEL : "#c9b274", w: on ? 5 : 3, m: on ? "sel" : "ink" }); }
    const m = st.mol;
    if (m.pyr) { const inCyto = id === "start"; const x = inCyto ? 50 : 168; s += beads(x, 112, 3, "#5d3d8c") + T(x, 140, inCyto ? "pyruvate" : "pyruvate (3C)", { s: 14, w: 700, c: "#5d3d8c" }) + (inCyto ? T(x, 157, "(3C)", { s: 14, w: 700, c: "#5d3d8c" }) : "") + tag(x + 26, 117);
      if (id === "enter") s += P("M64 92 C92 74 128 74 150 96", { c: "#5d3d8c", w: 2.6, m: "pv" }) + T(150, 62, "active transport", { s: 13, w: 600, c: "#5d3d8c", a: "start" }); }
    if (m.ace) s += beads(214, 112, 2) + T(214, 140, "acetate (2C)", { s: 14, w: 700 }) + tag(232, 117);
    if (m.acoa) s += beads(190, 112, 2) + coaTag(208, 112) + T(220, 140, "acetylcoenzyme A", { s: 14, w: 700 }) + tag(252, 92);
    const n2 = two ? "2 " : "";
    if (id === "ox") s += T(214, 74, n2 + "CO₂ released ↓", { s: 14, w: 700, c: CO2C }) + T(214, 250, two ? "2 NAD → 2 reduced NAD" : "NAD → reduced NAD", { s: 14, w: 700, c: NADC });
    if (id === "coa") s += T(220, 250, "coenzyme A joins acetate", { s: 14, w: 600, c: "#4b2470" });
    if (m.acoa || id === "c6") s += P(id === "c6" ? "M298 112 C320 120 336 138 352 156" : "M256 118 C300 126 330 140 352 156", { c: id === "c6" ? SEL : "#b3b3b3", w: id === "c6" ? 4 : 2, m: id === "c6" ? "sel" : "ink", d: id === "c6" ? "" : "5 4" });
    if (id === "c6") s += T(220, 112, "acetyl group (2C)", { s: 14, w: 700 }) + T(220, 129, "joins the 4C molecule", { s: 13, w: 600, c: GREY }) + coaTag(170, 200) + P("M168 194 C150 180 150 160 162 146", { c: "#6a3893", w: 2, m: "cp" }) + T(190, 236, "coenzyme A released", { s: 13, w: 600, c: "#4b2470" });
    if (m.acc) s += beads(300, 178, 4) + T(300, 206, "four-carbon", { s: 14, w: 700 }) + T(300, 223, "molecule", { s: 14, w: 700 }) + tag(330, 160);
    if (m.c6) s += beads(K.cx, 120, 6) + T(K.cx, 146, "six-carbon molecule", { s: 14, w: 700 }) + tag(K.cx + 48, 106);
    if (m.c5) s += beads(494, 178, 5) + T(492, 204, "five-carbon", { s: 14, w: 700 }) + T(492, 221, "molecule", { s: 14, w: 700 }) + tag(466, 160);
    if (m.c4) s += beads(K.cx, 240, 4) + T(K.cx, 222, "four-carbon molecule", { s: 14, w: 700 }) + tag(K.cx + 32, 245);
    if (id === "c5") s += T(546, 100, n2 + "CO₂", { s: 14, w: 700, c: CO2C, a: "start" }) + T(546, 120, n2 + "reduced NAD", { s: 14, w: 700, c: NADC, a: "start" });
    if (id === "c4") s += T(546, 260, n2 + "CO₂", { s: 14, w: 700, c: CO2C, a: "start" }) + T(546, 280, n2 + "reduced NAD", { s: 14, w: 700, c: NADC, a: "start" }) + T(546, 298, n2 + "ATP", { s: 14, w: 700, c: ATPC, a: "start" });
    if (id === "regen") s += T(378, 276, n2 + "reduced FAD", { s: 14, w: 700, c: NADC, a: "end" }) + T(378, 294, n2 + "reduced NAD", { s: 14, w: 700, c: NADC, a: "end" });
    // running tray: one grey bead for every CO2 released so far (all of them, per the chosen basis), so the beads drawn
    // always add up to the carbon total in the ledger (molecules x 1 or x 2, plus this tray)
    s += T(124, 322, "CO₂ released so far:", { s: 14, w: 700, c: CO2C, a: "start" });
    const newC = (STEP_CO2[id] || 0) * st.k;
    for (let i = 0; i < st.co2; i++) s += `<circle cx="${276 + i * 17}" cy="317" r="6.5" fill="${CO2C}"${i >= st.co2 - newC ? ` stroke="${SEL}" stroke-width="3"` : ""}/>`;
    if (!st.co2) s += T(276, 322, "none yet", { s: 14, w: 600, c: GREY, a: "start" });
    return svg(660, 330, `Link reaction and Krebs cycle, ${two ? "per glucose (two of each molecule)" : "per pyruvate"}. Carbon atoms are shown as beads.`, s, "krebs-svg");
  }

  // ===================================== Oxidative phosphorylation (inner membrane) =====================================
  // o.r: indices from B.oxphosModel (gradient 0..200 sets the number of H+ drawn in the intermembrane space);
  // o.dis: disruption key ("none" | "noO2" | "cyanide" | "atps" | "uncoupler"); o.fad: show reduced FAD (default true).
  const MY0 = 150, MY1 = 210;
  const OX_PATHS = {
    e: "M146 262 L146 182 L222 182 L280 182 L350 182 L408 182 L408 250",
    h1: "M174 262 L174 98", h2: "M292 262 L292 98", h3: "M432 262 L432 98",
    hs: "M580 104 L580 236", l1: "M246 108 L246 214", l2: "M374 108 L374 224", l3: "M510 108 L510 224",
  };
  const IMS_H = [[150, 112], [262, 120], [330, 104], [214, 128], [390, 116], [470, 108], [520, 126], [120, 128], [316, 134], [452, 134], [366, 132], [246, 104], [490, 132], [110, 104], [505, 92], [540, 104]];
  function oxphos(o = {}) {
    uid(); const r = o.r || { gradient: 100 }, dis = o.dis || "none";
    let s = defs([["hp", HP], ["el", EL], ["ink", INK], ["at", ATPC], ["ox", OXY]]);
    s += `<rect x="0" y="0" width="660" height="${MY0}" fill="${IMS}"/><rect x="0" y="${MY1}" width="660" height="${400 - MY1}" fill="${MAT}"/>`;
    s += T(12, 22, "INTERMEMBRANE SPACE", { s: 15, w: 800, a: "start", c: "#7a3a1c" }) + T(12, 40, "high H⁺ concentration", { s: 13, a: "start", c: "#7a3a1c" });
    s += T(12, 392, "MATRIX", { s: 15, w: 800, a: "start", c: "#7a5a00" }) + T(12, 374, "low H⁺ concentration", { s: 13, a: "start", c: "#7a5a00" });
    // bilayer (gaps where an uncoupler lets protons leak)
    let bil = `<rect x="0" y="${MY0}" width="660" height="${MY1 - MY0}" fill="${MEM}"/>`;
    for (let x = 4; x < 660; x += 9) { if (dis === "uncoupler" && [246, 374, 510].some((c) => Math.abs(x - c) < 9)) continue; bil += `<circle cx="${x}" cy="${MY0 + 4}" r="4" fill="${HEAD}"/><circle cx="${x}" cy="${MY1 - 4}" r="4" fill="${HEAD}"/>`; }
    s += bil + T(58, 176, "inner", { s: 13, w: 700, c: "#5e4f1c" }) + T(58, 193, "membrane", { s: 13, w: 700, c: "#5e4f1c" });
    // protons in the intermembrane space: number follows the gradient index (8 at normal)
    const nH = Math.max(0, Math.min(16, Math.round((r.gradient / 200) * 16)));
    s += IMS_H.slice(0, nH).map(([x, y]) => hplus(x, y, { s: 13 })).join("");
    s += hplus(262, 360, { s: 13 }) + hplus(540, 366, { s: 13 });
    // electron carriers (three pumps and two small mobile carriers)
    const pump = (cx) => `<rect x="${cx - 30}" y="${MY0 - 14}" width="60" height="${MY1 - MY0 + 28}" rx="10" fill="#c7daf3" stroke="${EL}" stroke-width="2"/>`;
    s += pump(160) + pump(292) + pump(420) + `<circle cx="222" cy="182" r="11" fill="#dce8f8" stroke="${EL}" stroke-width="2"/><circle cx="350" cy="182" r="11" fill="#dce8f8" stroke="${EL}" stroke-width="2"/>`;
    // electron path (dashed), from reduced NAD to oxygen
    s += P(OX_PATHS.e, { c: EL, w: 2.6, m: "el", d: "6 4" });
    s += T(146, 290, "reduced NAD", { s: 14, w: 700, c: NADC }) + T(146, 307, "→ NAD", { s: 13, w: 600, c: NADC });
    if (o.fad !== false) s += T(232, 336, "reduced FAD", { s: 14, w: 700, c: NADC }) + P("M204 322 L216 197", { c: EL, w: 2, m: "el", d: "4 3" });
    // protons pumped from the matrix into the intermembrane space (arrowheads point up)
    const pv = !!o.preview; const pumping = pv || (!["noO2", "cyanide"].includes(dis) && r.o2 > 0.5);
    s += ["h1", "h2", "h3"].map((k) => P(OX_PATHS[k], { c: pumping ? HP : "#d8a6a2", w: 3, m: "hp" })).join("");
    s += T(330, 70, "↑ carriers pump H⁺ from the matrix", { s: 13, w: 700, c: HP }) + T(330, 86, "into the intermembrane space", { s: 13, w: 700, c: HP });
    // oxygen, the final electron acceptor, forms water on the matrix side of the last carrier
    const noO2 = dis === "noO2";
    s += T(440, 280, noO2 ? "no oxygen" : "½O₂ + 2H⁺ + 2e⁻ → H₂O", { s: 14, w: 700, c: noO2 ? HP : OXY }) + T(440, 298, "oxygen: final electron acceptor", { s: 13, w: 600, c: noO2 ? GREY : OXY });
    if (dis === "cyanide") s += X(408, 236, 13);
    // ATP synthase: channel across the membrane, stalk and head in the matrix; protons flow down through it
    const aX = 580, blocked = dis === "atps";
    s += `<rect x="${aX - 15}" y="${MY0 - 8}" width="30" height="${MY1 - MY0 + 16}" rx="6" fill="#f0c9a3" stroke="${ATPC}" stroke-width="2"/><rect x="${aX - 6}" y="${MY1 + 8}" width="12" height="20" fill="${ATPC}"/><ellipse cx="${aX}" cy="${MY1 + 50}" rx="32" ry="23" fill="#f0c9a3" stroke="${ATPC}" stroke-width="2.4"/>`;
    s += T(aX, 22, "ATP synthase", { s: 14, w: 800, c: ATPC }) + T(aX, 40, "H⁺ flow back", { s: 13, w: 700, c: HP }) + T(aX, 56, "into the matrix ↓", { s: 13, w: 700, c: HP });
    if (blocked && pv) s += P("M580 100 L580 136", { c: HP, w: 3.2, m: "hp" });
    else if (!blocked) s += P("M580 100 L580 200", { c: pv || r.atp == null || r.atp > 0.5 ? HP : "#d8a6a2", w: 3.2, m: "hp" });
    s += T(aX, MY1 + 55, "head", { s: 13, w: 600, c: ATPC }) + T(aX, 312, "ADP + Pᵢ → ATP", { s: 14, w: 800, c: blocked && !pv ? GREY : ATPC });
    if (blocked) s += X(aX, 180, 15);
    if (dis === "uncoupler") s += ["l1", "l2", "l3"].map((k) => P(OX_PATHS[k], { c: HP, w: 2.4, m: "hp", d: "3 3" })).join("") + T(420, 338, "membrane leaky to H⁺ (uncoupler)", { s: 13, w: 700, c: HP });
    s += T(300, 236, "electron transfer chain", { s: 13, w: 700, c: EL }).replace("<text ", `<text stroke="${MAT}" stroke-width="5" stroke-linejoin="round" paint-order="stroke" `);
    if (dis === "cyanide") s += T(426, 245, "cyanide", { s: 14, w: 800, c: HP, a: "start" }).replace("<text ", `<text stroke="${MAT}" stroke-width="5" stroke-linejoin="round" paint-order="stroke" `);
    s += Object.entries(OX_PATHS).map(([k, d]) => `<path d="${d}" fill="none" stroke="none" data-mp="${k}"/>`).join("");
    return svg(660, 400, "Section of the inner mitochondrial membrane, intermembrane space above and matrix below. Reduced NAD gives electrons to the first carrier; electrons pass along the electron transfer chain to oxygen, which forms water in the matrix. Three carriers pump protons up from the matrix into the intermembrane space. Protons flow down through ATP synthase into the matrix, where its head joins ADP and phosphate to make ATP." + (dis !== "none" ? " Disruption shown: " + dis + "." : ""), s, "oxphos-svg");
  }
  oxphos.PATHS = OX_PATHS;

  // ===================================== Respiratory substrates (static figure, 3.3.3.4) =====================================
  // Rows: sources y 30, breakdown products y 92, processing y 154, entry y 216, Krebs cycle y 278 (viewBox 660 x 304).
  function substrates() {
    uid(); let s = defs([["ink", INK]]);
    const box = (x, y, w, t, o = {}) => `<rect x="${x - w / 2}" y="${y - 18}" width="${w}" height="36" rx="10" fill="${o.f || "#ffffff"}" stroke="${o.c || INK}" stroke-width="1.8"/>` + T(x, y + 5, t, { s: 14, w: 700, c: o.tc || INK });
    const ar = (d, o = {}) => P(d, { c: o.c || INK, w: 2, m: "ink", d: o.d });
    s += `<rect x="0" y="0" width="660" height="304" fill="#ffffff"/>`;
    s += box(110, 30, 180, "Carbohydrate", { f: "#e3eefa", c: "#1f66b0" }) + box(330, 30, 150, "Lipid", { f: "#fbf0d9", c: "#a8700c" }) + box(560, 30, 150, "Protein", { f: "#efe7f6", c: "#7b3f98" });
    s += box(250, 92, 120, "glycerol", { c: "#a8700c" }) + box(420, 92, 130, "fatty acids", { c: "#a8700c" }) + box(560, 92, 140, "amino acids", { c: "#7b3f98" });
    s += box(110, 154, 170, "glycolysis", { f: "#f3f6f9" }) + box(420, 154, 170, "two-carbon units", { c: "#a8700c" }) + box(560, 216, 180, "amino group removed", { c: "#7b3f98" });
    s += box(110, 216, 120, "pyruvate") + box(330, 216, 170, "acetylcoenzyme A", { f: "#fff3cc", c: "#9a6a00" }) + box(330, 278, 170, "Krebs cycle", { f: "#fff3cc", c: "#9a6a00" });
    s += ar("M110 48 L110 134") + T(118, 92, "glucose", { s: 13, a: "start", c: GREY });
    s += ar("M110 172 L110 196") + ar("M170 216 L242 216") + ar("M330 234 L330 258");
    s += ar("M310 48 L262 72") + ar("M350 48 L404 72") + ar("M218 110 L176 134", { d: "5 4" }) + T(226, 125, "as triose phosphate", { s: 13, a: "start", c: "#a8700c" });
    s += ar("M420 110 L420 134") + ar("M392 172 L362 196");
    s += ar("M560 48 L560 72") + ar("M560 110 L560 196") + ar("M470 216 L418 216") + ar("M520 234 L418 268");
    s += T(650, 262, "remainder enters", { s: 13, c: "#7b3f98", a: "end" }) + T(650, 278, "at several points", { s: 13, c: "#7b3f98", a: "end" });
    return svg(660, 304, "Flow chart. Carbohydrate (glucose) goes through glycolysis to pyruvate, then acetylcoenzyme A and the Krebs cycle. Lipid is broken into glycerol, which enters glycolysis as triose phosphate, and fatty acids, which are split into two-carbon units that form acetylcoenzyme A. Protein is broken into amino acids; their amino group is removed and the remainder enters acetylcoenzyme A or the Krebs cycle.", s);
  }

  // ===================================== RQ scale (RQ Calculator) =====================================
  // o.rq: the value to mark (after the student has checked); scale 0.5 to 1.6. Labels 15 units (12.8 px at 562 px wide).
  function rqScale(o = {}) {
    uid(); const x = (v) => 40 + ((Math.max(0.5, Math.min(1.6, v)) - 0.5) / 1.1) * 580; let s = defs([["ink", INK]]);
    s += `<rect x="0" y="0" width="660" height="176" fill="#ffffff"/>` + L(40, 96, 620, 96, { c: INK, w: 2 });
    for (let v = 0.5; v <= 1.601; v += 0.1) { const X0 = x(v); s += L(X0, 90, X0, 102, { c: INK, w: 1.4 }) + T(X0, 122, v.toFixed(1), { s: 15, c: GREY }); }
    s += `<rect x="${r1(x(0.68))}" y="66" width="${r1(x(0.72) - x(0.68))}" height="24" fill="#fbf0d9" stroke="#a8700c"/>` + T(x(0.7), 58, "lipid", { s: 15, w: 700, c: "#a8700c" }) + T(x(0.66), 38, "about 0.7", { s: 15, c: GREY });
    s += `<rect x="${r1(x(0.8))}" y="66" width="${r1(x(0.9) - x(0.8))}" height="24" fill="#efe7f6" stroke="#7b3f98"/>` + T(x(0.85), 58, "protein", { s: 15, w: 700, c: "#7b3f98" }) + T(x(0.87), 38, "0.8 to 0.9", { s: 15, c: GREY });
    s += `<rect x="${r1(x(0.98))}" y="66" width="${r1(x(1.02) - x(0.98))}" height="24" fill="#e3eefa" stroke="#1f66b0"/>` + T(x(0.975), 58, "carbohydrate", { s: 15, w: 700, c: "#1f66b0", a: "start" }) + T(x(0.975), 38, "1.0", { s: 15, c: GREY, a: "start" });
    s += T(x(1.44), 38, "above 1: some anaerobic", { s: 15, w: 600, c: HP }) + T(x(1.44), 56, "respiration as well", { s: 15, w: 600, c: HP });
    s += T(330, 170, "respiratory quotient (RQ)", { s: 15, w: 700 });
    if (o.rq != null && isFinite(o.rq)) { const X0 = x(o.rq); const right = o.rq > 1.3; s += `<path d="M${r1(X0)} 98 l-8 -14 h16 z" fill="${INK}"/>` + L(X0, 98, X0, 104, { c: INK, w: 2.4 }) + T(X0 + (right ? 8 : -8), 146, "your data: " + Number(o.rq).toFixed(2) + (o.rq > 1.6 || o.rq < 0.5 ? " (off the scale)" : ""), { s: 15, w: 800, a: right ? "end" : "start" }); }
    return svg(660, 176, "Scale of respiratory quotient from 0.5 to 1.6 showing typical values: lipid about 0.7, protein 0.8 to 0.9, carbohydrate 1.0; values above 1 suggest some anaerobic respiration" + (o.rq != null ? ". Your data are marked at " + Number(o.rq).toFixed(2) : ""), s, "rq-svg");
  }

  // ===================================== Mitochondria: transmission electron micrograph (d-3.3.3.3-p1) =====================================
  // assets/img/mitochondria-tem-howard.jpg (640 x 433, Louisa Howard, public domain). Figure x = 230 + source x, y = source y.
  // Leader ends were placed on a 3x zoom of the image: envelope of the left mitochondrion (15, 300); matrix (90, 228);
  // the double-line crista in the right mitochondrion (437, 215); cytoplasm between the two (305, 300). The intermembrane
  // space is not resolvable at this magnification, so it is not labelled.
  const TEM = ["assets/img/mitochondria-tem-howard.jpg", 640, 433];
  const pesc = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const pLead = (pts) => { const d = "M" + pts.map((q) => q.map(r1).join(" ")).join(" L"); const [ex, ey] = pts[pts.length - 1].map(r1);
    return `<g pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${ex}" cy="${ey}" r="5" fill="${INK}" stroke="#fff" stroke-width="2"/></g>`; };
  const pLab = (x, y, lines, o = {}) => { const sz = 26, s2 = 23, lh = 31;
    return `<g pointer-events="none">` + lines.map((t, i) => `<text x="${x}" y="${y + i * lh}" text-anchor="${o.a || "start"}" font-size="${i ? s2 : sz}" font-weight="${i ? 500 : 800}" fill="${i ? GREY : INK}" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${t}</text>`).join("") + "</g>"; };
  function mitoTEM() {
    const LW = 230, W = LW + 640 + 250, H = 433, X = (sx) => LW + sx;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${pesc("Transmission electron micrograph of two mitochondria in a mammalian lung cell, cut across. Each is bounded by a dark envelope (the outer and inner membranes). Dark lines inside are cristae, folds of the inner membrane; the granular grey material between them is the matrix. The paler, granular cytoplasm lies around them. A scale bar shows 200 nanometres. Labels: envelope, outer and inner membranes; matrix; crista, a fold of the inner membrane; cytoplasm.")}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" style="max-width:100%;height:auto"><rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
    s += `<image href="${TEM[0]}" x="${LW}" y="0" width="${TEM[1]}" height="${TEM[2]}"/>`;
    s += pLead([[LW - 12, 150], [X(90), 228]]) + pLab(LW - 22, 159, ["Matrix"], { a: "end" });
    s += pLead([[LW - 12, 300], [X(15), 300]]) + pLab(LW - 22, 309, ["Envelope", "outer and inner", "membranes"], { a: "end" });
    s += pLead([[X(640) + 12, 150], [X(437), 215]]) + pLab(X(640) + 24, 158, ["Crista", "fold of the", "inner membrane"]);
    s += pLead([[X(640) + 12, 330], [X(305), 300]]) + pLab(X(640) + 24, 338, ["Cytoplasm"]);
    return s.replace(/\s*\n\s*/g, " ") + "</svg>";
  }

  B.mitoArt = { mitoTEM, mito, MLAB, krebs, oxphos, substrates, rqScale, COLORS: { HP, EL, ATPC, OXY, NADC } };
})(window.BIO);
