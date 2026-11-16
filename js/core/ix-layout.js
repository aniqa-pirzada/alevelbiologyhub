// Shared "stage + controls" layout for interactives, simulations and virtual benches (2026-11-14).
// B.ix.split(stageHTML, panelHTML, opts) returns the markup styled by css/interactive-layout.css:
//   picture (stage) and controls (panel) side by side on wide screens with the picture pinned in view, and stacked on
//   narrow screens with the picture first and pinned under the top bar. DOM order is stage, then panel, at every width.
// opts.cls: extra classes on the .ix wrapper (ix-wide-stage, ix-even, ix-fit-2, ix-nosticky-sm).
// opts.label: accessible name for the controls group (the panel becomes role="group").
// Layout only: it adds wrappers and never changes the content, ids or data attributes of what it wraps.
window.BIO = window.BIO || {};
(function (B) {
  const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  B.ix = {
    // One picture at a time (readability pass): wires a .ix-views tab row whose buttons (role="tab", aria-controls = the
    // id of a picture) show one picture and hide the others; arrow keys, Home and End move between tabs. Returns show(i).
    viewTabs(row) {
      const tabs = [...row.querySelectorAll('[role="tab"]')]; const pane = (b) => document.getElementById(b.getAttribute("aria-controls"));
      const show = (i, focus) => { tabs.forEach((b, k) => { const on = k === i; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; b.classList.toggle("primary", on); const p = pane(b); if (p) p.hidden = !on; }); if (focus) tabs[i].focus(); };
      tabs.forEach((b, k) => b.addEventListener("click", () => show(k)));
      row.addEventListener("keydown", (e) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return; e.preventDefault(); const cur = tabs.findIndex((b) => b.getAttribute("aria-selected") === "true"); let n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (cur + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; show(n, true); });
      return show;
    },
    split(stage, panel, opts = {}) {
      const cls = opts.cls ? " " + opts.cls : "";
      const grp = opts.label ? ` role="group" aria-label="${attr(opts.label)}"` : "";
      return `<div class="ix${cls}"><div class="ix-body"><div class="ix-stage">${stage}</div><div class="ix-panel"${grp}>${panel}</div></div></div>`;
    },
  };
})(window.BIO);


