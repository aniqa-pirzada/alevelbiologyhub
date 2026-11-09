// Exam Practice Centre. Two banks: the platform's original questions (auto-marked where objective) and the
// past-paper questions imported from Exampro (self-marked against official schemes, see exampro.js).
// Tests run one question at a time with a progress bar, a timer and an end-of-test summary. Retries after
// a wrong first attempt are recorded but do not count towards the running score (see questions.js).
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, esc, shuffle } = B.util;

  function pool(prefix) { const out = []; for (const [ref, c] of Object.entries(B.content || {})) { if (prefix && !ref.startsWith(prefix)) continue; out.push(...(c.quickCheck || []), ...(c.questions || [])); } for (const [n, p] of Object.entries(B.practicals)) { if (!p.questions) continue; for (const q of p.questions) if (!prefix || q.ref.startsWith(prefix)) out.push(q); } return out; }
  const pastPool = (setRef) => { const s = (B.exampro || {})[setRef]; return s ? s.questions.filter((q) => q.cls !== "Other") : []; };
  const SIZES = [10, 15, 20];

  // Exported for the Unit Revision Centre's custom tests (Batch 9): B.examRunTest(key, questions, title, { retry: '#/...' })
  B.examRunTest = (...a) => runTest(...a);
  B.views.exam = function (kind, arg, n) {
    if (kind === "topic" && arg) return runTest(arg, shuffle(pool(arg)).slice(0, +n || 10), `Topic test · ${arg}`, { retry: `#/exam/topic/${arg}/${+n || 10}` });
    if (kind === "mixed") return runTest("mixed", shuffle(pool()).slice(0, +arg || 10), "Mixed-topic test", { retry: `#/exam/mixed/${+arg || 10}` });
    if (kind === "past" && arg) return runTest(`past ${arg}`, shuffle(pastPool(arg)).slice(0, +n || 5), `Past-paper set · ${arg}`, { past: true, retry: `#/exam/past/${arg}/${+n || 5}` });
    const total = pool().length;
    const sizeBtns = (base, cls) => SIZES.map((s, i) => h`<a class="btn ${i === 0 ? cls : ""}" href="${base}/${s}">${s}</a>`).join("");
    const unitCards = B.spec.units.map((u) => { const k = pool(u.ref).length; return h`<div class="card"><div class="eyebrow">${u.code}</div><h3>${u.short}</h3><p class="small muted">${u.exam.duration_min} min · ${u.exam.marks} marks. ${u.exam.structure}</p>${k ? raw(h`<p class="small">${k} questions available. Test length:</p><div class="row">${raw(sizeBtns(`#/exam/topic/${u.ref}`, "primary"))}</div>`) : raw('<span class="badge">no questions authored yet</span>')}</div>`; }).join("");
    const past = Object.values(B.exampro || {});
    const pastCards = past.map((s) => h`<div class="card"><div class="eyebrow">${s.ref}</div><h3>${s.title}</h3><p class="small muted">${s.count} real OxfordAQA questions (${s.marks} marks) with official mark schemes. Timed set, one question at a time, self-marked:</p><div class="row">${raw([3, 5, 8].map((k, i) => h`<a class="btn ${i === 0 ? "primary" : ""}" href="#/exam/past/${s.ref}/${k}">${k} questions</a>`).join(""))}<a class="btn ghost" href="#/pastpapers/${s.ref}">Browse all</a></div></div>`).join("");
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">Exam Practice Centre</div><h1>Timed practice</h1><p class="lede">Pick how many questions you want. Each test runs one question at a time with a timer and a progress bar, and finishes with a breakdown by topic.</p></div></div>
      <div class="card mb"><div class="card-head"><h3>Quick-fire test · original questions</h3><span class="badge">${total} in the pool</span></div><p class="small muted">Platform questions written to the 9610 style and marked as you go (written answers are self-marked). Draws from every authored subsection and practical. Choose a length:</p><div class="row">${total ? raw(sizeBtns("#/exam/mixed", "primary")) : raw('<span class="muted">No questions yet.</span>')}</div></div>
      <div class="grid grid-2 mb">${raw(unitCards)}</div>
      ${past.length ? raw(h`<h2 class="mt">Past-paper questions <span class="muted" style="font-weight:500;font-size:.8em">(OxfordAQA, via Exampro)</span></h2>
      <p class="small muted">Real exam questions and mark schemes, kept separate from the original questions above. You answer in writing, open the official scheme and award your own marks. <a href="#/pastpapers">Browse by topic →</a></p>
      <div class="grid grid-2">${raw(pastCards)}</div>`) : ""}
      <div class="card mt"><h3>Full paper-style practice</h3><p class="small muted">Unit 1 (BL01): two original 75-mark, 90-minute practice papers written in the BL01 style (65 marks of short-answer questions and a 10-mark comprehension question), with self-marking against full mark schemes and an exam review. They are platform papers, not official OxfordAQA papers. Papers for Units 2 to 5 will follow when those units are complete.</p><p><a class="btn primary" href="#/papers">Open the practice papers</a></p><p class="small">Official specimen material: <a href="https://www.oxfordaqa.com/wp-content/uploads/2026/07/9610-BL01-international-as-biology-specimen-paper-2016-v1.pdf" target="_blank" rel="noopener">BL01 specimen paper</a> (external link, OxfordAQA).</p></div>`, { title: "Exam practice", crumbs: [{ label: "Exam practice" }] });
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function runTest(key, qs, title, opts = {}) {
    const crumbs = opts.crumbs || [{ label: "Exam practice", href: "#/exam" }, { label: key }]; const back = opts.back || { href: "#/exam", label: "Back to Exam Practice" };
    if (!qs.length) return B.app.render(h`<div class="page-head"><div><h1>${title}</h1></div></div><div class="card"><div class="empty">${raw(icons.exam)}<h3>No questions available</h3><p>Questions for this selection have not been authored yet.</p></div></div>`, { title, crumbs });
    const totalMarks = qs.reduce((a, q) => a + q.marks, 0); const target = Math.max(2, Math.round(totalMarks * 1.2));
    const html = el(h`<div class="test">
      <h1 class="sr-only">${title}</h1>
      <div class="test-top card">
        <div class="test-meta"><div><div class="eyebrow">${title}</div><strong id="pos">Question 1 of ${qs.length}</strong> <span class="muted small">· ${totalMarks} marks · target ${target} min</span></div>
        <div class="row"><span class="badge teal" id="score">0 marks</span><span class="timer" id="timer" aria-live="off">00:00</span><button class="btn sm" id="pause" aria-label="Pause timer">Pause</button></div></div>
        <div class="progress test-bar" aria-label="Test progress"><span id="bar" style="width:0%"></span></div>
      </div>
      <div id="qhost"></div>
      <div class="row test-nav"><a class="btn ghost" href="${back.href}">Quit test</a><button class="btn primary" id="next" hidden>Next question →</button></div>
    </div>`);
    B.app.render(html, { title, crumbs });
    let i = 0, score = 0, elapsed = 0, running = true; const results = [];
    const bar = $("#bar", html), pos = $("#pos", html), scoreEl = $("#score", html), next = $("#next", html), host = $("#qhost", html);
    const iv = setInterval(() => { if (!document.body.contains(html)) { clearInterval(iv); return; } if (running) { elapsed++; $("#timer", html).textContent = fmt(elapsed); $("#timer", html).classList.toggle("over", elapsed > target * 60); } }, 1000);
    $("#pause", html).addEventListener("click", (e) => { running = !running; e.target.textContent = running ? "Pause" : "Resume"; host.classList.toggle("paused", !running); });
    const show = () => {
      host.innerHTML = ""; next.hidden = true; pos.textContent = `Question ${i + 1} of ${qs.length}`;
      const q = qs[i];
      const onAnswer = (res, rec) => { if (rec.retry) return; if (results[i]) return; results[i] = { q, score: res.score, max: q.marks }; score += res.score; scoreEl.textContent = `${score} mark${score === 1 ? "" : "s"}`; bar.style.width = (100 * (i + 1)) / qs.length + "%"; next.hidden = false; next.textContent = i + 1 < qs.length ? "Next question →" : "See my results →"; next.focus(); };
      const node = q.type === "exampro" || q.parts ? B.exampro_render(q, { onAnswer }) : B.questions.render(q, { onAnswer, srLabel: `Question ${i + 1} of ${qs.length}` });
      node.classList.add("enter"); host.append(node);
    };
    next.addEventListener("click", () => { i++; if (i < qs.length) show(); else finish(); });
    function finish() {
      running = false; clearInterval(iv);
      const byRef = {}; results.forEach((r) => { const k = r.q.ref; byRef[k] = byRef[k] || { score: 0, max: 0, n: 0 }; byRef[k].score += r.score; byRef[k].max += r.max; byRef[k].n++; });
      const pct = Math.round((100 * score) / totalMarks);
      const grade = pct >= 85 ? "Excellent: secure on this material." : pct >= 70 ? "Good: a few points to tighten." : pct >= 50 ? "Developing: revisit the weakest topics below." : "Early days: go back to the notes for these topics before the next attempt.";
      const rows = Object.entries(byRef).sort().map(([ref, v]) => h`<tr><td><a href="#/topic/${ref}">${ref}</a></td><td>${v.n}</td><td>${v.score} / ${v.max}</td><td><div class="progress sage" style="width:120px"><span style="width:${Math.round((100 * v.score) / v.max)}%"></span></div></td></tr>`).join("");
      const list = results.map((r, k) => h`<li><span class="badge mono">${r.q.code || r.q.id}</span> ${r.q.ref} · <strong>${r.score} / ${r.max}</strong></li>`).join("");
      B.store.touchActivity("test");
      html.innerHTML = h`<div class="page-head"><div><div class="eyebrow">${title}</div><h1>Test complete</h1><p class="lede">${grade}</p></div></div>
        <div class="grid grid-3 mb"><div class="card"><div class="stat"><span class="v count">${score} / ${totalMarks}</span><span class="l">marks (${pct}%)</span></div></div><div class="card"><div class="stat"><span class="v">${fmt(elapsed)}</span><span class="l">time taken · target ${target}:00</span></div></div><div class="card"><div class="stat"><span class="v">${qs.length}</span><span class="l">questions answered</span></div></div></div>
        <div class="card mb"><h3>By specification topic</h3><table class="tbl"><thead><tr><th>Ref</th><th>Qs</th><th>Marks</th><th></th></tr></thead><tbody>${raw(rows)}</tbody></table></div>
        <div class="card mb"><h3>Question by question</h3><ul class="plain">${raw(list)}</ul><p class="tiny muted mt">Every attempt is stored in your history and feeds the Personal Progress page${opts.past ? " (past-paper marks are self-awarded)" : ""}.</p></div>
        <div class="row">${opts.retry ? raw(h`<a class="btn primary" href="${opts.retry}">Another ${qs.length}-question set</a>`) : ""}<a class="btn" href="${back.href}">${back.label}</a><a class="btn ghost" href="#/progress">Personal Progress</a></div>`;
      const bigBar = el(`<div class="progress test-bar mb"><span style="width:0%"></span></div>`); html.prepend(bigBar); requestAnimationFrame(() => { $("span", bigBar).style.width = pct + "%"; });
    }
    show();
  }
})(window.BIO);
