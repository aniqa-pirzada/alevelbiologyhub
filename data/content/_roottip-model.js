// Root-tip mitosis model (Phase 4 Batch 4, RP4 author). Used by the RP4 virtual practical (data/practicals/rp4.js,
// js/views/bench-roottip.js) and by the Virtual Root-Tip Microscope embedded on the 3.2.10.2 page
// (B.interactives.rootTipMicroscope). Pure data and SVG strings: nothing here touches the DOM.
//
// WHAT IS SIMULATED (an illustration, never a measurement):
//   - A field of view of a toluidine-blue stained onion root-tip squash seen with a ×40 objective. Every image is a
//     drawing made by this code: "simulated image (illustration), not a micrograph".
//   - Each cell is given a stage (interphase, prophase, metaphase, anaphase, telophase) by seeded random sampling from
//     stage proportions. Seeded (mulberry32), so the same seed always gives the same slide.
//   - Onion (Allium cepa) has 2n = 16 chromosomes; every dividing cell is drawn with 16 chromosomes (32 chromatids).
//   - Stage proportions come from ILLUSTRATIVE (hypothetical) phase durations, using the proportion-of-time assumption:
//     in a population of asynchronously dividing cells, the fraction of cells in a stage is taken to equal the
//     fraction of the cell cycle spent in that stage. Durations (hours): G1 8, S 6, G2 4, prophase 1.0, metaphase 0.4,
//     anaphase 0.2, telophase 0.4 (cycle 20 h, mitosis 2 h, so a mitotic index of 0.10 in the meristem). These are
//     chosen to be of a plausible order with prophase the longest and anaphase the shortest mitotic stage; they are not
//     data from a published study.
//   - Zone of elongation: cells have almost stopped dividing; model mitotic index 0.01 (hypothetical).
//   - Real fields differ from one another, so each field's expected proportion of dividing cells is the sample value
//     × a field factor between 0.7 and 1.3 (hypothetical heterogeneity).
//   - Hypothetical treatments P and Q (documented on the pages): P stops spindle fibres forming, so cells that reach
//     the end of metaphase cannot start anaphase (they stay in mitosis); Q stops DNA replication, so cells cannot pass
//     through S phase. Their stage proportions are computed by following a cohort of cells through the cycle
//     (treatmentFractions), assuming: the cells start with ages spread evenly through the cycle; the substance acts at
//     once and completely; no cell dies; daughter cells continue under the same rules. P RAISES the observed index over
//     time (cells accumulate in mitosis although no cell completes division); Q leaves it almost unchanged for a few
//     hours and then LOWERS it to zero. A substance does not have a fixed effect on the index: it depends on where in
//     the cycle it acts and for how long.
//   - Preparation faults change the drawing in ways justified on the pages: tissue taken too far from the tip (zone of
//     elongation: long cells, nucleus off-centre, few dividing); poor staining (faint chromosomes; early prophase cannot
//     be told from interphase); inadequate maceration or no squash (cells overlap in two layers that cannot both be in
//     focus); too much pressure or a sliding coverslip (some cells burst); out-of-focus image.
window.BIO = window.BIO || {};
(function (B) {
  // ---------------- seeded randomness ----------------
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (...parts) => { let h = 2166136261 >>> 0; for (const ch of parts.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };

  // ---------------- stages ----------------
  const STAGES = ["interphase", "prophase", "metaphase", "anaphase", "telophase"];
  const DIVIDING = ["prophase", "metaphase", "anaphase", "telophase"];
  const NAME = { interphase: "Interphase", prophase: "Prophase", metaphase: "Metaphase", anaphase: "Anaphase", telophase: "Telophase", uncertain: "Cannot identify" };
  const N_CHR = 16; // Allium cepa, 2n = 16
  const CYCLE = { G1: 8, S: 6, G2: 4, prophase: 1.0, metaphase: 0.4, anaphase: 0.2, telophase: 0.4 }; // hours (hypothetical)
  const T_CYCLE = +Object.values(CYCLE).reduce((a, b) => a + b, 0).toFixed(6); // 20 h
  const BOUND = (() => { let a = 0; const o = {}; for (const [k, v] of Object.entries(CYCLE)) { o[k] = [a, a + v]; a += v; } return o; })();
  const stageAtAge = (a) => (a < BOUND.prophase[0] ? "interphase" : a < BOUND.metaphase[0] ? "prophase" : a < BOUND.anaphase[0] ? "metaphase" : a < BOUND.telophase[0] ? "anaphase" : "telophase");
  const fromCycle = () => { const p = { interphase: (CYCLE.G1 + CYCLE.S + CYCLE.G2) / T_CYCLE }; DIVIDING.forEach((s) => (p[s] = CYCLE[s] / T_CYCLE)); return p; };

  const FEATURES = {
    interphase: "Nuclear envelope intact; chromatin spread out, so it looks granular, not as separate threads; one or more darker nucleoli. DNA is replicated in the S phase of interphase, but you cannot see that.",
    prophase: "Chromosomes condense and become visible as threads inside the nucleus area; each is two sister chromatids joined at a centromere. The nucleolus disappears and, late in prophase, the nuclear envelope breaks down.",
    metaphase: "No nuclear envelope. The chromosomes are lined up across the equator (middle) of the cell, each still two chromatids, with spindle fibres from opposite poles attached to its centromere.",
    anaphase: "The centromeres divide and the spindle fibres shorten: sister chromatids are pulled apart to opposite poles, centromere first, so they look V-shaped with the arms trailing. Two groups moving apart.",
    telophase: "The chromatids (now chromosomes) have reached the poles and form two compact groups; nuclear envelopes re-form around them and the chromosomes start to uncoil. In plant cells a cell plate (new wall) forms between them.",
  };
  // feedback for each confusion (truth → choice)
  const CONFUSE = {
    "interphase>prophase": "No separate chromosomes can be seen: the chromatin is granular inside an intact nucleus and a nucleolus is visible. This cell is in interphase.",
    "interphase>metaphase": "There is an intact, rounded nucleus with granular chromatin, not a line of condensed chromosomes across the cell: interphase.",
    "interphase>anaphase": "There is one intact nucleus, not two groups of chromatids moving apart: interphase.",
    "interphase>telophase": "There is a single intact nucleus with granular chromatin. A telophase cell has two groups of chromosomes at opposite poles: this one is in interphase.",
    "prophase>interphase": "Look at the nucleus closely: the chromatin has condensed into separate threads (chromosomes), so prophase has begun. A cell in interphase shows granular chromatin only.",
    "prophase>metaphase": "The chromosomes are scattered in the nucleus area, not lined up across the equator of the cell: prophase.",
    "prophase>anaphase": "There is one group of condensed chromosomes, not two groups moving towards opposite poles: prophase.",
    "prophase>telophase": "There is one group of chromosomes in the middle of the cell, not two groups at the poles: prophase.",
    "metaphase>interphase": "The chromosomes are condensed and lined up across the middle of the cell, and there is no nuclear envelope: metaphase.",
    "metaphase>prophase": "All the chromosomes are lined up across the equator of the cell. In prophase they are scattered: this is metaphase.",
    "metaphase>anaphase": "There is still one group of chromosomes, on the equator. In anaphase two separate groups of chromatids move apart towards the poles: this is metaphase.",
    "metaphase>telophase": "One band of chromosomes across the middle, not two groups at the poles: metaphase.",
    "anaphase>interphase": "Two groups of condensed chromatids are moving apart: this cell is dividing (anaphase).",
    "anaphase>prophase": "There are two separate groups moving apart, not one scattered group: anaphase.",
    "anaphase>metaphase": "Two separate groups are moving apart, with V shapes pointing to the poles: the centromeres lead because the spindle fibres pull on them. That is anaphase, not metaphase.",
    "anaphase>telophase": "The chromatids are still on their way to the poles and are V-shaped, centromere first. In telophase they have reached the poles, clump together and new nuclear envelopes form: this is anaphase.",
    "telophase>interphase": "There are two groups of chromosomes at opposite ends of one cell, with a cell plate forming between them: the cell is completing division (telophase).",
    "telophase>prophase": "Two compact groups at opposite poles, not one group in the middle: telophase.",
    "telophase>metaphase": "Two groups at the poles, not one band across the equator: telophase.",
    "telophase>anaphase": "The chromosomes have reached the poles and form two dense groups with nuclear envelopes re-forming and a cell plate between them: telophase. In anaphase they are still moving and V-shaped.",
  };

  // ---------------- cohort model for the hypothetical treatments ----------------
  // kind "spindle": no cell can pass the end of metaphase (arrested in mitosis); kind "dna": no cell can pass the start of
  // S, and cells already in S stop where they are. Ages start evenly spread over [0, 20 h). Deterministic.
  const cache = {};
  function treatmentFractions(kind, hours) {
    const k = kind + ":" + hours; if (cache[k]) return cache[k];
    const N0 = 4000, dt = 0.02, steps = Math.round(hours / dt); let ages = Array.from({ length: N0 }, (_, i) => ((i + 0.5) / N0) * T_CYCLE);
    const MEND = BOUND.metaphase[1], S0 = BOUND.S[0], SEND = BOUND.S[1];
    for (let s = 0; s < steps; s++) {
      const next = [];
      for (const a of ages) {
        let b;
        if (kind === "spindle") b = a < MEND ? Math.min(a + dt, MEND - 1e-6) : a + dt;
        else if (kind === "dna") b = a < S0 ? Math.min(a + dt, S0) : a < SEND ? a : a + dt;
        else b = a + dt;
        if (b >= T_CYCLE) { next.push(b - T_CYCLE, b - T_CYCLE); } else next.push(b);
      }
      ages = next;
    }
    const c = { interphase: 0, prophase: 0, metaphase: 0, anaphase: 0, telophase: 0 };
    let arrested = 0; ages.forEach((a) => { c[stageAtAge(a)]++; if (kind === "spindle" && a >= MEND - 2e-6 && a < MEND) arrested++; });
    const out = { total: ages.length / N0, arrestedFrac: arrested / ages.length }; STAGES.forEach((s) => (out[s] = c[s] / ages.length));
    out.mi = 1 - out.interphase; return (cache[k] = out);
  }

  // ---------------- samples ----------------
  const ELONG = { interphase: 0.99, prophase: 0.005, metaphase: 0.002, anaphase: 0.001, telophase: 0.002 }; // hypothetical
  const SAMPLES = {
    control: { label: "Sample A: root tip meristem, root 1 (control)", short: "A meristem (control)", zone: "meristem" },
    second: { label: "Sample B: root tip meristem, root 2 from the same bulb", short: "B meristem, root 2", zone: "meristem" },
    elong: { label: "Zone of elongation, about 3–5 mm behind the tip (root 1)", short: "Zone of elongation", zone: "elongation" },
    spindle: { label: "Hypothetical treatment P: stops spindle fibres forming", short: "Treatment P", zone: "meristem", treat: "spindle" },
    dna: { label: "Hypothetical treatment Q: stops DNA replication", short: "Treatment Q", zone: "meristem", treat: "dna" },
  };
  const sampleProbs = (id, hours = 4) => { const s = SAMPLES[id]; if (!s) throw new Error("unknown sample " + id); if (s.treat) { const f = treatmentFractions(s.treat, hours); const p = {}; STAGES.forEach((k) => (p[k] = f[k])); return p; } return s.zone === "elongation" ? { ...ELONG } : fromCycle(); };

  // ---------------- chromosome configurations (one per dividing cell) ----------------
  // Coordinates are in units of the nucleus radius u, cell centred on (0,0), division axis vertical (y): the spindle
  // poles are at (0, -POLE) and (0, +POLE). Each chromatid: { cen: [x, y], arms: [[x, y], [x, y]] } (arm tips).
  const POLE = 1.55;
  function chromosomeConfig(stage, r, opts = {}) {
    const cfg = { stage, envelope: "intact", nucleolus: false, chromatin: "condensed", chromosomes: [], spindle: [], nuclei: 1, cellPlate: false, sub: null, arrested: !!opts.arrested };
    const lens = Array.from({ length: N_CHR }, () => 0.42 + 0.26 * r()), cens = Array.from({ length: N_CHR }, () => 0.36 + 0.14 * r());
    const rod = (cx, cy, ang, L, c) => { const dx = Math.cos(ang), dy = Math.sin(ang); return { cen: [cx, cy], arms: [[cx - dx * L * c, cy - dy * L * c], [cx + dx * L * (1 - c), cy + dy * L * (1 - c)]] }; };
    // keep a chromosome inside a circle (centre ctr, radius lim) by shortening its arms about the centromere
    const fit = (ch, ctr, lim) => { const d = (p) => Math.hypot(p[0] - ctr[0], p[1] - ctr[1]); let k = 1; for (let n = 0; n < 60; n++) { const arms = ch.arms.map((a) => [ch.cen[0] + (a[0] - ch.cen[0]) * k, ch.cen[1] + (a[1] - ch.cen[1]) * k]); if (Math.max(...arms.map(d)) <= lim) return { cen: ch.cen, arms }; k *= 0.92; } return { cen: ch.cen, arms: ch.arms.map(() => [...ch.cen]) }; };
    const sis = (ch, off, ang) => { const nx = -Math.sin(ang) * off, ny = Math.cos(ang) * off; const mv = (p) => [p[0] + nx, p[1] + ny]; return { cen: mv(ch.cen), arms: ch.arms.map(mv) }; };
    if (stage === "interphase") { cfg.chromatin = "diffuse"; cfg.nucleolus = true; return cfg; }
    if (stage === "prophase" || opts.arrested) {
      const early = !opts.arrested && (opts.early !== undefined ? opts.early : r() < 0.6); cfg.sub = opts.arrested ? "arrested" : early ? "early" : "late";
      cfg.envelope = opts.arrested ? "none" : early ? "intact" : "breaking"; cfg.nucleolus = early;
      const spread = opts.arrested ? 1.05 : 0.6, lim = opts.arrested ? 1.3 : 0.9; // arms stay inside the envelope (radius 1) until it has broken down
      for (let i = 0; i < N_CHR; i++) { const ang = r() * Math.PI, rad = spread * Math.sqrt(r()), th = r() * 2 * Math.PI; const L = lens[i] * (early ? 1.35 : 1); const one = fit(rod(rad * Math.cos(th), rad * Math.sin(th), ang, L, cens[i]), [0, 0], lim); const off = early ? 0.025 : 0.04; cfg.chromosomes.push({ i, chromatids: 2, pole: 0, parts: [sis(one, off, ang), sis(one, -off, ang)], ang }); }
      if (opts.arrested) cfg.stage = "metaphase"; // in the cycle it is at metaphase, but no spindle: chromosomes not aligned
      return cfg;
    }
    if (stage === "metaphase") {
      cfg.envelope = "none";
      for (let i = 0; i < N_CHR; i++) { const x = -1.2 + (2.4 * (i + 0.5)) / N_CHR + (r() - 0.5) * 0.06; const y = (r() - 0.5) * 0.08; const ang = (i % 2 ? 1 : -1) * (0.5 + 0.6 * r()) + (r() < 0.5 ? 0 : Math.PI); /* arms project to both sides of the plate */ const one = rod(x, y, ang, lens[i] * 0.95, cens[i]);
        // sister chromatids face opposite poles: one just above the equator, one just below
        const up = { cen: [one.cen[0], one.cen[1] - 0.04], arms: one.arms.map((p) => [p[0], p[1] - 0.04]) }, dn = { cen: [one.cen[0], one.cen[1] + 0.04], arms: one.arms.map((p) => [p[0], p[1] + 0.04]) };
        cfg.chromosomes.push({ i, chromatids: 2, pole: 0, parts: [up, dn], ang });
        cfg.spindle.push({ from: [0, -POLE], to: up.cen, chr: i, part: 0 }, { from: [0, POLE], to: dn.cen, chr: i, part: 1 }); }
      return cfg;
    }
    if (stage === "anaphase") {
      cfg.envelope = "none"; const d = Math.max(0.4, Math.min(0.95, opts.progress !== undefined ? opts.progress : 0.4 + 0.5 * r())); cfg.sub = d < 0.6 ? "early" : "late"; // d: 0.4 early … 0.95 late
      // R9-30: the two groups converge as they approach the poles, the chromatids are staggered in two rows so each V is
      // distinct, and late in anaphase the centromeres are about three quarters of the way to the poles
      for (let i = 0; i < N_CHR; i++) { const x0 = (-1.1 + (2.2 * (i + 0.5)) / N_CHR) * (1 - 0.3 * d) + (r() - 0.5) * 0.05; const spreadA = 0.5 + 0.3 * r(); // half-angle of the V
        for (const pole of [-1, 1]) { const cy = pole * (0.12 + d * 1.15 + (i % 2 ? 0.1 : 0)); const L = lens[i] * 0.9, c = cens[i];
          // V shape: centromere leads towards the pole; both arms trail back towards the equator
          const trail = (len) => pole * Math.max(0.03, Math.abs(cy) - Math.cos(spreadA) * len); // arms trail towards, never past, the equator
          const a1 = [x0 - Math.sin(spreadA) * L * c, trail(L * c)], a2 = [x0 + Math.sin(spreadA) * L * (1 - c), trail(L * (1 - c))];
          cfg.chromosomes.push({ i, chromatids: 1, pole, parts: [{ cen: [x0, cy], arms: [a1, a2] }] }); cfg.spindle.push({ from: [0, pole * POLE], to: [x0, cy], chr: i, part: pole }); } }
      return cfg;
    }
    if (stage === "telophase") {
      cfg.envelope = "reforming"; cfg.nuclei = 2; cfg.cellPlate = true; cfg.sub = r() < 0.5 ? "early" : "late"; cfg.plateFrac = cfg.sub === "early" ? 0.55 : 0.9;
      for (let i = 0; i < N_CHR; i++) for (const pole of [-1, 1]) { const th = r() * 2 * Math.PI, rad = 0.28 * Math.sqrt(r()); const cx = rad * Math.cos(th), cy = pole * 1.12 + rad * Math.sin(th) * 0.8; const ang = r() * Math.PI; const one = fit(rod(cx, cy, ang, lens[i] * 0.55, cens[i]), [0, pole * 1.12], 0.46); cfg.chromosomes.push({ i, chromatids: 1, pole, parts: [one] }); }
      cfg.nucleusCentres = [[0, -1.12], [0, 1.12]]; return cfg;
    }
    throw new Error("unknown stage " + stage);
  }

  // Check that a configuration shows the chromosome behaviour of its stage. Returns a list of problems (empty = valid).
  function validateConfig(cfg) {
    const P = []; const chr = cfg.chromosomes; const nCt = chr.reduce((a, c) => a + ((c && c.parts) || []).length, 0);
    const near = (a, b, t = 1e-6) => Math.abs(a[0] - b[0]) < t && Math.abs(a[1] - b[1]) < t;
    if (!STAGES.includes(cfg.stage)) P.push("unknown stage");
    if (cfg.stage === "interphase") { if (chr.length) P.push("interphase shows condensed chromosomes"); if (cfg.envelope !== "intact") P.push("interphase nucleus must be intact"); if (!cfg.nucleolus) P.push("interphase nucleolus missing"); if (cfg.chromatin !== "diffuse") P.push("interphase chromatin must be diffuse"); if (cfg.spindle.length) P.push("interphase has no spindle"); return P; }
    if (nCt !== 2 * N_CHR) P.push(`expected ${2 * N_CHR} chromatids, found ${nCt}`);
    chr.forEach((c) => { if (!c.parts || c.parts.length !== c.chromatids) P.push("chromatid count mismatch on chromosome " + c.i); });
    const prophaseLike = cfg.stage === "prophase" || cfg.arrested;
    if (prophaseLike) {
      if (chr.length !== N_CHR || chr.some((c) => c.chromatids !== 2)) P.push("prophase: 16 chromosomes of two chromatids each");
      if (cfg.stage === "prophase" && !["intact", "breaking"].includes(cfg.envelope)) P.push("prophase envelope intact or breaking down");
      if (cfg.arrested && cfg.envelope !== "none") P.push("arrested cell has no envelope");
      if (cfg.spindle.length) P.push("no spindle attachment drawn in prophase or in a cell without spindle fibres");
      const lim = cfg.arrested ? 1.12 : 0.7; if (chr.some((c) => Math.hypot(...c.parts[0].cen) > lim + 0.08)) P.push("prophase chromosomes outside the nucleus area");
      const ys = chr.map((c) => c.parts[0].cen[1]); if (Math.max(...ys) - Math.min(...ys) < 0.35) P.push("prophase chromosomes look aligned (metaphase-like)");
      chr.forEach((c) => { const [a, b] = c.parts; if (!a || !b) return; const d = Math.hypot(a.cen[0] - b.cen[0], a.cen[1] - b.cen[1]); if (d > 0.15) P.push("sister chromatids not joined at the centromere " + c.i); });
      const tipLim = cfg.arrested ? 1.4 : 0.98; chr.forEach((c) => c.parts.forEach((p) => { if ([p.cen, ...p.arms].some((q) => Math.hypot(...q) > tipLim)) P.push(`${cfg.arrested ? "arrested" : "prophase"} chromosome arm outside ${cfg.arrested ? "the cell area" : "the nuclear envelope"} ` + c.i); }));
      return P;
    }
    if (cfg.stage === "metaphase") {
      if (cfg.envelope !== "none") P.push("metaphase: no nuclear envelope");
      if (chr.length !== N_CHR || chr.some((c) => c.chromatids !== 2)) P.push("metaphase: 16 chromosomes, each two chromatids");
      chr.forEach((c) => c.parts.forEach((p) => { if (Math.abs(p.cen[1]) > 0.14) P.push("metaphase centromere off the equator " + c.i); }));
      chr.forEach((c) => { const [a, b] = c.parts; if (!(a.cen[1] < 0 && b.cen[1] > 0)) P.push("metaphase sister chromatids must face opposite poles " + c.i); if (Math.abs(a.cen[0] - b.cen[0]) > 1e-6) P.push("sisters misaligned " + c.i); });
      chr.forEach((c) => c.parts.forEach((p) => { if (p.arms.some((q) => Math.abs(q[0]) > 1.68 || Math.abs(q[1]) > 1.1)) P.push("metaphase arm outside the cell " + c.i); }));
      if (cfg.spindle.length !== 2 * N_CHR) P.push("metaphase: a spindle fibre from each pole to each chromosome");
      cfg.spindle.forEach((f) => { const c = chr.find((x) => x.i === f.chr); const p = c && c.parts[f.part]; if (!p || !near(f.to, p.cen)) P.push("spindle fibre not attached at a centromere " + f.chr); if (Math.abs(f.from[1]) !== POLE || (p && Math.sign(f.from[1]) !== Math.sign(p.cen[1]))) P.push("fibre from the wrong pole " + f.chr); });
      return P;
    }
    if (cfg.stage === "anaphase") {
      if (cfg.envelope !== "none") P.push("anaphase: no nuclear envelope");
      const up = chr.filter((c) => c.pole === -1), dn = chr.filter((c) => c.pole === 1);
      if (up.length !== N_CHR || dn.length !== N_CHR || chr.some((c) => c.chromatids !== 1)) P.push("anaphase: 16 single chromatids moving to each pole");
      for (let i = 0; i < N_CHR; i++) { if (up.filter((c) => c.i === i).length !== 1 || dn.filter((c) => c.i === i).length !== 1) P.push("anaphase: sisters of chromosome " + i + " must go to opposite poles"); }
      chr.forEach((c) => { const p = c.parts[0]; if (Math.sign(p.cen[1]) !== c.pole) P.push("chromatid on the wrong side " + c.i); if (p.arms.some((a) => Math.abs(a[1]) > Math.abs(p.cen[1]) + 1e-9)) P.push("centromere must lead (arms trail towards the equator) " + c.i); });
      chr.forEach((c) => { if ([c.parts[0].cen, ...c.parts[0].arms].some((q) => Math.abs(q[0]) > 1.6 || Math.abs(q[1]) > POLE)) P.push("anaphase chromatid outside the spindle " + c.i); });
      if (cfg.spindle.length !== 2 * N_CHR) P.push("anaphase: a fibre to every chromatid");
      cfg.spindle.forEach((f) => { const c = chr.find((x) => x.i === f.chr && x.pole === f.part); if (!c || !near(f.to, c.parts[0].cen) || Math.sign(f.from[1]) !== c.pole || Math.abs(f.from[1]) !== POLE) P.push("anaphase fibre not attached at the centromere from its own pole " + f.chr); });
      return P;
    }
    if (cfg.stage === "telophase") {
      const up = chr.filter((c) => c.pole === -1), dn = chr.filter((c) => c.pole === 1);
      if (up.length !== N_CHR || dn.length !== N_CHR || chr.some((c) => c.chromatids !== 1)) P.push("telophase: a group of 16 chromosomes at each pole");
      if (cfg.nuclei !== 2 || cfg.envelope !== "reforming") P.push("telophase: two nuclear envelopes re-forming");
      if (!cfg.cellPlate) P.push("telophase (plant): cell plate forming");
      chr.forEach((c) => { const ctr = cfg.nucleusCentres[c.pole === -1 ? 0 : 1]; if ([c.parts[0].cen, ...c.parts[0].arms].some((q) => Math.hypot(q[0] - ctr[0], q[1] - ctr[1]) > 0.5)) P.push("telophase chromosome (arm or centromere) outside its new nucleus " + c.i); });
      if (cfg.spindle.length) P.push("telophase: spindle not drawn (breaking down)");
      return P;
    }
    return P;
  }

  // ---------------- drawing ----------------
  const C = { bg: "#f6f2f9", wall: "#8f73ad", cyto: "#e7dcef", nuc: "#a9b2e3", chromatin: "#3b4aa3", nucleolus: "#27337f", chr: "#1d2775", plate: "#7a5d9c", fibre: "#c0661f" };
  const f2 = (v) => +v.toFixed(2);
  // A cell drawn at (0,0) in its own coordinates: w × h, nucleus radius u. opts: { faint, ruptured, spindle, r (rng for granules), detail }
  function drawCell(cell, opts = {}) {
    const { w, h, u } = cell, cfg = cell.cfg, nx = cell.nx || 0, ny = cell.ny || 0; const faint = opts.faint || cell.faint; const r = rng(cell.seed || 1);
    const chrCol = faint ? "#8e98d3" : C.chr, sw = Math.max(0.7, u * (cfg.sub === "early" && cfg.stage === "prophase" ? 0.05 : 0.07));
    let s = `<g data-stage="${cfg.stage}"${cfg.arrested ? ' data-arrested="1"' : ""}>`;
    s += cell.ruptured ? `<path d="M${f2(-w / 2)} ${f2(-h / 2 + 6)} Q${f2(-w / 2)} ${f2(-h / 2)} ${f2(-w / 2 + 6)} ${f2(-h / 2)} L${f2(w * 0.1)} ${f2(-h / 2)} M${f2(w / 2)} ${f2(-h * 0.2)} L${f2(w / 2)} ${f2(h / 2 - 6)} Q${f2(w / 2)} ${f2(h / 2)} ${f2(w / 2 - 6)} ${f2(h / 2)} L${f2(-w * 0.2)} ${f2(h / 2)}" fill="none" stroke="${C.wall}" stroke-width="1.4"/><rect x="${f2(-w / 2 + 2)}" y="${f2(-h / 2 + 2)}" width="${f2(w - 4)}" height="${f2(h - 4)}" rx="5" fill="${C.cyto}" opacity=".55"/>`
      : `<rect x="${f2(-w / 2)}" y="${f2(-h / 2)}" width="${f2(w)}" height="${f2(h)}" rx="5" fill="${C.cyto}" stroke="${C.wall}" stroke-width="1.4"/>`;
    const X = (p) => f2(nx + p[0] * u), Y = (p) => f2(ny + p[1] * u);
    if (cell.spilled) { // burst cell whose nucleus contents spilled out through the broken wall: stage cannot be seen
      const g = rng((cell.seed || 1) + 11); for (let i = 0; i < 18; i++) { const x = w * 0.15 + g() * w * 0.55, y0 = (g() - 0.5) * h * 0.8, y = x > w / 2 - 2 ? -h * 0.22 - Math.abs(y0) * 0.45 : y0, rr = u * (0.06 + g() * 0.12); s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(rr * 1.6)}" ry="${f2(rr)}" transform="rotate(${Math.round(g() * 180)} ${f2(x)} ${f2(y)})" fill="${faint ? "#a9b0dd" : "#3b4aa3"}" opacity=".6"/>`; }
      s += `<ellipse cx="${f2(w * 0.25)}" cy="${f2(-h * 0.05)}" rx="${f2(u * 1.1)}" ry="${f2(u * 0.55)}" fill="${faint ? "#cfd3ee" : "#8f9bd6"}" opacity=".45" data-spilled="1"/>`;
      return s + ruptureBits(cell, r) + "</g>"; }
    if (cfg.stage === "interphase" || (cfg.stage === "prophase" && faint && cfg.sub === "early" && !opts.reveal)) {
      // diffuse chromatin; with a poor stain, an early prophase nucleus cannot be told apart from interphase
      s += `<circle cx="${f2(nx)}" cy="${f2(ny)}" r="${f2(u)}" fill="${faint ? "#cfd3ee" : C.nuc}" stroke="${faint ? "#a3abd9" : "#5f6cbf"}" stroke-width="1"/>`;
      const g = rng((cell.seed || 1) + 7); for (let i = 0; i < 26; i++) { const a = g() * 6.283, rr = u * 0.85 * Math.sqrt(g()); s += `<circle cx="${f2(nx + rr * Math.cos(a))}" cy="${f2(ny + rr * Math.sin(a))}" r="${f2(u * 0.07)}" fill="${faint ? "#a9b0dd" : C.chromatin}" opacity=".75"/>`; }
      // faint nucleolus in both cases, so a poorly stained early prophase cell really cannot be told from interphase
      s += `<circle cx="${f2(nx + u * 0.25)}" cy="${f2(ny - u * 0.2)}" r="${f2(u * 0.27)}" fill="${faint ? "#a9b0dd" : C.nucleolus}"${cfg.stage === "prophase" ? ' data-hidden-prophase="1"' : ""}/>`;
      return s + ruptureBits(cell, r) + "</g>";
    }
    if (cfg.stage === "prophase" || cfg.arrested) {
      if (cfg.envelope === "intact") s += `<circle cx="${f2(nx)}" cy="${f2(ny)}" r="${f2(u)}" fill="${faint ? "#dcdff3" : "#c3c9ec"}" stroke="#5f6cbf" stroke-width="1"/>`;
      if (cfg.envelope === "breaking") s += `<circle cx="${f2(nx)}" cy="${f2(ny)}" r="${f2(u)}" fill="#d3d7f1" stroke="#5f6cbf" stroke-width="1" stroke-dasharray="3 4"/>`;
      if (cfg.nucleolus) s += `<circle cx="${f2(nx + u * 0.3)}" cy="${f2(ny - u * 0.25)}" r="${f2(u * 0.2)}" fill="${faint ? "#a9b0dd" : C.nucleolus}" opacity=".7"/>`;
    }
    if (cfg.stage === "telophase") cfg.nucleusCentres.forEach((p) => { s += `<circle cx="${X(p)}" cy="${Y(p)}" r="${f2(u * 0.52)}" fill="#d3d7f1" stroke="#5f6cbf" stroke-width="1" stroke-dasharray="${cfg.sub === "late" ? "none" : "3 3"}"/>`; });
    if (cfg.cellPlate) { const L = w * cfg.plateFrac; s += `<line x1="${f2(nx - L / 2)}" y1="${f2(ny)}" x2="${f2(nx + L / 2)}" y2="${f2(ny)}" stroke="${C.plate}" stroke-width="1.6" stroke-dasharray="${cfg.sub === "late" ? "none" : "2 2"}" data-plate="1"/>`; }
    if (opts.spindle && cfg.spindle.length) s += cfg.spindle.map((f) => `<line x1="${X(f.from)}" y1="${Y(f.from)}" x2="${X(f.to)}" y2="${Y(f.to)}" stroke="${C.fibre}" stroke-width="${f2(Math.max(0.4, u * 0.025))}" opacity=".85" data-fibre="1"/>`).join("") + [-1, 1].map((p) => `<circle cx="${f2(nx)}" cy="${f2(ny + p * POLE * u)}" r="${f2(u * 0.06)}" fill="${C.fibre}"/>`).join("");
    const path = (part, wid) => `<path d="M${X(part.arms[0])} ${Y(part.arms[0])} L${X(part.cen)} ${Y(part.cen)} L${X(part.arms[1])} ${Y(part.arms[1])}" fill="none" stroke="${chrCol}" stroke-width="${f2(wid)}" stroke-linecap="round" stroke-linejoin="round" data-ct="1"/>`;
    cfg.chromosomes.forEach((c) => { s += `<g data-chr="${c.i}" data-pole="${c.pole}">${c.parts.map((p) => path(p, sw)).join("")}</g>`; });
    return s + ruptureBits(cell, r) + "</g>";
  }
  const ruptureBits = (cell, r) => (cell.ruptured ? Array.from({ length: 7 }, () => `<circle cx="${f2(cell.w / 2 + 2 + r() * 9)}" cy="${f2((r() - 0.5) * cell.h * 0.6)}" r="${f2(0.8 + r() * 1.6)}" fill="#55609e" opacity=".7"/>`).join("") : "");

  // SVG-level check: the drawing contains exactly the chromatids of its configuration, and a dividing cell's drawing
  // has 32 of them (DNA conserved through mitosis). Used by the test script.
  function validateDrawing(cell, svg) {
    // chromatids are drawn (and counted) only where they can be seen: not in a burst cell whose contents spilled, nor in
    // an early prophase cell hidden by a poor stain
    const hidden = cell.spilled || (cell.cfg.stage === "prophase" && cell.faint && cell.cfg.sub === "early");
    const P = []; const n = (svg.match(/data-ct="1"/g) || []).length; const exp = cell.cfg.stage === "interphase" || hidden ? 0 : 2 * N_CHR;
    if (n !== exp) P.push(`drawing shows ${n} chromatids, expected ${exp}`);
    if (!svg.includes(`data-stage="${cell.cfg.stage}"`)) P.push("stage tag missing");
    if (!hidden && cell.cfg.stage === "telophase" && !/data-plate="1"/.test(svg)) P.push("cell plate missing in telophase");
    return P;
  }

  // ---------------- fields of view ----------------
  const R_FOV = 200, VIEW = 440, CX = 220, CY = 220;
  // prep: { zone, stain (0–1), layered (bool), ruptured (bool) }
  function makeField(sampleId, seed, fieldIndex, prep = {}, hours = 4) {
    const S = SAMPLES[sampleId]; const zone = prep.zone || S.zone; const r = rng(hash(sampleId, hours, seed, fieldIndex, zone));
    const probs = zone === "elongation" ? { ...ELONG } : sampleProbs(sampleId, hours); const mi = 1 - probs.interphase; const factor = 0.7 + 0.6 * r(); const miF = Math.min(0.95, mi * factor);
    const pick = () => { if (r() >= miF) return "interphase"; let u = r() * mi; for (const k of DIVIDING) { u -= probs[k]; if (u <= 0) return k; } return "telophase"; };
    const cells = []; let id = 0; const faint = (prep.stain !== undefined ? prep.stain : 1) < 0.6;
    const add = (x, y, w, h, layer) => {
      const dist = Math.hypot(x, y); if (dist > R_FOV + Math.max(w, h) * 0.6) return;
      const stage = pick(); const arrested = S.treat === "spindle" && stage === "metaphase"; // no spindle: every metaphase cell is held in mitosis
      const u = Math.min(w, h) * (zone === "elongation" ? 0.3 : 0.29); const cs = hash(seed, fieldIndex, id, sampleId);
      const cr = rng(cs); const cfg = chromosomeConfig(arrested ? "prophase" : stage, cr, { arrested });
      const cell = { id: id++, x: CX + x, y: CY + y, w, h, u, rot: (r() - 0.5) * 10, layer, cfg, seed: cs, faint, nx: (r() - 0.5) * 2, ny: zone === "elongation" ? (r() < 0.5 ? -1 : 1) * h * (0.16 + 0.14 * r()) : (r() - 0.5) * 2, countable: dist <= R_FOV - 4 };
      if (prep.ruptured && r() < 0.2) { cell.ruptured = true; cell.spilled = r() < 0.5; } // half of the burst cells lost their nucleus contents
      cells.push(cell);
    };
    if (zone === "elongation") { for (let cx = -240; cx <= 240; cx += 50) { const off = r() * 130; for (let cy = -300 + off; cy <= 300; cy += 132) add(cx + (r() - 0.5) * 5, cy, 42 + r() * 4, 112 + r() * 14, 1); } }
    else { for (let cx = -230; cx <= 230; cx += 51) for (let cy = -230; cy <= 230; cy += 51) add(cx + (r() - 0.5) * 8, cy + (r() - 0.5) * 8, 40 + r() * 7, 39 + r() * 8, 1); }
    if (prep.layered) { const step = zone === "elongation" ? [50, 132] : [51, 51]; const n0 = cells.length; for (let cx = -230 + step[0] / 2; cx <= 230; cx += step[0]) for (let cy = -230 + step[1] / 2; cy <= 230; cy += step[1]) if (r() < 0.6) add(cx + (r() - 0.5) * 14, cy + (r() - 0.5) * 14, zone === "elongation" ? 42 : 42 + r() * 6, zone === "elongation" ? 118 : 41 + r() * 6, 2); cells.slice(n0).forEach((c) => (c.layer = 2)); }
    const counts = tally(cells.filter((c) => c.countable).map((c) => c.cfg.stage));
    return { sampleId, seed, fieldIndex, zone, prep, cells, counts, mi: miIndex(counts), factor, hours };
  }
  const tally = (stages) => { const c = { interphase: 0, prophase: 0, metaphase: 0, anaphase: 0, telophase: 0 }; stages.forEach((s) => { if (s in c) c[s]++; }); return c; };
  const dividingOf = (c) => DIVIDING.reduce((a, k) => a + (c[k] || 0), 0);
  const totalOf = (c) => STAGES.reduce((a, k) => a + (c[k] || 0), 0) + (c.uncertain || 0);
  const miIndex = (c) => { const t = totalOf(c); return t ? dividingOf(c) / t : 0; };

  // Field drawing: the whole field (cells layer 1 then layer 2), clipped to the circular field of view.
  function drawField(field, o = {}) {
    const uid = "rt" + Math.random().toString(36).slice(2, 8); const blur1 = o.blur1 || 0, blur2 = o.blur2 === undefined ? blur1 : o.blur2;
    const cellG = (c) => `<g class="rt-cell${c.countable ? " rt-count" : ""}" data-id="${c.id}" transform="translate(${f2(c.x)} ${f2(c.y)}) rotate(${f2(c.rot)})"${c.countable ? ` tabindex="-1" role="button" aria-label="cell ${c.id + 1}${o.marks && o.marks[c.id] ? ", identified as " + NAME[o.marks[c.id]] : ""}"` : ""}>${drawCell(c, { spindle: false })}${o.marks && o.marks[c.id] ? markBadge(c, o.marks[c.id], o.wrong && o.wrong[c.id]) : ""}${o.sel === c.id ? `<rect x="${f2(-c.w / 2 - 3)}" y="${f2(-c.h / 2 - 3)}" width="${f2(c.w + 6)}" height="${f2(c.h + 6)}" rx="7" fill="none" stroke="#f0a020" stroke-width="3"/>` : ""}</g>`;
    const L1 = field.cells.filter((c) => c.layer === 1).map(cellG).join(""), L2 = field.cells.filter((c) => c.layer === 2).map(cellG).join("");
    return `<svg viewBox="0 0 ${VIEW} ${VIEW}" width="${VIEW}" role="group" aria-label="${o.aria || "Simulated field of view of a stained root-tip squash"}" style="max-width:100%;height:auto;display:block;background:#111" data-field="${field.fieldIndex}">
      <defs><clipPath id="${uid}c"><circle cx="${CX}" cy="${CY}" r="${R_FOV}"/></clipPath><filter id="${uid}b1" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${f2(blur1)}"/></filter><filter id="${uid}b2" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${f2(blur2)}"/></filter></defs>
      <rect width="${VIEW}" height="${VIEW}" fill="#111"/>
      <g clip-path="url(#${uid}c)"><rect width="${VIEW}" height="${VIEW}" fill="${C.bg}"/>
        <g${blur1 > 0.05 ? ` filter="url(#${uid}b1)"` : ""}>${L1}</g>${L2 ? `<g opacity=".72"${blur2 > 0.05 ? ` filter="url(#${uid}b2)"` : ""}>${L2}</g>` : ""}</g>
      <circle cx="${CX}" cy="${CY}" r="${R_FOV}" fill="none" stroke="#333" stroke-width="3"/>
      <text x="8" y="432" font-size="12" fill="#e6e6e6">×40</text></svg>`.replace(/\s*\n\s*/g, " ");
  }
  const ABBR = { interphase: "I", prophase: "P", metaphase: "M", anaphase: "A", telophase: "T", uncertain: "?" };
  const markBadge = (c, st, wrong) => `<g transform="rotate(${f2(-c.rot)})"><circle cx="${f2(-c.w / 2 + 8)}" cy="${f2(-c.h / 2 + 8)}" r="7.5" fill="${wrong ? "#b4504f" : st === "interphase" ? "#5d6d7e" : st === "uncertain" ? "#9a7b2c" : "#1f8a85"}"/><text x="${f2(-c.w / 2 + 8)}" y="${f2(-c.h / 2 + 12)}" font-size="10.5" font-weight="700" text-anchor="middle" fill="#fff">${ABBR[st]}</text></g>`;

  // Large single-cell view for the inspector (and for question drawings). opts: { spindle, faint, reveal, label }
  function cellSVG(cell, o = {}) {
    const pad = 10, w = cell.w + pad * 2 + (cell.ruptured ? 14 : 0), h = cell.h + pad * 2; const blur = o.blur || 0; const uid = "rc" + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="${f2(-w / 2)} ${f2(-h / 2)} ${f2(w)} ${f2(h)}" width="${o.width || 260}" role="img" aria-label="${o.aria || "Simulated drawing of one cell from the field, magnified"}" style="max-width:100%;height:auto;display:block;background:${C.bg};border-radius:8px"><defs><filter id="${uid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${f2(blur * 0.25)}"/></filter></defs><g${blur > 0.05 ? ` filter="url(#${uid})"` : ""}>${drawCell(cell, { spindle: o.spindle, faint: o.faint, reveal: o.reveal })}</g></svg>`;
  }
  // A standard cell of a given stage, for question drawings (deterministic).
  function exampleCell(stage, seed = 11, extra = {}) { const cr = rng(seed * 97 + 3); const cfg = chromosomeConfig(stage, cr, extra); return { id: 0, x: 0, y: 0, w: 58, h: 64, u: 17, rot: 0, layer: 1, cfg, seed, nx: 0, ny: 0 }; }

  // Panel of numbered example cells (simulated), for label and MCQ questions.
  // o.rot: optional rotation in degrees for each cell (so a question can show the cells at other angles than the Method
  // figure); o.anaphase: how far the chromatids have moved (0.4 just separated … 0.95 near the poles; default 0.92, so the
  // V-shaped chromatids are about two thirds of the way to each pole and cannot be mistaken for metaphase).
  function stagePanel(stages, o = {}) {
    // o.cols: cells per row (default all in one row); a last, shorter row is centred. A label question uses 3 columns
    // so that each cell stays large enough to identify on a phone (P-01).
    const cw = 172, ch = 180, gap = 12, n = stages.length, cols = Math.min(n, o.cols || n), rows = Math.ceil(n / cols), W = cols * cw + (cols - 1) * gap, rowH = ch + 10, H = rows * rowH - 10;
    const pos = (i) => { const r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols), off = ((cols - inRow) * (cw + gap)) / 2; return [off + (i % cols) * (cw + gap), r * rowH]; };
    const cells = stages.map((st, i) => { const c = exampleCell(st, (o.seed || 5) + i * 13, st === "prophase" ? { early: false } : st === "anaphase" ? { progress: o.anaphase || 0.92 } : {}); const rot = (o.rot || [])[i] || 0; const [x, y] = pos(i); return `<g transform="translate(${x + cw / 2} ${y + ch / 2 + 6}) rotate(${rot}) scale(2.4)">${drawCell(c, { spindle: !!o.spindle })}</g><circle cx="${x + 16}" cy="${y + 18}" r="13" fill="#16263a"/><text x="${x + 16}" y="${y + 23}" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">${o.letters ? String.fromCharCode(65 + i) : i + 1}</text>`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H + 34}" width="${W}" role="img" aria-label="${o.aria || "Simulated drawings of root-tip cells, numbered"}" style="max-width:100%;height:auto;background:${C.bg}">${cells}<text x="${W / 2}" y="${H + 28}" font-size="${o.cols ? 15 : 12}" text-anchor="middle" fill="#3f4f63">simulated drawings (illustration), not micrographs${o.spindle ? "; spindle fibres drawn in orange for clarity" : ""}</text></svg>`;
  }

  // ---------------- mitotic index answers ----------------
  // Accept a fraction (7/52), a decimal (0.13) or a percentage (13 %). Returns the value as a decimal, or null.
  function parseMI(s) {
    const t = String(s || "").trim().replace(/,/g, ".").replace(/\s+/g, "");
    let m = t.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); if (m) return +m[2] ? +m[1] / +m[2] : null;
    m = t.match(/^(\d*\.?\d+)%$/); if (m) return +m[1] / 100;
    m = t.match(/^(\d*\.?\d+)$/); if (m) { const v = +m[1]; return v <= 1 ? v : null; }
    return null;
  }
  // Judge a student's mitotic index against counts. Returns { ok, value, truth, msg }.
  function judgeMI(input, counts) {
    const v = parseMI(input), d = dividingOf(counts), t = totalOf(counts), truth = t ? d / t : 0; const pct = /%/.test(String(input)); const num = String(input).trim();
    if (v === null) return { ok: false, value: null, truth, msg: /^\d+(\.\d+)?$/.test(num) && +num > 1 ? "A number above 1 is not a mitotic index as a decimal. If you meant a percentage, add the % sign." : "Give the mitotic index as a fraction (for example 6/50), a decimal (0.12) or a percentage (12 %)." };
    const tol = Math.max(0.0051, truth * 0.02);
    if (Math.abs(v - truth) <= tol) return { ok: true, value: v, truth, msg: `✓ ${d} dividing ÷ ${t} cells = ${truth.toFixed(3)} (${(truth * 100).toFixed(1)} %).` };
    const withI = t ? (d + counts.interphase) / t : 0, onlyI = t ? counts.interphase / t : 0, ratio = counts.interphase ? d / counts.interphase : 0;
    if (Math.abs(v - onlyI) <= tol || Math.abs(v - withI) <= tol) return { ok: false, value: v, truth, msg: "The numerator is the number of cells in a stage of mitosis (prophase, metaphase, anaphase and telophase). Interphase cells are not dividing: they belong in the total only." };
    if (Math.abs(v - ratio) <= tol) return { ok: false, value: v, truth, msg: "You divided by the number of interphase cells. Divide by the TOTAL number of cells counted (dividing and non-dividing)." };
    if (!pct && Math.abs(v * 100 - truth * 100) > tol * 100 && Math.abs(v - truth * 100) < 0.5) return { ok: false, value: v, truth, msg: "That looks like a percentage written without the % sign." };
    return { ok: false, value: v, truth, msg: `Not quite: mitotic index = cells in stages of mitosis ÷ total number of cells = ${d} ÷ ${t}.` };
  }
  // Identification judgement for one cell; acceptable alternatives where the image genuinely cannot decide.
  function judgeCell(cell, choice, ctx = {}) {
    const truth = cell.cfg.stage; const hiddenProphase = truth === "prophase" && cell.faint && cell.cfg.sub === "early";
    if (ctx.blurred) return { ok: false, verdict: "focus", msg: "The image is out of focus: the chromosomes cannot be resolved, so this identification is a guess. Use the fine focus until the cell walls and chromosomes look sharp, then identify the cell." };
    if (cell.spilled) return { ok: choice === "uncertain", verdict: choice === "uncertain" ? "ok" : "uncertain", msg: "This cell burst when the coverslip was pressed too hard (or slid sideways) and the contents of its nucleus spilled out, so its stage cannot be identified. Record it as \u201ccannot identify\u201d, or leave such damaged areas out of your counts." };
    if (cell.ruptured && choice !== truth) return { ok: choice === "uncertain", verdict: "uncertain", msg: `This cell is damaged (its wall burst), but its nucleus is intact, so its stage can still be seen: ${NAME[truth].toLowerCase()}. ${FEATURES[truth]}` };
    if (cell.ruptured) return { ok: true, verdict: "ok", msg: `\u2713 ${NAME[truth]}. The wall has burst, but the nucleus is intact, so the stage can still be identified.` };
    if (cell.cfg.arrested) return { ok: choice === "prophase" || choice === "metaphase", verdict: choice === "prophase" || choice === "metaphase" ? "ok" : "no", msg: "This cell is stuck in mitosis: its chromosomes are condensed and each is still two chromatids, but treatment P stopped the spindle forming, so they are not lined up on the equator and cannot be separated. It counts as a dividing cell (accepted as prophase or metaphase)." };
    if (hiddenProphase) return { ok: ["interphase", "prophase", "uncertain"].includes(choice), verdict: "uncertain", msg: "With this poor stain the chromosomes are too faint to see. This cell is in fact in early prophase (the model knows), but no one could tell that from this slide: a well-stained slide shows the threads clearly. Poor staining makes dividing cells look like interphase, so the mitotic index is underestimated." };
    if (choice === "uncertain") return { ok: false, verdict: "uncertain", msg: `You could not decide. Look for these features. ${NAME[truth]}: ${FEATURES[truth]}` };
    if (choice === truth) return { ok: true, verdict: "ok", msg: `✓ ${NAME[truth]}. ${FEATURES[truth]}` };
    return { ok: false, verdict: "no", msg: `Not ${NAME[choice].toLowerCase()}. ${CONFUSE[truth + ">" + choice] || FEATURES[truth]}` };
  }

  // ---------------- photographs for the assessed identification task (checked by eye, 2026-11-14) ----------------
  // Each crop shows one cell whose stage the RP4 author checked by eye on the enlarged image; cells caught between
  // stages were not used. Image sizes: roottip-stages 2000 × 1500, roottip-400x 1024 × 768, roottip-field 1122 × 1150.
  const PHOTOS = [
    { id: "p1", slot: "roottip-stages", nat: [2000, 1500], box: [1190, 700, 360, 360], stage: "interphase", why: "One intact, rounded nucleus with granular chromatin and a darker nucleolus; no separate chromosomes." },
    { id: "p2", slot: "roottip-stages", nat: [2000, 1500], box: [935, 910, 360, 360], stage: "prophase", why: "Condensed chromosomes visible as separate threads inside the outline of the nucleus: early prophase." },
    { id: "p3", slot: "roottip-400x", nat: [1024, 768], box: [390, 322, 215, 215], stage: "anaphase", why: "Two groups of chromatids moving apart towards opposite poles, arms trailing behind." },
    { id: "p4", slot: "roottip-stages", nat: [2000, 1500], box: [1010, 240, 460, 460], stage: "telophase", why: "Two dense, compact groups of chromosomes at opposite poles of one cell, with a clear zone between them where the cell plate forms." },
    { id: "p5", slot: "roottip-field", nat: [1122, 1150], box: [350, 840, 280, 280], stage: "anaphase", why: "Two groups of V-shaped chromatids separating towards opposite poles (stain here is acetocarmine or orcein, not toluidine blue)." },
    { id: "p6", slot: "roottip-field", nat: [1122, 1150], box: [150, 320, 280, 280], stage: "prophase", why: "Condensed, separate chromosomes scattered through the nucleus area, no nuclear envelope visible and no alignment: late prophase (some books call this prometaphase, supporting)." },
  ];
  // Discussion only (not assessed): a cell caught between stages.
  const PHOTO_DISCUSS = { slot: "roottip-field", nat: [1122, 1150], box: [870, 490, 260, 260], note: "Chromosomes in a broad band across the middle of the cell. Most people would call this metaphase, but the band is irregular and some arms point towards the poles, so early anaphase cannot be ruled out. Cells caught between stages are a real source of identification uncertainty: agree a rule before counting (for example, call a cell anaphase only when two separate groups can be seen)." };
  function photoPanel(ids, o = {}) {
    const items = ids.map((id) => PHOTOS.find((p) => p.id === id) || (id === "discuss" ? PHOTO_DISCUSS : null)).filter(Boolean); const cw = o.size || 200, gap = 12, W = items.length * cw + (items.length - 1) * gap;
    const img = (p) => { const s = (B.images && B.images.get && B.images.get(p.slot)) || null; return s && s.src ? s.src : ""; };
    const body = items.map((p, i) => `<svg x="${i * (cw + gap)}" y="0" width="${cw}" height="${cw}" viewBox="${p.box.join(" ")}" preserveAspectRatio="xMidYMid slice"><image href="${img(p)}" x="0" y="0" width="${p.nat[0]}" height="${p.nat[1]}"/></svg><rect x="${i * (cw + gap)}" y="0" width="${cw}" height="${cw}" fill="none" stroke="#16263a" stroke-width="2"/>${o.numbers === false ? "" : `<circle cx="${i * (cw + gap) + 18}" cy="18" r="14" fill="#16263a"/><text x="${i * (cw + gap) + 18}" y="23.5" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}</text>`}`).join("");
    return `<svg viewBox="0 0 ${W} ${cw}" width="${W}" role="img" aria-label="${o.aria || "Cropped light micrographs of onion root-tip cells, numbered"}" style="max-width:100%;height:auto;background:#fff">${body}</svg>`;
  }
  function photoCredits(ids) { const slots = [...new Set(ids.map((id) => (PHOTOS.find((p) => p.id === id) || PHOTO_DISCUSS).slot))]; return slots.map((sl) => { const s = (B.images && B.images.get && B.images.get(sl)) || {}; return `${s.credit || sl}${s.licence ? ", " + s.licence : ""}${s.page ? ` (<a href="${s.page}" target="_blank" rel="noopener">source</a>)` : ""}`; }).join("; "); }

  // Run every check in Node or the browser: configurations for every stage (and arrested cells) over many seeds, and
  // every cell of fields from every sample with every preparation fault (configuration + drawing). Returns a list of
  // failures (empty = all valid). Called by tests/run.js: ok(B.rootTipModel.validateAll().length === 0, ...).
  function validateAll({ seeds = 60, fields = 4 } = {}) {
    const F = []; const add = (where, probs) => probs.forEach((p) => F.push(`${where}: ${p}`));
    for (const st of STAGES) for (let k = 1; k <= seeds; k++) { const opts = st === "prophase" ? { early: k % 2 === 0 } : st === "anaphase" ? { progress: 0.4 + (k % 6) * 0.11 } : {}; const cfg = chromosomeConfig(st, rng(k * 31 + st.length), opts); add(`${st} seed ${k}`, validateConfig(cfg)); const cell = { id: 0, x: 0, y: 0, w: 46, h: 46, u: 13, rot: 0, layer: 1, cfg, seed: k, nx: 0, ny: 0 }; add(`${st} drawing ${k}`, validateDrawing(cell, drawCell(cell, { spindle: true }))); }
    for (let k = 1; k <= seeds; k++) { const cfg = chromosomeConfig("prophase", rng(k), { arrested: true }); if (!cfg.arrested || cfg.stage !== "metaphase") F.push("arrested cell " + k + " not tagged"); add(`arrested ${k}`, validateConfig(cfg)); }
    const preps = [{}, { stain: 0.3 }, { layered: true }, { ruptured: true }, { zone: "elongation" }];
    for (const sid of Object.keys(SAMPLES)) for (const prep of preps) for (let f = 0; f < fields; f++) { const fl = makeField(sid, 7, f, prep, 4); fl.cells.forEach((c) => { add(`${sid} field ${f} cell ${c.id}`, validateConfig(c.cfg)); add(`${sid} field ${f} drawing ${c.id}`, validateDrawing(c, drawCell(c))); if (c.cfg.stage !== "interphase" && Math.abs(c.ny) + 1.7 * c.u > c.h / 2 + 1) F.push(`${sid} field ${f} cell ${c.id}: dividing figure does not fit its cell`); }); }
    return F;
  }

  B.rootTipModel = { validateAll, rng, hash, STAGES, DIVIDING, NAME, ABBR, FEATURES, CONFUSE, N_CHR, CYCLE, T_CYCLE, BOUND, stageAtAge, fromCycle, ELONG, SAMPLES, sampleProbs, treatmentFractions, chromosomeConfig, validateConfig, drawCell, validateDrawing, cellSVG, exampleCell, stagePanel, makeField, drawField, tally, dividingOf, totalOf, miIndex, parseMI, judgeMI, judgeCell, PHOTOS, PHOTO_DISCUSS, photoPanel, photoCredits, R_FOV, VIEW, CX, CY, POLE, colours: C };
})(window.BIO);
