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
    // States (revised QG2): turgid while Ψp > 300 kPa; "partly turgid (low turgor)" for 50 < Ψp ≤ 300 kPa; flaccid only
    // when Ψp is within 50 kPa of zero (the same ±50 kPa band the osmosis-sim prediction feedback uses).
    if (psiExt >= -1000) { const psiP = psiExt + 1000; return { state: psiExt > -700 ? "turgid" : psiP > 50 ? "partly turgid (low turgor)" : "flaccid", psiP, vol: 1 + 0.05 * psiP / 1000, label: psiExt > -700 ? "Partly turgid: the wall resists expansion; a little net water uptake." : psiP > 50 ? "Low turgor: the pressure potential is small but not yet zero, so the protoplast still presses lightly on the wall; the cell is softening towards flaccidity." : psiExt === -1000 ? "Incipient plasmolysis: the solution has the same water potential as the cell, pressure potential is zero and the cell is flaccid." : "Approaching incipient plasmolysis: pressure potential near zero; the cell is flaccid." }; }
    // Incipient plasmolysis band (QG2 R10): within 50 kPa below the cell (the same band the osmosis-sim prediction
    // feedback treats as "little or no net movement") the protoplast still just touches the wall; only below
    // -1050 kPa is the cell drawn as plasmolysed, and the shrinkage is scaled to the deficit (see cellPair).
    if (psiExt >= -1050) return { state: "incipient plasmolysis", psiP: 0, vol: 1000 / -psiExt, label: "Incipient plasmolysis: the solution's water potential is only slightly lower than the cell's, so very little net water leaves; pressure potential falls to zero and the protoplast is only just beginning to pull away from the wall." };
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
    s += T(380, 16, "outside the cell", { s: 13, c: GREY }) + T(200, 296, "inside the cell (cytoplasm)", { s: 13, c: GREY });
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
      const lab = (x, yy, t, tx, ty, part, dot = false, a = null) => `<g data-label="${part}"><line x1="${x}" y1="${yy}" x2="${tx}" y2="${ty}" stroke="${GREY}" stroke-width="1"/>${dot ? `<circle cx="${x}" cy="${yy}" r="2.6" fill="${INK}"/>` : ""}${T(tx, ty + (ty < yy ? -4 : 13), t, { s: 13, w: 600, a: a || (tx < x ? "end" : "start") })}</g>`;
      // release review 2026-11-15: 13 px labels in three rows above the membrane and one below, none cut off or overlapping
      // Head and tails leaders are offset (QG2): the head leader ends on an outer-layer head (x = 31), the tails leader
      // in the tail region of a different lipid (x = 73), each with a dot, so they no longer read as one line.
      s += lab(31, y - 36, "hydrophilic head", 31, y - 118, "bilayer", true, "start") + lab(73, y - 16, "hydrophobic fatty-acid tails", 73, y + 92, "bilayer", true, "start");
      s += lab(170, y - 48, "channel protein (intrinsic)", 92, y - 92, "channel", false, "start") + lab(352, y - 48, "carrier protein (intrinsic)", 374, y - 118, "carrier", false, "start");
      s += lab(500, y - 60, "glycoprotein (intrinsic)", 540, y - 96, "glycoprotein", false, "start") + lab(640, y + 72, "extrinsic protein", 600, y + 104, "extrinsic");
      s += lab(264, y - 70, "glycolipid", 284, y - 92, "glycolipid", false, "start") + lab(426, y - 20, "cholesterol", 410, y + 92, "cholesterol", false, "end");
      s += T(width - 10, 292, "about 7 nm thick; not to scale", { s: 12, c: GREY, a: "end" });
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
    // Not plasmolysed: the protoplast is in contact with the wall. With turgor (Ψp > 0) the wall is pushed slightly
    // outwards in proportion to Ψp, the vacuole is larger and (Ψp ≥ 300 kPa) outward pressure arrows are drawn; a
    // flaccid cell (Ψp ≈ 0) just touches an unstretched wall. Plasmolysed: the protoplast pulls away from the wall, by an
    // amount scaled to the water potential deficit (linear in relative volume: no gap at vol 1, 0.45 x the wall at vol 0.55).
    // lab (release review 2026-11-15): when true, leader-lined labels for the cell wall, cell membrane and vacuole are
    // drawn to the right of the cell (the caller widens its viewBox to make room).
    const plant = (x, lab = false) => { const v = p.vol; const rw = 110, rh = 70; const plas = p.state === "plasmolysed"; const g = plas ? 0 : 5 * Math.min(1, p.psiP / 1000); const W = rw + 2 * g, H = rh + 2 * g; const sh = 1 - (1 - Math.min(1, v)) * 1.22, pw = plas ? rw * sh : W + 8, ph = plas ? rh * sh : H + 8; const vac = plas ? 0.3 : 0.3 + 0.1 * Math.min(1, p.psiP / 1000); const arrows = !plas && p.psiP >= 300 ? [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => { const ax = dx * (pw / 2 - 4), ay = dy * (ph / 2 - 4), bx = ax - dx * 12, by = ay - dy * 12, px = dy, py = dx; return `<path d="M${bx} ${by} L${ax} ${ay} M${ax - dx * 5 + px * 3.5} ${ay - dy * 5 + py * 3.5} L${ax} ${ay} L${ax - dx * 5 - px * 3.5} ${ay - dy * 5 - py * 3.5}" stroke="${NAVY}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }).join("") : ""; return `<g transform="translate(${x},0)"><rect x="${-W / 2 - 6}" y="${-H / 2 - 6}" width="${W + 12}" height="${H + 12}" rx="${14 + g}" fill="#efe6d2" stroke="#9c7b3a" stroke-width="3"/>${plas ? `<rect x="${-rw / 2}" y="${-rh / 2}" width="${rw}" height="${rh}" rx="10" fill="#e7f1ff" stroke="none"/>` : ""}<rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" rx="${plas ? 22 : 11 + g}" fill="#d6efec" stroke="${TEAL}" stroke-width="2"/><ellipse cx="0" cy="0" rx="${pw * vac}" ry="${ph * vac}" fill="#bfe0f5" stroke="#5a7d96"/><circle cx="${pw * (plas ? 0.39 : 0.38)}" cy="${plas ? 0 : -ph * 0.32}" r="${plas ? 5 : 7}" fill="#e4ebf5" stroke="${NAVY}"/>${arrows}${lab ? [[W / 2 + 4, -H / 2 + 8, -46, "cell wall"], [pw * (plas ? 0.39 : 0.38) + 5, plas ? -4 : -ph * 0.32, -26, "nucleus"], [pw / 2 - 1, plas ? 6 : 10, -4, "cell membrane"], [pw * vac * 0.55, ph * vac * 0.4, 32, "vacuole"]].map(([px, py, ty, t]) => `<line x1="${px}" y1="${py}" x2="${W / 2 + 22}" y2="${ty}" stroke="${GREY}" stroke-width="0.8"/><circle cx="${px}" cy="${py}" r="1.6" fill="${INK}"/>${T(W / 2 + 25, ty + 4, t, { s: 10, w: 600, a: "start" })}`).join("") : ""}</g>`; };
    // Crenated outline: a shrunken disc with a regular scalloped (spiky) edge, centred on the origin.
    const crenated = (r) => { let d = ""; for (let k = 0; k <= 72; k++) { const th = (2 * Math.PI * k) / 72, rr = r * (1 + 0.13 * Math.cos(11 * th)); d += `${k ? "L" : "M"}${(rr * Math.cos(th)).toFixed(1)} ${(rr * Math.sin(th)).toFixed(1)} `; } return d + "Z"; };
    const animal = (x) => { const r = 32 * Math.sqrt(a.vol); const inner = nucleus ? `<circle cx="0" cy="0" r="${r * 0.28}" fill="#e4ebf5" stroke="${NAVY}"/>` : a.state === "normal" ? `<circle cx="0" cy="0" r="${r * 0.42}" fill="#fdf2f2" stroke="none"/>` : ""; return `<g transform="translate(${x},0)">${a.state === "lysed" ? `<path d="M${-r} 0 q ${r * 0.3} ${-r * 1.2} ${r} ${-r * 0.2} q ${r * 0.5} ${r * 0.6} ${r * 0.2} ${r} q ${-r * 0.8} ${r * 0.3} ${-r * 1.4} ${-r * 0.2} z" fill="#f3d6d5" stroke="${ROSE}" stroke-width="2" stroke-dasharray="6 4"/>` : `<path d="${a.state === "shrunken" ? crenated(r * 0.95) : `M${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`}" fill="#fbe3e3" stroke="${ROSE}" stroke-width="2" stroke-linejoin="round"/>${inner}`}</g>`; };
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
  // Water potential scale (release review 2026-11-15): no concentration values (they came from Ψ = −iCRT, which is beyond
  // the specification and does not match measured sucrose tables); just 0 kPa for pure water and more negative values as
  // the concentration rises, with the direction of water movement. Text 12 to 13 px.
  const psiScale = () => { const W = 760; let s = `<svg viewBox="0 0 ${W} 150" width="${W}" role="img" aria-label="water potential scale from zero for pure water to increasingly negative values for more concentrated solutions"><defs><linearGradient id="psig" x1="0" x2="1"><stop offset="0" stop-color="#d6efec"/><stop offset="1" stop-color="#f3d6d5"/></linearGradient><marker id="psiarrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${NAVY}"/></marker></defs>`;
    s += `<rect x="60" y="54" width="640" height="26" rx="13" fill="url(#psig)" stroke="${GREY}"/><line x1="60" y1="46" x2="60" y2="88" stroke="${INK}" stroke-width="2"/>` + T(60, 38, "0 kPa", { s: 13, w: 700 }) + T(60, 106, "pure water", { s: 12.5, c: GREY }) + T(700, 38, "more negative", { s: 13, w: 700, a: "end" }) + T(700, 106, "more concentrated solutions", { s: 12.5, c: GREY, a: "end" });
    s += `<line x1="150" y1="126" x2="610" y2="126" stroke="${NAVY}" stroke-width="2" marker-end="url(#psiarrow)"/>` + T(380, 146, "water moves from higher (less negative) to lower (more negative) water potential", { s: 12.5, c: NAVY, w: 600 });
    return s + "</svg>"; };
  // Microvilli: flat membrane v folded, with the same base width
  // Microvilli (release review 2026-11-15): the microvilli are filled with the same cytoplasm as the cell body (they are
  // extensions of one cell), the developer-style length formula is gone, and text is 12 to 13 px.
  const microvilli = () => { let s = `<svg viewBox="0 0 760 236" width="760" role="img" aria-label="a flat membrane compared with one folded into microvilli, which has a much larger surface area">`; s += T(190, 22, "Flat cell-surface membrane", { s: 13.5, w: 700 }) + T(570, 22, "Membrane folded into microvilli", { s: 13.5, w: 700 });
    s += `<rect x="60" y="120" width="260" height="72" fill="#e3f2ef"/><path d="M60 120 h260" stroke="${TEAL}" stroke-width="5" fill="none"/>` + T(190, 165, "cytoplasm", { s: 12.5, c: GREY });
    let path = "M440 192 V120"; for (let k = 0; k < 10; k++) path += ` v -70 a 8 8 0 0 1 16 0 v 70 h 10`; path += " V192 Z";
    s += `<path d="${path}" fill="#e3f2ef" stroke="none"/>`; let edge = "M440 120"; for (let k = 0; k < 10; k++) edge += ` v -70 a 8 8 0 0 1 16 0 v 70 h 10`; s += `<path d="${edge}" stroke="${TEAL}" stroke-width="4" fill="none"/>`;
    s += T(570, 160, "cytoplasm of the same cell, which", { s: 12.5, c: GREY }) + T(570, 176, "also fills each microvillus", { s: 12.5, c: GREY });
    s += T(190, 216, "membrane: the width of the cell", { s: 12.5, c: NAVY, w: 600 }) + T(570, 216, "the same width holds several times as much membrane", { s: 12.5, c: NAVY, w: 600 });
    return s + "</svg>"; };
  // ATP cycle
  const atpCycle = () => `<svg viewBox="0 0 700 220" width="700" role="img" aria-label="ATP is hydrolysed to ADP and phosphate releasing energy, and resynthesised by condensation using energy from respiration">
      <rect x="40" y="70" width="150" height="70" rx="16" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2"/>${T(115, 100, "ATP", { s: 18, w: 800 })}${T(115, 122, "adenosine triphosphate", { s: 12, c: GREY })}
      <rect x="510" y="70" width="150" height="70" rx="16" fill="#e4ebf5" stroke="${NAVY}" stroke-width="2"/>${T(585, 100, "ADP + Pi", { s: 18, w: 800 })}${T(585, 122, "ADP + phosphate (Pi)", { s: 12, c: GREY })}
      <path d="M195 85 C 300 20, 400 20, 505 85" fill="none" stroke="${ROSE}" stroke-width="2.5" marker-end="url(#atpa)"/>${T(350, 36, "hydrolysis (ATP hydrolase): energy released for active transport, synthesis, movement", { s: 12.5, c: ROSE, w: 600 })}
      <path d="M505 125 C 400 190, 300 190, 195 125" fill="none" stroke="${SAGE}" stroke-width="2.5" marker-end="url(#atpb)"/>${T(350, 196, "condensation (ATP synthase): energy from respiration (or photosynthesis)", { s: 12.5, c: SAGE, w: 600 })}
      ${T(350, 72, "+ H₂O (water used)", { s: 12, c: ROSE, w: 600 })}${T(350, 156, "− H₂O (water released)", { s: 12, c: SAGE, w: 600 })}
      <defs><marker id="atpa" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${ROSE}"/></marker><marker id="atpb" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${SAGE}"/></marker></defs>
    </svg>`;
  // Rate graphs for the three mechanisms against external concentration
  const rateCurves = () => B.enzymeArt.graph({ fs: 12, fixed: true, width: 560, height: 330, xLabel: "concentration difference / arbitrary units", yLabel: "rate of uptake / arbitrary units", xmax: 20, ymax: 100, yticks: 4, curves: [{ pts: B.enzymeModel.range(0, 20, 40).filter((x) => 4.5 * x <= 100).map((x) => ({ x, y: 4.5 * x })), color: ROSE, label: "simple diffusion: proportional", labelPos: { x: 12.2, y: 40, a: "start" } }, { pts: B.enzymeModel.range(0, 20, 60).map((x) => ({ x, y: 100 * x / (3 + x) })), color: TEAL, label: "facilitated diffusion: levels off", labelPos: { x: 9, y: 93, a: "start" } }], aria: "rate of uptake against concentration difference for simple and facilitated diffusion" });
  // RP2 model graph: % change v concentration
  const rp2Curve = (psiTissue = PSI_TISSUE) => B.enzymeArt.graph({ xLabel: "sucrose concentration / mol dm⁻³", yLabel: "percentage change in mass / %", xmin: 0, xmax: 1, ymax: 50, xticks: 5, yticks: 5, curves: [{ pts: B.enzymeModel.range(0, 1, 50).map((x) => ({ x, y: massChangePct(x, { psiTissue }) + 25 })), color: TEAL }], hlines: [{ y: 25, label: "0 % change", la: "start" }], marks: [{ x: isotonicC(psiTissue), y: 25, label: "isotonic point: Ψ solution = Ψ tissue", dx: 8, dy: 16 }], aria: "percentage change in mass against sucrose concentration, crossing zero at the isotonic concentration", hideY: true, extra: ({ X, Y, padL }) => [50, 25, 0].map((v, i) => T(padL - 8, Y([50, 25, 0][i]) + 4, ["+25", "0", "−25"][i], { a: "end", s: 10, c: GREY })).join("") });


  // Co-transport of glucose in the ileum: one epithelial cell between lumen (left) and capillary (right).
  // Release review 2026-11-15: redrawn wider; every protein is named outside the cell with a leader line, arrows are
  // labelled at their tails, the numbered steps are in the caption (not crammed into the drawing), text 12 to 13 px.
  const cotransport = () => {
    const arrow = (x1, y1, x2, y2, col, w = 2.5) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="${w}" fill="none" marker-end="url(#ct-${col.slice(1)})"/>`;
    const lead = (x, y, tx, ty) => `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="${GREY}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="2.4" fill="${INK}"/>`;
    const defs = [TEAL, NAVY, AMBER, ROSE, SAGE].map((c) => `<marker id="ct-${c.slice(1)}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${c}"/></marker>`).join("");
    let s = `<svg viewBox="0 0 860 360" width="860" role="img" aria-label="co-transport of glucose and sodium ions across an ileum epithelial cell"><defs>${defs}</defs>`;
    s += `<rect x="0" y="46" width="230" height="290" fill="#fdf3e3"/><rect x="590" y="46" width="270" height="290" fill="#f7e1e1"/>`;
    s += T(115, 30, "lumen of ileum", { s: 14, w: 700 }) + T(410, 30, "epithelial cell", { s: 14, w: 700 }) + T(725, 30, "blood in capillary", { s: 14, w: 700 });
    let mv = ""; [66, 94, 122, 250, 278].forEach((y0) => { mv += `M230 ${y0} h -20 a 7 7 0 0 0 0 14 h 20 `; }); /* microvilli above and below the co-transporter */ s += `<rect x="230" y="56" width="360" height="270" fill="#e9f5f2" stroke="${TEAL}" stroke-width="3"/><path d="${mv}" fill="#e9f5f2" stroke="${TEAL}" stroke-width="3"/>`;
    s += lead(212, 80, 150, 70) + T(146, 74, "microvilli", { s: 12.5, w: 600, a: "end" });
    // co-transporter (lumen side)
    s += `<rect x="214" y="168" width="32" height="72" rx="10" fill="#fff" stroke="${NAVY}" stroke-width="2.5"/>` + lead(230, 236, 150, 300) + T(146, 296, "Na⁺–glucose", { s: 12.5, w: 700, a: "end", c: NAVY }) + T(146, 312, "co-transporter", { s: 12.5, w: 700, a: "end", c: NAVY });
    s += arrow(60, 186, 210, 186, NAVY) + T(60, 178, "Na⁺ (high)", { s: 12.5, w: 700, a: "start", c: NAVY }) + arrow(250, 186, 330, 186, NAVY) + T(256, 178, "Na⁺ in, down its gradient", { s: 12, a: "start", c: NAVY });
    s += arrow(60, 222, 210, 222, AMBER) + T(60, 240, "glucose", { s: 12.5, w: 700, a: "start", c: "#9a6f1e" }) + arrow(250, 222, 330, 222, AMBER) + T(256, 240, "glucose in, against its gradient", { s: 12, a: "start", c: "#9a6f1e" });
    s += T(410, 286, "Na⁺ concentration kept low inside the cell", { s: 12.5, w: 700, c: NAVY }) + T(410, 303, "glucose concentration builds up inside", { s: 12.5, w: 700, c: "#9a6f1e" });
    // mitochondrion near the pump
    s += `<ellipse cx="470" cy="80" rx="24" ry="11" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.5"/><path d="M455 80 q4 -6 8 0 t8 0 t8 0" fill="none" stroke="${AMBER}" stroke-width="1.2"/>` + lead(446, 80, 400, 80) + T(396, 84, "mitochondrion: ATP", { s: 12, a: "end", c: GREY });
    // Na+/K+ pump (blood side)
    s += `<rect x="574" y="104" width="32" height="70" rx="10" fill="#fff" stroke="${ROSE}" stroke-width="2.5"/>` + lead(606, 112, 650, 70) + T(654, 66, "Na⁺/K⁺ pump", { s: 12.5, w: 700, a: "start", c: ROSE }) + T(654, 82, "(active, uses ATP)", { s: 12, a: "start", c: ROSE });
    s += arrow(500, 122, 570, 122, NAVY) + arrow(610, 122, 690, 122, NAVY) + T(696, 126, "3 Na⁺ out", { s: 12.5, w: 700, a: "start", c: NAVY });
    s += arrow(690, 156, 610, 156, SAGE) + arrow(570, 156, 500, 156, SAGE) + T(494, 160, "2 K⁺ in", { s: 12.5, w: 700, a: "end", c: "#4f7a61" });
    s += T(530, 194, "ATP → ADP + Pi", { s: 12.5, w: 700, c: ROSE });
    // glucose carrier (blood side)
    s += `<rect x="574" y="228" width="32" height="56" rx="10" fill="#fff" stroke="${AMBER}" stroke-width="2.5"/>` + lead(606, 278, 650, 306) + T(654, 304, "glucose carrier protein", { s: 12.5, w: 700, a: "start", c: "#9a6f1e" });
    s += arrow(500, 256, 570, 256, AMBER) + arrow(610, 256, 720, 256, AMBER) + T(616, 246, "glucose out by facilitated", { s: 12, a: "start", c: "#9a6f1e" }) + T(616, 274, "diffusion, down its gradient", { s: 12, a: "start", c: "#9a6f1e" });
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
