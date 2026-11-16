// Interactives for 3.2.8.1 Xylem and the passage of water and mineral ions through a plant (Phase 4 Batch 3, owned by the
// 3.2.8.1 author). Kinds: xylemRootExplorer, xylemPathwaySim, xylemTransportExplorer, xylemTranspirationSim.
// Drawings come from B.xylemArt and water potential scenarios from B.xylemModel (data/content/_xylem-art.js); every
// transpiration number comes from the shared illustrative model B.plantModel (data/content/_plant-model.js), the same
// model the RP6 potometer laboratory uses.
// Accessibility: every control is a native button, input, select or checkbox; diagram parts that can be chosen are
// focusable (Tab) and respond to Enter or Space; tab rows use arrow keys; results are announced in polite live regions.
// Motion: nothing animates by itself. With reduced motion (system setting or the site preference) Play moves one step
// forward per press, with no continuous movement. Each drawing sits beside its controls and text on wide screens
// (B.ix.split) and above them on narrow screens. Release fix pass 2026-11-15: vacuolar route removed; symplast drawn in
// the cytoplasm, never through a vacuole; Transport Explorer reduced to one view; simulator readouts shortened.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.xylemArt, XM = () => B.xylemModel, PM = () => B.plantModel;
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const alive = (host) => document.body.contains(host);
  const seededShuffle = (arr, seed) => { const a = arr.slice(); let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const tabs = (bar, labels, onShow, label) => { let cur = 0; bar.setAttribute("role", "tablist"); if (label) bar.setAttribute("aria-label", label);
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    return show; };
  const wireParts = (box, fn) => { box.addEventListener("click", (e) => { const g = e.target.closest("[data-part]"); if (g && box.contains(g)) fn(g.dataset.part, g); });
    box.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const g = e.target.closest("[data-part]"); if (g && box.contains(g)) { e.preventDefault(); fn(g.dataset.part, g); } }); };
  const fmt = (x, dp = 2) => (Math.round(x * 10 ** dp) / 10 ** dp).toFixed(dp);
  const kpaStr = (v) => `${v < 0 ? "−" : ""}${Math.abs(v) >= 10000 ? Math.abs(v).toLocaleString("en-GB").replace(/,/g, " ") : Math.abs(v)} kPa`;

  // ======================================== 1. Dicot Root Explorer ========================================
  const TISSUE = {
    roothair: { badge: "required", what: "A long, thin outgrowth of a single epidermis cell, found only in the root-hair zone just behind the growing tip.", role: "Gives a very large surface area for uptake. Water enters by osmosis across its cell-surface membrane; mineral ions are taken up mainly by active transport using carrier proteins and ATP (3.1.4.3). It has a thin cellulose wall and no cuticle, so the diffusion distance is short.", micro: "Not visible in the micrograph: the section was cut from an older part of the root, above the root-hair zone." },
    epidermis: { badge: "supporting", what: "The outer layer of the root, one cell thick.", role: "Some of its cells grow root hairs. Water passes from the soil into these cells and their walls; there is no waxy cuticle to block it.", micro: "The thin, slightly wavy outer edge of the section." },
    cortex: { badge: "required", what: "Many layers of large, rounded, thin-walled parenchyma cells with air spaces between them.", role: "Water crosses the cortex towards the centre in two ways: through the cell walls (apoplastic pathway) and through the cytoplasm, from cell to cell through plasmodesmata (symplastic pathway). The cortex also stores starch.", micro: "The wide pale zone that makes up most of the section; at ×400 the cells are full of round starch grains." },
    endodermis: { badge: "required", what: "A single ring of tightly packed cells around the central vascular tissue (the stele).", role: "Its radial and end walls contain the Casparian strip (supporting), a waterproof band that blocks the apoplastic pathway. Water and mineral ions must cross a cell-surface membrane into the cytoplasm here, so the plant controls what reaches the xylem.", micro: "At ×400, a ring of small, tightly fitting cells just outside the xylem star, with darker-stained walls." },
    pericycle: { badge: "supporting", what: "A layer of living cells just inside the endodermis, around the xylem and phloem.", role: "Water passes through it into the xylem. Together with the endodermis it helps load mineral ions into the xylem by active transport, which causes root pressure. (Lateral roots also grow from the pericycle.)", micro: "A thin ring of small cells between the endodermis and the tips of the xylem arms." },
    xylem: { badge: "required", what: "A central star of vessels with four arms in this root; narrow vessels at the tips of the arms, wide ones in the middle.", role: "Dead, empty, lignified tubes that carry water and dissolved mineral ions up to the stem and leaves. Water enters them through pits from the surrounding living cells.", micro: "The cross of thick-walled cells stained red at the centre: red shows lignin." },
    phloem: { badge: "supporting", what: "Small groups of sieve tubes and companion cells lying between the arms of the xylem.", role: "Carries organic substances such as sucrose to the root (3.2.8.2). It is not part of the water pathway.", micro: "Small, thin-walled cells in the four gaps between the red xylem arms." },
  };
  const TRACE = ["roothair", "cortex", "endodermis", "pericycle", "xylem"];
  const TRACE_TXT = ["Water from the soil enters a root hair cell by osmosis.", "It crosses the cortex through cell walls (apoplast) and through cytoplasm and plasmodesmata (symplast).", "At the endodermis the Casparian strip blocks the cell walls, so all of it passes through the cytoplasm of endodermis cells.", "It passes through the pericycle.", "It enters the xylem vessels through pits and is carried up to the stem."];
  B.interactives.xylemRootExplorer = function (spec, host) {
    const st = { mode: 0, labels: true, hl: null, z: 1, trace: 0, idList: seededShuffle(A().PARTS, Date.now() % 991), idPos: 0, idScore: 0, idTried: false, idDone: false };
    host.innerHTML = head(spec, "schematic, Ranunculus pattern") + `
      <div class="row mt" data-r="tabs" style="flex-wrap:wrap;gap:.35rem"></div>` + B.ix.split(`<div class="figure"><div class="fig-view" data-r="fig" style="overflow:auto"></div></div>`, `
        <div class="row" style="gap:.3rem;flex-wrap:wrap;align-items:center"><button type="button" class="btn sm" data-a="zout" aria-label="zoom out">−</button><button type="button" class="btn sm" data-a="zin" aria-label="zoom in">+</button><button type="button" class="btn sm" data-a="zreset">Reset zoom</button>
          <label class="small" style="margin-left:.3rem"><input type="checkbox" data-a="labels" checked> Show labels</label></div>
        <div class="readout"><div data-r="panel"></div><p class="small" aria-live="polite" data-r="live" style="margin:.4rem 0 0"></p></div>`) + `
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const fig = q("fig");
    const draw = (refocus) => { const hideLabels = st.mode === 2 || !st.labels; fig.innerHTML = A().rootTS({ interactive: true, labels: !hideLabels, highlight: st.hl, title: "Interactive root section" });
      const svg = $("svg", fig); if (st.z !== 1) { svg.style.width = (fig.clientWidth || 600) * st.z + "px"; svg.style.maxWidth = "none"; svg.style.maxHeight = "none"; }
      const lb = $('[data-a="labels"]', host); if (lb) { lb.disabled = st.mode === 2; lb.checked = st.mode === 2 ? false : st.labels; }
      $$("[data-part]", svg).forEach((g) => { g.style.cursor = "pointer"; if (st.mode === 2) { g.setAttribute("aria-label", "root tissue: choose"); $$(":scope > title", g).forEach((t) => t.remove()); } });
      if (refocus) { const g = $(`[data-part="${refocus}"]`, svg); if (g) g.focus({ preventScroll: true }); } };
    const info = (k) => { const t = TISSUE[k]; return `<p class="small"><strong>${esc(A().LABELS[k])}</strong> <span class="badge ${t.badge === "required" ? "teal" : ""}">${t.badge}</span></p><p class="small"><strong>Structure.</strong> ${esc(t.what)}</p><p class="small"><strong>Role in the water pathway.</strong> ${esc(t.role)}</p><p class="small muted"><strong>In the Ranunculus micrograph.</strong> ${esc(t.micro)}</p>`; };
    const panels = [
      () => `<p class="small"><strong>Explore.</strong> Select any tissue (click, or Tab to it and press Enter) to see its structure and its part in the pathway of water.</p><div data-r="info"></div>`,
      () => `<p class="small"><strong>Trace the water.</strong> Step ${st.trace + 1} of ${TRACE.length}: ${esc(TRACE_TXT[st.trace])}</p><div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="tprev" ${st.trace === 0 ? "disabled" : ""}>◀ Previous</button><button type="button" class="btn sm primary" data-a="tnext" ${st.trace === TRACE.length - 1 ? "disabled" : ""}>Next ▶</button><button type="button" class="btn sm" data-a="tstart">Start again</button></div><p class="tiny muted">Highlighted: ${esc(A().LABELS[TRACE[st.trace]])}. The order to learn: root hair → cortex → endodermis → (pericycle) → xylem.</p>`,
      () => st.idDone ? `<p class="small"><strong>Identify.</strong> You found ${st.idScore} of ${st.idList.length} at the first attempt.</p><button type="button" class="btn sm primary" data-a="idagain">Try again in a new order</button>` : `<p class="small"><strong>Identify.</strong> Labels are hidden. ${st.idPos + 1} of ${st.idList.length}: select the <strong>${esc(A().LABELS[st.idList[st.idPos]].toLowerCase())}</strong>.</p><p class="tiny muted">Score so far: ${st.idScore} (first attempts only).</p>`,
      () => `<p class="small"><strong>Compare with a real root.</strong> These micrographs are buttercup (<em>Ranunculus</em>) roots, the same pattern as the drawing. Use them to check each tissue's position, then select a tissue in the drawing to read where to find it in the photographs.</p><div class="grid two" style="gap:.6rem">${B.views.photo("root-ranunculus")}${B.views.photo("root-stele")}</div><div data-r="info"></div>`,
    ];
    const setPanel = () => { q("panel").innerHTML = panels[st.mode](); };
    const showTab = tabs(q("tabs"), ["Explore", "Trace the water", "Identify", "Compare with a micrograph"], (i) => { st.mode = i; st.hl = i === 1 ? TRACE[st.trace] : null; st.idTried = false; draw(); setPanel(); }, "ways to use the root model");
    host.addEventListener("click", (e) => { const a = e.target.closest("[data-a]"); if (!a || !host.contains(a)) return; const k = a.dataset.a;
      if (k === "zin" || k === "zout" || k === "zreset") { st.z = k === "zreset" ? 1 : Math.max(0.6, Math.min(2.5, st.z + (k === "zin" ? 0.25 : -0.25))); draw(); q("live").textContent = `Zoom ${Math.round(st.z * 100)} %`; return; }
      if (k === "tnext" || k === "tprev" || k === "tstart") { st.trace = k === "tstart" ? 0 : Math.max(0, Math.min(TRACE.length - 1, st.trace + (k === "tnext" ? 1 : -1))); st.hl = TRACE[st.trace]; draw(); setPanel(); q("live").textContent = TRACE_TXT[st.trace]; const nb = $('[data-a="tnext"]', host); if (nb && !nb.disabled) nb.focus(); else { const pb = $('[data-a="tprev"]', host); if (pb) pb.focus(); } return; }
      if (k === "idagain") { st.idList = seededShuffle(A().PARTS, (Date.now() + 13) % 991); st.idPos = 0; st.idScore = 0; st.idDone = false; st.idTried = false; draw(); setPanel(); } });
    $('[data-a="labels"]', host).addEventListener("change", (e) => { st.labels = e.target.checked; draw(); });
    wireParts(fig, (k) => { const name = A().LABELS[k];
      if (st.mode === 0 || st.mode === 3) { st.hl = k; draw(k); const box = $('[data-r="info"]', host); if (box) box.innerHTML = info(k); q("live").textContent = `${name}. ${TISSUE[k].role}`; return; }
      if (st.mode === 1) { const pos = TRACE.indexOf(k); q("live").textContent = pos >= 0 ? `${name} is step ${pos + 1} of the water pathway.` : `${name} is not on the main pathway of water into the xylem.`; return; }
      if (st.mode === 2 && !st.idDone) { const want = st.idList[st.idPos];
        if (k === want) { if (!st.idTried) st.idScore++; q("live").textContent = `Correct: that is the ${name.toLowerCase()}.`; st.idPos++; st.idTried = false; if (st.idPos >= st.idList.length) st.idDone = true; st.hl = null; draw(); setPanel(); }
        else { st.idTried = true; st.hl = k; draw(k); q("live").textContent = `Not quite: that is the ${name.toLowerCase()}. Find the ${A().LABELS[want].toLowerCase()}.`; } } });
    draw(); setPanel(); showTab(0); renderQs(spec.questions, q("q"));
  };

  // ======================================== 2. Apoplast versus Symplast Simulator ========================================
  const EVT = {
    soil: () => "Soil water between the soil particles: a dilute solution with a high water potential.",
    "m-in": (s, i) => i <= 1 ? "Water enters the root hair cell by osmosis across its partially permeable cell-surface membrane: the cytoplasm and vacuole hold dissolved ions and sugars, so their water potential is lower than the soil water's." : s.route === "apo" ? "To get past the Casparian strip, water must cross the partially permeable cell-surface membrane of an endodermis cell by osmosis: it joins the symplast." : "Water crosses the cell-surface membrane of the next cell by osmosis.",
    cyto: () => "Water moves through the cytoplasm of a living cell (symplast), not through the vacuole.",
    pd: () => "Through a plasmodesma: a narrow channel through the cell walls that joins the cytoplasm of neighbouring cells, so no membrane is crossed here.",
    "endo-cyto": () => "In the cytoplasm of an endodermis cell. Everything that reaches the xylem has now passed through living cytoplasm.",
    "m-out": (s, i, nx) => nx === "xylem" ? "Water leaves the living cells across a cell-surface membrane and passes through a pit into the xylem vessel." : "Water leaves this cell across its cell-surface membrane into the cell wall, then enters the next cell.",
    xylem: () => "Inside a xylem vessel: a dead, empty tube with lignified walls.",
    up: (s) => s.transp ? "Pulled up the xylem towards the leaves by the tension that transpiration creates (cohesion–tension)." : rootP(s) ? "No transpiration, so it is pushed up slowly by root pressure: ions loaded into the xylem lower its water potential and water follows by osmosis." : "With no transpiration and no root pressure, water hardly moves up at all.",
    wall: () => "Moving through the cellulose cell walls (apoplast): water soaks along the spaces between cellulose fibres without crossing any membrane. This route offers little resistance.",
    casp: (s) => s.casp ? "Blocked: the Casparian strip, a waterproof band (supporting; textbooks say suberin, research shows mainly lignin) in the radial and end walls of the endodermis cells, stops water travelling further in the cell walls." : "No Casparian strip in this thought experiment: water carries on through the walls of the endodermis.",
    pit: () => "Through a pit (an unlignified gap in the wall) into the xylem vessel.",
  };
  const rootP = (s) => s.resp && s.casp; // ions loaded and kept in the xylem
  const routeOf = (s) => { const R = A().ROUTES; if (s.route === "sym") return R.sym; return s.casp ? R.apo.concat(R.apoBlocked) : R.apo.slice(0, -1).concat(R.apoOpen); };
  const isMem = (e) => /^(m-in|m-out)$/.test(e);
  // where a mineral ion stops (index into the route) given the conditions; null = reaches the xylem
  const ionStop = (s, pts) => { for (let i = 0; i < pts.length; i++) { const e = pts[i][2]; const nx = (pts[i + 1] || [])[2];
      if (e === "m-in" && !s.resp) return { i, why: "No ATP: without respiration there is no active transport, so the ion cannot be taken up across this membrane." };
      if (e === "m-out" && nx === "xylem" && !s.resp) return { i, why: "No ATP: ions cannot be actively loaded into the xylem." }; } return null; };
  B.interactives.xylemPathwaySim = function (spec, host) {
    const st = { route: "apo", casp: true, resp: true, transp: true, ions: false, i: 0, f: 0, playing: false, raf: null, timer: null };
    host.innerHTML = head(spec, "schematic, not to scale") + B.ix.split(`<div class="figure"><div class="fig-view ix-hscroll" data-r="fig"></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p></div>`, `
        <fieldset><legend>Pathway</legend>
          <label class="small"><input type="radio" name="xr" value="apo" checked> Apoplastic (cell walls)</label>
          <label class="small"><input type="radio" name="xr" value="sym"> Symplastic (cytoplasm and plasmodesmata)</label></fieldset>
        <div class="row" style="flex-wrap:wrap;gap:.35rem">
          <button type="button" class="btn sm primary" data-a="play" aria-pressed="false">▶ Play</button>
          <button type="button" class="btn sm" data-a="back">◀ Back</button><button type="button" class="btn sm" data-a="fwd">Forward ▶</button>
          <button type="button" class="btn sm" data-a="reset">↺ Start</button></div>
        <div class="readout"><p class="small" data-r="step" aria-live="polite" style="margin:0"></p>
          <p class="tiny muted" data-r="count" style="margin:.35rem 0 0"></p></div>
        <fieldset><legend>Change the conditions</legend>
          <label class="small"><input type="checkbox" data-c="casp" checked> Casparian strip present</label>
          <label class="small"><input type="checkbox" data-c="resp" checked> Root cells respiring (ATP available)</label>
          <label class="small"><input type="checkbox" data-c="transp" checked> Shoot transpiring</label>
          <label class="small"><input type="checkbox" data-c="ions"> Follow a mineral ion too</label></fieldset>`, { cls: "ix-wide-stage" }) + `
      <div data-r="outcome" class="small mt"></div>
      <details class="mt"><summary class="small"><strong>Things to investigate</strong></summary><ol class="small">
        <li>Follow the apoplastic pathway to the endodermis. What stops it, and what must the water do next? Count the membranes it crosses, then compare with the symplastic pathway.</li>
        <li>Untick <em>Casparian strip present</em> (a thought experiment: real roots always have one). Where can the water and ions go now? Could the plant still choose which ions reach the xylem? What happens to root pressure?</li>
        <li>Tick <em>Follow a mineral ion</em>, then untick <em>Root cells respiring</em>. Which still moves, the water or the ion? Why?</li>
        <li>Untick <em>Shoot transpiring</em> (night, or the shoot cut off). How is water moved up now, and what does root pressure need?</li></ol></details>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const C = A().colours;
    const speed = () => (st.transp ? "fast" : rootP(st) ? "slow" : "none");
    const pts = () => routeOf(st);
    const draw = () => { q("fig").innerHTML = A().pathwayStrip({ casparian: st.casp, routes: [st.route], title: "Pathway simulator" }); const sv = $("svg", q("fig")); if (sv) { sv.setAttribute("width", "100%"); sv.style.minWidth = "640px"; } /* fits on laptops; 640 px minimum and sideways scroll on phones */ placeDot(); report(); };
    const pos = () => { const p = pts(); const a = p[st.i], b = p[Math.min(st.i + 1, p.length - 1)]; return [a[0] + (b[0] - a[0]) * st.f, a[1] + (b[1] - a[1]) * st.f]; };
    const placeDot = () => { const ov = $('[data-r="overlay"]', q("fig")); if (!ov) return; const [x, y] = pos(); let s = `<circle cx="${x}" cy="${y}" r="11" fill="${C.water}" stroke="#fff" stroke-width="3"/>`;
      if (st.ions) { const p = pts(); const stop = ionStop(st, p); let ix = x, iy = y;
        if (stop && (st.i > stop.i - 1 || (st.i === stop.i - 1 && st.f > 0.7))) { const a0 = p[stop.i - 1], a1 = p[stop.i]; ix = a0[0] + (a1[0] - a0[0]) * 0.7; iy = a0[1] + (a1[1] - a0[1]) * 0.7; }
        s += `<circle cx="${ix}" cy="${iy + 18}" r="8" fill="${C.ion}" stroke="#fff" stroke-width="2.5"/>`; }
      ov.innerHTML = s; };
    const report = () => { const p = pts(); const e = p[st.i][2]; const nx = (p[st.i + 1] || [])[2]; let txt = `${st.i + 1} of ${p.length}. ` + EVT[e](st, st.i, nx);
      if (st.ions) { const stop = ionStop(st, p); if (stop && st.i >= stop.i) txt += ` Mineral ion: ${stop.why}`; else if (e === "m-in" && st.i <= 1) txt += " Mineral ion: taken up by active transport through a carrier protein, using ATP from respiration (3.1.4.3), often against its concentration gradient."; else if (e === "m-in" && st.route === "apo") txt += " Mineral ion: it can cross only if a carrier protein for that ion is present and ATP is available, so the endodermis is where the plant selects which ions go on to the xylem (supporting)."; else if (e === "wall") txt += " Mineral ion: carried along passively in the water in the walls."; else if (e === "m-out") txt += nx === "xylem" ? " Mineral ion: actively loaded into the xylem." : " Mineral ion: passes out into the cell wall, then must be taken into the next cell."; }
      if (e === "up" && speed() === "none") txt += " (Try ticking Shoot transpiring or Root cells respiring.)";
      q("step").textContent = txt;
      const mem = p.slice(0, st.i + 1).filter((x) => isMem(x[2])).length; const total = p.filter((x) => isMem(x[2])).length;
      q("count").textContent = `Membranes crossed so far: ${mem} (this route: ${total} in total). Water flow up the xylem: ${speed() === "fast" ? "fast, pulled by transpiration" : speed() === "slow" ? "slow, pushed by root pressure" : "almost none"}.`;
      const out = []; if (!st.casp) out.push("<strong>Without a Casparian strip</strong> water and dissolved ions could reach the xylem entirely through cell walls, crossing no membrane, so the plant could not select which ions enter (harmful ions included), and ions pumped into the xylem would leak back out through the walls, so root pressure could not build up.");
      if (!st.resp) out.push("<strong>With no respiration</strong> there is no ATP, so no active transport: mineral ions are not taken up or loaded into the xylem and there is no root pressure. Water still moves passively by osmosis and in the walls if the shoot is transpiring, because transpiration pull needs no energy from the root.");
      if (!st.transp) out.push(rootP(st) ? "<strong>No transpiration</strong>: there is no tension in the xylem. Water still rises slowly because ions actively loaded into the xylem lower its water potential, water follows by osmosis and the pressure (root pressure) pushes the sap up. This is why sap oozes from a cut stem." : "<strong>No transpiration and no root pressure</strong>: almost no water moves up the xylem.");
      if (st.casp && st.resp && st.transp) out.push("Normal conditions: both pathways carry water across the cortex; all of it must enter the symplast at the endodermis. The apoplast offers less resistance, so when transpiration is rapid much of the water crossing the cortex travels in the walls (supporting).");
      q("outcome").innerHTML = out.map((x) => `<p class="small" style="margin:.2rem 0">${x}</p>`).join(""); };
    const stop = () => { st.playing = false; if (st.raf) cancelAnimationFrame(st.raf); if (st.timer) clearTimeout(st.timer); st.raf = st.timer = null; const b = $('[data-a="play"]', host); b.textContent = "▶ Play"; b.setAttribute("aria-pressed", "false"); };
    const canGo = () => { const p = pts(); if (st.i >= p.length - 1) return false; if (p[st.i][2] === "up" || (st.i === p.length - 2 && speed() === "none")) return false; return true; };
    const step = (d) => { const p = pts(); st.f = 0; st.i = Math.max(0, Math.min(p.length - 1, st.i + d)); if (d > 0 && st.i === p.length - 1 && speed() === "none") st.i = p.length - 2; placeDot(); report(); };
    const play = () => { if (!canGo()) { st.i = 0; st.f = 0; } st.playing = true; const b = $('[data-a="play"]', host); b.textContent = "❚❚ Pause"; b.setAttribute("aria-pressed", "true");
      if (reduced()) { stop(); if (canGo()) step(1); else report(); return; } // reduced motion: each press of Play is one step forward
      let last = performance.now(); const fr = (t) => { if (!st.playing || !alive(host)) return stop(); const p = pts(); const a = p[st.i], bb = p[st.i + 1]; const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]) || 1; const v = (st.i >= p.length - 2 ? (speed() === "slow" ? 40 : 160) : 110);
        st.f += ((t - last) / 1000) * v / L; last = t; if (st.f >= 1) { st.f = 0; st.i++; report(); if (!canGo()) { placeDot(); return stop(); } if (isMem(p[st.i][2]) || p[st.i][2] === "casp") { placeDot(); st.timer = setTimeout(() => { last = performance.now(); st.raf = requestAnimationFrame(fr); }, 900); return; } } placeDot(); st.raf = requestAnimationFrame(fr); };
      st.raf = requestAnimationFrame(fr); };
    $$('input[name="xr"]', host).forEach((r) => r.addEventListener("change", () => { st.route = r.value; st.i = 0; st.f = 0; stop(); draw(); }));
    $$("[data-c]", host).forEach((c) => c.addEventListener("change", () => { st[c.dataset.c] = c.checked; stop(); const n = pts().length; if (st.i >= n) st.i = n - 1; st.f = 0; draw(); }));
    host.addEventListener("click", (e) => { const a = e.target.closest("[data-a]"); if (!a || !host.contains(a)) return; const k = a.dataset.a;
      if (k === "play") { st.playing ? stop() : play(); } else if (k === "fwd") { stop(); step(1); } else if (k === "back") { stop(); step(-1); } else if (k === "reset") { stop(); st.i = 0; st.f = 0; placeDot(); report(); } });
    draw(); renderQs(spec.questions, q("q"));
  };

  // ======================================== 3. Xylem Transport Explorer ========================================
  const ST_INFO = [
    "Water in the soil around the root hairs. Its water potential is highest (closest to 0 kPa) when the soil is wet.",
    "Root hair cell: dissolved ions and sugars give its cytoplasm and vacuole a lower water potential than the soil water, so water enters by osmosis.",
    "Root cortex: water moves from cell to cell (symplast) and through the walls (apoplast) down the water potential gradient.",
    "Root xylem: water has crossed the endodermis. Ions loaded into the xylem lower the sap's water potential; at night this gives root pressure.",
    "Stem xylem: in the day the water is under tension (a negative pressure), so its water potential is lower here than in the root.",
    "Leaf xylem: veins deliver water close to every mesophyll cell.",
    "Mesophyll cell walls: water moves out of the xylem into the cells and their walls. A thin film of water on the cell walls lines the air spaces.",
    "Air spaces in the leaf: water evaporates from the wet cell walls into the air spaces, which are almost saturated with water vapour.",
    "Air outside the leaf: water vapour diffuses out through open stomata to the drier air outside. Even humid air has a water potential far lower than the leaf's.",
  ];
  // Release fix pass (2026-11-15): the Leaf, Xylem and Root pressure tabs repeated figures d-3.2.8.1-4, -5 and -6 on the
  // same page and were removed. One view remains: the whole plant with each value printed beside its point, the air
  // bubble, and the root pressure height slider.
  B.interactives.xylemTransportExplorer = function (spec, host) {
    const M = XM(); const keys = Object.keys(M.SC); const st = { sc: "sunny", sel: -1, emb: false, h: 30 };
    const hid = "xh-" + Math.random().toString(36).slice(2, 7);
    host.innerHTML = head(spec, "illustrative values") + B.ix.split(`<div class="figure"><div class="fig-view" data-r="plant"></div></div>`, `
        <fieldset><legend>Conditions</legend><div class="row" data-r="scs" style="flex-wrap:wrap;gap:.35rem">${keys.map((k, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" data-sc="${k}" aria-pressed="${i === 0}">${esc(M.SC[k].name)}</button>`).join("")}</div></fieldset>
        <div class="readout" aria-live="polite"><p class="small" data-r="stinfo" style="margin:0"></p></div>
        <p class="small" data-r="scnote" style="margin:0"></p>
        <label class="small"><input type="checkbox" data-a="emb"> Put an air bubble in one vessel <span class="badge">supporting</span></label>
        <p class="small" data-r="embtxt" style="margin:0" hidden>A bubble breaks the column of water in that vessel, so it stops carrying water. Water moves sideways through pits into the neighbouring vessels and carries on up: many narrow vessels side by side mean one break does not stop the flow.</p>
        <div class="readout"><label class="small" for="${hid}"><strong>How tall a column can root pressure hold up?</strong> Height: <strong data-r="hv">${st.h} m</strong></label>
          <input type="range" id="${hid}" data-a="h" min="1" max="116" step="1" value="${st.h}">
          <p class="small" data-r="hres" aria-live="polite" style="margin:.2rem 0 0"></p></div>`) + `
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const hText = (h) => { const need = 9.81 * h; return `Pressure needed (gravity only): 9.81 kPa per metre × ${h} m = <strong>${Math.round(need)} kPa</strong>. Root pressure (about 100 to 300 kPa) ${need <= 250 ? "could just hold this up, ignoring friction" : "is not enough: this height needs the pull from transpiration"}.`; };
    const draw = (focus) => { const sc = M.SC[st.sc], p = sc.psi; q("plant").innerHTML = A().wholePlant({ scenario: st.sc, selected: st.sel, bubble: st.emb });
      q("stinfo").innerHTML = st.sel >= 0 ? `<strong>${st.sel + 1}. ${esc(M.STATIONS[st.sel])}: ${esc(kpaStr(p[st.sel]))}.</strong> ${esc(ST_INFO[st.sel])}` : "Select a numbered point (click, or Tab and Enter). Water always moves from a higher (less negative) to a lower (more negative) water potential; arrows are drawn only where it falls.";
      q("scnote").textContent = `${sc.note} From the air spaces to the air outside, the water potential falls by ${kpaStr(p[7] - p[8]).replace("-", "")}: by far the largest step.`;
      if (focus) { const g = $(`[data-part="st${st.sel}"]`, host); if (g) g.focus({ preventScroll: true }); } };
    wireParts(q("plant"), (k) => { st.sel = +k.slice(2); draw(true); });
    $$("[data-sc]", host).forEach((b) => b.addEventListener("click", () => { st.sc = b.dataset.sc; $$("[data-sc]", host).forEach((x) => { const on = x === b; x.classList.toggle("primary", on); x.setAttribute("aria-pressed", String(on)); }); draw(); }));
    $('[data-a="emb"]', host).addEventListener("change", (e) => { st.emb = e.target.checked; q("embtxt").hidden = !st.emb; draw(); });
    const hr = $('[data-a="h"]', host); const hUpd = () => { st.h = +hr.value; q("hv").textContent = `${st.h} m`; q("hres").innerHTML = hText(st.h); }; hr.addEventListener("input", hUpd); hUpd();
    draw(); renderQs(spec.questions, q("q"));
  };

  // ======================================== 4. Transpiration Simulator ========================================
  const LIGHT_AU = 10; // model light (µmol m⁻² s⁻¹) per arbitrary unit shown to students
  const FACT = { light: { name: "Light intensity", unit: "arbitrary units", min: 0, max: 150, step: 5 }, temp: { name: "Temperature", unit: "°C", min: 5, max: 40, step: 1 }, rh: { name: "Relative humidity", unit: "%", min: 0, max: 100, step: 5 }, wind: { name: "Air movement", unit: "m s⁻¹", min: 0, max: 4, step: 0.1 } };
  const COMPARE = { none: null, dark: { light: 0, name: "in the dark" }, bright: { light: 150, name: "in bright light" }, humid: { rh: 95, name: "at 95 % humidity" }, cool: { temp: 10, name: "at 10 °C" }, still: { wind: 0, name: "in still air" } };
  const PRESETS = [
    { k: "windOpen", name: "Wind: stomata open v closed", set: { light: 80, temp: 25, rh: 50, wind: 0 }, x: "wind", cmp: "dark", say: "Compare the two curves: in light (stomata open) extra air movement raises transpiration a lot, because the still air layer is then the main barrier; in the dark (stomata almost closed) the stomata are the main barrier, so wind makes very little difference." },
    { k: "rh100", name: "Humidity up to 100 %", set: { light: 80, temp: 25, rh: 100, wind: 1 }, x: "rh", cmp: "dark", say: "At 100 % relative humidity the air outside is saturated, so there is no water vapour gradient and transpiration is zero however bright, warm or windy it is." },
    { k: "warmDark", name: "Warming in the dark", set: { light: 0, temp: 15, rh: 50, wind: 0.5 }, x: "temp", cmp: "bright", say: "Warmer air holds more water vapour, so the gradient out of the leaf rises steeply with temperature. But in the dark the stomata are almost closed, so the rate stays low; in light the same warming has a much bigger effect." },
    { k: "dryAir", name: "Very dry air", set: { light: 80, temp: 30, rh: 10, wind: 1 }, x: "rh", cmp: "none", say: "Drier air means a steeper gradient, so transpiration rises as humidity falls. In this model the stomata close progressively as the air gets drier, so the rise slows at the dry end instead of continuing in a straight line." },
  ];
  B.interactives.xylemTranspirationSim = function (spec, host) {
    const M = PM(); const st = { light: 60, temp: 25, rh: 50, wind: 0.5, x: "wind", cmp: "dark", rows: [] };
    const cond = (o = {}) => { const c = Object.assign({ light: st.light, temp: st.temp, rh: st.rh, wind: st.wind }, o); return { light: c.light * LIGHT_AU, temp: c.temp, rh: c.rh / 100, wind: c.wind }; }; // the slider shows arbitrary units; the model takes 10 times the value (teacher decision 2026-11-14)
    const P = M.params;
    host.innerHTML = head(spec, "illustrative model") + `
      <div class="ix ix-fit-2"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view" data-r="leaf"></div></div>
        <div class="row" style="flex-wrap:wrap;gap:.3rem .8rem;align-items:center"><label class="small">Graph: rate against <select data-r="xsel">${Object.entries(FACT).map(([k, f]) => `<option value="${k}">${esc(f.name.toLowerCase())}</option>`).join("")}</select></label>
          <label class="small">compared with <select data-r="csel"><option value="none">nothing</option><option value="dark">the dark</option><option value="bright">bright light</option><option value="humid">95 % humidity</option><option value="cool">10 °C</option><option value="still">still air</option></select></label></div>
        <div class="figure"><div class="fig-view" data-r="chart"></div></div>
        <p class="small" data-r="legend" style="margin:.2rem 0 0"></p><p class="tiny muted" data-r="hover" aria-live="polite" style="margin:0"></p></div><div class="ix-panel">
        <div>${Object.entries(FACT).map(([k, f]) => `<label class="small" style="display:block;margin:.25rem 0">${esc(f.name)}: <strong data-v="${k}"></strong><input type="range" data-f="${k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${st[k]}" style="width:100%"></label>`).join("")}</div>
        <p style="margin:.2rem 0;font-size:1.25rem"><strong data-r="E"></strong> <span class="small">mmol of water per m² of leaf per second</span></p>
        <div class="readout"><p class="small" data-r="why" aria-live="polite" style="margin:0"></p></div>
        <div class="row" style="flex-wrap:wrap;gap:.35rem">${PRESETS.map((p) => `<button type="button" class="btn sm" data-p="${p.k}">${esc(p.name)}</button>`).join("")}</div>
      </div></div></div>
      <details class="mt"><summary class="small"><strong>Stretch: are the effects independent?</strong></summary>
        <p class="small">How much the rate would change <em>now</em> if you nudged each factor. Change the other sliders and the numbers change: the effect of one factor depends on the others.</p>
        <div data-r="sens"></div></details>
      <h4 class="mt">Record your readings</h4>
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="rec">Record this reading</button><button type="button" class="btn sm" data-a="clr">Clear table</button></div>
      <div data-r="tbl" class="mt"></div>
      <p class="tiny muted">This is a simplified model of one leafy shoot: it shows the direction and rough size of each effect, not measurements. It assumes a well-watered plant whose leaf is at air temperature. The <a href="#/lab/6">RP6 potometer laboratory</a> uses the same model.</p>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); $('[data-r="xsel"]', host).value = st.x; $('[data-r="csel"]', host).value = st.cmp;
    const label = (k, v) => k === "wind" ? (+v).toFixed(1) + " " + FACT[k].unit : v + " " + FACT[k].unit;
    // two sentences: what limits the rate now, and why
    const why = (L) => { if (st.rh >= 100) return "The air is saturated, so there is no water vapour gradient between the leaf and the air. There is no transpiration, however bright, warm or windy it is.";
      if (st.light < 5) return "It is dark, so the stomata are almost closed and they limit the rate. Wind and warmth make little difference until light opens the stomata.";
      if (L.limiting === "stomata") return `The stomata limit the rate now: they are ${st.light < 30 ? "only partly open in this dim light" : "as open as the light and the dryness of the air allow"}. ${st.light < 30 ? "More light opens them further and raises the rate most." : "A steeper water vapour gradient (warmer or drier air) raises the rate most."}`;
      return `The layer of still air outside the stomata limits the rate now, because the stomata are wide open. More air movement thins this layer, keeps the gradient steep and raises the rate most.`; };
    const sens = () => { const E0 = M.leaf(cond()).Emmol; const row = (name, o) => { const e = M.leaf(cond(o)).Emmol; const pc = E0 > 1e-9 ? ((e - E0) / E0) * 100 : 0; return `<tr><td>${name}</td><td>${fmt(e)}</td><td>${E0 > 1e-9 ? (pc >= 0 ? "+" : "") + pc.toFixed(0) + " %" : e > 1e-9 ? "from zero" : "no change"}</td></tr>`; };
      return `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Nudge</th><th>Rate / mmol m⁻² s⁻¹</th><th>Change</th></tr></thead><tbody><tr><td><strong>Now</strong></td><td><strong>${fmt(E0)}</strong></td><td>–</td></tr>${row("+20 light", { light: Math.min(150, st.light + 20) })}${row("+5 °C", { temp: Math.min(40, st.temp + 5) })}${row("+10 % humidity", { rh: Math.min(100, st.rh + 10) })}${row("+1 m s⁻¹ wind", { wind: Math.min(4, st.wind + 1) })}</tbody></table></div><p class="tiny muted">+20 light = 20 arbitrary units more light. Values capped at the slider limits.</p>`; };
    const xs = (k) => { const f = FACT[k]; const n = 60; return Array.from({ length: n + 1 }, (_, i) => f.min + ((f.max - f.min) * i) / n); };
    let chartData = null;
    const drawChart = () => { const k = st.x, f = FACT[k]; const cmp = COMPARE[st.cmp]; const mk = (o) => xs(k).map((x) => [x, M.leaf(cond(Object.assign({}, o, { [k]: x }))).Emmol]);
      const series = [{ name: "current settings", pts: mk({}) }]; if (cmp && !(k in cmp)) { const o = Object.assign({}, cmp); delete o.name; series.push({ name: cmp.name, dash: "8 5", pts: mk(o) }); }
      const ymax = Math.max(1, Math.ceil(Math.max(...series.flatMap((s) => s.pts.map((p) => p[1]))) * 1.15 * 2) / 2);
      const yt = []; const stp = ymax > 3 ? 1 : 0.5; for (let v = 0; v <= ymax + 1e-9; v += stp) yt.push(+v.toFixed(1));
      const xt = k === "light" ? [0, 50, 100, 150] : k === "temp" ? [5, 10, 20, 30, 40] : k === "rh" ? [0, 25, 50, 75, 100] : [0, 1, 2, 3, 4];
      const xr = f.max; // axes start at 0
      q("chart").innerHTML = A().chart({ series, xLabel: `${f.name} / ${f.unit}`, yLabel: "Transpiration / mmol m⁻² s⁻¹", xMax: xr, yMax: ymax, xTicks: xt, yTicks: yt, width: 640, height: 330, fs: 1.15, marker: [st[k], M.leaf(cond()).Emmol], title: `Model transpiration rate against ${f.name.toLowerCase()}` });
      chartData = { series, xr, k };
      q("legend").innerHTML = series.map((s, i) => `<span style="display:inline-flex;align-items:center;gap:.3rem;margin-right:1rem"><svg width="30" height="10" aria-hidden="true"><line x1="0" y1="5" x2="30" y2="5" stroke="${A().SERIES[i]}" stroke-width="3"${s.dash ? ` stroke-dasharray="${s.dash}"` : ""}/></svg>${esc(s.name)}</span>`).join("") + `<span style="display:inline-block">● current reading</span>` + (cmp && k in cmp ? ` <span class="muted">(the comparison is the same factor as the x-axis, so it is not drawn)</span>` : "");
      q("hover").textContent = "Point at the graph to read values."; };
    q("chart").addEventListener("pointermove", (e) => { if (!chartData) return; const svg = $("svg", q("chart")); if (!svg) return; const r = svg.getBoundingClientRect(); const vx = ((e.clientX - r.left) / r.width) * 640; const x = ((vx - 90) / (640 - 90 - 24)) * chartData.xr; if (x < 0 || x > chartData.xr) return;
      const vals = chartData.series.map((s) => { let best = s.pts[0]; s.pts.forEach((p) => { if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p; }); return [s.name, best]; });
      q("hover").textContent = `${FACT[chartData.k].name} ${label(chartData.k, chartData.k === "wind" ? vals[0][1][0].toFixed(1) : Math.round(vals[0][1][0]))}: ` + vals.map(([n, p]) => `${n} ${fmt(p[1])} mmol m⁻² s⁻¹`).join("; "); });
    const table = () => { q("tbl").innerHTML = st.rows.length ? `<table class="tbl"><thead><tr><th>#</th><th>Light intensity / arbitrary units</th><th>Temperature / °C</th><th>Humidity / %</th><th>Air movement / m s⁻¹</th><th>Rate / mmol m⁻² s⁻¹</th></tr></thead><tbody>${st.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.light}</td><td>${r.temp}</td><td>${r.rh}</td><td>${r.wind.toFixed(1)}</td><td>${fmt(r.E)}</td></tr>`).join("")}</tbody></table><p class="tiny muted">Model values, rounded to 0.01. Change one factor at a time and keep the others the same, as you would in a real investigation.</p>` : `<p class="small muted">No readings yet. Change one factor at a time, recording each reading.</p>`; };
    const update = (fromPreset) => { const L = M.leaf(cond()); Object.keys(FACT).forEach((k) => { $(`[data-v="${k}"]`, host).textContent = label(k, st[k]); });
      q("E").textContent = fmt(L.Emmol);
      q("leaf").innerHTML = A().stomaView({ gsFrac: (L.gs - 0) / P.GMAX, gb: L.gb, rh: st.rh / 100, light: st.light * LIGHT_AU, wind: st.wind, temp: st.temp }); { const ls = $("svg", q("leaf")); if (ls) ls.style.maxHeight = "min(220px, 28vh)"; } /* leaf and graph fit on a laptop screen together */
      if (!fromPreset) q("why").innerHTML = why(L); q("sens").innerHTML = sens(); drawChart(); };
    $$("[data-f]", host).forEach((r) => r.addEventListener("input", () => { st[r.dataset.f] = +r.value; update(); }));
    $('[data-r="xsel"]', host).addEventListener("change", (e) => { st.x = e.target.value; drawChart(); });
    $('[data-r="csel"]', host).addEventListener("change", (e) => { st.cmp = e.target.value; drawChart(); });
    $$("[data-p]", host).forEach((b) => b.addEventListener("click", () => { const p = PRESETS.find((x) => x.k === b.dataset.p); Object.assign(st, p.set); st.x = p.x; st.cmp = p.cmp; $$("[data-f]", host).forEach((r) => { r.value = st[r.dataset.f]; }); $('[data-r="xsel"]', host).value = st.x; $('[data-r="csel"]', host).value = st.cmp; update(true); q("why").innerHTML = `<strong>${esc(p.name)}.</strong> ${esc(p.say)}`; }));
    host.addEventListener("click", (e) => { const a = e.target.closest("[data-a]"); if (!a || !host.contains(a)) return; if (a.dataset.a === "rec") { if (st.rows.length >= 15) st.rows.shift(); st.rows.push({ light: st.light, temp: st.temp, rh: st.rh, wind: st.wind, E: M.leaf(cond()).Emmol }); table(); } if (a.dataset.a === "clr") { st.rows = []; table(); } });
    update(); table(); renderQs(spec.questions, q("q"));
  };
})(window.BIO);
