// Transport interactives for 3.1.4 (loaded after interactives-enzymes.js). Kinds: membraneExplorer, permeability,
// microvilliExplorer, diffusionSim, facilitatedExplorer, osmosisSim, pumpSim (transportIdentify removed in the release
// review, 2026-11-15: its questions are ordinary page questions on 3.1.4.3).
// Drawings are schematic; models are in data/content/_transport-art.js and documented there.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, raw, el, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || (B.store.get().prefs || {}).reducedMotion;
  // Release review 2026-11-15: no developer badges ("documented model", "illustrative model") for students; the badge
  // argument is kept so existing calls do not change, but it is no longer shown.
  const head = (spec) => h`<div class="card-head"><h3>${spec.title}</h3></div>` + (spec.note ? h`<p class="small muted">${spec.note}</p>` : "");
  const A = () => B.transportArt, M = () => B.transportModel, C = () => B.transportArt.colours;
  const loop = (host, fn) => { let raf; const step = (t) => { if (!document.body.contains(host)) return; fn(t); raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf); };

  // ---------- 1. Fluid-mosaic membrane explorer ----------
  B.interactives.membraneExplorer = function (spec, host) {
    // Release review 2026-11-15: temperature selector, "lateral movement" drift and the limitations paragraph removed
    // (they changed only a line of text or showed movement the paragraph itself called wrong). Labels on by default,
    // click-to-read components, and cholesterol none / normal / high with one sentence each.
    // the drawing takes the full card width (its labels are too small beside a control column)
    host.innerHTML = head(spec) + `<div class="ix-toprow"><div class="row wrap"><label class="small"><input type="checkbox" id="me-labels" checked> Show labels</label><label class="small">Cholesterol: <select id="me-chol"><option value="normal">normal</option><option value="none">none</option><option value="high">high</option></select></label></div>
      <div class="figure ix-full"><div class="fig-view" id="me-view"></div></div>
      <div id="me-fl"></div><div class="row wrap" id="me-parts" style="gap:.3rem"></div><div class="card" id="me-info"><p class="small muted">Click a component in the drawing (or a button) to read what it does.</p></div></div>`;
    const info = {
      bilayer: ["Phospholipid bilayer", "Two layers of phospholipids with hydrophilic phosphate heads facing the watery cytoplasm and extracellular fluid, and hydrophobic fatty-acid tails pointing inwards, away from water. The bilayer is fluid: phospholipids move sideways within their layer. It lets small, non-polar molecules through but limits the passage of ions and polar molecules."],
      channel: ["Channel protein (intrinsic)", "Spans the bilayer and forms a water-filled, hydrophilic pore through which specific ions or polar molecules pass down their concentration gradient (facilitated diffusion). Many channels are gated: they open or close in response to a signal."],
      carrier: ["Carrier protein (intrinsic)", "Spans the bilayer; a specific molecule binds, the protein changes shape and releases it on the other side. Used for facilitated diffusion (down a gradient, no ATP) and, in a different family of carriers, for active transport (against a gradient, with ATP)."],
      glycoprotein: ["Glycoprotein", "An intrinsic protein with a carbohydrate chain attached on the outer surface. Acts in cell recognition (antigens, 3.2.5), as a receptor for hormones and neurotransmitters, and helps cells bind to each other and to the extracellular matrix."],
      extrinsic: ["Extrinsic (peripheral) protein", "Sits on one surface of the bilayer or is embedded in one layer only, bound to lipid heads or to intrinsic proteins. Roles include structural support and enzyme activity on the membrane surface."],
      glycolipid: ["Glycolipid", "A lipid with a carbohydrate chain attached, on the outer face. Together with glycoproteins it forms the glycocalyx used in cell recognition, and it helps stabilise the membrane."],
      cholesterol: ["Cholesterol", "A small lipid wedged between phospholipid tails in animal cell membranes. It restricts the movement of other membrane molecules, making the membrane less fluid and more rigid at body temperature and reducing its permeability to small water-soluble molecules; at low temperatures it prevents the tails packing too closely, keeping the membrane fluid. (Specification: cholesterol may be present and restricts the movement of other membrane molecules.)"],
    };
    const draw = () => { $("#me-view", host).innerHTML = A().fluidMosaic({ labels: $("#me-labels", host).checked }); const svg = $("svg", $("#me-view", host)); const chol = $("#me-chol", host).value; const cg = $('[data-part="cholesterol"]', svg); if (chol === "none") cg.style.display = "none"; if (chol === "high") cg.innerHTML += [60, 200, 300, 380, 520, 640].map((x) => A().cholesterol(x, 156)).join(""); $$("[data-part]", svg).forEach((g) => { g.style.cursor = "pointer"; g.setAttribute("tabindex", "0"); g.addEventListener("click", () => show(g.dataset.part)); g.addEventListener("keydown", (e) => { if (e.key === "Enter") show(g.dataset.part); }); }); fluidity(); };
    const show = (k) => { const [t, d] = info[k]; $("#me-info", host).innerHTML = `<h4>${t}</h4><p class="small">${d}</p>`; $$("#me-parts button", host).forEach((b) => b.classList.toggle("primary", b.dataset.k === k)); };
    const fluidity = () => { const chol = $("#me-chol", host).value; $("#me-fl", host).innerHTML = `<p class="small" style="margin:0">${chol === "none" ? "<strong>No cholesterol:</strong> phospholipids move more freely, so the membrane is more fluid and more permeable to small polar molecules." : chol === "high" ? "<strong>More cholesterol:</strong> it restricts the movement of the phospholipids, so the membrane is stiffer and less permeable to small polar molecules." : "<strong>Normal cholesterol:</strong> cholesterol between the tails restricts the movement of other membrane molecules, keeping the membrane stable."}</p>`; };
    const short = { bilayer: "Bilayer", channel: "Channel protein", carrier: "Carrier protein", glycoprotein: "Glycoprotein", extrinsic: "Extrinsic protein", glycolipid: "Glycolipid", cholesterol: "Cholesterol" }; // short names keep the buttons on one row
    $("#me-parts", host).innerHTML = Object.keys(info).map((k) => `<button class="btn sm" data-k="${k}">${short[k] || info[k][0]}</button>`).join("");
    $$("#me-parts button", host).forEach((b) => b.addEventListener("click", () => show(b.dataset.k)));
    $$("#me-labels, #me-chol", host).forEach((i) => i.addEventListener("change", draw));
    draw();
  };

  // ---------- 2. Membrane permeability challenge ----------
  B.interactives.permeability = function (spec, host) {
    const subs = [
      { n: "Oxygen (O₂)", size: "small", polar: false, charged: false, route: "bilayer", why: "Small and non-polar: dissolves in the hydrophobic core and diffuses straight through the bilayer. No protein needed." },
      { n: "Carbon dioxide (CO₂)", size: "small", polar: false, charged: false, route: "bilayer", why: "Small and non-polar overall; crosses the bilayer by simple diffusion." },
      { n: "Water (H₂O)", size: "very small", polar: true, charged: false, route: "both", why: "Polar, but so small that some crosses the bilayer directly by osmosis; most cells also have aquaporin channels that let water cross much faster. Both routes are passive." },
      { n: "Glucose", size: "large", polar: true, charged: false, route: "carrier", why: "Large and polar: cannot pass the hydrophobic core. Enters by facilitated diffusion through a specific carrier protein (or by co-transport, 3.2.2)." },
      { n: "Sodium ion (Na⁺)", size: "small", polar: true, charged: true, route: ["channel", "carrier"], why: "Charged, so strongly repelled by the hydrophobic tails even though it is small. It needs a protein: a channel protein when it moves down its gradient, or a carrier protein (the sodium–potassium pump moves it against its gradient; the sodium–glucose co-transporter carries it down its gradient). Either answer is accepted." },
      { n: "Chloride ion (Cl⁻)", size: "small", polar: true, charged: true, route: "channel", why: "Charged: crosses only through specific channel proteins (the CFTR chloride channel is the protein faulty in cystic fibrosis)." },
      { n: "Ethanol", size: "small", polar: true, charged: false, route: "bilayer", why: "Small and only weakly polar; lipid-soluble enough to diffuse through the bilayer." },
      { n: "Steroid hormone (e.g. oestrogen)", size: "medium", polar: false, charged: false, route: "bilayer", why: "Lipid-soluble: passes through the bilayer directly, which is why steroid receptors are inside the cell." },
      { n: "Amino acid", size: "medium", polar: true, charged: true, route: "carrier", why: "Polar and usually charged: crosses by facilitated diffusion or active transport through specific carrier proteins." },
    ];
    host.innerHTML = head(spec) + `<div class="grid grid-2"><div><p class="small">Choose a substance, predict how it crosses the membrane, then check.</p><div class="row wrap" id="pm-list">${subs.map((s, i) => `<button class="btn sm" data-i="${i}">${s.n}</button>`).join("")}</div><div class="card mt" id="pm-q" hidden><h4 id="pm-name"></h4><p class="small" id="pm-props"></p><p class="small"><strong>How does it cross?</strong></p><div class="row wrap">${["bilayer", "channel", "carrier", "both"].map((r) => `<button class="btn sm pm-ans" data-r="${r}">${{ bilayer: "Through the bilayer (simple diffusion)", channel: "Needs a channel protein", carrier: "Needs a carrier protein", both: "Bilayer and channel" }[r]}</button>`).join("")}</div><div id="pm-fb" class="mt"></div></div></div><div class="card"><p class="tiny muted">Score: <span id="pm-score">0 / 0</span></p><details id="pm-rule" hidden><summary class="small"><strong>Rule of thumb</strong></summary><ul class="small"><li><strong>Small and non-polar</strong> (O₂, CO₂, lipid-soluble molecules): through the bilayer.</li><li><strong>Polar or charged</strong> (ions, glucose, amino acids): need a protein. Channels for ions and water; carriers for larger molecules.</li><li><strong>Water</strong> is the special case: small enough to cross the bilayer slowly, and much faster through aquaporin channels where they are present.</li><li>"Small" molecules do not all behave alike: a small <em>ion</em> is blocked by the hydrophobic core, a small <em>non-polar</em> molecule is not.</li></ul></details></div></div>`;
    // Release review 2026-11-15: each substance is scored once (its first answer); the rule of thumb appears only after
    // the first answer, so it cannot be used to read off the answers.
    let cur = null, right = 0, n = 0; const done = new Set();
    $$("#pm-list button", host).forEach((b) => b.addEventListener("click", () => { cur = subs[+b.dataset.i]; $("#pm-q", host).hidden = false; $("#pm-name", host).textContent = cur.n; $("#pm-props", host).textContent = `Size: ${cur.size}; polar: ${cur.polar ? "yes" : "no"}; charged: ${cur.charged ? "yes" : "no"}.`; $("#pm-fb", host).innerHTML = done.has(cur.n) ? `<p class="small muted">Already answered: choose another substance.</p>` : ""; $$(".pm-ans", host).forEach((x) => (x.disabled = done.has(cur.n))); $$("#pm-list button", host).forEach((x) => x.classList.toggle("primary", x === b)); }));
    $$(".pm-ans", host).forEach((b) => b.addEventListener("click", () => { if (!cur || done.has(cur.n)) return; done.add(cur.n); $$(".pm-ans", host).forEach((x) => (x.disabled = true)); $("#pm-rule", host).hidden = false; const ok = [].concat(cur.route).includes(b.dataset.r); n++; if (ok) right++; $("#pm-score", host).textContent = `${right} / ${n}`; $("#pm-fb", host).innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}"><strong>${ok ? "Correct." : "Not quite."}</strong> ${cur.why}</div>`; }));
  };

  // ---------- 3. Microvilli explorer ----------
  B.interactives.microvilliExplorer = function (spec, host) {
    // Release review 2026-11-15: the drawing (the same as the static figure above it) is gone; the explorer is now the
    // calculation only, with slider values shown, and its defaults are those of question a1 (3000 microvilli, 1 µm),
    // giving about 10 times the flat area.
    host.innerHTML = head(spec) + `<div class="card mt"><p class="small">Model the exposed face of an ileum epithelial cell as a square 10 µm × 10 µm (area 100 µm²). Each microvillus is a cylinder 0.1 µm wide (radius 0.05 µm).</p>
        <div class="row wrap"><label class="small">Length of each microvillus: <strong><span id="mv-lv">1.0</span> µm</strong><br><input type="range" id="mv-l" min="0.5" max="2" step="0.1" value="1" style="width:200px;accent-color:var(--teal)"></label><label class="small">Number of microvilli: <strong><span id="mv-nv">3000</span></strong><br><input type="range" id="mv-n" min="0" max="4000" step="100" value="3000" style="width:200px;accent-color:var(--teal)"></label></div>
        <div id="mv-out" class="small mt"></div></div>`;
    const draw = () => { const L = +$("#mv-l", host).value, N = +$("#mv-n", host).value; const r = 0.05; const side = 2 * Math.PI * r * L; const flat = 100; const total = flat + N * side; $("#mv-lv", host).textContent = L.toFixed(1); $("#mv-nv", host).textContent = N;
      $("#mv-out", host).innerHTML = N === 0 ? "With no microvilli the surface is just the flat 100 µm²." : `Side of one microvillus = 2πrL = 2 × 3.14 × 0.05 × ${L.toFixed(1)} = <strong>${side.toFixed(2)} µm²</strong>.<br>Total surface ≈ 100 + ${N} × ${side.toFixed(2)} = <strong>${total.toFixed(0)} µm²</strong>, about <strong>${Math.round(total / flat)} times</strong> the flat area (tips ignored, as in the exam question).`; };
    $$("input", host).forEach((i) => i.addEventListener("input", draw)); draw();
  };

  // ---------- 4. Diffusion simulator (canvas particle model) ----------
  // Model (release review 2026-11-15, rewritten so that equilibrium is reached in seconds, not minutes):
  //  - Two compartments of a 560 x 300 box. Each particle moves in a straight line at a constant speed (SPEED px per
  //    step) in a random direction, turning by a small random angle each step and reflecting off the walls (kinetic
  //    motion, so a particle crosses its compartment in a couple of seconds).
  //  - The membrane is a vertical band of thickness d (thin 8, medium 14, thick 24 px) with evenly spaced pores; the
  //    open fraction of its height is the "surface area" setting (0.35, 0.65 or 1). A particle reaching the band outside a
  //    pore bounces off. Inside a pore it does a one-dimensional random walk across the band (steps of +/-4 px), so the
  //    chance of getting through rather than coming back out is about 4/d (gambler's ruin) and the time inside grows with
  //    d^2: the net rate is therefore proportional to area x concentration difference / thickness, as in Fick's law.
  //  - A crossing is counted only when a particle leaves the band on the far side from where it entered. Each particle
  //    belongs to the side it last entered, so the left and right counts change only by real crossings.
  //  - Particles are coloured by the side they started on, so students can see crossings in both directions.
  //  - Reduced motion: the model starts paused and the Step button advances it one second at a time; the speed of the
  //    model is never changed.
  B.interactives.diffusionSim = function (spec, host) {
    const W = 560, H = 300, SPEED = 4, STEP = 4, NP = 6;
    const AREA = { small: 0.35, medium: 0.65, large: 1 }, THICK = { thin: 8, medium: 14, thick: 24 };
    const stage = `<canvas id="df-c" width="${W}" height="${H}" style="width:100%;max-width:${W}px;display:block;background:#fff;border-radius:10px;border:1px solid #d5e0dd" role="img" aria-label="two compartments separated by a membrane with pores; particles move randomly and cross through the pores"></canvas>`;
    const panel = `<fieldset><legend>Starting number of particles</legend>
        <label for="df-l">Left: <strong id="df-lv">120</strong></label><input type="range" id="df-l" min="0" max="150" step="5" value="120">
        <label for="df-r">Right: <strong id="df-rv">20</strong></label><input type="range" id="df-r" min="0" max="150" step="5" value="20"></fieldset>
      <fieldset><legend>Membrane</legend>
        <label>Surface area <select id="df-a"><option value="small">small</option><option value="medium" selected>medium</option><option value="large">large</option></select></label>
        <label>Thickness <select id="df-d"><option value="thin" selected>thin</option><option value="medium">medium</option><option value="thick">thick</option></select></label></fieldset>
      <div class="row wrap"><button class="btn primary sm" id="df-play" type="button">Pause</button><button class="btn sm" id="df-step" type="button">Step 1 s</button><button class="btn sm" id="df-reset" type="button">Start again</button></div>
      <p class="tiny muted" style="margin:0"><span style="color:#1e3a5f">●</span> started on the left &nbsp; <span style="color:#c8902a">●</span> started on the right</p>
      <div class="ix-readout" id="df-out" aria-live="polite"></div>`;
    host.innerHTML = head(spec, "simulation") + B.ix.split(stage + `<div id="df-chart" class="mt"></div><p class="tiny muted" style="margin:.1rem 0 0;text-align:center"><span style="color:#1f8a8a;font-weight:700">solid line: left</span> &nbsp; <span style="color:#c8902a;font-weight:700">dashed line: right</span></p>`, panel, { label: "Diffusion simulator controls" }) +
      `<p class="tiny muted mt">This is a simplified model: real particles are far smaller and more numerous, and there is no solvent. Changing a setting starts the run again.</p>`;
    const cv = $("#df-c", host), ctx = cv.getContext("2d");
    let parts = [], playing = !reduced(), t = 0, hist = [], recent = [], settled = false;
    const sel = (id) => $("#" + id, host).value, num = (id) => +$("#" + id, host).value;
    const geom = () => { const d = THICK[sel("df-d")], a = AREA[sel("df-a")]; const x0 = W / 2 - d / 2, x1 = W / 2 + d / 2; const slot = H / NP, ph = slot * a; const pores = Array.from({ length: NP }, (_, i) => [i * slot + (slot - ph) / 2, i * slot + (slot + ph) / 2]); return { d, a, x0, x1, pores }; };
    const inPore = (g, y) => g.pores.some(([a, b]) => y > a + 1 && y < b - 1) || g.a >= 1;
    const make = (side, home) => { const th = Math.random() * Math.PI * 2; const g = geom(); const xl = side === "L" ? [6, g.x0 - 6] : [g.x1 + 6, W - 6]; return { x: xl[0] + Math.random() * (xl[1] - xl[0]), y: 6 + Math.random() * (H - 12), vx: SPEED * Math.cos(th), vy: SPEED * Math.sin(th), side, home, band: null }; };
    const setup = () => { parts = []; for (let i = 0; i < num("df-l"); i++) parts.push(make("L", "L")); for (let i = 0; i < num("df-r"); i++) parts.push(make("R", "R")); t = 0; hist = [{ x: 0, l: num("df-l"), r: num("df-r") }]; recent = []; settled = false; draw(); readout(); chart(); };
    const move = () => { const g = geom();
      for (const q of parts) {
        if (q.band) { // random walk across the pore
          q.x += Math.random() < 0.5 ? STEP : -STEP;
          if (q.x < g.x0 || q.x > g.x1) { const out = q.x < g.x0 ? "L" : "R"; if (out !== q.band) { recent.push({ t, dir: out === "R" ? "LR" : "RL" }); q.side = out; } q.x = out === "L" ? g.x0 - 1 : g.x1 + 1; const th = (Math.random() - 0.5) * Math.PI * 0.8; q.vx = (out === "L" ? -1 : 1) * SPEED * Math.cos(th); q.vy = SPEED * Math.sin(th); q.band = null; }
          continue; }
        const th = (Math.random() - 0.5) * 0.5, c = Math.cos(th), s = Math.sin(th); const vx = q.vx * c - q.vy * s, vy = q.vx * s + q.vy * c; q.vx = vx; q.vy = vy;
        let nx = q.x + q.vx, ny = q.y + q.vy;
        if (ny < 4 || ny > H - 4) { q.vy = -q.vy; ny = Math.max(4, Math.min(H - 4, ny)); }
        if (nx < 4 || nx > W - 4) { q.vx = -q.vx; nx = Math.max(4, Math.min(W - 4, nx)); }
        const hitL = q.x <= g.x0 && nx > g.x0, hitR = q.x >= g.x1 && nx < g.x1;
        if (hitL || hitR) { if (inPore(g, ny)) { q.band = hitL ? "L" : "R"; q.x = hitL ? g.x0 + STEP / 2 : g.x1 - STEP / 2; q.y = ny; continue; } q.vx = -q.vx; nx = hitL ? g.x0 - 1 : g.x1 + 1; }
        q.x = nx; q.y = ny; }
      t++; if (t % 30 === 0) { const nl = parts.filter((q) => q.side === "L").length; hist.push({ x: t / 60, l: nl, r: parts.length - nl }); }
      recent = recent.filter((r) => r.t > t - 300); };
    const draw = () => { const g = geom(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#eaf4f1"; ctx.fillRect(g.x0, 0, g.d, H);
      if (g.a < 1) { ctx.fillStyle = "#1f8a8a"; let y = 0; for (const [a, b] of g.pores) { ctx.fillRect(g.x0, y, g.d, a - y); y = b; } ctx.fillRect(g.x0, y, g.d, H - y); }
      else { ctx.strokeStyle = "#1f8a8a"; ctx.setLineDash([4, 4]); ctx.strokeRect(g.x0, 0, g.d, H); ctx.setLineDash([]); }
      for (const q of parts) { ctx.fillStyle = q.home === "L" ? "#1e3a5f" : "#c8902a"; ctx.beginPath(); ctx.arc(q.x, q.y, 3.4, 0, 7); ctx.fill(); } };
    const readout = () => { const nl = parts.filter((q) => q.side === "L").length, nr = parts.length - nl, N = parts.length || 1; const lr = recent.filter((r) => r.dir === "LR").length, rl = recent.length - lr;
      const bar = (lab, n, col) => `<div style="display:flex;align-items:center;gap:.5rem;margin:.15rem 0"><span style="width:3.2rem">${lab}</span><span style="flex:1;background:#e7eeec;border-radius:4px;height:12px;overflow:hidden"><span style="display:block;height:100%;width:${(100 * n) / N}%;background:${col}"></span></span><strong style="width:2.2rem;text-align:right">${n}</strong></div>`;
      const last = hist.slice(-4), mL = last.reduce((x, p) => x + p.l, 0) / last.length, mR = last.reduce((x, p) => x + p.r, 0) / last.length; if (hist.length > 3 && Math.abs(mL - mR) <= Math.max(4, 0.1 * N)) settled = true; const eq = settled; // judged on the last 2 s, then held, so random wobbles do not flip the message
      const msg = !parts.length ? "Add some particles to start." : eq ? "About equal on both sides: particles still cross both ways at about the same rate, so there is no net movement (dynamic equilibrium). The numbers wobble a little because the motion is random." : `Net movement from ${nl > nr ? "left to right" : "right to left"}: down the concentration gradient.`;
      $("#df-out", host).innerHTML = bar("Left", nl, "#1f8a8a") + bar("Right", nr, "#c8902a") + `<p class="small" style="margin:.35rem 0 0">${msg}</p><p class="tiny muted" style="margin:.2rem 0 0">In the last 5 seconds: ${lr} crossed left to right, ${rl} crossed right to left.</p>`; };
    const chart = () => { const last = hist[hist.length - 1].x; $("#df-chart", host).innerHTML = B.enzymeArt.graph({ xLabel: "time / s", yLabel: "number of particles", xmax: Math.max(30, Math.ceil(last / 30) * 30), ymax: Math.max(30, Math.ceil(parts.length / 30) * 30), xticks: 6, yticks: 3, fs: 12, width: 560, height: 200, curves: [{ pts: hist.map((p) => ({ x: p.x, y: p.l })), color: "#1f8a8a" }, { pts: hist.map((p) => ({ x: p.x, y: p.r })), color: "#c8902a", dash: "6 4" }], aria: "number of particles on each side against time" }); };
    const tick = () => { move(); draw(); if (t % 10 === 0) readout(); if (t % 30 === 0) chart(); };
    const setPlay = (on) => { playing = on; $("#df-play", host).textContent = on ? "Pause" : "Play"; };
    $$("#df-l, #df-r", host).forEach((i) => i.addEventListener("input", () => { $("#df-lv", host).textContent = num("df-l"); $("#df-rv", host).textContent = num("df-r"); setup(); }));
    $$("#df-a, #df-d", host).forEach((i) => i.addEventListener("change", setup));
    $("#df-reset", host).addEventListener("click", setup);
    $("#df-play", host).addEventListener("click", () => setPlay(!playing));
    $("#df-step", host).addEventListener("click", () => { setPlay(false); for (let i = 0; i < 60; i++) move(); draw(); readout(); chart(); });
    setPlay(playing); setup();
    loop(host, () => { if (playing) tick(); });
  };

  // ---------- 5. Facilitated diffusion explorer ----------
  B.interactives.facilitatedExplorer = function (spec, host) {
    const { TEAL, SAGE, ROSE, NAVY, AMBER } = C();
    host.innerHTML = head(spec) + `<div class="tabs" role="tablist" id="fd-tabs"><button role="tab" aria-selected="true" data-k="simple">Simple diffusion</button><button role="tab" aria-selected="false" data-k="channel">Channel protein</button><button role="tab" aria-selected="false" data-k="carrier">Carrier protein</button><button role="tab" aria-selected="false" data-k="active">Active transport</button></div>
      <div class="explorer"><div class="exp-view" id="fd-view"></div><div class="exp-info" id="fd-info"></div></div>
`;
    const info = {
      simple: ["Simple diffusion", "Small, non-polar molecules such as oxygen and carbon dioxide dissolve in the hydrophobic core and diffuse through the bilayer down their concentration gradient. Passive: the energy comes from the random motion of the molecules. Rate is proportional to the concentration difference and the surface area, and inversely proportional to the distance.", `<rect x="0" y="0" width="300" height="200" fill="#fff"/>${A().bilayer(0, 300, 100)}${[30, 70, 110, 150, 200, 250].map((x) => `<circle cx="${x}" cy="${40 + (x % 3) * 8}" r="4" fill="${ROSE}"/>`).join("")}<circle cx="90" cy="100" r="4" fill="${ROSE}"/><circle cx="210" cy="165" r="4" fill="${ROSE}"/><line x1="150" y1="60" x2="150" y2="150" stroke="${ROSE}" stroke-width="2" marker-end="url(#fda)"/>`],
      channel: ["Channel protein: facilitated diffusion", "A channel protein spans the bilayer and forms a hydrophilic pore lined with polar R groups. Ions and polar molecules of the right size and charge pass through down their gradient without touching the hydrophobic tails. Many channels are gated. Passive: no ATP. Water-specific channels are called aquaporins.", `<rect x="0" y="0" width="300" height="200" fill="#fff"/>${A().bilayer(0, 300, 100, [9, 10, 11])}${A().proteinBlob(150, 100, 44, 96, "#d6efec")}<rect x="143" y="56" width="14" height="88" rx="7" fill="#fff" stroke="${TEAL}"/>${[40, 80, 220, 260, 60].map((x) => `<circle cx="${x}" cy="${35 + (x % 4) * 6}" r="4" fill="${NAVY}"/>`).join("")}<circle cx="150" cy="70" r="4" fill="${NAVY}"/><circle cx="150" cy="110" r="4" fill="${NAVY}"/><circle cx="150" cy="165" r="4" fill="${NAVY}"/><line x1="150" y1="30" x2="150" y2="62" stroke="${NAVY}" stroke-width="2" marker-end="url(#fda)"/>`],
      carrier: ["Carrier protein: facilitated diffusion", "A specific molecule (e.g. glucose) binds to a site on the carrier; the protein changes shape (conformational change) and releases the molecule on the other side. Movement is down the concentration gradient and needs no ATP: the shape change is driven by binding, and the carrier works in either direction. Because each carrier handles one molecule at a time, the rate saturates when every carrier is busy.", `<rect x="0" y="0" width="300" height="200" fill="#fff"/>${A().bilayer(0, 300, 100, [9, 10, 11])}${A().proteinBlob(150, 100, 48, 96, "#fbf0d8")}<path d="M138 56 q 14 24 0 46" fill="none" stroke="${AMBER}" stroke-width="2"/>${[40, 80, 220, 260, 70].map((x) => `<rect x="${x - 7}" y="${32 + (x % 3) * 6}" width="14" height="10" rx="3" fill="${SAGE}"/>`).join("")}<rect x="143" y="76" width="14" height="10" rx="3" fill="${SAGE}"/><rect x="200" y="165" width="14" height="10" rx="3" fill="${SAGE}"/><text x="150" y="190" text-anchor="middle" font-size="10" fill="#6b7d8f">binds → shape change → release</text>`],
      active: ["Active transport (for comparison)", "A carrier protein moves a substance against its concentration gradient. ATP binds to the carrier and is hydrolysed to ADP + Pi; the phosphate group (or the energy released) drives the conformational change that moves the molecule to the side where it is already more concentrated. Specific, saturable, and stopped by respiratory inhibitors such as cyanide because ATP runs out. Different pumps differ in detail (e.g. the sodium–potassium pump moves 3 Na⁺ out and 2 K⁺ in per ATP).", `<rect x="0" y="0" width="300" height="200" fill="#fff"/>${A().bilayer(0, 300, 100, [9, 10, 11])}${A().proteinBlob(150, 100, 48, 96, "#f3d6d5")}<path d="M138 144 q 14 -24 0 -46" fill="none" stroke="${ROSE}" stroke-width="2"/>${[30, 60, 90, 120, 180, 210, 240, 270].map((x) => `<rect x="${x - 7}" y="${28 + (x % 4) * 6}" width="14" height="10" rx="3" fill="${NAVY}"/>`).join("")}<rect x="143" y="112" width="14" height="10" rx="3" fill="${NAVY}"/><rect x="80" y="165" width="14" height="10" rx="3" fill="${NAVY}"/><circle cx="205" cy="150" r="13" fill="#fbf0d8" stroke="${AMBER}" stroke-width="1.5"/><text x="205" y="154" text-anchor="middle" font-size="9" font-weight="700" fill="${AMBER}">ATP</text><line x1="150" y1="170" x2="150" y2="124" stroke="${NAVY}" stroke-width="2" marker-end="url(#fda)"/><text x="150" y="190" text-anchor="middle" font-size="10" fill="#6b7d8f">low → high, ATP hydrolysed</text>`],
    };
    const show = (k) => { $$("#fd-tabs button", host).forEach((b) => b.setAttribute("aria-selected", b.dataset.k === k)); $("#fd-view", host).innerHTML = `<svg viewBox="0 0 300 200" width="300" role="img" aria-label="${info[k][0]}"><defs><marker id="fda" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#16263a"/></marker></defs>${info[k][2]}</svg>`; $("#fd-info", host).innerHTML = `<h4>${info[k][0]}</h4><p class="small">${info[k][1]}</p>`; };
    $$("#fd-tabs button", host).forEach((b) => b.addEventListener("click", () => show(b.dataset.k)));
    show("simple"); // saturation bars removed (release review 2026-11-15): the graph in the notes shows saturation
  };

  // ---------- 6. Osmosis and water potential (split screen) ----------
  B.interactives.osmosisSim = function (spec, host) {
    // Release review 2026-11-15: results in plain words (no Ψ = −iCRT, pressure potential or kPa values, which are beyond
    // the specification); the plant cell's wall, membrane and vacuole are labelled. Internally the solution's water
    // potential still comes from B.transportModel.psiSolute and the model cells (plant −1000 kPa, red cell −800 kPa).
    host.innerHTML = head(spec) + `
      <div class="row"><label class="small">Sucrose concentration outside the cells: <strong><span id="os-cv">0.00</span> mol dm⁻³</strong><input type="range" id="os-c" min="0" max="1" step="0.02" value="0" style="width:260px;accent-color:var(--teal)"></label></div>
      <div class="grid grid-2 mt"><div class="card"><h4>Plant cell</h4><div id="os-p"></div><p class="small" id="os-pt"></p></div><div class="card"><h4>Red blood cell</h4><div id="os-a"></div><p class="small" id="os-at"></p></div></div>
      <div class="card mt"><div class="row wrap"><span class="small"><strong>Predict:</strong> a flaccid plant cell is placed in this solution. Net water movement is</span><button class="btn sm os-pred" data-v="in">into the cell</button><button class="btn sm os-pred" data-v="none">no net movement</button><button class="btn sm os-pred" data-v="out">out of the cell</button></div><p id="os-fb" class="small" style="margin:.3rem 0 0"></p></div>
      <p class="tiny muted mt">This is a simplified model: real cells differ, so the concentration at which plasmolysis or bursting begins is not the same for every cell.</p>`;
    // Round 2 (V1-N1): the comparison sentence is taken from the state that is drawn, so text and picture always agree.
    const plantCmp = { turgid: "higher", "partly turgid (low turgor)": "higher", flaccid: "equal", "incipient plasmolysis": "equal", plasmolysed: "lower" };
    const animalCmp = { lysed: "higher", swollen: "higher", normal: "equal", shrunken: "lower" };
    const plantText = { turgid: "Turgid. Water entered by osmosis; the wall stops the cell swelling further.", "partly turgid (low turgor)": "Slightly turgid. A little water entered; the protoplast presses gently on the wall.", flaccid: "Flaccid. No net water movement; the protoplast just touches the wall.", "incipient plasmolysis": "Flaccid, just beginning to plasmolyse. Almost no net water movement.", plasmolysed: "Plasmolysed. Water left by osmosis; the protoplast has shrunk away from the wall and the solution fills the gap." };
    const animalText = { lysed: "Burst (lysed). Water entered by osmosis and there is no wall to stop the cell swelling.", swollen: "Swollen. Water entered by osmosis.", normal: "Normal shape. No net water movement.", shrunken: "Shrunken and crinkled (crenated). Water left by osmosis." };
    const why = (c) => c === "higher" ? "the solution has a higher water potential than the cell" : c === "lower" ? "the solution has a lower water potential than the cell" : "the solution and the cell have about the same water potential";
    const draw = () => { const c = +$("#os-c", host).value; const psi = M().psiSolute(c); $("#os-cv", host).textContent = c.toFixed(2); const cp = A().cellPair({ psiExt: psi, nucleus: false });
      $("#os-p", host).innerHTML = `<svg viewBox="-80 -60 255 120" width="330" role="img" aria-label="plant cell in the solution">${cp.plant(0, true)}</svg>`; $("#os-a", host).innerHTML = `<svg viewBox="-80 -60 160 120" width="210" role="img" aria-label="red blood cell in the solution">${cp.animal(0)}</svg>`;
      $("#os-pt", host).innerHTML = `<strong>${plantText[cp.p.state]}</strong> Here ${why(plantCmp[cp.p.state])}.`; $("#os-at", host).innerHTML = `<strong>${animalText[cp.a.state]}</strong> Here ${why(animalCmp[cp.a.state])}.`; $("#os-fb", host).textContent = ""; };
    $("#os-c", host).addEventListener("input", draw); draw();
    $$(".os-pred", host).forEach((b) => b.addEventListener("click", () => { const psi = M().psiSolute(+$("#os-c", host).value); const k = plantCmp[A().cellPair({ psiExt: psi, nucleus: false }).p.state]; const truth = k === "higher" ? "in" : k === "lower" ? "out" : "none"; const ok = b.dataset.v === truth;
      $("#os-fb", host).innerHTML = ok ? `<span style="color:var(--sage-ink)">✓ Correct: ${why(k)}, so ${truth === "in" ? "water moves in, from higher to lower water potential, until the wall stops further swelling" : truth === "out" ? "water moves out, from higher to lower water potential, and the protoplast shrinks" : "water crosses both ways at the same rate"}.</span>` : `<span style="color:var(--rose-ink)">✗ Not quite. Compare the water potentials: ${why(k)}. Water moves from higher to lower water potential.</span>`; }));
  };

  // ---------- 7. Active transport pump ----------
  B.interactives.pumpSim = function (spec, host) {
    // Release review 2026-11-15: the carrier is drawn as in the carrier-cycle diagram (a protein open to the outside, then,
    // after ATP is hydrolysed and phosphate attaches, open to the inside), so the shape change is easy to see; the
    // monospace readout is gone and the wording is "against its concentration gradient".
    const { NAVY, ROSE, AMBER, SAGE, GREY } = C();
    host.innerHTML = head(spec) + B.ix.split(`<div class="figure"><div class="fig-view"><svg id="pp-svg" viewBox="0 0 320 230" width="340" role="img" aria-label="carrier protein pumping a molecule from outside to inside"></svg></div></div>`, `
      <label class="small">Molecules outside: <strong><span id="pp-ov">2</span></strong><input type="range" id="pp-o" min="0" max="10" value="2"></label><label class="small">Molecules inside: <strong><span id="pp-iv">8</span></strong><input type="range" id="pp-i" min="0" max="10" value="8"></label>
      <div class="row wrap"><label class="small"><input type="checkbox" id="pp-atp" checked> ATP available</label><button class="btn primary sm" id="pp-run" type="button">Start a cycle</button></div>
      <div class="card" id="pp-info"></div>`, { label: "Active transport pump controls" });
    const svg = $("#pp-svg", host); let busy = false;
    const draw = (phase = 0, molY = null) => { const o = +$("#pp-o", host).value, i = +$("#pp-i", host).value; $("#pp-ov", host).textContent = o; $("#pp-iv", host).textContent = i;
      const dots = (n, y0) => Array.from({ length: n }, (_, k) => `<circle cx="${26 + (k % 5) * 22 + (k > 4 ? 11 : 0)}" cy="${y0 + Math.floor(k / 5) * 18}" r="6" fill="${AMBER}" stroke="#9a6f1e"/>`).join("");
      const y = 115, open = phase < 2; // open to the outside (top) before the shape change, to the inside after it
      const poly = open ? `M128 ${y - 48} L152 ${y + 48} L168 ${y + 48} L192 ${y - 48}z` : `M152 ${y - 48} L128 ${y + 48} L192 ${y + 48} L168 ${y - 48}z`;
      svg.innerHTML = `<text x="300" y="20" text-anchor="end" font-size="13" fill="${GREY}">outside: low concentration</text><text x="300" y="224" text-anchor="end" font-size="13" fill="${GREY}">inside: high concentration</text>${A().bilayer(0, 320, y, [9, 10, 11, 12])}<path d="M126 ${y - 50} h68 v100 h-68z" fill="#fff"/><path d="${poly}" fill="#e4ebf5" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>${dots(o, 34)}${dots(i, 180)}${molY !== null ? `<circle cx="160" cy="${molY}" r="7" fill="${AMBER}" stroke="#9a6f1e" stroke-width="1.5"/>` : ""}${phase === 1 ? `<circle cx="196" cy="${y + 66}" r="15" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.5"/><text x="196" y="${y + 70}" text-anchor="middle" font-size="12" font-weight="700" fill="#9a6f1e">ATP</text>` : phase === 2 ? `<circle cx="186" cy="${y + 62}" r="12" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.5"/><text x="186" y="${y + 66}" text-anchor="middle" font-size="12" font-weight="700" fill="#9a6f1e">Pi</text><text x="252" y="${y + 70}" text-anchor="middle" font-size="12" fill="${GREY}">ADP leaves</text>` : ""}`; };
    const say = (t) => { $("#pp-info", host).innerHTML = `<p class="small" style="margin:0">${t}</p>`; };
    $$("#pp-o, #pp-i", host).forEach((x) => x.addEventListener("input", () => draw()));
    const wait = () => (reduced() ? 50 : 1000);
    // Round 2 (V1-N9): one stage per click ("Next stage"); the outside count falls when the molecule enters the carrier and
    // the inside count rises when it is released, so the counts always match the molecules drawn.
    let stage = 0, noAtp = false;
    $$("#pp-o, #pp-i, #pp-atp", host).forEach((x) => x.addEventListener("change", () => { if (!stage) return; const oEl = $("#pp-o", host), iEl = $("#pp-i", host); if (stage === 3) iEl.value = Math.min(10, +iEl.value + 1); else oEl.value = Math.min(10, +oEl.value + 1); /* the molecule in the carrier goes back out (or, once released, stays inside) */ stage = 0; draw(); $("#pp-run", host).textContent = "Start a cycle"; say("Settings changed: start a new cycle."); }));
    $("#pp-run", host).addEventListener("click", () => { const o = +$("#pp-o", host).value, i = +$("#pp-i", host).value, atp = $("#pp-atp", host).checked;
      if (stage === 0) { if (o === 0) { say("There is nothing outside to bind: the carrier waits."); return; } $("#pp-o", host).value = o - 1; draw(0, 76); say("<strong>Stage 1 of 4.</strong> A molecule from outside binds to the specific binding site of the carrier protein."); stage = 1; noAtp = false; }
      else if (stage === 1 && !atp) { draw(0, 76); say(`<strong>No ATP.</strong> The carrier cannot change shape, so the molecule is not moved into the cell. ${i > o + 1 ? "Moving it inside would be against its concentration gradient, which needs energy from ATP." : "This carrier is a pump: without ATP it does not move molecules, even down a gradient."} Press Next stage to let it go.`); stage = 9; }
      else if (stage === 9) { $("#pp-o", host).value = o + 1; draw(); say("The molecule leaves the binding site and stays outside the cell."); stage = 0; }
      else if (stage === 1) { draw(1, 76); say("<strong>Stage 2 of 4.</strong> ATP is hydrolysed to ADP and Pi; the phosphate attaches to the carrier."); stage = 2; }
      else if (stage === 2) { draw(2, 152); say("<strong>Stage 3 of 4.</strong> The carrier changes shape and now opens to the inside. The molecule is released into the cytoplasm" + (i >= o ? ", where its concentration is already higher." : ".")); stage = 3; }
      else { $("#pp-i", host).value = Math.min(10, i + 1); draw(0, null); say(`<strong>Stage 4 of 4.</strong> The phosphate is released and the carrier returns to its original shape, ready for the next molecule. ${i + 1 > o ? "The molecule moved against its concentration gradient, which is why energy from ATP was needed." : "Energy from ATP was used to move it."}`); stage = 0; }
      $("#pp-run", host).textContent = stage === 0 ? "Start a cycle" : "Next stage"; });
    draw(); say("Set the numbers of molecules, decide whether ATP is available, then step through a cycle. Try pumping a molecule from a low concentration outside to a high concentration inside, with and without ATP.");
  };

})(window.BIO);
