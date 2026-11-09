window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, el, $, $$, icons, esc } = B.util;

  B.views.lab = function (n, variant) {
    if (n) return practicalPage(+n, variant === "alt");
    const tiles = B.spec.practicals.map((p) => { const c = B.practicals[p.n] || { status: "not_started" }; return h`<a class="tile" href="#/lab/${p.n}"><span class="ref">Required practical ${p.n} · ${p.unit} · ${p.level}</span><h3>${p.title}</h3><div class="meta">${raw(B.views.lib.statusBadge(c.status))}${c.sim ? raw('<span class="badge teal">simulation</span>') : ""}</div></a>`; }).join("");
    B.app.render(h`<div class="page-head"><div><div class="eyebrow">Virtual Practical Laboratory</div><h1>The ten required practicals</h1><p class="lede">Practical skills are assessed only in the written papers, so you must understand the method, variables, errors and analysis of each. Simulations here let you explore the variables; they supplement, and do not replace, the hands-on practicals you do in school.</p></div></div>
      <div class="notice mb"><strong>Source.</strong> Titles follow section 3 of the specification; methods draw on the OxfordAQA 9610 Practical handbook (2019). Papers can ask directly about these procedures and about the skills they contain.</div>
      <div class="grid grid-2">${raw(tiles)}</div>`, { title: "Virtual lab", crumbs: [{ label: "Virtual lab" }] });
  };

  function practicalPage(n, alt = false) {
    const p = B.spec.practicals.find((x) => x.n === n); const c = (alt ? (B.practicalAlts || {})[n] : B.practicals[n]) || { status: "not_started" };
    if (!p) return B.app.render("<div class='card'>Unknown practical.</div>");
    const key = alt ? `${n}c` : n; // results storage key; the alternative method keeps its runs separately
    migrateRuns(n);
    const links = p.links.map((r) => h`<a class="badge mono" href="#/topic/${r}">${r}</a>`).join(" ");
    if (c.status === "not_started") {
      return B.app.render(h`<div class="page-head"><div><div class="eyebrow">Required practical ${n} · ${p.level}</div><h1>${p.title}</h1><div class="row">${raw(B.views.lib.statusBadge(c.status))} ${raw(links)}</div></div></div>
        <div class="card"><div class="empty">${raw(icons.lab)}<h3>This practical page has not been built yet</h3><p>The title and specification links above are verified. The full page (method, variables, safety, simulation, data analysis and exam questions) will follow in Phase 5.</p></div></div>`, { title: `RP${n}`, crumbs: [{ label: "Virtual lab", href: "#/lab" }, { label: `RP${n}` }] });
    }
    const list = (arr) => `<ul>${arr.map((x) => h`<li>${x}</li>`).join("")}</ul>`;
    const html = el(h`<div>
      <div class="page-head"><div><div class="eyebrow">Required practical ${n} · ${p.level} · Unit ${p.unit.split(".")[1]}</div><h1>${p.title}</h1><div class="row">${raw(B.views.lib.statusBadge(c.status))} ${raw(links)}</div></div></div>
      ${alt ? raw(h`<div class="notice amber mb"><strong>${c.altTitle}.</strong> ${c.altNote} <a href="#/lab/${n}">Back to the handbook method</a>.</div>`) : c.handbook ? raw(h`<p class="small muted mb">Method follows the ${c.handbook}.</p>`) : ""}
      <div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="method">Method &amp; theory</button>${c.planQuestions ? raw('<button role="tab" aria-selected="false" data-tab="plan">Plan &amp; variables</button>') : ""}<button role="tab" aria-selected="false" data-tab="sim">Virtual experiment</button>${c.sim ? raw('<button role="tab" aria-selected="false" data-tab="calc">Calculate</button>') : ""}<button role="tab" aria-selected="false" data-tab="analysis">Analysis &amp; evaluation</button><button role="tab" aria-selected="false" data-tab="questions">Exam questions</button></div>
      <div class="pane" data-pane="method"><div class="stack">
        <div class="card"><h3>Aim</h3><p>${c.aim}</p><h3 class="mt">Scientific background</h3><div class="notes">${raw(c.background)}</div></div>
        <div class="grid grid-2"><div class="card"><h3>Apparatus</h3>${raw(list(c.apparatus))}</div><div class="card"><h3>Variables</h3><p><strong>Independent:</strong> ${c.variables.independent}</p><p><strong>Dependent:</strong> ${c.variables.dependent}</p><strong>Control:</strong>${raw(list(c.variables.control))}</div></div>
        <div class="card"><h3>Method</h3><ol>${raw(c.method.map((x) => h`<li>${x}</li>`).join(""))}</ol></div>
        <div class="card"><h3>Risk assessment and safety</h3>${raw(list(c.safety))}${c.risk ? raw(`<table class="tbl mt"><thead><tr><th>Hazard</th><th>Risk</th><th>Control measure</th></tr></thead><tbody>${c.risk.map((r) => h`<tr><td>${r.hazard}</td><td>${r.risk}</td><td>${r.control}</td></tr>`).join("")}</tbody></table>`) : ""}</div>
        ${c.alternatives ? raw(h`<div class="card"><h3>${c.alternativesTitle || "Alternative methods and extensions"}</h3><p class="small muted">${c.alternativesNote || "Exam questions may describe any of these variants of the practical."}</p>${raw(list(c.alternatives))}</div>`) : ""}
        ${n === 1 && alt ? raw(`<div class="grid grid-2">${B.views.photo("water-bath")}${B.views.photo("gas-syringe")}</div>`) : n === 1 ? raw(`<div class="grid grid-2">${B.views.photo("water-bath")}${B.views.photo("test-tubes-pipette")}</div>`) : n === 2 ? raw(`<div class="grid grid-2">${B.views.photo("potato-osmometer")}${B.views.photo("onion-plasmolysed-lm")}</div>`) : n === 3 ? raw(`<div class="grid grid-2">${B.views.photo("chromatography-apparatus")}${B.views.photo("chromatogram-photo")}</div><div class="grid grid-2 mt">${B.views.photo("leaf-pigments")}<figure class="figure">${B.variationArt.apparatus()}<figcaption>Schematic of the apparatus (this site's drawing).</figcaption></figure></div>`) : ""}</div></div>
      ${c.planQuestions ? raw(`<div class="pane" data-pane="plan" hidden><div class="card mb"><h3>Before you start</h3><p class="small">Identify the apparatus, classify the variables and decide what makes the test fair. Every question here is marked and counts towards ${p.links[0]}.</p></div><div id="planq"></div></div>`) : ""}
      ${c.sim ? raw(`<div class="pane" data-pane="calc" hidden><div id="calc"></div></div>`) : ""}
      <div class="pane" data-pane="sim" hidden><div class="card"><div class="card-head"><h3>Virtual experiment</h3><span class="badge amber">model, not measured data</span></div><p class="small muted">${c.simNote}</p><div id="sim"></div></div></div>
      <div class="pane" data-pane="analysis" hidden><div class="stack"><div class="card"><h3>Analysis and interpretation</h3><div class="notes">${raw(c.analysis)}</div></div><div class="grid grid-2"><div class="card"><h3>Sources of error and limitations</h3>${raw(list(c.errors))}</div><div class="card"><h3>Improvements</h3>${raw(list(c.improvements))}</div></div></div></div>
      <div class="pane" data-pane="questions" hidden><div id="pq"></div>${c.assessment ? raw(h`<div class="card mt"><div class="card-head"><h3>${c.assessment.title}</h3><span class="badge teal">${c.assessment.marks} marks</span></div><p class="small muted">${c.assessment.intro}</p><div id="pa"></div></div>`) : ""}</div>
    </div>`);
    B.app.render(html, { title: alt ? `RP${n} alternative` : `RP${n}`, crumbs: alt ? [{ label: "Virtual lab", href: "#/lab" }, { label: `RP${n}`, href: `#/lab/${n}` }, { label: "Alternative method" }] : [{ label: "Virtual lab", href: "#/lab" }, { label: `RP${n}` }] });
    const tabs = $$('[role="tab"]', html); tabs.forEach((b) => b.addEventListener("click", () => { tabs.forEach((x) => x.setAttribute("aria-selected", x === b)); $$(".pane", html).forEach((pn) => (pn.hidden = pn.dataset.pane !== b.dataset.tab)); }));
    [...(c.questions || []), ...(c.evalQuestions || [])].forEach((q) => $("#pq", html).append(B.questions.render(q)));
    if (c.assessment) c.assessment.questions.forEach((q) => $("#pa", html).append(B.questions.render(q)));
    (c.planQuestions || []).forEach((q) => $("#planq", html).append(B.questions.render(q)));
    if (c.sim === "enzyme") { enzymeSim($("#sim", html), key); calcTab($("#calc", html), key); }
    if (c.sim === "trypsin") { trypsinSim($("#sim", html), key); calcTabTrypsin($("#calc", html), key); }
    if (!alt && (B.practicalAlts || {})[n]) $("#sim", html).insertAdjacentHTML("afterend", h`<div class="notice mt"><strong>${B.practicalAlts[n].altTitle}.</strong> A separate virtual bench for this method, with its own results and questions: <a href="#/lab/${n}/alt">open the alternative method</a>.</div>`);
    if (c.sim === "osmosis") { osmosisSim($("#sim", html), key); calcTabOsmosis($("#calc", html), key); }
    if (c.sim === "chroma") { chromaSim($("#sim", html), key); calcTabChroma($("#calc", html), key); }
  }

  // Catalase runs saved before RP1 followed the handbook (trypsin) belong to the alternative-method page.
  function migrateRuns(n) {
    if (n !== 1) return; const st = B.store.get(); const runs = st.labRuns[1]; if (!runs || !runs.length) return;
    const old = runs.filter((r) => r.init !== undefined && !r.times); if (!old.length) return;
    st.labRuns["1c"] = [...(st.labRuns["1c"] || []), ...old]; st.labRuns[1] = runs.filter((r) => !(r.init !== undefined && !r.times)); B.store.save();
  }
  // ---------- RP1 (handbook exemplar): trypsin bench (js/views/bench-trypsin.js), results table ----------
  const tMean = (r) => { const ok = r.times.filter((x) => x !== null); return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null; };
  const errNames = (e) => [e.noEquil && "no equilibration", e.dyed && "dyed buffer", e.shake && "shaken, not inverted"].filter(Boolean);
  function trypsinSim(host, n) {
    host.innerHTML = `
      <div id="bench-host"></div>
      <h3 class="mt">Results table</h3><p class="small muted">Each temperature adds a row with your three times. Work out the means and rates in the Calculate tab, where they are checked. Rows with method problems are flagged so you can see their effect.</p>
      <div id="table"></div>
      <div class="row mt"><button class="btn sm" id="clear">Clear results table</button></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    function table() {
      if (!runs.length) { $("#table", host).innerHTML = '<p class="muted small">No temperatures run yet.</p>'; return; }
      $("#table", host).innerHTML = `<table><tr><th>#</th><th>Temperature / °C</th><th>pH</th><th>Trypsin / %</th><th>Tube 1 / s</th><th>Tube 2 / s</th><th>Tube 3 / s</th><th>Method</th></tr>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${r.T}</td><td>${r.pH}</td><td>${r.E}</td>${r.times.map((t) => `<td>${t === null ? "not clear after 10 min" : t}</td>`).join("")}<td>${errNames(r.errors).length ? `<span style="color:var(--rose-ink)">${errNames(r.errors).join("; ")}</span>` : "as handbook"}</td></tr>`).join("")}</table>`;
    }
    B.views.benchTrypsin($("#bench-host", host), n, (r) => { runs.push({ ts: Date.now(), ...r }); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    $("#clear", host).addEventListener("click", () => { if (confirm("Clear all saved results for this practical?")) { runs.length = 0; B.store.save(); table(); document.dispatchEvent(new Event("labrun")); } });
    table(); document.addEventListener("labrun", table);
  }
  // ---------- RP1 Calculate tab: mean (anomalies), rate = 1000 ÷ time, plot rate against temperature, optimum ----------
  function calcTabTrypsin(host, n) {
    const runsOf = () => (B.store.get().labRuns[n] || []);
    function render() {
      const runs = runsOf();
      if (!runs.length) { host.innerHTML = `<div class="card"><div class="empty">${B.util.icons.lab}<h3>No results yet</h3><p>Run the virtual experiment at one or more temperatures first, then come back to calculate means and rates.</p></div></div>`; return; }
      const opts = runs.map((r, i) => `<option value="${i}">#${i + 1} ${r.T} °C${errNames(r.errors).length ? " (method problem)" : ""}${r.done ? " ✓" : ""}</option>`).join("");
      host.innerHTML = `
        <div class="card mb"><h3>1 Mean time and rate</h3><p class="small muted">Check the three times first: a time far from the other two is anomalous and should be left out of the mean (and repeated). <span class="badge">platform convention</span> This site flags a time more than 25 % from the mean of the other two (when those two agree within 15 %); this is the site's convention, not an OxfordAQA rule, and any reasoned rule applied consistently is acceptable. Then rate = 1000 ÷ mean time, in ×10⁻³ s⁻¹ (1 decimal place). Tubes that did not clear within 10 minutes cannot be included.</p>
          <div class="row"><label class="small">Row: <select id="tr-run">${opts}</select></label></div><div id="tr-vals" class="small mt"></div>
          <div class="row mt"><label class="small">Mean time / s <input id="tr-mean" type="number" step="0.1" style="width:6rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"></label><label class="small">Rate / ×10⁻³ s⁻¹ <input id="tr-rate" type="number" step="0.1" style="width:6rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"></label><button class="btn sm" id="tr-check">Check</button><span id="tr-fb" class="small"></span></div></div>
        <div class="card mb"><h3>2 Rate against temperature</h3><p class="small muted">Rows you have calculated correctly are plotted (method-problem rows are shown in red). Describe the trend, then estimate the optimum.</p><div id="tr-plot"></div>
          <div class="row mt"><label class="small">Your estimate of the optimum / °C <input id="tr-opt" type="number" step="1" style="width:5rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"></label><button class="btn sm" id="tr-optcheck">Check</button><span id="tr-optfb" class="small"></span></div></div>
        <div class="card"><h3>3 Interpreting the graph</h3><ul class="small"><li>Rate rises with temperature up to the optimum: more kinetic energy, more frequent successful collisions, more enzyme–substrate complexes per second.</li><li>Above the optimum, trypsin denatures: bonds in the tertiary structure break, the active site changes shape and fewer complexes form.</li><li>With readings 10 °C apart you can only say the optimum lies between the temperatures either side of the highest rate; use smaller intervals there to locate it.</li><li>Rate = 1 ÷ time assumes the same amount of casein has been digested at every end point, which needs identical volumes, concentrations and X.</li></ul></div>`;
      const cur = () => runs[+$("#tr-run", host).value];
      // Anomaly rule: a time more than 25 % from the mean of the other two, when those two agree within 15 %. A time
      // 15-35 % away is borderline: keeping it or leaving it out are both accepted (alt), and the feedback says which.
      const summarise = (use, t) => { const mean = use.reduce((a, b) => a + b, 0) / use.length; return { use, mean: +mean.toFixed(1), rate: +(1000 / mean).toFixed(1), anomaly: use.length < t.length }; };
      const truth = (r) => { const t = r.times.filter((x) => x !== null); if (!t.length) return null; let use = t, altUse = null, border = null; if (t.length === 3) { const info = t.map((v, i) => { const o = t.filter((_, j) => j !== i); const m = (o[0] + o[1]) / 2; return { dev: Math.abs(v - m) / m, agree: Math.abs(o[0] - o[1]) / m < 0.15 }; }); const flag = info.map((x) => x.agree && x.dev > 0.25); if (flag.filter(Boolean).length === 1) use = t.filter((_, i) => !flag[i]); const cand = info.map((x, i) => (x.agree && x.dev > 0.15 ? i : -1)).filter((i) => i >= 0); if (cand.length === 1 && info[cand[0]].dev <= 0.35) { border = { value: t[cand[0]], pct: Math.round(info[cand[0]].dev * 100) }; altUse = use.length < t.length ? t : t.filter((_, i) => i !== cand[0]); } } const out = summarise(use, t); out.alt = altUse ? summarise(altUse, t) : null; out.border = border; return out; };
      const vals = () => { const r = cur(); $("#tr-vals", host).innerHTML = `Times at ${r.T} °C: <strong>${r.times.map((t) => (t === null ? "not clear" : t + " s")).join(", ")}</strong>.${errNames(r.errors).length ? ` <span style="color:var(--rose-ink)">Method problems in this row: ${errNames(r.errors).join("; ")}.</span>` : ""}`; $("#tr-fb", host).textContent = ""; };
      $("#tr-run", host).addEventListener("change", vals); vals();
      $("#tr-check", host).addEventListener("click", () => { const r = cur(), tr = truth(r); if (!tr) { $("#tr-fb", host).innerHTML = `<span style="color:var(--rose-ink)">No tube cleared within 10 minutes, so there is no time to average: record "no clearing within 10 minutes" (the enzyme was denatured or the reaction too slow).</span>`; return; }
        const m = +$("#tr-mean", host).value, rt = +$("#tr-rate", host).value; const matchAlt = !!tr.alt && Math.abs(m - tr.mean) > 0.6 && Math.abs(m - tr.alt.mean) <= 0.6; const ex = matchAlt ? tr.alt : tr; const okM = Math.abs(m - ex.mean) <= 0.6, okR = Math.abs(rt - ex.rate) <= 0.15 || (okM && Math.abs(rt - 1000 / m) <= 0.15);
        const bnote = tr.border ? ` ${tr.border.value} s is ${tr.border.pct} % from the mean of the other two: a borderline case, so leaving it out or keeping it are both accepted (the other choice gives a mean of ${(matchAlt ? tr : tr.alt).mean} s). Say which you did and why.` : "";
        $("#tr-fb", host).innerHTML = okM && okR ? `<span style="color:var(--sage-ink)">✓ Mean ${ex.mean} s${ex.anomaly ? " (anomalous time left out)" : ""}; rate ${ex.rate} ×10⁻³ s⁻¹.${bnote}</span>` : `<span style="color:var(--rose-ink)">Not quite.${!okM ? ` ${tr.border ? `${tr.border.value} s is borderline: you may keep it or leave it out, then a` : tr.anomaly ? "One time is anomalous: leave it out, then a" : "A"}dd the times and divide by how many you used.` : ""}${!okR ? " Rate = 1000 ÷ your mean time." : ""}</span>`;
        if (okM && okR) { r.done = true; B.store.save(); draw(); } });
      const draw = () => { const done = runs.filter((r) => r.done && truth(r)); if (!done.length) { $("#tr-plot", host).innerHTML = '<p class="small muted">Calculate at least one row to see it plotted.</p>'; return; }
        const pts = done.map((r) => ({ x: r.T, y: truth(r).rate, bad: errNames(r.errors).length > 0 })).sort((a, b) => a.x - b.x);
        const W = 560, H = 280, pl = 56, pr = 16, pt = 14, pb = 44, ymax = Math.max(16, ...pts.map((p) => p.y)) * 1.1; const X = (t) => pl + ((t - 10) / 60) * (W - pl - pr), Y = (v) => pt + (1 - v / ymax) * (H - pt - pb);
        let g = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:10px" role="img" aria-label="graph of rate against temperature">`;
        for (let t = 10; t <= 70; t += 10) g += `<line x1="${X(t)}" y1="${pt}" x2="${X(t)}" y2="${H - pb}" stroke="#eef2f5"/><text x="${X(t)}" y="${H - pb + 16}" font-size="11" text-anchor="middle" fill="#6b7d8f">${t}</text>`;
        const step = ymax > 30 ? 10 : 2; for (let v = 0; v <= ymax; v += step) g += `<line x1="${pl}" y1="${Y(v)}" x2="${W - pr}" y2="${Y(v)}" stroke="#eef2f5"/><text x="${pl - 6}" y="${Y(v) + 4}" font-size="11" text-anchor="end" fill="#6b7d8f">${v}</text>`;
        g += `<line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="#16263a"/><line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" stroke="#16263a"/><text x="${(W + pl) / 2}" y="${H - 6}" font-size="12" text-anchor="middle" fill="#16263a">temperature / °C</text><text x="14" y="${(H - pb) / 2}" font-size="12" text-anchor="middle" fill="#16263a" transform="rotate(-90 14 ${(H - pb) / 2})">rate / ×10⁻³ s⁻¹</text>`;
        const good = pts.filter((p) => !p.bad); if (good.length > 1) g += `<polyline points="${good.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}" fill="none" stroke="#1f8a85" stroke-width="2"/>`;
        pts.forEach((p) => { const c = p.bad ? "#b4504f" : "#1f8a85"; g += `<line x1="${X(p.x) - 5}" y1="${Y(p.y) - 5}" x2="${X(p.x) + 5}" y2="${Y(p.y) + 5}" stroke="${c}" stroke-width="2"/><line x1="${X(p.x) - 5}" y1="${Y(p.y) + 5}" x2="${X(p.x) + 5}" y2="${Y(p.y) - 5}" stroke="${c}" stroke-width="2"/>`; });
        $("#tr-plot", host).innerHTML = g + "</svg>"; };
      draw();
      $("#tr-optcheck", host).addEventListener("click", () => { const good = runs.filter((r) => r.done && truth(r) && !errNames(r.errors).length).map((r) => ({ T: r.T, rate: truth(r).rate })); const v = +$("#tr-opt", host).value; const fb = $("#tr-optfb", host);
        if (good.length < 3) { fb.innerHTML = `<span style="color:var(--rose-ink)">Calculate at least three temperatures (without method problems) first, including some either side of the fastest.</span>`; return; }
        const byT = {}; good.forEach((g2) => { (byT[g2.T] = byT[g2.T] || []).push(g2.rate); }); const ts = Object.keys(byT).map(Number).sort((a, b) => a - b); const best = ts.reduce((a, t) => (Math.max(...byT[t]) > Math.max(...byT[a]) ? t : a), ts[0]); const i = ts.indexOf(best); const lo = i > 0 ? ts[i - 1] : best, hi = i < ts.length - 1 ? ts[i + 1] : best;
        if (ts.length < 3) { fb.innerHTML = `<span style="color:var(--rose-ink)">Your calculated rows cover only ${ts.length === 1 ? "one temperature" : "two temperatures"}. Run at least three different temperatures, including some either side of the fastest.</span>`; return; }
        if (i === 0 || i === ts.length - 1) { const top = i === ts.length - 1, ok = top ? v >= best : v <= best; fb.innerHTML = ok ? `<span style="color:var(--sage-ink)">✓ The fastest rate was at the ${top ? "highest" : "lowest"} temperature you tested (${best} °C), so your data only show that the optimum is at or ${top ? "above" : "below"} ${best} °C. Run ${top ? "higher" : "lower"} temperatures to find where the rate starts to fall.</span>` : `<span style="color:var(--rose-ink)">Not supported by your data: the fastest rate was at ${best} °C, the ${top ? "highest" : "lowest"} temperature you tested, so the optimum could be at or ${top ? "above" : "below"} ${best} °C. Run ${top ? "higher" : "lower"} temperatures to find out.</span>`; return; }
        fb.innerHTML = v >= lo && v <= hi ? `<span style="color:var(--sage-ink)">✓ Your data put the optimum between ${lo} and ${hi} °C (fastest at ${best} °C). To locate it more precisely, run more temperatures in that range.</span>` : `<span style="color:var(--rose-ink)">Not supported by your data: the fastest rate was at ${best} °C, so the optimum lies between ${lo} and ${hi} °C.</span>`; });
    }
    render();
    document.addEventListener("labrun", render);
  }
  // ---------- Enzyme practical: animated bench (js/views/bench.js) + results table and plotting ----------
  function enzymeSim(host, n) {
    host.innerHTML = `
      <div id="bench-host"></div>
      <h3 class="mt">Results table</h3><p class="small muted">Each run adds a row. Repeat a setting to get replicates, then compute the mean. Initial rate is the volume at 30 s × 2 (cm³ min⁻¹).</p>
      <div id="table"></div>
      <div class="row mt"><label class="small">Plot initial rate against: <select id="xvar"><option value="temp">temperature</option><option value="ph">pH</option><option value="sub">substrate concentration</option><option value="enz">enzyme concentration</option></select></label><button class="btn sm" id="plot">Plot means</button><button class="btn sm" id="clear">Clear results table</button></div>
      <div id="plotout" class="mt"></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    function table() {
      if (!runs.length) { $("#table", host).innerHTML = '<p class="muted small">No runs yet.</p>'; return; }
      $("#table", host).innerHTML = `<table><tr><th>#</th><th>T / °C</th><th>pH</th><th>[S] / %</th><th>Enzyme</th><th>30 s</th><th>60 s</th><th>120 s</th><th>180 s</th><th>Initial rate / cm³ min⁻¹</th><th>Note</th></tr>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${r.T}</td><td>${r.pH.toFixed(1)}</td><td>${r.S}</td><td>×${r.E}</td><td>${r.series[1].y}</td><td>${r.series[2].y}</td><td>${r.series[4].y}</td><td>${r.series[6].y}</td><td>${r.init}</td><td class="tiny muted">${r.full ? "syringe full at " + r.full + " s" : ""}</td></tr>`).join("")}</table>`;
    }
    function plot() {
      const key = $("#xvar", host).value; const map = { temp: "T", ph: "pH", sub: "S", enz: "E" }; const k = map[key];
      const groups = {}; runs.forEach((r) => { const kk = r[k]; const other = ["T", "pH", "S", "E"].filter((x) => x !== k).map((x) => r[x]).join("|"); groups[kk] = groups[kk] || {}; groups[kk][other] = groups[kk][other] || []; groups[kk][other].push(r.init); });
      // Only use runs where the other variables match the most common combination (fair test)
      const combos = {}; runs.forEach((r) => { const other = ["T", "pH", "S", "E"].filter((x) => x !== k).map((x) => r[x]).join("|"); combos[other] = (combos[other] || 0) + 1; });
      const best = Object.entries(combos).sort((a, b) => b[1] - a[1])[0]; if (!best) { $("#plotout", host).innerHTML = '<p class="muted small">Run some experiments first.</p>'; return; }
      const pts = Object.entries(groups).map(([x, byOther]) => { const vals = byOther[best[0]]; if (!vals) return null; return { x: +x, y: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1), n: vals.length }; }).filter(Boolean).sort((a, b) => a.x - b.x);
      const excluded = runs.length - pts.reduce((a, p) => a + p.n, 0);
      $("#plotout", host).innerHTML = `<p class="small"><strong>Mean initial rate against ${$("#xvar", host).selectedOptions[0].text}</strong> (${pts.length} setting${pts.length === 1 ? "" : "s"}; ${excluded ? excluded + " run(s) excluded because other variables differed, keeping the test fair" : "all runs used"})</p>` + B.charts.line(pts, { xLabel: $("#xvar", host).selectedOptions[0].text, yLabel: "initial rate / cm³ min⁻¹", width: 560, height: 240 }) + `<p class="tiny muted">Replicates per point: ${pts.map((p) => p.n).join(", ")}. A fair comparison needs at least 3 replicates per setting.</p>`;
    }
    B.views.bench($("#bench-host", host), n, (r) => { runs.push({ ts: Date.now(), ...r }); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); }); $("#plot", host).addEventListener("click", plot);
    $("#clear", host).addEventListener("click", () => { if (confirm("Clear all saved runs for this practical?")) { runs.length = 0; B.store.save(); table(); $("#plotout", host).innerHTML = ""; } });
    table();
  }

  // ---------- Osmosis practical (RP2): animated bench (js/views/bench-osmosis.js) + results table ----------
  const pctOf = (r) => +(((r.m1 - r.m0) / r.m0) * 100).toFixed(1);
  // Replicate statistics shared by the Sim-tab plot and the Calculate tab. Chips are grouped by immersion time and
  // then by concentration (time is a control variable, so chips left for different times are never averaged together).
  // A chip is flagged as anomalous when it is more than 3 percentage points from the median of its group, and only
  // when the unflagged chips are a clear majority: a group is never emptied, and a group of two is never flagged.
  // The same anomaly-excluded mean is used to check step 2, the plotted points and the isotonic estimate.
  const osmoGroup = (rows) => {
    const v = rows.map(pctOf); let flags = v.map(() => false);
    if (v.length >= 3) { const s = [...v].sort((a, b) => a - b), k = s.length; const mid = k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; const f = v.map((x) => Math.abs(x - mid) > 3); if (f.filter((x) => !x).length > k / 2) flags = f; }
    const kept = v.filter((_, i) => !flags[i]); return { rows, v, flags, mean: kept.reduce((a, b) => a + b, 0) / kept.length };
  };
  const osmoStats = (runs) => {
    const byT = {}; runs.filter((r) => r.pctOk).forEach((r) => { const t = r.minutes || 20; byT[t] = byT[t] || {}; byT[t][r.C] = byT[t][r.C] || []; byT[t][r.C].push(r); });
    const times = Object.keys(byT).map(Number).sort((a, b) => a - b); const count = (t) => Object.values(byT[t]).reduce((a, g) => a + g.length, 0);
    const main = times.reduce((best, t) => (best === null || count(t) > count(best) || (count(t) === count(best) && t === 20) ? t : best), null);
    const groupsAt = (t) => { const out = {}; Object.entries(byT[t] || {}).forEach(([C, rows]) => { out[C] = osmoGroup(rows); }); return out; };
    return { times, main, groupsAt };
  };
  function osmosisSim(host, n) {
    host.innerHTML = `
      <div id="bench-host"></div>
      <h3 class="mt">Results table</h3><p class="small muted">Each chip adds a row. The balance gives you the masses; you work out the change and the percentage change in the Calculate tab, where your answers are checked. Three chips per concentration give a mean.</p>
      <div id="table"></div>
      <div class="row mt"><button class="btn sm" id="plot">Plot mean % change against concentration</button><button class="btn sm" id="clear">Clear results table</button></div>
      <div id="plotout" class="mt"></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    function table() {
      if (!runs.length) { $("#table", host).innerHTML = '<p class="muted small">No chips yet.</p>'; return; }
      $("#table", host).innerHTML = `<table><tr><th>#</th><th>Sucrose / mol dm⁻³</th><th>Time / min</th><th>Initial mass / g</th><th>Final mass / g</th><th>Change / g</th><th>% change</th><th>Note</th></tr>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${r.C.toFixed(1)}</td><td>${r.minutes}</td><td>${r.m0.toFixed(2)}</td><td>${r.m1.toFixed(2)}</td><td>${r.pctOk ? (r.m1 - r.m0 >= 0 ? "+" : "") + (r.m1 - r.m0).toFixed(2) : "<span class='muted'>calculate</span>"}</td><td>${r.pctOk ? (pctOf(r) >= 0 ? "+" : "") + pctOf(r).toFixed(1) : "<span class='muted'>calculate</span>"}</td><td class="tiny muted">${r.blotted ? "" : "not blotted"}</td></tr>`).join("")}</table>`;
    }
    function plot() {
      const done = runs.filter((r) => r.pctOk); if (!done.length) { $("#plotout", host).innerHTML = '<p class="muted small">Calculate the percentage change for at least one chip first (Calculate tab).</p>'; return; }
      const S = osmoStats(runs), groups = S.groupsAt(S.main);
      const pts = Object.entries(groups).map(([C, g]) => ({ x: +C, y: +g.mean.toFixed(1), n: g.v.length - g.flags.filter(Boolean).length })).sort((a, b) => a.x - b.x);
      $("#plotout", host).innerHTML = `<p class="small"><strong>Mean percentage change in mass against sucrose concentration</strong> after ${S.main} min (${pts.length} concentration${pts.length === 1 ? "" : "s"}; chips used per point: ${pts.map((p) => p.n).join(", ")}; anomalous chips left out)${S.times.length > 1 ? `. Chips immersed for other times are not included, because immersion time is a control variable.` : ""}</p>` + B.charts.line(pts, { xLabel: "sucrose concentration / mol dm⁻³", yLabel: "mean % change in mass", width: 560, height: 260 }) + `<p class="tiny muted">The curve crosses 0 % where the solution and the tissue have the same water potential. Use the Calculate tab to plot the points yourself and estimate that concentration.</p>`;
    }
    B.views.benchOsmosis($("#bench-host", host), n, (r) => { runs.push({ ts: Date.now(), ...r }); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    $("#plot", host).addEventListener("click", plot);
    $("#clear", host).addEventListener("click", () => { if (confirm("Clear all saved chips for this practical?")) { runs.length = 0; B.store.save(); table(); $("#plotout", host).innerHTML = ""; } });
    table(); document.addEventListener("labrun", table);
  }
  // ---------- RP2 Calculate tab: change and % change per chip, means, plot your own points, isotonic estimate ----------
  function calcTabOsmosis(host, n) {
    const runsOf = () => (B.store.get().labRuns[n] || []);
    let plotMin = null; // immersion time whose means are plotted in step 3
    function render() {
      const runs = runsOf();
      if (!runs.length) { host.innerHTML = `<div class="card"><div class="empty">${B.util.icons.lab}<h3>No chips yet</h3><p>Run the virtual experiment first: cut, weigh, immerse and re-weigh at least one chip, then come back to calculate.</p></div></div>`; return; }
      const todo = runs.map((r, i) => ({ r, i })).filter((x) => !x.r.pctOk);
      const S = osmoStats(runs); if (!S.times.includes(plotMin)) plotMin = S.main;
      const groups = plotMin === null ? {} : S.groupsAt(plotMin); // anomaly-excluded means for the plotted time
      const concs = Object.keys(groups).map(Number).sort((a, b) => a - b);
      const meanRows = S.times.flatMap((t) => { const gs = S.groupsAt(t); return Object.keys(gs).map(Number).sort((a, b) => a - b).map((C) => { const g = gs[C]; return `<tr><td>${C.toFixed(1)}</td><td>${t}</td><td>${g.v.map((x, i) => `<span class="${g.flags[i] ? "badge amber" : ""}">${x >= 0 ? "+" : ""}${x.toFixed(1)}${g.rows[i].blotted ? "" : " (unblotted)"}</span>`).join(", ")}</td><td data-mean="${g.mean.toFixed(2)}" data-allmean="${(g.v.reduce((a, b) => a + b, 0) / g.v.length).toFixed(2)}" data-flagged="${g.flags.some(Boolean) ? 1 : 0}" class="omean">${g.v.length < 3 ? `<span class="tiny muted">${g.v.length} of 3 replicates</span>` : "<span class='muted'>enter yours</span>"}</td><td><input type="number" step="0.1" class="omin" style="width:5rem;padding:.3rem .4rem;border:1px solid var(--line-strong);border-radius:8px"> <button class="btn sm omcheck">Check</button></td></tr>`; }); }).join("");
      host.innerHTML = `
        <div class="card mb"><h3>1 Change in mass and percentage change</h3><p class="small muted">For each chip: change = final − initial (keep the sign); percentage change = change ÷ initial mass × 100, to 1 decimal place. Percentage change is used because the chips do not all start with the same mass.</p>
          ${todo.length ? `<div class="row"><label class="small">Chip: <select id="orun">${todo.map((x) => `<option value="${x.i}">#${x.i + 1}: ${x.r.m0.toFixed(2)} g → ${x.r.m1.toFixed(2)} g in ${x.r.C.toFixed(1)} mol dm⁻³</option>`).join("")}</select></label><label class="small">Change: <input id="och" type="number" step="0.01" style="width:5.5rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"> g</label><label class="small">% change: <input id="opc" type="number" step="0.1" style="width:5.5rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"> %</label><button class="btn sm" id="ocheck">Check</button></div><div id="ofb" class="small mt"></div>` : `<p class="small" style="color:var(--sage-ink)">✓ All ${runs.length} chips calculated.</p>`}</div>
        <div class="card mb"><h3>2 Means and anomalies</h3><p class="small muted">Group the chips by concentration (and by immersion time, if you used more than one). With three or more chips, a replicate is flagged (amber) when it is more than 3 percentage points from the middle value of its group; an unblotted chip is the usual culprit. Leave flagged values out of the mean. <span class="badge">platform convention</span> This flagging rule is this site's convention, not an OxfordAQA rule: any reasoned rule applied consistently is acceptable, and if you keep a flagged value the mean of all the chips is also accepted here.</p>
          ${meanRows ? `<table class="tbl"><thead><tr><th>Sucrose / mol dm⁻³</th><th>Time / min</th><th>% change of each chip</th><th>Mean % change</th><th>Your mean</th></tr></thead><tbody>${meanRows}</tbody></table>` : '<p class="muted small">Calculate some percentage changes first.</p>'}</div>
        <div class="card mb"><h3>3 Plot your points and find the isotonic concentration</h3><p class="small muted">Click on the grid to place each mean (or type it in the boxes), then check. The model curve and the concentration at which there is no change in mass are revealed when your points are right. Reading that concentration from the graph gives the water potential of the tissue: it equals the water potential of a sucrose solution of that concentration. Plot the means from step 2 (anomalies left out) for one immersion time only.</p>
          ${S.times.length > 1 ? `<div class="row mb"><label class="small">Immersion time to plot: <select id="otime">${S.times.map((t) => `<option value="${t}" ${t === plotMin ? "selected" : ""}>${t} min</option>`).join("")}</select></label></div>` : plotMin !== null ? `<p class="small">Plotting chips immersed for ${plotMin} min.</p>` : ""}
          <div class="row">${B.labModels.osmosisConcs.map((C) => `<label class="tiny">${C.toFixed(1)}: <input type="number" step="0.1" class="opt" data-c="${C}" style="width:4.2rem;padding:.25rem .3rem;border:1px solid var(--line-strong);border-radius:6px"></label>`).join("")}<button class="btn sm" id="pcheck">Check my plot</button></div>
          <div id="pgraph" class="mt"></div><div id="pfb" class="small mt"></div>
          <div class="row mt" id="isoRow" hidden><label class="small">Concentration where % change = 0: <input id="iso" type="number" step="0.01" style="width:5.5rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"> mol dm⁻³</label><button class="btn sm" id="isocheck">Check</button><span id="isofb"></span></div></div>
        <div class="card"><h3>4 Interpreting the graph</h3><ul class="small"><li>Positive values: the solution had a higher water potential than the tissue, so water entered by osmosis and the chips gained mass.</li><li>Negative values: the solution had a lower water potential, water left, mass fell.</li><li>Where the line crosses zero there was no net movement: the sucrose solution and the potato tissue have the same water potential. Convert with Ψ = −iCRT (i = 1 for sucrose, R = 8.31, T in kelvin).</li><li>The isotonic point is a property of <em>this</em> tissue on <em>this</em> day: different potatoes, sweet potatoes or carrots give different values, and so do the same potatoes after storage.</li></ul></div>`;
      // 1 check change and % change
      const oc = $("#ocheck", host); if (oc) oc.addEventListener("click", () => { const r = runs[+$("#orun", host).value]; const ch = +$("#och", host).value, pc = +$("#opc", host).value; const tch = +(r.m1 - r.m0).toFixed(2), tpc = pctOf(r); const okc = Math.abs(ch - tch) < 0.006, okp = Math.abs(pc - tpc) <= 0.15; if (okc && okp) { r.pctOk = true; B.store.save(); document.dispatchEvent(new Event("labrun")); render(); return; } $("#ofb", host).innerHTML = `<span style="color:var(--rose-ink)">${okc ? "Change correct. " : "Change: final − initial, keep the sign (a loss is negative). "}${okp ? "" : "Percentage change: change ÷ initial mass × 100, to 1 d.p."}</span>`; });
      // 2 means
      $$(".omcheck", host).forEach((b) => b.addEventListener("click", () => { const tr = b.closest("tr"); const cell = $(`.omean[data-mean]`, tr); const m = +cell.dataset.mean, mAll = +cell.dataset.allmean, flagged = cell.dataset.flagged === "1"; const raw = $(".omin", tr).value; const v = +raw; const keptAll = flagged && raw.trim() !== "" && Math.abs(v - mAll) <= 0.15 && Math.abs(v - m) > 0.15; if (keptAll) { cell.innerHTML = `<span style="color:var(--sage-ink)">✓ ${mAll >= 0 ? "+" : ""}${mAll.toFixed(1)} % with every chip kept (accepted). Leaving out the flagged chip gives ${m >= 0 ? "+" : ""}${m.toFixed(1)} %; the plot uses that value.</span>`; return; } cell.innerHTML = raw.trim() !== "" && Math.abs(v - m) <= 0.15 ? `<span style="color:var(--sage-ink)">✓ ${m >= 0 ? "+" : ""}${m.toFixed(1)} %</span>` : `<span style="color:var(--rose-ink)">not quite (exclude flagged values, 1 d.p.)</span>`; }));
      // 3 plot
      const W = 560, H = 280, padL = 56, padR = 16, padT = 14, padB = 44; const X = (c) => padL + (c / 1) * (W - padL - padR), Y = (p) => padT + ((25 - p) / 50) * (H - padT - padB);
      const placedPts = {}; let revealed = false;
      const draw = () => { let g = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:10px" role="img" aria-label="grid for plotting mean percentage change against sucrose concentration" id="pgsvg">`; for (let c = 0; c <= 1.001; c += 0.1) g += `<line x1="${X(c)}" y1="${padT}" x2="${X(c)}" y2="${H - padB}" stroke="#eef1f4"/>`; for (let p = -25; p <= 25; p += 5) g += `<line x1="${padL}" y1="${Y(p)}" x2="${W - padR}" y2="${Y(p)}" stroke="${p === 0 ? "#6b7d8f" : "#eef1f4"}"/>`; for (let c = 0; c <= 1.001; c += 0.2) g += `<text x="${X(c)}" y="${H - padB + 16}" font-size="10" text-anchor="middle" fill="#3c4f63">${c.toFixed(1)}</text>`; for (let p = -20; p <= 20; p += 10) g += `<text x="${padL - 6}" y="${Y(p) + 3}" font-size="10" text-anchor="end" fill="#3c4f63">${p > 0 ? "+" : ""}${p}</text>`; g += `<text x="${(padL + W - padR) / 2}" y="${H - 6}" font-size="11" text-anchor="middle" fill="#16263a">sucrose concentration / mol dm⁻³</text><text x="12" y="${H / 2}" font-size="11" text-anchor="middle" fill="#16263a" transform="rotate(-90 12 ${H / 2})">mean % change in mass</text>`;
        if (revealed) { const pts = B.enzymeModel.range(0, 1, 40).map((c) => `${X(c)},${Y(B.transportModel.massChangePct(c, { minutes: plotMin || 20 }))}`).join(" "); g += `<polyline points="${pts}" fill="none" stroke="#1f8a8a" stroke-width="2" stroke-dasharray="5 4"/><text x="${X(0.62)}" y="${Y(-12)}" font-size="10" fill="#1f8a8a">model curve (${plotMin || 20} min)</text>`; }
        Object.entries(placedPts).forEach(([c, p]) => { g += `<g><line x1="${X(+c) - 5}" y1="${Y(p) - 5}" x2="${X(+c) + 5}" y2="${Y(p) + 5}" stroke="#b4504f" stroke-width="2"/><line x1="${X(+c) - 5}" y1="${Y(p) + 5}" x2="${X(+c) + 5}" y2="${Y(p) - 5}" stroke="#b4504f" stroke-width="2"/></g>`; });
        g += "</svg>"; $("#pgraph", host).innerHTML = g;
        $("#pgsvg", host).addEventListener("click", (e) => { const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H; const c = Math.round(((x - padL) / (W - padL - padR)) * 5) / 5; if (c < 0 || c > 1) return; const p = +(25 - ((y - padT) / (H - padT - padB)) * 50).toFixed(1); placedPts[c] = p; $(`.opt[data-c="${c}"]`, host).value = p; draw(); }); };
      $$(".opt", host).forEach((inp) => inp.addEventListener("input", () => { if (inp.value === "") delete placedPts[+inp.dataset.c]; else placedPts[+inp.dataset.c] = +inp.value; draw(); }));
      draw();
      const ot = $("#otime", host); if (ot) ot.addEventListener("change", () => { plotMin = +ot.value; render(); });
      $("#pcheck", host).addEventListener("click", () => { const means = {}; concs.forEach((C) => { means[C] = groups[C].mean; }); const have = Object.keys(means); if (have.length < 3) { $("#pfb", host).innerHTML = `<span style="color:var(--rose-ink)">You need means for at least three concentrations (three chips each is best) before a line can be drawn.</span>`; return; } const wrong = have.filter((C) => placedPts[C] === undefined || Math.abs(placedPts[C] - means[C]) > 1.5); if (wrong.length) { $("#pfb", host).innerHTML = `<span style="color:var(--rose-ink)">Check the point${wrong.length > 1 ? "s" : ""} at ${wrong.map((c) => (+c).toFixed(1)).join(", ")} mol dm⁻³ against your means in step 2 for ${plotMin} min, with anomalies left out (within 1.5 percentage points).</span>`; return; } revealed = true; draw(); const xs = have.map(Number).sort((a, b) => a - b); let iso = null; for (let i = 0; i < xs.length - 1; i++) { const a = means[xs[i]], b = means[xs[i + 1]]; if ((a >= 0 && b <= 0) || (a <= 0 && b >= 0)) { iso = a === b ? xs[i] : xs[i] + (a / (a - b)) * (xs[i + 1] - xs[i]); break; } } host.dataset.iso = iso === null ? "" : iso.toFixed(2); $("#pfb", host).innerHTML = `<span style="color:var(--sage-ink)">✓ Points plotted correctly. ${iso === null ? "Your concentrations do not bracket zero: include a concentration on each side of the crossing point." : "Now read off where your line crosses 0 % (interpolate between the two nearest points)."}</span>`; if (iso !== null) $("#isoRow", host).removeAttribute("hidden"); });
      $("#isocheck", host).addEventListener("click", () => { const t = +host.dataset.iso, v = +$("#iso", host).value; const psi = B.transportModel.psiSolute(v, 1, 303); $("#isofb", host).innerHTML = Math.abs(v - t) <= 0.05 ? `<span style="color:var(--sage-ink)">✓ About ${t} mol dm⁻³. Ψ of that solution at 30 °C = −1 × ${v} × 8.31 × 303 ≈ ${Math.round(psi)} kPa, so the tissue's water potential is about ${Math.round(psi)} kPa.</span>` : `<span style="color:var(--rose-ink)">Interpolate between the last positive and first negative mean: the crossing is where the straight line between them meets 0 %.</span>`; });
    }
    render();
    document.addEventListener("labrun", render);
  }
  // ---------- Chromatography practical (RP3): animated bench (js/views/bench-chroma.js), results table, explorer ----------
  const errList = (e) => [e.inkOrigin && "ink origin", e.above && "sample below solvent level", e.touching && "paper touching tube", e.wrongRef && "measured from paper edge", e.lateMark && "front marked late"].filter(Boolean);
  function chromaSim(host, n) {
    const M = B.chromaModel, A = B.variationArt;
    host.innerHTML = `
      <div id="bench-host"></div>
      <h3 class="mt">Results table</h3><p class="small muted">Each chromatogram adds a row with the distances you read from the ruler. Work out the Rf values in the Calculate tab, where they are checked. Click <em>Diagnose</em> on a row to see which method decisions affected it.</p>
      <div id="table"></div>
      <div class="row mt"><button class="btn sm" id="clear">Clear results table</button></div>
      <div class="card mt"><div class="card-head"><h3>Chromatogram Explorer</h3><span class="badge amber">model, not measured data</span></div><p class="small muted">Compare two leaf extracts run correctly in the same solvent (same conditions, so the Rf of a given pigment is similar on both strips) or in different solvents (the same pigment moves differently). Band intensity shows how much of each pigment the leaf contains. Rf values in the model fall within ranges reported for paper chromatography, but there is <strong>no universal Rf for a pigment</strong>: it depends on the paper, solvent, temperature and saturation of the tube, so published tables are a guide, never an answer key.</p>
        <div class="row"><label class="small">Strip 1: <select id="ex-l1">${Object.entries(M.LEAVES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("")}</select> in <select id="ex-s1">${Object.entries(M.SOLVENTS).map(([k, v]) => `<option value="${k}">${esc(v.label)}${k === "nonpolar" ? "" : " (extension: not the handbook solvent)"}</option>`).join("")}</select></label>
        <label class="small">Strip 2: <select id="ex-l2">${Object.entries(M.LEAVES).map(([k, v]) => `<option value="${k}" ${k === "autumn" ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select> in <select id="ex-s2">${Object.entries(M.SOLVENTS).map(([k, v]) => `<option value="${k}">${esc(v.label)}${k === "nonpolar" ? "" : " (extension: not the handbook solvent)"}</option>`).join("")}</select></label></div>
        <div class="grid grid-2 mt" id="ex-out"></div><div id="ex-note" class="small mt"></div></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    function table() {
      if (!runs.length) { $("#table", host).innerHTML = '<p class="muted small">No chromatograms yet.</p>'; return; }
      $("#table", host).innerHTML = `<table><tr><th>#</th><th>Leaf</th><th>Solvent</th><th>Front / mm</th><th>Bands (distance / mm, top to bottom)</th><th>Rf done</th><th></th></tr>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.leafLabel)}</td><td>${esc(r.solventLabel.split(" (")[0])}</td><td>${r.dipped ? "—" : r.frontRead}</td><td>${r.dipped ? '<em class="muted">no bands: extract dissolved into the solvent</em>' : r.bands.map((b) => `<span style="display:inline-block;width:.7em;height:.7em;border-radius:2px;background:${b.colour};vertical-align:middle"></span> ${esc(b.name.split(" (")[0])} ${b.readMm}`).join("; ")}</td><td>${r.bands.filter((b) => b.rfOk).length}/${r.bands.length}</td><td><button class="btn sm diag" data-i="${i}">Diagnose</button></td></tr>${r.diag ? `<tr><td></td><td colspan="6" class="small">${errList(r.errors).length ? `<strong>Method problems in this run:</strong> ${errList(r.errors).join("; ")}. ${r.errors.inkOrigin ? "The ink dyes separated into extra bands that are not leaf pigments. " : ""}${r.errors.above ? "With the origin below the solvent the extract dissolved straight into the solvent instead of travelling up the paper. " : ""}${r.errors.touching ? "Where paper touches the glass the solvent runs unevenly, smearing bands and making the front irregular. " : ""}${r.errors.wrongRef ? "Both distances must be measured from the origin; measuring from the paper edge adds the same 20 mm (the origin is 2 cm above the bottom edge) to every band and the front, so every Rf is wrong (and not by the same factor). " : ""}${r.errors.lateMark ? "The front was not marked at once, so after evaporation its position was guessed; every Rf calculated from it is too high. " : ""}` : "<strong>No method problems detected</strong> in this run: pencil origin, solvent below the origin, paper hung clear, front marked at once, distances from the origin."}</td></tr>` : ""}`).join("")}</table>`;
      $$(".diag", host).forEach((b) => b.addEventListener("click", () => { runs[+b.dataset.i].diag = !runs[+b.dataset.i].diag; B.store.save(); table(); }));
    }
    function explorer() {
      const l1 = $("#ex-l1", host).value, s1 = $("#ex-s1", host).value, l2 = $("#ex-l2", host).value, s2 = $("#ex-s2", host).value;
      const r1 = M.run({ leaf: l1, solvent: s1, seed: 11 }), r2 = M.run({ leaf: l2, solvent: s2, seed: 12 });
      const cell = (r) => `<div>${A.chromatogram(r, { frontMm: 100, height: 340, label: M.LEAVES[r.leaf].label.split(" (")[0] })}<table class="tbl small"><thead><tr><th>Band</th><th>Rf</th></tr></thead><tbody>${r.bands.map((b) => `<tr><td><span style="display:inline-block;width:.7em;height:.7em;border-radius:2px;background:${b.colour};vertical-align:middle"></span> ${esc(b.name)}</td><td>${b.rf.toFixed(2)}</td></tr>`).join("")}</tbody></table></div>`;
      $("#ex-out", host).innerHTML = cell(r1) + cell(r2);
      const shared = r1.bands.filter((b) => r2.bands.some((c) => c.key === b.key));
      $("#ex-note", host).innerHTML = s1 === s2 ? `<strong>Same solvent:</strong> for pigments present on both strips the Rf values are similar (e.g. ${shared.slice(0, 2).map((b) => `${esc(b.name.split(" (")[0])} ${b.rf.toFixed(2)} v ${r2.bands.find((c) => c.key === b.key).rf.toFixed(2)}`).join("; ")}), because Rf depends on the pigment–solvent–paper combination, not on the leaf. Differences between the leaves show in <em>which</em> bands are present and how intense they are: that is the interspecific (or intraspecific) variation the practical reveals.` : `<strong>Different solvents:</strong> the same pigment has a different Rf in each (e.g. ${shared.slice(0, 2).map((b) => `${esc(b.name.split(" (")[0])} ${b.rf.toFixed(2)} v ${r2.bands.find((c) => c.key === b.key).rf.toFixed(2)}`).join("; ")}), so Rf values can only be compared between runs made with the same solvent and paper under the same conditions.`;
    }
    B.views.benchChroma($("#bench-host", host), n, (r) => { runs.push({ ts: Date.now(), ...r }); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    $("#clear", host).addEventListener("click", () => { if (confirm("Clear all saved chromatograms for this practical?")) { runs.length = 0; B.store.save(); table(); } });
    $$("#ex-l1,#ex-s1,#ex-l2,#ex-s2", host).forEach((s) => s.addEventListener("change", explorer));
    table(); explorer(); document.addEventListener("labrun", table);
  }
  // ---------- RP3 Calculate tab: Rf calculator with checking, comparison investigation, evaluation ----------
  function calcTabChroma(host, n) {
    const M = B.chromaModel, A = B.variationArt;
    const runsOf = () => (B.store.get().labRuns[n] || []);
    function render() {
      const runs = runsOf(); const usable = runs.map((r, i) => ({ r, i })).filter((x) => !x.r.dipped);
      const sel = usable.map(({ r, i }) => `<option value="${i}">#${i + 1} ${esc(r.leafLabel.split(" (")[0])}, ${esc(r.solventLabel.split(" (")[0])}</option>`).join("");
      host.innerHTML = `
        <div class="card mb"><h3>1 Rf calculator</h3><p class="small muted">Rf = distance moved by the pigment ÷ distance moved by the solvent front, both measured from the origin. Rf has no units and is always less than 1. Give your answer to 2 decimal places.</p>
          ${usable.length ? `<div class="row"><label class="small">Chromatogram: <select id="rf-run">${sel}</select></label><label class="small">Band: <select id="rf-band"></select></label></div><div id="rf-vals" class="small mt"></div><div class="row mt"><label class="small">Your Rf: <input id="rf-in" type="number" step="0.01" min="0" max="2" style="width:6rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"></label><button class="btn sm" id="rf-check">Check</button><span id="rf-fb" class="small"></span></div>` : `<div class="empty">${B.util.icons.lab}<h3>No measurable chromatograms yet</h3><p>Run the virtual experiment (with the solvent below the origin!) and measure at least one strip.</p></div>`}
          <details class="small mt"><summary>Practise on any measurements (measuring tool)</summary><div class="row"><label class="small">Pigment distance / mm <input id="rf-d" type="number" value="42" style="width:5rem"></label><label class="small">Front distance / mm <input id="rf-f" type="number" value="90" style="width:5rem"></label><button class="btn sm" id="rf-any">Calculate</button><span id="rf-anyout"></span></div></details></div>
        <div class="card mb"><h3>2 Comparison investigation</h3><p class="small muted">Compare the Rf of one pigment across your runs. In the same solvent it should be similar whichever leaf it came from (small differences are chance and measurement); in a different solvent it will differ. Runs with method errors are flagged so you can see what they did to the values.</p><div id="cmp"></div></div>
        <div class="card"><h3>3 Evaluation prompts</h3><ul class="small"><li>Which of your runs had the most reliable Rf values, and what in the method made them reliable?</li><li>Why can you not identify a pigment from its Rf alone using a table from a textbook?</li><li>Two leaves gave the same bands at the same Rf but of different intensity: what does that show about variation between the leaves?</li><li>Which pigment did not move from the origin in the non-polar solvent, and what does that tell you about its solubility?</li><li>Suggest why the front slows as it climbs, and why the paper should be removed before the front reaches the top.</li></ul></div>`;
      if (usable.length) {
        const cur = () => runs[+$("#rf-run", host).value];
        const bands = () => { const r = cur(); $("#rf-band", host).innerHTML = r.bands.map((b, j) => `<option value="${j}">${esc(b.name)}${b.rfOk ? " ✓" : ""}</option>`).join(""); vals(); };
        const vals = () => { const r = cur(), b = r.bands[+$("#rf-band", host).value]; $("#rf-vals", host).innerHTML = `Band distance recorded: <strong>${b.readMm} mm</strong>; solvent front recorded: <strong>${r.frontRead} mm</strong>.${errList(r.errors).length ? ` <span style="color:var(--rose-ink)">This run had method problems (${errList(r.errors).join("; ")}); the recorded values may not be the true distances from the origin.</span>` : ""}`; $("#rf-fb", host).textContent = ""; };
        $("#rf-run", host).addEventListener("change", bands); $("#rf-band", host).addEventListener("change", vals); bands();
        $("#rf-check", host).addEventListener("click", () => { const r = cur(), j = +$("#rf-band", host).value, b = r.bands[j]; const v = +$("#rf-in", host).value; const fromRecorded = M.rf(b.readMm, r.frontRead); const ok = Math.abs(v - fromRecorded) <= 0.011;
          let fb = ok ? `<span style="color:var(--sage-ink)">✓ ${fromRecorded.toFixed(2)} from your recorded distances (${b.readMm} ÷ ${r.frontRead}).</span>` : `<span style="color:var(--rose-ink)">Not quite: divide the band distance by the front distance (${b.readMm} ÷ ${r.frontRead}).</span>`;
          if (ok && (r.errors.wrongRef || r.errors.lateMark || r.errors.touching)) fb += ` <span style="color:var(--amber-ink)">${Math.abs(fromRecorded - b.trueRf) < 0.005 ? `The true Rf of this band was about ${b.trueRf.toFixed(2)}, so your value happens to match it this time, but with these method problems you could not have known that: the measurements are not reliable.` : `But because of the method problems, the true Rf of this band was about ${b.trueRf.toFixed(2)}: your value is ${fromRecorded > b.trueRf ? "too high" : "too low"}.`}</span>`;
          if (ok && b.artefact) fb += ` <span style="color:var(--amber-ink)">This band is ink from the origin line, not a leaf pigment.</span>`;
          if (ok && v >= 1) fb += ` <span style="color:var(--amber-ink)">An Rf of 1 or more is impossible for a correctly measured band: something in the method is wrong.</span>`;
          if (ok) { b.rfOk = true; B.store.save(); } $("#rf-fb", host).innerHTML = fb; });
        $("#rf-any", host).addEventListener("click", () => { const d = +$("#rf-d", host).value, f = +$("#rf-f", host).value; $("#rf-anyout", host).textContent = f > 0 ? ` Rf = ${d} ÷ ${f} = ${M.rf(d, f).toFixed(2)}${d > f ? " (impossible: the pigment cannot travel further than the solvent)" : ""}` : " Front distance must be positive."; });
        // comparison
        const keys = [...new Set(usable.flatMap(({ r }) => r.bands.filter((b) => !b.artefact).map((b) => b.key)))];
        $("#cmp", host).innerHTML = `<div class="row"><label class="small">Pigment: <select id="cmp-p">${keys.map((k) => `<option value="${k}">${esc(M.PIG[k].name)}</option>`).join("")}</select></label></div><div id="cmp-out" class="mt"></div>`;
        const cmp = () => { const k = $("#cmp-p", host).value; const rows = usable.filter(({ r }) => r.bands.some((b) => b.key === k)).map(({ r, i }) => { const b = r.bands.find((x) => x.key === k); return { i, r, b, rf: M.rf(b.readMm, r.frontRead) }; });
          const bySolv = {}; rows.forEach((x) => (bySolv[x.r.solvent] = bySolv[x.r.solvent] || []).push(x));
          $("#cmp-out", host).innerHTML = `<table class="tbl small"><thead><tr><th>Run</th><th>Leaf</th><th>Solvent</th><th>Rf from your readings</th><th>Method</th></tr></thead><tbody>${rows.map((x) => `<tr><td>#${x.i + 1}</td><td>${esc(x.r.leafLabel.split(" (")[0])}</td><td>${esc(x.r.solventLabel.split(" (")[0])}</td><td>${x.rf.toFixed(2)}</td><td>${errList(x.r.errors).length ? `<span style="color:var(--rose-ink)">${errList(x.r.errors).join("; ")}</span>` : "clean"}</td></tr>`).join("")}</tbody></table>` + Object.entries(bySolv).map(([s, xs]) => { const clean = xs.filter((x) => !errList(x.r.errors).length); if (clean.length < 2) return ""; const v = clean.map((x) => x.rf); const spread = Math.max(...v) - Math.min(...v); return `<p class="small">${esc(M.SOLVENTS[s].label.split(" (")[0])}: ${clean.length} clean runs, Rf ${Math.min(...v).toFixed(2)}–${Math.max(...v).toFixed(2)} (spread ${spread.toFixed(2)}): ${spread <= 0.08 ? "consistent, as expected for one pigment in one solvent, whatever the leaf." : "wider than expected; check the measurements."}</p>`; }).join("") + (Object.keys(bySolv).length > 1 ? `<p class="small">The same pigment gives different Rf values in the two solvents: Rf is a property of the pigment <em>and</em> the solvent system, not of the pigment alone.</p>` : ""); };
        $("#cmp-p", host).addEventListener("change", cmp); if (keys.length) cmp();
      }
    }
    render();
    document.addEventListener("labrun", render);
  }
  // ---------- Calculate tab: replicates, means, anomalies, initial rate by tangent ----------
  // Uses the student's own saved runs (store.labRuns[n]). The tangent tool lets the student choose a gradient and
  // compares it with the model's true initial gradient (first second of the per-second trace, converted to cm3 min-1).
  function calcTab(host, n) {
    const runsOf = () => (B.store.get().labRuns[n] || []);
    const key = (r) => `${r.T} °C · pH ${(+r.pH).toFixed(1)} · ${r.S}% · enzyme ×${r.E}`;
    function render() {
      const runs = runsOf();
      if (!runs.length) { host.innerHTML = `<div class="card"><div class="empty">${B.util.icons.lab}<h3>No runs yet</h3><p>Run the virtual experiment at least twice at the same setting, then come back to calculate means and initial rates.</p></div></div>`; return; }
      const groups = {}; runs.forEach((r, i) => { (groups[key(r)] = groups[key(r)] || []).push({ ...r, i }); });
      const opts = Object.entries(groups).map(([k, g]) => `<option value="${esc(k)}">${esc(k)} (${g.length} run${g.length === 1 ? "" : "s"})</option>`).join("");
      host.innerHTML = `
        <div class="card mb"><h3>1 Replicates, mean and anomalies</h3><p class="small muted">Choose a setting. A replicate is flagged as a possible anomaly when it differs from the mean of the others by more than 15%. Decide whether to exclude it before taking the mean.</p>
          <div class="row"><label class="small">Setting: <select id="cg">${opts}</select></label></div><div id="cgout" class="mt"></div>
          <div class="row mt"><label class="small">Your mean initial rate: <input id="cmean" type="number" step="0.1" style="width:6rem;padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px"> cm³ min⁻¹</label><button class="btn sm" id="ccheck">Check</button><span id="cfb" class="small"></span></div></div>
        <div class="card mb"><h3>2 Initial rate from a tangent</h3><p class="small muted">The initial rate is the gradient of the volume–time curve at t = 0. Pick a run, then set the gradient of the tangent until the line just touches the curve at the origin without crossing it.</p>
          <div class="row"><label class="small">Run: <select id="crun">${runs.map((r, i) => `<option value="${i}">#${i + 1} ${esc(key(r))}</option>`).join("")}</select></label><label class="small">Tangent gradient: <strong><span id="cgv">10</span> cm³ min⁻¹</strong><input type="range" id="cgrad" min="0" max="160" step="0.5" value="10" style="width:220px;accent-color:var(--teal)"></label><button class="btn sm" id="ctcheck">Check my tangent</button></div>
          <div id="cchart" class="mt"></div><div id="ctfb" class="small mt"></div></div>
        <div class="card"><h3>3 Interpreting the gradient</h3><ul class="small"><li>Units: volume ÷ time, e.g. cm³ min⁻¹ (or cm³ s⁻¹ × 60).</li><li>The curve is steepest at the start because the substrate concentration is highest; it flattens as substrate is used up, not because the enzyme is used up.</li><li>Comparing conditions by the volume at a fixed late time underestimates fast reactions (they run out of substrate or fill the syringe); compare initial rates instead.</li><li>Plot mean initial rate against the independent variable and describe the trend with values before explaining it.</li></ul></div>`;
      const group = () => groups[$("#cg", host).value];
      const showGroup = () => { const g = group(); const rates = g.map((r) => r.init); const flags = rates.map((v, i) => { const others = rates.filter((_, j) => j !== i); if (others.length < 2) return false; const m = others.reduce((a, b) => a + b, 0) / others.length; return Math.abs(v - m) / m > 0.15; }); const kept = rates.filter((_, i) => !flags[i]); const mean = kept.reduce((a, b) => a + b, 0) / kept.length; host.dataset.mean = mean.toFixed(1);
        $("#cgout", host).innerHTML = `<table class="tbl"><thead><tr><th>Run</th><th>30 s</th><th>60 s</th><th>120 s</th><th>180 s</th><th>Initial rate / cm³ min⁻¹</th><th></th></tr></thead><tbody>${g.map((r, i) => `<tr><td>#${r.i + 1}</td><td>${r.series[1].y}</td><td>${r.series[2].y}</td><td>${r.series[4].y}</td><td>${r.series[6].y}</td><td><strong>${r.init}</strong></td><td>${flags[i] ? '<span class="badge amber">possible anomaly</span>' : ""}${r.full ? '<span class="badge">syringe full</span>' : ""}</td></tr>`).join("")}</tbody></table><p class="tiny muted mt">${g.length < 3 ? "Fewer than three replicates: run the setting again for a reliable mean." : flags.some(Boolean) ? "One value has been flagged; the suggested mean excludes it. If you can explain the anomaly (e.g. gas lost before the bung was fitted) exclude it, otherwise repeat the run." : "The replicates agree closely."}</p>`; };
      $("#cg", host).addEventListener("change", showGroup); showGroup();
      $("#ccheck", host).addEventListener("click", () => { const v = +$("#cmean", host).value, m = +host.dataset.mean; $("#cfb", host).innerHTML = Math.abs(v - m) <= 0.6 ? `<span style="color:var(--sage-ink)">✓ ${m} cm³ min⁻¹ (anomalies excluded).</span>` : `<span style="color:var(--rose-ink)">Not quite. Add the initial rates you are keeping and divide by how many there are; one decimal place.</span>`; });
      const drawTangent = () => { const r = runs[+$("#crun", host).value]; const g = +$("#cgrad", host).value; $("#cgv", host).textContent = g.toFixed(1); const pts = r.series; const ymax = Math.max(40, ...pts.map((p) => p.y)) * 1.15;
        $("#cchart", host).innerHTML = B.enzymeArt.graph({ xLabel: "time / s", yLabel: "volume of O₂ / cm³", xmax: 180, ymax, xticks: 6, width: 560, height: 300, curves: [{ pts, color: "#1f8a8a" }, { pts: [{ x: 0, y: 0 }, { x: 180, y: (g / 60) * 180 }], color: "#b4504f", dash: "6 4", label: "tangent" }], marks: pts.map((p) => ({ x: p.x, y: p.y, color: "#1f8a8a" })), aria: "volume against time with an adjustable tangent at the origin" }); };
      $("#crun", host).addEventListener("change", drawTangent); $("#cgrad", host).addEventListener("input", drawTangent); drawTangent();
      $("#ctcheck", host).addEventListener("click", () => { const r = runs[+$("#crun", host).value]; const g = +$("#cgrad", host).value; const first = r.series[1].y * 2; const lo = first, hi = (r.v0 ? r.v0 * 1.12 : first * 1.35); $("#ctfb", host).innerHTML = g < lo * 0.9 ? `<span style="color:var(--rose-ink)">Too shallow: your line crosses into the curve. The curve is steepest at t = 0, so the tangent must be at least as steep as the first 30 s average (${first.toFixed(1)} cm³ min⁻¹).</span>` : g > hi ? `<span style="color:var(--rose-ink)">Too steep: the line leaves the curve immediately. Lower it until it just touches the curve at the origin.</span>` : `<span style="color:var(--sage-ink)">✓ Reasonable tangent: initial rate ≈ ${g.toFixed(1)} cm³ min⁻¹. Notice it is a little higher than the 30 s average (${first.toFixed(1)}) because the rate is already falling during the first 30 s.</span>`; });
    }
    render();
    document.addEventListener("labrun", render);
  }
})(window.BIO);
