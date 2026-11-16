// Interactives for 3.1.10 Species and taxonomy (Batch 9, owned by the 3.1.10 author).
// Kinds: spcBuilder (Taxonomy Builder), spcExplorer (Classification Explorer) and spcMolecular (Molecular Evidence
// Investigator), all 3.1.10.2. (The former Species Concept Challenge on 3.1.10.1 was a bank of questions only; since the
// release review of 2026-11-15 its cases are ordinary page questions in data/content/3.1.10.1.js.)
// Classifications and the illustrative sequences come from the model in data/content/_species-art.js
// (B.speciesModel, B.speciesArt), so the tables, drawings and counts shown always agree with each other.
// Embedded questions are rendered with B.questions.render, so they are marked, recorded and count towards mastery.
// Every control is a native button, select or checkbox (keyboard accessible); tab lists also respond to the arrow,
// Home and End keys. Fades are skipped when reduced motion is requested. Questions attached to a model are moved by the
// page renderer (js/views/library.js) to Check yourself, so no question heading is drawn here.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc, shuffle } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store.get() || {}).prefs || {}).reducedMotion;
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const M = () => B.speciesModel, A = () => B.speciesArt;
  const allQs = (spec) => (spec.items || []).flatMap((it) => it.questions || []);
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .35s"; node.style.opacity = "1"; }); };
  const rid = () => Math.random().toString(36).slice(2, 7);
  const ILL = '<span class="badge rose">illustrative data</span>';

  // Accessible tab list + panes. labels: array of strings; build(i, pane) fills pane i. Returns { show, mark(i, text) }.
  function tabs(host, labels, build, aria) {
    const u = rid();
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="row mt" role="tablist" aria-label="${esc(aria)}">${labels.map((l, i) => `<button class="btn sm" role="tab" id="sp-tab-${u}-${i}" aria-controls="sp-pane-${u}-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}"><span class="lab">${esc(l)}</span><span class="done"></span></button>`).join("")}</div><div class="sp-panes mt"></div>`;
    host.append(wrap);
    const list = $('[role="tablist"]', wrap), body = $(".sp-panes", wrap);
    const panes = labels.map((l, i) => { const d = document.createElement("div"); d.id = `sp-pane-${u}-${i}`; d.setAttribute("role", "tabpanel"); d.setAttribute("aria-labelledby", `sp-tab-${u}-${i}`); d.hidden = i !== 0; body.append(d); build(i, d); return d; });
    const btns = $$('[role="tab"]', list); let cur = 0;
    const show = (i) => { cur = Math.max(0, Math.min(labels.length - 1, i)); panes.forEach((p, k) => (p.hidden = k !== cur)); btns.forEach((b, k) => { b.setAttribute("aria-selected", k === cur); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); fade(panes[cur]); };
    btns.forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    list.addEventListener("keydown", (e) => { const map = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in map) ni = cur + map[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni); btns[cur].focus(); });
    show(0);
    return { show, mark: (i, t) => { $(".done", btns[i]).textContent = t; }, panes };
  }

  // ---------- 1. Taxonomy Builder (3.1.10.2) ----------
  // Place the correct taxon at each of the eight ranks for an organism (the rank order itself is practised in the page
  // questions, so it is not repeated here).
  B.interactives.spcBuilder = function (spec, host) {
    const u = rid(); const RL = M().RANK_LABEL; const orgKeys = spec.organisms || ["human", "bee"];
    host.innerHTML = head(spec, "builder") + `
      <div class="row"><label class="small">Organism: <select id="tb-org-${u}">${orgKeys.map((k) => `<option value="${k}">${esc(M().ORGS[k].common)}</option>`).join("")}</select></label><span class="small" id="tb-prog-${u}" aria-live="polite"></span></div>
      <div id="tb-rows-${u}" class="mt"></div>
      <div class="row mt"><button class="btn sm primary" id="tb-checkB-${u}">Check taxa</button><button class="btn sm" id="tb-resetB-${u}">Clear choices</button></div>
      <div id="tb-fbB-${u}" class="mt" aria-live="polite"></div>
      <div id="tb-q-${u}"></div>`;
    const $u = (id) => $(`#${id}-${u}`, host);
    const done = new Set(); const opts = {};
    const optionsFor = (k) => { if (opts[k]) return opts[k]; const own = M().ORGS[k].taxa; const pool = [...new Set(Object.values(M().ORGS).flatMap((o) => o.taxa))].filter((t) => !own.includes(t)); return (opts[k] = shuffle([...own, ...shuffle(pool).slice(0, 4)])); };
    const prog = () => { $u("tb-prog").textContent = `Organisms completed: ${done.size} of ${orgKeys.length}.`; };
    const drawB = () => {
      const k = $u("tb-org").value; const o = optionsFor(k);
      $u("tb-rows").innerHTML = `<table class="tbl"><thead><tr><th>Rank</th><th>Taxon</th><th>Result</th></tr></thead><tbody>${RL.map((r, i) => `<tr><td>${r}</td><td><select data-r="${i}" aria-label="${r} of the ${esc(M().ORGS[k].common.toLowerCase())}"><option value="">choose…</option>${o.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("")}</select></td><td class="res small" data-res="${i}"></td></tr>`).join("")}</tbody></table>`;
      $u("tb-fbB").innerHTML = ""; prog();
    };
    $u("tb-org").addEventListener("change", drawB);
    $u("tb-resetB").addEventListener("click", drawB);
    $u("tb-checkB").addEventListener("click", () => {
      const k = $u("tb-org").value; const taxa = M().ORGS[k].taxa; const sels = $$(`#tb-rows-${u} select`, host);
      if (sels.some((x) => !x.value)) { $u("tb-fbB").innerHTML = `<div class="feedback neutral small">Choose a taxon for every rank first.</div>`; return; }
      let n = 0; sels.forEach((x) => { const i = +x.dataset.r; const ok = x.value === taxa[i]; if (ok) n++; x.style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)"; $(`[data-res="${i}"]`, $u("tb-rows")).textContent = ok ? "✓ correct" : "✗ try again"; });
      const nm = esc(M().ORGS[k].common.toLowerCase());
      if (n === 8) { done.add(k); $u("tb-fbB").innerHTML = `<div class="feedback ok small"><strong>All eight correct for the ${nm}.</strong> ${k === "bee" ? "The bee shares the kingdom Animalia with the lion but not the phylum: it is an arthropod, not a chordate." : "The human shares the class Mammalia with the lion but is in a different order (Primates)."}</div>`; }
      else $u("tb-fbB").innerHTML = `<div class="feedback bad small"><strong>${n} of 8 correct.</strong> Change the rows marked ✗ and check again. Hint: genus and species names are in Latin, and the species is the full binomial.</div>`;
      prog();
    });
    drawB();
    allQs(spec).forEach((q) => $u("tb-q").append(B.questions.render(q)));
  };

  // ---------- 2. Classification Explorer (3.1.10.2) ----------
  // One classification tree (seven organisms); the two chosen organisms' branches and their lowest shared taxon are
  // highlighted, with a short account of what sharing that taxon does and does not imply.
  B.interactives.spcExplorer = function (spec, host) {
    const u = rid(); const keys = spec.organisms || ["human", "chimp", "cat", "lion", "tiger", "sparrow", "palm"]; const RL = M().RANK_LABEL;
    const sel = (id, v) => `<select id="${id}-${u}">${keys.map((k) => `<option value="${k}"${k === v ? " selected" : ""}>${esc(M().ORGS[k].common)}</option>`).join("")}</select>`;
    host.innerHTML = head(spec, "explorer") + `
      <div class="row" style="flex-wrap:wrap;gap:.5rem 1rem"><label class="small">First organism: ${sel("ex-a", "lion")}</label><label class="small">Second organism: ${sel("ex-b", "tiger")}</label></div>
      <div class="ix-hscroll mt" id="ex-scroll-${u}"><div id="ex-fig-${u}" style="min-width:600px"></div></div>
      <p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>
      <div class="card mt" id="ex-sum-${u}" aria-live="polite"></div>
      <div id="ex-q-${u}"></div>`;
    const $u = (id) => $(`#${id}-${u}`, host);
    const it = (i, t) => (i >= 6 ? `<em>${esc(t)}</em>` : esc(t));
    const draw = () => {
      const a = $u("ex-a").value, b = $u("ex-b").value; const OA = M().ORGS[a], OB = M().ORGS[b];
      const k = M().sharedRank(a, b);
      let txt;
      if (a === b) txt = `<p class="small">Choose two different organisms to compare.</p>`;
      else {
        const low = `${RL[k].toLowerCase()} ${k >= 6 ? `<em>${esc(OA.taxa[k])}</em>` : esc(OA.taxa[k])}`;
        const diff = k < 7 ? `They first differ at the rank of <strong>${RL[k + 1].toLowerCase()}</strong>: the ${esc(OA.common.toLowerCase())} is in ${it(k + 1, OA.taxa[k + 1])}, the ${esc(OB.common.toLowerCase())} in ${it(k + 1, OB.taxa[k + 1])}.` : "";
        txt = `<h4>Lowest shared taxon: the ${low}</h4><p class="small">${diff}</p>
          <p class="small"><strong>What this implies.</strong> ${k === 0 ? `The two share only the domain, the largest taxon, so in this classification they are as distantly related as two organisms in the same domain can be.` : `They share every taxon from the domain down to the ${RL[k].toLowerCase()}. If the classification reflects evolutionary origins, they share a more recent common ancestor with each other than either does with organisms that share only a higher taxon with them.`}</p>
          <p class="small"><strong>What it does not imply.</strong> That either organism evolved from the other; how long ago their common ancestor lived; or that they can interbreed${k === 6 ? " (separate species do not normally interbreed in nature to produce fertile offspring)" : ""}.${k === 5 && OA.taxa[5] === "Hominidae" ? " Several genera share this family, so the classification alone cannot say which is closest to humans: genome comparisons show that chimpanzees (with bonobos) are our closest living relatives." : ""}</p>`;
      }
      $u("ex-sum").innerHTML = txt;
      $u("ex-fig").innerHTML = A().tree(keys, { hl: [a, b] }); fade($u("ex-fig").firstElementChild);
    };
    $u("ex-a").addEventListener("change", draw); $u("ex-b").addEventListener("change", draw);
    draw();
    allQs(spec).forEach((q) => $u("ex-q").append(B.questions.render(q)));
  };

  // ---------- 3. Molecular Evidence Investigator (3.1.10.2) ----------
  B.interactives.spcMolecular = function (spec, host) {
    const items = spec.items || []; const W = M().WEIGH;
    host.innerHTML = head(spec, "investigation") + `<p class="small">${ILL} All species here are imaginary and the numbers are invented for practice; the methods and the reasoning are real.</p>`;
    const tblH = (head, rows) => `<table class="tbl"><thead><tr>${head.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const build = (i, pane) => {
      if (i === 0) {
        pane.innerHTML = `<div class="notice small"><strong>Investigation 1.</strong> Albumin from species P was injected into a rabbit. The rabbit's antiserum was mixed with serum from P and from four other species, Q, R, S and T, and the precipitate measured. Results are given as a percentage of the precipitate formed with P's own serum.</div>
          <div class="figure mt"><div class="fig-view">${A().bars(M().IMMUNO.values, { title: "Antiserum against albumin of species P" })}</div></div>
          <details class="small"><summary>How to read these data</summary><p>More precipitate means more antibodies bound, so the albumin is more similar to P's, so the species is more closely related to P. P's own serum is the 100 % reference, not a relative of P.</p></details>`;
      } else if (i === 1) {
        const ks = M().SEQ_ORDER;
        pane.innerHTML = `<div class="notice small"><strong>Investigation 2.</strong> The same 30-base section of one gene was sequenced in P, Q, S and R and the sequences aligned. Count the bases that differ.</div>
          <div class="row mt"><label class="small">Compare every row with: <select class="mo-ref">${ks.map((k) => `<option>${k}</option>`).join("")}</select></label><label class="small"><input type="checkbox" class="mo-hl"> highlight differences</label><button class="btn sm mo-cnt" aria-pressed="false">Show counts</button></div>
          <div class="mo-align mt" style="font-family:var(--mono, monospace);font-size:14px;line-height:1.9;overflow-x:auto;max-width:100%" aria-live="polite"></div>
          <div class="mo-mat mt"></div>`;
        const draw = () => {
          const ref = $(".mo-ref", pane).value, hl = $(".mo-hl", pane).checked, cnt = $(".mo-cnt", pane).getAttribute("aria-pressed") === "true"; const SQ = M().SEQ;
          $(".mo-align", pane).innerHTML = `<div style="white-space:pre;color:var(--ink-3)" aria-hidden="true">   ${"1".padEnd(10)} ${"11".padEnd(10)} 21</div>` + ks.map((k) => { const d = M().diffPos(SQ[k], SQ[ref]); const bases = SQ[k].split("").map((b, j) => { const isD = hl && k !== ref && d.includes(j); return (j && j % 10 === 0 ? " " : "") + (isD ? `<mark style="background:var(--amber-soft);color:var(--amber-ink);font-weight:700;text-decoration:underline">${b}</mark>` : b); }).join(""); return `<div style="white-space:pre"><strong>${k}</strong>  ${bases}${cnt ? `  <span class="small">${k === ref ? "(reference)" : d.length + " different"}</span>` : ""}</div>`; }).join("") + `<p class="tiny muted">${hl ? "Differing bases are highlighted and underlined." : "Tick 'highlight differences' to mark bases that differ from the chosen row."}</p>`;
          if (cnt) { const m = M().matrix(); $(".mo-mat", pane).innerHTML = `<p class="small"><strong>Number of differences between each pair</strong></p>` + tblH(["", ...ks], ks.map((a) => [`<strong>${a}</strong>`, ...ks.map((b) => (a === b ? "–" : m[a][b]))])); }
          else $(".mo-mat", pane).innerHTML = `<p class="tiny muted">Counts are hidden so that you can count for yourself first.</p>`;
        };
        $(".mo-ref", pane).addEventListener("change", draw); $(".mo-hl", pane).addEventListener("change", draw);
        $(".mo-cnt", pane).addEventListener("click", (e) => { const on = e.currentTarget.getAttribute("aria-pressed") !== "true"; e.currentTarget.setAttribute("aria-pressed", on); e.currentTarget.textContent = on ? "Hide counts" : "Show counts"; draw(); });
        draw();
      } else {
        pane.innerHTML = `<div class="notice small"><strong>Investigation 3.</strong> Four species of desert gecko, W, X, Y and Z, were compared by two methods. Weigh the evidence.</div>
          <div class="grid grid-2 mt"><div><p class="small"><strong>Immunological data</strong> (precipitate as % of the reference species' own serum)</p>${tblH(["Serum from", "Antiserum v W albumin", "Antiserum v X albumin"], [["W", W.antiW[0][1], W.antiX[1][1]], ["X", W.antiW[1][1], W.antiX[0][1]], ["Y", W.antiW[2][1], W.antiX[2][1]], ["Z", W.antiW[3][1], W.antiX[3][1]]])}</div>
          <div><p class="small"><strong>Sequence data</strong> (base differences in ${String(W.bases).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} aligned bases from 12 genes)</p>${tblH(["", "X", "Y", "Z"], [["W", W.seqDiff["W-X"], W.seqDiff["W-Y"], W.seqDiff["W-Z"]], ["X", "–", W.seqDiff["X-Y"], W.seqDiff["X-Z"]], ["Y", "", "–", W.seqDiff["Y-Z"]]])}</div></div>
          <details class="small mt"><summary>Questions to ask when evidence conflicts</summary><ul><li>How much data is each conclusion based on: one protein, or many genes?</li><li>How precise is the measurement? Is the difference large enough to be meaningful?</li><li>Does a second test (here, antiserum against X) agree with one method or the other?</li><li>What further evidence would settle it?</li></ul></details>`;
      }
      ((items[i] && items[i].questions) || []).forEach((q) => pane.append(B.questions.render(q)));
    };
    tabs(host, items.map((it) => it.label), build, "investigations");
  };
})(window.BIO);
