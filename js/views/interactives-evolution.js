// Interactives for 3.3.8 Evolution may lead to speciation (Phase 5 Batch 4, author C2).
// Kinds: selectionSimulator (3.3.8.1); selectionCurves, speciationExplorer, speciationSequence (3.3.8.2).
// Models and hand-worked test cases: B.evolutionModel (data/content/_evolution-model.js; validate() checks them; spec
// reviewed before building, scratchpad p5b4/C2-MODEL.md). Drawings: B.evolutionArt (data/content/_evolution-art.js).
// No answer is shown before the student commits: model questions show feedback only after submitting; the Speciation
// Explorer's fertile-offspring test is hidden until the student asks for it at each stage; the Sequence Challenge gives
// feedback only after "Check".
// Accessibility: native buttons, selects and radio buttons; tab rows answer the arrow keys; readouts are polite live
// regions; nothing animates, so reduced motion needs no special case. Layout: B.ix.split.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.evolutionModel, A = () => B.evolutionArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div>${spec.note ? `<p class="small muted">${esc(spec.note)}</p>` : ""}`;
  const answered = (qid) => { try { const a = B.store.get().attempts.filter((x) => x.qid === qid); return a.some((x) => x.score === x.max || x.mode === "self") || a.length >= 2; } catch (e) { return false; } };
  const FB = { ok: "background:var(--sage-soft);border-left:4px solid var(--sage)", bad: "background:var(--rose-soft);border-left:4px solid var(--rose)", neutral: "background:var(--surface-2);border-left:4px solid var(--line-strong)" };
  const fb = (kind, html) => `<div class="feedback ${kind}" style="${FB[kind]};padding:.5rem .7rem;border-radius:8px;margin:.4rem 0;font-size:.88rem">${html}</div>`;
  const qBlock = (spec, title = "Questions") => ((spec.questions || []).length ? `<h4 class="mt">${esc(title)}</h4><div data-qs></div>` : "");
  // questions one at a time, inside the model
  const qCarousel = (spec, host) => { const into = $("[data-qs]", host); if (!into) return; const qs = spec.questions || []; if (!qs.length) return; let cur = 0;
    const bar = document.createElement("div"); bar.className = "row"; bar.style.cssText = "gap:.4rem;align-items:center;flex-wrap:wrap;margin:.2rem 0 .4rem";
    bar.innerHTML = `<button type="button" class="btn sm" data-q="prev">← Previous</button><span class="small" data-q="pos" aria-live="polite"></span><button type="button" class="btn sm" data-q="next">Next →</button>`; into.append(bar);
    const boxes = qs.map((q, i) => { const d = document.createElement("div"); d.dataset.qn = String(i + 1); d.append(B.questions.render(q, { onAnswer: () => setTimeout(show, 0) })); into.append(d); return d; });
    const show = () => { boxes.forEach((d, i) => (d.hidden = i !== cur)); $("[data-q=pos]", bar).textContent = `Question ${cur + 1} of ${qs.length} · answered ${qs.filter((q) => answered(q.id)).length}`; };
    $("[data-q=prev]", bar).addEventListener("click", () => { cur = (cur - 1 + qs.length) % qs.length; show(); }); $("[data-q=next]", bar).addEventListener("click", () => { cur = (cur + 1) % qs.length; show(); });
    show(); };
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(start); return show; };
  const SEL = "padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:8px;max-width:100%";
  const opts = (vals, cur, fmt = (v) => v) => vals.map((v) => `<option value="${v}"${v === cur ? " selected" : ""}>${fmt(v)}</option>`).join("");
  const f2 = (v) => v.toFixed(2);
  const TENTHS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], HALFUP = [0.5, 0.6, 0.7, 0.8, 0.9, 1];

  // ===================================== Natural Selection Simulator (3.3.8.1) =====================================
  B.interactives.selectionSimulator = function (spec, host) {
    const u = uidOf(); const P0 = M().PRESETS; let key = spec.start || "sooty"; let set = 0; let show = "allele";
    const vG = `ns-g-${u}`, vP = `ns-p-${u}`;
    host.innerHTML = head(spec, "simulation") + B.ix.split(`
      <div class="ix-views row" data-r="views" role="tablist" aria-label="Picture to show" style="gap:.4rem;margin:0 0 .3rem"><button type="button" role="tab" class="btn sm primary" aria-controls="${vG}" aria-selected="true">Graph of five runs</button><button type="button" role="tab" class="btn sm" aria-controls="${vP}" aria-selected="false" tabindex="-1">Population (run 1)</button></div>
      <div class="figure" id="${vG}"><div class="row" style="gap:.4rem;flex-wrap:wrap;margin:0 0 .2rem" role="group" aria-label="What to plot"><label class="small"><input type="radio" name="ns-y-${u}" value="allele" checked> Allele frequency</label><label class="small"><input type="radio" name="ns-y-${u}" value="pheno"> Phenotype frequency</label></div>
        <div class="fig-view" data-r="graph"></div><p class="tiny" data-r="legend" style="margin:.2rem 0 0"></p></div>
      <div class="figure" id="${vP}" hidden><div class="fig-view" data-r="strip"></div><p class="tiny muted" data-r="stripcap" style="margin:.2rem 0 0"></p></div>`, `
      <label class="small">Scenario <select data-r="preset" style="${SEL}">${Object.entries(P0).map(([k, p]) => `<option value="${k}"${k === key ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
      <p class="small" data-r="say" style="margin:.35rem 0"></p>
      <div style="overflow-x:auto;max-width:100%"><table class="tbl small" style="margin:.2rem 0"><thead><tr><th>Phenotype</th><th>Survival chance</th><th>Offspring (relative)</th></tr></thead><tbody>
        <tr><th data-r="ldom"></th><td><select data-r="sD" aria-label="chance of surviving, first phenotype" style="${SEL};width:auto"></select></td><td><select data-r="fD" aria-label="offspring per survivor, first phenotype" style="${SEL};width:auto"></select></td></tr>
        <tr><th data-r="lrec"></th><td><select data-r="sR" aria-label="chance of surviving, second phenotype" style="${SEL};width:auto"></select></td><td><select data-r="fR" aria-label="offspring per survivor, second phenotype" style="${SEL};width:auto"></select></td></tr></tbody></table></div>
      <div class="row" style="gap:.5rem;flex-wrap:wrap;align-items:end">
        <label class="small">Population size <select data-r="N" style="${SEL}">${opts([20, 100, 1000], 100)}</select></label>
        <label class="small"><span data-r="lp0">Starting frequency</span> <select data-r="p0" style="${SEL}">${opts([0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95], 0.1, f2)}</select></label>
        <label class="small">Generations <select data-r="G" style="${SEL}">${opts([10, 20, 30, 40, 50], 30)}</select></label></div>
      <div class="row mt" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-r="again">New set of five runs</button></div>
      <div class="ix-readout mt" data-r="out" aria-live="polite"></div>`, { label: "Natural Selection Simulator controls" }) +
      `<p class="tiny muted mt">Simulated data. Simplified model: one gene with two alleles, one dominant; random mating; the population returns to the same size each generation; no mutation or migration. A favoured allele that is rare can still be lost by chance, especially when it is recessive and hidden in heterozygotes.</p>` + qBlock(spec);
    const g = (r) => $(`[data-r=${r}]`, host);
    B.ix.viewTabs(g("views"));
    const fill = () => { const p = P0[key]; g("say").textContent = p.say; g("ldom").textContent = `${p.dom} (${p.A}${p.A}, ${p.A}${p.a})`; g("lrec").textContent = `${p.rec} (${p.a}${p.a})`;
      g("sD").innerHTML = opts(TENTHS, p.sD, (v) => v.toFixed(1)); g("sR").innerHTML = opts(TENTHS, p.sR, (v) => v.toFixed(1)); g("fD").innerHTML = opts(HALFUP, p.fD, (v) => v.toFixed(1)); g("fR").innerHTML = opts(HALFUP, p.fR, (v) => v.toFixed(1));
      g("N").value = String(p.N); g("p0").value = String(p.p0); g("lp0").textContent = `Starting frequency of allele ${p.A}`; };
    const draw = () => { const p = P0[key]; const o = { N: +g("N").value, p0: +g("p0").value, G: +g("G").value, sD: +g("sD").value, fD: +g("fD").value, sR: +g("sR").value, fR: +g("fR").value };
      const seeds = [1, 2, 3, 4, 5].map((k) => 101 + set * 5 + k); const rs = M().runs(o, seeds); const wD = o.sD * o.fD, wR = o.sR * o.fR;
      const ex = M().expected(o.p0, o.G, wD, wR); const exPh = ex.map((v) => 1 - (1 - v) ** 2);
      const ser = rs.map((r) => (show === "allele" ? r.p : r.ph));
      const ylab = show === "allele" ? `Frequency of allele ${p.A}` : `Proportion ${p.dom}`;
      g("graph").innerHTML = A().lines(ser, show === "allele" ? ex : exPh, { G: o.G, ylab, label: `Line graph: ${ylab.toLowerCase()} against generation for five simulated runs and the expected line without chance` });
      g("legend").innerHTML = A().RUNC.map((c, i) => `<span style="display:inline-block;width:1.1em;height:.25em;background:${c};vertical-align:middle;margin:0 .25em 0 ${i ? ".6em" : 0}"></span>Run ${i + 1}`).join("") + `<span style="display:inline-block;width:1.4em;border-top:2px dashed #16263a;vertical-align:middle;margin:0 .25em 0 .8em"></span>Expected without chance`;
      // runs that died out are left out of the range: their last value is not a value at the last generation
      const alive = rs.filter((r) => r.died === null); const dead = rs.length - alive.length;
      const ends = alive.map((r) => (show === "allele" ? r.p : r.ph)).map((s) => s[s.length - 1]);
      const nm = show === "allele" ? `frequency of allele ${esc(p.A)}` : `proportion of ${esc(p.dom)} individuals`;
      const head = alive.length ? `<strong>Generation ${o.G}:</strong> the ${nm} in the ${alive.length === 1 ? "one surviving run is " + f2(ends[0]) : (alive.length < 5 ? alive.length + " surviving" : "five") + " runs ranges from " + f2(Math.min(...ends)) + " to " + f2(Math.max(...ends))}; expected without chance ${f2(show === "allele" ? ex[o.G] : exPh[o.G])}.${dead ? ` (${dead} run${dead > 1 ? "s" : ""} died out and ${dead > 1 ? "are" : "is"} not included.)` : ""}` : `<strong>All five runs died out before generation ${o.G}.</strong>`;
      g("out").innerHTML = `${head}<br><span class="small">Reproductive success (chance of surviving × offspring per survivor): ${esc(p.dom)} ${f2(wD)}, ${esc(p.rec)} ${f2(wR)}.${Math.abs(wD - wR) < 1e-9 ? " Equal: any change is due to chance (genetic drift)." : ""}</span>`;
      const last = rs[0].last; g("strip").innerHTML = last ? A().strip(last, p) : "";
      g("stripcap").textContent = last ? `Run 1, generation ${last.gen}: ${o.N > 100 ? "the first 100 of " + o.N + " individuals" : "all " + o.N + " individuals"}. ${last.surv.filter((s) => !s).length} of these did not survive to breed.` : ""; };
    g("preset").addEventListener("change", () => { key = g("preset").value; fill(); draw(); });
    ["sD", "fD", "sR", "fR", "N", "p0", "G"].forEach((r) => g(r).addEventListener("change", draw));
    $$(`input[name=ns-y-${u}]`, host).forEach((x) => x.addEventListener("change", () => { show = x.value; draw(); }));
    g("again").addEventListener("click", () => { set++; draw(); });
    fill(); draw(); qCarousel(spec, host);
    host._ns = { preset: (k) => { key = k; g("preset").value = k; fill(); draw(); }, redraw: draw };
  };

  // ===================================== Selection Curve Explorer (3.3.8.2) =====================================
  const ENV = { directional: "Drought: only large, hard seeds are left. Birds with deeper beaks can crack them, so they are more likely to survive.",
    stabilising: "Medium-sized seeds are the most plentiful. Birds with beaks of intermediate depth feed best; very shallow and very deep beaks do worst.",
    disruptive: "Only small soft seeds and large hard seeds are available, with few medium seeds. Birds with shallow or deep beaks feed well; intermediate beaks do worst." };
  B.interactives.selectionCurves = function (spec, host) {
    const modes = ["directional", "stabilising", "disruptive"]; let mode = "directional";
    host.innerHTML = head(spec, "choose a type of selection") + B.ix.split(`<div class="figure"><div class="fig-view" data-r="pic"></div>
      <p class="tiny" style="margin:.2rem 0 0"><span style="display:inline-block;width:.9em;height:.9em;background:#b8c2cc;vertical-align:middle"></span> Before selection <span data-r="key" style="display:inline-block;width:.9em;height:.9em;vertical-align:middle;margin-left:.7em"></span> After selection <span style="display:inline-block;width:1.4em;border-top:2px dashed #a3620f;vertical-align:middle;margin-left:.7em"></span> Chance of surviving (right axis)</p></div>`, `
      <div class="row" data-r="modes" aria-label="Type of selection" style="gap:.3rem;flex-wrap:wrap"></div>
      <p class="small" data-r="env" style="margin:.4rem 0"></p>
      <label class="small">Generations of selection <select data-r="g" style="${SEL}">${opts([1, 2, 3], 1)}</select></label>
      <table class="tbl small mt" aria-live="polite"><thead><tr><th></th><th>Before</th><th>After</th></tr></thead><tbody data-r="tab"></tbody></table>`, { label: "Selection Curve Explorer controls" }) +
      `<p class="tiny muted mt">Hypothetical data for 200 birds. Simplified model: beak depth is inherited and offspring have the same spread of beak depths as their surviving parents. Real distributions need not be symmetrical, and real selection is often more complex.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), tab = $("[data-r=tab]", host), gs = $("[data-r=g]", host);
    const draw = () => { const g = +gs.value; const C = M().curves; const b = C.stats(C.BEFORE), a = C.stats(C.after(mode, g));
      pic.innerHTML = A().histogram(mode, g); $("[data-r=key]", host).style.background = A().MODECOL[mode]; $("[data-r=env]", host).textContent = ENV[mode];
      tab.innerHTML = `<tr><th>Mean beak depth / mm</th><td>${b.mean.toFixed(2)}</td><td>${a.mean.toFixed(2)}</td></tr><tr><th>Standard deviation / mm</th><td>${b.sd.toFixed(2)}</td><td>${a.sd.toFixed(2)}</td></tr><tr><th>Birds surviving the first generation</th><td colspan="2">${C.survivedPct(mode).toFixed(1)} %</td></tr>`; };
    tabs($("[data-r=modes]", host), modes.map((m) => m[0].toUpperCase() + m.slice(1)), (i) => { mode = modes[i]; draw(); });
    gs.addEventListener("change", draw); qCarousel(spec, host);
    host._sc = { mode: (m) => { mode = m; draw(); } };
  };

  // ===================================== Speciation Explorer (3.3.8.2) =====================================
  B.interactives.speciationExplorer = function (spec, host) {
    const E = M().speciation.EXPLORER; let mode = "allo", i = 0; const shown = {};
    host.innerHTML = head(spec, "step through") + B.ix.split(`<div class="figure"><div class="fig-view" data-r="pic"></div><p class="small" data-r="cap" style="margin:.3rem 0 0"></p></div>`, `
      <div class="row" data-r="modes" aria-label="Type of speciation" style="gap:.3rem;flex-wrap:wrap"></div>
      <p class="tiny muted" data-r="src" style="margin:.3rem 0 0"></p>
      <div class="row" style="gap:.4rem;align-items:center;flex-wrap:wrap;margin:.35rem 0"><button type="button" class="btn sm" data-r="prev">← Previous stage</button><span class="small" data-r="pos" aria-live="polite"></span><button type="button" class="btn sm" data-r="next">Next stage →</button></div>
      <h4 data-r="head" style="margin:.3rem 0 .2rem"></h4><p class="small" data-r="text" style="margin:0 0 .4rem"></p>
      <div style="border:1px solid var(--line);border-radius:10px;padding:.5rem .6rem"><p class="small" style="margin:0 0 .35rem" data-r="ask"></p>
        <button type="button" class="btn sm primary" data-r="test">Check this stage</button><div data-r="res" aria-live="polite"></div></div>`, { label: "Speciation Explorer controls" }) + qBlock(spec);
    const g = (r) => $(`[data-r=${r}]`, host);
    const draw = () => { const S = E[mode].stages; const st = S[i]; g("pic").innerHTML = A().scene(mode, i); g("cap").textContent = A().sceneCaption(mode, i); g("src").textContent = E[mode].source; g("pos").textContent = `Stage ${i + 1} of ${S.length}`;
      g("ask").innerHTML = `<strong>Fertile-offspring test.</strong> ${i === 0 ? "Can members of this population interbreed and produce fertile offspring?" : "If members of the two groups met, could they interbreed and produce fertile offspring?"} Decide, then check.`; g("head").textContent = st.head; g("text").textContent = st.text; g("prev").disabled = i === 0; g("next").disabled = i === S.length - 1;
      const k = mode + i; if (!shown[k]) { g("res").innerHTML = ""; return; } const t = st.test; const yn = (b) => (b ? "yes" : "no");
      const verdict = t.one ? (i === 0 ? "One species." : "Still one species: they could still interbreed to produce fertile offspring.") : "Two species: members of the two populations can no longer interbreed to produce fertile offspring.";
      g("res").innerHTML = fb(t.one ? "neutral" : "ok", `Mate: ${yn(t.mate)}. Offspring: ${yn(t.off)}. Fertile offspring: ${yn(t.fert)}.<br><strong>${verdict}</strong>${mode === "allo" && (i === 1 || i === 2) ? " Separation is not speciation." : ""}`); };
    g("test").addEventListener("click", () => { shown[mode + i] = true; draw(); });
    g("prev").addEventListener("click", () => { if (i > 0) { i--; draw(); } }); g("next").addEventListener("click", () => { if (i < E[mode].stages.length - 1) { i++; draw(); } });
    tabs(g("modes"), ["Allopatric", "Sympatric"], (k) => { mode = k ? "sym" : "allo"; i = 0; draw(); }); qCarousel(spec, host);
    host._sp = { go: (m, k) => { mode = m; i = k; draw(); }, test: () => g("test").click() };
  };

  // ===================================== Speciation Sequence Challenge (3.3.8.2) =====================================
  B.interactives.speciationSequence = function (spec, host) {
    const S = M().speciation; let tk = "A"; const state = {};
    const init = (t) => { const T = S.TASKS[t]; const ids = Object.keys(T.cards); const r = M().rng(t === "A" ? 31 : 47); const sh = ids.map((k) => [r(), k]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); return { order: sh, use: Object.fromEntries(ids.map((k) => [k, true])), checked: false, tries: 0 }; };
    host.innerHTML = head(spec, "order the cards") + `<div class="row" data-r="tasks" aria-label="Choose a task" style="gap:.3rem;flex-wrap:wrap"></div>
      <p class="small" data-r="intro" style="margin:.4rem 0"></p><p class="tiny muted" style="margin:0 0 .3rem">Move each card up or down. Untick any card that does not belong. More than one order can be right where two steps can happen in either order.</p>
      <ol data-r="list" style="padding-left:1.4rem;margin:.2rem 0"></ol>
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-r="check">Check</button><button type="button" class="btn sm" data-r="reset">Shuffle again</button></div>
      <div data-r="fb" aria-live="polite"></div>`;
    const g = (r) => $(`[data-r=${r}]`, host);
    const draw = (focusKey, dir) => { const T = S.TASKS[tk], st = state[tk]; g("intro").textContent = T.intro;
      g("list").innerHTML = st.order.map((k, n) => `<li style="margin:.25rem 0"><div class="row" style="gap:.35rem;align-items:center;flex-wrap:nowrap;border:1px solid var(--line);border-radius:8px;padding:.3rem .45rem;background:var(--surface)${st.use[k] ? "" : ";opacity:.55"}">
        <label class="small" style="flex:1"><input type="checkbox" data-use="${k}"${st.use[k] ? " checked" : ""}> ${esc(T.cards[k])}</label>
        <button type="button" class="btn sm" data-up="${k}" aria-label="Move up: ${esc(T.cards[k])}"${n === 0 ? " disabled" : ""}>↑</button><button type="button" class="btn sm" data-dn="${k}" aria-label="Move down: ${esc(T.cards[k])}"${n === st.order.length - 1 ? " disabled" : ""}>↓</button></div></li>`).join("");
      $$("[data-use]", host).forEach((c) => c.addEventListener("change", () => { st.use[c.dataset.use] = c.checked; st.checked = false; draw(); }));
      const mv = (k, d) => { const j = st.order.indexOf(k), t = j + d; if (t < 0 || t >= st.order.length) return; [st.order[j], st.order[t]] = [st.order[t], st.order[j]]; st.checked = false; draw(k, d); };
      $$("[data-up]", host).forEach((b) => b.addEventListener("click", () => mv(b.dataset.up, -1))); $$("[data-dn]", host).forEach((b) => b.addEventListener("click", () => mv(b.dataset.dn, 1)));
      if (focusKey) { const b = $(`[data-${dir < 0 ? "up" : "dn"}="${focusKey}"]`, host); const alt = $(`[data-${dir < 0 ? "dn" : "up"}="${focusKey}"]`, host); (b && !b.disabled ? b : alt).focus(); }
      if (!st.checked) { g("fb").innerHTML = ""; return; }
      const order = st.order.filter((k) => st.use[k]); const r = S.check(tk, order);
      if (r.ok) { g("fb").innerHTML = fb("ok", `<strong>Correct.</strong> ${T.kind === "allopatric" ? "A geographical barrier stops gene flow; the gene pools change separately until members can no longer interbreed to produce fertile offspring." : "No barrier: mating mostly within each group reduces gene flow, so the gene pools change separately until members can no longer interbreed to produce fertile offspring."}`); return; }
      const msgs = [...r.wrongIn.map((k) => `“${esc(T.cards[k])}” does not belong: ${esc(T.distractors[k])}`), ...(r.missing.length ? [`${r.missing.length} card${r.missing.length > 1 ? "s that belong are" : " that belongs is"} unticked.`] : []), ...(r.broken.length ? [esc(r.broken[0])] : [])];
      g("fb").innerHTML = fb("bad", `<strong>Not yet.</strong><ul style="margin:.2rem 0 0;padding-left:1.1rem">${msgs.map((m) => `<li>${m}</li>`).join("")}</ul>`); };
    g("check").addEventListener("click", () => { state[tk].checked = true; state[tk].tries++; draw(); });
    g("reset").addEventListener("click", () => { const t = state[tk].tries; state[tk] = init(tk); const r = M().rng(100 + t); state[tk].order.sort(() => r() - 0.5); draw(); });
    ["A", "B"].forEach((t) => (state[t] = init(t)));
    tabs(g("tasks"), Object.values(S.TASKS).map((T) => `${T.kind[0].toUpperCase() + T.kind.slice(1)}: ${T.title.toLowerCase()}`), (i) => { tk = i ? "B" : "A"; draw(); });
    host._sq = { set: (t, order) => { tk = t; const st = state[t]; st.order = order.concat(st.order.filter((k) => !order.includes(k))); Object.keys(st.use).forEach((k) => (st.use[k] = order.includes(k))); st.checked = true; draw(); } };
  };
})(window.BIO);
