// Interactives for 3.3.2.1 The light-dependent reaction and 3.3.2.2 The light-independent reaction (Phase 5 Batch 1,
// author U2). Kinds: chloroplastExplorer, ldrStepModel, electronChallenge (3.3.2.1); calvinExplorer, photoIntegration
// (3.3.2.2). Drawings come from B.photoArt, the Calvin cycle counts from B.calvinModel and the challenge outcomes from
// B.ldrModel (data/content/_photo-art.js), so the picture, the numbers and the feedback cannot disagree.
// Accessibility: every control is a native button, checkbox, radio or select; tab rows respond to the arrow keys; text
// changes are announced in polite live regions; clickable parts of a drawing are also listed as buttons in the panel.
// Motion: particles move along their paths only when motion is allowed (they stop after three passes; "Replay" repeats
// them); with reduced motion the arrows alone show the movement. Embedded questions use B.questions.render, so they are
// marked, recorded and count towards mastery.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.photoArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  // Phones (RB-04): each drawing sits in its own sideways-scrolling box from the first render, at its natural width
  // (600 to 660 px, labels 13 to 15 px), the same as after a redraw; laptops are unchanged.
  const phone = () => typeof innerWidth !== "undefined" && innerWidth < 600;
  const SWIPE = `<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
  const fv = (attrs) => `<div class="fig-view${phone() ? " ix-hscroll" : ""}" ${attrs}></div>${phone() ? SWIPE : ""}`;
  const qBlock = (spec) => ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
  // tab row with roving focus (arrow keys, Home, End)
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    return show; };

  // ===================================== Chloroplast Explorer (3.3.2.1) =====================================
  const PARTS = {
    whole: [
      { k: "outer", name: "Outer membrane", text: "The outer of the two membranes of the chloroplast envelope (a chloroplast has a double membrane, 3.1.2.1). It separates the chloroplast from the cytoplasm of the cell." },
      { k: "inner", name: "Inner membrane", text: "The inner membrane of the envelope encloses the stroma. Carbon dioxide and oxygen diffuse across it; transport proteins in it move substances such as triose phosphate out to the cytoplasm." },
      { k: "stroma", name: "Stroma", text: "The fluid inside the inner membrane, around the thylakoids. It contains the enzymes of the light-independent reaction (the Calvin cycle), including rubisco, so it is the site of the light-independent reaction. It also holds starch grains, circular DNA and 70S ribosomes." },
      { k: "granum", name: "Granum (plural grana)", text: "A stack of thylakoids. Stacking packs a very large area of thylakoid membrane into a small organelle, so there is room for a lot of chlorophyll, many electron carriers and many ATP synthase molecules: more light can be absorbed and more ATP made." },
      { k: "thylakoid", name: "Thylakoid", text: "A flattened sac of membrane. The thylakoid membrane contains chlorophyll, the electron carriers of the electron transfer chain and ATP synthase: it is the site of the light-dependent reaction. The space inside each thylakoid is the thylakoid space. Switch to the close-up to see it." },
      { k: "lamella", name: "Intergranal lamella", text: "A thylakoid membrane that links one granum to the next. It also contains chlorophyll, electron carriers and ATP synthase. (Supporting: you will not be asked to name it.)" },
      { k: "starch", name: "Starch grain", text: "Stored starch, an insoluble polysaccharide built from glucose that the chloroplast makes from triose phosphate (3.3.2.2, 3.1.1.2)." },
    ],
    granum: [
      { k: "tmem", name: "Thylakoid membrane", text: "Contains chlorophyll, the electron carriers of the electron transfer chain and ATP synthase: the site of the light-dependent reaction. Its phospholipid bilayer is impermeable to protons, so protons can cross it only through proteins." },
      { k: "tspace", name: "Thylakoid space", text: "The inside of each thylakoid. Protons are pumped into it from the stroma and are released into it by photolysis of water, so its proton concentration becomes much higher than in the stroma: a proton gradient across the thylakoid membrane." },
      { k: "stroma", name: "Stroma (outside the thylakoids)", text: "Protons flow out of the thylakoid space into the stroma through ATP synthase. ATP and reduced NADP are made on the stroma side of the membrane, where the Calvin cycle uses them." },
      { k: "pump", name: "Electron carrier that pumps protons", text: "One of the electron carriers uses energy released from the electrons passing along the chain to move protons from the stroma into the thylakoid space (red arrow pointing in)." },
      { k: "atps", name: "ATP synthase", text: "An enzyme embedded in the thylakoid membrane, with a channel through it. Protons flow through the channel from the thylakoid space into the stroma, down their concentration gradient (red arrow pointing out), and this provides the energy for ATP synthase to catalyse ADP + Pᵢ → ATP. Its head faces the stroma." },
      { k: "granum", name: "Granum", text: "A stack of thylakoids (bracket). The thylakoid spaces of a granum are linked to one another and, through the intergranal lamellae, to other grana." },
      { k: "lamella", name: "Intergranal lamella", text: "A thylakoid membrane linking grana. Its thylakoid space is continuous with the thylakoid spaces of the granum. (Supporting.)" },
    ],
  };
  B.interactives.chloroplastExplorer = function (spec, host) {
    const u = uidOf(); let view = "whole", sel = null, labels = true, sites = false;
    host.innerHTML = head(spec, "click a structure") + B.ix.split(`
      <div class="row" data-r="views" aria-label="choose a view"></div>
      <div class="figure">${fv('data-r="pic"')}</div>`, `
      <div class="row" style="gap:.6rem;flex-wrap:wrap"><label class="small"><input type="checkbox" data-k="labels" checked> Show labels</label><label class="small"><input type="checkbox" data-k="sites"> Show where each reaction happens</label></div>
      <div class="ix-group"><p class="ix-group-title" id="cx-pl-${u}">Structures</p><div class="row" data-r="parts" role="group" aria-labelledby="cx-pl-${u}" style="gap:.3rem;flex-wrap:wrap"></div></div>
      <div class="ix-readout" data-r="info" aria-live="polite"></div>`, { label: "Chloroplast Explorer controls" }) + `<p class="tiny muted mt">Schematic drawing, not to scale: a whole chloroplast is only about 2 to 10 µm long.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), partsBox = $("[data-r=parts]", host);
    const list = () => PARTS[view];
    const draw = () => {
      pic.innerHTML = view === "whole" ? A().chloroplast({ labels, sites, sel }) : A().granum({ labels, sites, sel });
      $$("[data-part]", pic).forEach((g) => g.addEventListener("click", () => pick(g.dataset.part)));
      $$("button", partsBox).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.part === sel)));
      const p = list().find((x) => x.k === sel);
      info.innerHTML = sites ? `<strong>Where each stage happens.</strong> The light-dependent reaction takes place in the <strong>thylakoid membranes</strong>; the light-independent reaction (Calvin cycle) takes place in the <strong>stroma</strong>. The two are side by side, so ATP and reduced NADP made on the stroma side of the thylakoid membranes are used straight away.` : p ? `<strong>${esc(p.name)}.</strong> ${p.text}` : `Click a structure in the drawing, or choose one from the list.`;
    };
    const pick = (k) => { sel = sel === k ? null : k; if (sites) { sites = false; $("[data-k=sites]", host).checked = false; } draw(); };
    const parts = () => { partsBox.innerHTML = list().map((p) => `<button type="button" class="btn sm" data-part="${p.k}" aria-pressed="false">${esc(p.name.replace(/ \(.*\)$/, ""))}</button>`).join(""); $$("button", partsBox).forEach((b) => b.addEventListener("click", () => pick(b.dataset.part))); };
    tabs($("[data-r=views]", host), ["Whole chloroplast", "Close-up of a granum"], (i) => { view = i ? "granum" : "whole"; sel = null; parts(); draw(); });
    $("[data-k=labels]", host).addEventListener("change", (e) => { labels = e.target.checked; draw(); });
    $("[data-k=sites]", host).addEventListener("change", (e) => { sites = e.target.checked; if (sites) sel = null; draw(); });
    renderQs(spec.questions, $("[data-qs]", host) || host);
    parts(); draw();
    host._cx = { pick, view: () => view, sel: () => sel }; // for tests
  };

  // ===================================== Light-Dependent Reaction step model (3.3.2.1) =====================================
  // Each step lists the parts drawn at full strength (others dimmed) and the particles that move: e = electron,
  // h = proton, o = oxygen. Paths are drawn in B.photoArt.ldr (data-mp).
  const LDR_STEPS = [
    { title: "1. Chlorophyll absorbs light", on: ["light1", "light2", "psii", "psi", "stromaL", "lumen"], mv: [],
      text: "Chlorophyll molecules in the thylakoid membrane <strong>absorb light energy</strong>. Only the chlorophyll (and other pigments) absorbs the light. <span class=\"badge\">supporting</span> Chlorophyll is grouped with other pigments in two complexes, <strong>photosystem II</strong> (PSII) and <strong>photosystem I</strong> (PSI)." },
    { title: "2. Light energy excites electrons", on: ["light1", "psii", "chain"], mv: [["e1", "e"]],
      text: "The light energy <strong>excites electrons</strong> in chlorophyll: they are raised to a <strong>higher energy level</strong> and leave the chlorophyll. They are accepted by the first <strong>electron carrier</strong>. Chlorophyll has lost electrons (it is oxidised); the carrier has gained them (it is reduced)." },
    { title: "3. Photolysis of water", on: ["split", "o2", "psii", "lumen"], mv: [["w1", "e"], ["hp2", "h"]],
      text: "Water is split: <strong>2H₂O → 4H⁺ + 4e⁻ + O₂</strong>. The <strong>electrons</strong> replace those lost from chlorophyll. The <strong>protons</strong> are released into the thylakoid space, adding to the proton gradient. <strong>Oxygen</strong> is a by-product: it diffuses out of the chloroplast and is used in respiration or leaves the leaf." },
    { title: "4. The electron transfer chain", on: ["chain", "pump", "psi"], mv: [["e1", "e"], ["e2", "e"], ["e3", "e"], ["e4", "e"]],
      text: "The electrons pass from carrier to carrier along the <strong>electron transfer chain</strong> in the membrane. Each carrier is reduced when it gains electrons and oxidised when it passes them on. At each transfer the electrons <strong>lose some energy</strong>." },
    { title: "5. Protons are pumped into the thylakoid space", on: ["pump", "hpump", "hlumen", "lumen", "stromaL"], mv: [["e2", "e"], ["hp1", "h"]],
      text: "Energy released from the electrons is used by one carrier to <strong>pump protons from the stroma into the thylakoid space</strong>. The proton concentration becomes much higher in the thylakoid space than in the stroma: a <strong>proton gradient</strong> across the thylakoid membrane." },
    { title: "6. Electrons are excited again", on: ["light2", "psi", "fd"], mv: [["e4", "e"], ["e5", "e"]],
      text: "<span class=\"badge\">supporting</span> At the second chlorophyll complex (photosystem I) light energy <strong>excites the electrons again</strong>, raising them to a higher energy level so that they can reduce NADP." },
    { title: "7. NADP is reduced", on: ["fd", "nadp", "hstroma"], mv: [["e5", "e"], ["e6", "e"], ["hs", "h"]],
      text: "At the end of the chain the electrons, together with a proton from the stroma, <strong>reduce NADP</strong>, forming <strong>reduced NADP</strong> on the stroma side of the membrane. <span class=\"badge\">supporting</span> Each NADP accepts two electrons and one proton." },
    { title: "8. ATP synthase makes ATP", on: ["atps", "hflow", "hlumen", "lumen", "stromaL"], mv: [["hf", "h"]],
      text: "Protons <strong>diffuse back from the thylakoid space into the stroma</strong>, down their concentration gradient. The membrane is impermeable to protons, so they pass only through the channel in <strong>ATP synthase</strong>. This flow provides the energy for ATP synthase to catalyse <strong>ADP + Pᵢ → ATP</strong>. Light does not act on ATP synthase. <span class=\"badge\">supporting</span> Making ATP this way is called chemiosmosis." },
    { title: "9. The products", on: null, mv: [["e1", "e"], ["e3", "e"], ["e5", "e"], ["hp1", "h"], ["hf", "h"], ["w1", "e"]],
      text: "Light energy has been transferred to chemical energy in <strong>ATP</strong> and <strong>reduced NADP</strong>. Both are made on the stroma side, where the <strong>light-independent reaction</strong> uses them (<a href=\"#/topic/3.3.2.2\">3.3.2.2</a>). Oxygen is the by-product. ADP, Pᵢ and NADP return from the Calvin cycle to be used again." },
  ];
  // moves particles along the [data-mp] paths of an LDR drawing; returns a stop function
  function animate(svgEl, mv, passes = 3) {
    if (!svgEl || !mv.length || reduced() || typeof requestAnimationFrame === "undefined") return () => {};
    const NS = "http://www.w3.org/2000/svg"; const layer = document.createElementNS(NS, "g"); layer.setAttribute("class", "ps-anim"); layer.setAttribute("aria-hidden", "true"); svgEl.append(layer);
    const C = B.photoArt.COLORS;
    const parts = mv.map(([k, t], i) => { const p = svgEl.querySelector(`[data-mp="${k}"]`); if (!p) return null; const g = document.createElementNS(NS, "g");
      g.innerHTML = t === "e" ? `<circle r="7" fill="${C.EL}" stroke="#fff" stroke-width="1.5"/><text y="4" font-size="10" font-weight="800" fill="#fff" text-anchor="middle">e⁻</text>` : `<circle r="9" fill="#fff" stroke="${C.HP}" stroke-width="1.6"/><text y="4.5" font-size="11" font-weight="800" fill="${C.HP}" text-anchor="middle">H⁺</text>`;
      layer.append(g); return { p, g, len: p.getTotalLength(), delay: i * 0.18 }; }).filter(Boolean);
    const dur = 1500; let t0 = null, raf = 0, alive = true;
    const step = (now) => { if (!alive || !svgEl.isConnected) return; if (t0 === null) t0 = now; const e = (now - t0) / dur; let done = true;
      for (const q of parts) { const f = e - q.delay; const pass = Math.floor(f); if (f < 0) { q.g.style.opacity = "0"; done = false; continue; } if (pass >= passes) { q.g.style.opacity = "0"; continue; } done = false; const fr = f - pass; const pt = q.p.getPointAtLength(q.len * fr); q.g.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`); q.g.style.opacity = fr > 0.9 ? String((1 - fr) * 10) : "1"; }
      if (!done) raf = requestAnimationFrame(step); else layer.remove(); };
    raf = requestAnimationFrame(step);
    return () => { alive = false; cancelAnimationFrame(raf); layer.remove(); };
  }
  B.interactives.ldrStepModel = function (spec, host) {
    let i = 0, stop = () => {};
    host.innerHTML = head(spec, "step-by-step model") + B.ix.split(`
      <div class="figure">${fv('data-r="pic" tabindex="0" role="group" aria-label="light-dependent reaction drawing; left and right arrow keys change the step"')}</div>`, `
      <div class="row" data-r="steps" role="group" aria-label="steps" style="gap:.3rem;flex-wrap:wrap"></div>
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm" data-a="back">← Back</button><button type="button" class="btn sm primary" data-a="next">Next →</button><button type="button" class="btn sm" data-a="replay">↺ Replay</button></div>
      <div class="ix-readout" data-r="text" aria-live="polite"></div>`, { label: "Light-dependent reaction model controls", cls: "ix-wide-stage" }) + `<p class="tiny muted mt">Simplified model: two chlorophyll complexes and three electron carriers stand for many proteins; the numbers of particles are not to scale.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), txt = $("[data-r=text]", host), bar = $("[data-r=steps]", host);
    bar.innerHTML = LDR_STEPS.map((s, k) => `<button type="button" class="btn sm" data-s="${k}" title="${esc(s.title)}" aria-label="step ${k + 1}: ${esc(s.title.replace(/^\d+\.\s*/, ""))}">${k + 1}</button>`).join("");
    const show = (k) => { stop(); i = Math.max(0, Math.min(LDR_STEPS.length - 1, k)); const st = LDR_STEPS[i];
      pic.innerHTML = A().ldr({ on: st.on ? new Set(st.on) : null });
      txt.innerHTML = `<strong>${esc(st.title)}</strong><br>${st.text}`;
      $$("[data-s]", bar).forEach((b) => { const on = +b.dataset.s === i; b.classList.toggle("primary", on); b.setAttribute("aria-current", on ? "step" : "false"); });
      $("[data-a=back]", host).disabled = i === 0; $("[data-a=next]", host).disabled = i === LDR_STEPS.length - 1; $("[data-a=replay]", host).hidden = reduced() || !st.mv.length;
      stop = animate($("svg", pic), st.mv); };
    $$("[data-s]", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.s)));
    $("[data-a=back]", host).addEventListener("click", () => show(i - 1));
    $("[data-a=next]", host).addEventListener("click", () => show(i + 1));
    $("[data-a=replay]", host).addEventListener("click", () => show(i));
    pic.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); } });
    renderQs(spec.questions, $("[data-qs]", host) || host);
    show(0);
    host._ldr = { show, step: () => i, n: LDR_STEPS.length }; // for tests
  };
  B.interactives.ldrStepModel.STEPS = LDR_STEPS;

  // ===================================== Electron Transfer Challenge (3.3.2.1) =====================================
  B.interactives.electronChallenge = function (spec, host) {
    const M = B.ldrModel; const keys = Object.keys(M.SCEN); let cur = keys[0]; const u = uidOf();
    host.innerHTML = head(spec, "predict, then check") + B.ix.split(`
      <div class="row" data-r="tabs" aria-label="choose a change" style="gap:.3rem;flex-wrap:wrap"></div>
      <p class="small" data-r="setup" aria-live="polite" style="margin:.3rem 0"></p>
      <div class="figure">${fv('data-r="pic"')}</div>`, `
      <fieldset><legend>Your predictions</legend><div data-r="grid" class="ec-grid" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.3rem .5rem;align-items:center"></div></fieldset>
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="check">Check predictions</button><button type="button" class="btn sm" data-a="reset">Try again</button></div>
      <div data-r="fb" aria-live="polite"></div>`, { label: "Electron Transfer Challenge controls" }) + `<p class="tiny muted mt">The set-up: thylakoids isolated from chloroplasts, lit, in a solution with plenty of ADP, phosphate and NADP, so only the light-dependent reaction is involved. Predictions describe what happens soon after the change. Simplified model: no values are implied.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), grid = $("[data-r=grid]", host), fb = $("[data-r=fb]", host);
    const opts = M.CHOICES.map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
    const build = () => { const S = M.SCEN[cur]; pic.innerHTML = A().ldr({ scen: cur }); $("[data-r=setup]", host).innerHTML = `<strong>${esc(S.name)}.</strong> ${esc(S.setup)}`;
      grid.innerHTML = M.Q.map((q) => `<label class="small" for="ec-${u}-${q}">${esc(M.QN[q])}</label><select id="ec-${u}-${q}" data-q="${q}"><option value="">choose…</option>${opts}</select>`).join(""); fb.innerHTML = ""; };
    // feedback stays compact so it fits beside the predictions at 1280 x 800: one line per row (with the answer for a
    // wrong row), then every explanation, wrong rows first, in a details element (stretch points included)
    const check = () => { const S = M.SCEN[cur]; let right = 0, blank = 0; const lines = [], wrong = [], good = [];
      M.Q.forEach((q) => { const sel = $(`[data-q=${q}]`, grid); const v = sel.value; if (!v) { blank++; return; } const ok = S.ans[q].includes(v); if (ok) right++; sel.style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)";
        const best = M.CHOICES.filter(([c]) => S.ans[q].includes(c)).map(([, t]) => t).join(" or ");
        lines.push(`<li><strong>${esc(M.QN[q])}: ${ok ? "✓" : "✗"}</strong> ${ok ? esc(M.CHOICES.find(([c]) => c === v)[1]) : `answer: ${esc(best)}`}</li>`);
        (ok ? good : wrong).push(`<li><strong>${esc(M.QN[q])}${ok ? "" : " (✗)"}.</strong> ${esc(S.why[q])}</li>`); });
      const why = `<details class="small" style="margin-top:.3rem"${right === M.Q.length ? "" : " data-wrong"}><summary>${wrong.length ? "Why? Read the explanations, starting with the rows marked ✗" : "Why? Read the explanations"}</summary><ul style="margin:.2rem 0 0 1rem;padding:0">${wrong.join("")}${good.join("")}</ul></details>`;
      fb.innerHTML = blank ? `<p class="small" role="status">Make a prediction for every row first (${blank} still to choose).</p>` : `<div class="ix-readout"><strong>${right} of ${M.Q.length} correct.</strong><ul class="small" style="margin:.3rem 0 0 1rem;padding:0">${lines.join("")}</ul>${why}</div>`; };
    tabs($("[data-r=tabs]", host), keys.map((k) => M.SCEN[k].name), (i) => { cur = keys[i]; build(); });
    $("[data-a=check]", host).addEventListener("click", check);
    $("[data-a=reset]", host).addEventListener("click", build);
    renderQs(spec.questions, $("[data-qs]", host) || host);
    build();
    host._ec = { set: (k) => { cur = k; build(); }, check, grid: () => grid }; // for tests
  };

  // ===================================== Calvin Cycle Explorer (3.3.2.2) =====================================
  B.interactives.calvinExplorer = function (spec, host) {
    const M = B.calvinModel; let rounds = 1, idx = 0, all = M.states(1);
    host.innerHTML = head(spec, "carbon accounting") + `<p class="small"><strong>Basis:</strong> one round = <strong>3 CO₂ fixed</strong>. Three is the smallest number that gives one whole TP to leave the cycle.</p>` + B.ix.split(`
      <div class="row" data-r="steps" role="group" aria-label="steps" style="gap:.3rem;flex-wrap:wrap;margin-bottom:.3rem"></div>
      <div class="figure">${fv('data-r="pic" tabindex="0" role="group" aria-label="Calvin cycle drawing; left and right arrow keys change the step"')}</div>`, `
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm" data-a="back">← Back</button><button type="button" class="btn sm primary" data-a="next">Next →</button><button type="button" class="btn sm" data-a="more">Another round</button></div>
      <div class="ix-readout" data-r="text" aria-live="polite"></div>
      <div data-r="ledger"></div>`, { label: "Calvin Cycle Explorer controls" }) + `<p class="tiny muted mt">In a chloroplast all these steps run at the same time, in many copies of the cycle; the explorer takes them one at a time so you can count the carbon atoms.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), txt = $("[data-r=text]", host), led = $("[data-r=ledger]", host), bar = $("[data-r=steps]", host);
    const names = ["Start", "1 Fixation", "2 Reduction", "3 TP leaves", "4 Regeneration"];
    bar.innerHTML = names.map((n, k) => `<button type="button" class="btn sm" data-s="${k}">${n}</button>`).join("");
    const show = (k) => { idx = Math.max(0, Math.min(all.length - 1, k)); const st = all[idx], S = M.STEPS.find((x) => x.id === st.step), C = M.carbon(st);
      pic.innerHTML = A().calvin(st, { hi: S.hi });
      txt.innerHTML = `<strong>${rounds > 1 ? `Round ${st.round}: ` : ""}${esc(S.title)}</strong><br>${S.text}`;
      const row = (n, mol, c) => `<tr><td>${n}</td><td>${mol}</td><td>${c}</td></tr>`;
      led.innerHTML = `<table class="tbl" style="width:100%"><thead><tr><th>Molecule</th><th>Number</th><th>C atoms</th></tr></thead><tbody>${row("RuBP (5C)", st.rubp, C.rubp)}${row("CO₂ (1C)", st.co2, C.co2)}${row("GP (3C)", st.gp, C.gp)}${row("TP (3C)", st.tp, C.tp)}${row("TP that left", st.out, C.out)}<tr><th>Total</th><th></th><th>${M.total(st)}</th></tr></tbody></table>
        <p class="small" style="margin:.35rem 0 0">Check: 15 C (starting RuBP) + ${st.round * 3} C (CO₂) = <strong>${15 + st.round * 3}</strong>. Used: <strong>${st.atp} ATP</strong>, <strong>${st.nadph} reduced NADP</strong>.</p>`;
      const local = idx % 5; $$("[data-s]", bar).forEach((b) => { const on = +b.dataset.s === local; b.classList.toggle("primary", on); b.setAttribute("aria-current", on ? "step" : "false"); });
      $("[data-a=back]", host).disabled = idx === 0; $("[data-a=next]", host).disabled = idx === all.length - 1; $("[data-a=more]", host).hidden = !(idx === all.length - 1 && rounds < 2); };
    $$("[data-s]", bar).forEach((b) => b.addEventListener("click", () => show(Math.floor(idx / 5) * 5 + +b.dataset.s)));
    $("[data-a=back]", host).addEventListener("click", () => show(idx - 1));
    $("[data-a=next]", host).addEventListener("click", () => show(idx + 1));
    $("[data-a=more]", host).addEventListener("click", () => { rounds = 2; all = M.states(2); show(5); });
    pic.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); } });
    renderQs(spec.questions, $("[data-qs]", host) || host);
    show(0);
    host._cc = { show, state: () => all[idx] }; // for tests
  };

  // ===================================== Photosynthesis Integration Explorer (3.3.2.2) =====================================
  const TRACE = {
    none: { name: "Whole picture", text: "The two stages run side by side in the chloroplast. The light-dependent reaction in the thylakoid membranes makes <strong>ATP</strong> and <strong>reduced NADP</strong>; the Calvin cycle in the stroma uses them to reduce GP to TP, and returns <strong>ADP, Pᵢ and NADP</strong>. Neither stage can keep going without the other." },
    energy: { name: "Energy", text: "<strong>Light energy</strong> enters at chlorophyll in the thylakoid membranes. It becomes <strong>chemical energy</strong> in ATP and reduced NADP, which are used to reduce GP to TP. The energy ends up in TP and in the organic substances made from it: this is how energy enters the ecosystem." },
    carbon: { name: "Carbon", text: "Carbon enters as <strong>CO₂</strong>, which rubisco fixes by combining it with <strong>RuBP</strong> to form <strong>GP</strong>. GP is reduced to <strong>TP</strong>. Some TP regenerates RuBP; the rest leaves the cycle to make glucose, starch, lipids, amino acids and other substances. No carbon passes through the light-dependent reaction." },
    hydrogen: { name: "Hydrogen", text: "Photolysis of <strong>water</strong> releases electrons and protons. Electrons pass along the electron transfer chain and, with a proton, <strong>reduce NADP</strong>. Reduced NADP then supplies the hydrogen (electrons) that <strong>reduces GP to TP</strong>." },
    oxygen: { name: "Oxygen", text: "The oxygen released comes from <strong>water</strong>, split by photolysis in the light-dependent reaction, not from carbon dioxide. It diffuses out of the chloroplast; some is used in respiration and the rest leaves the leaf." },
    recycle: { name: "Recycling", text: "The Calvin cycle turns ATP into <strong>ADP + Pᵢ</strong> and reduced NADP into <strong>NADP</strong>. These return to the thylakoid membranes to be used again. If the Calvin cycle stops, NADP is not returned, so the light-dependent reaction soon runs short of NADP to reduce." },
  };
  const COND = {
    normal: { name: "Light and CO₂ available", text: "" },
    dark: { name: "Light switched off", text: "<strong>Light switched off.</strong> The light-dependent reaction stops, so no more ATP or reduced NADP is made. Within a short time GP can no longer be reduced to TP, so <strong>GP builds up</strong> and TP production stops. Without TP, <strong>RuBP is not regenerated</strong>, but it is still used up by fixation, so the <strong>RuBP concentration falls</strong> to a low level. The light-independent reaction depends on the light-dependent reaction: it does not carry on in the dark." },
    lowco2: { name: "CO₂ lowered", text: "<strong>Carbon dioxide concentration lowered.</strong> Less CO₂ is fixed, so <strong>less GP is made</strong> and the GP concentration falls. RuBP is still regenerated from the TP already in the cycle but is used more slowly, so the <strong>RuBP concentration rises</strong>. Less ATP and reduced NADP are used, so less ADP and NADP return to the thylakoids. (Limiting factors: <a href=\"#/topic/3.3.2.3\">3.3.2.3</a>.)" },
  };
  B.interactives.photoIntegration = function (spec, host) {
    const u = uidOf(); let tr = "none", cond = "normal";
    host.innerHTML = head(spec, "how the two stages connect") + B.ix.split(`
      <div class="figure">${fv('data-r="pic"')}</div>
      <div class="figure" data-r="graphbox" hidden>${fv('data-r="graph"')}<p class="tiny muted" style="margin:.2rem 0 0">Sketch: shape only, no values.</p></div>`, `
      <fieldset><legend>Follow</legend>${Object.entries(TRACE).map(([k, t], i) => `<label class="small"><input type="radio" name="pi-t-${u}" value="${k}"${i ? "" : " checked"}> ${esc(t.name)}</label>`).join("")}</fieldset>
      <fieldset><legend>Conditions</legend>${Object.entries(COND).map(([k, t], i) => `<label class="small"><input type="radio" name="pi-c-${u}" value="${k}"${i ? "" : " checked"}> ${esc(t.name)}</label>`).join("")}</fieldset>
      <div class="ix-readout" data-r="text" aria-live="polite"></div>`, { label: "Photosynthesis Integration Explorer controls" }) + qBlock(spec);
    const pic = $("[data-r=pic]", host), txt = $("[data-r=text]", host), gb = $("[data-r=graphbox]", host);
    const draw = () => { pic.innerHTML = A().integration({ trace: tr === "none" ? null : tr, cond });
      gb.hidden = cond === "normal"; $("[data-r=graph]", host).innerHTML = cond === "normal" ? "" : A().sketch(cond);
      txt.innerHTML = (cond !== "normal" ? `<p style="margin:0 0 .4rem">${COND[cond].text}</p>` : "") + `<p style="margin:0"><strong>${esc(TRACE[tr].name)}.</strong> ${TRACE[tr].text}</p>`; };
    $$(`input[name=pi-t-${u}]`, host).forEach((r) => r.addEventListener("change", () => { tr = r.value; draw(); }));
    $$(`input[name=pi-c-${u}]`, host).forEach((r) => r.addEventListener("change", () => { cond = r.value; draw(); }));
    renderQs(spec.questions, $("[data-qs]", host) || host);
    draw();
    host._pi = { set: (t, c) => { if (t) tr = t; if (c) cond = c; draw(); } }; // for tests
  };
})(window.BIO);
