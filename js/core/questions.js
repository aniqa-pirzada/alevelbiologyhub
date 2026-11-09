// Question engine. Renders a question object and handles marking + attempt logging.
// Types: mcq | gap | match | sequence | label | short | extended
// Objective types are auto-marked. short/extended are self-marked against a mark scheme (never keyword-auto-marked).
window.BIO = window.BIO || {};
(function (B) {
  const { h, raw, el, esc, shuffle, normalise, $, $$ } = B.util;

  function render(q, opts = {}) {
    const node = el(h`<section class="q" data-qid="${q.id}" aria-labelledby="qh-${q.id}"></section>`);
    const prior = B.store.get().attempts.filter((a) => a.qid === q.id);
    node.innerHTML = h`
      <div class="q-head">
        <div class="row"><span class="badge mono">${q.ref}</span><span class="badge">${labelFor(q.type)}</span><span class="badge navy">${q.marks} mark${q.marks === 1 ? "" : "s"}</span>${prior.length ? raw(h`<span class="badge sage">attempted ${prior.length}×</span>`) : ""}</div>
        <h4 id="qh-${q.id}" class="sr-only">${opts.srLabel || "Question"}</h4>
      </div>
      <div class="q-stem">${raw(q.stem.replace(/\n/g, "<br>"))}</div>
      <div class="q-body"></div>
      <div class="row mt q-actions"></div>
      <div class="q-fb"></div>`;
    const body = $(".q-body", node), actions = $(".q-actions", node), fb = $(".q-fb", node);
    let hinted = false;
    const state = { answered: false, tries: opts.tries || 0 };

    const submitBtn = el('<button class="btn primary">Check answer</button>');
    const retryBtn = el('<button class="btn">Try again</button>'); retryBtn.hidden = true;
    const hintBtn = q.hint ? el('<button class="btn ghost">Show hint</button>') : null;
    actions.append(submitBtn, retryBtn); if (hintBtn) actions.append(hintBtn);
    if (hintBtn) hintBtn.addEventListener("click", () => { hinted = true; hintBtn.disabled = true; fb.innerHTML = h`<div class="feedback neutral"><strong>Hint:</strong> ${q.hint}<br><span class="tiny muted">Because you used a hint, this attempt will not count towards mastery.</span></div>`; });

    const types = { mcq: renderMCQ, gap: renderGap, match: renderMatch, sequence: renderSequence, label: renderLabel, short: renderShort, extended: renderShort };
    const api = types[q.type](q, body, state);

    submitBtn.addEventListener("click", () => {
      if (state.answered) return;
      const res = api.mark(); if (!res) return;
      state.answered = true; submitBtn.disabled = true; retryBtn.hidden = false; if (hintBtn) hintBtn.disabled = true;
      const mode = q.type === "short" || q.type === "extended" ? "self" : "auto";
      const isRetry = state.tries > 0;
      // An immediate retry after feedback is recorded but, like a hinted attempt, excluded from mastery.
      const rec = B.store.logAttempt({ qid: q.id, ref: q.ref, type: q.type, score: res.score, max: q.marks, response: res.response, hinted: hinted || isRetry, retry: isRetry, mode });
      const firstMiss = mode === "auto" && res.score < q.marks && !isRetry;
      state.tries++;
      if (firstMiss) { fb.innerHTML = firstMissHTML(q, res); retryBtn.textContent = "Try again"; }
      else { fb.innerHTML = feedbackHTML(q, res, rec); wireMistake(fb, rec); retryBtn.textContent = "Reset and retry"; }
      opts.onAnswer && opts.onAnswer(res, rec, { firstMiss });
    });
    retryBtn.addEventListener("click", () => { const fresh = render(q, Object.assign({}, opts, { tries: state.tries })); node.replaceWith(fresh); });
    return node;
  }

  // First wrong attempt: say how many marks, show which parts were wrong (already coloured), but give no answers.
  function firstMissHTML(q, res) {
    return h`<div class="feedback neutral"><strong>Not quite: ${res.score} / ${q.marks}.</strong> <span class="small">Have another go before the answer is revealed. Think about which part is wrong and why.</span><div class="tiny muted mt">Specification ${esc(q.ref)} · first attempt recorded</div></div>`;
  }
  function labelFor(t) { return { mcq: "Multiple choice", gap: "Gap fill", match: "Matching", sequence: "Sequencing", label: "Diagram labelling", short: "Exam style", extended: "Extended writing" }[t] || t; }

  function feedbackHTML(q, res, rec) {
    const ok = res.score === q.marks;
    const cls = rec.mode === "self" ? "neutral" : ok ? "ok" : res.score > 0 ? "neutral" : "bad";
    const head = rec.mode === "self" ? `Self-assessed: ${res.score} / ${q.marks}` : ok ? `Correct: ${res.score} / ${q.marks}` : `${res.score} / ${q.marks}`;
    return h`<div class="feedback ${cls}"><strong>${head}</strong>${res.detail ? raw("<div class='mt small'>" + res.detail + "</div>") : ""}${q.explanation ? raw("<div class='mt small'><strong>Explanation.</strong> " + q.explanation + "</div>") : ""}<div class="tiny muted mt">Specification ${esc(q.ref)} · attempt ${rec.attempt}${rec.retry ? " · immediate retry (excluded from mastery)" : rec.hinted ? " · hint used (excluded from mastery)" : ""}</div>${res.score < q.marks ? raw('<div class="mt small mistake-cat"><label>Add to mistake bank as: <select><option value="">choose…</option><option value="knowledge">Knowledge gap</option><option value="misconception">Misconception</option><option value="maths">Mathematical error</option><option value="technique">Examination technique</option><option value="misread">Misreading the question</option></select></label></div>') : ""}</div>`;
  }
  function wireMistake(fb, rec) { const sel = $(".mistake-cat select", fb); if (sel) sel.addEventListener("change", () => { B.store.setMistake(rec.id, { category: sel.value }); B.util.toast("Saved to your mistake bank"); }); }

  // ---------- MCQ ----------
  function renderMCQ(q, body, state) {
    const order = shuffle(q.options.map((o, i) => i));
    body.innerHTML = `<div class="opts" role="radiogroup"></div>`;
    const grp = $(".opts", body);
    order.forEach((i) => grp.append(el(h`<label class="opt"><input type="radio" name="mcq-${q.id}" value="${i}"><span>${q.options[i]}</span></label>`)));
    return { mark() {
      const sel = $("input:checked", grp); if (!sel) { B.util.toast("Choose an option first."); return null; }
      const chosen = +sel.value; const ok = chosen === q.answer;
      $$(".opt", grp).forEach((o) => { const v = +$("input", o).value; $("input", o).disabled = true; if (v === q.answer && (ok || state.tries > 0)) o.classList.add("correct"); else if (v === chosen && !ok) o.classList.add("wrong"); });
      return { score: ok ? q.marks : 0, response: q.options[chosen], detail: ok ? "" : `Your answer: ${esc(q.options[chosen])}. Correct answer: ${esc(q.options[q.answer])}.` };
    } };
  }

  // ---------- Gap fill ----------
  // q.text contains {{n}} placeholders; q.answers[n] = [accepted strings]
  function renderGap(q, body) {
    const html = esc(q.text).replace(/\{\{(\d+)\}\}/g, (m, n) => `<input class="gap-input" data-n="${n}" aria-label="gap ${n}" autocomplete="off">`);
    body.innerHTML = `<p>${html}</p>`;
    return { mark() {
      const inputs = $$(".gap-input", body); let score = 0; const resp = {}; const missed = [];
      inputs.forEach((inp) => { const n = inp.dataset.n; resp[n] = inp.value; const ok = (q.answers[n] || []).some((a) => B.util.answerMatches(inp.value, a)); inp.disabled = true; inp.classList.add(ok ? "ok" : "bad"); if (ok) score++; else missed.push(`gap ${n}: ${esc(q.answers[n][0])}`); });
      const marks = Math.round((score / inputs.length) * q.marks);
      return { score: marks, response: resp, detail: missed.length ? "Accepted answers: " + missed.join("; ") : "" };
    } };
  }

  // ---------- Matching ----------
  // q.pairs = [{left, right}]
  function renderMatch(q, body) {
    const rights = shuffle(q.pairs.map((p) => p.right));
    body.innerHTML = `<div class="match-grid"></div><div class="row mt"><button class="btn sm reset-match">Reset</button></div>`;
    const grid = $(".match-grid", body);
    q.pairs.forEach((p, i) => { grid.append(el(h`<div>${p.left}</div>`)); const sel = el(`<select data-i="${i}" aria-label="match for ${esc(p.left)}"><option value="">choose…</option></select>`); rights.forEach((r) => sel.append(el(h`<option value="${r}">${r}</option>`))); grid.append(sel); });
    $(".reset-match", body).addEventListener("click", () => $$("select", grid).forEach((s) => { s.value = ""; s.disabled = false; s.style.background = ""; }));
    return { mark() {
      const sels = $$("select", grid); if (sels.some((s) => !s.value)) { B.util.toast("Complete all matches first."); return null; }
      let score = 0; const resp = {}; const missed = [];
      sels.forEach((s) => { const p = q.pairs[+s.dataset.i]; const ok = s.value === p.right; resp[p.left] = s.value; s.disabled = true; s.style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)"; if (ok) score++; else missed.push(`${esc(p.left)} → ${esc(p.right)}`); });
      return { score: Math.round((score / q.pairs.length) * q.marks), response: resp, detail: missed.length ? "Correct matches: " + missed.join("; ") : "" };
    } };
  }

  // ---------- Sequencing (keyboard accessible: move up/down buttons) ----------
  // q.steps = correct order
  function renderSequence(q, body) {
    let order = shuffle(q.steps.map((s, i) => i)); if (order.every((v, i) => v === i)) order.reverse();
    body.innerHTML = `<p class="small muted">Use the arrows to arrange the steps in the correct order.</p><ol class="seq-list" aria-label="steps"></ol>`;
    const list = $(".seq-list", body);
    const draw = () => { list.innerHTML = ""; order.forEach((idx, pos) => { const li = el(h`<li data-idx="${idx}"><span class="n">${pos + 1}</span><span>${q.steps[idx]}</span><span class="mv"><button class="btn sm" aria-label="move up" data-d="-1">↑</button><button class="btn sm" aria-label="move down" data-d="1">↓</button></span></li>`); list.append(li); }); };
    draw();
    list.addEventListener("click", (e) => { const b = e.target.closest("button[data-d]"); if (!b || list.dataset.locked) return; const li = b.closest("li"); const pos = Array.from(list.children).indexOf(li); const np = pos + (+b.dataset.d); if (np < 0 || np >= order.length) return; [order[pos], order[np]] = [order[np], order[pos]]; draw(); });
    return { mark() {
      list.dataset.locked = "1"; let score = 0;
      Array.from(list.children).forEach((li, pos) => { const ok = +li.dataset.idx === pos; li.classList.add(ok ? "ok" : "bad"); if (ok) score++; $$("button", li).forEach((b) => (b.disabled = true)); });
      return { score: Math.round((score / q.steps.length) * q.marks), response: order.map((i) => q.steps[i]), detail: score === q.steps.length ? "" : "Correct order: " + q.steps.map((s, i) => `${i + 1}. ${esc(s)}`).join(" ") };
    } };
  }

  // ---------- Diagram labelling (accessible: numbered hotspots + select per hotspot) ----------
  // q.svg (string), q.labels = [{n, answer}] ; q.bank = all label strings
  function renderLabel(q, body) {
    body.innerHTML = `<div class="figure"><div class="fig-view">${q.svg}</div></div>${q.drag ? '<p class="small muted">Drag a label onto a numbered box, or use the drop-down lists (keyboard friendly). Dropping a label sets the matching list.</p><div class="drag-bank" id="bank"></div><div class="drop-grid" id="drops"></div>' : ""}<div class="match-grid"></div>`;
    const grid = $(".match-grid", body); const bank = shuffle(q.bank || q.labels.map((l) => l.answer));
    q.labels.forEach((l) => { grid.append(el(h`<div>Label ${l.n}</div>`)); const sel = el(`<select data-n="${l.n}" aria-label="label ${l.n}"><option value="">choose…</option></select>`); bank.forEach((b) => sel.append(el(h`<option value="${b}">${b}</option>`))); grid.append(sel); });
    if (q.drag) wireDrag(q, body, bank);
    return { mark() {
      const sels = $$("select", grid); if (sels.some((s) => !s.value)) { B.util.toast("Label every numbered structure first."); return null; }
      let score = 0; const resp = {}; const missed = [];
      sels.forEach((s) => { const l = q.labels.find((x) => String(x.n) === s.dataset.n); const ok = s.value === l.answer; resp[l.n] = s.value; s.disabled = true; s.style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)"; if (ok) score++; else missed.push(`${l.n}: ${esc(l.answer)}`); });
      if (q.drag) { body.dispatchEvent(new Event("labels-marked")); $$(".chip", body).forEach((c) => (c.style.pointerEvents = "none")); }
      return { score: Math.round((score / q.labels.length) * q.marks), response: resp, detail: missed.length ? "Correct labels: " + missed.join("; ") : "" };
    } };
  }

  // Pointer-based drag and drop for labelling (works with mouse and touch). The selects remain the accessible path.
  function wireDrag(q, body, bank) {
    const bankEl = $("#bank", body), drops = $("#drops", body);
    bank.forEach((b) => bankEl.append(el(h`<span class="chip" data-v="${b}" draggable="false">${b}</span>`)));
    q.labels.forEach((l) => drops.append(el(h`<div class="drop" data-n="${l.n}"><span class="n">${l.n}</span><span class="v muted">drop here</span></div>`)));
    const setLabel = (n, v) => { const sel = $(`select[data-n="${n}"]`, body); if (sel) { sel.value = v; } const d = $(`.drop[data-n="${n}"]`, drops); if (d) { $(".v", d).textContent = v; $(".v", d).classList.remove("muted"); } $$(".chip", bankEl).forEach((c) => c.classList.toggle("used", $$("select", body).some((s) => s.value === c.dataset.v))); };
    $$("select", body).forEach((sel) => sel.addEventListener("change", () => setLabel(sel.dataset.n, sel.value)));
    let drag = null, ghost = null;
    bankEl.addEventListener("pointerdown", (e) => { const c = e.target.closest(".chip"); if (!c || c.classList.contains("used")) return; drag = c; c.classList.add("dragging"); ghost = c.cloneNode(true); ghost.style.cssText = "position:fixed;pointer-events:none;z-index:99;opacity:.9"; document.body.append(ghost); move(e); c.setPointerCapture(e.pointerId); e.preventDefault(); });
    const move = (e) => { if (!ghost) return; ghost.style.left = e.clientX + 8 + "px"; ghost.style.top = e.clientY + 8 + "px"; $$(".drop", drops).forEach((d) => { const r = d.getBoundingClientRect(); d.classList.toggle("over", e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom); }); };
    bankEl.addEventListener("pointermove", move);
    const end = (e) => { if (!drag) return; const target = $$(".drop", drops).find((d) => d.classList.contains("over")); if (target) setLabel(target.dataset.n, drag.dataset.v); $$(".drop", drops).forEach((d) => d.classList.remove("over")); drag.classList.remove("dragging"); drag = null; if (ghost) { ghost.remove(); ghost = null; } };
    bankEl.addEventListener("pointerup", end); bankEl.addEventListener("pointercancel", end);
    // after marking, colour the drop boxes to match the selects
    body.addEventListener("labels-marked", () => { $$("select", body).forEach((sel) => { const d = $(`.drop[data-n="${sel.dataset.n}"]`, drops); if (d) d.classList.add(sel.style.background.includes("sage") ? "ok" : "bad"); }); });
  }

  // ---------- Short / extended: student writes, then self-marks against the mark scheme ----------
  // q.scheme = [{point, marks}] ; q.model ; q.alternatives ; q.commonErrors ; for extended, optional q.levels
  function renderShort(q, body) {
    body.innerHTML = h`<textarea aria-label="your answer" placeholder="Write your answer here…"></textarea>
      <div class="row mt"><button class="btn sm reveal">Reveal mark scheme and self-mark</button></div>
      <div class="scheme" hidden></div>`;
    const ta = $("textarea", body), reveal = $(".reveal", body), schemeBox = $(".scheme", body);
    let revealed = false;
    reveal.addEventListener("click", () => {
      if (!ta.value.trim()) { B.util.toast("Write your answer before revealing the mark scheme."); return; }
      revealed = true; reveal.disabled = true; ta.readOnly = true; schemeBox.hidden = false;
      schemeBox.innerHTML = h`<div class="markscheme"><strong>Mark scheme (${q.marks} marks).</strong> Tick each point your answer makes clearly.
        <div class="selfmark">${raw(q.scheme.map((p, i) => h`<label><input type="checkbox" data-m="${p.marks}" data-i="${i}"> <span>${p.point} <span class="badge">${p.marks}</span></span></label>`).join(""))}</div>
        ${q.alternatives ? raw(`<p class="small mt"><strong>Accept:</strong> ${esc(q.alternatives)}</p>`) : ""}
        ${q.commonErrors ? raw(`<p class="small"><strong>Common errors:</strong> ${esc(q.commonErrors)}</p>`) : ""}
        ${q.levels ? raw(`<p class="small"><strong>Level descriptors:</strong> ${esc(q.levels)}</p>`) : ""}
        <details class="mt"><summary>Model answer</summary><p class="small">${q.model}</p></details></div>`;
    });
    return { mark() {
      if (!revealed) { B.util.toast("Reveal the mark scheme and tick the points you achieved."); return null; }
      const ticks = $$("input[type=checkbox]", schemeBox); const score = Math.min(q.marks, ticks.filter((c) => c.checked).reduce((n, c) => n + (+c.dataset.m), 0));
      ticks.forEach((c) => (c.disabled = true));
      return { score, response: ta.value, detail: "Self-assessed. Your teacher can moderate this from your exported progress file." };
    } };
  }

  B.questions = { render, labelFor };
})(window.BIO);
