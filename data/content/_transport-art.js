// Shared artwork and models for 3.1.4 (membranes, diffusion, osmosis, active transport) and RP2. Loaded before
// the 3.1.4 content files and the transport interactives. All drawings are schematic SVG; models are documented
// here and in KNOWN_LIMITATIONS.md. Nothing is measured data.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", SAGE = "#6b9a7f", NAVY = "#1e3a5f", AMBER = "#c8902a", ROSE = "#b4504f", MINT = "#d6efec";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ""}>${s}</text>`;

  // ---------- Models ----------
  // Water potential of a solution (kPa): Ψs = −i C R T with C in mol dm⁻³, R = 8.31 J K⁻¹ mol⁻¹, T in K.
  // For sucrose i = 1; for NaCl i ≈ 2 (two ions). Pure water Ψ = 0. (van 't Hoff, dilute-solution approximation.)
  const psiSolute = (C, i = 1, Tk = 293) => -i * C * 8.31 * Tk;
  // RP2 tissue model: a 1 cm × 3 cm potato cylinder of initial mass ~2.5 g. Its water potential Ψt is a parameter
  // (default −730 kPa, i.e. isotonic with about 0.30 mol dm⁻³ sucrose at 20 °C; real potatoes vary from about
  // −600 to −900 kPa). Percentage change in mass after t minutes:
  //   Δ% = A · tanh((Ψext − Ψt) / s) · (1 − exp(−t / τ)),  A = 22 %, s = 900 kPa, τ = 25 min
  // (bounded uptake/loss: the tissue cannot swell without limit because turgor pressure rises; loss levels off as the
  // cells plasmolyse). Gains are scaled by 0.55 (revised 2026-11-03): once cells are turgid the cell wall resists
  // further expansion, so tissue gains less mass than it loses for the same difference in water potential. With this
  // term the model gives about +4.5 % in water and −11.6 % in 1.0 mol dm⁻³ sucrose after 20 min, close to the
  // OxfordAQA practical handbook's sample results for RP2 (+4.1 % and −12.6 %; that potato was isotonic near
  // 0.23 mol dm⁻³). Scatter: each cylinder differs by ±4 % (relative) and the balance reads to 0.01 g.
  const PSI_TISSUE = -730;
  // RP2 runs at 30 °C (handbook water bath), so the solution's water potential is worked out at 303 K (revised
  // 2026-11-04): Ψt = −730 kPa is then isotonic with about 0.29 mol dm⁻³ sucrose, and the 20-minute values are
  // +4.5, +1.6, −3.6, −8.5, −10.8 and −11.7 % for 0.0 to 1.0 mol dm⁻³ (handbook sample: +4.13, +0.91, −5.42,
  // −7.02, −10.30, −12.60 %). psiSolute itself keeps 293 K as its default for the 3.1.4 interactives.
  function massChangePct(C, { minutes = 30, psiTissue = PSI_TISSUE, i = 1, Tk = 303 } = {}) {
    const dpsi = psiSolute(C, i, Tk) - psiTissue; const v = 22 * Math.tanh(dpsi / 900) * (1 - Math.exp(-minutes / 25)); return v > 0 ? 0.55 * v : v;
  }
  function isotonicC(psiTissue = PSI_TISSUE, i = 1, Tk = 303) { return -psiTissue / (i * 8.31 * Tk); }
  // Plant cell in a solution of water potential Ψext (kPa). Model cell: solute potential −1000 kPa at normal
  // volume, pressure potential 0 to +1000 kPa. Returns state and relative protoplast volume.
  function plantCell(psiExt) {
    if (psiExt >= 0) return { state: "turgid", psiP: 1000, vol: 1.05, label: "Turgid: water enters until pressure potential balances; the wall stops further swelling." };
    // The boundary is inclusive: a solution of exactly −1000 kPa is isotonic with the model cell (flaccid, incipient plasmolysis).
    if (psiExt >= -1000) return { state: psiExt > -700 ? "turgid" : "flaccid", psiP: psiExt + 1000, vol: 1 + 0.05 * (psiExt + 1000) / 1000, label: psiExt > -700 ? "Partly turgid: the wall resists expansion; a little net water uptake." : psiExt === -1000 ? "Incipient plasmolysis: the solution has the same water potential as the cell, pressure potential is zero and the cell is flaccid." : "Approaching incipient plasmolysis: pressure potential near zero; the cell is flaccid." };
    return { state: "plasmolysed", psiP: 0, vol: Math.max(0.55, 1000 / -psiExt), label: "Plasmolysed: water has left, the protoplast has shrunk away from the wall; external solution fills the gap." };
  }
  // Animal cell (no wall) with internal solute potential −800 kPa at normal volume: behaves as an osmometer.
  function animalCell(psiExt) {
    if (psiExt > -200) return { state: "lysed", vol: 1.5, label: "Water enters by osmosis; with no wall to resist, the cell swells and bursts (haemolysis in a red cell)." };
    const vol = Math.min(1.45, Math.max(0.55, 800 / -psiExt));
    return { state: vol > 1.15 ? "swollen" : vol < 0.9 ? "shrunken" : "normal", vol, label: vol > 1.15 ? "Net water entry: the cell swells; it will burst if the external water potential rises further." : vol < 0.9 ? "Net water loss: the cell shrinks and its membrane crinkles (crenation)." : "Near equilibrium: water molecules still cross in both directions but there is no net movement." };
  }
  B.transportModel = { psiSolute, massChangePct, isotonicC, PSI_TISSUE, plantCell, animalCell };

  // ---------- Membrane artwork ----------
  // Phospholipid: head circle + two wavy tails. `up` true = head at top.
  const lipid = (x, y, up, col = "#9ec9f0") => { const d = up ? 1 : -1; return `<circle cx="${x}" cy="${y}" r="6" fill="${col}" stroke="${NAVY}" stroke-width="1.2"/><path d="M${x - 2.5} ${y + 6 * d} q -3 ${7 * d} 0 ${14 * d} q 3 ${7 * d} 0 ${14 * d}" fill="none" stroke="${NAVY}" stroke-width="1.6"/><path d="M${x + 2.5} ${y + 6 * d} q 3 ${7 * d} 0 ${14 * d} q -3 ${7 * d} 0 ${14 * d}" fill="none" stroke="${NAVY}" stroke-width="1.6"/>`; };
  // A bilayer strip from x0 to x1 with the midline at y. Skips lipid slots listed in `gaps` (indices).
  function bilayer(x0, x1, y, gaps = [], spacing = 14) { let s = ""; let i = 0; for (let x = x0 + 7; x < x1; x += spacing, i++) { if (gaps.includes(i)) continue; s += lipid(x, y - 36, true) + lipid(x, y + 36, false); } return s; }
  const cholesterol = (x, y) => `<rect x="${x - 3}" y="${y - 30}" width="6" height="26" rx="3" fill="${AMBER}" stroke="#8a5f12" stroke-width="1"/>`;
  const sugar = (x, y, n = 4) => { let s = ""; for (let k = 0; k < n; k++) { const dx = (k % 2 ? 9 : -9) * (k > 1 ? 1.4 : 1), dy = -12 * k; s += `<line x1="${x}" y1="${y - 12 * k}" x2="${x + dx}" y2="${y + dy - 10}" stroke="${SAGE}" stroke-width="1.5"/><polygon points="${x + dx - 5},${y + dy - 10} ${x + dx},${y + dy - 16} ${x + dx + 5},${y + dy - 10} ${x + dx},${y + dy - 4}" fill="#e2efe6" stroke="${SAGE}" stroke-width="1.2"/>`; } return s; };
  const proteinBlob = (x, y, w, h, fill, label) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2.2}" fill="${fill}" stroke="${NAVY}" stroke-width="1.6"/>`;
  // Full fluid-mosaic diagram (schematic). Components get data-part ids for the explorer.
  function fluidMosaic({ labels = true, width = 760 } = {}) {
    const y = 160; const parts = [];
    let s = `<svg viewBox="0 0 ${width} 300" width="${width}" role="img" aria-label="fluid-mosaic model of the cell-surface membrane">`;
    s += T(380, 22, "outside the cell (extracellular)", { s: 11, c: GREY }) + T(380, 292, "inside the cell (cytoplasm)", { s: 11, c: GREY });
    s += `<g data-part="bilayer">${bilayer(10, width - 10, y, [9, 10, 11, 22, 23, 33, 34, 35])}</g>`;
    // intrinsic channel protein (pore through)
    s += `<g data-part="channel">${proteinBlob(170, y, 40, 96, "#d6efec")}<rect x="164" y="${y - 44}" width="12" height="88" rx="6" fill="#fff" stroke="${TEAL}" stroke-width="1.2"/></g>`;
    // carrier protein
    s += `<g data-part="carrier">${proteinBlob(342, y, 44, 96, "#fbf0d8")}<path d="M332 ${y - 44} q 10 20 0 40" fill="none" stroke="${AMBER}" stroke-width="2"/></g>`;
    // intrinsic glycoprotein
    s += `<g data-part="glycoprotein">${proteinBlob(500, y, 40, 96, "#e2efe6")}${sugar(500, y - 48, 4)}</g>`;
    // extrinsic protein on the inner surface: it sits against the heads of the inner layer, below a continuous bilayer
    s += `<g data-part="extrinsic">${proteinBlob(640, y + 55, 54, 30, "#e4ebf5")}</g>`;
    // glycolipid
    s += `<g data-part="glycolipid">${lipid(260, y - 36, true, "#e2efe6")}${sugar(260, y - 42, 3)}</g>`;
    // cholesterol molecules
    // cholesterol molecules in both layers (outer-layer rods hang down from the heads; inner-layer rods rise from them)
    s += `<g data-part="cholesterol">${cholesterol(96, y - 4)}${cholesterol(426, y - 4)}${cholesterol(582, y - 4)}${cholesterol(704, y - 4)}${cholesterol(124, y + 34)}${cholesterol(556, y + 34)}</g>`;
    if (labels) {
      const lab = (x, yy, t, tx, ty, part) => `<g data-label="${part}"><line x1="${x}" y1="${yy}" x2="${tx}" y2="${ty}" stroke="${GREY}" stroke-width="1"/>${T(tx, ty + (ty < yy ? -4 : 12), t, { s: 11, w: 600, a: tx < x ? "end" : "start" })}</g>`;
      s += lab(60, y - 36, "hydrophilic head", 60, y - 90, "bilayer") + lab(60, y - 10, "hydrophobic fatty-acid tails", 60, y + 108, "bilayer");
      s += lab(170, y - 48, "channel protein (intrinsic)", 150, y - 110, "channel") + lab(342, y - 48, "carrier protein (intrinsic)", 330, y - 112, "carrier");
      s += lab(500, y - 60, "glycoprotein (intrinsic)", 540, y - 112, "glycoprotein") + lab(640, y + 72, "extrinsic protein", 600, y + 104, "extrinsic");
      s += lab(260, y - 70, "glycolipid", 240, y - 84, "glycolipid") + lab(426, y - 20, "cholesterol", 400, y + 100, "cholesterol");
      s += T(width - 10, 292, "about 7 nm thick · schematic, not to scale", { s: 10.5, c: GREY, a: "end" });
    }
    return s + "</svg>";
  }

  // ---------- Transport diagrams ----------
  const dot = (x, y, col = NAVY, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`;
  function membraneStrip(x0, x1, y) { return bilayer(x0, x1, y, [], 14); }
  // Simple diffusion through the bilayer; facilitated via channel and carrier; active transport via carrier + ATP
  const transportTypes = () => {
    const panel = (x, title, sub, inner) => `<g transform="translate(${x},0)">${T(120, 20, title, { s: 12.5, w: 700 })}${T(120, 36, sub, { s: 10.5, c: GREY })}${inner}</g>`;
    const y = 150;
    const strip = (gaps) => bilayer(10, 230, y, gaps);
    const many = (xs, yy, col) => xs.map((x) => dot(x, yy, col)).join("");
    const arrow = (x, y1, y2, col = INK) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${col}" stroke-width="2" marker-end="url(#tarrow)"/>`;
    return `<svg viewBox="0 0 980 300" width="980" role="img" aria-label="four ways substances cross membranes: simple diffusion, facilitated diffusion through a channel, facilitated diffusion by a carrier, and active transport using ATP">
      <defs><marker id="tarrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${INK}"/></marker></defs>
      ${panel(0, "Simple diffusion", "small, non-polar (O₂, CO₂) · down the gradient", strip([]) + many([40, 70, 100, 130, 160, 190, 60, 120, 180], 70, ROSE) + many([50, 110], 92, ROSE) + many([80, 160], 235, ROSE) + arrow(120, 100, 215, ROSE) + T(120, 275, "through the bilayer itself · no protein · no ATP", { s: 10.5, c: GREY }))}
      ${panel(245, "Facilitated diffusion: channel", "ions, water · down the gradient", strip([7, 8]) + proteinBlob(120, y, 40, 96, MINT) + `<rect x="114" y="${y - 44}" width="12" height="88" rx="6" fill="#fff" stroke="${TEAL}"/>` + many([40, 70, 170, 200, 55, 185], 70, NAVY) + many([60, 180], 92, NAVY) + dot(120, 100, NAVY) + dot(120, 130, NAVY) + dot(120, 200, NAVY) + dot(60, 240, NAVY) + arrow(120, 60, 95) + T(120, 275, "hydrophilic pore · specific · no ATP", { s: 10.5, c: GREY }))}
      ${panel(490, "Facilitated diffusion: carrier", "glucose, amino acids · down the gradient", strip([7, 8]) + proteinBlob(120, y, 44, 96, "#fbf0d8") + `<path d="M110 ${y - 44} q 12 24 0 44" fill="none" stroke="${AMBER}" stroke-width="2"/>` + `<rect x="106" y="${y - 30}" width="14" height="10" rx="3" fill="${SAGE}"/>` + [40, 70, 165, 195, 55].map((x) => `<rect x="${x - 7}" y="66" width="14" height="10" rx="3" fill="${SAGE}"/>`).join("") + `<rect x="${60 - 7}" y="236" width="14" height="10" rx="3" fill="${SAGE}"/>` + arrow(120, 100, 215, SAGE) + T(120, 275, "carrier binds, changes shape · no ATP", { s: 10.5, c: GREY }))}
      ${panel(735, "Active transport", "ions, glucose · AGAINST the gradient", strip([7, 8]) + proteinBlob(120, y, 44, 96, "#f3d6d5") + `<path d="M110 ${y + 44} q 12 -24 0 -44" fill="none" stroke="${ROSE}" stroke-width="2"/>` + `<rect x="${120 - 7}" y="${y + 10}" width="14" height="10" rx="3" fill="${NAVY}"/>` + [50].map((x) => `<rect x="${x - 7}" y="70" width="14" height="10" rx="3" fill="${NAVY}"/>`).join("") + [40, 70, 165, 195, 55, 185, 120].map((x) => `<rect x="${x - 7}" y="236" width="14" height="10" rx="3" fill="${NAVY}"/>`).join("") + `<circle cx="178" cy="${y + 40}" r="13" fill="#fbf0d8" stroke="${AMBER}" stroke-width="1.5"/>${T(178, y + 44, "ATP", { s: 9, w: 700, c: AMBER })}` + `<line x1="165" y1="${y + 34}" x2="146" y2="${y + 22}" stroke="${AMBER}" stroke-width="1.5" marker-end="url(#tarrow)"/>` + arrow(120, 100, 215, NAVY) + T(120, 275, "carrier + ATP · low → high", { s: 10.5, c: GREY }))}
    </svg>`;
  };
  // Osmosis: plant and animal cells in three solutions
  // nucleus: false draws the animal cell as a red blood cell (no nucleus; pale centre of the biconcave disc when normal).
  function cellPair({ psiExt, labelsOn = true, nucleus = true }) {
    const p = plantCell(psiExt), a = animalCell(psiExt);
    const plant = (x) => { const v = p.vol; const rw = 110, rh = 70; const pw = rw * Math.min(1, v) * (p.state === "plasmolysed" ? 0.82 : 1), ph = rh * Math.min(1, v) * (p.state === "plasmolysed" ? 0.82 : 1); return `<g transform="translate(${x},0)"><rect x="${-rw / 2 - 6}" y="${-rh / 2 - 6}" width="${rw + 12}" height="${rh + 12}" rx="14" fill="#efe6d2" stroke="#9c7b3a" stroke-width="3"/>${p.state === "plasmolysed" ? `<rect x="${-rw / 2}" y="${-rh / 2}" width="${rw}" height="${rh}" rx="10" fill="#e7f1ff" stroke="none"/>` : ""}<rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" rx="${p.state === "plasmolysed" ? 22 : 10}" fill="#d6efec" stroke="${TEAL}" stroke-width="2"/><ellipse cx="0" cy="0" rx="${pw * 0.3}" ry="${ph * 0.3}" fill="#bfe0f5" stroke="#5a7d96"/><circle cx="${pw * 0.3}" cy="${-ph * 0.22}" r="7" fill="#e4ebf5" stroke="${NAVY}"/></g>`; };
    // Crenated outline: a shrunken disc with a regular scalloped (spiky) edge, centred on the origin.
    const crenated = (r) => { let d = ""; for (let k = 0; k <= 72; k++) { const th = (2 * Math.PI * k) / 72, rr = r * (1 + 0.13 * Math.cos(11 * th)); d += `${k ? "L" : "M"}${(rr * Math.cos(th)).toFixed(1)} ${(rr * Math.sin(th)).toFixed(1)} `; } return d + "Z"; };
    const animal = (x) => { const r = 32 * Math.sqrt(a.vol); const inner = nucleus ? `<circle cx="0" cy="0" r="${r * 0.28}" fill="#e4ebf5" stroke="${NAVY}"/>` : a.state === "normal" ? `<circle cx="0" cy="0" r="${r * 0.42}" fill="#fdf2f2" stroke="none"/>` : ""; return `<g transform="translate(${x},0)">${a.state === "lysed" ? `<path d="M${-r} 0 q ${r * 0.3} ${-r * 1.2} ${r} ${-r * 0.2} q ${r * 0.5} ${r * 0.6} ${r * 0.2} ${r} q ${-r * 0.8} ${r * 0.3} ${-r * 1.4} ${-r * 0.2} z" fill="#f3d6d5" stroke="${ROSE}" stroke-width="2" stroke-dasharray="6 4"/>${T(0, 4, "burst", { s: 10, c: ROSE, w: 700 })}` : `<path d="${a.state === "shrunken" ? crenated(r * 0.95) : `M${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`}" fill="#fbe3e3" stroke="${ROSE}" stroke-width="2" stroke-linejoin="round"/>${inner}`}</g>`; };
    return { plant, animal, p, a };
  }
  const osmosisCells = () => {
    // Middle column: each cell in a solution with the SAME water potential as itself (plant at zero turgor: -1000 kPa; animal: -800 kPa)
    const cols = [[-0, "Pure water (Ψ = 0)", 0], [-1000, "Solution isotonic with the cell", -800], [-1800, "Concentrated (Ψ = −1800 kPa)", -1800]];
    let s = `<svg viewBox="0 0 900 330" width="900" role="img" aria-label="plant and animal cells in water, an isotonic solution and a concentrated solution">${T(60, 120, "Plant cell", { s: 12, w: 700, a: "start" })}${T(60, 250, "Animal cell", { s: 12, w: 700, a: "start" })}`;
    cols.forEach(([psi, title, psiA], i) => { const x = 250 + i * 270; const cp = cellPair({ psiExt: psi }); const ca = cellPair({ psiExt: psiA }); cp.animal = ca.animal; cp.a = ca.a; s += T(x, 24, title, { s: 12, w: 700 }) + T(x, 40, i === 0 ? "net water entry" : i === 1 ? "no net movement" : "net water loss", { s: 10.5, c: GREY }); s += `<g transform="translate(0,115)">${cp.plant(x)}</g><g transform="translate(0,250)">${cp.animal(x)}</g>`; s += T(x, 175, cp.p.state === "turgid" ? (i === 0 ? "turgid (wall resists)" : "turgid") : cp.p.state === "flaccid" ? "flaccid (incipient plasmolysis)" : cp.p.state, { s: 11, c: TEAL, w: 600 }) + T(x, 305, cp.a.state === "lysed" ? "bursts (lysis)" : cp.a.state === "normal" ? "unchanged" : cp.a.state === "shrunken" ? "shrinks (crenated)" : cp.a.state, { s: 11, c: ROSE, w: 600 }); });
    return s + T(450, 325, "Schematic. Model cells: plant Ψs = −1000 kPa with a wall; animal Ψs = −800 kPa, no wall. Real cells vary.", { s: 10, c: GREY }) + "</svg>";
  };
  // Water potential scale
  const psiScale = () => { const W = 760; let s = `<svg viewBox="0 0 ${W} 150" width="${W}" role="img" aria-label="water potential scale from zero for pure water to increasingly negative values for stronger solutions">`; s += `<defs><linearGradient id="psig" x1="0" x2="1"><stop offset="0" stop-color="#d6efec"/><stop offset="1" stop-color="#f3d6d5"/></linearGradient></defs><rect x="60" y="60" width="640" height="26" rx="13" fill="url(#psig)" stroke="${GREY}"/>`; [[60, "0 kPa", "pure water"], [220, "−500", "0.2 mol dm⁻³ sucrose"], [380, "−1000", "0.4 mol dm⁻³"], [540, "−1500", "0.6 mol dm⁻³"], [700, "−2000 kPa", "0.8 mol dm⁻³"]].forEach(([x, a, b]) => { s += `<line x1="${x}" y1="52" x2="${x}" y2="94" stroke="${INK}"/>` + T(x, 44, a, { s: 11, w: 700 }) + T(x, 110, b, { s: 10, c: GREY }); }); s += `<line x1="150" y1="130" x2="610" y2="130" stroke="${NAVY}" stroke-width="2" marker-end="url(#psiarrow)"/><defs><marker id="psiarrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${NAVY}"/></marker></defs>` + T(380, 146, "water moves from higher (less negative) to lower (more negative) water potential", { s: 11, c: NAVY, w: 600 }) + T(380, 22, "more solute → more negative water potential (sucrose at 20 °C; values from Ψ = −iCRT, beyond the specification)", { s: 11, c: GREY }); return s + "</svg>"; };
  // Microvilli: flat membrane v folded, with the same base width
  const microvilli = () => { let s = `<svg viewBox="0 0 760 240" width="760" role="img" aria-label="a flat membrane compared with one folded into microvilli, which has a much larger surface area">`; s += T(190, 22, "Flat cell-surface membrane", { s: 12.5, w: 700 }) + T(570, 22, "Membrane folded into microvilli", { s: 12.5, w: 700 }); s += `<path d="M60 120 h260" stroke="${TEAL}" stroke-width="5" fill="none"/><rect x="60" y="122" width="260" height="70" fill="#d6efec" opacity=".5"/>` + T(190, 165, "cytoplasm", { s: 11, c: GREY }); let path = "M440 120"; for (let k = 0; k < 10; k++) { const x = 440 + k * 26; path += ` v -70 a 8 8 0 0 1 16 0 v 70 h 10`; } s += `<path d="${path}" stroke="${TEAL}" stroke-width="4" fill="#d6efec" fill-opacity=".5"/><rect x="440" y="122" width="260" height="70" fill="#d6efec" opacity=".5"/>` + T(570, 165, "cytoplasm (microvilli are extensions of this one cell)", { s: 11, c: GREY }); s += T(190, 215, "membrane length across this width: 260 units", { s: 11, c: NAVY, w: 600 }) + T(570, 215, "membrane length: 260 + 10 × 2 × 70 ≈ 1660 units (about 6× more)", { s: 11, c: NAVY, w: 600 }) + T(380, 236, "Schematic, not to scale: real microvilli are about 1 µm long and 0.1 µm wide, increasing the absorptive area up to about 20-fold.", { s: 10, c: GREY }); return s + "</svg>"; };
  // ATP cycle
  const atpCycle = () => `<svg viewBox="0 0 700 220" width="700" role="img" aria-label="ATP is hydrolysed to ADP and phosphate releasing energy, and resynthesised by condensation using energy from respiration">
      <rect x="40" y="70" width="150" height="70" rx="16" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2"/>${T(115, 100, "ATP", { s: 18, w: 800 })}${T(115, 122, "adenosine triphosphate", { s: 10, c: GREY })}
      <rect x="510" y="70" width="150" height="70" rx="16" fill="#e4ebf5" stroke="${NAVY}" stroke-width="2"/>${T(585, 100, "ADP + Pi", { s: 18, w: 800 })}${T(585, 122, "ADP + inorganic phosphate", { s: 10, c: GREY })}
      <path d="M195 85 C 300 20, 400 20, 505 85" fill="none" stroke="${ROSE}" stroke-width="2.5" marker-end="url(#atpa)"/>${T(350, 36, "hydrolysis (ATP hydrolase): energy released for active transport, synthesis, movement", { s: 11, c: ROSE, w: 600 })}
      <path d="M505 125 C 400 190, 300 190, 195 125" fill="none" stroke="${SAGE}" stroke-width="2.5" marker-end="url(#atpb)"/>${T(350, 196, "condensation (ATP synthase): energy from respiration (or photosynthesis)", { s: 11, c: SAGE, w: 600 })}
      ${T(350, 72, "+ H₂O (water used)", { s: 10.5, c: ROSE, w: 600 })}${T(350, 156, "− H₂O (water released)", { s: 10.5, c: SAGE, w: 600 })}
      <defs><marker id="atpa" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${ROSE}"/></marker><marker id="atpb" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${SAGE}"/></marker></defs>
    </svg>`;
  // Rate graphs for the three mechanisms against external concentration
  const rateCurves = () => B.enzymeArt.graph({ xLabel: "concentration difference across the membrane / arbitrary units", yLabel: "rate of uptake / arbitrary units", xmax: 20, ymax: 110, curves: [{ pts: B.enzymeModel.range(0, 20, 40).map((x) => ({ x, y: 4.5 * x })), color: ROSE, label: "simple diffusion: proportional", labelPos: { x: 13, y: 70, a: "start" } }, { pts: B.enzymeModel.range(0, 20, 60).map((x) => ({ x, y: 100 * x / (3 + x) })), color: TEAL, label: "facilitated diffusion: carriers / channels saturate", labelPos: { x: 7, y: 93, a: "start" } }], aria: "rate of uptake against concentration difference for simple and facilitated diffusion" });
  // RP2 model graph: % change v concentration
  const rp2Curve = (psiTissue = PSI_TISSUE) => B.enzymeArt.graph({ xLabel: "sucrose concentration / mol dm⁻³", yLabel: "percentage change in mass / %", xmin: 0, xmax: 1, ymax: 50, xticks: 5, yticks: 5, curves: [{ pts: B.enzymeModel.range(0, 1, 50).map((x) => ({ x, y: massChangePct(x, { psiTissue }) + 25 })), color: TEAL }], hlines: [{ y: 25, label: "0 % change", la: "start" }], marks: [{ x: isotonicC(psiTissue), y: 25, label: "isotonic point: Ψ solution = Ψ tissue", dx: 8, dy: 16 }], aria: "percentage change in mass against sucrose concentration, crossing zero at the isotonic concentration", hideY: true, extra: ({ X, Y, padL }) => [50, 25, 0].map((v, i) => T(padL - 8, Y([50, 25, 0][i]) + 4, ["+25", "0", "−25"][i], { a: "end", s: 10, c: GREY })).join("") });


  // Co-transport of glucose in the ileum: one epithelial cell between lumen (left) and capillary (right).
  const cotransport = () => {
    const arrow = (x1, y1, x2, y2, col, w = 2.5) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="${w}" fill="none" marker-end="url(#ct-${col.slice(1)})"/>`;
    const defs = [TEAL, NAVY, AMBER, ROSE, SAGE].map((c) => `<marker id="ct-${c.slice(1)}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${c}"/></marker>`).join("");
    let s = `<svg viewBox="0 0 760 330" width="760" role="img" aria-label="co-transport of glucose and sodium ions across an ileum epithelial cell"><defs>${defs}</defs>`;
    s += `<rect x="0" y="40" width="200" height="250" fill="#fdf3e3"/><rect x="560" y="40" width="200" height="250" fill="#f7e1e1"/>`;
    s += T(100, 28, "lumen of ileum", { s: 12.5, w: 700 }) + T(660, 28, "blood (capillary)", { s: 12.5, w: 700 }) + T(380, 28, "epithelial cell", { s: 12.5, w: 700 });
    // cell body with microvilli on the lumen side
    let mv = "M200 70"; for (let k = 0; k < 7; k++) mv += ` h -22 a 7 7 0 0 0 0 14 h 22 v 14`; s += `<rect x="200" y="56" width="360" height="234" fill="#e9f5f2" stroke="${TEAL}" stroke-width="3"/><path d="${mv}" fill="#e9f5f2" stroke="${TEAL}" stroke-width="3"/>`;
    s += T(236, 84, "microvilli", { s: 10, c: GREY, a: "start" });
    // mitochondria
    [[300, 110], [430, 95], [340, 276]].forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y}" rx="22" ry="11" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.5"/><path d="M${x - 14} ${y} q4 -6 8 0 t8 0 t8 0" fill="none" stroke="${AMBER}" stroke-width="1.2"/>`; });
    s += T(300, 132, "mitochondrion → ATP", { s: 9.5, c: GREY });
    // co-transporter on lumen side
    s += `<rect x="186" y="150" width="30" height="60" rx="10" fill="#fff" stroke="${NAVY}" stroke-width="2"/>` + T(201, 184, "co-", { s: 9, c: NAVY }) + T(201, 195, "trans", { s: 8, c: NAVY });
    s += arrow(120, 165, 184, 165, NAVY) + T(120, 155, "Na⁺ (high)", { s: 11, c: NAVY, w: 600 }) + arrow(220, 165, 290, 165, NAVY) + T(260, 155, "Na⁺ in, down gradient", { s: 9.5, c: NAVY });
    s += arrow(120, 196, 184, 196, AMBER) + T(120, 212, "glucose", { s: 11, c: AMBER, w: 600 }) + arrow(220, 196, 290, 196, AMBER) + T(265, 212, "glucose in, against gradient", { s: 9.5, c: AMBER });
    s += T(290, 236, "Na⁺ kept LOW inside the cell", { s: 10.5, c: NAVY, w: 700 }) + T(290, 250, "(so Na⁺ keeps diffusing in from the lumen)", { s: 9.5, c: GREY });
    // Na/K pump on blood side
    s += `<rect x="544" y="110" width="30" height="64" rx="10" fill="#fff" stroke="${ROSE}" stroke-width="2"/>` + T(559, 140, "Na⁺/K⁺", { s: 7.5, c: ROSE }) + T(559, 152, "pump", { s: 8, c: ROSE });
    s += arrow(470, 128, 542, 128, NAVY) + T(470, 118, "3 Na⁺ OUT (active)", { s: 9.5, c: NAVY }) + arrow(578, 128, 640, 128, NAVY);
    s += arrow(600, 160, 578, 160, SAGE) + arrow(540, 160, 480, 160, SAGE) + T(480, 174, "2 K⁺ in", { s: 9.5, c: SAGE });
    s += T(515, 195, "ATP → ADP + Pi", { s: 10.5, c: ROSE, w: 700 });
    // glucose carrier on blood side
    s += `<rect x="544" y="214" width="30" height="54" rx="10" fill="#fff" stroke="${AMBER}" stroke-width="2"/>` + T(559, 246, "carrier", { s: 8, c: AMBER });
    s += arrow(470, 240, 542, 240, AMBER) + arrow(578, 240, 650, 240, AMBER) + T(660, 262, "glucose out by", { s: 10, c: AMBER }) + T(660, 275, "facilitated diffusion", { s: 10, c: AMBER }) + T(470, 262, "glucose (high)", { s: 9.5, c: GREY });
    s += T(380, 312, "1 pump keeps Na⁺ low (ATP)   2 Na⁺ enters down its gradient and carries glucose in (co-transport)   3 glucose leaves to the blood passively", { s: 10.5, c: GREY });
    return s + "</svg>";
  };


  // Four stages of an active-transport carrier (pump), left to right. Each stage is a short piece of membrane with the
  // carrier drawn open to one side; the transported molecule (amber) starts on the low-concentration side (top).
  const carrierCycle = () => {
    const stage = (x, title, lines, openTop, mol, atp) => {
      const y = 150; let g = `<g transform="translate(${x},0)">` + T(90, 30, title, { s: 12, w: 700 });
      g += bilayer(10, 170, y, [4, 5, 6, 7], 14);
      g += `<path d="M66 ${y - 48} h48 v96 h-48z" fill="#fff" stroke="none"/>`;
      const poly = openTop ? `M62 ${y - 48} L84 ${y + 48} L96 ${y + 48} L118 ${y - 48}z` : `M84 ${y - 48} L62 ${y + 48} L118 ${y + 48} L96 ${y - 48}z`;
      g += `<path d="${poly}" fill="#e4ebf5" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>`;
      if (mol) g += `<circle cx="90" cy="${mol}" r="7" fill="${AMBER}" stroke="#9a6f1e"/>`;
      if (atp) g += `<circle cx="134" cy="${y + 30}" r="12" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.5"/>` + T(134, y + 34, atp, { s: 8, w: 700, c: "#9a6f1e" });
      g += lines.map((l, i) => T(90, 246 + i * 13, l, { s: 10, c: GREY })).join("") + "</g>";
      return g;
    };
    let s = `<svg viewBox="0 0 760 280" width="760" role="img" aria-label="four stages of an active-transport carrier protein">`;
    s += T(380, 90, "low concentration (outside)", { s: 10.5, c: GREY }) + T(380, 224, "high concentration (inside)", { s: 10.5, c: GREY });
    s += stage(10, "1 Bind", ["molecule binds to the", "receptor site on the carrier"], true, 118, null);
    s += stage(200, "2 ATP hydrolysed", ["ATP → ADP + Pi;", "phosphate attaches to carrier"], true, 140, "ATP");
    s += stage(390, "3 Shape change", ["carrier opens to the", "other side"], false, 168, "Pi");
    // Stage 4 shows the end of the cycle: the molecule has been released inside and, with Pi gone, the carrier is open to the outside again.
    s += stage(580, "4 Release and reset", ["molecule released against its", "gradient; Pi leaves, carrier resets"], true, 214, null);
    [185, 375, 565].forEach((x) => { s += `<path d="M${x - 8} 150 l16 0" stroke="${GREY}" stroke-width="2" marker-end="url(#cc-arrow)"/>`; });
    return s + `<defs><marker id="cc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${GREY}"/></marker></defs></svg>`;
  };

  B.transportArt = { lipid, bilayer, cholesterol, sugar, proteinBlob, fluidMosaic, transportTypes, osmosisCells, cellPair, psiScale, microvilli, atpCycle, rateCurves, rp2Curve, cotransport, carrierCycle, colours: { INK, GREY, TEAL, SAGE, NAVY, AMBER, ROSE, MINT }, T };
})(window.BIO);
