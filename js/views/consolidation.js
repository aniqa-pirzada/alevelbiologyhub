// Topic consolidation page: #/consolidate/:tref  (e.g. #/consolidate/3.1.1)
// Overview (concept map + summary), combined flashcard deck, 45-mark assessment with diagnostic feedback.
// Assessment attempts are logged through the normal question engine (unique question ids tagged to subsections),
// so mastery per subsection updates automatically and nothing is double counted. A summary of each completed
// assessment run is kept in store.consolidation[tref] for the results history.
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  function pastSet(tref) { const s = (B.exampro || {})[tref]; if (!s) return ""; return B.util.h`<div class="card mt ex-embed"><div class="card-head"><h3>Past-paper questions <span class="muted small">(OxfordAQA, via Exampro)</span></h3><span class="badge navy">${s.count} questions · ${s.marks} marks</span></div><p class="small muted">Once the topic assessment is done, test yourself on the real thing: ${s.count} OxfordAQA questions tagged to this topic, with official mark schemes.</p><div class="row"><a class="btn primary" href="#/exam/past/${s.ref}/5">Timed set of 5</a><a class="btn" href="#/pastpapers/${s.ref}">Browse all</a></div></div>`; }
  const { h, raw, el, $, $$, icons, esc, fmtDateTime } = B.util;

  function findTopic(tref) { for (const u of B.spec.units) for (const t of u.topics) if (t.ref === tref) return { u, t }; return null; }
  function subTitle(ref) { for (const u of B.spec.units) for (const t of u.topics) for (const s of t.subsections) if (s.ref === ref) return s.title; return ref; }

  // Pure function (also unit-tested): turn per-question results into per-subsection diagnostics.
  function diagnose(results, cfg = { weakBelowPct: 70, strongAtPct: 85 }) {
    const by = {};
    for (const r of results) { const b = by[r.ref] || (by[r.ref] = { ref: r.ref, score: 0, max: 0, n: 0 }); b.score += r.score; b.max += r.max; b.n++; }
    const rows = Object.values(by).map((b) => ({ ...b, pct: b.max ? Math.round((100 * b.score) / b.max) : 0 })).sort((a, b) => a.pct - b.pct);
    const weak = rows.filter((r) => r.pct < cfg.weakBelowPct), strong = rows.filter((r) => r.pct >= cfg.strongAtPct);
    const total = rows.reduce((n, r) => n + r.score, 0), max = rows.reduce((n, r) => n + r.max, 0);
    return { rows, weak, strong, total, max, pct: max ? Math.round((100 * total) / max) : 0 };
  }
  B.consolidationDiagnose = diagnose;

  B.views.consolidation = function (tref, tab) {
    const hit = findTopic(tref); const c = (B.consolidation || {})[tref];
    if (!hit) return B.app.render("<div class='card'>Unknown topic.</div>");
    const { u, t } = hit;
    if (!c) return B.app.render(h`<div class="page-head"><div><div class="eyebrow">${u.short}</div><h1>${t.ref} ${t.title}: consolidation</h1></div></div><div class="card"><div class="empty">${raw(icons.book)}<h3>Not built yet</h3><p>The consolidation page for this topic will be added once all of its subsections have been authored and reviewed.</p><a class="btn" href="#/library/${u.ref}/${t.ref}">Back to the topic</a></div></div>`, { title: "Consolidation", crumbs: [{ label: "Library", href: "#/library" }, { label: u.short, href: `#/library/${u.ref}` }, { label: t.ref, href: `#/library/${u.ref}/${t.ref}` }, { label: "Consolidation" }] });
    const deck = B.flashcards.all("deck:" + tref);
    const st = B.store.get(); const history = (st.consolidation || {})[tref] || [];
    const qs = c.assessment.questions; const totalMarks = qs.reduce((n, q) => n + q.marks, 0);
    const html = el(h`<div>
      <div class="page-head"><div><div class="eyebrow">${u.short} · topic consolidation</div><h1>${t.ref} ${t.title}</h1><p class="lede">Pull the ${t.subsections.length === 1 ? "subsection" : ["", "", "two", "three", "four", "five"][t.subsections.length] + " subsections"} together: an overview of how they connect, a combined retrieval deck of ${deck.length} cards, and a ${totalMarks}-mark topic assessment that tells you which subsections to revisit.</p><div class="row">${raw(B.views.lib.statusBadge(c.status))}<span class="badge mono">${u.code}</span>${raw(Object.values(B.clusters || {}).filter((k) => (k.topics || []).includes(t.ref)).map((k) => `<a class="btn sm" href="#/cluster/${k.id}">Cross-topic revision: ${B.util.esc(k.topics.join(", "))}</a>`).join(""))}</div></div>
        <div class="row"><a class="btn" href="#/library/${u.ref}/${t.ref}">Subsections</a><a class="btn primary" href="#/flashcards/deck:${tref}">Combined deck (${deck.length})</a></div></div>
      <div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="overview">Topic summary</button><button role="tab" aria-selected="false" data-tab="assess">Topic assessment (${totalMarks} marks)</button><button role="tab" aria-selected="false" data-tab="results">Results &amp; diagnostics${history.length ? ` (${history.length})` : ""}</button></div>
      <div class="tabpanes">
        <div class="pane" data-pane="overview">
          <div class="card mb"><div class="card-head"><h3>Connections map</h3><span class="badge">click a box to open it</span></div><p class="small muted cmap-hint">On a narrow screen, scroll sideways inside the map.</p><div class="figure"><div class="fig-view cmap-scroll" tabindex="0" role="region" aria-label="Connections map (scrolls sideways on small screens)">${raw(c.conceptMap)}</div></div></div>
          <div class="card pad-l"><div class="notes">${raw(typeof c.summaryHTML === "function" ? c.summaryHTML() : c.summaryHTML)}</div></div>
        </div>
        <div class="pane" data-pane="assess" hidden>
          <div class="card mb"><div class="card-head"><h3>${c.assessment.title}</h3><span class="badge navy">${totalMarks} marks · about ${c.assessment.minutes} min</span></div>
            <p class="small muted">Original questions in the OxfordAQA style, drawn from ${({ 1: "the whole subsection", 2: "both subsections", 3: "all three subsections", 4: "all four subsections", 5: "all five subsections", 6: "all six subsections" })[t.subsections.length] || "every subsection"}: recall, structure interpretation, application, experimental interpretation, data analysis and an extended response. Objective questions are marked automatically; written answers are self-marked against the mark scheme. Every attempt is recorded and counts towards your subsection mastery. Finish all ${qs.length} questions to see your diagnostic report.</p>
            <div class="row"><div class="stat"><span class="v" id="ctimer">00:00</span><span class="l">elapsed · <button class="btn sm" id="ctstart">Start timer</button></span></div><div class="stat"><span class="v" id="cscore">0 / ${totalMarks}</span><span class="l" id="cdone">0 of ${qs.length} answered</span></div></div></div>
          <div id="cqs"></div>
          <div class="card mt" id="creport" hidden></div>
        </div>
        <div class="pane" data-pane="results" hidden><div id="chist"></div></div>
        ${raw(pastSet(t.ref))}
      </div>
    </div>`);
    B.app.render(html, { title: `${t.ref} consolidation`, crumbs: [{ label: "Library", href: "#/library" }, { label: u.short, href: `#/library/${u.ref}` }, { label: t.ref, href: `#/library/${u.ref}/${t.ref}` }, { label: "Consolidation" }] });
    // tabs
    const tabs = $$('[role="tab"]', html); const showTab = (name) => { tabs.forEach((x) => x.setAttribute("aria-selected", x.dataset.tab === name)); $$(".pane", html).forEach((p) => (p.hidden = p.dataset.pane !== name)); };
    tabs.forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
    if (tab === "assess" || tab === "results") showTab(tab);
    // assessment
    const results = {}; let answered = 0;
    const update = () => { const rs = Object.values(results); const d = diagnose(rs, c.diagnostics); $("#cscore", html).textContent = `${d.total} / ${totalMarks}`; $("#cdone", html).textContent = `${answered} of ${qs.length} answered`; if (answered === qs.length) finish(d); };
    qs.forEach((q) => $("#cqs", html).append(B.questions.render(q, { onAnswer: (res, rec) => { if (rec.retry) return; if (!results[q.id]) answered++; results[q.id] = { ref: q.ref, score: res.score, max: q.marks, qid: q.id, hinted: rec.hinted }; update(); } })));
    let t0 = null, iv = null; $("#ctstart", html).addEventListener("click", () => { if (iv) return; t0 = Date.now(); iv = setInterval(() => { if (!document.body.contains(html)) { clearInterval(iv); return; } const s = Math.floor((Date.now() - t0) / 1000); $("#ctimer", html).textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }, 1000); });
    function finish(d) {
      const rec = { ts: Date.now(), score: d.total, max: d.max, pct: d.pct, byRef: d.rows.map((r) => ({ ref: r.ref, score: r.score, max: r.max, pct: r.pct })), seconds: t0 ? Math.round((Date.now() - t0) / 1000) : null };
      B.store.logConsolidation(tref, rec);
      const rep = $("#creport", html); rep.hidden = false; rep.innerHTML = reportHTML(d, c, true); rep.scrollIntoView({ behavior: "smooth", block: "start" });
      renderHistory();
    }
    function reportHTML(d, cfg, fresh) {
      const grade = d.pct >= 85 ? ["Secure", "sage"] : d.pct >= 70 ? ["Developing well", "teal"] : d.pct >= 50 ? ["Partly secure", "amber"] : ["Needs work", "rose"];
      const rows = d.rows.map((r) => h`<tr><td><a href="#/topic/${r.ref}">${r.ref} ${subTitle(r.ref)}</a></td><td>${r.score} / ${r.max}</td><td><div class="progress" style="min-width:120px"><span style="width:${r.pct}%;background:${r.pct < cfg.diagnostics.weakBelowPct ? "var(--rose)" : r.pct >= cfg.diagnostics.strongAtPct ? "var(--sage)" : "var(--teal)"}"></span></div></td><td>${r.pct}%</td></tr>`).join("");
      const recs = d.weak.length ? d.weak.map((r) => h`<li><strong><a href="#/topic/${r.ref}">${r.ref} ${subTitle(r.ref)}</a></strong> (${r.pct}%): re-read the notes and work through the quick check, then do the <a href="#/flashcards/${r.ref}">flashcards for ${r.ref}</a> and retry the practice questions. ${raw(r.pct < 40 ? "Start with the notes and diagrams before attempting questions again." : "Focus on the mark-scheme points you missed.")}</li>`).join("") : "<li>No subsection fell below the threshold. Use the combined deck for spaced review and retake this assessment in a week to check retention.</li>";
      return h`<div class="card-head"><h3>Diagnostic report</h3><span class="badge ${grade[1]}">${grade[0]} · ${d.total} / ${d.max} (${d.pct}%)</span></div>
        ${fresh ? raw('<p class="small muted">Based on this attempt only. Your overall mastery on the Progress page combines the latest attempt at every question you have answered.</p>') : ""}
        <table><thead><tr><th>Subsection</th><th>Marks</th><th></th><th>%</th></tr></thead><tbody>${raw(rows)}</tbody></table>
        <h4 class="mt">Recommended next steps</h4><ul>${raw(recs)}</ul>
        ${d.strong.length ? raw(h`<p class="small"><strong>Secure:</strong> ${d.strong.map((r) => r.ref).join(", ")}. Keep these ticking over with the combined deck.</p>`) : ""}
        <p class="tiny muted">Weak = below ${cfg.diagnostics.weakBelowPct}% on this subsection's questions in this attempt; secure = ${cfg.diagnostics.strongAtPct}% or above. Short and extended answers were self-marked.</p>`;
    }
    function renderHistory() {
      const hist = ((B.store.get().consolidation || {})[tref] || []).slice().reverse();
      const box = $("#chist", html);
      if (!hist.length) { box.innerHTML = `<div class="card"><div class="empty">${icons.progress}<h3>No completed assessments yet</h3><p>Finish all ${qs.length} questions of the topic assessment to get a diagnostic report. Each completed run is kept here so you can see whether your weak subsections improve.</p></div></div>`; return; }
      box.innerHTML = hist.map((r, i) => `<div class="card mb"><div class="card-head"><h3>Attempt ${hist.length - i} · ${esc(fmtDateTime(r.ts))}</h3><span class="badge navy">${r.score} / ${r.max} (${r.pct}%)${r.seconds ? ` · ${Math.round(r.seconds / 60)} min` : ""}</span></div>${reportHTML({ rows: r.byRef, weak: r.byRef.filter((x) => x.pct < c.diagnostics.weakBelowPct), strong: r.byRef.filter((x) => x.pct >= c.diagnostics.strongAtPct), total: r.score, max: r.max, pct: r.pct }, c, false)}</div>`).join("");
      $('[data-tab="results"]', html).textContent = `Results & diagnostics (${hist.length})`;
    }
    renderHistory();
  };
})(window.BIO);
