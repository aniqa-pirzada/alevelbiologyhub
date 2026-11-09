// Authored content for 3.1.1.4 Proteins. Spec statements s1–s7 (see data/spec.js).
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const INK = "#16263a", TEAL = "#166f70", AMB = "#c8902a", AMBD = "#8a5f12", GREY = "#6b7d8f", NAVY = "#1e3a5f", SAGE = "#6b9a7f", ROSE = "#c25f5f";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 13}" font-weight="${o.w || 700}" fill="${o.c || INK}">${s}</text>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 2}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}/>`;
  const dbl = (x1, y1, x2, y2) => { const dx = (y2 - y1) ? 3 : 0, dy = (x2 - x1) ? 3 : 0; return L(x1 - dx, y1 - dy, x2 - dx, y2 - dy) + L(x1 + dx, y1 + dy, x2 + dx, y2 + dy); };
  const cap = (x, y, s, a = "middle") => T(x, y, s, { s: 11, w: 500, c: GREY, a });
  const atom = (x, y, s, o = {}) => `<circle cx="${x}" cy="${y - 4}" r="${o.r || 9}" fill="#fff"/>` + T(x, y, s, o);

  // Displayed amino acid centred on the alpha carbon at (x,y). Options: R label, highlight groups, omit left H of amino (for bonded N), omit OH (for bonded C)
  const aminoAcidAt = (x, y, o = {}) => {
    const R = o.R || "R"; let s = "";
    // alpha carbon
    s += atom(x, y, "C") + L(x, y - 14, x, y - 32) + T(x, y - 38, "H") + L(x, y + 4, x, y + 22) + T(x, y + 38, R, { c: SAGE });
    // amino group to the left: H2N–C  (or –N(H)– when bonded)
    s += L(x - 10, y - 4, x - 28, y - 4);
    // bondedN: –N(H)– in a chain; splitNH: free amino group drawn as H–N(H)– so that one H can be marked as leaving
    if (o.bondedN) { s += atom(x - 40, y, "N") + L(x - 40, y + 4, x - 40, y + 20) + T(x - 40, y + 34, "H"); }
    else if (o.splitNH) { s += T(x - 72, y, "H") + L(x - 64, y - 4, x - 50, y - 4) + atom(x - 40, y, "N") + L(x - 40, y + 4, x - 40, y + 20) + T(x - 40, y + 34, "H"); }
    else { s += T(x - 50, y, "H₂N"); }
    // carboxyl to the right: C(=O)–OH
    s += L(x + 10, y - 4, x + 28, y - 4) + atom(x + 40, y, "C") + dbl(x + 40, y - 14, x + 40, y - 30) + T(x + 40, y - 36, "O");
    // bondedC: the C–N peptide bond runs continuously to the N of the next residue (residues are drawn 140 apart, N at x + 100)
    if (o.bondedC) { s += L(x + 50, y - 4, x + 91, y - 4); } else { s += L(x + 50, y - 4, x + 66, y - 4) + T(x + 84, y, "OH"); }
    return s;
  };

  const dAminoAcid = `<svg viewBox="0 0 760 240" width="760" role="img" aria-label="general structure of an amino acid">
    ${aminoAcidAt(200, 110)}
    <rect x="130" y="86" width="56" height="34" rx="8" fill="none" stroke="${TEAL}" stroke-width="2" stroke-dasharray="5 3"/>${T(110, 150, "amino group", { s: 11, w: 600, c: TEAL })}${T(110, 164, "(–NH₂)", { s: 11, w: 600, c: TEAL })}
    <rect x="222" y="60" width="86" height="62" rx="8" fill="none" stroke="${AMB}" stroke-width="2" stroke-dasharray="5 3"/>${T(300, 150, "carboxyl group", { s: 11, w: 600, c: AMBD })}${T(300, 164, "(–COOH)", { s: 11, w: 600, c: AMBD })}
    ${T(200, 44, "hydrogen atom", { s: 11, w: 600, c: GREY })}
    ${T(200, 178, "variable R group", { s: 11, w: 600, c: SAGE })}${T(200, 192, "(side chain)", { s: 11, w: 600, c: SAGE })}
    ${T(200, 215, "central (α) carbon", { s: 11, w: 600, c: GREY })}
    ${T(420, 60, "All 20 amino acids share this structure.", { s: 13, a: "start", w: 600 })}
    ${cap(420, 84, "They differ only in the R group:", "start")}
    ${cap(420, 102, "glycine R = H; alanine R = CH₃; cysteine R = CH₂SH (can form", "start")}
    ${cap(420, 120, "disulfide bridges); some R groups are charged, some polar,", "start")}
    ${cap(420, 138, "some hydrophobic. The R group decides how the chain folds.", "start")}
    ${cap(420, 166, "General formula: NH₂–CHR–COOH", "start")}
  </svg>`;

  const dPeptideFormation = (() => {
    let s = T(150, 26, "amino acid 1", { s: 12, w: 600, c: GREY }) + T(400, 26, "amino acid 2", { s: 12, w: 600, c: GREY });
    s += aminoAcidAt(120, 90, { R: "R₁" }) + aminoAcidAt(390, 90, { R: "R₂", splitNH: true });
    // highlight OH of 1 and ONE H of the amino group of 2 (the other H stays on the N)
    s += `<rect x="186" y="70" width="36" height="28" rx="6" fill="none" stroke="${NAVY}" stroke-width="2" stroke-dasharray="4 3"/>` + `<rect x="306" y="72" width="24" height="26" rx="6" fill="none" stroke="${NAVY}" stroke-width="2" stroke-dasharray="4 3"/>`;
    s += T(380, 150, "condensation: the boxed OH (carboxyl group of 1) and H (amino group of 2) leave as water", { s: 11, w: 500, c: NAVY });
    s += `<path d="M380 165 l0 18" stroke="${INK}" stroke-width="2.5" marker-end="url(#arrp)"/>`;
    // dipeptide
    const y = 232; s += aminoAcidAt(150, y, { R: "R₁", bondedC: true }) + aminoAcidAt(290, y, { R: "R₂", bondedN: true });
    s += `<rect x="176" y="${y - 44}" width="88" height="62" rx="8" fill="none" stroke="${AMB}" stroke-width="2"/>` + T(220, y + 60, "peptide bond", { s: 12, w: 700, c: AMBD }) + T(220, y + 74, "–C(=O)–N(H)–", { s: 11, w: 600, c: AMBD });
    s += `<circle cx="560" cy="${y - 4}" r="16" fill="#e4ebf5" stroke="${NAVY}" stroke-width="2"/>` + T(560, y, "H₂O", { s: 12, c: NAVY }) + T(530, y - 4, "+", { s: 16 });
    s += T(420, y + 60, "dipeptide", { s: 12, w: 600, c: GREY });
    return `<svg viewBox="0 0 760 320" width="760" role="img" aria-label="formation of a peptide bond"><defs><marker id="arrp" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${INK}"/></marker></defs>${s}</svg>`;
  })();

  const dDipeptide = (() => {
    const y = 110; let s = aminoAcidAt(170, y, { R: "R₁", bondedC: true }) + aminoAcidAt(310, y, { R: "R₂", bondedN: true });
    s += `<rect x="196" y="${y - 44}" width="88" height="62" rx="8" fill="none" stroke="${AMB}" stroke-width="2"/>` + T(240, y + 62, "peptide bond", { s: 12, w: 700, c: AMBD });
    s += T(80, y - 60, "N-terminus", { s: 11, w: 600, c: GREY }) + T(80, y - 46, "(free –NH₂)", { s: 11, w: 500, c: GREY }) + T(410, y - 60, "C-terminus", { s: 11, w: 600, c: GREY }) + T(410, y - 46, "(free –COOH)", { s: 11, w: 500, c: GREY });
    s += cap(470, 70, "Two amino acids joined by one peptide bond.", "start") + cap(470, 88, "A free amino group remains at one end and a free", "start") + cap(470, 106, "carboxyl group at the other, so more amino acids", "start") + cap(470, 124, "can be added by further condensation.", "start") + cap(470, 150, "Hydrolysis (peptidases, 3.2.2.2) adds water back", "start") + cap(470, 168, "across the peptide bond, separating them.", "start");
    return `<svg viewBox="0 0 760 200" width="760" role="img" aria-label="a dipeptide">${s}</svg>`;
  })();

  const dPolypeptide = (() => {
    // backbone N–Cα–C repeated 4 times with R groups
    let s = ""; const y = 100; let x = 60;
    s += T(30, y, "H₂N", { c: INK }) + L(52, y - 4, 66, y - 4);
    for (let i = 0; i < 4; i++) {
      const cx = x + 24;
      if (i > 0) { s += atom(x, y, "N") + L(x, y + 4, x, y + 18) + T(x, y + 32, "H") + L(x + 10, y - 4, cx - 10, y - 4); }
      s += atom(cx + (i ? 0 : -10), y, "C") ;
      const ax = cx + (i ? 0 : -10);
      s += L(ax, y - 14, ax, y - 30) + T(ax, y - 36, "H") + L(ax, y + 4, ax, y + 20) + T(ax, y + 36, `R${["₁", "₂", "₃", "₄"][i]}`, { c: SAGE });
      const ccx = ax + 50; s += L(ax + 10, y - 4, ccx - 10, y - 4) + atom(ccx, y, "C") + dbl(ccx, y - 14, ccx, y - 30) + T(ccx, y - 36, "O");
      if (i < 3) { s += L(ccx + 10, y - 4, ccx + 40, y - 4); if (i < 3) s += `<rect x="${ccx - 14}" y="${y - 44}" width="74" height="60" rx="6" fill="none" stroke="${AMB}" stroke-width="1.5" stroke-dasharray="4 3"/>`; x = ccx + 50; }
      else { s += L(ccx + 10, y - 4, ccx + 26, y - 4) + T(ccx + 44, y, "OH"); }
    }
    s += T(40, 150, "N-terminus", { s: 11, w: 600, c: GREY, a: "start" }) + T(720, 150, "C-terminus", { s: 11, w: 600, c: GREY, a: "end" }) + T(380, 150, "dashed boxes: three peptide bonds joining four amino acids", { s: 11, w: 600, c: AMBD });
    s += cap(380, 172, "The repeating –N–C–C– backbone is the same in every protein; only the sequence of R groups differs.") + cap(380, 188, "A polypeptide may be hundreds of amino acids long.");
    return `<svg viewBox="0 0 760 200" width="760" role="img" aria-label="a short polypeptide chain of four amino acids">${s}</svg>`;
  })();

  function miniHelix(cx, y0, r, pitch, turns, w, col) {
    const pts = (from, to) => { const a = []; for (let t = from; t <= to + 1e-9; t += 0.1) a.push(`${(cx + r * Math.sin(t)).toFixed(1)} ${(y0 + pitch * t / (2 * Math.PI)).toFixed(1)}`); return "M" + a.join(" L"); };
    let s = "";
    for (let k = 0; k < turns; k++) { const t0 = k * 2 * Math.PI; s += `<path d="${pts(t0 + Math.PI, t0 + 2 * Math.PI)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity=".35"/><path d="${pts(t0, t0 + Math.PI)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; }
    return s;
  }
  const dLevels = (() => {
    const beads = (x0, y0, n, col = TEAL) => Array.from({ length: n }, (_, i) => `<circle cx="${x0 + i * 22}" cy="${y0}" r="8" fill="${col}"/>` + (i < n - 1 ? L(x0 + i * 22 + 8, y0, x0 + (i + 1) * 22 - 8, y0, { w: 3 }) : "")).join("");
    const tx = (x, y, lines) => lines.map((l, i) => T(x, y + i * 14, l, { s: 10, w: 500 })).join("");
    let s = "";
    s += T(95, 22, "1  Primary", { s: 13 }) + beads(40, 70, 6) + tx(95, 120, ["sequence of amino acids", "held by peptide bonds", "(covalent)"]);
    s += T(285, 22, "2  Secondary", { s: 13 }) + miniHelix(250, 40, 26, 16, 3, 4, TEAL) + [0, 1].map((k) => L(276, 44 + k * 16 + 2, 276, 44 + (k + 1) * 16 - 2, { c: AMB, d: "3 3" })).join("") + `<path d="M300 50 l16 -5 l16 5 l16 -5" fill="none" stroke="${SAGE}" stroke-width="4" stroke-linejoin="round"/><path d="M300 76 l16 5 l16 -5 l16 5" fill="none" stroke="${SAGE}" stroke-width="4" stroke-linejoin="round"/>` + L(316, 48, 316, 78, { c: AMB, d: "3 3" }) + L(332, 48, 332, 78, { c: AMB, d: "3 3" }) + tx(285, 120, ["α-helix or β-pleated sheet", "held by hydrogen bonds", "between backbone C=O and N–H"]);
    s += T(475, 22, "3  Tertiary", { s: 13 }) + `<path d="M420 85 c10 -45 50 -45 60 -15 c10 30 50 30 60 0 c10 -30 40 0 30 25 c-10 25 -50 15 -70 5 c-20 -10 -50 15 -80 -15" fill="none" stroke="${TEAL}" stroke-width="5" stroke-linecap="round"/>` + L(468, 60, 492, 82, { c: ROSE, w: 3 }) + L(512, 56, 530, 76, { c: AMB, d: "3 3" }) + tx(475, 120, ["overall 3D folding held by", "hydrogen, ionic and disulfide", "bonds between R groups"]);
    s += T(665, 22, "4  Quaternary", { s: 13 }) + `<ellipse cx="648" cy="58" rx="22" ry="16" fill="#d6efec" stroke="${TEAL}" stroke-width="2"/><ellipse cx="684" cy="58" rx="22" ry="16" fill="#e2efe6" stroke="${SAGE}" stroke-width="2"/><ellipse cx="648" cy="86" rx="22" ry="16" fill="#e2efe6" stroke="${SAGE}" stroke-width="2"/><ellipse cx="684" cy="86" rx="22" ry="16" fill="#d6efec" stroke="${TEAL}" stroke-width="2"/>` + tx(665, 120, ["two or more polypeptides", "in one protein", "(e.g. haemoglobin: 4 chains)"]);
    s += `<path d="M30 170 l700 0" stroke="${GREY}" stroke-width="1" marker-end="url(#arrl)"/>` + cap(380, 190, "each level depends on the one before: the sequence fixes where bonds can form, and so the final shape and function");
    return `<svg viewBox="0 0 760 200" width="760" role="img" aria-label="the four levels of protein structure"><defs><marker id="arrl" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${GREY}"/></marker></defs>${s}</svg>`;
  })();

  // Side view of a right-handed helix: a single chain coiling round a vertical axis. Front halves of each turn are
  // drawn bold, back halves faint, so the coil reads as 3D. Hydrogen bonds run parallel to the axis, from the C=O of
  // one turn to the N–H of the next turn (four residues further along the chain).
  const helix = miniHelix;
  const dSecondary = `<svg viewBox="0 0 760 230" width="760" role="img" aria-label="alpha helix and beta pleated sheet with hydrogen bonds">
    ${T(190, 24, "α-helix", { s: 14 })}
    ${L(190, 34, 190, 158, { c: GREY, w: 1, d: "2 4" })}
    ${helix(190, 38, 46, 26, 4, 6, TEAL)}
    ${[0, 1, 2].map((k) => L(236, 38 + 6.5 + k * 26 + 3, 236, 38 + 6.5 + (k + 1) * 26 - 3, { c: AMB, d: "4 3" })).join("")}
    ${[0, 1, 2].map((k) => L(144, 38 + 19.5 + k * 26 + 3, 144, 38 + 19.5 + (k + 1) * 26 - 3, { c: AMB, d: "4 3" })).join("")}
    ${T(262, 46, "C=O", { s: 10, w: 600, a: "start" })}${T(262, 76, "N–H", { s: 10, w: 600, a: "start" })}
    ${T(300, 100, "one chain,", { s: 10, w: 500, a: "start", c: GREY })}${T(300, 113, "coiled;", { s: 10, w: 500, a: "start", c: GREY })}${T(300, 126, "3.6 residues", { s: 10, w: 500, a: "start", c: GREY })}${T(300, 139, "per turn", { s: 10, w: 500, a: "start", c: GREY })}
    ${cap(190, 172, "one chain coils round an axis; hydrogen bonds (dashed)")}${cap(190, 188, "run along the axis from the C=O of one peptide bond")}${cap(190, 204, "to the N–H of the peptide bond four residues further on")}
    ${T(560, 24, "β-pleated sheet", { s: 14 })}
    <path d="M420 60 l28 -8 l28 8 l28 -8 l28 8 l28 -8 l28 8 l28 -8 l28 8 l28 -8" fill="none" stroke="${SAGE}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M420 108 l28 8 l28 -8 l28 8 l28 -8 l28 8 l28 -8 l28 8 l28 -8 l28 8" fill="none" stroke="${SAGE}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M420 156 l28 -8 l28 8 l28 -8 l28 8 l28 -8 l28 8 l28 -8 l28 8 l28 -8" fill="none" stroke="${SAGE}" stroke-width="6" stroke-linejoin="round"/>
    ${[448, 504, 560, 616].map((x) => L(x, 58, x, 112, { c: AMB, d: "4 3" }) + L(x + 28, 112, x + 28, 150, { c: AMB, d: "4 3" })).join("")}
    ${cap(560, 186, "the chain folds back on itself; hydrogen bonds (dashed) link")}${cap(560, 202, "the C=O and N–H groups of neighbouring strands")}
    ${cap(380, 226, "Both are held only by hydrogen bonds between backbone groups; R groups are not involved. Dashed = hydrogen bond.")}
  </svg>`;

  const dBonds = (() => {
    const col = (x, top, bottom, bond, title, tcol, lines) => {
      let s = `<path d="M${x - 60} 40 q60 -10 120 0" fill="none" stroke="${TEAL}" stroke-width="5" stroke-linecap="round" opacity=".6"/><path d="M${x - 60} 150 q60 10 120 0" fill="none" stroke="${TEAL}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
      s += L(x, 44, x, 60, { w: 1.5 }) + T(x, 76, top, { s: 12, c: tcol }) + T(x, 128, bottom, { s: 12, c: tcol }) + L(x, 132, x, 146, { w: 1.5 }) + bond;
      s += T(x, 178, title, { s: 11, w: 600, c: tcol }) + lines.map((l, i) => T(x, 192 + i * 12, l, { s: 10, w: 500, c: GREY })).join("");
      return s;
    };
    let s = "";
    s += col(110, "–O–H", "O=C–", L(110, 82, 110, 116, { c: AMB, d: "4 3" }), "hydrogen bond", AMBD, ["weak; between polar R groups", "(or backbone groups)"]);
    s += col(290, "–COO⁻", "⁺H₃N–", L(290, 82, 290, 116, { c: NAVY, d: "6 3" }), "ionic bond", NAVY, ["between oppositely charged", "R groups; broken by pH change"]);
    s += col(470, "–CH₂–S", "S–CH₂–", L(470, 82, 470, 116, { c: ROSE, w: 4 }), "disulfide bridge", ROSE, ["strong covalent S–S bond", "between two cysteine R groups"]);
    s += `<path d="M590 40 q60 -10 120 0" fill="none" stroke="${TEAL}" stroke-width="5" stroke-linecap="round" opacity=".6"/><path d="M590 150 q60 10 120 0" fill="none" stroke="${TEAL}" stroke-width="5" stroke-linecap="round" opacity=".6"/>` + L(650, 44, 650, 64, { w: 1.5 }) + L(650, 128, 650, 146, { w: 1.5 }) + `<ellipse cx="650" cy="96" rx="44" ry="28" fill="#e2efe6" stroke="${SAGE}" stroke-width="2"/>` + T(650, 92, "–CH₃   –CH₃", { s: 11 }) + T(650, 108, "–CH(CH₃)₂", { s: 11 }) + T(650, 178, "hydrophobic interaction", { s: 11, w: 600, c: SAGE }) + T(650, 192, "non-polar R groups cluster", { s: 10, w: 500, c: GREY }) + T(650, 204, "away from water (enrichment)", { s: 10, w: 500, c: GREY });
    s += L(40, 236, 90, 236, { c: ROSE, w: 4 }) + T(100, 240, "solid = covalent disulfide bridge (strong; not broken by moderate heat; broken by reducing agents)", { s: 11, w: 500, a: "start" });
    s += L(40, 260, 90, 260, { c: AMB, d: "4 3" }) + T(100, 264, "dashed = weaker interaction (many together are strong; broken by heat and pH change: denaturation)", { s: 11, w: 500, a: "start" });
    s += cap(380, 292, "The specification names hydrogen bonds and disulfide bridges; ionic bonds and hydrophobic interactions are shown for completeness.");
    return `<svg viewBox="0 0 760 300" width="760" role="img" aria-label="bonds that hold tertiary structure: hydrogen bond, ionic bond, disulfide bridge and hydrophobic interaction">${s}</svg>`;
  })();

  const dBiuret = (() => {
    const tube = (x, y, fill, label) => `<path d="M${x} ${y} l0 120 a25 25 0 0 0 50 0 l0 -120" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M${x + 2} ${y + 50} l0 70 a23 23 0 0 0 46 0 l0 -70z" fill="${fill}"/>${T(x + 25, y + 170, label, { s: 11, w: 600 })}`;
    let s = T(110, 24, "1. Add sodium hydroxide", { s: 13 }) + tube(85, 40, "#f3f6f5", "alkaline conditions") + cap(110, 228, "NaOH makes the solution alkaline");
    s += `<path d="M200 110 l40 0" stroke="${INK}" stroke-width="2.5" marker-end="url(#arrb)"/>`;
    s += T(310, 24, "2. Add dilute CuSO₄", { s: 13 }) + tube(285, 40, "#bcd6ef", "a few drops") + cap(310, 228, "blue Cu²⁺ ions");
    s += `<path d="M400 110 l40 0" stroke="${INK}" stroke-width="2.5" marker-end="url(#arrb)"/>`;
    s += T(500, 24, "Positive", { s: 13, c: TEAL }) + tube(475, 40, "#c7b3e6", "lilac / purple") + cap(500, 228, "Cu²⁺ complexes with the") + cap(500, 244, "nitrogen of peptide bonds");
    s += T(650, 24, "Negative", { s: 13, c: ROSE }) + tube(625, 40, "#bcd6ef", "stays blue") + cap(650, 228, "no protein detected");
    s += cap(380, 266, "Biuret reagent (NaOH and CuSO₄ ready-mixed) can be used in one step.") + cap(380, 282, "The test detects peptide bonds in polypeptides, so amino acids and dipeptides give a negative result.");
    return `<svg viewBox="0 0 760 292" width="760" role="img" aria-label="the biuret test for proteins"><defs><marker id="arrb" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${INK}"/></marker></defs>${s}</svg>`;
  })();

  // Identification SVGs for labelling questions
  const dIdentifyBonds = (() => {
    // A tripeptide with numbered positions: 1 = peptide bond, 2 = amino group, 3 = R group, 4 = carboxyl group
    const y = 120; let s = aminoAcidAt(130, y, { R: "CH₃", bondedC: true }) + aminoAcidAt(270, y, { R: "H", bondedN: true, bondedC: true }) + aminoAcidAt(410, y, { R: "CH₂SH", bondedN: true });
    const num = (x, yy, n) => `<circle cx="${x}" cy="${yy}" r="11" fill="${NAVY}"/>` + T(x, yy + 4, String(n), { s: 12, c: "#fff" });
    s += `<rect x="156" y="${y - 44}" width="88" height="62" rx="8" fill="none" stroke="${AMB}" stroke-width="2"/>` + num(200, y + 40, 1);
    s += num(60, y - 40, 2) + num(410, y + 70, 3) + num(500, y + 40, 4);
    s += `<rect x="61" y="${y - 20}" width="40" height="30" rx="6" fill="none" stroke="${NAVY}" stroke-width="1.5" stroke-dasharray="4 3"/>` + `<rect x="420" y="${y - 44}" width="90" height="62" rx="6" fill="none" stroke="${NAVY}" stroke-width="1.5" stroke-dasharray="4 3"/>` + `<rect x="385" y="${y + 20}" width="50" height="30" rx="6" fill="none" stroke="${NAVY}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    return `<svg viewBox="0 0 760 220" width="760" role="img" aria-label="a tripeptide with four numbered features">${s}</svg>`;
  })();

  window.BIO.content["3.1.1.4"] = {
    status: "reviewed",
    keywords: ["protein", "amino acid", "peptide bond", "dipeptide", "polypeptide", "primary structure", "secondary structure", "tertiary structure", "quaternary structure", "alpha helix", "beta pleated sheet", "hydrogen bond", "disulfide bridge", "ionic bond", "R group", "biuret", "denaturation", "haemoglobin", "enzyme", "amino group", "carboxyl group"],
    notes: `
<h2 data-stmt="3.1.1.4.s1 3.1.1.4.s2">Amino acids: the monomers of proteins</h2>
<p>Proteins are polymers of <strong>amino acids</strong>. Every amino acid has the same general structure: a central carbon atom (the α-carbon) bonded to four groups:</p>
<ul><li>an <strong>amino group</strong> (–NH<sub>2</sub>)</li><li>a <strong>carboxyl group</strong> (–COOH)</li><li>a <strong>hydrogen atom</strong></li><li>a variable <strong>R group</strong> (side chain)</li></ul>
<p>The general formula can be written NH<sub>2</sub>–CHR–COOH. <strong>Twenty</strong> amino acids occur in the proteins of all living organisms, and they differ <em>only</em> in their R group. The R group can be as small as a single hydrogen atom (glycine) or a complex ring; it may be non-polar (hydrophobic), polar, positively or negatively charged, or contain sulfur (cysteine). These differences in R groups are what later determine how a chain folds, so they are the ultimate basis of a protein's shape and function.</p>

<h2 data-stmt="3.1.1.4.s3">Peptide bonds, dipeptides and polypeptides</h2>
<p>Two amino acids join by a <strong>condensation reaction</strong>: the –OH of the carboxyl group of one amino acid and an –H of the amino group of the next are removed as a molecule of water, and a <strong>peptide bond</strong> (–C(=O)–N(H)–) forms between the carbon and the nitrogen. The product of two amino acids is a <strong>dipeptide</strong>; many amino acids joined this way form a <strong>polypeptide</strong>. A polypeptide always has a free amino group at one end (the N-terminus) and a free carboxyl group at the other (the C-terminus).</p>
<p><strong>Hydrolysis</strong> reverses this: a molecule of water is added across the peptide bond, splitting it. In digestion this is carried out by endopeptidases, exopeptidases and dipeptidases (3.2.2.2).</p>
<p>Polypeptide synthesis happens on ribosomes during translation (3.1.8.2), where the sequence of amino acids is dictated by the sequence of codons on mRNA.</p>

<h2 data-stmt="3.1.1.4.s5 3.1.1.4.s4">The four levels of protein structure</h2>
<table><tr><th>Level</th><th>What it is</th><th>Bonds that hold it</th></tr>
<tr><th>Primary</th><td>The sequence (order and number) of amino acids in the polypeptide chain. Determined by the gene (base sequence of DNA).</td><td>Peptide bonds (covalent).</td></tr>
<tr><th>Secondary</th><td>Regular, repeating shapes formed by the backbone: the <strong>α-helix</strong> (a coil) and the <strong>β-pleated sheet</strong> (chains lying side by side).</td><td>Hydrogen bonds between the C=O of one peptide bond and the N–H of another; R groups are not involved.</td></tr>
<tr><th>Tertiary</th><td>The further folding of the whole chain into a precise, compact three-dimensional shape. This is the level that creates an enzyme's active site or an antibody's binding site.</td><td>Interactions between R groups: <strong>hydrogen bonds</strong>, <strong>ionic bonds</strong> (between charged R groups), <strong>disulfide bridges</strong> (strong covalent S–S bonds between two cysteine R groups) and hydrophobic interactions.</td></tr>
<tr><th>Quaternary</th><td>The arrangement of two or more polypeptide chains (and sometimes prosthetic groups) in one protein. Haemoglobin has four chains, each with a haem group; many enzymes also have several subunits.</td><td>The same interactions as tertiary structure, between chains.</td></tr></table>
<p>Each level depends on the one before. Because the primary structure decides which R groups are where, it decides which bonds can form and therefore the final shape. A change of a single amino acid (a mutation, 3.2.11.1) can alter the tertiary structure enough to destroy function. It can also change a protein's properties without changing its fold: in sickle-cell anaemia, glutamic acid (charged R group) is replaced by valine (non-polar R group) on the surface of β-globin, so in low oxygen haemoglobin molecules stick to one another and form fibres that distort red blood cells.</p>
<h3 data-stmt="3.1.1.4.s4">Hydrogen bonds and disulfide bridges</h3>
<p><strong>Hydrogen bonds</strong> form between a slightly positive hydrogen (on –OH or –NH) and a slightly negative oxygen or nitrogen on another group. Each is weak, but there are many of them, and together they hold secondary and tertiary structure. They are easily broken by heat.</p>
<p><strong>Disulfide bridges</strong> form when the –SH groups of two cysteine R groups are oxidised to form a covalent S–S bond. They are strong and are not broken by moderate heating, so proteins with many disulfide bridges (hair keratin, extracellular enzymes, antibodies) are unusually stable.</p>

<h2 data-stmt="3.1.1.4.s5 3.1.1.4.s7">Structure and function</h2>
<p>Proteins can be classified by shape:</p>
<ul><li><strong>Globular proteins</strong> are roughly spherical with a specific tertiary (and often quaternary) structure, usually soluble, with hydrophilic R groups on the outside. Their precise shape gives them a specific function: <strong>enzymes</strong> (the active site is complementary to one substrate, 3.1.3.1), <strong>antibodies</strong> (the binding site is complementary to one antigen, 3.2.5.2), <strong>haemoglobin</strong> (four chains each with a haem group that binds oxygen, 3.1.5.3), channel and carrier proteins in membranes (3.1.4.2), and protein hormones such as insulin (3.4.7.2).</li>
<li><strong>Fibrous proteins</strong> are long, insoluble chains with repetitive sequences, often cross-linked, giving strength: collagen in tendons and skin, keratin in hair and nails.</li></ul>
<p>In every case the same argument applies: the primary structure determines the folding, the folding determines the shape, and the shape determines the function.</p>
<h3 data-stmt="3.1.1.4.s5 3.1.1.4.s4">Denaturation</h3>
<p>High temperature or a change of pH breaks the hydrogen bonds and ionic bonds that hold the tertiary structure, so the protein unfolds and loses its shape and function. The primary structure (peptide bonds) is not broken. This is why enzymes have an optimum temperature and pH (3.1.3.2).</p>

<h2 data-stmt="3.1.1.4.s6">The biuret test for proteins</h2>
<ol><li>Add an equal volume of <strong>sodium hydroxide</strong> solution to the sample (making it alkaline).</li>
<li>Add a few drops of dilute <strong>copper(II) sulfate</strong> solution and mix gently. (Biuret reagent combines these two in one solution.)</li>
<li><strong>Positive result:</strong> the solution turns <strong>lilac / purple</strong>. Copper(II) ions form a complex with the nitrogen atoms of peptide bonds.</li>
<li><strong>Negative result:</strong> the solution stays blue.</li></ol>
<p>The test detects peptide bonds in polypeptides and proteins (it needs several peptide bonds close together), so a solution of free amino acids, or of dipeptides, gives a negative result. No heating is required.</p>

<h2 data-stmt="3.1.1.4.s1 3.1.1.4.s3">Recognising amino acids and peptides</h2>
<ul><li>An –NH<sub>2</sub> and a –COOH attached to the same carbon identifies an <strong>amino acid</strong>.</li><li>A –C(=O)–N(H)– link in a chain is a <strong>peptide bond</strong>; count the peptide bonds and add one to find the number of amino acids.</li><li>Given a diagram of two or more amino acids, you may be asked to draw the dipeptide and show the water released.</li></ul>

<div class="misconception"><strong>Common misconceptions.</strong>
<ul><li>"Amino acids differ in their amino or carboxyl groups." They differ only in the R group.</li>
<li>"Peptide bonds hold tertiary structure." Peptide bonds hold the primary structure; tertiary structure is held by bonds between R groups.</li>
<li>"Secondary structure involves R groups." It involves hydrogen bonds between backbone C=O and N–H groups only.</li>
<li>"Denaturation breaks peptide bonds." It breaks hydrogen and ionic bonds; the primary structure survives.</li>
<li>"Disulfide bridges are hydrogen bonds." They are strong covalent bonds between cysteine residues.</li>
<li>"Biuret needs heating." It does not; Benedict's does.</li></ul></div>
<div class="examtip"><strong>Exam focus.</strong> (1) Draw the general amino acid and a dipeptide, showing the peptide bond and the water molecule. (2) For "describe the structure of a protein", work through the four levels and name the bonds at each. (3) For "explain how a change in primary structure affects function", chain the logic: different R group → different bonding → different tertiary structure → active site / binding site no longer complementary. (4) Biuret: NaOH, then CuSO₄, lilac/purple, no heat.</div>
<div class="enrich"><strong>Enrichment (not required):</strong> the names of individual amino acids (other than recognising cysteine as the one that forms disulfide bridges), the zwitterion form, and the chemistry of the biuret complex.</div>
`,
    diagrams: [
      { id: "d-3.1.1.4-1", title: "General structure of an amino acid", status: "reviewed", caption: "A central carbon bonded to an amino group, a carboxyl group, a hydrogen atom and a variable R group. The twenty amino acids differ only in R.", alt: "A central carbon atom with an amino group to the left, a carboxyl group to the right, a hydrogen atom above and an R group below; boxes highlight the amino and carboxyl groups.", svg: dAminoAcid },
      { id: "d-3.1.1.4-2", title: "Formation of a peptide bond", status: "reviewed", caption: "Condensation between the carboxyl group of one amino acid and the amino group of the next removes a water molecule and forms a peptide bond (–C(=O)–N(H)–).", alt: "Two amino acids side by side with the OH of the first carboxyl group and an H of the second amino group boxed; an arrow leads to the dipeptide with the peptide bond boxed and a molecule of water released.", svg: dPeptideFormation },
      { id: "d-3.1.1.4-3", title: "A dipeptide", status: "reviewed", caption: "Two amino acids joined by one peptide bond, with a free amino group at the N-terminus and a free carboxyl group at the C-terminus.", alt: "Two amino acid residues joined through a carbon-nitrogen peptide bond, boxed, with the free amino and carboxyl ends labelled.", svg: dDipeptide },
      { id: "d-3.1.1.4-4", title: "A short polypeptide", status: "reviewed", caption: "Four amino acids joined by three peptide bonds (dashed boxes). The backbone repeats N–C–C; only the R groups vary.", alt: "A chain of four amino acid residues with the repeating nitrogen, alpha carbon, carbonyl carbon backbone and R groups labelled R1 to R4.", svg: dPolypeptide },
      { id: "d-3.1.1.4-5", title: "The four levels of protein structure", status: "reviewed", caption: "Primary (sequence), secondary (helix or sheet), tertiary (3D fold), quaternary (several chains). Schematic shapes.", alt: "Four panels: a row of beads; a coiled line with dashed cross links; a folded line with coloured cross links; four overlapping ovals.", svg: dLevels },
      { id: "d-3.1.1.4-6", title: "α-helix and β-pleated sheet", status: "reviewed", caption: "Both secondary structures are held only by hydrogen bonds between backbone C=O and N–H groups. Ribbon-style schematic, not to scale.", alt: "Left: a coiled ribbon with dashed hydrogen bonds between turns. Right: three zigzag strands side by side with dashed hydrogen bonds between them.", svg: dSecondary },
      { id: "d-3.1.1.4-7", title: "Bonds holding tertiary structure", status: "reviewed", caption: "Hydrogen bonds and ionic bonds (dashed, weak), the disulfide bridge (solid, covalent) and hydrophobic interactions between R groups. Solid lines are covalent; dashed lines are weaker interactions.", alt: "A folded chain with four labelled examples of interactions between side chains: a hydrogen bond between OH and C=O, an ionic bond between COO minus and NH3 plus, a thick disulfide bridge between two CH2S groups, and a cluster of non-polar groups.", svg: dBonds },
      { id: "d-3.1.1.4-8", title: "The biuret test", status: "reviewed", caption: "Sodium hydroxide, then a few drops of copper(II) sulfate. Lilac or purple is positive; blue is negative. No heating.", alt: "Four test tubes: sample with sodium hydroxide, blue copper sulfate added, a purple tube labelled positive and a blue tube labelled negative.", svg: dBiuret },
    ],
    interactives: [
      { kind: "peptide", title: "Animate: forming and breaking a peptide bond", note: "Condensation between the carboxyl group of amino acid 1 and the amino group of amino acid 2. Use the step-by-step box to turn off motion." },
      { kind: "proteinExplorer", title: "Explore: the four levels of protein structure", note: "Click each level to see what holds it together, then test what happens to the structure when one amino acid is substituted or the protein is heated." },
    ],
    examFocus: `<ul><li><strong>Drawing:</strong> a general amino acid; two amino acids forming a dipeptide with water shown; the peptide bond circled.</li>
<li><strong>Counting:</strong> n amino acids form n − 1 peptide bonds and release n − 1 water molecules.</li>
<li><strong>Structure to function chain:</strong> sequence → bonds between R groups → tertiary shape → complementary active / binding site → function. Use it for enzymes, antibodies, haemoglobin, carrier proteins and hormones.</li>
<li><strong>Denaturation:</strong> name the bonds broken (hydrogen, ionic) and the one not broken (peptide).</li>
<li><strong>Practical skills (AO4):</strong> biuret test reagents, colour change and why free amino acids are negative; compare with Benedict's (needs heat) and the emulsion test.</li></ul>`,
    synoptic: [
      { ref: "3.1.1.1", text: "Peptide bonds are formed by condensation and broken by hydrolysis, like glycosidic and ester bonds." },
      { ref: "3.1.3.1", text: "An enzyme's active site is part of its tertiary structure; substrate specificity depends on R-group bonding." },
      { ref: "3.1.3.2", text: "Heat and pH break hydrogen and ionic bonds, changing the active site: enzyme denaturation." },
      { ref: "3.1.5.3", text: "Haemoglobin is a quaternary protein: four globin chains each with a haem group." },
      { ref: "3.1.8.2", text: "The primary structure is assembled on ribosomes in translation; mRNA codons specify each amino acid." },
      { ref: "3.2.2.2", text: "Endopeptidases, exopeptidases and dipeptidases hydrolyse peptide bonds in digestion." },
      { ref: "3.2.5.2", text: "Antibodies are globular proteins whose binding site is complementary to an antigen." },
      { ref: "3.2.11.1", text: "A base substitution can change one amino acid and so the tertiary structure of the protein." },
    ],
    quickCheck: [
      { id: "q-3.1.1.4-qc1", ref: "3.1.1.4", stmts: ["3.1.1.4.s2"], type: "mcq", marks: 1, stem: "Which group varies between different amino acids?", options: ["The amino group", "The carboxyl group", "The R group", "The hydrogen atom on the central carbon"], answer: 2, explanation: "All 20 amino acids share the amino group, carboxyl group and hydrogen; only the R group differs." },
      { id: "q-3.1.1.4-qc2", ref: "3.1.1.4", stmts: ["3.1.1.4.s3"], type: "gap", marks: 3, stem: "Complete the sentences.", text: "Two amino acids join by a {{1}} reaction to form a {{2}}, with the formation of a {{3}} bond.", answers: { 1: ["condensation"], 2: ["dipeptide"], 3: ["peptide"] }, explanation: "Condensation forms a dipeptide via a peptide bond." },
      { id: "q-3.1.1.4-qc3", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s5"], type: "mcq", marks: 1, stem: "Which bonds hold the secondary structure of a protein?", options: ["Peptide bonds", "Hydrogen bonds between backbone C=O and N–H groups", "Disulfide bridges between R groups", "Ionic bonds between R groups"], answer: 1, explanation: "α-helices and β-sheets are held by backbone hydrogen bonds." },
      { id: "q-3.1.1.4-qc4", ref: "3.1.1.4", stmts: ["3.1.1.4.s6"], type: "mcq", marks: 1, stem: "What is the positive result of the biuret test?", options: ["Brick-red precipitate", "Blue-black colour", "Lilac / purple colour", "Cloudy white emulsion"], answer: 2, explanation: "Copper(II) ions complex with peptide bonds in alkaline solution to give a purple colour." },
      { id: "q-3.1.1.4-qc5", ref: "3.1.1.4", stmts: ["3.1.1.4.s5"], type: "sequence", marks: 4, stem: "Put the levels of protein structure in order, from first formed to last.", steps: ["Primary: the sequence of amino acids joined by peptide bonds", "Secondary: α-helix or β-pleated sheet held by hydrogen bonds", "Tertiary: the 3D fold held by R-group interactions", "Quaternary: two or more polypeptide chains together"], explanation: "Each level depends on the previous one." },
    ],
    flashcards: [
      { id: "f-3.1.1.4-1", front: "Draw or describe the general structure of an amino acid.", back: "A central carbon bonded to an amino group (–NH₂), a carboxyl group (–COOH), a hydrogen atom and a variable R group." },
      { id: "f-3.1.1.4-2", front: "How many amino acids are common to all organisms, and how do they differ?", back: "Twenty; they differ only in their R group." },
      { id: "f-3.1.1.4-3", front: "Name the bond between amino acids and the reaction that forms it.", back: "Peptide bond, formed by condensation (water released)." },
      { id: "f-3.1.1.4-4", front: "Which atoms are joined by a peptide bond?", back: "The carbon of the carboxyl group of one amino acid and the nitrogen of the amino group of the next (–C(=O)–N(H)–)." },
      { id: "f-3.1.1.4-5", front: "What is a dipeptide? A polypeptide?", back: "Dipeptide: two amino acids joined by one peptide bond. Polypeptide: many amino acids joined by peptide bonds." },
      { id: "f-3.1.1.4-6", front: "How many water molecules are released when 10 amino acids form a polypeptide?", back: "Nine (one per peptide bond; n − 1)." },
      { id: "f-3.1.1.4-7", front: "Define the primary structure of a protein.", back: "The sequence (number and order) of amino acids in the polypeptide, held by peptide bonds." },
      { id: "f-3.1.1.4-8", front: "Define the secondary structure of a protein and name the bonds involved.", back: "Coiling into an α-helix or folding into a β-pleated sheet, held by hydrogen bonds between C=O and N–H groups of the backbone." },
      { id: "f-3.1.1.4-9", front: "Define tertiary structure and list the bonds that hold it.", back: "The overall 3D folding of the polypeptide, held by interactions between R groups: hydrogen bonds, ionic bonds, disulfide bridges and hydrophobic interactions." },
      { id: "f-3.1.1.4-10", front: "Define quaternary structure and give an example.", back: "Two or more polypeptide chains (and any prosthetic groups) held together in one protein, e.g. haemoglobin with four chains and four haem groups." },
      { id: "f-3.1.1.4-11", front: "How does a disulfide bridge form, and why is it strong?", back: "Between the –SH groups of two cysteine R groups, forming a covalent S–S bond; covalent bonds are much stronger than hydrogen bonds." },
      { id: "f-3.1.1.4-12", front: "Why are hydrogen bonds important in proteins even though each is weak?", back: "There are very many of them, so together they hold the secondary and tertiary structure; they break easily with heat, which causes denaturation." },
      { id: "f-3.1.1.4-13", front: "What happens when a protein is denatured, and which bonds are not broken?", back: "Hydrogen and ionic bonds break, the tertiary structure unfolds and function is lost; peptide bonds (primary structure) remain." },
      { id: "f-3.1.1.4-14", front: "Explain how a change in primary structure can change protein function.", back: "A different amino acid has a different R group, so different bonds form, changing the tertiary structure; an active or binding site may no longer be complementary." },
      { id: "f-3.1.1.4-15", front: "Describe the biuret test.", back: "Add sodium hydroxide solution, then a few drops of dilute copper(II) sulfate; a lilac/purple colour shows protein (peptide bonds). No heating." },
      { id: "f-3.1.1.4-16", front: "Why does a solution of free amino acids give a negative biuret test?", back: "The test detects peptide bonds; free amino acids have none." },
      { id: "f-3.1.1.4-17", front: "Compare globular and fibrous proteins.", back: "Globular: compact, roughly spherical, soluble, specific tertiary shape, e.g. enzymes, haemoglobin. Fibrous: long chains, insoluble, repetitive, strong, e.g. collagen, keratin." },
      { id: "f-3.1.1.4-18", front: "Why is the shape of an enzyme's active site determined by its primary structure?", back: "The sequence fixes where each R group is, so it fixes which hydrogen, ionic and disulfide bonds form during folding, and so the tertiary structure that makes the active site." },
    ],
    questions: [
      { id: "q-3.1.1.4-m1", ref: "3.1.1.4", stmts: ["3.1.1.4.s3", "3.1.1.4.s1"], type: "mcq", marks: 1, stem: "The peptide bond in a dipeptide is formed between", options: ["the two R groups", "the carboxyl carbon of one amino acid and the amino nitrogen of the other", "the two amino groups", "the central carbons of the two amino acids"], answer: 1, explanation: "–C(=O)–N(H)–: carboxyl carbon to amino nitrogen." },
      { id: "q-3.1.1.4-m2", ref: "3.1.1.4", stmts: ["3.1.1.4.s3"], type: "mcq", marks: 1, stem: "A polypeptide contains 151 amino acids. How many peptide bonds does it contain?", options: ["151", "150", "152", "75"], answer: 1, explanation: "Bonds = amino acids − 1." },
      { id: "q-3.1.1.4-m3", ref: "3.1.1.4", stmts: ["3.1.1.4.s5"], type: "mcq", marks: 1, stem: "Which level of protein structure is held together by interactions between R groups?", options: ["Primary", "Secondary", "Tertiary", "None of them"], answer: 2, explanation: "Tertiary (and quaternary) structure depends on R-group interactions; secondary uses backbone hydrogen bonds; primary uses peptide bonds." },
      { id: "q-3.1.1.4-m4", ref: "3.1.1.4", stmts: ["3.1.1.4.s4"], type: "mcq", marks: 1, stem: "Disulfide bridges form between the R groups of", options: ["any two amino acids", "two cysteine molecules", "two glycine molecules", "an amino group and a carboxyl group"], answer: 1, explanation: "Cysteine has an –SH group; two can be oxidised to form S–S." },
      { id: "q-3.1.1.4-m5", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s5"], type: "mcq", marks: 1, stem: "Heating an enzyme to 80 °C causes it to lose activity because", options: ["peptide bonds are hydrolysed", "hydrogen and ionic bonds break, changing the tertiary structure of the active site", "the primary structure changes", "disulfide bridges form"], answer: 1, explanation: "Denaturation: weak bonds break, the active site changes shape; peptide bonds remain." },
      { id: "q-3.1.1.4-m6", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s5"], type: "mcq", marks: 1, stem: "Which statement about the α-helix is correct?", options: ["It is held by disulfide bridges", "It is part of the primary structure", "It is held by hydrogen bonds between C=O and N–H groups of the backbone", "It involves bonds between R groups"], answer: 2, explanation: "Secondary structure: backbone hydrogen bonds only." },
      { id: "q-3.1.1.4-m7", ref: "3.1.1.4", stmts: ["3.1.1.4.s6"], type: "mcq", marks: 1, stem: "In the biuret test, which reagents are used and in what order?", options: ["Copper(II) sulfate then heat", "Sodium hydroxide then copper(II) sulfate", "Hydrochloric acid then sodium hydrogencarbonate", "Ethanol then water"], answer: 1, explanation: "Alkaline conditions (NaOH) then dilute CuSO₄; no heating." },
      { id: "q-3.1.1.4-m8", ref: "3.1.1.4", stmts: ["3.1.1.4.s5", "3.1.1.4.s7"], type: "mcq", marks: 1, stem: "Haemoglobin is described as having quaternary structure because", options: ["it contains iron", "it is made of four polypeptide chains", "it has an α-helix", "it is a globular protein"], answer: 1, explanation: "Quaternary structure means more than one polypeptide chain." },
      { id: "q-3.1.1.4-m9", ref: "3.1.1.4", stmts: ["3.1.1.4.s5", "3.1.1.4.s2"], type: "mcq", marks: 1, stem: "A mutation changes one amino acid in an enzyme from a charged one to a non-polar one. The most likely consequence is", options: ["no change, because only one amino acid is different", "a change in the peptide bonds", "loss of an ionic bond, altering the tertiary structure and possibly the active site", "the enzyme becomes a fibrous protein"], answer: 2, explanation: "Charged R groups form ionic bonds; losing one can change the fold." },
      { id: "q-3.1.1.4-m10", ref: "3.1.1.4", stmts: ["3.1.1.4.s6"], type: "mcq", marks: 1, stem: "Which of these would give a negative biuret test?", options: ["Egg white solution", "A solution of free amino acids", "Milk", "A solution of an enzyme"], answer: 1, explanation: "No peptide bonds in free amino acids." },
      { id: "q-3.1.1.4-m11", ref: "3.1.1.4", stmts: ["3.1.1.4.s3", "3.1.1.1.s3"], type: "mcq", marks: 1, stem: "Hydrolysis of a dipeptide requires", options: ["the removal of a water molecule", "the addition of a water molecule across the peptide bond", "the formation of a disulfide bridge", "copper(II) ions"], answer: 1, explanation: "Hydrolysis adds water to break the bond." },
      { id: "q-3.1.1.4-m12", ref: "3.1.1.4", stmts: ["3.1.1.4.s5", "3.1.1.4.s7"], type: "mcq", marks: 1, stem: "Which feature of globular proteins makes them suitable as enzymes?", options: ["They are insoluble and long", "They have a specific tertiary structure that forms a complementary active site", "They contain many disulfide bridges", "They have no R groups"], answer: 1, explanation: "Specific 3D shape gives a specific active site." },
      { id: "q-3.1.1.4-g1", ref: "3.1.1.4", stmts: ["3.1.1.4.s1", "3.1.1.4.s2"], type: "gap", marks: 4, stem: "Complete the description of an amino acid.", text: "An amino acid has a central carbon atom bonded to an {{1}} group (–NH₂), a {{2}} group (–COOH), a hydrogen atom and a variable {{3}} group. There are {{4}} amino acids common to all organisms.", answers: { 1: ["amino", "amine"], 2: ["carboxyl", "carboxylic acid"], 3: ["r", "r group", "side chain", "variable"], 4: ["20", "twenty"] }, explanation: "Amino, carboxyl, R group; 20." },
      { id: "q-3.1.1.4-g2", ref: "3.1.1.4", stmts: ["3.1.1.4.s5"], type: "gap", marks: 3, stem: "Complete the sentences about protein structure.", text: "The sequence of amino acids is the {{1}} structure. Coiling into an α-helix is part of the {{2}} structure. The overall three-dimensional shape is the {{3}} structure.", answers: { 1: ["primary"], 2: ["secondary"], 3: ["tertiary"] }, explanation: "Primary, secondary, tertiary." },
      { id: "q-3.1.1.4-g3", ref: "3.1.1.4", stmts: ["3.1.1.4.s4"], type: "gap", marks: 3, stem: "Complete the sentences about bonding.", text: "Secondary structure is held by {{1}} bonds. A strong covalent bond between two cysteine R groups is a {{2}} bridge. An ionic bond forms between two R groups with opposite {{3}}.", answers: { 1: ["hydrogen"], 2: ["disulfide", "disulphide"], 3: ["charges", "charge"] }, explanation: "Hydrogen bonds; disulfide bridge; opposite charges." },
      { id: "q-3.1.1.4-g4", ref: "3.1.1.4", stmts: ["3.1.1.4.s6"], type: "gap", marks: 3, stem: "Complete the description of the biuret test.", text: "Add {{1}} solution to make the sample alkaline, then a few drops of dilute {{2}} solution. A {{3}} colour shows that protein is present.", answers: { 1: ["sodium hydroxide", "naoh", "potassium hydroxide", "koh", "alkali"], 2: ["copper sulfate", "copper(ii) sulfate", "copper ii sulfate", "copper sulphate", "copper(ii) sulphate", "cuso4"], 3: ["purple", "lilac", "violet", "mauve"] }, explanation: "NaOH, CuSO₄, lilac/purple." },
      { id: "q-3.1.1.4-g5", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s5"], type: "gap", marks: 3, stem: "Complete the sentences about denaturation.", text: "When a protein is heated strongly, {{1}} bonds and ionic bonds break, so the {{2}} structure changes and the protein loses its function. The {{3}} bonds of the primary structure are not broken.", answers: { 1: ["hydrogen"], 2: ["tertiary", "3d", "three-dimensional", "three dimensional"], 3: ["peptide"] }, explanation: "Hydrogen bonds break; tertiary structure lost; peptide bonds remain." },
      { id: "q-3.1.1.4-g6", ref: "3.1.1.4", stmts: ["3.1.1.4.s3", "3.1.1.1.s3"], type: "gap", marks: 3, stem: "Complete the sentences about polypeptides.", text: "A chain of many amino acids is a {{1}}. Joining 8 amino acids releases {{2}} molecules of water. The reverse reaction, which breaks peptide bonds using water, is {{3}}.", answers: { 1: ["polypeptide"], 2: ["7", "seven"], 3: ["hydrolysis"] }, explanation: "Polypeptide; 7; hydrolysis." },
      { id: "q-3.1.1.4-match1", ref: "3.1.1.4", stmts: ["3.1.1.4.s5", "3.1.1.4.s4"], type: "match", marks: 4, stem: "Match each level of protein structure to the bonds that hold it.", pairs: [{ left: "Primary structure", right: "Peptide bonds only" }, { left: "Secondary structure", right: "Hydrogen bonds between backbone C=O and N–H" }, { left: "Tertiary structure", right: "Hydrogen, ionic and disulfide bonds between R groups" }, { left: "Quaternary structure", right: "Interactions between separate polypeptide chains" }], explanation: "" },
      { id: "q-3.1.1.4-match2", ref: "3.1.1.4", stmts: ["3.1.1.4.s7", "3.1.1.4.s5"], type: "match", marks: 4, stem: "Match each protein to the structural feature that explains its function.", pairs: [{ left: "Enzyme", right: "Tertiary structure forms an active site complementary to its substrate" }, { left: "Haemoglobin", right: "Quaternary structure of four chains each carrying a haem group" }, { left: "Collagen", right: "Fibrous, cross-linked chains giving tensile strength" }, { left: "Antibody", right: "Binding site complementary to a specific antigen" }], explanation: "" },
      { id: "q-3.1.1.4-id1", ref: "3.1.1.4", stmts: ["3.1.1.4.s1", "3.1.1.4.s3"], type: "label", marks: 4, stem: "The diagram shows a tripeptide. Identify each numbered feature.", svg: dIdentifyBonds, labels: [{ n: 1, answer: "Peptide bond" }, { n: 2, answer: "Amino group (N-terminus)" }, { n: 3, answer: "R group of cysteine" }, { n: 4, answer: "Carboxyl group (C-terminus)" }], bank: ["Peptide bond", "Amino group (N-terminus)", "R group of cysteine", "Carboxyl group (C-terminus)", "Glycosidic bond", "Ester bond", "Disulfide bridge"], explanation: "1: the C(=O)–N(H) link. 2: the free –NH₂ at the start of the chain. 3: –CH₂SH, the sulfur-containing R group of cysteine. 4: the free –COOH at the end." },
      { id: "q-3.1.1.4-id2", ref: "3.1.1.4", stmts: ["3.1.1.4.s5"], type: "match", marks: 4, stem: "Protein structure identification: match each description to the level of structure it describes.", pairs: [{ left: "A chain folds back and forth, with hydrogen bonds between neighbouring strands", right: "Secondary (β-pleated sheet)" }, { left: "Four globin chains and four haem groups form one molecule", right: "Quaternary" }, { left: "Gly–Ala–Ser–Cys–Leu–Lys…", right: "Primary" }, { left: "Two cysteine residues far apart in the sequence are joined by an S–S bond, fixing the fold", right: "Tertiary" }], explanation: "" },
      { id: "q-3.1.1.4-s1", ref: "3.1.1.4", stmts: ["3.1.1.4.s3"], type: "short", marks: 3, stem: "Describe how a peptide bond is formed between two amino acids. (3 marks)",
        scheme: [{ point: "Condensation reaction / removal of a molecule of water", marks: 1 }, { point: "OH from the carboxyl group (of one amino acid) and H from the amino group (of the other)", marks: 1 }, { point: "Bond forms between the carbon (of –COOH) and the nitrogen (of –NH₂)", marks: 1 }],
        model: "A condensation reaction takes place in which a hydroxyl group is removed from the carboxyl group of one amino acid and a hydrogen atom from the amino group of the other; these leave as a molecule of water, and a peptide bond forms between the carbon of the carboxyl group and the nitrogen of the amino group.",
        commonErrors: "Describing hydrolysis; saying the bond is between two R groups; forgetting water." },
      { id: "q-3.1.1.4-s2", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s5"], type: "short", marks: 4, stem: "Describe the secondary and tertiary structure of a protein and the bonds that maintain each. (4 marks)",
        scheme: [{ point: "Secondary: polypeptide coils into α-helix or folds into β-pleated sheet", marks: 1 }, { point: "Held by hydrogen bonds (between C=O and N–H of the backbone)", marks: 1 }, { point: "Tertiary: further folding into a specific 3D shape", marks: 1 }, { point: "Held by bonds between R groups: hydrogen bonds, ionic bonds, disulfide bridges (any two named)", marks: 1 }],
        model: "In the secondary structure the polypeptide chain coils into an α-helix or folds into a β-pleated sheet, held by hydrogen bonds between the C=O and N–H groups of the backbone. In the tertiary structure the chain folds further into a specific three-dimensional shape, held by interactions between R groups: hydrogen bonds, ionic bonds between charged groups and covalent disulfide bridges between cysteine residues.",
        commonErrors: "Attributing tertiary structure to peptide bonds; not naming the α-helix or β-sheet." },
      { id: "q-3.1.1.4-s3", ref: "3.1.1.4", stmts: ["3.1.1.4.s6"], type: "short", marks: 3, stem: "A student tested a solution for protein. Describe the test and the result expected if protein is present. (3 marks)",
        scheme: [{ point: "Add sodium hydroxide (solution) / make alkaline", marks: 1 }, { point: "Add (a few drops of dilute) copper(II) sulfate solution (or biuret reagent)", marks: 1 }, { point: "Lilac / purple / mauve colour if protein present (blue if not)", marks: 1 }],
        model: "Add an equal volume of sodium hydroxide solution to the sample, then a few drops of dilute copper(II) sulfate solution and mix. If protein is present the solution turns lilac or purple; if not it stays blue.",
        commonErrors: "Heating; saying 'red' or 'brick red'; using Benedict's reagent." },
      { id: "q-3.1.1.4-a1", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s7"], type: "short", marks: 4, stem: "Application. Hair keratin contains many cysteine residues. A 'perm' treatment first applies a reducing agent to the hair, then sets it in curlers, then applies an oxidising agent. Explain how this treatment produces a lasting curl. (4 marks)",
        scheme: [{ point: "Cysteine R groups form disulfide bridges that hold the tertiary / overall structure of keratin", marks: 1 }, { point: "The reducing agent breaks the disulfide bridges (S–S → 2 –SH)", marks: 1 }, { point: "So the polypeptide chains can move / be reshaped into the curled position", marks: 1 }, { point: "The oxidising agent re-forms disulfide bridges between different cysteines, fixing the new shape; covalent bonds so it lasts", marks: 1 }],
        model: "Keratin's shape is held partly by disulfide bridges between cysteine R groups. The reducing agent breaks these S–S bonds into –SH groups, so the chains are free to slide into a new position when the hair is wound on curlers. The oxidising agent then re-forms disulfide bridges between cysteines that are now next to each other, locking the chains in the curled shape. Because disulfide bridges are strong covalent bonds, the curl lasts until new hair grows.",
        commonErrors: "Saying hydrogen bonds are broken (they are, by water, but that gives only a temporary set); not explaining the role of oxidation." },
      { id: "q-3.1.1.4-a2", ref: "3.1.1.4", stmts: ["3.1.1.4.s5", "3.1.1.4.s7", "3.1.1.4.s2"], type: "short", marks: 4, stem: "Application. The table shows part of the amino acid sequence of normal β-globin and of the β-globin found in sickle-cell anaemia.\n\nNormal: … Pro – Glu – Glu …\nSickle: … Pro – Val – Glu …\n\nGlutamic acid (Glu) has a charged R group; valine (Val) has a non-polar R group. Explain how this single change can alter the properties of haemoglobin. (4 marks)",
        scheme: [{ point: "Primary structure / amino acid sequence is changed", marks: 1 }, { point: "Different R group so different interactions form (e.g. hydrophobic interaction between haemoglobin molecules)", marks: 1 }, { point: "A charged / hydrophilic R group is replaced by a non-polar / hydrophobic one on the surface of the molecule", marks: 1 }, { point: "So (in low oxygen) haemoglobin molecules stick together / form fibres, distorting red blood cells (into a sickle shape)", marks: 1 }],
        model: "The substitution changes the primary structure. Glutamic acid's charged, hydrophilic R group is replaced by valine's non-polar R group, and this position is on the surface of the haemoglobin molecule. The non-polar patch can form hydrophobic interactions with neighbouring haemoglobin molecules, so at low oxygen concentrations the haemoglobin molecules stick to one another and form long fibres. These fibres distort the red blood cell into a sickle shape.",
        alternatives: "Accept 'tertiary / 3D structure (shape) of the protein changes' for the third mark.", commonErrors: "Saying the peptide bond changes; not linking R group to bonding." },
      { id: "q-3.1.1.4-e1", ref: "3.1.1.4", stmts: ["3.1.1.4.s5", "3.1.1.4.s7", "3.1.1.4.s4"], type: "extended", marks: 6, stem: "Explain how the structure of a protein is related to its function. In your answer, refer to the levels of protein structure and to a named example. (6 marks)",
        scheme: [{ point: "Primary structure: sequence of amino acids held by peptide bonds, determined by the gene", marks: 1 }, { point: "Sequence determines position of R groups, so which bonds (hydrogen, ionic, disulfide) can form", marks: 1 }, { point: "Secondary (α-helix / β-sheet, hydrogen bonds) and tertiary structure (R-group interactions) give a specific 3D shape", marks: 1 }, { point: "Shape gives a complementary site, e.g. active site of an enzyme fits its substrate / antibody binding site fits antigen", marks: 1 }, { point: "Quaternary structure where relevant, e.g. haemoglobin four chains with haem groups binding oxygen", marks: 1 }, { point: "Change in structure (mutation or denaturation) changes shape and so destroys function; or fibrous proteins' repetitive structure gives strength (collagen)", marks: 1 }],
        levels: "Full marks require the chain of reasoning from sequence to bonding to shape to function, with at least one named protein explained. Listing the levels without linking them to function caps at 3.",
        model: "A protein's function depends on its shape, and its shape is fixed by its structure at every level. The primary structure, the sequence of amino acids joined by peptide bonds, is determined by the base sequence of the gene. The sequence decides where each R group sits, and so which hydrogen bonds, ionic bonds and disulfide bridges can form. Hydrogen bonds between backbone groups coil parts of the chain into α-helices or fold them into β-sheets (secondary structure), and interactions between R groups fold the whole chain into a precise tertiary structure. In a globular protein such as an enzyme this fold creates an active site whose shape is complementary to one substrate, so the enzyme is specific. Haemoglobin shows quaternary structure: four chains, each with a haem group that binds oxygen, held together by the same interactions. If the sequence changes by mutation, or heat breaks the weak bonds, the shape and therefore the function are lost.",
        commonErrors: "No named example; no link between levels; stating peptide bonds hold tertiary structure." },
    ],
  };
})();
