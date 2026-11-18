// Interactives for 3.3.3.3 Aerobic respiration and 3.3.3.4 Respiratory substrates (Phase 5 Batch 2, author A2).
// Kinds: mitoExplorer, krebsStepper, oxphosModel, oxphosChallenge (3.3.3.3); rqCalculator (3.3.3.4).
// Drawings come from B.mitoArt (data/content/_mito-art.js); numbers and outcomes from B.krebsModel, B.oxphosModel and
// B.rqModel (data/content/_resp-model.js), so the picture, the numbers and the feedback cannot disagree.
// Accessibility: native buttons, radios, selects and inputs; tab rows respond to the arrow keys; text changes are
// announced in polite live regions; clickable parts of a drawing are also listed as buttons. Motion: particles move only
// when motion is allowed; with reduced motion the drawn arrows (each with an arrowhead and words) show the direction and
// the model jumps straight to its new steady state. Embedded questions use B.questions.render.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.mitoArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const phone = () => typeof innerWidth !== "undefined" && innerWidth < 600;
  const SWIPE = `<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
  const fv = (attrs) => `<div class="fig-view${phone() ? " ix-hscroll" : ""}" ${attrs}></div>${phone() ? SWIPE : ""}`;
  const qBlock = (spec) => ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    return show; };

  // ===================================== Mitochondrion Explorer (3.3.3.3) =====================================
  const PARTS = [
    { k: "outer", name: "Outer membrane", text: "The smooth outer membrane surrounds the whole mitochondrion. Pyruvate crosses it on its way to the matrix." },
    { k: "ims", name: "Intermembrane space", text: "The narrow space between the two membranes; it continues into each crista. Electron carriers in the inner membrane <strong>pump protons into this space</strong>, so its proton concentration becomes higher than in the matrix. No stage of respiration takes place here." },
    { k: "inner", name: "Inner membrane", text: "Contains the <strong>electron transfer chain</strong> and <strong>ATP synthase</strong>: the site of <strong>oxidative phosphorylation</strong>. It is almost impermeable to protons, so protons can return to the matrix only through ATP synthase. Pyruvate crosses it into the matrix by active transport." },
    { k: "crista", name: "Crista (plural cristae)", text: "A fold of the inner membrane. The cristae give a <strong>large surface area</strong> of inner membrane, so there is room for many electron transfer chains and ATP synthase molecules: more ATP can be made." },
    { k: "matrix", name: "Matrix", text: "The fluid inside the inner membrane. It contains the enzymes of the <strong>link reaction</strong> and the <strong>Krebs cycle</strong>, and NAD, FAD and coenzyme A. <span class=\"badge\">supporting</span> It also holds a loop of DNA and small (70S) ribosomes (3.1.2.1)." },
    { k: "cyto", name: "Cytoplasm (outside)", text: "The cytoplasm around the mitochondrion is where <strong>glycolysis</strong> takes place (3.3.3.1). Glycolysis does not need oxygen and does not happen inside the mitochondrion." },
  ];
  const STAGES = [
    { k: "glycolysis", name: "Glycolysis", text: "<strong>Glycolysis: in the cytoplasm.</strong> Glucose is converted to two pyruvate (<a href=\"#/topic/3.3.3.1\">3.3.3.1</a>). It happens in both aerobic and anaerobic respiration." },
    { k: "entry", name: "Pyruvate enters", text: "<strong>Pyruvate enters the matrix</strong> by <strong>active transport</strong>." },
    { k: "link", name: "Link reaction", text: "<strong>Link reaction: in the matrix.</strong> Pyruvate is oxidised to acetate, producing reduced NAD and CO₂; acetate combines with coenzyme A to form acetylcoenzyme A." },
    { k: "krebs", name: "Krebs cycle", text: "<strong>Krebs cycle: in the matrix.</strong> Oxidation-reduction reactions produce reduced coenzymes, ATP and CO₂." },
    { k: "oxphos", name: "Oxidative phosphorylation", text: "<strong>Oxidative phosphorylation: on the inner membrane</strong>, including the cristae. Protons are pumped into the <strong>intermembrane space</strong> (shaded) and flow back into the matrix through ATP synthase." },
  ];
  B.interactives.mitoExplorer = function (spec, host) {
    const u = uidOf(); let sel = null, stage = null, labels = true;
    host.innerHTML = head(spec, "click a structure or a stage") + B.ix.split(`
      <div class="figure">${fv('data-r="pic"')}</div>`, `
      <label class="small"><input type="checkbox" data-k="labels" checked> Show labels</label>
      <div class="ix-group"><p class="ix-group-title" id="mx-st-${u}">Where does each stage happen?</p><div class="row" data-r="stages" role="group" aria-labelledby="mx-st-${u}" style="gap:.3rem;flex-wrap:wrap"></div></div>
      <div class="ix-group"><p class="ix-group-title" id="mx-pl-${u}">Structures</p><div class="row" data-r="parts" role="group" aria-labelledby="mx-pl-${u}" style="gap:.3rem;flex-wrap:wrap"></div></div>
      <div class="ix-readout" data-r="info" aria-live="polite"></div>`, { label: "Mitochondrion Explorer controls" }) + `<p class="tiny muted mt">Schematic drawing, not to scale: a mitochondrion is about 0.5 to 1 µm wide and 1 to several µm long. Real cristae vary in shape and number.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), pb = $("[data-r=parts]", host), sb = $("[data-r=stages]", host);
    pb.innerHTML = PARTS.map((p) => `<button type="button" class="btn sm" data-part="${p.k}" aria-pressed="false">${esc(p.name.replace(/ \(.*\)$/, ""))}</button>`).join("");
    sb.innerHTML = STAGES.map((p) => `<button type="button" class="btn sm" data-stage="${p.k}" aria-pressed="false">${esc(p.name)}</button>`).join("");
    const draw = () => {
      pic.innerHTML = A().mito({ labels, sel, stage });
      $$("[data-part]", pic).forEach((g) => g.addEventListener("click", (e) => { e.stopPropagation(); pick(g.dataset.part); }));
      $$("button", pb).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.part === sel)));
      $$("button", sb).forEach((b) => { const on = b.dataset.stage === stage; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("primary", on); });
      const p = PARTS.find((x) => x.k === sel), s = STAGES.find((x) => x.k === stage);
      info.innerHTML = s ? s.text : p ? `<strong>${esc(p.name)}.</strong> ${p.text}` : "Choose a stage to see where it happens, or click a structure in the drawing.";
    };
    const pick = (k) => { sel = sel === k ? null : k; stage = null; draw(); };
    const pickStage = (k) => { stage = stage === k ? null : k; sel = null; draw(); };
    $$("button", pb).forEach((b) => b.addEventListener("click", () => pick(b.dataset.part)));
    $$("button", sb).forEach((b) => b.addEventListener("click", () => pickStage(b.dataset.stage)));
    $("[data-k=labels]", host).addEventListener("change", (e) => { labels = e.target.checked; draw(); });
    host.addEventListener("keydown", (e) => { if (e.key === "Escape" && (sel || stage)) { sel = null; stage = null; draw(); } });
    renderQs(spec.questions, $("[data-qs]", host) || host);
    draw();
    host._mx = { pick, pickStage, sel: () => sel, stage: () => stage }; // for tests
  };

  // ===================================== Link Reaction and Krebs Cycle Stepper (3.3.3.3) =====================================
  B.interactives.krebsStepper = function (spec, host) {
    const M = B.krebsModel; const u = uidOf(); let basis = "pyruvate", all = M.states(basis), i = 0;
    const NAMES = ["Start", "Enter", "Link 1", "Link 2", "Join", "6C→5C", "5C→4C", "Regenerate"];
    host.innerHTML = head(spec, "carbon accounting") + B.ix.split(`
      <div class="row" data-r="steps" role="group" aria-label="steps" style="gap:.3rem;flex-wrap:wrap;margin-bottom:.3rem"></div>
      <div class="figure">${fv('data-r="pic" tabindex="0" role="group" aria-label="link reaction and Krebs cycle drawing; left and right arrow keys change the step"')}</div>`, `
      <fieldset><legend>Basis</legend><label class="small"><input type="radio" name="kb-${u}" value="pyruvate" checked> Per pyruvate (one turn)</label><label class="small"><input type="radio" name="kb-${u}" value="glucose"> Per glucose (two pyruvate, two turns)</label></fieldset>
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm" data-a="back">← Back</button><button type="button" class="btn sm primary" data-a="next">Next →</button></div>
      <div class="ix-readout" data-r="text" aria-live="polite"></div>
      <div data-r="ledger"></div>`, { label: "Link reaction and Krebs cycle stepper controls" }) + `<p class="tiny muted mt">Simplified model: the Krebs cycle is shown in four steps (the real cycle has more). Changing the basis starts again, so per-pyruvate and per-glucose numbers are never mixed.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), txt = $("[data-r=text]", host), led = $("[data-r=ledger]", host), bar = $("[data-r=steps]", host);
    bar.innerHTML = NAMES.map((n, k) => `<button type="button" class="btn sm" data-s="${k}" aria-label="step ${k + 1}: ${esc(M.STEPS[k].title)}">${esc(n)}</button>`).join("");
    const show = (k) => { i = Math.max(0, Math.min(all.length - 1, k)); const st = all[i], S = M.STEPS[i], two = basis === "glucose";
      pic.innerHTML = A().krebs(st);
      txt.innerHTML = `<strong>${esc(S.title)}</strong>${two ? " <span class=\"badge\">× 2 per glucose</span>" : ""}<br>${S.text}`;
      const row = (n, v) => `<tr><td>${n}</td><td style="text-align:right"><strong>${v}</strong></td></tr>`;
      led.innerHTML = `<table class="tbl" style="width:100%"><caption class="small" style="text-align:left">So far, ${two ? "per glucose" : "per pyruvate"}</caption><tbody>${row("CO₂ released", st.co2)}${row("Reduced NAD", st.nadh)}${row("Reduced FAD", st.fadh)}${row("ATP", st.atp)}</tbody></table>
        <p class="small" style="margin:.35rem 0 0">Carbon atoms: beads in the molecules${two ? " (× 2)" : ""} plus the CO₂ released so far = <strong>${M.carbon(st)}</strong>, the same at every step. Carbon atoms in coenzyme A are not counted: it is a carrier and is released unchanged.</p>`;
      $$("[data-s]", bar).forEach((b) => { const on = +b.dataset.s === i; b.classList.toggle("primary", on); b.setAttribute("aria-current", on ? "step" : "false"); });
      $("[data-a=back]", host).disabled = i === 0; $("[data-a=next]", host).disabled = i === all.length - 1;
      // phones: from the joining step on, scroll the drawing so the Krebs cycle is in view
      if (pic.classList.contains("ix-hscroll")) pic.scrollLeft = i >= 4 ? Math.round(pic.scrollWidth * 0.45) : 0; };
    $$("[data-s]", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.s)));
    $("[data-a=back]", host).addEventListener("click", () => show(i - 1));
    $("[data-a=next]", host).addEventListener("click", () => show(i + 1));
    $$(`input[name=kb-${u}]`, host).forEach((r) => r.addEventListener("change", () => { basis = r.value; all = M.states(basis); show(0); }));
    pic.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); } });
    renderQs(spec.questions, $("[data-qs]", host) || host);
    show(0);
    host._ks = { show, state: () => all[i], setBasis: (b) => { const r = $(`input[name=kb-${u}][value=${b}]`, host); r.checked = true; r.dispatchEvent(new Event("change")); } }; // for tests
  };

  // ===================================== Oxidative phosphorylation: particles and bars =====================================
  function animate(svgEl, mv, passes = 3) {
    if (!svgEl || !mv.length || reduced() || typeof requestAnimationFrame === "undefined") return () => {};
    const NS = "http://www.w3.org/2000/svg"; const layer = document.createElementNS(NS, "g"); layer.setAttribute("aria-hidden", "true"); svgEl.append(layer);
    const C = B.mitoArt.COLORS;
    const parts = mv.map(([k, t], i) => { const p = svgEl.querySelector(`[data-mp="${k}"]`); if (!p) return null; const g = document.createElementNS(NS, "g");
      g.innerHTML = t === "e" ? `<circle r="10.5" fill="${C.EL}" stroke="#fff" stroke-width="1.5"/><text y="5" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">e⁻</text>` : `<circle r="12" fill="#fff" stroke="${C.HP}" stroke-width="1.8"/><text y="5" font-size="15" font-weight="800" fill="${C.HP}" text-anchor="middle">H⁺</text>`;
      layer.append(g); return { p, g, len: p.getTotalLength(), delay: mv[i][2] != null ? mv[i][2] : i * 0.2 }; }).filter(Boolean);
    const dur = 1700; let t0 = null, raf = 0, alive = true;
    const step = (now) => { if (!alive || !svgEl.isConnected) return; if (t0 === null) t0 = now; const e = (now - t0) / dur; let done = true;
      for (const q of parts) { const f = e - q.delay; const pass = Math.floor(f); if (f < 0) { q.g.style.opacity = "0"; done = false; continue; } if (pass >= passes) { q.g.style.opacity = "0"; continue; } done = false; const fr = f - pass; const pt = q.p.getPointAtLength(q.len * fr); q.g.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`); q.g.style.opacity = fr > 0.9 ? String((1 - fr) * 10) : "1"; }
      if (!done) raf = requestAnimationFrame(step); else layer.remove(); };
    raf = requestAnimationFrame(step);
    return () => { alive = false; cancelAnimationFrame(raf); layer.remove(); };
  }
  // each proton leaves its pump when the electron reaches that carrier (fractions of one electron pass), ATP synthase after
  const moves = (r, dis) => { const mv = []; if (r.o2 > 0.5) mv.push(["e", "e", 0], ["h1", "h", 0.15], ["h2", "h", 0.45], ["h3", "h", 0.75]); if (r.atp > 0.5) mv.push(["hs", "h", 0.95]); if (dis === "uncoupler") mv.push(["l1", "h", 0.5], ["l3", "h", 0.8]); return mv; };
  // bars on a 0..200 scale with a tick at "normal" (100); words, no numbers
  const BAR_ROWS = [["o2", "Oxygen uptake (electron flow)"], ["gradient", "Proton gradient"], ["atp", "ATP made by ATP synthase"], ["nad", "NAD returned to the Krebs cycle"], ["heat", "Extra heat (uncoupler)"]];
  const bars = (r, dis, changing) => `<div class="ox-bars" style="display:flex;flex-direction:column;gap:.35rem">${BAR_ROWS.filter(([k]) => k !== "heat" || dis === "uncoupler").map(([k, n]) => { const v = Math.max(0, Math.min(200, r[k])); const wd = B.oxphosModel.word(v); const w = changing ? "changing…" : k === "heat" ? wd === "stops" ? "none" : "released" : wd === "no change" ? "normal" : k === "gradient" && wd === "stops" ? "gone" : wd;
    return `<div class="small"><div style="display:flex;justify-content:space-between;gap:.5rem"><span>${esc(n)}</span><strong>${esc(w)}</strong></div><div role="img" aria-label="${esc(n)}: ${esc(w)}" style="position:relative;height:10px;border-radius:5px;background:var(--surface-2);border:1px solid var(--line)"><div style="position:absolute;left:0;top:0;bottom:0;width:${(v / 2).toFixed(1)}%;border-radius:5px;background:${k === "heat" ? "#c0392b" : "var(--teal)"}"></div>${k === "heat" ? "" : `<div style="position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:var(--ink-2)" title="normal"></div>`}</div></div>`; }).join("")}</div>`;

  // ===================================== Oxidative Phosphorylation Model (3.3.3.3) =====================================
  const DIS_TEXT = {
    none: "Electrons from reduced NAD pass along the chain to <strong>oxygen</strong>. Energy released from them is used to <strong>pump protons from the matrix into the intermembrane space</strong>. Protons <strong>diffuse back into the matrix through ATP synthase</strong>, which catalyses <strong>ADP + Pᵢ → ATP</strong>. Oxygen accepts the electrons and protons, forming <strong>water</strong>.",
    noO2: "<strong>No oxygen</strong>: there is no final electron acceptor, so electrons cannot leave the chain and it stops. No more protons are pumped, the gradient runs down and ATP synthesis by ATP synthase stops. Reduced NAD is not oxidised, so the Krebs cycle stops too.",
    cyanide: "<strong>Cyanide</strong> stops the last carrier passing electrons to oxygen. Oxygen is present but is not used. The chain, proton pumping and oxidative phosphorylation stop, and so does the Krebs cycle.",
    atps: "<strong>ATP synthase blocked</strong>: protons build up in the intermembrane space because they cannot flow back. No ATP is made by ATP synthase. The steep gradient makes pumping harder, so electron flow and oxygen uptake slow almost to a stop.",
    uncoupler: "<span class=\"badge\">stretch</span> <strong>Uncoupler</strong>: protons leak back through the membrane without passing through ATP synthase. Electrons flow faster and more oxygen is used, but much less ATP is made; the energy is released as heat.",
  };
  B.interactives.oxphosModel = function (spec, host) {
    const M = B.oxphosModel; const u = uidOf(); let dis = "none", S = 1, G = M.steady("none", 1).G, stop = () => {}, raf = 0;
    host.innerHTML = head(spec, "model") + B.ix.split(`
      <div class="figure">${fv('data-r="pic"')}</div>
      <div class="ix-readout" data-r="text" aria-live="polite"></div>`, `
      <fieldset><legend>Change one thing</legend>${Object.entries(M.DIS).map(([k, d], i) => `<label class="small"><input type="radio" name="ox-${u}" value="${k}"${i ? "" : " checked"}> ${esc(d.name)}</label>`).join("")}</fieldset>
      <div style="display:flex;gap:.4rem;align-items:flex-end;justify-content:space-between"><label class="small" for="oxs-${u}">Supply of reduced NAD (respiratory substrate available): <strong data-r="sv">100 %</strong></label><button type="button" class="btn sm" data-a="replay">↺ Replay</button></div><input type="range" id="oxs-${u}" min="25" max="100" step="25" value="100">
      <div data-r="bars" aria-live="polite"></div>
      <p class="tiny muted" style="margin:0">The mark on each bar is the normal level. Some heat is always released in respiration.</p>`, { label: "Oxidative phosphorylation model controls", cls: "ix-wide-stage" }) + `<p class="tiny muted mt">Simplified model: three carriers stand for the many proteins of the chain, and the numbers of particles are not to scale.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), txt = $("[data-r=text]", host), bb = $("[data-r=bars]", host);
    const render = (r, changing) => { stop(); pic.innerHTML = A().oxphos({ r, dis }); bb.innerHTML = bars(r, dis, changing); stop = animate($("svg", pic), moves(r, dis)); };
    const settle = () => { cancelAnimationFrame(raf); txt.innerHTML = DIS_TEXT[dis] + (S < 1 ? ` <br><strong>Less reduced NAD supplied</strong> (${S * 100} %): fewer electrons enter the chain, so fewer protons are pumped and less ATP is made.` : "");
      const target = M.steady(dis, S);
      if (reduced() || typeof requestAnimationFrame === "undefined") { G = target.G; render(target); return; }
      // run the model forward (Euler steps) so the gradient changes gradually; redraw about every 120 ms
      // the bars follow the gradient as it changes; the drawing is redrawn once, when the model has settled
      render(M.indices(dis, S, G), true); let n = 0; const tick = () => { for (let k = 0; k < 6; k++) G = M.step(G, dis, S); n += 6; if (n < 480) { bb.innerHTML = bars(M.indices(dis, S, G), dis, true); raf = requestAnimationFrame(tick); } else { G = target.G; render(target); } };
      raf = requestAnimationFrame(tick); };
    $$(`input[name=ox-${u}]`, host).forEach((r) => r.addEventListener("change", () => { dis = r.value; settle(); }));
    $(`#oxs-${u}`, host).addEventListener("input", (e) => { S = +e.target.value / 100; $("[data-r=sv]", host).textContent = e.target.value + " %"; settle(); });
    $("[data-a=replay]", host).addEventListener("click", () => render(M.indices(dis, S, G)));
    renderQs(spec.questions, $("[data-qs]", host) || host);
    G = M.steady("none", 1).G; render(M.steady("none", 1)); txt.innerHTML = DIS_TEXT.none;
    host._ox = { set: (d, s) => { dis = d; if (s) S = s; G = M.steady(dis, S).G; render(M.steady(dis, S)); txt.innerHTML = DIS_TEXT[dis]; }, state: () => ({ dis, S, G }) }; // for tests
  };

  // ===================================== Disruption Challenge (3.3.3.3) =====================================
  B.interactives.oxphosChallenge = function (spec, host) {
    const M = B.oxphosModel; const keys = Object.keys(M.SCEN); let cur = keys[0]; const u = uidOf();
    host.innerHTML = head(spec, "predict, then check") + B.ix.split(`
      <div class="row" data-r="tabs" aria-label="choose a disruption" style="gap:.3rem;flex-wrap:wrap"></div>
      <p class="small" data-r="setup" aria-live="polite" style="margin:.3rem 0"></p>
      <div class="figure">${fv('data-r="pic"')}</div>`, `
      <fieldset><legend>Your predictions, compared with normal</legend><div data-r="grid" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.3rem .5rem;align-items:center"></div></fieldset>
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="check">Check predictions</button><button type="button" class="btn sm" data-a="reset">Try again</button></div>
      <div data-r="fb" aria-live="polite"></div>`, { label: "Disruption Challenge controls" }) + `<p class="tiny muted mt">Predictions describe what happens a short time after the change, once the cell has settled. Simplified model.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), grid = $("[data-r=grid]", host), fb = $("[data-r=fb]", host);
    const opts = M.CH_CHOICES.map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
    const build = () => { const S = M.SCEN[cur]; pic.innerHTML = A().oxphos({ r: M.steady("none", 1), dis: S.dis, preview: true }); $("[data-r=setup]", host).innerHTML = `<strong>${esc(S.name)}.</strong> ${esc(S.setup)}`;
      grid.innerHTML = M.CH_ROWS.map((q) => `<label class="small" for="oc-${u}-${q}">${esc(M.CH_NAMES[q])}</label><select id="oc-${u}-${q}" data-q="${q}"><option value="">choose…</option>${opts}</select>`).join(""); fb.innerHTML = ""; };
    const check = () => { const S = M.SCEN[cur]; let right = 0, blank = 0; const lines = [], wrong = [], good = [];
      M.CH_ROWS.forEach((q) => { const sel = $(`[data-q=${q}]`, grid); if (!sel.value) blank++; });
      if (blank) { fb.innerHTML = `<p class="small" role="status">Make a prediction for every row first (${blank} still to choose).</p>`; return; }
      M.CH_ROWS.forEach((q) => { const sel = $(`[data-q=${q}]`, grid); const v = sel.value; const ok = S.ans[q].includes(v); if (ok) right++; sel.style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)";
        lines.push(`<li><strong>${esc(M.CH_NAMES[q])}: ${ok ? "✓" : "✗"}</strong> ${ok ? esc(v) : `answer: ${esc(S.ans[q].join(" or "))}`}</li>`);
        (ok ? good : wrong).push(`<li><strong>${esc(M.CH_NAMES[q])}${ok ? "" : " (✗)"}.</strong> ${esc(S.why[q])}</li>`); });
      // after checking, the drawing shows the settled state of the model
      pic.innerHTML = A().oxphos({ r: M.steady(S.dis, S.S), dis: S.dis });
      fb.innerHTML = `<div class="ix-readout"><strong>${right} of ${M.CH_ROWS.length} correct.</strong><ul class="small" style="margin:.3rem 0 0 1rem;padding:0">${lines.join("")}</ul><details class="small" style="margin-top:.3rem"><summary>Why? Read the explanations${wrong.length ? ", starting with the rows marked ✗" : ""}</summary><ul style="margin:.2rem 0 0 1rem;padding:0">${wrong.join("")}${good.join("")}</ul></details></div>`; };
    tabs($("[data-r=tabs]", host), keys.map((k) => M.SCEN[k].name), (i) => { cur = keys[i]; build(); });
    $("[data-a=check]", host).addEventListener("click", check);
    $("[data-a=reset]", host).addEventListener("click", build);
    renderQs(spec.questions, $("[data-qs]", host) || host);
    build();
    host._oc = { set: (k) => { cur = k; build(); }, check, grid: () => grid }; // for tests
  };

  // ===================================== RQ Calculator (3.3.3.4) =====================================
  B.interactives.rqCalculator = function (spec, host) {
    const R = B.rqModel; const u = uidOf(); let tries = 0;
    const unitOpts = (sel) => Object.entries(R.UNITS).map(([k, v]) => `<option value="${k}"${k === sel ? " selected" : ""}>${v.name}</option>`).join("");
    host.innerHTML = head(spec, "calculate, then check") + B.ix.split(`
      <div class="row" data-r="presets" aria-label="data sets" style="gap:.3rem;flex-wrap:wrap;margin-bottom:.3rem"></div>
      <p class="small" data-r="pnote" style="margin:.2rem 0 .4rem"></p>
      <div class="figure">${fv('data-r="pic"')}</div>`, `
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 5.2rem;gap:.15rem .4rem;align-items:center">
        <label class="small" for="rqc-${u}" style="grid-column:1/-1">Carbon dioxide produced</label><input id="rqc-${u}" data-k="co2" type="text" inputmode="decimal" autocomplete="off" style="min-width:0"><select data-k="cu" aria-label="unit for carbon dioxide">${unitOpts("cm3")}</select>
        <label class="small" for="rqo-${u}" style="grid-column:1/-1;margin-top:.3rem">Oxygen consumed</label><input id="rqo-${u}" data-k="o2" type="text" inputmode="decimal" autocomplete="off" style="min-width:0"><select data-k="ou" aria-label="unit for oxygen">${unitOpts("cm3")}</select>
        <label class="small" for="rqs-${u}" style="grid-column:1/-1;margin-top:.3rem">Your RQ (2 decimal places)</label><input id="rqs-${u}" data-k="mine" type="text" inputmode="decimal" autocomplete="off" style="min-width:0"><span></span>
      </div>
      <div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="check">Check my RQ</button><button type="button" class="btn sm" data-a="show" disabled>Show me</button></div>
      <div data-r="fb" aria-live="polite"></div>`, { label: "RQ Calculator controls" }) + `<p class="tiny muted mt">RQ = carbon dioxide produced ÷ oxygen consumed, in the same units and over the same time. Gas volumes must be measured at the same temperature and pressure.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), fb = $("[data-r=fb]", host); const f = (k) => $(`[data-k=${k}]`, host);
    const reset = () => { tries = 0; $("[data-a=show]", host).disabled = true; fb.innerHTML = ""; f("mine").value = ""; f("mine").style.background = ""; pic.innerHTML = A().rqScale({}); };
    const load = (p) => { f("co2").value = p ? String(p.co2) : ""; f("o2").value = p ? String(p.o2) : ""; f("cu").value = p ? p.cu : "cm3"; f("ou").value = p ? p.ou : "cm3"; $("[data-r=pnote]", host).textContent = p ? p.note : "Type in your own data, choosing a unit for each gas."; reset(); };
    const result = () => R.calc(f("co2").value.trim(), f("cu").value, f("o2").value.trim(), f("ou").value);
    const reveal = (res, verdict) => { const I = R.interpret(res.rq2); pic.innerHTML = A().rqScale({ rq: res.rq2 });
      fb.innerHTML = `<div class="ix-readout">${verdict}${res.conv ? `<p class="small" style="margin:.2rem 0">Same units first: ${esc(res.conv)}.</p>` : ""}<p class="small" style="margin:.2rem 0">RQ = ${esc(String(+res.co2.toFixed(4)))} ÷ ${esc(String(+res.o2.toFixed(4)))} = <strong>${res.shown}</strong></p><p class="small" style="margin:.2rem 0">${I.text}</p><p class="small" style="margin:.2rem 0"><em>${esc(I.tentative)}</em></p></div>`; };
    $("[data-a=check]", host).addEventListener("click", () => { const res = result(); if (!res.ok) { fb.innerHTML = `<p class="small" role="status">${esc(res.msg)}</p>`; return; }
      const ok = R.mark(f("mine").value, res); if (ok === null) { fb.innerHTML = `<p class="small" role="status">Work out the RQ yourself and type it in first (2 decimal places).</p>`; return; }
      tries++; f("mine").style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)";
      if (ok) reveal(res, `<strong>✓ Correct.</strong>`); else { $("[data-a=show]", host).disabled = false; pic.innerHTML = A().rqScale({}); fb.innerHTML = `<p class="small" role="status">✗ Not quite. Check that both gases are in the same unit, and that you divided carbon dioxide by oxygen. Try again, or choose "Show me".</p>`; } });
    $("[data-a=show]", host).addEventListener("click", () => { const res = result(); if (res.ok) reveal(res, `<strong>Worked answer.</strong>`); });
    ["co2", "o2", "cu", "ou"].forEach((k) => f(k).addEventListener("change", reset));
    tabs($("[data-r=presets]", host), [...R.PRESETS.map((p) => p.name), "Your own data"], (i) => load(R.PRESETS[i] || null));
    renderQs(spec.questions, $("[data-qs]", host) || host);
    load(R.PRESETS[0]);
    host._rq = { load: (i) => load(R.PRESETS[i] || null), f }; // for tests
  };
})(window.BIO);
