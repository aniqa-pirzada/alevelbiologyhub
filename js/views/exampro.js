// Past-paper questions supplied through Exampro (OxfordAQA / AQA material, used under the school's licence).
// Data: window.BIO.exampro[setRef] built by tools/build_exampro.py. Nothing here is auto-marked: the
// student answers in the boxes, opens the official mark scheme, awards marks per part, and the attempt is
// stored with mode "self" exactly like the platform's own written questions.
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, esc, shuffle } = B.util;

  const sets = () => Object.values(B.exampro || {});
  const all = () => sets().flatMap((s) => s.questions);
  const find = (code) => all().find((q) => q.code === code || q.id === code);
  const topicTitle = (ref) => { for (const u of B.spec.units) for (const t of u.topics) { if (t.ref === ref) return t.title; for (const s of t.subsections) if (s.ref === ref) return s.title; } return ""; };
  const seriesOf = (code) => { const m = code.match(/^Q([AB]?)([SW])(\d\d)/); if (!m) return code.startsWith("QSP") ? "Specimen paper" : "Exampro reference"; const yr = 2000 + +m[3]; return `${m[2] === "W" ? "Winter" : "Summer"} ${yr}${m[1] ? " (AQA legacy specification)" : ""}`; };
  B.exampro_util = { all, find, seriesOf };

  // Marked parts: question parts that carry a mark allocation. Questions whose parts carry no marks
  // (older single-part items) are self-marked against the total.
  function markedParts(q) { const mp = q.parts.filter((p) => p.marks); return mp.length ? mp : [{ label: null, marks: q.marks, whole: true }]; }
  function schemeFor(q, part) { if (part.whole) return q.scheme; const byLabel = q.scheme.filter((s) => s.label === part.label); return byLabel; }

  // Renders one past-paper question; opts.onAnswer(res, rec) fires when marks are saved.
  function render(q, opts = {}) {
    const prior = B.store.get().attempts.filter((a) => a.qid === q.id);
    const node = el(h`<section class="q ex" data-qid="${q.id}"></section>`);
    const parts = markedParts(q);
    node.innerHTML = h`
      <div class="q-head"><div class="row"><span class="badge navy">Past paper · OxfordAQA</span><span class="badge mono">${q.code}</span><span class="badge">${seriesOf(q.code)}</span><span class="badge teal">${q.marks} marks</span>${prior.length ? raw(h`<span class="badge sage">attempted ${prior.length}×</span>`) : ""}</div></div>
      <div class="ex-parts"></div>
      <div class="row mt q-actions"><button class="btn primary ex-show">Show mark scheme</button><span class="tiny muted">Write your answers first. The official mark scheme opens below and you award your own marks.</span></div>
      <div class="ex-scheme" hidden></div>`;
    const host = $(".ex-parts", node);
    q.parts.forEach((p) => {
      host.insertAdjacentHTML("beforeend", `<div class="ex-part">${p.html}</div>`);
      if (p.marks) host.insertAdjacentHTML("beforeend", h`<div class="ex-answer"><textarea rows="${Math.min(8, 1 + p.marks * 2)}" placeholder="Your answer to (${p.label || "this part"}), ${p.marks} mark${p.marks === 1 ? "" : "s"}" data-part="${p.label || ""}"></textarea></div>`);
    });
    if (parts[0].whole) host.insertAdjacentHTML("beforeend", h`<div class="ex-answer"><textarea rows="6" placeholder="Your answer (${q.marks} marks)"></textarea></div>`);
    const showBtn = $(".ex-show", node), sch = $(".ex-scheme", node);
    showBtn.addEventListener("click", () => {
      showBtn.disabled = true; sch.hidden = false;
      sch.innerHTML = `<div class="ex-scheme-head"><h4>Official mark scheme</h4><span class="tiny muted">Semicolons separate marking points. Award yourself a mark for each point you made, up to the maximum for that part.</span></div>` +
        parts.map((p, i) => `<div class="ex-ms-part"><div class="ex-ms-body">${(p.whole ? q.scheme : schemeFor(q, p)).map((s) => s.html).join("") || '<p class="muted small">See the full scheme below.</p>'}</div><label class="ex-award">Marks for ${p.whole ? "this question" : "(" + esc(p.label) + ")"}: <input type="number" min="0" max="${p.marks}" value="0" data-i="${i}" data-max="${p.marks}"> / ${p.marks}</label></div>`).join("") +
        `<details class="ex-full"><summary>Full mark scheme as published</summary>${q.scheme.map((s) => s.html).join("")}</details>
         <div class="row mt"><button class="btn primary ex-save">Save my marks</button><span class="ex-total badge teal">0 / ${q.marks}</span></div><div class="q-fb"></div>`;
      const inputs = $$("input[type=number]", sch), tot = $(".ex-total", sch);
      const sum = () => inputs.reduce((n, inp) => n + Math.min(+inp.dataset.max, Math.max(0, +inp.value || 0)), 0);
      inputs.forEach((inp) => inp.addEventListener("input", () => { tot.textContent = `${sum()} / ${q.marks}`; }));
      $(".ex-save", sch).addEventListener("click", (e) => {
        const score = sum(); const answers = $$("textarea", node).map((t) => t.value);
        const rec = B.store.logAttempt({ qid: q.id, ref: q.ref, type: "exampro", score, max: q.marks, response: answers, hinted: false, mode: "self", selfAssessed: true, code: q.code });
        e.target.disabled = true; inputs.forEach((i) => (i.disabled = true));
        $(".q-fb", sch).innerHTML = h`<div class="feedback ${score === q.marks ? "ok" : score ? "neutral" : "bad"}"><strong>${score} / ${q.marks} recorded.</strong> ${score < q.marks ? "Re-read the points you missed and add the question to your revision notes." : "Full marks. Well done."}</div>`;
        if (opts.onAnswer) opts.onAnswer({ score, max: q.marks }, rec);
      });
    });
    return node;
  }
  B.exampro_render = render;

  // ---------- Pages ----------
  B.views.pastpapers = function (setRef, code) {
    if (code) return questionPage(setRef, code);
    if (setRef) return setPage(setRef);
    if (!sets().length) return B.app.render(h`<div class="page-head"><div><div class="eyebrow">Exam Practice Centre</div><h1>Past-paper questions</h1></div></div><div class="card"><p>This build does not include any past-paper material. Official OxfordAQA past papers and mark schemes are available from your teacher and from <a href="https://www.oxfordaqa.com/qualification/international-as-and-a-level-biology-9610/" target="_blank" rel="noopener">OxfordAQA</a>.</p><a class="btn" href="#/exam">Back to Exam Practice</a></div>`, { title: "Past papers", crumbs: [{ label: "Exam practice", href: "#/exam" }, { label: "Past papers" }] });
    const cards = sets().map((s) => h`<a class="card tile" href="#/pastpapers/${s.ref}"><div class="eyebrow">${s.ref}</div><h3>${s.title}</h3><p class="small muted">${s.count} questions · ${s.marks} marks · OxfordAQA past papers and specimen material via Exampro</p></a>`).join("");
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">Exam Practice Centre</div><h1>Past-paper questions <span class="muted" style="font-weight:500">(OxfordAQA, via Exampro)</span></h1><p class="lede">Real questions and official mark schemes. Answer in the boxes, open the scheme, award your own marks. Separate from the platform's original questions, which are marked automatically.</p></div></div>
      <div class="grid grid-2">${raw(cards || '<div class="card"><p class="muted">No past-paper sets imported yet.</p></div>')}</div>${raw(licenceNote())}`, { title: "Past-paper questions", crumbs: [{ label: "Exam practice", href: "#/exam" }, { label: "Past papers" }] });
  };

  function licenceNote() { return `<div class="card mt small muted"><strong>Licence.</strong> These questions and mark schemes are OxfordAQA / AQA material supplied through Exampro under the school's subscription. The teacher has confirmed this site is used only by her own students; the questions must not be copied or shared beyond the school. Codes beginning QA/QB are from earlier AQA specifications and are included by Exampro because the content still matches; check any such question against the current specification before relying on its wording.</div>`; }

  function setPage(setRef) {
    const s = (B.exampro || {})[setRef]; if (!s) return B.app.render(h`<div class="card"><h2>No past-paper set for ${setRef}</h2><a class="btn" href="#/pastpapers">Back</a></div>`, { title: "Past papers" });
    const st = B.store.get();
    const refs = [...new Set(s.questions.map((q) => q.ref))].sort();
    const root = el(h`<div><div class="page-head"><div><div class="eyebrow">Past-paper questions · OxfordAQA via Exampro</div><h1>${s.ref} ${s.title}</h1><p class="lede">${s.count} questions, ${s.marks} marks. Filter by the specification topic the question best fits, or let the site pick one for you.</p></div><div class="row"><a class="btn primary" href="#/exam/past/${s.ref}/5">Timed set of 5</a><a class="btn" id="rand">Random question</a></div></div>
      <div class="card mb"><div class="row wrap" id="filters"><button class="pill on" data-ref="">All (${s.count})</button>${raw(refs.map((r) => h`<button class="pill" data-ref="${r}">${r} ${topicTitle(r)} (${s.questions.filter((q) => q.ref === r).length})</button>`).join(""))}</div><div class="row mt"><label class="small"><input type="checkbox" id="show-other"> include questions mainly on other topics (${s.questions.filter((q) => q.cls === "Other").length})</label><input id="exq" type="search" placeholder="Search question text or keywords…" aria-label="Search past-paper questions" class="input" style="flex:1;min-width:200px;padding:.55rem .8rem;border:1px solid var(--line-strong);border-radius:10px;font:inherit"><label class="small"><input type="checkbox" id="hide-done"> hide attempted</label></div></div>
      <div id="list" class="grid grid-2"></div>${raw(licenceNote())}</div>`);
    const list = $("#list", root);
    const draw = () => {
      const ref = $(".pill.on", root).dataset.ref, term = $("#exq", root).value.trim().toLowerCase(), hide = $("#hide-done", root).checked, other = $("#show-other", root).checked;
      const qs = s.questions.filter((q) => (other || q.cls !== "Other") && (!ref || q.ref === ref) && (!term || (q.summary + " " + q.keywords.join(" ") + " " + q.code).toLowerCase().includes(term)) && (!hide || !st.attempts.some((a) => a.qid === q.id)));
      list.innerHTML = qs.map((q) => { const att = st.attempts.filter((a) => a.qid === q.id); const best = att.length ? Math.max(...att.map((a) => a.score)) : null; return h`<a class="card tile exq" href="#/pastpapers/${s.ref}/${q.code}"><div class="row" style="justify-content:space-between"><span class="badge mono">${q.code}</span><span class="row" style="gap:.3rem"><span class="badge ${q.cls === "Core" ? "sage" : q.cls === "Synoptic" ? "amber" : ""}">${q.cls === "Other" ? "mainly " + q.ref : q.cls.toLowerCase()}</span><span class="badge teal">${q.marks} marks</span></span></div><p class="small" style="margin:.5rem 0 .3rem">${q.summary}</p><div class="row wrap tiny muted"><span>${seriesOf(q.code)}</span>${q.figures ? raw('<span>· includes figure</span>') : ""}<span>· best fit ${q.ref}</span>${best !== null ? raw(h`<span class="badge sage">best ${best}/${q.marks}</span>`) : ""}</div></a>`; }).join("") || '<div class="card"><p class="muted">No questions match.</p></div>';
    };
    $$(".pill", root).forEach((c) => c.addEventListener("click", () => { $$(".pill", root).forEach((x) => x.classList.toggle("on", x === c)); draw(); }));
    $("#exq", root).addEventListener("input", draw); $("#hide-done", root).addEventListener("change", draw); $("#show-other", root).addEventListener("change", draw);
    $("#rand", root).addEventListener("click", () => { const q = shuffle(s.questions.filter((x) => x.cls !== "Other"))[0]; location.hash = `#/pastpapers/${s.ref}/${q.code}`; });
    draw();
    B.app.render(root, { title: `Past papers ${s.ref}`, crumbs: [{ label: "Exam practice", href: "#/exam" }, { label: "Past papers", href: "#/pastpapers" }, { label: s.ref }] });
  }

  function questionPage(setRef, code) {
    const s = (B.exampro || {})[setRef]; const q = s && s.questions.find((x) => x.code === code);
    if (!q) return B.app.render(h`<div class="card"><h2>Question not found</h2><a class="btn" href="#/pastpapers">Back</a></div>`, { title: "Past papers" });
    const i = s.questions.indexOf(q), prev = s.questions[i - 1], next = s.questions[i + 1];
    const root = el(h`<div><div class="page-head"><div><div class="eyebrow">Past-paper question · OxfordAQA via Exampro</div><h1>${q.code}</h1><p class="lede">Best-fit specification topic: <a href="#/topic/${q.ref}">${q.ref} ${topicTitle(q.ref)}</a>${q.refs.length > 1 ? raw(h` · also touches ${q.refs.filter((r) => r !== q.ref).join(", ")}`) : ""}. Exampro tags: ${q.keywords.join("; ")}.</p></div><div class="row">${prev ? raw(h`<a class="btn" href="#/pastpapers/${s.ref}/${prev.code}">← Previous</a>`) : ""}${next ? raw(h`<a class="btn" href="#/pastpapers/${s.ref}/${next.code}">Next →</a>`) : ""}</div></div><div id="q"></div>${raw(licenceNote())}</div>`);
    $("#q", root).append(render(q));
    B.app.render(root, { title: q.code, crumbs: [{ label: "Exam practice", href: "#/exam" }, { label: "Past papers", href: "#/pastpapers" }, { label: s.ref, href: `#/pastpapers/${s.ref}` }, { label: q.code }] });
  }

  // Past-paper questions relevant to a subsection or topic, for embedding in topic pages.
  B.views.pastpapersFor = function (ref) {
    const qs = all().filter((q) => (q.ref === ref || q.refs.includes(ref)) && (q.cls !== "Other" || q.ref === ref));
    if (!qs.length) return "";
    return `<div class="card mt ex-embed"><div class="card-head"><h3>Past-paper questions <span class="muted small">(OxfordAQA, via Exampro)</span></h3><span class="badge navy">${qs.length} questions</span></div><p class="small muted">Real exam questions tagged to this topic, with official mark schemes. Self-marked; kept separate from the practice questions above.</p><div class="row wrap">${qs.slice(0, 12).map((q) => h`<a class="pill" href="#/pastpapers/${setOf(q)}/${q.code}">${q.code} · ${q.marks}m</a>`).join("")}${qs.length > 12 ? h`<a class="pill" href="#/pastpapers">all ${qs.length} →</a>` : ""}</div></div>`;
  };
  function setOf(q) { for (const s of sets()) if (s.questions.includes(q)) return s.ref; return ""; }
})(window.BIO);
