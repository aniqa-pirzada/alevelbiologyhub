// Authored content for 3.3.3.4 Respiratory substrates (OxfordAQA 9610 v5.1, printed p.30; statements 3.3.3.4.s1 to s3 in
// data/spec.js). Official wording: "The breakdown products of lipids and amino acids enter the Krebs cycle and can also
// be used as respiratory substrates. The Respiratory Quotient (RQ) may be used to indicate respiratory substrate and is
// the ratio of carbon dioxide produced to oxygen consumed. The carbon dioxide and oxygen must be given in the same units,
// and in quantities proportional to the number of molecules involved. Acceptable values may be either moles or volumes
// of gas. Students should be able to: calculate RQ from appropriate data; suggest appropriate explanations of RQs in terms
// of carbohydrate, lipid or protein as a respiratory substrate. They should be able to comment on the tentative nature of
// any conclusions that are drawn."
// Phase 5 Batch 2, author A2. RQ calculation, marking and interpretation come from B.rqModel (data/content/_resp-model.js,
// reviewed in A2-MODEL.md); the RQ Calculator is in js/views/interactives-mito.js; the static figure is
// B.mitoArt.substrates(). Every data set is hypothetical. SUPPORTING (labelled): glycerol entering glycolysis as triose
// phosphate; energy per gram of lipid. Respirometer data appear only as a data source for RQ, not as required practical 8.
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const B = window.BIO; const R = "3.3.3.4";
  const S = (...n) => n.map((k) => `${R}.s${k}`);
  const RQ = B.rqModel;
  const SOURCES = `<p class="tiny muted"><strong>Sources</strong> (checked 17 November 2026): OxfordAQA International AS and A-level Biology (9610) specification v5.1, section 3.3.3.4. "Respiratory quotient", Wikipedia (<a href="https://en.wikipedia.org/wiki/Respiratory_quotient" target="_blank" rel="noopener">en.wikipedia.org</a>), for the typical values (carbohydrate 1.0, fat about 0.7, protein about 0.8 to 0.9). OpenStax <em>Biology 2e</em> (2018), section 7.6 "Connections of Carbohydrate, Protein, and Lipid Metabolic Pathways" (<a href="https://openstax.org/books/biology-2e/pages/7-6-connections-of-carbohydrate-protein-and-lipid-metabolic-pathways" target="_blank" rel="noopener">openstax.org</a>), for the entry of glycerol, fatty acids and amino acids. All data sets on this page are hypothetical, made up for practice.</p>`;
  const KOH = `<table class="tbl"><thead><tr><th>Respirometer tube (germinating seeds, 10 minutes)</th><th>Decrease in gas volume / cm³</th></tr></thead><tbody><tr><td>A: with potassium hydroxide solution (absorbs CO₂)</td><td>2.4</td></tr><tr><td>B: with water instead (CO₂ not absorbed)</td><td>0.7</td></tr></tbody></table>`;
  const SEEDS = `<table class="tbl"><thead><tr><th>Day after soaking</th><th>1</th><th>3</th><th>5</th><th>7</th><th>9</th></tr></thead><tbody><tr><th>RQ</th><td>0.98</td><td>0.84</td><td>0.71</td><td>0.70</td><td>0.72</td></tr></tbody></table>`;

  const calc = { kind: "rqCalculator", title: "RQ Calculator",
    note: "Choose a data set (or type in your own), work out the RQ yourself, then check. The scale shows the typical values for each substrate.",
    questions: [
      { id: `q-${R}-ixr1`, ref: R, stmts: S(2), type: "gap", marks: 1, stem: "Data set A (germinating wheat grains). Calculate the RQ.", text: "RQ = {{1}}", answers: { 1: ["1", "1.0", "1.00"] }, explanation: "24.0 ÷ 24.0 = 1.00." },
      { id: `q-${R}-ixr2`, ref: R, stmts: S(2), type: "gap", marks: 1, stem: "Data set B (germinating castor oil seeds). Calculate the RQ to two decimal places.", text: "RQ = {{1}}", answers: { 1: ["0.70"] }, explanation: "2.1 ÷ 3.0 = 0.70." },
      { id: `q-${R}-ixr3`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Which substrate is the RQ of data set B most consistent with?", options: ["Lipid", "Carbohydrate", "Protein", "Anaerobic respiration only"], answer: 0, explanation: "An RQ of about 0.7 is consistent with lipid: castor oil seeds store oil." },
      { id: `q-${R}-ixr4`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Data set D: 0.0171 dm³ of CO₂ produced and 22.5 cm³ of O₂ consumed. What is the RQ?", options: ["0.76", "0.00076", "1.32", "760"], answer: 0, explanation: "0.0171 dm³ = 17.1 cm³; 17.1 ÷ 22.5 = 0.76. (0.00076 forgets to convert; 1.32 divides the wrong way.)" },
      { id: `q-${R}-ixr5`, ref: R, stmts: S(2, 3), type: "mcq", marks: 1, stem: "Data set C (yeast with little oxygen) gives an RQ of 1.5. What is the best explanation?", options: ["Some anaerobic respiration releases CO₂ without using O₂", "The yeast cells are respiring stored lipid as substrate", "The yeast cells are respiring protein as substrate", "The yeast cells are producing oxygen as they respire"], answer: 0, explanation: "Alcoholic fermentation releases carbon dioxide but uses no oxygen, so CO₂ produced is greater than O₂ consumed and RQ rises above 1." },
      { id: `q-${R}-ixr6`, ref: R, stmts: S(3), type: "short", marks: 2, stem: "An RQ of 0.85 is measured. Explain why you cannot conclude that the organism is respiring protein. (2 marks)", scheme: [{ point: "A mixture of carbohydrate and lipid could give the same value", marks: 1 }, { point: "The RQ of protein varies with the amino acids / several substrates may be respired at once", marks: 1 }, { point: "Other processes (e.g. some anaerobic respiration) could change the gas exchange", marks: 1 }], model: "0.85 is consistent with protein, but a mixture of carbohydrate (1.0) and lipid (0.7) could give the same value, and the RQ of protein itself varies with the amino acids, so the conclusion can only be tentative." },
    ] };

  window.BIO.content[R] = {
    status: "draft",
    keywords: ["respiratory substrate", "carbohydrate", "lipid", "protein", "glycerol", "fatty acids", "amino acids", "acetylcoenzyme A", "Krebs cycle", "respiratory quotient", "RQ", "carbon dioxide", "oxygen", "moles", "volumes", "tentative", "anaerobic respiration"],
    notes: () => `
<div class="notice"><strong>What the specification requires (3.3.3.4).</strong> The <strong>breakdown products of lipids and amino acids enter the Krebs cycle</strong> and can be used as <strong>respiratory substrates</strong>. The <strong>respiratory quotient (RQ)</strong> may be used to indicate the respiratory substrate: it is the <strong>ratio of carbon dioxide produced to oxygen consumed</strong>, with both gases in the <strong>same units</strong> (moles or volumes of gas). You should be able to <strong>calculate RQ</strong> from data, <strong>suggest explanations</strong> of RQs in terms of carbohydrate, lipid or protein as the substrate, and <strong>comment on the tentative nature</strong> of any conclusions.</div>

<h2 data-stmt="${R}.s1">1. Respiratory substrates <span class="badge teal">required</span></h2>
<p>A <strong>respiratory substrate</strong> is any organic substance that is broken down in respiration to release energy for making ATP. Glucose is the usual example, but cells can also respire <strong>lipids</strong> and, when carbohydrate and lipid run short, <strong>proteins</strong>. Their breakdown products join the pathway at different points, and many of them <strong>enter the Krebs cycle</strong>, so the link reaction, Krebs cycle and oxidative phosphorylation (<a href="#/topic/3.3.3.3">3.3.3.3</a>) can release energy from any respiratory substrate.</p>
<p>The flow chart shows where each breakdown product enters.</p>

<h2 data-stmt="${R}.s1">2. Lipids as respiratory substrates <span class="badge teal">required</span></h2>
<p>A triglyceride is first hydrolysed into <strong>glycerol</strong> and three <strong>fatty acids</strong> (<a href="#/topic/3.1.1.3">3.1.1.3</a>).</p>
<ul><li>Each <strong>fatty acid</strong> is broken down into a series of <strong>two-carbon units</strong>, which combine with coenzyme A to form <strong>acetylcoenzyme A</strong>. This enters the <strong>Krebs cycle</strong>. Each step of the breakdown also produces reduced NAD and reduced FAD.</li>
<li><span class="badge">supporting</span> <strong>Glycerol</strong> is converted to triose phosphate, so it enters at glycolysis.</li></ul>
<p class="small"><span class="badge">supporting</span> Lipids release about twice as much energy per gram as carbohydrates. Fatty acids contain many more hydrogen atoms for each carbon atom, so their oxidation produces more reduced NAD and reduced FAD, and so more ATP by oxidative phosphorylation.</p>

<h2 data-stmt="${R}.s1">3. Proteins as respiratory substrates <span class="badge teal">required</span></h2>
<p>Proteins are hydrolysed to <strong>amino acids</strong>. Before an amino acid can be respired, its <strong>amino group is removed</strong>. The rest of the molecule then enters the pathway, often in the <strong>Krebs cycle</strong>; depending on the amino acid it may enter as pyruvate, as acetylcoenzyme A or as one of the molecules of the Krebs cycle itself.</p>

<h2 data-stmt="${R}.s2">4. The respiratory quotient (RQ) <span class="badge teal">required</span></h2>
<p style="text-align:center"><strong>RQ = carbon dioxide produced ÷ oxygen consumed</strong></p>
<p>The two quantities must be in the <strong>same units</strong> and in proportion to the numbers of molecules involved: either <strong>moles</strong> of each gas, or <strong>volumes</strong> of each gas measured at the same temperature and pressure (equal volumes of gases contain equal numbers of molecules). They must also be measured over the <strong>same time</strong>. RQ is a ratio, so it has no units.</p>
<p>The RQ depends on the respiratory substrate, because different substrates need different amounts of oxygen to oxidise them. For glucose:</p>
<p style="text-align:center"><strong>C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O</strong> &nbsp; RQ = 6 ÷ 6 = <strong>1.0</strong></p>
<p>For a lipid such as triolein:</p>
<p style="text-align:center"><strong>C₅₇H₁₀₄O₆ + 80O₂ → 57CO₂ + 52H₂O</strong> &nbsp; RQ = 57 ÷ 80 = <strong>0.71</strong></p>
<p>Lipids contain far less oxygen relative to their hydrogen and carbon than carbohydrates, so much more oxygen is needed to oxidise their hydrogen to water. More oxygen per carbon dioxide means a lower RQ.</p>

<h2 data-stmt="${R}.s2">5. Calculating RQ from data <span class="badge teal">required</span></h2>
<p><strong>Worked example.</strong> A small mammal produced 0.0156 dm³ of carbon dioxide and consumed 20.0 cm³ of oxygen in one minute. First put both gases in the same unit: 0.0156 dm³ = 15.6 cm³. Then RQ = 15.6 ÷ 20.0 = <strong>0.78</strong>. Always divide carbon dioxide by oxygen, never the other way round.</p>
<p>Work out the RQ for each data set, then check it with the calculator.</p>

<h2 data-stmt="${R}.s2">6. What an RQ suggests <span class="badge teal">required</span></h2>
<table class="tbl"><thead><tr><th>RQ</th><th>Consistent with</th></tr></thead><tbody>
<tr><td>about 1.0</td><td>mainly <strong>carbohydrate</strong></td></tr>
<tr><td>about 0.7</td><td>mainly <strong>lipid</strong></td></tr>
<tr><td>about 0.8 to 0.9</td><td><strong>protein</strong>, or a <strong>mixture</strong> of carbohydrate and lipid</td></tr>
<tr><td>above 1.0</td><td>some <strong>anaerobic respiration</strong> as well as aerobic respiration: anaerobic respiration in yeast and plants releases carbon dioxide without using oxygen</td></tr></tbody></table>
<p>Values between these suggest a <strong>mixture of substrates</strong>. A whole organism usually respires several substrates at once, so its respiratory quotient is an average.</p>

<h2 data-stmt="${R}.s3">7. Why conclusions from RQ are tentative <span class="badge teal">required</span></h2>
<p>An RQ can only <em>suggest</em> a substrate. Write "consistent with" or "suggests", never "proves". The reasons:</p>
<ul><li><strong>Different mixtures give the same value.</strong> An RQ of 0.85 fits protein, but also a mixture of carbohydrate and lipid.</li>
<li><strong>Protein has no single RQ</strong>: it depends on which amino acids are respired.</li>
<li><strong>Other processes change the gas exchange.</strong> Anaerobic respiration raises the RQ; photosynthesis in green tissue takes up carbon dioxide and releases oxygen, so RQ should be measured in the dark. <span class="badge">stretch</span> Converting one substrate into another (for example carbohydrate into fat) also changes it.</li>
<li><strong>Measurements have errors</strong>, especially small gas volumes, and one result may not be typical; repeats are needed.</li></ul>
<p>So a conclusion about the substrate should be supported by other evidence, such as what the organism has eaten or stored.</p>

<h2 data-stmt="${R}.s2 ${R}.s3">8. RQ from a respirometer <span class="badge teal">required</span></h2>
<p>Gas exchange is often measured with a respirometer. Potassium hydroxide solution absorbs carbon dioxide, so in a tube containing it the volume falls by the volume of <strong>oxygen consumed</strong>. In a tube without it, the volume changes by the difference between oxygen consumed and carbon dioxide produced. Both tubes must be at the same temperature and pressure and read after the same time.</p>
<p>Use the readings in the box to calculate the RQ.</p>

<h2 data-stmt="${R}.s2 ${R}.s3">9. RQ changing over time <span class="badge teal">required</span></h2>
<p>A change in RQ suggests a change of substrate. For example, a seed may first respire its small store of sugars and then its main food store. Use the data in the box to describe and explain such a change.</p>

<h2 data-stmt="${R}.s1 ${R}.s2 ${R}.s3">10. Common misconceptions <span class="badge teal">required</span></h2>
<ul><li><strong>"RQ = oxygen ÷ carbon dioxide."</strong> It is carbon dioxide produced ÷ oxygen consumed.</li>
<li><strong>"Units do not matter in a ratio."</strong> Both gases must be in the same unit: convert dm³ to cm³ (or moles to moles) first.</li>
<li><strong>"An RQ of 0.9 proves protein is being respired."</strong> It is only consistent with protein; a mixture of carbohydrate and lipid could give it.</li>
<li><strong>"An RQ above 1 means a lipid."</strong> Lipids give low RQs; above 1 suggests some anaerobic respiration.</li>
<li><strong>"Only glucose can be respired."</strong> Lipids and amino acids are respired too; their breakdown products enter the Krebs cycle.</li></ul>
${SOURCES}`,
    diagrams: [
      { id: `d-${R}-1`, title: "Where respiratory substrates enter respiration", status: "draft", caption: "Fatty acids form acetylcoenzyme A via two-carbon units; glycerol enters glycolysis (supporting). Amino acids lose their amino group and the rest enters at several points.", svg: B.mitoArt.substrates(), alt: "Flow chart. Carbohydrate goes through glycolysis to pyruvate, then acetylcoenzyme A, then the Krebs cycle. Lipid is broken into glycerol, which joins glycolysis as triose phosphate, and fatty acids, which are split into two-carbon units that form acetylcoenzyme A. Protein is broken into amino acids; the amino group is removed and the remainder enters acetylcoenzyme A or the Krebs cycle." },
    ],
    interactives: [
      calc,
      { kind: "checkpoint", title: "Respirometer data", intro: `<p class="small">Hypothetical data. Two respirometer tubes held the same mass of germinating seeds at the same temperature and pressure; both were read after 10 minutes.</p>${KOH}`, qids: [`q-${R}-d1`, `q-${R}-d2`, `q-${R}-d3`] },
      { kind: "checkpoint", title: "A germinating seed", intro: `<p class="small">Hypothetical data. The RQ of germinating sunflower seeds (which store mainly oil) was measured in the dark on alternate days.</p>${SEEDS}`, qids: [`q-${R}-d4`] },
    ],
    examFocus: `<ul>
<li><strong>Definition:</strong> RQ = CO₂ produced ÷ O₂ consumed, in the same units (moles or volumes) and over the same time.</li>
<li><strong>Calculate:</strong> convert to the same unit first (1 dm³ = 1000 cm³), divide CO₂ by O₂, and give a sensible number of decimal places (usually 2).</li>
<li><strong>Interpret:</strong> about 1.0 carbohydrate; about 0.7 lipid; about 0.8 to 0.9 protein or a mixture; above 1 some anaerobic respiration.</li>
<li><strong>Tentative:</strong> say "consistent with" or "suggests"; give a reason, such as a mixture of substrates giving the same value, protein RQ varying, or a single measurement.</li>
<li><strong>Substrates:</strong> fatty acids → two-carbon units → acetylcoenzyme A → Krebs cycle; amino acids lose their amino group and the remainder enters the Krebs cycle.</li>
<li><strong>Respirometer data:</strong> with potassium hydroxide the volume change = O₂ consumed; CO₂ produced = O₂ consumed − decrease without potassium hydroxide.</li></ul>`,
    synoptic: [
      { ref: "3.3.3.3", text: "The Krebs cycle and oxidative phosphorylation release energy from every respiratory substrate." },
      { ref: "3.3.3.2", text: "Anaerobic respiration in yeast and plants releases CO₂ without using O₂, raising the RQ above 1." },
      { ref: "3.1.1.3", text: "Triglycerides are hydrolysed into glycerol and fatty acids." },
      { ref: "3.1.1.4", text: "Proteins are polymers of amino acids, released by hydrolysis of peptide bonds." },
      { ref: "3.2.2.2", text: "Digestion breaks carbohydrates, lipids and proteins into the molecules that are absorbed and respired." },
    ],
    quickCheck: [
      { id: `q-${R}-qc1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "In what form do fatty acids enter the Krebs cycle?", options: ["Acetylcoenzyme A", "Pyruvate", "Glucose phosphate", "Lactate"], answer: 0, explanation: "Fatty acids are split into two-carbon units that form acetylcoenzyme A." },
      { id: `q-${R}-qc2`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Which is the respiratory quotient?", options: ["CO₂ produced ÷ O₂ consumed", "O₂ consumed ÷ CO₂ produced", "CO₂ produced − O₂ consumed", "O₂ consumed × CO₂ produced"], answer: 0, explanation: "RQ is the ratio of carbon dioxide produced to oxygen consumed." },
      { id: `q-${R}-qc3`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "What is the typical RQ when carbohydrate is respired?", options: ["1.0", "0.7", "0.9", "1.5"], answer: 0, explanation: "For glucose, 6 CO₂ are produced for 6 O₂ consumed: 6 ÷ 6 = 1.0." },
      { id: `q-${R}-qc4`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "What is the typical RQ when lipid is respired?", options: ["0.7", "1.0", "0.9", "0.3"], answer: 0, explanation: "Lipids need more oxygen per carbon dioxide released, giving about 0.7." },
      { id: `q-${R}-qc5`, ref: R, stmts: S(3), type: "mcq", marks: 1, stem: "Why are conclusions about the substrate drawn from RQ only tentative?", options: ["Different substrate mixtures can give one RQ", "RQ has no units, so it cannot be compared", "RQ can only ever be measured in plant seeds", "Carbon dioxide output cannot be measured"], answer: 0, explanation: "A mixture of carbohydrate and lipid, or protein, can give similar values, so an RQ only suggests the substrate." },
    ],
    flashcards: [
      { id: `f-${R}-1`, front: "What is a respiratory substrate?", back: "An organic substance broken down in respiration to release energy for ATP, e.g. carbohydrate, lipid or protein." },
      { id: `f-${R}-2`, front: "How do fatty acids enter respiration?", back: "They are split into two-carbon units that form acetylcoenzyme A, which enters the Krebs cycle." },
      { id: `f-${R}-3`, front: "How does glycerol enter respiration? (supporting)", back: "It is converted to triose phosphate and enters glycolysis." },
      { id: `f-${R}-4`, front: "How are amino acids respired?", back: "The amino group is removed; the remainder enters the Krebs cycle (or forms pyruvate or acetylcoenzyme A)." },
      { id: `f-${R}-5`, front: "Define the respiratory quotient (RQ)", back: "Carbon dioxide produced ÷ oxygen consumed, in the same units (moles or volumes) over the same time." },
      { id: `f-${R}-6`, front: "Typical RQ: carbohydrate", back: "1.0" },
      { id: `f-${R}-7`, front: "Typical RQ: lipid", back: "About 0.7" },
      { id: `f-${R}-8`, front: "Typical RQ: protein", back: "About 0.8 to 0.9 (it depends on the amino acids)." },
      { id: `f-${R}-9`, front: "What does an RQ above 1 suggest?", back: "Some anaerobic respiration, which releases CO₂ without using O₂." },
      { id: `f-${R}-10`, front: "Why is the RQ of lipid lower than that of carbohydrate?", back: "Lipids contain relatively little oxygen and much hydrogen, so more O₂ is needed per CO₂ released." },
      { id: `f-${R}-11`, front: "Why must RQ use the same units?", back: "It compares numbers of molecules: moles with moles, or volumes with volumes at the same temperature and pressure." },
      { id: `f-${R}-12`, front: "Give two reasons RQ conclusions are tentative", back: "Different mixtures give the same RQ; protein RQ varies; several substrates are respired at once; other processes (anaerobic respiration, photosynthesis) alter gas exchange." },
      { id: `f-${R}-13`, front: "Respirometer: what does the tube with potassium hydroxide measure?", back: "Oxygen consumed (the CO₂ produced is absorbed)." },
      { id: `f-${R}-14`, front: "Why do lipids release more energy per gram? (supporting)", back: "More hydrogen atoms, so more reduced NAD and FAD and more ATP from oxidative phosphorylation." },
    ],
    questions: [
      // ---- checkpoint: respirometer ----
      { id: `q-${R}-d1`, ref: R, stmts: S(2), type: "gap", marks: 2, stem: "Use the respirometer data in the box.", text: "Oxygen consumed = {{1}} cm³. Carbon dioxide produced = {{2}} cm³.", answers: { 1: ["2.4"], 2: ["1.7"] }, explanation: "Tube A: the CO₂ is absorbed, so the decrease (2.4 cm³) is the oxygen consumed. Tube B: decrease = O₂ consumed − CO₂ produced, so CO₂ produced = 2.4 − 0.7 = 1.7 cm³." },
      { id: `q-${R}-d2`, ref: R, stmts: S(2), type: "gap", marks: 1, stem: "Calculate the RQ to two decimal places.", text: "RQ = {{1}}", answers: { 1: ["0.71"] }, explanation: "1.7 ÷ 2.4 = 0.708, so 0.71." },
      { id: `q-${R}-d3`, ref: R, stmts: S(2, 3), type: "short", marks: 2, stem: "Suggest which respiratory substrate the seeds were using, and comment on how certain this conclusion is. (2 marks)", scheme: [{ point: "Lipid (RQ about 0.7)", marks: 1 }, { point: "Tentative: a mixture of substrates could give a similar value / only one reading / no repeats", marks: 1 }], model: "The RQ of 0.71 is consistent with lipid. The conclusion is tentative, because a mixture of substrates could give a similar value and this is a single reading without repeats." },
      // ---- checkpoint: germinating seed ----
      { id: `q-${R}-d4`, ref: R, stmts: S(2, 3), type: "short", marks: 3, stem: "Describe and explain the change in RQ of the germinating sunflower seeds. (3 marks)", scheme: [{ point: "Day 1 RQ about 1: consistent with carbohydrate (small sugar store) being respired", marks: 1 }, { point: "Falls to about 0.7 by day 5 to 9: lipid (the oil store) becomes the main substrate", marks: 1 }, { point: "Day 3 value (0.84) suggests a mixture / conclusions tentative because mixtures give intermediate values", marks: 1 }], model: "On day 1 the RQ is about 1, consistent with the seeds respiring carbohydrate. It falls to about 0.7 from day 5, consistent with the oil store (lipid) becoming the main substrate. The intermediate value on day 3 suggests a mixture of both; because mixtures give intermediate values, these conclusions are tentative." },
      // ---- MCQ ----
      { id: `q-${R}-m1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Supporting. What happens to the glycerol from a triglyceride that is respired?", options: ["It becomes triose phosphate in glycolysis", "It enters the Krebs cycle as a 6C molecule", "It is excreted from the cell unchanged", "It is converted to lactate in the cytoplasm"], answer: 0, explanation: "Glycerol is converted to triose phosphate and is respired through glycolysis." },
      { id: `q-${R}-m2`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "What must happen to an amino acid before it can be respired?", options: ["Its amino group is removed", "It is phosphorylated by ATP", "It joins coenzyme A as a whole", "It is converted into glycerol"], answer: 0, explanation: "The amino group is removed; the rest of the molecule enters the pathway, often in the Krebs cycle." },
      { id: `q-${R}-m3`, ref: R, stmts: S(2), type: "gap", marks: 1, stem: "Triolein is respired: C₅₇H₁₀₄O₆ + 80O₂ → 57CO₂ + 52H₂O. Calculate the RQ to two decimal places.", text: "RQ = {{1}}", answers: { 1: ["0.71"] }, explanation: "57 ÷ 80 = 0.7125, so 0.71." },
      { id: `q-${R}-m4`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Why is the RQ of lipid lower than that of carbohydrate?", options: ["Lipids have more hydrogen, so need more O₂ per CO₂", "Lipids have more carbon, so give more CO₂ per O₂", "Lipids are always respired anaerobically in cells", "Lipids do not enter the Krebs cycle in any form"], answer: 0, explanation: "Relative to carbohydrates, lipids contain little oxygen and much hydrogen; extra oxygen is needed to oxidise the hydrogen to water, so O₂ consumed is greater than CO₂ produced." },
      { id: `q-${R}-m5`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "An animal produced 0.0300 dm³ of CO₂ and consumed 33.3 cm³ of O₂ in one hour. What is the RQ?", options: ["0.90", "0.0009", "1.11", "900"], answer: 0, explanation: "0.0300 dm³ = 30.0 cm³; 30.0 ÷ 33.3 = 0.90." },
      // ---- match and written answers ----
      { id: `q-${R}-mt1`, ref: R, stmts: S(2), type: "match", marks: 4, stem: "Match each RQ to the explanation it is most consistent with.", pairs: [{ left: "1.0", right: "Mainly carbohydrate" }, { left: "0.7", right: "Mainly lipid" }, { left: "About 0.9", right: "Protein, or a mixture of substrates" }, { left: "1.4", right: "Some anaerobic respiration" }], explanation: "Carbohydrate 1.0; lipid about 0.7; protein about 0.8 to 0.9 (or a mixture); above 1 some anaerobic respiration." },
      { id: `q-${R}-s1`, ref: R, stmts: S(1), type: "short", marks: 2, stem: "Supporting. Explain why respiring a gram of lipid releases more energy than respiring a gram of carbohydrate. (2 marks)", scheme: [{ point: "Lipids (fatty acids) contain more hydrogen atoms (per gram / per carbon)", marks: 1 }, { point: "So more reduced NAD / FAD is produced, giving more ATP by oxidative phosphorylation", marks: 1 }], model: "Fatty acids contain many more hydrogen atoms per gram than carbohydrates. Their oxidation therefore produces more reduced NAD and reduced FAD, which pass more electrons to the electron transfer chain, so more ATP is made by oxidative phosphorylation." },
      { id: `q-${R}-s2`, ref: R, stmts: S(3), type: "short", marks: 3, stem: "A student measured an RQ of 0.8 for a resting animal and wrote: \"This proves the animal is respiring protein.\" Evaluate this conclusion. (3 marks)", scheme: [{ point: "0.8 is consistent with protein", marks: 1 }, { point: "But a mixture of lipid and carbohydrate could also give 0.8", marks: 1 }, { point: "Animals respire several substrates at once / protein RQ varies with the amino acids", marks: 1 }, { point: "Other evidence is needed (e.g. diet, repeated measurements)", marks: 1 }], model: "An RQ of 0.8 is consistent with protein, but it does not prove it: a mixture of lipid (0.7) and carbohydrate (1.0) could give the same value, animals respire several substrates at once, and the RQ of protein varies. 'Suggests' would be better, and other evidence such as the animal's diet is needed." },
      { id: `q-${R}-s3`, ref: R, stmts: S(1), type: "short", marks: 2, stem: "Describe how fatty acids are used as respiratory substrates. (2 marks)", scheme: [{ point: "They are broken down into two-carbon units", marks: 1 }, { point: "Which form acetylcoenzyme A, which enters the Krebs cycle", marks: 1 }], model: "Fatty acids are broken down into two-carbon units, which combine with coenzyme A to form acetylcoenzyme A; this enters the Krebs cycle." },
    ],
  };
  // load-time check: the calculator's own answers for the data sets agree with the answers in the questions above
  if (RQ) { const v = RQ.PRESETS.map((p) => RQ.calc(p.co2, p.cu, p.o2, p.ou).shown).join(","); if (v !== "1.00,0.70,1.50,0.76") console.warn("3.3.3.4: RQ preset values changed", v); }
})();
