window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, esc, shuffle, fmtDate } = B.util;

  B.views.flashcards = function (ref) {
    const all = B.flashcards.all(ref);
    const isDeck = ref && ref.startsWith("deck:");
    const title = isDeck ? `Combined deck: ${ref.slice(5)} ${((B.consolidation || {})[ref.slice(5)] || {}).title || ""}` : ref ? `Flashcards: ${ref}` : "Flashcards and retrieval practice";
    if (!all.length) return B.app.render(h`<div class="page-head"><div><div class="eyebrow">Flashcards</div><h1>${title}</h1></div></div><div class="card"><div class="empty">${raw(icons.cards)}<h3>No flashcards for this selection yet</h3><p>Flashcards are written alongside each subsection's notes. ${ref ? raw('<a href="#/flashcards">See all available cards</a>.') : "None are authored yet."}</p></div></div>`, { title: "Flashcards", crumbs: [{ label: "Flashcards" }] });
    const stats = B.flashcards.stats(all);
    const deckOptions = [];
    for (const u of B.spec.units) for (const t of u.topics) { const cons = (B.consolidation || {})[t.ref]; if (cons) deckOptions.push({ ref: "deck:" + t.ref, title: `Combined deck: ${t.title}`, n: B.flashcards.all("deck:" + t.ref).length }); for (const s of t.subsections) { const n = B.flashcards.all(s.ref).length; if (n) deckOptions.push({ ref: s.ref, title: s.title, n }); } }
    const html = el(h`<div>
      <div class="page-head"><div><div class="eyebrow">Active recall · spaced repetition</div><h1>${title}</h1><p class="lede">Read the question, say or write your answer, then flip. Grade yourself honestly: the schedule adapts to you. Keyboard: Space to flip, 1 = Not known, 2 = Unsure, 3 = Known.</p></div></div>
      <div class="grid grid-4 mb"><div class="card"><div class="stat"><span class="v">${stats.total}</span><span class="l">cards in this deck</span></div></div><div class="card"><div class="stat"><span class="v">${stats.due}</span><span class="l">due for review now</span></div></div><div class="card"><div class="stat"><span class="v">${stats.known}</span><span class="l">last graded Known</span></div></div><div class="card"><div class="stat"><span class="v">${stats.seen}</span><span class="l">seen at least once</span></div></div></div>
      <div class="card mb"><div class="row">
        <label class="small">Deck: <select id="deck"><option value="">All authored cards</option>${raw(deckOptions.map((d) => h`<option value="${d.ref}" ${d.ref === ref ? "selected" : ""}>${d.ref} ${d.title} (${d.n})</option>`).join(""))}</select></label>
        <label class="small">Mode: <select id="mode"><option value="due">Due cards first</option><option value="all">All cards</option><option value="difficult">Difficult cards only</option></select></label>
        <button class="btn" id="shuffle">Shuffle</button></div></div>
      <div id="stage"></div>
    </div>`);
    B.app.render(html, { title: "Flashcards", crumbs: [{ label: "Flashcards" }] });
    $("#deck", html).addEventListener("change", (e) => (location.hash = "#/flashcards" + (e.target.value ? "/" + e.target.value : "")));
    let queue = []; let i = 0;
    const build = () => { const mode = $("#mode", html).value; queue = mode === "due" ? B.flashcards.dueCards(all).concat(all.filter((c) => !B.flashcards.dueCards(all).includes(c))) : mode === "difficult" ? B.flashcards.difficultCards(all) : all.slice(); i = 0; show(); };
    $("#mode", html).addEventListener("change", build); $("#shuffle", html).addEventListener("click", () => { queue = shuffle(queue); i = 0; show(); });
    function show() {
      const stage = $("#stage", html);
      if (!queue.length) { stage.innerHTML = `<div class="card"><div class="empty">${icons.cards}<h3>Nothing in this mode</h3><p>Switch mode to "All cards" to keep practising.</p></div></div>`; return; }
      if (i >= queue.length) { stage.innerHTML = `<div class="card"><div class="empty">${icons.check}<h3>Deck finished</h3><p>You reviewed ${queue.length} cards. Come back when they are due.</p><button class="btn primary" id="again">Go again</button></div></div>`; $("#again", stage).onclick = build; return; }
      const c = queue[i]; const st = B.store.get().cards[c.id]; const due = st ? (st.due <= Date.now() ? "due now" : "due " + fmtDate(st.due)) : "new card";
      stage.innerHTML = h`<div class="fc-stage"><div class="fc-meta"><span>Card ${i + 1} of ${queue.length}</span><span><a href="#/topic/${c.ref}">${c.ref}</a> · ${due}${st ? ` · interval ${st.interval} d · ease ${st.ease.toFixed(2)}` : ""}</span></div>
        <div class="fc" id="fc" tabindex="0" role="button" aria-pressed="false" aria-label="flashcard, press to flip"><div class="face front"><div class="lbl">Question</div><div class="txt">${c.front}</div></div><div class="face back"><div class="lbl">Answer</div><div class="txt">${c.back}</div></div></div>
        <div class="fc-controls" id="grade" hidden><button class="btn danger" data-g="unknown">1 · Not known</button><button class="btn" data-g="unsure">2 · Unsure</button><button class="btn primary" data-g="known">3 · Known</button></div>
        <div class="fc-controls" id="flipwrap"><button class="btn" id="flip">Flip card</button></div></div>`;
      const fc = $("#fc", stage); const flip = () => { fc.classList.toggle("flipped"); const f = fc.classList.contains("flipped"); fc.setAttribute("aria-pressed", f); $("#grade", stage).hidden = !f; $("#flipwrap", stage).hidden = f; };
      fc.addEventListener("click", flip); $("#flip", stage).addEventListener("click", flip);
      fc.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
      $$("#grade button", stage).forEach((b) => b.addEventListener("click", () => { B.flashcards.review(c.id, c.ref, b.dataset.g); i++; show(); }));
      fc.focus();
    }
    const keyHandler = (e) => { if (!document.body.contains(html)) { document.removeEventListener("keydown", keyHandler); return; } if (e.target.matches("input,select,textarea")) return; if (["1", "2", "3"].includes(e.key) && !$("#grade", html).hidden) { $(`#grade button[data-g="${["unknown", "unsure", "known"][+e.key - 1]}"]`, html).click(); } };
    document.addEventListener("keydown", keyHandler);
    build();
  };
})(window.BIO);
