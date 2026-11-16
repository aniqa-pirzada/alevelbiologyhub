// Shared data, models and artwork for 3.2.7 Heart disease may be associated with specific risk factors (Phase 4 Batch 3,
// owned by the 3.2.7 author). Loaded before data/content/3.2.7.1.js, 3.2.7.2.js, data/consolidation/3.2.7.js and
// js/views/interactives-cvd.js.
//
// B.cvdModel (pure data and arithmetic, no DOM)
//  REAL datasets (each value read from the source on 11 November 2026; see SRC for the full references):
//   PSC:  Prospective Studies Collaboration, Lancet 2007;370:1829–1839. 61 prospective studies, almost 900,000 adults,
//         about 34,000 IHD deaths. Hazard ratio for IHD death per 1 mmol/L LOWER usual total cholesterol, both sexes:
//         0.44 (95 % CI 0.42–0.48) at 40–49 y; 0.66 (0.65–0.68) at 50–69 y; 0.83 (0.81–0.85) at 70–89 y.
//   S4:   Scandinavian Simvastatin Survival Study Group (4S), Lancet 1994;344:1383–1389. Randomised, placebo
//         controlled; 4444 patients with angina or previous myocardial infarction and serum cholesterol 5.5–8.0 mmol/L;
//         2223 placebo, 2221 simvastatin; median follow-up 5.4 years. Deaths 256 (12 %) v 182 (8 %), relative risk
//         0.70 (0.58–0.85); coronary deaths 189 v 111, relative risk 0.58 (0.46–0.73); one or more major coronary events
//         622 (28 %) v 431 (19 %), relative risk 0.66 (0.59–0.75). Mean change on simvastatin: total cholesterol −25 %,
//         LDL −35 %, HDL +8 %. NOTE: the published relative risks come from survival (time-to-event) analysis, so they
//         differ slightly from the simple ratio of the two percentages that students calculate (e.g. 0.59 v 0.58).
//   UNAL: Unal B, Critchley JA, Capewell S. Circulation 2004;109:1101–1107. England and Wales, 1981–2000, ages 25–84:
//         CHD mortality rates fell 62 % in men and 45 % in women; 68,230 fewer deaths in 2000; a computer model (IMPACT)
//         attributed about 58 % of the fall to reductions in major risk factors (principally smoking) and 42 % to
//         medical treatments (smoking 48 %, blood pressure 9.5 %, cholesterol 9.5 % of the fall); the abstract also
//         reports adverse trends in obesity, diabetes and physical activity.
//  Reused from B.diseaseModel (3.2.1, not duplicated here): Doll and others 2004 (IHD death rates by smoking) and the
//  Prospective Studies Collaboration 2002 statement on blood pressure (Lewington and others).
//  HYPOTHETICAL datasets (invented for teaching, labelled as such wherever they appear): TOWNS (age confounding and
//  crude v age-specific rates; the age-specific rates reverse the crude comparison) and BPCOH (a cohort with
//  CHD events by systolic blood pressure band, with small numbers in the highest band).
//  Arithmetic helpers: round, fix, rate, pct. Every quoted answer is computed with these.
//
//  WALL model (illustrative, not measured): STAGES of an artery wall with atheroma. Plaque thickness t is a fraction of
//  the healthy lumen diameter; the remaining lumen is drawn as a circle of diameter (1 − t), so the remaining
//  cross-sectional area is (1 − t)² of the healthy lumen. Stage thicknesses 0, 0, 0.10, 0.35, 0.60 give 100, 100, 81,
//  42 and 16 %. Real plaques are irregular and develop over decades; the stages overlap.
//
//  CORONARY model: the arteries in the front view (right coronary artery; left coronary artery dividing into the
//  anterior interventricular and circumflex arteries), block points near the start ("prox") or further along ("dist")
//  each artery, and the muscle each supplies. Territories are the TYPICAL pattern in a right-dominant heart (the
//  pattern in most people, Kenhub "Blood supply of the heart"); they vary between people, and small connections
//  between branches (anastomoses) give a little extra supply (OpenStax A&P 19.1).
//
// B.cvdArt: original SVG drawings. Every id in a drawing carries a uid() suffix so copies on one page never clash.
window.BIO = window.BIO || {};
(function (B) {
  // ================================================================ model ================================================================
  const round = (x, dp = 2) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 2) => round(x, dp).toFixed(dp);
  const rate = (cases, n, per = 1000) => (n ? (cases / n) * per : NaN);
  const pct = (part, whole) => (100 * part) / whole;

  const SRC = {
    psc: { cite: "Prospective Studies Collaboration (Lewington S, Whitlock G, Clarke R and others). Blood cholesterol and vascular mortality by age, sex, and blood pressure: a meta-analysis of individual data from 61 prospective studies with 55,000 vascular deaths. Lancet 2007; 370: 1829–1839", short: "Prospective Studies Collaboration, Lancet, 2007", url: "https://researchonline.lshtm.ac.uk/1924957" },
    s4: { cite: "Scandinavian Simvastatin Survival Study Group. Randomised trial of cholesterol lowering in 4444 patients with coronary heart disease: the Scandinavian Simvastatin Survival Study (4S). Lancet 1994; 344: 1383–1389", short: "4S trial, Lancet, 1994", url: "https://www.ndph.ox.ac.uk/files/forms/4s_main-results_lancet-1994.pdf/@@download" },
    unal: { cite: "Unal B, Critchley JA, Capewell S. Explaining the decline in coronary heart disease mortality in England and Wales between 1981 and 2000. Circulation 2004; 109: 1101–1107", short: "Unal and others, Circulation, 2004", url: "https://www.scilit.net/publications/1909f70493023d4a6e29b42dad3a36cb" },
    openstax: { cite: "OpenStax, Anatomy and Physiology, section 19.1 Heart Anatomy (coronary arteries; coronary artery disease; myocardial infarction)", short: "OpenStax A&P 19.1", url: "https://openstax.org/books/anatomy-and-physiology/pages/19-1-heart-anatomy" },
    kenhub: { cite: "Kenhub. Blood supply of the heart (regions supplied by each coronary artery; right coronary artery dominant in most people)", short: "Kenhub", url: "https://kenhub.com/en/library/anatomy/blood-supply-of-the-heart" },
    nhsAaa: { cite: "NHS inform (Scotland). Abdominal aortic aneurysm (definition; atherosclerosis, smoking and high blood pressure as causes; rupture)", short: "NHS inform", url: "https://nhsinform.scot/illnesses-and-conditions/cardiovascular-disease/heart-disease/abdominal-aortic-aneurysm" },
  };

  const PSC = { studies: 61, adults: "almost 900,000", ihdDeaths: 34000, vascDeaths: 55000, per: "1 mmol/L lower usual total cholesterol",
    rows: [{ age: "40–49", hr: 0.44, lo: 0.42, hi: 0.48 }, { age: "50–69", hr: 0.66, lo: 0.65, hi: 0.68 }, { age: "70–89", hr: 0.83, lo: 0.81, hi: 0.85 }],
    hdl: "The ratio of total to HDL cholesterol predicted IHD death better than total cholesterol alone (supporting)." };
  const S4 = { n: 4444, years: 5.4, chol: "5.5 to 8.0 mmol/L", who: "people who already had angina or had had a myocardial infarction",
    placebo: { n: 2223, deaths: 256, coronary: 189, major: 622 }, simva: { n: 2221, deaths: 182, coronary: 111, major: 431 },
    rr: { deaths: [0.70, 0.58, 0.85], coronary: [0.58, 0.46, 0.73], major: [0.66, 0.59, 0.75] }, change: { total: -25, ldl: -35, hdl: 8 } };
  const s4Calc = (k) => { const p = pct(S4.placebo[k], S4.placebo.n), s = pct(S4.simva[k], S4.simva.n); return { p, s, abs: p - s, rel: s / p, relRed: 100 * (1 - s / p), per1000: 10 * (p - s), nnt: 100 / (p - s) }; };
  const UNAL = { from: 1981, to: 2000, ages: "25–84", fallMen: 62, fallWomen: 45, fewer: 68230, riskPct: 58, treatPct: 42, smokePct: 48, bpPct: 9.5, cholPct: 9.5 }; // abstract: smoking 48 %, blood pressure 9.5 %, cholesterol 9.5 % of the fall
  UNAL.riskDeaths = UNAL.fewer * UNAL.riskPct / 100; UNAL.treatDeaths = UNAL.fewer * UNAL.treatPct / 100;

  // ---- HYPOTHETICAL datasets ----
  const TOWNS = { years: 5, groups: ["45–64", "65 and over"],
    P: { name: "Town P (many retired people)", rows: [{ n: 4000, cases: 20 }, { n: 6000, cases: 96 }] },
    Q: { name: "Town Q (mostly younger families)", rows: [{ n: 9000, cases: 54 }, { n: 1000, cases: 18 }] } };
  const townTot = (t) => { const r = TOWNS[t].rows; return { n: r[0].n + r[1].n, cases: r[0].cases + r[1].cases }; };
  const BPCOH = { years: 10, rows: [
    { band: "below 120", n: 2400, cases: 36 }, { band: "120–139", n: 4200, cases: 92 }, { band: "140–159", n: 2600, cases: 91 },
    { band: "160–179", n: 650, cases: 33 }, { band: "180 or more", n: 150, cases: 12 } ] };
  BPCOH.rows.forEach((r) => { r.rate = rate(r.cases, r.n); r.rel = r.rate / rate(BPCOH.rows[0].cases, BPCOH.rows[0].n); r.free = 100 - pct(r.cases, r.n); });

  // ---- artery wall stages (illustrative) ----
  const STAGES = [
    { k: "healthy", label: "Healthy wall", t: 0, level: "required", text: "The inner lining (endothelium) is smooth and unbroken. Below it the middle layer of smooth muscle and elastic tissue, then the tough outer layer of collagen. The lumen is wide and blood flows freely." },
    { k: "damage", label: "2. Lining damaged", t: 0, level: "supporting", text: "The endothelium is damaged, for example by high blood pressure or by chemicals from tobacco smoke. Lipid carried in the blood (in LDL particles) can now enter the wall beneath the endothelium." },
    { k: "streak", label: "3. Lipid builds up", t: 0.10, level: "supporting", text: "Lipid, including cholesterol, collects in the wall under the endothelium. White blood cells move into the wall and take up the lipid (they become foam cells). This early stage is a fatty streak; it narrows the lumen only slightly." },
    { k: "plaque", label: "Atheroma", t: 0.5, level: "required", text: "An atheroma: lipid-containing material within the artery wall. A core of lipid lies under a cap of fibrous tissue. The atheroma bulges into the lumen, so the lumen is narrower and less blood can flow through." },
    { k: "advanced", label: "5. Advanced atheroma", t: 0.60, level: "required", text: "The atheroma is larger, the lumen much narrower and the wall less elastic (supporting: it may contain calcium and the muscle layer under it becomes thinner, so the wall is weaker). The rough surface and the risk of the cap breaking lead to thrombosis; the weakened wall can lead to an aneurysm." },
  ];
  const OUTCOMES = [
    { k: "thrombosis", label: "Thrombosis", level: "required", text: "The fibrous cap breaks (ruptures) or the endothelium over the atheroma is rough and damaged. Platelets stick to the exposed material and a blood clot forms (thrombosis). The clot (thrombus) can block the narrowed artery here, or a piece can break off and block a smaller artery further along (supporting: an embolus). Tissue beyond the block receives no blood." },
    { k: "aneurysm", label: "Aneurysm", level: "required", text: "Atheroma weakens the artery wall (supporting: the elastic tissue and smooth muscle under it are damaged and thinned). Blood pressure pushes on the weakened part, which bulges outwards to form a balloon-like swelling filled with blood: an aneurysm. An aneurysm may burst, causing severe bleeding (haemorrhage). High blood pressure makes this more likely." },
  ];
  const lumenPct = (t) => 100 * (1 - t) ** 2;

  B.cvdModel = { round, fix, rate, pct, SRC, PSC, S4, s4Calc, UNAL, TOWNS, townTot, BPCOH, STAGES, OUTCOMES, lumenPct };

  // ================================================================ art ================================================================
  let cnt = 0; const uid = () => "-cv" + (++cnt);
  const INK = "#16263a", GREY = "#5f6f7f", OX = "#c0392b", DE = "#2f5fa8";
  const C = { coll: "#f3e6cf", collS: "#b89a62", med: "#efc3c0", medS: "#b5675f", elas: "#4a5d9a", endo: "#d98f84", endoS: "#9c6450", lum: "#fdeeea", rbc: "#e07f7f",
    lip: "#f2d27a", lipS: "#b8901f", cap: "#f4ebe1", capS: "#bba98e", foam: "#fff6dc", ca: "#ffffff", caS: "#8d8d8d", thr: "#9e2a2b", fib: "#f0b9b4", hurt: "#5b3f8f", warn: "#c98a00" };
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 600}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}${o.halo ? ' stroke="#ffffff" stroke-width="4" stroke-linejoin="round" paint-order="stroke"' : ""}>${s}</text>`;
  const open = (w, h, label, defs = "") => `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}" style="max-width:100%;height:auto"><defs>${defs}</defs><rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>`;
  const marker = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;
  const flat = (s) => s.replace(/\s*\n\s*/g, " ");
  const lead = (x1, y1, x2, y2, c = GREY) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.3"/><circle cx="${x2}" cy="${y2}" r="2.4" fill="${c}"/>`;
  const smooth = (x) => (Math.abs(x) >= 1 ? 0 : (1 + Math.cos(Math.PI * x)) / 2); // 1 at 0, 0 at ±1
  const band = (x0, x1, top, bot, step = 4) => { let d = ""; for (let x = x0; x <= x1 + 0.01; x += step) d += (d ? "L" : "M") + x.toFixed(1) + " " + top(x).toFixed(1); for (let x = x1; x >= x0 - 0.01; x -= step) d += "L" + x.toFixed(1) + " " + bot(x).toFixed(1); return d + "Z"; };
  const line = (x0, x1, f, step = 4) => { let d = ""; for (let x = x0; x <= x1 + 0.01; x += step) d += (d ? "L" : "M") + x.toFixed(1) + " " + f(x).toFixed(1); return d; };

  // ---------- longitudinal section of an artery wall at one stage ----------
  // o: { stage: "healthy"|"damage"|"streak"|"plaque"|"advanced"|"thrombosis"|"aneurysm", labels: true, title }
  const WALL = { W: 640, H: 440, Y0: 96, x0: 14, x1: 626, cx: 330 };
  const wallLong = (o = {}) => {
    const id = uid(); const st = o.stage || "healthy"; const { W, H, Y0, x0, x1, cx } = WALL; const labels = o.labels !== false;
    const S = STAGES.find((s) => s.k === st) || STAGES[4];
    const t = st === "thrombosis" ? 0.6 : st === "aneurysm" ? 0.12 : S.t;
    const hw = st === "streak" ? 120 : 165;
    const p = (x) => 120 * t * smooth((x - cx) / hw) ** (st === "streak" ? 1 : 0.8);
    const u = (x) => (st === "aneurysm" ? 62 * smooth((x - cx) / 190) : 0);
    const k = (x) => (st === "aneurysm" ? 1 - 0.5 * smooth((x - cx) / 190) : 1);
    const thin = (x) => ((st === "advanced" || st === "thrombosis") ? 0.45 * smooth((x - cx) / 140) : 0);
    // boundaries of the TOP wall (y increases downwards)
    // The outer surface stays in place (it moves only where an aneurysm bulges it outwards); a middle layer that
    // thins under an advanced atheroma loses thickness on its INNER side, and the atheroma bulges only into the lumen.
    const out = (x) => Y0 + 82 - u(x) - 82 * k(x);                  // outer surface of the artery
    const medTop = (x) => out(x) + 26 * k(x);                       // outer edge of the middle layer
    const M = (x) => medTop(x) + 50 * k(x) * (1 - thin(x));         // inner edge of the middle layer
    const L = (x) => Y0 + 82 - u(x) + p(x);                         // lumen surface (endothelium)
    const yb = Y0 + 202;                                            // bottom wall endothelium (lumen bottom)
    const defs = marker("ar" + id, INK) + marker("ag" + id, GREY) + marker("ap" + id, OX) +
      `<pattern id="hz${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L8 0" stroke="#ffffff" stroke-width="1.2" opacity=".6"/></pattern>`;
    let s = open(W, H, o.aria || `Longitudinal section through part of an artery: ${S ? S.label : st}`, defs);
    if (o.title) s += T(W / 2, 20, o.title, { s: 16, w: 700 });
    // lumen with blood
    s += `<path d="${band(x0, x1, L, () => yb)}" fill="${C.lum}"/>`;
    // TOP wall layers
    s += `<path d="${band(x0, x1, out, medTop)}" fill="${C.coll}" stroke="${C.collS}" stroke-width="1"/>`;
    for (let i = 0; i < 2; i++) s += `<path d="${line(x0 + 6, x1 - 6, (x) => out(x) + (8 + 9 * i) * k(x) + 1.6 * Math.sin(x / 7 + i * 2))}" fill="none" stroke="${C.collS}" stroke-width="1"/>`;
    s += `<path d="${band(x0, x1, medTop, M)}" fill="${C.med}" stroke="${C.medS}" stroke-width="1"/>`;
    for (let i = 0; i < 3; i++) s += `<path d="${line(x0 + 4, x1 - 4, (x) => medTop(x) + (M(x) - medTop(x)) * (0.22 + 0.28 * i) + 1.5 * Math.sin(x / 6 + i))}" fill="none" stroke="${C.elas}" stroke-width="1.5"/>`;
    for (let x = x0 + 14; x < x1 - 8; x += 26) for (let r = 0; r < 2; r++) { const xx = x + r * 13; const y = medTop(xx) + (M(xx) - medTop(xx)) * (0.36 + 0.3 * r); s += `<ellipse cx="${xx}" cy="${y.toFixed(1)}" rx="3.2" ry="2.2" fill="${C.medS}" opacity=".75"/>`; }
    // intima / plaque region between M and L
    s += `<path d="${band(x0, x1, M, L)}" fill="${t > 0 ? C.cap : C.endo}" stroke="none"/>`;
    if (t >= 0.3) { // lipid core with cholesterol crystals
      const core0 = cx - hw * 0.62, core1 = cx + hw * 0.62;
      const cTop = (x) => M(x) + 3, cBot = (x) => Math.max(M(x) + 4, L(x) - Math.max(7, 0.38 * p(x)));
      s += `<path d="${band(core0, core1, cTop, cBot, 3)}" fill="${C.lip}" stroke="${C.lipS}" stroke-width="1.2"/>`;
      for (let x = core0 + 14; x < core1 - 10; x += 19) { const yt = cTop(x), yb2 = cBot(x); if (yb2 - yt < 12) continue; const y = (yt + yb2) / 2 + ((x * 7) % 9) - 4; s += `<rect x="${x - 7}" y="${(y - 1.2).toFixed(1)}" width="14" height="2.4" fill="${C.lipS}" opacity=".7" transform="rotate(${((x * 13) % 50) - 25} ${x} ${y.toFixed(1)})"/>`; }
      for (let x = cx - hw * 0.75; x < cx + hw * 0.75; x += 22) { const y = L(x) - Math.max(3.5, 0.18 * p(x)); s += `<path d="M${x - 8} ${y.toFixed(1)} q4 -2 8 0 t8 0" fill="none" stroke="${C.capS}" stroke-width="1.1"/>`; }
    }
    if (st === "streak") for (let x = cx - 70; x <= cx + 70; x += 28) { const y = (M(x) + L(x)) / 2; s += `<circle cx="${x}" cy="${y.toFixed(1)}" r="6.5" fill="${C.foam}" stroke="${C.lipS}" stroke-width="1.1"/><circle cx="${x - 2}" cy="${(y - 1.5).toFixed(1)}" r="1.8" fill="${C.lip}" stroke="${C.lipS}" stroke-width=".6"/><circle cx="${x + 2.5}" cy="${(y + 1.5).toFixed(1)}" r="1.5" fill="${C.lip}" stroke="${C.lipS}" stroke-width=".6"/>`; }
    if (st === "advanced" || st === "thrombosis") [[cx - 40, 0.55], [cx + 22, 0.48], [cx - 4, 0.62]].forEach(([x, f]) => { const y = M(x) + (L(x) - M(x)) * f * 0.5 + 4; s += `<path d="M${x - 9} ${y} l5 -5 l9 1 l4 6 l-6 5 l-9 -1 z" fill="${C.ca}" stroke="${C.caS}" stroke-width="1.1"/>`; });
    // endothelium (top) as a pink line; gaps where damaged or where the cap has broken
    const gaps = st === "damage" ? [[cx - 40, cx - 26], [cx + 18, cx + 30]] : st === "thrombosis" ? [[cx + 56, cx + 74]] : [];
    let segs = [[x0, x1]]; gaps.forEach(([a, b]) => { segs = segs.flatMap(([c, d]) => (b < c || a > d ? [[c, d]] : [[c, a], [b, d]].filter(([e, f]) => f - e > 2))); });
    segs.forEach(([a, b]) => { s += `<path d="${line(a, b, (x) => L(x) - 1.6, 2)}" fill="none" stroke="${C.endoS}" stroke-width="3.4" stroke-linecap="round"/>`; });
    if (st === "damage") { // LDL particles entering through the gaps
      [[cx - 33, 0], [cx - 30, -12], [cx - 40, 14], [cx + 24, -4], [cx + 30, 12], [cx + 10, 20], [cx - 60, 26]].forEach(([x, dy], i) => { const y = i < 2 || i === 3 ? L(x) - 6 + dy * 0.2 : L(x) + 14 + Math.abs(dy); s += `<circle cx="${x}" cy="${y.toFixed(1)}" r="3.2" fill="${C.lip}" stroke="${C.lipS}" stroke-width="1"/>`; }); }
    // BOTTOM wall (healthy, mirror of the top)
    s += `<rect x="${x0}" y="${yb}" width="${x1 - x0}" height="6" fill="${C.endo}"/><line x1="${x0}" y1="${yb + 1.6}" x2="${x1}" y2="${yb + 1.6}" stroke="${C.endoS}" stroke-width="3.4"/>`;
    s += `<rect x="${x0}" y="${yb + 6}" width="${x1 - x0}" height="50" fill="${C.med}" stroke="${C.medS}" stroke-width="1"/>`;
    for (let i = 0; i < 3; i++) s += `<path d="${line(x0 + 4, x1 - 4, (x) => yb + 6 + 50 * (0.22 + 0.28 * i) + 1.5 * Math.sin(x / 6 + i))}" fill="none" stroke="${C.elas}" stroke-width="1.5"/>`;
    for (let x = x0 + 14; x < x1 - 8; x += 26) for (let r = 0; r < 2; r++) s += `<ellipse cx="${x + r * 13}" cy="${(yb + 6 + 50 * (0.36 + 0.3 * r)).toFixed(1)}" rx="3.2" ry="2.2" fill="${C.medS}" opacity=".75"/>`;
    s += `<rect x="${x0}" y="${yb + 56}" width="${x1 - x0}" height="26" fill="${C.coll}" stroke="${C.collS}" stroke-width="1"/>`;
    for (let i = 0; i < 2; i++) s += `<path d="${line(x0 + 6, x1 - 6, (x) => yb + 56 + 8 + 9 * i + 1.6 * Math.sin(x / 7 + i * 2))}" fill="none" stroke="${C.collS}" stroke-width="1"/>`;
    // red blood cells
    const cells = [[60, 0.35], [118, 0.7], [178, 0.45], [500, 0.3], [560, 0.66], [596, 0.42], [250, 0.8], [430, 0.78]];
    cells.forEach(([x, f]) => { const top = L(x) + 8, bot = yb - 8; if (bot - top < 14) return; if (st === "thrombosis" && x > cx + 30 && x < cx + 210) return; const y = top + (bot - top) * f; s += `<ellipse cx="${x}" cy="${y.toFixed(1)}" rx="9" ry="4.5" fill="${C.rbc}" opacity=".85"/>`; });
    // thrombus: on the plaque, filling the lumen just beyond the break
    if (st === "thrombosis") {
      const a = cx + 40, b = cx + 205; const top = (x) => L(x) - 2; const bot = (x) => yb - (x < a + 16 ? 30 * (1 - (x - a) / 16) : x > b - 26 ? 40 * ((x - (b - 26)) / 26) : 0);
      s += `<path d="${band(a, b, top, bot, 3)}" fill="${C.thr}" stroke="#6d1b1c" stroke-width="1.4"/>`;
      for (let i = 0; i < 7; i++) { const x = a + 14 + i * 22; s += `<path d="M${x - 14} ${(L(x) + 6).toFixed(1)} L${x + 10} ${(yb - 8).toFixed(1)} M${x + 12} ${(L(x) + 4).toFixed(1)} L${x - 6} ${(yb - 10).toFixed(1)}" stroke="${C.fib}" stroke-width="1.2"/>`; }
      for (let i = 0; i < 6; i++) { const x = a + 24 + i * 25, y = (L(x) + yb) / 2 + ((i % 2) ? 14 : -10); s += `<ellipse cx="${x}" cy="${y.toFixed(1)}" rx="7" ry="3.6" fill="${C.rbc}" stroke="#6d1b1c" stroke-width=".6"/>`; }
    }
    // flow arrows
    const midY = (x) => (L(x) + yb) / 2;
    if (st === "thrombosis") { s += `<path d="M${x0 + 18} ${midY(x0 + 18).toFixed(1)} L${cx - 110} ${midY(cx - 110).toFixed(1)}" stroke="${INK}" stroke-width="3" marker-end="url(#ar${id})"/>`; s += T(cx + 262, midY(cx + 262) + 5, "no flow", { s: 14, w: 700, c: OX }); }
    else if (st !== "aneurysm") { const w = t >= 0.5 ? 1.6 : t >= 0.3 ? 2.2 : 3; s += `<path d="M${x0 + 18} ${midY(x0 + 18).toFixed(1)} L${x0 + 170} ${midY(x0 + 170).toFixed(1)}" stroke="${INK}" stroke-width="3" marker-end="url(#ar${id})"/><path d="M${cx + 190} ${midY(cx + 190).toFixed(1)} L${x1 - 18} ${midY(x1 - 18).toFixed(1)}" stroke="${INK}" stroke-width="${w}" marker-end="url(#ar${id})"/>`; }
    else { s += `<path d="M${x0 + 18} ${midY(x0 + 18).toFixed(1)} L${x0 + 140} ${midY(x0 + 140).toFixed(1)}" stroke="${INK}" stroke-width="3" marker-end="url(#ar${id})"/><path d="M${x1 - 140} ${midY(x1 - 140).toFixed(1)} L${x1 - 18} ${midY(x1 - 18).toFixed(1)}" stroke="${INK}" stroke-width="3" marker-end="url(#ar${id})"/>`;
      [[cx - 70, -1], [cx, 0], [cx + 70, 1]].forEach(([x, dx]) => { s += `<path d="M${x} ${(midY(x) - 6).toFixed(1)} L${x + dx * 16} ${(L(x) + 14).toFixed(1)}" stroke="${OX}" stroke-width="2.4" marker-end="url(#ap${id})"/>`; }); }
    if (labels) {
      // layer names in the healthy part on the left (inside the bands, with a white halo) and the lumen label
      const hx = x0 + 10, ox = x0 + 80;
      s += T(hx, out(ox) + 18, "outer layer: collagen", { a: "start", s: 14, w: 700, c: "#5a4518", halo: true });
      s += T(hx, medTop(ox) + 21, "middle layer: smooth", { a: "start", s: 14, w: 700, c: "#6e2d28", halo: true }) + T(hx, medTop(ox) + 39, "muscle, elastic tissue", { a: "start", s: 14, w: 700, c: "#6e2d28", halo: true });
      s += lead(hx + 150, L(ox) + 22, hx + 172, L(hx + 172) - 1.5, "#7a3f30") + T(hx, L(ox) + 26, "endothelium (lining)", { a: "start", s: 14, w: 700, c: "#7a3f30", halo: true });
      if (st !== "thrombosis") s += T(x0 + 96, midY(x0 + 96) + 26, "lumen: blood flow", { s: 14, w: 600, c: GREY, halo: true });
      const call = (x, y, tx, ty, lines, c = INK) => lead(tx, ty + 6, x, y) + lines.map((l, i) => T(tx, ty - (lines.length - 1 - i) * 18, l, { s: 15, w: i ? 500 : 700, c: i ? GREY : c, halo: true })).join("");
      if (st === "damage") s += call(cx - 33, L(cx - 33) - 2, cx - 80, 62, ["damaged endothelium", "lipid (LDL) enters the wall"], "#7a3f30");
      if (st === "streak") s += call(cx, (M(cx) + L(cx)) / 2, cx + 120, 62, ["lipid and white blood cells", "under the endothelium"], "#7a5a00");
      if (t >= 0.3 && st !== "aneurysm") s += call(cx - 30, M(cx - 30) + 10, cx - 150, 62, ["atheroma: lipid core", "under a fibrous cap"], "#7a5a00");
      if (t >= 0.3 && st !== "aneurysm" && st !== "thrombosis") s += call(cx + 40, L(cx + 40) + 4, cx + 170, 62, ["lumen narrowed", "less blood can flow"], INK);
      if (st === "thrombosis") { s += call(cx + 65, L(cx + 65) - 2, cx + 175, 62, ["cap breaks:", "platelets stick, clot forms"], C.thr); s += lead(cx + 150, yb - 30, cx + 150, H - 34) + T(cx + 150, H - 14, "thrombus (blood clot) blocks the lumen", { s: 15, w: 700, c: C.thr }); }
      if (st === "aneurysm") { s += T(cx, 30, "weakened wall bulges outwards: aneurysm", { s: 15, w: 700, c: OX, halo: true }); s += T(cx, yb + 108, "blood pressure pushes on the weakened wall", { s: 14, w: 600, c: OX }); }
    }
    if (!o.title && labels && st === "healthy") s += T(W / 2, 40, "Healthy artery wall (longitudinal section)", { s: 16, w: 700 });
    return flat(s + "</svg>");
  };

  // ---------- transverse section of the artery (lumen area) ----------
  const wallCross = (o = {}) => {
    const t = o.t || 0, W = 230, H = 236, cx = 115, cy = 112; const occl = !!o.blocked, bulge = !!o.bulge;
    let s = open(W, H, o.aria || `Transverse section of the artery: lumen area about ${Math.round(lumenPct(t))} % of a healthy lumen`);
    const R = bulge ? [100, 86, 70] : [94, 78, 56]; // outer, media outer, endothelium radius (lumen edge)
    s += `<circle cx="${cx}" cy="${cy}" r="${R[0]}" fill="${C.coll}" stroke="${C.collS}"/><circle cx="${cx}" cy="${cy}" r="${R[1]}" fill="${C.med}" stroke="${C.medS}"/>`;
    for (let i = 0; i < 3; i++) s += `<circle cx="${cx}" cy="${cy}" r="${R[2] + 4 + i * 6}" fill="none" stroke="${C.elas}" stroke-width="1.4" stroke-dasharray="6 3"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R[2]}" fill="${t > 0 ? C.lip : C.lum}" stroke="${t > 0 ? C.lipS : C.endoS}" stroke-width="2.5"/>`;
    if (t > 0) { const rl = R[2] * (1 - t), cyl = cy + R[2] * t; // the atheroma fills the top of the lumen; what is left of the lumen is open, or filled by the thrombus
      s += `<circle cx="${cx}" cy="${cyl}" r="${rl}" fill="${occl ? C.thr : C.lum}" stroke="${C.endoS}" stroke-width="2.5"/>`; if (!occl) s += T(cx, cy - R[2] * 0.45, "atheroma", { s: 14, w: 700, c: "#7a5a00" }); }
    if (bulge) s += `<circle cx="${cx}" cy="${cy - 9}" r="${R[2] + 13}" fill="${C.lum}" stroke="${C.endoS}" stroke-width="2.5"/>`; // wider lumen, wall thinner on the bulging side (top)
    const lab = occl ? "thrombus fills the lumen" : bulge ? "lumen widened (bulge)" : t > 0 ? "lumen narrowed" : "healthy lumen";
    s += T(cx, H - 6, lab, { s: 15, w: 700, c: occl ? OX : INK });
    return flat(s + "</svg>");
  };

  // ---------- front view of the heart with the coronary arteries (d-3.2.7.1-1) and a myocardial infarction (d-3.2.7.1-5) ----------
  // Redrawn 2026-11-15 (teacher's decisions): one clean front view; only the aorta, pulmonary artery, right and left
  // coronary arteries and the heart muscle are named (branch names and the regions each branch supplies are beyond the
  // specification and were removed). o.mi: the left coronary artery's branch down the front is blocked by a thrombus on
  // an atheroma (circled, with a magnified inset) and the muscle beyond the block is shaded as dead (infarct).
  const heartFrontArt = (o = {}) => { const id = o.id; const MUS = "#8f4a43", RED = "#e05a4c", BLU = "#6f8fc7";
    const vent = "M70 150 C112 128 232 122 288 140 C322 152 332 192 322 238 C310 298 262 338 212 358 C148 338 92 292 70 238 C60 206 60 172 70 150 Z";
    const tube = (d, w, c) => `<path d="${d}" stroke="${MUS}" stroke-width="${w + 5}" fill="none" stroke-linecap="butt"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
    let s = tube("M150 156 L150 82 C150 40 236 40 236 82 L236 112", 36, RED); // aorta: root hidden behind the pulmonary artery
    s += tube("M90 30 L90 160", 32, BLU); // superior vena cava
    s += `<path d="M70 150 C40 140 22 168 24 202 C26 238 52 256 80 248 C72 214 66 180 70 150 Z" fill="#cf8f86" stroke="${MUS}" stroke-width="2.2"/>`; // right atrium
    s += `<path d="${vent}" fill="#d9958b" stroke="${MUS}" stroke-width="2.4"/>`;
    s += `<path d="M286 140 C300 120 332 124 336 146 C338 166 318 174 298 166 Z" fill="#cf8f86" stroke="${MUS}" stroke-width="2"/>`; // left auricle
    if (o.mi) s += `<path d="M206 214 C232 212 262 206 296 200 C300 252 286 300 252 330 C232 344 216 352 212 358 C196 352 178 340 170 330 C182 290 194 248 206 214 Z" fill="url(#mh${id})" stroke="${C.hurt}" stroke-width="2"/>`;
    s += tube("M196 152 C196 112 212 92 244 86 L300 84", 34, BLU); // pulmonary artery, in front of the aorta
    // coronary arteries from the base of the aorta
    const art = (d, w, c, da) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${da ? ` stroke-dasharray="${da}"` : ""}/>`;
    // both coronary arteries start on the aortic root, just above the heart; the left one passes behind the pulmonary artery
    s += art("M140 124 C110 140 90 192 94 240 C98 280 124 310 156 326", 5.5, OX) + art("M96 232 L128 240 M114 292 L142 286", 3, OX);
    s += art("M160 124 C178 138 196 156 214 162", 5, OX, "5 4") + `<circle cx="140" cy="124" r="4" fill="${OX}"/><circle cx="160" cy="124" r="4" fill="${OX}"/>`;
    s += art("M214 162 C252 160 290 166 316 190", 5, OX) + art("M262 164 L268 196", 3, OX);
    const below = o.mi ? "#9aa3ad" : OX;
    s += art("M214 162 C214 178 212 196 210 210", 5, OX) + art("M210 210 C206 256 202 306 206 352", 5, below, o.mi ? "7 5" : "") + art("M208 250 L238 262 M206 300 L178 312", 3, below, o.mi ? "5 4" : "");
    if (o.mi) s += `<circle cx="210" cy="214" r="10" fill="${C.thr}" stroke="#fff" stroke-width="2.5"/><circle cx="210" cy="214" r="17" fill="none" stroke="${INK}" stroke-width="2"/>`;
    return s; };
  const coronaryFig = () => { const id = uid(); const W = 640, H = 380;
    let s = open(W, H, "Front view of the heart. The aorta rises from the heart and arches over; the pulmonary artery passes in front of it. Two coronary arteries leave the base of the aorta and branch over the surface of the heart: the right coronary artery on the viewer's left and the left coronary artery on the viewer's right. They carry oxygenated blood to the cardiac muscle of the heart wall.");
    s += `<g transform="translate(130 6)">${heartFrontArt({ id })}</g>`;
    const lab = (tx, ty, x, y, t1, a = "start", c = INK) => lead(a === "start" ? tx - 6 : tx + 6, ty - 5, x, y, INK) + T(tx, ty, t1, { a, s: 15, w: 700, c });
    s += lab(470, 52, 368, 56, "Aorta") + lab(470, 98, 426, 92, "Pulmonary artery") + lab(470, 176, 418, 170, "Left coronary artery", "start", OX);
    s += lab(116, 250, 226, 250, "Right coronary", "end", OX) + T(116, 268, "artery", { a: "end", s: 15, w: 700, c: OX }) + lab(470, 300, 400, 290, "Cardiac muscle") + T(470, 318, "(heart wall)", { a: "start", s: 13, w: 500, c: GREY });
    s += T(16, 24, "RIGHT side (your left)", { a: "start", s: 13, w: 800, c: DE }) + T(W - 16, H - 10, "LEFT side (your right)", { a: "end", s: 13, w: 800, c: OX });
    return flat(s + "</svg>"); };
  const miFigure = () => { const id = uid(); const W = 760, H = 470;
    const defs = `<pattern id="mh${id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="${C.hurt}" opacity=".45"/><line x1="0" y1="0" x2="0" y2="9" stroke="${C.hurt}" stroke-width="3" opacity=".9"/></pattern>` + marker("mc" + id, INK);
    let s = open(W, H, "Myocardial infarction. Left: front view of the heart. The branch of the left coronary artery that runs down the front of the heart is blocked near its start by a blood clot on an atheroma (circled). A magnified view shows the artery wall with a yellow atheroma and a red thrombus filling the rest of the lumen. Beyond the block the artery is grey and dashed (no blood flow), and the muscle it supplies is hatched: it receives no oxygen and its cells die (the infarct). Right: a flow chart of six boxes joined by arrows: a coronary artery is blocked, usually by a thrombus on an atheroma; blood flow to the cardiac muscle beyond the block stops; that muscle receives less oxygen and glucose; less aerobic respiration, so less ATP is made; the muscle cannot contract properly; if the supply is not restored, the muscle cells are damaged and die.", defs);
    s += `<g transform="translate(14 64)">${heartFrontArt({ id, mi: true })}</g>`;
    // magnified view of the blocked artery
    const mx = 120, my = 58; s += `<line x1="${mx + 40}" y1="${my + 26}" x2="${224 - 14}" y2="${278 - 14}" stroke="${INK}" stroke-width="1.6"/>`;
    s += `<circle cx="${mx}" cy="${my}" r="50" fill="#fff" stroke="${INK}" stroke-width="2"/><clipPath id="mc2${id}"><circle cx="${mx}" cy="${my}" r="48"/></clipPath><g clip-path="url(#mc2${id})">`;
    s += `<rect x="${mx - 50}" y="${my - 32}" width="100" height="16" fill="${C.med}" stroke="${C.medS}"/><rect x="${mx - 50}" y="${my + 16}" width="100" height="16" fill="${C.med}" stroke="${C.medS}"/><rect x="${mx - 50}" y="${my - 16}" width="100" height="32" fill="${C.lum}"/>`;
    // the thrombus sits on the ruptured atheroma and fills the whole lumen up to the upper wall: the artery is blocked
    s += `<path d="M${mx - 52} ${my + 16} C${mx - 30} ${my - 4} ${mx + 30} ${my - 4} ${mx + 52} ${my + 16} Z" fill="${C.lip}" stroke="${C.lipS}" stroke-width="1.5"/>`;
    s += `<path d="M${mx - 52} ${my - 17} L${mx + 52} ${my - 17} L${mx + 52} ${my + 16} C${mx + 30} ${my - 4} ${mx - 30} ${my - 4} ${mx - 52} ${my + 16} Z" fill="${C.thr}"/>`;
    s += `<path d="M${mx - 30} ${my - 12} l12 10 l10 -8 l12 9 l10 -7 M${mx - 40} ${my} l14 -6 M${mx + 18} ${my - 14} l14 8" fill="none" stroke="${C.fib}" stroke-width="1.4"/><ellipse cx="${mx - 16}" cy="${my - 6}" rx="5" ry="2.6" fill="${C.rbc}"/><ellipse cx="${mx + 26}" cy="${my - 8}" rx="5" ry="2.6" fill="${C.rbc}"/>`;
    s += `<path d="M${mx - 6} ${my + 2} l4 -4 l4 4 l4 -4" fill="none" stroke="#fff" stroke-width="1.6"/></g>`;
    s += T(mx + 58, my - 18, "thrombus (red) on a", { a: "start", s: 13, w: 700, c: C.thr }) + T(mx + 58, my - 2, "ruptured atheroma (yellow)", { a: "start", s: 13, w: 700, c: "#7a5a00" }) + T(mx + 58, my + 14, "blocks the artery", { a: "start", s: 13, w: 700, c: C.thr });
    s += lead(206, 423, 238, 398, C.hurt) + T(16, 428, "Muscle beyond the block", { a: "start", s: 14, w: 800, c: C.hurt }) + T(16, 446, "gets no oxygen: cells die", { a: "start", s: 13, w: 600, c: C.hurt }) + T(16, 462, "(the infarct)", { a: "start", s: 13, w: 600, c: C.hurt });
    // flow chart
    const steps = [["A coronary artery is blocked", "usually by a thrombus on an atheroma"], ["Blood flow to the cardiac", "muscle beyond the block stops"], ["That muscle receives less", "oxygen (and glucose)"], ["Less aerobic respiration", "so less ATP is made"], ["Muscle cannot contract", "properly"], ["If not restored: muscle cells", "damaged and die (infarction)"]];
    const x = 446, w = 300, h = 58, g = 16; steps.forEach(([a, b], i) => { const y = 14 + i * (h + g); s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${i === 5 ? "#efe7f7" : "#f6f8fa"}" stroke="${i === 5 ? C.hurt : "#9fb0bf"}" stroke-width="1.6"/>` + T(x + w / 2, y + 25, a, { s: 15, w: 700 }) + T(x + w / 2, y + 45, b, { s: 14, w: 500, c: GREY }); if (i < 5) s += `<path d="M${x + w / 2} ${y + h + 1} L${x + w / 2} ${y + h + g - 2}" stroke="${INK}" stroke-width="2.2" marker-end="url(#mc${id})"/>`; });
    return flat(s + "</svg>"); };

  // ---------- how the four risk factors act (concept diagram) ----------
  const riskWeb = () => {
    const id = uid(); const W = 760, H = 480; let s = open(W, H, "How the four specified risk factors are linked to coronary heart disease. Diet: saturated fat raises blood LDL cholesterol; salt raises blood pressure. High blood cholesterol: more lipid deposited in artery walls, so more atheroma. Cigarette smoking: chemicals damage the endothelium; carbon monoxide reduces oxygen carried; nicotine raises heart rate and blood pressure and makes platelets stickier, so thrombosis is more likely. High blood pressure: damages the endothelium and strains weakened artery walls. All lead to atheroma in coronary arteries, then thrombosis and myocardial infarction. Every link is an increased probability, not a certainty.", marker("rw" + id, INK));
    const box = (x, y, w, h, title, lines, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>` + T(x + w / 2, y + 24, title, { s: 15, w: 800, c: stroke }) + lines.map((l, i) => T(x + w / 2, y + 46 + i * 18, l, { s: 13, w: 500 })).join("");
    const ar = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="2" marker-end="url(#rw${id})"/>`;
    s += box(14, 14, 172, 116, "Diet", ["saturated fat raises", "LDL cholesterol;", "salt raises blood", "pressure"], "#fbf4e4", "#9a6a12");
    s += box(200, 14, 172, 116, "Blood cholesterol", ["high LDL: more", "lipid enters and", "stays in artery walls"], "#fdf6d8", "#8a6d00");
    s += box(386, 14, 172, 116, "Smoking", ["damages endothelium;", "CO carried by", "haemoglobin; stickier", "platelets"], "#eef1f4", "#3d4f61");
    s += box(572, 14, 172, 116, "High blood pressure", ["damages endothelium;", "strains weakened", "artery walls"], "#fbe9e7", "#a2362f");
    s += box(150, 196, 460, 70, "Atheroma in artery walls (coronary arteries, aorta)", ["lumen narrows; wall roughened and weakened"], "#fff7e0", "#b8901f");
    s += box(70, 326, 280, 76, "Aneurysm", ["weakened wall bulges (worse with", "high blood pressure); may burst"], "#f9e3e3", "#9e2a2b");
    s += box(410, 326, 280, 76, "Thrombosis", ["blood clot forms on the atheroma", "and blocks a coronary artery"], "#f9e3e3", "#9e2a2b");
    s += ar(100, 130, 250, 194) + ar(286, 130, 330, 194) + ar(472, 130, 420, 194) + ar(658, 130, 520, 194) + ar(300, 266, 230, 324) + ar(460, 266, 530, 324);
    s += `<path d="M536 130 C560 168 650 168 684 236 C700 270 690 300 664 324" stroke="${INK}" stroke-width="1.6" stroke-dasharray="5 4" fill="none" marker-end="url(#rw${id})"/>` + T(756, 290, "stickier", { s: 13, w: 600, c: GREY, a: "end" }) + T(756, 306, "platelets", { s: 13, w: 600, c: GREY, a: "end" });
    s += `<rect x="410" y="424" width="280" height="38" rx="10" fill="#efe7f7" stroke="${C.hurt}" stroke-width="1.6"/>` + T(550, 448, "Myocardial infarction", { s: 15, w: 800, c: C.hurt });
    s += ar(550, 402, 550, 422);
    s += T(16, H - 30, "Each arrow means", { a: "start", s: 13, w: 700, c: GREY }) + T(16, H - 12, "more likely, not certain.", { a: "start", s: 13, w: 600, c: GREY }); s += T(W - 8, H - 4, "", { a: "end", s: 11, w: 500, c: GREY });
    return flat(s + "</svg>");
  };

  // ---------- data charts ----------
  // Dot-and-whisker chart of hazard ratios (PSC 2007)
  const pscChart = () => {
    const W = 640, H = 300, L = 150, R = 40, top = 70, row = 62, max = 1.2; const x = (v) => L + ((W - L - R) * v) / max;
    let s = open(W, H, `Hazard ratio for death from ischaemic heart disease per 1 mmol/L lower usual total cholesterol: ${PSC.rows.map((r) => `ages ${r.age} ${r.hr} (95 % confidence interval ${r.lo} to ${r.hi})`).join("; ")}. A dashed line marks 1, no difference.`);
    s += T(W / 2, 22, "Lower cholesterol and death from ischaemic heart disease", { s: 16, w: 700 }) + T(W / 2, 42, "hazard ratio per 1 mmol/L lower total cholesterol (PSC, Lancet, 2007)", { s: 13, w: 500, c: GREY });
    for (let v = 0; v <= max + 1e-9; v += 0.2) { s += `<line x1="${x(v)}" y1="${top - 10}" x2="${x(v)}" y2="${top + row * 3 - 14}" stroke="#e3e8ec"/>` + T(x(v), top + row * 3 + 4, v.toFixed(1), { s: 13, w: 500, c: GREY }); }
    s += `<line x1="${x(1)}" y1="${top - 14}" x2="${x(1)}" y2="${top + row * 3 - 10}" stroke="${INK}" stroke-width="1.6" stroke-dasharray="6 4"/>` + T(x(1) + 6, top + row * 3 - 20, "1 = no difference", { s: 12, w: 600, a: "start" });
    PSC.rows.forEach((r, i) => { const y = top + 18 + i * row; s += T(L - 14, y + 5, `aged ${r.age}`, { a: "end", s: 14, w: 700 }) + `<line x1="${x(r.lo)}" y1="${y}" x2="${x(r.hi)}" y2="${y}" stroke="${INK}" stroke-width="2.4"/><line x1="${x(r.lo)}" y1="${y - 7}" x2="${x(r.lo)}" y2="${y + 7}" stroke="${INK}" stroke-width="2"/><line x1="${x(r.hi)}" y1="${y - 7}" x2="${x(r.hi)}" y2="${y + 7}" stroke="${INK}" stroke-width="2"/><rect x="${x(r.hr) - 4}" y="${y - 9}" width="8" height="18" fill="#1f8a8a"/>` + T(x(r.hi) + 10, y + 5, r.hr.toFixed(2), { a: "start", s: 14, w: 700, c: "#1f6f6f" }); });
    s += T(W / 2, H - 10, "hazard ratio (bars: 95 % confidence interval)", { s: 13, w: 500, c: GREY });
    return flat(s + "</svg>");
  };
  // Icon array: coronary deaths per 1000 in each 4S group
  const iconArray = (o = {}) => {
    const k = o.k || "coronary"; const c = s4Calc(k); const W = 680, H = 380; const per = [Math.round(c.p * 10), Math.round(c.s * 10)];
    const name = { coronary: "coronary deaths", deaths: "deaths from any cause", major: "people with a major coronary event" }[k];
    let s = open(W, H, `Two grids of 1000 squares. Placebo group: about ${per[0]} in 1000 ${name}. Simvastatin group: about ${per[1]} in 1000. Over a median of 5.4 years in the 4S trial.`);
    s += T(W / 2, 22, `4S trial: ${name} per 1000 people (median 5.4 years)`, { s: 15, w: 700 });
    const grid = (x0, n, fill, title) => { let g = T(x0 + 150, 50, title, { s: 14, w: 700 }); for (let i = 0; i < 1000; i++) { const col = i % 40, row = Math.floor(i / 40); g += `<rect x="${x0 + col * 7.5}" y="${62 + row * 11}" width="6" height="9" fill="${i < n ? fill : "#dde3e8"}"/>`; } return g + T(x0 + 150, 352, `${n} in 1000`, { s: 15, w: 800, c: fill }); };
    s += grid(16, per[0], "#b4504f", "Placebo") + grid(364, per[1], "#1f6f8a", "Simvastatin");
    s += T(W / 2, H - 6, "each square is one person; coloured squares are the people affected", { s: 12, w: 500, c: GREY });
    return flat(s + "</svg>");
  };
  // Generic vertical bar chart (values already computed by the caller)
  const bars = (o) => {
    const W = o.W || 640, H = o.H || 330, L = 64, R = 18, top = 60, bot = 70; const n = o.vals.length, max = o.max || Math.max(...o.vals) * 1.15; const bw = (W - L - R) / n;
    const y = (v) => top + (H - top - bot) * (1 - v / max);
    let s = open(W, H, o.alt || o.title);
    s += T(W / 2, 22, o.title, { s: 16, w: 700 }) + (o.sub ? T(W / 2, 42, o.sub, { s: 13, w: 500, c: GREY }) : "");
    (o.ticks || []).forEach((v) => { s += `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="#e3e8ec"/>` + T(L - 8, y(v) + 4, String(v), { a: "end", s: 12, w: 500, c: GREY }); });
    o.vals.forEach((v, i) => { const x = L + i * bw + bw * 0.18, w = bw * 0.64; s += `<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${(y(0) - y(v)).toFixed(1)}" fill="${(o.colors || [])[i] || "#1f6f8a"}"/>` + T(x + w / 2, y(v) - 6, o.fmt ? o.fmt(v) : String(v), { s: 13, w: 700 });
      String(o.cats[i]).split("|").forEach((ln, j) => { s += T(x + w / 2, H - bot + 20 + j * 16, ln, { s: 13, w: j ? 500 : 600, c: j ? GREY : INK }); }); });
    s += `<line x1="${L}" y1="${y(0)}" x2="${W - R}" y2="${y(0)}" stroke="${INK}" stroke-width="1.4"/>`;
    if (o.yLabel) s += `<text x="16" y="${(top + H - bot) / 2}" transform="rotate(-90 16 ${(top + H - bot) / 2})" text-anchor="middle" font-size="12" font-weight="600" fill="${GREY}">${o.yLabel}</text>`;
    return flat(s + "</svg>");
  };
  // Grouped bars for the two towns
  const townChart = (split) => {
    const P = TOWNS.P, Q = TOWNS.Q; const tp = townTot("P"), tq = townTot("Q");
    if (!split) return bars({ title: "All ages together (crude rates)", sub: "HYPOTHETICAL data: new cases of CHD per 1000 people aged 45 and over, 5 years", vals: [rate(tp.cases, tp.n), rate(tq.cases, tq.n)], cats: ["Town P", "Town Q"], colors: ["#7a5ea8", "#3a8f7a"], max: 20, ticks: [0, 5, 10, 15, 20], fmt: (v) => v.toFixed(1), yLabel: "cases per 1000", alt: `Crude rates: Town P ${fix(rate(tp.cases, tp.n), 1)}, Town Q ${fix(rate(tq.cases, tq.n), 1)} per 1000` });
    const v = [rate(P.rows[0].cases, P.rows[0].n), rate(Q.rows[0].cases, Q.rows[0].n), rate(P.rows[1].cases, P.rows[1].n), rate(Q.rows[1].cases, Q.rows[1].n)];
    return bars({ title: "Split by age group (age-specific rates)", sub: "HYPOTHETICAL data: new cases of CHD per 1000 people, 5 years", vals: v, cats: ["Town P|aged 45–64", "Town Q|aged 45–64", "Town P|65 and over", "Town Q|65 and over"], colors: ["#7a5ea8", "#3a8f7a", "#7a5ea8", "#3a8f7a"], max: 20, ticks: [0, 5, 10, 15, 20], fmt: (x) => x.toFixed(1), yLabel: "cases per 1000", alt: `Age-specific rates per 1000: aged 45–64, Town P ${fix(v[0], 1)}, Town Q ${fix(v[1], 1)}; 65 and over, Town P ${fix(v[2], 1)}, Town Q ${fix(v[3], 1)}` });
  };
  const bpChart = (adj = {}) => {
    const rows = BPCOH.rows.map((r, i) => ({ ...r, cases: r.cases + (adj[i] || 0) })); const v = rows.map((r) => rate(r.cases, r.n));
    return bars({ title: "Systolic blood pressure and new CHD over 10 years", sub: "HYPOTHETICAL cohort: rate per 1000 people (n = people in each band)", vals: v, cats: rows.map((r) => `${r.band}|n = ${r.n.toLocaleString("en-GB")}`), colors: ["#cfd9e2", "#b5c6d4", "#d99a8f", "#c4766b", "#8f3a30"], max: 110, ticks: [0, 20, 40, 60, 80, 100], fmt: (x) => x.toFixed(1), yLabel: "new CHD cases per 1000", alt: `Rates per 1000 by systolic band (mmHg): ${rows.map((r, i) => `${r.band}: ${fix(v[i], 1)} (n = ${r.n})`).join("; ")}` });
  };
  const unalChart = () => {
    const W = 640, H = 230; let s = open(W, H, `Of the ${UNAL.fewer.toLocaleString("en-GB")} fewer CHD deaths in England and Wales in 2000 than expected from 1981 rates, a model attributed about ${UNAL.riskPct} % to falls in major risk factors (the fall in smoking alone about ${UNAL.smokePct} %) and ${UNAL.treatPct} % to medical treatments.`);
    s += T(W / 2, 22, "Why did CHD deaths fall in England and Wales, 1981–2000?", { s: 16, w: 700 }) + T(W / 2, 42, `share of the ${UNAL.fewer.toLocaleString("en-GB")} fewer deaths in 2000, estimated by a model (Unal and others, 2004)`, { s: 12.5, w: 500, c: GREY });
    const x0 = 30, w = W - 60, wr = (w * UNAL.riskPct) / 100; s += `<rect x="${x0}" y="70" width="${wr}" height="60" fill="#1f8a8a"/><rect x="${x0 + wr}" y="70" width="${w - wr}" height="60" fill="#c98a00"/>`;
    s += T(x0 + wr / 2, 98, `risk factors ${UNAL.riskPct} %`, { s: 15, w: 800, c: "#fff" }) + T(x0 + wr / 2, 118, `smoking alone ${UNAL.smokePct} %`, { s: 13, w: 600, c: "#fff" }) + T(x0 + wr + (w - wr) / 2, 98, `treatments ${UNAL.treatPct} %`, { s: 15, w: 800, c: "#fff" }) + T(x0 + wr + (w - wr) / 2, 118, "medical and surgical", { s: 13, w: 600, c: "#fff" });
    s += T(W / 2, 162, `Death rates fell by ${UNAL.fallMen} % in men and ${UNAL.fallWomen} % in women aged ${UNAL.ages}.`, { s: 14, w: 600 }) + T(W / 2, 184, "Over the same years obesity and diabetes increased and physical activity fell.", { s: 13, w: 500, c: GREY });
    s += T(W / 2, 214, "The shares are model estimates, not direct measurements.", { s: 13, w: 700, c: "#7a5200" });
    return flat(s + "</svg>");
  };

  // ================================================================ picture figures (Phase 4 Batch 5) ================================================================
  // The teacher asked for textbook-style figures in place of the older hand-drawn ones. Each function below draws a
  // published or generated UNLABELLED picture as an <image> inside a fixed viewBox and adds every label as an SVG overlay
  // (text with a white halo, leader line with a white casing ending in a dot ON the structure), as in _heart-art.js.
  // Coordinates are the picture's own pixels plus a fixed offset, so labels stay aligned at any width.
  //  assets/img/artery-atheroma-gen.jpg   generated for this platform (three panels: healthy wall; atheroma; thrombus on a
  //                                       ruptured atheroma), unlabelled, reviewed. Panel rows (image px): 17–329, 351–667, 689–1008.
  //                                       Layers found by colour (panel 1, top wall): outer layer 20–32, middle layer 36–88,
  //                                       endothelium 91–100, lumen 101–249. Panel 2 at x 780: lumen 438–479, endothelium 483–491
  //                                       stretched over the atheroma 495–594. Panel 3: thrombus fills the lumen from the top
  //                                       endothelium (771) to the atheroma between x ≈ 600 and 1000; break in the endothelium x 750–785, y ≈ 857.
  //  assets/img/aorta-aneurysm-blausen.jpg Blausen 0001 (CC BY 3.0), cropped to x 60–370, y 60–480 and enlarged ×2.
  //  assets/img/mi-heart-blausen.jpg       Blausen 0463 (CC BY 3.0), title cropped off, its two English labels whitened; the
  //                                       two leader lines it kept are drawn over exactly by our own leaders.
  const IMGS = { artery: ["assets/img/artery-atheroma-gen.jpg", 1536, 1024], aneurysm: ["assets/img/aorta-aneurysm-blausen.jpg", 620, 840], mi: ["assets/img/mi-heart-blausen.jpg", 768, 910] };
  const PF = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", SUB = "#46566a";
  const esc1 = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const pOpen = (W, H, label, defs = "") => `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc1(label)}" font-family="${PF}" style="max-width:100%;height:auto"><defs>${defs}</defs><rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
  // part of a picture: source rectangle (sx, sy, sw, sh) drawn at (dx, dy) with scale k
  const pImg = (key, sx, sy, sw, sh, dx, dy, k = 1) => { const [href, w, h] = IMGS[key]; return `<svg x="${dx}" y="${dy}" width="${sw * k}" height="${sh * k}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none" overflow="hidden"><image href="${href}" x="0" y="0" width="${w}" height="${h}"/></svg>`; };
  const pLead = (pts, o = {}) => { const d = "M" + pts.map((p) => p.join(" ")).join(" L"); const [ex, ey] = pts[pts.length - 1]; const c = o.c || INK;
    return `<g pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="${o.cw || 8}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${o.w || 3}" stroke-linecap="round" stroke-linejoin="round"/>${o.dot === false ? "" : `<circle cx="${ex}" cy="${ey}" r="${o.r || 6}" fill="${c}" stroke="#fff" stroke-width="2"/>`}</g>`; };
  // lines: strings (first = 9610 term in bold, others secondary) or [text, "req" | "sup" | "head"]
  const pLab = (x, y, lines, o = {}) => { const s = o.s || 28, s2 = o.s2 || Math.round(s * 0.89), lh = o.lh || Math.round(s * 1.15);
    return `<g pointer-events="none">` + lines.map((l, i) => { const [t, k] = Array.isArray(l) ? l : [l, i ? "sup" : "req"]; const big = k !== "sup";
      return `<text x="${x}" y="${y + i * lh}" text-anchor="${o.a || "start"}" font-size="${k === "head" ? s + 4 : big ? s : s2}" font-weight="${big ? 800 : 500}" fill="${big ? (o.c || INK) : SUB}" stroke="#fff" stroke-width="${o.halo || 6}" stroke-linejoin="round" paint-order="stroke">${t}</text>`; }).join("") + "</g>"; };
  const pArrow = (d, c, id, o = {}) => `<g pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="${(o.w || 7) + 7}" stroke-linecap="round" stroke-opacity=".95"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${o.w || 7}" stroke-linecap="round" marker-end="url(#${id})"/></g>`;
  const pMark = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}" stroke="#fff" stroke-width="1" stroke-linejoin="round"/></marker>`;



  // d-3.2.7.1-4: atheroma (section) and an aortic aneurysm (Blausen). Image px ×2 of the source minus 60.
  const aneurysmPhoto = () => {
    const id = uid(); const W = 1080, H = 850;
    let s = pOpen(W, H, "Illustration of the chest and abdomen showing the heart, the aorta running down the abdomen beside the blue vena cava, and a balloon-like swelling of the abdominal aorta (an aneurysm) just above where it divides into the arteries to the legs. Red arrows show the pressure of the blood pushing the weakened wall outwards. Labels: heart; aorta, the largest artery; aneurysm, the wall weakened by atheroma balloons outwards under the pressure of the blood; it may burst, causing severe bleeding.", pMark("an" + id, OX));
    s += pImg("aneurysm", 0, 0, 620, 840, 0, 5);
    const L = (px, py, ty, lines) => pLead([[640, ty], [px, py]]) + pLab(652, ty + 10, lines, { s: 32, s2: 29, lh: 34 });
    s += L(400, 305, 300, ["Heart"]);
    s += L(326, 470, 450, ["Aorta", "the largest artery"]);
    s += L(358, 626, 600, ["Aneurysm", "a wall weakened by", "atheroma balloons", "outwards under the", "pressure of the blood"]);
    s += pLab(652, 800, [["It may burst: severe", "sup"], ["bleeding (haemorrhage)", "sup"]], { s: 32, s2: 29, lh: 34 });
    [[350, 585, 384, 553], [350, 668, 386, 700]].forEach(([x1, y1, x2, y2]) => { s += pArrow(`M${x1} ${y1} L${x2} ${y2}`, OX, "an" + id, { w: 6 }); });
    return flat(s.replace('style="max-width:100%;height:auto"', 'style="max-width:min(100%,470px);height:auto"') + "</svg>");
  };



  B.cvdArt = { uid, C, wallLong, wallCross, coronaryFig, miFigure, aneurysmPhoto, riskWeb, pscChart, iconArray, bars, townChart, bpChart, unalChart };
})(window.BIO);
