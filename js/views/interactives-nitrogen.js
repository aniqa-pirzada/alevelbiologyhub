// Interactives for 3.3.5.3 The nitrogen cycle (Phase 5 Batch 3, author B2).
// Kinds: nitrogenCycle (Nitrogen Cycle Simulator), fertiliserField (Fertiliser and Leaching Model), eutrophication
// (Eutrophication Sequence), cycleCompare (Carbon and Nitrogen Cycles Compared).
// Models and drawings: B.nitrogenModel and B.nitrogenArt (data/content/_nitrogen-art.js, where the rules, assumptions,
// sources and hand-worked test cases are documented; validate() checks them). Students see only a one-line
// "Simplified model" note.
// No answer is shown before the student has answered: the simulator's first tab is the labelling question, whose drawing
// carries numbers only; the labelled cycle (Explore, Change the conditions) opens once that question is answered; the
// reasons behind the condition changes stay hidden until the matching question is answered; the eutrophication stepper
// opens only after the sequence question; the comparison shows its key only after Check.
// Accessibility: native buttons, radios and range input; arrows in the cycle are focusable (Enter or Space selects); tab
// rows respond to the arrow keys; readouts are polite live regions; nothing moves, so reduced motion needs no special case.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.nitrogenModel, A = () => B.nitrogenArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const phone = () => typeof innerWidth !== "undefined" && innerWidth < 600;
  const SWIPE = `<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
  const fv = (attrs) => `<div class="fig-view${phone() ? " ix-hscroll" : ""}" ${attrs}></div>${phone() ? SWIPE : ""}`;
  const renderQ = (q, into, onAnswer) => into.append(B.questions.render(q, { onAnswer: () => setTimeout(onAnswer, 0) }));
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(start); return show; };
  const radios = (name, legend, opts, val) => `<fieldset><legend>${esc(legend)}</legend>${opts.map(([v, l]) => `<label class="small"><input type="radio" name="${name}" value="${v}"${v === val ? " checked" : ""}> ${esc(l)}</label>`).join("")}</fieldset>`;
  const LEVEL = ["not happening", "slow", "normal", "fast"];

  // ===================================== Nitrogen Cycle Simulator =====================================
  B.interactives.nitrogenCycle = function (spec, host) {
    const C = M().cycle; const u = uidOf(); const qs = spec.questions || []; const labelQ = qs.find((q) => q.type === "label"); const others = qs.filter((q) => q !== labelQ);
    const gate = spec.gates || {}; // { quiz: qid, wet: qid, legume: qid }
    let sel = null, soil = "aerated", leg = "absent", pending = null, tab = 0, shownRates = C.rates("aerated", "absent"), lastFb = "";
    host.innerHTML = head(spec, "name, then explore") + `<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap;margin-top:.5rem" aria-label="choose a part"></div>
      <div data-r="p1"><p class="small mt">Name the process shown by each numbered arrow. The labelled cycle opens when you have answered.</p><div data-r="quiz"></div></div>
      <div data-r="p23" hidden>${B.ix.split(`<div class="figure" style="max-width:820px;margin:0 auto">${fv('data-r="pic"')}</div>`, `
        <div data-r="lock" class="ix-readout" hidden>Answer the labelling question in part 1 first.</div>
        <div data-r="ex" style="flex-basis:100%"><label class="small">Process <select data-r="sel"><option value="">choose…</option>${C.PROC.map((p) => `<option value="${p.k}">${esc(p.name)} (${esc(C.POOLS[p.from].n.toLowerCase())} to ${esc(C.POOLS[p.to].n.toLowerCase())})</option>`).join("")}</select></label>
          <div class="ix-readout" data-r="info" aria-live="polite" style="margin-top:.35rem">Select an arrow in the cycle to read about that process.</div></div>
        <div data-r="co" hidden style="flex-basis:100%"><div style="display:flex;flex-wrap:wrap;gap:.4rem .8rem">${radios(`soil-${u}`, "Soil", [["aerated", "Well aerated (drained, ploughed)"], ["waterlogged", "Waterlogged (little oxygen)"]], "aerated").replace("<fieldset>", '<fieldset style="flex:1 1 220px">')}${radios(`leg-${u}`, "Legumes (clover, peas, beans)", [["absent", "None growing"], ["present", "Growing"]], "absent").replace("<fieldset>", '<fieldset style="flex:1 1 220px">')}</div>
          <div data-r="pred" hidden style="margin-top:.4rem"></div><div class="ix-readout" data-r="cinfo" aria-live="polite" style="margin-top:.4rem"></div></div>`, { label: "Nitrogen Cycle Simulator controls", cls: "ix-stack" })}
      <p class="tiny muted mt">Simplified model: arrow thickness shows only whether a process speeds up or slows down, not a measured rate. Plants can also absorb ammonium ions; lightning, leaching and fertilisers are not shown.</p></div>
      ${others.length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : ""}`;
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), cinfo = $("[data-r=cinfo]", host), predBox = $("[data-r=pred]", host), selBox = $("[data-r=sel]", host);
    const open = () => !labelQ || M().answered(labelQ.id);
    const draw = () => { const rt = tab === 1 ? C.rates("aerated", "present") : shownRates; pic.innerHTML = A().cycle({ sel: tab === 1 ? sel : null, rates: rt });
      $$("[data-proc]", pic).forEach((g) => { const go = () => { if (tab !== 1) return; pick(g.dataset.proc); }; g.addEventListener("click", go); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); }); };
    const pick = (k) => { sel = k || null; selBox.value = sel || ""; const p = sel && C.proc(sel);
      info.innerHTML = p ? `<strong>${esc(p.name)}</strong>${p.bact ? ' <span class="badge teal">bacteria</span>' : ""}<br>From: ${esc(C.POOLS[p.from].n.toLowerCase())}<br>To: ${esc(C.POOLS[p.to].n.toLowerCase())}${p.who ? `<br>By: ${esc(p.who)}` : ""}<br>${esc(p.what)}${p.cond ? `<br><em>${esc(p.cond)}</em>` : ""}` : "Select an arrow in the cycle to read about that process."; draw(); };
    selBox.addEventListener("change", () => pick(selBox.value));
    const condText = () => { const rt = shownRates; const wet = soil === "waterlogged";
      let h = `<strong>${wet ? "Waterlogged" : "Well-aerated"} soil, ${leg === "present" ? "legumes growing" : "no legumes"}.</strong><br>Nitrification: ${LEVEL[rt.nit1]}. Denitrification: ${LEVEL[rt.den]}. Absorption by roots: ${LEVEL[rt.upt]}. Nitrogen fixation by Rhizobium: ${LEVEL[rt.fixR]}.<br>Soil nitrate: ${esc(C.nitrateText(soil))}.`;
      if (leg === "present") h += `<br>More nitrogen enters the ecosystem; when legume remains decompose, ammonification and nitrification add ammonium and nitrate ions to the soil.`;
      const why = []; let hidden = false;
      if (wet) { if (gate.wet && !M().answered(gate.wet)) hidden = true; else why.push(`Why: nitrifying bacteria need oxygen; denitrifying bacteria use nitrate when oxygen is short; root cells have less oxygen for aerobic respiration, so less ATP for active transport.`); }
      if (leg === "present") { if (gate.legume && !M().answered(gate.legume)) hidden = true; else why.push(`Why: Rhizobium in the root nodules fixes nitrogen gas into ammonia, which the legume uses to make amino acids.`); }
      if (hidden) why.push(`<em>Answer the two written questions below the simulator to see why.</em>`);
      cinfo.innerHTML = (lastFb || "") + h + (why.length ? `<br>${why.join("<br>")}` : ""); };
    const ask = (change, wantKeys) => { pending = change; const sel3 = (k, l) => `<label class="small">${esc(l)} <select data-p="${k}"><option value="">choose…</option><option>faster</option><option>slower</option><option>no change</option></select></label>`;
      predBox.hidden = false; cinfo.hidden = true; lastFb = ""; predBox.innerHTML = `<div class="ix-readout"><strong>Predict first.</strong> What happens to each process?<br>${wantKeys.map(([k, l]) => sel3(k, l)).join(" ")}<br><button type="button" class="btn sm primary" data-a="pc">Check my prediction</button></div>`;
      $$("input[type=radio]", host).forEach((r) => (r.disabled = true));
      $("[data-a=pc]", predBox).addEventListener("click", () => { const g = {}; for (const [k] of wantKeys) { g[k] = $(`[data-p="${k}"]`, predBox).value; if (!g[k]) { B.util.toast("Make a prediction for each process first."); return; } }
        const ok = C.predict(change, g); shownRates = C.rates(soil, leg); lastFb = `<div class="feedback ${ok ? "ok" : "neutral"}" style="margin:0 0 .35rem"><strong>${ok ? "Your prediction was right." : "Not this time."}</strong> Look at the arrows: thicker means faster.</div>`; predBox.hidden = true; predBox.innerHTML = ""; cinfo.hidden = false; pending = null;
        $$("input[type=radio]", host).forEach((r) => (r.disabled = false)); condText(); draw(); }); };
    $$(`input[name=soil-${u}]`, host).forEach((r) => r.addEventListener("change", () => { const was = soil; soil = r.value; if (was === soil) return; ask(soil === "waterlogged" ? "wet" : "dry", [["nit", "Nitrification"], ["den", "Denitrification"]]); }));
    $$(`input[name=leg-${u}]`, host).forEach((r) => r.addEventListener("change", () => { const was = leg; leg = r.value; if (was === leg) return; if (leg === "present") ask("legume", [["fix", "Nitrogen fixation"]]); else { shownRates = C.rates(soil, leg); predBox.hidden = true; cinfo.hidden = false; lastFb = ""; condText(); draw(); } }));
    const p1 = $("[data-r=p1]", host), p23 = $("[data-r=p23]", host), lock = $("[data-r=lock]", host), ex = $("[data-r=ex]", host), co = $("[data-r=co]", host);
    const show = (i) => { tab = i; p1.hidden = i !== 0; p23.hidden = i === 0; if (i === 0) return; const o = open(); lock.hidden = o; ex.hidden = !o || i !== 1; co.hidden = !o || i !== 2; $(".ix-stage", host).style.visibility = o ? "" : "hidden"; if (!o) return; if (i === 2) condText(); draw(); };
    if (labelQ) renderQ(labelQ, $("[data-r=quiz]", host), () => { if (tab) show(tab); });
    const into = $("[data-qs]", host); others.forEach((q) => renderQ(q, into, () => { if (tab === 2) condText(); }));
    const showTab = tabs($("[data-r=tabs]", host), ["1. Name the processes", "2. Explore", "3. Change the conditions"], show, 0);
    host._nc = { tab: (i) => showTab(i), pick, state: () => ({ tab, sel, soil, leg, pending, open: open(), rates: shownRates }) };
  };

  // ===================================== Fertiliser and Leaching Model =====================================
  B.interactives.fertiliserField = function (spec, host) {
    const MF = M().FIELD; const u = uidOf(); let type = "artificial", F = 0, weather = "dry";
    host.innerHTML = head(spec, "try it") + B.ix.split(`<div class="figure"><div class="fig-view" data-r="pic"></div></div><div data-r="bars"></div>`, `
      ${radios(`ft-${u}`, "Fertiliser", [["artificial", "Artificial (inorganic ions)"], ["natural", "Natural (manure)"]], "artificial")}
      <label class="small">Nitrogen applied: <strong data-r="fv">0</strong> kg ha⁻¹<input type="range" min="0" max="${MF.Fmax}" step="${MF.step}" value="0" data-r="F" aria-label="nitrogen applied, kilograms per hectare"></label>
      ${radios(`fw-${u}`, "Weather after spreading", [["dry", "Dry for some weeks"], ["heavy", "Heavy rain soon after"]], "dry")}
      <div class="ix-readout" data-r="out" aria-live="polite"></div>`, { label: "Fertiliser and Leaching Model controls" }) + `<p class="tiny muted mt">Simplified model of one hypothetical field over one growing season, with illustrative values chosen for clarity, not measurements. In this model the crop takes up its nitrate before any is leached, so rain lowers only the surplus; in reality rain soon after spreading can wash nitrate away before the crop absorbs it. Real uptake, release from manure and leaching vary with soil, crop, temperature and timing. Manure can also cause eutrophication if it is washed into rivers, and its nitrogen can be leached in later years.</p>` + ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
    const pic = $("[data-r=pic]", host), out = $("[data-r=out]", host), bars = $("[data-r=bars]", host);
    const bar = (parts, total) => { const L = 600; let x = 0; const segs = parts.map(([, v, c]) => { const w = (v / total) * L; const r = `<rect x="${x.toFixed(1)}" y="0" width="${Math.max(0, w).toFixed(1)}" height="30" fill="${c}" stroke="#fff"/>`; x += w; return r; }).join("");
      return `<svg viewBox="0 0 ${L} 30" width="${L}" preserveAspectRatio="none" aria-hidden="true" style="width:100%;height:28px;background:#fff;display:block;max-height:none">${segs}</svg>`; };
    const render = () => { const o = M().field(type, F, weather); pic.innerHTML = A().field({ ...o, type, F, weather }); $("[data-r=fv]", host).textContent = F;
      const parts = [["Taken up by the crop", o.U, "#3f8a3a"], ["Left in the soil", o.soil, "#c9a46a"], ["Leached towards the river", o.L, "#2f6fb0"]];
      bars.innerHTML = `<p class="tiny muted" style="margin:.3rem 0 .2rem">Where the mineral nitrogen in the soil went this season</p>${bar(parts, o.A)}<ul class="small" style="list-style:none;padding:0;margin:.3rem 0 0;display:flex;flex-wrap:wrap;gap:.2rem 1rem">${parts.map(([l, v, c]) => `<li><span aria-hidden="true" style="display:inline-block;width:.8rem;height:.8rem;background:${c};border-radius:2px;margin-right:.3rem"></span>${l}: ${Math.round(v)} kg ha⁻¹</li>`).join("")}</ul>`;
      out.innerHTML = `Crop yield: <strong>${Math.round(o.Y)} %</strong> of the most this crop can produce<br>Nitrogen removed in the harvested crop: ${Math.round(o.U)} kg ha⁻¹<br>Nitrate leached towards the river: <strong>${Math.round(o.L)} kg ha⁻¹</strong><br>Risk of eutrophication in the river: <strong>${o.risk}</strong>${type === "natural" ? `<br>Nitrogen still held in the manure's organic compounds (released in later years): ${Math.round(o.organic)} kg ha⁻¹` : ""}`; };
    $$(`input[name=ft-${u}]`, host).forEach((r) => r.addEventListener("change", () => { type = r.value; render(); }));
    $$(`input[name=fw-${u}]`, host).forEach((r) => r.addEventListener("change", () => { weather = r.value; render(); }));
    $("[data-r=F]", host).addEventListener("input", (e) => { F = +e.target.value; render(); });
    const into = $("[data-qs]", host); (spec.questions || []).forEach((q) => renderQ(q, into, () => {}));
    render();
    host._ff = { set: (t, f, w) => { type = t; F = f; weather = w; $(`input[name=ft-${u}][value=${t}]`, host).checked = true; $(`input[name=fw-${u}][value=${w}]`, host).checked = true; $("[data-r=F]", host).value = f; render(); }, state: () => ({ type, F, weather, ...M().field(type, F, weather) }) };
  };

  // ===================================== Eutrophication Sequence =====================================
  B.interactives.eutrophication = function (spec, host) {
    const L = M().lake; const qs = spec.questions || []; const seqQ = qs.find((q) => q.type === "sequence"); let i = 0;
    host.innerHTML = head(spec, "order, then step through") + B.ix.split(`<div class="figure">${fv('data-r="pic"')}</div>`, `
      <div class="ix-readout" data-r="txt" aria-live="polite"></div>
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="prev">← Previous stage</button><button type="button" class="btn sm primary" data-a="next">Next stage →</button><button type="button" class="btn sm" data-a="restart">Restart</button></div>`, { label: "Eutrophication Sequence controls" }) + `<p class="tiny muted mt">Simplified model: relative levels, not measurements. Nitrate is shown staying high because fertiliser keeps entering. Real blooms are seasonal, algae release oxygen near the surface in daylight, and in many lakes phosphate is the limiting nutrient.</p>` + (qs.length ? `<h4 class="mt">Questions</h4><p class="small muted">Put the events in order first; the stepper opens when you have answered.</p><div data-qs></div>` : "");
    const pic = $("[data-r=pic]", host), txt = $("[data-r=txt]", host);
    const open = () => !seqQ || M().answered(seqQ.id);
    const render = () => { const o = open(); if (!o) i = 0; pic.innerHTML = A().lake(i);
      txt.innerHTML = o ? `<strong>Stage ${i} of ${L.STAGES.length - 1}.</strong> ${esc(L.STAGES[i].t)}` : `<strong>The lake before any fertiliser enters.</strong> Answer the ordering question below to step through what happens next.`;
      $("[data-a=prev]", host).disabled = !o || i === 0; $("[data-a=next]", host).disabled = !o || i === L.STAGES.length - 1; $("[data-a=restart]", host).disabled = !o || i === 0; };
    $("[data-a=prev]", host).addEventListener("click", () => { if (i > 0) i--; render(); });
    $("[data-a=next]", host).addEventListener("click", () => { if (i < L.STAGES.length - 1) i++; render(); });
    $("[data-a=restart]", host).addEventListener("click", () => { i = 0; render(); });
    const into = $("[data-qs]", host); qs.forEach((q) => renderQ(q, into, render));
    render(); host._eu = { go: (n) => { if (open()) { i = n; render(); } }, state: () => ({ i, open: open() }) };
  };

  // ===================================== Carbon and Nitrogen Cycles Compared =====================================
  B.interactives.cycleCompare = function (spec, host) {
    const CM = M().compare; const u = uidOf(); const ans = CM.ITEMS.map(() => ""); let checked = false;
    const opts = [["carbon", "Carbon only"], ["nitrogen", "Nitrogen only"], ["both", "Both"]];
    host.innerHTML = head(spec, "challenge") + `<ol class="small" data-r="list" style="padding-left:1.4rem;margin:.6rem 0;display:grid;gap:.45rem">${CM.ITEMS.map((it, j) => `<li><span>${esc(it.s)}</span><fieldset style="border:0;padding:0;margin:.15rem 0 0;display:flex;flex-wrap:wrap;gap:.2rem .9rem"><legend class="sr-only" style="position:absolute;left:-9999px">Statement ${j + 1}</legend>${opts.map(([v, l]) => `<label><input type="radio" name="cc-${u}-${j}" value="${v}"> ${l}</label>`).join("")}</fieldset><div data-r="fb${j}"></div></li>`).join("")}</ol>
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="check" disabled>Check</button><button type="button" class="btn sm" data-a="reset">Start again</button></div><div data-r="sum" aria-live="polite" class="mt"></div>` + ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
    const btn = $("[data-a=check]", host);
    CM.ITEMS.forEach((_, j) => $$(`input[name=cc-${u}-${j}]`, host).forEach((r) => r.addEventListener("change", () => { ans[j] = r.value; btn.disabled = checked || !CM.complete(ans); })));
    btn.addEventListener("click", () => { if (!CM.complete(ans)) return; checked = true; btn.disabled = true;
      CM.ITEMS.forEach((it, j) => { const ok = ans[j] === it.k; $$(`input[name=cc-${u}-${j}]`, host).forEach((r) => (r.disabled = true)); $(`[data-r=fb${j}]`, host).innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}" style="margin-top:.2rem">${ok ? "Correct" : `Answer: ${opts.find((o) => o[0] === it.k)[1].toLowerCase()}`}. ${esc(it.why)}</div>`; });
      $("[data-r=sum]", host).innerHTML = `<div class="feedback neutral"><strong>${CM.score(ans)} of ${CM.ITEMS.length} correct.</strong></div>`; });
    $("[data-a=reset]", host).addEventListener("click", () => { checked = false; ans.fill(""); $$("input[type=radio]", host).forEach((r) => { if (r.name.startsWith(`cc-${u}`)) { r.checked = false; r.disabled = false; } }); CM.ITEMS.forEach((_, j) => ($(`[data-r=fb${j}]`, host).innerHTML = "")); $("[data-r=sum]", host).innerHTML = ""; btn.disabled = true; });
    const into = $("[data-qs]", host); (spec.questions || []).forEach((q) => renderQ(q, into, () => {}));
    host._cc = { answer: (arr) => arr.forEach((v, j) => { const r = $(`input[name=cc-${u}-${j}][value=${v}]`, host); if (r) { r.checked = true; r.dispatchEvent(new Event("change")); } }), check: () => btn.click() };
  };
})(window.BIO);
