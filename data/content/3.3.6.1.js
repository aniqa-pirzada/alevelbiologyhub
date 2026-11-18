// Authored content for 3.3.6.1 Principles (of inheritance) (OxfordAQA 9610 v5.1, printed p.32; statements 3.3.6.1.s1 to
// s3 in data/spec.js). Official wording: the genotype of an organism is its genetic constitution; the phenotype is the
// expression of this genetic constitution and its interaction with the environment; there may be many alleles of a single
// gene; alleles may be dominant, recessive or codominant; in a diploid organism the alleles at a specific locus may be
// either homozygous or heterozygous.
// Phase 5 Batch 3, author B3. Interactives: geneticsVocab, genotypePhenotype (js/views/interactives-genetics.js). Model
// specification and answer key reviewed before building (scratchpad p5b3/B3-MODEL.md, review MR-B3).
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const R = "3.3.6.1";
  const S = (...n) => n.map((k) => `${R}.s${k}`);
  const SOURCES = `<p class="tiny muted"><strong>Sources</strong> (checked 17 November 2026): OxfordAQA International AS and A-level Biology (9610) specification v5.1, section 3.3.6.1. OpenStax <em>Biology 2e</em> (2018), section 12.2 (<a href="https://openstax.org/books/biology-2e/pages/12-2-characteristics-and-traits" target="_blank" rel="noopener">openstax.org</a>), for codominance, the rabbit coat-colour alleles and the temperature-sensitive Himalayan allele. Macmillan <em>Life</em> 11e, section 12.13, for the rabbit C series.</p>`;

  const vocab = { kind: "geneticsVocab", title: "Vocabulary Explorer",
    note: "Choose a term to highlight it in the drawing of a homologous pair. Then answer the questions, which use other examples.",
    questions: [
      { id: `q-${R}-vx1`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "A diploid cell has the alleles Tt at one locus and GG at another locus. Which describes this cell?", options: ["Heterozygous at the T locus and homozygous at the G locus", "Homozygous at the T locus and heterozygous at the G locus", "Haploid, because each locus carries only one gene", "Heterozygous at both loci, because T and G are different genes"], answer: 0, explanation: "Tt has two different alleles at one locus (heterozygous); GG has two identical alleles (homozygous)." },
      { id: `q-${R}-vx2`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "Why do the body cells of a diploid organism carry two alleles of a gene?", options: ["They have two copies of each chromosome (a homologous pair), one from each parent", "Each gene is copied just before the cell divides, so a cell always holds two", "Every gene has exactly two alleles in the population, one dominant and one recessive", "Each allele is made of two strands of DNA, so every gene is counted twice"], answer: 0, explanation: "A diploid cell has homologous pairs of chromosomes; each chromosome of a pair carries one allele at the locus." },
      { id: `q-${R}-vx3`, ref: R, stmts: S(1, 2, 3), type: "match", marks: 2, stem: "Pea plants: the allele R (round seeds) is dominant to r (wrinkled seeds). Match each term to the example.", pairs: [{ left: "Genotype", right: "Rr" }, { left: "Phenotype", right: "Round seeds" }, { left: "Locus", right: "The position of the seed-shape gene on its chromosome" }, { left: "Allele", right: "r, which codes for wrinkled seeds" }], explanation: "The genotype is the alleles (Rr); the phenotype is what is expressed (round); the locus is the gene's position; r is one allele." },
    ] };

  const gp = { kind: "genotypePhenotype", title: "Genotype to Phenotype Explorer",
    note: "Choose a gene, then the allele inherited from each parent. For the rabbit, try changing the environment.",
    gates: { roan: `q-${R}-gp1`, cold: `q-${R}-gp3`, him: `q-${R}-gp4` },
    questions: [
      { id: `q-${R}-gp1`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "A roan cow (CᴿCᵂ) has red hairs and white hairs in its coat. What does this show about the alleles Cᴿ and Cᵂ?", options: ["Cᴿ and Cᵂ are codominant: both are expressed in the heterozygote", "Cᴿ is dominant to Cᵂ", "The roan cow is homozygous", "The environment has changed the alleles in some hair cells"], answer: 0, explanation: "Both alleles are expressed in the phenotype of the heterozygote: codominance. The hairs are red or white, not a blend." },
      { id: `q-${R}-gp2`, ref: R, stmts: S(2, 3), type: "gap", marks: 2, stem: "The ABO gene has three alleles: Iᴬ, Iᴮ and Iᴼ. Use the explorer to work out the answers.", text: "Number of different genotypes possible: {{1}}. Number of different blood groups (phenotypes): {{2}}.", answers: { 1: ["6", "six"], 2: ["4", "four"] }, explanation: "Genotypes: IᴬIᴬ, IᴬIᴼ, IᴮIᴮ, IᴮIᴼ, IᴬIᴮ and IᴼIᴼ (6). Blood groups: A, B, AB and O (4), because IᴬIᴬ and IᴬIᴼ are both group A, and IᴮIᴮ and IᴮIᴼ are both group B." },
      { id: `q-${R}-gp3`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "A Himalayan rabbit (cʰcʰ) has white fur on its back. A patch of this fur is shaved and an ice pack is kept on the patch while the fur regrows. The new fur on the patch is dark. Which statement explains this?", options: ["The cʰ enzyme works only at low temperature, so phenotype depends on genotype and environment", "The cold caused a mutation from cʰ to allele C in the skin cells of the patch", "The rabbit's genotype changed from cʰcʰ to Ccʰ in the cells of the cooled patch", "The allele for dark fur is dominant at low temperature and recessive when warm"], answer: 0, explanation: "The genotype has not changed. The cʰ allele codes for a temperature-sensitive enzyme that makes the dark pigment only where the skin is cool, such as the ears, nose, feet and tail." },
      { id: `q-${R}-gp4`, ref: R, stmts: S(1, 2), type: "short", marks: 2, stem: "Explain why a rabbit with the genotype cʰc has the Himalayan phenotype. (2 marks)", scheme: [{ point: "cʰ is dominant to c", marks: 1 }, { point: "c codes for no functional enzyme / no pigment, so one cʰ allele is enough to make pigment in the cooler extremities", marks: 1 }], model: "The allele cʰ is dominant to c. The c allele does not code for a working enzyme, but one cʰ allele codes for enough of the temperature-sensitive enzyme to make dark pigment in the cooler ears, nose, feet and tail, so the rabbit is Himalayan.", commonErrors: "Saying cʰ and c are codominant." },
    ] };

  window.BIO.content[R] = {
    status: "draft",
    keywords: ["genotype", "phenotype", "environment", "gene", "allele", "locus", "loci", "diploid", "homologous pair", "homozygous", "heterozygous", "dominant", "recessive", "codominant", "codominance", "multiple alleles", "ABO", "blood group", "roan", "Himalayan", "carrier"],
    notes: () => `
<div class="notice"><strong>What the specification requires (3.3.6.1).</strong> The <strong>genotype</strong> of an organism is its genetic constitution. The <strong>phenotype</strong> is the expression of this genetic constitution and its <strong>interaction with the environment</strong>. There may be <strong>many alleles</strong> of a single gene. Alleles may be <strong>dominant, recessive or codominant</strong>. In a <strong>diploid</strong> organism, the alleles at a specific <strong>locus</strong> may be either <strong>homozygous</strong> or <strong>heterozygous</strong>. <span class="badge teal">required</span></div>

<h2 data-stmt="${R}.s2 ${R}.s3">1. Genes, alleles and loci <span class="badge teal">required</span></h2>
<p>A <strong>gene</strong> is a section of DNA that codes for a polypeptide (<a href="#/topic/3.1.7.2">3.1.7</a>). Each gene has a fixed position on a particular chromosome, called its <strong>locus</strong> (plural loci).</p>
<p>A gene can exist in different versions called <strong>alleles</strong>. Alleles of a gene have different base sequences, so they may code for slightly different polypeptides, or for no working polypeptide at all. All the alleles of a gene occupy the same locus.</p>
<p>Use the explorer to see where each term applies on a homologous pair.</p>

<h2 data-stmt="${R}.s3">2. Diploid organisms: homozygous and heterozygous <span class="badge teal">required</span></h2>
<p>A <strong>diploid</strong> cell has two sets of chromosomes in <strong>homologous pairs</strong>: one chromosome of each pair was inherited from the mother and one from the father (<a href="#/topic/3.1.9.1">3.1.9</a>). The two chromosomes of a pair carry the same genes at the same loci, so a diploid cell has <strong>two alleles at each locus</strong>.</p>
<ul><li><strong>Homozygous</strong>: the two alleles at the locus are the <strong>same</strong>, for example RR or rr.</li>
<li><strong>Heterozygous</strong>: the two alleles at the locus are <strong>different</strong>, for example Rr.</li></ul>
<p>Gametes are haploid, so a gamete carries only <strong>one</strong> allele of each gene. That is why, in a genetic diagram, each gamete is written with one allele per gene (<a href="#/topic/3.3.6.2">3.3.6.2</a>).</p>

<h2 data-stmt="${R}.s2">3. Dominant, recessive and codominant alleles <span class="badge teal">required</span></h2>
<table class="tbl"><thead><tr><th>Term</th><th>Meaning</th><th>Example</th></tr></thead><tbody>
<tr><td><strong>Dominant</strong></td><td>Expressed in the phenotype even when only one copy is present (in a heterozygote). Written with a capital letter.</td><td>Pea seeds: RR and Rr are both round.</td></tr>
<tr><td><strong>Recessive</strong></td><td>Expressed in the phenotype only when no dominant allele is present: when homozygous (rr), or when it is the only allele, as for an X-linked gene in a male (<a href="#/topic/3.3.6.2">3.3.6.2</a>). Written with a lower-case letter.</td><td>Only rr seeds are wrinkled.</td></tr>
<tr><td><strong>Codominant</strong></td><td>Both alleles are expressed in the phenotype of a heterozygote. Written as a capital letter with a superscript for each allele.</td><td>Shorthorn cattle: CᴿCᴿ red, CᵂCᵂ white, CᴿCᵂ <strong>roan</strong> (red hairs and white hairs mixed).</td></tr></tbody></table>
<p>A dominant allele usually codes for a working protein, and one copy makes enough of it. For example, R codes for a starch-branching enzyme; rr seeds make less starch, take up more water and wrinkle as they dry. <span class="badge">supporting</span></p>
<p>A heterozygote for a recessive condition, such as cystic fibrosis (Ff), is unaffected but can pass the recessive allele on: it is called a <strong>carrier</strong>.</p>
<p>With codominance the heterozygote is not a blend: a roan cow has red hairs <em>and</em> white hairs, and a person with blood group AB has antigen A <em>and</em> antigen B on their red blood cells.</p>

<h2 data-stmt="${R}.s2">4. Multiple alleles <span class="badge teal">required</span></h2>
<p>A gene may have <strong>many alleles</strong> in a population. Each diploid cell still carries only <strong>two</strong> of them, one at the locus on each homologous chromosome.</p>
<p><strong>Human ABO blood groups.</strong> One gene has three alleles: <strong>I<sup>A</sup></strong> (antigen A), <strong>I<sup>B</sup></strong> (antigen B) and <strong>I<sup>O</sup></strong> (neither antigen). I<sup>A</sup> and I<sup>B</sup> are <strong>codominant</strong>, and both are <strong>dominant</strong> to I<sup>O</sup>.</p>
<table class="tbl"><thead><tr><th>Genotype</th><th>Antigens on red blood cells</th><th>Blood group</th></tr></thead><tbody>
<tr><td>I<sup>A</sup>I<sup>A</sup> or I<sup>A</sup>I<sup>O</sup></td><td>A</td><td>A</td></tr><tr><td>I<sup>B</sup>I<sup>B</sup> or I<sup>B</sup>I<sup>O</sup></td><td>B</td><td>B</td></tr><tr><td>I<sup>A</sup>I<sup>B</sup></td><td>A and B</td><td>AB</td></tr><tr><td>I<sup>O</sup>I<sup>O</sup></td><td>neither</td><td>O</td></tr></tbody></table>
<p><strong>Rabbit coat colour.</strong> One gene has the alleles <strong>C</strong> (full colour), <strong>c<sup>h</sup></strong> (Himalayan: white with dark ears, nose, feet and tail) and <strong>c</strong> (albino). Here the alleles form a dominance series: C is dominant to c<sup>h</sup> and c, and c<sup>h</sup> is dominant to c. (A fourth allele, chinchilla, also exists.)</p>

<h2 data-stmt="${R}.s1">5. Genotype, phenotype and the environment <span class="badge teal">required</span></h2>
<p>The <strong>genotype</strong> is the genetic constitution of an organism: the alleles it has. The <strong>phenotype</strong> is the expression of the genotype <strong>and its interaction with the environment</strong>: its observable or measurable characteristics.</p>
<ul><li><strong>Different genotypes, same phenotype.</strong> RR and Rr pea plants both have round seeds, because R is dominant.</li>
<li><strong>Same genotype, different phenotypes.</strong> Identical twins have the same genotype, but differences in diet can make one taller. A tall pea plant grown with too little light, water or mineral ions may be short.</li>
<li><strong>Himalayan rabbits.</strong> The c<sup>h</sup> allele codes for an enzyme needed to make the dark pigment, but the enzyme works only at lower temperatures. So pigment forms only in the cooler extremities. If fur on the back is shaved and the skin is kept cold while it regrows, the new fur there is dark: the environment has changed the phenotype, not the genotype.</li></ul>
<p>Try the cold patch in the explorer.</p>

<h2 data-stmt="${R}.s1 ${R}.s2 ${R}.s3">6. Common misconceptions <span class="badge teal">required</span></h2>
<ul><li><strong>"Dominant alleles are the most common."</strong> Dominance describes expression in a heterozygote, not frequency in a population.</li>
<li><strong>"Recessive alleles are never expressed in a heterozygote, so they disappear."</strong> They are carried and passed on; they are expressed when no dominant allele is present.</li>
<li><strong>"Codominance gives a blend."</strong> Both alleles are expressed: roan cattle have red and white hairs.</li>
<li><strong>"A cell can have three ABO alleles."</strong> The population has three; each diploid cell has two.</li>
<li><strong>"Phenotype is decided by the genotype alone."</strong> The phenotype results from the genotype interacting with the environment.</li>
<li><strong>Gene and allele are not the same.</strong> The gene for seed shape has two alleles, R and r.</li></ul>
${SOURCES}`,
    diagrams: [],
    interactives: [vocab, gp],
    examFocus: `<ul>
<li><strong>Definitions in mark-scheme language:</strong> genotype = genetic constitution; phenotype = expression of the genotype and its interaction with the environment; allele = a version of a gene; locus = position of a gene on a chromosome.</li>
<li><strong>Homozygous / heterozygous:</strong> the two alleles at one locus are the same / different. Always say "at a locus".</li>
<li><strong>Dominant / recessive:</strong> a dominant allele is expressed even when one copy is present; a recessive allele only when no dominant allele is present.</li>
<li><strong>Codominant:</strong> both alleles expressed in the heterozygote. ABO: I<sup>A</sup> and I<sup>B</sup> codominant, both dominant to I<sup>O</sup>.</li>
<li><strong>Environment:</strong> when asked why organisms with the same genotype differ, name a specific environmental factor and how it affects the characteristic.</li></ul>`,
    synoptic: [
      { ref: "3.1.7.2", text: "Genes, loci and alleles as sections of DNA." },
      { ref: "3.1.9.1", text: "Meiosis halves the chromosome number, so gametes carry one allele of each gene." },
      { ref: "3.1.6", text: "Variation results from genetic and environmental factors." },
      { ref: "3.2.11.1", text: "Gene mutations create new alleles." },
      { ref: "3.3.6.2", text: "Genetic diagrams use these terms to predict offspring." },
    ],
    quickCheck: [
      { id: `q-${R}-qc1`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "What does heterozygous mean?", options: ["Two different alleles at a locus", "Two identical alleles at a locus", "One allele at a locus", "Two different genes on one chromosome"], answer: 0, explanation: "Heterozygous: the two alleles at a locus are different, for example Rr." },
      { id: `q-${R}-qc2`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "What is meant by multiple alleles?", options: ["A gene has more than two alleles in a population", "A cell carries more than two copies of each gene", "Several different genes control one characteristic", "One allele is copied many times in each cell"], answer: 0, explanation: "For example, the ABO gene has three alleles in the human population, but each person has only two." },
      { id: `q-${R}-qc3`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "What determines an organism's phenotype?", options: ["Both its genotype and its environment", "Its genotype only", "Its environment only", "Only the dominant alleles it carries"], answer: 0, explanation: "The phenotype is the expression of the genotype and its interaction with the environment." },
      { id: `q-${R}-qc4`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "What is codominance?", options: ["Both alleles are expressed in the phenotype of a heterozygote", "Neither allele is expressed in the phenotype of a heterozygote", "The heterozygote shows a blend of the two phenotypes", "One allele masks the other allele in a heterozygote"], answer: 0, explanation: "Codominant alleles are both expressed, as in blood group AB." },
    ],
    flashcards: [
      { id: `f-${R}-1`, front: "Define genotype", back: "The genetic constitution of an organism: the alleles it has." },
      { id: `f-${R}-2`, front: "Define phenotype", back: "The expression of the genotype and its interaction with the environment." },
      { id: `f-${R}-3`, front: "Define allele", back: "A version of a gene, with a different base sequence; alleles of a gene occupy the same locus." },
      { id: `f-${R}-4`, front: "Define locus", back: "The fixed position of a gene on a chromosome." },
      { id: `f-${R}-5`, front: "Homozygous", back: "The two alleles at a locus are the same (for example RR or rr)." },
      { id: `f-${R}-6`, front: "Heterozygous", back: "The two alleles at a locus are different (for example Rr)." },
      { id: `f-${R}-7`, front: "Dominant allele", back: "Expressed in the phenotype even when only one copy is present (in a heterozygote)." },
      { id: `f-${R}-8`, front: "Recessive allele", back: "Expressed only when no dominant allele is present: when homozygous, or in a male for an X-linked gene." },
      { id: `f-${R}-9`, front: "Codominant alleles", back: "Both expressed in the phenotype of a heterozygote, for example roan cattle (CᴿCᵂ) or blood group AB (IᴬIᴮ)." },
      { id: `f-${R}-10`, front: "Why does a diploid cell have two alleles of each gene?", back: "It has homologous pairs of chromosomes, one from each parent, with the same genes at the same loci." },
      { id: `f-${R}-11`, front: "ABO alleles and their relationship", back: "Iᴬ, Iᴮ, Iᴼ: Iᴬ and Iᴮ are codominant; both are dominant to Iᴼ." },
      { id: `f-${R}-12`, front: "Genotypes of blood groups A, B, AB and O", back: "A: IᴬIᴬ or IᴬIᴼ; B: IᴮIᴮ or IᴮIᴼ; AB: IᴬIᴮ; O: IᴼIᴼ." },
      { id: `f-${R}-13`, front: "How does the Himalayan rabbit show the effect of the environment?", back: "The enzyme coded for by cʰ makes dark pigment only at lower temperatures, so only the cooler extremities (or a cooled patch) are dark." },
      { id: `f-${R}-14`, front: "What is a carrier?", back: "A heterozygote for a recessive allele: unaffected, but can pass the allele to offspring." },
    ],
    questions: [
      { id: `q-${R}-1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "What is the genotype of an organism?", options: ["The genetic constitution of an organism", "The observable characteristics of an organism", "The position of a gene on a chromosome", "The complete set of chromosomes in a gamete"], answer: 0, explanation: "The genotype is the alleles an organism has; the phenotype is how they are expressed." },
      { id: `q-${R}-2`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Which is the best description of the phenotype?", options: ["The expression of the genotype and its interaction with the environment", "The alleles that an organism has for one gene at a single locus", "The effect of the environment alone on an organism's characteristics", "The dominant alleles that an organism has, whatever its environment"], answer: 0, explanation: "The phenotype depends on both the genotype and the environment." },
      { id: `q-${R}-3`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Identical twins have the same genotype, but one twin is 4 cm taller than the other. What is the best explanation?", options: ["The phenotype results from the genotype interacting with the environment, e.g. diet", "One twin inherited a different allele for height from one of the parents", "Height is controlled by codominant alleles, so the twins express different alleles", "One twin is homozygous and the other twin is heterozygous for height"], answer: 0, explanation: "Identical twins have the same alleles, so the difference must come from the environment." },
      { id: `q-${R}-4`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "A recessive allele is one that is…", options: ["Expressed only when no dominant allele is present (for example when homozygous)", "Less common in the population than the dominant allele of the same gene", "Never passed on to the next generation because it is always masked", "Masked in the phenotype whenever the organism is homozygous for it"], answer: 0, explanation: "A recessive allele is masked by a dominant allele. It is expressed in a homozygote, or in a male who has only one X-linked allele." },
      { id: `q-${R}-5`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "A dominant allele is one that is…", options: ["Expressed in the phenotype even when only one copy is present (in a heterozygote)", "More common in the population than any other allele of the same gene", "Expressed in the phenotype only when the organism is homozygous for it", "Codes for a larger protein than the recessive allele of the same gene"], answer: 0, explanation: "One copy of a dominant allele is enough for it to be expressed." },
      { id: `q-${R}-6`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "What does homozygous mean?", options: ["The two alleles at a locus are the same", "The two alleles at a locus are different", "There is only one allele at the locus", "The two genes on a chromosome are the same"], answer: 0, explanation: "Homozygous: two identical alleles at one locus, for example TT or tt." },
      { id: `q-${R}-7`, ref: R, stmts: S(2, 3), type: "gap", marks: 2, stem: "Answer each part with a number.", text: "A diploid cell is heterozygous at one locus. The number of different alleles of that gene in the cell is {{1}}. A gene has four alleles in a population; the greatest number of different alleles of this gene in one diploid cell is {{2}}.", answers: { 1: ["2", "two"], 2: ["2", "two"] }, explanation: "A diploid cell has two copies of each chromosome, so at most two alleles of a gene, however many alleles the population has." },
      { id: `q-${R}-8`, ref: R, stmts: S(2), type: "short", marks: 2, stem: "Explain what is meant by codominant alleles. Use the ABO blood groups as an example. (2 marks)", scheme: [{ point: "Both alleles are expressed in the phenotype of a heterozygote", marks: 1 }, { point: "IᴬIᴮ has blood group AB / makes both antigen A and antigen B on the red blood cells", marks: 1 }], model: "Codominant alleles are both expressed in the phenotype of a heterozygote. A person with the genotype IᴬIᴮ makes both antigen A and antigen B, so has blood group AB.", commonErrors: "Describing a blend; saying Iᴼ is codominant." },
      { id: `q-${R}-9`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "Which term describes the position of a gene on a chromosome?", options: ["Locus", "Allele", "Genome", "Codon"], answer: 0, explanation: "A locus is the fixed position of a gene." },
      { id: `q-${R}-10`, ref: R, stmts: S(1, 2, 3), type: "short", marks: 3, stem: "In pea plants, the allele T (tall) is dominant to t (dwarf). One tall plant is TT and another tall plant is Tt. Explain why the two plants have the same phenotype but different genotypes, and suggest why a TT plant might be short. (3 marks)", scheme: [{ point: "T is dominant, so one copy is enough for the plant to be tall", marks: 1 }, { point: "TT is homozygous and Tt is heterozygous: they have different alleles / genotypes", marks: 1 }, { point: "The environment, e.g. too little light, water or mineral ions, limits growth", marks: 1 }], model: "T is dominant, so the Tt plant is tall like the TT plant even though it has a different genotype: TT is homozygous and Tt is heterozygous. The phenotype also depends on the environment: a TT plant grown with too little light, water or mineral ions (for example nitrate) may not grow tall.", commonErrors: "Saying the short TT plant must have a mutation." },
      { id: `q-${R}-11`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Which statement about the ABO blood group alleles is correct?", options: ["Iᴬ and Iᴮ are codominant, and both are dominant to Iᴼ", "Iᴬ is dominant to Iᴮ, and Iᴮ is dominant to Iᴼ", "Iᴼ is dominant to Iᴬ, and Iᴬ is dominant to Iᴮ", "All three alleles are codominant with each other"], answer: 0, explanation: "IᴬIᴮ is group AB (codominant); IᴬIᴼ is group A and IᴮIᴼ is group B (Iᴼ recessive)." },
    ],
  };
})();
