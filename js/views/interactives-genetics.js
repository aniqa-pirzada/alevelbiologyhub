// Interactives for 3.3.6 Inheritance (Phase 5 Batch 3, author B3).
// Kinds: geneticsVocab, genotypePhenotype (3.3.6.1); geneticsCrossBuilder, probabilityChallenge, geneticsChallenge
// (3.3.6.2). Engine and drawings: B.geneticsModel (data/content/_genetics-model.js, where the supported models, refusals
// and hand-worked test cases are documented; validate() checks them) and B.geneticsArt (data/content/_genetics-art.js).
// No answer is shown before the student commits: the Cross Builder asks for the gametes, then a predicted ratio, before
// it fills the Punnett square, and refuses any cross that belongs to a question on the page not yet answered
// (spec.locks, matched on the unordered pair of parents except for X-linked crosses, where mother and father are kept);
// the explorers hide the sentence that a question asks for until that question is answered (spec.gates).
// Accessibility: native buttons, selects, checkboxes and number inputs; tab rows answer the arrow keys; readouts are polite
// live regions; nothing animates, so reduced motion needs no special case. Layout: B.ix.split.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { $, $$, esc } = B.util;
  const M = () => B.geneticsModel, A = () => B.geneticsArt;
  const uidOf = () => Math.random().toString(36).slice(2, 7);
  const head = (spec, badge) => `<div class="card-head"><h3>${esc(spec.title)}</h3><span class="badge amber">${esc(badge)}</span></div>${spec.note ? `<p class="small muted">${esc(spec.note)}</p>` : ""}`;
  const answered = (qid) => { try { const a = B.store.get().attempts.filter((x) => x.qid === qid); return a.some((x) => x.score === x.max || x.mode === "self") || a.length >= 2; } catch (e) { return false; } };
  const allAnswered = (q) => [].concat(q || []).every(answered);
  const FB = { ok: "background:var(--sage-soft);border-left:4px solid var(--sage)", bad: "background:var(--rose-soft);border-left:4px solid var(--rose)", neutral: "background:var(--surface-2);border-left:4px solid var(--line-strong)" };
  const fb = (kind, html) => `<div class="feedback ${kind}" style="${FB[kind]};padding:.5rem .7rem;border-radius:8px;margin:.4rem 0;font-size:.88rem">${html}</div>`;
  const qBlock = (spec, title = "Questions") => ((spec.questions || []).length ? `<h4 class="mt">${esc(title)}</h4><div data-qs></div>` : "");
  const renderQs = (spec, host, onAnswer, list) => { const into = $("[data-qs]", host); if (!into) return; (list || spec.questions || []).forEach((q, i) => { const box = document.createElement("div"); box.dataset.qn = String(i + 1); box.append(B.questions.render(q, { onAnswer: () => setTimeout(onAnswer || (() => {}), 0) })); into.append(box); }); };
  // questions one at a time (correction pass, RJ-5: keeps the Learn tab short); every question stays inside its model
  const qCarousel = (spec, host, onAnswer) => { const into = $("[data-qs]", host); if (!into) return; const qs = spec.questions || []; let cur = 0;
    const bar = document.createElement("div"); bar.className = "row"; bar.style.cssText = "gap:.4rem;align-items:center;flex-wrap:wrap;margin:.2rem 0 .4rem";
    bar.innerHTML = `<button type="button" class="btn sm" data-q="prev">← Previous</button><span class="small" data-q="pos" aria-live="polite"></span><button type="button" class="btn sm" data-q="next">Next →</button>`; into.append(bar);
    const boxes = qs.map((q, i) => { const d = document.createElement("div"); d.dataset.qn = String(i + 1); d.append(B.questions.render(q, { onAnswer: () => setTimeout(() => { show(); (onAnswer || (() => {}))(); }, 0) })); into.append(d); return d; });
    const show = () => { boxes.forEach((d, i) => (d.hidden = i !== cur)); $("[data-q=pos]", bar).textContent = `Question ${cur + 1} of ${qs.length} · answered ${qs.filter((q) => answered(q.id)).length}`; };
    $("[data-q=prev]", bar).addEventListener("click", () => { cur = (cur - 1 + qs.length) % qs.length; show(); }); $("[data-q=next]", bar).addEventListener("click", () => { cur = (cur + 1) % qs.length; show(); });
    show(); return { go: (i) => { cur = i; show(); } }; };
  const qNum = (spec, qid) => (spec.questions || []).findIndex((q) => q.id === qid) + 1;
  const tabs = (bar, labels, onShow, start = 0) => { let cur = start;
    bar.setAttribute("role", "tablist");
    bar.innerHTML = labels.map((l, i) => `<button type="button" class="btn sm${i === start ? " primary" : ""}" role="tab" data-i="${i}" aria-selected="${i === start}" tabindex="${i === start ? 0 : -1}">${esc(l)}</button>`).join("");
    const show = (i, focus) => { cur = (i + labels.length) % labels.length; $$("button", bar).forEach((b, k) => { b.setAttribute("aria-selected", String(k === cur)); b.tabIndex = k === cur ? 0 : -1; b.classList.toggle("primary", k === cur); }); if (focus) $$("button", bar)[cur].focus(); onShow(cur); };
    $$("button", bar).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    bar.addEventListener("keydown", (e) => { const mv = { ArrowRight: 1, ArrowLeft: -1 }; let ni = null; if (e.key in mv) ni = cur + mv[e.key]; else if (e.key === "Home") ni = 0; else if (e.key === "End") ni = labels.length - 1; if (ni === null) return; e.preventDefault(); show(ni, true); });
    show(start); return show; };
  const SEL = "padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:8px;max-width:100%";

  // ===================================== Vocabulary Explorer (3.3.6.1) =====================================
  const TERMS = [
    { k: "diploid", t: "Diploid", on: ["mat", "pat"], d: "A diploid cell has two sets of chromosomes, in homologous pairs: one chromosome of each pair came from the mother and one from the father.", ex: "The drawing shows one homologous pair; a human body cell has 23 pairs." },
    { k: "gene", t: "Gene", on: ["B1", "B2"], d: "A gene is a section of DNA that codes for a polypeptide. It has a fixed position on its chromosome.", ex: "Gene B is highlighted on both chromosomes of the pair." },
    { k: "locus", t: "Locus", on: ["lB"], d: "The locus of a gene is its fixed position on a chromosome. Both chromosomes of a homologous pair have the same genes at the same loci.", ex: "The dashed line marks the locus of gene B on both chromosomes." },
    { k: "allele", t: "Allele", on: ["B2"], d: "An allele is one version of a gene, with a different base sequence. Alleles of a gene occupy the same locus.", ex: "Allele b is highlighted; the other chromosome carries allele B at the same locus." },
    { k: "genotype", t: "Genotype", on: ["A1", "A2", "B1", "B2", "D1", "D2"], d: "The genotype is the genetic constitution of an organism: the alleles it has.", ex: "At these three loci this cell's genotype is AA Bb dd." },
    { k: "phenotype", t: "Phenotype", on: [], d: "The phenotype is the expression of the genotype and its interaction with the environment.", ex: "A tall plant grown in poor soil may be short: same genotype, different phenotype." },
    { k: "homozygous", t: "Homozygous", on: ["A1", "A2", "D1", "D2"], d: "The two alleles at a locus are the same.", ex: "Loci A (AA) and D (dd) are homozygous." },
    { k: "heterozygous", t: "Heterozygous", on: ["B1", "B2"], d: "The two alleles at a locus are different.", ex: "Locus B (Bb) is heterozygous." },
    { k: "dominant", t: "Dominant", on: ["B1"], d: "A dominant allele is expressed in the phenotype even when only one copy is present (in a heterozygote).", ex: "B is dominant: the Bb cell shows the B phenotype." },
    { k: "recessive", t: "Recessive", on: ["B2", "D1", "D2"], d: "A recessive allele is expressed in the phenotype only when no dominant allele is present, for example in a homozygote (dd), or in a male for an X-linked gene.", ex: "b is not expressed in Bb; d is expressed in dd." },
    { k: "codominant", t: "Codominant", on: [], d: "Codominant alleles are both expressed in the phenotype of a heterozygote.", ex: "MN blood groups: a person with alleles Lᴹ and Lᴺ makes both the M and the N antigen." },
    { k: "multiple", t: "Multiple alleles", on: [], d: "A gene may have many alleles in a population, although each diploid cell carries only two of them.", ex: "The rabbit coat-colour gene has three alleles: C, cʰ and c." },
  ];
  B.interactives.geneticsVocab = function (spec, host) {
    host.innerHTML = head(spec, "choose a term") + B.ix.split(`<div class="figure"><div class="fig-view" data-r="pic"></div></div>`, `
      <div class="row" data-r="terms" style="gap:.3rem;flex-wrap:wrap" role="group" aria-label="terms">${TERMS.map((x) => `<button type="button" class="btn sm" data-k="${x.k}" aria-pressed="false">${esc(x.t)}</button>`).join("")}</div>
      <div class="ix-readout mt" data-r="info" aria-live="polite">Choose a term to see what it means and where it is in the drawing.</div>`, { label: "Vocabulary Explorer controls" }) + `<p class="tiny muted mt">Simplified drawing: one homologous pair with three loci; real chromosomes carry hundreds to thousands of genes.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host);
    const pick = (k) => { const t = TERMS.find((x) => x.k === k); $$("[data-k]", host).forEach((b) => { const on = b.dataset.k === k; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("primary", on); });
      pic.innerHTML = A().vocab(t ? t.on : []); info.innerHTML = t ? `<strong>${esc(t.t)}.</strong> ${esc(t.d)}<br><span class="small">${esc(t.ex)}</span>` : ""; };
    $$("[data-k]", host).forEach((b) => b.addEventListener("click", () => pick(b.dataset.k)));
    pic.innerHTML = A().vocab([]); renderQs(spec, host);
    host._vx = { pick };
  };

  // ===================================== Genotype to Phenotype Explorer (3.3.6.1) =====================================
  const GP = { pea: { name: "Pea seed shape", pic: (ph) => A().seed(ph) }, roan: { name: "Cattle coat colour", pic: (ph) => A().coat(ph === "roan" ? "roan" : ph) }, abo: { name: "Human ABO blood group", pic: (ph) => A().redCell(ph) }, rabbit: { name: "Rabbit coat colour", pic: (ph, cold) => A().rabbit(ph === "full colour" ? "full" : ph === "Himalayan" ? "him" : "albino", cold) } };
  B.interactives.genotypePhenotype = function (spec, host) {
    const u = uidOf(); const gates = spec.gates || {}; let gene = "pea", cold = false;
    host.innerHTML = head(spec, "choose two alleles") + B.ix.split(`<div class="figure"><div class="fig-view" data-r="pic" style="text-align:center;min-height:150px"></div></div>`, `
      <label class="small">Gene <select data-r="gene" style="${SEL}">${Object.keys(GP).map((k) => `<option value="${k}">${esc(GP[k].name)}</option>`).join("")}</select></label>
      <div class="row mt" style="gap:.5rem;flex-wrap:wrap"><label class="small">Allele from the mother <select data-r="a1" style="${SEL}"></select></label><label class="small">Allele from the father <select data-r="a2" style="${SEL}"></select></label></div>
      <fieldset data-r="env" class="mt" style="border:0;padding:0;margin:.4rem 0 0" hidden><legend class="small"><strong>Environment</strong></legend>
        <label class="small" style="display:block"><input type="radio" name="env-${u}" value="0" checked> Normal conditions</label>
        <label class="small" style="display:block"><input type="radio" name="env-${u}" value="1"> A patch on the back shaved and kept cold while the fur regrows</label></fieldset>
      <div class="ix-readout mt" data-r="info" aria-live="polite"></div>`, { label: "Genotype to Phenotype Explorer controls" }) + `<p class="tiny muted mt">Simplified model: each picture shows the phenotype for that genotype; real phenotypes also vary with other genes and the environment.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), info = $("[data-r=info]", host), s1 = $("[data-r=a1]", host), s2 = $("[data-r=a2]", host), env = $("[data-r=env]", host);
    const fill = () => { const al = M().SC[gene].loci[0].al; const o = al.map((x, i) => `<option value="${i}">${esc(x.txt)}: ${esc(M().SC[gene].key[i][1])}</option>`).join(""); s1.innerHTML = o; s2.innerHTML = o; s1.value = "0"; s2.value = String(al.length - 1); env.hidden = gene !== "rabbit"; if (gene !== "rabbit") cold = false; };
    const why = (g, al, i, j) => { const x = al[i], y = al[j], het = i !== j;
      if (gene === "roan") { if (!het) return `Both alleles are ${esc(x.txt)}.`; return answered(gates.roan) ? `Both alleles are expressed: the cow has red hairs and white hairs, because Cᴿ and Cᵂ are <strong>codominant</strong>.` : `<em>Why does this cow look like this? Answer question ${qNum(spec, gates.roan)} below first.</em>`; }
      if (gene === "abo") { if (x.sym === "IA" && y.sym === "IB" || x.sym === "IB" && y.sym === "IA") return "Iᴬ and Iᴮ are codominant, so both antigens are made."; if (!het) return `Both alleles are ${esc(x.txt)}.`; const d = Math.min(i, j), r = Math.max(i, j); return `${esc(al[d].txt)} is dominant to ${esc(al[r].txt)}, so only ${al[d].sym === "IA" ? "antigen A" : "antigen B"} is made.`; }
      if (gene === "rabbit" && (x.sym === "ch" || y.sym === "ch") && !(x.sym === "C" || y.sym === "C") && gates.him && !answered(gates.him)) return `<em>Why does this rabbit look like this? Answer question ${qNum(spec, gates.him)} below first.</em>`;
      if (!het) return i === al.length - 1 ? "No dominant allele is present, so the recessive allele is expressed." : `Both alleles are ${esc(x.txt)}.`;
      const d = Math.min(i, j), r = Math.max(i, j); return `${esc(al[d].txt)} is dominant to ${esc(al[r].txt)}: one copy is enough, so ${esc(al[r].txt)} is not expressed.`; };
    const render = () => { const al = M().SC[gene].loci[0].al; const i = +s1.value, j = +s2.value; const txt = al[Math.min(i, j)].txt + al[Math.max(i, j)].txt; const r = M().cross(gene, txt, txt); const ph = r.p1ph; const het = i !== j;
      pic.innerHTML = GP[gene].pic(ph, cold);
      let h = `<strong>Genotype:</strong> ${esc(txt)} (${het ? "heterozygous: two different alleles" : "homozygous: two identical alleles"})<br><strong>Phenotype:</strong> ${esc(gene === "abo" ? "blood group " + ph : ph)}${gene === "pea" ? " seeds" : ""}<br>${why(r, al, i, j)}`;
      if (gene === "rabbit" && cold) h += `<br>${ph === "Himalayan" ? (answered(gates.cold) ? "Dark fur grows on the cooled patch. The enzyme coded for by cʰ (needed to make the dark pigment) works only at lower temperatures, so the phenotype depends on the genotype <strong>and</strong> the environment." : `<em>Dark fur has grown on the cooled patch. Why? Answer question ${qNum(spec, gates.cold)} below first.</em>`) : ph === "albino" ? "The patch stays white: cc rabbits make no functional enzyme at any temperature." : "The patch is the same colour as the rest of the coat."}`;
      if (gene === "pea" && i === 1 && j === 1) h += `<br><span class="tiny">Supporting detail: R codes for a starch-branching enzyme; rr seeds make less starch, take up more water and wrinkle as they dry.</span>`;
      info.innerHTML = h; };
    $("[data-r=gene]", host).addEventListener("change", (e) => { gene = e.target.value; fill(); render(); });
    s1.addEventListener("change", render); s2.addEventListener("change", render);
    $$(`input[name=env-${u}]`, host).forEach((r) => r.addEventListener("change", () => { cold = r.value === "1" && r.checked ? true : $(`input[name=env-${u}]:checked`, host).value === "1"; render(); }));
    fill(); render(); renderQs(spec, host, render);
    host._gp = { set: (g, i, j, c) => { gene = g; $("[data-r=gene]", host).value = g; fill(); s1.value = String(i); s2.value = String(j); if (c !== undefined) { cold = !!c; const r = $(`input[name=env-${u}][value="${c ? 1 : 0}"]`, host); if (r) r.checked = true; } render(); }, info: () => info.textContent };
  };

  // ===================================== Genetic Cross Builder (3.3.6.2) =====================================
  B.interactives.geneticsCrossBuilder = function (spec, host) {
    const G = M(); const u = uidOf(); const locks = spec.locks || [];
    let sid = null, step = "parents", res = null, gTries = 0, pTries = 0;
    host.innerHTML = head(spec, "build, predict, check") + B.ix.split(`<div class="figure"><div class="fig-view" data-r="pic"></div></div>`, `
      <div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="type of cross"></div>
      <label class="small mt" data-r="scnrow" style="display:block">Example <select data-r="scn" style="${SEL}"></select></label>
      <div class="ix-readout mt" data-r="about"></div>
      <div class="row mt" style="gap:.5rem;flex-wrap:wrap;align-items:flex-end"><label class="small"><span data-r="l1">Parent 1</span> <select data-r="p1" style="${SEL}"></select></label><span aria-hidden="true">×</span><label class="small"><span data-r="l2">Parent 2</span> <select data-r="p2" style="${SEL}"></select></label></div>
      <div data-r="msg" aria-live="polite"></div>
      <div data-r="gstep" class="mt" hidden><p class="small" style="margin:.2rem 0"><strong>Step 1.</strong> Tick every kind of gamete each parent can make.</p><div data-r="gbox"></div>
        <div class="row" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="gcheck">Check gametes</button><button type="button" class="btn sm" data-a="gshow" hidden>Show the gametes</button></div></div>
      <div data-r="pstep" class="mt" hidden><p class="small" style="margin:.2rem 0"><strong>Step 2.</strong> Predict the ratio of offspring phenotypes. Enter a whole number for each phenotype (0 if it cannot occur).</p><div data-r="pbox" class="row" style="gap:.4rem;flex-wrap:wrap"></div>
        <div class="row mt" style="gap:.4rem"><button type="button" class="btn sm primary" data-a="pcheck">Check prediction</button><button type="button" class="btn sm" data-a="pshow" hidden>Show answer</button></div></div>
      <div data-r="fb" aria-live="polite"></div>`, { label: "Genetic Cross Builder controls", cls: "ix-even ix-nosticky-sm" }) + `<p class="tiny muted mt">Simplified model: expected ratios are probabilities; real numbers of offspring vary by chance.</p>` + qBlock(spec);
    const pic = $("[data-r=pic]", host), about = $("[data-r=about]", host), selS = $("[data-r=scn]", host), s1 = $("[data-r=p1]", host), s2 = $("[data-r=p2]", host);
    const msg = $("[data-r=msg]", host), gstep = $("[data-r=gstep]", host), pstep = $("[data-r=pstep]", host), out = $("[data-r=fb]", host);
    const sexed = () => G.SC[sid].pairs.some((p) => p.type === "X");
    const lockOf = () => { const k = G.lockKey(sid, s1.value, s2.value); return locks.find((L) => G.lockKey(L.scn, L.p1, L.p2) === k && !allAnswered(L.q)) || null; };
    const setScn = (id) => { sid = id; const s = G.SC[id];
      about.innerHTML = `<strong>${esc(s.title)}.</strong> Key: ${s.key.map(([k, v]) => `${esc(k)} = ${esc(v)}`).join("; ")}.<br><span class="small">${esc(s.assume)}</span>`;
      const f = G.genotypes(id, "F"), m = sexed() ? G.genotypes(id, "M") : f;
      s1.innerHTML = f.map((x) => `<option value="${esc(x.txt)}">${esc(x.txt)}</option>`).join(""); s2.innerHTML = m.map((x) => `<option value="${esc(x.txt)}">${esc(x.txt)}</option>`).join("");
      $("[data-r=l1]", host).textContent = sexed() ? "Mother" : "Parent 1"; $("[data-r=l2]", host).textContent = sexed() ? "Father" : "Parent 2";
      const def = spec.start && spec.start[id]; s1.selectedIndex = def ? f.findIndex((x) => x.txt === def[0]) : Math.floor(f.length / 2); s2.selectedIndex = def ? m.findIndex((x) => x.txt === def[1]) : m.length - 1; setup(); };
    const setup = () => { step = "parents"; gTries = 0; pTries = 0; out.innerHTML = ""; msg.innerHTML = ""; gstep.hidden = true; pstep.hidden = true; res = null;
      const al = G.allowed(sid, s1.value, s2.value); if (!al.ok) { msg.innerHTML = fb("neutral", esc(al.reason)); pic.innerHTML = ""; return; }
      const L = lockOf(); if (L) { msg.innerHTML = fb("neutral", `<strong>This is the cross in ${esc(L.where)}.</strong> Answer it first; then you can check it here.`); pic.innerHTML = ""; return; }
      res = G.cross(sid, s1.value, s2.value); if (!res.ok) { msg.innerHTML = fb("bad", esc(res.reason)); pic.innerHTML = ""; return; }
      pic.innerHTML = A().diagram(res, { stage: "parents" });
      const box = (who, list) => `<fieldset style="border:1px solid var(--line);border-radius:8px;padding:.3rem .5rem;margin:.2rem 0"><legend class="small">${who} (${esc(who === "Parent 1" || who === "Mother" ? res.p1txt : res.p2txt)})</legend>${list.map((g, i) => `<label class="small" style="display:inline-flex;gap:.25rem;margin:.1rem .6rem .1rem 0"><input type="checkbox" value="${esc(g.txt)}" data-who="${who === "Parent 1" || who === "Mother" ? 1 : 2}"> ${esc(g.txt)}</label>`).join("")}</fieldset>`;
      $("[data-r=gbox]", host).innerHTML = box($("[data-r=l1]", host).textContent, G.allGametes(sid, "F")) + box($("[data-r=l2]", host).textContent, G.allGametes(sid, sexed() ? "M" : "F"));
      $("[data-a=gshow]", host).hidden = true; gstep.hidden = false; };
    const toPredict = (head) => { step = "predict"; gstep.hidden = true; pic.innerHTML = A().diagram(res, { stage: "gametes" });
      $("[data-r=pbox]", host).innerHTML = res.s.classes.map((c, i) => `<label class="small" style="display:inline-flex;flex-direction:column;gap:.1rem">${esc(c)}<input type="number" min="0" step="1" inputmode="numeric" data-c="${i}" style="width:5.5rem;padding:.3rem .45rem;border:1px solid var(--line-strong);border-radius:8px"></label>`).join("");
      $("[data-a=pshow]", host).hidden = true; pstep.hidden = false; out.innerHTML = head || ""; };
    const reveal = (head) => { step = "full"; pstep.hidden = true; pic.innerHTML = A().diagram(res, { stage: "full" });
      const shown = res.s.classes.map((c, i) => [c, res.ratio[i]]).filter((x) => x[1] > 0);
      // RJ-6: per-sex ratios built from the class names, zeros dropped, reduced
      let extra = ""; if (sexed()) { const part = (sex) => { const cls = res.s.classes.map((c, i) => [c.replace(/^(female|male) /, ""), res.weights[i]]).filter((x, i) => res.s.classes[i].startsWith(sex + " ") && x[1] > 0); if (!cls.length) return "none"; if (cls.length === 1) return `all ${esc(cls[0][0])}`; const r = G.reduce(cls.map((x) => x[1])); return cls.map((x, i) => `${r[i]} ${esc(x[0])}`).join(" : "); };
        extra = `<br><span class="small">Sons: ${part("male")}. Daughters: ${part("female")}.</span>`; }
      out.innerHTML = head + fb("neutral", `Phenotype ratio: ${shown.map((x) => `${x[1]} ${esc(x[0])}`).join(" : ")}.${extra}`); };
    $("[data-a=gcheck]", host).addEventListener("click", () => { const t1 = $$('input[data-who="1"]:checked', host).map((x) => x.value), t2 = $$('input[data-who="2"]:checked', host).map((x) => x.value);
      if (!t1.length || !t2.length) { out.innerHTML = fb("neutral", "Tick the gametes of both parents first."); return; }
      if (G.gameteSetOk(t1, res.g1) && G.gameteSetOk(t2, res.g2)) { toPredict(fb("ok", "<strong>Correct.</strong> The gametes are now in circles on the edges of the Punnett square.")); return; }
      gTries++; const linked = res.s.pairs.some((p) => p.loci.length === 2);
      out.innerHTML = fb("neutral", `<strong>Not quite.</strong> Each gamete has one allele of each gene${sexed() ? " (and a male's gamete has either his X or his Y)" : ""}.${linked ? (res.rf ? " Crossing over is stated here, so a double heterozygote also makes recombinant gametes." : " Linked alleles stay together on their chromosome: no crossing over in this scenario.") : ""}`);
      $("[data-a=gshow]", host).hidden = false; });
    $("[data-a=gshow]", host).addEventListener("click", () => toPredict(fb("neutral", `<strong>Gametes.</strong> ${esc(res.p1txt)} makes ${res.g1.map((x) => esc(x.txt)).join(", ")}; ${esc(res.p2txt)} makes ${res.g2.map((x) => esc(x.txt)).join(", ")}.`)));
    $("[data-a=pcheck]", host).addEventListener("click", () => { const v = $$("[data-c]", host).map((e) => (String(e.value).trim() === "" ? NaN : Number(e.value)));
      if (v.some((x) => !Number.isFinite(x) || x < 0)) { out.innerHTML = fb("neutral", "Enter a whole number for every phenotype (0 if it cannot occur)."); return; }
      if (G.predictOk(v, res.weights)) { reveal(fb("ok", "<strong>Correct.</strong>")); return; }
      pTries++; out.innerHTML = fb("neutral", "<strong>Not quite.</strong> Fill in the Punnett square in your head (or on paper): each square is one genotype; then count the phenotypes."); $("[data-a=pshow]", host).hidden = false; });
    $("[data-a=pshow]", host).addEventListener("click", () => reveal(fb("neutral", "<strong>Answer.</strong>")));
    s1.addEventListener("change", setup); s2.addEventListener("change", setup);
    let tabScns = [];
    const showTab = (i) => { tabScns = G.DEFS.filter((d) => d.tab === G.TABS[i]); selS.innerHTML = tabScns.map((d) => `<option value="${d.id}">${esc(d.title)}</option>`).join(""); $("[data-r=scnrow]", host).hidden = tabScns.length < 2; setScn(tabScns[0].id); };
    selS.addEventListener("change", () => setScn(selS.value));
    tabs($("[data-r=tabs]", host), G.TABS, showTab);
    const car = qCarousel(spec, host, () => { if (step === "parents") setup(); });
    host._cb = { q: (i) => car && car.go(i), tab: (i) => $$("[data-r=tabs] button", host)[i].click(), scn: (id) => { selS.value = id; setScn(id); }, set: (p1, p2) => { s1.value = p1; s2.value = p2; setup(); }, state: () => ({ sid, step, p1: s1.value, p2: s2.value, msg: msg.textContent, res }) };
  };

  // ===================================== Probability Challenge (3.3.6.2) =====================================
  B.interactives.probabilityChallenge = function (spec, host) {
    const items = spec.items || []; let cur = 0;
    host.innerHTML = head(spec, "one problem at a time") + `<div class="row" style="gap:.4rem;align-items:center;flex-wrap:wrap"><button type="button" class="btn sm" data-a="prev">← Previous</button><span class="small" data-r="pos" aria-live="polite"></span><button type="button" class="btn sm" data-a="next">Next →</button></div><div data-r="probs"></div>`;
    const wrap = $("[data-r=probs]", host);
    items.forEach((it, i) => { const q = (spec.questions || []).find((x) => x.id === it.qid); const d = document.createElement("div"); d.dataset.p = String(i); d.hidden = i !== 0;
      d.innerHTML = `${it.intro ? `<div class="ix-readout mt small">${it.intro}</div>` : ""}${it.fig === "pedigree" ? `<div class="figure"><div class="fig-view" style="max-width:420px">${A().pedigree()}</div></div>` : ""}`;
      if (q) d.append(B.questions.render(q, { onAnswer: () => setTimeout(pos, 0) })); wrap.append(d); });
    const pos = () => { const done = items.filter((it) => answered(it.qid)).length; $("[data-r=pos]", host).textContent = `Problem ${cur + 1} of ${items.length} · answered ${done}`; };
    const go = (d) => { cur = (cur + d + items.length) % items.length; $$("[data-p]", wrap).forEach((e) => (e.hidden = +e.dataset.p !== cur)); pos(); };
    $("[data-a=prev]", host).addEventListener("click", () => go(-1)); $("[data-a=next]", host).addEventListener("click", () => go(1));
    pos(); host._pc = { go: (i) => { cur = i; go(0); } };
  };

  // ===================================== Genetics Challenge Centre (3.3.6.2) =====================================
  B.interactives.geneticsChallenge = function (spec, host) {
    // one question at a time within each level (correction pass: keeps the Learn tab short)
    const LV = [["foundation", "Foundation"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]]; const pos = { foundation: 0, intermediate: 0, advanced: 0 };
    host.innerHTML = head(spec, "three levels") + `<div class="row" data-r="tabs" style="gap:.3rem;flex-wrap:wrap" aria-label="level"></div>
      <div class="row mt" style="gap:.4rem;align-items:center;flex-wrap:wrap"><button type="button" class="btn sm" data-a="prev">← Previous</button><span class="small" data-r="count" aria-live="polite"></span><button type="button" class="btn sm" data-a="next">Next →</button></div>${LV.map(([k]) => `<div data-lv="${k}" hidden></div>`).join("")}`;
    let cur = 0; const qsOf = (k) => (spec.questions || []).filter((q) => q.level === k);
    const show = () => { const k = LV[cur][0]; const qs = qsOf(k); $$(`[data-lv=${k}] > [data-qi]`, host).forEach((e) => (e.hidden = +e.dataset.qi !== pos[k])); $("[data-r=count]", host).textContent = `${LV[cur][1]}: question ${pos[k] + 1} of ${qs.length} · answered ${qs.filter((q) => answered(q.id)).length}`; };
    LV.forEach(([k]) => { const box = $(`[data-lv=${k}]`, host); qsOf(k).forEach((q, i) => { const d = document.createElement("div"); d.dataset.qi = String(i); d.append(B.questions.render(q, { onAnswer: () => setTimeout(show, 0) })); box.append(d); }); });
    const step = (d) => { const k = LV[cur][0]; const n = qsOf(k).length; pos[k] = (pos[k] + d + n) % n; show(); };
    $("[data-a=prev]", host).addEventListener("click", () => step(-1)); $("[data-a=next]", host).addEventListener("click", () => step(1));
    tabs($("[data-r=tabs]", host), LV.map((x) => x[1]), (i) => { cur = i; LV.forEach(([k], j) => ($(`[data-lv=${k}]`, host).hidden = j !== i)); show(); });
    host._gc = { level: (i) => $$("[data-r=tabs] button", host)[i].click(), go: (i) => { pos[LV[cur][0]] = i; show(); } };
  };
})(window.BIO);
