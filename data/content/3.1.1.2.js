// Authored content for 3.1.1.2 Carbohydrates.
window.BIO = window.BIO || {}; window.BIO.content = window.BIO.content || {};
(function () {
  // ---- Haworth projection generator (D-glucose ring) ----
  // Ring atoms (Haworth, front edge C2–C3 drawn bold): C5 top-left, O top-right, C1 right, C2 bottom-right, C3 bottom-left, C4 left.
  // Substituents on D-glucopyranose: C1 OH down (alpha) or up (beta); C2 OH down; C3 OH up; C4 OH down; C5 CH2OH up. H is opposite each OH.
  function ring(ox, oy, opts) {
    // nums: draw carbon numbers; c4num: [dx, dy] position of the "4" label relative to C4 (moved when a bond leaves C4)
    const o = Object.assign({ anomer: "alpha", showC1OH: true, showC4OH: true, label: "", small: false, nums: true, c4num: [-10, 2] }, opts);
    const P = { C5: [110, 85], O: [205, 62], C1: [268, 108], C2: [238, 185], C3: [118, 185], C4: [58, 120] };
    const p = (k) => [P[k][0] + ox, P[k][1] + oy];
    const L = (a, b, w = 2) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#16263a" stroke-width="${w}"/>`;
    const T = (x, y, s, anchor = "middle", size = 13, weight = 500) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="#16263a">${s}</text>`;
    const sub = (k, dir, txt, offset = 34) => { const [x, y] = p(k); const y2 = y + (dir === "up" ? -offset : offset); return L([x, y], [x, y2 + (dir === "up" ? 6 : -10)], 1.6) + T(x, y2 + (dir === "up" ? 0 : 4), txt); };
    let s = "";
    s += L(p("C5"), p("O")) + L(p("O"), p("C1")) + L(p("C1"), p("C2")) + L(p("C2"), p("C3"), 5) + L(p("C3"), p("C4")) + L(p("C4"), p("C5"));
    const [ox2, oy2] = p("O"); s += `<circle cx="${ox2}" cy="${oy2}" r="9" fill="#fff"/>` + T(ox2, oy2 + 4, "O", "middle", 13, 700);
    // carbon numbers
    if (o.nums) s += T(p("C1")[0] + 10, p("C1")[1] + 2, "1", "start", 10, 700) + T(p("C2")[0] + 8, p("C2")[1] + 14, "2", "start", 10, 700) + T(p("C3")[0] - 8, p("C3")[1] + 14, "3", "end", 10, 700) + T(p("C4")[0] + o.c4num[0], p("C4")[1] + o.c4num[1], "4", "end", 10, 700) + T(p("C5")[0] - 8, p("C5")[1] - 6, "5", "end", 10, 700);
    // C5: CH2OH up, H down
    s += sub("C5", "up", "CH<tspan baseline-shift='sub' font-size='9'>2</tspan>OH", 40) + sub("C5", "down", "H", 30);
    // C1
    // C1 OH drawn on a longer stick so its label sits clear of the C1–C2 ring bond
    if (o.showC1OH) { s += o.anomer === "alpha" ? sub("C1", "down", "OH", 48) + sub("C1", "up", "H", 24) : sub("C1", "up", "OH", 44) + sub("C1", "down", "H", 24); }
    else { s += o.anomer === "alpha" ? sub("C1", "up", "H", 24) : sub("C1", "down", "H", 24); }
    // C2 OH down, H up ; C3 OH up, H down ; C4 OH down, H up
    s += sub("C2", "down", "OH") + sub("C2", "up", "H", 24);
    s += sub("C3", "up", "OH") + sub("C3", "down", "H", 24);
    if (o.showC4OH) s += sub("C4", "down", "OH"); s += sub("C4", "up", "H", 24);
    if (o.label) s += T(ox + 165, oy + 262, o.label, "middle", 14, 700);
    return s;
  }
  const alphaBeta = `<svg viewBox="0 0 700 290" width="700" role="img" aria-label="Haworth projections of alpha glucose and beta glucose">
    <g>${ring(10, 10, { anomer: "alpha", label: "α-glucose: OH on carbon 1 below the ring" })}</g>
    <g>${ring(360, 10, { anomer: "beta", label: "β-glucose: OH on carbon 1 above the ring" })}</g>
  </svg>`;
  // Maltose: alpha-1,4 glycosidic bond. Left ring loses OH on C1 (keeps H up), right ring loses OH on C4 (keeps H up).
  // The bridging O sits BELOW the ring plane (alpha): a bond runs down from C1 of the left ring to O, and from O up to C4 of the right ring.
  // Left ring C1 = (268,128); right ring C4 = (428,140).
  const maltose = `<svg viewBox="0 0 760 300" width="760" role="img" aria-label="Formation of maltose by condensation of two alpha glucose molecules">
    <g>${ring(0, 20, { anomer: "alpha", showC1OH: false })}</g>
    <g>${ring(370, 20, { anomer: "alpha", showC4OH: false })}</g>
    <path d="M268 128 L268 158 L336 174" fill="none" stroke="#16263a" stroke-width="2"/>
    <path d="M360 174 L428 158 L428 140" fill="none" stroke="#16263a" stroke-width="2"/>
    <circle cx="348" cy="176" r="11" fill="#fbf0d8" stroke="#c8902a" stroke-width="2"/><text x="348" y="180.5" text-anchor="middle" font-size="13" font-weight="700" fill="#16263a">O</text>
    <text x="348" y="206" text-anchor="middle" font-size="12" font-weight="700" fill="#8a5f12">α-1,4 glycosidic bond</text>
    <text x="348" y="221" text-anchor="middle" font-size="10" fill="#3c4f63">(O below the ring: carbon 1 was α)</text>
    <text x="380" y="288" text-anchor="middle" font-size="13" fill="#3c4f63">Condensation: α-glucose + α-glucose → maltose + H<tspan baseline-shift="sub" font-size="9">2</tspan>O  (OH from C1 and H from C4 leave as water)</text>
  </svg>`;
  // Labelling question: two rings without carbon numbers. Ring 1 = beta, ring 2 = alpha.
  // Ring 2 (ox 360, oy 10): C1 = (628,118), C4 = (418,130).
  const num = (x, y, n) => `<circle cx="${x}" cy="${y}" r="12" fill="#1e3a5f"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${n}</text>`;
  const idRings = `<svg viewBox="0 0 700 260" width="700" role="img" aria-label="two glucose rings labelled 1 and 2, with two carbon atoms of ring 2 labelled 3 and 4">
    <g>${ring(10, 10, { anomer: "beta", nums: false })}</g>
    <g>${ring(360, 10, { anomer: "alpha", nums: false })}</g>
    ${num(173, 145, 1)}${num(523, 145, 2)}
    <line x1="638" y1="118" x2="662" y2="118" stroke="#1e3a5f" stroke-width="1.5"/>${num(674, 118, 3)}
    <line x1="408" y1="130" x2="384" y2="130" stroke="#1e3a5f" stroke-width="1.5"/>${num(372, 130, 4)}
  </svg>`;
  const polysacc = `<svg viewBox="0 0 760 300" width="760" role="img" aria-label="Schematic comparison of amylose, amylopectin and cellulose">
   <g font-size="13" fill="#16263a">
    <text x="130" y="24" text-anchor="middle" font-weight="700">Amylose (starch)</text>
    <path d="M40 60 c 60 -30 120 30 180 0 c 60 -30 -140 70 -180 110 c -40 40 120 50 180 20" fill="none" stroke="#1f8a8a" stroke-width="7" stroke-linecap="round"/>
    <text x="130" y="226" text-anchor="middle" font-size="12">unbranched α-1,4 chain</text><text x="130" y="242" text-anchor="middle" font-size="12">coils into a helix; compact</text>
    <text x="380" y="24" text-anchor="middle" font-weight="700">Amylopectin (starch)</text>
    <path d="M300 180 L380 110 L460 180 M380 110 L380 40 M340 145 L310 110 M420 145 L450 100 M380 75 L420 55" fill="none" stroke="#6b9a7f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="380" y="226" text-anchor="middle" font-size="12">α-1,4 chains with α-1,6 branches;</text><text x="380" y="242" text-anchor="middle" font-size="12">many ends for rapid hydrolysis</text>
    <text x="630" y="24" text-anchor="middle" font-weight="700">Cellulose</text>
    <g stroke="#1e3a5f" stroke-width="7" stroke-linecap="round"><line x1="540" y1="60" x2="720" y2="60"/><line x1="540" y1="100" x2="720" y2="100"/><line x1="540" y1="140" x2="720" y2="140"/><line x1="540" y1="180" x2="720" y2="180"/></g>
    <g stroke="#c8902a" stroke-width="2" stroke-dasharray="4 4"><line x1="570" y1="60" x2="570" y2="180"/><line x1="630" y1="60" x2="630" y2="180"/><line x1="690" y1="60" x2="690" y2="180"/></g>
    <text x="630" y="226" text-anchor="middle" font-size="12">straight β-1,4 chains held by</text><text x="630" y="242" text-anchor="middle" font-size="12">hydrogen bonds (dashed); strong</text>
    <text x="380" y="285" text-anchor="middle" font-size="11" fill="#6b7d8f">Schematic: lines represent chains of glucose units, not individual atoms.</text>
   </g></svg>`;

  window.BIO.content["3.1.1.2"] = {
    status: "reviewed",
    keywords: ["glucose", "alpha", "beta", "isomer", "maltose", "sucrose", "fructose", "glycosidic", "starch", "amylose", "amylopectin", "cellulose", "Benedict's", "iodine", "reducing sugar", "non-reducing sugar", "disaccharide", "polysaccharide", "monosaccharide"],
    notes: `
<h2 data-stmt="3.1.1.2.s1">Monosaccharides</h2>
<p>Monosaccharides are the monomers from which larger carbohydrates are built. They are sweet, soluble, reducing sugars with the general formula (CH<sub>2</sub>O)<sub>n</sub>. The examples you must know are <strong>glucose</strong> and <strong>fructose</strong> (both hexoses, C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>). Glucose is the main respiratory substrate; it is soluble because its hydroxyl (OH) groups form hydrogen bonds with water.</p>
<h3 data-stmt="3.1.1.2.s2">Alpha and beta glucose</h3>
<p>Glucose exists as two <strong>isomers</strong> (same molecular formula, different arrangement of atoms). In the ring form, the only difference is the position of the OH group on <strong>carbon 1</strong>:</p>
<ul><li><strong>α-glucose:</strong> the OH on carbon 1 is <em>below</em> the plane of the ring.</li><li><strong>β-glucose:</strong> the OH on carbon 1 is <em>above</em> the plane of the ring.</li></ul>
<p>You must be able to draw and recognise both. To tell them apart in a diagram, find the oxygen in the ring. Carbon 1 is the carbon next to it that does <em>not</em> carry the CH<sub>2</sub>OH group. If the OH on carbon 1 points down (on the opposite side of the ring to the CH<sub>2</sub>OH) it is α-glucose; if it points up (on the same side as the CH<sub>2</sub>OH) it is β-glucose.</p>
<p>This small difference has huge consequences: polymers of α-glucose (starch, glycogen) are energy stores that enzymes can hydrolyse easily, while the polymer of β-glucose (cellulose) is a structural material that most organisms cannot digest.</p>

<h2 data-stmt="3.1.1.2.s3 3.1.1.2.s4 3.1.1.2.s5">Disaccharides</h2>
<p>A condensation reaction between two monosaccharides forms a <strong>glycosidic bond</strong> (a C–O–C link) and releases water.</p>
<table><tr><th>Disaccharide</th><th>Monomers</th><th>Bond</th><th>Where found</th></tr>
<tr><td>Maltose</td><td>α-glucose + α-glucose</td><td>α-1,4 glycosidic</td><td>Product of starch hydrolysis (germinating seeds, digestion)</td></tr>
<tr><td>Sucrose</td><td>α-glucose + fructose</td><td>1,2 glycosidic (carbon 1 of glucose to carbon 2 of fructose)</td><td>Transport sugar in plant phloem (3.2.8.2)</td></tr>
<tr><td>Lactose</td><td>β-galactose + glucose</td><td>β-1,4 glycosidic</td><td>Milk (not named in the specification; enrichment)</td></tr></table>
<p>Maltose and lactose are reducing sugars. Sucrose is a <strong>non-reducing sugar</strong> because the glycosidic bond uses both potential reducing groups (C1 of glucose and C2 of fructose).</p>

<h3 data-stmt="3.1.1.2.s11 3.1.1.2.s3">Carbohydrates you have not met before</h3>
<p>In the exam you may be given the structure or formula of a carbohydrate that is not named in the specification, such as galactose, lactose, trehalose or ribose. The rules are the same as for maltose:</p>
<ol><li><strong>To show condensation:</strong> find the two OH groups that react (the question will tell you which carbons, for example carbon 1 of one sugar and carbon 4 of the other). Remove the whole OH from one carbon and only the H from the other OH group. These form H<sub>2</sub>O. The two carbons are now joined through the remaining O: this C–O–C link is the glycosidic bond.</li>
<li><strong>To show hydrolysis:</strong> find the C–O–C link between the rings and add a molecule of water. The bond between the bridging O and one of the carbons breaks. That carbon gains an OH, and the O left on the other sugar gains an H, so it becomes an OH again.</li>
<li><strong>Name the bond</strong> from the numbers of the two carbons joined (1,4 or 1,6, for example). If the bond leaves carbon 1 below the ring it is α; if it leaves above the ring it is β.</li>
<li><strong>Count the water:</strong> one molecule of water per glycosidic bond. A disaccharide made from two hexoses is 2 × C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> − H<sub>2</sub>O = C<sub>12</sub>H<sub>22</sub>O<sub>11</sub>.</li></ol>
<p><strong>Worked example: lactose.</strong> Lactose is made from β-galactose and glucose. Galactose has the same formula as glucose (C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>), but the OH on its carbon 4 is above the ring instead of below. The OH on carbon 1 of galactose (above the ring, because it is β) reacts with the OH on carbon 4 of glucose. The OH from carbon 1 and the H from the carbon 4 OH leave as water, and a β-1,4 glycosidic bond forms. When the enzyme lactase hydrolyses lactose, one molecule of water is used and galactose and glucose are released.</p>

<h2 data-stmt="3.1.1.2.s6 3.1.1.2.s7 3.1.1.2.s8 3.1.1.2.s9">Polysaccharides</h2>
<p>Many monosaccharides joined by condensation form a polysaccharide. Polysaccharides are insoluble (or barely soluble), so they do not affect the water potential of a cell, which makes them ideal stores or structural components.</p>
<table><tr><th></th><th>Amylose</th><th>Amylopectin</th><th>Cellulose</th></tr>
<tr><th>Monomer</th><td>α-glucose</td><td>α-glucose</td><td>β-glucose</td></tr>
<tr><th>Bonds</th><td>α-1,4 only</td><td>α-1,4 with α-1,6 branches</td><td>β-1,4 only</td></tr>
<tr><th>Shape</th><td>Unbranched chain coiled into a helix</td><td>Branched</td><td>Straight, unbranched chains; alternate glucose units are rotated 180°</td></tr>
<tr><th>Structure → function</th><td>Helix is compact, so a lot of glucose is stored in a small space; insoluble so no osmotic effect</td><td>Many chain ends, so enzymes can hydrolyse it quickly to release glucose for respiration</td><td>Straight chains lie side by side and form many hydrogen bonds, building microfibrils of great tensile strength; gives plant cell walls strength and prevents bursting</td></tr>
<tr><th>Role</th><td colspan="2">Starch: energy store in plant cells (chloroplasts, storage organs)</td><td>Structural component of plant cell walls</td></tr></table>
<p>Starch is made of both amylose and amylopectin. The 180° rotation of alternate β-glucose units in cellulose is what keeps the chain straight: because the C1 OH points up in β-glucose, each new unit must be flipped so that the C1 and C4 hydroxyl groups line up to form the bond.</p>

<h2 data-stmt="3.1.1.2.s10">Biochemical tests</h2>
<h3 data-stmt="3.1.1.2.s10">Reducing sugars (Benedict's test)</h3>
<ol><li>Add Benedict's reagent (alkaline copper(II) sulfate) to the sample solution in a test tube.</li><li>Heat in a water bath at about 80 to 100 °C for a few minutes.</li><li>A reducing sugar reduces Cu<sup>2+</sup> ions to Cu<sup>+</sup>, forming a brick-red precipitate of copper(I) oxide. The colour grades from blue (none) through green, yellow and orange to brick red as concentration increases, so the test is semi-quantitative.</li></ol>
<h3 data-stmt="3.1.1.2.s10">Non-reducing sugars</h3>
<ol><li>Carry out the Benedict's test: negative (stays blue).</li><li>Take a fresh sample, add dilute hydrochloric acid and heat to hydrolyse glycosidic bonds.</li><li>Neutralise with sodium hydrogencarbonate (check with pH paper; Benedict's needs alkaline conditions).</li><li>Repeat the Benedict's test: a brick-red precipitate now shows a non-reducing sugar was present.</li></ol>
<h3 data-stmt="3.1.1.2.s10">Starch (iodine test)</h3>
<p>Add a few drops of iodine in potassium iodide solution. A colour change from orange-brown to <strong>blue-black</strong> shows starch is present. The iodine complexes inside the amylose helix, which is why amylose, not amylopectin, gives the strongest colour.</p>

<div class="misconception"><strong>Common misconceptions.</strong>
<ul><li>"The difference between α and β glucose is on carbon 6." It is on carbon 1.</li>
<li>"Cellulose is branched." It is unbranched; its strength comes from hydrogen bonding between parallel chains, not from branching.</li>
<li>"Benedict's goes red because the sugar is red." The colour is copper(I) oxide formed when the sugar reduces copper(II) ions.</li>
<li>"Glycogen is a plant store." Glycogen is the animal and fungal store (not named in 3.1.1, but required in 3.4.7); starch is the plant store.</li></ul></div>
<div class="examtip"><strong>Exam focus.</strong> "Relate structure to function" questions expect pairs: a structural feature followed by its consequence (e.g. "unbranched β-1,4 chains lie parallel <em>so</em> many hydrogen bonds form between chains <em>so</em> high tensile strength"). For tests, examiners want the reagent, the condition (heat / acid then neutralise) and the observation.</div>
<div class="enrich"><strong>Enrichment (not required):</strong> 3.1.1.2 names glucose, fructose, maltose, sucrose, starch (amylose and amylopectin) and cellulose. You do not need to learn lactose or galactose, but you must be able to work out condensation and hydrolysis for sugars like these when you are given their structures. Glycogen is not part of 3.1.1 but you will need it in 3.4.7.</div>
`,
    diagrams: [
      { id: "d-3.1.1.2-1", title: "α-glucose and β-glucose (Haworth projections)", status: "reviewed",
        caption: "Ring forms of D-glucose. The ring is drawn in Haworth projection with the front edge (carbons 2 and 3) bold. In both isomers carbon 2 and carbon 4 carry OH below the ring and carbon 3 carries OH above; only carbon 1 differs.",
        alt: "Two six-membered rings each containing five carbons and one oxygen. Carbon 6 (CH2OH) projects upwards from carbon 5. In alpha glucose the OH on carbon 1 points down; in beta glucose it points up.", svg: alphaBeta },
      { id: "d-3.1.1.2-2", title: "Formation of maltose", status: "reviewed",
        caption: "Condensation between the OH on carbon 1 of one α-glucose and the OH on carbon 4 of another forms an α-1,4 glycosidic bond and releases a molecule of water.",
        alt: "Two alpha glucose rings joined through an oxygen atom bridging carbon 1 of the left ring and carbon 4 of the right ring, labelled alpha-1,4 glycosidic bond.", svg: maltose },
      { id: "d-3.1.1.2-3", title: "Amylose, amylopectin and cellulose (schematic)", status: "reviewed",
        caption: "Schematic chain shapes only. Amylose coils; amylopectin branches; cellulose chains are straight and hydrogen-bonded together.",
        alt: "Three schematic drawings: a coiled line for amylose, a branched line for amylopectin, and four parallel straight lines joined by dashed cross-links for cellulose.", svg: polysacc },
    ],
    interactive: { id: "i-3.1.1.2", title: "Animate: condensation and hydrolysis (general schematic)", note: "The same general schematic as in 3.1.1.1: each block stands for a whole monosaccharide, not for its atoms. For glucose, the OH on carbon 1 of one molecule and the H from the OH on carbon 4 of the other leave as water, and the remaining O bridges the two rings (see the maltose diagram).", kind: "condensation" },
    examFocus: `<ul><li><strong>Draw it:</strong> you may be asked to draw α-glucose, β-glucose or a glycosidic bond. Practise until the carbon 1 OH position is automatic.</li>
<li><strong>Structure to function:</strong> starch (compact, insoluble, branched for rapid hydrolysis) and cellulose (straight chains, hydrogen bonds, microfibrils, strength).</li>
<li><strong>Required practical link:</strong> Benedict's and iodine tests are practical skills that can be examined in any paper, including in a planning or evaluation context (AO4).</li>
<li><strong>Maths link:</strong> the semi-quantitative Benedict's test can be made quantitative with a colorimeter and a calibration curve: expect graph interpretation.</li></ul>`,
    synoptic: [
      { ref: "3.1.1.1", text: "Glycosidic bonds form by condensation and are broken by hydrolysis." },
      { ref: "3.2.2.2", text: "Amylase and membrane-bound disaccharidases (maltase, sucrase) hydrolyse starch and disaccharides during digestion." },
      { ref: "3.2.8.2", text: "Sucrose is the sugar translocated in phloem; being non-reducing it is chemically stable in transit." },
      { ref: "3.3.2.2", text: "Triose phosphate from the Calvin cycle is converted into glucose and then starch or cellulose." },
      { ref: "3.4.7.1", text: "Glycogen (the animal store, a branched α-glucose polymer like amylopectin) is built and broken down in the liver." },
    ],
    quickCheck: [
      { id: "q-3.1.1.2-qc1", ref: "3.1.1.2", stmts: ["3.1.1.2.s2"], type: "mcq", marks: 1, stem: "In β-glucose, where is the hydroxyl group on carbon 1?", options: ["Above the plane of the ring", "Below the plane of the ring", "On carbon 6", "Replaced by a hydrogen atom"], answer: 0, explanation: "β: OH on C1 above the ring; α: below." },
      { id: "q-3.1.1.2-qc2", ref: "3.1.1.2", stmts: ["3.1.1.2.s5", "3.1.1.2.s4", "3.1.1.2.s3"], type: "gap", marks: 3, stem: "Complete the sentences.", text: "Sucrose is formed by condensation of α-glucose and {{1}}. Maltose is formed from two {{2}} molecules. The bond that joins monosaccharides is a {{3}} bond.", answers: { 1: ["fructose"], 2: ["alpha glucose", "α-glucose", "a-glucose", "alpha-glucose", "glucose"], 3: ["glycosidic"] }, explanation: "Sucrose = glucose + fructose; maltose = glucose + glucose; both joined by glycosidic bonds." },
      { id: "q-3.1.1.2-qc3", ref: "3.1.1.2", stmts: ["3.1.1.2.s10"], type: "sequence", marks: 4, stem: "Put the steps of the test for a non-reducing sugar in the correct order.", steps: ["Benedict's test on the original sample gives no colour change", "Add dilute hydrochloric acid to a fresh sample and heat", "Neutralise with sodium hydrogencarbonate", "Add Benedict's reagent, heat, and observe a brick-red precipitate"], explanation: "Negative first test, acid hydrolysis, neutralise, then repeat Benedict's." },
      { id: "q-3.1.1.2-qc4", ref: "3.1.1.2", stmts: ["3.1.1.2.s9"], type: "mcq", marks: 1, stem: "Which feature of cellulose is most directly responsible for its high tensile strength?", options: ["α-1,6 branching", "Hydrogen bonds between parallel chains forming microfibrils", "Its helical shape", "Its solubility in water"], answer: 1, explanation: "Straight β-1,4 chains lie side by side and hydrogen bond into microfibrils." },
    ],
    flashcards: [
      { id: "f-3.1.1.2-1", front: "What is the structural difference between α-glucose and β-glucose?", back: "The position of the OH group on carbon 1: below the ring in α-glucose, above the ring in β-glucose." },
      { id: "f-3.1.1.2-2", front: "Which monosaccharides form sucrose?", back: "α-glucose and fructose, joined by a glycosidic bond." },
      { id: "f-3.1.1.2-3", front: "Which monosaccharides form maltose?", back: "Two α-glucose molecules (α-1,4 glycosidic bond)." },
      { id: "f-3.1.1.2-4", front: "What are the two components of starch?", back: "Amylose (unbranched, helical, α-1,4) and amylopectin (branched, α-1,4 and α-1,6)." },
      { id: "f-3.1.1.2-5", front: "Explain how the structure of cellulose suits its function.", back: "Straight unbranched β-1,4 chains (alternate units rotated 180°) lie parallel and form many hydrogen bonds, producing microfibrils with high tensile strength; insoluble; gives cell walls strength." },
      { id: "f-3.1.1.2-6", front: "Why is starch a good storage molecule?", back: "Insoluble (no osmotic effect, does not diffuse out), compact helix stores much glucose in little space, branched amylopectin is hydrolysed quickly, large so cannot leave the cell." },
      { id: "f-3.1.1.2-7", front: "Describe the Benedict's test for a reducing sugar.", back: "Add Benedict's reagent and heat (water bath); a reducing sugar gives a green, yellow, orange or brick-red precipitate depending on concentration." },
      { id: "f-3.1.1.2-8", front: "How do you test for a non-reducing sugar?", back: "Negative Benedict's; hydrolyse a fresh sample with dilute HCl and heat; neutralise with sodium hydrogencarbonate; repeat Benedict's: brick-red precipitate." },
      { id: "f-3.1.1.2-9", front: "Describe the test for starch.", back: "Add iodine in potassium iodide solution; orange-brown to blue-black if starch is present." },
      { id: "f-3.1.1.2-10", front: "Why is sucrose a non-reducing sugar?", back: "Its glycosidic bond involves both reducing groups (C1 of glucose and C2 of fructose), so neither can reduce Cu2+ ions." },
      { id: "f-3.1.1.2-11", front: "You are given two unfamiliar monosaccharides and told which carbons join. How do you show the condensation?", back: "Remove the OH from one carbon and only the H from the OH on the other; these form one H₂O. Join the two carbons through the remaining O (the glycosidic bond). Hydrolysis is the reverse: add H₂O to restore both OH groups." },
    ],
    questions: [
      { id: "q-3.1.1.2-m1", ref: "3.1.1.2", stmts: ["3.1.1.2.s10"], type: "mcq", marks: 1, stem: "Which of the following is a non-reducing sugar?", options: ["Glucose", "Maltose", "Sucrose", "Fructose"], answer: 2, explanation: "Sucrose's glycosidic bond ties up both potential reducing groups." },
      { id: "q-3.1.1.2-m2", ref: "3.1.1.2", stmts: ["3.1.1.2.s10"], type: "mcq", marks: 1, stem: "A student heats a food sample with Benedict's reagent and it stays blue. Then she boils a fresh sample with acid, neutralises it and repeats the test, obtaining a brick-red precipitate. What does this show?", options: ["The sample contained a reducing sugar", "The sample contained starch", "The sample contained a non-reducing sugar", "The sample contained no carbohydrate"], answer: 2, explanation: "Hydrolysis released reducing monosaccharides from a non-reducing disaccharide." },
      { id: "q-3.1.1.2-m3", ref: "3.1.1.2", stmts: ["3.1.1.2.s7"], type: "mcq", marks: 1, stem: "Which statement correctly describes amylopectin?", options: ["Unbranched chain of β-glucose", "Branched chain of α-glucose with α-1,4 and α-1,6 bonds", "Unbranched helix of α-glucose", "Straight chains held by hydrogen bonds"], answer: 1, explanation: "Amylopectin is the branched component of starch." },
      { id: "q-3.1.1.2-m4", ref: "3.1.1.2", stmts: ["3.1.1.2.s8", "3.1.3.1.s2"], type: "mcq", marks: 1, stem: "Why can most animals not digest cellulose?", options: ["It contains no glucose", "They lack an enzyme with an active site complementary to cellulose", "It is too soluble to be absorbed", "It is a lipid, not a carbohydrate"], answer: 1, explanation: "Enzymes are specific: amylase's active site is complementary to starch (α-glucose chains), not to cellulose with its β-1,4 bonds." },
      { id: "q-3.1.1.2-m5", ref: "3.1.1.2", stmts: ["3.1.1.2.s10", "3.1.1.2.s7"], type: "mcq", marks: 1, stem: "Why does iodine solution give a blue-black colour with starch but not with cellulose?", options: ["Cellulose has no glucose units", "Iodine fits inside the helix of amylose; cellulose chains are straight", "Cellulose is branched", "Iodine only reacts with α-1,6 bonds"], answer: 1, explanation: "The iodine complex forms within the amylose helix." },
      { id: "q-3.1.1.2-m6", ref: "3.1.1.2", stmts: ["3.1.1.2.s6"], type: "mcq", marks: 1, stem: "How many glycosidic bonds are present in a chain of 50 glucose units in amylose?", options: ["50", "49", "51", "25"], answer: 1, explanation: "Links = units − 1." },
      { id: "q-3.1.1.2-m7", ref: "3.1.1.2", stmts: ["3.1.1.2.s9"], type: "mcq", marks: 1, stem: "Which property of polysaccharides makes them suitable as storage molecules in cells?", options: ["They are highly soluble", "They are insoluble, so they do not affect the cell's water potential", "They are reducing sugars", "They are small molecules"], answer: 1, explanation: "Insolubility avoids osmotic effects." },
      { id: "q-3.1.1.2-m8", ref: "3.1.1.2", stmts: ["3.1.1.2.s10"], type: "mcq", marks: 1, stem: "Why is neutralisation needed after acid hydrolysis in the non-reducing sugar test?", options: ["To stop the sugar being destroyed", "Because Benedict's reagent only works in alkaline conditions", "To make the precipitate dissolve", "To hydrolyse the remaining bonds"], answer: 1, explanation: "Benedict's reagent requires alkaline conditions to reduce Cu2+." },
      { id: "q-3.1.1.2-m9", ref: "3.1.1.2", stmts: ["3.1.1.2.s8", "3.1.1.2.s9"], type: "mcq", marks: 1, stem: "Alternate β-glucose units in cellulose are rotated by 180°. What is the consequence?", options: ["The chain forms a helix", "The chain is straight so chains can hydrogen bond to each other", "The chain is branched", "The chain becomes soluble"], answer: 1, explanation: "Rotation lets C1 and C4 OH groups align, keeping the chain straight." },
      { id: "q-3.1.1.2-match", ref: "3.1.1.2", stmts: ["3.1.1.2.s7", "3.1.1.2.s8", "3.1.1.2.s10"], type: "match", marks: 4, stem: "Match each carbohydrate feature to the molecule.", pairs: [{ left: "Coiled unbranched α-1,4 chain", right: "Amylose" }, { left: "α-1,6 branch points", right: "Amylopectin" }, { left: "β-1,4 bonds with 180° rotation of alternate units", right: "Cellulose" }, { left: "Non-reducing disaccharide in phloem sap", right: "Sucrose" }], explanation: "" },
      { id: "q-3.1.1.2-s1", ref: "3.1.1.2", stmts: ["3.1.1.2.s8", "3.1.1.2.s9"], type: "short", marks: 4, stem: "Explain how the structure of cellulose is related to its function in plant cell walls. (4 marks)",
        scheme: [{ point: "Made of β-glucose joined by β-1,4 glycosidic bonds", marks: 1 }, { point: "Alternate units rotated 180° / straight unbranched chains", marks: 1 }, { point: "Chains lie parallel and form (many) hydrogen bonds between them", marks: 1 }, { point: "Forming microfibrils / fibres with high tensile strength, so the wall resists turgor pressure / prevents bursting", marks: 1 }],
        model: "Cellulose is a polymer of β-glucose joined by β-1,4 glycosidic bonds. Because alternate glucose units are rotated 180°, the chains are straight and unbranched, so they lie side by side and form many hydrogen bonds between chains. This produces microfibrils with very high tensile strength, so the cell wall can withstand the turgor pressure of the cell without bursting.",
        alternatives: "Accept 'cross-links' for hydrogen bonds if described as between chains.", commonErrors: "Describing cellulose as branched or helical; confusing with starch." },
      { id: "q-3.1.1.2-s2", ref: "3.1.1.2", stmts: ["3.1.1.2.s10"], type: "short", marks: 3, stem: "A solution is thought to contain sucrose. Describe how you would show that the solution contains a non-reducing sugar. (3 marks)",
        scheme: [{ point: "Benedict's test (with heat) gives no change / stays blue", marks: 1 }, { point: "Hydrolyse (a fresh sample) with dilute acid and heat, then neutralise with sodium hydrogencarbonate / alkali", marks: 1 }, { point: "Repeat Benedict's test with heat: brick-red / orange precipitate shows non-reducing sugar", marks: 1 }],
        model: "Heat the solution with Benedict's reagent; it stays blue. Boil a fresh sample with dilute hydrochloric acid to hydrolyse the glycosidic bond, then neutralise with sodium hydrogencarbonate. Heat again with Benedict's reagent: a brick-red precipitate confirms a non-reducing sugar.",
        commonErrors: "Omitting the first (negative) test; omitting neutralisation; no mention of heating." },
      { id: "q-3.1.1.2-e1", ref: "3.1.1.2", stmts: ["3.1.1.2.s7", "3.1.1.2.s8", "3.1.1.2.s9"], type: "extended", marks: 6, stem: "Compare the structures of starch and cellulose and explain how each structure is related to its function in plant cells. (6 marks)",
        scheme: [{ point: "Starch: α-glucose; cellulose: β-glucose", marks: 1 }, { point: "Starch has α-1,4 (amylose) and α-1,6 (amylopectin) bonds; cellulose has only β-1,4 bonds", marks: 1 }, { point: "Amylose coils into a helix: compact store", marks: 1 }, { point: "Amylopectin branched: many ends, rapid hydrolysis to glucose for respiration; both insoluble so no osmotic effect", marks: 1 }, { point: "Cellulose chains straight (alternate units rotated), lie parallel with hydrogen bonds between chains", marks: 1 }, { point: "Forms microfibrils with high tensile strength: structural role in cell wall", marks: 1 }],
        levels: "Full marks need both structures compared point by point and each structural feature linked explicitly to a function; a description without 'so/because' links caps at 4.",
        model: "Starch is a polymer of α-glucose made of amylose (unbranched α-1,4 chains that coil into a helix) and amylopectin (α-1,4 chains with α-1,6 branches), whereas cellulose is a polymer of β-glucose joined only by β-1,4 bonds. The amylose helix is compact so starch stores a lot of glucose in little space, and the branches of amylopectin provide many ends for enzymes so glucose is released rapidly; starch is insoluble so it has no osmotic effect on the cell. In cellulose, alternate glucose units are rotated 180°, giving straight chains that lie side by side and hydrogen bond to one another, forming microfibrils of great tensile strength, which is why cellulose is the structural material of cell walls.",
        commonErrors: "Mixing up which polymer is branched; stating cellulose is for energy." },
      { id: "q-3.1.1.2-d1", ref: "3.1.1.2", stmts: ["3.1.1.2.s10"], type: "short", marks: 3, stem: "A student used a colorimeter to measure the absorbance of Benedict's solution after heating it with glucose solutions of known concentration, then with an unknown juice. After heating, each tube was filtered to remove the precipitate and the absorbance of the remaining solution was measured using a red filter.\n\nConcentration (g dm⁻³): 0, 2, 4, 6, 8, 10\nAbsorbance: 0.92, 0.80, 0.66, 0.51, 0.38, 0.24\nUnknown juice: 0.45\n\nEstimate the glucose concentration of the juice and explain why absorbance decreases as glucose concentration increases. (3 marks)",
        scheme: [{ point: "Approximately 7 g dm⁻³ (accept 6.8 to 7.2) read from calibration curve", marks: 1 }, { point: "More glucose reduces more Cu2+ to Cu+ / more precipitate removes more copper(II) from solution", marks: 1 }, { point: "So the solution is less blue and transmits more light / absorbs less light", marks: 1 }],
        model: "Plotting the calibration data, an absorbance of 0.45 corresponds to about 7 g dm⁻³. As glucose concentration rises, more copper(II) ions are reduced to copper(I) oxide precipitate, so less blue copper(II) remains in solution and the supernatant absorbs less light.",
        commonErrors: "Reading the value without stating units; saying the precipitate absorbs light (the precipitate is removed before measuring)." },
      { id: "q-3.1.1.2-id1", ref: "3.1.1.2", stmts: ["3.1.1.2.s2"], type: "label", marks: 4, stem: "The diagram shows two glucose molecules. Identify structures 1 and 2, and the carbon atoms labelled 3 and 4.", svg: idRings,
        labels: [{ n: 1, answer: "β-glucose" }, { n: 2, answer: "α-glucose" }, { n: 3, answer: "Carbon 1" }, { n: 4, answer: "Carbon 4" }],
        bank: ["α-glucose", "β-glucose", "Fructose", "Carbon 1", "Carbon 2", "Carbon 4", "Carbon 6"],
        explanation: "Carbon 1 is next to the ring oxygen and does not carry the CH₂OH group. In molecule 1 its OH points up (same side as CH₂OH), so it is β-glucose; in molecule 2 it points down, so it is α-glucose. Carbon 4 is next to carbon 5 (the carbon that carries CH₂OH), on the side away from the ring oxygen; its OH points down in both isomers." },
      { id: "q-3.1.1.2-m11", ref: "3.1.1.2", stmts: ["3.1.1.2.s11", "3.1.1.2.s3"], type: "mcq", marks: 1, stem: "Ribose is a monosaccharide with the formula C₅H₁₀O₅. What is the molecular formula of a disaccharide formed by condensation of two ribose molecules?", options: ["C₁₀H₂₀O₁₀", "C₁₀H₁₈O₉", "C₁₀H₂₀O₉", "C₁₀H₁₈O₁₀"], answer: 1, explanation: "Two ribose molecules (C₁₀H₂₀O₁₀) minus one water (H₂O) for the one glycosidic bond gives C₁₀H₁₈O₉." },
      { id: "q-3.1.1.2-m12", ref: "3.1.1.2", stmts: ["3.1.1.2.s11"], type: "mcq", marks: 1, stem: "Trehalose, a sugar found in insects, is a disaccharide formed by a glycosidic bond between carbon 1 of one α-glucose and carbon 1 of a second α-glucose. Which statement about the hydrolysis of trehalose is correct?", options: ["One molecule of water is released and glucose and fructose are formed", "One molecule of water is used and two glucose molecules are formed", "Two molecules of water are used because two carbon 1 atoms are involved", "One molecule of water is used and an α-1,4 glycosidic bond is broken"], answer: 1, explanation: "Any glycosidic bond, whatever carbons it joins, is broken by adding one molecule of water. Here it is an α-1,1 bond, and both products are glucose." },
      { id: "q-3.1.1.2-u1", ref: "3.1.1.2", stmts: ["3.1.1.2.s11", "3.1.1.2.s3"], type: "short", marks: 4, stem: "Lactose is a disaccharide found in milk. It is formed by condensation between the OH group on carbon 1 of β-galactose and the OH group on carbon 4 of glucose. Galactose has the same molecular formula as glucose, C₆H₁₂O₆.\n\n(a) Name the bond formed and describe which atoms are removed when lactose is formed. (2 marks)\n(b) Give the molecular formula of lactose. (1 mark)\n(c) Describe what happens when the enzyme lactase hydrolyses lactose. (1 mark)",
        scheme: [{ point: "β-1,4 glycosidic bond", marks: 1 }, { point: "The OH from carbon 1 of galactose and the H from the OH on carbon 4 of glucose are removed as (one molecule of) water; the remaining O joins the two carbons", marks: 1 }, { point: "C₁₂H₂₂O₁₁ (2 × C₆H₁₂O₆ − H₂O)", marks: 1 }, { point: "One molecule of water is used to break the glycosidic bond, giving galactose and glucose (OH restored on carbon 1 of galactose and carbon 4 of glucose)", marks: 1 }],
        model: "(a) A β-1,4 glycosidic bond forms. The OH group is removed from carbon 1 of β-galactose and the H is removed from the OH group on carbon 4 of glucose; together they leave as one molecule of water, and the remaining oxygen links carbon 1 to carbon 4. (b) C₁₂H₂₂O₁₁. (c) Lactase uses one molecule of water to break the glycosidic bond: carbon 1 of galactose gets its OH back and the oxygen left on carbon 4 of glucose gains an H, releasing galactose and glucose.",
        alternatives: "Accept 'β-1→4' for β-1,4.", commonErrors: "Removing both OH groups (that would lose an extra O); saying water is released in hydrolysis; giving C₁₂H₂₄O₁₂." },
      // Added 2026-11-04 (traceability): coverage of s1 (monosaccharides as monomers), s4 (maltose) and s6 (polysaccharides)
      { id: "q-3.1.1.2-n1", ref: "3.1.1.2", stmts: ["3.1.1.2.s1"], type: "mcq", marks: 1, stem: "Which of these carbohydrates is a monosaccharide?", options: ["Fructose", "Maltose", "Sucrose", "Amylose"], answer: 0, explanation: "Fructose (like glucose) is a monosaccharide, a single sugar unit. Maltose and sucrose are disaccharides; amylose is a polysaccharide." },
      { id: "q-3.1.1.2-n2", ref: "3.1.1.2", stmts: ["3.1.1.2.s1", "3.1.1.2.s3", "3.1.1.2.s6"], type: "short", marks: 3, stem: "Glucose and fructose are monosaccharides. Explain what is meant by a monosaccharide and describe how monosaccharides are used to build larger carbohydrates. (3 marks)",
        scheme: [{ point: "A monosaccharide is a single sugar unit / the monomer from which larger carbohydrates are made", marks: 1 }, { point: "Two monosaccharides join by a condensation reaction (water removed), forming a glycosidic bond and a disaccharide", marks: 1 }, { point: "Condensation of many monosaccharides forms a polysaccharide (e.g. starch or cellulose)", marks: 1 }],
        model: "A monosaccharide is a single sugar unit, the monomer from which larger carbohydrates are made. Two monosaccharides join in a condensation reaction, which removes a molecule of water and forms a glycosidic bond, giving a disaccharide. Condensation of many monosaccharides forms a polysaccharide such as starch or cellulose.",
        commonErrors: "Calling a monosaccharide a polymer; saying water is added when the bond forms; naming the bond as a peptide or hydrogen bond." },
      { id: "q-3.1.1.2-n3", ref: "3.1.1.2", stmts: ["3.1.1.2.s4"], type: "mcq", marks: 1, stem: "Maltose is formed by condensation of", options: ["two α-glucose molecules", "α-glucose and fructose", "two β-glucose molecules", "β-glucose and fructose"], answer: 0, explanation: "Maltose is two α-glucose units joined by an α-1,4 glycosidic bond; α-glucose and fructose form sucrose." },
    ],
  };
})();
