// Topic consolidation for 3.1.1 Biological molecules (3.1.1.1 to 3.1.1.4).
// Not a duplicate of the subsection questions: the assessment questions below are new and are tagged to the
// subsection they test so that the progress system can attribute them without double counting.
window.BIO = window.BIO || {}; window.BIO.consolidation = window.BIO.consolidation || {};
(function () {
  const INK = "#16263a", GREY = "#6b7d8f";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 600}" fill="${o.c || INK}">${s}</text>`;

  // ---- Interactive concept map (nodes are links) ----
  const node = (x, y, w, h, href, title, sub, fill, stroke) => `<a href="${href}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${T(x, y - 2, title, { s: 13, w: 700 })}${sub ? T(x, y + 14, sub, { s: 10, w: 500, c: GREY }) : ""}</a>`;
  const edge = (x1, y1, x2, y2, label) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b9c9c4" stroke-width="2"/>` + (label ? `<rect x="${(x1 + x2) / 2 - 46}" y="${(y1 + y2) / 2 - 9}" width="92" height="16" rx="8" fill="#fff"/>` + T((x1 + x2) / 2, (y1 + y2) / 2 + 4, label, { s: 10, w: 500, c: GREY }) : "");
  const conceptMap = `<svg viewBox="0 0 760 420" width="760" role="img" aria-label="concept map of biological molecules; each box is a link">
    ${edge(380, 70, 140, 180, "glycosidic bonds")}${edge(380, 70, 380, 180, "ester bonds")}${edge(380, 70, 620, 180, "peptide bonds")}
    ${edge(140, 210, 140, 330)}${edge(380, 210, 380, 330)}${edge(620, 210, 620, 330)}
    ${node(380, 70, 300, 56, "#/topic/3.1.1.1", "3.1.1.1 Monomers and polymers", "condensation joins · hydrolysis splits", "#d6efec", "#1f8a8a")}
    ${node(140, 195, 230, 60, "#/topic/3.1.1.2", "3.1.1.2 Carbohydrates", "monosaccharides → di-/polysaccharides", "#e2efe6", "#6b9a7f")}
    ${node(380, 195, 230, 60, "#/topic/3.1.1.3", "3.1.1.3 Lipids", "glycerol + fatty acids → triglycerides", "#fbf0d8", "#c8902a")}
    ${node(620, 195, 230, 60, "#/topic/3.1.1.4", "3.1.1.4 Proteins", "amino acids → polypeptides → 4 levels", "#e4ebf5", "#1e3a5f")}
    ${node(140, 345, 200, 50, "#/topic/3.1.1.2", "Benedict's · iodine", "tests for sugars and starch", "#fff", "#6b9a7f")}
    ${node(380, 345, 200, 50, "#/topic/3.1.1.3", "Emulsion test", "ethanol then water", "#fff", "#c8902a")}
    ${node(620, 345, 200, 50, "#/topic/3.1.1.4", "Biuret test", "NaOH + CuSO₄ → purple", "#fff", "#1e3a5f")}
    ${T(380, 395, "Structure determines function:", { s: 11, w: 700, c: GREY })}${T(380, 411, "compact helix (starch) · hydrogen-bonded fibres (cellulose) · hydrophobic tails (lipids) · folded active sites (proteins)", { s: 11, w: 500, c: GREY })}
  </svg>`;

  const summaryHTML = `
<h2>How the topic fits together</h2>
<p>Everything in 3.1.1 is one idea applied three times. Small molecules (monomers) are joined by <strong>condensation</strong>, which removes water and forms a covalent bond, and are separated again by <strong>hydrolysis</strong>, which adds water. The bond has a different name in each group, but the chemistry is the same. The second idea is that the <strong>structure</strong> of the resulting molecule explains its <strong>function</strong>.</p>
<table><tr><th></th><th>Carbohydrates</th><th>Lipids</th><th>Proteins</th></tr>
<tr><th>Monomer / units</th><td>Monosaccharides (glucose, fructose)</td><td>Not a polymer: glycerol + fatty acids</td><td>Amino acids (20 types, differing in R group)</td></tr>
<tr><th>Bond formed by condensation</th><td>Glycosidic</td><td>Ester</td><td>Peptide</td></tr>
<tr><th>Small product</th><td>Disaccharide (maltose, sucrose)</td><td>Triglyceride (3 fatty acids) or phospholipid (2 + phosphate)</td><td>Dipeptide</td></tr>
<tr><th>Large product</th><td>Polysaccharide (starch: amylose + amylopectin; cellulose)</td><td>—</td><td>Polypeptide, folded into secondary, tertiary, quaternary structure</td></tr>
<tr><th>Structure → function</th><td>α-glucose helix: compact store; β-glucose straight chains with hydrogen bonds: strength</td><td>C–H rich tails: energy; hydrophobic: insoluble; phosphate head: bilayer</td><td>Sequence fixes R groups → bonds → 3D shape → complementary site</td></tr>
<tr><th>Weak bonds that matter</th><td>Hydrogen bonds between cellulose chains</td><td>Hydrophobic interactions in bilayers</td><td>Hydrogen and ionic bonds in secondary/tertiary structure (broken by heat)</td></tr>
<tr><th>Test</th><td>Benedict's (reducing; non-reducing after acid hydrolysis); iodine for starch</td><td>Emulsion test (ethanol, then water)</td><td>Biuret (NaOH + CuSO₄, lilac/purple)</td></tr>
<tr><th>Hydrolysed by (3.2.2.2)</th><td>Amylase, disaccharidases</td><td>Lipase</td><td>Endo-, exo- and dipeptidases</td></tr></table>
<h3>Counting rules worth memorising</h3>
<ul><li>n monomers in a chain → n − 1 bonds → n − 1 water molecules released.</li><li>Triglyceride: 3 ester bonds, 3 water. Phospholipid: 2 fatty acid ester bonds.</li><li>Each C=C double bond in a fatty acid removes 2 hydrogens from the formula.</li></ul>
<h3>The three "explain" arguments examiners expect</h3>
<ol><li><strong>Starch v cellulose</strong>: α v β glucose → helix v straight chain → store v structure.</li><li><strong>Triglyceride v phospholipid</strong>: 3 tails v 2 tails + phosphate → wholly hydrophobic v two-ended → store v membrane.</li><li><strong>Protein shape</strong>: primary sequence → R-group bonding → tertiary fold → complementary site; heat or a mutation changes the fold and destroys function.</li></ol>`;

  // ---- Combined deck: a curated selection of existing cards (by id) plus cross-topic cards ----
  const deckIds = [
    "f-3.1.1.1-1", "f-3.1.1.1-2", "f-3.1.1.1-3", "f-3.1.1.1-5", "f-3.1.1.1-6",
    "f-3.1.1.2-1", "f-3.1.1.2-2", "f-3.1.1.2-3", "f-3.1.1.2-4", "f-3.1.1.2-5", "f-3.1.1.2-6", "f-3.1.1.2-7", "f-3.1.1.2-8", "f-3.1.1.2-9", "f-3.1.1.2-10",
    "f-3.1.1.3-1", "f-3.1.1.3-2", "f-3.1.1.3-3", "f-3.1.1.3-4", "f-3.1.1.3-5", "f-3.1.1.3-6", "f-3.1.1.3-7", "f-3.1.1.3-8", "f-3.1.1.3-9", "f-3.1.1.3-10", "f-3.1.1.3-11",
    "f-3.1.1.4-1", "f-3.1.1.4-2", "f-3.1.1.4-3", "f-3.1.1.4-4", "f-3.1.1.4-6", "f-3.1.1.4-7", "f-3.1.1.4-8", "f-3.1.1.4-9", "f-3.1.1.4-10", "f-3.1.1.4-11", "f-3.1.1.4-13", "f-3.1.1.4-14", "f-3.1.1.4-15", "f-3.1.1.4-16",
  ];
  const extraCards = [
    { id: "f-3.1.1-x1", ref: "3.1.1.1", front: "Name the bond formed by condensation in (a) carbohydrates, (b) lipids, (c) proteins.", back: "(a) glycosidic, (b) ester, (c) peptide. All are covalent and all form with the loss of one water molecule." },
    { id: "f-3.1.1-x2", ref: "3.1.1.1", front: "Which of carbohydrates, lipids and proteins are true polymers, and why is the exception not one?", back: "Polysaccharides and polypeptides are polymers of repeating monomers. Triglycerides are not: they are one glycerol plus three fatty acids, with no repeating unit." },
    { id: "f-3.1.1-x3", ref: "3.1.1.2", front: "Which biochemical test needs heating, and which must not be heated?", back: "Benedict's test needs heating (water bath). The biuret test must not be heated; the emulsion and iodine tests need no heat either." },
    { id: "f-3.1.1-x4", ref: "3.1.1.4", front: "Compare the role of hydrogen bonds in cellulose and in proteins.", back: "In cellulose, hydrogen bonds between parallel β-glucose chains build strong microfibrils. In proteins, hydrogen bonds between backbone groups hold secondary structure and between R groups help hold tertiary structure; they break on heating." },
    { id: "f-3.1.1-x5", ref: "3.1.1.3", front: "Why are polysaccharides and triglycerides both good storage molecules?", back: "Both are insoluble so they do not affect water potential, and both are compact; triglycerides also store about twice the energy per gram because of their many C–H bonds." },
    { id: "f-3.1.1-x6", ref: "3.1.1.1", front: "A molecule contains 12 glucose units. How many water molecules were released in forming it, and how many are needed to hydrolyse it completely?", back: "11 released during condensation; 11 needed for complete hydrolysis (n − 1)." },
    { id: "f-3.1.1-x7", ref: "3.1.1.4", front: "Which bonds break during protein denaturation, and which type of bond in 3.1.1 is never broken by moderate heat?", back: "Hydrogen and ionic bonds break; covalent bonds (peptide, glycosidic, ester, disulfide) survive moderate heating." },
    { id: "f-3.1.1-x8", ref: "3.1.1.2", front: "You are given an unknown white powder. Outline how you would find out whether it is starch, a reducing sugar, a lipid or a protein.", back: "For the lipid test, shake a dry sample of the powder with ethanol, then pour into water (cloudy white emulsion = lipid). Dissolve or suspend the rest in water and split it into three samples: iodine (blue-black = starch); Benedict's with heat (brick red = reducing sugar); NaOH then CuSO₄ (purple = protein)." },
  ];

  // ---- 45-mark topic assessment ----
  const questions = [
    // Section A: knowledge recall (MCQ, 6 marks)
    { id: "q-3.1.1-A1", ref: "3.1.1.1", stmts: ["3.1.1.1.s3"], type: "mcq", marks: 1, stem: "Which statement describes a hydrolysis reaction?", options: ["Two molecules join and a molecule of water is released", "A bond is broken using a molecule of water", "A bond is formed using ATP", "Water is produced by oxidising hydrogen"], answer: 1, explanation: "Hydrolysis splits a bond by adding water; condensation releases water." },
    { id: "q-3.1.1-A2", ref: "3.1.1.2", stmts: ["3.1.1.2.s5"], type: "mcq", marks: 1, stem: "Sucrose is formed from", options: ["two α-glucose molecules", "α-glucose and fructose", "β-glucose and galactose", "glucose and glycerol"], answer: 1, explanation: "Sucrose = α-glucose + fructose, joined by a glycosidic bond." },
    { id: "q-3.1.1-A3", ref: "3.1.1.3", stmts: ["3.1.1.3.s3"], type: "mcq", marks: 1, stem: "A phospholipid differs from a triglyceride in that one fatty acid is replaced by", options: ["a glycerol molecule", "a glucose molecule", "a phosphate-containing group", "an amino group"], answer: 2, explanation: "Phosphate head + two fatty acid tails." },
    { id: "q-3.1.1-A4", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s5"], type: "mcq", marks: 1, stem: "The secondary structure of a protein is held together by", options: ["peptide bonds", "hydrogen bonds between backbone C=O and N–H groups", "disulfide bridges", "ionic bonds between R groups"], answer: 1, explanation: "α-helix and β-sheet: backbone hydrogen bonds only." },
    { id: "q-3.1.1-A5", ref: "3.1.1.2", stmts: ["3.1.1.2.s9"], type: "mcq", marks: 1, stem: "The strength of cellulose fibres comes mainly from", options: ["α-1,6 branches", "its helical shape", "hydrogen bonds between parallel chains forming microfibrils", "its solubility in water"], answer: 2, explanation: "Straight β-1,4 chains hydrogen bond side by side." },
    { id: "q-3.1.1-A6", ref: "3.1.1.3", stmts: ["3.1.1.3.s5"], type: "mcq", marks: 1, stem: "Which observation shows a positive emulsion test?", options: ["Blue-black colour", "Brick-red precipitate", "Lilac colour", "Cloudy white emulsion"], answer: 3, explanation: "Lipid droplets dispersed in water scatter light." },
    // Section B: structure and bonding
    { id: "q-3.1.1-B1", ref: "3.1.1.1", stmts: ["3.1.1.1.s2"], type: "gap", marks: 3, stem: "Complete the passage.", text: "Monosaccharides, amino acids and fatty acids all take part in {{1}} reactions, in which a molecule of {{2}} is removed as a covalent bond forms. Joining 20 amino acids in a chain releases {{3}} molecules of water.", answers: { 1: ["condensation"], 2: ["water", "h2o"], 3: ["19", "nineteen"] }, explanation: "Condensation; water; n − 1 = 19." },
    { id: "q-3.1.1-B2", ref: "3.1.1.3", stmts: ["3.1.1.3.s1", "3.1.1.3.s2", "3.1.1.3.s3"], type: "gap", marks: 3, stem: "Complete the passage about lipids.", text: "In a triglyceride, each fatty acid is joined to glycerol by an {{1}} bond. A fatty acid whose hydrocarbon chain contains one or more C=C double bonds is described as {{2}}. In water, the {{3}} phosphate heads of phospholipids face outwards and the fatty acid tails face inwards.", answers: { 1: ["ester"], 2: ["unsaturated"], 3: ["hydrophilic", "polar"] }, explanation: "Ester; unsaturated; hydrophilic." },
    { id: "q-3.1.1-B3", ref: "3.1.1.1", stmts: ["3.1.1.2.s3", "3.1.1.3.s1", "3.1.1.4.s3", "3.1.1.4.s4"], type: "match", marks: 4, stem: "Molecular structure interpretation. Each description is of a bond or link you might be shown in a diagram. Match it to its name.", pairs: [{ left: "C–O–C link between carbon 1 of one glucose ring and carbon 4 of the next", right: "α-1,4 glycosidic bond" }, { left: "–C(=O)–N(H)– link between two amino acid residues", right: "Peptide bond" }, { left: "–C–O–C(=O)– link between glycerol and a hydrocarbon chain", right: "Ester bond" }, { left: "S–S link between two cysteine R groups", right: "Disulfide bridge" }], explanation: "" },
    { id: "q-3.1.1-B4", ref: "3.1.1.2", stmts: ["3.1.1.2.s10"], type: "sequence", marks: 3, stem: "A student wants to show that a solution contains a non-reducing sugar. Put the steps in order.", steps: ["Heat a sample with Benedict's reagent: no colour change", "Heat a fresh sample with dilute hydrochloric acid, then neutralise with sodium hydrogencarbonate", "Heat with Benedict's reagent again: brick-red precipitate"], explanation: "Negative first; hydrolyse and neutralise; positive second test." },
    // Section C: experimental and data
    { id: "q-3.1.1-C1", ref: "3.1.1.4", stmts: ["3.1.1.4.s6", "3.1.1.2.s10", "3.1.1.3.s5"], type: "short", marks: 4, stem: "Experimental interpretation. A student tested three colourless liquid samples, P, Q and R, and recorded the results.\n\nBenedict's (heated): P blue, Q brick-red, R blue\nBiuret: P purple, Q blue, R blue\nEmulsion test: P clear, Q clear, R cloudy white\nIodine: all three orange-brown\n\n(a) Identify the main biological molecule in each of P, Q and R. (3 marks)\n(b) The student concluded that solution Q contained no protein. Suggest why this conclusion might not be valid. (1 mark)",
      scheme: [{ point: "P: protein (positive biuret)", marks: 1 }, { point: "Q: reducing sugar (positive Benedict's)", marks: 1 }, { point: "R: lipid (positive emulsion test)", marks: 1 }, { point: "Protein may be present at too low a concentration to give a visible colour change / the test is not sensitive enough (or too small a sample / too little reagent used)", marks: 1 }],
      model: "P contains protein because only P gave a purple biuret result; Q contains a reducing sugar because it gave a brick-red precipitate with Benedict's reagent; R contains lipid because it formed a cloudy white emulsion. The biuret test is not very sensitive, so Q could still contain protein at a concentration too low to give a visible lilac colour.",
      commonErrors: "Confusing which colour goes with which test; stating Q contains sucrose (sucrose is non-reducing); saying Q could contain free amino acids (amino acids are not protein, so this does not make the conclusion invalid)." },
    { id: "q-3.1.1-C2", ref: "3.1.1.3", stmts: ["3.1.1.3.s4"], type: "short", marks: 3, stem: "Data analysis. The table shows the energy released when 1 g of each substance is fully respired.\n\nCarbohydrate: 17 kJ g⁻¹\nLipid: 39 kJ g⁻¹\n\nA seed contains 2.4 g of stored lipid. (a) Calculate how much carbohydrate the seed would need to store to hold the same amount of energy. Show your working. (2 marks)\n(b) Use your knowledge of lipid structure to explain why lipid releases more energy per gram than carbohydrate. (1 mark)",
      scheme: [{ point: "Energy in lipid = 2.4 × 39 = 93.6 kJ", marks: 1 }, { point: "Carbohydrate needed = 93.6 ÷ 17 = 5.5 g (accept 5.5 to 5.51)", marks: 1 }, { point: "Hydrocarbon chains contain many C–H bonds / little oxygen, so more energy is released on oxidation", marks: 1 }],
      model: "2.4 g × 39 kJ g⁻¹ = 93.6 kJ; 93.6 ÷ 17 = 5.5 g of carbohydrate. Lipids release more energy per gram because their long hydrocarbon chains are rich in C–H bonds and contain little oxygen, so more oxidation is possible.",
      commonErrors: "Dividing in the wrong direction; forgetting units; vague 'lipids have more energy'." },
    // Section D: explanation and application
    { id: "q-3.1.1-D1", ref: "3.1.1.2", stmts: ["3.1.1.2.s7", "3.1.1.2.s9"], type: "short", marks: 3, stem: "Explain how the structure of starch makes it suitable as a storage molecule in plant cells. (3 marks)",
      scheme: [{ point: "Insoluble so does not affect water potential / no osmotic effect", marks: 1 }, { point: "Amylose helix is compact so much glucose is stored in a small space", marks: 1 }, { point: "Amylopectin branched so many ends for rapid hydrolysis to glucose (for respiration)", marks: 1 }],
      model: "Starch is insoluble, so it has no osmotic effect on the cell. Its amylose component coils into a compact helix that stores a lot of glucose in a small space, and the branched amylopectin provides many chain ends so enzymes can hydrolyse it rapidly to release glucose for respiration.",
      commonErrors: "Describing cellulose features; no link to function." },
    { id: "q-3.1.1-D2", ref: "3.1.1.3", stmts: ["3.1.1.3.s1", "3.1.1.3.s3", "3.1.1.3.s4"], type: "short", marks: 4, stem: "Describe the structure of a phospholipid and explain how it leads to the formation of a bilayer in water. (4 marks)",
      scheme: [{ point: "Glycerol joined (by ester bonds) to two fatty acids", marks: 1 }, { point: "And to a phosphate(-containing) group", marks: 1 }, { point: "Phosphate head hydrophilic / polar; fatty acid tails hydrophobic / non-polar", marks: 1 }, { point: "Heads face water on both sides and tails point inwards, so two layers form", marks: 1 }],
      model: "A phospholipid has a glycerol backbone joined by ester bonds to two fatty acids and to a phosphate-containing group. The phosphate head is polar and hydrophilic while the fatty acid tails are non-polar and hydrophobic, so in water the heads face the water on either side and the tails point inwards away from it, producing a bilayer.",
      commonErrors: "Three fatty acids; heads described as hydrophobic." },
    { id: "q-3.1.1-D3", ref: "3.1.1.4", stmts: ["3.1.1.4.s4", "3.1.1.4.s5"], type: "short", marks: 3, stem: "An enzyme stops working when heated to 70 °C. Explain why, referring to protein structure. (3 marks)",
      scheme: [{ point: "Heat breaks hydrogen bonds (and ionic bonds) in the tertiary structure", marks: 1 }, { point: "Tertiary structure / 3D shape changes: active site changes shape (denaturation)", marks: 1 }, { point: "Substrate no longer complementary / cannot bind, so no enzyme-substrate complex forms", marks: 1 }],
      model: "At 70 °C the increased vibration breaks the hydrogen and ionic bonds holding the enzyme's tertiary structure, so the protein unfolds and the active site changes shape: it is denatured. The substrate is no longer complementary to the active site, so enzyme-substrate complexes cannot form and the reaction stops.",
      commonErrors: "Saying peptide bonds break; saying the enzyme is 'killed'." },
    { id: "q-3.1.1-D4", ref: "3.1.1.4", stmts: ["3.1.1.2.s7", "3.1.1.2.s8", "3.1.3.1.s1", "3.1.3.1.s2"], type: "short", marks: 3, stem: "Application. Amylase hydrolyses the α-1,4 glycosidic bonds of starch but has no effect on cellulose, even though both are polymers of glucose. Explain why. (3 marks)",
      scheme: [{ point: "Cellulose has β-1,4 glycosidic bonds (β-glucose) rather than α-1,4", marks: 1 }, { point: "The active site of amylase has a specific tertiary structure / shape", marks: 1 }, { point: "Complementary to (the shape of) starch only, so cellulose cannot bind and no enzyme-substrate complex forms", marks: 1 }],
      model: "Starch contains α-1,4 glycosidic bonds between α-glucose units, whereas cellulose contains β-1,4 bonds between β-glucose units, so the two molecules have different shapes. The active site of amylase has a specific tertiary structure that is complementary only to starch, so cellulose cannot fit, no enzyme-substrate complex forms and no hydrolysis occurs.",
      commonErrors: "Not linking enzyme specificity to tertiary structure; saying cellulose has no glycosidic bonds." },
    { id: "q-3.1.1-E1", ref: "3.1.1.1", stmts: ["3.1.1.1.s1", "3.1.1.1.s2", "3.1.1.1.s3", "3.1.1.2.s3", "3.1.1.2.s6", "3.1.1.4.s3"], type: "extended", marks: 6, stem: "Extended response. Describe how monomers are joined to form polymers in carbohydrates and in proteins, and compare the bonds and products formed. (6 marks)",
      scheme: [{ point: "Both by condensation reactions, each removing one molecule of water", marks: 1 }, { point: "Carbohydrates: monosaccharides (e.g. α-glucose) join by glycosidic bonds", marks: 1 }, { point: "Two monosaccharides → disaccharide (maltose/sucrose); many → polysaccharide (starch/cellulose)", marks: 1 }, { point: "Proteins: amino acids join by peptide bonds between carboxyl group and amino group", marks: 1 }, { point: "Two amino acids → dipeptide; many → polypeptide", marks: 1 }, { point: "Comparison: both bonds covalent and hydrolysed by adding water; carbohydrate polymers made of one or two monomer types whereas polypeptides use 20 different amino acids giving far greater variety / polypeptides fold into specific 3D shapes", marks: 1 }],
      levels: "Full marks require both groups described with named bonds and products and at least one explicit comparison. Descriptions with no comparison cap at 5.",
      model: "In both carbohydrates and proteins, monomers are joined by condensation reactions in which a molecule of water is removed and a covalent bond forms. In carbohydrates the monomers are monosaccharides such as α-glucose, joined by glycosidic bonds: two form a disaccharide such as maltose or sucrose, and many form a polysaccharide such as starch or cellulose. In proteins the monomers are amino acids, joined by peptide bonds between the carboxyl group of one and the amino group of the next: two form a dipeptide and many form a polypeptide. Both bonds are covalent and both are broken by hydrolysis, which adds water back. The main difference is variety: carbohydrate polymers are built from one or two kinds of monomer, whereas polypeptides are built from twenty different amino acids, so the sequence can vary enormously and the chain folds into a specific three-dimensional shape that gives each protein its function.",
      commonErrors: "No mention of water; naming the wrong bond; no comparison." },
  ];

  window.BIO.consolidation["3.1.1"] = {
    status: "reviewed",
    title: "Biological molecules",
    summaryHTML, conceptMap,
    deckIds, extraCards,
    assessment: { title: "3.1.1 Topic assessment", marks: 45, minutes: 55, questions },
    // Diagnostic thresholds: a subsection is 'weak' if the student scored below 70% on its questions in this attempt
    diagnostics: { weakBelowPct: 70, strongAtPct: 85 },
  };
})();
