// Shared model and artwork for 3.2.6 The circulation of blood and the structure of the mammalian heart (Phase 4 Batch 2,
// owned by the 3.2.6 author). Loaded before data/content/3.2.6.1.js, 3.2.6.2.js, data/consolidation/3.2.6.js and
// js/views/interactives-heart.js.
//
// ORIENTATION used in every heart drawing: the standard anatomical (front) view. The heart's RIGHT side (right atrium,
// right ventricle) is on the VIEWER'S LEFT and the heart's LEFT side is on the VIEWER'S RIGHT; each drawing says so in
// words ("body's right", "body's left"). Red = oxygenated blood, blue = deoxygenated blood.
// Flow drawn (checked arrow by arrow in the author report): vena cavae → right atrium → (tricuspid / right
// atrioventricular valve) → right ventricle → (pulmonary semilunar valve) → pulmonary artery → lungs → pulmonary veins →
// left atrium → (bicuspid / left atrioventricular valve) → left ventricle → (aortic semilunar valve) → aorta → body;
// coronary arteries leave the aorta just above the aortic valve.
// 2026-11-15 (release review): the teacher's heart picture is retired; heartPhoto and heartNumbered now draw a clean
// vector front section (same overlay options), used by the heartExplorer and cardiacCycleAnim interactives and by
// q-3.2.6.2-lb1 and lb2.
//
// B.heartModel: ONE illustrative cardiac cycle of the LEFT heart (typical healthy adult at rest, heart rate 75 min⁻¹,
// cycle 0.8 s). Every curve is computed here and every valve event is FOUND from the curves (a valve is open when the
// pressure behind it is higher than the pressure in front of it), so the graph, the animation, the explorer and the
// questions all use the same numbers. Values chosen to match textbook figures: left ventricular systolic pressure
// 16 kPa (120 mmHg); aortic pressure 10.7–15.7 kPa (80–117 mmHg); left atrial pressure 1.1–1.6 kPa (8–12 mmHg, mostly
// 8 to 10 mmHg); left ventricular diastolic pressure about 1.1–1.4 kPa (8–11 mmHg); end-diastolic volume 130 cm³,
// end-systolic volume 60 cm³, stroke volume 70 cm³; atrial systole about 0.1 s, ventricular systole about 0.26 s (AV
// closure to SL closure; OpenStax gives about 0.27 s), diastole about 0.44 s (OpenStax about 0.43 s); atrial
// contraction supplies about 20 % of ventricular filling
// (OpenStax Anatomy and Physiology 2e §19.3; TeachMePhysiology, "The Cardiac Cycle", table of normal pressures).
// They are ILLUSTRATIVE, not a measured trace: real values vary between people and with activity.
//
// Tissue fluid (B.heartModel.fluid): the simplified Starling model expected at AS (capillary hydrostatic pressure falls
// from 35 to 18 mmHg along the capillary, more steeply near the arteriole end, shaped so that about 85 % of the filtrate
// is reabsorbed as in OpenStax §20.3; plasma oncotic pressure 25 mmHg; interstitial pressures taken as 0). The revised
// Starling principle is beyond the specification and was removed on 2026-11-15 (teacher's decision).
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ model ------------------------------------------------------------------
  const KPA_PER_MMHG = 0.133322;
  const mmHg = (kpa) => kpa / KPA_PER_MMHG, kPa = (mm) => mm * KPA_PER_MMHG;
  const round = (x, dp = 1) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 1) => round(x, dp).toFixed(dp);
  const P = { T: 0.8, laBase: 1.2, aAmp: 0.35, aC: 0.055, aW: 0.028, xAmp: 0.12, xC: 0.15, xW: 0.03, vAmp: 0.3, vC: 0.43, vW: 0.06,
    lvPeak: 16.0, tSys: 0.10, tPk: 0.25, tEnd: 0.44, rise: 2.5, fall: 5, sag: 11, grad: 0.12, delta: 0.35, tailA: 13.0, tailSlope: 3, notch: 0.45, notchW: 0.03,
    aoDia: 80 * KPA_PER_MMHG, EDV: 130, ESV: 60, Vpre: 115, fillTau: 0.055 };
  const Gp = (t, c, w) => [-1, 0, 1].reduce((s, k) => s + Math.exp(-(((t + k * P.T - c) / w) ** 2)), 0);
  const la = (t) => P.laBase + P.aAmp * Gp(t, P.aC, P.aW) - P.xAmp * Gp(t, P.xC, P.xW) + P.vAmp * Gp(t, P.vC, P.vW);
  const shape = (t) => { // ventricular contraction, 0..1
    if (t <= P.tSys || t >= P.tEnd) return 0;
    if (t <= P.tPk) { const g = (1 - Math.cos(Math.PI * (t - P.tSys) / (P.tPk - P.tSys))) / 2; return 1 - (1 - g) ** P.rise; }
    const g = (1 - Math.cos(Math.PI * (t - P.tPk) / (P.tEnd - P.tPk))) / 2; return (1 - g ** P.fall) * (1 - P.sag * (t - P.tPk) ** 2); };
  const AMP = P.lvPeak - (la(P.tPk) - P.grad);
  const lv = (t) => la(t) - P.grad + AMP * shape(t);
  const tail = (t) => P.tailA - P.tailSlope * (t - P.tPk);
  const bisect = (f, a, b) => { let fa = f(a); for (let i = 0; i < 60; i++) { const m = (a + b) / 2, fm = f(m); if ((fm >= 0) === (fa >= 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
  const firstCross = (f, a, b, step = 0.0005) => { let x = a, fx = f(a); for (let y = a + step; y <= b + 1e-12; y += step) { const fy = f(y); if ((fx < 0) !== (fy < 0)) return bisect(f, x, y); x = y; fx = fy; } return null; };
  // events found from the curves
  const tAVc = firstCross((t) => lv(t) - la(t), P.tSys, P.tPk);           // LV pressure rises above LA: AV valve closes
  const tSLo = firstCross((t) => lv(t) - P.aoDia, tAVc, P.tPk);           // LV pressure rises above aortic: SL valve opens
  const tSLc = firstCross((t) => lv(t) - tail(t), P.tPk, P.tEnd);         // LV pressure falls below aortic: SL valve closes
  const Pc = tail(tSLc); const tau = (tSLo + P.T - tSLc) / Math.log(Pc / P.aoDia);
  const decay = (t) => Pc * Math.exp(-(t - tSLc) / tau);
  const ao = (t) => {
    t = ((t % P.T) + P.T) % P.T;
    if (t < tSLo) return decay(t + P.T);
    if (t < tSLc) { const ramp = Math.min(1, (t - tSLo) / 0.03); return t < P.tPk ? lv(t) - P.delta * ramp : Math.max(lv(t) - P.delta, tail(t)); }
    const n = t - tSLc < P.notchW ? P.notch * Math.sin(Math.PI * (t - tSLc) / P.notchW) : 0; return decay(t) - n; };
  const tAVo = firstCross((t) => la(t) - lv(t), tSLc, P.T);               // LV pressure falls below LA: AV valve opens
  const vol = (t) => {
    t = ((t % P.T) + P.T) % P.T;
    if (t < tAVc) return P.Vpre + (P.EDV - P.Vpre) * (1 - Math.cos(Math.PI * t / tAVc)) / 2;
    if (t < tSLo) return P.EDV;
    if (t < tSLc) { const s = (t - tSLo) / (tSLc - tSLo); return P.EDV - (P.EDV - P.ESV) * (1 - (1 - s) ** 2); }
    if (t < tAVo) return P.ESV;
    const k = (x) => 1 - Math.exp(-x / P.fillTau); return P.ESV + (P.Vpre - P.ESV) * k(t - tAVo) / k(P.T - tAVo); };
  const wrap = (t) => ((t % P.T) + P.T) % P.T;
  const state = (t0) => { const t = wrap(t0); const avOpen = la(t) > lv(t), slOpen = t >= tSLo && t < tSLc;
    const phase = t < P.tSys ? "atrial systole" : t < tSLc ? "ventricular systole" : "diastole";
    const sub = t < P.tSys ? "atria contract; AV valves open; ventricles receive the last of their filling" : t < tAVc ? "ventricles begin to contract; AV valves about to close" : t < tSLo ? "isovolumetric contraction: all valves closed, pressure rising" : t < tSLc ? "ejection: semilunar valves open, blood leaves the ventricle" : t < tAVo ? "isovolumetric relaxation: all valves closed, pressure falling" : "filling: AV valves open, blood flows from atria into ventricles";
    return { t, la: la(t), lv: lv(t), ao: ao(t), vol: vol(t), avOpen, slOpen, phase, sub }; };
  const sample = (n = 321) => Array.from({ length: n }, (_, i) => { const t = (P.T * i) / (n - 1); return { t, la: la(t), lv: lv(t), ao: ao(t), vol: vol(t) }; });
  const maxOf = (f) => { let m = -Infinity, at = 0; for (let i = 0; i <= 1600; i++) { const t = (P.T * i) / 1600; const v = f(t); if (v > m) { m = v; at = t; } } return { v: m, t: at }; };
  const minOf = (f) => { const r = maxOf((t) => -f(t)); return { v: -r.v, t: r.t }; };
  const EV = { avClose: tAVc, slOpen: tSLo, slClose: tSLc, avOpen: tAVo };
  const summary = () => { const sv = P.EDV - P.ESV, hr = 60 / P.T; return { T: P.T, hr, edv: P.EDV, esv: P.ESV, sv, co: hr * sv, coDm3: (hr * sv) / 1000, ef: (100 * sv) / P.EDV,
    lvMax: maxOf(lv), aoMax: maxOf(ao), aoMin: minOf(ao), laMax: maxOf(la), laMin: minOf(la), atrialPct: (100 * (P.EDV - P.Vpre)) / sv,
    ventSystole: tSLc - tAVc, isoContract: tSLo - tAVc, ejection: tSLc - tSLo, isoRelax: tAVo - tSLc, diastole: P.T - tSLc }; };
  const co = (hr, sv) => hr * sv; // cm³ min⁻¹ when hr in min⁻¹ and sv in cm³

  // Tissue fluid: simplified (AS) model along a capillary, x = 0 (arteriole end) to 1 (venule end). Pressures in mmHg.
  // Shape of the hydrostatic pressure fall: hyd(x) = Pv + (Pa − Pv)·g(x), with g falling from 1 to 0 as an exponential
  // (rate FALL_K), so the pressure falls more steeply near the arteriole end, as it does in real capillaries, whose venous
  // half is wider and so offers less resistance. FALL_K = 0.83 is chosen so that, with the default values, the model
  // returns about 85 % of the filtrate to the capillary (OpenStax §20.3: about 20.4 of the 24 litres filtered each day
  // are reabsorbed, the rest returns as lymph), and net pressure is zero close to the midpoint (x ≈ 0.49), also as in
  // OpenStax. The end values (and so netA = +10 and netV = −7 mmHg) are unchanged by the shape.
  const FALL_K = 0.83, gFall = (x) => (Math.exp(-FALL_K * x) - Math.exp(-FALL_K)) / (1 - Math.exp(-FALL_K));
  const gInv = (g) => -Math.log(g * (1 - Math.exp(-FALL_K)) + Math.exp(-FALL_K)) / FALL_K;
  const FLUID = { Pa: 35, Pv: 18, onc: 25, Pi: 0, oncI: 0 };
  const fluid = (o = {}) => { const p = Object.assign({}, FLUID, o); const hyd = (x) => p.Pv + (p.Pa - p.Pv) * gFall(x); const net = (x) => (hyd(x) - p.Pi) - (p.onc - p.oncI);
    let filt = 0, reab = 0; const N = 400; for (let i = 0; i < N; i++) { const x = (i + 0.5) / N, j = net(x); if (j > 0) filt += j / N; else reab += -j / N; }
    const gz = p.Pa === p.Pv ? null : (p.onc - p.oncI + p.Pi - p.Pv) / (p.Pa - p.Pv);
    const xZero = gz !== null && gz >= 0 && gz <= 1 ? gInv(gz) : null;
    return { p, hyd, net, filt, reab, lymph: Math.max(0, filt - reab), fracReab: filt > 0 ? Math.min(1, reab / filt) : 0, xZero,
      netA: net(0), netV: net(1) }; };
  const FLUID_SOURCE = { filteredL: 24, reabsorbedL: 20.4, pct: 85 }; // OpenStax A&P §20.3, litres per day

  B.heartModel = { P, KPA_PER_MMHG, mmHg, kPa, round, fix, la, lv, ao, vol, state, sample, EV, summary, co, fluid, FLUID, FLUID_SOURCE, FALL_K, maxOf, minOf };

  // ------------------------------------------------------------------ artwork ------------------------------------------------------------------
  let cnt = 0, U = ""; const uid = () => (U = "-ht" + (++cnt));
  const INK = "#16263a", GREY = "#5f6f7f", OX = "#c0392b", DE = "#2f5fa8", OXT = "#f9dcd8", DET = "#dbe6f6", MUS = "#cf9188", MUSS = "#8f4a43", VAL = "#fbf6ea", VALS = "#6b4a2b";
  const COL = { INK, GREY, OX, DE, OXT, DET, MUS, MUSS };
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 11}" font-weight="${o.w || 600}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}${o.cls ? ` class="${o.cls}"` : ""}>${s}</text>`;
  const marker = (id, c) => `<marker id="${id}${U}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  const open = (w, h, label, defs = "", extra = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}" style="max-width:100%;height:auto"${extra}><defs>${defs}</defs><rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>`;
  const arrow = (d, c, m, o = {}) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${o.w || 3.2}" stroke-linecap="round" marker-end="url(#${m}${U})"${o.cls ? ` class="${o.cls}"` : ""}${o.da ? ` stroke-dasharray="${o.da}"` : ""}/>`;
  const lead = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GREY}" stroke-width="1"/>`;
  const numTag = (x, y, n) => `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${INK}" stroke-width="1.6"/>${T(x, y + 4, n, { s: 12, w: 800 })}`;
  const flat = (s) => s.replace(/\s*\n\s*/g, " ");

  const esc1 = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  // ---------- section through the heart: clean textbook front section (redrawn 2026-11-15) ----------
  // Replaces the teacher's picture (assets/img/heart-section-*.jpg, retired at the teacher's request). Drawn as vectors in
  // a 1536 × 1024 frame (heart in x 400–1140; label columns x ≤ 360 on the left and x ≥ 1150 on the right), so every
  // overlay (hotspots, labels, numbers, valve rings, flow arrows, the moving marker) uses the same coordinates as the
  // drawing and stays aligned at any width or zoom. Standard front view: the heart's RIGHT side is on the viewer's LEFT.
  // Anatomy checked point by point: the superior vena cava enters the top of the right atrium and the inferior vena cava
  // enters the BOTTOM of the right atrium (its lumen opens into the atrium; no wall between them); the tricuspid valve lies
  // between the right atrium and right ventricle; the pulmonary semilunar valve sits at the outflow of the right ventricle,
  // at the base of the pulmonary artery, which rises, passes in front of the ascending aorta and divides; the aortic
  // semilunar valve sits at the outflow of the LEFT ventricle immediately below the root of the aorta, beside the bicuspid
  // valve; pulmonary veins enter the left atrium; the left ventricle wall is about twice as thick as the right. No title or
  // key is part of the drawing: labels, names and colours are explained in HTML or as optional overlays.
  // Valve, chamber and flow states are OVERLAYS (rings, outlines, arrows); the drawing itself shows no valve state.
  const IMG = { w: 1536, h: 1024 };
  const HC = { tis: "#eaa79c", tisS: "#8f4a43", deF: "#9cb8e6", deW: "#4067ab", deC: "#7d9bd2", oxF: "#f2968b", oxW: "#b8413a", oxC: "#d66b62", val: "#fbf6ea", valS: "#6b4a2b", pap: "#d98a80" };
  const HEART_PARTS = {
    svc: "Superior vena cava", ivc: "Inferior vena cava", ra: "Right atrium", rv: "Right ventricle", la: "Left atrium", lv: "Left ventricle",
    septum: "Interventricular septum", tri: "Tricuspid valve (right atrioventricular valve)", bi: "Bicuspid valve (mitral, left atrioventricular valve)",
    pvalve: "Pulmonary semilunar valve", avalve: "Aortic semilunar valve", pa: "Pulmonary artery", pv: "Pulmonary veins", aorta: "Aorta",
    chordae: "Chordae tendineae", pap: "Papillary muscles",
  };
  const ellD = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
  // chamber interiors (also the hotspots) and the heart wall around them
  const GEO = {
    raOut: "M406 472 C406 390 448 336 514 332 L560 332 C628 336 664 390 664 460 L664 648 L520 648 C450 644 406 594 406 472 Z",
    laOut: "M874 478 C874 408 920 382 986 382 C1062 382 1100 424 1100 482 L1100 648 L874 648 Z",
    conusOut: "M650 572 L768 572 L768 652 L650 652 Z",
    ventOut: "M542 636 L1100 636 C1106 732 1082 814 1032 880 C986 938 930 972 866 972 C798 968 722 932 654 874 C594 820 550 742 542 636 Z",
    ra: "M428 474 C428 404 462 356 516 352 L556 352 C612 356 644 398 644 460 L644 624 C604 632 562 634 522 632 C468 628 428 588 428 474 Z",
    la: "M894 482 C894 428 932 402 986 402 C1046 402 1080 432 1080 484 L1080 624 L894 624 Z",
    rv: "M574 656 L668 656 L668 598 L748 598 L752 700 C756 770 744 826 722 852 C684 840 638 808 612 770 C588 736 574 696 574 656 Z",
    lv: "M772 598 L842 598 C850 624 866 644 896 652 L1036 656 C1040 724 1022 792 986 846 C956 888 916 904 888 896 C856 884 834 846 818 796 C802 748 792 700 790 652 L772 640 Z",
    septum: "M750 652 L790 652 C792 700 802 748 818 796 C834 846 856 884 888 896 L862 934 C812 924 762 890 722 852 C744 826 756 770 752 700 Z",
  };
  // vessels as tubes: [key, centreline, outer width, inner width, wall colour, lumen colour, cut ends [[x, y, rx, ry]]]
  const TUBES = [
    ["aorta", "M806 604 L806 250 C806 168 850 132 905 132 C960 132 998 168 998 250 L998 420", 100, 72, HC.oxW, HC.oxF, []],
    ["aorta", "M862 104 L858 46", 36, 22, HC.oxW, HC.oxF, [[858, 46, 18, 6]]], ["aorta", "M905 88 L905 34", 36, 22, HC.oxW, HC.oxF, [[905, 34, 18, 6]]], ["aorta", "M948 104 L952 46", 36, 22, HC.oxW, HC.oxF, [[952, 46, 18, 6]]],
    ["svc", "M510 140 L510 372", 86, 60, HC.deW, HC.deF, [[510, 140, 43, 12]]],
    ["ivc", "M476 612 L476 752", 86, 60, HC.deW, HC.deF, [[476, 752, 43, 12]]],
    ["pv", "M1066 470 L1130 470", 50, 34, HC.oxW, HC.oxF, [[1130, 470, 8, 25]]], ["pv", "M1066 540 L1130 540", 50, 34, HC.oxW, HC.oxF, [[1130, 540, 8, 25]]],
    ["pa", "M700 380 C676 336 640 310 598 304", 80, 56, HC.deW, HC.deF, [[598, 304, 10, 40]]],
    ["pa", "M708 604 L708 432 C708 350 762 306 852 300 L1062 300", 104, 76, HC.deW, HC.deF, [[1062, 300, 12, 52]]],
  ];
  // valves: [cx, cy, rx, ry] (the rings drawn in the cardiac cycle and the hotspots)
  const VALVE = { tri: [608, 644, 42, 20], bi: [952, 640, 64, 22], pvalve: [708, 592, 44, 18], avalve: [807, 592, 40, 18] };
  const drawHeart = () => {
    const tube = (d, w, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
    const cut = ([x, y, rx, ry], lum) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${lum}" stroke="${HC.tisS}" stroke-width="2.5"/>`;
    const byKey = (k) => TUBES.filter((t) => t[0] === k);
    const walls = (ts) => ts.map((t) => tube(t[1], t[2], t[4])).join(""), lumens = (ts) => ts.map((t) => tube(t[1], t[3], t[5])).join(""), ends = (ts) => ts.map((t) => t[6].map((e) => cut(e, t[4] === HC.oxW ? HC.oxC : HC.deC)).join("")).join("");
    let s = "";
    // 1 aorta (behind everything on the left side of the heart; its descending part goes down behind the left atrium)
    const ao = byKey("aorta"); s += walls(ao) + lumens(ao) + ends(ao);
    // 2 heart wall: atria, ventricles, outflow of the right ventricle
    s += `<g fill="${HC.tis}" stroke="${HC.tisS}" stroke-width="3"><path d="${GEO.raOut}"/><path d="${GEO.laOut}"/><path d="${GEO.ventOut}"/><path d="${GEO.conusOut}" stroke="none"/></g>`;
    // the root of the aorta sits on the left ventricle: redraw its lower part over the wall so it is seen to leave it
    s += tube("M806 604 L806 330", 100, HC.oxW) + tube("M806 612 L806 330", 72, HC.oxF);
    // 3 veins and pulmonary artery: walls first, then lumens, so lumens join the chambers without a wall line
    const vv = [...byKey("svc"), ...byKey("ivc"), ...byKey("pv")]; s += walls(vv);
    // 4 chambers
    s += `<path d="${GEO.ra}" fill="${HC.deF}"/><path d="${GEO.rv}" fill="${HC.deF}"/><path d="${GEO.la}" fill="${HC.oxF}"/><path d="${GEO.lv}" fill="${HC.oxF}"/>`;
    s += lumens(vv) + ends(vv);
    // 5 pulmonary artery in front of the ascending aorta
    const pa = byKey("pa"); s += walls(pa) + lumens(pa) + ends(pa) + tube("M708 612 L708 470", 76, HC.deF);
    // 6 papillary muscles and chordae tendineae (supporting)
    s += `<g fill="${HC.pap}" stroke="${HC.tisS}" stroke-width="2.5"><path d="M600 772 C596 742 604 722 616 722 C628 722 636 744 632 774 Z"/><path d="M904 880 C898 846 906 820 920 820 C934 820 942 848 936 882 Z"/><path d="M996 820 C992 790 1000 770 1012 770 C1022 770 1028 790 1024 822 Z"/></g>`;
    s += `<g stroke="#f7f1e4" stroke-width="3" fill="none"><path d="M590 690 L612 726 M628 692 L618 726"/><path d="M920 702 L918 822 M938 704 L922 822 M984 702 L1004 772 M1000 700 L1010 772"/></g>`;
    // 7 valves: atrioventricular flaps hang into the ventricles; semilunar cusps at the base of each artery
    const flap = (d) => `<path d="${d}" fill="${HC.val}" stroke="${HC.valS}" stroke-width="3" stroke-linejoin="round"/>`;
    s += flap("M568 640 L606 642 L594 694 C584 690 572 670 568 640 Z") + flap("M648 640 L610 642 L626 694 C638 688 648 668 648 640 Z");
    s += flap("M884 636 L948 640 L926 706 C906 700 888 672 884 636 Z") + flap("M1022 640 L956 642 L996 704 C1012 696 1022 670 1022 640 Z");
    const cusps = (cx, cy, hw) => flap(`M${cx - hw} ${cy + 8} Q${cx - hw / 2} ${cy - 22} ${cx} ${cy + 8} Q${cx + hw / 2} ${cy - 22} ${cx + hw} ${cy + 8} L${cx + hw} ${cy + 14} L${cx - hw} ${cy + 14} Z`);
    s += cusps(708, 590, 38) + cusps(807, 590, 36);
    // 8 crisp outlines of the cavities
    s += `<g fill="none" stroke="${HC.tisS}" stroke-width="2"><path d="${GEO.rv}"/><path d="${GEO.lv}"/></g>`;
    return s;
  };
  // leader end points for labels and numbers (on the structure)
  const PIN = { svc: [510, 236], ra: [522, 482], pvalve: [708, 586], tri: [604, 652], rv: [652, 770], ivc: [476, 700], aorta: [988, 196], pa: [1004, 300],
    pv: [[1118, 470], [1118, 540]], la: [960, 440], avalve: [810, 586], bi: [952, 648], lv: [966, 790], septum: [782, 760], chordae: [928, 742], pap: [918, 852] };
  const NUMBER_OF = { svc: 1, ra: 2, pvalve: 3, tri: 4, rv: 5, ivc: 6, aorta: 7, pa: 8, pv: 9, la: 10, avalve: 11, bi: 12, lv: 13, septum: 14 };
  // hotspot outlines. Order = paint order: later shapes sit on top and win the click where they overlap (the pulmonary
  // artery passes in FRONT of the aorta; valves sit on top of chambers and vessels).
  const SHAPES = [
    ["aorta", "M756 604 L756 250 C756 140 830 82 905 82 C980 82 1048 140 1048 250 L1048 384 L948 384 L948 250 C948 205 930 182 905 182 C880 182 856 205 856 250 L856 604 Z M840 104 L840 28 L970 28 L970 104 Z"],
    ["pa", "M656 604 L656 432 C656 330 730 252 852 248 L1068 248 L1068 352 L852 352 C792 356 760 392 760 440 L760 604 Z M592 262 C642 268 690 298 718 344 L684 400 C664 360 636 344 592 344 Z"],
    ["svc", "M467 128 L553 128 L553 352 L467 352 Z"],
    ["ivc", "M433 632 L519 632 L519 764 L433 764 Z"],
    ["pv", "M1078 445 L1138 445 L1138 495 L1078 495 Z M1078 515 L1138 515 L1138 565 L1078 565 Z"],
    ["ra", GEO.ra], ["la", GEO.la], ["rv", GEO.rv], ["lv", GEO.lv], ["septum", GEO.septum],
    ["chordae", "M586 676 L640 676 L638 724 L592 724 Z M910 702 L1004 702 L1008 772 L914 822 Z"],
    ["pap", ellD(616, 750, 20, 30) + ellD(920, 852, 22, 34) + ellD(1010, 798, 20, 30)],
    ["tri", ellD(...VALVE.tri)], ["bi", ellD(...VALVE.bi)], ["pvalve", ellD(...VALVE.pvalve)], ["avalve", ellD(...VALVE.avalve)],
  ];
  const SHAPE = Object.fromEntries(SHAPES);
  // labels in the margins only (never over the anatomy): [key, lines, x, baseline y, anchor]
  const LABELS = [
    ["svc", ["Superior vena cava"], 360, 246, "end"], ["ra", ["Right atrium"], 360, 450, "end"], ["pvalve", ["Pulmonary", "semilunar valve"], 360, 520, "end"],
    ["tri", ["Tricuspid valve"], 360, 622, "end"], ["ivc", ["Inferior vena cava"], 360, 712, "end"], ["rv", ["Right ventricle"], 360, 808, "end"],
    ["aorta", ["Aorta"], 1150, 186, "start"], ["pa", ["Pulmonary artery"], 1150, 272, "start"], ["la", ["Left atrium"], 1150, 382, "start"],
    ["pv", ["Pulmonary veins"], 1150, 516, "start"], ["avalve", ["Aortic", "semilunar valve"], 1150, 600, "start"], ["bi", ["Bicuspid (mitral)", "valve"], 1150, 690, "start"],
    ["chordae", ["Chordae tendineae", "(supporting)"], 1150, 778, "start"], ["lv", ["Left ventricle"], 1150, 860, "start"], ["pap", ["Papillary muscle", "(supporting)"], 1150, 930, "start"],
    ["septum", ["Interventricular septum"], 790, 1012, "middle"],
  ];
  const LAB = Object.fromEntries(LABELS.map((l) => [l[0], l]));
  // blood-flow arrows, by route section: "in" veins into atria, "av" atria → ventricles, "sl" ventricles → arteries,
  // "out" arteries away from the heart. [route, d, oxygenated?, dashed connector?]
  const FLOW = [
    ["in", "M510 160 L510 420", 0], ["in", "M476 744 L476 590", 0], ["in", "M1126 470 L1052 474", 1], ["in", "M1126 540 L1052 536", 1],
    ["in", "M1122 114 L1122 440", 1, 1],
    ["av", "M540 520 C560 580 590 640 608 724", 0], ["av", "M968 470 C970 540 966 610 952 720", 1],
    ["sl", "M660 812 C708 800 716 730 710 670 L708 548", 0], ["sl", "M900 836 C850 800 820 730 810 670 L807 548", 1],
    ["out", "M708 500 L708 440 C708 362 760 322 852 314 L1030 310", 0], ["out", "M690 372 C670 342 640 322 608 316", 0], ["out", "M1034 246 L1034 116", 0, 1],
    ["out", "M806 500 L806 366", 1], ["out", "M806 236 C806 178 850 152 905 152 C958 152 990 186 990 236", 1],
  ];
  // the route of one "drop" of blood for the moving marker: [x, y, step key or "", hidden behind another structure]
  const ROUTE = [[510, 150, "svc"], [510, 300, ""], [512, 420, ""], [526, 488, "ra"], [566, 572, ""], [608, 644, "tri"], [626, 720, ""], [662, 778, "rv"], [706, 760, ""], [710, 680, ""],
    [708, 592, "pvalve"], [708, 450, ""], [736, 352, ""], [852, 310, "pa"], [1000, 304, ""], [1034, 280, ""], [1034, 120, ""], [1080, 70, ""], [1275, 70, "lungs"], [1122, 90, ""], [1122, 440, ""],
    [1104, 470, "pv"], [1040, 476, ""], [972, 512, "la"], [952, 640, "bi"], [944, 740, ""], [930, 800, "lv"], [872, 790, ""], [828, 720, ""], [810, 660, ""], [807, 592, "avalve"],
    [806, 450, ""], [806, 366, ""], [806, 352, "", 1], [806, 248, "", 1], [812, 196, ""], [905, 150, "aorta"], [968, 176, ""], [990, 236, ""]];
  const routeInfo = (() => { const L = [0]; for (let i = 1; i < ROUTE.length; i++) L.push(L[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]));
    const stops = {}; ROUTE.forEach((p, i) => { if (p[2]) stops[p[2]] = L[i]; }); const oxAt = stops.lungs; return { total: L[L.length - 1], stops, oxAt, cum: L }; })();
  // point on the route at distance s (0..total): {x, y, ox (oxygenated after the lungs), hidden (passing behind the PA)}
  const routeAt = (s) => { const R = routeInfo; s = Math.max(0, Math.min(R.total, s)); let i = 1; while (i < ROUTE.length - 1 && R.cum[i] < s) i++;
    const a = ROUTE[i - 1], b = ROUTE[i], f = (s - R.cum[i - 1]) / ((R.cum[i] - R.cum[i - 1]) || 1);
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, ox: s >= R.oxAt, hidden: !!(a[3] || b[3]) }; };

  const HP_INK = "#16263a", HP_DE = "#0f3a8f", HP_OX = "#9e1414", HP_HL = "#e09a00", HP_OPEN = "#1d7a43", HP_SHUT = "#b3261e";
  const FS = 36, FS2 = 31; // label sizes in the 1536-wide frame: at least 12 px when the drawing is shown 520 px wide or more
  // o: { interactive, labels (true | array of keys), numbers (true: numbered version), highlight (key or array), flow (true),
  //      flowParts (["in","av","sl","out"]), animate, valves ({av: "open"|"closed", sl: ...}), chambers ({ra, rv, la, lv:
  //      "contract"|"relax"}), marker (true: adds a marker the interactive moves with routeAt), sides (true), title, width }
  const heartPhoto = (o = {}) => {
    uid(); const u = U; const W = IMG.w, H = IMG.h;
    const hl = new Set([].concat(o.highlight || []));
    const labelKeys = o.labels === true ? LABELS.map((l) => l[0]) : Array.isArray(o.labels) ? o.labels : [];
    const valveTag = o.valves ? { tri: o.valves.av, bi: o.valves.av, pvalve: o.valves.sl, avalve: o.valves.sl } : null;
    const title = o.title || "Section through the mammalian heart (front view)";
    const aria = `${title}. The heart's right side is on the viewer's left.${o.valves ? ` Atrioventricular valves ${o.valves.av}; semilunar valves ${o.valves.sl}.` : ""}${o.chambers ? " " + Object.entries(o.chambers).filter(([, v]) => v === "contract").map(([k]) => HEART_PARTS[k]).join(" and ") + (Object.values(o.chambers).includes("contract") ? " contracting." : "All chambers relaxed.") : ""}`;
    const css = `<style>.hp${u} .hs{fill:#fff;fill-opacity:0;stroke:none}.hp${u} [data-part]{outline:none}` +
      (o.interactive ? `.hp${u} [data-part]{cursor:pointer}.hp${u} [data-part]:hover .hs,.hp${u} [data-part]:focus .hs{fill:${HP_HL};fill-opacity:.18;stroke:${HP_HL};stroke-width:7}.hp${u} [data-part]:focus-visible .hs{stroke-dasharray:18 8}` : "") +
      `.hp${u} .hlon .hs{fill:${HP_HL};fill-opacity:.24;stroke:${HP_HL};stroke-width:9}.hp${u} .hlon .hsc{stroke:#fff;stroke-width:16;fill:none;opacity:.9}` +
      (o.animate ? `.hp${u} .fl{stroke-dasharray:30 20;animation:hpf${u} 1s linear infinite}.hp${u} .pulse{animation:hpp${u} .9s ease-in-out infinite alternate}@keyframes hpf${u}{to{stroke-dashoffset:-50}}@keyframes hpp${u}{from{stroke-opacity:1}to{stroke-opacity:.35}}@media (prefers-reduced-motion: reduce){.hp${u} .fl,.hp${u} .pulse{animation:none}}` : "") + "</style>";
    const mk = (id, c) => `<marker id="${id}${u}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/></marker>`;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${o.width || 760}" role="img" aria-label="${esc1(aria)}" class="hp${u}" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" style="max-width:100%;height:auto"><defs>${mk("hde", HP_DE)}${mk("hox", HP_OX)}${css}</defs>`;
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/><g pointer-events="none">${drawHeart()}</g>`;
    // chamber state (cardiac cycle): contracting = amber outline over a slightly darkened chamber; relaxed = dashed outline
    if (o.chambers) for (const [k, v] of Object.entries(o.chambers)) { const d = SHAPE[k]; if (!d) continue;
      s += v === "contract" ? `<g data-state="${k}-contract" pointer-events="none"><path d="${d}" fill="#14213d" fill-opacity=".18" stroke="#fff" stroke-width="18" stroke-opacity=".9"/><path d="${d}" fill="none" stroke="${HP_HL}" stroke-width="10" class="pulse"/></g>`
        : `<g data-state="${k}-relax" pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="9" stroke-opacity=".85"/><path d="${d}" fill="none" stroke="${HP_INK}" stroke-width="4" stroke-dasharray="16 12"/></g>`; }
    // hotspots: transparent shapes, focusable when interactive; the highlighted ones get an amber outline
    const tabs = o.interactive ? ' tabindex="0" role="button"' : "";
    for (const [k, d] of SHAPES) { if (!o.interactive && !hl.has(k)) continue;
      s += `<g data-part="${k}"${tabs}${hl.has(k) ? ' class="hlon"' : ""}>${o.interactive && o.titles !== false ? `<title>${HEART_PARTS[k]}</title>` : ""}${hl.has(k) ? `<path class="hsc" d="${d}"/>` : ""}<path class="hs" d="${d}"/></g>`; }
    // blood-flow arrows: white casing under a coloured arrow so they read on blue, red and white
    if (o.flow) { const fp = new Set(o.flowParts || ["in", "av", "sl", "out"]);
      for (const [r, d, ox, dashed] of FLOW) { if (!fp.has(r)) continue; const c = ox ? HP_OX : HP_DE, m = ox ? "hox" : "hde";
        s += `<g data-flow="${r}" pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="${dashed ? 10 : 17}" stroke-linecap="round" stroke-opacity=".95"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${dashed ? 5 : 9}" stroke-linecap="round"${dashed ? ' stroke-dasharray="14 12"' : ""}${o.animate && !dashed ? ' class="fl"' : ""} marker-end="url(#${m}${u})"/></g>`; } }
    if (o.flow || o.marker) s += `<g data-r="lungs" pointer-events="none"><rect x="1050" y="18" width="460" height="94" rx="18" fill="#f4f8fc" stroke="#7b8ea3" stroke-width="3"/>${T(1280, 58, "LUNGS", { s: 36, w: 800, c: HP_INK })}${T(1280, 96, "gain O₂, lose CO₂", { s: 31, w: 600, c: "#46566a" })}</g>`;
    // valve state: coloured ring on the valve and a tag in the margin, joined by a leader
    if (valveTag) for (const k of ["pvalve", "tri", "avalve", "bi"]) { const st = valveTag[k]; if (!st) continue; const [cx, cy, rx, ry] = VALVE[k]; const c = st === "open" ? HP_OPEN : HP_SHUT; const L = LAB[k]; const left = L[4] === "end";
      const name = { tri: "Tricuspid", bi: "Bicuspid", pvalve: "Pulmonary", avalve: "Aortic" }[k]; const txt = `${name}: ${st.toUpperCase()}`; const tw = txt.length * 19 + 36; const ty = L[3] - 4;
      const bx = left ? 362 - tw : 1148; const ex = left ? cx - rx : cx + rx;
      s += `<g data-valve="${k}" data-st="${st}" pointer-events="none"><path d="${ellD(cx, cy, rx + 6, ry + 6)}" fill="none" stroke="#fff" stroke-width="15"/><path d="${ellD(cx, cy, rx + 6, ry + 6)}" fill="none" stroke="${c}" stroke-width="8"${st === "closed" ? "" : ' stroke-dasharray="26 10"'}/>` +
        `<line x1="${left ? 362 : 1148}" y1="${ty - 12}" x2="${ex}" y2="${cy}" stroke="#fff" stroke-width="8"/><line x1="${left ? 362 : 1148}" y1="${ty - 12}" x2="${ex}" y2="${cy}" stroke="${c}" stroke-width="4"/>` +
        `<rect x="${bx}" y="${ty - 40}" width="${tw}" height="54" rx="27" fill="${c}"/>${T(bx + tw / 2, ty, txt, { s: 33, w: 800, c: "#ffffff" })}</g>`; }
    // labels or numbers (margins only)
    const lead2 = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="7" stroke-opacity=".85"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${HP_INK}" stroke-width="3"/><circle cx="${x2}" cy="${y2}" r="6" fill="${HP_INK}" stroke="#fff" stroke-width="2"/>`;
    const pinsOf = (k) => (Array.isArray(PIN[k][0]) ? PIN[k] : [PIN[k]]);
    if (o.numbers) for (const [k, n] of Object.entries(NUMBER_OF)) { const [, , x, y, a] = LAB[k]; const cx = a === "end" ? x - 26 : a === "start" ? x + 26 : x, cy = a === "middle" ? y - 14 : y - 12;
      const sx = a === "end" ? cx + 28 : a === "start" ? cx - 28 : cx, sy = a === "middle" ? cy - 28 : cy;
      s += `<g data-num="${k}" pointer-events="none">${pinsOf(k).map(([px, py]) => lead2(sx, sy, px, py)).join("")}<circle cx="${cx}" cy="${cy}" r="27" fill="#fff" stroke="${HP_INK}" stroke-width="4"/>${T(cx, cy + 12, String(n), { s: 34, w: 800, c: HP_INK })}</g>`; }
    else for (const k of labelKeys) { if (valveTag && valveTag[k]) continue; const L = LAB[k]; if (!L) continue; const [, lines, x, y, a] = L;
      const sx = a === "end" ? x + 8 : a === "start" ? x - 8 : x, sy = a === "middle" ? y - 40 : y - 12;
      s += `<g class="hlab" data-lab="${k}" pointer-events="none">${pinsOf(k).map(([px, py]) => lead2(sx, sy, px, py)).join("")}${lines.map((l, i) => T(x, y + i * 36, l, { a, s: i ? FS2 : FS, w: i ? 600 : 800, c: i ? "#46566a" : HP_INK })).join("")}</g>`; }
    if (o.sides !== false) s += T(18, 1012, "RIGHT side (your left)", { a: "start", s: 32, w: 800, c: HP_DE }) + T(1518, 1012, "LEFT side (your right)", { a: "end", s: 32, w: 800, c: HP_OX });
    if (o.chambers) s += `<g data-r="legend" pointer-events="none"><rect x="14" y="16" width="420" height="108" rx="14" fill="#ffffff" stroke="#c3ccd6" stroke-width="2"/><path d="M36 52 L100 52" stroke="${HP_HL}" stroke-width="10"/>${T(114, 63, "contracting", { a: "start", s: 32, w: 700 })}<path d="M36 98 L100 98" stroke="${HP_INK}" stroke-width="4" stroke-dasharray="16 12"/>${T(114, 109, "relaxed", { a: "start", s: 32, w: 700 })}</g>`;
    if (o.marker) { const p = routeAt(0); s += `<g data-r="marker" transform="translate(${p.x} ${p.y})" aria-hidden="true" pointer-events="none"><circle r="22" fill="#fff" fill-opacity=".9"/><circle r="15" fill="${HP_DE}" stroke="#fff" stroke-width="4"/></g>`; }
    return flat(s + "</svg>"); };
  // the numbered version (labelling questions): numbers 1–14 in the margins with leader lines to each structure
  const heartNumbered = (o = {}) => heartPhoto({ numbers: true, sides: o.sides !== false, width: o.width || 760, title: o.title || "Section through the mammalian heart with structures numbered 1 to 14" });
  const heartPhotoKit = { IMG, PIN, NUMBER_OF, VALVE, SHAPES, LABELS, FLOW, ROUTE, routeAt, route: routeInfo, colours: { DE: HP_DE, OX: HP_OX, HL: HP_HL, OPEN: HP_OPEN, SHUT: HP_SHUT } };

  // ---------- external view of the heart (front) ----------
  // Drawn back to front so every crossing reads correctly: right pulmonary artery (passes BEHIND the aorta and superior
  // vena cava) and pulmonary veins (enter the left atrium at the back) first; then the aorta, whose root is hidden behind
  // the pulmonary trunk and the right auricle, so it is never seen to leave the right ventricle; the arch passes over the
  // pulmonary bifurcation and goes down behind the left pulmonary artery; venae cavae, then the right atrium over their
  // ends; the ventricles (right ventricle forms most of the front, left ventricle a strip on the viewer's right forming
  // the apex); left auricle; pulmonary trunk leaving the top of the right ventricle; right auricle; and last the coronary
  // arteries, which start from the base of the aorta (the left one passes behind the pulmonary trunk, shown dashed).
  const heartExternal = (o = {}) => {
    uid(); const W = 640, H = 600; const labels = o.labels !== false;
    const BLU = "#6f8fc7", RED = "#e46a5c";
    const tube = (d, w, c) => `<path d="${d}" stroke="${MUSS}" stroke-width="${w + 6}" fill="none"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
    let s = open(W, H, "External view of the mammalian heart from the front. The heart's right side is on the viewer's left. The superior vena cava enters the right atrium from above and the inferior vena cava from below. The pulmonary artery leaves the top of the right ventricle and divides to go to both lungs. The aorta rises from behind the pulmonary artery, arches over it and goes down behind the heart. Pulmonary veins enter the left atrium at the back. The coronary arteries start at the base of the aorta and run over the surface of the heart.", marker("g", GREY));
    s += `<rect x="10" y="8" width="220" height="34" rx="8" fill="#eef3fb" stroke="${DE}" stroke-width="1.2"/>` + T(120, 30, "Body's RIGHT (your left)", { s: 12, w: 800, c: DE });
    s += `<rect x="${W - 230}" y="8" width="220" height="34" rx="8" fill="#fbefee" stroke="${OX}" stroke-width="1.2"/>` + T(W - 120, 30, "Body's LEFT (your right)", { s: 12, w: 800, c: OX });
    // 1. behind everything: right pulmonary artery (to the right lung) and the four pulmonary veins
    s += tube("M396 200 L92 200", 28, BLU);
    s += `<g fill="${RED}" stroke="${MUSS}" stroke-width="1.6"><rect x="84" y="292" width="110" height="18"/><rect x="84" y="326" width="110" height="18"/><rect x="470" y="254" width="122" height="18"/><rect x="470" y="288" width="122" height="18"/></g>`;
    // 2. aorta: three arch branches, ascending aorta (root hidden), arch, start of the descending aorta (hidden by the PA)
    s += `<path d="M323 98 L312 54 M360 88 L360 50 M397 98 L408 54" stroke="${MUSS}" stroke-width="16" fill="none"/><path d="M323 100 L312 55 M360 90 L360 51 M397 100 L408 55" stroke="${RED}" stroke-width="10" fill="none"/>`;
    s += tube("M298 330 L298 175 A62 62 0 0 1 422 175 L422 206", 38, RED);
    // 3. venae cavae (their ends lie under the right atrium)
    s += `<rect x="196" y="58" width="42" height="236" fill="${BLU}" stroke="${MUSS}" stroke-width="2.4"/><rect x="186" y="420" width="40" height="110" fill="${BLU}" stroke="${MUSS}" stroke-width="2.4"/>`;
    // 4. right atrium
    s += `<path d="M252 262 C204 254 160 292 158 350 C156 404 182 446 228 452 C262 454 272 420 270 380 L264 280 Z" fill="#cf8f86" stroke="${MUSS}" stroke-width="2.4"/>`;
    // 5. ventricles: whole ventricular mass in the right-ventricle tint, then the left ventricle strip beyond the
    //    anterior interventricular groove
    s += `<path d="M258 302 C300 288 360 284 410 288 C450 292 476 302 486 318 C502 372 494 452 452 550 C390 534 300 502 258 454 C240 428 238 362 258 302 Z" fill="#d48e84" stroke="${MUSS}" stroke-width="2.4"/>`;
    s += `<path d="M432 291 C454 294 478 304 486 318 C502 372 494 452 452 550 C448 470 442 380 432 291 Z" fill="#c47a71" stroke="${MUSS}" stroke-width="1.8"/>`;
    // 6. left auricle (the only part of the left atrium seen from the front)
    s += `<path d="M436 264 C460 246 494 252 500 274 C504 296 484 312 456 307 C444 292 436 278 436 264 Z" fill="#d99a90" stroke="${MUSS}" stroke-width="2"/>`;
    // 7. pulmonary trunk from the top of the right ventricle, dividing under the arch (left PA to the viewer's right); its
    //    base flares into the right ventricle (conus) so it is seen to leave that chamber
    s += tube("M326 324 C324 262 334 226 362 208 C376 200 388 199 400 199 L594 199", 38, BLU);
    s += `<path d="M296 334 C304 322 306 312 306 298 L346 298 C346 312 350 322 360 334 Z" fill="#d48e84"/><path d="M296 334 C304 322 306 312 306 296 M360 334 C350 322 346 312 346 296" stroke="${MUSS}" stroke-width="2.4" fill="none"/>`;
    // 8. coronary arteries from the base of the aorta. The right one starts on the aorta between the right auricle and the
    //    trunk and runs down the groove between the right atrium and right ventricle (partly under the auricle, drawn next);
    //    the left one passes behind the trunk (dashed), then divides: one branch down the groove between the ventricles
    //    towards the apex, one round the left side under the left auricle
    s += `<g stroke="${OX}" stroke-width="5" fill="none" stroke-linecap="round"><path d="M298 232 C282 252 268 278 260 312 C250 360 250 420 262 452 C292 482 334 502 380 520"/></g>`;
    s += `<circle cx="298" cy="232" r="4.5" fill="${OX}"/><circle cx="306" cy="238" r="3.5" fill="${OX}"/>`;
    s += `<path d="M248 266 C258 242 290 232 308 246 C314 264 298 284 272 292 C258 288 248 278 248 266 Z" fill="#d99a90" stroke="${MUSS}" stroke-width="2"/>`; // right auricle
    s += `<path d="M306 238 C326 254 346 276 360 292" stroke="${OX}" stroke-width="4" stroke-dasharray="5 4" fill="none"/>`;
    s += `<g stroke="${OX}" stroke-width="5" fill="none" stroke-linecap="round"><path d="M360 292 C392 292 418 290 434 294"/><path d="M434 294 C440 380 446 460 449 538"/><path d="M434 294 C456 296 474 304 486 318"/></g>`;
    s += `<g stroke="${OX}" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M256 380 L286 392 M266 450 L300 452 M438 360 L410 378 M444 440 L414 456 M438 380 L466 392"/></g>`;
    if (labels) { const L = [ // [text lines, anchor x, baseline y, leader to x, y, align]
      [["Superior vena cava"], 16, 92, 196, 104, "start"], [["Pulmonary artery", "(to the right lung)"], 16, 148, 112, 190, "start"],
      [["Pulmonary veins", "(from the right lung)"], 16, 256, 112, 292, "start"], [["Right atrium"], 16, 392, 176, 392, "start"],
      [["Inferior vena cava"], 16, 500, 186, 496, "start"], [["Right ventricle"], 16, 580, 330, 486, "start"],
      [["Aorta"], 624, 96, 438, 134, "end"], [["Pulmonary artery", "(to the left lung)"], 624, 140, 560, 184, "end"],
      [["Left atrium (auricle)"], 624, 240, 488, 262, "end"], [["Pulmonary veins", "(from the left lung)"], 624, 338, 560, 306, "end"],
      [["Left ventricle"], 624, 420, 474, 420, "end"], [["Coronary arteries", "(start at the aorta)"], 624, 482, 447, 482, "end"], [["Apex"], 624, 572, 456, 552, "end"]];
      // leader starts at the side of the label nearest its target; when the target lies above or below the label's own
      // span, it starts from the top or bottom edge, so a leader never runs back through its text
      for (const [lines, x, y, lx, ly, a] of L) { const tw = Math.max(lines[0].length * 6.3, (lines[1] || "").length * 5.3); const left = a === "start" ? x : x - tw, right = a === "start" ? x + tw : x;
        const bottom = y + (lines.length - 1) * 13 + 4; let ex, ey;
        if (lx < left) { ex = left - 4; ey = y - 4; } else if (lx > right) { ex = right + 4; ey = y - 4; } else { ex = lx; ey = ly < y ? y - 13 : bottom; }
        s += lead(ex, ey, lx, ly) + lines.map((l, i) => T(x, y + i * 13, l, { a, s: i ? 9.5 : 11, w: i ? 500 : 700, c: i ? GREY : INK })).join(""); } }
    return flat(s + "</svg>");
  };

  // ---------- blood vessels in transverse section ----------
  // Relative wall thickness and lumen within each vessel are drawn in proportion; the four vessels are NOT to the same
  // scale (a capillary is about 5–10 µm across; a medium artery several millimetres).
  const ring = (cx, cy, r1, r2, fill) => `<path d="M${cx - r2} ${cy} a${r2} ${r2} 0 1 0 ${2 * r2} 0 a${r2} ${r2} 0 1 0 ${-2 * r2} 0 Z M${cx - r1} ${cy} a${r1} ${r1} 0 1 1 ${2 * r1} 0 a${r1} ${r1} 0 1 1 ${-2 * r1} 0 Z" fill="${fill}" fill-rule="evenodd"/>`;
  const wavy = (cx, cy, r, amp, n, c, w) => { let d = ""; for (let i = 0; i <= 120; i++) { const a = (2 * Math.PI * i) / 120, rr = r + amp * Math.sin(n * a); d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); } return `<path d="${d}Z" fill="none" stroke="${c}" stroke-width="${w}"/>`; };
  const spindles = (cx, cy, r1, r2, n, c) => { let s = ""; for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n + (i % 2) * 0.12, r = r1 + ((r2 - r1) * ((i * 37) % 10)) / 10; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), deg = (a * 180) / Math.PI + 90; s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="1.8" transform="rotate(${deg.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${c}"/>`; } return s; };
  const fibres = (cx, cy, r1, r2, n, c) => { let s = ""; for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n, r = r1 + ((r2 - r1) * ((i * 53) % 9)) / 9; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), deg = (a * 180) / Math.PI + (i % 3) * 25; s += `<path d="M${(x - 5).toFixed(1)} ${y.toFixed(1)} q2.5 -2 5 0 t5 0" transform="rotate(${deg.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="${c}" stroke-width="1.1"/>`; } return s; };
  const VESSELS = {
    artery: { name: "Artery", r: [36, 40, 82, 104], elastic: 6, muscle: 40, coll: 28, note: ["Thick wall; narrow lumen", "Much elastic tissue and", "smooth muscle"] },
    arteriole: { name: "Arteriole (supporting)", r: [17, 20, 40, 48], elastic: 1, muscle: 18, coll: 10, note: ["Wall mainly smooth muscle;", "little elastic tissue"] },
    vein: { name: "Vein", r: [64, 67, 74, 88], elastic: 1, muscle: 10, coll: 22, note: ["Thin wall; wide lumen", "Little elastic tissue or muscle;", "valves (next diagram)"] },
    capillary: { name: "Capillary", r: [16, 22, 22, 22], note: ["Wall = endothelium only,", "one cell thick; lumen fits", "one red blood cell"] },
  };
  const vesselSection = (type, cx, cy, o = {}) => { const V = VESSELS[type]; const [rl, re, rm, ro] = V.r; let s = `<g data-part="${type}"${o.interactive ? ' tabindex="0" role="button"' : ""}>`;
    if (type === "capillary") { // endothelium only: two or three flattened cells (one bulging nucleus) around a lumen that fits one red cell
      const ro2 = 31, rl2 = 27; // endothelium one flattened cell thick: wall about 0.15 of the lumen radius
      s += `<circle cx="${cx}" cy="${cy}" r="${ro2}" fill="#e8a99f" stroke="#9c6450" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="${rl2}" fill="#fff8f6"/>`;
      [-90, 30, 150].forEach((deg) => { const a = (deg * Math.PI) / 180; s += `<line x1="${(cx + rl2 * Math.cos(a)).toFixed(1)}" y1="${(cy + rl2 * Math.sin(a)).toFixed(1)}" x2="${(cx + ro2 * Math.cos(a)).toFixed(1)}" y2="${(cy + ro2 * Math.sin(a)).toFixed(1)}" stroke="#fff" stroke-width="2"/>`; });
      s += `<ellipse cx="${cx - 22}" cy="${cy + 13}" rx="8" ry="4" transform="rotate(-60 ${cx - 22} ${cy + 13})" fill="#9c6450"/>`;
      s += `<ellipse cx="${cx + 1}" cy="${cy}" rx="22" ry="21" fill="#e07f7f" stroke="#b44f4f" stroke-width="1"/><ellipse cx="${cx + 1}" cy="${cy}" rx="10" ry="9" fill="#ec9f9f"/>`;
      return s + "</g>"; }
    const sq = type === "vein" ? 0.82 : 1; // veins often appear flattened or irregular in section
    s += `<g transform="translate(${cx} ${cy}) scale(1 ${sq}) translate(${-cx} ${-cy})">`;
    s += ring(cx, cy, rm, ro, "#f3e6cf") + fibres(cx, cy, rm + 3, ro - 3, Math.round(V.coll * 1.2), "#b89a62"); // tunica externa: collagen
    s += ring(cx, cy, re, rm, "#efc3c0") + spindles(cx, cy, re + 3, rm - 3, V.muscle, "#b5675f"); // tunica media: smooth muscle
    for (let i = 0; i < V.elastic; i++) { const r = re + 2 + ((rm - re - 4) * (i + 0.5)) / V.elastic; s += wavy(cx, cy, r, 1.4, 22 + i, "#4a5d9a", 1.6); } // elastic fibres
    s += ring(cx, cy, rl, re, "#e8a99f") + wavy(cx, cy, re, 0.8, 30, "#4a5d9a", type === "artery" ? 2 : 1); // endothelium + internal elastic layer
    s += `<circle cx="${cx}" cy="${cy}" r="${rl}" fill="#fff8f6"/>`;
    if (type === "artery" && o.cells !== false) s += `<ellipse cx="${cx - 8}" cy="${cy + 6}" rx="7" ry="4" fill="#e9a5a5"/>`;
    if (type === "vein" && o.cells !== false) s += `<ellipse cx="${cx + 14}" cy="${cy + 20}" rx="7" ry="4" fill="#e9a5a5"/><ellipse cx="${cx - 20}" cy="${cy - 6}" rx="7" ry="4" fill="#e9a5a5"/>`;
    return s + "</g></g>"; };
  // vesselSet: all four sections side by side, with layer labels on the artery
  const vesselSet = (o = {}) => { uid(); const W = 900, H = o.numbers ? 330 : 400; const labels = o.labels !== false && !o.numbers;
    let s = open(W, H, "Transverse sections of an artery, an arteriole, a vein and a capillary. Wall thickness and lumen are in proportion within each vessel; the vessels are not drawn to the same scale.");
    const pos = o.order || ["artery", "arteriole", "vein", "capillary"]; const X = [130, 360, 560, 790], Y = 170;
    pos.forEach((k, i) => { s += vesselSection(k, X[i], Y, o); if (labels || o.names) s += T(X[i], 300, o.names === false ? "" : VESSELS[k].name, { s: 13, w: 800 }); if (labels) VESSELS[k].note.forEach((l, j) => (s += T(X[i], 318 + j * 14, l, { s: 10.5, w: 500, c: GREY }))); if (o.numbers) s += numTag(X[i], 296, o.numbers[k]); });
    if (labels) { // layer key above the drawings
      const key = [["#e8a99f", "Endothelium (lining; smooth, reduces friction)"], ["#4a5d9a", "Elastic tissue (stretches and recoils)"], ["#efc3c0", "Smooth muscle (contracts: narrows the lumen)"], ["#f3e6cf", "Collagen (tough outer layer; resists bursting)"]];
      key.forEach(([c, t], i) => { const x = 40 + (i % 2) * 430, y = 30 + Math.floor(i / 2) * 20; s += `<rect x="${x}" y="${y - 10}" width="14" height="12" rx="2" fill="${c}" stroke="#8a7a6a" stroke-width=".8"/>` + T(x + 20, y, t, { a: "start", s: 10.5, w: 600 }); });
      s += T(790, 236, "enlarged: a real capillary is", { s: 9.5, w: 500, c: GREY }) + T(790, 248, "hundreds of times narrower", { s: 9.5, w: 500, c: GREY }) + T(790, 260, "than an artery", { s: 9.5, w: 500, c: GREY }); }
    return flat(s + "</svg>"); };
  // vesselCard: one transverse section for the Blood Vessel Comparison (3.2.6.1), with optional leader labels shown after
  // the student checks the names. Artery, vein and capillary are drawn at different enlargements (not to the same scale).
  const vesselCard = (type, o = {}) => { uid(); const W = 344, H = 230, cx = 108, cy = 115; const k = { artery: 0.98, vein: 1.1, capillary: 2.7 }[type] || 1;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${o.labels ? `Transverse section of ${type === "artery" ? "an artery" : `a ${type}`}, labelled` : "Transverse section of an unnamed blood vessel"}" style="max-width:100%;height:auto"><rect width="${W}" height="${H}" fill="#fff"/>`;
    s += `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${vesselSection(type, cx, cy, {})}</g>`;
    if (o.labels) { const P = (r, deg, sy = 1) => [cx + k * r * Math.cos((deg * Math.PI) / 180), cy + k * sy * r * Math.sin((deg * Math.PI) / 180)];
      const L = { artery: [["lumen", P(0, 0)], ["endothelium", P(38, -24)], ["elastic tissue", P(52, -2)], ["smooth muscle", P(70, 14)], ["collagen", P(94, 32)]],
        vein: [["wide lumen", P(30, 0)], ["thin wall", P(80, 10, 0.82)]], capillary: [["red blood cell", P(10, 160)], ["wall one cell", P(29, -30)], ["thick", null]] }[type] || [];
      let y = 46; for (const [t, pt] of L) { if (pt) s += lead(214, y - 5, pt[0], pt[1]) + `<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="2.6" fill="${INK}"/>`; s += T(218, y, t, { a: "start", s: 15, w: 700 }); y += pt ? 34 : 18; } }
    return flat(s + "</svg>"); };
  // ---------- valves in a vein (figure d-3.2.6.1-2), redrawn 2026-11-15 as a clean schematic ----------
  // Replaces the OpenStax muscle-pump picture (too large, muscle bundles dominated, both left valves labelled closed).
  // Two short vein segments in longitudinal section, heart at the top. Left: blood moving towards the heart pushes the
  // cusps flat against the wall (valve open). Right: blood starting to flow back fills the pockets and presses the cusps
  // together in the centre (valve closed). Labels 14 px at the natural size (620 px wide).
  const veinValves = () => { uid(); const W = 660, H = 330, BL = "#c9d8f2", PK = "#7f9fd6", WALL = "#5a78b0", CU = "#fbf6ea", CUS = "#6b4a2b";
    let s = open(W, H, "Valves in a vein, two longitudinal sections with the heart at the top. Left, valve open: blood flows up towards the heart and pushes the two cusps flat against the vein wall. Right, valve closed: blood starts to flow back down, fills the pocket behind each cusp and presses the cusps together in the centre, so backflow is prevented.", marker("vu", DE) + marker("vd", "#b3261e"));
    const vein = (x0) => `<rect x="${x0 + 8}" y="56" width="104" height="262" fill="${BL}"/><rect x="${x0}" y="56" width="10" height="262" rx="3" fill="${WALL}"/><rect x="${x0 + 110}" y="56" width="10" height="262" rx="3" fill="${WALL}"/>`;
    // left: open valve (cusps lie against the walls)
    const L0 = 150; s += vein(L0);
    s += `<path d="M${L0 + 10} 214 C${L0 + 22} 192 ${L0 + 24} 160 ${L0 + 20} 128 L${L0 + 12} 128 Z" fill="${CU}" stroke="${CUS}" stroke-width="2.5"/><path d="M${L0 + 110} 214 C${L0 + 98} 192 ${L0 + 96} 160 ${L0 + 100} 128 L${L0 + 108} 128 Z" fill="${CU}" stroke="${CUS}" stroke-width="2.5"/>`;
    s += `<path d="M${L0 + 60} 300 L${L0 + 60} 74" stroke="${DE}" stroke-width="5" fill="none" marker-end="url(#vu${U})"/>`;
    s += T(L0 + 60, 22, "Valve open", { s: 16, w: 800 }) + T(L0 + 60, 42, "blood flows towards the heart", { s: 14, w: 500, c: GREY });
    s += lead(L0 - 8, 168, L0 + 14, 168) + T(L0 - 12, 164, "cusp pressed", { a: "end", s: 14, w: 700 }) + T(L0 - 12, 182, "against the wall", { a: "end", s: 14, w: 500, c: GREY });
    s += lead(L0 - 8, 270, L0 + 2, 270) + T(L0 - 12, 275, "thin vein wall", { a: "end", s: 14, w: 500, c: GREY });
    // right: closed valve (cusps meet in the centre; pockets full of blood)
    const R0 = 400, cx = R0 + 60; s += vein(R0);
    const cuspL = `M${R0 + 10} 222 C${R0 + 22} 196 ${R0 + 36} 170 ${cx - 2} 150`, cuspR = `M${R0 + 110} 222 C${R0 + 98} 196 ${R0 + 84} 170 ${cx + 2} 150`;
    s += `<path d="M${R0 + 8} 58 L${R0 + 112} 58 L${R0 + 112} 222 C${R0 + 98} 196 ${R0 + 84} 170 ${cx} 150 C${R0 + 36} 170 ${R0 + 22} 196 ${R0 + 8} 222 Z" fill="${PK}" opacity=".75"/>`;
    s += `<path d="${cuspL}" fill="none" stroke="${CUS}" stroke-width="8" stroke-linecap="round"/><path d="${cuspL}" fill="none" stroke="${CU}" stroke-width="4.5" stroke-linecap="round"/><path d="${cuspR}" fill="none" stroke="${CUS}" stroke-width="8" stroke-linecap="round"/><path d="${cuspR}" fill="none" stroke="${CU}" stroke-width="4.5" stroke-linecap="round"/>`;
    s += `<path d="M${cx - 30} 70 L${cx - 30} 136" stroke="#b3261e" stroke-width="4" fill="none" marker-end="url(#vd${U})"/><path d="M${cx + 30} 70 L${cx + 30} 136" stroke="#b3261e" stroke-width="4" fill="none" marker-end="url(#vd${U})"/>`;
    s += T(cx, 22, "Valve closed", { s: 16, w: 800 }) + T(cx, 42, "backflow is prevented", { s: 14, w: 500, c: GREY });
    s += lead(R0 + 128, 92, cx + 30, 96) + T(R0 + 134, 88, "blood starts", { a: "start", s: 14, w: 700, c: "#8f2a24" }) + T(R0 + 134, 106, "to flow back", { a: "start", s: 14, w: 500, c: GREY });
    s += lead(R0 + 128, 152, cx + 4, 152) + T(R0 + 134, 148, "cusps meet", { a: "start", s: 14, w: 700 }) + T(R0 + 134, 166, "in the centre", { a: "start", s: 14, w: 500, c: GREY });
    s += lead(R0 + 128, 214, R0 + 98, 168) + T(R0 + 134, 218, "pocket fills", { a: "start", s: 14, w: 700 }) + T(R0 + 134, 236, "with blood", { a: "start", s: 14, w: 500, c: GREY });
    // heart direction
    s += `<path d="M335 280 L335 80" stroke="${DE}" stroke-width="3" fill="none" stroke-dasharray="6 5" marker-end="url(#vu${U})"/>` + T(335, 302, "towards", { s: 14, w: 700, c: DE }) + T(335, 320, "the heart", { s: 14, w: 700, c: DE });
    return flat(s + "</svg>"); };

  // ---------- capillary structure and exchange ----------
  const capillaryExchange = () => { uid(); const W = 820, H = 330; let s = open(W, H, "A capillary in longitudinal section beside respiring body cells. The wall is a single layer of flattened endothelial cells with small gaps between them; red blood cells pass in single file close to the wall. Oxygen and glucose diffuse out through the tissue fluid to the cells; carbon dioxide diffuses from the cells into the blood.", marker("ox", OX) + marker("de", DE) + marker("g", "#2e7d4f"));
    for (let i = 0; i < 6; i++) { const x = 40 + i * 130; s += `<rect x="${x}" y="24" width="112" height="74" rx="14" fill="#eef5e8" stroke="#5d8a6f" stroke-width="1.4"/><ellipse cx="${x + 56}" cy="61" rx="16" ry="11" fill="#cfe0f0" stroke="#7b93ad"/>`; }
    s += T(30, 18, "body cells (respiring)", { a: "start", s: 10.5, w: 600, c: "#3f6a51" });
    s += `<rect x="20" y="100" width="780" height="40" fill="#f6fbff"/><rect x="20" y="222" width="780" height="20" fill="#f6fbff"/>` + T(30, 116, "tissue fluid", { a: "start", s: 10, w: 600, c: GREY });
    for (const y of [140, 214]) { for (let i = 0; i < 5; i++) { const x = 60 + i * 150; s += `<rect x="${x}" y="${y}" width="142" height="8" rx="4" fill="#d9a48f" stroke="#9c6450" stroke-width="1"/><ellipse cx="${x + 70}" cy="${y + 4}" rx="16" ry="4" fill="#9c6450"/>`; } }
    s += `<rect x="60" y="148" width="742" height="66" fill="#fff3f1"/>`;
    for (let i = 0; i < 6; i++) { const x = 110 + i * 120; s += `<ellipse cx="${x}" cy="181" rx="22" ry="27" fill="#e07f7f" stroke="#b44f4f"/><ellipse cx="${x}" cy="181" rx="9" ry="13" fill="#ec9f9f"/>`; }
    s += arrow("M70 181 L790 181", "#b44f4f", "ox", { w: 2, da: "6 6" });
    [[180, "O₂", OX, "ox"], [330, "glucose", "#2e7d4f", "g"], [480, "O₂", OX, "ox"]].forEach(([x, t, c, m]) => { s += arrow(`M${x} 150 L${x} 104`, c, m, { w: 2.6 }) + T(x + 6, 128, t, { a: "start", s: 10.5, w: 700, c }); });
    s += arrow("M620 104 L620 148", DE, "de", { w: 2.6 }) + T(626, 128, "CO₂", { a: "start", s: 10.5, w: 700, c: DE });
    s += lead(130, 222, 130, 258) + T(40, 272, "endothelial cell: the wall is one cell thick", { a: "start", s: 10.5, w: 600 });
    s += lead(506, 222, 520, 258) + T(470, 272, "small gaps between the cells", { a: "start", s: 10.5, w: 600 });
    s += T(410, 298, "red blood cells pass in single file, close to the wall: a short diffusion distance", { s: 10.5, w: 600, c: "#8f3434" });
    s += T(800, 322, "Schematic. Lumen about 5–10 µm wide; endothelium thickness exaggerated.", { a: "end", s: 9, w: 500, c: GREY });
    return flat(s + "</svg>"); };

  // ---------- lymphatic return (schematic, figure d-3.2.6.1-5) ----------
  const lymphReturn = () => { uid(); const W = 820, H = 270; let s = open(W, H, "Schematic of the return of tissue fluid. Excess tissue fluid enters blind-ended lymph capillaries, flows through lymph vessels with valves and lymph nodes, and drains into veins near the heart, so it rejoins the blood.", marker("l", "#7a5a12") + marker("de", DE));
    const box = (x, y, w, t1, t2, f, c) => `<rect x="${x}" y="${y}" width="${w}" height="64" rx="12" fill="${f}" stroke="${c}" stroke-width="1.8"/>` + T(x + w / 2, y + 27, t1, { s: 15, w: 800 }) + T(x + w / 2, y + 48, t2, { s: 13, w: 500, c: GREY });
    s += box(10, 20, 170, "Tissue fluid", "around the cells", "#f6fbff", "#1f66b0") + box(214, 20, 180, "Lymph capillaries", "blind-ended", "#fff7dd", "#b08a2a");
    s += box(428, 20, 180, "Lymph vessels", "with valves", "#fff7dd", "#b08a2a") + box(642, 20, 168, "Lymph nodes", "(supporting)", "#fff7dd", "#b08a2a");
    s += box(642, 150, 168, "Veins near", "the heart", "#eef3fb", DE) + box(394, 150, 214, "Vena cava", "back to the right atrium", "#eef3fb", DE);
    s += arrow("M180 52 L210 52", "#7a5a12", "l") + arrow("M394 52 L424 52", "#7a5a12", "l") + arrow("M608 52 L638 52", "#7a5a12", "l") + arrow("M726 84 L726 146", "#7a5a12", "l") + arrow("M642 182 L612 182", DE, "de");
    s += T(10, 136, "In the simplified model some", { a: "start", s: 14, w: 600 }) + T(10, 156, "tissue fluid returns to the", { a: "start", s: 14, w: 600 }) + T(10, 176, "capillary at the venule end;", { a: "start", s: 14, w: 600 }) + T(10, 196, "the rest returns as lymph.", { a: "start", s: 14, w: 600 });
    s += T(10, 252, "Lymph moves because surrounding muscles squeeze the lymph vessels; valves stop it flowing back.", { a: "start", s: 14, w: 600, c: "#7a5a12" });
    return flat(s + "</svg>"); };

  // ---------- cardiac cycle graph: pressures (LA, LV, aorta) and LV volume ----------
  // o: { w, cursor (s), events: true, numberedEvents (letters instead of names), hide: {la, lv, ao, vol}, title, grid }
  const cycleGraph = (o = {}) => { uid(); const W = o.w || 760, H = 600; const L = 70, R = W - 70, top1 = 106, bot1 = 336, top2 = 384, bot2 = 534; const pmax = 18, vmin = 40, vmax = 140;
    const X = (t) => L + ((R - L) * t) / P.T, Y1 = (p) => bot1 - ((bot1 - top1) * p) / pmax, Y2 = (v) => bot2 - ((bot2 - top2) * (v - vmin)) / (vmax - vmin);
    const pts = sample(401); const path = (f, Y) => pts.map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(f(p)).toFixed(1)).join(" ");
    const hide = o.hide || {}; const ev = EV;
    let s = open(W, H, o.aria || "Graph of one illustrative cardiac cycle of the left side of the heart: pressure in the left atrium, left ventricle and aorta (top) and volume of the left ventricle (bottom) against time, with the opening and closing of the valves marked where the pressure curves cross.", marker("g", GREY));
    s += T(L, 20, o.title || "One cardiac cycle, left side of the heart (illustrative values, adult at rest)", { a: "start", s: 14, w: 800 });
    // phase bands (above the plot): atrial systole, ventricular systole, diastole
    const bands = [[0, P.tSys, "atrial systole", "#fdf5df"], [P.tSys, ev.slClose, "ventricular systole", "#fbe3e3"], [ev.slClose, P.T, "diastole", "#e9f1fb"]];
    for (const [a, b, t, c] of bands) s += `<rect x="${X(a)}" y="32" width="${X(b) - X(a)}" height="22" fill="${c}"/>` + T((X(a) + X(b)) / 2, 48, t, { s: 13, w: 700, c: "#46525e" });
    // grids and axes
    const gridOn = o.grid !== false;
    for (let p = 0; p <= pmax; p += 2) s += (gridOn ? `<line x1="${L}" y1="${Y1(p)}" x2="${R}" y2="${Y1(p)}" stroke="#e6ecef" stroke-width="1"/>` : "") + T(L - 8, Y1(p) + 4, p, { a: "end", s: 12, w: 500, c: GREY });
    for (let m = 0; m <= 130; m += 20) s += T(R + 8, Y1(kPa(m)) + 4, m, { a: "start", s: 12, w: 500, c: "#6f7c89" });
    for (let v = vmin; v <= vmax; v += 20) s += (gridOn ? `<line x1="${L}" y1="${Y2(v)}" x2="${R}" y2="${Y2(v)}" stroke="#e6ecef" stroke-width="1"/>` : "") + T(L - 8, Y2(v) + 4, v, { a: "end", s: 12, w: 500, c: GREY });
    for (let i = 0; i <= 8; i++) { const t = i / 10; s += (gridOn ? `<line x1="${X(t)}" y1="${top1}" x2="${X(t)}" y2="${bot1}" stroke="#e6ecef"/><line x1="${X(t)}" y1="${top2}" x2="${X(t)}" y2="${bot2}" stroke="#e6ecef"/>` : "") + T(X(t), bot2 + 19, t.toFixed(1), { s: 12, w: 500, c: GREY }); }
    s += `<path d="M${L} ${top1} L${L} ${bot1} L${R} ${bot1} L${R} ${top1}" fill="none" stroke="${INK}" stroke-width="1.4"/><path d="M${L} ${top2} L${L} ${bot2} L${R} ${bot2}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<text transform="translate(20 ${(top1 + bot1) / 2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="700" fill="${INK}">Pressure / kPa</text>`;
    s += `<text transform="translate(${W - 14} ${(top1 + bot1) / 2}) rotate(90)" text-anchor="middle" font-size="12" font-weight="600" fill="#6f7c89">Pressure / mmHg</text>`;
    s += `<text transform="translate(20 ${(top2 + bot2) / 2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="700" fill="${INK}">Volume / cm³</text>`;
    s += T((L + R) / 2, bot2 + 40, "Time / s", { s: 13, w: 700 });
    // valve events: names in two rows above the plot (closing events end-anchored to the left of the line, opening events
    // start-anchored to the right), so no name sits on a tick label or on another name
    if (o.events !== false) { const names = o.numberedEvents ? { avClose: "A", slOpen: "B", slClose: "C", avOpen: "D" } : { avClose: "AV valve closes", slOpen: "SL valve opens", slClose: "SL valve closes", avOpen: "AV valve opens" };
      const lab = [["avClose", -1, 74], ["slOpen", 1, 96], ["slClose", -1, 74], ["avOpen", 1, 96]];
      lab.forEach(([k, side, y]) => { const x = X(ev[k]); s += `<line x1="${x}" y1="${o.numberedEvents ? top1 : y + 4}" x2="${x}" y2="${bot2}" stroke="#7a8794" stroke-width="1.2" stroke-dasharray="4 4"/>`;
        if (o.numberedEvents) s += `<circle cx="${x}" cy="${top2 - 22}" r="11" fill="#fff" stroke="${INK}" stroke-width="1.4"/>` + T(x, top2 - 17.5, names[k], { s: 13, w: 800 });
        else s += T(x + side * 5, y, names[k], { a: side < 0 ? "end" : "start", s: 13.5, w: 700, c: "#2f3b47" }); }); }
    // curves
    if (!hide.ao) s += `<path d="${path((p) => p.ao, Y1)}" fill="none" stroke="#a3367f" stroke-width="2.6"/>` + T(X(0.5) + 6, Y1(ao(0.5)) - 8, "aorta", { a: "start", s: 13.5, w: 800, c: "#a3367f" });
    if (!hide.lv) s += `<path d="${path((p) => p.lv, Y1)}" fill="none" stroke="${OX}" stroke-width="2.8"/>` + T(X(0.13) - 6, Y1(8), "left ventricle", { a: "end", s: 13.5, w: 800, c: OX });
    if (!hide.la) s += `<path d="${path((p) => p.la, Y1)}" fill="none" stroke="#1f66b0" stroke-width="2.4"/>` + T(X(0.62), Y1(la(0.62)) - 8, "left atrium", { s: 13.5, w: 800, c: "#1f66b0" });
    if (!hide.vol) s += `<path d="${path((p) => p.vol, Y2)}" fill="none" stroke="#2e7d4f" stroke-width="2.8"/>` + T(X(0.6), Y2(vol(0.6)) - 8, "left ventricular volume", { s: 13.5, w: 800, c: "#2e7d4f" });
    if (o.cursor != null) { const x = X(wrap(o.cursor)); s += `<line x1="${x}" y1="${top1 - 4}" x2="${x}" y2="${bot2 + 4}" stroke="#e0a100" stroke-width="2.5"/><circle cx="${x}" cy="${Y1(lv(o.cursor))}" r="4.5" fill="${OX}"/><circle cx="${x}" cy="${Y1(ao(o.cursor))}" r="4.5" fill="#a3367f"/><circle cx="${x}" cy="${Y1(la(o.cursor))}" r="4.5" fill="#1f66b0"/><circle cx="${x}" cy="${Y2(vol(o.cursor))}" r="4.5" fill="#2e7d4f"/>`; }
    s += T(W - 70, H - 6, "Illustrative model values (sources on the page); not a measured trace.", { a: "end", s: 11.5, w: 500, c: GREY });
    return flat(s + "</svg>"); };

  B.heartArt = { COL, HEART_PARTS, heartPhoto, heartNumbered, heartPhotoKit, heartExternal, VESSELS, vesselSection, vesselSet, vesselCard, veinValves, capillaryExchange, lymphReturn, cycleGraph, uidNow: () => U };
})(window.BIO);
