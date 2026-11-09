// Synoptic hub, planner, progress, checklist, and route registration.
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, esc, fmtDate, fmtDateTime, dayKey } = B.util;

  // ---------- Synoptic ----------
  B.views.synoptic = function () {
    const u5 = B.spec.unit5; const links = [];
    for (const [ref, c] of Object.entries(B.content || {})) for (const s of c.synoptic || []) links.push({ from: ref, to: s.ref, text: s.text });
    const aoRows = Object.entries(B.spec.aoWeightsAL).map(([ao, w]) => h`<tr><td>${ao}</td>${raw(["3.1", "3.2", "3.3", "3.4", "BL05"].map((k) => `<td>${w[k]}%</td>`).join(""))}<td><strong>${Object.values(w).reduce((a, b) => a + b, 0)}%</strong></td></tr>`).join("");
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">Unit 5 · BL05</div><h1>Synoptic connections and the synoptic paper</h1><p class="lede">${u5.exam.structure} ${u5.exam.duration_min} minutes, ${u5.exam.marks} marks, ${u5.exam.alevel_weight}% of the A-level.</p></div></div>
      <div class="grid grid-2">
        <div class="card"><h3>What BL05 rewards</h3><ul><li><strong>55 marks</strong> of short answer questions based on practical work: planning, variables, apparatus, data handling, graphs, calculations and evaluation drawn from the ten required practicals and the skills they contain.</li><li><strong>20 marks</strong> of structured synoptic writing that draws together content from Units 1 to 4.</li><li>AO4 (selecting, describing and evaluating procedures) carries its heaviest weighting here (8% of the whole A-level).</li></ul></div>
        <div class="card"><h3>Assessment objective weightings (A-level, %)</h3><table><tr><th>AO</th><th>U1</th><th>U2</th><th>U3</th><th>U4</th><th>U5</th><th>Total</th></tr>${raw(aoRows)}</table><p class="tiny muted">${raw(B.spec.assessmentObjectives.map((a) => `<strong>${a.id}</strong> ${esc(a.text)}`).join(" "))}</p></div>
      </div>
      <div class="card mt"><div class="card-head"><h3>Connections map</h3><span class="badge">${links.length} links recorded</span></div>
        ${links.length ? raw(`<table><tr><th>From</th><th>To</th><th>Relationship</th></tr>${links.map((l) => h`<tr><td><a href="#/topic/${l.from}">${l.from}</a></td><td><a href="#/topic/${l.to}">${l.to}</a></td><td>${l.text}</td></tr>`).join("")}</table><p class="small muted mt">The clickable graph view and original synoptic questions are scheduled for Phase 6; links accumulate automatically as each subsection is authored.</p>`) : raw(`<div class="empty">${icons.synoptic}<h3>No connections yet</h3><p>Connections are recorded as subsections are written.</p></div>`)}
      </div>`, { title: "Synoptic", crumbs: [{ label: "Synoptic" }] });
  };

  // ---------- Planner ----------
  B.views.planner = function () {
    const st = B.store.get(); const pl = st.planner; const units = B.spec.units.filter((u) => (pl.level === "A2" ? true : u.level === "AS"));
    const examInputs = (pl.level === "A2" ? [...B.spec.units.filter((u) => u.level === "A2"), B.spec.unit5] : B.spec.units.filter((u) => u.level === "AS")).map((u) => h`<label class="small" style="display:block;margin-bottom:.4rem">${u.code} ${u.short}: <input type="date" data-code="${u.code}" value="${pl.examDates[u.code] || ""}"></label>`).join("");
    const authoredSubs = () => B.progress.allSubs().filter((s) => (B.content[s.ref] || {}).status !== "not_started");
    const html = el(h`<div><div class="page-head"><div><div class="eyebrow">Revision Planner</div><h1>Build a revision schedule</h1><p class="lede">Enter your exam dates from your school's timetable (dates are never assumed), set your weekly hours, and generate sessions that mix retrieval, application and spaced review. Mark sessions done; missed ones can be pushed back.</p></div></div>
      <div class="grid grid-2">
        <div class="card"><h3>Settings</h3>
          <label class="small">Level <select id="lvl"><option value="AS" ${pl.level === "AS" ? "selected" : ""}>AS (Units 1–2)</option><option value="A2" ${pl.level === "A2" ? "selected" : ""}>A2 (Units 3–5)</option></select></label>
          <div class="mt"><strong class="small">Exam dates</strong><div class="mt" id="dates">${raw(examInputs)}</div></div>
          <label class="small mt" style="display:block">Hours available per week <input type="number" id="hours" min="1" max="40" value="${pl.hoursPerWeek}" style="width:80px"></label>
          <div class="mt"><strong class="small">Priority units</strong><div id="targets">${raw(units.map((u) => h`<label class="small" style="display:block"><input type="checkbox" value="${u.ref}" ${pl.targets.includes(u.ref) ? "checked" : ""}> ${u.ref} ${u.short}</label>`).join(""))}</div></div>
          <div class="row mt"><button class="btn primary" id="gen">Generate schedule</button><button class="btn" id="save">Save settings</button></div>
          <p class="tiny muted mt">Sessions are 45 minutes. The generator only schedules subsections that currently have authored content, prioritising low-mastery topics and due flashcards; other subsections are listed as "textbook review".</p>
        </div>
        <div class="card"><h3>Your schedule</h3><div id="sched"></div></div>
      </div></div>`);
    B.app.render(html, { title: "Planner", crumbs: [{ label: "Planner" }] });
    const readSettings = () => { pl.level = $("#lvl", html).value; pl.hoursPerWeek = +$("#hours", html).value || 6; pl.examDates = {}; $$("#dates input", html).forEach((i) => { if (i.value) pl.examDates[i.dataset.code] = i.value; }); pl.targets = $$("#targets input:checked", html).map((i) => i.value); B.store.save(); };
    $("#lvl", html).addEventListener("change", () => { readSettings(); B.views.planner(); });
    $("#save", html).addEventListener("click", () => { readSettings(); B.util.toast("Planner settings saved."); });
    $("#gen", html).addEventListener("click", () => {
      readSettings(); const dates = Object.values(pl.examDates).sort(); if (!dates.length) { B.util.toast("Enter at least one exam date first."); return; }
      const end = new Date(dates[0] + "T00:00:00"); const start = new Date(); start.setHours(0, 0, 0, 0); const days = Math.max(1, Math.round((end - start) / 864e5));
      if (end <= start) { B.util.toast("The exam date must be in the future."); return; }
      const perDay = pl.hoursPerWeek / 7; const sessionsPerWeek = Math.max(1, Math.round((pl.hoursPerWeek * 60) / 45));
      const per = B.progress.perSubsection().filter((s) => (pl.level === "A2" ? ["3.3", "3.4"].includes(s.unit) : ["3.1", "3.2"].includes(s.unit)));
      const scoreOf = (s) => (pl.targets.includes(s.unit) ? 3 : 0) + (s.mastery.pct != null && s.mastery.pct < 70 ? 3 : 0) + (!s.visited ? 2 : 0) + (B.content[s.ref] && B.content[s.ref].status !== "not_started" ? 1 : 0);
      const ordered = per.sort((a, b) => scoreOf(b) - scoreOf(a));
      const kinds = ["Read notes and tick statements", "Quick check and flashcards", "Practice questions (exam style)", "Spaced review: flashcards due + mistake bank"];
      const sessions = []; let d = new Date(start); d.setDate(d.getDate() + 1); let k = 0; let weekCount = 0; let weekStart = new Date(d);
      while (d < end && sessions.length < 400) {
        if ((d - weekStart) / 864e5 >= 7) { weekStart = new Date(d); weekCount = 0; }
        if (weekCount < sessionsPerWeek) { const sub = ordered[k % ordered.length]; const authored = B.content[sub.ref] && B.content[sub.ref].status !== "not_started"; sessions.push({ id: B.util.uid(), date: dayKey(d), ref: sub.ref, title: sub.title, kind: authored ? kinds[k % kinds.length] : "Textbook review (notes not yet on the platform)", done: false }); weekCount++; k++; }
        d.setDate(d.getDate() + 1);
      }
      pl.sessions = sessions; B.store.save(); drawSched();
    });
    function drawSched() {
      const box = $("#sched", html);
      if (!pl.sessions.length) { box.innerHTML = `<div class="empty">${icons.planner}<h3>No schedule yet</h3><p>Set your exam dates and hours, then generate.</p></div>`; return; }
      const byDay = {}; pl.sessions.forEach((s) => (byDay[s.date] = byDay[s.date] || []).push(s)); const today = dayKey();
      box.innerHTML = Object.entries(byDay).slice(0, 60).map(([day, ss]) => `<div class="plan-day mb"><h4>${fmtDate(day + "T12:00:00")}${day < today ? ' <span class="badge amber">past</span>' : day === today ? ' <span class="badge teal">today</span>' : ""}</h4>${ss.map((s) => h`<div class="session ${s.done ? "done" : ""}"><input type="checkbox" data-id="${s.id}" ${s.done ? "checked" : ""} aria-label="done"><span><a href="#/topic/${s.ref}">${s.ref}</a> ${s.title}: <em>${s.kind}</em></span>${!s.done && day < today ? raw(`<button class="btn sm" data-push="${s.id}">Push to tomorrow</button>`) : ""}</div>`).join("")}</div>`).join("") + (Object.keys(byDay).length > 60 ? '<p class="tiny muted">Showing the first 60 days.</p>' : "");
      $$("input[data-id]", box).forEach((cb) => cb.addEventListener("change", () => { const s = pl.sessions.find((x) => x.id === cb.dataset.id); s.done = cb.checked; B.store.save(); if (cb.checked) B.store.touchActivity("planner"); drawSched(); }));
      $$("button[data-push]", box).forEach((b) => b.addEventListener("click", () => { const s = pl.sessions.find((x) => x.id === b.dataset.push); const t = new Date(); t.setDate(t.getDate() + 1); s.date = dayKey(t); pl.sessions.sort((a, b2) => a.date.localeCompare(b2.date)); B.store.save(); drawSched(); }));
    }
    drawSched();
  };

  // ---------- Progress ----------
  // Short preview of a question's wording for the mistake bank (looks the question up wherever it lives).
  function qPreview(qid) { const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\{\{\d+\}\}/g, "…").replace(/\s+/g, " ").trim();
    const all = []; for (const c of Object.values(B.content || {})) { all.push(...(c.quickCheck || []), ...(c.questions || []), ...(c.focus || []).map((f) => f.question).filter(Boolean)); for (const it of [c.interactive, ...(c.interactives || [])].filter(Boolean)) all.push(...(it.questions || []), ...(it.items || []).flatMap((x) => x.questions || [])); }
    for (const c of Object.values(B.consolidation || {})) all.push(...((c.assessment || {}).questions || []));
    const q = all.find((x) => x && x.id === qid); const s = q ? strip(q.prompt || q.stem || q.q || q.text) : ""; return s ? (s.length > 90 ? s.slice(0, 88) + "…" : s) : qid; }
  B.views.progress = function () {
    const st = B.store.get(); const P = B.progress; const per = P.perSubsection();
    const unitBars = B.spec.units.map((u) => ({ label: u.ref, value: P.mastery((a) => a.ref.startsWith(u.ref + ".")).pct }));
    const covBars = B.spec.units.map((u) => ({ label: u.ref, value: P.coverage((x) => x.unit === u.ref).pct }));
    const days = Object.keys(st.activity).sort(); const perf = days.map((d) => { const atts = st.attempts.filter((a) => dayKey(a.ts) === d); const sc = atts.reduce((n, a) => n + a.score, 0), mx = atts.reduce((n, a) => n + a.max, 0); return mx ? { x: days.indexOf(d), y: Math.round((100 * sc) / mx) } : null; }).filter(Boolean);
    const heat = per.map((s) => h`<a href="#/topic/${s.ref}" data-l="${s.level}" title="${s.ref} ${s.title}: ${s.mastery.questions ? (s.mastery.sufficient ? s.mastery.pct + "% mastery" : "insufficient data") : "no attempts"}" aria-label="${s.ref} ${s.title}"></a>`).join("");
    const mistakes = Object.entries(st.mistakes).filter(([id, m]) => !m.resolved);
    const recs = P.recommendations(8);
    const html = el(h`<div><div class="page-head"><div><div class="eyebrow">Personal Progress</div><h1>Coverage, mastery and retention</h1><p class="lede"><strong>Coverage</strong> = subsections you marked complete. <strong>Mastery</strong> = your latest score on each distinct question (hint-assisted attempts excluded; needs 3+ questions per subsection). <strong>Retention</strong> = flashcards recalled correctly after a gap of two or more days.</p></div><div class="row"><button class="btn" id="exp">Export progress</button></div></div>
      <div class="grid grid-2 mb">
        <div class="card"><h3>Mastery by unit</h3>${raw(B.charts.bar(unitBars))}</div>
        <div class="card"><h3>Coverage by unit</h3>${raw(B.charts.bar(covBars, { color: "var(--sage)" }))}</div>
      </div>
      <div class="grid grid-2 mb">
        <div class="card"><h3>Performance over time</h3><p class="tiny muted">Daily mean score (% of available marks) on days you answered questions.</p>${raw(B.charts.line(perf, { xLabel: "study day #", yLabel: "mean score %" }))}</div>
        <div class="card"><h3>Topic heatmap (mastery)</h3><p class="tiny muted">One square per subsection in specification order. Grey: no attempts; pale to dark teal: 1–4; pink: attempted but fewer than 3 questions.</p><div class="heat">${raw(heat)}</div></div>
      </div>
      <div class="grid grid-2 mb">
        <div class="card"><div class="card-head"><h3>Mistake bank</h3><span class="badge">${mistakes.length} open</span></div>
          ${mistakes.length ? raw(`<table><tr><th>Spec</th><th>Category</th><th></th></tr>${mistakes.map(([id, m]) => h`<tr><td><a href="#/topic/${m.ref}/check/${m.qid}">${m.ref}</a><div class="tiny muted">${qPreview(m.qid)}</div></td><td><select data-id="${id}"><option value="">uncategorised</option>${raw(["knowledge:Knowledge gap", "misconception:Misconception", "maths:Mathematical error", "technique:Examination technique", "misread:Misreading the question"].map((o) => { const [v, l] = o.split(":"); return `<option value="${v}" ${m.category === v ? "selected" : ""}>${l}</option>`; }).join(""))}</select></td><td><a class="btn sm" href="#/topic/${m.ref}/check/${m.qid}">Reattempt</a> <button class="btn sm" data-res="${id}">Resolved</button></td></tr>`).join("")}</table>`) : raw(`<div class="empty">${icons.check}<h3>No open mistakes</h3><p>Incorrect answers are saved here automatically so you can classify and reattempt them.</p></div>`)}</div>
        <div class="card"><h3>Why these topics are recommended</h3>${recs.length ? raw(`<ul>${recs.map((r) => h`<li><a href="#/topic/${r.ref}">${r.ref} ${r.title}</a>: ${r.why.join("; ")}</li>`).join("")}</ul>`) : raw('<p class="muted small">Recommendations appear once you have studied or attempted something.</p>')}</div>
      </div>
      <div class="card"><div class="card-head"><h3>Assessment history</h3><span class="badge">${st.attempts.length} attempts</span></div>${st.attempts.length ? raw(`<div style="max-height:360px;overflow:auto"><table><tr><th>Date</th><th>Question</th><th>Spec</th><th>Type</th><th>Attempt</th><th>Score</th><th>Marking</th></tr>${st.attempts.slice().reverse().map((a) => h`<tr><td>${fmtDateTime(a.ts)}</td><td class="tiny">${a.qid}</td><td><a href="#/topic/${a.ref}">${a.ref}</a></td><td>${B.questions.labelFor(a.type)}</td><td>${a.attempt}</td><td>${a.score}/${a.max}</td><td>${a.mode === "self" ? "self-assessed" : "automatic"}${a.hinted ? ", hint" : ""}</td></tr>`).join("")}</table></div>`) : raw('<p class="muted small">No attempts recorded yet.</p>')}</div></div>`);
    B.app.render(html, { title: "Progress", crumbs: [{ label: "Progress" }] });
    $("#exp", html).addEventListener("click", () => B.store.exportJSON());
    $$("select[data-id]", html).forEach((s) => s.addEventListener("change", () => B.store.setMistake(s.dataset.id, { category: s.value || null })));
    $$("button[data-res]", html).forEach((b) => b.addEventListener("click", () => { B.store.setMistake(b.dataset.res, { resolved: true }); B.views.progress(); }));
  };

  // ---------- Checklist ----------
  B.views.checklist = function () {
    const st = B.store.get(); const m = B.spec.meta;
    const stmtRow = (x) => h`<label class="check-row"><input type="checkbox" data-id="${x.id}" ${st.checklist[x.id] ? "checked" : ""}><span>${x.text}</span></label>`;
    const subBlock = (s) => h`<div class="small" style="margin:.4rem 0 .2rem"><a href="#/topic/${s.ref}"><strong>${s.ref} ${s.title}</strong></a> ${raw(B.views.lib.statusBadge((B.content[s.ref] || {}).status || "not_started"))}</div>` + s.statements.map(stmtRow).join("");
    const topicBlock = (t) => h`<h4 class="mt">${t.ref} ${t.title}</h4>` + t.subsections.map(subBlock).join("");
    const sections = B.spec.units.map((u) => h`<details class="acc" ${u.ref === "3.1" ? raw("open") : ""}><summary>${u.title} <span class="badge">${u.code}</span></summary><div class="acc-body">${raw(u.topics.map(topicBlock).join(""))}</div></details>`).join("");
    const total = B.spec.meta.counts.statements, ticked = Object.keys(st.checklist).length;
    const html = el(h`<div><div class="page-head"><div><div class="eyebrow">Complete Specification Checklist</div><h1>Every examinable statement</h1><p class="lede">${B.spec.meta.counts.units} units · ${B.spec.meta.counts.practicals} required practicals. Tick a statement when you can do it from memory. Ticks are shared with the topic pages.</p></div></div>
      <div class="card mb" id="ckprog"><div class="row" style="justify-content:space-between"><strong class="small">Your progress</strong><span class="small muted"><span class="v">${ticked}</span> of ${total} statements ticked</span></div><div class="progress mt" style="height:12px"><span style="width:${Math.round((100 * ticked) / total)}%"></span></div></div>
      <div class="notice mb"><strong>Source.</strong> OxfordAQA International AS and A-level Biology (9610), specification version ${m.specVersion}; ${m.validFrom}. Statements are paraphrased: always check the exact wording in the <a href="${m.specPdfUrl}" target="_blank" rel="noopener">official specification PDF</a> (<a href="${m.specPdfAltUrl}" target="_blank" rel="noopener">alternative link</a>).</div>
      ${raw(sections)}
      <details class="acc"><summary>Required practicals (${B.spec.practicals.length})</summary><div class="acc-body"><ul>${raw(B.spec.practicals.map((p) => h`<li><a href="#/lab/${p.n}">RP${p.n}</a> (${p.level}, ${p.unit}): ${p.title}</li>`).join(""))}</ul></div></details>
      <details class="acc"><summary>Mathematical requirements (section 7)</summary><div class="acc-body"><ul>${raw(B.spec.maths.map((x) => h`<li>${x.id}: ${x.text}</li>`).join(""))}</ul><p class="small muted">${B.spec.mathsNote}</p></div></details></div>`);
    B.app.render(html, { title: "Checklist", crumbs: [{ label: "Checklist" }] });
    $$(".check-row input", html).forEach((cb) => cb.addEventListener("change", () => { B.store.tick(cb.dataset.id, cb.checked); const n = Object.keys(B.store.get().checklist).length; $("#ckprog .v", html).textContent = n; $("#ckprog .progress > span", html).style.width = Math.round((100 * n) / total) + "%"; }));
  };

  // ---------- Routes ----------
  B.views.register = function () {
    const r = B.app.route;
    r("/dashboard", B.views.dashboard); r("/about", B.views.about);
    r("/library", () => B.views.library()); r("/library/:u", (u) => B.views.library(u)); r("/library/:u/:t", (u, t) => B.views.library(u, t));
    r("/topic/:ref", B.views.topic);
    r("/topic/:ref/:tab", (ref, tab) => B.views.topicTab(ref, tab));
    r("/topic/:ref/:tab/:qid", (ref, tab, qid) => B.views.topicTab(ref, tab, qid));
    r("/consolidate/:t", (t) => B.views.consolidation(t)); r("/consolidate/:t/:tab", (t, tab) => B.views.consolidation(t, tab));
    r("/lab", () => B.views.lab()); r("/lab/:n", (n) => B.views.lab(n)); r("/lab/:n/alt", (n) => B.views.lab(n, "alt"));
    r("/maths", () => B.views.maths()); r("/maths/:id", (id) => B.views.maths(id));
    r("/flashcards", () => B.views.flashcards()); r("/flashcards/:ref", (ref) => B.views.flashcards(ref));
    r("/synoptic", B.views.synoptic);
    r("/unit/:u", (u) => B.views.unitHub(u)); r("/unit/:u/map", (u) => B.views.unitMap(u)); r("/unit/:u/:tab", (u, tab) => B.views.unitHub(u, tab));
    r("/cluster/:id", (id) => B.views.cluster(id)); r("/cluster/:id/:tab", (id, tab) => B.views.cluster(id, tab));
    r("/papers", () => B.views.papers()); r("/papers/:id", (id) => B.views.papers(id)); r("/papers/:id/:mode", (id, mode) => B.views.papers(id, mode)); r("/papers/:id/:mode/:arg", (id, mode, arg) => B.views.papers(id, mode, arg));
    r("/exam", () => B.views.exam()); r("/exam/:kind/:arg", (k, a) => B.views.exam(k, a)); r("/exam/:kind/:arg/:n", (k, a, n) => B.views.exam(k, a, n));
    r("/pastpapers", () => B.views.pastpapers()); r("/pastpapers/:s", (s) => B.views.pastpapers(s)); r("/pastpapers/:s/:code", (s, c) => B.views.pastpapers(s, c));
    r("/planner", B.views.planner); r("/progress", B.views.progress); r("/checklist", B.views.checklist);
  };
})(window.BIO);
