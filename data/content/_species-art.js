// Shared model and artwork for 3.1.10 Species and taxonomy (Batch 9, owned by the 3.1.10 author). Loaded before
// data/content/3.1.10.1.js, 3.1.10.2.js, data/consolidation/3.1.10.js and js/views/interactives-species.js.
//
// MODEL (B.speciesModel)
// - RANKS and ORGS: real classifications, checked against standard references (see the author report). Ranks from
//   domain to order are given for the plant as found in many school texts; plant ranks above order differ between
//   classification systems, so no question depends on them except the kingdom (Plantae) and the domain (Eukarya).
//   Domain names (Eukarya and so on) are SUPPORTING: 9610 requires "domain" as a taxon, not the three domain names.
// - SEQ and IMMUNO: ILLUSTRATIVE data for imaginary species P, Q, R, S, T. The aligned sequences are built here from one
//   ancestral sequence by placing substitutions on the branches of the tree ((P,Q),S),R, so that every difference count
//   quoted on the pages is computed from the same letters the student sees. Nothing here is real measured data.
// - WEIGH: ILLUSTRATIVE data for imaginary species W, X, Y, Z, used where immunological and sequence evidence must be
//   weighed against each other.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", NAVY = "#1e3a5f", AMBER = "#c8902a", SAGE = "#6b9a7f", ROSE = "#b4504f";
  const MINT = "#d6efec", SAND = "#f8f3e6", AMBERS = "#fbf0d8", NAVYS = "#e4ebf5", SAGES = "#e2efe6", ROSES = "#f9e3e3";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}${o.f ? ` font-family="${o.f}"` : ""}>${s}</text>`;
  const Rr = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx == null ? 10 : o.rx}" fill="${o.f || "#fff"}" stroke="${o.c || NAVY}" stroke-width="${o.w || 1.6}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}/>`;
  let cnt = 0, U = ""; const uid = () => (U = "-s" + (++cnt));
  const marker = (id, col) => `<marker id="${id}${U}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9z" fill="${col}"/></marker>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || GREY}" stroke-width="${o.w || 1.6}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  const svg = (w, h, aria, inner, width = w) => `<svg viewBox="0 0 ${w} ${h}" width="${width}" role="img" aria-label="${aria}" style="max-width:100%;height:auto">${inner}</svg>`;
  const num = (cx, cy, n) => `<circle cx="${cx}" cy="${cy}" r="12" fill="${NAVY}"/>` + T(cx, cy + 4.5, n, { s: 12, w: 700, c: "#fff" });

  // ================= MODEL =================
  const RANKS = ["domain", "kingdom", "phylum", "class", "order", "family", "genus", "species"];
  const RANK_LABEL = ["Domain", "Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"];
  const EUK = ["Eukarya", "Animalia", "Chordata"], MAM = [...EUK, "Mammalia"];
  const ORGS = {
    human: { common: "Human", taxa: [...MAM, "Primates", "Hominidae", "Homo", "Homo sapiens"] },
    chimp: { common: "Chimpanzee", taxa: [...MAM, "Primates", "Hominidae", "Pan", "Pan troglodytes"] },
    cat: { common: "Domestic cat", taxa: [...MAM, "Carnivora", "Felidae", "Felis", "Felis catus"] },
    lion: { common: "Lion", taxa: [...MAM, "Carnivora", "Felidae", "Panthera", "Panthera leo"] },
    tiger: { common: "Tiger", taxa: [...MAM, "Carnivora", "Felidae", "Panthera", "Panthera tigris"] },
    wolf: { common: "Grey wolf", taxa: [...MAM, "Carnivora", "Canidae", "Canis", "Canis lupus"] },
    sparrow: { common: "House sparrow", taxa: [...EUK, "Aves", "Passeriformes", "Passeridae", "Passer", "Passer domesticus"] },
    bee: { common: "Western honey bee", taxa: ["Eukarya", "Animalia", "Arthropoda", "Insecta", "Hymenoptera", "Apidae", "Apis", "Apis mellifera"] },
    palm: { common: "Date palm", taxa: ["Eukarya", "Plantae", "Angiospermophyta", "Liliopsida", "Arecales", "Arecaceae", "Phoenix", "Phoenix dactylifera"], note: "Plant ranks above order (here phylum Angiospermophyta, the flowering plants, and class Liliopsida, the monocots) differ between classification systems; botanists often say division instead of phylum. Order and the ranks below it are stable." },
  };
  // index of the lowest rank at which two organisms share a taxon (0 = domain ... 7 = species; -1 = none)
  const sharedRank = (a, b) => { const A = ORGS[a].taxa, Bt = ORGS[b].taxa; let k = -1; for (let i = 0; i < 8; i++) { if (A[i] === Bt[i]) k = i; else break; } return k; };

  // Illustrative aligned sequences (30 bases of one gene) for species P, Q, R, S.
  const ANC = "GCTTACGGTCTAGCAACTGGTCGTAAGCTA";
  const SUB = { A: "G", G: "A", C: "T", T: "C" }; // transitions, so every substitution changes the base
  const mut = (s, pos) => s.split("").map((b, i) => (pos.includes(i) ? SUB[b] : b)).join("");
  const BR = { PQ: [5, 21], P: [9], Q: [25], S: [10, 16, 26], R: [2, 7, 13, 18, 23, 28] }; // substitutions on each branch
  const SEQ = { P: mut(ANC, [...BR.PQ, ...BR.P]), Q: mut(ANC, [...BR.PQ, ...BR.Q]), S: mut(ANC, BR.S), R: mut(ANC, BR.R) };
  const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
  const diffPos = (a, b) => a.split("").map((x, i) => (x !== b[i] ? i : -1)).filter((i) => i >= 0);
  const SEQ_ORDER = ["P", "Q", "S", "R"];
  const matrix = () => Object.fromEntries(SEQ_ORDER.map((a) => [a, Object.fromEntries(SEQ_ORDER.map((b) => [b, diff(SEQ[a], SEQ[b])]))]));
  // Illustrative immunological data: antiserum against the serum albumin of species P (precipitate as % of that with P serum)
  const IMMUNO = { antiserum: "P", values: [["P", 100], ["Q", 86], ["S", 64], ["R", 42], ["T", 12]] };
  // Illustrative data to weigh: four imaginary species W–Z
  const WEIGH = {
    antiW: [["W", 100], ["X", 78], ["Y", 81], ["Z", 30]],
    antiX: [["X", 100], ["W", 84], ["Y", 72], ["Z", 27]],
    bases: 12000, // aligned bases from 12 genes
    seqDiff: { "W-X": 96, "W-Y": 236, "W-Z": 598, "X-Y": 232, "X-Z": 604, "Y-Z": 590 },
  };
  B.speciesModel = { RANKS, RANK_LABEL, ORGS, sharedRank, ANC, SEQ, SEQ_ORDER, BR, diff, diffPos, matrix, IMMUNO, WEIGH };

  // ================= DRAWINGS =================
  // 1. Horse x donkey: mule and hinny; why the hybrid is sterile
  function muleCross() {
    uid(); let s = `<defs>${marker("ar", GREY)}</defs>`;
    s += Rr(20, 20, 200, 64, { f: NAVYS }) + T(120, 44, "Horse", { s: 14, w: 700 }) + T(120, 62, "Equus caballus", { s: 12, i: 1 }) + T(120, 77, "2n = 64", { s: 11, c: GREY });
    s += Rr(420, 20, 200, 64, { f: AMBERS, c: AMBER }) + T(520, 44, "Donkey", { s: 14, w: 700 }) + T(520, 62, "Equus asinus", { s: 12, i: 1 }) + T(520, 77, "2n = 62", { s: 11, c: GREY });
    s += L(120, 84, 120, 118, { m: "ar" }) + L(520, 84, 520, 118, { m: "ar" }) + T(132, 106, "meiosis", { s: 10.5, c: GREY, a: "start" }) + T(508, 106, "meiosis", { s: 10.5, c: GREY, a: "end" });
    s += Rr(60, 122, 120, 36, { f: "#fff" }) + T(120, 145, "gamete n = 32", { s: 12, w: 600 }) + Rr(460, 122, 120, 36, { f: "#fff", c: AMBER }) + T(520, 145, "gamete n = 31", { s: 12, w: 600 });
    s += L(180, 140, 252, 186, { m: "ar" }) + L(460, 140, 388, 186, { m: "ar" }) + T(320, 150, "fertilisation", { s: 10.5, c: GREY });
    s += Rr(220, 190, 200, 62, { f: SAGES, c: SAGE }) + T(320, 214, "Mule or hinny", { s: 14, w: 700 }) + T(320, 232, "2n = 63", { s: 12 }) + T(320, 246, "32 horse + 31 donkey chromosomes", { s: 10, c: GREY });
    // pairing problem
    const bar = (x, y, h, c) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`;
    let px = 52; s += T(130, 282, "In the hybrid's meiosis", { s: 11.5, w: 700 });
    [[36, 36], [30, 30], [24, 24], [40, 0]].forEach(([h1, h2], i) => { const x = px + i * 46; s += bar(x, 296, h1, NAVY) + (h2 ? bar(x + 12, 296, h2, AMBER) : `<text x="${x + 13}" y="${318}" text-anchor="middle" font-size="16" font-weight="700" fill="${ROSE}">?</text>`); });
    s += T(130, 358, "Horse and donkey chromosomes differ in", { s: 10.5, c: GREY }) + T(130, 372, "number and structure, so many cannot", { s: 10.5, c: GREY }) + T(130, 386, "form homologous pairs.", { s: 10.5, c: GREY });
    s += Rr(270, 276, 350, 112, { f: "#fff", c: ROSE }) + T(445, 298, "Result: mules and hinnies are (almost always) sterile", { s: 11.5, w: 700, c: ROSE });
    s += T(445, 318, "Meiosis fails, so very few viable gametes form.", { s: 11 }) + T(445, 336, "Horses and donkeys interbreed, but the", { s: 11 }) + T(445, 352, "offspring are not fertile: by the definition", { s: 11 }) + T(445, 368, "they are separate species.", { s: 11, w: 700 }) + T(445, 383, "(a very few fertile female mules are on record)", { s: 9.5, c: GREY });
    s += T(320, 410, "Mule: male donkey × female horse.   Hinny: male horse × female donkey.", { s: 11, c: NAVY, w: 600 });
    return svg(640, 420, "Horse, 2n = 64, and donkey, 2n = 62, each make gametes by meiosis (n = 32 and n = 31). Fertilisation gives a mule or hinny with 2n = 63. In the hybrid's meiosis horse and donkey chromosomes cannot all pair, so mules and hinnies are almost always sterile and horses and donkeys are separate species.", s, 640);
  }

  // 2. Decision flow: can the biological species definition be applied?
  function flow() {
    uid(); let s = `<defs>${marker("fa", GREY)}</defs>`;
    const W = 500; const qx = 20, qw = 250, ox = 312, ow = 184;
    const steps = [
      ["Do the organisms reproduce sexually?", "No: definition cannot be applied", "Asexual organisms (bacteria, all-female lizards) reproduce without mating. Use other evidence: features, DNA.", ROSE, ROSES],
      ["Are they alive today?", "No: cannot be tested", "Extinct organisms are known from fossils (and sometimes ancient DNA). Judge from structure.", ROSE, ROSES],
      ["Do they ever have the chance to meet and mate?", "No: cannot be tested in nature", "Geographically separated populations. Matings in captivity may not show what happens in the wild.", AMBER, AMBERS],
      ["Do they interbreed in natural conditions?", "No: usually separate species", "Song, behaviour, timing or body shape can stop mating. Beware: dogs of very different sizes are still one species.", AMBER, AMBERS],
      ["Are the offspring fertile?", "No: separate species", "Mules and hinnies (horse × donkey) are sterile.", SAGE, SAGES],
    ];
    let y = 20;
    steps.forEach(([q, out, why, c, f], i) => {
      s += Rr(qx, y, qw, 54, { f: NAVYS }) + T(qx + qw / 2, y + 22, q.length > 34 ? q.slice(0, q.lastIndexOf(" ", 34)) : q, { s: 12, w: 700 }) + (q.length > 34 ? T(qx + qw / 2, y + 39, q.slice(q.lastIndexOf(" ", 34) + 1), { s: 12, w: 700 }) : "");
      s += L(qx + qw, y + 27, ox - 4, y + 27, { m: "fa" }) + T((qx + qw + ox) / 2, y + 18, "no", { s: 10.5, c: GREY, w: 700 });
      s += Rr(ox, y - 6, ow, 74, { f, c }) + T(ox + ow / 2, y + 12, out, { s: 10.5, w: 700, c });
      const words = why.split(" "); const lines = []; let cur = ""; words.forEach((w) => { if ((cur + " " + w).trim().length > 33) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }); lines.push(cur.trim());
      lines.slice(0, 4).forEach((ln, k) => (s += T(ox + ow / 2, y + 27 + k * 12, ln, { s: 9.5, c: INK })));
      if (i < steps.length - 1) s += L(qx + qw / 2, y + 54, qx + qw / 2, y + 86, { m: "fa" }) + T(qx + qw / 2 + 8, y + 74, "yes", { s: 10.5, c: GREY, w: 700, a: "start" });
      y += 92;
    });
    s += L(qx + qw / 2, y - 38, qx + qw / 2, y - 6, { m: "fa" }) + T(qx + qw / 2 + 8, y - 18, "yes", { s: 10.5, c: GREY, w: 700, a: "start" });
    s += Rr(qx, y - 2, W - 30, 70, { f: MINT, c: TEAL }) + T(qx + (W - 30) / 2, y + 18, "Yes: by the definition, one species. But judgement is still needed:", { s: 11.5, w: 700, c: TEAL });
    s += T(qx + (W - 30) / 2, y + 36, "some recognised species produce fertile hybrids (polar bear × brown bear),", { s: 10.5 }) + T(qx + (W - 30) / 2, y + 52, "and some hybrids are only partly fertile (female ligers have bred; males are sterile).", { s: 10.5 });
    return svg(W, y + 78, "Flow chart for applying the biological species definition. Five questions in turn: do the organisms reproduce sexually, are they alive today, do they have the chance to meet, do they interbreed in natural conditions, are the offspring fertile. A no to the first three means the definition cannot be applied or tested; a no to the last two suggests separate species. Yes to all suggests one species, but fertile hybrids between recognised species and partly fertile hybrids mean judgement is still needed.", s, W);
  }

  // 3. Writing a binomial
  function binomial() {
    uid(); let s = "";
    s += T(300, 66, "Panthera", { s: 44, w: 600, i: 1, c: NAVY, a: "end" }) + T(318, 66, "leo", { s: 44, w: 600, i: 1, c: NAVY, a: "start" });
    s += `<path d="M126 82 v10 h174 v-10" fill="none" stroke="${TEAL}" stroke-width="1.6"/><path d="M314 82 v10 h76 v-10" fill="none" stroke="${AMBER}" stroke-width="1.6"/>`;
    s += T(213, 110, "genus name", { s: 13, w: 700, c: TEAL }) + T(213, 126, "capital first letter", { s: 11, c: TEAL });
    s += T(400, 110, "species name", { s: 13, w: 700, c: AMBER }) + T(400, 126, "all lower case", { s: 11, c: AMBER });
    s += Rr(20, 146, 500, 118, { f: SAND, c: "#b49a63" });
    const tx = (y, parts, c = INK, w = 500) => `<text x="36" y="${y}" font-size="12" font-weight="${w}" fill="${c}">${parts.map((p) => (p[0] === "*" ? `<tspan font-style="italic">${p.slice(1)}</tspan>` : p)).join("")}</text>`;
    s += tx(168, ["In print: italics, ", "*Panthera leo", "."]) + T(36, 190, "Handwritten: underline each word separately:", { s: 12, a: "start" });
    s += T(342, 190, "Panthera", { s: 13, a: "start", f: "cursive" }) + `<line x1="342" y1="194" x2="398" y2="194" stroke="${INK}" stroke-width="1.2"/>` + T(404, 190, "leo", { s: 13, a: "start", f: "cursive" }) + `<line x1="404" y1="194" x2="424" y2="194" stroke="${INK}" stroke-width="1.2"/>`;
    s += tx(212, ["After first use the genus may be shortened: ", "*P. leo", "."]);
    s += tx(234, ["Same genus, different species: ", "*Panthera tigris", " (tiger)."]);
    s += tx(254, ["Never: ", "*panthera Leo", ", ", "*Panthera Leo", ", or ", "*leo", " on its own."], ROSE, 600);
    return svg(540, 276, "The binomial Panthera leo, with the genus name Panthera (capital first letter) and the species name leo (lower case). Printed in italics; handwritten, each word underlined; the genus may be shortened to P. after first use. The tiger, Panthera tigris, shares the genus. Wrong forms: panthera Leo, Panthera Leo, or leo alone.", s, 540);
  }

  // 4. Nested taxa for one organism (domain outermost)
  const ALSO = {
    lion: ["also plants, fungi and protoctists", "also insects, worms, fish", "also fish, amphibians, birds", "also humans, bats, whales", "also dogs, bears, seals", "also the domestic cat", "also the tiger, leopard", "one species"],
    human: ["also plants, fungi and protoctists", "also insects, worms, fish", "also fish, amphibians, birds", "also cats, bats, whales", "also monkeys, lemurs", "also chimpanzees, gorillas", "no other living species", "one species"],
  };
  function nested(key = "lion", o = {}) {
    uid(); const org = ORGS[key]; const W = 600, step = 15, band = 30; let s = "";
    const fills = ["#f3f6f9", NAVYS, "#eaf2f1", MINT, SAGES, AMBERS, "#fdf6e7", "#fff"];
    const strokes = [GREY, NAVY, TEAL, TEAL, SAGE, AMBER, AMBER, ROSE];
    const H = 310;
    for (let i = 0; i < 8; i++) {
      const x = 10 + i * step, y = 10 + i * band, w = W - 20 - 2 * i * step, h = H - 20 - 36 * i;
      s += Rr(x, y, w, h, { f: fills[i], c: strokes[i], rx: 12 });
      s += `<text x="${x + 12}" y="${y + 20}" font-size="12.5" fill="${INK}"><tspan font-weight="700" fill="${strokes[i] === GREY ? INK : strokes[i]}">${RANK_LABEL[i]}:</tspan> <tspan font-weight="600"${i >= 6 ? ' font-style="italic"' : ""}>${org.taxa[i]}</tspan></text>`;
      if (!o.bare && ALSO[key]) s += T(x + w - 12, y + 20, ALSO[key][i], { s: 10.5, a: "end", c: GREY });
    }
    return svg(W, H, `Nested boxes showing the classification of the ${org.common.toLowerCase()}: ${org.taxa.map((t, i) => RANK_LABEL[i].toLowerCase() + " " + t).join(", ")}. Each taxon sits inside the larger one above it.`, s, W);
  }

  // 5. Classification tree for seven organisms, one row per rank
  function tree(keys = ["human", "chimp", "cat", "lion", "tiger", "sparrow", "palm"]) {
    uid(); const dx = 108, x0 = 122, top = 26, dy = 44; let s = "";
    const W = x0 + dx * (keys.length - 1) + 70, H = top + dy * 7 + 34;
    for (let r = 0; r < 8; r++) { const y = top + r * dy; s += `<rect x="0" y="${y - 15}" width="${W}" height="30" fill="${r % 2 ? "#fff" : "#f4f8f7"}"/>` + T(10, y + 4, RANK_LABEL[r], { s: 11.5, w: 700, a: "start", c: GREY }); }
    // nodes per rank: group leaves by taxon prefix
    const nodes = []; for (let r = 0; r < 8; r++) { const groups = {}; keys.forEach((k, j) => { const key = ORGS[k].taxa.slice(0, r + 1).join("|"); (groups[key] = groups[key] || []).push(j); }); nodes.push(Object.entries(groups).map(([key, js]) => ({ key, name: key.split("|")[r], x: x0 + dx * (js.reduce((a, b) => a + b, 0) / js.length), y: top + r * dy }))); }
    for (let r = 1; r < 8; r++) for (const n of nodes[r]) { const p = nodes[r - 1].find((m) => n.key.startsWith(m.key + "|")); s += `<path d="M${p.x} ${p.y + 7} V${(p.y + n.y) / 2} H${n.x} V${n.y - 9}" fill="none" stroke="${"#9fb3b0"}" stroke-width="1.6"/>`; }
    for (let r = 0; r < 8; r++) for (const n of nodes[r]) { if (r === 7) n.name = n.name.replace(/^(\w)\w+ /, "$1. "); const it = r >= 6; const w = Math.max(44, n.name.length * 6.6 + 10); s += `<rect x="${n.x - w / 2}" y="${n.y - 9}" width="${w}" height="17" rx="8" fill="#fff" stroke="${r === 7 ? TEAL : "#c9d6d3"}"/>` + T(n.x, n.y + 3.8, n.name, { s: 10.5, w: r === 7 ? 700 : 500, i: it }); }
    keys.forEach((k, j) => (s += T(x0 + dx * j, top + 7 * dy + 26, ORGS[k].common, { s: 10.5, c: GREY })));
    return svg(W, H, "Classification tree with one row for each rank from domain to species, for human, chimpanzee, domestic cat, lion, tiger, house sparrow and date palm. All share domain Eukarya; the date palm separates at kingdom (Plantae); the house sparrow at class (Aves); humans and chimpanzees share family Hominidae; the cat, lion and tiger share family Felidae; lion and tiger share genus Panthera. In the species row the genus is abbreviated to its initial.", s, W);
  }

  // 6. Immunological comparison (precipitin test)
  function immuno(o = {}) {
    uid(); let s = `<defs>${marker("ia", GREY)}</defs>`; const lab = !o.numbers;
    // row 1
    s += T(280, 20, "Comparing a protein between species with antibodies", { s: 13, w: 700, c: NAVY });
    // step 1 tube
    const tube = (x, y, h, fill, ppt) => `<path d="M${x - 14} ${y} v${h} a14 14 0 0 0 28 0 v-${h}" fill="#fff" stroke="${NAVY}" stroke-width="1.6"/><path d="M${x - 12} ${y + 22} v${h - 22} a12 12 0 0 0 24 0 v-${h - 22}z" fill="${fill}" opacity=".85"/>` + (ppt ? `<path d="M${x - 12} ${y + h + 12 - ppt} h24 v${ppt - 12} a12 12 0 0 1 -24 0z" fill="#f7f4ec" stroke="#b49a63" stroke-width="1"/>` : "");
    s += tube(70, 44, 60, "#f2d48a", 0) + (lab ? T(70, 140, "1. Serum albumin", { s: 11, w: 700 }) + T(70, 154, "from species A", { s: 11 }) : num(36, 74, 1));
    s += L(100, 80, 158, 80, { m: "ia" }) + T(129, 72, "injected", { s: 10, c: GREY });
    // rabbit (simple outline)
    s += `<ellipse cx="218" cy="88" rx="44" ry="26" fill="#f1ede6" stroke="${GREY}" stroke-width="1.6"/><circle cx="262" cy="70" r="15" fill="#f1ede6" stroke="${GREY}" stroke-width="1.6"/><ellipse cx="262" cy="46" rx="5" ry="15" fill="#f1ede6" stroke="${GREY}" stroke-width="1.4"/><ellipse cx="273" cy="48" rx="5" ry="14" fill="#f1ede6" stroke="${GREY}" stroke-width="1.4"/><circle cx="267" cy="68" r="2" fill="${INK}"/>`;
    s += lab ? T(218, 132, "2. A rabbit makes antibodies", { s: 11, w: 700 }) + T(218, 146, "specific to A's albumin", { s: 11 }) : "";
    s += L(272, 92, 340, 92, { m: "ia" }) + T(306, 84, "blood taken", { s: 10, c: GREY });
    s += tube(372, 44, 60, "#e9c9c9", 0) + `<g fill="${TEAL}">${[[366, 84], [378, 96], [368, 108], [379, 118]].map(([x, y]) => `<path d="M${x} ${y} l-4 -6 M${x} ${y} l4 -6 M${x} ${y} v6" stroke="${TEAL}" stroke-width="1.6"/>`).join("")}</g>` + (lab ? T(372, 140, "3. Antiserum: contains", { s: 11, w: 700 }) + T(372, 154, "anti-A albumin antibodies", { s: 11 }) : num(406, 70, 2));
    s += L(404, 92, 470, 166, { m: "ia" }) + T(478, 108, "added to", { s: 10, c: GREY, a: "start" }) + T(478, 120, "each tube", { s: 10, c: GREY, a: "start" });
    // row 2: tubes with serum from A, B, C, D
    const sp = [["A", 34], ["B", 26], ["C", 19], ["D", 13]];
    s += Rr(40, 172, 480, 152, { f: "#fbfcfc", c: "#c9d6d3", rx: 12 });
    s += lab ? T(280, 192, "4. Serum from each species + antiserum", { s: 11.5, w: 700 }) : "";
    sp.forEach(([n, p], i) => { const x = 140 + i * 90; s += tube(x, 204, 56, "#f2d48a", p) + T(x, 300, `species ${n}`, { s: 11, w: 700 }); });
    // marker 3 drawn after the tubes so its leader stays visible; it points into the upper (liquid) layer of tube B, clear of any precipitate
    s += lab ? "" : `<line x1="230" y1="198" x2="230" y2="234" stroke="${GREY}" stroke-width="1"/><circle cx="230" cy="234" r="2" fill="${GREY}"/>` + num(230, 186, 3);
    s += lab ? T(280, 318, "Precipitate (pale layer): antibodies bound to similar albumin", { s: 10.5, c: GREY }) : `<line x1="488" y1="266" x2="424" y2="266" stroke="${GREY}" stroke-width="1"/>` + num(500, 266, 4);
    s += Rr(40, 336, 480, 58, { f: MINT, c: TEAL }) + T(280, 356, "More precipitate = albumin more similar to A's", { s: 12, w: 700, c: TEAL }) + T(280, 374, "= more closely related to A (more recent common ancestor).", { s: 11.5 }) + T(280, 388, "Here: A (reference, most), then B, then C; D least related.", { s: 10.5, c: GREY });
    return svg(560, 402, o.numbers ? "Immunological comparison with numbered parts: 1 albumin extracted from species A, 2 antiserum containing antibodies, 3 serum from species B, one of the species being compared, 4 precipitate in the tube for species D" : "Immunological comparison in four steps: serum albumin from species A is injected into a rabbit; the rabbit makes antibodies specific to A's albumin; antiserum is collected and added to serum from species A, B, C and D; the amount of precipitate is greatest for A, then B, then C, and least for D, so B is the most closely related to A of the three others.", s, 560);
  }

  // 7. Precipitate bar chart for given data
  function bars(data, o = {}) {
    uid(); const W = 460, x0 = 70, y0 = 30, h = 190, bw = 44, gap = (W - x0 - 20 - data.length * bw) / Math.max(1, data.length); let s = "";
    for (let v = 0; v <= 100; v += 20) { const y = y0 + h - (v / 100) * h; s += L(x0, y, W - 10, y, { c: "#e3ecea", w: 1 }) + T(x0 - 8, y + 4, v, { s: 10.5, a: "end", c: GREY }); }
    s += L(x0, y0, x0, y0 + h, { c: INK, w: 1.4 }) + L(x0, y0 + h, W - 10, y0 + h, { c: INK, w: 1.4 });
    data.forEach(([n, v], i) => { const x = x0 + gap / 2 + i * (bw + gap); const bh = (v / 100) * h; s += `<rect x="${x}" y="${y0 + h - bh}" width="${bw}" height="${bh}" fill="${i === 0 ? GREY : TEAL}" opacity="${i === 0 ? 0.55 : 0.85}"/>` + T(x + bw / 2, y0 + h - bh - 6, v, { s: 11, w: 700 }) + T(x + bw / 2, y0 + h + 17, n, { s: 12, w: 700 }); });
    s += `<text transform="translate(18 ${y0 + h / 2}) rotate(-90)" text-anchor="middle" font-size="11" fill="${GREY}">precipitate / % of reference</text>` + T((x0 + W) / 2, y0 + h + 38, o.xlab || "serum from species", { s: 11, c: GREY });
    if (o.title) s += T((x0 + W) / 2, 16, o.title, { s: 11.5, w: 700, c: NAVY });
    return svg(W, y0 + h + 48, o.aria || `Bar chart of precipitate as a percentage of the reference: ${data.map(([n, v]) => n + " " + v).join(", ")}`, s, W);
  }

  // 8. Sequence comparison: alignment with differences from a reference highlighted, and the difference matrix
  function seqCompare(ref = "P") {
    uid(); const cw = 12.6, x0 = 70, y0 = 46, rh = 26; let s = "";
    s += T(10, 22, `Aligned sequences (30 bases of one gene); bases that differ from ${ref} are boxed`, { s: 12, w: 700, a: "start", c: NAVY });
    for (let j = 0; j < 30; j += 5) s += T(x0 + j * cw + cw / 2, y0 - 6, j + 1, { s: 8.5, c: GREY });
    SEQ_ORDER.forEach((k, r) => { const y = y0 + r * rh; const sq = SEQ[k]; s += T(30, y + 16, k, { s: 13, w: 700 });
      sq.split("").forEach((b, j) => { const d = k !== ref && b !== SEQ[ref][j]; const x = x0 + j * cw; if (d) s += `<rect x="${x}" y="${y + 1}" width="${cw}" height="21" rx="3" fill="${AMBERS}" stroke="${AMBER}" stroke-width="1.2"/>`; s += T(x + cw / 2, y + 16, b, { s: 12, w: d ? 700 : 500, f: "monospace", c: d ? "#7a520d" : INK }); });
      s += T(x0 + 30 * cw + 14, y + 16, k === ref ? "reference" : `${diff(SEQ[k], SEQ[ref])} differences`, { s: 11, a: "start", c: k === ref ? GREY : INK, w: k === ref ? 500 : 700 }); });
    const m = matrix(), mx = 120, my = y0 + 4 * rh + 26, c = 46;
    s += T(10, my + 4, "Number of differences between each pair", { s: 12, w: 700, a: "start", c: NAVY });
    SEQ_ORDER.forEach((k, i) => { s += T(mx + (i + 0.5) * c, my + 26, k, { s: 12, w: 700 }) + T(mx - 14, my + 26 + (i + 1) * 22, k, { s: 12, w: 700 }); });
    SEQ_ORDER.forEach((a, i) => SEQ_ORDER.forEach((b, j) => { const x = mx + j * c, y = my + 32 + i * 22; s += `<rect x="${x}" y="${y}" width="${c}" height="22" fill="${i === j ? "#eef2f4" : "#fff"}" stroke="#c9d6d3"/>` + T(x + c / 2, y + 15, i === j ? "–" : m[a][b], { s: 12, w: i === j ? 400 : 600 }); }));
    s += T(mx + 4 * c + 20, my + 60, "Fewest differences:", { s: 11, a: "start", c: GREY }) + T(mx + 4 * c + 20, my + 76, "most recent common ancestor.", { s: 11, a: "start", c: GREY }) + T(mx + 4 * c + 20, my + 100, "Illustrative data, imaginary species.", { s: 10.5, a: "start", c: ROSE, w: 600 });
    return svg(560, my + 32 + 4 * 22 + 12, `Four aligned 30-base sequences for imaginary species P, Q, S and R, with bases that differ from ${ref} boxed, and a table of the number of differences between each pair: P–Q ${m.P.Q}, P–S ${m.P.S}, P–R ${m.P.R}, Q–S ${m.Q.S}, Q–R ${m.Q.R}, S–R ${m.S.R}. Illustrative data.`, s, 560);
  }

  // 9. Plain alignment for counting practice (no highlighting, no counts)
  function align(keys = SEQ_ORDER) {
    uid(); const cw = 12.6, x0 = 52, y0 = 30, rh = 24; let s = "";
    for (let j = 0; j < 30; j += 5) s += T(x0 + j * cw + cw / 2, y0 - 8, j + 1, { s: 8.5, c: GREY });
    keys.forEach((k, r) => { const y = y0 + r * rh; s += T(24, y + 15, k, { s: 13, w: 700 }); SEQ[k].split("").forEach((b, j) => { const x = x0 + j * cw; if (j % 5 === 0) s += `<rect x="${x}" y="${y}" width="${cw * 5}" height="20" fill="${r % 2 ? "#fff" : "#f4f8f7"}"/>`; }); SEQ[k].split("").forEach((b, j) => (s += T(x0 + j * cw + cw / 2, y + 15, b, { s: 12, f: "monospace" }))); });
    s += T(x0, y0 + keys.length * rh + 14, "Illustrative data: imaginary species.", { s: 10.5, a: "start", c: ROSE, w: 600 });
    return svg(440, y0 + keys.length * rh + 22, `Aligned 30-base sequences of one gene for imaginary species ${keys.join(", ")}: ${keys.map((k) => k + " " + SEQ[k]).join("; ")}. Illustrative data.`, s, 440);
  }

  B.speciesArt = { muleCross, flow, binomial, nested, tree, immuno, bars, seqCompare, align, colours: { INK, GREY, TEAL, NAVY, AMBER, SAGE, ROSE, MINT, AMBERS, SAGES, ROSES, NAVYS }, svg, T };
})(window.BIO);
