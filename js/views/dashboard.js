window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, fmtDate, esc } = B.util;
  // Decorative line art for the hero: a cell with a nucleus and a DNA strand, drawn in with a stroke animation.
  // Hero (Theme C, 2026-11-05): light microscope with cells on the slide, a magnified view and a DNA double helix.
  // Colours come from theme tokens so the drawing follows light and dark mode; motion stops with reduced motion.
  const hero = `<svg class="hero-art" viewBox="0 0 400 270" width="400" role="img" aria-label="Illustration: a light microscope with cells on a slide, a magnified view of the cells, and a DNA double helix" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="132" cy="122" r="104" style="fill:var(--surface-3)" opacity=".7"/>
    <g style="stroke:var(--teal)" stroke-width="2.2">
      <rect class="stroke-in" x="56" y="232" width="150" height="16" rx="8" style="fill:var(--surface)"/>
      <path class="stroke-in" d="M168 232c22-30 24-82 2-118" stroke-width="10"/>
      <path d="M168 232c22-30 24-82 2-118" style="stroke:var(--surface)" stroke-width="5.5"/>
      <circle class="stroke-in d2" cx="184" cy="176" r="10" style="fill:var(--surface)"/>
      <rect class="stroke-in d2" x="70" y="168" width="104" height="9" rx="3" style="fill:var(--surface)"/>
      <path class="stroke-in" d="M120 200v26"/>
      <rect class="stroke-in d2" x="111" y="132" width="18" height="22" rx="3" style="fill:var(--surface)"/>
      <path class="stroke-in" d="M112 132l26-62" stroke-width="20"/>
      <path d="M112 132l26-62" style="stroke:var(--surface)" stroke-width="15"/>
      <rect class="stroke-in d3" x="129" y="46" width="22" height="22" rx="3" transform="rotate(23 140 57)" style="fill:var(--surface)"/>
      <path class="stroke-in d3" d="M152 112h18"/>
    </g>
    <rect x="114" y="154" width="12" height="7" rx="1.5" style="fill:var(--teal)"/>
    <rect x="92" y="161" width="58" height="7" rx="1.5" style="fill:var(--paper);stroke:var(--line-strong)" stroke-width="1"/>
    <g style="fill:var(--mint);stroke:var(--sage)" stroke-width="1"><circle cx="110" cy="164.5" r="2.6"/><circle cx="121" cy="164.5" r="2.6"/><circle cx="132" cy="164.5" r="2.6"/></g>
    <ellipse class="lamp-glow" cx="120" cy="196" rx="16" ry="6" style="fill:var(--amber)"/>
    <ellipse cx="120" cy="198" rx="11" ry="4" style="fill:var(--amber)"/>
    <g style="stroke:var(--amber)" stroke-width="1.6" opacity=".7"><path d="M120 186v-8"/><path d="M112 186l-4-7M128 186l4-7"/></g>
    <circle class="stroke-in d3" cx="62" cy="76" r="30" style="fill:var(--paper);stroke:var(--sage)" stroke-width="2"/>
    <path d="M84 96l26 32" style="stroke:var(--sage)" stroke-width="1.4" stroke-dasharray="3 4"/>
    <g class="mag-cells">
      <g style="stroke:var(--sage)" stroke-width="1.4"><path d="M38 66l14-8 16 4 4 14-12 10-16-2z"/><path d="M68 62l16 2 6 14-10 10"/><path d="M50 86l10 12 16-2"/></g>
      <g style="fill:var(--amber)"><circle cx="54" cy="72" r="3.2"/><circle cx="78" cy="76" r="3"/><circle cx="62" cy="94" r="2.6"/></g>
    </g>
    <g class="dna">
      <g stroke-width="3"><path class="stroke-in d2" d="M300 22Q336 44 300 66T300 110T300 154T300 198T300 242" style="stroke:var(--teal)"/><path class="stroke-in d2" d="M300 22Q264 44 300 66T300 110T300 154T300 198T300 242" style="stroke:var(--sage)"/></g>
      <g stroke-width="3.4">
        <g class="rung"><path d="M283 44h17" stroke="#b0802f"/><path d="M300 44h17" stroke="#5a8fa8"/></g>
        <g class="rung"><path d="M283 88h17" stroke="#5a8fa8"/><path d="M300 88h17" stroke="#b0802f"/></g>
        <g class="rung"><path d="M283 132h17" stroke="#c46b4f"/><path d="M300 132h17" stroke="#3f8f6f"/></g>
        <g class="rung"><path d="M283 176h17" stroke="#b0802f"/><path d="M300 176h17" stroke="#5a8fa8"/></g>
        <g class="rung"><path d="M283 220h17" stroke="#3f8f6f"/><path d="M300 220h17" stroke="#c46b4f"/></g>
      </g>
    </g>
    <g style="stroke:var(--line-strong)" stroke-width="1"><path d="M364 40h14M371 33v14"/><path d="M352 232h12M358 226v12"/><path d="M226 30h10M231 25v10"/></g>
  </svg>`;
  const ring = (val, max, label) => { const r = 48, c = 2 * Math.PI * r, pct = Math.min(1, max ? val / max : 0); return `<div class="ring" role="img" aria-label="${val} of ${max} ${label}"><svg viewBox="0 0 112 112"><circle class="track" cx="56" cy="56" r="${r}" fill="none" stroke-width="9"/><circle class="bar" cx="56" cy="56" r="${r}" fill="none" stroke-width="9" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg><div class="centre"><span class="v">${val}</span><span class="l">of ${max}</span></div></div>`; };
  const timeGreeting = () => { const hr = new Date().getHours(); return hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening"; };
  const countUp = (root) => { if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion")) return; $$(".count", root).forEach((el) => { const target = parseFloat(el.dataset.v); if (isNaN(target)) return; const suffix = el.dataset.suffix || ""; const t0 = performance.now(); const dur = 900; const step = (t) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(target * e) + suffix; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); };

  B.views.dashboard = function () {
    const s = B.store.get(); const P = B.progress;
    const cov = P.coverage(); const mas = P.mastery(); const ret = P.retention(); const streak = P.streak();
    const due = B.flashcards.dueCards(B.flashcards.all()).length;
    const recent = s.attempts.slice(-5).reverse();
    const recs = P.recommendations(4);
    const openMistakes = Object.values(s.mistakes).filter((m) => !m.resolved).length;
    const authored = Object.values(B.content || {}).filter((c) => c.status !== "not_started").length;
    const name = s.prefs.name ? ", " + esc(s.prefs.name) : "";
    const noData = !s.attempts.length && !Object.keys(s.coverage).length;
    const todayKey = B.util.dayKey(); const todayActions = (s.activity[todayKey] || { actions: 0 }).actions; const goal = s.prefs.dailyGoal || 10;
    const lastVisited = Object.entries(s.coverage).filter(([, c]) => c.visited).sort((x, y) => y[1].visited - x[1].visited)[0];
    const lastRef = lastVisited ? lastVisited[0] : null; const lastTitle = lastRef ? (B.views.lib.findSub(lastRef) || { s: { title: "" } }).s.title : "";
    const unitRow = (u) => { const c = P.coverage((x) => x.unit === u.ref); const m = P.mastery((a) => a.ref.startsWith(u.ref + ".")); return h`<div class="u"><span>${u.ref} ${u.short}</span><span class="small muted">${c.completed}/${c.total} done${m.pct != null ? raw(` · ${m.pct}% mastery`) : ""}</span><div class="progress"><span style="width:${c.pct}%"></span></div></div>`; };
    const journey = (title, sub, units, href) => h`<div class="card"><div class="eyebrow">${sub}</div><h3>${title}</h3><div class="units">${raw(units.map(unitRow).join(""))}</div><a class="btn primary" href="${href}">${lastRef && units.some((u) => lastRef.startsWith(u.ref + ".")) ? "Continue " + lastRef : "Start here"}</a></div>`;
    const AS = B.spec.units.filter((u) => u.level === "AS"), A2 = B.spec.units.filter((u) => u.level === "A2");
    const html = h`
      <div class="hero mb"><div><div class="eyebrow">OxfordAQA 9610 · ${s.prefs.level === "A2" ? "A-level (Units 1–5)" : "AS (Units 1–2)"}</div><h1>${timeGreeting()}${raw(name)}</h1>
        <p class="lede">Understand more. One subsection at a time. Everything you do here is saved privately in this browser.</p>
        <div class="row"><a class="btn primary" href="${lastRef ? "#/topic/" + lastRef : "#/library"}">${lastRef ? "Continue " + lastRef : "Open the Revision Library"}</a><a class="btn" href="#/flashcards">Review flashcards${due ? ` (${due} due)` : ""}</a><button class="btn ghost" id="set-name">${s.prefs.name ? "Change name / level" : "Set your name and level"}</button></div></div>${raw(hero)}</div>

      ${noData ? raw(h`<div class="notice sage mb"><strong>Nothing recorded yet.</strong> Good places to start: read <a href="#/topic/3.1.1.1">3.1.1.1 Monomers and polymers</a>, then try its quick retrieval check, or run <a href="#/lab/1">Required practical 1</a> in the virtual lab.</div>`) : ""}

      <div class="journey mb">
        ${raw(journey("AS: The diversity of living organisms and Biological systems and disease", "Year 12 · BL01 and BL02", AS, lastRef && AS.some((u) => lastRef.startsWith(u.ref + ".")) ? "#/topic/" + lastRef : "#/library/3.1"))}
        ${raw(journey("A2: Populations and genes, Control, and the synoptic paper", "Year 13 · BL03, BL04 and BL05", A2, lastRef && A2.some((u) => lastRef.startsWith(u.ref + ".")) ? "#/topic/" + lastRef : "#/library/3.3"))}
      </div>

      <div class="grid grid-2 mb">
        <div class="card"><div class="today">${raw(ring(todayActions, goal, "actions today"))}<div><div class="eyebrow">Today</div><p class="small" style="margin:.2rem 0">${todayActions >= goal ? "Daily goal reached. Anything more is a bonus." : `${goal - todayActions} more question${goal - todayActions === 1 ? "" : "s"}, flashcards or pages to reach today's goal.`}</p><p class="tiny muted">Missed days are never penalised. Goal: ${goal} actions a day (<button class="btn sm ghost" id="set-goal" style="padding:0 .3rem">change</button>).</p></div></div></div>
        <div class="card"><div class="grid grid-4" style="gap:.6rem"><div class="stat"><span class="v count" data-v="${cov.pct}" data-suffix="%">${cov.pct}%</span><span class="l">coverage</span></div><div class="stat"><span class="v">${mas.pct == null ? "–" : raw(`<span class="count" data-v="${mas.pct}" data-suffix="%">${mas.pct}%</span>`)}</span><span class="l">mastery</span></div><div class="stat"><span class="v">${ret.pct == null ? "–" : raw(`<span class="count" data-v="${ret.pct}" data-suffix="%">${ret.pct}%</span>`)}</span><span class="l">retention</span></div><div class="stat"><span class="v count" data-v="${streak}">${streak}</span><span class="l">day streak</span></div></div><p class="tiny muted mt">${cov.completed} of ${cov.total} subsections complete · ${mas.questions} distinct question${mas.questions === 1 ? "" : "s"} · ${due} flashcards due · ${openMistakes} open mistakes</p></div>
      </div>

      <div class="grid grid-2">
        <div class="card"><div class="card-head"><h3>Recommended next</h3><a class="small" href="#/progress">Why?</a></div>
          ${recs.length ? raw(recs.map((r) => h`<a class="tile mb" href="#/topic/${r.ref}" style="margin-bottom:.6rem"><span class="ref">${r.ref}</span><h3>${r.title}</h3><div class="meta">${r.why.join(" · ")}</div></a>`).join("")) : raw(`<div class="empty">${icons.seed}<h3>No recommendations yet</h3><p>Study a topic and answer some questions; recommendations are built from your mastery, mistakes and flashcard review intervals.</p></div>`)}
          ${(() => { const due = B.store.dueRevisits ? B.store.dueRevisits() : []; return due.length ? raw(h`<div class="mt"><h4 style="margin:.2rem 0 .4rem">Revisits due (${due.length})</h4>${raw(due.slice(0, 3).map((r) => h`<a class="tile mb" href="#/topic/${r.ref}" style="margin-bottom:.5rem"><span class="ref">${r.ref}</span><div class="meta">${r.reason || "Scheduled revisit"}</div></a>`).join(""))}<a class="small" href="#/unit/3.1">All revisits in the Unit 1 Revision Centre</a></div>`) : ""; })()}
        </div>
        <div class="card"><div class="card-head"><h3>Recent activity</h3><a class="small" href="#/progress">Full history</a></div>
          ${recent.length ? raw(`<table><tr><th>When</th><th>Spec</th><th>Type</th><th>Score</th></tr>${recent.map((a) => h`<tr><td>${B.util.fmtDateTime(a.ts)}</td><td><a href="#/topic/${a.ref}/check/${a.qid}">${a.ref}</a></td><td>${B.questions.labelFor(a.type)}</td><td>${a.score}/${a.max}${a.retry ? " (retry)" : a.hinted ? " (hint)" : ""}</td></tr>`).join("")}</table>`) : raw(`<div class="empty">${icons.exam}<h3>No attempts yet</h3><p>Your question attempts will appear here with their scores. Retakes are kept as separate attempts.</p></div>`)}
        </div>
      </div>

      <div class="card mt"><div class="card-head"><h3>Content available now</h3><span class="badge">${authored} authored subsections · ${Object.values(B.practicals).filter((p) => p.status !== "not_started").length} practical${Object.values(B.practicals).filter((p) => p.status !== "not_started").length === 1 ? "" : "s"}</span></div>
        <p class="small muted">The platform is being built unit by unit. Subsections without authored notes still show their full specification requirements and can be ticked off in the checklist, but have no notes, diagrams or questions yet. See the <a href="#/library">library</a> for status badges.</p>
      </div>`;
    B.app.render(html, { title: "Dashboard" });
    countUp($("#content"));
    $("#set-goal").addEventListener("click", () => { const g = parseInt(prompt("Daily goal (questions, flashcards and pages per day):", String(goal)) || goal, 10); if (g > 0) { s.prefs.dailyGoal = Math.min(100, g); B.store.save(); B.views.dashboard(); } });
    $("#set-name").addEventListener("click", () => {
      const name = prompt("Your first name (optional, stored only in this browser):", s.prefs.name || "") ?? s.prefs.name;
      const level = (prompt("Are you studying AS or A2 this year? Type AS or A2:", s.prefs.level) || s.prefs.level).toUpperCase();
      s.prefs.name = name.trim().slice(0, 40); s.prefs.level = level === "A2" ? "A2" : "AS"; B.store.save(); B.views.dashboard();
    });
  };

  B.views.about = function () {
    const m = B.spec.meta;
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">About</div><h1>About this platform, privacy and your data</h1></div></div>
      <div class="stack">
      <div class="card"><h3>What this is</h3><p>An independent revision platform for Year 12 and 13 students of OxfordAQA International AS and A-level Biology (9610), specification version ${m.specVersion} (${m.validFrom}), created by Aniqa Pirzada. ${m.disclaimer}</p>
      <p>Official documents: <a href="${m.specPdfUrl}" target="_blank" rel="noopener">specification PDF</a> · <a href="${m.specPdfAltUrl}" target="_blank" rel="noopener">alternative link (oxfordaqa.com, v5.1)</a> · <a href="${m.sourceUrl}" target="_blank" rel="noopener">qualification page</a>.</p></div>
      <div class="card"><h3>How questions and flashcards are scored</h3><p class="small">Objective questions: a wrong first attempt gets a "try again" without the answer; the answer and explanation appear after the second attempt or when you get it right. Both attempts are recorded; the immediate retry does not count towards mastery, so mastery reflects what you knew first time. Written answers are self-marked against the mark scheme.</p><p class="small">Flashcards use a transparent SM-2 schedule: Known: 1 day, then 3 days, then the previous interval × ease (ease starts at 2.5). Unsure: interval × 1.2. Not known: back to 1 day with ease reduced. Every review is timestamped so retention can be measured on the Progress page.</p></div>
      <div class="card"><h3>Image credits</h3>${raw((() => { const av = Object.entries(B.images.slots).filter(([k, v]) => v.status === "available"); return av.length ? "<ul class='small'>" + av.map(([k, v]) => h`<li><strong>${v.alt || k}</strong>: ${v.credit || ""}${v.licence ? " (" + v.licence + ")" : ""}${v.page ? raw(h` · <a href="${v.page}" target="_blank" rel="noopener">source</a>`) : ""}</li>`).join("") + "</ul><p class='tiny muted'>Photographs were resized for the web; no other changes were made. All diagrams and animations are original.</p>" : "<p class='small muted'>No third-party photographs are included in this build. All diagrams are original.</p>"; })())}</div>
      <div class="card"><h3>Privacy</h3><p>No account is needed and nothing is sent to a server. Your progress, scores, flashcard history, planner and preferences are stored in this browser's local storage under the key <code>${B.store.KEY}</code>. Clearing site data in your browser deletes it. Progress does not synchronise between devices: use Export and Import below to move it.</p><p>No analytics, cookies or third-party tracking are used.</p></div>
      <div class="card"><h3>Your data</h3><div class="row"><button class="btn" id="exp">Export progress (JSON)</button><label class="btn">Import progress <input type="file" id="imp" accept="application/json" hidden></label><button class="btn danger" id="reset">Reset all progress</button></div><p class="small muted mt">Import validates the file structure before replacing your current data. Export files can be shared with your teacher for moderation of self-marked answers.</p></div>
      <div class="card"><h3>Accessibility</h3><p>All interactions work with a keyboard; sequencing and labelling tasks use buttons and selects rather than drag-and-drop; animations respect the system "reduce motion" setting; diagrams carry text descriptions.</p></div>
      </div>`, { title: "About", crumbs: [{ label: "About" }] });
    $("#exp").addEventListener("click", () => B.store.exportJSON());
    $("#imp").addEventListener("change", async (e) => { const f = e.target.files[0]; if (!f) return; const r = await B.store.importJSON(f); B.util.toast(r.ok ? "Progress imported." : "Import failed: " + r.errors.join("; ")); if (r.ok) B.views.about(); });
    $("#reset").addEventListener("click", () => { if (confirm("This permanently deletes all progress stored in this browser. Export first if you want a backup. Continue?")) { B.store.reset(); B.util.toast("Progress reset."); location.hash = "#/dashboard"; } });
  };
})(window.BIO);
