// Local persistence. Everything lives in localStorage under one key, as a versioned JSON document.
// No accounts, no sync, no analytics. Export/import produce a validated JSON file.
window.BIO = window.BIO || {};
(function (B) {
  const KEY = "bio9610.v1";
  const SCHEMA = 1;

  const blank = () => ({
    schema: SCHEMA,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    prefs: { level: "AS", name: "", reducedMotion: false },
    // Coverage: subsection ref -> { visited: ts, completed: ts|null }
    coverage: {},
    // Checklist: statement id -> true (student self-ticks "I can do this")
    checklist: {},
    // Attempts: append-only log of question attempts (never overwritten)
    attempts: [],
    // Flashcards: card id -> { ease, interval, due, reps, lapses, history: [{ts, grade}] }
    cards: {},
    // Mistake bank: attemptId -> { category, resolved }
    mistakes: {},
    // Activity log by day: "YYYY-MM-DD" -> minutes/actions count
    activity: {},
    // Planner
    planner: { level: "AS", examDates: {}, hoursPerWeek: 6, targets: [], sessions: [] },
    // Practical lab runs: practical n -> [{ts, settings, results}]
    labRuns: {},
    // Consolidation assessment runs: topic ref -> [{ts, score, max, pct, byRef, seconds}]
    consolidation: {},
    // Practice paper runs (Batch 9): paper id -> [{ts, seconds, score, max, byQ: {partId: {score, max}}, byRef, byStmt, answers}]
    papers: {},
    // Scheduled revisits (Batch 9): [{id, ref, stmt?, reason, due: ts, done: ts|null, source}]
    revisits: [],
    // In-progress practice-paper drafts (Batch 9, js/views/papers.js): paper id -> {answers, elapsed, ...}
    paperDrafts: {},
  });

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const parsed = JSON.parse(raw); if (validate(parsed).ok) { state = migrate(parsed); return state; } }
    } catch (e) { console.warn("Store load failed, starting fresh", e); }
    state = blank(); save(); return state;
  }
  function migrate(s) { if (!s.schema) s.schema = SCHEMA; return Object.assign(blank(), s); }
  function save() { state.updatedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.error("Store save failed", e); B.util && B.util.toast("Could not save progress (storage full or blocked)."); } }
  function get() { return state || load(); }

  function validate(obj) {
    const errors = [];
    if (!obj || typeof obj !== "object") errors.push("Not an object");
    else {
      if (typeof obj.schema !== "number") errors.push("Missing schema version");
      for (const k of ["coverage", "checklist", "cards", "mistakes", "activity"]) if (obj[k] && typeof obj[k] !== "object") errors.push(`${k} must be an object`);
      if (obj.attempts && !Array.isArray(obj.attempts)) errors.push("attempts must be an array");
      if (obj.papers && (typeof obj.papers !== "object" || Array.isArray(obj.papers))) errors.push("papers must be an object");
      if (obj.revisits && !Array.isArray(obj.revisits)) errors.push("revisits must be an array");
      if (obj.paperDrafts && (typeof obj.paperDrafts !== "object" || Array.isArray(obj.paperDrafts))) errors.push("paperDrafts must be an object");
      if (Array.isArray(obj.attempts)) obj.attempts.forEach((a, i) => { if (!a.qid || typeof a.ts !== "number") errors.push(`attempt ${i} malformed`); });
    }
    return { ok: errors.length === 0, errors };
  }

  function exportJSON() {
    const s = get();
    const doc = { app: "Biology Revision (OxfordAQA 9610)", exportedAt: new Date().toISOString(), data: s };
    const blob = new Blob([JSON.stringify(doc, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `biology-revision-progress-${B.util.dayKey()}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function importJSON(file) {
    const text = await file.text();
    let parsed; try { parsed = JSON.parse(text); } catch { return { ok: false, errors: ["File is not valid JSON"] }; }
    const data = parsed && parsed.data ? parsed.data : parsed;
    const v = validate(data);
    if (!v.ok) return v;
    state = migrate(data); save(); return { ok: true, errors: [] };
  }
  function reset() { state = blank(); save(); }

  // ---- Convenience mutators ----
  function touchActivity(kind) {
    const s = get(); const k = B.util.dayKey(); s.activity[k] = s.activity[k] || { actions: 0, kinds: {} };
    s.activity[k].actions++; s.activity[k].kinds[kind] = (s.activity[k].kinds[kind] || 0) + 1; save();
  }
  function visit(ref) { const s = get(); const c = s.coverage[ref] || (s.coverage[ref] = { visited: null, completed: null }); c.visited = Date.now(); save(); }
  function complete(ref, flag = true) { const s = get(); const c = s.coverage[ref] || (s.coverage[ref] = { visited: Date.now(), completed: null }); c.completed = flag ? Date.now() : null; save(); touchActivity("complete"); }
  function tick(stmtId, on) { const s = get(); if (on) s.checklist[stmtId] = Date.now(); else delete s.checklist[stmtId]; save(); }
  function logAttempt(a) {
    const s = get();
    const prior = s.attempts.filter((x) => x.qid === a.qid).length;
    const rec = Object.assign({ id: B.util.uid(), ts: Date.now(), attempt: prior + 1 }, a);
    s.attempts.push(rec); save(); touchActivity("question");
    if (rec.score < rec.max && rec.mode !== "self") { s.mistakes[rec.id] = s.mistakes[rec.id] || { category: null, resolved: false, qid: rec.qid, ref: rec.ref }; save(); }
    if (rec.mode === "self" && rec.score < rec.max) { s.mistakes[rec.id] = s.mistakes[rec.id] || { category: null, resolved: false, qid: rec.qid, ref: rec.ref }; save(); }
    // A later full-marks answer to the same question closes its open mistakes (2026-11-08), so the bank only lists
    // questions still to fix. The student can still reopen or categorise them on the Progress page.
    if (rec.score >= rec.max && rec.max > 0) { let ch = false; for (const m of Object.values(s.mistakes)) if (m.qid === rec.qid && !m.resolved) { m.resolved = true; m.resolvedBy = "correct answer"; m.resolvedAt = rec.ts; ch = true; } if (ch) save(); }
    return rec;
  }
  function logConsolidation(tref, rec) { const s = get(); s.consolidation = s.consolidation || {}; (s.consolidation[tref] = s.consolidation[tref] || []).push(rec); save(); touchActivity("assessment"); return rec; }
  function setMistake(id, patch) { const s = get(); if (s.mistakes[id]) { Object.assign(s.mistakes[id], patch); save(); } }

  // ---- Batch 9: practice-paper runs and scheduled revisits (additive; older saved states gain empty fields on load) ----
  function logPaper(pid, rec) { const s = get(); s.papers = s.papers || {}; (s.papers[pid] = s.papers[pid] || []).push(Object.assign({ ts: Date.now() }, rec)); save(); touchActivity("assessment"); return s.papers[pid][s.papers[pid].length - 1]; }
  // A revisit is keyed by ref + stmt: re-adding an open revisit keeps the earlier due date and appends the reason.
  function addRevisit(r) { const s = get(); s.revisits = s.revisits || []; const key = (x) => x.ref + "|" + (x.stmt || ""); const open = s.revisits.find((x) => !x.done && key(x) === key(r));
    if (open) { open.due = Math.min(open.due, r.due); if (r.reason && !String(open.reason).includes(r.reason)) open.reason += "; " + r.reason; save(); return open; }
    const rec = Object.assign({ id: B.util.uid(), done: null, source: "" }, r); s.revisits.push(rec); save(); return rec; }
  function dueRevisits(now = Date.now()) { return (get().revisits || []).filter((x) => !x.done && x.due <= now).sort((a, b) => a.due - b.due); }
  function openRevisits() { return (get().revisits || []).filter((x) => !x.done).sort((a, b) => a.due - b.due); }
  function completeRevisit(id) { const r = (get().revisits || []).find((x) => x.id === id); if (r) { r.done = Date.now(); save(); } return r; }
  B.store = { KEY, SCHEMA, load, get, save, validate, exportJSON, importJSON, reset, touchActivity, visit, complete, tick, logAttempt, setMistake, logConsolidation, logPaper, addRevisit, dueRevisits, openRevisits, completeRevisit };
})(window.BIO);
