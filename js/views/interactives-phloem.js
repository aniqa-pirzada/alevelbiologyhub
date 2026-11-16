// Interactives for 3.2.8.2 Phloem and the passage of organic substances through a plant (Phase 4 Batch 3, owned by the
// 3.2.8.2 author). Kinds: phloemExplorer (Phloem Translocation Explorer) and phloemEvidence (Experimental Evidence
// Challenge). Drawings come from B.phloemArt and data from B.phloemModel (data/content/_phloem-art.js), so the notes,
// the interactives and the questions share one source.
// Directions shown (checked in the author report): xylem water always moves UP from the roots to the leaves; phloem sap
// moves from the chosen source to the chosen sink, up or down. The mass flow schematic is redrawn the right way up for
// the chosen pair (sink on top when the sink is higher in the plant), so its xylem arrow also always points up.
// Accessibility: every control is a native button, radio input, checkbox or <details>; plant organs are focusable (Tab)
// and respond to Enter or Space; arrow keys move between the investigation tabs; changes are announced in polite live
// regions. Motion: nothing moves unless "Animate flow" is pressed; with reduced motion (system setting or site preference)
// the button is disabled and the static arrows carry the same information. UI text uses CSS tokens only; SVG drawings sit
// on the white figure panel in both themes. Layouts wrap and SVGs scale, so nothing scrolls sideways at 390 px.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.phloemArt;
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const alive = (host) => document.body.contains(host);

  // ======================================== Phloem Translocation Explorer ========================================
  const SOURCES = [["lower", "Lower mature leaf"], ["upper", "Upper mature leaf"], ["store", "Storage organ (spring)"]];
  const SINKS = [["tip", "Growing leaves at the shoot tip"], ["fruit", "Flowers and developing fruit"], ["root", "Root tips"], ["store", "Storage organ (summer)"]];
  const ORGAN_INFO = {
    tip: "Growing leaves at the shoot tip: a sink. Young leaves cannot yet make all the sugar they need, so they import sucrose for respiration and to build new cells. When mature they become sources.",
    upper: "Upper mature leaf: a source in the light. It photosynthesises more than it uses and exports sucrose, mostly to the nearest sinks above it (the shoot tip) but also to sinks below.",
    fruit: "Flowers and developing fruit: sinks. Flowers, and the fruits and seeds that develop from them, import sucrose for growth and store it as sugar, starch or oil.",
    lower: "Lower mature leaf: a source in the light. Lower leaves export mainly to the roots; leaves in the middle of a stem can export both up and down, in different sieve tubes.",
    store: "Storage organ (here a tuber): a sink in summer and autumn, when it stores sucrose as starch; a source in spring, when the starch is hydrolysed and sucrose is loaded into the phloem for the new shoots.",
    root: "Root tips: a sink. Roots cannot photosynthesise; they import sucrose for respiration (for example to provide ATP for active uptake of mineral ions) and for growth.",
  };
  const STEPS = [
    "1. At the source, companion cells actively load sucrose into the sieve tube elements, using ATP.",
    "2. This lowers the water potential of the sap, so water enters the sieve tube elements by osmosis, mostly from the xylem.",
    "3. The hydrostatic pressure at the source end rises.",
    "4. The sap flows by mass flow along the sieve tubes, from the high pressure at the source to the lower pressure at the sink.",
    "5. At the sink, sucrose is unloaded (by diffusion or active transport) and used in respiration or growth, or stored as starch.",
    "6. The water potential of the sap at the sink rises, so water leaves by osmosis; the pressure there stays lower, keeping the gradient.",
  ];
  const validPair = (src, snk) => {
    if (src === snk) return "A storage organ cannot be a source and a sink at the same time.";
    if (src === "store" && snk === "fruit") return "In spring, when the storage organ is a source, the plant has no flowers or fruit yet.";
    return "";
  };
  B.interactives.phloemExplorer = function (spec, host) {
    const Ar = A(), ORG = Ar.ORG;
    const st = { src: "lower", snk: "root", ring: false, step: 0, anim: false, raf: null };
    const vid = "phx-" + Math.random().toString(36).slice(2, 7);
    const radios = (name, list) => list.map(([k, l]) => `<label class="small" style="display:block;margin:.15rem 0"><input type="radio" name="${name}" value="${k}"> ${esc(l)}</label>`).join("");
    host.innerHTML = head(spec, "schematic model") + `
      <div class="ix ix-wide-stage ix-nosticky-sm"><div class="ix-body"><div class="ix-stage" data-ix-cap style="--ix-cap-less:3.6rem">
        <div class="ix-views" role="tablist" aria-label="Drawing to show"><button type="button" role="tab" class="btn sm primary" data-v="plant" id="${vid}-tp" aria-controls="${vid}-p" aria-selected="true">Whole plant</button><button type="button" role="tab" class="btn sm" data-v="model" id="${vid}-tm" aria-controls="${vid}-m" aria-selected="false" tabindex="-1">Mass flow model</button></div>
        <div class="figure" role="tabpanel" id="${vid}-p" aria-labelledby="${vid}-tp" data-view="plant" style="min-width:0"><div class="fig-view ix-hscroll" data-r="plant"></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p><p class="tiny muted" style="margin:.3rem .5rem">Select a part of the plant (or Tab to it and press Enter) to read about its role.</p></div>
        <div class="figure" role="tabpanel" id="${vid}-m" aria-labelledby="${vid}-tm" data-view="model" style="min-width:0" hidden><div class="ix-fig-notes"><div><div class="fig-view ix-hscroll" data-r="model"></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p></div><div data-r="mfnotes"></div></div></div>
      </div><div class="ix-panel">
        <div class="row" data-r="steprow" style="gap:.35rem;flex-wrap:wrap;margin:.4rem .5rem" hidden><button type="button" class="btn sm" data-a="prev">◀ Previous step</button><button type="button" class="btn sm primary" data-a="next">Next step ▶</button><button type="button" class="btn sm" data-a="all">Show all steps</button></div>
        <fieldset style="border:1px solid var(--line);border-radius:10px;padding:.4rem .8rem;min-width:200px"><legend class="small"><strong>Source</strong></legend><div data-r="src">${radios("src-" + Math.random().toString(36).slice(2, 7), SOURCES)}</div></fieldset>
        <fieldset style="border:1px solid var(--line);border-radius:10px;padding:.4rem .8rem;min-width:200px"><legend class="small"><strong>Sink</strong></legend><div data-r="snk">${radios("snk-" + Math.random().toString(36).slice(2, 7), SINKS)}</div></fieldset>
        <div style="min-width:200px"><label class="small" style="display:block"><input type="checkbox" data-a="ring"> Ring the stem (model: remove the phloem between the lower leaf and the soil)</label> <button type="button" class="btn sm mt" data-a="anim" aria-pressed="false">▶ Animate flow</button><p class="tiny muted" data-r="motion" style="margin:.3rem 0 0"></p></div>
        <p class="small" data-r="warn" style="color:var(--rose);margin:0" aria-live="polite"></p>
        <div class="card" style="background:var(--surface-2)"><p class="small" data-r="step" aria-live="polite" style="margin:0 0 .4rem"></p><div data-r="read"></div><p class="small" data-r="info" aria-live="polite" style="margin:.4rem 0 0"></p></div>
      </div></div></div>
      <div data-r="tbl" class="mt"></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    $$('[data-r="src"] input', host).forEach((i) => { i.checked = i.value === st.src; });
    $$('[data-r="snk"] input', host).forEach((i) => { i.checked = i.value === st.snk; });
    const motionNote = () => { const r = reduced(); const b = $('[data-a="anim"]', host); b.disabled = r; if (r && st.anim) stopAnim(); if (r) b.textContent = "Animate flow (off: reduced motion)"; else if (/off: reduced/.test(b.textContent)) b.textContent = "▶ Animate flow"; q("motion").textContent = r ? "Reduced motion is on: the arrows show the same movements without animation." : ""; };
    const up = () => ORG[st.snk].node < ORG[st.src].node;
    const blocked = () => st.ring && Ar.blockedByRing(st.src, st.snk);
    const readout = () => {
      const s = ORG[st.src].name, k = ORG[st.snk].name;
      const dir = up() ? "up" : "down";
      const season = st.src === "store" ? "Season: spring. The storage organ's starch is being hydrolysed to sugars, so it is a source. (The picture still shows the plant in summer.)" : st.snk === "store" ? "Season: summer or autumn. The storage organ is filling with starch, so it is a sink." : "";
      let flow = `<strong>Phloem:</strong> sap moves <strong>${dir}</strong> the stem from the ${esc(s)} (source) to the ${esc(k)} (sink). <strong>Xylem:</strong> water moves <strong>up</strong> from the roots to the leaves, ${up() ? "in the same direction as the phloem sap here" : "the opposite direction to the phloem sap here"}.`;
      if (blocked()) flow += ` <strong>Ringed:</strong> the phloem has been removed between the lower leaf and the soil, so sap from the ${esc(s)} cannot reach the ${esc(k)}. Sugars build up ${ORG[st.src].node < Ar.RING_Y ? "above" : "below"} the ring. The xylem is left in place, so water still reaches the leaves.`;
      else if (st.ring) flow += " <strong>Ringed:</strong> this source and sink are on the same side of the ring, so this flow is not affected; water still moves up in the xylem.";
      q("read").innerHTML = `<p class="small" style="margin:0">${flow}</p>${season ? `<p class="small" style="margin:.3rem 0 0">${season}</p>` : ""}`;
      // the source/sink table is full width under the drawing (it was cut off in the narrow controls column)
      q("tbl").innerHTML = `<div style="overflow-x:auto"><table class="tbl small"><thead><tr><th>In the sieve tube</th><th>At the source</th><th>At the sink</th></tr></thead><tbody>
        <tr><th>Sucrose concentration</th><td>High (loaded)</td><td>Lower (unloaded)</td></tr>
        <tr><th>Water potential of the sap</th><td>Lower (more negative)</td><td>Higher (less negative)</td></tr>
        <tr><th>Water movement</th><td>Enters by osmosis, mainly from the xylem</td><td>Leaves by osmosis, to sink cells and the xylem</td></tr>
        <tr><th>Hydrostatic pressure</th><td>High</td><td>Lower</td></tr></tbody></table></div>`;
    };
    const drawPlant = (refocus) => {
      q("plant").innerHTML = Ar.plant({ big: true, source: st.src, sink: st.snk, ring: st.ring, interactive: true, title: `Plant with ${ORG[st.src].name} as source and ${ORG[st.snk].name} as sink` });
      const svg = $("svg", q("plant")); svg.setAttribute("width", "100%"); svg.style.minWidth = "520px"; /* fits the stage on laptops; keeps 520 px and scrolls (ix-hscroll) on phones */ $$("[data-part]", svg).forEach((g) => { g.style.cursor = "pointer"; g.style.outline = "none"; });
      if (refocus) { const g = $(`[data-part="${refocus}"]`, svg); if (g) g.focus({ preventScroll: true }); }
      if (st.anim) startAnim();
    };
    const drawModel = () => { q("model").innerHTML = Ar.massFlow({ notes: false, big: true, flip: up(), focus: st.step, srcName: ORG[st.src].name.replace(" (tuber)", ""), snkName: ORG[st.snk].name.replace(" (tuber)", ""), title: `Mass flow from the ${ORG[st.src].name} to the ${ORG[st.snk].name}${st.step ? ", step " + st.step : ""}` });
      const ms = $("svg", q("model")); if (ms) { ms.setAttribute("width", "100%"); ms.style.minWidth = "520px"; }
      q("mfnotes").innerHTML = Ar.massFlowNotes({ focus: st.step });
      q("step").textContent = st.step ? STEPS[st.step - 1] : "All six steps are shown. Use Next step to go through them one at a time."; };
    // one drawing at a time (each large enough to read): the step buttons show the model, ringing and animation the plant
    const views = $$('[data-v]', host);
    const showView = (v, focus) => { views.forEach((b) => { const on = b.dataset.v === v; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; b.classList.toggle("primary", on); if (on && focus) b.focus(); });
      $$('[data-view]', host).forEach((f) => { f.hidden = f.dataset.view !== v; });
      // the mass-flow step controls and step message belong to the Mass flow model view only
      q("steprow").hidden = v !== "model"; q("step").hidden = v !== "model"; };
    views.forEach((b) => b.addEventListener("click", () => showView(b.dataset.v)));
    $(".ix-views", host).addEventListener("keydown", (e) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return; e.preventDefault(); const cur = views.findIndex((b) => b.getAttribute("aria-selected") === "true"); const n = e.key === "Home" ? 0 : e.key === "End" ? views.length - 1 : (cur + (e.key === "ArrowRight" ? 1 : -1) + views.length) % views.length; showView(views[n].dataset.v, true); });
    const setDisabled = () => {
      $$('[data-r="snk"] input', host).forEach((i) => { const why = validPair(st.src, i.value); i.disabled = !!why; i.parentElement.title = why; i.parentElement.style.opacity = why ? ".5" : "1"; });
      // sources are never disabled: choosing one that does not fit the current sink changes the sink (and says so)
    };
    const all = () => { setDisabled(); drawPlant(); drawModel(); readout(); };
    host.addEventListener("change", (e) => {
      const t = e.target;
      if (t.closest('[data-r="src"]')) { st.src = t.value; const why = validPair(st.src, st.snk); if (why) { q("warn").textContent = why + " The sink has been changed to the growing leaves."; st.snk = "tip"; $$('[data-r="snk"] input', host).forEach((i) => { i.checked = i.value === st.snk; }); } else q("warn").textContent = ""; all(); }
      else if (t.closest('[data-r="snk"]')) { st.snk = t.value; q("warn").textContent = ""; all(); }
      else if (t.dataset.a === "ring") { st.ring = t.checked; showView("plant"); all(); q("info").textContent = st.ring ? "Model ring: the phloem has been removed here and the xylem left. Real ringing experiments use woody stems, where the phloem is in the bark (see the ringing figure); a potato stem has no bark, and its phloem is inside the vascular bundles." : "The ring has been removed from the model."; }
    });
    host.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]"); if (!a || !host.contains(a)) return; const k = a.dataset.a;
      if (k === "next" || k === "prev") { st.step = k === "next" ? (st.step % 6) + 1 : st.step <= 1 ? 6 : st.step - 1; showView("model"); drawModel(); return; }
      if (k === "all") { st.step = 0; showView("model"); drawModel(); return; }
      if (k === "anim") { if (reduced()) return; showView("plant"); st.anim ? stopAnim() : startAnim(); }
    });
    // organ selection: information only
    const pick = (g) => { const k = g.dataset.part; q("info").textContent = ORGAN_INFO[k] || ""; };
    q("plant").addEventListener("click", (e) => { const g = e.target.closest("[data-part]"); if (g) pick(g); });
    q("plant").addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const g = e.target.closest("[data-part]"); if (g) { e.preventDefault(); pick(g); } });
    // ---- animation: dots along the phloem path (orange) and the xylem paths (blue) ----
    const along = (pts, f) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; } let t = f * L; for (let i = 0; i < seg.length; i++) { if (t <= seg[i]) { const r = seg[i] ? t / seg[i] : 0; return [pts[i][0] + r * (pts[i + 1][0] - pts[i][0]), pts[i][1] + r * (pts[i + 1][1] - pts[i][1])]; } t -= seg[i]; } return pts[pts.length - 1]; };
    function stopAnim() { st.anim = false; if (st.raf) cancelAnimationFrame(st.raf); st.raf = null; const g = $('[data-r="dots"]', host); if (g) g.remove(); const b = $('[data-a="anim"]', host); b.setAttribute("aria-pressed", "false"); b.textContent = "▶ Animate flow"; }
    function startAnim() {
      if (reduced()) return; st.anim = true; const b = $('[data-a="anim"]', host); b.setAttribute("aria-pressed", "true"); b.textContent = "❚❚ Stop animation";
      if (st.raf) cancelAnimationFrame(st.raf);
      const svg = $("svg", q("plant")); if (!svg) return; let g = $('[data-r="dots"]', svg); if (g) g.remove();
      g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("data-r", "dots"); g.setAttribute("aria-hidden", "true"); svg.append(g);
      let ph = Ar.phloemPath(st.src, st.snk);
      if (blocked()) { const out = []; for (let i = 0; i < ph.length; i++) { out.push(ph[i]); const n = ph[i + 1]; if (n && (ph[i][1] - Ar.RING_Y) * (n[1] - Ar.RING_Y) < 0) { out.push([ph[i][0], ph[i][1] < Ar.RING_Y ? Ar.RING_Y - 14 : Ar.RING_Y + 14]); break; } } ph = out; }
      const xy = Ar.xylemPaths(); const NP = 9, NX = 7;
      const mk = (fill, r) => { const c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("r", r); c.setAttribute("fill", fill); g.append(c); return c; };
      const pd = Array.from({ length: NP }, () => mk("#c0610f", 5.5)); const xd = xy.map(() => Array.from({ length: NX }, () => mk("#1f63b5", 4)));
      const t0 = performance.now();
      const tick = (now) => { if (!alive(host) || !st.anim) { st.raf = null; return; } const s = (now - t0) / 1000;
        pd.forEach((c, i) => { const f = ((s / 6) + i / NP) % 1; const [x, y] = along(ph, f); c.setAttribute("cx", x); c.setAttribute("cy", y); });
        xd.forEach((arr, j) => arr.forEach((c, i) => { const f = ((s / (j ? 3 : 7)) + i / NX) % 1; const [x, y] = along(xy[j], f); c.setAttribute("cx", x); c.setAttribute("cy", y); }));
        st.raf = requestAnimationFrame(tick); };
      st.raf = requestAnimationFrame(tick);
    }
    try { matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", motionNote); } catch (e) { /* older browsers */ }
    motionNote(); all(); showView("plant");
    renderQs(spec.questions, q("q"));
  };

  // ======================================== Experimental Evidence Challenge ========================================
  B.interactives.phloemEvidence = function (spec, host) {
    const items = spec.items || []; let cur = 0; const built = new Set();
    host.innerHTML = head(spec, "illustrative data") + `
      <div class="row mt" role="tablist" aria-label="investigations" data-r="tabs" style="flex-wrap:wrap;gap:.35rem"></div>
      <p class="tiny muted" data-r="pos" aria-live="polite" style="margin:.4rem 0 0"></p>
      <div data-r="panels"></div>`;
    const bar = $('[data-r="tabs"]', host), panels = $('[data-r="panels"]', host);
    bar.innerHTML = items.map((it, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" role="tab" id="ev-tab-${it.key}" aria-controls="ev-pan-${it.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${i + 1}. ${esc(it.title)} <span class="tiny">(${esc(it.tissue)})</span></button>`).join("");
    panels.innerHTML = items.map((it, i) => `<section role="tabpanel" id="ev-pan-${it.key}" aria-labelledby="ev-tab-${it.key}" data-i="${i}" ${i ? "hidden" : ""} class="mt"></section>`).join("");
    const build = (i) => { if (built.has(i)) return; built.add(i); const it = items[i]; const p = $(`[data-i="${i}"]`, panels);
      p.innerHTML = `<div class="row" style="gap:.4rem;flex-wrap:wrap;align-items:center"><span class="badge ${it.tissue === "xylem" ? "navy" : "amber"}">${esc(it.tissue)}</span><span class="badge amber">illustrative data</span></div>
        <h4 style="margin:.5rem 0 .2rem">${esc(it.title)}</h4><p class="small"><strong>Method.</strong> ${esc(it.method)}</p>
        <div class="figure"><div class="fig-view" style="padding:.4rem">${typeof it.data === "function" ? it.data() : it.data || ""}</div></div>
        <details class="mt small"><summary>What the real experiments found</summary><p class="small">${esc(it.real || "")}</p></details>
        <div data-r="qs" class="mt"></div>`;
      // figures are drawn narrow enough to fit a 390 px screen in full (no inner scrolling needed)
      renderQs(it.questions, $('[data-r="qs"]', p)); };
    const show = (i, focus) => { cur = (i + items.length) % items.length; build(cur);
      $$('[role="tab"]', bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); });
      $$('[role="tabpanel"]', panels).forEach((p, k) => { p.hidden = k !== cur; });
      $('[data-r="pos"]', host).textContent = `Investigation ${cur + 1} of ${items.length}: ${items[cur].title} (${items[cur].tissue}).`;
      if (focus) $$('[role="tab"]', bar)[cur].focus(); };
    $$('[role="tab"]', bar).forEach((b, i) => b.addEventListener("click", () => show(i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = items.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(0);
  };
})(window.BIO);
