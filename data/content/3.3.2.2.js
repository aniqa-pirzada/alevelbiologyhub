// Authored content for 3.3.2.2 The light-independent reaction (OxfordAQA 9610 v5.1, printed p.29; statements
// 3.3.2.2.s1–s3 in data/spec.js). Official wording: "The light-independent reaction in such detail as to show that:
// carbon dioxide reacts with ribulose bisphosphate (RuBP) to form two molecules of glycerate 3-phosphate (GP), a
// reaction catalysed by the enzyme rubisco; ATP and reduced NADP from the light-dependent reaction reduce glycerate
// 3-phosphate to triose phosphate; some of the triose phosphate is used to regenerate RuBP in the Calvin cycle; triose
// phosphate is also converted to useful organic substances."
// Scope (Phase 5 Batch 1 brief, author U2): the Calvin cycle at specification level. SUPPORTING only (labelled): the
// unstable six-carbon intermediate, ATP used in regenerating RuBP, the 9 ATP and 6 reduced NADP per 3 CO2, the 14C
// tracer experiments. Not included: names of intermediates other than RuBP, GP and TP; photorespiration; C4 and CAM.
// Carbon accounting uses B.calvinModel (data/content/_photo-art.js): basis one round = 3 CO2 fixed; every count on this
// page agrees with it (3 RuBP + 3 CO2 -> 6 GP -> 6 TP; 1 TP leaves; 5 TP -> 3 RuBP; 9 ATP and 6 reduced NADP).
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const M = window.BIO.calvinModel; const PR = M.PER_ROUND; // { co2: 3, atp: 9, nadph: 6, tpOut: 1 }
  const R = "3.3.2.2";
  const S = (...n) => n.map((k) => `${R}.s${k}`);

  const SOURCES = `<p class="tiny muted"><strong>Sources</strong> (checked 16 November 2026): OxfordAQA International AS and A-level Biology (9610) specification v5.1, section 3.3.2.2. OpenStax <em>Biology 2e</em> (2018), section 8.3, "Using Light Energy to Make Organic Molecules" (<a href="https://openstax.org/books/biology-2e/pages/8-3-using-light-energy-to-make-organic-molecules" target="_blank" rel="noopener">openstax.org</a>): three turns of the cycle fix enough carbon to export one triose phosphate; six ATP and six reduced NADP are used in reduction and three more ATP in regenerating RuBP; the other five triose phosphates regenerate RuBP. University of Arizona Biology Project, "Photosynthesis Problem Set 2" (<a href="https://biology.arizona.edu/biochemistry/problem_sets/photosynthesis_2/04t.html" target="_blank" rel="noopener">biology.arizona.edu</a>), for the changes in GP and RuBP after the light is switched off. The data table in section 7 (switching the light off) is hypothetical, made up for practice.</p>`;

  // hypothetical data for the light-off question (relative concentrations, arbitrary units)
  const HD = `<table class="tbl"><thead><tr><th>Conditions</th><th>GP (arbitrary units)</th><th>RuBP (arbitrary units)</th></tr></thead><tbody><tr><td>Light, carbon dioxide available</td><td>1.0</td><td>1.0</td></tr><tr><td>Two minutes after the light was switched off</td><td>1.7</td><td>0.2</td></tr></tbody></table>`;

  const calvinEx = { kind: "calvinExplorer", title: "Calvin Cycle Explorer",
    note: "Step through one round of the cycle. Each molecule is drawn as a chain of its carbon atoms, so you can count them; the table keeps the carbon total and the ATP and reduced NADP used. Use \"Another round\" to see what it takes to make enough TP for one glucose.",
    questions: [
      { id: `q-${R}-ixk1`, ref: R, stmts: S(1), type: "gap", marks: 1, stem: "Step 1. Three CO₂ react with three RuBP. How many carbon atoms are there in the GP produced?", text: "The six GP molecules contain {{1}} carbon atoms.", answers: { 1: ["18"] }, explanation: "3 RuBP × 5 C = 15, plus 3 CO₂ × 1 C = 3, gives 18; 6 GP × 3 C = 18. Carbon is conserved." },
      { id: `q-${R}-ixk2`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "Of the six TP molecules made in one round, how many are used to regenerate RuBP?", options: ["5", "1", "3", "6"], answer: 0, explanation: "Five TP (15 carbon atoms) are rearranged into three RuBP (15 carbon atoms); one TP leaves the cycle." },
      { id: `q-${R}-ixk3`, ref: R, stmts: S(2, 3), type: "gap", marks: 2, stem: "Glucose has six carbon atoms and can be made from two TP. Use the explorer with two rounds.", text: "To make enough TP for one glucose, {{1}} molecules of CO₂ must be fixed, using {{2}} molecules of reduced NADP.", answers: { 1: ["6", "six"], 2: ["12", "twelve"] }, explanation: `Each round fixes ${PR.co2} CO₂ and gives ${PR.tpOut} TP to leave the cycle, using ${PR.nadph} reduced NADP. Two rounds: 6 CO₂, 2 TP (6 carbon atoms) and 12 reduced NADP (and ${2 * PR.atp} ATP).` },
    ] };

  const integ = { kind: "photoIntegration", title: "Photosynthesis Integration Explorer",
    note: "See how the two stages depend on each other. Choose what to follow (energy, carbon, hydrogen, oxygen or the recycling of ADP and NADP), then change the conditions to see what happens when one stage is cut off.",
    questions: [
      { id: `q-${R}-ixi1`, ref: R, stmts: S(1, 2), type: "mcq", marks: 1, stem: "Choose \"Light switched off\". What happens to the concentrations of GP and RuBP in the chloroplast soon afterwards?", options: ["GP rises and RuBP falls", "GP falls and RuBP rises", "Both rise", "Both stay the same, because the light-independent reaction does not need light"], answer: 0, explanation: "Without ATP and reduced NADP, GP cannot be reduced, so it builds up; RuBP is still used in fixation but is not regenerated, so it falls." },
      { id: `q-${R}-ixi2`, ref: R, stmts: S(1, 3), type: "mcq", marks: 1, stem: "Choose \"CO₂ lowered\". Why does the concentration of RuBP rise?", options: ["Less RuBP is used in fixation, but it is still regenerated from TP", "More RuBP is made by the light-dependent reaction in the thylakoids", "Rubisco converts some of the GP back into RuBP instead of into TP", "RuBP is no longer converted into TP, so none of it is used up"], answer: 0, explanation: "With less CO₂, rubisco fixes less, so RuBP is used more slowly while the TP already in the cycle still regenerates it." },
      { id: `q-${R}-ixi3`, ref: R, stmts: S(2), type: "short", marks: 2, stem: "The light-independent reaction does not use light directly. Explain why it stops soon after a plant is put in the dark. (2 marks)", scheme: [{ point: "The light-dependent reaction stops, so no (more) ATP or reduced NADP is made", marks: 1 }, { point: "So GP cannot be reduced to TP / RuBP cannot be regenerated", marks: 1 }], model: "In the dark the light-dependent reaction stops, so no more ATP or reduced NADP is produced. The light-independent reaction needs both to reduce GP to triose phosphate (and ATP to regenerate RuBP), so once the existing supply is used up the Calvin cycle stops.", commonErrors: "Saying it carries on in the dark because it is 'light-independent'; saying rubisco needs light energy." },
    ] };

  window.BIO.content[R] = {
    status: "draft",
    keywords: ["light-independent reaction", "Calvin cycle", "carbon dioxide", "ribulose bisphosphate", "RuBP", "rubisco", "glycerate 3-phosphate", "GP", "triose phosphate", "TP", "reduced NADP", "NADP", "ATP", "carbon fixation", "fixation", "reduction", "regeneration", "stroma", "glucose", "starch", "cellulose", "sucrose", "lipids", "amino acids", "organic substances"],
    notes: () => `
<div class="notice"><strong>What the specification requires (3.3.2.2).</strong> The light-independent reaction in enough detail to show that: <strong>carbon dioxide reacts with ribulose bisphosphate (RuBP) to form two molecules of glycerate 3-phosphate (GP)</strong>, a reaction catalysed by the enzyme <strong>rubisco</strong>; <strong>ATP and reduced NADP from the light-dependent reaction reduce GP to triose phosphate (TP)</strong>; <strong>some TP is used to regenerate RuBP</strong> in the Calvin cycle; and <strong>TP is also converted to useful organic substances</strong>. <span class="badge teal">required</span> <span class="badge">supporting</span></div>

<h2 data-stmt="${R}.s1 ${R}.s2 ${R}.s3">1. The light-independent reaction: the Calvin cycle <span class="badge teal">required</span></h2>
<p>The <strong>light-independent reaction</strong> takes place in the <strong>stroma</strong> of the chloroplast. It is a cycle of enzyme-controlled reactions, the <strong>Calvin cycle</strong>, which turns carbon dioxide into a three-carbon sugar, <strong>triose phosphate (TP)</strong>, from which the plant makes all its other organic substances. It has three stages:</p>
<ol><li><strong>Carbon fixation</strong>: carbon dioxide reacts with RuBP to form GP (section 2).</li>
<li><strong>Reduction</strong>: GP is reduced to TP using <strong>ATP and reduced NADP from the light-dependent reaction</strong> (section 3).</li>
<li><strong>Regeneration</strong>: some TP is used to regenerate RuBP, so the cycle can continue; the rest is converted to useful organic substances (sections 4 and 6).</li></ol>
<p><strong>"Light-independent" does not mean "happens in the dark".</strong> The reaction does not use light energy directly, but it <strong>depends on the ATP and reduced NADP</strong> made by the light-dependent reaction (<a href="#/topic/3.3.2.1">3.3.2.1</a>). In a plant it runs in the light, alongside the light-dependent reaction, and it stops soon after the light goes off (section 7).</p>

<h2 data-stmt="${R}.s1">2. Carbon fixation: CO₂ + RuBP → 2 GP <span class="badge teal">required</span></h2>
<p>Carbon dioxide diffuses into the leaf through the stomata, then into the mesophyll cells and the stroma of their chloroplasts. There it reacts with <strong>ribulose bisphosphate (RuBP)</strong>, a five-carbon sugar with two phosphate groups. The reaction is catalysed by the enzyme <strong>rubisco</strong>. The product splits to give <strong>two molecules of glycerate 3-phosphate (GP)</strong>, each with three carbon atoms:</p>
<p style="text-align:center"><strong>CO₂ (1C) + RuBP (5C) → 2 GP (2 × 3C)</strong> &nbsp; (catalysed by rubisco)</p>
<p>This is called <strong>carbon fixation</strong>: carbon from an inorganic gas becomes part of an organic molecule. Carbon atoms are conserved: 1 + 5 = 6 = 2 × 3.</p>
<p class="small"><span class="badge">supporting</span> The six-carbon compound formed first is unstable and splits at once, so it is never seen in experiments. Rubisco stands for ribulose bisphosphate carboxylase-oxygenase; it works slowly, so leaves contain a great deal of it. Some books call GP "3-phosphoglycerate" or "PGA". In experiments in which algae were given radioactive ¹⁴CO₂ for only a few seconds, GP was the first compound to become radioactive.</p>

<h2 data-stmt="${R}.s2">3. Reduction: GP → TP using ATP and reduced NADP <span class="badge teal">required</span></h2>
<p>Each GP is then <strong>reduced to triose phosphate (TP)</strong>, also a three-carbon compound. The reduction uses the two products of the light-dependent reaction:</p>
<ul><li><strong>reduced NADP</strong> supplies the <strong>hydrogen</strong> (electrons) that reduces GP, and becomes NADP again;</li>
<li><strong>ATP</strong> supplies the <strong>energy</strong>, and is hydrolysed to ADP and inorganic phosphate.</li></ul>
<p style="text-align:center"><strong>GP + ATP + reduced NADP → TP + ADP + Pᵢ + NADP</strong></p>
<p>The ADP, Pᵢ and NADP diffuse back to the thylakoid membranes, where the light-dependent reaction turns them into ATP and reduced NADP again. This is the link between the two stages: <strong>the energy that ends up in TP came from light, via ATP and reduced NADP</strong>.</p>
<p class="small"><span class="badge">supporting</span> One ATP and one reduced NADP are used for each GP reduced.</p>

<h2 data-stmt="${R}.s3">4. Regeneration of RuBP <span class="badge teal">required</span></h2>
<p>If all the TP left the cycle, the RuBP would soon run out and carbon fixation would stop. So <strong>most of the TP is used to regenerate RuBP</strong>, in a series of reactions that rearrange the carbon atoms of TP into RuBP. This is why the process is a <strong>cycle</strong>: the RuBP that accepts carbon dioxide is made again.</p>
<p>The rest of the TP leaves the cycle and is converted into <strong>useful organic substances</strong> (section 6).</p>
<p class="small"><span class="badge">supporting</span> Regenerating RuBP also uses ATP from the light-dependent reaction.</p>

<h2 data-stmt="${R}.s1 ${R}.s2 ${R}.s3">5. Counting the carbon atoms <span class="badge teal">required</span></h2>
<p>Because each TP that leaves the cycle has three carbon atoms, the cycle must fix <strong>three CO₂</strong> for every TP that leaves. The explorer uses this as its basis: <strong>one round = three CO₂ fixed</strong>.</p>
<table class="tbl"><thead><tr><th>Stage (one round)</th><th>Molecules</th><th>Carbon atoms</th></tr></thead><tbody>
<tr><td>Fixation</td><td>3 RuBP + 3 CO₂ → 6 GP</td><td>15 + 3 = 18 → 18</td></tr>
<tr><td>Reduction</td><td>6 GP → 6 TP (using 6 ATP and 6 reduced NADP)</td><td>18 → 18</td></tr>
<tr><td>Output</td><td>1 TP leaves the cycle</td><td>3</td></tr>
<tr><td>Regeneration</td><td>5 TP → 3 RuBP (using 3 ATP)</td><td>15 → 15</td></tr></tbody></table>
<p>So one round uses <strong>${PR.atp} ATP and ${PR.nadph} reduced NADP</strong> <span class="badge">supporting</span> and gives one TP to the rest of the cell. Two TP (two rounds, six CO₂) are needed for one six-carbon glucose. Many books count one "turn" of the cycle per CO₂, so a round here is three turns.</p>
<p>Use the explorer to count the carbon atoms at every step.</p>

<h2 data-stmt="${R}.s3">6. Triose phosphate makes useful organic substances <span class="badge teal">required</span></h2>
<p>TP that leaves the cycle is the starting material for every other organic substance in the plant:</p>
<table class="tbl"><thead><tr><th>Made from TP</th><th>How (outline)</th><th>Used for</th></tr></thead><tbody>
<tr><td><strong>Glucose</strong> and other hexose sugars</td><td>Two TP are joined</td><td>Respiration; making the carbohydrates below</td></tr>
<tr><td><strong>Starch</strong></td><td>Condensation of many α-glucose (<a href="#/topic/3.1.1.2">3.1.1.2</a>)</td><td>Storage, in chloroplasts and storage organs</td></tr>
<tr><td><strong>Cellulose</strong></td><td>Condensation of many β-glucose</td><td>Cell walls</td></tr>
<tr><td><strong>Sucrose</strong></td><td>Glucose + fructose</td><td>Transport in the phloem (<a href="#/topic/3.2.8.2">3.2.8.2</a>)</td></tr>
<tr><td><strong>Lipids</strong></td><td>TP is converted to glycerol and to fatty acids, which are joined</td><td>Membranes (phospholipids); energy stores in seeds</td></tr>
<tr><td><strong>Amino acids</strong></td><td>Also need nitrogen, from nitrate ions absorbed by the roots</td><td>Proteins, including enzymes such as rubisco</td></tr>
<tr><td><strong>Nucleotides</strong></td><td>Also need nitrogen and phosphate</td><td>DNA, RNA and ATP</td></tr></tbody></table>
<p>So the carbon fixed in the Calvin cycle, and the chemical energy stored with it, pass into the whole plant and then along food chains.</p>

<h2 data-stmt="${R}.s2 ${R}.s1 ${R}.s3">7. How the two stages depend on each other <span class="badge teal">required</span></h2>
<p>The two stages are separate places in the chloroplast but one process:</p>
<ul><li>The <strong>light-dependent reaction</strong> supplies <strong>ATP and reduced NADP</strong> to the Calvin cycle.</li>
<li>The <strong>Calvin cycle</strong> returns <strong>ADP, Pᵢ and NADP</strong>, which the light-dependent reaction needs to keep going.</li></ul>
<p>So changing one stage changes the other. If the light is switched off, ATP and reduced NADP run out within a short time: GP can no longer be reduced, so <strong>GP builds up</strong>, and without TP <strong>RuBP is not regenerated</strong>, so its concentration falls as fixation uses it up. If the carbon dioxide concentration falls, less RuBP is used in fixation, so <strong>RuBP builds up</strong> and <strong>GP falls</strong>. These changes are typical data questions; the limiting factors behind them are in <a href="#/topic/3.3.2.3">3.3.2.3</a>.</p>
<p>Use the explorer to follow energy, carbon, hydrogen and oxygen through both stages, then switch the light off or lower the carbon dioxide.</p>

<h2 data-stmt="${R}.s1 ${R}.s2 ${R}.s3">8. Putting the steps in order <span class="badge teal">required</span></h2>
<p>Many exam answers lose marks by putting the steps in the wrong order or leaving one out. Learn the sequence: <strong>CO₂ + RuBP → 2 GP (rubisco) → GP reduced to TP (ATP and reduced NADP) → some TP regenerates RuBP; some TP makes useful organic substances</strong>.</p>
<p>Put the steps in order in the sequencing challenge.</p>

<h2 data-stmt="${R}.s1 ${R}.s2 ${R}.s3">9. Common misconceptions <span class="badge teal">required</span></h2>
<ul><li><strong>"The light-independent reaction happens at night" or "in the dark".</strong> It needs ATP and reduced NADP from the light-dependent reaction, so it runs in the light and stops soon after dark.</li>
<li><strong>"Carbon dioxide reacts with rubisco."</strong> Carbon dioxide reacts with <em>RuBP</em>; rubisco is the enzyme that catalyses the reaction.</li>
<li><strong>"One CO₂ + RuBP gives one GP."</strong> It gives <strong>two</strong> molecules of GP.</li>
<li><strong>"GP is oxidised to TP."</strong> GP is <strong>reduced</strong>, by reduced NADP, using energy from ATP.</li>
<li><strong>"The Calvin cycle makes glucose directly."</strong> It makes TP; glucose and other substances are made from TP.</li>
<li><strong>"All the TP is used to make glucose."</strong> Most TP regenerates RuBP (five out of every six); only one in six leaves the cycle.</li>
<li><strong>"The oxygen comes from the Calvin cycle."</strong> No oxygen is released by the light-independent reaction; it comes from photolysis of water.</li></ul>
${SOURCES}`,
    diagrams: [],
    interactives: [
      calvinEx,
      integ,
      { kind: "checkpoint", title: "Switching the light off", intro: `<p class="small">Hypothetical data. The concentrations of GP and RuBP were measured in a suspension of algae in the light, then two minutes after the light was switched off.</p>${HD}`, qids: [`q-${R}-d1`] },
      { kind: "checkpoint", title: "Sequencing challenge", intro: `<p class="small">Use the arrows to put each set of steps in order.</p>`, qids: [`q-${R}-sqa`, `q-${R}-sqb`, `q-${R}-sqc`] },
    ],
    examFocus: `<ul>
<li><strong>Use the full names at least once:</strong> ribulose bisphosphate (RuBP), glycerate 3-phosphate (GP), triose phosphate (TP), rubisco.</li>
<li><strong>Fixation:</strong> CO₂ reacts with RuBP to form <em>two</em> GP, catalysed by rubisco. The CO₂ reacts with RuBP, not with rubisco.</li>
<li><strong>Reduction:</strong> say that ATP <em>and</em> reduced NADP from the light-dependent reaction are used to reduce GP to TP; reduced NADP provides hydrogen, ATP provides energy.</li>
<li><strong>Regeneration:</strong> some TP regenerates RuBP (so the cycle continues); some is converted to useful organic substances such as glucose, starch, cellulose, lipids and amino acids.</li>
<li><strong>Data on GP and RuBP:</strong> light off → GP up, RuBP down (no ATP or reduced NADP to reduce GP; RuBP not regenerated). CO₂ down → RuBP up, GP down (less fixation). Explain both changes, not just one.</li>
<li><strong>Carbon counting:</strong> 3 CO₂ + 3 RuBP (15 C) → 6 GP (18 C) → 6 TP; 5 TP (15 C) → 3 RuBP; 1 TP (3 C) leaves. Check your sums balance.</li>
<li><span class="badge">supporting</span> 9 ATP and 6 reduced NADP per 3 CO₂ fixed, and the unstable 6C intermediate, are not required but help you check your reasoning.</li></ul>`,
    synoptic: [
      { ref: "3.3.2.1", text: "The light-dependent reaction produces the ATP and reduced NADP used to reduce GP." },
      { ref: "3.3.2.3", text: "Carbon dioxide concentration, light intensity and temperature (which affects rubisco) as limiting factors." },
      { ref: "3.1.3.2", text: "Rubisco is an enzyme: its activity depends on temperature and substrate concentration." },
      { ref: "3.1.1.2", text: "Glucose from TP is condensed into starch (α-glucose) and cellulose (β-glucose)." },
      { ref: "3.1.1.3", text: "TP is converted to glycerol and fatty acids, which form triglycerides and phospholipids." },
      { ref: "3.2.8.2", text: "Sucrose made from TP is transported in the phloem." },
      { ref: "3.3.3.1", text: "Triose phosphate also appears in glycolysis, where it is oxidised to pyruvate." },
      { ref: "3.3.5.2", text: "Carbon fixation by photosynthesis removes carbon dioxide from the atmosphere in the carbon cycle." },
    ],
    quickCheck: [
      { id: `q-${R}-qc1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Which enzyme catalyses the reaction between carbon dioxide and RuBP?", options: ["Rubisco", "ATP synthase", "Amylase", "ATP hydrolase"], answer: 0, explanation: "Rubisco (ribulose bisphosphate carboxylase-oxygenase) catalyses carbon fixation." },
      { id: `q-${R}-qc2`, ref: R, stmts: S(1), type: "gap", marks: 1, stem: "Complete the sentence.", text: "Carbon dioxide reacts with RuBP to form two molecules of {{1}}.", answers: { 1: ["GP", "glycerate 3-phosphate", "glycerate-3-phosphate", "glycerate phosphate", "3-phosphoglycerate", "PGA"] }, explanation: "Two molecules of glycerate 3-phosphate (GP)." },
      { id: `q-${R}-qc3`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Which substances from the light-dependent reaction are used to reduce GP to triose phosphate?", options: ["ATP and reduced NADP", "Oxygen and ATP", "Water and NADP", "Carbon dioxide and RuBP"], answer: 0, explanation: "ATP provides energy and reduced NADP provides hydrogen." },
      { id: `q-${R}-qc4`, ref: R, stmts: S(1, 3), type: "mcq", marks: 1, stem: "Where in the chloroplast does the Calvin cycle take place?", options: ["Stroma", "Thylakoid membrane", "Thylakoid space", "Outer membrane"], answer: 0, explanation: "The enzymes of the light-independent reaction, including rubisco, are in the stroma." },
      { id: `q-${R}-qc5`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "What happens to most of the triose phosphate made in the Calvin cycle?", options: ["It is used to regenerate RuBP", "It is converted to starch", "It is broken down to carbon dioxide", "It is used to make oxygen"], answer: 0, explanation: "Five of every six TP regenerate RuBP; one in six leaves the cycle to make useful organic substances." },
    ],
    flashcards: [
      { id: `f-${R}-1`, front: "Where does the light-independent reaction take place?", back: "In the stroma of the chloroplast." },
      { id: `f-${R}-2`, front: "What does carbon dioxide react with in the Calvin cycle?", back: "Ribulose bisphosphate (RuBP), a 5-carbon compound." },
      { id: `f-${R}-3`, front: "What is formed when CO₂ reacts with RuBP?", back: "Two molecules of glycerate 3-phosphate (GP), each with 3 carbon atoms." },
      { id: `f-${R}-4`, front: "Which enzyme catalyses carbon fixation?", back: "Rubisco." },
      { id: `f-${R}-5`, front: "What is carbon fixation?", back: "Incorporating carbon from inorganic carbon dioxide into an organic molecule: CO₂ + RuBP → 2 GP." },
      { id: `f-${R}-6`, front: "What is GP reduced to?", back: "Triose phosphate (TP)." },
      { id: `f-${R}-7`, front: "What is used to reduce GP to TP?", back: "ATP (energy) and reduced NADP (hydrogen), both from the light-dependent reaction." },
      { id: `f-${R}-8`, front: "What happens to ADP, Pi and NADP after the reduction of GP?", back: "They return to the thylakoid membranes, where the light-dependent reaction makes ATP and reduced NADP again." },
      { id: `f-${R}-9`, front: "What is most triose phosphate used for?", back: "Regenerating RuBP so that the cycle can continue (five out of every six TP)." },
      { id: `f-${R}-10`, front: "Name four useful organic substances made from TP", back: "For example glucose, starch, cellulose, sucrose, lipids, amino acids (with nitrogen) and nucleotides." },
      { id: `f-${R}-11`, front: "Why is the Calvin cycle a cycle?", back: "The RuBP used to fix CO₂ is regenerated from TP." },
      { id: `f-${R}-12`, front: "Carbon accounting for 3 CO₂ fixed", back: "3 RuBP (15 C) + 3 CO₂ (3 C) → 6 GP (18 C) → 6 TP; 5 TP → 3 RuBP; 1 TP (3 C) leaves." },
      { id: `f-${R}-13`, front: "Light switched off: effect on GP and RuBP", back: "GP rises (cannot be reduced without ATP and reduced NADP); RuBP falls (still used in fixation, not regenerated)." },
      { id: `f-${R}-14`, front: "CO₂ lowered: effect on GP and RuBP", back: "RuBP rises (used more slowly but still regenerated); GP falls (less fixation)." },
      { id: `f-${R}-15`, front: "Does the light-independent reaction carry on in the dark?", back: "Only briefly: it needs ATP and reduced NADP from the light-dependent reaction, so it stops once they run out." },
      { id: `f-${R}-16`, front: "ATP and reduced NADP per 3 CO₂ fixed (supporting)", back: "9 ATP (6 for reduction, 3 for regenerating RuBP) and 6 reduced NADP." },
    ],
    questions: [
      // ---- checkpoint: sequencing challenge ----
      { id: `q-${R}-sqa`, ref: R, stmts: S(1, 2, 3), type: "sequence", marks: 3, stem: "Put the stages of the Calvin cycle in order, starting with RuBP.", steps: ["Carbon dioxide combines with RuBP, catalysed by rubisco", "Two molecules of GP are formed", "GP is reduced to triose phosphate using ATP and reduced NADP", "Some triose phosphate leaves the cycle", "The rest of the triose phosphate regenerates RuBP"], explanation: "Fixation → 2 GP → reduction to TP → some TP leaves → the rest regenerates RuBP." },
      { id: `q-${R}-sqb`, ref: R, stmts: S(1, 2, 3), type: "sequence", marks: 3, stem: "Follow one carbon atom from the air into a starch grain. Put the steps in order.", steps: ["Carbon dioxide diffuses into the leaf through a stoma", "Carbon dioxide diffuses into the stroma of a chloroplast", "The carbon is fixed when CO₂ reacts with RuBP", "The carbon is in GP, which is reduced to TP", "TP is converted into glucose", "Glucose is condensed into starch"], explanation: "Stoma → stroma → fixation (RuBP) → GP → TP → glucose → starch." },
      { id: `q-${R}-sqc`, ref: R, stmts: S(2), type: "sequence", marks: 3, stem: "Link the two stages. Put the events in order, from light energy to triose phosphate.", steps: ["Light energy is absorbed by chlorophyll", "Excited electrons pass along the electron transfer chain", "ATP and reduced NADP are made", "ATP and reduced NADP are used to reduce GP", "Triose phosphate is formed", "ADP and NADP return to the thylakoids"], explanation: "Light → excited electrons → ATP and reduced NADP → reduction of GP → TP; ADP and NADP are recycled." },
      // ---- MCQ ----
      { id: `q-${R}-m1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "How many carbon atoms does one molecule of RuBP contain?", options: ["5", "3", "6", "1"], answer: 0, explanation: "RuBP is a 5-carbon compound: 1 (from CO₂) + 5 = 6 = 2 × 3 (two GP)." },
      { id: `q-${R}-m2`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "In the reduction of GP to triose phosphate, what is the role of reduced NADP?", options: ["It provides the hydrogen (electrons) that reduces GP", "It provides the carbon atoms that are added to GP to form TP", "It acts as the enzyme that catalyses the reduction of GP", "It provides the phosphate group that is added to GP to form TP"], answer: 0, explanation: "Reduced NADP is the reducing agent; ATP provides the energy." },
      { id: `q-${R}-m3`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "Which of these is not made from triose phosphate in a plant?", options: ["Oxygen", "Starch", "Lipids", "Amino acids"], answer: 0, explanation: "Oxygen comes from the photolysis of water in the light-dependent reaction. Starch, lipids and amino acids (with nitrogen) are all made from TP." },
      { id: `q-${R}-m4`, ref: R, stmts: S(3, 1), type: "mcq", marks: 1, stem: "Why is the light-independent reaction described as a cycle?", options: ["The RuBP that accepts carbon dioxide is regenerated from triose phosphate", "Carbon dioxide is released from GP and then fixed again by rubisco", "GP is converted back into carbon dioxide, which then reacts with RuBP", "ATP is hydrolysed and then remade in the stroma by the same enzymes"], answer: 0, explanation: "Some TP is used to regenerate RuBP, so the acceptor of CO₂ is made again and the cycle continues." },
      { id: `q-${R}-m5`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Data analysis. Algae were given radioactive carbon dioxide (¹⁴CO₂) in the light and killed after a few seconds. Which compound would contain most of the radioactive carbon?", options: ["GP", "Starch", "Sucrose", "Amino acids"], answer: 0, explanation: "CO₂ is fixed by reacting with RuBP to form GP, so GP is the first compound to be labelled; starch, sucrose and amino acids are made later from TP." },
      { id: `q-${R}-m6`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Why is the name \"dark reaction\", used in some older books, misleading?", options: ["It needs ATP and reduced NADP from the light-dependent reaction, so it runs in the light", "It uses light energy directly to split carbon dioxide, so it needs bright light", "It happens only in the thylakoid membranes, which must be exposed to light", "It produces oxygen, which can only be released when the stomata open in the light"], answer: 0, explanation: "It does not use light directly, but it depends on products of the light-dependent reaction and stops soon after dark." },
      { id: `q-${R}-m7`, ref: R, stmts: S(2, 3), type: "mcq", marks: 1, stem: "<span class=\"badge\">supporting</span> For every three molecules of CO₂ fixed, how many molecules of ATP are used in the Calvin cycle altogether?", options: ["9", "6", "3", "12"], answer: 0, explanation: "6 ATP to reduce 6 GP to 6 TP, plus 3 ATP to regenerate 3 RuBP from 5 TP: 9 ATP (and 6 reduced NADP)." },
      // ---- gap and match ----
      { id: `q-${R}-g1`, ref: R, stmts: S(1, 2, 3), type: "gap", marks: 4, stem: "Complete the passage.", text: "In the stroma, carbon dioxide reacts with {{1}}, catalysed by the enzyme {{2}}. The GP formed is reduced to {{3}} using ATP and reduced NADP. Some of this is used to {{4}} RuBP.", answers: { 1: ["RuBP", "ribulose bisphosphate"], 2: ["rubisco"], 3: ["triose phosphate", "TP"], 4: ["regenerate", "remake", "reform", "re-form"] }, explanation: "RuBP; rubisco; triose phosphate; regenerate." },
      { id: `q-${R}-mt1`, ref: R, stmts: S(1, 2, 3), type: "match", marks: 5, stem: "Match each molecule or enzyme to its description.", pairs: [{ left: "RuBP", right: "5-carbon compound that accepts carbon dioxide" }, { left: "Rubisco", right: "Enzyme that catalyses carbon fixation" }, { left: "GP", right: "3-carbon compound formed when carbon dioxide is fixed" }, { left: "Triose phosphate", right: "3-carbon sugar formed by reducing GP" }, { left: "Reduced NADP", right: "Supplies the hydrogen used to reduce GP" }] },
      // ---- data and written answers ----
      { id: `q-${R}-d1`, ref: R, stmts: S(1, 2, 3), type: "short", marks: 4, stem: `Data analysis. Use the hypothetical data in the table. Explain the changes in the concentrations of GP and of RuBP after the light was switched off. (4 marks)`, scheme: [{ point: "No light, so the light-dependent reaction stops / no (more) ATP and reduced NADP", marks: 1 }, { point: "GP rises because it cannot be reduced to TP (but is still formed)", marks: 1 }, { point: "RuBP still combines with CO₂ / fixation continues (forming GP)", marks: 1 }, { point: "RuBP falls because it is not regenerated (no TP formed)", marks: 1 }], model: "When the light is switched off, the light-dependent reaction stops, so no more ATP or reduced NADP is made. GP can no longer be reduced to triose phosphate, but it is still formed for a while, because RuBP continues to react with carbon dioxide; so GP rises from 1.0 to 1.7 units. Without TP, RuBP cannot be regenerated, while it is still being used up in fixation, so RuBP falls from 1.0 to 0.2 units.", commonErrors: "Explaining only one of the two changes; saying the light-independent reaction is unaffected because it does not need light." },
      { id: `q-${R}-s1`, ref: R, stmts: S(3, 1), type: "short", marks: 2, stem: "Explain why only one in six of the triose phosphate molecules made in the Calvin cycle can leave the cycle. (2 marks)", scheme: [{ point: "The rest (five in six) are needed to regenerate RuBP", marks: 1 }, { point: "So that there is RuBP to fix more carbon dioxide / the cycle can continue / carbon balance: 5 TP (15 C) make 3 RuBP (15 C)", marks: 1 }], model: "Five out of every six TP molecules are needed to regenerate RuBP: their 15 carbon atoms form three RuBP. Without this, there would be no RuBP to combine with more carbon dioxide and the cycle would stop. Only the sixth TP, containing the three carbon atoms fixed from three CO₂, is a net gain that can leave the cycle.", commonErrors: "Saying the rest is lost as carbon dioxide." },
      { id: `q-${R}-s2`, ref: R, stmts: S(3), type: "short", marks: 2, stem: "Describe how triose phosphate can be used to produce starch. (2 marks)", scheme: [{ point: "Two TP are joined to form glucose / a hexose", marks: 1 }, { point: "α-glucose molecules are joined by condensation (glycosidic bonds) to form starch", marks: 1 }], model: "Two molecules of triose phosphate are combined to form a six-carbon sugar, glucose. Many α-glucose molecules are then joined by condensation reactions, forming glycosidic bonds, to make starch, which is stored in the chloroplast.", commonErrors: "Using β-glucose (that makes cellulose)." },
      { id: `q-${R}-s3`, ref: R, stmts: S(2), type: "short", marks: 3, stem: "Explain how the light-dependent reaction and the light-independent reaction depend on each other. (3 marks)", scheme: [{ point: "The light-dependent reaction provides ATP and reduced NADP", marks: 1 }, { point: "Used (in the light-independent reaction) to reduce GP to TP / ATP also used to regenerate RuBP", marks: 1 }, { point: "The light-independent reaction returns ADP, Pi and NADP, which the light-dependent reaction needs (to make more ATP and reduced NADP)", marks: 1 }], model: "The light-dependent reaction in the thylakoid membranes produces ATP and reduced NADP. The light-independent reaction in the stroma uses them to reduce GP to triose phosphate, and uses ATP to regenerate RuBP. In doing so it produces ADP, inorganic phosphate and NADP, which return to the thylakoids, where the light-dependent reaction needs them to make more ATP and reduced NADP.", commonErrors: "Describing only one direction; saying the light-independent reaction supplies oxygen or water." },
      { id: `q-${R}-e1`, ref: R, stmts: S(1, 2, 3), type: "extended", marks: 6, stem: "Extended response. Describe how carbon dioxide is converted into useful organic substances in the light-independent reaction. (6 marks)", scheme: [{ point: "In the stroma, CO₂ reacts with RuBP (5C)", marks: 1 }, { point: "Catalysed by rubisco, forming two molecules of GP (3C)", marks: 1 }, { point: "GP reduced to triose phosphate (TP)", marks: 1 }, { point: "Using ATP and reduced NADP from the light-dependent reaction (ATP for energy, reduced NADP for hydrogen)", marks: 1 }, { point: "Some TP used to regenerate RuBP (using ATP), so the cycle continues", marks: 1 }, { point: "Some TP converted to useful organic substances, e.g. glucose, starch, cellulose, lipids, amino acids", marks: 1 }], levels: "Level 3 (5–6): the three stages in the correct order with correct names (RuBP, rubisco, GP, TP), the roles of ATP and reduced NADP, regeneration of RuBP and examples of products. Level 2 (3–4): most stages described with minor errors or omissions, e.g. no rubisco or only one product. Level 1 (1–2): some correct statements about fixation or products.", model: "The light-independent reaction takes place in the stroma of the chloroplast. Carbon dioxide reacts with ribulose bisphosphate (RuBP), a five-carbon compound, in a reaction catalysed by the enzyme rubisco. This forms two molecules of glycerate 3-phosphate (GP), each with three carbon atoms. GP is then reduced to triose phosphate (TP), using ATP and reduced NADP from the light-dependent reaction: reduced NADP supplies the hydrogen and ATP supplies the energy. Most of the TP is used to regenerate RuBP, which also uses ATP, so that more carbon dioxide can be fixed and the cycle continues. The remaining TP is converted into useful organic substances, such as glucose and from it starch, cellulose and sucrose, as well as lipids and, with nitrogen from nitrate, amino acids.", commonErrors: "CO₂ reacting with rubisco; one GP per CO₂; GP oxidised; missing regeneration." },
    ],
  };
})();
