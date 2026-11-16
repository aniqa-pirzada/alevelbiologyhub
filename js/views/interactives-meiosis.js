// Interactives for 3.1.9.1 Meiosis. Kinds: meioModel, meioCombos. (Release review 2026-11-15: the question-only
// Chromosome-Counting Challenge and Which Mechanism? became ordinary page questions with the same ids.)
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
      <div class="row"><span class="small">Model cell: 2n = 4 (two homologous pairs).</span>
        <label class="small"><input type="checkbox" id="mm-cross" checked> crossing over in the long pair</label></div>
      <div class="row mt"><button class="btn sm" id="mm-back" aria-label="previous step">← Back</button><button class="btn sm primary" id="mm-next" aria-label="next step">Next →</button><button class="btn sm" id="mm-play">Play all steps</button><button class="btn sm" id="mm-restart">Restart</button><span class="small muted" id="mm-pos" aria-live="polite"></span></div>
      <div class="figure mt"><div class="fig-view" id="mm-view" tabindex="0" role="group" aria-label="meiosis model drawing; use the left and right arrow keys to change step"></div></div>
      <div class="row mt" id="mm-orient" aria-label="arrangement of each homologous pair in the first division"></div>
      <div class="grid grid-2 mt"><div class="card" id="mm-text" aria-live="polite"></div><div class="card" id="mm-counts"></div></div>
      <p class="tiny muted mt">Red = maternal, blue = paternal; letters are alleles. This is a simplified model: real cells form chiasmata at varying positions, often in every pair.</p>
      <div id="mm-q"></div>`;
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
      narrow = (view.clientWidth || 760) < 560; const W = narrow ? 400 : 760, cx = W / 2; let H = 400; const X0 = narrow ? 0 : -20, VW = narrow ? 400 : 800;
      const longLab = (g) => (M().recombinant(g) ? ["recombinant", C.TEAL, 700] : ["parental", C.GREY, 500]);
      if (["g1", "rep", "paired", "cross", "metI"].includes(pt)) {
        const c = A().stageCell(m, pt); const k = Math.min(1.45, 165 / c.ry, (narrow ? 180 : 330) / c.rx); s += A().place(c, cx, 188, k);
        if (pt === "metI") { const px = (c.rx - 15) * k; s += T(cx - px, 188 + 20, "pole", { s: 10.5, c: C.GREY }) + T(cx + px, 188 + 20, "pole", { s: 10.5, c: C.GREY }) + T(cx, 188 - c.ry * k - 6, "equator", { s: 10.5, c: C.AMBER, w: 700 }); }
      } else if (pt === "afterI" || pt === "metII") {
        const cs = [0, 1].map((i) => A().stageCell(m, pt, i, { envelope: pt === "afterI" })); const k = Math.min(1, 165 / Math.max(cs[0].ry, cs[1].ry), (narrow ? 185 : 170) / Math.max(cs[0].rx, cs[1].rx));
        if (narrow) { H = 730; s += A().place(cs[0], cx, 185, k) + A().place(cs[1], cx, 535, k); } else s += A().place(cs[0], 195, 188, k) + A().place(cs[1], 565, 188, k);
      } else {
        const cs = [0, 1, 2, 3].map((i) => A().stageCell(m, pt, i, { minR: 50 })); const k = Math.min(narrow ? 1 : 1.2, (narrow ? 120 : 125) / Math.max(...cs.map((c) => c.ry)), (narrow ? 92 : 88) / Math.max(...cs.map((c) => c.rx)));
        const pos = narrow ? [[100, 150], [300, 150], [100, 440], [300, 440]] : [0, 1, 2, 3].map((i) => [95 + i * 190, 165]); if (narrow) H = 730;
        cs.forEach((c, i) => { const [x, y] = pos[i]; const [lab, col, w] = longLab(m.gametes[i]); const ly = narrow ? y + 128 : 300; s += A().place(c, x, y, k) + T(x, ly, M().alleles(m.gametes[i]), { s: 14, w: 700 }) + T(x, ly + 18, "long chromosome:", { s: 12, c: C.GREY }) + T(x, ly + 33, lab, { s: 12.5, c: col, w }); });
        m.gametes.forEach((g) => seen.add(M().alleles(g)));
      }
      s += narrow ? `<g transform="translate(${cx - 115} ${H - 30}) scale(0.9)">${A().legend(0, 10)}</g>` : A().legend(270, 390);
      view.innerHTML = `<svg viewBox="${X0} 0 ${VW} ${H}" width="${VW}" role="img" aria-label="${esc(st.title)}" style="max-width:100%;height:auto">${s}</svg>`; fade(view.firstElementChild);
      $("#mm-text", host).innerHTML = `<h4>${st.title}</h4><p class="small">${text(pt, m)}</p><p class="tiny muted">Stage name (not required): ${st.stage}</p>`;
      const c = M().counts(pt, m.n);
      $("#mm-counts", host).innerHTML = `<h4>Counts at this step</h4><table class="tbl"><tbody><tr><th>Cells</th><td>${c.cells}</td></tr><tr><th>Chromosomes per cell (centromeres)</th><td>${c.chromosomes}</td></tr><tr><th>Chromatids per chromosome</th><td>${c.chromatidsPer}</td></tr><tr><th>DNA per cell</th><td>${c.dnaX === 1 ? "x" : c.dnaX + "x"}</td></tr><tr><th>Haploid or diploid</th><td><strong>${c.ploidy}</strong></td></tr></tbody></table><p class="tiny muted">x = DNA content of one gamete.</p>`;
      $("#mm-orient", host).innerHTML = step === 4 ? `<span class="small"><strong>First-division arrangement:</strong></span>` + orient.map((o, i) => `<button class="btn sm" data-pair="${i}">Swap pair ${i + 1} (now ${o ? "maternal" : "paternal"} faces the left pole)</button>`).join("") + `<button class="btn sm" id="mm-rand">Random arrangement</button>` : (step < 4 ? `<span class="small muted">At step 5 you can choose how each pair lines up in the first division.</span>` : `<span class="small muted">The arrangement chosen at step 5 decides which chromosomes each cell receives.</span>`);
      $$("[data-pair]", host).forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.pair; orient[i] = !orient[i]; draw(); }));
      const rb = $("#mm-rand", host); if (rb) rb.addEventListener("click", () => { orient = orient.map(() => Math.random() < 0.5); draw(); });
      $("#mm-pos", host).textContent = `Step ${step + 1} of ${STEPS.length}`; $("#mm-back", host).disabled = step === 0; $("#mm-next", host).disabled = step === STEPS.length - 1;
    };
    const go = (d) => { step = Math.max(0, Math.min(STEPS.length - 1, step + d)); draw(); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; $("#mm-play", host).textContent = "Play all steps"; } };
    $("#mm-back", host).addEventListener("click", () => { stop(); go(-1); });
    $("#mm-next", host).addEventListener("click", () => { stop(); go(1); });
    $("#mm-restart", host).addEventListener("click", () => { stop(); step = 0; draw(); });
    $("#mm-play", host).addEventListener("click", () => { if (timer) { stop(); return; } if (step === STEPS.length - 1) step = -1; go(1); $("#mm-play", host).textContent = "Pause"; timer = setInterval(() => { if (!document.body.contains(host) || step >= STEPS.length - 1) { stop(); return; } go(1); }, reduced() ? 2600 : 1800); });
    view.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(-1); } });
    $("#mm-cross", host).addEventListener("change", () => { reset(); draw(); });
    reset(); draw();
    let rt = null; const onResize = () => { if (!document.body.contains(host)) { window.removeEventListener("resize", onResize); return; } clearTimeout(rt); rt = setTimeout(() => { if (((view.clientWidth || 760) < 560) !== narrow) draw(); }, 150); };
    window.addEventListener("resize", onResize);
    allQs(spec).forEach((q) => $("#mm-q", host).append(B.questions.render(q)));
  };

  // ---------- 3. Combinations calculator ----------
  // Release review 2026-11-15: one slider (n = 1 to 10) and a "Human" button; results in ordinary or standard form.
  // Developer note: M().combos and M().zygotes return exact BigInts (2^n and (2^n)^2); crossing over is ignored.
  B.interactives.meioCombos = function (spec, host) {
    host.innerHTML = head(spec, "calculator") + `
      <div class="row"><label class="small">Homologous pairs n: <strong><span id="cb-nv">2</span></strong> <input type="range" id="cb-n" min="1" max="10" step="1" value="2" style="width:200px;accent-color:var(--teal)" aria-label="number of homologous pairs"></label><button class="btn sm" type="button" id="cb-human">Human (n = 23)</button></div>
      <div class="card mt" id="cb-out"></div>
      <p class="tiny muted mt">Crossing over is ignored here; it makes the true numbers far larger.</p>
      <div id="cb-q"></div>`;
    const sup = (n) => String(n).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("");
    const show = (b) => { const s = String(b); if (s.length <= 7) return M().fmt(b); let e = s.length - 1, m = (Number(s.slice(0, 4)) / 1000).toFixed(2); if (m === "10.00") { m = "1.00"; e += 1; } return `${m} × 10${sup(e)}`; };
    let n = 2;
    const out = () => { $("#cb-nv", host).textContent = n; const g = M().combos(n), z = M().zygotes(n);
      $("#cb-out", host).innerHTML = `<h4 style="margin-top:0">n = ${n} homologous pairs (2n = ${2 * n})</h4>
        <p class="small">Combinations of maternal and paternal chromosomes in one parent's gametes (independent segregation): 2${sup(n)} = <strong>${show(g)}</strong></p>
        <p class="small">Combinations in a zygote, adding random fertilisation: (2${sup(n)})² = <strong>${show(z)}</strong></p>
        <p class="tiny muted">n is the number of pairs: if you are given 2n, halve it first.</p>`; };
    $("#cb-n", host).addEventListener("input", () => { n = +$("#cb-n", host).value; out(); });
    $("#cb-human", host).addEventListener("click", () => { n = 23; out(); });
    out();
    allQs(spec).forEach((q) => $("#cb-q", host).append(B.questions.render(q)));
  };

})(window.BIO);
