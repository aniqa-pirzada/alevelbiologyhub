// Interactives for 3.3.4.1 Energy transfer and 3.3.4.2 Energy and human food production (Phase 5 Batch 2, author A3).
// Kinds: foodWebExplorer, pyramidBuilder, efficiencyCalc (3.3.4.1); productionCalc, farmingEvaluator (3.3.4.2).
// Models and drawings: B.energyModel and B.energyArt (data/content/_energy-art.js, where the rules, sources and test cases
// are documented; validate() checks the hand-computed cases). Students see only a one-line "Simplified model" note.
// No answer is shown before the student has answered: the explorer hides the readouts that a question asks for until that
// question is answered (B.energyModel.answered), and both calculators mark the student's own answer right or wrong, show
// the working only after a correct answer or "Show answer" (offered after a wrong attempt), and refuse any input set that
// belongs to a question not yet answered (B.energyModel.lockFor).
// Accessibility: native buttons, radios, selects and number inputs; organisms in the web are focusable (Enter or Space
// selects); tab rows respond to the arrow keys; readouts are polite live regions; nothing moves, so reduced motion needs no
// special case. Layout: B.ix.split.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.energyModel, A = () => B.energyArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const qBlock = (spec) => ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
  const renderQs = (spec, host, onAnswer) => { const into = $("[data-qs]", host); if (!into) return; (spec.questions || []).forEach((q) => into.append(B.questions.render(q, { onAnswer: () => setTimeout(onAnswer, 0) }))); };
  const phone = () => typeof innerWidth !== "undefined" && innerWidth < 600;
  const SWIPE = `<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
  const fv = (attrs) => `<div class="fig-view${phone() ? " ix-hscroll" : ""}" ${attrs}></div>${phone() ? SWIPE : ""}`;
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(start); return show; };
  const numIn = (k, label, w = "7rem") => `<label class="small" style="display:inline-flex;flex-direction:column;gap:.15rem">${label}<input type="number" min="0" step="any" inputmode="decimal" data-k="${k}" style="width:${w};padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"></label>`;
  const val = (host, k) => { const e = $(`[data-k="${k}"]`, host); const s = e ? String(e.value).trim() : ""; return s === "" ? NaN : Number(s); };
  const fmt = (x) => (Number.isInteger(x) ? A().fmtInt(x) : M().fmt(x)); // whole numbers as given; otherwise 3 significant figures
  const list = (ks) => ks.map((k) => M().web.org(k).n).join(", ") || "nothing in this web";

  // shared "check my answer" flow for the calculators. compute() returns { lock } | { err } | { exact, working, extra }
  function checker(host, compute, ansLabel) {
    const fb = $("[data-r=fb]", host), showBtn = $("[data-a=show]", host); let last = null;
    const reveal = (r, head) => { fb.innerHTML = `${head}<div class="mt small">${r.working}</div>${r.extra || ""}`; showBtn.hidden = true; };
    $("[data-a=check]", host).addEventListener("click", () => { const r = compute(); showBtn.hidden = true; last = null;
      if (r.lock) { fb.innerHTML = `<div class="feedback neutral"><strong>This is ${esc(r.lock.where)}.</strong> Answer it there first; then you can use these values here.</div>`; return; }
      if (r.err) { fb.innerHTML = `<div class="feedback bad">${esc(r.err)}</div>`; return; }
      const given = val(host, "ans"); if (!isFinite(given)) { fb.innerHTML = `<div class="feedback neutral">Work out the ${esc(ansLabel)} yourself, type it in, then press Check.</div>`; return; }
      if (M().near(given, r.exact)) reveal(r, `<div class="feedback ok"><strong>Correct.</strong></div>`);
      else { last = r; fb.innerHTML = `<div class="feedback neutral"><strong>Not quite.</strong> Check which value is which and that you used the right equation, then try again.</div>`; showBtn.hidden = false; } });
    showBtn.addEventListener("click", () => { if (last) reveal(last, `<div class="feedback neutral"><strong>Answer.</strong></div>`); });
    return () => { fb.innerHTML = ""; showBtn.hidden = true; last = null; };
  }
  const checkRow = (ansLabel, unit) => `<div class="row" style="gap:.5rem;align-items:flex-end;flex-wrap:wrap">${numIn("ans", esc(ansLabel) + (unit ? ` <span class="tiny muted">(${unit})</span>` : ""))}<button type="button" class="btn sm primary" data-a="check">Check</button><button type="button" class="btn sm" data-a="show" hidden>Show answer</button></div><div data-r="fb" aria-live="polite"></div>`;

  // ===================================== Food Web Explorer (3.3.4.1) =====================================
  B.interactives.foodWebExplorer = function (spec, host) {
    const W = M().web; const gates = spec.gates || {}; let sel = null, ci = 0, chains = [];
    const opts = W.ORGS.map((o) => `<option value="${o.k}">${esc(o.n)}</option>`).join("");
    host.innerHTML = head(spec, "click an organism") + B.ix.split(`<div class="figure">${fv('data-r="pic"')}</div>
      <p class="tiny muted" style="margin:.3rem 0 0"><span style="color:${A().COL.in};font-weight:700">Green arrows</span>: energy into the selected organism (what it eats). <span style="color:${A().COL.out};font-weight:700">Orange arrows</span>: energy out of it (what eats it).</p>`, `
      <label class="small">Organism <select data-r="sel"><option value="">choose…</option>${opts}</select></label>
      <div class="ix-readout" data-r="info" aria-live="polite">Click an organism in the web, or choose one from the list.</div>
      <div class="row" data-r="step" style="gap:.4rem" hidden><button type="button" class="btn sm" data-a="prev">← Previous chain</button><button type="button" class="btn sm" data-a="next">Next chain →</button><button type="button" class="btn sm" data-a="all">Show the whole web</button></div>
      <div class="ix-readout" data-r="chain" aria-live="polite" hidden></div>`, { label: "Food Web Explorer controls" }) + `<p class="tiny muted mt">Simplified model: a hypothetical farmland web; real webs have many more links and include decomposers, and food chains of six organisms are uncommon. An arrow does not show how much energy is transferred.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), step = $("[data-r=step]", host), chainBox = $("[data-r=chain]", host), selBox = $("[data-r=sel]", host);
    const locked = (k) => { const g = gates[k]; return g && !M().answered(g.q) ? g : null; };
    const draw = () => { const chain = sel && !step.hidden && ci >= 0 && chains[ci] && chainBox.dataset.on === "1" ? chains[ci] : null;
      pic.innerHTML = A().web({ sel, chain });
      $$("[data-org]", pic).forEach((g) => { g.addEventListener("click", () => pick(g.dataset.org)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g.dataset.org); } }); }); };
    const pick = (k) => { sel = k || null; ci = 0; chainBox.dataset.on = "0"; selBox.value = sel || ""; render(); };
    const render = () => {
      if (!sel) { info.innerHTML = "Click an organism in the web, or choose one from the list."; step.hidden = true; chainBox.hidden = true; draw(); return; }
      const o = W.org(sel), g = locked(sel); chains = W.chainsThrough(sel);
      const lv = W.levels(sel).map((n) => `${n} (${W.LEVEL_NAME[n]})`).join(", ");
      let h = `<strong>${esc(o.n)}</strong>${o.p ? " is a producer." : ""}<br>Eats: ${esc(o.p ? "nothing (it photosynthesises)" : list(W.eats(sel)))}<br>Eaten by: ${esc(list(W.eatenBy(sel)))}`;
      if (g) { h += `<br><em>${esc(g.msg)}</em>`; step.hidden = true; chainBox.hidden = true; }
      else { h += `<br>Trophic level${W.levels(sel).length > 1 ? "s" : ""}: ${lv}<br>Food chains in this web that include it: <strong>${chains.length}</strong>`; step.hidden = false; chainBox.hidden = chainBox.dataset.on !== "1"; if (chainBox.dataset.on === "1") chainBox.innerHTML = `Chain ${ci + 1} of ${chains.length}: ${chains[ci].map((k) => esc(W.org(k).n)).join(" → ")}`; }
      info.innerHTML = h; draw(); };
    const go = (d) => { if (!chains.length) return; if (chainBox.dataset.on !== "1") { chainBox.dataset.on = "1"; ci = 0; } else ci = (ci + d + chains.length) % chains.length; render(); };
    $("[data-a=next]", host).addEventListener("click", () => go(1)); $("[data-a=prev]", host).addEventListener("click", () => go(-1));
    $("[data-a=all]", host).addEventListener("click", () => { chainBox.dataset.on = "0"; render(); });
    selBox.addEventListener("change", () => pick(selBox.value));
    chainBox.dataset.on = "0"; renderQs(spec, host, render); render();
    host._fw = { pick, go, state: () => ({ sel, ci, locked: !!(sel && locked(sel)) }) };
  };

  // ===================================== Pyramid Builder (3.3.4.1) =====================================
  B.interactives.pyramidBuilder = function (spec, host) {
    const P = M().pyramid; const keys = Object.keys(P.SETS); const u = uidOf(); const why = spec.why || {}; let cur = 0, revealed = false;
    host.innerHTML = head(spec, "predict, then check") + B.ix.split(`<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose a data set"></div>
      <div class="figure"><div class="fig-view" data-r="pic"></div></div><p class="tiny muted" data-r="src" style="margin:.3rem 0 0"></p>`, `
      <div data-r="pred"><fieldset style="border:0;padding:0;margin:0"><legend class="small"><strong>Predict:</strong> what shape will this pyramid be?</legend>
        ${["upright", "inverted", "partly inverted"].map((s) => `<label class="small" style="display:block"><input type="radio" name="py-${u}" value="${s}"> ${s === "partly inverted" ? "Partly inverted (one level wider than the level below it)" : s[0].toUpperCase() + s.slice(1)}</label>`).join("")}</fieldset>
        <button type="button" class="btn sm primary" data-a="reveal">Check and draw the pyramid</button></div>
      <div data-r="own" hidden>
        <label class="small">Type of pyramid <select data-r="type"><option value="number">Numbers</option><option value="biomass">Biomass</option><option value="energy">Energy</option></select></label>
        <label class="small">Trophic levels <select data-r="n"><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label>
        <div class="small muted">Enter a value for each level, producers first.</div><div data-r="ins" class="row" style="gap:.4rem;flex-wrap:wrap"></div>
        <button type="button" class="btn sm primary" data-a="draw">Draw</button></div>
      <div class="ix-readout" data-r="info" aria-live="polite"></div>`, { label: "Pyramid Builder controls" }) + `<p class="tiny muted mt">Simplified model: bars drawn to scale; a bar under 1 % of the widest is drawn at a minimum width. Biomass is measured at one moment; numbers ignore the size of organisms, and parasites can make the top of a pyramid of numbers wider than the level below.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), src = $("[data-r=src]", host), pred = $("[data-r=pred]", host), own = $("[data-r=own]", host), ins = $("[data-r=ins]", host);
    const blank = (set) => A().pyramid({ hideBars: true, levels: set.levels, unit: set.unit, aria: "Pyramid hidden until you make a prediction" });
    const showSet = () => { const set = P.SETS[keys[cur]]; pred.hidden = false; own.hidden = true; src.textContent = set.note;
      if (!revealed) { pic.innerHTML = blank(set); info.innerHTML = `<strong>${esc(set.name)}.</strong> Look at the values, predict the shape, then check.`; $$(`input[name=py-${u}]`, host).forEach((r) => (r.checked = false)); return; }
      const v = set.levels.map((l) => l[1]); pic.innerHTML = A().pyramid({ levels: set.levels, unit: set.unit, aria: `${set.name} pyramid, ${P.SHAPE_TEXT[P.shape(v)]}` });
      const w = why[keys[cur]]; const reason = w ? (M().answered(w.q) ? ` ${w.text}` : ` <em>Why? ${esc(w.ask)}</em>`) : "";
      info.innerHTML = `<strong>${esc(set.name)}:</strong> ${P.SHAPE_TEXT[P.shape(v)]}.${reason}${set.side ? `<br><span class="tiny">${esc(set.side)}</span>` : ""}`; };
    $("[data-a=reveal]", host).addEventListener("click", () => { const ch = $(`input[name=py-${u}]:checked`, host); if (!ch) { info.innerHTML = "Choose a shape first."; return; }
      revealed = true; showSet(); const set = P.SETS[keys[cur]]; const ok = ch.value === set.shape; info.innerHTML = `<div class="feedback ${ok ? "ok" : "neutral"}"><strong>${ok ? "Your prediction was right." : `Not this time: you predicted ${esc(ch.value)}.`}</strong></div>` + info.innerHTML; });
    const inputs = () => { const n = +$("[data-r=n]", host).value; ins.innerHTML = Array.from({ length: n }, (_, i) => numIn("v" + i, i === 0 ? "Producers" : `Level ${i + 1}`, "6.5rem")).join(""); };
    $("[data-r=n]", host).addEventListener("change", inputs);
    $("[data-a=draw]", host).addEventListener("click", () => { const type = $("[data-r=type]", host).value; const n = +$("[data-r=n]", host).value; const v = Array.from({ length: n }, (_, i) => val(host, "v" + i)); const c = P.check(type, v);
      if (!c.ok) { const g = spec.energyGate; const msg = c.energy && g && !M().answered(g.q) ? g.msg : c.msg; info.innerHTML = `<div class="feedback bad">${esc(msg)}</div>`; pic.innerHTML = ""; return; }
      const unit = { number: "number of organisms", biomass: "biomass (same units at every level)", energy: "energy (same units at every level)" }[type];
      pic.innerHTML = A().pyramid({ levels: v.map((x, i) => [i === 0 ? "Producers" : `Level ${i + 1}`, x]), unit, aria: "Your pyramid" }); info.innerHTML = `Your pyramid of ${type === "number" ? "numbers" : type} is <strong>${P.SHAPE_TEXT[P.shape(v)]}</strong>.`; });
    tabs($("[data-r=tabs]", host), [...keys.map((k) => P.SETS[k].name), "Your own data"], (i) => { cur = i; revealed = false; if (i < keys.length) showSet(); else { pred.hidden = true; own.hidden = false; src.textContent = ""; pic.innerHTML = ""; info.innerHTML = "Enter your own values for each level, then draw the pyramid."; inputs(); } });
    renderQs(spec, host, () => { if (cur < keys.length && revealed) showSet(); });
    host._py = { pick: (i) => $$("[data-r=tabs] button", host)[i].click() };
  };

  // ===================================== Transfer Efficiency Calculator (3.3.4.1) =====================================
  B.interactives.efficiencyCalc = function (spec, host) {
    const E = M().efficiency; const units = ["kJ m⁻² yr⁻¹", "kcal m⁻² yr⁻¹"]; let mode = 0;
    host.innerHTML = head(spec, "check your working") + B.ix.split(`<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose a calculation"></div>
      <div data-r="m0"><div class="row" style="gap:.5rem;flex-wrap:wrap">${numIn("lo", "Energy in the lower trophic level")}${numIn("hi", "Energy in the higher trophic level")}</div></div>
      <div data-r="m1" hidden><div class="row" style="gap:.5rem;flex-wrap:wrap">${numIn("lo2", "Energy in the starting level")}${numIn("pc", "Efficiency of each transfer (%)", "6rem")}<label class="small" style="display:inline-flex;flex-direction:column;gap:.15rem">Number of transfers<select data-k="nt"><option>1</option><option selected>2</option><option>3</option></select></label></div></div>
      <label class="small">Units <select data-r="unit">${units.map((x) => `<option>${x}</option>`).join("")}</select></label>`, `
      <div data-r="ansrow"></div>`, { label: "Transfer Efficiency Calculator controls", cls: "ix-even" }) + `<p class="tiny muted mt">Use the same units, area and time for both levels. Work out the answer first; the calculator then checks it.</p>` + qBlock(spec);
    const unit = () => $("[data-r=unit]", host).value; let reset = () => {};
    const build = () => { $("[data-r=ansrow]", host).innerHTML = checkRow(mode ? "Energy in the last level" : "Efficiency", mode ? "" : "%");
      reset = checker(host, () => {
        if (mode === 0) { const lo = val(host, "lo"), hi = val(host, "hi"); if (!(lo > 0) || !(hi > 0)) return { err: "Enter a positive value for both levels." };
          if (!(hi < lo)) return { err: "The higher level cannot receive as much energy as the level below; check which value is which." };
          const L = M().lockFor("eff", [lo, hi]); if (L) return { lock: L }; const e = E.pct(lo, hi);
          return { exact: e, working: `Efficiency = ${fmt(hi)} ÷ ${fmt(lo)} × 100 = <strong>${fmt(e)} %</strong>.`, extra: `<div class="small">Energy not transferred to the next level: ${fmt(lo - hi)} ${unit()} (${fmt(100 - e)} %).</div>` }; }
        const lo = val(host, "lo2"), pc = val(host, "pc"), n = +$("[data-k=nt]", host).value; if (!(lo > 0)) return { err: "Enter a positive value for the starting level." }; if (!(pc > 0 && pc < 100)) return { err: "The efficiency must be more than 0 % and less than 100 %." };
        const L = M().lockFor("fwd", [lo, pc]); if (L) return { lock: L }; const out = E.forwards(lo, pc, n);
        return { exact: out[n - 1], working: out.map((x, i) => `Level ${i + 2}: ${fmt(i ? out[i - 1] : lo)} × ${fmt(pc)} ÷ 100 = <strong>${fmt(x)}</strong> ${unit()}`).join("<br>") }; }, mode ? "energy in the last level" : "efficiency"); };
    tabs($("[data-r=tabs]", host), ["Find the efficiency", "Energy at higher levels"], (i) => { mode = i; $("[data-r=m0]", host).hidden = i !== 0; $("[data-r=m1]", host).hidden = i !== 1; build(); });
    host.addEventListener("input", (e) => { if (e.target.dataset.k && e.target.dataset.k !== "ans") reset(); });
    renderQs(spec, host, () => {});
  };

  // ===================================== Production Calculator (3.3.4.2) =====================================
  B.interactives.productionCalc = function (spec, host) {
    const P = M().production; const C = { F: "#8d6e63", U: "#e0b040", R: "#d9534f", N: "#2f7d32", NPP: "#2f7d32" };
    const units = ["kJ m⁻² yr⁻¹", "kJ m⁻² day⁻¹", "MJ per animal per day"]; let mode = 0;
    host.innerHTML = head(spec, "check your working") + B.ix.split(`<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose plants or consumers"></div>
      <div data-r="m0"><label class="small">Find <select data-r="find0"><option value="npp">NPP</option><option value="gpp">GPP</option><option value="r">R (respiratory loss)</option></select></label>
        <div class="row" data-r="pin" style="gap:.5rem;flex-wrap:wrap"></div></div>
      <div data-r="m1" hidden><label class="small">Find <select data-r="find1"><option value="N">N (net production)</option><option value="R">R (respiratory loss)</option></select></label>
        <div class="row" data-r="cin" style="gap:.5rem;flex-wrap:wrap"></div>
        <div class="row" style="gap:.4rem;flex-wrap:wrap"><span class="small">Hypothetical livestock:</span>${Object.entries(P.PRESETS).map(([k, p]) => `<button type="button" class="btn sm" data-preset="${k}">${esc(p.name)}</button>`).join("")}</div></div>
      <label class="small">Units <select data-r="unit">${units.map((x) => `<option>${x}</option>`).join("")}</select></label>
      <div data-r="bar"></div>`, `<div data-r="ansrow"></div>`, { label: "Production Calculator controls", cls: "ix-even" }) + `<p class="tiny muted mt">Simplified model: all values are for the same area (or animal) and the same stated period (one day or one year). Work out the answer first; the calculator then checks it.</p>` + qBlock(spec);
    const unit = () => $("[data-r=unit]", host).value, bar = $("[data-r=bar]", host); let reset = () => {};
    const LBL = { gpp: "GPP", npp: "NPP", r: "R", I: "I (energy in food eaten)", F: "F (faeces)", U: "U (urine)", R: "R (respiratory loss)", N: "N (net production)" };
    const fields = () => { const f0 = $("[data-r=find0]", host).value, f1 = $("[data-r=find1]", host).value;
      $("[data-r=pin]", host).innerHTML = ["gpp", "r", "npp"].filter((k) => k !== f0).map((k) => numIn(k, LBL[k])).join("");
      $("[data-r=cin]", host).innerHTML = ["I", "F", "U", f1 === "N" ? "R" : "N"].map((k) => numIn("c" + k, LBL[k], "6rem")).join(""); bar.innerHTML = ""; };
    const build = () => { const f = mode ? $("[data-r=find1]", host).value : $("[data-r=find0]", host).value; $("[data-r=ansrow]", host).innerHTML = checkRow(mode ? LBL[f] : LBL[f], "");
      reset = checker(host, () => { bar.innerHTML = "";
        if (mode === 0) { const f0 = $("[data-r=find0]", host).value; const g = val(host, "gpp"), r = val(host, "r"), n = val(host, "npp");
          const known = f0 === "npp" ? [g, r] : f0 === "gpp" ? [r, n] : [g, n]; if (known.some((x) => !(x >= 0))) return { err: "Enter a value of 0 or more in both boxes." };
          const L = M().lockFor("plant", known); if (L) return { lock: L };
          let G, R, N; if (f0 === "npp") { G = g; R = r; N = P.npp(g, r); if (N === null) return { err: "R cannot be greater than GPP over this time." }; } else if (f0 === "gpp") { R = r; N = n; G = P.gpp(n, r); } else { G = g; N = n; R = P.rPlant(g, n); if (R === null) return { err: "NPP cannot be greater than GPP." }; }
          const exact = { npp: N, gpp: G, r: R }[f0]; const w = f0 === "npp" ? `NPP = GPP − R = ${fmt(G)} − ${fmt(R)} = <strong>${fmt(N)}</strong> ${unit()}` : f0 === "gpp" ? `GPP = NPP + R = ${fmt(N)} + ${fmt(R)} = <strong>${fmt(G)}</strong> ${unit()}` : `R = GPP − NPP = ${fmt(G)} − ${fmt(N)} = <strong>${fmt(R)}</strong> ${unit()}`;
          return { exact, working: w + (G > 0 ? `<br>NPP is ${A().pct(N, G)} % of GPP.` : ""), extra: G > 0 ? `<div class="mt">${A().bar([["R, respiratory loss", R, C.R], ["NPP", N, C.NPP]], G, unit())}</div>` : "" }; }
        const f1 = $("[data-r=find1]", host).value; const I = val(host, "cI"), F = val(host, "cF"), U = val(host, "cU"), X = val(host, f1 === "N" ? "cR" : "cN");
        if ([I, F, U, X].some((x) => !(x >= 0))) return { err: "Enter a value of 0 or more in every box." }; if (!(I > 0)) return { err: "I must be more than 0." };
        const L = M().lockFor("consumer", [I, F, U, X]); if (L) return { lock: L };
        const res = f1 === "N" ? P.N(I, F, U, X) : P.R(I, F, U, X); if (res === null) return { err: "The losses cannot add up to more than the energy in the food eaten (I). Check your values." };
        const R = f1 === "N" ? X : res, N = f1 === "N" ? res : X;
        const w = f1 === "N" ? `N = I − (F + U + R) = ${fmt(I)} − (${fmt(F)} + ${fmt(U)} + ${fmt(R)}) = <strong>${fmt(N)}</strong> ${unit()}` : `R = I − (F + U + N) = ${fmt(I)} − (${fmt(F)} + ${fmt(U)} + ${fmt(N)}) = <strong>${fmt(R)}</strong> ${unit()}`;
        return { exact: res, working: w + `<br>N is ${A().pct(N, I)} % of I.`, extra: `<div class="mt">${A().bar([["F, faeces", F, C.F], ["U, urine", U, C.U], ["R, respiration", R, C.R], ["N, net production", N, C.N]], I, unit())}</div>` }; }, "missing value"); };
    $("[data-r=find0]", host).addEventListener("change", () => { fields(); build(); }); $("[data-r=find1]", host).addEventListener("change", () => { fields(); build(); });
    $$("[data-preset]", host).forEach((b) => b.addEventListener("click", () => { const p = P.PRESETS[b.dataset.preset]; $("[data-r=find1]", host).value = "N"; fields(); build(); $("[data-r=unit]", host).value = units[2];
      ["I", "F", "U", "R"].forEach((k) => { $(`[data-k="c${k}"]`, host).value = p[k]; }); }));
    tabs($("[data-r=tabs]", host), ["Plants: GPP, R and NPP", "Consumers: N = I − (F + U + R)"], (i) => { mode = i; $("[data-r=m0]", host).hidden = i !== 0; $("[data-r=m1]", host).hidden = i !== 1; fields(); build(); });
    host.addEventListener("input", (e) => { if (e.target.dataset.k && e.target.dataset.k !== "ans") { reset(); bar.innerHTML = ""; } });
    renderQs(spec, host, () => {});
  };

  // ===================================== Farming Practices Evaluator (3.3.4.2) =====================================
  B.interactives.farmingEvaluator = function (spec, host) {
    const PR = spec.practices; const PRIN = spec.principles; const u = uidOf(); let cur = 0;
    const CAT = { econ: "Economic", env: "Environmental", eth: "Ethical" }; const SIDE = { for: "a point for this practice", against: "a point against it", question: "an ethical question to weigh" };
    host.innerHTML = head(spec, "argue, then evaluate") + `<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="choose a farming practice"></div><div data-r="body" class="mt"></div>` + `<p class="tiny muted mt">Some statements fit more than one category; any sensible category is accepted for those. After Check, each statement is also tagged as a point for or against the practice, so you can weigh them in an evaluation.</p>` + qBlock(spec);
    const body = $("[data-r=body]", host);
    const show = () => { const p = PR[cur];
      body.innerHTML = `<p class="small"><strong>${esc(p.name)}.</strong> ${p.what}</p>
        <fieldset style="border:0;padding:0;margin:0 0 .5rem"><legend class="small"><strong>1. The ecological principle.</strong> How does this practice increase productivity?</legend>
          ${PRIN.map((t, i) => `<label class="small" style="display:block"><input type="radio" name="fp-${u}" value="${i}"> ${esc(t)}</label>`).join("")}</fieldset>
        <p class="small" style="margin:.4rem 0 .2rem"><strong>2. Sort the issues.</strong> Is each one economic, environmental or ethical?</p>
        <div data-r="stmts">${p.items.map((it, i) => `<div class="row small" style="gap:.5rem;align-items:center;flex-wrap:wrap;margin:.15rem 0"><select data-i="${i}" aria-label="category for: ${esc(it.t)}"><option value="">choose…</option>${Object.entries(CAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select><span>${esc(it.t)}</span><span data-mark="${i}" aria-live="polite"></span></div>`).join("")}</div>
        <div class="row mt" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="chk" disabled>Check</button><button type="button" class="btn sm" data-a="ans" hidden>Show answers</button></div><div data-r="fb" aria-live="polite"></div>`;
      const sels = $$("[data-r=stmts] select", body), chk = $("[data-a=chk]", body), ansB = $("[data-a=ans]", body), fb = $("[data-r=fb]", body);
      const ready = () => { chk.disabled = !($(`input[name=fp-${u}]:checked`, body) && sels.every((s) => s.value)); };
      body.addEventListener("change", ready);
      chk.addEventListener("click", () => { const r = +$(`input[name=fp-${u}]:checked`, body).value; const pOk = r === p.principle; let n = 0;
        sels.forEach((s, i) => { const ok = p.items[i].c.includes(s.value); if (ok) n++; $(`[data-mark="${i}"]`, body).innerHTML = (ok ? `<span style="color:#2f7d32;font-weight:700">✓</span>` : `<span style="color:#b0451c;font-weight:700">✗</span>`) + (p.items[i].f ? ` <span class="tiny muted">(${SIDE[p.items[i].f]})</span>` : ""); });
        const all = pOk && n === sels.length;
        fb.innerHTML = `<div class="feedback ${all ? "ok" : "neutral"}"><strong>${all ? "All correct." : "Not all correct yet."}</strong> Principle: ${pOk ? "correct" : "not this one"}; issues sorted correctly: ${n} of ${sels.length}.${all ? `<div class="small mt">${p.why}</div>` : ""}</div>`; ansB.hidden = all; });
      ansB.addEventListener("click", () => { fb.innerHTML = `<div class="feedback neutral"><strong>Answers.</strong> Principle: ${esc(PRIN[p.principle])}<div class="small mt">${p.why}</div><ul class="small">${p.items.map((it) => `<li>${esc(it.t)}: ${it.c.map((c) => CAT[c]).join(" or ")}${it.f ? `; ${SIDE[it.f]}` : ""}</li>`).join("")}</ul></div>`; ansB.hidden = true; });
    };
    tabs($("[data-r=tabs]", host), PR.map((p) => p.name), (i) => { cur = i; show(); });
    renderQs(spec, host, () => {});
    host._fe = { show: (i) => $$("[data-r=tabs] button", host)[i].click() };
  };
})(window.BIO);
