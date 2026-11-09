// Unit 1 concept map view (Batch 9, owned by the concept-map author).
// Route #/unit/:u/map → B.views.unitMap(u). Data: B.unitMaps[u] (data/unit1-map.js).
// A clickable SVG map (every node and every link is a keyboard-focusable button) with a shared detail panel, plus a
// full list of connections that is the accessible and small-screen layout. Activating a link shows its explanation,
// the specification statements it draws on, and one application question rendered by B.questions.render, so
// attempts are logged and count towards mastery. Styles are emitted inline in a <style> block (prefix umap-).
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$ } = B.util;
  const VB_W = 1170, VB_H = 660, NW = 176, NH = 60;

  const GROUPS = {
    molecules: { fill: "#d6efec", stroke: "#1f8a8a", name: "Molecules and enzymes", short: "Molecules and enzymes" },
    cells: { fill: "#e2efe6", stroke: "#4f7d62", name: "Cells, transport and exchange", short: "Cells, transport, exchange" },
    genetics: { fill: "#e4ebf5", stroke: "#1e3a5f", name: "DNA, protein synthesis and meiosis", short: "Genetics" },
    diversity: { fill: "#e6f6f1", stroke: "#2f8a72", name: "Variation, species and biodiversity", short: "Variation and diversity" },
    practical: { fill: "#fbf0d8", stroke: "#a87412", name: "Required practicals", short: "Required practicals" },
  };

  const STYLE = `<style id="umap-style">
  .umap-wrap { position: relative; }
  .umap-caption { min-height: 2.6em; margin: 0 0 .6rem; font-size: .9rem; color: var(--ink-2); }
  .umap-caption strong { color: var(--ink); }
  .umap-svg { display: block; width: 100%; height: auto; max-width: 100%; }
  .umap-svg text { font-family: var(--font); pointer-events: none; }
  .umap-node, .umap-link { cursor: pointer; outline: none; }
  .umap-node rect.box { stroke-width: 2; }
  .umap-node.concept rect.box { stroke-dasharray: 6 4; }
  .umap-node:hover rect.box, .umap-node:focus-visible rect.box { stroke-width: 3.5; }
  .umap-node:focus-visible rect.ring, .umap-link:focus-visible circle.ring { stroke: var(--focus); stroke-width: 4; fill: none; }
  .umap-node rect.ring, .umap-link circle.ring { fill: none; stroke: transparent; }
  .umap-edge { stroke: #9fb3ae; stroke-width: 2.2; fill: none; }
  .umap-link circle.dot { fill: #fff; stroke: #6b7d8f; stroke-width: 1.8; }
  .umap-link text { font-size: 12.5px; font-weight: 700; fill: var(--ink); }
  .umap-link:hover circle.dot, .umap-link:focus-visible circle.dot { fill: var(--teal-soft); stroke: var(--teal-strong); }
  .umap-svg.has-sel .umap-edge, .umap-svg.has-sel .umap-link, .umap-svg.has-sel .umap-node { opacity: .32; }
  .umap-svg.has-sel .on { opacity: 1; }
  .umap-svg .umap-edge.on { stroke: var(--teal-strong); stroke-width: 3.6; }
  .umap-svg .umap-link.on circle.dot { fill: var(--teal); stroke: var(--teal-strong); }
  .umap-svg .umap-link.on text { fill: #fff; }
  .umap-svg .umap-node.sel rect.box { stroke-width: 4; }
  @media (prefers-reduced-motion: no-preference) { html:not(.reduce-motion) .umap-edge, html:not(.reduce-motion) .umap-link, html:not(.reduce-motion) .umap-node { transition: opacity .18s ease; } }
  .umap-legend { display: flex; flex-wrap: wrap; gap: .4rem .9rem; font-size: .8rem; color: var(--ink-3); margin-top: .6rem; }
  .umap-legend span { display: inline-flex; align-items: center; gap: .35rem; }
  .umap-legend i { display: inline-block; width: 18px; height: 12px; border-radius: 4px; border: 2px solid; }
  .umap-legend i.dash { border-style: dashed; }
  .umap-small-note { display: none; }
  .umap-detail { scroll-margin-top: calc(var(--topbar-h) + 12px); }
  .umap-detail h2:focus { outline: none; }
  .umap-detail h2:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  .umap-path { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin: .2rem 0 .8rem; }
  .umap-path .rel { font-style: italic; color: var(--ink-2); }
  .umap-path .badge { white-space: normal; text-align: left; line-height: 1.3; max-width: 100%; }
  .umap-stmts { margin: .4rem 0 0; padding-left: 1.1rem; font-size: .86rem; color: var(--ink-2); }
  .umap-stmts li { margin: .2rem 0; }
  .umap-note { border-left: 4px solid var(--amber); background: var(--amber-soft); padding: .55rem .8rem; border-radius: 8px; font-size: .88rem; margin: .7rem 0; }
  .umap-conn { list-style: none; padding: 0; margin: .5rem 0 0; display: grid; gap: .4rem; }
  .umap-conn button { text-align: left; width: 100%; }
  .umap-table td, .umap-table th { font-size: .88rem; }
  .umap-table .num { font-family: var(--mono); color: var(--ink-3); width: 2.2rem; }
  .umap-table .rel { font-style: italic; color: var(--ink-2); }
  .umap-table button { white-space: nowrap; }
  .umap-nodes { columns: 2; column-gap: 1.5rem; padding-left: 1.1rem; font-size: .9rem; }
  .umap-nodes li { break-inside: avoid; margin: .15rem 0; }
  .umap-dn { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: space-between; margin-top: 1rem; }
  @media (max-width: 760px) {
    .umap-figure { display: none; }
    .umap-small-note { display: block; }
    .umap-nodes { columns: 1; }
    .umap-table, .umap-table tbody, .umap-table tr, .umap-table td { display: block; width: 100%; }
    .umap-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .umap-table tr { border: 1px solid var(--line); border-radius: 10px; padding: .5rem .7rem; margin-bottom: .6rem; background: var(--surface); }
    .umap-table td { border: 0; padding: .15rem 0; }
    .card > table.umap-table { display: block; overflow: visible; white-space: normal; }
    .umap-table td.num { width: auto; font-family: var(--font); font-weight: 600; color: var(--ink-2); }
    .umap-table td[data-h]::before { content: attr(data-h) ": "; font-weight: 600; color: var(--ink-3); font-style: normal; }
    .umap-table button { white-space: normal; margin-top: .3rem; }
    .umap-detail .q, .umap-detail .q * { overflow-wrap: anywhere; }
    .umap-detail .q table { display: block; overflow-x: auto; }
  }
  </style>`;

  // Wrap text into at most `max` lines of roughly `n` characters.
  function wrap(s, n, max = 2) {
    const words = s.split(" "), lines = [""];
    for (const w of words) { const cur = lines[lines.length - 1]; if ((cur + " " + w).trim().length > n && cur) { if (lines.length === max) { lines[lines.length - 1] += " " + w; continue; } lines.push(w); } else lines[lines.length - 1] = (cur + " " + w).trim(); }
    return lines;
  }
  // Point where the segment from the centre of a box towards (tx, ty) leaves the box (with padding).
  function boxExit(cx, cy, tx, ty, pad) {
    const dx = tx - cx, dy = ty - cy, hw = NW / 2 + pad, hh = NH / 2 + pad;
    const k = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return [cx + dx * k, cy + dy * k];
  }

  B.views.unitMap = function (u) {
    const M = (B.unitMaps || {})[u];
    const unit = B.spec.units.find((x) => x.ref === u);
    const crumbs = [{ label: unit ? `Unit ${unit.ref.split(".")[1]} Revision Centre` : "Unit", href: `#/unit/${u}` }, { label: "Concept map" }];
    if (!M || !unit) return B.app.render(h`<div class="card"><div class="empty"><h3>No concept map for this unit yet</h3><p>Concept maps are being built unit by unit.</p><a class="btn" href="#/unit/${u}">Back to the unit</a></div></div>`, { title: "Concept map", crumbs });

    // Look-ups from the specification.
    const stmtText = {}, topicTitle = {};
    for (const t of unit.topics) { topicTitle[t.ref] = t.title; for (const s of t.subsections) { topicTitle[s.ref] = s.title; for (const st of s.statements) stmtText[st.id] = st.text; } }
    const node = Object.fromEntries(M.nodes.map((n) => [n.id, n]));
    const links = M.links.map((l, i) => Object.assign({ n: i + 1 }, l));
    const linkById = Object.fromEntries(links.map((l) => [l.id, l]));
    const fullTitle = (n) => n.kind === "topic" ? `${n.ref} ${topicTitle[n.ref] || n.title}` : n.kind === "practical" ? `Required practical ${n.rp}` : `${n.title} (${n.ref})`;
    const shortName = (n) => n.kind === "topic" ? `${n.ref} ${n.title}` : n.title;
    const totalMarks = links.reduce((a, l) => a + l.question.marks, 0);

    // ----- SVG -----
    const edgesSVG = links.map((l) => {
      const a = node[l.from], b = node[l.to];
      const [x1, y1] = boxExit(a.x, a.y, b.x, b.y, 2), [x2, y2] = boxExit(b.x, b.y, a.x, a.y, 7);
      return `<line class="umap-edge" data-link="${l.id}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" marker-end="url(#umap-arrow)"/>`;
    }).join("");
    const nodesSVG = M.nodes.map((n) => {
      const g = GROUPS[n.group] || GROUPS.molecules;
      const kicker = n.kind === "topic" ? `Topic ${n.ref}` : n.kind === "practical" ? `Practical · ${n.ref}` : `Key concept · ${n.ref}`;
      const lines = wrap(n.title, 20);
      const ty = lines.length === 1 ? n.y + 12 : n.y + 4;
      const label = `${n.kind === "topic" ? "Topic" : n.kind === "practical" ? "Required practical" : "Key concept"} ${n.kind === "practical" ? n.rp : n.ref}: ${n.kind === "topic" ? topicTitle[n.ref] || n.title : n.title}. Show its connections.`;
      return h`<g class="umap-node ${n.kind}" data-node="${n.id}" tabindex="0" role="button" aria-label="${label}">
        <rect class="ring" x="${n.x - NW / 2 - 5}" y="${n.y - NH / 2 - 5}" width="${NW + 10}" height="${NH + 10}" rx="16"/>
        <rect class="box" x="${n.x - NW / 2}" y="${n.y - NH / 2}" width="${NW}" height="${NH}" rx="${n.kind === "concept" ? 28 : 12}" fill="${g.fill}" stroke="${g.stroke}"/>
        <text x="${n.x}" y="${n.y - 13}" text-anchor="middle" font-size="12" font-weight="600" fill="#4b5e72">${kicker}</text>
        ${raw(lines.map((ln, i) => h`<text x="${n.x}" y="${ty + i * 16}" text-anchor="middle" font-size="15" font-weight="700" fill="#16263a">${ln}</text>`).join(""))}
      </g>`;
    }).join("");
    const linksSVG = links.map((l) => {
      const a = node[l.from], b = node[l.to];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const label = `Connection ${l.n}: ${shortName(a)} ${l.label} ${shortName(b)}. Show the explanation and question.`;
      return h`<g class="umap-link" data-link="${l.id}" tabindex="0" role="button" aria-label="${label}">
        <title>${shortName(a)} → ${l.label} → ${shortName(b)}</title>
        <circle class="ring" cx="${mx}" cy="${my}" r="18"/>
        <circle class="dot" cx="${mx}" cy="${my}" r="13.5"/>
        <text x="${mx}" y="${my + 4.5}" text-anchor="middle">${l.n}</text>
      </g>`;
    }).join("");
    const legendX = 935, legendY = 432;
    const legendSVG = `<g aria-hidden="true" font-size="12" fill="#3c4f63">
      <text x="${legendX}" y="${legendY}" font-weight="700" font-size="12.5" fill="#16263a">Key</text>
      ${Object.values(GROUPS).map((g, i) => `<rect x="${legendX}" y="${legendY + 12 + i * 22}" width="22" height="14" rx="4" fill="${g.fill}" stroke="${g.stroke}" stroke-width="2"/><text x="${legendX + 30}" y="${legendY + 23 + i * 22}">${g.short}</text>`).join("")}
      <rect x="${legendX}" y="${legendY + 128}" width="22" height="14" rx="7" fill="#fff" stroke="#6b7d8f" stroke-width="2" stroke-dasharray="4 3"/><text x="${legendX + 30}" y="${legendY + 139}">Dashed: key concept</text>
      <circle cx="${legendX + 11}" cy="${legendY + 165}" r="9" fill="#fff" stroke="#6b7d8f" stroke-width="1.8"/><text x="${legendX + 11}" y="${legendY + 169}" text-anchor="middle" font-weight="700" font-size="10.5" fill="#16263a">n</text><text x="${legendX + 30}" y="${legendY + 169}">Numbered link: select it</text>
    </g>`;
    const svg = `<svg class="umap-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="group" aria-label="Unit 1 concept map: ${M.nodes.length} topics and key concepts joined by ${links.length} numbered connections. Each box and each numbered circle is a button.">
      <defs><marker id="umap-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#7d918c"/></marker></defs>
      <g aria-hidden="true">${edgesSVG}</g>${nodesSVG}${linksSVG}${legendSVG}</svg>`;

    // ----- connection list (accessible and small-screen layout) -----
    const rows = links.map((l) => h`<tr data-row="${l.id}">
      <td class="num" data-h="Connection">${l.n}</td>
      <td data-h="From"><a href="${node[l.from].href}">${shortName(node[l.from])}</a></td>
      <td class="rel" data-h="Relationship">${l.label}</td>
      <td data-h="To"><a href="${node[l.to].href}">${shortName(node[l.to])}</a></td>
      <td><button class="btn sm" data-open-link="${l.id}" aria-label="Explain and practise connection ${l.n}">Explain and practise</button></td></tr>`).join("");
    const nodeList = M.nodes.map((n) => h`<li><a href="${n.href}">${fullTitle(n)}</a>${n.lab ? raw(h` · <a href="${n.lab}">Virtual Laboratory</a>`) : ""}</li>`).join("");

    const page = el(h`<div>${raw(STYLE)}
      <div class="page-head"><div><div class="eyebrow">${unit.code} · ${unit.short}</div><h1>Unit 1 concept map</h1>
        <p class="lede">How the eleven Unit 1 topics fit together. Select a box to see its connections, or a numbered circle to read why two ideas are linked and to try a question on the link (${links.length} questions, ${totalMarks} marks; your answers count towards mastery).</p></div>
        <div class="row"><a class="btn" href="#/unit/${u}">Back to the Unit 1 Revision Centre</a><a class="btn ghost" href="#umap-list" data-skip>Skip to the list of connections</a></div></div>
      <div class="card mb umap-figure">
        <p class="umap-caption" id="umap-caption" aria-hidden="true">Hover over or tab to a box or numbered circle; press Enter to open it. Press Escape to clear the selection.</p>
        <div class="umap-wrap">${raw(svg)}</div>
      </div>
      <p class="umap-small-note notice small">On a small screen the map is shown as a list. Choose <strong>Explain and practise</strong> on any connection below.</p>
      <section class="card mb umap-detail" id="umap-detail" aria-labelledby="umap-detail-h" hidden></section>
      <section class="card mb" id="umap-list" aria-labelledby="umap-list-h" tabindex="-1">
        <h2 id="umap-list-h">All ${links.length} connections</h2>
        <p class="small muted">Each connection reads in order: <em>from</em>, relationship, <em>to</em>. The topic and concept names open their pages.</p>
        <table class="umap-table"><caption class="sr-only">All ${links.length} connections on the Unit 1 concept map: from, relationship, to</caption><thead><tr><th scope="col">#</th><th scope="col">From</th><th scope="col">Relationship</th><th scope="col">To</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>${raw(rows)}</tbody></table>
      </section>
      <section class="card" aria-labelledby="umap-nodes-h"><h2 id="umap-nodes-h">Topics and key concepts on the map</h2><ul class="umap-nodes">${raw(nodeList)}</ul>
        <p class="small muted mt">Biological principles for Unit 1 (specification, printed page 21) run through these links: condensation and hydrolysis; protein structure and function; enzyme rates; passive and active exchange across membranes; size and surface area to volume ratio; genes as DNA coding for amino acid sequences; meiosis producing genetically different cells; and the species defined by fertile offspring.</p>
        <div class="row mt"><a class="btn" href="#/unit/${u}">Back to the Unit 1 Revision Centre</a></div></section>
    </div>`);
    B.app.render(page, { title: "Unit 1 concept map", crumbs });

    const svgEl = $(".umap-svg", page), detail = $("#umap-detail", page), caption = $("#umap-caption", page);
    const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
    let returnTo = null, current = null;

    function clearSel() { svgEl.classList.remove("has-sel"); $$(".on, .sel", svgEl).forEach((x) => x.classList.remove("on", "sel")); }
    function highlightLink(id) { clearSel(); svgEl.classList.add("has-sel"); const l = linkById[id]; $$(`[data-link="${id}"]`, svgEl).forEach((x) => x.classList.add("on")); [l.from, l.to].forEach((nid) => $(`[data-node="${nid}"]`, svgEl).classList.add("on")); }
    function highlightNode(id) { clearSel(); svgEl.classList.add("has-sel"); const g = $(`[data-node="${id}"]`, svgEl); g.classList.add("on", "sel"); links.filter((l) => l.from === id || l.to === id).forEach((l) => { $$(`[data-link="${l.id}"]`, svgEl).forEach((x) => x.classList.add("on")); [l.from, l.to].forEach((nid) => $(`[data-node="${nid}"]`, svgEl).classList.add("on")); }); }

    function showDetail(html, focus) {
      detail.hidden = false; detail.innerHTML = html;
      const head = $("#umap-detail-h", detail);
      if (focus) head.focus({ preventScroll: true });
      detail.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" });
    }
    const stmtList = (ids) => h`<details class="mt"><summary class="small">Specification statements this link draws on (${ids.length})</summary><ul class="umap-stmts">${raw(ids.map((s) => h`<li><a class="mono" href="#/topic/${s.replace(/\.s\d+$/, "")}">${s}</a> ${stmtText[s] || ""}</li>`).join(""))}</ul></details>`;
    const navButtons = (l) => {
      const prev = links[l.n - 2], next = links[l.n];
      return h`<div class="umap-dn">${prev ? raw(h`<button class="btn sm" data-open-link="${prev.id}">← Connection ${prev.n}</button>`) : raw("<span></span>")}<button class="btn sm ghost" data-back>Back to where I was</button>${next ? raw(h`<button class="btn sm" data-open-link="${next.id}">Connection ${next.n} →</button>`) : raw("<span></span>")}</div>`;
    };

    function openLink(id, opts = {}) {
      const l = linkById[id]; if (!l) return; current = { type: "link", id };
      if (opts.from) returnTo = opts.from;
      highlightLink(id);
      const a = node[l.from], b = node[l.to];
      showDetail(h`<div class="row" style="justify-content:space-between"><span class="badge teal">Connection ${l.n} of ${links.length}</span><span class="badge mono">${l.question.ref}</span></div>
        <h2 id="umap-detail-h" tabindex="-1" class="mt">${shortName(a)} → ${shortName(b)}</h2>
        <div class="umap-path"><a class="badge navy" href="${a.href}">${fullTitle(a)}</a><span class="rel">${l.label}</span><a class="badge navy" href="${b.href}">${fullTitle(b)}</a></div>
        <p>${l.explanation}</p>
        ${l.note ? raw(h`<div class="umap-note"><strong>Note.</strong> ${l.note}</div>`) : ""}
        ${raw(stmtList(l.stmts))}
        <h3 class="mt">Apply the link</h3><div class="umap-q"></div>${raw(navButtons(l))}`, opts.focus !== false);
      $(".umap-q", detail).append(B.questions.render(l.question));
    }

    function openNode(id, opts = {}) {
      const n = node[id]; if (!n) return; current = { type: "node", id };
      if (opts.from) returnTo = opts.from;
      highlightNode(id);
      const conns = links.filter((l) => l.from === id || l.to === id);
      showDetail(h`<span class="badge ${n.kind === "practical" ? "amber" : n.kind === "concept" ? "sage" : "teal"}">${n.kind === "topic" ? "Topic" : n.kind === "practical" ? "Required practical" : "Key concept"}</span>
        <h2 id="umap-detail-h" tabindex="-1" class="mt">${fullTitle(n)}</h2>
        <p>${n.desc}</p>
        <div class="row"><a class="btn primary" href="${n.href}">Open ${n.kind === "topic" ? "the topic" : "subsection " + n.ref}</a>${n.lab ? raw(h`<a class="btn" href="${n.lab}">Open RP${n.rp} in the Virtual Laboratory</a>`) : ""}<button class="btn ghost" data-back>Back to where I was</button></div>
        <h3 class="mt">Connections (${conns.length})</h3>
        <ul class="umap-conn">${raw(conns.map((l) => h`<li><button class="btn sm" data-open-link="${l.id}"><span class="mono">${l.n}.</span> ${shortName(node[l.from])} <em>${l.label}</em> ${shortName(node[l.to])}</button></li>`).join(""))}</ul>`, opts.focus !== false);
    }

    function goBack() {
      const t = returnTo && document.body.contains(returnTo) ? returnTo : null;
      if (t) { t.focus({ preventScroll: true }); t.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "center" }); }
      else $("#umap-list", page).focus();
    }

    // Map interaction: click, Enter/Space, hover/focus captions, Escape.
    const describe = (g) => {
      if (g.dataset.link) { const l = linkById[g.dataset.link]; return h`<strong>${l.n}.</strong> ${shortName(node[l.from])} <em>${l.label}</em> ${shortName(node[l.to])}`; }
      const n = node[g.dataset.node]; const c = links.filter((l) => l.from === n.id || l.to === n.id).length; return h`<strong>${fullTitle(n)}</strong>: ${n.desc} <span class="muted">(${c} connection${c === 1 ? "" : "s"})</span>`;
    };
    const activate = (g) => { if (g.dataset.link) openLink(g.dataset.link, { from: g }); else openNode(g.dataset.node, { from: g }); };
    $$(".umap-node, .umap-link", svgEl).forEach((g) => {
      g.addEventListener("click", () => activate(g));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); activate(g); } });
      const show = () => { caption.innerHTML = describe(g); };
      g.addEventListener("mouseenter", show); g.addEventListener("focus", show);
    });
    page.addEventListener("keydown", (e) => { if (e.key === "Escape") { clearSel(); caption.textContent = "Selection cleared. Hover over or tab to a box or numbered circle; press Enter to open it."; } });

    // Buttons inside the page (list rows, panel connection buttons, previous/next, back).
    page.addEventListener("click", (e) => {
      const ol = e.target.closest("[data-open-link]");
      if (ol) { e.preventDefault(); const fromList = ol.closest("#umap-list"); openLink(ol.dataset.openLink, fromList ? { from: ol } : {}); return; }
      if (e.target.closest("[data-back]")) { e.preventDefault(); goBack(); return; }
      if (e.target.closest("[data-skip]")) { e.preventDefault(); const lst = $("#umap-list", page); lst.focus({ preventScroll: true }); lst.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" }); }
    });
  };
})(window.BIO);
