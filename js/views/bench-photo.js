// RP7 virtual bench and the 3.3.2.3 interactives (Phase 5 Batch 1, author U3).
// 1. B.interactives.photoRateSim: Photosynthesis Rate Simulator (3.3.2.3). Three sliders, the rate, a curve of rate
//    against the chosen factor at the other two settings, up to three kept curves for comparison, the limiting factor
//    and a plain explanation. Every number comes from B.photoModel.rate / explain / curve (data/content/_photo-model.js).
// 2. B.interactives.photoDataChallenge: Experimental Data Challenge (3.3.2.3): six tabs, each a simulated figure or table
//    with its questions (spec.items[].questions, rendered through the question engine so attempts count to mastery).
// 3. B.labSims.photo = { sim(host, key), calc(host, key) }: the RP7 bench, called by js/views/lab.js when
//    B.practicals[7].sim === "photo". Stages: 1 Plan, 2 Set up (handbook steps 1 to 3), 3 Count (steps 4 to 7). The
//    Calculate tab processes a run (1/d², means), draws the graph and carries out Spearman's rank test (steps 8 to 10).
//    ONE model run drives everything: the bubble times from B.photoModel.bubbleTimes() are what the drawing animates, what
//    the bubble record shows, what auto count counts, and what the table, graph and statistics use. Runs are saved in
//    B.store.get().labRuns[key] and hold SIMULATED counts only.
// Layout: the bench uses the RP5 stage pattern ([data-pl="body"], .pl-fig, B.ix.split), so the shared CSS pins the
// drawing beside (laptop) or above (phone) the controls when a stage is chosen. Reduced motion: no animation; bubbles are
// shown still and the "watch and count" mode is replaced by the bubble record. No flashing.
window.BIO = window.BIO || {}; window.BIO.labSims = window.BIO.labSims || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.photoModel, G = () => B.photoLimArt, P7 = () => B.practicals[7] || {};
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion") || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const ok = (t) => `<span style="color:var(--sage-ink)">${t}</span>`, bad = (t) => `<span style="color:var(--rose-ink)">${t}</span>`, amb = (t) => `<span style="color:var(--amber-ink)">${t}</span>`;
  const f1 = (x) => (Math.round(x * 10 + 1e-9) / 10).toFixed(1), f0 = (x) => String(Math.round(x));
  const sf3 = (x) => x.toPrecision(3); // 3 significant figures, trailing zeros kept (0.0100)
  const num = (v) => { const s = String(v == null ? "" : v).trim().replace(",", ".").replace(/[^\d.eE\-]/g, ""); return s === "" || isNaN(+s) ? null : +s; };
  const inp = (id, w = "5.5rem", label = "", extra = "") => `<input id="${id}" type="text" inputmode="decimal" autocomplete="off" ${label ? `aria-label="${esc(label)}"` : ""} ${extra} style="width:${w};padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)">`;
  const uidOf = () => "ph" + Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  let styled = false;
  const ensureStyle = () => { if (styled) return; styled = true; const s = document.createElement("style");
    s.textContent = `.pl-nav{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 .4rem;padding:0;list-style:none}.pl-nav button{font-size:.8rem;padding:.25rem .55rem;border-radius:999px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);cursor:pointer}
.pl-nav button[aria-current=step]{background:var(--teal);border-color:var(--teal);color:#fff}.pl-nav button.done::after{content:" ✓"}
.pl-fig:empty{display:none}.pl-fig{background:#fff;border-radius:10px;padding:.25rem;max-width:100%;overflow-x:auto}.pl-fig svg{display:block;width:100%;height:auto}
.pl-tbl{overflow-x:auto;max-width:100%}.pl-tbl input{width:4.6rem}.pl-panel p{margin:.2rem 0}.pl-big{font-size:1.05rem;padding:.55rem 1rem}.pl-msg{min-height:1.2em}
.ph-steps{display:flex;flex-direction:column;gap:.3rem}.ph-steps .btn{text-align:left;white-space:normal;line-height:1.3}.ph-steps .btn.done{border-color:var(--sage-ink)}
.ph-sim-read{font-size:.95rem;background:var(--surface-2);padding:.45rem .65rem;border-radius:8px;line-height:1.4;margin-top:.4rem}
.pl-modes label{display:flex;gap:.4rem;align-items:baseline;margin:.1rem 0}.pl-modes input{flex:none}
.ph-dc-tabs{display:flex;flex-wrap:wrap;gap:.35rem;margin:.2rem 0 .6rem}`; document.head.append(s); };

  // ======================================================================================================
  // 1. Photosynthesis Rate Simulator
  // ======================================================================================================
  const AX = {
    light: { key: "light", name: "light intensity", x: () => ({ min: 0, max: 100, ticks: G().ticks(0, 100, 20), label: "light intensity / arbitrary units" }), step: 1, fmt: (v) => `${f0(v)} a.u.` },
    co2: { key: "co2", name: "carbon dioxide concentration", x: () => ({ min: 0, max: 0.15, ticks: G().ticks(0, 0.15, 0.03), label: "carbon dioxide concentration / %", fmt: (v) => v.toFixed(2) }), step: 0.005, fmt: (v) => `${v.toFixed(3)} %` },
    temp: { key: "temp", name: "temperature", x: () => ({ min: 0, max: 50, ticks: G().ticks(0, 50, 10), label: "temperature / °C" }), step: 1, fmt: (v) => `${f0(v)} °C` },
  };
  const KEPT_STYLE = [{ color: "#7a4fa3", dash: "8 5" }, { color: "#b8650a", dash: "3 4" }, { color: "#2e7d4f", dash: "12 4 3 4" }];
  const PRESETS = [
    ["Dim morning", { light: 10, co2: 0.04, temp: 15 }],
    ["Bright summer day", { light: 90, co2: 0.04, temp: 25 }],
    ["Cold, bright day", { light: 90, co2: 0.04, temp: 5 }],
    ["Glasshouse with extra carbon dioxide", { light: 90, co2: 0.1, temp: 25 }],
    ["Heatwave", { light: 100, co2: 0.04, temp: 42 }],
  ];
  const condText = (c, axis) => Object.keys(AX).filter((k) => k !== axis).map((k) => (k === "light" ? `light ${f0(c.light)} a.u.` : k === "co2" ? `${c.co2.toFixed(3).replace(/0$/, "")} % CO₂` : `${f0(c.temp)} °C`)).join(", ");
  // phones: the simulator graph keeps 420 px (labels at least 12 px) and scrolls sideways inside its box
  const PHONE = () => innerWidth < 600;
  B.interactives.photoRateSim = function (spec, host) {
    ensureStyle(); const u = uidOf();
    const st = { light: 20, co2: 0.04, temp: 20, axis: "light", kept: [] };
    const slider = (k, label, min, max, step) => `<div class="ix-group"><label class="small" for="${u}-${k}"><strong>${label}</strong>: <output data-r="${k}v"></output></label><input id="${u}-${k}" data-k="${k}" type="range" min="${min}" max="${max}" step="${step}" value="${st[k]}"></div>`;
    host.innerHTML = head(spec, "simplified model") + B.ix.split(`<div class="figure" style="margin:0"><div class="fig-view${PHONE() ? " ix-hscroll" : ""}" data-r="graph"></div></div>${PHONE() ? '<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>' : ""}<div class="ph-sim-read" data-r="read" aria-live="polite"></div>`,
      `<fieldset><legend>Conditions</legend>${slider("light", "Light intensity", 0, 100, 1)}${slider("co2", "Carbon dioxide", 0, 0.15, 0.005)}<p class="tiny muted" style="margin:.1rem 0 .3rem">Air contains about 0.04 % carbon dioxide.</p>${slider("temp", "Temperature", 0, 50, 1)}</fieldset>
       <fieldset><legend>Draw rate against</legend>${Object.values(AX).map((a) => `<label class="small"><input type="radio" name="${u}-ax" value="${a.key}" ${a.key === st.axis ? "checked" : ""}> ${a.name}</label>`).join("")}</fieldset>
       <div class="row"><button type="button" class="btn sm" data-a="keep">Keep this curve</button><button type="button" class="btn sm" data-a="clear" disabled>Clear kept curves</button></div>
       <div class="small" data-r="why" aria-live="polite"></div>
       <details><summary class="small"><strong>Try these conditions</strong></summary><div class="row mt">${PRESETS.map(([n], i) => `<button type="button" class="btn sm" data-p="${i}">${n}</button>`).join("")}</div></details>`, { label: "Simulator controls", cls: "ix-wide-stage" }) + `
      <details class="small mt"><summary>How the model is simplified</summary><ul>${M().ASSUMPTIONS.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></details>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const cond = () => ({ light: st.light, co2: st.co2, temp: st.temp });
    function draw() {
      const ax = AX[st.axis], c = cond(), E = M().explain(c);
      for (const k of Object.keys(AX)) q(k + "v").textContent = AX[k].fmt(st[k]);
      const series = st.kept.filter((k) => k.axis === st.axis).map((k, i) => ({ pts: k.pts, color: KEPT_STYLE[i].color, dash: KEPT_STYLE[i].dash, width: 2.2, name: `kept: ${k.label}` }));
      series.push({ pts: M().curve(st.axis, c, 100), color: "#1d5f8a", width: 3, name: `now: ${condText(c, st.axis)}` });
      const vlines = st.axis === "co2" ? [{ x: 0.04, t: "air" }] : [];
      q("graph").innerHTML = G().graph({ w: 520, h: 320, minW: PHONE() ? 420 : 0, x: ax.x(), y: { min: 0, max: 80, ticks: G().ticks(0, 80, 20), label: "rate of photosynthesis / a.u." }, series, vlines, marker: { x: st[st.axis], y: E.rate }, keyCols: 1,
        aria: `Simulated graph of rate of photosynthesis against ${ax.name}, with ${condText(c, st.axis)}. The circle marks the current setting: rate ${f1(E.rate)} arbitrary units. Limiting factor: ${E.title}.${series.length > 1 ? ` ${series.length - 1} kept curve${series.length > 2 ? "s" : ""} shown for comparison.` : ""}` });
      q("read").innerHTML = `<strong>Rate:</strong> ${f1(E.rate)} arbitrary units · <strong>Limiting factor:</strong> ${esc(E.title)}`;
      q("why").innerHTML = `<p class="small" style="margin:0">${esc(E.text)}</p>`;
      $('[data-a="clear"]', host).disabled = !st.kept.length; $('[data-a="keep"]', host).disabled = st.kept.filter((k) => k.axis === st.axis).length >= 3;
    }
    $$("input[type=range]", host).forEach((r) => r.addEventListener("input", () => { st[r.dataset.k] = +r.value; draw(); }));
    $$(`input[name="${u}-ax"]`, host).forEach((r) => r.addEventListener("change", () => { if (r.checked) { st.axis = r.value; draw(); } }));
    $('[data-a="keep"]', host).addEventListener("click", () => { const mine = st.kept.filter((k) => k.axis === st.axis); if (mine.length >= 3) return; st.kept.push({ axis: st.axis, pts: M().curve(st.axis, cond(), 100), label: condText(cond(), st.axis) }); draw(); });
    $('[data-a="clear"]', host).addEventListener("click", () => { st.kept = []; draw(); });
    $$("[data-p]", host).forEach((b) => b.addEventListener("click", () => { const p = PRESETS[+b.dataset.p][1]; Object.assign(st, p); $$("input[type=range]", host).forEach((r) => { r.value = st[r.dataset.k]; }); draw(); }));
    draw(); renderQs(spec.questions, q("q"));
  };

  // ======================================================================================================
  // 2. Experimental Data Challenge
  // ======================================================================================================
  B.interactives.photoDataChallenge = function (spec, host) {
    ensureStyle(); const u = uidOf(); const items = spec.items || [];
    host.innerHTML = head(spec, "simulated data") + `<div class="ph-dc-tabs" role="tablist" aria-label="Challenges">${items.map((it, i) => `<button type="button" class="btn sm${i ? "" : " primary"}" role="tab" id="${u}-t${i}" aria-controls="${u}-p${i}" aria-selected="${!i}" tabindex="${i ? -1 : 0}">${esc(it.tab)}</button>`).join("")}</div>${items.map((it, i) => `<div role="tabpanel" id="${u}-p${i}" aria-labelledby="${u}-t${i}" ${i ? "hidden" : ""}></div>`).join("")}`;
    const built = new Set();
    const build = (i) => { if (built.has(i)) return; built.add(i); const it = items[i], pane = $(`#${u}-p${i}`, host);
      const fig = typeof it.figure === "function" ? it.figure() : it.figure || ""; const isTable = /^\s*<div/.test(fig);
      pane.innerHTML = B.ix.split(`<p class="small" style="margin:0 0 .35rem">${it.intro || ""}</p>${isTable ? fig : `<div class="figure" style="margin:0"><div class="fig-view">${fig}</div></div>`}`, `<div data-r="q"></div>`, { label: it.tab, cls: isTable ? "ix-nosticky-sm" : "" });
      renderQs(it.questions, $('[data-r="q"]', pane)); };
    const tabs = $$('[role="tab"]', host);
    const show = (i, focus) => { tabs.forEach((b, k) => { const on = k === i; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; b.classList.toggle("primary", on); $(`#${u}-p${k}`, host).hidden = !on; }); build(i); if (focus) tabs[i].focus(); };
    tabs.forEach((b, i) => b.addEventListener("click", () => show(i)));
    $(".ph-dc-tabs", host).addEventListener("keydown", (e) => { const cur = tabs.findIndex((b) => b.getAttribute("aria-selected") === "true"); let n = null; if (e.key === "ArrowRight") n = (cur + 1) % tabs.length; else if (e.key === "ArrowLeft") n = (cur - 1 + tabs.length) % tabs.length; else if (e.key === "Home") n = 0; else if (e.key === "End") n = tabs.length - 1; if (n === null) return; e.preventDefault(); show(n, true); });
    show(0);
  };

  // ======================================================================================================
  // 3. RP7 bench
  // ======================================================================================================
  const STAGES = ["Plan", "Set up", "Count"];
  const DIST_OPTS = [3, 5, 6, 8, 10, 12, 15, 20, 25, 30, 35];
  const SETUP = [
    { id: "fill", ok: true, label: "Fill the boiling tube to the top with the solution", why: "Step 1. The solution supplies carbon dioxide (from hydrogencarbonate ions) and a full tube keeps the plant well covered." },
    { id: "cut", ok: true, label: "Push about 5 cm of plant in until the cut end is just below the surface; cut the stem at an angle with scissors, below the surface", why: "Step 2. Cutting under the solution stops air getting into the cut end; the slanting cut leaves an open surface for bubbles to leave from (this site's explanation)." },
    { id: "rod", ok: true, label: "Push the plant gently down with the glass rod: cut end at the top, about half way down the tube", why: "Step 3. Bubbles leave the cut end and rise through the solution, where they can be counted; the rod moves the plant without crushing it." },
    { id: "air", ok: false, label: "Cut the stem in the air first, then drop the plant into the tube", why: "Not the handbook method: the stem is cut at an angle while it is below the surface of the solution (step 2), so that air does not get into the cut end." },
    { id: "down", ok: false, label: "Push the plant to the bottom with the cut end pointing down", why: "Not the handbook method: the cut end must be at the top and about half way down (step 3), so the bubbles leave from one place and rise where they can be counted." },
    { id: "close", ok: false, label: "Stand the tube right against the bulb so it gets as much light as possible", why: "Not the handbook method: the tube goes in the rack 10 cm from the bulb (step 4), and all distances are between 5 and 30 cm (step 7)." },
  ];
  const SETUP_ORDER = ["fill", "cut", "rod"];
  const SETUP_SHOWN = ["cut", "close", "fill", "air", "rod", "down"]; // fixed mixed order
  const CTL = [["temp", "Temperature of the solution", 1], ["conc", "Concentration of sodium hydrogen carbonate (1 %)", 1], ["piece", "The same piece of plant", 1], ["bulb", "The same lamp and bulb", 1], ["time", "Counting time (1 minute) and the time left before counting", 1], ["rack", "Colour of the test tube rack", 0], ["clock", "Make of stop clock", 0]];
  const NULLS = [["none", "There is no correlation between light intensity and the rate of photosynthesis.", true], ["inc", "The rate of photosynthesis increases as light intensity increases.", false], ["cause", "Light intensity causes the rate of photosynthesis to change.", false]];
  const PRED = [["rise", "The rate will increase as light intensity increases (as the lamp is brought closer), and may level off close to the lamp."], ["same", "The rate will be the same at every distance."], ["fall", "The rate will decrease as light intensity increases."]];
  const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const species = (m) => (/elodea/i.test(m) ? "elodea" : "cabomba");
  const matName = (m) => (M().MATERIALS[m] || {}).label || m;
  const runLabel = (r, i) => `Run ${i + 1}: ${matName(r.material)}${r.lamp !== "filament" ? ", energy-saving bulb" : ""}${r.solution === "water" ? ", water only" : ""}${Object.values(r.rows).some((a) => a.some((c) => !c.settled)) ? ", some counts without waiting" : ""}`;
  const statsOf = (rows) => { const ds = Object.keys(rows).map(Number).filter((d) => rows[d].length).sort((a, b) => a - b); const rs = ds.map((d) => ({ d, counts: rows[d].map((c) => (typeof c === "number" ? c : c.n)), inv: 1 / (d * d) })); rs.forEach((r) => { r.mean = M().mean(r.counts); }); const sp = rs.length >= 2 ? M().spearman(rs.map((r) => r.inv), rs.map((r) => +f1(r.mean))) : null; return { rows: rs, sp, n: rs.length, crit: M().CRIT[rs.length] }; };
  function specimen() { const s = P7().sets.SETS.spec; return { label: "Specimen data set: fresh Cabomba (checked answers)", specimen: true, material: "cabomba", lamp: "filament", solution: "nahco3", rows: Object.fromEntries(Object.entries(s.rows).map(([d, a]) => [d, a.map((n) => ({ n, settled: true }))])) }; }

  // bubble record: one 60 s count as two rows of 30 s; one mark per bubble at the time it left the cut end
  function record(bubbles, o = {}) {
    const X0 = 30, WID = 560, rowY = [52, 128];
    const xs = (t) => X0 + ((t % 30) / 30) * WID;
    let s = `<svg viewBox="0 0 620 186" role="img" aria-label="${esc(o.aria || "Bubble record for a 1-minute count: one mark for each bubble that left the cut end, in two rows of 30 seconds.")}" style="${o.minW ? `min-width:${o.minW}px;` : ""}background:#fff"><rect width="620" height="186" fill="#fff"/>`;
    for (const r of [0, 1]) { s += `<rect x="${X0}" y="${rowY[r] - 26}" width="${WID}" height="30" fill="#eef5fb"/><line x1="${X0}" y1="${rowY[r] + 4}" x2="${X0 + WID}" y2="${rowY[r] + 4}" stroke="#476a85"/>`;
      for (let i = 0; i <= 30; i++) s += `<line x1="${X0 + (i / 30) * WID}" y1="${rowY[r] + 4}" x2="${X0 + (i / 30) * WID}" y2="${rowY[r] + (i % 5 ? 9 : 13)}" stroke="#7a8794"/>${i % 5 === 0 ? `<text x="${X0 + (i / 30) * WID}" y="${rowY[r] + 27}" font-size="15" text-anchor="middle" fill="#3f5a6e">${r * 30 + i} s</text>` : ""}`; }
    bubbles.forEach((b, i) => { const r = b.t >= 30 ? 1 : 0; s += `<circle cx="${xs(b.t).toFixed(1)}" cy="${rowY[r] - 11}" r="${(3 + 3 * (b.size - 0.75)).toFixed(1)}" fill="#fff" stroke="#1d5f8a" stroke-width="1.8"/>${o.marks ? `<text x="${xs(b.t).toFixed(1)}" y="${rowY[r] - 21}" font-size="13.5" font-weight="700" text-anchor="middle" fill="#1d6f5c">${i + 1}</text>` : ""}`; });
    return s + `<text x="310" y="182" font-size="15" font-weight="600" text-anchor="middle" fill="#16263a">time from the start of the count / s (one circle for each bubble)</text></svg>`;
  }

  function bench(host, key, onRun) {
    ensureStyle(); const u = uidOf();
    const S = { stage: 0, material: "cabomba", lamp: "filament", solution: "nahco3", nullH: "", prediction: "", ctlOK: false, setup: [], run: null, d: null, settled: false, noWait: false, rows: {}, order: [], mode: reduced() ? "record" : "watch", fast: false, busy: false, saved: false, seed: (Date.now() % 90000) + 1000, pending: null };
    host.innerHTML = `<p class="small muted">Simulated counts from this site's model: no real plant is measured here. <span class="badge amber">simulated</span></p>
      <ol class="pl-nav" aria-label="Stages of the practical">${STAGES.map((s, i) => `<li><button type="button" data-st="${i}">${i + 1} ${s}</button></li>`).join("")}</ol>
      <div data-pl="body"></div><div class="small pl-msg" aria-live="polite" data-pl="live"></div>`;
    const q = (k, root = host) => $(`[data-pl="${k}"]`, root);
    const say = (t) => { q("live").innerHTML = t; };
    const inView = () => { const s = $(".ix-stage", q("body")); if (!s) return true; const r = s.getBoundingClientRect(); const tb = (document.querySelector(".topbar") || { getBoundingClientRect: () => ({ bottom: 0 }) }).getBoundingClientRect().bottom; return r.top >= tb - 1 && r.bottom <= innerHeight + 1; };
    $$(".pl-nav button", host).forEach((b) => b.addEventListener("click", () => { go(+b.dataset.st); if (!inView()) host.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }));
    const doneStage = (i) => [S.ctlOK && S.nullH === "none" && S.prediction, S.setup.length === 3, S.saved][i];
    const nav = () => $$(".pl-nav button", host).forEach((b, i) => { b.toggleAttribute("aria-current", false); if (i === S.stage) b.setAttribute("aria-current", "step"); b.classList.toggle("done", !!doneStage(i)); });
    let stop = null;
    function go(i, keep) { if (stop) stop(); S.stage = i; nav(); if (!keep) say(""); [plan, setup, count][i](q("body")); centreTube(); }
    // phones: the drawing keeps a readable width and scrolls sideways; bring the boiling tube into view
    function centreTube() { const box = $(".ix-stage .pl-fig.ix-hscroll", q("body")); if (!box || box.scrollWidth <= box.clientWidth + 2) return; const svg = $("svg", box); if (!svg) return; const k = svg.getBoundingClientRect().width / 640; const d = S.stage === 2 && S.d != null ? S.d : S.stage === 0 ? 10 : 30; box.scrollLeft = Math.max(0, (132 + d * 14) * k - box.clientWidth / 2); }
    const nextBtn = (i, label) => `<button type="button" class="btn sm" data-next="${i}">${label || `Next: ${STAGES[i]}`} →</button>`;
    const wireNext = (box) => $$("[data-next]", box).forEach((b) => b.addEventListener("click", () => { go(+b.dataset.next); host.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }));
    const drawing = (o) => P7().art.apparatus(Object.assign({ id: u + "app", species: species(S.material), solution: S.solution, minW: 520 }, o));
    const resetRun = () => { S.run = null; S.d = null; S.settled = false; S.rows = {}; S.order = []; S.saved = false; S.pending = null; S.seed = (Date.now() % 90000) + 1000; };
    const resetAll = () => { resetRun(); S.setup = []; };
    // laptop layout (picture beside the controls): some fieldsets go under the picture, where the column has room
    const wide = (box) => (box.clientWidth || (document.getElementById("content") || document.body).clientWidth - 48) >= 700; // the box is 0 wide while its tab is hidden
    const fig = (inner) => `<div class="pl-fig ix-hscroll">${inner}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;

    // ---- 1 Plan ----
    function plan(box) {
      const W = wide(box);
      const nullFs = `<fieldset><legend>Null hypothesis</legend>${NULLS.map(([k, t]) => `<label class="small"><input type="radio" name="${u}nh" value="${k}" ${S.nullH === k ? "checked" : ""}> ${t}</label>`).join("")}<div class="small" data-pl="nhfb" aria-live="polite"></div></fieldset>`;
      const choices = `<fieldset><legend>Aquatic plant (teachers' notes)</legend>${Object.entries(M().MATERIALS).map(([k, m]) => `<label class="small"><input type="radio" name="${u}mat" value="${k}" ${S.material === k ? "checked" : ""}> ${m.label}</label>`).join("")}</fieldset>
        <fieldset><legend>Lamp</legend>${Object.entries(M().LAMPS).map(([k, l]) => `<label class="small"><input type="radio" name="${u}lamp" value="${k}" ${S.lamp === k ? "checked" : ""}> ${l.label}</label>`).join("")}<p class="tiny muted">The handbook says to trial the lamp: some energy-saving bulbs do not give good results.</p></fieldset>`;
      box.innerHTML = B.ix.split(fig(drawing({ d: 10, lamp: true, filled: true, plant: "placed", bubbles: [{ y: 122, r: 3 }, { y: 152, r: 3.4 }, { y: 180, r: 2.8 }] })) + `<p class="tiny muted mt">What you will set up (handbook steps 1 to 4).</p>` + (W ? `<div class="ix-panel pl-panel mt" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.6rem;align-items:start">${choices}</div><div class="ix-panel pl-panel mt">${nullFs}</div>` : ""),
        `<div class="pl-panel">${W ? "" : choices}
        <fieldset><legend>Variables</legend><p class="small"><strong>Independent:</strong> light intensity, changed by the distance from the bulb (5 to 30 cm) and calculated as 1/d².<br><strong>Dependent:</strong> bubbles leaving the cut end in 1 minute.</p>
          <p class="small"><strong>Tick the variables you must keep the same:</strong></p>${CTL.map(([k, t, c]) => `<label class="small"><input type="checkbox" data-ctl="${k}" data-c="${c}"> ${t}</label>`).join("")}
          <div class="row"><button type="button" class="btn sm" data-pl="ctlchk">Check my controls</button></div><div class="small" data-pl="ctlfb" aria-live="polite"></div></fieldset>
        ${W ? "" : nullFs}
        <fieldset><legend>Prediction</legend>${PRED.map(([k, t]) => `<label class="small"><input type="radio" name="${u}pr" value="${k}" ${S.prediction === k ? "checked" : ""}> ${t}</label>`).join("")}<div class="small" data-pl="prfb" aria-live="polite"></div></fieldset>
        <div class="row">${nextBtn(1)}</div></div>`, { label: "Plan the investigation" });
      $$(`input[name=${u}mat]`, box).forEach((r) => r.addEventListener("change", () => { S.material = r.value; resetRun(); go(0); say(`${matName(S.material)} chosen.${S.material === "cabomba" ? "" : " The handbook recommends fresh Cabomba: see what difference your choice makes."} Any counts already taken have been cleared.`); }));
      $$(`input[name=${u}lamp]`, box).forEach((r) => r.addEventListener("change", () => { S.lamp = r.value; resetRun(); say(`${M().LAMPS[S.lamp].label} chosen. Any counts already taken have been cleared.`); }));
      q("ctlchk", box).addEventListener("click", () => { const wrong = $$("[data-ctl]", box).filter((c) => c.checked !== (c.dataset.c === "1")); S.ctlOK = !wrong.length; nav(); q("ctlfb", box).innerHTML = wrong.length ? bad(`Not quite: ${wrong.length} to change. A control variable is one that could change the rate of bubbling if it were different; the rack colour and the make of the clock cannot.`) : ok("Correct: each of these could change the rate of photosynthesis or the count, so each is kept the same."); });
      $$(`input[name=${u}nh]`, box).forEach((r) => r.addEventListener("change", () => { S.nullH = r.value; nav(); const g = NULLS.find((x) => x[0] === r.value); q("nhfb", box).innerHTML = g[2] ? ok("Yes: a null hypothesis says there is no correlation. Spearman's rank test then tells you whether you can reject it.") : bad("That is a hypothesis, not a null hypothesis. The null hypothesis states that there is no correlation."); }));
      $$(`input[name=${u}pr]`, box).forEach((r) => r.addEventListener("change", () => { S.prediction = r.value; nav(); q("prfb", box).innerHTML = r.value === "rise" ? ok("A testable prediction with a reason: more light gives more ATP and reduced NADP, until another factor limits.") : amb("You can test any prediction. Think about what light does in the light-dependent reaction; the data will show whether you were right."); }));
      wireNext(box);
    }

    // ---- 2 Set up (handbook steps 1 to 3) ----
    function setup(box) {
      const n = S.setup.length; const st = { filled: n >= 1, plant: n >= 3 ? "placed" : n >= 2 ? "top" : "none", rod: n === 2 };
      box.innerHTML = B.ix.split(fig(drawing({ d: null, lamp: false, filled: st.filled, plant: st.plant, rod: n >= 3, labels: true })) + `<p class="tiny muted mt">The tube is set up on the bench first. It is not yet in position: you place it 10 cm from the bulb in step 4.</p>`,
        `<div class="pl-panel"><fieldset><legend>Solution (step 1): fill with</legend>${[["nahco3", "1 % sodium hydrogen carbonate (handbook)"], ["water", "Water only (method error on purpose)"]].map(([k, t]) => `<label class="small"><input type="radio" name="${u}sol" value="${k}" ${S.solution === k ? "checked" : ""} ${n ? "disabled" : ""}> ${t}</label>`).join("")}</fieldset>
        <fieldset><legend>Choose the next step</legend><div class="ph-steps">${SETUP_SHOWN.map((id) => { const s = SETUP.find((x) => x.id === id); const done = S.setup.includes(id); return `<button type="button" class="btn sm${done ? " done" : ""}" data-step="${id}" ${done || n >= 3 ? "disabled" : ""}>${done ? "✓ " : ""}${s.label}</button>`; }).join("")}</div><div class="small mt" data-pl="sfb" aria-live="polite"></div></fieldset>
        <div class="row">${n >= 3 ? nextBtn(2, "Next: place the tube and count") : '<button type="button" class="btn sm" data-pl="redo">Start the set-up again</button>'}</div></div>`, { label: "Set up the boiling tube" });
      $$(`input[name=${u}sol]`, box).forEach((sol) => sol.addEventListener("change", () => { S.solution = sol.value; resetRun(); setup(box); say(S.solution === "water" ? amb("Water only chosen: a method error, so you can see its effect.") : "1 % sodium hydrogen carbonate chosen."); }));
      $$("[data-step]", box).forEach((b) => b.addEventListener("click", () => { const s = SETUP.find((x) => x.id === b.dataset.step); const fb = q("sfb", box);
        if (!s.ok) { fb.innerHTML = bad(s.why); return; }
        const want = SETUP_ORDER[S.setup.length]; if (s.id !== want) { fb.innerHTML = amb(`Not yet: first, ${SETUP.find((x) => x.id === want).label.toLowerCase()}.`); return; }
        S.setup.push(s.id); nav(); setup(box); q("sfb", box).innerHTML = ok(s.why); say(`Done: ${s.label}.`); }));
      const redo = q("redo", box); if (redo) redo.addEventListener("click", () => { resetAll(); setup(box); });
      wireNext(box);
      centreTube(); // phones: keep the tube in view after each set-up step redraws the picture
    }

    // ---- 3 Count (handbook steps 4 to 7) ----
    function rowsTable() {
      const ds = S.order; if (!ds.length) return `<p class="small muted">No counts yet.</p>`;
      const maxN = Math.max(3, ...ds.map((d) => S.rows[d].length));
      return `<table class="tbl small"><caption class="tiny muted" style="text-align:left">Simulated counts: ${esc(matName(S.material))}${S.lamp !== "filament" ? ", energy-saving bulb" : ""}${S.solution === "water" ? ", water only" : ""}</caption><thead><tr><th scope="col">Distance / cm</th>${Array.from({ length: maxN }, (_, i) => `<th scope="col">Count ${i + 1}</th>`).join("")}</tr></thead><tbody>${ds.map((d) => `<tr><td>${d}</td>${Array.from({ length: maxN }, (_, i) => { const c = S.rows[d][i]; return `<td>${c ? c.n + (c.settled ? "" : "*") : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table>${ds.some((d) => S.rows[d].some((c) => !c.settled)) ? '<p class="tiny muted">* counted without leaving the plant to settle after moving the lamp.</p>' : ""}`;
    }
    const restBubbles = () => { if (!S.run || S.d == null) return []; const r = M().rateAt(S.run, S.run.t); const n = Math.min(4, Math.round(r / 10) + (r > 0.5 ? 1 : 0)); return Array.from({ length: n }, (_, i) => ({ y: 196 - i * 26, r: 2.6 + (i % 2) })); };
    function count(box) {
      const ready = S.setup.length === 3; const placed = S.d != null; const nDist = S.order.filter((d) => S.rows[d].length).length;
      const W = wide(box); const tbl = `<div class="pl-tbl${W ? " mt" : ""}" data-pl="tbl">${rowsTable()}</div>`; const saveRow = `<div class="row">${S.saved ? '<button type="button" class="btn sm primary" data-pl="tocalc">Process this run in the Calculate tab →</button><button type="button" class="btn sm" data-pl="newrun">Start a new run (new piece of plant)</button>' : `<button type="button" class="btn sm primary" data-pl="save" ${nDist >= 5 ? "" : "disabled"}>Finish and save this run</button><span class="tiny muted">${nDist >= 5 ? `${nDist} distances counted.` : `At least 5 distances are needed for the statistical test (${nDist} so far).`}</span>`}</div>`;
      box.innerHTML = B.ix.split(fig(drawing({ d: placed ? S.d : null, lamp: placed, filled: ready, plant: ready ? "placed" : "none", bubbles: restBubbles(), clock: "00:00", dim: M().LAMPS[S.lamp].factor === 1 ? 1 : 0.45 })) + `<div class="pl-fig mt" data-pl="pv"></div>` + (W ? tbl : ""),
        `<div class="pl-panel">${ready ? "" : `<p class="small">${bad("Set up the boiling tube first (stage 2).")}</p>`}
        <fieldset ${ready ? "" : "disabled"}><legend>Position (steps 4 and 7)</legend><label class="small">Distance from the bulb <select data-pl="dist">${DIST_OPTS.map((d) => `<option value="${d}" ${(placed ? S.d : 10) === d ? "selected" : ""}>${d} cm</option>`).join("")}</select></label>
          <div class="row"><button type="button" class="btn sm" data-pl="move">${placed ? "Move the tube" : "Place the tube in the rack"}</button></div><div class="small" data-pl="dfb" aria-live="polite"></div></fieldset>
        <fieldset ${ready && placed ? "" : "disabled"}><legend>Leave, then count (steps 5 and 6)</legend>
          <div class="row"><button type="button" class="btn sm" data-pl="wait" ${S.settled ? "disabled" : ""}>${S.settled ? "Left for 5 minutes ✓" : "Leave for 5 minutes (fast-forward)"}</button></div>
          <label class="small"><input type="checkbox" data-pl="nowait" ${S.noWait ? "checked" : ""}> Method error on purpose: count without leaving the plant after moving the lamp</label>
          <div role="radiogroup" aria-label="How to count" class="small pl-modes">${[["watch", "Watch and count (1 minute; press Bubble or Space for each bubble)"], ["record", "Read the bubble record (type the count)"], ["auto", "Auto count"]].map(([k, t]) => `<label class="small"><input type="radio" name="${u}mode" value="${k}" ${S.mode === k ? "checked" : ""} ${k === "watch" && reduced() ? "disabled" : ""}> ${t}${k === "watch" && reduced() ? " (not available: reduced motion is on)" : ""}</label>`).join("")}
          <label class="small" ${S.mode === "watch" ? "" : "hidden"} data-pl="fastl"><input type="checkbox" data-pl="fast" ${S.fast ? "checked" : ""}> show 3 times faster (20 s); the count is still for 1 minute</label></div>
          <div data-pl="countui"></div></fieldset>
${W ? "" : tbl}${saveRow}</div>`, { label: "Place the tube and count the bubbles", cls: "ix-nosticky-sm" });
      const dfb = q("dfb", box);
      q("move", box).addEventListener("click", () => { const d = +q("dist", box).value;
        if (!M().allowed(d)) { dfb.innerHTML = bad(`The handbook range is 5 to 30 cm (step 7). ${d < 5 ? "Closer than 5 cm the tube would be against the lamp." : "Further than 30 cm the bubbling is too slow to count reliably."}`); return; }
        if (!placed) { if (d !== 10) { dfb.innerHTML = amb("Step 4: place the tube in the rack 10 cm from the bulb first. Other distances come later (step 7)."); return; }
          S.run = M().newRun({ seed: S.seed, material: S.material, lamp: S.lamp, solution: S.solution, d0: 10 }); S.d = 10; S.settled = false; say("Tube placed 10 cm from the bulb and the lamp switched on. Leave it for 5 minutes before counting (step 5)."); go(2, true); return; }
        if (d === S.d) { dfb.innerHTML = amb(`The tube is already ${d} cm from the bulb.`); return; }
        M().moveTo(S.run, d); S.d = d; S.settled = false; say(`Tube moved to ${d} cm. ${S.noWait ? "Method error chosen: you may count straight away." : "Leave the plant before counting again."}`); go(2, true); });
      const w = q("wait", box); if (w) w.addEventListener("click", () => { if (!S.run) return; M().wait(S.run, 300); S.settled = true; say(`Left for 5 minutes at ${S.d} cm. Session time ${fmtClock(S.run.t)}.`); go(2, true); });
      q("nowait", box).addEventListener("change", (e) => { S.noWait = e.target.checked; });
      $$(`input[name=${u}mode]`, box).forEach((r) => r.addEventListener("change", () => { S.mode = r.value; q("fastl", box).hidden = S.mode !== "watch"; drawCounter(box); }));
      q("fast", box).addEventListener("change", (e) => { S.fast = e.target.checked; });
      const sv = q("save", box); if (sv) sv.addEventListener("click", () => { const run = { ts: Date.now(), seed: S.seed, material: S.material, lamp: S.lamp, solution: S.solution, temp: S.run ? S.run.temp : null, order: S.order.slice(), rows: JSON.parse(JSON.stringify(S.rows)), nullH: S.nullH, prediction: S.prediction }; S.saved = true; onRun(run); say(ok("Run saved. Process it in the Calculate tab: 1/d², means, graph and Spearman's rank test.")); go(2, true); });
      const tc = q("tocalc", box); if (tc) tc.addEventListener("click", () => { const t = document.querySelector('[role="tab"][data-tab="calc"]'); if (t) { t.click(); t.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); } });
      const nr = q("newrun", box); if (nr) nr.addEventListener("click", () => { resetAll(); say("New run: set up a fresh boiling tube with a new piece of plant."); go(1, true); });
      drawCounter(box);
    }
    function canCount() { if (!S.run || S.d == null) return "Place the tube first."; if (!S.settled && !S.noWait) return "Leave the plant for 5 minutes before counting (step 5), or choose the method error on purpose."; if ((S.rows[S.d] || []).length >= 5) return `Five counts are enough at ${S.d} cm: move to another distance.`; return ""; }
    function commit(n, box) {
      const c = M().count(S.run); if (!S.rows[S.d]) { S.rows[S.d] = []; S.order.push(S.d); }
      S.rows[S.d].push({ n, model: c.n, settled: S.settled }); // the plant stays settled while it is not moved
      say(`Count ${S.rows[S.d].length} at ${S.d} cm recorded: ${n} bubbles in 1 minute.${n !== c.n ? ` (The record shows ${c.n}.)` : ""}`); go(2, true);
    }
    function drawCounter(box) {
      if (stop) stop(); const ui = q("countui", box), pv = q("pv", box); if (!ui) return; const why = canCount();
      if (why) { ui.innerHTML = S.run ? `<p class="small muted">${why}</p>` : ""; pv.innerHTML = ""; return; }
      const bub = M().bubbleTimes(S.run, 60); // the same bubbles M.count() will count for this window
      if (S.mode === "auto") { pv.innerHTML = ""; ui.innerHTML = `<div class="row"><button type="button" class="btn sm primary" data-pl="rec">Auto count and record</button></div>`; q("rec", box).addEventListener("click", () => commit(bub.length, box)); return; }
      if (S.mode === "record" || reduced()) { pv.innerHTML = `<div class="ix-hscroll">${record(bub, { minW: 520 })}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole record</p>`; ui.innerHTML = `<label class="small">Bubbles in 1 minute ${inp(u + "c", "4.5rem", "number of bubbles counted")}</label> <button type="button" class="btn sm primary" data-pl="rec">Record count</button>`;
        q("rec", box).addEventListener("click", () => { const c = num($("#" + u + "c", box).value); if (c == null || c < 0 || !Number.isInteger(c)) { say(bad("Type the whole number of bubbles you counted.")); return; } pv.innerHTML = `<div class="ix-hscroll">${record(bub, { marks: true, minW: 520, aria: `Bubble record with its ${bub.length} bubbles numbered.` })}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole record</p>`; setTimeout(() => commit(c, box), reduced() ? 0 : 700); }); return; }
      // watch and count in real time (or 3 times faster)
      pv.innerHTML = ""; ui.innerHTML = `<div class="row"><button type="button" class="btn sm primary" data-pl="go">Start the 1-minute count</button><button type="button" class="btn pl-big" data-pl="tap" disabled aria-label="Bubble: press for each bubble that leaves the cut end">Bubble</button><span class="small" data-pl="taps"></span></div>`;
      q("go", box).addEventListener("click", () => live(box, bub));
    }
    function live(box, bub) {
      if (S.busy) return; S.busy = true; const k = S.fast ? 3 : 1; let taps = 0, raf = 0, done = false;
      const svg = $(`#${u}app`, box), g = svg && svg.querySelector('[data-ph="bubbles"]'), clk = svg && svg.querySelector('[data-ph="clock"]'); const tc = 132 + S.d * 14;
      const tapB = q("tap", box); tapB.disabled = false; tapB.focus(); q("go", box).disabled = true; q("taps", box).textContent = "Counting… press Bubble (or Space) for each bubble.";
      const onTap = () => { if (!done) taps++; }; tapB.addEventListener("click", onTap);
      const t0 = performance.now(); say(`1-minute count started at ${S.d} cm${k > 1 ? " (shown 3 times faster)" : ""}.`);
      const tick = () => { const el = ((performance.now() - t0) / 1000) * k; // model seconds
        if (g) g.innerHTML = bub.filter((b) => b.t <= el && el - b.t < 1.6).map((b) => { const y = 205 - (el - b.t) * 66; return `<circle cx="${(tc + Math.sin(b.t * 7) * 2).toFixed(1)}" cy="${Math.max(104, y).toFixed(1)}" r="${(2.4 + 2.4 * (b.size - 0.75)).toFixed(1)}" fill="#fff" stroke="#476a85" stroke-width="1.2"/>`; }).join("");
        if (clk) clk.textContent = fmtClock(Math.min(el, 60)); if (el >= 60) return finish(); raf = requestAnimationFrame(tick); };
      function finish() { done = true; cancelAnimationFrame(raf); S.busy = false; stop = null; tapB.disabled = true; tapB.removeEventListener("click", onTap); q("go", box).disabled = false;
        q("taps", box).innerHTML = `Time! You pressed Bubble ${taps} time${taps === 1 ? "" : "s"}. <label class="small">Your count ${inp(u + "tc", "4rem", "your count", `value="${taps}"`)}</label> <button type="button" class="btn sm primary" data-pl="rec">Record count</button>`; say("The 1-minute count has ended.");
        q("rec", box).addEventListener("click", () => { const c = num($("#" + u + "tc", box).value); if (c == null || !Number.isInteger(c) || c < 0) { say(bad("Type the whole number of bubbles.")); return; } commit(c, box); }); }
      stop = () => { if (!done) { done = true; cancelAnimationFrame(raf); S.busy = false; tapB.removeEventListener("click", onTap); } stop = null; };
      raf = requestAnimationFrame(tick);
    }
    host.addEventListener("keydown", (e) => { if (e.key === " " && S.busy) { const t = q("tap"); if (t && !t.disabled && document.activeElement !== t) { e.preventDefault(); t.click(); } } });
    go(0);
    return S;
  }

  // ======================= Sim tab =======================
  function sim(host, n) {
    host.innerHTML = `<div data-pl="bench"></div>
      <h3 class="mt">Saved runs</h3><p class="small muted">Each saved run holds the simulated counts at each distance. The Calculate tab processes them.</p>
      <div data-pl="runs" style="overflow-x:auto"></div><div class="row mt"><button class="btn sm" data-pl="clear">Clear saved runs</button></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    const table = () => { if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", table); return; }
      $('[data-pl="runs"]', host).innerHTML = runs.length ? `<table class="tbl small"><thead><tr><th scope="col">#</th><th scope="col">Run</th><th scope="col">Bubbles counted in 1 minute at each distance</th></tr></thead><tbody>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(runLabel(r, i))}</td><td>${statsOf(r.rows).rows.map((x) => `${x.d} cm: ${x.counts.join(", ")}`).join("; ")}</td></tr>`).join("")}</tbody></table>` : '<p class="muted small">No runs saved yet.</p>'; };
    const S = bench($('[data-pl="bench"]', host), n, (r) => { runs.push(r); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    B.labSims.photo._state = S;
    $('[data-pl="clear"]', host).addEventListener("click", () => { if (confirm("Clear all saved runs for this practical?")) { runs.length = 0; B.store.save(); table(); document.dispatchEvent(new Event("labrun")); } });
    table(); host.dataset.mounted = "1"; document.addEventListener("labrun", table);
  }

  // ======================= Calculate tab: process, graph, Spearman's rank =======================
  function rp7Graph(st, o = {}) {
    const byD = o.axis === "d"; const ymax = Math.max(10, Math.ceil((Math.max(...st.rows.flatMap((r) => r.counts)) + 3) / 10) * 10);
    const pts = st.rows.map((r) => ({ x: byD ? r.d : r.inv, y: r.mean }));
    const err = o.range ? st.rows.map((r) => ({ x: byD ? r.d : r.inv, lo: Math.min(...r.counts), hi: Math.max(...r.counts) })) : [];
    const x = byD ? { min: 0, max: 30, ticks: G().ticks(0, 30, 5), label: "distance from the bulb, d / cm" } : { min: 0, max: 0.04, ticks: G().ticks(0, 0.04, 0.01), label: "light intensity, 1/d² / cm⁻²", fmt: (v) => (v ? v.toFixed(2) : "0") };
    const pd = pts.slice().sort((a, b) => a.x - b.x);
    return G().graph({ w: 560, h: 330, minW: 480, x, y: { min: 0, max: ymax, ticks: G().ticks(0, ymax, ymax > 40 ? 10 : 5), label: "mean bubbles per minute" }, series: [{ pts: pd, color: "#1d5f8a", mark: "o", line: !!o.join, err, name: "" }], key: false,
      aria: `Graph of mean bubbles per minute against ${byD ? "distance from the bulb" : "light intensity (1/d²)"} for ${o.label || "the run"}: ${st.rows.map((r) => `${r.d} cm, ${f1(r.mean)}`).join("; ")}.` });
  }
  function calc(host, n) {
    ensureStyle(); const u = uidOf(); let sel = null; const view = { axis: "inv", range: true, join: false };
    // A data set's means are shown in step 4 (and its 10 cm mean in step 5) only once step 2 is all correct or its answers
    // have been shown; a run's rs and significance appear in step 5 only once step 4 is checked correct for that run.
    const doneProc = new Set(), doneSp = new Set(); const dkey = (c) => c.id + ":" + c.ds.rows.length;
    function list() { const runs = B.store.get().labRuns[n] || []; return [...runs.map((r, i) => ({ id: "r" + i, label: runLabel(r, i), ds: r })), { id: "spec", label: "Specimen data set: fresh Cabomba (checked answers)", ds: specimen() }]; }
    const current = () => { const L = list(); return L.find((x) => x.id === sel) || L[L.length > 1 ? L.length - 2 : 0]; };
    function render() {
      if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", render); return; } host.dataset.mounted = "1";
      const T = P7().sets; const SP = T.proc("spec"); const c = current(); const st = statsOf(c.ds.rows);
      const runsHTML = () => { const runs = B.store.get().labRuns[n] || []; return `<h3>5 Your runs</h3>${runs.length ? `<div class="pl-tbl"><table class="tbl small"><thead><tr><th scope="col">Run</th><th scope="col">Distances</th><th scope="col">Mean at 10 cm</th><th scope="col">rs</th><th scope="col">Significant at P = 0.05?</th></tr></thead><tbody>${runs.map((r, i) => { const s = statsOf(r.rows); const r10 = s.rows.find((x) => x.d === 10); const k = "r" + i + ":" + r.rows.length; const p2 = doneProc.has(k), p4 = doneSp.has(k); return `<tr><td>${esc(runLabel(r, i))}</td><td>${s.n}</td><td>${!r10 ? "–" : p2 ? f1(r10.mean) : "after step 2"}</td><td>${!s.sp ? "–" : p4 ? s.sp.rs.toFixed(3) : "after step 4"}</td><td>${!(s.sp && s.crit != null) ? "–" : p4 ? (Math.abs(s.sp.rs) >= s.crit - 1e-9 ? "yes" : "no") : "after step 4"}</td></tr>`; }).join("")}</tbody></table></div><p class="tiny muted">Compare runs with different plants, lamps or method errors. A run's values appear here once you have processed it correctly in steps 2 and 4.</p>` : `<p class="small muted">No runs yet: complete a run in the Virtual experiment tab, or use the specimen data set above.</p>`}`; };
      host.innerHTML = `<div class="card mb"><h3>1 The specimen data set (checked answers)</h3><p class="small muted">Simulated counts for fresh Cabomba with the trialled lamp. These are the answers used in the questions on this page.</p>${T.dataTable("spec", { inv: true, caption: "Simulated data: fresh Cabomba, 1 % sodium hydrogen carbonate" })}${T.rankTable("spec")}
          <p class="small">n = ${SP.n}; rs = 1 − (6 × ${SP.sp.sumD2}) ÷ (${SP.n} × ${SP.n * SP.n - 1}) = ${SP.sp.rs.toFixed(3)}. Critical value for ${SP.n} pairs at P = 0.05: ${SP.crit}. rs ≥ critical value, so the null hypothesis of no correlation is rejected.</p></div>
        <div class="card mb"><h3>2 Process a run (steps 8 and 9)</h3><label class="small">Data set <select data-c="ds">${list().map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
          <p class="small">For each distance, calculate the light intensity (1/d², 3 significant figures) and the mean number of bubbles per minute (1 decimal place).</p>
          <div class="pl-tbl"><table class="tbl small"><thead><tr><th scope="col">d / cm</th><th scope="col">Counts</th><th scope="col">1/d² / cm⁻²</th><th scope="col">Mean bubbles per minute</th></tr></thead><tbody>${st.rows.map((r, i) => `<tr><td>${r.d}</td><td>${r.counts.join(", ")}</td><td>${inp(`${u}i${i}`, "5.5rem", `light intensity at ${r.d} cm`)}</td><td>${inp(`${u}m${i}`, "4.6rem", `mean at ${r.d} cm`)}</td></tr>`).join("")}</tbody></table></div>
          <div class="row"><button type="button" class="btn sm" data-c="pchk">Check</button><button type="button" class="btn sm" data-c="pshow">Show the answers</button></div><div class="small" data-c="pfb" aria-live="polite"></div></div>
        <div class="card mb"><h3>3 Graph</h3><div class="row small"><label><input type="radio" name="${u}ax" value="inv" ${view.axis === "inv" ? "checked" : ""}> against light intensity (1/d²)</label><label><input type="radio" name="${u}ax" value="d" ${view.axis === "d" ? "checked" : ""}> against distance</label><label><input type="checkbox" data-c="range" ${view.range ? "checked" : ""}> range of repeats</label><label><input type="checkbox" data-c="join" ${view.join ? "checked" : ""}> join the points</label></div>
          <div class="pl-fig ix-hscroll" style="max-width:640px">${rp7Graph(st, { ...view, label: c.label })}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>
          <p class="tiny muted">The rate rises steeply at low light intensities (far from the lamp) and levels off close to the lamp, where another factor limits. Against distance the curve falls, but distance is not the measure of light intensity.</p></div>
        <div class="card mb"><h3>4 Spearman's rank correlation test (step 10)</h3>${st.n < 5 ? `<p class="small muted">At least 5 distances are needed.</p>` : `
          <p class="small">Null hypothesis: there is no correlation between light intensity and the rate of photosynthesis. Rank each column (1 = lowest; tied values share the mean of their ranks), find D² for each row, then rs = 1 − 6ΣD² ÷ (n(n² − 1)).</p><p class="tiny muted" data-c="meannote" ${doneProc.has(dkey(c)) ? "hidden" : ""}>The means appear here when step 2 is all correct, or after Show the answers.</p>
          <div class="pl-tbl"><table class="tbl small"><thead><tr><th scope="col">d / cm</th><th scope="col">1/d²</th><th scope="col">Rank of 1/d²</th><th scope="col">Mean</th><th scope="col">Rank of mean</th><th scope="col">D²</th></tr></thead><tbody>${st.rows.map((r, i) => `<tr><td>${r.d}</td><td>${sf3(r.inv)}</td><td>${inp(`${u}rx${i}`, "3.6rem", `rank of light intensity at ${r.d} cm`)}</td><td data-c="mean${i}">${doneProc.has(dkey(c)) ? f1(r.mean) : "?"}</td><td>${inp(`${u}ry${i}`, "3.6rem", `rank of mean at ${r.d} cm`)}</td><td>${inp(`${u}d${i}`, "3.6rem", `D squared at ${r.d} cm`)}</td></tr>`).join("")}</tbody></table></div>
          <div class="row small"><label>ΣD² ${inp(u + "sum", "4.5rem", "sum of D squared")}</label><label>rs (3 d.p.) ${inp(u + "rs", "5rem", "Spearman rank correlation coefficient")}</label></div>
          <p class="small">Number of pairs n = ${st.n}; critical value at P = 0.05: <strong>${st.crit != null ? st.crit.toFixed(3) : "outside the table (5 to 10 pairs)"}</strong>.</p>
          <fieldset class="small pl-modes"><legend>Conclusion</legend><label><input type="radio" name="${u}cn" value="rej"> rs (ignoring its sign) is at or above the critical value: reject the null hypothesis; the correlation is significant (P ≤ 0.05)</label><label><input type="radio" name="${u}cn" value="acc"> rs (ignoring its sign) is below the critical value: the null hypothesis cannot be rejected</label></fieldset>
          <div class="row"><button type="button" class="btn sm primary" data-c="schk">Check</button></div><div class="small" data-c="sfb" aria-live="polite"></div>`}</div>
        <div class="card" data-c="runs">${runsHTML()}</div>`;
      const g = (id) => num(($("#" + id, host) || {}).value);
      // step 2 done: fill the step 4 Mean cells in place (a re-render would clear the student's inputs)
      const reveal = () => { doneProc.add(dkey(c)); st.rows.forEach((r, i) => { const td = $(`[data-c="mean${i}"]`, host); if (td) td.textContent = f1(r.mean); }); const nt = $('[data-c="meannote"]', host); if (nt) nt.hidden = true; const rc = $('[data-c="runs"]', host); if (rc) rc.innerHTML = runsHTML(); };
      $('[data-c="ds"]', host).addEventListener("change", (e) => { sel = e.target.value; render(); });
      $$(`input[name=${u}ax]`, host).forEach((r) => r.addEventListener("change", () => { view.axis = r.value; render(); }));
      $('[data-c="range"]', host).addEventListener("change", (e) => { view.range = e.target.checked; render(); });
      $('[data-c="join"]', host).addEventListener("change", (e) => { view.join = e.target.checked; render(); });
      $('[data-c="pchk"]', host).addEventListener("click", () => { let wrong = 0, empty = 0; st.rows.forEach((r, i) => { const a = g(`${u}i${i}`), m = g(`${u}m${i}`);
          const eI = $(`#${u}i${i}`, host), eM = $(`#${u}m${i}`, host);
          if (a == null) empty++; else { const good = Math.abs(a - r.inv) <= 0.006 * r.inv; if (!good) wrong++; eI.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; eI.setAttribute("aria-invalid", String(!good)); }
          if (m == null) empty++; else { const good = Math.abs(m - r.mean) <= 0.051; if (!good) wrong++; eM.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; eM.setAttribute("aria-invalid", String(!good)); } });
        if (!wrong && !empty) reveal(); $('[data-c="pfb"]', host).innerHTML = wrong ? bad(`${wrong} value${wrong === 1 ? " is" : "s are"} wrong (red border). 1/d² = 1 ÷ (d × d); the mean is the total of the counts ÷ the number of counts.`) : empty ? amb(`Correct so far; ${empty} still to fill in.`) : ok("✓ All values correct."); });
      $('[data-c="pshow"]', host).addEventListener("click", () => { reveal(); $('[data-c="pfb"]', host).innerHTML = st.rows.map((r) => `${r.d} cm: 1 ÷ ${r.d * r.d} = ${sf3(r.inv)}; mean ${r.counts.join(" + ")} = ${r.counts.reduce((a, b) => a + b, 0)} ÷ ${r.counts.length} = ${f1(r.mean)}`).join("<br>"); });
      const sc = $('[data-c="schk"]', host); if (sc) sc.addEventListener("click", () => { const out = []; let rkWrong = 0;
        st.rows.forEach((r, i) => { const a = g(`${u}rx${i}`), b = g(`${u}ry${i}`), d2 = g(`${u}d${i}`); if (a != null && Math.abs(a - st.sp.rx[i]) > 1e-9) rkWrong++; if (b != null && Math.abs(b - st.sp.ry[i]) > 1e-9) rkWrong++; if (d2 != null && Math.abs(d2 - st.sp.d2[i]) > 1e-9) rkWrong++; });
        const any = st.rows.some((r, i) => [`${u}rx${i}`, `${u}ry${i}`, `${u}d${i}`].some((id) => g(id) != null)); if (any) out.push(rkWrong ? bad(`${rkWrong} rank or D² value${rkWrong === 1 ? " is" : "s are"} wrong. Rank each column separately, 1 for the lowest value; equal values share the mean of their ranks.`) : ok("✓ Ranks and D² values entered are correct.")); else out.push(amb("Fill in the ranks and D² values, then check."));
        const s = g(u + "sum"); if (s != null) out.push(Math.abs(s - st.sp.sumD2) < 1e-6 ? ok(`✓ ΣD² = ${st.sp.sumD2}.`) : bad("ΣD²: add up the D² column."));
        const r = g(u + "rs"); const rsOK = r != null && Math.abs(r - st.sp.rs) <= 0.0015; if (r != null) out.push(rsOK ? ok(`✓ rs = 1 − (6 × ${st.sp.sumD2}) ÷ (${st.n} × ${st.n * st.n - 1}) = ${st.sp.rs.toFixed(3)}.`) : bad(`rs = 1 − 6ΣD² ÷ (n(n² − 1)) with n = ${st.n}.`));
        const cn = ($(`input[name=${u}cn]:checked`, host) || {}).value; let cnOK = false; if (cn && st.crit != null && !rsOK) out.push(amb("The conclusion is checked once your rs is correct.")); else if (cn && st.crit != null) { const sig = Math.abs(st.sp.rs) >= st.crit - 1e-9; cnOK = (cn === "rej") === sig; const neg = st.sp.rs < 0; out.push(cnOK ? ok(sig ? `✓ ${neg ? `The size of rs, ${Math.abs(st.sp.rs).toFixed(3)},` : st.sp.rs.toFixed(3)} ≥ ${st.crit.toFixed(3)}: reject the null hypothesis. There is a significant ${neg ? "negative" : "positive"} correlation; the probability that it is due to chance is 5 % or less.` : `✓ ${neg ? `The size of rs, ${Math.abs(st.sp.rs).toFixed(3)},` : st.sp.rs.toFixed(3)} < ${st.crit.toFixed(3)}: the null hypothesis cannot be rejected at P = 0.05. This does not prove there is no correlation: more distances and repeats would help.`) : bad(`Compare the size of your rs (ignoring its sign) with the critical value ${st.crit.toFixed(3)}.`)); }
        if (rsOK && cnOK && c.id !== "spec" && !doneSp.has(dkey(c))) { doneSp.add(dkey(c)); const rc = $('[data-c="runs"]', host); if (rc) rc.innerHTML = runsHTML(); }
        $('[data-c="sfb"]', host).innerHTML = out.join("<br>"); });
    }
    render(); document.addEventListener("labrun", render);
  }

  B.labSims.photo = { sim, calc, STAGES, specimen, statsOf, _bench: bench, _record: record, _graph: rp7Graph };
})(window.BIO);
