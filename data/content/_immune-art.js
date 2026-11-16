// Shared models and artwork for 3.2.5 The defensive functions of mammalian blood (Phase 4 Batch 2, owned by the 3.2.5
// author). Loaded before data/content/3.2.5.1.js, 3.2.5.2.js, 3.2.5.3.js, data/consolidation/3.2.5.js and
// js/views/interactives-immune.js.
//
// Scope (OxfordAQA 9610 v5.1, printed p.23): required cells are phagocytes, antigen-presenting cells, T cells, B cells,
// plasma cells and memory cells; helper T cells come in through 3.2.4.2. Destruction of antigen is LIMITED to
// agglutination and phagocytosis of bacterial cells. Cytotoxic T cells, MHC, cytokines, antibody classes and the hinge are
// labelled supporting or extension wherever they appear.
//
// Conventions checked drawing by drawing (author report):
//  - Antibody: four polypeptide chains (two identical heavy, two identical light), disulfide bridges between the two heavy
//    chains (hinge) and between each light chain and its heavy chain; variable regions at the tips of BOTH chains of each
//    arm; two identical antigen-binding sites; constant region the rest. Shapes of binding sites are SCHEMATIC.
//  - Phagocytosis order: recognition and attachment, engulfment (pseudopodia), phagosome, lysosome fuses (phagolysosome),
//    hydrolytic enzymes digest, antigens displayed on the surface (antigen-presenting cell), waste removed by exocytosis.
//  - Response graph and herd immunity picture are ILLUSTRATIVE and say so on the drawing.
//
// B.immuneModel (pure functions, no DOM): seeded random generator, antibody-response curves, the herd-immunity network
// simulation and the vaccine-trial datasets with every percentage computed here (checked by hand in the author report).
window.BIO = window.BIO || {};
(function (B) {
  // ================================================================ model ================================================================
  const round = (x, dp = 1) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 1) => round(x, dp).toFixed(dp);
  // mulberry32: small, fast, seeded; the same seed always gives the same sequence, so every simulation is reproducible
  const rng = (seed) => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---- Antibody response (ILLUSTRATIVE). Relative units: 1 = peak of a typical primary response in this model. ----
  // Shape only, chosen to match the qualitative description in OpenStax Microbiology 18.4 and UKHSA Green Book ch. 1:
  // primary response after a lag of about 10 days before antibody is detectable (OpenStax: "a lag period ... of
  // approximately 10 days"; a typical value that varies between people and antigens), low peak; secondary response after
  // a lag of a few days, much higher, lasting longer. The particular numbers are NOT measurements.
  const RESP = { primary: { lag: 10, rise: 8, amp: 1, half: 12 }, secondary: { lag: 2, rise: 5, amp: 8, half: 30 }, base: 0.02 };
  const pulse = (x, p) => { if (x <= p.lag) return 0; const u = x - p.lag; if (u < p.rise) { const f = u / p.rise; return p.amp * f * f * (3 - 2 * f); } return p.amp * Math.pow(2, -(u - p.rise) / p.half); };
  // conc(t, {second, P, S}) : antibody concentration at day t, first exposure on day 0, second exposure on day `second`
  const conc = (t, o = {}) => { const P = o.P || RESP.primary, S = o.S || RESP.secondary; return RESP.base + pulse(t, P) + (o.second != null && t >= o.second ? pulse(t - o.second, S) : 0); };
  const series = (o = {}) => { const end = o.end || 120, dt = o.dt || 0.5, out = []; for (let t = 0; t <= end + 1e-9; t += dt) out.push([round(t, 2), conc(t, o)]); return out; };
  const respSummary = (o = {}) => { const P = o.P || RESP.primary, S = o.S || RESP.secondary; return { pLag: P.lag, pPeakDay: P.lag + P.rise, pPeak: P.amp, sLag: S.lag, sPeakDay: (o.second || 0) + S.lag + S.rise, sPeak: S.amp, ratio: S.amp / P.amp }; };
  // People differ: each simulated person gets multipliers drawn from a seeded generator (illustrative spread only)
  const people = (n = 8, seed = 7) => { const r = rng(seed); return Array.from({ length: n }, () => { const k = 0.5 + 1.5 * r(), ks = 0.5 + 1.5 * r(), dl = Math.round((r() - 0.5) * 4); return { P: { ...RESP.primary, amp: RESP.primary.amp * k, lag: RESP.primary.lag + dl }, S: { ...RESP.secondary, amp: RESP.secondary.amp * ks, lag: Math.max(1, RESP.secondary.lag + Math.round((r() - 0.5) * 2)) } }; }); };

  // ---- Herd immunity: a simple stochastic network model (documented in the interactive and the author report) ----
  // Population: side × side people on a grid that wraps round (a torus). Each person has fixed contacts: the 4 grid
  // neighbours plus `extra` random long-range contacts each (added both ways), so the mean number of contacts is about
  // 4 + 2 × extra. Vaccination: a random `coverage` fraction is vaccinated; each vaccinated person is fully protected
  // with probability `eff` (an "all-or-nothing" vaccine) and otherwise is as susceptible as an unvaccinated person.
  // Infection: `initial` infections are placed in people who are not protected. Time runs in generations; an infected
  // person stays infectious for `duration` generations and in each one infects each susceptible contact with probability
  // p (the illustrative transmission probability), then recovers with lasting immunity. No births, deaths, waning,
  // behaviour change or travel. Everything random uses rng(seed), so the same settings and seed give the same run.
  // state codes: 0 susceptible, 1 infectious, 2 recovered (immune after infection), 3 protected by vaccination
  const ST = { SUS: 0, INF: 1, REC: 2, PROT: 3 };
  const herdSim = (o = {}) => {
    const side = o.side || 20, N = side * side, cov = Math.max(0, Math.min(1, o.coverage == null ? 0.5 : o.coverage)), eff = Math.max(0, Math.min(1, o.eff == null ? 0.9 : o.eff));
    const p = Math.max(0, Math.min(1, o.p == null ? 0.2 : o.p)), init = Math.max(1, Math.round(o.initial || 1)), extra = o.extra == null ? 2 : o.extra, D = o.duration || 2, maxSteps = o.maxSteps || 100;
    const r = rng(o.seed == null ? 1 : o.seed);
    const nb = Array.from({ length: N }, () => new Set());
    for (let i = 0; i < N; i++) { const x = i % side, y = (i / side) | 0; [[1, 0], [0, 1]].forEach(([dx, dy]) => { const j = ((y + dy) % side) * side + ((x + dx) % side); nb[i].add(j); nb[j].add(i); }); }
    for (let i = 0; i < N; i++) for (let e = 0; e < extra; e++) { let j = Math.floor(r() * N); if (j === i) j = (j + 1) % N; nb[i].add(j); nb[j].add(i); }
    const contacts = nb.map((s) => Array.from(s).sort((a, b) => a - b));
    const meanContacts = contacts.reduce((n, c) => n + c.length, 0) / N;
    const order = Array.from({ length: N }, (_, i) => i); for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const nVacc = Math.round(cov * N); const vacc = new Uint8Array(N); for (let k = 0; k < nVacc; k++) vacc[order[k]] = 1;
    const state = new Uint8Array(N), timer = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (vacc[i] && r() < eff) state[i] = ST.PROT;
    const open = []; for (let i = 0; i < N; i++) if (state[i] === ST.SUS) open.push(i);
    for (let k = 0; k < init && open.length; k++) { const j = Math.floor(r() * open.length); const i = open.splice(j, 1)[0]; state[i] = ST.INF; timer[i] = D; }
    const count = () => { const c = { S: 0, I: 0, R: 0, P: 0 }; for (let i = 0; i < N; i++) c[["S", "I", "R", "P"][state[i]]]++; return c; };
    const frames = [Uint8Array.from(state)], history = [{ t: 0, ...count() }];
    let t = 0;
    while (t < maxSteps && history[history.length - 1].I > 0) {
      t++; const newly = [];
      for (let i = 0; i < N; i++) if (state[i] === ST.INF) for (const j of contacts[i]) if (state[j] === ST.SUS && r() < p) { state[j] = 9; newly.push(j); } // 9 = infected this generation
      for (let i = 0; i < N; i++) if (state[i] === ST.INF) { timer[i]--; if (timer[i] === 0) state[i] = ST.REC; }
      for (const j of newly) { state[j] = ST.INF; timer[j] = D; }
      frames.push(Uint8Array.from(state)); history.push({ t, ...count() });
    }
    const ever = (k) => state[k] === ST.REC || state[k] === ST.INF;
    let everInf = 0, infUnvacc = 0, nUnvacc = 0, infVacc = 0, vaccUnprot = 0;
    for (let i = 0; i < N; i++) { if (ever(i)) everInf++; if (!vacc[i]) { nUnvacc++; if (ever(i)) infUnvacc++; } else { if (state[i] !== ST.PROT) vaccUnprot++; if (ever(i)) infVacc++; } }
    const peak = history.reduce((m, h) => (h.I > m.I ? h : m), history[0]);
    const R0model = meanContacts * (1 - Math.pow(1 - p, D)); // expected infections caused by one case in a fully susceptible population
    return { N, side, vacc, contacts, frames, history, meanContacts, R0model, nVacc, everInf, infUnvacc, nUnvacc, infVacc, vaccUnprot, protectedN: history[0].P, peakI: peak.I, peakT: peak.t, steps: t, params: { coverage: cov, eff, p, initial: init, extra, duration: D, seed: o.seed == null ? 1 : o.seed } };
  };
  // Run the same settings with `n` different seeds (seed, seed+1, ...) to show chance variation between outbreaks
  const herdRepeat = (o = {}, n = 20) => { const runs = []; for (let k = 0; k < n; k++) { const s = herdSim({ ...o, seed: (o.seed == null ? 1 : o.seed) + k }); runs.push({ seed: s.params.seed, everInf: s.everInf, infUnvacc: s.infUnvacc, nUnvacc: s.nUnvacc, peakI: s.peakI, steps: s.steps }); }
    const sizes = runs.map((x) => x.everInf).sort((a, b) => a - b); const N = (o.side || 20) ** 2; const med = n % 2 ? sizes[(n - 1) / 2] : (sizes[n / 2 - 1] + sizes[n / 2]) / 2;
    return { runs, min: sizes[0], max: sizes[n - 1], median: med, large: runs.filter((x) => x.everInf > 0.1 * N).length, n, N }; };

  // A TYPICAL outbreak for the simulator: run the same settings with n seeds and return the run of median size, so one
  // press of Run is representative (a single seed can die out by chance at low coverage). Fixed illustrative settings:
  // transmission probability 0.2 per contact per generation, 2 initial infections.
  const herdTypical = (o = {}, n = 11) => { const runs = []; for (let k = 1; k <= n; k++) runs.push(herdSim({ p: 0.2, initial: 2, ...o, seed: k })); runs.sort((a, b) => a.everInf - b.everInf); return runs[(n - 1) >> 1]; };
  // ---- Vaccine trial data ----
  // HYPOTHETICAL Trial V (invented for teaching; not a real study)
  const TRIAL = {
    title: "Hypothetical Trial V: Vaccine X against disease Y",
    disease: "Disease Y, a respiratory infection caused by a virus (fictional)",
    population: "8000 adult volunteers aged 18 to 64 years in three cities, with no previous diagnosis of disease Y",
    design: "Phase 3, randomised, double-blind, placebo-controlled. Participants were allocated at random (by computer) to two injections of Vaccine X or of a salt-solution placebo, 28 days apart, that looked identical. Neither participants nor the staff assessing them knew who had which. Participants were followed for 6 months; every case of disease Y was confirmed by a laboratory test. An independent data and safety monitoring board reviewed the results part-way through.",
    vac: { name: "Vaccine X", randomised: 4000, analysed: 3912, cases: 18, severe: 1, pain: 1494, fever: 172, sae: 9 },
    pla: { name: "Placebo", randomised: 4000, analysed: 3905, cases: 120, severe: 14, pain: 412, fever: 95, sae: 8 },
    note: "Analysed = participants who received both injections and stayed in the study for the whole follow-up. Serious adverse events (SAE) were judged by the independent board; none in either group was judged to be caused by the injection.",
  };
  // HYPOTHETICAL Study W: a poorly designed observational comparison
  const STUDY_W = { title: "Hypothetical Study W", desc: "At one clinic, 200 adults decided for themselves whether to have Vaccine X. 120 chose the vaccine (most were health workers aged 20 to 40); 80 did not (older on average, more with long-term illnesses). Nobody was blinded and disease Y was diagnosed by symptoms only.", vN: 120, vCases: 3, uN: 80, uCases: 6 };
  // REAL published summary: Polack FP et al. (2020) Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine.
  // N Engl J Med 383, 2603–2615, doi:10.1056/NEJMoa2034577. Cases with onset ≥ 7 days after dose 2: 8 (vaccine) v 162
  // (placebo), counted in the efficacy-evaluable participants without evidence of earlier infection (18,198 v 18,325);
  // 43,548 were randomised and 21,720 v 21,728 received injections; reported efficacy 95.0 % (95 % credible interval
  // 90.3 to 97.6), calculated by the authors from surveillance time in the evaluable population. Severe cases after the
  // first dose: 1 v 9 (in the abstract of the paper).
  const POLACK = { randomised: 43548, vN: 21720, pN: 21728, evV: 18198, evP: 18325, vCases: 8, pCases: 162, reported: "95.0", ci: "90.3 to 97.6", severeV: 1, severeP: 9 };
  const pct = (a, b) => (100 * a) / b;
  const ve = (vCases, vN, pCases, pN) => { const arv = vCases / vN, aru = pCases / pN; return (100 * (aru - arv)) / aru; };
  const trialStats = () => { const v = TRIAL.vac, p = TRIAL.pla;
    return { arV: pct(v.cases, v.analysed), arP: pct(p.cases, p.analysed), ve: ve(v.cases, v.analysed, p.cases, p.analysed), rr: (v.cases / v.analysed) / (p.cases / p.analysed),
      veSevere: ve(v.severe, v.analysed, p.severe, p.analysed), painV: pct(v.pain, v.analysed), painP: pct(p.pain, p.analysed), fevV: pct(v.fever, v.analysed), fevP: pct(p.fever, p.analysed), saeV: pct(v.sae, v.analysed), saeP: pct(p.sae, p.analysed),
      dropV: v.randomised - v.analysed, dropP: p.randomised - p.analysed,
      wV: pct(STUDY_W.vCases, STUDY_W.vN), wU: pct(STUDY_W.uCases, STUDY_W.uN), wVE: ve(STUDY_W.vCases, STUDY_W.vN, STUDY_W.uCases, STUDY_W.uN),
      polackVE: ve(POLACK.vCases, POLACK.evV, POLACK.pCases, POLACK.evP), polackVEinjected: ve(POLACK.vCases, POLACK.vN, POLACK.pCases, POLACK.pN) }; };
  B.immuneModel = { round, fix, rng, RESP, pulse, conc, series, respSummary, people, ST, herdSim, herdRepeat, herdTypical, TRIAL, STUDY_W, POLACK, pct, ve, trialStats };

  // ================================================================ artwork ================================================================
  let cnt = 0, U = ""; const uid = () => (U = "-im" + (++cnt));
  const INK = "#16263a", GREY = "#5f6f7f", AG = "#a3367f", AGF = "#f1d3e6", BACF = "#f6e7c4", BACS = "#a86a00", PHF = "#e6f2ec", PHS = "#3f6f62", LYF = "#efe6f7", LYS = "#6b3fa0", NUF = "#d9e6f2", NUS = "#7b93ad",
    TF = "#e3eefa", TS = "#1f66b0", BF = "#fdf0e6", BS = "#b45f1f", PLF = "#fbe3e3", PLS = "#b4504f", MEF = "#e2efe6", MES = "#5d8a6f", HV = "#1f66b0", LT = "#1f8a8a", VR = "#c0392b", INF = "#d94841", OKC = "#2e7d4f";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 11}" font-weight="${o.w || 600}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ""}>${s}</text>`;
  const marker = (id, c) => `<marker id="${id}${U}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 2}"${o.da ? ` stroke-dasharray="${o.da}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}${o.lc ? ` stroke-linecap="${o.lc}"` : ""}/>`;
  const open = (w, h, label, defs = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}" style="max-width:100%;height:auto"><defs>${defs}</defs><rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>`;
  const defsAll = () => marker("g", GREY) + marker("ink", INK) + marker("ag", AG) + marker("ly", LYS) + marker("t", TS) + marker("b", BS) + marker("inf", INF) + marker("pl", PLS);
  const tri = (x, y, s = 7, rot = 0, fill = AG) => `<path d="M${x} ${y - s} L${x + s * 0.9} ${y + s * 0.6} L${x - s * 0.9} ${y + s * 0.6} Z" fill="${fill}" stroke="#7a2660" stroke-width="0.8" transform="rotate(${rot} ${x} ${y})"/>`;
  const sq = (x, y, s = 6, fill = "#3d6fb0") => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="1" fill="${fill}" stroke="#244a7a" stroke-width="0.8"/>`;
  const hex = (x, y, s = 5, fill = "#e08a2e") => { const pts = Array.from({ length: 6 }, (_, k) => `${x + s * Math.cos((Math.PI / 3) * k)},${y + s * Math.sin((Math.PI / 3) * k)}`).join(" "); return `<polygon points="${pts}" fill="${fill}" stroke="#9a5a14" stroke-width="0.8"/>`; };
  // a rod-shaped bacterium with antigen triangles around its edge
  const bacterium = (cx, cy, w = 46, h = 20, rot = 0, o = {}) => { let s = `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${BACF}" stroke="${BACS}" stroke-width="1.5"/>`;
    if (o.antigens !== false) { const n = Math.max(2, Math.round(w / 16)); for (let k = 0; k < n; k++) { const x = cx - w / 2 + (w * (k + 0.5)) / n; s += tri(x, cy - h / 2 - 3.5, 4, 0) + tri(x, cy + h / 2 + 3.5, 4, 180); } }
    return s + "</g>"; };
  // small antibody glyph (Y), centred on the stem base at (x,y), pointing up, rotated by rot degrees
  const miniAb = (x, y, sc = 1, rot = 0, c = HV) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><path d="M0 0 L0 -12 M0 -12 L-8 -21 M0 -12 L8 -21" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M-8 -21 l-2 -2 M8 -21 l2 -2" stroke="${VR}" stroke-width="3" stroke-linecap="round"/></g>`;
  const lysosome = (x, y, r = 9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LYF}" stroke="${LYS}" stroke-width="1.4"/><circle cx="${x - 3}" cy="${y - 2}" r="1.6" fill="${LYS}"/><circle cx="${x + 3}" cy="${y + 1}" r="1.6" fill="${LYS}"/><circle cx="${x - 1}" cy="${y + 4}" r="1.6" fill="${LYS}"/>`;
  const lead0 = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GREY}" stroke-width="1.2"/>`;
  const step = (x, y, n, c = INK) => `<circle cx="${x}" cy="${y}" r="11" fill="${c}"/>` + T(x, y + 4, String(n), { s: 12, w: 800, c: "#fff" });

  // ---------------------------------------------------------------- 1. cell-surface antigens ----------------------------------------------------------------
  const surfaceAntigens = () => {
    uid(); const W = 680, H = 470; let s = open(W, H, "Five panels showing how cell-surface molecules let the immune system tell self from non-self: a body cell with self proteins; a bacterium with non-self antigens; a toxin molecule; a cell from another person with different proteins; an abnormal body cell with altered proteins.", defsAll());
    const panel = (x, y, title, sub, tag, tagC) => `<rect x="${x}" y="${y}" width="214" height="214" rx="12" fill="#f8faf9" stroke="#d3dcd8"/>` + T(x + 107, y + 22, title, { s: 12.5, w: 700 }) + T(x + 107, y + 192, sub, { s: 10, w: 500, c: GREY }) + `<rect x="${x + 57}" y="${y + 197}" width="100" height="0" />` + T(x + 107, y + 207, tag, { s: 10, w: 800, c: tagC });
    const cell = (cx, cy, r, f, st) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" stroke="${st}" stroke-width="1.6"/>`;
    const ring = (cx, cy, r, n, fn, skip = []) => { let o = ""; for (let k = 0; k < n; k++) { if (skip.includes(k)) continue; const a = (2 * Math.PI * k) / n; o += fn(cx + (r + 4) * Math.cos(a), cy + (r + 4) * Math.sin(a), (a * 180) / Math.PI + 90, k); } return o; };
    // 1 own body cell
    s += panel(12, 12, "Your own body cell", "self molecules: recognised as self", "no immune response", OKC);
    s += cell(119, 105, 52, PHF, PHS) + `<ellipse cx="119" cy="108" rx="17" ry="13" fill="${NUF}" stroke="${NUS}"/>` + ring(119, 105, 52, 14, (x, y) => sq(x, y, 7));
    // 2 bacterium
    s += panel(233, 12, "Pathogen (bacterium)", "non-self antigens on its surface", "immune response", AG);
    s += bacterium(340, 105, 120, 44, -18);
    // 3 toxin
    s += panel(454, 12, "Toxin", "the toxin molecule itself is the antigen", "immune response", AG);
    s += `<path d="M520 92 c10 -26 40 -30 52 -12 c14 -10 36 0 30 22 c18 8 10 36 -10 34 c-4 20 -34 22 -42 6 c-20 6 -38 -12 -30 -30 c-12 -4 -10 -18 0 -20 z" fill="${AGF}" stroke="${AG}" stroke-width="1.8"/>` + T(561, 112, "protein", { s: 10, w: 700, c: AG }) + T(561, 125, "molecule", { s: 10, w: 700, c: AG });
    // 4 other person
    s += panel(12, 240, "Cell from another person", "different proteins (transplant, transfusion)", "immune response", AG);
    s += cell(119, 333, 52, "#fdf0e6", BS) + `<ellipse cx="119" cy="336" rx="17" ry="13" fill="${NUF}" stroke="${NUS}"/>` + ring(119, 333, 52, 14, (x, y) => hex(x, y, 5));
    // 5 abnormal body cell
    s += panel(233, 240, "Abnormal body cell", "e.g. a cancer cell: altered proteins", "immune response", AG);
    s += cell(340, 333, 52, PHF, PHS) + `<ellipse cx="340" cy="336" rx="19" ry="14" fill="${NUF}" stroke="${NUS}"/><ellipse cx="333" cy="331" rx="5" ry="4" fill="#9fb4cc"/>` + ring(340, 333, 52, 14, (x, y, a, k) => (k % 3 === 0 ? tri(x, y, 5, a) : sq(x, y, 7)));
    // key
    s += `<rect x="454" y="240" width="214" height="214" rx="12" fill="#ffffff" stroke="#d3dcd8"/>` + T(468, 264, "Key (schematic shapes)", { a: "start", s: 12, w: 700 });
    s += sq(476, 290, 8) + T(490, 294, "self protein (yours)", { a: "start", s: 10.5, w: 500 });
    s += tri(476, 316, 6) + T(490, 320, "non-self antigen", { a: "start", s: 10.5, w: 500 });
    s += hex(476, 342, 6) + T(490, 346, "another person's protein", { a: "start", s: 10.5, w: 500 });
    s += T(468, 376, "Each molecule has its own specific", { a: "start", s: 10, w: 500, c: GREY }) + T(468, 390, "shape (tertiary structure, 3.1.1.4).", { a: "start", s: 10, w: 500, c: GREY }) + T(468, 410, "Non-self molecules are antigens:", { a: "start", s: 10, w: 700, c: AG }) + T(468, 424, "they trigger an immune response.", { a: "start", s: 10, w: 700, c: AG });
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- 2. phagocytosis ----------------------------------------------------------------
  // One scene at a given step (1–6), in a 220 × 230 local box. The cell body is centred near (110, 140).
  const BODY = "M40 140 C40 210 180 210 180 140 C180 70 40 70 40 140 Z";
  const ENGULF = "M40 140 C40 210 180 210 180 140 C180 118 174 102 164 94 C172 80 168 60 150 52 C144 50 139 54 142 60 C152 68 148 84 134 90 L86 90 C72 84 68 68 78 60 C81 54 76 50 70 52 C52 60 48 80 56 94 C46 102 40 118 40 140 Z";
  const PH_TITLES = ["Recognition and attachment", "Engulfment", "Phagosome forms", "Lysosome fuses with the phagosome", "Digestion by hydrolytic enzymes", "Antigen presentation; waste removed"];
  const PH_SHORT = ["1 Recognition", "2 Engulfment", "3 Phagosome", "4 Lysosome fuses", "5 Digestion", "6 Presentation"];
  const PH_CAP = [
    ["Receptors on the phagocyte bind to", "molecules on the bacterium's surface."],
    ["The cell-surface membrane extends", "pseudopodia around the bacterium."],
    ["The bacterium is enclosed in a", "vesicle: the phagosome."],
    ["A lysosome fuses with the phagosome", "(forming a phagolysosome)."],
    ["Hydrolytic enzymes (e.g. lysozyme)", "hydrolyse the bacterium."],
    ["Antigens are displayed on the surface;", "waste is removed by exocytosis."],
  ];
  const phagoScene = (k, o = {}) => {
    let s = "";
    const nucleus = `<path d="M84 172 c4 -14 22 -16 28 -6 c6 -10 26 -8 26 6 c0 12 -18 14 -26 8 c-8 8 -30 6 -28 -8 z" fill="${NUF}" stroke="${NUS}" stroke-width="1.2"/>`;
    s += `<path d="${k === 2 ? ENGULF : BODY}" fill="${PHF}" stroke="${PHS}" stroke-width="2"/>` + nucleus;
    const lys = k <= 3 ? [[70, 118], [154, 122], [62, 156]] : [[70, 118], [62, 156]];
    lys.forEach(([x, y]) => { s += lysosome(x, y); });
    if (k === 1) { s += bacterium(110, 70, 54, 20, 0) + `<path d="M98 89 q4 -7 8 0 M114 89 q4 -7 8 0" fill="none" stroke="${PHS}" stroke-width="2.6"/>` + L(126, 92, 158, 66, { c: GREY, w: 1 }) + T(160, 64, "receptor", { a: "start", s: 9.5, w: 600, c: PHS }) + L(126, 58, 150, 40, { c: GREY, w: 1 }) + T(152, 38, "antigen", { a: "start", s: 9.5, w: 600, c: AG }); }
    if (k === 2) { s += bacterium(110, 74, 40, 16, 0) + T(16, 46, "pseudopodia", { a: "start", s: 9.5, w: 600, c: PHS }) + L(46, 50, 60, 58, { c: GREY, w: 1 }); }
    const PS = `<circle cx="110" cy="124" r="22" fill="#fff8ea" stroke="${PHS}" stroke-width="1.6"/>` + bacterium(110, 124, 30, 12, 0);
    if (k === 3) { s += PS + L(150, 70, 128, 108, { c: GREY, w: 1 }) + T(150, 66, "phagosome", { a: "start", s: 9.5, w: 700, c: PHS }); }
    if (k === 4) { s += PS + lysosome(141, 132, 10) + L(170, 172, 153, 142, { c: LYS, w: 1.6, m: "ly" }) + T(164, 186, "lysosome", { a: "start", s: 9.5, w: 700, c: LYS }) + L(150, 70, 126, 106, { c: GREY, w: 1 }) + T(150, 66, "phagosome", { a: "start", s: 9.5, w: 700, c: PHS }); }
    if (k === 5) { s += `<circle cx="112" cy="126" r="26" fill="${LYF}" stroke="${LYS}" stroke-width="1.8"/>`; [[96, 120], [106, 134], [120, 116], [126, 136], [104, 110], [116, 144], [132, 124]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="2" fill="${LYS}"/>`; });
      s += `<rect x="100" y="118" width="14" height="8" rx="4" fill="${BACF}" stroke="${BACS}" transform="rotate(20 107 122)"/><rect x="116" y="126" width="10" height="7" rx="3" fill="${BACF}" stroke="${BACS}"/>` + tri(122, 116, 3.5) + tri(98, 134, 3.5, 40) + (o.bare ? "" : L(136, 70, 124, 101, { c: GREY, w: 1 }) + T(128, 66, "phagolysosome", { a: "start", s: 9.5, w: 700, c: LYS }) + T(176, 196, "enzymes", { s: 9.5, w: 600, c: LYS }) + L(166, 188, 128, 140, { c: GREY, w: 1 })); }
    if (k === 6) { s += `<path d="M103 90 q7 -10 14 0" fill="none" stroke="${PHS}" stroke-width="3"/>` + tri(110, 81, 5) + `<g transform="rotate(42 155 100)"><path d="M148 102 q7 -10 14 0" fill="none" stroke="${PHS}" stroke-width="3"/>${tri(155, 93, 5)}</g>` + T(60, 56, "antigens displayed", { s: 9.5, w: 700, c: AG }) + L(80, 60, 104, 80, { c: GREY, w: 1 });
      s += `<circle cx="170" cy="150" r="7" fill="#f3efe6" stroke="${PHS}" stroke-width="1.2"/><circle cx="168" cy="149" r="1.6" fill="${BACS}"/>` + L(178, 150, 204, 150, { c: GREY, w: 1.4, m: "g" }) + T(190, 172, "exocytosis", { s: 9.5, w: 600, c: GREY }); }
    if (o.numbers) { // numbered pointers for a labelling question (step-5 scene)
      const pts = o.numbers; pts.forEach(([n, x, y, tx, ty]) => { s += L(tx, ty, x, y, { c: INK, w: 1.2 }) + `<circle cx="${tx}" cy="${ty}" r="9" fill="#fff" stroke="${INK}" stroke-width="1.4"/>` + T(tx, ty + 4, String(n), { s: 10.5, w: 800 }); }); }
    return s;
  };
  const phagocytosis = () => {
    uid(); const W = 720, H = 560; let s = open(W, H, "Six-step strip showing phagocytosis of a bacterium: 1 receptors on a phagocyte bind antigens on a bacterium; 2 pseudopodia extend around it; 3 it is enclosed in a phagosome; 4 a lysosome fuses with the phagosome; 5 hydrolytic enzymes digest it in the phagolysosome; 6 antigens are displayed on the cell surface and waste is removed by exocytosis.", defsAll());
    for (let k = 1; k <= 6; k++) { const col = (k - 1) % 3, row = (k - 1) / 3 | 0; const x = 8 + col * 238, y = 10 + row * 276;
      s += `<rect x="${x}" y="${y}" width="228" height="262" rx="12" fill="#f8faf9" stroke="#d3dcd8"/>` + step(x + 20, y + 20, k, PHS) + T(x + 38, y + 25, PH_SHORT[k - 1].replace(/^\d /, ""), { a: "start", s: 12, w: 700 });
      s += `<g transform="translate(${x + 4} ${y + 12})">${phagoScene(k)}</g>`;
      s += T(x + 114, y + 232, PH_CAP[k - 1][0], { s: 9.5, w: 500, c: GREY }) + T(x + 114, y + 245, PH_CAP[k - 1][1], { s: 9.5, w: 500, c: GREY });
      if (col < 2) s += L(x + 228, y + 130, x + 236, y + 130, { c: GREY, w: 2, m: "g" }); }
    return s + "</svg>";
  };
  // single large scene (animation frame) with a title line
  const phagoFrame = (k) => { uid(); let s = open(440, 300, `Phagocytosis step ${k} of 6: ${PH_TITLES[k - 1]}. ${PH_CAP[k - 1].join(" ")}`, defsAll());
    s += step(22, 22, k, PHS) + T(42, 27, PH_TITLES[k - 1], { a: "start", s: 14, w: 700 });
    s += `<g transform="translate(110 30) scale(1.1)">${phagoScene(k)}</g>` + T(220, 286, PH_CAP[k - 1].join(" "), { s: 11, w: 500, c: GREY });
    return s + "</svg>"; };
  const phagoLabelFig = () => { uid(); let s = open(420, 300, "Phagocyte digesting a bacterium, with five numbered features: 1 points to the membrane-bound vesicle around the bacterium, 2 to a fragment of the bacterium inside it, 3 to a small vesicle in the cytoplasm, 4 to the lobed structure near the base of the cell, 5 to the outer boundary of the cell.", defsAll());
    s += `<g transform="translate(70 20) scale(1.15)">${phagoScene(5, { bare: true })}</g>`;
    // numbered pointers placed in the outer frame coordinates (scene scale 1.15 offset 70,20)
    const P = (x, y) => [70 + 1.15 * x, 20 + 1.15 * y];
    const marks = [[1, ...P(134, 112), 330, 40], [2, ...P(121, 129), 360, 150], [3, ...P(70, 118), 30, 70], [4, ...P(100, 176), 40, 260], [5, ...P(175, 160), 380, 250]];
    marks.forEach(([n, x, y, tx, ty]) => { s += L(tx, ty, x, y, { c: INK, w: 1.2 }) + `<circle cx="${tx}" cy="${ty}" r="10" fill="#fff" stroke="${INK}" stroke-width="1.4"/>` + T(tx, ty + 4, String(n), { s: 11, w: 800 }); });
    return s + "</svg>"; };

  // ---------------------------------------------------------------- 3. antigen-presenting cell and the B-cell response ----------------------------------------------------------------
  // Redrawn 2026-11-15 (teacher's example): a numbered left-to-right flow, 720 × 286, every label 13 px or more. The same
  // magenta antigen shape appears on the antigen-presenting cell, in the notch of the helper T cell's receptor and in the
  // binding sites of the B cell's surface antibodies, so it is clear what binds what.
  const apc = () => {
    uid(); const W = 720, H = 286, OL = "#1b1b1b";
    let s = open(W, H, "Numbered flow from antigen presentation to antibody release. 1: an antigen-presenting cell, a macrophage containing a vesicle of bacterial fragments, displays three magenta antigens on its surface. 2: a helper T cell's receptor has a notch that fits one of these antigens; the pair is circled; the T cell is activated. 3: an arrow labelled stimulates leads to a B cell whose surface antibodies hold the same magenta antigen. 4: an arrow labelled mitosis leads to a clone of four identical B cells. 5: arrows lead to plasma cells, which secrete antibodies, and to memory cells.", defsAll());
    const rot = (x, y, a, k, inner) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${k})">${inner}</g>`;
    const AGN = `<line x1="0" y1="0" x2="0" y2="-6" stroke="${OL}" stroke-width="2.2"/><path d="M-5 -6 L5 -6 L0 -13 Z" fill="${AG}" stroke="${OL}" stroke-width="1.3"/>`;
    const RCP = `<line x1="0" y1="0" x2="0" y2="-8" stroke="${OL}" stroke-width="2.2"/><path d="M-9 -7 L9 -7 L9 -20 L4 -20 L0 -13 L-4 -20 L-9 -20 Z" fill="${TS}" stroke="${OL}" stroke-width="1.3"/>`;
    const num = (x, y, n) => step(x, y, n, INK);
    const lab = (x, y, lines, c = INK) => lines.map((l, i) => T(x, y + i * 16, l, { s: i ? 13 : 14, w: i ? 500 : 800, c: i ? GREY : c })).join("");
    const cy = 112, k = 1.5;
    // 1 antigen-presenting cell (macrophage)
    s += `<path d="M24 ${cy} C22 64 70 46 104 56 C132 64 140 92 138 ${cy} C138 150 112 168 78 166 C40 164 26 142 24 ${cy} Z" fill="${PHF}" stroke="${PHS}" stroke-width="2.2"/>`;
    s += `<path d="M50 136 c4 -10 18 -12 22 -4 c5 -8 20 -6 20 4 c0 9 -14 10 -20 6 c-7 6 -24 4 -22 -6 z" fill="${NUF}" stroke="${NUS}"/>`;
    s += `<circle cx="70" cy="90" r="17" fill="#fff8ea" stroke="${PHS}" stroke-width="1.6"/><rect x="58" y="84" width="11" height="7" rx="3" fill="${BACF}" stroke="${BACS}" transform="rotate(20 63 87)"/><rect x="72" y="92" width="9" height="6" rx="3" fill="${BACF}" stroke="${BACS}"/>`;
    s += rot(138, cy, 90, k, AGN) + rot(120, 64, 40, k, AGN) + rot(116, 158, 140, k, AGN);
    s += num(20, 22, 1) + lab(82, 196, ["Antigen-presenting", "cell (macrophage):", "displays antigens"], PHS);
    // 2 helper T cell: receptor notch apex at x = 138 + 13k
    const tx = 138 + 26 * k + 34; s += rot(tx - 34, cy, -90, k, RCP) + `<circle cx="${tx}" cy="${cy}" r="34" fill="${TF}" stroke="${TS}" stroke-width="2.2"/><circle cx="${tx}" cy="${cy}" r="20" fill="#c7d9ef" stroke="${TS}"/>`;
    s += `<circle cx="${138 + 13 * k}" cy="${cy}" r="21" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += num(158, 22, 2) + T(158 + 22, 27, "receptor fits", { a: "start", s: 13, w: 700 }) + lab(tx, 196, ["Helper T cell", "binds and is", "activated"], TS);
    // 3 B cell with antigen held in its surface antibodies
    const bx = 360; s += L(tx + 40, cy, bx - 50, cy, { c: TS, w: 2.6, m: "t" }) + T((tx + bx) / 2, cy - 10, "stimulates", { s: 13, w: 700, c: TS });
    s += `<circle cx="${bx}" cy="${cy}" r="34" fill="${BF}" stroke="${BS}" stroke-width="2.2"/><circle cx="${bx}" cy="${cy}" r="20" fill="#f3d9c4" stroke="${BS}"/>`;
    [-50, 0, 50].forEach((a) => { const r = ((a - 90) * Math.PI) / 180; const x = bx + 34 * Math.cos(r), y = cy + 34 * Math.sin(r); s += miniAb(x, y, 0.9, a, BS); const tr = ((a - 90) * Math.PI) / 180; s += rot(x + 22 * Math.cos(tr), y + 22 * Math.sin(tr), a + 180, 1, `<path d="M-4.5 0 L4.5 0 L0 -7 Z" fill="${AG}" stroke="${OL}" stroke-width="1.1"/>`); });
    s += num(bx - 40, 22, 3) + lab(bx, 196, ["B cell", "its antibody binds", "the same antigen"], BS);
    // 4 mitosis to a clone
    s += L(bx + 40, cy, 448, cy, { c: BS, w: 2.6, m: "b" }) + T(424, cy - 10, "mitosis", { s: 13, w: 700, c: BS });
    [[472, 94], [506, 94], [472, 130], [506, 130]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="16" fill="${BF}" stroke="${BS}" stroke-width="1.8"/><circle cx="${x}" cy="${y}" r="8" fill="#f3d9c4"/>`; });
    s += num(452, 22, 4) + lab(489, 196, ["Clone of", "identical", "B cells"], BS);
    // 5 plasma cells and memory cells
    s += L(526, 98, 580, 72, { c: BS, w: 2.2, m: "b" }) + L(526, 128, 580, 168, { c: BS, w: 2.2, m: "b" }) + num(552, 22, 5);
    s += `<ellipse cx="612" cy="62" rx="28" ry="22" fill="${PLF}" stroke="${PLS}" stroke-width="2"/><circle cx="602" cy="63" r="8" fill="#f3c8c8" stroke="${PLS}"/>` + [0, 1, 2].map((q) => `<path d="M612 ${54 + q * 7} q9 -3 18 0" fill="none" stroke="${PLS}" stroke-width="1.2"/>`).join("");
    [[668, 40, 60], [680, 64, 90], [668, 88, 120]].forEach(([x, y, a]) => { s += miniAb(x, y, 0.9, a, HV); });
    s += T(612, 108, "Plasma cells", { s: 14, w: 800, c: PLS }) + T(612, 124, "secrete antibodies", { s: 13, w: 500, c: GREY });
    s += `<circle cx="612" cy="180" r="22" fill="${MEF}" stroke="${MES}" stroke-width="2"/><circle cx="612" cy="181" r="11" fill="#cbe0d1"/>` + T(612, 222, "Memory cells", { s: 14, w: 800, c: MES }) + T(612, 238, "stay in the body", { s: 13, w: 500, c: GREY });
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- 4. antibody structure ----------------------------------------------------------------
  // Geometry: hinge at (260, 250); heavy chains run up the stem (x 246 and 274) and out along the arms; light chains lie
  // alongside the outer part of each arm. Variable regions = outer 35 % of each arm (both chains).
  const AB = (() => { const H0L = [240, 250], H1L = [124, 134], H0R = [280, 250], H1R = [396, 134]; const off = 32;
    const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    const LL0 = lerp(H0L, H1L, 0.22).map((v, i) => v + (i ? off : -off)), LL1 = [H1L[0] - off, H1L[1] + off];
    const LR0 = lerp(H0R, H1R, 0.22).map((v, i) => v + (i ? off : off)), LR1 = [H1R[0] + off, H1R[1] + off];
    return { H0L, H1L, H0R, H1R, LL0, LL1, LR0, LR1, lerp }; })();
  const antibody = (o = {}) => {
    uid(); const W = 580, H = 424; const num = !!o.numbers;
    let s = open(W, H, num ? "Antibody molecule with seven numbered features for labelling: 1 points to a long chain in one arm; 2 to a short outer chain in an arm; 3 to the red tip of a short chain; 4 to the empty notch between the red tips of the left arm; 5 to the dashed links between the two long chains; 6 is a bracket beside the stem; 7 to the magenta molecule held in the notch of the right arm." : "Y-shaped antibody molecule: two long heavy chains form the stem and inner arms; two short light chains lie along the outer arms; disulfide bridges join the two heavy chains at the hinge and each light chain to a heavy chain; the variable regions at the tips of both chains of each arm form a notch, the antigen-binding site; there are two identical sites, the left one shown empty and the right one holding an antigen whose shape is complementary; the rest is the constant region.", defsAll());
    const { H0L, H1L, H0R, H1R, LL0, LL1, LR0, LR1, lerp } = AB;
    const chain = (a, b, c, w) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    // antigen-binding sites: a notch between the heavy-chain and light-chain variable tips of each arm. Local frame at the
    // midpoint of the two tips, +y pointing back down the arm towards the hinge.
    const mL = [(H1L[0] + LL1[0]) / 2, (H1L[1] + LL1[1]) / 2], mR = [(H1R[0] + LR1[0]) / 2, (H1R[1] + LR1[1]) / 2];
    const loc = (m, rot) => `translate(${m[0]} ${m[1]}) rotate(${rot})`;
    const P = (m, rot, x, y) => { const r = (rot * Math.PI) / 180; return [m[0] + x * Math.cos(r) - y * Math.sin(r), m[1] + x * Math.sin(r) + y * Math.cos(r)]; };
    const pocket = `<path d="M-16 -8 L-10 -8 L0 18 L10 -8 L16 -8 L16 38 L-16 38 Z" fill="#e7a097"/><path d="M-10 -8 L0 18 L10 -8" fill="none" stroke="${VR}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<g transform="${loc(mL, -45)}">${pocket}</g><g transform="${loc(mR, 45)}">${pocket}</g>`;
    // heavy chains: stem + arm; light chains
    s += chain([240, 396], H0L, HV, 22) + chain(H0L, H1L, HV, 22) + chain([280, 396], H0R, HV, 22) + chain(H0R, H1R, HV, 22);
    s += chain(LL0, LL1, LT, 20) + chain(LR0, LR1, LT, 20);
    // variable regions (outer part of both chains of each arm)
    s += chain(lerp(H0L, H1L, 0.65), H1L, VR, 22) + chain(lerp(LL0, LL1, 0.55), LL1, VR, 20) + chain(lerp(H0R, H1R, 0.65), H1R, VR, 22) + chain(lerp(LR0, LR1, 0.55), LR1, VR, 20);
    // antigen held in the right-hand binding site: its pointed part has the complementary shape and sits in the notch
    if (o.antigen !== false) s += `<g transform="${loc(mR, 45)}"><path d="M-17 -44 L17 -44 L17 -26 L10 -18 L10 -8 L0 18 L-10 -8 L-10 -18 L-17 -26 Z" fill="${AGF}" stroke="${AG}" stroke-width="1.6"/><path d="M-10 -8 L0 18 L10 -8 Z" fill="${AG}"/></g>`;
    // disulfide bridges
    const ss = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#d4a017" stroke-width="3.2" stroke-dasharray="3 2"/>`;
    s += ss([250, 268], [270, 268]) + ss([250, 284], [270, 284]);
    const bl = lerp(H0L, H1L, 0.34), br = lerp(H0R, H1R, 0.34);
    s += ss([bl[0] - 7, bl[1] + 7], [bl[0] - 17, bl[1] + 17]) + ss([br[0] + 7, br[1] + 7], [br[0] + 17, br[1] + 17]);
    // constant region: a bracket beside the stem (the region, not one chain)
    s += `<path d="M226 300 L216 300 L216 404 L226 404 M216 352 L206 352" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
    // labels
    const lab = (n, txt, x, y, tx, ty, a = "start", c = INK) => num ? L(tx, ty, x, y, { c: INK, w: 1.2 }) + `<circle cx="${tx}" cy="${ty}" r="11" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` + T(tx, ty + 4, String(n), { s: 13, w: 800 }) : L(tx + (a === "start" ? -4 : a === "end" ? 4 : 0), ty + (a === "middle" ? 4 : -4), x, y, { c: GREY, w: 1 }) + T(tx, ty, txt, { a, s: 15, w: 700, c });
    const notch = P(mL, -45, 0, 6), agBody = P(mR, 45, 0, -34), hArm = lerp(H0R, H1R, 0.45), lTeal = lerp(LR0, LR1, 0.3), lRed = lerp(LR0, LR1, 0.8);
    s += num ? lab(1, "", hArm[0] - 6, hArm[1] - 6, 290, 132) : lab(1, "heavy chain (× 2)", hArm[0] - 6, hArm[1] - 6, 290, 120, "middle", HV);
    s += lab(2, "light chain (× 2)", lTeal[0] + 7, lTeal[1] + 7, 420, 290, "start", LT);
    s += lab(3, "variable region", lRed[0] + 8, lRed[1] + 8, 470, 226, "start", VR);
    s += num ? lab(4, "", notch[0], notch[1], 40, 80) : L(96, 80, notch[0], notch[1], { c: GREY, w: 1 }) + T(16, 72, "antigen-binding site", { a: "start", s: 15, w: 700, c: AG });
    s += lab(5, "disulfide bridges", 254, 276, 178, 306, "end", "#9a7410");
    s += lab(6, "constant region", 206, 352, num ? 150 : 200, 356, "end", INK);
    s += lab(7, "antigen", agBody[0], agBody[1], 486, 66, "start", AG);
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- 5. agglutination and phagocytosis of bacteria ----------------------------------------------------------------
  // an antibody whose two antigen-binding sites hold antigens on two DIFFERENT bacteria (cross-link)
  const bridgeAb = (p1, p2, side = 1) => { const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, dx = p2[0] - p1[0], dy = p2[1] - p1[1], d = Math.hypot(dx, dy); const nx = (-dy / d) * side, ny = (dx / d) * side;
    const f = [mx + nx * 14, my + ny * 14], st = [f[0] + nx * 14, f[1] + ny * 14]; const tip = (p) => [f[0] + (p[0] - f[0]) * 0.7, f[1] + (p[1] - f[1]) * 0.7];
    const t1 = tip(p1), t2 = tip(p2);
    return `<path d="M${st[0]} ${st[1]} L${f[0]} ${f[1]} L${t1[0]} ${t1[1]} M${f[0]} ${f[1]} L${t2[0]} ${t2[1]}" fill="none" stroke="${HV}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M${t1[0]} ${t1[1]} L${p1[0]} ${p1[1]} M${t2[0]} ${t2[1]} L${p2[0]} ${p2[1]}" stroke="${VR}" stroke-width="3.2" stroke-linecap="round"/>`; };
  // Redrawn 2026-11-15 (teacher's example): three equal panels, 760 × 300. A compact clump of four bacteria, each antibody's
  // two arms on antigens of two DIFFERENT bacteria; in panel 3 the phagocyte's pseudopodia surround the whole clump with
  // its antibodies still attached.
  const clump4 = () => { const A = [335, 112], Bb = [405, 112], Cc = [370, 182], D = [440, 182]; let o = "";
    [A, Bb, Cc, D].forEach(([x, y]) => { o += bacterium(x, y, 54, 20, 0); });
    o += bridgeAb([A[0] + 18, A[1] - 17.5], [Bb[0] - 18, Bb[1] - 17.5], -1) + bridgeAb([A[0] + 18, A[1] + 17.5], [Cc[0] - 18, Cc[1] - 17.5], -1)
      + bridgeAb([Bb[0] + 18, Bb[1] + 17.5], [D[0] + 18, D[1] - 17.5], 1) + bridgeAb([Cc[0] + 18, Cc[1] + 17.5], [D[0] - 18, D[1] + 17.5], 1);
    return o; };
  const agglutination = () => {
    uid(); const W = 760, H = 300; let s = open(W, H, "Three panels. 1, antibodies bind antigens: separate rod-shaped bacteria with triangular antigens and free Y-shaped antibodies. 2, agglutination: four bacteria held in a compact clump; each antibody has its two arms on antigens of two different bacteria. 3, phagocytosis: a phagocyte's pseudopodia surround the whole clump, with its antibodies still attached; lysosomes nearby will digest it.", defsAll());
    const panel = (x, n, t1) => `<rect x="${x}" y="8" width="240" height="284" rx="12" fill="#f8faf9" stroke="#d3dcd8"/>` + step(x + 20, 30, n, BS) + T(x + 38, 35, t1, { a: "start", s: 15, w: 800 });
    s += panel(8, 1, "Antibodies released");
    [[70, 96, 10], [178, 86, -20], [96, 186, 25], [190, 196, 0]].forEach(([x, y, r]) => { s += bacterium(x, y, 50, 20, r); });
    [[136, 134, 20], [52, 146, -40], [150, 236, 70], [214, 140, 150]].forEach(([x, y, r]) => { s += miniAb(x, y, 1.1, r); });
    s += lead0(30, 60, 62, 81) + T(26, 56, "antigen", { a: "start", s: 13, w: 700, c: AG }) + lead0(84, 232, 140, 236) + T(26, 236, "antibody", { a: "start", s: 13, w: 700, c: HV });
    s += T(128, 268, "bacteria spread out", { s: 13, w: 500, c: GREY });
    s += L(250, 150, 262, 150, { c: GREY, w: 2.2, m: "g" });
    s += panel(264, 2, "Agglutination");
    s += `<g transform="translate(-4 -6)">${clump4()}</g>`;
    s += T(384, 246, "each antibody binds", { s: 13, w: 700 }) + T(384, 262, "two different bacteria:", { s: 13, w: 500, c: GREY }) + T(384, 278, "they clump together", { s: 13, w: 500, c: GREY });
    s += L(506, 150, 518, 150, { c: GREY, w: 2.2, m: "g" });
    s += panel(520, 3, "Phagocytosis");
    s += `<g transform="translate(0 -18)">`;
    s += `<path d="M548 232 C548 278 712 278 712 232 C712 206 708 182 700 164 C716 144 714 100 690 80 C682 74 674 80 678 88 C694 104 692 132 676 144 L584 144 C568 132 566 104 582 88 C586 80 578 74 570 80 C546 100 544 144 560 164 C552 182 548 206 548 232 Z" fill="${PHF}" stroke="${PHS}" stroke-width="2"/>`;
    s += `<g transform="translate(630 120) scale(0.5) translate(-388 -147)">${clump4()}</g>`;
    s += lysosome(582, 236) + lysosome(680, 236) + `<path d="M606 252 c4 -10 18 -12 22 -4 c5 -8 20 -6 20 4 c0 9 -14 10 -20 6 c-7 6 -24 4 -22 -6 z" fill="${NUF}" stroke="${NUS}"/></g>`;
    s += T(640, 270, "the clump is engulfed;", { s: 13, w: 700 }) + T(640, 286, "lysosomes digest it", { s: 13, w: 500, c: GREY });
    return s + "</svg>";
  };
  // ---------------------------------------------------------------- 6. primary v secondary response graph ----------------------------------------------------------------
  // responseGraph({second, log, people, ghost, letters, width})
  const responseGraph = (o = {}) => {
    uid(); const second = o.second == null ? 50 : o.second; const end = Math.max(120, second + 70); const log = !!o.log;
    const W = 720, H = 400, x0 = 78, x1 = 690, y0 = 330, y1 = 50;
    const ymax = log ? 100 : 12, ymin = log ? 0.01 : 0;
    const X = (t) => x0 + ((x1 - x0) * t) / end; const Y = (v) => log ? y0 - ((y0 - y1) * (Math.log10(Math.max(v, ymin)) - Math.log10(ymin))) / (Math.log10(ymax) - Math.log10(ymin)) : y0 - ((y0 - y1) * Math.min(v, ymax)) / ymax;
    let s = open(W, H, `Graph of antibody concentration against time. First exposure on day 0 gives a small, slow primary response; a second exposure to the same antigen on day ${second} gives a faster, much larger and longer-lasting secondary response. Illustrative data.`, defsAll());
    // axes and grid
    const yt = log ? [0.01, 0.1, 1, 10, 100] : [0, 2, 4, 6, 8, 10, 12];
    yt.forEach((v) => { s += `<line x1="${x0}" y1="${Y(v)}" x2="${x1}" y2="${Y(v)}" stroke="#e6ebef"/>` + T(x0 - 8, Y(v) + 4, String(v), { a: "end", s: 10, w: 500, c: GREY }); });
    for (let t = 0; t <= end; t += 20) s += `<line x1="${X(t)}" y1="${y0}" x2="${X(t)}" y2="${y0 + 5}" stroke="${INK}"/>` + T(X(t), y0 + 18, String(t), { s: 10, w: 500, c: GREY });
    s += L(x0, y0, x1, y0, { c: INK, w: 1.5 }) + L(x0, y0, x0, y1 - 6, { c: INK, w: 1.5 });
    s += T((x0 + x1) / 2, y0 + 40, "Time after first exposure / days", { s: 11.5, w: 700 }) + T(22, (y0 + y1) / 2, `Antibody concentration / relative units${log ? " (log scale)" : ""}`, { s: 11.5, w: 700, rot: -90 });
    // lag shading
    const R = RESP; s += `<rect x="${X(0)}" y="${y1}" width="${X(R.primary.lag) - X(0)}" height="${y0 - y1}" fill="#fdf5df" opacity="0.8"/><rect x="${X(second)}" y="${y1}" width="${X(second + R.secondary.lag) - X(second)}" height="${y0 - y1}" fill="#fdf5df" opacity="0.8"/>`;
    // individuals
    (o.people || []).forEach((pp) => { const pts = []; for (let t = 0; t <= end; t += 1) pts.push(`${X(t).toFixed(1)},${Y(conc(t, { second, P: pp.P, S: pp.S })).toFixed(1)}`); s += `<polyline points="${pts.join(" ")}" fill="none" stroke="#9fb4cc" stroke-width="1.2" opacity="0.9"/>`; });
    // ghost: primary only
    if (o.ghost) { const pts = []; for (let t = second; t <= end; t += 1) pts.push(`${X(t).toFixed(1)},${Y(conc(t, {})).toFixed(1)}`); s += `<polyline points="${pts.join(" ")}" fill="none" stroke="${GREY}" stroke-width="1.6" stroke-dasharray="5 4"/>` + T(X(Math.min(end - 10, second + 30)), Y(conc(second + 30, {})) - 8, "no second exposure", { s: 9.5, w: 600, c: GREY }); }
    const pts = series({ second, end, dt: 0.5 }).map(([t, v]) => `${X(t).toFixed(1)},${Y(v).toFixed(1)}`);
    s += `<polyline points="${pts.join(" ")}" fill="none" stroke="${HV}" stroke-width="3"/>`;
    // exposure arrows
    s += L(X(0), y1 - 2, X(0), y1 + 20, { c: AG, w: 2, m: "ag" }) + T(X(0) + 4, y1 - 8, "first exposure (e.g. vaccine)", { a: "start", s: 10, w: 700, c: AG });
    s += L(X(second), y1 - 2, X(second), y1 + 20, { c: AG, w: 2, m: "ag" }) + T(X(second) + 4, y1 - 8, "second exposure, same antigen", { a: "start", s: 10, w: 700, c: AG });
    const pk1 = R.primary.lag + R.primary.rise, pk2 = second + R.secondary.lag + R.secondary.rise;
    if (o.letters) { const lt = [["A", X(R.primary.lag / 2), y0 - 14], ["B", X(pk1), Y(conc(pk1, { second })) - 14], ["C", X(second + R.secondary.lag / 2), y0 - 14], ["D", X(pk2), Y(conc(pk2, { second })) - 14]];
      lt.forEach(([l, x, y]) => { s += `<circle cx="${x}" cy="${y}" r="10" fill="#fff" stroke="${INK}" stroke-width="1.4"/>` + T(x, y + 4, l, { s: 11, w: 800 }); }); }
    else { s += T(X(pk1) + 8, Y(conc(pk1, { second })) - 10, "primary response", { a: "start", s: 10.5, w: 700, c: HV }) + T(X(pk2) + 10, Y(conc(pk2, { second })) + 4, "secondary response", { a: "start", s: 10.5, w: 700, c: HV });
      s += T(X(R.primary.lag / 2), y0 - 8, "lag", { s: 9.5, w: 600, c: "#7a5a12" }); }
    s += `<rect x="${x1 - 186}" y="${y1 + 4}" width="184" height="34" rx="6" fill="#fff4e0" stroke="#c9a24a"/>` + T(x1 - 94, y1 + 18, "ILLUSTRATIVE DATA", { s: 10.5, w: 800, c: "#7a5a12" }) + T(x1 - 94, y1 + 31, "shape only; real values vary", { s: 9.5, w: 500, c: "#7a5a12" });
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- 7. herd immunity schematic ----------------------------------------------------------------
  const herd = () => {
    uid(); const W = 760, H = 380; let s = open(W, H, "Two schematic populations of 30 people. Left, few are vaccinated: infection passes from one infected person along chains of contacts to many unvaccinated people. Right, most are vaccinated: transmission is blocked at vaccinated people, so the few unvaccinated people are protected indirectly.", defsAll());
    s += T(20, 24, "Herd immunity (schematic, not data)", { a: "start", s: 14, w: 700 });
    const grid = (ox, vacc, infected, blocked, title, sub) => { let g = `<rect x="${ox}" y="38" width="350" height="272" rx="12" fill="#f8faf9" stroke="#d3dcd8"/>` + T(ox + 175, 60, title, { s: 12.5, w: 700 }) + T(ox + 175, 78, sub, { s: 12.5, w: 500, c: GREY });
      const pos = (k) => [ox + 45 + (k % 6) * 52, 110 + ((k / 6) | 0) * 44];
      const arrows = infected.arrows || [];
      arrows.forEach(([a, b]) => { const [ax, ay] = pos(a), [bx, by] = pos(b); const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); g += L(ax + (dx * 13) / d, ay + (dy * 13) / d, bx - (dx * 15) / d, by - (dy * 15) / d, { c: INF, w: 2, m: "inf" }); });
      blocked.forEach(([a, b]) => { const [ax, ay] = pos(a), [bx, by] = pos(b); const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); const mx = ax + dx * 0.55, my = ay + dy * 0.55; g += L(ax + (dx * 13) / d, ay + (dy * 13) / d, mx, my, { c: INF, w: 2, da: "3 3" }) + `<path d="M${mx - 5} ${my - 5} l10 10 M${mx + 5} ${my - 5} l-10 10" stroke="${INK}" stroke-width="2.2"/>`; });
      for (let k = 0; k < 30; k++) { const [x, y] = pos(k); if (vacc.includes(k)) g += `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="4" fill="#d6eedd" stroke="${OKC}" stroke-width="1.8"/><path d="M${x - 5} ${y} l4 4 l7 -8" fill="none" stroke="${OKC}" stroke-width="2"/>`;
        else if (infected.set.includes(k)) g += `<circle cx="${x}" cy="${y}" r="11" fill="${INF}" stroke="#8f2a24" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/>`;
        else g += `<circle cx="${x}" cy="${y}" r="11" fill="#ffffff" stroke="${INK}" stroke-width="1.6"/>`; }
      return g; };
    // left: low coverage (5 of 30 vaccinated); infection spreads from person 14
    const vL = [2, 9, 21, 27, 5];
    const infL = { set: [14, 13, 15, 8, 20, 19, 7, 16, 22, 12, 26, 25, 18], arrows: [[14, 13], [14, 15], [14, 8], [14, 20], [13, 19], [13, 7], [15, 16], [20, 26], [19, 25], [15, 22], [13, 12], [12, 18]] };
    s += grid(14, vL, infL, [[8, 2], [15, 9], [20, 21]], "Low vaccination coverage", "infection spreads along chains of contacts");
    // right: high coverage (24 of 30 vaccinated); infection from 14 is blocked; unvaccinated 3, 23, 29, 0, 11 stay well
    const vR = Array.from({ length: 30 }, (_, k) => k).filter((k) => ![14, 3, 23, 29, 0, 11].includes(k));
    s += grid(396, vR, { set: [14], arrows: [] }, [[14, 13], [14, 15], [14, 8], [14, 20]], "High vaccination coverage", "transmission chains are broken");
    // key
    const ky = 334; s += `<circle cx="34" cy="${ky}" r="9" fill="#fff" stroke="${INK}" stroke-width="1.6"/>` + T(50, ky + 4, "not vaccinated, susceptible", { a: "start", s: 12.5, w: 500 });
    s += `<rect x="230" y="${ky - 9}" width="18" height="18" rx="4" fill="#d6eedd" stroke="${OKC}" stroke-width="1.6"/><path d="M234 ${ky} l3 3 l6 -7" fill="none" stroke="${OKC}" stroke-width="2"/>` + T(256, ky + 4, "vaccinated, immune", { a: "start", s: 12.5, w: 500 });
    s += `<circle cx="400" cy="${ky}" r="9" fill="${INF}" stroke="#8f2a24"/><circle cx="400" cy="${ky}" r="3" fill="#fff"/>` + T(416, ky + 4, "infected", { a: "start", s: 12.5, w: 500 });
    s += L(486, ky, 520, ky, { c: INF, w: 2, m: "inf" }) + T(528, ky + 4, "transmission", { a: "start", s: 12.5, w: 500 }) + `<path d="M626 ${ky - 5} l10 10 M636 ${ky - 5} l-10 10" stroke="${INK}" stroke-width="2.2"/>` + T(644, ky + 4, "blocked", { a: "start", s: 12.5, w: 500 });
    s += T(380, 370, "The proportion that must be immune varies between diseases: there is no single threshold.", { s: 12.5, w: 600, c: GREY });
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- 8. trial flow (used by the Clinical Trial Evaluation) ----------------------------------------------------------------
  const trialFlow = () => {
    uid(); const W = 720, H = 300; let s = open(W, H, "Flow chart of hypothetical Trial V: 8000 volunteers give informed consent and are screened, randomly allocated to Vaccine X or placebo (4000 each), both groups double-blind, followed for 6 months, cases confirmed by laboratory test; 3912 and 3905 analysed.", defsAll());
    const box = (x, y, w, t1, t2, f = "#f6f8fb", st = "#c9d3de") => `<rect x="${x}" y="${y}" width="${w}" height="50" rx="10" fill="${f}" stroke="${st}" stroke-width="1.5"/>` + T(x + w / 2, y + 21, t1, { s: 11, w: 700 }) + T(x + w / 2, y + 37, t2, { s: 9.5, w: 500, c: GREY });
    const v = TRIAL.vac, p = TRIAL.pla;
    s += box(230, 10, 260, "8000 adult volunteers (18 to 64)", "informed consent; screened");
    s += box(230, 84, 260, "Randomised by computer", "neither group chosen by people");
    s += box(60, 160, 260, `${v.name}: ${v.randomised} people`, "2 injections, 28 days apart", "#e3eefa", TS) + box(400, 160, 260, `${p.name}: ${p.randomised} people`, "identical-looking salt solution", "#fdf0e6", BS);
    s += box(60, 236, 260, `${v.analysed} analysed; ${v.cases} cases`, "followed 6 months, double-blind", "#e3eefa", TS) + box(400, 236, 260, `${p.analysed} analysed; ${p.cases} cases`, "followed 6 months, double-blind", "#fdf0e6", BS);
    s += L(360, 60, 360, 80, { m: "g" }) + L(330, 134, 200, 156, { m: "g" }) + L(390, 134, 520, 156, { m: "g" }) + L(190, 210, 190, 232, { m: "g" }) + L(530, 210, 530, 232, { m: "g" });
    s += T(360, 296, "HYPOTHETICAL trial, invented for teaching.", { s: 9.5, w: 700, c: "#7a5a12" });
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- 9. immune system explorer scene ----------------------------------------------------------------
  // Each item is a <g data-part="key"> so the explorer can highlight it. Schematic, not to scale.
  const explorerScene = () => {
    uid(); const W = 720, H = 400; let s = open(W, H, "Schematic scene of blood and tissue showing a bacterium with antigens, a toxin, a phagocyte with lysosomes, an antigen-presenting cell, a helper T cell, a cytotoxic T cell, a B cell, a plasma cell releasing antibodies, a memory cell, and an antigen–antibody complex.", defsAll());
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#fbf7f2"/>` + T(14, 22, "Blood and tissue fluid (schematic, not to scale)", { a: "start", s: 12, w: 700, c: GREY });
    const g = (k, inner, lx, ly, label) => `<g data-part="${k}" style="cursor:pointer"><title>${label}</title>${inner}${T(lx, ly, label, { s: 13, w: 700 })}</g>`;
    s += g("antigen", bacterium(96, 80, 70, 26, -10) + `<circle cx="96" cy="80" r="44" fill="transparent"/>`, 96, 128, "Bacterium with antigens");
    s += g("phagocyte", `<path d="M190 200 c0 -50 100 -60 116 -8 c16 40 -16 74 -58 70 c-42 -4 -58 -24 -58 -62 z" fill="${PHF}" stroke="${PHS}" stroke-width="2"/><path d="M224 212 c4 -12 20 -14 26 -5 c6 -9 24 -7 24 5 c0 10 -16 12 -24 7 c-8 7 -28 5 -26 -7 z" fill="${NUF}" stroke="${NUS}"/>${bacterium(232, 176, 30, 12, 0, { antigens: false })}<circle cx="232" cy="176" r="15" fill="none" stroke="${PHS}" stroke-width="1.2"/>`, 248, 282, "Phagocyte");
    s += g("lysosome", lysosome(280, 178, 11) + `<circle cx="280" cy="178" r="16" fill="transparent"/>` + L(292, 182, 322, 202, { c: GREY, w: 1 }), 350, 212, "Lysosome");
    s += g("apc", `<path d="M370 96 c0 -44 90 -52 104 -8 c14 36 -14 64 -52 62 c-38 -2 -52 -20 -52 -54 z" fill="${PHF}" stroke="${PHS}" stroke-width="2"/><path d="M456 84 q10 -12 20 0" fill="none" stroke="${PHS}" stroke-width="3.5" transform="rotate(55 466 80)"/>${tri(474, 73, 9, 55)}<path d="M398 106 c4 -10 16 -12 20 -4 c5 -7 19 -5 19 4 c0 8 -12 9 -19 5 c-6 5 -22 4 -20 -5 z" fill="${NUF}" stroke="${NUS}"/>`, 420, 172, "Antigen-presenting cell");
    s += g("helperT", `<circle cx="560" cy="80" r="34" fill="${TF}" stroke="${TS}" stroke-width="2"/><circle cx="560" cy="82" r="19" fill="#c7d9ef"/><path d="M527 66 L511 66 L511 82 L527 82 L527 78 L518 74 L527 70 Z" fill="${TS}" stroke="#16263a" stroke-width="1.2"/>`, 566, 132, "Helper T cell");
    s += g("cytotoxicT", `<circle cx="660" cy="200" r="32" fill="${TF}" stroke="${TS}" stroke-width="2" stroke-dasharray="5 3"/><circle cx="660" cy="202" r="18" fill="#c7d9ef"/>`, 660, 250, "Cytotoxic T cell");
    s += g("bcell", `<circle cx="470" cy="250" r="34" fill="${BF}" stroke="${BS}" stroke-width="2"/><circle cx="470" cy="252" r="19" fill="#f3d9c4"/>${miniAb(470, 216, 0.8, 0, BS)}${miniAb(500, 236, 0.8, 60, BS)}${miniAb(440, 236, 0.8, -60, BS)}`, 470, 302, "B cell");
    s += g("plasma", `<ellipse cx="110" cy="290" rx="44" ry="32" fill="${PLF}" stroke="${PLS}" stroke-width="2"/><circle cx="92" cy="292" r="12" fill="#f3c8c8"/>${[0, 1, 2, 3].map((k) => `<path d="M110 ${272 + k * 8} q12 -4 24 0" fill="none" stroke="${PLS}" stroke-width="1.2"/>`).join("")}`, 110, 340, "Plasma cell");
    s += g("antibody", miniAb(176, 280, 1.3, 30) + miniAb(186, 316, 1.3, 80) + `<circle cx="184" cy="296" r="24" fill="transparent"/>`, 196, 350, "Antibody");
    s += g("memory", `<circle cx="300" cy="330" r="28" fill="${MEF}" stroke="${MES}" stroke-width="2"/><circle cx="300" cy="332" r="15" fill="#cbe0d1"/>`, 300, 376, "Memory cell");
    s += g("toxin", `<path d="M592 312 c6 -16 26 -18 32 -6 c10 -6 24 0 20 14 c12 6 6 22 -6 22 c-2 12 -22 14 -28 4 c-12 4 -24 -8 -18 -18 c-8 -2 -6 -12 0 -16 z" fill="${AGF}" stroke="${AG}" stroke-width="1.8"/>`, 620, 368, "Toxin");
    // bacterium 64 wide: antigens at x 366, 382, 398, 414; apexes at y 315.5 (top) and 348.5 (bottom). Each antibody's two
    // variable-region tips (scale 0.8: 16 apart) sit on two antigens; the stems point away from the bacterium.
    s += g("complex", bacterium(390, 332, 64, 18, 0) + miniAb(374, 297.6, 0.8, 180) + miniAb(406, 366.4, 0.8, 0) + `<circle cx="390" cy="332" r="36" fill="transparent"/>`, 450, 392, "Antigen–antibody complex");
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- 10. antigen and antibody binding-site shapes (binding challenge) ----------------------------------------------------------------
  // Each shape key has an antigen outline (a bump) and the antibody site is its complement (a matching notch). SCHEMATIC.
  const SHAPES = {
    tri: { name: "pointed", ag: "M-14 0 L0 -16 L14 0 Z", site: "M-16 0 L0 -18 L16 0" },
    round: { name: "rounded", ag: "M-14 0 A14 14 0 0 1 14 0 Z", site: "M-16 0 A16 16 0 0 1 16 0" },
    square: { name: "square", ag: "M-12 0 L-12 -14 L12 -14 L12 0 Z", site: "M-14 0 L-14 -16 L14 -16 L14 0" },
    zig: { name: "zigzag", ag: "M-15 0 L-10 -14 L-4 -6 L2 -16 L8 -6 L15 -14 L15 0 Z", site: "M-17 0 L-11 -16 L-4 -8 L2 -18 L8 -8 L17 -16 L17 0" },
    step: { name: "stepped", ag: "M-14 0 L-14 -8 L-4 -8 L-4 -16 L14 -16 L14 0 Z", site: "M-16 0 L-16 -10 L-6 -10 L-6 -18 L16 -18 L16 0" },
    wave: { name: "wavy", ag: "M-15 0 C-15 -18 -5 -6 0 -14 C5 -22 15 -8 15 -14 L15 0 Z", site: "M-17 0 C-17 -20 -5 -8 0 -16 C5 -24 17 -10 17 -16 L17 0" },
  };
  const antigenTile = (key, o = {}) => { uid(); const sh = SHAPES[key]; return `<svg viewBox="-40 -40 80 60" width="${o.w || 80}" role="img" aria-label="antigen with a ${sh.name} shape" style="max-width:100%;height:auto"><rect x="-40" y="-40" width="80" height="60" fill="#ffffff"/><rect x="-30" y="0" width="60" height="16" rx="6" fill="${BACF}" stroke="${BACS}" stroke-width="1.4"/><path d="${sh.ag}" fill="${AG}" stroke="#7a2660" stroke-width="1.2"/></svg>`; };
  // antibody arm end: stem from above, variable-region block whose lower face carries the notch (opening downwards)
  const siteShape = (sh) => `<rect x="-6" y="-44" width="12" height="24" fill="${HV}"/><path d="M-24 -22 L-24 0 ${sh.site.replace(/^M/, "L")} L24 0 L24 -22 Z" fill="${VR}" opacity="0.92"/>`;
  const siteTile = (key, o = {}) => { uid(); const sh = SHAPES[key]; return `<svg viewBox="-40 -48 80 60" width="${o.w || 80}" role="img" aria-label="antibody binding site with a ${sh.name} notch" style="max-width:100%;height:auto"><rect x="-40" y="-48" width="80" height="60" fill="#ffffff"/>${siteShape(sh)}</svg>`; };
  const bindingPair = (agKey, siteKey) => { uid(); const a = SHAPES[agKey], b = SHAPES[siteKey]; const fit = agKey === siteKey;
    return `<svg viewBox="-60 -50 120 96" width="180" role="img" aria-label="${fit ? "complementary: the antigen fits the binding site" : "not complementary: the shapes do not fit"}" style="max-width:100%;height:auto"><rect x="-60" y="-50" width="120" height="96" fill="#ffffff"/><g transform="translate(0 ${fit ? 18 : 0})">${siteShape(b)}</g><g transform="translate(0 18)"><rect x="-30" y="0" width="60" height="12" rx="5" fill="${BACF}" stroke="${BACS}"/><path d="${a.ag}" fill="${AG}" stroke="#7a2660"/></g>${T(0, 44, fit ? "fits: complementary" : "does not fit", { s: 9.5, w: 700, c: fit ? OKC : INF })}</svg>`; };

  // ---------------------------------------------------------------- 11. herd simulator grid and chart ----------------------------------------------------------------
  // frame: Uint8Array of states; vacc: Uint8Array. Shape encodes vaccination (square = vaccinated), fill encodes state, so
  // nothing relies on colour alone.
  const herdGrid = (sim, frameIdx) => { uid(); const side = sim.side, cs = 18, W = side * cs + 8; const fr = sim.frames[Math.min(frameIdx, sim.frames.length - 1)];
    const c = { S: 0, I: 0, R: 0, P: 0 }; for (let i = 0; i < sim.N; i++) c[["S", "I", "R", "P"][fr[i]]]++;
    let s = `<svg viewBox="0 0 ${W} ${W}" width="${W}" role="img" aria-label="Population of ${sim.N} at generation ${Math.min(frameIdx, sim.frames.length - 1)}: ${c.I} infected, ${c.R} recovered, ${c.S} susceptible, ${c.P} protected by vaccination." style="max-width:100%;height:auto"><rect width="${W}" height="${W}" fill="#ffffff"/>`;
    for (let i = 0; i < sim.N; i++) { const x = 4 + (i % side) * cs + cs / 2, y = 4 + ((i / side) | 0) * cs + cs / 2, st = fr[i], v = sim.vacc[i];
      const fill = st === 1 ? INF : st === 2 ? "#9aa5b1" : st === 3 ? "#cfe9d6" : "#ffffff", stroke = st === 1 ? "#8f2a24" : st === 3 ? OKC : v ? OKC : "#47566a";
      s += v ? `<rect x="${x - 6.5}" y="${y - 6.5}" width="13" height="13" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.3"/>` : `<circle cx="${x}" cy="${y}" r="6.5" fill="${fill}" stroke="${stroke}" stroke-width="1.3"/>`; }
    return s + "</svg>"; };
  const herdChart = (sim, upto) => { uid(); const W = 520, H = 236, x0 = 56, x1 = 506, y0 = 190, y1 = 18; /* text sized to stay legible when the chart is shown about 350 px wide on a phone */ const hist = sim.history; const tmax = Math.max(20, hist.length - 1); const X = (t) => x0 + ((x1 - x0) * t) / tmax, Y = (v) => y0 - ((y0 - y1) * v) / sim.N;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Line graph of infected and ever-infected people against generation for this run." style="max-width:100%;height:auto"><rect width="${W}" height="${H}" fill="#ffffff"/>`;
    [0, 0.25, 0.5, 0.75, 1].forEach((f) => { s += `<line x1="${x0}" y1="${Y(f * sim.N)}" x2="${x1}" y2="${Y(f * sim.N)}" stroke="#e6ebef"/>` + T(x0 - 6, Y(f * sim.N) + 4, String(Math.round(f * sim.N)), { a: "end", s: 13, w: 500, c: GREY }); });
    for (let t = 0; t <= tmax; t += Math.max(5, Math.ceil(tmax / 8 / 5) * 5)) s += T(X(t), y0 + 17, String(t), { s: 13, w: 500, c: GREY });
    s += L(x0, y0, x1, y0, { c: INK, w: 1.2 }) + L(x0, y0, x0, y1, { c: INK, w: 1.2 }) + T((x0 + x1) / 2, y0 + 38, "Generation", { s: 13.5, w: 700 }) + T(14, (y0 + y1) / 2, "Number of people", { s: 13.5, w: 700, rot: -90 });
    const lim = Math.min(upto == null ? hist.length - 1 : upto, hist.length - 1); const ptsI = [], ptsE = [];
    for (let k = 0; k <= lim; k++) { ptsI.push(`${X(hist[k].t).toFixed(1)},${Y(hist[k].I).toFixed(1)}`); ptsE.push(`${X(hist[k].t).toFixed(1)},${Y(hist[k].I + hist[k].R).toFixed(1)}`); }
    s += `<polyline points="${ptsE.join(" ")}" fill="none" stroke="#47566a" stroke-width="2" stroke-dasharray="6 4"/><polyline points="${ptsI.join(" ")}" fill="none" stroke="${INF}" stroke-width="2.6"/>`;
    s += `<rect x="${x1 - 180}" y="${y1}" width="178" height="44" rx="6" fill="#ffffff" opacity="0.9"/><line x1="${x1 - 172}" y1="${y1 + 12}" x2="${x1 - 150}" y2="${y1 + 12}" stroke="${INF}" stroke-width="2.6"/>` + T(x1 - 144, y1 + 17, "infected now", { a: "start", s: 13, w: 600 }) + `<line x1="${x1 - 172}" y1="${y1 + 32}" x2="${x1 - 150}" y2="${y1 + 32}" stroke="#47566a" stroke-width="2" stroke-dasharray="6 4"/>` + T(x1 - 144, y1 + 37, "ever infected", { a: "start", s: 13, w: 600 });
    return s + "</svg>"; };

  // ================================================================ picture figures (Phase 4 Batch 5) ================================================================
  // The teacher asked for textbook-style figures in place of the older hand-drawn ones. Pictures generated for this
  // platform (ChatGPT image generation, unlabelled, reviewed for accuracy before use) are drawn as <image>s inside a fixed
  // viewBox; every label is an SVG overlay (text with a white halo; leader with a white casing ending in a dot on the
  // structure). Coordinates are the picture's own pixels plus a fixed offset (and scale where stated).
  //  self-nonself-gen.jpg (1536 × 580; crop y 200–780 of the original): body cell with square self proteins (centre 262, 290);
  //    lymphocyte with notched receptors (centre 795, 290), whose right-hand receptor notch (1012, 290) faces the
  //    triangular antigen at the left end of the bacterium (1040, 290); rod bacterium with triangular antigens (centre 1275, 292).
  //  phagocytosis-gen.jpg (1536 × 410; crop y 300–710): five panels at x 10–300, 320–605, 625–910, 930–1215, 1235–1525:
  //    receptors bind a bacterium; pseudopodia surround it; phagosome; a lysosome fuses with the phagosome and the
  //    bacterium is digested; the vesicle opens at the surface and releases waste (exocytosis). Lobed nucleus and pink
  //    lysosomes in every cell.
  //  agglutination-gen.jpg (1496 × 810; crop x 20–1516, y 140–950): free rod bacteria with round antigens and free Y-shaped
  //    antibodies (left); five bacteria in a ring, each pair joined by one antibody whose two arm tips touch antigens on two
  //    DIFFERENT bacteria (right; checked antibody by antibody).
  const PIMG = { ph: ["assets/img/phagocytosis-gen.jpg", 1536, 410] };
  const PFONT = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", PSUB = "#46566a";
  const pesc = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const pOpen = (W, H, label, defs = "") => `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${pesc(label)}" font-family="${PFONT}" style="max-width:100%;height:auto"><defs>${defs}</defs><rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
  const pImg = (key, sx, sy, sw, sh, dx, dy, k = 1) => { const [href, w, h] = PIMG[key]; return `<svg x="${dx}" y="${dy}" width="${sw * k}" height="${sh * k}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none" overflow="hidden"><image href="${href}" x="0" y="0" width="${w}" height="${h}"/></svg>`; };
  const pLead = (pts, o = {}) => { const d = "M" + pts.map((q) => q.join(" ")).join(" L"); const [ex, ey] = pts[pts.length - 1];
    return `<g pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${o.dot === false ? "" : `<circle cx="${ex}" cy="${ey}" r="6" fill="${INK}" stroke="#fff" stroke-width="2"/>`}</g>`; };
  // lines: first bold (9610 term or heading), "~text" secondary; o.all: every line bold
  const pLab = (x, y, lines, o = {}) => { const s1 = o.s || 30, s2 = o.s2 || 26, lh = o.lh || 31;
    return `<g pointer-events="none">` + lines.map((l, i) => { const sup = l.startsWith("~") || (i > 0 && !o.all); const t = l.replace(/^~/, "");
      return `<text x="${x}" y="${y + i * lh}" text-anchor="${o.a || "start"}" font-size="${sup ? s2 : s1}" font-weight="${sup ? 500 : 800}" fill="${sup ? PSUB : (o.c || INK)}" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${t}</text>`; }).join("") + "</g>"; };
  const pStep = (x, y, n) => `<circle cx="${x}" cy="${y}" r="21" fill="${INK}"/><text x="${x}" y="${y + 10}" text-anchor="middle" font-size="28" font-weight="800" fill="#fff">${n}</text>`;
  const pArrowR = (x1, x2, y, id) => `<path d="M${x1} ${y} L${x2} ${y}" stroke="#fff" stroke-width="15" stroke-linecap="round"/><path d="M${x1} ${y} L${x2} ${y}" stroke="${GREY}" stroke-width="7" stroke-linecap="round" marker-end="url(#${id})"/>`;
  const pMark = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;

  // d-3.2.5.1-1: self and non-self (redrawn 2026-11-15 as a compact vector schematic, about 690 × 390, replacing the
  // poster-sized generated picture). Top row: own body cell (self proteins), lymphocyte (receptors of one shape), bacterium
  // (antigens), and a close-up of the circled receptor fitting one antigen. Bottom row: toxin, cell from another person,
  // abnormal (cancer) cell. Labels 13–14 px at the natural size.
  const selfNonSelf = () => { uid(); const W = 690, H = 392, OL = "#1b1b1b";
    let s = open(W, H, "Self and non-self. Top row: your own body cell covered in square self proteins, which cause no immune response; a lymphocyte whose receptors all have one notched shape; and a rod-shaped bacterium with triangular non-self proteins, its antigens. One receptor of the lymphocyte meets an antigen at the end of the bacterium; this pair is circled, and a close-up on the right shows the point of the antigen fitting the notch of the receptor: complementary shapes. Bottom row, also identified as non-self: a toxin molecule, which is itself the antigen; a cell from another person, with differently shaped proteins; and an abnormal body cell such as a cancer cell, with some altered proteins.");
    // local shapes (origin on the membrane, outward = up); k scales them
    const rot = (x, y, a, k, inner) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${k})">${inner}</g>`;
    const RECEP = `<line x1="0" y1="0" x2="0" y2="-8" stroke="${OL}" stroke-width="2.4"/><path d="M-9 -7 L9 -7 L9 -20 L4 -20 L0 -13 L-4 -20 L-9 -20 Z" fill="#4f7fc0" stroke="${OL}" stroke-width="1.4"/>`;
    const ANTI = `<line x1="0" y1="0" x2="0" y2="-6" stroke="${OL}" stroke-width="2.4"/><path d="M-5 -6 L5 -6 L0 -13 Z" fill="#e8892e" stroke="${OL}" stroke-width="1.4"/>`;
    const SELF = `<line x1="0" y1="0" x2="0" y2="-6" stroke="${OL}" stroke-width="2.4"/><rect x="-5" y="-16" width="10" height="10" fill="#9b45b0" stroke="${OL}" stroke-width="1.4"/>`;
    const HEX = `<line x1="0" y1="0" x2="0" y2="-6" stroke="${OL}" stroke-width="2.4"/><path d="M-5 -10.5 L-2.5 -15 L2.5 -15 L5 -10.5 L2.5 -6 L-2.5 -6 Z" fill="#2f9e8f" stroke="${OL}" stroke-width="1.4"/>`;
    const DIA = `<line x1="0" y1="0" x2="0" y2="-6" stroke="${OL}" stroke-width="2.4"/><path d="M0 -17 L5 -11.5 L0 -6 L-5 -11.5 Z" fill="#e2572d" stroke="${OL}" stroke-width="1.4"/>`;
    const ringOf = (cx, cy, r, n, f, skip = -1, k = 1) => { let o = ""; for (let i = 0; i < n; i++) { if (i === skip) continue; const a = (2 * Math.PI * i) / n; o += rot(cx + r * Math.cos(a), cy + r * Math.sin(a), (a * 180) / Math.PI + 90, k, f(i)); } return o; };
    const cell = (cx, cy, r, fill, nuc) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${OL}" stroke-width="2.2"/><circle cx="${cx}" cy="${cy}" r="${r * nuc}" fill="#9a62ad" stroke="${OL}" stroke-width="1.8"/>`;
    const lab = (x, y, a, b, c2) => T(x, y, a, { s: 14, w: 800 }) + T(x, y + 17, b, { s: 13, w: 500, c: GREY }) + (c2 ? T(x, y + 33, c2, { s: 13, w: 500, c: GREY }) : "");
    const cy = 106;
    // own body cell
    s += ringOf(80, cy, 44, 12, () => SELF) + cell(80, cy, 44, "#c9dbe9", 0.32) + lab(80, 186, "Your own body cell", "self proteins:", "no immune response");
    // lymphocyte (receptor at angle 0 points at the bacterium)
    s += ringOf(248, cy, 42, 12, () => RECEP) + cell(248, cy, 42, "#d7e3f1", 0.62) + lab(248, 186, "Lymphocyte", "receptors all of", "one specific shape");
    // bacterium: left-end antigen's apex sits in the notch of the lymphocyte receptor (notch apex at x = 248 + 42 + 13 = 303)
    const bx0 = 316, bx1 = 446; s += `<rect x="${bx0}" y="${cy - 22}" width="${bx1 - bx0}" height="44" rx="22" fill="#9cb94a" stroke="${OL}" stroke-width="2.2"/>`;
    [340, 381, 422].forEach((x) => { s += rot(x, cy - 22, 0, 1, ANTI) + rot(x, cy + 22, 180, 1, ANTI); }); s += rot(bx1, cy, 90, 1, ANTI) + rot(bx0, cy, -90, 1, ANTI);
    s += `<circle cx="303" cy="${cy}" r="19" fill="none" stroke="${AG}" stroke-width="2.4" stroke-dasharray="6 4"/>` + lab(381, 186, "Bacterium (pathogen)", "non-self proteins", "act as antigens");
    // close-up of the circled pair
    const zx = 590; s += `<circle cx="${zx}" cy="${cy}" r="62" fill="#fbfcfe" stroke="${AG}" stroke-width="2.4" stroke-dasharray="6 4"/>`;
    s += `<line x1="${zx - 39}" y1="${cy - 46}" x2="${zx - 39}" y2="${cy + 46}" stroke="${OL}" stroke-width="3"/><line x1="${zx + 39}" y1="${cy - 46}" x2="${zx + 39}" y2="${cy + 46}" stroke="${OL}" stroke-width="3"/>`;
    s += rot(zx - 39, cy, 90, 3, RECEP) + rot(zx + 39, cy, -90, 3, ANTI);
    s += lab(zx, 186, "Close-up of the circled pair", "complementary shapes:", "the receptor binds this antigen");
    // lower row
    const Y = 238; s += `<line x1="14" y1="${Y}" x2="${W - 14}" y2="${Y}" stroke="#d3dcd8" stroke-width="1.5"/>` + T(14, Y + 22, "Also identified as non-self (each acts as an antigen):", { a: "start", s: 14, w: 800 });
    const ly = 300;
    s += `<path d="M96 ${ly - 14} c6 -18 26 -20 34 -8 c10 -7 26 0 21 14 c13 6 7 24 -7 22 c-3 14 -24 15 -29 4 c-14 4 -27 -9 -21 -21 c-9 -3 -7 -12 2 -11 z" fill="#f08aa6" stroke="${OL}" stroke-width="2"/>`;
    s += lab(120, 356, "Toxin", "the molecule itself is the antigen");
    s += ringOf(345, ly, 26, 10, () => HEX, -1, 0.9) + cell(345, ly, 26, "#c9dbe9", 0.34) + lab(345, 356, "Cell from another person", "transplant or transfusion");
    s += ringOf(570, ly, 26, 10, (i) => (i % 3 === 1 ? DIA : SELF), -1, 0.9) + cell(570, ly, 26, "#c9dbe9", 0.34) + lab(570, 356, "Abnormal body cell", "e.g. a cancer cell: altered proteins");
    return s + "</svg>"; };

  // d-3.2.5.1-2: phagocytosis in five steps (canvas = image px + (0, 150); label column on the right for the cell parts)
  // o.active (1–5): the stepper highlights that panel and pales the others (Phagocytosis step-through, 3.2.5.1)
  const PH_X = [[10, 300], [312, 612], [618, 915], [922, 1222], [1228, 1730]];
  const phagocytosisPhoto = (o = {}) => {
    const W = 1730, H = 700, OY = 150;
    let s = pOpen(W, H, "Phagocytosis of a bacterium in five steps, each showing a phagocyte with a lobed nucleus and small lysosomes. 1 Attachment: receptors on the phagocyte's surface bind to a rod-shaped bacterium. 2 Engulfing: pseudopodia extend around the bacterium. 3 Phagosome: the bacterium is enclosed in a vesicle inside the cell. 4 Digestion: a lysosome fuses with the phagosome and its hydrolytic enzymes digest the bacterium, which is breaking up. 5 Exocytosis: the vesicle opens at the cell surface and releases the waste.");
    s += pImg("ph", 0, 0, 1536, 410, 0, OY);
    const P = [[155, "Attachment"], [462, "Engulfing"], [768, "Phagosome"], [1072, "Digestion"], [1380, "Exocytosis"]];
    P.forEach(([cx, t], i) => { s += pStep(cx - 100, 36, i + 1) + pLab(cx - 72, 47, [t]); });
    s += pLead([[166, 122], [211, 72 + OY]]) + pLab(12, 130, ["Receptors"]);
    s += pLead([[438, 112], [430, 55 + OY]]) + pLead([[488, 112], [519, 48 + OY]]) + pLab(462, 104, ["Pseudopodia"], { a: "middle" });
    s += pLead([[790, 112], [790, 98 + OY]]) + pLab(790, 104, ["Phagosome"], { a: "middle" });
    s += pLead([[1098, 112], [1127, 92 + OY]]) + pLab(1092, 104, ["Lysosome"], { a: "middle" });
    s += pLead([[1440, 112], [1452, 50 + OY]]) + pLab(1440, 104, ["Waste released"], { a: "end" });
    s += pLead([[1556, 430], [1478, 262 + OY]]) + pLab(1564, 439, ["Lobed", "nucleus"], { all: true });
    const C = [["Receptors on the", "phagocyte bind to", "the bacterium"], ["Pseudopodia extend", "around the", "bacterium"], ["The bacterium is", "enclosed in a", "phagosome"], ["A lysosome fuses:", "hydrolytic enzymes", "digest the bacterium"], ["Waste is removed by", "exocytosis; antigens", "are displayed"]];
    C.forEach((lines, i) => { s += pLab(P[i][0], 604, lines.map((l) => "~" + l), { a: "middle", s2: 27 }); });
    if (o.active) PH_X.forEach(([x0, x1], i) => { s += i + 1 === o.active ? `<rect x="${x0 + 3}" y="6" width="${x1 - x0 - 6}" height="${H - 12}" rx="22" fill="none" stroke="#e09a00" stroke-width="7"/>` : `<rect x="${x0}" y="0" width="${x1 - x0}" height="${H}" fill="#ffffff" fill-opacity=".72"/>`; });
    return s + "</svg>";
  };

  B.immuneArt = { selfNonSelf, phagocytosisPhoto, surfaceAntigens, phagoScene, phagocytosis, phagoFrame, phagoLabelFig, PH_TITLES, PH_CAP, apc, antibody, agglutination, responseGraph, herd, trialFlow, explorerScene, SHAPES, antigenTile, siteTile, bindingPair, herdGrid, herdChart };
})(window.BIO);
