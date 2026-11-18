// Authored content for 3.3.3.2 Anaerobic respiration (OxfordAQA 9610 v5.1, printed p.28; statements 3.3.3.2.s1 and s2
// in data/spec.js). Official wording: "In anaerobic respiration, pyruvate is converted to ethanol and carbon dioxide or
// to lactate using reduced NAD. NAD is regenerated in this way and may be used in further glycolysis."
// Phase 5 Batch 2, author A1 (2026-11-17), status draft. SUPPORTING only (labelled): ethanal as the intermediate of the
// ethanol pathway. Not included: enzyme names, the fate of lactate in the liver, oxygen debt. Aerobic respiration is
// A2's page 3.3.3.3 (linked, not taught here).
// Accounting uses B.fermentModel and B.glycoModel (data/content/_resp-art.js): basis per one glucose throughout; net 2
// ATP, all from glycolysis; lactate pathway 2 lactate, no CO2; ethanol pathway 2 ethanol and 2 CO2.
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  const R = "3.3.3.2";
  const S = (...n) => n.map((k) => `${R}.s${k}`);
  const Art = window.BIO.respArt;

  const SOURCES = `<p class="tiny muted"><strong>Sources</strong> (checked 17 November 2026): OxfordAQA International AS and A-level Biology (9610) specification v5.1, section 3.3.3.2. OpenStax <em>Biology 2e</em>, section 7.5, "Metabolism without Oxygen" (<a href="https://openstax.org/books/biology-2e/pages/7-5-metabolism-without-oxygen" target="_blank" rel="noopener">openstax.org</a>): pyruvate is reduced to lactate by reduced NAD in animals and some bacteria; in yeast, pyruvate loses carbon dioxide to form ethanal (acetaldehyde), which is reduced to ethanol; both regenerate NAD so glycolysis can continue. OpenStax <em>Biology</em>, section 7.2 (red blood cells rely on glycolysis). Plants in Action, 2nd edition (Australian Society of Plant Scientists), section 18.3.1, "Root respiration and anaerobic metabolism" (<a href="https://rseco.org/book/export/html/171.html" target="_blank" rel="noopener">rseco.org</a>): roots short of oxygen make ethanol and carbon dioxide, recycling reduced NAD to NAD. The extract results in section 5 are hypothetical, made up for practice.</p>`;

  const XD = `<table class="tbl"><thead><tr><th>Extract (no oxygen)</th><th>Glucose used (mmol)</th><th>Carbon dioxide (mmol)</th><th>Ethanol (mmol)</th><th>Lactate (mmol)</th></tr></thead><tbody>
<tr><td>A: yeast</td><td>1.0</td><td>2.0</td><td>2.0</td><td>0</td></tr>
<tr><td>B: mammalian muscle</td><td>1.0</td><td>0</td><td>0</td><td>2.0</td></tr></tbody></table>`;

  const model = { kind: "fermentModel", title: "NAD Regeneration Model",
    note: "A model cell with no oxygen and only a little NAD. Respire glucose one at a time and watch the NAD: first with no way to regenerate it (a hypothetical cell), then with the lactate or the ethanol pathway.",
    questions: [
      { id: `q-${R}-ix1`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Choose \"No way to regenerate NAD\" and respire glucose until nothing more happens. Why does glycolysis stop?", options: ["All the NAD is reduced, so none can accept hydrogen", "The cell has used up all of its glucose supply", "ATP builds up and stops the enzymes of glycolysis", "Pyruvate builds up and poisons the cell's enzymes"], answer: 0, explanation: "Glycolysis needs NAD to accept hydrogen when triose phosphate is oxidised. Once all the NAD is reduced, glycolysis cannot continue." },
      { id: `q-${R}-ix2`, ref: R, stmts: S(1), type: "gap", marks: 3, stem: "Choose the ethanol pathway and respire 10 glucose.", text: "From 10 glucose, the cell releases {{1}} molecules of carbon dioxide, makes {{2}} molecules of ethanol and gains {{3}} ATP (net).", answers: { 1: ["20", "twenty"], 2: ["20", "twenty"], 3: ["20", "twenty"] }, explanation: "Per glucose: 2 pyruvate, each giving 1 CO₂ and 1 ethanol, so 2 CO₂ and 2 ethanol; net 2 ATP from glycolysis. Multiply by 10." },
      { id: `q-${R}-ix3`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Choose the lactate pathway. How many molecules of carbon dioxide are released per glucose?", options: ["0", "1", "2", "6"], answer: 0, explanation: "Pyruvate (3C) is reduced directly to lactate (3C); no carbon is removed." },
      { id: `q-${R}-ix4`, ref: R, stmts: S(2), type: "short", marks: 2, stem: "The model shows that the lactate and ethanol pathways make no ATP. Explain why they are still useful to a cell without oxygen. (2 marks)", scheme: [{ point: "They oxidise reduced NAD / regenerate NAD", marks: 1 }, { point: "So glycolysis can continue (and keep producing ATP, net 2 per glucose)", marks: 1 }], model: "Converting pyruvate to lactate, or to ethanol and carbon dioxide, uses reduced NAD and so regenerates NAD. NAD is needed to accept hydrogen when triose phosphate is oxidised, so glycolysis can continue and the cell keeps gaining 2 ATP per glucose.", commonErrors: "Saying the pathways make ATP; saying they remove toxic pyruvate." },
    ] };

  window.BIO.content[R] = {
    status: "draft",
    keywords: ["anaerobic respiration", "fermentation", "lactate", "lactic acid", "ethanol", "ethanal", "carbon dioxide", "pyruvate", "reduced NAD", "NAD", "regenerate", "regeneration of NAD", "glycolysis", "yeast", "muscle", "oxygen"],
    notes: () => `
<div class="notice"><strong>What the specification requires (3.3.3.2).</strong> In anaerobic respiration, <strong>pyruvate is converted to ethanol and carbon dioxide, or to lactate, using reduced NAD</strong>. This <strong>regenerates NAD</strong>, which can be used in <strong>further glycolysis</strong>. <span class="badge teal">required</span> <span class="badge">supporting</span></div>

<h2 data-stmt="${R}.s1 ${R}.s2">1. Respiration without oxygen <span class="badge teal">required</span></h2>
<p>Glycolysis (<a href="#/topic/3.3.3.1">3.3.3.1</a>) happens in the cytoplasm and does not need oxygen. For each glucose it gives <strong>2 pyruvate</strong>, a <strong>net gain of 2 ATP</strong> and <strong>2 reduced NAD</strong>.</p>
<p>With oxygen, the reduced NAD is oxidised in the mitochondria, in oxidative phosphorylation (<a href="#/topic/3.3.3.3">3.3.3.3</a>). <strong>Without oxygen</strong> this cannot happen, so reduced NAD builds up. A cell contains only a small amount of NAD. If all of it were reduced, there would be nothing to accept hydrogen from triose phosphate, and <strong>glycolysis would stop</strong>: the cell would make no ATP at all.</p>
<p><strong>Anaerobic respiration</strong> solves this. Pyruvate (or a product made from it) accepts the hydrogen from reduced NAD, so <strong>NAD is regenerated</strong> and glycolysis can continue. There are two pathways.</p>

<h2 data-stmt="${R}.s1">2. Two pathways: lactate, or ethanol and carbon dioxide <span class="badge teal">required</span></h2>
<p><strong>Lactate pathway</strong> (animal cells, such as muscle cells working hard, and red blood cells, which have no mitochondria; some bacteria, such as <em>Lactobacillus</em> in yoghurt-making):</p>
<p style="text-align:center"><strong>pyruvate (3C) + reduced NAD → lactate (3C) + NAD</strong></p>
<p>Pyruvate is <strong>reduced</strong> to lactate. No carbon atoms are removed, so <strong>no carbon dioxide</strong> is released.</p>
<p><strong>Ethanol pathway</strong> (yeast, and plant cells such as root cells in waterlogged soil):</p>
<p style="text-align:center"><strong>pyruvate (3C) + reduced NAD → ethanol (2C) + carbon dioxide (1C) + NAD</strong></p>
<p><span class="badge">supporting</span> This happens in two steps: pyruvate first loses carbon dioxide, forming ethanal (2C); ethanal is then reduced to ethanol by reduced NAD.</p>
<p>The figure compares the two pathways, with their carbon atoms.</p>

<h2 data-stmt="${R}.s2 ${R}.s1">3. Why it matters: NAD is regenerated <span class="badge teal">required</span></h2>
<p>Neither pathway makes any ATP. Their job is to <strong>oxidise reduced NAD back to NAD</strong>, so that NAD can accept hydrogen again when triose phosphate is oxidised, and <strong>glycolysis can continue</strong>. So:</p>
<ul><li>anaerobic respiration gives a net gain of <strong>2 ATP per glucose</strong>, all from glycolysis;</li>
<li>the NAD keeps cycling between glycolysis and the anaerobic pathway: <strong>reduced in glycolysis, regenerated by the pathway</strong>.</li></ul>
<p>Use the model to see what happens to the NAD with and without a way to regenerate it.</p>

<h2 data-stmt="${R}.s1 ${R}.s2">4. Comparing the pathways <span class="badge teal">required</span></h2>
<table class="tbl"><thead><tr><th>Per glucose</th><th>Lactate pathway</th><th>Ethanol pathway</th></tr></thead><tbody>
<tr><td>Where</td><td>Cytoplasm of animal cells; some bacteria</td><td>Cytoplasm of yeast and plant cells</td></tr>
<tr><td>Products from 2 pyruvate</td><td>2 lactate</td><td>2 ethanol + 2 carbon dioxide</td></tr>
<tr><td>Reduced NAD used (NAD regenerated)</td><td>2</td><td>2</td></tr>
<tr><td>ATP made by the pathway itself</td><td>0</td><td>0</td></tr>
<tr><td>Net ATP for anaerobic respiration</td><td>2 (from glycolysis)</td><td>2 (from glycolysis)</td></tr></tbody></table>
<p>Anaerobic respiration releases far less ATP per glucose than aerobic respiration because pyruvate is not oxidised any further: most of the chemical energy of glucose is still in the lactate or ethanol. The aerobic stages, which release the rest, are in <a href="#/topic/3.3.3.3">3.3.3.3</a>.</p>

<h2 data-stmt="${R}.s1 ${R}.s2">5. Using data on anaerobic respiration <span class="badge teal">required</span></h2>
<p>Data questions often give the amounts of products formed and ask you to identify the pathway or to work out the reduced NAD used. Check: one glucose gives two pyruvate, and each pyruvate uses one reduced NAD.</p>
<p>Try the data questions below.</p>
<p>Then try the challenge: six cells, each respiring without oxygen.</p>

<h2 data-stmt="${R}.s1 ${R}.s2">6. Common misconceptions <span class="badge teal">required</span></h2>
<ul><li><strong>"Anaerobic respiration makes more ATP in the lactate (or ethanol) step."</strong> The pathways make <strong>no ATP</strong>; all of the net 2 ATP comes from glycolysis.</li>
<li><strong>"Lactate is made to get rid of pyruvate."</strong> The point is to <strong>regenerate NAD</strong> so glycolysis can continue.</li>
<li><strong>"Muscle cells produce ethanol and carbon dioxide."</strong> Animal cells use the lactate pathway; <strong>no carbon dioxide</strong> is released.</li>
<li><strong>"Pyruvate is oxidised to lactate."</strong> Pyruvate is <strong>reduced</strong>: it gains hydrogen from reduced NAD.</li>
<li><strong>"Anaerobic respiration happens in mitochondria."</strong> Both glycolysis and the anaerobic pathways happen in the <strong>cytoplasm</strong>.</li>
<li><strong>"Yeast respires only anaerobically."</strong> Yeast respires aerobically when oxygen is available; it uses the ethanol pathway when oxygen is short.</li></ul>
${SOURCES}`,
    diagrams: [
      { id: `d-${R}-1`, title: "The two anaerobic pathways", status: "draft", svg: Art.pathways(), alt: "Lactate pathway: pyruvate (3 carbon atoms) is reduced by reduced NAD to lactate (3 carbon atoms), forming NAD; no carbon dioxide. Ethanol pathway: pyruvate (3 carbon atoms) loses carbon dioxide to form ethanal (2 carbon atoms, supporting), which is reduced by reduced NAD to ethanol (2 carbon atoms), forming NAD.", caption: "Both pathways happen in the cytoplasm and use reduced NAD, regenerating NAD for glycolysis; only the ethanol pathway releases carbon dioxide. Schematic." },
    ],
    interactives: [
      model,
      { kind: "checkpoint", title: "Comparing two extracts", intro: `<p class="small">Hypothetical data. Extracts of yeast and of mammalian muscle were each given glucose and kept without oxygen. The products were measured.</p>${XD}`, qids: [`q-${R}-d1`, `q-${R}-d2`, `q-${R}-d3`] },
      { kind: "fermentChallenge", title: "Anaerobic Respiration Challenge", note: "For each cell, choose the pathway and work out the numbers, then press Check. Everything is per the glucose stated." },
    ],
    examFocus: `<ul>
<li><strong>Lactate pathway</strong> (animals, some bacteria): pyruvate is converted (reduced) to lactate using reduced NAD. No CO₂.</li>
<li><strong>Ethanol pathway</strong> (yeast, plants): pyruvate is converted to ethanol <em>and carbon dioxide</em> using reduced NAD.</li>
<li><strong>Purpose:</strong> say that <strong>NAD is regenerated</strong> (reduced NAD is oxidised) <strong>so that glycolysis can continue</strong>, and so the cell still gains ATP. Both halves are needed for full marks.</li>
<li><strong>ATP:</strong> net 2 ATP per glucose, from glycolysis only; the pathways themselves make none.</li>
<li><strong>Location:</strong> the cytoplasm, as for glycolysis.</li>
<li><span class="badge">supporting</span> Ethanal is the intermediate in the ethanol pathway; you do not need to name it.</li></ul>`,
    synoptic: [
      { ref: "3.3.3.1", text: "Glycolysis reduces NAD when triose phosphate is oxidised to pyruvate; it needs a supply of NAD to continue." },
      { ref: "3.3.3.3", text: "With oxygen, reduced NAD is oxidised in oxidative phosphorylation, and pyruvate is oxidised completely in the mitochondria." },
      { ref: "3.3.3.4", text: "Respiratory quotients: yeast respiring anaerobically releases carbon dioxide but uses no oxygen." },
      { ref: "3.1.4.3", text: "ATP is the immediate source of energy; anaerobic respiration supplies only a little of it." },
      { ref: "3.1.2.2", text: "Many bacteria respire anaerobically; Lactobacillus uses the lactate pathway." },
    ],
    quickCheck: [
      { id: `q-${R}-qc1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "What is pyruvate converted to in a muscle cell respiring anaerobically?", options: ["Lactate", "Ethanol and carbon dioxide", "Carbon dioxide and water", "Glucose"], answer: 0, explanation: "Animal cells use the lactate pathway." },
      { id: `q-${R}-qc2`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "What are the products of anaerobic respiration in yeast?", options: ["Ethanol and carbon dioxide", "Lactate only", "Lactate and carbon dioxide", "Carbon dioxide and water"], answer: 0, explanation: "Yeast uses the ethanol pathway: pyruvate → ethanol + carbon dioxide." },
      { id: `q-${R}-qc3`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Which substance is used to convert pyruvate to lactate?", options: ["Reduced NAD", "ATP", "Oxygen", "NAD"], answer: 0, explanation: "Reduced NAD supplies the hydrogen that reduces pyruvate, and becomes NAD." },
      { id: `q-${R}-qc4`, ref: R, stmts: S(2), type: "mcq", marks: 1, stem: "Why is it important that pyruvate is converted to lactate or ethanol when there is no oxygen?", options: ["It regenerates NAD for glycolysis to continue", "It produces extra ATP in the cell's cytoplasm", "It releases the chemical energy stored in pyruvate", "It removes carbon dioxide from the cytoplasm"], answer: 0, explanation: "NAD is needed to accept hydrogen in glycolysis." },
      { id: `q-${R}-qc5`, ref: R, stmts: S(1, 2), type: "mcq", marks: 1, stem: "How many ATP molecules are made when one pyruvate is converted to lactate?", options: ["0", "1", "2", "4"], answer: 0, explanation: "None: the pathway regenerates NAD but makes no ATP." },
    ],
    flashcards: [
      { id: `f-${R}-1`, front: "Lactate pathway: the reaction", back: "Pyruvate + reduced NAD → lactate + NAD." },
      { id: `f-${R}-2`, front: "Ethanol pathway: the products", back: "Ethanol and carbon dioxide (and NAD is regenerated)." },
      { id: `f-${R}-3`, front: "Which cells use the lactate pathway?", back: "Animal cells (e.g. muscle, red blood cells) and some bacteria (e.g. Lactobacillus)." },
      { id: `f-${R}-4`, front: "Which cells use the ethanol pathway?", back: "Yeast and plant cells (e.g. roots in waterlogged soil)." },
      { id: `f-${R}-5`, front: "Role of reduced NAD in anaerobic respiration", back: "It supplies the hydrogen that reduces pyruvate (or ethanal), and is oxidised to NAD." },
      { id: `f-${R}-6`, front: "Why must NAD be regenerated?", back: "NAD accepts hydrogen when triose phosphate is oxidised; without it glycolysis stops and no ATP is made." },
      { id: `f-${R}-7`, front: "ATP made by the lactate or ethanol step", back: "None." },
      { id: `f-${R}-8`, front: "Net ATP per glucose in anaerobic respiration", back: "2, all from glycolysis." },
      { id: `f-${R}-9`, front: "Carbon dioxide per glucose: lactate and ethanol pathways", back: "Lactate pathway 0; ethanol pathway 2." },
      { id: `f-${R}-10`, front: "Is pyruvate oxidised or reduced to lactate?", back: "Reduced: it gains hydrogen from reduced NAD." },
      { id: `f-${R}-11`, front: "Intermediate in the ethanol pathway (supporting)", back: "Ethanal (2C): pyruvate loses CO₂ to form ethanal, which is reduced to ethanol." },
      { id: `f-${R}-12`, front: "Where does anaerobic respiration take place?", back: "In the cytoplasm." },
      { id: `f-${R}-13`, front: "Why does anaerobic respiration give much less ATP than aerobic?", back: "Pyruvate is not oxidised further; most of the energy stays in lactate or ethanol." },
      { id: `f-${R}-14`, front: "Carbon atoms: pyruvate, lactate, ethanol", back: "Pyruvate 3, lactate 3, ethanol 2 (the third carbon leaves as CO₂)." },
    ],
    questions: [
      // ---- checkpoint: extract data ----
      { id: `q-${R}-d1`, ref: R, stmts: S(1), type: "short", marks: 2, stem: "Data analysis. Explain why extract B released no carbon dioxide. (2 marks)", scheme: [{ point: "Pyruvate is converted (reduced) to lactate", marks: 1 }, { point: "No carbon is removed / 3C pyruvate gives 3C lactate / CO₂ is removed only in the ethanol pathway", marks: 1 }], model: "Muscle cells use the lactate pathway: pyruvate is reduced directly to lactate by reduced NAD. Pyruvate and lactate both have three carbon atoms, so no carbon is removed and no carbon dioxide is released. Carbon dioxide is released only in the ethanol pathway, as in yeast.", commonErrors: "Saying the CO₂ was used up; saying no respiration happened." },
      { id: `q-${R}-d2`, ref: R, stmts: S(1, 2), type: "gap", marks: 1, stem: "Data analysis. Use the results for extract A.", text: "For each mmol of glucose used, extract A oxidised {{1}} mmol of reduced NAD to NAD.", answers: { 1: ["2", "2.0", "two"] }, explanation: "1 mmol glucose → 2 mmol pyruvate → 2 mmol ethanol, each using one reduced NAD: 2 mmol." },
      { id: `q-${R}-d3`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Data analysis. In extract A, what fraction of the carbon atoms in the glucose used ends up in ethanol?", options: ["Two thirds", "One third", "All of it", "One half"], answer: 0, explanation: "1 glucose (6C) → 2 ethanol (2 × 2C = 4C) + 2 CO₂ (2C). 4 of 6 = two thirds; the other third is in carbon dioxide." },
      // ---- sequence ----
      { id: `q-${R}-sq1`, ref: R, stmts: S(1, 2), type: "sequence", marks: 2, stem: "Put the events in a yeast cell respiring anaerobically in order.", steps: ["Glucose is converted to pyruvate in glycolysis, reducing NAD", "Carbon dioxide is removed from pyruvate", "Reduced NAD reduces the two-carbon product to ethanol, regenerating NAD", "NAD is used again in glycolysis"], explanation: "Glycolysis → CO₂ removed from pyruvate → the two-carbon product (ethanal, supporting) is reduced to ethanol by reduced NAD, regenerating NAD → NAD reused in glycolysis." },
      // ---- MCQ ----
      { id: `q-${R}-m1`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Which substance is released in the ethanol pathway but not in the lactate pathway?", options: ["Carbon dioxide", "NAD", "Pyruvate", "ATP"], answer: 0, explanation: "Both pathways regenerate NAD; only the ethanol pathway removes carbon dioxide from pyruvate." },
      { id: `q-${R}-m2`, ref: R, stmts: S(1, 2), type: "mcq", marks: 1, stem: "What is the net gain of ATP per glucose in anaerobic respiration?", options: ["2", "4", "0", "6"], answer: 0, explanation: "Net 2 ATP from glycolysis; the lactate or ethanol step adds none." },
      { id: `q-${R}-m3`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "Why does anaerobic respiration produce much less ATP per glucose than aerobic respiration?", options: ["Pyruvate is not fully oxidised, so energy stays in the products", "Anaerobic respiration uses up more ATP than glycolysis makes", "Glycolysis cannot take place at all when oxygen is absent", "NAD is not regenerated, so glycolysis soon has to stop"], answer: 0, explanation: "Only glycolysis yields ATP; the energy still in lactate or ethanol is released only by the aerobic stages (3.3.3.3)." },
      { id: `q-${R}-m4`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "In the lactate pathway, what happens to pyruvate?", options: ["It is reduced, gaining hydrogen from reduced NAD", "It is oxidised, giving its hydrogen to NAD", "It is decarboxylated, losing carbon dioxide", "It is phosphorylated, gaining phosphate from ATP"], answer: 0, explanation: "Pyruvate accepts hydrogen from reduced NAD, so it is reduced to lactate." },
      { id: `q-${R}-m5`, ref: R, stmts: S(1), type: "mcq", marks: 1, stem: "How many molecules of carbon dioxide are released per glucose in the ethanol pathway?", options: ["2", "1", "0", "6"], answer: 0, explanation: "Each glucose gives 2 pyruvate; each pyruvate loses one CO₂." },
      // ---- gap and match ----
      { id: `q-${R}-g1`, ref: R, stmts: S(1, 2), type: "gap", marks: 4, stem: "Complete the passage.", text: "In a muscle cell without oxygen, pyruvate is converted to {{1}} using {{2}}. This regenerates {{3}} so that {{4}} can continue.", answers: { 1: ["lactate", "lactic acid"], 2: ["reduced NAD", "NADH", "NADH2"], 3: ["NAD", "NAD+", "oxidised NAD"], 4: ["glycolysis"] }, explanation: "Lactate; reduced NAD; NAD; glycolysis." },
      { id: `q-${R}-mt1`, ref: R, stmts: S(1, 2), type: "match", marks: 4, stem: "Match each term to its description.", pairs: [{ left: "Lactate pathway", right: "Used by animal cells; releases no carbon dioxide" }, { left: "Ethanol pathway", right: "Used by yeast and plant cells; releases carbon dioxide" }, { left: "Reduced NAD", right: "Supplies the hydrogen used to reduce pyruvate or ethanal" }, { left: "NAD", right: "Regenerated by the pathway; needed to oxidise triose phosphate" }] },
      // ---- written answers ----
      { id: `q-${R}-s1`, ref: R, stmts: S(2), type: "short", marks: 3, stem: "Explain why it is important that pyruvate is converted to lactate in muscle cells when oxygen is in short supply. (3 marks)", scheme: [{ point: "Reduced NAD is oxidised / NAD is regenerated", marks: 1 }, { point: "NAD is needed to accept hydrogen when triose phosphate is oxidised (in glycolysis)", marks: 1 }, { point: "So glycolysis continues and produces (net 2) ATP", marks: 1 }], model: "Converting pyruvate to lactate uses reduced NAD, so NAD is regenerated. NAD is needed to accept hydrogen when triose phosphate is oxidised to pyruvate in glycolysis. So glycolysis can continue, and the muscle keeps gaining a net 2 ATP per glucose even without oxygen.", commonErrors: "Saying lactate production makes ATP; not linking NAD to glycolysis." },
      { id: `q-${R}-s2`, ref: R, stmts: S(1), type: "short", marks: 2, stem: "Yeast respiring anaerobically releases carbon dioxide, but a muscle cell respiring anaerobically does not. Explain this difference. (2 marks)", scheme: [{ point: "In yeast, pyruvate loses carbon dioxide (forming ethanal, which becomes ethanol)", marks: 1 }, { point: "In muscle, pyruvate is reduced directly to lactate, so no carbon dioxide is removed", marks: 1 }], model: "Yeast uses the ethanol pathway: carbon dioxide is removed from each pyruvate, and the two-carbon ethanal formed is reduced to ethanol. Muscle uses the lactate pathway: pyruvate is reduced directly to lactate, which still has all three carbon atoms, so no carbon dioxide is released.", commonErrors: "Saying muscle cells do not respire anaerobically; saying the CO₂ is used to make lactate." },
      { id: `q-${R}-e1`, ref: R, stmts: S(1, 2), type: "extended", marks: 6, stem: "Extended response. Compare anaerobic respiration in a muscle cell and in a yeast cell. (6 marks)", scheme: [{ point: "Both start with glycolysis in the cytoplasm (glucose → pyruvate)", marks: 1 }, { point: "Both gain a net 2 ATP per glucose, from glycolysis only (the pathways make no ATP)", marks: 1 }, { point: "Both use reduced NAD to reduce pyruvate (muscle) or ethanal (yeast)", marks: 1 }, { point: "Both regenerate NAD so that glycolysis can continue", marks: 1 }, { point: "Muscle: pyruvate → lactate, with no carbon dioxide", marks: 1 }, { point: "Yeast: pyruvate → ethanol and carbon dioxide (via ethanal)", marks: 1 }], levels: "Level 3 (5–6): similarities and differences both described, with the regeneration of NAD linked to glycolysis continuing, and correct products and ATP. Level 2 (3–4): correct products for both cells and at least one similarity, with some explanation. Level 1 (1–2): some correct products or statements, without comparison.", model: "In both cells, anaerobic respiration begins with glycolysis in the cytoplasm, where glucose is converted to two pyruvate with a net gain of two ATP and two reduced NAD. In both, pyruvate is then converted to another product using reduced NAD, which regenerates NAD so that glycolysis can continue; neither pathway makes any more ATP, so both cells gain only two ATP per glucose. The pathways differ. In a muscle cell, pyruvate is reduced directly to lactate, and no carbon dioxide is released. In a yeast cell, carbon dioxide is removed from pyruvate to form ethanal, which is reduced by reduced NAD to ethanol, so the products are ethanol and carbon dioxide.", commonErrors: "Describing only differences; saying the pathways make ATP; giving muscle ethanol or carbon dioxide." },
    ],
  };
})();
