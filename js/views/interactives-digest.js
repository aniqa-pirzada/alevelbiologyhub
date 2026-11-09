// Interactives for 3.2.2 Digestion and absorption (Phase 4 Batch 1, owned by the 3.2.2 author). Loaded after the
// other interactives files. Kinds (all prefixed dig): digSystemExplorer, digPathwayBuilder, digEnzymeId,
// digVillusExplorer, digCotransportSim, digLipidExplorer. Drawings come from data/content/_digest-art.js; the
// co-transport model (B.digestModel) is illustrative and documented there. Every control is a native button,
// checkbox or select, or an SVG group given tabindex, role="button" and Enter/Space handling. UI text uses the CSS
// tokens; colours are hard-coded only inside SVG drawings, which sit on light panels in both themes. Animation is
// skipped when reduced motion is requested.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store.get().prefs || {}).reducedMotion);
  const head = (spec, badge = "schematic") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const A = () => B.digestArt;
  const fb = (ok, html) => `<div class="small" role="status" style="margin-top:.5rem;padding:.6rem .8rem;border-radius:8px;background:var(${ok ? "--sage-soft" : "--rose-soft"});border-left:4px solid var(${ok ? "--sage" : "--rose"})"><strong>${ok ? "Correct." : "Not quite."}</strong> ${html}</div>`;
  const note = (html) => `<div class="small" role="status" style="margin-top:.5rem;padding:.6rem .8rem;border-radius:8px;background:var(--surface-2);border-left:4px solid var(--line-strong)">${html}</div>`;
  const qs = (spec, host, title = "Marked questions") => { if (!(spec.questions || []).length) return; const box = document.createElement("div"); box.className = "mt"; box.innerHTML = `<h4>${title}</h4><p class="tiny muted">These are marked and recorded towards mastery.</p>`; spec.questions.forEach((q) => box.append(B.questions.render(q))); host.append(box); };
  const fig = (svg, id) => `<div class="figure"><div class="fig-view"${id ? ` id="${id}"` : ""}>${svg}</div></div>`;
  // make every [data-part] group in an svg a keyboard-operable button
  // When several groups share one key (e.g. the nine villi at level 1 of the Villus Explorer), only the first is a tab
  // stop and named button; the others stay clickable but are hidden from assistive technology (QA finding I2).
  const wireParts = (root, names, onPick) => { const seen = new Set(); $$("[data-part]", root).forEach((g) => { const k = g.dataset.part; if (!names[k]) return; g.style.cursor = "pointer"; g.addEventListener("click", () => onPick(k)); if (seen.has(k)) { g.setAttribute("aria-hidden", "true"); return; } seen.add(k); g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", names[k]); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(k); } }); }); };
  const alive = (host) => document.body.contains(host);

  // =============================================================================================
  // 1. Digestive System Explorer
  // =============================================================================================
  const ORGANS = {
    salivary: { n: "Salivary glands", ctx: false, role: "Three pairs of glands (beside the ears, under the jaw and under the tongue; names not required) secrete saliva through ducts into the mouth. Saliva contains <strong>salivary amylase</strong>, which begins hydrolysing starch to maltose, and mucus that lubricates food for swallowing. Its pH is close to neutral, which suits salivary amylase.", sec: "Saliva: water, mucus, salivary amylase.", abs: "Nothing of note." },
    oesophagus: { n: "Oesophagus", ctx: false, role: "A muscular tube from the throat, through the diaphragm, to the stomach. Waves of muscle contraction (<strong>peristalsis</strong>) push each swallowed lump of food along; mucus lubricates it.", sec: "Mucus only; no digestive enzymes.", abs: "Nothing of note." },
    stomach: { n: "Stomach", ctx: false, role: "A muscular sac on the person's left that stores food for a few hours and churns it with gastric juice. Gland cells secrete <strong>hydrochloric acid</strong> (about pH 2: kills many microorganisms, suits the stomach's enzyme) and an <strong>endopeptidase</strong> (pepsin, supporting) that begins protein digestion. Mucus protects the lining. Food passes on to the duodenum a little at a time.", sec: "Hydrochloric acid, an endopeptidase, mucus.", abs: "Very little (some water and alcohol)." },
    duodenum: { n: "Duodenum", ctx: false, role: "The first part of the small intestine, curving round the head of the pancreas. It receives <strong>pancreatic juice</strong> and <strong>bile</strong> through ducts. Hydrogencarbonate ions neutralise the stomach acid, giving a pH that suits the pancreatic enzymes. Much hydrolysis of starch, lipids and proteins happens in its lumen.", sec: "Receives pancreatic juice (amylase, lipase, endopeptidases, exopeptidases, hydrogencarbonate) and bile (bile salts).", abs: "Some products are absorbed here too." },
    pancreas: { n: "Pancreas", ctx: false, role: "A gland lying below and behind the stomach, its head in the curve of the duodenum. It secretes <strong>pancreatic juice</strong> into the duodenum through the pancreatic duct. (Separate groups of cells release hormones into the blood; not needed here.)", sec: "Amylase, lipase, endopeptidases (e.g. trypsin), exopeptidases, hydrogencarbonate ions.", abs: "Not part of the food's route." },
    jejunum: { n: "Jejunum (context)", ctx: true, role: "The middle section of the small intestine, between the duodenum and the ileum. It is not named in the specification. It is structurally similar to the ileum, with villi, and absorbs many products of digestion too.", sec: "Membrane-bound enzymes on its epithelium.", abs: "Products of digestion." },
    ileum: { n: "Ileum", ctx: false, role: "The final and longest part of the small intestine, ending where it joins the large intestine at the lower right of the abdomen (lower left of the page). Its lining is folded into <strong>villi</strong>, whose epithelial cells carry <strong>microvilli</strong>. Membrane-bound disaccharidases and dipeptidases complete digestion, and the products are <strong>absorbed</strong> into the blood and the lymph (3.2.2.3).", sec: "Membrane-bound disaccharidases and dipeptidases (on the cells, not secreted); mucus.", abs: "Monosaccharides, amino acids, monoglycerides and fatty acids, water, ions; bile salts near its end." },
    colon: { n: "Colon", ctx: false, role: "The main part of the large intestine: up the person's right side, across, and down the left. It absorbs most of the remaining <strong>water</strong> and some mineral ions, so undigested material becomes semi-solid faeces. Large numbers of bacteria live here and ferment some undigested material. The caecum, where the ileum joins it, is drawn as its rounded start.", sec: "Mucus.", abs: "Water and some mineral ions." },
    rectum: { n: "Rectum", ctx: false, role: "The final part of the large intestine. It <strong>stores faeces</strong> until they are egested through the anus. Egestion removes undigested food that was never absorbed; it is not excretion.", sec: "Mucus.", abs: "A little water." },
    liver: { n: "Liver (context)", ctx: true, role: "Not an assessed structure here. The large organ under the diaphragm on the person's right. It makes <strong>bile</strong> (bile salts and hydrogencarbonate), which is stored in the gall bladder. It also receives the absorbed products of digestion in the hepatic portal vein (3.1.5.3).", sec: "Bile (to the gall bladder).", abs: "Not part of the food's route." },
    gallbladder: { n: "Gall bladder (context)", ctx: true, role: "A small sac under the liver that stores and concentrates bile and releases it through the bile duct into the duodenum after a meal. Bile contains no enzymes.", sec: "Releases bile.", abs: "Not part of the food's route." },
    anus: { n: "Anus (context)", ctx: true, role: "The opening through which faeces are egested. Context only.", sec: "None.", abs: "None." },
  };
  const FIND = [
    ["Where is most of the remaining water absorbed, so that faeces form?", "colon"],
    ["Which structure carries food to the stomach by peristalsis?", "oesophagus"],
    ["Which gland secretes lipase and endopeptidases into the duodenum?", "pancreas"],
    ["Where are faeces stored before egestion?", "rectum"],
    ["Which region has villi and absorbs the products of digestion?", "ileum"],
    ["Where does hydrochloric acid kill microorganisms in food?", "stomach"],
    ["Which glands secrete amylase into the mouth?", "salivary"],
    ["Which part of the small intestine receives pancreatic juice and bile?", "duodenum"],
  ];
  B.interactives.digSystemExplorer = function (spec, host) {
    const names = Object.fromEntries(Object.entries(ORGANS).map(([k, v]) => [k, v.n]));
    const btn = (k) => `<button class="btn sm" data-k="${k}" aria-pressed="false">${ORGANS[k].n}</button>`;
    host.innerHTML = head(spec) + `
      <div class="row"><label class="small"><input type="checkbox" id="dse-lab" checked> show labels</label><button class="btn sm" id="dse-find">Start the 'find it' challenge</button></div>
      <div class="explorer mt"><div style="min-width:0">${fig(A().digestiveSystem({ mode: "labels" }), "dse-view")}</div>
        <div><div id="dse-lists"><p class="tiny muted">Named in the specification:</p><div class="org-list" id="dse-a">${A().ASSESSED.map(btn).join("")}</div><p class="tiny muted">Context (not assessed as structures):</p><div class="org-list" id="dse-c">${["liver", "gallbladder", "jejunum", "anus"].map(btn).join("")}</div></div>
        <div class="card" id="dse-info" aria-live="polite"><p class="small muted">Select a structure on the drawing or in the lists.</p></div><div id="dse-q" aria-live="polite"></div></div></div>
      <p class="tiny muted mt">Schematic front view: the person's right side is on the left of the page. Sizes and positions are simplified; organs overlap in life (the pancreas lies behind the stomach, the small intestine behind the transverse colon).</p>`;
    let find = null; // { i, score }
    const view = $("#dse-view", host);
    // during the challenge the side lists are hidden and the drawing's parts get neutral names, so the organ names do
    // not give the answers away (QA finding I1)
    const anon = Object.fromEntries(Object.keys(ORGANS).map((k, i) => [k, `structure ${i + 1} of ${Object.keys(ORGANS).length}`]));
    const draw = () => { view.innerHTML = A().digestiveSystem({ mode: $("#dse-lab", host).checked && !find ? "labels" : "none" }); wireParts(view, find ? anon : names, pick); $("#dse-lists", host).hidden = !!find; };
    const mark = (k) => { $$("[data-part]", view).forEach((g) => g.classList.toggle("hl", g.dataset.part === k)); $$(".org-list button", host).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === k))); };
    const show = (k) => { const o = ORGANS[k]; $("#dse-info", host).innerHTML = `<h4>${o.n} ${o.ctx ? '<span class="badge">context</span>' : '<span class="badge teal">required</span>'}</h4><p class="small">${o.role}</p><p class="small"><strong>Secretes:</strong> ${o.sec}<br><strong>Absorbed here:</strong> ${o.abs}</p>`; };
    const ask = () => { if (!find) return; if (find.i >= FIND.length) { $("#dse-q", host).innerHTML = note(`<strong>Challenge finished: ${find.score} / ${FIND.length}.</strong> This practice score is not recorded; the marked questions below are.`); find = null; $("#dse-find", host).textContent = "Start the 'find it' challenge again"; draw(); return; } $("#dse-q", host).innerHTML = note(`<strong>Find it ${find.i + 1} / ${FIND.length}:</strong> ${FIND[find.i][0]} <span class="tiny muted">(select it on the drawing; labels and the lists of names are hidden until the challenge ends)</span>`); };
    function pick(k) {
      mark(k); show(k);
      if (find && find.i < FIND.length) { const [, ans] = FIND[find.i]; const ok = k === ans; if (ok) find.score++; find.i++; $("#dse-q", host).innerHTML = fb(ok, ok ? `${ORGANS[ans].n}.` : `You chose ${ORGANS[k].n}; the answer is the ${ORGANS[ans].n.toLowerCase()}.`); setTimeout(ask, reduced() ? 600 : 1400); }
    }
    $$(".org-list button", host).forEach((b) => b.addEventListener("click", () => pick(b.dataset.k)));
    $("#dse-lab", host).addEventListener("change", draw);
    $("#dse-find", host).addEventListener("click", () => { find = { i: 0, score: 0 }; $("#dse-find", host).textContent = "Restart the challenge"; draw(); mark(null); $("#dse-info", host).innerHTML = '<p class="small muted">Labels and the lists of names are hidden during the challenge. The description of each structure appears after you choose.</p>'; ask(); });
    draw();
    qs(spec, host);
  };

  // =============================================================================================
  // 2. Digestion Pathway Builder
  // =============================================================================================
  const G = () => A().glyph;
  const strip = (inner, aria) => `<svg viewBox="0 0 520 90" width="520" role="img" aria-label="${aria}" style="max-width:100%;min-width:${A().minW(520)}px;height:auto">${inner}</svg>`;
  const chainG = (x0, y, n, f = (x, yy) => G().hex(x, yy), gap = 20, bond = "#b07a1c") => { let s = ""; for (let k = 0; k < n; k++) { const x = x0 + k * gap; if (k < n - 1) s += `<line x1="${x + 8}" y1="${y}" x2="${x + gap - 8}" y2="${y}" stroke="${bond}" stroke-width="2"/>`; s += f(x, y); } return s; };
  const lbl = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#5f6f7f">${t}</text>`;
  const PATHS = {
    carb: { name: "Carbohydrate (starch)", stages: [
      () => strip(chainG(40, 40, 12) + lbl(150, 80, "starch: a long chain of glucose units"), "starch chain"),
      () => strip([0, 1, 2, 3, 4, 5].map((k) => chainG(30 + k * 78, 40, 2)).join("") + lbl(250, 80, "maltose (disaccharide)"), "maltose molecules"),
      () => strip(Array.from({ length: 12 }, (_, k) => G().hex(30 + k * 38, 40)).join("") + lbl(250, 80, "glucose (monosaccharide): ready to be absorbed"), "glucose molecules"),
    ], steps: [
      { from: "Starch", to: "Maltose", agent: ["Amylase", "Membrane-bound disaccharidase", "Lipase", "Endopeptidase"], a: 0, site: ["Mouth and duodenum (from the salivary glands and pancreas)", "Cell-surface membrane of the ileum epithelium", "Stomach only", "Colon"], s: 0, kind: "hydrolysis of glycosidic bonds", why: "Amylase hydrolyses starch to maltose; salivary amylase acts in the mouth, pancreatic amylase in the duodenum." },
      { from: "Maltose", to: "Glucose", agent: ["Amylase", "Membrane-bound disaccharidase (maltase)", "Membrane-bound dipeptidase", "Bile salts"], a: 1, site: ["Mouth", "Lumen of the stomach", "Cell-surface membrane of the ileum epithelium", "Rectum"], s: 2, kind: "hydrolysis of a glycosidic bond", why: "Maltase, a membrane-bound disaccharidase on the microvilli, releases glucose right beside the co-transport proteins." },
    ] },
    lipid: { name: "Lipid (triglycerides)", stages: [
      () => strip(`<circle cx="120" cy="42" r="34" fill="#fbeab0" stroke="#b07a1c" stroke-width="2"/>` + lbl(120, 88, "large droplet: small surface area"), "large lipid droplet"),
      () => strip([[60, 30], [100, 50], [140, 28], [180, 52], [220, 30], [260, 50], [300, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#fbeab0" stroke="#1e3a5f" stroke-width="2"/>`).join("") + lbl(180, 84, "emulsion: tiny droplets coated with bile salts"), "emulsified droplets"),
      () => strip(G().tri(60, 42, [0, 1, 0]) + G().fa(140, 30) + G().fa(140, 54) + G().tri(260, 42, [0, 1, 0]) + G().fa(340, 30) + G().fa(340, 54) + lbl(250, 86, "monoglycerides + fatty acids (they will form micelles: 3.2.2.3)"), "monoglycerides and fatty acids"),
    ], steps: [
      { from: "Large lipid droplets", to: "Many small droplets (emulsion)", agent: ["Lipase", "Bile salts", "Amylase", "Exopeptidase"], a: 1, site: ["Duodenum (bile enters through the bile duct)", "Mouth", "Cell-surface membrane of the ileum epithelium", "Oesophagus"], s: 0, kind: "PHYSICAL change: no bonds broken", why: "Bile salts emulsify lipids, increasing the surface area for lipase. They are not enzymes." },
      { from: "Triglycerides", to: "Monoglycerides + fatty acids", agent: ["Bile salts", "Lipase", "Membrane-bound disaccharidase", "Endopeptidase"], a: 1, site: ["Stomach", "Lumen of the duodenum and ileum (from the pancreas)", "Colon", "Salivary glands"], s: 1, kind: "hydrolysis of ester bonds", why: "Pancreatic lipase hydrolyses ester bonds at the droplet surfaces, removing the two outer fatty acids." },
    ] },
    protein: { name: "Protein", stages: [
      () => strip(chainG(30, 40, 20, (x, y) => G().bead(x, y, "#e4ebf5", 8), 22, "#1e3a5f") + lbl(250, 82, "protein: long polypeptide chains"), "long polypeptide"),
      () => strip(chainG(20, 40, 5, (x, y) => G().bead(x, y, "#e4ebf5", 8), 22, "#1e3a5f") + chainG(150, 40, 4, (x, y) => G().bead(x, y, "#e4ebf5", 8), 22, "#1e3a5f") + chainG(260, 40, 6, (x, y) => G().bead(x, y, "#e4ebf5", 8), 22, "#1e3a5f") + chainG(410, 40, 4, (x, y) => G().bead(x, y, "#e4ebf5", 8), 22, "#1e3a5f") + lbl(250, 82, "shorter polypeptides: many more ends"), "shorter polypeptides"),
      () => strip([0, 1, 2, 3, 4].map((k) => chainG(30 + k * 70, 40, 2, (x, y) => G().bead(x, y, "#e4ebf5", 8), 20, "#1e3a5f")).join("") + [380, 410, 440, 470].map((x) => G().bead(x, 40, "#e2efe6", 8)).join("") + lbl(250, 82, "dipeptides and free amino acids"), "dipeptides and amino acids"),
      () => strip(Array.from({ length: 13 }, (_, k) => G().bead(26 + k * 36, 40, "#e2efe6", 8)).join("") + lbl(250, 82, "amino acids: ready to be absorbed"), "amino acids"),
    ], steps: [
      { from: "Protein", to: "Shorter polypeptides", agent: ["Exopeptidase", "Endopeptidase", "Membrane-bound dipeptidase", "Lipase"], a: 1, site: ["Stomach and duodenum", "Mouth", "Colon", "Rectum"], s: 0, kind: "hydrolysis of internal peptide bonds", why: "Endopeptidases (pepsin in the stomach, trypsin from the pancreas) hydrolyse bonds within the chain." },
      { from: "Shorter polypeptides", to: "Dipeptides + amino acids", agent: ["Endopeptidase", "Amylase", "Exopeptidase", "Bile salts"], a: 2, site: ["Duodenum and ileum", "Oesophagus", "Salivary glands", "Stomach only"], s: 0, kind: "hydrolysis of terminal peptide bonds", why: "Exopeptidases remove amino acids from the ends; the endopeptidases have made many ends to work on." },
      { from: "Dipeptides", to: "Amino acids", agent: ["Membrane-bound disaccharidase", "Exopeptidase", "Lipase", "Membrane-bound dipeptidase"], a: 3, site: ["Lumen of the stomach", "Cell-surface membrane of the ileum epithelium", "Colon", "Mouth"], s: 1, kind: "hydrolysis of the single peptide bond", why: "Membrane-bound dipeptidases on the microvilli release amino acids beside the co-transport proteins. (A disaccharidase acts on disaccharides, not dipeptides.)" },
    ] },
  };
  B.interactives.digPathwayBuilder = function (spec, host) {
    host.innerHTML = head(spec, "step by step") + `<div class="tabs" role="tablist" id="pb-tabs">${Object.entries(PATHS).map(([k, p], i) => `<button role="tab" aria-selected="${i === 0}" data-k="${k}">${p.name}</button>`).join("")}</div>
      <div id="pb-body" class="mt"></div><p class="tiny muted mt">Every step except emulsification is a hydrolysis reaction using water. Drawings are schematic and show only a few molecules.</p>`;
    let cur = "carb", step = 0;
    const render = () => { const p = PATHS[cur]; const done = step >= p.steps.length; const st = p.steps[Math.min(step, p.steps.length - 1)];
      const chainTxt = [p.steps[0].from, ...p.steps.map((x, i) => (i < step ? `<strong>${x.to}</strong>` : "?"))].join(" → ");
      $("#pb-body", host).innerHTML = `${fig(p.stages[Math.min(step, p.stages.length - 1)](), "pb-fig")}<p class="small mt"><strong>Pathway so far:</strong> ${chainTxt}</p>` + (done ? note(`<strong>Pathway complete.</strong> ${p.steps.map((x) => `${x.from} → ${x.to}: ${x.agent[x.a]} (${x.site[x.s].toLowerCase()}; ${x.kind}).`).join(" ")}<br><button class="btn sm mt" id="pb-again">Build it again</button>`) : `<div class="card mt"><h4>Step ${step + 1} of ${p.steps.length}: ${st.from} → ${st.to}</h4>
        <div class="grid grid-2"><label class="small">What does this step?<select id="pb-a" style="max-width:100%;display:block;margin-top:.25rem"><option value="">choose…</option>${st.agent.map((x, i) => `<option value="${i}">${esc(x)}</option>`).join("")}</select></label>
        <label class="small">Where does it happen?<select id="pb-s" style="max-width:100%;display:block;margin-top:.25rem"><option value="">choose…</option>${st.site.map((x, i) => `<option value="${i}">${esc(x)}</option>`).join("")}</select></label></div>
        <div class="row mt"><button class="btn primary" id="pb-check">Check this step</button></div><div id="pb-fb" aria-live="polite"></div></div>`);
      const again = $("#pb-again", host); if (again) again.addEventListener("click", () => { step = 0; render(); });
      const chk = $("#pb-check", host); if (chk) chk.addEventListener("click", () => { const a = $("#pb-a", host).value, s = $("#pb-s", host).value; if (a === "" || s === "") { $("#pb-fb", host).innerHTML = note("Choose an answer in both lists first."); return; } const okA = +a === st.a, okS = +s === st.s; if (okA && okS) { $("#pb-fb", host).innerHTML = fb(true, `${st.why} <em>${st.kind}.</em>`); step++; setTimeout(render, reduced() ? 400 : 1200); } else { $("#pb-fb", host).innerHTML = fb(false, `${okA ? "The agent is right" : `The agent is not right: think about which bond or molecule it acts on`}${okS ? "; the place is right." : okA ? ", but the place is not." : "; check the place too."} Try again.`); } });
    };
    $$("#pb-tabs button", host).forEach((b) => b.addEventListener("click", () => { cur = b.dataset.k; step = 0; $$("#pb-tabs button", host).forEach((x) => x.setAttribute("aria-selected", String(x === b))); render(); }));
    render(); qs(spec, host);
  };

  // =============================================================================================
  // 3. Enzyme Identification Challenge
  // =============================================================================================
  B.interactives.digEnzymeId = function (spec, host) {
    host.innerHTML = head(spec, "challenge") + `<details class="mt"><summary class="small">Reference table (try without it first)</summary><div style="overflow-x:auto"><table class="tbl small"><thead><tr><th>Class</th><th>Substrate → product</th><th>Where</th></tr></thead><tbody>
      <tr><td>Amylase</td><td>starch → maltose</td><td>mouth, duodenum</td></tr><tr><td>Membrane-bound disaccharidase</td><td>disaccharide → monosaccharides</td><td>ileum epithelial membrane</td></tr>
      <tr><td>Lipase</td><td>triglyceride → monoglyceride + fatty acids</td><td>duodenum, ileum lumen</td></tr><tr><td>Endopeptidase</td><td>internal peptide bonds → shorter polypeptides</td><td>stomach, duodenum</td></tr>
      <tr><td>Exopeptidase</td><td>terminal amino acid removed</td><td>duodenum, ileum</td></tr><tr><td>Membrane-bound dipeptidase</td><td>dipeptide → two amino acids</td><td>ileum epithelial membrane</td></tr>
      <tr><td>Bile salts (not an enzyme)</td><td>emulsify lipids; form micelles</td><td>duodenum, ileum</td></tr></tbody></table></div></details><div id="dei-q" class="mt"></div>`;
    (spec.questions || []).forEach((q) => $("#dei-q", host).append(B.questions.render(q)));
  };

  // =============================================================================================
  // 4. Villus and Microvillus Explorer (four magnifications)
  // =============================================================================================
  // Close-up of two microvilli: drawn to a vertical scale of 1 µm = 300 px; the membrane and proteins are drawn far
  // thicker / larger than scale (a membrane is about 7 nm, which would be 2 px) and the caption says so.
  const membranePatch = () => { const C = A().colours; let s = `<svg viewBox="0 0 760 440" width="760" role="img" aria-label="close-up of two microvilli, each a finger of cell-surface membrane carrying co-transport proteins, disaccharidases and dipeptidases" style="max-width:100%;min-width:${A().minW(760)}px;height:auto"><rect width="760" height="70" fill="#fdf3e3"/><text x="16" y="22" font-size="12" font-weight="700" fill="#16263a">LUMEN</text>`;
    [250, 470].forEach((x) => { s += `<path d="M${x - 15} 380 L${x - 15} 95 a 15 15 0 0 1 30 0 L${x + 15} 380" fill="#e3f3ef" stroke="${C.TEAL}" stroke-width="5"/><line x1="${x}" y1="120" x2="${x}" y2="380" stroke="#9fb6af" stroke-width="3" stroke-dasharray="6 4"/>`; });
    s += `<rect x="40" y="380" width="680" height="30" fill="#e3f3ef" stroke="${C.TEAL}" stroke-width="2"/><text x="380" y="400" text-anchor="middle" font-size="10.5" fill="#5f6f7f">cytoplasm at the top of the epithelial cell</text>`;
    s += `<g data-part="cotr"><rect x="${250 - 22}" y="150" width="14" height="26" rx="4" fill="#fff" stroke="${C.NAVY}" stroke-width="2"/><rect x="${470 + 8}" y="230" width="14" height="26" rx="4" fill="#fff" stroke="${C.NAVY}" stroke-width="2"/></g>`;
    s += `<g data-part="disacch"><rect x="${250 + 9}" y="210" width="16" height="12" rx="4" fill="#fbe9c8" stroke="${C.AMBER}" stroke-width="2"/><rect x="${470 - 25}" y="160" width="16" height="12" rx="4" fill="#fbe9c8" stroke="${C.AMBER}" stroke-width="2"/></g>`;
    s += `<g data-part="dipep"><rect x="${250 - 25}" y="290" width="16" height="12" rx="4" fill="#efe3f4" stroke="${C.PLUM}" stroke-width="2"/><rect x="${470 + 9}" y="320" width="16" height="12" rx="4" fill="#efe3f4" stroke="${C.PLUM}" stroke-width="2"/></g>`;
    s += `<g data-part="actin"><line x1="250" y1="120" x2="250" y2="380" stroke="transparent" stroke-width="14"/><line x1="470" y1="120" x2="470" y2="380" stroke="transparent" stroke-width="14"/></g>`;
    const lab = (x1, y1, x2, y2, t, c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5f6f7f" stroke-width="1"/><text x="${x2 + 6}" y="${y2 + 4}" font-size="11.5" font-weight="700" fill="${c}">${t}</text>`;
    s += lab(492, 243, 560, 243, "co-transport protein", C.NAVY) + lab(445, 166, 560, 140, "disaccharidase", C.AMBER) + lab(495, 326, 560, 326, "dipeptidase", C.PLUM) + lab(470, 300, 560, 290, "actin filaments (support)", "#5f6f7f");
    s += `<line x1="100" y1="230" x2="100" y2="380" stroke="#16263a" stroke-width="3"/><line x1="94" y1="230" x2="106" y2="230" stroke="#16263a" stroke-width="2"/><line x1="94" y1="380" x2="106" y2="380" stroke="#16263a" stroke-width="2"/><text x="88" y="305" font-size="10.5" font-weight="700" fill="#16263a" text-anchor="middle" transform="rotate(-90 88 305)">≈ 0.5 µm</text>`;
    s += `<text x="380" y="432" text-anchor="middle" font-size="9.5" fill="#5f6f7f">Microvilli drawn to the bar (≈ 1 µm long, 0.1 µm wide). The membrane (≈ 7 nm) and the proteins are drawn many times larger than scale.</text>`;
    return s + "</svg>"; };
  const LEVELS = [
    { n: "Ileum wall", size: "Field of view about 2.5 mm wide; villi about 0.5–1 mm tall (bar ≈ 0.5 mm).", svg: () => A().ileumWall(), parts: { villus: ["Villus", "One of millions of finger-like folds of the mucosa. Villi multiply the surface area in contact with digested food many times. Select <em>Zoom in</em> to look at one."] }, intro: "Villi project into the lumen. Below them: crypts, the submucosa with larger vessels, two muscle layers (peristalsis) and the serosa." },
    { n: "One villus", size: "Villus height ≈ 0.55 mm (bar ≈ 100 µm, vertical). Width and epithelium drawn about 1.5–2× wider than scale.", svg: () => A().villus(), parts: { epithelium: ["Epithelium one cell thick", "A single layer of columnar epithelial cells: the products of digestion cross just one cell to reach the blood, a short diffusion distance. Each cell carries a brush border of microvilli."], capillary: ["Capillary network", "Arteriole in, venule out, with a dense mesh just under the epithelium. Blood flow carries glucose and amino acids away, keeping their concentration low on the blood side and so maintaining the concentration gradient."], lacteal: ["Lacteal", "A blind-ended lymph vessel in the centre of the villus. Chylomicrons, too large for the blood capillaries, enter it and are carried away in the lymph."], goblet: ["Goblet cells (supporting)", "Secrete mucus, which lubricates and protects the epithelium."] }, intro: "Select the epithelium, the capillary network, the lacteal or a goblet cell." },
    { n: "Epithelial cell", size: "Drawn to the bar (≈ 10 µm) in both directions: the cell is about 21 µm tall and 10 µm wide, a tall columnar cell. Microvilli about 1 µm long, drawn fewer and slightly longer than in life.", svg: () => A().epithelialCell(), parts: { microvilli: ["Microvilli", "Folds of this one cell's membrane, about 1 µm long. They increase the membrane surface area, giving room for many more co-transport and carrier proteins and membrane-bound enzymes."], mito: ["Mitochondria", "Many mitochondria carry out aerobic respiration, supplying ATP for the Na⁺/K⁺ pumps in the basal membrane, which keep Na⁺ low inside the cell for co-transport."], er: ["Endoplasmic reticulum (supporting)", "Smooth ER re-forms triglycerides from absorbed monoglycerides and fatty acids. Rough ER makes the proteins of chylomicrons and the membrane proteins; the Golgi apparatus modifies and packages them, putting chylomicrons into vesicles."], nucleus: ["Nucleus", "Contains the genes for the co-transport proteins, pumps and enzymes."], capillaryC: ["Capillary", "Lies just beneath the cell, below the thin basement membrane; glucose and amino acids leaving the cell by facilitated diffusion through the basal membrane enter it."], cell: ["Epithelial cell", "Microvilli face the lumen (top); the basal membrane faces the blood (bottom). Tight junctions near the top (extension) stop the gut contents leaking between cells."], junction: ["Tight junctions (extension)", "Protein seals between neighbouring cells near the lumen; substances must pass through the cells, not between them."] }, intro: "Select the microvilli, mitochondria, ER, nucleus or capillary." },
    { n: "Microvillus membrane", size: "Microvilli ≈ 1 µm long and ≈ 0.1 µm wide (bar ≈ 0.5 µm). Membrane and proteins hugely enlarged.", svg: membranePatch, parts: { cotr: ["Co-transport proteins", "Carry Na⁺ into the cell down its gradient together with glucose (or amino acids) against theirs (3.2.2.3)."], disacch: ["Membrane-bound disaccharidases", "Hydrolyse maltose, sucrose and lactose to monosaccharides at the membrane (3.2.2.2)."], dipep: ["Membrane-bound dipeptidases", "Hydrolyse dipeptides to amino acids at the membrane (3.2.2.2)."], actin: ["Actin filaments (supporting)", "A bundle of protein filaments inside each microvillus holds it upright."] }, intro: "Select a protein: enzymes and transport proteins sit side by side, so products are absorbed as soon as they are made." },
  ];
  B.interactives.digVillusExplorer = function (spec, host) {
    host.innerHTML = head(spec, "four magnifications") + `<div class="row" role="group" aria-label="magnification level"><button class="btn sm" id="vx-out" aria-label="zoom out">− Zoom out</button>${LEVELS.map((l, i) => `<button class="btn sm vx-l" data-i="${i}" aria-pressed="false">${i + 1}. ${l.n}</button>`).join("")}<button class="btn sm" id="vx-in" aria-label="zoom in">Zoom in +</button></div>
      <p class="small mt" id="vx-size" aria-live="polite"></p><div id="vx-view" style="transition:opacity .25s"></div><div class="card mt" id="vx-info" aria-live="polite"></div>`;
    let lv = 0;
    const set = (i) => { lv = Math.max(0, Math.min(LEVELS.length - 1, i)); const L = LEVELS[lv]; const v = $("#vx-view", host);
      const paint = () => { v.innerHTML = fig(L.svg()); wireParts(v, Object.fromEntries(Object.entries(L.parts).map(([k, p]) => [k, p[0]])), pick); v.style.opacity = 1; };
      if (reduced()) paint(); else { v.style.opacity = 0.15; setTimeout(paint, 180); }
      $("#vx-size", host).innerHTML = `<strong>Level ${lv + 1} of 4: ${L.n}.</strong> ${L.size}`;
      $("#vx-info", host).innerHTML = `<p class="small">${L.intro}</p><div class="row">${Object.entries(L.parts).map(([k, p]) => `<button class="btn sm vx-p" data-k="${k}">${p[0]}</button>`).join("")}</div>`;
      $$(".vx-p", host).forEach((b) => b.addEventListener("click", () => pick(b.dataset.k)));
      $$(".vx-l", host).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === lv))); $("#vx-out", host).disabled = lv === 0; $("#vx-in", host).disabled = lv === LEVELS.length - 1; };
    function pick(k) { const p = LEVELS[lv].parts[k]; if (!p) return; $$("#vx-view [data-part]", host).forEach((g) => g.classList.toggle("hl", g.dataset.part === k)); const old = $("#vx-detail", host); if (old) old.remove(); $("#vx-info", host).insertAdjacentHTML("beforeend", `<div id="vx-detail" class="mt"><h4>${p[0]}</h4><p class="small">${p[1]}</p></div>`); }
    $("#vx-out", host).addEventListener("click", () => set(lv - 1)); $("#vx-in", host).addEventListener("click", () => set(lv + 1)); $$(".vx-l", host).forEach((b) => b.addEventListener("click", () => set(+b.dataset.i)));
    set(0); qs(spec, host);
  };

  // =============================================================================================
  // 5. Sodium Co-transport Simulator (model: B.digestModel, documented in _digest-art.js)
  // =============================================================================================
  B.interactives.digCotransportSim = function (spec, host) {
    host.innerHTML = head(spec, "illustrative model") + `
      <div class="row"><button class="btn primary" id="ct-play">Run</button><button class="btn" id="ct-step">Step once</button><button class="btn" id="ct-meal">Add a meal (glucose into the lumen)</button><button class="btn" id="ct-reset">Reset</button></div>
      <div class="row mt"><label class="small"><input type="checkbox" id="ct-pump" checked> Na⁺/K⁺ pump working</label><label class="small"><input type="checkbox" id="ct-atp" checked> ATP available (respiration)</label><label class="small"><input type="checkbox" id="ct-na" checked> Na⁺ present in the lumen</label></div>
      <div id="ct-view" class="mt"></div><div class="readout small mt" id="ct-out" aria-live="polite" style="font-family:var(--mono);background:var(--surface-2);padding:.5rem .7rem;border-radius:8px"></div><div id="ct-msg"></div><div id="ct-chart" class="mt"></div><div id="ct-cmp" class="mt"></div>
      <p class="tiny muted mt"><strong>Model.</strong> Arbitrary units. Lumen Na⁺ 140 (or 0 when removed); tissue fluid Na⁺ 140; blood glucose fixed at 5. Each step: the pump moves 3 Na⁺ out per cycle, faster when there is more Na⁺ in the cell (only with the pump working and ATP available). The co-transporter moves one Na⁺ and one glucose in together; its rate depends on the Na⁺ gradient between the lumen and the cell, and it can hold glucose in the cell above the lumen concentration only while that gradient exists (with no gradient, it cannot move glucose against the glucose gradient at all). Some Na⁺ also leaks in from the lumen and from the tissue fluid, which is why cell Na⁺ does not fall to zero. The model also lets a little glucose enter by facilitated diffusion, but only while the lumen concentration is above the cell's; whether this happens in real epithelial cells is debated (fructose is the clear example of facilitated diffusion uptake). Glucose leaves into the blood by facilitated diffusion at a rate proportional to the cell–blood difference. One Na⁺ per glucose is used for simplicity (the real intestinal co-transporter carries two: extension). Not measured data.</p>`;
    const M = B.digestModel; let st = M.init(20), hist = [], timer = null, phase = 0;
    const opts = () => ({ pumpOn: $("#ct-pump", host).checked, atp: $("#ct-atp", host).checked });
    const naOn = () => $("#ct-na", host).checked;
    const preview = () => M.step({ ...st, NaL: naOn() ? 140 : 0 }, opts()).flux; // rates at the current state, without advancing
    let last;
    // reference runs from Reset (20 units, 60 steps), computed with the same model so the comparison is always accurate
    const ref = (o, NaL = 140) => { let x = { ...M.init(20), NaL }; for (let i = 0; i < 60; i++) x = M.step(x, o).st; return x; };
    const R = { normal: ref({}), pump: ref({ pumpOn: false }), noNa: ref({}, 0) };
    $("#ct-cmp", host).innerHTML = `<div style="overflow-x:auto"><table class="tbl small"><caption class="tiny muted" style="text-align:left">The same model run from Reset for 60 steps (20 units of glucose in the lumen at the start)</caption><thead><tr><th>Condition</th><th>Glucose absorbed</th><th>Lumen glucose at the end</th><th>Na⁺ in the cell at the end</th></tr></thead><tbody>
      <tr><th>Pump working, ATP, Na⁺ in lumen</th><td>${R.normal.absorbed.toFixed(1)}</td><td>${R.normal.GL.toFixed(1)} (below the cell's ${R.normal.GC.toFixed(1)})</td><td>${R.normal.NaC.toFixed(0)}</td></tr>
      <tr><th>Pump stopped, or no ATP</th><td>${R.pump.absorbed.toFixed(1)}</td><td>${R.pump.GL.toFixed(1)}</td><td>${R.pump.NaC.toFixed(0)}</td></tr>
      <tr><th>No Na⁺ in the lumen</th><td>${R.noNa.absorbed.toFixed(1)}</td><td>${R.noNa.GL.toFixed(1)}</td><td>${R.noNa.NaC.toFixed(0)}</td></tr></tbody></table></div>`;
    // small multiples: Na⁺ and glucose on separate panels, each with its own labelled y-axis (no dual-axis chart)
    const panel = (y0, h, ymax, step, title, series, tmax, W, pl) => { const X = (t) => pl + ((W - pl - 14) * t) / tmax, Y = (v) => y0 + h - (h * Math.min(v, ymax)) / ymax; let g = `<text x="${pl}" y="${y0 - 8}" font-size="11.5" font-weight="700" fill="#16263a">${title}</text>`;
      for (let v = 0; v <= ymax; v += step) g += `<line x1="${pl}" y1="${Y(v).toFixed(1)}" x2="${W - 14}" y2="${Y(v).toFixed(1)}" stroke="#e3e8ed"/><text x="${pl - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#5f6f7f">${v}</text>`;
      g += `<line x1="${pl}" y1="${y0}" x2="${pl}" y2="${y0 + h}" stroke="#16263a"/><line x1="${pl}" y1="${y0 + h}" x2="${W - 14}" y2="${y0 + h}" stroke="#16263a"/>`;
      for (const [key, col, name] of series) { const pts = hist.map((p) => `${X(p.t).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(" "); const lp = hist[hist.length - 1]; g += `<polyline fill="none" stroke="${col}" stroke-width="2" points="${pts}"/>` + (name ? `<text x="${Math.min(W - 16, X(lp.t) + 4).toFixed(1)}" y="${(Y(lp[key]) - 5).toFixed(1)}" text-anchor="end" font-size="10.5" font-weight="700" fill="#16263a">${name}</text>` : ""); }
      return { g, X }; };
    const draw = () => {
      const f = { co: Math.min(1, last.co / 2.6), pump: Math.min(1, last.pump / 2.5), fd: Math.max(-1, Math.min(1, last.fd / 2.6)) };
      let svg = A().cotransport({ pumpOn: opts().pumpOn && opts().atp, naCell: st.NaC / 140, glcCell: Math.min(1, st.GC / 20), flux: f, dots: naOn() });
      if (timer && !reduced()) { // moving tokens along active routes (skipped with reduced motion)
        const y = (a, b) => a + ((b - a) * (phase % 4)) / 3; let mv = "";
        if (f.co > 0.05) mv += A().glyph.na(232, y(70, 220)) + A().glyph.glc(268, y(70, 220));
        if (f.pump > 0.05) mv += A().glyph.na(352, y(330, 470)) + A().glyph.kk(390, y(470, 330));
        if (Math.abs(f.fd) > 0.05) mv += A().glyph.glc(560, f.fd > 0 ? y(330, 478) : y(478, 330));
        svg = svg.replace("</svg>", mv + "</svg>");
      }
      $("#ct-view", host).innerHTML = fig(svg);
      $("#ct-out", host).innerHTML = `step ${st.t} · Na⁺ in cell ${st.NaC.toFixed(0)} (lumen ${naOn() ? 140 : 0}) · glucose: lumen ${st.GL.toFixed(1)}, cell ${st.GC.toFixed(1)}, blood 5 · absorbed so far ${st.absorbed.toFixed(1)} (of which against its gradient ${st.against.toFixed(1)})<br>rates: pump ${last.pump.toFixed(2)} · co-transport ${last.co.toFixed(2)} · facilitated diffusion in ${last.fa.toFixed(2)} · facilitated diffusion out ${last.fd.toFixed(2)}`;
      const o = opts(); let m;
      if (!naOn()) m = `No Na⁺ in the lumen: there is nothing to move down a Na⁺ gradient through the co-transport protein, so co-transport is zero, however much ATP the cell has. Glucose cannot be taken up against its gradient. ${st.GL > st.GC ? `In this model a little still enters by facilitated diffusion (debated for real cells), because the lumen (${st.GL.toFixed(1)}) is above the cell (${st.GC.toFixed(1)}).` : "The lumen is no longer above the cell, so even the model's facilitated diffusion route has stopped."} Na⁺ in the cell falls only a little (to about ${R.noNa.NaC.toFixed(0)}): Na⁺ still leaks in from the tissue fluid, and the pump slows as cell Na⁺ falls.`;
      else if (!(o.pumpOn && o.atp)) m = `${!o.atp ? "No ATP: the pump cannot work (the co-transport protein itself never used ATP). " : "Pump stopped: "}Na⁺ leaking in is no longer pumped out, so Na⁺ in the cell is ${st.NaC > 110 ? "now close to the lumen value: the Na⁺ gradient has gone, co-transport has stopped and no glucose can be taken up against its gradient." : "rising and the Na⁺ gradient is shrinking, so co-transport is slowing."} ${st.GL > st.GC ? "In this model only slow facilitated diffusion (debated for real cells) can continue while the lumen is above the cell." : "The lumen is not above the cell, so no more glucose is absorbed."} Compare the totals in the table below.`;
      else if (st.GL < 0.6 && last.co < 0.05) m = "The lumen is almost empty of glucose: co-transport has absorbed nearly all of it, taking the lumen well below the cell's concentration. Add another meal to see it again.";
      else if (st.GL < st.GC) m = `Glucose in the lumen (${st.GL.toFixed(1)}) is now LOWER than in the cell (${st.GC.toFixed(1)}), yet it is still absorbed: co-transport moves it against its concentration gradient, driven by the Na⁺ gradient. Diffusion alone could not do this.`;
      else m = `Glucose in the lumen (${st.GL.toFixed(1)}) is higher than in the cell (${st.GC.toFixed(1)}). The pump keeps Na⁺ in the cell low (${st.NaC.toFixed(0)}), so Na⁺ diffuses in through the co-transport protein, carrying glucose.`;
      $("#ct-msg", host).innerHTML = note(m);
      if (hist.length > 1) { const W = 520, pl = 44, tmax = Math.max(80, hist[hist.length - 1].t); const gmax = Math.max(25, Math.ceil(Math.max(...hist.map((p) => Math.max(p.GL, p.GC))) / 5) * 5);
        const a = panel(28, 90, 140, 35, "Na⁺ in the cell (lumen value 140)", [["NaC", "#1e3a5f", ""]], tmax, W, pl);
        const b2 = panel(160, 110, gmax, gmax > 25 ? 10 : 5, "Glucose", [["GL", "#b07a1c", "lumen"], ["GC", "#b4504f", "cell"]], tmax, W, pl);
        const H = 310; let xt = ""; for (let t = 0; t <= tmax; t += tmax > 200 ? 50 : 20) xt += `<text x="${a.X(t).toFixed(1)}" y="${H - 22}" text-anchor="middle" font-size="10.5" fill="#5f6f7f">${t}</text>`;
        const key = `<line x1="${W - 190}" y1="${150}" x2="${W - 172}" y2="150" stroke="#b07a1c" stroke-width="2.5"/><text x="${W - 168}" y="154" font-size="10.5" fill="#16263a">lumen</text><line x1="${W - 120}" y1="150" x2="${W - 102}" y2="150" stroke="#b4504f" stroke-width="2.5"/><text x="${W - 98}" y="154" font-size="10.5" fill="#16263a">cell</text>`;
        $("#ct-chart", host).innerHTML = fig(`<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="two panels against time: Na⁺ in the cell on a 0 to 140 scale, and glucose in the lumen and in the cell" style="max-width:100%;min-width:${A().minW(W)}px;height:auto"><rect width="${W}" height="${H}" fill="#fff"/>${a.g}${b2.g}${key}${xt}<text x="${(W + pl) / 2}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="#5f6f7f">time / steps</text></svg>`); }
    };
    const tick = () => { const s = { ...st, NaL: naOn() ? 140 : 0 }; const r = M.step(s, opts()); st = r.st; last = r.flux; phase++; hist.push({ t: st.t, NaC: st.NaC, GL: st.GL, GC: st.GC }); if (hist.length > 400) hist.shift(); draw(); };
    const stop = () => { clearInterval(timer); timer = null; $("#ct-play", host).textContent = "Run"; draw(); };
    $("#ct-play", host).addEventListener("click", () => { if (timer) { stop(); return; } $("#ct-play", host).textContent = "Pause"; timer = setInterval(() => { if (!alive(host)) { clearInterval(timer); return; } tick(); }, reduced() ? 700 : 300); });
    $("#ct-step", host).addEventListener("click", tick);
    $("#ct-meal", host).addEventListener("click", () => { st.GL = Math.min(40, st.GL + 20); last = preview(); draw(); });
    $("#ct-reset", host).addEventListener("click", () => { stop(); st = M.init(20); hist = []; last = preview(); draw(); });
    $$("#ct-pump, #ct-atp, #ct-na", host).forEach((c) => c.addEventListener("change", () => { last = preview(); draw(); }));
    last = preview(); draw(); qs(spec, host);
  };

  // =============================================================================================
  // 6. Lipid Absorption and Chylomicron Explorer
  // =============================================================================================
  const LSTAGES = [
    ["required", "Micelles in the lumen", "After lipase has acted, bile salts associate with monoglycerides and fatty acids to form micelles: tiny spheres, a few nanometres across, with the hydrophilic parts of the bile salts facing the water. They keep the water-insoluble products dispersed and carry them through the watery contents to the epithelium."],
    ["required", "Release and diffusion into the cell", "Micelles constantly break up and re-form. Next to the microvilli they release the monoglycerides and fatty acids, which are non-polar and lipid-soluble, so they diffuse through the phospholipid bilayer into the epithelial cell. The micelle is not absorbed whole; the bile salts stay in the lumen."],
    ["supporting", "Triglycerides re-formed in the smooth ER", "In the smooth endoplasmic reticulum the monoglycerides and fatty acids are joined again into triglycerides by condensation. This keeps the concentration of free fatty acids in the cell low, so they continue to diffuse in."],
    ["required", "Chylomicrons", "Triglycerides are combined with proteins (and cholesterol and phospholipids) to form chylomicrons, lipoprotein particles whose protein and phospholipid coat keeps them dispersed in water. Lipids are transported as chylomicrons: this is required. Supporting detail: the Golgi apparatus packages the chylomicrons into vesicles."],
    ["supporting", "Exocytosis", "Vesicles carrying chylomicrons move to the cell-surface membrane on the side away from the lumen and fuse with it, releasing the chylomicrons (exocytosis)."],
    ["supporting", "Into the lacteal and the lymph", "Chylomicrons are too large to pass into the blood capillaries, so they enter the lacteal in the centre of the villus. The lymph carries them away and later drains into the blood in a vein near the heart."],
  ];
  B.interactives.digLipidExplorer = function (spec, host) {
    host.innerHTML = head(spec, "step through") + `<div class="row" role="group" aria-label="stages"><button class="btn sm" id="lx-prev">← Previous</button>${LSTAGES.map((s, i) => `<button class="btn sm lx-s" data-i="${i + 1}" aria-pressed="false">${i + 1}</button>`).join("")}<button class="btn sm" id="lx-next">Next →</button><button class="btn sm" id="lx-all" aria-pressed="false">Show all</button></div>
      <div id="lx-view" class="mt"></div><div class="card mt" id="lx-info" aria-live="polite"></div>
      <div class="card mt"><h4>Micelle or chylomicron?</h4><p class="small"><strong>Micelle:</strong> bile salts + monoglycerides + fatty acids; in the lumen; a few nanometres; delivers products to the membrane. <strong>Chylomicron:</strong> triglycerides + proteins (+ cholesterol, phospholipids); made inside the cell; tens to hundreds of nanometres; carried in the lymph.</p></div>`;
    let stage = 1;
    const set = (n) => { stage = n; $("#lx-view", host).innerHTML = fig(A().lipidAbsorption({ stage: n })); const st = n ? LSTAGES[n - 1] : null; $("#lx-info", host).innerHTML = st ? `<h4>Step ${n} of 6: ${st[1]} <span class="badge ${st[0] === "required" ? "teal" : ""}">${st[0]}</span></h4><p class="small">${st[2]}</p>` : `<h4>The whole journey</h4><p class="small">Micelles (lumen) → diffusion through the bilayer → triglycerides re-formed → chylomicrons → exocytosis → lacteal (lymph). Required: micelles, and transport as chylomicrons. Supporting: the organelles (smooth ER, Golgi), exocytosis and the lacteal.</p>`;
      $$(".lx-s", host).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === n))); $("#lx-all", host).setAttribute("aria-pressed", String(n === 0)); $("#lx-prev", host).disabled = n === 1; $("#lx-next", host).disabled = n === 6; };
    $("#lx-prev", host).addEventListener("click", () => set(Math.max(1, (stage || 1) - 1))); $("#lx-next", host).addEventListener("click", () => set(Math.min(6, (stage || 0) + 1)));
    $$(".lx-s", host).forEach((b) => b.addEventListener("click", () => set(+b.dataset.i))); $("#lx-all", host).addEventListener("click", () => set(0));
    set(1); qs(spec, host);
  };
})(window.BIO);
