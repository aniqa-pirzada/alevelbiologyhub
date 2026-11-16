// Interactives for 3.2.10.3 Binary fission (Phase 4 Batch 4, owned by the 3.2.10.3 author).
// Kinds: fisSimulator (Binary Fission Simulator) and fisConjugation (Conjugation Explorer). The former sorting activity
// (fisCompare) became ordinary page questions in the 2026-11-15 release review. Drawings come from B.fissionArt and numbers from B.fissionModel (data/content/_fission-art.js), so
// what is drawn and what is counted always agree. Questions are rendered with B.questions.render, so they are marked,
// recorded and count towards mastery. Every control is a native button, select or checkbox; the step views also respond
// to the left and right arrow keys. Play steps automatically only when chosen; fades are skipped when reduced motion is
// requested (and Play then moves more slowly, one still step at a time).
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store.get().prefs || {}).reducedMotion);
  const head = (spec, badge = "model") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const A = () => B.fissionArt, M = () => B.fissionModel;
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .35s"; node.style.opacity = "1"; }); };
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const sup = '<span class="badge">supporting</span>', req = '<span class="badge teal">required</span>';
  // a stepper with Back / Next / Play / Restart and arrow keys on the view
  const stepper = (host, ids, n, draw) => { let step = 0, timer = null; const pos = $(ids.pos, host);
    const go = (d) => { step = Math.max(0, Math.min(n() - 1, step + d)); render(); };
    const render = () => { draw(step); pos.textContent = `Step ${step + 1} of ${n()}`; $(ids.back, host).disabled = step === 0; $(ids.next, host).disabled = step === n() - 1; };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; $(ids.play, host).textContent = "Play all steps"; } };
    $(ids.back, host).addEventListener("click", () => { stop(); go(-1); });
    $(ids.next, host).addEventListener("click", () => { stop(); go(1); });
    $(ids.restart, host).addEventListener("click", () => { stop(); step = 0; render(); });
    $(ids.play, host).addEventListener("click", () => { if (timer) { stop(); return; } if (step === n() - 1) step = -1; go(1); $(ids.play, host).textContent = "Pause";
      timer = setInterval(() => { if (!document.body.contains(host) || step >= n() - 1) { stop(); return; } go(1); }, reduced() ? 3200 : 1900); });
    $(ids.view, host).addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(-1); } });
    return { render, set: (s) => { step = s; render(); }, get: () => step, stop }; };

  // ================= 1. Binary Fission Simulator =================
  const STEPS = [
    ["The parent cell", "One circular DNA molecule (the bacterial chromosome) and some plasmids, all free in the cytoplasm. There is no nucleus."],
    ["The circular DNA and the plasmids replicate", "The circular DNA is copied once, giving two identical molecules. The plasmids are copied too."],
    ["The cell grows longer", "More cytoplasm, ribosomes and membrane are made as the cell grows, and the two copies of the circular DNA move apart, towards opposite ends."],
    ["The cytoplasm begins to divide", "The cell-surface membrane and the cell wall grow inwards across the middle of the cell. The plasmids end up on one side or the other."],
    ["Two daughter cells", "The cytoplasm has divided. Each daughter cell has ONE copy of the circular DNA. The plasmids were shared at random, so the two daughter cells may have different numbers."],
  ];
  B.interactives.fisSimulator = function (spec, host) {
    const u = uidOf();
    // Model (kept here, not shown to students): every plasmid is copied exactly once before division; each copy then goes
    // to either daughter cell with an equal chance, independently of the others. "Share the plasmids again" re-draws that
    // chance sharing. The circular DNA is copied once and each daughter receives one copy.
    host.innerHTML = head(spec, "simplified model") + `
      <div class="ix"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view" id="fs-view-${u}" tabindex="0" role="group" aria-label="binary fission drawing; use the left and right arrow keys to change step"></div></div><p class="ix-readout" id="fs-counts-${u}" aria-live="polite"></p></div><div class="ix-panel">
      <div class="row"><button class="btn sm" id="fs-back-${u}" aria-label="previous step">← Back</button><button class="btn sm primary" id="fs-next-${u}" aria-label="next step">Next →</button><button class="btn sm" id="fs-play-${u}">Play all steps</button><button class="btn sm" id="fs-restart-${u}">Restart</button></div>
      <p class="small muted" id="fs-pos-${u}" aria-live="polite" style="margin:0"></p>
      <div class="card" id="fs-text-${u}" aria-live="polite"></div>
      <label class="small">Plasmids in the parent cell: <select id="fs-p-${u}">${[1, 2, 3, 4, 5, 6].map((k) => `<option value="${k}"${k === 3 ? " selected" : ""}>${k}</option>`).join("")}</select></label>
      <div class="row"><button class="btn sm" id="fs-new-${u}">Share the plasmids again</button><label class="small"><input type="checkbox" id="fs-lab-${u}" checked> show labels</label></div></div></div></div>
      <p class="tiny muted mt">This is a simplified model. Real bacteria may have many more plasmids, and the drawings are not to scale.</p>
      <h4 class="mt">Questions</h4><div id="fs-q-${u}"></div>`;
    const V = $(`#fs-view-${u}`, host), C = A().colours; let a = 0, b = 0;
    const p0 = () => +$(`#fs-p-${u}`, host).value;
    const share = () => { const n = 2 * p0(); a = 0; for (let i = 0; i < n; i++) if (Math.random() < 0.5) a++; b = n - a; };
    // fixed plasmid spots inside a rod of width w, height h, centred: spread along the length
    const spots = (n, w, hh, seed, side = 0) => { const r = M().rng(seed); const out = []; const span = side ? w / 2 - hh * 0.6 : w - hh * 1.1; const x0 = side ? side * (w / 4) : 0;
      for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push([x0 + (t - 0.5) * span * 0.9 + (r() - 0.5) * 6, (i % 2 ? 1 : -1) * (hh * 0.26) + (r() - 0.5) * 6]); } return out; };
    const drawStep = (st) => { const p = p0(), rep = 2 * p;
      const W = 520, Hh = 236, cy = 112; let s = A().defs(); const lab = $(`#fs-lab-${u}`, host).checked;
      const R = A().rod;
      if (st === 0) { s += R(260, cy, 230, 86, { chroms: [[0, 0, 40, 22]], plas: spots(p, 230, 86, 5), seed: 91 }); }
      if (st === 1) { s += R(260, cy, 250, 86, { chroms: [[-12, -3, 38, 20], [12, 4, 38, 20, 2]], plas: spots(rep, 250, 86, 6), seed: 92 }); }
      if (st === 2) { s += R(260, cy, 330, 86, { chroms: [[-80, 0, 36, 20], [80, 0, 36, 20, 2]], plas: spots(rep, 330, 86, 7), seed: 93 }); }
      if (st === 3) { s += R(260, cy, 330, 86, { chroms: [[-82, 0, 34, 20], [82, 0, 34, 20, 2]], plas: [...spots(a, 330, 86, 8, -1), ...spots(b, 330, 86, 9, 1)], seed: 93, septum: 0.8 }); }
      if (st === 4) { s += R(176, cy, 160, 80, { chroms: [[0, 0, 30, 18]], plas: spots(a, 160, 80, 10), seed: 94 }) + R(344, cy, 160, 80, { chroms: [[0, 0, 30, 18, 1]], plas: spots(b, 160, 80, 11), seed: 95 });
        s += A().T(176, cy + 66, `${a} plasmid${a === 1 ? "" : "s"}`, { s: 16, w: 700, c: a === 0 ? C.AMBER : C.INK }) + A().T(344, cy + 66, `${b} plasmid${b === 1 ? "" : "s"}`, { s: 16, w: 700, c: b === 0 ? C.AMBER : C.INK }); }
      if (lab && st === 0) { const T = A().T, L = A().L; const g = C.GREY;
        s += L(150, 92, 96, 36, { c: g }) + T(92, 30, "cell wall", { s: 15, a: "end" });
        s += L(160, 142, 110, 192, { c: g }) + T(10, 208, "cell-surface membrane", { s: 15, a: "start" });
        s += L(262, 92, 262, 26, { c: g }) + T(262, 20, "circular DNA", { s: 15 });
        const pl = spots(p, 230, 86, 5)[p - 1]; s += L(260 + pl[0] + 4, cy + pl[1] - 4, 430, 40, { c: g }) + T(436, 36, "plasmid", { s: 15, a: "start" });
        s += `<circle cx="340" cy="140" r="2.6" fill="${C.RIBO}"/>` + L(342, 142, 430, 196, { c: g }) + T(436, 204, "ribosome", { s: 15, a: "start" });
        s += L(196, 120, 100, 92, { c: g }) + T(94, 96, "cytoplasm", { s: 15, a: "end" }); }
      if (lab && st === 3) s += A().T(260, 36, "membrane and wall growing inwards", { s: 15, c: C.GREY }) + A().L(260, 42, 260, 66, { c: C.GREY, m: "arg" });
      V.innerHTML = A().svg(W, Hh, `binary fission step ${st + 1}: ${STEPS[st][0]}`, s); fade(V.firstElementChild);
      $(`#fs-text-${u}`, host).innerHTML = `<h4>${st + 1}. ${STEPS[st][0]}</h4><p class="small">${STEPS[st][1]}</p>${st === 4 && (a === 0 || b === 0) ? `<p class="small"><strong>One daughter cell has no plasmids.</strong> It still has its circular DNA, so it can survive and divide, but it has lost the genes the plasmid carried.</p>` : ""}`;
      const cells = st === 4 ? 2 : 1, dna = st === 0 ? "1" : st === 4 ? "1 in each cell" : "2 (one for each future cell)", pl = st === 0 ? `${p}` : st === 4 ? `${a} and ${b} (${a} + ${b} = ${rep}, the number before division)` : `${rep}`;
      $(`#fs-counts-${u}`, host).innerHTML = `Cells: <strong>${cells}</strong> · Circular DNA molecules: <strong>${dna}</strong> · Plasmids: <strong>${pl}</strong>`; };
    const S = stepper(host, { back: `#fs-back-${u}`, next: `#fs-next-${u}`, play: `#fs-play-${u}`, restart: `#fs-restart-${u}`, pos: `#fs-pos-${u}`, view: `#fs-view-${u}` }, () => STEPS.length, drawStep);
    $(`#fs-p-${u}`, host).addEventListener("change", () => { share(); S.render(); });
    $(`#fs-lab-${u}`, host).addEventListener("change", () => S.render());
    $(`#fs-new-${u}`, host).addEventListener("click", () => { S.stop(); share(); S.set(4); });
    share(); S.render();
    (spec.questions || []).forEach((q) => $(`#fs-q-${u}`, host).append(B.questions.render(q)));
    host._fission = { share: () => [a, b] }; // for tests
  };

  // ================= 2. Conjugation Explorer =================
  const CJ = [
    [req, "Donor and recipient", "The donor bacterium contains a plasmid; the recipient does not. Here the plasmid carries a gene, shown in orange."],
    [req, "A pilus makes contact", "A thin pilus grows out from the donor and attaches to the surface of the recipient."],
    [req, "The cells are drawn together", "The pilus shortens, pulling the two cells into contact. A connection forms between them through which DNA can pass."],
    [sup, "A copy of the plasmid DNA passes across", "One strand of the plasmid DNA is cut and a single strand moves into the recipient. The donor keeps the other strand."],
    [sup, "Both cells complete a plasmid", "DNA polymerase makes the complementary strand in each cell (this goes on while the single strand is still crossing), so each ends up with a complete double-stranded copy of the plasmid."],
    [req, "The cells separate", "Both cells now have the plasmid and the gene it carries. The recipient can now act as a donor itself. There are still two cells: none has been made, so conjugation is not reproduction."],
  ];
  B.interactives.fisConjugation = function (spec, host) {
    const u = uidOf();
    host.innerHTML = head(spec, "schematic model") + `
      <div class="row"><label class="small">Recipient: <select id="cj-sp-${u}"><option value="same">the same species as the donor</option><option value="other">a different species</option></select></label>
        <label class="small"><input type="checkbox" id="cj-ab-${u}"> then add the antibiotic ${sup}</label></div>
      <div class="row mt"><button class="btn sm" id="cj-back-${u}" aria-label="previous step">← Back</button><button class="btn sm primary" id="cj-next-${u}" aria-label="next step">Next →</button><button class="btn sm" id="cj-play-${u}">Play all steps</button><button class="btn sm" id="cj-restart-${u}">Restart</button><span class="small muted" id="cj-pos-${u}" aria-live="polite"></span></div>
      <div class="figure mt"><div class="fig-view" id="cj-view-${u}" style="max-width:640px;margin:0 auto" tabindex="0" role="group" aria-label="conjugation drawing; use the left and right arrow keys to change step"></div></div>
      <div class="card mt" id="cj-text-${u}" aria-live="polite"></div>
      <p class="tiny muted mt">This is a simplified model, not to scale. The orange segment stands for any gene on the plasmid, for example a gene for resistance to an antibiotic.</p>
      <h4 class="mt">Questions</h4><div id="cj-q-${u}"></div>`;
    const V = $(`#cj-view-${u}`, host), C = A().colours;
    const draw = (st) => { const other = $(`#cj-sp-${u}`, host).value === "other", ab = $(`#cj-ab-${u}`, host).checked && st === 5; A().uid(); let s = A().defs(); const T = A().T;
      s += `<g transform="scale(2)">${A().conjScene(130, 50, st + 1, { other })}</g>`;
      s += T(130 * 2 - 120, 172, "donor", { s: 14, c: C.GREY }) + T(130 * 2 + 120, 172, other ? "recipient (another species)" : "recipient (same species)", { s: 14, c: C.GREY });
      if (ab) s += T(140, 26, "survives: has the gene", { s: 14, w: 700, c: C.TEAL }) + T(380, 26, "survives: has the gene", { s: 14, w: 700, c: C.TEAL });
      s += T(260, 198, st < 5 ? "Cells: 2" : "Cells: still 2. No new cell has been made.", { s: 14.5, w: 700, c: st < 5 ? C.INK : C.TEAL });
      V.innerHTML = A().svg(520, 210, `conjugation step ${st + 1}: ${CJ[st][1]}`, s); fade(V.firstElementChild);
      $(`#cj-text-${u}`, host).innerHTML = `<h4>${st + 1}. ${CJ[st][1]} ${CJ[st][0]}</h4><p class="small">${CJ[st][2]}</p>${st === 5 && other ? `<p class="small">The DNA has passed to <strong>another species</strong>: genes can spread between species this way.</p>` : ""}<p class="small"><strong>Still 2 cells: conjugation is not reproduction.</strong></p>${ab ? `<p class="small">${sup} Both cells now carry the resistance gene, so both can survive the antibiotic and go on to divide by binary fission. Without conjugation, the recipient would have been killed.</p>` : ""}`;
      };
    const S = stepper(host, { back: `#cj-back-${u}`, next: `#cj-next-${u}`, play: `#cj-play-${u}`, restart: `#cj-restart-${u}`, pos: `#cj-pos-${u}`, view: `#cj-view-${u}` }, () => CJ.length, draw);
    $(`#cj-sp-${u}`, host).addEventListener("change", () => S.render());
    $(`#cj-ab-${u}`, host).addEventListener("change", () => { if ($(`#cj-ab-${u}`, host).checked) S.set(5); else S.render(); });
    S.render();
    (spec.questions || []).forEach((q) => $(`#cj-q-${u}`, host).append(B.questions.render(q)));
  };

})(window.BIO);
