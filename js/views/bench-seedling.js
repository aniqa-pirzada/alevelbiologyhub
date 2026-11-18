// RP9 virtual bench (Phase 5 Batch 3, author B5): competition and seedling growth (handbook pp. 84 to 86).
// B.labSims.seedling = { sim(host, key), calc(host, key) }, called by js/views/lab.js when B.practicals[9].sim === "seedling".
// Stages: 1 Plan, 2 Set up (handbook steps 1 to 4), 3 Days 1 to 3 (step 5: count germinated seeds), 4 Measure (step 6),
// 5 Results (step 7; saved for the Calculate tab, step 8).
// ONE model drives everything: B.seedlingModel.experiment() decides which seeds germinate on which day and the root and
// shoot length of every seedling (data/content/_seedling-model.js); the drawings, the counts the student checks, the
// ruler readings, the results table, the Calculate tab, the statistics and the graph all use those same values. Runs are
// saved in B.store.get().labRuns[key] and hold SIMULATED values only. No animation is used, so reduced motion needs no
// separate mode. Layout: B.ix.split stage + panel. Means and statistics are never shown in the Sim tab, so the
// Calculate tab's answers are not given away; they appear there only after the student checks or asks for them.
window.BIO = window.BIO || {}; window.BIO.labSims = window.BIO.labSims || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.seedlingModel, P9 = () => B.practicals[9] || {}, A = () => P9().art;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
  const ok = (t) => `<span style="color:var(--sage-ink)">${t}</span>`, bad = (t) => `<span style="color:var(--rose-ink)">${t}</span>`, amb = (t) => `<span style="color:var(--amber-ink)">${t}</span>`;
  const f1 = (x) => (Math.round(x * 10 + 1e-9) / 10).toFixed(1), f2 = (x) => (Math.round(x * 100 + 1e-9) / 100).toFixed(2);
  const num = (v) => { const s = String(v == null ? "" : v).trim().replace(",", ".").replace(/[^\d.\-]/g, ""); return s === "" || isNaN(+s) ? null : +s; };
  const inp = (id, w = "4.6rem", label = "") => `<input id="${id}" type="text" inputmode="decimal" autocomplete="off" ${label ? `aria-label="${esc(label)}"` : ""} style="width:${w};padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)">`;
  const uidOf = () => "sd" + Math.random().toString(36).slice(2, 7);
  let styled = false;
  const ensureStyle = () => { if (styled) return; styled = true; const s = document.createElement("style");
    s.textContent = `.sd-nav{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 .4rem;padding:0;list-style:none}.sd-nav button{font-size:.8rem;padding:.25rem .55rem;border-radius:999px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);cursor:pointer}
.sd-nav button[aria-current=step]{background:var(--teal);border-color:var(--teal);color:#fff}.sd-nav button.done::after{content:" ✓"}
.sd-fig{background:#fff;border-radius:10px;padding:.25rem;max-width:100%;overflow-x:auto}.sd-fig svg{display:block;width:100%;height:auto}
.sd-panel p{margin:.2rem 0}.sd-panel fieldset{margin:0 0 .5rem}.sd-steps{display:flex;flex-direction:column;gap:.3rem}.sd-steps .btn{text-align:left;white-space:normal;line-height:1.3}.sd-steps .btn.done{border-color:var(--sage-ink)}
.sd-tbl{overflow-x:auto;max-width:100%}.sd-msg{min-height:1.2em}.sd-dishes{display:flex;flex-wrap:wrap;gap:.3rem}.sd-dishes .btn[aria-pressed=true]{background:var(--teal);border-color:var(--teal);color:#fff}
.sd-cnt td,.sd-cnt th{padding:.2rem .35rem}.sd-list{font-size:.82rem;line-height:1.5;overflow-wrap:anywhere}`; document.head.append(s); };

  const STAGES = ["Plan", "Set up", "Days 1 to 3", "Measure", "Results"];
  const SETUP = [
    { id: "mark", ok: true, label: () => "Divide each dish base into segments on the outside with the marker pen (8 segments, as in the handbook's Figure 1)", why: "Step 1. The ink is on the outside, so it never touches the paper or the seeds; the segments spread the seeds evenly." },
    { id: "paper", ok: true, label: () => "Place a filter paper in each dish base", why: "Step 2. The papers fit the base exactly, so every dish has the same area." },
    { id: "water", ok: true, label: (S) => (S.water === "byEye" ? "Pour some boiled water into each dish by eye (method error chosen)" : "Add the same amount of boiled water to each dish (3 cm³ in this simulation)"), why: (S) => (S.water === "byEye" ? "Step 2, done badly on purpose: the volume is not the same in every dish." : "Step 2. Water is one of the resources the seedlings compete for, so every dish gets the same volume: in the lab, add enough to wet the paper with no surface water (centres trial the volume); this simulation uses 3 cm³.") },
    { id: "sow", ok: true, label: (S) => (S.handling === "fingers" ? "Pick up the seeds with your fingers and place 1 per segment in dish 1, up to 5 per segment in dish 5 (method error chosen)" : "Using forceps, place 1 seed in the middle of each segment of dish 1, 2 per segment in dish 2, up to 5 per segment in dish 5"), why: (S) => (S.handling === "fingers" ? "Step 3, done badly on purpose: handling seeds can bring in moulds." : "Step 3. 8, 16, 24, 32 and 40 seeds: the density is the independent variable. Forceps avoid touching the seeds, which reduces mould.") },
    { id: "lids", ok: true, label: (S) => (S.place === "windowsill" ? "Put the lids on and leave the dishes on a warm, sunny windowsill (method error chosen)" : "Put the lids on and place all the dishes together in a dark cupboard"), why: (S) => (S.place === "windowsill" ? "Step 4, done badly on purpose: light and warmth, and the dishes can dry out." : "Step 4. Darkness removes competition for light; together in one cupboard, every dish is at the same temperature.") },
    { id: "inside", ok: false, label: () => "Draw the segment lines on the filter paper inside each dish", why: "Not the handbook method: the segments are drawn on the outside of the base, so the ink never touches the paper or the seeds." },
    { id: "extra", ok: false, label: () => "Give the dishes with more seeds more water, so each seed gets the same amount", why: "No: water is one of the resources being competed for. The same volume in every dish means less water for each seed as density rises." },
    { id: "five", ok: false, label: () => "Put 5 seeds in every segment of every dish", why: "No: the number of seeds per segment is the independent variable, so it must be 1, 2, 3, 4 and 5 in dishes 1 to 5." },
  ];
  const SHOWN = ["water", "five", "mark", "lids", "inside", "sow", "paper", "extra"]; // fixed mixed order
  const ORDER = ["mark", "paper", "water", "sow", "lids"];
  const CTL = [["vol", "Volume of water in each dish", 1], ["area", "Size of dish and filter paper", 1], ["batch", "Species and batch of seeds", 1], ["temp", "Temperature (all dishes in one cupboard)", 1], ["time", "Counting at the same time each day", 1], ["pen", "Colour of the marker pen", 0], ["lidc", "Which way up the lids are stacked", 0]];
  const PRED = [["fall", "The more seeds per segment, the shorter the mean root and shoot, because more seedlings share the same water and space."], ["same", "Growth will be the same in every dish, because every dish has the same water."], ["rise", "The more seeds per segment, the longer the seedlings, because crowded seedlings grow towards each other."]];
  const NULLH = [["ok", "There is no difference in mean growth between seedlings sown at different densities."], ["hyp", "Seedlings sown more densely will grow less."], ["bad", "Density has no effect on the seeds, so the experiment will not work."]];
  const optLabel = (o) => [o.water === "byEye" ? "water by eye" : "", o.place === "windowsill" ? "warm windowsill" : "", o.handling === "fingers" ? "seeds handled" : ""].filter(Boolean).join(", ");
  const runLabel = (r, i) => `Run ${i + 1}${optLabel(r.opts) ? ` (method errors: ${optLabel(r.opts)})` : " (handbook method)"}`;
  // compact copy of an experiment for storage and for the Calculate tab
  const pack = (ex) => ex.map((D) => ({ d: D.d, sown: D.sown, counts: M().counts(D), roots: M().lengths(D, "root"), shoots: M().lengths(D, "shoot") }));

  function bench(host, key, onRun) {
    ensureStyle(); const u = uidOf();
    const S = { stage: 0, ctlOK: false, prediction: "", nullh: "", water: "measured", place: "dark", handling: "forceps", setup: [], ex: null, day: 0, counted: {}, zoom: 0, meas: [], measDish: 0, allMeasured: false, saved: false, seed: (Date.now() % 90000) + 1000 };
    host.innerHTML = `<p class="small muted">Simulated seeds from this site's model: nothing real is grown here. <span class="badge amber">simulated</span></p>
      <ol class="sd-nav" aria-label="Stages of the practical">${STAGES.map((s, i) => `<li><button type="button" data-st="${i}">${i + 1} ${s}</button></li>`).join("")}</ol>
      <div data-y="body"></div><div class="small sd-msg" aria-live="polite" data-y="live"></div>`;
    const q = (k, root = host) => $(`[data-y="${k}"]`, root);
    const say = (t) => { q("live").innerHTML = t; };
    const setupDone = () => ORDER.every((id) => S.setup.includes(id));
    const daysDone = () => [1, 2, 3].every((d) => S.counted[d]);
    const doneStage = (i) => [S.ctlOK && S.prediction && S.nullh === "ok", setupDone(), daysDone(), S.allMeasured, S.saved][i];
    const nav = () => $$(".sd-nav button", host).forEach((b, i) => { b.removeAttribute("aria-current"); if (i === S.stage) b.setAttribute("aria-current", "step"); b.classList.toggle("done", !!doneStage(i)); });
    $$(".sd-nav button", host).forEach((b) => b.addEventListener("click", () => go(+b.dataset.st)));
    function go(i, keep) { S.stage = i; nav(); if (!keep) say(""); [plan, setup, days, measure, results][i](q("body")); }
    const fig = (inner, minW) => `<div class="sd-fig ix-hscroll">${inner}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
    const nextBtn = (i, label) => `<button type="button" class="btn sm" data-next="${i}">${label || `Next: ${STAGES[i]}`} →</button>`;
    const wireNext = (box) => $$("[data-next]", box).forEach((b) => b.addEventListener("click", () => { go(+b.dataset.next); host.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }));
    const resetRun = () => { S.setup = []; S.ex = null; S.day = 0; S.counted = {}; S.meas = []; S.allMeasured = false; S.saved = false; S.seed = (Date.now() % 90000) + 1000; };
    const plateNow = (o = {}) => { const st = S.setup; const nd = st.includes("sow") ? 5 : 0;
      const aria = `Five Petri dishes seen from above${st.includes("mark") ? ", each base marked into 8 segments" : ""}${st.includes("water") ? ", filter paper wetted" : st.includes("paper") ? ", filter paper in place" : ""}${nd ? ": dish 1 has 1 seed per segment, rising to 5 seeds per segment in dish 5" : ""}${S.day ? `. Day ${S.day}: seeds that have germinated show a pale young root and, later, a yellowish shoot` : ""}${o.sel != null ? `. Dish ${o.sel + 1} is selected` : ""}.`;
      return A().plate({ id: u + "pl", dishes: S.ex, day: S.day, d: nd, marked: st.includes("mark"), paper: st.includes("paper"), water: st.includes("water"), sel: o.sel, minW: 460, aria }); };

    // ---- 1 Plan ----
    function plan(box) {
      const demo = M().experiment({ seed: 4242 });
      box.innerHTML = B.ix.split(fig(A().plate({ id: u + "pl", dishes: demo, day: 3, minW: 460, aria: "Example of what you will see on day 3: five Petri dishes seen from above with 1 to 5 seeds per segment; most seeds have a pale young root and a yellowish shoot, and the seedlings in the crowded dishes are shorter." })) + `<p class="tiny muted mt">An example of what the dishes look like on day 3 (simulated).</p>`,
        `<div class="sd-panel"><fieldset><legend>Variables</legend><p class="small"><strong>Independent:</strong> seeds per segment (1 to 5).<br><strong>Dependent:</strong> seeds germinated each day; root and shoot length after about 3 days.</p><p class="small"><strong>Tick the variables you must keep the same:</strong></p>${CTL.map(([k, t, c]) => `<label class="small"><input type="checkbox" data-ctl="${k}" data-c="${c}"> ${t}</label>`).join("")}
          <div class="row"><button type="button" class="btn sm" data-y="ctlchk">Check my controls</button></div><div class="small" data-y="ctlfb" aria-live="polite"></div></fieldset>
        <fieldset><legend>Prediction</legend>${PRED.map(([k, t]) => `<label class="small"><input type="radio" name="${u}pr" value="${k}" ${S.prediction === k ? "checked" : ""}> ${t}</label>`).join("")}<div class="small" data-y="prfb" aria-live="polite"></div></fieldset>
        <fieldset><legend>Null hypothesis for growth</legend>${NULLH.map(([k, t]) => `<label class="small"><input type="radio" name="${u}nh" value="${k}" ${S.nullh === k ? "checked" : ""}> ${t}</label>`).join("")}<div class="small" data-y="nhfb" aria-live="polite"></div></fieldset>
        <div class="row">${nextBtn(1)}</div></div>`, { label: "Plan the investigation" });
      q("ctlchk", box).addEventListener("click", () => { const wrong = $$("[data-ctl]", box).filter((c) => c.checked !== (c.dataset.c === "1")); S.ctlOK = !wrong.length; nav(); q("ctlfb", box).innerHTML = wrong.length ? bad(`Not quite: ${wrong.length} to change. A control variable is one that could change germination or growth if it were different; the pen colour and the way the lids are stacked cannot.`) : ok("Correct: each of these could change germination or growth, so each is kept the same."); });
      $$(`input[name=${u}pr]`, box).forEach((r) => r.addEventListener("change", () => { S.prediction = r.value; nav(); q("prfb", box).innerHTML = r.value === "fall" ? ok("A testable prediction with a reason: intraspecific competition for water and space.") : amb("You can test any prediction. Think about what is shared in each dish; the results will show whether you were right."); }));
      $$(`input[name=${u}nh]`, box).forEach((r) => r.addEventListener("change", () => { S.nullh = r.value; nav(); q("nhfb", box).innerHTML = r.value === "ok" ? ok("Correct: a null hypothesis states that there is no difference. A statistical test can reject it or fail to reject it, but never prove it.") : r.value === "hyp" ? amb("That is a hypothesis (a prediction), not a null hypothesis. A null hypothesis says there is no difference.") : bad("A null hypothesis is about the variables (no difference in growth between densities), not about whether the experiment works."); }));
      wireNext(box);
    }

    // ---- 2 Set up (handbook steps 1 to 4) ----
    function setup(box) {
      const locked = S.setup.length > 0, done = setupDone();
      box.innerHTML = B.ix.split(fig(plateNow()) + `<p class="tiny muted mt">${done ? (S.place === "windowsill" ? "The dishes are on a warm, sunny windowsill." : "The dishes are together in a dark cupboard.") : "Follow handbook steps 1 to 4."}</p>`,
        `<div class="sd-panel"><details class="small" ${S.water !== "measured" || S.place !== "dark" || S.handling !== "forceps" ? "open" : ""}><summary>Method errors on purpose (optional)</summary><fieldset ${locked ? "disabled" : ""} style="border:0;padding:.2rem 0;margin:0"><legend class="sr-only">Method errors on purpose</legend>
          <label class="small"><input type="checkbox" data-y="e1" ${S.water === "byEye" ? "checked" : ""}> Pour the water by eye instead of measuring it</label>
          <label class="small"><input type="checkbox" data-y="e2" ${S.place === "windowsill" ? "checked" : ""}> Leave the dishes on a warm, sunny windowsill</label>
          <label class="small"><input type="checkbox" data-y="e3" ${S.handling === "fingers" ? "checked" : ""}> Pick up the seeds with your fingers</label></fieldset></details>
        <fieldset><legend>Choose the next step</legend><div class="small" data-y="sfb" aria-live="polite" style="margin-bottom:.3rem"></div><div class="sd-steps">${SHOWN.map((id) => { const s = SETUP.find((x) => x.id === id); const d = S.setup.includes(id); return `<button type="button" class="btn sm${d ? " done" : ""}" data-step="${id}" ${d || done ? "disabled" : ""}>${d ? "✓ " : ""}${s.label(S)}</button>`; }).join("")}</div></fieldset>
        <div class="row">${done ? nextBtn(2, "Next: open the cupboard on day 1") : '<button type="button" class="btn sm" data-y="redo">Start the set-up again</button>'}</div></div>`, { label: "Set up the five dishes" });
      const err = (k, f) => { const c = q(k, box); c.addEventListener("change", () => { f(c.checked); setup(box); }); };
      err("e1", (v) => (S.water = v ? "byEye" : "measured")); err("e2", (v) => (S.place = v ? "windowsill" : "dark")); err("e3", (v) => (S.handling = v ? "fingers" : "forceps"));
      $$("[data-step]", box).forEach((b) => b.addEventListener("click", () => { const s = SETUP.find((x) => x.id === b.dataset.step); const fb = q("sfb", box); const why = typeof s.why === "function" ? s.why(S) : s.why;
        if (!s.ok) { fb.innerHTML = bad(why); return; }
        const want = ORDER[S.setup.length]; if (s.id !== want) { fb.innerHTML = amb(`Not yet: first, ${SETUP.find((x) => x.id === want).label(S).replace(/ \(method error chosen\)/, "").replace(/^./, (c) => c.toLowerCase())}.`); return; }
        S.setup.push(s.id); if (setupDone()) S.ex = M().experiment({ seed: S.seed, water: S.water, place: S.place, handling: S.handling });
        nav(); setup(box); q("sfb", box).innerHTML = ok(why); say(`Done: ${s.label(S)}.`); }));
      const redo = q("redo", box); if (redo) redo.addEventListener("click", () => { resetRun(); nav(); setup(box); });
      wireNext(box);
    }

    // ---- 3 Days 1 to 3 (step 5: count germinated seeds at the same time each day) ----
    function countTable() {
      const days = [1, 2, 3].filter((d) => S.counted[d]); if (!days.length) return `<p class="small muted">No counts yet.</p>`;
      return `<table class="tbl small sd-cnt"><caption class="tiny muted" style="text-align:left">Simulated counts: number of seeds germinated (young root visible)</caption><thead><tr><th scope="col">Dish (seeds per segment)</th><th scope="col">Seeds sown</th>${days.map((d) => `<th scope="col">Day ${d}</th>`).join("")}</tr></thead><tbody>${S.ex.map((D, i) => `<tr><td>${i + 1}</td><td>${D.sown}</td>${days.map((d) => `<td>${M().counts(D)[d - 1]}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    function days(box) {
      if (!S.ex) { box.innerHTML = `<p class="small">${bad("Set up the dishes first (stage 2).")}</p>`; return; }
      const next = [1, 2, 3].find((d) => !S.counted[d]); const day = S.day; const counting = day && !S.counted[day];
      const zoomD = S.ex[S.zoom];
      const stage = day ? `<div style="max-width:440px;margin-inline:auto">` + fig(A().oneDish({ id: u + "od", d: S.zoom + 1, dish: zoomD, day, aria: `Dish ${S.zoom + 1} on day ${day}, enlarged for counting: ${zoomD.sown} seeds in 8 segments; germinated seeds show a pale young root.` })) + `</div>` + `<div class="sd-dishes mt" role="group" aria-label="Choose a dish to look at closely">${S.ex.map((D, i) => `<button type="button" class="btn sm" data-zoom="${i}" aria-pressed="${i === S.zoom}">Dish ${i + 1}</button>`).join("")}</div><p class="tiny muted">Look at each dish closely. A seed counts as germinated when its young root (radicle) is visible <span class="badge">site definition</span>.</p>`
        : fig(plateNow()) + `<p class="tiny muted mt">Day 0: the dishes have just been put in the ${S.place === "windowsill" ? "warm, sunny windowsill" : "cupboard"}.</p>`;
      box.innerHTML = B.ix.split(stage + `<div class="sd-tbl mt">${countTable()}</div>`,
        `<div class="sd-panel">${counting ? `<fieldset><legend>Day ${day}: number of seeds germinated in each dish</legend><table class="small sd-cnt"><tbody>${S.ex.map((D, i) => `<tr><th scope="row">Dish ${i + 1} (${D.sown} seeds)</th><td>${inp(`${u}c${i}`, "4rem", `dish ${i + 1}, germinated on day ${day}`)}</td></tr>`).join("")}</tbody></table>
          <div class="row"><button type="button" class="btn sm primary" data-y="cchk">Check my counts</button><button type="button" class="btn sm" data-y="cauto">Count for me</button></div><div class="small" data-y="cfb" aria-live="polite"></div></fieldset>`
          : next ? `<p class="small">${day ? ok(`Day ${day} recorded.`) : "The seeds have been in the cupboard overnight."}</p><div class="row"><button type="button" class="btn sm primary" data-y="open">Open the ${S.place === "windowsill" ? "dishes" : "cupboard"} on day ${next}, at the same time as before</button></div>`
          : `<p class="small">${ok("Days 1, 2 and 3 recorded.")} After about 3 days the seedlings are removed and measured (step 6).</p><div class="row">${nextBtn(3, "Next: measure the seedlings")}</div>`}</div>`, { label: "Count the germinated seeds each day", cls: "ix-nosticky-sm" });
      $$("[data-zoom]", box).forEach((b) => b.addEventListener("click", () => { S.zoom = +b.dataset.zoom; const vals = S.ex.map((_, i) => ($("#" + u + "c" + i, box) || {}).value); days(box); vals.forEach((v, i) => { const e = $("#" + u + "c" + i, box); if (e && v != null) e.value = v; }); const z = $(`[data-zoom="${S.zoom}"]`, box); if (z) z.focus(); }));
      const op = q("open", box); if (op) op.addEventListener("click", () => { S.day = next; S.zoom = 0; say(`Day ${next}: count the germinated seeds in each dish.`); days(box); });
      const record = (how) => { S.counted[day] = how; nav(); say(ok(`Day ${day} counts recorded.`)); days(box); };
      const ch = q("cchk", box); if (ch) ch.addEventListener("click", () => { let wrong = 0, empty = 0; S.ex.forEach((D, i) => { const e = $("#" + u + "c" + i, box); const v = num(e.value); if (v == null) { empty++; return; } const good = v === M().counts(D)[day - 1]; if (!good) wrong++; e.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; e.setAttribute("aria-invalid", String(!good)); });
        if (!wrong && !empty) return record("student"); q("cfb", box).innerHTML = wrong ? bad(`${wrong} count${wrong === 1 ? " is" : "s are"} not right (red border). Look at each dish again: count every seed with a visible young root, including ones that germinated on an earlier day.`) : amb(`${empty} still to fill in.`); });
      const au = q("cauto", box); if (au) au.addEventListener("click", () => record("auto"));
      wireNext(box);
    }

    // ---- 4 Measure (step 6) ----
    function measure(box) {
      if (!daysDone()) { box.innerHTML = `<p class="small">${bad("Count the germinated seeds on days 1, 2 and 3 first (stage 3).")}</p>`; return; }
      const D = S.ex[S.measDish]; const list = M().seedsOf(D).filter((x) => x.day); const done = S.meas.filter((m) => m.dish === S.measDish).length; const sd = list[done];
      const need = Math.max(0, 3 - S.meas.length);
      box.innerHTML = B.ix.split(sd && !S.allMeasured ? fig(A().ruler({ id: u + "ru", root: sd.root, shoot: sd.shoot, minW: 460, aria: `Seedling ${done + 1} from dish ${S.measDish + 1}, straightened along two millimetre rulers starting at the seed: read the root length from the upper ruler and the shoot length from the lower ruler.` })) + `<p class="tiny muted mt">Seedling ${done + 1} of ${list.length} germinated in dish ${S.measDish + 1}, laid straight along the rulers. Each length is read from the seed (0 mm) to the tip, to the nearest mm.</p>`
          : fig(A().plate({ id: u + "pl", dishes: S.ex, day: 3, minW: 460, aria: "The five dishes on day 3, with their seedlings." })) + `<p class="tiny muted mt">Day 3.</p>`,
        `<div class="sd-panel">${S.allMeasured ? `<p class="small">${ok("All germinated seedlings measured and recorded.")}</p><div class="row">${nextBtn(4, "Next: results")}</div>` : `<fieldset><legend>Measure a seedling</legend><div class="sd-dishes" role="group" aria-label="Choose a dish">${S.ex.map((_, i) => `<button type="button" class="btn sm" data-md="${i}" aria-pressed="${i === S.measDish}">Dish ${i + 1}</button>`).join("")}</div>
          ${sd ? `<p class="small mt"><label>Root length / mm ${inp(u + "mr", "4rem", "root length in millimetres")}</label></p><p class="small"><label>Shoot length / mm ${inp(u + "ms", "4rem", "shoot length in millimetres")}</label></p><div class="row"><button type="button" class="btn sm primary" data-y="mrec">Record this seedling</button></div>` : `<p class="small mt">All seedlings in this dish are measured; choose another dish.</p>`}
          <div class="small" data-y="mfb" aria-live="polite"></div></fieldset>
          <p class="small">${need ? `Measure ${need} more seedling${need === 1 ? "" : "s"} yourself; then the rest can be recorded for you.` : ok(`You have measured ${S.meas.length} seedlings.`)}</p>
          <div class="row"><button type="button" class="btn sm" data-y="mall" ${need ? "disabled" : ""}>Measure the rest for me (nearest mm)</button></div>`}</div>`, { label: "Measure the roots and shoots", cls: "ix-nosticky-sm" });
      $$("[data-md]", box).forEach((b) => b.addEventListener("click", () => { S.measDish = +b.dataset.md; measure(box); }));
      const mr = q("mrec", box); if (mr) mr.addEventListener("click", () => { const r = num($("#" + u + "mr", box).value), s = num($("#" + u + "ms", box).value); const fb = q("mfb", box);
        if (r == null || s == null) { fb.innerHTML = amb("Type both lengths in millimetres."); return; }
        const gr = Math.abs(r - sd.root) <= 1, gs = Math.abs(s - sd.shoot) <= 1;
        if (!gr || !gs) { fb.innerHTML = bad(`${!gr ? "Check the root: read the upper ruler from the seed (0) to the root tip." : ""} ${!gs ? "Check the shoot: read the lower ruler from the seed (0) to the shoot tip." : ""}`); return; }
        S.meas.push({ dish: S.measDish, root: sd.root, shoot: sd.shoot }); say(ok(`Recorded: root ${sd.root} mm, shoot ${sd.shoot} mm (to the nearest mm).`)); measure(box); });
      const ma = q("mall", box); if (ma) ma.addEventListener("click", () => { S.allMeasured = true; nav(); say(ok("All the other seedlings have been measured to the nearest millimetre and recorded.")); measure(box); });
      wireNext(box);
    }

    // ---- 5 Results (step 7) ----
    function results(box) {
      if (!S.allMeasured) { box.innerHTML = `<p class="small">${bad("Measure the seedlings first (stage 4).")}</p>`; return; }
      const pk = pack(S.ex);
      box.innerHTML = `<div class="sd-tbl"><table class="tbl small"><caption class="tiny muted" style="text-align:left">Simulated results${optLabel(S) ? ` (method errors: ${optLabel(S)})` : ""}: seeds germinated (young root visible) and lengths of the seedlings that germinated, to the nearest mm</caption><thead><tr><th scope="col">Dish (seeds per segment)</th><th scope="col">Seeds sown</th><th scope="col">Germinated day 1</th><th scope="col">Day 2</th><th scope="col">Day 3</th><th scope="col">Root lengths / mm</th><th scope="col">Shoot lengths / mm</th></tr></thead><tbody>${pk.map((D) => `<tr><td>${D.d}</td><td>${D.sown}</td>${D.counts.map((c) => `<td>${c}</td>`).join("")}<td class="sd-list">${D.roots.join(", ")}</td><td class="sd-list">${D.shoots.join(", ")}</td></tr>`).join("")}</tbody></table></div>
        <p class="small muted">Seeds that did not germinate have no length: they are not recorded as 0. Means, statistics and the graph are worked out in the Calculate tab.</p>
        <div class="row">${S.saved ? `<button type="button" class="btn sm primary" data-y="tocalc">Process this run in the Calculate tab →</button><button type="button" class="btn sm" data-y="newrun">Start a new run</button>` : `<button type="button" class="btn sm primary" data-y="save">Save this run</button>`}</div>`;
      const sv = q("save", box); if (sv) sv.addEventListener("click", () => { S.saved = true; nav(); onRun({ ts: Date.now(), seed: S.seed, opts: { water: S.water, place: S.place, handling: S.handling }, counted: S.counted, measured: S.meas.length, dishes: pk }); say(ok("Run saved. Process it in the Calculate tab: percentages, means, confidence intervals and graph.")); results(box); });
      const tc = q("tocalc", box); if (tc) tc.addEventListener("click", () => { const t = document.querySelector('[role="tab"][data-tab="calc"]'); if (t) { t.click(); t.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); } });
      const nr = q("newrun", box); if (nr) nr.addEventListener("click", () => { resetRun(); say("New run: set up five new dishes."); go(1, true); });
    }
    go(0);
    return S;
  }

  // ======================= Sim tab =======================
  function sim(host, n) {
    host.innerHTML = `<div data-y="bench"></div><h3 class="mt">Saved runs</h3><p class="small muted">Each saved run holds the simulated germination counts and lengths. The Calculate tab processes them.</p><div data-y="runs" style="overflow-x:auto"></div><div class="row mt"><button class="btn sm" data-y="clear">Clear saved runs</button></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    const table = () => { if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", table); return; }
      $('[data-y="runs"]', host).innerHTML = runs.length ? `<table class="tbl small"><thead><tr><th scope="col">#</th><th scope="col">Run</th><th scope="col">Germinated by day 3 (dishes 1 to 5)</th></tr></thead><tbody>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(runLabel(r, i))}</td><td>${r.dishes.map((D) => `${D.counts[2]} of ${D.sown}`).join("; ")}</td></tr>`).join("")}</tbody></table>` : '<p class="muted small">No runs saved yet.</p>'; };
    const S = bench($('[data-y="bench"]', host), n, (r) => { runs.push(r); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    B.labSims.seedling._state = S;
    $('[data-y="clear"]', host).addEventListener("click", () => { if (confirm("Clear all saved runs for this practical?")) { runs.length = 0; B.store.save(); table(); document.dispatchEvent(new Event("labrun")); } });
    table(); host.dataset.mounted = "1"; document.addEventListener("labrun", table);
  }

  // ======================= Calculate tab =======================
  // The practice set is the model run with seed 9091 and the handbook method; it is used nowhere else on the page.
  const practice = () => ({ label: "Practice data set: handbook method (checked answers)", opts: {}, dishes: pack(M().experiment({ seed: 9091 })) });
  const procOf = (ds) => ds.dishes.map((D) => ({ d: D.d, sown: D.sown, g: D.counts[2], pct: (100 * D.counts[2]) / D.sown, r: M().stats(D.roots), s: M().stats(D.shoots) }));
  // graph of mean root and shoot length against seeds per segment, optional 95 % confidence interval bars
  function lenGraph(pr, o = {}) {
    const W = 560, H = 340, L = 70, Rr = 20, Tp = 24, Bt = 62; const pw = W - L - Rr, ph = H - Tp - Bt;
    const top = Math.max(40, Math.ceil(Math.max(...pr.map((p) => (o.ci && p.r.hi ? p.r.hi : p.r.mean || 0))) / 10) * 10);
    const X = (d) => L + ((d - 0.5) / 5) * pw, Y = (v) => Tp + ph - (v / top) * ph;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(o.aria || "")}" style="max-width:100%;height:auto;background:#fff;min-width:460px"><rect width="${W}" height="${H}" fill="#fff"/>`;
    for (let v = 0; v <= top; v += 10) s += `<line x1="${L}" y1="${Y(v)}" x2="${W - Rr}" y2="${Y(v)}" stroke="#e3e7ec"/><text x="${L - 8}" y="${Y(v) + 5}" font-size="14" text-anchor="end" fill="#16263a">${v}</text>`;
    s += `<line x1="${L}" y1="${Tp}" x2="${L}" y2="${Tp + ph}" stroke="#16263a" stroke-width="1.5"/><line x1="${L}" y1="${Tp + ph}" x2="${W - Rr}" y2="${Tp + ph}" stroke="#16263a" stroke-width="1.5"/>`;
    for (let d = 1; d <= 5; d++) s += `<line x1="${X(d)}" y1="${Tp + ph}" x2="${X(d)}" y2="${Tp + ph + 6}" stroke="#16263a"/><text x="${X(d)}" y="${Tp + ph + 22}" font-size="14" text-anchor="middle" fill="#16263a">${d}</text>`;
    s += `<text x="${L + pw / 2}" y="${H - 14}" font-size="15" font-weight="600" text-anchor="middle" fill="#16263a">seeds per segment</text><text transform="translate(18 ${Tp + ph / 2}) rotate(-90)" font-size="15" font-weight="600" text-anchor="middle" fill="#16263a">mean length / mm</text>`;
    const ser = [["r", "#1d5f8a", "root", 0], ["s", "#7a6a12", "shoot", 1]];
    for (const [k, col, , sh] of ser) { const pts = pr.filter((p) => p[k].mean != null).map((p) => [X(p.d) + (sh ? 6 : -6), Y(p[k].mean), p]);
      if (o.ci) for (const [x, , p] of pts) if (p[k].hi != null) s += `<line x1="${x}" y1="${Y(p[k].lo)}" x2="${x}" y2="${Y(p[k].hi)}" stroke="${col}" stroke-width="1.6"/><line x1="${x - 5}" y1="${Y(p[k].lo)}" x2="${x + 5}" y2="${Y(p[k].lo)}" stroke="${col}" stroke-width="1.6"/><line x1="${x - 5}" y1="${Y(p[k].hi)}" x2="${x + 5}" y2="${Y(p[k].hi)}" stroke="${col}" stroke-width="1.6"/>`;
      s += `<polyline points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}" fill="none" stroke="${col}" stroke-width="2"/>`;
      for (const [x, y] of pts) s += sh ? `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="#fff" stroke="${col}" stroke-width="2.2"/>` : `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff" stroke="${col}" stroke-width="2.2"/>`; }
    s += `<g transform="translate(${W - Rr - 150} ${Tp + 6})"><rect width="146" height="48" rx="6" fill="#fff" stroke="#c9d1da"/><circle cx="16" cy="16" r="5.5" fill="#fff" stroke="#1d5f8a" stroke-width="2.2"/><text x="30" y="21" font-size="14" fill="#16263a">root</text><rect x="11" y="29" width="10" height="10" fill="#fff" stroke="#7a6a12" stroke-width="2.2"/><text x="30" y="39" font-size="14" fill="#16263a">shoot</text></g>`;
    return s + "</svg>";
  }
  function calc(host, n) {
    ensureStyle(); const u = uidOf(); let sel = null; const solved = new Set(), ciDone = new Set(), tried = new Set(), ciTried = new Set(); // "Show the answers" appears only after a check with a value entered (review RK-6)
    const list = () => { const runs = B.store.get().labRuns[n] || []; return [...runs.map((r, i) => ({ id: "r" + i, label: runLabel(r, i), ds: r })), { id: "prac", label: "Practice data set: handbook method (checked answers)", ds: practice() }]; };
    const current = () => { const L = list(); return L.find((x) => x.id === sel) || L[L.length > 1 ? L.length - 2 : 0]; };
    function render() {
      if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", render); return; } host.dataset.mounted = "1";
      const c = current(); const pr = procOf(c.ds); const g = (id) => num(($("#" + id, host) || {}).value);
      host.innerHTML = `<div class="card mb"><h3>1 Percentage germinated and mean lengths</h3><label class="small">Data set <select data-c="ds">${list().map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
          <p class="small">For each dish, calculate the percentage of seeds germinated by day 3, and the mean root and mean shoot length of the seedlings that germinated (1 decimal place). Open a dish's lengths to see them.</p>
          <div class="sd-tbl"><table class="tbl small"><thead><tr><th scope="col">Seeds per segment</th><th scope="col">Germinated by day 3</th><th scope="col">% germinated</th><th scope="col">Mean root / mm</th><th scope="col">Mean shoot / mm</th></tr></thead><tbody>${pr.map((p, i) => `<tr><td>${p.d}</td><td>${p.g} of ${p.sown}<details class="tiny"><summary>lengths</summary>root: ${c.ds.dishes[i].roots.join(", ")}<br>shoot: ${c.ds.dishes[i].shoots.join(", ")}</details></td><td>${inp(`${u}p${i}`, "4.2rem", `percentage germinated, ${p.d} per segment`)}</td><td>${p.r.n ? inp(`${u}r${i}`, "4.2rem", `mean root, ${p.d} per segment`) : "none germinated"}</td><td>${p.s.n ? inp(`${u}s${i}`, "4.2rem", `mean shoot, ${p.d} per segment`) : "none"}</td></tr>`).join("")}</tbody></table></div>
          <div class="row"><button type="button" class="btn sm" data-c="chk">Check</button><button type="button" class="btn sm" data-c="show" ${tried.has(c.id) ? "" : "hidden"}>Show the answers</button></div><div class="small" data-c="fb" aria-live="polite"></div></div>
        <div data-c="after"></div>`;
      const after = () => { const a = $('[data-c="after"]', host); if (!solved.has(c.id)) { a.innerHTML = `<div class="card mb"><h3>2 Graph</h3><p class="small muted">Check your percentages and means (all correct), or show the answers, to draw the graph.</p></div>`; return; }
        const p1 = pr[0], p5 = pr[4]; const canCI = p1.r.n >= 2 && p5.r.n >= 2;
        a.innerHTML = `<div class="card mb"><h3>2 Graph</h3><label class="small"><input type="checkbox" data-c="ci"> Show 95 % confidence intervals</label><div class="sd-fig ix-hscroll mt" style="max-width:640px" data-c="gr">${lenGraph(pr, { aria: `Graph of mean root and shoot length against seeds per segment: root ${pr.map((p) => (p.r.mean == null ? "none" : f1(p.r.mean))).join(", ")} mm; shoot ${pr.map((p) => (p.s.mean == null ? "none" : f1(p.s.mean))).join(", ")} mm for 1 to 5 seeds per segment.` })}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p><p class="tiny muted">Points are joined with straight lines. Root and shoot points are drawn slightly apart so their bars do not hide each other.</p></div>
          <div class="card mb"><h3>3 Is the difference in root length significant? <span class="badge">classwork skill</span></h3>${canCI ? `<p class="small">Compare 1 and 5 seeds per segment. Your calculator gives the standard deviation (SD). SE = SD ÷ √n, where n is the number of seedlings measured; 95 % confidence interval = mean ± 1.96 × SE. Give SE to 2 decimal places and the limits to 1 decimal place. You calculate these in class; in the written exam you choose a test and interpret it.</p>
            <div class="sd-tbl"><table class="tbl small"><thead><tr><th scope="col">Seeds per segment</th><th scope="col">n</th><th scope="col">Mean root / mm</th><th scope="col">SD / mm</th><th scope="col">SE / mm</th><th scope="col">Lower limit / mm</th><th scope="col">Upper limit / mm</th></tr></thead><tbody>${[[p1, 0], [p5, 4]].map(([p, i]) => `<tr><td>${p.d}</td><td>${p.r.n}</td><td>${f1(p.r.mean)}</td><td>${f2(p.r.sd)}</td><td>${inp(`${u}se${i}`, "4rem", `SE, ${p.d} per segment`)}</td><td>${inp(`${u}lo${i}`, "4rem", `lower limit, ${p.d} per segment`)}</td><td>${inp(`${u}hi${i}`, "4rem", `upper limit, ${p.d} per segment`)}</td></tr>`).join("")}</tbody></table></div>
            <div class="row"><button type="button" class="btn sm" data-c="cichk">Check</button><button type="button" class="btn sm" data-c="cishow" ${ciTried.has(c.id) ? "" : "hidden"}>Show the answers</button></div><div class="small" data-c="cifb" aria-live="polite"></div><div data-c="ovl"></div>` : `<p class="small muted">Fewer than 2 seedlings germinated in dish 1 or dish 5, so no standard error can be calculated for this data set.</p>`}</div>
          <div class="card"><h3>4 Germination: chi-squared <span class="badge">stretch</span></h3>${chiHTML(pr)}</div>`;
        const ci = $('[data-c="ci"]', a); ci.addEventListener("change", () => { $('[data-c="gr"]', a).innerHTML = lenGraph(pr, { ci: ci.checked, aria: `Graph of mean root and shoot length against seeds per segment${ci.checked ? ", with 95 % confidence interval bars" : ""}.` }); });
        if (canCI) { const rows = [[p1, 0], [p5, 4]];
          const ovl = () => { const b = $('[data-c="ovl"]', a); b.innerHTML = `<fieldset class="mt"><legend class="small">Do the two 95 % confidence intervals overlap?</legend><label class="small"><input type="radio" name="${u}ov" value="no"> No</label> <label class="small"><input type="radio" name="${u}ov" value="yes"> Yes</label></fieldset><div class="small" data-c="ovfb" aria-live="polite"></div>`;
            $$(`input[name=${u}ov]`, b).forEach((r) => r.addEventListener("change", () => { const overlap = p1.r.lo <= p5.r.hi && p5.r.lo <= p1.r.hi; const right = (r.value === "yes") === overlap; $('[data-c="ovfb"]', b).innerHTML = !right ? bad("Look again: compare the lower limit at 1 seed per segment with the upper limit at 5 seeds per segment.") : overlap ? ok("Correct: they overlap, so we cannot be 95 % confident that the means differ; the difference could be due to chance (the null hypothesis is not rejected).") : ok("Correct: they do not overlap, so we are 95 % confident the mean root lengths are different; the difference is unlikely to be due to chance and the null hypothesis is rejected."); })); };
          if (ciDone.has(c.id)) ovl();
          $('[data-c="cichk"]', a).addEventListener("click", () => { let wrong = 0, empty = 0; rows.forEach(([p, i]) => { [["se", p.r.se, 0.011], ["lo", p.r.lo, 0.06], ["hi", p.r.hi, 0.06]].forEach(([k, v, tol]) => { const e = $(`#${u}${k}${i}`, a); const x = num(e.value); if (x == null) { empty++; return; } const good = Math.abs(x - v) <= tol; if (!good) wrong++; e.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; e.setAttribute("aria-invalid", String(!good)); }); });
            if (empty < rows.length * 3) { ciTried.add(c.id); $('[data-c="cishow"]', a).hidden = false; }
            $('[data-c="cifb"]', a).innerHTML = wrong ? bad(`${wrong} value${wrong === 1 ? " is" : "s are"} wrong (red border). SE = SD ÷ √n; limits = mean − 1.96 × SE and mean + 1.96 × SE.`) : empty ? amb(`${empty} still to fill in.`) : ok("✓ All correct."); if (!wrong && !empty && !ciDone.has(c.id)) { ciDone.add(c.id); ovl(); } });
          $('[data-c="cishow"]', a).addEventListener("click", () => { $('[data-c="cifb"]', a).innerHTML = rows.map(([p]) => `${p.d} per segment: SE = ${f2(p.r.sd)} ÷ √${p.r.n} = ${f2(p.r.se)} mm; 95 % CI = ${f1(p.r.mean)} ± ${f2(1.96 * p.r.se)} = ${f1(p.r.lo)} to ${f1(p.r.hi)} mm`).join("<br>"); if (!ciDone.has(c.id)) { ciDone.add(c.id); ovl(); } }); }
      };
      $('[data-c="ds"]', host).addEventListener("change", (e) => { sel = e.target.value; render(); });
      $('[data-c="chk"]', host).addEventListener("click", () => { let wrong = 0, empty = 0, total = 0; pr.forEach((p, i) => { [["p", p.pct, p.sown], ["r", p.r.mean], ["s", p.s.mean]].forEach(([k, v]) => { if (v == null) return; total++; const e = $(`#${u}${k}${i}`, host); const x = g(`${u}${k}${i}`); if (x == null) { empty++; return; } const good = Math.abs(x - v) <= 0.051; if (!good) wrong++; e.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; e.setAttribute("aria-invalid", String(!good)); }); });
        if (total > empty) { tried.add(c.id); $('[data-c="show"]', host).hidden = false; }
        if (!wrong && !empty && !solved.has(c.id)) { solved.add(c.id); after(); }
        $('[data-c="fb"]', host).innerHTML = wrong ? bad(`${wrong} value${wrong === 1 ? " is" : "s are"} wrong (red border). % germinated = germinated ÷ sown × 100; mean = total of the lengths ÷ number of seedlings that germinated (not the number sown).`) : empty ? amb(`Correct so far; ${empty} still to fill in.`) : ok("✓ All values correct."); });
      $('[data-c="show"]', host).addEventListener("click", () => { if (!solved.has(c.id)) { solved.add(c.id); after(); } $('[data-c="fb"]', host).innerHTML = pr.map((p) => `${p.d} per segment: ${p.g} ÷ ${p.sown} × 100 = ${f1(p.pct)} %; mean root ${p.r.n ? `${f1(p.r.mean)} mm (${p.r.n} seedlings)` : "none"}; mean shoot ${p.s.n ? `${f1(p.s.mean)} mm` : "none"}`).join("<br>"); });
      after();
    }
    function chiHTML(pr) {
      const ch = M().chi2(pr.map((p) => p.sown), pr.map((p) => p.g)); const allG = pr.every((p) => p.g === p.sown);
      const tbl = `<div class="sd-tbl"><table class="tbl small"><caption class="tiny muted" style="text-align:left">Expected numbers if density had no effect (${f1(100 * ch.p)} % of all seeds germinated)</caption><thead><tr><th scope="col">Seeds per segment</th><th scope="col">Germinated: observed (expected)</th><th scope="col">Not germinated: observed (expected)</th></tr></thead><tbody>${pr.map((p, i) => `<tr><td>${p.d}</td><td>${p.g} (${f1(ch.expected[i][0])})</td><td>${p.sown - p.g} (${f1(ch.expected[i][1])})</td></tr>`).join("")}</tbody></table></div>`;
      if (allG) return `<p class="small">Every seed germinated, so there is nothing to test.</p>`;
      return `<p class="small">Germinated and not germinated are categories, so the chi-squared test is the right test. This is a different kind of chi-squared test from the one used for genetic ratios; you will not be asked to calculate it. ${tbl}</p>${ch.valid ? `<p class="small">χ² = ${f2(ch.chi)}, with (2 − 1) × (5 − 1) = 4 degrees of freedom; critical value at P = 0.05 is 9.49. ${ch.chi < 9.49 ? "χ² is below the critical value, so the null hypothesis (no difference in germination) is not rejected; this does not prove density has no effect." : "χ² is above the critical value, so the probability that the differences are due to chance is less than 0.05: the null hypothesis is rejected."}</p>` : `<p class="small">${amb(`The test is not valid here: the smallest expected number is ${f1(ch.minE)}, and chi-squared needs every expected number to be at least 5.`)} One group's five dishes hold only 120 seeds, and few fail to germinate. Pool the class's results (more dishes at each density) before using the test.</p>`}`;
    }
    render(); document.addEventListener("labrun", render);
  }

  B.labSims.seedling = { sim, calc, STAGES, practice, procOf, _bench: bench, _graph: lenGraph };
})(window.BIO);
