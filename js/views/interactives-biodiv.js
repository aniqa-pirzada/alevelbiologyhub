// Interactives for 3.1.11 Biodiversity within a community. Kinds: bdvSeqLab (3.1.11.1), bdvInvestigator and
// bdvConservation (3.1.11.2). All calculations come from B.biodivModel (data/content/_biodiv-art.js), so numbers on
// screen and the answers to the embedded questions come from the same functions. Embedded questions are rendered with
// B.questions.render (marked, recorded, counted towards mastery). Every control is a native button, select, radio or
// input; the sequence row uses a roving tab stop (arrow keys, Home, End). Nothing animates when reduced motion is
// requested, and layouts wrap (flex-wrap) so that nothing scrolls horizontally at 390 px.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store && B.store.get().prefs) || {}).reducedMotion;
  const head = (spec, badge) => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const M = () => B.biodivModel, A = () => B.biodivArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .25s"; node.style.opacity = "1"; }); };
  const MONO = "ui-monospace,Menlo,Consolas,monospace";
  const COL = { same: "#d6efec", sub: "#f6dede", gap: "#eceff3", none: "#fff" };

  // Tabs with roving focus (shared by the three interactives)
  const tabs = (host, id, labels, onShow, panes) => {
    const bar = $(`#${id}`, host); let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button class="btn sm" role="tab" id="${id}-t${i}" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"${panes && panes[i] ? ` aria-controls="${panes[i].id}"` : ""}>${esc(l)}</button>`).join("");
    (panes || []).forEach((p, i) => p.setAttribute("aria-labelledby", `${id}-t${i}`));
    const show = (i, focus) => { cur = Math.max(0, Math.min(labels.length - 1, i)); $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", k === cur); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const map = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in map) ni = cur + map[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(0); return show;
  };

  // ======================================== 1. Sequence Comparison Laboratory ========================================
  const CAVEAT = "A percentage similarity describes these two sequences, over this region, with this alignment and gap convention. It is evidence about relationship, not a universal or exact measure of evolutionary distance or of the time since two species diverged.";
  const aaOf = (seq) => { const s = M().clean(seq); const out = []; for (let i = 0; i + 3 <= s.length; i += 3) { const c = s.slice(i, i + 3); out.push({ codon: c, aa: /-/.test(c) ? (c === "---" ? "gap" : "?") : B.proteinModel ? B.proteinModel.aa(c.replace(/T/g, "U")) : "?" }); } return out; };
  B.interactives.bdvSeqLab = function (spec, host) {
    const cases = spec.items || []; const uid = uidOf();
    host.innerHTML = head(spec, "illustrative sequences") + `
      <div class="notice small"><strong>Conventions used here.</strong> Sequences are written 5′→3′. Base sequences are compared on the same strand: mRNA with the DNA <strong>coding</strong> strand, U counting as equal to T. Gap positions (–) are <strong>excluded</strong> from the positions compared unless you choose to count them as differences; the number of gaps is always shown. Sequences of unequal length are never compared position by position until aligned.</div>
      <div class="row mt" role="tablist" aria-label="comparison cases" id="sl-tabs-${uid}" style="flex-wrap:wrap"></div>
      <div id="sl-body" class="mt"></div>`;
    const body = $("#sl-body", host);
    let st = null;
    const panes = cases.map((c, i) => { const d = document.createElement("div"); d.hidden = true; d.setAttribute("role", "tabpanel"); d.id = `sl-pane-${uid}-${i}`; body.append(d); return d; });
    const built = new Set();
    const build = (i) => {
      const c = cases[i], pane = panes[i];
      const state = { pair: (c.pair || [0, 1]).slice(), region: 0, aligned: false, naive: false, rc: false, gaps: "exclude", marks: new Set(), revealed: false, aa: false, checked: null };
      pane.innerHTML = `<div class="card"><h4>${esc(c.title)}</h4><p class="small">${esc(c.intro)}</p>
        <div class="row" data-r="controls" style="flex-wrap:wrap;gap:.5rem"></div>
        <div data-r="flag" class="mt" aria-live="polite"></div>
        <div data-r="names" class="small mt"></div>
        <div data-r="align" class="mt" style="display:flex;flex-wrap:wrap;gap:2px;max-width:100%"></div>
        <div class="row mt" style="flex-wrap:wrap;gap:.5rem"><button class="btn sm" data-a="check">Check my marking</button><button class="btn sm primary" data-a="reveal">Reveal the comparison</button><button class="btn sm" data-a="clear">Clear marks</button>${c.translate ? '<label class="small"><input type="checkbox" data-a="aa"> show amino acids</label>' : ""}</div>
        <div data-r="fb" class="mt" aria-live="polite"></div><div data-r="aa" class="mt"></div><div data-r="out" class="mt"></div></div>
        <h4 class="mt">Questions on this case</h4><div data-r="q"></div>`;
      const q = (k) => $(`[data-r="${k}"]`, pane);
      // controls per case
      let ctl = "";
      if (c.multi) ctl += `<label class="small">First sequence: <select data-c="p0">${c.multi.map((x, k) => `<option value="${k}" ${k === state.pair[0] ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label><label class="small">Second sequence: <select data-c="p1">${c.multi.map((x, k) => `<option value="${k}" ${k === state.pair[1] ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>`;
      if (c.regions) ctl += `<label class="small">Region: <select data-c="region">${c.regions.map((x, k) => `<option value="${k}">${esc(x.name)}</option>`).join("")}</select></label>`;
      if (c.aligned) ctl += `<button class="btn sm" data-c="naive" aria-pressed="false">Compare without aligning</button><button class="btn sm" data-c="align" aria-pressed="false">Align the sequences</button>`;
      if (c.aligned || c.id === "gaps") ctl += `<fieldset class="small" style="border:0;padding:0;margin:0"><legend class="sr-only">gap convention</legend>Gaps: <label><input type="radio" name="gp-${uid}-${i}" value="exclude" checked> excluded</label> <label><input type="radio" name="gp-${uid}-${i}" value="count"> counted as differences</label></fieldset>`;
      if (c.rc) ctl += `<button class="btn sm" data-c="rc" aria-pressed="false">Reverse complement species H's sequence</button>`;
      q("controls").innerHTML = ctl || `<span class="small muted">Both sequences are already aligned.</span>`;
      const seqs = () => {
        let a, b;
        if (c.multi) { a = c.multi[state.pair[0]]; b = c.multi[state.pair[1]]; }
        else if (c.regions) { a = c.regions[state.region].a; b = c.regions[state.region].b; }
        else { a = c.a; b = Object.assign({}, c.b); }
        if (c.aligned && state.aligned) b = Object.assign({}, b, { seq: c.aligned, name: b.name + " (aligned, gap shown as –)" });
        if (c.rc && state.rc) b = Object.assign({}, b, { seq: M().revcomp(b.seq), name: "Species H (reverse complemented: coding strand)", type: "DNA coding strand" });
        return { a, b };
      };
      const draw = () => {
        const { a, b } = seqs(); const r = M().compare(a.seq, b.seq, { gaps: state.gaps, tu: !!c.tu }); state.r = r;
        q("names").innerHTML = `<strong>Top row:</strong> ${esc(a.name)} (${esc(a.type)}, 5′→3′, ${M().clean(a.seq).replace(/-/g, "").length} ${a.type === "amino-acid sequence" ? "amino acids" : "bases"}). <strong>Bottom row (buttons):</strong> ${esc(b.name)} (${esc(b.type)}, 5′→3′, ${M().clean(b.seq).replace(/-/g, "").length} ${b.type === "amino-acid sequence" ? "amino acids" : "bases"}). Press a bottom-row position to mark it as a difference; use the arrow keys to move along the row.`;
        let flag = "";
        if (c.rc && !state.rc) flag = `<div class="notice amber small"><strong>Flag: different strands.</strong> Species H's sequence is the complementary strand written 5′→3′, so its bases are not equivalent to species G's coding strand position by position. Any similarity calculated now is meaningless (shown below only so you can see the problem: ${M().fix(r.pct, 1)} %). Reverse complement it first.</div>`;
        if (c.tu) flag = `<div class="notice small">One sequence is DNA, the other mRNA. U in the mRNA is treated as equal to T in the coding strand: those positions are <strong>not</strong> differences.</div>`;
        if (c.multi && state.pair[0] === state.pair[1]) flag = `<div class="notice amber small">You have chosen the same sequence twice. Choose two different species.</div>`;
        if (!r.ok && r.code === "unaligned") flag = `<div class="notice amber small"><strong>Not aligned.</strong> ${esc(r.reason)} ${state.naive ? "<strong>Shown below: a position-by-position comparison WITHOUT aligning, over the first " + Math.min(r.la, r.lb) + " positions. After the deletion every base is compared with the wrong partner, so the result is meaningless.</strong>" : "Choose “Compare without aligning” to see why, or “Align the sequences”."}</div>`;
        q("flag").innerHTML = flag;
        // columns
        let cols;
        if (r.ok) cols = r.cols;
        else if (r.code === "unaligned" && state.naive) { const x = M().clean(a.seq), y = M().clean(b.seq); const n = Math.min(x.length, y.length); cols = Array.from({ length: n }, (_, k) => ({ i: k, x: x[k], y: y[k], st: x[k] === y[k] ? "same" : "sub" })); }
        else { const x = M().clean(a.seq), y = M().clean(b.seq); const n = Math.max(x.length, y.length); cols = Array.from({ length: n }, (_, k) => ({ i: k, x: x[k] || " ", y: y[k] || " ", st: "none" })); }
        state.cols = cols;
        const nuc = a.type !== "amino-acid sequence";
        const reveal = state.revealed && (r.ok || state.naive);
        q("align").innerHTML = cols.map((col, k) => { const bg = reveal ? COL[col.st] || "#fff" : "#fff"; const mk = state.marks.has(k); const sym = reveal ? (col.st === "sub" ? "×" : col.st === "gap" ? "–" : "") : mk ? "•" : ""; const pos = (k + 1) % 10 === 0 || k === 0 ? k + 1 : ""; const sep = nuc && (k + 1) % 3 === 0 ? "margin-right:6px;" : "";
          return `<div style="display:inline-flex;flex-direction:column;align-items:center;width:1.55em;${sep}"><span class="tiny muted" style="height:1.1em;font-size:.62rem">${pos}</span><span style="font-family:${MONO};font-weight:700;width:100%;text-align:center;background:${bg};border-radius:3px 3px 0 0;padding:1px 0">${esc(col.x)}</span><button type="button" class="bd-pos" data-k="${k}" tabindex="-1" aria-pressed="${mk}" aria-label="position ${k + 1}: ${esc(a.name)} ${esc(col.x)}, ${esc(b.name)} ${esc(col.y)}${mk ? ", marked as a difference" : ""}" style="font-family:${MONO};font-weight:700;width:100%;padding:1px 0;border:1px solid ${mk ? "#b4504f" : "var(--line-strong,#c8d2dc)"};border-radius:0 0 3px 3px;background:${mk ? "#fbe9e9" : bg};color:inherit;cursor:pointer;min-height:1.6em">${esc(col.y)}</button><span style="height:1.1em;font-weight:700;color:${col.st === "sub" ? "#b4504f" : "#5f6f7f"}" aria-hidden="true">${sym}</span></div>`; }).join("");
        const btns = $$(".bd-pos", q("align")); if (btns.length) { const f = Math.min(state.focus || 0, btns.length - 1); btns[f].tabIndex = 0; }
        // translation
        if (c.translate && state.aa && c.rc && !state.rc) q("aa").innerHTML = `<p class="small muted">Translate only coding-strand sequences: reverse complement species H's sequence first.</p>`;
        else if (c.translate && state.aa && nuc && (r.ok)) { const ta = aaOf(a.seq), tb = aaOf(b.seq); let nd = 0, nc = 0, synSubs = 0; const blocks = ta.map((x, k) => { const y = tb[k] || { codon: "", aa: "" }; const comparable = x.aa !== "gap" && y.aa !== "gap"; const diff = comparable && x.aa !== y.aa; if (comparable) { nc++; if (diff) nd++; else { const cx = x.codon.replace(/U/g, "T"), cy = y.codon.replace(/U/g, "T"); for (let j = 0; j < 3; j++) if (cx[j] !== "-" && cy[j] !== "-" && cx[j] !== cy[j]) synSubs++; } } return `<div style="display:inline-flex;flex-direction:column;align-items:center;min-width:3.4em;padding:2px 3px;border-radius:6px;background:${!comparable ? COL.gap : diff ? COL.sub : COL.same}"><span class="tiny" style="font-family:${MONO}">${esc(x.codon)}</span><strong class="small">${esc(x.aa)}</strong><strong class="small">${esc(y.aa)}</strong><span class="tiny" style="font-family:${MONO}">${esc(y.codon)}</span></div>`; }).join("");
          const aaPct = nc ? (100 * (nc - nd)) / nc : 0; q("aa").innerHTML = `<div class="card"><h4 class="small">Amino acids coded for (top: ${esc(a.name)}; bottom: ${esc(b.name)})</h4><div style="display:flex;flex-wrap:wrap;gap:4px">${blocks}</div><p class="small mt">Amino acids compared: ${nc}; different: <strong>${nd}</strong>; amino-acid similarity ${M().fix(aaPct, 1)} %. DNA substitutions: ${r.subs}. ${synSubs ? `<strong>${synSubs === r.subs ? (r.subs === 1 ? "The base substitution does not change the amino acid" : r.subs === 2 ? "Neither base substitution changes the amino acid" : `None of the ${r.subs} base substitutions changes the amino acid`) : `${synSubs} of the ${r.subs} base substitutions ${synSubs === 1 ? "does" : "do"} not change the amino acid`}</strong>: the genetic code is degenerate, so DNA comparisons can reveal differences that protein comparisons miss.` : r.subs ? (r.subs === 1 ? "The substitution here changes an amino acid." : "Every substitution here changes an amino acid.") : "There are no base substitutions."}${aaPct < r.pct - 1e-9 ? ` <strong>Note:</strong> the amino-acid percentage (${M().fix(aaPct, 1)} %) is lower than the DNA percentage (${M().fix(r.pct, 1)} %) even though fewer amino acids than bases differ (${nd} against ${r.subs}). Only ${nc} amino acids are compared, against ${r.denom} bases, so each amino-acid difference is a bigger share. A percentage similarity depends on what is compared.` : ""}</p></div>`; }
        else q("aa").innerHTML = c.translate && state.aa && !r.ok ? `<p class="small muted">Align (or convert) the sequences first; translation is compared codon by codon.</p>` : "";
        // results
        if (state.revealed) {
          if (r.ok) { const gapLine = r.gapCols ? `<li>Gap positions (–): <strong>${r.gapCols}</strong> ${state.gaps === "exclude" ? "(excluded from the positions compared)" : "(each counted as a difference)"}</li>` : "";
            q("out").innerHTML = `<div class="card"><h4>The comparison</h4><ul class="small"><li>Positions in the alignment: <strong>${r.length}</strong></li>${gapLine}<li>Positions compared: <strong>${r.denom}</strong></li><li>Identical positions: <strong>${r.identical}</strong></li><li>Substitutions (×): <strong>${r.subs}</strong></li><li>Differences counted: <strong>${r.differences}</strong></li></ul>
              <p class="small mt"><strong>Percentage similarity</strong> = identical ÷ positions compared × 100 = ${r.identical} ÷ ${r.denom} × 100 = <strong>${M().fix(r.pct, 1)} %</strong> (1 d.p.). ${r.gapCols ? `With the other gap convention it would be ${M().fix(state.gaps === "exclude" ? (100 * r.identical) / r.length : (100 * r.identical) / r.compared, 1)} %: always state which you used.` : ""}</p>
              ${c.rc && !state.rc ? `<p class="small" style="color:var(--rose-ink)"><strong>This value is not valid</strong>: the sequences are on different strands.</p>` : ""}
              <p class="small muted">${CAVEAT}</p></div>`; }
          else if (state.naive) { const nv = M().naive(seqs().a.seq, seqs().b.seq); q("out").innerHTML = `<div class="card"><p class="small" style="color:var(--rose-ink)"><strong>Unaligned comparison (invalid):</strong> ${nv.same} of ${nv.n} positions match (${M().fix(nv.pct, 1)} %). The deletion shifts every later base, so most "differences" here are artefacts. Align the sequences to compare equivalent positions.</p><p class="small muted">${CAVEAT}</p></div>`; }
          else q("out").innerHTML = `<p class="small muted">No comparison can be made until the sequences are aligned.</p>`;
        } else q("out").innerHTML = "";
        if (state.checked) q("fb").innerHTML = state.checked; fade(q("align"));
      };
      const checkMarks = () => {
        const r = state.r; if (!r || (!r.ok && !state.naive)) { state.checked = `<div class="feedback neutral small">Align the sequences first: marking only makes sense for equivalent positions.</div>`; draw(); return; }
        const subs = state.cols.filter((x) => x.st === "sub").map((x) => x.i); const right = subs.filter((k) => state.marks.has(k)).length; const extra = [...state.marks].filter((k) => !subs.includes(k)); const gapsMarked = extra.filter((k) => state.cols[k].st === "gap").length;
        const ok = right === subs.length && extra.length === 0;
        state.checked = `<div class="feedback ${ok ? "ok" : "neutral"} small"><strong>${ok ? "All substitutions found." : `You found ${right} of ${subs.length} substitutions.`}</strong> ${extra.length ? `${extra.length} marked position${extra.length === 1 ? " is" : "s are"} not a substitution${gapsMarked ? ` (${gapsMarked} ${gapsMarked === 1 ? "is a gap" : "are gaps"}: gaps are reported separately)` : ""}${c.tu ? "; remember U and T at the same position match" : ""}.` : ""} ${!ok ? "Look again, or reveal the comparison." : ""}</div>`; draw();
      };
      pane.addEventListener("click", (e) => {
        const p = e.target.closest(".bd-pos"); if (p) { const k = +p.dataset.k; state.focus = k; state.marks.has(k) ? state.marks.delete(k) : state.marks.add(k); state.checked = null; draw(); const nb = $$(".bd-pos", q("align"))[k]; if (nb) nb.focus(); return; }
        const a = e.target.closest("[data-a]"); if (a && a.dataset.a === "check") checkMarks(); else if (a && a.dataset.a === "reveal") { state.revealed = true; draw(); } else if (a && a.dataset.a === "clear") { state.marks.clear(); state.checked = null; draw(); }
        const cbtn = e.target.closest("button[data-c]"); if (!cbtn) return;
        if (cbtn.dataset.c === "naive") { state.naive = !state.naive; state.aligned = false; } else if (cbtn.dataset.c === "align") { state.aligned = !state.aligned; state.naive = false; } else if (cbtn.dataset.c === "rc") state.rc = !state.rc;
        state.marks.clear(); state.checked = null; $$("button[data-c]", pane).forEach((b) => b.setAttribute("aria-pressed", { naive: state.naive, align: state.aligned, rc: state.rc }[b.dataset.c])); $$("button[data-c=align]", pane).forEach((b) => (b.textContent = state.aligned ? "Remove the alignment" : "Align the sequences")); $$("button[data-c=rc]", pane).forEach((b) => (b.textContent = state.rc ? "Show H's sequence as reported" : "Reverse complement species H's sequence")); draw();
      });
      pane.addEventListener("change", (e) => { const t = e.target; if (t.dataset.c === "p0" || t.dataset.c === "p1") { state.pair[t.dataset.c === "p0" ? 0 : 1] = +t.value; state.marks.clear(); state.checked = null; } else if (t.dataset.c === "region") { state.region = +t.value; state.marks.clear(); state.checked = null; } else if (t.type === "radio") state.gaps = t.value; else if (t.dataset.a === "aa") state.aa = t.checked; draw(); });
      q("align").addEventListener("keydown", (e) => { const btns = $$(".bd-pos", q("align")); const k = btns.indexOf(document.activeElement); if (k < 0) return; const map = { ArrowRight: 1, ArrowLeft: -1 }; let n = null; if (e.key in map) n = k + map[e.key]; else if (e.key === "Home") n = 0; else if (e.key === "End") n = btns.length - 1; if (n === null) return; e.preventDefault(); n = Math.max(0, Math.min(btns.length - 1, n)); btns.forEach((b, j) => (b.tabIndex = j === n ? 0 : -1)); state.focus = n; btns[n].focus(); });
      (c.questions || []).forEach((qq) => q("q").append(B.questions.render(qq)));
      draw();
    };
    tabs(host, `sl-tabs-${uid}`, cases.map((c) => c.label), (i) => { if (!built.has(i)) { build(i); built.add(i); } panes.forEach((p, k) => (p.hidden = k !== i)); }, panes);
  };

  // ======================================== 2. Biodiversity Investigator ========================================
  B.interactives.bdvInvestigator = function (spec, host) {
    const keys = spec.communities || Object.keys(M().COMMUNITIES); const uid = uidOf(); const CM = M().COMMUNITIES;
    host.innerHTML = head(spec, "illustrative counts") + `
      <div class="row" style="flex-wrap:wrap;gap:.5rem"><label class="small">Community: <select id="iv-com-${uid}">${keys.map((k) => `<option value="${k}">${esc(CM[k].title)}</option>`).join("")}</select></label><button class="btn sm" id="iv-reset-${uid}">Reset counts</button></div>
      <p class="small muted mt" id="iv-place-${uid}"></p>
      <div class="grid grid-2 mt"><div><div class="figure"><div class="fig-view" id="iv-view-${uid}"></div></div><p class="tiny muted">Each species has its own shape and letter. Dotted lines divide the sample area into quarters to help you count.</p></div>
        <div><div class="card"><h4>1. Count, then check</h4><p class="small">Count each species in the sampling view and enter your counts (n). Then enter N, the total.</p><div id="iv-count-${uid}"></div><div class="row mt" style="flex-wrap:wrap;gap:.5rem"><button class="btn sm" id="iv-check-${uid}">Check my counts</button></div><div id="iv-cfb-${uid}" class="small mt" aria-live="polite"></div></div>
        <div class="card mt"><h4>2. Change the abundances</h4><p class="small">Use − and + to change how many individuals of each species there are (0 to 60). The view, richness and d update.</p><div id="iv-edit-${uid}"></div></div></div></div>
      <div class="card mt"><h4>3. Calculate d step by step</h4><p class="small"><strong>d = N(N − 1) ÷ Σn(n − 1)</strong>, N = total number of organisms of all species, n = total number of organisms of each species.</p><div class="row" style="flex-wrap:wrap;gap:.5rem"><button class="btn sm primary" id="iv-next-${uid}">Show next step</button><button class="btn sm" id="iv-all-${uid}">Show all steps</button><button class="btn sm" id="iv-hide-${uid}">Hide steps</button><span class="small muted" id="iv-stepn-${uid}" aria-live="polite"></span></div><div id="iv-steps-${uid}" class="mt" aria-live="polite"></div></div>
      <div class="card mt"><h4>4. Compare two communities</h4><div class="row" style="flex-wrap:wrap;gap:.5rem"><label class="small">First: <select id="iv-c1-${uid}"></select></label><label class="small">Second: <select id="iv-c2-${uid}"></select></label></div><div id="iv-cmp-${uid}" class="mt"></div></div>
      <p class="tiny muted mt"><strong>Model notes.</strong> The index is calculated exactly as the specification gives it, with whole-number counts; values are rounded only for display (2 decimal places). When Σn(n − 1) = 0 (no organisms, one organism, or every species represented by one individual) the formula cannot be used and no value is shown. Counts are illustrative, invented for teaching.</p>
      <h4 class="mt">Questions on the investigator</h4><div id="iv-q-${uid}"></div>`;
    const $u = (id) => $(`#iv-${id}-${uid}`, host);
    let key = keys[0], counts = [], names = [], sy = [], step = 0;
    const LT = (k) => A().LETTERS[sy[k]]; // each species keeps its own symbol (shape and letter) across communities
    const load = (k) => { key = k; counts = CM[k].species.map((s) => s[1]); names = CM[k].species.map((s) => s[0]); sy = M().syms(k); step = 0; $u("place").textContent = CM[k].place + (CM[k].note ? ". " + CM[k].note.replace(/\.$/, "") : "") + "."; $u("cfb").innerHTML = ""; renderCount(); renderAll(); };
    const renderCount = () => { $u("count").innerHTML = `<div style="display:grid;grid-template-columns:auto 1fr auto;gap:.3rem .5rem;align-items:center">${names.map((nm, k) => `<span aria-hidden="true"><svg viewBox="0 0 22 22" width="22" height="22">${A().symbol(sy[k], 11, 11, 9)}</svg></span><label class="small" for="iv-n${k}-${uid}">${LT(k)}: ${esc(nm)}</label><input id="iv-n${k}-${uid}" class="gap-input" inputmode="numeric" autocomplete="off" style="width:4.5em" aria-label="your count of ${esc(nm)}">`).join("")}<span></span><label class="small" for="iv-nN-${uid}"><strong>N (total)</strong></label><input id="iv-nN-${uid}" class="gap-input" inputmode="numeric" autocomplete="off" style="width:4.5em" aria-label="your total N"></div>`; };
    const result = () => M().index(counts);
    const renderAll = () => {
      $u("view").innerHTML = A().quadratSVG(counts, names, { seed: 101 + keys.indexOf(key), syms: sy }); fade($u("view").firstElementChild);
      const r = result();
      $u("edit").innerHTML = `<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:.3rem .4rem;align-items:center">${names.map((nm, k) => `<span class="small">${LT(k)}: ${esc(nm)}</span><button class="btn sm" data-k="${k}" data-d="-1" aria-label="one fewer ${esc(nm)}" ${counts[k] <= 0 ? "disabled" : ""}>−</button><output class="small" style="min-width:2.2em;text-align:center" aria-live="polite">${counts[k]}</output><button class="btn sm" data-k="${k}" data-d="1" aria-label="one more ${esc(nm)}" ${counts[k] >= 60 ? "disabled" : ""}>+</button>`).join("")}</div><p class="small mt">Species richness: <strong>${r.richness}</strong> · N = <strong>${r.N}</strong> · d = <strong>${r.ok ? M().fix(r.d) : "cannot be calculated"}</strong></p>`;
      renderSteps(); renderCompare();
    };
    const renderSteps = () => {
      const r = result(); const total = 5; $u("stepn").textContent = step ? `Step ${step} of ${total}` : ""; $u("next").disabled = step >= total;
      if (!step) { $u("steps").innerHTML = ""; return; }
      const show = (s) => step >= s;
      const rows = names.map((nm, k) => `<tr><td><span title="${esc(nm)}">${LT(k)}</span><span class="sr-only">: ${esc(nm)}</span></td><td>${counts[k]}</td><td>${show(2) ? counts[k] - 1 : ""}</td><td>${show(2) ? `<strong>${counts[k] * (counts[k] - 1)}</strong>` : ""}</td></tr>`).join("");
      let out = `<p class="tiny muted">Species are shown by their letters, as in the sampling view and the count list.</p><div style="overflow-x:auto;max-width:100%"><table class="tbl" style="display:table;width:100%;table-layout:fixed"><thead><tr><th scope="col" style="width:22%;white-space:normal">Species</th><th scope="col" style="white-space:normal">n</th><th scope="col" style="white-space:normal">n − 1</th><th scope="col" style="width:34%;white-space:normal">n(n − 1)</th></tr></thead><tbody>${rows}<tr><th scope="row" style="white-space:normal">Totals</th><th style="white-space:normal">N = ${r.N}</th><th></th><th style="white-space:normal;overflow-wrap:anywhere">${show(3) ? `Σn(n − 1) = ${r.sigma}` : ""}</th></tr></tbody></table></div><ol class="small">`;
      out += `<li><strong>N</strong> = ${counts.join(" + ")} = <strong>${r.N}</strong></li>`;
      if (show(2)) out += `<li>For each species, n(n − 1). A species with n = 1 gives 1 × 0 = 0; a species with n = 0 gives 0.</li>`;
      if (show(3)) out += `<li><strong>Σn(n − 1)</strong> = ${r.terms.join(" + ")} = <strong>${r.sigma}</strong></li>`;
      if (show(4)) out += `<li><strong>N(N − 1)</strong> = ${r.N} × ${r.N - 1 < 0 ? "(−1)" : r.N - 1} = <strong>${r.top}</strong></li>`;
      if (show(5)) out += r.ok ? `<li><strong>d</strong> = ${r.top} ÷ ${r.sigma} = ${M().fix(r.d, 4)}… = <strong>${M().fix(r.d)}</strong> (2 d.p.)${r.richness === 1 ? " (one species only: d = 1, the lowest possible value)" : ""}</li>` : `<li><strong>d cannot be calculated.</strong> ${esc(r.reason)}</li>`;
      $u("steps").innerHTML = out + "</ol>"; $u("next").disabled = step >= total;
    };
    const cmpKeys = ["__current", ...keys];
    const label = (k) => (k === "__current" ? "Current community (with your changes)" : CM[k].title);
    $u("c1").innerHTML = cmpKeys.map((k) => `<option value="${k}">${esc(label(k))}</option>`).join(""); $u("c2").innerHTML = $u("c1").innerHTML;
    const [d1, d2] = spec.compare || [keys[0], keys[1]]; $u("c1").value = d1; $u("c2").value = d2;
    const renderCompare = () => {
      const pick = (k) => (k === "__current" ? { title: "Current: " + CM[key].title, ns: counts.slice(), names, sy } : { title: CM[k].title, ns: CM[k].species.map((s) => s[1]), names: CM[k].species.map((s) => s[0]), sy: M().syms(k) });
      const a = pick($u("c1").value), b = pick($u("c2").value); const ra = M().index(a.ns), rb = M().index(b.ns);
      const bar = (x, r) => { const N = r.N || 1; return `<div style="display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid #c8d2dc" role="img" aria-label="relative abundance: ${x.names.map((nm, k) => `${nm} ${x.ns[k]}`).join(", ")}">${x.ns.map((n, k) => (n ? `<div title="${esc(x.names[k])}: ${n}" style="width:${(100 * n) / N}%;background:${A().colours.PAL[x.sy[k] % 8]};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;overflow:hidden">${(100 * n) / N >= 6 ? A().LETTERS[x.sy[k]] : ""}</div>` : "")).join("")}</div>`; };
      const card = (x, r) => `<div class="card"><h4 class="small">${esc(x.title)}</h4>${bar(x, r)}<p class="small mt">Richness <strong>${r.richness}</strong> · N = ${r.N} · d = <strong>${r.ok ? M().fix(r.d) : "cannot be calculated"}</strong></p></div>`;
      let verdict = "";
      if (ra.ok && rb.ok) { const hi = ra.d > rb.d ? a : rb.d > ra.d ? b : null; verdict = hi ? `<strong>${esc(hi.title)}</strong> is more diverse (higher d).` : "The two values of d are equal."; if (ra.richness === rb.richness && hi) verdict += " Both have the same species richness, so the difference comes from how evenly the individuals are spread among the species."; else if (hi && ((ra.d > rb.d) !== (ra.richness > rb.richness)) && ra.richness !== rb.richness) verdict += " Note that the community with more species does not have the higher d here: evenness matters too."; verdict += " Compare values of d only for samples collected in the same way."; }
      else verdict = "At least one community has no value of d, so the two cannot be compared with this index.";
      $u("cmp").innerHTML = `<div class="grid grid-2">${card(a, ra)}${card(b, rb)}</div><p class="small mt">${verdict}</p>`;
    };
    $u("com").addEventListener("change", (e) => load(e.target.value));
    $u("reset").addEventListener("click", () => load(key));
    $u("edit").addEventListener("click", (e) => { const b = e.target.closest("button[data-k]"); if (!b) return; const k = +b.dataset.k; counts[k] = Math.max(0, Math.min(60, counts[k] + +b.dataset.d)); renderAll(); const nb = $(`button[data-k="${k}"][data-d="${b.dataset.d}"]`, $u("edit")); if (nb && !nb.disabled) nb.focus(); else { const alt = $(`button[data-k="${k}"]:not([disabled])`, $u("edit")); if (alt) alt.focus(); } });
    $u("next").addEventListener("click", () => { step = Math.min(5, step + 1); renderSteps(); });
    $u("all").addEventListener("click", () => { step = 5; renderSteps(); });
    $u("hide").addEventListener("click", () => { step = 0; $u("next").disabled = false; renderSteps(); });
    $u("c1").addEventListener("change", renderCompare); $u("c2").addEventListener("change", renderCompare);
    $u("check").addEventListener("click", () => {
      const r = result(); let right = 0, wrong = []; names.forEach((nm, k) => { const v = $(`#iv-n${k}-${uid}`, host).value.trim(); const ok = v !== "" && B.util.answerMatches(v, String(counts[k])); $(`#iv-n${k}-${uid}`, host).classList.toggle("ok", ok); $(`#iv-n${k}-${uid}`, host).classList.toggle("bad", !ok); if (ok) right++; else wrong.push(LT(k)); });
      const vN = $(`#iv-nN-${uid}`, host).value.trim(); const okN = vN !== "" && B.util.answerMatches(vN, String(r.N)); $(`#iv-nN-${uid}`, host).classList.toggle("ok", okN); $(`#iv-nN-${uid}`, host).classList.toggle("bad", !okN);
      $u("cfb").innerHTML = `<div class="feedback ${right === names.length && okN ? "ok" : "neutral"}"><strong>${right} of ${names.length} species counted correctly${okN ? "; N correct" : "; check N"}.</strong> ${wrong.length ? `Recount species ${wrong.join(", ")}: count one quarter of the sample area at a time.` : ""} ${!okN ? "N is the sum of all the counts." : ""}</div>`;
    });
    load(key);
    (spec.items || []).flatMap((it) => it.questions || []).forEach((q) => $u("q").append(B.questions.render(q)));
  };

  // ======================================== 3. Conservation Decision Challenge ========================================
  B.interactives.bdvConservation = function (spec, host) {
    const sc = spec.items || []; const uid = uidOf();
    host.innerHTML = head(spec, "evidence and trade-offs") + `
      <div class="notice small"><strong>How this works.</strong> Each scenario gives evidence and several options with their gains and costs. Choose the option you would recommend (your choice is not marked: different, well-argued choices are all valid), then write your justification in the question below and self-mark it against the scheme. Labels show which material is real (with sources) and which is hypothetical or illustrative.</div>
      <div class="row mt" role="tablist" aria-label="scenarios" id="cd-tabs-${uid}" style="flex-wrap:wrap"></div><div id="cd-body-${uid}" class="mt"></div>`;
    const body = $(`#cd-body-${uid}`, host);
    const panes = sc.map((s, i) => { const d = document.createElement("div"); d.hidden = true; d.setAttribute("role", "tabpanel"); d.id = `cd-pane-${uid}-${i}`;
      d.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:.4rem;min-width:0"><h4 style="min-width:0">${esc(s.title)}</h4><span class="badge ${/Real/.test(s.tag) ? "teal" : "amber"}" style="white-space:normal;max-width:100%;line-height:1.35">${esc(s.tag)}</span></div><p class="small">${s.context}</p><h4 class="small mt">Evidence</h4><div style="overflow-x:auto">${s.evidence}</div>
        <fieldset class="mt" style="border:0;padding:0;margin:0"><legend><strong class="small">Options: which would you recommend?</strong></legend>${s.options.map(([o, tr], k) => `<div class="card mt" style="padding:.6rem .8rem"><label class="small"><input type="radio" name="cd-${uid}-${i}" value="${k}"> <strong>${esc(o)}</strong></label><p class="small muted" style="margin:.3rem 0 0 1.6rem">${esc(tr)}</p></div>`).join("")}</fieldset>
        <div class="small mt" data-r="pick" aria-live="polite"></div></div><h4 class="mt">Interpret the evidence, then justify your choice</h4><div data-r="q"></div>`;
      body.append(d); (s.questions || []).forEach((q) => $('[data-r="q"]', d).append(B.questions.render(q)));
      d.addEventListener("change", (e) => { if (e.target.type !== "radio" || !e.target.name.startsWith("cd-")) return; const o = s.options[+e.target.value][0]; $('[data-r="pick"]', d).innerHTML = `<div class="feedback neutral">You chose <strong>${esc(o)}</strong>. There is no single correct answer. A strong justification uses the evidence (quote values), weighs a benefit against a cost for both food production and biodiversity, and says what further evidence would help. Write it in the self-marked question below.</div>`; });
      return d; });
    tabs(host, `cd-tabs-${uid}`, sc.map((s) => s.label), (i) => panes.forEach((p, k) => (p.hidden = k !== i)), panes);
  };
})(window.BIO);
