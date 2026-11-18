// Phones: tap a figure in the notes (and, since Phase 5 Batch 3, the drawing of a labelling question) to see it full screen at a readable size (release review 2026-11-16).
// Notes figures fit the phone width (no sideways panning on the page), so their labels are small; this viewer shows the
// same drawing at its natural width (at least 720 px) in a scrollable full-screen panel. Close with the button, Escape or
// the back gesture area. Only on screens 600 px wide or less; laptops keep the + and - buttons.
window.BIO = window.BIO || {};
(function (B) {
  let box = null, last = null;
  function ensure() {
    if (box && document.body.contains(box)) return box;
    box = document.createElement("div"); box.className = "figfull"; box.hidden = true;
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Enlarged figure");
    box.innerHTML = '<div class="figfull-bar"><span class="small">Pinch or scroll to explore</span><button type="button" class="btn sm" data-close>Close ✕</button></div><div class="figfull-scroll"></div>';
    document.body.append(box);
    box.querySelector("[data-close]").addEventListener("click", close);
    box.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.addEventListener("hashchange", close);
    return box;
  }
  function open(view) {
    const pic = view.querySelector(":scope > svg, :scope > img"); if (!pic) return;
    ensure(); const sc = box.querySelector(".figfull-scroll"); sc.innerHTML = "";
    const c = pic.cloneNode(true); c.removeAttribute("style"); c.removeAttribute("id");
    const ids = new Set(); c.querySelectorAll("[id]").forEach((n) => { ids.add(n.id); n.id = "ff-" + n.id; }); // avoid duplicate ids on the page
    // keep markers, gradients and clip paths working in the copy (Phase 5 Batch 3 review RI-1)
    if (ids.size) c.querySelectorAll("*").forEach((n) => { for (const a of [...n.attributes]) { if (/url\(#/.test(a.value)) n.setAttribute(a.name, a.value.replace(/url\(#([^)]+)\)/g, (m, id) => ids.has(id) ? "url(#ff-" + id + ")" : m)); else if ((a.name === "href" || a.name === "xlink:href") && a.value[0] === "#" && ids.has(a.value.slice(1))) n.setAttribute(a.name, "#ff-" + a.value.slice(1)); } });
    const vb = c.viewBox && c.viewBox.baseVal; const w = Math.max(720, Math.min(1100, (vb && vb.width) || c.naturalWidth || 720));
    c.style.width = w + "px"; c.style.maxWidth = "none"; c.style.height = "auto"; sc.append(c);
    last = document.activeElement; box.hidden = false; document.documentElement.classList.add("figfull-open");
    box.querySelector("[data-close]").focus({ preventScroll: true });
  }
  function close() { if (!box || box.hidden) return; box.hidden = true; document.documentElement.classList.remove("figfull-open"); if (last && last.focus) last.focus({ preventScroll: true }); }
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 600) return;
    // practice-paper figures too (Phase 5 Batch 4 review RO): the drawing's own parent is passed as the "view"
    const paperSvg = e.target.closest(".pp-intro figure svg, .pp-stem figure svg");
    const view = paperSvg ? paperSvg.parentElement : e.target.closest(".notes figure[data-fig] .fig-view, .learn-pane figure[data-fig] .fig-view, .lbl-fig .fig-view"); if (!view) return;
    if (e.target.closest("a, button, input, select, textarea, .gl-term")) return;
    e.preventDefault(); open(view);
  });
  B.figZoom = { open, close };
})(window.BIO);
