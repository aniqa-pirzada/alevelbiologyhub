// Shared models and artwork for 3.2.4 HIV (Phase 4 Batch 2, owned by the 3.2.4 author).
// Loaded before data/content/3.2.4.1.js, 3.2.4.2.js, data/consolidation/3.2.4.js and js/views/interactives-hiv.js.
//
// Scientific basis (checked 9 November 2026; full citations on the pages):
//  - Particle: roughly spherical, about 100–120 nm across; lipid bilayer envelope derived from the host cell; envelope
//    glycoprotein spikes (trimers; their names are not taught); matrix protein lines the inside of the envelope (supporting);
//    cone-shaped protein capsid enclosing two copies of single-stranded RNA with reverse transcriptase, integrase and
//    protease (OxfordAQA 9610 v5.1 wording; ASHM "HIV structure and organisation").
//  - Cycle (NIH HIVinfo "The HIV Life Cycle"): binding to CD4, fusion, reverse transcription, integration, replication
//    (transcription and translation into long protein chains), assembly at the cell surface (immature particles),
//    budding, then protease cuts the long chains so the particle matures and becomes infectious.
//  - Latent reservoir (Kimata, Rice and Wang 2016, Curr Opin Immunol 42: 65–70): resting memory CD4 T cells carry
//    transcriptionally silent integrated viral DNA; antiretroviral drugs do not remove it; viral load rebounds when
//    treatment is interrupted.
//  - CD4 counts: healthy adults about 500 to 1,200 cells per mm³; 200 or fewer cells per mm³ in a person with HIV
//    means AIDS (MedlinePlus "CD4 Lymphocyte Count").
// The CD4 and viral-load curves below are ILLUSTRATIVE: their shapes follow the textbook natural history (acute peak,
// lower set point, slow CD4 decline over years, recovery and viral suppression on treatment, rebound on interruption)
// but no individual or study is represented. Every number quoted on the pages is computed from B.hivModel.
// Every drawing has a white background so it reads on the light "paper" panel the site uses in dark mode.
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ model ------------------------------------------------------------------
  const round = (x, dp = 1) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 1) => round(x, dp).toFixed(dp);
  const interp = (k, t) => { if (t <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0); } return k[k.length - 1][1]; };
  // t in years from infection. CD4 in cells per mm³; viral load as log10(copies per cm³) (1 cm³ = 1 mL).
  const UN_CD4 = [[0, 1000], [0.06, 900], [0.12, 620], [0.25, 760], [0.5, 800], [1, 770], [2, 710], [4, 590], [6, 470], [8, 350], [10, 210], [11, 120], [12, 50]];
  const UN_VL = [[0, 1.0], [0.04, 3.5], [0.08, 6.6], [0.12, 6.0], [0.25, 4.6], [0.5, 4.3], [2, 4.4], [4, 4.6], [6, 4.8], [8, 5.0], [10, 5.5], [11, 5.9], [12, 6.2]];
  const ART_START = 4, ART_STOP = 8;
  const ART_CD4 = [[4, 590], [4.5, 650], [5, 700], [6, 760], [8, 810], [12, 850]];
  const ART_VL = [[4, 4.6], [4.1, 3.2], [4.3, 2.2], [4.6, 1.4], [12, 1.4]];
  const INT_CD4 = [[8, 810], [8.5, 720], [9, 650], [10, 560], [12, 420]];
  const INT_VL = [[8, 1.4], [8.1, 2.8], [8.25, 4.4], [8.5, 4.6], [12, 5.0]];
  const DETECT = 1.7; // log10 copies per cm³ shown as the limit of detection of the test (illustrative, about 50 copies)
  const SCEN = {
    untreated: { label: "No treatment", desc: "Illustrative course of untreated HIV infection." },
    art: { label: `Treatment started at year ${ART_START}`, desc: `Illustrative: antiretroviral therapy (a combination of drugs) begins at year ${ART_START} and continues.` },
    interrupt: { label: `Treatment from year ${ART_START}, stopped at year ${ART_STOP}`, desc: `Illustrative: therapy from year ${ART_START} to year ${ART_STOP}, then stopped. Stopping treatment is not recommended; this scenario shows why.` },
  };
  const cd4 = (sc, t) => { if (sc === "untreated" || t <= ART_START) return interp(UN_CD4, t); if (sc === "interrupt" && t > ART_STOP) return interp(INT_CD4, t); return interp(ART_CD4, t); };
  const vlLog = (sc, t) => { if (sc === "untreated" || t <= ART_START) return interp(UN_VL, t); if (sc === "interrupt" && t > ART_STOP) return interp(INT_VL, t); return interp(ART_VL, t); };
  const vl = (sc, t) => 10 ** vlLog(sc, t);
  const phase = (sc, t) => {
    if (t < 0.25) return { key: "acute", name: "Acute (early) infection", text: "In the first weeks HIV replicates rapidly in helper T cells and the viral load reaches a very high peak. Many helper T cells are infected and destroyed, so the CD4 count dips. Some people have a short flu-like illness; others notice nothing." };
    if (sc !== "untreated" && t >= ART_START && !(sc === "interrupt" && t > ART_STOP)) return { key: "treated", name: "On antiretroviral therapy", text: "The drugs inhibit viral enzymes, so few new cells are infected. Viral load falls below the limit of detection of the test and new helper T cells made by the body are no longer destroyed as fast, so the CD4 count rises. Integrated viral DNA remains in long-lived resting cells, so treatment must continue." };
    if (sc === "interrupt" && t > ART_STOP) return { key: "rebound", name: "After treatment stops", text: "Within weeks, viral DNA that had stayed silent in long-lived resting cells (the latent reservoir) is transcribed again. New virus particles infect more helper T cells, viral load rebounds and the CD4 count falls again. The drugs had suppressed replication; they had not removed the virus." };
    const c = cd4(sc, t);
    if (c <= 200) return { key: "aids", name: "AIDS (CD4 count 200 per mm³ or fewer)", text: "So few helper T cells remain that the immune system cannot respond effectively to pathogens it would normally control. Opportunistic infections and some cancers develop. AIDS is a syndrome: a set of illnesses that result from the damaged immune system, not a separate infection. (Supporting) AIDS is diagnosed by a CD4 count of 200 per mm³ or fewer, or by an AIDS-defining opportunistic infection at any CD4 count." };
    return { key: "chronic", name: "Chronic infection, often without symptoms", text: "The immune response lowers the viral load to a 'set point', but HIV keeps replicating. Helper T cells are destroyed faster than they are replaced, so the CD4 count falls slowly, often over many years, while the person may feel well." };
  };
  const rows = (sc, times) => times.map((t) => ({ t, cd4: Math.round(cd4(sc, t) / 10) * 10, vlLog: round(vlLog(sc, t), 1) }));
  const sup = (n) => String(n).replace(/[-0-9]/g, (c) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]);
  const sci = (lg) => `10${sup(lg)}`;
  // complementary bases for the reverse-transcription figure and questions
  const RNA_SEQ = "AUGGCAUUC";
  const compDNA = (rna) => [...rna].map((b) => ({ A: "T", U: "A", G: "C", C: "G" })[b]).join("");
  const compOfDNA = (dna) => [...dna].map((b) => ({ A: "T", T: "A", G: "C", C: "G" })[b]).join("");
  // HYPOTHETICAL cell-culture experiment: helper T cells infected with HIV and grown with one of three test drugs.
  // Each drug inhibits one viral enzyme; values are invented for teaching and are internally consistent with the mechanism.
  const CULTURE = {
    none: { label: "No drug (control)", dna: 100, integ: 100, rna: 100, particles: 100, infectious: 100 },
    X: { label: "Drug X", dna: 3, integ: 2, rna: 2, particles: 2, infectious: 2 },
    Y: { label: "Drug Y", dna: 98, integ: 4, rna: 3, particles: 3, infectious: 3 },
    Z: { label: "Drug Z", dna: 99, integ: 97, rna: 96, particles: 95, infectious: 4 },
  };
  B.hivModel = { round, fix, interp, cd4, vl, vlLog, phase, rows, SCEN, ART_START, ART_STOP, DETECT, sci, RNA_SEQ, compDNA, compOfDNA, CULTURE, UN_CD4 };

  // ------------------------------------------------------------------ artwork ------------------------------------------------------------------
  let cnt = 0, U = ""; const uid = () => (U = "-hv" + (++cnt));
  const INK = "#16263a", GREY = "#5f6f7f", ENV = "#c98a2b", ENVF = "#f6dfb0", GP = "#2e7d4f", GPF = "#9fd8b4", MAT = "#7a5aa0", MATF = "#e2d4f0", CAP = "#1f66b0", CAPF = "#e3eefa", RNA = "#a3367f", DNA = "#1f66b0", HOST = "#6b7d8f", RT = "#6b3fa0", IN = "#a86a00", PR = "#2e7d4f", BLOCK = "#b4232f", CELL = "#eef6f2", CELLS = "#3f6f62", GOLD = "#c8902a";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 11}" font-weight="${o.w || 600}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}>${s}</text>`;
  const TL = (x, y, lines, o = {}) => lines.map((l, i) => T(x, y + i * (o.lh || 13.5), l, o)).join("");
  const marker = (id, c) => `<marker id="${id}${U}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 1.4}"${o.da ? ` stroke-dasharray="${o.da}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const P = (d, o = {}) => `<path d="${d}" fill="${o.f || "none"}" stroke="${o.c || GREY}" stroke-width="${o.w || 2}"${o.da ? ` stroke-dasharray="${o.da}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const open = (w, h, label, defs = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}" style="max-width:100%;height:auto"><defs>${defs}</defs><rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>`;
  const defsAll = () => marker("g", GREY) + marker("r", RNA) + marker("d", DNA) + marker("k", INK) + marker("x", BLOCK);
  const wave = (x1, x2, y, amp = 5, per = 22) => { let d = `M${x1} ${y}`; for (let x = x1; x < x2; x += per / 2) { const nx = Math.min(x2, x + per / 2); d += ` Q${(x + nx) / 2} ${y + (((x - x1) / (per / 2)) % 2 ? amp : -amp) * 1.6} ${nx} ${y}`; } return d; };
  const badge = (x, y, n, o = {}) => `<g><circle cx="${x}" cy="${y}" r="${o.r || 12}" fill="${o.f || INK}" stroke="${o.ring ? GOLD : "#fff"}" stroke-width="${o.ring ? 4 : 1.5}"/>${T(x, y + 4.2, n, { s: o.s || 12, w: 700, c: "#fff" })}</g>`;
  const enzyme = (x, y, txt, fill) => `<rect x="${x - 17}" y="${y - 9}" width="34" height="18" rx="7" fill="${fill}" stroke="#ffffff" stroke-width="1.2"/>${T(x, y + 4, txt, { s: 10, w: 700, c: "#fff" })}`;
  const cross = (x, y, r = 15) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${BLOCK}" stroke-width="3.5"/><line x1="${x - r * 0.55}" y1="${y - r * 0.55}" x2="${x + r * 0.55}" y2="${y + r * 0.55}" stroke="${BLOCK}" stroke-width="3.5"/><line x1="${x + r * 0.55}" y1="${y - r * 0.55}" x2="${x - r * 0.55}" y2="${y + r * 0.55}" stroke="${BLOCK}" stroke-width="3.5"/></g>`;
  const pol = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];

  // A glycoprotein spike: stem crossing the bilayer (gp41) with a three-lobed head (gp120 trimer). k scales it.
  const spike = (cx, cy, r, a, k = 1) => { const [x1, y1] = pol(cx, cy, r - 7 * k, a), [x2, y2] = pol(cx, cy, r + 20 * k, a), [hx, hy] = pol(cx, cy, r + 27 * k, a);
    const lobes = [-1, 0, 1].map((j) => { const [lx, ly] = pol(hx, hy, 6 * k, a + 90 * j + (j ? 0 : 0)); return `<circle cx="${j === 0 ? pol(hx, hy, 4 * k, a)[0] : lx}" cy="${j === 0 ? pol(hx, hy, 4 * k, a)[1] : ly}" r="${5.5 * k}" fill="${GPF}" stroke="${GP}" stroke-width="${1.2 * k}"/>`; }).join("");
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GP}" stroke-width="${3 * k}" stroke-linecap="round"/>${lobes}`; };
  // Cone-shaped capsid centred at (cx, cy) with length len; narrow end to the left.
  const conePath = (cx, cy, len, nh, wh) => { const x1 = cx - len / 2, x2 = cx + len / 2; return `M${x1} ${cy - nh} L${x2} ${cy - wh} Q${x2 + wh * 0.55} ${cy} ${x2} ${cy + wh} L${x1} ${cy + nh} Q${x1 - nh * 0.55} ${cy} ${x1} ${cy - nh} Z`; };

  // ---------- 1. Labelled HIV particle ----------
  // o.numbered: replace the names by numbers (labelling question); o.parts: wrap each part in <g data-part> (explorer);
  // o.noLabels: drawing only. Part keys: glycoprotein, envelope, matrix, capsid, rna, rt, integrase, protease.
  const PART_ORDER = ["glycoprotein", "envelope", "matrix", "capsid", "rna", "rt", "integrase", "protease"];
  const particle = (o = {}) => {
    uid(); const cx = 430, cy = 255, R = 168;
    const label = "Section through an HIV particle. An outer envelope (a phospholipid bilayer from the host cell's plasma membrane) carries glycoprotein spikes. Inside it, a ring of matrix protein, then a cone-shaped protein capsid that encloses two single strands of RNA and the enzymes reverse transcriptase, integrase and protease.";
    let s = open(860, 500, label, defsAll());
    s += T(20, 24, o.title || "Structure of HIV: section through one particle", { a: "start", s: 13, w: 700 });
    const grp = (key, inner) => (o.parts ? `<g data-part="${key}" class="hiv-part" tabindex="0" role="button" aria-label="${({ glycoprotein: "glycoprotein", envelope: "envelope", matrix: "matrix protein", capsid: "capsid", rna: "RNA", rt: "reverse transcriptase", integrase: "integrase", protease: "protease" })[key]}" style="cursor:pointer">${inner}</g>` : `<g>${inner}</g>`);
    const nums = o.numbered ? Object.fromEntries((o.numbered === true ? PART_ORDER : o.numbered).map((k, i) => [k, i + 1])) : null;
    // label helper: either names (lines) or a number badge at the label position
    const lab = (key, x, y, lines, anchor, tx, ty) => { if (o.noLabels) return ""; const lx = anchor === "end" ? x + 4 : x - 4;
      if (nums) { if (!nums[key]) return ""; const bx = anchor === "end" ? x - 10 : x + 10; return L(anchor === "end" ? x - 22 : x + 22, y - 4, tx, ty, { c: INK, w: 1.2 }) + badge(bx, y - 4, nums[key], { r: 12 }); }
      return L(lx, y - 4, tx, ty, { c: INK, w: 1.2 }) + `<circle cx="${tx}" cy="${ty}" r="2.4" fill="${INK}"/>` + TL(x, y, lines, { a: anchor, s: 12, w: 600 }); };
    // envelope (bilayer) with interior
    const env = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fffdf7"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${ENVF}" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${R + 5}" fill="none" stroke="${ENV}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R - 5}" fill="none" stroke="${ENV}" stroke-width="2"/>`;
    const gps = Array.from({ length: 10 }, (_, i) => spike(cx, cy, R, -90 + i * 36)).join("");
    const mat = Array.from({ length: 40 }, (_, i) => { const [x, y] = pol(cx, cy, R - 16, i * 9); return `<circle cx="${x}" cy="${y}" r="4.2" fill="${MATF}" stroke="${MAT}" stroke-width="1"/>`; }).join("");
    const cap = `<path d="${conePath(cx + 5, cy, 200, 30, 70)}" fill="${CAPF}" stroke="${CAP}" stroke-width="3.2"/><path d="${conePath(cx + 5, cy, 186, 24, 62)}" fill="none" stroke="${CAP}" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>`;
    const rna = P(wave(332, 452, 243, 4, 20), { c: RNA, w: 3 }) + P(wave(332, 452, 267, 4, 20), { c: RNA, w: 3 });
    s += grp("envelope", env + lab("envelope", 226, 196, ["envelope: phospholipid", "bilayer from the host", "cell's plasma membrane"], "end", cx - R - 3, cy - 20));
    s += grp("glycoprotein", gps + lab("glycoprotein", 226, 66, ["glycoprotein", "(in the envelope)"], "end", 313, 92));
    s += grp("matrix", mat + lab("matrix", 226, 336, ["matrix protein", "(supporting)"], "end", pol(cx, cy, R - 16, 158)[0], pol(cx, cy, R - 16, 158)[1]));
    s += grp("capsid", cap + lab("capsid", 640, 136, ["capsid (protein)"], "start", 470, 196));
    s += grp("rna", rna + lab("rna", 226, 432, ["RNA: two single", "strands (the genome)"], "end", 345, 268));
    s += grp("rt", enzyme(497, 215, nums ? "" : "RT", RT) + lab("rt", 640, 219, ["reverse transcriptase"], "start", 515, 215));
    s += grp("integrase", enzyme(497, 255, nums ? "" : "IN", IN) + lab("integrase", 640, 259, ["integrase"], "start", 515, 255));
    s += grp("protease", enzyme(497, 295, nums ? "" : "PR", PR) + lab("protease", 640, 299, ["protease"], "start", 515, 295));
    if (!o.noLabels && !nums) s += TL(640, 360, ["RT, IN and PR are enzymes", "(proteins) carried inside", "the capsid"], { a: "start", s: 10.5, w: 500, c: GREY });
    // o.caption === false (the Structure Explorer): the caption is shown as HTML text under the drawing instead
    if (o.caption !== false) s += T(20, 488, PARTICLE_CAPTION, { a: "start", s: 10.5, w: 500, c: GREY });
    else s = s.replace('viewBox="0 0 860 500"', 'viewBox="0 0 860 462"');
    return s + "</svg>";
  };
  const PARTICLE_CAPTION = "Not to scale. One particle is about 100 to 120 nm across. Real particles carry many copies of each enzyme; one of each is drawn.";
  const particleParts = PART_ORDER;

  // Small whole particle for use inside other figures. mature: cone capsid; otherwise an immature shell of polyproteins.
  const mini = (cx, cy, r, o = {}) => { const k = r / 60; let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffdf7" stroke="${ENV}" stroke-width="${Math.max(2, 4 * k)}"/>`;
    s += Array.from({ length: o.spikes || 8 }, (_, i) => spike(cx, cy, r, -90 + (i * 360) / (o.spikes || 8), k * 0.9)).join("");
    if (o.mature === false) s += Array.from({ length: 22 }, (_, i) => { const [x, y] = pol(cx, cy, r * 0.72, (i * 360) / 22); return `<circle cx="${x}" cy="${y}" r="${4.5 * k + 1}" fill="${MATF}" stroke="${MAT}" stroke-width="1"/>`; }).join("");
    else { const mr = r - Math.max(2, 4 * k) / 2 - 2.6 * k - 1, mw = Math.max(2.2, 3.6 * k), dash = `${(mw * 1.05).toFixed(2)} ${(mw * 0.45).toFixed(2)}`; // thin matrix layer lining the envelope (supporting)
      s += `<circle cx="${cx}" cy="${cy}" r="${mr.toFixed(2)}" fill="none" stroke="${MAT}" stroke-width="${(mw + 1).toFixed(2)}" stroke-dasharray="${dash}"/><circle cx="${cx}" cy="${cy}" r="${mr.toFixed(2)}" fill="none" stroke="${MATF}" stroke-width="${(mw - 0.6).toFixed(2)}" stroke-dasharray="${dash}"/>`;
      s += `<path d="${conePath(cx + 2 * k, cy, 70 * k, 11 * k, 25 * k)}" fill="${CAPF}" stroke="${CAP}" stroke-width="${Math.max(1.4, 2.4 * k)}"/>`; }
    s += P(wave(cx - 20 * k, cx + 16 * k, cy - 4 * k, 2 * k, 10 * k), { c: RNA, w: Math.max(1.2, 2 * k) }) + P(wave(cx - 20 * k, cx + 16 * k, cy + 5 * k, 2 * k, 10 * k), { c: RNA, w: Math.max(1.2, 2 * k) });
    return s; };

  // ---------- 2. Where the envelope comes from (budding close-up), 3.2.4.1 ----------
  const budding = () => {
    uid(); const my = 230; // membrane centre line
    let s = open(860, 400, "Four stages of a new HIV particle leaving a helper T cell. 1: viral glycoproteins sit in the host plasma membrane while viral RNA and proteins gather beneath it. 2: the membrane bulges outwards around the assembling particle. 3: the particle pinches off, wrapped in host membrane that carries the viral glycoproteins; the cell membrane reseals. 4, supporting: protease cuts the long viral protein chains and the cone-shaped capsid forms; a thin layer of matrix protein stays lining the envelope.", defsAll());
    s += T(20, 24, "Where the envelope comes from: budding from the host cell", { a: "start", s: 13, w: 700 });
    s += `<rect x="0" y="${my + 6}" width="860" height="${306 - my}" fill="${CELL}"/>`;
    s += T(20, 48, "outside the cell", { a: "start", s: 10.5, w: 600, c: GREY }) + T(20, my + 60, "cytoplasm of the helper T cell", { a: "start", s: 10.5, w: 600, c: GREY });
    const memb = (d) => P(d, { c: ENVF, w: 10 }) + P(d, { c: ENV, w: 1.6 });
    const flatL = `M0 ${my} L250 ${my}`, dome = `M250 ${my} C 280 ${my} 270 ${my - 120} 330 ${my - 120} C 390 ${my - 120} 380 ${my} 410 ${my}`, flatR = `M410 ${my} L860 ${my}`;
    s += `<path d="${dome} L410 ${my + 6} L250 ${my + 6} Z" fill="${CELL}"/>`; // bud interior is cytoplasm
    s += memb(flatL) + memb(dome) + memb(flatR);
    // stage 1
    [80, 120, 160].forEach((x) => { s += spike(x, my + 400, 400, -90, 0.9); });
    s += Array.from({ length: 7 }, (_, i) => `<circle cx="${84 + i * 12}" cy="${my + 22}" r="5" fill="${MATF}" stroke="${MAT}" stroke-width="1"/>`).join("") + P(wave(86, 156, my + 40, 3, 14), { c: RNA, w: 2.4 });
    // stage 2 (dome)
    [[-150, 289, my - 88], [-90, 330, my - 112], [-30, 371, my - 88]].forEach(([a, x, y]) => { s += spike(x, y, 0.1, a, 0.9); });
    s += Array.from({ length: 11 }, (_, i) => { const [x, y] = pol(330, my - 52, 44, 180 + i * 18); return `<circle cx="${x}" cy="${y}" r="5" fill="${MATF}" stroke="${MAT}" stroke-width="1"/>`; }).join("") + P(wave(306, 352, my - 46, 3, 12), { c: RNA, w: 2.4 }) + P(wave(306, 352, my - 34, 3, 12), { c: RNA, w: 2.4 });
    // stage 3: released immature particle; stage 4: mature particle
    s += mini(560, 110, 46, { mature: false }) + mini(770, 110, 46, { mature: true });
    s += L(430, 110, 478, 110, { c: GREY, w: 2, m: "g" }) + L(646, 110, 688, 110, { c: GREY, w: 2, m: "g" }) + L(185, my - 50, 245, my - 50, { c: GREY, w: 2, m: "g" });
    // labels
    s += L(78, my - 72, 92, my - 32, { c: INK, w: 1 }) + T(20, my - 92, "viral glycoprotein", { s: 10.5, a: "start" }) + T(20, my - 79, "in host membrane", { s: 10.5, a: "start", w: 500 });
    s += L(520, my + 26, 520, my + 4, { c: INK, w: 1 }) + T(520, my + 40, "host plasma membrane (phospholipid bilayer)", { s: 10.5 });
    s += T(560, 196, "envelope = host membrane", { s: 10.5 }) + T(560, 209, "+ viral glycoproteins", { s: 10.5 }) + T(770, 196, "mature particle", { s: 10.5 });
    s += `<rect x="0" y="306" width="860" height="94" fill="#ffffff"/>`;
    const caps = [[110, "1", ["Viral glycoproteins are put into", "the host plasma membrane; viral", "RNA and proteins gather beneath"]], [330, "2", ["The membrane bulges outwards", "around the assembling particle"]], [560, "3", ["The particle buds off, wrapped", "in host membrane; the cell", "membrane reseals"]], [770, "4", ["(supporting) Protease cuts", "long viral proteins: the cone", "capsid forms (maturation);", "matrix lines the envelope"]]];
    caps.forEach(([x, n, lines]) => { s += badge(x - 92, 328, n, { r: 11, s: 11 }) + TL(x - 76, 332, lines, { a: "start", s: 10.5, w: 500, lh: 14 }); });
    return s + "</svg>";
  };

  // ---------- 3. Replication cycle in a CD4 helper T cell, 3.2.4.2 ----------
  // o.step: show steps 1..step only and ring the current one; o.drug: "rt" | "in" | "pr" marks a blocked step and fades
  // the steps that can no longer happen; o.latent: integrated DNA not transcribed (steps 5–7 faded).
  const STEPS = [
    { n: 1, title: "Attachment", text: "A glycoprotein in the HIV envelope binds to a CD4 receptor on the plasma membrane of a helper T cell." },
    { n: 2, title: "Release of capsid contents", text: "The envelope fuses with the plasma membrane and the capsid enters the cytoplasm, releasing the viral RNA and enzymes (reverse transcriptase, integrase and protease) into the cell." },
    { n: 3, title: "Reverse transcription", text: "Reverse transcriptase uses the viral RNA as a template to make a complementary DNA strand, then a second strand: double-stranded viral DNA. This begins in the cytoplasm. (Supporting) It may be completed as the capsid reaches or enters the nucleus." },
    { n: 4, title: "Integration", text: "The viral DNA enters the nucleus. Integrase inserts it into a chromosome of the host cell, where it stays for the life of the cell." },
    { n: 5, title: "Transcription", text: "The cell's own RNA polymerase may transcribe the integrated viral DNA, making new viral RNA: copies of the genome and mRNA." },
    { n: 6, title: "Making viral proteins", text: "Host ribosomes translate the viral mRNA into viral proteins: long protein chains that include capsid protein and the enzymes, and the envelope glycoproteins." },
    { n: 7, title: "Assembly and release", text: "Viral RNA and proteins are packaged at the plasma membrane. New particles bud out, taking host membrane containing viral glycoproteins as their envelope. (Supporting) Protease then cuts the long protein chains so each particle matures and becomes infectious." },
  ];
  const cycle = (o = {}) => {
    uid(); const st = o.step == null ? 7 : o.step; const blockAt = { rt: 3, in: 4, pr: 7 }[o.drug] || 0; const latent = !!o.latent;
    const fadeFrom = blockAt ? (blockAt === 7 ? 99 : blockAt + 1) : latent ? 5 : 99;
    const vis = (n) => n <= st; const op = (n) => (n >= fadeFrom ? ' opacity=".22"' : "");
    const lab = "Replication cycle of HIV in a CD4 helper T cell, steps 1 to 7: attachment of a glycoprotein to a CD4 receptor; fusion and release of the capsid contents (RNA, reverse transcriptase, integrase and protease); reverse transcription of RNA into double-stranded DNA; integration into a host chromosome in the nucleus; transcription to new viral RNA; translation by ribosomes into viral proteins; assembly at the plasma membrane and budding, with maturation by protease.";
    let s = open(900, 630, lab, defsAll());
    s += T(20, 22, o.title || "The replication cycle of HIV in a CD4 helper T cell", { a: "start", s: 13, w: 700 }) + `<g transform="translate(0,30)">`;
    // cell
    s += `<rect x="30" y="124" width="840" height="460" rx="40" fill="${CELL}" stroke="${CELLS}" stroke-width="4"/>` + T(56, 570, "CD4 helper T cell (host cell): cytoplasm", { a: "start", s: 10.5, w: 600, c: CELLS });
    // nucleus
    s += `<ellipse cx="470" cy="430" rx="200" ry="118" fill="#f4eee2" stroke="#8a7a5a" stroke-width="5"/><ellipse cx="470" cy="430" rx="200" ry="118" fill="none" stroke="#f4eee2" stroke-width="2" stroke-dasharray="20 14"/>` + T(470, 540, "nucleus", { s: 10.5, w: 600, c: "#6d5d3d" });
    // host chromosome (always shown)
    const chrom = (y, x1, x2) => P(wave(x1, x2, y - 4, 3, 26), { c: HOST, w: 2.4 }) + P(wave(x1, x2, y + 4, 3, 26), { c: HOST, w: 2.4 });
    s += chrom(470, 300, 420) + chrom(470, 500, 640) + T(330, 498, "host chromosome (DNA)", { a: "start", s: 10, w: 500, c: HOST });
    if (vis(4) && blockAt !== 3 && blockAt !== 4) s += `<g${op(4)}>${P(wave(420, 500, 466, 3, 26), { c: DNA, w: 3.2 })}${P(wave(420, 500, 474, 3, 26), { c: DNA, w: 3.2 })}</g>`;
    else { s += chrom(470, 420, 500); if (blockAt === 4) s += P(wave(330, 400, 416, 3, 20), { c: DNA, w: 3 }) + P(wave(330, 400, 424, 3, 20), { c: DNA, w: 3 }) + T(365, 404, "viral DNA, not inserted", { s: 9.5, w: 700, c: DNA }); }
    // CD4 receptors on the membrane
    [150, 260, 760].forEach((x) => { s += `<line x1="${x}" y1="124" x2="${x}" y2="104" stroke="#3a6ea5" stroke-width="3"/><circle cx="${x}" cy="100" r="5" fill="#bcd3ea" stroke="#3a6ea5" stroke-width="1.4"/>`; });
    s += T(268, 96, "CD4 receptor", { a: "start", s: 10, w: 600, c: "#3a6ea5" });
    const ring = (n, x, y) => badge(x, y, n, { ring: n === st && o.step != null });
    // step 1
    if (vis(1)) s += `<g${op(1)}>${mini(150, 58, 34, { spikes: 8 })}${ring(1, 96, 40)}${TL(222, 46, ["1 A glycoprotein binds", "to a CD4 receptor"], { a: "start", s: 11 })}</g>`;
    // step 2
    if (vis(2)) s += `<g${op(2)}>${P(`M118 124 Q150 140 182 124`, { c: ENV, w: 5 })}<path d="${conePath(150, 200, 70, 11, 24)}" fill="${CAPF}" stroke="${CAP}" stroke-width="2.2" stroke-dasharray="7 5"/>${P(wave(124, 176, 195, 2, 10), { c: RNA, w: 2 })}${P(wave(124, 176, 205, 2, 10), { c: RNA, w: 2 })}${enzyme(205, 178, "RT", RT)}${enzyme(205, 200, "PR", PR)}${enzyme(205, 222, "IN", IN)}${L(150, 98, 150, 160, { c: GREY, w: 2, m: "g", da: "5 4" })}${ring(2, 96, 200)}${TL(232, 184, ["2 Envelope fuses with the", "plasma membrane; RNA and", "enzymes are released"], { a: "start", s: 11 })}</g>`;
    // step 3
    if (vis(3)) s += `<g${op(3)}>${P(wave(60, 176, 300, 3, 16), { c: RNA, w: 3 })}${T(182, 304, "viral RNA", { a: "start", s: 10, w: 600, c: RNA })}${L(118, 312, 118, 340, { c: RT, w: 2.4, m: "g" })}${enzyme(150, 326, "RT", RT)}${P(wave(60, 176, 352, 3, 16), { c: DNA, w: 3 })}${P(wave(60, 176, 360, 3, 16), { c: DNA, w: 3 })}${T(182, 360, "viral DNA", { a: "start", s: 10, w: 600, c: DNA })}${L(140, 232, 120, 286, { c: GREY, w: 2, m: "g", da: "5 4" })}${ring(3, 64, 326)}${TL(52, 392, ["3 Reverse transcriptase:", "RNA → single-stranded DNA", "→ double-stranded DNA"], { a: "start", s: 11 })}</g>`;
    // step 4
    if (vis(4)) s += `<g${op(4)}>${P(`M190 362 Q280 380 330 420`, { c: GREY, w: 2, m: "g", da: "5 4" })}${enzyme(460, 446, "IN", IN)}${ring(4, 392, 446)}${TL(460, 508, ["4 Integrase inserts viral DNA", "into a host chromosome"], { s: 11 })}</g>`;
    if (latent && vis(4)) s += `<rect x="414" y="372" width="116" height="34" rx="8" fill="#fff" stroke="${GOLD}" stroke-width="2"/>` + TL(472, 386, ["latent: viral DNA", "present, not transcribed"], { s: 9.5, lh: 12 });
    // step 5
    if (vis(5)) s += `<g${op(5)}>${L(520, 458, 560, 402, { c: RNA, w: 2.2, m: "r" })}${P(wave(548, 620, 392, 2.5, 14), { c: RNA, w: 2.6 })}${P(wave(548, 620, 380, 2.5, 14), { c: RNA, w: 2.6 })}${ring(5, 640, 404)}${TL(470, 346, ["5 Host RNA polymerase transcribes", "viral DNA: new viral RNA"], { s: 11 })}${P(`M622 372 Q660 330 700 300`, { c: RNA, w: 2, m: "r", da: "5 4" })}</g>`;
    // step 6
    if (vis(6)) { let r6 = P(`M700 290 L846 290`, { c: RNA, w: 2.4 }); [722, 770, 818].forEach((x) => { r6 += `<ellipse cx="${x}" cy="282" rx="13" ry="8" fill="#c8b98f" stroke="#7d6b3f" stroke-width="1.2"/><ellipse cx="${x}" cy="296" rx="10" ry="6" fill="#d9cda9" stroke="#7d6b3f" stroke-width="1.2"/>`; r6 += Array.from({ length: 5 }, (_, i) => `<circle cx="${x + 4 + i * 5}" cy="${270 - i * 6}" r="2.6" fill="${MAT}"/>`).join(""); });
      s += `<g${op(6)}>${r6}${ring(6, 860 - 6, 252)}${TL(772, 320, ["6 Ribosomes translate", "viral mRNA: viral proteins"], { s: 11 })}${P(`M770 248 Q740 200 700 164`, { c: GREY, w: 2, m: "g", da: "5 4" })}</g>`; }
    // step 7
    if (vis(7)) { const bud = `M610 124 C 630 124 628 70 660 70 C 692 70 690 124 710 124`;
      s += `<g${op(7)}><rect x="612" y="116" width="96" height="14" fill="${CELL}"/>${P(bud, { c: CELLS, w: 4, f: CELL })}${Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(660, 104, 26, 190 + i * 22); return `<circle cx="${x}" cy="${y}" r="3.6" fill="${MATF}" stroke="${MAT}" stroke-width="1"/>`; }).join("")}${spike(660, 95, 25, -90, 0.6)}${spike(660, 95, 25, -135, 0.6)}${spike(660, 95, 25, -45, 0.6)}${mini(810, 58, 34, { mature: blockAt !== 7 && !o.immature, spikes: 8 })}${L(716, 80, 768, 66, { c: GREY, w: 2, m: "g", da: "5 4" })}${ring(7, 600, 80)}${TL(452, 40, ["7 Assembly at the membrane;", "budding gives the envelope;", "protease then matures", "each new particle"], { a: "start", s: 11, lh: 13.5 })}</g>`; }
    // drug block marker
    if (blockAt) { const pos = { 3: [118, 326], 4: [492, 418], 7: [810, 58] }[blockAt]; s += cross(pos[0] + (blockAt === 3 ? -40 : 0), pos[1] + (blockAt === 7 ? 44 : 0), 15);
      const note = { 3: "Blocked at step 3: no viral DNA is made", 4: "Blocked at step 4: viral DNA is not inserted", 7: "Protease blocked: new particles stay immature" }[blockAt];
      s += `<rect x="560" y="548" width="300" height="28" rx="8" fill="#fff" stroke="${BLOCK}" stroke-width="1.6"/>` + T(710, 566, note, { s: 10.5, w: 700, c: BLOCK }); }
    if (latent) s += `<rect x="560" y="548" width="300" height="28" rx="8" fill="#fff" stroke="${GOLD}" stroke-width="1.6"/>` + T(710, 566, "latent cell: steps 5 to 7 not happening", { s: 10.5, w: 700, c: "#7a5512" });
    return s + "</g></svg>";
  };

  // ---------- 4. Reverse transcription and integration close-up, 3.2.4.2 ----------
  const reverseTx = () => {
    uid(); const rna = RNA_SEQ, c1 = compDNA(rna), c2 = compOfDNA(c1); const x0 = 210, dx = 30;
    const bases = (y, seq, col, box) => [...seq].map((b, i) => `<rect x="${x0 + i * dx - 12}" y="${y - 13}" width="24" height="20" rx="4" fill="${box}" stroke="${col}" stroke-width="1"/>${T(x0 + i * dx, y + 2, b, { s: 12, w: 700, c: col })}`).join("");
    const bb = (y, col) => L(x0 - 20, y, x0 + (rna.length - 1) * dx + 20, y, { c: col, w: 2.6 });
    let s = open(860, 470, `Reverse transcription and integration. Viral RNA with bases ${rna} is used as a template to build a complementary DNA strand ${c1}; a second DNA strand ${c2} is made, giving double-stranded DNA; integrase inserts this double-stranded DNA into a host chromosome.`, defsAll());
    s += T(20, 24, "Reverse transcription and integration (base sequences are an example)", { a: "start", s: 13, w: 700 });
    const row = (y, title) => T(20, y + 4, title, { a: "start", s: 11.5, w: 700 });
    s += row(70, "viral RNA") + bb(52, RNA) + bases(70, rna, RNA, "#fbeaf3");
    s += L(x0 + 120, 92, x0 + 120, 122, { c: RT, w: 2.4, m: "g" }) + enzyme(x0 + 175, 107, "RT", RT) + TL(560, 104, ["reverse transcriptase builds a", "complementary DNA strand"], { a: "start", s: 10.5, w: 500 });
    s += row(156, "RNA–DNA hybrid") + bb(134, RNA) + bases(152, rna, RNA, "#fbeaf3") + bases(178, c1, DNA, "#e6f0fb") + bb(196, DNA);
    s += L(x0 + 120, 210, x0 + 120, 240, { c: RT, w: 2.4, m: "g" }) + enzyme(x0 + 175, 225, "RT", RT) + TL(560, 222, ["RNA is removed and a second", "DNA strand is made"], { a: "start", s: 10.5, w: 500 });
    s += row(274, "double-stranded DNA") + bb(252, DNA) + bases(270, c2, DNA, "#e6f0fb") + bases(296, c1, DNA, "#e6f0fb") + bb(314, DNA);
    s += L(x0 + 120, 328, x0 + 120, 358, { c: IN, w: 2.4, m: "g" }) + enzyme(x0 + 175, 343, "IN", IN) + TL(560, 340, ["integrase inserts it into a", "host chromosome"], { a: "start", s: 10.5, w: 500 });
    s += row(400, "host chromosome") + `<rect x="${x0 - 40}" y="382" width="40" height="34" fill="#eef1f4"/><rect x="${x0 + (rna.length - 1) * dx + 20}" y="382" width="140" height="34" fill="#eef1f4"/>` + L(x0 - 60, 386, x0 - 20, 386, { c: HOST, w: 3 }) + L(x0 - 60, 412, x0 - 20, 412, { c: HOST, w: 3 }) + L(x0 + (rna.length - 1) * dx + 20, 386, x0 + (rna.length - 1) * dx + 170, 386, { c: HOST, w: 3 }) + L(x0 + (rna.length - 1) * dx + 20, 412, x0 + (rna.length - 1) * dx + 170, 412, { c: HOST, w: 3 });
    s += bb(386, DNA) + bb(412, DNA) + `<rect x="${x0 - 16}" y="390" width="${(rna.length - 1) * dx + 32}" height="18" rx="4" fill="#e6f0fb"/>` + T(x0 + ((rna.length - 1) * dx) / 2, 403, "viral DNA (now part of the host chromosome)", { s: 10.5, w: 700, c: DNA });
    s += T(20, 452, "Complementary pairs: RNA A pairs with DNA T, RNA U with DNA A, G with C. DNA contains T where the RNA had U.", { a: "start", s: 10.5, w: 500, c: GREY });
    return s + "</svg>";
  };

  // ---------- 5. Drug target summary, 3.2.4.2 ----------
  const drugTargets = () => {
    uid(); const bw = 112, gap = 10, x0 = 18, by = 46, bh = 74;
    const names = [["Attachment", "to CD4", "receptor"], ["Fusion;", "capsid contents", "released"], ["Reverse", "transcription:", "RNA → DNA"], ["Integration", "into a host", "chromosome"], ["Transcription", "of viral DNA", "→ viral RNA"], ["Translation:", "viral", "proteins"], ["Assembly,", "budding,", "maturation"]];
    let s = open(880, 380, "Summary of where hypothetical antiretroviral drugs act. Seven boxes show the steps of the cycle. A reverse transcriptase inhibitor blocks step 3, so no viral DNA is made. An integrase inhibitor blocks step 4, so viral DNA is not inserted into a chromosome. A protease inhibitor acts at step 7: particles bud but stay immature and non-infectious. None of the three removes viral DNA already integrated in resting cells.", defsAll());
    s += T(20, 26, "Where drugs that inhibit viral enzymes act", { a: "start", s: 13, w: 700 });
    names.forEach((ln, i) => { const x = x0 + i * (bw + gap), tgt = [2, 3, 6].includes(i); s += `<rect x="${x}" y="${by}" width="${bw}" height="${bh}" rx="10" fill="${tgt ? "#fff3f1" : "#f2f6f8"}" stroke="${tgt ? BLOCK : "#9fb3c8"}" stroke-width="${tgt ? 2.2 : 1.4}"/>` + badge(x + 14, by + 14, i + 1, { r: 10, s: 10.5 }) + TL(x + bw / 2 + 6, by + 30, ln, { s: 10.5, lh: 13.5 }); if (i < 6) s += L(x + bw + 1, by + bh / 2, x + bw + gap - 1, by + bh / 2, { c: GREY, w: 1.6, m: "g" }); });
    const calls = [[18, 2, "Reverse transcriptase inhibitor", ["Binds reverse transcriptase:", "no DNA copy of the viral RNA,", "so no integration and no", "new virus from that cell"], RT], [304, 3, "Integrase inhibitor", ["Viral DNA is made but not", "inserted into a chromosome,", "so it is not transcribed:", "no new viral RNA or proteins"], IN], [590, 6, "Protease inhibitor", ["Particles are still made and", "bud, but the long protein", "chains are not cut: particles", "stay immature, not infectious"], PR]];
    calls.forEach(([x, i, head, lines, col]) => { const bx = x0 + i * (bw + gap) + bw / 2; s += L(bx, by + bh, x + 135, 168, { c: BLOCK, w: 1.6, da: "4 3" }) + cross(bx, by + bh + 14, 11) + `<rect x="${x}" y="168" width="270" height="100" rx="10" fill="#fff" stroke="${col}" stroke-width="2"/>` + T(x + 12, 188, head, { a: "start", s: 11.5, w: 700, c: col }) + TL(x + 12, 207, lines, { a: "start", s: 10.5, w: 500, lh: 14 }); });
    s += `<rect x="18" y="284" width="842" height="80" rx="10" fill="#fdf5df" stroke="${GOLD}" stroke-width="1.6"/>` + TL(32, 306, ["Suppression, not elimination. In some long-lived resting helper T cells, viral DNA is integrated but not being transcribed (the latent reservoir).", "None of these drugs removes integrated DNA, so if treatment stops the reservoir can produce virus again. Combinations of drugs that act on", "different targets are used together so that a virus with a mutation that lets it escape one drug is still blocked by another (supporting)."], { a: "start", s: 10.5, w: 500, lh: 17 });
    return s + "</svg>";
  };

  // ---------- 6. CD4 count and viral load over time (illustrative) ----------
  const X0 = 86, X1 = 724, YT = 52, YB = 322;
  const xmap = (t) => (t <= 0.25 ? X0 + (t / 0.25) * 120 : X0 + 120 + ((t - 0.25) / 11.75) * (X1 - X0 - 120));
  const ycd4 = (c) => YB - (c / 1200) * (YB - YT);
  const yvl = (lg) => YB - ((lg - 1) / 6) * (YB - YT);
  const immuneGraph = (o = {}) => {
    uid(); const sc = o.scenario || "untreated"; const M = B.hivModel;
    const lab = `Illustrative graph of CD4 helper T cell count and viral load against time since infection, scenario: ${M.SCEN[sc].label}. The CD4 count dips in the first weeks, recovers partly, then falls slowly over years${sc === "untreated" ? " to 200 cells per cubic millimetre or fewer (AIDS)" : "; on treatment it rises again"}. The viral load peaks in the first weeks, falls to a set point${sc === "untreated" ? ", then rises late in infection" : ", and on treatment falls below the limit of detection"}${sc === "interrupt" ? "; when treatment stops it rebounds and the CD4 count falls" : ""}.`;
    let s = open(860, 420, lab, defsAll());
    s += T(20, 24, `${o.title || "CD4 count and viral load over time"} (ILLUSTRATIVE): ${M.SCEN[sc].label.toLowerCase()}`, { a: "start", s: 12.5, w: 700 });
    // risk band and reference lines
    s += `<rect x="${X0}" y="${ycd4(200)}" width="${X1 - X0}" height="${YB - ycd4(200)}" fill="#fbe7e4"/>` + T(xmap(1) + 8, YB - 7, "AIDS: CD4 ≤ 200 per mm³", { a: "start", s: 10.5, w: 700, c: "#8f3a30" }); // R5-18: short, and where no line crosses it
    s += `<rect x="${X0}" y="${ycd4(1200)}" width="${X1 - X0}" height="${ycd4(500) - ycd4(1200)}" fill="#eef7f1"/>` + T(X0 + 128, YT + 38, "typical healthy adult range, about 500 to 1200 per mm³ (shaded green)", { a: "start", s: 10.5, w: 600, c: "#2f5a45" });
    // R5-18: the limit-of-detection line is drawn only for the treatment scenarios (it read as part of the AIDS band)
    s += L(X0, ycd4(200), X1, ycd4(200), { c: "#b4544a", w: 1.2, da: "5 4" }) + (sc === "untreated" ? "" : L(X0, yvl(M.DETECT), X1, yvl(M.DETECT), { c: "#a3367f", w: 1, da: "2 4" }) + T(X0 + 128, yvl(M.DETECT) - 4, "dotted: limit of detection of the viral-load test (right axis, illustrative)", { a: "start", s: 9, w: 600, c: RNA }));
    // axes
    s += L(X0, YT, X0, YB, { c: INK, w: 1.4 }) + L(X1, YT, X1, YB, { c: INK, w: 1.4 }) + L(X0, YB, X1, YB, { c: INK, w: 1.4 });
    [0, 200, 400, 600, 800, 1000, 1200].forEach((v) => { s += L(X0 - 5, ycd4(v), X0, ycd4(v), { c: INK, w: 1 }) + T(X0 - 8, ycd4(v) + 4, String(v), { a: "end", s: 10, w: 500 }); });
    [1, 2, 3, 4, 5, 6, 7].forEach((v) => { s += L(X1, yvl(v), X1 + 5, yvl(v), { c: INK, w: 1 }) + T(X1 + 8, yvl(v) + 4, M.sci(v), { a: "start", s: 10, w: 500, c: RNA }); });
    s += `<text x="24" y="${(YT + YB) / 2}" text-anchor="middle" font-size="11" font-weight="700" fill="${DNA}" transform="rotate(-90 24 ${(YT + YB) / 2})">CD4 count / cells per mm³</text>`;
    s += `<text x="${X1 + 66}" y="${(YT + YB) / 2}" text-anchor="middle" font-size="11" font-weight="700" fill="${RNA}" transform="rotate(90 ${X1 + 66} ${(YT + YB) / 2})">viral load / copies per cm³ (log scale)</text>`;
    [[0, "0"], [4 / 52, "4"], [8 / 52, "8"], [12 / 52, "12"]].forEach(([t, l]) => { s += L(xmap(t), YB, xmap(t), YB + 5, { c: INK, w: 1 }) + T(xmap(t), YB + 17, l, { s: 10, w: 500 }); });
    [1, 2, 4, 6, 8, 10, 12].forEach((t) => { s += L(xmap(t), YB, xmap(t), YB + 5, { c: INK, w: 1 }) + T(xmap(t), YB + 17, String(t), { s: 10, w: 500 }); });
    s += T(xmap(0.12), YB + 32, "weeks", { s: 10, w: 600, c: GREY }) + T((xmap(1) + X1) / 2, YB + 32, "years since infection", { s: 10.5, w: 700 });
    const bx = X0 + 120; s += `<rect x="${bx - 5}" y="${YB - 6}" width="10" height="12" fill="#fff"/>` + L(bx - 8, YB + 6, bx - 2, YB - 6, { c: INK, w: 1.2 }) + L(bx - 2, YB + 6, bx + 4, YB - 6, { c: INK, w: 1.2 });
    // treatment band
    if (sc !== "untreated") { const xe = sc === "interrupt" ? xmap(M.ART_STOP) : X1; s += `<rect x="${xmap(M.ART_START)}" y="${YT}" width="${xe - xmap(M.ART_START)}" height="8" fill="#3e8f7a"/>` + T((xmap(M.ART_START) + xe) / 2, YT + 22, "antiretroviral therapy", { s: 10, w: 700, c: "#22604f" }); }
    // curves (sampled from the model)
    const ts = []; for (let t = 0; t <= 0.25; t += 0.005) ts.push(t); for (let t = 0.26; t <= 12.0001; t += 0.02) ts.push(t);
    const path = (f, y) => ts.map((t, i) => `${i ? "L" : "M"}${xmap(t).toFixed(1)} ${y(f(t)).toFixed(1)}`).join(" ");
    s += `<path d="${path((t) => M.vlLog(sc, t), yvl)}" fill="none" stroke="${RNA}" stroke-width="2.6" stroke-dasharray="7 4"/>`;
    s += `<path d="${path((t) => M.cd4(sc, t), ycd4)}" fill="none" stroke="${DNA}" stroke-width="3.2"/>`;
    // legend
    s += `<rect x="${X0 + 8}" y="${YB + 44}" width="420" height="36" rx="6" fill="#fff" stroke="#c3d3d0"/>` + L(X0 + 18, YB + 62, X0 + 50, YB + 62, { c: DNA, w: 3.2 }) + T(X0 + 56, YB + 66, "CD4 helper T cells (left axis)", { a: "start", s: 10.5 }) + `<line x1="${X0 + 238}" y1="${YB + 62}" x2="${X0 + 270}" y2="${YB + 62}" stroke="${RNA}" stroke-width="2.6" stroke-dasharray="7 4"/>` + T(X0 + 276, YB + 66, "viral load (right axis)", { a: "start", s: 10.5 });
    s += T(X0 + 444, YB + 60, "Shapes follow the typical course; values are", { a: "start", s: 9.5, w: 500, c: GREY }) + T(X0 + 444, YB + 72, "invented for teaching, not from any one person.", { a: "start", s: 9.5, w: 500, c: GREY });
    // phase labels for the untreated course
    if (sc === "untreated") { s += T(xmap(0.13), YT + 200, "acute", { s: 10, w: 700, c: GREY }) + T(xmap(5), YT + 22, "chronic infection: often no symptoms for years", { s: 10, w: 700, c: GREY }) + T(xmap(11.2), YT + 22, "AIDS", { s: 10, w: 700, c: "#8f3a30" }); }
    // time marker
    if (o.t != null) { const t = o.t, x = xmap(t); s += L(x, YT, x, YB, { c: GOLD, w: 2 }) + `<circle cx="${x}" cy="${ycd4(M.cd4(sc, t))}" r="5.5" fill="${DNA}" stroke="#fff" stroke-width="1.5"/><circle cx="${x}" cy="${yvl(M.vlLog(sc, t))}" r="5.5" fill="${RNA}" stroke="#fff" stroke-width="1.5"/>`; }
    return s + "</svg>";
  };

  // ---------- 7. Labelling figures ----------
  const labelParticle = () => particle({ numbered: ["glycoprotein", "envelope", "capsid", "rna", "rt", "integrase"], title: "Identify the numbered structures" });
  // Cycle with numbered steps but no step text: student names each numbered event
  const labelCycle = () => { const svg = cycle({ title: "Identify the numbered events" }); return svg.replace(/<text[^>]*>[1-7] [^<]*<\/text>(<text[^>]*>[^<]*<\/text>)*/g, (m) => m.replace(/<text[^>]*>[^<]*<\/text>/g, "")); };

  // Sources used on the 3.2.4 pages (checked 9 November 2026)
  const a = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
  B.hivSources = `<p class="tiny muted"><strong>Sources</strong> (checked 9 November 2026): OxfordAQA International AS and A-level Biology 9610 specification v5.1, section 3.2.4 (the required content). NIH HIVinfo, ${a("https://hivinfo.nih.gov/understanding-hiv/fact-sheets/hiv-life-cycle", "The HIV Life Cycle")} (the seven steps; protease acts after budding to make mature, infectious virus) and ${a("https://hivinfo.nih.gov/understanding-hiv/fact-sheets/drug-resistance", "Drug Resistance")} (mutation during replication; drugs from at least two classes used together). Australasian Society for HIV Medicine (ASHM), ${a("https://hivmanagement.ashm.org.au/basic-hiv-virology/hiv-structure-and-organisation", "HIV structure and organisation")} (particle about 100 to 120 nm; lipid bilayer from the host cell; gp120/gp41 trimers; matrix; cone-shaped capsid enclosing two RNA strands with reverse transcriptase, integrase and protease). World Health Organization, ${a("https://www.who.int/news-room/fact-sheets/detail/hiv-aids", "HIV and AIDS fact sheet")} (27 July 2026: AIDS is the most advanced stage; no cure; treatment lowers the amount of virus and lets the immune system recover; about 41.0 million people living with HIV at the end of 2025). MedlinePlus, ${a("https://medlineplus.gov/labtests/cd4lymphocytecount.html", "CD4 Lymphocyte Count")} (healthy adults about 500 to 1,200 cells per mm³; 200 or fewer in a person with HIV means AIDS). Kimata, Rice and Wang (2016) Challenges and strategies for the eradication of the HIV reservoir, <em>Current Opinion in Immunology</em> 42, 65 to 70, ${a("https://pmc.ncbi.nlm.nih.gov/articles/PMC5086301", "PMC5086301")} (latent integrated DNA in resting memory CD4 T cells; not removed by treatment; rebound when treatment stops). All CD4 and viral-load curves and all experimental data on these pages are illustrative or hypothetical and labelled so.</p>`;
  B.hivArt = { PARTICLE_CAPTION, particle, particleParts, budding, cycle, STEPS, reverseTx, drugTargets, immuneGraph, labelParticle, labelCycle, mini, xmap };
})(window.BIO);
