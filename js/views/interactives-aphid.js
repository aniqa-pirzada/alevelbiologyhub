// Interactives for 3.2.9 The role of aphids in spreading plant viruses (Phase 4 Batch 3, owned by the 3.2.9 author).
// Kinds: aphidCropInvestigation (3.2.9.1); aphidSpreadSim (3.2.9.2). Drawings come from B.aphidArt, the spread model
// from B.aphidModel and the investigation data from B.aphidData (data/content/_aphid-art.js). The Aphid Feeding Explorer
// was removed in the release fix pass (2026-11-15): figure d-3.2.9.2-3 tells the same story with better art.
// Accessibility: every control is a native button, input or select; tab rows respond to the arrow keys; changes are
// announced in polite live regions. Motion: nothing moves by itself. The simulator's Play advances one day every 0.6 s
// only when motion is allowed; with reduced motion Play is hidden and the day slider is used instead. Layouts wrap and
// SVGs scale, so nothing scrolls sideways at 390 px. Questions use B.questions.render so attempts count towards mastery.
// Model documentation (seeds, probabilities) stays in code comments; students see only "simplified model".
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.aphidArt, M = () => B.aphidModel, D = () => B.aphidData;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const alive = (host) => document.body.contains(host);
  const f0 = (x) => Math.round(x + 1e-9).toFixed(0), f1 = (x) => (Math.round(x * 10 + 1e-9) / 10).toFixed(1);
  const tbl = (rows, headRow) => `<div style="max-width:100%;overflow-x:auto"><table class="tbl"><thead><tr>${headRow.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  // tab row with roving focus (arrow keys, Home, End)
  const tabs = (bar, labels, onShow) => { let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    return show; };
  // ===================================== Plant Virus Transmission Simulator =====================================
  B.interactives.aphidSpreadSim = function (spec, host) {
    const uid = uidOf(); const SEED = 1; // one fixed run; "Run 20 times" uses seeds 1 to 20 (not shown to students)
    const st = { mode: "np", source: "plant", control: "none", winged: true, day: 0, timer: null };
    let res = null, base = null;
    const key = `<svg viewBox="0 0 640 26" width="640" role="img" aria-label="Key to the simulated crop" class="ix-read-off" style="max-width:100%;height:auto;display:block">
      <rect x="2" y="5" width="16" height="16" rx="4" fill="#bfe3a8" stroke="#5f8f45"/><text x="24" y="18" font-size="13" fill="#16263a">healthy</text>
      <rect x="86" y="5" width="16" height="16" rx="4" fill="#f3e3a0" stroke="#5f8f45"/><text x="108" y="18" font-size="13" fill="#16263a">infected</text>
      <rect x="170" y="5" width="16" height="16" rx="4" fill="#e2c43a" stroke="#5f8f45"/><text x="192" y="18" font-size="13" fill="#16263a">symptoms</text>
      <rect x="264" y="5" width="16" height="16" rx="4" fill="#bfe3a8" stroke="#1f66b0" stroke-width="2.4"/><text x="268" y="17" font-size="10" font-weight="800" fill="#1f66b0">R</text><text x="286" y="18" font-size="13" fill="#16263a">resistant</text>
      <circle cx="368" cy="13" r="6" fill="#c0392b"/><text x="380" y="18" font-size="13" fill="#16263a">first infected</text>
      <g transform="translate(476 0)">${A().aphidDot(8, 14, true, false)}</g><text x="496" y="18" font-size="13" fill="#16263a">winged aphid</text>
      <circle cx="590" cy="14" r="3" fill="#c0392b"/><text x="598" y="18" font-size="13" fill="#16263a">virus</text></svg>`;
    host.innerHTML = head(spec, "simplified model") + B.ix.split(`
        <div class="figure"><div class="fig-view" data-r="field"></div></div>
        <div class="figure"><div class="fig-view" data-r="chart"></div></div>`, `
          <div class="row" style="gap:.5rem;flex-wrap:wrap;align-items:center"><button type="button" class="btn sm primary" data-a="play">Play</button>
            <label class="small" style="flex:1 1 12rem">Day <strong data-r="dayv"></strong> of 42<input type="range" min="1" max="42" step="1" value="1" data-k="day" aria-label="day of the simulation"></label></div>
          <div data-r="read" class="small" aria-live="polite"></div>
          <fieldset><legend>Type of virus</legend>
            <label class="small"><input type="radio" name="sv-m-${uid}" value="np" checked> Non-persistent (passed on in seconds while probing)</label>
            <label class="small"><input type="radio" name="sv-m-${uid}" value="p"> Persistent (needs long feeds; aphid infective for life)</label></fieldset>
          <fieldset><legend>Aphids</legend>
            <label class="small"><input type="checkbox" data-k="winged" checked> Crowded colonies produce winged females</label>
            <label class="small">Infected source <select data-k="source" aria-label="where the virus starts: one infected plant in the crop, or infected weeds at the edge"><option value="plant">one plant</option><option value="edge">edge weeds</option></select></label></fieldset>
          <fieldset><legend>Control</legend>
            <label class="small"><input type="radio" name="sv-c-${uid}" value="none" checked> None</label>
            <label class="small"><input type="radio" name="sv-c-${uid}" value="insecticide"> Insecticide</label>
            <label class="small"><input type="radio" name="sv-c-${uid}" value="roguing"> Remove plants with symptoms weekly</label>
            <label class="small"><input type="radio" name="sv-c-${uid}" value="resistant"> Resistant variety (half the plants)</label></fieldset>
          <div class="row" style="gap:.4rem;flex-wrap:wrap;align-items:center"><button type="button" class="btn sm" data-a="repeat">Run 20 times</button></div>
          <div data-r="rep" aria-live="polite"></div>`, { cls: "ix-fit-2" }) + key + `
      <details class="small mt"><summary>How the model is simplified</summary><ul>
        <li>48 identical plants for 42 days. An infected plant can pass on virus after 4 days and shows symptoms after 10 days.</li>
        <li>Winged aphids arrive every day; most probe a few plants and fly on. Non-persistent virus is picked up and passed on during these brief probes; persistent virus only during long feeds.</li>
        <li>Colonies grow on the plants; when crowded, some young develop wings and fly to other plants.</li>
        <li>Insecticide kills aphids before a long feed is finished, but not before a probe lasting seconds, and sprayed aphids move about more before they die.</li>
        <li>Chance decides which plants the aphids visit, so the model is run 20 times to compare settings. The numbers are model output, not measurements; there is no wind, weather or natural enemies.</li></ul></details>
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const opts = (seed = SEED) => ({ mode: st.mode, source: st.source, insecticide: st.control === "insecticide", roguing: st.control === "roguing", resistant: st.control === "resistant" ? 0.5 : 0, seed, wingFrac: st.winged ? M().DEF.wingFrac : 0 });
    const baseOpts = (seed = SEED) => ({ mode: st.mode, source: st.source, seed });
    const anyControl = () => st.control !== "none" || !st.winged;
    const compute = () => { res = M().run(opts()); base = anyControl() ? M().run(baseOpts()) : null; q("rep").innerHTML = ""; };
    const chart = () => { const W = 720, H = 250, L = 64, Rr = 700, top = 16, bot = 186; const X = (d) => L + ((Rr - L) * d) / 41, Y = (p) => bot - ((bot - top) * p) / 100;
      let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Percentage of plants infected against day" style="max-width:100%;height:auto"><rect width="${W}" height="${H}" fill="#fff"/>`;
      for (let p = 0; p <= 100; p += 25) s += `<line x1="${L}" y1="${Y(p)}" x2="${Rr}" y2="${Y(p)}" stroke="#e6ecef"/><text x="${L - 8}" y="${Y(p) + 5}" text-anchor="end" font-size="16" fill="#5f6f7f">${p}</text>`;
      for (let d = 0; d <= 42; d += 7) s += `<text x="${X(Math.max(0, d - 1))}" y="${bot + 22}" text-anchor="middle" font-size="16" fill="#5f6f7f">${Math.max(1, d)}</text>`;
      s += `<text x="${(L + Rr) / 2}" y="${H - 8}" text-anchor="middle" font-size="16" font-weight="700" fill="#16263a">Day</text><text transform="translate(20 ${(top + bot) / 2}) rotate(-90)" text-anchor="middle" font-size="16" font-weight="700" fill="#16263a">% infected</text>`;
      const line = (r, col, dash) => `<path d="${r.days.map((x, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(x.pct).toFixed(1)).join(" ")}" fill="none" stroke="${col}" stroke-width="3"${dash ? ' stroke-dasharray="7 5"' : ""}/>`;
      if (base) s += line(base, "#7a8794", true) + `<text x="${Rr - 4}" y="${Y(base.days.at(-1).pct) + (base.days.at(-1).pct > 90 ? 20 : -6)}" text-anchor="end" font-size="16" fill="#46525e">no control</text>`;
      s += line(res, "#b8650a", false) + `<line x1="${X(st.day)}" y1="${top}" x2="${X(st.day)}" y2="${bot}" stroke="#1f66b0" stroke-width="1.6"/>`;
      if (base) s += `<text x="${L + 8}" y="${top + 14}" font-size="16" font-weight="700" fill="#8a4a00">with these settings</text>`;
      return s + "</svg>"; };
    const draw = () => { const day = res.days[st.day]; const N = res.N;
      q("field").innerHTML = A().simField(res, st.day, { aria: `Simulated crop on day ${st.day + 1}: ${day.inf} of ${N} plants infected` });
      q("chart").innerHTML = chart(); $('[data-k="day"]', host).value = st.day + 1; q("dayv").textContent = st.day + 1;
      const rows = [["Plants infected", `${day.inf} of ${N} (${f0(day.pct)} %)${base ? `; no control: ${base.days[st.day].inf}` : ""}`], ["Showing symptoms", String(day.symptoms)], ["Winged aphids moving today", `${day.moved.length} (${day.moved.filter((m) => m.carrying).length} carrying virus)`]];
      if (st.control === "roguing") rows.push(["Plants removed so far", String(day.removed)]);
      q("read").innerHTML = `<table class="tbl"><tbody>${rows.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</tbody></table>`; };
    const stop = () => { if (st.timer) { clearInterval(st.timer); st.timer = null; } const pb = $('[data-a="play"]', host); if (pb) pb.textContent = "Play"; };
    const setDay = (d) => { st.day = Math.max(0, Math.min(41, d)); draw(); };
    const rerun = () => { stop(); compute(); draw(); };
    $$(`input[name="sv-m-${uid}"]`, host).forEach((r) => r.addEventListener("change", () => { if (r.checked) { st.mode = r.value; rerun(); } }));
    $$(`input[name="sv-c-${uid}"]`, host).forEach((r) => r.addEventListener("change", () => { if (r.checked) { st.control = r.value; rerun(); } }));
    $('[data-k="source"]', host).addEventListener("change", (e) => { st.source = e.target.value; rerun(); });
    $('[data-k="winged"]', host).addEventListener("change", (e) => { st.winged = e.target.checked; rerun(); });
    $('[data-k="day"]', host).addEventListener("input", (e) => { stop(); setDay(+e.target.value - 1); });
    const playBtn = $('[data-a="play"]', host); playBtn.hidden = reduced();
    playBtn.addEventListener("click", () => { if (st.timer) { stop(); return; } if (reduced()) return; if (st.day >= 41) setDay(0); playBtn.textContent = "Pause";
      st.timer = setInterval(() => { if (!alive(host)) { stop(); return; } if (st.day >= 41) { stop(); return; } setDay(st.day + 1); }, 600); });
    $('[data-a="repeat"]', host).addEventListener("click", () => { const box = q("rep"); box.innerHTML = `<p class="small">Running…</p>`;
      setTimeout(() => { if (!alive(host)) return; const cur = M().repeats(opts(), 20); const rows = [["These settings", f0(cur.mean), `${f0(cur.min)} to ${f0(cur.max)}`]];
        if (anyControl()) { const b = M().repeats(baseOpts(), 20); rows.push(["No control", f0(b.mean), `${f0(b.min)} to ${f0(b.max)}`]); }
        box.innerHTML = `<p class="small"><strong>20 runs: % of plants infected by day 42</strong> (model output)</p>` + tbl(rows, ["Settings", "Mean %", "Range %"]); }, 30); });
    compute(); draw(); renderQs(spec.questions, q("q"));
  };

  // ========================================= Crop Disease Investigation =========================================
  B.interactives.aphidCropInvestigation = function (spec, host) {
    const st = { field: "A", week: 2, nums: false }; const uid = uidOf();
    host.innerHTML = head(spec, "real photographs; hypothetical data") + `
      <div class="row mt" role="tablist" aria-label="parts of the investigation" data-r="tabs" style="flex-wrap:wrap;gap:.35rem"></div>
      <div data-r="p1" class="mt"></div><div data-r="p2" class="mt" hidden></div><div data-r="p3" class="mt" hidden></div>`;
    const q = (k) => $(`[data-r="${k}"]`, host); const qs = spec.questions || []; const part = (n) => qs.filter((x) => x.part === n);
    // Part 1: photographs, each with its question
    const p1 = q("p1"); p1.innerHTML = `<p class="small"><strong>Part 1. Name the symptom.</strong> Each photograph shows a crop infected with an aphid-borne virus. Describe what you see before you choose an answer.</p><div class="grid grid-2" data-r="photos" style="gap:1rem"></div>`;
    // each photograph is shown whole (fit: contain) and no taller than 260 px (4:3 frame at most 346 px wide)
    part(1).forEach((x) => { const cell = document.createElement("div"); cell.innerHTML = `<div style="max-width:346px">${B.views.photo(x.slot, { ratio: "4:3" })}</div>`; cell.append(B.questions.render(x)); $('[data-r="photos"]', p1).append(cell); });
    // Part 2: field maps over time
    const p2 = q("p2"); p2.innerHTML = `<p class="small"><strong>Part 2. Compare the patterns of spread.</strong> HYPOTHETICAL data: two squash fields were surveyed every week for six weeks, and each plant that showed mosaic symptoms was recorded. Choose a field and move through the weeks.</p>
      <div class="row" style="gap:.5rem;flex-wrap:wrap;align-items:center"><fieldset style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:700">Field</legend><label class="small"><input type="radio" name="cdi-f-${uid}" data-f="A" value="A" checked> Field A</label> <label class="small"><input type="radio" name="cdi-f-${uid}" data-f="B" value="B"> Field B</label></fieldset>
        <label class="small">Week <strong data-r="wk"></strong><br><input type="range" min="1" max="6" step="1" value="2" data-k="week" aria-label="survey week" style="width:200px;max-width:100%"></label>
        <label class="small"><input type="checkbox" data-k="nums"> Show the week each plant was first recorded</label></div>
      <p class="small muted" data-r="story"></p><div class="row" style="gap:.3rem;flex-wrap:wrap;margin:.4rem 0"><button type="button" class="btn sm" data-mz="-1" aria-label="zoom out of the map">−</button><button type="button" class="btn sm" data-mz="1" aria-label="zoom in to the map">+</button><button type="button" class="btn sm" data-mz="0">Reset zoom</button></div><div style="max-width:100%;overflow:auto;border-radius:8px"><div class="figure" data-r="mapbox" style="width:100%;margin:0"><div class="fig-view" data-r="map"></div></div></div><div data-r="ftable"></div><div data-r="q2" class="mt"></div>`;
    const fr = $$("input[data-f]", p2);
    const drawMap = () => { const d = D(); $('[data-r="wk"]', p2).textContent = st.week; $('[data-r="story"]', p2).textContent = d.FIELDS[st.field].story;
      $('[data-r="map"]', p2).innerHTML = A().fieldMap(st.field, st.week, { weeks: st.nums });
      const c = d.fieldPct(st.field, st.week);
      const table = st.field === "A" ? tbl([[String(st.week), ...d.bandPct("A", st.week).map(f1)]], ["Week", "Columns 1–3 / %", "Columns 4–6 / %", "Columns 7–9 / %", "Columns 10–12 / %"]) : tbl([[String(st.week), ...d.ringPct(st.week).map((r) => f1(r.pct))]], ["Week", "Source plant and its 8 neighbours / %", "2 to 3 plants away / %", "4 or more plants away / %"]);
      $('[data-r="ftable"]', p2).innerHTML = `<p class="small" aria-live="polite">${d.FIELDS[st.field].name}, week ${st.week}: ${c.n} of 96 plants (${f1(c.pct)} %) had symptoms.</p>` + table; };
    fr.forEach((r) => r.addEventListener("change", () => { if (r.checked) { st.field = r.dataset.f; drawMap(); } }));
    $('[data-k="week"]', p2).addEventListener("input", (e) => { st.week = +e.target.value; drawMap(); });
    $('[data-k="nums"]', p2).addEventListener("change", (e) => { st.nums = e.target.checked; drawMap(); });
    let mz = 1; $$('[data-mz]', p2).forEach((b) => b.addEventListener('click', () => { const k = +b.dataset.mz; mz = k === 0 ? 1 : Math.max(1, Math.min(2.5, mz + 0.5 * k)); $('[data-r="mapbox"]', p2).style.width = `${mz * 100}%`; }));
    drawMap(); renderQs(part(2), $('[data-r="q2"]', p2));
    // Part 3: control trial
    const d = D(); const TR = d.TRIAL;
    const bars = () => { const W = 600, rowH = 58, L = 20, Rr = 580, top = 40; const H = top + TR.length * rowH + 50; const X = (p) => L + ((Rr - L) * p) / 100;
      let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Bar chart of the mean percentage of plants with mosaic for each treatment, with the range across four plots" style="max-width:100%;height:auto"><rect width="${W}" height="${H}" fill="#fff"/>`;
      s += `<text x="${W - 10}" y="24" text-anchor="end" font-size="17" font-weight="700" fill="#8a4a00">HYPOTHETICAL data</text>`;
      for (let p = 0; p <= 100; p += 20) s += `<line x1="${X(p)}" y1="${top}" x2="${X(p)}" y2="${top + TR.length * rowH}" stroke="#e6ecef"/><text x="${X(p)}" y="${top + TR.length * rowH + 22}" text-anchor="middle" font-size="16" fill="#5f6f7f">${p}</text>`;
      TR.forEach((t, i) => { const y = top + i * rowH, by = y + 24, bh = 26, my = by + bh / 2; s += `<text x="${L}" y="${y + 18}" font-size="17" font-weight="600" fill="#16263a">${esc(t.t)}: ${f1(t.mean)} %</text><rect x="${L}" y="${by}" width="${X(t.mean) - L}" height="${bh}" rx="4" fill="${t.k === "none" ? "#b4504f" : "#e2c43a"}" stroke="#7a5a12"/><line x1="${X(t.min)}" y1="${my}" x2="${X(t.max)}" y2="${my}" stroke="#16263a" stroke-width="2.4"/><line x1="${X(t.min)}" y1="${my - 9}" x2="${X(t.min)}" y2="${my + 9}" stroke="#16263a" stroke-width="2.4"/><line x1="${X(t.max)}" y1="${my - 9}" x2="${X(t.max)}" y2="${my + 9}" stroke="#16263a" stroke-width="2.4"/>`; });
      s += `<text x="${W / 2}" y="${H - 6}" text-anchor="middle" font-size="16" font-weight="700" fill="#16263a">Mean % of plants with mosaic at 8 weeks (black bar = range of 4 plots)</text>`;
      return s + "</svg>"; };
    const p3 = q("p3"); p3.innerHTML = `<p class="small"><strong>Part 3. Evaluate control methods</strong> <span class="badge">stretch</span> (disease control is not in the specification, but it uses the ideas that are). HYPOTHETICAL trial, modelled on the kind of experiment run in the UAE by El Hamalawi and Al Masoum (1999): squash grown in plots exposed to aphid-borne, non-persistent mosaic viruses (ZYMV, WMV and CMV), 4 plots per treatment, scored 8 weeks after planting. The numbers are invented to show patterns reported in the sources; they are not that study's results.</p>
      <div class="figure"><div class="fig-view">${bars()}</div></div>${tbl(TR.map((x) => [esc(x.t), x.plots.join(", "), f1(x.mean), `${x.min} to ${x.max}`, String(x.yield)]), ["Treatment", "% plants with mosaic in each plot", "Mean / %", "Range / %", "Marketable yield / kg per plot"])}
      <details class="small mt"><summary>Things to think about</summary><ul><li>Which treatments stop aphids landing or probing, and which only kill them afterwards?</li><li>Is the resistant variety resistant to every virus present?</li><li>Do the ranges overlap? Is 4 plots enough?</li><li>Row covers must come off when squash flowers need insect pollinators; reflective mulch works best while plants are small.</li><li>Would combining methods (integrated control) work better than any one?</li></ul></details><div data-r="q3" class="mt"></div>`;
    renderQs(part(3), $('[data-r="q3"]', p3));
    tabs(q("tabs"), ["1. Symptoms", "2. Patterns of spread", "3. Control trial (stretch)"], (i) => { ["p1", "p2", "p3"].forEach((k, j) => (q(k).hidden = j !== i)); });
  };
})(window.BIO);
