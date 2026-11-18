// Interactives for 3.3.6.2 Patterns of inheritance: the chi-squared test (Phase 5 Batch 3, author B4).
// Kinds: chiCalculator (tabs: guided, practice, own data) and geneticDataChallenge. Model: B.chiModel
// (data/content/_chi-model.js, where the rules, sources and test cases are documented; validate() checks them).
// Spec shapes (placed by B3 in the 3.3.6.2 Learn notes):
//   { kind: "chiCalculator", title, note?, modes?: ["guided", "practice", "own"], presets?: ["P1", "P2", "P3"],
//     practice?: [practice ids], locks?: [{ observed, ratio, q, where }], questions?: [...] }
//   { kind: "geneticDataChallenge", title, note?, scenarios?: ["G1" … "G7"], questions?: [...] }
// No answer is shown before the student has tried: every step is marked from the student's own entry; "Show answer"
// appears only after a wrong attempt; the next step opens only when a step is right or has been shown. The own-data tab
// needs the student's own χ² before it shows any working, and refuses the data sets of unanswered questions (locks).
// Accessibility: native buttons, radios, selects and inputs, each labelled; tab rows respond to the arrow keys;
// feedback areas are polite live regions; nothing moves. Layout: B.ix.split.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.chiModel;
  const phone = () => typeof innerWidth !== "undefined" && innerWidth < 600;
  const SWIPE = `<p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>`;
  const wide = (html) => (phone() ? `<div class="ix-hscroll">${html}</div>${SWIPE}` : html);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div>${spec.note ? `<p class="small muted">${esc(spec.note)}</p>` : ""}`;
  const qBlock = (spec) => ((spec.questions || []).length ? `<h4 class="mt">Questions</h4><div data-qs></div>` : "");
  const renderQs = (spec, host) => { const into = $("[data-qs]", host); if (!into) return; (spec.questions || []).forEach((q) => into.append(B.questions.render(q, {}))); };
  const SIMPLE = `<p class="tiny muted mt">Simplified model: counts are of individuals in a large random sample, every expected number is at least 5, and the expected ratio comes from a genetic diagram drawn before looking at the data.</p>`;
  const BOX = { ok: "background:var(--sage-soft);border-left:4px solid var(--sage)", bad: "background:var(--rose-soft);border-left:4px solid var(--rose)", neutral: "background:var(--surface-2);border-left:4px solid var(--line-strong)" };
  const fb = (kind, html) => `<div class="feedback ${kind}" style="${BOX[kind]};padding:.5rem .7rem;border-radius:8px;margin-top:.4rem;font-size:.9rem">${html}</div>`;
  const num = (el) => { const s = el ? String(el.value).trim().replace(/,/g, "").replace(/\s/g, "").replace(/^−/, "-") : ""; return s === "" ? NaN : Number(s); };
  const INPUT = "padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:6px;font:inherit;";
  const numBox = (attrs, label, w = "5.5rem") => `<input type="text" inputmode="decimal" autocomplete="off" ${attrs} aria-label="${esc(label)}" style="${INPUT}width:${w}">`;
  const mark = (el, ok) => { if (!el) return; el.style.background = ok ? "var(--sage-soft)" : "var(--rose-soft)"; el.style.borderColor = ok ? "var(--sage)" : "var(--rose)"; el.setAttribute("aria-invalid", ok ? "false" : "true"); };
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(start); return show; };

  // abridged table of critical values (the student reads it; picking the right value is the skill)
  const critTable = (dfMax = 4) => { const rows = []; for (let df = 1; df <= Math.max(4, dfMax); df++) rows.push(`<tr><th scope="row">${df}</th>${M().SHOW[df].map((v) => `<td>${v}</td>`).join("")}</tr>`);
    return `<table class="tbl small" style="margin:.3rem 0"><caption class="tiny muted" style="caption-side:top;text-align:left">Critical values of χ²</caption><thead><tr><th scope="col">Degrees of freedom</th>${M().PS.map((p) => `<th scope="col">P = ${p}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`; };
  const CONC = [
    { k: "ns", t: "χ² is less than the critical value, so P > 0.05: the difference between the observed and expected numbers is not significant and is probably due to chance. Accept the null hypothesis." },
    { k: "sig", t: "χ² is greater than or equal to the critical value, so P ≤ 0.05: the difference is significant and unlikely to be due to chance alone. Reject the null hypothesis." },
    { k: "prove", t: "χ² is less than the critical value, so the expected ratio is proved correct." },
    { k: "wrong", t: "χ² is less than the critical value, so the difference is significant." },
  ];
  const rotate = (a, n) => a.map((_, i) => a[(i + n) % a.length]);
  let uidN = 0; const uid = () => "chi" + ++uidN;

  // ---------- generic stepper: each step is checked from the student's own entry ----------
  // step = { title, body, check(el) -> { ok, msg }, reveal(el) -> html, done?(el) }
  // a finished step shrinks to its title and feedback, so the current step stays beside the picture
  function stepper(box, steps) {
    box.innerHTML = steps.map((s, i) => `<div class="chi-step" data-s="${i}" ${i ? "hidden" : ""} style="margin:.35rem 0 .6rem"><p class="small" style="margin:.1rem 0 .3rem"><strong>${i + 1}. ${s.title}</strong></p><div data-body>${s.body}</div>
      <div class="row" style="gap:.4rem;margin-top:.35rem;flex-wrap:wrap"><button type="button" class="btn sm primary" data-a="check">Check</button><button type="button" class="btn sm" data-a="show" hidden>Show answer</button></div><div data-fb aria-live="polite"></div></div>`).join("");
    const els = $$(".chi-step", box);
    const finish = (i, html) => { const el = els[i]; $("[data-fb]", el).innerHTML = html; $$("input,select,button[data-a]", el).forEach((x) => (x.disabled = true)); $("[data-a=show]", el).hidden = true; $("[data-body]", el).hidden = true; $("[data-a=check]", el).parentElement.hidden = true; if (steps[i].done) steps[i].done(el); if (els[i + 1]) els[i + 1].hidden = false; };
    els.forEach((el, i) => {
      $("[data-a=check]", el).addEventListener("click", () => { const r = steps[i].check(el); if (r.ok) finish(i, fb("ok", "<strong>Correct.</strong> " + (r.msg || ""))); else { $("[data-fb]", el).innerHTML = fb(r.empty ? "neutral" : "neutral", r.msg); if (!r.empty) $("[data-a=show]", el).hidden = false; } });
      $("[data-a=show]", el).addEventListener("click", () => finish(i, fb("neutral", "<strong>Answer.</strong> " + steps[i].reveal(el))));
    });
  }
  const radios = (name, opts) => `<div role="radiogroup" style="display:flex;flex-direction:column;gap:.25rem">${opts.map((o, i) => `<label class="small" style="display:flex;gap:.4rem;align-items:flex-start"><input type="radio" name="${name}" value="${i}"><span>${o}</span></label>`).join("")}</div>`;
  const picked = (el) => { const r = $("input[type=radio]:checked", el); return r ? +r.value : null; };
  const lockRadios = (el, right) => $$("input[type=radio]", el).forEach((r) => { if (+r.value === right) r.closest("label").style.fontWeight = "700"; });

  // the χ², df, critical value and conclusion steps shared by every mode
  function testSteps(t, opts = {}) {
    const order = rotate(CONC, opts.rot || 0), right = order.findIndex((c) => c.k === (t.significant ? "sig" : "ns"));
    const dfOpts = Array.from({ length: 8 }, (_, i) => i + 1), critOpts = [...new Set([1, 2, 3, 4, t.df].flatMap((d) => M().SHOW[d]))].sort((a, b) => a - b);
    return [
      { title: "Calculate χ² = Σ (O − E)² ÷ E (to 2 decimal places).", body: `<label class="small">χ² = ${numBox('data-k="chi"', "your value of chi-squared")}</label>`,
        check: (el) => { const v = num($("[data-k=chi]", el)); if (!isFinite(v)) return { ok: false, empty: true, msg: "Work out χ² yourself, type it in, then press Check." }; const ok = M().nearChi(v, t.chi2); mark($("[data-k=chi]", el), ok); return ok ? { ok, msg: `χ² = ${M().fmt2(t.chi2)}.` } : { ok, msg: "<strong>Not quite.</strong> For each class work out (O − E)² ÷ E, then add them. Do not round the expected numbers." }; },
        reveal: () => `χ² = ${t.contrib.map((c) => M().fmt2(c)).join(" + ")} = ${M().fmt2(t.chi2)}.`, done: opts.onChi },
      { title: "How many degrees of freedom are there?", body: `<label class="small">Degrees of freedom <select data-k="df" style="${INPUT}"><option value="">choose…</option>${dfOpts.map((d) => `<option>${d}</option>`).join("")}</select></label>`,
        check: (el) => { const v = +$("[data-k=df]", el).value; if (!v) return { ok: false, empty: true, msg: "Choose a number." }; const ok = v === t.df; return ok ? { ok, msg: `${t.observed.length} categories − 1 = ${t.df}.` } : { ok, msg: "<strong>Not quite.</strong> Count the categories (classes of offspring) and subtract 1." }; },
        reveal: () => `Degrees of freedom = number of categories − 1 = ${t.observed.length} − 1 = ${t.df}.` },
      { title: "Use the table: what is the critical value at P = 0.05?", body: critTable(t.df) + `<label class="small">Critical value <select data-k="crit" style="${INPUT}"><option value="">choose…</option>${critOpts.map((c) => `<option>${c}</option>`).join("")}</select></label>`,
        check: (el) => { const v = $("[data-k=crit]", el).value; if (!v) return { ok: false, empty: true, msg: "Choose a value from the table." }; const ok = v === t.critShow; return ok ? { ok, msg: `The critical value for ${t.df} degree${t.df === 1 ? "" : "s"} of freedom at P = 0.05 is ${t.critShow}.` } : { ok, msg: "<strong>Not quite.</strong> Use the row for your degrees of freedom and the column for P = 0.05." }; },
        reveal: () => `Row ${t.df}, column P = 0.05: ${t.critShow}.` },
      { title: "Which conclusion is correct?", body: `<p class="small" style="margin:.1rem 0 .3rem">Null hypothesis: ${esc(t.nullText)}</p>` + radios(uid(), order.map((c) => esc(c.t))),
        check: (el) => { const v = picked(el); if (v === null) return { ok: false, empty: true, msg: "Choose one statement." }; const ok = v === right; if (ok) lockRadios(el, right);
          return ok ? { ok, msg: esc(t.decisionText) + (opts.after ? " " + opts.after() : "") } : { ok, msg: "<strong>Not quite.</strong> Compare χ² with the critical value. Remember that a statistical test never proves a hypothesis, and refers to the difference between observed and expected numbers." }; },
        reveal: (el) => { lockRadios(el, right); return esc(t.decisionText) + (opts.after ? " " + opts.after() : ""); } },
    ];
  }

  // working table: class, O, E, O − E, (O − E)², (O − E)²/E; inputs where the student must fill a column
  function workTable(t, labels, cols, id) {
    const c = (k) => cols.includes(k); const H = (s) => `<th scope="col">${s}</th>`;
    const rows = t.observed.map((o, i) => `<tr><th scope="row">${esc(labels[i])}</th><td>${o}</td>` +
      ["E", "d", "d2", "c"].map((k) => (c(k) ? `<td>${numBox(`data-cell="${k}${i}"`, `${{ E: "expected number", d: "O minus E", d2: "O minus E squared", c: "O minus E squared divided by E" }[k]} for ${labels[i]}`, "4.8rem")}</td>` : `<td data-out="${k}${i}"></td>`)).join("") + "</tr>").join("");
    return wide(`<table class="tbl small" id="${id}" style="margin:.3rem 0"><thead><tr>${H("Class")}${H("Observed, O")}${H("Expected, E")}${H("O − E")}${H("(O − E)²")}${H("(O − E)² ÷ E")}</tr></thead><tbody>${rows}</tbody><tfoot><tr><th scope="row" colspan="5" style="text-align:right">χ² = Σ (O − E)² ÷ E</th><td data-out="sum"></td></tr></tfoot></table>`);
  }
  const vals = (t, k, i) => ({ E: t.expected[i], d: t.diff[i], d2: t.diffSq[i], c: t.contrib[i] })[k];
  const nice = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? M().fmt2(x).replace(/\.00$/, "") : M().fmt2(x));
  const show = (t, k, i) => (k === "E" ? M().fmtE(t.expected[i]) : nice(vals(t, k, i)));
  const okCell = (t, k, i, v) => (k === "E" ? M().nearE(v, t.expected[i]) : k === "d" ? Math.abs(v - t.diff[i]) <= 0.05 + 1e-9 : M().nearChi(v, vals(t, k, i)) || Math.abs(v - vals(t, k, i)) <= 0.05);
  const fillOut = (host, t, k) => t.observed.forEach((_, i) => { const td = $(`[data-out="${k}${i}"]`, host); if (td) td.textContent = show(t, k, i); });
  const cellsStep = (t, cols, title) => ({ title, body: `<p class="tiny muted" style="margin:0">Fill in the ${cols.length > 1 ? "columns" : "column"} of the table, then check. Do not round the expected numbers.</p>`,
    check: (el) => { const host = el.closest("[data-chi-root]"); const vt = $("[data-r=views] [role=tab]", host); if (vt && vt.getAttribute("aria-selected") !== "true") vt.click(); let all = true, any = false; for (const k of cols) t.observed.forEach((_, i) => { const inp = $(`[data-cell="${k}${i}"]`, host); const v = num(inp); if (isFinite(v)) { any = true; const ok = okCell(t, k, i, v); mark(inp, ok); all = all && ok; } else all = false; });
      if (!any) return { ok: false, empty: true, msg: "Type your values into the table first." }; return all ? { ok: true } : { ok: false, msg: "<strong>Not quite.</strong> The cells marked in red are not right yet. E = total × the fraction of the ratio for that class." }; },
    reveal: (el) => { const host = el.closest("[data-chi-root]"); for (const k of cols) t.observed.forEach((_, i) => { const inp = $(`[data-cell="${k}${i}"]`, host); if (inp) { inp.value = show(t, k, i); mark(inp, true); inp.disabled = true; } }); return "The table now shows the values."; },
    done: (el) => { const host = el.closest("[data-chi-root]"); for (const k of cols) t.observed.forEach((_, i) => { const inp = $(`[data-cell="${k}${i}"]`, host); if (inp) inp.disabled = true; }); } });

  // =============================== Chi-squared Calculator ===============================
  B.interactives.chiCalculator = function (spec, host) {
    const modes = (spec.modes || ["guided", "practice", "own"]).filter((m) => ["guided", "practice", "own"].includes(m));
    const names = { guided: "Guided", practice: "Practice", own: "Your own data" };
    host.innerHTML = head(spec, "calculate and check") + `<div class="row" data-r="tabs" style="gap:.4rem;margin:.3rem 0" aria-label="Calculator mode"></div><div data-r="pane" data-chi-root></div>` + SIMPLE + qBlock(spec);
    const pane = $("[data-r=pane]", host);
    const presets = M().PRESETS.filter((p) => !spec.presets || spec.presets.includes(p.id));
    let seed = Math.floor(Math.random() * 1e6) + 1;
    const guided = (pi = 0) => { const p = presets[pi], t = M().test(p), id = uid();
      pane.innerHTML = B.ix.split(`<p class="small" style="margin:.2rem 0"><label>Data set <select data-r="preset" style="${INPUT}">${presets.map((x, i) => `<option value="${i}"${i === pi ? " selected" : ""}>${esc(x.title)}</option>`).join("")}</select></label></p>
        <p class="small" style="margin:.2rem 0">${esc(p.story)} Expected ratio ${M().ratioText(p.ratio)}; total ${t.N}.</p><p class="tiny muted" style="margin:0">${esc(p.source)}</p>${workTable(t, p.labels, ["E", "d", "d2", "c"], id)}`,
        `<div data-r="steps"></div>`, { label: "Guided chi-squared steps", cls: "ix-nosticky-sm" });
      $("[data-r=preset]", pane).addEventListener("change", (e) => guided(+e.target.value));
      const st = testSteps(t, { rot: pi, onChi: () => { $(`[data-out="sum"]`, pane).textContent = M().fmt2(t.chi2); } });
      stepper($("[data-r=steps]", pane), [cellsStep(t, ["E", "d", "d2", "c"], "Complete the table: E, O − E, (O − E)² and (O − E)² ÷ E for each class."), ...st]); };
    const practice = () => { const g = M().generate(seed, spec.practice || M().PRACTICE_IDS), t = M().test(g), id = uid();
      pane.innerHTML = B.ix.split(`<p class="small" style="margin:.2rem 0"><strong>Simulated data.</strong> ${g.story}</p><p class="small" style="margin:.2rem 0">Expected ratio ${M().ratioText(g.ratio)}; total ${t.N}.</p>${workTable(t, g.labels, [], id)}
        <div class="row" style="gap:.4rem"><button type="button" class="btn sm" data-a="new">New data set</button></div>`,
        `<p class="tiny muted" style="margin:0">Work on paper or a calculator; the table fills in as you go.</p><div data-r="steps"></div>`, { label: "Practice chi-squared steps", cls: "ix-nosticky-sm" });
      $("[data-a=new]", pane).addEventListener("click", () => { seed = (seed * 48271) % 2147483647; practice(); });
      const st = testSteps(t, { rot: seed % 4, onChi: () => { ["E", "d", "d2", "c"].forEach((k) => fillOut(pane, t, k)); $(`[data-out="sum"]`, pane).textContent = M().fmt2(t.chi2); }, after: () => esc(M().practiceNote(g, t.significant)) });
      stepper($("[data-r=steps]", pane), st); };
    const own = () => { let n = 2;
      const row = (i) => `<tr><td><input type="text" data-o="name${i}" aria-label="name of class ${i + 1}" placeholder="class ${i + 1}" style="${INPUT}width:${phone() ? "6.5rem" : "8rem"}"></td><td>${numBox(`data-o="obs${i}"`, `observed number in class ${i + 1}`, "5rem")}</td><td>${numBox(`data-o="rat${i}"`, `ratio part for class ${i + 1}`, "4rem")}</td></tr>`;
      pane.innerHTML = B.ix.split(`<p class="small" style="margin:.2rem 0">Enter the counts from your own cross, and the expected ratio from your genetic diagram (for 9:3:3:1, enter 9, 3, 3 and 1).</p>
        ${wide(`<table class="tbl small" style="margin:.3rem 0"><thead><tr><th scope="col">Class</th><th scope="col">Observed</th><th scope="col">Ratio part</th></tr></thead><tbody data-r="rows">${row(0)}${row(1)}</tbody></table>`)}
        <div class="row" style="gap:.4rem"><button type="button" class="btn sm" data-a="add">Add a class</button><button type="button" class="btn sm" data-a="rem">Remove a class</button></div><div data-r="out" aria-live="polite"></div>`,
        `<label class="small">Your χ² ${numBox('data-o="chi"', "your value of chi-squared")}</label><div class="row" style="gap:.4rem;margin-top:.4rem"><button type="button" class="btn sm primary" data-a="go">Check my working</button></div><div data-r="fb" aria-live="polite"></div>`, { label: "Your own data", cls: "ix-nosticky-sm" });
      const rows = $("[data-r=rows]", pane), out = $("[data-r=out]", pane), fbx = $("[data-r=fb]", pane);
      $("[data-a=add]", pane).addEventListener("click", () => { if (n >= 9) return; rows.insertAdjacentHTML("beforeend", row(n)); n++; });
      $("[data-a=rem]", pane).addEventListener("click", () => { if (n <= 2) return; rows.lastElementChild.remove(); n--; });
      $("[data-a=go]", pane).addEventListener("click", () => { out.innerHTML = "";
        const O = [], r = [], L = []; for (let i = 0; i < n; i++) { const o = num($(`[data-o="obs${i}"]`, pane)), q = num($(`[data-o="rat${i}"]`, pane)); if (!isFinite(o) || !isFinite(q)) { fbx.innerHTML = fb("neutral", "Fill in an observed number and a ratio part for every class."); return; } O.push(o); r.push(q); L.push(($(`[data-o="name${i}"]`, pane).value || "").trim() || "class " + (i + 1)); }
        const t = M().test({ observed: O, ratio: r, labels: L }); if (!t.ok) { fbx.innerHTML = fb("bad", "<strong>The test cannot be used here.</strong> " + esc(t.err)); return; }
        const lk = M().lockFor(O, r, spec.locks || []); if (lk) { fbx.innerHTML = fb("neutral", `<strong>These data belong to a question in ${esc(lk.where)}.</strong> Answer it there first; then you can check them here.`); return; }
        const v = num($('[data-o="chi"]', pane)); if (!isFinite(v)) { fbx.innerHTML = fb("neutral", "Work out χ² yourself first, type it in, then press Check my working."); return; }
        const ok = M().nearChi(v, t.chi2);
        fbx.innerHTML = fb(ok ? "ok" : "neutral", (ok ? "<strong>Your χ² is right.</strong> " : `<strong>Your χ² does not match.</strong> Compare your working with the table. `) + `Degrees of freedom = ${t.df}; critical value at P = 0.05 = ${t.critShow}. ${esc(t.decisionText)}`);
        out.innerHTML = workTable(t, L, [], uid()); ["E", "d", "d2", "c"].forEach((k) => fillOut(out, t, k)); $(`[data-out="sum"]`, out).textContent = M().fmt2(t.chi2); });
    };
    const fns = { guided: () => guided(0), practice, own };
    tabs($("[data-r=tabs]", host), modes.map((m) => names[m]), (i) => fns[modes[i]]());
    renderQs(spec, host);
  };

  // =============================== Genetic Data Challenge ===============================
  function diagram(s) {
    const e = M().enumerate(s.cross), al = s.al, L = s.cross.loci;
    const genoStr = (pairs) => pairs.map((p) => p.map(al).join("")).join("");
    const parentGeno = (p) => genoStr(p.map((pair, i) => (L[i].al.indexOf(pair[0]) <= L[i].al.indexOf(pair[1]) ? pair : [pair[1], pair[0]])));
    const uniq = (gs) => { const seen = new Set(); return gs.filter((g) => { const k = g.join(); if (seen.has(k)) return false; seen.add(k); return true; }); };
    const g1 = uniq(e.g1), g2 = uniq(e.g2), gam = (g) => g.map(al).join("");
    const nm = (k) => (s.names ? s.names[k] : k);
    const cell = (a, b) => { const geno = L.map((Lc, i) => (Lc.al.indexOf(a[i]) <= Lc.al.indexOf(b[i]) ? [a[i], b[i]] : [b[i], a[i]])); return `${genoStr(geno)}<br><span class="tiny muted">${esc(nm(s.cross.pheno(geno)))}</span>`; };
    const grid = `<table class="tbl small" style="margin:.3rem 0;text-align:center"><thead><tr><th scope="col"><span class="tiny">gametes</span></th>${g2.map((g) => `<th scope="col">${gam(g)}</th>`).join("")}</tr></thead><tbody>${g1.map((a) => `<tr><th scope="row">${gam(a)}</th>${g2.map((b) => `<td>${cell(a, b)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const counts = s.cross.classes.map((k, i) => `${esc(nm(k))} ${s.ratio[i]}`).join(" : ");
    return `<div style="margin-top:.4rem"><p class="small" style="margin:.2rem 0"><strong>Genetic diagram${s.nullLabel ? ", " + esc(s.nullLabel) : ""}</strong></p>
      <table class="tbl small" style="margin:.2rem 0"><tbody>
      <tr><th scope="row">Parental phenotypes</th><td style="white-space:normal">${esc(s.parents[0])} × ${esc(s.parents[1])}</td></tr>
      <tr><th scope="row">Parental genotypes</th><td style="white-space:normal">${parentGeno(s.cross.p1)} × ${parentGeno(s.cross.p2)}</td></tr>
      <tr><th scope="row">Gametes</th><td style="white-space:normal">${g1.map(gam).join(", ") === g2.map(gam).join(", ") ? g1.map(gam).join(", ") + " from each parent" : g1.map(gam).join(", ") + " and " + g2.map(gam).join(", ")}</td></tr></tbody></table>
      ${wide(grid)}<p class="small" style="margin:.2rem 0">Offspring phenotypes and expected ratio: ${counts}.</p></div>`;
  }
  B.interactives.geneticDataChallenge = function (spec, host) {
    const list = M().SCEN.filter((s) => !spec.scenarios || spec.scenarios.includes(s.id));
    host.innerHTML = head(spec, "work through the test") + `<p class="small" style="margin:.2rem 0"><label>Cross <select data-r="sc" style="${INPUT}">${list.map((s, i) => `<option value="${i}">${i + 1}. ${esc(s.title)}</option>`).join("")}</select></label></p><div data-r="pane" data-chi-root></div>` + SIMPLE + qBlock(spec);
    const pane = $("[data-r=pane]", host);
    const load = (si) => { const s = list[si], t = M().test({ observed: s.observed, ratio: s.ratio, labels: s.labels }), id = uid();
      const vA = uid(), vB = uid();
      pane.innerHTML = B.ix.split(`<p class="small" style="margin:.2rem 0">${s.story}</p><p class="tiny muted" style="margin:0">${esc(s.source)}</p>
        <div class="row ix-views" data-r="views" role="tablist" aria-label="View" style="gap:.4rem;margin:.3rem 0" hidden><button type="button" class="btn sm primary" role="tab" aria-controls="${vA}" aria-selected="true">Data and working</button><button type="button" class="btn sm" role="tab" aria-controls="${vB}" aria-selected="false" tabindex="-1">Genetic diagram</button></div>
        <div id="${vA}">${workTable(t, s.labels, ["E"], id)}</div><div id="${vB}" data-r="diag" hidden></div>`,
        `<div data-r="steps"></div>`, { label: "Genetic Data Challenge steps", cls: "ix-nosticky-sm" });
      const ropts = s.options.map((o) => o.join(":")), right = ropts.indexOf(s.ratio.join(":"));
      const ratioStep = { title: `Choose the expected ratio for the classes counted (${s.labels.map(esc).join(" : ")}).`, body: radios(uid(), ropts),
        check: (el) => { const v = picked(el); if (v === null) return { ok: false, empty: true, msg: "Choose a ratio." }; const ok = v === right; if (ok) lockRadios(el, right); return ok ? { ok, msg: `${ropts[right]}.` } : { ok, msg: "<strong>Not quite.</strong> Work out the gametes each parent can make, then the offspring of every combination." }; },
        reveal: (el) => { lockRadios(el, right); return `The expected ratio is ${ropts[right]}.`; },
        done: (el) => { $("[data-r=diag]", pane).innerHTML = diagram(s); const row = $("[data-r=views]", pane); row.hidden = false; showView = B.ix.viewTabs(row); showView(0); $("[data-fb]", el).insertAdjacentHTML("beforeend", `<p class="tiny muted" style="margin:.2rem 0 0">The genetic diagram is now in the Genetic diagram view.</p>`); } };
      let showView = null;
      const st = testSteps(t, { rot: si, onChi: () => { ["d", "d2", "c"].forEach((k) => fillOut(pane, t, k)); $(`[data-out="sum"]`, pane).textContent = M().fmt2(t.chi2); },
        after: () => `<br><strong>What this means.</strong> ${s.meaning}${s.stretch ? `<br><span class="tiny">${esc(s.stretch)}</span>` : ""}` });
      stepper($("[data-r=steps]", pane), [ratioStep, cellsStep(t, ["E"], `Calculate the expected number in each class (total ${t.N}).`), ...st]); };
    $("[data-r=sc]", host).addEventListener("change", (e) => load(+e.target.value));
    load(0); renderQs(spec, host);
  };
})(window.BIO);
