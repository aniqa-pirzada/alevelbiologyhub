// Authored content for 3.3.3.1 Glycolysis (OxfordAQA 9610 v5.1, printed p.28; statements 3.3.3.1.s1 and s2 in
// data/spec.js). Official wording: "Glycolysis takes place in the cytoplasm and is common to both aerobic and anaerobic
// respiratory pathways. Glycolysis in such detail as to show that: glucose is phosphorylated to glucose phosphate using
// ATP; triose phosphate is produced and is oxidised to pyruvate with a net gain of ATP and reduced NAD."
// Phase 5 Batch 2, author A1 (2026-11-17), status draft. SUPPORTING only (labelled): the second phosphorylation and the
// name hexose bisphosphate, two ATP per triose phosphate, the term substrate-level phosphorylation. Not included: names
// of the other intermediates and enzymes. The aerobic stages are A2's page 3.3.3.3 (linked, not taught here).
// Accounting uses B.glycoModel (data/content/_resp-art.js): basis per one glucose throughout; 2 ATP used, 4 ATP made,
// net 2 ATP, 2 reduced NAD, 2 pyruvate, no CO2. The one per-pyruvate question (m6) states its basis in the stem.
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const R = "3.3.3.1";
  const S = (...n) => n.map((k) => `${R}.s${k}`);
  const Art = window.BIO.respArt;

  const SOURCES = `<p class="tiny muted"><strong>Sources</strong> (checked 17 November 2026): OxfordAQA International AS and A-level Biology (9610) specification v5.1, section 3.3.3.1. OpenStax <em>Biology</em>, section 7.2, "Glycolysis" (<a href="https://openstax.org/books/biology/pages/7-2-glycolysis" target="_blank" rel="noopener">openstax.org</a>): two ATP are invested in the first half; four ATP and two reduced NAD (NADH) are produced in the second half, a net gain of two ATP and two reduced NAD per glucose; glycolysis takes place in the cytoplasm; mature mammalian red blood cells depend on it. The cell-fractionation results in section 4 are hypothetical, made up for practice.</p>`;

  // hypothetical fractionation data (section 4)
  const FD = `<table class="tbl"><thead><tr><th>Tube</th><th>Contents (all kept at 25 °C)</th><th>Pyruvate formed?</th><th>Carbon dioxide released?</th></tr></thead><tbody>
<tr><td>A</td><td>Cytoplasm (fluid left after removing nuclei and mitochondria) + glucose</td><td>Yes</td><td>No</td></tr>
<tr><td>B</td><td>Mitochondria + glucose</td><td>No</td><td>No</td></tr>
<tr><td>C</td><td>Mitochondria + pyruvate, with oxygen</td><td>(pyruvate used up)</td><td>Yes</td></tr></tbody></table>`;

  const explorer = { kind: "glycoExplorer", title: "Glycolysis Explorer",
    note: "Step through glycolysis for one molecule of glucose. Each molecule is drawn as a chain of its carbon atoms; the table keeps count of the ATP used and made, the reduced NAD formed and the carbon atoms.",
    questions: [
      { id: `q-${R}-ix1`, ref: R, stmts: S(2), type: "gap", marks: 1, stem: "Use steps 1 and 2 of the explorer.", text: "In total, {{1}} ATP molecules are used in the first half of glycolysis for one glucose molecule.", answers: { 1: ["2", "two"] }, explanation: "One ATP phosphorylates glucose to glucose phosphate; a second ATP adds another phosphate group (supporting). So 2 ATP are used per glucose before any ATP is made." },
      { id: `q-${R}-ix2`, ref: R, stmts: S(2), type: "gap", marks: 2, stem: "Go to step 4.", text: "For each molecule of glucose, the net gain is {{1}} ATP and {{2}} reduced NAD.", answers: { 1: ["2", "two"], 2: ["2", "two"] }, explanation: "4 ATP are made (2 from each triose phosphate) but 2 were used, so the net gain is 2 ATP. Each of the two triose phosphates reduces one NAD: 2 reduced NAD per glucose." },
      { id: `q-${R}-ix3`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "At step 4, triose phosphate is oxidised. What accepts the hydrogen that is removed?", options: ["NAD", "Oxygen", "ATP", "Pyruvate"], answer: 0, explanation: "NAD accepts the hydrogen and becomes reduced NAD. Oxygen is not used in glycolysis." },
      { id: `q-${R}-ix4`, ref: R, stmts: S(1, 2), type: "mcq", marks: 1, stem: "Follow the carbon atoms from step 0 to step 4. How many molecules of carbon dioxide are released in glycolysis for each glucose?", options: ["None", "1", "2", "6"], answer: 0, explanation: "All six carbon atoms of glucose end up in the two pyruvate molecules (2 × 3). No carbon dioxide is released in glycolysis." },
    ] };

  window.BIO.content[R] = {
    status: "draft",
    keywords: ["glycolysis", "respiration", "aerobic respiration", "anaerobic respiration", "cytoplasm", "glucose", "phosphorylation", "phosphorylated", "glucose phosphate", "hexose bisphosphate", "triose phosphate", "pyruvate", "oxidation", "oxidised", "NAD", "reduced NAD", "ATP", "net gain", "ADP", "substrate-level phosphorylation"],
    notes: () => `
<div class="notice"><strong>What the specification requires (3.3.3.1).</strong> <strong>Glycolysis takes place in the cytoplasm</strong> and is <strong>common to both aerobic and anaerobic respiration</strong>. You need enough detail to show that <strong>glucose is phosphorylated to glucose phosphate using ATP</strong>, and that <strong>triose phosphate is produced and oxidised to pyruvate</strong>, with a <strong>net gain of ATP and reduced NAD</strong>. <span class="badge teal">required</span> <span class="badge">supporting</span></div>

<h2 data-stmt="${R}.s1">1. Respiration starts with glycolysis <span class="badge teal">required</span></h2>
<p>Respiration releases chemical energy from organic molecules such as glucose and uses it to make <strong>ATP</strong>, which cells use directly to supply energy (<a href="#/topic/3.1.4.3">3.1.4.3</a>). It happens in a series of enzyme-controlled stages, and the first stage is always <strong>glycolysis</strong> ("splitting sugar").</p>
<ul><li>Glycolysis takes place in the <strong>cytoplasm</strong>, where its enzymes are dissolved. It does not happen in mitochondria.</li>
<li>It <strong>does not need oxygen</strong>.</li>
<li>It is <strong>common to aerobic and anaerobic respiration</strong>: every cell that respires, with or without oxygen, carries out glycolysis. It splits one glucose (6 carbon atoms) into two molecules of <strong>pyruvate</strong> (3 carbon atoms each).</li></ul>
<p>What happens next depends on oxygen. <strong>With oxygen</strong>, pyruvate enters a mitochondrion and is oxidised completely in the link reaction, the Krebs cycle and oxidative phosphorylation (<a href="#/topic/3.3.3.3">3.3.3.3</a>). <strong>Without oxygen</strong>, pyruvate stays in the cytoplasm and is converted to lactate, or to ethanol and carbon dioxide (<a href="#/topic/3.3.3.2">3.3.3.2</a>).</p>
<p>The diagram shows where glycolysis fits in respiration.</p>

<h2 data-stmt="${R}.s2">2. Glycolysis step by step <span class="badge teal">required</span></h2>
<p>At this level, glycolysis has two main parts.</p>
<p><strong>Phosphorylation of glucose using ATP.</strong> Glucose is <strong>phosphorylated</strong>: a phosphate group from ATP is added to it, forming <strong>glucose phosphate</strong>, and the ATP becomes ADP. This makes glucose more reactive, so it can be split. <span class="badge">supporting</span> A second ATP adds another phosphate group, giving a six-carbon sugar with two phosphate groups (hexose bisphosphate). So <strong>two ATP are used</strong> for each glucose. The six-carbon sugar phosphate then <strong>splits into two molecules of triose phosphate</strong> (3 carbon atoms each).</p>
<p><strong>Oxidation of triose phosphate to pyruvate.</strong> Each triose phosphate is <strong>oxidised</strong>: hydrogen is removed from it. The hydrogen is accepted by the coenzyme <strong>NAD</strong>, which becomes <strong>reduced NAD</strong>. Each triose phosphate is converted to <strong>pyruvate</strong>, and in these reactions <strong>ATP is made</strong> from ADP and phosphate. <span class="badge">supporting</span> Two ATP are made for each triose phosphate, by substrate-level phosphorylation (a phosphate group is passed directly from an intermediate to ADP).</p>
<p>Use the explorer to step through glycolysis and count the ATP, the reduced NAD and the carbon atoms.</p>

<h2 data-stmt="${R}.s2">3. The net gain of ATP and reduced NAD <span class="badge teal">required</span></h2>
<p>Because one glucose gives <strong>two</strong> triose phosphates, everything after the split happens twice. For each molecule of glucose:</p>
<ul><li>ATP used: <strong>2</strong> (phosphorylation of glucose to glucose phosphate, then a second phosphorylation);</li>
<li>ATP made: <strong>4</strong> (2 from each triose phosphate);</li>
<li><strong>net gain: 4 − 2 = 2 ATP</strong>;</li>
<li>reduced NAD formed: <strong>2</strong> (1 from each triose phosphate);</li>
<li>products: <strong>2 pyruvate</strong>. All 6 carbon atoms of glucose are in the two pyruvate (2 × 3), so <strong>no carbon dioxide is released</strong>.</li></ul>
<p>Always say what your numbers are counted per. Per glucose: net 2 ATP and 2 reduced NAD. Per triose phosphate (or per pyruvate formed): 2 ATP made and 1 reduced NAD. Exam answers lose marks by mixing the two, or by giving 4 ATP as the gain.</p>
<p>The reduced NAD carries hydrogen (and so energy) away from glycolysis. With oxygen, it is used in oxidative phosphorylation to make more ATP (3.3.3.3). Without oxygen, it must be oxidised back to NAD in another way, or glycolysis stops (3.3.3.2).</p>

<h2 data-stmt="${R}.s1">4. Evidence that glycolysis happens in the cytoplasm <span class="badge teal">required</span></h2>
<p>Cell fractionation (<a href="#/topic/3.1.2.1">3.1.2.1</a>) separates the organelles of broken cells. Testing each fraction separately shows where each stage of respiration takes place. Try the data questions below.</p>

<h2 data-stmt="${R}.s1 ${R}.s2">5. Common misconceptions <span class="badge teal">required</span></h2>
<ul><li><strong>"Glycolysis happens in the mitochondria."</strong> It happens in the <strong>cytoplasm</strong>; only pyruvate enters mitochondria, and only when oxygen is available.</li>
<li><strong>"Glycolysis is anaerobic respiration."</strong> Glycolysis is the first stage of <em>both</em> aerobic and anaerobic respiration.</li>
<li><strong>"Glycolysis makes 4 ATP."</strong> It makes 4 but uses 2, so the <strong>net gain is 2 ATP</strong> per glucose.</li>
<li><strong>"Glucose is oxidised by oxygen in glycolysis."</strong> Triose phosphate is oxidised by the removal of hydrogen, which is accepted by <strong>NAD</strong>. No oxygen is used.</li>
<li><strong>"Glycolysis releases carbon dioxide."</strong> No: the six carbon atoms of glucose end up in two pyruvate molecules.</li>
<li><strong>"Phosphorylation releases energy from glucose."</strong> Phosphorylation <em>uses</em> ATP; it makes glucose more reactive so it can be split.</li></ul>
${SOURCES}`,
    diagrams: [
      { id: `d-${R}-1`, title: "Where glycolysis fits in respiration", status: "draft", svg: Art.context(), alt: "Glucose enters the cytoplasm, where glycolysis converts it to two pyruvate with a net gain of 2 ATP and 2 reduced NAD. With oxygen, pyruvate enters a mitochondrion (aerobic respiration, 3.3.3.3); without oxygen it is converted in the cytoplasm to lactate, or to ethanol and carbon dioxide (anaerobic respiration, 3.3.3.2).", caption: "Glycolysis happens in the cytoplasm and is the first stage of both aerobic and anaerobic respiration. What happens to pyruvate next depends on whether oxygen is available. Schematic, not to scale." },
    ],
    interactives: [
      explorer,
      { kind: "checkpoint", title: "Where does glycolysis happen?", intro: `<p class="small">Hypothetical data. Liver cells were broken open and separated by cell fractionation. Each fraction was given a substrate and tested.</p>${FD}`, qids: [`q-${R}-d1`, `q-${R}-d2`] },
    ],
    examFocus: `<ul>
<li><strong>Location:</strong> glycolysis happens in the <strong>cytoplasm</strong>, in both aerobic and anaerobic respiration; it does not need oxygen.</li>
<li><strong>Phosphorylation:</strong> glucose is phosphorylated to glucose phosphate <em>using ATP</em> (2 ATP are used per glucose).</li>
<li><strong>Splitting:</strong> the phosphorylated six-carbon sugar splits into <strong>two triose phosphate</strong>.</li>
<li><strong>Oxidation:</strong> triose phosphate is <strong>oxidised to pyruvate</strong>; hydrogen is accepted by NAD, forming <strong>reduced NAD</strong>, and ATP is made.</li>
<li><strong>Numbers, per glucose:</strong> 4 ATP made, 2 used, <strong>net 2 ATP</strong>; <strong>2 reduced NAD</strong>; <strong>2 pyruvate</strong>; no CO₂. State the basis.</li>
<li><span class="badge">supporting</span> Hexose bisphosphate and substrate-level phosphorylation are not required, but using them correctly does no harm.</li></ul>`,
    synoptic: [
      { ref: "3.1.4.3", text: "ATP is made from ADP and phosphate by condensation; its hydrolysis releases energy for cell processes." },
      { ref: "3.1.1.2", text: "Glucose is a hexose monosaccharide; starch and glycogen are hydrolysed to glucose for respiration." },
      { ref: "3.1.2.1", text: "Cell fractionation separates mitochondria from the cytoplasm; mitochondria are the site of the aerobic stages, while glycolysis is in the cytoplasm." },
      { ref: "3.1.2.2", text: "Prokaryotic cells have no mitochondria, but they carry out glycolysis in their cytoplasm." },
      { ref: "3.3.2.2", text: "Triose phosphate is also made in the Calvin cycle of photosynthesis." },
      { ref: "3.3.3.2", text: "Without oxygen, pyruvate is converted to lactate or ethanol, regenerating NAD for glycolysis." },
      { ref: "3.3.3.3", text: "With oxygen, pyruvate enters the mitochondrial matrix; reduced NAD from glycolysis is used in oxidative phosphorylation." },
    ],
    quickCheck: [
      { id: `q-${R}-qc1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Where in the cell does glycolysis take place?", options: ["Cytoplasm", "Mitochondrial matrix", "Inner mitochondrial membrane", "Nucleus"], answer: 0, explanation: "The enzymes of glycolysis are in the cytoplasm." },
      { id: `q-${R}-qc2`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "What is the end product of glycolysis?", options: ["Pyruvate", "Lactate", "Carbon dioxide", "Acetylcoenzyme A"], answer: 0, explanation: "Glycolysis converts one glucose into two pyruvate." },
      { id: `q-${R}-qc3`, ref: R, stmts: S(2), type: "gap", marks: 1, stem: "Complete the sentence.", text: "At the start of glycolysis, glucose is phosphorylated using {{1}}.", answers: { 1: ["ATP", "adenosine triphosphate"] }, explanation: "ATP supplies the phosphate group and is hydrolysed to ADP." },
      { id: `q-${R}-qc4`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "What is the net gain of ATP from glycolysis, per molecule of glucose?", options: ["2", "4", "1", "38"], answer: 0, explanation: "4 ATP are made but 2 are used to phosphorylate glucose: a net gain of 2." },
      { id: `q-${R}-qc5`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Which types of respiration include glycolysis?", options: ["Aerobic and anaerobic respiration", "Only aerobic respiration, in mitochondria", "Only anaerobic respiration, without oxygen", "Neither: it is a separate process"], answer: 0, explanation: "Glycolysis is the first stage of both." },
    ],
    flashcards: [
      { id: `f-${R}-1`, front: "Where does glycolysis take place?", back: "In the cytoplasm." },
      { id: `f-${R}-2`, front: "Which types of respiration include glycolysis?", back: "Both aerobic and anaerobic respiration. It does not need oxygen." },
      { id: `f-${R}-3`, front: "What is the first step of glycolysis?", back: "Glucose is phosphorylated to glucose phosphate using ATP." },
      { id: `f-${R}-4`, front: "How many ATP are used per glucose at the start of glycolysis?", back: "Two (one per phosphorylation)." },
      { id: `f-${R}-5`, front: "What does the phosphorylated six-carbon sugar split into?", back: "Two molecules of triose phosphate (3 carbon atoms each)." },
      { id: `f-${R}-6`, front: "What happens to triose phosphate in glycolysis?", back: "It is oxidised (hydrogen removed) to pyruvate; NAD is reduced and ATP is made." },
      { id: `f-${R}-7`, front: "What accepts the hydrogen removed from triose phosphate?", back: "NAD, which becomes reduced NAD." },
      { id: `f-${R}-8`, front: "Products of glycolysis per glucose", back: "2 pyruvate, net 2 ATP and 2 reduced NAD." },
      { id: `f-${R}-9`, front: "Gross and net ATP from glycolysis per glucose", back: "4 ATP made, 2 used: net gain 2 ATP." },
      { id: `f-${R}-10`, front: "Is carbon dioxide released in glycolysis?", back: "No. All 6 carbon atoms of glucose end up in 2 pyruvate (2 × 3C)." },
      { id: `f-${R}-11`, front: "Why is glucose phosphorylated first?", back: "To make it more reactive so it can be split (it uses ATP; it does not release energy)." },
      { id: `f-${R}-12`, front: "How many carbon atoms in triose phosphate and in pyruvate?", back: "Three in each." },
      { id: `f-${R}-13`, front: "Per triose phosphate (or per pyruvate formed): ATP and reduced NAD", back: "2 ATP made and 1 reduced NAD (supporting: by substrate-level phosphorylation)." },
      { id: `f-${R}-14`, front: "What happens to pyruvate after glycolysis?", back: "With oxygen: enters the mitochondrion (3.3.3.3). Without oxygen: converted to lactate, or ethanol and CO₂ (3.3.3.2)." },
    ],
    questions: [
      // ---- checkpoint: fractionation data ----
      { id: `q-${R}-d1`, ref: R, stmts: S(1), type: "short", marks: 2, stem: "Data analysis. Use tubes A and B. What do these results show about where glycolysis takes place? Explain your answer. (2 marks)", scheme: [{ point: "Only the cytoplasm (tube A) produced pyruvate from glucose", marks: 1 }, { point: "So the enzymes of glycolysis are in the cytoplasm (not in mitochondria) / mitochondria cannot use glucose", marks: 1 }], model: "Glycolysis takes place in the cytoplasm. Pyruvate, the product of glycolysis, was formed only when glucose was added to the cytoplasm (tube A), not when it was added to mitochondria (tube B), so the enzymes of glycolysis must be in the cytoplasm.", commonErrors: "Saying glycolysis happens in mitochondria; describing the results without a conclusion." },
      { id: `q-${R}-d2`, ref: R, stmts: S(1, 2), type: "mcq", marks: 1, stem: "Data analysis. Mitochondria released carbon dioxide when given pyruvate (tube C) but not when given glucose (tube B). Which statement best explains this?", options: ["Glucose must first be converted to pyruvate in the cytoplasm", "Glucose is too large a molecule to be oxidised by any enzyme", "Mitochondria have no ATP to phosphorylate glucose with", "Glucose can only be respired anaerobically, never aerobically"], answer: 0, explanation: "Mitochondria cannot use glucose itself: glycolysis, in the cytoplasm, converts it to pyruvate, which then enters the mitochondria (3.3.3.3)." },
      // ---- sequence ----
      { id: `q-${R}-sq1`, ref: R, stmts: S(2), type: "sequence", marks: 2, stem: "Put the events of glycolysis in order.", steps: ["Glucose is phosphorylated using ATP", "The six-carbon sugar phosphate splits into two triose phosphate", "Triose phosphate is oxidised and NAD is reduced", "ATP is produced", "Two molecules of pyruvate are formed"], explanation: "Phosphorylation (using ATP) → splitting into 2 triose phosphate → oxidation (reduced NAD formed) → ATP made → 2 pyruvate." },
      // ---- MCQ ----
      { id: `q-${R}-m1`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Why is glucose phosphorylated at the start of glycolysis?", options: ["It makes glucose reactive enough to split", "It releases energy from glucose to make ATP", "It allows glucose to diffuse out of the cell", "It oxidises glucose directly to pyruvate"], answer: 0, explanation: "Phosphorylation uses ATP; the phosphorylated sugar is more reactive and splits into two triose phosphate." },
      { id: `q-${R}-m2`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "How many carbon atoms are there in one molecule of pyruvate?", options: ["3", "6", "2", "4"], answer: 0, explanation: "Glucose (6C) gives two pyruvate (3C each)." },
      { id: `q-${R}-m3`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Which describes the conversion of triose phosphate to pyruvate?", options: ["An oxidation that produces reduced NAD and ATP", "A reduction that uses reduced NAD", "A decarboxylation that releases carbon dioxide", "A phosphorylation that uses ATP"], answer: 0, explanation: "Hydrogen is removed from triose phosphate (oxidation) and accepted by NAD; ATP is made." },
      { id: `q-${R}-m4`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Which statement about glycolysis is correct?", options: ["It does not need oxygen", "It takes place in the mitochondrial matrix", "It releases carbon dioxide", "It produces most of the ATP in an aerobic cell"], answer: 0, explanation: "Glycolysis happens in the cytoplasm without oxygen, releases no CO₂ and gives only net 2 ATP per glucose; most ATP in aerobic cells comes from oxidative phosphorylation." },
      { id: `q-${R}-m5`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Calculation. A cell converts 50 molecules of glucose to pyruvate by glycolysis. How many ATP molecules are produced in total (not the net gain)?", options: ["200", "100", "50", "400"], answer: 0, explanation: "4 ATP are produced per glucose: 50 × 4 = 200. The net gain would be 50 × 2 = 100, because 100 ATP are used." },
      { id: `q-${R}-m6`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Counted per molecule of pyruvate formed (not per glucose), how many molecules of reduced NAD are produced in glycolysis?", options: ["1", "2", "0", "4"], answer: 0, explanation: "Each triose phosphate gives one pyruvate and reduces one NAD. Per glucose (two pyruvate) the figure is 2." },
      // ---- gap and match ----
      { id: `q-${R}-g1`, ref: R, stmts: S(1, 2), type: "gap", marks: 4, stem: "Complete the passage.", text: "Glycolysis takes place in the {{1}}. Glucose is {{2}} using ATP. The product splits into two molecules of {{3}}, which are oxidised to {{4}}.", answers: { 1: ["cytoplasm", "cytosol"], 2: ["phosphorylated"], 3: ["triose phosphate", "TP"], 4: ["pyruvate", "pyruvic acid"] }, explanation: "Cytoplasm; phosphorylated; triose phosphate; pyruvate." },
      { id: `q-${R}-mt1`, ref: R, stmts: S(2), type: "match", marks: 4, stem: "Match each molecule to its description.", pairs: [{ left: "Glucose phosphate", right: "Glucose with a phosphate group added from ATP" }, { left: "Triose phosphate", right: "3-carbon phosphorylated sugar formed when the 6-carbon sugar phosphate splits" }, { left: "Pyruvate", right: "3-carbon end product of glycolysis" }, { left: "Reduced NAD", right: "Formed when NAD accepts hydrogen from triose phosphate" }] },
      // ---- written answers ----
      { id: `q-${R}-s1`, ref: R, stmts: S(2), type: "short", marks: 2, stem: "Explain why the net gain of ATP in glycolysis is 2 molecules per glucose and not 4. (2 marks)", scheme: [{ point: "4 ATP are produced (2 per triose phosphate)", marks: 1 }, { point: "2 ATP are used to phosphorylate glucose (at the start)", marks: 1 }], model: "Four ATP are produced when the two triose phosphate molecules are oxidised to pyruvate, two from each. But two ATP were used at the start to phosphorylate glucose, so the net gain is 4 − 2 = 2 ATP per glucose.", commonErrors: "Saying 2 ATP are made; forgetting that everything after the split happens twice." },
      { id: `q-${R}-s2`, ref: R, stmts: S(1, 2), type: "short", marks: 4, stem: "Describe how glucose is converted to pyruvate in glycolysis. (4 marks)", scheme: [{ point: "Glucose is phosphorylated (to glucose phosphate) using ATP", marks: 1 }, { point: "It is split into two triose phosphate", marks: 1 }, { point: "Triose phosphate is oxidised to pyruvate / hydrogen removed and NAD reduced (reduced NAD formed)", marks: 1 }, { point: "ATP is produced, with a net gain of 2 ATP per glucose", marks: 1 }], model: "In the cytoplasm, glucose is phosphorylated to glucose phosphate using ATP; two ATP are used per glucose. The phosphorylated six-carbon sugar splits into two molecules of triose phosphate. Each triose phosphate is oxidised to pyruvate: hydrogen is removed and accepted by NAD, forming reduced NAD. ATP is produced in these reactions, giving a net gain of two ATP and two reduced NAD per glucose.", commonErrors: "Saying glucose is oxidised by oxygen; omitting the splitting step; giving 4 ATP as the gain." },
      { id: `q-${R}-s3`, ref: R, stmts: S(1), type: "short", marks: 2, stem: "Glycolysis is described as common to aerobic and anaerobic respiration. Explain what this means. (2 marks)", scheme: [{ point: "Glycolysis is the first stage of both / happens in both / does not need oxygen", marks: 1 }, { point: "Pyruvate then enters the mitochondrion (aerobic) or is converted to lactate or ethanol (anaerobic)", marks: 1 }], model: "Glycolysis is the first stage of both aerobic and anaerobic respiration, and it does not need oxygen, so it happens in the cytoplasm of every respiring cell. The pathways differ only after pyruvate is formed: with oxygen, pyruvate enters a mitochondrion; without oxygen it is converted to lactate, or to ethanol and carbon dioxide.", commonErrors: "Saying glycolysis is the same as anaerobic respiration." },
    ],
  };
})();
