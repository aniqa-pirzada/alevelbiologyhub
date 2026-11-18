// Drawings for 3.3.7 Allele frequencies in populations (Phase 5 Batch 4, author C1): B.popgenArt.
//   chart(opts)       line chart (several series, dashed reference lines, edge labels) used by the drift, breeding
//                     and Hardy-Weinberg conditions interactives
//   bars(opts)        grouped bar chart (observed against expected genotype frequencies; histograms)
//   cow(x, y, type)   a small cattle icon (red, roan or white coat) with its two allele beads (Cᴿ, Cᵂ)
//   bead(x, y, i, r)  an allele bead for the bottleneck jar: a colour AND a letter, so colour is not the only cue
//   gametePool()      static figure d-3.3.7.2-1: where p² + 2pq + q² comes from (p = 0.7, q = 0.3)
// Every label is our own SVG text, at least 13 units, drawn on a white figure panel.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5f6f7f", LINE = "#c9d3d8";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ""}>${o.raw ? s : esc(s)}</text>`;
  const COLS = ["#1f6fb2", "#c0392b", "#1e8449", "#8e44ad", "#b9770e", "#117a8b", "#5d6d7e", "#a93226", "#2e86c1", "#7d6608"];
  const DASH = ["", "6 4", "2 3", "9 3 2 3", "", "6 4", "2 3", "9 3 2 3", "", "6 4"];
  const ALLELE = [{ c: "#1f6fb2", l: "1" }, { c: "#e67e22", l: "2" }, { c: "#27ae60", l: "3" }, { c: "#8e44ad", l: "4" }, { c: "#c0392b", l: "5" }, { c: "#f1c40f", l: "6" }];

  function chart(o) {
    const k = o.k || 1, w = o.w || 560, h = o.h || 300, L = (o.left || 62) * k, R = (o.right || 112) * k, Tp = 16, Bt = 50 * k, pw = w - L - R, ph = h - Tp - Bt;
    const xMax = o.xMax, yMin = o.yMin || 0, yMax = o.yMax === undefined ? 1 : o.yMax;
    const X = (x) => L + (x / xMax) * pw, Y = (y) => Tp + ph - ((y - yMin) / (yMax - yMin)) * ph;
    const yt = o.yTicks || [0, 0.25, 0.5, 0.75, 1], xt = o.xTicks || [0, 1, 2, 3, 4, 5].map((k) => (k * xMax) / 5);
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${esc(o.aria || "chart")}" style="max-width:100%;height:auto;background:#fff">`;
    s += yt.map((v) => `<line x1="${L}" y1="${Y(v)}" x2="${L + pw}" y2="${Y(v)}" stroke="${LINE}" stroke-width="1"/>${T(L - 8, Y(v) + 5, o.yFmt ? o.yFmt(v) : String(v), { a: "end", s: 13 * k, c: GREY })}`).join("");
    s += xt.map((v) => `<line x1="${X(v)}" y1="${Tp + ph}" x2="${X(v)}" y2="${Tp + ph + 5}" stroke="${GREY}"/>${T(X(v), Tp + ph + 20 * k, String(v), { s: 13 * k, c: GREY })}`).join("");
    s += `<line x1="${L}" y1="${Tp}" x2="${L}" y2="${Tp + ph}" stroke="${GREY}" stroke-width="1.5"/><line x1="${L}" y1="${Tp + ph}" x2="${L + pw}" y2="${Tp + ph}" stroke="${GREY}" stroke-width="1.5"/>`;
    s += T(L + pw / 2, h - 8, o.xLabel || "", { s: 14 * k }) + T(16 * k, Tp + ph / 2, o.yLabel || "", { s: 14 * k, rot: -90 });
    for (const r of o.refs || []) s += `<line x1="${L}" y1="${Y(r.y)}" x2="${L + pw}" y2="${Y(r.y)}" stroke="${r.c || INK}" stroke-width="${r.w || 1.6}" stroke-dasharray="${r.dash || "7 5"}"/>` + (r.label ? T(L + pw + 6, Y(r.y) + 5, r.label, { a: "start", s: 13 * k, w: 600, c: r.c || INK }) : "");
    (o.series || []).forEach((se, i) => { if (!se.pts.length) return; const c = se.c || COLS[i % COLS.length], d = se.dash !== undefined ? se.dash : DASH[i % DASH.length];
      s += `<polyline fill="none" stroke="${c}" stroke-width="${se.w || 2.2}" stroke-linejoin="round" ${d ? `stroke-dasharray="${d}"` : ""} points="${se.pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ")}"/>`;
      if (se.end) { const [x, y] = se.pts[se.pts.length - 1]; s += T(X(x) + 6, Y(y) + 5, se.end, { a: "start", s: 13 * k, w: 600, c }); } });
    for (const e of o.edgeLabels || []) s += T(L + pw + 6, Y(e.y) + (e.dy || 5), e.label, { a: "start", s: 13 * k, w: 600, c: e.c || GREY });
    return s + "</svg>";
  }

  // groups: [{ label, vals: [v, …] }], keys: [{ label, c, pattern? }]
  function bars(o) {
    const k = o.k || 1, w = o.w || 520, h = o.h || 260, L = 56 * k, R = 12, Tp = o.legend === false ? 14 : 40 * k, Bt = 46 * k, pw = w - L - R, ph = h - Tp - Bt, yMax = o.yMax || 1;
    const Y = (y) => Tp + ph - (y / yMax) * ph, gw = pw / o.groups.length, nk = o.keys.length, bw = Math.min(46, (gw * 0.7) / nk);
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${esc(o.aria || "bar chart")}" style="max-width:100%;height:auto;background:#fff"><defs><pattern id="${o.id || "pgb"}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#5f6f7f" stroke-width="2.4"/></pattern></defs>`;
    const yt = o.yTicks || [0, yMax / 2, yMax];
    s += yt.map((v) => `<line x1="${L}" y1="${Y(v)}" x2="${L + pw}" y2="${Y(v)}" stroke="${LINE}"/>${T(L - 8, Y(v) + 5, o.yFmt ? o.yFmt(v) : String(v), { a: "end", s: 13 * k, c: GREY })}`).join("");
    s += `<line x1="${L}" y1="${Tp + ph}" x2="${L + pw}" y2="${Tp + ph}" stroke="${GREY}" stroke-width="1.5"/>`;
    o.groups.forEach((g, gi) => { const x0 = L + gi * gw + (gw - bw * nk) / 2;
      g.vals.forEach((v, j) => { const key = o.keys[j], x = x0 + j * bw, y = Y(Math.max(0, Math.min(yMax, v))); s += `<rect x="${x + 1}" y="${y}" width="${bw - 2}" height="${Tp + ph - y}" fill="${key.pattern ? `url(#${o.id || "pgb"}-hatch)` : key.c}" stroke="${key.c}" stroke-width="1.5"/>`;
        if (o.valFmt) s += T(x + bw / 2, y - 5, o.valFmt(v), { s: 13 * k, c: INK }); });
      s += T(L + gi * gw + gw / 2, Tp + ph + 20 * k, g.label, { s: 14 * k, w: 600 }); });
    if (o.xLabel) s += T(L + pw / 2, h - 6, o.xLabel, { s: 13 * k, c: GREY });
    if (o.legend !== false) { let lx = L; o.keys.forEach((key) => { s += `<rect x="${lx}" y="${10 * k}" width="16" height="14" fill="${key.pattern ? `url(#${o.id || "pgb"}-hatch)` : key.c}" stroke="${key.c}" stroke-width="1.5"/>` + T(lx + 22, 22 * k, key.label, { a: "start", s: 13 * k }); lx += 30 + key.label.length * 7.4 * k; }); }
    return s + "</svg>";
  }

  // cattle icon: body, head, legs; coat red, white or roan (red with white hairs); beads below show the two alleles
  function cow(x, y, type, sc = 1) {
    const red = "#9c3b22", white = "#f7f4ee", body = type === "white" ? white : red;
    let s = `<g transform="translate(${x} ${y}) scale(${sc})">`;
    s += `<rect x="-22" y="-12" width="40" height="22" rx="10" fill="${body}" stroke="${INK}" stroke-width="1.4"/>`;
    if (type === "roan") s += [[-14, -6], [-6, -2], [2, -7], [10, -1], [-10, 4], [4, 4], [12, -8], [-17, 1], [-2, 6], [8, 6]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2" fill="${white}"/>`).join("");
    s += `<rect x="16" y="-18" width="14" height="13" rx="5" fill="${body}" stroke="${INK}" stroke-width="1.4"/>`;
    if (type === "roan") s += `<circle cx="22" cy="-12" r="1.8" fill="${white}"/><circle cx="26" cy="-8" r="1.6" fill="${white}"/>`;
    s += [-16, -8, 6, 13].map((a) => `<line x1="${a}" y1="10" x2="${a}" y2="17" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`).join("");
    const al = type === "red" ? ["R", "R"] : type === "white" ? ["W", "W"] : ["R", "W"];
    s += al.map((a, i) => { const cx = -9 + i * 18; return `<circle cx="${cx}" cy="29" r="8.5" fill="${a === "R" ? red : white}" stroke="${INK}" stroke-width="1.3"/><text x="${cx}" y="34" text-anchor="middle" font-size="14" font-weight="700" fill="${a === "R" ? "#fff" : INK}">${a}</text>`; }).join("");
    return s + "</g>";
  }
  function bead(x, y, i, r = 7) { const a = ALLELE[i]; const dark = i !== 5; return `<circle cx="${x}" cy="${y}" r="${r}" fill="${a.c}" stroke="${INK}" stroke-width="1"/>` + (r >= 6 ? `<text x="${x}" y="${y + r * 0.45}" text-anchor="middle" font-size="${Math.max(9, r * 1.35)}" font-weight="700" fill="${dark ? "#fff" : INK}">${a.l}</text>` : ""); }

  // d-3.3.7.2-1: gamete pool square with sides in proportion p = 0.7, q = 0.3
  // On a phone (below 600 px when the page loads) the side list goes under the square and every label is larger, so
  // labels render at 11 px or more on a 390 px screen (RQ-12).
  function gametePool() {
    const ph = typeof innerWidth !== "undefined" && innerWidth < 600;
    const S = ph ? 290 : 300, x0 = ph ? 140 : 150, y0 = ph ? 82 : 70, p = 0.7, a = S * p, b = S * (1 - p), f1 = ph ? 22 : 16, f2 = ph ? 20 : 14, f3 = ph ? 20 : 15;
    const cell = (x, y, w, h, fill, l1, l2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>${T(x + w / 2, y + h / 2 - 2, l1, { s: f1, w: 700, raw: true })}${T(x + w / 2, y + h / 2 + f2 + 4, l2, { s: f2, c: GREY, raw: true })}`;
    const W = ph ? 440 : 640, H = ph ? 560 : 400;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Square of gametes: sides divided into p = 0.7 and q = 0.3; areas p squared 0.49, pq 0.21 twice, q squared 0.09" style="max-width:100%;height:auto;background:#fff">`;
    s += T(x0 + S / 2, ph ? 26 : 24, ph ? "Male gametes" : "Gametes from the male parents", { s: f3, w: 600 }) + T(ph ? 20 : 40, y0 + S / 2, ph ? "Female gametes" : "Gametes from the female parents", { s: f3, w: 600, rot: -90 });
    s += T(x0 + a / 2, y0 - 14, "A  (p = 0.7)", { s: f3, w: 600 }) + T(x0 + a + b / 2, y0 - 14, ph ? "a (q = 0.3)" : "a  (q = 0.3)", { s: ph ? 17 : f3, w: 600 });
    s += T(x0 - 10, y0 + a / 2 + 5, ph ? "A (0.7)" : "A  (p = 0.7)", { a: "end", s: f3, w: 600 }) + T(x0 - 10, y0 + a + b / 2 + 5, ph ? "a (0.3)" : "a  (q = 0.3)", { a: "end", s: f3, w: 600 });
    s += cell(x0, y0, a, a, "#d6efec", "AA: p²", "0.7 × 0.7 = 0.49") + cell(x0 + a, y0, b, a, "#fdf0dc", "Aa: pq", "0.21") + cell(x0, y0 + a, a, b, "#fdf0dc", "Aa: pq", "0.7 × 0.3 = 0.21") + cell(x0 + a, y0 + a, b, b, "#efe7f6", "aa: q²", "0.09");
    const L = ["AA = p² = 0.49", "Aa = 2pq = 0.42", "aa = q² = 0.09", "Total = 1.00"];
    if (ph) L.forEach((t, i) => { s += T(40, y0 + S + 44 + i * 32, t, { a: "start", s: 22, w: i === 3 ? 700 : 600 }); });
    else L.forEach((t, i) => { s += T(x0 + S + 16, y0 + 70 + i * 36 + (i === 3 ? 10 : 0), t, { a: "start", s: 18, w: i === 3 ? 700 : 600 }); });
    return s + "</svg>";
  }

  B.popgenArt = { chart, bars, cow, bead, gametePool, COLS, DASH, ALLELE, INK, GREY };
})(window.BIO);
