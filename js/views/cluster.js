// Cross-topic consolidation view (Phase 4 Batch 1, owned by the cluster author).
// Routes #/cluster/:id and #/cluster/:id/:tab → B.views.cluster(id, tab). Data: B.clusters[id] (data/clusters/*.js).
// Tabs: overview (chain + readiness of each topic), map (clickable, keyboard-accessible SVG with a list alternative),
// cases (case studies), exam (cross-topic questions + diagnostics) and deck (combined flashcards).
// Every question is rendered with B.questions.render, so attempts are logged by the engine and count towards mastery.
// Diagnostics are computed from the stored attempts (latest non-hinted attempt per question, the same rule as
// js/core/progress.js) and attributed to each specification statement a question is tagged with.
// The combined deck is built at runtime from B.consolidation[topic].deckIds/extraCards (via B.flashcards.all("deck:…"))
// plus the cluster's own bridgeCards; it works whether or not the topic consolidations exist yet.
// Styles are emitted inline (prefix cl-); colours use the site tokens so both themes stay legible.
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, esc, icons, shuffle, fmtDate } = B.util;
  const NW = 180, NH = 58;
  const TABS = [["overview", "Overview"], ["map", "Concept map"], ["cases", "Case studies"], ["exam", "Exam questions"], ["deck", "Combined deck"]];

  const STYLE = `<style id="cl-style">
  .cl-root .tabs { flex-wrap: wrap; }
  .cl-chain { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .5rem; counter-reset: clc; }
  .cl-chain li { position: relative; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--radius-s); padding: .6rem .65rem .65rem; min-width: 0; }
  .cl-chain li::before { counter-increment: clc; content: counter(clc); display: inline-grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 50%; background: var(--teal); color: var(--on-accent); font-weight: 700; font-size: .8rem; margin-bottom: .3rem; }
  .cl-chain li:not(:last-child)::after { content: "→"; position: absolute; right: -.55rem; top: 50%; transform: translateY(-50%); color: var(--ink-3); font-weight: 700; z-index: 1; }
  .cl-chain strong { display: block; color: var(--ink); line-height: 1.25; }
  .cl-chain .refs { display: flex; flex-wrap: wrap; gap: .25rem; margin-top: .35rem; }
  .cl-chain .refs a { font-family: var(--mono); font-size: .75rem; }
  .cl-dot { display: inline-block; width: .6rem; height: .6rem; border-radius: 50%; margin-right: .3rem; vertical-align: middle; background: var(--line-strong); }
  .cl-dot.ready { background: var(--sage); } .cl-dot.part { background: var(--amber); }
  .cl-ready { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; }
  .cl-ready .card { margin: 0; }
  .cl-ready ul { list-style: none; padding: 0; margin: .4rem 0 .6rem; font-size: .88rem; }
  .cl-ready li { margin: .2rem 0; }
  .cl-caption { min-height: 2.6em; margin: 0 0 .6rem; font-size: .9rem; color: var(--ink-2); }
  .cl-svg { display: block; width: 100%; height: auto; }
  .cl-svg text { font-family: var(--font); pointer-events: none; }
  .cl-node, .cl-link { cursor: pointer; outline: none; }
  .cl-node .box { stroke-width: 2; }
  .cl-node.g-disease .box { fill: var(--rose-soft); stroke: var(--rose); }
  .cl-node.g-digest .box { fill: var(--sage-soft); stroke: var(--sage); }
  .cl-node.g-cholera .box { fill: var(--amber-soft); stroke: var(--amber); }
  .cl-node.concept .box { stroke-dasharray: 6 4; }
  .cl-node .kick { fill: var(--ink-3); font-size: 11.5px; font-weight: 600; }
  .cl-node .lab { fill: var(--ink); font-size: 14.5px; font-weight: 700; }
  .cl-node .ring, .cl-link .ring { fill: none; stroke: transparent; }
  .cl-node:focus-visible .ring, .cl-link:focus-visible .ring { stroke: var(--focus); stroke-width: 4; }
  .cl-node:hover .box, .cl-node:focus-visible .box { stroke-width: 3.5; }
  .cl-edge { stroke: var(--line-strong); stroke-width: 2.2; fill: none; }
  .cl-arrow { fill: var(--line-strong); }
  .cl-link .dot { fill: var(--paper); stroke: var(--ink-3); stroke-width: 1.8; }
  .cl-link text { fill: var(--ink); font-size: 12.5px; font-weight: 700; }
  .cl-link:hover .dot, .cl-link:focus-visible .dot { fill: var(--teal-soft); stroke: var(--teal); }
  .cl-svg.has-sel .cl-edge, .cl-svg.has-sel .cl-link, .cl-svg.has-sel .cl-node { opacity: .3; }
  .cl-svg.has-sel .on { opacity: 1; }
  .cl-svg .cl-edge.on { stroke: var(--teal); stroke-width: 3.6; }
  .cl-svg .cl-link.on .dot { fill: var(--teal); stroke: var(--teal); }
  .cl-svg .cl-link.on text { fill: var(--on-accent); }
  .cl-svg .cl-node.sel .box { stroke-width: 4.5; }
  @media (prefers-reduced-motion: no-preference) { html:not(.reduce-motion) .cl-edge, html:not(.reduce-motion) .cl-link, html:not(.reduce-motion) .cl-node { transition: opacity .18s ease; } }
  .cl-legend { display: flex; flex-wrap: wrap; gap: .4rem 1rem; font-size: .82rem; color: var(--ink-2); margin-top: .6rem; }
  .cl-legend i { display: inline-block; width: 18px; height: 12px; border-radius: 4px; border: 2px solid; vertical-align: -1px; margin-right: .35rem; }
  .cl-legend .g-disease { background: var(--rose-soft); border-color: var(--rose); }
  .cl-legend .g-digest { background: var(--sage-soft); border-color: var(--sage); }
  .cl-legend .g-cholera { background: var(--amber-soft); border-color: var(--amber); }
  .cl-legend .dash { border-style: dashed; border-color: var(--ink-3); }
  .cl-small-note { display: none; }
  .cl-detail { scroll-margin-top: calc(var(--topbar-h) + 12px); }
  .cl-detail h2:focus, .cl-pane h2:focus { outline: none; }
  .cl-detail h2:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  .cl-path { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin: .2rem 0 .8rem; }
  .cl-path .rel { font-style: italic; color: var(--ink-2); }
  .cl-path .badge { white-space: normal; text-align: left; line-height: 1.3; max-width: 100%; }
  .cl-stmts { margin: .4rem 0 0; padding-left: 1.1rem; font-size: .86rem; color: var(--ink-2); }
  .cl-conn { list-style: none; padding: 0; margin: .5rem 0 0; display: grid; gap: .4rem; }
  .cl-conn button { text-align: left; width: 100%; white-space: normal; }
  .cl-dn { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: space-between; margin-top: 1rem; }
  .cl-table td, .cl-table th { font-size: .88rem; }
  .cl-table .num { font-family: var(--mono); color: var(--ink-3); width: 2.2rem; }
  .cl-table .rel { font-style: italic; color: var(--ink-2); }
  .cl-tablewrap { max-width: 100%; overflow-x: auto; margin: .6rem 0; }
  .cl-data { width: 100%; border-collapse: collapse; font-size: .88rem; }
  .cl-data caption { caption-side: top; text-align: left; font-size: .82rem; color: var(--ink-3); padding-bottom: .3rem; }
  .cl-data th, .cl-data td { border: 1px solid var(--line); padding: .3rem .5rem; text-align: left; vertical-align: top; }
  .cl-data thead th { background: var(--surface-2); }
  .cl-root .q-stem table { display: block; max-width: 100%; overflow-x: auto; }
  .cl-root .pane table.cl-data, .cl-root .q-stem table.cl-data { display: table; white-space: normal; font-size: .84rem; }
  .cl-root .cl-data th, .cl-root .cl-data td { white-space: normal; overflow-wrap: normal; word-break: normal; hyphens: auto; }
  .cl-root .q-stem .cl-data { display: table; }
  .cl-root .q, .cl-root .q * { overflow-wrap: anywhere; }
  .cl-qh { font-size: .95rem; margin: 1.2rem 0 .4rem; color: var(--ink-2); }
  .cl-score { display: flex; flex-wrap: wrap; gap: 1.2rem; align-items: flex-end; }
  .cl-bar { height: .55rem; border-radius: 99px; background: var(--surface-3); overflow: hidden; min-width: 80px; }
  .cl-bar span { display: block; height: 100%; background: var(--teal); }
  .cl-bar span.weak { background: var(--rose); } .cl-bar span.strong { background: var(--sage); }
  .cl-diag table { width: 100%; }
  .cl-diag td, .cl-diag th { font-size: .86rem; vertical-align: top; }
  .cl-diag .stx { color: var(--ink-2); }
  .cl-scope { display: flex; flex-wrap: wrap; gap: .4rem 1rem; font-size: .88rem; margin: .4rem 0 .8rem; border: 0; padding: 0; }
  .cl-scope legend { font-weight: 600; margin-bottom: .2rem; padding: 0; }
  .cl-sources { font-size: .82rem; color: var(--ink-2); padding-left: 1.1rem; }
  .cl-sources li { margin: .25rem 0; overflow-wrap: anywhere; }
  @media (max-width: 1000px) { .cl-chain { grid-template-columns: repeat(3, minmax(0, 1fr)); } .cl-chain li:nth-child(3)::after { display: none; } .cl-ready { grid-template-columns: 1fr; } }
  @media (max-width: 760px) {
    .cl-figure { display: none; }
    .cl-small-note { display: block; }
    .cl-chain { grid-template-columns: 1fr; }
    .cl-chain li:not(:last-child)::after { content: "↓"; right: auto; left: 1.1rem; top: auto; bottom: -.95rem; transform: none; display: block; }
    .cl-table, .cl-table tbody, .cl-table tr, .cl-table td, .cl-diag table, .cl-diag tbody, .cl-diag tr, .cl-diag td { display: block; width: 100%; }
    .cl-table thead, .cl-diag thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .cl-table tr, .cl-diag tr { border: 1px solid var(--line); border-radius: 10px; padding: .5rem .7rem; margin-bottom: .6rem; background: var(--surface); }
    .cl-table td, .cl-diag td { border: 0; padding: .15rem 0; }
    .card > table.cl-table, .cl-diag table { overflow: visible; white-space: normal; }
    .cl-table td.num { width: auto; font-family: var(--font); font-weight: 600; color: var(--ink-2); }
    .cl-table td[data-h]::before, .cl-diag td[data-h]::before { content: attr(data-h) ": "; font-weight: 600; color: var(--ink-3); font-style: normal; }
    .cl-table button { white-space: normal; margin-top: .3rem; }
  }
  </style>`;

  // ---------- helpers ----------
  function specIndex() {
    const stmt = {}, sub = {}, topic = {}, stmtSub = {};
    for (const u of B.spec.units) for (const t of u.topics) { topic[t.ref] = t; for (const s of t.subsections) { sub[s.ref] = s; for (const st of s.statements) { stmt[st.id] = st.text; stmtSub[st.id] = s.ref; } } }
    return { stmt, sub, topic, stmtSub };
  }
  const topicOf = (ref) => ref.split(".").slice(0, 3).join(".");
  const subOfStmt = (id) => id.replace(/\.s\d+$/, "");
  function wrap(s, n, max = 2) {
    const words = s.split(" "), lines = [""];
    for (const w of words) { const cur = lines[lines.length - 1]; if ((cur + " " + w).trim().length > n && cur) { if (lines.length === max) { lines[lines.length - 1] += " " + w; continue; } lines.push(w); } else lines[lines.length - 1] = (cur + " " + w).trim(); }
    return lines;
  }
  function boxExit(cx, cy, tx, ty, pad) {
    const dx = tx - cx, dy = ty - cy, hw = NW / 2 + pad, hh = NH / 2 + pad;
    const k = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return [cx + dx * k, cy + dy * k];
  }
  // Readiness of a topic: how many subsections are authored, and whether its consolidation exists.
  function readiness(tref, S) {
    const t = S.topic[tref]; if (!t) return null;
    const subs = t.subsections.map((s) => { const c = (B.content || {})[s.ref]; return { ref: s.ref, title: s.title, status: c ? c.status || "draft" : "not_started" }; });
    const authored = subs.filter((s) => s.status !== "not_started").length;
    const cons = (B.consolidation || {})[tref];
    const deckN = cons && cons.deckIds ? B.flashcards.all("deck:" + tref).length : 0;
    const state = authored === subs.length ? "ready" : authored ? "part" : "none";
    return { t, subs, authored, cons, deckN, state, label: state === "ready" ? "All subsections written" : state === "part" ? `${authored} of ${subs.length} subsections written` : "Not yet written" };
  }

  // Pure function: per-topic and per-statement diagnostics from the latest non-hinted attempt at each question.
  // A question tagged with several statements contributes its full score and maximum to each of them.
  function diagnose(questions, attempts, cfg) {
    const byQ = Object.fromEntries(questions.map((q) => [q.id, q]));
    const latest = {};
    for (const a of attempts) { if (!byQ[a.qid] || a.hinted) continue; if (!latest[a.qid] || latest[a.qid].ts <= a.ts) latest[a.qid] = a; }
    const topics = {}, stmts = {}; let score = 0, max = 0;
    for (const a of Object.values(latest)) {
      const q = byQ[a.qid]; const sc = Math.min(a.score, q.marks); score += sc; max += q.marks;
      for (const t of new Set(q.stmts.map(topicOf))) { const r = topics[t] || (topics[t] = { ref: t, score: 0, max: 0, n: 0 }); r.score += sc; r.max += q.marks; r.n++; }
      for (const s of q.stmts) { const r = stmts[s] || (stmts[s] = { id: s, score: 0, max: 0, n: 0 }); r.score += sc; r.max += q.marks; r.n++; }
    }
    const fin = (r) => Object.assign(r, { pct: r.max ? Math.round((100 * r.score) / r.max) : 0, band: !r.max ? "none" : (100 * r.score) / r.max < cfg.weakBelowPct ? "weak" : (100 * r.score) / r.max >= cfg.strongAtPct ? "strong" : "developing" });
    return { answered: Object.keys(latest).length, total: questions.length, score, max, pct: max ? Math.round((100 * score) / max) : null, topics: Object.values(topics).map(fin).sort((a, b) => a.ref.localeCompare(b.ref)), stmts: Object.values(stmts).map(fin).sort((a, b) => a.pct - b.pct || a.id.localeCompare(b.id)) };
  }
  B.clusterDiagnose = diagnose;

  // Combined deck: each topic's consolidation deck (if present) plus the cluster's bridging cards, without duplicates.
  function combinedDeck(C) {
    const out = [], seen = new Set(), from = [];
    for (const t of C.topics) { const cons = (B.consolidation || {})[t]; if (!cons || !cons.deckIds) continue; const cards = B.flashcards.all("deck:" + t); from.push({ t, n: cards.length }); for (const c of cards) if (!seen.has(c.id)) { seen.add(c.id); out.push(c); } }
    for (const c of C.bridgeCards || []) if (!seen.has(c.id)) { seen.add(c.id); out.push(Object.assign({}, c)); }
    return { cards: out, from };
  }

  B.views.cluster = function (id, tab) {
    const C = (B.clusters || {})[id];
    const crumbs = [{ label: "Library", href: "#/library" }, { label: "Unit 2", href: "#/library/3.2" }, { label: "Cross-topic consolidation" }];
    if (!C) return B.app.render(h`<div class="page-head"><div><h1>Cross-topic consolidation</h1></div></div><div class="card"><div class="empty"><h3>No consolidation with this name</h3><p>There is no cross-topic consolidation called “${id}”.</p><a class="btn" href="#/library">Back to the library</a></div></div>`, { title: "Cross-topic consolidation", crumbs });
    const S = specIndex();
    const unit = B.spec.units.find((u) => u.ref === C.unit) || { short: "", code: "" };
    const ready = C.topics.map((t) => readiness(t, S)).filter(Boolean);
    const cfg = C.diagnostics || { weakBelowPct: 70, strongAtPct: 85 };
    const mapQs = C.map.links.map((l) => l.question), caseQs = C.caseStudies.flatMap((c) => c.questions), examQs = C.examQuestions;
    const allQs = [...mapQs, ...caseQs, ...examQs];
    const examMarks = examQs.reduce((n, q) => n + q.marks, 0);
    const srcById = Object.fromEntries((C.sources || []).map((s) => [s.id, s]));
    const initial = TABS.some(([k]) => k === tab) ? tab : "overview";

    // ----- overview -----
    const chainHTML = C.chain.map((step, i) => { const refs = (C.chainRefs || [])[i] || []; return h`<li><strong>${step}</strong><span class="refs">${raw(refs.map((r) => { const c = (B.content || {})[r]; const st = c && c.status !== "not_started" ? "ready" : ""; return h`<a href="#/topic/${r}"><span class="cl-dot ${st}" aria-hidden="true"></span>${r}</a>`; }).join(""))}</span></li>`; }).join("");
    const readyHTML = ready.map((r) => h`<section class="card" aria-labelledby="cl-rd-${r.t.ref}">
      <div class="card-head"><h3 id="cl-rd-${r.t.ref}">${r.t.ref} ${r.t.title}</h3></div>
      <p class="small"><span class="cl-dot ${r.state}" aria-hidden="true"></span><strong>${r.label}</strong></p>
      <ul>${raw(r.subs.map((s) => h`<li><a href="#/topic/${s.ref}">${s.ref} ${s.title}</a> ${raw(B.views.lib.statusBadge(s.status))}</li>`).join(""))}</ul>
      <div class="row"><a class="btn sm" href="#/library/3.2/${r.t.ref}">Topic page</a>${r.cons ? raw(h`<a class="btn sm" href="#/consolidate/${r.t.ref}">Topic consolidation</a>${r.deckN ? raw(h`<a class="btn sm ghost" href="#/flashcards/deck:${r.t.ref}">Deck (${r.deckN})</a>`) : ""}`) : raw('<span class="badge">Topic consolidation not built yet</span>')}</div>
    </section>`).join("");
    const allReady = ready.every((r) => r.state === "ready");

    // ----- map -----
    const M = C.map; const VB_W = M.width || 1060, VB_H = M.height || 600;
    const node = Object.fromEntries(M.nodes.map((n) => [n.id, n]));
    const links = M.links.map((l, i) => Object.assign({ n: i + 1 }, l));
    const linkById = Object.fromEntries(links.map((l) => [l.id, l]));
    const geom = (l) => {
      const a = node[l.from], b = node[l.to];
      if (l.bend) { const [cx, cy] = l.bend; const [x1, y1] = boxExit(a.x, a.y, cx, cy, 2), [x2, y2] = boxExit(b.x, b.y, cx, cy, 7); return { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx} ${cy} ${x2.toFixed(1)} ${y2.toFixed(1)}`, mx: 0.25 * x1 + 0.5 * cx + 0.25 * x2, my: 0.25 * y1 + 0.5 * cy + 0.25 * y2 }; }
      const [x1, y1] = boxExit(a.x, a.y, b.x, b.y, 2), [x2, y2] = boxExit(b.x, b.y, a.x, a.y, 7);
      return { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    };
    const edgesSVG = links.map((l) => `<path class="cl-edge" data-link="${l.id}" d="${geom(l).d}" marker-end="url(#cl-arrow)"/>`).join("");
    const nodesSVG = M.nodes.map((n) => {
      const lines = wrap(n.label, 21); const ty = lines.length === 1 ? n.y + 13 : n.y + 5;
      return h`<g class="cl-node g-${n.group} ${n.kind || ""}" data-node="${n.id}" tabindex="0" role="button" aria-label="${n.label}, specification ${n.ref}. Show its connections.">
        <rect class="ring" x="${n.x - NW / 2 - 5}" y="${n.y - NH / 2 - 5}" width="${NW + 10}" height="${NH + 10}" rx="15"/>
        <rect class="box" x="${n.x - NW / 2}" y="${n.y - NH / 2}" width="${NW}" height="${NH}" rx="${n.kind === "concept" ? 26 : 11}"/>
        <text class="kick" x="${n.x}" y="${n.y - 13}" text-anchor="middle">${n.kind === "concept" ? "Key idea · " : ""}${n.ref}</text>
        ${raw(lines.map((ln, i) => h`<text class="lab" x="${n.x}" y="${ty + i * 15}" text-anchor="middle">${ln}</text>`).join(""))}</g>`;
    }).join("");
    const linksSVG = links.map((l) => { const g = geom(l); const a = node[l.from], b = node[l.to];
      return h`<g class="cl-link" data-link="${l.id}" tabindex="0" role="button" aria-label="Connection ${l.n}: ${a.label} ${l.label} ${b.label}. Show the explanation and question.">
        <title>${a.label} → ${l.label} → ${b.label}</title><circle class="ring" cx="${g.mx}" cy="${g.my}" r="18"/><circle class="dot" cx="${g.mx}" cy="${g.my}" r="13.5"/><text x="${g.mx}" y="${g.my + 4.5}" text-anchor="middle">${l.n}</text></g>`; }).join("");
    const svg = `<svg class="cl-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="group" aria-label="Concept map: ${M.nodes.length} ideas joined by ${links.length} numbered connections. Each box and each numbered circle is a button.">
      <defs><marker id="cl-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="cl-arrow" d="M0 0 L10 5 L0 10 z"/></marker></defs>
      <g aria-hidden="true">${edgesSVG}</g>${nodesSVG}${linksSVG}</svg>`;
    const listRows = links.map((l) => h`<tr><td class="num" data-h="Connection">${l.n}</td><td data-h="From"><a href="${node[l.from].href}">${node[l.from].label}</a></td><td class="rel" data-h="Relationship">${l.label}</td><td data-h="To"><a href="${node[l.to].href}">${node[l.to].label}</a></td><td><button class="btn sm" type="button" data-open-link="${l.id}" aria-label="Explain and practise connection ${l.n}">Explain and practise</button></td></tr>`).join("");
    const mapMarks = mapQs.reduce((n, q) => n + q.marks, 0);

    // ----- cases -----
    const casesHTML = C.caseStudies.map((cs, i) => h`<section class="card mb" aria-labelledby="cl-cs-${cs.id}">
      <div class="card-head"><h2 id="cl-cs-${cs.id}">Case ${i + 1}: ${cs.title}</h2><span class="badge navy">${cs.questions.length} questions · ${cs.questions.reduce((n, q) => n + q.marks, 0)} marks</span></div>
      <div class="notes cl-intro">${raw(cs.intro)}</div>
      ${cs.sources && cs.sources.length ? raw(h`<details class="mt"><summary class="small">Sources for this case</summary><ol class="cl-sources">${raw(cs.sources.map((s) => srcById[s]).filter(Boolean).map((s) => h`<li>${s.text} <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a></li>`).join(""))}</ol></details>`) : ""}
      <div class="cl-qs" data-case="${cs.id}"></div></section>`).join("");

    const page = el(h`<div class="cl-root">${raw(STYLE)}
      <div class="page-head"><div><div class="eyebrow">${unit.code} · ${unit.short} · cross-topic consolidation</div><h1>${C.topics.join(", ")}: ${C.title}</h1>
        <p class="lede">One chain runs through these three topics: pathogens, how they cause disease, the structure of the intestine, absorption, cholera and oral rehydration. This page tests whether you can use ideas from one topic to explain another, rather than recall each on its own.</p>
        <div class="row">${raw(B.views.lib.statusBadge(C.status))}<span class="badge">${allQs.length} questions</span></div></div></div>
      <div class="tabs" role="tablist" aria-label="Consolidation sections">${raw(TABS.map(([k, label]) => h`<button role="tab" id="cl-tab-${k}" aria-controls="cl-pane-${k}" aria-selected="${k === initial}" tabindex="${k === initial ? 0 : -1}" data-tab="${k}">${label}</button>`).join(""))}</div>
      <div class="tabpanes">
        <section class="pane cl-pane" id="cl-pane-overview" role="tabpanel" aria-labelledby="cl-tab-overview" data-pane="overview" tabindex="0" ${initial === "overview" ? "" : "hidden"}>
          <div class="card mb"><h2>The chain</h2><p class="small muted">Each link builds on the one before. The numbers under each link open the subsection notes (a green dot means the notes are written).</p><ol class="cl-chain">${raw(chainHTML)}</ol></div>
          <h2 class="mt">Which topics are ready</h2>
          ${allReady ? "" : raw('<p class="notice small">Some topic pages are still being written. Everything on this page works now; the links and the combined deck fill in as each topic is published.</p>')}
          <div class="cl-ready mb">${raw(readyHTML)}</div>
          <div class="card pad-l mb"><div class="notes">${raw(typeof C.summaryHTML === "function" ? C.summaryHTML() : C.summaryHTML)}</div></div>
          <div class="card"><h2>Where to go next</h2><div class="row"><button class="btn primary" type="button" data-go="map">Explore the concept map (${links.length} links)</button><button class="btn" type="button" data-go="cases">Work through ${C.caseStudies.length} case studies</button><button class="btn" type="button" data-go="exam">Try ${examQs.length} exam questions (${examMarks} marks)</button><button class="btn ghost" type="button" data-go="deck">Review the combined deck</button></div></div>
        </section>
        <section class="pane cl-pane" id="cl-pane-map" role="tabpanel" aria-labelledby="cl-tab-map" data-pane="map" tabindex="0" ${initial === "map" ? "" : "hidden"}>
          <div class="card mb cl-figure"><h2>Concept map</h2><p class="cl-caption" id="cl-caption" aria-hidden="true">Hover over or tab to a box or numbered circle; press Enter to open it. Press Escape to clear the selection.</p>
            <div class="figure"><div class="fig-view">${raw(svg)}</div></div>
            <div class="cl-legend" aria-hidden="true"><span><i class="g-disease"></i>3.2.1 Causes of disease</span><span><i class="g-digest"></i>3.2.2 Digestion and absorption</span><span><i class="g-cholera"></i>3.2.3 Cholera</span><span><i class="dash"></i>Dashed: key idea</span></div>
            <p class="small muted mt">${links.length} questions, ${mapMarks} marks. Answers count towards your mastery. <a href="#cl-list" data-skip>Skip to the list of connections</a>.</p></div>
          <p class="cl-small-note notice small">On a small screen the map is shown as a list. Choose <strong>Explain and practise</strong> on any connection below.</p>
          <section class="card mb cl-detail" id="cl-detail" aria-labelledby="cl-detail-h" hidden></section>
          <section class="card mb" id="cl-list" aria-labelledby="cl-list-h" tabindex="-1"><h2 id="cl-list-h">All ${links.length} connections</h2>
            <p class="small muted">Each connection reads in order: <em>from</em>, relationship, <em>to</em>.</p>
            <table class="cl-table"><caption class="sr-only">All connections on the concept map: from, relationship, to</caption><thead><tr><th scope="col">#</th><th scope="col">From</th><th scope="col">Relationship</th><th scope="col">To</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>${raw(listRows)}</tbody></table></section>
        </section>
        <section class="pane cl-pane" id="cl-pane-cases" role="tabpanel" aria-labelledby="cl-tab-cases" data-pane="cases" tabindex="0" ${initial === "cases" ? "" : "hidden"}>
          <p class="small muted">Each case gives a situation and data, then questions that need more than one topic. Data marked hypothetical are invented for practice; real data are cited. Nothing here is medical advice.</p>
          ${raw(casesHTML)}
          ${C.sources && C.sources.length ? raw(h`<section class="card" aria-labelledby="cl-src-h"><h2 id="cl-src-h">All sources</h2><ol class="cl-sources">${raw(C.sources.map((s) => h`<li>${s.text} <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a></li>`).join(""))}</ol></section>`) : ""}
        </section>
        <section class="pane cl-pane" id="cl-pane-exam" role="tabpanel" aria-labelledby="cl-tab-exam" data-pane="exam" tabindex="0" ${initial === "exam" ? "" : "hidden"}>
          <div class="card mb"><div class="card-head"><h2>Cross-topic exam questions</h2><span class="badge navy">${examQs.length} questions · ${examMarks} marks</span></div>
            <p class="small muted">Original questions in the OxfordAQA style. Every question draws on at least two of the three topics. Objective questions are marked automatically; written answers are self-marked against the mark scheme. Your latest attempt at each question counts, as everywhere on the site; attempts made after a hint or as an immediate retry do not count.</p>
            <div class="cl-score"><div class="stat"><span class="v" id="cl-escore">–</span><span class="l" id="cl-edone"></span></div></div></div>
          <div id="cl-eqs"></div>
          <section class="card mt cl-diag" id="cl-diag" aria-labelledby="cl-diag-h" aria-live="polite"></section>
        </section>
        <section class="pane cl-pane" id="cl-pane-deck" role="tabpanel" aria-labelledby="cl-tab-deck" data-pane="deck" tabindex="0" ${initial === "deck" ? "" : "hidden"}><div id="cl-deck"></div></section>
      </div>
    </div>`);
    B.app.render(page, { title: `${C.topics.join("–")} consolidation`, crumbs });

    const reduce = () => (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || document.documentElement.classList.contains("reduce-motion");

    // ----- tabs (ARIA tabs pattern: arrows, Home, End) -----
    const tabs = $$('[role="tab"]', page);
    let current = initial;
    function showTab(name, focus) {
      current = name;
      tabs.forEach((t) => { const on = t.dataset.tab === name; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      $$(".cl-pane", page).forEach((p) => (p.hidden = p.dataset.pane !== name));
      try { history.replaceState(null, "", `#/cluster/${id}/${name}`); } catch (e) { /* file:// in some browsers */ }
      if (name === "exam") renderDiag(); if (name === "deck") renderDeck();
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => showTab(t.dataset.tab));
      t.addEventListener("keydown", (e) => { let j = null; if (e.key === "ArrowRight") j = (i + 1) % tabs.length; else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length; else if (e.key === "Home") j = 0; else if (e.key === "End") j = tabs.length - 1; if (j !== null) { e.preventDefault(); showTab(tabs[j].dataset.tab, true); } });
    });
    $$("[data-go]", page).forEach((b) => b.addEventListener("click", () => { showTab(b.dataset.go, true); window.scrollTo({ top: 0, behavior: "auto" }); }));

    // ----- map interaction -----
    const svgEl = $(".cl-svg", page), detail = $("#cl-detail", page), caption = $("#cl-caption", page);
    let returnTo = null;
    const clearSel = () => { svgEl.classList.remove("has-sel"); $$(".on, .sel", svgEl).forEach((x) => x.classList.remove("on", "sel")); };
    const markNode = (nid) => { const g = $(`[data-node="${nid}"]`, svgEl); if (g) g.classList.add("on"); };
    function highlightLink(lid) { clearSel(); svgEl.classList.add("has-sel"); const l = linkById[lid]; $$(`[data-link="${lid}"]`, svgEl).forEach((x) => x.classList.add("on")); markNode(l.from); markNode(l.to); }
    function highlightNode(nid) { clearSel(); svgEl.classList.add("has-sel"); markNode(nid); $(`[data-node="${nid}"]`, svgEl).classList.add("sel"); links.filter((l) => l.from === nid || l.to === nid).forEach((l) => { $$(`[data-link="${l.id}"]`, svgEl).forEach((x) => x.classList.add("on")); markNode(l.from); markNode(l.to); }); }
    function showDetail(html, focus) {
      detail.hidden = false; detail.innerHTML = html;
      if (focus) $("#cl-detail-h", detail).focus({ preventScroll: true });
      detail.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" });
    }
    const stmtList = (ids) => h`<details class="mt"><summary class="small">Specification statements this link draws on (${ids.length})</summary><ul class="cl-stmts">${raw(ids.map((s) => h`<li><a class="mono" href="#/topic/${subOfStmt(s)}">${s}</a> ${S.stmt[s] || ""}</li>`).join(""))}</ul></details>`;
    function openLink(lid, opts = {}) {
      const l = linkById[lid]; if (!l) return; if (opts.from) returnTo = opts.from;
      highlightLink(lid); const a = node[l.from], b = node[l.to]; const prev = links[l.n - 2], next = links[l.n];
      showDetail(h`<div class="row" style="justify-content:space-between"><span class="badge teal">Connection ${l.n} of ${links.length}</span><span class="badge mono">${l.question.ref}</span></div>
        <h2 id="cl-detail-h" tabindex="-1" class="mt">${a.label} → ${b.label}</h2>
        <div class="cl-path"><a class="badge navy" href="${a.href}">${a.ref} ${a.label}</a><span class="rel">${l.label}</span><a class="badge navy" href="${b.href}">${b.ref} ${b.label}</a></div>
        <p>${l.explanation}</p>${raw(stmtList(l.stmts))}
        <h3 class="mt">Apply the link</h3><div class="cl-mq"></div>
        <div class="cl-dn">${prev ? raw(h`<button class="btn sm" type="button" data-open-link="${prev.id}">← Connection ${prev.n}</button>`) : raw("<span></span>")}<button class="btn sm ghost" type="button" data-back>Back to where I was</button>${next ? raw(h`<button class="btn sm" type="button" data-open-link="${next.id}">Connection ${next.n} →</button>`) : raw("<span></span>")}</div>`, opts.focus !== false);
      $(".cl-mq", detail).append(B.questions.render(l.question, { srLabel: `Question on connection ${l.n}`, onAnswer: renderDiag }));
    }
    function openNode(nid, opts = {}) {
      const n = node[nid]; if (!n) return; if (opts.from) returnTo = opts.from;
      highlightNode(nid); const conns = links.filter((l) => l.from === nid || l.to === nid);
      showDetail(h`<span class="badge">${n.ref}</span><h2 id="cl-detail-h" tabindex="-1" class="mt">${n.label}</h2><p>${n.desc}</p>
        <div class="row"><a class="btn primary" href="${n.href}">Open ${n.ref}</a><button class="btn ghost" type="button" data-back>Back to where I was</button></div>
        <h3 class="mt">Connections (${conns.length})</h3><ul class="cl-conn">${raw(conns.map((l) => h`<li><button class="btn sm" type="button" data-open-link="${l.id}"><span class="mono">${l.n}.</span> ${node[l.from].label} <em>${l.label}</em> ${node[l.to].label}</button></li>`).join(""))}</ul>`, opts.focus !== false);
    }
    function goBack() {
      const t = returnTo && document.body.contains(returnTo) && returnTo.getClientRects().length ? returnTo : null;
      if (t) { t.focus({ preventScroll: true }); t.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "center" }); } else $("#cl-list", page).focus();
    }
    const describe = (g) => {
      if (g.dataset.link) { const l = linkById[g.dataset.link]; return h`<strong>${l.n}.</strong> ${node[l.from].label} <em>${l.label}</em> ${node[l.to].label}`; }
      const n = node[g.dataset.node]; const c = links.filter((l) => l.from === n.id || l.to === n.id).length; return h`<strong>${n.label}</strong> (${n.ref}): ${n.desc} <span class="muted">(${c} connection${c === 1 ? "" : "s"})</span>`;
    };
    $$(".cl-node, .cl-link", svgEl).forEach((g) => {
      const act = () => (g.dataset.link ? openLink(g.dataset.link, { from: g }) : openNode(g.dataset.node, { from: g }));
      g.addEventListener("click", act);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); act(); } });
      const show = () => { caption.innerHTML = describe(g); }; g.addEventListener("mouseenter", show); g.addEventListener("focus", show);
    });
    $("#cl-pane-map", page).addEventListener("keydown", (e) => { if (e.key === "Escape") { clearSel(); caption.textContent = "Selection cleared. Tab to a box or numbered circle and press Enter to open it."; } });
    $("#cl-pane-map", page).addEventListener("click", (e) => {
      const ol = e.target.closest("[data-open-link]"); if (ol) { e.preventDefault(); openLink(ol.dataset.openLink, ol.closest("#cl-list") ? { from: ol } : {}); return; }
      if (e.target.closest("[data-back]")) { e.preventDefault(); goBack(); return; }
      if (e.target.closest("[data-skip]")) { e.preventDefault(); const lst = $("#cl-list", page); lst.focus({ preventScroll: true }); lst.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" }); }
    });

    // ----- cases -----
    $$(".cl-intro table", page).forEach((t) => { const w = el('<div class="cl-tablewrap" tabindex="0" role="region" aria-label="Data table"></div>'); t.replaceWith(w); w.append(t); });
    C.caseStudies.forEach((cs) => { const box = $(`.cl-qs[data-case="${cs.id}"]`, page); cs.questions.forEach((q, i) => { box.append(el(h`<h3 class="cl-qh">Question ${i + 1}</h3>`)); box.append(B.questions.render(q, { srLabel: `Case ${cs.title}, question ${i + 1}`, onAnswer: renderDiag })); }); });

    // Data tables inside question stems get the same scrollable wrapper as the case intros (only if ever too wide).
    const wrapStemTables = () => $$(".q-stem table.cl-data", page).forEach((t) => { if (t.parentElement.classList.contains("cl-tablewrap")) return; const w = el('<div class="cl-tablewrap" tabindex="0" role="region" aria-label="Data table"></div>'); t.replaceWith(w); w.append(t); });
    // ----- exam + diagnostics -----
    const eqs = $("#cl-eqs", page);
    examQs.forEach((q, i) => { eqs.append(el(h`<h3 class="cl-qh">Question ${i + 1} <span class="muted small">(${q.marks} mark${q.marks === 1 ? "" : "s"})</span></h3>`)); eqs.append(B.questions.render(q, { srLabel: `Exam question ${i + 1}`, onAnswer: renderDiag })); });
    wrapStemTables(); new MutationObserver(wrapStemTables).observe(page, { childList: true, subtree: true });
    let scope = "exam";
    function renderDiag() {
      const attempts = B.store.get().attempts;
      const ex = diagnose(examQs, attempts, cfg);
      $("#cl-escore", page).textContent = ex.answered ? `${ex.score} / ${ex.max}` : "–";
      $("#cl-edone", page).textContent = ex.answered ? `marks on the ${ex.answered} of ${examQs.length} questions you have answered (${examMarks} marks in total)` : `none of the ${examQs.length} questions answered yet`;
      const d = scope === "exam" ? ex : diagnose(allQs, attempts, cfg);
      const box = $("#cl-diag", page);
      const bandBadge = (r) => r.band === "weak" ? '<span class="badge rose">Revisit</span>' : r.band === "strong" ? '<span class="badge sage">Secure</span>' : '<span class="badge amber">Developing</span>';
      const bar = (r) => h`<div class="cl-bar" role="img" aria-label="${r.pct}%"><span class="${r.band}" style="width:${r.pct}%"></span></div>`;
      const scopeHTML = h`<fieldset class="cl-scope"><legend>Based on</legend><label><input type="radio" name="cl-scope" value="exam" ${scope === "exam" ? "checked" : ""}> Exam questions only</label><label><input type="radio" name="cl-scope" value="all" ${scope === "all" ? "checked" : ""}> Every question on this page (map, cases and exam: ${allQs.length})</label></fieldset>`;
      if (!d.answered) { box.innerHTML = h`<h2 id="cl-diag-h">Diagnostic panel</h2>${raw(scopeHTML)}<div class="empty">${raw(icons.progress)}<h3>No answers yet</h3><p>Answer some questions and this panel shows how secure you are on each topic and each specification statement, with links to the notes to revisit.</p></div>`; wireScope(box); return; }
      const tRows = d.topics.map((r) => h`<tr><td data-h="Topic"><a href="#/library/3.2/${r.ref}">${r.ref} ${(S.topic[r.ref] || {}).title || ""}</a></td><td data-h="Questions">${r.n}</td><td data-h="Marks">${r.score} / ${r.max}</td><td data-h="Score">${raw(bar(r))} ${r.pct}%</td><td>${raw(bandBadge(r))}</td></tr>`).join("");
      const sRows = d.stmts.map((r) => h`<tr><td data-h="Statement"><a class="mono" href="#/topic/${subOfStmt(r.id)}">${r.id}</a> <span class="stx">${S.stmt[r.id] || ""}</span></td><td data-h="Questions">${r.n}${r.n < 2 ? raw(' <span class="badge" title="Fewer than two questions: treat this as a rough guide">limited evidence</span>') : ""}</td><td data-h="Marks">${r.score} / ${r.max}</td><td data-h="Score">${raw(bar(r))} ${r.pct}%</td><td>${raw(bandBadge(r))}</td></tr>`).join("");
      const weakSubs = [...new Set(d.stmts.filter((r) => r.band === "weak").map((r) => subOfStmt(r.id)))];
      const recs = weakSubs.length ? weakSubs.map((ref) => h`<li><a href="#/topic/${ref}">${ref} ${(S.sub[ref] || {}).title || ""}</a>: re-read the notes on ${d.stmts.filter((r) => r.band === "weak" && subOfStmt(r.id) === ref).map((r) => r.id).join(", ")}, then return here and retry the questions you missed.</li>`).join("") : "<li>No statement is below the threshold on the questions you have answered. Keep it secure with the combined deck, and try the questions you have not answered yet.</li>";
      box.innerHTML = h`<div class="card-head"><h2 id="cl-diag-h">Diagnostic panel</h2><span class="badge navy">${d.score} / ${d.max} (${d.pct}%) on ${d.answered} of ${d.total} questions</span></div>${raw(scopeHTML)}
        <h3>By topic</h3><table><thead><tr><th scope="col">Topic</th><th scope="col">Questions</th><th scope="col">Marks</th><th scope="col">Score</th><th scope="col">Status</th></tr></thead><tbody>${raw(tRows)}</tbody></table>
        <h3 class="mt">By specification statement</h3><table><thead><tr><th scope="col">Statement</th><th scope="col">Questions</th><th scope="col">Marks</th><th scope="col">Score</th><th scope="col">Status</th></tr></thead><tbody>${raw(sRows)}</tbody></table>
        <h3 class="mt">What to revisit</h3><ul>${raw(recs)}</ul>
        <p class="tiny muted">Revisit = below ${cfg.weakBelowPct}%; secure = ${cfg.strongAtPct}% or above. Uses your latest attempt at each question (hinted and immediate-retry attempts excluded). A question tagged with several statements counts towards each of them, and a question spanning topics counts towards each topic. Written answers are self-marked.</p>`;
      wireScope(box);
    }
    function wireScope(box) { $$('input[name="cl-scope"]', box).forEach((r) => r.addEventListener("change", () => { scope = r.value; renderDiag(); })); }

    // ----- combined deck -----
    let deckBuilt = false;
    function renderDeck() {
      if (deckBuilt) return; deckBuilt = true;
      const host = $("#cl-deck", page); const { cards, from } = combinedDeck(C);
      const missing = C.topics.filter((t) => !from.some((f) => f.t === t));
      const stats = B.flashcards.stats(cards);
      host.innerHTML = h`<div class="card mb"><div class="card-head"><h2>Combined flashcard deck</h2><span class="badge navy">${cards.length} cards</span></div>
        <p class="small muted">Built from each topic's consolidation deck${from.length ? "" : " (none published yet)"}, plus ${(C.bridgeCards || []).length} cards that bridge the topics. Read the question, answer it aloud or on paper, then flip and grade yourself honestly; the schedule adapts. Keyboard: Space or Enter flips the card; 1 = Not known, 2 = Unsure, 3 = Known.</p>
        <ul class="small">${raw(from.map((f) => h`<li>${f.t} ${(S.topic[f.t] || {}).title}: ${f.n} cards · <a href="#/flashcards/deck:${f.t}">review this topic's deck on its own</a></li>`).join(""))}${raw(missing.map((t) => h`<li>${t} ${(S.topic[t] || {}).title}: deck not published yet</li>`).join(""))}<li>Bridging cards: ${(C.bridgeCards || []).length}</li></ul>
        <div class="grid grid-4"><div class="stat"><span class="v">${stats.total}</span><span class="l">cards</span></div><div class="stat"><span class="v">${stats.due}</span><span class="l">due now</span></div><div class="stat"><span class="v">${stats.known}</span><span class="l">last graded Known</span></div><div class="stat"><span class="v">${stats.seen}</span><span class="l">seen at least once</span></div></div>
        <div class="row mt"><label class="small">Mode: <select id="cl-mode"><option value="due">Due cards first</option><option value="all">All cards</option><option value="difficult">Difficult cards only</option></select></label><button class="btn" type="button" id="cl-shuffle">Shuffle</button></div></div>
        <div id="cl-stage"></div>`;
      let queue = [], i = 0;
      const build = () => { const mode = $("#cl-mode", host).value; const due = B.flashcards.dueCards(cards); queue = mode === "due" ? due.concat(cards.filter((c) => !due.includes(c))) : mode === "difficult" ? B.flashcards.difficultCards(cards) : cards.slice(); i = 0; show(false); };
      $("#cl-mode", host).addEventListener("change", build);
      $("#cl-shuffle", host).addEventListener("click", () => { queue = shuffle(queue); i = 0; show(true); });
      function show(focus) {
        const stage = $("#cl-stage", host);
        if (!queue.length) { stage.innerHTML = `<div class="card"><div class="empty">${icons.cards}<h3>Nothing in this mode</h3><p>Switch the mode to “All cards” to keep practising.</p></div></div>`; return; }
        if (i >= queue.length) { stage.innerHTML = `<div class="card"><div class="empty">${icons.check}<h3>Deck finished</h3><p>You reviewed ${queue.length} cards. Come back when they are due.</p><button class="btn primary" type="button" id="cl-again">Go again</button></div></div>`; $("#cl-again", stage).onclick = build; $("#cl-again", stage).focus(); return; }
        const c = queue[i]; const st = B.store.get().cards[c.id]; const due = st ? (st.due <= Date.now() ? "due now" : "due " + fmtDate(st.due)) : "new card";
        stage.innerHTML = h`<div class="fc-stage"><div class="fc-meta"><span>Card ${i + 1} of ${queue.length}</span><span><a href="#/topic/${c.ref}">${c.ref}</a> · ${due}</span></div>
          <div class="fc" id="cl-fc" tabindex="0" role="button" aria-pressed="false" aria-label="Flashcard ${i + 1}. Press Space or Enter to flip."><div class="face front"><div class="lbl">Question</div><div class="txt">${c.front}</div></div><div class="face back"><div class="lbl">Answer</div><div class="txt">${c.back}</div></div></div>
          <div class="fc-controls" id="cl-grade" hidden><button class="btn danger" type="button" data-g="unknown">1 · Not known</button><button class="btn" type="button" data-g="unsure">2 · Unsure</button><button class="btn primary" type="button" data-g="known">3 · Known</button></div>
          <div class="fc-controls" id="cl-flipwrap"><button class="btn" type="button" id="cl-flip">Flip card</button></div></div>`;
        const fc = $("#cl-fc", stage);
        const flip = () => { fc.classList.toggle("flipped"); const f = fc.classList.contains("flipped"); fc.setAttribute("aria-pressed", f); $("#cl-grade", stage).hidden = !f; $("#cl-flipwrap", stage).hidden = f; if (f) $("#cl-grade button", stage).focus(); };
        fc.addEventListener("click", flip); $("#cl-flip", stage).addEventListener("click", flip);
        fc.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
        $$("#cl-grade button", stage).forEach((b) => b.addEventListener("click", () => { B.flashcards.review(c.id, c.ref, b.dataset.g); i++; show(true); }));
        if (focus) fc.focus({ preventScroll: true });
      }
      host.addEventListener("keydown", (e) => { if (e.target.matches("input,select,textarea")) return; const g = $("#cl-grade", host); if (g && !g.hidden && ["1", "2", "3"].includes(e.key)) { e.preventDefault(); $(`#cl-grade button[data-g="${["unknown", "unsure", "known"][+e.key - 1]}"]`, host).click(); } });
      build();
    }

    renderDiag();
    if (initial === "deck") renderDeck();
  };
})(window.BIO);
