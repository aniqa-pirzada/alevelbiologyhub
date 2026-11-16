// RP4 Interactive Root-Tip Laboratory and Virtual Root-Tip Microscope (Phase 4 Batch 4, RP4 author).
// Registers B.labSims.roottip = { sim(host, key), calc(host, key) } (called by js/views/lab.js when
// B.practicals[4].sim === "roottip"; results in B.store.get().labRuns[key]) and B.interactives.rootTipMicroscope
// (spec, host) for the 3.2.10.2 page (its results are kept separately in labRuns["4m"]).
//
// Bench: apparatus from the handbook list goes on the bench (drag, click or Enter), then the handbook steps are chosen
// in order (wrong choices are explained). Three steps are decisions with consequences: which end of the 2 cm root
// piece to cut (or both ends, the handbook's advice), how long to macerate in toluidine blue, and how to squash.
// A "hidden fault" challenge spoils one part of the slide for the student to diagnose from what they see.
// Microscope: ×10 overview of the squash with numbered fields, ×40 field of view, fine focus, zoom, cell inspector,
// stage identification with feedback, tallies and records. All images are drawn by B.rootTipModel
// (data/content/_roottip-model.js): "simulated image (illustration), not a micrograph". Seeded, so a slide can be
// regenerated exactly. Accessibility: every control is a native button, select or range; the field of view is a single
// tab stop (arrow keys move between cells, 1–5 identify, 0 = cannot identify); updates are announced in polite live
// regions; nothing moves by itself with reduced motion; the field scales to the width (zoom scrolls inside its box).
window.BIO = window.BIO || {}; window.BIO.labSims = window.BIO.labSims || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { el, $, $$, esc } = B.util;
  const M = () => B.rootTipModel;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion") || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const wait = (ms) => new Promise((res) => setTimeout(res, reduced() ? 0 : ms));
  const KEYS = ["interphase", "prophase", "metaphase", "anaphase", "telophase"];
  const ok = (t) => `<span style="color:var(--sage-ink)">${t}</span>`, bad = (t) => `<span style="color:var(--rose-ink)">${t}</span>`, amb = (t) => `<span style="color:var(--amber-ink)">${t}</span>`;
  const f3 = (x) => (Math.round(x * 1000) / 1000).toFixed(3);
  let styled = false;
  const ensureStyle = () => { if (styled) return; styled = true; const s = document.createElement("style");
    s.textContent = `.rtm-grid{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:.9rem;align-items:start}@media (max-width:760px){.rtm-grid{grid-template-columns:minmax(0,1fr)}}
.rtm-view{max-width:100%;overflow:auto;border-radius:10px;background:#111}.rtm-view:focus-visible{outline:3px solid var(--teal);outline-offset:2px}.rtm-fig{width:100%}
.rtm-view .rt-count{cursor:pointer}.rtm-stage{display:flex;flex-wrap:wrap;gap:.35rem}.rtm-stage .btn{min-width:6.2rem}.rtm-tally{display:flex;flex-wrap:wrap;gap:.35rem;margin:.4rem 0}
.rtm-tally span{border:1px solid var(--line-strong);border-radius:999px;padding:.15rem .55rem;font-size:.85rem}.rtm-insp{background:var(--panel,transparent);border:1px solid var(--line);border-radius:10px;padding:.6rem}
.rtm-wrap{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center}.rtm-wrap label{display:flex;gap:.35rem;align-items:center;flex-wrap:wrap}
.rtb-scroll{max-width:100%;overflow-x:auto}.rtb-piece{transition:transform .8s ease}@media (prefers-reduced-motion: reduce){.rtb-piece{transition:none}}`; document.head.append(s); };
  const inp = (id, w = "6rem", ph = "") => `<input id="${id}" type="text" inputmode="decimal" autocomplete="off" placeholder="${ph}" style="width:${w};padding:.35rem .5rem;border:1px solid var(--line-strong);border-radius:8px">`;

  // ================= slides =================
  // mount: "tip" (1 mm from the tip: meristem), "cut" (1 mm from the cut end: older tissue behind the meristem, drawn with elongated, non-dividing cells), "both" (both ends,
  // the handbook's advice: fields 1–8 meristem, 9–12 the other end). prep: { stain, broken, squash: gentle|none|heavy }.
  const NF = 12;
  function makeSlide({ sampleId = "control", seed = 1, mount = "tip", stain = 1, broken = 1, squash = "gentle", hours = 4, hidden = null, own = false }) {
    const faint = stain < 0.6, layered = broken < 0.6 || squash === "none", ruptured = squash === "heavy";
    const fields = []; for (let i = 0; i < NF; i++) { const zone = mount === "cut" || (mount === "both" && i >= 8) ? "elongation" : M().SAMPLES[sampleId].zone; fields.push(M().makeField(sampleId, seed, i, { zone, stain: faint ? 0.4 : 1, layered, ruptured }, hours)); }
    const g = M().rng(M().hash("focus", seed, sampleId)); const target = 26 + Math.round(g() * 16 * 2) / 2;
    return { sampleId, seed, mount, stain, broken, squash, hours, faint, layered, ruptured, fields, target, hidden, own, id: `${own ? "own" : "prep"}-${sampleId}-${seed}` };
  }
  const flagsOf = (sl) => [sl.mount === "cut" && "tissue from the wrong end (not meristem: older, elongated cells)", sl.mount === "both" && "both ends mounted", sl.faint && "poorly stained", sl.layered && "cells not separated (layers)", sl.ruptured && "squashed too hard (burst cells)"].filter(Boolean);
  const sampleName = (r) => (r.own ? "Your slide" : "Prepared slide") + ": " + (M().SAMPLES[r.sampleId] || {}).short + (M().SAMPLES[r.sampleId] && M().SAMPLES[r.sampleId].treat ? `, ${r.hours} h` : "");

  // ================= microscope =================
  // opts: { key, slide, samples (ids offered as prepared slides), allowFaultChallenge, onRecord, title }
  function microscope(host, opts) {
    ensureStyle(); const uid = Math.random().toString(36).slice(2, 7);
    const st = { slide: opts.slide, fi: 0, obj: 10, focus: 0, ids: {}, blurIds: {}, how: {}, sel: null, spindle: false, check: true, zoom: 1, visited: new Set(), recorded: new Set(), diag: null };
    const startFocus = () => { const g = M().rng(st.slide.seed * 13 + 5); const off = st.slide.hidden === "focus" ? (g() < 0.5 ? -1 : 1) * (14 + g() * 4) : (g() < 0.5 ? -1 : 1) * (4 + g() * 3); st.focus = Math.max(0, Math.min(60, Math.round((st.slide.target + off) * 2) / 2)); };
    startFocus();
    const samples = opts.samples || [];
    host.innerHTML = `
      <div class="ix ix-nosticky-sm" style="margin-top:0"><div class="ix-body"><div class="ix-stage"><div class="rtm-view ix-free" data-r="view" tabindex="0" aria-label="Microscope field of view. At ×40: arrow keys move between cells, 1 to 5 identify the selected cell, 0 means cannot identify." aria-describedby="live-${uid}"><div class="rtm-fig" data-r="fig"></div></div>
        <p class="tiny muted mt">Counting rule <span class="badge">platform convention</span>: count only cells whose centre lies inside the field of view; cells cut off by the edge are not clickable and are left out. Count every whole cell in the field, not only the dividing ones.</p></div><div class="ix-panel">
      <div class="rtm-wrap">${samples.length ? `<label class="small">Slide <select data-r="sample">${opts.ownLabel ? `<option value="own">${esc(opts.ownLabel)}</option>` : ""}${(() => { const opt = (s) => `<option value="${s}">${esc(s === "fault" ? "Challenge: a faulty slide (what went wrong?)" : M().SAMPLES[s].label)}</option>`; const core = samples.filter((s) => !(s === "fault" || (M().SAMPLES[s] || {}).treat)), extra = samples.filter((s) => !core.includes(s)); return core.map(opt).join("") + (extra.length ? `<optgroup label="Stretch: hypothetical treatments and troubleshooting">${extra.map(opt).join("")}</optgroup>` : ""); })()}</select></label>
        <label class="small" data-r="hrsbox" hidden>Exposure (stretch) <select data-r="hours"><option value="2">2 h</option><option value="4" selected>4 h</option><option value="8">8 h</option></select></label>` : ""}
        <button type="button" class="btn sm" data-r="newslide">New slide</button></div>
      <div class="rtm-wrap"><span class="small"><strong>Objective</strong></span><button type="button" class="btn sm" data-obj="10" aria-pressed="true">×10 (low power)</button><button type="button" class="btn sm" data-obj="40" aria-pressed="false">×40 (high power)</button>
        <label class="small">Fine focus <input type="range" data-r="focus" min="0" max="60" step="0.5" style="width:150px;accent-color:var(--teal)" aria-describedby="fs-${uid}"></label><span class="tiny" id="fs-${uid}" data-r="fstat" aria-live="polite"></span></div>
      <div class="rtm-wrap"><button type="button" class="btn sm" data-r="prev" aria-label="previous field">◀</button><span class="small" data-r="fpos"></span><button type="button" class="btn sm" data-r="next" aria-label="next field (move the stage systematically)">▶</button><button type="button" class="btn sm" data-r="rand">Random unvisited field</button>
        <span class="small" style="margin-left:.4rem">Zoom</span><button type="button" class="btn sm" data-z="-1" aria-label="zoom out">−</button><button type="button" class="btn sm" data-z="1" aria-label="zoom in">+</button><button type="button" class="btn sm" data-z="0">Reset</button></div>
        <div class="rtm-insp"><div data-r="insp"></div>
          <label class="small mt"><input type="checkbox" data-r="spindle"> stretch: show spindle fibres (orange; toluidine blue does not show them)</label>
          <div class="rtm-stage mt" role="group" aria-label="identify the selected cell">${KEYS.map((k, i) => `<button type="button" class="btn sm" data-id="${k}">${i + 1} ${M().NAME[k]}</button>`).join("")}<button type="button" class="btn sm" data-id="uncertain">0 Cannot identify</button></div>
          <label class="small mt"><input type="checkbox" data-r="check" checked> check each identification as I go</label>
          <div class="small mt" data-r="fb" id="live-${uid}" aria-live="polite"></div>
          <details class="mt"><summary class="small"><strong>Key features of each stage</strong></summary><ul class="small">${KEYS.map((k) => `<li><strong>${M().NAME[k]}.</strong> ${esc(M().FEATURES[k])}</li>`).join("")}</ul></details></div>
      <div class="rtm-tally" data-r="tally" aria-live="polite"></div>
      <div class="rtm-wrap"><button type="button" class="btn primary sm" data-r="record">Record this field</button><button type="button" class="btn sm" data-r="clearids">Clear identifications in this field</button></div>
      <div class="small" data-r="recfb" aria-live="polite"></div></div></div></div>
      ${opts.allowDiagnosis ? `<details class="mt" data-r="diagbox"><summary class="small"><strong>Diagnose this slide</strong></summary><p class="small muted">Look at several fields at ×10 and ×40, then decide what (if anything) went wrong in preparing the slide.</p><label class="small">What is wrong? <select data-r="diag"><option value="">choose…</option><option value="none">Nothing: a good slide</option><option value="tooFar">Tissue was taken too far from the tip</option><option value="stain">Poorly stained</option><option value="layers">Cells not separated: the tissue was not macerated or squashed enough</option><option value="crushed">Squashed too hard or the coverslip slid</option><option value="focus">Nothing wrong with the slide: the microscope was badly out of focus</option></select></label> <button type="button" class="btn sm" data-r="diagcheck">Check</button><div class="small mt" data-r="diagfb" aria-live="polite"></div></details>` : ""}`;
    const q = (k) => $(`[data-r="${k}"]`, host);
    const field = () => st.slide.fields[st.fi];
    const dF = () => Math.abs(st.focus - st.slide.target), dF2 = () => Math.abs(st.focus - (st.slide.target + 6));
    const blurOf = (d) => Math.min(5, Math.max(0, d - 0.5) * 0.5);
    const isBlurred = (cell) => (cell && cell.layer === 2 ? dF2() : dF()) > 1.2;
    const idsF = () => (st.ids[st.fi] = st.ids[st.fi] || {});
    const countable = () => field().cells.filter((c) => c.countable);
    const wrongMap = () => { if (!st.check && !st.recorded.has(st.fi)) return {}; const w = {}; const ids = idsF(); countable().forEach((c) => { if (ids[c.id]) { const j = M().judgeCell(c, ids[c.id], { blurred: (st.blurIds[st.fi] || {})[c.id] }); if (!j.ok && j.verdict !== "uncertain") w[c.id] = true; } }); return w; };

    function overview() {
      const sl = st.slide, V = M().VIEW, C = M().CX; const pieces = sl.mount === "both" ? [{ cx: 150, cy: 220, rx: 105, ry: 150, idx: [0, 1, 2, 3, 4, 5, 6, 7] }, { cx: 330, cy: 225, rx: 70, ry: 140, idx: [8, 9, 10, 11] }] : [{ cx: 220, cy: 220, rx: 150, ry: 165, idx: [...Array(NF).keys()] }];
      const pos = {}; pieces.forEach((p) => { const cols = p.idx.length > 8 ? 3 : p.idx.length > 4 ? 2 : 1, rows = Math.ceil(p.idx.length / cols); p.idx.forEach((fi, k) => { const cI = k % cols, rI = Math.floor(k / cols); pos[fi] = [p.cx + (cols === 1 ? 0 : (cI - (cols - 1) / 2) * (p.rx * 1.3 / (cols - 1 || 1))), p.cy + (rI - (rows - 1) / 2) * (p.ry * 1.55 / Math.max(1, rows - 1))]; }); });
      const pat = (z, id) => z === "elongation" ? `<pattern id="${id}" width="11" height="30" patternUnits="userSpaceOnUse"><rect x=".5" y=".5" width="10" height="29" fill="#ece3f3" stroke="#a18bbd" stroke-width=".8"/><circle cx="5.5" cy="${8}" r="2.2" fill="#7f8ad0"/></pattern>` : `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect x=".5" y=".5" width="9" height="9" fill="#ece3f3" stroke="#a18bbd" stroke-width=".7"/><circle cx="5" cy="5" r="2.4" fill="#6f7bc8"/></pattern>`;
      const blur = blurOf(dF()); let defs = `<clipPath id="${uid}oc"><circle cx="${C}" cy="${C}" r="${M().R_FOV}"/></clipPath><filter id="${uid}ob"><feGaussianBlur stdDeviation="${blur.toFixed(2)}"/></filter>`;
      let body = "";
      pieces.forEach((p, k) => { const z = sl.fields[p.idx[0]].zone; defs += pat(z, `${uid}p${k}`) + `<clipPath id="${uid}pc${k}"><ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}"/></clipPath>`;
        body += `<ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx + 6}" ry="${p.ry + 6}" fill="#e6dbef" opacity=".6"/><rect x="${p.cx - p.rx}" y="${p.cy - p.ry}" width="${p.rx * 2}" height="${p.ry * 2}" fill="url(#${uid}p${k})" clip-path="url(#${uid}pc${k})" opacity="${sl.faint ? 0.55 : 1}"/>`;
        if (sl.layered) body += `<rect x="${p.cx - p.rx}" y="${p.cy - p.ry}" width="${p.rx * 2}" height="${p.ry * 2}" fill="url(#${uid}p${k})" clip-path="url(#${uid}pc${k})" opacity=".5" transform="translate(4 5)"/>`; });
      const marks = Object.entries(pos).map(([fi, [x, y]]) => { fi = +fi; const F = sl.fields[fi]; const dots = F.cells.filter((c) => c.countable && c.cfg.stage !== "interphase").map((c) => `<circle cx="${(x + ((c.x - C) / 200) * 20).toFixed(1)}" cy="${(y + ((c.y - C) / 200) * 20).toFixed(1)}" r="1.9" fill="${sl.faint ? "#6f78b8" : "#141c5c"}"/>`).join("");
        const vis = st.visited.has(fi), rec = st.recorded.has(fi);
        return `<g class="rtm-mark" data-fi="${fi}" tabindex="0" role="button" aria-label="field ${fi + 1}${rec ? ", recorded" : vis ? ", visited" : ""}" style="cursor:pointer">${dots}<circle cx="${x}" cy="${y}" r="21" fill="#fff" fill-opacity=".08" stroke="${rec ? "#1f8a85" : vis ? "#5aa9a5" : "#16263a"}" stroke-width="${rec ? 3.5 : 2}" stroke-dasharray="${vis || rec ? "none" : "4 3"}"/><text x="${x + 20}" y="${y - 17}" font-size="13" font-weight="700" fill="#16263a" paint-order="stroke" stroke="#fff" stroke-width="3">${fi + 1}${rec ? " ✓" : ""}</text></g>`; }).join("");
      return `<svg viewBox="0 0 ${V} ${V}" width="${V}" role="group" aria-label="Low-power (×10) view of the squash with ${NF} numbered fields; choose a field to examine it at ×40" style="max-width:100%;height:auto;display:block;background:#111"><defs>${defs}</defs><g clip-path="url(#${uid}oc)"><rect width="${V}" height="${V}" fill="#f6f2f9"/><g${blur > 0.05 ? ` filter="url(#${uid}ob)"` : ""}>${body}${marks}</g></g><circle cx="${C}" cy="${C}" r="${M().R_FOV}" fill="none" stroke="#333" stroke-width="3"/><text x="8" y="432" font-size="12" fill="#e6e6e6">×10</text>${sl.mount === "both" ? `<text x="150" y="40" font-size="13" font-weight="700" text-anchor="middle" fill="#16263a">piece 1</text><text x="330" y="52" font-size="13" font-weight="700" text-anchor="middle" fill="#16263a">piece 2</text>` : ""}</svg>`;
    }
    function draw(focusCell) {
      const F = field();
      $$("[data-obj]", host).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.obj === st.obj)));
      q("focus").value = st.focus; const d = dF(); q("fstat").innerHTML = d <= 1.2 ? ok("in focus") : d <= 4 ? amb("slightly out of focus") : bad("out of focus");
      q("fpos").textContent = st.obj === 10 ? `×10: choose a field (${st.visited.size} of ${NF} visited)` : `Field ${st.fi + 1} of ${NF}${st.recorded.has(st.fi) ? " (recorded)" : ""}`;
      ["prev", "next"].forEach((k) => (q(k).disabled = false));
      if (st.obj === 10) { q("fig").innerHTML = overview(); }
      else { q("fig").innerHTML = M().drawField(F, { blur1: blurOf(dF()), blur2: blurOf(dF2()), marks: idsF(), wrong: wrongMap(), sel: st.sel, aria: `Field ${st.fi + 1} at ×40: ${countable().length} countable cells` }); }
      q("fig").style.width = `${st.zoom * 100}%`;
      wireFig(); insp(); tally();
      if (focusCell !== undefined && st.obj === 40) { const g = $(`.rt-cell[data-id="${focusCell}"]`, q("fig")); if (g) { g.setAttribute("tabindex", "0"); g.focus({ preventScroll: false }); } }
    }
    function wireFig() {
      $$(".rtm-mark", q("fig")).forEach((g) => { const go = () => { const fi = +g.dataset.fi; if (!st.how[fi]) st.how[fi] = "picked"; gotoField(fi); }; g.addEventListener("click", go); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });
      $$(".rt-count", q("fig")).forEach((g) => g.addEventListener("click", () => { st.sel = +g.dataset.id; draw(st.sel); }));
    }
    function gotoField(fi) { st.fi = (fi + NF) % NF; st.visited.add(st.fi); st.obj = 40; st.sel = null; draw(); }
    function insp() {
      const box = q("insp"); if (st.obj === 10) { box.innerHTML = `<p class="small"><strong>Low power (×10).</strong> Find the tissue and focus on it, then choose a field to examine at ×40 (or use ▶ to move across the slide systematically, or the random button). ${st.slide.mount === "both" ? "Two pieces were mounted (both ends of the root piece). Meristem cells are small and square with the nucleus in the centre; cells behind the meristem are elongated with the nucleus off-centre." : ""}</p>`; return; }
      const c = countable().find((x) => x.id === st.sel); if (!c) { box.innerHTML = `<p class="small muted">Select a cell in the field (click it, or focus the field and use the arrow keys) to see it magnified here.</p>`; return; }
      const mine = idsF()[c.id]; box.innerHTML = `<div style="max-width:260px;margin:0 auto">${M().cellSVG(c, { spindle: st.spindle, blur: blurOf(c.layer === 2 ? dF2() : dF()) * 4, aria: `Selected cell ${c.id + 1}, magnified (simulated drawing)` })}</div><p class="tiny muted" style="text-align:center">Cell ${c.id + 1}${c.layer === 2 ? " (in a second layer of cells: focus differently to see it)" : ""}${mine ? ` · your identification: <strong>${M().NAME[mine]}</strong>` : ""}</p>`;
    }
    function tally() {
      const ids = idsF(), cs = countable(); const t = M().tally(cs.map((c) => ids[c.id]).filter(Boolean)); const unc = cs.filter((c) => ids[c.id] === "uncertain").length; const n = cs.filter((c) => ids[c.id]).length;
      q("tally").innerHTML = st.obj === 10 ? "" : KEYS.map((k) => `<span>${M().NAME[k]}: <strong>${t[k]}</strong></span>`).join("") + `<span>Cannot identify: <strong>${unc}</strong></span><span>Identified: <strong>${n}</strong> of ${cs.length}</span>`;
      q("record").disabled = st.obj === 10; q("clearids").disabled = st.obj === 10;
    }
    function identify(stage, fromKey) {
      if (st.obj !== 40) { q("fb").innerHTML = "Switch to the ×40 objective to identify cells."; return; }
      const c = countable().find((x) => x.id === st.sel); if (!c) { q("fb").innerHTML = "Select a cell first."; return; }
      const blurred = isBlurred(c); idsF()[c.id] = stage; (st.blurIds[st.fi] = st.blurIds[st.fi] || {})[c.id] = blurred;
      if (st.recorded.has(st.fi)) st.recorded.delete(st.fi);
      if (st.check) { const j = M().judgeCell(c, stage, { blurred }); q("fb").innerHTML = j.verdict === "focus" ? amb(esc(j.msg)) : j.ok ? (j.verdict === "uncertain" ? amb(esc(j.msg)) : ok(esc(j.msg))) : j.verdict === "uncertain" ? amb(esc(j.msg)) : bad(esc(j.msg)); }
      else q("fb").innerHTML = `Cell ${c.id + 1}: ${M().NAME[stage]} recorded${blurred ? " (out of focus)" : ""}.`;
      // move on to the next unidentified cell, in reading order
      const order = countable().slice().sort((a, b) => a.y - b.y || a.x - b.x); const next = order.find((x) => !idsF()[x.id] && (x.y > c.y || (x.y === c.y && x.x > c.x))) || order.find((x) => !idsF()[x.id]);
      if (next) st.sel = next.id; draw(fromKey ? st.sel : undefined);
    }
    // keyboard in the field of view
    q("view").addEventListener("keydown", (e) => {
      if (st.obj !== 40) return; const cs = countable(); if (!cs.length) return; const cur = cs.find((c) => c.id === st.sel) || null;
      const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      if (dir) { e.preventDefault(); if (!cur) { st.sel = cs.slice().sort((a, b) => a.y - b.y || a.x - b.x)[0].id; draw(st.sel); return; }
        let best = null, bs = Infinity; cs.forEach((c) => { if (c === cur) return; const dx = c.x - cur.x, dy = c.y - cur.y; const along = dx * dir[0] + dy * dir[1]; if (along <= 4) return; const across = Math.abs(dx * dir[1] - dy * dir[0]); const sc = along + across * 2.2; if (sc < bs) { bs = sc; best = c; } }); if (best) { st.sel = best.id; draw(st.sel); } return; }
      const k = { 1: "interphase", 2: "prophase", 3: "metaphase", 4: "anaphase", 5: "telophase", 0: "uncertain" }[e.key]; if (k && cur) { e.preventDefault(); identify(k, true); }
    });
    q("view").addEventListener("focus", () => { if (st.obj === 40 && st.sel === null && countable().length) { st.sel = countable().slice().sort((a, b) => a.y - b.y || a.x - b.x)[0].id; draw(); } });
    $$("[data-obj]", host).forEach((b) => b.addEventListener("click", () => { const o = +b.dataset.obj; if (o === 40 && !st.visited.size) { st.how[st.fi] = st.how[st.fi] || "systematic"; st.visited.add(st.fi); } st.obj = o; if (o === 40) { q("fb").innerHTML = `Turned to the ×40 objective. Use only the fine focus at high power${dF() > 4 ? ": the image is out of focus" : ""}.`; } draw(); }));
    q("focus").addEventListener("input", () => { st.focus = +q("focus").value; draw(); });
    q("prev").addEventListener("click", () => { const fi = (st.fi - 1 + NF) % NF; st.how[fi] = st.how[fi] || "systematic"; gotoField(fi); });
    q("next").addEventListener("click", () => { const fi = st.obj === 10 && !st.visited.size ? 0 : (st.fi + 1) % NF; st.how[fi] = st.how[fi] || "systematic"; gotoField(fi); });
    q("rand").addEventListener("click", () => { const left = [...Array(NF).keys()].filter((i) => !st.visited.has(i)); if (!left.length) { q("fb").innerHTML = "Every field on this slide has been visited."; return; } const g = M().rng(M().hash(st.slide.seed, st.visited.size, "rand")); const fi = left[Math.floor(g() * left.length)]; st.how[fi] = st.how[fi] || "random"; gotoField(fi); });
    $$("[data-z]", host).forEach((b) => b.addEventListener("click", () => { const k = +b.dataset.z; st.zoom = k === 0 ? 1 : Math.max(1, Math.min(3, st.zoom + 0.5 * k)); q("fig").style.width = `${st.zoom * 100}%`; }));
    $$("[data-id]", host).forEach((b) => b.addEventListener("click", () => identify(b.dataset.id)));
    q("spindle").addEventListener("change", () => { st.spindle = q("spindle").checked; insp(); });
    q("check").addEventListener("change", () => { st.check = q("check").checked; draw(st.sel === null ? undefined : st.sel); });
    q("clearids").addEventListener("click", () => { st.ids[st.fi] = {}; st.blurIds[st.fi] = {}; st.recorded.delete(st.fi); q("recfb").textContent = "Identifications in this field cleared."; draw(); });
    q("record").addEventListener("click", () => record(false));
    function record(force, forceWrong) {
      const cs = countable(), ids = idsF(); const missing = cs.filter((c) => !ids[c.id]).length;
      if (st.check && !forceWrong) { const nw = Object.keys(wrongMap()).length; if (nw) { q("recfb").innerHTML = `${amb(`${nw} identification${nw === 1 ? " looks" : "s look"} wrong (marked in red). Check ${nw === 1 ? "it" : "them"} before recording.`)} <button type="button" class="btn sm" data-r="forcew">Record anyway</button>`; q("forcew").addEventListener("click", () => record(force, true)); return; } }
      if (missing && !force) { q("recfb").innerHTML = `${amb(`Incomplete count: ${missing} of ${cs.length} cells in this field have not been identified. The mitotic index needs the TOTAL number of cells, so every cell must be counted.`)} <button type="button" class="btn sm" data-r="force">Record the incomplete count anyway</button>`; q("force").addEventListener("click", () => record(true, forceWrong)); return; }
      const counts = M().tally(cs.map((c) => ids[c.id]).filter((s) => s && s !== "uncertain")); counts.uncertain = cs.filter((c) => ids[c.id] === "uncertain").length;
      const truth = M().tally(cs.map((c) => c.cfg.stage)); const bl = st.blurIds[st.fi] || {}; let wrong = 0, blurred = 0; cs.forEach((c) => { if (!ids[c.id]) return; if (bl[c.id]) blurred++; const j = M().judgeCell(c, ids[c.id], { blurred: bl[c.id] }); if (!j.ok && j.verdict !== "uncertain") wrong++; });
      const sl = st.slide; const rec = { ts: Date.now(), slideId: sl.id, own: sl.own, sampleId: sl.sampleId, hours: sl.hours, seed: sl.seed, field: st.fi + 1, how: st.how[st.fi] || "systematic", zone: field().zone, counts, truth, unclassified: missing, wrong, blurred, flags: sl.knownFlags || flagsOf(sl), allFlags: flagsOf(sl), hidden: sl.hidden, hiddenFound: false, diag: null };
      st.recorded.add(st.fi); opts.onRecord(rec);
      const mi = M().miIndex(counts); q("recfb").innerHTML = ok(`Field ${st.fi + 1} recorded: ${M().dividingOf(counts)} dividing cells out of ${M().totalOf(counts)} counted. Calculate the mitotic index from your results table.`) + (st.check ? "" : ` <span class="small">(Check: ${wrong ? `${wrong} identification${wrong === 1 ? "" : "s"} differ from the correct stage` : "all identifications are correct"}${blurred ? `; ${blurred} made out of focus` : ""}.)</span>`) + (missing ? " " + amb("Recorded as an incomplete count.") : "");
      void mi; draw();
    }
    if (opts.allowDiagnosis) q("diagcheck").addEventListener("click", () => { const v = q("diag").value, fb = q("diagfb"); if (!v) { fb.textContent = "Choose an answer first."; return; } const h = st.slide.hidden || "none";
      const why = { none: "This slide was prepared well: small square meristem cells, well spread in one layer, chromosomes clearly stained.", tooFar: "The fields show long cells with the nucleus off-centre and almost no dividing cells: this tissue came from behind the meristem, where cells have stopped dividing and have elongated. The root had probably already had its tip removed, or the wrong end was cut. The mitotic index from this slide would be far too low. Mount both ends, as the handbook advises, and find the end with small square cells.", stain: "The nuclei and chromosomes are very pale, so dividing cells (especially early prophase) cannot be told from interphase cells. Old or dilute stain, or too little maceration in the stain, gives this. Use fresh toluidine blue and macerate until the cells are dark blue. The mitotic index would be underestimated.", layers: "Cells lie on top of each other in more than one layer: they cannot all be in focus at once, so some are missed or counted twice. The tissue was not macerated enough (or the acid treatment was too short) or not squashed. Macerate until the tissue is well broken, then spread it with gentle finger pressure.", crushed: "Some cells have burst and spilled their contents: the coverslip was pressed too hard or slid sideways. Cells whose nucleus contents have spilled out cannot be identified. Press straight down gently through folded filter paper.", focus: "The slide was fine but the image was badly out of focus. Focus at low power first, then use only the fine focus at ×40." };
      fb.innerHTML = v === h ? ok("✓ " + esc(why[h])) : bad("Not supported by what you can see. ") + `<span class="small">${v === "none" ? "Something is wrong: compare the cell shapes, the stain and how well the cells are spread with a good slide." : "Look again at the cell shapes, how dark the nuclei are, whether cells overlap or have burst, and whether the image sharpens with the fine focus."}</span>`;
      if (v === h && opts.onDiagnosed) opts.onDiagnosed(h); });
    if (samples.length) {
      const sel = q("sample"), hb = q("hrsbox");
      const change = () => { const v = sel.value; hb.hidden = !(M().SAMPLES[v] && M().SAMPLES[v].treat); if (opts.onSample) opts.onSample(v); };
      sel.addEventListener("change", change); q("hours").addEventListener("change", () => opts.onSample && opts.onSample(sel.value)); st.sampleSel = sel;
    }
    q("newslide").addEventListener("click", () => opts.onNewSlide && opts.onNewSlide());
    const api = { st, setSlide(sl) { st.slide = sl; st.fi = 0; st.obj = 10; st.ids = {}; st.blurIds = {}; st.how = {}; st.visited = new Set(); st.recorded = new Set(); st.sel = null; startFocus(); q("fb").textContent = ""; q("recfb").textContent = ""; if (opts.allowDiagnosis) { q("diag").value = ""; q("diagfb").textContent = ""; q("diagbox").hidden = !sl.hidden; } draw(); }, hours: () => +(q("hours") ? q("hours").value : 4), sample: () => (q("sample") ? q("sample").value : null), identify, record, gotoField, draw };
    if (opts.allowDiagnosis) q("diagbox").hidden = !st.slide.hidden;
    draw(); return api;
  }

  // ================= results table and mitotic index tools (shared) =================
  const recRow = (r, i, extra = "") => `<tr><td>${i + 1}</td><td>${esc(sampleName(r))}</td><td>${r.field}</td><td>${r.how}</td>${KEYS.map((k) => `<td>${r.counts[k]}</td>`).join("")}<td>${r.counts.uncertain || 0}</td><td><strong>${M().totalOf(r.counts)}</strong></td><td class="tiny">${[notMeristem(r) ? "not meristem tissue: keep out of the meristem index" : "", r.unclassified ? `incomplete (${r.unclassified} not counted)` : "", r.blurred ? `${r.blurred} identified out of focus` : "", ...((r.hiddenFound ? r.allFlags : r.flags) || []).filter((f) => f !== "both ends mounted"), r.hidden && r.hidden !== "none" && r.hiddenFound ? "hidden fault found" : ""].filter(Boolean).map((t) => `<span style="color:var(--rose-ink)">${esc(t)}</span>`).join("; ") || "as handbook"}</td>${extra}</tr>`;
  const recHead = (extra = "") => `<thead><tr><th>#</th><th>Slide</th><th>Field</th><th>Chosen</th><th>I</th><th>P</th><th>M</th><th>A</th><th>T</th><th>?</th><th>Total</th><th>Notes</th>${extra}</tr></thead>`;
  const groupKey = (r) => `${r.slideId}|${r.hours}|${r.zone}`; // a piece that is not meristem is never pooled with meristem fields
  const notMeristem = (r) => r.zone === "elongation" && (M().SAMPLES[r.sampleId] || {}).zone !== "elongation";
  const untreatedMeristem = (r) => r.zone === "meristem" && !(M().SAMPLES[r.sampleId] || {}).treat;
  const groups = (runs) => { const g = {}; runs.forEach((r, i) => { const k = groupKey(r); (g[k] = g[k] || { key: k, rows: [], idx: [] }).rows.push(r); g[k].idx.push(i); }); return Object.values(g).map((x) => { const c = { interphase: 0, prophase: 0, metaphase: 0, anaphase: 0, telophase: 0, uncertain: 0 }; x.rows.forEach((r) => { Object.keys(c).forEach((k) => (c[k] += r.counts[k] || 0)); }); const mis = x.rows.map((r) => M().miIndex(r.counts)); return { ...x, counts: c, pooled: M().miIndex(c), meanOfFields: mis.reduce((a, b) => a + b, 0) / mis.length, min: Math.min(...mis), max: Math.max(...mis), mis, notMeristem: notMeristem(x.rows[0]), cycling: untreatedMeristem(x.rows[0]), name: `${sampleName(x.rows[0])}${notMeristem(x.rows[0]) ? (x.rows[0].flags || []).includes("both ends mounted") ? ", piece 2 (not meristem)" : ", not meristem tissue" : ""}` }; }).map((g, j, all) => { const same = all.filter((o) => o.name === g.name); return same.length > 1 ? { ...g, name: g.name.replace(/^(Your slide|Prepared slide)/, `$1 ${same.indexOf(g) + 1}`) } : g; }); };

  // dot plot of field mitotic indices for several slides, with the pooled value of each
  function dotPlot(gs) {
    const W = 560, rowH = 34, pl = 70, pr = 16, pt = 10, H = pt + gs.length * rowH + 52; const xmax = Math.max(0.2, ...gs.map((g) => g.max)) * 1.1; const X = (v) => pl + (v / xmax) * (W - pl - pr);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:10px" role="img" aria-label="dot plot of the mitotic index of each field, by slide, with the pooled value marked">`;
    for (let v = 0; v <= xmax + 1e-9; v += xmax > 0.5 ? 0.1 : 0.05) s += `<line x1="${X(v)}" y1="${pt}" x2="${X(v)}" y2="${H - 42}" stroke="#eef2f5"/><text x="${X(v)}" y="${H - 26}" font-size="12" text-anchor="middle" fill="#6b7d8f">${v.toFixed(2)}</text>`;
    gs.forEach((g, j) => { const y = pt + j * rowH + rowH / 2; s += `<text x="${pl - 8}" y="${y + 4}" font-size="12" text-anchor="end" fill="#16263a">Slide ${j + 1}</text>`; g.mis.forEach((m, k) => { s += `<circle cx="${X(m)}" cy="${y + ((k % 3) - 1) * 5}" r="4.5" fill="#9fd3cf" stroke="#1f8a85"/>`; }); s += `<line x1="${X(g.pooled)}" y1="${y - 13}" x2="${X(g.pooled)}" y2="${y + 13}" stroke="#b4504f" stroke-width="3"/>`; });
    return s + `<text x="${(W + pl) / 2}" y="${H - 2}" font-size="12" text-anchor="middle" fill="#16263a">mitotic index of each field (dots); pooled value (red line)</text></svg>`;
  }

  // ================= bench (lab page) =================
  const ITEMS = [
    { id: "goggles", name: "Eye protection", zone: "zgog" },
    { id: "beaker", name: "100 cm³ beaker on a bench mat", zone: "zbeaker" },
    { id: "acid", name: "Hydrochloric acid, 5 mol dm⁻³ (dispensed by your teacher)", zone: "zacid", needs: ["goggles", "beaker"] },
    { id: "watch", name: "Watch glass with distilled water", zone: "zwatch" },
    { id: "onion", name: "Onion with roots (or garlic)", zone: "zonion" },
    { id: "tools", name: "Scalpel and forceps", zone: "ztools" },
    { id: "slide", name: "Microscope slide and coverslip", zone: "zslide" },
    { id: "stain", name: "Toluidine blue stain", zone: "zstain" },
    { id: "needle", name: "Mounted needle", zone: "zneedle" },
    { id: "paper", name: "White paper, filter paper and paper towel", zone: "zpaper" },
    { id: "micro", name: "Microscope and light source", zone: "zmicro" },
  ];
  const ICON = {
    goggles: `<path d="M8 28c0-6 8-8 22-8s22 2 22 8v6c0 6-6 9-12 9-5 0-7-5-10-5s-5 5-10 5c-6 0-12-3-12-9z" fill="#cfe6ff" stroke="#1d3a52" stroke-width="2"/>`,
    beaker: `<rect x="6" y="48" width="48" height="6" rx="2" fill="#5f6f7f"/><path d="M18 14h24v32a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3z" fill="#f4f9ff" stroke="#476a85" stroke-width="2"/>`,
    acid: `<rect x="20" y="16" width="20" height="36" rx="3" fill="#f6efe0" stroke="#8a6d2c" stroke-width="2"/><rect x="24" y="8" width="12" height="8" fill="#8a6d2c"/><path d="M30 26l7 12H23z" fill="#f2c94c" stroke="#5a4631"/>`,
    watch: `<ellipse cx="30" cy="36" rx="24" ry="9" fill="#e6f2fc" stroke="#476a85" stroke-width="2"/><ellipse cx="30" cy="34" rx="16" ry="4" fill="#bfe0f5"/>`,
    onion: `<path d="M30 10c10 10 18 14 18 26a18 14 0 0 1-36 0c0-12 8-16 18-26z" fill="#e9c9a0" stroke="#9c7b3a" stroke-width="2"/><path d="M22 48l-4 8M30 50v8M38 48l4 8" stroke="#d8cfb0" stroke-width="2"/>`,
    tools: `<path d="M10 40l30-20" stroke="#9aa5ad" stroke-width="4"/><rect x="36" y="14" width="16" height="7" rx="2" transform="rotate(-34 44 18)" fill="#5a4631"/><path d="M14 50l32-6M14 54l32-2" stroke="#6b7d8f" stroke-width="2"/>`,
    slide: `<rect x="6" y="24" width="48" height="16" rx="1" fill="#eef6fb" stroke="#476a85" stroke-width="2"/><rect x="22" y="26" width="14" height="12" fill="#fff" stroke="#8aa9bd"/>`,
    stain: `<rect x="22" y="22" width="16" height="30" rx="3" fill="#4a5bc0" stroke="#1d3a52" stroke-width="2"/><rect x="26" y="10" width="8" height="12" rx="2" fill="#2a2f3a"/>`,
    needle: `<path d="M8 50l34-34" stroke="#9aa5ad" stroke-width="2"/><rect x="36" y="8" width="8" height="18" rx="3" transform="rotate(45 40 17)" fill="#c08a3e"/>`,
    paper: `<rect x="8" y="14" width="30" height="38" fill="#fff" stroke="#b9c2ca"/><circle cx="42" cy="32" r="13" fill="#fbfbf5" stroke="#b9c2ca"/>`,
    micro: `<rect x="14" y="50" width="34" height="6" rx="2" fill="#4a5a6a"/><path d="M20 50V30l10-14 6 4-8 12v18" fill="none" stroke="#4a5a6a" stroke-width="4"/><rect x="28" y="6" width="8" height="14" rx="2" transform="rotate(30 32 13)" fill="#1d3a52"/><rect x="20" y="36" width="22" height="4" fill="#8a97a3"/>`,
  };
  const PROC = [
    { id: "goggles", label: "Put on eye protection", why: "5 mol dm⁻³ hydrochloric acid is corrosive: eye protection must be worn before the acid is handled." },
    { id: "acid", label: "Stand the beaker on a bench mat, then add about 10 cm³ (10 ml) of 5 mol dm⁻³ hydrochloric acid; put paper towel on the mat and label it", why: "The beaker goes on the bench mat before the acid is added, and is not carried about once it holds acid." },
    { id: "cut", label: "Cut about 2 cm of root tip from the onion, immediately before it goes into the acid", why: "Cutting the root just before putting it in the acid stops reactions quickly, so some cells are caught in a stage of division. Do not leave cut root tips lying on the bench." },
    { id: "acidtime", label: "Place the root tip in the acid and leave it for 15 minutes", why: "The concentrated acid kills the cells quickly, fixing them at the stage they had reached, and breaks down the material that holds the cells together, so they can be separated later." },
    { id: "micro", label: "Set up the microscope while you are waiting", why: "The handbook uses the 15 minutes in acid to set up the microscope and light source." },
    { id: "rinse", label: "Rinse the root tip in distilled water in the watch glass", why: "Rinsing removes the acid from the tissue before it is cut and stained." },
    { id: "tip", label: "Cut off the root tip (1 mm) and place it on a microscope slide", why: "Only the last millimetre or so contains the meristem, where cells divide; cells behind it elongate and no longer divide." },
    { id: "stain", label: "Cover the tissue with toluidine blue stain and macerate it with the mounted needle, over white paper", why: "The stain colours nucleic material (chromosomes) dark blue and other material lilac. Macerating breaks the tissue up and lets the stain reach the cells; the white paper shows how dark the tissue has become." },
    { id: "squash", label: "Add a coverslip; spread the material with gentle finger pressure, blotting through folded filter paper", why: "Squashing spreads the cells into a single layer so that light passes through and each cell can be seen and counted. The filter paper absorbs excess stain." },
    { id: "examine", label: "Examine the slide under the microscope and look at several fields of view", why: "Chromosomes stain dark blue. Several fields are needed because the proportion of dividing cells differs from field to field." },
  ];
  const NEEDS = { goggles: ["goggles"], acid: ["beaker", "acid"], cut: ["onion", "tools"], acidtime: ["acid"], micro: ["micro"], rinse: ["watch"], tip: ["tools", "slide"], stain: ["stain", "needle", "paper"], squash: ["slide", "paper"], examine: ["micro"] };

  function bench(host, key, onRun) {
    ensureStyle(); const seed0 = (Date.now() % 90000) + 11;
    const S = { placed: new Set(), done: new Set(), mistakes: 0, busy: false, mount: null, presses: 0, stopMac: false, squash: null, hidden: null, seed: seed0, order: [], micro: null, orient: M().rng(seed0)() < 0.5 ? 1 : -1, prepared: false };
    host.innerHTML = `
      <div class="bench-wrap ix-bench-full bench-rt">
        <div class="bench-steps" id="rtsteps" aria-live="polite"></div>
        <div class="bench-stage"><p class="bench-say" aria-hidden="true"></p><div class="rtb-scroll" tabindex="0" aria-label="Bench drawing (scrolls sideways on small screens)">
        <svg class="bench-svg" id="rtbench" viewBox="0 0 900 400" style="min-width:560px" role="img" aria-label="Laboratory bench for the root-tip squash practical">
          <rect x="0" y="352" width="900" height="48" fill="#d8cfc2"/><rect x="0" y="348" width="900" height="6" fill="#bfb3a3"/>
          ${zone("zgog", 12, 40, 110, 80, "eye protection")}<g id="g-goggles" hidden><path d="M30 80c0-12 16-16 37-16s37 4 37 16v10c0 10-10 15-20 15-8 0-11-8-17-8s-9 8-17 8c-10 0-20-5-20-15z" fill="#cfe6ff" stroke="#1d3a52" stroke-width="2.5"/><text x="67" y="134" font-size="12" text-anchor="middle" fill="#3f5a6e">eye protection</text></g>
          ${zone("zbeaker", 130, 200, 150, 148, "beaker on bench mat")}<g id="g-beaker" hidden><rect x="135" y="330" width="140" height="16" rx="3" fill="#5f6f7f"/><rect x="150" y="318" width="110" height="12" fill="#fff" stroke="#b9c2ca"/><path d="M175 230h60v84a5 5 0 0 1-5 5h-50a5 5 0 0 1-5-5z" fill="#f4f9ff" stroke="#476a85" stroke-width="2.5"/><rect id="acidliq" x="178" y="290" width="54" height="26" fill="#fbf3c8" opacity="0"/><text x="205" y="222" font-size="12" text-anchor="middle" fill="#3f5a6e">100 cm³ beaker</text><text id="beakerlab" x="205" y="342" font-size="10" text-anchor="middle" fill="#fff" opacity="0">5 M HCl · label</text><g id="rootinacid" opacity="0"><rect x="198" y="292" width="5" height="22" rx="2.5" fill="#f2ead2" stroke="#9c7b3a"/></g></g>
          ${zone("zacid", 290, 200, 80, 148, "acid")}<g id="g-acid" hidden><rect x="305" y="250" width="50" height="94" rx="6" fill="#f6efe0" stroke="#8a6d2c" stroke-width="2"/><rect x="316" y="232" width="28" height="18" fill="#8a6d2c"/><path d="M330 272l14 24h-28z" fill="#f2c94c" stroke="#5a4631"/><text x="330" y="318" font-size="11" text-anchor="middle" fill="#5a4631">HCl</text><text x="330" y="332" font-size="10" text-anchor="middle" fill="#5a4631">5 mol dm⁻³</text></g>
          ${zone("zwatch", 380, 260, 140, 88, "watch glass")}<g id="g-watch" hidden><ellipse cx="450" cy="320" rx="62" ry="20" fill="#e6f2fc" stroke="#476a85" stroke-width="2.5"/><ellipse cx="450" cy="316" rx="44" ry="9" fill="#bfe0f5"/><text x="450" y="352" font-size="11" text-anchor="middle" fill="#3f5a6e">distilled water</text></g>
          <g id="piece" class="rtb-piece" opacity="0"><g id="piecebody"></g></g>
          ${zone("zonion", 12, 140, 110, 208, "onion")}<g id="g-onion" hidden><path d="M67 170c20 18 36 26 36 50a36 28 0 0 1-72 0c0-24 16-32 36-50z" fill="#e9c9a0" stroke="#9c7b3a" stroke-width="2"/>${[44, 56, 67, 78, 90].map((x, i) => `<path d="M${x} 246 q${(i - 2) * 3} 40 ${(i - 2) * 6} 92" stroke="#e6dcc0" stroke-width="3" fill="none"/>`).join("")}</g>
          ${zone("ztools", 530, 260, 110, 88, "scalpel, forceps")}<g id="g-tools" hidden><g id="scalpel"><path d="M545 300h55" stroke="#9aa5ad" stroke-width="4"/><rect x="600" y="294" width="34" height="12" rx="3" fill="#5a4631"/></g><path d="M545 326l70-8M545 332l70-2" stroke="#6b7d8f" stroke-width="2.5"/></g>
          ${zone("zslide", 650, 270, 120, 78, "slide")}<g id="g-slide" hidden><rect x="656" y="300" width="108" height="34" rx="2" fill="#eef6fb" stroke="#476a85" stroke-width="2"/><g id="tissue" opacity="0"><circle cx="710" cy="317" r="7" fill="#e8dcc8" stroke="#9c7b3a"/></g><rect id="cover" x="690" y="303" width="40" height="28" fill="#fff" stroke="#8aa9bd" opacity="0"/><text x="710" y="348" font-size="11" text-anchor="middle" fill="#3f5a6e">microscope slide</text></g>
          ${zone("zstain", 780, 250, 108, 98, "stain")}<g id="g-stain" hidden><rect x="820" y="280" width="28" height="62" rx="4" fill="#4a5bc0" stroke="#1d3a52" stroke-width="2"/><rect x="826" y="258" width="16" height="22" rx="3" fill="#2a2f3a"/><text x="834" y="270" font-size="0">dropper</text><text x="834" y="248" font-size="11" text-anchor="middle" fill="#3f5a6e">toluidine blue</text></g>
          ${zone("zneedle", 130, 40, 120, 150, "mounted needle")}<g id="g-needle" hidden><g id="needle"><path d="M150 170l70-70" stroke="#9aa5ad" stroke-width="3"/><rect x="214" y="70" width="14" height="40" rx="4" transform="rotate(45 221 90)" fill="#c08a3e"/></g><text x="190" y="186" font-size="11" text-anchor="middle" fill="#3f5a6e">mounted needle</text></g>
          ${zone("zpaper", 260, 40, 200, 150, "white paper, filter paper")}<g id="g-paper" hidden><rect x="275" y="60" width="90" height="116" fill="#fff" stroke="#b9c2ca"/><text x="320" y="186" font-size="11" text-anchor="middle" fill="#3f5a6e">white paper</text><circle cx="410" cy="100" r="36" fill="#fbfbf5" stroke="#b9c2ca"/><path d="M380 100h60" stroke="#d8d8cc"/><text x="410" y="152" font-size="11" text-anchor="middle" fill="#3f5a6e">filter paper</text><rect x="380" y="160" width="62" height="10" fill="#fff" stroke="#b9c2ca"/></g>
          ${zone("zmicro", 470, 40, 200, 210, "microscope")}<g id="g-micro" hidden><rect x="500" y="226" width="140" height="18" rx="4" fill="#4a5a6a"/><path d="M530 226V140l40-60 22 14-30 46v86" fill="none" stroke="#4a5a6a" stroke-width="12"/><rect x="548" y="40" width="22" height="46" rx="3" transform="rotate(32 559 63)" fill="#1d3a52"/><rect x="515" y="172" width="90" height="10" fill="#8a97a3"/><circle cx="560" cy="210" r="8" fill="#f2e4a4" stroke="#8a6d2c"/><text x="600" y="120" font-size="11" fill="#3f5a6e">×10, ×40</text></g>
          <g id="g-clock"><rect x="716" y="56" width="146" height="58" rx="8" fill="#fff" stroke="#476a85" stroke-width="2"/><rect x="726" y="64" width="126" height="32" fill="#1d3a52"/><text id="rtclock" x="789" y="87" font-size="18" text-anchor="middle" fill="#9ef0c0" font-family="ui-monospace, monospace">00:00</text><text x="789" y="108" font-size="10" text-anchor="middle" fill="#3f5a6e">min : s (lab timer)</text></g>
          <g id="macbox" opacity="0"><rect x="690" y="150" width="198" height="92" rx="8" fill="#fff" stroke="#476a85"/><text x="700" y="168" font-size="12" font-weight="700" fill="#16263a">maceration (on white paper)</text><text x="700" y="190" font-size="11" fill="#3f5a6e">tissue broken up</text><rect x="790" y="181" width="90" height="10" fill="#eef2f5" stroke="#b9c2ca"/><rect id="macbar" x="790" y="181" width="0" height="10" fill="#8f73ad"/><text x="700" y="212" font-size="11" fill="#3f5a6e">depth of stain</text><rect x="790" y="203" width="90" height="10" fill="#eef2f5" stroke="#b9c2ca"/><rect id="stainbar" x="790" y="203" width="0" height="10" fill="#2d3c9e"/><g id="frags"></g></g>
          <text id="rtmsg" x="450" y="24" font-size="14" text-anchor="middle" fill="#1d3a52" font-weight="600"></text>
        </svg></div></div>
        <div class="bench-shelf" id="rtshelf" aria-label="Apparatus shelf" data-empty="Everything is on the bench."></div>
        <div class="bench-controls">
          <div><strong class="small">Before you start</strong>
            <label class="small"><input type="checkbox" id="rtguide"> show me the next step (guided)</label>
            <label class="small"><input type="checkbox" id="rthide"> stretch: hide a fault in my slide for me to diagnose</label></div>
          <div id="rtproc"></div>
          <div id="rtdec" class="mt"></div>
          <div class="row mt"><button class="btn" id="rtreset">Reset bench</button><button class="btn" id="rtprep">Use a prepared slide instead</button></div>
          <div class="readout" id="rtread" aria-live="polite">Put the apparatus on the bench: drag or click each item on the shelf (Enter also works).</div>
        </div>
      </div>
      <div class="card mt" id="rtmicro-card" hidden><div class="card-head"><h3>Microscope</h3><span class="badge amber">simulated image</span></div><div id="rtmicro"></div></div>`;
    const svg = $("#rtbench", host), shelf = $("#rtshelf", host), readout = $("#rtread", host); const say = (t) => { $("#rtmsg", svg).textContent = t; const bs = $(".bench-say", host); if (bs) bs.textContent = t; };
    const show = (id, v = 1) => { const g = $("#" + id, svg); if (g) { g.style.transition = reduced() ? "none" : "opacity .5s ease"; g.style.opacity = v; } };
    function topSteps() { const s = [["Apparatus on the bench", ITEMS.every((i) => S.placed.has(i.id))], ["Slide prepared in the handbook order", S.done.has("squash") || S.prepared], ["Fields examined and recorded", (B.store.get().labRuns[key] || []).length > 0]]; $("#rtsteps", host).innerHTML = s.map(([t, d], i) => `<span class="bstep ${d ? "done" : ""}">${d ? "✓" : String.fromCharCode(65 + i)} ${t}</span>`).join(""); }
    function drawShelf() { shelf.innerHTML = ""; shelf.hidden = ITEMS.every((i) => S.placed.has(i.id)); ITEMS.forEach((it) => { if (S.placed.has(it.id)) return; const can = !(it.needs || []).some((d) => !S.placed.has(d)); shelf.append(el(`<button class="shelf-item apparatus ${can ? "" : "locked"}" data-id="${it.id}" title="${can ? "Drag onto the bench or press Enter to place" : "Needs: " + it.needs.map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}"><svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">${ICON[it.id]}</svg><span>${esc(it.name)}</span></button>`)); }); topSteps(); drawProc(); }
    function place(id) { const it = ITEMS.find((x) => x.id === id); if (!it || S.placed.has(id)) return false; if ((it.needs || []).some((d) => !S.placed.has(d))) { say(`First you need: ${it.needs.filter((d) => !S.placed.has(d)).map((d) => ITEMS.find((x) => x.id === d).name).join(", ")}.`); return false; }
      S.placed.add(id); $("#" + it.zone, svg).setAttribute("hidden", ""); const g = $("#g-" + id, svg); g.removeAttribute("hidden"); g.classList.add("pop");
      const hints = { goggles: "Eye protection: needed before the acid is handled.", beaker: "100 cm³ beaker standing on a bench mat, with paper towel.", acid: "5 mol dm⁻³ hydrochloric acid, corrosive. Your teacher dispenses it once the beaker is on the mat; do not carry the beaker with acid in it.", watch: "Watch glass with distilled water, for rinsing.", onion: "An onion that has grown roots about 5 cm long over water in the dark (garlic or shallot also work).", tools: "Scalpel for cutting and forceps for moving the root tip. Cut onto a hard surface, away from your fingers.", slide: "Clean microscope slide and coverslip.", stain: "Toluidine blue (0.05 %) at pH 4 in McIlvaine buffer: no heating needed. Nucleic material stains blue, other material lilac.", needle: "Mounted needle, for macerating (breaking up) the tissue.", paper: "White paper (to see the colour of the tissue while staining), filter paper (to blot) and paper towel.", micro: "Microscope with a ×40 objective and a light source." };
      say(hints[id]); drawShelf(); return true; }
    let drag = null, ghost = null;
    shelf.addEventListener("pointerdown", (e) => { const b = e.target.closest(".shelf-item"); if (!b || b.classList.contains("locked")) return; drag = b; ghost = b.cloneNode(true); ghost.classList.add("ghost"); document.body.append(ghost); b.setPointerCapture(e.pointerId); mv(e); });
    const zoneAt = (x, y) => { const it = drag && ITEMS.find((i) => i.id === drag.dataset.id); if (!it) return null; const r = $("#" + it.zone, svg).getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? it.zone : null; };
    function mv(e) { if (!ghost) return; ghost.style.left = e.clientX - 28 + "px"; ghost.style.top = e.clientY - 28 + "px"; const z = zoneAt(e.clientX, e.clientY); $$(".zone", svg).forEach((zz) => zz.classList.toggle("over", zz.id === z)); }
    shelf.addEventListener("pointermove", mv);
    const end = (e) => { if (!drag) return; const z = zoneAt(e.clientX, e.clientY); const it = ITEMS.find((i) => i.id === drag.dataset.id); if (z === it.zone) place(it.id); $$(".zone", svg).forEach((zz) => zz.classList.remove("over")); drag = null; if (ghost) { ghost.remove(); ghost = null; } };
    shelf.addEventListener("pointerup", end); shelf.addEventListener("pointercancel", end);
    shelf.addEventListener("click", (e) => { const b = e.target.closest(".shelf-item"); if (b && !b.classList.contains("locked")) place(b.dataset.id); });
    shelf.addEventListener("keydown", (e) => { const b = e.target.closest(".shelf-item"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); place(b.dataset.id); } });

    function shuffle() { const g = M().rng(seed0 + 5); const ids = PROC.map((p) => p.id); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(g() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } S.order = ids; }
    function drawProc() {
      const box = $("#rtproc", host); if (!ITEMS.every((i) => S.placed.has(i.id))) { box.innerHTML = `<p class="small muted">Put every item on the bench first.</p>`; return; }
      if (S.pending) { box.innerHTML = ""; return; }
      const next = PROC.find((p) => !S.done.has(p.id)); if (!next) { box.innerHTML = ok(`✓ Slide prepared in the handbook order${S.mistakes ? ` (${S.mistakes} step${S.mistakes === 1 ? "" : "s"} chosen out of order on the way)` : " with no wrong choices"}.`); return; }
      const left = S.order.filter((id) => !S.done.has(id)).map((id) => PROC.find((p) => p.id === id)); const guided = $("#rtguide", host).checked;
      box.innerHTML = `<strong class="small">Choose the next step</strong> <span class="tiny muted">(${S.done.size} of ${PROC.length} done)</span><div class="stack mt" style="gap:.35rem">${left.map((p) => `<button type="button" class="btn sm rtstep" data-step="${p.id}" style="text-align:left;justify-content:flex-start;white-space:normal;height:auto${guided && p.id === next.id ? ";outline:3px solid var(--teal);outline-offset:1px" : ""}">${esc(p.label)}</button>`).join("")}</div><div id="rtprocfb" class="small mt" aria-live="polite"></div>`;
      $$(".rtstep", box).forEach((b) => b.addEventListener("click", () => choose(b.dataset.step)));
    }
    async function choose(id) {
      const next = PROC.find((p) => !S.done.has(p.id)); const fb = $("#rtprocfb", host);
      if (id !== next.id) { S.mistakes++; const p = PROC.find((x) => x.id === id); fb.innerHTML = bad(`Not yet: “${esc(p.label)}” comes later. First: <strong>${esc(next.label.charAt(0).toLowerCase() + next.label.slice(1))}</strong>. ${esc(next.why)}`); return; }
      if (S.busy) return; S.busy = true; $$(".rtstep", host).forEach((b) => (b.disabled = true)); $("#rthide", host).disabled = true;
      if (!S.hiddenSet) { S.hiddenSet = true; if ($("#rthide", host).checked) { const g = M().rng(seed0 + 99); S.hidden = ["tooFar", "stain", "layers", "crushed", "focus"][Math.floor(g() * 5)]; } }
      const done = await animate(id); S.busy = false; if (done !== false) { S.done.add(id); readout.textContent = `${PROC.find((p) => p.id === id).why}`; } drawShelf();
    }
    function clock(minutes, ms) { return new Promise((res) => { const t0 = performance.now(); const tick = (now) => { const f = Math.min(1, Math.max(0, now - t0) / ms); const s = f * minutes * 60; $("#rtclock", svg).textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`; if (f < 1) requestAnimationFrame(tick); else res(); }; if (reduced()) { $("#rtclock", svg).textContent = `${String(minutes).padStart(2, "0")}:00`; res(); } else requestAnimationFrame(tick); }); }
    const pieceSVG = () => { const o = S.orient; // the 2 cm piece in the watch glass: one end tapered and darker (root cap and tip), the other cut square
      const tipX = o > 0 ? 506 : 394, cutX = o > 0 ? 394 : 506; return `<path d="M${cutX} 309 L${tipX - o * 14} 309 Q${tipX} 313 ${tipX - o * 14} 317 L${cutX} 317 Z" fill="#f2ead2" stroke="#9c7b3a" stroke-width="1.5"/><path d="M${tipX - o * 14} 309 Q${tipX} 313 ${tipX - o * 14} 317" fill="#d9c79c" stroke="#9c7b3a"/><text x="${o > 0 ? 512 : 388}" y="300" font-size="12" font-weight="700" text-anchor="${o > 0 ? "start" : "end"}" fill="#16263a">${o > 0 ? "end Y" : "end X"}</text><text x="${o > 0 ? 388 : 512}" y="300" font-size="12" font-weight="700" text-anchor="${o > 0 ? "end" : "start"}" fill="#16263a">${o > 0 ? "end X" : "end Y"}</text>`; };
    async function animate(id) {
      const dec = $("#rtdec", host);
      if (id === "goggles") { say("Eye protection on."); }
      if (id === "acid") { show("acidliq"); show("beakerlab"); say("About 10 cm³ of 5 mol dm⁻³ HCl in the beaker on the bench mat; paper towel and label."); }
      if (id === "cut") { const sc = $("#scalpel", svg); sc.style.transition = reduced() ? "none" : "transform .7s"; sc.style.transform = "translate(-480px,-40px)"; await wait(700); sc.style.transform = ""; say("About 2 cm of root tip cut from the onion, straight into the acid."); show("rootinacid"); }
      if (id === "acidtime") { say("Root tip in the acid: leave for 15 minutes."); await clock(15, 2200); say("15 minutes in the acid."); }
      if (id === "micro") { say("Microscope set up with the light source; ×10 objective in place."); }
      if (id === "rinse") { show("rootinacid", 0); $("#piecebody", svg).innerHTML = pieceSVG(); show("piece"); say("Root piece rinsed in distilled water in the watch glass. Which end is the tip?"); }
      if (id === "tip") { // decision: which end
        S.pending = true; drawProc(); dec.innerHTML = `<strong class="small">Which end will you cut 1 mm from?</strong><p class="tiny muted">Look at the root piece in the watch glass: one end is the tip (it tapers and has a slightly darker root cap); the other is where you cut it from the onion.</p><div class="row"><button class="btn sm" data-end="X">Cut 1 mm from end X</button><button class="btn sm" data-end="Y">Cut 1 mm from end Y</button><button class="btn sm" data-end="both">Cut 1 mm from each end and mount both</button></div>`;
        const choice = await new Promise((res) => $$("[data-end]", dec).forEach((b) => b.addEventListener("click", () => res(b.dataset.end))));
        const tipEnd = S.orient > 0 ? "Y" : "X"; S.mount = choice === "both" ? "both" : choice === tipEnd ? "tip" : "cut"; S.pending = false;
        dec.innerHTML = `<p class="small">${S.mount === "both" ? ok("Both ends mounted, as the handbook advises: under the microscope it is easy to tell which piece is meristem (small square cells, nucleus in the centre).") : S.mount === "tip" ? ok(`✓ End ${tipEnd} is the tip: tapered, with the root cap.`) : bad(`End ${choice} is the cut end, about 2 cm from the tip: older tissue behind the meristem, whose cells have stopped dividing and are elongated. You will see this under the microscope.`)}</p>`;
        show("piece", 0); show("tissue"); say(S.mount === "both" ? "Two 1 mm pieces on the slide." : "1 mm of root on the slide."); }
      if (id === "stain") { S.pending = true; drawProc(); show("macbox"); show("tissue");
        dec.innerHTML = `<strong class="small">Macerate in toluidine blue</strong><p class="tiny muted">Press Macerate to break the tissue up with the mounted needle. The handbook says: continue until the tissue is well broken and the cells are stained dark blue. Then stop.</p><div class="row"><button class="btn sm primary" id="rtmac">Macerate</button><button class="btn sm" id="rtmacstop">Stop macerating</button></div><div class="tiny mt" id="rtmacfb" aria-live="polite"></div>`;
        const upd = () => { const b = Math.min(1, S.presses * 0.16), s = Math.min(1, 0.2 + S.presses * 0.13); $("#macbar", svg).setAttribute("width", (b * 90).toFixed(0)); $("#stainbar", svg).setAttribute("width", (s * 90).toFixed(0)); const t = $("#tissue circle", svg); if (t) t.setAttribute("fill", s > 0.75 ? "#2d3c9e" : s > 0.5 ? "#6874c2" : "#a7aedb"); $("#frags", svg).innerHTML = Array.from({ length: Math.round(b * 10) }, (_, i) => `<circle cx="${700 + (i % 5) * 9}" cy="${228 + Math.floor(i / 5) * 8}" r="2.5" fill="${s > 0.75 ? "#2d3c9e" : "#8a92cf"}"/>`).join(""); $("#rtmacfb", host).textContent = `Tissue broken up: ${Math.round(b * 100)} %; stain: ${s > 0.75 ? "dark blue" : s > 0.5 ? "mid blue" : "pale"}.`; return { b, s }; };
        upd(); await new Promise((res) => { $("#rtmac", host).addEventListener("click", async () => { const nd = $("#needle", svg); nd.style.transition = reduced() ? "none" : "transform .25s"; nd.style.transform = "translate(470px,190px)"; await wait(250); nd.style.transform = ""; S.presses++; upd(); }); $("#rtmacstop", host).addEventListener("click", () => res()); });
        const v = upd(); S.broken = v.b; S.stainV = v.s; S.pending = false;
        dec.innerHTML = `<p class="small">${v.b >= 0.6 && v.s >= 0.6 ? ok("Tissue well broken up and stained dark blue.") : amb(`You stopped early: ${v.b < 0.6 ? "the tissue is still in lumps (the cells will not separate into one layer)" : ""}${v.b < 0.6 && v.s < 0.6 ? " and " : ""}${v.s < 0.6 ? "the stain is pale (chromosomes will be hard to see)" : ""}.`)}</p>`; say("Stained and macerated."); }
      if (id === "squash") { S.pending = true; drawProc();
        dec.innerHTML = `<strong class="small">How will you spread the material?</strong><div class="stack mt" style="gap:.35rem"><button class="btn sm" data-sq="gentle" style="text-align:left;white-space:normal;height:auto">Coverslip on; press straight down gently with a finger through folded filter paper, blotting at the same time</button><button class="btn sm" data-sq="none" style="text-align:left;white-space:normal;height:auto">Coverslip on, without pressing</button><button class="btn sm" data-sq="heavy" style="text-align:left;white-space:normal;height:auto">Coverslip on; press hard with the thumb and slide it sideways to spread the cells further</button></div>`;
        S.squash = await new Promise((res) => $$("[data-sq]", dec).forEach((b) => b.addEventListener("click", () => res(b.dataset.sq)))); S.pending = false; show("cover");
        dec.innerHTML = `<p class="small">${S.squash === "gentle" ? ok("✓ Gentle, even pressure spreads the cells into a single layer; the filter paper blots away excess stain.") : S.squash === "none" ? amb("Without squashing, the cells stay piled up in layers.") : amb("Too much pressure, and a coverslip sliding sideways, can burst cells.")}</p>`; say("Coverslip on."); }
      if (id === "examine") { openMicro(); }
      return true;
    }
    function slideFromBench() {
      let mount = S.mount || "tip", stain = S.stainV === undefined ? 1 : S.stainV, broken = S.broken === undefined ? 1 : S.broken, squash = S.squash || "gentle";
      if (S.hidden === "tooFar") mount = "cut"; if (S.hidden === "stain") stain = 0.4; if (S.hidden === "layers") broken = 0.3; if (S.hidden === "crushed") squash = "heavy";
      const sl = makeSlide({ sampleId: "control", seed: S.seed, mount, stain, broken, squash, hidden: S.hidden ? S.hidden : null, own: true });
      sl.knownFlags = flagsOf(makeSlide({ sampleId: "control", seed: S.seed, mount: S.mount || "tip", stain: S.stainV === undefined ? 1 : S.stainV, broken: S.broken === undefined ? 1 : S.broken, squash: S.squash || "gentle" })); return sl;
    }
    function openMicro(prepared) {
      const card = $("#rtmicro-card", host); card.hidden = false; const mhost = $("#rtmicro", host);
      const mk = (v) => (v === "own" ? (prepared ? makeSlide({ sampleId: "control", seed: S.seed, own: false }) : slideFromBench()) : makeSlide({ sampleId: v, seed: S.seed + 1, hours: S.micro ? S.micro.hours() : 4, own: false }));
      S.micro = microscope(mhost, { slide: mk("own"), ownLabel: prepared ? "Prepared slide: root 1 meristem (control)" : "Your slide (root 1)", samples: ["second", "elong", "spindle", "dna"], allowDiagnosis: true, onRecord: onRun,
        onSample: (v) => S.micro.setSlide(mk(v)), onNewSlide: () => { S.seed++; const v = S.micro.sample() || "own"; S.micro.setSlide(mk(v)); },
        onDiagnosed: (h) => { const st = B.store.get(); (st.labRuns[key] || []).forEach((r) => { if (r.hidden === h) r.hiddenFound = true; }); B.store.save(); document.dispatchEvent(new Event("labrun")); } });
      readout.textContent = "Slide on the microscope stage. Start at ×10, focus, then examine several fields at ×40 and record each one."; topSteps();
      if (!reduced()) card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    $("#rtguide", host).addEventListener("change", drawProc);
    $("#rtreset", host).addEventListener("click", () => bench(host, key, onRun));
    $("#rtprep", host).addEventListener("click", () => { S.prepared = true; openMicro(true); readout.textContent = "Prepared slide on the stage (the handbook suggests having these available in case a squash has no dividing cells)."; });
    shuffle(); drawShelf(); say("Put the apparatus on the bench: start with the eye protection.");
    B.labSims.roottip._state = S; B.labSims.roottip._place = place; B.labSims.roottip._choose = choose;
    return S;
  }
  const zone = (id, x, y, w, h, label) => `<g id="${id}" class="zone"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="zone-rect"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" class="zone-label">${label}</text></g>`;

  // ================= Sim tab =================
  function sim(host, n) {
    host.innerHTML = `<div id="rtbench-host"></div>
      <h3 class="mt">Results table</h3><p class="small muted">Each recorded field adds a row: the number of cells you identified in each stage (I interphase, P prophase, M metaphase, A anaphase, T telophase, ? cannot identify) and the total. Work out the mitotic index in the Calculate tab, where it is checked. Rows from a slide with a preparation problem you know about are flagged; a hidden fault is flagged once you have diagnosed it.</p>
      <div id="rttable" style="overflow-x:auto"></div><div class="row mt"><button class="btn sm" id="rtclear">Clear results table</button></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    function table() { if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", table); return; }
      $("#rttable", host).innerHTML = runs.length ? `<table class="tbl small">${recHead()}<tbody>${runs.map((r, i) => recRow(r, i)).join("")}</tbody></table>` : '<p class="muted small">No fields recorded yet.</p>'; }
    bench($("#rtbench-host", host), n, (r) => { runs.push(r); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    $("#rtclear", host).addEventListener("click", () => { if (confirm("Clear all saved fields for this practical?")) { runs.length = 0; B.store.save(); table(); document.dispatchEvent(new Event("labrun")); } });
    table(); host.dataset.mounted = "1"; document.addEventListener("labrun", table);
  }

  // ================= Calculate tab =================
  function calc(host, n) {
    const keep = {};
    function render() {
      ["k1", "k2", "k5"].forEach((id) => { const e = host.querySelector("#" + id); if (e) keep[id] = e.value; });
      if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", render); return; } host.dataset.mounted = "1";
      const runs = B.store.get().labRuns[n] || []; if (!runs.length) { host.innerHTML = `<div class="card"><div class="empty">${B.util.icons.lab}<h3>No results yet</h3><p>Prepare a slide (or use a prepared slide) in the Virtual experiment tab, identify every cell in several fields of view and record them. Then come back to calculate mitotic indices.</p></div></div>`; return; }
      const gs = groups(runs); const optR = runs.map((r, i) => `<option value="${i}">#${i + 1} ${esc(sampleName(r))}, field ${r.field}${r.miOk ? " ✓" : ""}</option>`).join(""); const optG = gs.map((g, j) => `<option value="${j}">${esc(g.name)} (${g.rows.length} field${g.rows.length === 1 ? "" : "s"})</option>`).join("");
      host.innerHTML = `
        <div class="card mb"><h3>1 Mitotic index of one field</h3><p class="small muted">Mitotic index = number of cells in stages of mitosis ÷ total number of cells (the handbook's definition). Cells in prophase, metaphase, anaphase and telophase are in stages of mitosis; interphase cells are not, but they are part of the total. Any cell you could not identify is still a cell: it is in the total. Give the answer as a fraction, a decimal or a percentage.</p>
          <div class="row"><label class="small">Field: <select id="k1">${optR}</select></label></div><div id="k1v" class="small mt"></div><div class="row mt"><label class="small">Mitotic index ${inp("k1i", "7rem", "e.g. 0.12")}</label><button class="btn sm" id="k1c">Check</button></div><div id="k1f" class="small mt" aria-live="polite"></div></div>
        <div class="card mb"><h3>2 Mitotic index of a slide from several fields</h3><p class="small muted">Add the counts from every field of one slide, then divide the total number of dividing cells by the total number of cells. This pooled value uses every cell counted, so it is better than one field. (The mean of the field values is close to it when every field has a similar number of cells.)</p>
          <div class="row"><label class="small">Slide: <select id="k2">${optG}</select></label></div><div id="k2v" class="small mt"></div><div class="row mt"><label class="small">Pooled mitotic index ${inp("k2i", "7rem")}</label><button class="btn sm" id="k2c">Check</button></div><div id="k2f" class="small mt" aria-live="polite"></div></div>
        <div class="card mb"><h3>3 Why several fields? Fields vary</h3><p class="small muted">Each dot is one field; the red line is the slide's pooled value. Fields differ because dividing cells are not spread evenly and each field holds only about 50 cells, so a few cells more or fewer change the value a lot. Compare a difference between slides with this spread: a smaller difference may be chance.</p><div id="k3plot">${dotPlot(gs)}</div>
          <ul class="small mt" style="list-style:none;padding-left:0">${gs.map((g, j) => `<li><strong>Slide ${j + 1}</strong>: ${esc(g.name)}: ${g.rows.length} field${g.rows.length === 1 ? "" : "s"}, ${M().totalOf(g.counts)} cells, ${M().dividingOf(g.counts)} dividing; pooled index ${f3(g.pooled)} (fields ${f3(g.min)} to ${f3(g.max)})</li>`).join("")}</ul></div>
        <div class="card mb"><h3>4 From a snapshot to time <span class="badge amber">hypothetical cell cycle</span></h3><p class="small muted">If cells divide independently of each other (asynchronously), the proportion of cells in a stage is taken to equal the proportion of the cell cycle spent in that stage. Suppose (hypothetically) that a meristem cell's cycle takes 20 hours. Choose a meristem slide.</p>
          <div class="row"><label class="small">Slide: <select id="k5">${optG}</select></label></div><div id="k5v" class="small mt"></div>
          <div class="row mt"><label class="small">Time in mitosis / h ${inp("k5a", "6rem")}</label><label class="small">Time in prophase / h ${inp("k5b", "6rem")}</label><button class="btn sm" id="k5c">Check</button></div><div id="k5f" class="small mt" aria-live="polite"></div>
          <details class="mt"><summary class="small"><strong>Why this is only an estimate</strong></summary><ul class="small"><li>A squash is a single snapshot: it shows proportions, not times. A time can be found only if the cycle length is known from another method.</li><li>The assumption needs the cells to be dividing asynchronously and the population to be steady; it fails if divisions are synchronised (for example by time of day) or if some cells have stopped dividing.</li><li>Not every meristem cell is cycling; cells near the zone of elongation have stopped.</li><li>Misidentified stages, a small number of cells and unrepresentative fields all carry into the time estimate.</li></ul></details></div>
        <div class="card"><h3>5 Compare with the correct stages</h3><p class="small muted">The simulation knows the true stage of every cell. Here is how your counts compare, field by field (hidden faults are named only once you have diagnosed them).</p><div style="overflow-x:auto"><table class="tbl small"><thead><tr><th>#</th><th>Slide, field</th><th>Your index</th><th>Correct index for these cells</th><th>Identifications that differ</th><th>What this shows</th></tr></thead><tbody>${runs.map((r, i) => { const mine = M().miIndex(r.counts), tru = M().miIndex(r.truth); const fl = (r.hidden && !r.hiddenFound ? r.flags : r.allFlags) || []; const why = [r.unclassified ? "incomplete count: the total is too small" : "", r.blurred ? "cells identified out of focus" : "", r.zone === "elongation" ? "not meristem tissue: few dividing cells" : "", fl.includes("poorly stained") ? "faint stain: early prophase looks like interphase" : "", fl.includes("cells not separated (layers)") ? "overlapping layers: hard to count" : "", fl.includes("squashed too hard (burst cells)") ? "burst cells: spilled ones cannot be identified" : "", r.how === "picked" ? "field picked by eye at ×10" : ""].filter(Boolean).join("; "); return `<tr><td>${i + 1}</td><td>${esc((gs.find((g) => g.key === groupKey(r)) || { name: sampleName(r) }).name)}, field ${r.field}</td><td>${f3(mine)}</td><td>${f3(tru)}</td><td>${r.wrong}</td><td class="tiny">${(() => { const dm = M().dividingOf(r.counts), dt = M().dividingOf(r.truth); const v = dm < dt ? `you found ${dm} of the ${dt} dividing cells: your index is too low` : dm > dt ? `you counted ${dm - dt} non-dividing cell${dm - dt === 1 ? "" : "s"} as dividing: your index is too high` : Math.abs(mine - tru) < 0.005 ? "agrees" : "dividing cells right, but the total differs"; return esc([v, why].filter(Boolean).join("; ")); })()}</td></tr>`; }).join("")}</tbody></table></div>${biasNote(gs)}</div>`;
      ["k1", "k2", "k5"].forEach((id) => { const e = host.querySelector("#" + id); if (e && keep[id] !== undefined && [...e.options].some((o) => o.value === keep[id])) e.value = keep[id]; });
      const v1 = () => { const r = runs[+$("#k1", host).value]; $("#k1v", host).innerHTML = `Counts: ${KEYS.map((k) => `${M().NAME[k]} ${r.counts[k]}`).join(", ")}, cannot identify ${r.counts.uncertain || 0}. Total ${M().totalOf(r.counts)}.`; $("#k1f", host).textContent = ""; }; $("#k1", host).addEventListener("change", v1); v1();
      $("#k1c", host).addEventListener("click", () => { const r = runs[+$("#k1", host).value]; const j = M().judgeMI($("#k1i", host).value, r.counts); $("#k1f", host).innerHTML = j.ok ? ok(esc(j.msg)) : bad(esc(j.msg)); if (j.ok && !r.miOk) { r.miOk = true; B.store.save(); } });
      const v2 = () => { const g = gs[+$("#k2", host).value]; $("#k2v", host).innerHTML = `${g.rows.length} field${g.rows.length === 1 ? "" : "s"}: dividing cells ${g.rows.map((r) => M().dividingOf(r.counts)).join(" + ")} = ${M().dividingOf(g.counts)}; all cells ${g.rows.map((r) => M().totalOf(r.counts)).join(" + ")} = ${M().totalOf(g.counts)}.`; $("#k2f", host).textContent = ""; }; $("#k2", host).addEventListener("change", v2); v2();
      $("#k2c", host).addEventListener("click", () => { const g = gs[+$("#k2", host).value]; const j = M().judgeMI($("#k2i", host).value, g.counts); const mv = M().parseMI($("#k2i", host).value); const meanOk = !j.ok && mv !== null && Math.abs(mv - g.meanOfFields) <= Math.max(0.0051, g.meanOfFields * 0.02);
        const warn2 = g.notMeristem ? " " + amb("These fields are not meristem (elongated cells, nucleus off-centre): this is NOT the mitotic index of the root tip. Keep them separate and use only the meristem piece for the root-tip index.") : "";
        $("#k2f", host).innerHTML = (j.ok ? ok(esc(j.msg) + (g.rows.length < 5 ? " Count more fields: a few fields give an unreliable value." : "")) : meanOk ? amb(`That is the mean of the field values (${f3(g.meanOfFields)}). Accepted as an estimate, but the pooled value ${f3(g.pooled)} uses every cell equally and is preferred.`) : bad(esc(j.msg))) + warn2; });
      const v5 = () => { const g = gs[+$("#k5", host).value]; $("#k5v", host).innerHTML = `Pooled: ${M().dividingOf(g.counts)} dividing of ${M().totalOf(g.counts)} cells (index ${f3(g.pooled)}); prophase ${g.counts.prophase}.${!g.cycling ? " " + amb("This slide is not untreated meristem: the cycle-time idea does not apply to it.") : ""}`; $("#k5f", host).textContent = ""; }; $("#k5", host).addEventListener("change", v5); v5();
      $("#k5c", host).addEventListener("click", () => { const g = gs[+$("#k5", host).value]; const t = M().totalOf(g.counts); const ta = g.pooled * 20, tb = (g.counts.prophase / t) * 20; const a = +$("#k5a", host).value.replace(",", "."), b = +$("#k5b", host).value.replace(",", "."); const okA = Math.abs(a - ta) <= Math.max(0.05, ta * 0.03), okB = Math.abs(b - tb) <= Math.max(0.05, tb * 0.03);
        if (!g.cycling) { $("#k5f", host).innerHTML = amb(`${okA && okB ? "The arithmetic is right" : "The arithmetic would be"} (${f3(g.pooled)} × 20 h = ${ta.toFixed(2)} h), but the result is not a time in mitosis: these are not untreated, cycling meristem cells, so the proportion-of-time assumption does not hold. Use a meristem slide from an untreated root.`); return; } $("#k5f", host).innerHTML = (okA ? ok(`✓ Mitosis: ${f3(g.pooled)} × 20 h = ${ta.toFixed(2)} h (${Math.round(ta * 60)} min).`) : bad(`Time in mitosis = mitotic index (as a decimal) × 20 h = ${f3(g.pooled)} × 20.`)) + " " + (okB ? ok(`✓ Prophase: ${g.counts.prophase} ÷ ${t} × 20 h = ${tb.toFixed(2)} h.`) : bad(`Time in prophase = (prophase cells ÷ all cells) × 20 h = ${g.counts.prophase} ÷ ${t} × 20.`)); });
    }
    render(); document.addEventListener("labrun", render);
  }
  function biasNote(gs) {
    const notes = gs.map((g) => { const picked = g.rows.filter((r) => r.how === "picked"); if (!picked.length) return ""; const r0 = g.rows[0]; const sl = makeSlide({ sampleId: r0.sampleId, seed: r0.seed, hours: r0.hours, mount: r0.zone === "elongation" && M().SAMPLES[r0.sampleId].zone !== "elongation" ? "cut" : "tip" }); const all = sl.fields.filter((f) => f.zone === r0.zone); const d = all.reduce((a, f) => a + M().dividingOf(f.counts), 0), t = all.reduce((a, f) => a + M().totalOf(f.counts), 0); const slideMI = d / t; const pickedT = M().miIndex(picked.reduce((c, r) => { KEYS.forEach((k) => (c[k] += r.truth[k])); return c; }, M().tally([]))); return pickedT > slideMI * 1.25 ? `<li>${esc(g.name)}: the fields you picked by eye at ×10 had a true index of ${f3(pickedT)}, but the whole slide's is ${f3(slideMI)}. Choosing fields because they "look interesting" (have dividing cells) makes the sample unrepresentative and overestimates the index. Choose fields at random, or move across the slide systematically.</li>` : ""; }).join("");
    return notes ? `<div class="notice amber mt"><strong>Unrepresentative fields.</strong><ul class="small">${notes}</ul></div>` : "";
  }

  // ================= Virtual Root-Tip Microscope (3.2.10.2 page) =================
  const IQ = () => B.rootTipModel.questions || [];
  B.interactives.rootTipMicroscope = function (spec, host) {
    ensureStyle(); const KEY = "4m"; const st = B.store.get(); st.labRuns[KEY] = st.labRuns[KEY] || []; const runs = st.labRuns[KEY]; let seed = 20261114;
    const head = `<div class="card-head"><h3>${esc(spec.title || "Virtual Root-Tip Microscope")}</h3><span class="badge amber">simulated image (illustration), not a micrograph</span></div><p class="small muted">${esc(spec.note || "Examine stained root-tip squashes, identify the stage of each cell, count, and calculate the mitotic index. Every image is drawn by this site's simulation, with stage proportions from hypothetical phase durations: see the assumptions below.")}</p>`;
    host.innerHTML = head + `<div class="row" role="tablist" data-r="tabs" style="gap:.35rem;flex-wrap:wrap"></div><div data-r="pane" class="mt"></div>`;
    const tabsBar = $('[data-r="tabs"]', host), pane = $('[data-r="pane"]', host); const labels = ["Microscope", "Results and mitotic index", "Photographs", "Questions", "Model and assumptions"]; let cur = 0;
    tabsBar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    pane.innerHTML = labels.map((_, i) => `<div data-p="${i}" role="tabpanel" hidden></div>`).join(""); const P = (i) => $(`[data-p="${i}"]`, pane); const built = {};
    const showTab = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", tabsBar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", tabsBar)[cur].focus(); labels.forEach((_, k) => (P(k).hidden = k !== cur)); if (cur === 1 || !built[cur]) { built[cur] = true; [scope, results, photos, questions, model][cur](P(cur)); } };
    $$("button", tabsBar).forEach((b) => b.addEventListener("click", () => showTab(+b.dataset.i)));
    tabsBar.addEventListener("keydown", (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); showTab(cur + d, true); } else if (e.key === "Home") { e.preventDefault(); showTab(0, true); } else if (e.key === "End") { e.preventDefault(); showTab(labels.length - 1, true); } });
    let micro = null; const samples = ["control", "second", "elong", "spindle", "dna", "fault"];
    const mk = (v, hours) => { if (v === "fault") { const g = M().rng(seed * 7 + 1); const h = ["tooFar", "stain", "layers", "crushed", "focus", "none"][Math.floor(g() * 6)]; return makeSlide({ sampleId: "control", seed, mount: h === "tooFar" ? "cut" : "tip", stain: h === "stain" ? 0.4 : 1, broken: h === "layers" ? 0.3 : 1, squash: h === "crushed" ? "heavy" : "gentle", hidden: h, own: false }); } return makeSlide({ sampleId: v, seed, hours, own: false }); };
    function scope(box) {
      box.innerHTML = `<div data-r="m"></div>`; let curSample = "control";
      micro = microscope($('[data-r="m"]', box), { slide: mk("control"), samples, allowDiagnosis: true, onRecord: (r) => { r.page = true; runs.push(r); B.store.save(); B.store.touchActivity("lab"); },
        onSample: (v) => { curSample = v; micro.setSlide(mk(v, micro.hours())); }, onNewSlide: () => { seed++; micro.setSlide(mk(curSample, micro.hours())); } });
    }
    function results(pane) {
      if (!runs.length) { pane.innerHTML = `<p class="small muted">No fields recorded yet. In the Microscope tab, identify every cell in a field and press Record this field. Record several fields of each slide.</p>`; return; }
      const gs = groups(runs);
      pane.innerHTML = `<div style="overflow-x:auto"><table class="tbl small">${recHead("<th>Your index</th>")}<tbody>${runs.map((r, i) => recRow(r, i, `<td><input type="text" inputmode="decimal" data-mi="${i}" style="width:5.5rem;padding:.25rem .35rem;border:1px solid var(--line-strong);border-radius:6px" aria-label="mitotic index of row ${i + 1}"> <button type="button" class="btn sm" data-mic="${i}">Check</button><div class="tiny" data-mif="${i}" aria-live="polite"></div></td>`)).join("")}</tbody></table></div>
        <p class="tiny muted">Mitotic index = number of cells in stages of mitosis ÷ total number of cells. Fraction, decimal or percentage accepted.</p>
        <h4 class="mt">Several fields of each slide</h4><div>${dotPlot(gs)}</div>
        <div style="overflow-x:auto"><table class="tbl small mt"><thead><tr><th>Slide</th><th>Fields</th><th>Cells</th><th>Dividing</th><th>Pooled index</th><th>Range of field values</th></tr></thead><tbody>${gs.map((g) => `<tr><td>${esc(g.name)}</td><td>${g.rows.length}</td><td>${M().totalOf(g.counts)}</td><td>${M().dividingOf(g.counts)}</td><td>${f3(g.pooled)}</td><td>${f3(g.min)} to ${f3(g.max)}</td></tr>`).join("")}</tbody></table></div>
        <ul class="small"><li>Is the difference between two slides bigger than the differences between fields of the same slide? If not, it may be chance: count more fields.</li><li>The meristem (samples A and B) should give a far higher index than the zone of elongation, where cells have stopped dividing.</li><li>Treatment P holds cells in mitosis, so its index RISES although no cells finish dividing; treatment Q stops cells reaching mitosis, so after a few hours its index FALLS. Neither direction can be assumed for a new substance.</li></ul>${biasNote(gs)}
        <div class="row mt"><button type="button" class="btn sm" data-r="clr">Clear these results</button></div>`;
      $$("[data-mic]", pane).forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.mic; const j = M().judgeMI($(`[data-mi="${i}"]`, pane).value, runs[i].counts); $(`[data-mif="${i}"]`, pane).innerHTML = j.ok ? ok(esc(j.msg)) : bad(esc(j.msg)); }));
      $('[data-r="clr"]', pane).addEventListener("click", () => { if (confirm("Clear the results recorded in this microscope?")) { runs.length = 0; B.store.save(); results(pane); } });
    }
    function photos(pane) {
      pane.innerHTML = `<p class="small">Real light micrographs of onion root-tip squashes. Each numbered crop shows one cell, centred, whose stage was checked by eye; cells caught between stages were not used. No scale bars: these photographs cannot be used to measure size. Identify the stage of each centred cell (this question counts towards your mastery of 3.2.10.2).</p><div data-r="pq"></div>
        <h4 class="mt">Discussion (not marked): a cell between stages</h4><div style="max-width:260px">${M().photoPanel(["discuss"], { numbers: false, size: 240, aria: "Cropped micrograph of a cell with chromosomes in a broad band across the cell" })}</div><p class="small">${esc(M().PHOTO_DISCUSS.note)}</p><p class="tiny muted">Photograph: ${M().photoCredits(["discuss"])}. Cropped; no other change.</p>`;
      const pq = IQ().find((x) => x.id === "q-rp4-m-photo"); if (pq) $('[data-r="pq"]', pane).append(B.questions.render(pq));
    }
    function questions(pane) { pane.innerHTML = `<div data-r="qs"></div>`; IQ().filter((x) => x.id !== "q-rp4-m-photo").forEach((qq) => $('[data-r="qs"]', pane).append(B.questions.render(qq))); }
    function model(pane) {
      const p = M().fromCycle(), P4 = M().treatmentFractions("spindle", 4), Q4 = M().treatmentFractions("dna", 4); const pc = (x) => (x * 100).toFixed(1) + " %";
      pane.innerHTML = `<div class="notes small"><p><span class="badge amber">model, not measured data</span> Every field is drawn by this site's model. What it assumes:</p><ul>
        <li>Onion has 2n = 16 chromosomes, so every dividing cell is drawn with 16 chromosomes (32 chromatids). In anaphase the two chromatids of every chromosome go to opposite poles, centromere first.</li>
        <li>Hypothetical phase durations (not data from a study): G1 8 h, S 6 h, G2 4 h, prophase 1.0 h, metaphase 0.4 h, anaphase 0.2 h, telophase 0.4 h (cycle 20 h). Each cell's stage is chosen at random with probability equal to the fraction of the cycle in that stage: interphase ${pc(p.interphase)}, prophase ${pc(p.prophase)}, metaphase ${pc(p.metaphase)}, anaphase ${pc(p.anaphase)}, telophase ${pc(p.telophase)} (meristem index 0.10).</li>
        <li>Zone of elongation: model index 0.01 (hypothetical): cells there have almost stopped dividing; they are long with the nucleus off-centre.</li>
        <li>Fields differ: each field's expected index is the sample value × a random factor from 0.7 to 1.3; then each cell is chosen independently, so chance adds more variation.</li>
        <li>Treatments P and Q are hypothetical. The simulation follows 4000 cells with ages spread evenly through the cycle, assumes the substance acts at once and completely, and that no cells die. P (no spindle): cells reaching the end of metaphase cannot start anaphase; after 4 h the index is ${P4.mi.toFixed(3)} (it rises with time). Q (no DNA replication): cells cannot get through S; after 4 h the index is ${Q4.mi.toFixed(3)}, and from 6 h it is 0. Real substances can have other effects (killing cells, slowing every phase), so no substance can be assumed to raise or lower the index.</li>
        <li>Preparation faults: poor stain makes chromosomes faint (early prophase looks like interphase); poor maceration or no squash leaves two layers of cells that cannot both be in focus; too much pressure bursts some cells (20 %); out-of-focus images blur everything.</li>
        <li>Seeded: the same slide number always gives the same cells, so results can be checked and repeated.</li></ul></div>`;
    }
    showTab(0);
  };

  B.labSims.roottip = { sim, calc, makeSlide, microscope, groups, PROC, ITEMS, _bench: bench };
})(window.BIO);
