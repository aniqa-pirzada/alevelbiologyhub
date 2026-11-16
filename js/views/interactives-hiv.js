// Interactives for 3.2.4 HIV (Phase 4 Batch 2, owned by the 3.2.4 author). Kinds: hivStructure (3.2.4.1),
// hivReplication and hivDrugs (3.2.4.2); the HIV and Immune Function model (hivImmune) was removed in the release review
// (R5-17: beyond the specification and a duplicate of the static graph). Drawings come from B.hivArt and every number from B.hivModel
// (data/content/_hiv-art.js), so what is drawn, the values read off and the embedded questions share one source.
// Embedded questions are rendered with B.questions.render (marked, recorded and counted towards mastery).
// Accessibility: every control is a native button, radio or range input; clickable parts of the particle are focusable
// (role="button", Enter or Space); tab rows use a roving tab stop (arrow keys, Home, End); the cycle figure also steps
// with the left and right arrow keys; changes are announced in polite live regions. Motion: the only effect is a short
// fade when a figure changes, which is skipped when reduced motion is requested (system setting or site preference).
// UI text uses CSS tokens only; SVG drawings sit on the light panel the site gives .interactive-host svg in dark mode.
// Wide drawings scroll sideways inside their own panel at phone width, so the page itself never scrolls sideways.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.hivArt, M = () => B.hivModel;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .25s"; node.style.opacity = "1"; }); };
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const figBox = (attrs = "", min = 560) => `<div class="figure mt"><div class="fig-view hiv-scroll" style="overflow-x:auto;max-width:100%" ${attrs}></div></div><style>@media (max-width:600px){.hiv-scroll>svg{min-width:${min}px}}</style>`;
  const tabs = (bar, labels, panes, onShow) => {
    let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm" role="tab" id="${bar.id}-t${i}" data-i="${i}" aria-selected="${i === 0}" aria-controls="${panes[i].id}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    panes.forEach((p, i) => { p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", `${bar.id}-t${i}`); });
    const show = (i, focus) => { cur = Math.max(0, Math.min(labels.length - 1, i)); $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); panes.forEach((p, k) => { p.hidden = k !== cur; }); if (focus) $$("button", bar)[cur].focus(); onShow && onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show((ni + labels.length) % labels.length, true); });
    show(0); return show;
  };
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  // ======================================== 1. HIV Structure Explorer ========================================
  B.interactives.hivStructure = function (spec, host) {
    // Release review (R5-16): no zoom (the particle fits at full size); during the "find the part" challenge the particle
    // is redrawn without labels or enzyme abbreviations, the part buttons and the description are hidden, and the prompt
    // sits straight under the challenge button.
    const uid = uidOf(); const P = spec.parts; const keys = A().particleParts; let sel = null; const ch = { on: false, order: [], i: 0, score: 0, tries: 0 };
    host.innerHTML = head(spec, "schematic model") + `
      <div class="ix"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view" data-r="fig"></div><p class="tiny muted" style="margin:.3rem .3rem 0">${esc(A().PARTICLE_CAPTION)}</p></div></div><div class="ix-panel">
      <div class="row" style="flex-wrap:wrap;gap:.5rem;align-items:center"><button type="button" class="btn sm" data-a="chal" aria-pressed="false">Start the "find the part" challenge</button></div>
      <div class="card" data-r="chal" hidden aria-live="polite"></div>
      <div data-r="explore"><p class="tiny muted" style="margin:0 0 .4rem">Click a part of the particle, or press Tab to reach a part and Enter to select it. The buttons below do the same.</p>
      <div class="row" role="group" aria-label="parts of the particle" data-r="btns" style="flex-wrap:wrap;gap:.35rem"></div>
      <div class="card mt" style="background:var(--surface-2)" data-r="info" aria-live="polite"><p class="small muted" style="margin:0">Select a part to read what it is made of and what it does.</p></div></div></div></div></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const fig = q("fig");
    let svg, groups = [], ring, ringRects = [];
    const NS = "http://www.w3.org/2000/svg";
    // Keyboard focus ring: a high-contrast dashed outline drawn around the focused part's bounding box (the SVG sits on a
    // white panel in both themes, so a fixed dark blue and white double stroke stays visible against every part).
    // The ring surrounds the part's label (specific even for the envelope, glycoprotein and matrix, which all circle the
    // whole particle) and the other parts are dimmed while focus is on it, so the focused part is unmistakable.
    const showRing = (g) => { if (!g.matches(":focus-visible")) return; const tx = $$("text", g); let b;
      if (tx.length) { const bs = tx.map((t) => t.getBBox()); const x0 = Math.min(...bs.map((q) => q.x)), y0 = Math.min(...bs.map((q) => q.y)), x1 = Math.max(...bs.map((q) => q.x + q.width)), y1 = Math.max(...bs.map((q) => q.y + q.height)); b = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; } else b = g.getBBox();
      const pad = 6; ringRects.forEach((r) => { r.setAttribute("x", b.x - pad); r.setAttribute("y", b.y - pad); r.setAttribute("width", b.width + 2 * pad); r.setAttribute("height", b.height + 2 * pad); }); ring.style.display = "";
      groups.forEach((x) => { x.style.opacity = x === g ? "1" : "0.35"; }); };
    const hideRing = () => { ring.style.display = "none"; groups.forEach((x) => { x.style.opacity = !sel || x.dataset.part === sel ? "1" : "0.28"; }); };
    const mount = (labels) => {
      fig.innerHTML = A().particle(labels ? { parts: true, caption: false } : { parts: true, caption: false, numbered: [], title: "Structure of HIV: find the part" });
      svg = $("svg", fig); groups = $$("[data-part]", svg);
      ring = document.createElementNS(NS, "g"); ring.setAttribute("aria-hidden", "true"); ring.setAttribute("pointer-events", "none"); ring.style.display = "none";
      const mk = (c, w, da) => { const r = document.createElementNS(NS, "rect"); r.setAttribute("fill", "none"); r.setAttribute("stroke", c); r.setAttribute("stroke-width", w); r.setAttribute("rx", "10"); if (da) r.setAttribute("stroke-dasharray", da); ring.append(r); return r; };
      ringRects = [mk("#ffffff", 7), mk("#0b4fa8", 3.5, "9 5")]; svg.append(ring);
      // during the challenge the parts are announced by number only, so their names do not give the answer away
      if (!labels) groups.forEach((g, i) => g.setAttribute("aria-label", `part ${i + 1} of ${groups.length}`));
      groups.forEach((g) => { g.addEventListener("click", () => choose(g.dataset.part)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(g.dataset.part); showRing(g); } }); g.addEventListener("focus", () => showRing(g)); g.addEventListener("blur", hideRing); });
      highlight(); };
    q("btns").innerHTML = keys.map((k) => `<button type="button" class="btn sm" data-k="${k}" aria-pressed="false">${esc(P[k].name)}</button>`).join("");
    const highlight = () => { groups.forEach((g) => { if (!reduced()) g.style.transition = "opacity .2s"; g.style.opacity = !sel || g.dataset.part === sel ? "1" : "0.28"; }); $$("button[data-k]", host).forEach((b) => { const on = b.dataset.k === sel; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("primary", on); }); };
    const info = (k) => { const p = P[k]; q("info").innerHTML = `<div class="row" style="gap:.5rem;flex-wrap:wrap;align-items:center"><h4 style="margin:0">${esc(p.name)}</h4><span class="badge ${p.level === "required" ? "teal" : p.level === "stretch" ? "amber" : ""}">${esc(p.level)}</span><span class="badge">made of: ${esc(p.made)}</span></div><p class="small mt" style="margin-bottom:0">${p.text}</p>${p.cycle ? `<p class="small" style="margin:.4rem 0 0"><strong>In the replication cycle:</strong> ${p.cycle}</p>` : ""}`; };
    const blank = () => { q("info").innerHTML = `<p class="small muted" style="margin:0">Select a part to read what it is made of and what it does.</p>`; };
    const choose = (k) => { if (ch.on) return challengeAnswer(k); sel = sel === k ? null : k; highlight(); if (sel) info(sel); else blank(); };
    $$("button[data-k]", host).forEach((b) => b.addEventListener("click", () => choose(b.dataset.k)));
    // challenge: a description is shown, the student selects the part on the unlabelled drawing
    const chalBtn = $('[data-a="chal"]', host);
    const stopChal = () => { ch.on = false; chalBtn.setAttribute("aria-pressed", "false"); chalBtn.textContent = 'Start the "find the part" challenge'; q("explore").hidden = false; mount(true); };
    const prompt = () => { const box = q("chal"); if (ch.i >= ch.order.length) { const sc = ch.score; stopChal(); box.innerHTML = `<p class="small" style="margin:0"><strong>Challenge complete: ${sc} of ${ch.order.length} found at the first attempt.</strong> ${sc === ch.order.length ? "Every part identified first time." : "Select any part to review it, or start again."}</p>`; return; }
      const k = ch.order[ch.i]; box.innerHTML = `<p class="small" style="margin:0"><strong>Find ${ch.i + 1} of ${ch.order.length}:</strong> ${esc(P[k].clue)}</p><p class="small muted" data-r="fb" style="margin:.4rem 0 0">Select the part on the drawing.</p>`; };
    function challengeAnswer(k) { const want = ch.order[ch.i]; const fb = $('[data-r="fb"]', q("chal"));
      if (k === want) { if (ch.tries === 0) ch.score++; ch.i++; ch.tries = 0; prompt(); const f2 = $('[data-r="fb"]', q("chal")); if (f2) f2.textContent = `Correct: that was the ${P[want].name.toLowerCase()}.`; }
      else { ch.tries++; if (fb) fb.textContent = `Not that one: that was the ${P[k].name.toLowerCase()}. ${ch.tries >= 2 ? "Hint: " + P[want].hint : "Try again."}`; } }
    function startChal() { ch.on = true; ch.order = shuffle(keys); ch.i = 0; ch.score = 0; ch.tries = 0; sel = null; blank(); q("explore").hidden = true; q("chal").hidden = false; chalBtn.setAttribute("aria-pressed", "true"); chalBtn.textContent = "Stop the challenge"; mount(false); prompt(); }
    chalBtn.addEventListener("click", () => { if (ch.on) { stopChal(); q("chal").hidden = true; } else startChal(); });
    mount(true);
    (spec.items || []).forEach((it) => renderQs(it.questions, q("q")));
  };

  // ======================================== 2. HIV Replication Simulator ========================================
  B.interactives.hivReplication = function (spec, host) {
    const uid = uidOf(); const steps = A().STEPS; const st = { step: 1 };
    host.innerHTML = head(spec, "schematic model") + `
      <div class="row mt" id="hr-tabs-${uid}" role="tablist" aria-label="simulator modes" style="flex-wrap:wrap;gap:.35rem"></div>
      <div id="hr-p0-${uid}" class="mt">
        <div class="ix"><div class="ix-body"><div class="ix-stage">${figBox('data-r="fig" tabindex="0" role="group" aria-label="replication cycle diagram; use the left and right arrow keys to step"')}</div><div class="ix-panel">
        <div class="row" style="flex-wrap:wrap;gap:.4rem"><button type="button" class="btn sm" data-a="prev">◀ Previous step</button><button type="button" class="btn sm primary" data-a="next">Next step ▶</button><button type="button" class="btn sm" data-a="all">Show the whole cycle</button><button type="button" class="btn sm" data-a="reset">Start again</button></div>
        <p class="small" aria-live="polite" data-r="live"></p>
        <div data-r="detail"></div><div><h4>Steps</h4><ol class="small" data-r="list" style="padding-left:1.2rem;margin:0"></ol></div></div></div></div>
      </div>
      <div id="hr-p1-${uid}" class="mt" hidden>
        <p class="small">${esc(spec.errors.intro)}</p>
        <ol class="small" data-r="errs" style="padding-left:1.2rem"></ol>
        <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="echeck">Check my decisions</button><button type="button" class="btn sm" data-a="ereset">Reset</button></div>
        <div data-r="efb" class="mt" aria-live="polite"></div>
      </div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const draw = () => { st.step = Math.max(1, Math.min(7, st.step)); const s = steps[st.step - 1];
      q("fig").innerHTML = A().cycle({ step: st.step }); fade(q("fig").firstElementChild);
      q("list").innerHTML = steps.map((x, i) => `<li ${i + 1 === st.step ? 'aria-current="step" style="font-weight:700"' : i + 1 > st.step ? 'class="muted"' : ""}>${esc(x.title)}</li>`).join("");
      q("live").innerHTML = `<strong>Step ${st.step} of 7: ${esc(s.title)}</strong>`; // R5-45: the step text appears once, below
      const d = spec.detail[st.step]; q("detail").innerHTML = `<h4>What is happening</h4><p class="small">${esc(s.text)}</p><p class="small"><strong>Molecules involved:</strong> ${esc(d.who)}</p><p class="small"><strong>Why it matters:</strong> ${esc(d.why)}</p>`;
      $('[data-a="prev"]', host).disabled = st.step <= 1; $('[data-a="next"]', host).disabled = st.step >= 7; };
    $('[data-a="prev"]', host).addEventListener("click", () => { st.step--; draw(); });
    $('[data-a="next"]', host).addEventListener("click", () => { st.step++; draw(); });
    $('[data-a="all"]', host).addEventListener("click", () => { st.step = 7; draw(); });
    $('[data-a="reset"]', host).addEventListener("click", () => { st.step = 1; draw(); });
    q("fig").addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { st.step++; draw(); e.preventDefault(); } else if (e.key === "ArrowLeft") { st.step--; draw(); e.preventDefault(); } });
    // error identification
    const E = spec.errors.statements;
    const drawErrs = () => { q("errs").innerHTML = E.map((x, i) => `<li style="margin:.5rem 0"><span>${esc(x.text)}</span><fieldset style="border:0;padding:0;margin:.25rem 0 0"><legend class="sr-only">Statement ${i + 1}</legend><label class="small"><input type="radio" name="he-${uid}-${i}" value="ok"> Correct</label> <label class="small" style="margin-left:.8rem"><input type="radio" name="he-${uid}-${i}" value="err"> Contains an error</label></fieldset><div class="small" data-e="${i}"></div></li>`).join(""); q("efb").innerHTML = ""; };
    drawErrs();
    $('[data-a="ereset"]', host).addEventListener("click", drawErrs);
    $('[data-a="echeck"]', host).addEventListener("click", () => { let right = 0, done = 0;
      E.forEach((x, i) => { const v = (host.querySelector(`input[name="he-${uid}-${i}"]:checked`) || {}).value; const box = $(`[data-e="${i}"]`, host); if (!v) { box.innerHTML = `<span class="muted">Not answered yet.</span>`; return; } done++; const good = (v === "err") === !x.ok; if (good) right++;
        box.innerHTML = `<div class="feedback ${good ? "ok" : "bad"}" style="margin-top:.3rem"><strong>${good ? "Right" : "Not right"}:</strong> ${x.ok ? "this statement is correct." : "this contains an error."} ${esc(x.fix)}</div>`; });
      q("efb").innerHTML = `<p class="small"><strong>${right} of ${E.length} decisions correct${done < E.length ? ` (${E.length - done} not answered)` : ""}.</strong> ${right === E.length ? "You spotted every error." : "Read the corrections, then try the step-through again."}</p>`; });
    tabs($(`#hr-tabs-${uid}`, host), ["Step through the cycle", "Spot the errors"], [$(`#hr-p0-${uid}`, host), $(`#hr-p1-${uid}`, host)]);
    draw();
    (spec.items || []).forEach((it) => renderQs(it.questions, q("q")));
  };

  // ======================================== 3. Antiretroviral Drug Target Challenge ========================================
  B.interactives.hivDrugs = function (spec, host) {
    const uid = uidOf(); const D = spec.drugs; const res = {};
    host.innerHTML = head(spec, "hypothetical drugs") + `
      <div class="notice small"><strong>All drugs here are hypothetical.</strong> You are given information about each, as in an exam question. Use what you know about HIV structure and replication to predict its effect. No drug names need to be learned.</div>
      <div class="row mt" id="hd-tabs-${uid}" role="tablist" aria-label="drugs and reservoir" style="flex-wrap:wrap;gap:.35rem"></div>
      <div data-r="panes"></div>
      <div class="card mt" style="background:var(--surface-2)"><p class="small" style="margin:0" data-r="score" aria-live="polite">Predictions checked: 0 of ${D.length}.</p></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const panesHost = q("panes");
    const stepOpts = A().STEPS.map((s) => `${s.n}. ${s.title}`);
    const panes = D.map((d, i) => { const p = document.createElement("div"); p.id = `hd-p${i}-${uid}`; p.className = "mt"; p.hidden = true;
      p.innerHTML = `<h4 style="margin-top:0">${esc(d.name)}</h4><div class="card" style="background:var(--surface-2)"><p class="small" style="margin:0"><strong>Information provided.</strong> ${esc(d.info)}</p></div>
        <fieldset class="mt" style="border:0;padding:0;margin-left:0"><legend class="small" style="font-weight:600">Prediction 1. Which step of the cycle does ${esc(d.name)} block?</legend>${stepOpts.map((o, k) => `<label class="small" style="display:block"><input type="radio" name="hd-s-${uid}-${i}" value="${k + 1}"> ${esc(o)}</label>`).join("")}</fieldset>
        <fieldset class="mt" style="border:0;padding:0;margin-left:0"><legend class="small" style="font-weight:600">Prediction 2. What would you expect in infected helper T cells treated with ${esc(d.name)}?</legend>${B.util.shuffle(d.effects.map((o, k) => k)).map((k) => `<label class="small" style="display:block"><input type="radio" name="hd-e-${uid}-${i}" value="${k}"> ${esc(d.effects[k])}</label>`).join("")}</fieldset>
        <div class="row mt" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="check">Check my predictions</button><button type="button" class="btn sm" data-a="show">Show the effect on the cycle</button></div>
        <div data-r="fb" class="mt" aria-live="polite"></div><div data-r="fig" hidden>${figBox("data-r=\"svg\"")}</div>`;
      panesHost.append(p);
      const showFig = () => { const f = $('[data-r="fig"]', p); f.hidden = false; const v = $('[data-r="svg"]', p); v.innerHTML = A().cycle({ drug: d.target, title: `Effect of ${d.name} (hypothetical)` }); fade(v.firstElementChild); };
      $('[data-a="check"]', p).addEventListener("click", () => { const sv = (p.querySelector(`input[name="hd-s-${uid}-${i}"]:checked`) || {}).value, ev = (p.querySelector(`input[name="hd-e-${uid}-${i}"]:checked`) || {}).value; const fb = $('[data-r="fb"]', p);
        if (!sv || ev === undefined) { fb.innerHTML = `<p class="small muted">Make both predictions first.</p>`; return; }
        const s1 = +sv === d.step, s2 = +ev === d.answer; /* marked by the authored index (the input value), never by position */ if (!(i in res)) res[i] = (s1 ? 1 : 0) + (s2 ? 1 : 0);
        fb.innerHTML = `<div class="feedback ${s1 && s2 ? "ok" : s1 || s2 ? "neutral" : "bad"}"><strong>Step: ${s1 ? "correct" : "not correct"} (step ${d.step}, ${esc(A().STEPS[d.step - 1].title.toLowerCase())}). Effect: ${s2 ? "correct" : "not correct"}.</strong><p class="small mt" style="margin-bottom:0">${esc(d.explain)}</p><p class="small" style="margin:.4rem 0 0"><strong>Does it cure the infection?</strong> ${esc(d.cure)}</p></div>`; showFig();
        const n = Object.keys(res).length, tot = Object.values(res).reduce((a, b) => a + b, 0); q("score").textContent = `Predictions checked: ${n} of ${D.length}. First-attempt score: ${tot} of ${2 * n}.`; });
      $('[data-a="show"]', p).addEventListener("click", showFig);
      return p; });
    // reservoir pane
    const rp = document.createElement("div"); rp.id = `hd-pr-${uid}`; rp.className = "mt"; rp.hidden = true; const R = spec.reservoir;
    rp.innerHTML = `<h4 style="margin-top:0">${esc(R.title)}</h4><p class="small">${esc(R.text)}</p>${figBox('data-r="rsvg"')}
      <fieldset class="mt" style="border:0;padding:0;margin-left:0"><legend class="small" style="font-weight:600">${esc(R.question)}</legend>${B.util.shuffle(R.options.map((o, k) => k)).map((k) => `<label class="small" style="display:block"><input type="radio" name="hd-r-${uid}" value="${k}"> ${esc(R.options[k])}</label>`).join("")}</fieldset>
      <div class="row mt"><button type="button" class="btn sm primary" data-a="rcheck">Check</button></div><div data-r="rfb" class="mt" aria-live="polite"></div>`;
    panesHost.append(rp); $('[data-r="rsvg"]', rp).innerHTML = A().cycle({ latent: true, title: "A resting helper T cell with integrated viral DNA (latent)" });
    $('[data-a="rcheck"]', rp).addEventListener("click", () => { const v = (rp.querySelector(`input[name="hd-r-${uid}"]:checked`) || {}).value; const fb = $('[data-r="rfb"]', rp); if (v === undefined) { fb.innerHTML = `<p class="small muted">Choose an answer first.</p>`; return; } const good = +v === R.answer; fb.innerHTML = `<div class="feedback ${good ? "ok" : "bad"}"><strong>${good ? "Correct." : "Not correct."}</strong> <span class="small">${esc(R.explain)}</span></div>`; });
    tabs($(`#hd-tabs-${uid}`, host), [...D.map((d) => d.name), "Suppression or cure?"], [...panes, rp]);
    (spec.items || []).forEach((it) => renderQs(it.questions, q("q")));
  };

})(window.BIO);
