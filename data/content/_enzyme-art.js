// Shared artwork and kinetic model for 3.1.3 (enzymes). Loaded before the 3.1.3 content files and the enzyme
// interactives. Everything is schematic SVG drawn in code; the model functions are documented in place and in
// KNOWN_LIMITATIONS.md. Nothing here is measured data.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", SAGE = "#6b9a7f", NAVY = "#1e3a5f", AMBER = "#c8902a", ROSE = "#b4504f";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ""}>${s}</text>`;

  // ---------- Kinetic model (documented) ----------
  // Rate v (arbitrary units, relative to a reference of 100 at 37 degC, pH 7, saturating substrate, enzyme x1, no inhibitor):
  //   v = 100 * E * fT(T) * fpH(pH) * S / (Km_app + S), scaled by Vmax_app
  //   fT(T) = 2^((T-37)/10) / (1 + exp((T - 55) / 3))   (Q10 = 2 below the optimum; sigmoidal, instantaneous loss of
  //            activity around 50-60 degC; real denaturation is time-dependent and enzyme-specific)
  //   fpH(pH) = exp(-((pH - pHopt)^2) / (2 * 1.1^2))      (bell curve; a reversible fall in binding away from the optimum,
  //            with denaturation only at extremes; the model does not separate the two)
  //   Km_app = Km * (1 + I/Ki) for a competitive inhibitor (same Vmax, more substrate needed to reach it)
  //   Vmax_app = Vmax / (1 + I/Ki) for a pure non-competitive inhibitor (Km unchanged)
  // These are the classical Michaelis-Menten and reversible-inhibition equations with illustrative constants
  // (Km = 2 mmol dm-3, Ki = 1 mmol dm-3). Pure non-competitive inhibition is a special case; many real inhibitors
  // are mixed or uncompetitive, which the simulator says explicitly.
  const Km = 2, Ki = 1;
  const fT = (T) => Math.pow(2, (T - 37) / 10) / (1 + Math.exp((T - 55) / 3));
  const fpH = (pH, opt = 7) => Math.exp(-Math.pow(pH - opt, 2) / (2 * 1.1 * 1.1));
  function rate({ T = 37, pH = 7, S = 10, E = 1, inhibitor = "none", I = 0, pHopt = 7 } = {}) {
    let KmApp = Km, VmaxApp = 100 * E * fT(T) * fpH(pH, pHopt) / fT(37);
    if (inhibitor === "competitive") KmApp = Km * (1 + I / Ki);
    if (inhibitor === "noncompetitive") VmaxApp = VmaxApp / (1 + I / Ki);
    return VmaxApp * S / (KmApp + S);
  }
  const curve = (xs, f) => xs.map((x) => ({ x, y: f(x) }));
  const range = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  B.enzymeModel = { Km, Ki, fT, fpH, rate, curve, range };

  // ---------- Generic multi-series graph ----------
  // graph({ width, height, xLabel, yLabel, xmax, ymax, curves: [{ pts, color, label, dash, width }], marks: [{x, y, label}], hlines: [{y, label}], vlines: [{x, label}], xticks, yticks, id })
  function graph(o) {
    const width = o.width || 520, height = o.height || 300, padL = 56, padB = 48, padT = 18, padR = 16; const w = width - padL - padR, hgt = height - padB - padT;
    const xmax = o.xmax || Math.max(...o.curves.flatMap((c) => c.pts.map((p) => p.x))), ymax = o.ymax || Math.max(...o.curves.flatMap((c) => c.pts.map((p) => p.y))) * 1.1;
    const xmin = o.xmin || 0;
    const X = (x) => padL + ((x - xmin) / (xmax - xmin)) * w, Y = (y) => padT + hgt - (y / ymax) * hgt;
    let s = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${(o.aria || o.yLabel + " against " + o.xLabel).replace(/"/g, "'")}"${o.id ? ` id="${o.id}"` : ""}>`;
    const xt = o.xticks || 5, yt = o.yticks || 4;
    for (let g = 0; g <= yt; g++) { const yv = (ymax * g) / yt; s += `<line x1="${padL}" x2="${width - padR}" y1="${Y(yv)}" y2="${Y(yv)}" stroke="#e3ecea"/>${o.hideY ? "" : `<text x="${padL - 8}" y="${Y(yv) + 4}" font-size="10" text-anchor="end" fill="${GREY}">${yv.toFixed(yv >= 10 || yv === 0 ? 0 : 1)}</text>`}`; }
    for (let g = 0; g <= xt; g++) { const xv = xmin + ((xmax - xmin) * g) / xt; s += `<line x1="${X(xv)}" x2="${X(xv)}" y1="${padT + hgt}" y2="${padT + hgt + 4}" stroke="${GREY}"/><text x="${X(xv)}" y="${padT + hgt + 16}" font-size="10" text-anchor="middle" fill="${GREY}">${xv.toFixed(xv >= 10 || Number.isInteger(xv) ? 0 : 1)}</text>`; }
    s += `<line x1="${padL}" x2="${padL}" y1="${padT}" y2="${padT + hgt}" stroke="${INK}" stroke-width="1.2"/><line x1="${padL}" x2="${width - padR}" y1="${padT + hgt}" y2="${padT + hgt}" stroke="${INK}" stroke-width="1.2"/>`;
    (o.hlines || []).forEach((l) => { s += `<line x1="${padL}" x2="${width - padR}" y1="${Y(l.y)}" y2="${Y(l.y)}" stroke="${l.color || GREY}" stroke-dasharray="5 4"/>${l.label ? T(l.la === "start" ? padL + 6 : width - padR - 4, Y(l.y) - 5, l.label, { a: l.la || "end", s: 11, c: l.color || GREY, w: 600 }) : ""}`; });
    (o.vlines || []).forEach((l) => { s += `<line x1="${X(l.x)}" x2="${X(l.x)}" y1="${padT}" y2="${padT + hgt}" stroke="${l.color || GREY}" stroke-dasharray="5 4"/>${l.label ? T(X(l.x) + (X(l.x) > padL + w * 0.55 ? -4 : 4), padT + 12, l.label, { a: X(l.x) > padL + w * 0.55 ? "end" : "start", s: 11, c: l.color || GREY, w: 600 }) : ""}`; });
    o.curves.forEach((c, i) => { const pts = c.pts.filter((p) => p.y <= ymax * 1.5); s += `<path class="curve" data-i="${i}" d="${pts.map((p, k) => (k ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(Math.min(p.y, ymax)).toFixed(1)).join(" ")}" fill="none" stroke="${c.color || TEAL}" stroke-width="${c.width || 2.5}" stroke-linejoin="round"${c.dash ? ` stroke-dasharray="${c.dash}"` : ""}${c.anim ? ' pathLength="1" class="curve draw"' : ""}/>`; if (c.label) { const last = pts[pts.length - 1]; const lp = c.labelPos; s += lp ? T(X(lp.x), Y(lp.y), c.label, { a: lp.a || "start", s: 11, c: c.color || TEAL, w: 700 }) : T(Math.min(X(last.x) - 2, width - padR - 2), Y(Math.min(last.y, ymax)) - 8, c.label, { a: "end", s: 11, c: c.color || TEAL, w: 700 }); } });
    (o.marks || []).forEach((m) => { s += `<circle cx="${X(m.x)}" cy="${Y(m.y)}" r="5" fill="#fff" stroke="${m.color || NAVY}" stroke-width="2"/>${m.label ? T(X(m.x) + (m.dx || 8), Y(m.y) + (m.dy || -8), m.label, { a: "start", s: 11, c: m.color || NAVY, w: 600 }) : ""}`; });
    s += T(padL + w / 2, height - 6, o.xLabel || "", { s: 12, w: 600 }) + T(14, padT + hgt / 2, o.yLabel || "", { s: 12, w: 600, r: -90 });
    if (o.extra) s += o.extra({ X, Y, padL, padT, w, hgt });
    return s + "</svg>";
  }

  // ---------- Enzyme and substrate shapes ----------
  // Enzyme: a rounded blob (300 x 220 box) with an active-site notch at the top. `open` (0..1) widens the notch:
  // 0 = complementary to the substrate, 1 = the "resting" shape of an induced-fit enzyme before binding.
  function enzymePath(open = 0, cx = 150, cy = 140) {
    const w = 26 + 24 * open, d = 44 - 14 * open, r = 92; // notch half-width at the rim, notch depth
    const top = cy - r + 6;
    return `M ${cx - w - 8} ${top + 4} C ${cx - w - 2} ${top + d * 0.3}, ${cx - w * 0.6} ${top + d}, ${cx - w * 0.5} ${top + d}
            L ${cx + w * 0.5} ${top + d} C ${cx + w * 0.6} ${top + d}, ${cx + w + 2} ${top + d * 0.3}, ${cx + w + 8} ${top + 4}
            C ${cx + 70} ${top - 6}, ${cx + r + 8} ${cy - 40}, ${cx + r} ${cy + 10}
            C ${cx + r - 6} ${cy + 70}, ${cx + 40} ${cy + r}, ${cx} ${cy + r - 4}
            C ${cx - 40} ${cy + r}, ${cx - r + 6} ${cy + 70}, ${cx - r} ${cy + 10}
            C ${cx - r - 8} ${cy - 40}, ${cx - 70} ${top - 6}, ${cx - w - 8} ${top + 4} Z`;
  }
  // Substrate complementary to the closed notch (w = 26, d = 44): a trapezoid-ish key, drawn with its base at (cx, baseY).
  function substratePath(cx, baseY, split = 0) {
    const w = 26, d = 44, gap = split * 14;
    const left = `M ${cx - w * 0.5 - gap} ${baseY} L ${cx - w - 6 - gap} ${baseY - d + 2} L ${cx - w - 6 - gap} ${baseY - d - 22} L ${cx - gap} ${baseY - d - 22} L ${cx - gap} ${baseY} Z`;
    const right = `M ${cx + gap} ${baseY} L ${cx + gap} ${baseY - d - 22} L ${cx + w + 6 + gap} ${baseY - d - 22} L ${cx + w + 6 + gap} ${baseY - d + 2} L ${cx + w * 0.5 + gap} ${baseY} Z`;
    return { left, right, whole: `M ${cx - w * 0.5} ${baseY} L ${cx - w - 6} ${baseY - d + 2} L ${cx - w - 6} ${baseY - d - 22} L ${cx + w + 6} ${baseY - d - 22} L ${cx + w + 6} ${baseY - d + 2} L ${cx + w * 0.5} ${baseY} Z` };
  }
  // A substrate that does NOT fit (wrong shape) for the specificity demonstration.
  const wrongSubstratePath = (cx, baseY) => `M ${cx - 30} ${baseY} L ${cx - 30} ${baseY - 50} L ${cx + 30} ${baseY - 50} L ${cx + 30} ${baseY} Z`;
  const enzymeSVG = (inner, w = 300, h = 230, aria = "enzyme") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${aria}">${inner}</svg>`;

  // ---------- Static diagrams for the content pages ----------
  const esComplex = () => {
    const stage = (x, label, substrate, note) => `<g transform="translate(${x},0)"><path d="${enzymePath(0)}" fill="#d6efec" stroke="${TEAL}" stroke-width="2.5"/>${substrate}${T(150, 232, label, { s: 12, w: 700 })}${T(150, 248, note, { s: 10.5, c: GREY })}</g>`;
    const sub = (dy, split = 0) => { const p = substratePath(150, 98 + dy, split); return `<path d="${p.left}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2"/><path d="${p.right}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2"/>`; };
    return `<svg viewBox="0 -50 960 310" width="960" role="img" aria-label="four stages of enzyme action: substrate approaches, enzyme-substrate complex, enzyme-product complex, products released">
      ${stage(0, "1 Substrate approaches", `<path d="${substratePath(150, 30).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2"/>${T(150, -42, "substrate", { s: 11, c: AMBER })}`, "random collision")}
      ${stage(230, "2 Enzyme–substrate complex", `<path d="${substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2"/>`, "substrate held in the active site")}
      ${stage(460, "3 Enzyme–product complex", sub(0, 0.35), "bond broken; products still bound")}
      ${stage(690, "4 Products released", `<path d="${substratePath(110, 24, 0).left}" fill="#e2efe6" stroke="${SAGE}" stroke-width="2"/><path d="${substratePath(190, 24, 0).right}" fill="#e2efe6" stroke="${SAGE}" stroke-width="2"/>${T(150, 14, "products", { s: 11, c: SAGE })}`, "enzyme unchanged, reused")}
      ${[215, 445, 675].map((x) => `<path d="M ${x} 130 l 14 0" stroke="${GREY}" stroke-width="2" marker-end="url(#ar)"/>`).join("")}
      <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${GREY}"/></marker></defs>
    </svg>`;
  };
  const lockKeyVsInduced = () => `<svg viewBox="0 0 900 340" width="900" role="img" aria-label="lock and key model compared with induced fit model">
      ${T(220, 22, "Lock and key (Fischer, 1894)", { s: 13, w: 700 })}${T(670, 22, "Induced fit (Koshland, 1958)", { s: 13, w: 700 })}
      <g transform="translate(70,60) scale(0.62)"><path d="${enzymePath(0)}" fill="#d6efec" stroke="${TEAL}" stroke-width="3"/><path d="${substratePath(150, 30).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3"/></g>
      <g transform="translate(230,60) scale(0.62)"><path d="${enzymePath(0)}" fill="#d6efec" stroke="${TEAL}" stroke-width="3"/><path d="${substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3"/></g>
      ${T(220, 235, "Active site already exactly complementary:", { s: 11, c: GREY })}${T(220, 251, "the substrate fits like a key in a lock.", { s: 11, c: GREY })}
      ${T(220, 270, "Explains specificity, but not how binding", { s: 11, c: GREY })}${T(220, 286, "strains the substrate's bonds.", { s: 11, c: GREY })}
      <g transform="translate(520,60) scale(0.62)"><path d="${enzymePath(1)}" fill="#d6efec" stroke="${TEAL}" stroke-width="3"/><path d="${substratePath(150, 30).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3"/></g>
      <g transform="translate(680,60) scale(0.62)"><path d="${enzymePath(0)}" fill="#d6efec" stroke="${TEAL}" stroke-width="3"/><path d="${substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3"/></g>
      ${T(670, 235, "Active site only roughly complementary at first;", { s: 11, c: GREY })}${T(670, 251, "binding changes the enzyme's shape so the site", { s: 11, c: GREY })}
      ${T(670, 267, "moulds around the substrate, straining its bonds", { s: 11, c: GREY })}${T(670, 283, "and lowering the activation energy.", { s: 11, c: GREY })}
      ${T(450, 322, "Schematic. The extent of movement differs between enzymes; induced fit refines lock and key rather than replacing specificity.", { s: 10.5, c: GREY })}
    </svg>`;
  // Energy profile: reactants at E=100, products at E=60, uncatalysed peak at 190, catalysed peak at 135 (same overall change).
  const energyProfile = ({ showCat = true, showUncat = true, width = 560 } = {}) => {
    const W = width, H = 320, padL = 60, padB = 50, padT = 20, w = W - padL - 20, hgt = H - padB - padT;
    const X = (f) => padL + f * w, Y = (e) => padT + hgt - (e / 220) * hgt;
    const path = (peak) => `M ${X(0)} ${Y(100)} L ${X(0.22)} ${Y(100)} C ${X(0.4)} ${Y(100)}, ${X(0.38)} ${Y(peak)}, ${X(0.5)} ${Y(peak)} C ${X(0.62)} ${Y(peak)}, ${X(0.6)} ${Y(60)}, ${X(0.78)} ${Y(60)} L ${X(1)} ${Y(60)}`;
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="energy profile of a reaction with and without an enzyme" class="energy">
      <line x1="${padL}" x2="${padL}" y1="${padT}" y2="${padT + hgt}" stroke="${INK}" stroke-width="1.2"/><line x1="${padL}" x2="${W - 20}" y1="${padT + hgt}" y2="${padT + hgt}" stroke="${INK}" stroke-width="1.2"/>
      ${T(14, padT + hgt / 2, "energy", { r: -90, w: 600 })}${T(padL + w / 2, H - 8, "progress of reaction", { w: 600 })}
      <line x1="${padL}" x2="${X(0.5)}" y1="${Y(100)}" y2="${Y(100)}" stroke="${GREY}" stroke-dasharray="4 4"/><line x1="${X(0.5)}" x2="${W - 20}" y1="${Y(60)}" y2="${Y(60)}" stroke="${GREY}" stroke-dasharray="4 4"/>
      ${showUncat ? `<path class="uncat" d="${path(190)}" fill="none" stroke="${ROSE}" stroke-width="3"/><line x1="${X(0.5) + 6}" x2="${X(0.5) + 6}" y1="${Y(100)}" y2="${Y(190)}" stroke="${ROSE}" stroke-width="1.5" marker-start="url(#aR)" marker-end="url(#aR)"/>${T(X(0.5) + 12, Y(160), "Ea without enzyme", { a: "start", s: 11, c: ROSE, w: 700 })}` : ""}
      ${showCat ? `<path class="cat" d="${path(135)}" fill="none" stroke="${TEAL}" stroke-width="3"/><line x1="${X(0.5) - 16}" x2="${X(0.5) - 16}" y1="${Y(100)}" y2="${Y(135)}" stroke="${TEAL}" stroke-width="1.5" marker-start="url(#aT)" marker-end="url(#aT)"/>${T(X(0.5) - 22, Y(86), "Ea with enzyme", { a: "end", s: 11, c: TEAL, w: 700 })}` : ""}
      <line x1="${X(0.96)}" x2="${X(0.96)}" y1="${Y(100)}" y2="${Y(60)}" stroke="${NAVY}" stroke-width="1.5" marker-start="url(#aN)" marker-end="url(#aN)"/>${T(X(0.94), Y(84), "overall energy change", { a: "end", s: 10.5, c: NAVY, w: 700 })}${T(X(0.94), Y(76), "(same with or without the enzyme)", { a: "end", s: 10, c: NAVY })}
      ${T(X(0.1), Y(100) - 10, "reactants (substrate)", { s: 11, w: 700 })}${T(X(0.86), Y(60) + 22, "products", { s: 11, w: 700 })}
      <defs><marker id="aR" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 z" fill="${ROSE}"/></marker><marker id="aT" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 z" fill="${TEAL}"/></marker><marker id="aN" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 z" fill="${NAVY}"/></marker></defs>
    </svg>`;
  };
  // Active site: tertiary structure holds a few amino acids from distant parts of the chain next to each other.
  const activeSite = () => `<svg viewBox="0 0 620 300" width="620" role="img" aria-label="a folded polypeptide bringing amino acids from different parts of the chain together to form an active site">
      <path d="M40 260 C 60 180, 120 200, 140 150 S 220 60, 260 90 S 300 190, 360 150 S 430 60, 470 110 S 440 230, 400 250 S 300 280, 260 220 S 180 160, 150 220 S 90 290, 40 260" fill="none" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>
      ${[[150, 150, "Ser 195"], [260, 90, "His 57"], [262, 220, "Asp 102"]].map(([x, y, l], i) => `<circle cx="${x}" cy="${y}" r="13" fill="${[AMBER, ROSE, TEAL][i]}"/>${T(x, y + 4, i + 1, { s: 11, c: "#fff", w: 700 })}${T(x + 18, y - 12, l, { a: "start", s: 11, w: 600 })}`).join("")}
      <ellipse cx="225" cy="155" rx="90" ry="78" fill="none" stroke="${AMBER}" stroke-width="2" stroke-dasharray="6 5"/>${T(225, 250, "active site: a small cleft formed by the tertiary structure", { s: 11, c: AMBER, w: 700 })}
      ${T(310, 22, "Three amino acids far apart in the primary sequence (57, 102 and 195 in chymotrypsin)", { s: 11.5, w: 600 })}${T(310, 40, "are brought together by folding. Only a few residues form the active site;", { s: 11.5, c: GREY })}${T(310, 56, "the rest of the protein holds them in exactly the right positions.", { s: 11.5, c: GREY })}
    </svg>`;

  // ---------- Rate graphs ----------
  const tOpt = (() => { let best = 0, bv = 0; for (let t = 0; t <= 70; t += 0.5) { const v = fT(t); if (v > bv) { bv = v; best = t; } } return best; })();
  const tempCurve = () => graph({ xLabel: "temperature / °C", yLabel: "rate of reaction / arbitrary units", xmax: 70, ymax: 240, xticks: 7, curves: [{ pts: curve(range(0, 70, 70), (t) => rate({ T: t, S: 50 })), color: TEAL }], vlines: [{ x: tOpt, label: "optimum ≈ " + Math.round(tOpt) + " °C" }], extra: ({ X, Y }) => T(X(2), Y(135), "more kinetic energy →", { a: "start", s: 10.5, c: GREY }) + T(X(2), Y(122), "more frequent successful collisions", { a: "start", s: 10.5, c: GREY }) + T(X(69), Y(205), "tertiary structure", { a: "end", s: 10.5, c: ROSE, w: 600 }) + T(X(69), Y(192), "disrupted: active site", { a: "end", s: 10.5, c: ROSE, w: 600 }) + T(X(69), Y(179), "no longer complementary", { a: "end", s: 10.5, c: ROSE, w: 600 }), aria: "rate against temperature: rises roughly exponentially to an optimum then falls steeply" });
  const substrateCurve = () => graph({ xLabel: "substrate concentration / mmol dm⁻³", yLabel: "initial rate / arbitrary units", xmax: 20, ymax: 120, curves: [{ pts: curve(range(0, 20, 80), (s) => rate({ S: s })), color: TEAL }], hlines: [{ y: 100, label: "Vmax: every active site occupied (enzyme-limited)" }], marks: [{ x: 2, y: rate({ S: 2 }), label: "Km: half Vmax", dx: 10, dy: 14 }], extra: ({ X, Y }) => T(X(1.5), Y(30), "substrate-limited:", { a: "start", s: 10.5, c: GREY }) + T(X(1.5), Y(18), "more substrate → more collisions", { a: "start", s: 10.5, c: GREY }), aria: "initial rate against substrate concentration: rises then plateaus at Vmax" });
  const enzymeConcCurve = () => graph({ xLabel: "enzyme concentration / arbitrary units", yLabel: "initial rate / arbitrary units", xmax: 5, ymax: 150, xticks: 5, curves: [{ pts: curve(range(0, 5, 50), (e) => Math.min(30 * e, 100)), color: TEAL, label: "with limited substrate: plateau, substrate now limiting", labelPos: { x: 4.95, y: 92, a: "end" } }, { pts: curve(range(0, 5, 50), (e) => 30 * e), color: SAGE, dash: "6 5", label: "substrate in excess: rate ∝ enzyme concentration", labelPos: { x: 0.15, y: 140, a: "start" } }], aria: "initial rate against enzyme concentration: proportional until substrate becomes limiting" });
  const pHCurve = () => graph({ xLabel: "pH", yLabel: "rate of reaction / arbitrary units", xmin: 0, xmax: 14, ymax: 120, xticks: 7, curves: [{ pts: curve(range(0, 14, 70), (p) => rate({ pH: p, S: 50 })), color: TEAL, label: "optimum about 7: most intracellular enzymes", labelPos: { x: 13.8, y: 110, a: "end" } }, { pts: curve(range(0, 14, 70), (p) => rate({ pH: p, pHopt: 2, S: 50 })), color: AMBER, dash: "6 5", label: "pepsin: optimum about 2", labelPos: { x: 0.3, y: 110, a: "start" } }], aria: "rate against pH: a bell curve around the optimum, which differs between enzymes" });
  const inhibitionCurves = () => graph({ xLabel: "substrate concentration / mmol dm⁻³", yLabel: "initial rate / arbitrary units", xmax: 120, ymax: 120, curves: [{ pts: curve(range(0, 120, 160), (s) => rate({ S: s })), color: TEAL, label: "no inhibitor", labelPos: { x: 118, y: 110, a: "end" } }, { pts: curve(range(0, 120, 160), (s) => rate({ S: s, inhibitor: "competitive", I: 1 })), color: AMBER, label: "competitive inhibitor: approaches the same Vmax as [S] increases", labelPos: { x: 118, y: 80, a: "end" } }, { pts: curve(range(0, 120, 160), (s) => rate({ S: s, inhibitor: "noncompetitive", I: 1 })), color: ROSE, label: "non-competitive inhibitor (same concentration): lower Vmax", labelPos: { x: 118, y: 38, a: "end" } }], hlines: [{ y: 100, label: "Vmax (no inhibitor)", la: "start" }], aria: "competitive inhibition reaches the same maximum rate at high substrate concentration; non-competitive lowers the maximum rate" });
  const inhibitorBinding = () => `<svg viewBox="0 0 760 330" width="760" role="img" aria-label="competitive inhibitor in the active site compared with a non-competitive inhibitor bound elsewhere">
      ${T(190, 22, "Competitive inhibition", { s: 13, w: 700 })}${T(570, 22, "Non-competitive inhibition", { s: 13, w: 700 })}
      <g transform="translate(80,70) scale(0.72)"><path d="${enzymePath(0)}" fill="#d6efec" stroke="${TEAL}" stroke-width="3"/><path d="M 124 98 L 110 56 L 150 40 L 190 56 L 176 98 Z" fill="#f3d6d5" stroke="${ROSE}" stroke-width="3"/>${T(150, 80, "I", { s: 18, c: ROSE, w: 700 })}<path d="${substratePath(275, 60).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3"/>${T(275, 110, "substrate", { s: 13, c: AMBER })}${T(275, 128, "blocked", { s: 13, c: AMBER })}</g>
      ${T(190, 252, "Inhibitor resembles the substrate and occupies the active site.", { s: 11, c: GREY })}${T(190, 268, "Effect depends on the inhibitor : substrate ratio;", { s: 11, c: GREY })}${T(190, 284, "extra substrate out-competes it.", { s: 11, c: GREY })}
      <g transform="translate(460,70) scale(0.72)"><path d="${enzymePath(1)}" fill="#d6efec" stroke="${TEAL}" stroke-width="3"/><path d="M 230 175 l 30 -18 l 26 20 l -12 30 l -36 2 Z" fill="#f3d6d5" stroke="${ROSE}" stroke-width="3"/>${T(258, 190, "I", { s: 18, c: ROSE, w: 700 })}<path d="${substratePath(150, 24).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3" opacity=".7"/>${T(290, 30, "substrate no", { s: 13, c: AMBER, a: "start" })}${T(290, 48, "longer fits", { s: 13, c: AMBER, a: "start" })}</g>
      ${T(570, 252, "Inhibitor binds away from the active site (allosteric site),", { s: 11, c: GREY })}${T(570, 268, "changing the tertiary structure so the active site is distorted;", { s: 11, c: GREY })}${T(570, 284, "extra substrate cannot overcome it.", { s: 11, c: GREY })}
      ${T(380, 312, "Simplified models. Many real inhibitors are 'mixed'; the specification requires only these two idealised cases.", { s: 10.5, c: GREY })}
    </svg>`;
  const denaturation = () => `<svg viewBox="0 0 760 285" width="760" role="img" aria-label="a native enzyme with its active site compared with a denatured enzyme whose tertiary structure has unfolded">
      ${T(190, 22, "Native (functional) enzyme", { s: 13, w: 700 })}${T(570, 22, "Denatured enzyme", { s: 13, w: 700 })}
      <g transform="translate(60,40) scale(0.7)"><path d="${enzymePath(0)}" fill="#d6efec" stroke="${TEAL}" stroke-width="3"/>${[[80, 120], [210, 110], [120, 200], [190, 200]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y + 10}" stroke="${NAVY}" stroke-width="2" stroke-dasharray="3 3"/>`).join("")}<path d="${substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3"/></g>
      ${T(190, 215, "Hydrogen and ionic bonds (dashed) hold the tertiary", { s: 11, c: GREY })}${T(190, 231, "structure; the active site is complementary.", { s: 11, c: GREY })}
      <g transform="translate(468,52) scale(0.7)"><path d="M 20 150 C 40 60, 120 40, 150 90 S 250 40, 270 110 S 200 190, 150 160 S 60 230, 20 150" fill="#eef4f2" stroke="${ROSE}" stroke-width="3"/><path d="M 60 120 C 90 110, 110 140, 140 120 S 200 150, 230 120" fill="none" stroke="${ROSE}" stroke-width="2" stroke-dasharray="4 3"/><path d="${substratePath(150, 62).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="3" opacity=".8"/></g>${T(570, 44, "substrate: no complementary site to bind to", { s: 11.5, c: AMBER, w: 600 })}
      ${T(570, 215, "Heat or extreme pH breaks the weak bonds; the chain", { s: 11, c: GREY })}${T(570, 231, "unfolds and the shape of the active site is lost.", { s: 11, c: GREY })}
      ${T(380, 256, "Denaturation is a change in tertiary structure, usually irreversible. It is not 'the active site getting smaller',", { s: 10.5, c: GREY })}${T(380, 270, "and peptide bonds are not broken: the primary structure is unchanged.", { s: 10.5, c: GREY })}
    </svg>`;

  B.enzymeArt = { enzymePath, substratePath, wrongSubstratePath, enzymeSVG, graph, esComplex, lockKeyVsInduced, energyProfile, activeSite, tempCurve, substrateCurve, enzymeConcCurve, pHCurve, inhibitionCurves, inhibitorBinding, denaturation, colours: { INK, GREY, TEAL, SAGE, NAVY, AMBER, ROSE }, T };
})(window.BIO);
