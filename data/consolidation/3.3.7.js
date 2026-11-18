// Consolidation for 3.3.7 Allele frequencies in populations (Phase 5 Batch 4, author C1): 3.3.7.1 Principles and
// applications (s1 to s5) and 3.3.7.2 The Hardy-Weinberg principle and equation (s1, s2). Answer key reviewed before
// building (scratchpad p5b4/C1-MODEL.md, review MR-C1). Every question is original; data are hypothetical or simulated
// and labelled. Marks: 3.3.7.1 24, 3.3.7.2 21 (45). The Hardy-Weinberg calculator refuses the data of c3, c16 to c19
// and c21 until those questions have been answered (B.popModel.LOCKS).
window.BIO = window.BIO || {}; window.BIO.consolidation = window.BIO.consolidation || {};
(function () {
  const B = window.BIO, INK = "#16263a", GREY = "#5f6f7f";
  const R1 = "3.3.7.1", R2 = "3.3.7.2";
  const S1 = (...n) => n.map((k) => `${R1}.s${k}`), S2 = (...n) => n.map((k) => `${R2}.s${k}`);
  const Q = (k) => `q-3.3.7-${k}`;
  const mcq = (k, ref, stmts, stem, options, explanation) => ({ id: Q(k), ref, stmts, type: "mcq", marks: 1, stem, options, answer: 0, explanation });
  const short = (k, ref, stmts, marks, stem, scheme, model) => ({ id: Q(k), ref, stmts, type: "short", marks, stem: `${stem} (${marks} mark${marks > 1 ? "s" : ""})`, scheme: scheme.map(([point, m]) => ({ point, marks: m || 1 })), model });
  const gap = (k, ref, stmts, marks, stem, text, answers, explanation) => ({ id: Q(k), ref, stmts, type: "gap", marks, stem, text, answers, explanation });
  const P = (n) => [String(n), `${n}%`, `${n} %`];

  // ---------------- concept map ----------------
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 600}" fill="${o.c || INK}">${s}</text>`;
  const node = (x, y, w, h, href, title, sub, fill, stroke) => `<a href="${href}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${T(x, y - 4, title)}${T(x, y + 15, sub, { s: 13.5, w: 500, c: GREY })}</a>`;
  const edge = (x1, y1, x2, y2, label, lw = 150) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8fa6a0" stroke-width="2" marker-end="url(#cm337)"/>` + (label ? `<rect x="${(x1 + x2) / 2 - lw / 2}" y="${(y1 + y2) / 2 - 11}" width="${lw}" height="22" rx="11" fill="#fff"/>${T((x1 + x2) / 2, (y1 + y2) / 2 + 5, label, { s: 13.5, w: 500, c: GREY })}` : "");
  const A1 = "#/topic/3.3.7.1", A2 = "#/topic/3.3.7.2";
  const conceptMap = `<svg viewBox="0 0 800 520" width="800" role="img" aria-label="Concept map of allele frequencies in populations; each box is a link to a page" style="max-width:100%;height:auto">
    <defs><marker id="cm337" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#8fa6a0"/></marker></defs>
    ${edge(150, 71, 150, 124, "has a", 64)}${edge(150, 176, 150, 229, "described by", 116)}
    ${edge(275, 255, 378, 255)}${edge(365, 161, 430, 222)}${edge(540, 161, 490, 222)}${edge(715, 161, 545, 222)}${edge(560, 255, 623, 255)}
    ${edge(150, 281, 150, 374, "predicted by", 112)}${edge(150, 426, 150, 452)}${edge(275, 400, 328, 400)}${edge(470, 364, 470, 290, "if broken", 90)}
    ${node(150, 45, 250, 52, A1, "Population", "one species, interbreeding", "#d6efec", "#1f8a8a")}
    ${node(150, 150, 250, 52, A1, "Gene pool", "all the alleles: 2N copies", "#d6efec", "#1f8a8a")}
    ${node(150, 255, 250, 52, A1, "Allele frequency", "copies of one allele ÷ 2N", "#d6efec", "#1f8a8a")}
    ${node(365, 135, 150, 52, A1, "Selective breeding", "high yield", "#fff", "#1f8a8a")}
    ${node(540, 135, 150, 52, A1, "Genetic drift", "chance; few copies", "#fff", "#1f8a8a")}
    ${node(715, 135, 150, 52, A1, "Bottleneck", "severe fall in size", "#fff", "#1f8a8a")}
    ${node(470, 255, 180, 66, A1, "Change in", "allele frequency", "#fdf0dc", "#a3620f")}
    ${node(700, 255, 150, 52, "#/topic/3.3.8.1", "Evolution", "next: 3.3.8.1", "#fff", "#a3620f")}
    ${node(150, 400, 250, 52, A2, "Hardy-Weinberg", "allele frequencies constant", "#efe7f6", "#7b3f98")}
    ${node(150, 478, 250, 52, A2, "p + q = 1", "p² + 2pq + q² = 1", "#efe7f6", "#7b3f98")}
    ${node(470, 404, 284, 76, A2, "Conditions", "large; random mating; no mutation,", "#fff", "#7b3f98")}
    ${T(470, 437, "migration or selection", { s: 13.5, w: 500, c: GREY })}
  </svg>`.replace(/\s*\n\s*/g, " ");

  // ---------------- summary ----------------
  const retrieval = [
    ["Define a population in population genetics.", "A group of potentially interbreeding organisms of the same species occupying a particular space at a particular time."],
    ["What is a gene pool?", "The complete set of alleles for a gene in a single population."],
    ["How many copies of a gene are there in 40 diploid individuals?", "80 (2N)."],
    ["How does selective breeding change a population?", "Breeders choose the parents; alleles for the desired characteristic increase in frequency; diversity falls."],
    ["What is genetic drift, and when is it strongest?", "A change in allele frequency due to chance; strongest when there are few copies of an allele."],
    ["Why does a population stay low in diversity after a bottleneck?", "It descends from the few survivors; lost alleles return only by mutation or migration."],
    ["What does the Hardy-Weinberg principle predict?", "That allele frequencies do not change from generation to generation, if the conditions apply."],
    ["List the Hardy-Weinberg conditions.", "Large population; random mating; no mutation; no migration; no selection."],
    ["12.25 % show the recessive phenotype. Find the frequency of carriers.", "q² = 0.1225, q = 0.35, p = 0.65, 2pq = 0.455."],
    ["Why must you not square root the dominant phenotype frequency?", "It includes AA and Aa; find q² = 1 − dominant frequency first."],
  ];
  const summaryHTML = () => `
<h3>The topic in one page</h3>
<p><strong>3.3.7.1 Principles and applications.</strong> A <strong>population</strong> is a group of potentially interbreeding organisms of the same species occupying a particular space at a particular time. Its <strong>gene pool</strong> is the complete set of alleles for a gene (2N copies in N diploid individuals); an <strong>allele frequency</strong> is the fraction of those copies that are one allele. <strong>Selective breeding</strong> for high yield raises the frequency of the alleles breeders select, and reduces diversity. <strong>Genetic drift</strong> is chance change in allele frequency, strongest when there are few copies of an allele. A <strong>genetic bottleneck</strong>, a severe fall in population size caused by an environmental event or human activity, reduces the gene pool.</p>
<p><strong>3.3.7.2 The Hardy-Weinberg principle.</strong> A <strong>mathematical model</strong>: allele frequencies do not change from generation to generation if the population is large, mates at random, and has no mutation, migration or selection. <strong>p + q = 1</strong> and <strong>p² + 2pq + q² = 1</strong>: start from the recessive phenotype (q²), find q, then p = 1 − q, carriers 2pq and the dominant phenotype p² + 2pq. A departure from the prediction suggests, but does not prove, that a condition is broken.</p>
<h3>Mixed retrieval</h3>
<p class="small muted">Answer each from memory, then open it to check. The combined deck schedules these ideas for spaced review.</p>
${retrieval.map(([qq, a], i) => `<details class="small"><summary>${i + 1}. ${qq}</summary><p>${a}</p></details>`).join("")}
<h3>Key skills</h3>
<table class="tbl"><tr><th>Skill</th><th>Remember</th><th>Typical question</th></tr>
<tr><th>Allele counting</th><td>2N copies; homozygotes give two copies, heterozygotes one of each.</td><td>"Calculate the frequency of allele b."</td></tr>
<tr><th>Drift and bottlenecks</th><td>Use the word chance; few copies give a larger effect; lost alleles return only by mutation or migration.</td><td>"Explain why the island population has fewer alleles."</td></tr>
<tr><th>Hardy-Weinberg</th><td>q² from the recessive phenotype; q = √q²; p = 1 − q; 2pq for carriers.</td><td>"Calculate the percentage of carriers."</td></tr>
<tr><th>Conditions</th><td>Name the condition most likely broken in the context (small, migrants, selection, non-random mating).</td><td>"Suggest why the observed numbers differ from those expected."</td></tr></table>
<h3>Common errors to eliminate</h3>
<ul><li>Dividing allele counts by N instead of 2N.</li><li>Square rooting the dominant phenotype frequency.</li><li>Using pq instead of 2pq for carriers.</li><li>Saying a departure "proves" selection.</li><li>Saying individuals evolve, or that drift removes only harmful alleles.</li></ul>`;

  // ---------------- deck ----------------
  const extraCards = [
    { id: `f-${R1}-cx1`, ref: R1, front: "Link: where are the two copies of a gene in a diploid cell?", back: "At the same locus on each chromosome of a homologous pair (3.3.6.1), so N individuals carry 2N copies." },
    { id: `f-${R1}-cx6`, ref: R1, front: "60 AA, 30 Aa, 10 aa: frequency of a?", back: "(30 + 20) ÷ 200 = 0.25." },
    { id: `f-${R1}-cx7`, ref: R1, front: "Selective breeding or natural selection: who decides which individuals reproduce?", back: "In selective breeding, humans choose the parents for a characteristic they want." },
    { id: `f-${R2}-cx6`, ref: R2, front: "1 in 100 show a recessive phenotype. q, p and 2pq?", back: "q = 0.1, p = 0.9, 2pq = 0.18." },
    { id: `f-${R1}-cx2`, ref: R1, front: "Link: how is genetic diversity measured?", back: "By comparing base sequences, the frequency of alleles, or amino acid sequences (3.1.11.1)." },
    { id: `f-${R1}-cx3`, ref: R1, front: "Link: how do new alleles arise?", back: "By gene mutation, a change in the base sequence of DNA (3.2.11.1)." },
    { id: `f-${R1}-cx4`, ref: R1, front: "Drift or selection? An allele rises in one of five identical small populations and falls in another.", back: "Drift: the changes are in different directions, so they are due to chance." },
    { id: `f-${R1}-cx5`, ref: R1, front: "Bottleneck: environmental event or human activity? Over-hunting of seals.", back: "Human activity." },
    { id: `f-${R2}-cx1`, ref: R2, front: "p = 0.9. Frequency of carriers?", back: "2 × 0.9 × 0.1 = 0.18." },
    { id: `f-${R2}-cx2`, ref: R2, front: "Link: why is 2pq like the Aa squares of a Punnett square?", back: "Aa forms in two ways, A from either parent (3.3.6.2)." },
    { id: `f-${R2}-cx3`, ref: R2, front: "Fewer heterozygotes than 2pq: give two possible causes.", back: "Non-random mating (e.g. inbreeding) or selection against heterozygotes." },
    { id: `f-${R2}-cx4`, ref: R2, front: "Link: what is evolution?", back: "A change in the allele frequencies in a population (3.3.8.1)." },
    { id: `f-${R2}-cx5`, ref: R2, front: "Allele frequencies change between generations in a large population. Most likely cause?", back: "Selection or migration (drift is weak in a large population)." },
  ];
  const TARGET = 40;
  const lists = [R1, R2].map((r) => ((B.content[r] || {}).flashcards || []).map((f) => f.id));
  const deckIds = []; for (let i = 0; deckIds.length < TARGET - extraCards.length && lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length && deckIds.length < TARGET - extraCards.length) deckIds.push(l[i]);

  // ---------------- assessment (45 marks) ----------------
  const DEER = `<table class="tbl"><thead><tr><th>Gene</th><th>Alleles before the winter (museum specimens)</th><th>Alleles in living deer, 50 years later</th></tr></thead><tbody><tr><td>1</td><td>8</td><td>3</td></tr><tr><td>2</td><td>6</td><td>2</td></tr><tr><td>3</td><td>5</td><td>2</td></tr><tr><td>4</td><td>4</td><td>2</td></tr><tr><td>5</td><td>3</td><td>1</td></tr></tbody></table>`;
  const DEERSTEM = "Hypothetical data. The table shows the number of different alleles found at five genes in an island population of deer, from museum specimens collected before a severe winter killed most of the population, and from living deer 50 years later.";
  const DRIFT = `<table class="tbl"><thead><tr><th>Generation</th><th>0</th><th>2</th><th>4</th><th>6</th><th>8</th><th>10</th></tr></thead><tbody><tr><th>Small 1 (10 individuals)</th><td>0.50</td><td>0.60</td><td>0.45</td><td>0.70</td><td>0.90</td><td>1.00</td></tr><tr><th>Small 2 (10 individuals)</th><td>0.50</td><td>0.55</td><td>0.35</td><td>0.40</td><td>0.15</td><td>0.00</td></tr><tr><th>Large 1 (500 individuals)</th><td>0.50</td><td>0.51</td><td>0.49</td><td>0.50</td><td>0.52</td><td>0.51</td></tr><tr><th>Large 2 (500 individuals)</th><td>0.50</td><td>0.49</td><td>0.50</td><td>0.48</td><td>0.47</td><td>0.49</td></tr></tbody></table>`;
  const DRIFTSTEM = "Simulated data. The table shows the frequency of allele A in four simulated populations with no selection, mutation or migration.";
  const q = [
    // ---- 3.3.7.1 (24 marks) ----
    mcq("c1", R1, S1(1), "Which best describes a population in population genetics?", ["A group of potentially interbreeding organisms of the same species occupying a particular space at a particular time", "All the organisms of the different species that live together in one habitat", "All the members of one species, wherever they live in the world", "A group of organisms with the same genotype living in one place"], "Same species, potentially interbreeding, particular space and time."),
    short("c2", R1, S1(1, 2), 2, "A fish species lives in two lakes, A and B, which are not connected. Explain why the fish form two populations with separate gene pools.", [["The fish occupy different spaces / the fish in the two lakes cannot meet"], ["They cannot interbreed, so alleles are not exchanged: each lake has its own complete set of alleles (allele frequencies can differ)"]], "A population occupies one particular space. Fish in lake A cannot meet fish in lake B, so they cannot interbreed and pass alleles between the lakes. Each lake therefore has its own gene pool, and the allele frequencies in the two lakes can differ."),
    gap("c3", R1, S1(2), 3, "Hypothetical data. 80 plants were tested: 20 RR, 30 Rr and 30 rr.", "Copies of the gene in the gene pool = {{1}}. Copies of r = {{2}}. Frequency of r, as a decimal = {{3}}.", { 1: ["160"], 2: ["90"], 3: ["0.5625", "0.563", "0.56", "9/16"] }, "2 × 80 = 160 copies; r = 30 + 2 × 30 = 90; 90 ÷ 160 = 0.5625. (R = 40 + 30 = 70; 70 + 90 = 160.)"),
    mcq("c4", R1, S1(2), "A gene has two alleles. In a population, the frequency of one allele is 0.35. What is the frequency of the other?", ["0.65", "0.35", "0.1225", "0.4225"], "The frequencies of the alleles of a gene add up to 1: 1 − 0.35 = 0.65."),
    short("c5", R1, S1(3), 3, "Explain how selective breeding over many generations has produced wheat varieties with higher grain yields.", [["Breeders chose the plants with the highest yields as parents"], ["These passed on alleles that increase yield"], ["Repeated over many generations, the frequency of these alleles in the gene pool increased"]], "In each generation breeders chose the highest-yielding wheat plants as parents. These plants passed on alleles that increase yield to their offspring. Repeating this over many generations increased the frequency of these alleles in the gene pool, so yields rose."),
    short("c6", R1, S1(3, 4), 2, "Many high-yielding breeds have low genetic diversity. Explain why, and give one disadvantage of this.", [["Only a few individuals with the desired characteristics are bred from, so other alleles become rare or are lost"], ["The breed may lack alleles for resistance to a new disease / to cope with a change in the environment"]], "Because breeders use only a few of the best individuals as parents, the alleles carried by the others become rare or are lost, reducing diversity. The breed may then lack alleles that would give resistance to a new disease or help it cope with changed conditions."),
    mcq("c7", R1, S1(4), "A flood reduces a population of 2 000 beetles to 12. What is most likely to be true of the surviving population?", ["It has fewer different alleles of many genes than before the flood", "It has more different alleles, because the survivors mutate", "It has exactly the same allele frequencies as before the flood", "It has only the dominant alleles of each gene left"], "A severe reduction in size (a bottleneck) loses the alleles the survivors do not carry."),
    gap("c8", R1, S1(4), 2, `${DEERSTEM}${DEER}`, "Mean number of alleles per gene before the winter = {{1}}. After = {{2}}.", { 1: ["5.2"], 2: ["2", "2.0"] }, "Before: (8 + 6 + 5 + 4 + 3) ÷ 5 = 26 ÷ 5 = 5.2. After: (3 + 2 + 2 + 2 + 1) ÷ 5 = 10 ÷ 5 = 2."),
    short("c9", R1, S1(4), 3, `${DEERSTEM}${DEER} Explain the change in the number of alleles, and why it has lasted for 50 years.`, [["The severe winter caused a severe reduction in population size: a genetic bottleneck"], ["Alleles not carried by the few survivors were lost (by chance; often the rare ones)"], ["The population grew from the survivors, and lost alleles return only through mutation, which is rare, or migration, which is unlikely on an island"]], "The winter killed most of the deer: a genetic bottleneck. Alleles that none of the few survivors carried were lost, by chance. The population grew again only from the survivors' alleles; lost alleles could return only by rare mutations or by migration, which is unlikely on an island, so diversity has stayed low."),
    mcq("c10", R1, S1(5), `${DEERSTEM}${DEER} Gene 5 now has only one allele. What has happened to that allele?`, ["It has become fixed: its frequency is 1", "It has been lost: its frequency is 0", "Its frequency has fallen to 0.5", "It has become dominant to the others"], "The only allele left at a gene is fixed, with a frequency of 1."),
    mcq("c11", R1, S1(5), "Why does genetic drift have a greater effect when an allele is present in few copies?", ["The chance failure of a few individuals to reproduce can remove a large proportion, or all, of its copies", "Rare alleles are always recessive, so they are selected against", "Rare alleles mutate more often than common alleles do", "An allele with few copies always gives a selective advantage"], "With few copies, a small chance event is a large proportional change."),
    short("c12", R1, S1(5), 3, `${DRIFTSTEM}${DRIFT} Compare the results for the small and the large populations, and explain the difference.`, [["In the small populations the frequency of A changed a lot, up and down; A became fixed in one and was lost in the other"], ["In the large populations the frequency stayed close to 0.5"], ["Genetic drift is due to chance, and with few copies of each allele chance changes have a larger effect"]], "In the two small populations the frequency of A rose and fell from one generation to the next, and A ended fixed (1.00) in one and lost (0.00) in the other. In the large populations it stayed between 0.47 and 0.52. With no selection, these changes are genetic drift: chance changes have a much larger effect when each allele has only a few copies, as in a population of 10."),
    mcq("c13", R1, S1(5), `${DRIFTSTEM}${DRIFT} In small population 1 the frequency of A rose from 0.50 to 1.00. Which statement is correct?`, ["A became fixed by chance; it need not give any advantage", "A must be the dominant allele of the gene", "A must give a selective advantage", "The individuals became homozygous during their lifetimes"], "The simulation has no selection, so the rise is genetic drift."),
    // ---- 3.3.7.2 (21 marks) ----
    mcq("c14", R2, S2(1), "Which of these is NOT a condition for the Hardy-Weinberg principle to apply?", ["The dominant allele is more common than the recessive allele", "Mating is random", "There is no migration into or out of the population", "There is no selection"], "The principle applies whatever the allele frequencies; the conditions are a large population, random mating, and no mutation, migration or selection."),
    short("c15", R2, S2(1), 3, "Explain why the Hardy-Weinberg principle would not be expected to apply to a population of 40 birds on an island that receives occasional migrants from the mainland.", [["The population is small, so genetic drift (chance) changes allele frequencies"], ["Migrants bring in alleles / change the allele frequencies"], ["So allele frequencies change between generations, against the prediction of the principle"]], "With only 40 birds, chance (genetic drift) changes allele frequencies from one generation to the next. Migrants from the mainland add their alleles. Both break conditions of the principle, so allele frequencies would not stay constant as it predicts."),
    gap("c16", R2, S2(2), 3, "Hypothetical data. 1 in 10 000 people in a population has an autosomal recessive condition.", "q = {{1}}. Frequency of carriers, as a decimal to 3 significant figures = {{2}}. Expected number of carriers in a town of 50 000 = {{3}}.", { 1: ["0.01", "1/100"], 2: ["0.0198"], 3: ["990", "989", "991"] }, "q² = 0.0001, q = 0.01, p = 0.99; 2pq = 2 × 0.99 × 0.01 = 0.0198; 0.0198 × 50 000 = 990."),
    short("c17", R2, S2(1, 2), 4, "Hypothetical data. In a snail, the shell-colour alleles Cᵞ and Cᴮ are codominant. A sample of 1 000 snails contains 490 CᵞCᵞ, 300 CᵞCᴮ and 210 CᴮCᴮ. Calculate the frequency of Cᵞ and the expected number of heterozygotes, and suggest what the difference between the observed and expected numbers shows.", [["Frequency of Cᵞ = (980 + 300) ÷ 2 000 = 0.64"], ["Expected heterozygotes = 2 × 0.64 × 0.36 × 1 000 = 461 (accept 460.8 or 460)"], ["Far fewer heterozygotes were observed than expected (300 compared with 461)"], ["This suggests a condition is not met, e.g. non-random mating (snails mating with others of their own colour) or selection against heterozygotes; it does not prove it"]], "Copies of Cᵞ = 2 × 490 + 300 = 1 280 of 2 000, so p = 0.64 and q = 0.36. Expected heterozygotes = 2pq × 1 000 = 0.4608 × 1 000 = 461. Only 300 were found, far fewer than expected, which suggests that a Hardy-Weinberg condition is broken, for example snails mating with snails of their own colour, or heterozygotes surviving less well."),
    mcq("c18", R2, S2(2), "19 % of a population show the dominant phenotype. What is the frequency of the dominant allele?", ["0.1", "0.44", "0.19", "0.9"], "q² = 1 − 0.19 = 0.81, q = 0.9, so p = 0.1. Square rooting 0.19 (0.44) is the common error."),
    gap("c19", R2, S2(2), 2, "In a population, p = 0.12.", "Give each frequency as a decimal. Frequency of individuals with the dominant phenotype = {{1}}. Frequency of heterozygotes = {{2}}.", { 1: ["0.2256", "0.226", "0.23"], 2: ["0.2112", "0.211", "0.21"] }, "q = 0.88; p² = 0.0144; 2pq = 2 × 0.12 × 0.88 = 0.2112; dominant phenotype = 0.0144 + 0.2112 = 0.2256."),
    short("c20", R2, S2(1, 2), 3, "A student finds that the genotype frequencies in one sample from a population fit p², 2pq and q² closely. She concludes that the population is not evolving. Evaluate her conclusion.", [["A close fit is consistent with Hardy-Weinberg equilibrium for this gene"], ["One sample at one time cannot show that allele frequencies stay the same between generations: samples from several generations are needed"], ["Only one gene was studied / small changes may not be detected / the sample may not represent the population"]], "The close fit is consistent with the population being in Hardy-Weinberg equilibrium for this gene. But evolution is a change in allele frequency over generations, and one sample cannot show that; she would need samples from several generations. She also studied only one gene, and a single sample may not be representative or may miss small changes."),
    gap("c21", R2, S2(2), 2, "Hypothetical data. 4 % of a population show a recessive phenotype.", "Percentage homozygous dominant = {{1}} %. Percentage heterozygous = {{2}} %.", { 1: P(64), 2: P(32) }, "q² = 0.04, q = 0.2, p = 0.8; p² = 0.64 (64 %); 2pq = 0.32 (32 %)."),
    short("c22", R2, S2(1, 2), 2, "Explain how the Hardy-Weinberg equation lets you estimate the frequency of carriers of a recessive condition, even though carriers cannot be identified from their phenotype.", [["The frequency of the recessive phenotype is q², so q (and p = 1 − q) can be found"], ["If the conditions apply, the frequency of heterozygotes (carriers) is 2pq"]], "Only homozygous recessive people show the condition, so its frequency is q², and q = √q², p = 1 − q. Assuming the Hardy-Weinberg conditions, carriers make up 2pq of the population."),
  ];
  const total = q.reduce((n, x) => n + x.marks, 0); if (total !== 45) console.warn("3.3.7 assessment marks", total);
  const by = (r) => q.filter((x) => x.ref === r).reduce((n, x) => n + x.marks, 0); if (by(R1) !== 24 || by(R2) !== 21) console.warn("3.3.7 marks by subsection", by(R1), by(R2));

  window.BIO.consolidation["3.3.7"] = {
    status: "draft",
    title: "Allele frequencies in populations",
    summaryHTML, conceptMap, deckIds, extraCards,
    assessment: { title: "3.3.7 Topic assessment", marks: 45, minutes: 55, intro: "Short and longer questions on populations, gene pools, selective breeding, genetic drift, bottlenecks and the Hardy-Weinberg equation, with data tables to interpret. All data are hypothetical or simulated", questions: q },
    diagnostics: { weakBelowPct: 70, strongAtPct: 85 },
  };
})();
