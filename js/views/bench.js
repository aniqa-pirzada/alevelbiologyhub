// Animated virtual bench for RP1 (effect of temperature / pH / concentration on catalase, oxygen collected in a
// gas syringe). Students drag apparatus from the shelf onto the bench, pour reagents, set the water bath, then
// run the reaction and watch bubbles, the syringe plunger and a live graph. Every item can also be placed by
// clicking it (keyboard: Enter) so the bench works without a pointer. The kinetic model is B.labModels.catalase
// and is documented there; results feed the same table/plot as before.
window.BIO = window.BIO || {}; window.BIO.labModels = window.BIO.labModels || {};
(function (B) {
  const { h, raw, el, $, $$, esc } = B.util;

  // ---- Kinetic model (reviewed 2026-11-01; documented in the practical's simNote and KNOWN_LIMITATIONS.md) ----
  // Reaction: 2 H2O2 -> 2 H2O + O2, catalysed by catalase. The virtual flask holds VOL_SUB cm3 of hydrogen peroxide
  // at S % (w/v). Oxygen yield if all substrate is used: YIELD = (S/100 * VOL_SUB g / 34 g mol-1) / 2 * 24.5 dm3 mol-1
  // = 18.0 cm3 per 1 % at 25 degC for 5 cm3 of substrate (temperature effect on gas volume is ignored).
  // Initial rate v0 (cm3 O2 min-1) = BASE * E * 2^((T-20)/10) * denat(T) * pHf * S/(Km+S)
  //   BASE = 18 cm3 min-1 (2 % substrate, enzyme x1, 20 degC reference), Q10 = 2 below the optimum,
  //   denat(T) = 1/(1+exp((T-52)/3.5)) (instantaneous loss of activity above ~50 degC; real denaturation is time-dependent),
  //   pHf = exp(-((pH-7)^2)/(2*1.2^2)) (bell curve around pH 7; catalase's real optimum is about 7), Km = 1.2 % (model value).
  // During the run the substrate is depleted: dS/dt = -(v0/Vm_at_S) * Vmax * S/(Km+S), integrated at 1 s steps, so the
  // volume-time curve flattens as substrate runs out and the TOTAL volume never exceeds YIELD*S. Readings carry a per-run
  // calibration error (+-3 %) and are rounded to the 0.5 cm3 resolution of the syringe, so they never decrease with time.
  // The gas syringe holds SYRINGE_MAX = 100 cm3: once full, readings stop rising and the run is flagged "syringe full".
  const VOL_SUB = 5, YIELD = 18.0, SYRINGE_MAX = 100, Km = 1.2;
  B.labModels.params = { VOL_SUB, YIELD, SYRINGE_MAX, Km };
  B.labModels.catalase = (T, pH, S, E) => { const base = 18; const kinetic = Math.pow(2, (T - 20) / 10); const denat = 1 / (1 + Math.exp((T - 52) / 3.5)); const phf = Math.exp(-Math.pow(pH - 7, 2) / (2 * 1.2 * 1.2)); return base * E * kinetic * denat * phf * (S / (Km + S)); };
  // Full 3-minute run. Returns 30 s readings (series), a per-second trace (fine, cm3) used by the animation so that
  // table, graph, bubbles and plunger all come from the same numbers, the "initial rate" students would calculate
  // (volume at 30 s x 2), the true model v0, the time the syringe filled (or null) and the maximum possible yield.
  B.labModels.catalaseRun = (T, pH, S, E, noise = true) => {
    const v0 = B.labModels.catalase(T, pH, S, E); const Vmax = v0 * (Km + S) / S; // cm3 min-1 at saturating substrate
    const calib = noise ? 1 + (Math.random() - 0.5) * 0.06 : 1;
    let S_rem = S, vol = 0, full = null; const fine = [0];
    for (let t = 1; t <= 180; t++) {
      const rate = Vmax * S_rem / (Km + S_rem); // cm3 O2 per minute at the current substrate concentration
      const dV = rate / 60; const dS = dV / YIELD; S_rem = Math.max(0, S_rem - dS); vol = Math.min(YIELD * S, vol + dV);
      const read = Math.min(SYRINGE_MAX, vol * calib); if (read >= SYRINGE_MAX && full === null) full = t; fine.push(read);
    }
    const series = []; for (let t = 0; t <= 180; t += 30) series.push({ x: t, y: Math.round(fine[t] * 2) / 2 });
    return { series, fine, init: +(series[1].y * 2).toFixed(1), v0: +v0.toFixed(2), full, yieldMax: +(YIELD * S).toFixed(1) };
  };

  const ITEMS = [
    { id: "bath", name: "Water bath", zone: "zbath", kind: "apparatus" },
    { id: "flask", name: "Conical flask", zone: "zflask", kind: "apparatus", needs: ["bath"] },
    { id: "thermo", name: "Thermometer", zone: "zthermo", kind: "apparatus", needs: ["bath"] },
    { id: "syringe", name: "Gas syringe", zone: "zsyringe", kind: "apparatus" },
    { id: "bung", name: "Bung + delivery tube", zone: "zbung", kind: "apparatus", needs: ["flask", "syringe"] },
    { id: "h2o2", name: "Hydrogen peroxide", zone: "zflask", kind: "reagent", needs: ["flask"] },
    { id: "catalase", name: "Catalase (potato discs)", zone: "zflask", kind: "reagent", needs: ["flask", "h2o2"] },
  ];

  function icon(id) {
    switch (id) {
      case "bath": return `<rect x="4" y="18" width="52" height="34" rx="4" fill="#dbe9f3" stroke="#5a7d96" stroke-width="2"/><rect x="8" y="24" width="44" height="26" fill="#bfe0f5"/><rect x="18" y="8" width="24" height="8" rx="2" fill="#8aa9bd"/>`;
      case "flask": return `<path d="M24 6h12v16l14 26a4 4 0 0 1-3.5 6h-33A4 4 0 0 1 10 48l14-26z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><path d="M15.5 46l9-16h11l9 16z" fill="#cfe6ff" opacity=".7"/>`;
      case "thermo": return `<rect x="26" y="4" width="8" height="40" rx="4" fill="#fff" stroke="#476a85" stroke-width="2"/><circle cx="30" cy="50" r="7" fill="#d9534f" stroke="#476a85" stroke-width="2"/><rect x="28" y="30" width="4" height="14" fill="#d9534f"/>`;
      case "syringe": return `<rect x="4" y="22" width="44" height="16" rx="3" fill="#fff" stroke="#476a85" stroke-width="2"/><rect x="30" y="26" width="24" height="8" fill="#476a85"/><rect x="50" y="18" width="4" height="24" rx="1" fill="#476a85"/><path d="M4 30h-2" stroke="#476a85" stroke-width="2"/>`;
      case "bung": return `<path d="M20 10h20l3 18H17z" fill="#8c6f4e" stroke="#5a4631" stroke-width="2"/><path d="M30 10V4c0-2 2-2 4-2h14" fill="none" stroke="#476a85" stroke-width="2.5"/>`;
      case "h2o2": return `<rect x="22" y="4" width="16" height="8" fill="#9aa" /><path d="M18 12h24v34a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z" fill="#f7fbff" stroke="#476a85" stroke-width="2"/><rect x="21" y="24" width="18" height="22" fill="#cfe6ff"/><text x="30" y="37" font-size="8" text-anchor="middle" font-family="monospace" fill="#1d3a52">H₂O₂</text>`;
      case "catalase": return `<path d="M14 14h32v30a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#fff" stroke="#476a85" stroke-width="2"/><circle cx="24" cy="36" r="5" fill="#e9d49a" stroke="#b89a4c"/><circle cx="35" cy="34" r="5" fill="#e9d49a" stroke="#b89a4c"/><circle cx="30" cy="26" r="5" fill="#e9d49a" stroke="#b89a4c"/>`;
    }
    return "";
  }

  B.views.bench = function (host, n, onRun) {
    host.innerHTML = `
      <div class="bench-wrap">
        <div class="bench-steps" id="bsteps"></div>
        <div class="bench-shelf" id="shelf" aria-label="Apparatus and reagents shelf" data-empty="Everything is on the bench. Set the conditions on the right, then add the catalase."></div>
        <svg class="bench-svg" id="bench" viewBox="0 0 900 430" role="img" aria-label="Laboratory bench">
          <defs><linearGradient id="bgw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#eef6fb"/><stop offset="1" stop-color="#dde9f1"/></linearGradient><clipPath id="flaskclip"><path d="M258 190h44v38l54 100a6 6 0 0 1-5 9H209a6 6 0 0 1-5-9l54-100z"/></clipPath></defs>
          <rect x="0" y="380" width="900" height="50" fill="#d8cfc2"/><rect x="0" y="376" width="900" height="6" fill="#bfb3a3"/>
          <g id="zbath" class="zone" data-zone="zbath"><rect x="150" y="228" width="300" height="150" rx="8" class="zone-rect"/><text x="300" y="310" class="zone-label">drop the water bath here</text></g>
          <g id="g-bath" hidden><rect x="150" y="228" width="300" height="150" rx="8" fill="#dbe9f3" stroke="#5a7d96" stroke-width="2"/><rect x="158" y="246" width="284" height="124" fill="#bfe0f5" id="bathwater"/><rect x="150" y="228" width="300" height="12" fill="#8aa9bd"/><g id="heat" opacity="0"><rect x="158" y="356" width="284" height="14" fill="#ff8a65"/></g><text x="300" y="396" font-size="12" text-anchor="middle" fill="#3f5a6e">water bath · <tspan id="bathT">30</tspan> °C</text></g>
          <g id="zflask" class="zone" data-zone="zflask"><rect x="200" y="186" width="160" height="152" rx="10" class="zone-rect"/><text x="280" y="268" class="zone-label">flask</text></g>
          <g id="g-flask" hidden>
            <g clip-path="url(#flaskclip)"><rect id="liquid" x="190" y="337" width="180" height="0" fill="#c3dcf6" opacity=".9"/><g id="discs"></g><g id="bubbles"></g></g>
            <path d="M258 190h44v38l54 100a6 6 0 0 1-5 9H209a6 6 0 0 1-5-9l54-100z" fill="rgba(255,255,255,.35)" stroke="#476a85" stroke-width="2.5"/>
          </g>
          <g id="zthermo" class="zone" data-zone="zthermo"><rect x="380" y="150" width="40" height="200" rx="8" class="zone-rect"/><text x="400" y="255" class="zone-label" transform="rotate(-90 400 255)">thermometer</text></g>
          <g id="g-thermo" hidden><rect x="396" y="150" width="10" height="190" rx="5" fill="#fff" stroke="#476a85" stroke-width="2"/><rect id="merc" x="399" y="300" width="4" height="36" fill="#d9534f"/><circle cx="401" cy="342" r="9" fill="#d9534f" stroke="#476a85" stroke-width="2"/><text x="420" y="160" font-size="11" fill="#3f5a6e" id="thermoT">— °C</text></g>
          <g id="zsyringe" class="zone" data-zone="zsyringe"><rect x="520" y="150" width="340" height="70" rx="8" class="zone-rect"/><text x="690" y="190" class="zone-label">drop the gas syringe here</text></g>
          <g id="g-syringe" hidden><rect x="556" y="176" width="16" height="200" fill="#9aa5ad"/><rect x="580" y="166" width="220" height="40" rx="6" fill="#fff" stroke="#476a85" stroke-width="2.5"/><g id="scale"></g><rect id="gas" x="582" y="168" width="0" height="36" fill="#e8f2fa"/><g id="plunger" transform="translate(0 0)"><rect x="582" y="170" width="6" height="32" fill="#476a85"/><rect x="588" y="182" width="230" height="8" fill="#476a85"/><rect x="814" y="166" width="8" height="40" rx="2" fill="#476a85"/></g><text x="690" y="230" font-size="12" text-anchor="middle" fill="#3f5a6e"><tspan id="vol">0.0</tspan> cm³ of O₂</text></g>
          <g id="zbung" class="zone" data-zone="zbung"><rect x="246" y="150" width="68" height="40" rx="8" class="zone-rect"/><text x="280" y="175" class="zone-label">bung</text></g>
          <g id="g-bung" hidden><path d="M262 188h36l4 -22h-44z" fill="#8c6f4e" stroke="#5a4631" stroke-width="2"/><path id="tube" d="M280 166V130c0-14 10-14 24-14h260c12 0 16 4 16 16v42" fill="none" stroke="#476a85" stroke-width="3" stroke-dasharray="1000" stroke-dashoffset="1000"/></g>
          <g id="pour" hidden><g id="pourbottle"><rect x="190" y="90" width="28" height="60" rx="4" fill="#f7fbff" stroke="#476a85" stroke-width="2"/></g><path id="stream" d="M218 150q30 0 50 60" fill="none" stroke="#9ec9f0" stroke-width="5" stroke-linecap="round" opacity="0"/></g>
          <text id="msg" x="450" y="60" font-size="15" text-anchor="middle" fill="#1d3a52" font-weight="600"></text>
          <text id="clock" x="860" y="60" font-size="22" text-anchor="end" fill="#1d3a52" font-family="ui-monospace, monospace" font-weight="700">0 s</text>
        </svg>
        <div class="bench-controls">
          <label>Water-bath temperature: <strong><span id="tv">30</span> °C</strong><input type="range" id="temp" min="0" max="80" value="30" step="5"></label>
          <label>Hydrogen peroxide concentration: <strong><span id="sv">2.0</span> %</strong><input type="range" id="sub" min="0.25" max="6" value="2" step="0.25"></label>
          <label>Buffer pH: <strong><span id="pv">7.0</span></strong><input type="range" id="ph" min="3" max="11" value="7" step="0.5"></label>
          <label>Catalase (relative concentration): <strong>×<span id="ev">1.0</span></strong><input type="range" id="enz" min="0.25" max="2" value="1" step="0.25"></label>
          <div class="row"><button class="btn primary" id="start" disabled>Add catalase &amp; start clock</button><label class="small"><input type="checkbox" id="fast" checked> fast-forward (20×)</label><button class="btn" id="resetb">Reset bench</button></div>
          <div class="readout" id="readout">Set up the apparatus: drag or click each item on the shelf.</div>
        </div>
      </div>
      <div id="livechart" class="mt"></div>`;

    const svg = $("#bench", host), shelf = $("#shelf", host), msg = $("#msg", host), readout = $("#readout", host), start = $("#start", host);
    const placed = new Set(); let running = false, raf = null;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
    const say = (t) => { msg.textContent = t; };
    const bind = (id, out, fmt = (v) => v) => { const i = $("#" + id, host); const o = $("#" + out, host); i.addEventListener("input", () => { o.textContent = fmt(i.value); if (id === "temp") bathTemp(); }); };
    bind("temp", "tv"); bind("ph", "pv", (v) => (+v).toFixed(1)); bind("sub", "sv", (v) => (+v).toFixed(2)); bind("enz", "ev", (v) => (+v).toFixed(2));

    // syringe scale
    const scale = $("#scale", svg); for (let i = 0; i <= 10; i++) { const x = 582 + i * 22; scale.insertAdjacentHTML("beforeend", `<line x1="${x}" y1="196" x2="${x}" y2="${i % 5 ? 202 : 206}" stroke="#476a85" stroke-width="1"/>${i % 5 ? "" : `<text x="${x}" y="215" font-size="8" text-anchor="middle" fill="#476a85">${i * 10}</text>`}`); }

    function steps() {
      const done = (id) => placed.has(id);
      const list = [["bath", "Water bath on the bench"], ["flask", "Flask in the bath"], ["thermo", "Thermometer in the bath"], ["syringe", "Gas syringe clamped"], ["bung", "Bung and delivery tube connected"], ["h2o2", "Hydrogen peroxide measured into the flask"], ["catalase", "Catalase added and clock started"]];
      $("#bsteps", host).innerHTML = list.map(([id, t], i) => `<span class="bstep ${done(id) ? "done" : ""}">${done(id) ? "✓" : i + 1} ${t}</span>`).join("");
    }
    function drawShelf() {
      shelf.innerHTML = "";
      ITEMS.forEach((it) => { if (placed.has(it.id) || it.id === "catalase") return; const ready = !(it.needs || []).some((d) => !placed.has(d)); shelf.append(el(`<button class="shelf-item ${it.kind} ${ready ? "" : "locked"}" data-id="${it.id}" title="${ready ? "Drag onto the bench or press Enter to place" : "Needs: " + it.needs.map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}"><svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">${icon(it.id)}</svg><span>${esc(it.name)}</span></button>`)); });
      steps(); start.disabled = !(placed.has("bung") && placed.has("h2o2") && placed.has("thermo")) || running;
    }
    function place(id) {
      const it = ITEMS.find((x) => x.id === id); if (!it || placed.has(id)) return false;
      if ((it.needs || []).some((d) => !placed.has(d))) { say(`First you need: ${it.needs.filter((d) => !placed.has(d)).map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}.`); return false; }
      placed.add(id); $("#" + it.zone, svg).setAttribute("hidden", "");
      if (it.kind === "apparatus") { const g = $("#g-" + id, svg); g.removeAttribute("hidden"); g.classList.add("pop"); }
      if (id === "bath") { bathTemp(); say("Water bath in place. Now add the flask and thermometer."); }
      if (id === "flask") say("Flask in the bath. Clamp the gas syringe and fit the bung.");
      if (id === "thermo") { bathTemp(); say("Thermometer reading the bath. Leave the flask to equilibrate before adding enzyme."); }
      if (id === "syringe") say("Gas syringe clamped. Connect the delivery tube.");
      if (id === "bung") { const t = $("#tube", svg); t.style.transition = reduce ? "none" : "stroke-dashoffset 1s ease"; requestAnimationFrame(() => (t.style.strokeDashoffset = "0")); say("Delivery tube connected to the syringe. Measure in the hydrogen peroxide."); }
      if (id === "h2o2") pour();
      drawShelf(); return true;
    }
    function pour() {
      const p = $("#pour", svg), stream = $("#stream", svg), liq = $("#liquid", svg); p.removeAttribute("hidden");
      const dur = reduce ? 0 : 1200; stream.style.transition = `opacity .2s`; stream.style.opacity = 1;
      liq.style.transition = reduce ? "none" : `height ${dur}ms linear, y ${dur}ms linear`; liq.setAttribute("height", "0"); liq.setAttribute("y", "337");
      requestAnimationFrame(() => { liq.style.height = "70px"; liq.style.y = "267px"; liq.setAttribute("height", "70"); liq.setAttribute("y", "267"); });
      setTimeout(() => { stream.style.opacity = 0; p.setAttribute("hidden", ""); say(`${$("#sv", host).textContent}% hydrogen peroxide in the flask, equilibrating at ${$("#tv", host).textContent} °C.`); }, dur + 200);
    }
    function bathTemp() {
      const T = +$("#temp", host).value; $("#bathT", svg).textContent = T; $("#heat", svg).style.opacity = Math.max(0, (T - 20) / 60).toFixed(2);
      $("#bathwater", svg).setAttribute("fill", T > 60 ? "#f6d3c6" : T > 40 ? "#e5e0d1" : "#bfe0f5");
      if (placed.has("thermo")) { const m = $("#merc", svg); const hgt = 10 + T * 2.2; m.style.transition = reduce ? "none" : "all .8s ease"; m.setAttribute("y", 336 - hgt); m.setAttribute("height", hgt); $("#thermoT", svg).textContent = T + " °C"; }
    }
    // Drag from shelf: pointer events with a ghost; drop onto the zone whose rect contains the pointer.
    let drag = null, ghost = null;
    shelf.addEventListener("pointerdown", (e) => { const b = e.target.closest(".shelf-item"); if (!b || b.classList.contains("locked")) return; drag = b; ghost = b.cloneNode(true); ghost.classList.add("ghost"); document.body.append(ghost); b.setPointerCapture(e.pointerId); move(e); });
    const zoneAt = (x, y) => { const it = drag && ITEMS.find((i) => i.id === drag.dataset.id); if (!it) return null; const z = $("#" + it.zone, svg); if (z.hasAttribute("hidden") && it.kind === "reagent") { const g = $("#g-flask", svg); const r = g.getBoundingClientRect(); return x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20 ? it.zone : null; } const r = z.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? it.zone : null; };
    function move(e) { if (!ghost) return; ghost.style.left = e.clientX - 28 + "px"; ghost.style.top = e.clientY - 28 + "px"; const z = zoneAt(e.clientX, e.clientY); $$(".zone", svg).forEach((zz) => zz.classList.toggle("over", zz.id === z)); $("#g-flask", svg).classList.toggle("over", z === "zflask" && drag && ITEMS.find((i) => i.id === drag.dataset.id).kind === "reagent"); }
    shelf.addEventListener("pointermove", move);
    const end = (e) => { if (!drag) return; const z = zoneAt(e.clientX, e.clientY); const it = ITEMS.find((i) => i.id === drag.dataset.id); if (z === it.zone) place(it.id); $$(".zone", svg).forEach((zz) => zz.classList.remove("over")); $("#g-flask", svg).classList.remove("over"); drag = null; if (ghost) { ghost.remove(); ghost = null; } };
    shelf.addEventListener("pointerup", end); shelf.addEventListener("pointercancel", end);
    shelf.addEventListener("click", (e) => { const b = e.target.closest(".shelf-item"); if (b && !b.classList.contains("locked")) place(b.dataset.id); });
    shelf.addEventListener("keydown", (e) => { const b = e.target.closest(".shelf-item"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); place(b.dataset.id); } });

    // Run: drop discs, bubbles, plunger, clock, live chart; then hand the result to onRun.
    start.addEventListener("click", () => {
      if (running || start.disabled) return; running = true; start.disabled = true; placed.add("catalase"); steps(); $("#resetb", host).disabled = true;
      const T = +$("#temp", host).value, pH = +$("#ph", host).value, S = +$("#sub", host).value, E = +$("#enz", host).value;
      const res = B.labModels.catalaseRun(T, pH, S, E); const series = res.series;
      const discs = $("#discs", svg); discs.innerHTML = [0, 1, 2].map((i) => `<circle cx="${262 + i * 18}" cy="${330 - (i % 2) * 6}" r="7" fill="#e9d49a" stroke="#b89a4c" class="disc" style="animation-delay:${i * 0.12}s"/>`).join("");
      say(`Catalase in: clock started. ${res.v0 < 1 ? "Barely any oxygen: the enzyme is denatured or conditions are far from optimum." : ""}`);
      const bubbles = $("#bubbles", svg), gas = $("#gas", svg), plunger = $("#plunger", svg), vol = $("#vol", svg), clock = $("#clock", svg);
      const volAt = (t) => { const i = Math.min(179, Math.floor(t)); const a = res.fine[i], b = res.fine[i + 1]; return a + (b - a) * (t - i); };
      const maxV = B.labModels.params.SYRINGE_MAX; const t0 = performance.now(); let lastBubble = 0, lastChart = -1;
      const speed = () => ($("#fast", host).checked ? 20 : 1);
      const tick = (now) => {
        const t = Math.min(180, ((now - t0) / 1000) * speed()); const v = Math.min(maxV, volAt(t)); const px = (v / maxV) * 216;
        gas.setAttribute("width", px); plunger.setAttribute("transform", `translate(${px} 0)`); vol.textContent = v.toFixed(1); clock.textContent = `${Math.floor(t)} s`;
        const rate = (res.fine[Math.min(180, Math.ceil(t))] - res.fine[Math.max(0, Math.floor(t) - 1)]) * 60 / 2; // instantaneous model rate, cm3 min-1, drives the bubbling
        if (!reduce && now - lastBubble > 1000 / Math.max(1, Math.min(14, rate * 1.2)) && rate > 0.3) { lastBubble = now; const x = 232 + Math.random() * 96, y = 335; bubbles.insertAdjacentHTML("beforeend", `<circle cx="${x}" cy="${y}" r="${2 + Math.random() * 3}" fill="#fff" stroke="#9ec9f0" class="bubble"/>`); const b = bubbles.lastElementChild; setTimeout(() => b.remove(), 1600); if (bubbles.childElementCount > 40) bubbles.firstElementChild.remove(); }
        if (Math.floor(t / 10) !== lastChart) { lastChart = Math.floor(t / 10); const pts = series.filter((p) => p.x <= t).concat(t % 30 ? [{ x: +t.toFixed(0), y: +v.toFixed(1) }] : []); $("#livechart", host).innerHTML = `<p class="small"><strong>Volume of O₂ against time</strong> at ${T} °C, pH ${pH.toFixed(1)}, ${S}% substrate, enzyme ×${E}</p>` + B.charts.line(pts.length > 1 ? pts : [{ x: 0, y: 0 }, { x: 1, y: 0 }], { xLabel: "time / s", yLabel: "volume of O₂ / cm³", width: 560, height: 240 }); }
        if (t < 180) raf = requestAnimationFrame(tick); else finish();
      };
      const finish = () => { running = false; $("#resetb", host).disabled = false; readout.textContent = `Initial rate (volume at 30 s × 2) ≈ ${res.init} cm³ min⁻¹.${res.full ? ` The syringe was full after ${res.full} s, so later readings are capped at ${maxV} cm³.` : ""} Result added to the table below. Reset the bench to repeat at another setting.`; say(res.full ? "Syringe full: the later readings are not usable." : "Run complete: record the volumes and repeat for a mean."); onRun({ T, pH, S, E, series, init: res.init, full: res.full, yieldMax: res.yieldMax, v0: res.v0 }); };
      raf = requestAnimationFrame(tick);
    });
    $("#resetb", host).addEventListener("click", () => { if (raf) cancelAnimationFrame(raf); running = false; placed.clear(); ITEMS.forEach((it) => { const z = $("#" + it.zone, svg); z.removeAttribute("hidden"); const g = $("#g-" + it.id, svg); if (g) g.setAttribute("hidden", ""); }); $("#liquid", svg).setAttribute("height", "0"); $("#liquid", svg).style.height = "0px"; $("#liquid", svg).style.y = "337px"; $("#discs", svg).innerHTML = ""; $("#bubbles", svg).innerHTML = ""; $("#gas", svg).setAttribute("width", 0); $("#plunger", svg).setAttribute("transform", "translate(0 0)"); $("#vol", svg).textContent = "0.0"; $("#clock", svg).textContent = "0 s"; $("#tube", svg).style.transition = "none"; $("#tube", svg).style.strokeDashoffset = "1000"; say(""); readout.textContent = "Bench cleared. Set up the apparatus again for the next run (keep everything but the variable you are testing the same)."; drawShelf(); });
    drawShelf(); say("Drag the water bath onto the bench to begin.");
    B.views.bench.place = place; // exposed for tests
  };
})(window.BIO);
