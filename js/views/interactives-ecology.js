// Interactives for 3.3.1 The effect of biotic and abiotic factors on populations (Phase 5 Batch 1, author U1).
// Kinds: ecosystemExplorer (3.3.1.1); popSim, popDataChallenge (3.3.1.2); successionTimeline, conservationChallenge
// (3.3.1.3). Drawings come from B.ecologyArt, data from B.ecologyData and the population model from B.ecologyModel
// (data/content/_ecology-art.js, where the model is documented). Students see only a one-line "Simplified model" note.
// Accessibility: every control is a native button, radio, checkbox or range input; tab rows respond to the arrow keys;
// readouts are polite live regions; nothing moves by itself, so reduced motion needs no special case. Questions are
// rendered with B.questions.render, so attempts count towards mastery. Layout: B.ix.split (picture beside the controls
// on laptops, picture pinned above the controls on phones).
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const A = () => B.ecologyArt, D = () => B.ecologyData, M = () => B.ecologyModel;
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  let inst = 0;
  const qsBlock = (spec, u) => (spec.questions && spec.questions.length ? `<h4 class="mt">Questions</h4><div id="ecq-${u}"></div>` : "");
  // a row of buttons that behaves as a single-choice group (aria-pressed), with arrow-key movement
  const choiceRow = (row, onPick) => { const bs = $$("button", row);
    const pick = (i, focus) => { bs.forEach((b, k) => { b.setAttribute("aria-pressed", String(k === i)); b.classList.toggle("primary", k === i); }); if (focus) bs[i].focus(); onPick(i); };
    bs.forEach((b, i) => b.addEventListener("click", () => pick(i)));
    row.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!mv) return; const cur = bs.findIndex((b) => b === document.activeElement); if (cur < 0) return; e.preventDefault(); pick((cur + mv + bs.length) % bs.length, true); });
    return pick; };
  const list = (arr) => (arr && arr.length ? `<ul class="small" style="margin:.2rem 0 .3rem 1.1rem;padding:0">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");

  // ===================================== Ecosystem Explorer (3.3.1.1) =====================================
  // Even chip padding: measure each abiotic label and re-flow the chips with the same rules as B.ecologyArt.ecosystem
  // (left edge 36, right limit 526, gap 8, rows 29 apart). Kept only if the number of rows is unchanged.
  const fitChips = (svg) => { const rs = $$("rect[data-chip]", svg); if (!rs.length || !rs[0].nextElementSibling.getComputedTextLength) return;
    const ws = rs.map((r) => r.nextElementSibling.getComputedTextLength() + 20); if (ws.some((w) => !(w > 20))) return;
    const y0 = +rs[0].getAttribute("y"), rows0 = new Set(rs.map((r) => r.getAttribute("y"))).size; let cx = 36, row = 0; const pos = [];
    ws.forEach((w) => { if (cx + w > 526 && cx > 36) { cx = 36; row++; } pos.push([cx, row]); cx += w + 8; });
    if (row + 1 !== rows0) return;
    rs.forEach((r, i) => { const [x, rw] = pos[i], y = y0 + rw * 29, t = r.nextElementSibling; r.setAttribute("x", x.toFixed(1)); r.setAttribute("y", y.toFixed(1)); r.setAttribute("width", ws[i].toFixed(1)); t.setAttribute("x", (x + ws[i] / 2).toFixed(1)); t.setAttribute("y", (y + 16).toFixed(1)); }); };
  B.interactives.ecosystemExplorer = function (spec, host) {
    const u = ++inst, ECO = D().ECOSYSTEMS; const st = { e: 0, level: "community", sel: ECO[0].pops[0].id };
    host.innerHTML = head(spec, "real ecosystems") + `<style>@container ix (max-width: 699px) { #eco-v-${u} { min-width: 480px; width: 480px; } #eco-v-${u} > svg { min-width: 480px; width: 480px; } }</style>` + B.ix.split(`<div class="figure"><div class="ix-hscroll"><div class="fig-view" id="eco-v-${u}"></div></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p></div><p class="tiny muted" style="margin:.3rem 0 0">Each dot stands for one individual (numbers not to scale). Only five species are shown; a real community has many more, including microorganisms.</p>`, `
      <fieldset><legend>Ecosystem</legend><div class="row" id="eco-e-${u}" role="group" aria-label="choose an ecosystem" style="flex-wrap:wrap">${ECO.map((e, i) => `<button type="button" class="btn sm${i ? "" : " primary"}" aria-pressed="${!i}">${esc(e.name)}</button>`).join("")}</div><p class="tiny muted" id="eco-r-${u}" style="margin:.35rem 0 0"></p></fieldset>
      <fieldset><legend>Show</legend>
        <label class="small"><input type="radio" name="eco-l-${u}" value="population"> One population (choose a species in the picture)</label>
        <label class="small"><input type="radio" name="eco-l-${u}" value="community" checked> The community</label>
        <label class="small"><input type="radio" name="eco-l-${u}" value="ecosystem"> The whole ecosystem</label></fieldset>
      <div class="ix-readout" id="eco-out-${u}" aria-live="polite"></div>
      <div class="ix-readout" id="eco-n-${u}" aria-live="polite"></div>`, { label: "Ecosystem Explorer controls" }) + qsBlock(spec, u);
    const view = $(`#eco-v-${u}`, host), out = $(`#eco-out-${u}`, host), nic = $(`#eco-n-${u}`, host);
    const draw = () => { const e = ECO[st.e]; const p = e.pops.find((x) => x.id === st.sel) || e.pops[0]; st.sel = p.id;
      view.innerHTML = A().ecosystem(e, { level: st.level, sel: st.sel }); fitChips($("svg", view));
      $(`#eco-r-${u}`, host).textContent = e.region;
      $$(`input[name="eco-l-${u}"]`, host).forEach((r) => (r.checked = r.value === st.level));
      const where = `this ${e.name.toLowerCase().replace(/^arctic/, "Arctic")}`;
      out.innerHTML = st.level === "population" ? `<strong>Population:</strong> all the ${esc(p.pl)} (<em>${esc(p.latin)}</em>) living in ${esc(where)}. One species, in one habitat.`
        : st.level === "community" ? `<strong>Community:</strong> the populations of all the different species living in ${esc(where)}, such as ${esc(e.pops.map((x) => x.pl).join(", "))}. They interact: <span class="tiny">${esc(e.biotic.join("; "))}</span>.`
        : `<strong>Ecosystem:</strong> the community together with the non-living (abiotic) parts of its environment: ${esc(e.abiotic.join("; "))}.`;
      nic.innerHTML = `<strong>${esc(p.name)}</strong> <span class="tiny muted"><em>${esc(p.latin)}</em></span><div class="small"><strong>Habitat:</strong> ${esc(p.habitat)}</div><div class="small"><strong>Niche:</strong> ${esc(p.role)}</div>${p.abiotic.length ? `<div class="small"><strong>Adapted to abiotic conditions</strong></div>${list(p.abiotic)}` : ""}${p.biotic.length ? `<div class="small"><strong>Adapted to biotic conditions</strong></div>${list(p.biotic)}` : ""}`;
      $$("[data-pop]", view).forEach((g) => { const go = () => { st.sel = g.dataset.pop; st.level = "population"; draw(); const n = $(`[data-pop="${st.sel}"]`, view); if (n) n.focus(); };
        g.addEventListener("click", go); g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); } }); }); };
    choiceRow($(`#eco-e-${u}`, host), (i) => { st.e = i; st.sel = ECO[i].pops[0].id; draw(); });
    $$(`input[name="eco-l-${u}"]`, host).forEach((r) => r.addEventListener("change", () => { if (r.checked) { st.level = r.value; draw(); } }));
    draw(); if (spec.questions) renderQs(spec.questions, $(`#ecq-${u}`, host));
  };

  // ================================ Population Dynamics Simulator (3.3.1.2) ================================
  const COL = { N: "#1f8a8a", A: "#1f66b0", B: "#c0702a", H: "#4f8a3a", P: "#b4504f" };
  B.interactives.popSim = function (spec, host) {
    const u = ++inst; const st = { scen: "single", temp: "optimum", food: "medium", grow: "both", overlap: "high", predators: true, preyFood: "higher", frost: false };
    const radios = (name, legend, opts, cur) => `<fieldset data-f="${name}"><legend>${legend}</legend>${opts.map(([v, l]) => `<label class="small"><input type="radio" name="ps-${name}-${u}" value="${v}"${v === cur ? " checked" : ""}> ${l}</label>`).join("")}</fieldset>`;
    host.innerHTML = head(spec, "simplified model") + B.ix.split(`<div class="figure"><div class="fig-view" id="ps-g-${u}"></div></div>`, `
      <div class="row" role="tablist" aria-label="choose a situation" id="ps-t-${u}" style="flex-wrap:wrap"><button type="button" class="btn sm primary" role="tab" aria-selected="true" data-s="single">One species</button><button type="button" class="btn sm" role="tab" aria-selected="false" tabindex="-1" data-s="compete">Two competing species</button><button type="button" class="btn sm" role="tab" aria-selected="false" tabindex="-1" data-s="predprey">Predator and prey</button></div>
      <div data-p="single">${radios("temp", "Temperature (abiotic)", [["low", "Low"], ["optimum", "Near the optimum"], ["high", "High"]], st.temp)}${radios("food", "Food supply", [["low", "Low"], ["medium", "Medium"], ["high", "High"]], st.food)}</div>
      <div data-p="compete" hidden>${radios("grow", "Grow", [["A", "Species A alone"], ["B", "Species B alone"], ["both", "A and B together"]], st.grow)}${radios("overlap", "How similar are their niches?", [["high", "Same food and space"], ["medium", "Partly different food"], ["low", "Mostly different food"]], st.overlap)}</div>
      <div data-p="predprey" hidden><fieldset><legend>Predators</legend><label class="small"><input type="checkbox" id="ps-pred-${u}" checked> Predators present</label></fieldset>${radios("preyFood", "Food supply for the prey", [["lower", "Lower"], ["higher", "Higher"]], st.preyFood)}</div>
      <fieldset><legend>Abiotic event</legend><label class="small"><input type="checkbox" id="ps-frost-${u}"> <span id="ps-fl-${u}">A severe frost in week 40</span></label></fieldset>
      <div class="ix-readout" id="ps-o-${u}" aria-live="polite"></div>
      <p class="tiny muted" style="margin:0">Simplified model: model output, not real data.</p>`, { label: "Population simulator controls" }) + qsBlock(spec, u);
    const g = $(`#ps-g-${u}`, host), out = $(`#ps-o-${u}`, host);
    const n0 = (x) => Math.round(x);
    const run = () => {
      const r = M().run(st.scen, st); const last = (k) => r.series.find((s) => s.key === k).values.at(-1);
      const unit = r.unit, U1 = unit === "years" ? "Year" : "Week";
      $(`#ps-fl-${u}`, host).textContent = `A severe frost in ${unit === "years" ? "year" : "week"} ${M().SCEN[st.scen].frostAt}`;
      // predators and prey on their own scales (predators are far fewer), so the predator cycle and its lag stay visible
      const two = st.scen === "predprey" && r.series.length > 1;
      g.innerHTML = A().lineChart({ t: r.t, series: r.series.map((s) => ({ name: two ? `${s.name} (${s.key === "P" ? "right" : "left"} scale)` : s.name, values: s.values, axis: two && s.key === "P" ? 2 : 1, color: COL[s.key], dash: s.key === "B" || s.key === "P" ? "8 5" : "" })), xLabel: `Time / ${unit}`, yLabel: two ? "Number of prey" : "Number of individuals", yMax: two ? 800 : undefined, y2: two ? { max: 40, label: "Number of predators" } : null, vline: r.frostAt != null ? { x: r.frostAt, label: "frost" } : null,
        aria: `Graph of number of individuals against time for ${r.series.map((s) => s.name).join(" and ")} (model output)` });
      let msg = "";
      if (st.scen === "single") { const v = r.series[0].values; const t90 = v.findIndex((x) => x >= 0.9 * r.K);
        msg = `The population grows quickly at first, then levels off at about <strong>${n0(r.K)}</strong>, where <strong>intraspecific competition</strong> for food stops it growing. ` + (t90 >= 0 ? `It reaches 90 % of this level in week ${t90}${st.temp === "optimum" ? "" : ": temperature away from the optimum slows growth"}. ` : "It is still growing at week 100: the low temperature slows growth. ") + (st.frost ? "The frost kills most individuals whatever the population size; with less competition, the survivors then grow back quickly." : ""); }
      else if (st.scen === "compete") { const a = r.series.find((s) => s.key === "A"), b = r.series.find((s) => s.key === "B");
        if (a && b) { const bEnd = last("B"), aEnd = last("A"); msg = bEnd < 1 ? `<strong>Interspecific competition:</strong> species B grows faster at first, but species A is the stronger competitor for the shared food. B falls to zero; A levels off at about ${n0(aEnd)}.` : `<strong>Interspecific competition:</strong> both species survive, but each levels off below the ${n0(r.K)} it reaches when grown alone (A about ${n0(aEnd)}, B about ${n0(bEnd)}). The more different their niches, the less they compete.`; }
        else msg = `Grown alone, the species levels off at about ${n0(r.K)}: only <strong>intraspecific competition</strong> limits it.`;
        if (st.frost) msg += " The frost reduces both species at once; competition then resumes as they recover."; }
      else { const H = r.series[0].values, P = r.series[1] ? r.series[1].values : null;
        if (!P) msg = `With no predators the prey rise until <strong>intraspecific competition</strong> for food stops them, at about ${n0(r.K)}.`;
        else { const lag = M().lag(H, P), pk = M().peaks(H); msg = pk.length >= 3 && lag ? `<strong>Predation:</strong> prey and predator numbers rise and fall in repeated cycles. Each predator peak comes about <strong>${Math.round(lag)} years</strong> after a prey peak. The prey never reach the ${n0(r.K)} their food could support.` : `<strong>Predation:</strong> the numbers rise and fall at first, then settle (prey about ${n0(last("H"))}, predators about ${n0(last("P"))}). The prey stay well below the ${n0(r.K)} their food could support.`; }
        if (st.frost && P) msg += " The frost reduces both; the predator and prey cycles then restart from the new numbers."; }
      out.innerHTML = msg + `<div class="tiny muted" style="margin-top:.3rem">${U1} ${r.T}: ${r.series.map((s) => `${esc(s.name)} ${n0(s.values.at(-1))}`).join(", ")}</div>`;
    };
    const tabs = $$('[role="tab"]', $(`#ps-t-${u}`, host));
    const showScen = (i, focus) => { tabs.forEach((b, k) => { b.setAttribute("aria-selected", String(k === i)); b.tabIndex = k === i ? 0 : -1; b.classList.toggle("primary", k === i); }); st.scen = tabs[i].dataset.s; $$("[data-p]", host).forEach((p) => (p.hidden = p.dataset.p !== st.scen)); if (focus) tabs[i].focus(); run(); };
    tabs.forEach((b, i) => b.addEventListener("click", () => showScen(i)));
    $(`#ps-t-${u}`, host).addEventListener("keydown", (e) => { const cur = tabs.findIndex((b) => b.getAttribute("aria-selected") === "true"); const n = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: tabs.length - 1 }[e.key]; if (n === undefined) return; e.preventDefault(); showScen((n + tabs.length) % tabs.length, true); });
    ["temp", "food", "grow", "overlap", "preyFood"].forEach((k) => $$(`input[name="ps-${k}-${u}"]`, host).forEach((r) => r.addEventListener("change", () => { if (r.checked) { st[k] = r.value; run(); } })));
    $(`#ps-pred-${u}`, host).addEventListener("change", (e) => { st.predators = e.target.checked; run(); });
    $(`#ps-frost-${u}`, host).addEventListener("change", (e) => { st.frost = e.target.checked; run(); });
    run(); if (spec.questions) renderQs(spec.questions, $(`#ecq-${u}`, host));
  };

  // ================================== Population Data Challenge (3.3.1.2) ==================================
  // spec.sets: [{ id, tab, title, intro (HTML), source (HTML) }]; spec.questions carry set: <id>.
  B.interactives.popDataChallenge = function (spec, host) {
    const u = ++inst, DD = D().DATA, Ar = A(); const sets = spec.sets || [];
    const chart = (id) => {
      if (id === "limpets") { const d = DD.limpets; return Ar.scatter({ x: d.x, y: d.y, xLabel: d.xLabel, yLabel: d.yLabel, xMax: 3.5, xStep: 0.5, yMax: 30, aria: "Scatter graph of mean number of limpets per quadrat against height above low-tide level (hypothetical data)", w: 600, h: 320 }); }
      if (id === "squirrels") { const d = DD.squirrels; return Ar.lineChart({ t: d.t, series: [{ name: "Red squirrels", values: d.red, color: "#b4504f", marker: "circle" }, { name: "Grey squirrels", values: d.grey, color: "#5f6f7f", dash: "8 5", marker: "square" }], xLabel: "Time / years", yLabel: "Squirrels seen per survey", yMax: 60, aria: "Line graph of red and grey squirrels seen per survey over 20 years (hypothetical data)", w: 600, h: 320 }); }
      if (id === "cycle") { const d = DD.cycle; return Ar.lineChart({ t: d.t, series: [{ name: "Prey (left scale)", values: d.prey, color: "#4f8a3a", marker: "circle" }, { name: "Predators (right scale)", values: d.pred, axis: 2, color: "#b4504f", dash: "8 5", marker: "square" }], xLabel: "Time / years", yLabel: "Prey / thousands", yMax: 150, y2: { max: 15, label: "Predators / thousands" }, aria: "Line graph of prey and predator numbers over 30 years (hypothetical data); prey are read on the left-hand scale (0 to 150 thousand) and predators on the right-hand scale (0 to 15 thousand)", w: 600, h: 320 }); }
      const d = DD.gause; return Ar.lineChart({ t: d.t, series: [{ name: "A alone", values: d.aAlone, color: "#1f66b0" }, { name: "B alone", values: d.bAlone, color: "#c0702a" }, { name: "A mixed", values: d.aMixed, color: "#1f66b0", dash: "8 5", marker: "circle" }, { name: "B mixed", values: d.bMixed, color: "#c0702a", dash: "8 5", marker: "square" }], xLabel: "Time / days", yLabel: "Individuals per cm³", yMax: 250, aria: "Line graph of two Paramecium species grown alone and together over 16 days (hypothetical data)", w: 600, h: 320 });
    };
    const table = (id) => { const row = (a) => a.map((x) => `<td>${x}</td>`).join(""); const t = (hd, rows) => `<div style="overflow-x:auto"><table class="tbl small"><tbody>${rows.map((r, i) => `<tr><th>${hd[i]}</th>${row(r)}</tr>`).join("")}</tbody></table></div>`;
      if (id === "limpets") return t(["Height / m", "Mean limpets per quadrat"], [DD.limpets.x, DD.limpets.y]);
      if (id === "squirrels") return t(["Year", "Red", "Grey"], [DD.squirrels.t, DD.squirrels.red, DD.squirrels.grey]);
      if (id === "cycle") return t(["Year", "Prey / thousands", "Predators / thousands"], [DD.cycle.t, DD.cycle.prey, DD.cycle.pred]);
      return t(["Day", "A alone", "B alone", "A mixed", "B mixed"], [DD.gause.t, DD.gause.aAlone, DD.gause.bAlone, DD.gause.aMixed, DD.gause.bMixed]); };
    host.innerHTML = head(spec, "hypothetical data") + `<div class="row mt" role="tablist" aria-label="choose a data set" id="dc-t-${u}" style="flex-wrap:wrap">${sets.map((s, i) => `<button type="button" class="btn sm${i ? "" : " primary"}" role="tab" aria-selected="${!i}" tabindex="${i ? -1 : 0}" aria-controls="dc-p-${u}-${i}" id="dc-b-${u}-${i}">${esc(s.tab)}</button>`).join("")}</div>` +
      sets.map((s, i) => `<div role="tabpanel" id="dc-p-${u}-${i}" aria-labelledby="dc-b-${u}-${i}"${i ? " hidden" : ""} class="mt"><h4 style="margin:.2rem 0">${esc(s.title)}</h4>${s.intro}<div class="figure" style="max-width:620px"><div class="fig-view">${chart(s.id)}</div></div><details class="small"><summary>Show the data as a table</summary>${table(s.id)}</details>${s.source || ""}<div data-q="${s.id}"></div></div>`).join("");
    B.ix.viewTabs($(`#dc-t-${u}`, host));
    sets.forEach((s) => renderQs((spec.questions || []).filter((q) => q.set === s.id), $(`[data-q="${s.id}"]`, host)));
  };

  // ==================================== Succession Timeline (3.3.1.3) ====================================
  B.interactives.successionTimeline = function (spec, host) {
    const u = ++inst, SU = D().SUCCESSION, KEYS = D().READKEYS; const st = { path: "rock", i: 0, alt: false };
    host.innerHTML = head(spec, "schematic") + B.ix.split(`<div class="figure"><div class="fig-view" id="su-v-${u}"></div></div><p class="small" id="su-cap-${u}" style="margin:.3rem 0 0;font-weight:700"></p><div id="su-m-${u}" style="margin-top:.3rem"></div>`, `
      <fieldset><legend>Starting point</legend><label class="small"><input type="radio" name="su-p-${u}" value="rock" checked> Bare rock</label><label class="small"><input type="radio" name="su-p-${u}" value="dunes"> Sand dunes</label></fieldset>
      <div class="row" style="align-items:center;flex-wrap:nowrap"><button type="button" class="btn sm" id="su-prev-${u}" aria-label="earlier stage">←</button><label class="small" style="flex:1">Stage <strong id="su-n-${u}">1</strong> of 5<input type="range" min="1" max="5" step="1" value="1" id="su-r-${u}" aria-label="stage of succession"></label><button type="button" class="btn sm primary" id="su-next-${u}" aria-label="later stage">→</button></div>
      <div class="ix-readout" id="su-o-${u}" aria-live="polite"></div>
      <label class="small"><input type="checkbox" id="su-alt-${u}"> Stretch: is it always the same sequence?</label>
      <div class="ix-readout small" id="su-a-${u}" hidden></div>`, { label: "Succession Timeline controls" }) + qsBlock(spec, u);
    const bar = (v) => `<span aria-hidden="true" style="display:inline-flex;gap:2px;vertical-align:middle">${[1, 2, 3, 4].map((k) => `<span style="width:16px;height:10px;border-radius:2px;background:${k <= v ? "var(--teal)" : "var(--line)"}"></span>`).join("")}</span>`;
    const ALT = {
      rock: "<strong>Not always one fixed sequence.</strong> At Glacier Bay in Alaska, sites uncovered by the ice at different times did not all pass through the same stages: where seeds of spruce arrived early, spruce forest formed without a long stage of alder thicket. Which species arrive first, by chance and by distance from seed sources, changes the path.",
      dunes: "<strong>Not always one fixed sequence.</strong> Strong winds can blow out a hollow in a fixed dune, returning it to bare sand, and grazing by rabbits can hold dunes at the grassland stage for a long time. Real dune systems are a patchwork of stages.",
    };
    const draw = () => { const P = SU[st.path], s = P.stages[st.i];
      $(`#su-v-${u}`, host).innerHTML = A().scene({ ground: P.ground, sea: P.ground === "sand", soil: s.read.soil, humus: s.read.humus, plants: s.plants, salt: st.i + (st.path === "rock" ? 1 : 7), aria: `${P.name}, stage ${st.i + 1}: ${s.name}` });
      $(`#su-cap-${u}`, host).textContent = `${P.name}, stage ${st.i + 1}: ${s.name}`;
      $(`#su-n-${u}`, host).textContent = st.i + 1; $(`#su-r-${u}`, host).value = st.i + 1;
      $(`#su-prev-${u}`, host).disabled = st.i === 0; $(`#su-next-${u}`, host).disabled = st.i === 4;
      $(`#su-o-${u}`, host).innerHTML = `<div class="small"><strong>Who lives here.</strong> ${esc(s.who)}</div><div class="small" style="margin-top:.3rem"><strong>Adaptations:</strong></div>${list(s.adapt)}<div class="small"><strong>How they change the environment.</strong> ${esc(s.change)}</div>`;
      $(`#su-m-${u}`, host).innerHTML = `<div class="tiny muted" style="margin-bottom:.2rem">Conditions at this stage (relative, illustrative)</div><div class="small" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.15rem 1rem">${KEYS.map(([k, l]) => `<div style="display:flex;justify-content:space-between;gap:.5rem;align-items:center"><span>${l}</span><span style="white-space:nowrap">${bar(s.read[k])}<span class="sr-only"> ${s.read[k]} of 4</span></span></div>`).join("")}</div>`;
      const al = $(`#su-a-${u}`, host); al.hidden = !st.alt; al.innerHTML = ALT[st.path]; };
    const go = (i) => { st.i = Math.max(0, Math.min(4, i)); draw(); };
    $$(`input[name="su-p-${u}"]`, host).forEach((r) => r.addEventListener("change", () => { if (r.checked) { st.path = r.value; st.i = 0; draw(); } }));
    $(`#su-r-${u}`, host).addEventListener("input", (e) => go(+e.target.value - 1));
    $(`#su-prev-${u}`, host).addEventListener("click", () => go(st.i - 1)); $(`#su-next-${u}`, host).addEventListener("click", () => go(st.i + 1));
    $(`#su-alt-${u}`, host).addEventListener("change", (e) => { st.alt = e.target.checked; draw(); });
    draw(); if (spec.questions) renderQs(spec.questions, $(`#ecq-${u}`, host));
  };

  // ================================ Conservation Decision Challenge (3.3.1.3) ================================
  B.interactives.conservationChallenge = function (spec, host) {
    const u = ++inst, SC = D().CONSERVE; const st = { s: 0, pick: null, tried: SC.map(() => new Set()) };
    host.innerHTML = head(spec, "real habitats; outcomes simplified") + B.ix.split(`<div class="figure"><div class="fig-view" id="cc-v-${u}"></div></div><p class="small" id="cc-cap-${u}" style="margin:.3rem 0 0;font-weight:700"></p><div class="ix-readout small" id="cc-g-${u}" style="margin-top:.4rem"></div>`, `
      <label class="small"><strong>Habitat</strong> <select id="cc-s-${u}" aria-label="choose a habitat">${SC.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join("")}</select></label>
      <fieldset><legend>Your decision</legend><div id="cc-o-${u}" style="display:flex;flex-direction:column;gap:.3rem"></div></fieldset>
      <div class="ix-readout small" id="cc-f-${u}" aria-live="polite"></div>`, { label: "Conservation Decision Challenge controls" }) + qsBlock(spec, u);
    const draw = () => { const s = SC[st.s]; const o = st.pick != null ? s.options[st.pick] : null; const key = o ? o.after : s.now;
      $(`#cc-v-${u}`, host).innerHTML = A().habitat(key);
      $(`#cc-cap-${u}`, host).textContent = (o ? "About 25 years later: " : "Now: ") + A().HABITATS[key].label;
      $(`#cc-g-${u}`, host).innerHTML = `<div><strong>${esc(s.name)}</strong> <span class="tiny muted">(${esc(s.where)})</span></div><div><strong>Goal:</strong> ${esc(s.goal)}</div><div><strong>Problem:</strong> ${esc(s.problem)}</div>`;
      $(`#cc-o-${u}`, host).innerHTML = s.options.map((x, i) => `<button type="button" class="btn sm${st.pick === i ? " primary" : ""}" aria-pressed="${st.pick === i}" data-o="${i}" style="text-align:left;justify-content:flex-start;white-space:normal">${st.tried[st.s].has(i) ? (x.ok ? "✓ " : "✗ ") : ""}${esc(x.text)}</button>`).join("") + (st.pick != null ? `<button type="button" class="btn sm" data-o="now" style="align-self:flex-start">Show the site now</button>` : "");
      $(`#cc-f-${u}`, host).innerHTML = o ? `<strong>${o.ok ? "✓ Meets the goal." : "✗ Does not meet the goal."}</strong> ${esc(o.why)}` : "Choose a decision to see what the site is likely to look like in about 25 years.";
      $$("[data-o]", host).forEach((b) => b.addEventListener("click", () => { if (b.dataset.o === "now") { st.pick = null; draw(); $$("[data-o]", host)[0].focus(); return; } st.pick = +b.dataset.o; st.tried[st.s].add(st.pick); draw(); const nb = $(`[data-o="${st.pick}"]`, host); if (nb) nb.focus(); })); };
    $(`#cc-s-${u}`, host).addEventListener("change", (e) => { st.s = +e.target.value; st.pick = null; draw(); });
    draw(); if (spec.questions) renderQs(spec.questions, $(`#ecq-${u}`, host));
  };
})(window.BIO);
