window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, esc, fmtDate } = B.util;
  const STATUS = { not_started: ["Not yet written", ""], draft: ["Draft", "amber"], reviewed: ["Scientifically reviewed", "sage"], verified: ["Verified against specification", "teal"], approved: ["Approved for release", "navy"] };
  const statusBadge = (st) => { const [l, c] = STATUS[st] || STATUS.not_started; return h`<span class="status-${st} badge ${c}"><span class="status-dot"></span>${l}</span>`; };
  const contentOf = (ref) => (B.content || {})[ref] || { status: "not_started" };
  const findSub = (ref) => { for (const u of B.spec.units) for (const t of u.topics) for (const s of t.subsections) if (s.ref === ref) return { u, t, s }; return null; };
  const flatSubs = () => B.spec.units.flatMap((u) => u.topics.flatMap((t) => t.subsections.map((s) => ({ u, t, s }))));
  B.views.lib = { STATUS, statusBadge, contentOf, findSub };

  // Line-art motifs for the four unit tiles (drawn by stroke animation; decorative only, aria-hidden).
  const MOTIFS = {
    "3.1": '<path d="M12 44c0-16 8-28 24-28s24 12 24 28" /><circle cx="36" cy="40" r="7"/><path d="M20 52c6-6 26-6 32 0"/>',
    "3.2": '<path d="M36 56S10 40 10 24a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 16-26 32-26 32z"/><path d="M14 30h10l4-8 6 16 4-8h12"/>',
    "3.3": '<path d="M12 56c8-24 24-36 48-40"/><path d="M20 44c10-2 22 0 28 8"/><path d="M28 30c8-2 16 2 20 10"/><circle cx="52" cy="22" r="5"/>',
    "3.4": '<path d="M8 36h12l6-16 8 32 6-16h20"/><circle cx="60" cy="36" r="4"/><path d="M8 50h52" stroke-dasharray="3 5"/>',
  };
  const motif = (ref) => `<svg class="motif" viewBox="0 0 72 64" aria-hidden="true">${MOTIFS[ref] || ""}</svg>`;
  B.views.library = function (uref, tref) {
    if (uref && tref) return topicIndex(uref, tref);
    if (uref) return unitPage(uref);
    const cards = B.spec.units.map((u) => {
      const subs = u.topics.flatMap((t) => t.subsections); const authored = subs.filter((s) => contentOf(s.ref).status !== "not_started").length;
      const cov = B.progress.coverage((x) => x.unit === u.ref);
      return h`<a class="tile unit u${u.ref.replace(".", "-")}" href="#/library/${u.ref}">${raw(motif(u.ref))}<span class="ref">${u.ref} · ${u.code} · ${u.level}</span><h3>${u.short}</h3><div class="meta"><span>${u.topics.length} topics · ${subs.length} subsections</span><span class="badge ${authored ? "sage" : ""}">${authored}/${subs.length} written</span></div><div class="progress mt"><span style="width:${cov.pct}%"></span></div><div class="tiny muted mt" style="margin-top:.3rem">${cov.completed} completed by you</div></a>`;
    }).join("");
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">Revision Library</div><h1>Units 1 to 4</h1><p class="lede">Organised exactly as the OxfordAQA 9610 specification, section 3. Open a unit to see its topics and numbered subsections.</p></div></div>
      <div class="grid grid-2">${raw(cards)}</div>
      <div class="card mt"><h3>Unit 5: Synoptic paper (BL05)</h3><p class="small muted">${B.spec.unit5.exam.structure}</p><a class="btn" href="#/synoptic">Go to the Synoptic hub</a></div>`, { title: "Library", crumbs: [{ label: "Library" }] });
  };

  function unitPage(uref) {
    const u = B.spec.units.find((x) => x.ref === uref); if (!u) return B.app.render("<div class='card'>Unknown unit.</div>");
    const topics = u.topics.map((t) => { const authored = t.subsections.filter((s) => contentOf(s.ref).status !== "not_started").length; const cov = B.progress.coverage((x) => x.topic === t.ref); return h`<a class="tile" href="#/library/${u.ref}/${t.ref}"><span class="ref">${t.ref}</span><h3>${t.title}</h3><div class="meta"><span>${t.subsections.length} subsection${t.subsections.length === 1 ? "" : "s"}</span><span class="badge ${authored ? "sage" : ""}">${authored}/${t.subsections.length} written</span><span>${cov.completed} completed</span></div></a>`; }).join("");
    const rps = B.spec.practicals.filter((p) => p.unit === u.ref);
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">${u.code} · International ${u.level}</div><h1>${u.title}</h1><p class="lede">${u.exam.structure} Exam: ${u.exam.duration_min} minutes, ${u.exam.marks} marks.</p></div></div>
      <div class="grid grid-2">${raw(topics)}</div>
      <div class="card mt"><h3>Required practicals in this unit</h3><ul>${raw(rps.map((p) => h`<li><a href="#/lab/${p.n}">Required practical ${p.n}:</a> ${p.title}</li>`).join(""))}</ul></div>`, { title: u.short, crumbs: [{ label: "Library", href: "#/library" }, { label: u.short }] });
  }

  function topicIndex(uref, tref) {
    const u = B.spec.units.find((x) => x.ref === uref); const t = u && u.topics.find((x) => x.ref === tref); if (!t) return B.app.render("<div class='card'>Unknown topic.</div>");
    const rows = t.subsections.map((s) => { const c = contentOf(s.ref); const cov = B.store.get().coverage[s.ref] || {}; return h`<a class="tile" href="#/topic/${s.ref}"><span class="ref">${s.ref}</span><h3>${s.title}</h3><div class="meta">${raw(statusBadge(c.status))}<span>${s.statements.length} learning statement${s.statements.length === 1 ? "" : "s"}</span>${cov.completed ? raw('<span class="badge teal">✓ completed</span>') : cov.visited ? raw('<span class="badge">visited</span>') : ""}</div></a>`; }).join("");
    const cards = B.flashcards.all(tref); const qs = t.subsections.flatMap((s) => contentOf(s.ref).questions || []); const cons = (B.consolidation || {})[tref];
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">${u.short}</div><h1>${t.ref} ${t.title}</h1></div><div class="row">${cards.length ? raw(h`<a class="btn" href="#/flashcards/${t.ref}">Topic flashcards (${cards.length})</a>`) : ""}${qs.length ? raw(h`<a class="btn" href="#/exam/topic/${t.ref}">All practice questions (${qs.length})</a>`) : ""}${cons ? raw(h`<a class="btn primary" href="#/consolidate/${t.ref}">Topic consolidation &amp; assessment</a>`) : ""}</div></div>
      <div class="grid grid-2">${raw(rows)}</div>
      ${cons ? raw(h`<div class="card mt"><div class="card-head"><h3>Consolidation</h3>${raw(statusBadge(cons.status))}</div><p class="small muted">All subsections of this topic are written. The consolidation page links them together, offers a combined ${B.flashcards.all("deck:" + t.ref).length}-card deck and a ${cons.assessment.marks}-mark topic assessment with diagnostic feedback.</p><a class="btn primary" href="#/consolidate/${t.ref}">Open consolidation</a></div>`) : ""}`, { title: t.title, crumbs: [{ label: "Library", href: "#/library" }, { label: u.short, href: `#/library/${u.ref}` }, { label: t.ref }] });
  }

  // ---------- Subsection (topic) page ----------
  // #/topic/<ref>/<tab>[/<question id>] opens a tab directly (learn | check | exam; older names notes, practice,
  // diagrams, focus are mapped) and, with a question id, scrolls to that question and highlights it.
  const TAB_ALIAS = { learn: "notes", notes: "notes", diagrams: "notes", check: "practice", practice: "practice", exam: "exam", focus: "exam" };
  B.views.topicTab = function (ref, tab, qid) { B.views.topic(ref); const root = document.getElementById("content"); const want = TAB_ALIAS[tab] || tab;
    const tabBtn = root.querySelector(`[role="tab"][data-tab="${want}"]`) || root.querySelector(`[role="tab"][data-tab="${tab}"]`) || (want === "practice" ? root.querySelector('[role="tab"][data-tab="check"]') : null) || (want === "exam" ? root.querySelector('[role="tab"][data-tab="focus"]') : null);
    if (tabBtn) tabBtn.click();
    if (qid) { const q = Array.from(root.querySelectorAll("section.q[data-qid]")).find((x) => x.dataset.qid === qid); if (q) { const pane = q.closest(".pane"); if (pane && pane.hidden) { const b = root.querySelector(`[role="tab"][data-tab="${pane.dataset.pane}"]`); if (b) b.click(); } q.classList.add("q-target"); setTimeout(() => q.scrollIntoView({ block: "center" }), 60); const f = q.querySelector("input, button, textarea, select"); if (f) setTimeout(() => f.focus({ preventScroll: true }), 120); } } };
  B.views.topic = function (ref) {
    const hit = findSub(ref); if (!hit) return B.app.render("<div class='card'>Unknown specification reference.</div>");
    const { u, t, s } = hit; const c = contentOf(ref); const st = B.store.get(); B.store.visit(ref);
    const all = flatSubs(); const idx = all.findIndex((x) => x.s.ref === ref); const prev = all[idx - 1], next = all[idx + 1];
    const cov = st.coverage[ref] || {};
    const rps = B.spec.practicals.filter((p) => p.links.includes(ref));
    const statements = s.statements.map((x) => h`<label class="check-row"><input type="checkbox" data-id="${x.id}" ${st.checklist[x.id] ? "checked" : ""}><span>${x.text} ${raw(x.tags.map((tg) => `<span class="badge ${tg === "P" ? "sage" : tg === "M" ? "navy" : "amber"}">${{ P: "practical", M: "maths", E: "skill" }[tg]}</span>`).join(" "))}</span></label>`).join("");
    const authored = c.status !== "not_started";
    const html = el(h`<div>
      <div class="page-head"><div><div class="eyebrow">${u.short} · ${t.ref} ${t.title}</div><h1>${s.ref} ${s.title}</h1><div class="row">${raw(statusBadge(c.status))}<span class="badge mono">${u.code}</span>${raw(rps.map((p) => h`<a class="badge sage" href="#/lab/${p.n}">RP${p.n}</a>`).join(""))}</div></div>
        <div class="row"><button class="btn ${cov.completed ? "" : "primary"}" id="complete">${cov.completed ? "Marked complete ✓ (undo)" : "Mark as complete"}</button></div></div>

      <details class="acc" open><summary>Specification requirements (${s.statements.length}): tick each one you can do</summary><div class="acc-body">${raw(statements)}<p class="tiny muted mt">Source: OxfordAQA 9610 specification v${B.spec.meta.specVersion}, section ${s.ref}. Statements are paraphrased; <a href="${B.spec.meta.specPdfUrl}" target="_blank" rel="noopener">read the official wording</a>.</p></div></details>

      ${authored ? raw(authoredHTML(c, ref)) : raw(`<div class="card"><div class="empty">${icons.book}<h3>Notes for this subsection have not been written yet</h3><p>The specification requirements above are complete and verified, so you can still use them as a checklist with your textbook and class notes. Diagrams, questions and flashcards will appear here once this subsection is authored and reviewed.</p></div></div>`)}

      <div class="row mt-l" style="justify-content:space-between">${prev ? raw(h`<a class="btn" href="#/topic/${prev.s.ref}">← ${prev.s.ref} ${prev.s.title}</a>`) : raw("<span></span>")}${next ? raw(h`<a class="btn" href="#/topic/${next.s.ref}">${next.s.ref} ${next.s.title} →</a>`) : ""}</div>
    </div>`);
    B.app.render(html, { title: `${s.ref} ${s.title}`, crumbs: [{ label: "Library", href: "#/library" }, { label: u.short, href: `#/library/${u.ref}` }, { label: t.ref, href: `#/library/${u.ref}/${t.ref}` }, { label: s.ref }] });
    $$(".check-row input", html).forEach((cb) => cb.addEventListener("change", () => B.store.tick(cb.dataset.id, cb.checked)));
    $("#complete", html).addEventListener("click", () => { B.store.complete(ref, !cov.completed); B.views.topic(ref); });
    if (authored) wireAuthored(html, c, ref);
  };

  function authoredHTML(c, ref) {
    const figs = (c.diagrams || []).map(figHTML).join("");
    const syn = (c.synoptic || []).map((x) => h`<li><a href="#/topic/${x.ref}">${x.ref}</a>: ${x.text}</li>`).join("");
    const nQ = (c.questions || []).length, nF = (c.flashcards || []).length;
    const ints = interactivesOf(c);
    const notes = typeof c.notes === "function" ? c.notes() : c.notes;
    const bannerImg = c.banner ? B.views.photo(c.banner, { ratio: "3:1" }) : ""; const banner = bannerImg ? `<div class="banner">${bannerImg}<div class="banner-text">${esc(c.bannerText || "")}</div></div>` : "";
    const focus = (c.focus || []).length;
    const place = (B.placements || {})[ref];
    if (place) return banner + integratedHTML(c, ref, { notes, figList: c.diagrams || [], ints, syn, nQ, nF, focus, place });
    return banner + `
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected="true" data-tab="notes">Notes</button>
        <button role="tab" aria-selected="false" data-tab="diagrams">Diagrams${ints.length ? " & animation" : ""}</button>
        <button role="tab" aria-selected="false" data-tab="exam">Exam focus</button>
        <button role="tab" aria-selected="false" data-tab="check">Quick check</button>
        <button role="tab" aria-selected="false" data-tab="practice">Practice (${nQ})</button>
        ${focus ? `<button role="tab" aria-selected="false" data-tab="focus">Biology in Focus (${focus})</button>` : ""}
      </div>
      <div class="tabpanes">
        <div class="pane card pad-l" data-pane="notes"><div class="notes">${notes}</div></div>
        <div class="pane" data-pane="diagrams" hidden>${figs}${ints.map((x, i) => `<div class="card interactive-host" data-int="${i}"></div>`).join("")}</div>
        <div class="pane card" data-pane="exam" hidden><h3>Exam focus</h3><div class="notes">${c.examFocus || ""}</div><h3 class="mt">Synoptic connections</h3><ul>${syn || "<li class='muted'>None recorded.</li>"}</ul></div>
        <div class="pane" data-pane="check" hidden><p class="small muted">Three to five short questions on this subsection. Objective questions are marked immediately; every attempt is recorded.</p><div id="quickcheck"></div></div>
        <div class="pane" data-pane="practice" hidden><div class="row mb">${nF ? `<a class="btn" href="#/flashcards/${ref}">Flashcards for this subsection (${nF})</a>` : ""}</div><div id="practice"></div>${B.views.pastpapersFor ? B.views.pastpapersFor(ref) : ""}</div>
        ${focus ? `<div class="pane" data-pane="focus" hidden><p class="small muted">Real-world biology with a short explanation and one question each. A photograph appears here only when a verified, licensed image has been supplied.</p><div id="focus"></div></div>` : ""}
      </div>`;
  }

  // Integrated layout (teacher request 2026-11-07): diagrams and interactive models sit inside the notes, directly after
  // the numbered section they illustrate, so there are three tabs instead of six. Placement maps live in
  // data/placements.js: { "<subsection ref>": { "<diagram id>" | "int:<index>": <section number, 1-based> } }.
  // Anything not mapped is shown at the end of the notes, so nothing is ever lost.
  function figHTML(d) { return h`<figure class="figure" data-fig="${d.id}"><div class="fig-tools"><span class="review-flag badge ${d.status === "reviewed" || d.status === "verified" ? "sage" : "amber"}">${d.status === "reviewed" ? "diagram reviewed" : d.status === "verified" ? "diagram verified" : "diagram awaiting review"}</span><button class="btn sm zoom-out" aria-label="zoom out">−</button><button class="btn sm zoom-in" aria-label="zoom in">+</button><button class="btn sm zoom-reset">Reset</button></div><div class="fig-view">${raw(d.svg)}</div><figcaption><strong>${d.title}.</strong> ${d.caption}</figcaption><details class="fig-desc"><summary>Text description</summary>${d.alt}</details></figure>`; }
  function integratedHTML(c, ref, o) {
    const tpl = document.createElement("template"); tpl.innerHTML = o.notes;
    const secs = Array.from(tpl.content.children).filter((n) => n.tagName === "H2");
    // Many notes already draw a diagram inline (same art function). Swap that drawing for the full figure (caption, zoom,
    // review badge) exactly where the text uses it, instead of showing the diagram twice.
    const words = (s) => new Set(String(s).toLowerCase().replace(/\s+/g, " ").split(/[^a-z0-9⁺⁻₀-₉]+/).filter((w) => w.length > 1));
    const sim = (A, Bs) => { if (!A.size || !Bs.size) return 0; let n = 0; for (const w of A) if (Bs.has(w)) n++; return n / Math.max(A.size, Bs.size); };
    const sigOf = (svgHtml) => { const x = document.createElement("template"); x.innerHTML = svgHtml; const s = x.content.querySelector("svg"); return s ? { text: words(s.textContent), html: s.outerHTML.replace(/\s+/g, " ") } : null; };
    const noteSvgs = Array.from(tpl.content.querySelectorAll("svg")).filter((s) => !s.closest("figure[data-fig]"));
    const embedded = new Set();
    // Score every (diagram, drawing) pair and assign the strongest pairs first, so a near-identical neighbour (e.g. step 1
    // v step 2 of replication) can never take another diagram's place. Ties keep document order.
    const pairs = []; o.figList.forEach((d, di) => { const sig = sigOf(d.svg); if (!sig) return; noteSvgs.forEach((s, si) => { const sc = sig.text.size >= 3 ? sim(sig.text, words(s.textContent)) : (s.outerHTML.replace(/\s+/g, " ") === sig.html ? 1 : 0); if (sc >= 0.6) pairs.push({ d, s, sc, di, si }); }); });
    pairs.sort((x, y) => y.sc - x.sc || x.di - y.di || x.si - y.si); const usedS = new Set();
    for (const p of pairs) { if (embedded.has(p.d.id) || usedS.has(p.s)) continue; usedS.add(p.s); const d = p.d, best = p.s;
      { const host = best.closest("div.figure") || (best.parentElement && best.parentElement !== tpl.content && best.parentElement.children.length === 1 && /^(FIGURE|DIV|P)$/.test(best.parentElement.tagName) && !best.parentElement.classList.contains("notes") ? best.parentElement : best);
        // a diagram drawn in the notes as two separate pictures side by side (e.g. a DNA and an RNA nucleotide) is
        // replaced as a whole: other drawings in the same grid that also match this diagram are removed with it.
        const grid = host.parentElement && host.parentElement.classList && host.parentElement.classList.contains("grid") ? host.parentElement : null;
        const partners = grid ? pairs.filter((q) => q.d === d && q.s !== best && !usedS.has(q.s) && grid.contains(q.s)) : [];
        const frag = document.createElement("template"); frag.innerHTML = figHTML(d);
        if (partners.length) { partners.forEach((q) => usedS.add(q.s)); grid.replaceWith(frag.content); } else host.replaceWith(frag.content); embedded.add(d.id); } }
    const items = [...o.figList.filter((d) => !embedded.has(d.id)).map((d) => ({ key: d.id, html: figHTML(d) })), ...o.ints.map((x, i) => ({ key: "int:" + i, html: h`<div class="card interactive-host inline-int" data-int="${i}" aria-label="Interactive model: ${x.title}"></div>` }))];
    const leftover = [];
    // A value n puts the item at the end of section n; "n.k" puts it at the end of the k-th h3 block inside section n
    // ("n.0" = before that section's first h3), for long sections with sub-headings.
    const top = Array.from(tpl.content.children);
    // "n>phrase" puts the item straight after the first block in section n whose text contains that phrase (case-insensitive).
    const anchorFor = (v) => { if (String(v).includes(">")) { const [ns, ...rest] = String(v).split(">"); const n = Number(ns), phrase = rest.join(">").toLowerCase(); const h2 = secs[n - 1]; if (!h2) return undefined; const i0 = top.indexOf(h2); const end = secs[n] ? top.indexOf(secs[n]) : top.length;
        const blk = top.slice(i0 + 1, end).find((e) => e.textContent.toLowerCase().includes(phrase)); if (!blk) return undefined; const nxt = top[top.indexOf(blk) + 1]; return nxt || null; }
      const [n, k] = String(v).split(".").map(Number); const h2 = secs[n - 1]; if (!h2) return undefined; const i0 = top.indexOf(h2); const end = secs[n] ? top.indexOf(secs[n]) : top.length;
      if (k === undefined || Number.isNaN(k)) return secs[n] || null; const h3s = top.slice(i0 + 1, end).filter((e) => e.tagName === "H3"); if (k > h3s.length) return undefined; return h3s[k] || secs[n] || null; };
    const groups = new Map(); for (const it of items) { const v = o.place[it.key]; const anc = v === undefined ? undefined : anchorFor(v); if (anc === undefined) { leftover.push(it); continue; } const key = String(v); if (!groups.has(key)) groups.set(key, { anc, list: [] }); groups.get(key).list.push(it); }
    for (const [key, g] of groups) { const frag = document.createElement("template"); frag.innerHTML = `<div class="inline-media" data-section="${key}">${g.list.map((x) => x.html).join("")}</div>`; if (g.anc) g.anc.before(frag.content); else tpl.content.append(frag.content); }
    if (leftover.length) { const frag = document.createElement("template"); frag.innerHTML = `<h3 class="mt-l">More diagrams and models</h3><div class="inline-media">${leftover.map((x) => x.html).join("")}</div>`; tpl.content.append(frag.content); }
    const box = document.createElement("div"); box.append(tpl.content);
    return `
      <div class="tabs" role="tablist">
        <button role="tab" id="tab-notes" aria-controls="pane-notes" aria-selected="true" data-tab="notes">Learn</button>
        <button role="tab" id="tab-practice" aria-controls="pane-practice" aria-selected="false" tabindex="-1" data-tab="practice">Check yourself (${(c.quickCheck || []).length + o.nQ})</button>
        <button role="tab" id="tab-exam" aria-controls="pane-exam" aria-selected="false" tabindex="-1" data-tab="exam">Exam focus${o.focus ? " and Biology in Focus" : ""}</button>
      </div>
      <div class="tabpanes">
        <div class="pane card pad-l learn-pane" id="pane-notes" role="tabpanel" aria-labelledby="tab-notes" data-pane="notes"><p class="small muted learn-hint">Diagrams and interactive models appear where they belong in the notes. Use the zoom buttons on a diagram if the labels are small.</p><div class="notes">${box.innerHTML}</div><div class="next-step"><button class="btn primary" type="button" data-goto="practice">Next: Check yourself</button></div></div>
        <div class="pane" id="pane-practice" role="tabpanel" aria-labelledby="tab-practice" data-pane="practice" hidden><div class="card mb"><h3>Quick check</h3><p class="small muted">Three to five short questions. Objective questions are marked immediately; every attempt is recorded.</p><div id="quickcheck"></div></div><div class="row mb"><h3 style="margin:0">Practice questions (${o.nQ})</h3>${o.nF ? `<a class="btn" href="#/flashcards/${ref}">Flashcards for this subsection (${o.nF})</a>` : ""}</div><div id="practice"></div>${B.views.pastpapersFor ? B.views.pastpapersFor(ref) : ""}<div class="next-step"><button class="btn" type="button" data-goto="notes">Back to Learn</button><button class="btn primary" type="button" data-goto="exam">Next: Exam focus</button></div></div>
        <div class="pane" id="pane-exam" role="tabpanel" aria-labelledby="tab-exam" data-pane="exam" hidden><div class="card"><h3>Exam focus</h3><div class="notes">${c.examFocus || ""}</div><h3 class="mt">Synoptic connections</h3><ul>${o.syn || "<li class='muted'>None recorded.</li>"}</ul></div>${o.focus ? `<h3 class="mt-l">Biology in Focus</h3><p class="small muted">Real-world biology with a short explanation and one question each.</p><div id="focus"></div>` : ""}</div>
      </div>`;
  }

  function wireAuthored(root, c, ref) {
    const tabs = $$('[role="tab"]', root);
    const show = (name, focusTab) => { const b = tabs.find((x) => x.dataset.tab === name); if (!b) return; tabs.forEach((x) => { x.setAttribute("aria-selected", x === b); if (root.querySelector(".learn-pane")) x.tabIndex = x === b ? 0 : -1; }); $$(".pane", root).forEach((p) => (p.hidden = p.dataset.pane !== name)); if (focusTab) b.focus(); };
    tabs.forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
    // arrow keys move between tabs (standard tabs pattern)
    tabs.forEach((b, i) => b.addEventListener("keydown", (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); show(tabs[(i + k + tabs.length) % tabs.length].dataset.tab, true); } else if (e.key === "Home" || e.key === "End") { e.preventDefault(); show(tabs[e.key === "Home" ? 0 : tabs.length - 1].dataset.tab, true); } }));
    $$("[data-goto]", root).forEach((btn) => btn.addEventListener("click", () => { show(btn.dataset.goto); const bar = root.querySelector(".tabs"); if (bar) bar.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    root._showTab = show;
    $$(".figure", root).filter((f) => $(".zoom-in", f)).forEach((f) => { const svg = $("svg", f); let z = 1; let base = 0; const apply = () => { if (z === 1) { svg.style.width = ""; svg.style.maxWidth = "100%"; return; } svg.style.width = base * z + "px"; svg.style.maxWidth = "none"; };
      const fit = () => { if (z === 1) base = svg.getBoundingClientRect().width || svg.viewBox.baseVal.width || 700; }; $(".zoom-in", f).onclick = () => { fit(); z = Math.min(3, z + 0.25); apply(); }; $(".zoom-out", f).onclick = () => { fit(); z = Math.max(0.5, z - 0.25); apply(); }; $(".zoom-reset", f).onclick = () => { z = 1; apply(); }; });
    (c.quickCheck || []).forEach((q) => $("#quickcheck", root).append(B.questions.render(q)));
    (c.questions || []).forEach((q) => $("#practice", root).append(B.questions.render(q)));
    const ints = interactivesOf(c);
    $$(".interactive-host", root).forEach((hst) => B.views.interactive(ints[+hst.dataset.int], hst));
    (c.focus || []).forEach((f) => B.views.focusCard(f, $("#focus", root)));
  }
  function interactivesOf(c) { return [...(c.interactive ? [c.interactive] : []), ...(c.interactives || [])]; }
  B.views.lib.interactivesOf = interactivesOf;

})(window.BIO);
