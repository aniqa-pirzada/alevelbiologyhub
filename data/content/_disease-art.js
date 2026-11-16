// Shared models and artwork for 3.2.1 The causes of disease: pathogens, lifestyle and genes (Phase 4 Batch 1, owned
// by the 3.2.1 author). Loaded before data/content/3.2.1.1.js, 3.2.1.2.js, data/consolidation/3.2.1.js and
// js/views/interactives-disease.js.
//
// B.diseaseModel (pure data and arithmetic, no DOM):
//  - REAL datasets, each with its source, year and URL. Every value was read from the source on 5 November 2026:
//      doll:   Doll R, Peto R, Boreham J, Sutherland I. Mortality in relation to smoking: 50 years' observations on male
//              British doctors. BMJ 2004;328:1519. Table 1: age-standardised mortality rate per 1000 men per year,
//              1951–2001, 34,439 men. Rates for lung cancer, ischaemic heart disease (IHD) and all causes.
//      peto:   Peto R, Darby S, Deo H, Silcocks P, Whitley E, Doll R. Smoking, smoking cessation, and lung cancer in the
//              UK since 1950. BMJ 2000;321:323. Cumulative risk (%) of death from lung cancer by age 75 for UK men, at
//              1990 rates, by age at stopping smoking (results section: 15.9, 9.9, 6.0, 3.0, 1.7).
//      interheart: Yusuf S and others. Effect of potentially modifiable risk factors associated with myocardial
//              infarction in 52 countries (the INTERHEART study): case-control study. Lancet 2004;364:937–952.
//              15,152 cases, 14,820 controls; odds ratios from the abstract (eight plotted; abdominal obesity described).
//      lewington: Prospective Studies Collaboration (Lewington S and others). Lancet 2002;360:1903–1913.
//      brown:  Brown KF and others. The fraction of cancer attributable to modifiable risk factors in England, Wales,
//              Scotland, Northern Ireland, and the United Kingdom in 2015. Br J Cancer 2018;118:1130–1141.
//      who:    WHO fact sheet "Cardiovascular diseases (CVDs)", 31 July 2025 (2022 data).
//      biobank: Bradbury KE, Murphy N, Key TJ. Diet and colorectal cancer in UK Biobank: a prospective study.
//              Int J Epidemiol (published online 17 April 2019); figures as reported by the University of Oxford and
//              UK Biobank news releases.
//      iarc:   IARC Monographs (October 2015) on red and processed meat, as quoted by UICC (30 October 2015).
//  - HYPOTHETICAL datasets (coffee confounding, sample size, gym cohort, salt ecological study, relative v absolute
//    risk illustration) are invented for teaching and are labelled HYPOTHETICAL wherever they appear.
//  - Arithmetic helpers: rate(), ratio(), pctChange(), pctOf(), fix(). Every value quoted in the questions is computed
//    with these and was checked by hand (3.2.1 author report).
// B.diseaseArt: original SVG drawings. Marker ids carry a uid() suffix so several copies on one page never share ids.
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ model ------------------------------------------------------------------
  const round = (x, dp = 2) => { const f = 10 ** dp; return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };
  const fix = (x, dp = 2) => round(x, dp).toFixed(dp);
  const rate = (cases, n, per = 1000) => (n ? (cases / n) * per : NaN);
  const ratio = (a, b) => a / b;
  const pctChange = (from, to) => ((to - from) / from) * 100;
  const pctOf = (part, whole) => (100 * part) / whole;

  const SRC = {
    doll: { cite: "Doll R, Peto R, Boreham J, Sutherland I. Mortality in relation to smoking: 50 years' observations on male British doctors. BMJ 2004; 328: 1519 (Table 1)", short: "Doll and others, BMJ, 2004", url: "https://doi.org/10.1136/bmj.38142.554479.AE" },
    peto: { cite: "Peto R, Darby S, Deo H, Silcocks P, Whitley E, Doll R. Smoking, smoking cessation, and lung cancer in the UK since 1950: combination of national statistics with two case-control studies. BMJ 2000; 321: 323", short: "Peto and others, BMJ, 2000", url: "https://www.bmj.com/content/321/7257/323" },
    interheart: { cite: "Yusuf S and others. Effect of potentially modifiable risk factors associated with myocardial infarction in 52 countries (the INTERHEART study): case-control study. Lancet 2004; 364: 937–952", short: "INTERHEART, Lancet, 2004", url: "https://pubmed.ncbi.nlm.nih.gov/15364185/" },
    lewington: { cite: "Prospective Studies Collaboration (Lewington S, Clarke R, Qizilbash N, Peto R, Collins R). Age-specific relevance of usual blood pressure to vascular mortality: a meta-analysis of individual data for one million adults in 61 prospective studies. Lancet 2002; 360: 1903–1913", short: "Prospective Studies Collaboration, Lancet, 2002", url: "https://researchonline.lshtm.ac.uk/id/eprint/11535" },
    brown: { cite: "Brown KF and others. The fraction of cancer attributable to modifiable risk factors in England, Wales, Scotland, Northern Ireland, and the United Kingdom in 2015. British Journal of Cancer 2018; 118: 1130–1141", short: "Brown and others, British Journal of Cancer, 2018", url: "https://doi.org/10.1038/s41416-018-0029-6" },
    who: { cite: "World Health Organization. Cardiovascular diseases (CVDs), fact sheet, 31 July 2025", short: "WHO fact sheet, 2025", url: "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)" },
    biobank: { cite: "Bradbury KE, Murphy N, Key TJ. Diet and colorectal cancer in UK Biobank: a prospective study. International Journal of Epidemiology (published online April 2019), as reported by the University of Oxford", short: "UK Biobank study, 2019", url: "https://www.ceu.ox.ac.uk/news/moderate-meat-eaters-at-risk-of-bowel-cancer" },
    iarc: { cite: "International Agency for Research on Cancer (IARC) evaluation of red and processed meat, October 2015, as explained by the Union for International Cancer Control (UICC), 30 October 2015", short: "IARC, 2015", url: "https://www.uicc.org/news/how-interpret-iarc-findings-red-and-processed-meat-cancer-risk-factors" },
  };

  // Doll et al. 2004, Table 1: age-standardised mortality per 1000 men per year, 1951–2001
  const DOLL = {
    n: 34439, period: "1951–2001", deaths: { lung: 1052, ihd: 7628, all: 25346 },
    rows: [
      { key: "never", label: "Lifelong non-smokers", lung: 0.17, ihd: 6.19, all: 19.38 },
      { key: "former", label: "Former cigarette smokers", lung: 0.68, ihd: 7.61, all: 24.15 },
      { key: "current", label: "Current cigarette smokers (all)", lung: 2.49, ihd: 10.01, all: 35.40 },
      { key: "c1", label: "Current: 1–14 a day", lung: 1.31, ihd: 9.10, all: 29.34 },
      { key: "c15", label: "Current: 15–24 a day", lung: 2.33, ihd: 10.07, all: 34.79 },
      { key: "c25", label: "Current: 25 or more a day", lung: 4.17, ihd: 11.11, all: 45.34 },
    ],
    survival: { cohort: "men born in the 1920s", ages: "35 to 70", smokers: 57, never: 85 },
  };
  const dollRow = (k) => DOLL.rows.find((r) => r.key === k);

  // Peto et al. 2000: cumulative risk (%) of death from lung cancer by age 75, UK men, 1990 rates
  const PETO = { rows: [
    { label: "Continued smoking", short: "Continued", risk: 15.9 },
    { label: "Stopped at about 60", short: "Stopped ~60", risk: 9.9 },
    { label: "Stopped at about 50", short: "Stopped ~50", risk: 6.0 },
    { label: "Stopped at about 40", short: "Stopped ~40", risk: 3.0 },
    { label: "Stopped at about 30", short: "Stopped ~30", risk: 1.7 },
  ], neverNote: "The paper's estimates for lifelong non-smokers are below 1 % (between about 0.2 % and 0.6 % for men, depending on the data used)." };

  // INTERHEART 2004 abstract: odds ratios for first acute myocardial infarction
  const INTERHEART = { cases: 15152, controls: 14820, countries: 52, rows: [
    // vs: the comparison group used when the interpreter explains each odds ratio.
    { label: "Blood lipids: ApoB/ApoA1 ratio, top v lowest fifth", or: 3.25, who: "people in the top fifth for this ratio", vs: "people in the lowest fifth" },
    { label: "Current smoking v never smoked", or: 2.87, who: "current smokers", vs: "people who had never smoked (former smokers are not part of this comparison)" },
    { label: "Psychosocial stress factors", or: 2.67, vs: "people without these stress factors" },
    { label: "Diabetes", or: 2.37, vs: "people without diabetes" },
    { label: "History of high blood pressure", or: 1.91, vs: "people with no history of high blood pressure" },
    { label: "Regular physical activity", or: 0.86, vs: "people who were not regularly active" },
    { label: "Regular alcohol intake", or: 0.91, vs: "people who did not drink alcohol regularly" },
    { label: "Daily fruit and vegetables", or: 0.70, vs: "people who did not eat fruit and vegetables every day" },
  ], combinedPAR: { men: 90, women: 94 },
  // The ninth factor, abdominal obesity, is reported for two comparisons of waist-to-hip ratio (middle and top thirds
  // against the lowest), so it is described in the text rather than plotted as a single odds ratio.
  unplotted: "The ninth factor, abdominal obesity (a high waist-to-hip ratio), was also associated with higher odds; it is reported for two comparisons rather than one, so it is not plotted." };

  const LEWINGTON = { adults: "one million", studies: 61, ihdDeaths: 34000, statement: "At ages 40–69, each 20 mm Hg higher usual systolic blood pressure (or about 10 mm Hg diastolic) was associated with about a twofold higher death rate from ischaemic heart disease, with no evidence of a threshold down to at least 115/75 mm Hg." };
  const BROWN = { year: 2015, all: 37.7, tobacco: 15.1, obesity: 6.3, uv: 3.8, occupation: 3.8, lungTobacco: 72.2 };
  const WHO = { deathsM: 19.8, year: 2022, pctGlobal: 32, pctAttackStroke: 85 };
  const BIOBANK = { people: "nearly half a million", ages: "40 to 69", years: "more than five years", cases: 2609, high: 76, low: 21, rr: 1.2 };
  const IARC = { per: 50, pct: 18 };

  // ---- HYPOTHETICAL datasets (invented for teaching) ----
  const COFFEE = { // a confounder that makes coffee look harmful
    strata: [
      { label: "Smokers", coffee: { n: 6000, cases: 54 }, none: { n: 2000, cases: 18 } },
      { label: "Non-smokers", coffee: { n: 2000, cases: 2 }, none: { n: 10000, cases: 10 } },
    ] };
  COFFEE.crude = { coffee: { n: 8000, cases: 56 }, none: { n: 12000, cases: 28 } };
  const SAMPLE = { // same question, two very different sample sizes
    small: { label: "Study S", active: { n: 25, cases: 2 }, inactive: { n: 25, cases: 4 } },
    large: { label: "Study L", active: { n: 12000, cases: 480 }, inactive: { n: 8000, cases: 520 } } };
  const GYM = { members: { n: 5000, cases: 60, smoke: 12 }, non: { n: 5000, cases: 100, smoke: 25 }, years: 10 };
  const SALT = [ // ecological: one point per (fictional) country
    { c: "Country A", salt: 6.5, chd: 95 }, { c: "Country B", salt: 7.8, chd: 120 }, { c: "Country C", salt: 8.6, chd: 150 },
    { c: "Country D", salt: 9.4, chd: 140 }, { c: "Country E", salt: 10.5, chd: 185 }, { c: "Country F", salt: 11.8, chd: 210 } ];
  const RELABS = { base: 50, rr: 1.18, per: 1000 }; // illustrative: 50 in 1000 baseline, a published relative risk of 1.18

  B.diseaseModel = { round, fix, rate, ratio, pctChange, pctOf, SRC, DOLL, dollRow, PETO, INTERHEART, LEWINGTON, BROWN, WHO, BIOBANK, IARC, COFFEE, SAMPLE, GYM, SALT, RELABS };

  // ------------------------------------------------------------------ art ------------------------------------------------------------------
  const uid = () => Math.random().toString(36).slice(2, 7);
  const INK = "#16263a", GREY = "#5f6f7f", BLUE = "#2f6fb0", AMBER = "#b07a1c", ROSE = "#b4504f", GREEN = "#4f7d62", TEAL = "#1f8a8a";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}>${s}</text>`;
  const arrowDef = (id, c = INK) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;

  // 1. A mammal's interfaces with the environment. opts.hot: zones are focusable buttons (Pathogen Entry Explorer);
  //    opts.numbers: text labels removed and numbered markers added (labelling question).
  //    Anatomical figure, anterior view, anatomical position (palms forward). The figure is drawn in its own units
  //    (an 8-head figure, 60 units per head, midline x = 190) and placed with FIG (scale 1.2); px/py below are the
  //    leader-line anchors already converted to viewBox units. Organ positions follow a standard anterior view: the
  //    right lung (viewer's left) has three lobes, the left lung two lobes and a cardiac notch; the left main bronchus is
  //    longer and more horizontal; the oesophagus lies behind the trachea and heart (dashed where hidden) and turns to the
  //    body's left to join the stomach under the left dome of the diaphragm; the colon frames the small intestine.
  //    Heart and liver are drawn faintly in grey for position only.
  const FIG = { s: 1.2, x: -60, y: -12 }, fx = (x) => +(FIG.s * x + FIG.x).toFixed(1), fy = (y) => +(FIG.s * y + FIG.y).toFixed(1);
  const ZONES = {
    gas: { name: "Gas-exchange system", sub: "nose, mouth, trachea, bronchi, alveoli", c: BLUE, lx: 330, ly: 130, px: fx(228), py: fy(132) },
    dig: { name: "Digestive system", sub: "mouth, oesophagus, stomach, intestines", c: AMBER, lx: 330, ly: 238, px: fx(214), py: fy(198) },
    rep: { name: "Reproductive system", sub: "e.g. vagina, cervix, penis, urethra", c: ROSE, lx: 330, ly: 352, px: fx(190), py: fy(251) },
    skin: { name: "Skin (when broken)", sub: "cuts, bites, burns, needles", c: GREEN, lx: 330, ly: 478, px: fx(231), py: fy(378) },
  };
  const INTERFACE_NOTES = ["Schematic; organs simplified and not to scale.", "Dashed: oesophagus where it passes behind.", "Grey outlines: heart and liver, for position."];
  function interfacesFig(opts = {}) {
    const id = uid();
    const LINE = "#8f7d6b"; // skin outline
    const mir = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${+(380 - x).toFixed(1)} ${y}`); // mirror about the midline
    const tube = (d, c, w, f, wi, extra = "") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/><path d="${d}" fill="none" stroke="${f}" stroke-width="${wi}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
    // ---- body surface (skin): outline drawn under the fills, so overlapping parts merge into one silhouette ----
    const HEAD = "M190 20 C209 20 215 34 214 49 C214 60 211 69 206 75 C201 81 196 84 190 84 C184 84 179 81 174 75 C169 69 166 60 166 49 C165 34 171 20 190 20 Z";
    const NECK = "M180 70 L200 70 C200 80 201 88 203 97 L177 97 C179 88 180 80 180 70 Z";
    const TORSO = "M201 92 C203 100 213 103 226 105 C238 107 248 110 252 120 C256 130 254 142 246 150 C242 168 234 186 232 200 C232 216 238 232 239 250 C240 262 233 270 222 272 L158 272 C147 270 140 262 141 250 C142 232 148 216 148 200 C146 186 138 168 134 150 C126 142 124 130 128 120 C132 110 142 107 154 105 C167 103 177 100 179 92 Z";
    const ARM = "M245 114 C255 114 260 126 259 142 L264 204 C266 214 270 226 273 240 L281 282 L268 285 L259 244 C254 232 251 220 250 208 L240 154 C238 140 238 120 245 114 Z";
    const HAND = "M268 284 C264 293 263 303 264 312 C265 322 268 331 273 336 C277 340 283 339 285 333 C287 326 288 318 287 310 C290 314 292 318 294 318 C296 317 295 311 293 305 C291 298 287 290 282 282 Z";
    const LEG = "M239 248 C242 280 237 330 231 372 C229 388 233 404 230 432 C228 452 222 468 221 476 C222 480 221.5 484 220.5 487 C226 493 232 499 232 504 C232 508 227 509 215 509 L204 509 C200 508 199 498 200.5 489 C200 485 200 480 201 476 C199 462 197 448 196 430 C194 410 197 390 198 372 C196 330 194 296 190 268 L190 252 Z";
    const EAR = "M214 46 C219 45 220 52 219 57 C218 62 216 64 213 63 Z";
    const trunk = [HEAD, NECK, TORSO, LEG, mir(LEG), EAR, mir(EAR)], limbs = [ARM, mir(ARM), HAND, mir(HAND)];
    const P = (d, a) => `<path d="${d}" ${a}/>`;
    const defs = `<defs>
      <linearGradient id="sk-${id}" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="260" y2="0"><stop offset="0" stop-color="#ddcdbd"/><stop offset=".2" stop-color="#ebe1d5"/><stop offset=".5" stop-color="#f5efe8"/><stop offset=".8" stop-color="#ebe1d5"/><stop offset="1" stop-color="#ddcdbd"/></linearGradient>
      <linearGradient id="sa-${id}"><stop offset="0" stop-color="#e2d4c5"/><stop offset=".45" stop-color="#f1e9e0"/><stop offset="1" stop-color="#dccbba"/></linearGradient>
      <radialGradient id="lu-${id}" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#e9f1f9"/><stop offset="1" stop-color="#c3d6ea"/></radialGradient>
      <linearGradient id="st-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7ead0"/><stop offset="1" stop-color="#e8cb98"/></linearGradient>
      <mask id="mk-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="520"><rect width="400" height="520" fill="#fff"/>
        <path d="M184.5 87 L195.5 87 L195.5 133 L184.5 133 Z" fill="#000"/><path d="M188 132 L176 147 M192 132 C198 138 204 142 212 149" stroke="#000" stroke-width="9" fill="none"/>
        <path d="M184 154 C186 146 198 144 208 150 C218 156 224 172 218 186 C208 190 192 186 184 178 C178 172 180 162 184 154 Z" fill="#000"/></mask></defs>`;
    const body = `<g>${[...trunk, ...limbs].map((d) => P(d, `fill="${LINE}" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"`)).join("")}
      ${trunk.map((d) => P(d, `fill="url(#sk-${id})"`)).join("")}${limbs.map((d) => P(d, `fill="url(#sa-${id})"`)).join("")}
      <g fill="none" stroke="${LINE}" stroke-width=".9" stroke-linecap="round" opacity=".55">
        ${["M271 319 L273 334", "M276 320 L278 337", "M281 319 L282 335", "M287 306 C286 300 284 294 281 290"].map((d) => `<path d="${d}"/><path d="${mir(d)}"/>`).join("")}
        <path d="M152 111 C162 107 176 111 186 107"/><path d="${mir("M152 111 C162 107 176 111 186 107")}"/>
        <path d="M184 76 C188 78 192 78 196 76"/></g>
      <g fill="#ece3d8" stroke="#bfae9b" stroke-width=".9" opacity=".9">
        <path d="M147 196 C154 188 172 186 192 190 C204 192 212 194 214 198 C206 204 190 210 176 214 C162 218 150 214 147 206 C145 202 145 199 147 196 Z"/>
        <path d="M184 154 C186 146 198 144 208 150 C218 156 224 172 218 186 C208 190 192 186 184 178 C178 172 180 162 184 154 Z" fill="#efe2df" stroke="#c4aaa6"/></g>
      <path d="M145 193 C160 181 180 182 190 189 C200 183 220 181 235 195" fill="none" stroke="#bfae9b" stroke-width=".9" stroke-dasharray="3 2" opacity=".8"/></g>`;
    const bronchTree = `<g fill="none" stroke="${BLUE}" stroke-linecap="round" opacity=".85"><g stroke-width="1.7">
        <path d="M176 147 C171 140 167 132 163 122"/><path d="M176 147 C173 158 169 168 163 178"/><path d="M204 143 C214 136 220 128 224 120"/><path d="M212 149 C218 160 222 170 226 180"/></g>
        <g stroke-width="1.1"><path d="M169 164 L155 171"/><path d="M172 157 L179 175"/><path d="M167 134 L156 136"/><path d="M219 164 L229 169"/><path d="M217 132 L228 138"/><path d="M215 156 L208 176"/></g></g>
      <g fill="${BLUE}" opacity=".45">${[[163, 121], [224, 119], [163, 179], [226, 181], [154, 171], [230, 169], [155, 136], [229, 138], [179, 176], [208, 177]].map(([x, y]) => `<circle cx="${x - 1.6}" cy="${y}" r="1.5"/><circle cx="${x + 1.6}" cy="${y}" r="1.5"/><circle cx="${x}" cy="${y - 2.2}" r="1.5"/>`).join("")}</g>`;
    const organ = {
      gas: `${tube("M190 52 L190 90", BLUE, 9, "#dde8f3", 7)}
        <path d="M190 41 C184 45 181 53 182 62 L198 62 C199 53 196 45 190 41 Z" fill="#dde8f3" stroke="${BLUE}" stroke-width="1.3"/><path d="M190 43 L190 62" stroke="${BLUE}" stroke-width="1"/>
        <path d="M162 104 C153 106 146 122 145 140 C144 160 144 176 146 188 C152 185 166 182 182 186 C184 172 184 150 182 128 C180 114 172 104 162 104 Z" fill="url(#lu-${id})" stroke="${BLUE}" stroke-width="1.5"/>
        <path d="M218 104 C229 106 235 122 236 140 C237 158 237 174 235 188 C228 186 218 186 208 190 C206 185 208 181 212 177 C204 175 200 166 202 154 C200 140 200 124 202 116 C206 108 212 104 218 104 Z" fill="url(#lu-${id})" stroke="${BLUE}" stroke-width="1.5"/>
        <g fill="none" stroke="${BLUE}" stroke-width=".9" opacity=".7"><path d="M180 149 C168 151 156 153 145 156"/><path d="M145 158 C154 166 161 176 165 186"/><path d="M236 138 C229 154 219 170 215 187"/></g>
        ${bronchTree}
        <path d="M184 87 L196 87 L195.5 97 L184.5 97 Z" fill="#d3e2f1" stroke="${BLUE}" stroke-width="1.2"/>
        <rect x="185.5" y="96" width="9" height="37" rx="2" fill="#dde8f3" stroke="${BLUE}" stroke-width="1.2"/>
        <g stroke="${BLUE}" stroke-width=".8" opacity=".75">${[100, 104.5, 109, 113.5, 118, 122.5, 127].map((y) => `<path d="M186.5 ${y} L193.5 ${y}"/>`).join("")}</g>
        ${tube("M188 132 C184 137 180 142 176 147", BLUE, 6.4, "#dde8f3", 4.2)}${tube("M192 132 C198 138 204 142 212 149", BLUE, 5.4, "#dde8f3", 3.3)}`,
      dig: `${tube("M191 217 C184 217 179 222 179 228 C179 234 186 236 194 234", AMBER, 5.5, "#f3e2c0", 3.6)}
        ${tube("M194 234 C206 230 218 234 214 240 C210 246 196 238 184 240 C172 242 168 248 176 250 C186 252 202 244 212 250 C219 255 210 260 198 258 C186 256 176 258 170 256 C166 255 163 253 161 251", AMBER, 6, "#f5e6c9", 4)}
        ${tube("M160 258 C163 262 165 264 169 265", AMBER, 3, "#ecd3a6", 1.6)}<circle cx="157" cy="253" r="6.2" fill="#ecd3a6" stroke="${AMBER}" stroke-width="1"/>
        ${tube("M156 254 L156 217 C156 213 159 211 163 212 C178 222 202 225 219 211 C222 207 225 207 225 212 L225 245 C225 255 212 252 204 255 C197 257 193 260 191 267", AMBER, 10, "#ecd3a6", 8)}
        <path d="M156 254 L156 217 C156 213 159 211 163 212 C178 222 202 225 219 211 C222 207 225 207 225 212 L225 245" fill="none" stroke="${AMBER}" stroke-width="8" stroke-dasharray="1.1 4.5" opacity=".4"/>
        <path d="M193 88 C194 110 195 140 196 160 C197 176 200 186 204 193" fill="none" stroke="${AMBER}" stroke-width="6" stroke-dasharray="4 3" opacity=".45"/>
        <g mask="url(#mk-${id})">${tube("M193 88 C194 110 195 140 196 160 C197 176 200 186 204 193", AMBER, 7, "#f3e2c0", 5)}</g>
        <path d="M203 194 C204 186 210 182 216 184 C223 186 226 195 225 205 C224 215 219 222 210 224 C203 225 196 224 190 220 L191 214 C196 216 202 215 205 210 C208 205 207 199 204 196 Z" fill="url(#st-${id})" stroke="${AMBER}" stroke-width="1.4" stroke-linejoin="round"/>
        <g fill="none" stroke="${AMBER}" stroke-width=".7" opacity=".55"><path d="M212 192 C217 198 219 206 216 214"/><path d="M208 202 C213 208 213 214 208 219"/></g>
        <path d="M181 69 C184 66 196 66 199 69 C196 73 184 73 181 69 Z" fill="#f3dcc0" stroke="${AMBER}" stroke-width="1.2"/>`,
      rep: `${tube("M190 252 L190 266", ROSE, 4.4, "#f2d6d4", 2.6)}<ellipse cx="190" cy="249" rx="6.5" ry="5" fill="#f2d6d4" stroke="${ROSE}" stroke-width="1.3"/>
        <circle cx="190" cy="267.5" r="1.8" fill="#fff" stroke="${ROSE}" stroke-width="1.1"/>`,
      skin: `<g transform="translate(231 378) rotate(35)"><path d="M0 0 L17 0" stroke="#6e7c89" stroke-width="1.1"/><rect x="16" y="-2.2" width="4.5" height="4.4" fill="#cfd8df" stroke="#6e7c89" stroke-width=".8"/>
          <rect x="20.5" y="-3.6" width="22" height="7.2" rx="1" fill="#eef3f6" stroke="#6e7c89" stroke-width=".9"/><rect x="21.5" y="-2.6" width="10" height="5.2" fill="#d7e6dc"/>
          <g stroke="#6e7c89" stroke-width=".6">${[25, 29, 33, 37].map((x) => `<path d="M${x} -3.6 L${x} -1.6"/>`).join("")}</g><path d="M42.5 0 L51 0" stroke="#6e7c89" stroke-width="1.6"/><rect x="51" y="-4.5" width="2" height="9" fill="#6e7c89"/></g>
        <path d="M211 419 C214 421 219 424 223 428 C219 427 214 424 211 419 Z" fill="#9c4a42" stroke="#7a3530" stroke-width=".6"/>
        <g fill="none" stroke="${GREEN}" stroke-width="1.2" stroke-dasharray="2.5 2"><circle cx="231" cy="378" r="6.5"/><circle cx="217" cy="423.5" r="9"/></g>`,
    };
    const F = (k) => `<g transform="translate(${FIG.x} ${FIG.y}) scale(${FIG.s})">${organ[k]}</g>`;
    // Hot (Explorer) labels are larger and the detail wraps onto two lines, so they stay legible when the diagram is
    // scaled down to fit a 390 px screen. The static figure uses the same layout slightly smaller.
    const subLines = (s) => { const p = s.split(", "), h = Math.ceil(p.length / 2); return [p.slice(0, h).join(", ") + (p.length > 1 ? "," : ""), p.slice(h).join(", ")]; };
    const lead = (z, y2) => `<line x1="${z.px}" y1="${z.py}" x2="${z.lx - 6}" y2="${y2}" stroke="${z.c}" stroke-width="1.6"/><circle cx="${z.px}" cy="${z.py}" r="3.6" fill="${z.c}" stroke="#fff" stroke-width="1.2"/>`;
    const textLabel = (z, big) => { const [a, b2] = subLines(z.sub), s1 = big ? 23 : 21, s2 = big ? 17 : 16, g = big ? 19 : 18;
      return `${lead(z, z.ly - 10)}${T(z.lx, z.ly - 4, z.name, { a: "start", s: s1, w: 700, c: z.c })}${T(z.lx, z.ly + g - 1, a, { a: "start", s: s2, c: GREY })}${b2 ? T(z.lx, z.ly + 2 * g - 1, b2, { a: "start", s: s2, c: GREY }) : ""}`; };
    const num = (z, n) => `<line x1="${z.px}" y1="${z.py}" x2="${z.lx}" y2="${z.ly - 4}" stroke="${INK}" stroke-width="1.5"/><circle cx="${z.px}" cy="${z.py}" r="3.6" fill="${INK}" stroke="#fff" stroke-width="1.2"/><circle cx="${z.lx + 14}" cy="${z.ly - 4}" r="14" fill="#1e3a5f"/>${T(z.lx + 14, z.ly + 1, String(n), { s: 15, w: 700, c: "#fff" })}`;
    const keys = opts.keys || ["gas", "dig", "rep", "skin"];
    const zones = keys.map((k, i) => { const z = ZONES[k]; const inner = F(k) + (opts.numbers ? num(z, i + 1) : textLabel(z, opts.hot));
      return opts.hot ? `<g data-zone="${k}" tabindex="0" role="button" aria-label="${z.name}: ${z.sub}" class="dis-zone" style="cursor:pointer">${inner}<rect x="${z.lx - 4}" y="${z.ly - 26}" width="306" height="70" fill="transparent"/></g>` : `<g>${inner}</g>`; }).join("");
    // The hot (Explorer) version contains focusable buttons, so it is a labelled group, not an image (children of
    // role="img" are hidden from assistive technology).
    const role = opts.hot ? 'role="group" aria-label="Body diagram: choose an interface with the environment"' : 'role="img" aria-label="Front view of a human body. Blue: nasal cavity, pharynx, trachea, bronchi and lungs (gas-exchange system). Amber: mouth, oesophagus passing behind the trachea and heart, stomach on the body\'s left, small and large intestine (digestive system). Rose: the reproductive tract opening in the pelvis. Green: a needle entering the skin of the thigh and a cut on the shin (skin when broken)."';
    // opts.notes === false (the Pathogen Entry Explorer): the three notes are shown as HTML text under the drawing instead
    const notes = opts.numbers || opts.notes === false ? "" : INTERFACE_NOTES.map((n, i) => T(330, 572 + 18 * i, n, { a: "start", s: 13, c: GREY })).join("");
    return `<svg viewBox="0 0 640 620" width="640" ${role} style="max-width:100%;height:auto" data-fig="${id}">
      ${defs}<rect width="640" height="620" fill="#fff"/><g transform="translate(${FIG.x} ${FIG.y}) scale(${FIG.s})">${body}</g>${zones}${notes}</svg>`;
  }

  // 2. Bacterium and virus compared (schematic, not to scale)
  function pathogenCompareFig() {
    const id = uid();
    const lab = (x1, y1, x2, y2, s, a = "start") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GREY}" stroke-width="1.2"/>${T(a === "start" ? x2 + 4 : x2 - 4, y2 + 4, s, { a, s: 11.5 })}`;
    const bact = `<g><path d="M60 190 C60 150 85 140 120 140 L230 140 C265 140 290 150 290 190 C290 230 265 240 230 240 L120 240 C85 240 60 230 60 190 Z" fill="#e8f2ea" stroke="${GREEN}" stroke-width="5"/>
      <path d="M70 190 C70 156 92 150 122 150 L228 150 C258 150 280 156 280 190 C280 224 258 230 228 230 L122 230 C92 230 70 224 70 190 Z" fill="none" stroke="${TEAL}" stroke-width="2"/>
      <path d="M140 172 C120 160 120 210 150 205 C185 200 165 165 200 175 C230 182 215 215 185 210 C160 206 165 180 140 172 Z" fill="none" stroke="#8a4fb0" stroke-width="2.5"/>
      <circle cx="245" cy="210" r="9" fill="none" stroke="#8a4fb0" stroke-width="2"/>
      ${[[100, 170], [110, 205], [128, 222], [215, 160], [235, 175], [255, 190], [175, 222], [95, 188]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/>`).join("")}
      <path d="M290 190 C305 175 318 205 333 190 C348 175 360 205 372 192" stroke="${GREY}" stroke-width="2" fill="none"/></g>`;
    const vir = `<g><circle cx="545" cy="190" r="70" fill="none" stroke="${ROSE}" stroke-width="2" stroke-dasharray="6 4"/>
      <polygon points="545,138 590,164 590,216 545,242 500,216 500,164" fill="#f6e1dd" stroke="${ROSE}" stroke-width="3"/>
      <path d="M520 180 C535 160 545 205 560 185 C572 170 578 200 566 210 C552 222 530 205 520 200" fill="none" stroke="#8a4fb0" stroke-width="2.5"/>
      ${Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * 2 * Math.PI; const x1 = 545 + 70 * Math.cos(a), y1 = 190 + 70 * Math.sin(a), x2 = 545 + 84 * Math.cos(a), y2 = 190 + 84 * Math.sin(a); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${ROSE}" stroke-width="3"/><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="4" fill="${ROSE}"/>`; }).join("")}</g>`;
    return `<svg viewBox="0 0 720 340" width="720" role="img" aria-label="A rod-shaped bacterium and a virus particle compared, with their main parts labelled" style="max-width:100%;height:auto" data-fig="${id}">
      <rect width="720" height="340" fill="#fff"/>
      ${T(175, 26, "A bacterium (a prokaryotic cell)", { s: 15, w: 700, c: GREEN })}${T(545, 26, "A virus particle (not a cell)", { s: 15, w: 700, c: ROSE })}
      ${bact}${vir}
      ${lab(120, 142, 60, 70, "cell wall", "end")}${lab(160, 150, 160, 70, "cell-surface membrane")}${lab(150, 205, 90, 296, "circular DNA (free in cytoplasm)")}${lab(245, 201, 262, 96, "plasmid (some)")}${lab(110, 205, 40, 260, "ribosomes", "start")}${lab(352, 192, 356, 246, "flagellum (some)")}
      ${lab(500, 180, 430, 124, "capsid (protein coat)", "end")}<line x1="555" y1="200" x2="555" y2="292" stroke="${GREY}" stroke-width="1.2"/>${T(555, 306, "genetic material: DNA or RNA", { s: 11.5 })}<line x1="614.5" y1="136.9" x2="640" y2="74" stroke="${GREY}" stroke-width="1.2"/>${T(712, 66, "attachment proteins", { s: 11.5, a: "end" })}${lab(495, 240, 474, 272, "envelope (some viruses only)", "end")}
      ${T(360, 330, "Not to scale. A typical bacterium is about 0.5 to 5 µm long; most viruses are about 20–300 nm across.", { s: 11.5, c: GREY })}</svg>`;
  }

  // 3. Two ways pathogens cause disease
  function mechanismsFig() {
    const id = uid(), m = `ar-${id}`;
    const cell = (x, y, burst) => burst ? `<path d="M${x - 40} ${y} q10 -36 40 -38 l6 10 l8 -12 q24 6 26 34 l-10 4 l10 8 q-4 30 -34 34 l-4 -10 l-8 10 q-30 -6 -34 -30 z" fill="#fbeee7" stroke="${ROSE}" stroke-width="2" stroke-dasharray="5 3"/>` : `<ellipse cx="${x}" cy="${y}" rx="44" ry="38" fill="#fbeee7" stroke="${ROSE}" stroke-width="2"/><ellipse cx="${x + 8}" cy="${y + 4}" rx="12" ry="10" fill="#f0d2cb" stroke="${ROSE}"/>`;
    const vp = (x, y) => `<polygon points="${x},${y - 6} ${x + 5},${y - 3} ${x + 5},${y + 3} ${x},${y + 6} ${x - 5},${y + 3} ${x - 5},${y - 3}" fill="${ROSE}"/>`;
    const a = `${cell(70, 120)}${vp(30, 72)}<line x1="34" y1="78" x2="44" y2="92" stroke="${INK}" stroke-width="1.6" marker-end="url(#${m})"/>${T(70, 178, "1. Virus attaches", { s: 11 })}${T(70, 192, "and enters", { s: 11 })}
      <line x1="122" y1="120" x2="146" y2="120" stroke="${INK}" stroke-width="2" marker-end="url(#${m})"/>
      ${cell(196, 120)}${[[180, 108], [198, 98], [212, 112], [186, 132], [204, 136], [222, 128], [172, 122]].map(([x, y]) => vp(x, y)).join("")}${T(196, 178, "2. Host cell makes", { s: 11 })}${T(196, 192, "new virus particles", { s: 11 })}
      <line x1="248" y1="120" x2="272" y2="120" stroke="${INK}" stroke-width="2" marker-end="url(#${m})"/>
      ${cell(322, 120, true)}${[[296, 76], [348, 74], [368, 128], [280, 146], [364, 154], [372, 98]].map(([x, y]) => vp(x, y)).join("")}${T(322, 178, "3. Cell bursts (lysis):", { s: 11 })}${T(322, 192, "it dies; viruses released", { s: 11 })}`;
    const b = `<rect x="420" y="70" width="280" height="40" fill="#eef4fa" stroke="none"/>${T(610, 64, "lumen of the small intestine", { s: 10.5, c: GREY })}
      <rect x="442" y="78" width="40" height="18" rx="9" fill="#e8f2ea" stroke="${GREEN}" stroke-width="2"/>${T(462, 72, "bacterium", { s: 10.5, c: GREEN })}
      ${[[498, 90], [512, 98], [526, 92], [540, 102], [556, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#8a4fb0"/>`).join("")}${T(600, 92, "toxin", { s: 11, w: 700, c: "#8a4fb0", a: "start" })}
      ${[0, 1, 2, 3, 4].map((k) => `<rect x="${430 + k * 54}" y="112" width="50" height="62" rx="4" fill="#fbeee7" stroke="${ROSE}" stroke-width="2"/>`).join("")}
      <circle cx="577" cy="120" r="4" fill="#8a4fb0"/>
      <line x1="548" y1="166" x2="548" y2="96" stroke="${TEAL}" stroke-width="2.4" marker-end="url(#${m})"/>${T(555, 146, "Cl⁻", { s: 12.5, w: 700, c: TEAL, a: "start" })}${T(555, 161, "out", { s: 12.5, w: 700, c: TEAL, a: "start" })}
      ${T(560, 194, "The toxin alters what epithelial cells do", { s: 11 })}${T(560, 208, "(e.g. cholera toxin: more Cl⁻ secreted, water", { s: 11 })}${T(560, 222, "follows, diarrhoea); the cells are not destroyed", { s: 11 })}`;
    return `<svg viewBox="0 0 720 290" width="720" role="img" aria-label="Two panels. Left: a virus enters a host cell, the cell makes new virus particles and then bursts, releasing them. Right: a bacterium in the intestine releases toxin molecules that bind to epithelial cells and change their function." style="max-width:100%;height:auto" data-fig="${id}">
      <defs>${arrowDef(m)}</defs><rect width="720" height="290" fill="#fff"/>
      ${T(200, 28, "A. Damaging host cells (example: a lytic virus)", { s: 14, w: 700, c: ROSE })}${T(560, 28, "B. Producing toxins (example: cholera)", { s: 14, w: 700, c: "#8a4fb0" })}
      <line x1="400" y1="40" x2="400" y2="240" stroke="#d5dde3" stroke-width="1.5"/>${a}${b}
      ${T(360, 262, "Many pathogens do more than one of these, and some damage is caused by the host's own immune response.", { s: 11.5, c: GREY })}
      ${T(360, 280, "Not every virus bursts its host cell: some (e.g. HIV, 3.2.4) leave by budding from the membrane.", { s: 11.5, c: GREY })}</svg>`;
  }

  // 4. Risk factors for CHD and cancer (main associations; a simplification)
  function riskWebFig() {
    // Release review (R6-42, teacher example 10): headings sit above the ovals as plain titles; the ovals are larger so
    // every list item is at least 16 px inside the outlines; all text 13 px or more at its natural width (760 px).
    // Geometry checked by hand: left-only list x 75–205, overlap list x 307–453, right-only list x 535–705, y 160–280.
    const id = uid();
    const list = (x, y, items, c) => items.map((s, i) => T(x, y + i * 20, s, { s: 13, c: s.endsWith("*") ? GREY : c, it: s.endsWith("*") })).join("");
    return `<svg viewBox="0 0 760 420" width="760" role="img" aria-label="Two overlapping ovals. Left, coronary heart disease only: high blood pressure, high blood cholesterol, diabetes, male sex. Overlap, both: smoking, unhealthy diet, overweight and obesity, physical inactivity, excess alcohol, increasing age, inherited factors. Right, cancer only: UV radiation, some infections, ionising radiation, some workplace chemicals." style="max-width:100%;min-width:700px;height:auto" data-fig="${id}">
      <rect width="760" height="420" fill="#fff"/>
      ${T(140, 40, "Coronary heart disease", { s: 15, w: 700, c: ROSE })}${T(380, 40, "Both", { s: 15, w: 700 })}${T(620, 40, "Cancers", { s: 15, w: 700, c: BLUE })}
      <path d="M140 48 L140 62 M380 48 L380 62 M620 48 L620 62" stroke="#c3ccd3" stroke-width="1.5"/>
      <ellipse cx="270" cy="220" rx="250" ry="150" fill="${ROSE}" fill-opacity=".08" stroke="${ROSE}" stroke-width="2"/>
      <ellipse cx="490" cy="220" rx="250" ry="150" fill="${BLUE}" fill-opacity=".08" stroke="${BLUE}" stroke-width="2"/>
      ${list(140, 190, ["high blood pressure", "high LDL cholesterol", "diabetes", "being male*"], ROSE)}
      ${list(380, 160, ["smoking", "unhealthy diet", "overweight and obesity", "physical inactivity", "excess alcohol", "increasing age*", "inherited factors*"], INK)}
      ${list(620, 190, ["UV radiation (skin)", "some infections (e.g. HPV)", "ionising radiation", "some workplace chemicals"], BLUE)}
      ${T(380, 394, "* not modifiable. Main associations only: e.g. diabetes is also linked with some cancers, and alcohol raises blood pressure.", { s: 12, c: GREY })}
      ${T(380, 412, "Each disease has many risk factors; a risk factor increases the probability of disease, it does not make it certain.", { s: 12, c: GREY })}</svg>`;
  }


  // 5. Generic bar chart (single series) with value labels; cats may contain "|" for a second line
  function barChart(o) {
    const id = uid(); const W = o.width || 640, H = o.height || 320, L = 66, R = 18, Tp = 46, Bt = 70;
    const n = o.vals.length, pw = W - L - R, ph = H - Tp - Bt, bw = (pw / n) * 0.62;
    let max = o.max, ticks = o.ticks;
    if (!max) { const raw = Math.max(...o.vals, 1e-9) * 1.12, mag = 10 ** Math.floor(Math.log10(raw / 5)); const step = [1, 2, 2.5, 5, 10].find((k) => k * mag * 5 >= raw) * mag; max = step * Math.ceil(raw / step - 1e-9); ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, k) => +(k * step).toFixed(6)); }
    ticks = ticks || [0, max / 4, max / 2, (3 * max) / 4, max];
    const y = (v) => Tp + ph - (v / max) * ph;
    const grid = ticks.map((t) => `<line x1="${L}" y1="${y(t)}" x2="${W - R}" y2="${y(t)}" stroke="#e3e8ec"/>${T(L - 8, y(t) + 4, String(+t.toFixed(2)), { a: "end", s: 11, c: GREY })}`).join("");
    const bars = o.vals.map((v, i) => { const cx = L + (pw / n) * (i + 0.5); const c = (o.colors && o.colors[i]) || o.color || TEAL; const lines = String(o.cats[i]).split("|");
      return `<rect x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${Tp + ph - y(v)}" fill="${c}" rx="3"/>${T(cx, y(v) - 6, o.fmt ? o.fmt(v) : String(v), { s: 12, w: 700 })}${lines.map((s, k) => T(cx, Tp + ph + 18 + k * 14, s, { s: 11 })).join("")}`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${o.alt || o.title}" style="max-width:100%;height:auto" data-fig="${id}"><rect width="${W}" height="${H}" fill="#fff"/>
      ${T(W / 2, 22, o.title, { s: 14, w: 700 })}${o.sub ? T(W / 2, 38, o.sub, { s: 11, c: GREY }) : ""}${grid}
      <line x1="${L}" y1="${Tp}" x2="${L}" y2="${Tp + ph}" stroke="${INK}"/><line x1="${L}" y1="${Tp + ph}" x2="${W - R}" y2="${Tp + ph}" stroke="${INK}"/>
      <text transform="translate(16 ${Tp + ph / 2}) rotate(-90)" text-anchor="middle" font-size="11.5" fill="${INK}">${o.yLabel}</text>${bars}</svg>`;
  }
  const dollChart = (key) => { const D = DOLL; const rows = D.rows; const isLung = key === "lung";
    return barChart({ title: isLung ? "Lung cancer death rate by smoking habit" : "Ischaemic heart disease death rate by smoking habit", sub: "Male British doctors, 1951–2001; age-standardised (Doll and others, BMJ, 2004, Table 1)", vals: rows.map((r) => r[key]), cats: ["Lifelong|non-smokers", "Former|smokers", "Current|(all)", "Current|1–14 a day", "Current|15–24 a day", "Current|25+ a day"], colors: ["#7fa7c9", "#9bb8a4", ROSE, "#d99a8f", "#c4766b", "#8f3a30"], max: isLung ? 5 : 12, ticks: isLung ? [0, 1, 2, 3, 4, 5] : [0, 2, 4, 6, 8, 10, 12], yLabel: "deaths per 1000 men per year", fmt: (v) => v.toFixed(2), alt: `Bar chart of ${isLung ? "lung cancer" : "ischaemic heart disease"} deaths per 1000 men per year: ${rows.map((r) => `${r.label} ${r[key]}`).join("; ")}.` }); };
  const petoChart = () => barChart({ title: "Stopping smoking and the risk of dying from lung cancer", sub: "UK men: cumulative risk (%) of death from lung cancer by age 75, at 1990 rates (Peto and others, BMJ, 2000)", vals: PETO.rows.map((r) => r.risk), cats: ["Continued|smoking", "Stopped at|about 60", "Stopped at|about 50", "Stopped at|about 40", "Stopped at|about 30"], colors: ["#8f3a30", "#c4766b", "#d99a8f", "#9bb8a4", "#7fa7c9"], max: 18, ticks: [0, 3, 6, 9, 12, 15, 18], yLabel: "cumulative risk by age 75 (%)", fmt: (v) => v.toFixed(1) + " %", alt: `Bar chart: ${PETO.rows.map((r) => `${r.label} ${r.risk.toFixed(1)} %`).join("; ")}. Lifelong non-smokers below 1 %.` });

  // 6. Odds ratio chart (INTERHEART)
  function orChart() {
    const id = uid(); const W = 680, rows = INTERHEART.rows, H = 70 + rows.length * 34, L = 300, R = 30, max = 3.5;
    const x = (v) => L + (v / max) * (W - L - R);
    const ticks = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((t) => `<line x1="${x(t)}" y1="44" x2="${x(t)}" y2="${H - 26}" stroke="#eef1f4"/>${T(x(t), H - 10, String(t), { s: 11, c: GREY })}`).join("");
    const pts = rows.map((r, i) => { const yy = 62 + i * 34; const c = r.or > 1 ? ROSE : GREEN; return `${T(L - 12, yy + 4, r.label, { a: "end", s: 12 })}<line x1="${x(1)}" y1="${yy}" x2="${x(r.or)}" y2="${yy}" stroke="${c}" stroke-width="3"/><circle cx="${x(r.or)}" cy="${yy}" r="7" fill="${c}"/>${T(x(r.or) + (r.or > 1 ? 14 : -14), yy + 4, r.or.toFixed(2), { a: r.or > 1 ? "start" : "end", s: 12, w: 700, c })}`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Odds ratios for a first heart attack from the INTERHEART study: ${rows.map((r) => `${r.label} ${r.or}`).join("; ")}. A vertical line marks an odds ratio of 1." style="max-width:100%;height:auto" data-fig="${id}"><rect width="${W}" height="${H}" fill="#fff"/>
      ${T(W / 2, 20, "Odds ratios for a first heart attack (INTERHEART, Lancet, 2004)", { s: 14, w: 700 })}${T(W / 2, 36, `${INTERHEART.cases.toLocaleString("en-GB")} cases and ${INTERHEART.controls.toLocaleString("en-GB")} controls in ${INTERHEART.countries} countries; above 1 = higher odds, below 1 = lower odds`, { s: 11, c: GREY })}
      ${ticks}<line x1="${x(1)}" y1="44" x2="${x(1)}" y2="${H - 26}" stroke="${INK}" stroke-width="1.5" stroke-dasharray="5 3"/>${pts}</svg>`;
  }

  // 7. Confounding
  function confoundFig() {
    const id = uid(), m = `cf-${id}`;
    const box = (x, y, w, s, c) => `<rect x="${x - w / 2}" y="${y - 22}" width="${w}" height="44" rx="10" fill="#fff" stroke="${c}" stroke-width="2.5"/>${T(x, y + 5, s, { s: 14, w: 700, c })}`;
    return `<svg viewBox="0 0 640 300" width="640" role="img" aria-label="Confounding: smoking is linked to coffee drinking and causes lung cancer, so coffee drinking appears to be linked to lung cancer even though it does not cause it." style="max-width:100%;height:auto" data-fig="${id}"><defs>${arrowDef(m)}${arrowDef(m + "g", GREY)}</defs><rect width="640" height="300" fill="#fff"/>
      ${box(320, 50, 200, "Smoking (confounder)", ROSE)}${box(120, 230, 200, "Coffee drinking", AMBER)}${box(520, 230, 200, "Lung cancer", BLUE)}
      <line x1="270" y1="74" x2="160" y2="204" stroke="${INK}" stroke-width="2" marker-end="url(#${m})"/>${T(150, 130, "associated: smokers are", { s: 11.5, a: "end" })}${T(150, 146, "more likely to drink coffee", { s: 11.5, a: "end" })}
      <line x1="370" y1="74" x2="480" y2="204" stroke="${INK}" stroke-width="2" marker-end="url(#${m})"/>${T(490, 130, "causes", { s: 11.5, a: "start", w: 700 })}${T(490, 146, "(much evidence)", { s: 11.5, a: "start" })}
      <line x1="222" y1="230" x2="416" y2="230" stroke="${GREY}" stroke-width="2" stroke-dasharray="7 5" marker-end="url(#${m}g)"/>${T(320, 220, "apparent link", { s: 11.5, c: GREY })}${T(320, 258, "disappears when smokers and non-", { s: 11.5, c: GREY })}${T(320, 274, "smokers are analysed separately", { s: 11.5, c: GREY })}</svg>`;
  }

  // 8. Relative v absolute risk (icon arrays of 1000; HYPOTHETICAL illustration)
  function iconArray(aff, title, c) {
    let s = ""; for (let i = 0; i < 1000; i++) { const col = i % 50, row = Math.floor(i / 50); s += `<rect x="${col * 6}" y="${row * 6}" width="5" height="5" fill="${i < aff ? c : "#dfe5ea"}"/>`; }
    return { s, title };
  }
  function relAbsFig(base = RELABS.base, rr = RELABS.rr) {
    const id = uid(); const b = Math.round(base), e = Math.round(base * rr);
    const A = iconArray(b, "", "#7fa7c9"), Bx = iconArray(e, "", ROSE);
    return `<svg viewBox="0 0 680 200" width="680" role="img" aria-label="Two grids of 1000 squares. Left: ${b} coloured, people who develop the disease without the exposure. Right: ${e} coloured, with the exposure. Relative risk ${rr}; absolute difference ${e - b} in 1000." style="max-width:100%;height:auto" data-fig="${id}"><rect width="680" height="200" fill="#fff"/>
      ${T(185, 18, `Not exposed: ${b} in 1000`, { s: 13, w: 700, c: "#2f5f8a" })}${T(505, 18, `Exposed: ${e} in 1000`, { s: 13, w: 700, c: ROSE })}
      <g transform="translate(35 30)">${A.s}</g><g transform="translate(355 30)">${Bx.s}</g>
      ${T(340, 172, `Relative risk = ${e} ÷ ${b} = ${(e / b).toFixed(2)} (an ${Math.round((e / b - 1) * 100)} % increase). Absolute increase = ${e - b} in 1000.`, { s: 12.5, w: 700 })}
      ${T(340, 192, "HYPOTHETICAL illustration: each square is one person.", { s: 11, c: GREY })}</svg>`;
  }

  // 9. Scatter for the HYPOTHETICAL ecological study
  function saltScatter() {
    const id = uid(); const W = 400, H = 330, L = 62, R = 22, Tp = 42, Bt = 54; const x = (v) => L + ((v - 6) / 6) * (W - L - R), y = (v) => Tp + (H - Tp - Bt) - (v / 240) * (H - Tp - Bt);
    const gx = [6, 7, 8, 9, 10, 11, 12].map((t) => `<line x1="${x(t)}" y1="${Tp}" x2="${x(t)}" y2="${H - Bt}" stroke="#eef1f4"/>${T(x(t), H - Bt + 19, String(t), { s: 14, c: GREY })}`).join("");
    const gy = [0, 60, 120, 180, 240].map((t) => `<line x1="${L}" y1="${y(t)}" x2="${W - R}" y2="${y(t)}" stroke="#eef1f4"/>${T(L - 8, y(t) + 5, String(t), { a: "end", s: 14, c: GREY })}`).join("");
    const pts = SALT.map((p) => `<circle cx="${x(p.salt)}" cy="${y(p.chd)}" r="6" fill="${AMBER}"/>${T(x(p.salt) + 9, y(p.chd) - 8, p.c.replace("Country ", ""), { a: "start", s: 14, w: 700 })}`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Scatter graph of six fictional countries: mean salt intake against CHD death rate. Higher salt intake countries have higher CHD death rates. Hypothetical data." style="max-width:100%;height:auto" data-fig="${id}"><rect width="${W}" height="${H}" fill="#fff"/>
      ${T(W / 2, 22, "HYPOTHETICAL ecological study: six countries", { s: 15.5, w: 700 })}${gx}${gy}
      <line x1="${L}" y1="${H - Bt}" x2="${W - R}" y2="${H - Bt}" stroke="${INK}"/><line x1="${L}" y1="${Tp}" x2="${L}" y2="${H - Bt}" stroke="${INK}"/>
      ${T((L + W - R) / 2, H - 10, "mean salt intake (g per person per day)", { s: 14 })}<text transform="translate(17 ${(Tp + H - Bt) / 2}) rotate(-90)" text-anchor="middle" font-size="14" fill="${INK}">CHD deaths per 100,000 per year</text>${pts}</svg>`;
  }

  B.diseaseArt = { uid, ZONES, INTERFACE_NOTES, interfacesFig, pathogenCompareFig, mechanismsFig, riskWebFig, barChart, dollChart, petoChart, orChart, confoundFig, relAbsFig, saltScatter, colours: { INK, GREY, BLUE, AMBER, ROSE, GREEN, TEAL } };
})(window.BIO);
