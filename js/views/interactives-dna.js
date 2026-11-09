// Interactives for 3.1.7 DNA, genes and chromosomes. Kinds: dnaPairing, dnaNucleotide (3.1.7.1), dnaOrganise
// (3.1.7.2), dnaReplication, dnaMeselson (3.1.7.3). Artwork and the small model (complements, hydrogen-bond counts,
// base composition, Meselson–Stahl band fractions) are in data/content/_dna-art.js (B.dnaArt, B.dnaModel).
// Every control is a native button, select, checkbox or range input, so all of it works from the keyboard; nothing
// animates when reduced motion is requested (the replication stepper's auto-play is then switched off).
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || ((B.store.get().prefs || {}).reducedMotion);
  const head = (spec, badge = "interactive") => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const A = () => B.dnaArt, M = () => B.dnaModel;
  const questions = (host, sel, qs) => (qs || []).forEach((q) => $(sel, host).append(B.questions.render(q)));
  const fig = (svg) => `<div class="figure" style="margin:0"><div class="fig-view" style="overflow-x:auto">${svg.replace("<svg ", '<svg style="max-width:100%;height:auto" ')}</div></div>`;
  const tick = '<span style="color:var(--sage-ink);font-weight:700">✓</span>', cross = '<span style="color:var(--rose-ink);font-weight:700">✗</span>';

  // ---------- 1. Base-Pairing Workbench (3.1.7.1 s3; RNA mode previews A–U pairing, s4) ----------
  B.interactives.dnaPairing = function (spec, host) {
    const presets = ["TACGGATC", "GATTACAG", "CCGTAATG", "ATGCGCTA", "AGGTCCAT", "TTGACGCA"];
    let tpl = presets[0], rna = false;
    host.innerHTML = head(spec, "challenge") + `
      <div class="row"><label class="small">Template strand (top, 5′ → 3′): <select id="bp-tpl">${presets.map((p) => `<option value="${p}">${p.split("").join(" ")}</option>`).join("")}</select></label><button class="btn sm" id="bp-rand">Random template</button>
      <label class="small">Pairing: <select id="bp-mode"><option value="dna">DNA partner strand (A–T, C–G)</option><option value="rna">RNA copy (A–U, C–G; preview of 3.1.8)</option></select></label></div>
      <p class="small">Choose the base that pairs with each template base. The drawing updates as you go; a red × marks a base that cannot pair.</p>
      <div id="bp-picks" class="row" role="group" aria-label="bases of the new strand"></div>
      <div class="row mt"><button class="btn sm primary" id="bp-check">Check my strand</button><button class="btn sm" id="bp-show">Show the answer</button><button class="btn sm" id="bp-clear">Clear</button></div>
      <div id="bp-view" class="mt"></div><div id="bp-out" class="mt small" aria-live="polite"></div>
      <h4 class="mt">Practice: pairing and base composition</h4><div id="bp-q"></div>`;
    const picks = () => $$("#bp-picks select", host).map((s) => s.value);
    const build = () => { const opts = rna ? ["A", "C", "G", "U"] : ["A", "C", "G", "T"]; $("#bp-picks", host).innerHTML = tpl.split("").map((b, i) => `<label class="small" style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;min-width:44px"><span class="mono">${b}</span><select data-i="${i}" aria-label="base ${i + 1} of the new strand, pairing with template base ${b} (${A().BASENAME[b]})"><option value="">–</option>${opts.map((o) => `<option value="${o}">${o}</option>`).join("")}</select></label>`).join(""); $$("#bp-picks select", host).forEach((s) => s.addEventListener("change", draw)); draw(); $("#bp-out", host).innerHTML = ""; };
    const draw = () => { const p = picks(); const bot = p.map((x) => x || "-").join(""); const n = tpl.length, dx = 46, x0 = (760 - (n - 1) * dx) / 2; $("#bp-view", host).innerHTML = fig(`<svg viewBox="0 0 760 200" width="760" role="img" aria-label="template strand ${tpl} paired with your strand ${bot.replace(/-/g, "blank ")}">${A().ladder({ top: tpl, bottom: bot, x0, y0: 50, colBot: rna ? "#6a4a96" : "#1f8a8a", rna })}<text x="380" y="190" text-anchor="middle" font-size="10.5" fill="#6b7d8f">Top: template strand. Bottom: your ${rna ? "RNA" : "DNA"} strand, antiparallel. Dashed lines: hydrogen bonds.</text></svg>`); };
    const check = () => { const p = picks(), want = M().comp(tpl, rna).split(""); if (p.some((x) => !x)) { $("#bp-out", host).innerHTML = `<p>Fill every position first (${p.filter(Boolean).length} of ${p.length} chosen).</p>`; return; } const wrong = p.map((x, i) => (x === want[i] ? -1 : i)).filter((i) => i >= 0);
      if (wrong.length) { $("#bp-out", host).innerHTML = `<p>${cross} ${wrong.length} base${wrong.length > 1 ? "s" : ""} cannot pair: position${wrong.length > 1 ? "s" : ""} ${wrong.map((i) => i + 1).join(", ")}. Remember: A pairs with ${rna ? "U" : "T"}, ${rna ? "U with A" : "T with A"}, C with G and G with C.</p>`; return; }
      let extra = ""; if (!rna) { const c = M().composition(tpl, true); extra = `<p><strong>Hydrogen bonds</strong> (<span class="badge">supporting</span>: A–T two, C–G three): ${tpl.split("").filter((b) => b === "A" || b === "T").length} A–T pairs × 2 + ${tpl.split("").filter((b) => b === "C" || b === "G").length} C–G pairs × 3 = <strong>${M().hbonds(tpl)}</strong>.</p><table class="tbl"><thead><tr><th>Base composition of the double-stranded molecule</th><th>A</th><th>T</th><th>C</th><th>G</th></tr></thead><tbody><tr><td>percentage of all ${tpl.length * 2} bases</td><td>${c.A.toFixed(1)}</td><td>${c.T.toFixed(1)}</td><td>${c.C.toFixed(1)}</td><td>${c.G.toFixed(1)}</td></tr></tbody></table><p>%A = %T and %C = %G in any double-stranded DNA (Chargaff's rules), whatever the sequence.</p>`; } else extra = `<p>In RNA, uracil takes the place of thymine, so the RNA copy has U wherever a DNA partner would have T. This is how mRNA is made in transcription (3.1.8.2).</p>`;
      $("#bp-out", host).innerHTML = `<p>${tick} <strong>Every base pairs correctly.</strong> Your strand: <span class="mono">${p.join("")}</span>.</p>${extra}`; };
    $("#bp-tpl", host).addEventListener("change", (e) => { tpl = e.target.value; build(); });
    $("#bp-rand", host).addEventListener("click", () => { tpl = Array.from({ length: 8 }, () => "ACGT"[Math.floor(Math.random() * 4)]).join(""); build(); });
    $("#bp-mode", host).addEventListener("change", (e) => { rna = e.target.value === "rna"; build(); });
    $("#bp-check", host).addEventListener("click", check);
    $("#bp-show", host).addEventListener("click", () => { const want = M().comp(tpl, rna); $$("#bp-picks select", host).forEach((s, i) => (s.value = want[i])); draw(); check(); });
    $("#bp-clear", host).addEventListener("click", build);
    build(); questions(host, "#bp-q", spec.questions);
  };

  // ---------- 2. Nucleotide Builder and DNA–RNA–tRNA explorer (3.1.7.1 s1, s2, s4, s5) ----------
  B.interactives.dnaNucleotide = function (spec, host) {
    const feats = [
      ["Contains deoxyribose", [1, 0, 0]], ["Contains ribose", [0, 1, 1]], ["Thymine is one of its four bases", [1, 0, 0]], ["Uracil is one of its four bases", [0, 1, 1]],
      ["Contains phosphate groups and nitrogen-containing bases", [1, 1, 1]], ["Made of two polynucleotide chains", [1, 0, 0]], ["A single polynucleotide strand", [0, 1, 1]],
      ["Hydrogen bonds between complementary bases hold a characteristic overall shape (double helix or clover leaf)", [1, 0, 1]], ["Folded into a clover-leaf shape", [0, 0, 1]], ["Has an anticodon", [0, 0, 1]],
      ["Has an amino acid binding site", [0, 0, 1]], ["A linear strand read as a series of codons", [0, 1, 0]], ["Relatively short polynucleotide", [0, 1, 1]]];
    const cols = ["DNA", "mRNA", "tRNA"];
    host.innerHTML = head(spec, "builder") + `
      <div class="grid grid-2"><div><h4>Build a nucleotide</h4><div class="row"><label class="small">Pentose: <select id="nb-sugar"><option value="deoxyribose">deoxyribose</option><option value="ribose">ribose</option></select></label><label class="small">Base: <select id="nb-base"><option value="A">adenine (A)</option><option value="C">cytosine (C)</option><option value="G">guanine (G)</option><option value="T">thymine (T)</option><option value="U">uracil (U)</option></select></label><label class="small"><input type="checkbox" id="nb-p" checked> phosphate group</label></div><div id="nb-view" class="mt"></div></div>
      <div><div class="card" id="nb-verdict" aria-live="polite"></div><p class="tiny muted mt">The drawing numbers the pentose's carbons 1′–5′ (supporting detail): base on 1′, phosphate on 5′; the 2′ carbon carries H in deoxyribose and OH in ribose.</p></div></div>
      <h4 class="mt">Sort the features</h4><p class="small">Tick every molecule each feature applies to, then check. Use the AS-level descriptions.</p>
      <div style="overflow-x:auto"><table class="tbl" id="nb-grid"><thead><tr><th>Feature</th>${cols.map((c) => `<th>${c}</th>`).join("")}<th></th></tr></thead><tbody>${feats.map(([f], i) => `<tr><td>${f}</td>${cols.map((c, j) => `<td style="text-align:center"><input type="checkbox" data-r="${i}" data-c="${j}" aria-label="${esc(f)}: ${c}"></td>`).join("")}<td class="mk" data-r="${i}"></td></tr>`).join("")}</tbody></table></div>
      <div class="row mt"><button class="btn sm primary" id="nb-check">Check</button><button class="btn sm" id="nb-ans">Show answers</button><button class="btn sm" id="nb-reset">Reset</button></div><div id="nb-score" class="small mt" aria-live="polite"></div>
      <h4 class="mt">Practice</h4><div id="nb-q"></div>`;
    const draw = () => { const sugar = $("#nb-sugar", host).value, base = $("#nb-base", host).value, p = $("#nb-p", host).checked; $("#nb-view", host).innerHTML = fig(A().nucleotideDetail({ sugar, base, phosphate: p, width: 520, note: false }));
      let v; if (!p) v = `<p>${cross} <strong>Not a nucleotide.</strong> A nucleotide needs all three parts: pentose, phosphate group and base. (<span class="badge amber">extension</span> A pentose plus a base alone is called a nucleoside.)</p>`;
      else if (sugar === "deoxyribose" && base === "U") v = `<p>${cross} <strong>Not one of the four DNA nucleotides.</strong> DNA nucleotides contain deoxyribose with A, C, G or <em>T</em>; uracil belongs in RNA.</p>`;
      else if (sugar === "ribose" && base === "T") v = `<p>${cross} <strong>Not one of the four standard RNA nucleotides.</strong> RNA nucleotides contain ribose with A, C, G or <em>U</em>; thymine belongs in DNA. <span class="badge amber">extension</span> A thymine-type base does occur in one loop of tRNA, made by modifying a uracil after the RNA is built; you will not be examined on it.</p>`;
      else v = `<p>${tick} <strong>A${sugar === "ribose" ? "n RNA" : " DNA"} nucleotide</strong>: ${sugar}, a phosphate group and ${A().BASENAME[base]}${["A", "C", "G"].includes(base) ? ` (a base found in both DNA and RNA; the ${sugar} decides which)` : ""}. ${["A", "G"].includes(base) ? "Adenine and guanine are purines (two rings)." : "This base is a pyrimidine (one ring)."}</p>`;
      $("#nb-verdict", host).innerHTML = v; };
    ["#nb-sugar", "#nb-base", "#nb-p"].forEach((s) => $(s, host).addEventListener("change", draw)); draw();
    const mark = (show) => { let right = 0; feats.forEach(([, ans], i) => { const boxes = $$(`input[data-r="${i}"]`, host); if (show) boxes.forEach((b, j) => (b.checked = !!ans[j])); const ok = boxes.every((b, j) => b.checked === !!ans[j]); if (ok) right++; $(`.mk[data-r="${i}"]`, host).innerHTML = ok ? tick : cross; }); $("#nb-score", host).innerHTML = show ? "Answers shown. Note: DNA also contains base triplets; 'codon' is used for the triplets on mRNA. tRNA's anticodon is one triplet on one loop. mRNA has no characteristic overall shape, although short regions of it can pair to form local folds." : `${right} of ${feats.length} rows correct.${right === feats.length ? " Every feature sorted correctly." : " Rows marked ✗ have at least one wrong tick."}`; };
    $("#nb-check", host).addEventListener("click", () => mark(false)); $("#nb-ans", host).addEventListener("click", () => mark(true));
    $("#nb-reset", host).addEventListener("click", () => { $$("#nb-grid input", host).forEach((b) => (b.checked = false)); $$(".mk", host).forEach((m) => (m.innerHTML = "")); $("#nb-score", host).innerHTML = ""; });
    questions(host, "#nb-q", spec.questions);
  };

  // ---------- 3. Where is the DNA? Organisation explorer (3.1.7.2) ----------
  B.interactives.dnaOrganise = function (spec, host) {
    const places = {
      nucleus: { label: "Eukaryotic nucleus", svg: () => A().packaging(), rows: [["Shape", "linear"], ["Length", "long: human chromosomes about 45–250 million base pairs each"], ["Proteins", "associated with histones, which package and order it into chromosomes"], ["Number of molecules", "several (46 in a human body cell)"], ["Introns and repeats", "many: about 1–2 % of human nuclear DNA codes for polypeptides"]] },
      prok: { label: "Prokaryotic cell", svg: () => A().circularDNA({ only: "prok" }), rows: [["Shape", "circular"], ["Length", "shorter: E. coli about 4.6 million base pairs"], ["Proteins", "not associated with proteins (no histones)"], ["Where", "free in the cytoplasm; no nucleus"], ["Introns and repeats", "no introns; little DNA between genes (supporting)"]] },
      mito: { label: "Mitochondrion", svg: () => A().circularDNA({ only: "mito" }), rows: [["Shape", "circular"], ["Length", "short: human mitochondrial DNA 16 569 base pairs, 37 genes"], ["Proteins", "not associated with proteins (no histones)"], ["Where", "several copies in the matrix"], ["Origin (supporting)", "resembles bacterial DNA: evidence for the endosymbiotic theory"]] },
      chloro: { label: "Chloroplast", svg: () => A().circularDNA({ only: "chloro" }), rows: [["Shape", "circular"], ["Length", "short: typically about 120 000–160 000 base pairs"], ["Proteins", "not associated with proteins (no histones)"], ["Where", "several copies in the stroma"], ["Origin (supporting)", "resembles bacterial DNA: evidence for the endosymbiotic theory"]] } };
    const info = { gene: ["Gene", "A section of DNA that codes for a polypeptide. Each gene is at a fixed locus on a particular DNA molecule."], repeats: ["Non-coding multiple repeats", "The same short base sequence repeated many times, between genes. They do not code for polypeptides; the number of repeats varies between people (DNA profiling, supporting)."], exon: ["Exon", "A sequence within a gene that codes for part of the amino acid sequence of the polypeptide."], intron: ["Intron", "A non-coding sequence within a gene that separates two exons. Copied into pre-mRNA, then removed by splicing (3.1.8.2)."] };
    const genes = { hbb: { label: "Human β-globin gene (part of haemoglobin)", total: 1606, exons: [142, 223, 261] }, dmd: { label: "Human dystrophin gene (muscle protein; the longest known human gene)", total: 2220000, exons: null, exonTotal: 14000, nExons: 79 } };
    const uidN = Math.random().toString(36).slice(2, 7);
    host.innerHTML = head(spec, "explorer") + `
      <div class="tabs" role="tablist" aria-label="where the DNA is" id="og-tabs">${Object.entries(places).map(([k, p], i) => `<button role="tab" id="og-tab-${k}-${uidN}" aria-controls="og-panel-${uidN}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-k="${k}">${p.label}</button>`).join("")}</div>
      <div role="tabpanel" id="og-panel-${uidN}" aria-labelledby="og-tab-nucleus-${uidN}" tabindex="0"><div id="og-view" class="mt" style="max-width:760px"></div><div id="og-tbl" class="mt"></div></div>
      <h4 class="mt">Inside the nuclear DNA: genes, repeats, exons and introns</h4><p class="small">Select any part of the drawing (click, or Tab to it and press Enter).</p>
      <div id="og-map"></div><div class="card mt" id="og-info" aria-live="polite"><p class="small muted">Nothing selected yet.</p></div>
      <h4 class="mt">How much of a gene is exon?</h4><div class="row"><label class="small">Gene: <select id="og-gene">${Object.entries(genes).map(([k, g]) => `<option value="${k}">${g.label}</option>`).join("")}</select></label></div><div id="og-calc" class="mt"></div>
      <p class="tiny muted">Approximate published lengths (base pairs). Exon totals include short untranslated ends at each end of the gene (<span class="badge amber">extension</span>), so the fraction that actually codes for amino acids is a little lower still.</p>
      <h4 class="mt">Practice</h4><div id="og-q"></div>`;
    const show = (k, focus) => { $$("#og-tabs button", host).forEach((b) => { const on = b.dataset.k === k; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); }); $(`#og-panel-${uidN}`, host).setAttribute("aria-labelledby", `og-tab-${k}-${uidN}`); const p = places[k]; $("#og-view", host).innerHTML = fig(p.svg()); $("#og-tbl", host).innerHTML = `<table class="tbl"><tbody>${p.rows.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</tbody></table><p class="small mt">${k === "nucleus" ? "The only DNA here that is linear and wound round histones." : "Shorter, circular and not associated with proteins: the same three features in all three. This is the specification's wording and the examination answer. <span class=\"badge\">supporting</span> Strictly, there are no histones, but a few other proteins do bind to this DNA (see the note in the 3.1.7.2 notes)."}</p>`; };
    const keys = Object.keys(places); $$("#og-tabs button", host).forEach((b) => { b.addEventListener("click", () => show(b.dataset.k)); b.addEventListener("keydown", (e) => { const i = keys.indexOf(b.dataset.k); const n = e.key === "ArrowRight" ? (i + 1) % keys.length : e.key === "ArrowLeft" ? (i + keys.length - 1) % keys.length : e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : -1; if (n >= 0) { e.preventDefault(); show(keys[n], true); } }); }); show("nucleus");
    $("#og-map", host).innerHTML = fig(A().geneMap());
    $$("#og-map [data-part]", host).forEach((g) => { g.style.cursor = "pointer"; g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", info[g.dataset.part][0]); const pick = () => { $$("#og-map [data-part]", host).forEach((x) => x.classList.remove("hl")); g.classList.add("hl"); const [t, d] = info[g.dataset.part]; $("#og-info", host).innerHTML = `<h4>${t}</h4><p class="small">${d}</p>`; }; g.addEventListener("click", pick); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }); });
    const calc = () => { const g = genes[$("#og-gene", host).value]; const ex = g.exons ? g.exons.reduce((a, b) => a + b, 0) : g.exonTotal, n = g.exons ? g.exons.length : g.nExons, pct = (100 * ex) / g.total; const w = 600, ew = Math.max(2, (w * ex) / g.total);
      $("#og-calc", host).innerHTML = `<table class="tbl"><tbody><tr><th>Length of gene</th><td>${g.total.toLocaleString("en-GB")} base pairs</td></tr><tr><th>Number of exons</th><td>${n} (so ${n - 1} introns)</td></tr><tr><th>Total length of exons</th><td>${ex.toLocaleString("en-GB")} base pairs${g.exons ? ` (${g.exons.join(" + ")})` : ""}</td></tr><tr><th>Percentage of the gene that is exon</th><td><strong>${pct < 1 ? pct.toFixed(1) : pct.toFixed(0)} %</strong> = ${ex.toLocaleString("en-GB")} ÷ ${g.total.toLocaleString("en-GB")} × 100</td></tr></tbody></table>${fig(`<svg viewBox="0 0 640 50" width="640" role="img" aria-label="bar: exons make up ${pct.toFixed(1)} percent of the gene"><rect x="20" y="12" width="${w}" height="20" fill="#fff" stroke="#6b7d8f" stroke-dasharray="4 3"/><rect x="20" y="12" width="${ew}" height="20" fill="#2f5f8f"/><text x="20" y="46" font-size="10.5" fill="#6b7d8f">solid: all exons added together; dashed: introns</text></svg>`)}`; };
    $("#og-gene", host).addEventListener("change", calc); calc();
    questions(host, "#og-q", spec.questions);
  };

  // ---------- 4. Semi-conservative replication stepper (3.1.7.3 s1) ----------
  B.interactives.dnaReplication = function (spec, host) {
    const tags = [[], ["the unwinding of the double helix", "breakage of hydrogen bonds between complementary base pairs", "the role of DNA helicase"], ["attraction of new DNA nucleotides to exposed bases on template strands and base pairing"], ["the role of DNA polymerase in joining DNA nucleotides"], ["semi-conservative replication"]];
    let k = 0, timer = null;
    host.innerHTML = head(spec, "step through") + `
      <div class="row" role="group" aria-label="replication steps">${A().repSteps.map((s, i) => `<button class="btn sm" data-s="${i}" aria-label="step ${i + 1}: ${esc(s.t)}">${i + 1}</button>`).join("")}<span style="flex:1"></span><button class="btn sm" id="rp-prev" aria-label="previous step">← Back</button><button class="btn sm primary" id="rp-next" aria-label="next step">Next →</button><button class="btn sm" id="rp-play">Play</button></div>
      <p class="tiny muted" id="rp-rm" hidden>Auto-play is off because reduced motion is requested; use the step buttons or the arrow keys.</p>
      <div id="rp-view" class="mt" tabindex="0" aria-label="replication drawing; use left and right arrow keys to change step" style="transition:opacity .25s"></div>
      <div class="card mt" id="rp-text" aria-live="polite"></div>
      <h4 class="mt">Practice</h4><div id="rp-q"></div>`;
    const render = () => { const v = $("#rp-view", host); const go = () => { v.innerHTML = fig(A().replication(k)); v.style.opacity = 1; }; if (reduced()) go(); else { v.style.opacity = 0.25; setTimeout(go, 120); }
      const s = A().repSteps[k]; $("#rp-text", host).innerHTML = `<h4>Step ${k + 1} of 5: ${s.t}</h4><p class="small">${s.d}</p>${tags[k].length ? `<p class="tiny muted">Specification point${tags[k].length > 1 ? "s" : ""}: ${tags[k].map((t) => `<span class="badge teal">${t}</span>`).join(" ")}</p>` : ""}`;
      $$("[data-s]", host).forEach((b) => { b.classList.toggle("primary", +b.dataset.s === k); b.setAttribute("aria-pressed", +b.dataset.s === k); }); $("#rp-prev", host).disabled = k === 0; $("#rp-next", host).disabled = k === 4; };
    const go = (n) => { k = Math.max(0, Math.min(4, n)); render(); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } $("#rp-play", host).textContent = "Play"; };
    $$("[data-s]", host).forEach((b) => b.addEventListener("click", () => { stop(); go(+b.dataset.s); }));
    $("#rp-prev", host).addEventListener("click", () => { stop(); go(k - 1); }); $("#rp-next", host).addEventListener("click", () => { stop(); go(k + 1); });
    $("#rp-view", host).addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(k + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(k - 1); } });
    $("#rp-play", host).addEventListener("click", () => { if (reduced()) { $("#rp-rm", host).hidden = false; return; } if (timer) { stop(); return; } if (k === 4) go(0); $("#rp-play", host).textContent = "Pause"; timer = setInterval(() => { if (!document.body.contains(host) || k >= 4) { stop(); return; } go(k + 1); }, 2600); });
    if (reduced()) { $("#rp-play", host).disabled = true; $("#rp-rm", host).hidden = false; }
    render(); questions(host, "#rp-q", spec.questions);
  };

  // ---------- 5. Meselson–Stahl band interpreter (3.1.7.3, supporting) ----------
  B.interactives.dnaMeselson = function (spec, host) {
    const names = { semi: "semi-conservative", conservative: "conservative", dispersive: "dispersive" };
    host.innerHTML = head(spec, "supporting: data interpretation") + `
      <p class="small">Bacteria with only heavy (¹⁵N) DNA are moved to a light (¹⁴N) medium. After each generation the DNA is spun in a density gradient. Choose a hypothesis to see what it predicts, then compare with what was observed.</p>
      <div class="row" role="radiogroup" aria-label="hypothesis">${Object.entries(names).map(([k, n], i) => `<label class="small"><input type="radio" name="ms-h-${spec.title.length}" value="${k}"${i === 0 ? " checked" : ""}> ${n}</label>`).join("")}<label class="small">Generations shown: <strong><span id="ms-gv">2</span></strong> <input type="range" id="ms-g" min="1" max="4" step="1" value="2" style="width:140px;accent-color:var(--teal)" aria-label="number of generations shown"></label></div>
      <div class="mt" id="ms-pred"></div><div class="mt" id="ms-obs"></div>
      <div class="card mt" id="ms-verdict" aria-live="polite"></div>
      <div style="overflow-x:auto"><table class="tbl mt" id="ms-tbl"></table></div>
      <p class="tiny muted">Model: semi-conservative, hybrid fraction 2 ÷ 2^g and the rest light; conservative, heavy fraction 1 ÷ 2^g and the rest light; dispersive, one band whose ¹⁵N share is 1 ÷ 2^g. Observed pattern as reported by Meselson and Stahl (1958); band positions schematic.</p>
      <h4 class="mt">Practice</h4><div id="ms-q"></div>`;
    const pc = (x) => `${+(100 * x).toFixed(1)} %`;
    const render = () => { const model = $$("input[type=radio]", host).find((r) => r.checked).value, g = +$("#ms-g", host).value; $("#ms-gv", host).textContent = g;
      $("#ms-pred", host).innerHTML = fig(A().meselsonFig({ model, gens: g })); $("#ms-obs", host).innerHTML = fig(A().meselsonFig({ model: "semi", gens: g, observed: true }));
      const rows = Array.from({ length: g + 1 }, (_, i) => { const f = M().meselson(model, i); return `<tr><td>${i}</td>${"dispersed" in f ? `<td colspan="3">one band; ¹⁵N share ${pc(f.dispersed)} of the DNA (${i === 0 ? "heavy" : i === 1 ? "at the hybrid position" : "between hybrid and light"})</td>` : `<td>${pc(f.heavy)}</td><td>${pc(f.hybrid)}</td><td>${pc(f.light)}</td>`}</tr>`; }).join("");
      $("#ms-tbl", host).innerHTML = `<thead><tr><th>Generation</th><th>Heavy</th><th>Hybrid</th><th>Light</th></tr></thead><tbody>${rows}</tbody>`;
      $("#ms-verdict", host).innerHTML = model === "semi" ? `<p class="small">${tick} <strong>Semi-conservative matches every generation.</strong> Generation 1: all hybrid (one original ¹⁵N strand + one new ¹⁴N strand). Generation 2: half hybrid, half light, because the new light strands act as templates too. The two original strands are never lost; they just end up in a smaller fraction of the molecules.</p>` : model === "conservative" ? `<p class="small">${cross} <strong>Conservative is ruled out at generation 1.</strong> It predicts a heavy band (the intact original molecule) plus a light band (the all-new copy); the observed DNA formed a single hybrid band.</p>` : `<p class="small">${cross} <strong>Dispersive survives generation 1 but is ruled out at generation ${g >= 2 ? 2 : "2 (show 2 or more generations)"}.</strong> It predicts one band at the hybrid position after one generation, matching the observation; after two generations it predicts a single band between hybrid and light, but two separate bands (hybrid and light) were observed.</p>`; };
    $$("input", host).forEach((i) => i.addEventListener("input", render)); $$("input[type=radio]", host).forEach((i) => i.addEventListener("change", render)); render();
    questions(host, "#ms-q", spec.questions);
  };
})(window.BIO);
