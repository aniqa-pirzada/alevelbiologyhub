// Interactives for 3.2.1 The causes of disease. Kinds: disEntry and disMechanism (3.2.1.1); disRiskData and disEpi
// (3.2.1.2). Every number on screen is calculated here from B.diseaseModel (data/content/_disease-art.js), the same
// data used for the answers to the embedded questions. Embedded questions are rendered with B.questions.render, so
// attempts are marked, recorded and count towards mastery. All controls are native buttons, selects and radio
// buttons; tab rows use a roving tab stop (arrow keys, Home, End); the body diagram's zones are focusable and respond
// to Enter and Space. Nothing animates when reduced motion is requested. Layouts wrap (flex-wrap, max-width:100%) so
// nothing scrolls horizontally at 390 px. Text uses the theme tokens (var(--ink) etc.); drawings sit on light panels.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store && B.store.get().prefs) || {}).reducedMotion;
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div><p class="small muted">${esc(spec.note || "")}</p>`;
  const M = () => B.diseaseModel, A = () => B.diseaseArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const fade = (node) => { if (!node || reduced()) return; node.style.opacity = "0"; node.style.transition = "none"; requestAnimationFrame(() => { node.style.transition = "opacity .2s"; node.style.opacity = "1"; }); };
  const WRAP = "display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;max-width:100%";
  const tagBadge = (tag) => tag === "real" ? `<span class="badge teal">real data</span>` : `<span class="badge amber">hypothetical data</span>`;
  const tbl = (head, rows) => `<div style="max-width:100%;overflow-x:auto"><table class="tbl"><thead><tr>${head.map((x) => `<th scope="col">${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  // Italicise only a genus and species binomial at the start of a name (Vibrio cholerae, Escherichia coli O157);
  // virus common names (Influenza virus, Poliovirus, HIV) stay roman.
  const sci = (s) => { const t = String(s); if (/virus/i.test(t)) return esc(t); const m = t.match(/^([A-Z][a-z]+ [a-z]+)(.*)$/); return m ? `<em>${esc(m[1])}</em>${esc(m[2])}` : esc(t); };
  // Specification status of a named pathogen (teacher decisions d30/d31): only cholera (3.2.3) and HIV (3.2.4) are
  // named in the specification; every other example carries a stretch and challenge badge.
  const SC = `<span class="badge navy" title="beyond the specification: an example, not something to learn">stretch and challenge</span>`;
  const specBadge = (x) => x.spec ? `<span class="badge teal" title="named in the specification">on the specification: ${esc(x.spec)}</span>` : SC;
  const SCKEY = `<p class="tiny muted" style="margin:.3rem 0 0"><span class="badge navy">stretch and challenge</span> beyond the specification: an example to show the idea, not something to learn. <span class="badge teal">on the specification</span> named in the specification (cholera, 3.2.3; HIV, 3.2.4).</p>`;
  const src = (k) => { const s = M().SRC[k]; return `<p class="tiny muted">Source: <a href="${s.url}" target="_blank" rel="noopener">${esc(s.cite)}</a>.</p>`; };

  // Tabs with roving focus
  const tabs = (host, id, labels, onShow, panes) => {
    const bar = $(`#${id}`, host); let cur = 0;
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm" role="tab" id="${id}-t${i}" data-i="${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"${panes && panes[i] ? ` aria-controls="${panes[i].id}"` : ""}>${esc(l)}</button>`).join("");
    (panes || []).forEach((p, i) => p.setAttribute("aria-labelledby", `${id}-t${i}`));
    const show = (i, focus) => { cur = Math.max(0, Math.min(labels.length - 1, i)); $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", k === cur); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }; let ni = null; if (e.key in map) ni = cur + map[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(0); return show;
  };
  const panesFor = (body, n, uid, pre) => Array.from({ length: n }, (_, i) => { const d = document.createElement("div"); d.hidden = true; d.setAttribute("role", "tabpanel"); d.id = `${pre}-${uid}-${i}`; d.tabIndex = 0; body.append(d); return d; });

  // ======================================== A. Pathogen Entry Explorer ========================================
  B.interactives.disEntry = function (spec, host) {
    const items = spec.items || []; const uid = uidOf(); const Z = A().ZONES;
    host.innerHTML = head(spec, "explore the interfaces") + `
      <div class="grid grid-2 mt" style="align-items:start">
        <div style="min-width:0"><div class="figure"><div class="fig-view" id="en-fig-${uid}">${A().interfacesFig({ hot: true, keys: items.map((x) => x.zone) })}</div></div>
          <p class="tiny muted">Each coloured system and its label is a button: Tab to it and press Enter or Space, or use the row of buttons.</p></div>
        <div style="min-width:0"><div role="tablist" aria-label="interfaces" id="en-tabs-${uid}" style="${WRAP}"></div><div id="en-body-${uid}" class="mt"></div></div>
      </div>`;
    const body = $(`#en-body-${uid}`, host), fig = $(`#en-fig-${uid}`, host);
    const panes = panesFor(body, items.length, uid, "en-pane");
    const built = new Set();
    const build = (i) => {
      const it = items[i], z = Z[it.zone], pane = panes[i];
      pane.innerHTML = `<div class="card"><div style="${WRAP};justify-content:space-between"><h4 style="margin:0;color:var(--ink)">${esc(it.title)}</h4><span class="badge ${it.level === "required" ? "teal" : ""}">${esc(it.level)}</span></div>
        <p class="small mt"><strong>Why pathogens can cross it.</strong> ${esc(it.why)}</p>
        <h5 class="small mt" style="margin-bottom:.3rem">Checked examples</h5>${SCKEY}
        ${it.examples.map((x) => `<div class="card mt" style="padding:.6rem .8rem;border-left:4px solid ${z.c}"><div style="${WRAP}"><strong class="small">${sci(x.name)}</strong><span class="badge ${x.type === "virus" ? "amber" : "sage"}">${esc(x.type)}</span>${specBadge(x)}</div><p class="small" style="margin:.3rem 0 0"><strong>Route:</strong> ${esc(x.route)}</p><p class="small" style="margin:.2rem 0 0"><strong>What it does:</strong> ${esc(x.effect)}</p></div>`).join("")}
        <p class="small mt"><span class="badge">supporting</span> <strong>Defences.</strong> ${esc(it.defences)}</p></div>
        <h4 class="mt">Explain what you see</h4><div data-r="q"></div>`;
      (it.questions || []).forEach((q) => $('[data-r="q"]', pane).append(B.questions.render(q)));
    };
    let showTab;
    const highlight = (k) => $$("[data-zone]", fig).forEach((g) => { const on = g.dataset.zone === k; g.style.opacity = on ? "1" : "0.45"; g.setAttribute("aria-pressed", on); });
    showTab = tabs(host, `en-tabs-${uid}`, items.map((x) => x.title), (i) => { if (!built.has(i)) { build(i); built.add(i); } panes.forEach((p, k) => (p.hidden = k !== i)); highlight(items[i].zone); fade(panes[i]); }, panes);
    const pick = (g) => { const i = items.findIndex((x) => x.zone === g.dataset.zone); if (i >= 0) showTab(i); };
    $$("[data-zone]", fig).forEach((g) => { g.addEventListener("click", () => pick(g)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g); g.focus(); } }); });
  };

  // ======================================== B. Disease Mechanism Challenge ========================================
  B.interactives.disMechanism = function (spec, host) {
    const cases = spec.items || [], cats = spec.categories || [], myths = spec.myths || []; const uid = uidOf();
    const catLabel = (k) => { const c = cats.find((x) => x.k === k) || {}; return (c.label || k) + (c.stretch ? " (stretch and challenge)" : ""); };
    const done = new Map(); let cur = 0;
    host.innerHTML = head(spec, "case by case") + `
      <div class="card">${SCKEY}<div style="${WRAP}" class="mt"><label class="small" for="mc-sel-${uid}">Case:</label><select id="mc-sel-${uid}">${cases.map((c, i) => `<option value="${i}">${i + 1}. ${esc(c.label)}</option>`).join("")}</select>
        <button type="button" class="btn sm" id="mc-prev-${uid}" aria-label="previous case">← Previous</button><button type="button" class="btn sm" id="mc-next-${uid}" aria-label="next case">Next →</button></div>
        <div id="mc-case-${uid}" class="mt"></div>
        <fieldset class="mt" style="border:0;padding:0;margin:0;min-width:0"><legend class="small"><strong>Which description fits this case best?</strong></legend><div id="mc-opts-${uid}"></div></fieldset>
        <div style="${WRAP}" class="mt"><button type="button" class="btn sm primary" id="mc-check-${uid}">Check</button></div>
        <div id="mc-fb-${uid}" class="mt" aria-live="polite"></div>
        <p class="small muted mt" id="mc-score-${uid}" aria-live="polite"></p></div>
      <div class="card mt"><h4>Generalisation check</h4><p class="small">Is each statement true or false? Sweeping claims about all bacteria or all viruses usually fail. ${SC} The examples in the feedback are stretch and challenge examples.</p><div id="mc-myths-${uid}"></div></div>
      <h4 class="mt">Questions on the challenge</h4><div id="mc-q-${uid}"></div>`;
    const $u = (k) => $(`#mc-${k}-${uid}`, host);
    const score = () => { const n = done.size, best = [...done.values()].filter((v) => v === "best").length; $u("score").textContent = `Cases checked: ${n} of ${cases.length}. Best answer on the first try: ${best}.`; };
    const show = (i) => {
      cur = (i + cases.length) % cases.length; const c = cases[cur]; $u("sel").value = String(cur);
      $u("case").innerHTML = `<div style="${WRAP}"><h4 style="margin:0;color:var(--ink)">${esc(c.label)}: ${sci(c.name)}</h4>${specBadge(c)}</div><p class="tiny muted" style="margin:.2rem 0">Enters through: ${esc(c.via)}</p><p class="small">${esc(c.story)}</p>`;
      $u("opts").innerHTML = cats.map((k, j) => `<label class="opt" style="display:flex;gap:.5rem;align-items:flex-start"><input type="radio" name="mc-${uid}" value="${k.k}"${j === 0 ? "" : ""}> <span>${esc(k.label)}${k.stretch ? " " + SC : ""}</span></label>`).join("");
      $u("fb").innerHTML = ""; fade($u("case"));
    };
    $u("check").addEventListener("click", () => {
      const c = cases[cur]; const sel = $(`input[name="mc-${uid}"]:checked`, host);
      if (!sel) { $u("fb").innerHTML = `<div class="feedback neutral small">Choose one description first.</div>`; return; }
      const v = sel.value, best = v === c.best, ok = (c.accept || [c.best]).includes(v);
      if (!done.has(c.id)) done.set(c.id, best ? "best" : ok ? "ok" : "miss");
      $u("fb").innerHTML = `<div class="feedback ${best ? "ok" : ok ? "neutral" : "bad"} small"><strong>${best ? "Best answer." : ok ? "Defensible, but not the best fit." : "Not the best fit."}</strong> Best description: <strong>${esc(catLabel(c.best))}</strong>${(c.accept || []).length > 1 ? ` (also defensible: ${c.accept.filter((k) => k !== c.best).map((k) => esc(catLabel(k))).join("; ")})` : ""}.<br>${esc(c.why)}</div>`;
      score();
    });
    $u("sel").addEventListener("change", (e) => show(+e.target.value));
    $u("prev").addEventListener("click", () => show(cur - 1)); $u("next").addEventListener("click", () => show(cur + 1));
    $u("myths").innerHTML = myths.map((m, i) => `<div class="card mt" style="padding:.6rem .8rem" data-m="${i}"><p class="small" style="margin:0 0 .4rem"><strong>${esc(m.s)}</strong></p><div style="${WRAP}" role="group" aria-label="true or false: ${esc(m.s)}"><button type="button" class="btn sm" data-v="true" aria-pressed="false">True</button><button type="button" class="btn sm" data-v="false" aria-pressed="false">False</button></div><div class="small mt" data-r="fb" aria-live="polite"></div></div>`).join("");
    $u("myths").addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; const card = b.closest("[data-m]"); const m = myths[+card.dataset.m]; const said = b.dataset.v === "true"; $$("button", card).forEach((x) => x.setAttribute("aria-pressed", x === b)); $('[data-r="fb"]', card).innerHTML = `<div class="feedback ${said === m.t ? "ok" : "bad"}"><strong>${said === m.t ? "Correct" : "Not quite"}: this statement is ${m.t ? "true" : "false"}.</strong> ${esc(m.why)}</div>`; });
    (spec.questions || []).forEach((q) => $u("q").append(B.questions.render(q)));
    show(0); score();
  };

  // ======================================== C. Risk Factor Data Investigator ========================================
  B.interactives.disRiskData = function (spec, host) {
    const items = spec.items || []; const uid = uidOf(); const m = M(), f = m.fix;
    host.innerHTML = head(spec, "real and hypothetical data") + `<div role="tablist" aria-label="datasets" id="rd-tabs-${uid}" style="${WRAP}"></div><div id="rd-body-${uid}" class="mt"></div>`;
    const body = $(`#rd-body-${uid}`, host); const panes = panesFor(body, items.length, uid, "rd-pane"); const built = new Set();
    const frame = (it, inner) => `<div class="card"><div style="${WRAP};justify-content:space-between"><h4 style="margin:0;color:var(--ink);min-width:0">${esc(it.title)}</h4>${tagBadge(it.tag)}</div><p class="small mt">${esc(it.intro)}</p>${inner}</div><h4 class="mt">Questions on this dataset</h4><div data-r="q"></div>`;
    const builders = {
      doll(pane, it) {
        const D = m.DOLL, nv = m.dollRow("never");
        pane.innerHTML = frame(it, `<div style="${WRAP}"><label class="small">Cause of death: <select data-c="dis"><option value="lung">Lung cancer</option><option value="ihd">Ischaemic heart disease</option><option value="all">All causes</option></select></label>
          <fieldset style="border:0;padding:0;margin:0;min-width:0"><legend class="sr-only">measure</legend><span class="small">Show: </span><label class="small"><input type="radio" name="rd-v-${uid}" value="r1000" checked> rate per 1000</label> <label class="small"><input type="radio" name="rd-v-${uid}" value="r100k"> rate per 100,000</label> <label class="small"><input type="radio" name="rd-v-${uid}" value="rel"> relative to non-smokers</label> <label class="small"><input type="radio" name="rd-v-${uid}" value="exc"> excess over non-smokers</label></fieldset></div>
          <div class="figure mt"><div class="fig-view" data-r="chart"></div></div><div data-r="table"></div><p class="small" data-r="how" aria-live="polite"></p>${src("doll")}`);
        const draw = () => {
          const dis = $('[data-c="dis"]', pane).value, v = $(`input[name="rd-v-${uid}"]:checked`, pane).value; const base = nv[dis];
          const calc = (r) => v === "r1000" ? r[dis] : v === "r100k" ? r[dis] * 100 : v === "rel" ? r[dis] / base : r[dis] - base;
          const dp = v === "r100k" ? 0 : 2; const vals = D.rows.map((r) => +f(calc(r), dp));
          const name = { lung: "Lung cancer", ihd: "Ischaemic heart disease", all: "All causes" }[dis];
          const unit = { r1000: "deaths per 1000 men per year", r100k: "deaths per 100,000 men per year", rel: "rate ÷ lifelong non-smokers' rate", exc: "extra deaths per 1000 per year" }[v];
          const mn = Math.min(0, ...vals);
          $('[data-r="chart"]', pane).innerHTML = A().barChart({ title: `${name}: ${unit}`, sub: "Male British doctors 1951–2001, age-standardised", vals: vals.map((x) => Math.max(0, x)), cats: ["Lifelong|non-smokers", "Former|smokers", "Current|(all)", "Current|1–14 a day", "Current|15–24 a day", "Current|25+ a day"], colors: ["#7fa7c9", "#9bb8a4", "#b4504f", "#d99a8f", "#c4766b", "#8f3a30"], yLabel: unit.length > 34 ? "value" : unit, fmt: (x) => x.toFixed(dp), alt: `${name}, ${unit}: ${D.rows.map((r, i) => `${r.label} ${vals[i].toFixed(dp)}`).join("; ")}` });
          $('[data-r="table"]', pane).innerHTML = tbl(["Smoking habit", `${name}: ${unit}`], D.rows.map((r, i) => [esc(r.label), `<strong>${vals[i].toFixed(dp)}</strong>`]));
          $('[data-r="how"]', pane).innerHTML = { r1000: `Rates are as published (per 1000 men per year).`, r100k: `Rate per 100,000 = rate per 1000 × 100 (e.g. ${base} × 100 = ${f(base * 100, 0)}).`, rel: `Relative to non-smokers = group's rate ÷ ${base} (lifelong non-smokers). A value of 1 means no difference.`, exc: `Excess = group's rate − ${base}. This is the absolute difference: extra deaths per 1000 men per year.` }[v] + (mn < 0 ? " Negative values are shown as zero on the chart." : "");
          fade($('[data-r="chart"]', pane));
        };
        pane.addEventListener("change", (e) => { if (e.target.matches('[data-c="dis"], input[type=radio]')) draw(); }); draw();
      },
      peto(pane, it) {
        const PR = m.PETO.rows, cont = PR[0].risk;
        pane.innerHTML = frame(it, `<div class="figure"><div class="fig-view">${A().petoChart()}</div></div><div style="${WRAP}"><label class="small">Compare continued smoking with: <select data-c="age">${PR.slice(1).map((r, i) => `<option value="${i + 1}">${esc(r.label.toLowerCase())}</option>`).join("")}</select></label></div><div data-r="out" class="mt" aria-live="polite"></div><p class="small muted">${esc(m.PETO.neverNote)}</p>${src("peto")}`);
        const draw = () => { const k = +$('[data-c="age"]', pane).value, r = PR[k]; const ab = cont - r.risk, rel = (100 * ab) / cont;
          $('[data-r="out"]', pane).innerHTML = `<ul class="small"><li>Risk by 75: continued <strong>${cont} %</strong>; ${esc(r.label.toLowerCase())} <strong>${r.risk.toFixed(1)} %</strong>.</li><li>Absolute reduction = ${cont} − ${r.risk.toFixed(1)} = <strong>${f(ab, 1)} percentage points</strong> (about ${f(ab * 10, 0)} fewer deaths per 1000 men).</li><li>Relative reduction = ${f(ab, 1)} ÷ ${cont} × 100 = <strong>${f(rel, 1)} %</strong>.</li><li>Out of 1000 such men: about ${f(cont * 10, 0)} deaths if all continued, about ${f(r.risk * 10, 0)} if all stopped at this age.</li></ul>`; };
        pane.addEventListener("change", draw); draw();
      },
      interheart(pane, it) {
        const rows = m.INTERHEART.rows;
        pane.innerHTML = frame(it, `<div class="figure"><div class="fig-view">${A().orChart()}</div></div><div style="${WRAP}"><label class="small">Interpret: <select data-c="f">${rows.map((r, i) => `<option value="${i}">${esc(r.label)}</option>`).join("")}</select></label></div><div data-r="out" class="mt" aria-live="polite"></div>
          <p class="small muted">${esc(m.INTERHEART.unplotted || "")}</p><div class="notice small mt"><strong>Reading odds ratios.</strong> 1 = no difference between cases and controls. Above 1: the factor was more common in people who had had a heart attack; below 1: less common. Odds ratios from a case-control study show association, not cause: exposures were measured after the heart attack, and people with one factor often have others.</div>${src("interheart")}`);
        const draw = () => { const r = rows[+$('[data-c="f"]', pane).value]; const s = r.or >= 1 ? `about <strong>${f(r.or, 2)} times</strong> the odds (${f((r.or - 1) * 100, 0)} % higher)` : `about <strong>${f((1 - r.or) * 100, 0)} % lower</strong> odds`;
          $('[data-r="out"]', pane).innerHTML = `<p class="small"><strong>${esc(r.label)}</strong> (odds ratio ${f(r.or, 2)}): ${esc(r.who || "people with this factor")} had ${s} of having had a first heart attack, compared with ${esc(r.vs || "people without this factor")}.</p>`; };
        pane.addEventListener("change", draw); draw();
      },
      coffee(pane, it) {
        const C = m.COFFEE; let split = false;
        pane.innerHTML = frame(it, `<div data-r="t"></div><div style="${WRAP}" class="mt"><button type="button" class="btn sm primary" data-a="split" aria-pressed="false">Split by smoking status</button></div><div data-r="out" class="mt" aria-live="polite"></div>`);
        const row = (lab, g) => { const rc = m.rate(g.coffee.cases, g.coffee.n), rn = m.rate(g.none.cases, g.none.n); return [esc(lab), `${g.coffee.cases} / ${g.coffee.n.toLocaleString("en-GB")}`, f(rc, 2), `${g.none.cases} / ${g.none.n.toLocaleString("en-GB")}`, f(rn, 2), `<strong>${f(rc / rn, 2)}</strong>`]; };
        const draw = () => { const H = ["Group", "Coffee: cases / people", "Rate per 1000", "No coffee: cases / people", "Rate per 1000", "Relative risk"];
          const rows = [row("Everyone", C.crude), ...(split ? C.strata.map((s) => row(s.label, s)) : [])];
          $('[data-r="t"]', pane).innerHTML = tbl(H, rows); const pc = m.pctOf(C.strata[0].coffee.n, C.crude.coffee.n), pn = m.pctOf(C.strata[0].none.n, C.crude.none.n);
          $('[data-r="out"]', pane).innerHTML = split ? `<div class="feedback neutral small"><strong>Within each smoking group the relative risk is 1.00:</strong> coffee makes no difference. ${f(pc, 1)} % of coffee drinkers smoke, against ${f(pn, 1)} % of non-drinkers, so the combined figures mix mostly smokers with mostly non-smokers. Smoking is the confounder.</div>` : `<p class="small">Everyone together: coffee drinkers appear to have <strong>${f(m.rate(C.crude.coffee.cases, C.crude.coffee.n) / m.rate(C.crude.none.cases, C.crude.none.n), 2)} times</strong> the rate of lung cancer. Is coffee the cause? Split the data to find out.</p>`;
          $('[data-a="split"]', pane).setAttribute("aria-pressed", split); $('[data-a="split"]', pane).textContent = split ? "Combine the groups again" : "Split by smoking status"; fade($('[data-r="t"]', pane)); };
        $('[data-a="split"]', pane).addEventListener("click", () => { split = !split; draw(); }); draw();
      },
      sample(pane, it) {
        const S0 = m.SAMPLE; const add = { small: 0, large: 0 };
        pane.innerHTML = frame(it, `<div class="grid grid-2" data-r="cards"></div><div style="${WRAP}" class="mt"><button type="button" class="btn sm" data-a="reset">Reset both studies</button></div><p class="small mt" data-r="out" aria-live="polite"></p>`);
        const card = (key) => { const s = S0[key]; const a = { n: s.active.n, cases: s.active.cases + add[key] }; const pa = m.pctOf(a.cases, a.n), pi = m.pctOf(s.inactive.cases, s.inactive.n);
          return `<div class="card" style="min-width:0"><h5 style="margin:0 0 .3rem;color:var(--ink)">${esc(s.label)}: ${(s.active.n + s.inactive.n).toLocaleString("en-GB")} people</h5>${tbl(["Group", "CHD cases / people"], [["Active", `${a.cases} / ${a.n.toLocaleString("en-GB")} (${f(pa, 1)} %)`], ["Inactive", `${s.inactive.cases} / ${s.inactive.n.toLocaleString("en-GB")} (${f(pi, 1)} %)`]])}<p class="small">Relative risk (active ÷ inactive) = <strong>${f(pa / pi, 2)}</strong>${add[key] ? ` (${add[key]} case${add[key] === 1 ? "" : "s"} added)` : ""}</p><button type="button" class="btn sm" data-add="${key}">Add one case to the active group</button></div>`; };
        const draw = (focusKey) => { $('[data-r="cards"]', pane).innerHTML = card("small") + card("large"); const rs = (k) => m.pctOf(S0[k].active.cases + add[k], S0[k].active.n) / m.pctOf(S0[k].inactive.cases, S0[k].inactive.n); const r0 = (k) => m.pctOf(S0[k].active.cases, S0[k].active.n) / m.pctOf(S0[k].inactive.cases, S0[k].inactive.n);
          $('[data-r="out"]', pane).innerHTML = (add.small || add.large) ? `Change in relative risk from the original: Study S ${f(r0("small"), 2)} → ${f(rs("small"), 2)}; Study L ${f(r0("large"), 2)} → ${f(rs("large"), 2)}. In a small study each person has a large effect on the result.` : "Both studies point the same way, but how much would each result change if one more active person had developed CHD?";
          if (focusKey) { const b = $(`[data-add="${focusKey}"]`, pane); if (b) b.focus(); } };
        pane.addEventListener("click", (e) => { const b = e.target.closest("[data-add]"); if (b) { add[b.dataset.add]++; draw(b.dataset.add); } else if (e.target.closest('[data-a="reset"]')) { add.small = 0; add.large = 0; draw(); } }); draw();
      },
    };
    tabs(host, `rd-tabs-${uid}`, items.map((x) => x.label), (i) => { if (!built.has(i)) { const it = items[i]; (builders[it.id] || ((p) => (p.innerHTML = frame(it, ""))))(panes[i], it); (it.questions || []).forEach((q) => $('[data-r="q"]', panes[i]).append(B.questions.render(q))); built.add(i); } panes.forEach((p, k) => (p.hidden = k !== i)); }, panes);
  };

  // ======================================== D. Epidemiology Challenge ========================================
  B.interactives.disEpi = function (spec, host) {
    const items = spec.items || [], ratings = spec.ratings || []; const uid = uidOf();
    const rl = (k) => (ratings.find((r) => r.k === k) || {}).label || k;
    host.innerHTML = head(spec, "evaluate the claim") + `<div role="tablist" aria-label="scenarios" id="ep-tabs-${uid}" style="${WRAP}"></div><div id="ep-body-${uid}" class="mt"></div>`;
    const body = $(`#ep-body-${uid}`, host); const panes = panesFor(body, items.length, uid, "ep-pane");
    panes.forEach((pane, i) => { const s = items[i];
      pane.innerHTML = `<div class="card"><div style="${WRAP};justify-content:space-between"><h4 style="margin:0;color:var(--ink);min-width:0">${esc(s.title)}</h4>${tagBadge(s.tag)}</div><p class="small mt">${esc(s.context)}</p><h5 class="small mt" style="margin-bottom:.2rem">Evidence</h5><div class="small">${s.evidence}</div>
        <div class="notice small mt"><strong>Claim:</strong> ${esc(s.claim)}</div>
        <fieldset class="mt" style="border:0;padding:0;margin:0;min-width:0"><legend class="small"><strong>How well does the evidence support the claim?</strong></legend>${ratings.map((r) => `<label class="opt" style="display:flex;gap:.5rem;align-items:flex-start"><input type="radio" name="ep-${uid}-${i}" value="${r.k}"> <span>${esc(r.label)}</span></label>`).join("")}</fieldset>
        <div style="${WRAP}" class="mt"><button type="button" class="btn sm primary" data-a="check">Check my judgement</button></div><div data-r="fb" class="mt" aria-live="polite"></div></div>
        <h4 class="mt">Questions on this scenario</h4><div data-r="q"></div>`;
      $('[data-a="check"]', pane).addEventListener("click", () => { const sel = $(`input[name="ep-${uid}-${i}"]:checked`, pane); const fb = $('[data-r="fb"]', pane);
        if (!sel) { fb.innerHTML = `<div class="feedback neutral small">Choose a judgement first.</div>`; return; }
        const v = sel.value, best = v === s.best, ok = (s.accept || [s.best]).includes(v);
        fb.innerHTML = `<div class="feedback ${best ? "ok" : ok ? "neutral" : "bad"} small"><strong>${best ? "Well judged." : ok ? "Defensible." : "Look again."}</strong> ${esc(s.fb[v] || "")}<br><span class="tiny">Best judgement: <strong>${esc(rl(s.best))}</strong>.</span></div>`; });
      (s.questions || []).forEach((q) => $('[data-r="q"]', pane).append(B.questions.render(q)));
    });
    tabs(host, `ep-tabs-${uid}`, items.map((x) => x.label), (i) => { panes.forEach((p, k) => (p.hidden = k !== i)); fade(panes[i]); }, panes);
  };
})(window.BIO);
