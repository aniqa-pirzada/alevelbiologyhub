// Authored content for 3.3.7.1 Principles and applications (OxfordAQA 9610 v5.1, printed p.33; statements 3.3.7.1.s1 to
// s5 in data/spec.js). Official wording: population "a group of potentially interbreeding organisms of the same species
// occupying a particular space at a particular time"; gene pool; allele frequency; selection for high-yielding breeds of
// domesticated animals and cultivated plants; genetic bottlenecks; genetic drift ("when there are few copies of an
// allele, the effect of genetic drift is larger").
// Phase 5 Batch 4, author C1. Model specification and answer key reviewed before building (scratchpad p5b4/C1-MODEL.md,
// review MR-C1). Interactives: genePoolExplorer, selectiveBreeding, driftSimulator, bottleneckChallenge
// (js/views/interactives-popgen.js; model B.popModel in data/content/_popgen-model.js, checked by B.popModel.validate()).
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const R = "3.3.7.1";
  const S = (...n) => n.map((k) => `${R}.s${k}`);
  const Q = (k) => `q-${R}-${k}`;
  const mcq = (k, s, stem, options, explanation) => ({ id: Q(k), ref: R, stmts: S(...s), type: "mcq", marks: 1, stem, options, answer: 0, explanation });
  const short = (k, s, marks, stem, scheme, model, commonErrors) => ({ id: Q(k), ref: R, stmts: S(...s), type: "short", marks, stem: `${stem} (${marks} mark${marks > 1 ? "s" : ""})`, scheme: scheme.map(([point, m]) => ({ point, marks: m || 1 })), model, commonErrors });
  const gap = (k, s, marks, stem, text, answers, explanation) => ({ id: Q(k), ref: R, stmts: S(...s), type: "gap", marks, stem, text, answers, explanation });
  const PCT = (n) => [String(n), `${n}%`, `${n} %`];

  const SOURCES = `<p class="tiny muted"><strong>Sources</strong> (checked 18 November 2026): OxfordAQA International AS and A-level Biology (9610) specification v5.1, section 3.3.7.1. Northern elephant seal: Hoelzel, A. R. et al. (2024) "Genomics of post-bottleneck recovery in the northern elephant seal", <em>Nature Ecology &amp; Evolution</em> 8, 686 to 694, doi:10.1038/s41559-024-02337-4 (<a href="https://link.springer.com/10.1038/s41559-024-02337-4" target="_blank" rel="noopener">link.springer.com</a>). Illinois maize experiment: Dudley, J. W. (2007) <em>Crop Science</em> 47(S3), S20 to S31. The herds, the snail and fish examples, the oil-content table and every simulation are hypothetical, made up for practice.</p>`;

  const OIL = `<table class="tbl"><thead><tr><th>Generation</th><th>Selected line: mean oil content / % of dry mass</th><th>Control line (not selected): mean oil content / % of dry mass</th></tr></thead><tbody>
<tr><td>0</td><td>5.0</td><td>5.0</td></tr><tr><td>5</td><td>6.4</td><td>5.1</td></tr><tr><td>10</td><td>7.9</td><td>4.9</td></tr><tr><td>15</td><td>9.1</td><td>5.0</td></tr><tr><td>20</td><td>10.2</td><td>5.1</td></tr></tbody></table>
<p class="tiny muted">Hypothetical data. In the selected line the maize plants with the highest oil content in their kernels were used as parents every generation; the control line was grown in the same fields from parents chosen at random.</p>`;

  window.BIO.content[R] = {
    status: "draft",
    keywords: ["population", "gene pool", "allele frequency", "allele copies", "2N", "selective breeding", "artificial selection", "high-yielding", "genetic diversity", "genetic bottleneck", "genetic drift", "chance", "fixed allele", "lost allele"],
    notes: () => `
<div class="notice"><strong>What the specification requires (3.3.7.1).</strong> Know what a <strong>population</strong> is in population genetics, the meaning of <strong>gene pool</strong> and <strong>allele frequency</strong>, the influence of <strong>selection for high-yielding breeds</strong> of domesticated animals and cultivated plants, how <strong>genetic bottlenecks</strong> reduce the gene pool, and how <strong>genetic drift</strong> changes allele frequencies by chance, with a larger effect when there are few copies of an allele.</div>

<h2 data-stmt="${R}.s1">1. Populations <span class="badge teal">required</span></h2>
<p>In population genetics a <strong>population</strong> is a group of <strong>potentially interbreeding</strong> organisms of the <strong>same species</strong> occupying a <strong>particular space</strong> at a <strong>particular time</strong>.</p>
<ul><li><strong>Potentially interbreeding:</strong> any member could, in principle, mate with any other member of the opposite sex and pass on its alleles.</li>
<li><strong>Same species:</strong> two species in one pond are two populations, not one.</li>
<li><strong>Particular space and time:</strong> snails of one species in two ponds 50 km apart cannot meet, so they are two populations, each with its own alleles.</li></ul>
<p>This is close to the ecological meaning you met in 3.3.1.1 (all the organisms of one species in a habitat), but it adds the idea of interbreeding, because population genetics follows alleles from one generation to the next.</p>

<h2 data-stmt="${R}.s2">2. Gene pool and allele frequency <span class="badge teal">required</span></h2>
<p>The <strong>gene pool</strong> is the complete set of alleles for a gene in a single population. A diploid organism has two copies of each autosomal gene, one on each chromosome of a homologous pair (3.3.6.1), so a population of <strong>N</strong> individuals has <strong>2N copies</strong> of the gene in its gene pool.</p>
<p><strong>Allele frequency</strong> is the fraction of the copies of the gene in the gene pool that are a particular allele. The frequencies of all the alleles of a gene add up to 1.</p>
<p><strong>Worked example.</strong> 100 plants are tested: 49 are AA, 42 are Aa and 9 are aa.</p>
<ul><li>Copies of the gene in the gene pool = 2 × 100 = 200.</li>
<li>Copies of A = (2 × 49) + 42 = 140, so the frequency of A = 140 ÷ 200 = 0.7.</li>
<li>Copies of a = 42 + (2 × 9) = 60, so the frequency of a = 60 ÷ 200 = 0.3. Check: 0.7 + 0.3 = 1.</li></ul>
<p>The commonest mistake is to divide by the number of individuals instead of the number of copies. Practise with the herds in the explorer.</p>

<h2 data-stmt="${R}.s3 ${R}.s4 ${R}.s5">3. What changes allele frequencies? <span class="badge teal">required</span></h2>
<p>Allele frequencies in a gene pool change from one generation to the next when some individuals pass on more of their alleles than others, or when chance decides which alleles are passed on. On this page you meet three causes:</p>
<ul><li><strong>selection by breeders</strong> for high-yielding animals and plants (section 4);</li>
<li><strong>genetic drift</strong>, change by chance, strongest when there are few copies of an allele (section 5);</li>
<li><strong>genetic bottlenecks</strong>, a severe fall in population size that removes much of the gene pool (section 6).</li></ul>
<p>Mutation and migration also change allele frequencies (3.3.7.2). A change in allele frequency is the basis of evolution (3.3.8.1). <strong>Individuals do not evolve:</strong> an individual's alleles are set at fertilisation; the frequencies change in the population.</p>

<h2 data-stmt="${R}.s3">4. Selective breeding for high yield <span class="badge teal">required</span></h2>
<p>For thousands of years farmers have chosen which animals and plants to breed from. This is <strong>selective breeding</strong> (artificial selection). To produce a <strong>high-yielding breed</strong>, for example dairy cattle that give more milk or wheat with more grain:</p>
<ol><li>choose the individuals with the highest yields (for cattle, cows with the highest milk yields, and bulls whose mothers or daughters had high yields, because a bull produces no milk);</li>
<li>breed them together;</li>
<li>choose the highest-yielding offspring and breed from them; repeat for many generations.</li></ol>
<p>Each generation the chosen parents pass on the alleles that increase yield, so <strong>the frequency of these alleles in the gene pool increases</strong>. Yield usually depends on many genes and on the environment, so progress is gradual.</p>
<p><strong>Limits and costs.</strong> When the alleles for high yield become <strong>fixed</strong> (frequency 1) there is no genetic variation left for this characteristic, and yield stops rising; remaining differences are caused by the environment. Breeding from few individuals <strong>reduces genetic diversity</strong>: other alleles become rare or are lost, so a breed may lack alleles that would give resistance to a new disease or help it cope with a change in conditions. With very few parents, even a high-yield allele can occasionally be lost by chance (genetic drift, section 5).</p>
<p><strong>A real example.</strong> In the Illinois long-term selection experiment, begun in 1896 at the University of Illinois, maize has been selected for high and for low oil content in its kernels for more than 100 generations, and the high and low lines have kept moving apart (Dudley, 2007).</p>
<p>Try the explorer: breed from the top 10 % and then from all the plants, and compare.</p>
<p>Check your understanding with the oil-content data.</p>

<h2 data-stmt="${R}.s5">5. Genetic drift <span class="badge teal">required</span></h2>
<p><strong>Genetic drift</strong> is a change in the frequency of alleles in a population due to <strong>chance</strong>. Chance decides which individuals survive and reproduce and which of each parent's two alleles goes into each gamete, so the alleles of the next generation are a random sample of the alleles of this one.</p>
<ul><li>Drift has <strong>no direction</strong>: an allele may rise or fall, whether it is useful or not.</li>
<li>When there are <strong>few copies</strong> of an allele, the effect of drift is <strong>larger</strong>. Losing or gaining a few copies is a large share of the total, so the frequency can change a lot in one generation. This is why drift matters most in <strong>small populations</strong>, and for a new allele that has just arisen by mutation.</li>
<li>An allele can be <strong>lost</strong> (frequency 0) or become <strong>fixed</strong> (frequency 1). Once lost, it can return only by mutation or migration.</li></ul>
<p>Run the simulator with 10 individuals and then with 500. Then start from a single copy in a population of 500.</p>

<h2 data-stmt="${R}.s4">6. Genetic bottlenecks <span class="badge teal">required</span></h2>
<p>A <strong>genetic bottleneck</strong> is a <strong>severe reduction in population size</strong> caused by an environmental event (such as a flood, a volcanic eruption or a very cold winter) or by human activity (such as hunting or habitat destruction). It <strong>reduces the gene pool</strong> of the population.</p>
<ul><li>Only the survivors' alleles are passed on. Alleles carried by none of the survivors are lost, so <strong>genetic diversity falls</strong>. Rare alleles are the most likely to be lost, but which alleles are lost is a matter of chance.</li>
<li>Even when no allele is lost, the survivors' allele frequencies differ by chance from those of the original population.</li>
<li>While the population is small, genetic drift continues to change allele frequencies. When the population grows again, its diversity <strong>stays low</strong>, because lost alleles return only through mutation (rare) or migration.</li></ul>
<p><strong>Real data: the northern elephant seal.</strong> Hunting between the early 1800s and 1892 reduced the northern elephant seal to an estimated 20 individuals. Today there are over 200 000, breeding on the Pacific coast of North America, including at Año Nuevo, California, USA. Their genetic diversity is lower than that of southern elephant seals, a sibling species that did not go through a similar bottleneck (Hoelzel and others, 2024).</p>
<p>Take the bottleneck challenge: predict how many alleles survive, then run it.</p>

<h2 data-stmt="${R}.s1 ${R}.s2 ${R}.s3 ${R}.s4 ${R}.s5">7. Common misconceptions <span class="badge teal">required</span></h2>
<ul><li><strong>"Allele frequency = number of individuals with the allele ÷ number of individuals."</strong> Count allele copies and divide by 2N.</li>
<li><strong>"The gene pool is all the genes of an individual."</strong> It is all the alleles of a gene in a population.</li>
<li><strong>"Genetic drift removes harmful alleles."</strong> Drift is chance: it can remove a useful allele or fix a harmful one.</li>
<li><strong>"A bottleneck always removes a particular allele."</strong> Which alleles are lost depends on which individuals survive.</li>
<li><strong>"Selected animals change their alleles."</strong> Individuals do not change their alleles; the frequencies in the next generation change.</li></ul>
${SOURCES}`,
    diagrams: [],
    interactives: [
      { kind: "genePoolExplorer", title: "Gene Pool Explorer", note: "Choose a herd. Count the animals and the allele copies, then work out each allele frequency. The answer appears only after you have tried.",
        questions: [
          mcq("gp1", [2], "A population has 50 diploid individuals. How many copies of one autosomal gene are in its gene pool?", ["100", "50", "25", "200"], "Each individual has two copies of the gene, one on each chromosome of a homologous pair: 2 × 50 = 100."),
          gap("gp2", [2], 2, "Hypothetical herd of 25 cattle: 9 red (CᴿCᴿ), 12 roan (CᴿCᵂ) and 4 white (CᵂCᵂ).", "Copies of Cᴿ = {{1}}. Frequency of Cᴿ, as a decimal = {{2}}.", { 1: ["30"], 2: ["0.6", "0.60", "3/5"] }, "Copies of Cᴿ = 2 × 9 + 12 = 30; copies of the gene = 2 × 25 = 50; 30 ÷ 50 = 0.6."),
          mcq("gp3", [2], "A student calculates the frequency of Cᴿ by dividing the number of Cᴿ alleles by the number of animals. Why is this wrong?", ["Each animal carries two copies of the gene, so the gene pool has twice as many copies as animals", "Only the homozygous animals should be counted, because roan animals have mixed alleles", "The number of alleles should be divided by the number of genotypes, which is three", "Roan animals do not carry the Cᴿ allele, so they should not be counted at all"], "Allele frequency = copies of the allele ÷ copies of the gene (2N)."),
        ] },
      { kind: "selectiveBreeding", title: "Selective Breeding Explorer", note: "Choose how strongly to select, breed for 10 generations, then compare with no selection.",
        questions: [
          mcq("sb1", [3], "In the first few generations, breeding from the top 10 % raised yield faster than breeding from the top 50 %. Why?", ["Only the highest yielders, which tended to carry most high-yield alleles, became parents", "Choosing fewer parents caused new mutations that increased yield in their offspring", "The plants chosen as parents were grown in better conditions than the other plants", "The chosen plants changed their own alleles during their lives to give more grain"], "Yield depends partly on the environment, so the best plants are not always the ones with the most high-yield alleles; but on average they are, and the stronger the selection, the faster those alleles increase."),
          short("sb2", [3], 2, "After many generations of strong selection, mean yield stopped increasing. Explain why.", [["The alleles for high yield have become fixed (frequency 1) / the alleles for low yield have been lost"], ["There is no genetic variation left for selection to act on; remaining differences in yield are caused by the environment"]], "Strong selection has raised the frequency of the high-yield alleles until they are fixed, so every plant has the same alleles for these genes. There is no genetic variation left, so choosing the best plants no longer changes the allele frequencies; the differences that remain are caused by growing conditions.", "Saying the plants 'cannot grow any bigger' without mentioning alleles or variation."),
          mcq("sb3", [3], "Why may a highly selected crop variety be more at risk from a new disease?", ["Its gene pool has less genetic diversity, so it may lack alleles that give resistance", "Selective breeding makes the plants produce fewer chemicals that defend them", "High-yielding plants carry many more harmful mutations than other plants do", "Breeders choose plants that carry alleles which cause disease in the crop"], "Breeding from a few high-yielding plants removes many alleles from the gene pool, possibly including alleles for resistance."),
        ] },
      { kind: "checkpoint", title: "Selection for oil content", intro: OIL, qids: [Q("ch1"), Q("ch2"), Q("ch3")] },
      { kind: "driftSimulator", title: "Genetic Drift Simulator", note: "Choose a population size and a starting frequency, then run several times. Try 10 individuals, then 500; then start from 1 copy.",
        questions: [
          mcq("dr1", [5], "Six runs with 10 individuals and the same starting frequency ended differently: in some the allele was fixed, in others lost. What does this show?", ["Changes in allele frequency in a small population are due to chance, so their direction cannot be predicted", "The allele that became fixed must have given the individuals carrying it an advantage", "Each of the runs was started with a different frequency of the allele", "Genetic drift always removes the less common allele from the population"], "The model has no selection: the only cause of change is chance, so identical starts give different results."),
          mcq("dr2", [5], "Compared with a population of 500, what happens in a population of 10?", ["Allele frequencies change more between generations, and alleles are fixed or lost sooner", "Allele frequencies stay closer to their starting values from one generation to the next", "Alleles are never lost, because every individual has two copies of the gene", "The dominant allele always becomes fixed within a few generations"], "With only 20 copies of the gene, the chance loss or gain of a few copies is a large change in frequency."),
          short("dr3", [5], 2, "Once an allele has been lost in the simulator, its frequency stays at 0. Explain why.", [["No copies of the allele remain to be passed on to the next generation"], ["The model has no mutation or migration, the only ways the allele could return"]], "When the frequency reaches 0 there are no copies left, so no gamete can carry the allele. In a real population the allele could come back only by mutation or by migration from another population, and the model includes neither.", "Saying the allele is 'recessive' or 'selected against'."),
          mcq("dr4", [5], "A new allele arises by mutation in a population of 500 (1 copy among 1000). In the simulator it is often lost within a few generations. Why?", ["With only one copy, chance alone can easily stop it being passed on", "New alleles are always harmful, so selection removes them quickly", "A new allele is always recessive, so it is never inherited by offspring", "Large populations remove rare alleles by natural selection every generation"], "When an allele has few copies, drift has its largest effect: in this model the chance that the single copy is not passed on to the very next generation is about 0.37."),
        ] },
      { kind: "bottleneckChallenge", title: "Bottleneck Challenge", note: "Choose how many individuals survive and predict how many of the six alleles they keep. Then run, recover and run 20 times.",
        questions: [
          mcq("bn1", [4], "When the population fell to 5 individuals, which alleles were most often lost?", ["The rarest alleles, because few copies were there to be carried by the survivors", "The commonest alleles, because more of the individuals carried them", "The recessive alleles, because they are not expressed in heterozygotes", "The alleles that reduce survival, because the survivors were the fittest"], "The survivors are a chance sample: an allele with few copies is the most likely to be missed."),
          gap("bn2", [4], 1, "Ten individuals survive from a population in which this gene has 50 different alleles.", "The greatest number of different alleles of this gene that the survivors can carry is {{1}}.", { 1: ["20", "twenty"] }, "Ten diploid individuals carry 20 copies of the gene, so at most 20 different alleles."),
          short("bn3", [4], 2, "After the bottleneck the population grows back to 500. Explain why its genetic diversity does not recover.", [["The offspring inherit only the survivors' alleles / lost alleles cannot come back through breeding"], ["New alleles arise only by mutation, which is rare, or by migration from another population"]], "Every individual in the new population descends from the survivors, so it can only inherit the alleles they carried. Alleles that were lost come back only if they arise again by mutation, which is rare, or arrive with migrants.", "Saying the population 'needs time to recover its alleles'."),
        ] },
    ],
    examFocus: `<ul>
<li><strong>Definitions:</strong> population (potentially interbreeding, same species, particular space and time); gene pool (complete set of alleles for a gene in a population); allele frequency (fraction of the copies that are one allele).</li>
<li><strong>Counting:</strong> show 2N; count two copies for each homozygote and one of each allele for each heterozygote; check that the frequencies add up to 1.</li>
<li><strong>Selective breeding:</strong> breeders choose the parents; alleles for the desired characteristic increase in frequency; diversity falls.</li>
<li><strong>Drift and bottlenecks:</strong> use the word <em>chance</em>; explain the effect of few copies; say that lost alleles return only by mutation or migration.</li></ul>`,
    synoptic: [
      { ref: "3.3.1.1", text: "The ecological definition of a population." },
      { ref: "3.1.11.1", text: "Genetic diversity and how it is measured; bottlenecks reduce it." },
      { ref: "3.3.6.1", text: "Diploid organisms carry two alleles of each gene." },
      { ref: "3.2.11.1", text: "New alleles arise by gene mutation." },
      { ref: "3.3.7.2", text: "The Hardy-Weinberg principle predicts constant allele frequencies when nothing changes them." },
      { ref: "3.3.8.1", text: "Evolution is a change in allele frequency." },
    ],
    quickCheck: [
      mcq("qc1", [1], "In population genetics, a population is best described as:", ["A group of potentially interbreeding organisms of one species in one place at one time", "All the organisms of every species that live together in one habitat", "A group of organisms that all have the same genotype for a gene", "All the members of one species, wherever in the world they live"], "Same species, potentially interbreeding, particular space and time."),
      mcq("qc2", [2], "How many copies of one autosomal gene are in the gene pool of 30 diploid individuals?", ["60", "30", "15", "90"], "Two copies per individual: 2 × 30."),
      mcq("qc3", [5], "Genetic drift has its largest effect on:", ["An allele present in few copies", "An allele present in many copies", "A dominant allele in any population", "An allele under strong selection"], "With few copies, chance changes are a large share of the total."),
      mcq("qc4", [4], "A genetic bottleneck:", ["Reduces the diversity of the gene pool", "Increases the number of different alleles", "Removes only the harmful alleles", "Has no effect on allele frequencies"], "Only the survivors' alleles remain."),
    ],
    flashcards: [
      { id: `f-${R}-1`, front: "Population (population genetics)", back: "A group of potentially interbreeding organisms of the same species occupying a particular space at a particular time." },
      { id: `f-${R}-2`, front: "Gene pool", back: "The complete set of alleles for a gene in a single population." },
      { id: `f-${R}-3`, front: "Allele frequency", back: "The fraction of the copies of a gene in the gene pool that are a particular allele." },
      { id: `f-${R}-4`, front: "Copies of a gene in N diploid individuals", back: "2N: two copies per individual, one on each chromosome of a homologous pair." },
      { id: `f-${R}-5`, front: "Frequency of A from counts of AA, Aa and aa", back: "(2 × AA + Aa) ÷ 2N." },
      { id: `f-${R}-6`, front: "Selective breeding for high yield", back: "Breed from the highest-yielding individuals for many generations; alleles for high yield increase in frequency." },
      { id: `f-${R}-7`, front: "A cost of selective breeding", back: "Reduced genetic diversity: a breed may lack alleles for resistance to a new disease." },
      { id: `f-${R}-8`, front: "Why does selection for yield eventually stop working?", back: "The high-yield alleles become fixed, so there is no genetic variation left to select." },
      { id: `f-${R}-9`, front: "Genetic drift", back: "A change in allele frequency in a population due to chance." },
      { id: `f-${R}-10`, front: "When is genetic drift strongest?", back: "When there are few copies of an allele, for example in a small population or for a new mutation." },
      { id: `f-${R}-11`, front: "Fixed and lost alleles", back: "Fixed: frequency 1 (the only allele left). Lost: frequency 0." },
      { id: `f-${R}-12`, front: "Genetic bottleneck", back: "A severe reduction in population size, caused by an environmental event or human activity, that reduces the gene pool." },
      { id: `f-${R}-13`, front: "Why does diversity stay low after a bottleneck?", back: "The population descends from the survivors; lost alleles return only by mutation or migration." },
      { id: `f-${R}-14`, front: "Example of a bottleneck", back: "Northern elephant seal: hunting reduced it to an estimated 20 by 1892; now over 200 000 with low diversity." },
    ],
    questions: [
      // ---- checkpoint: selection for oil content ----
      gap("ch1", [3], 1, "Use the table of oil content.", "Percentage increase in mean oil content of the selected line from generation 0 to generation 20 = {{1}} %", { 1: PCT(104) }, "(10.2 − 5.0) ÷ 5.0 × 100 = 104 %."),
      mcq("ch2", [3], "Why was the control line, which was not selected, grown in the same fields?", ["To show that the increase was caused by selection, not by differences in growing conditions between years", "To provide pollen for the plants of the selected line so that they could be fertilised", "To measure how quickly new mutations for high oil content arise in maize plants", "To make the measurements of oil content in the selected line more precise"], "The control line's oil content stays about 5 %, so the rise in the selected line is not caused by the weather or the soil."),
      short("ch3", [3], 2, "Explain the increase in oil content of the selected line in terms of alleles.", [["Plants with the highest oil content were chosen as parents each generation"], ["They passed on alleles that increase oil content, so the frequency of these alleles in the gene pool increased"]], "In each generation only the plants with the most oil were used as parents. They passed on the alleles that increase oil content, so these alleles became more frequent in the gene pool of the selected line, and its mean oil content rose.", "Writing about 'genes for oil' without saying that allele frequencies change."),
      // ---- Check yourself ----
      mcq("1", [1], "Which of these is a population in the sense used in population genetics?", ["All the Arctic char (a fish) in one lake in 2025", "All the fish species living in one lake in 2025", "All the Arctic char in every lake in the world", "All the male Arctic char in one lake in 2025"], "One species, able to interbreed, in one place at one time. Males alone cannot interbreed with each other."),
      short("2", [1], 2, "Snails of one species live in two ponds 50 km apart. Explain why they are two populations, not one.", [["A population occupies a particular space at a particular time / the ponds are different spaces"], ["Snails in different ponds cannot meet to interbreed, so they do not share one gene pool"]], "A population is a group of potentially interbreeding organisms in a particular space. The snails in the two ponds cannot meet, so they cannot interbreed with each other; each pond has its own gene pool.", "Saying they are different species."),
      mcq("3", [2], "What is a gene pool?", ["The complete set of alleles for a gene in a population", "All of the genes found in the cells of one individual", "The alleles found in the gametes of one individual", "The number of different genotypes in a population"], "Gene pool: all the alleles of one gene in one population."),
      mcq("4", [2], "What is meant by allele frequency?", ["The proportion of all the copies of a gene in the gene pool that are a particular allele", "The proportion of the individuals in a population that show the dominant phenotype", "The number of individuals in a population that are homozygous for the allele", "The number of different alleles of the gene that are found in the population"], "Count copies of the allele and divide by the copies of the gene (2N)."),
      gap("5", [2], 2, "Hypothetical data. 200 snails were tested: 72 were BB, 96 were Bb and 32 were bb.", "Copies of b in the gene pool = {{1}}. Frequency of b, as a decimal = {{2}}.", { 1: ["160"], 2: ["0.4", "0.40", "2/5"] }, "Copies of b = 96 + 2 × 32 = 160; copies of the gene = 2 × 200 = 400; 160 ÷ 400 = 0.4."),
      mcq("6", [2], "A gene has three alleles in a population, with frequencies 0.5, 0.3 and x. What is x?", ["0.2", "0.8", "0.15", "0.5"], "The frequencies of all the alleles of a gene add up to 1: 1 − 0.5 − 0.3 = 0.2."),
      short("7", [3], 3, "Describe how farmers could use selective breeding to produce a high-yielding breed of dairy cattle.", [["Choose the cows with the highest milk yields, and bulls whose mothers or daughters had high milk yields"], ["Breed these cows and bulls together"], ["Choose the highest-yielding offspring and breed from them, repeating for many generations"], ["The frequency of alleles for high milk yield in the gene pool increases"]], "Farmers choose the cows that give the most milk and bulls whose mothers or daughters gave a lot of milk, and breed them together. From the calves they again choose the highest yielders as parents, and repeat this over many generations, so alleles for high milk yield become more frequent in the herd. (Maximum 3 marks.)", "Forgetting that bulls are chosen from the yields of their relatives."),
      mcq("8", [3], "What does selective breeding change in a population?", ["The frequencies of the alleles that affect the selected characteristic", "The alleles of the selected individuals during their lifetime", "The number of genes that each individual has in its cells", "Only the phenotypes of the offspring, not their alleles"], "Breeders choose which individuals pass on their alleles, so allele frequencies change between generations."),
      mcq("9", [4], "What is a genetic bottleneck?", ["A severe fall in population size that reduces the genetic diversity of the gene pool", "A gradual rise in population size that increases the amount of interbreeding", "The choice of the most useful individuals as parents by animal breeders", "The movement of individuals, and their alleles, between two populations"], "Bottleneck: severe reduction in size; fewer alleles in the gene pool."),
      short("10", [4], 3, "Real data (Hoelzel and others, 2024). Hunting reduced the northern elephant seal to an estimated 20 individuals by 1892. There are now over 200 000, but their genetic diversity is lower than that of southern elephant seals, which did not go through a similar bottleneck. Explain these observations.", [["Hunting (a human activity) caused a severe reduction in population size: a genetic bottleneck"], ["Only the survivors' alleles were passed on, so many alleles were lost (by chance)"], ["The present population descends from the few survivors, and new alleles arise only by (rare) mutation, so diversity stays low"]], "Hunting caused a genetic bottleneck. The few survivors carried only some of the alleles of the original population, so the others were lost. Every seal today descends from those survivors, so although numbers recovered, diversity did not; new alleles arise only by rare mutations.", "Saying the hunters removed particular alleles on purpose."),
      mcq("11", [4], "Which of these is a bottleneck caused by an environmental event?", ["A volcanic eruption kills most of the lizards on an island", "A population of birds grows quickly after a mild winter", "Farmers breed only from the cows with the highest milk yields", "Two populations of one species meet and begin to interbreed"], "An environmental event that severely reduces population size."),
      mcq("12", [5], "What is genetic drift?", ["A change in allele frequency in a population due to chance", "A change in allele frequency caused by selection of advantageous alleles", "The movement of alleles from one population to another by migration", "A change in the alleles of an individual during its lifetime"], "Drift is chance change in allele frequency."),
      short("13", [5], 3, "Explain why genetic drift has a larger effect when an allele is present in few copies.", [["Which individuals survive and reproduce, and which allele goes into each gamete, is partly chance"], ["With few copies, the chance loss or gain of a few copies is a large proportion of the total"], ["So the allele frequency changes more, and the allele may be lost (or fixed)"]], "Chance decides which individuals breed and which alleles they pass on. If an allele has only a few copies, losing or gaining one or two of them by chance is a large proportional change, so its frequency can change a lot in one generation and it can easily be lost.", "Saying small populations have 'more mutations'."),
      mcq("14", [5], "Which statement about genetic drift is correct?", ["It can cause an allele to be lost even if the allele is not harmful", "It always removes the harmful alleles from a population", "It happens only in very large populations of animals", "It makes individual organisms evolve during their lifetime"], "Drift is chance, not selection: any allele may be lost."),
      short("15", [4, 5], 2, "Explain how a bottleneck can change allele frequencies even when no allele is lost.", [["The survivors are a chance / random sample of the population"], ["By chance their allele frequencies differ from those of the original population, and these frequencies are passed on"]], "The few survivors are a chance sample of the original population, so the proportions of the alleles they carry are unlikely to be exactly the same as before. The next generation inherits the survivors' frequencies.", "Saying frequencies change only when alleles are lost."),
    ],
  };
})();
