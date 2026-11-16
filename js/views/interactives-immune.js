// Interactives for 3.2.5 The defensive functions of mammalian blood (Phase 4 Batch 2, owned by the 3.2.5 author).
// Kinds: imExplorer and imPhago (3.2.5.1), imResponse, imHerd and imTrial (3.2.5.3). The Antigen–Antibody Binding
// Challenge (imBinding, 3.2.5.2) was removed on 2026-11-15 (release review: word matching that added nothing).
// Drawings come from B.immuneArt and every number from B.immuneModel (data/content/_immune-art.js), so the picture, the
// figures quoted on the page and the embedded questions share one source. Embedded questions use B.questions.render, so
// they are marked, recorded and counted towards mastery like any other question.
// Accessibility: every control is a native button, radio, checkbox, range or number input with a visible label; tab rows
// use a roving tab stop (arrow keys, Home, End); figures that step also respond to the left and right arrow keys;
// changes are announced in polite live regions; the herd grid encodes vaccination by SHAPE (square) and state by fill,
// so nothing depends on colour alone. Motion: automatic playing (phagocytosis, herd simulation) is unavailable when
// reduced motion is requested (system setting or the site preference); stepping by hand always works. UI text uses CSS
// tokens; SVGs sit on the light panel the site gives .interactive-host svg in dark mode; layouts wrap at 390 px.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion) || document.documentElement.classList.contains("reduce-motion");
  const A = () => B.immuneArt, M = () => B.immuneModel;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .25s"; node.style.opacity = "1"; }); };
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const lvl = (l) => `<span class="badge ${l === "required" ? "teal" : l === "stretch" ? "amber" : ""}">${esc(l)}</span>`;
  const f1 = (x) => M().fix(x, 1), f2 = (x) => M().fix(x, 2);
  const tabs = (bar, labels, panes, onShow) => {
    let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm" role="tab" id="${bar.id}-t${i}" data-i="${i}" aria-selected="${i === 0}" aria-controls="${panes[i].id}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    panes.forEach((p, i) => { p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", `${bar.id}-t${i}`); p.tabIndex = 0; });
    const show = (i, focus) => { cur = Math.max(0, Math.min(labels.length - 1, i)); $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); panes.forEach((p, k) => { p.hidden = k !== cur; }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show((ni + labels.length) % labels.length, true); });
    show(0); return show;
  };

  // ======================================== 1. Immune System Explorer ========================================
  // spec.cells: [{key, name, level, levelNote?, func, where, mixup}] ; spec.challenge: [{key, prompt, why}]
  B.interactives.imExplorer = function (spec, host) {
    const uid = uidOf(); const cells = spec.cells || []; const ch = spec.challenge || [];
    const st = { mode: "explore", sel: null, qi: 0, score: 0, answered: false };
    host.innerHTML = head(spec, "schematic") + `
      <div class="ix"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view" data-r="fig">${A().explorerScene()}</div></div>
        <div class="row" data-r="list" style="flex-wrap:wrap;gap:.3rem;margin-top:.4rem" role="group" aria-label="cells and molecules"></div></div><div class="ix-panel">
      <fieldset><legend class="small" style="font-weight:600">Mode</legend>
        <label class="small"><input type="radio" name="ie-mode-${uid}" value="explore" checked> Explore: select a cell or molecule</label>
        <label class="small"><input type="radio" name="ie-mode-${uid}" value="challenge"> Function challenge (${ch.length} questions)</label></fieldset>
      <div data-r="prompt" class="notice small" hidden></div>
        <div><div class="card" data-r="info" style="background:var(--surface-2);padding:.6rem .75rem" aria-live="polite"><p class="small muted">Select a cell or molecule in the picture or from the buttons under it.</p></div>
          <div class="row mt" data-r="chctl" hidden><button type="button" class="btn sm primary" data-a="next">Next question</button><button type="button" class="btn sm" data-a="restart">Start again</button></div></div>
      </div></div></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    q("list").innerHTML = cells.map((c) => `<button type="button" class="btn sm" style="padding:.15rem .5rem;font-size:.8rem" data-key="${esc(c.key)}" aria-pressed="false">${esc(c.name)}</button>`).join("");
    const parts = $$("[data-part]", q("fig"));
    const hl = (key) => { parts.forEach((g) => g.classList.toggle("hl", g.dataset.part === key)); $$("[data-key]", q("list")).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === key))); };
    const info = (c) => `<div class="row" style="flex-wrap:wrap;gap:.4rem"><strong>${esc(c.name)}</strong>${lvl(c.level)}${c.levelNote ? `<span class="tiny muted">${esc(c.levelNote)}</span>` : ""}</div><p class="small mt"><strong>Function.</strong> ${c.func}</p>${c.where ? `<p class="small"><strong>Where and when.</strong> ${c.where}</p>` : ""}${c.mixup ? `<p class="small"><strong>Do not confuse.</strong> ${c.mixup}</p>` : ""}`;
    const showPrompt = () => { const it = ch[st.qi]; q("prompt").hidden = false; st.answered = false; q("prompt").innerHTML = it ? `<strong>Question ${st.qi + 1} of ${ch.length}.</strong> Which cell or molecule ${esc(it.prompt)}` : `<strong>Finished: ${st.score} of ${ch.length} correct.</strong> Switch to Explore to revise any you missed.`; $('[data-a="next"]', host).disabled = true; if (!it) $('[data-a="next"]', host).hidden = true; };
    const pick = (key) => {
      const c = cells.find((x) => x.key === key); if (!c) return; hl(key);
      if (st.mode === "explore") { q("info").innerHTML = info(c); return; }
      const it = ch[st.qi]; if (!it || st.answered) return; st.answered = true; const ok = key === it.key; if (ok) st.score++;
      const right = cells.find((x) => x.key === it.key);
      q("info").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}"><strong>${ok ? "Correct" : "Not this one"}:</strong> ${ok ? esc(right.name) : `you chose ${esc(c.name)}; the answer is ${esc(right.name)}`}.<div class="small mt">${it.why || right.func}</div></div><p class="tiny muted">Score so far: ${st.score} of ${st.qi + 1}.</p>`;
      hl(it.key); $('[data-a="next"]', host).disabled = false; $('[data-a="next"]', host).focus();
    };
    parts.forEach((g) => { g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); const c = cells.find((x) => x.key === g.dataset.part); if (c) g.setAttribute("aria-label", c.name); g.addEventListener("click", () => pick(g.dataset.part)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g.dataset.part); } }); });
    $$("[data-key]", q("list")).forEach((b) => b.addEventListener("click", () => pick(b.dataset.key)));
    $$(`input[name="ie-mode-${uid}"]`, host).forEach((r) => r.addEventListener("change", () => { st.mode = r.value; hl(null); q("chctl").hidden = st.mode !== "challenge"; if (st.mode === "challenge") { st.qi = 0; st.score = 0; $('[data-a="next"]', host).hidden = false; showPrompt(); q("info").innerHTML = '<p class="small muted">Choose your answer in the picture or from the buttons.</p>'; } else { q("prompt").hidden = true; q("info").innerHTML = '<p class="small muted">Select a cell or molecule in the picture or from the buttons.</p>'; } }));
    $('[data-a="next"]', host).addEventListener("click", () => { st.qi++; hl(null); showPrompt(); q("info").innerHTML = st.qi < ch.length ? '<p class="small muted">Choose your answer.</p>' : ""; });
    $('[data-a="restart"]', host).addEventListener("click", () => { st.qi = 0; st.score = 0; hl(null); $('[data-a="next"]', host).hidden = false; showPrompt(); q("info").innerHTML = '<p class="small muted">Choose your answer.</p>'; });
    renderQs(spec.questions, q("q"));
  };

  // ======================================== 2. Phagocytosis step-through ========================================
  // Release review (2026-11-15): the step-through now uses the page's five-panel phagocytosis strip as its frames (the
  // separate static figure was removed). Step 0 shows the whole strip; steps 1 to 5 highlight one panel and pale the
  // others. The step text is shown once, under the strip. On narrow screens the strip scrolls sideways and the current
  // panel is scrolled into view.
  // spec.steps: [{title, text}] (five, in the order of the strip's panels)
  B.interactives.imPhago = function (spec, host) {
    const uid = uidOf(); const steps = spec.steps || []; const n = steps.length || 5; const st = { k: 0, timer: null };
    host.innerHTML = head(spec, "step through") + `<style>.ph${uid} svg { min-width: 760px; }</style>
      <div class="figure mt" style="margin-bottom:0"><div class="fig-view ph${uid}" data-r="fig" tabindex="0" role="group" aria-label="phagocytosis strip; use the left and right arrow keys to change step" style="overflow-x:auto"></div></div>
      <div class="row mt" style="flex-wrap:wrap;gap:.4rem;align-items:center">
        <button type="button" class="btn sm" data-a="prev">◀ Previous</button>
        <button type="button" class="btn sm primary" data-a="play" aria-pressed="false">▶ Play</button>
        <button type="button" class="btn sm" data-a="next">Next ▶</button>
        <button type="button" class="btn sm" data-a="restart">Show all</button>
        <span class="small" data-r="pos" aria-hidden="true"></span></div>
      <p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>
      <p class="tiny muted" data-r="rm" hidden>Automatic play is off because reduced motion is switched on. Use Previous and Next.</p>
      <div class="small mt" data-r="text" aria-live="polite"></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const play = $('[data-a="play"]', host);
    const stop = () => { if (st.timer) clearInterval(st.timer); st.timer = null; play.textContent = "▶ Play"; play.setAttribute("aria-pressed", "false"); };
    const draw = () => { st.k = Math.max(0, Math.min(n, st.k)); const fig = q("fig"); fig.innerHTML = A().phagocytosisPhoto({ active: st.k || null });
      const s = steps[st.k - 1];
      q("text").innerHTML = st.k ? `<p style="margin:0"><strong>Step ${st.k} of ${n}: ${esc(s.title)}.</strong> ${s.text}</p>` : `<p style="margin:0" class="muted">All five steps are shown. Press Next to go through them one at a time.</p>`;
      q("pos").textContent = st.k ? `Step ${st.k} of ${n}` : "";
      $('[data-a="prev"]', host).disabled = st.k <= 0; $('[data-a="next"]', host).disabled = st.k >= n;
      if (st.k && fig.scrollWidth > fig.clientWidth + 2) { const sv = $("svg", fig); const f = [0.09, 0.27, 0.44, 0.62, 0.84][st.k - 1]; fig.scrollLeft = Math.max(0, sv.getBoundingClientRect().width * f - fig.clientWidth / 2); } };
    $('[data-a="prev"]', host).addEventListener("click", () => { stop(); st.k--; draw(); });
    $('[data-a="next"]', host).addEventListener("click", () => { stop(); st.k++; draw(); });
    $('[data-a="restart"]', host).addEventListener("click", () => { stop(); st.k = 0; draw(); });
    play.addEventListener("click", () => { if (st.timer) { stop(); return; } if (reduced()) return; if (st.k >= n) st.k = 0; st.k++; draw(); play.textContent = "❚❚ Pause"; play.setAttribute("aria-pressed", "true");
      st.timer = setInterval(() => { if (!document.body.contains(host)) { stop(); return; } if (st.k >= n) { stop(); return; } st.k++; draw(); }, 3500); });
    if (reduced()) { play.disabled = true; q("rm").hidden = false; }
    q("fig").addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { stop(); st.k++; draw(); e.preventDefault(); } else if (e.key === "ArrowLeft") { stop(); st.k--; draw(); e.preventDefault(); } });
    draw(); renderQs(spec.questions, q("q"));
  };

  // ======================================== 4. Primary versus Secondary Immune Response ========================================
  B.interactives.imResponse = function (spec, host) {
    const uid = uidOf(); const st = { second: 50, log: false, ghost: true, people: false };
    host.innerHTML = head(spec, "illustrative data") + `
      <div class="row mt" style="flex-wrap:wrap;gap:1rem;align-items:center">
        <label class="small" for="ir-sec-${uid}"><strong>Day of second exposure:</strong> <output data-r="secv">50</output></label>
        <input type="range" id="ir-sec-${uid}" min="25" max="100" step="5" value="50" style="max-width:220px">
        <label class="small"><input type="checkbox" data-a="log"> Log scale <span class="badge amber">stretch</span></label>
        <label class="small"><input type="checkbox" data-a="ghost" checked> Show what happens with no second exposure</label>
        <label class="small"><input type="checkbox" data-a="people"> Show 8 different people <span class="badge amber">stretch</span></label></div>
      <div class="figure mt"><div class="fig-view" data-r="fig"></div></div>
      <div class="grid grid-2 mt" style="gap:1rem"><div><h4>Readings from the graph</h4><div data-r="tbl"></div></div><div><h4>What explains the difference</h4><div class="small" data-r="why"></div></div></div>
      <p class="small mt" data-r="var" hidden></p>
      <p class="tiny muted" aria-live="polite" data-r="live"></p>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const ppl = M().people(8, 7);
    const draw = () => { const fig = q("fig"); fig.innerHTML = A().responseGraph({ second: st.second, log: st.log, ghost: st.ghost, people: st.people ? ppl : [] }); const R = M().respSummary({ second: st.second });
      q("secv").textContent = String(st.second);
      q("tbl").innerHTML = `<table class="tbl"><thead><tr><th></th><th>Primary</th><th>Secondary</th></tr></thead><tbody><tr><td>Lag before antibody rises</td><td>about ${R.pLag} days (typical; varies)</td><td>about ${R.sLag} days (typical; varies)</td></tr><tr><td>Peak (day)</td><td>day ${R.pPeakDay}</td><td>day ${R.sPeakDay} (${R.sPeakDay - st.second} days after exposure)</td></tr><tr><td>Peak concentration</td><td>${R.pPeak} relative unit</td><td>${R.sPeak} relative units (${R.ratio} times higher)</td></tr><tr><td>Fall after the peak</td><td>faster</td><td>slower</td></tr></tbody></table><p class="tiny muted">Illustrative values: real values vary.</p>`;
      q("live").textContent = `Second exposure on day ${st.second}; ${st.log ? "log" : "linear"} scale${st.people ? "; eight people shown" : ""}.`;
      q("var").hidden = !st.people; };
    q("why").innerHTML = spec.why || "";
    q("var").innerHTML = spec.variability || "";
    $(`#ir-sec-${uid}`, host).addEventListener("input", (e) => { st.second = +e.target.value; draw(); });
    $('[data-a="log"]', host).addEventListener("change", (e) => { st.log = e.target.checked; draw(); });
    $('[data-a="ghost"]', host).addEventListener("change", (e) => { st.ghost = e.target.checked; draw(); });
    $('[data-a="people"]', host).addEventListener("change", (e) => { st.people = e.target.checked; draw(); });
    draw(); renderQs(spec.questions, q("q"));
  };

  // ======================================== 5. Vaccination and Herd Immunity Simulator ========================================
  // Release review (2026-11-15): reduced to two settings (coverage and vaccine effectiveness) and one Run button. Each run
  // simulates several outbreaks with the same settings (B.immuneModel.herdTypical) and animates a TYPICAL one (the median
  // size), so a single run is never a misleading lucky or unlucky outbreak. Model documentation stays in the model's code
  // comments (data/content/_immune-art.js); students see one plain sentence.
  B.interactives.imHerd = function (spec, host) {
    const uid = uidOf(); const P = { coverage: 50, eff: 90 }; let sim = null, frame = 0, timer = null;
    const slider = (k, label, min, max, stepv, val) => `<label class="small" for="ih-${k}-${uid}" style="display:block"><strong>${label}:</strong> <output data-o="${k}">${val} %</output></label><input type="range" id="ih-${k}-${uid}" data-k="${k}" min="${min}" max="${max}" step="${stepv}" value="${val}" style="width:100%">`;
    host.innerHTML = head(spec, "simplified model") + `
      <div class="ix ix-fit-2"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view" data-r="grid"></div></div><div class="figure"><div class="fig-view" data-r="chart"></div></div></div><div class="ix-panel">
        <div>${slider("coverage", "Vaccination coverage", 0, 100, 5, P.coverage)}${slider("eff", "Vaccine effectiveness", 50, 100, 5, P.eff)}</div>
        <div class="row" style="flex-wrap:wrap;gap:.4rem"><button type="button" class="btn sm primary" data-a="run">▶ Run outbreak</button></div>
        <p class="tiny" style="margin:0"><span aria-hidden="true">○</span> not vaccinated · <span aria-hidden="true">□</span> vaccinated · red = infectious · grey = recovered · pale green = protected by the vaccine</p>
        <div class="small" data-r="stats" aria-live="polite"></div>
        <p class="tiny muted" style="margin:0">A simplified model of 400 people who mix at random. Real populations are clustered, so outbreaks can start where coverage is low.</p>
      </div></div></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const runB = $('[data-a="run"]', host);
    const stop = () => { if (timer) clearInterval(timer); timer = null; runB.textContent = "▶ Run outbreak"; };
    const show = () => { frame = Math.max(0, Math.min(frame, sim.frames.length - 1)); q("grid").innerHTML = A().herdGrid(sim, frame); q("chart").innerHTML = A().herdChart(sim, frame);
      const fin = frame === sim.frames.length - 1;
      q("stats").innerHTML = fin ? `<strong>Unvaccinated people infected: ${sim.infUnvacc} of ${sim.nUnvacc}</strong> (everyone infected: ${sim.everInf} of ${sim.N}).` : `Running: ${sim.history[frame].I + sim.history[frame].R} people infected so far.`; };
    const run = () => { stop(); sim = M().herdTypical({ coverage: P.coverage / 100, eff: P.eff / 100 }); frame = 0;
      if (reduced()) { frame = sim.frames.length - 1; show(); return; }
      show(); runB.textContent = "❚❚ Stop"; timer = setInterval(() => { if (!document.body.contains(host)) { stop(); return; } if (frame >= sim.frames.length - 1) { stop(); return; } frame++; show(); }, 250); };
    $$("input[type=range]", host).forEach((inp) => inp.addEventListener("input", () => { P[inp.dataset.k] = +inp.value; $(`[data-o="${inp.dataset.k}"]`, host).textContent = inp.value + " %"; }));
    $$("input[type=range]", host).forEach((inp) => inp.addEventListener("change", () => { stop(); sim = M().herdTypical({ coverage: P.coverage / 100, eff: P.eff / 100 }); frame = sim.frames.length - 1; show(); }));
    runB.addEventListener("click", () => { if (timer) { stop(); frame = sim.frames.length - 1; show(); return; } run(); });
    sim = M().herdTypical({ coverage: P.coverage / 100, eff: P.eff / 100 }); frame = sim.frames.length - 1; show(); renderQs(spec.questions, q("q"));
  };

  // ======================================== 6. Clinical Trial Evaluation ========================================
  // spec.items: [{key: design|results|size|bias|ethics|real, label, questions}] ; spec.ethics: [{q, options:[{t, ok, fb}]}]
  B.interactives.imTrial = function (spec, host) {
    const uid = uidOf(); const items = spec.items || []; const T = M().TRIAL, S = M().trialStats(), W = M().STUDY_W, PK = M().POLACK, v = T.vac, p = T.pla;
    host.innerHTML = head(spec, "hypothetical and published data") + `<div class="row mt" role="tablist" aria-label="parts of the trial evaluation" id="it-tabs-${uid}" style="flex-wrap:wrap;gap:.35rem"></div><div data-r="panes" class="mt"></div>`;
    const panesHost = $('[data-r="panes"]', host);
    const panes = items.map((it, i) => { const d = document.createElement("div"); d.id = `it-pane-${uid}-${i}`; d.hidden = true; panesHost.append(d); return d; });
    const work = (summary, body) => `<details class="small mt"><summary>${summary}</summary><p>${body}</p></details>`;
    const resTable = `<table class="tbl"><thead><tr><th>Outcome (HYPOTHETICAL)</th><th>${esc(v.name)}</th><th>${esc(p.name)}</th></tr></thead><tbody>
      <tr><td>Randomised</td><td>${v.randomised}</td><td>${p.randomised}</td></tr><tr><td>Analysed (completed both injections and follow-up)</td><td>${v.analysed}</td><td>${p.analysed}</td></tr>
      <tr><td>Laboratory-confirmed cases of disease Y</td><td>${v.cases}</td><td>${p.cases}</td></tr><tr><td>Severe cases</td><td>${v.severe}</td><td>${p.severe}</td></tr>
      <tr><td>Pain at the injection site (within 7 days)</td><td>${v.pain}</td><td>${p.pain}</td></tr><tr><td>Fever (within 7 days)</td><td>${v.fever}</td><td>${p.fever}</td></tr><tr><td>Serious adverse events (any cause)</td><td>${v.sae}</td><td>${p.sae}</td></tr></tbody></table><p class="tiny muted">${esc(T.note)}</p>`;
    const content = {
      design: () => `<div class="card"><h4>${esc(T.title)}</h4><p class="small"><strong>Disease:</strong> ${esc(T.disease)}. <strong>Participants:</strong> ${esc(T.population)}.</p><p class="small"><strong>Design:</strong> ${esc(T.design)}</p><div class="figure"><div class="fig-view">${A().trialFlow()}</div></div>
        <table class="tbl small mt"><thead><tr><th>Design feature</th><th>Why it matters</th></tr></thead><tbody><tr><td>Placebo control group</td><td>Shows how many cases would occur without the vaccine in the same period and place.</td></tr><tr><td>Random allocation</td><td>Groups are alike in age, health and exposure, so differences in cases are due to the vaccine (removes selection bias).</td></tr><tr><td>Double-blind, identical injections</td><td>Participants do not change behaviour and staff do not judge symptoms differently because they know the group.</td></tr><tr><td>Large sample (thousands)</td><td>Enough cases to detect a real difference and reduce the effect of chance (with only about 3 placebo cases in 100 people, one extra case changes the efficacy greatly); rare side effects more likely to be seen.</td></tr><tr><td>Laboratory-confirmed cases</td><td>Avoids counting other illnesses with similar symptoms.</td></tr><tr><td>Independent safety board</td><td>Can stop the trial early if there is harm or clear benefit.</td></tr></tbody></table></div>`,
      results: () => `<div class="card"><h4>Results (hypothetical)</h4><div style="overflow-x:auto;max-width:100%">${resTable}</div>
        <p class="small mt"><strong>Calculate it yourself.</strong> Vaccine efficacy = (attack rate in placebo group − attack rate in vaccine group) ÷ attack rate in placebo group × 100, using the numbers analysed.</p>
        <div class="row" style="flex-wrap:wrap;gap:.5rem;align-items:center"><label class="small" for="it-ve-${uid}">Your efficacy (%):</label><input id="it-ve-${uid}" type="number" step="0.1" style="width:7rem" inputmode="decimal"><button type="button" class="btn sm primary" data-a="ve">Check</button></div><p class="small" data-r="vefb" aria-live="polite"></p>
        ${work("Show the working: attack rates", `Vaccine: ${v.cases} ÷ ${v.analysed} × 100 = ${f2(S.arV)} %. Placebo: ${p.cases} ÷ ${p.analysed} × 100 = ${f2(S.arP)} %.`)}
        ${work("Show the working: efficacy", `(${f2(S.arP)} − ${f2(S.arV)}) ÷ ${f2(S.arP)} × 100 = ${f1(S.ve)} %. Equivalent: 1 − relative risk = 1 − ${f2(S.rr)} = ${f1(S.ve)} %. So vaccinated people had about ${M().fix(S.ve, 0)} % fewer cases than they would have had without the vaccine.`)}
        ${work("Show the working: side effects", `Injection-site pain: ${f1(S.painV)} % v ${f1(S.painP)} %. Fever: ${f1(S.fevV)} % v ${f1(S.fevP)} %. Serious adverse events: ${f2(S.saeV)} % v ${f2(S.saeP)} % (similar; none judged to be caused by the injection).`)}
        ${work("Show the working: severe disease", `Severe cases ${v.severe} v ${p.severe}: efficacy against severe disease ${f1(S.veSevere)} %, but based on only ${v.severe + p.severe} severe cases, so much less certain.`)}</div>`,
      bias: () => `<div class="card"><h4>${esc(W.title)}: a weaker study</h4><p class="small">${esc(W.desc)}</p><table class="tbl small"><thead><tr><th></th><th>Chose vaccine</th><th>Did not</th></tr></thead><tbody><tr><td>People</td><td>${W.vN}</td><td>${W.uN}</td></tr><tr><td>Cases (diagnosed by symptoms)</td><td>${W.vCases}</td><td>${W.uCases}</td></tr><tr><td>Attack rate</td><td>${f1(S.wV)} %</td><td>${f1(S.wU)} %</td></tr><tr><td>Apparent efficacy</td><td colspan="2">${f1(S.wVE)} %</td></tr></tbody></table>
        <p class="small"><strong>Sources of bias:</strong> people chose their group (selection bias: the groups differ in age and health); no blinding (behaviour and diagnosis may differ); diagnosis by symptoms only (other infections counted); small numbers (${W.vCases + W.uCases} cases in all, so chance has a large effect).</p></div>`,
      ethics: () => `<div class="card"><h4>Ethical decisions for Trial V</h4><p class="small">Make each decision; the feedback explains the principle.</p><div data-r="eth"></div></div>`,
      real: () => `<div class="card"><h4>Real published data: a COVID-19 mRNA vaccine trial (2020)</h4><p class="small">Polack and colleagues reported a randomised, placebo-controlled, observer-blinded trial of the BNT162b2 vaccine in people aged 16 and over. ${PK.randomised.toLocaleString("en-GB")} people were randomised and ${(PK.vN + PK.pN).toLocaleString("en-GB")} received injections: ${PK.vN.toLocaleString("en-GB")} the vaccine and ${PK.pN.toLocaleString("en-GB")} the placebo (two injections, 21 days apart). Cases were counted in the participants who could be evaluated and had no sign of an earlier infection: ${PK.evV.toLocaleString("en-GB")} in the vaccine group and ${PK.evP.toLocaleString("en-GB")} in the placebo group.</p>
        <table class="tbl small"><thead><tr><th></th><th>Vaccine</th><th>Placebo</th></tr></thead><tbody><tr><td>Cases (from 7 days after dose 2)</td><td>${PK.vCases}</td><td>${PK.pCases}</td></tr><tr><td>Severe cases (after dose 1)</td><td>${PK.severeV}</td><td>${PK.severeP}</td></tr></tbody></table>
        <p class="small"><strong>Reported efficacy:</strong> ${PK.reported} % (95 % credible interval ${PK.ci}).</p>
        ${work("Check it approximately", `Using the numbers of evaluable participants: (${PK.pCases} ÷ ${PK.evP.toLocaleString("en-GB")} − ${PK.vCases} ÷ ${PK.evV.toLocaleString("en-GB")}) ÷ (${PK.pCases} ÷ ${PK.evP.toLocaleString("en-GB")}) × 100 = ${f1(S.polackVE)} %. The authors used each group's total follow-up time rather than the number of people, which gives the same value to the nearest whole number (95 %). This check is approximate.`)}
        <p class="small"><strong>Limits of these results (as published at the time):</strong> about two months of median follow-up for safety; no children under 16, and few pregnant or immunocompromised people, included; efficacy measured against the virus variants circulating in 2020.</p>
        <p class="tiny muted">Source: Polack FP et al. (2020) Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine. <em>New England Journal of Medicine</em> 383, 2603–2615, <a href="https://doi.org/10.1056/NEJMoa2034577" target="_blank" rel="noopener">doi:10.1056/NEJMoa2034577</a>; case numbers, evaluable participants and severe cases are from the paper (abstract and efficacy results); see also the accompanying editorial (Rubin EJ, Longo DL, NEJM 2020, doi:10.1056/NEJMe2034717).</p></div>`,
    };
    const wire = {
      results: (pane) => { const inp = $(`#it-ve-${uid}`, pane), fb = $('[data-r="vefb"]', pane); $('[data-a="ve"]', pane).addEventListener("click", () => { const x = parseFloat(String(inp.value).replace(",", ".")); if (Number.isNaN(x)) { fb.textContent = "Enter a number first."; return; } const ok = Math.abs(x - S.ve) <= 0.6; fb.innerHTML = ok ? `<strong>Correct:</strong> ${f1(S.ve)} %.` : Math.abs(x - S.ve) <= 5 ? `<strong>Close.</strong> Check your rounding: keep at least 2 decimal places in the attack rates.` : `<strong>Not quite.</strong> Work out each group's attack rate first (cases ÷ number analysed), then find the difference as a fraction of the placebo rate.`; }); },
      ethics: (pane) => { const box = $('[data-r="eth"]', pane); (spec.ethics || []).forEach((e, i) => { const d = document.createElement("fieldset"); d.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:.6rem;margin:.5rem 0"; d.innerHTML = `<legend class="small" style="font-weight:700;padding:0 .3rem">${esc(e.q)}</legend>${e.options.map((o, k) => `<label class="small" style="display:block"><input type="radio" name="it-e${i}-${uid}" value="${k}"> ${esc(o.t)}</label>`).join("")}<p class="small mt" aria-live="polite" data-fb></p>`; box.append(d);
        $$("input", d).forEach((r) => r.addEventListener("change", () => { const o = e.options[+r.value]; $("[data-fb]", d).innerHTML = `<strong>${o.ok ? "Ethically sound" : "Problem"}:</strong> ${esc(o.fb)}`; })); }); },
    };
    const built = new Set();
    const build = (i) => { if (built.has(i)) return; built.add(i); const it = items[i], pane = panes[i]; pane.innerHTML = (content[it.key] ? content[it.key]() : "") + ((it.questions || []).length ? `<h4 class="mt">Questions</h4><div data-r="q"></div>` : ""); if (wire[it.key]) wire[it.key](pane); if ((it.questions || []).length) renderQs(it.questions, $('[data-r="q"]', pane)); };
    items.forEach((_, i) => build(i)); // build every tab now, so all their questions are moved to Check yourself together
    tabs($(`#it-tabs-${uid}`, host), items.map((x) => x.label), panes, (i) => build(i));
  };
})(window.BIO);
