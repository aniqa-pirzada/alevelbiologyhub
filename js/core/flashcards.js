// Spaced repetition: a transparent SM-2 variant.
// Grades: known (quality 5), unsure (3), unknown (1).
//  - unknown: reps reset to 0, interval 1 day, lapses +1, ease -= 0.2 (min 1.3)
//  - unsure:  interval = max(1, round(interval * 1.2)), ease -= 0.05 (min 1.3), reps +1
//  - known:   reps 1 -> 1 day, reps 2 -> 3 days, reps n -> round(prev interval * ease); ease += 0.1 (max 3.0)
// due = review timestamp + interval days. New cards are due immediately. Every review is appended to history.
window.BIO = window.BIO || {};
(function (B) {
  const DAY = 864e5;
  function card(id, ref) { const s = B.store.get(); return s.cards[id] || (s.cards[id] = { ref, ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0, history: [] }); }
  function review(id, ref, grade) {
    const c = card(id, ref); const now = Date.now();
    if (grade === "unknown") { c.reps = 0; c.interval = 1; c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2); }
    else if (grade === "unsure") { c.interval = Math.max(1, Math.round((c.interval || 1) * 1.2)); c.ease = Math.max(1.3, c.ease - 0.05); c.reps++; }
    else { c.reps++; c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.round(c.interval * c.ease); c.ease = Math.min(3, c.ease + 0.1); }
    c.due = now + c.interval * DAY; c.history.push({ ts: now, grade }); c.ref = ref;
    B.store.save(); B.store.touchActivity("flashcard"); return c;
  }
  function dueCards(allCards, now = Date.now()) { const s = B.store.get(); return allCards.filter((k) => !s.cards[k.id] || s.cards[k.id].due <= now); }
  function difficultCards(allCards) { const s = B.store.get(); return allCards.filter((k) => s.cards[k.id] && (s.cards[k.id].lapses > 0 || (s.cards[k.id].history.slice(-1)[0] || {}).grade !== "known")); }
  function stats(allCards) { const s = B.store.get(); let seen = 0, known = 0; for (const k of allCards) { const c = s.cards[k.id]; if (c && c.history.length) { seen++; if (c.history.slice(-1)[0].grade === "known") known++; } } return { total: allCards.length, seen, known, due: dueCards(allCards).length }; }
  // All flashcards across authored content
  function all(filterRef) {
    const out = [];
    if (filterRef && filterRef.startsWith("deck:")) { const d = (B.consolidation || {})[filterRef.slice(5)]; if (!d) return out; const byId = {}; for (const [ref, c] of Object.entries(B.content || {})) for (const f of c.flashcards || []) byId[f.id] = { ...f, ref }; for (const id of d.deckIds) if (byId[id]) out.push(byId[id]); for (const x of d.extraCards || []) out.push({ ...x }); return out; }
    for (const [ref, c] of Object.entries(B.content || {})) { if (filterRef && !ref.startsWith(filterRef)) continue; for (const f of c.flashcards || []) out.push({ ...f, ref }); }
    return out;
  }
  B.flashcards = { review, dueCards, difficultCards, stats, all, card };
})(window.BIO);
