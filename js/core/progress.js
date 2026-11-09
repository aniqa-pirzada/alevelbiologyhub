// Progress metrics. Calculation rules are documented here and mirrored in docs/README.md.
//
// COVERAGE  (subsection): visited = the page has been opened; completed = the student marked it complete.
//           Unit/topic coverage % = completed subsections / total subsections.
// MASTERY   (subsection): based on the LATEST attempt at each distinct question tagged to that ref
//           (so retakes replace earlier scores but history is kept). Mastery % = sum(latest score) / sum(max).
//           Questions answered with hints or model answers shown before submission are excluded from mastery.
//           A subsection with fewer than 3 distinct questions attempted has mastery "insufficient data".
// RETENTION (subsection): flashcard-based. For cards in that ref reviewed at least twice, the proportion of
//           reviews graded Known when the review happened >= 2 days after the previous review.
// MASTERY LEVEL for heatmaps: 0 none, 1 <50%, 2 50-69%, 3 70-84%, 4 >=85%. 'x' = attempted but insufficient data.
// STREAK    consecutive calendar days (including today or yesterday) with at least one logged action.
window.BIO = window.BIO || {};
(function (B) {
  const spec = () => B.spec;
  const allSubs = () => spec().units.flatMap((u) => u.topics.flatMap((t) => t.subsections.map((s) => ({ ...s, unit: u.ref, topic: t.ref }))));

  function coverage(filterFn = () => true) {
    const s = B.store.get(); const subs = allSubs().filter(filterFn);
    const done = subs.filter((x) => s.coverage[x.ref] && s.coverage[x.ref].completed).length;
    const visited = subs.filter((x) => s.coverage[x.ref] && s.coverage[x.ref].visited).length;
    return { total: subs.length, completed: done, visited, pct: B.util.pct(done, subs.length) };
  }

  function latestAttempts(filterFn = () => true) {
    const s = B.store.get(); const latest = {};
    for (const a of s.attempts) { if (!filterFn(a)) continue; if (a.hinted) continue; if (!latest[a.qid] || latest[a.qid].ts <= a.ts) latest[a.qid] = a; } // attempts are appended in order, so a tie on ts keeps the later one
    return Object.values(latest);
  }
  function mastery(filterFn = () => true) {
    const l = latestAttempts(filterFn);
    const score = l.reduce((n, a) => n + a.score, 0), max = l.reduce((n, a) => n + a.max, 0);
    return { questions: l.length, score, max, pct: max ? Math.round((100 * score) / max) : null, sufficient: l.length >= 3 };
  }
  function masteryLevel(m) { if (!m.questions) return 0; if (!m.sufficient) return "x"; if (m.pct >= 85) return 4; if (m.pct >= 70) return 3; if (m.pct >= 50) return 2; return 1; }

  function retention(filterFn = () => true) {
    const s = B.store.get(); let ok = 0, n = 0;
    for (const [id, c] of Object.entries(s.cards)) {
      if (!filterFn(id, c)) continue; const hist = c.history || [];
      for (let i = 1; i < hist.length; i++) { const gap = (hist[i].ts - hist[i - 1].ts) / 864e5; if (gap >= 2) { n++; if (hist[i].grade === "known") ok++; } }
    }
    return { reviews: n, pct: n ? Math.round((100 * ok) / n) : null };
  }

  function streak() {
    const s = B.store.get(); const days = new Set(Object.keys(s.activity)); let count = 0; const d = new Date();
    if (!days.has(B.util.dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(B.util.dayKey(d))) { count++; d.setDate(d.getDate() - 1); }
    return count;
  }

  function perSubsection() {
    return allSubs().map((sub) => {
      const m = mastery((a) => a.ref === sub.ref);
      const r = retention((id, c) => c.ref === sub.ref);
      const s = B.store.get(); const cov = s.coverage[sub.ref] || {};
      return { ...sub, mastery: m, level: masteryLevel(m), retention: r, visited: !!cov.visited, completed: !!cov.completed };
    });
  }

  // Recommendations: explainable scoring. Higher = more urgent.
  function recommendations(limit = 5) {
    const s = B.store.get(); const now = Date.now(); const out = [];
    const hasContent = (ref) => B.content && B.content[ref] && B.content[ref].status !== "not_started";
    for (const sub of perSubsection()) {
      if (!hasContent(sub.ref)) continue; // only recommend things the platform can actually deliver
      let score = 0; const why = [];
      if (!sub.visited) { score += 2; why.push("not yet studied"); }
      if (sub.mastery.questions && sub.mastery.sufficient && sub.mastery.pct < 70) { score += 4; why.push(`mastery ${sub.mastery.pct}%`); }
      if (sub.mastery.questions && !sub.mastery.sufficient) { score += 1; why.push("only a few questions attempted"); }
      const due = Object.entries(s.cards).filter(([id, c]) => c.ref === sub.ref && c.due <= now).length;
      if (due) { score += Math.min(3, due); why.push(`${due} flashcard${due > 1 ? "s" : ""} due`); }
      const open = Object.values(s.mistakes).filter((m) => m.ref === sub.ref && !m.resolved).length;
      if (open) { score += Math.min(3, open); why.push(`${open} unresolved mistake${open > 1 ? "s" : ""}`); }
      const cov = s.coverage[sub.ref]; if (cov && cov.visited && now - cov.visited > 14 * 864e5) { score += 1; why.push("last opened over 2 weeks ago"); }
      if (score > 0) out.push({ ref: sub.ref, title: sub.title, score, why });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  B.progress = { allSubs, coverage, mastery, masteryLevel, retention, streak, perSubsection, recommendations, latestAttempts };
})(window.BIO);
