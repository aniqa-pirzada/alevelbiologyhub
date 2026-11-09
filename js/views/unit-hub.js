// Unit Revision Centre (Batch 9, owned by the Revision Centre author). Routes: #/unit/:u (overview, the unit mastery
// dashboard) and #/unit/:u/test (customised retrieval tests). Generic for any unit ref; built and checked with "3.1".
//
// Pure functions (no DOM; unit-testable): B.unitHub = { pool, difficulty, filter, pickByMarks, build, incorrectIds }.
//
// POOL      every original question on the site whose ref lies in the unit: subsection pages (quick check, practice
//           questions, interactive-level banks and interactive item banks, Biology in Focus), topic consolidation
//           assessments and the required-practical pages (questions, planQuestions, evalQuestions, assessment). Practice
//           papers (B.papers) are deliberately excluded so that they stay unseen, and so are B.practicalAlts (duplicates
//           of the same practical in another version). Ids are de-duplicated (first source wins).
// DIFFICULTY (deterministic, from question type and marks only; DIFFICULTY_RULE below is shown on the page):
//           objective = mcq, gap, match, sequence, label; written = short, extended.
//           Recall   = objective, 1-2 marks.
//           Standard = objective, 3+ marks; or short written answer, 1-3 marks.
//           Extended = short written answer, 4+ marks; or any extended response.
// TARGET MARKS: 0/1 subset-sum by dynamic programming over the candidates in a shuffled order (the shuffle uses the rng
//           passed in). The total chosen is the largest achievable total that does not exceed the target (an exact
//           optimum, so it is the same whatever the shuffle); among the subsets reaching that total, the one found first
//           in the shuffled order is used, so repeated draws give different questions.
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, esc, fmtDate, dayKey } = B.util;

  // ---------------------------------------------------------------- pure layer
  const OBJECTIVE = ["mcq", "gap", "match", "sequence", "label"];
  const TYPES = ["mcq", "gap", "match", "sequence", "label", "short", "extended"];
  const DIFFS = ["recall", "standard", "extended"];
  const DIFF_LABEL = { recall: "Recall", standard: "Standard", extended: "Extended" };
  const SOURCES = { page: "Subsection pages", interactive: "Interactives", focus: "Biology in Focus", consolidation: "Topic assessments", practical: "Required practicals" };
  const DIFFICULTY_RULE = [
    ["Recall", "objective items (multiple choice, gap fill, matching, sequencing, diagram labelling) worth 1–2 marks"],
    ["Standard", "objective items worth 3 or more marks, and written exam-style answers worth 1–3 marks"],
    ["Extended", "written exam-style answers worth 4 or more marks, and every extended-writing response"],
  ];

  function difficulty(q) {
    const m = +q.marks || 0;
    if (q.type === "extended") return "extended";
    if (q.type === "short") return m >= 4 ? "extended" : "standard";
    return m <= 2 ? "recall" : "standard"; // objective types (and any other auto-marked type) by marks
  }

  function unitOf(u) { return (B.spec.units || []).find((x) => x.ref === u) || null; }
  function subIndex(unit) { const m = {}; let i = 0; for (const t of unit.topics) for (const s of t.subsections) m[s.ref] = { topic: t.ref, order: i++ }; return m; }
  function paperIds() { const ids = new Set(); for (const p of Object.values(B.papers || {})) for (const q of p.questions || []) for (const part of q.parts || []) if (part.id) ids.add(part.id); return ids; }

  function pool(u) {
    const unit = unitOf(u); if (!unit) return [];
    const idx = subIndex(unit); const exclude = paperIds(); const seen = new Set(); const out = [];
    const add = (q, source, where, ctx) => {
      if (!q || !q.id || seen.has(q.id) || exclude.has(q.id) || !idx[q.ref] || !(q.marks > 0) || !TYPES.includes(q.type)) return;
      seen.add(q.id);
      out.push({ id: q.id, q, ref: q.ref, topic: idx[q.ref].topic, order: idx[q.ref].order, type: q.type, marks: +q.marks, difficulty: difficulty(q), source, where, ctx: ctx || null });
    };
    for (const [ref, c] of Object.entries(B.content || {})) {
      if (!c || c.status === "not_started") continue;
      (c.quickCheck || []).forEach((q) => add(q, "page", `${ref} quick retrieval check`));
      (c.questions || []).forEach((q) => add(q, "page", `${ref} practice questions`));
      for (const it of [...(c.interactive ? [c.interactive] : []), ...(c.interactives || [])]) {
        const title = it.title || it.kind; const base = { ref, title, kind: it.kind };
        const data = [...(it.datasets || []), ...(it.cards || [])];
        (it.questions || []).forEach((q) => add(q, "interactive", `${ref} interactive: ${title}`, data.length ? { ...base, type: "data", blocks: data } : { ...base, type: "interactive" }));
        (it.items || []).forEach((x) => (x.questions || []).forEach((q) => add(q, "interactive", `${ref} interactive: ${title}${x.label ? " (" + x.label + ")" : ""}`, x.graph ? { ...base, type: "graph", graph: x.graph, label: x.label } : { ...base, type: "interactive", label: x.label })));
      }
      (c.focus || []).forEach((f) => f && f.question && add(f.question, "focus", `${ref} Biology in Focus: ${f.title || ""}`, { type: "focus", ref, focus: f }));
    }
    for (const [t, c] of Object.entries(B.consolidation || {})) ((c && c.assessment && c.assessment.questions) || []).forEach((q) => add(q, "consolidation", `${t} topic assessment`));
    for (const [n, p] of Object.entries(B.practicals || {})) {
      if (!p || p.status === "not_started") continue;
      const ctx = { type: "practical", n };
      (p.questions || []).forEach((q) => add(q, "practical", `Required practical ${n}: questions`, ctx));
      (p.planQuestions || []).forEach((q) => add(q, "practical", `Required practical ${n}: planning`, ctx));
      (p.evalQuestions || []).forEach((q) => add(q, "practical", `Required practical ${n}: evaluation`, ctx));
      const aq = (p.assessment && p.assessment.questions) || [];
      aq.forEach((q, i) => { const refd = [...String(q.stem).matchAll(/question (\d+)/gi)].map((m) => +m[1]).filter((k) => k >= 1 && k <= aq.length && k !== i + 1);
        add(q, "practical", `Required practical ${n}: practical assessment, question ${i + 1}`, { type: "practical", n, prior: refd.map((k) => ({ num: k, stem: aq[k - 1].stem })) }); });
    }
    return out.sort((a, b) => a.order - b.order);
  }

  // Questions whose latest attempt scored below the maximum, or which have an unresolved mistake-bank entry.
  function incorrectIds(state) {
    const st = state || B.store.get(); const latest = {};
    for (const a of st.attempts || []) if (!latest[a.qid] || latest[a.qid].ts <= a.ts) latest[a.qid] = a;
    const ids = new Set(Object.values(latest).filter((a) => a.score < a.max).map((a) => a.qid));
    for (const m of Object.values(st.mistakes || {})) if (m && !m.resolved && m.qid) ids.add(m.qid);
    return ids;
  }

  const asSet = (v) => (v instanceof Set ? v : new Set(v || []));
  function filter(list, opts = {}) {
    const diffs = asSet(opts.difficulty), types = asSet(opts.types), sources = asSet(opts.sources);
    const wrong = opts.incorrect ? asSet(opts.incorrectIds) : null;
    return list.filter((e) => (!opts.topic || e.topic === opts.topic) && (!opts.sub || e.ref === opts.sub) && (!diffs.size || diffs.has(e.difficulty)) && (!types.size || types.has(e.type)) && (!sources.size || sources.has(e.source)) && (!wrong || wrong.has(e.id)));
  }

  function shuffleWith(arr, rng) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const marksOf = (x) => Math.max(0, Math.round(+((x && x.marks) != null ? x.marks : (x && x.q && x.q.marks)) || 0));

  function pickByMarks(list, target, rng = Math.random) {
    const T = Math.max(0, Math.floor(+target || 0)); if (!T || !list.length) return [];
    const items = shuffleWith(list, rng).filter((x) => marksOf(x) > 0 && marksOf(x) <= T);
    const by = new Int32Array(T + 1).fill(-1); by[0] = items.length; // by[s] = index of the item that first made total s reachable
    items.forEach((x, i) => { const m = marksOf(x); for (let s = T; s >= m; s--) if (by[s] === -1 && by[s - m] !== -1 && (s - m === 0 || by[s - m] < i)) by[s] = i; });
    let s = T; while (s > 0 && by[s] === -1) s--;
    const chosen = []; while (s > 0) { const i = by[s]; chosen.push(items[i]); s -= marksOf(items[i]); }
    return chosen.reverse();
  }

  function build(u, opts = {}, rng = Math.random) {
    const all = pool(u); const o = Object.assign({}, opts);
    if (o.incorrect && !o.incorrectIds) o.incorrectIds = incorrectIds();
    const matches = filter(all, o);
    const mode = o.mode === "marks" ? "marks" : "count";
    let items = mode === "marks" ? pickByMarks(matches, o.target, rng) : shuffleWith(matches, rng).slice(0, Math.max(1, Math.floor(+o.count || 10)));
    if (o.order === "spec") items = items.slice().sort((a, b) => a.order - b.order);
    return { items, marks: items.reduce((n, x) => n + x.marks, 0), poolSize: matches.length, poolMarks: matches.reduce((n, x) => n + x.marks, 0), target: mode === "marks" ? Math.floor(+o.target || 0) : null, mode };
  }

  B.unitHub = { pool, difficulty, filter, pickByMarks, build, incorrectIds, DIFFICULTY_RULE };

  // ---------------------------------------------------------------- view helpers
  const authored = (ref) => !!(B.content && B.content[ref] && B.content[ref].status !== "not_started");
  const unitName = (unit) => unit.title.split(":")[0];
  const masteryText = (m) => (!m.questions ? "no attempts yet" : !m.sufficient ? `not enough evidence (${m.questions} of 3 questions)` : `${m.pct}% mastery`);
  const masteryBadge = (m) => { if (!m.questions) return h`<span class="badge">no attempts</span>`; if (!m.sufficient) return h`<span class="badge rose" title="Mastery needs at least 3 different questions">not enough evidence</span>`; const c = m.pct >= 85 ? "sage" : m.pct >= 70 ? "teal" : m.pct >= 50 ? "amber" : "rose"; return h`<span class="badge ${c}">${m.pct}% mastery</span>`; };
  const weekStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const shortDate = (ts) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  // Statement ids such as "3.1.10.2.s1" compared part by part as numbers, so 3.1.3 comes before 3.1.10.
  const idCmp = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
  // Weak = below the paper runner's threshold (B.papersLib.WEAK_BELOW, 50 %), the same rule as the score report and
  // Exam Review. 50-69 % is shown separately as "needs consolidation".
  const weakBelow = () => (B.papersLib && B.papersLib.WEAK_BELOW) || 50;
  const CONSOLIDATE_BELOW = 70;
  const stmtTitle = (id) => { for (const u of B.spec.units) for (const t of u.topics) for (const s of t.subsections) for (const x of s.statements) if (x.id === id) return { ref: s.ref, text: x.text }; return null; };

  function tabsNav(u, tab) {
    const t = (key, href, label) => h`<a href="${href}" class="${tab === key ? "on" : ""}" ${raw(tab === key ? 'aria-current="page"' : "")}>${label}</a>`;
    return h`<nav class="uh-tabs" aria-label="Revision Centre sections">${raw(t("overview", `#/unit/${u}`, "Overview and mastery"))}${raw(t("test", `#/unit/${u}/test`, "Custom retrieval test"))}<a href="#/unit/${u}/map">Concept map</a></nav>`;
  }

  // Horizontal bar chart (hand-built SVG) of topic mastery; a table alternative accompanies it.
  function masteryChart(rows) {
    const W = 400, rowH = 28, top = 8, labW = 52, barW = 250, H = top + rows.length * rowH + 26;
    const X = (p) => labW + (barW * p) / 100;
    let s = `<svg class="uh-chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="uh-mc-t" focusable="false"><title id="uh-mc-t">Mastery by topic: ${esc(rows.map((r) => `${r.ref} ${r.m.sufficient ? r.m.pct + "%" : "not enough evidence"}`).join("; "))}</title>`;
    for (const g of [0, 50, 70, 85, 100]) s += `<line x1="${X(g)}" x2="${X(g)}" y1="${top - 2}" y2="${top + rows.length * rowH}" stroke="${g === 70 ? "#b9c9c4" : "#e3ecea"}" ${g === 70 ? 'stroke-dasharray="3 3"' : ""}/><text x="${X(g)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#6b7d8f">${g}%</text>`;
    rows.forEach((r, i) => {
      const y = top + i * rowH; const cy = y + rowH / 2;
      s += `<text x="0" y="${cy + 4}" font-size="12" font-family="ui-monospace, Menlo, monospace" font-weight="600" fill="#166f70">${esc(r.ref)}</text>`;
      if (r.m.sufficient) { const w = Math.max(2, X(r.m.pct) - labW); s += `<rect x="${labW}" y="${y + 6}" width="${w}" height="${rowH - 12}" rx="4" fill="#1f8a8a"/><text x="${labW + w + 5}" y="${cy + 4}" font-size="11.5" font-weight="600" fill="#16263a">${r.m.pct}%</text>`; }
      else s += `<rect x="${labW}" y="${y + 6}" width="${barW}" height="${rowH - 12}" rx="4" fill="none" stroke="#d9e3e0" stroke-dasharray="4 3"/><text x="${labW + 8}" y="${cy + 4}" font-size="11" fill="#6b7d8f">${r.m.questions ? `not enough evidence (${r.m.questions} question${r.m.questions === 1 ? "" : "s"})` : "no attempts yet"}</text>`;
    });
    return s + "</svg>";
  }

  // Weekly history chart: bar height = first-time score (% of marks), label above = number of attempts that week.
  function weeklyChart(weeks) {
    const W = 400, H = 210, padL = 34, padB = 34, padT = 18, w = W - padL - 6, hh = H - padB - padT; const n = weeks.length; const slot = w / n; const bw = Math.min(26, slot - 6);
    const Y = (p) => padT + hh - (hh * p) / 100;
    let s = `<svg class="uh-chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="uh-wk-t" focusable="false"><title id="uh-wk-t">Weekly Unit 1 practice: ${esc(weeks.map((x) => `week of ${shortDate(x.start)}: ${x.n} attempts${x.pct != null ? ", " + x.pct + "%" : ""}`).join("; "))}</title>`;
    for (const g of [0, 25, 50, 75, 100]) s += `<line x1="${padL}" x2="${W - 6}" y1="${Y(g)}" y2="${Y(g)}" stroke="#e3ecea"/><text x="${padL - 5}" y="${Y(g) + 3.5}" font-size="10" text-anchor="end" fill="#6b7d8f">${g}%</text>`;
    const every = n > 8 ? 2 : 1;
    weeks.forEach((x, i) => {
      const cx = padL + slot * i + slot / 2;
      if (x.pct != null) s += `<rect x="${cx - bw / 2}" y="${Y(x.pct)}" width="${bw}" height="${Y(0) - Y(x.pct)}" rx="4" fill="#1f8a8a"/>`;
      if (x.n) s += `<text x="${cx}" y="${(x.pct != null ? Y(x.pct) : Y(0)) - 4}" font-size="10" text-anchor="middle" fill="#16263a" font-weight="600">${x.n}</text>`;
      if ((n - 1 - i) % every === 0) s += `<text x="${cx}" y="${H - padB + 15}" font-size="10" text-anchor="middle" fill="#3c4f63">${esc(shortDate(x.start))}</text>`;
    });
    s += `<text x="${padL + w / 2}" y="${H - 3}" font-size="10" text-anchor="middle" fill="#6b7d8f">week beginning (Monday)</text>`;
    return s + "</svg>";
  }

  // ---------------------------------------------------------------- overview
  function overview(unit) {
    const u = unit.ref; const st = B.store.get(); const P = B.progress;
    const per = P.perSubsection().filter((s) => s.unit === u); const perBy = Object.fromEntries(per.map((s) => [s.ref, s]));
    const refs = new Set(per.map((s) => s.ref)); const inUnit = (ref) => refs.has(ref);
    const stmts = unit.topics.flatMap((t) => t.subsections.flatMap((s) => s.statements));
    const ticked = stmts.filter((x) => st.checklist[x.id]).length;
    const nAuth = per.filter((s) => authored(s.ref)).length, nVis = per.filter((s) => s.visited).length, nDone = per.filter((s) => s.completed).length;
    const um = P.mastery((a) => inUnit(a.ref));
    const now = Date.now();
    const due = B.store.dueRevisits(now).filter((r) => inUnit(r.ref)); const open = B.store.openRevisits().filter((r) => inUnit(r.ref) && r.due > now);

    // topic mastery
    const topicRows = unit.topics.map((t) => { const set = new Set(t.subsections.map((s) => s.ref)); return { ref: t.ref, title: t.title, m: P.mastery((a) => set.has(a.ref)), cov: P.coverage((x) => set.has(x.ref)), t }; });

    // recommendations
    const recs = P.recommendations(1000).filter((r) => inUnit(r.ref)).slice(0, 6);
    const paperWeak = []; const paperRuns = [];
    for (const [pid, runs] of Object.entries(st.papers || {})) {
      if (!Array.isArray(runs) || !runs.length) continue; const meta = (B.papers || {})[pid];
      const last = runs[runs.length - 1]; const bs = last.byStmt || {};
      const entries = Array.isArray(bs) ? bs.map((x) => [x.stmt || x.id, x]) : Object.entries(bs);
      const rel = entries.filter(([id]) => id && inUnit(String(id).replace(/\.s\d+$/, "")));
      if (meta && meta.unit && meta.unit !== u) continue; if (!meta && !rel.length) continue;
      paperRuns.push({ pid, title: (meta && meta.title) || pid, last, n: runs.length });
      for (const [id, v] of rel) if (v && v.max > 0 && (100 * v.score) / v.max < CONSOLIDATE_BELOW) { const info = stmtTitle(id); paperWeak.push({ id, ref: info ? info.ref : String(id).replace(/\.s\d+$/, ""), text: info ? info.text : id, score: v.score, max: v.max, pct: Math.round((100 * v.score) / v.max), paper: (meta && meta.title) || pid, ts: last.ts }); }
    }
    paperWeak.sort((a, b) => a.pct - b.pct || idCmp(a.id, b.id));
    const WB = weakBelow(); const paperLow = paperWeak.filter((w) => w.pct < WB); const paperMid = paperWeak.filter((w) => w.pct >= WB);

    // weekly history
    const atts = st.attempts.filter((a) => inUnit(a.ref)); let weeks = [];
    if (atts.length) {
      const first = weekStart(Math.min(...atts.map((a) => a.ts))); const cur = weekStart(now); const starts = [];
      for (let d = new Date(cur); d.getTime() >= first && starts.length < 12; d.setDate(d.getDate() - 7)) starts.unshift(weekStart(d.getTime()));
      weeks = starts.map((s0) => { const inW = atts.filter((a) => weekStart(a.ts) === s0); const ft = inW.filter((a) => !a.hinted); const sc = ft.reduce((n, a) => n + a.score, 0), mx = ft.reduce((n, a) => n + a.max, 0); return { start: s0, n: inW.length, q: new Set(inW.map((a) => a.qid)).size, score: sc, max: mx, pct: mx ? Math.round((100 * sc) / mx) : null }; });
    }

    // practicals
    const pracs = (B.spec.practicals || []).filter((p) => p.unit === u);
    // maths
    const rpRe = new RegExp("Required practical (" + pracs.map((p) => p.n).join("|") + ")\\b");
    const refRe = new RegExp("\\b" + u.replace(/\./g, "\\.") + "\\.\\d");
    const unitLevel = unit.level || "AS";
    const mathsNamed = (B.maths || []).filter((m) => (refRe.test(m.source || "") || (pracs.length && rpRe.test(m.source || ""))));
    const mathsGeneral = (B.maths || []).filter((m) => !mathsNamed.includes(m) && /Section 7/.test(m.source || "") && (unitLevel === "A2" || m.level === "AS"));
    const synCount = Object.entries(B.content || {}).filter(([r]) => inUnit(r)).reduce((n, [, c]) => n + (c.synoptic || []).length, 0);

    const rev = (r, isDue) => h`<li class="uh-rev"><div><a href="#/topic/${r.ref}"><strong>${r.ref}</strong>${r.stmt ? raw(h` <span class="tiny muted mono">${r.stmt}</span>`) : ""}</a> <span class="badge ${isDue ? "amber" : ""}">${(isDue ? "due " : "scheduled ") + fmtDate(r.due)}</span><div class="small">${r.reason || "Scheduled revisit"}${r.source ? raw(h` <span class="tiny muted">· ${r.source}</span>`) : ""}</div></div><button class="btn sm" data-rev="${r.id}" aria-label="Mark revisit of ${r.ref} as done">Done</button></li>`;

    const paperItem = (w, c) => h`<li><a href="#/topic/${w.ref}"><span class="mono small">${w.id}</span></a> <span class="badge ${c}">${w.score}/${w.max} · ${w.pct}%</span><div class="small">${w.text}</div><div class="tiny muted">${w.paper}, ${fmtDate(w.ts)}</div></li>`;
    const statusOf = (s) => { const c = (B.content || {})[s.ref]; return B.views.lib && B.views.lib.statusBadge ? B.views.lib.statusBadge((c && c.status) || "not_started") : ""; };
    const subBlock = (s) => { const p = perBy[s.ref]; const a = authored(s.ref); const nt = s.statements.filter((x) => st.checklist[x.id]).length;
      return h`<div class="uh-sub"><div class="uh-sub-head"><a href="#/topic/${s.ref}"><span class="mono">${s.ref}</span> ${s.title}</a><span class="uh-flags">${raw(statusOf(s))}<span class="badge ${p.visited ? "teal" : ""}">${p.visited ? "visited" : "not visited"}</span><span class="badge ${p.completed ? "sage" : ""}">${p.completed ? "completed" : "not completed"}</span>${raw(masteryBadge(p.mastery))}<span class="badge" data-tick-count="${s.ref}">${nt}/${s.statements.length} ticked</span></span></div>
        ${a ? "" : raw(h`<p class="small uh-none">No notes, diagrams or questions for ${s.ref} are on the platform yet. The statements below are the full specification requirement: revise them from your textbook and tick them when you can do them from memory.</p>`)}
        ${raw(s.statements.map((x) => h`<label class="check-row"><input type="checkbox" data-id="${x.id}" data-sub="${s.ref}" ${st.checklist[x.id] ? "checked" : ""}><span class="ref">${x.id.replace(s.ref + ".", "")}</span><span>${x.text}</span></label>`).join(""))}</div>`; };
    const topicBlock = (r) => { const t = r.t; const ts = t.subsections.flatMap((s) => s.statements); const nt = ts.filter((x) => st.checklist[x.id]).length;
      return h`<details class="acc" data-topic="${t.ref}"><summary><span><span class="mono">${t.ref}</span> ${t.title}</span><span class="uh-flags"><span class="badge" data-topic-count="${t.ref}">${nt}/${ts.length} ticked</span>${raw(masteryBadge(r.m))}</span></summary><div class="acc-body">${raw(t.subsections.map(subBlock).join(""))}<p class="small mt">${B.consolidation && B.consolidation[t.ref] && B.consolidation[t.ref].assessment ? raw(h`<a href="#/consolidate/${t.ref}">Topic ${t.ref} consolidation and assessment →</a>`) : raw(h`<span class="muted">The ${t.ref} consolidation page has not been built yet.</span>`)}</p></div></details>`; };

    const recItems = [
      ...due.map((r) => ({ html: rev(r, true) })),
      ...recs.map((r) => ({ html: h`<li><a href="#/topic/${r.ref}"><strong>${r.ref}</strong> ${r.title}</a><div class="small muted">Why: ${r.why.join("; ")}</div></li>` })),
    ];
    const tableMastery = h`<table class="tbl"><caption class="sr-only">Mastery by topic</caption><thead><tr><th scope="col">Topic</th><th scope="col">Mastery</th><th scope="col">Questions</th><th scope="col">Completed</th></tr></thead><tbody>${raw(topicRows.map((r) => h`<tr><th scope="row"><a href="#/library/${u}/${r.ref}">${r.ref} ${r.title}</a></th><td>${r.m.sufficient ? r.m.pct + "%" : r.m.questions ? "not enough evidence" : "no attempts"}</td><td>${r.m.questions}</td><td>${r.cov.completed}/${r.cov.total}</td></tr>`).join(""))}</tbody></table>`;

    const html = el(h`<div class="uh">
      <div class="page-head"><div><div class="eyebrow">${unit.code} · ${unitName(unit)} Revision Centre</div><h1>${unitName(unit)}: ${unit.short}</h1><p class="lede">Everything for ${unitName(unit)} in one place: the full specification checklist, your mastery topic by topic, what to revise next and why, and custom retrieval tests built from every original question on the platform.</p></div>
        <div class="row"><a class="btn primary" href="#/unit/${u}/test">Build a custom test</a><a class="btn" href="#/papers">Practice papers</a></div></div>
      ${raw(tabsNav(u, "overview"))}
      ${!st.attempts.length && !Object.keys(st.checklist).length && !Object.keys(st.coverage).length ? raw(`<div class="notice sage mb"><strong>Nothing recorded yet.</strong> Tick statements below as you learn them, answer questions on the topic pages or build a custom test: this page fills in as you go.</div>`) : ""}
      <div class="grid grid-4 mb uh-stats">
        <div class="card"><div class="stat"><span class="v" id="uh-ticked">${ticked}</span><span class="l">of ${stmts.length} statements ticked</span></div><div class="progress mt" aria-hidden="true"><span id="uh-tick-bar" style="width:${B.util.pct(ticked, stmts.length)}%"></span></div></div>
        <div class="card"><div class="stat"><span class="v">${nDone} / ${per.length}</span><span class="l">subsections completed · ${nVis} visited · ${nAuth} authored</span></div></div>
        <div class="card"><div class="stat"><span class="v">${um.sufficient ? um.pct + "%" : "–"}</span><span class="l">${um.sufficient ? `unit mastery · ${um.questions} questions` : um.questions ? `not enough evidence (${um.questions} question${um.questions === 1 ? "" : "s"})` : "unit mastery · no attempts yet"}</span></div></div>
        <div class="card"><div class="stat"><span class="v">${due.length}</span><span class="l">revisit${due.length === 1 ? "" : "s"} due · ${open.length} scheduled later</span></div></div>
      </div>

      <div class="grid grid-2 mb">
        <section class="card" aria-labelledby="uh-rec-h"><div class="card-head"><h2 class="h3" id="uh-rec-h">What to revise next</h2><a class="small" href="#/progress">How this works</a></div>
          ${recItems.length ? raw(`<ul class="uh-list">${recItems.map((x) => x.html).join("")}</ul>`) : raw(`<div class="empty">${icons.seed}<h3>No recommendations yet</h3><p>Study a ${esc(unitName(unit))} topic and answer some questions; recommendations come from your mastery, mistakes, flashcards and scheduled revisits.</p></div>`)}
          ${paperLow.length ? raw(h`<h3 class="h4 mt">Weak statements in your latest practice-paper runs (below ${WB}%)</h3><ul class="uh-list">${raw(paperLow.slice(0, 8).map((w) => paperItem(w, "rose")).join(""))}</ul>${paperLow.length > 8 ? raw(h`<p class="tiny muted">and ${paperLow.length - 8} more: see Exam Review for each paper.</p>`) : ""}`) : ""}
          ${paperMid.length ? raw(h`<details class="mt"><summary class="small"><strong>Paper statements that need consolidation (${WB}–${CONSOLIDATE_BELOW - 1}%) (${paperMid.length})</strong></summary><ul class="uh-list">${raw(paperMid.map((w) => paperItem(w, "amber")).join(""))}</ul></details>`) : ""}
          ${open.length ? raw(h`<details class="mt"><summary class="small"><strong>Scheduled revisits not yet due (${open.length})</strong></summary><ul class="uh-list">${raw(open.map((r) => rev(r, false)).join(""))}</ul></details>`) : ""}
          <p class="tiny muted mt">Recommendations are scored by the platform's published rules (not studied yet, mastery below 70%, few questions attempted, flashcards due, unresolved mistakes, not opened for two weeks). Revisits are scheduled by practice papers and topic work; "Done" records that you have revisited it. Paper statements are called weak when you scored below ${WB}% of their marks in the latest run of a paper (the same rule as the score report and Exam Review); ${WB}–${CONSOLIDATE_BELOW - 1}% is listed separately as needing consolidation.</p>
        </section>
        <section class="card" aria-labelledby="uh-mas-h"><div class="card-head"><h2 class="h3" id="uh-mas-h">Mastery by topic</h2><span class="badge">${unit.topics.length} topics</span></div>
          <div class="uh-chart-wrap">${raw(masteryChart(topicRows))}</div>
          <p class="tiny muted">Mastery is your latest score on each different question in the topic (hint-assisted and immediate retries excluded). Fewer than 3 different questions is shown as not enough evidence rather than a percentage. Dashed line: 70%.</p>
          <details><summary class="small"><strong>Show as a table</strong></summary>${raw(tableMastery)}</details>
        </section>
      </div>

      <div class="grid grid-2 mb">
        <section class="card" aria-labelledby="uh-time-h"><div class="card-head"><h2 class="h3" id="uh-time-h">Progress over time</h2><span class="badge">${atts.length} attempt${atts.length === 1 ? "" : "s"}</span></div>
          ${weeks.length ? raw(h`<div class="uh-chart-wrap">${raw(weeklyChart(weeks))}</div><p class="tiny muted">Bars: marks scored on first attempts that week as a percentage of marks available (hint-assisted attempts and immediate retries excluded). Number above each bar: all attempts logged that week. Up to the last 12 weeks.</p>
            <details><summary class="small"><strong>Show as a table</strong></summary><table class="tbl"><caption class="sr-only">Weekly attempts</caption><thead><tr><th scope="col">Week beginning</th><th scope="col">Attempts</th><th scope="col">Questions</th><th scope="col">First-attempt marks</th></tr></thead><tbody>${raw(weeks.map((x) => h`<tr><th scope="row">${fmtDate(x.start)}</th><td>${x.n}</td><td>${x.q}</td><td>${x.max ? `${x.score}/${x.max} (${x.pct}%)` : "–"}</td></tr>`).join(""))}</tbody></table></details>`) : raw(`<div class="empty">${icons.progress}<h3>No attempts yet</h3><p>Answer ${esc(unitName(unit))} questions anywhere on the platform and your weekly history appears here.</p></div>`)}
        </section>
        <section class="card" aria-labelledby="uh-rp-h"><div class="card-head"><h2 class="h3" id="uh-rp-h">Required practicals</h2><span class="badge">${pracs.length}</span></div>
          ${pracs.length ? raw(`<ul class="uh-list">${pracs.map((p) => { const runs = (st.labRuns || {})[p.n] || []; const last = runs.length ? runs[runs.length - 1].ts : null; const pr = (B.practicals || {})[p.n] || {};
            return h`<li><div class="uh-sub-head"><a href="#/lab/${p.n}"><strong>RP${p.n}</strong> ${p.title}</a><span class="uh-flags">${pr.status && pr.status !== "not_started" ? raw('<span class="badge teal">virtual lab</span>') : raw('<span class="badge">not built yet</span>')}<span class="badge ${runs.length ? "sage" : ""}">${runs.length ? `${runs.length} run${runs.length === 1 ? "" : "s"}${last ? ", last " + fmtDate(last) : ""}` : "no runs yet"}</span></span></div>
              <div class="small">Specification links: ${raw((p.links || []).map((l) => { const f = B.views.lib.findSub(l); const other = f && f.u.ref !== u; return h`<a href="#/topic/${l}">${l}${f ? " " + f.s.title : ""}</a>${other ? raw(h` <span class="badge navy">${f.u.ref} · ${f.u.level}</span>`) : ""}`; }).join(" · "))}</div></li>`; }).join("")}</ul>`) : raw('<p class="small muted">No required practicals are assigned to this unit.</p>')}
          <p class="tiny muted">A run is recorded each time you complete the virtual practical. A link to a later unit shows where the same practical returns.</p>
        </section>
      </div>

      <section class="card mb" aria-labelledby="uh-ck-h"><div class="card-head"><h2 class="h3" id="uh-ck-h">Specification checklist</h2><span class="badge">${stmts.length} statements · ${per.length} subsections</span></div>
        <p class="small muted">Every ${esc(unitName(unit))} statement from the OxfordAQA 9610 specification (v${esc(B.spec.meta.specVersion)}), paraphrased: check the exact wording in the <a href="${B.spec.meta.specPdfUrl}" target="_blank" rel="noopener">official specification</a>. Tick a statement when you can do it from memory; ticks are shared with the topic pages and the main checklist. For each subsection you can see whether its page is written, whether you have visited and completed it, and your mastery.</p>
        <div class="row mb"><button class="btn sm" id="uh-open-all" type="button">Expand all topics</button><button class="btn sm ghost" id="uh-close-all" type="button">Collapse all</button></div>
        ${raw(topicRows.map(topicBlock).join(""))}
      </section>

      <div class="grid grid-2">
        <section class="card" aria-labelledby="uh-m-h"><div class="card-head"><h2 class="h3" id="uh-m-h">Mathematical skills</h2><a class="small" href="#/maths">Maths hub</a></div>
          ${mathsNamed.length ? raw(h`<h3 class="h4">Named in ${unitName(unit)} content</h3><ul class="uh-list">${raw(mathsNamed.map((m) => h`<li><a href="#/maths/${m.id}">${m.title}</a> <span class="tiny muted">${m.source}</span>${m.built ? raw(' <span class="badge teal">calculator</span>') : ""}</li>`).join(""))}</ul>`) : ""}
          ${mathsGeneral.length ? raw(h`<h3 class="h4 mt">General skills assessed in every ${unitLevel} paper (section 7)</h3><ul class="uh-list compact">${raw(mathsGeneral.map((m) => h`<li><a href="#/maths/${m.id}">${m.title}</a>${m.built ? raw(' <span class="badge teal">calculator</span>') : ""}</li>`).join(""))}</ul>`) : ""}
        </section>
        <section class="card" aria-labelledby="uh-syn-h"><div class="card-head"><h2 class="h3" id="uh-syn-h">Connections, consolidation and papers</h2></div>
          <div class="row mb"><a class="btn" href="#/unit/${u}/map">${unitName(unit)} concept map</a><a class="btn" href="#/synoptic">Synoptic connections (${synCount} recorded)</a></div>
          <h3 class="h4">Topic consolidation</h3>
          <ul class="uh-list compact">${raw(unit.topics.map((t) => { const c = (B.consolidation || {})[t.ref]; const ok = c && c.assessment; const runs = ((st.consolidation || {})[t.ref] || []); const last = runs[runs.length - 1];
            return ok ? h`<li><a href="#/consolidate/${t.ref}"><span class="mono">${t.ref}</span> ${t.title}</a>${last ? raw(h` <span class="badge navy">last ${last.pct}%</span>`) : ""}</li>` : h`<li><span class="mono">${t.ref}</span> ${t.title} <span class="badge">not built yet</span></li>`; }).join(""))}</ul>
          <h3 class="h4 mt">Practice papers</h3>
          <p class="small">${paperRuns.length ? raw(paperRuns.map((p) => h`${p.title}: ${p.n} run${p.n === 1 ? "" : "s"}, latest ${p.last.max ? `${p.last.score}/${p.last.max}` : ""} (${fmtDate(p.last.ts)})`).join("<br>")) : "No practice-paper runs yet. Papers are kept out of the custom tests so they stay unseen."} <a href="#/papers">Open practice papers →</a></p>
        </section>
      </div>
    </div>`);
    B.app.render(html, { title: `${unitName(unit)} Revision Centre`, crumbs: [{ label: `${unitName(unit)} Revision Centre` }] });

    // checklist ticks (live counts)
    const tot = stmts.length;
    $$(".check-row input[data-id]", html).forEach((cb) => cb.addEventListener("change", () => {
      B.store.tick(cb.dataset.id, cb.checked); const cl = B.store.get().checklist;
      const n = stmts.filter((x) => cl[x.id]).length; $("#uh-ticked", html).textContent = n; $("#uh-tick-bar", html).style.width = B.util.pct(n, tot) + "%";
      const sub = unit.topics.flatMap((t) => t.subsections).find((s) => s.ref === cb.dataset.sub); const top = unit.topics.find((t) => t.subsections.includes(sub));
      $(`[data-tick-count="${CSS.escape(sub.ref)}"]`, html).textContent = `${sub.statements.filter((x) => cl[x.id]).length}/${sub.statements.length} ticked`;
      const ts = top.subsections.flatMap((s) => s.statements); $(`[data-topic-count="${CSS.escape(top.ref)}"]`, html).textContent = `${ts.filter((x) => cl[x.id]).length}/${ts.length} ticked`;
    }));
    $("#uh-open-all", html).addEventListener("click", () => $$("details.acc", html).forEach((d) => (d.open = true)));
    $("#uh-close-all", html).addEventListener("click", () => $$("details.acc", html).forEach((d) => (d.open = false)));
    $$("button[data-rev]", html).forEach((b) => b.addEventListener("click", () => { B.store.completeRevisit(b.dataset.rev); B.util.toast("Revisit marked as done."); overview(unit); const h2 = $("#uh-rec-h"); if (h2) { h2.setAttribute("tabindex", "-1"); h2.focus(); } }));
  }

  // ---------------------------------------------------------------- custom test
  let pendingRun = null; // the drawn test waiting for #/unit/:u/run
  let lastOpts = null; // remembered for this visit only (returning from a finished test keeps the settings)
  const defaults = () => ({ topic: "", sub: "", difficulty: [], types: [], sources: [], incorrect: false, mode: "count", count: 10, target: 30, order: "mixed" });

  function ctxHTML(e) {
    const c = e.ctx; const from = h`<p class="tiny muted uh-from">From: ${e.where}</p>`; if (!c) return from;
    const oneLine = (s) => String(s || "").replace(/\s*\n\s*/g, " ");
    const block = (title, body, open = true) => `<details class="uh-ctx" ${open ? "open" : ""}><summary>${esc(title)}</summary><div class="uh-ctx-body">${oneLine(body)}</div></details>`;
    if (c.type === "data") return from + block("Data for this question (from the interactive)", c.blocks.map((b) => `<h4 class="small">${esc(b.title || "")}</h4>${typeof b.html === "function" ? b.html() : b.html}`).join(""));
    if (c.type === "graph") { const A = B.enzymeArt; const g = A && { temp: A.tempCurve, substrate: A.substrateCurve, enzyme: A.enzymeConcCurve, pH: A.pHCurve, inhibition: A.inhibitionCurves }[c.graph];
      if (g) { try { return from + block(`${c.label || "Graph"} (from the interactive)`, `<div class="figure"><div class="fig-view">${g.call(A)}</div></div>`); } catch (err) { /* fall through */ } } }
    if (c.type === "focus") { const f = c.focus; const img = B.views.photo ? B.views.photo(f.slot, { caption: f.caption }) : ""; return from + block(`Biology in Focus: ${f.title || ""}`, `${img}<div class="notes small">${typeof f.explanation === "function" ? f.explanation() : f.explanation || ""}</div>`, false); }
    if (c.type === "practical") { const p = (B.spec.practicals || []).find((x) => String(x.n) === String(c.n)); let s = from; if (p) s += `<p class="tiny muted">Required practical ${esc(c.n)}: ${esc(p.title)}. <a href="#/lab/${esc(c.n)}" target="_blank" rel="noopener">Open the practical in a new tab</a>.</p>`;
      for (const pr of c.prior || []) s += block(`Question ${pr.num} of the practical assessment (referred to below)`, pr.stem); return s; }
    // interactive with no portable data: say so honestly and link to it
    return from + `<div class="notice uh-ctx-note small">This question belongs to the <strong>${esc(c.title)}</strong> interactive on the ${esc(c.ref)} page. If it refers to the model, <a href="#/topic/${esc(c.ref)}" target="_blank" rel="noopener">open the ${esc(c.ref)} page in a new tab</a> to use it.</div>`;
  }
  const wrap = (e) => Object.assign({}, e.q, { stem: ctxHTML(e) + String(e.q.stem).replace(/\n/g, "<br>") });

  function testTab(unit) {
    const u = unit.ref; const all = pool(u); const wrongIds = incorrectIds(); const o = Object.assign(defaults(), lastOpts || {});
    const count = (f) => all.filter(f).length;
    const topicOpts = unit.topics.map((t) => h`<option value="${t.ref}" ${o.topic === t.ref ? "selected" : ""}>${t.ref} ${t.title} (${count((e) => e.topic === t.ref)})</option>`).join("");
    const cb = (name, val, label, n, on) => h`<label class="uh-cb"><input type="checkbox" name="${name}" value="${val}" ${on ? "checked" : ""}> <span>${label} <span class="muted" data-n="${name}:${val}">(${n})</span></span></label>`;
    const html = el(h`<div class="uh">
      <div class="page-head"><div><div class="eyebrow">${unit.code} · ${unitName(unit)} Revision Centre</div><h1>Custom retrieval test</h1><p class="lede">Build a test from the ${all.length} original ${unitName(unit)} questions on the platform. Practice-paper questions are never included, so the papers stay unseen. Every answer is recorded and feeds your mastery and mistake bank.</p></div></div>
      ${raw(tabsNav(u, "test"))}
      <div class="uh-test-grid">
        <form class="card" id="uh-form" aria-labelledby="uh-f-h" novalidate>
          <h2 class="h3" id="uh-f-h">Choose your questions</h2>
          <div class="uh-fields">
            <label class="uh-field"><span>Topic</span><select id="uh-topic"><option value="">All ${unit.topics.length} topics</option>${raw(topicOpts)}</select></label>
            <label class="uh-field"><span>Subsection</span><select id="uh-sub"></select></label>
          </div>
          <fieldset class="uh-fs"><legend>Difficulty <span class="tiny muted">(none ticked = all; numbers match your other choices)</span></legend>${raw(DIFFS.map((d) => cb("diff", d, DIFF_LABEL[d], count((e) => e.difficulty === d), o.difficulty.includes(d))).join(""))}</fieldset>
          <fieldset class="uh-fs"><legend>Question type <span class="tiny muted">(none ticked = all; numbers match your other choices)</span></legend>${raw(TYPES.map((t) => cb("type", t, B.questions.labelFor(t), count((e) => e.type === t), o.types.includes(t))).join(""))}</fieldset>
          <fieldset class="uh-fs"><legend>Where the questions come from <span class="tiny muted">(none ticked = all; numbers match your other choices)</span></legend>${raw(Object.entries(SOURCES).map(([k, l]) => cb("src", k, l, count((e) => e.source === k), o.sources.includes(k))).join(""))}</fieldset>
          <fieldset class="uh-fs"><legend>Focus</legend><label class="uh-cb"><input type="checkbox" id="uh-wrong" ${o.incorrect ? "checked" : ""}> <span>Only questions I previously got wrong <span class="muted" data-n="wrong">(${count((e) => wrongIds.has(e.id))})</span></span></label><p class="tiny muted">A question counts if your latest attempt scored below full marks, or it has an unresolved entry in your mistake bank.</p></fieldset>
          <fieldset class="uh-fs"><legend>Test length</legend>
            <label class="uh-cb"><input type="radio" name="mode" value="count" ${o.mode === "count" ? "checked" : ""}> <span>Number of questions</span></label>
            <label class="uh-cb"><input type="radio" name="mode" value="marks" ${o.mode === "marks" ? "checked" : ""}> <span>Target total marks</span></label>
            <div class="uh-fields mt">
              <label class="uh-field"><span>Questions</span><input type="number" id="uh-count" min="1" max="60" step="1" value="${o.count}" inputmode="numeric"></label>
              <label class="uh-field"><span>Target marks</span><input type="number" id="uh-target" min="1" max="150" step="1" value="${o.target}" inputmode="numeric"></label>
            </div>
            <p class="tiny muted">Questions: 1 to 60. Target marks: 1 to 150.</p><p class="small uh-adj" id="uh-fixnote" role="status" hidden></p>
          </fieldset>
          <label class="uh-field"><span>Order</span><select id="uh-order"><option value="mixed" ${o.order === "mixed" ? "selected" : ""}>Mixed (interleaved retrieval)</option><option value="spec" ${o.order === "spec" ? "selected" : ""}>Specification order</option></select></label>
          <div class="row mt"><button class="btn primary" id="uh-build" type="submit">Draw questions</button><button class="btn ghost" id="uh-reset" type="button">Reset filters</button></div>
        </form>
        <div class="stack">
          <section class="card" aria-labelledby="uh-pool-h"><h2 class="h3" id="uh-pool-h">Matching questions</h2><div id="uh-live" aria-live="polite" aria-atomic="true"></div></section>
          <section class="card" id="uh-preview-card" aria-labelledby="uh-pv-h" hidden><h2 class="h3" id="uh-pv-h" tabindex="-1">Your test</h2><div id="uh-preview"></div></section>
          <section class="card" aria-labelledby="uh-rules-h"><h2 class="h3" id="uh-rules-h">How questions are chosen</h2>
            <h3 class="h4">Difficulty rule</h3><p class="small">Difficulty is worked out from each question's type and marks only, never from a hand-applied label:</p>
            <ul class="small">${raw(DIFFICULTY_RULE.map(([k, v]) => h`<li><strong>${k}:</strong> ${v}.</li>`).join(""))}</ul>
            <h3 class="h4">Target marks</h3><p class="small">The test uses the largest total that can be made from the matching questions without going over your target (an exact subset-sum calculation, so if the target can be hit exactly, it is). The questions are shuffled first, so each draw gives a different set with that same total.</p>
            <h3 class="h4">Number of questions</h3><p class="small">A random sample of the matching questions. If fewer match, you get all of them.</p>
            <p class="tiny muted">Questions taken from interactives, Biology in Focus cards and practical assessments carry their data, graph or background with them; where an interactive model cannot be carried over, a link opens it in a new tab.</p>
          </section>
        </div>
      </div>
    </div>`);
    B.app.render(html, { title: `${unitName(unit)} custom test`, crumbs: [{ label: `${unitName(unit)} Revision Centre`, href: `#/unit/${u}` }, { label: "Custom test" }] });

    const subSel = $("#uh-sub", html);
    const fillSubs = () => { const t = $("#uh-topic", html).value; const subs = unit.topics.filter((x) => !t || x.ref === t).flatMap((x) => x.subsections); const keep = subs.some((s) => s.ref === o.sub) ? o.sub : "";
      subSel.innerHTML = `<option value="">All subsections${t ? " in " + esc(t) : ""}</option>` + subs.map((s) => { const n = count((e) => e.ref === s.ref); return `<option value="${esc(s.ref)}" ${keep === s.ref ? "selected" : ""}>${esc(s.ref)} ${esc(s.title)} (${n}${authored(s.ref) ? "" : ", not yet written"})</option>`; }).join(""); };
    const read = () => { const f = $("#uh-form", html); const vals = (n) => $$(`input[name="${n}"]:checked`, f).map((i) => i.value);
      return { topic: $("#uh-topic", html).value, sub: subSel.value, difficulty: vals("diff"), types: vals("type"), sources: vals("src"), incorrect: $("#uh-wrong", html).checked, mode: (($('input[name="mode"]:checked', f) || {}).value) || "count",
        count: num("count").v, target: num("target").v, order: $("#uh-order", html).value }; };
    // Number fields: out-of-range or blank values are corrected, and the correction is shown (never silent).
    const LIMITS = { count: { id: "uh-count", min: 1, max: 60, def: 10, name: "Questions" }, target: { id: "uh-target", min: 1, max: 150, def: 30, name: "Target marks" } };
    function num(k) { const L = LIMITS[k]; const rawv = String($("#" + L.id, html).value).trim(); const n = parseInt(rawv, 10);
      if (!rawv || isNaN(n)) return { v: L.def, msg: `The ${L.name} field was left blank, so ${L.def} is used.` };
      if (n < L.min) return { v: L.min, msg: `${L.name}: ${n} is below the minimum, so ${L.min} is used.` };
      if (n > L.max) return { v: L.max, msg: `${L.name}: ${n} is above the maximum, so ${L.max} is used.` };
      return { v: n, msg: "" }; }
    const fixField = (k) => { const L = LIMITS[k]; const f = $("#" + L.id, html); const r = num(k); const note = $("#uh-fixnote", html);
      if (r.msg) { f.value = r.v; note.textContent = `${r.msg} The field now shows ${r.v}.`; note.hidden = false; } else if (note.dataset.k === k || !note.dataset.k) note.hidden = true;
      if (r.msg) note.dataset.k = k; };
    const setN = (key, v) => { const sp = $(`[data-n="${key}"]`, html); if (sp) sp.textContent = `(${v})`; };
    // Counts beside each tick box: how many questions that option would give with all the other current choices.
    const facets = (opts) => {
      const base = Object.assign({}, opts, { incorrectIds: wrongIds });
      const n = (over) => filter(all, Object.assign({}, base, over)).length;
      DIFFS.forEach((d) => setN(`diff:${d}`, n({ difficulty: [d] })));
      TYPES.forEach((t) => setN(`type:${t}`, n({ types: [t] })));
      Object.keys(SOURCES).forEach((k) => setN(`src:${k}`, n({ sources: [k] })));
      setN("wrong", n({ incorrect: true }));
    };
    const live = () => {
      const opts = read(); lastOpts = opts; const m = filter(all, Object.assign({}, opts, { incorrectIds: wrongIds })); const marks = m.reduce((n, e) => n + e.marks, 0);
      $("#uh-count", html).disabled = opts.mode !== "count"; $("#uh-target", html).disabled = opts.mode !== "marks";
      facets(opts);
      const adj = opts.mode === "count" ? num("count").msg : num("target").msg; const adjHTML = adj ? `<p class="small uh-adj"><strong>Note:</strong> ${esc(adj)}</p>` : "";
      const box = $("#uh-live", html); $("#uh-build", html).disabled = !m.length;
      if (!m.length) { box.innerHTML = `<div class="notice amber"><strong>No questions match these filters.</strong> ${opts.incorrect && !wrongIds.size ? "You have no incorrectly answered " + esc(unitName(unit)) + " questions yet, so the &ldquo;previously got wrong&rdquo; filter leaves nothing. " : ""}${opts.sub && !authored(opts.sub) ? "The page for " + esc(opts.sub) + " has not been written yet, so it has no questions. " : ""}Untick a filter or choose a wider topic.</div>` + adjHTML; return; }
      const best = opts.mode === "marks" ? pickByMarks(m, opts.target, () => 0.5).reduce((n, e) => n + e.marks, 0) : 0;
      const byD = DIFFS.map((d) => `${DIFF_LABEL[d]} ${m.filter((e) => e.difficulty === d).length}`).join(" · ");
      box.innerHTML = h`<p class="uh-big"><strong>${m.length}</strong> question${m.length === 1 ? "" : "s"} <span class="muted">· ${marks} marks available</span></p><p class="small muted">${byD}</p>
        <p class="small">${opts.mode === "marks" ? raw(best === opts.target ? h`Your target of <strong>${opts.target}</strong> marks can be met exactly.` : h`Closest total without exceeding <strong>${opts.target}</strong>: <strong>${best}</strong> marks${marks < opts.target ? " (fewer marks match than the target, so every matching question is used)" : ""}.`) : raw(opts.count > m.length ? h`Only ${m.length} match, so the test will use all of them.` : h`The test will draw <strong>${opts.count}</strong> of them at random.`)}</p>` + adjHTML;
    };
    let drawn = null;
    const preview = () => {
      const opts = read(); lastOpts = opts; const res = build(u, Object.assign({}, opts, { incorrectIds: wrongIds }), Math.random); drawn = res;
      const card = $("#uh-preview-card", html); card.hidden = false; const box = $("#uh-preview", html);
      if (!res.items.length) { box.innerHTML = `<div class="empty">${icons.exam}<h3>Nothing to draw</h3><p>No questions fit these settings${opts.mode === "marks" ? " (every matching question is worth more than the target)" : ""}. Change the filters or raise the target.</p></div>`; return; }
      box.innerHTML = h`<p class="small"><strong>${res.items.length}</strong> question${res.items.length === 1 ? "" : "s"}, <strong>${res.marks}</strong> marks${res.mode === "marks" ? ` (target ${res.target})` : ""}, drawn from ${res.poolSize} matching.</p>
        <div class="uh-scroll"><table class="tbl"><caption class="sr-only">Questions in this test</caption><thead><tr><th scope="col">#</th><th scope="col">Ref</th><th scope="col">Type</th><th scope="col">Difficulty</th><th scope="col">Marks</th></tr></thead><tbody>${raw(res.items.map((e, i) => h`<tr><td>${i + 1}</td><td class="mono">${e.ref}</td><td>${B.questions.labelFor(e.type)}</td><td>${DIFF_LABEL[e.difficulty]}</td><td>${e.marks}</td></tr>`).join(""))}</tbody></table></div>
        <div class="row mt"><button class="btn primary" id="uh-start" type="button">Start this test</button><button class="btn" id="uh-redraw" type="button">Draw again</button></div>`;
      // The run gets its own hash (#/unit/:u/run) so that the runner's "Another set" link and the browser's Back button
      // both return to this form with the settings kept.
      $("#uh-start", box).addEventListener("click", () => { pendingRun = { u, items: drawn.items, marks: drawn.marks }; location.hash = `#/unit/${u}/run`; });
      $("#uh-redraw", box).addEventListener("click", preview);
      const hd = $("#uh-pv-h", html); hd.focus({ preventScroll: true }); card.scrollIntoView({ block: "nearest" });
    };
    fillSubs();
    $("#uh-topic", html).addEventListener("change", () => { o.sub = ""; fillSubs(); live(); });
    $("#uh-form", html).addEventListener("change", live); $("#uh-form", html).addEventListener("input", live);
    $("#uh-form", html).addEventListener("submit", (ev) => { ev.preventDefault(); fixField(read().mode === "marks" ? "target" : "count"); live(); preview(); });
    ["count", "target"].forEach((k) => $("#" + LIMITS[k].id, html).addEventListener("change", () => { fixField(k); live(); }));
    $("#uh-reset", html).addEventListener("click", () => { lastOpts = null; testTab(unit); });
    live();
  }

  B.views.unitHub = function (u, tab) {
    const unit = unitOf(u);
    if (!unit) return B.app.render(h`<div class="card"><h1>Unit not found</h1><p class="muted">There is no unit ${u} in the specification.</p><a class="btn" href="#/library">Revision Library</a></div>`, { title: "Not found" });
    if (tab === "test") return testTab(unit);
    if (tab === "run") {
      if (!pendingRun || pendingRun.u !== u) { location.replace(`#/unit/${u}/test`); return; } // reload or stale link: back to the form
      const run = pendingRun; pendingRun = null;
      return B.examRunTest(`${unitName(unit)} custom test`, run.items.map(wrap), `${unitName(unit)} custom test · ${run.marks} marks`, { retry: `#/unit/${u}/test`, crumbs: [{ label: `${unitName(unit)} Revision Centre`, href: `#/unit/${u}` }, { label: "Custom test" }], back: { href: `#/unit/${u}/test`, label: "Back to the test builder" } });
    }
    if (tab && tab !== "overview") return B.app.render(h`<div class="card"><h1>Page not found</h1><p class="muted">The Revision Centre has no "${tab}" section.</p><a class="btn" href="#/unit/${u}">Back to the ${unitName(unit)} Revision Centre</a></div>`, { title: "Not found" });
    return overview(unit);
  };
})(window.BIO);
