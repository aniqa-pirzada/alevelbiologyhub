// Keyword definitions in the notes (2026-11-15, teacher's request; modelled on the BBC Bitesize pop-up glossary).
// B.glossaryLinker.apply(container, ref) marks glossary terms in the Learn notes of a topic page: the first mention of
// each term on the page becomes a button with a dotted underline; pressing it
// opens a small card with the definition. Only the Learn notes are linked: never questions, mark schemes, Exam focus,
// figures, interactives, headings or links, so a definition can never give away an answer.
// Data: B.glossary.entries = [{ t: "term", a: ["alias", ...], d: "definition", r: "3.x.x.x" (where it is taught) }].
// Matching is case-insensitive on whole words; a plural "s" or "es" is accepted automatically; longer terms win.
// Accessibility: the term is a native button (aria-expanded, aria-controls); the card is a non-modal dialog labelled by
// its heading; Esc or the close button closes it and returns focus to the term; a click outside closes it.
window.BIO = window.BIO || {};
(function (B) {
  const SKIP = "a, button, h1, h2, h3, h4, h5, h6, figure, svg, code, pre, label, summary, select, textarea, input, .interactive-host, [data-int], section.q, .gl-term, .gl-pop, .no-gloss, .fig-tools, .badge, .callout-exam, .notice, details.tiny, figcaption, cite, .src, .credit, .no-gloss, td, th, strong, b";
  // phrases in which a glossary word is used in an everyday sense, not the biological one
  const NOT_THIS_SENSE = ["surface tension", "community health", "poor communit", "lysis (splitting)", "(splitting)", "vein of a leaf", "veins of the leaf", "leaf vein", "veins or patches", "in the veins", "of the capillary", "capillary tube", "respiratory substrate", "selection bias", "self-reported", "bias: exposures", "nitrogen source", "source of the", "source of new", "two sources", "source: who", "remove its sources"];
  let index = null, re = null, pop = null, openBtn = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function build() {
    const list = ((B.glossary || {}).entries || []).filter((e) => e && e.t && e.d);
    index = new Map();
    const forms = [];
    list.forEach((e, i) => { [e.t, ...(e.a || [])].forEach((f) => { const k = f.toLowerCase().trim(); if (k.length < 3 || index.has(k)) return; index.set(k, i); forms.push(k); }); });
    if (!forms.length) { re = null; return; }
    forms.sort((a, b) => b.length - a.length);
    // whole words only; optional plural ending; letters, digits and Greek count as word characters
    re = new RegExp("(^|[^\\p{L}\\p{N}])(" + forms.map(rx).join("|") + ")(e?s)?(?=$|[^\\p{L}\\p{N}])", "giu");
    index.list = list;
  }
  const entryFor = (word) => { const k = word.toLowerCase(); let i = index.get(k); if (i === undefined) i = index.get(k.replace(/e?s$/, "")); return i === undefined ? null : index.list[i]; };

  function ensurePop() {
    if (pop && document.body.contains(pop)) return pop;
    pop = document.createElement("div");
    pop.className = "gl-pop"; pop.id = "gl-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-labelledby", "gl-pop-h"); pop.hidden = true;
    pop.innerHTML = '<div class="gl-pop-head"><h3 id="gl-pop-h"></h3><button type="button" class="gl-close" aria-label="Close definition">✕</button></div><p class="gl-def"></p><p class="gl-where small muted"></p>';
    document.body.append(pop);
    pop.querySelector(".gl-close").addEventListener("click", () => close(true));
    pop.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); close(true); } });
    document.addEventListener("click", (e) => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest(".gl-term")) close(false); }, true);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) close(true); });
    window.addEventListener("hashchange", () => close(false));
    window.addEventListener("resize", () => { if (!pop.hidden && openBtn) place(openBtn); });
    window.addEventListener("scroll", () => { if (!pop.hidden && openBtn) place(openBtn); }, { passive: true });
    return pop;
  }
  function place(btn) {
    const r = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    if (vw <= 600) { pop.classList.add("gl-sheet"); pop.style.left = pop.style.top = ""; return; }
    pop.classList.remove("gl-sheet");
    const w = Math.min(380, vw - 24); pop.style.width = w + "px";
    let left = Math.min(Math.max(12, r.left), vw - w - 12);
    const h = pop.offsetHeight || 150;
    let top = r.bottom + 8; if (top + h > vh - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
    pop.style.left = left + "px"; pop.style.top = top + "px";
  }
  function open(btn) {
    const e = index.list[+btn.dataset.gl]; if (!e) return;
    ensurePop();
    if (openBtn && openBtn !== btn) openBtn.setAttribute("aria-expanded", "false");
    pop.querySelector("#gl-pop-h").textContent = e.t;
    pop.querySelector(".gl-def").textContent = e.d;
    const here = btn.closest("[data-gl-ref]"); const cur = here ? here.dataset.glRef : "";
    const w = pop.querySelector(".gl-where");
    if (e.r && e.r !== cur && B.content && B.content[e.r]) { w.innerHTML = `Taught in <a href="#/topic/${esc(e.r)}">${esc(e.r)}</a>`; w.hidden = false; } else { w.textContent = ""; w.hidden = true; }
    pop.hidden = false; btn.setAttribute("aria-expanded", "true"); openBtn = btn; place(btn);
    pop.querySelector(".gl-close").focus({ preventScroll: true });
  }
  function close(refocus) {
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    if (openBtn) { openBtn.setAttribute("aria-expanded", "false"); if (refocus) openBtn.focus({ preventScroll: true }); }
    openBtn = null;
  }

  function apply(container, ref) {
    if (!container) return 0;
    if (!index) build(); if (!re) return 0;
    container.setAttribute("data-gl-ref", ref || "");
    const seen = new Set(); let n = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (node.nodeType === 1) return node.matches(SKIP) || (/^(P|LI|DIV)$/.test(node.tagName) && /^\s*(Statements|Labels|Sources|References|Further reading)\b/.test(node.textContent)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        return node.nodeValue.trim().length > 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    const texts = []; let t; while ((t = walker.nextNode())) texts.push(t);
    texts.forEach((tn) => {
      // first mention per page only (per-section linking underlined too much: 29 to 178 links per page)
      const s = tn.nodeValue; re.lastIndex = 0; let m, last = 0; const frag = document.createDocumentFragment(); let changed = false;
      while ((m = re.exec(s))) {
        const word = m[2] + (m[3] || ""); const e = entryFor(m[2]) || entryFor(word); if (!e) continue;
        const around = s.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20).toLowerCase(); if (NOT_THIS_SENSE.some((x) => around.includes(x))) continue;
        const i = index.list.indexOf(e); if (seen.has(i)) continue;
        const start = m.index + m[1].length;
        frag.append(document.createTextNode(s.slice(last, start)));
        const b = document.createElement("button"); b.type = "button"; b.className = "gl-term"; b.dataset.gl = i;
        b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", "gl-pop"); b.setAttribute("aria-haspopup", "dialog");
        b.title = "Definition of " + e.t; b.textContent = word;
        frag.append(b); last = start + word.length; seen.add(i); changed = true; n++;
      }
      if (changed) { frag.append(document.createTextNode(s.slice(last))); tn.replaceWith(frag); }
    });
    if (!container._glWired) { container._glWired = true; container.addEventListener("click", (e) => { const b = e.target.closest(".gl-term"); if (!b) return; e.preventDefault(); if (openBtn === b && pop && !pop.hidden) close(true); else open(b); }); }
    return n;
  }
  B.glossaryLinker = { apply, rebuild: () => { index = null; }, entryFor: (w) => { if (!index) build(); return entryFor(w); } };
})(window.BIO);
