// Authored content for 3.1.1.3 Lipids. Spec statements s1–s6 (see data/spec.js).
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  // ---- tiny displayed-formula helpers ----
  const INK = "#16263a", TEAL = "#166f70", AMB = "#c8902a", AMBD = "#8a5f12", GREY = "#6b7d8f", NAVY = "#1e3a5f";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 13}" font-weight="${o.w || 700}" fill="${o.c || INK}">${s}</text>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 2}"/>`;
  const dbl = (x1, y1, x2, y2) => { const dx = (y2 - y1) ? 3 : 0, dy = (x2 - x1) ? 3 : 0; return L(x1 - dx, y1 - dy, x2 - dx, y2 - dy) + L(x1 + dx, y1 + dy, x2 + dx, y2 + dy); };
  // zigzag of n segments starting at (x,y); returns path and the end point
  const zigPath = (x, y, n) => { let d = `M${x} ${y}`; let cx = x, cy = y; for (let i = 0; i < n; i++) { cx += 16; cy += i % 2 ? 9 : -9; d += ` L${cx} ${cy}`; } return { d, ex: cx, ey: cy }; };
  const zig = (x, y, n) => { const z = zigPath(x, y, n); return `<path d="${z.d}" fill="none" stroke="${INK}" stroke-width="2"/>`; };
  const zigEnd = (x, y, n) => zigPath(x, y, n);
  const cap = (x, y, s, a = "middle") => T(x, y, s, { s: 11, w: 500, c: GREY, a });
  const ROW = 58; // vertical spacing between glycerol carbons
  const Catom = (x, y) => `<circle cx="${x}" cy="${y - 4}" r="9" fill="#fff"/>` + T(x, y, "C");

  // Glycerol: vertical 3-carbon chain; OH on the right of each carbon
  const glycerolAt = (x, y) => {
    let s = L(x, y - 36, x, y + 2 * ROW + 8);
    [0, 1, 2].forEach((i) => { const cy = y + i * ROW; s += Catom(x, cy) + L(x - 10, cy - 4, x - 28, cy - 4) + T(x - 36, cy, "H") + L(x + 10, cy - 4, x + 28, cy - 4) + T(x + 44, cy, "OH", { c: TEAL }); });
    return s + T(x, y - 42, "H") + T(x, y + 2 * ROW + 28, "H");
  };
  // Fatty acid drawn to the right from (x,y): [HO–]C(=O)–zigzag–CH3
  const fattyAcidAt = (x, y, n = 8, o = {}) => {
    let s = "";
    if (o.showOH !== false) s += T(x, y + 4, "HO", { c: TEAL }) + L(x + 16, y, x + 30, y, { c: TEAL });
    const cx = x + 40; s += T(cx, y + 4, "C") + dbl(cx, y - 8, cx, y - 26) + T(cx, y - 30, "O") + L(cx + 10, y, cx + 26, y);
    const z = zigEnd(cx + 26, y, n); s += `<path d="${z.d}" fill="none" stroke="${INK}" stroke-width="2"/>` + T(z.ex + 20, z.ey + 4, "CH₃");
    return s;
  };
  // An ester-linked chain from a glycerol carbon at (x,y): –O–C(=O)–zigzag–CH3, returns svg; box marks the ester bond
  const esterChain = (x, y, n = 5, box = true) => {
    const cy = y - 4; let s = L(x + 10, cy, x + 24, cy) + T(x + 34, y, "O") + L(x + 44, cy, x + 58, cy) + T(x + 68, y, "C") + dbl(x + 68, cy - 8, x + 68, cy - 26) + T(x + 68, cy - 30, "O") + L(x + 78, cy, x + 94, cy);
    const z = zigEnd(x + 94, cy, n); s += `<path d="${z.d}" fill="none" stroke="${INK}" stroke-width="2"/>` + T(z.ex + 20, z.ey + 4, "CH₃");
    if (box) s += `<rect x="${x + 22}" y="${cy - 22}" width="58" height="34" rx="6" fill="none" stroke="${AMB}" stroke-width="2"/>`;
    return s;
  };

  const dGlycerol = `<svg viewBox="0 0 520 240" width="520" role="img" aria-label="displayed formula of glycerol">
    ${glycerolAt(120, 70)}
    ${T(340, 70, "Glycerol (propane-1,2,3-triol)", { s: 14 })}${cap(340, 92, "C₃H₈O₃: a three-carbon alcohol")}
    ${cap(340, 122, "Each carbon carries a hydroxyl (–OH) group.")}${cap(340, 140, "Each –OH can react with the –COOH of a fatty acid,")}${cap(340, 158, "so one glycerol can bond to three fatty acids.")}
  </svg>`;

  const dFattyAcid = `<svg viewBox="0 0 760 250" width="760" role="img" aria-label="general structure of a fatty acid">
    ${T(40, 20, "General formula", { s: 14, a: "start" })}
    <rect x="40" y="52" width="60" height="40" rx="8" fill="#e2efe6" stroke="#6b9a7f" stroke-width="2"/>${T(70, 77, "R")}
    ${L(100, 72, 128, 72)}${T(138, 77, "C")}${dbl(138, 62, 138, 44)}${T(138, 40, "O")}${L(148, 72, 170, 72)}${T(190, 77, "OH")}
    <rect x="120" y="30" width="96" height="62" rx="8" fill="none" stroke="${AMB}" stroke-width="2" stroke-dasharray="5 3"/>
    ${cap(70, 112, "hydrocarbon chain")}${T(168, 130, "carboxyl group (–COOH)", { s: 11, w: 600, c: AMBD })}
    ${T(300, 77, "written RCOOH", { s: 13, w: 600, c: GREY, a: "start" })}
    ${T(40, 172, "Displayed example: stearic acid, a saturated fatty acid, C₁₇H₃₅COOH", { s: 13, a: "start" })}
    ${fattyAcidAt(40, 215, 16)}
    ${cap(40, 244, "Zigzag: each vertex is a carbon (CH₂, or CH₃ at the end); hydrogens omitted. Chains are usually 14 to 22 carbons long.", "start")}
  </svg>`;

  const dSatUnsat = (() => {
    let s = T(30, 28, "Saturated fatty acid", { s: 14, a: "start" }) + fattyAcidAt(30, 80, 14);
    s += cap(30, 112, "Only single C–C bonds; every carbon carries the maximum number of hydrogen atoms.", "start") + cap(30, 130, "Straight chains pack closely together → higher melting point: fats, usually solid at room temperature.", "start");
    s += T(30, 172, "Unsaturated fatty acid", { s: 14, a: "start" });
    // chain: 6 zig segments, then a cis C=C, then the rest of the chain bent upwards
    s += T(30, 224, "HO", { c: TEAL }) + L(46, 220, 60, 220, { c: TEAL }) + T(70, 224, "C") + dbl(70, 212, 70, 194) + T(70, 190, "O") + L(80, 220, 96, 220);
    const z = zigEnd(96, 220, 6); s += `<path d="${z.d}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    // double bond segment (horizontal) then chain continues bent up by 40 degrees
    const dx = z.ex, dy = z.ey; s += dbl(dx, dy, dx + 22, dy) + `<circle cx="${dx + 11}" cy="${dy}" r="15" fill="none" stroke="${AMB}" stroke-width="2"/>`;
    const z2 = zigEnd(0, 0, 6); s += `<g transform="translate(${dx + 22},${dy}) rotate(-40)"><path d="${z2.d}" fill="none" stroke="${INK}" stroke-width="2"/></g>`;
    const ex = dx + 22 + Math.cos(-40 * Math.PI / 180) * z2.ex - Math.sin(-40 * Math.PI / 180) * z2.ey, ey = dy + Math.sin(-40 * Math.PI / 180) * z2.ex + Math.cos(-40 * Math.PI / 180) * z2.ey;
    s += T(ex + 22, ey + 4, "CH₃") + T(dx + 11, dy + 34, "C=C double bond", { s: 11, w: 600, c: AMBD });
    s += cap(410, 200, "One or more C=C double bonds, so fewer hydrogen atoms.", "start") + cap(410, 218, "A cis C=C kinks the chain, so chains cannot pack closely", "start") + cap(410, 236, "→ lower melting point: oils, usually liquid at room temperature.", "start") + cap(410, 254, "Monounsaturated = one C=C; polyunsaturated = two or more.", "start");
    return `<svg viewBox="0 0 760 270" width="760" role="img" aria-label="saturated and unsaturated fatty acid chains">${s}</svg>`;
  })();

  const dTriglyceride = (() => {
    const gy = 76; let s = "";
    s += cap(70, 22, "glycerol") + cap(240, 22, "3 fatty acids") + cap(600, 22, "triglyceride");
    s += glycerolAt(70, gy);
    [0, 1, 2].forEach((i) => { s += fattyAcidAt(150, gy + i * ROW - 4, 4); });
    s += `<path d="M330 ${gy + ROW} l44 0" stroke="${INK}" stroke-width="2.5" marker-end="url(#arr)"/>` + T(352, gy + ROW - 12, "condensation", { s: 11, w: 600 });
    const px = 440; s += L(px, gy - 36, px, gy + 2 * ROW + 8) + T(px, gy - 42, "H") + T(px, gy + 2 * ROW + 28, "H");
    [0, 1, 2].forEach((i) => { const cy = gy + i * ROW; s += Catom(px, cy) + L(px - 10, cy - 4, px - 28, cy - 4) + T(px - 36, cy, "H") + esterChain(px, cy, 4); });
    s += T(px + 52, gy + 2 * ROW + 40, "ester bonds (×3)", { s: 11, w: 600, c: AMBD });
    [0, 1, 2].forEach((i) => { const cy = gy + i * ROW; s += `<circle cx="712" cy="${cy - 4}" r="15" fill="#e4ebf5" stroke="${NAVY}" stroke-width="2"/>` + T(712, cy, "H₂O", { s: 11, c: NAVY }); });
    s += T(712, gy + 2 * ROW + 28, "+ 3 H₂O", { s: 11, w: 600, c: NAVY });
    s += cap(20, 254, "Each ester bond: the O of a glycerol –OH joins the C of a –COOH; the H (from glycerol) and the OH (from the acid)", "start") + cap(20, 268, "leave as water. Fatty acid chains are shortened.", "start");
    return `<svg viewBox="0 0 760 275" width="760" role="img" aria-label="formation of a triglyceride from glycerol and three fatty acids"><defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${INK}"/></marker></defs>${s}</svg>`;
  })();

  const dPhospholipid = (() => {
    const px = 150, gy = 76; let s = "";
    s += L(px, gy - 36, px, gy + 2 * ROW + 8) + T(px, gy - 42, "H") + T(px, gy + 2 * ROW + 28, "H");
    [0, 1].forEach((i) => { const cy = gy + i * ROW; s += Catom(px, cy) + L(px - 10, cy - 4, px - 28, cy - 4) + T(px - 36, cy, "H") + esterChain(px, cy, 8, true); });
    const cy = gy + 2 * ROW; s += Catom(px, cy) + L(px - 10, cy - 4, px - 28, cy - 4) + T(px - 36, cy, "H") + L(px + 10, cy - 4, px + 24, cy - 4) + T(px + 34, cy, "O") + L(px + 44, cy - 4, px + 58, cy - 4);
    const Px = px + 74; s += `<circle cx="${Px}" cy="${cy - 4}" r="12" fill="#d6efec" stroke="#1f8a8a" stroke-width="2"/>` + T(Px, cy, "P") + dbl(Px, cy - 16, Px, cy - 30) + T(Px, cy - 34, "O") + L(Px, cy + 8, Px, cy + 20) + T(Px, cy + 34, "O⁻") + L(Px + 12, cy - 4, Px + 28, cy - 4) + T(Px + 38, cy, "O") + L(Px + 48, cy - 4, Px + 62, cy - 4) + `<rect x="${Px + 68}" y="${cy - 20}" width="150" height="32" rx="8" fill="#e2efe6" stroke="#6b9a7f" stroke-width="2"/>` + T(Px + 143, cy, "polar group, e.g. choline", { s: 11, w: 600 });
    s += `<rect x="${px + 22}" y="${cy - 22}" width="42" height="34" rx="6" fill="none" stroke="${AMB}" stroke-width="2"/>`;
    // brackets and labels
    // head bracket under the third glycerol carbon, phosphate and polar group
    s += `<path d="M${px - 10} ${cy + 42} l0 6 l${Px + 228 - px} 0 l0 -6" fill="none" stroke="#1f8a8a" stroke-width="2"/>` + T((Px + 218 + px) / 2, cy + 62, "hydrophilic head (charged phosphate and polar group)", { s: 11, w: 600, c: TEAL });
    s += `<path d="M${px + 100} 24 l0 -8 l210 0 l0 8" fill="none" stroke="${AMB}" stroke-width="2"/>` + T(px + 205, 10, "hydrophobic fatty acid tails (non-polar)", { s: 11, w: 600, c: AMBD });
    s += cap(20, 270, "Orange boxes: ester bonds to the two fatty acids, and the ester link to the phosphate (which replaces the third fatty acid).", "start");
    // icon
    s += `<g transform="translate(590,40)"><circle cx="60" cy="30" r="24" fill="#1f8a8a"/>${T(60, 35, "head", { s: 11, c: "#fff" })}<path d="M48 54 q-10 30 0 60 q-10 30 0 60" fill="none" stroke="${AMB}" stroke-width="5"/><path d="M72 54 q10 30 0 60 q10 30 0 60" fill="none" stroke="${AMB}" stroke-width="5"/>${cap(60, 196, "simplified icon used")}${cap(60, 210, "in membrane diagrams")}</g>`;
    return `<svg viewBox="0 0 760 280" width="760" role="img" aria-label="structure of a phospholipid">${s}</svg>`;
  })();

  const dBilayer = (() => {
    let s = `<rect x="0" y="0" width="760" height="260" fill="#e4ebf5"/>`;
    const lip = (x, y, flip) => `<g transform="translate(${x},${y}) ${flip ? "rotate(180)" : ""}"><circle cx="0" cy="0" r="11" fill="#1f8a8a"/><path d="M-5 10 q-4 14 0 28 q-4 14 0 28" fill="none" stroke="${AMB}" stroke-width="3"/><path d="M5 10 q4 14 0 28 q4 14 0 28" fill="none" stroke="${AMB}" stroke-width="3"/></g>`;
    for (let i = 0; i < 11; i++) { s += lip(210 + i * 40, 66, false) + lip(210 + i * 40, 194, true); }
    s += T(16, 24, "extracellular water", { s: 12, w: 600, c: NAVY, a: "start" }) + T(16, 250, "cytoplasm (water)", { s: 12, w: 600, c: NAVY, a: "start" });
    s += `<path d="M660 54 l20 0 M660 206 l20 0 M670 54 l0 152" stroke="${INK}" stroke-width="1.5" fill="none"/>` + T(682, 134, "≈ 7 nm", { s: 11, w: 600, a: "start" });
    s += T(170, 70, "hydrophilic heads", { s: 11, w: 600, c: TEAL, a: "end" }) + T(170, 134, "hydrophobic tails", { s: 11, w: 600, c: AMBD, a: "end" }) + T(170, 198, "hydrophilic heads", { s: 11, w: 600, c: TEAL, a: "end" });
    return `<svg viewBox="0 0 760 260" width="760" role="img" aria-label="phospholipid bilayer">${s}</svg>`;
  })();

  const dEmulsion = (() => {
    const tube = (x, y, fill, label, extra = "") => `<path d="M${x} ${y} l0 120 a25 25 0 0 0 50 0 l0 -120" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M${x + 2} ${y + 50} l0 70 a23 23 0 0 0 46 0 l0 -70z" fill="${fill}"/>${extra}${T(x + 25, y + 170, label, { s: 11, w: 600 })}`;
    let s = "";
    s += T(100, 24, "1. Sample + ethanol", { s: 13 }) + tube(75, 40, "#f3f6f5", "shake to dissolve") + cap(100, 228, "lipid dissolves in ethanol") + cap(100, 244, "(lipids are insoluble in water)");
    s += `<path d="M190 110 l40 0" stroke="${INK}" stroke-width="2.5" marker-end="url(#arr2)"/>` + cap(210, 100, "pour into");
    s += T(300, 24, "2. Add to water", { s: 13 }) + tube(275, 40, "#e4ebf5", "water");
    s += `<path d="M390 110 l40 0" stroke="${INK}" stroke-width="2.5" marker-end="url(#arr2)"/>`;
    s += T(500, 24, "Positive", { s: 13, c: "#166f70" }) + tube(475, 40, "#f1f1ec", "cloudy white emulsion", Array.from({ length: 40 }, (_, i) => `<circle cx="${480 + ((i * 37) % 44)}" cy="${95 + ((i * 53) % 60)}" r="2.5" fill="#fff" stroke="#b9c9c4"/>`).join("")) + cap(500, 228, "tiny lipid droplets dispersed") + cap(500, 244, "in water scatter light");
    s += T(650, 24, "Negative", { s: 13, c: "#c25f5f" }) + tube(625, 40, "#e4ebf5", "stays clear") + cap(650, 228, "no lipid present");
    return `<svg viewBox="0 0 760 260" width="760" role="img" aria-label="the emulsion test for lipids"><defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${INK}"/></marker></defs>${s}</svg>`;
  })();

  // Identification SVG for the labelling question: four numbered structures
  const dIdentify = (() => {
    const num = (x, y, n) => `<circle cx="${x}" cy="${y}" r="12" fill="${NAVY}"/>` + T(x, y + 5, String(n), { s: 14, c: "#fff" });
    let s = num(30, 30, 1) + fattyAcidAt(60, 70, 9);
    s += num(400, 30, 2) + glycerolAt(470, 62);
    // backbone of three carbons at x with H on the left of each carbon and H at the top and bottom (complete valences)
    const Y0 = 266;
    const backbone = (x) => { let b = L(x, Y0 - 36, x, Y0 + 2 * ROW + 8) + T(x, Y0 - 42, "H") + T(x, Y0 + 2 * ROW + 28, "H"); [0, 1, 2].forEach((i) => { const cy = Y0 + i * ROW; b += Catom(x, cy) + L(x - 10, cy - 4, x - 28, cy - 4) + T(x - 36, cy, "H"); }); return b; };
    s += num(24, 236, 3) + backbone(80);
    [0, 1, 2].forEach((i) => { s += esterChain(80, Y0 + i * ROW, 6, false); });
    s += num(394, 236, 4) + backbone(450);
    [0, 1].forEach((i) => { s += esterChain(450, Y0 + i * ROW, 6, false); });
    const cy = Y0 + 2 * ROW; s += L(460, cy - 4, 474, cy - 4) + T(484, cy, "O") + L(494, cy - 4, 518, cy - 4) + `<circle cx="530" cy="${cy - 4}" r="11" fill="#d6efec" stroke="#1f8a8a" stroke-width="2"/>` + T(530, cy, "P") + dbl(530, cy - 16, 530, cy - 30) + T(530, cy - 34, "O") + L(530, cy + 8, 530, cy + 20) + T(530, cy + 34, "O⁻") + L(541, cy - 4, 555, cy - 4) + T(565, cy, "O") + L(575, cy - 4, 588, cy - 4) + `<rect x="592" y="${cy - 18}" width="70" height="26" rx="6" fill="#e2efe6" stroke="#6b9a7f"/>` + T(627, cy, "choline", { s: 10, w: 600 });
    return `<svg viewBox="0 0 760 430" width="760" role="img" aria-label="four numbered molecular structures to identify">${s}</svg>`;
  })();

  window.BIO.content["3.1.1.3"] = {
    status: "reviewed",
    keywords: ["lipid", "triglyceride", "fatty acid", "glycerol", "ester bond", "saturated", "unsaturated", "phospholipid", "phosphate", "hydrophilic", "hydrophobic", "emulsion test", "ethanol", "RCOOH", "bilayer", "fat", "oil", "insoluble"],
    notes: `
<h2 data-stmt="3.1.1.3.s4">What lipids are</h2>
<p>Lipids are a varied group of molecules containing carbon, hydrogen and oxygen, with a much lower proportion of oxygen than carbohydrates. They are mostly <strong>non-polar</strong> (triglycerides entirely so; phospholipids have one polar end, see below), so they are insoluble in water but dissolve in organic solvents such as ethanol. Unlike carbohydrates and proteins, lipids are <strong>not polymers</strong>: a triglyceride is built from a small, fixed number of units (one glycerol and three fatty acids), not from a repeating monomer. The specification requires two types: <strong>triglycerides</strong> and <strong>phospholipids</strong>.</p>

<h2 data-stmt="3.1.1.3.s1 3.1.1.3.s2">The building blocks</h2>
<h3 data-stmt="3.1.1.3.s1">Glycerol</h3>
<p>Glycerol is a small three-carbon alcohol. Each carbon carries a hydroxyl (–OH) group, and it is these three –OH groups that react with fatty acids.</p>
<h3 data-stmt="3.1.1.3.s2">Fatty acids</h3>
<p>A fatty acid has a <strong>carboxyl group (–COOH)</strong> at one end attached to a long <strong>hydrocarbon chain</strong> (usually 14 to 22 carbons). Because only the carboxyl group takes part in the reaction, the chain is written as R and the whole molecule as <strong>RCOOH</strong>. The R group may be:</p>
<ul><li><strong>Saturated:</strong> only single C–C bonds, so every carbon carries as many hydrogen atoms as it can. The chain is straight.</li>
<li><strong>Unsaturated:</strong> one (monounsaturated) or more (polyunsaturated) C=C double bonds, so fewer hydrogens. Each double bond in the usual <em>cis</em> arrangement bends the chain.</li></ul>

<h2 data-stmt="3.1.1.3.s1 3.1.1.3.s4">Triglycerides</h2>
<p>A triglyceride forms when one glycerol molecule reacts with three fatty acids by <strong>condensation</strong>. Each reaction joins the O of a glycerol –OH to the C of a fatty acid –COOH, forming an <strong>ester bond</strong> (–C–O–C(=O)–) and releasing one molecule of water. Three ester bonds form, so <strong>three molecules of water</strong> are released. <strong>Hydrolysis</strong> (by lipase, 3.2.2.2) uses three molecules of water to break the three ester bonds and release glycerol and three fatty acids.</p>
<p>The three fatty acids in one triglyceride can be the same or different, and saturated or unsaturated. Triglycerides rich in saturated fatty acids are usually solid at room temperature (fats, typical of animals); those rich in unsaturated fatty acids are usually liquid (oils, typical of plants), because kinked chains cannot pack closely together.</p>
<h3 data-stmt="3.1.1.3.s4">Structure related to function: energy storage</h3>
<table><tr><th>Property</th><th>Why (structure)</th><th>Consequence (function)</th></tr>
<tr><td>High energy content</td><td>Long hydrocarbon tails are rich in C–H bonds and contain little oxygen</td><td>Release about twice as much energy per gram as carbohydrate when respired; an efficient, compact energy store (3.3.3.4)</td></tr>
<tr><td>Insoluble in water</td><td>Non-polar hydrocarbon tails; no charged groups once the ester bonds have formed</td><td>Do not affect the water potential of the cell, so large amounts can be stored without drawing in water by osmosis</td></tr>
<tr><td>Release water when respired</td><td>High ratio of hydrogen to oxygen</td><td>Metabolic water: useful to desert animals and to developing embryos in eggs</td></tr>
<tr><td>Low density; poor conductor of heat</td><td>Bulk fat tissue</td><td>Buoyancy in aquatic mammals; insulation under the skin</td></tr></table>

<h2 data-stmt="3.1.1.3.s3 3.1.1.3.s4">Phospholipids</h2>
<p>A phospholipid is like a triglyceride in which <strong>one fatty acid is replaced by a phosphate-containing group</strong>. The molecule therefore has two very different ends:</p>
<ul><li>The <strong>phosphate head</strong> is charged, so it is polar and <strong>hydrophilic</strong> (attracts water).</li>
<li>The two <strong>fatty acid tails</strong> are non-polar and <strong>hydrophobic</strong> (repel water).</li></ul>
<p>In water, phospholipids spontaneously arrange themselves so that heads face the water and tails are hidden from it. With water on both sides, this produces a <strong>bilayer</strong> two molecules thick: the basis of every cell membrane (3.1.4.1). The hydrophobic centre of the bilayer is a barrier to water-soluble substances and ions, while the heads keep the membrane stable in the watery environment of the cell.</p>
<table><tr><th></th><th>Triglyceride</th><th>Phospholipid</th></tr>
<tr><th>Glycerol</th><td>1</td><td>1</td></tr>
<tr><th>Fatty acids</th><td>3</td><td>2</td></tr>
<tr><th>Phosphate group</th><td>none</td><td>1 (replaces one fatty acid)</td></tr>
<tr><th>Ester bonds</th><td>3</td><td>2 (plus a phosphate ester link)</td></tr>
<tr><th>Polarity</th><td>Entirely hydrophobic</td><td>Hydrophilic head, hydrophobic tails</td></tr>
<tr><th>Main role</th><td>Energy store, insulation</td><td>Structural: cell membranes</td></tr></table>

<h2 data-stmt="3.1.1.3.s5">The emulsion test for lipids</h2>
<ol><li>Add the sample to about 2 cm³ of <strong>ethanol</strong> in a dry test tube and shake thoroughly to dissolve any lipid.</li>
<li>Pour (or add) the solution into an equal volume of <strong>water</strong>.</li>
<li><strong>Positive result:</strong> a <strong>cloudy white emulsion</strong> forms. Lipid is soluble in ethanol but not in water, so it comes out of solution as tiny droplets that scatter light.</li>
<li><strong>Negative result:</strong> the mixture stays clear.</li></ol>
<p>Use a clean, dry tube: water in the tube at step 1 would stop the lipid dissolving. The test is qualitative (it does not measure how much lipid is present).</p>

<h2 data-stmt="3.1.1.3.s6 3.1.1.3.s2">Recognising lipids from structures</h2>
<ul><li>A long zigzag hydrocarbon chain ending in –COOH is a <strong>fatty acid</strong>; count the C=C bonds to decide if it is saturated (none) or unsaturated (one or more).</li>
<li>A three-carbon backbone with three –OH groups is <strong>glycerol</strong>.</li>
<li>Three chains attached to a glycerol backbone through –O–C(=O)– links is a <strong>triglyceride</strong>.</li>
<li>Two chains plus a phosphate group on the third carbon is a <strong>phospholipid</strong>.</li>
<li>Rings with many –OH groups are carbohydrates; an –NH<sub>2</sub> and –COOH on the same carbon means an amino acid (3.1.1.4).</li></ul>

<div class="misconception"><strong>Common misconceptions.</strong>
<ul><li>"Triglycerides are polymers of fatty acids." They are not polymers: there is no repeating monomer. They are single molecules formed from four smaller molecules.</li>
<li>"The ester bond is between two fatty acids." Each ester bond is between glycerol and one fatty acid.</li>
<li>"Unsaturated means no hydrogen." It means fewer hydrogens than the maximum because of C=C double bonds.</li>
<li>"The phosphate head is hydrophobic." The head is hydrophilic; the tails are hydrophobic.</li>
<li>"Add water first in the emulsion test." Ethanol first, to dissolve the lipid; then water.</li></ul></div>
<div class="examtip"><strong>Exam focus.</strong> Be ready to (1) draw a fatty acid, glycerol and the ester bond; (2) state the number of water molecules released (3 for a triglyceride, 2 for the ester bonds of a phospholipid); (3) explain insolubility and energy content in terms of structure; (4) describe the emulsion test with ethanol <em>before</em> water and the observation "cloudy white emulsion". Questions on membranes (3.1.4.1) often start from phospholipid structure.</div>
<div class="enrich"><strong>Enrichment (not required):</strong> cholesterol (a different lipid, named only in 3.1.4.1) and the health effects of saturated fat (3.2.7.2) are context, not 3.1.1.3 content.</div>
`,
    diagrams: [
      { id: "d-3.1.1.3-1", title: "Glycerol", status: "reviewed", caption: "Displayed formula of glycerol (propane-1,2,3-triol). Each of the three carbons carries a hydroxyl group that can form an ester bond.", alt: "A vertical chain of three carbon atoms, each bonded to a hydrogen atom on the left and a hydroxyl group on the right; the top and bottom carbons also carry a hydrogen.", svg: dGlycerol },
      { id: "d-3.1.1.3-2", title: "General structure of a fatty acid", status: "reviewed", caption: "A carboxyl group (–COOH) attached to a hydrocarbon chain (R), written RCOOH. The displayed example is the saturated fatty acid stearic acid; the zigzag shows the carbon skeleton with hydrogens omitted.", alt: "A box labelled R joined to a carbon that has a double bond to oxygen and a single bond to a hydroxyl group; below, a zigzag chain of seventeen carbons ending in a carboxyl group.", svg: dFattyAcid },
      { id: "d-3.1.1.3-3", title: "Saturated and unsaturated fatty acid chains", status: "reviewed", caption: "A saturated chain has only C–C single bonds and is straight. An unsaturated chain has at least one C=C double bond (circled), which puts a kink in the chain.", alt: "Two zigzag chains with carboxyl groups: the upper one straight; the lower one with a circled double bond in the middle after which the chain changes direction.", svg: dSatUnsat },
      { id: "d-3.1.1.3-4", title: "Formation of a triglyceride", status: "reviewed", caption: "One glycerol and three fatty acids join by condensation, forming three ester bonds (boxed) and releasing three molecules of water. Hydrolysis reverses this.", alt: "Left: glycerol with three hydroxyl groups lined up with the carboxyl groups of three fatty acids. Arrow labelled condensation. Right: the triglyceride with three ester links from the glycerol carbons to the fatty acid chains, and three water molecules.", svg: dTriglyceride },
      { id: "d-3.1.1.3-5", title: "Structure of a phospholipid", status: "reviewed", caption: "Two fatty acids are ester-linked to glycerol; the third carbon carries a phosphate group (and often a further polar group such as choline). The charged phosphate makes the head hydrophilic; the tails are hydrophobic.", alt: "A glycerol backbone with two fatty acid chains attached through ester bonds, and a phosphate group attached to the third carbon which in turn links to a box labelled e.g. choline; brackets mark the hydrophilic head and hydrophobic tails. A simplified icon of a circle with two wavy tails is shown alongside.", svg: dPhospholipid },
      { id: "d-3.1.1.3-6", title: "Phospholipid bilayer", status: "reviewed", caption: "With water on both sides, phospholipids form a bilayer about 7 nm thick: heads outward in contact with water, tails inward forming a hydrophobic core.", alt: "Two rows of phospholipid icons, heads pointing up in the top row and down in the bottom row, with tails meeting in the middle; water labelled above and below.", svg: dBilayer },
      { id: "d-3.1.1.3-7", title: "The emulsion test", status: "reviewed", caption: "Sample is shaken with ethanol, then added to water. A cloudy white emulsion is positive; a clear mixture is negative.", alt: "Four test tubes in sequence: sample with ethanol, water, a cloudy tube labelled positive, and a clear tube labelled negative.", svg: dEmulsion },
    ],
    interactives: [
      { kind: "ester", title: "Animate: forming and breaking an ester bond", note: "Condensation between one –OH of glycerol and the –COOH of a fatty acid. Press hydrolysis to reverse it." },
      { kind: "bilayer", title: "Explore: how phospholipids arrange themselves in water", note: "Change the environment and watch the heads and tails orientate. Icons only: each circle is a phosphate head and each wavy line a fatty acid tail." },
    ],
    examFocus: `<ul><li><strong>Counting water:</strong> one water molecule per ester bond. Triglyceride: 3. Phospholipid: 2 from the fatty acids (the phosphate link is also formed by condensation, but questions normally ask about the fatty acid ester bonds).</li>
<li><strong>"Explain why lipids are insoluble":</strong> non-polar hydrocarbon tails cannot form hydrogen bonds with water.</li>
<li><strong>"Explain why triglycerides are good energy stores":</strong> link each structural point to a consequence (C–H rich → high energy yield; insoluble → no osmotic effect).</li>
<li><strong>Practical skills (AO4):</strong> the emulsion test sequence, why the tube must be dry, and why ethanol is used.</li>
<li><strong>Maths link:</strong> you may be asked to deduce a molecular formula or to calculate the number of water molecules released from a given number of molecules.</li></ul>`,
    synoptic: [
      { ref: "3.1.1.1", text: "Ester bonds form by condensation and are broken by hydrolysis, like glycosidic and peptide bonds." },
      { ref: "3.1.4.1", text: "The phospholipid bilayer is the framework of the fluid-mosaic membrane; cholesterol sits between the tails." },
      { ref: "3.2.2.2", text: "Lipase hydrolyses the ester bonds of triglycerides to fatty acids and monoglycerides during digestion; bile salts emulsify fats first." },
      { ref: "3.2.2.3", text: "Fatty acids and monoglycerides are absorbed via micelles and transported as chylomicrons." },
      { ref: "3.3.3.4", text: "Fatty acids are respiratory substrates: their breakdown products enter the Krebs cycle, giving an RQ of about 0.7." },
    ],
    quickCheck: [
      { id: "q-3.1.1.3-qc1", ref: "3.1.1.3", stmts: ["3.1.1.3.s1"], type: "mcq", marks: 1, stem: "How many molecules of water are released when a triglyceride is formed from glycerol and three fatty acids?", options: ["One", "Two", "Three", "Four"], answer: 2, explanation: "One water molecule per ester bond; three ester bonds form." },
      { id: "q-3.1.1.3-qc2", ref: "3.1.1.3", stmts: ["3.1.1.3.s1", "3.1.1.3.s2", "3.1.1.3.s3"], type: "gap", marks: 3, stem: "Complete the sentences.", text: "The bond between glycerol and a fatty acid is an {{1}} bond. A fatty acid can be represented as {{2}}. In a phospholipid, one fatty acid is replaced by a {{3}} group.", answers: { 1: ["ester"], 2: ["rcooh", "r-cooh", "r cooh"], 3: ["phosphate", "phosphate-containing", "phosphate containing"] }, explanation: "Ester bond; RCOOH; phosphate-containing group." },
      { id: "q-3.1.1.3-qc3", ref: "3.1.1.3", stmts: ["3.1.1.3.s3", "3.1.1.3.s4"], type: "mcq", marks: 1, stem: "Which part of a phospholipid is hydrophilic?", options: ["The fatty acid tails", "The phosphate head", "The ester bonds", "The hydrocarbon chains"], answer: 1, explanation: "The charged phosphate group attracts water; the tails are hydrophobic." },
      { id: "q-3.1.1.3-qc4", ref: "3.1.1.3", stmts: ["3.1.1.3.s5"], type: "sequence", marks: 3, stem: "Put the steps of the emulsion test in order.", steps: ["Add the sample to ethanol in a dry test tube and shake", "Add the mixture to water", "Observe whether a cloudy white emulsion forms"], explanation: "Ethanol dissolves the lipid; adding water makes it come out of solution as droplets." },
    ],
    flashcards: [
      { id: "f-3.1.1.3-1", front: "What two types of molecule combine to form a triglyceride, and in what ratio?", back: "One glycerol and three fatty acids." },
      { id: "f-3.1.1.3-2", front: "Name the bond formed between glycerol and a fatty acid and the reaction that forms it.", back: "An ester bond, formed by condensation (water released)." },
      { id: "f-3.1.1.3-3", front: "How many water molecules are released when a triglyceride forms?", back: "Three (one per ester bond)." },
      { id: "f-3.1.1.3-4", front: "Write the general formula of a fatty acid and say what R represents.", back: "RCOOH; R is the hydrocarbon chain (which may be saturated or unsaturated)." },
      { id: "f-3.1.1.3-5", front: "What is the difference between a saturated and an unsaturated fatty acid?", back: "Saturated: only C–C single bonds, maximum hydrogen, straight chain. Unsaturated: one or more C=C double bonds, fewer hydrogens, kinked chain." },
      { id: "f-3.1.1.3-6", front: "How does a phospholipid differ from a triglyceride?", back: "One of the three fatty acids is replaced by a phosphate-containing group, giving a hydrophilic head and two hydrophobic tails." },
      { id: "f-3.1.1.3-7", front: "Why are lipids insoluble in water?", back: "Their hydrocarbon chains are non-polar and cannot form hydrogen bonds with water molecules." },
      { id: "f-3.1.1.3-8", front: "Give two reasons why triglycerides are good energy storage molecules.", back: "Many C–H bonds and little oxygen, so they release about twice the energy per gram of carbohydrate; insoluble, so they do not affect the water potential of cells." },
      { id: "f-3.1.1.3-9", front: "Why do phospholipids form a bilayer in water?", back: "Hydrophilic phosphate heads face the water on each side; hydrophobic fatty acid tails point inwards away from water." },
      { id: "f-3.1.1.3-10", front: "Describe the emulsion test for lipids.", back: "Shake the sample with ethanol in a dry tube, then add to water. A cloudy white emulsion shows lipid is present." },
      { id: "f-3.1.1.3-11", front: "Why is ethanol used in the emulsion test?", back: "Lipids dissolve in ethanol but not in water; when the ethanol solution is added to water the lipid comes out of solution as tiny droplets, forming the emulsion." },
      { id: "f-3.1.1.3-12", front: "Which enzyme hydrolyses triglycerides and what are the products?", back: "Lipase; glycerol (or monoglycerides) and fatty acids (3.2.2.2)." },
      { id: "f-3.1.1.3-13", front: "Why are triglycerides not polymers?", back: "They are not made of a repeating monomer; a triglyceride is one glycerol plus three fatty acids." },
      { id: "f-3.1.1.3-14", front: "What is the main biological role of phospholipids?", back: "Forming the bilayer of cell membranes (structural role)." },
    ],
    questions: [
      { id: "q-3.1.1.3-m1", ref: "3.1.1.3", stmts: ["3.1.1.3.s1"], type: "mcq", marks: 1, stem: "Which statement about triglycerides is correct?", options: ["They are polymers of fatty acids", "They are formed from one glycerol and three fatty acids by condensation", "They contain a phosphate group", "They are soluble in water"], answer: 1, explanation: "Triglycerides are not polymers; they form from glycerol plus three fatty acids with three ester bonds." },
      { id: "q-3.1.1.3-m2", ref: "3.1.1.3", stmts: ["3.1.1.3.s2", "3.1.1.3.s6"], type: "mcq", marks: 1, stem: "A fatty acid has the formula C₁₇H₃₃COOH. Compared with C₁₇H₃₅COOH, it is", options: ["saturated, because it has fewer hydrogens", "unsaturated, with one C=C double bond", "unsaturated, with two C=C double bonds", "a phospholipid"], answer: 1, explanation: "Each C=C removes two hydrogens: 35 → 33 means one double bond." },
      { id: "q-3.1.1.3-m3", ref: "3.1.1.3", stmts: ["3.1.1.3.s1", "3.1.1.1.s3"], type: "mcq", marks: 1, stem: "Hydrolysis of one triglyceride molecule requires", options: ["one molecule of water", "two molecules of water", "three molecules of water", "no water, only lipase"], answer: 2, explanation: "One water molecule is used to break each of the three ester bonds." },
      { id: "q-3.1.1.3-m4", ref: "3.1.1.3", stmts: ["3.1.1.3.s3", "3.1.1.3.s4"], type: "mcq", marks: 1, stem: "Which property of the phosphate group gives a phospholipid its hydrophilic head?", options: ["It is non-polar", "It is charged / polar so it attracts water", "It contains a long hydrocarbon chain", "It forms ester bonds with water"], answer: 1, explanation: "The charged phosphate interacts with polar water molecules." },
      { id: "q-3.1.1.3-m5", ref: "3.1.1.3", stmts: ["3.1.1.3.s5"], type: "mcq", marks: 1, stem: "In the emulsion test, a cloudy white appearance is caused by", options: ["lipid reacting chemically with ethanol", "lipid dissolving in water", "tiny droplets of lipid dispersed in water scattering light", "ethanol evaporating"], answer: 2, explanation: "The lipid leaves the ethanol solution when water is added and forms an emulsion of droplets." },
      { id: "q-3.1.1.3-m6", ref: "3.1.1.3", stmts: ["3.1.1.3.s4"], type: "mcq", marks: 1, stem: "Which part of a triglyceride is mainly responsible for its high energy content?", options: ["The ester bonds", "The glycerol backbone", "The many C–H bonds in the hydrocarbon chains", "The oxygen atoms"], answer: 2, explanation: "Oxidation of the C–H rich chains releases a lot of energy." },
      { id: "q-3.1.1.3-m7", ref: "3.1.1.3", stmts: ["3.1.1.3.s5"], type: "mcq", marks: 1, stem: "Which of the following would NOT give a positive emulsion test?", options: ["Olive oil", "Butter", "Glucose solution", "Phospholipid extract"], answer: 2, explanation: "Glucose is a carbohydrate, soluble in water, and forms no emulsion." },
      { id: "q-3.1.1.3-m8", ref: "3.1.1.3", stmts: ["3.1.1.3.s5"], type: "mcq", marks: 1, stem: "Why must the test tube be dry at the start of the emulsion test?", options: ["Water would prevent the lipid dissolving in the ethanol", "Water reacts with ethanol", "Water would make the result too cloudy", "The test needs heat"], answer: 0, explanation: "Lipid must first dissolve fully in ethanol; water present too early stops this." },
      { id: "q-3.1.1.3-m9", ref: "3.1.1.3", stmts: ["3.1.1.3.s3", "3.1.1.3.s6"], type: "mcq", marks: 1, stem: "A molecule has a glycerol backbone, two fatty acid chains and a phosphate group. It is", options: ["a triglyceride", "a phospholipid", "a saturated fatty acid", "a disaccharide"], answer: 1, explanation: "Two fatty acids plus a phosphate-containing group on glycerol defines a phospholipid." },
      { id: "q-3.1.1.3-m10", ref: "3.1.1.3", stmts: ["3.1.1.3.s2", "3.1.1.3.s4"], type: "mcq", marks: 1, stem: "Which structural feature explains why oils are liquid at room temperature while fats are solid?", options: ["Oils have more ester bonds", "Oils have unsaturated chains whose kinks prevent close packing", "Oils contain phosphate groups", "Oils have shorter glycerol molecules"], answer: 1, explanation: "C=C kinks keep unsaturated chains apart, lowering the melting point." },
      { id: "q-3.1.1.3-g1", ref: "3.1.1.3", stmts: ["3.1.1.3.s1"], type: "gap", marks: 4, stem: "Complete the passage about triglyceride formation.", text: "A triglyceride is formed when one molecule of {{1}} reacts with three molecules of {{2}} in a {{3}} reaction. Each of the three {{4}} bonds formed releases one molecule of water.", answers: { 1: ["glycerol"], 2: ["fatty acid", "fatty acids"], 3: ["condensation"], 4: ["ester"] }, explanation: "Glycerol + 3 fatty acids → triglyceride + 3 water, via condensation forming ester bonds." },
      { id: "q-3.1.1.3-g2", ref: "3.1.1.3", stmts: ["3.1.1.3.s2"], type: "gap", marks: 3, stem: "Complete the sentences about fatty acids.", text: "A fatty acid with no C=C double bonds is described as {{1}}. A fatty acid with one or more C=C double bonds is {{2}}. The functional group at the end of every fatty acid is the {{3}} group.", answers: { 1: ["saturated"], 2: ["unsaturated"], 3: ["carboxyl", "carboxylic acid", "cooh", "-cooh"] }, explanation: "Saturated: no C=C; unsaturated: C=C present; carboxyl (–COOH) group." },
      { id: "q-3.1.1.3-g3", ref: "3.1.1.3", stmts: ["3.1.1.3.s3", "3.1.1.3.s4"], type: "gap", marks: 3, stem: "Complete the sentences about phospholipids.", text: "In a phospholipid the phosphate head is {{1}} and the fatty acid tails are {{2}}. In water, phospholipids arrange themselves into a {{3}}, which forms the basis of cell membranes.", answers: { 1: ["hydrophilic", "polar"], 2: ["hydrophobic", "non-polar", "nonpolar", "non polar"], 3: ["bilayer", "phospholipid bilayer"] }, explanation: "Hydrophilic head, hydrophobic tails, bilayer." },
      { id: "q-3.1.1.3-g4", ref: "3.1.1.3", stmts: ["3.1.1.3.s5"], type: "gap", marks: 3, stem: "Complete the description of the emulsion test.", text: "Shake the sample with {{1}} in a dry test tube, then add the mixture to {{2}}. A positive result is a cloudy white {{3}}.", answers: { 1: ["ethanol", "alcohol"], 2: ["water", "distilled water"], 3: ["emulsion"] }, explanation: "Ethanol, then water; cloudy white emulsion." },
      { id: "q-3.1.1.3-g5", ref: "3.1.1.3", stmts: ["3.1.1.3.s4"], type: "gap", marks: 3, stem: "Complete the sentences about lipid properties.", text: "Lipids are {{1}} in water because their hydrocarbon chains are non-polar. Triglycerides release roughly {{2}} the energy per gram of carbohydrates. Because they are insoluble, stored triglycerides do not affect the cell's {{3}} potential.", answers: { 1: ["insoluble"], 2: ["twice", "double", "two times", "2x", "2 times"], 3: ["water"] }, explanation: "Insoluble; about twice; water potential." },
      { id: "q-3.1.1.3-match", ref: "3.1.1.3", stmts: ["3.1.1.3.s1", "3.1.1.3.s2", "3.1.1.3.s3", "3.1.1.3.s5"], type: "match", marks: 5, stem: "Match each description to the correct term.", pairs: [{ left: "Three-carbon molecule with three –OH groups", right: "Glycerol" }, { left: "Bond between glycerol and a fatty acid", right: "Ester bond" }, { left: "Fatty acid chain with one or more C=C double bonds", right: "Unsaturated" }, { left: "Lipid with a phosphate group in place of one fatty acid", right: "Phospholipid" }, { left: "Reagent that dissolves lipid in the emulsion test", right: "Ethanol" }], explanation: "" },
      { id: "q-3.1.1.3-id", ref: "3.1.1.3", stmts: ["3.1.1.3.s6"], type: "label", marks: 4, stem: "Identify each of the four numbered structures.", svg: dIdentify, labels: [{ n: 1, answer: "Fatty acid" }, { n: 2, answer: "Glycerol" }, { n: 3, answer: "Triglyceride" }, { n: 4, answer: "Phospholipid" }], bank: ["Fatty acid", "Glycerol", "Triglyceride", "Phospholipid", "Monosaccharide", "Amino acid"], explanation: "1: hydrocarbon chain ending in –COOH. 2: three carbons each with –OH. 3: glycerol with three chains through ester links. 4: two chains plus a phosphate group." },
      { id: "q-3.1.1.3-s1", ref: "3.1.1.3", stmts: ["3.1.1.3.s1"], type: "short", marks: 3, stem: "Describe how a triglyceride is formed from its components. (3 marks)",
        scheme: [{ point: "One glycerol and three fatty acids", marks: 1 }, { point: "Joined by condensation (reactions) / water removed", marks: 1 }, { point: "Forming (three) ester bonds", marks: 1 }],
        model: "One molecule of glycerol reacts with three fatty acid molecules. Each reaction is a condensation in which a molecule of water is removed, forming an ester bond between a hydroxyl group of glycerol and the carboxyl group of the fatty acid; three ester bonds form in total.",
        alternatives: "Accept 'esterification' for the formation of ester bonds.", commonErrors: "Saying glycosidic or peptide bond; describing hydrolysis; one fatty acid." },
      { id: "q-3.1.1.3-s2", ref: "3.1.1.3", stmts: ["3.1.1.3.s3", "3.1.1.3.s4"], type: "short", marks: 3, stem: "Explain how the structure of a phospholipid leads to the formation of a bilayer in water. (3 marks)",
        scheme: [{ point: "Phosphate head is hydrophilic / polar / charged and fatty acid tails are hydrophobic / non-polar", marks: 1 }, { point: "Heads face / interact with water on both sides", marks: 1 }, { point: "Tails point inwards / away from water, towards each other", marks: 1 }],
        model: "The phosphate head is polar and hydrophilic while the two fatty acid tails are non-polar and hydrophobic. In water the heads orientate towards the water on either side and the tails point inwards away from the water, so a double layer forms with a hydrophobic core.",
        commonErrors: "Reversing head and tail; describing a monolayer." },
      { id: "q-3.1.1.3-s3", ref: "3.1.1.3", stmts: ["3.1.1.3.s5"], type: "short", marks: 3, stem: "A student tests a food sample for lipid. Describe the method and the result expected if lipid is present. (3 marks)",
        scheme: [{ point: "Add / shake sample with ethanol (in a dry tube)", marks: 1 }, { point: "Then add (the solution) to water", marks: 1 }, { point: "Cloudy / milky white emulsion forms", marks: 1 }],
        model: "Shake the sample with ethanol in a dry test tube so that any lipid dissolves, then add the mixture to water. If lipid is present the mixture turns a cloudy white because an emulsion of lipid droplets forms.",
        commonErrors: "Adding water before ethanol; stating 'turns white precipitate'; using Benedict's." },
      { id: "q-3.1.1.3-a1", ref: "3.1.1.3", stmts: ["3.1.1.3.s4"], type: "short", marks: 4, stem: "Application. Desert mammals such as camels store large amounts of triglyceride in their hump rather than storing carbohydrate. Using your knowledge of lipid structure, suggest and explain two advantages of storing triglyceride rather than carbohydrate in this environment. (4 marks)",
        scheme: [{ point: "Triglycerides have more energy per gram / many C–H bonds, so the store is lighter / more compact for the same energy", marks: 1 }, { point: "Linked to need to carry the store / move long distances", marks: 1 }, { point: "Respiration of triglycerides releases (metabolic) water because of the high hydrogen content", marks: 1 }, { point: "Useful when drinking water is scarce; also insoluble so no osmotic uptake of water into storage cells", marks: 1 }],
        model: "Triglycerides contain many C–H bonds and little oxygen, so they release about twice the energy per gram of carbohydrate; a camel can therefore carry the same energy in a lighter, more compact store, which matters when travelling long distances. Second, because the hydrocarbon chains are rich in hydrogen, respiration of fat produces a large amount of metabolic water, which is valuable where drinking water is scarce. Being insoluble, the stored fat also has no osmotic effect on the storage cells.",
        commonErrors: "Claiming the hump stores water directly; not linking the property to the desert context." },
      { id: "q-3.1.1.3-a2", ref: "3.1.1.3", stmts: ["3.1.1.3.s2", "3.1.1.3.s4", "3.1.1.3.s6"], type: "short", marks: 3, stem: "Application. Two fatty acids were analysed. Fatty acid P had the formula C₁₇H₃₅COOH and fatty acid Q had the formula C₁₇H₃₁COOH. Deduce the number of C=C double bonds in Q and explain how this affects the shape of the molecule and the packing of triglycerides containing it. (3 marks)",
        scheme: [{ point: "Two C=C double bonds (each double bond reduces H by 2; 35 − 31 = 4)", marks: 1 }, { point: "Double bonds cause kinks / bends in the hydrocarbon chain", marks: 1 }, { point: "So molecules cannot pack closely together (lower melting point / more likely to be liquid)", marks: 1 }],
        model: "P is saturated. Q has four fewer hydrogens, and each C=C double bond removes two hydrogens, so Q has two double bonds and is polyunsaturated. Each double bond bends the chain, so triglycerides containing Q cannot pack closely together, giving them a lower melting point, which is why they are usually liquid (oils).",
        commonErrors: "Counting one double bond; saying unsaturated chains are straight." },
      { id: "q-3.1.1.3-e1", ref: "3.1.1.3", stmts: ["3.1.1.3.s1", "3.1.1.3.s3", "3.1.1.3.s4"], type: "extended", marks: 6, stem: "Compare the structures of triglycerides and phospholipids and explain how the structure of each is related to its function. (6 marks)",
        scheme: [{ point: "Both contain glycerol and fatty acids joined by ester bonds (formed by condensation)", marks: 1 }, { point: "Triglyceride: three fatty acids; phospholipid: two fatty acids plus a phosphate(-containing) group", marks: 1 }, { point: "Triglyceride entirely hydrophobic / insoluble; phospholipid has hydrophilic head and hydrophobic tails", marks: 1 }, { point: "Triglyceride: many C–H bonds give high energy yield, so efficient energy store", marks: 1 }, { point: "Triglyceride insoluble so no effect on water potential / can be stored in bulk (also insulation)", marks: 1 }, { point: "Phospholipid: heads face water and tails face inwards so forms bilayer in membranes / hydrophobic core acts as barrier", marks: 1 }],
        levels: "Full marks need both similarities and differences in structure, and a clear structure-to-function link for each molecule. Answers that only describe structure without function cap at 3.",
        model: "Both molecules are built from glycerol and fatty acids joined by ester bonds formed by condensation. A triglyceride has three fatty acids, whereas a phospholipid has two fatty acids and a phosphate-containing group attached to the third carbon of glycerol. This makes the triglyceride entirely non-polar and insoluble, while the phospholipid has a polar, hydrophilic phosphate head and non-polar, hydrophobic tails. The triglyceride's long hydrocarbon chains are rich in C–H bonds, so it releases a great deal of energy when respired and is an efficient, compact energy store; because it is insoluble it does not affect the water potential of cells and can be stored in bulk, and it also insulates. The phospholipid's two-ended structure means that in water the heads face outwards and the tails inwards, forming a bilayer, so phospholipids are the structural basis of cell membranes, with the hydrophobic core acting as a barrier to water-soluble substances.",
        commonErrors: "Omitting the function half of the question; saying phospholipids store energy." },
    ],
  };
})();
