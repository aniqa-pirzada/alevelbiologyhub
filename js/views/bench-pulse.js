// RP5 Interactive Pulse Laboratory (Phase 4 Batch 5, RP5 author): the effect of exercise on pulse rate, following the
// OxfordAQA 9610 Practical Handbook (2019) exemplar, pp. 70–72. Registers B.labSims.pulse = { sim(host, key),
// calc(host, key) }, which js/views/lab.js calls when B.practicals[5].sim === "pulse". Runs are saved in
// B.store.get().labRuns[key] and hold SIMULATED counts for FICTIONAL participants only (never the student's pulse).
//
// Stages (one at a time, picture beside the controls via B.ix.split): 1 Plan, 2 Measure (find the radial pulse;
// practise a 20 s count), 3 Rest (10 min rest, five 20 s counts at 1 min intervals), 4 Exercise (squat for a chosen time,
// at most 5 min; chosen pace), 5 Recovery (ten 20 s counts at 30 s intervals, starting immediately), 6 Calculate
// (× 3, mean, highest, increase, percentage increase, recovery time), 7 Graph, 8 Analyse, 9 Evaluate.
// ONE dataset per run drives everything: the beat times from B.pulseModel.beats() are what the strip draws, what the
// live pulse dot and optional click follow (scheduled at the model's own beat times, so the display is synchronised
// with the model rate), what auto count counts, and what the table, calculations and graph use.
// Counting modes: read the strip (static; default), count in real time (20 s, tap or press Space), auto count.
// Reduced motion (system setting, the site's reduced-motion class or preference): nothing moves; the real-time mode
// shows beat marks appearing on a still strip, with no scaling dot, and the exercise is shown as still pictures.
// No flashing: the dot scales gently (at most about 3 beats per second) and never fills the screen.
window.BIO = window.BIO || {}; window.BIO.labSims = window.BIO.labSims || {};
(function (B) {
  const { el, $, $$, esc } = B.util;
  const M = () => B.pulseModel; const P5 = () => B.practicals[5] || {};
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion") || !!(((B.store && B.store.get().prefs) || {}).reducedMotion);
  const ok = (t) => `<span style="color:var(--sage-ink)">${t}</span>`, bad = (t) => `<span style="color:var(--rose-ink)">${t}</span>`, amb = (t) => `<span style="color:var(--amber-ink)">${t}</span>`;
  const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
  const num = (v) => { const s = String(v == null ? "" : v).trim().replace(",", ".").replace(/[^\d.\-]/g, ""); return s === "" || isNaN(+s) ? null : +s; };
  const inp = (id, w = "5.5rem", label = "", extra = "") => `<input id="${id}" type="text" inputmode="decimal" autocomplete="off" ${label ? `aria-label="${esc(label)}"` : ""} ${extra} style="width:${w};padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)">`;
  // R9-33: the bench stops after the counts (stage 5). Processing the data and drawing the graph happen in the page's
  // Calculate tab (S.calcInto, S.graphInto below); analysis and evaluation are on the Analysis and Exam questions tabs.
  const STAGES = ["Plan", "Measure", "Rest", "Exercise", "Recovery"];
  const PEOPLE = [101, 102, 103, 104, 105, 106, 107, 108];
  const SPEC_SEED = 2026;
  const POS = { sitting: "sitting", lying: "lying down", standing: "standing" };
  let styled = false;
  const ensureStyle = () => { if (styled) return; styled = true; const s = document.createElement("style");
    s.textContent = `.pl-nav{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 .4rem;padding:0;list-style:none}.pl-nav button{font-size:.8rem;padding:.25rem .55rem;border-radius:999px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);cursor:pointer}
.pl-nav button[aria-current=step]{background:var(--teal);border-color:var(--teal);color:#fff}.pl-nav button.done::after{content:" ✓"}
.pl-fig:empty{display:none}.pl-fig{background:#fff;border-radius:10px;padding:.25rem;max-width:100%;overflow-x:auto}.pl-fig svg{display:block;width:100%;height:auto}.pl-dot{transform-box:fill-box;transform-origin:center;transition:transform .12s ease-out}
.pl-dot.beat{transform:scale(1.35)}@media (prefers-reduced-motion: reduce){.pl-dot,.pl-dot.beat{transition:none;transform:none}}html.reduce-motion .pl-dot,html.reduce-motion .pl-dot.beat{transition:none;transform:none}
.pl-modes label{display:flex;gap:.4rem;align-items:baseline;margin:.1rem 0}.pl-modes input{flex:none}.pl-tbl{overflow-x:auto;max-width:100%}.pl-tbl input{width:4.2rem}.pl-panel p{margin:.2rem 0}.pl-big{font-size:1.05rem;padding:.55rem 1rem}.pl-msg{min-height:1.2em}`; document.head.append(s); };

  // ---------------- datasets ----------------
  const personFor = (seed, day) => M().onDay(M().participant(seed), day || 0);
  const nameOf = (seed) => (seed === SPEC_SEED ? "S" : PEOPLE.includes(seed) ? "P" + (PEOPLE.indexOf(seed) + 1) : "R" + (seed % 1000));
  function beatsOf(ds) { const key = JSON.stringify([ds.seed, ds.day || 0, ds.protocol]); if (ds._bk !== key) { Object.defineProperty(ds, "_b", { value: M().beats(personFor(ds.seed, ds.day), ds.protocol), writable: true, configurable: true, enumerable: false }); Object.defineProperty(ds, "_bk", { value: key, writable: true, configurable: true, enumerable: false }); } return ds._b; }
  function specimen() { const s = P5().sets.SETS.spec; const W = M().windows(s.pr); return { label: "Specimen data set: participant S (fictional), 2 min of squats", specimen: true, seed: s.seed, day: 0, protocol: M().proto(s.pr), rest: W.rest.map((w, i) => ({ t: w.t, count: s.rest[i], trueCount: s.rest[i], mode: "auto" })), recovery: W.recovery.map((w, i) => ({ t: w.t, count: s.rec[i], trueCount: s.rec[i], mode: "auto" })) }; }
  const runLabel = (r, i) => `Run ${i + 1}: participant ${nameOf(r.seed)}${r.day ? ` (day ${r.day + 1})` : ""}, ${r.protocol.exMin} min at ${r.protocol.cadence}/min${r.protocol.position !== "sitting" ? ", " + POS[r.protocol.position] : ""}${r.protocol.restMin < 10 ? ", rested 2 min" : ""}${r.protocol.delay ? ", counts 30 s late" : ""}`;
  function stats(ds) { const sm = M().summary(ds.rest.map((x) => x.count), ds.recovery); return Object.assign(sm, { restMean1: +f1(sm.restMean) }); }
  const exAbs = (pr) => M().exEnd(pr);

  // ---------------- drawings (white panel; scientific colours) ----------------
  const T = (x, y, s, a = "start", sz = 13, w = 600, fill = "#16263a") => `<text x="${x}" y="${y}" font-size="${sz}" font-weight="${w}" text-anchor="${a}" fill="${fill}">${s}</text>`;
  function figure(pose) { // simple schematic person: "sit" (counting at the table), "down"/"up" (squatting holding the bench), "lie", "stand"
    const skin = "#e9c6ab", line = "#3f5a6e", shirt = "#5d8fb3";
    if (pose === "lie") return `<rect x="30" y="150" width="230" height="16" rx="6" fill="#c9b79c"/><circle cx="58" cy="132" r="15" fill="${skin}" stroke="${line}" stroke-width="2"/><rect x="74" y="122" width="96" height="26" rx="9" fill="${shirt}"/><path d="M170 132 L246 134 M170 140 L246 144" stroke="#465a6b" stroke-width="10" stroke-linecap="round"/><path d="M110 130 L150 118" stroke="${skin}" stroke-width="8" stroke-linecap="round"/>`;
    if (pose === "stand") return `<circle cx="120" cy="52" r="16" fill="${skin}" stroke="${line}" stroke-width="2"/><rect x="104" y="70" width="32" height="70" rx="9" fill="${shirt}"/><path d="M112 140 L108 210 M128 140 L132 210" stroke="#465a6b" stroke-width="10" stroke-linecap="round"/><path d="M106 84 L130 112 M134 84 L128 112" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>`;
    const bench = `<rect x="170" y="98" width="110" height="10" fill="#8a6e52"/><rect x="262" y="108" width="10" height="104" fill="#8a6e52"/>`;
    if (pose === "down") return `${bench}<circle cx="128" cy="98" r="16" fill="${skin}" stroke="${line}" stroke-width="2"/><rect x="104" y="114" width="34" height="50" rx="9" fill="${shirt}" transform="rotate(-12 120 140)"/><path d="M112 164 L150 170 L140 210 M120 166 L160 176 L152 210" stroke="#465a6b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M134 124 L172 104" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>`;
    if (pose === "up") return `${bench}<circle cx="122" cy="44" r="16" fill="${skin}" stroke="${line}" stroke-width="2"/><rect x="106" y="62" width="32" height="70" rx="9" fill="${shirt}"/><path d="M114 132 L112 210 M130 132 L134 210" stroke="#465a6b" stroke-width="10" stroke-linecap="round"/><path d="M136 78 L172 102" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>`;
    return `<rect x="150" y="98" width="130" height="10" fill="#8a6e52"/><rect x="262" y="108" width="10" height="104" fill="#8a6e52"/><rect x="60" y="140" width="70" height="10" fill="#7d6a58"/><rect x="62" y="150" width="8" height="62" fill="#7d6a58"/><rect x="120" y="150" width="8" height="62" fill="#7d6a58"/><rect x="58" y="70" width="10" height="80" fill="#7d6a58"/>
      <circle cx="98" cy="58" r="16" fill="${skin}" stroke="${line}" stroke-width="2"/><rect x="80" y="76" width="34" height="66" rx="9" fill="${shirt}"/><path d="M92 142 L150 142 L150 210 M100 148 L158 148 L160 210" stroke="#465a6b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M110 92 L150 104 L200 100" stroke="${skin}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M106 100 L150 112 L188 98" stroke="${skin}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="188" cy="97" r="4" fill="#b4504f"/>`;
  }
  function scene({ pose = "sit", clock = "00:00", caption = "", dot = true, dotId = "" }) {
    return `<svg viewBox="0 0 600 230" role="img" aria-label="Fictional participant (${pose === "sit" ? "seated, counting the radial pulse" : pose === "lie" ? "lying down" : pose === "stand" ? "standing" : "squatting while holding the bench"}); stop watch showing ${clock}.">
      <rect x="0" y="212" width="600" height="18" fill="#e4ddd2"/>${figure(pose)}
      <g transform="translate(330 30)"><rect x="0" y="0" width="150" height="86" rx="14" fill="#f4f7fa" stroke="#476a85" stroke-width="2"/><rect x="12" y="14" width="126" height="44" rx="6" fill="#1d3a52"/><text x="75" y="45" font-size="26" text-anchor="middle" fill="#9ef0c0" font-family="ui-monospace, monospace" data-pl="clock">${clock}</text>${T(75, 78, "stop watch", "middle", 14, 600, "#3f5a6e")}</g>
      ${dot ? `<g transform="translate(540 114)"><circle r="30" fill="#f8e5e4" stroke="#b4504f" stroke-width="1.5"/><circle class="pl-dot" ${dotId ? `id="${dotId}"` : ""} r="14" fill="#c0504d"/></g>${T(540, 166, "pulse", "middle", 14, 600, "#8a3a39")}` : ""}
      ${T(300, 200, caption, "start", 17, 700, "#16263a")}
    </svg>`.replace(/\s*\n\s*/g, " ");
  }
  // Pulse strip: two rows of w/2 s; the peak of each pulse wave is drawn at the model's beat time (relative to the window start).
  const wave = (u) => { // u = time since the start of one upstroke (s); peak at u = 0.09
    if (u < 0 || u > 1.6) return 0; if (u < 0.09) return u / 0.09; const d = u - 0.09; return 0.72 * Math.exp(-d / 0.22) + 0.28 * Math.exp(-d / 0.7) + 0.13 * Math.exp(-(((d - 0.24) / 0.05) ** 2)); };
  function strip(rel, w, opts = {}) {
    const half = w / 2, X0 = 22, WID = 560, rowY = [66, 176], A = 40; const xs = (t) => X0 + ((t % half) / half) * WID;
    const rows = [0, 1].map((r) => { let d = ""; for (let t = r * half; t <= (r + 1) * half + 1e-9; t += 0.02) { let y = 0; for (const b of rel) { const u = t - b + 0.09; if (u >= 0 && u < 1.6) y += wave(u); } d += `${t === r * half ? "M" : "L"}${(X0 + ((t - r * half) / half) * WID).toFixed(1)} ${(rowY[r] - A * Math.min(y, 1.4)).toFixed(1)}`; } return d; });
    const ticks = [0, 1].map((r) => Array.from({ length: half + 1 }, (_, i) => `<line x1="${X0 + (i / half) * WID}" y1="${rowY[r] + 4}" x2="${X0 + (i / half) * WID}" y2="${rowY[r] + (i % 5 ? 9 : 13)}" stroke="#7a8794"/>${i % 5 === 0 ? T(X0 + (i / half) * WID, rowY[r] + 26, r * half + i + " s", "middle", 14, 500, "#3f5a6e") : ""}`).join("")).join("");
    const marks = opts.marks ? rel.map((b, i) => { const r = b >= half ? 1 : 0; return `<circle cx="${xs(b).toFixed(1)}" cy="${rowY[r] - A - 7}" r="3.5" fill="#1d6f5c"/>${T(xs(b).toFixed(1), rowY[r] - A - 13, i + 1, "middle", 12, 600, "#1d6f5c")}`; }).join("") : "";
    const clip = opts.clipId ? `<defs><clipPath id="${opts.clipId}"><rect data-pl="clip0" x="0" y="0" width="${opts.upTo != null ? X0 + Math.min(1, opts.upTo / half) * WID : 600}" height="108"/><rect data-pl="clip1" x="0" y="108" width="${opts.upTo != null ? X0 + Math.max(0, Math.min(1, (opts.upTo - half) / half)) * WID : 600}" height="110"/></clipPath></defs>` : "";
    return `<svg viewBox="0 0 600 218" role="img" aria-label="${esc(opts.aria || `Pulse trace for one ${w}-second count, in two rows of ${half} seconds. Each peak is one beat.`)}">${clip}
      <rect x="${X0}" y="${rowY[0] - A - 18}" width="${WID}" height="${A + 22}" fill="#fbf6f0"/><rect x="${X0}" y="${rowY[1] - A - 18}" width="${WID}" height="${A + 22}" fill="#fbf6f0"/>
      <g ${opts.clipId ? `clip-path="url(#${opts.clipId})"` : ""}>${rows.map((d) => `<path d="${d}" fill="none" stroke="#b4504f" stroke-width="2"/>`).join("")}</g>${ticks}${marks}</svg>`.replace(/\s*\n\s*/g, " ");
  }
  // Graph of pulse rate against time for one or two datasets. x: minutes from the first resting count.
  function graph(sets, opts = {}) {
    const W = 600, H = 384, L = 62, Rr = 14, Tp = 18, Bt = 96; const all = sets.flatMap((s) => s.pts.map((p) => p.y)); const ymin = Math.max(0, Math.floor((Math.min(...all, opts.restMean || 999) - 10) / 10) * 10), ymax = Math.ceil((Math.max(...all) + 8) / 10) * 10;
    const xmax = Math.max(...sets.map((s) => s.xEnd)); const X = (x) => L + (x / xmax) * (W - L - Rr), Y = (y) => H - Bt - ((y - ymin) / (ymax - ymin)) * (H - Bt - Tp);
    const xt = []; for (let m = 0; m <= Math.floor(xmax); m++) xt.push(`<line x1="${X(m)}" y1="${H - Bt}" x2="${X(m)}" y2="${H - Bt + 5}" stroke="#476a85"/>${T(X(m), H - Bt + 20, m, "middle", 14, 500, "#3f5a6e")}`);
    const yt = []; for (let y = ymin; y <= ymax; y += 10) yt.push(`<line x1="${L - 5}" y1="${Y(y)}" x2="${W - Rr}" y2="${Y(y)}" stroke="#e3e8ee"/>${T(L - 8, Y(y) + 5, y, "end", 14, 500, "#3f5a6e")}`);
    const ex = sets[0]; const shade = `<rect x="${X(ex.exStart)}" y="${Tp}" width="${Math.max(2, X(ex.exEnd) - X(ex.exStart))}" height="${H - Bt - Tp}" fill="#f2d9a7" opacity=".55"/>${T((X(ex.exStart) + X(ex.exEnd)) / 2, Tp + 16, "exercise", "middle", 13, 700, "#5a4631")}${T((X(ex.exStart) + X(ex.exEnd)) / 2, Tp + 31, "(no counts)", "middle", 12, 500, "#5a4631")}`;
    const mk = (shape, x, y, c) => shape === "sq" ? `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" fill="#fff" stroke="${c}" stroke-width="2"/>` : `<circle cx="${x}" cy="${y}" r="4.6" fill="${c}"/>`;
    const series = sets.map((s, k) => { const c = k ? "#7a4fa3" : "#1d5f8a"; const seg = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(""); const lines = opts.join ? `<path d="${seg(s.pts.filter((p) => p.x < s.exStart))}" fill="none" stroke="${c}" stroke-width="1.8"/><path d="${seg(s.pts.filter((p) => p.x > s.exStart))}" fill="none" stroke="${c}" stroke-width="1.8" ${k ? 'stroke-dasharray="6 4"' : ""}/>` : ""; return lines + s.pts.map((p) => mk(k ? "sq" : "ci", X(p.x), Y(p.y), c)).join(""); }).join("");
    const rm = opts.restMean ? `<line x1="${L}" y1="${Y(opts.restMean)}" x2="${W - Rr}" y2="${Y(opts.restMean)}" stroke="#2e7d4f" stroke-width="1.6" stroke-dasharray="5 4"/>` : "";
    const err = opts.err ? sets[0].pts.map((p) => `<line x1="${X(p.x)}" y1="${Y(p.y - 3)}" x2="${X(p.x)}" y2="${Y(p.y + 3)}" stroke="#1d5f8a" stroke-width="1.2"/>`).join("") : "";
    const keys = sets.length > 1 ? sets.map((s, k) => `${mk(k ? "sq" : "ci", 6, -5, k ? "#7a4fa3" : "#1d5f8a")}${T(16, 0, esc(s.name.length > 34 ? s.name.slice(0, 33) + "…" : s.name), "start", 12, 600, "#16263a")}`) : [];
    if (opts.restMean) keys.push(`<line x1="0" y1="-5" x2="14" y2="-5" stroke="#2e7d4f" stroke-width="1.6" stroke-dasharray="5 4"/>${T(18, 0, `mean resting rate ${f1(opts.restMean)}`, "start", 12, 700, "#2e7d4f")}`);
    const key = keys.map((k, i) => `<g transform="translate(${8 + (i % 2) * 300} ${H - 30 + Math.floor(i / 2) * 20})">${k}</g>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" style="min-width:520px" role="img" aria-label="${esc(opts.aria || "Graph of pulse rate against time")}"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${yt.join("")}${shade}<line x1="${L}" y1="${H - Bt}" x2="${W - Rr}" y2="${H - Bt}" stroke="#476a85"/><line x1="${L}" y1="${Tp}" x2="${L}" y2="${H - Bt}" stroke="#476a85"/>${xt.join("")}${rm}${err}${series}
      ${T((L + W) / 2, H - Bt + 42, "time from the first resting count / min", "middle", 14, 700)}<text transform="translate(18 ${(H - Bt + Tp) / 2}) rotate(-90)" font-size="14" font-weight="700" text-anchor="middle" fill="#16263a">pulse rate / beats min⁻¹</text>${key}</svg>`.replace(/\s*\n\s*/g, " ");
  }
  function seriesOf(ds, name) { const e = exAbs(ds.protocol); return { name, exStart: M().EX_START / 60, exEnd: e / 60, xEnd: (e + 300 + ds.protocol.delay) / 60, pts: [...ds.rest.map((x) => ({ x: x.t / 60, y: x.count * 3 })), ...ds.recovery.map((x) => ({ x: (e + x.t) / 60, y: x.count * 3 }))] }; }
  const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // ---------------- audio (off by default) ----------------
  let actx = null; function click() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 660; g.gain.value = 0.06; o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.07); o.stop(actx.currentTime + 0.08); } catch (e) { /* audio unavailable */ } }

  // ======================= the bench =======================
  function bench(host, key, onRun) {
    ensureStyle(); const uid = "pl" + Math.random().toString(36).slice(2, 7);
    const S = { stage: 0, seed: SPEC_SEED, day: 0, iv: "exercise", prediction: "", protocol: M().proto({ exMin: 2 }), rested: false, found: false, thumb: false, practised: false, rest: [], recovery: [], exercised: false, mode: reduced() ? "strip" : "strip", audio: false, busy: false, dsSel: null, join: true, showMean: true, showErr: false, cmp: "" };
    const live = () => ({ seed: S.seed, day: S.day, protocol: S.protocol, rest: S.rest, recovery: S.recovery });
    host.innerHTML = `<p class="small muted">Fictional participants and simulated counts only: you never exercise or enter your own pulse here. <span class="badge amber">simulated</span></p>
      <ol class="pl-nav" aria-label="Stages of the practical">${STAGES.map((s, i) => `<li><button type="button" data-st="${i}">${i + 1} ${s}</button></li>`).join("")}</ol>
      <div data-pl="body"></div><div class="small pl-msg" aria-live="polite" data-pl="live"></div>`;
    const q = (k, root = host) => $(`[data-pl="${k}"]`, root);
    const say = (t) => { q("live").innerHTML = t; };
    const runs = () => B.store.get().labRuns[key] || [];
    // Layout (2026-11-15): a stage chosen from the stage list is brought into view if its picture is not fully on screen
    // (the bench scrolls to its top, as the Next buttons do); focus stays on the stage button.
    let acted = 0, navAt = 0; // time of the last click or key press on the bench, and of the last stage-list choice
    const inView = () => { const s = $(".ix-stage", q("body")); if (!s) return true; const r = s.getBoundingClientRect(); const tb = (document.querySelector(".topbar") || { getBoundingClientRect: () => ({ bottom: 0 }) }).getBoundingClientRect().bottom; return r.top >= tb - 1 && r.bottom <= innerHeight + 1; };
    $$(".pl-nav button", host).forEach((b) => b.addEventListener("click", () => { navAt = performance.now(); go(+b.dataset.st); if (!inView()) host.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }));
    // ... and when a choice in the controls makes the picture column taller (a counting mode adds the pulse strip), the page
    // scrolls just enough to show its foot, never pushing its top under the top bar. Only straight after a click or key press.
    const act = () => { acted = performance.now(); }; host.addEventListener("click", act, true); host.addEventListener("keydown", act, true);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => { if (performance.now() - acted > 2500 || acted <= navAt) return; /* a stage-list choice scrolls the bench itself */ const s = $(".ix-stage", q("body")); if (!s) return; const r = s.getBoundingClientRect(); const tb = (document.querySelector(".topbar") || host).getBoundingClientRect().bottom; const by = Math.min(r.bottom - innerHeight + 8, r.top - tb - 8); if (r.bottom > innerHeight + 1 && by > 0) scrollBy({ top: by, behavior: reduced() ? "auto" : "smooth" }); }).observe(q("body"));
    const doneStage = (i) => [S.iv && S.prediction, S.found && S.practised, S.rest.length === 5, S.exercised, S.recovery.length === 10, false, false, false, false][i];
    function nav() { $$(".pl-nav button", host).forEach((b, i) => { b.toggleAttribute("aria-current", false); if (i === S.stage) b.setAttribute("aria-current", "step"); b.classList.toggle("done", !!doneStage(i)); }); }
    let stop = null; // cancels any running animation
    function go(i) { if (stop) stop(); S.stage = i; nav(); say(""); [plan, measure, rest, exercise, recovery][i](q("body")); }
    const nextBtn = (i, label) => `<button type="button" class="btn sm" data-next="${i}">${label || `Next: ${STAGES[i]}`} →</button>`;
    const wireNext = (box) => $$("[data-next]", box).forEach((b) => b.addEventListener("click", () => { go(+b.dataset.next); host.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); }));
    const pinfo = () => `Participant ${nameOf(S.seed)} (fictional)${S.day ? `, day ${S.day + 1}` : ""}`;

    // ---- 1 Plan ----
    function plan(box) {
      const opts = [`<option value="${SPEC_SEED}">Participant S (fictional; the specimen participant)</option>`, ...PEOPLE.map((s, i) => `<option value="${s}">Participant P${i + 1} (fictional)</option>`), `<option value="new">New random participant</option>`].join("");
      box.innerHTML = B.ix.split(`<div class="pl-fig">${P5().art.timeline({ minW: 470, exMin: S.protocol.exMin, done: { rest: 0, rec: 0 } })}</div><p class="tiny muted mt">The handbook sequence: five resting counts, exercise, then ten counts after stopping (shaded boxes are 20 s counts).</p>`,
        `<div class="pl-panel"><fieldset><legend>Participant</legend><label class="small">Who is tested <select data-pl="who">${opts}</select></label><p class="tiny muted" data-pl="whoinfo"></p></fieldset>
        <fieldset><legend>Independent variable</legend>
          <label class="small"><input type="radio" name="${uid}iv" value="exercise" ${S.iv === "exercise" ? "checked" : ""}> Exercise: pulse rate at rest compared with after squatting <span class="badge teal">handbook exemplar</span></label>
          <label class="small"><input type="radio" name="${uid}iv" value="duration" ${S.iv === "duration" ? "checked" : ""}> Length of exercise (repeat runs with different times) <span class="badge amber">adaptation</span></label>
          <label class="small"><input type="radio" name="${uid}iv" value="position" ${S.iv === "position" ? "checked" : ""}> Body position during the counts <span class="badge amber">adaptation</span></label>
          <label class="small" data-pl="posbox" ${S.iv === "position" ? "" : "hidden"}>Position for the counts <select data-pl="pos">${Object.entries(POS).map(([k, v]) => `<option value="${k}" ${S.protocol.position === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <p class="tiny muted">Dependent variable: pulse rate (beats in 20 s × 3). The handbook allows adapting the method to length of exercise or body position; both are labelled adaptations, not the exemplar.</p></fieldset>
        <fieldset><legend>Control variables: tick the ones that must be kept the same</legend>${[["same", "The same person throughout", 1], ["rest", "A 10-minute seated rest before the resting counts", 1], ["artery", "The same artery and a 20 s counting time", 1], ["pace", "The same pace and depth of squats when runs are compared", 1], ["watch", "The make of stop watch", 0], ["shirt", "The colour of the participant's clothes", 0]].map(([k, t, c]) => `<label class="small"><input type="checkbox" data-ctl="${k}" data-c="${c}"> ${t}</label>`).join("")}
          <div class="row"><button type="button" class="btn sm" data-pl="ctlchk">Check my controls</button></div><div class="small" data-pl="ctlfb" aria-live="polite"></div></fieldset>
        <fieldset><legend>Prediction</legend>${[["rise", "The pulse rate will be higher straight after exercise, then fall back towards the resting rate over a few minutes."], ["same", "The pulse rate will not change."], ["fall", "The pulse rate will be lower straight after exercise."]].map(([k, t]) => `<label class="small"><input type="radio" name="${uid}pr" value="${k}" ${S.prediction === k ? "checked" : ""}> ${t}</label>`).join("")}<div class="small" data-pl="prfb" aria-live="polite"></div></fieldset>
        <div class="row">${nextBtn(1)}</div></div>`, { label: "Plan the investigation" });
      const who = q("who", box); who.value = PEOPLE.includes(S.seed) || S.seed === SPEC_SEED ? String(S.seed) : "new"; const info = () => { q("whoinfo", box).textContent = pinfo(); }; info();
      who.addEventListener("change", () => { S.seed = who.value === "new" ? 1000 + Math.floor(Math.random() * 8999) : +who.value; S.day = 0; resetRun(); info(); say(`${pinfo()} selected. Any counts already taken have been cleared.`); nav(); });
      $$(`input[name=${uid}iv]`, box).forEach((r) => r.addEventListener("change", () => { S.iv = r.value; q("posbox", box).hidden = S.iv !== "position"; if (S.iv !== "position") { S.protocol.position = "sitting"; } nav(); }));
      q("pos", box).addEventListener("change", () => { S.protocol.position = q("pos", box).value; resetRun(); say(`Counts will be taken ${POS[S.protocol.position]}. Any counts already taken have been cleared.`); });
      q("ctlchk", box).addEventListener("click", () => { const items = $$("[data-ctl]", box); const wrong = items.filter((c) => c.checked !== (c.dataset.c === "1")); q("ctlfb", box).innerHTML = wrong.length ? bad(`Not quite: ${wrong.length} to change. Control variables are things that could change the pulse rate if they differed between counts or runs; the stop watch make and clothes colour cannot.`) : ok("Correct. Each of these could change the pulse rate, so each is kept the same."); });
      $$(`input[name=${uid}pr]`, box).forEach((r) => r.addEventListener("change", () => { S.prediction = r.value; q("prfb", box).innerHTML = r.value === "rise" ? ok("A testable prediction with a reason you can give: working muscles respire faster and need more oxygen, so cardiac output rises.") : amb("You can test any prediction, but think about what working muscles need. The data will show whether you were right."); nav(); }));
      wireNext(box);
    }
    function resetRun() { S.rest = []; S.recovery = []; S.exercised = false; S.rested = false; S.saved = false; S.protocol.delay = 0; S.protocol.restMin = 10; }

    // ---- 2 Measure: find the radial pulse, practise a 20 s count ----
    const SPOTS = [{ id: "A", x: 300, y: 112, ok: true, label: "A" }, { id: "B", x: 250, y: 152, ok: false, label: "B" }, { id: "C", x: 230, y: 190, ok: false, label: "C" }];
    const SPOT_FB = { A: "Yes: the radial pulse, on the inside of the wrist on the thumb side, just below the base of the thumb. The artery lies over the bone here, so the pulse is easy to feel.", B: "Not here: the middle of the inside of the wrist has tendons over it, so the pulse is hard to feel. Move towards the thumb side.", C: "Not the best place: on the little-finger side the artery (the ulnar artery) is deeper, so its pulse is usually much harder to feel. Use the thumb side." };
    function measure(box) {
      const p = personFor(S.seed, S.day); const pr0 = S.protocol; const bt = M().beats(p, Object.assign({}, pr0, { exMin: 0 })); const t0 = -25; const rel = bt.filter((b) => b >= t0 && b < t0 + 20).map((b) => b - t0);
      box.innerHTML = B.ix.split(`<div class="pl-fig" data-pl="wrist">${P5().art.wrist({ minW: 460, spots: SPOTS, pick: S.found ? "A" : null, finger: S.found, aria: "Forearm and hand, palm up, thumb side at the top. Three possible places to feel for the pulse are marked A, B and C." })}</div><div class="pl-fig mt" data-pl="pv"></div>`,
        `<div class="pl-panel"><fieldset><legend>Find the radial pulse (handbook step 2)</legend><p class="small">Remain seated. Where should the fingertip go?</p><div class="row">${SPOTS.map((s) => `<button type="button" class="btn sm" data-spot-btn="${s.id}">Place ${s.id}</button>`).join("")}</div>
          <p class="small mt">Which part of your hand?</p><div class="row"><button type="button" class="btn sm" data-hand="finger">Tip of the first finger</button><button type="button" class="btn sm" data-hand="thumb">Thumb</button></div><div class="small" data-pl="spotfb" aria-live="polite"></div></fieldset>
        <fieldset data-pl="prac" ${S.found ? "" : "hidden"}><legend>Practise counting for 20 seconds</legend><p class="small">This is ${pinfo()}'s simulated pulse at rest. Count the beats in 20 s, then convert to beats per minute.</p>
          ${modeChooser("m")}<div data-pl="countui"></div>
          <label class="small">Pulse rate from your count ${inp(uid + "bpm", "5rem", "pulse rate in beats per minute")} beats min⁻¹</label><div class="row"><button type="button" class="btn sm" data-pl="bpmchk">Check</button></div><div class="small" data-pl="bpmfb" aria-live="polite"></div></fieldset>
        <div class="row">${nextBtn(2)}</div></div>`, { label: "Find and count the pulse", cls: "ix-nosticky-sm" });
      const pick = (id) => { const s = SPOTS.find((x) => x.id === id); q("wrist", box).innerHTML = P5().art.wrist({ minW: 460, spots: SPOTS, pick: id, finger: s.ok, aria: `Place ${id} chosen. ${s.ok ? "Correct: the radial pulse." : "Not the radial pulse."}` }); q("spotfb", box).innerHTML = s.ok ? ok(SPOT_FB[id]) : bad(SPOT_FB[id]); if (s.ok) { S.spot = true; } check(); };
      const check = () => { if (S.spot && S.hand === "finger") { S.found = true; q("prac", box).hidden = false; say("Radial pulse found with the tip of the first finger."); nav(); } };
      $$("[data-spot-btn]", box).forEach((b) => b.addEventListener("click", () => pick(b.dataset.spotBtn)));
      $$("[data-spot]", box).forEach((g) => g.addEventListener("click", () => pick(g.dataset.spot)));
      $$("[data-hand]", box).forEach((b) => b.addEventListener("click", () => { S.hand = b.dataset.hand; if (S.hand === "thumb") q("spotfb", box).innerHTML = bad("Do not use the thumb: it has its own pulse, which you could count instead of (or as well as) the pulse in the wrist. Use the tip of the first finger."); else { q("spotfb", box).innerHTML = ok("Yes: the fingertip, pressed gently. It has no strong pulse of its own."); check(); } }));
      let practiceCount = null;
      counter(box, "m", { rel, w: 20, title: "practice count", onCount: (c) => { practiceCount = c; } });
      q("bpmchk", box).addEventListener("click", () => { const v = num($("#" + uid + "bpm", box).value); const c = practiceCount; if (c == null) { q("bpmfb", box).innerHTML = amb("Count the beats first."); return; } const tc = rel.length;
        if (v === c * 3) { S.practised = true; nav(); q("bpmfb", box).innerHTML = ok(`✓ ${c} × 3 = ${c * 3} beats min⁻¹.`) + " " + (c === tc ? ok(`Your count matches the ${tc} beats in the window.`) : amb(`The strip had ${tc} beats; you counted ${c}. One beat out is normal (±3 beats min⁻¹): watch the beats at the very start and end of the window.`)); }
        else q("bpmfb", box).innerHTML = bad(`A 20-second count is a third of a minute, so multiply by 3: ${c} × 3 = ?`); });
      wireNext(box);
    }
    function modeChooser(pfx) { return `<div role="radiogroup" aria-label="How to count" class="small pl-modes">${[["strip", "Read the strip (type the count)"], ["tap", "Count in real time for 20 s (tap or press Space)"], ["auto", "Auto count"]].map(([k, t]) => `<label class="small"><input type="radio" name="${uid}${pfx}mode" value="${k}" ${S.mode === k ? "checked" : ""}> ${t}${k === "tap" && reduced() ? " (still beat marks: reduced motion is on)" : ""}</label>`).join("")}<label class="small"><input type="checkbox" data-pl="${pfx}audio" ${S.audio ? "checked" : ""}> click sound on each beat (real-time mode)</label></div>`; }

    // Counting widget for one window. rel: beat times relative to the window start (s). onCount(count, mode).
    function counter(box, pfx, { rel, w, title, onCount, disabled }) {
      const ui = q("countui", box); const pv = q("pv", box);
      $$(`input[name=${uid}${pfx}mode]`, box).forEach((r) => r.addEventListener("change", () => { S.mode = r.value; draw(); }));
      const au = q(pfx + "audio", box); if (au) au.addEventListener("change", () => { S.audio = au.checked; });
      function draw() {
        if (stop) stop();
        const modes = $(".pl-modes", box); if (modes) modes.hidden = !!disabled;
        if (disabled) { ui.innerHTML = ""; pv.innerHTML = ""; return; }
        if (S.mode === "strip") { pv.innerHTML = strip(rel, w, { aria: `Pulse trace for the ${title}: ${w} seconds in two rows. Count the peaks.` }); ui.innerHTML = `<label class="small">Beats in ${w} s ${inp(uid + pfx + "c", "4.5rem", "number of beats counted")}</label> <button type="button" class="btn sm primary" data-pl="rec">Record count</button>`; q("rec", box).addEventListener("click", () => { const c = num($("#" + uid + pfx + "c", box).value); if (c == null || c < 0 || !Number.isInteger(c)) { say(bad("Type the whole number of beats you counted.")); return; } pv.innerHTML = strip(rel, w, { marks: true, aria: `Pulse trace with the ${rel.length} beats numbered.` }); onCount(c, "strip"); }); }
        else if (S.mode === "auto") { pv.innerHTML = strip(rel, w, { marks: true, aria: `Pulse trace for the ${title} with its ${rel.length} beats numbered.` }); ui.innerHTML = `<button type="button" class="btn sm primary" data-pl="rec">Auto count and record</button>`; q("rec", box).addEventListener("click", () => onCount(rel.length, "auto")); }
        else { const cid = uid + pfx + "clip"; pv.innerHTML = `<div data-pl="sc">${scene({ pose: S.protocol.position === "lying" ? "lie" : S.protocol.position === "standing" ? "stand" : "sit", clock: "00:00", caption: "", dotId: uid + pfx + "dot" })}</div>${strip(rel, w, { clipId: cid, upTo: 0 })}`;
          ui.innerHTML = `<div class="row"><button type="button" class="btn sm primary" data-pl="go">Start ${w} s count</button><button type="button" class="btn pl-big" data-pl="tap" disabled aria-label="Beat: press for each beat you see">Beat</button><span class="small" data-pl="taps"></span></div>`;
          q("go", box).addEventListener("click", () => liveCount()); }
      }
      function liveCount() {
        if (S.busy) return; S.busy = true; let taps = 0, i = 0, raf = 0, done = false; const tapB = q("tap", box), dot = $("#" + uid + pfx + "dot", box), clk = $("[data-pl=clock]", pv); const c0 = $(`[data-pl=clip0]`, pv), c1 = $(`[data-pl=clip1]`, pv);
        tapB.disabled = false; tapB.focus(); q("go", box).disabled = true; q("taps", box).textContent = "Counting… press Beat (or Space) for each beat."; say(`${title}: ${w}-second count started.`);
        const onTap = () => { if (!done) taps++; }; tapB.addEventListener("click", onTap);
        const t0 = performance.now(); const half = w / 2;
        const tick = () => { const el2 = (performance.now() - t0) / 1000; while (i < rel.length && rel[i] <= el2) { i++; if (S.audio) click(); if (dot && !reduced()) { dot.classList.add("beat"); setTimeout(() => dot.classList.remove("beat"), 120); } }
          if (clk) clk.textContent = fmtClock(Math.min(el2, w)); const up = Math.min(el2, w); if (c0) c0.setAttribute("width", 22 + Math.min(1, up / half) * 560); if (c1) c1.setAttribute("width", 22 + Math.max(0, Math.min(1, (up - half) / half)) * 560);
          if (el2 >= w) return finish(); raf = requestAnimationFrame(tick); };
        function finish() { done = true; cancelAnimationFrame(raf); S.busy = false; stop = null; tapB.disabled = true; tapB.removeEventListener("click", onTap); q("go", box).disabled = false;
          q("taps", box).innerHTML = `Time! You pressed Beat ${taps} time${taps === 1 ? "" : "s"}. <label class="small">Your count ${inp(uid + pfx + "tc", "4rem", "your count", `value="${taps}"`)}</label> <button type="button" class="btn sm primary" data-pl="rec">Record count</button>`; say(`${title}: ${w}-second count ended.`);
          q("rec", box).addEventListener("click", () => { const c = num($("#" + uid + pfx + "tc", box).value); if (c == null || !Number.isInteger(c) || c < 0) { say(bad("Type the whole number of beats.")); return; } onCount(c, "tap"); }); }
        stop = () => { if (!done) { done = true; cancelAnimationFrame(raf); S.busy = false; } stop = null; };
        raf = requestAnimationFrame(tick);
      }
      draw();
    }

    // ---- 3 Rest: 10 minutes, then five counts ----
    function rest(box) {
      const n = S.rest.length; const p = personFor(S.seed, S.day); const W = M().windows(S.protocol); const bt = beatsOf(Object.assign(live(), {}));
      const pose = S.protocol.position === "lying" ? "lie" : S.protocol.position === "standing" ? "stand" : "sit";
      const need = !S.found ? "Find the radial pulse first (stage 2, Measure)." : !S.rested ? "Rest for 10 minutes first (handbook step 1)." : n >= 5 ? "All five resting counts are recorded." : "";
      const nextT = n < 5 ? W.rest[n].t : null;
      box.innerHTML = B.ix.split(`<div class="pl-fig">${scene({ pose, clock: S.rested ? fmtClock(nextT == null ? 300 : nextT) : "00:00", caption: S.rested ? (n < 5 ? `Count ${n + 1} of 5 starts at ${nextT / 60} min` : "Resting counts done") : "Resting…" })}</div><div class="pl-fig mt">${P5().art.timeline({ minW: 470, exMin: S.protocol.exMin, done: { rest: n, rec: 0 } })}</div><div class="pl-fig mt" data-pl="pv"></div>`,
        `<div class="pl-panel"><fieldset><legend>Handbook step 1: rest</legend><p class="small">Sit down and rest for 10 minutes; draw your results table while you wait.</p>
          <label class="small"><input type="checkbox" data-pl="short" ${S.protocol.restMin < 10 ? "checked" : ""} ${S.rested ? "disabled" : ""}> Method error on purpose: rest only 2 minutes</label>
          <div class="row"><button type="button" class="btn sm" data-pl="restbtn" ${S.rested ? "disabled" : ""}>${S.rested ? `Rested ${S.protocol.restMin} min ✓` : "Sit and rest (fast-forward)"}</button></div></fieldset>
        <fieldset><legend>Handbook step 3: five 20 s counts, one each minute</legend><p class="small">${pinfo()}, ${POS[S.protocol.position]}. ${need || `Next: count ${n + 1}, starting at ${nextT / 60} min.`}</p>
          ${modeChooser("r")}<div data-pl="countui"></div></fieldset>
        <div class="pl-tbl">${tableHTML(live(), { only: "rest" })}</div>
        <div class="row">${n >= 5 ? nextBtn(3) : ""}</div></div>`, { label: "Resting counts", cls: "ix-nosticky-sm" });
      const rb = q("restbtn", box); if (rb) rb.addEventListener("click", async () => { S.protocol.restMin = q("short", box).checked ? 2 : 10; rb.disabled = true; const clk = $("[data-pl=clock]", box); const total = S.protocol.restMin * 60; const steps = reduced() ? 1 : 30;
        for (let i = 1; i <= steps; i++) { if (clk) clk.textContent = fmtClock((total * i) / steps); if (!reduced()) await new Promise((r) => setTimeout(r, 40)); }
        S.rested = true; say(`Rested for ${S.protocol.restMin} minutes${S.protocol.restMin < 10 ? " (method error chosen: shorter than the handbook's 10 minutes)" : ""}. Results table drawn.`); go(2); });
      const t0 = n < 5 ? W.rest[n].t : 0; const rel = bt.filter((b) => b >= t0 && b < t0 + 20).map((b) => b - t0);
      counter(box, "r", { rel, w: 20, title: `resting count ${n + 1}`, disabled: need || null, onCount: (c, mode) => { S.rest.push({ t: W.rest[n].t, count: c, trueCount: rel.length, mode }); say(`Resting count ${n + 1} recorded: ${c} beats in 20 s.`); nav(); setTimeout(() => go(2), reduced() ? 0 : 500); } });
      wireNext(box);
    }

    // ---- 4 Exercise ----
    function exercise(box) {
      const durs = [0.5, 1, 1.5, 2, 3, 4, 5, 6];
      box.innerHTML = B.ix.split(`<div class="pl-fig" data-pl="sc">${scene({ pose: S.exercised ? "up" : "up", clock: S.exercised ? fmtClock(S.protocol.exMin * 60) : "00:00", caption: S.exercised ? `Stopped after ${S.protocol.exMin} min` : "Ready to squat", dot: false })}</div><div class="pl-fig mt">${P5().art.timeline({ minW: 470, exMin: S.protocol.exMin, done: { rest: S.rest.length, rec: 0 } })}</div>`,
        `<div class="pl-panel"><fieldset><legend>Handbook step 4: squat while holding the bench</legend>
          <label class="small">Length of exercise <select data-pl="dur" ${S.exercised ? "disabled" : ""}>${durs.map((d) => `<option value="${d}" ${S.protocol.exMin === d ? "selected" : ""}>${d === 6 ? "6 min (longer than the handbook allows)" : d + " min"}</option>`).join("")}</select></label>
          <label class="small">Pace (metronome; a platform addition that keeps pace constant) <select data-pl="cad" ${S.exercised ? "disabled" : ""}>${[20, 30, 40].map((c) => `<option value="${c}" ${S.protocol.cadence === c ? "selected" : ""}>${c} squats per minute</option>`).join("")}</select></label>
          <div class="small" data-pl="durfb" aria-live="polite"></div>
          <div class="row"><button type="button" class="btn sm primary" data-pl="sq" ${S.exercised || S.rest.length < 5 ? "disabled" : ""}>Start squatting (fast-forward)</button><button type="button" class="btn sm" data-pl="stopnow" disabled>Stop now (the participant decides)</button></div>
          <p class="small muted">${S.rest.length < 5 ? "Take all five resting counts first (stage 3)." : S.exercised ? "Exercise finished: go straight to the counts after stopping." : "The participant decides how long to exercise, never more than 5 minutes, and can stop at any time."}</p></fieldset>
        <div class="notice small"><strong>Taking part safely and fairly.</strong> In a real lesson your teacher supervises and follows the school's risk assessment; anyone may stop, or choose not to exercise, at any time. A student who is physically unable to squat takes part another way, as the handbook asks: for example by timing and recording a volunteer's counts or analysing anonymised class data. This bench never needs you to exercise.</div>
        <div class="row">${S.exercised ? nextBtn(4, "Next: Recovery counts, immediately") : ""}</div></div>`, { label: "Exercise" });
      const dur = q("dur", box), cad = q("cad", box), fb = q("durfb", box), sq = q("sq", box), stp = q("stopnow", box);
      const upd = () => { const d = +dur.value; if (d > 5) { fb.innerHTML = bad("Not allowed: the handbook says exercise should not be longer than 5 minutes. Choose 5 minutes or less."); sq.disabled = true; return; } fb.innerHTML = ""; sq.disabled = S.exercised || S.rest.length < 5; S.protocol.exMin = d; S.protocol.cadence = +cad.value; };
      if (!S.exercised) { dur.addEventListener("change", upd); cad.addEventListener("change", upd); upd(); }
      sq.addEventListener("click", async () => {
        upd(); if (sq.disabled) return; sq.disabled = true; dur.disabled = true; cad.disabled = true; stp.disabled = false; let cancelled = false, stopAt = null; S.busy = true;
        stp.addEventListener("click", () => { stopAt = true; });
        stop = () => { cancelled = true; S.busy = false; stop = null; };
        const total = S.protocol.exMin * 60, frames = reduced() ? 1 : Math.round(total / 6); let elapsed = 0; const sc = q("sc", box);
        for (let i = 1; i <= frames; i++) { if (cancelled) return; elapsed = (total * i) / frames; if (stopAt) break;
          sc.innerHTML = scene({ pose: reduced() ? "up" : i % 2 ? "down" : "up", clock: fmtClock(elapsed), caption: `Squatting: ${S.protocol.cadence} per minute`, dot: false });
          if (!reduced()) await new Promise((r) => setTimeout(r, 90)); }
        if (stopAt) { S.protocol.exMin = Math.max(0.25, Math.round(elapsed / 15) * 0.25); }
        S.exercised = true; S.busy = false; stop = null; say(`Stopped squatting after ${S.protocol.exMin} min (${Math.round(S.protocol.exMin * 60 * S.protocol.cadence / 60)} squats). Start counting immediately.`); nav(); go(3);
      });
      wireNext(box);
    }

    // ---- 5 Recovery: ten counts at 30 s intervals ----
    function recovery(box) {
      const n = S.recovery.length; const W = M().windows(S.protocol); const bt = beatsOf(live()); const e = exAbs(S.protocol);
      const need = !S.exercised ? "Exercise first (stage 4)." : n >= 10 ? "All ten counts after exercise are recorded and the run is saved." : "";
      const pose = S.protocol.position === "lying" ? "lie" : S.protocol.position === "standing" ? "stand" : "sit";
      box.innerHTML = B.ix.split(`<div class="pl-fig">${scene({ pose, clock: n < 10 ? fmtClock(W.recovery[n].t) : "05:00", caption: n < 10 ? `Count ${n + 1} of 10: ${W.recovery[n].t} s after stopping` : "Counts after exercise done" })}</div><div class="pl-fig mt">${P5().art.timeline({ minW: 470, exMin: S.protocol.exMin, done: { rest: 5, rec: n }, recDelay: S.protocol.delay })}</div><div class="pl-fig mt" data-pl="pv"></div>`,
        `<div class="pl-panel"><fieldset><legend>Handbook step 5: immediately, ten 20 s counts every 30 s</legend>
          <label class="small"><input type="checkbox" data-pl="late" ${S.protocol.delay ? "checked" : ""} ${n || !S.exercised ? "disabled" : ""}> Method error on purpose: start the counts 30 s late (sitting down and finding the pulse)</label>
          <p class="small">${need || `Next: count ${n + 1}, starting ${W.recovery[n].t} s after stopping.`}</p>${modeChooser("q")}<div data-pl="countui"></div>
          ${n < 10 && S.exercised ? `<div class="row mt"><button type="button" class="btn sm" data-pl="autoall">Auto count all remaining</button></div>` : ""}</fieldset>
        <div class="pl-tbl">${tableHTML(live(), {})}</div><div class="row">${n >= 10 ? '<button type="button" class="btn sm primary" data-pl="tocalc">Process this run in the Calculate tab →</button><button type="button" class="btn sm" data-pl="newrun">Start another run (same participant, another day)</button>' : ""}</div></div>`, { label: "Counts after exercise", cls: "ix-nosticky-sm" });
      const tc = q("tocalc", box); if (tc) tc.addEventListener("click", () => { const t = document.querySelector('[role="tab"][data-tab="calc"]'); if (t) { t.click(); t.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }); } });
      const nr = q("newrun", box); if (nr) nr.addEventListener("click", () => { resetRun(); S.day = 1 + Math.max(S.day || 0, ...runs().filter((r) => r.seed === S.seed).map((r) => r.day || 0)); say(`New run on another day (day ${S.day + 1}): the participant's pulse varies a little from day to day, so a repeat with the same settings gives slightly different counts. Rest for 10 minutes, then take the resting counts again.`); go(2); });
      const late = q("late", box); if (late && !late.disabled) late.addEventListener("change", () => { S.protocol.delay = late.checked ? 30 : 0; go(4); });
      const rec = (c, mode, k) => { const w = M().windows(S.protocol).recovery[k]; const tc = M().count(beatsOf(live()), w.abs, 20); S.recovery.push({ t: w.t, count: c, trueCount: tc, mode }); };
      if (n < 10 && S.exercised) { const t0 = e + W.recovery[n].t; const rel = bt.filter((b) => b >= t0 && b < t0 + 20).map((b) => b - t0);
        counter(box, "q", { rel, w: 20, title: `count ${n + 1} after exercise`, onCount: (c, mode) => { rec(c, mode, n); say(`Count ${n + 1} after exercise recorded: ${c} beats.`); finishIf(); setTimeout(() => go(4), reduced() ? 0 : 400); } });
        q("autoall", box).addEventListener("click", () => { for (let k = S.recovery.length; k < 10; k++) { const w = M().windows(S.protocol).recovery[k]; rec(M().count(beatsOf(live()), w.abs, 20), "auto", k); } say("All remaining counts recorded by auto count."); finishIf(); go(4); });
      } else counter(box, "q", { rel: [], w: 20, title: "", disabled: need });
      wireNext(box);
    }
    function finishIf() { if (S.recovery.length !== 10 || S.saved) return; S.saved = true; const r = { ts: Date.now(), seed: S.seed, day: S.day, iv: S.iv, prediction: S.prediction, protocol: Object.assign({}, S.protocol), rest: S.rest.map((x) => ({ ...x })), recovery: S.recovery.map((x) => ({ ...x })) }; onRun(r); S.dsSel = "r" + (runs().length - 1); nav(); }

    // ---- shared: dataset chooser and results table ----
    function dsList() { return [...runs().map((r, i) => ({ id: "r" + i, label: runLabel(r, i), ds: r })), { id: "spec", label: "Specimen data set: participant S, 2 min (checked answers)", ds: specimen() }]; }
    function current() { const L = dsList(); return L.find((x) => x.id === S.dsSel) || L.find((x) => x.id === "r" + (runs().length - 1)) || L[L.length - 1]; }
    const chooser = () => `<label class="small">Data set <select data-pl="ds">${dsList().map((x) => `<option value="${x.id}" ${x.id === current().id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>`;
    const wireChooser = (box, again) => { const s = q("ds", box); if (s) s.addEventListener("change", () => { S.dsSel = s.value; again(); }); };
    function tableHTML(ds, { only, inputs } = {}) {
      const rows = [...(only === "rec" ? [] : ds.rest.map((x, i) => ({ st: "Resting", lab: `${x.t / 60} min`, x, k: "s" + i }))), ...(only === "rest" ? [] : ds.recovery.map((x, i) => ({ st: "After exercise", lab: `${x.t} s`, x, k: "q" + i })))];
      return `<table class="tbl small"><caption class="tiny muted" style="text-align:left">Simulated counts${ds.specimen ? " (specimen)" : ""}; after exercise, times are after stopping: ${ds.specimen ? "participant S" : pinfoOf(ds)}</caption><thead><tr><th scope="col">Stage</th><th scope="col">Started at</th><th scope="col">Beats in 20 s</th>${inputs ? '<th scope="col">Pulse rate / beats min⁻¹</th>' : ""}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr><td>${r.st}</td><td>${r.lab}</td><td>${r.x.count}</td>${inputs ? `<td>${inp(uid + "rt" + r.k, "4.2rem", `pulse rate for ${r.st.toLowerCase()} count started ${r.lab}`)}</td>` : ""}</tr>`).join("") : `<tr><td colspan="3" class="muted">No counts yet.</td></tr>`}</tbody></table>`;
    }
    const pinfoOf = (ds) => `participant ${nameOf(ds.seed)}${ds.day ? ` (day ${ds.day + 1})` : ""}${ds.recovery.length ? `, ${ds.protocol.exMin} min of squats` : ""}`;

    // ---- 6 Calculate ----
    function calculate(box) {
      const c = current(); const ds = c.ds; const st = stats(ds);
      box.innerHTML = B.ix.split(`<div class="pl-tbl">${tableHTML(ds, { inputs: true })}</div>`,
        `<div class="pl-panel">${chooser()}<p class="small">Convert each count: pulse rate = beats in 20 s × 3. Type the rates in the table, then check.</p><div class="row"><button type="button" class="btn sm" data-pl="ratechk">Check the rates</button></div><div class="small" data-pl="ratefb" aria-live="polite"></div>
        <fieldset><legend>Process the data</legend>
          <label class="small">Mean resting rate (1 d.p.) ${inp(uid + "m", "5rem", "mean resting rate")}</label>
          <label class="small">Highest rate after exercise ${inp(uid + "pk", "5rem", "highest rate")}</label>
          <label class="small">Increase (highest − mean resting) ${inp(uid + "inc", "5rem", "increase")}</label>
          <label class="small">Percentage increase (1 d.p.) ${inp(uid + "pct", "5rem", "percentage increase")} %</label>
          <label class="small">Recovery time / s ${inp(uid + "rt", "5rem", "recovery time in seconds", 'placeholder="or none"')}</label>
          <p class="tiny muted">Recovery time <span class="badge">platform convention</span>: the time after stopping at which the first count starts whose rate is no more than 3 beats min⁻¹ above the mean resting rate. Type "none" if this never happens within 5 minutes.</p>
          <div class="row"><button type="button" class="btn sm primary" data-pl="sumchk">Check</button></div><div class="small" data-pl="sumfb" aria-live="polite"></div></fieldset>
        ${ds.specimen ? `<details><summary class="small"><strong>Worked answers for the specimen data set</strong></summary><p class="small">Resting rates ${st.restRates.join(", ")}: mean ${f1(st.restMean)}. Highest ${st.peak} (first count, ${ds.recovery[0].count} × 3). Increase ${f1(st.increase)}. Percentage increase ${f1(st.increase)} ÷ ${f1(st.restMean)} × 100 = ${f1(st.pct)} %. Recovery time ${st.recovery} s (first rate at or below ${f1(st.restMean + 3)}).</p></details>` : ""}
        </div>`, { label: "Calculate", cls: "ix-nosticky-sm" });
      wireChooser(box, () => calculate(box));
      q("ratechk", box).addEventListener("click", () => { let wrong = 0, empty = 0; [...ds.rest.map((x, i) => ["s" + i, x]), ...ds.recovery.map((x, i) => ["q" + i, x])].forEach(([k, x]) => { const e = $("#" + uid + "rt" + k, box); const v = num(e.value); if (v == null) { empty++; e.style.borderColor = ""; return; } const good = v === x.count * 3; if (!good) wrong++; e.style.borderColor = good ? "var(--sage-ink)" : "var(--rose-ink)"; e.setAttribute("aria-invalid", good ? "false" : "true"); });
        q("ratefb", box).innerHTML = wrong ? bad(`${wrong} rate${wrong === 1 ? " is" : "s are"} wrong (red border). Each is the count × 3, because 20 s is a third of a minute.`) : empty ? amb(`Correct so far; ${empty} still to fill in.`) : ok("✓ All rates correct."); });
      q("sumchk", box).addEventListener("click", () => { const g = (id) => num($("#" + uid + id, box).value); const out = [];
        const m = g("m"); out.push(m == null ? "" : Math.abs(m - st.restMean) <= 0.051 ? ok(`✓ Mean resting rate ${f1(st.restMean)}.`) : bad(`Mean resting rate: add the five resting rates and divide by 5 (${st.restRates.join(" + ")}).`));
        const pk = g("pk"); out.push(pk == null ? "" : pk === st.peak ? ok(`✓ Highest ${st.peak}.`) : bad("Highest: the largest rate after exercise (usually the first count)."));
        const inc = g("inc"); out.push(inc == null ? "" : Math.abs(inc - st.increase) <= 0.051 || Math.abs(inc - (st.peak - +f1(st.restMean))) <= 0.051 ? ok(`✓ Increase ${f1(st.increase)}.`) : bad("Increase = highest rate − mean resting rate."));
        const pc = g("pct"); const pc2 = ((st.peak - +f1(st.restMean)) / +f1(st.restMean)) * 100; out.push(pc == null ? "" : Math.abs(pc - st.pct) <= 0.051 || Math.abs(pc - pc2) <= 0.051 ? ok(`✓ Percentage increase ${f1(st.pct)} %.`) : bad("Percentage increase = increase ÷ mean resting rate × 100 (divide by the resting value, the starting value)."));
        const rtv = $("#" + uid + "rt", box).value.trim().toLowerCase(); if (rtv) { const none = st.recovery === null; const said = /none|not|never|>|more/.test(rtv); out.push((none && said) || (!none && num(rtv) === st.recovery) ? ok(`✓ Recovery time ${none ? "not reached within 5 minutes" : st.recovery + " s"}.`) : bad(`Recovery time: find the first count after stopping whose rate is at or below ${f1(st.restMean)} + 3 = ${f1(st.restMean + 3)} beats min⁻¹, and give the time it started.`)); }
        q("sumfb", box).innerHTML = out.filter(Boolean).join("<br>") || amb("Type at least one answer."); });
      wireNext(box);
    }

    // ---- 7 Graph ----
    function graphStage(box) {
      const c = current(); const ds = c.ds; const st = stats(ds); const others = dsList().filter((x) => x.id !== c.id);
      const sets = [seriesOf(ds, c.ds.specimen ? "specimen" : `${pinfoOf(ds)}`)]; const o = others.find((x) => x.id === S.cmp); if (o) sets.push(seriesOf(o.ds, o.ds.specimen ? "specimen" : pinfoOf(o.ds)));
      box.innerHTML = B.ix.split(`<div class="pl-fig ix-free" tabindex="0" aria-label="Graph (scrolls sideways on small screens)">${graph(sets, { join: S.join, restMean: S.showMean ? st.restMean : null, err: S.showErr && sets.length === 1, aria: `Graph of pulse rate against time for ${esc(c.label)}: steady at about ${f1(st.restMean)} beats per minute at rest, a gap for exercise, highest at ${st.peak} just after stopping, then falling.` })}</div><p class="tiny muted">Each point is plotted at the time its 20 s count started. The same counts as the results table and step 2.</p>`,
        `<div class="pl-panel">${chooser()}<fieldset><legend>Display</legend><label class="small"><input type="checkbox" data-pl="join" ${S.join ? "checked" : ""}> join the points (not across the exercise gap)</label><label class="small"><input type="checkbox" data-pl="mean" ${S.showMean ? "checked" : ""}> dashed line at the mean resting rate</label><label class="small"><input type="checkbox" data-pl="err" ${S.showErr ? "checked" : ""}> show ±3 beats min⁻¹ uncertainty bars</label>
          <label class="small">Compare with <select data-pl="cmp"><option value="">nothing</option>${others.map((x) => `<option value="${x.id}" ${x.id === S.cmp ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label></fieldset>
          <div class="readout small">Resting mean ${f1(st.restMean)}; highest ${st.peak}; recovery time ${st.recovery === null ? "not within 5 min" : st.recovery + " s"} (simulated).</div></div>`, { label: "Graph" });
      wireChooser(box, () => graphStage(box));
      q("join", box).addEventListener("change", (e) => { S.join = e.target.checked; graphStage(box); }); q("mean", box).addEventListener("change", (e) => { S.showMean = e.target.checked; graphStage(box); }); q("err", box).addEventListener("change", (e) => { S.showErr = e.target.checked; graphStage(box); }); q("cmp", box).addEventListener("change", (e) => { S.cmp = e.target.value; graphStage(box); });
    }

    S.calcInto = calculate; S.graphInto = graphStage; // used by the Calculate tab
    go(0);
    return S;
  }

  // ======================= Sim tab =======================
  function sim(host, n) {
    host.innerHTML = `<div data-pl="bench"></div>
      <h3 class="mt">Saved runs</h3><p class="small muted">Each completed run (five resting counts and ten counts after exercise) is saved as simulated counts for a fictional participant. Nothing about you is stored. The Calculate tab compares runs.</p>
      <div data-pl="runs" style="overflow-x:auto"></div><div class="row mt"><button class="btn sm" data-pl="clear">Clear saved runs</button></div>`;
    const st = B.store.get(); st.labRuns[n] = st.labRuns[n] || []; const runs = st.labRuns[n];
    const table = () => { if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", table); return; }
      $('[data-pl="runs"]', host).innerHTML = runs.length ? `<table class="tbl small"><thead><tr><th scope="col">#</th><th scope="col">Run</th><th scope="col">Resting counts</th><th scope="col">Counts after exercise</th></tr></thead><tbody>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(runLabel(r, i))}</td><td>${r.rest.map((x) => x.count).join(", ")}</td><td>${r.recovery.map((x) => x.count).join(", ")}</td></tr>`).join("")}</tbody></table>` : '<p class="muted small">No runs saved yet.</p>'; };
    const S = bench($('[data-pl="bench"]', host), n, (r) => { runs.push(r); B.store.save(); B.store.touchActivity("lab"); table(); document.dispatchEvent(new Event("labrun")); });
    B.labSims.pulse._state = S;
    $('[data-pl="clear"]', host).addEventListener("click", () => { if (confirm("Clear all saved runs for this practical?")) { runs.length = 0; B.store.save(); table(); document.dispatchEvent(new Event("labrun")); } });
    table(); host.dataset.mounted = "1"; document.addEventListener("labrun", table);
  }

  // ======================= Calculate tab: specimen, runs compared, simulated class data =======================
  function calc(host, n) {
    ensureStyle(); let cls = null;
    function render() {
      if (!host.isConnected && host.dataset.mounted) { document.removeEventListener("labrun", render); return; } host.dataset.mounted = "1";
      const runs = B.store.get().labRuns[n] || []; const sp = specimen(); const ss = stats(sp);
      const rows = runs.map((r, i) => ({ r, i, s: stats(r) }));
      const groups = {}; rows.filter((x) => x.r.protocol.restMin === 10 && !x.r.protocol.delay && x.r.protocol.position === "sitting").forEach((x) => { const k = `${x.r.protocol.exMin}|${x.r.protocol.cadence}`; (groups[k] = groups[k] || []).push(x); });
      host.innerHTML = `<div class="card mb"><h3>1 The specimen data set (checked answers)</h3><p class="small muted">Simulated counts for fictional participant S after 2 minutes of squats at 30 per minute. These are the authoritative answers used in the questions on this page.</p>
          <div class="pl-tbl"><table class="tbl small"><thead><tr><th scope="col">Count started</th>${sp.rest.map((x) => `<th scope="col">${x.t / 60} min</th>`).join("")}</tr></thead><tbody><tr><td>Beats in 20 s</td>${sp.rest.map((x) => `<td>${x.count}</td>`).join("")}</tr><tr><td>Rate / beats min⁻¹</td>${ss.restRates.map((v) => `<td>${v}</td>`).join("")}</tr></tbody></table>
          <table class="tbl small mt"><thead><tr><th scope="col">After stopping / s</th>${sp.recovery.map((x) => `<th scope="col">${x.t}</th>`).join("")}</tr></thead><tbody><tr><td>Beats in 20 s</td>${sp.recovery.map((x) => `<td>${x.count}</td>`).join("")}</tr><tr><td>Rate / beats min⁻¹</td>${ss.recRates.map((v) => `<td>${v}</td>`).join("")}</tr></tbody></table></div>
          <ul class="small"><li>Mean resting rate = (${ss.restRates.join(" + ")}) ÷ 5 = ${f1(ss.restMean)} beats min⁻¹</li><li>Highest rate = ${sp.recovery[0].count} × 3 = ${ss.peak} beats min⁻¹; increase = ${ss.peak} − ${f1(ss.restMean)} = ${f1(ss.increase)} beats min⁻¹</li><li>Percentage increase = ${f1(ss.increase)} ÷ ${f1(ss.restMean)} × 100 = ${f1(ss.pct)} %</li><li>Recovery time (platform convention) = ${ss.recovery} s; uncertainty in each rate ±3 beats min⁻¹</li></ul></div>
        <div class="card mb"><h3>2 Process a run</h3><p class="small muted">Choose your own run or the specimen data set, convert each count to a rate and check your processing.</p><div data-pl="calcrun"></div></div>
        <div class="card mb"><h3>3 Graph of pulse rate against time</h3><div data-pl="graphrun"></div></div>
        <div class="card mb"><h3>4 Your runs</h3>${rows.length ? `<div class="pl-tbl"><table class="tbl small"><thead><tr><th scope="col">Run</th><th scope="col">Mean resting</th><th scope="col">Highest</th><th scope="col">% increase</th><th scope="col">Recovery time</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${esc(runLabel(x.r, x.i))}</td><td>${f1(x.s.restMean)}</td><td>${x.s.peak}</td><td>${f1(x.s.pct)}</td><td>${x.s.recovery === null ? "over 5 min" : x.s.recovery + " s"}</td></tr>`).join("")}</tbody></table></div>
          <h4 class="mt">Repeats grouped by length of exercise and pace (runs with a method error left out)</h4><div class="pl-tbl"><table class="tbl small"><thead><tr><th scope="col">Exercise</th><th scope="col">Runs</th><th scope="col">Mean % increase</th><th scope="col">Range</th></tr></thead><tbody>${Object.entries(groups).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([k, g]) => { const v = g.map((x) => x.s.pct); return `<tr><td>${k.split("|")[0]} min at ${k.split("|")[1]}/min</td><td>${g.length}</td><td>${f1(M().mean(v))}</td><td>${f1(Math.min(...v))} to ${f1(Math.max(...v))}</td></tr>`; }).join("") || '<tr><td colspan="4" class="muted">No runs without method errors yet.</td></tr>'}</tbody></table></div><p class="tiny muted">Repeat a run on another day (Evaluate stage) or try other lengths of exercise to fill this table.</p>`
          : `<div class="empty">${B.util.icons.lab}<h3>No runs yet</h3><p>Complete a run in the Virtual experiment tab (or use the specimen above).</p></div>`}</div>
        <div class="card"><h3>5 Simulated class data: does longer exercise give a bigger rise? <span class="badge amber">adaptation</span></h3><p class="small muted">Six fictional participants each squat for 1, 2 and 3 minutes (30 per minute) on different days. Percentage increase for each.</p>
          <div class="row"><button type="button" class="btn sm" data-pl="cls">${cls ? "New class" : "Generate class data"}</button></div><div data-pl="clsv"></div></div>`;
      { const S = B.labSims.pulse._state; if (S && S.calcInto) { S.calcInto($('[data-pl="calcrun"]', host)); S.graphInto($('[data-pl="graphrun"]', host)); } else { $('[data-pl="calcrun"]', host).innerHTML = '<p class="small muted">Open the Virtual experiment tab once to load the bench.</p>'; $('[data-pl="graphrun"]', host).innerHTML = ""; } }
      $('[data-pl="cls"]', host).addEventListener("click", () => { const base = Math.floor(Math.random() * 9000) + 1000; cls = { base, v: [1, 2, 3].map((m) => [0, 1, 2, 3, 4, 5].map((i) => { const r = M().run(personFor(base + i, m), { exMin: m }); return +f1(M().summary(r.rest.map((x) => x.count), r.recovery).pct); })) }; render(); });
      if (cls) { const v = cls.v; const mean3 = v.map((a) => M().mean(a));
        const W = 600, H = 250, L = 60, base = 205; const top = Math.ceil(Math.max(...v.flat()) / 10) * 10 + 10; const Y = (x) => base - (x / top) * 180;
        const svg = `<svg viewBox="0 0 ${W} ${H}" style="max-width:640px" role="img" aria-label="Mean percentage increase against length of exercise with range bars: ${mean3.map((m, i) => `${i + 1} min mean ${f1(m)}, range ${f1(Math.min(...v[i]))} to ${f1(Math.max(...v[i]))}`).join("; ")}."><rect width="${W}" height="${H}" fill="#fff"/>${[0, top / 2, top].map((t) => `<line x1="${L}" y1="${Y(t)}" x2="${W - 20}" y2="${Y(t)}" stroke="#e3e8ee"/>${T(L - 8, Y(t) + 4, t, "end", 11, 500, "#3f5a6e")}`).join("")}${v.map((a, i) => { const x = L + 90 + i * 170; return `<rect x="${x - 30}" y="${Y(mean3[i])}" width="60" height="${base - Y(mean3[i])}" fill="#8fb3cf"/><line x1="${x}" y1="${Y(Math.min(...a))}" x2="${x}" y2="${Y(Math.max(...a))}" stroke="#16263a" stroke-width="2"/>${[Math.min(...a), Math.max(...a)].map((e) => `<line x1="${x - 9}" y1="${Y(e)}" x2="${x + 9}" y2="${Y(e)}" stroke="#16263a" stroke-width="2"/>`).join("")}${a.map((e, j) => `<circle cx="${x + 18 + (j % 3) * 6}" cy="${Y(e)}" r="3" fill="#1d5f8a"/>`).join("")}${T(x, base + 18, `${i + 1} min`, "middle", 12, 600)}`; }).join("")}<line x1="${L}" y1="${base}" x2="${W - 20}" y2="${base}" stroke="#476a85"/>${T((L + W) / 2, base + 38, "length of exercise", "middle", 12, 700)}<text transform="translate(18 ${base - 90}) rotate(-90)" font-size="12" font-weight="700" text-anchor="middle" fill="#16263a">% increase in pulse rate</text></svg>`.replace(/\s*\n\s*/g, " ");
        $('[data-pl="clsv"]', host).innerHTML = `<div class="pl-tbl mt"><table class="tbl small"><thead><tr><th scope="col">Exercise</th>${[1, 2, 3, 4, 5, 6].map((i) => `<th scope="col">C${i}</th>`).join("")}<th scope="col">Mean</th></tr></thead><tbody>${v.map((a, i) => `<tr><td>${i + 1} min</td>${a.map((x) => `<td>${f1(x)}</td>`).join("")}<td>${i === 1 ? inp("plcm", "4.5rem", "mean percentage increase for 2 minutes") : f1(mean3[i])}</td></tr>`).join("")}</tbody></table></div>
          <div class="row"><button type="button" class="btn sm" data-pl="cmchk">Check the 2-minute mean</button></div><div class="small" data-pl="cmfb" aria-live="polite"></div><div class="pl-fig mt">${svg}</div>
          <p class="small">Bars: mean; lines: range; dots: each fictional participant. Where ranges overlap a lot, compare each person across lengths too: the same people did every length. Simulated data, not measurements.</p>`;
        $('[data-pl="cmchk"]', host).addEventListener("click", () => { const g = num($("#plcm", host).value); $('[data-pl="cmfb"]', host).innerHTML = g == null ? amb("Type the mean.") : Math.abs(g - mean3[1]) <= 0.051 ? ok(`✓ (${v[1].map(f1).join(" + ")}) ÷ 6 = ${f1(mean3[1])} %.`) : bad("Add the six values for 2 minutes and divide by 6."); }); }
    }
    render(); document.addEventListener("labrun", render);
  }

  B.labSims.pulse = { sim, calc, STAGES, specimen, stats, _bench: bench, _strip: strip, _graph: graph };
})(window.BIO);
