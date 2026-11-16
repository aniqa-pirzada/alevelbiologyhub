// Shared model, illustrative data and artwork for 3.2.9 The role of aphids in spreading plant viruses (Phase 4 Batch 3,
// owned by the 3.2.9 author). Loaded before data/content/3.2.9.1.js, 3.2.9.2.js, data/consolidation/3.2.9.js and
// js/views/interactives-aphid.js.
//
// B.aphidModel.run(options): a SIMPLIFIED, SEEDED model of virus spread by aphids in a small crop. It is an illustration
// of the ideas in the specification, not a measurement or a forecast. Assumptions (all chosen to show patterns, none
// measured):
//   * Plants sit in a grid. A plant infected on day d becomes a source of virus after 4 days and shows symptoms after
//     10 days. Resistant plants can carry aphids but cannot be infected.
//   * Each day 3 winged aphids arrive from outside. 70 % are "transient" (species that probe a few plants and fly on
//     without settling); the rest can settle and found a colony. For a non-persistent virus 4 more transient winged aphids
//     a day are counted, because many aphid species that visit a crop without colonising it can carry non-persistent
//     viruses, while persistent viruses are spread mainly by the species that colonise the crop. With the "infected weeds
//     at the edge" source they land mostly near the left-hand edge and 10 % of them already carry virus; with the "one
//     infected plant" source they land anywhere and carry none.
//   * A winged aphid probes 1 to 4 plants a day, each within 3 plants of the last one.
//   * Non-persistent virus: picked up (probability 0.4) and passed on (0.3) during brief probes, in seconds; lost when
//     the aphid settles to feed for a long time.
//   * Persistent virus: picked up (0.5) only during a long phloem feed on a source plant, then a 2-day latent period,
//     then the aphid passes it on (0.5) whenever it settles to feed, for the rest of its life.
//   * Colonies grow by 20 % a day (at least 1 aphid) up to 40; from 20 aphids, 10 % of the colony develop wings each day
//     and leave (crowding); a colony of 10 or more on a source plant passes virus to a neighbouring plant with
//     probability 0.03 a day (wingless aphids walking).
//   * Insecticide on the crop: 70 % of settling aphids die before a long feed is complete (this is what stops a
//     persistent virus being picked up or passed on). Sprayed colonies are made restless: each day half of each colony
//     walks off, probing up to 4 plants within 2 plants before dying, and 10 % of the rest die. It cannot stop a probe
//     lasting seconds, so it does little against a non-persistent virus (20 repeats: about a 5 % relative fall) but a lot
//     against a persistent one (about 95 %), as reported for real crops. Roguing removes every plant showing symptoms
//     once a week (days 7, 14, ...).
//   * Randomness comes from a seeded generator; the page always uses seeds 1 to 20 (single run: seed 1) and shows no
//     seed to students.
// B.aphidData: HYPOTHETICAL field maps and a HYPOTHETICAL control trial constructed for the Crop Disease Investigation.
// They are not measurements; the patterns follow those reported in the sources cited on the 3.2.9.1 page.
// B.aphidArt: original SVG drawings. Leaf orientation in every section: upper surface at the top; in a dicot leaf vein
// the xylem is towards the upper surface and the phloem towards the lower surface, so an aphid feeding from the lower
// surface has a short route to the phloem.
window.BIO = window.BIO || {};
(function (B) {
  // ------------------------------------------------------------------ model ------------------------------------------------------------------
  const rng = (seed) => { let a = (seed >>> 0) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const DEF = { cols: 8, rows: 6, days: 42, mode: "np", source: "plant", srcIndex: null, imm: 3, transient: 0.7, carryFrac: 0.1, insecticide: false, roguing: false, resistant: 0, seed: 1,
    pT: 0.3, pA: 0.4, pTp: 0.5, pAp: 0.5, vLatent: 2, pLatent: 4, symptom: 10, hopsMax: 4, radius: 3, pSettle: 0.45, pLeave: 0.15, pLeaveTransient: 0.5, growth: 0.2, K: 40, crowd: 20, wingFrac: 0.1, pWalk: 0.03, kill: 0.7, rogueEvery: 7, restless: 0.5, restHops: 4, restRadius: 2, immNP: 4, killColony: 0.1 };
  function run(o) {
    const p = Object.assign({}, DEF, o || {}); const R = rng(p.seed * 7919 + 13); const N = p.cols * p.rows;
    const plants = Array.from({ length: N }, (_, i) => ({ i, c: i % p.cols, r: Math.floor(i / p.cols), inf: null, removed: null, resistant: false, colony: 0 }));
    const order = plants.map((x) => [x.i, R()]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
    order.slice(0, Math.round(p.resistant * N)).forEach((i) => (plants[i].resistant = true));
    const src = p.source === "plant" ? (p.srcIndex !== null ? p.srcIndex : Math.floor(p.rows / 2) * p.cols + Math.floor(p.cols / 2) - 1) : null;
    if (src !== null) { plants[src].inf = 0; plants[src].resistant = false; }
    let aphids = []; let nid = 0; const days = [];
    const isSource = (pl, d) => pl.inf !== null && pl.removed === null && d - pl.inf >= p.pLatent;
    const infect = (pl, d, prob, how) => { if (pl.inf === null && pl.removed === null && !pl.resistant && R() < prob) { pl.inf = d; pl.how = how; return true; } return false; };
    const near1 = (pl) => { const cand = plants.filter((q) => q !== pl && Math.max(Math.abs(q.c - pl.c), Math.abs(q.r - pl.r)) <= p.restRadius); return cand[Math.floor(R() * cand.length)]; };
    const near = (pl) => { const cand = plants.filter((q) => q !== pl && Math.max(Math.abs(q.c - pl.c), Math.abs(q.r - pl.r)) <= p.radius); return cand[Math.floor(R() * cand.length)]; };
    for (let d = 0; d < p.days; d++) {
      const newInf = [];
      const nImm = p.imm + (p.mode === "np" ? p.immNP : 0);
      for (let k = 0; k < nImm; k++) { const c = p.source === "edge" ? Math.min(p.cols - 1, Math.floor(-Math.log(1 - R()) * 1.2)) : Math.floor(R() * p.cols);
        const pl = plants[Math.floor(R() * p.rows) * p.cols + c]; const carry = p.source === "edge" && R() < p.carryFrac;
        aphids.push({ id: nid++, at: pl.i, carrying: p.mode === "np" && carry, infective: p.mode === "p" && carry, latent: 0, transient: k >= p.imm || R() < p.transient, from: "outside" }); }
      const moved = []; const next = [];
      for (const a of aphids) { const path = [a.at];
        if (p.mode === "p" && a.latent > 0) { a.latent--; if (a.latent === 0) a.infective = true; }
        const hops = 1 + Math.floor(R() * p.hopsMax); let pl = plants[a.at];
        for (let h = 0; h < hops; h++) { if (h > 0) { pl = near(pl); path.push(pl.i); }
          if (pl.removed !== null) continue;
          if (p.mode === "np") { if (a.carrying && infect(pl, d, p.pT, "probe")) newInf.push(pl.i); if (isSource(pl, d) && R() < p.pA) a.carrying = true; } }
        a.at = pl.i; moved.push({ id: a.id, path, carrying: a.carrying || a.infective, transient: a.transient });
        if (pl.removed === null && !a.transient && R() < p.pSettle) { // settles: long phloem feed, founds a colony
          const surv = p.insecticide ? 1 - p.kill : 1;
          if (p.mode === "np") a.carrying = false;
          else { if (a.infective && R() < surv && infect(pl, d, p.pTp, "feed")) newInf.push(pl.i); if (!a.infective && a.latent === 0 && isSource(pl, d) && R() < p.pAp * surv) a.latent = p.vLatent; }
          if (!(p.insecticide && R() < p.killColony)) pl.colony += 1;
          continue; }
        if (R() < (a.transient ? p.pLeaveTransient : p.pLeave)) continue; // flies out of the crop
        next.push(a); }
      aphids = next;
      for (const pl of plants) { if (pl.removed !== null || pl.colony <= 0) continue;
        pl.colony = Math.min(p.K, pl.colony + Math.max(1, Math.round(pl.colony * p.growth)));
        if (p.insecticide) { // sprayed aphids become restless before they die: some walk to nearby plants and probe them
          const nR = Math.round(pl.colony * p.restless); const s0 = isSource(pl, d);
          for (let k = 0; k < nR; k++) { let carry = p.mode === "np" && s0 && R() < p.pA; let at = pl; const hops = 1 + Math.floor(R() * p.restHops);
            for (let h = 0; h < hops; h++) { at = near1(at); if (at.removed !== null) continue; if (carry && infect(at, d, p.pT, "probe")) newInf.push(at.i); if (p.mode === "np" && isSource(at, d) && R() < p.pA) carry = true; } }
          pl.colony = Math.round((pl.colony - nR) * (1 - p.killColony)); }
        if (pl.colony >= p.crowd && p.wingFrac > 0) { const w = Math.max(1, Math.floor(pl.colony * p.wingFrac)); pl.colony -= w; const s = isSource(pl, d);
          for (let k = 0; k < w; k++) aphids.push({ id: nid++, at: pl.i, carrying: p.mode === "np" && s && R() < p.pA, infective: p.mode === "p" && s && R() < p.pAp, latent: 0, transient: false, from: "colony" }); }
        if (isSource(pl, d) && pl.colony >= p.crowd / 2 && R() < p.pWalk) { const nb = plants.filter((q) => q !== pl && Math.abs(q.c - pl.c) <= 1 && Math.abs(q.r - pl.r) <= 1); const t = nb[Math.floor(R() * nb.length)]; if (infect(t, d, 1, "walk")) { t.colony += 1; newInf.push(t.i); } } }
      if (p.roguing && d > 0 && d % p.rogueEvery === 0) for (const pl of plants) if (pl.inf !== null && pl.removed === null && d - pl.inf >= p.symptom) { pl.removed = d; pl.colony = 0; }
      const inf = plants.filter((x) => x.inf !== null).length;
      days.push({ d, inf, pct: (100 * inf) / N, removed: plants.filter((x) => x.removed !== null).length, symptoms: plants.filter((x) => x.inf !== null && x.removed === null && d - x.inf >= p.symptom).length,
        flying: aphids.length, colonies: plants.map((x) => x.colony), moved, newInf, carriers: aphids.filter((a) => a.carrying || a.infective || a.latent > 0).length });
    }
    return { p, N, src, plants: plants.map((x) => ({ i: x.i, c: x.c, r: x.r, inf: x.inf, removed: x.removed, resistant: x.resistant, how: x.how || (x.i === src ? "source" : null) })), days };
  }
  // state of plant i at the END of day d: "healthy" | "resistant" | "infected" (no symptoms yet) | "symptoms" | "removed"
  const plantState = (res, i, d) => { const pl = res.plants[i]; if (pl.removed !== null && pl.removed <= d) return "removed"; if (pl.inf !== null && pl.inf <= d) return d - pl.inf >= res.p.symptom ? "symptoms" : "infected"; return pl.resistant ? "resistant" : "healthy"; };
  // repeated runs with seeds 1..n (final % infected, including removed plants that had been infected)
  const repeats = (opts, n = 20) => { const v = []; for (let s = 1; s <= n; s++) v.push(run(Object.assign({}, opts, { seed: s })).days.at(-1).pct); const mean = v.reduce((a, b) => a + b, 0) / n; return { mean, min: Math.min(...v), max: Math.max(...v), values: v }; };
  B.aphidModel = { rng, DEF, run, plantState, repeats };

  // ------------------------------------------------------- hypothetical investigation data -------------------------------------------------------
  // Field maps: 12 columns × 8 rows of plants. Each character is the week in which a weekly survey first recorded symptoms
  // on that plant (1–6), or "." if it had none by week 6. Column 1 is next to the field margin. HYPOTHETICAL.
  const FIELDS = {
    A: { name: "Field A", story: "Squash field next to an uncultivated margin with weeds (left-hand side of the map).", rows: [
      "2334556.....", "234455.6....", "3345.66.....", "22345566....", "334456......", "2345.56..6..", "344556......", "23345.6....."] },
    B: { name: "Field B", story: "Squash field planted with transplants from one nursery; no weedy margin.", rows: [
      "........6...", "......5665..", "....6.4455..", "...6.53145..", "......4435.6", ".....65456..", "..6...65.6..", ".........6.."] },
  };
  const fieldWeek = (f, r, c) => { const ch = FIELDS[f].rows[r][c]; return ch === "." ? null : +ch; };
  // % of plants with symptoms by week w in column bands (1–3, 4–6, 7–9, 10–12 from the margin)
  const bandPct = (f, w) => [0, 1, 2, 3].map((b) => { let n = 0, t = 0; for (let r = 0; r < 8; r++) for (let c = b * 3; c < b * 3 + 3; c++) { t++; const x = fieldWeek(f, r, c); if (x !== null && x <= w) n++; } return (100 * n) / t; });
  const fieldPct = (f, w) => { let n = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) { const x = fieldWeek(f, r, c); if (x !== null && x <= w) n++; } return { n, pct: (100 * n) / 96 }; };
  // distance (in plants, chessboard distance) from the source plant in Field B (the "1")
  const srcB = (() => { for (let r = 0; r < 8; r++) { const c = FIELDS.B.rows[r].indexOf("1"); if (c >= 0) return { r, c }; } return null; })();
  const ringPct = (w) => [[0, 1], [2, 3], [4, 11]].map(([lo, hi]) => { let n = 0, t = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) { const dd = Math.max(Math.abs(r - srcB.r), Math.abs(c - srcB.c)); if (dd < lo || dd > hi) continue; t++; const x = fieldWeek("B", r, c); if (x !== null && x <= w) n++; } return { lo, hi, n, t, pct: (100 * n) / t }; });
  // Control trial: squash, aphid-borne (non-persistent) mosaic viruses; 4 plots per treatment; % plants with mosaic
  // symptoms 8 weeks after planting and marketable yield per plot. HYPOTHETICAL, constructed to show the patterns
  // reported in the cited sources (insecticides give little control of non-persistent viruses; reflective mulch, row
  // covers and mineral oil reduce spread; resistance works only against the virus it targets).
  const TRIAL = [
    { k: "none", t: "Untreated", plots: [84, 78, 88, 80], yield: 21 },
    { k: "insect", t: "Insecticide sprayed weekly", plots: [80, 70, 76, 74], yield: 23 },
    { k: "oil", t: "Mineral oil sprayed weekly", plots: [56, 48, 52, 48], yield: 31 },
    { k: "mulch", t: "Silver reflective mulch", plots: [40, 32, 44, 36], yield: 36 },
    { k: "cover", t: "Floating row cover until flowering", plots: [26, 34, 30, 30], yield: 39 },
    { k: "border", t: "Border of a tall non-host crop (maize)", plots: [64, 54, 60, 58], yield: 28 },
    { k: "resist", t: "Variety resistant to ZYMV only", plots: [34, 42, 36, 40], yield: 35 },
  ].map((x) => Object.assign(x, { mean: x.plots.reduce((a, b) => a + b, 0) / x.plots.length, min: Math.min(...x.plots), max: Math.max(...x.plots) }));
  const trialRow = (k) => TRIAL.find((x) => x.k === k);
  const pctReduction = (k) => (100 * (trialRow("none").mean - trialRow(k).mean)) / trialRow("none").mean;
  B.aphidData = { FIELDS, fieldWeek, bandPct, fieldPct, srcB, ringPct, TRIAL, trialRow, pctReduction };

  // ------------------------------------------------------------------ art ------------------------------------------------------------------
  const INK = "#16263a", GREY = "#5f6f7f", SAP = "#b8650a", VIR = "#c0392b";
  let U = 0; const uid = () => "ap" + (++U).toString(36);
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "start"}" font-size="${o.s || 14}" font-weight="${o.w || 600}" fill="${o.c || INK}"${o.it ? ' font-style="italic"' : ""}>${s}</text>`;
  const svgOpen = (W, H, label) => `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${label}" style="max-width:100%;height:auto"><rect width="${W}" height="${H}" fill="#fff"/>`;
  const lead = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="1.2"/><circle cx="${x1}" cy="${y1}" r="2.6" fill="${INK}"/>`;
  const numBadge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="${INK}" stroke-width="1.8"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}">${n}</text>`;
  const arrowDef = (id, col) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${col}"/></marker>`;

  // ---- Symptoms (schematic) ----
  function leafShape(cx, cy, w, h, rot, fill, stroke, extra) { return `<g transform="translate(${cx} ${cy}) rotate(${rot})"><path d="M0 0 C ${w * 0.3} ${-h * 0.55} ${w * 0.85} ${-h * 0.5} ${w} 0 C ${w * 0.85} ${h * 0.5} ${w * 0.3} ${h * 0.55} 0 0 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/><path d="M0 0 L ${w * 0.95} 0" stroke="${stroke}" stroke-width="1"/>${extra || ""}</g>`; }
  function symptoms(o = {}) { const id = uid(); const nums = o.numbers || null; const gr = "#4f9a3a", st = "#2f6a22"; const GY = 380;
    // Two tomato plants: healthy (left) and stunted, infected (right). Fruit hang in a truss from the stem, so they read as
    // fruit, not leaves. Numbers sit beside their own feature, so no two leader lines cross.
    let s = svgOpen(760, 440, o.aria || "A healthy tomato plant beside a smaller infected plant showing stunting, leaf distortion, mosaic, yellowing and abnormal fruit") + `<defs><pattern id="${id}m" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#5aa443"/><path d="M0 0 h7 v6 h-7 z M9 8 h7 v8 h-7 z M3 10 h4 v5 h-4z" fill="#e3e07a"/></pattern></defs>`;
    s += `<rect x="20" y="${GY}" width="720" height="14" fill="#c9b48f"/>`;
    const tomato = (x, y, r, sick) => sick
      ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#d8743a" stroke="#7a3a12" stroke-width="1.4"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.15}" r="${r * 0.42}" fill="none" stroke="#f2d65a" stroke-width="2.2"/><path d="M${x + r * 0.15} ${y + r * 0.35} q ${r * 0.35} ${-r * 0.5} ${r * 0.7} 0" fill="none" stroke="#f2d65a" stroke-width="2.2"/><path d="M${x - 3} ${y - r} l 3 -4 l 3 4" stroke="${st}" stroke-width="2" fill="none"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="#d63a2a" stroke="#7a1a12" stroke-width="1.4"/><ellipse cx="${x - r * 0.35}" cy="${y - r * 0.35}" rx="${r * 0.25}" ry="${r * 0.15}" fill="#f6b0a6"/><path d="M${x - 4} ${y - r} l 4 -5 l 4 5" stroke="${st}" stroke-width="2" fill="none"/>`;
    // healthy plant
    const HX = 200;
    s += `<path d="M${HX} ${GY} L ${HX} 92" stroke="${st}" stroke-width="5"/>` + [[HX, 334, 112, 42, -150], [HX, 334, 112, 42, -30], [HX, 238, 102, 38, -145], [HX, 238, 102, 38, -35], [HX, 150, 84, 32, -135], [HX, 150, 84, 32, -45]].map(([x, y, w, h, r]) => leafShape(x, y, w, h, r, gr, st)).join("");
    s += `<path d="M${HX} 346 C ${HX - 14} 346 ${HX - 30} 350 ${HX - 38} 356 M${HX - 20} 347 L ${HX - 18} 352" stroke="${st}" stroke-width="2.4" fill="none"/>` + tomato(HX - 42, 362, 14) + tomato(HX - 16, 362, 12);
    s += T(HX, 414, "healthy plant", { a: "middle", s: 15 });
    // infected plant: shorter, with yellowing, mosaic, distorted leaves and abnormal fruit
    const X0 = 520;
    s += `<path d="M${X0} ${GY} L ${X0} 236" stroke="${st}" stroke-width="5"/>`;
    s += leafShape(X0, 340, 96, 36, -150, "#e7d35a", "#8a7a20"); // yellowing (left)
    s += leafShape(X0, 340, 96, 36, -30, `url(#${id}m)`, st); // mosaic (right)
    const dist = `<path d="M0 0 C 20 -30 40 -8 52 -26 C 66 -10 80 -20 84 0 C 70 14 58 4 44 18 C 30 6 16 22 0 0 Z" fill="#6cae4f" stroke="${st}" stroke-width="1.6"/>`;
    s += `<g transform="translate(${X0} 250) rotate(-35)">${dist}</g><g transform="translate(${X0} 250) rotate(-145)">${dist}</g>`;
    s += `<path d="M${X0} 344 C ${X0 - 14} 344 ${X0 - 28} 347 ${X0 - 36} 352" stroke="${st}" stroke-width="2.2" fill="none"/>` + tomato(X0 - 40, 364, 12, true) + tomato(X0 - 15, 362, 10, true);
    s += `<path d="M${HX + 6} 92 L ${X0 - 92} 92" stroke="${GREY}" stroke-width="1.2" stroke-dasharray="5 4"/><path d="M${X0 - 100} 236 L ${X0 - 100} 92" stroke="${GREY}" stroke-width="1.6"/><path d="M${X0 - 108} 236 h16 M${X0 - 108} 92 h16" stroke="${GREY}" stroke-width="1.6"/>` + T(HX + 70, 84, "height of the healthy plant", { s: 12, w: 500, c: GREY });
    s += T(X0, 414, "plant infected with a virus", { a: "middle", s: 15 });
    // [name, point on the feature, label position, text anchor]
    const items = [["Stunting", X0 - 100, 164, X0 - 140, 164, "end", "(smaller plant)"], ["Leaf distortion", X0 + 64, 226, X0 + 110, 196, "start", "(puckered, curled)"], ["Mosaic", X0 + 66, 314, X0 + 110, 300, "start", "(pale patches)"], ["Yellowing of leaves", X0 - 70, 318, X0 - 130, 296, "end", ""], ["Abnormal fruit", X0 - 50, 368, X0 - 130, 372, "end", "(blotches, rings)"]];
    items.forEach(([t, x1, y1, x2, y2, an, sub]) => { if (nums && nums[t] === undefined) return; const bx = an === "end" ? x2 - 12 : x2 + 12;
      if (nums) s += lead(x1, y1, x2, y2) + numBadge(bx, y2, nums[t]);
      else s += lead(x1, y1, x2, y2) + T(an === "end" ? x2 - 6 : x2 + 6, y2 + 5, t, { s: 14, a: an }) + (sub ? T(an === "end" ? x2 - 6 : x2 + 6, y2 + 22, sub, { s: 12, w: 500, c: GREY, a: an }) : ""); });
    s += T(740, 434, "schematic: real symptoms depend on the virus and the plant", { a: "end", s: 12, w: 500, c: GREY });
    return s + "</svg>"; }

  // ---- How plant viruses spread (aphids are one of several routes) ----
  function routes() { const W = 760, H = 548, CX = 380, CY = 318, CR = 74;
    // Aphids (the specification's example) at the top; other vectors in the left column; routes with no vector on the
    // right. Each connector runs from the centre circle to the near edge of its own box, so none passes behind another box.
    let s = svgOpen(W, H, "Ways plant viruses spread: aphids, whiteflies, thrips, nematodes, other insects, seed, infected tubers or cuttings, grafting, and contact; with named examples");
    const box = (x, y, w, h, title, sub, col, fill, bold) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${col}" stroke-width="${bold ? 3 : 1.8}"/>${T(x + 12, y + 24, title, { s: 15, w: 800, c: col })}${sub.map((l, i) => T(x + 12, y + 44 + i * 18, l, { s: 13, w: 500 })).join("")}`;
    const top = [230, 12, 300, 98, "Aphids", ["about 28 % of vector-borne viruses", "CMV, ZYMV, PRSV, WMV (non-persistent)", "BYDV (persistent)"], "#3f6a1f", "#eef6e4", true];
    const colY = [136, 238, 340, 442], BW = 244, BH = 84, LX = 12, RX = W - 12 - BW;
    const left = [["Whiteflies", ["tomato yellow leaf curl virus"]], ["Thrips", ["tomato spotted wilt virus"]], ["Nematodes in soil", ["tobacco ringspot virus", "(dagger nematode)"]], ["Other insect vectors", ["e.g. mealybugs: cacao", "swollen shoot virus"]]].map(([t, sub], i) => [LX, colY[i], BW, BH, t, sub, "#5a5a8a", "#f1f1fb"]);
    const right = [["Infected seed", ["ZYMV, lettuce mosaic virus"]], ["Infected tubers or cuttings", ["potato virus Y in seed potatoes"]], ["Grafting", ["infected rootstock or scion"]], ["Contact", ["hands, tools, plants rubbing", "(tomato mosaic virus)"]]].map(([t, sub], i) => [RX, colY[i], BW, BH, t, sub, "#7a5a2a", "#fbf4e4"]);
    s += T(LX, 126, "other vectors", { s: 13, w: 700, c: GREY }) + T(W - 12, 126, "no vector", { a: "end", s: 13, w: 700, c: GREY });
    const ends = [[CX, top[1] + top[3]], ...left.map(([x, y, w, h]) => [x + w, y + h / 2]), ...right.map(([x, y, w, h]) => [x, y + h / 2])];
    ends.forEach(([ax, ay]) => { const dx = ax - CX, dy = ay - CY, L = Math.hypot(dx, dy); s += `<line x1="${(CX + (dx * (CR + 3)) / L).toFixed(1)}" y1="${(CY + (dy * (CR + 3)) / L).toFixed(1)}" x2="${ax}" y2="${ay}" stroke="#9fb4ad" stroke-width="2.2"/>`; });
    [top, ...left, ...right].forEach((it) => { s += box(...it); });
    s += `<circle cx="${CX}" cy="${CY}" r="${CR}" fill="#fbe7e3" stroke="${VIR}" stroke-width="2.4"/>` + T(CX, CY - 8, "plant virus", { a: "middle", s: 17, w: 800, c: "#8f2a20" }) + T(CX, CY + 14, "must get into the", { a: "middle", s: 13, w: 500 }) + T(CX, CY + 30, "cells of a new plant", { a: "middle", s: 13, w: 500 });
    return s + "</svg>"; }

  // ---- Disease cycle: an infected plant becomes a source; aphids move the virus ----
  function cycle(o = {}) { const id = uid(); const W = 760, H = 380;
    let s = svgOpen(W, H, "Cycle of virus spread: an infected plant is a source; an aphid probes or feeds and picks up virus; the aphid moves to a healthy plant; it passes the virus into the new plant's cells; that plant becomes a new source") + `<defs>${arrowDef(id + "a", "#1f66b0")}</defs>`;
    const P = [[380, 62], [618, 190], [380, 318], [142, 190]];
    const lab = [["1. Infected plant: a source", "virus multiplies in its cells"], ["2. Aphid probes or feeds", "and picks up virus"], ["3. Aphid moves", "winged females fly further"], ["4. Virus enters a healthy plant", "through the aphid's stylets"]];
    for (let i = 0; i < 4; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 4]; const mx = (x1 + x2) / 2 + (i === 0 || i === 3 ? 30 : -30) * (i < 2 ? 1 : -1), my = (y1 + y2) / 2; s += `<path d="M${x1 + (x2 - x1) * 0.28} ${y1 + (y2 - y1) * 0.28} Q ${(x1 + x2) / 2 + (x2 > x1 ? 40 : -40) * (y2 > y1 ? 1 : -1) * 0} ${my + (i % 2 ? 0 : 0)} ${x1 + (x2 - x1) * 0.72} ${y1 + (y2 - y1) * 0.72}" fill="none" stroke="#1f66b0" stroke-width="2.6" marker-end="url(#${id}a)"/>`; void mx; }
    P.forEach(([x, y], i) => { s += `<rect x="${x - 130}" y="${y - 30}" width="260" height="60" rx="14" fill="${i === 0 ? "#fbe7e3" : i === 3 ? "#eef6e4" : "#e3eefa"}" stroke="${i === 0 ? VIR : i === 3 ? "#3f6a1f" : "#1f66b0"}" stroke-width="2"/>` + T(x, y - 6, lab[i][0], { a: "middle", s: 14, w: 800 }) + T(x, y + 14, lab[i][1], { a: "middle", s: 13, w: 500 }); });
    s += T(380, 190, "the newly infected plant", { a: "middle", s: 13, w: 600, c: GREY }) + T(380, 208, "becomes a source (back to 1)", { a: "middle", s: 13, w: 600, c: GREY });
    s += T(W - 16, H - 10, "plants cannot move, so the vector does the moving", { a: "end", s: 12, w: 500, c: GREY });
    return s + "</svg>"; }

  // ---- Hypothetical field maps (Crop Disease Investigation) and the simulator's crop ----
  const aphidDot = (x, y, winged, carrying) => `<g><ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="#3f5a1f"/>${winged ? `<path d="M${x - 2} ${y - 3} q 6 -12 14 -8 q -4 8 -12 9 z" fill="#cfe0f2" stroke="#5a7ea6" stroke-width="1"/>` : ""}${carrying ? `<circle cx="${x - 6}" cy="${y}" r="2.6" fill="${VIR}"/>` : ""}</g>`;
  function fieldMap(f, week, o = {}) { const D = B.aphidData; const cw = 44, ch = 34, ox = o.margin === false ? 20 : 92, oy = 46; const W = ox + 12 * cw + 20, H = oy + 8 * ch + 56;
    let s = svgOpen(W, H, `${D.FIELDS[f].name} at week ${week}: map of 96 plants, plants with symptoms shaded`);
    if (f === "A") s += `<rect x="8" y="${oy}" width="${ox - 22}" height="${8 * ch}" rx="6" fill="#e9e1c8" stroke="#8a7d4f"/>` + `<text transform="translate(${(ox - 14) / 2 + 2} ${oy + 4 * ch}) rotate(-90)" text-anchor="middle" font-size="14" font-weight="700" fill="#5d4a1f">weedy margin</text>`;
    for (let c = 0; c < 12; c++) s += T(ox + c * cw + cw / 2, oy - 10, String(c + 1), { a: "middle", s: 12, w: 600, c: GREY });
    for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) { const x = D.fieldWeek(f, r, c); const on = x !== null && x <= week; const src = f === "B" && x === 1;
      s += `<rect x="${ox + c * cw + 3}" y="${oy + r * ch + 3}" width="${cw - 6}" height="${ch - 6}" rx="8" fill="${on ? (src ? "#c0392b" : "#e2c43a") : "#bfe3a8"}" stroke="${on ? "#7a5a12" : "#5f8f45"}" stroke-width="1.2"/>`;
      if (on && o.weeks) s += T(ox + c * cw + cw / 2, oy + r * ch + ch / 2 + 5, String(x), { a: "middle", s: 13, w: 800, c: src ? "#fff" : "#3d2f08" }); }
    s += T(ox, oy + 8 * ch + 24, f === "A" ? "column number (1 = nearest the margin)" : "column number", { s: 13, w: 500, c: GREY });
    s += `<rect x="${ox}" y="${oy + 8 * ch + 34}" width="16" height="12" rx="3" fill="#e2c43a" stroke="#7a5a12"/>` + T(ox + 22, oy + 8 * ch + 45, "symptoms", { s: 13, w: 500 }) + `<rect x="${ox + 110}" y="${oy + 8 * ch + 34}" width="16" height="12" rx="3" fill="#bfe3a8" stroke="#5f8f45"/>` + T(ox + 132, oy + 8 * ch + 45, "no symptoms", { s: 13, w: 500 });
    if (f === "B") s += `<rect x="${ox + 250}" y="${oy + 8 * ch + 34}" width="16" height="12" rx="3" fill="#c0392b"/>` + T(ox + 272, oy + 8 * ch + 45, "first plant seen (week 1)", { s: 13, w: 500 });
    s += T(W - 10, 20, `HYPOTHETICAL data · week ${week}`, { a: "end", s: 13, w: 700, c: "#8a4a00" });
    return s + "</svg>"; }

  // ---- Simulator field (state at a given day) ----
  function simField(res, d, o = {}) { const { cols, rows } = res.p; const cw = 64, ch = 58, ox = res.p.source === "edge" ? 64 : 16, oy = 16; const W = ox + cols * cw + 16, H = oy + rows * ch + 16; const day = res.days[Math.max(0, Math.min(d, res.days.length - 1))];
    let s = svgOpen(W, H, o.aria || `Simulated crop on day ${d + 1}`);
    if (res.p.source === "edge") s += `<rect x="6" y="${oy}" width="${ox - 16}" height="${rows * ch}" rx="6" fill="#e9e1c8" stroke="#8a7d4f"/><text transform="translate(${(ox - 10) / 2 + 2} ${oy + (rows * ch) / 2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="700" fill="#5d4a1f">infected weeds</text>`;
    const fill = { healthy: "#bfe3a8", resistant: "#bfe3a8", infected: "#f3e3a0", symptoms: "#e2c43a", removed: "#e6e9ec" };
    for (const pl of res.plants) { const st = plantState(res, pl.i, d); const x = ox + pl.c * cw, y = oy + pl.r * ch;
      s += `<rect x="${x + 4}" y="${y + 4}" width="${cw - 8}" height="${ch - 8}" rx="12" fill="${fill[st]}" stroke="${st === "resistant" ? "#1f66b0" : st === "removed" ? "#9aa5ae" : "#5f8f45"}" stroke-width="${st === "resistant" ? 2.6 : 1.3}"${st === "removed" ? ' stroke-dasharray="4 3"' : ""}/>`;
      if (st === "removed") s += `<path d="M${x + 20} ${y + 18} l 24 22 M${x + 44} ${y + 18} l -24 22" stroke="#7a8794" stroke-width="2.4"/>`;
      else { s += `<path d="M${x + cw / 2} ${y + ch - 12} v -18" stroke="#2f6a22" stroke-width="2.4"/><path d="M${x + cw / 2} ${y + ch - 24} c -12 -10 -20 -2 -20 -2 c 8 8 20 2 20 2 z M${x + cw / 2} ${y + ch - 26} c 12 -10 20 -2 20 -2 c -8 8 -20 2 -20 2 z" fill="${st === "symptoms" ? "#c8b23a" : "#3f8a2c"}"/>`;
        if (st === "resistant") s += T(x + 10, y + 20, "R", { s: 12, w: 800, c: "#1f66b0" });
        if (pl.i === res.src) s += `<circle cx="${x + cw - 14}" cy="${y + 14}" r="6" fill="${VIR}"/>`;
        const col = day.colonies[pl.i]; if (col > 0) { const n = Math.min(6, Math.ceil(col / 6)); for (let k = 0; k < n; k++) s += `<circle cx="${x + 12 + k * 6}" cy="${y + ch - 10}" r="2.4" fill="#22351a"/>`; } } }
    // winged aphids that moved today (last plant of their path)
    const at = {}; for (const m of day.moved) { const last = m.path[m.path.length - 1]; (at[last] = at[last] || []).push(m); }
    for (const [i, list] of Object.entries(at)) { const pl = res.plants[+i]; const x = ox + pl.c * cw, y = oy + pl.r * ch; list.slice(0, 2).forEach((m, k) => (s += aphidDot(x + cw - 18, y + 16 + k * 13, true, m.carrying))); }
    return s + "</svg>"; }


  // ============================ Phase 4 Batch 5: figures on published or generated pictures ============================
  // Picture layer + SVG overlays (labels, leader lines, arrows) in the picture's own pixel coordinates, using the overlay
  // kit B.photoKit (data/content/_phloem-art.js, loaded first). The older drawings above stay in use where an interactive
  // or a label question depends on them (label question: symptoms).
  const PKa = () => B.photoKit;
  const PSF = { src: "assets/img/aphid-dorsal-psf.png", w: 1484, h: 847 };
  const MIG = { src: "assets/img/aphid-migration.jpg", w: 1536, h: 1024 };

  // ---- d-3.2.9.2-1: winged aphid from above (Pearson Scott Foresman line drawing, public domain). Only the antennae and
  //      the two pairs of wings are labelled (the wings are what the specification needs; the stylets are under the head
  //      and are shown in the feeding figure). No title or key is baked into the picture.
  //      o.numbers (label questions): numbered pins instead of labels, and a second panel beside it with a side view of
  //      the mouthparts (crop of the feeding picture), so the rostrum and stylets can be numbered too.
  //      Names usable in o.numbers: "Antenna", "Wing", "Abdomen", "Rostrum (labium)", "Stylets".
  function aphidDorsal(o = {}) {
    const K = PKa(), C = [0, 30, 1484, 790]; const nums = o.numbers || null;
    if (!nums) {
      const W = 1600, H = 830, dx = 40, dy = 20; const P = K.map(C, dx, dy, 1);
      let s = K.open(W, H, o.aria || "A winged aphid seen from above, with its antennae and its two pairs of wings (forewings and hindwings) labelled", { width: o.width || 760 });
      s += K.pic(PSF, C, dx, dy, 1);
      const L = (lines, x, y, a, pins, opt = {}) => { const [X, Y] = P(x, y); return K.label(lines, X, Y, a, pins.map((q) => P(...q)), Object.assign({ s: 34, s2: 28 }, opt)); };
      s += L(["Antenna"], 400, 92, "end", [[586, 147]]);
      s += L(["Forewing"], 1170, 86, "start", [[1256, 330]]);
      s += L(["Hindwing"], 1150, 700, "start", [[1050, 448]]);
      s += K.T(W - 14, H - 12, "not to scale", { a: "end", s: 26, w: 600, c: K.SUB });
      return s + "</svg>"; }
    // numbered version: dorsal view (left) and side view of the mouthparts (right)
    const W = 1600, H = 660, k1 = 0.72, dx = 20, dy = 40; const P = K.map(C, dx, dy, k1);
    const S = K.STYLET, C2 = [150, 60, 340, 220], k2 = 1.3, dx2 = 1140, dy2 = 170; const Q = K.map(C2, dx2, dy2, k2);
    let s = K.open(W, H, o.aria || "Left: a winged aphid seen from above. Right: a side view of an aphid feeding, with its mouthparts entering a leaf. Numbered pins mark structures to name.", { width: o.width || 760 });
    s += K.pic(PSF, C, dx, dy, k1) + `<rect x="${dx2 - 4}" y="${dy2 - 4}" width="${C2[2] * k2 + 8}" height="${C2[3] * k2 + 8}" fill="none" stroke="#c3ccd6" stroke-width="3"/>` + K.pic(S.img, C2, dx2, dy2, k2);
    s += K.T(dx, 30, "seen from above", { s: 30, w: 700, c: K.SUB }) + K.T(dx2, dy2 - 20, "side view: feeding", { s: 30, w: 700, c: K.SUB });
    const tag = (n, X, Y, pin) => `${K.lead(X, Y, pin[0], pin[1])}<circle cx="${X}" cy="${Y}" r="26" fill="#ffffff" stroke="${K.INK}" stroke-width="4"/>${K.T(X, Y + 11, String(n), { a: "middle", s: 32, w: 800, halo: false })}`;
    const at = { "Antenna": [P(140, 92), P(586, 147)], "Wing": [P(1440, 200), P(1256, 330)], "Abdomen": [P(745, 830), P(745, 700)], "Rostrum (labium)": [Q(240, 250), Q(419, 201)], "Stylets": [Q(330, 300), Q(444, 252)] };
    for (const [name, n] of Object.entries(nums)) { const a = at[name]; if (a) s += tag(n, a[0][0], a[0][1], a[1]); }
    s += K.T(W - 14, H - 12, "not to scale", { a: "end", s: 26, w: 600, c: K.SUB });
    return s + "</svg>"; }

  // ---- the feeding picture (d-3.2.9.2-3): crop x 0–1200, y 0–1024, labels in a column on the right (x 1212) and in the
  //      white space above the leaf. kind: "feed" (the "pressure" and "modes" versions were removed in the release fix
  //      pass: the mass flow figure in 3.2.8.2 and the table in 3.2.9.2 section 7 cover them).
  const FEED_LAB = { aphid: [262, 140], rostrum: [419, 201], stylet: [348, 420], epi: [1150, 252], meso: [1150, 352], xylem: [1000, 560], cc: [1158, 651], plate: [1110, 722], ste: [640, 818], tip: [482, 843] };
  function feedSection(kind, o = {}) {
    const K = PKa(), S = K.STYLET, u = K.id(), C = [0, 0, 1200, 1024], W = 1700, H = 1024; const P = K.map(C, 0, 0, 1), cx = 1214;
    const ARIA = { feed: "Section through a leaf with an aphid feeding from the surface. Its stylets leave the rostrum, pass between the epidermal cells and wind between the mesophyll cells to the vein, where the tip is inside a sieve tube element of the phloem. Above the phloem are empty xylem vessels; beside the sieve tubes are companion cells with nuclei; sieve plates join the sieve tube elements. Arrows show sap moving up the stylets into the aphid." };
    let s = K.open(W, H, o.aria || ARIA[kind], { width: o.width || 900 }) + `<defs>${K.marker(u, "s", SAP)}</defs>`;
    s += K.pic(S.img, C, 0, 0, 1);
    const L = (lines, y, pin, opt = {}) => K.label(lines, cx, y, "start", pin ? [].concat(Array.isArray(pin[0]) ? pin : [pin]).map((p) => P(...p)) : null, Object.assign({ s: 30, s2: 26 }, opt));
    const sapUp = () => K.sapAlong(P, SAP, { k: 1.4 });
    if (kind === "feed") {
      s += sapUp();
      s += K.label(["Aphid"], 150, 44, "end", [P(...FEED_LAB.aphid)], { s: 30 });
      s += K.label(["Rostrum (labium)", "holds the stylets"], 520, 46, "start", [P(...FEED_LAB.rostrum)], { s: 30, s2: 26 });
      s += K.label(["Stylets", "pass between the cells"], 520, 140, "start", [P(...FEED_LAB.stylet)], { s: 30, s2: 26 });
      s += L(["Sap forced up the", "stylets into the gut", "by its own pressure"], 150, [390, 335], { c: SAP, c2: SAP });
      s += L(["Upper epidermis"], 370, FEED_LAB.epi, { w: 700, c: K.SUB });
      s += L(["Mesophyll"], 440, FEED_LAB.meso, { w: 700, c: K.SUB });
      s += L(["Xylem vessel", "empty, no cytoplasm"], 540, FEED_LAB.xylem);
      s += L(["Companion cell", "has a nucleus"], 650, FEED_LAB.cc);
      s += L(["Sieve plate"], 760, FEED_LAB.plate);
      s += L(["Sieve tube element", "the stylet tip is inside it;", "no nucleus"], 860, FEED_LAB.ste);
    }
    s += K.T(W - 14, H - 14, "simplified; not to scale", { a: "end", s: 27, w: 600, c: K.SUB });
    return s + "</svg>"; }

  // ---- d-3.2.9.2-5: winged females migrate (generated picture) ----
  function migration(o = {}) {
    const K = PKa(), u = K.id(), W = MIG.w, H = MIG.h;
    let s = K.open(W, H, o.aria || "A crowded colony of wingless aphids covers the stem and leaves of an infected plant with a mottled yellow leaf. Winged aphids fly away from it towards two healthy plants, where they probe and settle to start new colonies.", { width: o.width || 900 }) + `<defs>${K.marker(u, "f", "#1f4f86")}</defs>`;
    s += `<image href="${MIG.src}" x="0" y="0" width="${W}" height="${H}"/>`;
    // continue two flight paths to the healthy plants
    s += K.arrow(u, "f", "M905 600 Q 980 560 1030 548", "#1f4f86", 5, { da: "14 10" }) + K.arrow(u, "f", "M1010 300 Q 1160 352 1262 468", "#1f4f86", 5, { da: "14 10" });
    s += K.label(["1 Crowded colony", "of wingless aphids on", "an infected plant"], 18, 46, "start", [[205, 560], [96, 760]], { s: 30, s2: 26, from: [150, 122] });
    s += K.label(["Virus symptoms", "(mosaic)"], 470, 860, "start", [[340, 560]], { s: 28, s2: 26, w: 700 });
    s += K.label(["2 Winged females develop", "and fly to new host plants"], 790, 46, "start", [[668, 150]], { s: 30, s2: 26 });
    s += K.label(["3 On a new host plant they", "make brief test probes (which", "may pass on a virus), then settle", "and give birth to wingless young,", "starting a new colony (not shown)"], 1060, 150, "start", [[1352, 500]], { s: 30, s2: 26, from: [1352, 300] });
    s += K.T(W - 14, H - 14, "schematic; not to scale", { a: "end", s: 26, w: 600, c: K.SUB });
    return s + "</svg>"; }

  // concept map helpers are in the consolidation file
  B.aphidArt = { uid, symptoms, routes, cycle, fieldMap, simField, aphidDot, aphidDorsal, feedSection, migration, FEED_LAB };
})(window.BIO);
