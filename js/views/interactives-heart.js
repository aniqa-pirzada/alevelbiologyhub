// Interactives for 3.2.6 The circulation of blood and the structure of the mammalian heart (Phase 4 Batch 2, owned by the
// 3.2.6 author). Kinds: vesselCompare and tissueFluidSim (3.2.6.1); heartExplorer, cardiacCycleAnim, cardiacPV and
// cardiacOutput (3.2.6.2). Drawings come from B.heartArt and every number from B.heartModel (data/content/_heart-art.js),
// so what is drawn, the values quoted and the embedded questions share one source.
// Accessibility: every control is a native button, input, select or <details>; diagram parts that can be chosen are
// focusable (Tab) and respond to Enter or Space; drag and drop always has a keyboard alternative ("choose a name, then
// Place here"); changes are announced in polite live regions. Motion: the cardiac cycle animation never starts by itself;
// with reduced motion (system setting or site preference) Play moves stage by stage with no continuous movement and the
// flow arrows do not animate. UI text uses CSS tokens only; SVG drawings sit on the light panel the site gives
// .interactive-host svg in dark mode. Layouts wrap and SVGs scale, so nothing scrolls sideways at 390 px.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.heartArt, M = () => B.heartModel;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const alive = (host) => document.body.contains(host);
  const f1 = (x) => M().fix(x, 1), f0 = (x) => M().fix(x, 0), f2 = (x) => M().fix(x, 2);
  const seededShuffle = (arr, seed) => { const a = arr.slice(); let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Tab row with roving focus (arrow keys, Home, End)
  const tabs = (bar, labels, onShow) => { let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    return show; };
  // make every [data-part] in an svg clickable and keyboard operable; calls fn(partKey)
  const wireParts = (box, fn) => { box.addEventListener("click", (e) => { const g = e.target.closest("[data-part]"); if (g && box.contains(g)) fn(g.dataset.part, g); });
    box.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const g = e.target.closest("[data-part]"); if (g) { e.preventDefault(); fn(g.dataset.part, g); } }); };

  // ======================================== Interactive Mammalian Heart ========================================
  // Base layer: the vector front section of the heart (B.heartArt.heartPhoto). Hotspots, labels, flow arrows and the
  // moving marker are SVG overlays in the drawing's own coordinates, so they stay aligned at every width.
  // Layout (release review 2026-11-15): picture left, mode tabs, step text and controls right (.ix), so the heart and the
  // Next button are on screen together at 1280 × 800; on narrow screens the picture keeps a readable width and scrolls.
  const INFO = {
    ra: ["Right atrium", "deox", "Receives deoxygenated blood from the venae cavae and passes it to the right ventricle. Thin wall: it pumps only into the ventricle below."],
    rv: ["Right ventricle", "deox", "Pumps deoxygenated blood into the pulmonary artery, to the lungs. Thicker than the atria but thinner than the left ventricle: the lungs are close and need a low pressure."],
    la: ["Left atrium", "ox", "Receives oxygenated blood from the pulmonary veins and passes it to the left ventricle. Thin wall."],
    lv: ["Left ventricle", "ox", "Pumps oxygenated blood into the aorta, to the whole body. Thickest wall: it generates the highest pressure (about 16 kPa)."],
    septum: ["Interventricular septum", "", "The muscular wall between the two ventricles. It keeps oxygenated and deoxygenated blood apart, so the blood sent to the body carries as much oxygen as possible."],
    tri: ["Tricuspid valve (right atrioventricular valve)", "deox", "Between the right atrium and right ventricle. Opens when atrial pressure is higher; closes when the ventricle contracts and its pressure rises above atrial pressure, preventing backflow into the atrium."],
    bi: ["Bicuspid valve (left atrioventricular valve)", "ox", "Between the left atrium and left ventricle. Same action as the tricuspid valve, on the left side. Also called the mitral valve."],
    pvalve: ["Pulmonary valve (semilunar)", "deox", "At the base of the pulmonary artery. Opens when right ventricular pressure exceeds pulmonary artery pressure; closes when the ventricle relaxes, preventing backflow into the ventricle."],
    avalve: ["Aortic valve (semilunar)", "ox", "At the base of the aorta. Opens when left ventricular pressure exceeds aortic pressure; closes when it falls below, preventing backflow into the left ventricle."],
    svc: ["Superior vena cava", "deox", "Brings deoxygenated blood from the head and arms to the right atrium."],
    ivc: ["Inferior vena cava", "deox", "Brings deoxygenated blood from the rest of the body to the right atrium."],
    pa: ["Pulmonary artery", "deox", "Carries deoxygenated blood from the right ventricle to the lungs: an artery carrying deoxygenated blood. It divides into a branch to each lung."],
    pv: ["Pulmonary veins", "ox", "Bring oxygenated blood from the lungs to the left atrium: veins carrying oxygenated blood."],
    aorta: ["Aorta", "ox", "Carries oxygenated blood from the left ventricle to the body. Its elastic wall stretches and recoils, keeping pressure up between beats. Its first branches are the coronary arteries (3.2.7.1); the branches on the arch carry blood to the head and arms."],
    chordae: ["Chordae tendineae (supporting)", "", "Tendon-like cords joining the AV valve flaps to papillary muscles; they stop the flaps turning inside out when the ventricles contract."],
    pap: ["Papillary muscles (supporting)", "", "Small muscles in the ventricle wall that anchor the chordae tendineae."],
  };
  const TRACE = [["svc", "Deoxygenated blood from the body arrives in the venae cavae (superior and inferior).", "deox"], ["ra", "It enters the right atrium.", "deox"], ["tri", "It passes through the tricuspid (right atrioventricular) valve.", "deox"], ["rv", "It enters the right ventricle, which contracts.", "deox"], ["pvalve", "It is pushed through the pulmonary semilunar valve.", "deox"], ["pa", "It travels along the pulmonary artery to the lungs. In the lung capillaries it loses carbon dioxide and gains oxygen.", "deox"], ["pv", "Oxygenated blood returns from the lungs in the pulmonary veins.", "ox"], ["la", "It enters the left atrium.", "ox"], ["bi", "It passes through the bicuspid (left atrioventricular) valve.", "ox"], ["lv", "It enters the left ventricle, which contracts most forcefully.", "ox"], ["avalve", "It is pushed through the aortic semilunar valve.", "ox"], ["aorta", "It leaves in the aorta for the rest of the body (the coronary arteries branch off first).", "ox"]];
  const ID_TARGETS = ["ra", "rv", "la", "lv", "tri", "bi", "pvalve", "avalve", "aorta", "pa", "pv", "svc", "ivc", "septum"];
  B.interactives.heartExplorer = function (spec, host) {
    const K = A().heartPhotoKit, STOP = K.route.stops, END = K.route.total;
    const st = { mode: 0, labels: true, flow: true, hl: null, trace: 0, s: 0, playing: false, raf: null, timer: null, idList: seededShuffle(ID_TARGETS, Date.now() % 997).slice(0, 8), idPos: 0, idScore: 0, idDone: false, idTried: false };
    const sid = "hx" + uidOf();
    host.innerHTML = head(spec, "front view") + `<style>@container ix (max-width: 699px) { .${sid} svg { min-width: 600px; } }</style>
      <div class="ix"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="ix-hscroll"><div class="fig-view ${sid}" data-r="fig" style="overflow:visible"></div></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p></div></div><div class="ix-panel">
        <div class="row" role="tablist" aria-label="ways to use the heart model" data-r="tabs" style="flex-wrap:wrap;gap:.35rem"></div>
        <div class="row" style="flex-wrap:wrap;gap:.2rem .9rem"><label class="small"><input type="checkbox" data-a="labels" checked> Labels</label><label class="small"><input type="checkbox" data-a="flow" checked> Blood-flow arrows</label></div>
        <div class="card" style="background:var(--surface-2);padding:.6rem .75rem"><div data-r="panel"></div><p class="small" aria-live="polite" data-r="live" style="margin:.4rem 0 0"></p></div>
      </div></div></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const fig = q("fig");
    const hlOf = () => (st.mode === 1 ? (TRACE[st.trace][0] === "svc" ? ["svc", "ivc"] : TRACE[st.trace][0]) : st.hl);
    // the moving marker: blue until it reaches the lungs, red after; faint while it passes behind the pulmonary artery
    const placeMarker = () => { const m = $('[data-r="marker"]', fig); if (!m) return; const p = K.routeAt(st.s); m.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`); m.style.opacity = p.hidden ? "0.45" : "1"; const c = m.querySelectorAll("circle")[1]; if (c) c.setAttribute("fill", p.ox ? K.colours.OX : K.colours.DE);
      const lungs = $('[data-r="lungs"] rect', fig); if (lungs) lungs.setAttribute("stroke", Math.abs(st.s - STOP.lungs) < 120 ? K.colours.HL : "#7b8ea3"); };
    const draw = (refocus) => { const showLabels = st.labels && st.mode !== 2;
      fig.innerHTML = A().heartPhoto({ interactive: true, labels: showLabels, highlight: hlOf(), flow: st.flow && st.mode !== 2, marker: st.mode === 1, titles: st.mode !== 2, sides: true, title: "Interactive heart model" });
      const svg = $("svg", fig);
      $$("[data-part]", svg).forEach((g) => { const k = g.dataset.part; g.setAttribute("aria-label", st.mode === 2 ? "heart structure: choose" : (INFO[k] || [k])[0]); });
      if (st.mode === 1) placeMarker();
      if (refocus) { const g = $(`[data-part="${refocus}"]`, svg); if (g) g.focus({ preventScroll: true }); } };
    const badge = (k) => (k === "ox" ? '<span class="badge rose">oxygenated blood</span>' : k === "deox" ? '<span class="badge navy">deoxygenated blood</span>' : "");
    const panels = [
      () => `<p class="small"><strong>Explore.</strong> Select any part of the heart (click, or Tab to it and press Enter) to see what it is and what it does.</p><div data-r="info"></div>`,
      () => { const [k, txt, bl] = TRACE[st.trace]; return `<p class="small"><strong>Trace the blood.</strong> Step ${st.trace + 1} of ${TRACE.length}: ${esc(txt)} ${badge(bl)}</p><div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="tprev" ${st.trace === 0 ? "disabled" : ""}>◀ Previous</button><button type="button" class="btn sm primary" data-a="tnext" ${st.trace === TRACE.length - 1 ? "disabled" : ""}>Next ▶</button><button type="button" class="btn sm" data-a="tplay" aria-pressed="${st.playing}">${st.playing ? "❚❚ Pause" : "▶ Play the whole route"}</button><button type="button" class="btn sm" data-a="tstart">Start again</button></div><p class="tiny muted">Highlighted: ${esc(INFO[k][0])}${k === "svc" ? " and inferior vena cava" : ""}. The marker is one small volume of blood: blue while deoxygenated, red after the lungs; it fades where it passes behind the pulmonary artery.${reduced() ? " Reduced motion is on: the marker jumps from step to step." : ""}</p>`; },
      () => st.idDone ? `<p class="small"><strong>Identify.</strong> You scored ${st.idScore} out of ${st.idList.length} at the first attempt.</p><button type="button" class="btn sm primary" data-a="idagain">Try a new set</button>` : `<p class="small"><strong>Identify.</strong> Labels are hidden. Item ${st.idPos + 1} of ${st.idList.length}: select the <strong>${esc(INFO[st.idList[st.idPos]][0].replace(/ \(.*\)$/, ""))}</strong>.</p><p class="tiny muted">Score so far: ${st.idScore} (first attempts only).</p>`,
      () => `<p class="small"><strong>Compare.</strong> Highlight a group, then read the comparison.</p><div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="hl-atria">Highlight the atria</button><button type="button" class="btn sm" data-a="hl-vent">Highlight the ventricles</button><button type="button" class="btn sm" data-a="hl-lv">Highlight the left ventricle</button><button type="button" class="btn sm" data-a="hl-none">Clear</button></div>
        <table class="tbl mt"><thead><tr><th></th><th>Atria</th><th>Ventricles</th></tr></thead><tbody><tr><th>Position</th><td>Upper chambers</td><td>Lower chambers</td></tr><tr><th>Receive blood from</th><td>Veins (venae cavae, pulmonary veins)</td><td>The atria</td></tr><tr><th>Pump blood to</th><td>The ventricles just below</td><td>Arteries (pulmonary artery, aorta)</td></tr><tr><th>Wall</th><td>Thin: little pressure needed</td><td>Thick: high pressure needed to pump out of the heart</td></tr><tr><th>Exit valve</th><td>Atrioventricular valve</td><td>Semilunar valve</td></tr></tbody></table>
        <p class="small mt"><strong>Left v right ventricle.</strong> Same volume per beat; the left wall is thicker because it must generate a much higher pressure (about 16 kPa v about 3 kPa) to pump blood round the whole body, while the right pumps only to the nearby lungs. Compare the two ventricle walls in the diagram.</p>`,
    ];
    const HL = { "hl-atria": ["ra", "la"], "hl-vent": ["rv", "lv"], "hl-lv": "lv" }, HLNAME = { "hl-atria": "Both atria", "hl-vent": "Both ventricles", "hl-lv": "Left ventricle" };
    const setPanel = () => { q("panel").innerHTML = panels[st.mode](); };
    // ---- marker movement (Trace mode) ----
    const stopAnim = () => { cancelAnimationFrame(st.raf); clearInterval(st.timer); st.raf = null; st.timer = null; };
    const stopPlay = () => { if (!st.playing) return; st.playing = false; stopAnim(); setPanel(); };
    const glide = (to, ms) => { stopAnim(); if (reduced() || !ms) { st.s = to; placeMarker(); return; } const from = st.s, t0 = performance.now();
      const step = (ts) => { if (!alive(host) || st.mode !== 1) return stopAnim(); const f = Math.min(1, (ts - t0) / ms); st.s = from + (to - from) * (f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f)); placeMarker(); if (f < 1) st.raf = requestAnimationFrame(step); }; st.raf = requestAnimationFrame(step); };
    const goTrace = (i, animate) => { st.trace = Math.max(0, Math.min(TRACE.length - 1, i)); draw(); setPanel(); q("live").textContent = TRACE[st.trace][1]; glide(STOP[TRACE[st.trace][0]], animate ? 900 : 0); };
    const play = () => { st.playing = true; if (st.trace >= TRACE.length - 1) { st.trace = 0; st.s = 0; } setPanel(); draw();
      if (reduced()) { st.timer = setInterval(() => { if (!alive(host) || st.mode !== 1) return stopAnim(); if (st.trace >= TRACE.length - 1) { stopPlay(); return; } goTrace(st.trace + 1, false); }, 2500); return; }
      let last = 0; const speed = END / 16; // the whole route in about 16 s
      const step = (ts) => { if (!alive(host) || st.mode !== 1 || !st.playing) return stopAnim(); const dt = last ? (ts - last) / 1000 : 0; last = ts; st.s = Math.min(END, st.s + speed * dt);
        let i = 0; TRACE.forEach(([k], j) => { if (STOP[k] <= st.s + 1) i = j; });
        if (i !== st.trace) { st.trace = i; draw(); setPanel(); q("live").textContent = TRACE[i][1]; } else placeMarker();
        if (st.s >= END) { st.playing = false; stopAnim(); setPanel(); return; } st.raf = requestAnimationFrame(step); };
      st.raf = requestAnimationFrame(step); };
    const showTab = tabs(q("tabs"), ["Explore", "Trace the blood", "Identify", "Compare"], (i) => { stopPlay(); stopAnim(); st.mode = i; st.hl = null; q("live").textContent = "";
      [["labels", st.labels], ["flow", st.flow]].forEach(([k, v]) => { const cb = $(`[data-a="${k}"]`, host); if (cb) { cb.disabled = i === 2; cb.checked = i === 2 ? false : v; } }); if (i === 1) st.s = STOP[TRACE[st.trace][0]]; if (i === 2) { st.idTried = false; } draw(); setPanel(); });
    host.addEventListener("click", (e) => { const a = e.target.closest("[data-a]"); if (!a || !host.contains(a) || a.tagName === "INPUT") return; const k = a.dataset.a;
      if (k === "tnext" || k === "tprev" || k === "tstart") { stopPlay(); goTrace(k === "tstart" ? 0 : st.trace + (k === "tnext" ? 1 : -1), k === "tnext"); const nb = $('[data-a="tnext"]', host); if (nb && !nb.disabled) nb.focus(); return; }
      if (k === "tplay") { if (st.playing) stopPlay(); else play(); const b = $('[data-a="tplay"]', host); if (b) b.focus(); return; }
      if (k === "idagain") { st.idList = seededShuffle(ID_TARGETS, (Date.now() + 7) % 997).slice(0, 8); st.idPos = 0; st.idScore = 0; st.idDone = false; st.idTried = false; draw(); setPanel(); return; }
      if (k.startsWith("hl-")) { st.hl = HL[k] || null; draw(); q("live").textContent = st.hl ? `${HLNAME[k]} highlighted` : "Highlight cleared"; return; } });
    $('[data-a="labels"]', host).addEventListener("change", (e) => { st.labels = e.target.checked; draw(); });
    $('[data-a="flow"]', host).addEventListener("change", (e) => { st.flow = e.target.checked; draw(); });
    wireParts(fig, (k) => {
      if (st.mode === 0 || st.mode === 3) { st.hl = k; draw(k); const i = INFO[k] || [k, "", ""]; const box = $('[data-r="info"]', host); const msg = `${i[0]}. ${i[2]}`; if (box) box.innerHTML = `<p class="small"><strong>${esc(i[0])}</strong> ${badge(i[1])}</p><p class="small">${esc(i[2])}</p>`; q("live").textContent = msg; return; }
      if (st.mode === 1) { const pos = TRACE.findIndex((t) => t[0] === k || (k === "ivc" && t[0] === "svc")); q("live").textContent = pos >= 0 ? `${INFO[k][0]} is step ${pos + 1} of the route.` : `${(INFO[k] || [k])[0]} is not on the main route.`; return; }
      if (st.mode === 2 && !st.idDone) { const want = st.idList[st.idPos]; const name = (x) => INFO[x][0].replace(/ \(.*\)$/, "");
        if (k === want) { if (!st.idTried) st.idScore++; q("live").textContent = `Correct: that is the ${name(want)}.`; st.idPos++; st.idTried = false; if (st.idPos >= st.idList.length) st.idDone = true; st.hl = null; draw(); setPanel(); }
        else { st.idTried = true; q("live").textContent = `Not quite: that is the ${name(k)}. Try again: find the ${name(want)}.`; st.hl = k; draw(k); } } });
    draw(); setPanel(); showTab(0);
    renderQs(spec.questions, q("q"));
  };
  // ======================================== Animated Cardiac Cycle ========================================
  B.interactives.cardiacCycleAnim = function (spec, host) {
    const Mo = M(), EV = Mo.EV, P = Mo.P;
    const STAGES = [
      { k: "as", t0: 0, t1: EV.avClose, name: "Atrial systole", what: "The atria contract. Atrial pressure is higher than ventricular pressure, so the AV valves are open and the last of the blood is pushed into the ventricles. Arterial pressure is higher than ventricular pressure, so the semilunar valves are closed.", flow: ["in", "av"], con: "atria" },
      { k: "ic", t0: EV.avClose, t1: EV.slOpen, name: "Ventricular systole: valves closed, pressure rising", what: "The ventricles contract. Their pressure rises above atrial pressure, so the AV valves close. Ventricular pressure is still below arterial pressure, so the semilunar valves stay closed: the volume is constant while the pressure rises (isovolumetric contraction, supporting term).", flow: ["in"], con: "vent" },
      { k: "ej", t0: EV.slOpen, t1: EV.slClose, name: "Ventricular systole: ejection", what: "Ventricular pressure rises above the pressure in the aorta and pulmonary artery, so the semilunar valves open and blood is ejected. Ventricular volume falls. The AV valves stay closed; the atria refill from the veins.", flow: ["in", "sl", "out"], con: "vent" },
      { k: "ir", t0: EV.slClose, t1: EV.avOpen, name: "Diastole: valves closed, pressure falling", what: "The ventricles relax. Their pressure falls below arterial pressure, so the semilunar valves close (preventing backflow). Ventricular pressure is still above atrial pressure, so the AV valves stay closed: volume is constant (isovolumetric relaxation, supporting term).", flow: ["in"], con: "none" },
      { k: "fi", t0: EV.avOpen, t1: P.T, name: "Diastole: filling", what: "Ventricular pressure falls below atrial pressure, so the AV valves open. Blood that has collected in the atria, and blood still arriving from the veins, flows into the relaxed ventricles: volume rises. The semilunar valves stay closed.", flow: ["in", "av"], con: "none" },
    ];
    // stage boundaries are the model's valve events (stage 2 begins when the AV valve closes), and stepping lands in the
    // middle of a stage, so the meters, the valve badges and the stage text always agree
    const mid = (i) => (STAGES[i].t0 + STAGES[i].t1) / 2;
    const st = { t: 0, playing: false, slow: 10, last: 0, stage: -1, timer: null, raf: null };
    const sid = "cc" + uidOf();
    host.innerHTML = head(spec, "illustrative model") + `<style>@container ix (max-width: 699px) { .${sid} svg { min-width: 600px; } } .${sid}m { display: grid; grid-template-columns: 1fr 1fr; gap: .1rem .8rem; }</style>
      <div class="ix"><div class="ix-body"><div class="ix-stage"><div data-r="timeline" aria-hidden="true"></div><div class="figure"><div class="ix-hscroll"><div class="fig-view ${sid}" data-r="fig" style="overflow:visible"></div></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p></div></div><div class="ix-panel">
      <div class="row" style="flex-wrap:wrap;gap:.4rem;align-items:center">
        <button type="button" class="btn sm primary" data-a="play" aria-pressed="false">▶ Play</button>
        <button type="button" class="btn sm" data-a="back">◀ Previous</button>
        <button type="button" class="btn sm" data-a="fwd">Next ▶</button>
        <button type="button" class="btn sm" data-a="replay">↺ Replay</button>
      </div>
      <p class="tiny muted" data-r="rmnote" hidden>Reduced motion is on: Play moves one stage every 2.5 seconds. Use Previous and Next to step.</p>
        <div><h4 data-r="stagename" style="margin-top:0"></h4><p class="small" data-r="what"></p><p class="small" data-r="valves"></p></div>
        <div data-r="meters"></div>
      </div></div></div>
      <p class="sr-only" aria-live="polite" data-r="live"></p>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const stageAt = (t) => STAGES.findIndex((s) => t >= s.t0 && t < s.t1);
    // timeline: the three phases only, with the four valve events as labelled ticks underneath
    const TL = () => { const ph = [[0, EV.avClose, "atrial systole", "var(--amber-soft)"], [EV.avClose, EV.slClose, "ventricular systole", "var(--rose-soft)"], [EV.slClose, P.T, "diastole", "var(--navy-soft)"]];
      const ticks = [[EV.avClose, "AV shut", -1], [EV.slOpen, "SL open", 1], [EV.slClose, "SL shut", -1], [EV.avOpen, "AV open", 1]];
      return `<div style="position:relative;height:28px;border-radius:8px;overflow:hidden;display:flex;border:1px solid var(--line)">${ph.map(([a, b, n, c]) => `<div title="${n}" style="width:${(100 * (b - a)) / P.T}%;background:${c};border-right:1px solid var(--line);font-size:.8rem;line-height:28px;text-align:center;white-space:nowrap;overflow:hidden;color:var(--ink-2)">${n === "atrial systole" ? "atrial" : n}</div>`).join("")}<div data-r="cursor" style="position:absolute;top:0;bottom:0;width:3px;background:var(--amber-ink);left:0"></div></div>
        <div style="position:relative;height:34px;font-size:.75rem;line-height:1.2;color:var(--ink-2)">${ticks.map(([t, n, side], i) => `<span style="position:absolute;left:${(100 * t) / P.T}%;top:0;border-left:1.5px solid var(--ink-2);height:${i % 2 ? 32 : 14}px"></span><span style="position:absolute;${side < 0 ? `right:calc(${100 - (100 * t) / P.T}% + 4px)` : `left:calc(${(100 * t) / P.T}% + 4px)`};top:${i % 2 ? 17 : 0}px;white-space:nowrap">${n}</span>`).join("")}</div>`; };
    q("timeline").innerHTML = TL();
    const meter = (label, v, max, unit, colour, extra = "") => `<div class="small" style="margin:.3rem 0"><div style="display:flex;justify-content:space-between;gap:.5rem"><span>${label}</span><span><strong>${v}</strong> ${unit}${extra}</span></div><div style="height:10px;border-radius:5px;background:var(--surface-3);overflow:hidden" aria-hidden="true"><div style="height:100%;width:${Math.max(0, Math.min(100, (100 * parseFloat(v)) / max))}%;background:${colour}"></div></div></div>`;
    const drawHeart = (i) => { const s = STAGES[i]; const x = Mo.state((s.t0 + s.t1) / 2);
      // chamber state: contracting chambers get the amber outline, relaxed ones a dashed outline (both sides at once)
      const c = (atria, vent) => ({ ra: atria, la: atria, rv: vent, lv: vent });
      const chambers = s.con === "atria" ? c("contract", "relax") : s.con === "vent" ? c("relax", "contract") : c("relax", "relax");
      q("fig").innerHTML = A().heartPhoto({ valves: { av: x.avOpen ? "open" : "closed", sl: x.slOpen ? "open" : "closed" }, chambers, flow: true, flowParts: s.flow, animate: st.playing && !reduced(), title: s.name });
      q("stagename").textContent = `Stage ${i + 1} of ${STAGES.length}: ${s.name}`; q("what").textContent = s.what;
      q("valves").innerHTML = `<strong>Valves:</strong> atrioventricular <span class="badge ${x.avOpen ? "sage" : "rose"}">${x.avOpen ? "open" : "closed"}</span> semilunar <span class="badge ${x.slOpen ? "sage" : "rose"}">${x.slOpen ? "open" : "closed"}</span>${s.con !== "none" ? ` · contracting: <strong>${s.con === "atria" ? "atria" : "ventricles"}</strong> (amber outline)` : " · all four chambers relaxed (dashed outline)"}`;
      q("live").textContent = `Stage ${i + 1}: ${s.name}. ${s.what}`; };
    const update = () => { const i = stageAt(st.t); if (i !== st.stage) { st.stage = i; drawHeart(i); }
      const x = Mo.state(st.t); q("meters").innerHTML = `<p class="tiny muted" style="margin:0">Left side, ${f2(st.t)} s</p><div class="${sid}m">` + meter("Atrium", f1(x.la), 18, "kPa", "#1f66b0") + meter("Ventricle", f1(x.lv), 18, "kPa", "#c0392b") + meter("Aorta", f1(x.ao), 18, "kPa", "#a3367f") + meter("Volume", f0(x.vol), 140, "cm³", "#2e7d4f") + "</div>";
      const c = q("cursor"); if (c) c.style.left = `calc(${(100 * st.t) / P.T}% - 1px)`; };
    const stop = () => { st.playing = false; cancelAnimationFrame(st.raf); clearInterval(st.timer); const b = $('[data-a="play"]', host); b.textContent = "▶ Play"; b.setAttribute("aria-pressed", "false"); st.stage = -1; update(); };
    const frame = (ts) => { if (!st.playing || !alive(host)) return stop(); const dt = st.last ? (ts - st.last) / 1000 : 0; st.last = ts; st.t = (st.t + dt / st.slow) % P.T; update(); st.raf = requestAnimationFrame(frame); };
    const play = () => { st.playing = true; const b = $('[data-a="play"]', host); b.textContent = "❚❚ Pause"; b.setAttribute("aria-pressed", "true"); st.stage = -1;
      if (reduced()) { update(); st.timer = setInterval(() => { if (!alive(host)) return stop(); const i = (stageAt(st.t) + 1) % STAGES.length; st.t = mid(i); update(); }, 2500); }
      else { st.last = 0; st.raf = requestAnimationFrame(frame); } };
    const goStage = (d) => { if (st.playing) stop(); const i = (stageAt(st.t) + d + STAGES.length) % STAGES.length; st.t = mid(i); st.stage = -1; update(); };
    host.addEventListener("click", (e) => { const a = e.target.closest("[data-a]"); if (!a) return; const k = a.dataset.a;
      if (k === "play") { st.playing ? stop() : play(); } else if (k === "replay") { if (st.playing) stop(); st.t = 0; st.stage = -1; play(); } else if (k === "back") goStage(-1); else if (k === "fwd") goStage(1); });
    if (reduced()) q("rmnote").hidden = false;
    update(); renderQs(spec.questions, q("q"));
  };

  // ======================================== Cardiac Pressure and Volume Explorer ========================================
  B.interactives.cardiacPV = function (spec, host) {
    const Mo = M(), EV = Mo.EV, P = Mo.P, SM = Mo.summary(); const uid = uidOf();
    const CH = [["avClose", "the left atrioventricular (bicuspid) valve closes"], ["slOpen", "the aortic (semilunar) valve opens"], ["slClose", "the aortic (semilunar) valve closes"], ["avOpen", "the left atrioventricular (bicuspid) valve opens"]];
    const st = { t: 0.25, hide: {}, ch: 0, score: 0, tried: false, done: false };
    const sid = "pv" + uid;
    host.innerHTML = head(spec, "illustrative model values") + `
      <div class="ix ix-wide-stage ix-nosticky-sm"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view ix-free" data-r="fig" tabindex="0" role="group" aria-label="cardiac cycle graph with time cursor; left and right arrow keys move the cursor by 5 ms, with Shift by 50 ms" style="overflow-x:auto;cursor:ew-resize"></div></div>
      <p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole graph; tap it or use the slider to move the cursor</p></div><div class="ix-panel">
      <div class="row" style="flex-wrap:wrap;gap:.8rem;align-items:center">
        <label class="small" for="pv-t-${uid}"><strong>Time cursor</strong></label>
        <input id="pv-t-${uid}" type="range" min="0" max="${Math.round(P.T * 1000)}" step="1" value="250" style="flex:1;min-width:180px;max-width:420px" aria-describedby="pv-read-${uid}">
        <span class="small" data-r="tval"></span>
      </div>
      <div class="row" style="flex-wrap:wrap;gap:.8rem"><span class="small">Show:</span>${[["la", "left atrium"], ["lv", "left ventricle"], ["ao", "aorta"], ["vol", "volume"]].map(([k, l]) => `<label class="small"><input type="checkbox" data-h="${k}" checked> ${l}</label>`).join("")}</div>
        <div><h4 style="margin-top:0">At the cursor</h4><div id="pv-read-${uid}" data-r="read" aria-live="polite"></div></div>
        <div><h4 style="margin-top:0">Challenge: find the valve events</h4><div data-r="ch"></div></div>
      </div></div></div>
      <details class="mt small"><summary>About these values</summary>
        <p>One cardiac cycle of the left side of the heart for a typical healthy adult at rest. This is a simplified model, not a recording. Cycle ${f1(P.T)} s (heart rate ${f0(SM.hr)} min⁻¹). Left ventricular peak ${f1(SM.lvMax.v)} kPa (${f0(Mo.mmHg(SM.lvMax.v))} mmHg); aortic pressure ${f1(SM.aoMin.v)} to ${f1(SM.aoMax.v)} kPa (${f0(Mo.mmHg(SM.aoMin.v))} to ${f0(Mo.mmHg(SM.aoMax.v))} mmHg); left atrial pressure ${f1(SM.laMin.v)} to ${f1(SM.laMax.v)} kPa. End-diastolic volume ${SM.edv} cm³, end-systolic volume ${SM.esv} cm³, stroke volume ${SM.sv} cm³; atrial contraction adds ${f0(SM.atrialPct)} % of the filling. Each valve event is where two pressure curves cross (AV valve closes ${f2(EV.avClose)} s, SL valve opens ${f2(EV.slOpen)} s, SL valve closes ${f2(EV.slClose)} s, AV valve opens ${f2(EV.avOpen)} s). Ventricular systole lasts ${f2(SM.ventSystole)} s and diastole ${f2(SM.diastole)} s.</p>
        <p>The values were chosen to match typical textbook figures (OpenStax <em>Anatomy and Physiology 2e</em> §19.3; TeachMePhysiology, The Cardiac Cycle). Real people differ, and the timings change with heart rate: at a faster rate diastole shortens most. The right side has the same timing with much lower pressures.</p></details>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const fig = q("fig"); const slider = $(`#pv-t-${uid}`, host);
    const draw = () => { const sl0 = fig.scrollLeft; fig.innerHTML = A().cycleGraph({ cursor: st.t, hide: st.hide, aria: `Cardiac cycle graph with the time cursor at ${f2(st.t)} seconds` }); const x = Mo.state(st.t);
      const sv = $("svg", fig); if (sv) sv.style.minWidth = "620px"; fig.scrollLeft = sl0; // labels stay at least about 9 px
      q("tval").textContent = `${f2(st.t)} s`; slider.value = String(Math.round(st.t * 1000));
      const cmp = (a, an, b, bn) => (a > b ? `${an} (${f1(a)} kPa) is higher than ${bn} (${f1(b)} kPa)` : `${an} (${f1(a)} kPa) is lower than ${bn} (${f1(b)} kPa)`);
      q("read").innerHTML = `<table class="tbl"><tbody><tr><th>Time</th><td>${f2(st.t)} s</td></tr><tr><th>Left atrium</th><td>${f1(x.la)} kPa (${f0(Mo.mmHg(x.la))} mmHg)</td></tr><tr><th>Left ventricle</th><td>${f1(x.lv)} kPa (${f0(Mo.mmHg(x.lv))} mmHg)</td></tr><tr><th>Aorta</th><td>${f1(x.ao)} kPa (${f0(Mo.mmHg(x.ao))} mmHg)</td></tr><tr><th>Ventricular volume</th><td>${f0(x.vol)} cm³</td></tr><tr><th>Stage</th><td>${esc(x.phase)}: ${esc(x.sub)}</td></tr></tbody></table>
        <p class="small mt"><strong>Bicuspid (AV) valve ${x.avOpen ? "open" : "closed"}:</strong> ${cmp(x.la, "atrial pressure", x.lv, "ventricular pressure")}.<br><strong>Aortic (SL) valve ${x.slOpen ? "open" : "closed"}:</strong> ${x.slOpen ? `ventricular pressure (${f1(x.lv)} kPa) is at or above aortic pressure (${f1(x.ao)} kPa), so blood is being ejected` : cmp(x.ao, "aortic pressure", x.lv, "ventricular pressure")}.</p>`; };
    const chDraw = () => { if (st.done) { q("ch").innerHTML = `<p class="small">Finished: ${st.score} of ${CH.length} correct at the first attempt.</p><button type="button" class="btn sm" data-a="chagain">Try again</button>`; return; }
      q("ch").innerHTML = `<p class="small">Task ${st.ch + 1} of ${CH.length}: move the cursor to the moment when <strong>${CH[st.ch][1]}</strong>, then press Check. (Within 0.01 s counts.)</p><div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="check">Check</button><button type="button" class="btn sm" data-a="skip">Show me</button></div><p class="small" data-r="chfb" aria-live="polite"></p><p class="tiny muted">Score: ${st.score}</p>`; };
    const why = { avClose: "ventricular pressure rises above atrial pressure", slOpen: "ventricular pressure rises above aortic pressure", slClose: "ventricular pressure falls below aortic pressure", avOpen: "ventricular pressure falls below atrial pressure" };
    host.addEventListener("click", (e) => { const a = e.target.closest("[data-a]"); if (!a) return; const k = a.dataset.a; const key = CH[st.ch] && CH[st.ch][0];
      if (k === "check") { const d = Math.abs(st.t - EV[key]); const fb = q("chfb");
        if (d <= 0.0105) { if (!st.tried) st.score++; st.ch++; st.tried = false; if (st.ch >= CH.length) st.done = true; chDraw(); const nfb = q("chfb"); const msg = `Correct: at ${f2(EV[key])} s ${why[key]}.`; if (nfb) nfb.textContent = msg; else q("ch").insertAdjacentHTML("afterbegin", `<p class="small" aria-live="polite">${esc(msg)}</p>`); }
        else { st.tried = true; fb.textContent = `Not yet: you are ${f2(d)} s away. Look for where ${why[key].replace(/ (rises|falls) /, " crosses ").replace(/(above|below) /, "")}.`; } }
      else if (k === "skip") { st.tried = true; st.t = EV[key]; draw(); q("chfb").textContent = `Here: ${f2(EV[key])} s, where ${why[key]}. Press Check to continue.`; }
      else if (k === "chagain") { st.ch = 0; st.score = 0; st.tried = false; st.done = false; chDraw(); } });
    slider.addEventListener("input", () => { st.t = Math.min(P.T - 0.001, +slider.value / 1000); draw(); });
    $$("[data-h]", host).forEach((cb) => cb.addEventListener("change", () => { st.hide[cb.dataset.h] = !cb.checked; draw(); }));
    const fromX = (clientX) => { const svg = $("svg", fig); const r = svg.getBoundingClientRect(); const vbx = ((clientX - r.left) / r.width) * 760; return Math.max(0, Math.min(P.T - 0.001, ((vbx - 70) / (690 - 70)) * P.T)); };
    let dragging = false; fig.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" && fig.scrollWidth > fig.clientWidth + 2) { st.t = fromX(e.clientX); draw(); return; } // touch on a scrolling graph: tap places the cursor, a swipe scrolls
      dragging = true; fig.setPointerCapture(e.pointerId); st.t = fromX(e.clientX); draw(); });
    fig.addEventListener("pointermove", (e) => { if (!dragging) return; st.t = fromX(e.clientX); draw(); }); const end = () => { dragging = false; }; fig.addEventListener("pointerup", end); fig.addEventListener("pointercancel", end);
    fig.addEventListener("keydown", (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return; e.preventDefault(); st.t = Math.max(0, Math.min(P.T - 0.001, st.t + d * (e.shiftKey ? 0.05 : 0.005))); draw(); });
    draw(); chDraw();
    const qh = document.createElement("div"); qh.innerHTML = `<h4 class="mt">Questions</h4>`; host.append(qh); renderQs(spec.questions, qh);
  };

  // ======================================== Blood Vessel Comparison ========================================
  // Release review (2026-11-15): this model is now the page's only drawing of the vessels (the static figure that showed
  // the same sections was removed). Three sections in one row with the names underneath, so everything fits on one
  // laptop screen; leader labels appear on each section after "Check my names". Arterioles are not named in the
  // specification and are left out here.
  B.interactives.vesselCompare = function (spec, host) {
    const uid = uidOf(); const KINDS = ["artery", "vein", "capillary"]; const NAME = { artery: "Artery", vein: "Vein", capillary: "Capillary" };
    const WHY = { artery: "Thick wall with much elastic tissue and smooth muscle around a narrow lumen: withstands and smooths high pressure.", vein: "Thin wall with little muscle or elastic tissue around a wide lumen: low pressure, low resistance (valves are not seen in a transverse section).", capillary: "Wall of endothelium only, one cell thick, around a lumen that fits one red blood cell: short diffusion pathway." };
    let order = seededShuffle(KINDS, 31); if (order.every((k, i) => k === KINDS[i])) order.reverse();
    const st = { placed: {}, sel: null, checked: false };
    host.innerHTML = head(spec, "schematic sections") + `
      <div data-r="cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.7rem;margin-top:.6rem">${order.map((k, i) => `<div class="card" data-slot="${i}" style="padding:.5rem"><div class="figure" style="margin:0"><div class="fig-view" data-sec="${i}">${A().vesselCard(k)}</div></div><div class="drop row" data-drop="${i}" style="justify-content:space-between;gap:.4rem;flex-wrap:wrap;border:1px dashed var(--line-strong);border-radius:10px;padding:.3rem .5rem;margin-top:.4rem"><span class="small"><strong>Section ${i + 1}:</strong> <span data-name="${i}" class="muted">no name yet</span></span><span class="row" style="gap:.3rem"><button type="button" class="btn sm" data-place="${i}">Place here</button><button type="button" class="btn sm ghost" data-clear="${i}" aria-label="clear section ${i + 1}">Clear</button></span></div><p class="small" data-fb="${i}" style="margin:.3rem 0 0"></p></div>`).join("")}</div>
      <div class="row mt" style="flex-wrap:wrap;gap:.5rem;align-items:center"><span class="small"><strong>Names:</strong></span><span class="row" data-r="chips" role="group" aria-label="vessel names" style="flex-wrap:wrap;gap:.4rem">${KINDS.map((k) => `<button type="button" class="chip" data-v="${k}" aria-pressed="false">${NAME[k]}</button>`).join("")}</span>
        <button type="button" class="btn sm primary" data-a="check">Check my names</button><button type="button" class="btn sm" data-a="reset">Reset</button></div>
      <p class="small muted" style="margin:.3rem 0 0">Drag a name onto a section, or choose a name and press <em>Place here</em>. Compare wall thickness with lumen width: the sections are not drawn to the same scale.</p>
      <p class="small" aria-live="polite" data-r="live"></p>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const refresh = () => { $$(".chip", host).forEach((c) => { const used = Object.values(st.placed).includes(c.dataset.v); c.classList.toggle("used", used && st.sel !== c.dataset.v); c.setAttribute("aria-pressed", String(st.sel === c.dataset.v)); c.style.outline = st.sel === c.dataset.v ? "3px solid var(--focus)" : ""; });
      order.forEach((k, i) => { const nm = $(`[data-name="${i}"]`, host); const v = st.placed[i]; nm.textContent = v ? NAME[v] : "no name yet"; nm.classList.toggle("muted", !v); }); };
    const place = (i, v) => { if (st.checked) return; for (const [j, w] of Object.entries(st.placed)) if (w === v) delete st.placed[j]; st.placed[i] = v; st.sel = null; refresh(); q("live").textContent = `${NAME[v]} placed on section ${+i + 1}.`; };
    host.addEventListener("click", (e) => { const t = e.target;
      const chip = t.closest(".chip"); if (chip && !chip.dataset.dragged) { if (st.checked) return; st.sel = st.sel === chip.dataset.v ? null : chip.dataset.v; refresh(); q("live").textContent = st.sel ? `${NAME[st.sel]} selected: now press Place here under a section.` : "Selection cleared."; return; }
      if (chip) { delete chip.dataset.dragged; return; }
      const pl = t.closest("[data-place]"); if (pl) { if (!st.sel) { q("live").textContent = "Choose a name first."; return; } place(pl.dataset.place, st.sel); return; }
      const cl = t.closest("[data-clear]"); if (cl && !st.checked) { delete st.placed[cl.dataset.clear]; refresh(); return; }
      const a = t.closest("[data-a]"); if (!a) return;
      if (a.dataset.a === "check") { if (Object.keys(st.placed).length < order.length) { q("live").textContent = "Name every section first."; return; } st.checked = true; let n = 0;
        order.forEach((k, i) => { const ok = st.placed[i] === k; if (ok) n++; const fb = $(`[data-fb="${i}"]`, host); fb.innerHTML = `${ok ? "✓ Correct" : `✗ This is the <strong>${NAME[k]}</strong>`}. ${esc(WHY[k])}`; $(`[data-drop="${i}"]`, host).style.borderColor = ok ? "var(--sage)" : "var(--rose)"; $(`[data-sec="${i}"]`, host).innerHTML = A().vesselCard(k, { labels: true }); });
        q("live").textContent = `${n} of ${order.length} correct.`; }
      if (a.dataset.a === "reset") { st.placed = {}; st.sel = null; st.checked = false; order.forEach((k, i) => { $(`[data-fb="${i}"]`, host).innerHTML = ""; $(`[data-drop="${i}"]`, host).style.borderColor = ""; $(`[data-sec="${i}"]`, host).innerHTML = A().vesselCard(k); }); refresh(); q("live").textContent = "Reset."; } });
    // pointer drag and drop (mouse and touch); the buttons above remain the keyboard path
    let drag = null, ghost = null, moved = false, sx = 0, sy = 0;
    const over = (x, y) => $$("[data-drop]", host).find((d) => { const r = d.closest(".card").getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
    q("chips").addEventListener("pointerdown", (e) => { const c = e.target.closest(".chip"); if (!c || st.checked) return; drag = c; moved = false; sx = e.clientX; sy = e.clientY; c.setPointerCapture(e.pointerId); });
    q("chips").addEventListener("pointermove", (e) => { if (!drag) return; if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return; if (!moved) { moved = true; ghost = drag.cloneNode(true); ghost.style.cssText = "position:fixed;pointer-events:none;z-index:99;opacity:.9"; document.body.append(ghost); drag.classList.add("dragging"); }
      ghost.style.left = e.clientX + 8 + "px"; ghost.style.top = e.clientY + 8 + "px"; $$("[data-drop]", host).forEach((d) => d.classList.remove("over")); const d = over(e.clientX, e.clientY); if (d) d.classList.add("over"); });
    const end = (e) => { if (!drag) return; if (moved) { const d = over(e.clientX, e.clientY); if (d) place(d.dataset.drop, drag.dataset.v); drag.dataset.dragged = "1"; drag.classList.remove("dragging"); } $$("[data-drop]", host).forEach((d) => d.classList.remove("over")); if (ghost) { ghost.remove(); ghost = null; } drag = null; };
    q("chips").addEventListener("pointerup", end); q("chips").addEventListener("pointercancel", end);
    refresh(); renderQs(spec.questions, q("q"));
  };

  // ======================================== Tissue Fluid Formation Simulator ========================================
  // Release review (2026-11-15): simplified to the AS model only (the revised Starling principle is beyond the
  // specification); the volume readout and the limitations paragraph are replaced by one plain sentence. The plot is
  // taller and every net-pressure arrow is at least 20 px long. This model replaces the static tissue fluid figure.
  B.interactives.tissueFluidSim = function (spec, host) {
    const uid = uidOf(); const D = M().FLUID; const st = { Pa: D.Pa, Pv: D.Pv, onc: D.onc };
    const PRESETS = { typical: ["Typical values", { Pa: 35, Pv: 18, onc: 25 }], venous: ["Raised venous pressure", { Pa: 35, Pv: 28, onc: 25 }], protein: ["Low plasma protein", { Pa: 35, Pv: 18, onc: 15 }], arterial: ["Raised arteriole pressure", { Pa: 45, Pv: 20, onc: 25 }] };
    const sl = (k, label, min, max) => `<label class="small" style="display:block;margin:.2rem 0">${label}: <strong data-v="${k}"></strong><input type="range" data-k="${k}" min="${min}" max="${max}" step="1" style="width:100%"></label>`;
    host.innerHTML = head(spec, "simplified model") + `
      <div class="ix"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view" data-r="fig"></div></div></div><div class="ix-panel">
        <div>${sl("Pa", "Hydrostatic pressure, arteriole end", 15, 55)}${sl("Pv", "Hydrostatic pressure, venule end", 5, 40)}${sl("onc", "Oncotic pressure (plasma proteins)", 5, 40)}</div>
        <div class="row" style="flex-wrap:wrap;gap:.35rem">${Object.entries(PRESETS).map(([k, [l]]) => `<button type="button" class="btn sm" data-p="${k}">${l}</button>`).join("")}</div>
        <div data-r="read" aria-live="polite"></div>
      </div></div></div>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const chart = (F) => { const W = 640, H = 420, L = 70, Rr = 600, top = 30, bot = 250, pmax = 55; const X = (x) => L + (Rr - L) * x, Y = (p) => bot - ((bot - top) * p) / pmax;
      let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Hydrostatic and oncotic pressure along the capillary, and the net movement of fluid out of or into it" style="max-width:100%;height:auto"><defs><marker id="tfa-${uid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#1f66b0"/></marker><marker id="tfl-${uid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#7a5a12"/></marker></defs><rect width="${W}" height="${H}" fill="#fff"/>`;
      for (let p = 0; p <= 50; p += 10) s += `<line x1="${L}" y1="${Y(p)}" x2="${Rr}" y2="${Y(p)}" stroke="#e6ecef"/><text x="${L - 8}" y="${Y(p) + 5}" text-anchor="end" font-size="13" fill="#5f6f7f">${p}</text>`;
      s += `<text transform="translate(22 ${(top + bot) / 2}) rotate(-90)" text-anchor="middle" font-size="14" font-weight="700" fill="#16263a">Pressure / mmHg</text>`;
      s += `<path d="${Array.from({ length: 41 }, (_, i) => (i ? "L" : "M") + X(i / 40).toFixed(1) + " " + Y(F.hyd(i / 40)).toFixed(1)).join(" ")}" fill="none" stroke="#1f66b0" stroke-width="3.5"/><text x="${X(0) + 8}" y="${Y(F.hyd(0)) - 8}" font-size="14" font-weight="800" fill="#1f66b0">hydrostatic pressure</text>`;
      s += `<line x1="${X(0)}" y1="${Y(F.p.onc)}" x2="${X(1)}" y2="${Y(F.p.onc)}" stroke="#6b3fa0" stroke-width="3.5" stroke-dasharray="8 6"/><text x="${X(1) - 6}" y="${Y(F.p.onc) - 8}" text-anchor="end" font-size="14" font-weight="800" fill="#6b3fa0">oncotic pressure</text>`;
      if (F.xZero !== null) s += `<line x1="${X(F.xZero)}" y1="${top}" x2="${X(F.xZero)}" y2="${bot + 116}" stroke="#7a8794" stroke-dasharray="4 4"/>`;
      // capillary with net-pressure arrows: up = out of the capillary, down = back in; length = net pressure (at least 20 px)
      const cy = 330; s += `<rect x="${L}" y="${cy - 20}" width="${Rr - L}" height="40" rx="20" fill="#f6d3cf" stroke="#8a5a4f" stroke-width="1.5"/><text x="${L + 10}" y="${cy + 5}" font-size="13" font-weight="700" fill="#8f3434">arteriole end</text><text x="${Rr - 10}" y="${cy + 5}" text-anchor="end" font-size="13" font-weight="700" fill="#2f5fa8">venule end</text>`;
      for (let i = 0; i < 8; i++) { const x = (i + 0.5) / 8, v = F.net(x); if (Math.abs(v) < 0.5) continue; const len = Math.max(20, Math.min(52, Math.abs(v) * 4)); const xx = X(x);
        s += v > 0 ? `<line x1="${xx}" y1="${cy - 22}" x2="${xx}" y2="${cy - 22 - len}" stroke="#1f66b0" stroke-width="3.5" marker-end="url(#tfa-${uid})"/>` : `<line x1="${xx}" y1="${cy - 24 - len}" x2="${xx}" y2="${cy - 24}" stroke="#1f66b0" stroke-width="3.5" marker-end="url(#tfa-${uid})"/>`; }
      s += `<text x="${(L + Rr) / 2}" y="${cy + 42}" text-anchor="middle" font-size="13" fill="#46525e">arrows: up = fluid out of the capillary, down = water back in</text>`;
      s += `<line x1="${L + 120}" y1="${cy + 70}" x2="${L + 120 + Math.max(36, Math.min(240, F.lymph * 30))}" y2="${cy + 70}" stroke="#7a5a12" stroke-width="5" marker-end="url(#tfl-${uid})"/><text x="${L + 110}" y="${cy + 75}" text-anchor="end" font-size="14" font-weight="700" fill="#7a5a12">to lymph</text>`;
      return s + "</svg>"; };
    const draw = () => { const F = M().fluid({ Pa: st.Pa, Pv: st.Pv, onc: st.onc }); ["Pa", "Pv", "onc"].forEach((k) => { $(`[data-v="${k}"]`, host).textContent = `${st[k]} mmHg`; $(`[data-k="${k}"]`, host).value = st[k]; });
      q("fig").innerHTML = chart(F);
      const sign = (v) => (v > 0 ? "+" : "") + f0(v);
      const msg = F.netV < 0 ? (F.fracReab > 0.5 ? "More fluid leaves than returns: the excess drains into the lymph." : "Little water returns at the venule end, so much more drains into the lymph.") : "No water returns at the venule end: tissue fluid builds up unless the lymph can drain it.";
      q("read").innerHTML = `<p class="small" style="margin:0">Net pressure: arteriole end <strong>${sign(F.netA)} mmHg</strong> (${F.netA > 0 ? "out" : "in"}); venule end <strong>${sign(F.netV)} mmHg</strong> (${F.netV < 0 ? "in, by osmosis" : "still out"}).</p><p class="small" style="margin:.35rem 0 0">${msg}</p>`; };
    $$("[data-k]", host).forEach((r) => r.addEventListener("input", () => { st[r.dataset.k] = +r.value; draw(); }));
    $$("[data-p]", host).forEach((b) => b.addEventListener("click", () => { Object.assign(st, PRESETS[b.dataset.p][1]); draw(); }));
    draw(); renderQs(spec.questions, q("q"));
  };

  // ======================================== Cardiac Output Calculator ========================================
  B.interactives.cardiacOutput = function (spec, host) {
    const uid = uidOf(); const st = { mode: "co", hr: 75, sv: 70, co: 5.25 };
    host.innerHTML = head(spec, "calculator") + `
      <div class="row mt" style="flex-wrap:wrap;gap:.8rem;align-items:center"><label class="small">Calculate <select data-a="mode"><option value="co">cardiac output</option><option value="sv">stroke volume</option><option value="hr">heart rate</option></select></label></div>
      <div class="grid grid-2 mt" style="gap:1rem;align-items:start">
        <div data-r="inputs"></div>
        <div class="card" style="background:var(--surface-2)"><div data-r="out" aria-live="polite"></div></div>
      </div>
      <h4 class="mt">Exam-style problems</h4><ol data-r="probs" class="small" style="padding-left:1.2rem"></ol>
      <h4 class="mt">Question</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const field = (k, label, min, max, step) => `<label class="small" style="display:block;margin:.4rem 0">${label}<br><input type="number" data-f="${k}" min="${min}" max="${max}" step="${step}" value="${st[k]}" style="width:8rem"> <input type="range" data-f="${k}" min="${min}" max="${max}" step="${step}" value="${st[k]}" style="width:100%;max-width:260px" aria-label="${label} slider"></label>`;
    const inputs = () => { const F = { hr: field("hr", "Heart rate / beats min⁻¹", 30, 220, 1), sv: field("sv", "Stroke volume / cm³", 20, 200, 1), co: field("co", "Cardiac output / dm³ min⁻¹", 1, 40, 0.05) };
      q("inputs").innerHTML = (st.mode === "co" ? F.hr + F.sv : st.mode === "sv" ? F.co + F.hr : F.co + F.sv);
      $$("[data-f]", q("inputs")).forEach((inp) => inp.addEventListener("input", () => { const v = parseFloat(inp.value); if (!isFinite(v) || v <= 0) return; st[inp.dataset.f] = v; $$(`[data-f="${inp.dataset.f}"]`, q("inputs")).forEach((o) => { if (o !== inp) o.value = v; }); out(); })); };
    const out = () => { let html;
      if (st.mode === "co") { const c = M().co(st.hr, st.sv); html = `<p class="small"><strong>Cardiac output = heart rate × stroke volume</strong></p><p class="small">= ${st.hr} beats min⁻¹ × ${st.sv} cm³<br>= <strong>${f0(c)} cm³ min⁻¹</strong><br>÷ 1000 = <strong>${f2(c / 1000)} dm³ min⁻¹</strong></p>`; }
      else if (st.mode === "sv") { const c = st.co * 1000, s = c / st.hr; html = `<p class="small"><strong>Stroke volume = cardiac output ÷ heart rate</strong></p><p class="small">Convert: ${f2(st.co)} dm³ min⁻¹ × 1000 = ${f0(c)} cm³ min⁻¹<br>${f0(c)} ÷ ${st.hr} = <strong>${f1(s)} cm³</strong></p>`; }
      else { const c = st.co * 1000, h = c / st.sv; html = `<p class="small"><strong>Heart rate = cardiac output ÷ stroke volume</strong></p><p class="small">Convert: ${f2(st.co)} dm³ min⁻¹ × 1000 = ${f0(c)} cm³ min⁻¹<br>${f0(c)} ÷ ${st.sv} = <strong>${f0(h)} beats min⁻¹</strong></p>`; }
      q("out").innerHTML = html + `<p class="tiny muted">1 dm³ = 1000 cm³. Typical adult at rest: about 5 dm³ min⁻¹.</p>`; };
    $('[data-a="mode"]', host).addEventListener("change", (e) => { st.mode = e.target.value; inputs(); out(); });
    q("probs").innerHTML = (spec.problems || []).map((p, i) => `<li style="margin:.5rem 0"><p style="margin:.1rem 0">${esc(p.text)}</p><span class="row" style="gap:.4rem;flex-wrap:wrap;align-items:center"><input type="text" inputmode="decimal" data-pi="${i}" aria-label="answer to problem ${i + 1}" style="width:7rem"> <span>${esc(p.unit)}</span><button type="button" class="btn sm" data-pc="${i}">Check</button></span><span class="small" data-pf="${i}" aria-live="polite" style="display:block"></span></li>`).join("");
    q("probs").addEventListener("click", (e) => { const b = e.target.closest("[data-pc]"); if (!b) return; const i = +b.dataset.pc, p = spec.problems[i]; const v = parseFloat(String($(`[data-pi="${i}"]`, host).value).replace(/[,\s]/g, "").replace("−", "-"));
      const fb = $(`[data-pf="${i}"]`, host); if (!isFinite(v)) { fb.textContent = "Type a number first."; return; }
      const tol = Math.max(0.5 * 10 ** -p.dp + 1e-9, Math.abs(p.answer) * 0.01); const ok = Math.abs(v - p.answer) <= tol;
      fb.innerHTML = `${ok ? "✓ Correct." : `✗ Not quite: the answer is ${M().fix(p.answer, p.dp)} ${esc(p.unit)}.`} <span class="muted">Working: ${esc(p.working)}</span>`; });
    inputs(); out(); renderQs(spec.questions, q("q"));
  };
})(window.BIO);
