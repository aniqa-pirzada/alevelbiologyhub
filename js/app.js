// Entry point: hash router + shell. Routes:
//  #/dashboard  #/library  #/library/3.1  #/library/3.1/3.1.1  #/topic/3.1.1.2  #/lab  #/lab/1  #/maths  #/maths/M-mag
//  #/flashcards  #/flashcards/3.1.1  #/synoptic  #/exam  #/planner  #/progress  #/checklist  #/about
window.BIO = window.BIO || {};
(function (B) {
  const { $, $$, h, raw, el, icons, esc } = B.util;
  const routes = [];
  function route(pattern, handler) { routes.push({ re: new RegExp("^" + pattern.replace(/:(\w+)/g, "([^/]+)") + "$"), handler }); }

  function render(html, { title = "", crumbs = [] } = {}) {
    const main = $("#content"); main.innerHTML = "";
    const bc = el(`<nav class="breadcrumbs" aria-label="Breadcrumb"></nav>`);
    const parts = [{ label: "Dashboard", href: "#/dashboard" }, ...crumbs];
    parts.forEach((c, i) => { if (i) bc.append(el('<span class="sep">/</span>')); bc.append(c.href ? el(h`<a href="${c.href}">${c.label}</a>`) : el(h`<span>${c.label}</span>`)); });
    if (crumbs.length) main.append(bc);
    if (typeof html === "string") main.insertAdjacentHTML("beforeend", html); else main.append(html);
    document.title = (title ? title + " · " : "") + "Biology Revision · OxfordAQA 9610";
    window.scrollTo({ top: 0, behavior: "auto" });
    const hash = location.hash;
    $$(".nav a").forEach((a) => {
      const href = a.getAttribute("href");
      let on;
      if (a.closest(".nav-sub")) {
        // Topic links (#/library/<unit>/<topic>): only the topic being viewed is highlighted, including its subsections,
        // consolidation page and practice routes, never the whole unit at once.
        const t = href.split("/")[3];
        on = hash === href || new RegExp("^#/(topic|consolidat(?:e|ion)|flashcards/deck:|library/[^/]+)/?" + t.replace(/\./g, "\\.") + "(\\.|/|$)").test(hash);
      } else if (href === "#/dashboard") on = hash === "#/dashboard" || hash === "";
      else on = hash.startsWith(href.split("/").slice(0, 2).join("/"));
      a.classList.toggle("active", on);
    });
    $$(".nav-unit").forEach((d) => { if (d.querySelector(".nav-sub a.active")) d.open = true; });
    closeSidebar();
  }

  function navigate() {
    const hash = location.hash || "#/dashboard"; const path = hash.slice(1);
    for (const r of routes) { const m = path.match(r.re); if (m) { try { r.handler(...m.slice(1).map(decodeURIComponent)); } catch (e) { console.error(e); render(h`<div class="card"><h2>Something went wrong</h2><p class="muted">${String(e.message)}</p><a class="btn" href="#/dashboard">Back to dashboard</a></div>`, { title: "Error" }); } return; } }
    render(h`<div class="card"><h2>Page not found</h2><p class="muted">No page matches <code>${path}</code>.</p><a class="btn" href="#/dashboard">Back to dashboard</a></div>`, { title: "Not found" });
  }

  function closeSidebar() { $(".sidebar").classList.remove("open"); $(".scrim").classList.remove("show"); }
  function buildShell() {
    const spec = B.spec;
    const unitsNav = spec.units.map((u) => h`<details class="nav-unit"><summary class="nav-btn" style="list-style:none;cursor:pointer;padding:.45rem .65rem;border-radius:10px;font-size:.88rem;color:var(--ink-2)">${u.ref} ${u.short}</summary><div class="nav-sub">${raw(u.topics.map((t) => h`<a href="#/library/${u.ref}/${t.ref}">${t.ref} ${t.title}</a>`).join(""))}</div></details>`).join("");
    document.body.innerHTML = `
      <a class="skip-link" href="#content">Skip to content</a>
      <div class="app">
        <aside class="sidebar" aria-label="Main navigation">
          <div class="brand"><div class="brand-mark">${icons.seed}</div><div><div class="brand-title">Biology Revision</div><div class="brand-sub">OxfordAQA International AS &amp; A-level (9610)</div></div></div>
          <nav class="nav">
            <div class="nav-section">Study</div>
            <a href="#/dashboard">${icons.dashboard}<span>Student Dashboard</span></a>
            <a href="#/library">${icons.book}<span>Revision Library</span></a>
            <a href="#/lab">${icons.lab}<span>Virtual Practical Laboratory</span></a>
            <a href="#/maths">${icons.maths}<span>Maths &amp; Data Skills Hub</span></a>
            <a href="#/flashcards">${icons.cards}<span>Flashcards &amp; Retrieval</span></a>
            <a href="#/synoptic">${icons.synoptic}<span>Synoptic &amp; Unit 5</span></a>
            <a href="#/exam">${icons.exam}<span>Exam Practice Centre</span></a>
            <a href="#/unit/3.1">${icons.book}<span>Unit 1 Revision Centre</span></a>
            <a href="#/papers">${icons.exam}<span>Practice Papers</span></a>
            <a href="#/cluster/3.2.1-3.2.3">${icons.synoptic}<span>Unit 2: Disease to Rehydration</span></a>
            <div class="nav-section">Plan &amp; track</div>
            <a href="#/planner">${icons.planner}<span>Revision Planner</span></a>
            <a href="#/progress">${icons.progress}<span>Personal Progress</span></a>
            <a href="#/checklist">${icons.check}<span>Specification Checklist</span></a>
            <div class="nav-section">Units</div>
            ${unitsNav}
          </nav>
          <div class="sidebar-foot">Created by Aniqa Pirzada. Not endorsed by OxfordAQA.<br><a href="#/about">About, privacy &amp; data</a></div>
        </aside>
        <div class="scrim"></div>
        <div class="main">
          <header class="topbar">
            <button class="btn menu-btn" aria-label="Open navigation">${icons.menu}</button>
            <div class="search" role="search">${icons.search}<input id="search" type="search" placeholder="Search topics, keywords, spec references, practicals…" aria-label="Search" autocomplete="off"><div class="search-results" id="search-results" role="listbox"></div></div>
            <div class="topbar-right"><button class="btn sm ghost theme-toggle" id="theme-toggle" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg><span>Dark mode</span></button><a class="btn sm" href="#/checklist">Spec checklist</a></div>
          </header>
          <main id="content" class="content" tabindex="-1"></main>
          <footer class="foot">
            Specification: OxfordAQA International AS and A-level Biology (9610), version ${esc(spec.meta.specVersion)} · <a href="${esc(spec.meta.specPdfUrl)}" target="_blank" rel="noopener">Official specification (PDF)</a> · <a href="${esc(spec.meta.sourceUrl)}" target="_blank" rel="noopener">OxfordAQA qualification page</a><br>
            ${esc(spec.meta.disclaimer)} Progress is stored only in this browser.
          </footer>
        </div>
      </div>`;
    $(".menu-btn").addEventListener("click", () => { $(".sidebar").classList.add("open"); $(".scrim").classList.add("show"); });
    $(".scrim").addEventListener("click", closeSidebar);
    // search
    const inp = $("#search"), res = $("#search-results");
    inp.addEventListener("input", () => { const hits = B.search.query(inp.value); res.innerHTML = hits.map((x) => h`<a href="${x.href}" role="option"><div class="k">${x.kind} · ${x.ref}</div><div class="t">${x.title}</div></a>`).join("") || (inp.value.trim() ? '<div class="s" style="padding:.7rem .9rem">No matches</div>' : ""); res.classList.toggle("open", !!inp.value.trim()); });
    inp.addEventListener("keydown", (e) => { if (e.key === "Escape") { res.classList.remove("open"); } if (e.key === "ArrowDown") { const a = $("a", res); a && a.focus(); e.preventDefault(); } });
    res.addEventListener("keydown", (e) => { const links = $$("a", res); const i = links.indexOf(document.activeElement); if (e.key === "ArrowDown" && links[i + 1]) { links[i + 1].focus(); e.preventDefault(); } if (e.key === "ArrowUp") { (links[i - 1] || inp).focus(); e.preventDefault(); } });
    document.addEventListener("click", (e) => { if (!e.target.closest(".search")) res.classList.remove("open"); });
    res.addEventListener("click", () => { res.classList.remove("open"); inp.value = ""; });
  }

  B.app = { route, render, navigate };
  window.addEventListener("hashchange", navigate);
  // Theme: the student's saved choice (prefs.theme "light" | "dark"); with no choice, follow the device setting.
  const applyTheme = () => { const pref = (B.store.get().prefs || {}).theme; const dark = pref ? pref === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light"; const t = document.getElementById("theme-toggle"); if (t) { t.setAttribute("aria-pressed", String(dark)); t.querySelector("span").textContent = dark ? "Light mode" : "Dark mode"; } };
  B.applyTheme = applyTheme;
  window.addEventListener("DOMContentLoaded", () => { B.store.load(); document.documentElement.classList.toggle("reduce-motion", !!(B.store.get().prefs || {}).reducedMotion); buildShell(); applyTheme();
    // Optional authorised bank: never required; when one loads, refresh a past-paper page that is already open.
    if (B.banks) { document.addEventListener("bio:banks-loaded", () => { if (/^#\/pastpapers/.test(location.hash)) navigate(); }); B.banks.load(); }
    document.getElementById("theme-toggle").addEventListener("click", () => { const st = B.store.get(); st.prefs = st.prefs || {}; st.prefs.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; B.store.save(); applyTheme(); });
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (!(B.store.get().prefs || {}).theme) applyTheme(); }); B.search.build(); B.views.register(); navigate(); });
})(window.BIO);
