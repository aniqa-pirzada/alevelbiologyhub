// Interactives for 3.1.9.1 Meiosis. Kinds: meioModel, meioCount, meioCombos, meioWhich.
// Drawings and counts come from the model in data/content/_meiosis-art.js (B.meiosisModel, B.meiosisArt), so the
// picture and the numbers shown beside it always agree. Embedded questions are rendered with B.questions.render, so
// they are marked, recorded and count towards mastery. Every control is a native button, select or checkbox
// (keyboard accessible); the meiosis model also responds to the left and right arrow keys. Fades are skipped when
// reduced motion is requested.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || (B.store.get().prefs || {}).reducedMotion;
  const head = (spec, badge = "schematic") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const A = () => B.meiosisArt, M = () => B.meiosisModel;
  const allQs = (spec) => (spec.items || []).flatMap((it) => it.questions || []);
  const fade = (node) => { if (reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .35s"; node.style.opacity = "1"; }); };

  // ---------- 1. Meiosis model ----------
  const STEPS = [
    { pt: "g1", title: "1. The diploid parent cell", stage: "interphase, before replication" },
    { pt: "rep", title: "2. DNA replicates", stage: "interphase (S phase)" },
    { pt: "paired", title: "3. Homologous chromosomes pair", stage: "prophase I" },
    { pt: "cross", title: "4. Crossing over", stage: "prophase I" },
    { pt: "metI", title: "5. First division: pairs line up on the equator", stage: "metaphase I" },
    { pt: "afterI", title: "6. First division complete: two haploid cells", stage: "anaphase I and telophase I" },
    { pt: "metII", title: "7. Second division: chromosomes line up singly", stage: "metaphase II" },
    { pt: "end", title: "8. Second division complete: four haploid cells", stage: "anaphase II and telophase II" },
  ];
  B.interactives.meioModel = function (spec, host) {
    host.innerHTML = head(spec, "model") + `
      <div class="row"><label class="small">Cell: <select id="mm-org"><option value="two">2n = 4 (two pairs)</option><option value="three">2n = 6 (three pairs)</option></select></label>
        <label class="small"><input type="checkbox" id="mm-cross" checked> crossing over in the long pair</label></div>
      <div class="row mt"><button class="btn sm" id="mm-back" aria-label="previous step">← Back</button><button class="btn sm primary" id="mm-next" aria-label="next step">Next →</button><button class="btn sm" id="mm-play">Play all steps</button><button class="btn sm" id="mm-restart">Restart</button><span class="small muted" id="mm-pos" aria-live="polite"></span></div>
      <div class="figure mt"><div class="fig-view" id="mm-view" tabindex="0" role="group" aria-label="meiosis model drawing; use the left and right arrow keys to change step"></div></div>
      <div class="row mt" id="mm-orient" aria-label="arrangement of each homologous pair in the first division"></div>
      <div class="grid grid-2 mt"><div class="card" id="mm-text" aria-live="polite"></div><div class="card" id="mm-counts"></div></div>
      <div class="card mt" id="mm-tally"></div>
      <p class="tiny muted mt"><strong>Model notes.</strong> Maternal chromosomes are red and paternal blue; letters are alleles at gene loci. One chiasma, at a fixed position between loci A and B, is modelled in the long pair; real cells form chiasmata at varying positions and often in every pair. The cell is drawn with its spindle poles left and right. Which sister chromatid goes to which cell in the second division is also random in real cells; here it is fixed. Stage names are shown only as supporting labels under the text.</p>
      <h4 class="mt">Questions on the model</h4><div id="mm-q"></div>`;
    let org = "two", step = 0, timer = null, narrow = false; let cross, orient; const seen = new Set();
    const reset = () => { const n = M().ORGS[org].pairs.length; cross = Array.from({ length: n }, (_, i) => i === 0 && $("#mm-cross", host).checked); orient = Array.from({ length: n }, () => true); seen.clear(); };
    const view = $("#mm-view", host);
    const text = (pt, m) => {
      const N = 2 * m.n, n = m.n;
      return { g1: `The parent cell is <strong>diploid</strong>: ${N} chromosomes in ${n} homologous pairs. The two chromosomes of a pair (one red maternal, one blue paternal) are the same length with the centromere in the same place, and carry the same genes; the letters show that their alleles differ. Each chromosome is one DNA molecule.`,
        rep: `<span class="badge">supporting</span> The DNA replicates. Each chromosome is now two identical <strong>sister chromatids</strong> joined at a centromere. Count the centromeres: still ${N} chromosomes, but the DNA content has doubled from 2x to 4x.`,
        paired: `Homologous chromosomes come together in <strong>pairs</strong>, so each pair has four chromatids side by side. This pairing happens only in meiosis.`,
        cross: m.cross[0] ? `<strong>Crossing over.</strong> In the long pair, a maternal chromatid and a paternal chromatid (<strong>non-sister chromatids</strong>) cross at a <strong>chiasma</strong>, break and rejoin, exchanging equivalent sections. The B and b alleles have changed places on those two chromatids: they now carry <strong>A b</strong> and <strong>a B</strong>, new combinations of alleles.` : `Crossing over is switched off in this run, so no sections are exchanged and every chromatid keeps its parent's combination of alleles. Tick the box above to see a chiasma.`,
        metI: `The pairs line up on the <strong>equator</strong> (dashed line), one homologue facing each pole. <strong>Which homologue faces which pole is random, and each pair lines up independently of the others: independent segregation.</strong> Use the buttons below the drawing to change how each pair lines up, or choose a random arrangement.`,
        afterI: `<strong>Homologous chromosomes</strong> have moved to opposite poles and the cell has divided. Each cell has one chromosome from every pair, ${n} in all, so it is <strong>haploid</strong>, although each chromosome still has two chromatids (DNA 2x). The two cells carry different combinations of maternal and paternal chromosomes.`,
        metII: `In each haploid cell the ${n} chromosomes line up <strong>singly</strong> on the equator, with one sister chromatid facing each pole. ${m.cross[0] ? "Because of crossing over, the two chromatids of each long chromosome are no longer identical." : "Without crossing over, the two chromatids of each chromosome are identical."}`,
        end: `<strong>Sister chromatids</strong> have separated: four haploid cells, each with ${n} single-chromatid chromosomes (DNA x). The chromosome number did not halve again; the DNA content did. ${new Set(m.gametes.map((g) => M().alleles(g))).size === 4 ? "All four cells are genetically different." : "Without crossing over the four cells form two identical pairs; independent segregation made the pairs differ."}` }[pt];
    };
    const draw = () => {
      const m = M().build(org, { cross, orient }); const st = STEPS[step]; const pt = st.pt; const C = A().colours; let s = "";
      const T = A().T;
      // Narrow screens (phones) get a 400-wide drawing with the cells stacked, so that allele tags stay legible.
      narrow = (view.clientWidth || 760) < 560; const W = narrow ? 400 : 760, cx = W / 2; let H = 400;
      const longLab = (g) => (M().recombinant(g) ? ["long chromosome: recombinant", C.TEAL, 700] : ["long chromosome: parental alleles", C.GREY, 500]);
      if (["g1", "rep", "paired", "cross", "metI"].includes(pt)) {
        const c = A().stageCell(m, pt); const k = Math.min(1.45, 165 / c.ry, (narrow ? 180 : 330) / c.rx); s += A().place(c, cx, 188, k);
        if (pt === "metI") { const px = (c.rx - 15) * k; s += T(cx - px, 188 + 20, "pole", { s: 10.5, c: C.GREY }) + T(cx + px, 188 + 20, "pole", { s: 10.5, c: C.GREY }) + T(cx, 188 - c.ry * k - 6, "equator", { s: 10.5, c: C.AMBER, w: 700 }); }
      } else if (pt === "afterI" || pt === "metII") {
        const cs = [0, 1].map((i) => A().stageCell(m, pt, i, { envelope: pt === "afterI" })); const k = Math.min(1, 165 / Math.max(cs[0].ry, cs[1].ry), (narrow ? 185 : 170) / Math.max(cs[0].rx, cs[1].rx));
        if (narrow) { H = 730; s += A().place(cs[0], cx, 185, k) + A().place(cs[1], cx, 535, k); } else s += A().place(cs[0], 195, 188, k) + A().place(cs[1], 565, 188, k);
      } else {
        const cs = [0, 1, 2, 3].map((i) => A().stageCell(m, pt, i, { minR: 50 })); const k = Math.min(narrow ? 1 : 0.85, (narrow ? 120 : 130) / Math.max(...cs.map((c) => c.ry)), (narrow ? 92 : 86) / Math.max(...cs.map((c) => c.rx)));
        const pos = narrow ? [[100, 150], [300, 150], [100, 440], [300, 440]] : [0, 1, 2, 3].map((i) => [95 + i * 190, 165]); if (narrow) H = 730;
        cs.forEach((c, i) => { const [x, y] = pos[i]; const [lab, col, w] = longLab(m.gametes[i]); const ly = narrow ? y + 128 : 290; s += A().place(c, x, y, k) + T(x, ly, M().alleles(m.gametes[i]), { s: 13, w: 700 }) + T(x, ly + 18, lab, { s: 10, c: col, w }); });
        m.gametes.forEach((g) => seen.add(M().alleles(g)));
      }
      s += narrow ? `<g transform="translate(${cx - 115} ${H - 30}) scale(0.9)">${A().legend(0, 10)}</g>` : A().legend(270, 390);
      view.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(st.title)}" style="max-width:100%;height:auto">${s}</svg>`; fade(view.firstElementChild);
      $("#mm-text", host).innerHTML = `<h4>${st.title}</h4><p class="small">${text(pt, m)}</p><p class="tiny muted">Supporting label: ${st.stage}</p>`;
      const c = M().counts(pt, m.n);
      $("#mm-counts", host).innerHTML = `<h4>Counts at this step</h4><table class="tbl"><tbody><tr><th>Cells</th><td>${c.cells}</td></tr><tr><th>Chromosomes per cell (centromeres)</th><td>${c.chromosomes}</td></tr><tr><th>Chromatids per chromosome</th><td>${c.chromatidsPer}</td></tr><tr><th>DNA per cell</th><td>${c.dnaX === 1 ? "x" : c.dnaX + "x"}</td></tr><tr><th>Haploid or diploid</th><td><strong>${c.ploidy}</strong></td></tr></tbody></table><p class="tiny muted">x = DNA content of one gamete.</p>`;
      $("#mm-orient", host).innerHTML = step >= 4 ? `<span class="small"><strong>First-division arrangement:</strong></span>` + orient.map((o, i) => `<button class="btn sm" data-pair="${i}">Swap pair ${i + 1} (now ${o ? "maternal" : "paternal"} faces the left pole)</button>`).join("") + `<button class="btn sm" id="mm-rand">Random arrangement</button>` : `<span class="small muted">From step 5 you can choose how each pair lines up in the first division.</span>`;
      $$("[data-pair]", host).forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.pair; orient[i] = !orient[i]; draw(); }));
      const rb = $("#mm-rand", host); if (rb) rb.addEventListener("click", () => { orient = orient.map(() => Math.random() < 0.5); draw(); });
      $("#mm-pos", host).textContent = `Step ${step + 1} of ${STEPS.length}`; $("#mm-back", host).disabled = step === 0; $("#mm-next", host).disabled = step === STEPS.length - 1;
      const n = m.n, max = 2 ** (n + (cross[0] ? 1 : 0));
      $("#mm-tally", host).innerHTML = `<p class="small"><strong>Different gametes found so far with this set-up: ${seen.size} of ${max} possible.</strong> ${seen.size ? `<span class="muted">${[...seen].join(" · ")}</span>` : "<span class=\"muted\">Run to step 8, then go back to step 5 and try other arrangements.</span>"}</p><p class="tiny muted">${cross[0] ? `Independent segregation gives 2${n === 2 ? "²" : "³"} = ${2 ** n} combinations of whole chromosomes; the crossover in the long pair doubles the possible kinds of long chromosome, giving ${max}.` : `Independent segregation alone: 2ⁿ = 2${n === 2 ? "²" : "³"} = ${2 ** n}.`}</p>`;
    };
    const go = (d) => { step = Math.max(0, Math.min(STEPS.length - 1, step + d)); draw(); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; $("#mm-play", host).textContent = "Play all steps"; } };
    $("#mm-back", host).addEventListener("click", () => { stop(); go(-1); });
    $("#mm-next", host).addEventListener("click", () => { stop(); go(1); });
    $("#mm-restart", host).addEventListener("click", () => { stop(); step = 0; draw(); });
    $("#mm-play", host).addEventListener("click", () => { if (timer) { stop(); return; } if (step === STEPS.length - 1) step = -1; go(1); $("#mm-play", host).textContent = "Pause"; timer = setInterval(() => { if (!document.body.contains(host) || step >= STEPS.length - 1) { stop(); return; } go(1); }, reduced() ? 2600 : 1800); });
    view.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(-1); } });
    $("#mm-org", host).addEventListener("change", (e) => { org = e.target.value; reset(); draw(); });
    $("#mm-cross", host).addEventListener("change", () => { reset(); draw(); });
    reset(); draw();
    let rt = null; const onResize = () => { if (!document.body.contains(host)) { window.removeEventListener("resize", onResize); return; } clearTimeout(rt); rt = setTimeout(() => { if (((view.clientWidth || 760) < 560) !== narrow) draw(); }, 150); };
    window.addEventListener("resize", onResize);
    allQs(spec).forEach((q) => $("#mm-q", host).append(B.questions.render(q)));
  };

  // ---------- 2. Chromosome-counting challenge (engine questions, one cell at a time) ----------
  B.interactives.meioCount = function (spec, host) {
    const items = spec.items || []; const uid = Math.random().toString(36).slice(2, 7);
    host.innerHTML = head(spec, "challenge") + `
      <div class="notice small"><strong>How to count.</strong> Chromosomes = centromeres (dark bars or dots). A chromosome with two chromatids is still one chromosome. Diploid: every chromosome has a partner of the same length and centromere position. Haploid: one of each kind. Red = maternal, blue = paternal.</div>
      <div class="row mt" role="tablist" aria-label="cells to count" id="mc-tabs">${items.map((it, i) => `<button class="btn sm" role="tab" id="mc-tab-${uid}-${i}" aria-controls="mc-pane-${uid}-${i}" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(it.label)}</button>`).join("")}</div>
      <div id="mc-body" class="mt"></div>
      <div class="row mt"><button class="btn sm" id="mc-prev">← Previous cell</button><button class="btn sm primary" id="mc-next">Next cell →</button><span class="small muted" id="mc-pos" aria-live="polite"></span></div>`;
    let panes0 = 0; const body = $("#mc-body", host); const panes = items.map((it) => { const d = document.createElement("div"); d.hidden = true; const i = panes0++; d.id = `mc-pane-${uid}-${i}`; d.setAttribute("role", "tabpanel"); d.setAttribute("aria-labelledby", `mc-tab-${uid}-${i}`); (it.questions || []).forEach((q) => d.append(B.questions.render(q))); body.append(d); return d; });
    let cur = 0; const show = (i) => { cur = Math.max(0, Math.min(items.length - 1, i)); panes.forEach((p, k) => (p.hidden = k !== cur)); $$("#mc-tabs button", host).forEach((b, k) => { b.setAttribute("aria-selected", k === cur); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); $("#mc-pos", host).textContent = `${cur + 1} of ${items.length}`; $("#mc-prev", host).disabled = cur === 0; $("#mc-next", host).disabled = cur === items.length - 1; };
    $$("#mc-tabs button", host).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    $("#mc-tabs", host).addEventListener("keydown", (e) => { const map = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in map) ni = cur + map[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = items.length - 1; if (ni === null) return; e.preventDefault(); show(ni); $$("#mc-tabs button", host)[cur].focus(); });
    $("#mc-prev", host).addEventListener("click", () => show(cur - 1)); $("#mc-next", host).addEventListener("click", () => show(cur + 1));
    show(0);
  };

  // ---------- 3. Combinations calculator ----------
  const PRESETS = [["custom", "Choose a number of pairs", null], ["human", "Human (2n = 46)", 23], ["fly", "Fruit fly, Drosophila (2n = 8)", 4], ["mosquito", "Mosquito, Aedes aegypti (2n = 6)", 3], ["pea", "Garden pea (2n = 14)", 7], ["onion", "Onion (2n = 16)", 8], ["maize", "Maize (2n = 20)", 10], ["dog", "Dog (2n = 78)", 39]];
  B.interactives.meioCombos = function (spec, host) {
    host.innerHTML = head(spec, "exact arithmetic") + `
      <div class="row"><label class="small">Organism: <select id="cb-org">${PRESETS.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label>
        <label class="small">Homologous pairs n: <strong><span id="cb-nv">2</span></strong> <input type="range" id="cb-n" min="1" max="40" step="1" value="2" style="width:170px;accent-color:var(--teal)" aria-label="number of homologous pairs"></label></div>
      <div class="grid grid-2 mt"><div class="card" id="cb-out"></div><div class="card" id="cb-list"></div></div>
      <p class="tiny muted mt"><strong>Model notes.</strong> Exact integer arithmetic. Independent segregation of n pairs gives 2ⁿ combinations of maternal and paternal chromosomes per parent; random fertilisation of two parents' gametes gives 2ⁿ × 2ⁿ = (2ⁿ)² chromosome combinations in the zygote. Crossing over is ignored; it makes the true numbers far larger.</p>
      <h4 class="mt">Try the calculations</h4><div id="cb-q"></div>`;
    const sup = (n) => String(n).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("");
    const out = () => {
      const n = +$("#cb-n", host).value; $("#cb-nv", host).textContent = n; const g = M().combos(n), z = M().zygotes(n);
      $("#cb-out", host).innerHTML = `<h4>n = ${n} pairs (2n = ${2 * n})</h4>
        <p class="small">Combinations in one parent's gametes, independent segregation: 2${sup(n)} = <strong>${M().fmt(g)}</strong>${g > 999999n ? ` (≈ ${M().sci(g)})` : ""}</p>
        <p class="small">Combinations in a zygote, adding random fertilisation: (2${sup(n)})² = <strong>${M().fmt(z)}</strong>${z > 999999n ? ` (≈ ${M().sci(z)})` : ""}</p>
        <p class="small">Chance that a gamete receives only maternal chromosomes: (½)${sup(n)} = 1 in ${M().fmt(g)}</p>
        <p class="tiny muted">Remember: n is the number of pairs. If you are given 2n, halve it first.</p>`;
      const C = A().colours;
      if (n <= 4) { const rows = []; for (let k = 0; k < 2 ** n; k++) { const bits = Array.from({ length: n }, (_, i) => ((k >> (n - 1 - i)) & 1 ? "P" : "M")); rows.push(`<div class="row" style="gap:4px;margin:2px 0">${bits.map((b, i) => `<span title="pair ${i + 1}: ${b === "M" ? "maternal" : "paternal"}" style="display:inline-block;min-width:28px;text-align:center;border-radius:6px;padding:1px 4px;color:#fff;font-size:12px;font-weight:700;background:${b === "M" ? C.MAT : C.PAT}">${i + 1}${b === "M" ? "m" : "p"}</span>`).join("")}</div>`); }
        $("#cb-list", host).innerHTML = `<h4>All ${2 ** n} combinations</h4><p class="tiny muted">Each row is one possible gamete: for each pair (1, 2, …), whether it received the maternal (m, red) or paternal (p, blue) chromosome.</p>${rows.join("")}`; }
      else $("#cb-list", host).innerHTML = `<h4>Too many to list</h4><p class="small">With ${n} pairs there are ${M().fmt(g)} combinations. Each extra pair doubles the number.</p><table class="tbl"><thead><tr><th>n</th><th>2ⁿ</th></tr></thead><tbody>${[n - 2, n - 1, n].filter((x) => x >= 1).map((x) => `<tr><td>${x}</td><td>${M().fmt(M().combos(x))}</td></tr>`).join("")}</tbody></table>`;
    };
    $("#cb-n", host).addEventListener("input", () => { $("#cb-org", host).value = "custom"; out(); });
    $("#cb-org", host).addEventListener("change", (e) => { const p = PRESETS.find((x) => x[0] === e.target.value); if (p && p[2]) $("#cb-n", host).value = p[2]; out(); });
    out();
    allQs(spec).forEach((q) => $("#cb-q", host).append(B.questions.render(q)));
  };

  // ---------- 4. Which mechanism? (engine questions) ----------
  B.interactives.meioWhich = function (spec, host) {
    host.innerHTML = head(spec, "challenge") + `
      <details class="small"><summary>Remind me how to tell them apart</summary><table class="tbl mt"><thead><tr><th>Mechanism</th><th>When</th><th>What is shuffled</th></tr></thead><tbody><tr><td>Independent segregation</td><td>First division of meiosis</td><td>Whole chromosomes: which homologue of each pair goes into which cell</td></tr><tr><td>Crossing over</td><td>First division, while homologues are paired</td><td>Sections of non-sister chromatids: alleles on one chromosome</td></tr><tr><td>Random fertilisation</td><td>After meiosis</td><td>Which gamete fuses with which</td></tr></tbody></table></details>
      <div id="wm-q" class="mt"></div>`;
    allQs(spec).forEach((q) => $("#wm-q", host).append(B.questions.render(q)));
  };
})(window.BIO);
