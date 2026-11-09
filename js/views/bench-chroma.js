// Animated virtual bench for RP3 (paper chromatography of leaf pigments). Students assemble the apparatus from the
// shelf (drag, click or Enter), choose a leaf and a solvent, draw the origin, crush a leaf disc onto it, add solvent, hang the
// paper, watch the solvent front climb and the bands separate, stop the run, mark the front and measure. Several
// method decisions can deliberately be made wrongly (ink origin, sample below the solvent level, paper touching the
// tube, measuring from the wrong reference point, marking the front late); the consequences appear in the
// chromatogram and in the measurements. Band positions come from B.chromaModel (data/content/_variation-art.js):
// an illustrative model of pigment Rf ranges, NOT measured data; Rf values depend on paper, solvent and conditions.
window.BIO = window.BIO || {};
(function (B) {
  const { el, $, $$, esc } = B.util;
  const M = () => B.chromaModel, ART = () => B.variationArt;
  const ITEMS = [
    { id: "tube", name: "Boiling tube + rack", zone: "ztube", kind: "apparatus" },
    { id: "solvent", name: "Solvent + 10 cm³ measuring cylinder", zone: "zsolvent", kind: "apparatus" },
    { id: "paper", name: "Chromatography paper", zone: "zpaper", kind: "apparatus" },
    { id: "bung", name: "Bung + drawing pin", zone: "zbung", kind: "apparatus", needs: ["tube"] },
    { id: "leaves", name: "Leaf samples", zone: "zleaves", kind: "apparatus" },
    { id: "grind", name: "Cork borer + tile", zone: "zgrind", kind: "apparatus", needs: ["leaves"] },
    { id: "capillary", name: "Glass rod", zone: "zcap", kind: "apparatus" },
    { id: "pencil", name: "Pencil + ruler", zone: "zpencil", kind: "apparatus" },
  ];
  function icon(id) {
    switch (id) {
      case "tube": return `<path d="M22 6h16v38a8 8 0 0 1-16 0z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect x="8" y="48" width="44" height="6" fill="#8c6f4e"/>`;
      case "solvent": return `<path d="M18 10h24v8l6 30H12l6-30z" fill="#fff7e0" stroke="#9c7b3a" stroke-width="2"/><rect x="16" y="30" width="28" height="12" fill="#f2d98a"/><text x="30" y="40" font-size="8" text-anchor="middle" fill="#5a4631">solv</text>`;
      case "paper": return `<rect x="22" y="6" width="16" height="48" fill="#fbf8ef" stroke="#c9c2b0" stroke-width="2"/><line x1="22" y1="44" x2="38" y2="44" stroke="#444"/>`;
      case "bung": return `<rect x="14" y="20" width="32" height="20" rx="5" fill="#8c6f4e" stroke="#5a4631" stroke-width="2"/><path d="M30 40v8" stroke="#444" stroke-width="2"/>`;
      case "leaves": return `<path d="M12 46C12 26 30 12 50 14c2 20-12 34-38 32z" fill="#4f9b4a" stroke="#2f7d3a" stroke-width="2"/><path d="M14 44L46 16" stroke="#2f7d3a"/>`;
      case "grind": return `<rect x="6" y="38" width="48" height="14" rx="2" fill="#fff" stroke="#8a97a3" stroke-width="2"/><rect x="24" y="8" width="12" height="30" rx="2" fill="#c9a24a" stroke="#8c6f4e" stroke-width="1.5"/><rect x="22" y="6" width="16" height="6" rx="2" fill="#8c6f4e"/>`;
      case "capillary": return `<line x1="14" y1="52" x2="46" y2="8" stroke="#b9c9d6" stroke-width="5" stroke-linecap="round"/><line x1="14" y1="52" x2="46" y2="8" stroke="#eef4f8" stroke-width="2" stroke-linecap="round"/>`;
      case "pencil": return `<rect x="6" y="26" width="40" height="8" fill="#f3c24f" stroke="#9c7b3a" stroke-width="1.5"/><path d="M46 26l8 4-8 4z" fill="#333"/><rect x="6" y="40" width="48" height="8" fill="#f3e6b8" stroke="#9c7b3a"/>`;
    }
    return "";
  }
  const STAGES = [["setup", "Apparatus assembled"], ["origin", "Origin line drawn"], ["spot", "Leaf disc crushed onto the origin"], ["solvent", "Solvent added"], ["hang", "Paper placed in the tube"], ["run", "Solvent front rising"], ["mark", "Paper removed, front marked"], ["measure", "Distances measured, Rf calculated"]];
  const LABEL = { setup: "Draw the origin line", origin: "Cut a leaf disc and crush it onto the origin", spot: "Add solvent to the tube", solvent: "Hang the paper and fit the bung", hang: "Start the run", run: "Remove the paper", mark: "Measure with the ruler", measure: "Next chromatogram" };

  B.views.benchChroma = function (host, n, onRun) {
    const leaves = Object.entries(M().LEAVES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("");
    // Only propanone : petroleum ether 1 : 9 is the handbook solvent; any other is labelled as an extension.
    const solvents = Object.entries(M().SOLVENTS).map(([k, v]) => `<option value="${k}">${esc(v.label)}${k === "nonpolar" ? " (handbook solvent)" : " (extension: not the handbook solvent)"}</option>`).join("");
    host.innerHTML = `
      <div class="bench-wrap">
        <div class="bench-steps" id="bsteps"></div>
        <div class="bench-shelf" id="shelf" aria-label="Apparatus shelf" data-empty="Everything is on the bench. Make your method choices on the right, then work through the steps with the blue button."></div>
        <svg class="bench-svg" id="bench" viewBox="0 0 900 430" role="img" aria-label="Laboratory bench for the chromatography practical">
          <rect x="0" y="380" width="900" height="50" fill="#d8cfc2"/><rect x="0" y="376" width="900" height="6" fill="#bfb3a3"/>
          <g id="zleaves" class="zone" data-zone="zleaves"><rect x="30" y="150" width="150" height="90" rx="8" class="zone-rect"/><text x="105" y="200" class="zone-label">leaf samples</text></g>
          <g id="g-leaves" hidden><path id="leaf" d="M50 220C50 180 90 150 150 156c6 40-24 72-100 64z" fill="#4f9b4a" stroke="#2f7d3a" stroke-width="2"/><path d="M54 218L146 160" stroke="#2f7d3a"/></g>
          <g id="zgrind" class="zone" data-zone="zgrind"><rect x="30" y="250" width="150" height="126" rx="8" class="zone-rect"/><text x="105" y="318" class="zone-label">cork borer + tile</text></g>
          <g id="g-grind" hidden><rect x="40" y="340" width="130" height="34" rx="4" fill="#fff" stroke="#8a97a3" stroke-width="2"/><circle id="extract" cx="80" cy="334" r="7" fill="#2f7d3a" opacity="0"/><g id="pestle"><rect x="122" y="262" width="20" height="62" rx="3" fill="#c9a24a" stroke="#8c6f4e" stroke-width="1.5"/><rect x="118" y="256" width="28" height="10" rx="3" fill="#8c6f4e"/></g></g>
          <g id="zcap" class="zone" data-zone="zcap"><rect x="195" y="150" width="110" height="90" rx="8" class="zone-rect"/><text x="250" y="200" class="zone-label">glass rod</text></g>
          <g id="g-capillary" hidden><g id="cap"><line x1="215" y1="232" x2="290" y2="160" stroke="#b9c9d6" stroke-width="7" stroke-linecap="round"/><line x1="215" y1="232" x2="290" y2="160" stroke="#eef4f8" stroke-width="2.5" stroke-linecap="round"/><circle id="capdrop" cx="217" cy="230" r="5" fill="#2f7d3a" opacity="0"/></g></g>
          <g id="zpencil" class="zone" data-zone="zpencil"><rect x="195" y="250" width="110" height="126" rx="8" class="zone-rect"/><text x="250" y="318" class="zone-label">pencil + ruler</text></g>
          <g id="g-pencil" hidden><rect x="205" y="356" width="90" height="12" fill="#f3e6b8" stroke="#9c7b3a"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<line x1="${210 + i * 10}" y1="356" x2="${210 + i * 10}" y2="${i % 2 ? 360 : 364}" stroke="#5a4631"/>`).join("")}<g id="pen"><rect x="214" y="318" width="70" height="10" fill="#f3c24f" stroke="#9c7b3a"/><path d="M284 318l12 5-12 5z" fill="#333"/></g></g>
          <g id="zpaper" class="zone" data-zone="zpaper"><rect x="320" y="150" width="130" height="226" rx="8" class="zone-rect"/><text x="385" y="268" class="zone-label">paper strip</text></g>
          <g id="g-paper" hidden><g id="strip"><rect x="360" y="160" width="50" height="210" fill="#fbf8ef" stroke="#c9c2b0" stroke-width="1.5"/><rect id="wetpaper" x="360" y="370" width="50" height="0" fill="#e9f2f7" opacity=".8"/><g id="bands"></g><line id="origin" x1="360" y1="337.7" x2="410" y2="337.7" stroke="#444" stroke-width="1.5" opacity="0"/><circle id="spot" cx="385" cy="337.7" r="0" fill="#2f7d3a"/><line id="frontline" x1="358" y1="337.7" x2="412" y2="337.7" stroke="#444" stroke-width="1.5" stroke-dasharray="3 2" opacity="0"/></g></g>
          <g id="ztube" class="zone" data-zone="ztube"><rect x="470" y="110" width="160" height="266" rx="8" class="zone-rect"/><text x="550" y="248" class="zone-label">boiling tube in rack</text></g>
          <g id="g-tube" hidden><rect x="480" y="356" width="140" height="20" fill="#8c6f4e" stroke="#5a4631"/><path d="M515 130v200a35 35 0 0 0 70 0V130" fill="#f4f9ff" fill-opacity=".6" stroke="#476a85" stroke-width="3"/><rect id="solv" x="517" y="330" width="66" height="0" fill="#f2d98a" opacity=".8"/><path d="M517 330v2a33 33 0 0 0 66 0v-2" fill="#f2d98a" opacity=".8" id="solvbot" hidden/></g>
          <g id="zbung" class="zone" data-zone="zbung"><rect x="470" y="40" width="160" height="64" rx="8" class="zone-rect"/><text x="550" y="76" class="zone-label">bung</text></g>
          <g id="g-bung" hidden><rect id="bungr" x="505" y="112" width="90" height="26" rx="6" fill="#8c6f4e" stroke="#5a4631" stroke-width="2"/></g>
          <g id="zsolvent" class="zone" data-zone="zsolvent"><rect x="650" y="150" width="230" height="226" rx="8" class="zone-rect"/><text x="765" y="268" class="zone-label">solvent bottle (fume cupboard)</text></g>
          <g id="g-solvent" hidden><rect x="660" y="160" width="210" height="216" rx="6" fill="#eef4f7" stroke="#8aa9bd" stroke-dasharray="6 4"/><text x="765" y="180" font-size="11" text-anchor="middle" fill="#476a85">fume cupboard</text><path d="M740 230h50v12l12 110H728l12-110z" fill="#fff7e0" stroke="#9c7b3a" stroke-width="2"/><rect x="736" y="290" width="58" height="50" fill="#f2d98a"/><text x="765" y="322" font-size="10" text-anchor="middle" fill="#5a4631">solvent</text><text x="765" y="366" font-size="10" text-anchor="middle" fill="#933">⚠ flammable · irritant</text></g>
          <text id="msg" x="450" y="30" font-size="15" text-anchor="middle" fill="#1d3a52" font-weight="600"></text>
          <text id="clock" x="880" y="30" font-size="20" text-anchor="end" fill="#1d3a52" font-family="ui-monospace, monospace" font-weight="700">0 min</text>
          <text id="frontread" x="330" y="150" font-size="11" text-anchor="start" fill="#1d3a52"></text>
        </svg>
        <div class="bench-controls">
          <label>Leaf (run leaf A, then leaf B, in the same solvent): <select id="leafsel">${leaves}</select></label>
          <label>Solvent: <select id="solvsel">${solvents}</select></label>
          <details class="small"><summary>Method decisions (choose carefully: wrong choices have consequences)</summary>
            <label class="small">Draw the origin line with <select id="marker"><option value="pencil">pencil</option><option value="ink">ball-point pen (ink)</option></select></label>
            <label class="small">Solvent depth: <select id="depth"><option value="below">below the origin line (correct)</option><option value="above">above the origin line</option></select></label>
            <label class="small">Hang the paper <select id="hang"><option value="straight">straight, clear of the sides</option><option value="touching">leaning against the side of the tube</option></select></label>
            <label class="small">Measure distances from <select id="refpt"><option value="origin">the origin line (correct)</option><option value="bottom">the bottom edge of the paper</option></select></label>
            <label class="small"><input type="checkbox" id="markfront" checked> mark the solvent front in pencil immediately on removing the paper</label>
          </details>
          <div class="row"><button class="btn primary" id="act" disabled>Draw the origin line</button><label class="small"><input type="checkbox" id="fast" checked> fast-forward (40 min in a few seconds)</label><button class="btn" id="resetb">Reset bench</button></div>
          <div class="readout" id="readout">Set up the apparatus: drag or click each item on the shelf.</div>
        </div>
      </div>`;

    const svg = $("#bench", host), shelf = $("#shelf", host), msg = $("#msg", host), readout = $("#readout", host), act = $("#act", host);
    const placed = new Set(); let stage = "setup", raf = null, run = null, seedCounter = Math.floor(Math.random() * 1e6);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
    const say = (t) => { msg.textContent = t; };
    const ready = () => ITEMS.every((it) => placed.has(it.id));
    const PX_PER_MM = 210 / 130, STRIP_BOTTOM = 370, ORIGIN = 20; const yMm = (mm) => STRIP_BOTTOM - mm * PX_PER_MM; // paper: 130 mm tall, origin 2 cm (handbook)
    function steps() {
      const idx = STAGES.findIndex((s) => s[0] === stage); const done = (i) => i < idx || (i === 0 && ready());
      $("#bsteps", host).innerHTML = STAGES.map(([id, t], i) => `<span class="bstep ${done(i) ? "done" : ""}">${done(i) ? "✓" : String.fromCharCode(65 + i)} ${t}</span>`).join("");
    }
    function drawShelf() {
      shelf.innerHTML = "";
      ITEMS.forEach((it) => { if (placed.has(it.id)) return; const ok = !(it.needs || []).some((d) => !placed.has(d)); shelf.append(el(`<button class="shelf-item ${it.kind} ${ok ? "" : "locked"}" data-id="${it.id}" title="${ok ? "Drag onto the bench or press Enter" : "Needs: " + it.needs.join(", ")}" aria-label="${esc(it.name)}"><svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">${icon(it.id)}</svg><span>${esc(it.name)}</span></button>`)); });
      steps(); act.disabled = !ready() || (stage === "run" && !(run && run.canRemove)); act.textContent = LABEL[stage] || "Next";
      if (ready() && stage === "setup") { say("Everything is on the bench. Rule a pencil origin line 2 cm from the bottom of the paper."); readout.textContent = "Apparatus assembled. Choose the leaf, the solvent and your method decisions, then work through the steps."; }
    }
    function place(id) {
      const it = ITEMS.find((x) => x.id === id); if (!it || placed.has(id)) return false;
      if ((it.needs || []).some((d) => !placed.has(d))) { say(`First you need: ${it.needs.filter((d) => !placed.has(d)).map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}.`); return false; }
      placed.add(id); $("#" + it.zone, svg).setAttribute("hidden", ""); const g = $("#g-" + id, svg); g.removeAttribute("hidden"); g.classList.add("pop");
      const hints = { tube: "Boiling tube in its rack, labelled for leaf A or leaf B.", solvent: "Propanone : petroleum ether 1 : 9 in a stoppered bottle. Highly flammable; propanone irritates eyes. No naked flames, good ventilation, eye protection. 3 cm³ will be measured with the cylinder.", paper: "A pre-cut strip of chromatography paper that fits the boiling tube; handle it by the edges so finger grease does not spoil the run.", bung: "The paper is pinned to the bung with a drawing pin; the bung keeps the tube saturated with solvent vapour.", leaves: "Leaf samples ready.", grind: "Cork borer and tile for cutting a leaf disc, avoiding the veins and midrib.", capillary: "The end of a glass rod crushes the leaf disc into the paper, leaving a pigment stain on the origin.", pencil: "Pencil for the origin, the front and drawing round the spots (graphite does not dissolve); ruler with millimetre markings." };
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

    const choice = (id) => $("#" + id, host).value;
    const strip = $("#strip", svg);
    const drawBands = (frontMm) => {
      const g = $("#bands", svg); if (!run || run.dipped) { g.innerHTML = ""; return; }
      g.innerHTML = run.res.bands.map((b) => { const d = ORIGIN + b.rf * frontMm; const h = Math.max(3, 4 + 8 * b.amount); const smear = run.errors.touching ? 1.9 : 1; return `<rect x="${365 + (run.errors.touching ? 3 : 0)}" y="${yMm(d) - (h * smear) / 2}" width="40" height="${h * smear}" rx="2" fill="${b.colour}" opacity="${(0.35 + 0.65 * b.amount) / (run.errors.touching ? 1.6 : 1)}"${run.errors.touching ? ` transform="skewY(-6) translate(0 ${yMm(d) * 0.105})"` : ""}/>`; }).join("");
      $("#wetpaper", svg).setAttribute("y", yMm(ORIGIN + frontMm)); $("#wetpaper", svg).setAttribute("height", (ORIGIN + frontMm) * PX_PER_MM);
    };

    act.addEventListener("click", () => {
      if (act.disabled) return;
      if (stage === "setup") { // origin
        const ink = choice("marker") === "ink"; const o = $("#origin", svg); o.setAttribute("stroke", ink ? "#2c4fa3" : "#444"); o.style.opacity = 1;
        const pen = $("#pen", svg); pen.style.transition = reduce ? "none" : "transform .6s ease"; pen.style.transform = "translate(120px,20px)"; setTimeout(() => { pen.style.transform = ""; }, reduce ? 0 : 700);
        say(ink ? "Origin line drawn in INK, 2 cm from the bottom. (Ink is a mixture of dyes that dissolve in the solvent…)" : "Origin line ruled in pencil, 2 cm from the bottom: graphite does not dissolve in the solvent."); stage = "origin"; drawShelf();
      } else if (stage === "origin") { // cut a leaf disc with the cork borer, crush it onto the origin with the glass rod
        run = { leaf: choice("leafsel"), solvent: choice("solvsel"), errors: { inkOrigin: choice("marker") === "ink", above: choice("depth") === "above", touching: choice("hang") === "touching", wrongRef: choice("refpt") === "bottom", lateMark: !$("#markfront", host).checked }, seed: ++seedCounter, canRemove: false };
        run.res = M().run({ leaf: run.leaf, solvent: run.solvent, seed: run.seed, errors: { inkOrigin: run.errors.inkOrigin } });
        const p = $("#pestle", svg); p.style.transition = reduce ? "none" : "transform .5s ease"; p.style.transform = "translate(-50px,6px)"; $("#extract", svg).style.opacity = 1;
        setTimeout(() => { p.style.transform = ""; const cap = $("#cap", svg); cap.style.transition = reduce ? "none" : "transform .7s ease"; cap.style.transform = "translate(150px,110px)"; $("#extract", svg).style.opacity = 0; $("#capdrop", svg).style.opacity = 1;
          let k = 0; const dab = () => { k++; $("#spot", svg).setAttribute("r", Math.min(5, 2 + k * 0.5)); $("#spot", svg).setAttribute("opacity", Math.min(1, 0.3 + k * 0.12)); if (k < 6) setTimeout(dab, reduce ? 0 : 220); else { cap.style.transform = ""; $("#capdrop", svg).style.opacity = 0; say("Leaf disc placed on the centre of the origin and crushed into the paper with the glass rod: a concentrated pigment stain."); stage = "spot"; drawShelf(); } }; dab(); }, reduce ? 0 : 600);
      } else if (stage === "spot") { // solvent
        const depthMm = run.errors.above ? 28 : 10; const s = $("#solv", svg); s.setAttribute("y", 330 - depthMm * PX_PER_MM); s.setAttribute("height", depthMm * PX_PER_MM); $("#solvbot", svg).removeAttribute("hidden");
        say(run.errors.above ? `Too much solvent: it stands about ${depthMm} mm deep, ABOVE the level of the origin line (20 mm).` : `3 cm³ of solvent measured with the cylinder: about ${depthMm} mm deep, below the origin line (20 mm).`); stage = "solvent"; drawShelf();
      } else if (stage === "solvent") { // hang paper + bung
        strip.style.transition = reduce ? "none" : "transform .9s ease"; strip.style.transform = run.errors.touching ? "translate(185px,-30px) rotate(7deg)" : "translate(165px,-30px)";
        setTimeout(() => { const b = $("#bungr", svg); b.style.transition = reduce ? "none" : "transform .4s ease"; b.style.transform = "translate(0,-2px)"; say(run.errors.touching ? "Paper pinned to the bung and lowered in, but leaning against the glass." : "Paper pinned to the bung and lowered in: hanging straight, clear of the sides, bottom edge in the solvent, origin above it. Do not move the tube now."); stage = "hang"; drawShelf(); }, reduce ? 0 : 950);
      } else if (stage === "hang") { // run
        stage = "run"; run.canRemove = false; drawShelf();
        if (run.errors.above) { run.dipped = true; $("#spot", svg).setAttribute("opacity", 0.15); $("#wetpaper", svg).setAttribute("y", yMm(28)); $("#wetpaper", svg).setAttribute("height", 28 * PX_PER_MM); }
        const t0 = performance.now(); const speed = () => ($("#fast", host).checked ? 480 : 60); const total = 40 * 60;
        say("Solvent rising by capillarity; pigments dissolve and travel at different rates.");
        const tick = (now) => { const s = Math.min(total, ((now - t0) / 1000) * speed()); const min = s / 60; const f = M().frontAt(min, run.res.frontMax); run.frontMm = f; $("#clock", svg).textContent = `${Math.floor(min)} min`; $("#frontread", svg).textContent = `front ${f.toFixed(0)} mm above origin`;
          if (!run.dipped) drawBands(f); else { $("#frontread", svg).textContent = `front ${f.toFixed(0)} mm; spot dissolved into the solvent`; }
          if (f >= 30 && !run.canRemove) { run.canRemove = true; act.disabled = false; say("You may remove the paper whenever you judge the front is far enough up (near the top is best)."); }
          if (s < total) raf = requestAnimationFrame(tick); else { say("The front has almost reached the top of the paper: remove it now."); } };
        raf = requestAnimationFrame(tick);
      } else if (stage === "run") { // remove + mark
        if (raf) cancelAnimationFrame(raf); raf = null; strip.style.transform = "";
        const f = run.frontMm; run.frontTrue = +f.toFixed(0);
        if (run.errors.lateMark) { run.frontMeasured = Math.max(10, run.frontTrue - 8 - Math.round(Math.random() * 6)); $("#frontline", svg).style.opacity = 0; $("#wetpaper", svg).setAttribute("height", 0); say(`Paper removed and left to dry. By the time you look for the solvent front it has evaporated and is hard to see; you estimate about ${run.frontMeasured} mm.`); }
        else { run.frontMeasured = run.frontTrue; const fl = $("#frontline", svg); fl.setAttribute("y1", yMm(ORIGIN + f)); fl.setAttribute("y2", yMm(ORIGIN + f)); fl.style.opacity = 1; say(`Paper removed; solvent front marked at once in pencil (${run.frontTrue} mm above the origin). Once dry, draw round each spot in pencil: chromatograms fade quickly in light.`); }
        if (run.errors.touching) say(msg.textContent + " The front is uneven where the paper touched the glass, so the distance is uncertain by several millimetres.");
        stage = "mark"; drawShelf();
      } else if (stage === "mark") { // measure
        const off = run.errors.wrongRef ? ORIGIN : 0; const jitter = () => (run.errors.touching ? Math.round((Math.random() - 0.5) * 8) : 0);
        const rows = run.dipped ? [] : run.res.bands.map((b) => { const trueMm = Math.round(b.rf * run.frontTrue); return { key: b.key, name: b.name, colour: b.colour, artefact: !!b.artefact, trueMm, readMm: Math.max(0, trueMm + off + jitter()), trueRf: M().rf(trueMm, run.frontTrue) }; });
        const out = { leaf: run.leaf, leafLabel: M().LEAVES[run.leaf].label, solvent: run.solvent, solventLabel: M().SOLVENTS[run.solvent].label, seed: run.seed, errors: run.errors, dipped: !!run.dipped, frontTrue: run.frontTrue, frontRead: run.frontMeasured + off, bands: rows, res: run.res };
        readout.textContent = run.dipped ? "Nothing to measure: the pigment stain dissolved into the solvent. Record the error and run again with the solvent below the origin." : `Front ${out.frontRead} mm; ${rows.length} band${rows.length === 1 ? "" : "s"} measured (${run.errors.wrongRef ? "from the bottom edge of the paper" : "from the origin"}). Calculate the Rf values in the Calculate tab.`;
        say(run.dipped ? "No chromatogram: the pigments washed into the solvent." : "Distances recorded in the results table.");
        if (onRun) onRun(out); stage = "measure"; drawShelf();
      } else if (stage === "measure") { // next
        $("#bands", svg).innerHTML = ""; $("#spot", svg).setAttribute("r", 0); $("#origin", svg).style.opacity = 0; $("#frontline", svg).style.opacity = 0; $("#wetpaper", svg).setAttribute("height", 0); $("#solv", svg).setAttribute("height", 0); $("#solvbot", svg).setAttribute("hidden", ""); $("#extract", svg).style.opacity = 0; $("#clock", svg).textContent = "0 min"; $("#frontread", svg).textContent = ""; strip.style.transform = ""; run = null; stage = "setup"; drawShelf(); say("Fresh strip of paper. Draw the origin line.");
      }
    });
    $("#resetb", host).addEventListener("click", () => { if (raf) cancelAnimationFrame(raf); placed.clear(); stage = "setup"; run = null; ITEMS.forEach((it) => { $("#" + it.zone, svg).removeAttribute("hidden"); $("#g-" + it.id, svg).setAttribute("hidden", ""); }); $("#bands", svg).innerHTML = ""; $("#spot", svg).setAttribute("r", 0); $("#origin", svg).style.opacity = 0; $("#frontline", svg).style.opacity = 0; $("#wetpaper", svg).setAttribute("height", 0); $("#solv", svg).setAttribute("height", 0); strip.style.transform = ""; $("#clock", svg).textContent = "0 min"; $("#frontread", svg).textContent = ""; drawShelf(); say("Drag the apparatus onto the bench to begin."); readout.textContent = "Set up the apparatus: drag or click each item on the shelf."; });
    drawShelf(); say("Drag the boiling tube and rack onto the bench to begin.");
    B.views.benchChroma.place = place; B.views.benchChroma.stage = () => stage; B.views.benchChroma.run = () => run; // exposed for tests
  };
})(window.BIO);
