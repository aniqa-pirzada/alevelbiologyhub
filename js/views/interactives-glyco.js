// Interactives for 3.3.3.1 Glycolysis and 3.3.3.2 Anaerobic respiration (Phase 5 Batch 2, author A1, 2026-11-17).
// Kinds: glycoExplorer (3.3.3.1); fermentModel, fermentChallenge (3.3.3.2). Drawings come from B.respArt and every count
// from B.glycoModel or B.fermentModel (data/content/_resp-art.js), so the picture, the numbers and the feedback cannot
// disagree. The models were specified and reviewed before building (A1-MODEL.md, review MR-A1).
// Accessibility: native buttons, radios and number inputs; text changes are announced in polite live regions; the
// glycolysis drawing also responds to the left and right arrow keys. No animation is used, so reduced motion needs no
// special case. Embedded questions use B.questions.render (marked, recorded, count towards mastery).
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const A = () => B.respArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const phone = () => typeof innerWidth !== "undefined" && innerWidth < 600;
  const SWIPE = `<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
  const fv = (attrs) => `<div class="fig-view${phone() ? " ix-hscroll" : ""}" ${attrs}></div>${phone() ? SWIPE : ""}`;
  const qBlock = (spec) => ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");

  // ===================================== Glycolysis Explorer (3.3.3.1) =====================================
  B.interactives.glycoExplorer = function (spec, host) {
    const M = B.glycoModel; let idx = 0;
    host.innerHTML = head(spec, "step through") + `<p class="small"><strong>Basis:</strong> everything is counted <strong>per one molecule of glucose</strong>.</p>` + B.ix.split(`
      <div class="row" data-r="steps" role="group" aria-label="steps of glycolysis" style="gap:.3rem;flex-wrap:wrap;margin-bottom:.3rem"></div>
      <div class="figure">${fv('data-r="pic" tabindex="0" role="group" aria-label="Glycolysis drawing; the left and right arrow keys change the step"')}</div>`, `
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm" data-a="back">← Back</button><button type="button" class="btn sm primary" data-a="next">Next →</button><button type="button" class="btn sm" data-a="reset">Start again</button></div>
      <div class="ix-readout" data-r="text" aria-live="polite"></div>
      <div data-r="ledger"></div>`, { label: "Glycolysis Explorer controls" }) + `<p class="tiny muted mt">Simplified model: five stages, counted per glucose. In a cell, glycolysis is a series of about ten enzyme-controlled reactions.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), txt = $("[data-r=text]", host), led = $("[data-r=ledger]", host), bar = $("[data-r=steps]", host);
    const names = ["Start", "1 Phosphorylation", "2 Second phosphate", "3 Split", "4 Oxidation"];
    bar.innerHTML = names.map((n, k) => `<button type="button" class="btn sm" data-s="${k}">${n}</button>`).join("");
    const show = (k) => { idx = Math.max(0, Math.min(4, k)); const S = M.STEPS[idx], st = M.state(idx);
      pic.innerHTML = A().glycolysis(idx);
      txt.innerHTML = `<strong>${esc(S.title)}</strong><br>${S.text}`;
      const row = (a, b) => `<tr><td>${a}</td><td><strong>${b}</strong></td></tr>`;
      const sign = (n) => (n > 0 ? "+" + n : n < 0 ? "−" + Math.abs(n) : "0");
      led.innerHTML = `<table class="tbl" style="width:100%"><thead><tr><th>Per glucose, so far</th><th>Number</th></tr></thead><tbody>${row("ATP used", st.invested)}${row("ATP made", st.produced)}${row("Net ATP", sign(st.net))}${row("Reduced NAD formed", st.nadh)}${row("Carbon atoms (in " + esc(st.mols[0][1] + " " + st.mols[0][0]) + ")", st.carbon)}${row("Carbon dioxide released", st.co2)}</tbody></table>`;
      $$("[data-s]", bar).forEach((b) => { const on = +b.dataset.s === idx; b.classList.toggle("primary", on); b.setAttribute("aria-current", on ? "step" : "false"); });
      $("[data-a=back]", host).disabled = idx === 0; $("[data-a=next]", host).disabled = idx === 4; };
    $$("[data-s]", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.s)));
    $("[data-a=back]", host).addEventListener("click", () => show(idx - 1));
    $("[data-a=next]", host).addEventListener("click", () => show(idx + 1));
    $("[data-a=reset]", host).addEventListener("click", () => show(0));
    pic.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); } });
    renderQs(spec.questions, $("[data-qs]", host) || host);
    show(0);
    host._gx = { show, step: () => idx }; // for tests
  };

  // ===================================== NAD regeneration model (3.3.3.2) =====================================
  B.interactives.fermentModel = function (spec, host) {
    const F = B.fermentModel, u = uidOf(); let st = F.create("none"), blocked = false;
    const PW = [["none", "No way to regenerate NAD (hypothetical)"], ["lactate", "Lactate pathway (animal cell)"], ["ethanol", "Ethanol pathway (yeast or plant cell)"]];
    host.innerHTML = head(spec, "respire glucose") + B.ix.split(`<div class="figure">${fv('data-r="pic"')}</div>`, `
      <fieldset class="ix-group" style="border:0;padding:0;margin:0"><legend class="ix-group-title">What happens to pyruvate</legend>
        ${PW.map(([v, l], i) => `<label class="small" style="display:block"><input type="radio" name="fm-${u}" value="${v}"${i ? "" : " checked"}> ${l}</label>`).join("")}</fieldset>
      <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="one">Respire one glucose</button><button type="button" class="btn sm" data-a="five">Respire five glucose</button><button type="button" class="btn sm" data-a="reset">Start again</button></div>
      <div class="ix-readout" data-r="msg" aria-live="polite"></div>
      <div data-r="tab"></div>`, { label: "NAD regeneration model controls" }) + `<p class="tiny muted mt">Simplified model: the cell has a tiny fixed amount of NAD (10 units) and no oxygen. Real cells have more NAD, but it is still used up within seconds if it is not regenerated.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), msg = $("[data-r=msg]", host), tab = $("[data-r=tab]", host);
    const draw = () => { pic.innerHTML = A().ferment(st, { blocked });
      const cIn = 6 * st.glucose, cOut = 3 * st.pyr + 3 * st.lac + 2 * st.eth + st.co2;
      tab.innerHTML = `<p class="small" style="margin:.35rem 0 0">Glucose used: <strong>${st.glucose}</strong>. Carbon atoms in the glucose used: <strong>${cIn}</strong>; in pyruvate and products: <strong>${cOut}</strong>.</p>`;
      const lim = st.ticks >= F.MAXT; $("[data-a=one]", host).disabled = lim; $("[data-a=five]", host).disabled = lim; };
    const pName = () => (st.pathway === "lactate" ? "lactate pathway" : "ethanol pathway");
    const step = (n) => { let ran = 0, stop = 0, regen = 0, lastBlocked = false; n = Math.min(n, F.MAXT - st.ticks);
      for (let i = 0; i < n; i++) { const r = F.tick(st); st = r.state; if (r.ran) ran++; else stop++; regen += r.regen; lastBlocked = !r.ran && !(r.regen > 0); }
      blocked = lastBlocked || (stop > 0 && st.nad < 2);
      const parts = [];
      if (ran) parts.push(`Glycolysis ran ${ran === 1 ? "once" : ran + " times"}: ${2 * ran} NAD accepted hydrogen and became reduced NAD, and ${2 * ran} ATP (net) were made.`);
      if (stop) parts.push(`<strong>Glycolysis could not run${n > 1 ? ` for ${stop} of these glucose` : " this time"}: there is no NAD to accept hydrogen from triose phosphate.</strong>`);
      if (st.pathway !== "none" && regen) parts.push(`The ${pName()} used ${regen} reduced NAD to convert pyruvate${st.pathway === "ethanol" ? ", releasing carbon dioxide" : ""}, so ${regen} NAD were regenerated${stop ? "; glycolysis can now continue" : ""}. No ATP was made by this step.`);
      if (st.pathway !== "none" && ran && regen === 2 * ran) parts.push(`<br><strong>Each glucose: 2 NAD reduced in glycolysis, then the same 2 regenerated by the pathway</strong>, so the NAD bin is full again after every glucose.`);
      if (st.pathway === "none" && st.nad < 2 && !stop) parts.push("All the NAD is now reduced. Try another glucose.");
      if (st.ticks >= F.MAXT) parts.push("That is the limit for this model. Choose Start again.");
      msg.innerHTML = parts.join(" ");
      draw(); };
    $$(`input[name=fm-${u}]`, host).forEach((r) => r.addEventListener("change", () => { if (!r.checked) return; const was = st.pathway; const res = F.setPathway(st, r.value); st = res.state; blocked = false;
      msg.innerHTML = res.reset ? `Started again with the ${r.value === "none" ? "hypothetical cell with no way to regenerate NAD" : r.value + " pathway"}: a cell uses one pathway, so the model resets when you change between them.` : was === "none" && res.regen ? `Same cell, now with the ${pName()}. It converted the ${res.regen} pyruvate waiting, using ${res.regen} reduced NAD${st.pathway === "ethanol" ? " and releasing carbon dioxide" : ""}: ${res.regen} NAD regenerated. Respire another glucose: glycolysis can run again.` : was === "none" && st.ticks ? `Same cell, now with the ${pName()}. Respire another glucose.` : "";
      draw(); }));
    $("[data-a=one]", host).addEventListener("click", () => step(1));
    $("[data-a=five]", host).addEventListener("click", () => step(5));
    $("[data-a=reset]", host).addEventListener("click", () => { st = F.create(st.pathway); blocked = false; msg.innerHTML = "Started again: all 10 units of NAD are oxidised."; draw(); });
    renderQs(spec.questions, $("[data-qs]", host) || host);
    msg.innerHTML = "Choose what happens to pyruvate, then respire glucose one at a time. Watch the NAD.";
    draw();
    host._fm = { state: () => st, step }; // for tests
  };

  // ===================================== Anaerobic Respiration Challenge (3.3.3.2) =====================================
  B.interactives.fermentChallenge = function (spec, host) {
    const F = B.fermentModel, C = F.CHALLENGE, u = uidOf(); let i = 0; const done = C.map(() => null), tries = C.map(() => 0);
    host.innerHTML = head(spec, "challenge") + `<div class="ix-readout" data-r="card"></div>
      <fieldset style="border:0;padding:0;margin:.5rem 0 0"><legend class="ix-group-title">Which pathway?</legend>
        <div class="row" style="gap:1.2rem;flex-wrap:wrap"><label class="small"><input type="radio" name="fc-${u}" value="lactate"> Lactate pathway</label><label class="small"><input type="radio" name="fc-${u}" value="ethanol"> Ethanol pathway</label></div></fieldset>
      <div class="row" style="gap:.8rem;flex-wrap:wrap;margin-top:.4rem">
        <label class="small" data-r="gl">Glucose molecules used <input type="number" min="0" step="1" inputmode="numeric" data-k="glucose" style="width:5rem"></label>
        <label class="small">Carbon dioxide molecules released <input type="number" min="0" step="1" inputmode="numeric" data-k="co2" style="width:5rem"></label>
        <label class="small">Net ATP made <input type="number" min="0" step="1" inputmode="numeric" data-k="atp" style="width:5rem"></label></div>
      <div class="row" style="gap:.4rem;margin-top:.5rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="check">Check</button><button type="button" class="btn sm" data-a="prev">← Previous</button><button type="button" class="btn sm" data-a="next">Next →</button><span class="small" data-r="score" aria-live="polite"></span></div>
      <div class="ix-readout mt" data-r="fb" aria-live="polite" hidden></div>`;
    const card = $("[data-r=card]", host), fb = $("[data-r=fb]", host), score = $("[data-r=score]", host), inp = (k) => $(`[data-k=${k}]`, host);
    const setScore = () => { score.textContent = `Score: ${done.filter((x) => x === true).length} of ${C.length}`; };
    const show = (k) => { i = Math.max(0, Math.min(C.length - 1, k)); const c = C[i];
      card.innerHTML = `<strong>Scenario ${i + 1} of ${C.length}</strong>${c.stretch ? ' <span class="badge">stretch</span>' : ""}<br>${esc(c.text)}`;
      $$(`input[name=fc-${u}]`, host).forEach((r) => { r.checked = false; }); ["glucose", "co2", "atp"].forEach((k2) => { inp(k2).value = ""; });
      $("[data-r=gl]", host).hidden = !c.askGlucose; fb.hidden = true; fb.innerHTML = "";
      $("[data-a=prev]", host).disabled = i === 0; $("[data-a=next]", host).disabled = i === C.length - 1; };
    const whole = (v) => /^\s*\d+\s*$/.test(v) ? +v : null;
    $("[data-a=check]", host).addEventListener("click", () => { const c = C[i], x = F.expected(c); const pick = ($(`input[name=fc-${u}]:checked`, host) || {}).value;
      const g = whole(inp("glucose").value), co = whole(inp("co2").value), at = whole(inp("atp").value);
      fb.hidden = false;
      if (!pick || co === null || at === null || (c.askGlucose && g === null)) { fb.innerHTML = "Choose a pathway and enter a whole number in every box."; return; }
      const ok = { p: pick === x.pathway, g: !c.askGlucose || g === x.glucose, co: co === x.co2, at: at === x.atp }; const all = ok.p && ok.g && ok.co && ok.at; done[i] = all;
      const prod = x.pathway === "lactate" ? `${x.lactate} lactate` : `${x.ethanol} ethanol`;
      const why = `${x.pathway === "lactate" ? "Animal cells and some bacteria such as Lactobacillus use the lactate pathway; it releases no carbon dioxide." : "Yeast and plant cells use the ethanol pathway, which releases one carbon dioxide for each pyruvate."} ${c.askGlucose ? `Each glucose gives 2 pyruvate, so 2 lactate: 8 ÷ 2 = ${x.glucose} glucose. ` : ""}Net ATP: 2 per glucose, all from glycolysis, so ${x.glucose} × 2 = ${x.atp}; the pathway itself makes none. Products: ${prod} and ${x.co2} carbon dioxide.`;
      const wrong = [!ok.p && "the pathway", !ok.g && "the glucose", !ok.co && "the carbon dioxide", !ok.at && "the ATP"].filter(Boolean);
      if (!all) tries[i]++;
      // the working is shown after a correct answer, after a second wrong attempt, or on request (review RD-14)
      if (all || tries[i] >= 2) fb.innerHTML = (all ? "<strong>Correct.</strong> " : `<strong>Not quite:</strong> check ${wrong.join(", ")}. Here is the working. `) + why;
      else { fb.innerHTML = `<strong>Not quite:</strong> check ${wrong.join(", ")}. Change your answer and press Check again. <button type="button" class="btn sm" data-a="work">Show working</button>`; $("[data-a=work]", fb).addEventListener("click", () => { fb.innerHTML = `<strong>Working.</strong> ${why}`; tries[i] = 2; }); }
      setScore(); });
    $("[data-a=prev]", host).addEventListener("click", () => show(i - 1));
    $("[data-a=next]", host).addEventListener("click", () => show(i + 1));
    setScore(); show(0);
    host._fc = { show }; // for tests
  };
})(window.BIO);
