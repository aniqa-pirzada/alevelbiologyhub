// Interactives for 3.1.8 Protein synthesis. Kinds: psCodeExplorer (3.1.8.1), psTranscription and psTranslation
// (3.1.8.2), psDecoder (3.1.8.3). The model (standard genetic code, base pairing) and drawings are in
// data/content/_protein-synth-art.js and documented there. All controls are buttons, selects and inputs (keyboard
// accessible); status messages are announced through aria-live regions; with reduced motion, nothing is tweened and
// "Play" is replaced by stepping.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, el, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store.get().prefs || {}).reducedMotion);
  const head = (spec, badge = "schematic") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const M = () => B.proteinModel, A = () => B.proteinArt;
  const questions = (host, sel, qs) => (qs || []).forEach((q) => $(sel, host).append(B.questions.render(q)));
  const aaLabel = (a) => (a === "STOP" ? "stop" : a);
  const mono = () => `font-family:${A().MONO}`;
  const chip = (b, extra = "") => `<span style="display:inline-block;min-width:1.35em;text-align:center;border-radius:4px;padding:0 2px;margin:1px;background:${A().colours.FILL[b] || "#fff"};border:1px solid ${A().colours.EDGE[b] || "#999"};${mono()};font-weight:700${extra}">${b}</span>`;
  // Every interactive guards against its host being removed (navigation) before a timer fires.
  const alive = (host) => document.body.contains(host);
  // Phones (release review 2026-11-15): when a wide drawing scrolls sideways in its own box, keep the active part (the
  // ribosome, RNA polymerase or DNA helicase) centred in view after each step, so it never leaves the visible window.
  const follow = (box, sel) => setTimeout(() => { const t = box.querySelector(sel); const sc = t && t.closest(".ix-hscroll"); if (!sc) return; const a = t.getBoundingClientRect(), b = sc.getBoundingClientRect(); sc.scrollLeft += a.left + a.width / 2 - (b.left + b.width / 2); }, 260);

  // ======================= 1. Genetic Code Explorer (3.1.8.1) =======================
  B.interactives.psCodeExplorer = function (spec, host) {
    const ORIGINAL = "AUGGCAGGAUGGCAUUAA"; let seq = ORIGINAL, lastChange = null;
    host.innerHTML = head(spec, "standard code") + `
      <div class="row"><label class="small">Reading: <select id="ce-mode"><option value="non">non-overlapping (how the code works)</option><option value="over">overlapping (hypothetical, for comparison)</option></select></label>
      <label class="small">Start reading at: <select id="ce-frame"><option value="0">base 1 (the start codon)</option><option value="1">base 2</option><option value="2">base 3</option></select></label>
      <button class="btn sm" id="ce-reset">Reset sequence</button></div>
      <p class="small mt">mRNA (5′ → 3′). <strong>Select any base to change it</strong> (each press cycles A → U → G → C). <span class="badge">supporting</span> Changing bases previews ideas used again in 3.2.11.1 (gene mutations).</p>
      <div id="ce-bases" class="row" style="gap:2px;flex-wrap:wrap" role="group" aria-label="mRNA bases"></div>
      <div id="ce-out" class="mt"></div>
      <div id="ce-msg" class="notice mt" aria-live="polite"></div>
      <details class="mt"><summary class="small">Show the code table (provided, as in an examination)</summary><div id="ce-table" class="mt"></div></details>
      <div id="ce-q"></div>
      <p class="tiny muted mt">The overlapping code is hypothetical, shown only for comparison: the real code is non-overlapping.</p>`;
    const mode = () => $("#ce-mode", host).value, frame = () => +$("#ce-frame", host).value;
    // Hypothetical overlapping code drawn as staggered brackets under the bases (three rows, so brackets never collide).
    const overSvg = (t) => { const w = 28, x0 = 20, n = seq.length, W = x0 * 2 + n * w, H = 44 + 3 * 46; const ci = lastChange ? lastChange.i : -1;
      let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;display:block" role="img" aria-label="${t.length} overlapping triplets drawn as staggered brackets under the ${n} bases">`;
      [...seq].forEach((b, i) => { s += `<rect x="${x0 + i * w + 1}" y="6" width="${w - 2}" height="26" rx="4" fill="${A().colours.FILL[b]}" stroke="${A().colours.EDGE[b]}"/><text x="${x0 + i * w + w / 2}" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="#16263a">${b}</text>`; });
      t.forEach((x, k) => { const r = k % 3, y = 44 + r * 46, xa = x0 + x.i * w + 3, xb = x0 + (x.i + 3) * w - 3, hit = ci >= x.i && ci < x.i + 3; s += `<path d="M${xa} ${y} v7 H${xb} v-7" fill="none" stroke="${hit ? "#b4504f" : "#1e3a5f"}" stroke-width="${hit ? 2.6 : 1.6}"/><text x="${(xa + xb) / 2}" y="${y + 24}" text-anchor="middle" font-size="13" font-weight="700" fill="${hit ? "#b4504f" : "#1e3a5f"}">${aaLabel(M().aa(x.c))}</text>`; });
      return `<div style="overflow-x:auto">${s}</svg></div>`; };
    const triplets = (s) => (mode() === "over" ? M().overlapping(s).map((c, i) => ({ c, i })) : M().codons(s, frame()).map((c, k) => ({ c, i: frame() + 3 * k })));
    const draw = () => {
      const bx = $("#ce-bases", host); bx.innerHTML = "";
      [...seq].forEach((b, i) => { const changed = b !== ORIGINAL[i]; const inFrame = mode() === "non" ? i >= frame() && (i - frame()) % 3 === 0 && i > 0 : false; if (inFrame) bx.append(el(`<span aria-hidden="true" style="width:6px"></span>`)); const btn = el(`<button class="btn sm" data-i="${i}" aria-label="base ${i + 1}: ${b}${changed ? ", changed" : ""}. Press to change." style="min-width:2.1em;padding:.25rem .3rem;${mono()};font-weight:700;background:${A().colours.FILL[b]};border-color:${changed ? "#16263a" : A().colours.EDGE[b]};${changed ? "outline:3px solid #c8902a;" : ""}">${b}</button>`); bx.append(btn); });
      const t = triplets(seq), t0 = triplets(ORIGINAL);
      const rows = t.map((x, k) => { const a = M().aa(x.c), a0 = t0[k] ? M().aa(t0[k].c) : a, diff = a !== a0, codonChanged = t0[k] && t0[k].c !== x.c; return `<tr${codonChanged ? ' style="background:var(--amber-soft)"' : ""}><td>${mode() === "over" ? "triplet" : "codon"} ${k + 1}</td><td class="tiny muted">bases ${x.i + 1}–${x.i + 3}</td><td>${[...x.c].map((b) => chip(b)).join("")}</td><td><strong>${aaLabel(a)}</strong>${codonChanged ? (diff ? ` <span class="small" style="color:var(--rose-ink)">(was ${aaLabel(a0)})</span>` : ` <span class="small" style="color:var(--teal)">(unchanged)</span>`) : ""}</td></tr>`; }).join("");
      const prot = M().translate(seq, { frame: mode() === "over" ? 0 : frame() });
      const protLine = frame() ? `<p class="small">Amino acids read in this frame: <strong>${M().codons(seq, frame()).map((c) => aaLabel(M().aa(c))).join("–")}</strong>. <span class="badge rose">no start codon</span> This frame would not be translated.</p>` : `<p class="small">Polypeptide (to the first stop codon): <strong>${prot.join("–") || "none"}</strong></p>`;
      $("#ce-out", host).innerHTML = mode() === "over" ? overSvg(t) + `<p class="small">${seq.length} bases give ${t.length} overlapping triplets, against ${Math.floor(seq.length / 3)} codons in the real, non-overlapping code.${lastChange ? " Triplets containing the changed base are outlined." : ""}</p>` : `<div style="overflow-x:auto"><table class="tbl" style="width:auto"><thead><tr><th>Codon</th><th>Position</th><th>Bases</th><th>Amino acid</th></tr></thead><tbody>${rows}</tbody></table></div>${protLine}`;
      $("#ce-table", host).innerHTML = A().codeTableHTML({ highlight: t.map((x) => x.c) });
      // explanation
      let msg = "";
      if (lastChange) { const { i, from, to } = lastChange; const affectedNon = M().codons(seq, frame()).filter((c, k) => { const s = frame() + 3 * k; return i >= s && i < s + 3; }).length; const affectedOver = M().overlapping(seq).filter((c, s) => i >= s && i < s + 3).length;
        const orig = ORIGINAL[i], what = to === orig ? `Base ${i + 1} is back to its original base, ${orig}.` : `Base ${i + 1} changed from ${orig} (original) to ${to}.`;
        if (mode() === "over") msg = `${what} In this hypothetical overlapping code it is part of <strong>${affectedOver}</strong> triplet${affectedOver === 1 ? "" : "s"}, so up to ${affectedOver} amino acids could change. In the real, non-overlapping code it is part of only one codon.`;
        else { const k = Math.floor((i - frame()) / 3); const c = M().codons(seq, frame())[k], c0 = M().codons(ORIGINAL, frame())[k]; if (i < frame() || !c) msg = `Base ${i + 1} changed, but it is outside the codons being read in this frame.`; else { const a = M().aa(c), a0 = M().aa(c0); msg = `${what.replace(/\.$/, "")}: only codon ${k + 1} is affected (${affectedNon} codon), because the code is <strong>non-overlapping</strong>. ` + (c === c0 ? "The codon is back to its original sequence." : a === a0 ? `${c0} → ${c}: both code for ${a}, so the amino acid is <strong>unchanged</strong>. The code is <strong>degenerate</strong>.` : a === "STOP" ? `${c0} → ${c}: ${c} is a <strong>stop codon</strong>, so the polypeptide would end early.` : a0 === "STOP" ? `${c0} → ${c}: the stop codon has become a codon for ${a}, so translation would continue past the original end.` : `${c0} → ${c}: the amino acid changes from ${a0} to ${a}. This one change could alter how the protein folds (3.1.8.3).`); } } }
      else if (mode() === "over") msg = "A hypothetical overlapping code: each triplet starts one base after the last, so most bases belong to three triplets. Change a base to see how many triplets it would affect.";
      else if (frame()) msg = `Reading from base ${frame() + 1} instead of base 1: every codon is different, so the amino-acid sequence is completely different. This is why the code must be read from a fixed starting point (the start codon).`;
      else msg = "Read from the start codon, in non-overlapping triplets. Try: change the third base of codon 3 (GGA), the third base of codon 4 (UGG), or the first base of codon 2.";
      $("#ce-msg", host).innerHTML = msg;
    };
    $("#ce-bases", host).addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (!b) return; const i = +b.dataset.i, order = "AUGC", from = seq[i], to = order[(order.indexOf(from) + 1) % 4]; seq = seq.slice(0, i) + to + seq.slice(i + 1); lastChange = { i, from, to }; draw(); const nb = $(`#ce-bases button[data-i="${i}"]`, host); if (nb) nb.focus(); });
    $("#ce-mode", host).addEventListener("change", () => { lastChange = null; draw(); });
    $("#ce-frame", host).addEventListener("change", () => { lastChange = null; if (mode() === "over") $("#ce-mode", host).value = "non"; draw(); });
    $("#ce-reset", host).addEventListener("click", () => { seq = ORIGINAL; lastChange = null; $("#ce-frame", host).value = "0"; draw(); });
    draw(); questions(host, "#ce-q", spec.questions);
  };

  // ======================= 2. Transcription Stepper (3.1.8.2) =======================
  B.interactives.psTranscription = function (spec, host) {
    const GENES = { pro: { coding: "ATGTTCGGACATTGGTAA", introns: [] }, euk: { coding: "ATGTTCGGTACCAGGACATTGGTAA", introns: [[7, 14]] } };
    let type = "pro", step = 0, timer = null, predict = false, score = { right: 0, tries: 0 }, awaiting = false, kNow = 0;
    host.innerHTML = head(spec, "schematic") + `
      <div class="row"><label class="small">Gene: <select id="tx-type"><option value="pro">prokaryotic gene (no introns)</option><option value="euk">eukaryotic gene with one intron</option></select></label>
      <label class="small"><input type="checkbox" id="tx-pred"> predict the mRNA bases</label></div>
      <div id="tx-svg" class="mt ix-hscroll"></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>
      <div id="tx-pad" class="row" hidden><span class="small">Which RNA nucleotide pairs with the next template base?</span>${["A", "U", "G", "C", "T"].map((b) => `<button class="btn sm" data-b="${b}" style="${mono()};font-weight:700;min-width:2.4em">${b}</button>`).join("")}</div>
      <div id="tx-msg" class="notice mt" aria-live="polite"></div>
      <div class="row mt"><button class="btn sm" id="tx-prev">◀ Back</button><button class="btn sm primary" id="tx-next">Next step ▶</button><button class="btn sm" id="tx-play">Play</button><button class="btn sm" id="tx-reset">Reset</button><span class="small muted" id="tx-count"></span></div>
      <div id="tx-text" class="small mt"></div>
      <div id="tx-q"></div>
      <p class="tiny muted mt">This is a simplified model: real introns are much longer, and in cells the mRNA separates from the template just behind RNA polymerase.</p>`;
    const g = () => GENES[type], n = () => g().coding.length, mr = () => M().codingToMrna(g().coding), tp = () => M().dnaComplement(g().coding);
    // Release review 2026-11-15: one codon (three nucleotides) per step instead of one nucleotide, so the prokaryotic gene
    // takes 10 steps instead of 21. States: the gene, unwinding, one state per codon joined, released, (spliced).
    const states = () => { const N = n(), L = [{ ph: "intact" }, { ph: "open", k: 0 }]; for (let k = 3; k < N + 3; k += 3) L.push({ ph: "run", k: Math.min(k, N) }); L.push({ ph: "done" }); if (type === "euk") L.push({ ph: "splice" }); return L; };
    const total = () => states().length;
    const prevK = (i) => { const st = states()[i - 1]; return st && st.ph === "run" ? st.k : 0; };
    const spliceSvg = () => { const c = g().coding, [[a, b]] = g().introns, pre = M().codingToMrna(c), mature = pre.slice(0, a) + pre.slice(b); const w = 22, gp = 2, x0 = 130; let s = `<svg viewBox="0 0 760 230" width="760" style="max-width:100%;height:auto" role="img" aria-label="pre-mRNA with the intron highlighted, and the mRNA after splicing with the intron removed and the exons joined">`; const T = A().T; s += T(x0 - 10, 46, "pre-mRNA", { a: "end", s: 12, w: 700, c: "#8e3a6b" }); [...pre].forEach((bb, i) => { s += A().box(x0 + i * (w + gp), 30, bb, { w, h: 22, fs: 11, op: i >= a && i < b ? 0.45 : 1, dash: i >= a && i < b }); }); s += `<rect x="${x0 + a * (w + gp) - 3}" y="25" width="${(b - a) * (w + gp) + 2}" height="32" rx="5" fill="none" stroke="#6b7d8f" stroke-dasharray="4 3"/>` + T(x0 + (a + (b - a) / 2) * (w + gp), 72, "intron removed", { s: 10.5, c: "#6b7d8f", w: 700 }) + T(x0 + a * (w + gp) / 2, 20, "exon 1", { s: 10.5, c: "#1f8a8a", w: 700 }) + T(x0 + b * (w + gp) + (pre.length - b) * (w + gp) / 2, 20, "exon 2", { s: 10.5, c: "#1f8a8a", w: 700 });
      s += `<path d="M380 82 v24" stroke="#6b7d8f" stroke-width="1.6"/><path d="M374 100 l6 8 l6 -8" fill="#6b7d8f"/>` + T(392, 98, "splicing: exons joined", { a: "start", s: 10.5, c: "#6b7d8f" });
      s += T(x0 - 10, 136, "mRNA", { a: "end", s: 12, w: 700, c: "#8e3a6b" }); [...mature].forEach((bb, i) => { s += A().box(x0 + i * (w + gp), 120, bb, { w, h: 22, fs: 11 }); }); M().codons(mature).forEach((cd, k) => { const xa = x0 + 3 * k * (w + gp), xb = xa + 3 * (w + gp) - gp; s += `<path d="M${xa} 148 v5 H${xb} v-5" fill="none" stroke="#1e3a5f" stroke-width="1.4"/>` + T((xa + xb) / 2, 170, aaLabel(M().aa(cd)), { s: 11, w: 700, c: M().aa(cd) === "STOP" ? "#b4504f" : "#16263a" }); });
      s += T(380, 204, `pre-mRNA ${pre.length} nucleotides − intron ${b - a} = mRNA ${mature.length} nucleotides = ${mature.length / 3} codons → ${M().translate(mature).join("–")}, then stop`, { s: 11 }) + T(380, 222, "The intron stays in the DNA of the gene: only the pre-mRNA copy is spliced.", { s: 10, c: "#6b7d8f" }); return s + "</svg>"; };
    const render = () => {
      const N = n(), euk = type === "euk", st = states()[step]; let svg, msg;
      awaiting = predict && st.ph === "run" && kNow < st.k;
      if (st.ph === "intact") { svg = A().transcriptionScene({ coding: g().coding, phase: "intact", introns: g().introns, euk }); msg = `<strong>The gene.</strong> Two DNA strands held together by hydrogen bonds between complementary base pairs.${euk ? " This eukaryotic gene contains an intron (dashed box), a non-coding sequence within the gene." : " Prokaryotic genes do not normally contain introns."}`; }
      else if (st.ph === "open") { svg = A().transcriptionScene({ coding: g().coding, phase: "open", introns: g().introns, euk, k: 0 }); msg = `<strong>Unwinding.</strong> The hydrogen bonds between the bases break in the region of the gene (RNA polymerase itself unwinds the DNA it copies), so the bases are exposed. Only the <strong>template strand</strong> (lower) will be copied.`; }
      else if (st.ph === "run") { const k0 = prevK(step), kk = awaiting ? kNow : st.k; svg = A().transcriptionScene({ coding: g().coding, phase: "run", introns: g().introns, euk, k: kk, predict: awaiting });
        const idx = Array.from({ length: st.k - k0 }, (_, q) => k0 + q); const pairs = idx.map((i) => `${chip(tp()[i])} with ${chip(mr()[i])}`).join(", ");
        msg = awaiting ? `<strong>Predict.</strong> The next exposed template base is ${chip(tp()[kNow])}. Which RNA nucleotide pairs with it? Choose a base (or type A, U, G, C). <span class="small muted">(${kNow - k0 + 1} of ${st.k - k0} in this step)</span>` : `<strong>Nucleotides ${k0 + 1} to ${st.k} of ${N}.</strong> Template bases pair with free RNA nucleotides: ${pairs}${idx.some((i) => tp()[i] === "A") ? " (A pairs with U: RNA has uracil, not thymine)" : ""}. <strong>RNA polymerase</strong> joins each one to the growing strand by a phosphodiester bond (a condensation reaction) and moves on.${st.k === N ? " The whole gene has now been copied." : ""}`; }
      else if (st.ph === "done") { svg = A().transcriptionScene({ coding: g().coding, phase: "done", introns: g().introns, euk }); msg = euk ? `<strong>Pre-mRNA released.</strong> RNA polymerase reaches the end of the gene and detaches. The <strong>pre-mRNA</strong> is a copy of the whole gene, so it includes the intron. The DNA strands pair up again.` : `<strong>mRNA released.</strong> RNA polymerase reaches the end of the gene and detaches. In a prokaryote this RNA <strong>is</strong> the mRNA: there is no splicing, and ribosomes can start translating it at once.`; }
      else { svg = spliceSvg(); msg = `<strong>Splicing.</strong> In the nucleus the intron is cut out of the <strong>pre-mRNA</strong> and the two exons are joined, forming mRNA. The mRNA leaves through a nuclear pore to be translated. (Here the mature mRNA happens to be identical to the prokaryotic mRNA, so the two give the same polypeptide.)`; }
      $("#tx-svg", host).innerHTML = svg; follow($("#tx-svg", host), "[data-part=rna-polymerase]"); $("#tx-pad", host).hidden = !awaiting; $("#tx-msg", host).innerHTML = msg;
      $("#tx-prev", host).disabled = step === 0; $("#tx-next", host).disabled = step >= total() - 1 || awaiting; $("#tx-count", host).textContent = `step ${step + 1} of ${total()}` + (predict && score.tries ? ` · predictions right first time: ${score.right} / ${score.tries}` : "");
      const made = st.ph === "run" ? mr().slice(0, awaiting ? kNow : st.k) : st.ph === "done" || st.ph === "splice" ? mr() : ""; $("#tx-text", host).innerHTML = made ? `${euk ? "Pre-mRNA" : "mRNA"}${st.ph === "run" ? " so far" : ""} (5′ → 3′): <span style="${mono()}">${made}</span>` + (st.ph === "splice" ? ` → after splicing: <span style="${mono()}">${(() => { const [[a, b]] = g().introns; return mr().slice(0, a) + mr().slice(b); })()}</span>` : "") : "";
    };
    const goTo = (i) => { step = Math.max(0, Math.min(total() - 1, i)); kNow = prevK(step); firstTry = true; render(); };
    let firstTry = true;
    const answer = (b) => { if (!awaiting) return; const want = mr()[kNow], tb = tp()[kNow]; if (b === want) { if (firstTry) score.right++; score.tries++; firstTry = true; kNow++; render(); $("#tx-msg", host).innerHTML = `Correct: template ${chip(tb)} pairs with ${chip(want)}. RNA polymerase joins it on. ` + $("#tx-msg", host).innerHTML; } else { firstTry = false; $("#tx-msg", host).innerHTML = (b === "T" ? `Not T: RNA nucleotides contain <strong>uracil</strong>, never thymine.` : `Not ${b}: the template base is ${chip(tb)}. Pairs are A–U, T–A, C–G and G–C.`) + " Try again."; } };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } $("#tx-play", host).textContent = "Play"; };
    $("#tx-pad", host).addEventListener("click", (e) => { const b = e.target.closest("button[data-b]"); if (b) answer(b.dataset.b); });
    host.addEventListener("keydown", (e) => { if (!awaiting || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return; const k = e.key.toUpperCase(); if ("AUGCT".includes(k) && k.length === 1) { e.preventDefault(); answer(k); } });
    $("#tx-next", host).addEventListener("click", () => { if (step < total() - 1) goTo(step + 1); });
    $("#tx-prev", host).addEventListener("click", () => { stop(); if (step > 0) { goTo(step - 1); kNow = states()[step].k || 0; render(); } });
    $("#tx-reset", host).addEventListener("click", () => { stop(); score = { right: 0, tries: 0 }; goTo(0); });
    $("#tx-type", host).addEventListener("change", () => { stop(); type = $("#tx-type", host).value; goTo(0); });
    $("#tx-pred", host).addEventListener("change", () => { stop(); predict = $("#tx-pred", host).checked; $("#tx-play", host).disabled = predict; kNow = prevK(step); render(); });
    $("#tx-play", host).addEventListener("click", () => { if (timer) { stop(); return; } if (step >= total() - 1) goTo(0); $("#tx-play", host).textContent = "Pause"; timer = setInterval(() => { if (!alive(host)) { clearInterval(timer); return; } if (step >= total() - 1) { stop(); return; } goTo(step + 1); }, reduced() ? 2400 : 1500); });
    render(); questions(host, "#tx-q", spec.questions);
  };

  // ======================= 3. Translation Animation (3.1.8.2) =======================
  B.interactives.psTranslation = function (spec, host) {
    const SEQS = { a: ["AUG", "UUC", "GGA", "CAU", "UGG", "UAA"], b: ["AUG", "GCA", "AAA", "UGC", "GAG", "UGA"], c: ["AUG", "CCU", "GGU", "AUC", "UAG"] };
    let key = "a", f = 0, timer = null, frames = [];
    // Release review 2026-11-15: the drawing runs the full width at the top with the step buttons directly under it, then
    // the step text; the codon list and the energy panel follow. Model (developer note): the AS model of two tRNAs at a
    // time; real ribosomes have a third (exit) site and real mRNAs have untranslated sequences before the start codon.
    host.innerHTML = head(spec, "schematic") + `
      <div class="row"><label class="small">mRNA: <select id="tl-seq">${Object.entries(SEQS).map(([k, cs]) => `<option value="${k}">${cs.join(" ")}</option>`).join("")}</select></label></div>
      <div id="tl-svg" class="mt ix-hscroll"></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>
      <div class="row mt"><button class="btn sm" id="tl-prev">◀ Back</button><button class="btn sm primary" id="tl-next">Next step ▶</button><button class="btn sm" id="tl-play">Play</button><button class="btn sm" id="tl-reset">Reset</button><span class="small muted" id="tl-count"></span></div>
      <div id="tl-msg" class="notice mt" aria-live="polite"></div>
      <p class="small" id="tl-chain"></p>
      <div class="grid grid-2 mt" style="align-items:start"><div id="tl-code"></div><div class="card" id="tl-atp"></div></div>
      <div id="tl-q"></div>
      <p class="tiny muted mt">This is a simplified model of translation.</p>`;
    const build = (cs) => { const F = [], aa = cs.map((c) => M().aa(c)); let chain = [aa[0]];
      F.push({ p: 0, trnas: [], msg: `<strong>mRNA</strong> (from transcription) attaches to a <strong>ribosome</strong>, which is made of two subunits, at the start codon. No tRNA has bound yet. In a eukaryote, the mRNA has left the nucleus through a nuclear pore.`, atp: [] });
      F.push({ p: 0, trnas: [{ i: 0, aas: [aa[0]], arriving: true }], msg: `The ribosome is at the <strong>start codon</strong> ${cs[0]}. A tRNA with the complementary <strong>anticodon</strong> ${M().anticodon(cs[0])} binds to it by hydrogen bonds between the paired bases, bringing its specific amino acid, ${aa[0]}.`, atp: ["attach"] });
      for (let i = 1; i < cs.length; i++) {
        if (aa[i] === "STOP") { F.push({ p: i - 1, trnas: [{ i: i - 1, aas: chain.slice() }], msg: `The next codon, ${cs[i]}, is a <strong>stop codon</strong>. No tRNA has a complementary anticodon, so no amino acid is added.`, atp: [] }); F.push({ p: null, trnas: [], released: chain.slice(), msg: `The <strong>polypeptide is released</strong> (${chain.join("–")}) and the ribosome separates from the mRNA. The polypeptide now folds into its 3D shape (3.1.8.3).`, atp: [] }); break; }
        F.push({ p: i - 1, trnas: [{ i: i - 1, aas: chain.slice() }, { i, aas: [aa[i]], arriving: true }], msg: `A tRNA with anticodon <strong>${M().anticodon(cs[i])}</strong>, complementary to codon ${cs[i]}, binds next to the first, carrying <strong>${aa[i]}</strong>. The ribosome now holds <strong>two tRNAs</strong>.`, atp: ["attach"] });
        const prev = chain[chain.length - 1]; chain = chain.concat(aa[i]);
        F.push({ p: i - 1, trnas: [{ i: i - 1, aas: [] }, { i, aas: chain.slice() }], bond: true, msg: `A <strong>peptide bond</strong> forms between ${prev} and ${aa[i]} in a <strong>condensation</strong> reaction (water is released), catalysed by the ribosome. No ATP is broken down at this step: the energy comes from the bond between the amino acid and its tRNA, which was made earlier using ATP. The chain is now held by the second tRNA.`, atp: [] });
        F.push({ p: i, trnas: [{ i: i - 1, aas: [], leaving: true }, { i, aas: chain.slice() }], msg: `The ribosome <strong>moves along the mRNA by one codon</strong> (supporting: this step needs energy, from GTP). The first tRNA, now without an amino acid, is released; it can pick up another ${aa[i - 1]}, using energy from ATP.`, atp: ["move", "attach"] });
      }
      return F; };
    const atpPanel = (fr) => { const on = (k) => fr.atp && fr.atp.includes(k); const item = (k, t) => `<li style="${on(k) ? "font-weight:700;color:var(--amber-ink)" : "color:var(--ink-3)"}">${on(k) ? "● " : "○ "}${t}</li>`; return `<h4 style="margin:0">Where energy is used</h4><ul class="small" style="list-style:none;padding-left:0">${item("attach", "ATP: attaching each amino acid to its tRNA (this energy is later used to form the peptide bond)")}${item("move", "supporting: moving the ribosome one codon (energy from GTP, not ATP)")}</ul><details class="small"><summary>Why does the peptide bond step have no marker?</summary><p class="small">The ribosome forms the peptide bond using energy already stored in the bond between the amino acid and its tRNA, which was made using ATP. Codon–anticodon pairing and the release of the polypeptide need no marker either.</p></details>`; };
    const render = () => { const fr = frames[f], cs = SEQS[key]; $("#tl-svg", host).innerHTML = A().translationScene({ codons: cs, p: fr.p, trnas: fr.trnas, bond: fr.bond, released: fr.released || null, anim: !reduced(), crop: true }); const sv = $("#tl-svg svg", host); if (sv) { sv.style.width = "100%"; sv.style.maxHeight = "min(48vh, 400px)"; } follow($("#tl-svg", host), "[data-part=ribosome]");
      $("#tl-msg", host).innerHTML = fr.msg; $("#tl-atp", host).innerHTML = atpPanel(fr); $("#tl-count", host).textContent = `step ${f + 1} of ${frames.length}`; $("#tl-prev", host).disabled = f === 0; $("#tl-next", host).disabled = f === frames.length - 1;
      const chainNow = fr.released || (fr.trnas.filter((t) => !t.leaving).map((t) => t.aas || []).sort((a, b) => b.length - a.length)[0] || []);
      $("#tl-chain", host).innerHTML = `Polypeptide ${fr.released ? "released" : "so far"}: <strong>${chainNow.length ? chainNow.join("–") : "none yet"}</strong>`; };
    const code = () => { $("#tl-code", host).innerHTML = `<p class="small" style="margin:0">Codons used, from the table provided:</p>` + A().codonList(SEQS[key]); };
    const reset = () => { stop(); frames = build(SEQS[key]); f = 0; code(); render(); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } $("#tl-play", host).textContent = "Play"; };
    $("#tl-next", host).addEventListener("click", () => { if (f < frames.length - 1) { f++; render(); } });
    $("#tl-prev", host).addEventListener("click", () => { stop(); if (f > 0) { f--; render(); } });
    $("#tl-reset", host).addEventListener("click", reset);
    $("#tl-seq", host).addEventListener("change", () => { key = $("#tl-seq", host).value; reset(); });
    $("#tl-play", host).addEventListener("click", () => { if (timer) { stop(); return; } if (f >= frames.length - 1) f = 0; render(); $("#tl-play", host).textContent = "Pause"; timer = setInterval(() => { if (!alive(host)) { clearInterval(timer); return; } if (f >= frames.length - 1) { stop(); return; } f++; render(); }, reduced() ? 2600 : 1600); });
    reset(); questions(host, "#tl-q", spec.questions);
  };

  // ======================= 4. Codon Decoder Challenge (3.1.8.3) =======================
  B.interactives.psDecoder = function (spec, host) {
    const r = M().rng(spec.seed || (Date.now() >>> 0)); let round = null, tally = { right: 0, total: 0, rounds: 0 };
    const KINDS = { mrna: "mRNA", template: "DNA template strand", coding: "DNA coding strand", anticodon: "tRNA anticodons (in the order used)" };
    host.innerHTML = head(spec, "code table provided") + `
      <div class="grid grid-2"><div id="dc-table"></div><div>
        <div class="row"><label class="small">Challenge type: <select id="dc-kind"><option value="mix">mixed</option>${Object.entries(KINDS).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></label><button class="btn sm primary" id="dc-new">New sequence</button></div>
        <div id="dc-task" class="card mt"></div>
        <div id="dc-fb" class="mt" aria-live="polite"></div>
        <p class="small muted" id="dc-tally"></p></div></div>
      <div id="dc-q"></div>
      <p class="tiny muted mt">The template strand and the anticodons are written base for base under the codons they pair with. This practice score is not recorded.</p>`;
    const opts = `<option value="">choose…</option>${M().aminoAcids.map((a) => `<option value="${a}">${a} (${M().AANAME[a]})</option>`).join("")}<option value="STOP">stop (no amino acid)</option>`;
    const sense = Object.keys(M().CODE).filter((c) => M().CODE[c] !== "*"), stops = ["UAA", "UAG", "UGA"];
    const newRound = () => { const pick = $("#dc-kind", host).value; const kinds = Object.keys(KINDS); const kind = pick === "mix" ? kinds[Math.floor(r() * kinds.length)] : pick; const n = 4; const cs = []; for (let i = 0; i < n; i++) cs.push(sense[Math.floor(r() * sense.length)]); if (kind !== "anticodon" && r() < 0.35) cs[n - 1] = stops[Math.floor(r() * 3)];
      const m = cs.join(""); const given = kind === "mrna" ? cs : kind === "template" ? cs.map((c) => M().mrnaToTemplate(c)) : kind === "coding" ? cs.map((c) => M().mrnaToCoding(c)) : cs.map((c) => M().anticodon(c));
      round = { kind, cs, given, m };
      const show = given.map((t) => [...t].map((b) => chip(b)).join("")).join('<span style="display:inline-block;width:.7em"></span>');
      $("#dc-task", host).innerHTML = `<p class="small" style="margin-top:0"><strong>Given: ${KINDS[kind]}</strong> ${kind === "template" ? "(written 3′ → 5′, so each base sits opposite the mRNA base it pairs with)" : kind === "anticodon" ? "(each written base-for-base under the codon it pairs with, i.e. 3′ → 5′)" : "(5′ → 3′)"}</p><p>${show}</p>
        ${kind !== "mrna" ? `<label class="small">${kind === "anticodon" ? "Codons on the mRNA" : "mRNA"} (optional; spaces allowed): <input id="dc-m" autocomplete="off" style="${mono()};width:100%;max-width:280px" aria-label="${kind === "anticodon" ? "codons" : "mRNA sequence"}"></label>` : ""}
        <div class="match-grid mt">${cs.map((c, i) => `<div>${kind === "anticodon" ? "tRNA" : "Codon"} ${i + 1}</div><select data-i="${i}" aria-label="amino acid ${i + 1}">${opts}</select>`).join("")}</div>
        <div class="row mt"><button class="btn sm primary" id="dc-check">Check</button></div>`;
      $("#dc-fb", host).innerHTML = ""; $("#dc-table", host).innerHTML = A().codeTableHTML();
      $("#dc-check", host).addEventListener("click", check); };
    const check = () => { const sels = $$("#dc-task select", host); if (sels.some((s) => !s.value)) { B.util.toast("Choose an amino acid (or stop) for every codon."); return; } let right = 0; const rows = round.cs.map((c, i) => { const want = M().aa(c), got = sels[i].value, ok = got === want; if (ok) right++; sels[i].style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)"; return `<tr><td style="${mono()}">${round.given[i]}</td><td style="${mono()}">${c}</td><td>${aaLabel(want)}</td><td>${ok ? "✓" : "✗ you chose " + aaLabel(got)}</td></tr>`; });
      let mNote = ""; const mi = $("#dc-m", host); if (mi && mi.value.trim()) { const typed = mi.value.toUpperCase().replace(/[^ACGTU]/g, ""); mNote = typed === round.m ? `<p class="small" style="color:var(--sage-ink)">Your mRNA is correct.</p>` : `<p class="small" style="color:var(--rose-ink)">Your mRNA (${esc(typed)}) differs from the correct mRNA, ${round.m}.${/T/.test(typed) ? " RNA has U, not T." : ""}</p>`; }
      const how = { mrna: "Read each codon straight from the table.", template: "Pair each template base to get the mRNA (A→U, T→A, C→G, G→C), then look up the codons. Looking up the template directly is the commonest error.", coding: "The mRNA is the coding strand with U in place of T; then look up the codons.", anticodon: "Each codon is complementary to its anticodon (A↔U, C↔G); then look up the codon, not the anticodon." }[round.kind];
      const stopNote = round.cs.some((c) => M().aa(c) === "STOP") ? " A stop codon codes for no amino acid: the polypeptide ends before it." : "";
      tally.right += right; tally.total += round.cs.length; tally.rounds++;
      $("#dc-fb", host).innerHTML = `<div class="feedback ${right === round.cs.length ? "ok" : right ? "neutral" : "bad"}"><strong>${right} / ${round.cs.length}.</strong> ${how}${stopNote}<div style="overflow-x:auto"><table class="tbl mt" style="width:auto"><thead><tr><th>Given</th><th>Codon</th><th>Amino acid</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table></div>${mNote}</div>`;
      $("#dc-tally", host).textContent = `This session: ${tally.right} / ${tally.total} codons decoded correctly over ${tally.rounds} sequence${tally.rounds === 1 ? "" : "s"}.`;
      $("#dc-table", host).innerHTML = A().codeTableHTML({ highlight: round.cs }); $("#dc-check", host).disabled = true; sels.forEach((s) => (s.disabled = true)); };
    $("#dc-new", host).addEventListener("click", newRound); $("#dc-kind", host).addEventListener("change", newRound);
    newRound(); questions(host, "#dc-q", spec.questions);
  };
})(window.BIO);
