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
    document.title = (title ? title + " · " : "") + "Biology Lab · OxfordAQA 9610";
    window.scrollTo({ top: 0, behavior: "auto" });
    const hash = location.hash;
    $$(".nav a").forEach((a) => {
      const href = a.getAttribute("href");
      let on;
      if (a.classList.contains("nav-overview")) on = hash === href; // the unit overview (topic list) page itself
      else if (a.closest(".nav-sub") && /^#\/library\//.test(href)) {
        // Topic links (#/library/<unit>/<topic>): only the topic being viewed is highlighted, including its subsections,
        // consolidation page and practice routes, never the whole unit at once.
        const t = href.split("/")[3];
        on = hash === href || new RegExp("^#/(topic|consolidat(?:e|ion)|flashcards/deck:|library/[^/]+)/?" + t.replace(/\./g, "\\.") + "(\\.|/|$)").test(hash);
      } else if (href === "#/dashboard") on = hash === "#/dashboard" || hash === "";
      else if (href === "#/exam") on = /^#\/(exam|papers|pastpapers)(\/|$)/.test(hash); // practice papers belong to Exam Practice & Papers (review RS-08)
      else if (/^#\/(unit|cluster)\//.test(href)) { const cl = /^#\/cluster\/([^/]+)/.exec(hash); const cu = cl && B.clusters && B.clusters[decodeURIComponent(cl[1])] ? B.clusters[decodeURIComponent(cl[1])].unit : null;
        on = hash === href || hash.startsWith(href + "/") || (!!cu && href === "#/unit/" + cu); } // one unit centre at a time; a linking-topics page highlights its unit's Revision Centre
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
  // Units in the sidebar follow the student's course (Year 12 sees Units 1–2 first); every other unit stays one click away
  // under "More units", so nothing is ever locked.
  // Sidebar units (teacher's design, 2026-11-16): one folding section per unit. Each opens with its Revision Centre (where
  // one exists), then the topics. Units outside the student's course are marked "Year 13" (or
  // "AS") rather than hidden. Unit 5 is the synoptic paper.
  // Consistent layout (teacher's decision, 2026-11-16): every unit section is "Unit N Revision Centre" then its topics.
  // Cross-topic ("Linking topics") pages live inside each Revision Centre, not in the sidebar.
  const UNIT_EXTRAS = { "3.1": { centre: "#/unit/3.1" }, "3.2": { centre: "#/unit/3.2" }, "3.3": { centre: "#/unit/3.3" } };
  function unitsNavHTML() { const spec = B.spec; const inC = B.profile ? B.profile.unitRefs() : spec.units.map((u) => u.ref);
    const item = (u, i) => { const x = UNIT_EXTRAS[u.ref] || {}; const other = !inC.includes(u.ref);
      return h`<details class="nav-unit"><summary class="nav-btn" title="${u.title}">${`Unit ${i + 1}`} <span class="nav-unit-name">${u.short}</span>${other ? raw(`<span class="nav-tag">${u.level === "AS" ? "AS" : "Year 13"}</span>`) : ""}</summary><div class="nav-sub">${raw(
        h`<a class="nav-centre nav-overview" href="#/library/${u.ref}">Unit ${i + 1} overview: all topics</a>` + // teacher's request 2026-11-18
        (x.centre ? h`<a class="nav-centre" href="${x.centre}">Unit ${i + 1} Revision Centre</a>` : "") +
        u.topics.map((t) => { const built = (t.subsections || []).some((ss) => B.content && B.content[ss.ref] && B.content[ss.ref].status !== "not_started"); return h`<a href="#/library/${u.ref}/${t.ref}">${t.ref} ${t.title}${built ? "" : raw(' <span class="tiny muted nav-coming">coming</span>')}</a>`; }).join(""))}</div></details>`; };
    return spec.units.map(item).join("") + h`<details class="nav-unit"><summary class="nav-btn">Unit 5 <span class="nav-unit-name">Synoptic paper (BL05)</span></summary><div class="nav-sub"><a href="#/synoptic">Synoptic links and BL05 guide</a></div></details>`; }
  function profileFootHTML() { const n = B.profile ? B.profile.name() : ""; const c = B.profile ? B.profile.COURSES[B.profile.course()].short : ""; return h`<span class="nav-profile">${n ? n + " · " : ""}${c}</span> <button type="button" class="linkbtn" id="profile-edit">Change</button><br><a href="#/about">About Biology Lab, privacy and data</a>`; }
  function rebuildNav() { const box = document.querySelector(".nav-units"); if (box) box.innerHTML = unitsNavHTML(); const foot = document.querySelector(".sidebar-foot"); if (foot) foot.innerHTML = profileFootHTML(); }
  document.addEventListener("click", (e) => { if (e.target && e.target.id === "profile-edit" && B.onboarding) B.onboarding.open({ mode: "edit" }); });
  function buildShell() {
    const spec = B.spec;
    const unitsNav = unitsNavHTML();
    document.body.innerHTML = `
      <a class="skip-link" href="#content">Skip to content</a>
      <div class="app">
        <aside class="sidebar" id="main-nav" aria-label="Main navigation">
          <div class="brand"><div class="brand-mark">${icons.seed}</div><div><div class="brand-title">Biology Lab</div><div class="brand-sub">OxfordAQA International AS &amp; A-level (9610)</div></div></div>
          <nav class="nav">
            <a href="#/dashboard">${icons.dashboard}<span>Student Dashboard</span></a>
            <div class="nav-section">Revision centre</div>
            <a href="#/flashcards">${icons.cards}<span>Flashcards &amp; Retrieval</span></a>
            <a href="#/exam">${icons.exam}<span>Exam Practice &amp; Papers</span></a>
            <a href="#/lab">${icons.lab}<span>Virtual Practical Lab</span></a>
            <a href="#/maths">${icons.maths}<span>Maths &amp; Data Skills</span></a>
            <a href="#/synoptic">${icons.synoptic}<span>Synoptic</span></a>
            <div class="nav-section">Units</div>
            <div class="nav-units">${unitsNav}</div>
            <div class="nav-section">My progress</div>
            <a href="#/progress">${icons.progress}<span>Personal Progress</span></a>
            <a href="#/planner">${icons.planner}<span>Revision Planner</span></a>
            <a href="#/checklist">${icons.check}<span>Specification Checklist</span></a>
          </nav>
          <div class="sidebar-foot">${profileFootHTML()}</div>
        </aside>
        <div class="scrim"></div>
        <div class="main">
          <header class="topbar">
            <button class="btn menu-btn" aria-label="Open navigation">${icons.menu}</button>
            <button class="btn sm ghost nav-collapse-btn" id="nav-collapse" type="button" aria-controls="main-nav" aria-expanded="true" title="Hide or show the menu">${icons.menu}<span>Hide menu</span></button>
            <div class="search" role="search">${icons.search}<input id="search" type="search" placeholder="Search topics, keywords, spec references, practicals…" aria-label="Search" autocomplete="off"><div class="search-results" id="search-results" role="listbox"></div></div>
            <div class="topbar-right"><button class="btn sm ghost theme-toggle" id="theme-toggle" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg><span>Dark mode</span></button></div>
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
    // Desktop: hide or show the sidebar (a per-browser display preference, kept apart from the progress store)
    { const app = $(".app"), btn = $("#nav-collapse"), KEY = "bio9610.ui.navCollapsed";
      const apply = (c) => { app.classList.toggle("nav-collapsed", c); btn.setAttribute("aria-expanded", String(!c)); btn.querySelector("span").textContent = c ? "Show menu" : "Hide menu"; };
      let c0 = false; try { c0 = localStorage.getItem(KEY) === "1"; } catch (e) {} apply(c0);
      btn.addEventListener("click", () => { const c = !app.classList.contains("nav-collapsed"); app.classList.add("nav-anim"); apply(c);
        // let width-dependent layouts (benches, readable labels) settle once the slide has finished
        setTimeout(() => { try { window.dispatchEvent(new Event("resize")); } catch (e) {} }, 360); try { localStorage.setItem(KEY, c ? "1" : "0"); } catch (e) {} }); }
    // search
    const inp = $("#search"), res = $("#search-results");
    inp.addEventListener("input", () => { const hits = B.search.query(inp.value); res.innerHTML = hits.map((x) => h`<a href="${x.href}" role="option"><div class="k">${x.kind} · ${x.ref}</div><div class="t">${x.title}</div></a>`).join("") || (inp.value.trim() ? '<div class="s" style="padding:.7rem .9rem">No matches</div>' : ""); res.classList.toggle("open", !!inp.value.trim()); });
    inp.addEventListener("keydown", (e) => { if (e.key === "Escape") { res.classList.remove("open"); } if (e.key === "ArrowDown") { const a = $("a", res); a && a.focus(); e.preventDefault(); } });
    res.addEventListener("keydown", (e) => { const links = $$("a", res); const i = links.indexOf(document.activeElement); if (e.key === "ArrowDown" && links[i + 1]) { links[i + 1].focus(); e.preventDefault(); } if (e.key === "ArrowUp") { (links[i - 1] || inp).focus(); e.preventDefault(); } });
    document.addEventListener("click", (e) => { if (!e.target.closest(".search")) res.classList.remove("open"); });
    res.addEventListener("click", () => { res.classList.remove("open"); inp.value = ""; });
  }

  B.app = { route, render, navigate, rebuildNav };
  window.addEventListener("hashchange", navigate);
  // Theme: the student's saved choice (prefs.theme "light" | "dark"); with no choice, follow the device setting.
  const applyTheme = () => { const pref = (B.store.get().prefs || {}).theme; const dark = pref ? pref === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light"; const t = document.getElementById("theme-toggle"); if (t) { t.setAttribute("aria-pressed", String(dark)); t.querySelector("span").textContent = dark ? "Light mode" : "Dark mode"; } };
  B.applyTheme = applyTheme;
  window.addEventListener("DOMContentLoaded", () => {
    // teacher view (shows internal review status badges): ?teacher=1 turns it on for this device, ?teacher=0 off
    try { const q = new URLSearchParams(location.search).get("teacher"); if (q === "1") localStorage.setItem("bio9610.ui.teacher", "1"); if (q === "0") localStorage.removeItem("bio9610.ui.teacher"); if (localStorage.getItem("bio9610.ui.teacher") === "1") document.documentElement.classList.add("teacher-view"); } catch (e) { /* storage unavailable: student view */ }
    B.store.load(); document.documentElement.classList.toggle("reduce-motion", !!(B.store.get().prefs || {}).reducedMotion); buildShell(); applyTheme();
    // Optional authorised bank: never required; when one loads, refresh a past-paper page that is already open.
    if (B.banks) { document.addEventListener("bio:banks-loaded", () => { if (/^#\/pastpapers/.test(location.hash)) navigate(); }); B.banks.load(); }
    document.getElementById("theme-toggle").addEventListener("click", () => { const st = B.store.get(); st.prefs = st.prefs || {}; st.prefs.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; B.store.save(); applyTheme(); });
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (!(B.store.get().prefs || {}).theme) applyTheme(); }); B.search.build(); B.views.register(); navigate(); if (B.onboarding) B.onboarding.maybeShow(); });
})(window.BIO);
