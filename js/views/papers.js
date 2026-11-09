// Practice papers: runner and Exam Review Mode (Batch 9, owned by the paper-runner author).
//
// Routes (wired in misc.js):
//   #/papers                      list of papers by unit, previous runs, links to start, resume or review
//   #/papers/:id                  start screen (Exam Mode or Practice Mode, instructions, structure, resume or discard)
//   #/papers/:id/run              the paper. Exam Mode: continuous countdown from a stored deadline (keeps running while
//                                 the page is closed; no pause; warnings at 10 and 1 min; auto-submit at zero, also on
//                                 return after the deadline). Practice Mode: untimed, save and leave, resume later.
//   #/papers/:id/mark             self-marking stage after finishing (written parts, point by point against the scheme)
//   #/papers/:id/report/:ts       score report for one saved run (total, by question, topic, AO, time)
//   #/papers/:id/review/:ts       Exam Review Mode (answers, schemes, weak statements, revision, mistake bank, revisits)
//
// Storage:
//   In-progress drafts: B.store.get().paperDrafts[paperId] (inside the main store document, so they survive a reload,
//     are cleared by "reset progress" and travel with an exported progress file). One attempt per paper; shape documented
//     at "drafts" below. Saved on every change (debounced), periodically, on leaving the page and when the tab is
//     hidden. Deleted when the run is saved. Runs record mode ("exam" | "practice"; absent on older runs), limit,
//     deadline, seconds (Exam: time used up to the deadline; Practice: time spent with the page open), timeUp, closedAway.
//   Finished runs: B.store.logPaper(id, {seconds, score, max, pct, byQ, byRef, byStmt, byAO, answers, ticks, attempts, ...}).
//   Part attempts: objective parts are marked by the question engine (B.questions.render) when the student finishes;
//     written parts are logged with B.store.logAttempt(mode "self") after self-marking; unanswered parts are logged as
//     0-mark attempts (unanswered: true). Every attempt carries ref, stmts, ao and paper (and source "paper:<id>"), so
//     mastery and the mistake bank (all attempts with score < max) stay correct.
//
// Revisit rule (per specification statement, from this run only): below 50 % -> revisit due in 1 day; 50-79 % -> due in
//   3 days; 80 % or more -> none. Scheduled with B.store.addRevisit({ref, stmt, reason, due, source: "paper:<id>"}).
//   A statement scores the full marks of every part tagged with it. AO marks of a part tagged with several AOs are split
//   equally between them, so AO totals add up to the paper total.
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, esc, icons, fmtDate, fmtDateTime } = B.util;
  const OBJ = ["mcq", "gap", "match", "sequence", "label"];
  const isObj = (pt) => OBJ.includes(pt.type);
  const WEAK_BELOW = 50;
  const revisitDays = (pc) => (pc < 50 ? 1 : pc < 80 ? 3 : null);
  const EXAM_WARN = [10, 1]; // Exam Mode: minutes remaining that are announced (once each, polite live region)
  const DAY = 864e5;
  const pctOf = (s, m) => (m ? Math.round((100 * s) / m) : 0);
  const r1 = (x) => Math.round(x * 10) / 10;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const clock = (sec) => { sec = Math.max(0, Math.round(sec)); return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`; };
  const dur = (sec) => { sec = Math.max(0, Math.round(sec || 0)); const hh = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return hh ? `${hh} h ${m} min` : m ? `${m} min ${s} s` : `${s} s`; };
  const hoursMins = (min) => { const hh = Math.floor(min / 60), m = min % 60; return [hh ? plural(hh, "hour") : "", m ? plural(m, "minute") : ""].filter(Boolean).join(" ") || "0 minutes"; };
  const stemHTML = (s) => String(s || "").replace(/\n/g, "<br>");
  const reduced = () => document.documentElement.classList.contains("reduce-motion") || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- data helpers ----------
  const allPapers = () => Object.values(B.papers || {}).filter((p) => p && p.id && Array.isArray(p.questions) && p.questions.some((q) => (q.parts || []).length));
  const partsOf = (p) => p.questions.flatMap((q, qi) => (q.parts || []).map((pt) => ({ pt, q, qi })));
  const qMax = (q) => (q.parts || []).reduce((n, pt) => n + (+pt.marks || 0), 0);
  const paperMax = (p) => partsOf(p).reduce((n, x) => n + (+x.pt.marks || 0), 0);
  const runsOf = (id) => ((B.store.get().papers || {})[id] || []);
  let IDX = null;
  function idx() {
    if (IDX) return IDX; IDX = { sub: {}, stmt: {}, topic: {}, unit: {} };
    for (const u of B.spec.units) { IDX.unit[u.ref] = u; for (const t of u.topics) { IDX.topic[t.ref] = t; for (const s of t.subsections) { IDX.sub[s.ref] = { ref: s.ref, title: s.title, topic: t.ref }; for (const st of s.statements || []) IDX.stmt[st.id] = { text: st.text, ref: s.ref }; } } }
    return IDX;
  }
  const subTitle = (ref) => (idx().sub[ref] || {}).title || "";
  const topicRefOf = (ref) => { const i = idx(); if (i.sub[ref]) return i.sub[ref].topic; const m = String(ref).split(".").slice(0, 3).join("."); return i.topic[m] ? m : String(ref); };
  const topicTitle = (tref) => (idx().topic[tref] || {}).title || "";
  const stmtRef = (id) => (idx().stmt[id] || {}).ref || String(id).replace(/\.s\d+$/, "");
  const stmtText = (id) => (idx().stmt[id] || {}).text || "";
  const aoText = (a) => ((B.spec.assessmentObjectives || []).find((x) => x.id === a) || {}).text || "";
  const unitLabel = (p) => { const u = idx().unit[p.unit]; return u ? `Unit ${B.spec.units.indexOf(u) + 1}: ${u.short}` : p.unit || ""; };
  const statusBadge = (st) => (B.views.lib && B.views.lib.statusBadge ? B.views.lib.statusBadge(st || "draft") : h`<span class="badge">${st || "draft"}</span>`);
  const crumbs = (p, last) => [{ label: "Practice papers", href: "#/papers" }, ...(p ? [last ? { label: p.title, href: `#/papers/${p.id}` } : { label: p.title }] : []), ...(last ? [{ label: last }] : [])];

  // ---------- answers ----------
  const gapKeys = (pt) => [...String(pt.text || "").matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]);
  function readObj(pt, node) {
    switch (pt.type) {
      case "mcq": { const c = $("input[type=radio]:checked", node); return c ? +c.value : null; }
      case "gap": { const o = {}; $$(".gap-input", node).forEach((i) => (o[i.dataset.n] = i.value)); return o; }
      case "match": { const o = {}; $$(".match-grid select", node).forEach((s) => (o[s.dataset.i] = s.value)); return o; }
      case "label": { const o = {}; $$(".match-grid select", node).forEach((s) => (o[s.dataset.n] = s.value)); return o; }
      case "sequence": return $$(".seq-list li", node).map((li) => +li.dataset.idx);
    }
    return null;
  }
  function restoreObj(pt, node, v) {
    if (v == null) return;
    try {
      if (pt.type === "mcq") { const i = $$("input[type=radio]", node).find((x) => +x.value === v); if (i) i.checked = true; }
      else if (pt.type === "gap") $$(".gap-input", node).forEach((i) => { if (v[i.dataset.n] != null) i.value = v[i.dataset.n]; });
      else if (pt.type === "match" || pt.type === "label") $$(".match-grid select", node).forEach((s) => { const k = pt.type === "match" ? s.dataset.i : s.dataset.n; if (v[k] != null && $$("option", s).some((o) => o.value === v[k])) { s.value = v[k]; s.dispatchEvent(new Event("change")); } });
      else if (pt.type === "sequence" && Array.isArray(v) && v.length === pt.steps.length) {
        // The engine keeps the order privately, so rebuild it with its own move-up buttons.
        for (let pos = 0; pos < v.length; pos++) {
          let lis = $$(".seq-list li", node); let j = lis.findIndex((li) => +li.dataset.idx === v[pos]);
          while (j > pos) { $('button[data-d="-1"]', lis[j]).click(); j--; lis = $$(".seq-list li", node); }
        }
      }
    } catch (e) { console.warn("Could not restore answer for", pt.id, e); }
  }
  function answered(pt, v, touched) {
    if (v == null) return false;
    if (!isObj(pt)) return String(v).trim() !== "";
    if (pt.type === "mcq") return typeof v === "number";
    if (pt.type === "sequence") return !!touched; // an untouched list is the shuffled starting order, not an answer
    return Object.values(v).some((x) => String(x).trim() !== "");
  }
  const complete = (pt, v) => pt.type === "match" ? pt.pairs.every((_, i) => v && v[i]) : pt.type === "label" ? pt.labels.every((l) => v && v[l.n]) : true;
  // Same rule as the engine (correct / total x marks, rounded), used only when a matching or labelling part was left incomplete.
  function partialScore(pt, v) {
    if (pt.type === "match") return Math.round((pt.pairs.filter((pr, i) => (v || {})[i] === pr.right).length / pt.pairs.length) * pt.marks);
    if (pt.type === "label") return Math.round((pt.labels.filter((l) => (v || {})[l.n] === l.answer).length / pt.labels.length) * pt.marks);
    return 0;
  }
  function schemeScore(pt, ticks) { const sch = pt.scheme || []; return Math.min(+pt.marks || 0, (ticks || []).reduce((n, i) => n + (+(sch[i] || {}).marks || 0), 0)); }
  function tag(p, pt, extra) { return Object.assign({ stmts: pt.stmts || [], ao: pt.ao || [], paper: p.id, source: "paper:" + p.id }, extra || {}); }
  function logManual(p, pt, score, response, mode, unanswered) {
    const rec = B.store.logAttempt(Object.assign({ qid: pt.id, ref: pt.ref, type: pt.type, score, max: +pt.marks || 0, response, hinted: false, mode }, tag(p, pt, unanswered ? { unanswered: true } : {})));
    return { score, max: +pt.marks || 0, attempt: rec.id, unanswered: !!unanswered };
  }

  // ---------- drafts ----------
  // One in-progress attempt per paper, in B.store.get().paperDrafts[paperId]. Shape (v 2):
  //   {v: 2, mode: "exam"|"practice", paper, started: ts, limit: seconds allowed, deadline: ts (Exam Mode only, started +
  //    limit; null in Practice Mode), seen: latest wall-clock ts observed (Exam Mode; time never runs backwards if the
  //    system clock is turned back), elapsed: seconds spent with the paper open (Practice Mode), stage: "run"|"mark",
  //    cur, entered, resumes, answers{partId}, touched{partId}, warned[minutes], timeUp, closedAway, auto{partId},
  //    ticks{partId: [schemeIndex]}, finishedAt, finishedEarly, saved: ts}
  // A version 1 draft (the old pausing clock) has no deadline, so it is resumed as a Practice Mode attempt.
  // A draft that fails validation (corrupted or edited by hand) is removed, and the start screen says so once.
  function drafts() { const s = B.store.get(); if (!s.paperDrafts || typeof s.paperDrafts !== "object" || Array.isArray(s.paperDrafts)) s.paperDrafts = {}; return s.paperDrafts; }
  const plainObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
  const fin = (x) => typeof x === "number" && Number.isFinite(x);
  const droppedDrafts = {};
  function checkDraft(id, d) {
    if (!plainObj(d) || d.paper !== id || !["run", "mark"].includes(d.stage) || !plainObj(d.answers) || !fin(d.started) || d.started <= 0) return false;
    for (const k of ["touched", "auto", "ticks"]) if (!plainObj(d[k])) d[k] = {};
    if (!Array.isArray(d.warned)) d.warned = [];
    if (!Array.isArray(d.pauses)) d.pauses = [];
    if (!fin(d.cur)) d.cur = 0;
    if (!fin(d.resumes) || d.resumes < 0) d.resumes = 0;
    if (d.mode === "exam") {
      if (!fin(d.limit) || d.limit <= 0 || d.limit > 24 * 3600 || !fin(d.deadline) || Math.abs(d.deadline - d.started - d.limit * 1000) > 1000) return false;
      if (!fin(d.seen) || d.seen < d.started) d.seen = d.started;
      if (d.seen > d.deadline) d.seen = d.deadline;
    } else if (d.mode === "practice" || d.mode == null) {
      if (d.mode == null) { d.mode = "practice"; d.deadline = null; d.migrated = 1; } // v1 drafts: old pausing clock
      if (!fin(d.elapsed) || d.elapsed < 0) d.elapsed = 0;
      if (!fin(d.limit) || d.limit <= 0) d.limit = 0;
    } else return false;
    d.v = 2; return true;
  }
  function getDraft(id) {
    const all = drafts(); const d = all[id]; if (d == null) return null;
    if (checkDraft(id, d)) return d;
    console.warn("Practice paper: ignoring an unreadable saved attempt for", id); delete all[id]; droppedDrafts[id] = true; B.store.save(); return null;
  }
  function putDraft(d) { d.saved = Date.now(); drafts()[d.paper] = d; B.store.save(); }
  function dropDraft(id) { delete drafts()[id]; B.store.save(); }
  const limitOf = (p) => (p.minutes || 90) * 60;
  function newDraft(p, mode) {
    const t = Date.now(); const limit = limitOf(p);
    return { v: 2, mode, paper: p.id, started: t, limit, deadline: mode === "exam" ? t + limit * 1000 : null, seen: t, elapsed: 0, stage: "run", cur: 0, entered: false, resumes: 0, answers: {}, touched: {}, pauses: [], warned: [], timeUp: false, closedAway: false, auto: {}, ticks: {}, finishedAt: null };
  }
  const draftProgress = (p, d) => { const ps = partsOf(p); return { done: ps.filter(({ pt }) => answered(pt, d.answers[pt.id], d.touched[pt.id])).length, total: ps.length }; };
  // Exam Mode time: always the stored deadline minus the current time, never below 0 or above the time allowed.
  // `seen` keeps the latest clock reading, so turning the system clock back cannot give time back.
  function nowFor(d) { const n = Date.now(); if (!fin(d.seen) || n > d.seen) d.seen = n; return d.seen; }
  const remainingMs = (d) => Math.min(d.limit * 1000, Math.max(0, d.deadline - nowFor(d)));
  const expired = (d) => d.mode === "exam" && d.stage === "run" && remainingMs(d) <= 0;
  const usedSec = (d) => d.mode === "exam" ? Math.min(d.limit, Math.max(0, ((d.finishedAt ? Math.min(d.finishedAt, d.deadline) : Math.min(nowFor(d), d.deadline)) - d.started) / 1000)) : Math.max(0, d.elapsed || 0);
  const hm = (sec) => { const m = Math.round((sec || 0) / 60), hh = Math.floor(m / 60), mm = m % 60; return [hh ? `${hh} h` : "", mm ? `${mm} min` : ""].filter(Boolean).join(" ") || "0 min"; };
  // Mode label for a draft or a saved run. Runs saved before the modes existed used a clock that paused while closed.
  const modeLabel = (r) => r.mode === "exam" ? `Exam Mode, ${hm(r.limit || (r.minutes || 90) * 60)}` : r.mode === "practice" ? "Practice Mode, untimed" : "Timed (earlier version: clock paused while the paper was closed)";
  const modeShort = (r) => r.mode === "exam" ? "Exam Mode" : r.mode === "practice" ? "Practice Mode" : "Earlier timed run";

  // ---------- pure aggregation (exported for tests) ----------
  function aggregate(p, scores) {
    const byQ = {}, byNum = {}, byRef = {}, byTopic = {}, byStmt = {}, byAO = {}; let score = 0, max = 0;
    const add = (o, k, s, m) => { const b = o[k] || (o[k] = { score: 0, max: 0 }); b.score += s; b.max += m; };
    for (const { pt, q } of partsOf(p)) {
      const m = +pt.marks || 0; const s = Math.max(0, Math.min(m, +scores[pt.id] || 0));
      byQ[pt.id] = { score: s, max: m }; add(byNum, q.num, s, m); add(byRef, pt.ref, s, m); add(byTopic, topicRefOf(pt.ref), s, m);
      (pt.stmts || []).forEach((st) => add(byStmt, st, s, m));
      const aos = pt.ao && pt.ao.length ? pt.ao : ["untagged"]; aos.forEach((a) => add(byAO, a, s / aos.length, m / aos.length));
      score += s; max += m;
    }
    Object.values(byAO).forEach((b) => { b.score = r1(b.score); b.max = r1(b.max); });
    return { score, max, pct: pctOf(score, max), byQ, byNum, byRef, byTopic, byStmt, byAO };
  }
  B.papersLib = { aggregate, revisitDays, partsOf, WEAK_BELOW };

  // Active run controller (one at a time). Flushed when the tab is hidden or the page unloads.
  let active = null;
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => { if (!active) return; if (document.visibilityState === "hidden") active.flush(); else if (active.tick) active.tick(); });
    window.addEventListener("pagehide", () => { if (active) active.flush(); });
  }

  B.views.papers = function (id, mode, arg) {
    if (active) { active.stop(); active = null; }
    if (!id) return listView();
    const p = (B.papers || {})[id];
    if (!p || !Array.isArray(p.questions) || !partsOf(p).length) return missing(id);
    if (!mode) return startView(p);
    if (mode === "run") return runView(p);
    if (mode === "mark") return markView(p);
    if (mode === "report") return reportView(p, arg);
    if (mode === "review") { const [ts, anchor] = String(arg || "").split("#"); return reviewView(p, ts, anchor); }
    return missing(id);
  };

  function missing(id) {
    B.app.render(h`<div class="page-head"><div><h1>Paper not found</h1><p class="lede">There is no practice paper called <code>${id}</code> yet, or it has no questions.</p></div></div><div class="card"><a class="btn" href="#/papers">All practice papers</a></div>`, { title: "Practice papers", crumbs: crumbs(null) });
  }
  const NOTE = "Original platform paper written in the BL01 style. Not an official OxfordAQA paper.";
  const officialNote = `<p class="small pp-official" role="note"><strong>About these papers.</strong> They are original practice papers written for this platform in the style of the OxfordAQA BL01 paper (structure, timing and question styles). They are not official OxfordAQA papers, were not set or endorsed by OxfordAQA and do not predict what will be examined. Marks are self-awarded for written answers, so treat your score as a guide.</p>`;

  // ---------- list ----------
  function runsTable(p) {
    const runs = runsOf(p.id).slice().reverse(); if (!runs.length) return '<p class="small muted">No completed attempts yet.</p>';
    return h`<table class="tbl pp-runs"><caption class="sr-only">Previous attempts at ${p.title}</caption><thead><tr><th scope="col">Date</th><th scope="col">Score</th><th scope="col">Mode and time</th><th scope="col"><span class="sr-only">Links</span></th></tr></thead><tbody>${raw(runs.map((r) => h`<tr><td>${fmtDateTime(r.ts)}</td><td><strong>${r.score} / ${r.max}</strong> (${pctOf(r.score, r.max)}%)</td><td><span class="pp-mode-cell">${modeLabel(r)}</span><span class="tiny muted"> · ${raw(runTimeShort(r))}</span></td><td class="pp-links"><a href="#/papers/${p.id}/report/${r.ts}">Report<span class="sr-only"> for ${fmtDateTime(r.ts)}</span></a> <a href="#/papers/${p.id}/review/${r.ts}">Review<span class="sr-only"> for ${fmtDateTime(r.ts)}</span></a></td></tr>`).join(""))}</tbody></table>`;
  }
  // Time summary of a saved run, by mode.
  function runTimeShort(r) {
    if (r.mode === "exam") return esc(`${clock(r.seconds)} used${r.timeUp ? ", time ran out" : ""}`);
    if (r.mode === "practice") return esc(`${clock(r.seconds)} spent`);
    return esc(`${clock(r.seconds || 0)}${r.timeUp ? " (time up)" : ""}`);
  }
  function draftBadge(p, d) {
    const pr = draftProgress(p, d);
    if (d.stage === "mark") return h`<span class="badge amber pp-inprog">${modeShort(d)} · finished, not marked yet</span>`;
    if (d.mode === "exam") return expired(d) ? h`<span class="badge rose pp-inprog">Exam Mode · time ran out · ${pr.done} of ${pr.total} parts answered</span>` : h`<span class="badge amber pp-inprog">Exam Mode in progress · ${pr.done} of ${pr.total} parts answered · ${clock(remainingMs(d) / 1000)} left</span>`;
    return h`<span class="badge amber pp-inprog">Practice Mode · ${pr.done} of ${pr.total} parts answered · last saved ${fmtDateTime(d.saved || d.started)}</span>`;
  }
  function primaryAction(p) {
    const d = getDraft(p.id);
    if (d && (d.stage === "mark" || expired(d))) return h`<a class="btn primary" href="#/papers/${p.id}/mark">${d.stage === "mark" ? "Continue marking" : "Go to marking"}</a>${raw(draftBadge(p, d))}`;
    if (d) return h`<a class="btn primary" href="#/papers/${p.id}">Resume paper</a>${raw(draftBadge(p, d))}`;
    return h`<a class="btn primary" href="#/papers/${p.id}">Start paper</a>`;
  }
  function paperCard(p) {
    const nQ = p.questions.length, nP = partsOf(p).length;
    return h`<article class="card pp-card" aria-labelledby="pc-${p.id}">
      <div class="card-head"><h3 id="pc-${p.id}">${p.title}</h3>${raw(statusBadge(p.status))}</div>
      <p class="small"><span class="badge mono">${p.code || ""}</span> ${paperMax(p)} marks · ${p.minutes || 90} minutes · ${plural(nQ, "question")} (${plural(nP, "part")})</p>
      <p class="tiny muted">${p.note || NOTE}</p>
      <div class="row mb">${raw(primaryAction(p))}</div>
      <h4 class="small">Previous attempts</h4>${raw(runsTable(p))}</article>`;
  }
  function listView() {
    const ps = allPapers(); const by = {}; ps.forEach((p) => (by[p.unit] = by[p.unit] || []).push(p));
    const known = B.spec.units.filter((u) => by[u.ref]);
    const other = Object.keys(by).filter((k) => !known.some((u) => u.ref === k));
    const sections = known.map((u, i) => h`<section class="mb pp-unit" aria-labelledby="pu-${i}"><h2 id="pu-${i}">${u.code} · Unit ${B.spec.units.indexOf(u) + 1}: ${u.short}</h2><p class="small muted">${u.exam ? `${u.exam.duration_min} minutes, ${u.exam.marks} marks. ${u.exam.structure || ""}` : ""}</p><div class="grid grid-2">${raw(by[u.ref].map(paperCard).join(""))}</div></section>`).join("")
      + other.map((k, i) => h`<section class="mb pp-unit" aria-labelledby="po-${i}"><h2 id="po-${i}">Other papers</h2><div class="grid grid-2">${raw(by[k].map(paperCard).join(""))}</div></section>`).join("");
    B.app.render(h`<div class="pp-page"><div class="page-head"><div><div class="eyebrow">Exam practice</div><h1>Practice papers</h1><p class="lede">Full-length papers in Exam Mode (a continuous timed sitting) or Practice Mode (untimed, save and come back), then self-marking against the mark scheme and an Exam Review that tells you which specification statements to revisit.</p></div></div>
      ${raw(officialNote)}
      ${ps.length ? raw(sections) : raw(`<div class="card"><div class="empty">${icons.exam}<h3>No practice papers yet</h3><p>The first BL01-style papers are being written and checked. They will appear here when they are ready.</p></div></div>`)}</div>`, { title: "Practice papers", crumbs: crumbs(null) });
  }

  // ---------- start screen ----------
  function startView(p) {
    const d = getDraft(p.id); const max = paperMax(p); const mins = p.minutes || 90; const limit = limitOf(p);
    // Exam Mode deadline already passed: the paper is closed for answering and goes straight to self-marking.
    if (d && expired(d)) { location.replace(`#/papers/${p.id}/run`); return; }
    const lost = droppedDrafts[p.id]; delete droppedDrafts[p.id];
    const comp = p.questions.filter((q) => q.kind === "comprehension"); const compMarks = comp.reduce((n, q) => n + qMax(q), 0);
    const hasObj = partsOf(p).some(({ pt }) => isObj(pt));
    const struct = p.questions.map((q) => h`<tr><th scope="row">${q.num}</th><td>${q.kind === "comprehension" ? "Comprehension (passage)" : "Short-answer"}</td><td>${(q.parts || []).length}</td><td>${qMax(q)}</td></tr>`).join("");
    // The attempt in progress, if any (only one per paper).
    let current = "";
    if (d && d.stage === "mark") current = h`<section class="card mb notice pp-notice" aria-labelledby="pp-cur-h"><h2 id="pp-cur-h" class="pp-h3">Attempt waiting to be marked</h2><p><strong>${modeLabel(d)}.</strong> You have finished this attempt but not marked it yet. Your answers are saved.</p><div class="row"><a class="btn primary" href="#/papers/${p.id}/mark" id="pp-resume">Continue marking</a></div></section>`;
    else if (d) {
      const pr = draftProgress(p, d);
      const what = d.mode === "exam"
        ? h`<p><strong>Exam Mode in progress</strong> (started ${fmtDateTime(d.started)}): ${pr.done} of ${pr.total} parts answered. <strong><span id="pp-start-left">${clock(remainingMs(d) / 1000)}</span> left.</strong> The clock has kept running since you left and will not stop.</p>`
        : h`<p><strong>Resume: ${pr.done} of ${pr.total} parts answered, last saved ${fmtDateTime(d.saved || d.started)}.</strong> Practice Mode, untimed${d.elapsed ? `, ${clock(d.elapsed)} spent so far` : ""}.${d.migrated ? " (This attempt was started with the earlier pausing clock, so it continues untimed.)" : ""}</p>`;
      current = h`<section class="card mb notice pp-notice" aria-labelledby="pp-cur-h"><h2 id="pp-cur-h" class="pp-h3">Attempt in progress</h2>${raw(what)}<div class="row"><a class="btn primary" href="#/papers/${p.id}/run" id="pp-resume">Resume paper</a><button class="btn danger" id="pp-discard" aria-expanded="false" aria-controls="pp-discard-box">Discard this attempt</button></div>
        <div id="pp-discard-box" class="pp-discard" hidden><p class="small">This deletes the saved answers for this attempt. Nothing is recorded.</p><div class="row"><button class="btn danger" id="pp-discard-yes">Yes, discard my answers</button><button class="btn" id="pp-discard-no">Keep them</button></div></div></section>`;
    }
    const modes = h`<section class="mb pp-modes" aria-labelledby="pp-modes-h"><h2 id="pp-modes-h">Choose how to sit the paper</h2>
      <div class="grid grid-2">
        <article class="card pp-mode pp-mode-exam" aria-labelledby="pm-exam"><h3 id="pm-exam">Exam Mode <span class="badge navy">timed, ${hm(limit)}</span></h3>
          <ul class="pp-ins">
            <li>A <strong>${hm(limit)}</strong> countdown starts when you press Start and <strong>does not stop</strong>. It keeps running if you leave the page, reload, close the tab or come back on another day, just like a real exam.</li>
            <li>There is no pause. You get a reminder when 10 minutes and 1 minute are left.</li>
            <li>When the time runs out your answers are submitted for marking automatically. If you are away at that moment, the paper is closed when you come back and goes straight to marking with the answers saved so far.</li>
            <li>You may finish early. Your results show the time you used and whether time ran out.</li>
          </ul>
          <button class="btn primary" id="pp-start" data-mode="exam">Start Exam Mode (${hm(limit)})</button></article>
        <article class="card pp-mode pp-mode-practice" aria-labelledby="pm-prac"><h3 id="pm-prac">Practice Mode <span class="badge">untimed</span></h3>
          <ul class="pp-ins">
            <li>No countdown. Work at your own pace; the time you spend with the paper open is shown for your information only.</li>
            <li>Your answers save as you work. Use <strong>Save and leave</strong> to stop, then resume from this page whenever you like.</li>
            <li>Finish when you are ready. Your results are labelled as an untimed attempt.</li>
          </ul>
          <button class="btn" id="pp-start-practice" data-mode="practice">Start Practice Mode (untimed)</button></article>
      </div>
      <div id="pp-replace" class="card pp-replace" hidden role="group" aria-labelledby="pp-replace-h"><h3 id="pp-replace-h" tabindex="-1">You already have an attempt at this paper</h3><p class="small" id="pp-replace-txt"></p>
        <div class="row"><a class="btn primary" href="#/papers/${p.id}/${d && d.stage === "mark" ? "mark" : "run"}">${d && d.stage === "mark" ? "Continue marking it" : "Resume it"}</a><button class="btn danger" id="pp-replace-yes"></button><button class="btn" id="pp-replace-no">Cancel</button></div></div></section>`;
    const html = el(h`<div class="pp-page">
      <div class="page-head"><div><div class="eyebrow">${p.code || ""} practice paper · ${unitLabel(p)}</div><h1>${p.title}</h1><p class="lede">${p.note || NOTE}</p><div class="row mt">${raw(statusBadge(p.status))}<span class="badge navy">${max} marks</span><span class="badge">${hoursMins(mins)}</span></div></div></div>
      ${lost ? raw('<div class="notice pp-timeup mb" role="status">A saved attempt at this paper could not be read, so it has been ignored and removed. Your completed attempts are not affected.</div>') : ""}
      ${raw(current)}
      ${raw(modes)}
      <div class="grid grid-2 mb pp-start">
        <section class="card" aria-labelledby="pp-ins"><h2 id="pp-ins">Instructions</h2>
          <ul class="pp-ins">
            <li>Time allowed in the exam: <strong>${hoursMins(mins)}</strong>. Choose Exam Mode to practise under that limit, or Practice Mode to work without a clock.</li>
            <li>Answer <strong>all</strong> questions. The paper has ${max} marks${comp.length ? raw(h`: ${max - compMarks} marks of short-answer questions and a ${compMarks}-mark comprehension question based on a passage with numbered lines`) : ""}.</li>
            <li>The marks for each part are shown in brackets. Use them to judge how much to write.</li>
            <li>Have a calculator and a ruler ready. Show your working in calculations and give units.</li>
            <li>You can move between questions at any time. The overview shows which parts are answered.</li>
            <li>Your answers are saved in this browser as you work, so a reload or leaving the page does not lose them. You can have one attempt in progress per paper.</li>
            <li>${hasObj ? "Multiple-choice and other objective parts are marked automatically when you finish. " : ""}Written answers are marked by you, after you finish, against the mark scheme point by point. The mark scheme is not shown until you finish.</li>
          </ul></section>
        <section class="card" aria-labelledby="pp-str"><h2 id="pp-str">Structure</h2>
          <table class="tbl"><caption class="sr-only">Questions in ${p.title}</caption><thead><tr><th scope="col">Question</th><th scope="col">Type</th><th scope="col">Parts</th><th scope="col">Marks</th></tr></thead><tbody>${raw(struct)}</tbody><tfoot><tr><th scope="row">Total</th><td></td><td>${partsOf(p).length}</td><td><strong>${max}</strong></td></tr></tfoot></table></section>
      </div>
      ${raw(officialNote)}
      <section class="card" aria-labelledby="pp-hist"><h2 id="pp-hist">Previous attempts</h2>${raw(runsTable(p))}</section>
    </div>`);
    B.app.render(html, { title: p.title, crumbs: crumbs(p) });
    const begin = (mode) => { putDraft(newDraft(p, mode)); location.hash = `#/papers/${p.id}/run`; };
    const box = $("#pp-replace", html); let opener = null;
    const closeReplace = () => { box.hidden = true; if (opener) opener.focus(); };
    $$("[data-mode]", html).forEach((b) => b.addEventListener("click", () => {
      const mode = b.dataset.mode; const cur = getDraft(p.id);
      if (!cur) return begin(mode);
      // One attempt per paper: confirm in the page before replacing the saved one.
      opener = b; const pr = draftProgress(p, cur);
      $("#pp-replace-txt", html).textContent = `Your saved attempt (${modeLabel(cur)}, started ${fmtDateTime(cur.started)}) has ${pr.done} of ${pr.total} parts answered${cur.stage === "mark" ? " and is waiting to be marked" : cur.mode === "exam" ? `, with ${clock(remainingMs(cur) / 1000)} left` : ""}. You can resume it, or discard it and start ${mode === "exam" ? "Exam Mode" : "Practice Mode"} from the beginning. Discarding deletes its answers and records nothing.`;
      const yes = $("#pp-replace-yes", html); yes.textContent = `Discard it and start ${mode === "exam" ? "Exam Mode" : "Practice Mode"}`;
      yes.onclick = () => { dropDraft(p.id); begin(mode); };
      box.hidden = false; $("#pp-replace-h", html).focus(); box.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
    }));
    $("#pp-replace-no", html).addEventListener("click", closeReplace);
    box.addEventListener("keydown", (e) => { if (e.key === "Escape") closeReplace(); });
    const dis = $("#pp-discard", html);
    if (dis) {
      const dbox = $("#pp-discard-box", html);
      dis.addEventListener("click", () => { dbox.hidden = false; dis.setAttribute("aria-expanded", "true"); $("#pp-discard-no", html).focus(); });
      $("#pp-discard-no", html).addEventListener("click", () => { dbox.hidden = true; dis.setAttribute("aria-expanded", "false"); dis.focus(); });
      $("#pp-discard-yes", html).addEventListener("click", () => { dropDraft(p.id); B.util.toast("Attempt discarded"); B.views.papers(p.id); const s = $("#pp-start"); if (s) s.focus(); });
    }
    // Exam Mode in progress: keep the "time left" figure live; when it reaches zero, close the paper for marking.
    const left = $("#pp-start-left", html);
    if (left && d) { const iv = setInterval(() => { if (!document.body.contains(left)) return clearInterval(iv); const rem = remainingMs(d); left.textContent = clock(rem / 1000); if (rem <= 0) { clearInterval(iv); location.replace(`#/papers/${p.id}/run`); } }, 1000); }
  }

  // ---------- comprehension passage with line numbers ----------
  // Rule: when the passage marks its printed lines with <br> (inside paragraphs), each line is numbered here in
  // sequence (1, then every fifth number shown; every line carries a screen-reader "Line n" prefix). A passage without
  // <br> is shown exactly as the author wrote it, on the assumption that it carries its own line numbers.
  function passageHTML(q) {
    const src = String(q.passage || "");
    if (!/<br\s*\/?>/i.test(src)) return `<div class="pp-passage-own">${src}</div>`;
    const paras = src.split(/<\/p>/i).map((x) => x.replace(/<p[^>]*>/gi, "")).filter((x) => x.trim());
    let n = 0; const out = [];
    for (const para of paras) {
      const lines = para.split(/<br\s*\/?>/i).map((x) => x.trim()).filter(Boolean);
      lines.forEach((ln, i) => { n++; out.push(`<div class="pp-line${i === 0 && n > 1 ? " pp-pstart" : ""}"><span class="pp-ln" aria-hidden="true">${n % 5 === 0 || n === 1 ? n : ""}</span><span class="sr-only">Line ${n}: </span><span class="pp-lt">${ln}</span></div>`); });
    }
    return `<div class="pp-lines">${out.join("")}</div>`;
  }
  const passageBox = (q, id) => h`<aside class="pp-passage" id="${id}" tabindex="0" role="region" aria-label="Passage for question ${q.num}, with numbered lines">${raw(q.passageTitle ? h`<h3 class="pp-ptitle">${q.passageTitle}</h3>` : "")}${raw(passageHTML(q))}${raw(q.passageSource ? h`<p class="tiny muted">${q.passageSource}</p>` : "")}</aside>`;

  // ---------- run ----------
  function runView(p) {
    const d = getDraft(p.id);
    if (!d) { location.replace(`#/papers/${p.id}`); return; }
    if (d.stage === "mark") { location.replace(`#/papers/${p.id}/mark`); return; }
    const exam = d.mode === "exam"; const closedOnArrival = expired(d);
    if (d.entered && !closedOnArrival) d.resumes = (d.resumes || 0) + 1; d.entered = true;
    const parts = partsOf(p); const max = paperMax(p);
    d.cur = Math.min(Math.max(0, d.cur || 0), p.questions.length - 1);

    const partRun = (q, pt) => {
      const lab = pt.label || pt.id; const head = h`<div class="pp-part-head"><h3 id="ph-${pt.id}" tabindex="-1">${lab}</h3><span class="pp-marks">[${plural(+pt.marks, "mark")}]</span></div>`;
      if (isObj(pt)) return h`<div class="pp-part" data-pid="${pt.id}" role="group" aria-labelledby="ph-${pt.id}">${raw(head)}<div class="pp-obj" data-pid="${pt.id}"></div></div>`;
      const rows = Math.min(16, 3 + 2 * (+pt.marks || 1));
      return h`<div class="pp-part" data-pid="${pt.id}" role="group" aria-labelledby="ph-${pt.id}">${raw(head)}<div class="pp-stem" id="ps-${pt.id}">${raw(stemHTML(pt.stem))}</div>
        <label class="pp-alabel" for="pa-${pt.id}">Your answer to ${lab}</label><textarea class="pp-answer" id="pa-${pt.id}" rows="${rows}" aria-describedby="ps-${pt.id}" spellcheck="true">${d.answers[pt.id] || ""}</textarea></div>`;
    };
    const panel = (q, qi) => {
      const partsHTML = (q.parts || []).map((pt) => partRun(q, pt)).join("");
      const body = q.kind === "comprehension" && q.passage ? h`<div class="pp-comp">${raw(passageBox(q, "pp-pass-" + qi))}<div class="pp-comp-parts">${raw(partsHTML)}</div></div>` : partsHTML;
      return h`<section class="pp-q" data-qi="${qi}" aria-labelledby="pq-${qi}" hidden>
        <h2 class="pp-qh" id="pq-${qi}" tabindex="-1">Question ${q.num}${q.title ? ` · ${q.title}` : q.kind === "comprehension" ? " · comprehension" : ""} <span class="badge navy">${plural(qMax(q), "mark")}</span></h2>
        ${q.intro ? raw(`<div class="pp-intro">${q.intro}</div>`) : ""}${raw(body)}</section>`;
    };
    const root = el(h`<div class="pp-run pp-page">
      <div class="pp-bar card">
        <div class="pp-bar-l"><div class="eyebrow">${p.code || ""} practice paper · ${modeLabel(d)}</div><h1 class="pp-title">${p.title}</h1><div class="small muted" id="pp-pos"></div></div>
        <div class="pp-bar-r">
          ${exam ? raw(h`<div class="pp-clock"><span class="tiny muted" id="pp-tl">Time left</span><span class="timer" id="pp-timer" role="timer" aria-labelledby="pp-tl">${clock(remainingMs(d) / 1000)}</span></div>`)
            : raw(h`<div class="pp-clock pp-clock-prac"><span class="tiny muted" id="pp-tl">Untimed · time spent</span><span class="timer pp-elapsed" id="pp-timer" aria-labelledby="pp-tl">${clock(d.elapsed)}</span></div>`)}
          <button class="btn sm" id="pp-ovbtn" aria-expanded="false" aria-controls="pp-ov">Overview</button>
          <button class="btn sm primary" id="pp-finish">Finish</button>
        </div>
        <nav class="pp-nav" aria-label="Questions">${raw(p.questions.map((q, qi) => h`<button class="pp-qbtn" data-qi="${qi}">${q.num}</button>`).join(""))}</nav>
        <p class="pp-status small" id="pp-status" role="status" aria-live="polite"></p>
      </div>
      <section class="card pp-ov" id="pp-ov" hidden aria-labelledby="pp-ovh"><h2 id="pp-ovh" class="pp-h3">Overview</h2><div id="pp-ovbody"></div></section>
      <section class="card pp-confirm" id="pp-confirm" hidden aria-labelledby="pp-ch"><h2 id="pp-ch" class="pp-h3" tabindex="-1">Finish the paper?</h2><div id="pp-cbody"></div>
        <div class="row mt"><button class="btn primary" id="pp-do-finish">Finish and mark my answers</button><button class="btn" id="pp-cancel">Return to the paper</button></div></section>
      <section class="card pp-closed" id="pp-closed" ${closedOnArrival ? "" : "hidden"} aria-labelledby="pp-clh"><h2 id="pp-clh" class="pp-h3" tabindex="-1">Time is up</h2><p class="small">The ${hm(d.limit)} for this Exam Mode attempt ran out while you were away, so the paper is closed for answering. Your saved answers are being submitted for marking.</p></section>
      <div class="pp-stage" id="pp-stage" ${closedOnArrival ? "hidden" : ""}>${raw(p.questions.map(panel).join(""))}</div>
      <div class="row pp-foot"><button class="btn" id="pp-prev">← Previous question</button><button class="btn primary" id="pp-next">Next question →</button><a class="btn ghost" href="#/papers/${p.id}" id="pp-leave">${exam ? "Leave (the clock keeps running)" : "Save and leave"}</a></div>
      <p class="tiny muted">${p.note || NOTE} ${exam ? "Exam Mode: the countdown runs continuously, even when this page is closed. Answers save automatically in this browser." : "Practice Mode: untimed. Answers save automatically in this browser; resume from the paper's page."}</p>
    </div>`);
    B.app.render(root, { title: p.title, crumbs: crumbs(p, "Paper") });

    // Objective parts are rendered by the question engine; its check button and feedback stay hidden until the end.
    const nodes = {}, pending = {};
    for (const { pt } of parts) if (isObj(pt)) {
      const host = $$(".pp-obj", root).find((x) => x.dataset.pid === pt.id);
      const node = B.questions.render(pt, { onAnswer: (res, rec) => { pending[pt.id] = { res, rec }; } });
      node.classList.add("pp-engine"); host.append(node); nodes[pt.id] = node; restoreObj(pt, node, d.answers[pt.id]);
    }
    const panels = $$(".pp-q", root), qbtns = $$(".pp-qbtn", root);
    const timer = $("#pp-timer", root), status = $("#pp-status", root), ov = $("#pp-ov", root), ovbtn = $("#pp-ovbtn", root), conf = $("#pp-confirm", root);
    const prev = $("#pp-prev", root), next = $("#pp-next", root);
    // Save only while this attempt is still the stored one (never bring back a draft replaced or removed elsewhere).
    const keep = () => { if (drafts()[p.id] === d) putDraft(d); };
    let saveT = null; const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => keep(), 400); };
    const pinfo = (pt) => answered(pt, d.answers[pt.id], d.touched[pt.id]);
    const announce = (msg) => { status.textContent = ""; setTimeout(() => (status.textContent = msg), 30); };

    function refreshNav() {
      p.questions.forEach((q, qi) => {
        const ps = q.parts || []; const n = ps.filter(pinfo).length; const b = qbtns[qi];
        b.classList.toggle("done", n === ps.length && n > 0); b.classList.toggle("part", n > 0 && n < ps.length);
        b.setAttribute("aria-label", `Question ${q.num}: ${n} of ${ps.length} part${ps.length === 1 ? "" : "s"} answered`);
        if (qi === d.cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      if (!ov.hidden) renderOverview();
    }
    function renderOverview() {
      const done = parts.filter(({ pt }) => pinfo(pt)).length;
      $("#pp-ovbody", root).innerHTML = h`<p class="small">${done} of ${parts.length} parts answered · ${parts.length - done} unanswered. Select a part to go to it.</p>
        <ul class="pp-ovlist">${raw(p.questions.map((q, qi) => h`<li><span class="pp-ovq">Q${q.num}</span>${raw((q.parts || []).map((pt) => { const a = pinfo(pt); return h`<button class="pp-chip ${a ? "done" : ""}" data-goto="${pt.id}" data-qi="${qi}">${pt.label || pt.id}<span class="sr-only">: ${a ? "answered" : "not answered"}</span><span aria-hidden="true">${a ? " ✓" : ""}</span></button>`; }).join(""))}</li>`).join(""))}</ul>`;
    }
    function show(i, focusEl) {
      d.cur = i; panels.forEach((s, k) => (s.hidden = k !== i));
      $("#pp-pos", root).textContent = `Question ${p.questions[i].num} of ${p.questions.length} · ${max} marks in total`;
      prev.disabled = i === 0; next.textContent = i === p.questions.length - 1 ? "Review and finish →" : "Next question →";
      refreshNav(); saveSoon();
      const target = focusEl || $(".pp-qh", panels[i]);
      target.focus({ preventScroll: true }); target.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
    }
    function capture(partEl) {
      if (!partEl) return; const pid = partEl.dataset.pid; const pt = parts.find((x) => x.pt.id === pid).pt;
      if (isObj(pt)) d.answers[pid] = readObj(pt, nodes[pid]); else d.answers[pid] = $("textarea", partEl).value;
      refreshNav(); saveSoon();
    }
    root.addEventListener("input", (e) => capture(e.target.closest(".pp-part")));
    root.addEventListener("change", (e) => capture(e.target.closest(".pp-part")));
    // Capture phase: the engine redraws a sequence list on click, which detaches the clicked button before bubbling.
    root.addEventListener("click", (e) => {
      const partEl = e.target.closest(".pp-part"); if (!partEl) return;
      if (e.target.closest(".seq-list button[data-d]")) { d.touched[partEl.dataset.pid] = true; setTimeout(() => capture(partEl), 0); }
      else if (e.target.closest(".reset-match")) setTimeout(() => capture(partEl), 0);
    }, true);
    root.addEventListener("click", (e) => {
      const go = e.target.closest("[data-goto]");
      if (go) { const qi = +go.dataset.qi; const pt = parts.find((x) => x.pt.id === go.dataset.goto).pt; show(qi, $(`[id="ph-${pt.id}"]`, root)); }
      const qb = e.target.closest(".pp-qbtn"); if (qb) show(+qb.dataset.qi);
    });
    root.addEventListener("pointerup", (e) => { const partEl = e.target.closest(".pp-part"); if (partEl) setTimeout(() => capture(partEl), 0); }); // drag-and-drop labels set selects without a change event
    prev.addEventListener("click", () => d.cur > 0 && show(d.cur - 1));
    next.addEventListener("click", () => (d.cur < p.questions.length - 1 ? show(d.cur + 1) : openConfirm()));
    ovbtn.addEventListener("click", () => { ov.hidden = !ov.hidden; ovbtn.setAttribute("aria-expanded", String(!ov.hidden)); if (!ov.hidden) { renderOverview(); $("#pp-ovh", root).setAttribute("tabindex", "-1"); $("#pp-ovh", root).focus(); } });

    // clock. Exam Mode: remaining time is always deadline minus now (it runs while the page is closed). Practice Mode:
    // untimed; the time spent is counted only while the page is open and visible, for information.
    let finished = false, last = performance.now(), sinceSave = 0;
    function paint() {
      if (!exam) { timer.textContent = clock(d.elapsed); return; }
      const rem = Math.ceil(remainingMs(d) / 1000); timer.textContent = clock(rem);
      timer.classList.toggle("pp-warn", rem <= 600 && rem > 60); timer.classList.toggle("over", rem <= 60);
      const crossed = EXAM_WARN.filter((m) => d.limit > m * 60 && rem <= m * 60 && !d.warned.includes(m));
      if (crossed.length && !finished && rem > 0) {
        d.warned.push(...crossed); const mins = Math.max(1, Math.ceil(rem / 60));
        announce(`Time check: ${mins <= 1 && rem <= 60 ? "1 minute" : plural(mins, "minute")} remaining.${rem <= 60 ? " The paper will be submitted for marking when the clock reaches zero." : ""}`); saveSoon();
      }
    }
    function tick() {
      if (finished) return;
      if (!document.body.contains(root)) { stop(); return; }
      const now = performance.now(); const dt = (now - last) / 1000; last = now;
      if (exam) {
        paint(); sinceSave += Math.min(dt, 5); if (sinceSave >= 15) { sinceSave = 0; keep(); }
        if (remainingMs(d) <= 0) timeUp();
        return;
      }
      // Practice: ignore time while hidden and long gaps (sleep, a throttled background tab).
      if (document.visibilityState !== "hidden" && dt > 0) { const add = Math.min(dt, 5); d.elapsed += add; sinceSave += add; if (sinceSave >= 5) { sinceSave = 0; keep(); } }
      paint();
    }
    const iv = setInterval(tick, 1000);
    function flush() {
      if (finished) return; const now = performance.now();
      if (!exam && document.visibilityState !== "hidden") d.elapsed += Math.min(5, Math.max(0, (now - last) / 1000));
      last = now; if (exam) nowFor(d); clearTimeout(saveT); keep();
    }
    function stop() { clearInterval(iv); flush(); finished = true; if (active && active.root === root) active = null; }
    active = { root, flush, stop, tick };
    $("#pp-leave", root).addEventListener("click", () => { flush(); B.util.toast(exam ? `Saved. The clock keeps running: ${clock(remainingMs(d) / 1000)} left.` : "Saved. Resume from the paper's page when you are ready."); });

    // finishing
    function openConfirm() {
      const un = parts.filter(({ pt }) => !pinfo(pt));
      const timeNote = exam ? ` with ${clock(remainingMs(d) / 1000)} left` : "";
      $("#pp-cbody", root).innerHTML = h`<p class="small">You have answered ${parts.length - un.length} of ${parts.length} parts${timeNote}. After you finish you cannot change your answers. The mark scheme is shown only after you finish.</p>${un.length ? raw(h`<p class="small"><strong>${plural(un.length, "unanswered part")}</strong> (these score 0 and are added to your mistake bank):</p><ul class="pp-ovlist">${raw(`<li>${un.map(({ pt, qi }) => h`<button class="pp-chip" data-goto="${pt.id}" data-qi="${qi}">${pt.label || pt.id}</button>`).join("")}</li>`)}</ul>`) : raw('<p class="small">Every part has an answer.</p>')}`;
      conf.hidden = false; $("#pp-ch", root).focus(); conf.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
    }
    $("#pp-finish", root).addEventListener("click", openConfirm);
    $("#pp-cancel", root).addEventListener("click", () => { conf.hidden = true; show(d.cur); });
    conf.addEventListener("keydown", (e) => { if (e.key === "Escape") { conf.hidden = true; show(d.cur); } });
    conf.addEventListener("click", (e) => { if (e.target.closest("[data-goto]")) conf.hidden = true; });
    $("#pp-do-finish", root).addEventListener("click", () => doFinish(false));
    function timeUp(away) { d.timeUp = true; if (away) d.closedAway = true; doFinish(true); }
    function markObjective(pt) {
      const v = d.answers[pt.id] != null ? d.answers[pt.id] : null; const node = nodes[pt.id];
      if (!answered(pt, v, d.touched[pt.id]) || !node) return logManual(p, pt, 0, v, "auto", true);
      if (!complete(pt, v)) return logManual(p, pt, partialScore(pt, v), v, "auto", false);
      $(".q-actions .btn.primary", node).click(); // engine marks and logs the attempt
      const got = pending[pt.id];
      if (!got) return logManual(p, pt, 0, v, "auto", false);
      Object.assign(got.rec, tag(p, pt)); B.store.save();
      return { score: got.res.score, max: +pt.marks, attempt: got.rec.id, unanswered: false };
    }
    function doFinish(auto) {
      if (finished) return; flush(); clearInterval(iv); finished = true;
      for (const { pt } of parts) if (isObj(pt) && !d.auto[pt.id]) d.auto[pt.id] = markObjective(pt);
      d.finishedAt = exam ? Math.min(nowFor(d), d.deadline) : Date.now();
      d.stage = "mark"; d.finishedEarly = !auto; keep(); active = null;
      location.hash = `#/papers/${p.id}/mark`;
    }

    // Exam Mode deadline already passed on arrival (deadline in the past after a reload, a later visit or a clock
    // change): no answering; submit the saved answers straight to self-marking.
    if (closedOnArrival) { $("#pp-clh", root).focus(); timeUp(true); return; }
    paint(); show(d.cur);
    if (d.resumes) announce(exam ? `Paper resumed with ${clock(remainingMs(d) / 1000)} left. The clock kept running while you were away.` : "Paper resumed. Practice Mode is untimed.");
  }

  // ---------- shared rendering for marking and review ----------
  const yesNo = (ok) => ok ? '<span class="pp-ok" aria-hidden="true">✓</span><span class="sr-only">(correct)</span>' : '<span class="pp-no" aria-hidden="true">✗</span><span class="sr-only">(incorrect)</span>';
  function objectiveDetail(pt, v) {
    const none = '<em class="muted">no answer</em>';
    switch (pt.type) {
      case "mcq": { const given = typeof v === "number" ? pt.options[v] : null; return h`<dl class="pp-dl"><dt>Your answer</dt><dd>${given != null ? raw(esc(given) + " " + yesNo(v === pt.answer)) : raw(none)}</dd><dt>Correct answer</dt><dd>${pt.options[pt.answer]}</dd></dl>`; }
      case "gap": return h`<table class="tbl pp-otbl"><thead><tr><th scope="col">Gap</th><th scope="col">Your answer</th><th scope="col">Accepted</th></tr></thead><tbody>${raw(gapKeys(pt).map((n) => { const g = (v || {})[n] || ""; const ok = (pt.answers[n] || []).some((a) => B.util.answerMatches(g, a)); return h`<tr><td>${n}</td><td>${g ? raw(esc(g) + " " + yesNo(ok)) : raw(none)}</td><td>${(pt.answers[n] || []).join(" / ")}</td></tr>`; }).join(""))}</tbody></table>`;
      case "match": return h`<table class="tbl pp-otbl"><thead><tr><th scope="col">Item</th><th scope="col">Your match</th><th scope="col">Correct match</th></tr></thead><tbody>${raw(pt.pairs.map((pr, i) => { const g = (v || {})[i]; return h`<tr><td>${pr.left}</td><td>${g ? raw(esc(g) + " " + yesNo(g === pr.right)) : raw(none)}</td><td>${pr.right}</td></tr>`; }).join(""))}</tbody></table>`;
      case "label": return h`<table class="tbl pp-otbl"><thead><tr><th scope="col">Label</th><th scope="col">Your answer</th><th scope="col">Correct</th></tr></thead><tbody>${raw(pt.labels.map((l) => { const g = (v || {})[l.n]; return h`<tr><td>${l.n}</td><td>${g ? raw(esc(g) + " " + yesNo(g === l.answer)) : raw(none)}</td><td>${l.answer}</td></tr>`; }).join(""))}</tbody></table>`;
      case "sequence": return h`<div class="grid grid-2 pp-seq"><div><div class="tiny muted">Your order</div>${Array.isArray(v) ? raw(`<ol class="small">${v.map((i, pos) => `<li>${esc(pt.steps[i])} ${yesNo(i === pos)}</li>`).join("")}</ol>`) : raw(`<p class="small">${none} (the list was not rearranged)</p>`)}</div><div><div class="tiny muted">Correct order</div><ol class="small">${raw(pt.steps.map((s) => `<li>${esc(s)}</li>`).join(""))}</ol></div></div>`;
    }
    return "";
  }
  const yourAnswer = (txt) => String(txt || "").trim() ? h`<div class="pp-yours"><div class="tiny muted">Your answer</div><div class="pp-ans">${txt}</div></div>` : '<div class="pp-yours"><div class="tiny muted">Your answer</div><div class="pp-ans pp-empty">No answer given.</div></div>';
  const extras = (pt) => [pt.alternatives ? h`<p class="small"><strong>Accept:</strong> ${pt.alternatives}</p>` : "", pt.levels ? h`<p class="small"><strong>Level descriptors:</strong> ${typeof pt.levels === "string" ? pt.levels : JSON.stringify(pt.levels)}</p>` : ""].join("");
  const contextBlock = (q, qi, label) => (q.intro || q.passage) ? h`<details class="pp-ctx"><summary>${label}</summary>${q.intro ? raw(`<div class="pp-intro">${q.intro}</div>`) : ""}${q.kind === "comprehension" && q.passage ? raw(passageBox(q, "pp-mpass-" + qi)) : ""}</details>` : "";

  // ---------- self-marking ----------
  function markView(p) {
    const d = getDraft(p.id);
    if (!d) { const r = runsOf(p.id); location.replace(r.length ? `#/papers/${p.id}/report/${r[r.length - 1].ts}` : `#/papers/${p.id}`); return; }
    if (d.stage !== "mark") { location.replace(`#/papers/${p.id}/run`); return; }
    const parts = partsOf(p); const max = paperMax(p);
    const written = parts.filter(({ pt }) => !isObj(pt)); const objective = parts.filter(({ pt }) => isObj(pt));
    const objScore = objective.reduce((n, { pt }) => n + ((d.auto[pt.id] || {}).score || 0), 0);
    const partMark = (q, pt) => {
      const lab = pt.label || pt.id; const head = h`<div class="pp-part-head"><h3 id="mh-${pt.id}">${lab}</h3><span class="pp-marks">[${plural(+pt.marks, "mark")}]</span><span class="badge navy pp-pscore" data-for="${pt.id}"></span></div>`;
      if (isObj(pt)) { const a = d.auto[pt.id] || { score: 0 }; return h`<article class="pp-mpart" aria-labelledby="mh-${pt.id}">${raw(head)}<div class="pp-stem">${raw(stemHTML(pt.stem))}</div><div class="feedback ${a.score === +pt.marks ? "ok" : a.score > 0 ? "neutral" : "bad"} pp-fb"><strong>Marked automatically: ${a.score} / ${pt.marks}</strong>${a.unanswered ? " · no answer given" : ""}</div>${raw(objectiveDetail(pt, d.answers[pt.id]))}${pt.explanation ? raw(`<p class="small"><strong>Explanation.</strong> ${pt.explanation}</p>`) : ""}</article>`; }
      const ans = d.answers[pt.id] || ""; const empty = !String(ans).trim(); const ticks = d.ticks[pt.id] || []; const sch = pt.scheme || []; const schSum = sch.reduce((n, s) => n + (+s.marks || 0), 0);
      return h`<article class="pp-mpart" aria-labelledby="mh-${pt.id}">${raw(head)}<div class="pp-stem">${raw(stemHTML(pt.stem))}</div>${raw(yourAnswer(ans))}
        <fieldset class="markscheme pp-scheme" data-pid="${pt.id}" ${empty ? "disabled" : ""}><legend>Mark scheme for ${lab}: tick each point your answer makes clearly${schSum > +pt.marks ? ` (maximum ${pt.marks} marks)` : ""}</legend>
          ${empty ? raw('<p class="small"><strong>0 marks:</strong> no answer was given. Read the scheme and the model answer so that you can do it next time.</p>') : ""}
          <div class="selfmark">${raw(sch.map((s, i) => h`<label><input type="checkbox" data-i="${i}" ${ticks.includes(i) ? "checked" : ""}> <span>${s.point} <span class="badge">${plural(+s.marks, "mark")}</span></span></label>`).join(""))}</div>
          ${raw(extras(pt))}${pt.commonErrors ? raw(h`<p class="small"><strong>Common errors:</strong> ${pt.commonErrors}</p>`) : ""}
          ${pt.model ? raw(`<details class="mt"><summary>Model answer</summary><p class="small">${pt.model}</p></details>`) : ""}</fieldset></article>`;
    };
    const qs = p.questions.map((q, qi) => h`<section class="card mb pp-mq" aria-labelledby="mq-${qi}"><h2 id="mq-${qi}">Question ${q.num}${q.title ? ` · ${q.title}` : ""} <span class="badge">${plural(qMax(q), "mark")}</span></h2>${raw(contextBlock(q, qi, q.kind === "comprehension" ? "Show the passage and question context" : "Show the question context and figures"))}${raw((q.parts || []).map((pt) => partMark(q, pt)).join(""))}</section>`).join("");
    const html = el(h`<div class="pp-page">
      ${d.timeUp ? raw(d.closedAway ? h`<div class="notice pp-timeup" role="alert"><strong>Time is up.</strong> The ${hm(d.limit)} ran out while you were away (at ${fmtDateTime(d.deadline)}), so the paper was closed and the answers you had saved were submitted for marking.</div>` : '<div class="notice pp-timeup" role="alert"><strong>Time is up.</strong> Your answers were submitted automatically when the clock reached zero.</div>') : ""}
      <div class="page-head"><div><div class="eyebrow">${p.title} · ${modeLabel(d)} · step 2 of 2</div><h1>Mark your answers</h1><p class="lede">${objective.length ? "Objective parts have been marked automatically. " : ""}For each written answer, compare what you wrote with the mark scheme and tick a point only if your answer makes it clearly. Equivalent wording that means the same thing earns the mark; a key word used wrongly does not. Your marks are saved as you tick.</p></div></div>
      <div class="grid ${objective.length ? "grid-3" : "grid-2"} mb">${objective.length ? raw(h`<div class="card"><div class="stat"><span class="v">${objScore} / ${objective.reduce((n, x) => n + +x.pt.marks, 0)}</span><span class="l">objective marks (${plural(objective.length, "part")})</span></div></div>`) : ""}<div class="card"><div class="stat"><span class="v">${written.length}</span><span class="l">written parts to mark</span></div></div><div class="card"><div class="stat"><span class="v">${clock(usedSec(d))}</span><span class="l">${d.mode === "exam" ? `time used of ${hm(d.limit)} (Exam Mode)${d.timeUp ? ", time ran out" : ""}` : "time spent with the paper open (Practice Mode, untimed)"}</span></div></div></div>
      ${raw(qs)}
      <div class="card pp-total"><p class="pp-tot" id="pp-tot" aria-live="polite"></p><p class="small muted">When you confirm, your marks are saved, parts below full marks go to your mistake bank and revisits are scheduled for weak statements.</p><button class="btn primary" id="pp-confirm-marks">Confirm my marks and see the report</button></div>
    </div>`);
    B.app.render(html, { title: `${p.title} · marking`, crumbs: crumbs(p, "Marking") });
    const current = () => { const sc = {}; for (const { pt } of parts) sc[pt.id] = isObj(pt) ? (d.auto[pt.id] || {}).score || 0 : String(d.answers[pt.id] || "").trim() ? schemeScore(pt, d.ticks[pt.id]) : 0; return sc; };
    const paintTotals = () => { const sc = current(); $$(".pp-pscore", html).forEach((b) => { const pt = parts.find((x) => x.pt.id === b.dataset.for).pt; b.textContent = `${sc[pt.id]} / ${pt.marks}`; }); const t = Object.values(sc).reduce((a, b) => a + b, 0); $("#pp-tot", html).innerHTML = h`<strong>Total so far: ${t} / ${max}</strong> (${pctOf(t, max)}%)`; };
    html.addEventListener("change", (e) => { const fs = e.target.closest(".pp-scheme"); if (!fs) return; d.ticks[fs.dataset.pid] = $$("input[type=checkbox]", fs).filter((c) => c.checked).map((c) => +c.dataset.i); putDraft(d); paintTotals(); });
    paintTotals();
    $("#pp-confirm-marks", html).addEventListener("click", (e) => { e.target.disabled = true; confirmMarks(p, d); });
    $("h1", html).setAttribute("tabindex", "-1"); $("h1", html).focus({ preventScroll: true });
  }

  function confirmMarks(p, d) {
    const scores = {}, attempts = {};
    for (const { pt } of partsOf(p)) {
      let a;
      if (isObj(pt)) a = d.auto[pt.id] || logManual(p, pt, 0, d.answers[pt.id] != null ? d.answers[pt.id] : null, "auto", true);
      else { const ans = String(d.answers[pt.id] || ""); const empty = !ans.trim(); a = logManual(p, pt, empty ? 0 : schemeScore(pt, d.ticks[pt.id]), ans, "self", empty); }
      scores[pt.id] = a.score; attempts[pt.id] = a.attempt;
    }
    const g = aggregate(p, scores);
    const run = B.store.logPaper(p.id, { title: p.title, mode: d.mode, limit: d.mode === "exam" ? d.limit : null, deadline: d.mode === "exam" ? d.deadline : null, closedAway: !!d.closedAway, seconds: Math.round(usedSec(d)), minutes: p.minutes || 90, score: g.score, max: g.max, pct: g.pct, byQ: g.byQ, byRef: g.byRef, byStmt: g.byStmt, byAO: g.byAO,
      answers: d.answers, touched: d.touched, ticks: d.ticks, attempts, started: d.started, finishedAt: d.finishedAt, pauses: [], pausedSeconds: 0, resumes: d.resumes || 0, timeUp: !!d.timeUp });
    const when = fmtDate(run.ts); const rv = [];
    for (const [st, b] of Object.entries(g.byStmt)) {
      const pc = pctOf(b.score, b.max); const days = revisitDays(pc); if (!days) continue;
      const r = B.store.addRevisit({ ref: stmtRef(st), stmt: st, reason: `${p.title} (${when}): ${b.score}/${b.max} marks (${pc}%)`, due: run.ts + days * DAY, source: "paper:" + p.id });
      if (!rv.includes(r.id)) rv.push(r.id);
    }
    run.revisits = rv; B.store.save(); dropDraft(p.id);
    location.hash = `#/papers/${p.id}/report/${run.ts}`;
  }

  // ---------- report ----------
  const findRun = (p, ts) => runsOf(p.id).find((r) => String(r.ts) === String(ts));
  const bar = (pc) => h`<div class="progress pp-bar-m" aria-hidden="true"><span style="width:${pc}%;background:${pc < 50 ? "var(--rose)" : pc < 80 ? "var(--teal)" : "var(--sage)"}"></span></div>`;
  const grade = (pc) => pc >= 80 ? ["Secure on this paper", "sage"] : pc >= 65 ? ["Good, with points to tighten", "teal"] : pc >= 50 ? ["Developing", "amber"] : ["Needs work", "rose"];
  function weakStmts(run) { return Object.entries(run.byStmt || {}).map(([id, b]) => ({ id, ref: stmtRef(id), ...b, pct: pctOf(b.score, b.max) })).filter((x) => x.pct < WEAK_BELOW).sort((a, b) => a.pct - b.pct || idCmp(a.id, b.id)); }
  // Ids such as "3.1.10.2.s1" compared part by part as numbers (3.1.3 before 3.1.10).
  function idCmp(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); }
  function byNumFrom(p, run) { return p.questions.map((q) => { return { q, score: (q.parts || []).reduce((n, pt) => n + (((run.byQ || {})[pt.id] || {}).score || 0), 0), max: qMax(q) }; }); }
  function byTopicFrom(run) { const t = {}; for (const [ref, b] of Object.entries(run.byRef || {})) { const k = topicRefOf(ref); const x = t[k] || (t[k] = { score: 0, max: 0, refs: [] }); x.score += b.score; x.max += b.max; x.refs.push(ref); } return Object.entries(t).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })); }
  const notFoundRun = (p) => B.app.render(h`<div class="page-head"><div><h1>Attempt not found</h1><p class="lede">This attempt at ${p.title} is not saved in this browser.</p></div></div><div class="card"><a class="btn" href="#/papers/${p.id}">Back to the paper</a></div>`, { title: p.title, crumbs: crumbs(p, "Attempt") });

  function runTimeLong(run, p) {
    if (run.mode === "exam") return esc(`time used of ${hm(run.limit || (run.minutes || 90) * 60)} · ${run.timeUp ? (run.closedAway ? "time ran out while you were away (submitted automatically)" : "time ran out (submitted automatically)") : `finished with ${clock((run.limit || (run.minutes || 90) * 60) - run.seconds)} to spare`}`);
    if (run.mode === "practice") return esc("time spent with the paper open · untimed, so not a timed result");
    return esc(`time used with the paper open, of ${clock((run.minutes || p.minutes || 90) * 60)} · ${run.timeUp ? "time ran out (submitted automatically)" : "finished within the time"}${run.resumes ? ` · not a continuous timed run: the clock was stopped while the paper was closed (left and resumed ${plural(run.resumes, "time")})` : ""}`);
  }
  function reportView(p, ts) {
    const run = findRun(p, ts); if (!run) return notFoundRun(p);
    const pc = pctOf(run.score, run.max); const [gl, gc] = grade(pc); const weak = weakStmts(run);
    const qrows = byNumFrom(p, run).map((x) => { const c = pctOf(x.score, x.max); return h`<tr><th scope="row"><a href="#/papers/${p.id}/review/${run.ts}#rq-${x.q.num}">Question ${x.q.num}</a>${x.q.kind === "comprehension" ? " (comprehension)" : ""}</th><td>${x.score} / ${x.max}</td><td>${c}%</td><td class="pp-barcol">${raw(bar(c))}</td></tr>`; }).join("");
    const trows = byTopicFrom(run).map(([t, b]) => { const c = pctOf(b.score, b.max); return h`<tr><th scope="row"><a href="#/library/${p.unit}/${t}">${t} ${topicTitle(t)}</a><div class="tiny muted">${b.refs.sort(idCmp).join(", ")}</div></th><td>${b.score} / ${b.max}</td><td>${c}%</td><td class="pp-barcol">${raw(bar(c))}</td></tr>`; }).join("");
    const aos = Object.keys(run.byAO || {}).sort();
    const arows = aos.map((a) => { const b = run.byAO[a]; const c = pctOf(b.score, b.max); return h`<tr><th scope="row">${a}<div class="tiny muted">${aoText(a)}</div></th><td>${b.score} / ${b.max}${p.aoTargets && p.aoTargets[a] != null ? raw(h`<div class="tiny muted">BL01 guide: about ${p.aoTargets[a]}</div>`) : ""}</td><td>${c}%</td><td class="pp-barcol">${raw(bar(c))}</td></tr>`; }).join("");
    const pauses = (run.pauses || []).length;
    const html = el(h`<div class="pp-page">
      <div class="page-head"><div><div class="eyebrow">${p.title} · ${fmtDateTime(run.ts)} · ${modeLabel(run)}</div><h1>Your results</h1><p class="lede">${gl}. Written answers were self-marked, so this is a guide to your standard rather than a grade.</p></div>
        <div class="row"><a class="btn primary" href="#/papers/${p.id}/review/${run.ts}">Open Exam Review</a><a class="btn" href="#/papers/${p.id}">Try the paper again</a></div></div>
      <div class="progress test-bar mb" aria-hidden="true"><span style="width:${pc}%"></span></div>
      <div class="grid grid-3 mb">
        <div class="card"><div class="stat"><span class="v">${run.score} / ${run.max}</span><span class="l">marks · <span class="badge ${gc}">${pc}%</span></span></div></div>
        <div class="card"><div class="stat"><span class="v">${clock(run.seconds)}</span><span class="l">${raw(runTimeLong(run, p))}</span></div></div>
        <div class="card pp-modecard"><div class="stat"><span class="v pp-mode-v">${modeShort(run)}</span><span class="l">${modeLabel(run)}${run.mode ? "" : pauses ? ` · ${plural(pauses, "pause")} (${dur(run.pausedSeconds)} in total)` : ""}${run.resumes ? ` · left and ${run.mode === "practice" ? "resumed" : "returned"} ${plural(run.resumes, "time")}` : ""}</span></div></div>
      </div>
      <div class="grid grid-2 mb">
        <section class="card" aria-labelledby="rp-q"><h2 id="rp-q" class="pp-h3">Marks by question</h2><table class="tbl"><caption class="sr-only">Marks by question</caption><thead><tr><th scope="col">Question</th><th scope="col">Marks</th><th scope="col">%</th><th scope="col" class="pp-barcol"><span class="sr-only">Bar</span></th></tr></thead><tbody>${raw(qrows)}</tbody></table></section>
        <section class="card" aria-labelledby="rp-ao"><h2 id="rp-ao" class="pp-h3">Marks by assessment objective</h2><table class="tbl"><caption class="sr-only">Marks by assessment objective</caption><thead><tr><th scope="col">AO</th><th scope="col">Marks</th><th scope="col">%</th><th scope="col" class="pp-barcol"><span class="sr-only">Bar</span></th></tr></thead><tbody>${raw(arows)}</tbody></table><p class="tiny muted">A part tagged with two AOs counts half its marks towards each.</p></section>
      </div>
      <section class="card mb" aria-labelledby="rp-t"><h2 id="rp-t" class="pp-h3">Marks by topic</h2><table class="tbl"><caption class="sr-only">Marks by topic</caption><thead><tr><th scope="col">Topic (subsections tested)</th><th scope="col">Marks</th><th scope="col">%</th><th scope="col" class="pp-barcol"><span class="sr-only">Bar</span></th></tr></thead><tbody>${raw(trows)}</tbody></table></section>
      <section class="card mb" aria-labelledby="rp-w"><h2 id="rp-w" class="pp-h3">Weak specification statements</h2>${weak.length ? raw(h`<p class="small">${plural(weak.length, "statement")} scored below ${WEAK_BELOW}% on this paper. Exam Review explains each one and links to the notes.</p><ul class="small">${raw(weak.slice(0, 6).map((w) => h`<li><a href="#/topic/${w.ref}">${w.id}</a>: ${w.score} / ${w.max}</li>`).join(""))}</ul>${weak.length > 6 ? raw(h`<p class="small muted">and ${weak.length - 6} more in Exam Review.</p>`) : ""}`) : raw(`<p class="small">No statement fell below ${WEAK_BELOW}%. Use Exam Review to check the marks you dropped.</p>`)}<a class="btn primary" href="#/papers/${p.id}/review/${run.ts}">Open Exam Review</a></section>
      <div class="row"><a class="btn" href="#/papers">All practice papers</a><a class="btn ghost" href="#/progress">Personal Progress and mistake bank</a></div>
    </div>`);
    B.app.render(html, { title: `${p.title} · results`, crumbs: crumbs(p, "Results") });
  }

  // ---------- Exam Review Mode ----------
  function reviewView(p, ts, anchor) {
    const run = findRun(p, ts); if (!run) return notFoundRun(p);
    const st = B.store.get(); const weak = weakStmts(run); const pc = pctOf(run.score, run.max);
    // recommended pages: weak statements' subsections, then any subsection below 50 %, ordered by score
    const refPct = Object.entries(run.byRef || {}).map(([ref, b]) => ({ ref, pct: pctOf(b.score, b.max), score: b.score, max: b.max }));
    const recRefs = [...new Set([...weak.map((w) => w.ref), ...refPct.filter((r) => r.pct < WEAK_BELOW).map((r) => r.ref)])].map((ref) => refPct.find((r) => r.ref === ref) || { ref, pct: 0 }).sort((a, b) => a.pct - b.pct);
    const recHTML = recRefs.map((r) => { const t = topicRefOf(r.ref); const cons = B.consolidation && B.consolidation[t]; return h`<li><strong><a href="#/topic/${r.ref}">${r.ref} ${subTitle(r.ref)}</a></strong>${r.max ? ` (${r.score} / ${r.max} on this paper)` : ""}: <a href="#/topic/${r.ref}">notes and practice questions</a> · <a href="#/flashcards/${r.ref}">flashcards</a>${cons ? raw(h` · <a href="#/consolidate/${t}">${t} topic consolidation</a>`) : ""}</li>`; }).join("");
    const aoWeak = Object.entries(run.byAO || {}).filter(([, b]) => pctOf(b.score, b.max) < WEAK_BELOW).map(([a]) => a);
    const aoTips = [aoWeak.includes("AO4") ? '<li>Practical skills (AO4) were weak: work through the <a href="#/lab">Virtual Practical Laboratory</a> for the required practicals.</li>' : "", aoWeak.includes("AO3") ? '<li>Data analysis and evaluation (AO3) were weak: practise in the <a href="#/maths">Maths and Data Skills Hub</a>.</li>' : ""].join("");
    // mistake bank confirmation
    const dropped = partsOf(p).filter(({ pt }) => run.byQ && run.byQ[pt.id] && run.byQ[pt.id].score < run.byQ[pt.id].max);
    const inBank = dropped.filter(({ pt }) => run.attempts && st.mistakes[run.attempts[pt.id]]);
    const unans = dropped.filter(({ pt }) => { const a = st.attempts.find((x) => x.id === (run.attempts || {})[pt.id]); return a && a.unanswered; });
    const mbList = inBank.map(({ pt }) => { const m = st.mistakes[run.attempts[pt.id]]; return h`<li><a href="#rp-${pt.id}">${pt.label || pt.id}</a> · ${run.byQ[pt.id].score} / ${run.byQ[pt.id].max}${unans.some((u) => u.pt.id === pt.id) ? " · unanswered" : ""}${m.resolved ? " · resolved" : ""}</li>`; }).join("");
    // revisits
    const revs = (run.revisits || []).map((id) => (st.revisits || []).find((r) => r.id === id)).filter(Boolean).sort((a, b) => a.due - b.due);
    const now = Date.now();
    const revRows = revs.map((r) => h`<tr><th scope="row"><a href="#/topic/${r.ref}">${r.stmt || r.ref}</a><div class="tiny muted">${stmtText(r.stmt) || subTitle(r.ref)}</div></th><td>${fmtDate(r.due)}</td><td>${r.done ? "done " + fmtDate(r.done) : r.due <= now ? "due now" : "scheduled"}</td></tr>`).join("");
    const weakHTML = weak.map((w) => h`<li class="pp-weak"><div><a href="#/topic/${w.ref}"><strong>${w.id}</strong></a> <span class="badge rose">${w.score} / ${w.max} · ${w.pct}%</span></div><div class="small">${stmtText(w.id) || "(statement text not found in the specification database)"}</div><div class="tiny muted">${w.ref} ${subTitle(w.ref)} · <a href="#/topic/${w.ref}">open the notes</a></div></li>`).join("");
    // per question
    const partReview = (pt) => {
      const b = (run.byQ || {})[pt.id] || { score: 0, max: pt.marks }; const v = (run.answers || {})[pt.id]; const c = b.score === b.max ? "sage" : b.score > 0 ? "amber" : "rose";
      const head = h`<div class="pp-part-head"><h4 id="rp-${pt.id}" tabindex="-1">${pt.label || pt.id}</h4><span class="pp-marks">[${plural(+pt.marks, "mark")}]</span><span class="badge ${c}">${b.score} / ${b.max}${isObj(pt) ? " · auto-marked" : " · self-marked"}</span><span class="badge mono">${pt.ref}</span>${raw((pt.ao || []).map((a) => h`<span class="badge">${a}</span>`).join(""))}</div>`;
      if (isObj(pt)) return h`<article class="pp-mpart">${raw(head)}<div class="pp-stem">${raw(stemHTML(pt.stem))}</div>${raw(objectiveDetail(pt, v))}${pt.explanation ? raw(`<p class="small"><strong>Explanation.</strong> ${pt.explanation}</p>`) : ""}</article>`;
      const ticks = (run.ticks || {})[pt.id] || []; const empty = !String(v || "").trim();
      return h`<article class="pp-mpart">${raw(head)}<div class="pp-stem">${raw(stemHTML(pt.stem))}</div>${raw(yourAnswer(v))}
        <div class="markscheme"><strong>Mark scheme</strong>${empty ? " (no answer given: 0 marks)" : ""}<ul class="pp-schl">${raw((pt.scheme || []).map((s, i) => { const got = !empty && ticks.includes(i); return h`<li class="${got ? "got" : ""}">${raw(got ? '<span class="pp-ok" aria-hidden="true">✓</span><span class="sr-only">Awarded: </span>' : '<span class="pp-miss" aria-hidden="true">○</span><span class="sr-only">Not awarded: </span>')}${s.point} <span class="badge">${s.marks}</span></li>`; }).join(""))}</ul>
        ${raw(extras(pt))}${pt.model ? raw(`<p class="small"><strong>Model answer.</strong> ${pt.model}</p>`) : ""}${pt.commonErrors ? raw(h`<p class="small"><strong>Common errors:</strong> ${pt.commonErrors}</p>`) : ""}</div></article>`;
    };
    const qHTML = byNumFrom(p, run).map((x, qi) => h`<section class="card mb pp-mq" aria-labelledby="rq-${x.q.num}"><h3 id="rq-${x.q.num}" tabindex="-1">Question ${x.q.num}${x.q.title ? ` · ${x.q.title}` : ""} <span class="badge ${pctOf(x.score, x.max) < 50 ? "rose" : "navy"}">${x.score} / ${x.max}</span></h3>${raw(contextBlock(x.q, qi, x.q.kind === "comprehension" ? "Show the passage and question context" : "Show the question context and figures"))}${raw((x.q.parts || []).map(partReview).join(""))}</section>`).join("");
    const html = el(h`<div class="pp-page">
      <div class="page-head"><div><div class="eyebrow">Exam Review · ${p.title} · ${fmtDateTime(run.ts)}</div><h1>Exam Review</h1><p class="lede">${run.score} / ${run.max} (${pc}%). <span class="pp-mode-line">${modeLabel(run)}: ${run.mode === "exam" ? `${clock(run.seconds)} used${run.timeUp ? ", time ran out" : ""}` : run.mode === "practice" ? `${clock(run.seconds)} spent, untimed` : `${clock(run.seconds)} (time with the paper open)`}.</span> Work through the weak statements first, then read each answer against the scheme and the model answer.</p></div>
        <div class="row"><a class="btn" href="#/papers/${p.id}/report/${run.ts}">Score report</a><a class="btn ghost" href="#/papers">All papers</a></div></div>
      <nav class="card mb pp-toc" aria-label="On this page"><a href="#rv-weak">Weak statements</a><a href="#rv-rec">Revision pages</a><a href="#rv-mb">Mistake bank</a><a href="#rv-rev">Scheduled revisits</a><a href="#rv-qs">Question by question</a></nav>
      <section class="card mb" id="rv-weak" aria-labelledby="rv-weak-h"><h2 id="rv-weak-h" class="pp-h3">Weak specification statements</h2>
        <p class="small muted">Statements whose tagged parts scored below ${WEAK_BELOW}% on this paper (a part counts towards every statement it is tagged with).</p>
        ${weak.length ? raw(`<ul class="plain pp-weaklist">${weakHTML}</ul>`) : raw(`<p class="small">None: every statement tested scored at least ${WEAK_BELOW}%.</p>`)}</section>
      <section class="card mb" id="rv-rec" aria-labelledby="rv-rec-h"><h2 id="rv-rec-h" class="pp-h3">Recommended revision pages</h2>
        ${recHTML || aoTips ? raw(`<ul class="small">${recHTML}${aoTips}</ul>`) : raw('<p class="small">Nothing urgent. Keep reviewing with flashcards and try the other paper.</p>')}</section>
      <section class="card mb" id="rv-mb" aria-labelledby="rv-mb-h"><h2 id="rv-mb-h" class="pp-h3">Mistake bank</h2>
        <p class="small" role="note">${inBank.length ? `${plural(inBank.length, "part")} where you dropped marks ${inBank.length === 1 ? "was" : "were"} added to your mistake bank${unans.length ? `, including ${unans.length} unanswered (recorded as 0 marks)` : ""}.` : dropped.length ? "Parts below full marks are recorded in your attempt history." : "You scored full marks on every part, so nothing was added to your mistake bank."} Categorise them on <a href="#/progress">Personal Progress</a>.</p>
        ${mbList ? raw(`<ul class="small pp-cols">${mbList}</ul>`) : ""}</section>
      <section class="card mb" id="rv-rev" aria-labelledby="rv-rev-h"><h2 id="rv-rev-h" class="pp-h3">Scheduled revisits</h2>
        <p class="small muted">Rule: a statement below 50% on this paper is due for revisiting in 1 day; 50 to 79% in 3 days; 80% or more needs no revisit. A statement that already had an open revisit keeps the earlier date.</p>
        ${revRows ? raw(h`<table class="tbl"><caption class="sr-only">Revisits scheduled from this attempt</caption><thead><tr><th scope="col">Statement</th><th scope="col">Due</th><th scope="col">Status</th></tr></thead><tbody>${raw(revRows)}</tbody></table>`) : raw('<p class="small">No revisits were needed.</p>')}</section>
      <h2 id="rv-qs" class="mt">Question by question</h2>
      ${raw(qHTML)}
      <div class="row"><a class="btn primary" href="#/papers/${p.id}">Try the paper again</a><a class="btn" href="#/papers">All practice papers</a></div>
    </div>`);
    B.app.render(html, { title: `${p.title} · review`, crumbs: crumbs(p, "Exam Review") });
    // In-page anchors: the hash router owns location.hash, so move focus instead of navigating.
    html.addEventListener("click", (e) => { const a = e.target.closest('a[href^="#r"]'); if (!a) return; const t = document.getElementById(a.getAttribute("href").slice(1)); if (!t) return; e.preventDefault(); if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); t.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); });
    const target = anchor && document.getElementById(anchor); if (target) { if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); target.scrollIntoView({ block: "start" }); }
  }
})(window.BIO);
