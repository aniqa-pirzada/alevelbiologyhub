// Shared model and artwork for 3.2.11 Mutation and cancer (Phase 4 Batch 4, owned by the 3.2.11 author). Loaded after
// data/content/_protein-synth-art.js and _disease-art.js and before data/content/3.2.11.1.js, 3.2.11.2.js,
// data/consolidation/3.2.11.js and js/views/interactives-mutation.js.
//
// B.mutationModel (pure data and logic, no DOM)
//  - GENETIC CODE: NOT retyped. Every translation uses B.proteinModel (data/content/_protein-synth-art.js: the standard
//    code, NCBI translation table 1, verified codon by codon in tests/run.js). Strand convention as in 3.1.8: the DNA
//    coding strand and the mRNA are written 5′→3′ left to right; the template strand is written 3′→5′ underneath, each
//    base opposite its partner. mRNA = coding strand with U for T = complement of the template strand.
//  - Translation rule used by the Mutation Explorer: the ribosome starts at the FIRST AUG of the mRNA shown and reads
//    non-overlapping codons until the first stop codon (UAA, UAG, UGA) or the end of the sequence shown (then the
//    result is flagged "no stop codon in the part shown").
//  - mutate(coding, m): m = { type: "sub" | "del" | "ins" | "del3", pos, base } on the CODING strand (the template
//    strand changes to match, because a gene mutation changes a base pair).
//  - classify(coding, m): compares the original and mutated polypeptides and returns the outcome with the supporting
//    term where it applies (silent, missense, nonsense, frameshift; plus start-lost, stop-lost, in-frame deletion and
//    outside-the-coding-sequence cases, which the page labels as supporting or stretch).
//  - GENES: short HYPOTHETICAL genes for the explorer, plus the first 10 codons of the real human beta-globin gene
//    (HBB, NM_000518.4, c.1–c.30, read from the LOVD reference sequence page on 14 November 2026: ATG GTG CAT CTG ACT
//    CCT GAG GAG AAG TCT, Met Val His Leu Thr Pro Glu Glu Lys Ser). The sickle-cell allele HbS is HBB c.20A>T, codon
//    GAG → GTG, Glu → Val (IthaGenes ithaID 824, checked 14 November 2026); by the protein convention this is
//    "codon 6" because the first methionine is removed from the finished polypeptide.
//  - Cancer models (all ILLUSTRATIVE, documented on the pages): CONTROL, the relative division-rate model of the Cell
//    Division Control Explorer; dosing(), the hypothetical treatment-schedule model of the Cell-Cycle Treatment
//    Challenge. Neither is a measurement.
//  - Data: REAL datasets are reused from B.diseaseModel (Doll 2004, Peto 2000, Brown 2018: verified 5 November 2026)
//    and added here only where new: FALCARO (HPV vaccination and cervical cancer, Lancet 2021) and CRUK_AGE (Cancer
//    Research UK, incidence by age), both read from the sources on 14 November 2026. HYPOTHETICAL datasets (TOWNS,
//    DYE) are invented for teaching and labelled HYPOTHETICAL wherever they appear.
// B.mutationArt: original SVG drawings. Marker ids carry a uid() suffix so several copies on one page never clash.
window.BIO = window.BIO || {};
(function (B) {
  const P = B.proteinModel, PA = B.proteinArt;
  // ================================================== MODEL ==================================================
  const up = (s) => String(s).toUpperCase().replace(/[^ACGT]/g, "");
  const comp = { A: "T", T: "A", G: "C", C: "G" };
  const template = (coding) => [...up(coding)].map((b) => comp[b]).join("");
  // Find the open reading frame: first AUG of the mRNA, then codons to the first stop (or the end of the sequence).
  const orf = (coding) => {
    const m = P.codingToMrna(coding), start = m.indexOf("AUG");
    if (start < 0) return { mrna: m, start: -1, codons: [], aas: [], complete: false, end: -1 };
    const codons = [], aas = []; let complete = false, i = start;
    for (; i + 3 <= m.length; i += 3) { const c = m.slice(i, i + 3), a = P.aa(c); codons.push(c); if (a === "STOP") { complete = true; i += 3; break; } aas.push(a); }
    return { mrna: m, start, codons, aas, complete, end: complete ? i : m.length };
  };
  const mutate = (coding, mu) => {
    const s = up(coding), p = mu.pos;
    if (mu.type === "sub") return s.slice(0, p) + up(mu.base) + s.slice(p + 1);
    if (mu.type === "del") return s.slice(0, p) + s.slice(p + 1);
    if (mu.type === "del3") return s.slice(0, p) + s.slice(p + 3);
    if (mu.type === "ins") return s.slice(0, p) + up(mu.base) + s.slice(p);
    return s;
  };
  // Outcome classes. Each is decided from the TRANSLATED polypeptides (original v mutant), never from the kind of edit;
  // the edit type is used only to choose the supporting term shown beside the outcome.
  const OUT = {
    unchanged: { label: "No change to the amino acid sequence", predict: "same" },
    outside: { label: "Outside the coding sequence: polypeptide unchanged", predict: "same" },
    missense: { label: "One amino acid changed", predict: "one" },
    nonsense: { label: "Stops early: a stop codon is read sooner, so the polypeptide is shorter", predict: "stop" },
    stopLost: { label: "Stop codon lost: the polypeptide is longer", predict: "other" },
    inframe: { label: "One amino acid lost (the frame is kept after the change)", predict: "other" },
    frameshift: { label: "Reading frame shifted: the amino acids change from the mutation onwards", predict: "shift" },
    startLost: { label: "Start codon destroyed: translation cannot begin at the normal start", predict: "other" },
    inframeOther: { label: "Reading frame kept, but more than one amino acid changes near the change", predict: "other" },
    newStart: { label: "A new start codon earlier in the sequence: translation begins in a different place", predict: "other" },
  };
  const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const isPrefix = (a, b) => a.length <= b.length && a.every((x, i) => x === b[i]); // a is the start of b
  // Compare two polypeptides and name the relationship. o and n are orf() results.
  const compare = (o, n) => {
    const A = o.aas, Bn = n.aas;
    // frame offset after the change, from the two mRNAs: bases from the start codon to the end of each sequence shown
    const frameOff = (((n.mrna.length - n.start) - (o.mrna.length - o.start)) % 3 + 3) % 3;
    if (eq(A, Bn) && o.complete === n.complete) return "unchanged";
    if (n.complete && Bn.length < A.length && isPrefix(Bn, A)) return "nonsense";
    if (o.complete && (Bn.length > A.length || !n.complete) && (isPrefix(A, Bn) || (frameOff === 0 && Bn.length >= A.length && isPrefix(A.slice(0, -1), Bn)))) return "stopLost";
    if (frameOff !== 0) return "frameshift";
    if (A.length === Bn.length && o.complete === n.complete && A.filter((x, i) => x !== Bn[i]).length === 1) return "missense";
    if (Bn.length === A.length - 1 && n.complete === o.complete) for (let i = 0; i < A.length; i++) { const c = A.slice(0, i).concat(A.slice(i + 1)); const d = c.map((x, k) => (x !== Bn[k] ? k : -1)).filter((k) => k >= 0); if (d.length === 0 || (d.length === 1 && (d[0] === i || d[0] === i - 1))) return "inframe"; }
    return "inframeOther";
  };
  const classify = (coding, mu) => {
    const s = up(coding), o = orf(s), mut = mutate(s, mu), n = orf(mut);
    const same = eq(o.aas, n.aas) && o.complete === n.complete;
    let firstDiff = -1; for (let i = 0; i < Math.max(o.aas.length, n.aas.length); i++) if (o.aas[i] !== n.aas[i]) { firstDiff = i; break; }
    const p = mu.pos, len = mu.type === "del3" ? 3 : 1, delta = mu.type === "ins" ? 1 : mu.type === "del" ? -1 : mu.type === "del3" ? -3 : 0;
    // where the original start codon should now be, if the edit lies wholly before it
    const lastHit = mu.type === "ins" ? p - 1 : p + len - 1;
    const before = mu.type === "ins" ? p <= o.start : lastHit < o.start;
    const expStart = before ? o.start + delta : o.start;
    const outside = o.start >= 0 && (before || (mu.type === "ins" ? p >= o.end : p >= o.end));
    let kind;
    if (o.start >= 0 && n.start !== expStart && !same) kind = n.start >= 0 && n.start < expStart ? "newStart" : "startLost";
    else if (same) kind = outside ? "outside" : "unchanged";
    else kind = compare(o, n);
    const prematureStop = n.complete && n.aas.length < o.aas.length;
    const frameEdit = o.start >= 0 && n.start >= 0 && ((((n.mrna.length - n.start) - (o.mrna.length - o.start)) % 3) + 3) % 3 !== 0; // from the sequences
    const terms = { unchanged: mu.type === "sub" ? "silent (supporting term)" : "no codon that is read changes", outside: "non-coding change (supporting)", missense: mu.type === "sub" ? "missense (supporting term)" : "the shifted frame reaches only the last codon shown", nonsense: mu.type === "sub" ? "nonsense (supporting term)" : mu.type === "del3" ? "in-frame deletion that forms a stop codon (stretch)" : "frameshift that forms a stop codon at once (supporting)", stopLost: "stop codon lost (supporting)", inframe: "in-frame deletion (stretch)", inframeOther: "in-frame change (stretch)", frameshift: "frameshift (supporting term)", startLost: "start codon lost (supporting)", newStart: "new start codon (supporting)" };
    const predictOk = (pr) => pr === OUT[kind].predict || (kind === "frameshift" && prematureStop && pr === "stop") || (kind === "nonsense" && frameEdit && pr === "shift") || (kind === "inframe" && pr === "one");
    return { kind, out: Object.assign({ term: terms[kind] }, OUT[kind]), original: o, mutated: n, mutCoding: mut, same, firstDiff, prematureStop, predictOk };
  };
  // Presets. coding = DNA coding strand 5′→3′, including a few bases before the start codon where shown.
  const GENES = [
    { id: "g1", name: "Gene 1 (hypothetical)", coding: "GCATGGCATTCGGACATTGGAAATACGGCTGAAC", note: "Two bases before the start codon and two after the stop codon. Try a substitution in the third base of a codon, then in the first." },
    { id: "g2", name: "Gene 2 (hypothetical): many codons for one amino acid", coding: "TCATGCTGGGAAGCCGTGTACCATGGTAAGT", note: "Leucine (CUG), serine (AGC) and arginine (CGU) each have six codons; tryptophan (UGG) has only one. Compare substitutions in different codons." },
    { id: "hbb", name: "Human beta-globin gene (HBB): first 10 codons (real)", coding: "ATGGTGCATCTGACTCCTGAGGAGAAGTCT", note: "Real sequence (NM_000518.4, c.1–30). The gene continues beyond the part shown, so there is no stop codon here. Base 20 (the A in the 7th codon, GAG) is the one changed in the sickle-cell allele.", real: true },
  ];

  // ---- Cell Division Control Explorer model (ILLUSTRATIVE relative values) ----
  // stim: growth-factor signal through the proto-oncogene product: 0 without growth factor, 1 with it; an oncogene gives
  //   a stronger signal (2) whether or not growth factor is present (one mutated allele is enough).
  // brake: tumour suppressor product: with at least one working allele it slows division (factor 0.5) and halts it if the
  //   DNA is damaged (factor 0); with both alleles inactivated there is no slowing and no halt (factor 1).
  // rate = stim × brake ÷ 0.5, so a normal cell with growth factor and undamaged DNA has rate 1 (the normal rate).
  const CONTROL = {
    rate({ onco = false, tsAlleles = 2, gf = true, damage = false } = {}) { const stim = onco ? 2 : gf ? 1 : 0; const brake = tsAlleles > 0 ? (damage ? 0 : 0.5) : 1; return (stim * brake) / 0.5; },
  };
  // ---- Treatment schedule model (HYPOTHETICAL, illustrative only) ----
  // Two populations, as % of their starting size. Tumour cells: uncontrolled growth of g per day (compound). Bone marrow
  // (blood-forming) cells: normal control returns them towards 100 % (logistic recovery at r per day). On each treatment
  // day a drug that acts on dividing cells removes a fraction kill × dividing fraction of each population.
  // Treatment is given every `interval` days throughout the 84 days, starting on day 1.
  const DOSE = { g: 0.04, r: 0.15, divT: 0.8, divM: 0.5, days: 84, safe: 45, strength: { low: 0.5, medium: 0.75, high: 0.95 } };
  const dosing = ({ interval = 21, strength = "medium" } = {}) => {
    const k = DOSE.strength[strength]; let t = 100, m = 100; const pts = [{ d: 0, t, m }]; let minM = 100, given = 0;
    for (let d = 1; d <= DOSE.days; d++) {
      t = t * (1 + DOSE.g); m = m + DOSE.r * m * (1 - m / 100);
      if ((d - 1) % interval === 0) { t *= 1 - k * DOSE.divT; m *= 1 - k * DOSE.divM; given++; }
      minM = Math.min(minM, m); pts.push({ d, t, m });
    }
    return { pts, end: pts[pts.length - 1], minM, unsafe: minM < DOSE.safe, given, k };
  };

  // ---- REAL data added for 3.2.11 (read from the sources on 14 November 2026) ----
  const SRC = {
    falcaro: { cite: "Falcaro M, Castanon A, Ndlela B, Checchi M, Soldan K, Lopez-Bernal J, Elliss-Brookes L, Sasieni P. The effects of the national HPV vaccination programme in England, UK, on cervical cancer and grade 3 cervical intraepithelial neoplasia incidence: a register-based observational study. Lancet 2021; 398: 2084–2092", short: "Falcaro and others, Lancet, 2021", url: "https://doi.org/10.1016/S0140-6736(21)02178-4" },
    cruk: { cite: "Cancer Research UK, Cancer incidence by age (UK; data years 2019 and 2021–2022), page read 14 November 2026", short: "Cancer Research UK", url: "https://www.cancerresearchuk.org/health-professional/cancer-statistics/incidence/age" },
    hbb: { cite: "HBB coding DNA reference sequence NM_000518.4 (Leiden Open Variation Database); HbS variant HBB:c.20A>T, IthaGenes ithaID 824", short: "LOVD / IthaGenes", url: "https://databases.lovd.nl/shared/refseq/HBB_NM_000518.4_codingDNA.html" },
  };
  // Register-based observational study, England, women aged 20–64, January 2006 to June 2019. Percentage reduction in
  // incidence compared with the unvaccinated reference cohort, by age at which the vaccine was offered (95 % CI).
  const FALCARO = { rows: [
    { label: "Offered at age 12–13", cancer: 87, cLo: 72, cHi: 94, cin3: 97 },
    { label: "Offered at age 14–16", cancer: 62, cLo: 52, cHi: 71, cin3: 75 },
    { label: "Offered at age 16–18", cancer: 34, cLo: 25, cHi: 41, cin3: 39 },
  ], prevented: { cancer: 448, cin3: 17235 }, period: "1 January 2006 to 30 June 2019", ages: "20 to 64" };
  const CRUK_AGE = { pct75: 37, peak: "85 to 89", years: "2019 and 2021–2022" };
  // ---- HYPOTHETICAL datasets ----
  // Two towns with the SAME age-specific incidence but different age structures (confounding by age).
  const TOWNS = { bands: ["Under 50", "50 to 74", "75 and over"], rate: [50, 600, 2000], // new cases per 100 000 per year
    P: { name: "Town P", pop: [40000, 30000, 20000] }, Q: { name: "Town Q", pop: [70000, 15000, 5000] } };
  const townCases = (t) => TOWNS[t].pop.map((n, i) => (n * TOWNS.rate[i]) / 100000);
  // Workers exposed to a (fictional) dye chemical v unexposed workers in the same factories: bladder cancer.
  const DYE = { exposed: { cases: 30, py: 20000, smokers: 40 }, unexposed: { cases: 25, py: 50000, smokers: 41 },
    years: [{ label: "Under 5 years", cases: 6, py: 7500 }, { label: "5 to 14 years", cases: 12, py: 8000 }, { label: "15 years or more", cases: 12, py: 4500 }] };
  const per100k = (cases, n) => (100000 * cases) / n;

  B.mutationModel = { template, orf, mutate, classify, compare, OUT, GENES, CONTROL, DOSE, dosing, SRC, FALCARO, CRUK_AGE, TOWNS, townCases, DYE, per100k };

  // ================================================== ART ==================================================
  const INK = "#16263a", GREY = "#5f6f7f", TEAL = "#1f8a8a", NAVY = "#1e3a5f", AMBER = "#c8902a", ROSE = "#b4504f", PLUM = "#8e3a6b", SAGE = "#5f8f6f";
  const MONO = PA.MONO;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 13}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.f ? ` font-family="${o.f}"` : ""}${o.st ? ` font-style="${o.st}"` : ""}>${s}</text>`;
  let cnt = 0, U = ""; const uid = () => (U = "-mu" + (++cnt));
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${col}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 1.4}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const open = (w, h, label, extra = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" style="max-width:100%;height:auto" role="img" aria-label="${label}"><rect width="${w}" height="${h}" fill="#fff"/>${extra}`;
  const box = (x, y, b, o = {}) => PA.box(x, y, b, Object.assign({ w: 24, h: 24, fs: 13 }, o));
  const hiBox = (x, y, w, h, col = ROSE) => `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="5" fill="none" stroke="${col}" stroke-width="2.4"/>`;
  const aaLabel = (a) => (a === "STOP" ? "stop" : a);

  // One strand row grouped in codons: seq (string), frameStart (index of first base of codon 1), x0, y; returns svg and x
  // positions. Bases before frameStart are drawn first, separated by a small gap.
  const W = 24, G = 2, CG = 8;
  const layout = (n, frameStart, x0) => { const xs = []; let x = x0; for (let i = 0; i < n; i++) { if (i === frameStart && i > 0) x += CG; else if (i > frameStart && (i - frameStart) % 3 === 0) x += CG; xs.push(x); x += W + G; } return xs; };
  const strand = (seq, xs, y, o = {}) => [...seq].map((b, i) => box(xs[i], y, b, o)).join("");
  const codonBraces = (xs, frameStart, nCodons, y, labels, o = {}) => { let s = ""; for (let c = 0; c < nCodons; c++) { const i = frameStart + 3 * c; if (xs[i + 2] === undefined) break; const xa = xs[i], xb = xs[i + 2] + W, xm = (xa + xb) / 2; s += `<path d="M${xa} ${y} v6 H${xb} v-6" fill="none" stroke="${o.c || NAVY}" stroke-width="1.5"/>`; if (labels && labels[c] !== undefined) s += T(xm, y + 22, aaLabel(labels[c]), { s: 13, w: 700, c: labels[c] === "STOP" ? ROSE : o.lc && o.lc[c] ? o.lc[c] : INK }); } return s; };

  // ---------- d-3.2.11.1-1: spontaneous mutation during replication (the mutagens panel was removed: the notes table covers it) ----------
  const replicationError = () => {
    uid(); const w = 760, h = 232; let s = open(w, h, "how a mispaired base during DNA replication becomes a permanent change in the base sequence after the next round of replication", `<defs>${marker("re-a", GREY)}</defs>`);
    const pair = (x, y, top, bot, hi = -1, col = ROSE) => { let o = ""; [...top].forEach((b, i) => { o += box(x + i * 26, y, b); }); [...bot].forEach((b, i) => { o += box(x + i * 26, y + 30, b); }); if (hi >= 0) o += hiBox(x + hi * 26, y, 24, 54, col); return o; };
    s += T(20, 26, "1. Parent DNA", { a: "start", s: 14, w: 700 }) + pair(20, 40, "ATGCA", "TACGT");
    s += T(20, 114, "G–C pair at position 3", { a: "start", s: 12, c: GREY });
    s += L(156, 62, 228, 50, { m: "re-a" }) + L(156, 70, 228, 136, { m: "re-a" });
    s += T(240, 26, "2. Replication: a mistake", { a: "start", s: 14, w: 700 });
    s += pair(240, 40, "ATGCA", "TATGT", 2) + T(240, 114, "T wrongly paired with G (a mismatch)", { a: "start", s: 12, c: ROSE, w: 700 });
    s += pair(240, 128, "ATGCA", "TACGT") + T(380, 152, "correct copy", { a: "start", s: 12, c: GREY });
    s += T(240, 202, "Most mismatches are corrected (supporting: DNA polymerase", { a: "start", s: 12, c: GREY }) + T(240, 218, "proofreading and repair). A few are not.", { a: "start", s: 12, c: GREY });
    s += L(376, 62, 478, 50, { m: "re-a" }) + L(376, 70, 478, 128, { m: "re-a" });
    s += T(490, 26, "3. Next replication", { a: "start", s: 14, w: 700 });
    s += pair(490, 40, "ATGCA", "TACGT") + T(630, 58, "from the G strand:", { a: "start", s: 12, c: GREY }) + T(630, 74, "the original G–C", { a: "start", s: 12, c: GREY });
    s += pair(490, 120, "ATACA", "TATGT", 2) + T(630, 136, "from the T strand:", { a: "start", s: 12, c: ROSE, w: 700 }) + T(630, 152, "A–T replaces G–C,", { a: "start", s: 12, c: ROSE, w: 700 }) + T(630, 168, "a base substitution", { a: "start", s: 12, c: ROSE, w: 700 }) + T(630, 184, "in every later copy", { a: "start", s: 12, c: ROSE, w: 700 });
    return s + "</svg>";
  };

  // ---------- d-3.2.11.1-2: substitution and deletion compared ----------
  const subDel = () => {
    uid(); const coding = "ATGGCATTCGGACATTGGTAA"; const sub = mutate(coding, { type: "sub", pos: 12, base: "G" }); const del = mutate(coding, { type: "del", pos: 7 });
    const panels = [["Original gene", coding, -1, ""], ["Base substitution: one base pair replaced (base 13: template G becomes C)", sub, 12, "sub"], ["Base deletion: one base pair removed (base 8: template A)", del, 7, "del"]];
    const w = 770, ph = 150, h = 30 + panels.length * ph; let s = open(w, h, "a short gene shown as its DNA template strand and mRNA codons with the amino acid for each codon: unchanged, after a base substitution (one codon and one amino acid change) and after a base deletion (every codon after the deletion changes)");
    const o0 = orf(coding);
    panels.forEach(([title, seq, pos, kind], k) => {
      const y0 = 24 + k * ph, info = orf(seq), m = P.codingToMrna(seq), tp = template(seq);
      const xs = layout(seq.length, 0, 146); s += T(20, y0, title, { a: "start", s: 14, w: 700, c: kind ? ROSE : INK });
      s += T(140, y0 + 30, "DNA template 3′→5′", { a: "end", s: 12, c: GREY }) + strand(tp, xs, y0 + 14);
      s += T(140, y0 + 66, "mRNA 5′→3′", { a: "end", s: 12, c: PLUM, w: 700 }) + strand(m, xs, y0 + 50);
      const lc = info.aas.map((a, i) => (a !== o0.aas[i] ? ROSE : INK)); lc.push(ROSE);
      s += codonBraces(xs, 0, Math.floor(m.length / 3), y0 + 78, info.complete ? [...info.aas, "STOP"] : [...P.codons(m).map(P.aa)], { lc: k ? lc : null });
      s += T(140, y0 + 101, "amino acids", { a: "end", s: 12, c: GREY });
      if (kind === "sub") s += hiBox(xs[pos], y0 + 14, W, 60);
      if (kind === "del") s += `<path d="M${xs[pos] - 5} ${y0 + 8} v72" stroke="${ROSE}" stroke-width="2.4" stroke-dasharray="4 3"/>`;
      const msg = kind === "sub" ? "One codon changes (CAU → GAU): one amino acid changes (His → Asp). The rest is unchanged." : kind === "del" ? "Every codon after the deletion is read in a new frame: many amino acids change (a frameshift)." : "Read from the start codon in non-overlapping triplets.";
      s += T(146, y0 + 126, msg, { a: "start", s: 12, c: kind ? ROSE : GREY, w: kind ? 600 : 500 });
    });
    return s + "</svg>";
  };

  // ---------- d-3.2.11.1-3: degenerate code: one codon, three substitutions ----------
  const degenerate = () => {
    uid(); const w = 720, h = 380; let s = open(w, h, "the codon UAC for tyrosine with three different base substitutions: UAU still codes for tyrosine, CAC codes for histidine, and UAA is a stop codon; and the four codons for glycine, which differ only in the third base", `<defs>${marker("dg-a", GREY)}</defs>`);
    const cod = (x, y, c, hi) => [...c].map((b, i) => box(x + i * 30, y, b, { w: 28, h: 28, fs: 15 })).join("") + (hi >= 0 ? hiBox(x + hi * 30, y, 28, 28) : "");
    s += T(20, 28, "One codon on mRNA: UAC codes for tyrosine (Tyr)", { a: "start", s: 15, w: 700 });
    s += cod(40, 60, "UAC", -1) + T(85, 112, "Tyr", { s: 15, w: 700 });
    const rows = [["UAU", 2, "Tyr", "Same amino acid: sequence unchanged", "silent", SAGE], ["CAC", 0, "His", "Different amino acid", "missense", AMBER], ["UAA", 2, "stop", "Stop codon: polypeptide ends early", "nonsense", ROSE]];
    rows.forEach(([c, hi, a, txt, term, colr], i) => { const y = 44 + i * 58; s += L(140, 74, 196, y + 16, { m: "dg-a" }) + cod(206, y, c, hi) + T(320, y + 20, a, { s: 15, w: 700, c: a === "stop" ? ROSE : INK }) + T(370, y + 12, txt, { a: "start", s: 13, w: 600, c: colr }) + T(370, y + 30, `supporting term: ${term}`, { a: "start", s: 12, c: GREY }); });
    s += `<rect x="20" y="226" width="680" height="136" rx="12" fill="#eef6f3" stroke="${TEAL}" stroke-width="1.4"/>`;
    s += T(40, 252, "Why: the code is degenerate. 64 codons, but only 20 amino acids.", { a: "start", s: 14, w: 700 });
    ["GGU", "GGC", "GGA", "GGG"].forEach((c, i) => { s += cod(40 + i * 108, 270, c, 2) + T(40 + i * 108 + 43, 318, "Gly", { s: 14, w: 700 }); });
    s += T(470, 284, "All four codons for glycine", { a: "start", s: 13 }) + T(470, 302, "differ only in the third base, so any", { a: "start", s: 13 }) + T(470, 320, "change to that base still gives Gly.", { a: "start", s: 13 });
    s += T(40, 348, "Not every substitution is silent: here a change in the first base, or a change to UAA, alters the polypeptide.", { a: "start", s: 12, c: GREY });
    return s + "</svg>";
  };

  // ---------- d-3.2.11.1-4: why mutations have different effects ----------
  const effects = () => {
    uid(); const w = 740, h = 556; let s = open(w, h, "a flow from a change in the DNA base sequence to changed mRNA codons, a changed amino acid sequence (primary structure), changed bonds and folding, a changed tertiary structure and a changed function, with notes on where the effect can stop", `<defs>${marker("ef-a", GREY)}</defs>`);
    const steps = [[["A base in the DNA changes"], NAVY, "#e9eef7"], [["The mRNA codon(s) change"], NAVY, "#e9eef7"], [["The amino acid sequence changes", "(primary structure)"], TEAL, "#eef6f3"], [["Different R groups, so the hydrogen,", "ionic and disulfide bonds change"], TEAL, "#eef6f3"], [["The polypeptide folds differently:", "the tertiary structure changes"], TEAL, "#eef6f3"], [["The protein's function changes", "(for example its active site)"], ROSE, "#fbe9e8"]];
    s += T(20, 26, "From a changed base to a changed protein", { a: "start", s: 15, w: 700 });
    steps.forEach(([t, c, f], i) => { const y = 44 + i * 60; s += `<rect x="20" y="${y}" width="360" height="46" rx="10" fill="${f}" stroke="${c}" stroke-width="1.6"/>` + (t.length === 1 ? T(34, y + 28, t[0], { a: "start", s: 13, w: 700 }) : T(34, y + 20, t[0], { a: "start", s: 13, w: 700 }) + T(34, y + 37, t[1], { a: "start", s: 13, w: 700 })); if (i < 5) s += L(200, y + 46, 200, y + 58, { m: "ef-a", w: 2 }); });
    const note = (i, col, lines) => { const y = 44 + i * 60 + 23; let o = L(382, y, 404, y, { c: col, w: 1.6, d: "4 3" }) + `<circle cx="404" cy="${y}" r="3" fill="${col}"/>`; lines.forEach((l, j) => (o += T(412, y - 8 + j * 16 - (lines.length - 2) * 8, l, { a: "start", s: 12, c: col, w: j ? 500 : 700 }))); return o; };
    s += note(1, SAGE, ["Can stop here: silent", "the code is degenerate, so the new codon", "may code for the same amino acid"]);
    s += note(2, SAGE, ["Little effect if the new amino acid has a", "similar R group, or is far from the", "active site or binding site"]);
    s += note(5, ROSE, ["Large effect if the active site or a", "binding site changes shape: the protein", "may not work, or may not be made at all"]);
    s += `<rect x="20" y="404" width="700" height="140" rx="12" fill="#f7f9fb" stroke="#d6dee6"/>`;
    s += T(36, 428, "The effect depends on:", { a: "start", s: 14, w: 700 });
    const pts = ["whether the amino acid sequence changes at all (many substitutions do not change it);", "the type of change: one amino acid changed (substitution), or most of the amino acids after it", "   (a deletion that shifts the reading frame), often with an early stop codon;", "where the change is: in the active site or a binding site, or near the end of the polypeptide;", "the cell: a change in a body cell affects only the cells descended from it; only a change in a gamete can be inherited."];
    pts.forEach((pt, i) => (s += T(36, 452 + i * 18, (pt.startsWith("   ") ? "" : "• ") + pt, { a: "start", s: 12 })));
    return s + "</svg>";
  };

  // ---------- d-3.2.11.2-1: benign v malignant tumour ----------
  const tumours = ({ numbers = false } = {}) => {
    uid(); const w = 760, h = numbers ? 300 : 400; let s = open(w, h, "two tumours in a tissue: a benign tumour surrounded by a capsule with a smooth edge, pushing on nearby tissue but not invading it; a malignant tumour with no capsule and an irregular edge, cells invading the surrounding tissue and entering a blood vessel and a lymph vessel");
    const tissue = (x0) => { let o = `<rect x="${x0}" y="40" width="350" height="250" rx="12" fill="#fdf1ee" stroke="#e7c9c2"/>`; for (let r = 0; r < 9; r++) for (let c = 0; c < 12; c++) { const x = x0 + 18 + c * 28 + (r % 2) * 14, y = 56 + r * 27; o += `<ellipse cx="${x}" cy="${y}" rx="11" ry="9" fill="#f9dcd5" stroke="#e3b8ae" stroke-width=".8"/>`; } return o; };
    // benign
    s += T(195, 26, "Benign tumour", { s: 16, w: 700, c: SAGE });
    s += tissue(20);
    s += `<ellipse cx="195" cy="165" rx="92" ry="74" fill="#fff" stroke="none"/><ellipse cx="195" cy="165" rx="92" ry="74" fill="none" stroke="${SAGE}" stroke-width="5"/>`;
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 14 + (i % 5) * 13; const x = 195 + r * Math.cos(a) * 0.95, y = 165 + r * Math.sin(a) * 0.75; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="#c9e3d3" stroke="${SAGE}" stroke-width="1"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${SAGE}"/>`; }
    if (!numbers) s += T(195, 312, "capsule: smooth, well-defined edge", { s: 12, c: SAGE, w: 700 });
    // malignant
    s += T(570, 26, "Malignant tumour (cancer)", { s: 16, w: 700, c: ROSE });
    s += tissue(395);
    s += `<path d="M640 40 C 630 120, 660 200, 650 290" stroke="#c0392b" stroke-width="16" fill="none" opacity=".35"/><path d="M640 40 C 630 120, 660 200, 650 290" stroke="#a03024" stroke-width="2" fill="none"/>`;
    s += `<path d="M700 40 C 710 140, 690 210, 705 290" stroke="#d9c27a" stroke-width="12" fill="none" opacity=".5"/>`;
    const blob = "M520 110 l30 -18 l22 14 l34 -6 l8 30 l26 22 l-12 26 l18 30 l-32 14 l-12 30 l-30 -10 l-28 16 l-18 -26 l-34 -6 l6 -30 l-20 -24 l20 -26z";
    s += `<path d="${blob}" fill="#fff" stroke="${ROSE}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    const mc = [[540, 130], [570, 120], [600, 132], [520, 160], [552, 158], [585, 165], [615, 170], [535, 192], [568, 196], [600, 200], [555, 226], [590, 232], [500, 150], [628, 150], [632, 200], [505, 205], [488, 125], [470, 240], [645, 112], [650, 188], [652, 250]];
    mc.forEach(([x, y], i) => { const rr = 9 + (i % 3) * 1.5; s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#f1c6c2" stroke="${ROSE}" stroke-width="1"/><circle cx="${x + 1}" cy="${y}" r="${(rr * 0.55).toFixed(1)}" fill="${ROSE}"/>`; });
    if (!numbers) s += T(640, 306, "blood", { s: 12, c: "#a03024", w: 700 }) + T(640, 320, "vessel", { s: 12, c: "#a03024", w: 700 }) + T(712, 306, "lymph", { s: 12, c: "#9a7a1c", w: 700 }) + T(712, 320, "vessel", { s: 12, c: "#9a7a1c", w: 700 });
    if (!numbers) s += T(470, 312, "no capsule; cells invade", { s: 12, c: ROSE, w: 700 });
    if (numbers) { const nb = (x, y, n) => `<circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="${INK}" stroke-width="1.8"/>` + T(x, y + 5, n, { s: 13, w: 700 }); s += nb(292, 112, 1) + L(280, 118, 268, 124, { c: INK }) + nb(470, 262, 2) + L(470, 250, 470, 244, { c: INK }) + nb(612, 280, 3) + L(622, 274, 636, 262, { c: INK }) + nb(728, 70, 4) + L(718, 74, 706, 80, { c: INK }); return s + "</svg>"; }
    // comparison strip
    const rows = [["Grows slowly", "Grows faster"], ["Capsule; does not invade", "No capsule; invades tissue"], ["Does not spread", "Can spread (metastasis)"]];
    rows.forEach(([a, b], i) => { s += T(195, 340 + i * 20, a, { s: 13, c: SAGE, w: 600 }) + T(570, 340 + i * 20, b, { s: 13, c: ROSE, w: 600 }); });
    return s + "</svg>";
  };

  // ---------- d-3.2.11.2-2: metastasis ----------
  const metastasis = () => {
    uid(); const w = 760, h = 300; let s = open(w, h, "five steps of metastasis: a malignant tumour grows and invades nearby tissue; cells break away and enter a blood or lymph vessel; they are carried around the body; they leave the vessel in another organ; they divide to form a secondary tumour", `<defs>${marker("mt-a", GREY)}</defs>`);
    const step = (x, n, t1, t2, t3, art) => `<rect x="${x}" y="30" width="138" height="250" rx="12" fill="#fff" stroke="#e3c6c1"/>` + `<circle cx="${x + 20}" cy="52" r="12" fill="${ROSE}"/>` + T(x + 20, 57, n, { s: 13, w: 700, c: "#fff" }) + art + T(x + 69, 218, t1, { s: 12.5, w: 700 }) + T(x + 69, 236, t2, { s: 12 }) + T(x + 69, 254, t3, { s: 12 });
    const cell = (x, y, r = 8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f1c6c2" stroke="${ROSE}"/><circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="${ROSE}"/>`;
    const vessel = (x, y1, y2) => `<rect x="${x}" y="${y1}" width="40" height="${y2 - y1}" rx="18" fill="#f3d4cf" stroke="#a03024" stroke-width="1.6"/>`;
    let a1 = ""; [[60, 120], [78, 110], [70, 136], [90, 128], [56, 146], [96, 150], [110, 118]].forEach(([x, y]) => (a1 += cell(x, y)));
    s += step(10, "1", "Grows and invades", "the tissue around it", "(no capsule)", a1);
    let a2 = vessel(240, 80, 200) + cell(210, 120) + cell(226, 138) + cell(258, 150, 7);
    s += step(160, "2", "Cells break away", "and enter a blood", "or lymph vessel", a2);
    let a3 = vessel(380, 80, 200) + cell(400, 110, 7) + `<path d="M400 125 v50" stroke="${GREY}" stroke-width="1.6" marker-end="url(#mt-a${U})"/>`;
    s += step(310, "3", "Carried in the blood", "or lymph to other", "parts of the body", a3);
    let a4 = vessel(480, 80, 200) + cell(536, 150, 7) + `<path d="M512 150 h14" stroke="${GREY}" stroke-width="1.6" marker-end="url(#mt-a${U})"/>`;
    s += step(460, "4", "Leave the vessel", "in another organ", "or tissue", a4);
    let a5 = `<ellipse cx="680" cy="135" rx="46" ry="40" fill="#fbe1de" stroke="${ROSE}" stroke-dasharray="4 3"/>`; [[662, 120], [684, 112], [700, 132], [670, 146], [692, 154], [656, 140]].forEach(([x, y]) => (a5 += cell(x, y)));
    s += step(610, "5", "Divide to form a", "secondary tumour", "(a metastasis)", a5);
    return s + "</svg>";
  };

  // ---------- d-3.2.11.2-3: control by proto-oncogenes and tumour suppressor genes ----------
  const control = () => {
    uid(); const w = 760, h = 480; let s = open(w, h, "control of the rate of cell division: the product of a proto-oncogene, such as a growth factor receptor, passes on a signal that stimulates division only when growth factor binds; the product of a tumour suppressor gene slows division and stops it if DNA is damaged. Below, an oncogene product signals all the time, and an inactivated tumour suppressor gene gives no brake", `<defs>${marker("ct-a", GREY)}${marker("ct-g", SAGE)}${marker("ct-r", ROSE)}</defs>`);
    s += T(20, 24, "Normal control: an accelerator and a brake", { a: "start", s: 15, w: 700 });
    s += `<g transform="translate(0 20)">`;
    // membrane & receptor
    s += `<rect x="20" y="60" width="300" height="14" fill="#e6d7b8"/>` + T(30, 54, "cell-surface membrane", { a: "start", s: 11, c: GREY });
    s += `<rect x="150" y="48" width="22" height="40" rx="6" fill="#cfe6f5" stroke="${NAVY}" stroke-width="1.6"/><rect x="176" y="48" width="22" height="40" rx="6" fill="#cfe6f5" stroke="${NAVY}" stroke-width="1.6"/>`;
    s += `<polygon points="174,22 186,34 174,46 162,34" fill="${AMBER}" stroke="#8a5f12"/>` + T(194, 38, "growth factor", { a: "start", s: 12, w: 600 });
    s += T(20, 110, "Receptor: made by a", { a: "start", s: 12, c: NAVY, w: 700 }) + T(20, 126, "proto-oncogene", { a: "start", s: 12, c: NAVY, w: 700 });
    s += L(174, 92, 174, 150, { m: "ct-g", c: SAGE, w: 2.4 }) + T(184, 126, "signal", { a: "start", s: 12, c: SAGE, w: 700 });
    s += `<rect x="110" y="156" width="130" height="40" rx="10" fill="#e8f4ec" stroke="${SAGE}" stroke-width="1.6"/>` + T(175, 181, "cell divides", { s: 13, w: 700, c: SAGE });
    // brake
    s += `<rect x="350" y="70" width="150" height="56" rx="10" fill="#fbe9e8" stroke="${ROSE}" stroke-width="1.6"/>` + T(425, 92, "tumour suppressor", { s: 12.5, w: 700, c: ROSE }) + T(425, 110, "protein", { s: 12.5, w: 700, c: ROSE });
    s += `<path d="M350 112 C 300 130, 270 160, 246 172" fill="none" stroke="${ROSE}" stroke-width="2.4"/><path d="M240 162 l10 18" stroke="${ROSE}" stroke-width="3"/>`;
    s += T(520, 88, "slows division; stops the", { a: "start", s: 12 }) + T(520, 104, "cycle if DNA is damaged", { a: "start", s: 12 }) + T(520, 120, "(supporting: can trigger", { a: "start", s: 12, c: GREY }) + T(520, 136, "cell death, apoptosis)", { a: "start", s: 12, c: GREY });
    s += `</g>`;
    // three outcome panels
    const panel = (x, title, col, lines, mini) => { let o = `<rect x="${x}" y="226" width="230" height="226" rx="12" fill="#fff" stroke="${col}" stroke-width="1.8"/>` + T(x + 115, 250, title, { s: 13.5, w: 700, c: col }); o += mini; lines.forEach((l, i) => (o += T(x + 115, 378 + i * 17, l, { s: 12 }))); return o; };
    const rec = (x, on) => `<rect x="${x}" y="276" width="14" height="30" rx="4" fill="${on ? "#f6cfcf" : "#cfe6f5"}" stroke="${on ? ROSE : NAVY}" stroke-width="1.4"/><rect x="${x + 17}" y="276" width="14" height="30" rx="4" fill="${on ? "#f6cfcf" : "#cfe6f5"}" stroke="${on ? ROSE : NAVY}" stroke-width="1.4"/>`;
    const gauge = (x, y, frac, col) => `<rect x="${x}" y="${y}" width="150" height="14" rx="7" fill="#eef1f4" stroke="#c8d1da"/><rect x="${x}" y="${y}" width="${150 * frac}" height="14" rx="7" fill="${col}"/>`;
    s += panel(20, "Normal cell", SAGE, ["Divides only when growth", "factor binds; brake works.", "Rate of division: normal."], rec(110, false) + `<polygon points="126,258 134,266 126,274 118,266" fill="${AMBER}"/>` + L(126, 310, 126, 330, { m: "ct-g", c: SAGE, w: 2 }) + gauge(60, 342, 0.35, SAGE));
    s += panel(265, "Oncogene", ROSE, ["Mutated proto-oncogene: the", "receptor signals all the time,", "with or without growth factor.", "Divides too quickly."], rec(355, true) + T(410, 296, "always on", { a: "start", s: 11.5, c: ROSE, w: 700 }) + L(371, 310, 371, 330, { m: "ct-r", c: ROSE, w: 3 }) + gauge(305, 342, 0.7, ROSE));
    s += panel(510, "Tumour suppressor inactivated", ROSE, ["Mutated tumour suppressor", "gene: no working protein,", "so nothing slows division.", "Rate of division increases."], `<rect x="570" y="272" width="110" height="34" rx="8" fill="#f2f2f2" stroke="${GREY}" stroke-dasharray="4 3"/>` + T(625, 294, "no brake", { s: 12, c: GREY, w: 700 }) + gauge(550, 342, 0.7, ROSE));
    return s + "</svg>";
  };

  // ---------- d-3.2.11.2-4: several mutations accumulate ----------
  const accumulation = () => {
    uid(); const w = 760, h = 330; let s = open(w, h, "a cell lineage over many years: a first mutation activates an oncogene and the clone grows a little faster; later both alleles of a tumour suppressor gene are inactivated; further mutations follow until the cells divide without control and become invasive", `<defs>${marker("ac-a", GREY)}</defs>`);
    s += T(20, 26, "Usually several mutations build up in one line of cells, often over many years", { a: "start", s: 14.5, w: 700 });
    s += L(40, 290, 730, 290, { m: "ac-a", w: 2 }) + T(730, 312, "time (often years to decades)", { a: "end", s: 12, c: GREY });
    const stages = [[90, 1, "#e8f4ec", SAGE, "Normal cell", ["controlled", "division"]], [230, 3, "#fdf1e2", AMBER, "1st mutation", ["proto-oncogene →", "oncogene"]], [370, 5, "#fdf1e2", AMBER, "2nd and 3rd", ["both tumour", "suppressor alleles", "inactivated"]], [520, 9, "#fbe1de", ROSE, "More mutations", ["division out of", "control: tumour"]], [665, 13, "#f6cfcf", ROSE, "Further changes", ["invasion and", "metastasis"]]];
    stages.forEach(([x, n, f, c, title, lines], i) => { for (let k = 0; k < n; k++) { const a = k * 2.39996, r = 7 * Math.sqrt(k); s += `<circle cx="${(x + r * Math.cos(a)).toFixed(1)}" cy="${(110 + r * Math.sin(a)).toFixed(1)}" r="9" fill="${f}" stroke="${c}" stroke-width="1.2"/><circle cx="${(x + r * Math.cos(a)).toFixed(1)}" cy="${(110 + r * Math.sin(a)).toFixed(1)}" r="3.2" fill="${c}"/>`; }
      s += T(x, 182, title, { s: 13, w: 700, c }); lines.forEach((l, j) => (s += T(x, 200 + j * 16, l, { s: 12 }))); s += `<circle cx="${x}" cy="290" r="5" fill="${c}"/>`; if (i < 4) s += L(x + 40, 110, x + 90, 110, { m: "ac-a" }); });
    s += T(20, 274, "One mutation alone is usually not enough: other controls still work.", { a: "start", s: 12, c: GREY });
    return s + "</svg>";
  };

  // ---------- d-3.2.11.2-5: cell cycle and drug targets ----------
  const cycleDrugs = () => {
    uid(); const w = 720, h = 380, cx = 190, cy = 200, R = 130; let s = open(w, h, "the cell cycle as a circle: G1, S phase (DNA replication), G2 and mitosis. A drug that stops DNA replication acts in S phase; a drug that prevents spindle formation stops mitosis at metaphase. Both affect only cells that are dividing", `<defs>${marker("cd-a", GREY)}</defs>`);
    const arc = (a0, a1, col, lab, sub) => { const p = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, R - 40), [x3, y3] = p(a0, R - 40); const big = a1 - a0 > Math.PI ? 1 : 0; const am = (a0 + a1) / 2, [lx, ly] = p(am, R - 20);
      return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${big} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} A${R - 40} ${R - 40} 0 ${big} 0 ${x3.toFixed(1)} ${y3.toFixed(1)}z" fill="${col}" stroke="#fff" stroke-width="3"/>` + T(lx.toFixed(1), (ly + 5).toFixed(1), lab, { s: 14, w: 700 }) + (sub ? T(lx.toFixed(1), (ly + 21).toFixed(1), sub, { s: 10.5 }) : ""); };
    const a = (deg) => (deg * Math.PI) / 180 - Math.PI / 2;
    s += arc(a(0), a(140), "#d6efec", "G1", "") + arc(a(140), a(250), "#cfe0f3", "S", "") + arc(a(250), a(320), "#e6ecd6", "G2", "") + arc(a(320), a(360), "#f6d6d2", "M", "");
    s += T(cx, cy - 6, "the cell", { s: 13, c: GREY }) + T(cx, cy + 12, "cycle", { s: 13, c: GREY });
    s += T(20, 26, "G1: growth; S: DNA replication; G2: growth and protein synthesis; M: mitosis", { a: "start", s: 12, c: GREY });
    const tag = (deg, x, y, col, l1, l2, l3) => { const [px, py] = [cx + (R + 4) * Math.cos(a(deg)), cy + (R + 4) * Math.sin(a(deg))]; return L(px.toFixed(1), py.toFixed(1), x - 6, y, { c: col, w: 2 }) + `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="${col}"/>` + `<rect x="${x}" y="${y - 22}" width="300" height="70" rx="10" fill="#fff" stroke="${col}" stroke-width="1.8"/>` + T(x + 12, y - 2, l1, { a: "start", s: 13, w: 700, c: col }) + T(x + 12, y + 16, l2, { a: "start", s: 12 }) + T(x + 12, y + 33, l3, { a: "start", s: 12 }); };
    s += tag(170, 400, 290, NAVY, "Drug that stops DNA replication", "Cells cannot complete S phase, so", "they cannot go on to divide.");
    s += tag(340, 400, 70, ROSE, "Drug that prevents spindle formation", "Chromatids cannot be separated:", "mitosis stops at metaphase.");
    s += T(400, 176, "Both act only on cells that are dividing:", { a: "start", s: 12.5, w: 700 }) + T(400, 194, "cancer cells, but also normal fast-dividing", { a: "start", s: 12.5 }) + T(400, 212, "cells (hair follicles, bone marrow, gut lining).", { a: "start", s: 12.5 });
    s += T(20, 360, "Phase lengths not to scale. Drugs are hypothetical examples of each type; you do not need to learn drug names.", { a: "start", s: 11.5, c: GREY });
    return s + "</svg>";
  };

  // ---------- small bar chart (horizontal) for the data investigator and questions ----------
  const barChart = ({ title = "", sub = "", cats = [], vals = [], max, unit = "", colors = [], fmt = (v) => String(v), w = 480, compact = false } = {}) => {
    // compact (wide screens): category labels in a column to the left of the bars, so six bars fit in about 280 px.
    if (compact) { uid(); const W = 640, rowH = 32, top = sub ? 56 : 36, lw = 196, H = top + cats.length * rowH + 26, bx = lw + 8, bw = W - bx - 84; const mx = max || Math.max(...vals) * 1.1;
      let o = open(W, H, `${title}. ${cats.map((c, i) => `${c}: ${fmt(vals[i])}`).join("; ")}`);
      o += T(8, 20, title, { a: "start", s: 16, w: 700 }) + (sub ? T(8, 40, sub, { a: "start", s: 13, c: GREY }) : "");
      cats.forEach((c, i) => { const y = top + i * rowH, len = Math.max(0, (vals[i] / mx) * bw); o += T(lw, y + 20, c, { a: "end", s: 14 }) + `<rect x="${bx}" y="${y + 5}" width="${len.toFixed(1)}" height="20" rx="4" fill="${colors[i] || TEAL}"/>` + T(bx + len + 6, y + 20, fmt(vals[i]), { a: "start", s: 14, w: 700 }); });
      o += unit ? T(bx, H - 6, unit, { a: "start", s: 13, c: GREY }) : "";
      return o + "</svg>"; }
    // Category label above each bar, so the chart stays legible when scaled to a phone screen.
    uid(); const rowH = 46, top = sub ? 58 : 40, h = top + cats.length * rowH + 24, x0 = 16, bw = w - x0 - 76; const mx = max || Math.max(...vals) * 1.1;
    let s = open(w, h, `${title}. ${cats.map((c, i) => `${c}: ${fmt(vals[i])}`).join("; ")}`);
    s += T(x0, 20, title, { a: "start", s: 15, w: 700 }) + (sub ? T(x0, 40, sub, { a: "start", s: 11.5, c: GREY }) : "");
    cats.forEach((c, i) => { const y = top + i * rowH, len = Math.max(0, (vals[i] / mx) * bw); s += T(x0, y + 14, c, { a: "start", s: 13 }) + `<rect x="${x0}" y="${y + 20}" width="${len.toFixed(1)}" height="20" rx="4" fill="${colors[i] || TEAL}"/>` + T(x0 + len + 6, y + 35, fmt(vals[i]), { a: "start", s: 13, w: 700 }); });
    s += unit ? T(x0, h - 6, unit, { a: "start", s: 11.5, c: GREY }) : "";
    return s + "</svg>";
  };
  // ---------- dosing line chart ----------
  const doseChart = (res, { safe = DOSE.safe, w = 520 } = {}) => {
    uid(); const h = 320, x0 = 56, y0 = 30, pw = w - x0 - 20, ph = 210; const mx = Math.max(100, Math.ceil(Math.max(...res.pts.map((p) => p.t), ...res.pts.map((p) => p.m)) / 50) * 50); const X = (d) => x0 + (d / DOSE.days) * pw, Y = (v) => y0 + ph - (Math.min(v, mx) / mx) * ph;
    let s = open(w, h, `hypothetical model: tumour cells end at ${res.end.t.toFixed(0)} % and bone marrow cells fall to a lowest value of ${res.minM.toFixed(0)} % of their starting number`);
    for (let v = 0; v <= mx; v += 50) s += L(x0, Y(v), x0 + pw, Y(v), { c: "#e3e8ee", w: 1 }) + T(x0 - 6, Y(v) + 4, v, { a: "end", s: 13, c: GREY });
    for (let d = 0; d <= DOSE.days; d += 14) s += T(X(d), y0 + ph + 20, d, { s: 13, c: GREY });
    s += T(x0 + pw / 2, h - 10, "time / days", { s: 13, c: GREY }) + T(14, y0 - 12, "cells (% of starting number)", { a: "start", s: 13, c: GREY });
    s += L(x0, Y(safe), x0 + pw, Y(safe), { c: AMBER, w: 1.6, d: "6 4" });
    const path = (k) => res.pts.map((p, i) => `${i ? "L" : "M"}${X(p.d).toFixed(1)} ${Y(p[k]).toFixed(1)}`).join(" ");
    s += `<path d="${path("t")}" fill="none" stroke="${ROSE}" stroke-width="2.6"/><path d="${path("m")}" fill="none" stroke="${NAVY}" stroke-width="2.6" stroke-dasharray="7 4"/>`;
    s += `<rect x="${x0 + 8}" y="${y0 + 2}" width="16" height="4" fill="${ROSE}"/>` + T(x0 + 30, y0 + 8, "tumour cells", { a: "start", s: 13, c: ROSE, w: 700 }) + `<rect x="${x0 + 140}" y="${y0 + 2}" width="16" height="4" fill="${NAVY}"/>` + T(x0 + 162, y0 + 8, "bone marrow cells", { a: "start", s: 13, c: NAVY, w: 700 }) + L(x0 + 8, y0 + 22, x0 + 26, y0 + 22, { c: AMBER, w: 1.6, d: "6 4" }) + T(x0 + 30, y0 + 27, `${safe} % line: marrow too low`, { a: "start", s: 12.5, c: "#8a5f12", w: 700 });
    return s + "</svg>";
  };

  B.mutationArt = { replicationError, subDel, degenerate, effects, tumours, metastasis, control, accumulation, cycleDrugs, barChart, doseChart, layout, colours: { INK, GREY, TEAL, NAVY, AMBER, ROSE, PLUM, SAGE }, MONO };
})(window.BIO);
