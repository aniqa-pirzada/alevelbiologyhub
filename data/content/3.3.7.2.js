// Authored content for 3.3.7.2 The Hardy-Weinberg principle and the Hardy-Weinberg equation (OxfordAQA 9610 v5.1,
// printed p.33; statements 3.3.7.2.s1, s2 in data/spec.js). Official wording: the principle "provides a mathematical
// model which predicts that allele frequencies will not change from generation to generation"; the conditions under
// which it applies; p² + 2pq + q² = 1, p "usually dominant", q "usually recessive"; calculate allele, genotype and
// phenotype frequencies from appropriate data.
// Phase 5 Batch 4, author C1. Model specification and answer key reviewed before building (scratchpad p5b4/C1-MODEL.md,
// review MR-C1). Interactives: hwCalculator, hwProblems, hwConditions (js/views/interactives-popgen.js; model
// B.popModel, checked by B.popModel.validate()). The calculator refuses the data of unanswered questions
// (B.popModel.LOCKS); the problem generator never produces those values.
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const R = "3.3.7.2";
  const S = (...n) => n.map((k) => `${R}.s${k}`);
  const Q = (k) => `q-${R}-${k}`;
  const mcq = (k, s, stem, options, explanation) => ({ id: Q(k), ref: R, stmts: S(...s), type: "mcq", marks: 1, stem, options, answer: 0, explanation });
  const short = (k, s, marks, stem, scheme, model, commonErrors) => ({ id: Q(k), ref: R, stmts: S(...s), type: "short", marks, stem: `${stem} (${marks} mark${marks > 1 ? "s" : ""})`, scheme: scheme.map(([point, m]) => ({ point, marks: m || 1 })), model, commonErrors });
  const gap = (k, s, marks, stem, text, answers, explanation) => ({ id: Q(k), ref: R, stmts: S(...s), type: "gap", marks, stem, text, answers, explanation });
  const P = (n) => [String(n), `${n}%`, `${n} %`];

  const SOURCES = `<p class="tiny muted"><strong>Sources</strong> (checked 18 November 2026): OxfordAQA International AS and A-level Biology (9610) specification v5.1, section 3.3.7.2. Cystic fibrosis frequency: MedlinePlus Genetics (US National Library of Medicine), "Cystic fibrosis", last updated 6 July 2021 (<a href="https://medlineplus.gov/genetics/condition/cystic-fibrosis" target="_blank" rel="noopener">medlineplus.gov</a>). OpenStax <em>Biology 2e</em> (2018), section 19.1, for the conditions at this level. All other populations and numbers are hypothetical, made up for practice.</p>`;
  const CF = `<p class="small"><strong>Real data.</strong> Cystic fibrosis is caused by recessive alleles of one autosomal gene. In the United States it affects 1 in 2 500 to 3 500 white newborns (MedlinePlus Genetics, last updated 6 July 2021). Use 1 in 2 500, treat all the cystic fibrosis alleles as one recessive allele, and assume that the Hardy-Weinberg conditions apply.</p>`;

  window.BIO.content[R] = {
    status: "draft",
    keywords: ["Hardy-Weinberg principle", "Hardy-Weinberg equation", "p + q = 1", "p² + 2pq + q² = 1", "allele frequency", "genotype frequency", "phenotype frequency", "carrier", "heterozygote", "large population", "random mating", "mutation", "migration", "selection", "model"],
    notes: () => `
<div class="notice"><strong>What the specification requires (3.3.7.2).</strong> Know that the <strong>Hardy-Weinberg principle</strong> is a mathematical model which predicts that <strong>allele frequencies will not change</strong> from generation to generation, and the <strong>conditions</strong> under which it applies. Use the <strong>Hardy-Weinberg equation</strong>, p² + 2pq + q² = 1, to calculate allele, genotype and phenotype frequencies from appropriate data.</div>

<h2 data-stmt="${R}.s1">1. The Hardy-Weinberg principle <span class="badge teal">required</span></h2>
<p>The <strong>Hardy-Weinberg principle</strong> is a <strong>mathematical model</strong>. It predicts that the <strong>allele frequencies</strong> of a gene in a population <strong>will not change from generation to generation</strong>, provided that these conditions apply:</p>
<ol><li>the population is <strong>large</strong> (so chance changes, genetic drift, are negligible);</li>
<li>mating is <strong>random</strong> (any individual is equally likely to mate with any other, whatever its genotype);</li>
<li>there is <strong>no mutation</strong> (no new alleles, no change of one allele into another);</li>
<li>there is <strong>no migration</strong> into or out of the population (no alleles gained or lost that way);</li>
<li>there is <strong>no selection</strong> (all genotypes are equally likely to survive and reproduce).</li></ol>
<p>Real populations rarely meet every condition exactly, which is why the principle is a <strong>model</strong>: it gives a baseline. If real allele or genotype frequencies differ from the prediction, this <strong>suggests</strong> (it does not prove) that one or more conditions are not met, for example that selection is acting.</p>

<h2 data-stmt="${R}.s2">2. Where the equation comes from <span class="badge teal">required</span></h2>
<p>For a gene with two alleles, let <strong>p</strong> be the frequency of one allele (usually the dominant allele, A) and <strong>q</strong> the frequency of the other (usually the recessive allele, a). These are the only two alleles, so</p>
<p style="text-align:center"><strong>p + q = 1</strong></p>
<p>With random mating, a gamete carries A with probability p and a with probability q. The probability of each genotype in the next generation is found by multiplying, as in a Punnett square:</p>
<ul><li>AA: p × p = <strong>p²</strong>;</li><li>Aa: A from the father and a from the mother, or the other way round: pq + pq = <strong>2pq</strong>;</li><li>aa: q × q = <strong>q²</strong>.</li></ul>
<p style="text-align:center"><strong>p² + 2pq + q² = 1</strong></p>
<p>The square shows this for p = 0.7 and q = 0.3.</p>
<p>Phenotypes: when A is dominant, the dominant phenotype is shown by AA and Aa, so its frequency is p² + 2pq (= 1 − q²); the recessive phenotype is shown only by aa, frequency q².</p>

<h2 data-stmt="${R}.s2">3. Using the equation <span class="badge teal">required</span></h2>
<p><strong>From the recessive phenotype.</strong> Only aa individuals show the recessive phenotype, so its frequency is q². This is the usual starting point.</p>
<p><em>Worked example.</em> 9 % of a population show a recessive phenotype. q² = 0.09, so q = √0.09 = 0.3 and p = 1 − 0.3 = 0.7. Heterozygotes (carriers) = 2pq = 2 × 0.7 × 0.3 = 0.42 (42 %); homozygous dominant = p² = 0.49 (49 %).</p>
<p><strong>From the dominant phenotype.</strong> The dominant phenotype includes AA and Aa, so never take its square root. First find the recessive phenotype frequency.</p>
<p><em>Worked example.</em> 91 % show the dominant phenotype. q² = 1 − 0.91 = 0.09, so q = 0.3 and p = 0.7 (as above). The tempting √0.91 = 0.95 is wrong.</p>
<p><strong>From genotype counts.</strong> When every genotype can be identified (codominant alleles, or a DNA test), find p by counting alleles, as in 3.3.7.1, then compare the observed numbers with p²N, 2pqN and q²N.</p>
<p><em>Worked example.</em> 49 AA, 42 Aa and 9 aa (N = 100): p = (98 + 42) ÷ 200 = 0.7. Expected: 0.49 × 100 = 49, 0.42 × 100 = 42, 0.09 × 100 = 9, the same as observed, which is consistent with the conditions being met for this gene.</p>
<p><strong>Rounding.</strong> Keep q unrounded (or to at least 3 significant figures) until the end; give the final answer to the number of significant figures asked for, or to 2 or 3.</p>
<p>Use the calculator to check your own working. You type q first; the table appears only after you have tried.</p>

<h2 data-stmt="${R}.s2">4. Practice problems <span class="badge teal">required</span></h2>
<p>Each problem is different. The feedback names the common mistakes: giving q² instead of q, square rooting the dominant phenotype frequency, using pq instead of 2pq for carriers, and dividing allele counts by N instead of 2N.</p>

<h2 data-stmt="${R}.s1">5. What happens when a condition is broken? <span class="badge teal">required</span></h2>
<ul><li><strong>Selection</strong> (for example aa individuals leave fewer offspring): the frequency of a falls. It falls more and more slowly as a becomes rare, because most a alleles are then in heterozygotes, which are not selected against.</li>
<li><strong>Migration</strong>: allele frequencies move towards those of the population the migrants come from.</li>
<li><strong>Mutation</strong>: new alleles appear, but mutation rates are so low that this changes allele frequencies only very slowly.</li>
<li><strong>Non-random mating</strong> (for example self-fertilisation in many plants, or animals choosing mates like themselves): allele frequencies may stay the same, but heterozygotes become rarer than 2pq, so genotype frequencies no longer fit p², 2pq and q².</li>
<li><strong>A small population</strong>: genetic drift changes allele frequencies by chance (the drift simulator on 3.3.7.1).</li></ul>
<p>Use the explorer to break one condition at a time.</p>

<h2 data-stmt="${R}.s1 ${R}.s2">6. Real data: carriers of cystic fibrosis <span class="badge teal">required</span></h2>
<p>The Hardy-Weinberg equation lets you estimate how many people are carriers, although carriers cannot be recognised from their phenotype. Check your understanding with real figures for cystic fibrosis.</p>

<h2 data-stmt="${R}.s1 ${R}.s2">7. Common errors <span class="badge teal">required</span></h2>
<ul><li><strong>Square rooting the dominant phenotype frequency.</strong> Find q² = 1 − (dominant frequency) first.</li>
<li><strong>Giving q² when asked for q</strong>, or halving q² instead of taking its square root.</li>
<li><strong>Using pq for carriers.</strong> Heterozygotes form in two ways: 2pq.</li>
<li><strong>Mixing percentages and frequencies.</strong> 9 % is a frequency of 0.09.</li>
<li><strong>"The data prove that selection is acting."</strong> A departure from the prediction only suggests that a condition is not met.</li>
<li><strong>Using the equation for one sample to say a population "is not evolving".</strong> That needs allele frequencies from several generations.</li></ul>
${SOURCES}`,
    diagrams: [
      { id: "d-3.3.7.2-1", title: "Where p² + 2pq + q² comes from", status: "draft", svg: window.BIO.popgenArt.gametePool(), caption: "With random mating, gametes combine at random. The sides of the square are divided in proportion to the allele frequencies (here p = 0.7 for A and q = 0.3 for a), so each area is the frequency of a genotype: AA p² = 0.49, Aa 2pq = 0.42 (two squares of pq = 0.21), aa q² = 0.09. The areas add up to 1.", alt: "A square divided into four rectangles. Its top edge is split into A (p = 0.7) and a (q = 0.3) for male gametes, its left edge the same for female gametes. The large square is AA, p squared, 0.49; two rectangles are Aa, pq, 0.21 each; the small square is aa, q squared, 0.09. A list beside it gives AA 0.49, Aa 0.42, aa 0.09, total 1.00." },
    ],
    interactives: [
      { kind: "hwCalculator", title: "Hardy-Weinberg Calculator", note: "Enter data from the recessive phenotype, the dominant phenotype or genotype counts. Work out q (or p) yourself first; then the full table appears.",
        questions: [
          gap("hc1", [2], 2, "Hypothetical data. 64 of 400 plants show the recessive phenotype.", "Give each as a decimal. q = {{1}}. p = {{2}}.", { 1: ["0.4", "0.40", "2/5"], 2: ["0.6", "0.60", "3/5"] }, "q² = 64 ÷ 400 = 0.16; q = √0.16 = 0.4; p = 1 − 0.4 = 0.6."),
          gap("hc2", [2], 2, "The same 400 plants (64 with the recessive phenotype).", "Percentage heterozygous = {{1}} %. Number of heterozygous plants = {{2}}.", { 1: P(48), 2: ["192"] }, "2pq = 2 × 0.6 × 0.4 = 0.48 = 48 %; 0.48 × 400 = 192."),
          mcq("hc3", [2], "75 % of a population show the dominant phenotype. What is the frequency of the recessive allele?", ["0.5", "0.87", "0.25", "0.75"], "q² = 1 − 0.75 = 0.25, so q = √0.25 = 0.5. Square rooting 0.75 (0.87) is the common error."),
        ] },
      { kind: "hwProblems", title: "Hardy-Weinberg Problem Generator", note: "Choose a type of problem or take any. Check your answer; the working appears after you have tried.",
        questions: [
          mcq("pg1", [2], "A student writes that the frequency of carriers is pq. What is wrong?", ["A heterozygote can form in two ways (A from the father and a from the mother, or the reverse), so the frequency is 2pq", "Carriers are homozygous recessive, so their frequency is q² and not pq", "The frequency of carriers is p + q, because a carrier has both alleles", "pq is correct, but only when the dominant allele is the rarer of the two"], "Aa can arise as A (father) with a (mother), probability pq, or a (father) with A (mother), another pq: 2pq."),
          mcq("pg2", [2], "q² = 0.01. A student writes q = 0.005. What has gone wrong?", ["They halved q² instead of taking its square root; q = 0.1", "They should have squared it instead, so q = 0.0001", "They should have subtracted it from 1, so q = 0.99", "Nothing has gone wrong: q = 0.005 is correct"], "q = √q² = √0.01 = 0.1."),
        ] },
      { kind: "hwConditions", title: "Hardy-Weinberg Conditions Explorer", note: "Break one condition at a time and watch the allele frequency (or, for non-random mating, the heterozygotes).",
        questions: [
          mcq("ce1", [1], "Choose \"All conditions met\" and start with half AA and half aa. What are the genotype frequencies after one generation?", ["0.25 AA, 0.5 Aa and 0.25 aa, with both allele frequencies still 0.5", "Still 0.5 AA, 0 Aa and 0.5 aa, because nothing has changed", "The frequency of A rises to 0.75 because A is dominant", "It takes many generations to reach 0.25, 0.5 and 0.25"], "One generation of random mating gives p², 2pq and q² from p = q = 0.5. The allele frequencies do not change."),
          mcq("ce2", [1], "With selection against aa, the frequency of a falls more slowly each generation. Why?", ["As a becomes rare, most a alleles are in heterozygotes, which are not selected against", "The a allele mutates back into the A allele more often as it becomes rare", "The population becomes smaller, so selection has less effect", "Selection stops working after the first generation"], "When q is small, q² (aa) is tiny compared with 2pq (Aa), so few a alleles are exposed to selection."),
          short("ce3", [1], 2, "With self-fertilisation the allele frequencies stay the same, but heterozygotes become rarer. Explain why the Hardy-Weinberg equation cannot then be used to work out genotype frequencies.", [["The equation assumes random mating / that gametes combine at random"], ["With self-fertilisation heterozygotes produce homozygous offspring, so heterozygotes are fewer than 2pq: genotype frequencies are not p², 2pq and q²"]], "The equation assumes random mating, so that gametes combine at random. When plants fertilise themselves, a quarter of a heterozygote's offspring are AA and a quarter aa, so the proportion of heterozygotes halves each generation and falls below 2pq, even though p and q do not change.", "Saying self-fertilisation changes the allele frequencies."),
          mcq("ce4", [1], "Migrants join the population every generation. What happens to its allele frequencies?", ["They move towards those of the population the migrants come from", "They stay the same, because migrants have the same alleles", "They move further away from those of the migrants", "Both allele frequencies become 0.5"], "Migration adds alleles in the migrants' proportions, so the population becomes more like the source."),
        ] },
      { kind: "checkpoint", title: "Cystic fibrosis carriers", intro: CF, qids: [Q("cf1"), Q("cf2"), Q("cf3")] },
    ],
    examFocus: `<ul>
<li><strong>Show every step:</strong> q² from the data; q = √q²; p = 1 − q; then the frequency asked for (2pq for carriers, p² + 2pq for the dominant phenotype).</li>
<li><strong>Start from the recessive phenotype</strong>, never from the dominant one.</li>
<li><strong>Units:</strong> say whether you give a frequency (0 to 1) or a percentage; multiply by the population size for numbers of individuals.</li>
<li><strong>Conditions:</strong> large population, random mating, no mutation, no migration, no selection. A departure suggests a condition is broken; name a likely one from the context.</li></ul>`,
    synoptic: [
      { ref: "3.3.7.1", text: "Allele frequencies are found by counting copies in the gene pool (2N)." },
      { ref: "3.3.6.2", text: "Punnett squares and multiplying probabilities." },
      { ref: "3.3.6.1", text: "Dominant, recessive and codominant alleles; carriers." },
      { ref: "3.3.8.1", text: "Evolution is a change in allele frequency: a departure from the Hardy-Weinberg prediction." },
    ],
    quickCheck: [
      mcq("qc1", [2], "In the Hardy-Weinberg equation, p + q = 1 means that:", ["The frequencies of the two alleles of the gene add up to 1", "p and q are always both equal to 0.5", "Every individual in the population is heterozygous", "p is always larger than q in any population"], "There are only two alleles, so their frequencies add up to 1."),
      mcq("qc2", [2], "In p² + 2pq + q² = 1, 2pq is:", ["The frequency of heterozygotes", "The frequency of the recessive allele", "The frequency of homozygous dominants", "The frequency of the dominant phenotype"], "2pq is the frequency of Aa."),
      mcq("qc3", [1], "Which is a condition for the Hardy-Weinberg principle to apply?", ["No migration into or out of the population", "A small population of a few individuals", "Selection in favour of the dominant allele", "Mating mostly between close relatives"], "Large population, random mating, no mutation, migration or selection."),
      mcq("qc4", [2], "q² = 0.49. What is q?", ["0.7", "0.245", "0.49", "0.3"], "q = √0.49 = 0.7."),
    ],
    flashcards: [
      { id: `f-${R}-1`, front: "The Hardy-Weinberg principle", back: "A mathematical model predicting that allele frequencies do not change from generation to generation, if its conditions apply." },
      { id: `f-${R}-2`, front: "Five conditions for the Hardy-Weinberg principle", back: "Large population; random mating; no mutation; no migration; no selection." },
      { id: `f-${R}-3`, front: "The two Hardy-Weinberg equations", back: "p + q = 1 (alleles); p² + 2pq + q² = 1 (genotypes)." },
      { id: `f-${R}-4`, front: "What do p², 2pq and q² stand for?", back: "Frequencies of homozygous dominant, heterozygous and homozygous recessive individuals." },
      { id: `f-${R}-5`, front: "Starting point for most Hardy-Weinberg calculations", back: "The recessive phenotype frequency = q²; then q = √q² and p = 1 − q." },
      { id: `f-${R}-6`, front: "Frequency of the dominant phenotype", back: "p² + 2pq, which equals 1 − q²." },
      { id: `f-${R}-7`, front: "Frequency of carriers of a recessive condition", back: "2pq." },
      { id: `f-${R}-8`, front: "91 % show the dominant phenotype: find q", back: "q² = 1 − 0.91 = 0.09, so q = 0.3. (Not √0.91.)" },
      { id: `f-${R}-9`, front: "Finding p from genotype counts", back: "p = (2 × AA + Aa) ÷ 2N, then compare observed numbers with p²N, 2pqN, q²N." },
      { id: `f-${R}-10`, front: "What does a departure from Hardy-Weinberg proportions show?", back: "It suggests, but does not prove, that a condition is not met (for example selection or non-random mating)." },
      { id: `f-${R}-11`, front: "Effect of selection against aa on q", back: "q falls, more and more slowly as most a alleles end up in heterozygotes." },
      { id: `f-${R}-12`, front: "Effect of non-random mating (self-fertilisation)", back: "Allele frequencies can stay the same, but heterozygotes fall below 2pq." },
      { id: `f-${R}-13`, front: "Why is Hardy-Weinberg called a model?", back: "It predicts what happens under ideal conditions, giving a baseline to compare with real populations." },
    ],
    questions: [
      // ---- checkpoint: cystic fibrosis ----
      gap("cf1", [2], 2, "Use 1 in 2 500 for the frequency of cystic fibrosis.", "Give each answer as a decimal. q = {{1}}. Frequency of carriers, 2pq, to 2 significant figures = {{2}}.", { 1: ["0.02", "0.020", "1/50"], 2: ["0.039", "0.0392"] }, "q² = 1 ÷ 2 500 = 0.0004, q = 0.02, p = 0.98; 2pq = 2 × 0.98 × 0.02 = 0.0392, about 1 in 25."),
      gap("cf2", [2], 1, "Use your carrier frequency.", "Expected number of carriers in 10 000 people = {{1}}", { 1: ["392", "391", "393", "390", "389"] }, "0.0392 × 10 000 = 392 (390 if you used 0.039)."),
      short("cf3", [1], 2, "Suggest why this calculation may not give the true frequency of carriers.", [["People with cystic fibrosis have historically had reduced survival or fewer children, so there is selection"], ["The population is not one randomly mating group / people of different ancestry live together / there is migration"], ["The frequency is given as a range (1 in 2 500 to 3 500), so q is uncertain"]], "The calculation assumes the Hardy-Weinberg conditions. But cystic fibrosis has reduced survival and reproduction in the past, which is selection; and people do not mate at random across one population, and they migrate. The incidence itself is a range, so q is uncertain. (Any 2.)", "Saying carriers cannot be counted, without linking to a condition."),
      // ---- Check yourself ----
      mcq("1", [1], "The Hardy-Weinberg principle predicts that:", ["Allele frequencies do not change from generation to generation", "The dominant allele becomes more common over time", "Genotypes are always in a ratio of 1 : 2 : 1", "Allele frequencies change by the same amount each generation"], "If the conditions apply, allele frequencies stay constant."),
      short("2", [1], 3, "Give three conditions under which the Hardy-Weinberg principle applies.", [["A large population"], ["Random mating"], ["No mutation"], ["No migration into or out of the population"], ["No selection: all genotypes are equally likely to survive and reproduce"]], "The population must be large, mating must be random, and there must be no mutation, no migration and no selection. (Any 3.)", "Giving 'no evolution' or 'a stable environment' as a condition."),
      mcq("3", [1], "In a large population the genotype frequencies differ from p², 2pq and q². Which conclusion is best?", ["One or more of the conditions may not be met, for example selection may be acting", "The Hardy-Weinberg equation has been shown to be wrong", "Selection is definitely acting on this gene", "The population must actually be very small"], "A departure suggests, but does not prove, that a condition is broken."),
      mcq("4", [1], "Why is the Hardy-Weinberg principle called a model?", ["It predicts what happens under ideal conditions, giving a baseline to compare with real populations", "It was first tested on a model organism such as the fruit fly", "It is a scale drawing of how the alleles are arranged in a population", "It describes exactly what happens in every real population"], "Real populations rarely meet every condition, so the principle is an idealised prediction."),
      gap("5", [2], 2, "In a population, p = 0.85.", "Give each frequency as a decimal. q = {{1}}. Frequency of homozygous dominant individuals = {{2}}.", { 1: ["0.15", "3/20"], 2: ["0.7225", "0.72", "0.723"] }, "q = 1 − 0.85 = 0.15; p² = 0.85² = 0.7225."),
      gap("5b", [2], 2, "Hypothetical data. 200 snails were tested: 50 BB, 100 Bb and 50 bb.", "Expected number of Bb if the population is in Hardy-Weinberg equilibrium = {{1}}. Observed minus expected = {{2}}.", { 1: ["100"], 2: ["0"] }, "p = (2 × 50 + 100) ÷ 400 = 0.5; 2pq × 200 = 2 × 0.5 × 0.5 × 200 = 100; 100 − 100 = 0."),
      gap("6", [2], 3, "Hypothetical data. 720 of 2 000 people show the recessive phenotype.", "q, as a decimal = {{1}}. Number heterozygous = {{2}}. Number homozygous dominant = {{3}}.", { 1: ["0.6", "0.60", "3/5"], 2: ["960"], 3: ["320"] }, "q² = 720 ÷ 2 000 = 0.36; q = 0.6, p = 0.4; 2pq × 2 000 = 0.48 × 2 000 = 960; p² × 2 000 = 0.16 × 2 000 = 320 (320 + 960 + 720 = 2 000)."),
      short("7", [2], 3, "Hypothetical data. 1 in 400 people has an autosomal recessive condition. Calculate the percentage of people who are carriers. Show your working.", [["q² = 1 ÷ 400 = 0.0025, so q = 0.05"], ["p = 1 − 0.05 = 0.95"], ["2pq = 2 × 0.95 × 0.05 = 0.095 = 9.5 %"]], "q² = 1 ÷ 400 = 0.0025, so q = √0.0025 = 0.05 and p = 0.95. Carriers = 2pq = 2 × 0.95 × 0.05 = 0.095, which is 9.5 %.", "Giving pq (4.75 %) or q (5 %)."),
      mcq("8", [2], "Which expression gives the frequency of the dominant phenotype?", ["p² + 2pq", "p²", "2pq", "p + q"], "AA (p²) and Aa (2pq) both show the dominant phenotype."),
      gap("9", [2], 2, "Hypothetical data. The M and N blood group alleles are codominant. Of 500 people, 145 are MM, 250 are MN and 105 are NN.", "Frequency of M, as a decimal = {{1}}. Expected number of MN = {{2}}.", { 1: ["0.54", "27/50"], 2: ["248", "248.4"] }, "Copies of M = 2 × 145 + 250 = 540 of 1 000, so p = 0.54 and q = 0.46. Expected MN = 2 × 0.54 × 0.46 × 500 = 248.4."),
      short("10", [1, 2], 2, "For the same 500 people, compare the observed number of MN with the expected number and say what this suggests.", [["The observed number (250) is very close to the expected number (248)"], ["This is consistent with the Hardy-Weinberg conditions being met for this gene (e.g. random mating with respect to blood group), but it does not prove it"]], "250 MN people were observed and about 248 expected, so the numbers agree closely. This is consistent with the population being in Hardy-Weinberg equilibrium for this gene, for example mating at random with respect to blood group, though it does not prove that every condition is met.", "Saying the data 'prove' Hardy-Weinberg."),
      mcq("11", [2], "Why is p usually found as 1 − q rather than from the number of people with the dominant phenotype?", ["People with the dominant phenotype may be AA or Aa, so p² cannot be counted from phenotypes", "Dominant alleles are always rare, so they are hard to count", "p can never be larger than q, so it must be worked out from q", "The dominant phenotype cannot be seen in most populations"], "Only the recessive phenotype identifies one genotype (aa), so start from q²."),
      short("12", [1, 2], 4, "Hypothetical data. In a large population of a beetle, green (G) is dominant to brown (g). In 2000, 64 % of the beetles were brown; in 2010, 36 % were brown. Calculate the change in the frequency of allele G, and suggest what this shows.", [["2000: q = √0.64 = 0.8, so p = 0.2"], ["2010: q = √0.36 = 0.6, so p = 0.4"], ["The frequency of G rose by 0.2 (it doubled)"], ["The allele frequency changed, so a Hardy-Weinberg condition is probably not met, e.g. selection in favour of green beetles, or migration (this suggests, it does not prove)"]], "In 2000 q² = 0.64, so q = 0.8 and p = 0.2. In 2010 q² = 0.36, so q = 0.6 and p = 0.4. The frequency of G rose by 0.2. Because the principle predicts no change, this suggests a condition is not met: perhaps green beetles survived or reproduced better (selection), or green beetles migrated in.", "Using √(dominant percentage) or giving the change in q only."),
      mcq("13", [1], "Which population is least likely to meet the Hardy-Weinberg conditions?", ["An island population of 30 birds", "A large population that mates at random", "A large population with no migration", "A large population whose genotypes survive equally well"], "A population of 30 is small, so genetic drift changes allele frequencies by chance."),
    ],
  };
})();
