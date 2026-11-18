// Interactives for 3.3.5.1 Principles of nutrient cycling and 3.3.5.2 The carbon cycle (Phase 5 Batch 3, author B1).
// Kinds: nutrientRecycler, decomposerChallenge (3.3.5.1); carbonCycleExplorer, co2Explorer, greenhouseExplorer,
// climateInvestigator (3.3.5.2). Models, data, sources and test cases: B.cyclesModel (data/content/_cycles-art.js);
// drawings: B.cyclesArt. Students see only a one-line "Simplified model" note or the data source.
// No calculated answer is shown before the student has answered: the carbon budget change (cc3), the 1750 greenhouse gas
// estimates (gh4) and the two locked Spearman tests (cd1, cd4) stay hidden until their question has been answered
// (B.cyclesModel.answered). The CO2 explorer reads single values only; differences are left to the student.
// Accessibility: native buttons, selects and radios; arrows and stores in the drawings are focusable (Enter or Space);
// the CO2 graph takes the arrow keys; readouts are polite live regions; nothing animates, so reduced motion needs no
// special case. Layout: B.ix.split.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.cyclesModel, A = () => B.cyclesArt;
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const qBlock = (spec) => ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
  const renderQs = (spec, host, onAnswer) => { const into = $("[data-qs]", host); if (!into) return; (spec.questions || []).forEach((q) => into.append(B.questions.render(q, { onAnswer: () => setTimeout(onAnswer, 0) }))); };
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(start); return show; };
  const activate = (el, fn) => { el.addEventListener("click", fn); el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } }); };
  // On a phone a detailed drawing keeps a minimum width (labels stay readable) and scrolls sideways inside its own box.
  const phone = () => typeof innerWidth !== "undefined" && innerWidth < 600;
  const SWIPE = `<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
  const fig = (attrs, minw = 520) => (minw ? `<div class="figure"><div class="fig-view${phone() ? " ix-hscroll" : ""}" data-minw="${minw}" ${attrs}></div></div>${phone() ? SWIPE : ""}` : `<div class="figure"><div class="fig-view ix-read-off" ${attrs}></div></div>`);
  const phoneFit = (host) => { if (!phone()) return; $$("[data-minw]", host).forEach((v) => { const set = () => { const g = v.querySelector("svg"); if (g && g.style.minWidth !== v.dataset.minw + "px") { g.style.minWidth = v.dataset.minw + "px"; g.style.width = v.dataset.minw + "px"; } }; set(); new MutationObserver(set).observe(v, { childList: true }); }); };
  const f2 = (x) => x.toFixed(2);
  // an empty readout is hidden (no empty grey bar); it reappears as soon as it has content
  const autoHide = (host) => $$(".ix-readout", host).forEach((r) => { const set = () => { r.hidden = !r.innerHTML.trim(); }; set(); new MutationObserver(set).observe(r, { childList: true, characterData: true, subtree: true }); });

  // ===================================== Nutrient Recycling Explorer (3.3.5.1) =====================================
  B.interactives.nutrientRecycler = function (spec, host) {
    const R = M().recycle; const LAYERS = ["C", "N", "P", "E"]; let layer = "N", step = -1;
    host.innerHTML = head(spec, "follow an atom, then the energy") + B.ix.split(`<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose what to follow"></div>${fig('data-r="pic"', 560)}`, `
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="prev">← Back</button><button type="button" class="btn sm primary" data-a="next">Next step →</button><button type="button" class="btn sm" data-a="restart">Start again</button></div>
      <div class="ix-readout" data-r="info" aria-live="polite"></div>`, { label: "Nutrient Recycling Explorer controls", cls: "ix-wide-stage" }) + `<p class="tiny muted mt">Simplified model: one food chain in a woodland. Real ecosystems have food webs; nitrogen fixation, nitrification and denitrification are in 3.3.5.3.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host);
    const route = () => R.route(layer);
    const intro = () => layer === "E" ? `<strong>Energy.</strong> Press <em>Next step</em> to follow energy from the Sun, or click any arrow. Watch where it ends up.` : `<strong>${R.ELEMENTS[layer].name}.</strong> In living organisms it is found in ${esc(R.ELEMENTS[layer].organic)}. Press <em>Next step</em> to follow one atom, or click any arrow.`;
    const caption = (e, k, n) => `<div class="tiny muted">${k !== null ? `Step ${k + 1} of ${n}` : "Selected arrow"}</div><strong>${esc(e[2][0].toUpperCase() + e[2].slice(1))}</strong>: from ${esc(R.NODES[e[0]])} to ${esc(R.NODES[e[1]])}.<br>${esc(e[3])}`;
    const draw = (hi) => { pic.innerHTML = A().recycler({ layer, hi }); $$("[data-edge]", pic).forEach((g) => activate(g, () => pick(g.dataset.edge))); };
    const end = () => layer === "E" ? `<div class="feedback neutral mt"><strong>Lost as heat.</strong> Energy is not recycled: it leaves every organism as heat, and new light energy is needed all the time.</div>` : `<div class="feedback ok mt"><strong>Back where it started.</strong> The same ${layer === "C" ? "carbon" : layer === "N" ? "nitrogen" : "phosphorus"} atom can be taken up and used again.</div>`;
    const render = () => { const r = route(); if (step < 0) { info.innerHTML = intro(); draw(null); return; } const e = r[step]; info.innerHTML = caption(e, step, r.length) + (step === r.length - 1 ? end() : ""); draw(`${e[0]}>${e[1]}`); };
    const pick = (key) => { const [a, b] = key.split(">"); const e = R.edge(layer, a, b); const k = route().findIndex((x) => x[0] === a && x[1] === b); if (k >= 0) { step = k; render(); return; } step = -1; info.innerHTML = caption(e, null, 0); draw(key); };
    $("[data-a=next]", host).addEventListener("click", () => { step = Math.min(step + 1, route().length - 1); render(); });
    $("[data-a=prev]", host).addEventListener("click", () => { step = Math.max(step - 1, -1); render(); });
    $("[data-a=restart]", host).addEventListener("click", () => { step = -1; render(); });
    tabs($("[data-r=tabs]", host), ["Carbon", "Nitrogen", "Phosphorus", "Energy"], (i) => { layer = LAYERS[i]; step = -1; render(); }, 1);
    renderQs(spec, host, () => {});
    autoHide(host); phoneFit(host);
    host._nr = { layer: (l) => $$("[data-r=tabs] button", host)[LAYERS.indexOf(l)].click(), next: () => $("[data-a=next]", host).click(), state: () => ({ layer, step }) };
  };

  // ===================================== Decomposer Challenge (3.3.5.1) =====================================
  B.interactives.decomposerChallenge = function (spec, host) {
    const Lm = M().litter; const COLS = ["#1f66b0", "#b0451c", "#2f7d32", "#7a3fa0"]; const DASH = ["", "8 4", "3 3", "10 3 2 3"]; let bags = [];
    const tOpts = Lm.TEMPS.map((t) => `<option value="${t}"${t === 15 ? " selected" : ""}>${t} °C</option>`).join("");
    const wOpts = Object.entries(Lm.WATER).map(([k, w]) => `<option value="${k}">${w.name}</option>`).join("");
    host.innerHTML = head(spec, "design an investigation") + B.ix.split(`${fig('data-r="pic"', 0)}<ul class="small" data-r="key" style="list-style:none;padding:0;margin:.4rem 0 0;display:grid;gap:.2rem;justify-items:start;width:auto"></ul>`, `
      <p class="small" style="margin:0 0 .3rem"><strong>Set up a bag</strong> (5.00 g dry mass of leaves).</p>
      <div class="row" style="gap:.5rem;flex-wrap:wrap"><label class="small">Temperature <select data-r="t">${tOpts}</select></label><label class="small">Soil <select data-r="w">${wOpts}</select></label></div>
      <label class="small" style="display:block;margin:.3rem 0"><input type="checkbox" data-r="ster"> Control: leaves and soil sterilised by heating</label>
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="add">Bury this bag</button><button type="button" class="btn sm" data-a="clear">Remove all bags</button></div>
      <div class="ix-readout" data-r="info" aria-live="polite"></div>
      <div data-r="tbl"></div>`, { label: "Decomposer Challenge controls" }) + `<p class="tiny muted mt">Simplified model with hypothetical results for leaves of a fast-decomposing species such as alder: each fine-mesh bag of leaves is buried in a tray of soil in an incubator; bags are dug up, dried to constant mass and weighed. Conditions stay constant; soil animals, leaf type and enzyme denaturation above 30 °C are not modelled.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), tbl = $("[data-r=tbl]", host), key = $("[data-r=key]", host);
    const name = (b) => `${b.ster ? "Control (sterilised), " : ""}${b.T} °C, ${Lm.WATER[b.w].name.toLowerCase()}`;
    const draw = () => { const ts = Array.from({ length: 25 }, (_, i) => i);
      const c = A().chart({ W: 600, H: phone() ? 470 : 330, fs: phone() ? 25 : 14, x: [0, 24], y: [0, 100], xTicks: [0, 4, 8, 12, 16, 20, 24].map((v) => [v, String(v)]), yTicks: [0, 20, 40, 60, 80, 100], xLabel: "Time / weeks", yLabel: "Dry mass remaining / %",
        series: bags.map((b, i) => ({ pts: ts.map((t) => [t, Lm.pct(b.T, b.w, b.ster, t)]), col: COLS[i], dash: DASH[i], w: 3 })), aria: bags.length ? "Dry mass of leaves remaining against time for " + bags.map(name).join("; ") : "Empty graph: bury a bag to start" });
      pic.innerHTML = c.svg;
      key.innerHTML = bags.map((b, i) => `<li style="display:flex;gap:.4rem;align-items:center;justify-content:flex-start"><svg width="34" height="10" aria-hidden="true"><line x1="0" y1="5" x2="34" y2="5" stroke="${COLS[i]}" stroke-width="3" ${DASH[i] ? `stroke-dasharray="${DASH[i]}"` : ""}/></svg>Bag ${i + 1}: ${esc(name(b))}</li>`).join("");
      tbl.innerHTML = bags.length ? `<table class="tbl small mt"><thead><tr><th>Bag</th><th>Dry mass after 12 weeks / g</th><th>after 24 weeks / g</th></tr></thead><tbody>${bags.map((b, i) => `<tr><td>${i + 1}</td><td>${f2(Lm.grams(b.T, b.w, b.ster, 12))}</td><td>${f2(Lm.grams(b.T, b.w, b.ster, 24))}</td></tr>`).join("")}</tbody></table>` : ""; };
    $("[data-a=add]", host).addEventListener("click", () => { const b = { T: +$("[data-r=t]", host).value, w: $("[data-r=w]", host).value, ster: $("[data-r=ster]", host).checked };
      if (bags.some((x) => x.T === b.T && x.w === b.w && x.ster === b.ster)) { info.innerHTML = "You have already buried a bag like this one. Change one variable."; return; }
      if (bags.length >= 4) { info.innerHTML = "Up to four bags at a time. Remove the bags to start a new comparison."; return; }
      bags.push(b); info.innerHTML = `Bag ${bags.length} buried: ${esc(name(b))}. ${bags.length === 1 ? "Now bury a second bag that differs in one variable only." : "Compare the lines: which variable did you change?"}`; draw(); });
    $("[data-a=clear]", host).addEventListener("click", () => { bags = []; info.innerHTML = "Bags removed."; draw(); });
    info.innerHTML = "Challenge: find out how temperature, and then oxygen, affect how fast decomposers break down leaves. Change one variable at a time, and include a control."; draw();
    renderQs(spec, host, () => {});
    autoHide(host); phoneFit(host);
    host._dc = { add: (T, w, ster) => { $("[data-r=t]", host).value = String(T); $("[data-r=w]", host).value = w; $("[data-r=ster]", host).checked = !!ster; $("[data-a=add]", host).click(); }, bags: () => bags.slice() };
  };

  // ===================================== Carbon Cycle Explorer (3.3.5.2) =====================================
  B.interactives.carbonCycleExplorer = function (spec, host) {
    const C = M().carbon; let mode = 0, sel = null; const cu = Math.random().toString(36).slice(2, 7);
    host.innerHTML = head(spec, "stores and fluxes") + B.ix.split(`<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose a step"></div>${fig('data-r="pic"', 580)}`, `<div data-r="panel"></div><div class="ix-readout" data-r="info" aria-live="polite"></div>`, { label: "Carbon Cycle Explorer controls", cls: "ix-wide-stage" }) + `<p class="tiny muted mt">Simplified model: values are rounded estimates with uncertainties; arrows are not drawn to scale. 1 GtC = 1 billion tonnes of carbon. Sources: Global Carbon Budget 2024 (Friedlingstein et al., 2025); IPCC AR6 (2021) via Schmittner, <em>Introduction to Climate Science</em>; checked 17 November 2026.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), panel = $("[data-r=panel]", host);
    const budgetOpen = () => M().answered(M().LOCKS.budget);
    const fluxValue = (k) => { const f = C.FLUXES[k]; return f.value; };
    const draw = () => { pic.innerHTML = A().carbonCycle({ human: mode === 2, sel, atmLine: budgetOpen() ? "+5.9 GtC in 2023" : "change in 2023: ?" });
      $$("[data-store]", pic).forEach((g) => activate(g, () => { sel = "s:" + g.dataset.store; show(); }));
      $$("[data-flux]", pic).forEach((g) => activate(g, () => { sel = "f:" + g.dataset.flux; show(); })); };
    const show = () => { draw(); if (!sel) return; const [t, k] = sel.split(":");
      if (t === "s") { const s = C.STORES[k]; info.innerHTML = `<strong>Store: ${esc(s.name)}</strong> (an amount, in GtC)<br>${esc(s.what)}.<br>Carbon: ${esc(s.value)}.${s.src ? `<br><span class="tiny muted">Source: ${esc(s.src)}.</span>` : ""}`; }
      else { const f = C.FLUXES[k]; const v = fluxValue(k); info.innerHTML = `<strong>Flux: ${esc(f.name)}</strong> (a rate of transfer, in GtC per year)<br>${esc(f.what)}${v ? `<br>Rate: ${esc(v)}.` : ""}${f.human ? `<br><span class="tiny">Human activity is involved in this flux.</span>` : ""}`; } };
    const sortPanel = () => { panel.innerHTML = `<p class="small" style="margin:0 0 .3rem"><strong>Step 1.</strong> Is each one a store (an amount of carbon) or a flux (a transfer per year)?</p>
      <div data-r="sort" style="display:grid;grid-template-columns:1fr auto 1.1rem;gap:.15rem .4rem;align-items:center">${C.SORT.map(([t], i) => `<span class="tiny" id="cs${cu}-${i}">${esc(t)}</span><select data-i="${i}" aria-labelledby="cs${cu}-${i}" style="font-size:.8rem;padding:.1rem .2rem"><option value="">?</option><option value="store">store</option><option value="flux">flux</option></select><span data-m="${i}" aria-hidden="true"></span>`).join("")}</div>
      <button type="button" class="btn sm primary mt" data-a="sortchk">Check</button>`;
      $("[data-a=sortchk]", panel).addEventListener("click", () => { const sels = $$("[data-r=sort] select", panel); if (sels.some((s) => !s.value)) { info.innerHTML = "Choose store or flux for every item first."; return; }
        let n = 0; sels.forEach((s) => { const ok = s.value === C.SORT[+s.dataset.i][1]; if (ok) n++; $(`[data-m="${s.dataset.i}"]`, panel).innerHTML = ok ? `<span style="color:#2f7d32;font-weight:700">✓</span>` : `<span style="color:#b0451c;font-weight:700">✗</span>`; });
        info.innerHTML = `<div class="feedback ${n === sels.length ? "ok" : "neutral"}"><strong>${n} of ${sels.length} correct.</strong> A store is measured in GtC; a flux in GtC per year. In the drawing, boxes are stores and arrows are fluxes.</div>`; }); };
    const humanPanel = () => { const b = C.BUDGET2023; panel.innerHTML = `<p class="small" style="margin:0 0 .3rem"><strong>Step 3. Human activity in 2023</strong> (Global Carbon Budget 2024), GtC per year:</p>
      <table class="tbl small"><tbody><tr><td>Combustion of fossil fuels (and cement)</td><td>+${b.fossil}</td></tr><tr><td>Deforestation and land-use change</td><td>+${b.luc.toFixed(1)}</td></tr><tr><td>Net uptake by the oceans</td><td>−${b.ocean}</td></tr><tr><td>Net uptake by land plants</td><td>−${b.land}</td></tr><tr><td><strong>Change in the atmosphere</strong></td><td>${budgetOpen() ? `<strong>+${b.atm}</strong>` : "answer question 3 to see it"}</td></tr></tbody></table>`; };
    tabs($("[data-r=tabs]", host), ["1. Sort", "2. Explore", "3. Human activity"], (i) => { mode = i; sel = null;
      if (i === 0) { sortPanel(); info.innerHTML = "Sort the ten items, then explore the drawing."; }
      else if (i === 1) { panel.innerHTML = `<p class="small" style="margin:0"><strong>Step 2.</strong> Click or tab to any box (store) or arrow (flux) in the drawing.</p>`; info.innerHTML = "Boxes are stores, measured in GtC. Arrows are fluxes, measured in GtC per year."; }
      else { humanPanel(); info.innerHTML = "Orange arrows: human emissions (combustion, deforestation) and the two sinks that take up part of them (oceans, land plants)."; }
      draw(); });
    renderQs(spec, host, () => { if (mode === 2) humanPanel(); draw(); });
    autoHide(host); phoneFit(host);
    host._cc = { step: (i) => $$("[data-r=tabs] button", host)[i].click(), select: (s) => { sel = s; show(); } };
  };

  // ===================================== Atmospheric CO2 Data Explorer (3.3.5.2) =====================================
  B.interactives.co2Explorer = function (spec, host) {
    const D = M().co2; let view = 0, idx = 0, marks = [], trend = false;
    const MON = D.monthly(); const ANN = D.ANNUAL;
    const SRC = `${esc(D.SITE)}. CO2 mole fraction in dry air, ppm. Values as published by NOAA, checked 17 November 2026.`;
    host.innerHTML = head(spec, "real data") + B.ix.split(`<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose a view"></div>${fig('data-r="pic"', 0)}<p class="tiny muted" data-r="src" style="margin:.3rem 0 0"></p>`, `
      <p class="small" style="margin:0">Move along the line with the arrow keys (click the graph first) or by pointing.</p>
      <div class="ix-readout" data-r="read" aria-live="polite"></div>
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="mark">Mark this point</button><button type="button" class="btn sm" data-a="unmark">Clear marks</button></div>
      <label class="small" data-r="tr" style="display:block;margin-top:.3rem"><input type="checkbox" data-r="trend"> Show the trend with the seasonal cycle removed</label>
      <div class="ix-readout" data-r="info" aria-live="polite"></div>`, { label: "CO2 Data Explorer controls", cls: "ix-wide-stage" }) + qBlock(spec);
    const pic = $("[data-r=pic]", host), read = $("[data-r=read]", host), info = $("[data-r=info]", host);
    const pts = () => (view === 0 ? MON.map((p) => [p.t, p.v]) : ANN.map((p) => [p[0], p[1]]));
    const label = (i) => (view === 0 ? `${D.MONTHS[MON[i].m]} ${MON[i].y}` : String(ANN[i][0]));
    const draw = () => { const p = pts(); let c;
      if (view === 0) c = A().chart({ W: 640, H: phone() ? 480 : 340, fs: phone() ? 26 : 14, x: [2017, 2022], y: [402, 420], xTicks: [2017, 2018, 2019, 2020, 2021, 2022].map((v) => [v, String(v)]), yTicks: [402, 405, 408, 411, 414, 417, 420], xLabel: "Year (ticks at 1 January)", yLabel: "CO2 concentration / ppm", yBreak: true, focus: true,
        series: [{ pts: p, col: "#1f66b0", w: 2.4, dots: true, r: 3 }, ...(trend ? [{ pts: MON.map((q) => [q.t, q.d]), col: "#a3620f", w: 2.4, dash: "7 4" }] : [])], cursor: p[idx], marks: marks.map((i) => p[i]), aria: "Monthly mean CO2 at Mauna Loa, January 2017 to December 2021, rising each year with a peak every May and a low every September or October" });
      else c = A().chart({ W: 640, H: phone() ? 480 : 340, fs: phone() ? 26 : 14, x: [1955, 2025], y: [300, 430], xTicks: [1960, 1970, 1980, 1990, 2000, 2010, 2020].map((v) => [v, String(v)]), yTicks: [300, 320, 340, 360, 380, 400, 420], xLabel: "Year", yLabel: "CO2 concentration / ppm", yBreak: true, focus: true,
        series: [{ pts: p, col: "#1f66b0", w: 2.4, dots: true, r: 4 }], cursor: p[idx], marks: marks.map((i) => p[i]), aria: "Annual mean CO2 at Mauna Loa from 1960 to 2023, rising faster in later decades" });
      pic.innerHTML = c.svg; const svg = $("svg", pic);
      svg.addEventListener("keydown", (e) => { const n = p.length; const mv = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: view === 0 ? 12 : 1, ArrowDown: view === 0 ? -12 : -1 }; if (e.key in mv) { e.preventDefault(); idx = Math.max(0, Math.min(n - 1, idx + mv[e.key])); upd(true); } else if (e.key === "Home" || e.key === "End") { e.preventDefault(); idx = e.key === "Home" ? 0 : n - 1; upd(true); } });
      svg.addEventListener("pointermove", (e) => { const r = svg.getBoundingClientRect(); const sx = ((e.clientX - r.left) / r.width) * c.W; let best = 0, bd = Infinity; p.forEach((q, i) => { const d = Math.abs(c.X(q[0]) - sx); if (d < bd) { bd = d; best = i; } }); if (best !== idx) { idx = best; upd(false); } }); };
    const upd = (refocus) => { const p = pts(); read.innerHTML = `<strong>${label(idx)}</strong>: ${f2(p[idx][1])} ppm${view === 0 && trend ? ` <span class="tiny muted">(trend: ${f2(MON[idx].d)} ppm)</span>` : ""}`; draw(); if (refocus) $("svg", pic).focus(); };
    const showMarks = () => { const p = pts(); if (!marks.length) { info.innerHTML = ""; return; } const a = marks.map((i, k) => `${"AB"[k]}: ${label(i)}, ${f2(p[i][1])} ppm`).join("<br>");
      let gap = ""; if (marks.length === 2) { const months = view === 0 ? Math.abs(marks[1] - marks[0]) : null; gap = view === 0 ? `<br>Time from A to B: ${months} month${months === 1 ? "" : "s"}.` : `<br>Time from A to B: ${Math.abs(ANN[marks[1]][0] - ANN[marks[0]][0])} years.`; }
      info.innerHTML = a + gap + (marks.length === 2 ? `<br><span class="tiny muted">Work out the change, or the rate of change, yourself.</span>` : ""); };
    $("[data-a=mark]", host).addEventListener("click", () => { if (marks.length === 2) marks = []; if (!marks.includes(idx)) marks.push(idx); showMarks(); draw(); });
    $("[data-a=unmark]", host).addEventListener("click", () => { marks = []; showMarks(); draw(); });
    $("[data-r=trend]", host).addEventListener("change", (e) => { trend = e.target.checked; upd(false); });
    tabs($("[data-r=tabs]", host), ["Monthly, 2017 to 2021", "Annual means, 1960 to 2023"], (i) => { view = i; idx = 0; marks = []; $("[data-r=tr]", host).hidden = i !== 0;
      $("[data-r=src]", host).innerHTML = SRC + (i === 0 ? " Monthly means; all 60 months were measured at Mauna Loa." : " Annual means. Mauna Loa measurements were suspended on 29 November 2022 after the eruption; values from December 2022 to 4 July 2023 come from Maunakea, about 34 km north.");
      showMarks(); upd(false); });
    renderQs(spec, host, () => {});
    autoHide(host); phoneFit(host);
    host._co = { view: (i) => $$("[data-r=tabs] button", host)[i].click(), go: (i) => { idx = i; upd(false); }, read: () => read.textContent };
  };

  // ===================================== Greenhouse Gas Explorer (3.3.5.2) =====================================
  B.interactives.greenhouseExplorer = function (spec, host) {
    const G = M().greenhouse; const KEYS = ["none", "y1750", "y2019"]; let step = 1, preset = "y2019", gas = "CO2";
    const STEP = {
      1: "<strong>1. Radiation from the Sun</strong>, mainly visible light and near infrared with some ultraviolet, passes through the atmosphere. Some is reflected by clouds, ice and the surface; the rest is absorbed by the Earth's surface, which warms up.",
      2: "<strong>2. The warmed surface re-radiates energy as infrared</strong> (longer wavelength), back towards space.",
      3: "<strong>3. Greenhouse gases absorb some of this infrared.</strong> Carbon dioxide, methane and water vapour molecules absorb it and re-emit it in all directions, some back towards the surface. They do not produce any energy: they only absorb and re-emit infrared that came from the surface.",
      4: "<strong>4. More greenhouse gas, more infrared returned.</strong> With higher concentrations of carbon dioxide and methane from human activity, more infrared is absorbed and re-emitted, and less escapes directly to space: the enhanced greenhouse effect. The energy sent back warms the surface, which then emits more infrared; the Earth warms until the energy leaving again balances the energy arriving. A higher mean global temperature drives climate change. (Compare 1750 with 2019 using the Atmosphere menu.)",
    };
    host.innerHTML = head(spec, "step through") + B.ix.split(`${fig('data-r="pic"', 480)}<p class="tiny muted" style="margin:.3rem 0 0">Red arrows: infrared from the surface; a circled molecule has absorbed infrared; dashed red arrows: infrared re-emitted back towards the surface. Schematic: not to scale. Methane is drawn about 75 times more abundant than it is, relative to carbon dioxide, so that you can see it; water vapour is not drawn.</p>`, `
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="prev">← Back</button><button type="button" class="btn sm primary" data-a="next">Next step →</button></div>
      <div class="ix-readout" data-r="step" aria-live="polite"></div>
      <label class="small">Atmosphere <select data-r="preset">${KEYS.map((k) => `<option value="${k}"${k === preset ? " selected" : ""}>${G.PRESETS[k].name}</option>`).join("")}</select></label>
`, { label: "Greenhouse Gas Explorer controls", cls: "ix-wide-stage" }) + `<div class="row mt" data-r="gtabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose a gas"></div>
      <div class="ix-readout" data-r="card" aria-live="polite" style="margin-top:.4rem"></div>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), stepBox = $("[data-r=step]", host), card = $("[data-r=card]", host);
    const open1750 = () => M().answered(M().LOCKS.gh1750);
    const cardHTML = () => { const lock = `<em>Answer question 4 below to see the 1750 estimate.</em>`;
      if (gas === "CO2") return `<strong>Carbon dioxide</strong><br>Concentration: ${esc(G.CO2.now)}.<br>In 1750: ${open1750() ? esc(G.CO2.y1750) : lock}<br>Sources: respiration; combustion of fossil fuels and wood; deforestation.<br>Removed by: photosynthesis; dissolving in the oceans.<br>Far more abundant than methane, so it has caused more of the warming since 1750.`;
      return `<strong>Methane</strong><br>Concentration: ${esc(G.CH4.now)}.<br>In 1750: ${open1750() ? esc(G.CH4.y1750) : lock}<br>Sources: anaerobic decomposition by microorganisms in waterlogged soils, wetlands, rice paddy fields and landfill sites; microorganisms in the digestive systems of cattle and other ruminants; leaks from coal mines and natural gas.<br>Removed by: being broken down in the atmosphere, lasting about 12 years (IPCC AR6).<br>Each molecule has a larger warming effect than a carbon dioxide molecule, but there is far less of it.<br><span class="tiny"><span class="badge">stretch</span> Per kilogram, methane causes about 27 to 30 times as much warming as carbon dioxide over 100 years (IPCC AR6, Table 7.15).</span>`; };
    const render = () => { pic.innerHTML = A().greenhouse({ step, preset }); stepBox.innerHTML = `<div class="tiny muted">Step ${step} of 4</div>${STEP[step]}`; card.innerHTML = cardHTML();
      $("[data-a=prev]", host).disabled = step === 1; $("[data-a=next]", host).disabled = step === 4; };
    $("[data-a=next]", host).addEventListener("click", () => { step = Math.min(4, step + 1); render(); });
    $("[data-a=prev]", host).addEventListener("click", () => { step = Math.max(1, step - 1); render(); });
    $("[data-r=preset]", host).addEventListener("change", (e) => { preset = e.target.value; render(); });
    tabs($("[data-r=gtabs]", host), ["Carbon dioxide", "Methane"], (i) => { gas = i ? "CH4" : "CO2"; card.innerHTML = cardHTML(); });
    render(); renderQs(spec, host, render);
    autoHide(host); phoneFit(host);
    host._gh = { step: (n) => { step = n; render(); }, preset: (p) => { preset = p; $("[data-r=preset]", host).value = p; render(); }, card: () => card.textContent, gas: (i) => $$("[data-r=gtabs] button", host)[i].click() };
  };

  // ===================================== Climate, Crop and Pest Data Investigator (3.3.5.2) =====================================
  B.interactives.climateInvestigator = function (spec, host) {
    const Cm = M().climate; let set = "A", vi = 0;
    host.innerHTML = head(spec, "analyse and evaluate") + B.ix.split(`<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose a data set"></div>${fig('data-r="pic"', 0)}<p class="tiny muted" data-r="src" style="margin:.3rem 0 0"></p>`, `
      <label class="small" data-r="vsel"></label>
      <div data-r="testrow"><button type="button" class="btn sm primary" data-a="test">Test for a correlation</button></div>
      <div class="ix-readout" data-r="info" aria-live="polite"></div>
      <details class="small mt"><summary>Show the data table</summary><div data-r="tbl"></div></details>`, { label: "Data Investigator controls" }) + `<p class="tiny muted mt">Spearman's rank correlation test: null hypothesis, no correlation; critical value for 10 pairs at P = 0.05 is 0.648. A significant correlation does not show that one variable causes the other.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), tbl = $("[data-r=tbl]", host), vsel = $("[data-r=vsel]", host);
    const pair = () => { if (set === "A") { const y = Cm.A.ys[vi]; return { x: Cm.A.x, y, lock: y.lock }; } const x = Cm.B.xs[vi]; return { x, y: Cm.B.y, lock: x.lock }; };
    const range = (v, pad) => { const lo = Math.min(...v), hi = Math.max(...v); const p = (hi - lo) * pad; return [lo - p, hi + p]; };
    const ticks = (r, n = 5) => { const step = (r[1] - r[0]) / n; const pow = Math.pow(10, Math.floor(Math.log10(step))); const s = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((m) => m >= step); const out = []; for (let v = Math.ceil(r[0] / s) * s; v <= r[1] + 1e-9; v += s) out.push(Number(v.toFixed(6))); return { s, out }; };
    const draw = () => {
      if (set === "C") { const D = Cm.C; const c = A().chart({ W: 600, H: phone() ? 470 : 330, fs: phone() ? 25 : 14, x: [13, 32], y: [0, 7], xTicks: D.temps.map((t) => [t, String(t)]), yTicks: [0, 1, 2, 3, 4, 5, 6, 7], xLabel: "Temperature during grain filling / °C", yLabel: "Mean grain yield / g per plant",
          series: [{ pts: D.temps.map((t, i) => [t, D.c400[i]]), col: "#1f66b0", w: 2.6, dots: true }, { pts: D.temps.map((t, i) => [t, D.c700[i]]), col: "#b0451c", w: 2.6, dash: "7 4", dots: true, shape: "sq" }], aria: "Mean grain yield against temperature at two carbon dioxide concentrations; both peak at 21 °C" });
        pic.innerHTML = c.svg + `<p class="small" style="margin:.3rem 0 0"><span style="color:#1f66b0;font-weight:700">● solid line</span>: CO2 400 ppm &nbsp; <span style="color:#b0451c;font-weight:700">■ dashed line</span>: CO2 700 ppm</p>`; return; }
      const { x, y } = pair(); const xr = range(x.v, 0.08), yr = range(y.v, 0.1); const xt = ticks(xr), yt = ticks(yr);
      const c = A().chart({ W: 600, H: phone() ? 470 : 330, fs: phone() ? 25 : 14, x: xr, y: yr, xTicks: xt.out.map((v) => [v, String(v)]), yTicks: yt.out, xLabel: x.label, yLabel: y.label, yBreak: true, series: [{ pts: x.v.map((v, i) => [v, y.v[i]]), col: "#1f66b0", line: false, dots: true, r: 5 }], aria: `Scatter diagram of ${y.label} against ${x.label}` });
      pic.innerHTML = c.svg; };
    const table = () => { if (set === "C") { const D = Cm.C; tbl.innerHTML = `<table class="tbl small"><thead><tr><th>Temperature / °C</th>${D.temps.map((t) => `<th>${t}</th>`).join("")}</tr></thead><tbody><tr><td>CO2 400 ppm</td>${D.c400.map((v) => `<td>${v.toFixed(1)}</td>`).join("")}</tr><tr><td>CO2 700 ppm</td>${D.c700.map((v) => `<td>${v.toFixed(1)}</td>`).join("")}</tr></tbody></table><p class="tiny muted">Mean grain yield / g per plant.</p>`; return; }
      const S = Cm[set]; const cols = set === "A" ? [S.x, ...S.ys] : [...S.xs, S.y];
      tbl.innerHTML = `<div class="ix-hscroll" style="overflow-x:auto"><table class="tbl small"><thead><tr><th>Year</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${cols[0].v.map((_, i) => `<tr><td>${i + 1}</td>${cols.map((c) => `<td>${c.v[i]}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; };
    const vselHTML = () => { if (set === "C") { vsel.innerHTML = ""; return; } const opts = set === "A" ? Cm.A.ys.map((y, i) => `<option value="${i}"${i === vi ? " selected" : ""}>${esc(y.label)}</option>`) : Cm.B.xs.map((x, i) => `<option value="${i}"${i === vi ? " selected" : ""}>${esc(x.label)}</option>`);
      vsel.innerHTML = `${set === "A" ? "Plot against winter temperature" : "Plot yield against"} <select style="width:100%;max-width:100%">${opts.join("")}</select>`; $("select", vsel).addEventListener("change", (e) => { vi = +e.target.value; info.innerHTML = ""; draw(); }); };
    const LOCKQ = { rsA: "question 1", rsB: "question 4" };
    $("[data-a=test]", host).addEventListener("click", () => { const p = pair();
      if (p.lock && !M().answered(M().LOCKS[p.lock])) { info.innerHTML = `<div class="feedback neutral"><strong>Work this one out yourself first.</strong> Calculate rs for these data in ${LOCKQ[p.lock]} below; after you have answered it, the test runs here.</div>`; return; }
      const r = Cm.spearman(p.x.v, p.y.v); const dir = r.rs > 0 ? "positive" : "negative";
      info.innerHTML = `Σd² = ${r.sumD2}; rs = 1 − (6 × ${r.sumD2}) ÷ (10 × 99) = <strong>${r.rs.toFixed(3)}</strong>.<br>` + (r.sig ? `${Math.abs(r.rs).toFixed(3)} is at least 0.648, so there is a <strong>significant ${dir} correlation</strong> (P &lt; 0.05): reject the null hypothesis. This does not show that one variable causes the other.` : `${Math.abs(r.rs).toFixed(3)} is less than 0.648, so the correlation is <strong>not significant</strong>: the null hypothesis is not rejected. This does not prove there is no relationship.`); });
    tabs($("[data-r=tabs]", host), [Cm.A.name, Cm.B.name, Cm.C.name], (i) => { set = "ABC"[i]; vi = 0; info.innerHTML = set === "C" ? "A controlled experiment: only temperature and CO2 concentration were changed, so they are the likely cause of differences in yield. There is no correlation test to do: compare the two lines, and remember there was only one chamber per treatment." : "";
      $("[data-r=testrow]", host).hidden = set === "C"; $("[data-r=src]", host).textContent = Cm[set].note; vselHTML(); draw(); table(); });
    renderQs(spec, host, () => {});
    autoHide(host); phoneFit(host);
    host._cd = { set: (i) => $$("[data-r=tabs] button", host)[i].click(), v: (i) => { const s = $("select", vsel); if (s) { s.value = String(i); s.dispatchEvent(new Event("change")); } }, test: () => { $("[data-a=test]", host).click(); return info.textContent; } };
  };
})(window.BIO);
