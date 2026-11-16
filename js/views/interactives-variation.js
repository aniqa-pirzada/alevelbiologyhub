// Interactives for 3.1.6 Living organisms vary. Kinds: samplingSim, normalExplorer.
// Models are in data/content/_variation-art.js (B.statsModel) and are documented there, in KNOWN_LIMITATIONS.md and in
// SCIENTIFIC_ACCURACY_AUDIT.md. Release review 2026-11-15: the question-only banks (variationIdentify, dataInterpret) became
// ordinary page questions, the SD calculator became a static worked example and "Genes, Environment or Both?"
// (geneEnvInvestigation) became two static tables in the notes; model details for
// developers are kept in these comments, and students see one plain "simplified model" line.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, raw, el, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || (B.store.get().prefs || {}).reducedMotion;
  const head = (spec, badge = "schematic") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const S = () => B.statsModel, A = () => B.variationArt;
  const slider = (id, label, min, max, step, val, unit = "") => `<label class="small">${label}: <strong><span id="${id}v">${val}</span>${unit}</strong><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:150px;accent-color:var(--teal)"></label>`;

  // ---------- 3. Sampling Investigation Simulator ----------
  // Model (developer notes, not shown to students): shell lengths are drawn from a normal distribution (mean 30 mm, SD 4 mm)
  // with a shore gradient of ±3 mm across the width, so the whole population's SD is about 4.4 to 4.5 mm. Random sampling
  // uses B.statsModel.rng (seeded; without replacement); systematic takes every k-th individual from a random start;
  // convenience takes those nearest the path; deliberate takes the largest. The spread of random sample means falls in
  // proportion to 1/√n, but a single larger sample is not guaranteed to be closer than a smaller one.
  const minus = (v, dp = 2) => (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(v).toFixed(dp);
  B.interactives.samplingSim = function (spec, host) {
    const seedParam = spec.seed; // tests pass a seed for reproducibility; students get a clock seed
    const pop = S().population({ seed: 20261102 });
    const lo = pop.mean - 3.5 * pop.sd, hi = pop.mean + 3.5 * pop.sd; const colour = (v) => { const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); return `hsl(${200 - 160 * t} 60% ${45 - 10 * t}%)`; };
    const grad = `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map((t) => `hsl(${200 - 160 * t} 60% ${45 - 10 * t}%)`).join(", ")})`;
    const stage = `<p class="small" style="margin-top:0"><strong>The population:</strong> ${pop.N} limpets on a rocky shore. The population mean is shown (<strong>${pop.mean} mm</strong>) only so that you can judge your samples; in a real investigation it is unknown, which is why you sample.</p>
      <svg id="sp-pop" viewBox="0 0 500 300" style="width:100%;display:block;background:#eef6fb;border-radius:10px" role="img" aria-label="population of limpets as dots on a shore; sampled individuals ringed"></svg>
      <div class="small" style="display:flex;align-items:center;gap:.5rem;margin-top:.35rem"><span>smaller</span><span aria-hidden="true" style="flex:1;max-width:220px;height:12px;border-radius:6px;background:${grad}"></span><span>larger</span><span class="muted">(dot colour = shell length)</span></div>
      <p class="tiny muted" style="margin:.3rem 0 0">Access path on the left. The smaller limpets in this shore are near the path: a pattern that a careless sampler walks into.</p>`;
    const panel = `<label class="small">Sampling method <select id="sp-method"><option value="random">random (random coordinates)</option><option value="systematic">systematic (every k-th limpet)</option><option value="convenience">convenience (nearest the path)</option><option value="deliberate">deliberate (biggest-looking)</option></select></label>
      ${slider("sp-n", "Sample size n", 5, 100, 5, 20)}
      <div class="row"><button class="btn sm primary" id="sp-take">Take one sample</button><button class="btn sm" id="sp-many">Take 20 samples</button><button class="btn sm" id="sp-clear">Clear</button></div>
      <div id="sp-out" class="small"></div>`;
    host.innerHTML = head(spec, "simplified model") + B.ix.split(stage, panel, { label: "Sampling controls" }) + `
      <div class="card mt"><h4>Sample means so far</h4><div id="sp-hist"></div><p class="small" id="sp-sum"></p></div>
      <p class="tiny muted mt">This is a simplified model: real shores and real measurements vary more.</p>`;
    const svg = $("#sp-pop", host);
    let means = [], last = null, lastMethod = "random", r = S().rng(seedParam || (Date.now() >>> 0));
    const drawPop = () => { svg.innerHTML = `<rect x="0" y="0" width="30" height="300" fill="#e6d8b8"/>` + A().T(19, 150, "path", { s: 15, c: "#5c4e22", r: -90 }) + pop.individuals.map((d) => `<circle cx="${30 + d.x * 465}" cy="${d.y * 290 + 5}" r="4.2" fill="${colour(d.v)}" ${last && last.some((s) => s.i === d.i) ? 'stroke="#16263a" stroke-width="2"' : ""}/>`).join(""); };
    const hist = () => { if (!means.length) { $("#sp-hist", host).innerHTML = '<p class="small muted">No samples yet.</p>'; $("#sp-sum", host).textContent = ""; return; } $("#sp-hist", host).innerHTML = A().dotPlot(means, { mu: pop.mean, lo: 22, hi: 40, height: 100, colour: "#1e3a5f" }); const m = S().mean(means), sdm = means.length > 1 ? S().sd(means) : 0;
      const zero = means.length > 1 && sdm < 0.005 && (lastMethod === "convenience" || lastMethod === "deliberate");
      $("#sp-sum", host).textContent = `${means.length} sample mean${means.length === 1 ? "" : "s"}: mean of the means ${m.toFixed(2)} mm (population ${pop.mean} mm); spread of the means (SD) ${sdm.toFixed(2)} mm. Blue line: mean of your sample means; red dashed line: population mean.` + (zero ? " The spread is 0 because this method picks the same limpets every time, so repeating it cannot reveal or reduce the bias." : ""); };
    const take = (quiet) => { const n = +$("#sp-n", host).value, method = $("#sp-method", host).value; lastMethod = method; const s = S().sample(pop, n, method, r); last = s; const vals = s.map((d) => d.v); const m = S().mean(vals); means.push(+m.toFixed(2)); if (!quiet) { drawPop(); $("#sp-out", host).innerHTML = `<p>Sample of <strong>${n}</strong> by <strong>${method}</strong> sampling: mean <strong>${m.toFixed(2)} mm</strong> (population ${pop.mean}; difference ${minus(m - pop.mean)} mm).</p><p>${method === "random" ? "Every limpet had the same chance of being chosen, so the only reason this mean differs from the population mean is chance. Repeat and watch the means scatter either side of it." : method === "systematic" ? "Systematic sampling spreads the sample across the shore; with no pattern in the limpets that matches the interval, it is unbiased." : method === "convenience" ? "You sampled the limpets nearest the path, where they are smaller: the mean is biased low, and taking more of them will not fix it." : "You chose the biggest: a biased sample that overestimates the mean however many you take. Your judgement, not chance, decided who was measured."}</p>`; } hist(); };
    $("#sp-n", host).addEventListener("input", () => ($("#sp-nv", host).textContent = $("#sp-n", host).value)); $("#sp-take", host).addEventListener("click", () => take(false)); $("#sp-many", host).addEventListener("click", () => { for (let k = 0; k < 19; k++) take(true); take(false); }); $("#sp-clear", host).addEventListener("click", () => { means = []; last = null; drawPop(); hist(); $("#sp-out", host).innerHTML = ""; });
    drawPop(); hist(); host.dataset.popMean = pop.mean;
  };

  // ---------- 4. Normal Distribution Explorer ----------
  // Model (developer notes): the curve is the normal probability density; shaded shares come from the cumulative
  // distribution (B.statsModel.within: 0.6827, 0.9545, 0.9973), quoted to students as 68 %, 95 % and 99.7 %. The x axis
  // spans mean ± 4 SD of whichever curve reaches further. The comparison panel describes overlap; it is not a test.
  B.interactives.normalExplorer = function (spec, host) {
    const share = { 1: "68", 2: "95", 3: "99.7" };
    const stage = `<div id="nd-g"></div>`;
    const panel = `<fieldset><legend class="small">Dataset A</legend>${slider("nd-m", "Mean", 10, 50, 0.5, 30)}${slider("nd-s", "SD", 1, 10, 0.5, 4)}</fieldset>
      <label class="small">Shade: <select id="nd-k"><option value="1">±1 SD</option><option value="2">±2 SD</option><option value="3">±3 SD</option><option value="0">none</option></select></label>
      <fieldset><legend class="small"><label><input type="checkbox" id="nd-two"> compare with dataset B</label></legend>${slider("nd-m2", "Mean", 10, 50, 0.5, 36)}${slider("nd-s2", "SD", 1, 10, 0.5, 2)}</fieldset>
      <div class="small"><strong>Examples</strong></div><div class="row" style="margin-top:.2rem"><button class="btn sm" type="button" id="nd-ex1">Same mean, different SD</button><button class="btn sm" type="button" id="nd-ex2">Different means, overlapping</button></div>`;
    host.innerHTML = head(spec, "simplified model") + B.ix.split(stage, panel, { label: "Normal distribution controls" }) + `<div class="grid grid-2 mt"><div class="card" id="nd-read"></div><div class="card" id="nd-cmp"></div></div>
      <p class="tiny muted mt">This is a simplified model: real biological data are only approximately normal.</p>`;
    const set = (id, v) => { $("#nd-" + id, host).value = v; };
    const render = () => { const m = +$("#nd-m", host).value, s = +$("#nd-s", host).value, two = $("#nd-two", host).checked, m2 = +$("#nd-m2", host).value, s2 = +$("#nd-s2", host).value, k = +$("#nd-k", host).value; ["m", "s", "m2", "s2"].forEach((id) => ($("#nd-" + id + "v", host).textContent = $("#nd-" + id, host).value));
      $$("#nd-m2, #nd-s2", host).forEach((i) => (i.disabled = !two));
      const narrow = (host.clientWidth || 800) < 520; $("#nd-g", host).innerHTML = A().normalCurve({ width: narrow ? 400 : 560, height: narrow ? 260 : 300, mu: m, sd: s, mu2: two ? m2 : null, sd2: two ? s2 : null, shade: k, xLabel: "measurement (for example shell length / mm)", xmin: Math.min(m - 4 * s, two ? m2 - 4 * s2 : Infinity), xmax: Math.max(m + 4 * s, two ? m2 + 4 * s2 : -Infinity) });
      $("#nd-read", host).innerHTML = `<h4>Dataset A: mean ${m}, SD ${s}</h4><table class="tbl"><tr><th>Range</th><th>Values</th><th>Share of data</th></tr>${[1, 2, 3].map((j) => `<tr><td>mean ± ${j} SD</td><td>${(m - j * s).toFixed(1)} to ${(m + j * s).toFixed(1)}</td><td>≈ ${share[j]} %</td></tr>`).join("")}</table><p class="small">The curve is symmetrical about the mean: half the values lie below it and half above, and the mean, median and mode coincide. A larger SD gives a wider, flatter curve: more spread, more variation.</p>`;
      if (two) { const d = Math.abs(m - m2); const overlapHi = Math.min(m + s, m2 + s2), overlapLo = Math.max(m - s, m2 - s2);
        const same = d < 0.01 && s !== s2 ? `<p class="small"><strong>Same mean, different SD.</strong> The dataset with the smaller SD gives a taller, narrower curve: its values are more tightly clustered, so it shows less variation.</p>` : "";
        $("#nd-cmp", host).innerHTML = `<h4>Comparing A and B</h4><p class="small">Difference between means: <strong>${d.toFixed(1)}</strong>. SD of A ${s}, SD of B ${s2}: ${s > s2 ? "A is more variable" : s < s2 ? "B is more variable" : "equal spread"}.</p>${same}<p class="small">${d < 0.01 ? "The means are the same, so the datasets differ only in their spread." : overlapHi > overlapLo ? `The ±1 SD ranges overlap (from ${overlapLo.toFixed(1)} to ${overlapHi.toFixed(1)}): many individuals in A could belong to B and vice versa, so a difference between the means should be interpreted cautiously. Overlap alone does not show whether the difference is significant; that needs a statistical test.` : "The ±1 SD ranges do not overlap: the central parts of the two distributions are separate, although their tails may still overlap. Whether the means differ significantly still needs a statistical test."}</p>`; }
      else $("#nd-cmp", host).innerHTML = `<h4>Compare two datasets</h4><p class="small muted">Tick "compare with dataset B", or choose one of the examples, to overlay a second distribution and read the overlap.</p>`; };
    $$("input, select", host).forEach((i) => i.addEventListener("input", render));
    $("#nd-ex1", host).addEventListener("click", () => { set("m", 30); set("s", 5); set("m2", 30); set("s2", 2); $("#nd-two", host).checked = true; set("k", 0); render(); });
    $("#nd-ex2", host).addEventListener("click", () => { set("m", 28); set("s", 4); set("m2", 33); set("s2", 4); $("#nd-two", host).checked = true; set("k", 1); render(); });
    render();
  };
})(window.BIO);
