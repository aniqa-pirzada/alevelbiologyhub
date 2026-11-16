// Interactives for 3.2.10.1 The cell cycle and 3.2.10.2 Mitosis (Phase 4 Batch 4). Kinds: cellCycleExplorer,
// mitosisAnimation. Drawings and EVERY count shown come from the model in data/content/_division-art.js
// (B.divisionModel.frames / counts), so the picture and the numbers always agree. Embedded questions are rendered with
// B.questions.render, so they are marked, recorded and count towards mastery. Controls are native buttons, selects and
// checkboxes; the drawings respond to the left and right arrow keys. With reduced motion there is no tweening: the
// model steps from frame to frame.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store.get().prefs || {}).reducedMotion);
  const head = (spec, badge = "model") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const A = () => B.divisionArt, M = () => B.divisionModel;
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .3s"; node.style.opacity = "1"; }); };
  let inst = 0;

  // ================= Cell-Cycle Explorer (3.2.10.1) =================
  const PH = [
    { id: "G1", btn: "G1", title: "G1 phase (interphase)", badge: "required", ring: "G1", graph: "G1", frame: "g1",
      text: "<ul><li>The cell <strong>grows in size</strong>.</li><li>It <strong>increases its protein content</strong>: genes are transcribed and translated (3.1.8), making enzymes and structural proteins.</li><li>The <strong>number of organelles increases</strong>, for example <strong>mitochondria</strong> and <strong>ribosomes</strong>.</li><li>Each chromosome is a <strong>single chromatid</strong> (one DNA molecule), uncoiled as chromatin.</li><li>Supporting: the longest and most variable phase; the G1/S checkpoint decides whether the cell goes on to copy its DNA.</li></ul>" },
    { id: "S", btn: "S", title: "S phase (interphase): DNA replication", badge: "required", ring: "S", graph: "S", frame: "s",
      text: "<ul><li><strong>DNA is replicated</strong> by semi-conservative replication (3.1.7.3).</li><li>Each chromosome becomes <strong>two identical sister chromatids</strong> joined at the centromere.</li><li>The <strong>DNA content doubles</strong> (2 → 4 units) but the <strong>chromosome number does not change</strong>: it is still 4 here, because each chromosome still has one centromere.</li><li>Supporting: in animal cells the centrosome is also copied.</li></ul>" },
    { id: "G2", btn: "G2", title: "G2 phase (interphase)", badge: "required", ring: "G2", graph: "G2", frame: "g2",
      text: "<ul><li><strong>Rapid cell growth</strong> continues.</li><li><strong>Protein synthesis</strong> continues, including proteins needed for division (supporting: tubulin, which builds the spindle fibres).</li><li>Each chromosome has two chromatids; DNA content stays at 4 units.</li><li>Supporting: the G2/M checkpoint checks that DNA replication is complete and that damage is repaired before mitosis starts.</li></ul>" },
    { id: "M", btn: "Mitosis", title: "Mitosis (M phase)", badge: "required", ring: "M", graph: "M", frame: "mitosis",
      text: "<ul><li>The nucleus divides: <strong>prophase, metaphase, anaphase, telophase</strong> (3.2.10.2).</li><li>The sister chromatids of every chromosome are separated by the spindle, so each new nucleus gets an identical set of chromosomes.</li><li>The shortest part of the cycle (about 1 hour of 24 in a typical human cell in culture).</li><li>Supporting: the spindle checkpoint stops anaphase until every chromosome is attached to the spindle.</li></ul>" },
    { id: "C", btn: "Cytokinesis", title: "Cytokinesis", badge: "supporting", ring: "C", graph: "C", frame: "cyto",
      text: "<ul><li>The <strong>cytoplasm divides</strong>, giving <strong>two daughter cells</strong> (it usually starts during telophase).</li><li>Each daughter cell has 4 single-chromatid chromosomes and 2 units of DNA, the same as the parent cell in G1.</li><li>The daughter cells then enter G1 of their own cycle (or stop dividing).</li></ul>" },
    { id: "G0", btn: "G0", title: "G0: leaving the cycle", badge: "supporting", ring: "G0", graph: "G1", frame: "g1",
      text: "<ul><li>Cells that stop dividing leave the cycle from G1 into a resting phase called <strong>G0</strong>. Many specialised cells, such as most nerve cells and muscle fibres, stay in G0.</li><li>Some cells in G0 can re-enter the cycle when stimulated (for example liver cells after injury).</li><li>A cell in G0 still makes proteins and does its job; it simply does not replicate its DNA or divide.</li><li>The specification says only that cells that <em>retain the ability to divide</em> show a cell cycle.</li></ul>" },
  ];
  B.interactives.cellCycleExplorer = function (spec, host) {
    const u = ++inst;
    // Layout (release review 2026-11-15): phase buttons on top, then the ring (or the DNA graph) beside a drawing of the
    // cell, then a one-line count strip and the explanation, so everything that changes is in view together. G0 and the
    // checkpoints are one stretch switch.
    host.innerHTML = head(spec) + `
      <div class="row" role="group" aria-label="phases of the cell cycle; use the left and right arrow keys to move between phases" id="cc-btns-${u}">${PH.map((p, i) => `<button class="btn sm" data-ph="${i}" aria-pressed="false"${p.id === "G0" ? " hidden" : ""}>${p.btn}</button>`).join("")}<button class="btn sm" id="cc-prev-${u}" aria-label="previous phase">←</button><button class="btn sm primary" id="cc-next-${u}" aria-label="next phase">→</button><label class="small"><input type="checkbox" id="cc-cp-${u}"> Stretch: G0 and checkpoints</label></div>
      <div class="ix-views mt" role="tablist" aria-label="Picture to show"><button type="button" role="tab" class="btn sm primary" id="cc-tr-${u}" aria-controls="cc-pr-${u}" aria-selected="true">The cycle and the cell</button><button type="button" role="tab" class="btn sm" id="cc-tg-${u}" aria-controls="cc-pg-${u}" aria-selected="false" tabindex="-1">DNA per cell</button></div>
      <div id="cc-pr-${u}" role="tabpanel" aria-labelledby="cc-tr-${u}" class="cc-pair" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.6rem;align-items:center;margin-top:.4rem">
        <div class="figure" style="margin:0"><div class="fig-view" id="cc-ring-${u}"></div></div><div class="figure" style="margin:0"><div class="fig-view" id="cc-cell-${u}" style="text-align:center"></div><p class="tiny muted" id="cc-celltitle-${u}" style="text-align:center;margin:.2rem 0 0"></p></div></div>
      <div id="cc-pg-${u}" role="tabpanel" aria-labelledby="cc-tg-${u}" hidden><div class="figure" style="margin:.4rem 0 0"><div class="fig-view" id="cc-graph-${u}" style="max-width:760px;margin:0 auto"></div>${A().dnaGraphNotes().map((n) => `<p class="tiny muted" style="margin:.25rem .3rem 0">${n}</p>`).join("")}</div></div>
      <p class="ix-readout mt" id="cc-counts-${u}" aria-live="polite"></p>
      <div class="card mt" id="cc-text-${u}" aria-live="polite"></div>
      <p class="tiny muted mt">This is a simplified model: a cell with 2n = 4. Times on the ring are for a rapidly dividing human cell (Cooper and Hausman 2007); real cycles vary from minutes to years.</p>
      <h4 class="mt">Questions</h4><div id="cc-q-${u}"></div>`;
    B.ix.viewTabs($(".ix-views", host));
    let i = 0;
    const fr = M().frames("animal"); const byId = (id) => fr.find((f) => f.id === id);
    const cnt = (id) => M().frameCounts(byId(id)).cell[0];
    const visible = () => PH.map((p, k) => k).filter((k) => PH[k].id !== "G0" || $(`#cc-cp-${u}`, host).checked);
    const draw = () => {
      const p = PH[i]; const cp = $(`#cc-cp-${u}`, host).checked;
      $$(`#cc-btns-${u} [data-ph]`, host).forEach((b) => { const on = +b.dataset.ph === i; b.setAttribute("aria-pressed", on ? "true" : "false"); b.classList.toggle("primary", on); if (PH[+b.dataset.ph].id === "G0") b.hidden = !cp; });
      // without the stretch layer the ring is cropped to the ring itself (the key of times is in the notes), so it is drawn larger
      const ring = A().cycleRing({ sel: p.ring, checkpoints: cp, g0: cp });
      $(`#cc-ring-${u}`, host).innerHTML = cp ? ring : ring.replace('viewBox="0 0 720 470" width="720"', 'viewBox="22 0 410 470" width="410"');
      const txt = cp ? p.text : p.text.replace(/<li>Supporting:[^]*?<\/li>/g, "");
      $(`#cc-text-${u}`, host).innerHTML = `<h4>${p.title}${p.badge === "supporting" ? ' <span class="badge">supporting</span>' : ""}</h4><div class="small">${txt}</div>`;
      // drawing of the cell at this phase (from the model)
      let cell = "", ct = "";
      if (p.id === "G1" || p.id === "G0") { cell = A().phaseCell("G1"); ct = "Each chromosome is one chromatid"; }
      else if (p.id === "G2") { cell = A().phaseCell("G2"); ct = "Each chromosome is two chromatids"; }
      else if (p.id === "S") { const a = A().phaseCell("G1", { raw: true, cx: 100, cy: 100 }), b = A().phaseCell("S", { raw: true, cx: 330, cy: 100 }); cell = A().svg(430, 222, "a cell at the start of S beside the same cell at the end of S, when each chromosome has two chromatids", a.s + b.s + A().T(100, 214, "start of S", { s: 16, w: 700 }) + A().T(330, 214, "end of S", { s: 16, w: 700 }) + A().L(185, 100, 240, 100, { c: "#6b7d8f", w: 2.5 }) + `<path d="M240 93 L252 100 L240 107z" fill="#6b7d8f"/>`); ct = "DNA replicated: one chromatid becomes two"; }
      else if (p.id === "M") { cell = A().frameSVG(byId("meta"), {}); ct = "Metaphase, one stage of mitosis (3.2.10.2)"; }
      else { cell = A().frameSVG(byId("cyto"), {}); ct = "Two daughter cells"; }
      $(`#cc-cell-${u}`, host).innerHTML = cell; $(`#cc-celltitle-${u}`, host).textContent = ct; fade($(`#cc-cell-${u}`, host).firstElementChild);
      // one-line count strip, derived from the model frames
      let line;
      if (p.id === "S") { const a = cnt("g1"), b = cnt("g2"); line = `DNA per cell: <strong>${a.dna} → ${b.dna} units</strong> · Chromosomes: <strong>${a.chromosomes} (no change)</strong> · Chromatids per chromosome: <strong>${a.chromatidsPer} → ${b.chromatidsPer}</strong>`; }
      else if (p.id === "M") { const pm = cnt("meta"), an = cnt("ana1"), te = cnt("telo"); line = `DNA per cell: <strong>${pm.dna} units</strong> · Chromosomes: <strong>${pm.chromosomes}</strong> in prophase and metaphase; <strong>${an.chromosomes} in the cell</strong> in anaphase and telophase (${te.groups[0].chromosomes} going to, then in, each new nucleus) · Chromatids per chromosome: <strong>${pm.chromatidsPer}, then ${an.chromatidsPer}</strong>`; }
      else { const c = cnt(p.id === "C" ? "cyto" : p.id === "G2" ? "g2" : "g1"); const per = p.id === "C" ? " per daughter cell" : " per cell"; line = `DNA${per}: <strong>${c.dna} units</strong> · Chromosomes${per}: <strong>${c.chromosomes}</strong> · Chromatids per chromosome: <strong>${c.chromatidsPer}</strong>`; }
      $(`#cc-counts-${u}`, host).innerHTML = line;
      $(`#cc-graph-${u}`, host).innerHTML = A().dnaGraph({ sel: p.graph, notes: false });
      const vis = visible(); $(`#cc-prev-${u}`, host).disabled = i === vis[0]; $(`#cc-next-${u}`, host).disabled = i === vis[vis.length - 1];
    };
    const go = (k) => { const vis = visible(); const pos = Math.max(0, Math.min(vis.length - 1, k)); i = vis[pos]; draw(); };
    const at = () => visible().indexOf(i);
    $$(`#cc-btns-${u} [data-ph]`, host).forEach((b) => b.addEventListener("click", () => { i = +b.dataset.ph; draw(); }));
    $(`#cc-btns-${u}`, host).addEventListener("keydown", (e) => { if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && e.target.matches("[data-ph]")) { e.preventDefault(); go(at() + (e.key === "ArrowRight" ? 1 : -1)); const b = $(`#cc-btns-${u} [data-ph="${i}"]`, host); if (b) b.focus(); } });
    $(`#cc-prev-${u}`, host).addEventListener("click", () => go(at() - 1));
    $(`#cc-next-${u}`, host).addEventListener("click", () => go(at() + 1));
    $(`#cc-cp-${u}`, host).addEventListener("change", () => { if (!$(`#cc-cp-${u}`, host).checked && PH[i].id === "G0") i = 0; draw(); });
    draw();
    (spec.questions || []).forEach((q) => $(`#cc-q-${u}`, host).append(B.questions.render(q)));
  };

  // ================= Mitosis Animation (3.2.10.2) =================
  const TXT = {
    g1: (an, th) => `<strong>Interphase (G1).</strong> The nucleus is intact, with a nucleolus. The chromosomes are long, uncoiled threads of <strong>chromatin</strong>, so they cannot be seen as separate structures with a light microscope: the nucleus looks grainy. ${th ? "Here they are drawn as faint threads so that you can count them (untick show counts to see the grainy nucleus). " : ""}Each chromosome is a <strong>single chromatid</strong>: one DNA molecule.`,
    g2: (an) => `<strong>Interphase (G2), after the S phase.</strong> The DNA has been replicated, so each chromosome is now <strong>two identical sister chromatids</strong> joined at a centromere. Count the centromeres: still <strong>4 chromosomes</strong>; the DNA content has doubled from 2 to 4 units. The cell grows and makes the proteins it needs to divide.${an ? " An animal cell now has two centrosomes (supporting)." : ""}`,
    pro1: (an) => `<strong>Prophase (early).</strong> The chromosomes <strong>condense</strong> (coil up, becoming shorter and thicker), so they become visible; each can be seen to have two chromatids. The nucleolus disappears. ${an ? "The two centrosomes move towards opposite sides of the nucleus and the spindle starts to form between them." : "Plant cells have no centrioles, but a spindle still forms from the cytoplasm around the nucleus."}`,
    pro2: (an) => `<strong>Prophase (late).</strong> The <strong>nuclear envelope breaks down</strong>. The chromosomes are now short and thick. The <strong>spindle</strong> is complete, stretching from pole to pole, and spindle fibres begin to attach to the <strong>centromeres</strong>. <span class="badge">supporting</span> Some books call this stage prometaphase; the 9610 specification names only prophase.`,
    meta: (an) => `<strong>Metaphase.</strong> The chromosomes <strong>line up on the equator</strong> of the spindle, each one on its own (homologous chromosomes do <strong>not</strong> pair in mitosis). Each centromere is attached to spindle fibres from <strong>both poles</strong>, so one sister chromatid faces each pole.`,
    ana1: (an) => `<strong>Anaphase.</strong> The <strong>centromere</strong> of each chromosome divides. The spindle fibres attached to the centromeres <strong>shorten</strong>, pulling the <strong>sister chromatids apart</strong> towards opposite poles, centromere first, so the arms trail behind in V shapes. Each separated chromatid is now counted as a chromosome.`,
    ana2: (an) => `<strong>Anaphase (late).</strong> One chromatid from <strong>every</strong> chromosome arrives at each pole, so the two groups are <strong>genetically identical</strong>: each has one long red, one long blue, one short red and one short blue.${an ? " The cell elongates and a furrow starts to form (supporting)." : ""}`,
    telo: (an) => `<strong>Telophase.</strong> The chromatids (now chromosomes) at the poles <strong>uncoil</strong>; a <strong>nuclear envelope re-forms</strong> round each group and nucleoli reappear; the spindle breaks down. There are now <strong>two genetically identical nuclei</strong> in one cell. Cytokinesis usually begins now: ${an ? "a cleavage furrow pinches the cell surface membrane inwards" : "a cell plate forms across the middle of the cell"} (supporting).`,
    cyto: (an) => `<strong>Cytokinesis complete</strong> <span class="badge">supporting</span>. The cytoplasm has divided: ${an ? "the cleavage furrow has pinched the cell in two" : "the cell plate has become a new cell wall between the two cells"}. Each daughter cell has the same 4 chromosomes as the parent, each a single chromatid (DNA 2 units), so the daughter cells are genetically identical to each other and to the parent. They now enter G1.`,
  };
  const STAGES = ["interphase", "prophase", "metaphase", "anaphase", "telophase"];
  const lerp = (a, b, t) => a + (b - a) * t;
  function tween(fa, fb, t) {
    if (!fa || fa.cells.length !== fb.cells.length) return fb;
    const out = JSON.parse(JSON.stringify(fb));
    out.cells.forEach((cb, ci) => { const ca = fa.cells[ci];
      for (const k of ["cx", "rx", "ry", "waist", "plate"]) if (typeof ca[k] === "number" && typeof cb[k] === "number") cb[k] = lerp(ca[k], cb[k], t);
      cb.chrs = cb.chrs.map((c) => { let s = ca.chrs.find((x) => x.id === c.id);
        if (!s) { const par = ca.chrs.find((x) => x.id === c.id.split(".")[0]); if (par) s = Object.assign({}, par, { x: par.x + (c.side || 0) * 4.5 }); }
        if (!s) { const kids = ca.chrs.filter((x) => x.id.split(".")[0] === c.id); if (kids.length) s = Object.assign({}, kids[0], { x: kids.reduce((a, x) => a + x.x, 0) / kids.length, y: kids.reduce((a, x) => a + x.y, 0) / kids.length }); }
        if (!s) return c; const r = Object.assign({}, c); for (const k of ["x", "y", "ang", "k"]) r[k] = lerp(s[k], c[k], t); return r; }); });
    return out;
  }
  B.interactives.mitosisAnimation = function (spec, host) {
    const u = ++inst;
    const items = spec.items || [];
    // Layout (release review 2026-11-15): controls and frame buttons above the drawing, a one-line count strip and the
    // explanation below it. The former "Identify the stage" mode is now a set of ordinary questions (the page moves the
    // questions of every model to Check yourself). With "show counts" off, interphase is drawn as grainy chromatin.
    host.innerHTML = head(spec, "animated model") + `
      <div class="row"><label class="small">Cell: <select id="ma-type-${u}"><option value="animal">animal cell</option><option value="plant">plant cell (as in a root tip)</option></select></label>
        <label class="small"><input type="checkbox" id="ma-lab-${u}" checked> show labels</label><label class="small"><input type="checkbox" id="ma-cnt-${u}" checked> show counts</label>
        <button class="btn sm" id="ma-back-${u}" aria-label="step back">← Back</button><button class="btn sm primary" id="ma-play-${u}">▶ Play</button><button class="btn sm" id="ma-next-${u}" aria-label="step forward">Next →</button><button class="btn sm" id="ma-replay-${u}">↺ Replay</button><span class="small muted" id="ma-pos-${u}" aria-live="polite"></span></div>
      <div class="row mt" id="ma-bar-${u}" role="group" aria-label="jump to a frame"></div>
      <div class="figure mt"><div class="fig-view" id="ma-view-${u}" style="max-width:680px;margin:0 auto" tabindex="0" role="group" aria-label="mitosis drawing; left and right arrow keys step, space plays or pauses"></div><div id="ma-key-${u}" class="small"></div></div>
      <p class="ix-readout mt" id="ma-counts-${u}" aria-live="polite"></p>
      <div class="card mt" id="ma-text-${u}" aria-live="polite"></div>
      <p class="tiny muted mt">This is a simplified model: a cell with 2n = 4, a long pair and a short pair of homologous chromosomes (red from the mother, blue from the father). Real cells have more chromosomes (onion 2n = 16, human 2n = 46), and the stages run into one another.</p>
      <h4 class="mt">Questions</h4><div data-qs="all"></div>`;
    let type = "animal", idx = 0, timer = null, raf = null, shown = null;
    const view = $(`#ma-view-${u}`, host);
    const FR = () => M().frames(type);
    const narrow = () => (view.clientWidth || host.clientWidth || 760) < 600;
    const cntOn = () => $(`#ma-cnt-${u}`, host).checked;
    const paint = (f, final) => {
      const lab = $(`#ma-lab-${u}`, host).checked ? (narrow() ? "num" : "text") : false;
      const r = A().render(f, { labels: final ? lab : false, threads: cntOn() });
      view.innerHTML = A().svg(r.w, r.h + 22, `${f.title}: ${type} cell`, r.inner + A().legend(r.w / 2 - 230, r.h + 14));
      $(`#ma-key-${u}`, host).innerHTML = final && lab === "num" ? `<ol class="small" style="margin:.3rem 0 0 1.2rem">${r.key.slice().sort((a, b) => a[0] - b[0]).map(([n, t]) => `<li value="${n}">${esc(t)}</li>`).join("")}</ol>` : "";
    };
    const frameName = (f) => f.stage === "interphase" ? `Interphase (${f.id === "g1" ? "G1" : "G2"})` : f.stage === "cytokinesis" ? "Cytokinesis" : f.stage[0].toUpperCase() + f.stage.slice(1) + (f.sub && f.sub.includes("early") ? " (early)" : f.sub && f.sub.includes("late") ? " (late)" : "");
    const draw = (from) => {
      const fr = FR(); const f = fr[idx]; if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (from && !reduced() && from.cells.length === f.cells.length) { const t0 = performance.now(), dur = 850; const step = (now) => { const t = Math.min(1, Math.max(0, now - t0) / dur); const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; if (t < 1) { paint(tween(from, f, e), false); raf = requestAnimationFrame(step); } else { raf = null; paint(f, true); } }; raf = requestAnimationFrame(step); }
      else { paint(f, true); if (from) fade(view.firstElementChild); }
      shown = f;
      const an = type === "animal";
      $(`#ma-text-${u}`, host).innerHTML = `<p class="small" style="margin:0">${TXT[f.id](an, cntOn())}</p>`;
      const fc = M().frameCounts(f), c = fc.cell[0], per = fc.cells === 2 ? " in each daughter cell" : " in the cell";
      $(`#ma-counts-${u}`, host).innerHTML = cntOn() ? `Chromosomes${per}: <strong>${c.chromosomes}</strong>${c.groups ? ` (${c.groups[0].chromosomes} ${c.groupName === "pole" ? "moving to each pole" : "in each new nucleus"})` : ""} · Chromatids per chromosome: <strong>${c.chromatidsPer}</strong> · DNA${per}: <strong>${c.dna} units</strong>` : `<strong>Counts hidden.</strong> Predict the number of chromosomes, the chromatids per chromosome and the DNA units, then tick "show counts".`;
      $(`#ma-pos-${u}`, host).textContent = `Frame ${idx + 1} of ${fr.length}`;
      $(`#ma-back-${u}`, host).disabled = idx === 0; $(`#ma-next-${u}`, host).disabled = idx === fr.length - 1;
      $$(`#ma-bar-${u} [data-f]`, host).forEach((b) => { const on = +b.dataset.f === idx; b.classList.toggle("primary", on); b.setAttribute("aria-current", on ? "step" : "false"); });
    };
    const bar = () => { $(`#ma-bar-${u}`, host).innerHTML = FR().map((f, k) => `<button class="btn sm" data-f="${k}" title="${esc(f.title)}">${k + 1}. ${esc(frameName(f))}</button>`).join("");
      $$(`#ma-bar-${u} [data-f]`, host).forEach((b) => b.addEventListener("click", () => { stop(); const prev = FR()[idx]; const k = +b.dataset.f; const adj = Math.abs(k - idx) === 1; idx = k; draw(adj ? prev : null); })); };
    const go = (d) => { const fr = FR(); const k = Math.max(0, Math.min(fr.length - 1, idx + d)); if (k === idx) return; const prev = fr[idx]; idx = k; draw(prev); };
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } $(`#ma-play-${u}`, host).textContent = "▶ Play"; };
    const tick = () => { if (!document.body.contains(host)) { stop(); return; } if (idx >= FR().length - 1) { stop(); return; } go(1); timer = setTimeout(tick, reduced() ? 2600 : 2300); };
    const play = () => { if (timer) { stop(); return; } if (idx >= FR().length - 1) { idx = 0; draw(null); } $(`#ma-play-${u}`, host).textContent = "❚❚ Pause"; timer = setTimeout(tick, reduced() ? 1800 : 900); };
    $(`#ma-back-${u}`, host).addEventListener("click", () => { stop(); go(-1); });
    $(`#ma-next-${u}`, host).addEventListener("click", () => { stop(); go(1); });
    $(`#ma-play-${u}`, host).addEventListener("click", play);
    $(`#ma-replay-${u}`, host).addEventListener("click", () => { stop(); idx = 0; draw(null); play(); });
    view.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(-1); } else if (e.key === " ") { e.preventDefault(); play(); } });
    $(`#ma-type-${u}`, host).addEventListener("change", (e) => { stop(); type = e.target.value; bar(); draw(null); });
    $(`#ma-lab-${u}`, host).addEventListener("change", () => draw(null));
    $(`#ma-cnt-${u}`, host).addEventListener("change", () => draw(null));
    const qs = $("[data-qs=all]", host); items.flatMap((it) => it.questions || []).forEach((q) => qs.append(B.questions.render(q)));
    bar(); draw(null);
    host._mitosis = { go, setType: (t) => { type = t; bar(); draw(null); }, idx: () => idx, shown: () => shown, counts: () => M().frameCounts(FR()[idx]) }; // for tests
  };
})(window.BIO);
