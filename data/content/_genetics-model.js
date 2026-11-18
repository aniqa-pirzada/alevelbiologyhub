// Genetics engine for 3.3.6 Inheritance (Phase 5 Batch 3, author B3). B.geneticsModel.
// Model specification, hand-worked test cases and answer key: scratchpad p5b3/B3-MODEL.md (reviewed as MR-B3, whose
// independent enumeration script agreed with every case). Students see only a one-line "Simplified model" note.
//
// Biology. A diploid parent carries two alleles at each locus. In meiosis the two chromosomes of each homologous pair go
// to different gametes, so a gamete carries one allele of each gene. Pairs segregate independently (genes on different
// chromosomes assort independently). Linked genes on one chromosome travel together unless crossing over between the
// loci makes recombinant chromosomes; the engine uses crossing over ONLY when a scenario states a recombinant frequency.
// The X chromosome carries the X-linked gene and the Y chromosome carries no allele of it. Fertilisation is random:
// every gamete of one parent meets every gamete of the other, weighted by gamete frequency (exhaustive enumeration,
// never a look-up table of ratios).
//
// Representation. A scenario lists its loci and groups them into "pairs" (homologous chromosome pairs):
//   { type: "A", loci: [i] }            one autosomal gene
//   { type: "A", loci: [i, j] }         two linked autosomal genes (M6), rf = whole-number percentage of recombinants
//   { type: "X", loci: [i] }            the X-linked gene (a male carries Y, written null, on the second chromosome)
// A genotype is { sex: "F" | "M" | null, pairs: [[hapA, hapB], ...] } where a hap is an array of allele symbols (or
// null for Y). Gamete weights are integers: for a linked double heterozygote each parental chromosome gets (100 - rf)
// and each recombinant rf, identical chromosomes merged by adding weights.
//
// Supported models (anything else is refused with a plain reason, never answered):
//   M1 monohybrid, complete dominance          M5 one X-linked gene, complete dominance
//   M2 monohybrid, codominance                 M6 two linked autosomal genes (rf 0 unless the scenario states rf)
//   M3 multiple alleles (three)                M7 epistasis: E1 recessive 9:3:4, E2 dominant 12:3:1, E3 complementary 9:7
//   M4 dihybrid, independent assortment        M8 one X-linked gene with one autosomal gene (independent assortment)
// Limitations: expected ratios are probabilities and real counts vary by chance; not modelled: mutation, lethal alleles,
// incomplete dominance, three or more genes, two X-linked genes, Y-linkage, ZW sex determination, codominant X-linked
// alleles, polygenes, environmental effects (taught in 3.3.6.1), non-disjunction. Drosophila linkage assumes no
// crossing over (stated in the scenario).
window.BIO = window.BIO || {};
(function (B) {
  // ---------------------------------------------------------------- alleles and scenarios
  // a(sym, txt, html): sym is the internal code, txt the Unicode form used in questions, html the notes form.
  const a = (sym, txt, html) => ({ sym, txt, html: html || txt });
  const sup = (base, s, u) => a(base + s, base + u, `${base}<sup>${s}</sup>`);
  const xa = (s, u) => a("X" + s, "X" + u, `X<sup>${s}</sup>`);
  const RULES = ["E1", "E2", "E3"];

  // ph(fn): fn receives at(i) = array of the allele symbols at locus i (one allele for a male's X-linked locus) and sex.
  const has = (arr, s) => arr.indexOf(s) >= 0;
  const DEFS = [
    { id: "pea", model: "M1", tab: "Monohybrid", title: "Pea seed shape", loci: [{ name: "seed shape", al: [a("R", "R"), a("r", "r")] }], pairs: [{ type: "A", loci: [0] }],
      key: [["R", "round seeds (dominant)"], ["r", "wrinkled seeds (recessive)"]], assume: "R is dominant to r.",
      classes: ["round", "wrinkled"], ph: (at) => (has(at(0), "R") ? 0 : 1) },
    { id: "cf", model: "M1", tab: "Monohybrid", title: "Human cystic fibrosis", loci: [{ name: "CFTR", al: [a("F", "F"), a("f", "f")] }], pairs: [{ type: "A", loci: [0] }],
      key: [["F", "unaffected (dominant)"], ["f", "cystic fibrosis (recessive)"]], assume: "F is dominant to f; Ff people are unaffected carriers.",
      classes: ["unaffected", "cystic fibrosis"], ph: (at) => (has(at(0), "F") ? 0 : 1), carrier: (at) => at(0).join("") === "Ff" },
    { id: "roan", model: "M2", tab: "Codominance", title: "Shorthorn cattle coat colour", loci: [{ name: "coat", al: [sup("C", "R", "ᴿ"), sup("C", "W", "ᵂ")] }], pairs: [{ type: "A", loci: [0] }],
      key: [["Cᴿ", "red"], ["Cᵂ", "white"]], assume: "Cᴿ and Cᵂ are codominant: a heterozygote has red and white hairs (roan).",
      classes: ["red", "roan", "white"], ph: (at) => { const s = at(0); return has(s, "CR") && has(s, "CW") ? 1 : has(s, "CR") ? 0 : 2; } },
    { id: "abo", model: "M3", tab: "Multiple alleles", title: "Human ABO blood groups", loci: [{ name: "ABO", al: [sup("I", "A", "ᴬ"), sup("I", "B", "ᴮ"), sup("I", "O", "ᴼ")] }], pairs: [{ type: "A", loci: [0] }],
      key: [["Iᴬ", "antigen A"], ["Iᴮ", "antigen B"], ["Iᴼ", "neither antigen"]], assume: "Iᴬ and Iᴮ are codominant; both are dominant to Iᴼ.",
      classes: ["A", "B", "AB", "O"], ph: (at) => { const s = at(0), A = has(s, "IA"), Bb = has(s, "IB"); return A && Bb ? 2 : A ? 0 : Bb ? 1 : 3; } },
    { id: "rabbit", model: "M3", tab: "Multiple alleles", title: "Rabbit coat colour", loci: [{ name: "coat", al: [a("C", "C"), sup("c", "h", "ʰ"), a("c", "c")] }], pairs: [{ type: "A", loci: [0] }],
      key: [["C", "full colour"], ["cʰ", "Himalayan (dark ears, nose, feet and tail)"], ["c", "albino"]], assume: "C is dominant to cʰ and c; cʰ is dominant to c.",
      classes: ["full colour", "Himalayan", "albino"], ph: (at) => { const s = at(0); return has(s, "C") ? 0 : has(s, "ch") ? 1 : 2; } },
    { id: "peadi", model: "M4", tab: "Dihybrid", title: "Pea seed shape and seed colour", loci: [{ name: "seed shape", al: [a("R", "R"), a("r", "r")] }, { name: "seed colour", al: [a("Y", "Y"), a("y", "y")] }], pairs: [{ type: "A", loci: [0] }, { type: "A", loci: [1] }],
      key: [["R", "round"], ["r", "wrinkled"], ["Y", "yellow"], ["y", "green"]], assume: "The two genes are on different chromosomes, so they assort independently. R and Y are dominant.",
      classes: ["round yellow", "round green", "wrinkled yellow", "wrinkled green"], ph: (at) => (has(at(0), "R") ? 0 : 2) + (has(at(1), "Y") ? 0 : 1) },
    { id: "cattledi", model: "M4", tab: "Dihybrid", title: "Cattle coat colour and horns", loci: [{ name: "coat", al: [sup("C", "R", "ᴿ"), sup("C", "W", "ᵂ")] }, { name: "horns", al: [a("P", "P"), a("p", "p")] }], pairs: [{ type: "A", loci: [0] }, { type: "A", loci: [1] }],
      key: [["Cᴿ", "red"], ["Cᵂ", "white"], ["P", "polled (no horns)"], ["p", "horned"]], assume: "The genes assort independently. Cᴿ and Cᵂ are codominant (CᴿCᵂ is roan); P is dominant to p.",
      classes: ["red polled", "red horned", "roan polled", "roan horned", "white polled", "white horned"], ph: (at) => { const s = at(0); const c = has(s, "CR") && has(s, "CW") ? 1 : has(s, "CR") ? 0 : 2; return c * 2 + (has(at(1), "P") ? 0 : 1); } },
    { id: "haem", model: "M5", tab: "Sex-linkage", title: "Human haemophilia", loci: [{ name: "clotting factor", al: [xa("H", "ᴴ"), xa("h", "ʰ")] }], pairs: [{ type: "X", loci: [0] }],
      key: [["Xᴴ", "normal blood clotting (dominant)"], ["Xʰ", "haemophilia (recessive)"], ["Y", "carries no allele of this gene"]], assume: "The gene is on the X chromosome; the Y chromosome has no allele of it. Females are XX, males XY.",
      classes: ["female unaffected", "female haemophilia", "male unaffected", "male haemophilia"], ph: (at, sex) => (sex === "M" ? 2 : 0) + (has(at(0), "XH") ? 0 : 1), carrier: (at, sex) => sex === "F" && at(0).join("") === "XHXh" },
    { id: "cb", model: "M5", tab: "Sex-linkage", title: "Human red-green colour blindness", loci: [{ name: "colour vision", al: [xa("N", "ᴺ"), xa("n", "ⁿ")] }], pairs: [{ type: "X", loci: [0] }],
      key: [["Xᴺ", "normal colour vision (dominant)"], ["Xⁿ", "red-green colour blindness (recessive)"], ["Y", "carries no allele of this gene"]], assume: "The gene is on the X chromosome; the Y chromosome has no allele of it.",
      classes: ["female normal vision", "female colour blind", "male normal vision", "male colour blind"], ph: (at, sex) => (sex === "M" ? 2 : 0) + (has(at(0), "XN") ? 0 : 1), carrier: (at, sex) => sex === "F" && at(0).join("") === "XNXn" },
    { id: "fly", model: "M5", tab: "Sex-linkage", title: "Fruit fly (Drosophila) eye colour", loci: [{ name: "eye colour", al: [xa("R", "ᴿ"), xa("r", "ʳ")] }], pairs: [{ type: "X", loci: [0] }],
      key: [["Xᴿ", "red eyes (dominant)"], ["Xʳ", "white eyes (recessive)"], ["Y", "carries no allele of this gene"]], assume: "The gene is on the X chromosome; the Y chromosome has no allele of it.",
      classes: ["female red-eyed", "female white-eyed", "male red-eyed", "male white-eyed"], ph: (at, sex) => (sex === "M" ? 2 : 0) + (has(at(0), "XR") ? 0 : 1) },
    { id: "flyxa", model: "M8", tab: "Sex-linkage", title: "Fruit fly eye colour and wing length", loci: [{ name: "eye colour", al: [xa("R", "ᴿ"), xa("r", "ʳ")] }, { name: "wings", al: [a("N", "N"), a("n", "n")] }], pairs: [{ type: "X", loci: [0] }, { type: "A", loci: [1] }],
      key: [["Xᴿ", "red eyes"], ["Xʳ", "white eyes"], ["N", "normal wings"], ["n", "vestigial wings"]], assume: "Eye colour is X-linked; wing length is on an autosome, so the two genes assort independently. Xᴿ and N are dominant.",
      classes: ["female red normal", "female red vestigial", "female white normal", "female white vestigial", "male red normal", "male red vestigial", "male white normal", "male white vestigial"],
      ph: (at, sex) => (sex === "M" ? 4 : 0) + (has(at(0), "XR") ? 0 : 2) + (has(at(1), "N") ? 0 : 1) },
    { id: "flylink", model: "M6", tab: "Linkage", title: "Fruit fly body colour and wings (linked)", loci: [{ name: "body", al: [a("G", "G"), a("g", "g")] }, { name: "wings", al: [a("N", "N"), a("n", "n")] }], pairs: [{ type: "A", loci: [0, 1] }], noCrossover: true,
      key: [["G", "grey body"], ["g", "black body"], ["N", "normal wings"], ["n", "vestigial wings"]], assume: "The genes are on the same autosome. Assume no crossing over between them, for simplicity (in fact these loci are about 17 map units apart, but male fruit flies do not cross over).",
      classes: ["grey normal", "grey vestigial", "black normal", "black vestigial"], ph: (at) => (has(at(0), "G") ? 0 : 2) + (has(at(1), "N") ? 0 : 1) },
    { id: "tomato", model: "M6", tab: "Linkage", title: "Tomato height and fruit shape (crossing over)", loci: [{ name: "height", al: [a("D", "D"), a("d", "d")] }, { name: "fruit", al: [a("R", "R"), a("r", "r")] }], pairs: [{ type: "A", loci: [0, 1] }], rf: 20, testOnly: true,
      key: [["D", "tall"], ["d", "dwarf"], ["R", "round fruit"], ["r", "pear-shaped fruit"]], assume: "The genes are on the same autosome. In this scenario 20 % of the gametes of a double heterozygote are recombinant, because of crossing over between the loci (illustrative value). Test crosses only.",
      classes: ["tall round", "tall pear", "dwarf round", "dwarf pear"], ph: (at) => (has(at(0), "D") ? 0 : 2) + (has(at(1), "R") ? 0 : 1) },
    { id: "mouse", model: "M7", rule: "E1", tab: "Epistasis", title: "Mouse coat colour (recessive epistasis)", loci: [{ name: "agouti", al: [a("A", "A"), a("a", "a")] }, { name: "pigment", al: [a("C", "C"), a("c", "c")] }], pairs: [{ type: "A", loci: [0] }, { type: "A", loci: [1] }],
      key: [["C", "pigment made"], ["c", "no pigment (cc is albino)"], ["A", "agouti (banded hairs)"], ["a", "black"]], assume: "Gene C codes for an enzyme needed to make any pigment, so cc mice are albino whatever their A alleles. The genes assort independently.",
      classes: ["agouti", "black", "albino"], ph: (at) => (!has(at(1), "C") ? 2 : has(at(0), "A") ? 0 : 1) },
    { id: "squash", model: "M7", rule: "E2", tab: "Epistasis", title: "Summer squash fruit colour (dominant epistasis)", loci: [{ name: "white", al: [a("W", "W"), a("w", "w")] }, { name: "yellow", al: [a("Y", "Y"), a("y", "y")] }], pairs: [{ type: "A", loci: [0] }, { type: "A", loci: [1] }],
      key: [["W", "stops pigment (white)"], ["w", "allows pigment"], ["Y", "yellow"], ["y", "green"]], assume: "The dominant allele W stops pigment being made, so any W_ fruit is white whatever its Y alleles. In ww fruit, Y_ is yellow and yy green. The genes assort independently.",
      classes: ["white", "yellow", "green"], ph: (at) => (has(at(0), "W") ? 0 : has(at(1), "Y") ? 1 : 2) },
    { id: "sweetpea", model: "M7", rule: "E3", tab: "Epistasis", title: "Sweet pea flower colour (complementary genes)", loci: [{ name: "enzyme 1", al: [a("C", "C"), a("c", "c")] }, { name: "enzyme 2", al: [a("P", "P"), a("p", "p")] }], pairs: [{ type: "A", loci: [0] }, { type: "A", loci: [1] }],
      key: [["C", "enzyme 1 made"], ["c", "no enzyme 1"], ["P", "enzyme 2 made"], ["p", "no enzyme 2"]], assume: "Purple pigment is made in two steps, each needing an enzyme coded by a dominant allele, so cc or pp flowers are white. The genes assort independently.",
      classes: ["purple", "white"], ph: (at) => (has(at(0), "C") && has(at(1), "P") ? 0 : 1) },
  ];

  // ---------------------------------------------------------------- definition checks (refusals R1, R6, R8, R9)
  const R = {
    R1: "This builder handles one or two genes only.",
    R2: "For linked genes, say which alleles are on the same chromosome (for example GN/gn).",
    R3: "A recombinant frequency must be a whole-number percentage below 50 %.",
    R4: "This scenario assumes no crossing over.",
    R5: "In this model females are XX and males are XY; choose a female and a male parent.",
    R6: "Only the three epistasis patterns described in the notes are modelled.",
    R7: "That genotype is not possible in this scenario.",
    R8: "This combination is not modelled here (for example two X-linked genes, Y-linked genes, codominant X-linked alleles, lethal alleles, incomplete dominance or polygenes).",
    R9: "This builder models up to three alleles of a gene.",
  };
  const refuse = (code) => ({ ok: false, code, reason: R[code] });
  function checkDef(d) {
    if (!d || !Array.isArray(d.loci) || !Array.isArray(d.pairs)) return refuse("R8");
    if (d.loci.length > 2) return refuse("R1");
    if (d.loci.some((l) => (l.al || []).length > 3)) return refuse("R9");
    if (d.loci.some((l) => (l.al || []).length < 2)) return refuse("R7");
    if (d.flags && d.flags.length) return refuse("R8"); // lethal, incomplete, polygenic, Y-linked, ZW, codominant X
    const xs = d.pairs.filter((p) => p.type === "X"), linked = d.pairs.filter((p) => p.loci.length === 2);
    if (d.pairs.some((p) => p.type !== "A" && p.type !== "X")) return refuse("R8");
    if (xs.length > 1 || xs.some((p) => p.loci.length > 1)) return refuse("R8");
    if (d.model === "M7" && (RULES.indexOf(d.rule) < 0 || xs.length || linked.length)) return refuse("R6");
    if (d.rule && d.model !== "M7") return refuse("R6");
    const want = { M1: [1, 0, 0], M2: [1, 0, 0], M3: [1, 0, 0], M4: [2, 0, 0], M5: [1, 1, 0], M6: [2, 0, 1], M7: [2, 0, 0], M8: [2, 1, 0] }[d.model];
    if (!want || d.loci.length !== want[0] || xs.length !== want[1] || linked.length !== want[2]) return refuse("R8");
    if (d.model === "M3" ? d.loci[0].al.length !== 3 : d.loci.some((l) => l.al.length !== 2)) return refuse(d.model === "M3" ? "R7" : "R9");
    if (d.model === "M6" && d.rf !== undefined && !(Number.isInteger(d.rf) && d.rf >= 0 && d.rf < 50)) return refuse("R3");
    return { ok: true };
  }

  // ---------------------------------------------------------------- helpers
  const gcd = (x, y) => { x = Math.abs(x); y = Math.abs(y); while (y) [x, y] = [y, x % y]; return x; };
  const reduce = (ws) => { const g = ws.reduce((p, w) => (w ? gcd(p, w) : p), 0) || 1; return ws.map((w) => w / g); };
  const frac = (n, d) => { if (!d) return { n: 0, d: 1, text: "0" }; const g = gcd(n, d) || 1; const N = n / g, D = d / g; return { n: N, d: D, text: D === 1 ? String(N) : `${N}/${D}`, value: N / D }; };
  const SC = {}; const scn = (id) => (typeof id === "string" ? SC[id] : id);
  const idx = (s, locus, sym) => s.loci[locus].al.findIndex((x) => x.sym === sym);
  const alleleObj = (s, locus, sym) => s.loci[locus].al[idx(s, locus, sym)];
  // compare two haps (arrays of syms, null = Y) in scenario order; Y last
  const cmpHap = (s, pair, h1, h2) => { if (h1 === null) return 1; if (h2 === null) return -1; for (let k = 0; k < pair.loci.length; k++) { const d = idx(s, pair.loci[k], h1[k]) - idx(s, pair.loci[k], h2[k]); if (d) return d; } return 0; };
  const canonPair = (s, pair, hA, hB) => (cmpHap(s, pair, hA, hB) <= 0 ? [hA, hB] : [hB, hA]);
  const sexOf = (s, pairs) => { const xi = s.pairs.findIndex((p) => p.type === "X"); if (xi < 0) return null; return pairs[xi][1] === null ? "M" : "F"; };
  const keyG = (g) => g.pairs.map((p) => p.map((h) => (h === null ? "Y" : h.join(","))).join("|")).join(";");

  // display forms
  function hapTxt(s, pair, h, form) { if (h === null) return "Y"; return h.map((sym, k) => alleleObj(s, pair.loci[k], sym)[form]).join(""); }
  function genoTxt(s, g, form = "txt") {
    return s.pairs.map((pair, i) => { const [hA, hB] = g.pairs[i]; if (pair.loci.length === 2) return `${hapTxt(s, pair, hA, form)}/${hapTxt(s, pair, hB, form)}`; return hapTxt(s, pair, hA, form) + hapTxt(s, pair, hB, form); }).join("");
  }
  function gameteTxt(s, gm, form = "txt") { return s.pairs.map((pair, i) => hapTxt(s, pair, gm[i], form)).join(""); }
  const atFn = (s, g) => (locus) => { const pi = s.pairs.findIndex((p) => p.loci.indexOf(locus) >= 0); const k = s.pairs[pi].loci.indexOf(locus); return g.pairs[pi].filter((h) => h !== null).map((h) => h[k]); };
  const phenoOf = (s, g) => s.ph(atFn(s, g), g.sex);

  // all genotypes of the scenario (unordered pairs per chromosome pair; for X pairs split female / male)
  function genotypes(s, sex) {
    s = scn(s); const per = s.pairs.map((pair) => {
      const haps = pair.loci.reduce((acc, l) => acc.flatMap((h) => s.loci[l].al.map((x) => [...h, x.sym])), [[]]);
      if (pair.type === "X" && sex === "M") return haps.map((h) => [h, null]);
      const out = []; for (let i = 0; i < haps.length; i++) for (let j = i; j < haps.length; j++) out.push([haps[i], haps[j]]); return out; });
    const combos = per.reduce((acc, list) => acc.flatMap((c) => list.map((p) => [...c, p])), [[]]);
    const hasX = s.pairs.some((p) => p.type === "X");
    return combos.map((pairs) => ({ sex: hasX ? (sex === "M" ? "M" : "F") : null, pairs })).map((g) => ({ g, txt: genoTxt(s, g), html: genoTxt(s, g, "html") }));
  }

  // ---------------------------------------------------------------- parsing (free text, for validate and refusals)
  function tokens(s, str) {
    const list = s.loci.flatMap((l, li) => l.al.map((x) => ({ t: x.txt, sym: x.sym, li }))).sort((p, q) => q.t.length - p.t.length);
    const out = []; let i = 0; const src = String(str).replace(/\s+/g, "");
    const hasX = s.pairs.some((p) => p.type === "X");
    while (i < src.length) { if (src[i] === "/") { out.push({ t: "/" }); i++; continue; }
      const m = list.find((x) => src.startsWith(x.t, i)); if (m) { out.push(m); i += m.t.length; continue; }
      if (hasX && src[i] === "Y") { out.push({ t: "Y", isY: true }); i++; continue; } return null; }
    return out;
  }
  function parse(sid, str) {
    const s = scn(sid); if (!s) return refuse("R7"); const tk = tokens(s, str); if (!tk || !tk.length) return refuse("R7");
    const hasX = s.pairs.some((p) => p.type === "X"); const slash = tk.filter((x) => x.t === "/").length;
    const linkedPair = s.pairs.find((p) => p.loci.length === 2);
    if (linkedPair && slash !== 1) return refuse(slash === 0 ? "R2" : "R7");
    if (!linkedPair && slash) return refuse("R7");
    const pairs = [];
    if (linkedPair) { const cut = tk.findIndex((x) => x.t === "/"); const L = tk.slice(0, cut), Rr = tk.slice(cut + 1);
      const hap = (h) => (h.length === 2 && h[0].li === linkedPair.loci[0] && h[1].li === linkedPair.loci[1] ? [h[0].sym, h[1].sym] : null);
      const hA = hap(L), hB = hap(Rr); if (!hA || !hB) return refuse("R7"); pairs.push(canonPair(s, linkedPair, hA, hB));
      return { ok: true, g: { sex: null, pairs } }; }
    const ys = tk.filter((x) => x.isY).length; if (ys > 1 || (ys && !hasX)) return refuse(ys && !hasX ? "R7" : "R5");
    const sex = hasX ? (ys ? "M" : "F") : null;
    for (const pair of s.pairs) { const li = pair.loci[0]; const al = tk.filter((x) => x.li === li).map((x) => x.sym);
      if (pair.type === "X") { if (sex === "M") { if (al.length !== 1) return refuse(al.length === 2 ? "R5" : "R7"); pairs.push([[al[0]], null]); } else { if (al.length !== 2) return refuse("R7"); pairs.push(canonPair(s, pair, [al[0]], [al[1]])); } }
      else { if (al.length !== 2) return refuse("R7"); pairs.push(canonPair(s, pair, [al[0]], [al[1]])); } }
    if (tk.filter((x) => !x.isY).length !== s.pairs.reduce((n, p) => n + (p.type === "X" && sex === "M" ? 1 : 2), 0)) return refuse("R7");
    return { ok: true, g: { sex, pairs } };
  }

  // ---------------------------------------------------------------- meiosis and fertilisation (exhaustive)
  function pairGametes(s, pair, p, rf) { // returns [{hap, w}]
    const add = (list, hap, w) => { if (!w) return; const k = hap === null ? "Y" : hap.join(","); const e = list.find((x) => x.k === k); if (e) e.w += w; else list.push({ k, hap, w }); };
    const out = []; const [hA, hB] = p;
    if (pair.loci.length === 2) { add(out, hA, 100 - rf); add(out, hB, 100 - rf); add(out, [hA[0], hB[1]], rf); add(out, [hB[0], hA[1]], rf); }
    else { add(out, hA, 1); add(out, hB, 1); }
    return out;
  }
  function gametes(sid, g, rf = 0) {
    const s = scn(sid); const per = s.pairs.map((pair, i) => pairGametes(s, pair, g.pairs[i], rf));
    let list = [{ gm: [], w: 1 }]; per.forEach((opts) => { list = list.flatMap((x) => opts.map((o) => ({ gm: [...x.gm, o.hap], w: x.w * o.w }))); });
    const ws = reduce(list.map((x) => x.w)); return list.map((x, i) => ({ gm: x.gm, w: ws[i], txt: gameteTxt(s, x.gm), html: gameteTxt(s, x.gm, "html") }));
  }
  function resolve(s, p) { if (typeof p === "string") return parse(s, p); if (p && p.pairs) return { ok: true, g: p }; return refuse("R7"); }

  // cross(scenario, parent1, parent2, opts) — parents as text (e.g. "RrYy", "GN/gn", "XᴴXʰ") or genotype objects.
  function cross(sid, p1, p2, opts = {}) {
    const s = scn(sid); if (!s) return refuse("R7"); const chk = checkDef(s); if (!chk.ok) return chk;
    const A = resolve(s, p1), Bp = resolve(s, p2); if (!A.ok) return A; if (!Bp.ok) return Bp;
    const hasX = s.pairs.some((p) => p.type === "X");
    if (hasX && !(A.g.sex === "F" && Bp.g.sex === "M")) return refuse("R5");
    let rf = 0; if (s.model === "M6") { rf = opts.rf !== undefined ? opts.rf : s.rf || 0; if (!(Number.isInteger(rf) && rf >= 0 && rf < 50)) return refuse("R3"); if (s.noCrossover && rf > 0) return refuse("R4"); }
    else if (opts.rf) return refuse("R4");
    const g1 = gametes(s, A.g, rf), g2 = gametes(s, Bp.g, rf);
    const offs = new Map(); const grid = [];
    g1.forEach((x) => { const row = []; g2.forEach((y) => { const pairs = s.pairs.map((pair, i) => canonPair(s, pair, x.gm[i], y.gm[i])); const g = { sex: hasX ? sexOf(s, pairs) : null, pairs };
      const k = keyG(g); const w = x.w * y.w; if (!offs.has(k)) offs.set(k, { g, w: 0 }); offs.get(k).w += w; row.push({ g, txt: genoTxt(s, g), html: genoTxt(s, g, "html"), cls: phenoOf(s, g) }); }); grid.push(row); });
    const genoList = [...offs.values()].sort((u, v) => (u.g.sex === v.g.sex ? 0 : u.g.sex === "F" ? -1 : 1) || s.pairs.reduce((d, pair, i) => d || cmpHap(s, pair, u.g.pairs[i][0], v.g.pairs[i][0]) || cmpHap(s, pair, u.g.pairs[i][1], v.g.pairs[i][1]), 0));
    const gw = reduce(genoList.map((x) => x.w));
    const cw = s.classes.map(() => 0); genoList.forEach((x) => { cw[phenoOf(s, x.g)] += x.w; });
    const total = genoList.reduce((t, x) => t + x.w, 0);
    return { ok: true, s, rf, p1: A.g, p2: Bp.g, p1txt: genoTxt(s, A.g), p2txt: genoTxt(s, Bp.g), p1html: genoTxt(s, A.g, "html"), p2html: genoTxt(s, Bp.g, "html"),
      p1ph: s.classes[phenoOf(s, A.g)], p2ph: s.classes[phenoOf(s, Bp.g)], g1, g2, grid,
      genotypes: genoList.map((x, i) => ({ g: x.g, txt: genoTxt(s, x.g), html: genoTxt(s, x.g, "html"), w: x.w, r: gw[i], cls: phenoOf(s, x.g), carrier: !!(s.carrier && s.carrier(atFn(s, x.g), x.g.sex)) })),
      weights: cw, ratio: reduce(cw), total };
  }

  // P(where | given) as a reduced fraction; where/given are functions of { cls, sex, carrier, txt }
  function prob(res, where, given) { let n = 0, d = 0; res.genotypes.forEach((x) => { const e = { cls: x.cls, name: res.s.classes[x.cls], sex: x.g.sex, carrier: x.carrier, txt: x.txt }; if (given && !given(e)) return; d += x.w; if (where(e)) n += x.w; }); return frac(n, d); }

  // a student's ratio is right if proportional to the expected weights (0 where a class is absent)
  function predictOk(student, expected) { if (!Array.isArray(student) || student.length !== expected.length || student.some((v) => !(Number.isFinite(v) && v >= 0))) return false; const S = student.reduce((t, v) => t + v, 0), E = expected.reduce((t, v) => t + v, 0); if (!S) return false; return student.every((v, i) => Math.abs(v * E - expected[i] * S) < 1e-9 * Math.max(1, S * E)); }
  function gameteSetOk(ticked, gl) { const want = new Set(gl.filter((x) => x.w > 0).map((x) => x.txt)); const got = new Set(ticked); return want.size === got.size && [...want].every((t) => got.has(t)); }
  // every gamete a scenario could ever produce (the tick list): every combination of one allele per locus, plus Y.
  function allGametes(sid, sex) { const s = scn(sid); const per = s.pairs.map((pair) => { const haps = pair.loci.reduce((acc, l) => acc.flatMap((h) => s.loci[l].al.map((x) => [...h, x.sym])), [[]]); return pair.type === "X" && sex === "M" ? [...haps, null] : haps; });
    const combos = per.reduce((acc, list) => acc.flatMap((c) => list.map((h) => [...c, h])), [[]]); return combos.map((gm) => ({ gm, txt: gameteTxt(s, gm), html: gameteTxt(s, gm, "html") })); }
  // builder rule: tomato (rf stated) is offered for test crosses only (one parent dr/dr); the engine computes any cross
  function allowed(sid, p1txt, p2txt) { const s = scn(sid); if (!s.testOnly) return { ok: true }; const rec = genotypes(s).find((x) => x.g.pairs[0].every((h) => h.every((sym, k) => sym === s.loci[s.pairs[0].loci[k]].al[1].sym))); return p1txt === rec.txt || p2txt === rec.txt ? { ok: true } : { ok: false, reason: "In this scenario the builder shows test crosses only: make one parent " + rec.txt + "." }; }
  // lock key: unordered parents for autosomal models; mother and father kept for X-linked models
  function lockKey(sid, p1, p2) { const s = scn(sid); const sexed = s.pairs.some((p) => p.type === "X"); const n = (t) => { const r = parse(s, t); return r.ok ? genoTxt(s, r.g) : t; }; const a1 = n(p1), a2 = n(p2); return s.id + "|" + (sexed ? a1 + "|" + a2 : [a1, a2].sort().join("|")); }

  // ---------------------------------------------------------------- build presets
  DEFS.forEach((d) => { const c = checkDef(d); if (!c.ok) throw new Error("genetics scenario " + d.id + ": " + c.reason); SC[d.id] = d; });
  const TABS = ["Monohybrid", "Codominance", "Multiple alleles", "Dihybrid", "Sex-linkage", "Linkage", "Epistasis"];

  // ---------------------------------------------------------------- validate (hand cases from B3-MODEL.md, T1 to T42)
  function validate() {
    const f = []; const eq = (x, y, m) => { if (JSON.stringify(x) !== JSON.stringify(y)) f.push(`${m}: got ${JSON.stringify(x)}, expected ${JSON.stringify(y)}`); };
    const R_ = (sid, p1, p2, want, m, o) => { const r = cross(sid, p1, p2, o); if (!r.ok) { f.push(`${m}: refused (${r.reason})`); return null; } eq(r.ratio, want, m); return r; };
    const C = [
      ["T1", "pea", "Rr", "Rr", [3, 1]], ["T2", "pea", "Rr", "rr", [1, 1]], ["T3", "roan", "CᴿCᵂ", "CᴿCᵂ", [1, 2, 1]], ["T4", "roan", "CᴿCᵂ", "CᴿCᴿ", [1, 1, 0]],
      ["T5", "abo", "IᴬIᴼ", "IᴮIᴼ", [1, 1, 1, 1]], ["T6", "abo", "IᴬIᴮ", "IᴼIᴼ", [1, 1, 0, 0]], ["T7", "abo", "IᴬIᴼ", "IᴬIᴮ", [2, 1, 1, 0]], ["T8", "abo", "IᴬIᴼ", "IᴬIᴼ", [3, 0, 0, 1]],
      ["T9", "rabbit", "Cc", "cʰc", [2, 1, 1]], ["T10", "rabbit", "Ccʰ", "cʰc", [1, 1, 0]], ["T11", "rabbit", "cʰc", "cʰc", [0, 3, 1]],
      ["T12", "peadi", "RrYy", "RrYy", [9, 3, 3, 1]], ["T13", "peadi", "RrYy", "rryy", [1, 1, 1, 1]], ["T14", "peadi", "Rryy", "rrYy", [1, 1, 1, 1]], ["T15", "peadi", "RrYY", "Rryy", [3, 0, 1, 0]], ["T16", "peadi", "Rryy", "RrYy", [3, 3, 1, 1]],
      ["T17", "cattledi", "CᴿCᵂPp", "CᴿCᵂPp", [3, 1, 6, 2, 3, 1]],
      ["T18", "haem", "XᴴXʰ", "XᴴY", [2, 0, 1, 1]], ["T19", "haem", "XᴴXᴴ", "XʰY", [1, 0, 1, 0]], ["T20", "cb", "XᴺXⁿ", "XⁿY", [1, 1, 1, 1]], ["T21", "fly", "XᴿXʳ", "XʳY", [1, 1, 1, 1]], ["T22", "fly", "XʳXʳ", "XᴿY", [1, 0, 0, 1]],
      ["T23", "flylink", "GN/gn", "gn/gn", [1, 0, 0, 1]], ["T24", "flylink", "Gn/gN", "gn/gn", [0, 1, 1, 0]], ["T25", "flylink", "GN/gn", "GN/gn", [3, 0, 0, 1]], ["T26", "flylink", "Gn/gN", "Gn/gN", [2, 1, 1, 0]],
      ["T27", "tomato", "DR/dr", "dr/dr", [4, 1, 1, 4]], ["T28", "tomato", "Dr/dR", "dr/dr", [1, 4, 4, 1]], ["T29", "tomato", "DR/dr", "DR/dr", [66, 9, 9, 16]], ["T30", "tomato", "DR/Dr", "dr/dr", [1, 1, 0, 0]],
      ["T31", "mouse", "AaCc", "AaCc", [9, 3, 4]], ["T32", "mouse", "AaCc", "aacc", [1, 1, 2]], ["T33", "mouse", "aaCC", "AAcc", [1, 0, 0]],
      ["T34", "squash", "WwYy", "WwYy", [12, 3, 1]], ["T35", "squash", "WwYy", "wwyy", [2, 1, 1]], ["T36", "sweetpea", "CcPp", "CcPp", [9, 7]], ["T37", "sweetpea", "CCpp", "ccPP", [1, 0]], ["T38", "sweetpea", "CcPp", "ccpp", [1, 3]],
      ["T39", "cf", "Ff", "Ff", [3, 1]],
      ["T40", "flyxa", "XᴿXʳNn", "XʳYNn", [3, 1, 3, 1, 3, 1, 3, 1]], ["T41", "flyxa", "XᴿXʳNn", "XᴿYnn", [2, 2, 0, 0, 1, 1, 1, 1]], ["T42", "flyxa", "XʳXʳnn", "XᴿYNN", [1, 0, 0, 0, 0, 0, 1, 0]],
    ];
    const res = {}; C.forEach(([m, sid, p1, p2, want]) => { res[m] = R_(sid, p1, p2, want, m); });
    // genotype ratios and gametes (selected cases)
    if (res.T1) eq(res.T1.genotypes.map((x) => x.txt + ":" + x.r), ["RR:1", "Rr:2", "rr:1"], "T1 genotypes");
    if (res.T12) eq(res.T12.genotypes.map((x) => x.r), [1, 2, 1, 2, 4, 2, 1, 2, 1], "T12 genotype ratio");
    if (res.T18) eq(res.T18.genotypes.map((x) => x.txt), ["XᴴXᴴ", "XᴴXʰ", "XᴴY", "XʰY"], "T18 genotypes");
    if (res.T23) eq(res.T23.g1.map((x) => x.txt + ":" + x.w), ["GN:1", "gn:1"], "T23 no recombinant gametes");
    if (res.T27) eq(res.T27.g1.map((x) => x.txt + ":" + x.w).sort(), ["DR:4", "Dr:1", "dR:1", "dr:4"], "T27 gametes 80:80:20:20");
    if (res.T30) eq(res.T30.g1.map((x) => x.txt + ":" + x.w), ["DR:1", "Dr:1"], "T30 merged haplotypes");
    // probabilities (P1 to P5 and the answer key)
    const P = (r, w, g, want, m) => { if (!r) return; eq(prob(r, w, g).text, want, m); };
    P(res.T39, (e) => e.cls === 1, null, "1/4", "P1 cf"); P(res.T39, (e) => e.carrier, (e) => e.cls === 0, "2/3", "P2 carrier given unaffected");
    P(res.T39, (e) => e.txt === "FF" || e.txt === "ff", null, "1/2", "T39 homozygous");
    P(res.T18, (e) => e.sex === "M" && e.cls === 3, null, "1/4", "P3 next child a son with haemophilia"); P(res.T18, (e) => e.cls === 3, (e) => e.sex === "M", "1/2", "P4 haemophilia given son");
    P(res.T18, (e) => e.carrier, (e) => e.sex === "F", "1/2", "T18 carrier given daughter"); P(res.T5, (e) => e.cls === 3, null, "1/4", "P5 group O");
    P(res.T5, (e) => e.cls === 2, null, "1/4", "cb2 group AB"); P(res.T17, (e) => e.cls === 2, null, "3/8", "q9 roan polled"); P(res.T40, (e) => e.cls === 7, null, "1/16", "la7 white vestigial male");
    P(res.T16, (e) => e.cls === 1, null, "3/8", "li3 round green (120 of 320)"); P(res.T16, (e) => e.cls === 3, null, "1/8", "li3 wrinkled green (40 of 320)");
    // refusals R1 to R9
    const bad = (r, code, m) => { if (!r || r.ok !== false || r.code !== code) f.push(`${m}: expected refusal ${code}, got ${r && (r.ok ? "an answer" : r.code)}`); };
    const L = (s) => ({ name: "x", al: s.split(" ").map((t) => a(t, t)) });
    bad(checkDef({ model: "M4", loci: [L("A a"), L("B b"), L("D d")], pairs: [{ type: "A", loci: [0] }, { type: "A", loci: [1] }, { type: "A", loci: [2] }] }), "R1", "R1 three genes");
    bad(cross("flylink", "GgNn", "gn/gn"), "R2", "R2 unphased"); bad(cross("tomato", "DR/dr", "dr/dr", { rf: 60 }), "R3", "R3 rf 60"); bad(cross("tomato", "DR/dr", "dr/dr", { rf: 12.5 }), "R3", "R3 rf not whole");
    bad(cross("flylink", "GN/gn", "gn/gn", { rf: 10 }), "R4", "R4 no crossing over"); bad(cross("haem", "XᴴXʰ", "XᴴXʰ"), "R5", "R5 two females"); bad(cross("haem", "XᴴY", "XᴴY"), "R5", "R5 two males"); bad(cross("haem", "XᴴY", "XᴴXʰ"), "R5", "R5 order");
    bad(checkDef({ model: "M7", rule: "E4", loci: [L("A a"), L("B b")], pairs: [{ type: "A", loci: [0] }, { type: "A", loci: [1] }] }), "R6", "R6 13:3 rule");
    bad(checkDef({ model: "M7", rule: "E1", loci: [L("A a"), L("B b")], pairs: [{ type: "A", loci: [0, 1] }] }), "R6", "R6 linked epistasis");
    bad(cross("abo", "IᴬIᶜ", "IᴼIᴼ"), "R7", "R7 unknown allele"); bad(cross("abo", "IᴬIᴮIᴼ", "IᴼIᴼ"), "R7", "R7 three alleles");
    bad(checkDef({ model: "M5", loci: [L("A a"), L("B b")], pairs: [{ type: "X", loci: [0] }, { type: "X", loci: [1] }] }), "R8", "R8 two X genes");
    bad(checkDef({ model: "M1", flags: ["lethal"], loci: [L("A a")], pairs: [{ type: "A", loci: [0] }] }), "R8", "R8 lethal");
    bad(checkDef({ model: "M5", flags: ["Y"], loci: [L("A a")], pairs: [{ type: "Y", loci: [0] }] }), "R8", "R8 Y-linked");
    bad(checkDef({ model: "M3", loci: [L("A B C D")], pairs: [{ type: "A", loci: [0] }] }), "R9", "R9 four alleles");
    // independent second method: every M4 cross equals the product of its two single-locus crosses
    const pea1 = { id: "_p1", model: "M1", loci: [SC.peadi.loci[0]], pairs: [{ type: "A", loci: [0] }], classes: ["R", "r"], ph: (at) => (has(at(0), "R") ? 0 : 1) };
    const pea2 = { id: "_p2", model: "M1", loci: [SC.peadi.loci[1]], pairs: [{ type: "A", loci: [0] }], classes: ["Y", "y"], ph: (at) => (has(at(0), "Y") ? 0 : 1) };
    const gl = genotypes("peadi"); let prodChecked = 0;
    gl.forEach((x) => gl.forEach((y) => { const r = cross("peadi", x.txt, y.txt); const a1 = cross(pea1, x.txt.slice(0, 2), y.txt.slice(0, 2)), a2 = cross(pea2, x.txt.slice(2), y.txt.slice(2));
      const prod = reduce([a1.weights[0] * a2.weights[0], a1.weights[0] * a2.weights[1], a1.weights[1] * a2.weights[0], a1.weights[1] * a2.weights[1]]);
      if (JSON.stringify(prod) !== JSON.stringify(r.ratio)) f.push(`product rule ${x.txt} × ${y.txt}: ${r.ratio} vs ${prod}`);
      if (r.total !== r.g1.reduce((t, q) => t + q.w, 0) * r.g2.reduce((t, q) => t + q.w, 0)) f.push("weights total " + x.txt + " × " + y.txt); prodChecked++; }));
    if (prodChecked !== 81) f.push("expected 81 dihybrid crosses, checked " + prodChecked);
    // counts of genotypes offered
    eq([genotypes("pea").length, genotypes("abo").length, genotypes("peadi").length, genotypes("haem", "F").length, genotypes("haem", "M").length, genotypes("flylink").length, genotypes("flyxa", "F").length, genotypes("flyxa", "M").length], [3, 6, 9, 3, 2, 10, 9, 6], "genotype counts");
    // rf 0 never gives a recombinant class: every flylink cross's offspring chromosomes are parental chromosomes
    genotypes("flylink").forEach((x) => genotypes("flylink").forEach((y) => { const r = cross("flylink", x.txt, y.txt); const parentHaps = new Set([...x.g.pairs[0], ...y.g.pairs[0]].map((h) => h.join(""))); r.genotypes.forEach((o) => o.g.pairs[0].forEach((h) => { if (!parentHaps.has(h.join(""))) f.push("recombinant without crossing over in " + x.txt + " × " + y.txt); })); }));
    // predictOk and gameteSetOk
    if (!predictOk([6, 2], [3, 1]) || !predictOk([75, 25], [3, 1]) || predictOk([1, 3], [3, 1]) || predictOk([3, 1, 1], [3, 1, 0]) || !predictOk([2, 2, 0], [1, 1, 0]) || predictOk([0, 0], [1, 1])) f.push("predictOk");
    if (res.T12 && !gameteSetOk(["RY", "Ry", "rY", "ry"], res.T12.g1)) f.push("gameteSetOk T12"); if (res.T23 && gameteSetOk(["GN", "gn", "Gn", "gN"], res.T23.g1)) f.push("gameteSetOk T23 must reject recombinants");
    // parse round trip and lock keys
    if (lockKey("peadi", "Rryy", "RrYy") !== lockKey("peadi", "RrYy", "Rryy")) f.push("lock key not order-insensitive"); if (lockKey("haem", "XᴴXʰ", "XᴴY") === lockKey("haem", "XᴴY", "XᴴXʰ")) f.push("lock key must keep mother and father");
    if (allowed("tomato", "DR/dr", "DR/dr").ok || !allowed("tomato", "DR/dr", "dr/dr").ok) f.push("tomato builder limited to test crosses");
    return f;
  }

  B.geneticsModel = { SC, DEFS, TABS, R, scn, checkDef, parse, genotypes, gametes, allGametes, cross, prob, frac, reduce, predictOk, gameteSetOk, allowed, lockKey, genoTxt, validate };
})(window.BIO);
