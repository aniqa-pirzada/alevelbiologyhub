// Authored content for 3.1.1.1 Monomers and polymers. Status recorded in docs/SPEC_COVERAGE_MATRIX.md.
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
window.BIO.content["3.1.1.1"] = {
  status: "reviewed", // not_started | draft | reviewed | verified | approved
  keywords: ["monomer", "polymer", "condensation", "hydrolysis", "water", "covalent bond", "macromolecule"],
  notes: `
<h2 data-stmt="3.1.1.1.s1">What the specification requires</h2>
<p>This short subsection underpins the whole of 3.1.1. You need to be able to define monomer and polymer, and to describe condensation and hydrolysis reactions in terms of what happens to the <em>bond</em> and to the <em>water molecule</em>. Everything in carbohydrates, lipids, proteins and nucleic acids builds on these two reactions.</p>

<div class="def"><strong>Monomer:</strong> a small, relatively simple molecule that can be joined to other similar molecules to form a larger molecule. Examples: monosaccharides (such as glucose), amino acids and nucleotides.</div>
<div class="def"><strong>Polymer:</strong> a large molecule made from many repeating monomer units joined by covalent bonds. Examples: polysaccharides (starch, glycogen, cellulose), polypeptides and polynucleotides (DNA, RNA).</div>

<h2 data-stmt="3.1.1.1.s2">Condensation reactions</h2>
<p>A condensation reaction joins two molecules together. A new <strong>covalent bond</strong> forms between them and, in the same step, <strong>one molecule of water is removed</strong>. The hydrogen (H) comes from one monomer and the hydroxyl (OH) group from the other; together they leave as H<sub>2</sub>O.</p>
<ul>
<li>Monosaccharide + monosaccharide → disaccharide + water (bond formed: <strong>glycosidic</strong>)</li>
<li>Amino acid + amino acid → dipeptide + water (bond formed: <strong>peptide</strong>)</li>
<li>Glycerol + fatty acid → monoglyceride + water (bond formed: <strong>ester</strong>)</li>
<li>Nucleotide + nucleotide → dinucleotide + water (you meet nucleotides and polynucleotides in 3.1.7)</li>
</ul>
<p>Because each join releases one water molecule, joining <em>n</em> monomers into one chain releases <em>n − 1</em> water molecules. This is a common calculation in exam questions.</p>

<h2 data-stmt="3.1.1.1.s3">Hydrolysis reactions</h2>
<p>Hydrolysis is the reverse: a <strong>water molecule is used</strong> to break the covalent bond between two units. The water supplies the H to one fragment and the OH to the other, regenerating the original functional groups. Digestion (3.2.2) is hydrolysis catalysed by enzymes: for example, amylase hydrolyses the glycosidic bonds in starch to release maltose.</p>
<p>Note that in cells both reactions are enzyme-catalysed. Condensation is energetically "uphill" and is driven by ATP, which is why building polymers is part of a cell's energy budget.</p>

<h2 data-stmt="3.1.1.1.s1">Lipids: condensation without a polymer</h2>
<p>Lipids are an exception to the monomer and polymer pattern: a triglyceride is built by condensation (three ester bonds) but it is not a polymer, because it is not a chain of repeating units. Examiners like this distinction.</p>

<div class="misconception"><strong>Common misconceptions.</strong>
<ul>
<li>"Water is <em>produced</em> in hydrolysis." No: water is <em>used</em> in hydrolysis and <em>released</em> in condensation. Fix it in your memory with the word itself: hydro (water) lysis (splitting), splitting <em>with</em> water.</li>
<li>"Condensation forms hydrogen bonds." The bond formed is <strong>covalent</strong> (glycosidic, peptide or ester). Hydrogen bonds are weak attractions (within a molecule or between molecules) that help hold shapes together; they are not the product of condensation.</li>
<li>"A triglyceride is a polymer." It is not; it is a single molecule assembled from four parts, not a chain of repeating monomers.</li>
</ul></div>

<div class="examtip"><strong>Exam focus.</strong> When asked to "describe how two monomers join", give three things: (1) a condensation reaction, (2) the name of the bond, (3) that a molecule of water is removed. Marks are usually one for each. For "how is the polymer broken down", name hydrolysis, say a water molecule is <em>added</em> to break the named bond, and mention the enzyme if the context gives one.</div>
`,
  diagrams: [],
  interactive: {
    id: "i-3.1.1.1", title: "Animate: condensation and hydrolysis",
    note: "Each block stands for a whole monomer, not for its atoms. Water is released when two monomers join and used when they are split. Bond names: glycosidic (sugars), peptide (amino acids), ester (lipids).",
    kind: "condensation"
  },
  examFocus: `<ul>
<li><strong>Terminology to use precisely:</strong> condensation, hydrolysis, covalent bond, glycosidic / peptide / ester bond, monomer, polymer, macromolecule.</li>
<li><strong>Calculation:</strong> n monomers joined in a chain release n − 1 water molecules. A branched polymer still releases one water per bond formed.</li>
<li><strong>Pitfall:</strong> writing "bond" without naming it loses the mark. Writing "hydrogen bond" is wrong.</li>
<li><strong>Links to practical skills:</strong> biochemical tests (3.1.1.2 to 3.1.1.4) detect the products of hydrolysis, for example reducing sugars after acid hydrolysis of sucrose.</li>
</ul>`,
  synoptic: [
    { ref: "3.2.2.2", text: "Digestion is enzyme-catalysed hydrolysis of carbohydrates, lipids and proteins." },
    { ref: "3.1.7.3", text: "DNA polymerase joins nucleotides by condensation when DNA is replicated." },
    { ref: "3.4.7.1", text: "Glycogenesis (glucose to glycogen) joins glucose units by condensation; in glycogenolysis the liver breaks glycogen down again to release glucose." },
    { ref: "3.1.4.3", text: "ATP is synthesised from ADP and phosphate by condensation and hydrolysed to release energy." },
  ],
  quickCheck: [
    { id: "q-3.1.1.1-qc1", ref: "3.1.1.1", stmts: ["3.1.1.1.s2"], type: "mcq", marks: 1, stem: "Which statement about a condensation reaction is correct?",
      options: ["A molecule of water is used to break a covalent bond", "A covalent bond forms and a molecule of water is released", "A hydrogen bond forms between two monomers", "Two polymers are joined to form a monomer"], answer: 1,
      explanation: "Condensation joins two molecules with a covalent bond and removes one molecule of water." },
    { id: "q-3.1.1.1-qc2", ref: "3.1.1.1", stmts: ["3.1.1.1.s3", "3.1.1.1.s1"], type: "gap", marks: 2, stem: "Complete the sentence.",
      text: "In a {{1}} reaction, a molecule of water is used to break the bond between two molecules; this is how enzymes in the gut break down {{2}} into their monomers.",
      answers: { 1: ["hydrolysis"], 2: ["polymers", "polymer", "macromolecules", "large molecules"] },
      explanation: "Hydrolysis uses water to split polymers into monomers." },
    { id: "q-3.1.1.1-qc3", ref: "3.1.1.1", stmts: ["3.1.1.1.s2"], type: "mcq", marks: 1, stem: "How many molecules of water are released when 12 amino acids join to form a single polypeptide chain?",
      options: ["12", "11", "13", "6"], answer: 1, explanation: "Each peptide bond releases one water; 12 units need 11 bonds." },
    { id: "q-3.1.1.1-qc4", ref: "3.1.1.1", stmts: ["3.1.1.1.s2", "3.1.1.2.s3", "3.1.1.3.s1", "3.1.1.4.s3"], type: "match", marks: 3, stem: "Match each pair of molecules to the bond formed between them by condensation.",
      pairs: [{ left: "Two monosaccharides", right: "Glycosidic bond" }, { left: "Two amino acids", right: "Peptide bond" }, { left: "Glycerol and a fatty acid", right: "Ester bond" }],
      explanation: "Each class of biological molecule has its own named covalent bond: glycosidic in carbohydrates, peptide in proteins and ester in lipids." },
  ],
  flashcards: [
    { id: "f-3.1.1.1-1", front: "Define a monomer.", back: "A small molecule that can be joined to other similar molecules to make a polymer, e.g. a monosaccharide, amino acid or nucleotide." },
    { id: "f-3.1.1.1-2", front: "Define a polymer.", back: "A large molecule made of many repeating monomer units joined by covalent bonds, e.g. starch, a polypeptide, DNA." },
    { id: "f-3.1.1.1-3", front: "What happens in a condensation reaction?", back: "Two molecules are joined by a covalent bond and one molecule of water is removed." },
    { id: "f-3.1.1.1-4", front: "What happens in a hydrolysis reaction?", back: "A molecule of water is used to break the covalent bond between two molecules." },
    { id: "f-3.1.1.1-5", front: "Name the bond formed when two monosaccharides join.", back: "A glycosidic bond." },
    { id: "f-3.1.1.1-6", front: "Why is a triglyceride not a polymer?", back: "It is not a chain of repeating monomers; it is one glycerol joined to three fatty acids by ester bonds." },
    { id: "f-3.1.1.1-7", front: "How many water molecules are released when n monomers join in a chain?", back: "n − 1." },
  ],
  questions: [
    { id: "q-3.1.1.1-s1", ref: "3.1.1.1", stmts: ["3.1.1.1.s2", "3.1.1.4.s3"], type: "short", marks: 3, stem: "Describe how two amino acids are joined to form a dipeptide. (3 marks)",
      scheme: [{ point: "Condensation reaction", marks: 1 }, { point: "Peptide bond formed between (the carboxyl group of one and the amino group of the other)", marks: 1 }, { point: "A molecule of water is removed / released", marks: 1 }],
      model: "The two amino acids are joined by a condensation reaction. A peptide bond forms between the carboxyl group of one amino acid and the amino group of the other, and a molecule of water is released.",
      alternatives: "Accept 'eliminated' or 'lost' for removed.", commonErrors: "Naming the bond as a hydrogen bond; saying water is added." },
    { id: "q-3.1.1.1-s2", ref: "3.1.1.1", stmts: ["3.1.1.1.s3"], type: "short", marks: 2, stem: "Explain why hydrolysis of a polysaccharide in the gut requires water. (2 marks)",
      scheme: [{ point: "The glycosidic bond is broken by the addition of a water molecule", marks: 1 }, { point: "The water provides the H and the OH that restore the (hydroxyl) groups on each monosaccharide", marks: 1 }],
      model: "Hydrolysis breaks each glycosidic bond by adding a molecule of water; the water supplies the H and OH groups that complete the two separated monosaccharides.",
      commonErrors: "Confusing with condensation; stating that water is produced." },
    { id: "q-3.1.1.1-m1", ref: "3.1.1.1", stmts: ["3.1.1.1.s1"], type: "mcq", marks: 1, stem: "Which of these molecules is a monomer?",
      options: ["Amino acid", "Polypeptide", "Starch", "DNA"], answer: 0,
      explanation: "An amino acid is a small unit that can be joined to others to make a polymer. Polypeptides, starch and DNA are all polymers made of many monomers (amino acids, glucose and nucleotides respectively)." },
    { id: "q-3.1.1.1-m2", ref: "3.1.1.1", stmts: ["3.1.1.1.s3", "3.1.1.1.s2"], type: "mcq", marks: 1, stem: "A polymer is broken down into its monomers. Which statement correctly describes this reaction?",
      options: ["Hydrolysis: a chemical bond is broken and a molecule of water is used", "Hydrolysis: a chemical bond is broken and a molecule of water is released", "Condensation: a chemical bond is broken and a molecule of water is used", "Condensation: a chemical bond is formed and a molecule of water is released"], answer: 0,
      explanation: "Breaking a polymer into monomers is hydrolysis, which uses a molecule of water for every chemical bond broken. The last option is a true description of condensation, but condensation joins monomers; it does not break polymers down." },
    { id: "q-3.1.1.1-g1", ref: "3.1.1.1", stmts: ["3.1.1.1.s1", "3.1.1.1.s2", "3.1.1.1.s3"], type: "gap", marks: 4, stem: "Complete the passage.",
      text: "Small units called {{1}} can be joined together to form polymers. Each join is made by a {{2}} reaction, which forms a chemical bond and eliminates a molecule of {{3}}. The reverse reaction, {{4}}, uses a molecule of water to break the chemical bond.",
      answers: { 1: ["monomers", "monomer"], 2: ["condensation"], 3: ["water", "H2O"], 4: ["hydrolysis"] },
      explanation: "Monomers join by condensation, which eliminates water; hydrolysis uses water to break the bond again." },
    { id: "q-3.1.1.1-match1", ref: "3.1.1.1", stmts: ["3.1.1.1.s1"], type: "match", marks: 3, stem: "Match each monomer to the type of polymer made when many of these monomers are joined together.",
      pairs: [{ left: "Monosaccharide (for example glucose)", right: "Polysaccharide (for example starch)" }, { left: "Amino acid", right: "Polypeptide" }, { left: "Nucleotide", right: "Polynucleotide (for example DNA)" }],
      explanation: "Monosaccharides, amino acids and nucleotides are the monomers; joining many of each by condensation gives polysaccharides, polypeptides and polynucleotides." },
    { id: "q-3.1.1.1-seq1", ref: "3.1.1.1", stmts: ["3.1.1.1.s2", "3.1.1.1.s3", "3.1.1.1.s1"], type: "sequence", marks: 4, stem: "Put these events in order, from separate monomers to the building of a polymer and its breakdown.",
      steps: ["Two monomers join by condensation: a chemical bond forms and a molecule of water is eliminated", "More monomers join the chain one at a time, each join eliminating another molecule of water", "A polymer made of many repeating monomer units is formed", "Water molecules are used to break the chemical bonds by hydrolysis, releasing the monomers again"],
      explanation: "Condensation joins monomers one at a time, releasing water each time, until a polymer forms; hydrolysis later uses water to split it back into monomers." },
  ],
};
