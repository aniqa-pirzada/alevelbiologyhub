// Animated virtual bench for RP2 (effect of solute concentration on the mass of plant tissue: osmosis). Students
// drag apparatus from the shelf, cut and trim a set of six potato chips (or one chip), weigh them, immerse one in each
// labelled sucrose solution, time the immersion, blot them (a single chip may be left unblotted) and weigh them again. Every item can also be placed by clicking (keyboard:
// Enter). The osmosis model is B.labModels.osmosisRun, built on B.transportModel (documented in
// data/content/_transport-art.js and KNOWN_LIMITATIONS.md). Results feed the RP2 results table and Calculate tab.
window.BIO = window.BIO || {}; window.BIO.labModels = window.BIO.labModels || {};
(function (B) {
  const { el, $, $$, esc } = B.util;

  // ---- Osmosis model (reviewed 2026-11-01) ----
  // Chips from a potato chip cutter (handbook method), trimmed to the same length, weigh about 6.4 g (the handbook's
  // sample chips weighed 6.2-6.6 g); each chip varies by +-8 %. Percentage change in mass after t minutes in sucrose of
  // concentration C (mol dm-3) comes from B.transportModel.massChangePct: the tissue's water potential is -730 kPa
  // (a model value within the range reported for potato); solution water potentials are worked out at 30 C (303 K, the
  // handbook water bath), so the isotonic concentration is about 0.29 mol dm-3; the
  // change saturates as t grows (1 - exp(-t/25)) and is capped at about +-22 %. Individual chips differ in
  // their tissue (+-1.5 percentage points) and the balance reads to 0.01 g. A chip that is NOT blotted carries
  // surface liquid of 0.08-0.16 g, a systematic positive error that students should be able to spot.
  B.labModels.osmosisMass = (noise = true) => +(6.4 * (noise ? 1 + (Math.random() - 0.5) * 0.16 : 1)).toFixed(2);
  B.labModels.osmosisRun = (C, minutes, blotted, noise = true, m0 = B.labModels.osmosisMass(noise)) => {
    const pctTrue = B.transportModel.massChangePct(C, { minutes });
    const pct = pctTrue + (noise ? (Math.random() - 0.5) * 3 : 0);
    const surface = blotted ? 0 : 0.08 + (noise ? Math.random() * 0.08 : 0.04);
    const m1 = +(m0 * (1 + pct / 100) + surface).toFixed(2);
    return { m0, m1, pctTrue: +pctTrue.toFixed(1), blotted };
  };
  B.labModels.osmosisConcs = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  const ITEMS = [
    { id: "tile", name: "White tile + potato", zone: "ztile", kind: "apparatus" },
    { id: "tools", name: "Chip cutter (or cork borer) + scalpel", zone: "ztools", kind: "apparatus", needs: ["tile"] },
    { id: "ruler", name: "Ruler", zone: "zruler", kind: "apparatus" },
    { id: "balance", name: "Balance (0.01 g)", zone: "zbalance", kind: "apparatus" },
    { id: "beakers", name: "Dilution series in a 30 °C water bath", zone: "zbeakers", kind: "apparatus" },
    { id: "towel", name: "Paper towels", zone: "ztowel", kind: "apparatus" },
    { id: "timer", name: "Timer", zone: "ztimer", kind: "apparatus" },
  ];
  function icon(id) {
    switch (id) {
      case "tile": return `<rect x="4" y="30" width="52" height="22" rx="3" fill="#fff" stroke="#8a97a3" stroke-width="2"/><ellipse cx="30" cy="30" rx="18" ry="11" fill="#d9b985" stroke="#9c7b3a" stroke-width="2"/>`;
      case "tools": return `<rect x="8" y="26" width="30" height="6" rx="3" fill="#9aa5ad"/><rect x="36" y="22" width="18" height="14" rx="2" fill="#5a4631"/><path d="M6 46h26l6 -4" stroke="#9aa5ad" stroke-width="3" fill="none"/><rect x="34" y="40" width="20" height="8" rx="2" fill="#5a4631"/>`;
      case "ruler": return `<rect x="4" y="24" width="52" height="14" fill="#f3e6b8" stroke="#9c7b3a" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<line x1="${8 + i * 6}" y1="24" x2="${8 + i * 6}" y2="${i % 2 ? 29 : 33}" stroke="#5a4631"/>`).join("")}`;
      case "balance": return `<rect x="6" y="32" width="48" height="20" rx="4" fill="#e4ebf5" stroke="#5a7d96" stroke-width="2"/><rect x="14" y="22" width="32" height="6" rx="2" fill="#8aa9bd"/><rect x="24" y="38" width="20" height="8" fill="#1d3a52"/>`;
      case "beakers": return `<path d="M8 20h14v30H8z M26 20h14v30H26z M44 20h12v30H44z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect x="9" y="36" width="12" height="13" fill="#cfe6ff"/><rect x="27" y="32" width="12" height="17" fill="#cfe6ff"/><rect x="45" y="30" width="10" height="19" fill="#cfe6ff"/>`;
      case "towel": return `<rect x="10" y="22" width="40" height="8" fill="#fff" stroke="#b9c2ca"/><rect x="10" y="32" width="40" height="8" fill="#fff" stroke="#b9c2ca"/><rect x="10" y="42" width="40" height="8" fill="#fff" stroke="#b9c2ca"/>`;
      case "timer": return `<rect x="10" y="14" width="40" height="34" rx="6" fill="#fff" stroke="#476a85" stroke-width="2"/><rect x="16" y="20" width="28" height="12" fill="#1d3a52"/><circle cx="24" cy="40" r="3" fill="#476a85"/><circle cx="36" cy="40" r="3" fill="#476a85"/>`;
    }
    return "";
  }

  // Positions the chip sprite can occupy (centre of the chip's top-left anchor)
  const POS = { tile: [120, 310], ruler: [292, 324], balance: [440, 300], towel: [292, 196], hidden: [-100, -100] };
  const beakerX = (i) => 560 + i * 54;

  B.views.benchOsmosis = function (host, n, onRun) {
    host.innerHTML = `
      <div class="bench-wrap ix-bench-full bench-osm">
        <div class="bench-steps" id="bsteps"></div>
        <div class="bench-stage"><p class="bench-say" aria-hidden="true"></p><svg class="bench-svg" id="bench" viewBox="0 0 900 430" role="img" aria-label="Laboratory bench for the osmosis practical">
          <rect x="0" y="380" width="900" height="50" fill="#d8cfc2"/><rect x="0" y="376" width="900" height="6" fill="#bfb3a3"/>
          <g id="ztile" class="zone" data-zone="ztile"><rect x="30" y="240" width="200" height="136" rx="8" class="zone-rect"/><text x="130" y="312" class="zone-label">drop the tile here</text></g>
          <g id="g-tile" hidden><rect x="30" y="340" width="200" height="36" rx="4" fill="#fff" stroke="#8a97a3" stroke-width="2"/><ellipse id="potato" cx="90" cy="326" rx="48" ry="30" fill="#d9b985" stroke="#9c7b3a" stroke-width="2"/><ellipse cx="78" cy="318" rx="6" ry="4" fill="#c9a870"/><ellipse cx="104" cy="334" rx="5" ry="3" fill="#c9a870"/></g>
          <g id="ztools" class="zone" data-zone="ztools"><rect x="30" y="150" width="200" height="84" rx="8" class="zone-rect"/><text x="130" y="196" class="zone-label">cutting tools</text></g>
          <g id="g-tools" hidden><g id="borer"><rect x="60" y="186" width="90" height="10" rx="5" fill="#9aa5ad" stroke="#6b7d8f"/><rect x="150" y="180" width="30" height="22" rx="3" fill="#5a4631"/></g><g id="scalpel"><path d="M40 222h60l10 -6" stroke="#9aa5ad" stroke-width="3" fill="none"/><rect x="100" y="216" width="36" height="10" rx="3" fill="#5a4631"/></g></g>
          <g id="zruler" class="zone" data-zone="zruler"><rect x="245" y="250" width="100" height="126" rx="8" class="zone-rect"/><text x="295" y="318" class="zone-label">ruler</text></g>
          <g id="g-ruler" hidden><rect x="255" y="296" width="36" height="80" fill="#f3e6b8" stroke="#9c7b3a" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="255" y1="${302 + i * 10}" x2="${i % 5 ? 261 : 266}" y2="${302 + i * 10}" stroke="#5a4631"/>`).join("")}${[0, 1, 2, 3].map((i) => `<text x="287" y="${306 + i * 20}" font-size="11" text-anchor="end" fill="#5a4631">${i * 2}</text>`).join("")}<text x="273" y="390" font-size="11" text-anchor="middle" fill="#5a4631">ruler / cm</text></g>
          <g id="ztowel" class="zone" data-zone="ztowel"><rect x="245" y="150" width="100" height="92" rx="8" class="zone-rect"/><text x="295" y="200" class="zone-label">paper towels</text></g>
          <g id="g-towel" hidden><rect x="258" y="206" width="74" height="10" fill="#fff" stroke="#b9c2ca"/><rect x="258" y="218" width="74" height="10" fill="#fff" stroke="#b9c2ca"/><rect x="258" y="230" width="74" height="10" fill="#fff" stroke="#b9c2ca"/><g id="wet" opacity="0"><ellipse cx="295" cy="211" rx="22" ry="4" fill="#bfe0f5"/></g></g>
          <g id="zbalance" class="zone" data-zone="zbalance"><rect x="355" y="250" width="180" height="126" rx="8" class="zone-rect"/><text x="445" y="318" class="zone-label">drop the balance here</text></g>
          <g id="g-balance" hidden><rect x="365" y="330" width="160" height="46" rx="6" fill="#e4ebf5" stroke="#5a7d96" stroke-width="2"/><rect x="395" y="318" width="100" height="10" rx="3" fill="#8aa9bd"/><rect x="380" y="342" width="80" height="22" rx="3" fill="#1d3a52"/><text id="balr" x="420" y="358" font-size="13" text-anchor="middle" fill="#9ef0c0" font-family="ui-monospace, monospace">0.00 g</text><text x="476" y="358" font-size="11" fill="#3f5a6e">TARE</text></g>
          <g id="ztimer" class="zone" data-zone="ztimer"><rect x="355" y="150" width="180" height="92" rx="8" class="zone-rect"/><text x="445" y="200" class="zone-label">timer</text></g>
          <g id="g-timer" hidden><rect x="395" y="166" width="100" height="60" rx="8" fill="#fff" stroke="#476a85" stroke-width="2"/><rect x="405" y="176" width="80" height="26" fill="#1d3a52"/><text id="timerr" x="445" y="194" font-size="14" text-anchor="middle" fill="#9ef0c0" font-family="ui-monospace, monospace">00:00</text><text x="445" y="219" font-size="11" text-anchor="middle" fill="#3f5a6e">min : s</text></g>
          <g id="zbeakers" class="zone" data-zone="zbeakers"><rect x="548" y="200" width="340" height="176" rx="8" class="zone-rect"/><text x="718" y="292" class="zone-label">drop the boiling tubes and water bath here</text></g>
          <g id="g-beakers" hidden><rect x="526" y="292" width="348" height="84" rx="8" fill="#dbeefa" stroke="#476a85" stroke-width="2"/><text x="700" y="232" font-size="12" text-anchor="middle" fill="#1d3a52" font-weight="700">six boiling tubes in a water bath at 30 °C</text><text x="700" y="252" font-size="12" text-anchor="middle" fill="#3f5a6e">sucrose concentration / mol dm⁻³ (on each tag)</text>${B.labModels.osmosisConcs.map((c, i) => `<g class="beaker" data-i="${i}"><path d="M${beakerX(i) - 15} 262h30v96a15 15 0 0 1-30 0z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><path d="M${beakerX(i) - 13} 298h26v60a13 13 0 0 1-26 0z" fill="#cfe6ff" opacity=".8"/><rect x="${beakerX(i) - 19}" y="384" width="38" height="20" rx="4" fill="#fff" stroke="#9aa5ad"/><text x="${beakerX(i)}" y="399" font-size="13" text-anchor="middle" fill="#1d3a52" font-weight="700">${c.toFixed(1)}</text></g>`).join("")}</g>
          <g id="chips6" hidden>${B.labModels.osmosisConcs.map((c, i) => `<rect x="${beakerX(i) - 8}" y="304" width="16" height="52" rx="5" fill="#f1dca2" stroke="#b89a4c" stroke-width="1.5"/>`).join("")}</g>
          <g id="cyl" hidden><rect x="0" y="0" width="16" height="52" rx="5" fill="#f1dca2" stroke="#b89a4c" stroke-width="1.5"/><g id="drips" opacity="0"><circle cx="4" cy="56" r="2" fill="#9ec9f0"/><circle cx="12" cy="58" r="1.6" fill="#9ec9f0"/></g><g id="six" hidden><rect x="18" y="4" width="16" height="48" rx="5" fill="#f1dca2" stroke="#b89a4c" stroke-width="1.5"/><text x="8" y="-6" font-size="13" text-anchor="middle" fill="#5a4631" font-weight="700">×6</text></g></g>
          <text id="msg" x="450" y="60" font-size="15" text-anchor="middle" fill="#1d3a52" font-weight="600"></text>
          <text id="clock" x="880" y="60" font-size="20" text-anchor="end" fill="#1d3a52" font-family="ui-monospace, monospace" font-weight="700">0 min</text>
        </svg></div>
        <div class="bench-shelf" id="shelf" aria-label="Apparatus shelf" data-empty="Everything is on the bench. Choose how many chips and the immersion time below, then work through the steps with the blue button."></div>
        <div class="bench-controls">
          <fieldset class="small osm-mode" style="border:0;padding:0;margin:0"><legend class="small"><strong>Chips per run</strong></legend><label class="small"><input type="radio" name="osm-mode" id="mode6" value="6" checked> a set of six chips, one in each tube (as in the handbook)</label><br><label class="small"><input type="radio" name="osm-mode" id="mode1" value="1"> one chip at a time (choose its tube; lets you try not blotting it)</label></fieldset>
          <div id="one-opts" hidden><label>Sucrose concentration (which boiling tube): <strong><span id="cv">0.4</span> mol dm⁻³</strong><input type="range" id="conc" min="0" max="5" value="2" step="1"></label>
          <label class="small"><input type="checkbox" id="blot" checked> blot the chip dry before the final weighing</label></div>
          <label>Immersion time: <strong><span id="mv">20</span> min</strong><input type="range" id="mins" min="10" max="60" value="20" step="5"></label>
          <div class="row"><button class="btn primary" id="act" disabled>Cut six chips</button><label class="small"><input type="checkbox" id="fast" checked> fast-forward (20 min in a few seconds)</label><button class="btn" id="resetb">Reset bench</button></div>
          <div class="readout" id="readout">Set up the apparatus: drag or click each item on the shelf.</div>
        </div>
      </div>`;

    const svg = $("#bench", host), shelf = $("#shelf", host), msg = $("#msg", host), readout = $("#readout", host), act = $("#act", host), cyl = $("#cyl", svg);
    const placed = new Set(); let stage = "setup", raf = null, run = null, busy = false; // busy: an animated step is running (QG2 R10: blocks repeat presses that duplicated rows)
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
    const say = (t) => { msg.textContent = t; const bs = $(".bench-say", host); if (bs) bs.textContent = t; };
    const conc = () => B.labModels.osmosisConcs[+$("#conc", host).value];
    // Two ways of working (R9-17): a set of six chips, one per tube, cut, weighed, immersed and re-weighed together as in the
    // handbook (the default; always blotted), or one chip at a time, which is kept for the deliberate not-blotting error.
    const six = () => $("#mode6", host).checked;
    const setMode = () => { $("#one-opts", host).hidden = six(); $("#six", svg).toggleAttribute("hidden", !six()); drawShelf(); };
    $$('input[name="osm-mode"]', host).forEach((r) => r.addEventListener("change", setMode));
    $("#conc", host).addEventListener("input", () => { $("#cv", host).textContent = conc().toFixed(1); highlightBeaker(); });
    $("#mins", host).addEventListener("input", () => { $("#mv", host).textContent = $("#mins", host).value; });
    const ready = () => ITEMS.every((it) => placed.has(it.id));
    const moveCyl = (x, y, delay = 0) => { cyl.removeAttribute("hidden"); cyl.style.transition = reduce ? "none" : `transform .9s ease ${delay}ms`; cyl.style.transform = `translate(${x}px,${y}px)`; };
    const highlightBeaker = () => { $$(".beaker", svg).forEach((b) => b.classList.toggle("over", stage === "immerse" && (run && run.set ? true : +b.dataset.i === +$("#conc", host).value))); };

    const STAGES = [["setup", "Apparatus assembled"], ["cut", "Cut and peeled"], ["trim", "Trimmed to the same length"], ["weigh0", "Blotted and initial mass recorded"], ["immerse", "Immersed and timed"], ["remove", "Removed and blotted"], ["weigh1", "Final mass recorded"]];
    const LABEL1 = { setup: "Cut a chip", cut: "Trim to length", trim: "Blot and weigh (initial mass)", weigh0: "Immerse and start timer", immerse: "Immersing…", remove: "Remove from solution", blot: "Weigh (final mass)", weigh1: "Next chip" };
    const LABEL6 = { setup: "Cut six chips", cut: "Trim all six to length", trim: "Blot and weigh each chip", weigh0: "Put one chip in each tube and start the timer", immerse: "Immersing…", remove: "Remove and blot all six", blot: "Weigh each chip again", weigh1: "Next set of six" };
    function steps() {
      const idx = STAGES.findIndex((s) => s[0] === stage); const done = (i) => (stage === "weigh1" ? true : i < idx) || (i === 0 && ready());
      $("#bsteps", host).innerHTML = STAGES.map(([id, t], i) => `<span class="bstep ${done(i) ? "done" : ""}">${done(i) ? "✓" : String.fromCharCode(65 + i)} ${t}</span>`).join("");
    }
    function drawShelf() {
      shelf.innerHTML = "";
      ITEMS.forEach((it) => { if (placed.has(it.id)) return; const ok = !(it.needs || []).some((d) => !placed.has(d)); shelf.append(el(`<button class="shelf-item ${it.kind} ${ok ? "" : "locked"}" data-id="${it.id}" title="${ok ? "Drag onto the bench or press Enter to place" : "Needs: " + it.needs.map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}"><svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">${icon(it.id)}</svg><span>${esc(it.name)}</span></button>`)); });
      steps(); act.disabled = !ready() || stage === "immerse" || busy; const L = (run && stage !== "setup" ? run.set : six()) ? LABEL6 : LABEL1; act.textContent = busy ? "Working…" : L[stage] || "Next";
      // the way of working can only be changed between runs
      $$('input[name="osm-mode"]', host).forEach((r) => { r.disabled = !(stage === "setup" || stage === "weigh1"); });
      if (ready() && stage === "setup") { say(six() ? "Everything is on the bench. Cut six chips from the potato with the chip cutter." : "Everything is on the bench. Cut a potato chip with the chip cutter."); readout.textContent = six() ? "Apparatus assembled. Choose the immersion time, then work through the steps: one chip goes into each of the six tubes." : "Apparatus assembled. Choose the tube and immersion time, then work through the steps."; }
    }
    function place(id) {
      const it = ITEMS.find((x) => x.id === id); if (!it || placed.has(id)) return false;
      if ((it.needs || []).some((d) => !placed.has(d))) { say(`First you need: ${it.needs.filter((d) => !placed.has(d)).map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}.`); return false; }
      placed.add(id); $("#" + it.zone, svg).setAttribute("hidden", ""); const g = $("#g-" + id, svg); g.removeAttribute("hidden"); g.classList.add("pop");
      const hints = { tile: "Potato on the tile. Add the cutting tools.", tools: "Potato chip cutter (the handbook method: constant cross-section, little waste) and a scalpel or small knife. A cork borer of one size is an acceptable alternative.", ruler: "Ruler ready for trimming every chip to the same length.", balance: "Balance reading to 0.01 g.", beakers: "Six boiling tubes, labelled 0.0 to 1.0 mol dm⁻³: 20 cm³ of each, made by diluting 1.0 mol dm⁻³ sucrose with distilled water, in a water bath at 30 °C. Check with a thermometer that every tube has reached 30 °C.", towel: "Paper towels for blotting.", timer: "Timer ready." };
      say(hints[id]); drawShelf(); return true;
    }
    // Drag from shelf (same mechanics as RP1)
    let drag = null, ghost = null;
    shelf.addEventListener("pointerdown", (e) => { const b = e.target.closest(".shelf-item"); if (!b || b.classList.contains("locked")) return; drag = b; ghost = b.cloneNode(true); ghost.classList.add("ghost"); document.body.append(ghost); b.setPointerCapture(e.pointerId); move(e); });
    const zoneAt = (x, y) => { const it = drag && ITEMS.find((i) => i.id === drag.dataset.id); if (!it) return null; const r = $("#" + it.zone, svg).getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? it.zone : null; };
    function move(e) { if (!ghost) return; ghost.style.left = e.clientX - 28 + "px"; ghost.style.top = e.clientY - 28 + "px"; const z = zoneAt(e.clientX, e.clientY); $$(".zone", svg).forEach((zz) => zz.classList.toggle("over", zz.id === z)); }
    shelf.addEventListener("pointermove", move);
    const end = (e) => { if (!drag) return; const z = zoneAt(e.clientX, e.clientY); const it = ITEMS.find((i) => i.id === drag.dataset.id); if (z === it.zone) place(it.id); $$(".zone", svg).forEach((zz) => zz.classList.remove("over")); drag = null; if (ghost) { ghost.remove(); ghost = null; } };
    shelf.addEventListener("pointerup", end); shelf.addEventListener("pointercancel", end);
    shelf.addEventListener("click", (e) => { const b = e.target.closest(".shelf-item"); if (b && !b.classList.contains("locked")) place(b.dataset.id); });
    shelf.addEventListener("keydown", (e) => { const b = e.target.closest(".shelf-item"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); place(b.dataset.id); } });

    const balance = (v) => { $("#balr", svg).textContent = v === null ? "0.00 g" : v.toFixed(2) + " g"; };
    const timer = (sec) => { $("#timerr", svg).textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`; };
    const masses = (key) => run.chips.map((c) => `${c.C.toFixed(1)}: ${c[key].toFixed(2)} g`).join("; ");

    const begin = () => { busy = true; drawShelf(); }; const finish = () => { busy = false; };
    act.addEventListener("click", () => {
      if (act.disabled || busy) return;
      if (stage === "setup") { // cut
        run = six() ? { set: true } : { set: false };
        const b = $("#borer", svg); b.style.transition = reduce ? "none" : "transform .6s ease"; b.style.transform = "translate(-10px,120px) rotate(90deg)"; begin(); setTimeout(() => { b.style.transform = ""; moveCyl(...POS.tile); say(run.set ? "Six chips cut with the chip cutter: the same cross-sectional area every time. Any peel removed." : "A chip cut with the chip cutter: the same cross-sectional area every time. Any peel removed."); stage = "cut"; finish(); drawShelf(); }, reduce ? 0 : 700);
      } else if (stage === "cut") { // trim with ruler
        moveCyl(...POS.ruler); const s = $("#scalpel", svg); begin(); setTimeout(() => { s.style.transition = reduce ? "none" : "transform .4s ease"; s.style.transform = "translate(230px,130px)"; setTimeout(() => { s.style.transform = ""; say(run.set ? "All six trimmed against the ruler: every chip the same length, so the same surface area." : "Trimmed against the ruler on the tile: every chip the same length, so the same surface area."); stage = "trim"; finish(); drawShelf(); }, reduce ? 0 : 500); }, reduce ? 0 : 900);
      } else if (stage === "trim") { // initial mass
        run.minutes = +$("#mins", host).value;
        if (run.set) run.chips = B.labModels.osmosisConcs.map((C) => ({ C, m0: B.labModels.osmosisMass() })); else { run.m0 = B.labModels.osmosisMass(); run.C = conc(); }
        moveCyl(...POS.towel); begin(); setTimeout(() => { say(run.set ? "Each chip blotted dry with a paper towel (rolled gently, ends dabbed, not squeezed), then weighed on its own." : "Chip blotted dry with a paper towel (rolled gently, ends dabbed, not squeezed) before the first weighing."); moveCyl(...POS.balance); setTimeout(() => { balance(run.set ? run.chips[5].m0 : run.m0); if (run.set) { say("Six chips weighed. Record each initial mass against its tube, then immerse them."); readout.textContent = `Initial masses (blotted dry), by tube in mol dm⁻³: ${masses("m0")}.`; } else { say(`Blotted and weighed: initial mass ${run.m0.toFixed(2)} g. Record it, then immerse the chip.`); readout.textContent = `Initial mass of this chip (blotted dry): ${run.m0.toFixed(2)} g.`; } stage = "weigh0"; finish(); drawShelf(); }, reduce ? 0 : 1000); }, reduce ? 0 : 900);
      } else if (stage === "weigh0") { // immerse + timer
        stage = "immerse"; drawShelf(); highlightBeaker(); balance(null);
        if (run.set) { cyl.setAttribute("hidden", ""); $("#chips6", svg).removeAttribute("hidden"); } else moveCyl(beakerX(+$("#conc", host).value) - 8, 300);
        const total = run.minutes * 60; const t0 = performance.now(); const speed = () => ($("#fast", host).checked ? 600 : 60);
        say(run.set ? `One chip in each tube, all at the same time. Timer running for ${run.minutes} minutes.` : `Chip in ${run.C.toFixed(1)} mol dm⁻³ sucrose. Timer running for ${run.minutes} minutes.`);
        const tick = (now) => { const s = Math.min(total, (Math.max(0, now - t0) / 1000) * speed()); timer(s); $("#clock", svg).textContent = `${Math.floor(s / 60)} min`; if (s < total) raf = requestAnimationFrame(tick); else { stage = "remove"; highlightBeaker(); say(run.set ? "Time is up. Remove all six chips." : "Time is up. Remove the chip."); drawShelf(); } };
        raf = requestAnimationFrame(tick);
      } else if (stage === "remove") { // remove and blot (or not)
        const blot = run.set ? true : $("#blot", host).checked; run.blotted = blot;
        if (run.set) run.chips.forEach((c) => { const re = B.labModels.osmosisRun(c.C, run.minutes, true, true, c.m0); c.m1 = re.m1; c.pctTrue = re.pctTrue; });
        else { const re = B.labModels.osmosisRun(run.C, run.minutes, blot, true, run.m0); run.m1 = re.m1; run.pctTrue = re.pctTrue; }
        $("#chips6", svg).setAttribute("hidden", ""); moveCyl(...POS.towel); $("#drips", svg).style.opacity = 1; begin();
        if (blot) { setTimeout(() => { const w = $("#wet", svg); w.style.transition = reduce ? "none" : "opacity .6s"; w.style.opacity = 1; $("#drips", svg).style.opacity = 0; say(run.set ? "All six blotted in the same way: rolled on a paper towel and each end dabbed dry, without squeezing." : "Blotted: rolled on a paper towel until it no longer wets the towel and each end dabbed dry, without squeezing."); stage = "blot"; finish(); drawShelf(); }, reduce ? 0 : 1000); }
        else { setTimeout(() => { say("Not blotted: surface liquid will be weighed with the chip (a systematic error)."); stage = "blot"; finish(); drawShelf(); }, reduce ? 0 : 900); }
      } else if (stage === "blot") { // final mass
        moveCyl(...POS.balance); begin(); setTimeout(() => {
          if (run.set) { balance(run.chips[5].m1); say("Six chips weighed again. Record each final mass, then calculate the changes in the Calculate tab."); readout.textContent = `Final masses after ${run.minutes} min, by tube in mol dm⁻³: ${masses("m1")}. Six rows added to the table below. Run two more sets for three chips per concentration.`; stage = "weigh1"; finish(); drawShelf(); run.chips.forEach((c) => onRun({ C: c.C, minutes: run.minutes, m0: c.m0, m1: c.m1, blotted: true, pctTrue: c.pctTrue })); return; }
          balance(run.m1); const d = run.m1 - run.m0; say(`Final mass ${run.m1.toFixed(2)} g (${d >= 0 ? "+" : ""}${d.toFixed(2)} g). Record it and calculate the percentage change in the Calculate tab.`); readout.textContent = `Chip: initial ${run.m0.toFixed(2)} g, final ${run.m1.toFixed(2)} g in ${run.C.toFixed(1)} mol dm⁻³ for ${run.minutes} min${run.blotted ? "" : ", not blotted"}. Result added to the table below. Press Next chip to repeat (three per concentration for a mean).`; stage = "weigh1"; finish(); drawShelf(); onRun({ C: run.C, minutes: run.minutes, m0: run.m0, m1: run.m1, blotted: run.blotted, pctTrue: run.pctTrue }); }, reduce ? 0 : 1000);
      } else if (stage === "weigh1") { // next chip or set
        cyl.setAttribute("hidden", ""); cyl.style.transition = "none"; cyl.style.transform = ""; balance(null); timer(0); $("#clock", svg).textContent = "0 min"; $("#wet", svg).style.opacity = 0; $("#drips", svg).style.opacity = 0; stage = "setup"; run = null; drawShelf(); say(six() ? "Fresh chips from the same potato: cut six, trim, weigh." : "Fresh chip from the same potato: cut, trim, weigh.");
      }
    });
    $("#resetb", host).addEventListener("click", () => { if (raf) cancelAnimationFrame(raf); placed.clear(); stage = "setup"; run = null; busy = false; ITEMS.forEach((it) => { $("#" + it.zone, svg).removeAttribute("hidden"); $("#g-" + it.id, svg).setAttribute("hidden", ""); }); cyl.setAttribute("hidden", ""); cyl.style.transform = ""; $("#chips6", svg).setAttribute("hidden", ""); balance(null); timer(0); $("#clock", svg).textContent = "0 min"; $("#wet", svg).style.opacity = 0; say("Bench cleared."); readout.textContent = "Set up the apparatus again for the next run."; drawShelf(); });
    setMode();
    drawShelf(); say("Drag the white tile and potato onto the bench to begin.");
    B.views.benchOsmosis.place = place; B.views.benchOsmosis.stage = () => stage; // exposed for tests
  };
})(window.BIO);
