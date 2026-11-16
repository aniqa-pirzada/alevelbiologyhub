// Interactives for 3.2.7 Heart disease (Phase 4 Batch 3, owned by the 3.2.7 author). Kinds:
//   cvdAtheroma  (3.2.7.1) Atheroma Progression Explorer: stages of an artery wall developing atheroma, then thrombosis
//                or aneurysm. Drawings from B.cvdArt.wallLong / wallCross; stage text and the illustrative lumen areas
//                from B.cvdModel.STAGES, OUTCOMES and lumenPct.
//   (The Myocardial Infarction Explorer, cvdMI, was removed on 2026-11-15 at the teacher's request: coronary territories
//   are beyond the specification. 3.2.7.1 now has one clean front-view figure of a myocardial infarction instead.)
//   cvdRiskData  (3.2.7.2) Cardiovascular Risk Data Investigator: two real datasets (each cited) and two
//                hypothetical ones (labelled; Two towns is stretch), with calculations shown, a conclusion checker and marked questions.
//                There is deliberately no calculator for a student's own risk.
// Every embedded question is rendered with B.questions.render, so attempts are marked, recorded and count towards
// mastery. Controls are native buttons, radio buttons, selects and a range input (arrow keys work); tab rows use a
// roving tab stop (arrow keys, Home, End); results are announced in polite live regions. Nothing moves continuously;
// the short fade on change is skipped when reduced motion is requested. Layouts wrap and SVGs scale, so nothing scrolls
// sideways at 390 px. UI text uses theme tokens; drawings sit on the light figure panel in dark mode.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const A = () => B.cvdArt, M = () => B.cvdModel;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const renderQs = (qs, into) => (qs || []).forEach((q) => into.append(B.questions.render(q)));
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .2s"; node.style.opacity = "1"; }); };
  const WRAP = "display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;max-width:100%";
  const lvl = (l) => (l === "required" ? `<span class="badge teal">required</span>` : l === "stretch" ? `<span class="badge amber">stretch</span>` : `<span class="badge">supporting</span>`);
  const tagBadge = (tag) => (tag === "real" ? `<span class="badge teal">real data</span>` : `<span class="badge amber">hypothetical data</span>`);
  const tbl = (head, rows) => `<div style="max-width:100%;overflow-x:auto"><table class="tbl"><thead><tr>${head.map((x) => `<th scope="col">${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const src = (k) => { const s = M().SRC[k]; return `<p class="tiny muted">Source: <a href="${s.url}" target="_blank" rel="noopener">${esc(s.cite)}</a>.</p>`; };
  const n0 = (x) => Number(x).toLocaleString("en-GB");

  // Tab row with roving focus (arrow keys, Home, End)
  const tabs = (bar, labels, onShow, panes) => { let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === 0 ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"${panes && panes[i] ? ` aria-controls="${panes[i].id}"` : ""}>${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(0); return show; };

  // ======================================== A. Atheroma Progression Explorer ========================================
  // Release review (2026-11-15): four states only (healthy wall, atheroma, then thrombosis or an aneurysm), shown as one
  // row of buttons; the longitudinal section sits beside the controls, the transverse section and the text, so the
  // drawing and its explanation are on screen together. The static figures that repeated these drawings were removed.
  B.interactives.cvdAtheroma = function (spec, host) {
    const m = M(), S = m.STAGES, O = m.OUTCOMES; const uid = uidOf();
    const ST = [S.find((x) => x.k === "healthy"), S.find((x) => x.k === "plaque"), O.find((x) => x.k === "thrombosis"), O.find((x) => x.k === "aneurysm")];
    let cur = 0;
    host.innerHTML = head(spec, "schematic") + `<style>@container ix (max-width: 699px) { .at${uid} svg { min-width: 520px; } }</style>
      <div class="ix ix-wide-stage"><div class="ix-body"><div class="ix-stage"><div class="figure"><div class="fig-view at${uid}" id="at-long-${uid}" style="overflow-x:auto"></div></div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p></div><div class="ix-panel">
        <div class="row" role="group" aria-label="state of the artery" style="flex-wrap:wrap;gap:.35rem">${ST.map((x, i) => `<button type="button" class="btn sm" data-st="${i}" aria-pressed="false">${esc(x.label)}</button>`).join("")}</div>
        <div class="figure" style="max-width:190px"><div class="fig-view" id="at-cross-${uid}"></div></div>
        <div id="at-text-${uid}" aria-live="polite"></div>
      </div></div></div>
      <h4 class="mt">Questions</h4><div id="at-q-${uid}"></div>`;
    const $u = (k) => $(`#at-${k}-${uid}`, host);
    const draw = () => { const it = ST[cur];
      $u("long").innerHTML = A().wallLong({ stage: it.k });
      $u("cross").innerHTML = A().wallCross({ t: it.k === "thrombosis" ? 0.6 : it.k === "plaque" ? 0.5 : 0, blocked: it.k === "thrombosis", bulge: it.k === "aneurysm" });
      $u("text").innerHTML = `<p class="small" style="margin:0"><strong>${esc(it.label)}.</strong> ${esc(it.text)}</p>`;
      $$("[data-st]", host).forEach((b) => { const on = +b.dataset.st === cur; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("primary", on); });
      fade($u("long")); };
    $$("[data-st]", host).forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.st; draw(); }));
    renderQs(spec.questions, $u("q")); draw();
  };

  // ======================================== C. Cardiovascular Risk Data Investigator ========================================
  B.interactives.cvdRiskData = function (spec, host) {
    const items = spec.items || []; const uid = uidOf(); const m = M(), f = m.fix;
    host.innerHTML = head(spec, "real and hypothetical data") + `<div role="tablist" aria-label="datasets" id="rk-tabs-${uid}" style="${WRAP}"></div><div id="rk-body-${uid}" class="mt"></div>`;
    const body = $(`#rk-body-${uid}`, host);
    const panes = items.map((_, i) => { const d = document.createElement("div"); d.hidden = true; d.setAttribute("role", "tabpanel"); d.id = `rk-pane-${uid}-${i}`; d.tabIndex = 0; body.append(d); return d; });
    const built = new Set();
    const frame = (it, inner) => `<div class="card"><div style="${WRAP};justify-content:space-between"><h4 style="margin:0;color:var(--ink);min-width:0">${esc(it.title)}</h4>${tagBadge(it.tag)}</div><p class="small mt">${it.intro}</p>${inner}</div>
      ${(it.claims || []).length ? `<div class="card mt"><h4 style="margin:0 0 .3rem;color:var(--ink)">Evaluate the conclusions</h4><p class="small muted" style="margin:0">Decide whether each conclusion is supported by these data alone.</p><div data-r="claims"></div></div>` : ""}
      <h4 class="mt">Questions</h4><div data-r="q"></div>`;
    const VERD = [["yes", "Supported"], ["partly", "Partly: needs more evidence"], ["no", "Not supported"]];
    const claims = (pane, it) => { const box = $('[data-r="claims"]', pane); if (!box) return;
      box.innerHTML = it.claims.map((c, i) => `<div class="card mt" style="padding:.6rem .8rem" data-c="${i}"><p class="small" style="margin:0 0 .4rem"><strong>${esc(c.s)}</strong></p><div style="${WRAP}" role="group" aria-label="judge: ${esc(c.s)}">${VERD.map(([v, l]) => `<button type="button" class="btn sm" data-v="${v}" aria-pressed="false">${esc(l)}</button>`).join("")}</div><div class="small mt" data-r="fb" aria-live="polite"></div></div>`).join("");
      box.addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; const card = b.closest("[data-c]"); const c = it.claims[+card.dataset.c]; $$("button", card).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        const ok = b.dataset.v === c.v; const best = VERD.find(([v]) => v === c.v)[1];
        $('[data-r="fb"]', card).innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}"><strong>${ok ? "Well judged" : "Look again"}: ${esc(best.toLowerCase())}.</strong> ${esc(c.why)}</div>`; }); };
    const builders = {
      s4(pane, it) {
        const S = m.S4;
        pane.innerHTML = frame(it, `${tbl(["Outcome", "Placebo (2223 people)", "Drug (2221 people)"], [["All deaths", `${S.placebo.deaths}`, `${S.simva.deaths}`], ["Coronary deaths", `${S.placebo.coronary}`, `${S.simva.coronary}`], ["Major coronary event", `${S.placebo.major}`, `${S.simva.major}`]]) + `<p class="tiny muted">Counts over a median of ${S.years} years. Drug: simvastatin.</p>`}
          <div style="${WRAP}" class="mt"><label class="small">Outcome: <select data-c="k"><option value="coronary">Coronary deaths</option><option value="deaths">Deaths from any cause</option><option value="major">Major coronary events</option></select></label></div>
          <div class="figure mt"><div class="fig-view" data-r="icons"></div></div><div data-r="out" aria-live="polite"></div>
          <div class="notice small mt"><strong>Why a trial is stronger evidence.</strong> People were allocated to simvastatin or placebo at random, so other risk factors (age, smoking, diet) should be similar in the two groups. A difference in outcome can then be put down to the treatment, which lowered blood cholesterol. All the participants already had coronary heart disease and cholesterol of ${esc(S.chol)}, so the result applies most directly to people like them. The drug is named only because it is part of the published trial; you do not need to learn it.</div>${src("s4")}`);
        const pub = { coronary: S.rr.coronary, deaths: S.rr.deaths, major: S.rr.major };
        const draw = () => { const k = $('[data-c="k"]', pane).value; const c = m.s4Calc(k); const r = pub[k];
          $('[data-r="icons"]', pane).innerHTML = A().iconArray({ k });
          $('[data-r="out"]', pane).innerHTML = `<ul class="small"><li>Placebo: ${S.placebo[k]} ÷ ${S.placebo.n} × 100 = <strong>${f(c.p, 1)} %</strong>; simvastatin: ${S.simva[k]} ÷ ${S.simva.n} × 100 = <strong>${f(c.s, 1)} %</strong>.</li>
            <li><strong>Absolute risk reduction</strong> = ${f(c.p, 1)} − ${f(c.s, 1)} = <strong>${f(c.abs, 1)} percentage points</strong>, about ${f(c.per1000, 0)} fewer people affected per 1000 treated over the trial.</li>
            <li><strong>Relative risk</strong> = ${f(c.s, 2)} ÷ ${f(c.p, 2)} = <strong>${f(c.rel, 2)}</strong>, a relative reduction of about ${f(c.relRed, 0)} %. The trial reported ${f(r[0], 2)} (95 % confidence interval ${f(r[1], 2)} to ${f(r[2], 2)}), calculated by a method that also uses <em>when</em> each event happened, so it differs slightly from this simple ratio.</li>
            <li>A headline such as "a ${f(c.relRed, 0)} % reduction" sounds larger than "${f(c.per1000, 0)} fewer in every 1000 people over five years". Both describe the same result.</li></ul>`; fade($('[data-r="icons"]', pane)); };
        pane.addEventListener("change", draw); draw();
      },
      unal(pane, it) {
        const U = m.UNAL;
        pane.innerHTML = frame(it, `<div class="figure"><div class="fig-view">${A().unalChart()}</div></div>
          <ul class="small"><li>Deaths prevented by falls in risk factors (model estimate) ≈ ${n0(U.fewer)} × ${U.riskPct} ÷ 100 = <strong>${n0(Math.round(U.riskDeaths))}</strong>.</li><li>By treatments ≈ ${n0(U.fewer)} × ${U.treatPct} ÷ 100 = <strong>${n0(Math.round(U.treatDeaths))}</strong>.</li></ul>
          <div class="notice small mt"><strong>Trend data.</strong> A national trend shows what happened to a whole population over time. Many things changed at once (smoking, diet, blood pressure, treatment, diagnosis), so a trend alone cannot show which change caused the fall. The researchers combined the trend with evidence from trials and cohort studies in a computer model; the shares are estimates that depend on the model's assumptions.</div>${src("unal")}`);
      },
      towns(pane, it) {
        const TW = m.TOWNS; let split = false; const tp = m.townTot("P"), tq = m.townTot("Q");
        pane.innerHTML = frame(it, `<div class="figure"><div class="fig-view" data-r="chart"></div></div><div data-r="t"></div>
          <div style="${WRAP}" class="mt"><button type="button" class="btn sm primary" data-a="split" aria-pressed="false">Split by age group</button></div><div data-r="out" class="mt" aria-live="polite"></div>`);
        const draw = () => { const rows = [];
          const row = (lab, x) => [esc(lab), n0(x.n), String(x.cases), `<strong>${f(m.rate(x.cases, x.n), 1)}</strong>`];
          if (!split) { rows.push(row("Town P", tp), row("Town Q", tq)); }
          else TW.groups.forEach((g, i) => { rows.push(row(`P, ${g}`, TW.P.rows[i]), row(`Q, ${g}`, TW.Q.rows[i])); });
          $('[data-r="t"]', pane).innerHTML = tbl(["Town, age", "People", "Cases in 5 years", "Rate per 1000"], rows);
          $('[data-r="chart"]', pane).innerHTML = A().townChart(split);
          const pOld = m.pct(TW.P.rows[1].n, tp.n), qOld = m.pct(TW.Q.rows[1].n, tq.n);
          $('[data-r="out"]', pane).innerHTML = split ? `<div class="feedback neutral small"><strong>Within each age group, Town Q has the higher rate</strong> (${f(m.rate(TW.Q.rows[0].cases, TW.Q.rows[0].n), 1)} v ${f(m.rate(TW.P.rows[0].cases, TW.P.rows[0].n), 1)} per 1000 at 45–64; ${f(m.rate(TW.Q.rows[1].cases, TW.Q.rows[1].n), 1)} v ${f(m.rate(TW.P.rows[1].cases, TW.P.rows[1].n), 1)} at 65 and over). Town P looked worse only because ${f(pOld, 0)} % of its people are 65 or over, against ${f(qOld, 0)} % in Town Q, and CHD is much more common in older people. Age is a confounding variable here.</div>` : `<p class="small">All ages together, Town P's rate is ${f(m.rate(tp.cases, tp.n), 1)} per 1000 and Town Q's is ${f(m.rate(tq.cases, tq.n), 1)} per 1000. Does Town P have a less healthy way of life? Split the data by age before you decide.</p>`;
          const b = $('[data-a="split"]', pane); b.setAttribute("aria-pressed", String(split)); b.textContent = split ? "Combine the age groups again" : "Split by age group"; fade($('[data-r="t"]', pane)); };
        $('[data-a="split"]', pane).addEventListener("click", () => { split = !split; draw(); }); draw();
      },
      bp(pane, it) {
        const R = m.BPCOH.rows; const adj = {};
        pane.innerHTML = frame(it, `<div class="figure"><div class="fig-view" data-r="chart"></div></div><div data-r="t"></div>
          <p class="small mt">The highest band has only ${n0(R[R.length - 1].n)} people, so one case more or fewer changes its rate by ${f(1000 / R[R.length - 1].n, 1)} per 1000: rates from small groups are less reliable.</p>`);
        const draw = () => { const rows = R.map((r, i) => { const c = r.cases + (adj[i] || 0); const rt = m.rate(c, r.n); return [`${esc(r.band)}`, n0(r.n), `${c}${adj[i] ? " *" : ""}`, `<strong>${f(rt, 1)}</strong>`, f(rt / m.rate(R[0].cases, R[0].n), 2), `${f(100 - m.pct(c, r.n), 1)} %`]; });
          $('[data-r="t"]', pane).innerHTML = tbl(["Systolic pressure / mmHg", "People", "New CHD cases", "Rate per 1000", "Relative to below 120", "No CHD in 10 years"], rows);
          $('[data-r="chart"]', pane).innerHTML = A().bpChart(adj); };
        draw();
      },
    };
    const buildAll = (i) => { if (!built.has(i)) { const it = items[i]; (builders[it.id] || ((p) => (p.innerHTML = frame(it, ""))))(panes[i], it); claims(panes[i], it); renderQs(it.questions, $('[data-r="q"]', panes[i])); built.add(i); } };
    items.forEach((_, i) => buildAll(i)); // every dataset is built now, so all their questions move to Check yourself together
    tabs($(`#rk-tabs-${uid}`, host), items.map((x) => x.label), (i) => { buildAll(i); panes.forEach((p, k) => (p.hidden = k !== i)); fade(panes[i]); }, panes);
  };
})(window.BIO);
