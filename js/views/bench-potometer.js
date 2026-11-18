// Interactive Potometer Laboratory for RP6 (rate of water uptake by a simple potometer; OxfordAQA 9610 Practical
// Handbook exemplar, pp. 73–76). Registers B.labSims.potometer = { sim(host, key), calc(host, key) }, which
// js/views/lab.js calls when B.practicals[6].sim === "potometer". Runs are saved in B.store.get().labRuns[key].
//
// Students put the apparatus on the bench (drag, click or Enter, as in RP1–RP3), choose the handbook steps in order
// (wrong choices are explained), set the meniscus with the syringe and 3-way tap, start the clock and record the
// meniscus every 3 minutes for 12 minutes without stopping it, repeat, and change one condition at a time. Two method
// errors can be made on purpose (air not flushed out; joint not sealed) and the bench can hide a fault (unsealed joint,
// air bubble, tap left open to the syringe) for the student to find with the leak checks, diagnose and fix.
//
// NUMBERS: every reading comes from B.plantModel (data/content/_plant-model.js), an illustrative model, through its
// own options only: potometer() for the rate and readings() for the 3-minute readings, with its seeded `noise`.
//   - room conditions drift slightly between runs (temperature ±0.6 °C, light ±8 %, air movement ±0.03 m s⁻¹);
//   - normal reading error: noise 0.04 cm; readings then rounded to 0.1 cm (the 1 mm divisions of the scale);
//   - unsealed joint: leak = −(45–60 %) of the modelled uptake (air enters at the joint, not through the capillary),
//     plus noise 0.15 cm (air enters in small bursts);
//   - tap open to the syringe: leak = −90 % of the uptake (the shoot draws water from the syringe);
//   - air bubble in the tubing: through `leak`, a steady block of 15–30 % of the uptake (air at the cut end blocks
//     vessels) plus a correlated random-walk change in bubble volume each interval (irregular, can stall or reverse);
//   - the capillary scale is 30 cm long: positions beyond it are recorded as off the scale.
// The meniscus starts 1.0–2.0 cm along the scale after resetting, so the 0-minute reading must be subtracted.
window.BIO = window.BIO || {}; window.BIO.labSims = window.BIO.labSims || {};
(function (B) {
  const { el, $, $$, esc } = B.util;
  const PM = () => B.plantModel;
  const SCALE = 30; // cm of graduated capillary
  const LIGHT = [{ v: 0, label: "Dark (box over the shoot)" }, { v: 150, label: "Bright room light" }, { v: 600, label: "Bench lamp, heat shield" }, { v: 1000, label: "Bright lamp, heat shield" }];
  const WIND = [{ v: 0.1, label: "Still air" }, { v: 1, label: "Fan, low" }, { v: 2, label: "Fan, high" }];
  const HUM = [{ v: 0.5, label: "Open bench (about 50 %)" }, { v: 0.9, label: "Clear bag over the leaves (about 90 %)" }];
  const TEMP = [15, 20, 25, 30];
  const SHOOTS = { A: { area: 0.008, label: "Shoot A (8 leaves, 80 cm²)" }, B: { area: 0.0115, label: "Shoot B (12 leaves, 115 cm²)" } };
  const BASE = { li: 1, wi: 0, hi: 0, temp: 20 };
  const FAULT_NAME = { joint: "unsealed joint", bubble: "air bubble in the tubing", tap: "tap left open to the syringe" };
  const r1 = (x) => Math.round(x * 10) / 10;
  // seeded generator (mulberry32) for drift, start position and hidden faults
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const condLabel = (c) => `${LIGHT[c.li].label.split(",")[0]}; ${WIND[c.wi].label}; ${c.hi ? "plastic bag" : "open"}; ${c.temp} °C`;
  const condKey = (c) => `${c.li}|${c.wi}|${c.hi}|${c.temp}`;
  const modelCond = (c) => ({ light: LIGHT[c.li].v, temp: c.temp, rh: HUM[c.hi].v, wind: c.hi ? 0.05 : WIND[c.wi].v });

  // One run of 12 minutes through the shared plant model. Exported for tests and the Calculate tab.
  function simulateRun({ c, shoot = "A", bore = 1, faults = {}, seed = 1, jointFrac = 0.5, start = null }) {
    const g = rng(seed * 7919 + 13); const u = () => g() * 2 - 1;
    const base = modelCond(c);
    const drift = { ...base, light: base.light * (1 + 0.08 * u()), temp: +(base.temp + 0.6 * u()).toFixed(2), wind: Math.max(0.05, base.wind + 0.03 * u()) };
    const opts = { ...drift, leafArea: SHOOTS[shoot].area, bore };
    const clean = PM().potometer(opts); let leak = 0, noise = 0.04;
    if (faults.joint) { leak -= clean.uptakeMm3min * jointFrac; noise = Math.max(noise, 0.15); }
    if (faults.tap) leak -= clean.uptakeMm3min * 0.9;
    leak = Math.max(leak, -0.97 * clean.uptakeMm3min);
    const R = PM().readings({ ...opts, leak }, { step: 3, total: 12, noise, seed });
    const s0 = r1(1 + g()); if (start === null) start = s0; let off = false;
    let cum = R.points.map((p) => p.cm); // cumulative distance (cm) at each reading, reading error included
    if (faults.bubble) {
      // Air bubble (physically: air at the cut end blocks some xylem vessels, and the trapped bubble expands and
      // contracts as the tension in the column changes). Both effects go through the model's own `leak` option:
      // a steady block of 15–30 % of the uptake, plus a correlated (random-walk) change in bubble volume in each
      // 3-minute interval, which can stall the meniscus or push it backwards. Reading error is kept from readings().
      const gb = rng(seed * 104729 + 7); const U = clean.uptakeMm3min; const block = 0.15 + 0.15 * gb(); let b = 0, sum = 0;
      const err = R.points.map((p) => p.cm - R.rate * p.t);
      cum = [0]; for (let i = 1; i < R.points.length; i++) { b = 0.5 * b + 1.1 * (gb() * 2 - 1); const L = Math.max(leak - block * U + b * U, -2.5 * U); sum += 3 * PM().potometer({ ...opts, leak: L }).cmPerMin; cum.push(sum + err[i]); }
    }
    const pts = R.points.map((p, i) => { const pos = r1(start + cum[i]); if (off || pos > SCALE) { off = true; return { t: p.t, pos: null }; } return { t: p.t, pos }; });
    return { pts, start, tempRead: r1(drift.temp), modelRate: clean.cmPerMin, measuredModelRate: R.rate, leak, noise };
  }
  // rate from a run's readings: first and last on-scale reading
  function rateOf(r) {
    const ok = r.pts.filter((p) => p.pos !== null); if (ok.length < 2) return null;
    const a = ok[0], b = ok[ok.length - 1]; const d = r1(b.pos - a.pos); return { d, t: b.t - a.t, rate: d / (b.t - a.t), partial: b.t < 12 };
  }
  const slope = (pts) => { const ok = pts.filter((p) => p.pos !== null); const n = ok.length; const mx = ok.reduce((a, p) => a + p.t, 0) / n, my = ok.reduce((a, p) => a + p.pos, 0) / n; const sxy = ok.reduce((a, p) => a + (p.t - mx) * (p.pos - my), 0), sxx = ok.reduce((a, p) => a + (p.t - mx) ** 2, 0); return { m: sxy / sxx, mx, my }; };
  const irregular = (pts) => { const ok = pts.filter((p) => p.pos !== null); const inc = ok.slice(1).map((p, i) => p.pos - ok[i].pos); if (inc.length < 2) return false; const mean = inc.reduce((a, b) => a + b, 0) / inc.length; return inc.some((x) => x < 0) || Math.max(...inc) - Math.min(...inc) > Math.max(0.4, 0.35 * Math.abs(mean)); };
  const knownFaults = (r) => [r.deliberate && r.deliberate.bubble && "air not flushed out (chosen)", r.deliberate && r.deliberate.joint && "joint not sealed (chosen)", r.hidden && r.revealed && `hidden fault found: ${FAULT_NAME[r.hidden]}`].filter(Boolean);
  const hasFault = (r) => !!(r.faults && (r.faults.joint || r.faults.bubble || r.faults.tap));
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");

  // ---------------- Apparatus shelf ----------------
  const ITEMS = [
    { id: "bowl", name: "Washing-up bowl of water", zone: "zbowl" },
    { id: "shoot", name: "Leafy shoot + secateurs", zone: "zshoot", needs: ["bowl"] },
    { id: "stand", name: "Stand, boss and clamp", zone: "zstand" },
    { id: "pot", name: "Potometer (capillary, scale, 3-way tap, syringe, tubing)", zone: "zpot" },
    { id: "vas", name: "Vaseline", zone: "zvas" },
    { id: "towel", name: "Paper towels", zone: "ztowel" },
    { id: "watch", name: "Stop watch", zone: "zwatch" },
    { id: "therm", name: "Thermometer", zone: "ztherm" },
    { id: "beaker", name: "100 cm³ beaker", zone: "zbeaker" },
  ];
  function icon(id) {
    switch (id) {
      case "bowl": return `<path d="M6 30h48l-6 20H12z" fill="#cfe6ff" stroke="#476a85" stroke-width="2"/><path d="M8 34h44" stroke="#7fb8e6" stroke-width="2"/>`;
      case "shoot": return `<path d="M30 54V18" stroke="#6b4f2e" stroke-width="3"/><path d="M30 26c-12-12-22-6-24-2 8 6 16 6 24 2zM30 34c12-10 22-6 24-2-8 6-16 6-24 2zM30 18c-6-10 0-14 2-14 2 6 0 10-2 14z" fill="#4f9b4a" stroke="#2f7d3a"/><path d="M40 50l10-8M40 42l10 8" stroke="#b4504f" stroke-width="2.5"/>`;
      case "stand": return `<rect x="8" y="50" width="40" height="6" fill="#6b7d8f"/><rect x="16" y="6" width="4" height="46" fill="#8a97a3"/><rect x="18" y="20" width="30" height="4" fill="#8a97a3"/><rect x="44" y="16" width="8" height="12" rx="2" fill="#5f6f7f"/>`;
      case "pot": return `<rect x="4" y="26" width="52" height="5" rx="2" fill="#cfe6ff" stroke="#476a85"/><rect x="8" y="33" width="46" height="7" fill="#f3e6b8" stroke="#9c7b3a"/><circle cx="8" cy="28" r="5" fill="#e4ebf5" stroke="#1d3a52" stroke-width="1.5"/><rect x="4" y="34" width="8" height="18" rx="2" fill="#f4f9ff" stroke="#476a85"/><path d="M8 23V10" stroke="#476a85" stroke-width="4"/>`;
      case "vas": return `<rect x="16" y="20" width="28" height="30" rx="5" fill="#f2e4a4" stroke="#b89a4c" stroke-width="2"/><rect x="14" y="14" width="32" height="8" rx="3" fill="#c9a24a"/>`;
      case "towel": return `<rect x="10" y="20" width="40" height="8" fill="#fff" stroke="#b9c2ca"/><rect x="10" y="30" width="40" height="8" fill="#fff" stroke="#b9c2ca"/><rect x="10" y="40" width="40" height="8" fill="#fff" stroke="#b9c2ca"/>`;
      case "watch": return `<circle cx="30" cy="34" r="18" fill="#fff" stroke="#476a85" stroke-width="2"/><rect x="26" y="10" width="8" height="6" fill="#476a85"/><path d="M30 34V22M30 34l8 4" stroke="#1d3a52" stroke-width="2"/>`;
      case "therm": return `<rect x="26" y="6" width="8" height="40" rx="4" fill="#fff" stroke="#476a85" stroke-width="2"/><circle cx="30" cy="48" r="7" fill="#d9534f" stroke="#476a85" stroke-width="2"/><rect x="28.5" y="24" width="3" height="22" fill="#d9534f"/>`;
      case "beaker": return `<path d="M14 12h32v38a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect x="16" y="30" width="28" height="22" fill="#cfe6ff"/>`;
    }
    return "";
  }

  // ---------------- Handbook procedure (choose each next step) ----------------
  const PROC = [
    { id: "cut", label: "Cut a large leafy shoot and put its base straight into the bowl of water", why: "The shoot must reach water at once: water in the xylem is under tension, so air is drawn in at a cut made in air." },
    { id: "recut", label: "Under water, cut again about 5 cm above the first cut", why: "Air entered the xylem at the first cut. A second cut under water removes the air-filled base of the stem." },
    { id: "submerge", label: "Submerge the potometer with the 3-way tap open and flush it with the syringe", why: "The potometer and the tubing for the stem must be completely full of water: any air bubble breaks the water column." },
    { id: "tap", label: "Close the 3-way tap to the syringe", why: "With the tap open the shoot would draw water from the syringe, not along the capillary." },
    { id: "trim", label: "Re-cut the stem under water where it is slightly wider than the tubing, keeping the leaves dry", why: "A stem slightly wider than the tubing fits tightly; dry leaves keep the rate of water loss normal." },
    { id: "fit", label: "Push the cut stem firmly into the tubing, under water", why: "Joining under water stops air entering the stem or the tubing." },
    { id: "clamp", label: "Lift the potometer out of the bowl and clamp the shoot to the stand", why: "The shoot is held steady so the joint is not strained." },
    { id: "vaseline", label: "Vaseline the joint between the tubing and the stem", why: "The joint must be airtight, or air enters there instead of through the capillary." },
    { id: "dry", label: "Dry the capillary with a paper towel and check that the meniscus moves towards the plant", why: "Air must enter only at the open end; movement towards the plant shows the shoot is taking up water." },
    { id: "temp", label: "Record the air temperature with the thermometer", why: "Temperature affects the rate, so it is recorded for every run." },
  ];
  const NEEDS = { cut: ["bowl", "shoot"], recut: ["bowl", "shoot"], submerge: ["pot", "bowl"], tap: ["pot"], trim: ["shoot"], fit: ["pot"], clamp: ["stand"], vaseline: ["vas"], dry: ["towel"], temp: ["therm"] };

  // Geometry of the potometer drawing (SVG units)
  const X0 = 850, PXCM = 14.5; const mx = (cm) => X0 - cm * PXCM; // scale: 0 cm near the open end, increasing towards the plant

  function bench(host, onRun, key) {
    const seed0 = (Date.now() % 100000) + 1; let runSeed = seed0;
    const S = { key, placed: new Set(), done: new Set(), mistakes: 0, deliberate: { bubble: false, joint: false }, hidden: null, jointFrac: 0.5, faults: { joint: false, bubble: false, tap: false }, seen: {}, men: null, adjustedKey: null, running: false, lastCond: null, order: [] };
    host.innerHTML = `
      <div class="bench-wrap ix-bench-full bench-pot">
        <div class="bench-steps" id="pbsteps" aria-live="polite"></div>
        <div class="bench-stage"><p class="bench-say" aria-hidden="true"></p>
        <div class="pbench-scroll" style="overflow-x:auto" tabindex="0" aria-label="Bench drawing (scrolls sideways on small screens)">
        <svg class="bench-svg" id="pbench" viewBox="0 0 900 430" style="min-width:560px" role="img" aria-label="Laboratory bench for the potometer practical">
          <rect x="0" y="380" width="900" height="50" fill="#d8cfc2"/><rect x="0" y="376" width="900" height="6" fill="#bfb3a3"/>
          <g id="zbowl" class="zone"><rect x="15" y="252" width="220" height="124" rx="8" class="zone-rect"/><text x="125" y="318" class="zone-label">bowl of water</text></g>
          <g id="g-bowl" hidden><path d="M25 300h200l-14 72H39z" fill="#e6f2fc" stroke="#476a85" stroke-width="2.5"/><path d="M29 316h192l-11 54H40z" fill="#9fd0f2" opacity=".75"/><text x="125" y="294" font-size="13" text-anchor="middle" fill="#1d3a52">washing-up bowl of water</text></g>
          <g id="zshoot" class="zone"><rect x="15" y="40" width="220" height="200" rx="8" class="zone-rect"/><text x="125" y="140" class="zone-label">leafy shoot</text></g>
          <g id="g-shoot" hidden><g id="shootfree"><path d="M125 236V96" stroke="#6b4f2e" stroke-width="6"/>${leaves(125, 96)}</g><g id="secateurs"><g transform="translate(-20 200)"><path d="M200 202C192 194 182 191 175 195C183 198 192 202 200 206Z" fill="#aab4bd" stroke="#5f6f7f" stroke-width="1.2"/><path d="M200 206C192 213 183 215 177 212C185 208 193 204 200 202Z" fill="#7d8a96" stroke="#5f6f7f" stroke-width="1.2"/><path d="M201 204L238 193M201 204L238 216" stroke="#b4504f" stroke-width="7" stroke-linecap="round"/><circle cx="201" cy="204" r="3.2" fill="#3f4a55"/><text x="250" y="209" font-size="12" text-anchor="start" fill="#2e4356" font-weight="600">secateurs</text></g></g><g id="cutpiece" opacity="0"><rect x="119" y="352" width="12" height="20" fill="#6b4f2e"/></g></g>
          <g id="zstand" class="zone"><rect x="245" y="40" width="86" height="336" rx="8" class="zone-rect"/><text x="288" y="210" class="zone-label">stand</text></g>
          <g id="g-stand" hidden><rect x="250" y="362" width="76" height="14" rx="3" fill="#6b7d8f"/><rect x="266" y="60" width="8" height="304" fill="#8a97a3"/><g id="clamparm" opacity=".35"><rect x="270" y="150" width="70" height="7" fill="#8a97a3"/><rect x="336" y="142" width="18" height="22" rx="3" fill="#5f6f7f"/></g></g>
          <g id="zpot" class="zone"><rect x="340" y="200" width="548" height="176" rx="8" class="zone-rect"/><text x="614" y="292" class="zone-label">potometer</text></g>
          <g id="g-pot" hidden>
            <rect x="346" y="196" width="18" height="44" rx="3" fill="#cfe6ff" stroke="#476a85" stroke-width="2"/>
            <path d="M355 240V300H390" fill="none" stroke="#476a85" stroke-width="12"/><path d="M355 240V300H390" fill="none" stroke="#cfe6ff" stroke-width="7"/>
            <rect x="390" y="308" width="20" height="10" fill="#cfe6ff" stroke="#476a85" stroke-width="1.5"/><rect x="386" y="318" width="28" height="48" rx="3" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect id="syrwater" x="389" y="322" width="22" height="26" fill="#cfe6ff"/><g id="plunger"><rect x="396" y="352" width="8" height="24" fill="#8a97a3"/><rect x="390" y="350" width="20" height="4" fill="#5f6f7f"/></g>
            <circle cx="400" cy="300" r="11" fill="#e4ebf5" stroke="#1d3a52" stroke-width="2"/><g id="taph"><rect x="388" y="296" width="24" height="8" rx="2" fill="#1d3a52"/></g>
            <rect x="410" y="295" width="462" height="10" rx="3" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><rect id="water" x="412" y="297.5" width="456" height="5" fill="#7fb8e6"/><line id="menline" x1="868" y1="294" x2="868" y2="306" stroke="#1d3a52" stroke-width="2.5" opacity="0"/>
            <rect x="405" y="310" width="455" height="26" fill="#f3e6b8" stroke="#9c7b3a" stroke-width="1.5"/>
            ${Array.from({ length: SCALE + 1 }, (_, i) => `<line x1="${mx(i)}" y1="310" x2="${mx(i)}" y2="${i % 5 ? 316 : 322}" stroke="#5a4631"/>`).join("")}${[0, 5, 10, 15, 20, 25, 30].map((c) => `<text x="${mx(c)}" y="334" font-size="12" text-anchor="middle" fill="#5a4631">${c}</text>`).join("")}
            <text x="640" y="354" font-size="13" text-anchor="middle" fill="#3f5a6e">scale / cm (meniscus moves towards the plant)</text><text x="872" y="289" font-size="12" text-anchor="end" fill="#3f5a6e">open end</text>
            <g id="drops" opacity="0"><circle cx="862" cy="309" r="3" fill="#7fb8e6"/><circle cx="740" cy="309" r="2.5" fill="#7fb8e6"/></g>
            <g id="airbub" opacity="0"><ellipse cx="372" cy="300" rx="7" ry="3.5" fill="#fff" stroke="#476a85"/></g>
            <g id="jointbub" opacity="0"><circle cx="366" cy="204" r="2.5" fill="#fff" stroke="#476a85"/><circle cx="369" cy="212" r="2" fill="#fff" stroke="#476a85"/></g>
            <rect id="vasring" x="343" y="194" width="24" height="10" rx="2" fill="#f2e4a4" stroke="#b89a4c" opacity="0"/>
          </g>
          <g id="fitted" opacity="0"><path d="M355 200V70" stroke="#6b4f2e" stroke-width="6"/>${leaves(355, 70)}</g>
          <g id="underwater" opacity="0"><rect x="342" y="190" width="544" height="186" rx="8" fill="#7fb8e6" opacity=".22"/><text x="614" y="372" font-size="12" text-anchor="middle" fill="#1d3a52" font-weight="700">under water in the bowl</text></g>
          <g id="zvas" class="zone"><rect x="440" y="40" width="80" height="72" rx="8" class="zone-rect"/><text x="480" y="80" class="zone-label">vaseline</text></g>
          <g id="g-vas" hidden><rect x="466" y="56" width="28" height="36" rx="5" fill="#f2e4a4" stroke="#b89a4c" stroke-width="2"/><rect x="464" y="50" width="32" height="8" rx="3" fill="#c9a24a"/><text x="480" y="106" font-size="12" text-anchor="middle" fill="#3f5a6e">vaseline</text></g>
          <g id="ztowel" class="zone"><rect x="528" y="40" width="80" height="72" rx="8" class="zone-rect"/><text x="568" y="80" class="zone-label">towels</text></g>
          <g id="g-towel" hidden><g id="towelg"><rect x="540" y="56" width="56" height="9" fill="#fff" stroke="#b9c2ca"/><rect x="540" y="67" width="56" height="9" fill="#fff" stroke="#b9c2ca"/><rect x="540" y="78" width="56" height="9" fill="#fff" stroke="#b9c2ca"/></g><text x="568" y="106" font-size="12" text-anchor="middle" fill="#3f5a6e">paper towels</text></g>
          <g id="zwatch" class="zone"><rect x="616" y="40" width="90" height="72" rx="8" class="zone-rect"/><text x="661" y="80" class="zone-label">stop watch</text></g>
          <g id="g-watch" hidden><rect x="624" y="50" width="74" height="40" rx="7" fill="#fff" stroke="#476a85" stroke-width="2"/><rect x="630" y="56" width="62" height="24" fill="#1d3a52"/><text id="pclock" x="661" y="73" font-size="14" text-anchor="middle" fill="#9ef0c0" font-family="ui-monospace, monospace">00:00</text><text x="661" y="106" font-size="12" text-anchor="middle" fill="#3f5a6e">min : s</text></g>
          <g id="ztherm" class="zone"><rect x="709" y="40" width="90" height="72" rx="8" class="zone-rect"/><text x="754" y="80" class="zone-label">thermometer</text></g>
          <g id="g-therm" hidden><rect x="728" y="50" width="8" height="44" rx="4" fill="#fff" stroke="#476a85" stroke-width="2"/><circle cx="732" cy="96" r="6" fill="#d9534f" stroke="#476a85" stroke-width="1.5"/><rect x="730.5" y="70" width="3" height="24" fill="#d9534f"/><text id="ptemp" x="744" y="78" font-size="13" fill="#1d3a52" font-weight="700">– °C</text></g>
          <g id="zbeaker" class="zone"><rect x="802" y="40" width="86" height="72" rx="8" class="zone-rect"/><text x="845" y="80" class="zone-label">beaker</text></g>
          <g id="g-beaker" hidden><path d="M826 52h38v40a4 4 0 0 1-4 4h-30a4 4 0 0 1-4-4z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/><text x="845" y="108" font-size="12" text-anchor="middle" fill="#3f5a6e">100 cm³ beaker</text></g>
          <g id="inset" opacity="0"><rect x="440" y="122" width="448" height="90" rx="8" fill="#fff" stroke="#476a85" stroke-width="1.5"/><text x="452" y="140" font-size="12" fill="#3f5a6e" font-weight="700">magnified scale at the meniscus</text><text x="876" y="140" font-size="12" text-anchor="end" fill="#3f5a6e">← readings increase towards the plant</text><g id="insetg"></g></g>
          <text id="pmsg" x="450" y="24" font-size="14" text-anchor="middle" fill="#1d3a52" font-weight="600"></text>
        </svg></div>
        <div class="readout small mt" id="plive" aria-live="polite"></div>
        </div>
        <div class="bench-shelf" id="pshelf" aria-label="Apparatus shelf" data-empty="Everything is on the bench."></div>
        <div class="bench-controls">
          <div><strong class="small">Method decisions</strong> <span class="tiny muted">(before setting up)</span>
            <label class="small"><input type="checkbox" id="dflush" checked> flush out every air bubble with the syringe</label>
            <label class="small"><input type="checkbox" id="dvas" checked> seal the joint with vaseline</label>
            <label class="small"><input type="checkbox" id="dhide"> troubleshooting challenge: hide a fault for me to find</label>
            <label class="small"><input type="checkbox" id="dguide"> show me the next step (guided)</label></div>
          <div id="pproc"></div>
          <div id="prun" hidden>
            <strong class="small">Conditions</strong>
            <label>Light <select id="cli">${LIGHT.map((x, i) => `<option value="${i}" ${i === BASE.li ? "selected" : ""}>${x.label}</option>`).join("")}</select></label>
            <label>Air movement <select id="cwi">${WIND.map((x, i) => `<option value="${i}">${x.label}</option>`).join("")}</select></label>
            <label>Humidity <select id="chi">${HUM.map((x, i) => `<option value="${i}">${x.label}</option>`).join("")}</select></label>
            <label>Air temperature <select id="cte">${TEMP.map((t) => `<option value="${t}" ${t === 20 ? "selected" : ""}>${t} °C</option>`).join("")}</select></label>
            <label>Shoot <select id="csh">${Object.entries(SHOOTS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join("")}</select></label>
            <label>Capillary internal diameter <select id="cbo"><option value="1">1.0 mm</option><option value="2">2.0 mm (for fast rates)</option></select></label>
            <p class="tiny muted" id="cnote"></p>
            <div class="row"><button class="btn" id="badj">Let the shoot adjust (5 min)</button><button class="btn" id="bset">Set the meniscus</button><button class="btn primary" id="bstart" disabled>Start the clock</button></div>
            <details class="mt" id="leak"><summary class="small"><strong>Leak checks and diagnosis</strong></summary>
              <div class="row mt"><button class="btn sm" data-chk="joint">Look at the stem joint</button><button class="btn sm" data-chk="bubble">Look along the tubing</button><button class="btn sm" data-chk="tap">Check the 3-way tap and syringe</button><button class="btn sm" data-chk="compare">Compare with repeats</button></div>
              <div id="pobs" class="small mt" aria-live="polite"></div>
              <label class="small mt">What is wrong? <select id="pdiag"><option value="">choose…</option><option value="none">No fault: the apparatus is working</option><option value="joint">The joint is not sealed</option><option value="bubble">There is an air bubble in the tubing</option><option value="tap">The tap is open to the syringe</option></select></label>
              <div class="row"><button class="btn sm" id="pdcheck">Check my diagnosis</button></div><div id="pdfb" class="small mt"></div></details>
          </div>
          <div class="row"><button class="btn" id="preset">Reset bench</button></div>
          <div class="readout" id="pread">Set up the apparatus: drag or click each item on the shelf.</div>
        </div>
      </div>`;
    const svg = $("#pbench", host), shelf = $("#pshelf", host), msg = $("#pmsg", svg), readout = $("#pread", host), live = $("#plive", host);
    const say = (t) => { msg.textContent = t; const bs = $(".bench-say", host); if (bs) bs.textContent = t; };
    const show = (id, on = true) => { const g = $("#" + id, svg); if (g) { g.style.transition = reduceMotion() ? "none" : "opacity .5s ease, transform .8s ease"; g.style.opacity = on ? 1 : 0; } };
    const wait = (ms) => new Promise((res) => setTimeout(res, reduceMotion() ? 0 : ms));
    const steps = () => PROC.filter((p) => !(p.id === "vaseline" && S.deliberate.joint));
    const assembled = () => steps().every((p) => S.done.has(p.id));
    const cond = () => ({ li: +$("#cli", host).value, wi: +$("#cwi", host).value, hi: +$("#chi", host).value, temp: +$("#cte", host).value });

    function topSteps() {
      const st = [["setup", "Apparatus on the bench", ITEMS.every((i) => S.placed.has(i.id))], ["asm", "Assembled in the handbook order", assembled()], ["men", "Meniscus set", S.men !== null], ["run", "Readings every 3 min for 12 min", (S.runsDone || 0) > 0]];
      $("#pbsteps", host).innerHTML = st.map(([id, t, ok], i) => `<span class="bstep ${ok ? "done" : ""}">${ok ? "✓" : String.fromCharCode(65 + i)} ${t}</span>`).join("");
    }
    function drawShelf() {
      shelf.innerHTML = ""; shelf.hidden = ITEMS.every((i) => S.placed.has(i.id));
      ITEMS.forEach((it) => { if (S.placed.has(it.id)) return; const ok = !(it.needs || []).some((d) => !S.placed.has(d)); shelf.append(el(`<button class="shelf-item apparatus ${ok ? "" : "locked"}" data-id="${it.id}" title="${ok ? "Drag onto the bench or press Enter to place" : "Needs: " + it.needs.map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}"><svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">${icon(it.id)}</svg><span>${esc(it.name)}</span></button>`)); });
      topSteps(); drawProc(); refocus();
    }
    function moveFocus(e) { if (e && S.fm) e.focus({ preventScroll: !S.fm.key }); }
    function refocus() { const f = S.fm; if (!f || S.busy) return;
      const items = $$(".shelf-item:not(.locked)", shelf), steps = $$(".pstep", host);
      const t = f.list === "shelf" && items.length ? items[Math.min(f.i, items.length - 1)] : steps.length ? steps[Math.min(f.list === "proc" ? f.i : 0, steps.length - 1)] : !$("#prun", host).hidden ? $("#prun select", host) : null;
      moveFocus(t); S.fm = steps.length || items.length ? S.fm : null; }
    function place(id) {
      const it = ITEMS.find((x) => x.id === id); if (!it || S.placed.has(id)) return false;
      if ((it.needs || []).some((d) => !S.placed.has(d))) { say(`First you need: ${it.needs.filter((d) => !S.placed.has(d)).map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}.`); return false; }
      S.placed.add(id); $("#" + it.zone, svg).setAttribute("hidden", ""); const g = $("#g-" + id, svg); g.removeAttribute("hidden"); g.classList.add("pop");
      const hints = { bowl: "Bowl filled with water: cuts and joins are made under water.", shoot: "A woody shoot with plenty of large leaves (not waxy), and secateurs. Take care with the secateurs; wear goggles.", stand: "Stand, boss and clamp to hold the shoot steady.", pot: "Simple potometer: capillary with scale, 3-way tap, syringe and plastic tubing.", vas: "Vaseline to seal the joint.", towel: "Paper towels to dry the capillary.", watch: "Stop watch: readings every 3 minutes.", therm: "Thermometer to record the air temperature.", beaker: "100 cm³ beaker (in the handbook list)." };
      say(hints[id]); drawShelf(); return true;
    }
    // drag from the shelf (same mechanics as RP1–RP3), click, or Enter/Space
    let drag = null, ghost = null;
    shelf.addEventListener("pointerdown", (e) => { const b = e.target.closest(".shelf-item"); if (!b || b.classList.contains("locked")) return; drag = b; ghost = b.cloneNode(true); ghost.classList.add("ghost"); document.body.append(ghost); b.setPointerCapture(e.pointerId); move(e); });
    const zoneAt = (x, y) => { const it = drag && ITEMS.find((i) => i.id === drag.dataset.id); if (!it) return null; const r = $("#" + it.zone, svg).getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? it.zone : null; };
    function move(e) { if (!ghost) return; ghost.style.left = e.clientX - 28 + "px"; ghost.style.top = e.clientY - 28 + "px"; const z = zoneAt(e.clientX, e.clientY); $$(".zone", svg).forEach((zz) => zz.classList.toggle("over", zz.id === z)); }
    shelf.addEventListener("pointermove", move);
    const end = (e) => { if (!drag) return; const z = zoneAt(e.clientX, e.clientY); const it = ITEMS.find((i) => i.id === drag.dataset.id); if (z === it.zone) place(it.id); $$(".zone", svg).forEach((zz) => zz.classList.remove("over")); drag = null; if (ghost) { ghost.remove(); ghost = null; } };
    shelf.addEventListener("pointerup", end); shelf.addEventListener("pointercancel", end);
    // Keyboard focus (maintenance, 2026-11-16): the shelf and the step list are rebuilt after every action, which used to
    // drop focus to the top of the page. The control in the same place in the rebuilt list (the next item or step) now
    // takes focus; when the list is finished, the first run control does. After a pointer click focus moves without scrolling.
    const mark = (list, b, e) => { const all = $$(list === "shelf" ? ".shelf-item" : ".pstep", host); S.fm = { list, i: Math.max(0, all.indexOf(b)), key: !e || e.detail === 0 }; };
    shelf.addEventListener("click", (e) => { const b = e.target.closest(".shelf-item"); if (b && !b.classList.contains("locked")) { mark("shelf", b, e); place(b.dataset.id); } });
    shelf.addEventListener("keydown", (e) => { const b = e.target.closest(".shelf-item"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); mark("shelf", b); place(b.dataset.id); } });

    // ---- procedure chooser ----
    function shuffleOrder() { const g = rng(seed0 + 5); const ids = PROC.map((p) => p.id); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(g() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } S.order = ids; }
    function drawProc() {
      const box = $("#pproc", host); const allPlaced = ITEMS.every((i) => S.placed.has(i.id));
      if (!allPlaced) { box.innerHTML = `<p class="small muted">Put every item on the bench first.</p>`; $("#prun", host).hidden = true; return; }
      if (assembled()) { box.innerHTML = `<p class="small" style="color:var(--sage-ink)">✓ Assembled in the handbook order${S.mistakes ? ` (${S.mistakes} step${S.mistakes === 1 ? "" : "s"} chosen out of order on the way)` : " with no wrong choices"}.</p>`; $("#prun", host).hidden = false; runButtons(); return; }
      $("#prun", host).hidden = true;
      const next = steps().find((p) => !S.done.has(p.id)); const guided = $("#dguide", host).checked;
      const left = S.order.filter((id) => steps().some((p) => p.id === id) && !S.done.has(id)).map((id) => PROC.find((p) => p.id === id));
      box.innerHTML = `<strong class="small">Choose the next step</strong> <span class="tiny muted">(${S.done.size} of ${steps().length} done)</span><div class="stack mt" style="gap:.35rem">${left.map((p) => `<button class="btn sm pstep" data-step="${p.id}" style="text-align:left;justify-content:flex-start;white-space:normal;height:auto${guided && p.id === next.id ? ";outline:3px solid var(--teal);outline-offset:1px" : ""}">${esc(p.label)}</button>`).join("")}</div><div id="pprocfb" class="small mt" aria-live="polite"></div>`;
      $$(".pstep", box).forEach((b) => b.addEventListener("click", (e) => { mark("proc", b, e); choose(b.dataset.step); }));
    }
    async function choose(id) {
      const next = steps().find((p) => !S.done.has(p.id)); const fb = () => $("#pprocfb", host);
      if (id !== next.id) { S.mistakes++; const p = PROC.find((x) => x.id === id); fb().innerHTML = `<span style="color:var(--rose-ink)">Not yet: “${esc(p.label)}” comes later. First: <strong>${esc(next.label.toLowerCase())}</strong>. ${esc(next.why)}</span>`; return; }
      if (S.busy) return; S.busy = true; $$(".pstep", host).forEach((b) => (b.disabled = true)); $("#dflush", host).disabled = true; $("#dvas", host).disabled = true; $("#dhide", host).disabled = true;
      if (!S.hiddenSet) { S.hiddenSet = true; if ($("#dhide", host).checked) { const g = rng(seed0 + 99); const k = ["joint", "bubble", "tap"][Math.floor(g() * 3)]; S.hidden = k; S.jointFrac = 0.45 + g() * 0.15; } S.deliberate.bubble = !$("#dflush", host).checked; S.deliberate.joint = !$("#dvas", host).checked; if (S.deliberate.joint) S.jointFrac = 0.45 + rng(seed0 + 7)() * 0.15; }
      await animate(id); S.done.add(id); S.busy = false;
      if (assembled()) { readout.textContent = "Assembled. Choose the conditions, let the shoot adjust, set the meniscus with the syringe and 3-way tap, then start the clock."; say("Ready: set the meniscus with the syringe and the 3-way tap."); }
      drawShelf();
    }
    async function animate(id) {
      const sec = $("#secateurs", svg), free = $("#shootfree", svg); const tr = (g, t) => { g.style.transition = reduceMotion() ? "none" : "transform .8s ease"; g.style.transform = t; };
      if (id === "cut") { tr(sec, "translate(-50px, -170px)"); await wait(500); tr(sec, ""); tr(free, "translate(0px, 120px)"); await wait(800); say("Cut, and the base went straight into the water."); }
      if (id === "recut") { tr(sec, "translate(-50px, -60px)"); await wait(600); tr(sec, ""); show("cutpiece"); await wait(300); say("Second cut about 5 cm higher, under water: the air-filled base is removed."); }
      if (id === "submerge") { show("underwater"); $("#taph", svg).style.transform = ""; const pl = $("#plunger", svg); tr(pl, "translate(0px,-22px)"); await wait(900); tr(pl, ""); if (S.deliberate.bubble || S.hidden === "bubble") S.faults.bubble = true; if (S.deliberate.bubble) { show("airbub"); S.seen.bubble = true; say("Quick flush: an air bubble is still in the tubing (your method decision)."); } else say("Potometer under water, tap open, flushed with the syringe until no bubbles came out."); }
      if (id === "tap") { const t = $("#taph", svg); t.style.transformBox = "fill-box"; t.style.transformOrigin = "center"; if (S.hidden === "tap") { S.faults.tap = true; say("Tap turned… (check it later if the readings look odd)."); } else { t.style.transition = reduceMotion() ? "none" : "transform .5s"; t.style.transform = "rotate(90deg)"; say("3-way tap closed to the syringe."); } }
      if (id === "trim") { tr(sec, "translate(-50px, -50px)"); await wait(600); tr(sec, ""); say("Stem re-cut under water where it is slightly wider than the tubing; 6–12 leaves; leaves kept dry."); }
      if (id === "fit") { show("shootfree", false); free.style.opacity = 0; show("fitted"); await wait(500); say("Stem pushed firmly into the tubing, under water."); }
      if (id === "clamp") { show("underwater", false); $("#clamparm", svg).style.opacity = 1; show("drops"); if (S.deliberate.joint || S.hidden === "joint") S.faults.joint = true; if (S.deliberate.joint) { show("jointbub"); S.seen.joint = true; } await wait(400); say(S.deliberate.joint ? "Lifted out and clamped. You chose not to seal the joint." : "Lifted out of the bowl and clamped to the stand."); }
      if (id === "vaseline") { if (S.hidden === "joint") { show("vasring"); $("#vasring", svg).style.opacity = 0.45; say("Vaseline applied (is the seal complete all round?)."); } else { show("vasring"); say("Joint sealed with vaseline."); } }
      if (id === "dry") { const tw = $("#towelg", svg); tr(tw, "translate(250px, 240px)"); await wait(800); tr(tw, ""); show("drops", false); setMen(0.3); say("Capillary dried; the meniscus is moving towards the plant."); }
      if (id === "temp") { $("#ptemp", svg).textContent = `${cond().temp} °C`; say(`Air temperature recorded: ${cond().temp} °C.`); }
    }
    // meniscus drawing and magnified inset
    function setMen(cm) {
      const x = cm === null ? 868 : Math.max(412, mx(cm)); const w = $("#water", svg); w.setAttribute("x", 412); w.setAttribute("width", Math.max(0, x - 412)); const ml = $("#menline", svg); ml.setAttribute("x1", x); ml.setAttribute("x2", x); ml.style.opacity = cm === null ? 0 : 1;
      if (cm === null) { $("#inset", svg).style.opacity = 0; return; }
      // inset drawn the same way round as the bench: readings increase towards the plant (to the left); water on the plant side
      $("#inset", svg).style.opacity = 1; const off = cm > SCALE; if (off) cm = SCALE; const c0 = Math.min(SCALE - 5, Math.max(0, Math.floor(cm) - 2)); const X = (v) => 866 - (v - c0) * 82; const xm = X(Math.min(cm, c0 + 5));
      let g = `<rect x="452" y="148" width="424" height="10" fill="#f4f9ff" stroke="#476a85"/><rect x="454" y="150" width="${Math.max(0, xm - 454)}" height="6" fill="#7fb8e6"/>`;
      for (let mm = 0; mm <= 50; mm++) { const v = c0 + mm / 10; const xx = X(v); g += `<line x1="${xx}" y1="160" x2="${xx}" y2="${mm % 10 ? (mm % 5 ? 165 : 169) : 173}" stroke="#5a4631"/>`; if (mm % 10 === 0) g += `<text x="${xx}" y="187" font-size="12" text-anchor="middle" fill="#5a4631">${v}</text>`; }
      g += `<line x1="${xm}" y1="144" x2="${xm}" y2="162" stroke="#b4504f" stroke-width="2.5"/><text x="874" y="206" font-size="12" text-anchor="end" fill="#1d3a52" font-weight="700">${off ? "off the end of the scale" : `reading ${cm.toFixed(1)} cm`}</text>`;
      $("#insetg", svg).innerHTML = g;
    }
    function runButtons() {
      const c = cond(); const k = condKey(c) + "|" + $("#csh", host).value;
      const adj = S.adjustedKey === k; $("#badj", host).disabled = adj || S.running; $("#bset", host).disabled = !adj || S.running; $("#bstart", host).disabled = !adj || S.men === null || S.running;
      $("#cnote", host).textContent = (c.li === 0 ? "A box over the shoot would also raise the humidity and still the air; the simulation changes only the light. " : "") + (c.hi ? "The bag raises the humidity and also stops air movement around the leaves. " : "") + (c.li >= 2 ? "The lamp is behind a heat shield; the simulation assumes the leaves stay at air temperature. " : "") + (adj ? "The shoot has adjusted to these conditions." : "Conditions changed: let the shoot adjust before readings (stomata take minutes to respond in a real shoot; the simulation responds at once).");
    }
    ["#cli", "#cwi", "#chi", "#cte", "#csh", "#cbo"].forEach((s) => $(s, host).addEventListener("change", () => { if (s !== "#cbo") { S.men = S.men; } runButtons(); }));
    $("#dguide", host).addEventListener("change", drawProc);
    // Run controls disable themselves while they work; focus then moves on to the control that comes next in the method
    const runFocus = (e, id) => { const b = $(id, host); if (b && !b.disabled) b.focus({ preventScroll: e.detail !== 0 }); };
    $("#badj", host).addEventListener("click", async (e) => { S.running = true; runButtons(); say("Leaving the shoot for 5 minutes in the new conditions…"); await clock(300, 1500); S.adjustedKey = condKey(cond()) + "|" + $("#csh", host).value; S.running = false; $("#ptemp", svg).textContent = `${cond().temp} °C`; say("Adjusted. Now set the meniscus."); runButtons(); runFocus(e, "#bset"); });
    $("#bset", host).addEventListener("click", async (e) => { S.running = true; runButtons(); const pl = $("#plunger", svg), t = $("#taph", svg); t.style.transition = reduceMotion() ? "none" : "transform .4s"; t.style.transform = ""; await wait(300); pl.style.transition = reduceMotion() ? "none" : "transform .8s"; pl.style.transform = "translate(0px,-14px)"; await wait(800); pl.style.transform = ""; S.men = r1(1 + rng(runSeed * 31 + 3)()); setMen(S.men); if (!S.faults.tap) t.style.transform = "rotate(90deg)"; S.running = false; say(`Meniscus pushed back to ${S.men.toFixed(1)} cm with the syringe; tap turned back.`); readout.textContent = "Meniscus set. Start the clock and read the scale at 0, 3, 6, 9 and 12 minutes."; topSteps(); runButtons(); runFocus(e, "#bstart"); });
    function clock(seconds, ms) { return new Promise((res) => { const t0 = performance.now(); const tick = (now) => { const f = Math.min(1, Math.max(0, now - t0) / ms); const s = f * seconds; $("#pclock", svg).textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`; if (f < 1) requestAnimationFrame(tick); else res(); }; if (reduceMotion()) { $("#pclock", svg).textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:00`; res(); } else requestAnimationFrame(tick); }); }
    $("#bstart", host).addEventListener("click", async (e) => {
      if (S.running || S.men === null) return; S.running = true; runButtons();
      const c = cond(), shoot = $("#csh", host).value, bore = +$("#cbo", host).value; const seed = runSeed++;
      const sim = simulateRun({ c, shoot, bore, faults: S.faults, seed, jointFrac: S.jointFrac, start: S.men });
      $("#ptemp", svg).textContent = `${sim.tempRead.toFixed(1)} °C`;
      const rows = []; const showLive = () => { live.innerHTML = `<strong>This run</strong> (${esc(condLabel(c))}; ${esc(SHOOTS[shoot].label.split(" (")[0])}; ${bore.toFixed(1)} mm bore; thermometer ${sim.tempRead.toFixed(1)} °C): ${rows.map((p) => `${p.t} min: <strong>${p.pos === null ? "off the scale" : p.pos.toFixed(1) + " cm"}</strong>`).join(" · ")}`; };
      say("Clock started: reading the meniscus every 3 minutes. The clock is not stopped between readings.");
      const sc = $(".pbench-scroll", host); if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = sc.scrollWidth; // phones: show the capillary
      const total = reduceMotion() ? 2500 : 6000; // 12 minutes compressed
      await new Promise((res) => {
        const t0 = performance.now(); let k = 0;
        const step = () => { const now = performance.now(); const f = Math.min(1, Math.max(0, now - t0) / total); const tmin = f * 12; const s = tmin * 60;
          $("#pclock", svg).textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
          while (k < sim.pts.length && sim.pts[k].t <= tmin + 1e-9) { rows.push(sim.pts[k]); k++; showLive(); }
          if (!reduceMotion()) { const i = Math.min(sim.pts.length - 2, Math.floor(tmin / 3)); const a = sim.pts[i], b = sim.pts[i + 1]; const pa = a.pos === null ? SCALE + 0.5 : a.pos, pb = b.pos === null ? SCALE + 0.5 : b.pos; const pos = pa + (pb - pa) * ((tmin - a.t) / 3); setMen(Math.min(SCALE + 0.5, pos)); }
          else { const last = rows[rows.length - 1]; setMen(last && last.pos !== null ? last.pos : SCALE + 0.5); }
          if (f < 1) (reduceMotion() ? setTimeout(step, 500) : requestAnimationFrame(step)); else res(); };
        step(); });
      const offScale = sim.pts.some((p) => p.pos === null);
      const r = { c, condLabel: condLabel(c), shoot, area: SHOOTS[shoot].area, bore, pts: sim.pts, start: sim.start, tempRead: sim.tempRead, faults: { ...S.faults }, deliberate: { ...S.deliberate }, hidden: S.hidden && S.faults[S.hidden] ? S.hidden : null, revealed: false, seed, modelRate: +sim.modelRate.toFixed(4) };
      S.lastRun = r; S.runsDone = (S.runsDone || 0) + 1; S.men = null; S.running = false; topSteps();
      say(offScale ? "The meniscus ran off the end of the scale: reset it sooner, or use the wider capillary." : "12 minutes done. Reset the meniscus with the syringe before the next run.");
      readout.textContent = `Run saved to the results table. Repeat with the same conditions (at least three times), then change one condition. ${irregular(sim.pts) ? "The meniscus moved irregularly in this run: try the leak checks." : ""}`;
      runButtons(); onRun(r); runFocus(e, "#bset"); // next: reset the meniscus for a repeat
    });
    // ---- leak checks and diagnosis ----
    $$("[data-chk]", host).forEach((b) => b.addEventListener("click", () => { const k = b.dataset.chk; const F = S.faults; let t = "";
      if (k === "joint") { t = F.joint ? "Tiny air bubbles appear at the joint each time the shoot takes up water: the seal around the stem is not complete." : "The stem fits tightly and the vaseline seal is complete: no bubbles appear at the joint."; if (F.joint) { show("jointbub"); S.seen.joint = true; } }
      if (k === "bubble") { t = F.bubble ? "An air bubble is trapped in the tubing near the tap; it changes size slightly as you watch." : "The water column in the tubing and capillary is continuous: no air bubbles."; if (F.bubble) { show("airbub"); S.seen.bubble = true; } }
      if (k === "tap") { t = F.tap ? "The tap is still open to the syringe: the plunger creeps in slowly as the shoot draws water from the syringe." : "The tap is closed to the syringe; the plunger does not move."; S.seen.tap = F.tap; }
      if (k === "compare") { const runs = (B.store.get().labRuns[S.key] || []); const last = S.lastRun; if (!last) t = "Do a run first, then a repeat under the same conditions, and compare the distances moved."; else { const same = runs.filter((x) => condKey(x.c) === condKey(last.c) && x.shoot === last.shoot && x.bore === last.bore && x.seed !== last.seed).map(rateOf).filter(Boolean); const mine = rateOf(last); t = `Your last run: ${mine ? mine.rate.toFixed(2) : "–"} cm min⁻¹${irregular(last.pts) ? ", with irregular intervals" : ""}. ${same.length ? `Other runs under the same conditions: ${same.map((s) => s.rate.toFixed(2)).join(", ")} cm min⁻¹.` : "No other runs under the same conditions yet."} A run far from its repeats, or with irregular intervals, points to a fault.`; } }
      $("#pobs", host).textContent = t; }));
    $("#pdcheck", host).addEventListener("click", () => { const v = $("#pdiag", host).value; const fb = $("#pdfb", host); if (!v) { fb.textContent = "Choose a diagnosis first."; return; }
      const actual = ["joint", "bubble", "tap"].filter((k) => S.faults[k]);
      if (v === "none") { fb.innerHTML = actual.length ? `<span style="color:var(--rose-ink)">Not right: something is wrong. Use the checks above and compare your runs.</span>` : `<span style="color:var(--sage-ink)">✓ Correct: no fault. Repeats should agree within a few per cent.</span>`; return; }
      if (!S.faults[v]) { fb.innerHTML = `<span style="color:var(--rose-ink)">The checks do not support that: ${v === "joint" ? "the joint is sealed" : v === "bubble" ? "there is no bubble in the tubing" : "the tap is closed to the syringe"}.${actual.length ? " Look again." : " The apparatus is working."}</span>`; return; }
      const fixes = { joint: "Fix: dry the joint, push the stem in firmly and seal it all round with vaseline. Then reset the meniscus and repeat the run.", bubble: "Fix: take the shoot out under water, flush the potometer with the syringe until no bubbles remain and refit it (the handbook steps from submerging onwards). Discard the runs made with the bubble.", tap: "Fix: close the 3-way tap to the syringe, reset the meniscus and repeat." };
      const effect = { joint: "Air is drawn in at the joint instead of through the open end, so the meniscus moves more slowly than the water the shoot really takes up.", bubble: "The trapped bubble expands and contracts, so the meniscus moves irregularly: it can stall or even move backwards. Air at the cut end also blocks some xylem vessels, so the overall rate is lower than in a good run.", tap: "The shoot draws most of its water from the syringe, so the meniscus hardly moves." };
      fb.innerHTML = `<span style="color:var(--sage-ink)">✓ Correct: ${FAULT_NAME[v]}. ${effect[v]}</span> <button class="btn sm" id="pfix">${v === "bubble" ? "Re-assemble under water" : v === "joint" ? "Re-seal the joint" : "Close the tap"}</button><p class="small muted">${fixes[v]}</p>`;
      const st = B.store.get(); (st.labRuns[S.key] || []).forEach((r) => { if (r.hidden === v) r.revealed = true; }); B.store.save(); document.dispatchEvent(new Event("labrun"));
      $("#pfix", host).addEventListener("click", () => { S.faults[v] = false; if (S.hidden === v) S.hidden = null; if (v === "joint") { S.deliberate.joint = false; S.done.add("vaseline"); show("jointbub", false); show("vasring"); $("#vasring", svg).style.opacity = 1; } if (v === "tap") { const t = $("#taph", svg); t.style.transformBox = "fill-box"; t.style.transformOrigin = "center"; t.style.transform = "rotate(90deg)"; } if (v === "bubble") { S.deliberate.bubble = false; show("airbub", false); ["submerge", "tap", "trim", "fit", "clamp", "vaseline", "dry", "temp"].forEach((k) => S.done.delete(k)); show("fitted", false); show("underwater", false); $("#shootfree", svg).style.opacity = 1; $("#clamparm", svg).style.opacity = .35; } S.men = null; setMen(null); fb.innerHTML = `<span style="color:var(--sage-ink)">${v === "bubble" ? "Shoot taken out under water. Re-assemble from submerging the potometer." : "Fixed. Reset the meniscus and repeat the run."}</span>`; $("#pobs", host).textContent = ""; drawShelf(); });
    });
    $("#preset", host).addEventListener("click", (e) => { bench(host, onRun, key); host.querySelector("#pread").textContent = "Bench cleared. Set up the apparatus again."; const f = host.querySelector(".shelf-item:not(.locked)"); if (f) f.focus({ preventScroll: e.detail !== 0 }); });
    shuffleOrder(); drawShelf(); say("Put the apparatus on the bench: start with the bowl of water.");
    B.labSims.potometer._state = S; B.labSims.potometer._place = place; B.labSims.potometer._choose = choose; // exposed for tests
    return S;
  }
  function leaves(x, y) { return `<g fill="#4f9b4a" stroke="#2f7d3a" stroke-width="1.5"><path d="M${x} ${y + 14}c-30-28-60-18-66-8 20 14 44 16 66 8z"/><path d="M${x} ${y + 34}c30-26 58-16 64-6-20 14-44 14-64 6z"/><path d="M${x} ${y}c-14-24-2-36 6-38 6 16 2 28-6 38z"/><path d="M${x} ${y + 58}c-32-12-54-2-58 8 22 8 42 6 58-8z"/><path d="M${x} ${y + 78}c28-14 50-6 56 4-20 10-40 8-56-4z"/><path d="M${x} ${y + 98}c-26-8-44 0-48 8 18 6 34 4 48-8z"/></g>`; }

  // ---------------- Sim tab: bench + results table ----------------
  function sim(host, n) {
    host.innerHTML = `<div id="pbench-host"></div>
      <h3 class="mt">Results table</h3><p class="small muted">Each run adds a row with the meniscus position (cm on the scale) at 0, 3, 6, 9 and 12 minutes. Work out the distance moved, the rate and the volume in the Calculate tab, where your answers are checked. Rows made with a method problem you chose are flagged; a hidden fault is shown only once you have found it.</p>
      <div id="ptable" style="overflow-x:auto"></div>
      <div class="row mt"><button class="btn sm" id="pclear">Clear results table</button></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    function table() {
      if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", table); return; }
      if (!runs.length) { $("#ptable", host).innerHTML = '<p class="muted small">No runs yet.</p>'; return; }
      $("#ptable", host).innerHTML = `<table class="tbl small"><thead><tr><th>#</th><th>Conditions</th><th>Shoot</th><th>Bore / mm</th><th>Temp. / °C</th><th>0 min</th><th>3</th><th>6</th><th>9</th><th>12 min</th><th>Method</th></tr></thead><tbody>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.condLabel)}</td><td>${r.shoot}</td><td>${r.bore.toFixed(1)}</td><td>${r.tempRead.toFixed(1)}</td>${r.pts.map((p) => `<td>${p.pos === null ? "off scale" : p.pos.toFixed(1)}</td>`).join("")}<td>${knownFaults(r).length ? `<span style="color:var(--rose-ink)">${knownFaults(r).join("; ")}</span>` : r.hidden ? '<span class="muted">?</span>' : "as handbook"}</td></tr>`).join("")}</tbody></table>`;
    }
    bench($("#pbench-host", host), (r) => { runs.push({ ts: Date.now(), ...r }); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); }, n);
    $("#pclear", host).addEventListener("click", () => { if (confirm("Clear all saved runs for this practical?")) { runs.length = 0; B.store.save(); table(); document.dispatchEvent(new Event("labrun")); } });
    table(); host.dataset.mounted = "1"; document.addEventListener("labrun", table);
  }

  // ---------------- Calculate tab ----------------
  function calc(host, n) {
    const runsOf = () => (B.store.get().labRuns[n] || []);
    const inp = (id, w = "6rem", step = "0.01") => `<input id="${id}" type="number" step="${step}" style="width:${w};padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px">`;
    let ivSel = "wi"; const keep = {};
    function render() {
      ["c1run", "c2run", "c3run"].forEach((id) => { const e = host.querySelector("#" + id); if (e) keep[id] = e.value; });
      if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", render); return; }
      host.dataset.mounted = "1";
      const runs = runsOf(); const usable = runs.map((r, i) => ({ r, i })).filter((x) => rateOf(x.r));
      if (!usable.length) { host.innerHTML = `<div class="card"><div class="empty">${B.util.icons.lab}<h3>No results yet</h3><p>Assemble the potometer and complete at least one 12-minute run in the Virtual experiment tab, then come back to calculate the rate of water uptake.</p></div></div>`; return; }
      const opt = (sel) => usable.filter(sel).map(({ r, i }) => `<option value="${i}">#${i + 1} ${esc(r.condLabel)} · shoot ${r.shoot} · ${r.bore.toFixed(1)} mm${r.rateOk ? " ✓" : ""}</option>`).join("");
      const okRuns = usable.filter((x) => x.r.rateOk);
      host.innerHTML = `
        <div class="card mb"><h3>1 Distance moved and rate of water uptake</h3><p class="small muted">Distance moved = last reading − reading at 0 minutes (the meniscus does not start at 0). Rate = distance ÷ time, in cm min⁻¹, to 2 decimal places. If the meniscus ran off the scale, use the last reading on the scale and its time. Look at the distance moved in each 3-minute interval too: a steady rate gives similar intervals.</p>
          <div class="row"><label class="small">Run: <select id="c1run">${opt(() => true)}</select></label></div><div id="c1vals" class="small mt"></div>
          <div class="row mt"><label class="small">Distance moved / cm ${inp("c1d", "6rem", "0.1")}</label><label class="small">Rate / cm min⁻¹ ${inp("c1r")}</label><button class="btn sm" id="c1check">Check</button></div><div id="c1fb" class="small mt"></div></div>
        <div class="card mb"><h3>2 Volume of water taken up</h3><p class="small muted">Volume = πr² × distance, where r is the internal radius of the capillary (half the diameter). Work in mm: convert the rate in cm min⁻¹ to mm min⁻¹ (× 10), then multiply by the area in mm² to get mm³ min⁻¹ (1 cm³ = 1000 mm³).</p>
          ${okRuns.length ? `<div class="row"><label class="small">Run (rate checked): <select id="c2run">${opt((x) => x.r.rateOk)}</select></label></div><div id="c2vals" class="small mt"></div>
          <div class="row mt"><label class="small">r / mm ${inp("c2r", "5rem", "0.01")}</label><label class="small">πr² / mm² ${inp("c2a", "6rem", "0.001")}</label><label class="small">Volume / mm³ min⁻¹ ${inp("c2v", "6rem", "0.01")}</label><button class="btn sm" id="c2check">Check</button></div><div id="c2fb" class="small mt"></div>` : `<p class="small muted">Check the rate of at least one run in step 1 first.</p>`}</div>
        <div class="card mb"><h3>3 Graph: meniscus position against time</h3><p class="small muted">Plot the readings of one run and draw the line of best fit. Its gradient is the rate of water uptake. Move the slider until the line fits the points (it always passes through the mean point), then check.</p>
          <div class="row"><label class="small">Run: <select id="c3run">${opt(() => true)}</select></label><label class="small">Gradient: <strong><span id="c3gv">0.50</span> cm min⁻¹</strong><input type="range" id="c3g" min="0" max="5" step="0.01" value="0.5" style="width:200px;accent-color:var(--teal)"></label><button class="btn sm" id="c3check">Check my line</button></div>
          <div id="c3plot" class="mt"></div><div id="c3fb" class="small mt"></div></div>
        <div class="card mb"><h3>4 Comparing conditions: means and a bar chart</h3><p class="small muted">Choose the condition you changed. Only runs whose rate you have checked (step 1), made with the same shoot and capillary, with every other condition the same, are compared (a fair test). Runs made with a method problem you chose, or a hidden fault you have found, are left out. <span class="badge">platform convention</span> A rate more than 20 % from the mean of the others in its group (when those agree within 10 %) is flagged as a possible anomaly: this is this site's rule, not an OxfordAQA one; any reasoned rule applied consistently is acceptable.</p>
          <div class="row"><label class="small">Independent variable: <select id="c4iv"><option value="wi">air movement</option><option value="li">light</option><option value="hi">humidity</option><option value="temp">temperature</option></select></label></div><div id="c4out" class="mt"></div></div>
        <div class="card"><h3>5 Interpreting and evaluating</h3><ul class="small"><li>Describe the effect with numbers (for example "the fan increased the rate from 0.84 to 1.14 cm min⁻¹, by 36 %"), then explain it: light opens stomata; warmer air and moving air keep the water vapour gradient from the air spaces to the air steep; humid air makes it shallower.</li><li>You measured <strong>water uptake</strong>. It estimates transpiration, but some water is used in photosynthesis and other reactions or kept in cells for turgor and growth, and leaks change the reading.</li><li>Repeats that agree show the results are repeatable; irregular intervals or a run far from its repeats point to a fault (bubble, joint, tap).</li><li>A wider capillary gives a smaller distance for the same volume: compare runs made with different capillaries only as volumes (mm³ min⁻¹), and different shoots only per unit leaf area.</li><li>All values here are simulated by an illustrative model; real shoots vary more, and take several minutes to adjust to a new condition.</li></ul></div>`;
      ["c1run", "c2run", "c3run"].forEach((id) => { const e = host.querySelector("#" + id); if (e && keep[id] !== undefined && [...e.options].some((o) => o.value === keep[id])) e.value = keep[id]; });
      // 1
      const cur1 = () => runs[+$("#c1run", host).value];
      const vals1 = () => { const r = cur1(), t = rateOf(r); const inc = r.pts.slice(1).map((p, i) => (p.pos === null || r.pts[i].pos === null ? null : r1(p.pos - r.pts[i].pos))); $("#c1vals", host).innerHTML = `Readings: <strong>${r.pts.map((p) => `${p.t} min ${p.pos === null ? "off scale" : p.pos.toFixed(1) + " cm"}`).join(", ")}</strong>. Distance in each 3-minute interval: ${inc.map((x) => (x === null ? "–" : x.toFixed(1))).join(", ")} cm${irregular(r.pts) ? ' <span style="color:var(--rose-ink)">(irregular: suspect a fault)</span>' : ""}.${t.partial ? ` <span style="color:var(--amber-ink)">Off the scale after ${t.t} min: use the readings from 0 to ${t.t} min.</span>` : ""}`; $("#c1fb", host).textContent = ""; };
      $("#c1run", host).addEventListener("change", vals1); vals1();
      $("#c1check", host).addEventListener("click", () => { const r = cur1(), t = rateOf(r); const d = +$("#c1d", host).value, v = +$("#c1r", host).value; const okD = Math.abs(d - t.d) < 0.051, okR = Math.abs(v - t.rate) <= 0.006 || (okD && Math.abs(v - d / t.t) <= 0.006);
        if (okD && okR) { r.rateOk = true; B.store.save(); $("#c1fb", host).innerHTML = `<span style="color:var(--sage-ink)">✓ ${t.d.toFixed(1)} cm in ${t.t} min = ${t.rate.toFixed(2)} cm min⁻¹.${hasFault(r) && r.hidden && !r.revealed ? "" : hasFault(r) ? " This run had a method problem, so the value does not show the true uptake." : ""}</span>`; setTimeout(render, 900); }
        else $("#c1fb", host).innerHTML = `<span style="color:var(--rose-ink)">${okD ? "Distance correct. " : `Distance: subtract the first reading (${r.pts[0].pos.toFixed(1)} cm) from the last reading on the scale. `}${okR ? "" : `Rate: divide the distance by the time (${t.t} min), 2 d.p.`}</span>`; });
      // 2
      if (okRuns.length) { const cur2 = () => runs[+$("#c2run", host).value];
        const vals2 = () => { const r = cur2(), t = rateOf(r); $("#c2vals", host).innerHTML = `Rate ${t.rate.toFixed(2)} cm min⁻¹; capillary internal diameter ${r.bore.toFixed(1)} mm.`; $("#c2fb", host).textContent = ""; };
        $("#c2run", host).addEventListener("change", vals2); vals2();
        $("#c2check", host).addEventListener("click", () => { const r = cur2(), t = rateOf(r); const rad = r.bore / 2, area = Math.PI * rad * rad; const vTrue = t.rate * 10 * area, vRound = +t.rate.toFixed(2) * 10 * area;
          const a = +$("#c2r", host).value, b = +$("#c2a", host).value, v = +$("#c2v", host).value; const okA = Math.abs(a - rad) < 0.001, okB = Math.abs(b - area) <= area * 0.01 + 0.0005, okV = Math.abs(v - vTrue) <= vTrue * 0.02 || Math.abs(v - vRound) <= vRound * 0.02;
          $("#c2fb", host).innerHTML = okA && okB && okV ? `<span style="color:var(--sage-ink)">✓ r = ${rad.toFixed(2)} mm; area = π × ${rad.toFixed(2)}² = ${area.toFixed(3)} mm²; volume = ${(t.rate * 10).toFixed(2)} mm min⁻¹ × ${area.toFixed(3)} mm² = ${vTrue.toFixed(2)} mm³ min⁻¹ = ${(vTrue / 1000).toFixed(4)} cm³ min⁻¹.${hasFault(r) && (!r.hidden || r.revealed) ? " (This run had a method problem.)" : ""}</span>` : `<span style="color:var(--rose-ink)">${okA ? "" : "r is half the internal diameter. "}${okB ? "" : "Area = π × r² (r in mm). "}${okV ? "" : "Volume per minute = (rate × 10, in mm min⁻¹) × area in mm²; check your units."}</span>`; }); }
      // 3
      const draw3 = (showFit) => { const r = runs[+$("#c3run", host).value]; const g = +$("#c3g", host).value; $("#c3gv", host).textContent = g.toFixed(2); const ok = r.pts.filter((p) => p.pos !== null); const L = slope(r.pts); const ymax = Math.max(5, Math.ceil(Math.max(...ok.map((p) => p.pos)) / 5) * 5);
        const W = 560, H = 280, pl = 56, pr = 16, pt = 14, pb = 44; const X = (t) => pl + (t / 12) * (W - pl - pr), Y = (v) => pt + (1 - v / ymax) * (H - pt - pb);
        let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:10px" role="img" aria-label="graph of meniscus position against time with an adjustable line of best fit">`;
        for (let t = 0; t <= 12; t += 3) s += `<line x1="${X(t)}" y1="${pt}" x2="${X(t)}" y2="${H - pb}" stroke="#eef2f5"/><text x="${X(t)}" y="${H - pb + 16}" font-size="11" text-anchor="middle" fill="#6b7d8f">${t}</text>`;
        const yst = ymax > 20 ? 5 : ymax > 8 ? 2 : 1; for (let v = 0; v <= ymax; v += yst) s += `<line x1="${pl}" y1="${Y(v)}" x2="${W - pr}" y2="${Y(v)}" stroke="#eef2f5"/><text x="${pl - 6}" y="${Y(v) + 4}" font-size="11" text-anchor="end" fill="#6b7d8f">${v}</text>`;
        s += `<line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="#16263a"/><line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" stroke="#16263a"/><text x="${(W + pl) / 2}" y="${H - 6}" font-size="12" text-anchor="middle" fill="#16263a">time / min</text><text x="14" y="${(H - pb) / 2}" font-size="12" text-anchor="middle" fill="#16263a" transform="rotate(-90 14 ${(H - pb) / 2})">meniscus position / cm</text>`;
        const line = (m, c, col, dash) => { const y0 = L.my - m * L.mx; const t0 = 0, t1 = 12; s += `<line x1="${X(t0)}" y1="${Y(Math.max(0, Math.min(ymax, y0 + m * t0)))}" x2="${X(t1)}" y2="${Y(Math.max(0, Math.min(ymax, y0 + m * t1)))}" stroke="${col}" stroke-width="2" ${dash ? 'stroke-dasharray="6 4"' : ""}/>`; };
        line(g, 0, "#b4504f", true); if (showFit) line(L.m, 0, "#1f8a85", false);
        ok.forEach((p) => { s += `<line x1="${X(p.t) - 5}" y1="${Y(p.pos) - 5}" x2="${X(p.t) + 5}" y2="${Y(p.pos) + 5}" stroke="#1d3a52" stroke-width="2"/><line x1="${X(p.t) - 5}" y1="${Y(p.pos) + 5}" x2="${X(p.t) + 5}" y2="${Y(p.pos) - 5}" stroke="#1d3a52" stroke-width="2"/>`; });
        $("#c3plot", host).innerHTML = s + "</svg>"; return L; };
      $("#c3run", host).addEventListener("change", () => { $("#c3fb", host).textContent = ""; draw3(false); }); $("#c3g", host).addEventListener("input", () => draw3(false)); draw3(false);
      $("#c3check", host).addEventListener("click", () => { const r = runs[+$("#c3run", host).value]; const L = draw3(true); const g = +$("#c3g", host).value; const ok = Math.abs(g - L.m) <= Math.max(0.03, 0.04 * L.m);
        $("#c3fb", host).innerHTML = (ok ? `<span style="color:var(--sage-ink)">✓ Good fit: your gradient ${g.toFixed(2)} cm min⁻¹; least-squares best fit (solid line) ${L.m.toFixed(2)} cm min⁻¹.</span>` : `<span style="color:var(--rose-ink)">Not the best fit: the solid line shows the least-squares gradient, ${L.m.toFixed(2)} cm min⁻¹. Your line should have about as many points above it as below.</span>`) + (irregular(r.pts) ? ` <span style="color:var(--amber-ink)">The points do not lie close to a straight line: the rate was not steady, which suggests a fault (an air bubble or a leak). Do not use this run.</span>` : ` The points lie close to a straight line, so the rate was steady over the ${rateOf(r).t} minutes on the scale.`); });
      // 4
      $("#c4iv", host).value = ivSel; $("#c4iv", host).addEventListener("change", () => { ivSel = $("#c4iv", host).value; draw4(); }); draw4();
      function draw4() {
        const iv = ivSel; const others = ["li", "wi", "hi", "temp"].filter((k) => k !== iv);
        const pool = usable.filter((x) => x.r.rateOk && !(x.r.deliberate && (x.r.deliberate.bubble || x.r.deliberate.joint)) && !(x.r.hidden && x.r.revealed));
        if (!pool.length) { $("#c4out", host).innerHTML = '<p class="small muted">Check the rates of some runs (step 1) first; runs with a known method problem are not used.</p>'; return; }
        const keyOf = (r) => others.map((k) => r.c[k]).join("|") + "|" + r.shoot + "|" + r.bore; const counts = {}; pool.forEach((x) => (counts[keyOf(x.r)] = (counts[keyOf(x.r)] || 0) + 1)); const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        const used = pool.filter((x) => keyOf(x.r) === best); const excluded = pool.length - used.length;
        const groups = {}; used.forEach((x) => (groups[x.r.c[iv]] = groups[x.r.c[iv]] || []).push(x));
        const lv = Object.keys(groups).map(Number).sort((a, b) => a - b); const name = (v) => (iv === "li" ? LIGHT[v].label : iv === "wi" ? WIND[v].label : iv === "hi" ? (v ? "Plastic bag" : "Open bench") : v + " °C");
        const stats = lv.map((v) => { const rates = groups[v].map((x) => +rateOf(x.r).rate.toFixed(2)); const flags = rates.map((x, i) => { const o = rates.filter((_, j) => j !== i); if (o.length < 2) return false; const m = o.reduce((a, b) => a + b, 0) / o.length; return Math.max(...o) - Math.min(...o) <= 0.1 * m && Math.abs(x - m) > 0.2 * m; }); const kept = rates.filter((_, i) => !flags[i]); return { v, rates, flags, idx: groups[v].map((x) => x.i), mean: kept.reduce((a, b) => a + b, 0) / kept.length, min: Math.min(...kept), max: Math.max(...kept) }; });
        const fixed = others.map((k) => (k === "li" ? LIGHT[used[0].r.c.li].label : k === "wi" ? WIND[used[0].r.c.wi].label : k === "hi" ? (used[0].r.c.hi ? "plastic bag" : "open bench") : used[0].r.c.temp + " °C")).join("; ");
        let html = `<p class="small">Kept the same: ${esc(fixed)}; shoot ${used[0].r.shoot}; ${used[0].r.bore.toFixed(1)} mm capillary.${excluded ? ` ${excluded} checked run(s) left out because something else differed.` : ""}</p><table class="tbl small"><thead><tr><th>${iv === "temp" ? "Temperature" : iv === "li" ? "Light" : iv === "wi" ? "Air movement" : "Humidity"}</th><th>Rates / cm min⁻¹ (runs)</th><th>Your mean</th><th></th></tr></thead><tbody>${stats.map((s, j) => `<tr><td>${esc(name(s.v))}</td><td>${s.rates.map((x, i) => `<span class="${s.flags[i] ? "badge amber" : ""}">${x.toFixed(2)} (#${s.idx[i] + 1})</span>`).join(", ")}${s.rates.length < 3 ? ' <span class="tiny muted">fewer than 3 repeats</span>' : ""}</td><td><input type="number" step="0.01" class="c4m" data-j="${j}" style="width:5rem;padding:.3rem .4rem;border:1px solid var(--line-strong);border-radius:8px"></td><td class="c4f" data-j="${j}"><button class="btn sm c4c" data-j="${j}">Check</button></td></tr>`).join("")}</tbody></table>`;
        // bar chart of means with range bars
        const W = 560, H = 260, pl = 56, pr = 16, pt = 14, pb = 56; const ymax = Math.max(0.5, ...stats.map((s) => s.max)) * 1.15; const bw = Math.min(70, (W - pl - pr) / stats.length - 20); const X = (j) => pl + ((j + 0.5) * (W - pl - pr)) / stats.length, Y = (v) => pt + (1 - v / ymax) * (H - pt - pb);
        let g = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:10px" role="img" aria-label="bar chart of mean rate of water uptake for each condition, with the range of the repeats">`;
        const yst = ymax > 2 ? 0.5 : 0.2; for (let v = 0; v <= ymax + 1e-9; v += yst) g += `<line x1="${pl}" y1="${Y(v)}" x2="${W - pr}" y2="${Y(v)}" stroke="#eef2f5"/><text x="${pl - 6}" y="${Y(v) + 4}" font-size="11" text-anchor="end" fill="#6b7d8f">${v.toFixed(1)}</text>`;
        stats.forEach((s, j) => { g += `<rect x="${X(j) - bw / 2}" y="${Y(s.mean)}" width="${bw}" height="${Y(0) - Y(s.mean)}" fill="#9fd3cf" stroke="#1f8a85"/><line x1="${X(j)}" y1="${Y(s.min)}" x2="${X(j)}" y2="${Y(s.max)}" stroke="#16263a" stroke-width="1.5"/><line x1="${X(j) - 6}" y1="${Y(s.min)}" x2="${X(j) + 6}" y2="${Y(s.min)}" stroke="#16263a"/><line x1="${X(j) - 6}" y1="${Y(s.max)}" x2="${X(j) + 6}" y2="${Y(s.max)}" stroke="#16263a"/><text x="${X(j)}" y="${H - pb + 16}" font-size="10.5" text-anchor="middle" fill="#16263a">${esc(iv === "wi" ? name(s.v) : name(s.v).split(" (")[0].split(",")[0])}</text>`; });
        g += `<line x1="${pl}" y1="${Y(0)}" x2="${W - pr}" y2="${Y(0)}" stroke="#16263a"/><line x1="${pl}" y1="${pt}" x2="${pl}" y2="${Y(0)}" stroke="#16263a"/><text x="14" y="${(H - pb) / 2}" font-size="12" text-anchor="middle" fill="#16263a" transform="rotate(-90 14 ${(H - pb) / 2})">mean rate / cm min⁻¹</text><text x="${(W + pl) / 2}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#3f5a6e">bars: mean (anomalies left out); lines: range of the repeats</text></svg>`;
        html += `<div class="mt">${g}</div>${stats.length < 2 ? '<p class="small muted">Run at least two levels of this condition (with the others the same) to compare them.</p>' : `<p class="small">${(() => { const a = stats[0], b = stats[stats.length - 1]; const pc = ((b.mean - a.mean) / a.mean) * 100; return `From ${esc(name(a.v).split(" (")[0])} to ${esc(name(b.v).split(" (")[0])} the mean rate changed from ${a.mean.toFixed(2)} to ${b.mean.toFixed(2)} cm min⁻¹ (${pc >= 0 ? "+" : ""}${pc.toFixed(0)} %).${stats.some((s) => s.rates.length > 1 && s.max - s.min > 0.15 * s.mean) ? " Some repeats differ widely: look for a fault before drawing a conclusion." : ""}`; })()}</p>`}`;
        $("#c4out", host).innerHTML = html;
        $$(".c4c", host).forEach((b) => b.addEventListener("click", () => { const j = +b.dataset.j, s = stats[j]; const v = +$(`.c4m[data-j="${j}"]`, host).value; const all = s.rates.reduce((a, c) => a + c, 0) / s.rates.length; const okM = Math.abs(v - s.mean) <= 0.006, okAll = s.flags.some(Boolean) && Math.abs(v - all) <= 0.006;
          $(`.c4f[data-j="${j}"]`, host).innerHTML = okM ? `<span style="color:var(--sage-ink)">✓ ${s.mean.toFixed(2)}</span>` : okAll ? `<span style="color:var(--sage-ink)">✓ ${all.toFixed(2)} with every run kept (accepted); without the flagged run ${s.mean.toFixed(2)}</span>` : `<span style="color:var(--rose-ink)">not quite (leave out flagged runs; 2 d.p.)</span>`; }));
      }
    }
    render(); document.addEventListener("labrun", render);
  }

  B.labSims.potometer = { sim, calc, simulateRun, rateOf, irregular, PROC, SCALE };
})(window.BIO);
