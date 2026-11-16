// Interactives for 3.2.11 Mutation and cancer (Phase 4 Batch 4, owned by the 3.2.11 author). Kinds:
//   mutationExplorer       (3.2.11.1) Mutation Explorer: make a substitution or a deletion in a short gene, predict,
//                          then transcribe, translate and compare. All decoding through B.proteinModel; outcome from B.mutationModel.classify.
//   cancerControlExplorer  (3.2.11.2) Cell Division Control Explorer: accelerator (receptor) and brake (tumour
//                          suppressor protein) for a normal cell, an oncogene, an inactivated tumour suppressor gene or both.
//   cancerDataInvestigator (3.2.11.2) Cancer Data Investigator: datasets from the page spec (real ones cited, hypothetical
//                          ones labelled), calculation, claim evaluation, mechanism, marked questions. No personal risk tool.
//   cancerDrugChallenge    (3.2.11.2) Cell-Cycle Treatment Challenge: predict the effects of two hypothetical drugs on
//                          different cells, then a hypothetical schedule model (B.mutationModel.dosing).
// Every embedded question is rendered with B.questions.render, so attempts count towards mastery and the mistake bank.
// Controls are native buttons, radios, selects and checkboxes; base-pair and tab rows use a roving tab stop (arrow
// keys, Home, End). Nothing animates, so reduced motion needs no special case; results are announced in polite live
// regions. Layouts wrap (flex-wrap) and SVGs scale, so nothing scrolls sideways at 390 px.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.mutationModel, A = () => B.mutationArt, P = () => B.proteinModel, PA = () => B.proteinArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const WRAP = "display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;max-width:100%";
  const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const FILL = { A: "#fbe3b0", T: "#f6cfcf", U: "#ead3f0", G: "#cdeee9", C: "#d5e1f2" };
  const baseChip = (b, extra = "") => `<span style="display:inline-block;min-width:1.5em;text-align:center;font-family:${MONO};font-weight:700;color:#16263a;background:${FILL[b] || "#fff"};border:1px solid #9aa8b5;border-radius:4px;padding:1px 2px;${extra}">${b}</span>`;
  const aaTxt = (a) => (a === "STOP" ? "stop" : a);
  const roving = (bar, sel, onKey) => { bar.addEventListener("keydown", (e) => { const items = $$(sel, bar); const i = items.indexOf(document.activeElement); if (i < 0) return; let ni = null; if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = Math.min(items.length - 1, i + 1); else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ni = Math.max(0, i - 1); else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = items.length - 1; if (ni === null) return; e.preventDefault(); items.forEach((x, k) => (x.tabIndex = k === ni ? 0 : -1)); items[ni].focus(); if (onKey) onKey(items[ni]); }); };
  const tabs = (bar, labels, onShow) => { let cur = 0;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(0); return show; };

  // ============================================ 1. Mutation Explorer ============================================
  B.interactives.mutationExplorer = function (spec, host) {
    const m = M(), p = P(), u = uidOf(); const id = (k) => `mx-${k}-${u}`; const q = (k) => $("#" + id(k), host);
    // Simplified in the 2026-11-15 release review: three genes, both strands always shown with a position number above
    // every base pair, substitution or deletion only (insertion and three-base deletion stay in the notes), and the whole
    // polypeptide translated at once when the student checks. Model rules (first AUG, non-overlapping triplets, first stop
    // codon or the end of the part shown; changes outside the coding sequence have no effect) are in _mutation-art.js.
    let coding = m.GENES[0].coding, sel = null, type = "sub", base = null;
    host.innerHTML = head(spec, "predict, then check") + `
      <div class="card">
        <div style="${WRAP}"><label class="small" for="${id("gene")}"><strong>Gene</strong></label>
          <select id="${id("gene")}">${m.GENES.map((g, i) => `<option value="${i}">${esc(g.name)}</option>`).join("")}</select></div>
        <p class="tiny muted mt" id="${id("gnote")}"></p>
        <p class="small mt" id="${id("legend")}"></p>
        <div id="${id("dna")}" role="group" aria-label="DNA base pairs; use the arrow keys to move and Enter to choose" style="display:flex;flex-wrap:wrap;gap:.5rem .6rem;max-width:100%"></div>
        <fieldset class="mt" style="border:0;padding:0;margin:.6rem 0 0"><legend class="small"><strong>1. Choose a mutation</strong></legend>
          <div style="${WRAP}">${[["sub", "Base substitution"], ["del", "Base deletion"]].map(([v, l], i) => `<label class="small"><input type="radio" name="${id("type")}" value="${v}"${i === 0 ? " checked" : ""}> ${l}</label>`).join("")}</div>
          <div style="${WRAP}" class="mt" id="${id("bases")}"></div></fieldset>
        <p class="small mt" id="${id("chosen")}" aria-live="polite">Choose a base pair in the sequence above.</p>
        <fieldset style="border:0;padding:0;margin:.4rem 0 0"><legend class="small"><strong>2. Predict the effect on the polypeptide</strong></legend>
          <div style="${WRAP}">${[["same", "No change to the amino acids"], ["one", "One amino acid changed"], ["stop", "Stops early (shorter polypeptide)"], ["shift", "Reading frame shifted: most amino acids change from that point"], ["other", "Something else (for example the start or stop codon is lost)"]].map(([v, l]) => `<label class="small"><input type="radio" name="${id("pred")}" value="${v}"> ${l}</label>`).join("")}</div></fieldset>
        <div style="${WRAP}" class="mt"><button type="button" class="btn primary" id="${id("go")}">3. Check: transcribe and translate</button><button type="button" class="btn" id="${id("reset")}">Undo the mutation</button></div>
        <div id="${id("out")}" class="mt" aria-live="polite"></div>
        <details class="small mt"><summary><strong>The genetic code (provided, as in the exam)</strong></summary>${PA().codeTableHTML({ caption: "mRNA codons. You do not need to learn this table." })}</details>
        <p class="tiny muted mt">This is a simplified model: real genes are much longer.</p>
        <h4 class="mt">Questions</h4><div id="${id("q")}"></div>
      </div>`;
    const drawDna = () => {
      const o = m.orf(coding), tp = m.template(coding), n = coding.length; let groups = [];
      const start = o.start < 0 ? 0 : o.start, end = o.start < 0 ? n : o.end;
      if (start > 0) groups.push({ label: "before start", from: 0, to: start });
      for (let i = start, c = 1; i < end; i += 3, c++) groups.push({ label: c === 1 ? "start codon" : o.complete && i + 3 === end ? "stop codon" : "codon " + c, from: i, to: Math.min(i + 3, end) });
      if (end < n) groups.push({ label: "after stop", from: end, to: n });
      q("dna").innerHTML = groups.map((g) => `<div style="border:1px solid var(--line, #d6dee6);border-radius:8px;padding:3px 4px"><div class="tiny muted" style="text-align:center">${g.label}</div><div style="display:flex;gap:2px">${Array.from({ length: g.to - g.from }, (_, k) => { const i = g.from + k; const on = sel === i; return `<button type="button" class="btn sm" data-i="${i}" tabindex="${(sel === null ? i === 0 : on) ? 0 : -1}" aria-pressed="${on}" aria-label="Base pair ${i + 1}: coding strand ${coding[i]}, template strand ${tp[i]}" style="padding:2px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;${on ? "outline:3px solid #b4504f;outline-offset:1px" : ""}"><span class="tiny muted" style="line-height:1">${i + 1}</span>${baseChip(coding[i])}${baseChip(tp[i])}</button>`; }).join("")}</div></div>`).join("");
      $$("button[data-i]", q("dna")).forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i)));
      q("legend").innerHTML = "Number: the position of the base pair. Top base: <strong>coding strand, 5′→3′</strong>. Bottom base: <strong>template strand, 3′→5′</strong>. Codons are grouped from the start codon (ATG on the coding strand, TAC on the template strand).";
    };
    roving(q("dna"), "button[data-i]");
    const baseButtons = () => {
      const t = type; if (t === "del") { q("bases").innerHTML = `<span class="tiny muted">The chosen base pair will be removed.</span>`; base = null; return; }
      const cur = sel === null ? null : coding[sel]; const opts = "ATGC".split("").filter((b) => b !== cur);
      q("bases").innerHTML = `<span class="small">New base pair (coding · template):</span>` + opts.map((b) => `<button type="button" class="btn sm" data-b="${b}" aria-pressed="${base === b}">${baseChip(b)} · ${baseChip(m.template(b))}</button>`).join("");
      $$("button[data-b]", q("bases")).forEach((x) => x.addEventListener("click", () => { base = x.dataset.b; $$("button[data-b]", q("bases")).forEach((y) => { y.setAttribute("aria-pressed", String(y === x)); y.classList.toggle("primary", y === x); }); describe(); }));
    };
    const mut = () => (sel === null ? null : { type, pos: sel, base });
    const ready = () => sel !== null && (type === "del" || base);
    const describe = () => { if (sel === null) { q("chosen").textContent = "Choose a base pair in the sequence above."; return; }
      const tp = m.template(coding); let t = `Base pair ${sel + 1} (coding ${coding[sel]}, template ${tp[sel]}). `;
      if (type === "sub") t += base ? `Substitution: coding ${coding[sel]} → ${base}, template ${tp[sel]} → ${m.template(base)}.` : "Now choose the new base.";
      else t += "Deletion of this base pair.";
      q("chosen").textContent = t; };
    const choose = (i) => { sel = i; base = null; q("out").innerHTML = ""; drawDna(); baseButtons(); describe(); const b = $(`button[data-i="${i}"]`, q("dna")); if (b) b.focus(); };
    // Explanations are written from the two translated polypeptides (the classification is sequence-based).
    const explain = (c, mu) => {
      const o = c.original, n = c.mutated, A = o.aas, Bn = n.aas, d = c.firstDiff;
      const edit = mu.type === "sub" ? "substitution" : mu.type === "ins" ? "insertion" : "deletion";
      const ci = o.start >= 0 ? Math.floor((mu.pos - o.start) / 3) : -1; const mr = p.codingToMrna(c.mutCoding);
      const oc = ci >= 0 ? o.codons[ci] : "", nc = ci >= 0 ? mr.slice(o.start + 3 * ci, o.start + 3 * ci + 3) : "";
      const codonNote = mu.type === "sub" && oc && nc ? `Codon ${ci + 1} changes from ${oc} (${aaTxt(p.aa(oc))}) to ${nc} (${aaTxt(p.aa(nc))}). ` : "";
      switch (c.kind) {
        case "unchanged": return `${codonNote}The two polypeptides are <strong>identical</strong>. ${mu.type === "sub" ? "Both codons code for the same amino acid: the code is degenerate." : "No codon that is read before the stop codon has changed, so the amino acid sequence is the same."}`;
        case "outside": return "The change is <strong>outside the coding sequence</strong> (before the start codon or after the stop codon), so the polypeptide is unchanged in this model.";
        case "missense": return `${codonNote}<strong>One amino acid changes</strong> (number ${d + 1}: ${aaTxt(A[d])} → ${aaTxt(Bn[d])}); all the others are the same${mu.type === "sub" ? ", because the code is non-overlapping" : ""}.`;
        case "nonsense": return `${codonNote}A <strong>stop codon</strong> is now read after ${Bn.length} amino acid${Bn.length === 1 ? "" : "s"}, so the polypeptide is shorter (${Bn.length} instead of ${A.length}${o.complete ? "" : " or more"}); the amino acids before the stop are unchanged.${mu.type === "del3" ? " <span class=\"badge amber\">stretch</span> Removing three bases joined the remaining bases into a stop codon." : mu.type !== "sub" ? " The frame shifted, and the very first new codon was a stop codon." : ""}`;
        case "stopLost": return `The <strong>stop codon is lost</strong>: ${A.every((x, i) => x === Bn[i]) ? `all ${A.length} original amino acids are unchanged` : `the original amino acids are unchanged except the last one, next to the deletion`}, but the ribosome reads on into bases that are normally not translated, so the polypeptide is longer${n.complete ? ` (${Bn.length} amino acids)` : " (beyond the part shown)"}. <span class="badge">supporting</span>`;
        case "inframe": return `The polypeptide has <strong>one amino acid fewer</strong>; after the change the rest are the same, because three bases (one codon's worth) were removed and the reading frame is kept. Where the deletion straddled two codons, one amino acid next to the gap can also change. <span class="badge amber">stretch</span>`;
        case "frameshift": return `The ${edit} shifts the <strong>reading frame</strong>: every codon after it is regrouped. ${d >= 0 ? `The first ${d} amino acid${d === 1 ? " is" : "s are"} unchanged; from amino acid ${d + 1} the sequence is different.` : ""} ${n.complete ? (c.prematureStop ? `A stop codon appears early in the new frame: ${Bn.length} amino acids.` : `A stop codon is reached in the new frame after ${Bn.length} amino acids.`) : "No stop codon is reached in the part shown: in the real gene the ribosome would read on in the new frame until it met one."}`;
        case "newStart": return `The change creates an <strong>AUG before the normal start codon</strong> (at base ${n.start + 1}), so in this model translation begins there and reads a different frame or sequence. <span class="badge">supporting</span>`;
        case "inframeOther": return "The reading frame is kept after the change, but more than one amino acid next to it is different. <span class=\"badge amber\">stretch</span>";
        default: return `The <strong>start codon</strong> AUG is changed, so translation cannot begin there. ${n.start >= 0 ? `In this model the ribosome starts at the next AUG instead (base ${n.start + 1}), giving a different polypeptide.` : "There is no other AUG in the sequence shown, so no polypeptide is made in this model."} In a real cell the normal polypeptide would usually not be made. <span class="badge">supporting</span>`;
      }
    };
    const out = () => {
      if (!ready()) { q("out").innerHTML = `<div class="feedback bad">Choose a base pair${type === "sub" ? " and a new base" : ""} first.</div>`; return; }
      const mu = mut(), c = m.classify(coding, mu), o = c.original, n = c.mutated; const pr = ($(`input[name="${id("pred")}"]:checked`, host) || {}).value;
      const mtp = m.template(c.mutCoding), mm = p.codingToMrna(c.mutCoding);
      const changed = new Set(); if (mu.type === "sub") changed.add(mu.pos);
      const row = (s, label, hi) => `<div class="small" style="margin:.2rem 0"><strong>${label}</strong></div><div style="display:flex;flex-wrap:wrap;gap:2px;max-width:100%">${[...s].map((b, i) => baseChip(b, hi.has(i) ? "outline:2px solid #b4504f;" : "") + ((i - (n.start >= 0 ? n.start : 0)) % 3 === 2 && i >= n.start ? '<span style="width:6px"></span>' : "")).join("")}</div>`;
      const nCod = Math.max(o.codons.length, n.codons.length); const shown = nCod;
      let tbody = ""; for (let i = 0; i < shown; i++) { const a0 = o.codons[i] ? p.aa(o.codons[i]) : "", a1 = n.codons[i] ? p.aa(n.codons[i]) : ""; const diff = a0 !== a1; tbody += `<tr><td>${i + 1}</td><td><span style="font-family:${MONO}">${o.codons[i] || "–"}</span> ${o.codons[i] ? aaTxt(a0) : ""}</td><td${diff ? ' style="color:#b4504f;font-weight:700"' : ""}><span style="font-family:${MONO}">${n.codons[i] || "–"}</span> ${n.codons[i] ? aaTxt(a1) : ""}</td></tr>`; }
      const ok = pr ? c.predictOk(pr) : null;
      q("out").innerHTML = `<div class="card">
        ${row(c.mutCoding, "Mutated coding strand (5′→3′)", changed)}${row(mtp, "Mutated template strand (3′→5′)", changed)}
        ${row(mm, "mRNA transcribed from the template (5′→3′)", changed)}
        <p class="tiny muted">Codons in the mutated mRNA are spaced from its start codon${n.start >= 0 ? ` (base ${n.start + 1})` : " (none found)"}.</p>
        <div style="max-width:100%;overflow-x:auto" class="mt"><table class="tbl small"><thead><tr><th>Codon</th><th>Original: codon, amino acid</th><th>Mutated: codon, amino acid</th></tr></thead><tbody>${tbody}</tbody></table></div>
        ${shown >= nCod ? `<p class="small"><strong>Original:</strong> ${o.aas.join("–") || "none"}${o.complete ? "" : " … (no stop codon in the part shown)"}<br><strong>Mutated:</strong> ${n.aas.join("–") || "none"}${n.complete ? "" : n.start >= 0 ? " … (no stop codon in the part shown)" : ""}</p>
        <p class="small"><strong>Outcome:</strong> ${esc(c.out.label)} <span class="tiny muted">(${esc(c.out.term)})</span></p><p class="small">${explain(c, mu)}</p>
        ${pr ? `<div class="feedback ${ok ? "ok" : "bad"}"><strong>${ok ? "Your prediction was right." : "Your prediction did not match."}</strong> ${ok ? "" : "Compare the codons above to see why."}</div>` : `<p class="tiny muted">Make a prediction first next time: it is the skill the exam tests.</p>`}` : ""}
      </div>`;
    };
    const setGene = () => { const g = m.GENES[+q("gene").value]; coding = g.coding; q("gnote").textContent = g.note; sel = null; base = null; q("out").innerHTML = ""; drawDna(); baseButtons(); describe(); };
    q("gene").addEventListener("change", setGene);
    $$(`input[name="${id("type")}"]`, host).forEach((r) => r.addEventListener("change", () => { type = r.value; base = null; q("out").innerHTML = ""; baseButtons(); describe(); }));
    q("go").addEventListener("click", () => out());
    q("reset").addEventListener("click", () => { sel = null; base = null; q("out").innerHTML = ""; $$(`input[name="${id("pred")}"]`, host).forEach((r) => (r.checked = false)); drawDna(); baseButtons(); describe(); });
    setGene(); renderQs(spec.questions, q("q"));
  };

  // ======================================= 2. Cell Division Control Explorer =======================================
  // Rebuilt in the 2026-11-15 release review as the accelerator-and-brake picture made clickable: four states (normal,
  // oncogene, inactivated tumour suppressor gene, both) and one switch (growth factor). The result is shown as the clone
  // of cells after the same time, not as a number. Simplified model (kept here, not shown): a normal cell with growth
  // factor makes 4 cells and stops (controlled); an oncogene signals with or without growth factor, but the working brake
  // still slows it (8 cells); an inactivated tumour suppressor gene removes the brake, so a stimulated cell makes 8 cells;
  // with no growth factor nothing stimulates it, so it does not divide; both mutations together (accelerator stuck on and
  // no brake) give the most cells, a crowded mass of 32 (round 2, 2026-11-16: one mutation must give fewer than two).
  B.interactives.cancerControlExplorer = function (spec, host) {
    const u = uidOf(); const id = (k) => `cc-${k}-${u}`; const q = (k) => $("#" + id(k), host);
    const STATES = [["normal", "Normal cell"], ["onc", "Mutate the proto-oncogene (oncogene)"], ["ts", "Inactivate the tumour suppressor gene"], ["both", "Both mutated"]];
    host.innerHTML = head(spec, "simplified model") + `
      <div class="row" role="group" aria-label="choose the cell" id="${id("st")}">${STATES.map(([k, l], i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" data-st="${k}" aria-pressed="${i === 0}">${esc(l)}</button>`).join("")}</div>
      <div class="row mt"><label class="small"><input type="checkbox" id="${id("gf")}" checked> Growth factor present</label><span class="tiny muted">Try switching growth factor off for each cell.</span></div>
      <div class="figure mt"><div class="fig-view" id="${id("fig")}" style="max-width:720px;margin:0 auto"></div></div>
      <p class="ix-readout mt" id="${id("txt")}" aria-live="polite"></p>
      <p class="tiny muted mt">This is a simplified model. Real cells have many more control proteins.</p>
      <h4 class="mt">Questions</h4><div id="${id("q")}"></div>`;
    let st = "normal";
    const INK = "#16263a", NAVY = "#1e3a5f", ROSE = "#b4504f", SAGE = "#3f7a55", GREY = "#6b7d8f", AMB = "#c8902a";
    const T = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 14}" text-anchor="${o.a || "middle"}" fill="${o.c || INK}"${o.w ? ` font-weight="${o.w}"` : ""}>${t}</text>`;
    const result = (s, gf) => { const onc = s === "onc" || s === "both", ts = s === "ts" || s === "both";
      if (s === "both") return { n: 32, crowd: true, label: "32 cells piling up: a tumour", col: ROSE,
        say: "<strong>Both mutated:</strong> the accelerator is stuck on and there is no brake, so the cells divide fastest of all and pile up into a tumour." };
      if (onc) return { n: 8, label: "8 cells and still dividing", col: ROSE,
        say: `<strong>Oncogene:</strong> the receptor signals all the time${gf ? "" : ", even with no growth factor"}, so the cell divides too quickly, but the working tumour suppressor protein still slows it.` };
      if (ts) return gf ? { n: 8, label: "8 cells and still dividing", col: ROSE, say: "<strong>Inactivated tumour suppressor gene:</strong> nothing slows division, so the cell divides faster than normal whenever growth factor stimulates it." }
        : { n: 1, label: "1 cell: not dividing", col: GREY, say: "<strong>Inactivated tumour suppressor gene, no growth factor:</strong> there is no brake, but in this model nothing is stimulating the cell to divide, so it does not divide." };
      return gf ? { n: 4, label: "4 cells, then division stops", col: SAGE, say: "<strong>Normal cell:</strong> growth factor stimulates division and the tumour suppressor protein slows it, so the cell divides only as much as the tissue needs." }
        : { n: 1, label: "1 cell: not dividing", col: GREY, say: "<strong>Normal cell, no growth factor:</strong> the receptor sends no signal, so the cell is not stimulated to divide." }; };
    const draw = () => { const gf = q("gf").checked, onc = st === "onc" || st === "both", ts = st === "ts" || st === "both"; const r = result(st, gf);
      const on = onc || gf; const recC = onc ? ROSE : NAVY; let s = "";
      // the cell
      s += `<ellipse cx="170" cy="152" rx="150" ry="92" fill="#fdf6ee" stroke="#c8a77a" stroke-width="3"/>`;
      s += `<rect x="154" y="44" width="13" height="34" rx="4" fill="${onc ? "#f6cfcf" : "#cfe6f5"}" stroke="${recC}" stroke-width="1.8"/><rect x="173" y="44" width="13" height="34" rx="4" fill="${onc ? "#f6cfcf" : "#cfe6f5"}" stroke="${recC}" stroke-width="1.8"/>`;
      if (gf) s += `<polygon points="170,12 182,24 170,36 158,24" fill="${AMB}" stroke="#8a5f12"/>` + T(146, 29, "growth factor", { a: "end", s: 14, c: "#8a5f12", w: 700 });
      s += T(194, 38, "accelerator: receptor", { a: "start", s: 13, w: 700, c: recC }) + T(194, 56, onc ? "always on" : on ? "signalling" : "off", { a: "start", s: 14, w: 700, c: onc ? ROSE : on ? SAGE : GREY });
      // signal arrow from the receptor to the nucleus
      s += on ? `<path d="M170 82 L132 124" stroke="${onc ? ROSE : SAGE}" stroke-width="${onc ? 4 : 2.6}" fill="none"/><path d="M124 132 l4 -14 l9 8z" fill="${onc ? ROSE : SAGE}"/>` : "";
      s += `<circle cx="104" cy="164" r="38" fill="#eef1f7" stroke="${NAVY}" stroke-width="1.6"/>` + T(104, 169, "nucleus", { s: 14, c: NAVY });
      // the brake
      s += ts ? `<rect x="186" y="128" width="122" height="62" rx="10" fill="#f2f2f2" stroke="${GREY}" stroke-width="1.6" stroke-dasharray="5 4"/>` + T(247, 154, "no brake", { s: 15, w: 700, c: GREY }) + T(247, 174, "(gene inactivated)", { s: 13, c: GREY })
        : `<rect x="186" y="128" width="122" height="62" rx="10" fill="#fbe9e8" stroke="${ROSE}" stroke-width="1.8"/>` + T(247, 150, "brake: tumour", { s: 14, w: 700, c: ROSE }) + T(247, 168, "suppressor", { s: 14, w: 700, c: ROSE }) + T(247, 185, "protein", { s: 14, w: 700, c: ROSE }) + (on ? `<path d="M186 150 L150 112" stroke="${ROSE}" stroke-width="2.4"/><path d="M143 117 l14 -10" stroke="${ROSE}" stroke-width="3.4"/>` : "");
      // the clone after the same time
      s += T(520, 24, "After the same time:", { s: 15, w: 700 });
      const cx = 520, cy = 140; let cells = "";
      const cell = (x, y, f, c, rc = 13) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rc}" fill="${f}" stroke="${c}" stroke-width="1.6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rc * 0.35).toFixed(1)}" fill="${c}"/>`;
      if (r.crowd) { cells += `<path d="M444 120 C 450 70, 540 52, 584 80 C 612 100, 606 170, 590 192 C 570 220, 500 224, 466 202 C 440 184, 438 150, 444 120z" fill="#fbe1de" stroke="${ROSE}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
        for (let i = 0; i < r.n; i++) { const a = i * 2.39996, rr = 10.5 * Math.sqrt(i); cells += cell(cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.9, "#f1c6c2", ROSE, 10.5); } }
      else { const cols = r.n >= 8 ? 4 : r.n === 4 ? 2 : 1, gap = 34; const x0 = cx - ((cols - 1) * gap) / 2, y0 = cy - ((Math.ceil(r.n / cols) - 1) * gap) / 2;
        for (let i = 0; i < r.n; i++) cells += cell(x0 + (i % cols) * gap, y0 + Math.floor(i / cols) * gap, r.col === ROSE ? "#fdf1e2" : r.col === SAGE ? "#e8f4ec" : "#eef1f4", r.col); }
      s += cells + T(520, 262, r.label, { s: 15, w: 700, c: r.col });
      const lab = `${STATES.find((x) => x[0] === st)[1]}, growth factor ${gf ? "present" : "absent"}: ${r.label}`;
      // two halves of one drawing (the cell, then the cells after the same time): side by side on a laptop, stacked on a phone
      const half = (vb, extra) => `<svg viewBox="${vb} 0 340 276" width="340" ${extra} style="flex:1 1 300px;max-width:340px;height:auto" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"><rect x="${vb}" width="340" height="276" fill="#fff"/>${s}</svg>`;
      // the arrow between the halves points right when they sit side by side and down when they stack (phones)
      q("fig").innerHTML = `<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:0">${half(0, `role="img" aria-label="${esc(lab)}"`)}<span data-arrow aria-hidden="true" style="font-size:1.6rem;line-height:1;color:${GREY};padding:0 .2rem">→</span>${half(340, 'aria-hidden="true"')}</div>`;
      q("txt").innerHTML = r.say; arrow(); };
    const arrow = () => { const sv = $$("svg", q("fig")), a = $("[data-arrow]", q("fig")); if (sv.length < 2 || !a) return; const stacked = sv[1].getBoundingClientRect().top > sv[0].getBoundingClientRect().top + 20; a.textContent = stacked ? "↓" : "→"; a.style.flexBasis = stacked ? "100%" : ""; a.style.textAlign = "center"; };
    window.addEventListener("resize", () => { if (document.body.contains(host)) arrow(); });
    $$(`#${id("st")} [data-st]`, host).forEach((b) => b.addEventListener("click", () => { st = b.dataset.st; $$(`#${id("st")} [data-st]`, host).forEach((x) => { const on = x === b; x.classList.toggle("primary", on); x.setAttribute("aria-pressed", String(on)); }); draw(); }));
    q("gf").addEventListener("change", draw);
    draw(); renderQs(spec.questions, q("q"));
    host._control = { set: (k, gf) => { const b = $(`#${id("st")} [data-st="${k}"]`, host); if (gf !== undefined) q("gf").checked = gf; b.click(); }, text: () => q("txt").textContent }; // for tests
  };

  // ========================================= 3. Cancer Data Investigator =========================================
  B.interactives.cancerDataInvestigator = function (spec, host) {
    const u = uidOf(); const id = (k) => `cd-${k}-${u}`; const q = (k) => $("#" + id(k), host); const DS = spec.datasets || [];
    // Questions are rendered once, after the datasets (the page moves them to Check yourself); switching dataset only
    // redraws the data, never the questions.
    host.innerHTML = head(spec, "real and hypothetical data") + `<div class="card"><div style="${WRAP}" id="${id("tabs")}" aria-label="datasets"></div><div id="${id("pane")}" class="mt" role="tabpanel"></div></div><h4 class="mt">Questions</h4><div id="${id("q")}"></div>`;
    const show = (i) => { const d = DS[i]; const pane = q("pane");
      const src = d.cite ? (B.diseaseModel.SRC[d.cite] || B.mutationModel.SRC[d.cite]) : null; const wideChart = (pane.clientWidth || host.clientWidth || 800) >= 560;
      pane.innerHTML = `<div style="${WRAP}"><h4 style="margin:0">${esc(d.title)}</h4>${d.tag === "real" ? '<span class="badge teal">real data</span>' : '<span class="badge amber">hypothetical data</span>'}</div>
        <p class="small mt">${d.intro}</p>
        <div class="figure"><div class="fig-view" style="max-width:${wideChart ? 640 : 480}px">${d.chart({ compact: wideChart })}</div></div>
        <details class="small"><summary><strong>Data table</strong></summary>${d.table()}</details>
        ${d.tag === "hypothetical" ? `<p class="tiny muted">Hypothetical data, written for teaching.${src ? ` Real figure quoted above: <a href="${src.url}" target="_blank" rel="noopener">${esc(src.cite)}</a>.` : ""}</p>` : src ? `<p class="tiny muted">Source: <a href="${src.url}" target="_blank" rel="noopener">${esc(src.cite)}</a>.</p>` : ""}
        <div class="mt"><button type="button" class="btn sm" data-act="calc" aria-expanded="false">Show the calculation</button><div class="small mt" data-out="calc" hidden></div></div>
        <div class="mt"><p class="small"><strong>Evaluate the claim:</strong> "${esc(d.claim.text)}"</p><div style="${WRAP}" role="group" aria-label="your judgement">${[["sup", "Supported"], ["part", "Partly supported"], ["not", "Not supported"]].map(([v, l]) => `<button type="button" class="btn sm" data-claim="${v}" aria-pressed="false">${l}</button>`).join("")}</div><div class="mt" data-out="claim" aria-live="polite"></div></div>
        <details class="small mt"><summary><strong>Explain it with biology</strong></summary><p>${d.mech}</p></details>`;
      const cb = $("button[data-act=calc]", pane), co = $("[data-out=calc]", pane); co.innerHTML = d.calc();
      cb.addEventListener("click", () => { co.hidden = !co.hidden; cb.setAttribute("aria-expanded", String(!co.hidden)); cb.textContent = co.hidden ? "Show the calculation" : "Hide the calculation"; });
      $$("button[data-claim]", pane).forEach((b) => b.addEventListener("click", () => { const v = b.dataset.claim, ok = v === d.claim.best; $$("button[data-claim]", pane).forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.classList.toggle("primary", x === b); }); $("[data-out=claim]", pane).innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}"><strong>${ok ? "Agreed." : "Think again."}</strong> ${d.claim.fb[v]}</div>`; }));
      };
    tabs(q("tabs"), DS.map((d) => d.label), show);
    DS.forEach((d) => renderQs(((spec.items || []).find((x) => x.id === d.id) || {}).questions, q("q")));
  };

  // ========================================= 4. Cell-Cycle Treatment Challenge =========================================
  B.interactives.cancerDrugChallenge = function (spec, host) {
    const m = M(), u = uidOf(); const id = (k) => `cg-${k}-${u}`; const q = (k) => $("#" + id(k), host);
    const DRUGS = { S: { name: "Drug S (hypothetical): stops DNA replication", stage: "S", why: "The cell cannot copy its DNA in the S phase, so it cannot go on to divide." }, M: { name: "Drug M (hypothetical): prevents spindle fibres forming", stage: "M", why: "Without spindle fibres attached to the centromeres the chromatids cannot be separated, so mitosis stops at metaphase." } };
    const CELLS = [
      { k: "tumour", n: "Tumour cells", aff: true, why: "They divide frequently, so many are in S phase or mitosis while the drug is present." },
      { k: "hair", n: "Hair follicle cells", aff: true, why: "They divide rapidly to make hair: hair loss is a common side effect." },
      { k: "marrow", n: "Bone marrow (blood-forming) cells", aff: true, why: "They divide rapidly to make blood cells: fewer white cells (more infections), red cells (tiredness) and platelets." },
      { k: "gut", n: "Cells lining the gut", aff: true, why: "The lining is replaced every few days by rapid division: sickness and diarrhoea." },
      { k: "nerve", n: "Most nerve cells", aff: false, why: "Most mature nerve cells no longer divide, so a drug acting on S phase or mitosis has little effect on them." },
    ];
    host.innerHTML = head(spec, "hypothetical drugs and model") + `
      <div class="card">
        <h4>A. Where does each drug act, and which cells does it affect?</h4>
        <div style="${WRAP}" role="radiogroup" aria-label="choose a drug">${Object.entries(DRUGS).map(([k, d], i) => `<label class="small"><input type="radio" name="${id("drug")}" value="${k}"${i === 0 ? " checked" : ""}> ${esc(d.name)}</label>`).join("")}</div>
        <div style="${WRAP}" class="mt"><label class="small" for="${id("stage")}"><strong>Predict: the stage where treated cells stop</strong></label><select id="${id("stage")}"><option value="">choose…</option><option value="G1">G1</option><option value="S">S phase</option><option value="G2">G2</option><option value="M">Mitosis (metaphase)</option></select></div>
        <div class="mt" style="max-width:100%;overflow-x:auto"><table class="tbl small"><thead><tr><th>Cells</th><th>Prediction</th></tr></thead><tbody>${CELLS.map((c) => `<tr><td>${c.n}</td><td><select data-cell="${c.k}" aria-label="prediction for ${c.n}"><option value="">choose…</option><option value="1">Strongly affected</option><option value="0">Little affected</option></select></td></tr>`).join("")}</tbody></table></div>
        <div style="${WRAP}" class="mt"><button type="button" class="btn primary" id="${id("check")}">Check predictions</button></div>
        <div id="${id("fb")}" class="mt" aria-live="polite"></div>
        <details class="mt"><summary><strong>B. Stretch: why are doses spaced out?</strong> <span class="badge">supporting</span></summary><p class="small muted mt">A hypothetical model: choose how often a dose is given and how strong it is.</p>
        <div style="${WRAP}"><label class="small" for="${id("iv")}"><strong>Dose every</strong></label><select id="${id("iv")}"><option value="7">7 days</option><option value="14">14 days</option><option value="21" selected>21 days</option></select>
          <label class="small" for="${id("st")}"><strong>Dose strength</strong></label><select id="${id("st")}"><option value="low">low</option><option value="medium" selected>medium</option><option value="high">high</option></select></div>
        <div class="figure mt"><div class="fig-view" id="${id("chart")}"></div></div>
        <div id="${id("res")}" class="small" aria-live="polite"></div>
        <details class="small mt"><summary><strong>Model assumptions and limitations</strong></summary><ul>
          <li>HYPOTHETICAL. Tumour cells grow by ${(m.DOSE.g * 100).toFixed(0)} % a day with no control. Bone marrow cells are under normal control and regrow towards their normal number (logistic recovery). Each dose kills a fraction of the cells that are dividing: ${(m.DOSE.divT * 100).toFixed(0)} % of tumour cells and ${(m.DOSE.divM * 100).toFixed(0)} % of marrow cells are taken to be dividing. The ${m.DOSE.safe} % line is an arbitrary model threshold.</li>
          <li>Real tumours contain cells that are not dividing, can become resistant, and differ greatly between people and cancers; real treatment plans are decided by doctors using clinical evidence. Nothing here is medical information.</li></ul></details></details>
        <h4 class="mt">Questions</h4><div id="${id("q")}"></div>
      </div>`;
    const check = () => { const dk = ($(`input[name="${id("drug")}"]:checked`, host) || {}).value; const d = DRUGS[dk]; const st = q("stage").value; let right = 0, html = "";
      const stOk = st === d.stage; if (stOk) right++;
      html += `<div class="feedback ${stOk ? "ok" : "bad"}"><strong>Stage: ${stOk ? "correct" : st ? "not quite" : "no prediction"}.</strong> ${d.stage === "S" ? "S phase." : "Mitosis, at metaphase."} ${d.why}</div>`;
      CELLS.forEach((c) => { const v = $(`select[data-cell="${c.k}"]`, host).value; const ok = v !== "" && (v === "1") === c.aff; if (ok) right++; html += `<div class="feedback ${ok ? "ok" : "bad"} small"><strong>${c.n}: ${c.aff ? "strongly affected" : "little affected"}.</strong> ${c.why}</div>`; });
      q("fb").innerHTML = `<p class="small"><strong>${right} of ${CELLS.length + 1} predictions correct.</strong> Both drugs affect any dividing cell: the drug cannot tell a cancer cell from a normal cell that is dividing.</p>` + html; };
    q("check").addEventListener("click", check);
    $$(`input[name="${id("drug")}"]`, host).forEach((r) => r.addEventListener("change", () => { q("fb").innerHTML = ""; }));
    const sched = () => { const res = m.dosing({ interval: +q("iv").value, strength: q("st").value }); q("chart").innerHTML = A().doseChart(res);
      const t = res.end.t, tTxt = t < 0.1 ? "less than 0.1" : t.toFixed(t < 10 ? 1 : 0);
      q("res").innerHTML = `<p>${res.given} doses in ${m.DOSE.days} days. Tumour cells at the end: <strong>${tTxt} %</strong> of the starting number${t > 100 ? " (the tumour grew: too little killing between long gaps)" : ""}. Lowest bone marrow level: <strong>${res.minM.toFixed(0)} %</strong>${res.unsafe ? ` <span class="badge amber">below the ${m.DOSE.safe} % model line</span>: too frequent or too strong for normal cells to recover` : ": normal cells recover between doses"}.</p>`; };
    q("iv").addEventListener("change", sched); q("st").addEventListener("change", sched);
    sched(); renderQs(spec.questions, q("q"));
  };
})(window.BIO);
