// Spaced repetition: a transparent SM-2 variant, plus focused sessions (flashcard redesign 2026-11-09).
//
// Grades stored in history (old saves keep their entries exactly as written):
//   unknown (button "Again"), unsure ("Hard"), known ("Good"), easy ("Easy", added 2026-11-09).
//  - unknown: reps reset to 0, interval 1 day, lapses +1, ease -= 0.2 (min 1.3)
//  - unsure:  interval = max(1, round(interval * 1.2)), ease -= 0.05 (min 1.3), reps +1
//  - known:   reps 1 -> 1 day, reps 2 -> 3 days, reps n -> round(prev interval * ease); ease += 0.1 (max 3.0)
//  - easy:    reps +1; first review -> 4 days; otherwise max(Good interval + 1, round(max(Good interval, prev interval * ease) * 1.3));
//             ease += 0.15 (max 3.0). Easy is always at least one day longer than Good would have been.
// due = review timestamp + interval days. Every review is appended to history. "known" and "easy" both count as remembered.
//
// DUE means a card that has been reviewed before and whose due date has passed. A card never reviewed is NEW: it is never
// counted as due, so adding content never creates a backlog, and reviewed cards keep their own due dates.
//
// Sessions: plan() picks up to `size` cards in this order (no side effects):
//   1. due cards the student found difficult (lapses > 0 or last grade Again/Hard), most overdue (by whole days) first
//   2. other due cards, most overdue first
//   3. cards in weak subsections (mastery below 70% from B.progress) that are at least halfway through their interval and
//      were not reviewed in the last 12 hours (early reinforcement; the normal schedule then continues from that review)
//   4. new cards, only when includeNew is chosen (weak subsections first)
// Within a tier, cards reviewed in the previous session go last, then a stable tie-break that rotates after each session,
// so back-to-back sessions do not keep showing the same cards.
// A card rated Again is shown once more later in the same session (a relearning step, never more than once per card). The
// relearning step is logged in history with relearn: true and does not change ease, interval, lapses or the due date.
window.BIO = window.BIO || {};
(function (B) {
  const DAY = 864e5, HOUR = 36e5;
  const GRADES = ["unknown", "unsure", "known", "easy"];
  const RATINGS = { again: "unknown", hard: "unsure", good: "known", easy: "easy" };
  const RATING_OF = { unknown: "again", unsure: "hard", known: "good", easy: "easy" };
  const LABEL = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };
  const SIZES = { quick: 5, standard: 15, deep: 25 };
  const GOALS = [5, 10, 15, 25];
  const WEAK_BELOW = 70;
  const LOG_MAX = 40;
  const remembered = (g) => g === "known" || g === "easy";

  const store = () => B.store.get();
  function card(id, ref) { const s = store(); return s.cards[id] || (s.cards[id] = { ref, ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0, history: [] }); }
  const hist = (c) => (c && Array.isArray(c.history) ? c.history : []);
  // A record counts as reviewed when it has any review data; records created but never graded stay "new".
  const isReviewed = (c) => !!c && (hist(c).length > 0 || c.reps > 0 || c.lapses > 0 || c.due > 0);
  function lastGrade(c) { const h = hist(c); for (let i = h.length - 1; i >= 0; i--) if (!h[i].relearn) return h[i].grade; return null; }
  function lastReviewTs(c) { const h = hist(c); return h.length ? h[h.length - 1].ts : 0; }
  const isDifficult = (c) => !!c && (c.lapses > 0 || lastGrade(c) === "unknown" || lastGrade(c) === "unsure");

  // Pure scheduling step: returns the new { reps, interval, ease, lapses } without touching the record.
  function schedule(c, grade) {
    let { reps = 0, interval = 0, ease = 2.5, lapses = 0 } = c || {};
    if (grade === "unknown") { reps = 0; interval = 1; lapses++; ease = Math.max(1.3, ease - 0.2); }
    else if (grade === "unsure") { interval = Math.max(1, Math.round((interval || 1) * 1.2)); ease = Math.max(1.3, ease - 0.05); reps++; }
    else if (grade === "easy") { reps++; const good = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease); interval = reps === 1 ? 4 : Math.max(good + 1, Math.round(Math.max(good, interval * ease) * 1.3)); ease = Math.min(3, ease + 0.15); }
    else { reps++; interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease); ease = Math.min(3, ease + 0.1); }
    return { reps, interval, ease, lapses };
  }
  // Interval (days) a grade would give, for the labels under the rating buttons. No side effects.
  function preview(id, grade) { return schedule(store().cards[id] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 }, grade).interval; }

  function review(id, ref, grade, opts = {}) {
    if (!GRADES.includes(grade)) grade = "known"; // unchanged behaviour: anything unrecognised was treated as known
    const c = card(id, ref); const now = Date.now();
    if (!Array.isArray(c.history)) c.history = [];
    if (opts.relearn) { c.history.push({ ts: now, grade, relearn: true }); }
    else { Object.assign(c, schedule(c, grade)); c.due = now + c.interval * DAY; c.history.push({ ts: now, grade }); }
    c.ref = ref || c.ref;
    B.store.save(); B.store.touchActivity("flashcard"); return c;
  }
  function dueCards(allCards, now = Date.now()) { const s = store(); return allCards.filter((k) => { const c = s.cards[k.id]; return isReviewed(c) && (c.due || 0) <= now; }); }
  function newCards(allCards) { const s = store(); return allCards.filter((k) => !isReviewed(s.cards[k.id])); }
  function difficultCards(allCards) { const s = store(); return allCards.filter((k) => { const c = s.cards[k.id]; return isReviewed(c) && (c.lapses > 0 || !remembered(lastGrade(c))); }); }
  function stats(allCards) { const s = store(); let seen = 0, known = 0; for (const k of allCards) { const c = s.cards[k.id]; if (c && hist(c).length) { seen++; if (remembered(lastGrade(c))) known++; } } return { total: allCards.length, seen, known, due: dueCards(allCards).length, new: newCards(allCards).length }; }

  // All flashcards across authored content. A ref filter matches that ref and everything below it ("3.1.1" no longer
  // also matches 3.1.10 and 3.1.11).
  const under = (ref, f) => ref === f || ref.startsWith(f + ".");
  function all(filterRef) {
    const out = [];
    if (filterRef && filterRef.startsWith("deck:")) { const d = (B.consolidation || {})[filterRef.slice(5)]; if (!d) return out; const byId = {}; for (const [ref, c] of Object.entries(B.content || {})) for (const f of c.flashcards || []) byId[f.id] = { ...f, ref }; for (const id of d.deckIds || []) if (byId[id]) out.push(byId[id]); for (const x of d.extraCards || []) out.push({ ...x }); return out; }
    for (const [ref, c] of Object.entries(B.content || {})) { if (filterRef && !under(ref, filterRef)) continue; for (const f of c.flashcards || []) out.push({ ...f, ref }); }
    return out;
  }
  // id -> card (content cards plus consolidation extra cards), for sessions that are resumed later.
  function lookup() { const m = {}; for (const c of all()) m[c.id] = c; for (const t of Object.keys(B.consolidation || {})) for (const x of (B.consolidation[t].extraCards || [])) if (!m[x.id]) m[x.id] = { ...x }; return m; }

  // ---- Scopes: "course" (the student's course, default), "all", a unit/topic/subsection ref, or "deck:<topic>" ----
  function normScope(scope) {
    if (!scope || scope === "course") return "course";
    if (scope === "all") return "all";
    if (scope.startsWith("deck:")) return (B.consolidation || {})[scope.slice(5)] ? scope : "course";
    return all(scope).length ? scope : "course";
  }
  function scopeCards(scope) {
    const sc = normScope(scope);
    if (sc === "course") return all().filter((k) => (B.profile ? B.profile.inScope(k.ref) : true));
    if (sc === "all") return all();
    return all(sc);
  }
  function scopeLabel(scope) {
    const sc = normScope(scope);
    if (sc === "course") { const c = B.profile ? B.profile.COURSES[B.profile.course()] : null; return c ? `Your course: ${c.short}` : "Your course"; }
    if (sc === "all") return "Everything with flashcards";
    if (sc.startsWith("deck:")) { const t = sc.slice(5); return `${t} ${titleOf(t)} combined deck`.replace(/\s+/g, " "); }
    return `${sc} ${titleOf(sc)}`.trim();
  }
  function titleOf(ref) {
    for (const u of (B.spec || {}).units || []) { if (u.ref === ref) return u.short || u.title || ""; for (const t of u.topics) { if (t.ref === ref) return t.title; for (const s of t.subsections) if (s.ref === ref) return s.title; } }
    return "";
  }
  // Scope options for the hub: course, everything, units, topics, subsections and combined decks that have cards.
  function scopeOptions() {
    const out = [{ value: "course", label: scopeLabel("course"), n: scopeCards("course").length, group: "Suggested" }, { value: "all", label: "Everything with flashcards", n: all().length, group: "Suggested" }];
    for (const u of (B.spec || {}).units || []) {
      const nU = all(u.ref).length; if (!nU) continue;
      const inC = B.profile ? B.profile.unitRefs().includes(u.ref) : true;
      const unitNo = B.spec.units.indexOf(u) + 1;
      const g = `Unit ${unitNo}: ${u.short || u.title}${inC ? "" : " (outside your course)"}`;
      out.push({ value: u.ref, label: `All of Unit ${unitNo} (${u.ref})`, n: nU, group: g });
      for (const t of u.topics) {
        const nT = all(t.ref).length; if (nT) out.push({ value: t.ref, label: `${t.ref} ${t.title}`, n: nT, group: g });
        if ((B.consolidation || {})[t.ref]) { const nD = all("deck:" + t.ref).length; if (nD) out.push({ value: "deck:" + t.ref, label: `${t.ref} combined deck`, n: nD, group: g }); }
        for (const s of t.subsections) { const nS = all(s.ref).length; if (nS) out.push({ value: s.ref, label: `${s.ref} ${s.title}`, n: nS, group: g, sub: true }); }
      }
    }
    return out;
  }

  // Weak subsections from B.progress (mastery below 70% on attempted questions): ref -> pct.
  function weakRefs() {
    const out = {}; if (!B.progress || !B.progress.perSubsection) return out;
    try { for (const r of B.progress.perSubsection()) if (r.mastery && r.mastery.questions && r.mastery.pct != null && r.mastery.pct < WEAK_BELOW) out[r.ref] = r.mastery.pct; } catch (e) { /* progress unavailable: no weak tier */ }
    return out;
  }
  const isWeak = (weak, ref) => Object.keys(weak).some((w) => under(ref, w) || under(w, ref));

  // Stable tie-break (FNV-1a) seeded by the number of finished sessions, so it is the same within a session and rotates after.
  function hash(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  const clampSize = (n) => { n = parseInt(n, 10); return Number.isFinite(n) ? Math.max(1, Math.min(50, n)) : 15; };
  const fcLog = () => { const s = store(); return Array.isArray(s.fcLog) ? s.fcLog : []; };

  function plan({ size = 15, scope = null, includeNew = false, now = Date.now() } = {}) {
    size = clampSize(size); const sc = normScope(scope);
    const s = store(); const cards = scopeCards(sc); const weak = weakRefs();
    const log = fcLog(); const seed = String(log.length); const last = new Set((log[log.length - 1] || {}).ids || []);
    const seen = new Set(); const uniq = cards.filter((k) => (seen.has(k.id) ? false : seen.add(k.id)));
    const t1 = [], t2 = [], t3 = [], t4 = [];
    for (const k of uniq) {
      const c = s.cards[k.id];
      if (!isReviewed(c)) { t4.push(k); continue; }
      if ((c.due || 0) <= now) { (isDifficult(c) ? t1 : t2).push(k); continue; }
      const ivl = Math.max(1, c.interval || 1) * DAY; const lastTs = lastReviewTs(c) || ((c.due || 0) - ivl);
      if (isWeak(weak, k.ref) && now - lastTs >= ivl / 2 && now - lastTs >= 12 * HOUR) t3.push(k);
    }
    const tie = (a, b) => (last.has(a.id) - last.has(b.id)) || (isWeak(weak, b.ref) - isWeak(weak, a.ref)) || (hash(a.id + "|" + seed) - hash(b.id + "|" + seed));
    const overdue = (k) => Math.floor((now - (s.cards[k.id].due || 0)) / DAY);
    const byDue = (a, b) => (last.has(a.id) - last.has(b.id)) || (overdue(b) - overdue(a)) || tie(a, b);
    t1.sort(byDue); t2.sort(byDue);
    t3.sort((a, b) => (last.has(a.id) - last.has(b.id)) || ((s.cards[a.id].due || 0) - (s.cards[b.id].due || 0)) || tie(a, b));
    t4.sort(tie);
    const order = [...t1, ...t2, ...t3, ...(includeNew ? t4 : [])];
    const picked = order.slice(0, size);
    return {
      cards: picked.map((k) => k.id), dueTotal: t1.length + t2.length, eligible: t1.length + t2.length + t3.length, newAvailable: t4.length,
      scope: sc, size, includeNew: !!includeNew, total: uniq.length,
      breakdown: { difficult: picked.filter((k) => t1.includes(k)).length, due: picked.filter((k) => t2.includes(k)).length, weak: picked.filter((k) => t3.includes(k)).length, new: picked.filter((k) => t4.includes(k)).length },
    };
  }

  // ---- Sessions (one saved slot: store.fcSession) ----
  function validSession(x) { return x && typeof x === "object" && Array.isArray(x.queue) && Array.isArray(x.done); }
  function saved() { const s = store(); if (s.fcSession && !validSession(s.fcSession)) { s.fcSession = null; } return s.fcSession || null; }
  // Builds a session object. persist=false keeps it in memory until the first rating, so opening a link never replaces a
  // saved session the student has not touched.
  function createSession(opts = {}, persist = true) {
    const p = plan(opts);
    const sess = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), scope: p.scope, size: p.size, includeNew: p.includeNew, startedAt: Date.now(), queue: p.cards.map((id) => ({ id, relearn: false })), total: p.cards.length, done: [], reshown: [], plan: { dueTotal: p.dueTotal, newAvailable: p.newAvailable, breakdown: p.breakdown } };
    if (persist && sess.queue.length) adopt(sess);
    return sess;
  }
  // Make `sess` the saved session (replacing any other one; a replaced session's reviewed cards are logged for rotation).
  function adopt(sess) { const s = store(); const old = saved(); if (old && old.id !== sess.id && old.done.length) logSession(old, true); s.fcSession = sess; B.store.save(); return sess; }
  // Drop queue entries whose card no longer exists (content edited); returns the card object for the head of the queue.
  function head(sess, map = lookup()) { while (sess.queue.length && !map[sess.queue[0].id]) { sess.queue.shift(); sess.total = Math.max(sess.done.length, sess.total - 1); } return sess.queue.length ? map[sess.queue[0].id] : null; }
  // Rate the current card. Returns { card, grade, interval, relearnAdded, finished, summary }.
  function rate(sess, rating, map = lookup()) {
    const grade = RATINGS[rating] || (GRADES.includes(rating) ? rating : null); if (!grade) throw new Error("Unknown rating " + rating);
    const k = head(sess, map); if (!k) return { finished: true, summary: finish(sess) };
    const item = sess.queue.shift();
    const c = review(k.id, k.ref, grade, { relearn: item.relearn });
    sess.done.push({ id: k.id, ref: k.ref, grade, relearn: !!item.relearn, ts: Date.now() });
    let relearnAdded = false;
    if (grade === "unknown" && !item.relearn && !sess.reshown.includes(k.id)) { sess.queue.splice(Math.min(3, sess.queue.length), 0, { id: k.id, relearn: true }); sess.reshown.push(k.id); sess.total++; relearnAdded = true; }
    const s = store(); if (!s.fcSession || s.fcSession.id !== sess.id) adopt(sess); else B.store.save();
    head(sess, map);
    if (!sess.queue.length) return { card: k, grade, interval: c.interval, relearnAdded, finished: true, summary: finish(sess) };
    return { card: k, grade, interval: c.interval, relearnAdded, finished: false };
  }
  function summarise(sess) {
    const first = {}; for (const d of sess.done) if (!d.relearn && !(d.id in first)) first[d.id] = d;
    const list = Object.values(first);
    const confident = list.filter((d) => remembered(d.grade)).length, thought = list.filter((d) => d.grade === "unsure").length, again = list.filter((d) => d.grade === "unknown").length;
    return { reviewed: list.length, confident, thought, again, ids: list.map((d) => d.id), scope: sess.scope, next: recommend(sess) };
  }
  function logSession(sess, partial) { const s = store(); if (!Array.isArray(s.fcLog)) s.fcLog = []; const sum = summarise(sess); s.fcLog.push({ ts: Date.now(), startedAt: sess.startedAt, scope: sess.scope, reviewed: sum.reviewed, confident: sum.confident, thought: sum.thought, again: sum.again, ids: sum.ids, partial: !!partial }); if (s.fcLog.length > LOG_MAX) s.fcLog.splice(0, s.fcLog.length - LOG_MAX); return sum; }
  function finish(sess) { const sum = logSession(sess, false); const s = store(); if (s.fcSession && s.fcSession.id === sess.id) s.fcSession = null; B.store.save(); return sum; }
  // Stop and save: the remaining queue is kept so the student can resume from the hub.
  function stop(sess) { sess.pausedAt = Date.now(); const s = store(); if (sess.queue.length) { if (!s.fcSession || s.fcSession.id !== sess.id) adopt(sess); else B.store.save(); } return s.fcSession; }
  function discard() { const s = store(); const old = saved(); if (old && old.done.length) logSession(old, true); s.fcSession = null; B.store.save(); }

  // One next step: the subsection with most Again/Hard ratings this session (quick check), else the weakest in-scope
  // subsection by mastery, else a gentle "come back later".
  function recommend(sess) {
    const score = {}; for (const d of sess.done) if (!d.relearn && (d.grade === "unknown" || d.grade === "unsure")) score[d.ref] = (score[d.ref] || 0) + (d.grade === "unknown" ? 2 : 1);
    const top = Object.entries(score).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (top) return { kind: "check", ref: top[0], title: titleOf(top[0]), href: `#/topic/${top[0]}/check`, why: "Several cards from this subsection needed more thought" };
    const weak = weakRefs(); const inSc = new Set(scopeCards(sess.scope).map((k) => k.ref));
    const w = Object.entries(weak).filter(([r]) => inSc.has(r)).sort((a, b) => a[1] - b[1])[0];
    if (w) return { kind: "check", ref: w[0], title: titleOf(w[0]), href: `#/topic/${w[0]}/check`, why: "Your recent question scores here are your lowest in this selection" };
    return { kind: "later", href: "#/flashcards", why: "Your cards are scheduled; come back when more are due" };
  }

  // ---- Daily goal: distinct cards reviewed today (any rating). Never punitive: yesterday does not carry over. ----
  function todayCount(now = Date.now()) { const key = B.util.dayKey(now); let n = 0; for (const c of Object.values(store().cards)) if (hist(c).some((e) => B.util.dayKey(e.ts) === key)) n++; return n; }
  function prefs() { const s = store(); if (!s.fcPrefs || typeof s.fcPrefs !== "object") s.fcPrefs = { goal: 15, size: 15, scope: null, includeNew: false }; return s.fcPrefs; }
  function goal() { const g = prefs().goal; return GOALS.includes(g) ? g : 15; }
  function setPrefs(patch) { const p = prefs(); if (patch.goal != null && GOALS.includes(+patch.goal)) p.goal = +patch.goal; if (patch.size != null) p.size = clampSize(patch.size); if ("scope" in patch) p.scope = patch.scope ? normScope(patch.scope) : null; if ("includeNew" in patch) p.includeNew = !!patch.includeNew; B.store.save(); return p; }

  B.flashcards = { review, dueCards, newCards, difficultCards, stats, all, card, schedule, preview, isReviewed, lastGrade, remembered,
    plan, scopeCards, scopeLabel, scopeOptions, normScope, titleOf, weakRefs, lookup,
    createSession, adopt, saved, head, rate, stop, discard, finish, summarise, todayCount, goal, prefs, setPrefs,
    RATINGS, RATING_OF, LABEL, SIZES, GOALS };
})(window.BIO);
