// Drawings and models for 3.3.2.1 The light-dependent reaction and 3.3.2.2 The light-independent reaction (Phase 5
// Batch 1, author U2). Loaded after 3.3.1.3.js and before 3.3.2.1.js, 3.3.2.2.js and js/views/interactives-photo.js.
// Namespaces: B.photoArt (drawings), B.ldrModel (qualitative outcomes of the Electron Transfer Challenge),
// B.calvinModel (carbon accounting for the Calvin Cycle Explorer). B.photoModel is left to the 3.3.2.3 / RP7 author.
//
// Scientific conventions (checked against the 9610 v5.1 wording, printed p.29, and the sources in the content files):
// - Thylakoid membrane drawings put the STROMA at the top and the THYLAKOID SPACE (lumen) at the bottom. Protons are
//   pumped from the stroma INTO the thylakoid space by an electron carrier, are released INTO the thylakoid space by
//   photolysis, and flow OUT of the thylakoid space INTO the stroma through the channel of ATP synthase, whose head
//   (where ADP + Pi -> ATP) faces the stroma. Reduced NADP is made on the stroma side. Light is absorbed by chlorophyll
//   only; nothing shows light acting on ATP synthase: ATP is made by the flow of protons (chemiosmosis).
// - Two chlorophyll complexes are drawn (photosystems II and I, labelled "supporting"); electrons are excited at both.
// - Water splitting faces the thylakoid space: 2H2O -> 4H+ + 4e- + O2.
// - Calvin cycle carbon accounting uses one stated basis throughout: one ROUND = three CO2 fixed (three turns of the cycle,
//   if a turn is counted per CO2). Per round: 3 RuBP (15 C) + 3 CO2 (3 C) -> 6 GP (18 C) -> 6 TP (18 C), using 6 ATP and
//   6 reduced NADP; 1 TP (3 C) leaves; 5 TP (15 C) + 3 ATP -> 3 RuBP (15 C). Totals per round: 9 ATP, 6 reduced NADP.
//   B.calvinModel.validate() checks that carbon is conserved at every step (run by the author's check script).
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5b6573", WHITE = "#ffffff";
  const CHL = "#4e9a5a", CHLD = "#2b6537", STROMA = "#eef5e1", LUMEN = "#f5e9f5", LUMS = "#8a5a94";
  const MEM = "#f2e6bd", HEAD = "#cdb064", HP = "#b3261e", EL = "#1d5fae", ATPC = "#a8520c", NADPC = "#6a3893";
  const OXY = "#1c7aa3", LIGHT = "#c98f00", RUBC = "#3d7a4a", GPC = "#2f62a6", TPC = "#b25a12", CO2C = "#4a4a4a";
  const SEL = "#e0a400";
  let cnt = 0, U = ""; const uid = () => (U = "-ps" + (++cnt));
  const r1 = (x) => Math.round(x * 10) / 10;
  const T = (x, y, s, o = {}) => { const lines = String(s).split("\n"); const lh = (o.s || 14) * 1.2;
    return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}${o.k ? ` data-k="${o.k}"` : ""}>${lines.map((l, i) => `<tspan x="${r1(x)}" dy="${i ? lh.toFixed(1) : 0}">${l}</tspan>`).join("")}</text>`; };
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.c || INK}" stroke-width="${o.w || 1.5}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.cap ? ` stroke-linecap="${o.cap}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const P = (d, o = {}) => `<path d="${d}" fill="${o.f || "none"}" stroke="${o.c || INK}" stroke-width="${o.w || 2}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}${o.id ? ` data-path="${o.id}"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="10" markerHeight="10" refX="7.5" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10z" fill="${col}"/></marker>`;
  const defs = (list) => `<defs>${list.map(([i, c]) => marker(i, c)).join("")}</defs>`;
  const svg = (w, h, aria, inner, cls) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${aria}"${cls ? ` class="${cls}"` : ""} style="max-width:100%;height:auto;display:block" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">${inner}</svg>`;
  // leader line ending on the structure with a small dot
  const lead = (x1, y1, x2, y2) => L(x1, y1, x2, y2, { c: INK, w: 1.3 }) + `<circle cx="${r1(x2)}" cy="${r1(y2)}" r="2.6" fill="${INK}"/>`;
  // wavy light arrow from (x1,y1) to (x2,y2)
  const wave = (x1, y1, x2, y2, o = {}) => { const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux; const n = Math.max(4, Math.round(len / 14)); let d = `M${r1(x1)} ${r1(y1)}`;
    for (let i = 1; i <= n; i++) { const t = i / n, a = (i % 2 ? 1 : -1) * (o.amp || 6); const mx = x1 + dx * (t - 0.5 / n) + nx * a, my = y1 + dy * (t - 0.5 / n) + ny * a; d += ` Q${r1(mx)} ${r1(my)} ${r1(x1 + dx * t)} ${r1(y1 + dy * t)}`; }
    return P(d, { c: o.c || LIGHT, w: o.w || 3, m: o.m || "lt" }); };
  const X = (x, y, s = 13) => `<g stroke="${HP}" stroke-width="5" stroke-linecap="round"><line x1="${x - s}" y1="${y - s}" x2="${x + s}" y2="${y + s}"/><line x1="${x + s}" y1="${y - s}" x2="${x - s}" y2="${y + s}"/></g>`;
  const hplus = (x, y, o = {}) => T(x, y, "H⁺", { s: o.s || 14, w: 700, c: o.c || HP });

  // ===================================== Chloroplast: whole organelle =====================================
  // o.labels (default true), o.sites (show where each reaction happens), o.sel (part key to highlight).
  // Parts (data-part): outer, inner, stroma, granum, thylakoid, lamella, starch.
  const GRANA = [{ x: 175, y: 172, n: 6 }, { x: 255, y: 224, n: 7 }, { x: 335, y: 160, n: 6 }, { x: 415, y: 220, n: 7 }, { x: 487, y: 170, n: 5 }];
  const DISC_W = 50, DISC_H = 8, DISC_G = 3.2;
  const discY = (g, k) => g.y - ((g.n * (DISC_H + DISC_G)) / 2) + k * (DISC_H + DISC_G);
  function chloroplast(o = {}) {
    uid(); const lab = o.labels !== false, sites = !!o.sites, sel = o.sel || null; const cx = 330, cy = 196, RX = 236, RY = 126;
    const on = (k) => sel === k; const glow = (k) => (on(k) ? ` stroke="${SEL}" stroke-width="5"` : "");
    let s = defs([["lt", LIGHT]]);
    // outer membrane, intermembrane gap, inner membrane, stroma
    s += `<g data-part="outer" style="cursor:pointer"><title>outer membrane</title><ellipse cx="${cx}" cy="${cy}" rx="${RX}" ry="${RY}" fill="#e3eed8" stroke="${on("outer") ? SEL : CHLD}" stroke-width="${on("outer") ? 6 : 3}"/></g>`;
    s += `<g data-part="stroma" style="cursor:pointer"><title>stroma</title><ellipse cx="${cx}" cy="${cy}" rx="${RX - 11}" ry="${RY - 11}" fill="${sites ? "#fdf3cf" : on("stroma") ? "#fbefc4" : STROMA}" stroke="none"/></g>`;
    s += `<g data-part="inner" style="cursor:pointer"><title>inner membrane</title><ellipse cx="${cx}" cy="${cy}" rx="${RX - 11}" ry="${RY - 11}" fill="none" stroke="${on("inner") ? SEL : CHLD}" stroke-width="${on("inner") ? 6 : 2.4}"/></g>`;
    // ribosomes and DNA in the stroma (small, unlabelled details for realism)
    [[150, 245], [205, 120], [300, 290], [372, 112], [545, 205], [125, 190], [520, 250]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="2.2" fill="#6f7f6a"/>`; });
    // starch grain
    s += `<g data-part="starch" style="cursor:pointer"><title>starch grain</title><ellipse cx="440" cy="282" rx="27" ry="13" fill="#fbfaf2" stroke="${on("starch") ? SEL : "#a9a68f"}" stroke-width="${on("starch") ? 4 : 1.6}"/></g>`;
    // intergranal lamellae (link the grana)
    const lam = []; for (let i = 0; i < GRANA.length - 1; i++) { const a = GRANA[i], b = GRANA[i + 1]; const ya = discY(a, Math.floor(a.n / 2)) + DISC_H / 2, yb = discY(b, Math.floor(b.n / 2) - 1) + DISC_H / 2; lam.push(`M${a.x + DISC_W / 2 - 2} ${r1(ya)} C${a.x + DISC_W / 2 + 14} ${r1(ya)} ${b.x - DISC_W / 2 - 14} ${r1(yb)} ${b.x - DISC_W / 2 + 2} ${r1(yb)}`); }
    s += `<g data-part="lamella" style="cursor:pointer"><title>intergranal lamella</title>${lam.map((d) => `<path d="${d}" fill="none" stroke="${on("lamella") ? SEL : sites ? "#2f8a3e" : CHL}" stroke-width="${on("lamella") ? 7 : 5}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${LUMEN}" stroke-width="1.6"/>`).join("")}</g>`;
    // grana: stacks of thylakoid discs
    GRANA.forEach((g, gi) => { let discs = ""; for (let k = 0; k < g.n; k++) { const y = discY(g, k); discs += `<rect x="${g.x - DISC_W / 2}" y="${r1(y)}" width="${DISC_W}" height="${DISC_H}" rx="4" fill="${sites ? "#3e9c4c" : CHL}" stroke="${on("thylakoid") ? SEL : CHLD}" stroke-width="${on("thylakoid") ? 2.6 : 1.2}"/>`; }
      const top = discY(g, 0) - 3, bot = discY(g, g.n - 1) + DISC_H + 3;
      s += `<g data-part="granum" style="cursor:pointer"><title>granum</title>${on("granum") ? `<rect x="${g.x - DISC_W / 2 - 5}" y="${r1(top)}" width="${DISC_W + 10}" height="${r1(bot - top)}" rx="7" fill="none"${glow("granum")}/>` : ""}${discs}</g>`; });
    if (sites) {
      // where each stage happens (replaces the structure labels)
      s += `<rect x="10" y="10" width="300" height="50" rx="10" fill="#e3f3e1" stroke="#2f8a3e" stroke-width="2"/>` + T(160, 31, "Light-dependent reaction:", { s: 15, w: 700, c: "#1f6a2c" }) + T(160, 50, "thylakoid membranes (grana)", { s: 15, w: 600, c: "#1f6a2c" });
      s += lead(205, 60, GRANA[0].x + 10, discY(GRANA[0], 0) + 2);
      s += `<rect x="350" y="336" width="300" height="50" rx="10" fill="#fdf3cf" stroke="#b78a00" stroke-width="2"/>` + T(500, 357, "Light-independent reaction:", { s: 15, w: 700, c: "#7a5a00" }) + T(500, 376, "stroma (Calvin cycle)", { s: 15, w: 600, c: "#7a5a00" });
      s += lead(450, 336, 380, 292);
      s += wave(470, 12, 432, 78, { m: "lt" }) + T(520, 26, "light", { s: 15, w: 700, c: "#8a6200" });
    } else if (lab) {
      const om = (deg) => [cx + RX * Math.cos((deg * Math.PI) / 180), cy + RY * Math.sin((deg * Math.PI) / 180)];
      const im = (deg) => [cx + (RX - 11) * Math.cos((deg * Math.PI) / 180), cy + (RY - 11) * Math.sin((deg * Math.PI) / 180)];
      const [ox, oy] = om(-130), [ix, iy] = im(-100);
      s += T(90, 36, "outer membrane", { s: 15 }) + lead(110, 44, ox, oy);
      s += T(246, 22, "inner membrane", { s: 15 }) + lead(254, 28, ix, iy);
      const la = GRANA[2], lb = GRANA[3]; const ly = (discY(la, 3) + DISC_H / 2 + discY(lb, 2) + DISC_H / 2) / 2;
      s += T(430, 22, "intergranal lamella", { s: 15 }) + lead(420, 28, (la.x + lb.x) / 2, ly);
      s += T(586, 52, "granum\n(stack of thylakoids)", { s: 15 }) + lead(560, 74, GRANA[4].x + 14, discY(GRANA[4], 0) - 1);
      s += T(74, 366, "stroma", { s: 15 }) + lead(84, 352, 128, 246);
      s += T(208, 384, "thylakoid", { s: 15 }) + lead(208, 370, GRANA[1].x - 10, discY(GRANA[1], GRANA[1].n - 1) + DISC_H / 2);
      s += T(596, 340, "starch grain", { s: 15 }) + lead(574, 326, 466, 284);
    }
    return svg(660, 400, "Chloroplast cut in section: a double membrane (outer and inner), the fluid stroma, stacks of thylakoid discs called grana linked by intergranal lamellae, and a starch grain", s);
  }

  // ===================================== Chloroplast: close-up of one granum =====================================
  // Parts: tmem (thylakoid membrane), tspace (thylakoid space), stroma, atps (ATP synthase), granum, lamella, pump.
  function granum(o = {}) {
    uid(); const lab = o.labels !== false, sites = !!o.sites, sel = o.sel || null; const on = (k) => sel === k;
    let s = defs([["hp", HP], ["lt", LIGHT]]);
    s += `<g data-part="stroma" style="cursor:pointer"><title>stroma</title><rect x="0" y="0" width="660" height="400" fill="${sites || on("stroma") ? "#fbf0c8" : STROMA}"/></g>`;
    const X0 = 170, X1 = 450, H = 46, G = 11, Y0 = 100; const ys = [0, 1, 2, 3].map((i) => Y0 + i * (H + G)); const yB = ys[3] + H;
    const memC = on("tmem") ? SEL : sites ? "#2f8a3e" : CHL, memW = on("tmem") ? 9 : 7, lum = on("tspace") ? "#ecd0ec" : LUMEN;
    // intergranal lamella leaving the second thylakoid to the right (its lumen is continuous with the thylakoid's)
    s += `<g data-part="lamella" style="cursor:pointer"><title>intergranal lamella</title><rect x="${X1 - 30}" y="${ys[1] + 12}" width="${700 - X1}" height="22" fill="${lum}" stroke="${on("lamella") ? SEL : memC}" stroke-width="${on("lamella") ? 8 : memW - 1}"/></g>`;
    ys.forEach((y) => { s += `<g data-part="tmem" style="cursor:pointer"><title>thylakoid membrane</title><rect x="${X0}" y="${y}" width="${X1 - X0}" height="${H}" rx="22" fill="none" stroke="${memC}" stroke-width="${memW}"/></g><g data-part="tspace" style="cursor:pointer"><title>thylakoid space</title><rect x="${X0 + 4}" y="${y + 4}" width="${X1 - X0 - 8}" height="${H - 8}" rx="18" fill="${lum}"/></g>`; });
    s += `<rect x="${X1 - 34}" y="${ys[1] + 15.5}" width="44" height="15" fill="${lum}"/>`; // joins the lamella lumen to the thylakoid lumen
    // the granum as a whole: bracket on the left
    s += `<g data-part="granum" style="cursor:pointer"><title>granum</title><path d="M${X0 - 14} ${Y0} L${X0 - 22} ${Y0} L${X0 - 22} ${yB} L${X0 - 14} ${yB}" fill="none" stroke="${on("granum") ? SEL : INK}" stroke-width="${on("granum") ? 5 : 2}"/><rect x="${X0 - 30}" y="${Y0}" width="20" height="${yB - Y0}" fill="transparent"/></g>`;
    // protons: many in the thylakoid spaces, few in the stroma
    ys.forEach((y, i) => [0, 1, 2, 3].forEach((k) => { s += hplus(X0 + 46 + k * 60 + (i % 2) * 22, y + 30, { s: 15 }); }));
    [[60, 150], [610, 300], [628, 262]].forEach(([x, y]) => { s += hplus(x, y, { s: 15 }); });
    // ATP synthase knobs on membranes facing the stroma (head in the stroma), and one proton-pumping electron carrier
    const knob = (x, y, up) => { const d = up ? -1 : 1; return `<g data-part="atps" style="cursor:pointer"><title>ATP synthase</title><rect x="${x - 5}" y="${up ? y - 13 : y}" width="10" height="13" fill="${on("atps") ? SEL : ATPC}"/><circle cx="${x}" cy="${y + d * 22}" r="10.5" fill="${on("atps") ? SEL : ATPC}" stroke="${WHITE}" stroke-width="1.5"/></g>`; };
    s += knob(340, Y0 - 3, true) + knob(410, Y0 - 3, true) + knob(250, yB + 3, false) + knob(370, yB + 3, false) + knob(560, ys[1] + 9, true);
    s += `<g data-part="pump" style="cursor:pointer"><title>electron carrier that pumps protons</title><rect x="${232}" y="${Y0 - 9}" width="26" height="18" rx="5" fill="${on("pump") ? SEL : "#c7daf3"}" stroke="${EL}" stroke-width="2"/></g>`;
    // proton movements: pumped in (stroma -> thylakoid space); out through ATP synthase (thylakoid space -> stroma)
    s += L(245, 38, 245, Y0 + 22, { c: HP, w: 2.6, m: "hp" }) + L(340, Y0 + 22, 340, Y0 - 42, { c: HP, w: 2.6, m: "hp" });
    if (lab && !sites) {
      s += T(236, 34, "H⁺ pumped in", { s: 14, w: 700, c: HP, a: "end" }) + T(352, 52, "H⁺ flows out", { s: 14, w: 700, c: HP, a: "start" });
      s += T(56, 30, "stroma", { s: 15 }) + lead(58, 36, 92, 76);
      s += T(80, 238, "granum", { s: 15 }) + lead(108, 234, X0 - 22, 230);
      s += T(560, 92, "intergranal\nlamella", { s: 15 }) + lead(560, 112, 600, ys[1] + 16);
      s += T(560, 226, "thylakoid\nmembrane", { s: 15 }) + lead(520, 230, X1 + 3, ys[2] + 26);
      s += T(560, 330, "thylakoid\nspace", { s: 15 }) + lead(522, 332, X1 - 12, ys[3] + 23);
      s += T(150, 375, "ATP synthase", { s: 15 }) + lead(196, 362, 240, yB + 26);
    }
    if (sites) {
      s += `<rect x="426" y="6" width="228" height="54" rx="10" fill="#e3f3e1" stroke="#2f8a3e" stroke-width="2"/>` + T(540, 28, "Light-dependent reaction:", { s: 15, w: 700, c: "#1f6a2c" }) + T(540, 48, "thylakoid membranes", { s: 15, w: 600, c: "#1f6a2c" });
      s += lead(520, 60, 436, Y0 + 1);
      s += `<rect x="6" y="338" width="226" height="56" rx="10" fill="#fff7dc" stroke="#b78a00" stroke-width="2"/>` + T(119, 360, "Light-independent", { s: 15, w: 700, c: "#7a5a00" }) + T(119, 380, "reaction: stroma", { s: 15, w: 600, c: "#7a5a00" });
      s += wave(60, 14, 160, 90, { m: "lt" }) + T(40, 24, "light", { s: 15, w: 700, c: "#8a6200" });
    }
    return svg(660, 400, "Close-up of one granum: four stacked thylakoids, each a membrane enclosing a thylakoid space with many hydrogen ions; stroma outside with few hydrogen ions. An electron carrier in the membrane pumps hydrogen ions from the stroma into the thylakoid space; they flow back out into the stroma through ATP synthase, whose heads face the stroma. One intergranal lamella leaves to the right", s);
  }

  // ===================================== Light-dependent reaction: thylakoid membrane =====================================
  // o.on: Set of keys to show at full strength (others dimmed); null = everything at full strength.
  // o.scen: Electron Transfer Challenge scenario: "dim" | "block" | "leak" | "atps" | "split".
  // o.numbers: hide the text labels of the structures and draw numbered circles at o.marks [[x, y, n], ...].
  // Keys: light1, psii, split, o2, chain, pump, hpump, light2, psi, fd, nadp, hstroma, atps, hflow, hlumen, lumen, stromaL.
  const MY0 = 168, MY1 = 222; // membrane top (stroma side) and bottom (thylakoid-space side)
  const LDR_PATHS = { // paths along which particles move in the step model (stroma at the top)
    e1: "M112 178 C130 166 146 176 153 190", e2: "M179 194 L201 194", e3: "M247 196 C258 206 264 209 272 209",
    e4: "M296 206 C304 204 310 200 317 196", e5: "M392 160 C406 150 416 146 428 146", e6: "M450 138 C462 128 468 120 475 115",
    w1: "M86 252 L86 236", hp1: "M224 96 L224 240", hp2: "M126 268 C138 282 148 290 158 298", hs: "M522 92 C510 98 500 102 493 106",
    hf: "M600 300 L600 146",
  };
  function ldr(o = {}) {
    uid(); const on = o.on || null, sc = o.scen || null, num = !!o.numbers;
    const op = (k) => (on && !on.has(k) ? ' opacity="0.2"' : "");
    const G = (k, inner) => `<g data-k="${k}"${op(k)}>${inner}</g>`;
    let s = defs([["hp", HP], ["el", EL], ["lt", LIGHT], ["ox", OXY], ["ink", INK], ["np", NADPC], ["at", ATPC]]);
    // compartments
    s += `<rect x="0" y="0" width="660" height="${MY0}" fill="${STROMA}"/><rect x="0" y="${MY1}" width="660" height="${420 - MY1}" fill="${LUMEN}"/>`;
    // (the region names are left out of the numbered drawing used in the labelling question, so they cannot give away an answer)
    s += G("stromaL", num ? "" : T(12, 22, "STROMA", { s: 15, w: 800, a: "start", c: "#3d5a2a" }) + T(12, 41, "low H⁺", { s: 14, a: "start", c: "#3d5a2a" }) + T(12, 58, "concentration", { s: 14, a: "start", c: "#3d5a2a" }));
    s += G("lumen", num ? "" : T(12, 404, "THYLAKOID SPACE", { s: 15, w: 800, a: "start", c: "#6a3a74" }) + T(12, 385, "high H⁺ concentration", { s: 14, a: "start", c: "#6a3a74" }));
    // phospholipid bilayer (the leaky version has gaps where H+ escapes)
    let bil = `<rect x="0" y="${MY0}" width="660" height="${MY1 - MY0}" fill="${MEM}"/>`;
    for (let x = 4; x < 660; x += 9) { if (sc === "leak" && [[150, 160], [262, 274], [510, 530]].some(([a, b]) => x > a - 6 && x < b + 6)) continue; bil += `<circle cx="${x}" cy="${MY0 + 4}" r="4" fill="${HEAD}"/><circle cx="${x}" cy="${MY1 - 4}" r="4" fill="${HEAD}"/>`; }
    s += bil + (num ? "" : T(506, MY0 + 33, "thylakoid membrane", { s: 15, c: "#5e4f1c" }));
    // H+ in the two compartments (many in the thylakoid space; fewer in the stroma)
    const few = sc === "leak" || sc === "block" || sc === "split" || sc === "dim";
    const lumH = few ? [[300, 312], [420, 322], [520, 300], [360, 362]] : [[300, 312], [360, 292], [420, 322], [480, 298], [520, 342], [256, 318], [380, 352], [460, 372], [540, 300], [320, 370], [250, 360]];
    if (sc === "atps") lumH.push([280, 290], [400, 300], [500, 330], [440, 344], [340, 336]);
    s += G("hlumen", lumH.map(([x, y]) => hplus(x, y, { s: 14 })).join(""));
    s += G("hstroma", [[400, 70], [536, 150]].map(([x, y]) => hplus(x, y, { s: 14 })).join(""));
    // light reaches the two chlorophyll complexes only
    const dimL = sc === "dim"; const lw = dimL ? 1.6 : 3.2, lc = dimL ? "#e2c879" : LIGHT;
    s += G("light1", wave(134, 8, 98, 136, { w: lw, c: lc }) + T(144, 30, dimL ? "dim light" : "light", { s: 14, w: 700, c: "#8a6200", a: "start" }));
    s += G("light2", wave(300, 10, 340, 136, { w: lw, c: lc }) + T(292, 30, dimL ? "dim light" : "light", { s: 14, w: 700, c: "#8a6200", a: "end" }));
    // chlorophyll complexes (photosystems II and I are supporting names)
    const cc = (x, k, sub) => G(k, `<rect x="${x}" y="${MY0 - 26}" width="92" height="${MY1 - MY0 + 52}" rx="14" fill="${CHL}" stroke="${CHLD}" stroke-width="2"/>` + (num ? "" : T(x + 46, MY0 + 22, "chlorophyll", { s: 14, w: 700, c: WHITE }) + T(x + 46, MY0 + 40, sub, { s: 13, w: 600, c: "#e9f5ea" })));
    s += cc(40, "psii", "(PSII)") + cc(316, "psi", "(PSI)");
    // water-splitting site on the thylakoid-space side of photosystem II
    s += G("split", `<rect x="54" y="${MY1 + 28}" width="64" height="18" rx="8" fill="#9ecbe0" stroke="${OXY}" stroke-width="1.6"/>` + (num ? "" : T(130, 344, "2H₂O → 4H⁺ + 4e⁻ + O₂", { s: 15, w: 700, c: INK })) + P(LDR_PATHS.w1, { c: EL, w: 2.4, m: "el" }) + P(LDR_PATHS.hp2, { c: HP, w: 2.4, m: "hp" }) + hplus(170, 312, { s: 14 }) + (sc === "split" ? X(86, MY1 + 37, 15) : ""));
    s += G("o2", P("M70 268 C60 284 48 292 36 298", { c: OXY, w: 2.6, m: "ox" }) + (num ? "" : T(30, 320, "O₂", { s: 16, w: 800, c: OXY })));
    // electron carriers: the electron transfer chain
    s += G("chain", `<circle cx="166" cy="194" r="13" fill="#dce8f8" stroke="${EL}" stroke-width="2"/><circle cx="284" cy="208" r="12" fill="#dce8f8" stroke="${EL}" stroke-width="2"/>` + P(LDR_PATHS.e1, { c: EL, w: 2.6, m: "el", d: "6 4" }) + P(LDR_PATHS.e3, { c: EL, w: 2.6, m: "el", d: "6 4" }) + P(LDR_PATHS.e4, { c: EL, w: 2.6, m: "el", d: "6 4" }) + (num ? "" : T(226, 270, "electron transfer chain", { s: 14, w: 700, c: EL }) + L(154, 252, 298, 252, { c: EL, w: 1.4 }) + L(154, 252, 154, 244, { c: EL, w: 1.4 }) + L(298, 252, 298, 244, { c: EL, w: 1.4 })));
    s += G("pump", `<rect x="200" y="${MY0 - 14}" width="48" height="${MY1 - MY0 + 28}" rx="10" fill="#c7daf3" stroke="${EL}" stroke-width="2"/>` + P(LDR_PATHS.e2, { c: EL, w: 2.6, m: "el", d: "6 4" }) + (sc === "block" ? X(224, 194, 16) : ""));
    s += G("hpump", P(LDR_PATHS.hp1, { c: HP, w: 2.8, m: "hp" }) + hplus(224, 88, { s: 15 }) + (num ? "" : T(214, 112, "carrier", { s: 13, c: INK, a: "end" }) + T(214, 128, "pumps H⁺", { s: 13, c: INK, a: "end" })));
    // after photosystem I: carrier and NADP reduction on the stroma side
    s += G("fd", `<circle cx="440" cy="146" r="12" fill="#dce8f8" stroke="${EL}" stroke-width="2"/>` + P(LDR_PATHS.e5, { c: EL, w: 2.6, m: "el", d: "6 4" }));
    s += G("nadp", P(LDR_PATHS.e6, { c: EL, w: 2.6, m: "el", d: "6 4" }) + P(LDR_PATHS.hs, { c: HP, w: 2.2, m: "hp" }) + hplus(532, 88, { s: 14 }) + (num ? "" : T(478, 52, "NADP →", { s: 15, w: 700, c: NADPC }) + T(478, 70, "reduced NADP", { s: 15, w: 700, c: NADPC })) + `<circle cx="484" cy="110" r="9" fill="${NADPC}"/>`);
    // ATP synthase: channel across the membrane, head in the stroma
    const aX = 600; const atpBlocked = sc === "atps";
    s += G("atps", `<rect x="${aX - 14}" y="${MY0 - 8}" width="28" height="${MY1 - MY0 + 16}" rx="6" fill="#f0c9a3" stroke="${ATPC}" stroke-width="2"/><rect x="${aX - 6}" y="${MY0 - 30}" width="12" height="24" fill="${ATPC}"/><ellipse cx="${aX}" cy="${MY0 - 50}" rx="30" ry="22" fill="#f0c9a3" stroke="${ATPC}" stroke-width="2.4"/>` + (num ? "" : T(aX - 22, MY1 + 34, "ATP", { s: 15, w: 700, c: ATPC, a: "end" }) + T(aX - 22, MY1 + 51, "synthase", { s: 15, w: 700, c: ATPC, a: "end" }) + T(aX, 34, "ADP + Pᵢ", { s: 14, w: 700, c: ATPC }) + T(aX, 52, "→ ATP", { s: 14, w: 700, c: ATPC })) + (atpBlocked ? X(aX, MY0 + 26, 16) : ""));
    // the visible arrow ends in the pale channel (y 174), so its head is not hidden by the dark stalk; LDR_PATHS.hf is the motion path
    s += G("hflow", (atpBlocked ? "" : P("M600 300 L600 174", { c: HP, w: 3, m: "hp" })) + hplus(aX + 24, 318, { s: 14 }));
    // leaky membrane: H+ escapes back into the stroma without passing through ATP synthase
    if (sc === "leak") s += [155, 268, 520].map((x) => L(x, MY1 + 30, x, MY0 - 24, { c: HP, w: 2.4, m: "hp" })).join("") + T(300, 400, "membrane leaky to H⁺", { s: 15, w: 700, c: HP, a: "start" });
    // invisible motion paths for the animation
    s += Object.entries(LDR_PATHS).map(([k, d]) => `<path d="${d}" fill="none" stroke="none" data-mp="${k}"/>`).join("");
    if (num) { const nb = (x, y, n) => `<circle cx="${x}" cy="${y}" r="14" fill="${INK}" stroke="${WHITE}" stroke-width="2"/>` + T(x, y + 5.5, String(n), { s: 16, w: 800, c: WHITE }); s += (o.marks || []).map(([x, y, n]) => nb(x, y, n)).join(""); }
    return svg(660, 420, "Section of a thylakoid membrane with the stroma above and the thylakoid space below. Light reaches two chlorophyll complexes. Electrons pass from the first, along electron carriers, to the second and then to NADP in the stroma. One carrier pumps hydrogen ions from the stroma into the thylakoid space. Water is split on the thylakoid-space side, releasing hydrogen ions, electrons and oxygen. Hydrogen ions flow back into the stroma through ATP synthase, where ADP and phosphate form ATP", s, "ldr-svg");
  }
  ldr.PATHS = LDR_PATHS;

  // ===================================== Calvin cycle (carbon accounting) =====================================
  // st: a state from B.calvinModel.states(); o.hi: station to highlight ("fix" | "red" | "out" | "regen" | null).
  // a molecule as a chain of carbon atoms; o.p = phosphate groups: "end" (GP, TP) or "both" (RuBP, a bisphosphate)
  function chain(x, y, n, col, o = {}) { let s = ""; for (let i = 0; i < n; i++) s += (i ? L(x + (i - 1) * 13 + 5, y, x + i * 13 - 5, y, { c: col, w: 2 }) : "") + `<circle cx="${r1(x + i * 13)}" cy="${y}" r="5.4" fill="${col}"/>`;
    const ph = (px) => `<circle cx="${r1(px)}" cy="${y - 7}" r="4.4" fill="#e9e2c9" stroke="#8a7a3c" stroke-width="1.2"/>`;
    if (o.p === "end" || o.p === "both") s += ph(x + (n - 1) * 13 + 10); if (o.p === "both") s += ph(x - 10); return s; }
  function calvin(st, o = {}) {
    uid(); const hi = o.hi || null; const H = (k) => (hi === k ? SEL : "#9aa7b4"); const W = (k) => (hi === k ? 5 : 2.6);
    let s = defs([["ink", INK], ["hi", SEL], ["co", CO2C], ["at", ATPC], ["tp", TPC]]);
    s += `<rect x="0" y="0" width="640" height="470" rx="14" fill="${STROMA}"/>` + T(14, 26, "STROMA", { s: 15, w: 800, a: "start", c: "#3d5a2a" });
    // key
    s += `<circle cx="22" cy="52" r="5.4" fill="#555"/>` + T(34, 57, "carbon atom", { s: 13, a: "start" }) + `<circle cx="22" cy="76" r="4.4" fill="#e9e2c9" stroke="#8a7a3c" stroke-width="1.2"/>` + T(34, 81, "phosphate group", { s: 13, a: "start" });
    // pools
    const box = (x, y, w, h, title, col, k) => `<g data-pool="${k}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${WHITE}" stroke="${col}" stroke-width="2.2"/>${T(x + w / 2, y + 22, title, { s: 15, w: 800, c: col })}</g>`;
    s += box(24, 150, 160, 150, "RuBP (5C)", RUBC, "rubp") + box(430, 40, 190, 140, "GP (3C)", GPC, "gp") + box(430, 262, 190, 140, "TP (3C)", TPC, "tp");
    for (let i = 0; i < st.rubp; i++) s += chain(78, 194 + i * 32, 5, RUBC, { p: "both" });
    const grid = (x0, y0, n, col) => { let g = ""; for (let i = 0; i < n; i++) g += chain(x0 + (i % 2) * 86, y0 + Math.floor(i / 2) * 32, 3, col, { p: "end" }); return g; };
    s += grid(460, 84, st.gp, GPC) + grid(460, 306, st.tp, TPC);
    // CO2 entering and the fixation arrow (rubisco)
    s += P("M184 190 C230 110 330 92 428 104", { c: H("fix"), w: W("fix"), m: hi === "fix" ? "hi" : "ink" });
    s += T(300, 132, "rubisco", { s: 15, w: 700, c: hi === "fix" ? "#8a6200" : INK, i: true }) + T(300, 150, "carbon fixation", { s: 13, c: GREY });
    for (let i = 0; i < st.co2; i++) s += `<circle cx="${274 + i * 26}" cy="${44}" r="5.4" fill="${CO2C}"/>`;
    s += T(300, 22, `CO₂ (1C)${st.co2 ? ` × ${st.co2}` : ""}`, { s: 15, w: 700, c: CO2C }) + L(300, 56, 300, 92, { c: hi === "fix" ? SEL : CO2C, w: hi === "fix" ? 4 : 2.2, m: hi === "fix" ? "hi" : "co" });
    // reduction GP -> TP using ATP and reduced NADP
    s += P("M525 182 L525 258", { c: H("red"), w: W("red"), m: hi === "red" ? "hi" : "ink" });
    s += T(420, 206, "ATP → ADP + Pᵢ", { s: 14, w: 700, c: ATPC, a: "end" }) + T(420, 226, "reduced NADP", { s: 14, w: 700, c: NADPC, a: "end" }) + T(420, 244, "→ NADP", { s: 14, w: 700, c: NADPC, a: "end" });
    s += P("M424 214 C470 214 500 220 520 220", { c: hi === "red" ? SEL : "#b7a28a", w: 2, m: "at" }) + T(552, 224, "reduction", { s: 13, c: GREY, a: "start" });
    // regeneration TP -> RuBP using ATP
    s += P("M430 350 C330 400 170 380 112 304", { c: H("regen"), w: W("regen"), m: hi === "regen" ? "hi" : "ink" });
    s += T(262, 406, "regeneration of RuBP", { s: 13, c: GREY }) + T(262, 352, "ATP → ADP + Pᵢ", { s: 14, w: 700, c: ATPC });
    // TP leaving the cycle
    s += P("M525 402 L525 424", { c: hi === "out" ? SEL : TPC, w: hi === "out" ? 4 : 2.4, m: hi === "out" ? "hi" : "tp" });
    s += `<rect x="240" y="428" width="390" height="36" rx="10" fill="#fff4e8" stroke="${TPC}" stroke-width="${hi === "out" ? 3 : 1.6}"/>` + T(250, 451, "left the cycle:", { s: 14, w: 700, c: TPC, a: "start" });
    for (let i = 0; i < Math.min(st.out, 4); i++) s += chain(372 + i * 62, 449, 3, TPC, { p: "end" });
    if (st.out > 4) s += T(622, 452, `+${st.out - 4}`, { s: 13, c: GREY, a: "end" });
    s += T(120, 440, "useful organic", { s: 13, w: 700, c: TPC }) + T(120, 456, "substances", { s: 13, w: 700, c: TPC }) + P("M238 446 L196 446", { c: TPC, w: 2, m: "tp" });
    return svg(640, 470, `Calvin cycle in the stroma: ${st.rubp} RuBP, ${st.gp} GP, ${st.tp} TP and ${st.out} TP that have left the cycle; each molecule is drawn as a chain of carbon atoms with its phosphate groups`, s);
  }

  // ===================================== Photosynthesis Integration Explorer =====================================
  // o.trace: "energy" | "carbon" | "hydrogen" | "oxygen" | "recycle" | null; o.cond: "normal" | "dark" | "lowco2".
  function integration(o = {}) {
    uid(); const tr = o.trace || null, cond = o.cond || "normal";
    const lit = { energy: ["light", "ldr", "atp", "nadph", "red", "tp", "out"], carbon: ["co2", "fix", "gp", "red", "tp", "out", "regen", "rubp"], hydrogen: ["h2o", "ldr", "nadph", "red", "gp", "tp"], oxygen: ["h2o", "ldr", "o2"], recycle: ["adp", "nadp", "ldr", "red", "regen"] }[tr] || null;
    const dim = (k) => (lit && !lit.includes(k) ? ' opacity="0.2"' : "");
    // in the dark the light-dependent reaction stops at once; GP can no longer be reduced, so reduction, regeneration and
    // the output of TP stop, while fixation continues until the RuBP is used up. With little CO2, fixation slows.
    const off = (k) => (cond === "dark" && ["atp", "nadph", "adp", "nadp", "o2", "red", "regen", "out"].includes(k)) || (cond === "lowco2" && ["co2", "fix"].includes(k));
    const cyc = (k) => (off(k) ? { c: "#c3cad1", w: 2, d: "5 5", m: "gr" } : { c: "#6b7a88", w: 2.6, m: "ink" });
    const G = (k, inner) => `<g data-k="${k}"${dim(k)}>${inner}</g>`;
    let s = defs([["ink", INK], ["at", ATPC], ["np", NADPC], ["ox", OXY], ["lt", LIGHT], ["co", CO2C], ["tp", TPC], ["gr", "#9aa7b4"]]);
    s += `<rect x="0" y="0" width="660" height="430" rx="14" fill="${STROMA}"/>` + T(646, 24, "STROMA", { s: 15, w: 800, a: "end", c: "#3d5a2a" });
    // thylakoid block (light-dependent reaction)
    let gr = ""; [[70, 150], [130, 190], [190, 150]].forEach(([x, y]) => { for (let k = 0; k < 6; k++) gr += `<rect x="${x - 24}" y="${y - 33 + k * 11}" width="48" height="8" rx="4" fill="${cond === "dark" ? "#8fb596" : CHL}" stroke="${CHLD}" stroke-width="1"/>`; });
    s += G("ldr", `<rect x="16" y="86" width="232" height="186" rx="14" fill="#e6f1e0" stroke="#2f8a3e" stroke-width="2.2"/>${gr}` + T(132, 252, "thylakoid membranes", { s: 14, w: 700, c: "#1f6a2c" }) + T(132, 106, "light-dependent reaction", { s: 14, w: 700, c: "#1f6a2c" }));
    s += G("light", (cond === "dark" ? T(70, 40, "light off", { s: 15, w: 800, c: GREY }) + X(124, 46, 12) : wave(60, 14, 104, 92) + T(48, 40, "light", { s: 15, w: 800, c: "#8a6200", a: "end" })));
    s += G("h2o", T(30, 318, "H₂O", { s: 16, w: 800, c: OXY }) + P("M50 312 C70 300 82 290 92 274", { c: OXY, w: 2.4, m: "ox" }));
    s += G("o2", T(196, 330, "O₂", { s: 16, w: 800, c: off("o2") ? GREY : OXY }) + P("M168 274 C176 292 184 302 190 312", { c: off("o2") ? "#b9c3cc" : OXY, w: 2.4, m: "ox", d: off("o2") ? "4 5" : "" }));
    // carriers between the two stages
    const arrow = (k, y, txt, col, dir, mk) => { const x1 = dir > 0 ? 250 : 406, x2 = dir > 0 ? 406 : 250; const faded = off(k); return G(k, P(`M${x1} ${y} L${x2} ${y}`, { c: faded ? "#c3cad1" : col, w: 3, m: faded ? "gr" : mk, d: faded ? "5 5" : "" }) + T(326, y - 7, txt, { s: 14, w: 700, c: faded ? GREY : col })); };
    s += arrow("atp", 140, "ATP", ATPC, 1, "at") + arrow("nadph", 180, "reduced NADP", NADPC, 1, "np") + arrow("adp", 222, "ADP + Pᵢ", ATPC, -1, "at") + arrow("nadp", 262, "NADP", NADPC, -1, "np");
    // Calvin cycle (light-independent reaction)
    const node = (k, x, y, txt, col) => G(k, `<rect x="${x - 40}" y="${y - 17}" width="80" height="34" rx="17" fill="${WHITE}" stroke="${col}" stroke-width="2.4"/>` + T(x, y + 5.5, txt, { s: 15, w: 800, c: col }));
    s += `<circle cx="505" cy="200" r="98" fill="#fff8e2" stroke="#b78a00" stroke-width="2" stroke-dasharray="6 5"/>` + T(500, 186, "Calvin cycle", { s: 15, w: 700, c: "#7a5a00" }) + T(500, 205, "light-", { s: 13, c: "#7a5a00" }) + T(500, 221, "independent", { s: 13, c: "#7a5a00" }) + T(500, 237, "reaction", { s: 13, c: "#7a5a00" });
    s += G("fix", P("M590 150 C574 116 548 104 512 104", cyc("fix")) + T(608, 112, "rubisco", { s: 13, i: true, c: GREY, a: "middle" }));
    s += G("red", P("M434 132 C412 160 410 214 426 250", cyc("red")));
    s += G("regen", P("M512 290 C556 290 588 252 594 220", cyc("regen")) + T(610, 280, "ATP", { s: 13, w: 700, c: ATPC }));
    s += node("gp", 470, 112, "GP", GPC) + node("tp", 470, 280, "TP", TPC) + node("rubp", 590, 200, "RuBP", RUBC);
    s += G("co2", T(560, 50, "CO₂", { s: 16, w: 800, c: off("co2") ? GREY : CO2C }) + (off("co2") ? T(600, 50, "low", { s: 13, w: 700, c: GREY, a: "start" }) : "") + P("M560 60 C562 76 564 90 566 108", { c: off("co2") ? "#c3cad1" : CO2C, w: off("co2") ? 1.6 : 2.6, m: "co" }));
    s += G("out", P("M440 296 C410 330 390 360 380 386", off("out") ? { c: "#d9b99c", w: 2, d: "5 5", m: "tp" } : { c: TPC, w: 2.6, m: "tp" }) + T(380, 408, "TP → glucose, starch, lipids,", { s: 14, w: 700, c: TPC }) + T(380, 425, "amino acids and other substances", { s: 13, c: TPC }));
    return svg(660, 432, "The two stages of photosynthesis linked. Thylakoid membranes (light-dependent reaction) take in light and water and give out oxygen; they pass ATP and reduced NADP to the Calvin cycle in the stroma (light-independent reaction), which returns ADP, phosphate and NADP. In the Calvin cycle carbon dioxide combines with RuBP, catalysed by rubisco, to form GP; GP is reduced to TP; some TP regenerates RuBP and some leaves the cycle to make useful organic substances", s);
  }

  // sketch of GP and RuBP after a change (shape only, no values): cond "dark" | "lowco2"
  function sketch(cond) {
    uid(); const W = 600, H = 210, x0 = 70, x1 = 580, y0 = 170, y1 = 30, xc = 260;
    let s = defs([["ink", INK]]) + `<rect x="0" y="0" width="${W}" height="${H}" fill="${WHITE}"/>`;
    s += L(x0, y0, x1, y0, { w: 2, m: "ink" }) + L(x0, y0, x0, y1 - 8, { w: 2, m: "ink" });
    s += T((x0 + x1) / 2, 200, "time", { s: 14 }) + `<text x="22" y="${(y0 + y1) / 2}" font-size="14" text-anchor="middle" fill="${INK}" transform="rotate(-90 22 ${(y0 + y1) / 2})">relative concentration</text>`;
    s += L(xc, y1, xc, y0, { c: GREY, w: 1.4, d: "5 4" }) + T(xc, y1 - 8, cond === "dark" ? "light switched off" : "CO₂ concentration lowered", { s: 14, w: 700, c: GREY });
    const up = (yA, yB) => `M${x0} ${yA} L${xc} ${yA} C${xc + 40} ${yA} ${xc + 70} ${yB} ${xc + 140} ${yB} L${x1 - 70} ${yB}`;
    const dn = (yA, yB) => `M${x0} ${yA} L${xc} ${yA} C${xc + 40} ${yA} ${xc + 60} ${yB} ${xc + 140} ${yB} L${x1 - 70} ${yB}`;
    const gpUp = cond === "dark"; const gp = gpUp ? up(110, 56) : dn(110, 150), rb = gpUp ? dn(88, 154) : up(88, 46);
    s += P(gp, { c: GPC, w: 3.2 }) + P(rb, { c: RUBC, w: 3.2, d: "9 5" });
    s += T(x1 - 64, (gpUp ? 56 : 150) + 5, "GP", { s: 15, w: 800, c: GPC, a: "start" }) + T(x1 - 64, (gpUp ? 154 : 46) + 5, "RuBP", { s: 15, w: 800, c: RUBC, a: "start" });
    return svg(W, H, cond === "dark" ? "Sketch graph, shape only: after the light is switched off the concentration of GP rises and then levels off, while the concentration of RuBP falls" : "Sketch graph, shape only: after the carbon dioxide concentration is lowered the concentration of RuBP rises and then levels off, while the concentration of GP falls", s);
  }

  // ===================================== Electron micrograph with label overlays =====================================
  // Phase 5 Batch 1 photo pass (author P1), following the pattern of data/content/_cvd-art.js (pImg, pLead, pLab): the
  // micrograph is drawn as an <image> inside a fixed viewBox and every label is our own SVG overlay (white halo; leader with a
  // white casing ending in a dot ON the structure). Licence: IMAGE_ASSET_REGISTER.md.
  //  assets/img/chloroplast-tem-anemone.png  and3k and caper437, "Chloroplast in leaf of Anemone sp TEM 12000x", CC BY-SA 3.0
  //        (680 x 516). Not cropped (the source's 1 µm scale bar, bottom right, stays visible); drawn at scale 1 between a
  //        250-unit label column on the left and a 280-unit column on the right. Points checked on grey-level profiles at
  //        full size: cell wall, the thick dark band, at (300, 150) (dark from y 130 to 170 at x 300); chloroplast envelope
  //        where it meets the cytoplasm above the chloroplast, two dark lines about 5 px apart at x 225, y 263 and 267-272
  //        (point 225, 264); stroma, the even grey matrix between the envelope and the top granum (455, 130); granum, a dark
  //        stack of thylakoids (505, 244; dark from y 237 to 253). Not labelled: small black dots between the thylakoids,
  //        small round organelles outside the right-hand end, the pale areas outside the cell; no starch grain is visible.
  const TEMIMG = ["assets/img/chloroplast-tem-anemone.png", 680, 516];
  const PF = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", SUB = "#46566a";
  const esc1 = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const pLead = (pts) => { const d = "M" + pts.map((p) => p.map(r1).join(" ")).join(" L"); const [ex, ey] = pts[pts.length - 1].map(r1);
    return `<g pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${ex}" cy="${ey}" r="5" fill="${INK}" stroke="#fff" stroke-width="2"/></g>`; };
  const pLab = (x, y, lines, o = {}) => { const s = o.s || 26, s2 = Math.round(s * 0.88), lh = Math.round(s * 1.18);
    return `<g pointer-events="none">` + lines.map((t, i) => { const big = i < (o.b || 1); return `<text x="${x}" y="${y + i * lh}" text-anchor="${o.a || "start"}" font-size="${big ? s : s2}" font-weight="${big ? 800 : 500}" fill="${big ? INK : SUB}" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${t}</text>`; }).join("") + "</g>"; };
  // d-3.3.2.1-p1: figure x = 250 + source x, y = source y.
  function chloroplastTEM() {
    const LW = 250, W = LW + 680 + 280, H = 516, X = (sx) => LW + sx;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc1("Transmission electron micrograph of part of a leaf cell of Anemone. A long, lens-shaped chloroplast lies just inside the thick, dark cell wall. Inside it, many dark stacks of thylakoids (grana) run along its length, joined by thinner membranes, in a paler grey stroma. Small dark dots lie between the thylakoids (not labelled). A scale bar at the bottom right shows 1 micrometre. Labels: cell wall; chloroplast envelope, a double membrane; stroma; granum, a stack of thylakoids.")}" font-family="${PF}" style="max-width:100%;height:auto"><rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
    s += `<image href="${TEMIMG[0]}" x="${LW}" y="0" width="${TEMIMG[1]}" height="${TEMIMG[2]}"/>`;
    s += pLead([[LW - 12, 112], [X(300), 150]]) + pLab(LW - 22, 121, ["Cell wall"], { a: "end" });
    s += pLead([[LW - 12, 281], [X(225), 264]]) + pLab(LW - 22, 290, ["Chloroplast", "envelope", "a double", "membrane"], { b: 2, a: "end" });
    s += pLead([[X(680) + 12, 112], [X(455), 130]]) + pLab(X(680) + 24, 120, ["Stroma"]);
    s += pLead([[X(680) + 12, 262], [X(505), 244]]) + pLab(X(680) + 24, 270, ["Granum", "a stack of", "thylakoids"]);
    return s.replace(/\s*\n\s*/g, " ") + "</svg>";
  }

  B.photoArt = { chloroplastTEM, chloroplast, granum, ldr, calvin, integration, sketch, chain, COLORS: { HP, EL, ATPC, NADPC, OXY, LIGHT, RUBC, GPC, TPC } };

  // ===================================== Calvin cycle model (carbon accounting) =====================================
  // Basis: one ROUND = 3 CO2 fixed. Molecule counts per pool; carbon atoms: RuBP 5, GP 3, TP 3, CO2 1.
  const CARB = { rubp: 5, gp: 3, tp: 3, co2: 1, out: 3 };
  const STEPS = [
    { id: "start", hi: null, title: "Start of a round", text: "Three molecules of RuBP (5 carbon atoms each) are in the stroma. Three molecules of carbon dioxide are about to be fixed." },
    { id: "fix", hi: "fix", title: "1. Carbon fixation", text: "Rubisco catalyses the reaction of each CO₂ with one RuBP, forming two molecules of GP (3 carbon atoms each): 3 CO₂ + 3 RuBP → 6 GP. <span class=\"badge\">supporting</span> The 6-carbon compound formed first is unstable and splits at once." },
    { id: "red", hi: "red", title: "2. Reduction of GP to TP", text: "ATP and reduced NADP from the light-dependent reaction are used to reduce each GP to triose phosphate (TP): 6 GP → 6 TP, using 6 ATP and 6 reduced NADP. ADP, phosphate and NADP go back to the thylakoids to be used again." },
    { id: "out", hi: "out", title: "3. Some TP leaves the cycle", text: "One of the six TP molecules leaves the cycle. It is converted into useful organic substances such as glucose, starch, lipids and amino acids." },
    { id: "regen", hi: "regen", title: "4. Regeneration of RuBP", text: "The other five TP molecules (15 carbon atoms) are rearranged to regenerate three RuBP (15 carbon atoms), using more ATP (3 in this round). The cycle can now fix more CO₂." },
  ];
  function states(rounds = 1) {
    const out = []; let st = { rubp: 3, co2: 3, gp: 0, tp: 0, out: 0, atp: 0, nadph: 0, fixed: 0 };
    for (let r = 0; r < rounds; r++) {
      if (r === 0) out.push({ ...st, step: "start", round: 1 }); else { st = { ...st, co2: 3 }; out.push({ ...st, step: "start", round: r + 1 }); }
      st = { ...st, rubp: st.rubp - 3, co2: 0, gp: st.gp + 6, fixed: st.fixed + 3 }; out.push({ ...st, step: "fix", round: r + 1 });
      st = { ...st, gp: st.gp - 6, tp: st.tp + 6, atp: st.atp + 6, nadph: st.nadph + 6 }; out.push({ ...st, step: "red", round: r + 1 });
      st = { ...st, tp: st.tp - 1, out: st.out + 1 }; out.push({ ...st, step: "out", round: r + 1 });
      st = { ...st, tp: st.tp - 5, rubp: st.rubp + 3, atp: st.atp + 3 }; out.push({ ...st, step: "regen", round: r + 1 });
    }
    return out;
  }
  const carbon = (st) => ({ rubp: st.rubp * CARB.rubp, co2: st.co2 * CARB.co2, gp: st.gp * CARB.gp, tp: st.tp * CARB.tp, out: st.out * CARB.out });
  const total = (st) => Object.values(carbon(st)).reduce((a, b) => a + b, 0);
  // carbon is conserved: carbon in all pools = 15 (the three starting RuBP) + carbon from every CO2 brought in so far
  function validate() {
    const errs = []; for (const R of [1, 2, 3]) { const ss = states(R); ss.forEach((st) => { const broughtIn = st.round * 3; const expect = 15 + broughtIn; if (total(st) !== expect) errs.push(`round ${st.round} ${st.step}: carbon ${total(st)} != ${expect}`); if (Object.values(st).some((v) => typeof v === "number" && v < 0)) errs.push("negative pool"); });
      const end = ss[ss.length - 1]; if (end.rubp !== 3 || end.gp !== 0 || end.tp !== 0) errs.push("RuBP not regenerated at end of round " + R); if (end.out !== R || end.atp !== 9 * R || end.nadph !== 6 * R || end.fixed !== 3 * R) errs.push("per-round totals wrong at " + R); }
    return errs;
  }
  B.calvinModel = { CARB, STEPS, states, carbon, total, validate, PER_ROUND: { co2: 3, atp: 9, nadph: 6, tpOut: 1 } };

  // ===================================== Electron Transfer Challenge outcomes =====================================
  // Qualitative only. Framing: thylakoids isolated from chloroplasts, lit, in a buffer with plenty of ADP, phosphate and
  // NADP (so the light-independent reaction plays no part). "accept" lists every defensible answer; "best" is the main
  // answer explained. Sources in the 3.3.2.1 content file (Kanazawa et al. 2017 for ATP synthase and the gradient).
  const Q = ["flow", "gradient", "atp", "nadph", "o2"];
  const QN = { flow: "Electron flow", gradient: "Proton gradient", atp: "ATP made", nadph: "Reduced NADP made", o2: "Oxygen released" };
  const SCEN = {
    dim: { name: "Less light", setup: "The light intensity is reduced (some light is still absorbed).",
      ans: { flow: ["down"], gradient: ["down"], atp: ["down"], nadph: ["down"], o2: ["down"] },
      why: { flow: "Fewer electrons in chlorophyll are excited per second, so fewer pass along the chain.", gradient: "Less energy from electrons is available to pump protons, and less photolysis releases fewer protons into the thylakoid space.", atp: "A smaller proton gradient means fewer protons flow back through ATP synthase, so less ATP is made.", nadph: "Fewer electrons reach the end of the chain to reduce NADP.", o2: "Fewer electrons leave chlorophyll, so less water is split to replace them and less oxygen is released." } },
    block: { name: "Electron transfer blocked", setup: "An inhibitor binds to one electron carrier, so electrons cannot pass along the chain.",
      ans: { flow: ["down"], gradient: ["down"], atp: ["down"], nadph: ["down"], o2: ["down"] },
      why: { flow: "Electrons cannot pass the blocked carrier, so the flow stops.", gradient: "No energy is released from electrons to pump protons, so the gradient is no longer built up; protons that flow out through ATP synthase are not replaced.", atp: "Once the existing gradient has been used, protons stop flowing through ATP synthase, so ATP production stops.", nadph: "No electrons reach NADP, so no reduced NADP is made.", o2: "Chlorophyll can no longer pass on its electrons, so it does not need replacement electrons from water: photolysis and oxygen release stop." } },
    leak: { name: "Proton gradient reduced", setup: "A chemical makes the thylakoid membrane leaky to protons, so they can cross it without passing through ATP synthase.",
      ans: { flow: ["same", "up"], gradient: ["down"], atp: ["down"], nadph: ["same", "up"], o2: ["same", "up"] },
      why: { flow: "Light still excites electrons and they still pass along the chain. (Stretch: it may even speed up, because pumping protons against a small gradient is easier.)", gradient: "Protons leak back into the stroma as fast as they are pumped in, so the gradient becomes small.", atp: "Few protons pass through ATP synthase, so little ATP is made, even though electrons are still flowing.", nadph: "Electrons still reach NADP, so reduced NADP is still made: NADP reduction does not depend on the gradient.", o2: "Electrons still leave chlorophyll, so water is still split and oxygen is still released." } },
    atps: { name: "ATP synthase inhibited", setup: "An inhibitor blocks the channel of ATP synthase, so protons cannot flow through it.",
      ans: { flow: ["same", "down"], gradient: ["up"], atp: ["down"], nadph: ["same", "down"], o2: ["same", "down"] },
      why: { flow: "At first electrons keep flowing. (Stretch: as the gradient becomes very steep, pumping more protons against it becomes harder, so electron flow slows.)", gradient: "Protons are still pumped in and released by photolysis, but cannot flow out, so they build up in the thylakoid space: the gradient becomes steeper.", atp: "No protons pass through ATP synthase, so no ATP is made. Light never acts on ATP synthase: ATP is made only by the flow of protons.", nadph: "While electrons flow, NADP is still reduced. (Stretch: this slows if electron flow slows.)", o2: "While electrons leave chlorophyll, water is still split. (Stretch: this slows if electron flow slows.)" } },
    split: { name: "Photolysis stopped", setup: "The water-splitting enzyme complex is damaged, so water cannot be split.",
      ans: { flow: ["down"], gradient: ["down"], atp: ["down"], nadph: ["down"], o2: ["down"] },
      why: { flow: "Electrons lost from chlorophyll are not replaced from water, so chlorophyll soon has no electrons to pass on and the flow stops.", gradient: "No protons are released by photolysis and, with no electron flow, none are pumped, so the gradient falls.", atp: "With no proton gradient, no protons flow through ATP synthase, so ATP production stops.", nadph: "No electrons reach NADP, so no reduced NADP is made.", o2: "Oxygen comes from the splitting of water, so no oxygen is released." } },
  };
  B.ldrModel = { Q, QN, SCEN, CHOICES: [["up", "rises"], ["same", "stays the same"], ["down", "falls or stops"]] };
})(window.BIO);
