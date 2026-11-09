// Animated virtual bench for RP1, following the OxfordAQA practical handbook exemplar (pp. 54–57): the effect of
// temperature on the rate of the reaction catalysed by trypsin. Casein in a 3% milk-powder solution makes it cloudy;
// trypsin digests the casein and the solution clears. An X is marked halfway down each tube; the time until the X is
// first seen through the solution is recorded for three tubes at each temperature. Students drag (or click, or press
// Enter on) each item on the shelf, then work through the handbook steps with one button. Three method decisions can
// deliberately be made wrongly (no equilibration, dyed buffer, shaking instead of inverting).
window.BIO = window.BIO || {}; window.BIO.labModels = window.BIO.labModels || {};
(function (B) {
  const { el, $, $$, esc } = B.util;

  // ---- Trypsin model (fitted 2026-11-03 to the handbook's sample results; documented in KNOWN_LIMITATIONS 6l) ----
  // Mean time for the X to appear, in seconds, at 0.5% trypsin and pH 7:
  //   t(T) = C / ( Q10^((T-20)/10) * 1/(1+exp((T-Tm)/w)) ),  C = 289.5 s, Q10 = 2.45, Tm = 42.5 °C, w = 5 °C.
  // Least-squares fit (log times) to the handbook's mean times (189 s at 25 °C, 79 s at 40 °C, 108 s at 50 °C,
  // 271 s at 60 °C); the model reproduces each to within 2%. The logistic term stands for loss of active enzyme during
  // the 10-minute equilibration and the run (real denaturation is time-dependent). Rate is taken as proportional to
  // trypsin concentration (0.25–1%) and to a pH factor exp(-(pH-8)²/(2·1.3²)) scaled to 1 at pH 7 (trypsin's
  // optimum is about pH 8). Individual tubes vary by about 5% (SD) because judging when the X appears is subjective.
  // Deliberate errors: no equilibration (mixture starts near the 22 °C room temperature, effective T = 22 + 0.6(T-22));
  // a dyed buffer (the X is harder to see: +30%, SD 12%); shaking instead of inverting (froth: +15%, SD 10%).
  // A tube that has not cleared after 600 s is recorded as "not clear after 10 min".
  const P = { C: 289.5, q10: 2.45, Tm: 42.5, w: 5, room: 22, limit: 600 };
  const pHf = (pH) => Math.exp(-((pH - 8) ** 2) / (2 * 1.3 * 1.3)) / Math.exp(-1 / (2 * 1.3 * 1.3));
  const rel = (T, pH = 7, E = 0.5) => (P.q10 ** ((T - 20) / 10)) / (1 + Math.exp((T - P.Tm) / P.w)) * pHf(pH) * (E / 0.5);
  const meanTime = (T, pH = 7, E = 0.5) => P.C / rel(T, pH, E);
  const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const tube = (T, pH, E, errors = {}, noise = true) => {
    const Teff = errors.noEquil ? P.room + 0.6 * (T - P.room) : T;
    let t = meanTime(Teff, pH, E), sd = 0.05;
    if (errors.dyed) { t *= 1.3; sd = 0.12; }
    if (errors.shake) { t *= 1.15; sd = Math.max(sd, 0.1); }
    if (noise) t *= Math.max(0.6, 1 + sd * randn());
    t = Math.round(t);
    return t > P.limit ? null : t;
  };
  B.labModels.trypsin = { P, pHf, rel, meanTime, tube, temps: [20, 30, 40, 50, 60] };

  const ITEMS = [
    { id: "bath", name: "Water bath + thermometer", zone: "zbath", kind: "apparatus" },
    { id: "rack", name: "Test tubes + rack", zone: "zrack", kind: "apparatus" },
    { id: "marker", name: "Waterproof marker pen", zone: "zmarker", kind: "apparatus", needs: ["rack"] },
    { id: "milk", name: "3% milk powder solution", zone: "zmilk", kind: "reagent" },
    { id: "trypsin", name: "0.5% trypsin solution", zone: "ztrypsin", kind: "reagent" },
    { id: "buffer", name: "pH 7 buffer (colourless)", zone: "zbuffer", kind: "reagent" },
    { id: "syringe", name: "10 cm³ syringes", zone: "zsyringe", kind: "apparatus" },
    { id: "bungs", name: "Bungs + stopwatch", zone: "zbungs", kind: "apparatus" },
  ];
  function icon(id) {
    switch (id) {
      case "bath": return `<rect x="6" y="20" width="48" height="32" rx="4" fill="#dbeefa" stroke="#476a85" stroke-width="2"/><rect x="40" y="6" width="4" height="34" fill="#e9eef2" stroke="#8a97a3"/><circle cx="42" cy="40" r="3" fill="#c0392b"/>`;
      case "rack": return `<rect x="8" y="34" width="44" height="6" fill="#8c6f4e"/>${[14, 24, 34, 44].map((x) => `<path d="M${x - 3} 10v34a3 3 0 0 0 6 0V10" fill="#f4f9ff" stroke="#476a85" stroke-width="1.5"/>`).join("")}`;
      case "marker": return `<rect x="8" y="26" width="38" height="9" rx="3" fill="#1d3a52"/><path d="M46 27l8 3.5-8 3.5z" fill="#111"/>`;
      case "milk": return `<path d="M20 8h20v8l6 6v30H14V22l6-6z" fill="#fbfaf6" stroke="#9aa5ad" stroke-width="2"/><rect x="16" y="30" width="28" height="12" fill="#eee9dd"/><text x="30" y="39" font-size="7" text-anchor="middle" fill="#5a4631">3%</text>`;
      case "trypsin": return `<path d="M22 8h16v8l5 6v30H17V22l5-6z" fill="#fff8ee" stroke="#9c7b3a" stroke-width="2"/><rect x="19" y="30" width="22" height="12" fill="#f6e7c8"/><text x="30" y="39" font-size="6.5" text-anchor="middle" fill="#5a4631">tryp</text>`;
      case "buffer": return `<path d="M22 8h16v8l5 6v30H17V22l5-6z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><text x="30" y="40" font-size="8" text-anchor="middle" fill="#476a85">pH 7</text>`;
      case "syringe": return `<rect x="10" y="26" width="34" height="9" fill="#f4f9ff" stroke="#476a85" stroke-width="1.5"/><rect x="44" y="28" width="8" height="5" fill="#9aa5ad"/><line x1="4" y1="30.5" x2="10" y2="30.5" stroke="#476a85" stroke-width="2"/>`;
      case "bungs": return `<rect x="8" y="34" width="16" height="12" rx="3" fill="#8c6f4e"/><circle cx="40" cy="30" r="13" fill="#fff" stroke="#476a85" stroke-width="2"/><line x1="40" y1="30" x2="40" y2="21" stroke="#1d3a52" stroke-width="2"/>`;
    }
    return "";
  }
  // tube geometry inside the water bath
  const TX = [520, 580, 640], TY = 214, TW = 34, TH = 150; // milk tubes (become the reaction tubes)
  const EX = [720, 770, 820]; // trypsin + buffer tubes
  const tubeSvg = (x, id, cls = "") => `<g id="${id}" class="${cls}"><g class="xmark" opacity="0"><line x1="${x + 9}" y1="${TY + 70}" x2="${x + 25}" y2="${TY + 86}" stroke="#16263a" stroke-width="3"/><line x1="${x + 25}" y1="${TY + 70}" x2="${x + 9}" y2="${TY + 86}" stroke="#16263a" stroke-width="3"/></g><rect class="fill" x="${x + 2}" y="${TY + TH}" width="${TW - 4}" height="0" fill="#fbfaf6" opacity=".96"/><path d="M${x} ${TY}v${TH - 12}a${TW / 2} ${TW / 2} 0 0 0 ${TW} 0V${TY}" fill="none" stroke="#476a85" stroke-width="2"/><rect class="bung" x="${x - 2}" y="${TY - 12}" width="${TW + 4}" height="14" rx="3" fill="#8c6f4e" opacity="0"/></g>`;
  const STAGES = [["setup", "Apparatus assembled"], ["mark", "X marked on three tubes"], ["milk", "10 cm³ milk in each"], ["enz", "2 cm³ trypsin + 2 cm³ buffer"], ["equil", "10 min in the water bath"], ["mix", "Mixed: bung, invert 5 times"], ["time", "Timed until the X is seen"]];
  const LABEL = { setup: "Mark an X on three tubes", mark: "Add 10 cm³ milk to each", milk: "Add 2 cm³ trypsin + 2 cm³ buffer to three tubes", enz: "Stand all six tubes in the water bath", equil: "Mix: pour, bung and invert", mix: "Start timing", time: "Timing…", done: "Next temperature" };

  B.views.benchTrypsin = function (host, n, onRun) {
    host.innerHTML = `
      <div class="bench-wrap">
        <div class="bench-steps" id="bsteps"></div>
        <div class="bench-shelf" id="shelf" aria-label="Apparatus shelf" data-empty="Everything is on the bench. Set the temperature on the right, then follow the handbook steps with the blue button."></div>
        <svg class="bench-svg" id="bench" viewBox="0 0 900 430" role="img" aria-label="Laboratory bench for the trypsin and milk practical">
          <rect x="0" y="380" width="900" height="50" fill="#d8cfc2"/><rect x="0" y="376" width="900" height="6" fill="#bfb3a3"/>
          <g id="zmilk" class="zone"><rect x="20" y="230" width="100" height="146" rx="8" class="zone-rect"/><text x="70" y="306" class="zone-label">milk</text></g>
          <g id="g-milk" hidden><path d="M45 250h50v20l14 14v88H31v-88l14-14z" fill="#fbfaf6" stroke="#9aa5ad" stroke-width="2"/><rect x="34" y="310" width="72" height="40" fill="#eee9dd"/><text x="70" y="334" font-size="11" text-anchor="middle" fill="#5a4631">3% milk</text></g>
          <g id="ztrypsin" class="zone"><rect x="130" y="230" width="90" height="146" rx="8" class="zone-rect"/><text x="175" y="306" class="zone-label">trypsin</text></g>
          <g id="g-trypsin" hidden><path d="M158 262h34v18l10 12v80h-54v-80l10-12z" fill="#fff8ee" stroke="#9c7b3a" stroke-width="2"/><rect x="150" y="318" width="50" height="34" fill="#f6e7c8"/><text x="175" y="339" font-size="10" text-anchor="middle" fill="#5a4631">0.5% trypsin</text></g>
          <g id="zbuffer" class="zone"><rect x="230" y="230" width="90" height="146" rx="8" class="zone-rect"/><text x="275" y="306" class="zone-label">buffer</text></g>
          <g id="g-buffer" hidden><path d="M258 262h34v18l10 12v80h-54v-80l10-12z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect id="bufliq" x="250" y="318" width="50" height="34" fill="#e6f1fb"/><text id="buftext" x="275" y="339" font-size="10" text-anchor="middle" fill="#476a85">pH 7 buffer</text></g>
          <g id="zsyringe" class="zone"><rect x="20" y="130" width="140" height="90" rx="8" class="zone-rect"/><text x="90" y="180" class="zone-label">syringes</text></g>
          <g id="g-syringe" hidden><g id="syr"><rect x="34" y="166" width="90" height="16" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect id="syrliq" x="36" y="168" width="0" height="12" fill="#eee9dd"/><rect x="124" y="170" width="24" height="8" fill="#9aa5ad"/><line x1="20" y1="174" x2="34" y2="174" stroke="#476a85" stroke-width="3"/></g></g>
          <g id="zmarker" class="zone"><rect x="170" y="130" width="150" height="90" rx="8" class="zone-rect"/><text x="245" y="180" class="zone-label">marker pen</text></g>
          <g id="g-marker" hidden><g id="pen"><rect x="190" y="168" width="96" height="14" rx="4" fill="#1d3a52"/><path d="M286 169l14 6-14 6z" fill="#111"/></g></g>
          <g id="zbungs" class="zone"><rect x="330" y="130" width="140" height="90" rx="8" class="zone-rect"/><text x="400" y="180" class="zone-label">bungs + stopwatch</text></g>
          <g id="g-bungs" hidden><rect x="344" y="190" width="22" height="16" rx="3" fill="#8c6f4e"/><rect x="370" y="190" width="22" height="16" rx="3" fill="#8c6f4e"/><circle cx="430" cy="178" r="26" fill="#fff" stroke="#476a85" stroke-width="2"/><text id="watch" x="430" y="183" font-size="13" text-anchor="middle" fill="#1d3a52" font-family="ui-monospace, monospace" font-weight="700">0 s</text></g>
          <g id="zrack" class="zone"><rect x="330" y="230" width="140" height="146" rx="8" class="zone-rect"/><text x="400" y="306" class="zone-label">test tubes + rack</text></g>
          <g id="g-rack" hidden><rect x="340" y="350" width="120" height="10" fill="#8c6f4e"/><text x="400" y="372" font-size="10" text-anchor="middle" fill="#6b7d8f">six tubes now in the bath</text></g>
          <g id="zbath" class="zone"><rect x="490" y="120" width="390" height="256" rx="8" class="zone-rect"/><text x="685" y="250" class="zone-label">water bath</text></g>
          <g id="g-bath" hidden><rect x="496" y="250" width="378" height="126" rx="10" fill="#dbeefa" stroke="#476a85" stroke-width="2.5"/><rect x="498" y="262" width="374" height="112" rx="8" fill="#c6e2f6" opacity=".7"/><rect x="852" y="140" width="8" height="200" rx="3" fill="#e9eef2" stroke="#8a97a3"/><rect id="thermofill" x="854" y="250" width="4" height="86" fill="#c0392b"/><circle cx="856" cy="342" r="7" fill="#c0392b"/><text id="bathT" x="842" y="136" font-size="13" text-anchor="end" fill="#1d3a52" font-weight="700">40 °C</text>
            ${TX.map((x, i) => tubeSvg(x, "rt" + i, "rtube")).join("")}${EX.map((x, i) => `<g id="et${i}" class="etube" opacity="0"><path d="M${x} ${TY + 40}v${TH - 52}a12 12 0 0 0 24 0V${TY + 40}" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect class="efill" x="${x + 2}" y="${TY + 112}" width="20" height="26" fill="#f6e7c8"/></g>`).join("")}
            ${TX.map((x, i) => `<g class="xbtn" data-i="${i}" tabindex="0" role="button" aria-label="X visible in tube ${i + 1}" style="cursor:pointer"><rect x="${x - 6}" y="${TY + TH + 14}" width="${TW + 12}" height="22" rx="6" fill="#1f8a85" opacity="0"/><text x="${x + TW / 2}" y="${TY + TH + 29}" font-size="10.5" text-anchor="middle" fill="#fff" opacity="0">tube ${i + 1}</text></g>`).join("")}</g>
          <text id="msg" x="30" y="34" font-size="14" text-anchor="start" fill="#1d3a52" font-weight="600"></text>
          <text id="clock" x="880" y="40" font-size="20" text-anchor="end" fill="#1d3a52" font-family="ui-monospace, monospace" font-weight="700">0 s</text>
        </svg>
        <div class="bench-controls">
          <label>Water-bath temperature: <strong><span id="tv">40</span> °C</strong><input type="range" id="temp" min="15" max="70" step="5" value="40"></label>
          <details class="small"><summary>Other variables (keep these constant while you investigate temperature)</summary>
            <label class="small">Buffer pH: <select id="ph"><option value="6">6</option><option value="7" selected>7 (handbook)</option><option value="8">8</option><option value="9">9</option></select></label>
            <label class="small">Trypsin concentration: <select id="enz"><option value="0.25">0.25%</option><option value="0.5" selected>0.5% (handbook)</option><option value="1">1%</option></select></label>
          </details>
          <details class="small"><summary>Method decisions (choose carefully: wrong choices have consequences)</summary>
            <label class="small"><input type="checkbox" id="equil" checked> leave all six tubes in the bath for 10 minutes before mixing</label>
            <label class="small">Buffer: <select id="buf"><option value="clear">colourless buffer</option><option value="dyed">dyed (coloured) buffer</option></select></label>
            <label class="small">Mix by: <select id="mixm"><option value="invert">bung and invert about 5 times</option><option value="shake">shaking vigorously</option></select></label>
          </details>
          <label class="small"><input type="checkbox" id="auto"> record each time automatically when the X appears (otherwise click each tube's button when you first see its X)</label>
          <div class="row"><button class="btn primary" id="act" disabled>Mark an X on three tubes</button><label class="small"><input type="checkbox" id="fast" checked> fast-forward</label><button class="btn" id="resetb">Reset bench</button></div>
          <div class="readout" id="readout">Set up the apparatus: drag or click each item on the shelf.</div>
        </div>
      </div>`;
    const svg = $("#bench", host), shelf = $("#shelf", host), msg = $("#msg", host), readout = $("#readout", host), act = $("#act", host);
    const placed = new Set(); let stage = "setup", raf = null, run = null;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
    // Bench messages wrap onto at most two lines so they never run into the clock.
    const say = (t) => { const words = String(t).split(" "); const lines = [""]; for (const w of words) { if ((lines[lines.length - 1] + " " + w).trim().length > 74 && lines.length < 2) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim(); } msg.textContent = ""; lines.forEach((ln, i) => { const ts = document.createElementNS("http://www.w3.org/2000/svg", "tspan"); ts.setAttribute("x", 30); ts.setAttribute("dy", i ? "1.25em" : "0"); ts.textContent = ln; msg.append(ts); }); };
    const ready = () => ITEMS.every((it) => placed.has(it.id));
    const T = () => +$("#temp", host).value;
    const setBath = () => { $("#tv", host).textContent = T(); $("#bathT", svg).textContent = `${T()} °C`; const hgt = 20 + (T() - 15) * 2.4; $("#thermofill", svg).setAttribute("y", 336 - hgt); $("#thermofill", svg).setAttribute("height", hgt); };
    $("#temp", host).addEventListener("input", setBath);
    $("#buf", host).addEventListener("change", () => { const d = $("#buf", host).value === "dyed"; $("#bufliq", svg).setAttribute("fill", d ? "#f3c9a0" : "#e6f1fb"); $("#buftext", svg).textContent = d ? "pH 7 (dyed)" : "pH 7 buffer"; });
    function steps() {
      const idx = stage === "done" ? STAGES.length : STAGES.findIndex((s) => s[0] === stage); const done = (i) => i < idx || (i === 0 && ready());
      $("#bsteps", host).innerHTML = STAGES.map(([id, t], i) => `<span class="bstep ${done(i) ? "done" : ""}">${done(i) ? "✓" : String.fromCharCode(65 + i)} ${t}</span>`).join("");
    }
    function drawShelf() {
      shelf.innerHTML = "";
      ITEMS.forEach((it) => { if (placed.has(it.id)) return; const ok = !(it.needs || []).some((d) => !placed.has(d)); shelf.append(el(`<button class="shelf-item ${it.kind} ${ok ? "" : "locked"}" data-id="${it.id}" title="${ok ? "Drag onto the bench or press Enter" : "Needs: " + it.needs.join(", ")}" aria-label="${esc(it.name)}"><svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">${icon(it.id)}</svg><span>${esc(it.name)}</span></button>`)); });
      steps(); act.disabled = !ready() || stage === "time" || stage === "busy"; act.textContent = LABEL[stage] || "Working…";
      if (ready() && stage === "setup") { say("Everything is on the bench. Mark an X halfway down one side of three test tubes."); readout.textContent = "Apparatus assembled. Set the water-bath temperature, then follow the steps."; }
    }
    function place(id) {
      const it = ITEMS.find((x) => x.id === id); if (!it || placed.has(id)) return false;
      if ((it.needs || []).some((d) => !placed.has(d))) { say(`First you need: ${it.needs.filter((d) => !placed.has(d)).map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}.`); return false; }
      placed.add(id); $("#" + it.zone, svg).setAttribute("hidden", ""); const g = $("#g-" + id, svg); g.removeAttribute("hidden"); g.classList.add("pop");
      if (id === "bath") setBath();
      const hints = { bath: "Water bath with a thermometer: check the temperature in the tubes, not just the dial.", rack: "Test tubes in a rack: three for milk, three for trypsin and buffer.", marker: "Waterproof marker: the X must survive the water bath.", milk: "3% milk powder solution (fat-free): the casein makes it cloudy.", trypsin: "0.5% trypsin, made up just before the lesson because it deteriorates on storage. Proteases can cause allergic reactions: eye protection, wash off splashes.", buffer: "pH 7 buffer keeps the pH constant. It must be colourless.", syringe: "Syringes measure 10 cm³ and 2 cm³ volumes.", bungs: "Bungs for inverting the tubes; stopwatch for timing." };
      say(hints[id]); drawShelf(); return true;
    }
    let drag = null, ghost = null;
    shelf.addEventListener("pointerdown", (e) => { const b = e.target.closest(".shelf-item"); if (!b || b.classList.contains("locked")) return; drag = b; ghost = b.cloneNode(true); ghost.classList.add("ghost"); document.body.append(ghost); b.setPointerCapture(e.pointerId); move(e); });
    const zoneAt = (x, y) => { const it = drag && ITEMS.find((i) => i.id === drag.dataset.id); if (!it) return null; const r = $("#" + it.zone, svg).getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? it.zone : null; };
    function move(e) { if (!ghost) return; ghost.style.left = e.clientX - 28 + "px"; ghost.style.top = e.clientY - 28 + "px"; const z = zoneAt(e.clientX, e.clientY); $$(".zone", svg).forEach((zz) => zz.classList.toggle("over", zz.id === z)); }
    shelf.addEventListener("pointermove", move);
    const end = (e) => { if (!drag) return; const z = zoneAt(e.clientX, e.clientY); const it = ITEMS.find((i) => i.id === drag.dataset.id); if (z === it.zone) place(it.id); $$(".zone", svg).forEach((zz) => zz.classList.remove("over")); drag = null; if (ghost) ghost.remove(); ghost = null; };
    shelf.addEventListener("pointerup", end); shelf.addEventListener("pointercancel", end);
    shelf.addEventListener("click", (e) => { const b = e.target.closest(".shelf-item"); if (b && !b.classList.contains("locked")) place(b.dataset.id); });
    shelf.addEventListener("keydown", (e) => { const b = e.target.closest(".shelf-item"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); place(b.dataset.id); } });

    const later = (fn, ms) => setTimeout(fn, reduce ? 0 : ms);
    const fills = () => TX.map((_, i) => $(`#rt${i} .fill`, svg));
    const setFill = (i, cm3) => { const f = fills()[i]; const h = Math.min(TH - 6, cm3 * 8.4); f.setAttribute("y", TY + TH - h); f.setAttribute("height", h); };
    const showBtns = (on) => $$(".xbtn", svg).forEach((b) => { $$("rect,text", b).forEach((x) => x.setAttribute("opacity", on ? (x.tagName === "rect" ? 1 : 1) : 0)); });
    function record(i, t) {
      if (!run || run.times[i] !== undefined) return;
      run.times[i] = t; const b = $$(".xbtn", svg)[i]; $("rect", b).setAttribute("fill", "#6b9a7f"); $("text", b).textContent = t === null ? "> 10 min" : `${t} s`;
      if (run.times.filter((x) => x !== undefined).length === 3) finish();
    }
    function finish() {
      if (raf) cancelAnimationFrame(raf); raf = null; stage = "done";
      const out = { T: run.T, pH: run.pH, E: run.E, times: run.times.slice(), errors: { ...run.errors }, judged: run.judged };
      const ok = out.times.filter((x) => x !== null);
      readout.textContent = ok.length ? `Times for the X to appear at ${out.T} °C: ${out.times.map((x) => (x === null ? "not clear after 10 min" : x + " s")).join(", ")}. Process them in the Calculate tab.` : `None of the tubes cleared within 10 minutes at ${out.T} °C.`;
      say("Recorded in the results table. Set the next temperature and repeat with fresh tubes.");
      if (onRun) onRun(out); drawShelf();
    }
    $$(".xbtn", svg).forEach((b) => { const go = () => { if (stage !== "time" || !run || run.auto) return; const i = +b.dataset.i; if (reduce) { record(i, run.model[i]); return; } const tSec = Math.round(run.elapsed); record(i, tSec > B.labModels.trypsin.P.limit ? null : tSec); }; b.addEventListener("click", go); b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });

    act.addEventListener("click", () => {
      if (act.disabled) return;
      if (stage === "setup") {
        const pen = $("#pen", svg); pen.style.transition = reduce ? "none" : "transform .7s ease"; pen.style.transform = "translate(330px,110px)";
        stage = "busy"; drawShelf();
        later(() => { pen.style.transform = ""; $$(".xmark", svg).forEach((x) => x.setAttribute("opacity", 1)); say("An X marked halfway down one side of each of three tubes."); stage = "mark"; drawShelf(); }, 800);
      } else if (stage === "mark") {
        stage = "busy"; drawShelf(); $("#syrliq", svg).setAttribute("width", 86); $("#syrliq", svg).setAttribute("fill", "#eee9dd");
        let k = 0; const pour = () => { setFill(k, 10); k++; if (k < 3) later(pour, 350); else { $("#syrliq", svg).setAttribute("width", 0); $$(".xmark", svg).forEach((x) => x.setAttribute("opacity", 0)); say("10 cm³ of milk powder solution in each marked tube: the X is hidden by the cloudy casein."); stage = "milk"; drawShelf(); } }; later(pour, 300);
      } else if (stage === "milk") {
        stage = "busy"; drawShelf(); $$(".etube", svg).forEach((x, i) => later(() => x.setAttribute("opacity", 1), i * 250));
        later(() => { say(`2 cm³ of trypsin and 2 cm³ of pH ${$("#ph", host).value} buffer in each of three more tubes.`); stage = "enz"; drawShelf(); }, 800);
      } else if (stage === "enz") {
        const equil = $("#equil", host).checked;
        run = { T: T(), pH: +$("#ph", host).value, E: +$("#enz", host).value, errors: { noEquil: !equil, dyed: $("#buf", host).value === "dyed", shake: $("#mixm", host).value === "shake" }, times: [undefined, undefined, undefined], elapsed: 0 };
        if (!equil) { say(`Tubes stood in the ${run.T} °C bath but mixed straight away: the solutions are still near room temperature.`); stage = "equil"; drawShelf(); return; }
        stage = "busy"; drawShelf(); const t0 = performance.now(); const total = 600; const speed = () => ($("#fast", host).checked ? 150 : 1);
        const tick = (now) => { const s = reduce ? total : Math.min(total, ((now - t0) / 1000) * speed()); $("#clock", svg).textContent = `${Math.floor(s / 60)} min ${Math.floor(s % 60)} s`; if (s < total) raf = requestAnimationFrame(tick); else { raf = null; say(`All six tubes have been in the ${run.T} °C bath for 10 minutes: both solutions are at the bath temperature.`); stage = "equil"; drawShelf(); } };
        raf = requestAnimationFrame(tick);
      } else if (stage === "equil") {
        stage = "busy"; drawShelf();
        $$(".etube", svg).forEach((x) => x.setAttribute("opacity", 0.25)); TX.forEach((_, i) => setFill(i, 14)); $$(".rtube .bung", svg).forEach((b) => b.setAttribute("opacity", 1));
        const tubes = $$(".rtube", svg); tubes.forEach((g, i) => { g.style.transformBox = "fill-box"; g.style.transformOrigin = "center"; g.style.transition = reduce ? "none" : "transform .25s"; let k = 0; const flip = () => { g.style.transform = k % 2 ? "" : "rotate(180deg)"; k++; if (k < 10) later(flip, 260); else g.style.transform = ""; }; later(flip, i * 120); });
        later(() => { $$(".rtube .bung", svg).forEach((b) => b.setAttribute("opacity", run.errors.shake ? 1 : 0)); if (run.errors.shake) fills().forEach((f) => f.setAttribute("fill", "#ffffff")); say(run.errors.shake ? "Shaken vigorously: froth has formed on top of the milk." : "Trypsin and buffer poured into the milk; each tube bunged and inverted about 5 times, gently, then returned to the bath."); stage = "mix"; drawShelf(); }, 2900);
      } else if (stage === "mix") {
        const M = B.labModels.trypsin; run.auto = $("#auto", host).checked; run.judged = !run.auto;
        run.model = [0, 1, 2].map(() => M.tube(run.T, run.pH, run.E, run.errors, true));
        stage = "time"; drawShelf(); showBtns(true);
        say(run.auto ? "Timing. Each time is recorded when the X first becomes visible." : "Timing. Watch the tubes and click a tube's button the moment you first see its X.");
        const t0 = performance.now(); const speed = () => ($("#fast", host).checked ? 10 : 1); const limit = M.P.limit;
        const tick = (now) => {
          const s = reduce ? limit : Math.min(limit + 1, ((now - t0) / 1000) * speed()); run.elapsed = s; $("#clock", svg).textContent = `${Math.floor(s)} s`; $("#watch", svg).textContent = `${Math.floor(s)} s`;
          run.model.forEach((tc, i) => { const clearAt = tc === null ? limit * 1.6 : tc; const f = s / clearAt; const op = f <= 1 ? 0.96 - 0.2 * f * f : Math.max(0.25, 0.76 - 0.5 * (f - 1)); fills()[i].setAttribute("opacity", op.toFixed(3)); const xo = f < 0.8 ? 0 : Math.min(1, (f - 0.8) / 0.2); $$(".xmark", svg)[i].setAttribute("opacity", xo.toFixed(2)); if (run.auto && run.times[i] === undefined && tc !== null && s >= tc) record(i, tc); });
          if (s > limit) { run.model.forEach((tc, i) => { if (run.times[i] === undefined) record(i, run.auto ? tc : null); }); return; }
          if (stage === "time") raf = requestAnimationFrame(tick);
        };
        if (reduce) { run.model.forEach((tc, i) => { fills()[i].setAttribute("opacity", tc === null ? 0.9 : 0.4); $$(".xmark", svg)[i].setAttribute("opacity", tc === null ? 0 : 1); }); if (run.auto) run.model.forEach((tc, i) => record(i, tc)); else say("Reduced motion: the tubes are shown cleared. Click each tube's button to record its time."); }
        else raf = requestAnimationFrame(tick);
      } else if (stage === "done") {
        resetTubes(); stage = "mark"; drawShelf(); $$(".xmark", svg).forEach((x) => x.setAttribute("opacity", 1)); say("Fresh tubes, marked with an X. Add 10 cm³ of milk to each.");
      }
    });
    function resetTubes() { if (raf) cancelAnimationFrame(raf); raf = null; run = null; TX.forEach((_, i) => { setFill(i, 0); fills()[i].setAttribute("opacity", 0.96); fills()[i].setAttribute("fill", "#fbfaf6"); }); $$(".etube", svg).forEach((x) => x.setAttribute("opacity", 0)); $$(".rtube .bung", svg).forEach((b) => b.setAttribute("opacity", 0)); $$(".xmark", svg).forEach((x) => x.setAttribute("opacity", 0)); showBtns(false); $$(".xbtn", svg).forEach((b, i) => { $("rect", b).setAttribute("fill", "#1f8a85"); $("text", b).textContent = `tube ${i + 1}`; }); $("#clock", svg).textContent = "0 s"; $("#watch", svg).textContent = "0 s"; }
    $("#resetb", host).addEventListener("click", () => { resetTubes(); placed.clear(); stage = "setup"; ITEMS.forEach((it) => { $("#" + it.zone, svg).removeAttribute("hidden"); $("#g-" + it.id, svg).setAttribute("hidden", ""); }); drawShelf(); say("Drag the water bath onto the bench to begin."); readout.textContent = "Set up the apparatus: drag or click each item on the shelf."; });
    drawShelf(); say("Drag the water bath onto the bench to begin.");
    B.views.benchTrypsin.place = place; B.views.benchTrypsin.stage = () => stage; B.views.benchTrypsin.run = () => run; // exposed for tests
  };
})(window.BIO);
