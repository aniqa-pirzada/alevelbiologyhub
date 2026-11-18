// Interactives for 3.3.7 Allele frequencies in populations (Phase 5 Batch 4, author C1). Model B.popModel
// (data/content/_popgen-model.js: rules, sources and test cases; validate() checks them); drawings B.popgenArt.
// Kinds (spec shapes: { kind, title, note?, questions?: [...] }):
//   genePoolExplorer      count animals, allele copies (2N) and allele frequencies in three fixed herds of roan cattle
//   driftSimulator        seeded genetic drift runs (population size, starting frequency or a few copies, generations)
//   bottleneckChallenge   predict, then see how many of six alleles survive a crash; recovery; 20 runs
//   selectiveBreeding     select the highest-yielding maize plants for 10 generations; compare with no selection
//   hwCalculator          Hardy-Weinberg calculator: the student types q (or p) first; question data sets are locked
//   hwProblems            Hardy-Weinberg problem generator with pitfall feedback; working after the attempt
//   hwConditions          break one Hardy-Weinberg condition at a time and see what happens
// No answer is shown before the student has tried: steps are marked from the student's own entry, and "Show answer"
// appears only after a wrong attempt. Simulations are labelled as simulations; seeds are never shown.
// Accessibility: native buttons, selects and inputs, each labelled; feedback areas are polite live regions; nothing
// animates. Layout: B.ix.split (picture beside the controls on laptops, stacked on phones).
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.popModel, A = () => B.popgenArt;
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div>${spec.note ? `<p class="small muted">${esc(spec.note)}</p>` : ""}`;
  const qBlock = (spec) => ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
  const renderQs = (spec, host) => { const into = $("[data-qs]", host); if (!into) return; (spec.questions || []).forEach((q) => into.append(B.questions.render(q, {}))); };
  const BOX = { ok: "background:var(--sage-soft);border-left:4px solid var(--sage)", bad: "background:var(--rose-soft);border-left:4px solid var(--rose)", neutral: "background:var(--surface-2);border-left:4px solid var(--line-strong)" };
  const fb = (kind, html) => `<div class="feedback ${kind}" style="${BOX[kind]};padding:.5rem .7rem;border-radius:8px;margin-top:.4rem;font-size:.9rem">${html}</div>`;
  const INPUT = "padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:6px;font:inherit;";
  const numBox = (attrs, label, w = "6rem") => `<input type="text" inputmode="decimal" autocomplete="off" ${attrs} aria-label="${esc(label)}" style="${INPUT}width:${w}">`;
  const sel = (attrs, label, opts, cur) => `<select ${attrs} aria-label="${esc(label)}" style="${INPUT}">${opts.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
  const mark = (el, ok) => { if (!el) return; el.style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)"; el.style.borderColor = ok ? "var(--sage)" : "var(--rose)"; el.setAttribute("aria-invalid", ok ? "false" : "true"); };
  const fig = (inner, id) => `<div class="figure"${id ? ` id="${id}"` : ""}><div class="fig-view">${inner}</div></div>`;
  const val = (el) => (el ? String(el.value).trim() : "");
  const numv = (el) => { const s = val(el).replace(/\s/g, "").replace(/^−/, "-"); return s === "" ? NaN : Number(s); };
  const PH = () => typeof innerWidth !== "undefined" && innerWidth < 600; const CW = () => (PH() ? { w: 400, h: 300, k: 1.3, right: 46 } : {});
  let uidN = 0; const uid = () => "pg" + ++uidN;
  const f4 = (x) => M().fmt(x, 4), f1 = (x) => M().fmt(x, 1);
  const nice = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const newBase = () => (Math.floor(Math.random() * 2147483646) + 1) >>> 0;

  // step list: each step { title, body, check(el) -> { ok, msg, empty? }, reveal(el) -> html }; the next opens when one is
  // right or shown; a finished step keeps only its title and feedback
  function stepper(box, steps, onDone) {
    box.innerHTML = steps.map((s, i) => `<div class="pg-step" data-s="${i}" ${i ? "hidden" : ""} style="margin:.3rem 0 .55rem"><p class="small" style="margin:.1rem 0 .3rem"><strong>${i + 1}. ${s.title}</strong></p><div data-body>${s.body}</div>
      <div class="row" style="gap:.4rem;margin-top:.35rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="check">Check</button><button type="button" class="btn sm" data-a="show" hidden>Show answer</button></div><div data-fb aria-live="polite"></div></div>`).join("");
    const els = $$(".pg-step", box);
    const finish = (i, html) => { const el = els[i]; $("[data-fb]", el).innerHTML = html; $$("input,select", el).forEach((x) => (x.disabled = true)); $("[data-a=show]", el).hidden = true; $("[data-a=check]", el).hidden = true; $("[data-body]", el).hidden = true;
      if (els[i + 1]) { els[i + 1].hidden = false; const f = $("input,select", els[i + 1]); if (f) f.focus({ preventScroll: true }); } else if (onDone) onDone(); };
    els.forEach((el, i) => {
      $("[data-a=check]", el).addEventListener("click", () => { const r = steps[i].check(el); if (r.ok) finish(i, fb("ok", "<strong>Correct.</strong> " + (r.msg || ""))); else { $("[data-fb]", el).innerHTML = fb("neutral", r.msg); if (!r.empty) $("[data-a=show]", el).hidden = false; } });
      $("[data-a=show]", el).addEventListener("click", () => finish(i, fb("neutral", "<strong>Answer.</strong> " + steps[i].reveal(el))));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("input")) { e.preventDefault(); $("[data-a=check]", el).click(); } });
    });
  }
  const numStep = (title, label, exact, opts = {}) => ({ title, body: `<label class="small">${esc(label)} ${numBox('data-k="v"', label)}</label>`,
    check: (el) => { const inp = $("[data-k=v]", el), s = val(inp); if (!s) return { ok: false, empty: true, msg: "Type your answer, then press Check." };
      const cf = opts.freq ? M().checkFreq(s, exact, opts.alt) : null; const ok = cf ? cf.ok : Math.abs(numv(inp) - exact) < 1e-9; mark(inp, ok);
      if (ok) return { ok, msg: opts.why || "" }; const hint0 = opts.hint ? opts.hint(M().readTyped(s)) : null; if (hint0) return { ok, msg: hint0 }; if (cf && cf.why === "sf") return { ok, empty: true, msg: "Give at least 2 significant figures." }; const hint = opts.hint ? opts.hint(M().readTyped(s)) : null; return { ok, msg: hint || "<strong>Not quite.</strong> Try again." }; },
    reveal: () => opts.show || String(exact) });

  // ======================================= Gene Pool Explorer =======================================
  const HERDS = [{ id: "a", name: "Herd 1", red: 6, roan: 8, white: 6 }, { id: "b", name: "Herd 2", red: 9, roan: 6, white: 1 }, { id: "c", name: "Herd 3", red: 2, roan: 5, white: 13 }];
  const herdOrder = (h) => { const list = [...Array(h.red).fill("red"), ...Array(h.roan).fill("roan"), ...Array(h.white).fill("white")]; const r = M().rng(h.red * 97 + h.roan * 13 + h.white); for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };
  function herdSvg(h) { const list = herdOrder(h), cols = typeof innerWidth !== "undefined" && innerWidth < 600 ? 4 : 7, cw = 80, rh = 80, rows = Math.ceil(list.length / cols), w = cols * cw + 20, ht = rows * rh + (cols < 7 ? 62 : 46);
    let s = `<svg viewBox="0 0 ${w} ${ht}" width="${w}" role="img" aria-label="${esc(`${h.name}: ${h.red} red, ${h.roan} roan and ${h.white} white cattle, each drawn with its two alleles`)}" style="max-width:100%;height:auto;background:#fff">`;
    list.forEach((t, i) => { s += A().cow(10 + (i % cols) * cw + 38, 26 + Math.floor(i / cols) * rh, t); });
    s += (cols < 7 ? `<text x="12" y="${ht - 30}" font-size="15" fill="#5f6f7f">R = allele Cᴿ, W = allele Cᵂ.</text><text x="12" y="${ht - 10}" font-size="15" fill="#5f6f7f">Red CᴿCᴿ, roan CᴿCᵂ, white CᵂCᵂ.</text>` : `<text x="12" y="${ht - 12}" font-size="13" fill="#5f6f7f">Beads: R = allele Cᴿ (red), W = allele Cᵂ (white). Red CᴿCᴿ, roan CᴿCᵂ, white CᵂCᵂ.</text>`);
    return s + "</svg>"; }
  B.interactives.genePoolExplorer = function (spec, host) {
    host.innerHTML = head(spec, "count and calculate") + `<div data-r="body"></div><p class="tiny muted mt">Hypothetical herds. Coat colour in these cattle is controlled by one gene with two codominant alleles, so every genotype can be seen.</p>` + qBlock(spec);
    const body = $("[data-r=body]", host);
    const show = (hi) => { const h = HERDS[hi], N = h.red + h.roan + h.white, R = 2 * h.red + h.roan, W = h.roan + 2 * h.white, id = uid();
      body.innerHTML = B.ix.split(fig(herdSvg(h)), `<p class="small" style="margin:.1rem 0 .4rem"><label>Herd ${sel('data-r="herd"', "choose a herd", HERDS.map((x, i) => [i, `${x.name}`]), hi)}</label></p><div data-r="steps"></div>`, { label: "Gene pool counting steps", cls: "ix-nosticky-sm" });
      $("[data-r=herd]", body).addEventListener("change", (e) => show(+e.target.value));
      const perN = (t) => t && Math.abs(t.v - R / N) < 1e-6 ? "<strong>Not quite.</strong> You divided by the number of animals. Each animal carries two copies of the gene, so divide by the number of copies in the gene pool." : null;
      stepper($("[data-r=steps]", body), [
        numStep("How many animals are in the herd?", "Number of animals", N, { why: `${h.red} + ${h.roan} + ${h.white} = ${N}.`, show: `${h.red} + ${h.roan} + ${h.white} = ${N}.` }),
        numStep("How many copies of the coat-colour gene are in the gene pool?", "Copies of the gene", 2 * N, { why: `Each animal has two copies (one on each chromosome of a homologous pair): 2 × ${N} = ${2 * N}.`, show: `2 × ${N} = ${2 * N}: each animal carries two copies.`, hint: (t) => (t && t.v === N ? "<strong>Not quite.</strong> That is the number of animals. How many copies of the gene does each animal carry?" : null) }),
        numStep("How many copies of allele Cᴿ are there?", "Copies of allele C R", R, { why: `Red animals carry two each, roan animals one: 2 × ${h.red} + ${h.roan} = ${R}.`, show: `2 × ${h.red} (red) + ${h.roan} (roan) = ${R}.`, hint: (t) => (t && t.v === h.red + h.roan ? "<strong>Not quite.</strong> You counted animals that carry Cᴿ. Red animals carry two copies each." : null) }),
        numStep("What is the frequency of allele Cᴿ?", "Frequency of allele C R", R / (2 * N), { freq: true, why: `${R} ÷ ${2 * N} = ${f4(R / (2 * N))}.`, show: `${R} ÷ ${2 * N} = ${f4(R / (2 * N))}.`, hint: perN }),
        numStep("What is the frequency of allele Cᵂ?", "Frequency of allele C W", W / (2 * N), { freq: true, why: `${W} ÷ ${2 * N} = ${f4(W / (2 * N))}. The two frequencies add up to 1.`, show: `1 − ${f4(R / (2 * N))} = ${f4(W / (2 * N))} (or ${W} ÷ ${2 * N}).` }),
      ]); void id; };
    show(0); renderQs(spec, host);
  };

  // ======================================= Genetic Drift Simulator =======================================
  B.interactives.driftSimulator = function (spec, host) {
    const st = { N: 10, start: "f", idx: 10, gens: 50, runs: 6, base: newBase() };
    host.innerHTML = head(spec, "simulation") + `<div data-r="body"></div><p class="tiny muted mt">Simulated. A simplified model: no selection, mutation or migration, and a constant population size; chance alone changes the allele frequencies. Each run is a different set of chance events.</p>` + qBlock(spec);
    const body = $("[data-r=body]", host);
    const startOpts = [["f", "a starting frequency"], ["1", "1 copy (a new mutation)"], ["2", "2 copies"], ["5", "5 copies"]];
    body.innerHTML = B.ix.split(`<div data-r="fig"></div><div class="ix-readout small" data-r="sum" aria-live="polite" style="margin-top:.4rem"></div>`,
      `<div style="display:grid;gap:.45rem">
        <label class="small">Population size ${sel('data-r="N"', "population size", [5, 10, 25, 50, 100, 250, 500, 1000].map((n) => [n, `${n} individuals`]), st.N)}</label>
        <label class="small">Start with ${sel('data-r="start"', "how to start", startOpts, st.start)}</label>
        <label class="small" data-r="slab">Starting frequency of allele A: <strong data-r="fv"></strong><br><input type="range" min="0" max="20" step="1" value="${st.idx}" data-r="idx" aria-label="starting frequency of allele A" style="width:100%"></label>
        <label class="small">Generations ${sel('data-r="gens"', "number of generations", [10, 25, 50, 100, 200].map((n) => [n, n]), st.gens)}</label>
        <label class="small">Runs ${sel('data-r="runs"', "number of runs", [1, 3, 6, 10].map((n) => [n, n]), st.runs)}</label>
        <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="new">Run again (new chance events)</button><button type="button" class="btn sm" data-a="same">Replay these runs</button></div></div>`, { label: "Genetic drift controls" });
    const g = (k) => $(`[data-r=${k}]`, body);
    const k0 = () => (st.start === "f" ? M().k0From(st.idx, st.N) : Math.min(+st.start, 2 * st.N));
    const label = () => { const k = k0(), C = 2 * st.N; g("fv").textContent = `${M().fmt(k / C, 4)} (${nice(k)} of ${nice(C)} copies)`; g("slab").hidden = st.start !== "f"; };
    const draw = () => { label(); const r = M().drift({ N: st.N, k0: k0(), gens: st.gens, runs: st.runs, seed: st.base }); if (!r.ok) { g("sum").innerHTML = esc(r.err); return; }
      const series = r.runs.map((x, i) => ({ pts: x.p.map((p, t) => [t, p]) }));
      // few-copy starts (RQ-01): enlarge the frequency scale so the runs can be seen
      const top = Math.max(...r.runs.map((x) => Math.max(...x.p))), few = st.start !== "f", yMax = few ? [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1].find((v) => v >= 1.2 * top - 1e-12) || 1 : 1;
      const yTicks = [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax], edge = [{ y: 0, label: "Lost", dy: 0 }].concat(yMax === 1 ? [{ y: 1, label: "Fixed", dy: 5 }] : []);
      g("fig").innerHTML = fig(A().chart({ ...CW(), left: yMax < 1 ? 80 : 62, xMax: st.gens, yMax, yTicks, yFmt: (v) => M().fmt(v, 4), xLabel: "Generation", yLabel: yMax < 1 ? (PH() ? "Frequency (enlarged)" : "Frequency of allele A (scale enlarged)") : "Frequency of allele A", series, edgeLabels: edge, aria: `Frequency of allele A over ${st.gens} generations in ${st.runs} simulated runs of a population of ${st.N}` }));
      const s = r.summary, det = r.runs.map((x, i) => `<tr><td>Run ${i + 1}</td><td>${x.fixedAt !== null ? `fixed at generation ${x.fixedAt}` : x.lostAt !== null ? `lost at generation ${x.lostAt}` : `still varying (${M().fmt(x.p[x.p.length - 1], 3)})`}</td></tr>`).join("");
      const lostAt = r.runs.filter((x) => x.lostAt !== null).map((x) => x.lostAt).sort((a, b) => a - b);
      g("sum").innerHTML = `Start: ${nice(r.k0)} of ${nice(2 * st.N)} copies (frequency ${M().fmt(r.p0Actual, 4)}).${yMax < 1 ? ` The frequency scale is enlarged (0 to ${M().fmt(yMax, 4)}).` : ""} Of ${st.runs} run${st.runs > 1 ? "s" : ""}: <strong>${s.fixed} fixed</strong>, <strong>${s.lost} lost</strong>, <strong>${s.segregating} still have both alleles</strong>.${lostAt.length ? ` Lost after ${lostAt.join(", ")} generation${lostAt.length > 1 || lostAt[0] !== 1 ? "s" : ""}.` : ""}<details class="small" style="margin-top:.3rem"><summary>Each run</summary><table class="tbl small">${det}</table></details>`; };
    g("N").addEventListener("change", (e) => { st.N = +e.target.value; draw(); });
    g("start").addEventListener("change", (e) => { st.start = e.target.value; draw(); });
    g("idx").addEventListener("input", (e) => { st.idx = +e.target.value; label(); });
    g("idx").addEventListener("change", () => draw());
    g("gens").addEventListener("change", (e) => { st.gens = +e.target.value; draw(); });
    g("runs").addEventListener("change", (e) => { st.runs = +e.target.value; draw(); });
    $("[data-a=new]", body).addEventListener("click", () => { st.base = newBase(); draw(); });
    $("[data-a=same]", body).addEventListener("click", () => draw());
    draw(); renderQs(spec, host);
  };

  // ======================================= Bottleneck Challenge =======================================
  function stack(x, y, w, h, freq, title, fs = 14) { const Ah = A(); let s = `<text x="${x}" y="${y - 8}" font-size="${fs}" font-weight="600" fill="${Ah.INK}">${esc(title)}</text>`; let cx = x;
    freq.forEach((f, i) => { if (f <= 0) return; const ww = f * w; s += `<rect x="${cx}" y="${y}" width="${ww}" height="${h}" fill="${Ah.ALLELE[i].c}" stroke="#16263a" stroke-width="1"/>`; if (ww > 14) s += `<text x="${cx + ww / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="${fs > 14 ? 16 : 13}" font-weight="700" fill="${i === 5 ? "#16263a" : "#fff"}">${i + 1}</text>`; cx += ww; });
    return s; }
  function bnSvg(run, n, recovered) { const ph = PH(), W = ph ? 360 : 560, BW = W - 40, fs = ph ? 17 : 14, Ah = A(); const base = M().BN.copies.map((c) => c / 1000);
    const pairs = run ? run.survivors : [], r = n <= 10 ? 9 : n <= 25 ? 7.5 : 6, gap = r * 2 + 3, pw = 2 * gap + 8, perRow = Math.max(1, Math.floor(BW / pw)), rows = Math.ceil(n / perRow);
    const yS = 108, hS = run ? rows * (r * 2 + 8) + 4 : 40, yA = yS + hS + 48, H = yA + (recovered ? 104 : 46);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Gene pool of six alleles before the bottleneck, the survivors' alleles, and the gene pool afterwards" style="max-width:100%;height:auto;background:#fff">`;
    s += stack(20, 38, BW, 30, base, ph ? "Before: 500 individuals" : "Gene pool before: 500 individuals (1000 copies)", fs);
    s += `<text x="20" y="${yS - 10}" font-size="${fs}" font-weight="600" fill="${Ah.INK}">${run ? `Survivors: ${n} (${2 * n} copies)` : "Survivors: choose and run"}</text>`;
    if (run) for (let i = 0; i < n; i++) { const col = i % perRow, row = Math.floor(i / perRow), x = 20 + col * pw + r, y = yS + row * (r * 2 + 8) + r; s += `<rect x="${x - r - 2}" y="${y - r - 2}" width="${gap + 2 * r + 4 - 3}" height="${2 * r + 4}" rx="${r + 2}" fill="none" stroke="#9aa7b0"/>` + Ah.bead(x, y, pairs[2 * i], r) + Ah.bead(x + gap, y, pairs[2 * i + 1], r); }
    if (run) { s += stack(20, yA, BW, 30, run.hist[0].freq, ph ? `Survivors keep ${run.retained} of 6 alleles` : `Gene pool of the survivors: ${run.retained} of 6 alleles`, fs);
      if (recovered) { const last = run.hist[run.hist.length - 1]; s += stack(20, yA + 70, BW, 30, last.freq, ph ? `After recovery: ${run.finalRetained} of 6 alleles` : `After ${run.hist.length - 1} generations of recovery: ${last.N} individuals, ${run.finalRetained} of 6 alleles`, fs); } }
    return s + "</svg>"; }
  B.interactives.bottleneckChallenge = function (spec, host) {
    const st = { n: 5, base: newBase(), run: null, recovered: false, predicted: null };
    host.innerHTML = head(spec, "predict, then run") + `<div data-r="body"></div><p class="tiny muted mt">Simulated, hypothetical gene pool: one gene with six alleles (1 to 6). The survivors are a random sample of the population; there is no mutation or migration, so a lost allele cannot come back.</p>` + qBlock(spec);
    const body = $("[data-r=body]", host);
    body.innerHTML = B.ix.split(`<div class="ix-views row" role="tablist" aria-label="Choose a picture" style="gap:.3rem;margin-bottom:.3rem"><button type="button" class="btn sm primary" role="tab" aria-controls="${(st.idA = uid())}">One bottleneck</button><button type="button" class="btn sm" role="tab" aria-controls="${(st.idB = uid())}">20 runs</button></div><div id="${st.idA}" data-r="figA"></div><div id="${st.idB}" data-r="figB" hidden></div>`,
      `<div style="display:grid;gap:.45rem">
        <label class="small">Survivors ${sel('data-r="n"', "number of survivors", [2, 5, 10, 25, 50].map((n) => [n, `${n} individuals`]), st.n)}</label>
        <label class="small">Your prediction: how many of the 6 alleles will the survivors keep? ${sel('data-r="pred"', "your prediction", [["", "choose…"], 1, 2, 3, 4, 5, 6].map((x) => (Array.isArray(x) ? x : [x, x])), "")}</label>
        <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="run">Run the bottleneck</button><button type="button" class="btn sm" data-a="rec" disabled>Recover for 10 generations</button></div>
        <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm" data-a="many">Run 20 times</button><button type="button" class="btn sm" data-a="ctl">No bottleneck (compare)</button></div>
        <div class="ix-readout small" data-r="out" aria-live="polite">Choose the number of survivors and make a prediction first.</div></div>`, { label: "Bottleneck controls" });
    const g = (k) => $(`[data-r=${k}]`, body); const showTab = B.ix.viewTabs($(".ix-views", body));
    const drawA = () => { g("figA").innerHTML = fig(bnSvg(st.run, st.n, st.recovered)); };
    g("n").addEventListener("change", (e) => { st.n = +e.target.value; st.run = null; st.recovered = false; $("[data-a=rec]", body).disabled = true; g("pred").value = ""; g("out").textContent = "Make a prediction for this number of survivors, then run."; drawA(); });
    $("[data-a=run]", body).addEventListener("click", () => { const p = g("pred").value; if (!p) { g("out").textContent = "Choose your prediction first."; g("pred").focus(); return; }
      st.base = newBase(); const r = M().bottleneck({ n: st.n, gens: 10, runs: 1, seed: st.base }); st.run = r.runs[0]; st.recovered = false; $("[data-a=rec]", body).disabled = false; showTab(0); drawA();
      const lost = st.run.counts.map((c, i) => (c ? null : i + 1)).filter(Boolean);
      g("out").innerHTML = `You predicted ${p}. The survivors kept <strong>${st.run.retained} of 6</strong> alleles${lost.length ? `; allele${lost.length > 1 ? "s" : ""} ${lost.join(", ")} ${lost.length > 1 ? "were" : "was"} lost` : ""}. Run again and the result may differ: which alleles are lost is down to chance.`; });
    $("[data-a=rec]", body).addEventListener("click", () => { if (!st.run) return; st.recovered = true; drawA(); const last = st.run.hist[st.run.hist.length - 1];
      const drifted = st.run.counts.map((c, i) => (c > 0 && last.counts[i] === 0 ? i + 1 : null)).filter(Boolean);
      g("out").innerHTML = `After 10 generations the population is back to ${last.N} individuals, but it still has only <strong>${st.run.finalRetained} of 6</strong> alleles. Recovery in numbers does not bring lost alleles back; allele frequencies also kept changing by chance (genetic drift)${drifted.length ? `. Allele${drifted.length > 1 ? "s" : ""} ${drifted.join(" and ")} ${drifted.length > 1 ? "were" : "was"} lost this way while the population was still small.` : " while the population was small."}`; });
    $("[data-a=many]", body).addEventListener("click", () => { const r = M().bottleneck({ n: st.n, runs: 20, seed: newBase() }); const keys = [{ label: "Number of runs", c: "#1f6fb2" }];
      g("figB").innerHTML = fig(A().bars({ ...CW(), id: uid(), groups: [1, 2, 3, 4, 5, 6].map((k) => ({ label: `${k}`, vals: [r.histogram[k]] })), keys, legend: false, yMax: 20, yTicks: [0, 5, 10, 15, 20], valFmt: (v) => (v ? String(v) : ""), xLabel: `Alleles kept by ${st.n} survivors (20 simulated runs)`, aria: "Histogram of the number of alleles kept in 20 runs" }))
        + `<p class="small" style="margin:.3rem .2rem">Runs in which each allele was lost: ${M().BN.copies.map((c, i) => `allele ${i + 1} (${c / 10} % of the gene pool): ${Math.round(r.lostShare[i] * 20)}`).join("; ")}.</p>`;
      showTab(1); g("out").innerHTML = `Twenty runs with ${st.n} survivors. Compare how often each allele was lost, and how much the number of alleles kept varies from run to run.`; });
    $("[data-a=ctl]", body).addEventListener("click", () => { const r = M().bottleneck({ control: true }); st.run = null; showTab(0);
      g("figA").innerHTML = (() => { const ph = PH(), W = ph ? 360 : 560, BW = W - 40, fs = ph ? 17 : 14; return fig(`<svg viewBox="0 0 ${W} 130" width="${W}" role="img" aria-label="Without a bottleneck all six alleles remain at their original frequencies" style="max-width:100%;height:auto;background:#fff">${stack(20, 38, BW, 30, M().BN.copies.map((c) => c / 1000), "Before: 500 individuals", fs)}${stack(20, 100, BW, 24, r.runs[0].hist[0].freq, "", fs)}<text x="20" y="92" font-size="${fs}" font-weight="600" fill="#16263a">No bottleneck: ${r.runs[0].retained} of 6 alleles</text></svg>`); })();
      g("out").innerHTML = "Without a bottleneck every allele is still present, at the same frequencies. Compare this with a bottleneck run."; $("[data-a=rec]", body).disabled = true; });
    drawA(); renderQs(spec, host);
  };

  // ======================================= Selective Breeding Explorer =======================================
  B.interactives.selectiveBreeding = function (spec, host) {
    const NAMES = { 1: "No selection (all plants)", 0.5: "Top 50 %", 0.25: "Top 25 %", 0.1: "Top 10 %" };
    const st = { f: 0.1, runs: [], ids: [uid(), uid()] };
    host.innerHTML = head(spec, "simulation") + `<div data-r="body"></div><p class="tiny muted mt">Simulated maize plants (hypothetical): five genes affect grain yield, each with an allele that increases it, and growing conditions vary a little. 40 plants are grown each generation.</p>` + qBlock(spec);
    const body = $("[data-r=body]", host);
    body.innerHTML = B.ix.split(`<div class="ix-views row" role="tablist" aria-label="Choose a picture" style="gap:.3rem;margin-bottom:.3rem"><button type="button" class="btn sm primary" role="tab" aria-controls="${st.ids[0]}">Mean yield</button><button type="button" class="btn sm" role="tab" aria-controls="${st.ids[1]}">Yields of the plants</button></div><div id="${st.ids[0]}" data-r="f1"></div><div id="${st.ids[1]}" data-r="f2" hidden></div>`,
      `<div style="display:grid;gap:.45rem"><label class="small">Plants used as parents each generation ${sel('data-r="f"', "how strongly to select", [[0.1, NAMES[0.1]], [0.25, NAMES[0.25]], [0.5, NAMES[0.5]], [1, NAMES[1]]], st.f)}</label>
        <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="run">Breed for 10 generations</button><button type="button" class="btn sm" data-a="clear">Clear the graph</button></div>
        <p class="tiny muted" style="margin:0">The last two runs stay on the graph, so you can compare strong selection with no selection.</p>
        <div class="ix-readout small" data-r="out" aria-live="polite">Choose how strongly to select, then breed.</div></div>`, { label: "Selective breeding controls" });
    const g = (k) => $(`[data-r=${k}]`, body); B.ix.viewTabs($(".ix-views", body));
    const draw = () => { const series = st.runs.map((r, i) => ({ pts: r.gens.map((x, t) => [t, x.mean]), c: i === st.runs.length - 1 ? "#1f6fb2" : "#b9770e", dash: i === st.runs.length - 1 ? "" : "6 4", end: PH() ? { 1: "None", 0.5: "50 %", 0.25: "25 %", 0.1: "10 %" }[r.f] : NAMES[r.f].replace(" (all plants)", "") }));
      g("f1").innerHTML = fig(A().chart({ ...CW(), xMax: 10, xTicks: [0, 2, 4, 6, 8, 10], yMin: 100, yMax: 220, yTicks: [100, 130, 160, 190, 220], xLabel: "Generation", yLabel: PH() ? "Mean grain mass / g" : "Mean grain mass per plant / g", series, right: PH() ? 92 : 150, aria: "Mean grain mass per plant against generation" }));
      const last = st.runs[st.runs.length - 1]; if (!last) { g("f2").innerHTML = ""; return; }
      const lab = ["under 120", "120 to 139", "140 to 159", "160 to 179", "180 to 199", "200 or more"], bin = (y) => (y < 120 ? 0 : y >= 200 ? 5 : Math.floor((y - 100) / 20)), cnt = (ys) => { const c = [0, 0, 0, 0, 0, 0]; ys.forEach((y) => c[bin(y)]++); return c; };
      const c0 = cnt(last.gens[0].yields), c10 = cnt(last.gens[10].yields);
      g("f2").innerHTML = fig(A().bars({ ...CW(), id: uid(), w: 600, groups: lab.map((l, i) => ({ label: l, vals: [c0[i], c10[i]] })), keys: [{ label: "Generation 0", c: "#b9770e", pattern: true }, { label: "Generation 10", c: "#1f6fb2" }], yMax: 40, yTicks: [0, 10, 20, 30, 40], xLabel: "Grain mass per plant / g", aria: "Number of plants in each yield class in generation 0 and generation 10" })); };
    g("f").addEventListener("change", (e) => { st.f = +e.target.value; });
    $("[data-a=run]", body).addEventListener("click", () => { const r = M().breed({ f: st.f, gens: 10, seed: newBase() }); if (!r.ok) return; st.runs.push(r); if (st.runs.length > 2) st.runs.shift(); draw();
      const a = r.gens[0], z = r.gens[10]; g("out").innerHTML = `<strong>${esc(NAMES[r.f])}</strong>: mean grain mass ${M().fmt(a.mean, 0)} g → ${M().fmt(z.mean, 0)} g. Frequency of the alleles that increase yield: ${a.plusFreq.toFixed(2)} → ${z.plusFreq.toFixed(2)}. Genes with no variation left: ${z.fixedPlus} of 5 carry only the high-yield allele${z.fixedMinus ? `; ${z.fixedMinus} of 5 carry only the low-yield allele (lost by chance)` : ""}.`; });
    $("[data-a=clear]", body).addEventListener("click", () => { st.runs = []; draw(); g("out").textContent = "Choose how strongly to select, then breed."; });
    draw(); renderQs(spec, host);
  };

  // ======================================= Hardy-Weinberg Calculator =======================================
  const resultTable = (r, Mn) => { const e = Mn ? M().hw.expected(r, Mn) : null;
    return `<table class="tbl small" style="margin:.3rem 0"><thead><tr><th scope="col"></th><th scope="col">Frequency</th>${e ? `<th scope="col">Expected number in ${nice(Mn)}</th>` : ""}</tr></thead><tbody>
      <tr><th scope="row">p (dominant allele)</th><td>${f4(r.p)}</td>${e ? "<td></td>" : ""}</tr><tr><th scope="row">q (recessive allele)</th><td>${f4(r.q)}</td>${e ? "<td></td>" : ""}</tr>
      <tr><th scope="row">p² (homozygous dominant)</th><td>${f4(r.p2)}</td>${e ? `<td>${f1(e.AA)}</td>` : ""}</tr><tr><th scope="row">2pq (heterozygous)</th><td>${f4(r.twopq)} (${M().pct(r.twopq)})</td>${e ? `<td>${f1(e.Aa)}</td>` : ""}</tr>
      <tr><th scope="row">q² (homozygous recessive)</th><td>${f4(r.q2)}</td>${e ? `<td>${f1(e.aa)}</td>` : ""}</tr><tr><th scope="row">Check: p² + 2pq + q²</th><td>${f4(r.check)}</td>${e ? "<td></td>" : ""}</tr></tbody></table>`; };
  const lockMsg = () => fb("neutral", "<strong>Answer that question first.</strong> These are the data of a question on this site. Work it out yourself; once you have answered it, the calculator will accept these data.");
  B.interactives.hwCalculator = function (spec, host) {
    const tabsL = ["From the recessive phenotype", "From the dominant phenotype", "From genotype counts"];
    host.innerHTML = head(spec, "calculate and check") + `<div class="row ix-views" role="tablist" data-r="tabs" aria-label="Calculator mode" style="gap:.4rem;margin:.3rem 0;flex-wrap:wrap">${tabsL.map((l, i) => `<button type="button" class="btn sm${i ? "" : " primary"}" role="tab" aria-controls="${(spec._ids = spec._ids || [uid(), uid(), uid()])[i]}">${esc(l)}</button>`).join("")}</div>${spec._ids.map((id, i) => `<div id="${id}" data-pane="${i}"${i ? " hidden" : ""}></div>`).join("")}<p class="tiny muted mt">Simplified model: one gene with two alleles, not sex-linked, in a population that meets the Hardy-Weinberg conditions. You type q (or p) yourself before the table appears.</p>` + qBlock(spec);
    B.ix.viewTabs($("[data-r=tabs]", host));
    const P = (i) => $(`[data-pane="${i}"]`, host);
    // recessive and dominant tabs share one flow: data → (q² for dominant) → q → table
    const flow = (pane, dominant) => {
      const forms = dominant ? [["count", "number with the dominant phenotype, and the total"], ["pct", "percentage with the dominant phenotype"], ["freq", "frequency of the dominant phenotype"]] : [["count", "number with the recessive phenotype, and the total"], ["pct", "percentage with the recessive phenotype"], ["freq", "frequency of the recessive phenotype"], ["onein", "\"1 in n\" have the recessive phenotype"]];
      pane.innerHTML = B.ix.split(`<div data-r="tbl"><p class="small muted" style="margin:.4rem">The table of p, q, p², 2pq and q² appears here once you have worked out ${dominant ? "q² and q" : "q"} yourself.</p></div>`,
        `<div style="display:grid;gap:.4rem"><label class="small">Data given as ${sel('data-r="form"', "form of the data", forms, "count")}</label><div data-r="inp"></div>
         <label class="small">Population size for expected numbers (optional) ${numBox('data-r="M"', "population size for expected numbers")}</label>
         <div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="go">Use these data</button></div><div data-r="steps" aria-live="polite"></div></div>`, { label: dominant ? "Calculator from the dominant phenotype" : "Calculator from the recessive phenotype", cls: "ix-nosticky-sm" });
      const g = (k) => $(`[data-r=${k}]`, pane);
      const inputs = () => { const f = g("form").value; g("inp").innerHTML = f === "count" ? `<label class="small">Number ${numBox('data-r="a"', "number with the phenotype")}</label> <label class="small">out of ${numBox('data-r="b"', "total number")}</label>` : f === "pct" ? `<label class="small">Percentage ${numBox('data-r="a"', "percentage")} %</label>` : f === "freq" ? `<label class="small">Frequency ${numBox('data-r="a"', "frequency")}</label>` : `<label class="small">1 in ${numBox('data-r="a"', "n")}</label>`; };
      g("form").addEventListener("change", inputs); inputs();
      $("[data-a=go]", pane).addEventListener("click", () => { const f = g("form").value, a = numv(g("a")), b = numv(g("b")); const hw = M().hw;
        const r = f === "count" ? (dominant ? (isFinite(a) && isFinite(b) && b >= 1 && a >= 0 && a <= b && Number.isInteger(a) && Number.isInteger(b) ? hw.fromDominant(a / b) : { ok: false, err: "The number must be a whole number from 0 to the total." }) : hw.fromRecessiveCount(a, b))
          : f === "pct" ? hw.fromPercent(a, dominant ? "dominant" : "recessive") : f === "freq" ? (dominant ? hw.fromDominant(a) : hw.fromRecessive(a)) : hw.fromOneIn(a);
        const box = g("steps"); g("tbl").innerHTML = `<p class="small muted" style="margin:.4rem">The table appears here once you have worked out ${dominant ? "q² and q" : "q"} yourself.</p>`;
        if (!r.ok) { box.innerHTML = fb("bad", "<strong>These data cannot be used.</strong> " + esc(r.err)); return; }
        if (M().lockFor("q2", M().round(r.q2, 9))) { box.innerHTML = lockMsg(); return; }
        const Mn = numv(g("M")); const Mok = Number.isInteger(Mn) && Mn >= 1 ? Mn : null;
        const fd = 1 - r.q2;
        const steps = [];
        if (dominant) steps.push(numStep("What is q², the frequency of the recessive phenotype?", "q squared", r.q2, { freq: true, why: `q² = 1 − ${f4(fd)} = ${f4(r.q2)}. Everyone without the dominant phenotype is homozygous recessive.`, show: `q² = 1 − ${f4(fd)} = ${f4(r.q2)}.`, hint: (t) => (t && Math.abs(t.v - Math.sqrt(fd)) < 0.005 ? "<strong>Not quite.</strong> Do not square root the dominant phenotype frequency: dominant phenotypes include AA and Aa. Find the recessive phenotype frequency first." : null) }));
        steps.push(numStep("What is q, the frequency of the recessive allele?", "q", r.q, { freq: true, alt: Math.round(r.q * 100) / 100, why: `q = √${f4(r.q2)} = ${f4(r.q)}.`, show: `q = √q² = √${f4(r.q2)} = ${f4(r.q)}.`, hint: (t) => (!t ? null : Math.abs(t.v - r.q2) < 1e-6 ? "<strong>Not quite.</strong> That is q². Take its square root." : Math.abs(t.v - Math.sqrt(fd)) < 0.005 ? "<strong>Not quite.</strong> That is the square root of the dominant phenotype frequency. Use q² first." : Math.abs(t.v - r.q2 / 2) < 1e-6 ? "<strong>Not quite.</strong> Halving q² does not give q: take the square root." : null) }));
        stepper(box, steps, () => { g("tbl").innerHTML = resultTable(r, Mok) + `<p class="small" style="margin:.2rem .3rem">p = 1 − q. Carriers (heterozygotes) = 2pq.</p>`; });
      });
    };
    flow(P(0), false); flow(P(1), true);
    // genotype counts
    { const pane = P(2);
      pane.innerHTML = B.ix.split(`<div data-r="tbl"><p class="small muted" style="margin:.4rem">Observed and expected numbers appear here once you have worked out p yourself.</p></div>`,
        `<div style="display:grid;gap:.4rem"><p class="small" style="margin:0">For codominant alleles, or genotypes found by a DNA test.</p><div class="row" style="gap:.5rem;flex-wrap:wrap"><label class="small">AA ${numBox('data-r="AA"', "number AA", "5rem")}</label><label class="small">Aa ${numBox('data-r="Aa"', "number Aa", "5rem")}</label><label class="small">aa ${numBox('data-r="aa"', "number aa", "5rem")}</label></div>
         <div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="go">Use these data</button></div><div data-r="steps" aria-live="polite"></div></div>`, { label: "Calculator from genotype counts", cls: "ix-nosticky-sm" });
      const g = (k) => $(`[data-r=${k}]`, pane);
      $("[data-a=go]", pane).addEventListener("click", () => { const c = [numv(g("AA")), numv(g("Aa")), numv(g("aa"))]; const r = M().hw.fromCounts(c[0], c[1], c[2]); const box = g("steps");
        g("tbl").innerHTML = `<p class="small muted" style="margin:.4rem">Observed and expected numbers appear here once you have worked out p yourself.</p>`;
        if (!r.ok) { box.innerHTML = fb("bad", "<strong>These data cannot be used.</strong> " + esc(r.err)); return; }
        if (M().lockFor("counts", [r.counts.AA, r.counts.Aa, r.counts.aa]) || M().lockFor("q2", M().round(r.q2, 9)) || M().lockFor("p", M().round(r.p, 9)) || M().lockFor("p", M().round(r.q, 9))) { box.innerHTML = lockMsg(); return; }
        stepper(box, [numStep("What is p, the frequency of allele A?", "p", r.p, { freq: true, alt: Math.round(r.p * 100) / 100, why: `(2 × ${r.counts.AA} + ${r.counts.Aa}) ÷ ${r.copies} = ${f4(r.p)}.`, show: `Copies of A = 2 × ${r.counts.AA} + ${r.counts.Aa} = ${r.A}; copies of the gene = 2 × ${r.N} = ${r.copies}; p = ${r.A} ÷ ${r.copies} = ${f4(r.p)}.`,
          hint: (t) => (t && Math.abs(t.v - r.A / r.N) < 1e-6 ? "<strong>Not quite.</strong> You divided by the number of individuals. Each carries two copies: divide by 2N." : null) })], () => {
          const row = (k, lab) => `<tr><th scope="row">${lab}</th><td>${r.counts[k]}</td><td>${f1(r.expected[k])}</td><td>${f1(r.diff[k])}</td></tr>`;
          g("tbl").innerHTML = `<table class="tbl small" style="margin:.3rem 0"><thead><tr><th scope="col">Genotype</th><th scope="col">Observed</th><th scope="col">Expected (p², 2pq, q² × N)</th><th scope="col">Observed − expected</th></tr></thead><tbody>${row("AA", "AA")}${row("Aa", "Aa")}${row("aa", "aa")}</tbody></table>
            <p class="small" style="margin:.2rem .3rem">p = ${f4(r.p)}, q = ${f4(r.q)}. A large difference between observed and expected numbers suggests, but does not prove, that a Hardy-Weinberg condition is not met. Stretch: a statistical test such as chi-squared (3.3.6.2) can decide whether a difference is significant.</p>`; }); }); }
    renderQs(spec, host);
  };

  // ======================================= Hardy-Weinberg Problem Generator =======================================
  B.interactives.hwProblems = function (spec, host) {
    const TPL = [["", "Any type"], ["A", "From the recessive phenotype"], ["B", "Rare conditions"], ["C", "From the dominant phenotype"], ["D", "From genotype counts"], ["E", "From an allele frequency"]];
    const st = { seed: newBase(), tpl: "", right: 0, done: 0 };
    host.innerHTML = head(spec, "practice") + `<div data-r="body"></div><p class="tiny muted mt">Hypothetical populations. Give frequencies as decimals (at least 2 significant figures), fractions, or percentages with %.</p>` + qBlock(spec);
    const body = $("[data-r=body]", host);
    const show = () => { const g0 = M().gen(st.seed, st.tpl || undefined); const kindTxt = g0.kind === "count" ? "Number" : g0.kind === "pct" ? "Percentage" : "Frequency";
      body.innerHTML = B.ix.split(`<div class="figure"><div class="fig-view" style="padding:.7rem .8rem;color:#16263a"><p style="margin:.1rem 0 .5rem">${esc(g0.story)}</p><p style="margin:0"><strong>Find ${esc(g0.label)}.</strong></p><div data-r="work" style="margin-top:.5rem"></div></div></div>`,
        `<div style="display:grid;gap:.45rem"><label class="small">Type of problem ${sel('data-r="tpl"', "type of problem", TPL, st.tpl)}</label>
         <label class="small">${kindTxt} ${numBox('data-r="ans"', "your answer", "8rem")}${g0.kind === "pct" ? " %" : ""}</label>
         <div class="row" style="gap:.4rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="check">Check</button><button type="button" class="btn sm" data-a="work" hidden>Show the working</button><button type="button" class="btn sm" data-a="next">New problem</button></div>
         <div data-r="fb" aria-live="polite"></div><p class="tiny muted" data-r="score" style="margin:0">${st.done ? `This session: ${st.right} of ${st.done} right first time.` : ""}</p></div>`, { label: "Problem controls", cls: "ix-nosticky-sm" });
      const g = (k) => $(`[data-r=${k}]`, body); let tries = 0;
      const work = () => { g("work").innerHTML = `<p class="small" style="margin:0 0 .2rem"><strong>Working</strong></p><ol class="small" style="margin:0;padding-left:1.2rem">${g0.work.map((w) => `<li>${esc(w)}</li>`).join("")}</ol>`; $("[data-a=work]", body).hidden = true; };
      g("tpl").addEventListener("change", (e) => { st.tpl = e.target.value; st.seed = newBase(); show(); });
      $("[data-a=next]", body).addEventListener("click", () => { st.seed = newBase(); show(); });
      $("[data-a=work]", body).addEventListener("click", work);
      $("[data-a=check]", body).addEventListener("click", () => { const s = val(g("ans")); if (!s) { g("fb").innerHTML = fb("neutral", "Type your answer first."); return; }
        const typed = g0.kind === "pct" && !/%$/.test(s) ? s + "%" : s; const r = M().markGen(g0, typed); tries++;
        if (tries === 1) { st.done++; if (r.ok) st.right++; }
        mark(g("ans"), r.ok); g("score").textContent = `This session: ${st.right} of ${st.done} right first time.`;
        if (r.ok) { g("fb").innerHTML = fb("ok", "<strong>Correct.</strong>"); $("[data-a=check]", body).disabled = true; g("ans").disabled = true; work(); }
        else { g("fb").innerHTML = fb("neutral", (r.msg.startsWith("Not quite") ? "" : "<strong>Not quite.</strong> ") + esc(r.msg)); $("[data-a=work]", body).hidden = false; } });
      g("ans").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("[data-a=check]", body).click(); } }); };
    show(); renderQs(spec, host);
  };

  // ======================================= Hardy-Weinberg Conditions Explorer =======================================
  B.interactives.hwConditions = function (spec, host) {
    const COND = [["none", "All conditions met"], ["selection", "Selection against aa"], ["migration", "Migration into the population"], ["mutation", "Mutation of A to a"], ["selfing", "Non-random mating (self-fertilisation)"]];
    const st = { cond: "none", start: "half", q0: 0.5, s: 0.5, m: 0.1, qm: 0.8, u: 0.0001, t: 1, ids: [uid(), uid()] };
    host.innerHTML = head(spec, "explore") + `<div data-r="body"></div><p class="tiny muted mt">Simplified model: a very large population; only the condition you choose is broken (a small population is shown by the genetic drift simulator on 3.3.7.1). A departure from the prediction suggests, but does not prove, that a condition is broken.</p>` + qBlock(spec);
    const body = $("[data-r=body]", host);
    body.innerHTML = B.ix.split(`<div class="ix-views row" role="tablist" aria-label="Choose a picture" style="gap:.3rem;margin-bottom:.3rem"><button type="button" class="btn sm primary" role="tab" aria-controls="${st.ids[0]}">Over 30 generations</button><button type="button" class="btn sm" role="tab" aria-controls="${st.ids[1]}">Genotypes in one generation</button></div><div id="${st.ids[0]}" data-r="f1"></div><div id="${st.ids[1]}" data-r="f2" hidden></div>`,
      `<div style="display:grid;gap:.45rem"><label class="small">Condition ${sel('data-r="cond"', "which condition", COND, st.cond)}</label>
        <label class="small">Starting population ${sel('data-r="start"', "starting population", [["half", "half AA, half aa (no heterozygotes)"], ["0.5", "Hardy-Weinberg proportions, q = 0.5"], ["0.2", "Hardy-Weinberg proportions, q = 0.2"], ["0.8", "Hardy-Weinberg proportions, q = 0.8"]], st.start)}</label>
        <div data-r="prm"></div>
        <label class="small">Show genotypes in generation <strong data-r="tv">${st.t}</strong><br><input type="range" min="0" max="30" step="1" value="${st.t}" data-r="t" aria-label="generation shown in the genotype chart" style="width:100%"></label>
        <div class="ix-readout small" data-r="out" aria-live="polite"></div></div>`, { label: "Hardy-Weinberg conditions controls" });
    const g = (k) => $(`[data-r=${k}]`, body); B.ix.viewTabs($(".ix-views", body));
    const prm = () => { const c = st.cond; g("prm").innerHTML = c === "selection" ? `<label class="small">Strength of selection against aa ${sel('data-r="s"', "selection strength", [[0.1, "weak (aa breed 90 % as well)"], [0.5, "strong (aa breed half as well)"], [1, "complete (aa never breed)"]], st.s)}</label>`
      : c === "migration" ? `<label class="small">Migrants each generation ${sel('data-r="m"', "proportion of migrants", [[0.05, "5 % of the adults"], [0.1, "10 % of the adults"], [0.2, "20 % of the adults"]], st.m)}</label><label class="small">Frequency of a in the migrants' population ${sel('data-r="qm"', "migrants' allele frequency", [[0.2, "0.2"], [0.5, "0.5"], [0.8, "0.8"]], st.qm)}</label>`
      : c === "mutation" ? `<label class="small">Mutation rate (hypothetical) ${sel('data-r="u"', "mutation rate", [[0.0001, "1 in 10 000 per generation"], [0.01, "1 in 100 (much higher than real rates)"]], st.u)}</label>`
      : c === "selfing" ? `<p class="tiny muted" style="margin:0">An extreme example of non-random mating (inbreeding), as in many plants. Animals may also mate non-randomly, for example by choosing mates that look like themselves.</p>` : "";
      $$("select", g("prm")).forEach((x) => x.addEventListener("change", (e) => { st[e.target.dataset.r] = +e.target.value; draw(); })); };
    const startG = () => (st.start === "half" ? { P: 0.5, H: 0, Q: 0.5 } : M().HWf(+st.start));
    const draw = () => { const r = M().hwStep({ start: startG(), cond: st.cond, prm: { s: st.s, m: st.m, qm: st.qm, u: st.u }, gens: 30 }); if (!r.ok) { g("out").textContent = r.err; return; }
      const G = r.gens, self = st.cond === "selfing";
      const series = self ? [{ pts: G.map((x) => [x.t, x.adults.H]), c: "#1f6fb2" }] : [{ pts: G.map((x) => [x.t, x.q]), c: "#1f6fb2" }];
      const refs = self ? [{ y: 2 * G[0].q * (1 - G[0].q), label: "2pq", c: "#5f6f7f" }] : [{ y: G[0].q, label: "prediction", c: "#5f6f7f" }];
      g("f1").innerHTML = fig(A().chart({ ...CW(), xMax: 30, xTicks: [0, 5, 10, 15, 20, 25, 30], xLabel: "Generation", yLabel: self ? "Frequency of heterozygotes" : "Frequency of allele a", series, refs, right: PH() ? 70 : 104, aria: self ? "Frequency of heterozygotes against generation, with 2pq as a dashed line" : "Frequency of allele a against generation, with the Hardy-Weinberg prediction as a dashed line" }));
      const x = G[st.t], ad = x.adults, ex = x.hwAdults;
      g("f2").innerHTML = fig(A().bars({ ...CW(), id: uid(), groups: [["AA", "P"], ["Aa", "H"], ["aa", "Q"]].map(([l, k]) => ({ label: l, vals: [ad[k], ex[k]] })), keys: [{ label: "Breeding adults", c: "#1f6fb2" }, { label: "p², 2pq, q² from their allele frequencies", c: "#5f6f7f", pattern: true }], yMax: 1, yTicks: [0, 0.5, 1], valFmt: (v) => M().fmt(v, 2), aria: `Genotype frequencies of the breeding adults in generation ${st.t} compared with Hardy-Weinberg proportions` }));
      g("tv").textContent = st.t;
      const q0 = G[0].q, q30 = G[30].q, Hd = G[30].adults.H, H2 = 2 * q30 * (1 - q30);
      g("out").innerHTML = { none: `The frequency of a stays at ${M().fmt(q0, 3)} in every generation: the Hardy-Weinberg prediction. Open "Genotypes in one generation" to compare the genotypes with p², 2pq and q².`,
        selection: `Selection changes the allele frequency: q falls from ${M().fmt(q0, 3)} to ${M().fmt(q30, 3)} in 30 generations, more and more slowly as most a alleles end up in heterozygotes.`,
        migration: `Migration changes the allele frequency: q moves from ${M().fmt(q0, 3)} towards the migrants' ${st.qm} (${M().fmt(q30, 3)} after 30 generations).`,
        mutation: `Mutation changes the allele frequency only slowly: q goes from ${M().fmt(q0, 4)} to ${M().fmt(q30, 4)} in 30 generations.`,
        selfing: `The allele frequency does not change (q stays ${M().fmt(q0, 3)}), but heterozygotes fall to ${Hd < 0.00005 ? "less than 0.0001" : M().fmt(Hd, 4)}, far below 2pq = ${M().fmt(H2, 2)}. Genotype frequencies no longer fit p², 2pq and q².` }[st.cond]; };
    g("cond").addEventListener("change", (e) => { st.cond = e.target.value; if (st.cond === "selfing" && st.start === "half") { st.start = "0.5"; g("start").value = "0.5"; } prm(); draw(); });
    g("start").addEventListener("change", (e) => { st.start = e.target.value; draw(); });
    g("t").addEventListener("input", (e) => { st.t = +e.target.value; draw(); });
    prm(); draw(); renderQs(spec, host);
  };
})(window.BIO);