// ---------------------------------------------------------------------------------------------------------------------
// Readable labels (2026-11-14). A drawing scaled down to fit beside its controls (or onto a phone) can shrink its labels
// below a readable size. B.ix.readable(svg) enlarges each SVG label that renders below the floor (12.5 px on a laptop,
// 11 px on a phone) by at most CAP (2) times. A label grows around its own visual centre, so it stays on the structure it
// names; the lines of a multi-line label move apart in proportion, around the centre of the whole label. A label is grown
// less, or not at all, if growing it would make it run into another label or out of the drawing. Only font sizes (and,
// for the lines of a multi-line label, a dy offset) change: no words, ids or data attributes. Re-applied whenever a
// drawing is redrawn or resized. Applies to the pictures of every interactive ([data-int]) and virtual bench (#sim),
// except pictures inside questions; a picture opts out with class "ix-read-off" on it or an ancestor. RP5 (#/lab/5) is
// left alone while it is being built.
(function (B) {
  const CAP = 2;
  const floorPx = () => (innerWidth < 600 ? 11 : 12.5);
  const own = (t) => [...t.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const scaleOf = (el) => { const m = el.getScreenCTM && el.getScreenCTM(); return m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 0; };
  const gbox = (r) => ({ left: r.left, right: r.right, top: r.top + r.height * 0.18, bottom: r.bottom - r.height * 0.1 });
  // labels keep a small gap between them (2 px) unless they already touched
  const pad = (r) => ({ left: r.left - 2, right: r.right + 2, top: r.top - 1, bottom: r.bottom + 1 });
  const ovl = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const skip = (el) => el.closest(".q, .ix-read-off, defs, symbol, marker, clipPath, mask, pattern, foreignObject");
  const num = (v) => { const n = parseFloat(v); return isFinite(n) && /^\s*-?[\d.]+(px)?\s*$/.test(String(v)) ? n : null; };
  function reset(t) { t.style.fontSize = ""; if (t.dataset.ixDy !== undefined) { if (t.dataset.ixDy === "") t.removeAttribute("dy"); else t.setAttribute("dy", t.dataset.ixDy); delete t.dataset.ixDy; } t.querySelectorAll("tspan[data-ix-fs0]").forEach((s) => { s.style.fontSize = ""; }); }
  // Phones: a detailed drawing keeps a minimum width at which its smallest label can reach the floor, and scrolls sideways
  // inside its own box (its parent gets class ix-hscroll). Never wider than the drawing's own width, nor than 760 px.
  function phoneWidth(svg) {
    let box = svg.parentElement; if (!box || box.closest(".ix-free")) return;
    // virtual benches: only the bench drawing itself (not the microscope or charts), and at most 640 px wide
    const bench = !!box.closest("#sim"); if (bench && !(svg.classList.contains("bench-svg") && svg.closest(".bench-wrap.ix-bench-full"))) return;
    const vb = svg.viewBox && svg.viewBox.baseVal; if (!vb || !vb.width) return;
    if (innerWidth >= 600) { if (svg.dataset.ixMinw !== undefined) { svg.style.minWidth = svg.dataset.ixMinw; delete svg.dataset.ixMinw; if (svg.dataset.ixW0 !== undefined) { svg.style.width = svg.dataset.ixW0; delete svg.dataset.ixW0; } const cue = box.nextElementSibling; if (cue && cue.classList.contains("ix-swipe")) cue.remove(); if (box.hasAttribute("data-ix-wrap")) box.replaceWith(svg); else box.classList.remove("ix-hscroll"); } return; }
    if (svg.dataset.ixMinw !== undefined) return;
    let minFs = Infinity; svg.querySelectorAll("text, tspan[font-size]").forEach((t) => { if (skip(t)) return; const f = parseFloat(t.getAttribute("font-size") || getComputedStyle(t).fontSize); if (f > 0 && f < minFs) minFs = f; });
    if (!isFinite(minFs)) return;
    const natural = parseFloat(svg.getAttribute("width")) || vb.width;
    const want = Math.min(bench ? 640 : 760, natural, Math.ceil((vb.width * 11) / (minFs * 1.35)));
    const now = svg.getBoundingClientRect().width;
    if (want <= now + 8) return;
    // a drawing that shares its box with other content gets its own scrolling box
    if (box.matches("[data-int]") || box.children.length !== 1 || bench) { const w = document.createElement("div"); w.setAttribute("data-ix-wrap", ""); svg.replaceWith(w); w.append(svg); box = w; }
    svg.style.transition = "none"; svg.dataset.ixMinw = svg.style.minWidth || ""; svg.dataset.ixW0 = svg.style.width || ""; svg.style.minWidth = want + "px"; svg.style.width = want + "px"; box.classList.add("ix-hscroll");
    // a visible cue that the drawing continues sideways (release review 2026-11-15)
    if (!(box.nextElementSibling && box.nextElementSibling.classList.contains("ix-swipe"))) { const cue = document.createElement("p"); cue.className = "ix-swipe tiny muted"; cue.setAttribute("aria-hidden", "true"); cue.textContent = "↔ Swipe sideways to see the whole drawing"; box.after(cue); }
  }
  // Laptops: a drawing shown at its own (fixed) width in a wider box, with labels below the floor, is drawn larger, up to
  // 1.3 times, the width of its box, and a height that still fits on the screen with the controls above it.
  function laptopWidth(svg) {
    svg.style.transition = "none"; // the figure width transition would otherwise replay on every check
    if (svg.dataset.ixW !== undefined) { svg.style.width = svg.dataset.ixW; delete svg.dataset.ixW; }
    if (innerWidth < 600 || svg.closest(".ix-stage, .ix-free, #sim, .bench-wrap")) return;
    const natural = parseFloat(svg.getAttribute("width")); const vb = svg.viewBox && svg.viewBox.baseVal; if (!natural || !vb || !vb.width) return;
    const r = svg.getBoundingClientRect(); if (r.width < natural - 1.5 || !r.height) return;
    const box = svg.parentElement; const cs = getComputedStyle(box); const pw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); if (pw < r.width + 16) return;
    let minFs = Infinity; svg.querySelectorAll("text").forEach((t) => { if (skip(t)) return; const f = parseFloat(getComputedStyle(t).fontSize); if (f > 0 && f < minFs) minFs = f; });
    if (!isFinite(minFs) || (minFs * r.width) / vb.width >= floorPx()) return;
    const maxH = innerHeight - 150; const w = Math.floor(Math.min(pw, natural * 1.3, r.height < maxH ? (r.width * maxH) / r.height : r.width));
    if (w <= r.width + 8) return;
    svg.dataset.ixW = svg.style.width || ""; svg.style.width = w + "px";
  }
  function readable(svg) {
    if (!svg || !svg.isConnected || skip(svg)) return;
    // an entrance animation (for example apparatus "popping" onto a bench) changes the scale while it runs: measure after it
    if (svg.getAnimations) { const run = svg.getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect && a.effect.getTiming && a.effect.getTiming().iterations !== Infinity);
      if (run.length) { Promise.all(run.map((a) => a.finished.catch(() => null))).then(() => queue(svg)); return; } }
    phoneWidth(svg);
    // drawn sizes are measured with the labels at their own size
    svg.querySelectorAll("text").forEach((t) => { if (!skip(t)) reset(t); });
    laptopWidth(svg);
    const sr = svg.getBoundingClientRect(); if (sr.width < 2 || sr.height < 2) return;
    const floor = floorPx();
    const items = [];
    for (const t of svg.querySelectorAll("text")) {
      if (skip(t)) continue;
      reset(t);
      if (!own(t) && !t.querySelector("tspan")) continue;
      const cs = getComputedStyle(t); const fs0 = parseFloat(cs.fontSize) || 0; if (!fs0) continue;
      t.querySelectorAll("tspan").forEach((s) => { if (s.hasAttribute("font-size") && s.dataset.ixFs0 === undefined) s.dataset.ixFs0 = String(parseFloat(getComputedStyle(s).fontSize) || 0); });
      const r = t.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
      const sc = scaleOf(t); if (!sc) continue;
      const minFs = Math.min(fs0, ...[...t.querySelectorAll("tspan[data-ix-fs0]")].map((s) => +s.dataset.ixFs0 || fs0));
      const px = minFs * sc;
      const y = num(t.getAttribute("y")), x = num(t.getAttribute("x"));
      const mid = /middle|central/.test(cs.dominantBaseline || "") || /middle|central/.test(t.getAttribute("dominant-baseline") || "");
      items.push({ t, fs0, r: gbox(r), goal: px >= floor ? 1 : Math.min(CAP, floor / px), x, y, anchor: cs.textAnchor, mid, canDy: y !== null && !t.hasAttribute("dy") && !t.hasAttribute("transform") && !t.querySelector("tspan[y], tspan[dy]"), parent: t.parentNode });
    }
    if (!items.length || items.every((it) => it.goal === 1)) return;
    // multi-line labels: consecutive lines with the same parent, x and anchor, a line apart
    const groups = []; const used = new Set();
    const byPos = items.filter((it) => it.canDy).sort((a, b) => a.y - b.y);
    for (const it of byPos) { if (used.has(it)) continue; const g = [it]; used.add(it); let last = it;
      for (const nx of byPos) { if (used.has(nx) || nx.parent !== it.parent || nx.anchor !== it.anchor || Math.abs(nx.x - it.x) > 1 || Math.abs(nx.fs0 - it.fs0) > it.fs0 * 0.25) continue; const d = nx.y - last.y; if (d > 0 && d <= Math.max(last.fs0, nx.fs0) * 1.7) { g.push(nx); used.add(nx); last = nx; } }
      groups.push(g); }
    items.filter((it) => !used.has(it)).forEach((it) => groups.push([it]));
    const G = groups.map((g) => ({ g, k: Math.max(...g.map((it) => it.goal)), r0: g.map((it) => it.r) }));
    const set = (gr, k) => { const g = gr.g; const vc = (it) => (it.mid ? it.y : it.y - 0.35 * it.fs0);
      const c = g.length > 1 ? (vc(g[0]) + vc(g[g.length - 1])) / 2 : null;
      g.forEach((it) => { const t = it.t;
        t.style.fontSize = k === 1 ? "" : (it.fs0 * k).toFixed(2) + "px";
        t.querySelectorAll("tspan[data-ix-fs0]").forEach((s) => { s.style.fontSize = k === 1 ? "" : (+s.dataset.ixFs0 * k).toFixed(2) + "px"; });
        if (it.canDy) { const v = vc(it); const v2 = c === null ? v : c + (v - c) * k; const base2 = it.mid ? v2 : v2 + 0.35 * it.fs0 * k; const dy = base2 - it.y;
          if (t.dataset.ixDy === undefined) t.dataset.ixDy = t.getAttribute("dy") || "";
          if (k === 1) { if (t.dataset.ixDy === "") t.removeAttribute("dy"); delete t.dataset.ixDy; } else t.setAttribute("dy", dy.toFixed(2)); } }); };
    // shapes (not backgrounds): a label may not grow onto a shape it was clear of, or out of a shape it sat inside
    const SA = sr.width * sr.height;
    const shapes = [...svg.querySelectorAll("rect, circle, ellipse, path, polygon, polyline, line, image, use")].filter((e) => !skip(e) && !e.closest("text")).map((e) => e.getBoundingClientRect()).filter((r) => r.width * r.height < SA * 0.35 && (r.width > 0 || r.height > 0)).map((r) => ({ left: r.left - 0.5, right: r.right + 0.5, top: r.top - 0.5, bottom: r.bottom + 0.5 }));
    const inside = (a, b) => a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5;
    const shapeBad = (r0, r1) => { for (const S of shapes) { if (r1.right < S.left || r1.left > S.right || r1.bottom < S.top || r1.top > S.bottom) continue; const o0 = ovl(r0, S); if (o0 <= 0.5 && ovl(r1, S) > 2) return true; if (inside(r0, S)) { const m0 = margin(r0, S), m1 = margin(r1, S); if (m1 < Math.min(m0, 2.5) - 0.25) return true; }
      else if (o0 > 0) { const f0 = o0 / area(r0), f1 = ovl(r1, S) / area(r1); if (f0 >= 0.6 && f1 < f0 - 0.04) return true; } } return false; };
    const area = (r) => Math.max(1e-6, (r.right - r.left) * (r.bottom - r.top));
    // distance from a label to the nearest edge of a shape it sits inside (a label inside a shape keeps some breathing room)
    const margin = (r, S) => Math.min(r.left - S.left, S.right - r.right, r.top - S.top, S.bottom - r.bottom);
    const outside = (r) => (r.right - r.left) * (r.bottom - r.top) - ovl(r, sr);
    const within = (r) => r.left >= sr.left - 1 && r.right <= sr.right + 1 && r.top >= sr.top - 1 && r.bottom <= sr.bottom + 1;
    // bisection per label: lo = largest factor known to fit, hi = smallest known not to
    G.forEach((gr) => { gr.lo = 1; gr.hi = null; });
    for (let pass = 0; pass < 7; pass++) {
      G.forEach((gr) => set(gr, gr.k));
      const r1 = G.map((gr) => gr.g.map((it) => gbox(it.t.getBoundingClientRect())));
      let changed = false;
      G.forEach((gr, a) => { if (gr.k === 1) return; let bad = false;
        gr.g.forEach((it, i) => { if (bad) return; if (outside(r1[a][i]) > outside(gr.r0[i]) + 1 || shapeBad(gr.r0[i], r1[a][i])) { bad = true; return; }
          G.forEach((hr, b) => { if (bad || b === a) return; hr.g.forEach((jt, j) => { if (!bad && ovl(pad(r1[a][i]), r1[b][j]) > ovl(pad(gr.r0[i]), hr.r0[j]) + 1) bad = true; }); }); });
        if (bad) { gr.hi = gr.k; gr.k = pass < 6 ? (gr.lo + gr.k) / 2 : gr.lo; if (gr.k < 1.04) gr.k = 1; changed = true; }
        else if (gr.hi !== null && gr.hi - gr.k > 0.08 && pass < 6) { gr.lo = gr.k; gr.k = (gr.k + gr.hi) / 2; changed = true; }
        else gr.lo = gr.k; });
      if (!changed) break;
    }
    // final check: anything still colliding goes back to its last size known to fit
    G.forEach((gr) => set(gr, gr.k));
  }
  const PICS = "[data-int] svg, #sim svg";
  const pending = new Set(); let raf = 0, busy = false;
  const top = (s) => { let o = s; while (o.parentElement && o.parentElement.closest("svg")) o = o.parentElement.closest("svg"); return o; };
  const flush = () => { raf = 0; const list = [...pending]; pending.clear(); if (/^#\/lab\/5(\/|$)/.test(location.hash)) return; busy = true; list.forEach((s) => { try { readable(s); } catch (e) { /* never break a drawing */ } }); busy = false; };
  const queue = (svg) => { svg = top(svg); if (!svg.closest("[data-int], #sim")) return; pending.add(svg); if (!raf) raf = requestAnimationFrame(flush); };
  // re-check a drawing when its size really changes (not when a check leaves it as it was)
  const lastSize = new WeakMap();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver((es) => es.forEach((e) => { const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height); const l = lastSize.get(e.target); if (l && l[0] === w && l[1] === h) return; lastSize.set(e.target, [w, h]); queue(e.target); })) : null;
  const seen = new WeakSet();
  const scan = (root) => { const list = (root.matches && root.matches(PICS) ? [root] : []).concat([...(root.querySelectorAll ? root.querySelectorAll(PICS) : [])]);
    list.forEach((s) => { const t = top(s); queue(t); if (ro && !seen.has(t)) { seen.add(t); ro.observe(t); } }); };
  const start = () => {
    const mo = new MutationObserver((ms) => { if (busy) return; for (const m of ms) { const tgt = m.target.nodeType === 1 ? m.target : m.target.parentElement; if (!tgt || !tgt.closest) continue;
      if (m.type === "attributes" && m.attributeName === "dy") continue;
      const inSvg = tgt.closest("svg"); if (inSvg) queue(inSvg); m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n); }); } });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    scan(document.body);
    addEventListener("resize", () => document.querySelectorAll(PICS).forEach(queue));
  };
  B.ix.readable = readable;
  if (typeof MutationObserver === "undefined" || typeof requestAnimationFrame === "undefined") return; // not in a browser (tests)
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})(window.BIO);

