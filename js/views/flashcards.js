// Flashcards (redesign 2026-11-09): a calm session hub and a focused one-card-at-a-time session.
// Routes (register with B.views.flashcardRoutes(r), which must come before any generic "/flashcards/:ref" route):
//   #/flashcards                  hub: session size, topics, include new cards, daily goal, resume
//   #/flashcards/session[/:size]  a review session for the student's course (default 15 cards, due cards only)
//   #/flashcards/new[/:size]      optional practice that includes new cards (default 5)
//   #/flashcards/resume           resume the saved session (or the hub if there is none)
//   #/flashcards/:ref             a session for a subsection, topic, unit or "deck:<topic>" combined deck (new cards included,
//                                 because the student chose that set); a saved session for the same set is resumed instead
// Card wording is shown exactly as authored (escaped text, as before).
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons } = B.util;
  const F = () => B.flashcards;
  const CRUMBS = [{ label: "Flashcards", href: "#/flashcards" }];
  const SPECIAL = ["session", "new", "resume"];
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const days = (d) => (d <= 1 ? "1 day" : d < 60 ? `${d} days` : `about ${Math.round(d / 30)} months`);
  const wasStarted = (sv) => !!(sv && (sv.done.length || sv.pausedAt));
  let keyHandler = null;
  function setKeys(fn) { if (keyHandler) document.removeEventListener("keydown", keyHandler); keyHandler = fn; if (fn) document.addEventListener("keydown", fn); }
  const modalOpen = () => !!document.querySelector(".ob-backdrop");

  B.views.flashcardRoutes = function (r) {
    r("/flashcards", () => B.views.flashcards());
    r("/flashcards/session", () => B.views.flashcards("session"));
    r("/flashcards/session/:size", (n) => B.views.flashcards("session", n));
    r("/flashcards/new", () => B.views.flashcards("new"));
    r("/flashcards/new/:size", (n) => B.views.flashcards("new", n));
    r("/flashcards/resume", () => B.views.flashcards("resume"));
    r("/flashcards/:ref", (ref) => B.views.flashcards(ref));
  };

  B.views.flashcards = function (ref, arg) {
    setKeys(null);
    if (!ref) return hub();
    if (ref === "session") return startRoute({ size: arg || 15, scope: "course", includeNew: false, kind: "session" });
    if (ref === "new") return startRoute({ size: arg || 5, scope: "course", includeNew: true, kind: "new" });
    if (ref === "resume") { const sv = F().saved(); if (sv && sv.queue.length) return runSession(sv, { resumed: wasStarted(sv) }); location.replace("#/flashcards"); return hub(); }
    if (!F().all(ref).length) return B.app.render(h`<div class="page-head"><div><div class="eyebrow">Flashcards</div><h1>${ref.startsWith("deck:") ? "Combined deck " + ref.slice(5) : "Flashcards: " + ref}</h1></div></div><div class="card"><div class="empty">${raw(icons.cards)}<h3>No flashcards for this selection yet</h3><p>Flashcards are written alongside each subsection's notes. <a href="#/flashcards">See the flashcard sessions</a>.</p></div></div>`, { title: "Flashcards", crumbs: CRUMBS });
    const P = F().prefs();
    return startRoute({ size: P.size || 15, scope: ref, includeNew: true, kind: "link" });
  };

  // A session route resumes a saved session for the same selection; otherwise it plans a fresh one that is only saved
  // once the first card is rated (so following a link never replaces a saved session).
  function startRoute(opts) {
    const sc = F().normScope(opts.scope);
    const sv = F().saved();
    if (sv && sv.queue.length && sv.scope === sc && !!sv.includeNew === !!opts.includeNew) return runSession(sv, { resumed: wasStarted(sv) });
    const sess = F().createSession({ size: opts.size, scope: sc, includeNew: opts.includeNew }, false);
    if (!sess.queue.length) return nothingDue(sc, opts);
    return runSession(sess, {});
  }

  function nothingDue(scope, opts) {
    const p = F().plan({ scope, includeNew: false });
    const weak = Object.entries(F().weakRefs()).filter(([r]) => F().scopeCards(scope).some((k) => k.ref === r)).sort((a, b) => a[1] - b[1])[0];
    const check = weak ? h`<a class="btn" href="#/topic/${weak[0]}/check">Quick check: ${weak[0]} ${F().titleOf(weak[0])}</a>` : '<a class="btn" href="#/library">Open the Revision Library</a>';
    const html = el(h`<div class="fcx-hub">
      <div class="page-head"><div><div class="eyebrow">Flashcards</div><h1>Nothing is due for review</h1><p class="lede">None of the cards you have studied in ${F().scopeLabel(scope)} are due yet, so there is nothing to catch up on. You can learn some new cards or try a short quick check instead.</p></div></div>
      <div class="card"><div class="row">${raw(p.newAvailable ? h`<a class="btn primary" href="#/flashcards/new" id="fcx-try-new">Practise 5 new cards</a>` : "")}${raw(check)}<a class="btn ghost" href="#/flashcards">Flashcard sessions</a></div>
      ${raw(p.newAvailable ? "" : '<p class="small muted mt">You have studied every card in this selection. They will come back when they are due.</p>')}</div></div>`);
    B.app.render(html, { title: "Flashcards", crumbs: CRUMBS });
  }

  // ---------------- Hub ----------------
  function hub() {
    const P = F().prefs();
    let size = P.size || 15; let scope = F().normScope(P.scope || "course"); let inc = !!P.includeNew;
    const preset = [5, 15, 25].includes(size) ? size : "custom";
    const sv = F().saved();
    const opts = F().scopeOptions(); const groups = [];
    for (const o of opts) { let g = groups.find((x) => x.name === o.group); if (!g) groups.push((g = { name: o.group, items: [] })); g.items.push(o); }
    const optHTML = groups.map((g) => h`<optgroup label="${g.name}">${raw(g.items.map((o) => h`<option value="${o.value}" ${o.value === scope ? "selected" : ""}>${o.sub ? "  " : ""}${o.label} (${o.n})</option>`).join(""))}</optgroup>`).join("");
    const sizeOpt = (v, name, n) => h`<label class="fcx-size"><input type="radio" name="fcx-size" value="${v}" ${preset === v ? "checked" : ""}><span class="fcx-size-name">${name}</span><span class="fcx-size-n">${n}</span></label>`;
    const goal = F().goal(); const today = F().todayCount();
    const course = F().plan({ scope: "course", size: 50 });
    const resumeHTML = sv && sv.queue.length ? h`<section class="card fcx-resume mb" aria-labelledby="fcx-resume-h"><div><h2 class="fcx-h" id="fcx-resume-h">Pick up where you left off</h2><p class="small">You have a saved session: ${plural(sv.queue.length, "card")} left from ${F().scopeLabel(sv.scope)}${sv.done.length ? `, ${plural(new Set(sv.done.map((d) => d.id)).size, "card")} already reviewed` : ""}. Starting a new session below replaces it; reviews you have already made are always kept.</p></div><div class="row"><a class="btn primary" href="#/flashcards/resume" id="fcx-resume">Resume session</a><button class="btn ghost" type="button" id="fcx-discard">Discard saved session</button></div></section>` : "";
    const html = el(h`<div class="fcx-hub">
      <div class="page-head"><div><div class="eyebrow">Flashcards and retrieval</div><h1>Flashcard sessions</h1><p class="lede">Short, regular sessions build memory better than trying to clear everything at once. Choose a size and a topic, and the cards that most need your attention come first.</p></div></div>
      ${raw(resumeHTML)}
      <div class="fcx-hub-grid">
        <form class="card fcx-builder" id="fcx-form" novalidate aria-labelledby="fcx-start-h">
          <h2 class="fcx-h" id="fcx-start-h">Start a session</h2>
          <fieldset class="fcx-sizes"><legend>Session size</legend><div class="fcx-size-grid">
            ${raw(sizeOpt(5, "Quick review", "5 cards"))}${raw(sizeOpt(15, "Standard review", "15 cards"))}${raw(sizeOpt(25, "Deep review", "25 cards"))}
            <label class="fcx-size"><input type="radio" name="fcx-size" value="custom" ${preset === "custom" ? "checked" : ""}><span class="fcx-size-name">Custom</span><span class="fcx-size-n"><input type="number" id="fcx-custom" min="1" max="50" step="1" inputmode="numeric" value="${preset === "custom" ? size : 10}" aria-label="Custom number of cards, 1 to 50"> cards</span></label>
          </div></fieldset>
          <div class="fcx-field"><label for="fcx-scope">Topics</label><select id="fcx-scope">${raw(optHTML)}</select></div>
          <label class="fcx-check"><input type="checkbox" id="fcx-new" ${inc ? "checked" : ""}><span>Include new cards I have not studied yet <span class="muted" id="fcx-newn"></span></span></label>
          <p class="fcx-preview" id="fcx-preview" aria-live="polite"></p>
          <div class="row"><button class="btn primary" type="submit" id="fcx-start">Start session</button></div>
        </form>
        <section class="card fcx-goal" aria-labelledby="fcx-goal-h">
          <h2 class="fcx-h" id="fcx-goal-h">Today</h2>
          <p class="fcx-goal-line"><strong id="fcx-today">${today}</strong> of <span id="fcx-goal-n">${goal}</span> cards reviewed today</p>
          <div class="progress" role="progressbar" aria-labelledby="fcx-goal-h" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(today, goal)}" id="fcx-goal-bar"><span style="width:${Math.min(100, Math.round((100 * today) / goal))}%"></span></div>
          <p class="small muted" id="fcx-goal-msg"></p>
          <fieldset class="fcx-goals"><legend class="small">Daily goal</legend><div class="fcx-goal-opts">${raw(F().GOALS.map((g) => h`<label><input type="radio" name="fcx-goal" value="${g}" ${g === goal ? "checked" : ""}><span>${g}</span></label>`).join(""))}</div></fieldset>
          <p class="tiny muted">A missed day is fine. Nothing piles up against you: each session simply starts with the most useful cards.</p>
        </section>
      </div>
      <p class="tiny muted fcx-backlog" id="fcx-backlog">For reference, across your course: ${course.dueTotal} due for review, ${course.newAvailable} not studied yet, ${course.total} cards in total. You never need to clear these in one go.</p>
      <details class="card fcx-how"><summary>How the ratings work</summary>
        <ul class="small"><li><strong>Again</strong>: you will see the card once more later in this session, and it comes back tomorrow.</li><li><strong>Hard</strong>: you got there with effort, so the gap grows only a little.</li><li><strong>Good</strong>: the normal next step (1 day, then 3 days, then longer each time).</li><li><strong>Easy</strong>: a longer gap before you see it again.</li></ul>
        <p class="small">Keyboard: Space or Enter shows the answer; then 1 Again, 2 Hard, 3 Good, 4 Easy. Your existing review history and schedule are kept exactly as they were.</p>
      </details>
    </div>`);
    B.app.render(html, { title: "Flashcards", crumbs: [{ label: "Flashcards" }] });

    const form = $("#fcx-form", html), custom = $("#fcx-custom", html), sel = $("#fcx-scope", html), chk = $("#fcx-new", html);
    const readSize = () => { const v = (form.querySelector('input[name="fcx-size"]:checked') || {}).value; if (v === "custom") { const n = parseInt(custom.value, 10); return Number.isFinite(n) ? Math.max(1, Math.min(50, n)) : null; } return +v || 15; };
    function update() {
      size = readSize(); scope = sel.value; inc = chk.checked;
      const pv = $("#fcx-preview", html), btn = $("#fcx-start", html);
      if (size == null) { pv.textContent = "Choose a number of cards from 1 to 50."; btn.disabled = true; custom.setAttribute("aria-invalid", "true"); return; }
      custom.removeAttribute("aria-invalid");
      const p = F().plan({ size, scope, includeNew: inc });
      $("#fcx-newn", html).textContent = p.newAvailable ? `(${p.newAvailable} in this selection)` : "(none left in this selection)";
      const b = p.breakdown; const parts = [];
      if (b.difficult) parts.push(`${b.difficult} you found tricky before`); if (b.due) parts.push(`${b.due} due for review`); if (b.weak) parts.push(`${b.weak} from subsections where your scores are lower`); if (b.new) parts.push(`${b.new} new`);
      if (p.cards.length) pv.textContent = `This session: ${plural(p.cards.length, "card")} (${parts.join(", ")}).`;
      else if (p.newAvailable && !inc) pv.textContent = "Nothing in this selection is due for review right now. Tick “Include new cards” to learn some new ones, or try a quick check.";
      else pv.textContent = "You have studied every card in this selection and none are due yet. Try another topic or a quick check.";
      btn.disabled = !p.cards.length; btn.textContent = p.cards.length ? `Start session (${plural(p.cards.length, "card")})` : "Start session";
    }
    form.addEventListener("change", (e) => { if (e.target === custom) { const r = form.querySelector('input[name="fcx-size"][value="custom"]'); r.checked = true; } update(); });
    custom.addEventListener("input", () => { form.querySelector('input[name="fcx-size"][value="custom"]').checked = true; update(); });
    custom.addEventListener("focus", () => { form.querySelector('input[name="fcx-size"][value="custom"]').checked = true; update(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault(); update(); if (size == null) { custom.focus(); return; }
      F().setPrefs({ size, scope: scope === "course" ? null : scope, includeNew: inc });
      const sess = F().createSession({ size, scope, includeNew: inc }, true);
      if (!sess.queue.length) return;
      location.hash = "#/flashcards/resume";
    });
    const goalMsg = () => { const g = F().goal(), t = F().todayCount(); $("#fcx-goal-n", html).textContent = g; const bar = $("#fcx-goal-bar", html); bar.setAttribute("aria-valuemax", g); bar.setAttribute("aria-valuenow", Math.min(t, g)); bar.firstElementChild.style.width = Math.min(100, Math.round((100 * t) / g)) + "%";
      $("#fcx-goal-msg", html).textContent = t >= g ? "Goal reached for today. Anything more is a bonus." : t ? `${plural(g - t, "more card")} to reach today's goal.` : `A ${g}-card session would reach today's goal.`; };
    $$('input[name="fcx-goal"]', html).forEach((r) => r.addEventListener("change", () => { F().setPrefs({ goal: +r.value }); goalMsg(); }));
    const disc = $("#fcx-discard", html); if (disc) disc.addEventListener("click", () => { F().discard(); B.util.toast("Saved session discarded. Your reviews so far are kept."); hub(); const s = $("#fcx-start"); if (s) s.focus(); });
    goalMsg(); update();
  }

  // ---------------- Session ----------------
  function runSession(sess, { resumed = false } = {}) {
    const map = F().lookup();
    const nScope = F().scopeCards(sess.scope).length;
    const html = el(h`<div class="fcx-session">
      <div class="fcx-top"><div><div class="eyebrow">Flashcard session${resumed ? " · resumed" : ""}</div><h1 class="fcx-title">${F().scopeLabel(sess.scope)}</h1>
        <p class="fcx-scope small muted">${raw(sess.scope === "course" || sess.scope === "all" ? "" : h`<span class="stat fcx-inline"><span class="v">${nScope}</span> <span class="l">cards in this set</span></span> · `)}<a href="#/flashcards" id="fcx-options">Change session options</a></p></div>
        <button class="btn sm" type="button" id="fcx-stop">Stop and save</button></div>
      <div class="fcx-progress"><span id="fcx-pos" class="fcx-pos"></span><div class="progress" id="fcx-bar" role="progressbar" aria-label="Session progress" aria-valuemin="0"><span></span></div></div>
      <div id="fcx-stage"></div>
      <div class="sr-only" id="fcx-live" aria-live="polite" aria-atomic="true"></div>
    </div>`);
    B.app.render(html, { title: "Flashcard session", crumbs: CRUMBS });
    const stage = $("#fcx-stage", html), live = $("#fcx-live", html);
    const say = (msg) => { live.textContent = ""; setTimeout(() => { live.textContent = msg; }, 30); };
    let flipped = false, busy = false;
    $("#fcx-options", html).addEventListener("click", () => F().setPrefs({ scope: sess.scope === "course" ? null : sess.scope, includeNew: sess.includeNew }));
    $("#fcx-stop", html).addEventListener("click", () => {
      const left = sess.queue.length; F().stop(sess); setKeys(null);
      B.util.toast(left ? `Session saved with ${plural(left, "card")} left. Resume it from Flashcards.` : "Session saved.");
      location.hash = "#/flashcards";
    });
    function progress() {
      const done = sess.done.length, total = Math.max(sess.total, done + sess.queue.length);
      const bar = $("#fcx-bar", html); bar.setAttribute("aria-valuemax", total); bar.setAttribute("aria-valuenow", done); bar.setAttribute("aria-valuetext", `${done} of ${total} done`);
      bar.firstElementChild.style.width = (total ? Math.round((100 * done) / total) : 100) + "%";
      return { pos: done + 1, total };
    }
    function show(msg) {
      const k = F().head(sess, map);
      if (!k) return summary(sess.done.length ? F().summarise(sess) : null);
      flipped = false; busy = false;
      const item = sess.queue[0]; const st = B.store.get().cards[k.id]; const { pos, total } = progress();
      $("#fcx-pos", html).textContent = `Card ${pos} of ${total}`;
      const status = item.relearn ? ["Second look", "amber"] : !F().isReviewed(st) ? ["New card", "teal"] : st.due <= Date.now() ? ["Due for review", "sage"] : ["Extra practice", "navy"];
      const hint = (g) => (item.relearn ? "" : g === "unknown" ? "again soon, then 1 day" : "in " + days(F().preview(k.id, g)));
      const btn = (r, g, n) => h`<button class="btn fcx-r fcx-r-${r}" type="button" data-r="${r}" data-g="${g}"><span class="fcx-k" aria-hidden="true">${n}</span><span class="fcx-n">${F().LABEL[r]}</span>${raw(hint(g) ? h`<span class="fcx-t">${hint(g)}</span>` : "")}</button>`;
      stage.innerHTML = h`<div class="fcx-card-wrap">
        <div class="fcx-meta"><span class="badge ${status[1]}">${status[0]}</span><a href="#/topic/${k.ref}">${k.ref} ${F().titleOf(k.ref)}</a></div>
        <div class="fc fcx" id="fc" tabindex="0" role="button" aria-expanded="false" aria-describedby="fcx-hint">
          <div class="fcx-face fcx-front" id="fcx-front"><div class="lbl">Question</div><div class="txt">${k.front}</div></div>
          <div class="fcx-face fcx-back" id="fcx-back" aria-hidden="true"><div class="lbl">Answer</div><div class="txt">${k.back}</div></div>
        </div>
        <p class="tiny muted fcx-hint" id="fcx-hint">Answer in your head or on paper first. Press Space or Enter to show the answer.</p>
        <div class="fc-controls" id="flipwrap"><button class="btn primary" type="button" id="flip">Show answer</button></div>
        <div class="fcx-rate" id="grade" role="group" aria-labelledby="fcx-rate-q" hidden>
          <p class="fcx-rate-q" id="fcx-rate-q">How well did you remember it?${item.relearn ? raw(' <span class="tiny muted">(a second look: the rating is recorded and the schedule from your first rating stays)</span>') : ""}</p>
          <div class="fcx-rate-btns">${raw(btn("again", "unknown", 1) + btn("hard", "unsure", 2) + btn("good", "known", 3) + btn("easy", "easy", 4))}</div>
        </div></div>`;
      const fc = $("#fc", stage);
      fc.addEventListener("click", flip); $("#flip", stage).addEventListener("click", () => { flip(); fc.focus({ preventScroll: true }); });
      $$("#grade button", stage).forEach((b) => b.addEventListener("click", () => rateIt(b.dataset.r)));
      fc.focus({ preventScroll: true });
      say(`${msg ? msg + " " : ""}Card ${pos} of ${total}. ${status[0]}. Question: ${fc.querySelector(".fcx-front .txt").textContent}`);
    }
    function flip() {
      const fc = $("#fc", stage); if (!fc) return;
      flipped = !flipped; fc.classList.toggle("flipped", flipped); fc.setAttribute("aria-expanded", String(flipped));
      $("#fcx-back", stage).setAttribute("aria-hidden", String(!flipped)); $("#fcx-front", stage).setAttribute("aria-hidden", String(flipped));
      $("#grade", stage).hidden = false; $("#flipwrap", stage).hidden = true;
      $("#fcx-hint", stage).textContent = flipped ? "Rate how well you remembered: 1 Again, 2 Hard, 3 Good, 4 Easy. Space hides the answer." : "Press Space or Enter to show the answer.";
      if (flipped) say(`Answer: ${$("#fcx-back .txt", stage).textContent} Rate it: 1 Again, 2 Hard, 3 Good, 4 Easy.`);
    }
    function rateIt(r) {
      if (busy || $("#grade", stage).hidden) return; busy = true;
      const res = F().rate(sess, r, map);
      const msg = `Rated ${F().LABEL[r]}.${res.relearnAdded ? " You will see this card once more in this session." : ""}`;
      if (res.finished) return summary(res.summary);
      show(msg);
    }
    function summary(sum) {
      setKeys(null);
      $("#fcx-stop", html).hidden = true; $("#fcx-pos", html).textContent = "Session complete";
      const bar = $("#fcx-bar", html); bar.setAttribute("aria-valuenow", bar.getAttribute("aria-valuemax") || 0); bar.firstElementChild.style.width = "100%";
      if (!sum) { stage.innerHTML = '<div class="card"><div class="empty"><h2>No cards left in this session</h2><p><a href="#/flashcards">Back to flashcard sessions</a></p></div></div>'; return; }
      const n = sum.next;
      const nextHTML = n.kind === "check" ? h`<p class="small">${n.why}: <strong>${n.ref} ${n.title}</strong>. A short quick check is a good way to strengthen it.</p><a class="btn primary" href="${n.href}" id="fcx-next">Try the quick check for ${n.ref}</a>` : h`<p class="small">Everything you reviewed is now scheduled. Come back when more cards are due, or start another short session if you would like to.</p><a class="btn primary" href="#/flashcards" id="fcx-next">Back to flashcard sessions</a>`;
      stage.innerHTML = h`<section class="card fcx-summary" aria-labelledby="fcx-done">
        <h2 id="fcx-done" tabindex="-1">Session complete: ${plural(sum.reviewed, "card")} reviewed</h2>
        <ul class="fcx-counts">
          <li class="fcx-c-good"><span class="v">${sum.confident}</span> remembered confidently</li>
          <li class="fcx-c-hard"><span class="v">${sum.thought}</span> needed some thought</li>
          <li class="fcx-c-again"><span class="v">${sum.again}</span> ${sum.again === 1 ? "needs" : "need"} another review</li>
        </ul>
        <p class="small muted">Cards you found harder come back sooner and the ones you knew wait longer. Memory builds over several short sessions, so this is one useful step rather than a finish line.</p>
        <div class="fcx-next"><div class="eyebrow">Suggested next step</div>${raw(nextHTML)}</div>
        <div class="row mt"><a class="btn" href="#/flashcards">Flashcard sessions</a><a class="btn ghost" href="#/dashboard">Dashboard</a></div>
      </section>`;
      const hd = $("#fcx-done", stage); hd.focus({ preventScroll: true });
      say(`Session complete. ${sum.reviewed} reviewed: ${sum.confident} remembered confidently, ${sum.thought} needed some thought, ${sum.again} need another review.`);
    }
    setKeys((e) => {
      if (!document.body.contains(html)) { setKeys(null); return; }
      if (modalOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target; if (t && t.matches && t.matches("input,select,textarea,[contenteditable]")) return;
      if (!$("#fc", stage)) return;
      if (e.key === " " || e.key === "Spacebar" || (e.key === "Enter" && t && t.id === "fc")) {
        if (t && t.closest && t.closest("button,a") && t.id !== "fc") return; // let buttons and links do their own thing
        e.preventDefault(); flip(); return;
      }
      if (["1", "2", "3", "4"].includes(e.key) && !$("#grade", stage).hidden) { e.preventDefault(); rateIt(["again", "hard", "good", "easy"][+e.key - 1]); }
    });
    show(resumed ? "Session resumed." : "");
  }
})(window.BIO);
