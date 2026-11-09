// Interactives for 3.2.3 Cholera (Phase 4 Batch 1, owned by the 3.2.3 author). Kinds: choMechanism (3.2.3.1),
// choRehydration and choTrial (3.2.3.2). Drawings come from B.choleraArt and numbers from B.choleraModel
// (data/content/_cholera-art.js), so what is drawn, the figures quoted and the embedded questions share one source.
// Embedded questions are rendered with B.questions.render (marked, recorded and counted towards mastery).
// Accessibility: every control is a native button, radio, checkbox or <details>; tab rows use a roving tab stop (arrow
// keys, Home, End); the mechanism figure also steps with the left and right arrow keys; step changes are announced in
// a polite live region. Motion: the optional water-flow animation is off by default, cannot be switched on when
// reduced motion is requested (system setting or site preference), and the SVG's own CSS also stops it under
// prefers-reduced-motion. UI text uses CSS tokens only; SVG drawings sit on the light panel the site gives
// .interactive-host svg in dark mode. Layouts wrap, and SVGs scale (max-width: 100%), so nothing scrolls sideways at 390 px.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.choleraArt, M = () => B.choleraModel;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .25s"; node.style.opacity = "1"; }); };
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));

  // Tab row with roving focus; panes are shown and hidden by the caller through onShow(i)
  const tabs = (bar, labels, panes, onShow) => {
    let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm" role="tab" id="${bar.id}-t${i}" data-i="${i}" aria-selected="${i === 0}" aria-controls="${panes[i].id}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    panes.forEach((p, i) => { p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", `${bar.id}-t${i}`); p.tabIndex = 0; });
    const show = (i, focus) => { cur = Math.max(0, Math.min(labels.length - 1, i)); $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); panes.forEach((p, k) => { p.hidden = k !== cur; }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show((ni + labels.length) % labels.length, true); });
    show(0); return show;
  };

  // ======================================== 1. Cholera Mechanism Simulator ========================================
  B.interactives.choMechanism = function (spec, host) {
    const uid = uidOf(); const st = { mode: "normal", step: 1, anim: false, ext: false };
    host.innerHTML = head(spec, "qualitative model") + `
      <div class="row mt" style="flex-wrap:wrap;gap:.75rem;align-items:center">
        <fieldset style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:600">Intestine</legend>
          <label class="small"><input type="radio" name="cm-mode-${uid}" value="normal" checked> Normal</label>
          <label class="small" style="margin-left:.6rem"><input type="radio" name="cm-mode-${uid}" value="cholera"> After cholera toxin</label></fieldset>
        <div class="row" style="flex-wrap:wrap;gap:.4rem"><button type="button" class="btn sm" data-a="prev">◀ Previous step</button><button type="button" class="btn sm primary" data-a="next">Next step ▶</button><button type="button" class="btn sm" data-a="all">Show all steps</button><button type="button" class="btn sm" data-a="reset">Start again</button></div>
      </div>
      <div class="row mt" style="flex-wrap:wrap;gap:1rem">
        <label class="small"><input type="checkbox" data-a="anim"> Animate the water arrows</label>
        <label class="small"><input type="checkbox" data-a="ext"> Show the molecular detail (extension)</label>
      </div>
      <p class="tiny muted" data-r="animnote" hidden>Animation is unavailable because reduced motion is switched on.</p>
      <div class="figure mt"><div class="fig-view" data-r="fig" tabindex="0" role="group" aria-label="mechanism diagram; use the left and right arrow keys to step" aria-describedby="cm-live-${uid}"></div></div>
      <p class="small" id="cm-live-${uid}" aria-live="polite" data-r="live"></p>
      <div class="grid grid-2 mt" style="gap:1rem">
        <div><h4>Steps</h4><ol class="small" data-r="steps" style="padding-left:1.2rem;margin:0"></ol></div>
        <div><h4>Fluid balance across the epithelium</h4><div data-r="bal"></div><p class="tiny muted">Bar lengths are qualitative: they compare the two directions, not measured volumes.</p></div>
      </div>
      <div data-r="ext" class="mt" hidden>${spec.extension || ""}</div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const steps = () => spec.steps[st.mode];
    const bar = (label, pct, colour) => `<div class="small" style="margin:.35rem 0"><div style="display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap"><span>${label}</span></div><div style="height:12px;border-radius:6px;background:var(--surface-3);overflow:hidden" aria-hidden="true"><div style="height:100%;width:${pct}%;background:${colour}"></div></div></div>`;
    const draw = () => {
      const list = steps(); const n = list.length; st.step = Math.max(1, Math.min(n, st.step));
      const fig = q("fig"); fig.innerHTML = A().epithelium(st.mode, { step: st.step, animate: st.anim && !reduced() }); fade(fig.firstElementChild);
      q("steps").innerHTML = list.map((t, i) => `<li ${i + 1 === st.step ? 'aria-current="step" style="font-weight:700"' : i + 1 > st.step ? 'class="muted"' : ""}>${esc(t)}</li>`).join("");
      q("live").textContent = `${st.mode === "normal" ? "Normal intestine" : "After cholera toxin"}, step ${st.step} of ${n}: ${list[st.step - 1]}`;
      const b = spec.balance[st.mode]; const done = st.step >= b.at;
      // absorption and secretion bars: normal absorption dominates; after toxin, nothing changes until the chloride
      // channels open at step 3, when secretion rises and absorption falls (the toxin also reduces NaCl absorption)
      let abs = 80, sec = 12; if (st.mode === "cholera" && st.step >= 3) { abs = 35; sec = 90; }
      q("bal").innerHTML = bar("Absorption: lumen → cells → blood", abs, "var(--sage)") + bar("Secretion: blood → cells → lumen", sec, "var(--rose)") + `<p class="small mt"><strong>${done ? "Net effect" : "Net effect so far"}:</strong> ${done ? esc(b.text) : "keep stepping to see the overall effect on the water balance."}</p>`;
      $('[data-a="prev"]', host).disabled = st.step <= 1; $('[data-a="next"]', host).disabled = st.step >= n;
    };
    $$(`input[name="cm-mode-${uid}"]`, host).forEach((r) => r.addEventListener("change", () => { st.mode = r.value; st.step = 1; draw(); }));
    $('[data-a="prev"]', host).addEventListener("click", () => { st.step--; draw(); });
    $('[data-a="next"]', host).addEventListener("click", () => { st.step++; draw(); });
    $('[data-a="all"]', host).addEventListener("click", () => { st.step = steps().length; draw(); });
    $('[data-a="reset"]', host).addEventListener("click", () => { st.step = 1; draw(); });
    q("fig").addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { st.step++; draw(); e.preventDefault(); } else if (e.key === "ArrowLeft") { st.step--; draw(); e.preventDefault(); } });
    const animBox = $('[data-a="anim"]', host);
    if (reduced()) { animBox.disabled = true; q("animnote").hidden = false; }
    animBox.addEventListener("change", () => { st.anim = animBox.checked; draw(); });
    $('[data-a="ext"]', host).addEventListener("change", (e) => { q("ext").hidden = !e.target.checked; });
    draw();
    (spec.items || []).forEach((it) => renderQs(it.questions, q("q")));
  };

  // ======================================== 2. Oral Rehydration Challenge ========================================
  B.interactives.choRehydration = function (spec, host) {
    const uid = uidOf(); const items = spec.items || []; const seen = new Set();
    host.innerHTML = head(spec, "educational model") + `
      <div class="notice amber small"><strong>Not a treatment tool.</strong> This model explains why some drinks rehydrate and others do not. It gives no amounts, recipes or doses and must not be used to prepare or prescribe treatment.</div>
      <div class="row mt" role="tablist" aria-label="drinks to compare" id="rc-tabs-${uid}" style="flex-wrap:wrap;gap:.35rem"></div>
      <div data-r="panes" class="mt"></div>
      <div class="mt"><button type="button" class="btn sm" data-a="sum" aria-expanded="false" aria-controls="rc-sum-${uid}">Show the summary of all five drinks</button><div id="rc-sum-${uid}" class="mt" hidden></div></div>`;
    const panesHost = $('[data-r="panes"]', host);
    const panes = items.map((it, i) => { const d = document.createElement("div"); d.id = `rc-pane-${uid}-${i}`; d.hidden = true; panesHost.append(d); return d; });
    const built = new Set();
    const build = (i) => {
      if (built.has(i)) return; built.add(i); const it = items[i], pane = panes[i];
      if (it.key === "explain") { pane.innerHTML = `<div class="card"><h4>Explain your reasoning</h4><p class="small">Use what the five drinks showed you: the co-transporter carries Na⁺ and glucose together, and water moves by osmosis towards the lower water potential.</p><div data-r="q"></div></div>`; renderQs(it.questions, $('[data-r="q"]', pane)); return; }
      pane.innerHTML = `<div class="card"><h4>${esc(it.label)}</h4><p class="small"><strong>Contains:</strong> ${esc(it.contents)}</p>
        <div data-r="q"></div>
        <button type="button" class="btn sm mt" data-a="model" aria-expanded="false" aria-controls="rc-model-${uid}-${i}">Show the model</button>
        <div id="rc-model-${uid}-${i}" class="mt" hidden>
          <div class="figure"><div class="fig-view" data-r="fig"></div></div>
          <p class="small"><strong>Model outcome:</strong> ${esc(M().OUT[it.outcome])}.</p><p class="small">${esc(it.why)}</p></div></div>`;
      renderQs(it.questions, $('[data-r="q"]', pane));
      const btn = $('[data-a="model"]', pane), box = $(`#rc-model-${uid}-${i}`, pane);
      btn.addEventListener("click", () => { const open = box.hidden; box.hidden = !open; btn.setAttribute("aria-expanded", String(open)); btn.textContent = open ? "Hide the model" : "Show the model"; if (open) { const f = $('[data-r="fig"]', box); if (!f.innerHTML) f.innerHTML = A().epithelium(it.key); fade(f.firstElementChild); seen.add(it.key); } });
    };
    tabs($(`#rc-tabs-${uid}`, host), items.map((x) => x.label), panes, (i) => build(i));
    const sumBtn = $('[data-a="sum"]', host), sum = $(`#rc-sum-${uid}`, host);
    sumBtn.addEventListener("click", () => {
      const open = sum.hidden; sum.hidden = !open; sumBtn.setAttribute("aria-expanded", String(open)); sumBtn.textContent = open ? "Hide the summary" : "Show the summary of all five drinks";
      if (open) sum.innerHTML = `<table class="tbl"><thead><tr><th>Drink</th><th>Co-transport of Na⁺ with glucose</th><th>Lumen water potential compared with the cells</th><th>Net water movement</th></tr></thead><tbody>${items.filter((x) => x.outcome).map((x) => `<tr><td>${esc(x.label)}</td><td>${x.key === "ors" || x.key === "hyper" ? "Yes" : x.key === "glucose" ? "Some, using Na⁺ already in the lumen; none replaced" : x.key === "salt" ? "Little: no glucose" : "Nothing extra to carry"}</td><td>${x.outcome === "absorb" ? "Higher" : x.outcome === "worse" ? "Much lower" : "Still lower (toxin-driven secretion)"}</td><td>${esc(M().OUT[x.outcome])}</td></tr>`).join("")}</tbody></table><p class="tiny muted">Simplified model of a patient with cholera. Only a balanced solution, not too concentrated, gives net absorption; that is why approved ORS is made to an exact formula.</p>`;
    });
  };

  // ======================================== 3. Evaluate a Clinical Trial ========================================
  B.interactives.choTrial = function (spec, host) {
    const uid = uidOf(); const items = spec.items || []; const T = M().TRIAL, ST = M().stats(), g = T.groups, K = M().STUDY_K, f1 = (x) => M().fix(x, 1), f2 = (x) => M().fix(x, 2);
    host.innerHTML = head(spec, "hypothetical data") + `
      <div class="row mt" role="tablist" aria-label="parts of the trial evaluation" id="ct-tabs-${uid}" style="flex-wrap:wrap;gap:.35rem"></div>
      <div data-r="panes" class="mt"></div>`;
    const panesHost = $('[data-r="panes"]', host);
    const panes = items.map((it, i) => { const d = document.createElement("div"); d.id = `ct-pane-${uid}-${i}`; d.hidden = true; panesHost.append(d); return d; });
    const work = (summary, body) => `<details class="small mt"><summary>${summary}</summary><p>${body}</p></details>`;
    const content = {
      design: () => `<div class="card"><h4>${esc(T.title)}</h4><p class="small"><strong>Participants:</strong> ${esc(T.population)}.</p><p class="small"><strong>Design:</strong> ${esc(T.design)}</p><div class="figure"><div class="fig-view">${A().trialFlow()}</div></div></div>`,
      results: () => `<div class="card"><h4>Results (hypothetical)</h4><div style="overflow-x:auto;max-width:100%">${A().trialTable()}</div><div class="figure mt"><div class="fig-view">${A().trialBars()}</div></div>
        ${work("Show the working: percentage needing IV fluids", `Standard: ${g.std.iv} ÷ ${g.std.analysed} × 100 = ${f1(ST.ivS)} %. ORS-R: ${g.imp.iv} ÷ ${g.imp.analysed} × 100 = ${f1(ST.ivM)} %. Use the number analysed, not the number randomised.`)}
        ${work("Show the working: absolute and relative reduction in IV fluids", `Percentages to 2 decimal places, so that rounding does not change the answer. Absolute difference: ${f2(ST.ivS)} − ${f2(ST.ivM)} = ${f2(ST.ivAbs)} percentage points. Relative reduction: ${f2(ST.ivAbs)} ÷ ${f2(ST.ivS)} × 100 = ${f1(ST.ivRel)} % (about ${M().fix(ST.ivRel, 0)} %). <span class="badge amber">extension</span> 100 ÷ ${f2(ST.ivAbs)} = ${f1(ST.nnt)}, so about 1 in ${M().fix(ST.nnt, 0)} children given ORS-R instead of standard ORS avoided IV fluids.`)}
        ${work("Show the working: percentage reduction in stool output", `(${g.std.stoolMean} − ${g.imp.stoolMean}) ÷ ${g.std.stoolMean} × 100 = ${ST.stoolDiff} ÷ ${g.std.stoolMean} × 100 = ${f1(ST.stoolRel)} %.`)}
        ${work("Show the working: vomiting and low blood sodium", `Vomiting: ${g.std.vomit} ÷ ${g.std.analysed} = ${f1(ST.vS)} % v ${g.imp.vomit} ÷ ${g.imp.analysed} = ${f1(ST.vM)} %. Low blood sodium: ${g.std.lowNa} ÷ ${g.std.analysed} = ${f1(ST.nS)} % v ${g.imp.lowNa} ÷ ${g.imp.analysed} = ${f1(ST.nM)} %.`)}
        <p class="small mt"><strong>Reading the statistics.</strong> "Significant" means a difference this large would be unlikely if the two solutions really had the same effect; "not significant" means chance cannot be ruled out, not that there is no effect.</p></div>`,
      ethics: () => `<div class="card"><h4>Ethical decisions</h4><p class="small">You are on the committee that designs Trial H. Make each decision below; the feedback explains the principle. Then check the principles list.</p>
        <details class="small"><summary>Principles to apply</summary><ul><li><strong>Informed consent</strong>: parent or guardian for young children, in their own language, voluntary, free to withdraw without losing care; child's assent where possible.</li><li><strong>Clinical equipoise</strong>: genuine uncertainty about which solution is better.</li><li><strong>Control choice</strong>: standard ORS, never a placebo, because an effective treatment exists.</li><li><strong>Vulnerable participants</strong>: ill children, distressed or poor families; no pressure or large payments.</li><li><strong>Risk minimisation</strong>: monitoring of blood sodium and hydration; IV fluids ready.</li><li><strong>Independent oversight</strong>: ethics committee approval; data and safety monitoring committee; stopping rules.</li><li><strong>Benefits v risks; justice</strong>: communities share the benefits, with access afterwards; all results published.</li></ul></details></div>`,
      conclusions: () => `<div class="card"><h4>Drawing conclusions</h4><p class="small">Compare Trial H with a second, smaller study.</p><table class="tbl"><thead><tr><th></th><th>Trial H</th><th>${esc(K.title)}</th></tr></thead><tbody><tr><td>Participants</td><td>${ST.totalRand} children, two hospitals</td><td>${K.n} adults with cholera, one clinic</td></tr><tr><td>Allocation</td><td>Random</td><td>Chosen by doctors</td></tr><tr><td>Blinding</td><td>Double-blind</td><td>None</td></tr><tr><td>Needed IV fluids</td><td>${f1(ST.ivS)} % v ${f1(ST.ivM)} %</td><td>${K.stdIv} of ${K.each} v ${K.newIv} of ${K.each}</td></tr></tbody></table><p class="tiny muted">Both studies are hypothetical.</p></div>`,
    };
    const built = new Set();
    const build = (i) => { if (built.has(i)) return; built.add(i); const it = items[i], pane = panes[i]; pane.innerHTML = (content[it.key] ? content[it.key]() : "") + `<h4 class="mt">Questions</h4><div data-r="q"></div>`; renderQs(it.questions, $('[data-r="q"]', pane)); };
    tabs($(`#ct-tabs-${uid}`, host), items.map((x) => x.label), panes, (i) => build(i));
  };
})(window.BIO);