// ---------------------------------------------------------------------------------------------------------------------
// Virtual benches on phones (layout pass 2, 2026-11-15). On a phone the bench drawing keeps a readable width and scrolls
// sideways inside its own box, pinned under the top bar (css/interactive-layout.css). So that the result of a step is in
// view, the box follows the change: for a moment after the student clicks or presses a key on the bench, the parts of the
// drawing that change are found and, if they are outside the visible part of the box, the box scrolls sideways to them
// (instantly when motion is reduced). Only the sideways scroll position of the drawing's own box changes; focus stays on
// the control. Laptop widths (761 px and over) show the whole drawing, so nothing happens there.
(function () {
  if (typeof MutationObserver === "undefined" || typeof document.addEventListener !== "function") return; // not in a browser (tests/run.js)
  const WATCH = ["hidden", "opacity", "transform", "style", "width", "height", "x", "y", "cx", "cy", "d"];
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
  let until = 0;
  const arm = (e) => { if (e.target && e.target.closest && e.target.closest(".bench-wrap.ix-bench-full")) until = performance.now() + 1800; };
  document.addEventListener("click", arm, true); document.addEventListener("keydown", arm, true);
  const seen = new WeakSet();
  const boxOf = (svg) => { const stage = svg.closest(".bench-stage"); for (let n = svg.parentElement; n && n !== stage; n = n.parentElement) if (n.scrollWidth > n.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return n; return null; };
  function follow(svg, els) {
    const box = boxOf(svg); if (!box) return; const sr = svg.getBoundingClientRect();
    // shapes that changed; if only a message changed (no shape), the message itself
    const span = (list) => { let l = Infinity, r = -Infinity; list.forEach((e) => { if (!e.isConnected || e === svg || e.closest("defs")) return; const q = e.getBoundingClientRect(); if (!q.width || !q.height || q.width > sr.width * 0.6) return; l = Math.min(l, q.left); r = Math.max(r, q.right); }); return [l, r]; };
    let [l, r] = span(els.filter((e) => e.closest && !e.closest("text"))); if (!isFinite(l)) [l, r] = span(els.filter((e) => e.closest && e.closest("text")).map((e) => e.closest("text")));
    if (!isFinite(l)) return; const br = box.getBoundingClientRect(); if (l >= br.left - 1 && r <= br.right + 1) return;
    box.scrollTo({ left: Math.max(0, box.scrollLeft + (l + r) / 2 - (br.left + br.width / 2)), behavior: reduced() ? "auto" : "smooth" });
  }
  function watch(svg) {
    if (seen.has(svg)) return; seen.add(svg); let pending = [], raf = 0;
    new MutationObserver((ms) => {
      if (innerWidth >= 761 || performance.now() > until) return;
      // a label whose size is adjusted (B.ix.readable) is not a change in the experiment: only new label text counts
      ms.forEach((m) => { const t = m.target; if (t.nodeType !== 1 || (m.type === "attributes" && t.closest("text"))) return; pending.push(t); m.addedNodes.forEach((a) => { if (a.nodeType === 1) pending.push(a); }); });
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; const els = pending; pending = []; follow(svg, els); });
    }).observe(svg, { subtree: true, childList: true, attributes: true, attributeFilter: WATCH });
  }
  let queued = false;
  const scan = () => { queued = false; document.querySelectorAll(".bench-wrap.ix-bench-full .bench-stage svg.bench-svg").forEach(watch); };
  const start = () => { new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(scan); } }).observe(document.body, { childList: true, subtree: true }); scan(); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
