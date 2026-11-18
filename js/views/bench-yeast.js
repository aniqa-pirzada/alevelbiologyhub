// RP8 virtual bench (Phase 5 Batch 2, author A4): yeast, methylene blue and temperature.
// B.labSims.yeast = { sim(host, key), calc(host, key) }, called by js/views/lab.js when B.practicals[8].sim === "yeast".
// Stages: 1 Plan, 2 Set up (handbook steps 1 to 5), 3 Time (steps 6 to 9, then step 10: another temperature).
// ONE model drives everything: B.yeastModel.tubes() gives each tube's decolourisation time (data/content/_yeast-model.js);
// the drawing's colour, the "Blue colour has gone" check, the observation record, the results table, the Calculate tab
// and the graph all use those same times. Runs are saved in B.store.get().labRuns[key] and hold SIMULATED times only.
// Recorded time = the clock when the student presses "Blue colour has gone" (accepted only once at most 5 % of the dye
// is still blue: review MR-A4, A-m1), or, in record mode, the time the student reads from the observation record.
// Reduced motion: no animation; record mode only. Layout: B.ix.split stage + panel (picture pinned on laptops).
window.BIO = window.BIO || {}; window.BIO.labSims = window.BIO.labSims || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.yeastModel, P8 = () => B.practicals[8] || {}, G = () => B.photoLimArt;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion") || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const ok = (t) => `<span style="color:var(--sage-ink)">${t}</span>`, bad = (t) => `<span style="color:var(--rose-ink)">${t}</span>`, amb = (t) => `<span style="color:var(--amber-ink)">${t}</span>`;
  const f1 = (x) => (Math.round(x * 10 + 1e-9) / 10).toFixed(1);
  const sf3 = (x) => x.toPrecision(3);
  const SUP = { "⁻": "-", "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
  // accepts 0.00467, 4.67 × 10⁻³, 4.67 x 10^-3, 4.67x10-3 and 4.67e-3 (correction pass, RG-08)
  const num = (v) => { const s = String(v == null ? "" : v).trim().replace(",", ".").replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUP[c]).replace(/\s*[x×]\s*10\s*\^?\s*(-?\d+)/i, "e$1").replace(/[^\d.eE\-]/g, ""); return s === "" || isNaN(+s) ? null : +s; };
  const inp = (id, w = "5.5rem", label = "", extra = "") => `<input id="${id}" type="text" inputmode="decimal" autocomplete="off" ${label ? `aria-label="${esc(label)}"` : ""} ${extra} style="width:${w};padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)">`;
  const uidOf = () => "ye" + Math.random().toString(36).slice(2, 7);
  const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  let styled = false;
  const ensureStyle = () => { if (styled) return; styled = true; const s = document.createElement("style");
    s.textContent = `.ye-nav{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 .4rem;padding:0;list-style:none}.ye-nav button{font-size:.8rem;padding:.25rem .55rem;border-radius:999px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);cursor:pointer}
.ye-nav button[aria-current=step]{background:var(--teal);border-color:var(--teal);color:#fff}.ye-nav button.done::after{content:" ✓"}
.ye-fig{background:#fff;border-radius:10px;padding:.25rem;max-width:100%;overflow-x:auto}.ye-fig svg{display:block;width:100%;height:auto}
.ye-panel p{margin:.2rem 0}.ye-panel fieldset{margin:0 0 .5rem}.ye-steps{display:flex;flex-direction:column;gap:.3rem}.ye-steps .btn{text-align:left;white-space:normal;line-height:1.3}.ye-steps .btn.done{border-color:var(--sage-ink)}
.ye-tbl{overflow-x:auto;max-width:100%}.ye-msg{min-height:1.2em}.ye-big{font-size:1.05rem;padding:.55rem 1rem}
.ye-tt button{font:inherit;background:none;border:1px dashed var(--line-strong);border-radius:6px;padding:.05rem .35rem;color:var(--ink);cursor:pointer}.ye-tt button[aria-pressed=true]{text-decoration:line-through;color:var(--rose-ink)}
.ye-modes label{display:flex;gap:.4rem;align-items:baseline;margin:.1rem 0}.ye-modes input{flex:none}`; document.head.append(s); };

  const STAGES = ["Plan", "Set up", "Add the dye and time"];
  const SETUP = [
    { id: "bath", ok: true, label: (T) => `Set up a water bath at ${T} °C in the glass beaker and check it with the thermometer`, why: "Step 1. A glass beaker lets you see the colour; the thermometer checks the temperature (add hot or cold water to keep it steady)." },
    { id: "label", ok: true, label: () => "Label five test tubes 1 to 5", why: "Step 2. Five tubes give five repeats, so you can calculate a mean and spot an anomaly." },
    { id: "shake", ok: true, label: () => "Shake the yeast and glucose mixture", why: "Step 3. Yeast cells settle; shaking gives a similar number of cells in each 2 cm³ sample." },
    { id: "add", ok: true, label: () => "Add 2 cm³ of the yeast and glucose mixture to all five tubes", why: "Step 4. The same volume in every tube keeps the amount of yeast and glucose the same." },
    { id: "wait", ok: true, label: (T) => `Place the tubes in the water bath and leave them until their contents reach ${T} °C`, why: "Step 5. The yeast then respires at the temperature being investigated from the moment the dye is added." },
    { id: "electric", ok: false, label: () => "Use an electric water bath with a lid instead of the beaker", why: "Not the handbook method: the colour change must be seen, so the teachers' notes say an electric water bath is not really suitable." },
    { id: "alldye", ok: false, label: () => "Add the methylene blue to all five tubes now", why: "Not yet, and not all at once: the dye is added to one tube at a time and timed (steps 6 to 9), after the tubes have reached the bath temperature." },
  ];
  const SHOWN = ["add", "electric", "bath", "wait", "label", "alldye", "shake"]; // fixed mixed order
  const CTL = [["vol", "Volumes of mixture and methylene blue (2 cm³ each)", 1], ["mix", "The same yeast and glucose mixture, shaken before each sample", 1], ["dye", "The same methylene blue solution", 1], ["shake", "The 10 s shake after adding the dye, and no shaking afterwards", 1], ["judge", "The same person judging when the colour has gone", 1], ["rack", "Colour of the test-tube rack", 0], ["timer", "Make of timer", 0]];
  const PRED = [["peak", "The time will get shorter as the temperature rises, then longer at the highest temperatures, as enzymes denature."], ["same", "The time will be the same at every temperature, because the amounts of yeast, glucose and dye are fixed."], ["longer", "The time will get longer as the temperature rises, because methylene blue loses its colour more slowly when warm."]];

  const yName = (k) => (M().YEASTS[k] || {}).label || k; const dName = (k) => (M().DYES[k] || {}).label || k;
  const anyRow = (r, k) => Object.values(r.rows).some((a) => a.some((c) => c && c[k]));
  const runLabel = (r, i) => `Run ${i + 1}: ${r.yeast === "old" ? "old stock yeast" : "fresh yeast"}${r.dye === "diluted" ? ", dye diluted 1:1" : ""}${anyRow(r, "noShake") ? ", mixture not shaken (some tubes)" : ""}${anyRow(r, "noWait") ? ", no waiting for the tubes to warm (some temperatures)" : ""}${Object.values(r.rows).some((a) => a.some((c) => c.reshake)) ? ", a tube shaken again" : ""}`;

  function bench(host, key, onRun) {
    ensureStyle(); const u = uidOf();
    const S = { stage: 0, yeast: "fresh", dye: "working", prediction: "", ctlOK: false, T: 35, setup: [], noShake: false, noWait: false, tubes: null, cur: 0, res: [], rows: {}, mode: reduced() ? "record" : "watch", speed: 5, saved: false, seed: (Date.now() % 90000) + 1000, busy: false };
    host.innerHTML = `<p class="small muted">Simulated times from this site's model: no real yeast is measured here. <span class="badge amber">simulated</span></p>
      <ol class="ye-nav" aria-label="Stages of the practical">${STAGES.map((s, i) => `<li><button type="button" data-st="${i}">${i + 1} ${s}</button></li>`).join("")}</ol>
      <div data-y="body"></div><div class="small ye-msg" aria-live="polite" data-y="live"></div>`;
    const q = (k, root = host) => $(`[data-y="${k}"]`, root);
    const say = (t) => { q("live").innerHTML = t; };
    let stop = null;
    const order = () => ["bath", "label", ...(S.noShake ? [] : ["shake"]), "add", ...(S.noWait ? [] : ["wait"])];
    const setupDone = () => order().every((id) => S.setup.includes(id));
    const doneStage = (i) => [S.ctlOK && S.prediction, setupDone(), S.saved][i];
    const nav = () => $$(".ye-nav button", host).forEach((b, i) => { b.removeAttribute("aria-current"); if (i === S.stage) b.setAttribute("aria-current", "step"); b.classList.toggle("done", !!doneStage(i)); });
    $$(".ye-nav button", host).forEach((b) => b.addEventListener("click", () => go(+b.dataset.st)));
    function go(i, keep) { if (stop) stop(); S.stage = i; nav(); if (!keep) say(""); [plan, setup, time][i](q("body")); }
    const fig = (inner) => `<div class="ye-fig ix-hscroll">${inner}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
    const nextBtn = (i, label) => `<button type="button" class="btn sm" data-next="${i}">${label || `Next: ${STAGES[i]}`} →</button>`;
    const wireNext = (box) => $$("[data-next]", box).forEach((b) => b.addEventListener("click", () => { go(+b.dataset.next); host.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }));
    const resetTemp = () => { S.setup = []; S.tubes = null; S.cur = 0; S.res = []; };
    const resetRun = () => { resetTemp(); S.rows = {}; S.saved = false; S.seed = (Date.now() % 90000) + 1000; };
    const drawTubes = (extra = {}) => { const added = S.setup.includes("add");
      const tubes = [0, 1, 2, 3, 4].map((i) => { const r = S.res[i]; if (r) return { fill: 4, blue: r.time == null ? 1 : 0 }; if (S.tubes && i === S.cur && extra.blue != null) return { fill: 4, blue: extra.blue, active: true }; return { fill: added ? 2 : 0, active: S.stage === 2 && i === S.cur && !!S.tubes }; });
      return P8().art.apparatus({ id: u + "app", tubes, bath: S.setup.includes("bath") || S.stage === 0, temp: S.setup.includes("bath") ? `${S.tubes ? S.tubes[Math.min(S.cur, 4)].bath.toFixed(1) : S.T} °C` : "", clock: S.stage === 2 ? fmtClock(extra.clock || 0) : "", minW: 520 }); };

    // ---- 1 Plan ----
    function plan(box) {
      box.innerHTML = B.ix.split(fig(P8().art.apparatus({ id: u + "app", temp: "35 °C", tubes: [{ fill: 4, blue: 0 }, { fill: 4, blue: 0.35 }, { fill: 4, blue: 1 }, { fill: 2 }, { fill: 2 }], minW: 520 })) + `<p class="tiny muted mt">What you will set up (handbook steps 1 to 5), shown during timing.</p>`,
        `<div class="ye-panel"><fieldset><legend>Yeast (teachers' notes)</legend>${Object.entries(M().YEASTS).map(([k, y]) => `<label class="small"><input type="radio" name="${u}y" value="${k}" ${S.yeast === k ? "checked" : ""}> ${y.label}</label>`).join("")}</fieldset>
        <fieldset><legend>Methylene blue</legend>${Object.entries(M().DYES).map(([k, d]) => `<label class="small"><input type="radio" name="${u}d" value="${k}" ${S.dye === k ? "checked" : ""}> ${d.label}</label>`).join("")}<p class="tiny muted">The notes say the colour should go within about 5 minutes at 35 °C; if not, dilute the dye further.</p></fieldset>
        <fieldset><legend>Variables</legend><p class="small"><strong>Independent:</strong> temperature of the water bath.<br><strong>Dependent:</strong> time for the blue colour to disappear (rate = 1/time).</p><p class="small"><strong>Tick the variables you must keep the same:</strong></p>${CTL.map(([k, t, c]) => `<label class="small"><input type="checkbox" data-ctl="${k}" data-c="${c}"> ${t}</label>`).join("")}
          <div class="row"><button type="button" class="btn sm" data-y="ctlchk">Check my controls</button></div><div class="small" data-y="ctlfb" aria-live="polite"></div></fieldset>
        <fieldset><legend>Prediction</legend>${PRED.map(([k, t]) => `<label class="small"><input type="radio" name="${u}pr" value="${k}" ${S.prediction === k ? "checked" : ""}> ${t}</label>`).join("")}<div class="small" data-y="prfb" aria-live="polite"></div></fieldset>
        <div class="row">${nextBtn(1)}</div></div>`, { label: "Plan the investigation" });
      $$(`input[name=${u}y]`, box).forEach((r) => r.addEventListener("change", () => { S.yeast = r.value; resetRun(); nav(); say(`${yName(S.yeast)} chosen.${S.yeast === "old" ? " The teachers' notes say stock yeast did not give good results: see what difference it makes." : ""} Any results already taken have been cleared.`); }));
      $$(`input[name=${u}d]`, box).forEach((r) => r.addEventListener("change", () => { S.dye = r.value; resetRun(); nav(); say(`${dName(S.dye)} chosen. Any results already taken have been cleared.`); }));
      q("ctlchk", box).addEventListener("click", () => { const wrong = $$("[data-ctl]", box).filter((c) => c.checked !== (c.dataset.c === "1")); S.ctlOK = !wrong.length; nav(); q("ctlfb", box).innerHTML = wrong.length ? bad(`Not quite: ${wrong.length} to change. A control variable is one that could change the time if it were different; the rack colour and the make of timer cannot.`) : ok("Correct: each of these could change the decolourisation time, so each is kept the same."); });
      $$(`input[name=${u}pr]`, box).forEach((r) => r.addEventListener("change", () => { S.prediction = r.value; nav(); q("prfb", box).innerHTML = r.value === "peak" ? ok("A testable prediction with a reason: respiration is controlled by enzymes, which work faster when warmer until they begin to denature.") : amb("You can test any prediction. Think about how temperature affects enzymes; the results will show whether you were right."); }));
      wireNext(box);
    }

    // ---- 2 Set up (handbook steps 1 to 5) ----
    function setup(box) {
      const n = S.setup.length, locked = n > 0; const done = setupDone();
      box.innerHTML = B.ix.split(fig(drawTubes()) + `<p class="tiny muted mt">${Object.keys(S.rows).length ? `Temperatures done: ${Object.keys(S.rows).map((t) => t + " °C").join(", ")}.` : "Start at 35 °C (step 1); other temperatures come later (step 10)."}</p>`,
        `<div class="ye-panel"><fieldset ${locked ? "disabled" : ""}><legend>Water bath temperature</legend><label class="small">Temperature <select data-y="temp">${M().TEMPS.map((t) => `<option value="${t}" ${S.T === t ? "selected" : ""}>${t} °C${S.rows[t] ? " (done)" : ""}</option>`).join("")}</select></label><p class="tiny muted">Hot or cold water keeps the beaker at temperatures from 10 to 45 °C, the highest temperature in the handbook's sample results. Higher temperatures are not used: the handbook asks for the safest range that works.</p></fieldset>
        <details class="small" ${S.noShake || S.noWait ? "open" : ""}><summary>Method errors on purpose (optional)</summary><fieldset ${locked ? "disabled" : ""} style="border:0;padding:.2rem 0;margin:0"><legend class="sr-only">Method errors on purpose</legend><label class="small"><input type="checkbox" data-y="noshake" ${S.noShake ? "checked" : ""}> Do not shake the yeast mixture before taking samples</label><label class="small"><input type="checkbox" data-y="nowait" ${S.noWait ? "checked" : ""}> Add the dye without waiting for the tubes to reach the bath temperature</label></fieldset></details>
        <fieldset><legend>Choose the next step</legend><div class="small" data-y="sfb" aria-live="polite" style="margin-bottom:.3rem"></div><div class="ye-steps">${SHOWN.filter((id) => !(id === "shake" && S.noShake) && !(id === "wait" && S.noWait)).map((id) => { const s = SETUP.find((x) => x.id === id); const d = S.setup.includes(id); return `<button type="button" class="btn sm${d ? " done" : ""}" data-step="${id}" ${d || done ? "disabled" : ""}>${d ? "✓ " : ""}${s.label(S.T)}</button>`; }).join("")}</div></fieldset>
        <div class="row">${done ? nextBtn(2, "Next: add the dye and time") : '<button type="button" class="btn sm" data-y="redo">Start the set-up again</button>'}</div></div>`, { label: "Set up the water bath and tubes" });
      const tsel = q("temp", box); tsel.addEventListener("change", () => { S.T = +tsel.value; setup(box); });
      q("noshake", box).addEventListener("change", (e) => { S.noShake = e.target.checked; setup(box); });
      q("nowait", box).addEventListener("change", (e) => { S.noWait = e.target.checked; setup(box); });
      $$("[data-step]", box).forEach((b) => b.addEventListener("click", () => { const s = SETUP.find((x) => x.id === b.dataset.step); const fb = q("sfb", box);
        if (!s.ok) { fb.innerHTML = bad(s.why); return; }
        const want = order()[S.setup.length]; if (s.id !== want) { fb.innerHTML = amb(`Not yet: first, ${SETUP.find((x) => x.id === want).label(S.T).toLowerCase()}.`); return; }
        S.setup.push(s.id); if (setupDone()) S.tubes = M().tubes({ T: S.T, yeast: S.yeast, dye: S.dye, eq: !S.noWait, shakeMix: !S.noShake, seed: S.seed });
        nav(); setup(box); q("sfb", box).innerHTML = ok(s.why); say(`Done: ${s.label(S.T)}.`); }));
      const redo = q("redo", box); if (redo) redo.addEventListener("click", () => { resetTemp(); setup(box); });
      wireNext(box);
    }

    // ---- 3 Add the dye and time (steps 6 to 9; step 10) ----
    function resTable() {
      const Ts = Object.keys(S.rows).map(Number).sort((a, b) => a - b); const cur = S.res.length ? [[S.T + " (now)", S.res]] : [];
      const all = [...Ts.map((t) => [t, S.rows[t]]), ...cur]; if (!all.length) return `<p class="small muted">No times yet.</p>`;
      return `<table class="tbl small"><caption class="tiny muted" style="text-align:left">Simulated times: ${esc(S.yeast === "old" ? "old stock yeast" : "fresh yeast")}${S.dye === "diluted" ? ", dye diluted 1:1" : ""}</caption><thead><tr><th scope="col">Temperature / °C</th>${[1, 2, 3, 4, 5].map((i) => `<th scope="col">Tube ${i} / s</th>`).join("")}</tr></thead><tbody>${all.map(([t, a]) => `<tr><td>${t}</td>${[0, 1, 2, 3, 4].map((i) => { const c = a[i]; return `<td>${!c ? "" : c.time == null ? "&gt; 600" : c.time + (c.reshake ? "*" : "")}</td>`; }).join("")}</tr>`).join("")}</tbody></table>${all.some(([, a]) => a.some((c) => c && c.reshake)) ? '<p class="tiny muted">* this tube was shaken again during timing.</p>' : ""}${all.some(([, a]) => a.some((c) => c && c.time == null)) ? '<p class="tiny muted">&gt; 600: the blue colour had not gone after 600 s, so no time (and no rate) can be given.</p>' : ""}`;
    }
    function time(box) {
      const ready = setupDone() && S.tubes; const fin = S.res.length === 5; const nT = Object.keys(S.rows).length + (fin && !S.rows[S.T] ? 1 : 0);
      const saveRow = S.saved ? `<div class="row"><button type="button" class="btn sm primary" data-y="tocalc">Process this run in the Calculate tab →</button><button type="button" class="btn sm" data-y="newrun">Start a new run</button></div>` : `<div class="row"><button type="button" class="btn sm primary" data-y="save" ${nT >= 3 ? "" : "disabled"}>Finish and save this run</button><span class="tiny muted">${nT >= 3 ? `${nT} temperatures done.` : `At least 3 temperatures are needed (${nT} so far).`}</span></div>`;
      box.innerHTML = B.ix.split(fig(drawTubes()) + `<div class="ye-tbl mt" data-y="tbl">${resTable()}</div>`,
        `<div class="ye-panel">${ready ? "" : `<p class="small">${bad("Set up the water bath and tubes first (stage 2).")}</p>`}
        <fieldset ${ready && !fin ? "" : "disabled"}><legend>${fin ? `All five tubes timed at ${S.T} °C` : `Tube ${S.cur + 1} of 5 at ${S.T} °C (steps 6 to 9)`}</legend>
          <div role="radiogroup" aria-label="How to time" class="small ye-modes">${[["watch", "Watch the tube and press when the blue colour has gone"], ["record", "Read the observation record (type the time)"]].map(([k, t]) => `<label><input type="radio" name="${u}mode" value="${k}" ${S.mode === k ? "checked" : ""} ${k === "watch" && reduced() ? "disabled" : ""}> ${t}${k === "watch" && reduced() ? " (not available: reduced motion is on)" : ""}</label>`).join("")}</div>
          <label class="small" data-y="spl" ${S.mode === "watch" ? "" : "hidden"} title="Your reaction time is recorded in real seconds, not multiplied by the speed">Speed <select data-y="speed">${[1, 5, 20].map((k) => `<option value="${k}" ${S.speed === k ? "selected" : ""}>${k === 1 ? "real time" : `${k} times faster`}</option>`).join("")}</select></label>
          <label class="small" data-y="rsl" ${S.mode === "record" ? "" : "hidden"}><input type="checkbox" data-y="rs60"> Method error on purpose: shake the tube again 60 s after adding the dye</label>
          <div data-y="ui"></div></fieldset>
        ${fin ? `<div class="row"><button type="button" class="btn sm primary" data-y="keep">Record the results for ${S.T} °C and choose another temperature (step 10)</button></div>` : ""}
        ${saveRow}</div>`, { label: "Add the methylene blue and time each tube", cls: "ix-nosticky-sm" });
      $$(`input[name=${u}mode]`, box).forEach((r) => r.addEventListener("change", () => { S.mode = r.value; q("spl", box).hidden = S.mode !== "watch"; q("rsl", box).hidden = S.mode !== "record"; drawUI(box); }));
      q("speed", box).addEventListener("change", (e) => { S.speed = +e.target.value; });
      const kp = q("keep", box); if (kp) kp.addEventListener("click", () => { S.rows[S.T] = S.res.slice(); const t = S.T; resetTemp(); const nxt = M().TEMPS.find((x) => !S.rows[x] && x > t) || M().TEMPS.find((x) => !S.rows[x]); if (nxt) S.T = nxt; say(ok(`Results for ${t} °C recorded. Set up the bath again at another temperature (step 10).`)); go(1, true); });
      const sv = q("save", box); if (sv) sv.addEventListener("click", () => { if (S.res.length === 5 && !S.rows[S.T]) S.rows[S.T] = S.res.slice(); const run = { ts: Date.now(), seed: S.seed, yeast: S.yeast, dye: S.dye, prediction: S.prediction, rows: JSON.parse(JSON.stringify(S.rows)) }; S.saved = true; onRun(run); say(ok("Run saved. Process it in the Calculate tab: means, rates and graph.")); go(2, true); });
      const tc = q("tocalc", box); if (tc) tc.addEventListener("click", () => { const t = document.querySelector('[role="tab"][data-tab="calc"]'); if (t) { t.click(); t.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); } });
      const nr = q("newrun", box); if (nr) nr.addEventListener("click", () => { resetRun(); say("New run: plan it, then set up the water bath again."); go(0, true); });
      if (ready && !fin) drawUI(box);
      centreTube(box);
    }
    // phones: the drawing keeps a readable width and scrolls sideways; bring the tube being timed into view
    function centreTube(box) { const f = $(".ix-stage .ye-fig.ix-hscroll", box); if (!f || f.scrollWidth <= f.clientWidth + 2) return; const svg = $("svg", f); if (!svg) return; const k = svg.getBoundingClientRect().width / 640; const x = [222, 290, 358, 426, 494][Math.min(S.cur, 4)]; f.scrollLeft = Math.max(0, x * k - f.clientWidth / 2); }
    function commit(rec) { rec.noWait = S.noWait; rec.noShake = S.noShake; S.res.push(rec); S.cur = S.res.length; say(rec.time == null ? amb(`Tube ${S.res.length}: the blue colour had not gone after 600 s. No time can be recorded.`) : `Tube ${S.res.length}: ${rec.time} s recorded.`); go(2, true); }
    function drawUI(box) {
      if (stop) stop(); const ui = q("ui", box); if (!ui) return; const tb = S.tubes[S.cur];
      if (S.mode === "record" || reduced()) {
        ui.innerHTML = `<div class="row"><button type="button" class="btn sm primary" data-y="add">Add 2 cm³ methylene blue to tube ${S.cur + 1}, shake for 10 s and start timing</button></div><div data-y="obs"></div>`;
        q("add", box).addEventListener("click", () => { const rs = q("rs60", box).checked && tb.td > 60; const tt = M().withReshake(tb.td, rs ? 60 : null); const over = tt > M().P.cutoff;
          q("obs", box).innerHTML = `<p class="small" style="background:var(--surface-2);padding:.45rem .6rem;border-radius:8px"><strong>Observation record, tube ${S.cur + 1}</strong> (bath ${tb.bath.toFixed(1)} °C): ${rs ? "blue colour returned when the tube was shaken again at 60 s; " : ""}${over ? "the tube was still blue at 600 s, when timing stopped." : `the blue colour had gone ${Math.round(tt)} s after the dye was added.`}</p>${over ? `<div class="row"><button type="button" class="btn sm primary" data-y="rec">Record: not decolourised within 600 s</button></div>` : `<label class="small">Time for the blue colour to disappear / s ${inp(u + "t", "5rem", "time in seconds")}</label> <button type="button" class="btn sm primary" data-y="rec">Record time</button>`}`;
          q("add", box).disabled = true;
          q("rec", box).addEventListener("click", () => { if (over) return commit({ time: null, model: null, reshake: rs }); const v = num(($("#" + u + "t", box) || {}).value); if (v == null || v <= 0 || !Number.isInteger(v)) { say(bad("Type the time in whole seconds.")); return; } if (v !== Math.round(tt)) { say(amb(`Check the observation record: it gives ${Math.round(tt)} s, but you typed ${v} s. Correct the time, then record it.`)); return; } commit({ time: v, model: Math.round(tt), reshake: rs }); }); });
        return; }
      ui.innerHTML = `<div class="row"><button type="button" class="btn sm primary" data-y="add">Add 2 cm³ methylene blue to tube ${S.cur + 1}, shake for 10 s and start timing</button></div>
        <div class="row"><button type="button" class="btn ye-big" data-y="gone" disabled>Blue colour has gone</button><button type="button" class="btn sm" data-y="again" disabled>Shake the tube again (method error)</button></div><p class="small" data-y="st"></p>`;
      q("add", box).addEventListener("click", () => live(box, tb));
    }
    function live(box, tb) {
      if (S.busy) return; S.busy = true; const k = S.speed; let raf = 0, done = false, lastShake = 0, reshake = false, warned = false;
      const svg = $(`#${u}app`, box);
      const gone = q("gone", box), again = q("again", box), st = q("st", box); q("add", box).disabled = true; gone.disabled = false; again.disabled = false; gone.focus();
      // the drawing shows the tube with 4 cm³ once the dye is in
      if (svg) { const tubes = [0, 1, 2, 3, 4].map((i) => (S.res[i] ? { fill: 4, blue: S.res[i].time == null ? 1 : 0 } : i === S.cur ? { fill: 4, blue: M().intensity(0, tb.td, S.dye), active: true } : { fill: 2 })); svg.outerHTML = P8().art.apparatus({ id: u + "app", tubes, temp: `${tb.bath.toFixed(1)} °C`, clock: "00:00", minW: 520 }); }
      const svg2 = $(`#${u}app`, box), liq2 = svg2 && svg2.querySelector(`[data-ph="liq${S.cur}"]`), clk2 = svg2 && svg2.querySelector('[data-ph="clock"]');
      const t0 = performance.now(); let el = 0; st.textContent = `Timing tube ${S.cur + 1}${k > 1 ? ` (shown ${k} times faster)` : ""}. Do not shake it again.`;
      const tick = () => { el = ((performance.now() - t0) / 1000) * k; const e = el - lastShake;
        if (liq2) liq2.setAttribute("fill", P8().art.mix(M().intensity(e, tb.td, S.dye)));
        if (clk2) clk2.textContent = fmtClock(Math.min(el, 600));
        if (warned && M().blue(e, tb.td, S.dye) <= M().P.accept) { warned = false; st.textContent = `Timing tube ${S.cur + 1}. Do not shake it again.`; }
        if (el >= M().P.cutoff) return finish(null); raf = requestAnimationFrame(tick); };
      const onGone = () => { const e = el - lastShake; if (M().blue(e, tb.td, S.dye) > M().P.accept) { warned = true; st.innerHTML = amb("The tube is still blue: keep watching until the blue colour has disappeared."); return; } finish(M().pressTime(el, lastShake + M().tAccept(tb.td, S.dye), k)); }; // a late press counts in real seconds (RG-07)
      const onAgain = () => { lastShake = el; reshake = true; warned = false; st.innerHTML = amb("Shaken again: oxygen dissolved and the blue colour came back. The timer keeps running."); };
      gone.addEventListener("click", onGone); again.addEventListener("click", onAgain);
      function finish(t) { done = true; cancelAnimationFrame(raf); S.busy = false; stop = null; gone.removeEventListener("click", onGone); again.removeEventListener("click", onAgain); commit({ time: t, model: t == null ? null : Math.round(M().withReshake(tb.td, reshake ? lastShake : null)), reshake }); }
      stop = () => { if (!done) { done = true; cancelAnimationFrame(raf); S.busy = false; } stop = null; };
      raf = requestAnimationFrame(tick);
    }
    go(0);
    return S;
  }

  // ======================= Sim tab =======================
  const statsOf = (rows, excl = {}) => { const Ts = Object.keys(rows).map(Number).sort((a, b) => a - b); return Ts.map((T) => { const a = rows[T].map((c) => (typeof c === "number" ? c : c.time)); const keep = a.filter((x, i) => x != null && !(excl[T] || []).includes(i)); const mean = keep.length ? M().mean(keep) : null; return { T, times: a, keep, mean, rate: mean ? 1 / mean : null }; }); };
  function sim(host, n) {
    host.innerHTML = `<div data-y="bench"></div><h3 class="mt">Saved runs</h3><p class="small muted">Each saved run holds the simulated times at each temperature. The Calculate tab processes them.</p><div data-y="runs" style="overflow-x:auto"></div><div class="row mt"><button class="btn sm" data-y="clear">Clear saved runs</button></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    const table = () => { if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", table); return; }
      $('[data-y="runs"]', host).innerHTML = runs.length ? `<table class="tbl small"><thead><tr><th scope="col">#</th><th scope="col">Run</th><th scope="col">Times / s at each temperature</th></tr></thead><tbody>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(runLabel(r, i))}</td><td>${statsOf(r.rows).map((x) => `${x.T} °C: ${x.times.map((t) => (t == null ? "&gt; 600" : t)).join(", ")}`).join("; ")}</td></tr>`).join("")}</tbody></table>` : '<p class="muted small">No runs saved yet.</p>'; };
    const S = bench($('[data-y="bench"]', host), n, (r) => { runs.push(r); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    B.labSims.yeast._state = S;
    $('[data-y="clear"]', host).addEventListener("click", () => { if (confirm("Clear all saved runs for this practical?")) { runs.length = 0; B.store.save(); table(); document.dispatchEvent(new Event("labrun")); } });
    table(); host.dataset.mounted = "1"; document.addEventListener("labrun", table);
  }

  // ======================= Calculate tab: means, rates (1/t), graph =======================
  // The practice set is its own fixed data set (SETS.practice), not the Analysis worked example, so its answers cannot be
  // copied from another tab (correction pass, RG-11); 25 °C is never used here (q-rp8-a2 only).
  function specimen() { const s = P8().sets.SETS.practice; return { label: "Practice data set: fresh yeast (checked answers)", specimen: true, yeast: "fresh", dye: "working", rows: Object.fromEntries(Object.entries(s.rows).map(([T, a]) => [T, a.map((t) => ({ time: t }))])) }; }
  function rateGraph(st, label) {
    const pts = st.filter((r) => r.rate).map((r) => ({ x: r.T, y: r.rate }));
    const ymax = Math.max(0.004, Math.ceil(Math.max(0, ...pts.map((p) => p.y)) * 1000 + 1) / 1000);
    const step = ymax > 0.008 ? 0.002 : 0.001;
    return G().graph({ w: 560, h: 330, minW: 480, x: { min: 0, max: 50, ticks: G().ticks(0, 50, 10), label: "temperature / °C" }, y: { min: 0, max: ymax, ticks: G().ticks(0, ymax, step), label: "rate (1/mean time) / 10⁻³ s⁻¹", fmt: (v) => String(Math.round(v * 1000)) }, series: [{ pts, color: "#1d5f8a", mark: "o", line: true, name: "" }], key: false,
      aria: `Graph of rate (1/mean time) against temperature for ${label}: ${pts.map((p) => `${p.x} °C, ${sf3(p.y)} per second`).join("; ") || "no rates yet"}.` });
  }
  function calc(host, n) {
    ensureStyle(); const u = uidOf(); let sel = null; const excl = {}; const solved = new Set();
    const list = () => { const runs = B.store.get().labRuns[n] || []; return [...runs.map((r, i) => ({ id: "r" + i, label: runLabel(r, i), ds: r })), { id: "spec", label: "Practice data set: fresh yeast (checked answers)", ds: specimen() }]; };
    const current = () => { const L = list(); return L.find((x) => x.id === sel) || L[L.length > 1 ? L.length - 2 : 0]; };
    function render() {
      if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", render); return; } host.dataset.mounted = "1";
      const c = current(); const ex = (excl[c.id] = excl[c.id] || {}); const st = statsOf(c.ds.rows, ex); const skey = c.id + JSON.stringify(ex); // solved per data set and per choice of left-out times
      host.innerHTML = `<div class="card mb"><h3>1 Process a run (means and rates)</h3><label class="small">Data set <select data-c="ds">${list().map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
          <p class="small">For each temperature, calculate the mean time (1 decimal place) and the rate = 1/mean time in s⁻¹ (3 significant figures). To leave out an anomalous time, press it (it is crossed out); say why in your write-up.</p>
          <div class="ye-tbl"><table class="tbl small"><thead><tr><th scope="col">Temperature / °C</th><th scope="col">Times / s</th><th scope="col">Mean time / s</th><th scope="col">Rate / s⁻¹</th></tr></thead><tbody>${st.map((r, i) => `<tr><td>${r.T}</td><td class="ye-tt">${r.times.map((t, k) => (t == null ? "&gt; 600 " : `<button type="button" data-ex="${r.T}:${k}" aria-pressed="${(ex[r.T] || []).includes(k)}" aria-label="${t} seconds, tube ${k + 1}: press to ${(ex[r.T] || []).includes(k) ? "include" : "leave out"}">${t}</button> `)).join("")}</td><td>${r.mean == null ? "no time" : inp(`${u}m${i}`, "4.8rem", `mean time at ${r.T} °C`)}</td><td>${r.mean == null ? "no rate" : inp(`${u}r${i}`, "5.5rem", `rate at ${r.T} °C`)}</td></tr>`).join("")}</tbody></table></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole table</p>
          <div class="row"><button type="button" class="btn sm" data-c="chk">Check</button><button type="button" class="btn sm" data-c="show">Show the answers</button></div><div class="small" data-c="fb" aria-live="polite"></div></div>
        <div data-c="after"></div>`;
      // the graph and the pattern question are drawn from the true rates, so they appear only once step 1 is all correct or
      // its answers have been shown (correction pass, RG-01)
      const afterHTML = () => `<div class="card mb"><h3>2 Graph</h3><div class="ye-fig ix-hscroll" style="max-width:640px">${rateGraph(st, c.label)}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p><p class="tiny muted">Rate is plotted against temperature and the points are joined with straight lines. The axis is in units of 10⁻³ s⁻¹, so 8 on the axis means 0.008 s⁻¹. A temperature with no decolourisation within 600 s has no rate and is not plotted.</p></div>
        <div class="card"><h3>3 Describe the pattern</h3><label class="small">At which temperature was the rate highest in this data set? <select data-c="hi"><option value="">choose</option>${st.filter((r) => r.rate).map((r) => `<option value="${r.T}">${r.T} °C</option>`).join("")}</select></label> <button type="button" class="btn sm" data-c="hichk">Check</button><div class="small" data-c="hifb" aria-live="polite"></div>
          <p class="small muted mt">Then explain the pattern using enzymes (more kinetic energy, more enzyme–substrate complexes; denaturation at high temperature) and say why the highest rate you measured is not necessarily the optimum. The Analysis tab has a worked example.</p></div>`;
      const lockedHTML = `<div class="card mb"><h3>2 Graph</h3><p class="small muted">Check your means and rates (all correct), or show the answers, to draw the graph.</p></div><div class="card"><h3>3 Describe the pattern</h3><p class="small muted">This appears with the graph.</p></div>`;
      const after = () => { const a = $('[data-c="after"]', host); a.innerHTML = solved.has(skey) ? afterHTML() : lockedHTML; const hc = $('[data-c="hichk"]', a); if (hc) hc.addEventListener("click", hiCheck); };
      const g = (id) => num(($("#" + id, host) || {}).value);
      $('[data-c="ds"]', host).addEventListener("change", (e) => { sel = e.target.value; render(); });
      $$("[data-ex]", host).forEach((b) => b.addEventListener("click", () => { const [T, k] = b.dataset.ex.split(":").map(Number); const a = (ex[T] = ex[T] || []); const i = a.indexOf(k); if (i >= 0) a.splice(i, 1); else if (st.find((r) => r.T === T).keep.length > 1) a.push(k); render(); }));
      $('[data-c="chk"]', host).addEventListener("click", () => { let wrong = 0, empty = 0; st.forEach((r, i) => { if (r.mean == null) return; const m = g(`${u}m${i}`), ra = g(`${u}r${i}`); const eM = $(`#${u}m${i}`, host), eR = $(`#${u}r${i}`, host);
          if (m == null) empty++; else { const good = Math.abs(m - r.mean) <= 0.051; if (!good) wrong++; eM.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; eM.setAttribute("aria-invalid", String(!good)); }
          if (ra == null) empty++; else { const good = Math.abs(ra - r.rate) <= 0.006 * r.rate; if (!good) wrong++; eR.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; eR.setAttribute("aria-invalid", String(!good)); } });
        if (!wrong && !empty && !solved.has(skey)) { solved.add(skey); after(); }
        $('[data-c="fb"]', host).innerHTML = wrong ? bad(`${wrong} value${wrong === 1 ? " is" : "s are"} wrong (red border). Mean = total of the times you kept ÷ how many you kept; rate = 1 ÷ mean time (for example 1 ÷ 200 = 0.00500 s⁻¹).`) : empty ? amb(`Correct so far; ${empty} still to fill in.`) : ok("✓ All values correct."); });
      $('[data-c="show"]', host).addEventListener("click", () => { if (!solved.has(skey)) { solved.add(skey); after(); } $('[data-c="fb"]', host).innerHTML = st.map((r) => r.mean == null ? `${r.T} °C: no decolourisation within 600 s, so no mean and no rate` : `${r.T} °C: (${r.keep.join(" + ")}) ÷ ${r.keep.length} = ${f1(r.mean)} s; rate = 1 ÷ ${f1(r.mean)} = ${sf3(r.rate)} s⁻¹`).join("<br>"); });
      function hiCheck() { const v = +$('[data-c="hi"]', host).value; const best = st.filter((r) => r.rate).reduce((a, r) => (!a || r.rate > a.rate ? r : a), null); const fb = $('[data-c="hifb"]', host); if (!v) { fb.innerHTML = amb("Choose a temperature."); return; } fb.innerHTML = best && v === best.T ? ok(`✓ ${best.T} °C has the shortest mean time and so the highest rate in this data set. With measurements several degrees apart, the true optimum could lie on either side of it.`) : bad("Look for the shortest mean time: the shortest time gives the highest rate."); }
      after();
    }
    render(); document.addEventListener("labrun", render);
  }

  B.labSims.yeast = { sim, calc, STAGES, specimen, statsOf, _bench: bench, _graph: rateGraph };
})(window.BIO);
