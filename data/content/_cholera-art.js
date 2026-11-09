// Shared models and artwork for 3.2.3 Cholera (Phase 4 Batch 1, owned by the 3.2.3 author).
// Loaded before data/content/3.2.3.1.js, 3.2.3.2.js, data/consolidation/3.2.3.js and js/views/interactives-cholera.js.
//
// Orientation used in EVERY epithelium drawing: lumen of the small intestine at the TOP (microvilli on the apical
// membrane face it), a row of epithelial cells in the middle, tissue fluid and a blood capillary at the BOTTOM.
// Directions drawn (checked arrow by arrow in the author report):
//  - Cl⁻ (cholera): out of the epithelial cell, across the APICAL membrane through chloride channels, INTO the lumen.
//  - Na⁺ follows Cl⁻ into the lumen between the cells (supporting).
//  - Na⁺–glucose co-transport: Na⁺ and glucose from the lumen INTO the cell through one co-transporter protein in the
//    apical membrane; Na⁺/K⁺ pump in the basal membrane moves 3 Na⁺ OUT into tissue fluid and 2 K⁺ IN, using ATP;
//    glucose leaves the cell into the tissue fluid and blood by facilitated diffusion (manifest mechanism).
//  - Water moves by osmosis from a higher (less negative) to a lower (more negative) water potential: lumen → cells →
//    blood when solutes are absorbed (normal, ORS); blood → cells → lumen after toxin exposure or when the lumen holds
//    an over-concentrated solution.
// Water-potential "ladders" are QUALITATIVE rankings, labelled as such; no measured values are implied.
//
// B.choleraModel (pure data and functions, no DOM): SOLUTIONS for the Oral Rehydration Challenge, ORS composition
// (WHO/UNICEF published values, with sources), the HYPOTHETICAL clinical-trial data and stats() that computes every
// percentage quoted on the pages (checked by hand in the author report).
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ model ------------------------------------------------------------------
  const round = (x, dp = 1) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 1) => round(x, dp).toFixed(dp);
  const pct = (a, b) => (100 * a) / b;

  // Published compositions (mmol per litre; total osmolarity mOsm per litre). Sources: WHO/UNICEF Expert consultation on
  // ORS formulation, New York, 18 July 2001 (WHO/FCH/CAH/01.22); WHO/UNICEF joint statement, 10 May 2002.
  const ORS = {
    standard: { name: "Standard WHO ORS (used from the 1970s to 2002)", sodium: 90, chloride: 80, glucose: 111, potassium: 20, citrate: 10, total: 311 },
    reduced: { name: "Reduced-osmolarity ORS (WHO/UNICEF, 2002)", sodium: 75, chloride: 65, glucose: 75, potassium: 20, citrate: 10, total: 245 },
  };
  const orsTotalCheck = (o) => o.sodium + o.chloride + o.glucose + o.potassium + o.citrate; // 311 and 245

  // Oral Rehydration Challenge: five drinks given to a patient with cholera (educational model, not treatment guidance).
  // outcome: "absorb" = net water absorption from lumen into cells and blood; "loss" = toxin-driven loss not corrected;
  // "worse" = water drawn from the cells into the lumen, so loss made worse.
  const OUT = {
    absorb: "Net absorption: water moves from the lumen into the epithelial cells and then into the blood",
    loss: "Not corrected: the toxin-driven loss of water into the lumen continues and lost ions are not replaced",
    worse: "Made worse: even more water is drawn out of the epithelial cells into the lumen",
  };
  const SOLUTIONS = [
    { key: "water", label: "Water only", contents: "Clean water with no dissolved salts or sugar.", outcome: "loss",
      why: "The drink contains no Na⁺ and no glucose, so it gives the Na⁺–glucose co-transporters nothing extra to carry and does not raise the solute concentration of the epithelial cells. The toxin keeps chloride ions pouring into the lumen, so the lumen keeps a lower water potential than the cells and water keeps leaving. Water alone also does nothing to replace the Na⁺, K⁺ and Cl⁻ lost in the diarrhoea." },
    { key: "salt", label: "Salt only", contents: "Sodium chloride dissolved in water, with no sugar.", outcome: "loss",
      why: "Na⁺ is absorbed efficiently in cholera only by co-transport with glucose (or amino acids), and this drink has no glucose. Much of the Na⁺ and Cl⁻ therefore stays in the lumen, adding to the solutes there, so the lumen's water potential stays lower than that of the cells and the loss of water is not reversed. A strong salt solution would make it worse." },
    { key: "glucose", label: "Glucose only", contents: "Glucose dissolved in water, with no salts.", outcome: "loss",
      why: "Glucose is absorbed with Na⁺ through the co-transporter. In cholera the gut contents contain Na⁺ that has followed the secreted Cl⁻ into the lumen, so some glucose can be co-transported with it. However, the drink replaces none of the large amounts of Na⁺ lost, the toxin keeps secreting Cl⁻, and glucose that is not absorbed stays in the lumen and lowers its water potential. In this simplified model the net loss of water and ions continues, so the dehydration is not corrected." },
    { key: "ors", label: "Balanced sugar and salt (ORS)", contents: "Glucose and sodium salts (with potassium and citrate) in carefully chosen, matched concentrations, so the solution is not more concentrated than body fluids.", outcome: "absorb",
      why: "Na⁺ and glucose are absorbed together by co-transport into the epithelial cells; the Na⁺/K⁺ pump moves Na⁺ out into the tissue fluid and glucose leaves by facilitated diffusion. The solute concentration of the cells and then the blood side rises, lowering their water potential below that of the lumen, so water follows by osmosis from the lumen into the cells and blood. The toxin does not stop this co-transport, so absorption can outweigh the secretion. Lost Na⁺ and K⁺ are also replaced." },
    { key: "hyper", label: "Over-concentrated sugar and salt", contents: "The same kinds of solute as ORS but far too much of them, so the solution is much more concentrated than body fluids.", outcome: "worse",
      why: "Co-transport still happens, but the lumen now contains so much solute that its water potential is far lower than that of the epithelial cells. Water moves by osmosis out of the cells into the lumen, adding to the fluid lost: the diarrhoea and dehydration get worse. This is why the concentration of an ORS matters as much as its ingredients." },
  ];

  // HYPOTHETICAL randomised controlled trial (invented for teaching; not a real study). Analysed = children who completed.
  const TRIAL = {
    title: "Hypothetical Trial H: an improved ORS (ORS-R) compared with standard ORS",
    population: "Children aged 6 months to 5 years admitted to two hospitals with acute watery diarrhoea and some dehydration (cholera and non-cholera)",
    design: "Randomised, double-blind: both drinks looked and tasted the same and neither the families nor the clinical staff knew which a child received. An independent data and safety monitoring committee reviewed results part-way through.",
    groups: {
      std: { name: "Standard ORS", randomised: 242, analysed: 236, stoolMean: 152, stoolSd: 61, iv: 46, vomit: 58, lowNa: 4, medianHours: 70 },
      imp: { name: "Improved ORS-R", randomised: 238, analysed: 233, stoolMean: 124, stoolSd: 55, iv: 28, vomit: 41, lowNa: 7, medianHours: 64 },
    },
    significance: { stool: "p < 0.001 (significant)", iv: "p ≈ 0.03 (significant)", vomit: "p = 0.07 (not significant)", lowNa: "p = 0.36 (not significant)", hours: "p = 0.21 (not significant)" },
  };
  // HYPOTHETICAL small, poorly designed study for comparison
  const STUDY_K = { title: "Hypothetical Study K", n: 30, desc: "30 adults with cholera at one clinic. Doctors chose which patients received the new ORS (15) and which received standard ORS (15). Doctors and patients knew which drink was given.", newIv: 2, stdIv: 5, each: 15 };

  const stats = () => {
    const s = TRIAL.groups.std, m = TRIAL.groups.imp;
    const ivS = pct(s.iv, s.analysed), ivM = pct(m.iv, m.analysed);
    const vS = pct(s.vomit, s.analysed), vM = pct(m.vomit, m.analysed);
    const nS = pct(s.lowNa, s.analysed), nM = pct(m.lowNa, m.analysed);
    return {
      ivS, ivM, ivAbs: ivS - ivM, ivRel: (100 * (ivS - ivM)) / ivS, nnt: 100 / (ivS - ivM),
      vS, vM, nS, nM,
      stoolRel: (100 * (s.stoolMean - m.stoolMean)) / s.stoolMean, stoolDiff: s.stoolMean - m.stoolMean,
      withdrawnS: s.randomised - s.analysed, withdrawnM: m.randomised - m.analysed, totalRand: s.randomised + m.randomised,
      kNew: pct(STUDY_K.newIv, STUDY_K.each), kStd: pct(STUDY_K.stdIv, STUDY_K.each),
    };
  };
  B.choleraModel = { round, fix, pct, ORS, orsTotalCheck, OUT, SOLUTIONS, TRIAL, STUDY_K, stats };

  // ------------------------------------------------------------------ artwork ------------------------------------------------------------------
  let cnt = 0, U = ""; const uid = () => (U = "-ch" + (++cnt));
  const INK = "#16263a", GREY = "#5f6f7f", CL = "#a3367f", NA = "#a86a00", GLU = "#2e7d4f", KC = "#4b4fa6", WAT = "#1f66b0", TOX = "#6b3fa0", CELL = "#e6f2ec", CELLS = "#3f6f62";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 11}" font-weight="${o.w || 600}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}>${s}</text>`;
  const marker = (id, c) => `<marker id="${id}${U}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 2.2}"${o.da ? ` stroke-dasharray="${o.da}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}${o.cls ? ` class="${o.cls}"` : ""}${o.op ? ` opacity="${o.op}"` : ""}/>`;
  const open = (w, h, label, defs = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}" style="max-width:100%;height:auto"><defs>${defs}</defs><rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>`;
  const defsAll = () => marker("cl", CL) + marker("na", NA) + marker("glu", GLU) + marker("k", KC) + marker("w", WAT) + marker("tx", TOX) + marker("g", GREY);

  const CELLX = [40, 220, 400], CW = 170, CY = 142, CH = 150; // cells y 142–292
  const MODES = {
    normal: { title: "Normal small intestine: net absorption", order: "LCB", cap: ["Na⁺ and glucose are absorbed by co-transport; solutes inside the cells and tissue fluid lower their water potential,", "so water follows from the lumen into the cells and blood by osmosis. Few chloride channels are open."] },
    cholera: { title: "After cholera toxin: chloride secretion and water loss", order: "BCL", cap: ["The toxin opens more chloride channels: Cl⁻ is secreted into the lumen and Na⁺ follows. The lumen's water potential falls below", "that of the cells, so water leaves the cells into the lumen by osmosis and is replaced from the blood: severe watery diarrhoea."] },
    ors: { title: "Cholera treated with ORS: co-transport drives absorption", order: "LCB", cap: ["Na⁺ and glucose from the ORS are co-transported into the cells (the toxin does not block this). Solutes raise the concentration in the cells", "and tissue fluid, lowering their water potential below the lumen's, so water is absorbed by osmosis even though Cl⁻ secretion continues."] },
    water: { title: "Cholera, drink of water only", order: "BCL", drink: "drink: water only", cap: ["Nothing extra for the co-transporters to carry and no ions replaced. Cl⁻ secretion still keeps the lumen at a lower water potential,", "so water continues to leave the cells: the loss is not corrected. (Simplified model.)"] },
    salt: { title: "Cholera, drink of salt only", order: "BCL", drink: "drink: salt, no sugar", cap: ["Without glucose little Na⁺ is absorbed by co-transport; unabsorbed Na⁺ and Cl⁻ add to the solutes in the lumen,", "which stays at a lower water potential than the cells: the loss continues. (Simplified model.)"] },
    glucose: { title: "Cholera, drink of glucose only", order: "BCL", drink: "drink: glucose, no salts", cap: ["Some glucose is co-transported with Na⁺ already in the lumen, but the drink replaces none of the Na⁺ lost and", "unabsorbed glucose adds to the solutes in the lumen: net loss continues and is not corrected. (Simplified model.)"] },
    hyper: { title: "Cholera, over-concentrated sugar and salt", order: "BCL", drink: "drink: far too concentrated", worse: true, cap: ["Co-transport happens, but the lumen holds so much solute that its water potential is far below the cells'.", "More water moves out of the cells into the lumen by osmosis: dehydration gets worse."] },
  };

  // epithelium(mode, { step, animate, ladder, width }) : the core drawing. step limits what is shown (simulator).
  const epithelium = (mode = "normal", o = {}) => {
    uid(); const M = MODES[mode] || MODES.normal; const step = o.step == null ? 99 : o.step; const anim = !!o.animate;
    const chol = mode !== "normal"; const secretes = chol; const hasCo = mode === "normal" || mode === "ors" || mode === "hyper";
    const label = `${M.title}. Section through the small intestine wall with the lumen at the top, three epithelial cells with microvilli in the middle and a blood capillary at the bottom.`;
    let s = open(760, 440, label, defsAll() + (anim ? `<style>.cho-flow${U}{stroke-dasharray:12 7;animation:choflow${U} 1.1s linear infinite}@keyframes choflow${U}{to{stroke-dashoffset:-19}}@media (prefers-reduced-motion: reduce){.cho-flow${U}{animation:none}}</style>` : ""));
    s += T(20, 20, M.title, { a: "start", s: 13, w: 700 });
    // lumen, tissue fluid, capillary
    s += `<rect x="20" y="30" width="560" height="112" fill="#fdf5df"/>` + T(30, 48, "LUMEN of the small intestine", { a: "start", s: 11, w: 700, c: "#7a5a12" });
    if (M.drink) s += `<rect x="215" y="36" width="${M.drink.length * 6 + 14}" height="17" rx="8" fill="#fff" stroke="#c9a24a"/>` + T(222, 48.5, M.drink, { a: "start", s: 10, w: 600, c: "#7a5a12" });
    s += `<rect x="20" y="292" width="560" height="48" fill="#f2f7f4"/>` + T(30, 306, "basal membrane", { a: "start", s: 9.5, w: 500, c: GREY }) + T(30, 330, "tissue fluid", { a: "start", s: 9.5, w: 500, c: GREY });
    s += `<rect x="20" y="342" width="560" height="62" rx="28" fill="#fbe3e3" stroke="#b4504f" stroke-width="1.5"/>` + T(40, 377, "BLOOD in a capillary", { a: "start", s: 11, w: 700, c: "#8f3434" });
    [250, 330, 410, 520].forEach((x, i) => { s += `<ellipse cx="${x}" cy="${370 + (i % 2) * 12}" rx="13" ry="7" fill="#f3b7b7" stroke="#c46a6a" stroke-width="1"/>`; });
    // cells with microvilli and nuclei
    CELLX.forEach((x, i) => {
      for (let mx = x + 4; mx <= x + CW - 9; mx += 9) s += `<rect x="${mx}" y="128" width="5" height="16" rx="2.5" fill="${CELL}" stroke="${CELLS}" stroke-width="1"/>`;
      s += `<rect x="${x}" y="${CY}" width="${CW}" height="${CH}" rx="6" fill="${CELL}" stroke="${CELLS}" stroke-width="1.6"/>`;
      s += `<ellipse cx="${x + CW / 2 + (i === 2 ? 0 : 0)}" cy="${i === 1 ? 273 : 262}" rx="22" ry="${i === 1 ? 11 : 13}" fill="#d9e6f2" stroke="#7b93ad" stroke-width="1"/>`;
      if (i < 2) s += `<rect x="${x + CW}" y="${CY}" width="10" height="8" fill="${CELLS}"/>`; // tight junction
    });
    s += T(125, 286, "epithelial cell", { s: 9.5, w: 500, c: GREY }) + T(578, 122, "microvilli", { a: "end", s: 9.5, w: 500, c: GREY });
    // ---- cell 1: chloride channel, toxin ----
    const chOpen = secretes && step >= 3;
    [150, 185].forEach((cx, k) => { if (k === 1 && !chOpen) return; s += `<rect x="${cx - 9}" y="128" width="6" height="26" rx="2" fill="#f1d3e6" stroke="${CL}" stroke-width="1.2"/><rect x="${cx + 3}" y="128" width="6" height="26" rx="2" fill="#f1d3e6" stroke="${CL}" stroke-width="1.2"/>`; });
    if (secretes) s += T(138, 166, "chloride", { a: "end", s: 9.5, w: 600, c: CL }) + T(138, 178, chOpen ? "channels open" : "channel", { a: "end", s: 9.5, w: 600, c: CL });
    else s += T(138, 168, "chloride channel", { a: "end", s: 9.5, w: 600, c: CL }) + T(138, 180, "(few open)", { a: "end", s: 9, w: 500, c: CL });
    if (chol && step >= 1) {
      // comma-shaped bacteria near the microvilli, with flagella
      [[40, 108], [84, 112]].forEach(([x, y]) => { s += `<path d="M${x} ${y} q10 -10 22 -2" fill="none" stroke="${TOX}" stroke-width="7" stroke-linecap="round"/><path d="M${x + 22} ${y - 2} q8 4 12 -2 q4 -6 10 -2" fill="none" stroke="${TOX}" stroke-width="1.2"/>`; });
      s += T(30, 92, "Vibrio cholerae", { a: "start", s: 10, w: 700, c: TOX, it: true });
      [[96, 124], [76, 124], [118, 122]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="3.2" fill="${TOX}"/>`; });
    }
    if (chol && step >= 2) { s += L(76, 128, 64, 192, { c: TOX, w: 1.6, da: "3 3", m: "tx" }) + `<circle cx="63" cy="200" r="4" fill="${TOX}"/>` + T(80, 222, "toxin enters", { s: 9.5, w: 600, c: TOX }) + T(80, 234, "the cell", { s: 9.5, w: 600, c: TOX }); }
    if (chOpen) { [150, 185].forEach((x) => { s += L(x, 236, x, 74, { c: CL, w: 3, m: "cl" }); }); s += T(143, 70, "Cl⁻ secreted", { a: "end", s: 11, w: 800, c: CL }); }
    // paracellular Na⁺ (supporting) in the gap between cells 1 and 2
    if (secretes && step >= 4) { s += L(215, 286, 215, 76, { c: NA, w: 2, da: "5 4", m: "na" }) + T(222, 92, "Na⁺ follows", { a: "start", s: 9.5, w: 700, c: NA }) + T(222, 104, "(between cells)", { a: "start", s: 9, w: 500, c: NA }); }
    // ---- cell 2: co-transport, pump, facilitated diffusion ----
    const coOp = hasCo ? 1 : mode === "glucose" ? 0.7 : 0.3; const coStep = mode === "normal" ? 1 : 0; const pumpStep = mode === "normal" ? 2 : 0;
    if (step >= coStep) {
      s += `<g opacity="${coOp}"><rect x="290" y="126" width="30" height="30" rx="6" fill="#f6e7c4" stroke="${NA}" stroke-width="1.4"/>`;
      s += L(297, 78, 297, 198, { c: NA, w: 2.6, m: "na" }) + L(313, 78, 313, 198, { c: GLU, w: 2.6, m: "glu" });
      s += T(291, 74, "Na⁺", { a: "end", s: 11, w: 800, c: NA }) + T(319, 74, "glucose", { a: "start", s: 11, w: 800, c: GLU });
      s += T(305, 214, "Na⁺–glucose", { s: 9.5, w: 700, c: INK }) + T(305, 226, "co-transporter", { s: 9.5, w: 700, c: INK }) + `</g>`;
      if (!hasCo) { const t = { cholera: ["(still works: not", "blocked by the toxin)"], salt: ["(no glucose: little", "co-transport)"], glucose: ["(some, with Na⁺", "from the lumen)"], water: ["(nothing extra", "to carry)"] }[mode] || ["", ""]; s += T(305, 237, t[0], { s: 9, w: 600, c: GREY }) + T(305, 247, t[1], { s: 9, w: 600, c: GREY }); }
    }
    if (step >= pumpStep) {
      s += `<g opacity="${coOp}"><circle cx="257" cy="292" r="12" fill="#f6e7c4" stroke="${NA}" stroke-width="1.4"/>` + T(257, 256, "ATP", { s: 9.5, w: 700, c: NA });
      s += L(251, 270, 251, 336, { c: NA, w: 2.2, m: "na" }) + L(264, 334, 264, 272, { c: KC, w: 2.2, m: "k" });
      s += T(244, 332, "3Na⁺", { a: "end", s: 9.5, w: 700, c: NA }) + T(270, 332, "2K⁺", { a: "start", s: 9.5, w: 700, c: KC });
      s += T(244, 304, "Na⁺/K⁺ pump", { a: "end", s: 9.5, w: 600, c: NA });
      s += `<rect x="340" y="281" width="13" height="23" rx="3" fill="#d6eedd" stroke="${GLU}" stroke-width="1.3"/>` + L(346.5, 238, 346.5, 336, { c: GLU, w: 2.2, m: "glu" }) + T(356, 322, "glucose", { a: "start", s: 9.5, w: 700, c: GLU }) + `</g>`;
    }
    // ---- cell 3: water by osmosis ----
    const wStep = mode === "normal" ? 4 : mode === "cholera" ? 6 : 0;
    const down = M.order === "LCB";
    if (step >= wStep) {
      const xs = M.worse ? [450, 485, 520] : [455, 515];
      const wv = mode === "water" || mode === "salt" || mode === "glucose" ? 2.6 : M.worse ? 4.2 : 3.6;
      xs.forEach((x) => { s += down ? L(x, 60, x, 388, { c: WAT, w: wv, m: "w", cls: anim ? `cho-flow${U}` : "" }) : L(x, 388, x, 60, { c: WAT, w: wv, m: "w", cls: anim ? `cho-flow${U}` : "" }); });
      s += `<rect x="463" y="${down ? 168 : 168}" width="44" height="30" rx="5" fill="#ffffff" opacity="0.92"/>` + T(485, 181, "H₂O", { s: 12, w: 800, c: WAT }) + T(485, 194, "osmosis", { s: 9, w: 600, c: WAT });
      if (M.worse) s += `<rect x="446" y="226" width="78" height="26" rx="5" fill="#ffffff" opacity="0.92"/>` + T(485, 236, "more water", { s: 9.5, w: 700, c: WAT }) + T(485, 247, "drawn out", { s: 9.5, w: 700, c: WAT });
    }
    // ---- water-potential ladder ----
    const ladStep = mode === "normal" ? 3 : mode === "cholera" ? 5 : 0;
    if (o.ladder !== false && step >= ladStep) {
      s += `<rect x="596" y="28" width="156" height="392" rx="10" fill="#f6f8fb" stroke="#c9d3de"/>`;
      s += T(674, 46, "Water potential, Ψ", { s: 11, w: 700 }) + T(674, 59, "qualitative ranking only", { s: 9, w: 500, c: GREY });
      s += L(636, 82, 636, 392, { c: GREY, w: 1.4 }) + T(674, 76, "higher (less negative)", { s: 9, w: 600, c: GREY }) + T(674, 410, "lower (more negative)", { s: 9, w: 600, c: GREY });
      const pos = { hi: 118, mid: 226, lo: M.worse ? 370 : 334 };
      const ord = M.order.split("");
      const nm = { L: "lumen", C: "epithelial cells", B: "tissue fluid, blood" };
      const fill = { L: "#fdf5df", C: CELL, B: "#fbe3e3" }, st = { L: "#c9a24a", C: CELLS, B: "#b4504f" };
      ["hi", "mid", "lo"].forEach((k, i) => { const key = ord[i]; const y = pos[k]; s += `<circle cx="636" cy="${y}" r="5" fill="${st[key]}"/><rect x="646" y="${y - 12}" width="100" height="24" rx="8" fill="${fill[key]}" stroke="${st[key]}" stroke-width="1.3"/>` + T(696, y + 4, nm[key], { s: 9.5, w: 700 }); });
      s += L(616, pos.hi + 6, 616, pos.lo - 6, { c: WAT, w: 2.6, m: "w" }) + `<text x="608" y="${(pos.hi + pos.lo) / 2}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${WAT}" transform="rotate(-90 608 ${(pos.hi + pos.lo) / 2})">water moves this way</text>`;
    }
    // ---- caption ----
    const capStep = mode === "normal" ? 5 : mode === "cholera" ? 7 : 0;
    if (step >= capStep) s += T(20, 422, M.cap[0], { a: "start", s: 10, w: 500, c: GREY }) + T(20, 435, M.cap[1], { a: "start", s: 10, w: 500, c: GREY });
    return s + "</svg>";
  };

  // Flow chart from toxin to dehydration
  const flowChart = () => {
    uid(); let s = open(760, 210, "flow chart: cholera bacteria secrete a toxin; more chloride ions are secreted into the intestinal lumen; the water potential of the lumen falls below that of the epithelial cells; water moves from the cells into the lumen by osmosis and is replaced from the blood; large volumes of watery faeces; dehydration and loss of ions", marker("g", GREY));
    const box = (x, y, w, t1, t2, fill, stroke, it) => `<rect x="${x}" y="${y}" width="${w}" height="58" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>` + T(x + w / 2, y + 25, t1, { s: 11, w: 700, it }) + T(x + w / 2, y + 41, t2, { s: 9.5, w: 500, c: GREY });
    s += box(10, 20, 170, "Vibrio cholerae", "secretes cholera toxin", "#efe6f7", TOX, true);
    s += box(205, 20, 170, "More Cl⁻ secreted", "into the lumen (Na⁺ follows)", "#f8e3ef", CL);
    s += box(400, 20, 170, "Ψ of lumen falls", "lower (more negative) than cells", "#fdf5df", "#c9a24a");
    s += box(595, 20, 155, "Water leaves cells", "into the lumen by osmosis", "#e3eefa", WAT);
    s += box(400, 128, 170, "Severe watery", "diarrhoea (large volumes)", "#e3eefa", WAT);
    s += box(150, 128, 220, "Dehydration and loss of ions", "can be fatal within hours untreated", "#fbe3e3", "#b4504f");
    s += L(180, 49, 201, 49, { m: "g" }) + L(375, 49, 396, 49, { m: "g" }) + L(570, 49, 591, 49, { m: "g" }) + L(672, 78, 572, 140, { m: "g" }) + L(400, 157, 374, 157, { m: "g" });
    s += T(700, 112, "water replaced from", { s: 9.5, w: 500, c: GREY }) + T(700, 124, "tissue fluid and blood", { s: 9.5, w: 500, c: GREY });
    return s + "</svg>";
  };

  // Labelled epithelium for the labelling question (numbered boxes; no text answers drawn)
  const labelFig = () => {
    uid(); let s = open(760, 330, "section through the intestinal epithelium in cholera with five numbered boxes to label", defsAll());
    s += `<rect x="20" y="20" width="720" height="90" fill="#fdf5df"/><rect x="20" y="236" width="720" height="70" rx="26" fill="#fbe3e3" stroke="#b4504f"/>`;
    [60, 300, 540].forEach((x) => { for (let mx = x + 4; mx <= x + 160 - 9; mx += 9) s += `<rect x="${mx}" y="98" width="5" height="16" rx="2.5" fill="${CELL}" stroke="${CELLS}"/>`; s += `<rect x="${x}" y="112" width="160" height="106" rx="6" fill="${CELL}" stroke="${CELLS}" stroke-width="1.6"/><ellipse cx="${x + 80}" cy="190" rx="20" ry="11" fill="#d9e6f2" stroke="#7b93ad"/>`; });
    s += `<rect x="170" y="98" width="6" height="24" fill="#f1d3e6" stroke="${CL}"/><rect x="182" y="98" width="6" height="24" fill="#f1d3e6" stroke="${CL}"/>` + L(179, 200, 179, 40, { c: CL, w: 3, m: "cl" });
    s += L(585, 270, 585, 40, { c: WAT, w: 3.4, m: "w" }) + L(660, 270, 660, 40, { c: WAT, w: 3.4, m: "w" });
    const num = (x, y, n) => `<rect x="${x - 13}" y="${y - 13}" width="26" height="26" rx="6" fill="#fff" stroke="${INK}" stroke-width="1.6"/>` + T(x, y + 5, String(n), { s: 13, w: 800 });
    s += L(110, 64, 110, 100, { c: INK, w: 1.2 }) + num(110, 52, 1);
    s += L(214, 110, 192, 110, { c: INK, w: 1.2 }) + num(228, 110, 2);
    s += L(206, 60, 184, 60, { c: INK, w: 1.2 }) + num(220, 60, 3);
    s += L(380, 150, 380, 170, { c: INK, w: 1.2 }) + num(380, 140, 4);
    s += L(690, 140, 666, 140, { c: INK, w: 1.2 }) + num(704, 140, 5);
    s += T(380, 324, "Lumen at the top, blood capillary at the bottom. Arrows show the direction of movement.", { s: 10, w: 500, c: GREY });
    return s + "</svg>";
  };

  // ORS composition bar chart (published values) with a "not instructions" note
  const orsChart = () => {
    uid(); const keys = [["sodium", "Na⁺"], ["chloride", "Cl⁻"], ["glucose", "glucose"], ["potassium", "K⁺"], ["citrate", "citrate"]];
    let s = open(760, 330, "bar chart comparing standard WHO ORS and reduced-osmolarity ORS: sodium 90 and 75, chloride 80 and 65, glucose 111 and 75, potassium 20 and 20, citrate 10 and 10 millimoles per litre; total osmolarity 311 and 245", "");
    s += T(20, 22, "Published composition of two WHO ORS formulations (mmol per litre)", { a: "start", s: 12.5, w: 700 });
    const x0 = 70, y0 = 250, sc = 1.6; s += L(x0, 40, x0, y0, { c: GREY, w: 1.2 }) + L(x0, y0, 520, y0, { c: GREY, w: 1.2 });
    [0, 40, 80, 120].forEach((v) => { s += L(x0 - 4, y0 - v * sc, x0, y0 - v * sc, { c: GREY, w: 1 }) + T(x0 - 8, y0 - v * sc + 4, String(v), { a: "end", s: 9.5, w: 500, c: GREY }); });
    keys.forEach(([k, lab], i) => { const gx = x0 + 22 + i * 88; const a = ORS.standard[k], b = ORS.reduced[k];
      s += `<rect x="${gx}" y="${y0 - a * sc}" width="30" height="${a * sc}" fill="#9fb3c8" stroke="#4d6681"/><rect x="${gx + 34}" y="${y0 - b * sc}" width="30" height="${b * sc}" fill="#3e8f7a" stroke="#22604f"/>`;
      s += T(gx + 15, y0 - a * sc - 5, String(a), { s: 9.5, w: 700 }) + T(gx + 49, y0 - b * sc - 5, String(b), { s: 9.5, w: 700 }) + T(gx + 32, y0 + 16, lab, { s: 10.5, w: 700 }); });
    s += `<rect x="545" y="60" width="16" height="12" fill="#9fb3c8" stroke="#4d6681"/>` + T(567, 70, "standard (to 2002)", { a: "start", s: 10.5, w: 600 }) + `<rect x="545" y="82" width="16" height="12" fill="#3e8f7a" stroke="#22604f"/>` + T(567, 92, "reduced osmolarity (2002)", { a: "start", s: 10.5, w: 600 });
    s += T(545, 130, "Total osmolarity (mOsm per litre)", { a: "start", s: 10.5, w: 700 }) + T(545, 148, `standard ${ORS.standard.total} · reduced ${ORS.reduced.total}`, { a: "start", s: 10.5, w: 600 });
    s += T(545, 172, "Blood plasma: about 290", { a: "start", s: 10, w: 500, c: GREY }) + T(545, 186, "(typical value, for comparison)", { a: "start", s: 10, w: 500, c: GREY });
    s += T(20, 290, "Source: WHO/UNICEF expert consultation, 2001 (WHO/FCH/CAH/01.22); WHO/UNICEF joint statement, 2002.", { a: "start", s: 10, w: 500, c: GREY });
    s += T(20, 306, "Composition shown to explain the science only. This is not a recipe, preparation method or dose.", { a: "start", s: 10, w: 700, c: "#8f3434" });
    return s + "</svg>";
  };

  // Hypothetical trial flow (CONSORT-style)
  const trialFlow = () => {
    uid(); const g = TRIAL.groups; const st = stats();
    let s = open(760, 300, `flow diagram of hypothetical Trial H: ${st.totalRand} children randomised after informed consent; ${g.std.randomised} to standard ORS and ${g.imp.randomised} to improved ORS-R; ${st.withdrawnS} and ${st.withdrawnM} withdrew; ${g.std.analysed} and ${g.imp.analysed} analysed`, marker("g", GREY));
    const box = (x, y, w, h, lines, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` + lines.map((t, i) => T(x + w / 2, y + 20 + i * 15, t, { s: i ? 9.5 : 11, w: i ? 500 : 700, c: i ? GREY : INK })).join("");
    s += T(380, 18, "HYPOTHETICAL Trial H (invented for teaching)", { s: 12, w: 700, c: "#8f3434" });
    s += box(230, 30, 300, 50, ["Eligible children assessed", "parent or guardian gives informed consent"], "#eef3f8", "#4d6681");
    s += box(230, 100, 300, 42, [`Randomised: ${st.totalRand}`, "double-blind; drinks look and taste the same"], "#eef3f8", "#4d6681");
    s += box(60, 170, 280, 52, [`Standard ORS: ${g.std.randomised}`, `${st.withdrawnS} withdrew · ${g.std.analysed} analysed`], "#e9eef4", "#4d6681");
    s += box(420, 170, 280, 52, [`Improved ORS-R: ${g.imp.randomised}`, `${st.withdrawnM} withdrew · ${g.imp.analysed} analysed`], "#e3f1ec", "#22604f");
    s += box(130, 240, 500, 46, ["Outcomes recorded for every analysed child", "stool output · need for IV fluids · vomiting · blood sodium · duration"], "#fbf4e4", "#b07a1c");
    s += L(380, 80, 380, 96, { m: "g" }) + L(330, 142, 220, 166, { m: "g" }) + L(430, 142, 540, 166, { m: "g" }) + L(200, 222, 260, 236, { m: "g" }) + L(560, 222, 500, 236, { m: "g" });
    return s + "</svg>";
  };

  // Results table for Trial H (HTML string; every percentage from stats())
  const trialTable = () => {
    const g = TRIAL.groups, st = stats(), f1 = (x) => fix(x, 1), sg = TRIAL.significance;
    const rows = [
      ["Children randomised / analysed", `${g.std.randomised} / ${g.std.analysed}`, `${g.imp.randomised} / ${g.imp.analysed}`, ""],
      ["Mean stool output in first 24 h / g per kg body mass (SD)", `${g.std.stoolMean} (${g.std.stoolSd})`, `${g.imp.stoolMean} (${g.imp.stoolSd})`, sg.stool],
      ["Needed unscheduled intravenous (IV) fluids", `${g.std.iv} (${f1(st.ivS)} %)`, `${g.imp.iv} (${f1(st.ivM)} %)`, sg.iv],
      ["Vomited in first 24 h", `${g.std.vomit} (${f1(st.vS)} %)`, `${g.imp.vomit} (${f1(st.vM)} %)`, sg.vomit],
      ["Low blood sodium, no symptoms, recovered", `${g.std.lowNa} (${f1(st.nS)} %)`, `${g.imp.lowNa} (${f1(st.nM)} %)`, sg.lowNa],
      ["Median duration of diarrhoea / hours", `${g.std.medianHours}`, `${g.imp.medianHours}`, sg.hours],
    ];
    const head = ["Outcome (HYPOTHETICAL data)", "Standard ORS", "Improved ORS-R", "Statistical test"];
    return `<table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  };
  // Grouped bars of the three percentage outcomes in Trial H
  const trialBars = () => {
    uid(); const st = stats(); const data = [["Needed IV fluids", st.ivS, st.ivM], ["Vomited", st.vS, st.vM], ["Low blood sodium", st.nS, st.nM]];
    let s = open(760, 270, `bar chart, hypothetical Trial H: needed IV fluids ${fix(st.ivS)} % standard v ${fix(st.ivM)} % improved; vomited ${fix(st.vS)} % v ${fix(st.vM)} %; low blood sodium ${fix(st.nS)} % v ${fix(st.nM)} %`, "");
    s += T(20, 22, "HYPOTHETICAL Trial H: percentage of analysed children with each outcome", { a: "start", s: 12, w: 700 });
    const x0 = 70, y0 = 220, sc = 5; s += L(x0, 40, x0, y0, { c: GREY, w: 1.2 }) + L(x0, y0, 600, y0, { c: GREY, w: 1.2 });
    [0, 10, 20, 30].forEach((v) => { s += L(x0 - 4, y0 - v * sc, x0, y0 - v * sc, { c: GREY, w: 1 }) + T(x0 - 8, y0 - v * sc + 4, String(v), { a: "end", s: 9.5, w: 500, c: GREY }); });
    s += `<text x="24" y="130" text-anchor="middle" font-size="10" font-weight="600" fill="${GREY}" transform="rotate(-90 24 130)">% of children</text>`;
    data.forEach(([lab, a, b], i) => { const gx = x0 + 40 + i * 175;
      s += `<rect x="${gx}" y="${y0 - a * sc}" width="44" height="${a * sc}" fill="#9fb3c8" stroke="#4d6681"/><rect x="${gx + 50}" y="${y0 - b * sc}" width="44" height="${b * sc}" fill="#3e8f7a" stroke="#22604f"/>`;
      s += T(gx + 22, y0 - a * sc - 5, fix(a), { s: 10, w: 700 }) + T(gx + 72, y0 - b * sc - 5, fix(b), { s: 10, w: 700 }) + T(gx + 47, y0 + 17, lab, { s: 10.5, w: 700 }); });
    s += `<rect x="620" y="70" width="16" height="12" fill="#9fb3c8" stroke="#4d6681"/>` + T(642, 80, "standard ORS", { a: "start", s: 10.5, w: 600 }) + `<rect x="620" y="92" width="16" height="12" fill="#3e8f7a" stroke="#22604f"/>` + T(642, 102, "improved ORS-R", { a: "start", s: 10.5, w: 600 });
    s += T(20, 258, "Invented data for teaching. Only the IV-fluid difference is statistically significant among these three.", { a: "start", s: 10, w: 500, c: GREY });
    return s + "</svg>";
  };

  B.choleraArt = { epithelium, flowChart, labelFig, orsChart, trialFlow, trialTable, trialBars, MODES };
})(window.BIO);
