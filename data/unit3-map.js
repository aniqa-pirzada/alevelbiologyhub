// Unit 3 synoptic concept map data (Phase 5 Batch 4, author C3; model reviewed as MR-C3, 2026-11-18). Status: draft.
// Same format as data/unit1-map.js and data/unit2-map.js, read by js/views/unit1-map.js (B.views.unitMap). Nodes: the eight
// Unit 3 topics, four key concepts, the Unit 1 and 2 principles that Unit 3 genuinely draws on (kind "principle", always
// labelled with their unit) and the three Unit 3 required practicals. Mutation (3.2.11.1) is not a printed Unit 1 or 2
// principle, so its node carries kindLabel "Unit 2 background" (review MR-C3, M1). Links read "from — label — to".
// Every explanation stays within the 9610 v5.1 specification. Each link carries one original question in the engine
// format (js/core/questions.js), tagged with Unit 3 statements only, so attempts count towards Unit 3 mastery; Unit 1 and
// 2 statements appear only in a link's own `stmts`. Ids q-map-u3-1 … q-map-u3-27 are unique site-wide. Every data set is
// hypothetical and says so. Positions (x, y) are centres in the 1170 × 660 viewBox, chosen by a small search that keeps
// every line clear of every box it does not join and of the key, every numbered circle at least 20 px from every box it
// does not join (10 px from its own two boxes) and the circles apart (see B.unitMaps["3.3"].checkGeometry below, which tests/run.js can call).
window.BIO = window.BIO || {};
window.BIO.unitMaps = window.BIO.unitMaps || {};
(function () {
  const X = [92, 337, 582, 827, 1072], Y = [57, 195, 332, 465, 603];
  const M = {
    title: "Unit 3 concept map",
    lede: "How the eight Unit 3 topics fit together: select a box to see its connections, or a numbered circle to read why two ideas are linked and try a question.",
    principlesNote: "Unit 1 principles (specification, printed page 21) and Unit 2 principles (printed page 27) are shown as white boxes with a dotted border and are always labelled with their unit. The BL03 exam will not set questions on Unit 1 or Unit 2 topics, but its questions may draw on these principles: enzyme rates and temperature, meiosis producing genetically different cells and the species defined by fertile offspring (Unit 1); digestion by enzymes in the human digestive system and correlation not necessarily meaning causation (Unit 2). The box on mutation is labelled “Unit 2 background”: mutation is a Unit 2 topic, not one of the printed principles, and here it is used only for the idea that a change in a gene's base sequence can produce a new allele. The specification's own Unit 3 principles (printed page 34) run through the links: ATP is the immediate source of energy for biological processes and is resynthesised during respiration; energy is transferred through, and chemical elements recycled in, ecosystems; genetic variation occurs within a species, and selection leads to the accumulation of genetic differences in populations.",
    legend: { x: 940, y: 425, step: 20 },
    groups: {
      energy: { fill: "#fbeee0", stroke: "#b0612a", name: "Photosynthesis, respiration and ATP", short: "Energy in cells" },
      eco: { fill: "#e2efe6", stroke: "#4f7d62", name: "Populations, energy transfer and nutrient cycles", short: "Ecosystems" },
      genes: { fill: "#e4ebf5", stroke: "#1e3a5f", name: "Inheritance and allele frequencies", short: "Genes and alleles" },
      evo: { fill: "#ece7f5", stroke: "#5b4a8a", name: "Evolution and speciation", short: "Evolution" },
      practical: { fill: "#fbf0d8", stroke: "#a87412", name: "Required practicals", short: "Required practicals" },
      principle: { fill: "#ffffff", stroke: "#6b7d8f", name: "Unit 1 and 2 principles and background", short: "Unit 1 or 2 idea" },
    },
    nodes: [
      // ----- the eight Unit 3 topics -----
      { id: "t1", kind: "topic", ref: "3.3.1", title: "Populations", href: "#/library/3.3/3.3.1", group: "eco", x: X[2], y: Y[2],
        desc: "Populations, communities, ecosystems and niches; population size varies with abiotic factors, competition and predation; succession to a climax community." },
      { id: "t2", kind: "topic", ref: "3.3.2", title: "Photosynthesis", href: "#/library/3.3/3.3.2", group: "energy", x: X[0], y: Y[2],
        desc: "The light-dependent reaction makes ATP and reduced NADP; the Calvin cycle fixes carbon dioxide with rubisco; limiting factors." },
      { id: "t3", kind: "topic", ref: "3.3.3", title: "Respiration", href: "#/library/3.3/3.3.3", group: "energy", x: X[3], y: Y[0],
        desc: "Glycolysis, anaerobic respiration, the link reaction, the Krebs cycle and oxidative phosphorylation; respiratory substrates and RQ." },
      { id: "t4", kind: "topic", ref: "3.3.4", title: "Energy transfer", href: "#/library/3.3/3.3.4", group: "eco", x: X[1], y: Y[2],
        desc: "Energy passes inefficiently along food chains and webs; pyramids; GPP, NPP and the net production of consumers; farming practices." },
      { id: "t5", kind: "topic", ref: "3.3.5", title: "Nutrient cycles", href: "#/library/3.3/3.3.5", group: "eco", x: X[3], y: Y[1],
        desc: "Decomposers release elements as ions or simple inorganic molecules; the carbon cycle and climate change; the nitrogen cycle, fertilisers and eutrophication." },
      { id: "t6", kind: "topic", ref: "3.3.6", title: "Inheritance", href: "#/library/3.3/3.3.6", group: "genes", x: X[3], y: Y[4],
        desc: "Genotype and phenotype; dominant, recessive and codominant alleles; genetic diagrams for monohybrid and dihybrid crosses; the chi-squared test." },
      { id: "t7", kind: "topic", ref: "3.3.7", title: "Allele frequencies", href: "#/library/3.3/3.3.7", group: "genes", x: X[1], y: Y[3],
        desc: "Population, gene pool and allele frequency; selective breeding, genetic bottlenecks and genetic drift; the Hardy-Weinberg principle and equation." },
      { id: "t8", kind: "topic", ref: "3.3.8", title: "Evolution and speciation", href: "#/library/3.3/3.3.8", group: "evo", x: X[2], y: Y[3],
        desc: "Evolution as a change in allele frequencies; differential survival and reproduction; directional, stabilising and disruptive selection; allopatric and sympatric speciation." },
      // ----- key concepts -----
      { id: "c-lim", kind: "concept", ref: "3.3.2.3", title: "Limiting factors", href: "#/topic/3.3.2.3", group: "energy", x: X[0], y: Y[1],
        desc: "Carbon dioxide concentration, light intensity and temperature: the factor in shortest supply limits the rate of photosynthesis." },
      { id: "c-atp", kind: "concept", ref: "3.3.3.3", title: "ATP, the immediate energy source", href: "#/topic/3.3.3.3", group: "energy", x: X[1], y: Y[1],
        desc: "Unit 3 principle: ATP is the immediate source of energy for biological processes. It is made in photosynthesis and resynthesised in respiration." },
      { id: "c-npp", kind: "concept", ref: "3.3.4.2", title: "GPP, NPP and R", href: "#/topic/3.3.4.2", group: "eco", x: X[0], y: Y[3],
        desc: "GPP is the chemical energy stored in plant biomass per unit area or volume per unit time; NPP is what remains after respiratory losses: NPP = GPP − R." },
      { id: "c-hw", kind: "concept", ref: "3.3.7.2", title: "Hardy-Weinberg principle", href: "#/topic/3.3.7.2", group: "genes", x: X[1], y: Y[4],
        desc: "A mathematical model predicting that allele frequencies stay constant between generations under stated conditions; p + q = 1 and p² + 2pq + q² = 1." },
      // ----- Unit 1 and 2 principles, and Unit 2 background (labelled; open the earlier page) -----
      { id: "p-enz", kind: "principle", ref: "3.1.3.2", title: "Enzyme rates and temperature", href: "#/topic/3.1.3.2", group: "principle", x: X[1], y: Y[0],
        desc: "Unit 1 principle: enzymes are proteins, and the rates of the reactions they catalyse are influenced by temperature, pH, inhibitors and substrate and enzyme concentrations." },
      { id: "p-meio", kind: "principle", ref: "3.1.9.1", title: "Meiosis gives different cells", href: "#/topic/3.1.9.1", group: "principle", x: X[3], y: Y[3],
        desc: "Unit 1 principle: meiosis produces daughter cells that are genetically different from each other." },
      { id: "p-sp", kind: "principle", ref: "3.1.10.1", title: "Species: fertile offspring", href: "#/topic/3.1.10.1", group: "principle", x: X[3], y: Y[2],
        desc: "Unit 1 principle: a species may be defined in terms of the ability to produce fertile offspring." },
      { id: "p-mut", kind: "principle", kindLabel: "Unit 2 background", ref: "3.2.11", title: "Mutation makes new alleles", href: "#/topic/3.2.11.1", group: "principle", x: X[0], y: Y[4],
        desc: "Unit 2 background, not a printed principle: a change in the base sequence of a gene can produce a new allele." },
      { id: "p-corr", kind: "principle", ref: "3.2.1.2", title: "Correlation is not causation", href: "#/topic/3.2.1.2", group: "principle", x: X[2], y: Y[1],
        desc: "Unit 2 principle: investigations frequently identify correlations, but a correlation between variables does not necessarily mean that there is a causal relationship." },
      { id: "p-dig", kind: "principle", ref: "3.2.2.1", title: "Digestion and absorption", href: "#/topic/3.2.2.1", group: "principle", x: X[4], y: Y[0],
        desc: "Unit 2 principle: in the human digestive system, food is digested by enzymes and the products of digestion are absorbed across cell membranes." },
      // ----- required practicals -----
      { id: "rp7", kind: "practical", ref: "3.3.2.3", rp: 7, title: "RP7: limiting factor", href: "#/topic/3.3.2.3", lab: "#/lab/7", group: "practical", x: X[0], y: Y[0],
        desc: "Required practical 7: investigation of the effect of a specific limiting factor, such as light intensity, on the rate of photosynthesis." },
      { id: "rp8", kind: "practical", ref: "3.3.3.1", rp: 8, title: "RP8: rate of respiration", href: "#/topic/3.3.3.1", lab: "#/lab/8", group: "practical", x: X[2], y: Y[0],
        desc: "Required practical 8: investigation of a specific variable, such as temperature, on the rate of respiration of a suitable organism such as yeast." },
      { id: "rp9", kind: "practical", ref: "3.3.1.2", rp: 9, title: "RP9: seedling competition", href: "#/topic/3.3.1.2", lab: "#/lab/9", group: "practical", x: X[4], y: Y[1],
        desc: "Required practical 9: a laboratory based investigation of the effect of competition on seedling growth." },
    ],

    links: [
      // ===== Energy in cells: ATP, limiting factors and the practicals =====
      { id: "ps-atp", from: "t2", to: "c-atp", label: "generates, in its light-dependent reaction,",
        explanation: "Light energy excites electrons in chlorophyll. As these electrons pass along the electron transfer chain in the thylakoid membranes, protons pass across the membranes, and ATP synthase embedded in them catalyses the production of ATP; reduced NADP is also made (3.3.2.1). Both are used in the light-independent reaction to reduce GP to triose phosphate (3.3.2.2). This is one half of a Unit 3 principle: ATP is the immediate source of energy for biological processes.",
        stmts: ["3.3.2.1.s2", "3.3.2.1.s3", "3.3.2.1.s4", "3.3.2.2.s2"],
        question: { id: "q-map-u3-1", ref: "3.3.2.2", stmts: ["3.3.2.1.s3", "3.3.2.1.s4", "3.3.2.2.s2"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "A herbicide stops electrons passing along the electron transfer chain in the thylakoid membranes. Why does the production of triose phosphate in the Calvin cycle then stop?",
          options: ["No ATP or reduced NADP is made to reduce GP", "Carbon dioxide can no longer diffuse into the leaf", "Rubisco is denatured because no light reaches it", "No oxygen is released, so the chloroplast cannot respire"], answer: 0,
          explanation: "ATP and reduced NADP come from the light-dependent reaction. Without them GP is not reduced to triose phosphate, even though carbon dioxide can still react with RuBP for a short time." } },

      { id: "resp-atp", from: "t3", to: "c-atp", label: "resynthesises, by oxidative phosphorylation,",
        explanation: "Glycolysis, the link reaction and the Krebs cycle produce reduced coenzymes. In oxidative phosphorylation their electrons pass along the electron transfer chain on the inner mitochondrial membrane, protons pass across the membrane, and ATP synthase embedded in it catalyses ATP synthesis; oxygen is the final electron acceptor (3.3.3.3). Without oxygen only glycolysis makes ATP, and converting pyruvate to lactate, or to ethanol and carbon dioxide, using reduced NAD regenerates NAD so that glycolysis can continue (3.3.3.2). Unit 3 principle: ATP is resynthesised during respiration.",
        stmts: ["3.3.3.3.s4", "3.3.3.3.s5", "3.3.3.2.s1", "3.3.3.2.s2"],
        question: { id: "q-map-u3-2", ref: "3.3.3.3", stmts: ["3.3.3.3.s5", "3.3.3.2.s2"], ao: ["AO2"], type: "short", marks: 2,
          stem: "A poison stops electrons passing along the electron transfer chain in mitochondria. Explain why lactate builds up in the muscles of a poisoned animal. (2 marks)",
          scheme: [
            { point: "Oxidative phosphorylation stops, so reduced NAD is not reoxidised / the cells depend on glycolysis for ATP", marks: 1 },
            { point: "Pyruvate is converted to lactate using reduced NAD, which regenerates NAD so that glycolysis can continue", marks: 1 } ],
          alternatives: "Accept 'the Krebs cycle and link reaction stop' for the first point.",
          commonErrors: "Saying lactate is made because there is no oxygen in the blood; the poison stops the chain even when oxygen is present.",
          model: "With the electron transfer chain blocked, oxidative phosphorylation stops and reduced NAD is no longer reoxidised, so the cells depend on glycolysis for ATP. Pyruvate is converted to lactate using reduced NAD, which regenerates NAD so that glycolysis can continue, and lactate builds up." } },

      { id: "ps-lim", from: "t2", to: "c-lim", label: "has a rate set by the factor in shortest supply:",
        explanation: "The rate of photosynthesis is limited by whichever of carbon dioxide concentration, light intensity and temperature is in shortest supply (3.3.2.3). Raising that factor raises the rate until another factor becomes limiting, so the graph levels off. Light intensity affects the light-dependent reaction; carbon dioxide concentration affects its reaction with RuBP, catalysed by rubisco (3.3.2.2); temperature affects the enzyme-controlled reactions.",
        stmts: ["3.3.2.3.s1", "3.3.2.2.s1"],
        question: { id: "q-map-u3-3", ref: "3.3.2.3", stmts: ["3.3.2.3.s1"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "Hypothetical data. At 0.04 % carbon dioxide and 20 °C, the rate of photosynthesis of a plant rose as light intensity increased and then levelled off. At the plateau, raising the carbon dioxide concentration to 0.1 % increased the rate further. What limited the rate at the plateau at 0.04 % carbon dioxide?",
          options: ["Carbon dioxide concentration", "Light intensity", "Temperature, because the enzymes were denatured", "The amount of water available to the plant"], answer: 0,
          explanation: "More light gave no increase at the plateau, so light was not limiting; more carbon dioxide raised the rate, so carbon dioxide was the limiting factor." } },

      { id: "enz-lim", from: "p-enz", to: "c-lim", label: "explains why temperature is one of the",
        explanation: "Unit 1 principle: the rate of an enzyme-controlled reaction rises with temperature, because molecules have more kinetic energy and collide more often, up to an optimum; above it the active site changes shape. The light-independent reaction is enzyme-controlled, with rubisco catalysing the reaction of carbon dioxide with RuBP (3.3.2.2), so in bright light with plenty of carbon dioxide a low temperature can limit the rate of photosynthesis, and a very high temperature lowers it (3.3.2.3).",
        stmts: ["3.1.3.2.s2", "3.1.3.2.s3", "3.3.2.3.s1", "3.3.2.2.s1"],
        question: { id: "q-map-u3-4", ref: "3.3.2.3", stmts: ["3.3.2.3.s1", "3.3.2.2.s1"], ao: ["AO2"], type: "short", marks: 2,
          stem: "Hypothetical data. In bright light and a high carbon dioxide concentration, a plant photosynthesised twice as fast at 25 °C as at 10 °C. Explain why. (2 marks)",
          scheme: [
            { point: "Temperature was the limiting factor (light and carbon dioxide were not limiting)", marks: 1 },
            { point: "Enzymes such as rubisco / of the Calvin cycle have more kinetic energy, so more enzyme-substrate collisions / complexes form per second", marks: 1 } ],
          commonErrors: "Saying the enzymes were denatured at 10 °C; low temperature slows enzymes but does not denature them.",
          model: "With light and carbon dioxide plentiful, temperature was the limiting factor. At 25 °C enzymes of the Calvin cycle, such as rubisco, and their substrates have more kinetic energy, so more enzyme-substrate complexes form per second and the rate of photosynthesis is higher." } },

      { id: "lim-rp7", from: "c-lim", to: "rp7", label: "is investigated, for light intensity, in",
        explanation: "In required practical 7, a piece of an aquatic plant in sodium hydrogencarbonate solution, which supplies carbon dioxide, is placed at measured distances from a lamp and the bubbles released per minute are counted. Light intensity is taken as 1/d², the inverse square law. The other limiting factors, carbon dioxide and temperature, are kept the same, and Spearman's rank correlation test shows whether light intensity and the rate are correlated.",
        stmts: ["3.3.2.3.s1"],
        question: { id: "q-map-u3-5", ref: "3.3.2.3", stmts: ["3.3.2.3.s1"], ao: ["AO2"], type: "gap", marks: 2,
          stem: "Hypothetical set-up. Light intensity is taken as 1/d², where d is the distance from the lamp in cm.",
          text: "At 10 cm, the relative light intensity is {{1}} cm⁻². Moving the lamp from 10 cm to 20 cm multiplies the light intensity by {{2}}.",
          answers: { 1: ["0.01", "0.010"], 2: ["0.25", "one quarter", "a quarter"] },
          explanation: "1 ÷ 10² = 1 ÷ 100 = 0.01. At 20 cm, 1 ÷ 400 = 0.0025, and 0.0025 ÷ 0.01 = 0.25: doubling the distance quarters the light intensity." } },

      { id: "enz-rp8", from: "p-enz", to: "rp8", label: "explains the effect of temperature measured in",
        explanation: "In the required practical 8 exemplar, yeast respires glucose in a solution containing methylene blue, which is reduced and loses its colour as respiration proceeds. The time to decolourise is measured at each temperature, and the rate is taken as 1/time. Respiration is a series of enzyme-controlled reactions (3.3.3.1), so, as the Unit 1 principle predicts, the rate rises with temperature up to an optimum and then falls as enzymes denature.",
        stmts: ["3.1.3.2.s2", "3.1.3.2.s3", "3.3.3.1.s1", "3.3.3.1.s2"],
        question: { id: "q-map-u3-6", ref: "3.3.3.1", stmts: ["3.3.3.1.s1", "3.3.3.1.s2"], ao: ["AO2", "AO3"], type: "short", marks: 3,
          stem: "Hypothetical results for yeast respiring glucose with methylene blue: the dye decolourised in 300 s at 20 °C, 120 s at 35 °C and 160 s at 45 °C. Calculate the rate at 35 °C as 1000 ÷ time (arbitrary units), and explain the pattern of results. (3 marks)",
          scheme: [
            { point: "Rate at 35 °C = 1000 ÷ 120 = 8.3 (arbitrary units; accept 8.33)", marks: 1 },
            { point: "From 20 to 35 °C (rates 3.3 and 8.3), molecules have more kinetic energy, so more enzyme-substrate collisions in respiration and the dye is reduced faster", marks: 1 },
            { point: "At 45 °C (rate 6.25) some enzymes begin to denature / active sites change shape, so fewer enzyme-substrate complexes form and the rate falls", marks: 1 } ],
          commonErrors: "Describing the times instead of the rates: a shorter time means a faster rate.",
          model: "The rate at 35 °C is 1000 ÷ 120 = 8.3. Between 20 °C (rate 3.3) and 35 °C the enzymes of respiration and their substrates have more kinetic energy, so there are more enzyme-substrate collisions and the dye is reduced faster. At 45 °C (rate 6.25) some enzymes begin to denature, their active sites change shape and fewer enzyme-substrate complexes form, so the rate falls." } },

      { id: "resp-rp8", from: "t3", to: "rp8", label: "has a rate that can be measured, for yeast, in",
        explanation: "The rate of respiration can be measured as the rate at which a dye such as methylene blue is reduced, or as the volume of gas exchanged in a respirometer. The ratio of carbon dioxide produced to oxygen consumed, in the same units, is the respiratory quotient (RQ), which suggests the respiratory substrate in use; conclusions drawn from RQ values are tentative (3.3.3.4).",
        stmts: ["3.3.3.4.s2", "3.3.3.4.s3", "3.3.3.1.s1"],
        question: { id: "q-map-u3-7", ref: "3.3.3.4", stmts: ["3.3.3.4.s2", "3.3.3.4.s3"], ao: ["AO2", "AO3"], type: "short", marks: 2,
          stem: "Hypothetical respirometer results: in one hour, some germinating seeds used 2.0 cm³ of oxygen and released 1.8 cm³ of carbon dioxide. Calculate the RQ and explain why any conclusion about the respiratory substrate is tentative. (2 marks)",
          scheme: [
            { point: "RQ = 1.8 ÷ 2.0 = 0.9", marks: 1 },
            { point: "0.9 could mean protein, or a mixture of carbohydrate (1.0) and lipid (0.7) / some anaerobic respiration would add carbon dioxide, so the substrate cannot be identified with certainty", marks: 1 } ],
          model: "RQ = carbon dioxide produced ÷ oxygen consumed = 1.8 ÷ 2.0 = 0.9. This could mean protein is being respired, or a mixture of carbohydrate (RQ 1.0) and lipid (RQ 0.7), and any anaerobic respiration would raise the RQ, so the substrate cannot be identified with certainty." } },

      { id: "ps-npp", from: "t2", to: "c-npp", label: "stores chemical energy in biomass, giving",
        explanation: "Triose phosphate from the Calvin cycle is converted into the plant's organic substances (3.3.2.2). The chemical energy stored in plant biomass in this way, per unit area or volume per unit time, is the gross primary production (GPP). Plants use part of it in their own respiration (R). What remains, NPP = GPP − R, is available for growth and reproduction and to consumers and decomposers (3.3.4.2).",
        stmts: ["3.3.4.2.s1", "3.3.4.2.s2", "3.3.2.2.s3"],
        question: { id: "q-map-u3-8", ref: "3.3.4.2", stmts: ["3.3.4.2.s1", "3.3.4.2.s2"], ao: ["AO2"], type: "short", marks: 2,
          stem: "Hypothetical data. A young plantation and an old forest have the same GPP, but the young plantation has the higher NPP. Suggest why. (2 marks)",
          scheme: [
            { point: "NPP = GPP − R, so the old forest must have the greater respiratory loss (R)", marks: 1 },
            { point: "Old trees have more non-photosynthetic tissue (trunks, branches, roots) that respires / more biomass to maintain", marks: 1 } ],
          model: "NPP = GPP − R, so with the same GPP the old forest must lose more energy in respiration. Old trees have a large mass of non-photosynthetic tissue, such as trunks, branches and roots, which respires but does not photosynthesise." } },

      { id: "npp-tr", from: "c-npp", to: "t4", label: "is the energy available to the next trophic level in",
        explanation: "Only NPP is available to primary consumers. Transfer is inefficient: much of the plant is not eaten, some is not digested and is lost in faeces (F), some is lost in urine (U), and much is lost in respiration (R), so the net production of a consumer is N = I − (F + U + R) (3.3.4.2). This is why pyramids of energy narrow at each trophic level (3.3.4.1).",
        stmts: ["3.3.4.2.s1", "3.3.4.2.s3", "3.3.4.1.s1", "3.3.4.1.s2"],
        question: { id: "q-map-u3-9", ref: "3.3.4.2", stmts: ["3.3.4.2.s3", "3.3.4.1.s2"], ao: ["AO2"], type: "gap", marks: 2,
          stem: "Hypothetical values for a grassland, in kJ m⁻² yr⁻¹: plant NPP 8000; chemical energy in the plant material eaten by herbivores (I) 1200; herbivore net production (N) 96.",
          text: "Energy lost by the herbivores in faeces, urine and respiration = {{1}} kJ m⁻² yr⁻¹. Percentage of the NPP not eaten by herbivores = {{2}} %.",
          answers: { 1: ["1104"], 2: ["85"] },
          explanation: "N = I − (F + U + R), so F + U + R = I − N = 1200 − 96 = 1104. Not eaten: (8000 − 1200) ÷ 8000 × 100 = 6800 ÷ 8000 × 100 = 85 %." } },

      // ===== Ecosystems: carbon, nutrients and populations =====
      { id: "resp-cyc", from: "t3", to: "t5", label: "in every organism, including decomposers, returns carbon dioxide to",
        explanation: "Every respiring organism releases carbon dioxide, including the saprophytic microorganisms that decompose dead matter (3.3.5.1). The specification names carbon dioxide from the Krebs cycle (3.3.3.3); the link reaction also releases it when three-carbon pyruvate becomes two-carbon acetate. With photosynthesis, respiration causes short-term fluctuations in atmospheric carbon dioxide concentration; human activity, such as burning fossil fuels, causes the long-term rise (3.3.5.2).",
        stmts: ["3.3.3.3.s1", "3.3.3.3.s4", "3.3.5.1.s1", "3.3.5.2.s1"],
        question: { id: "q-map-u3-10", ref: "3.3.5.2", stmts: ["3.3.3.3.s4", "3.3.5.2.s1"], ao: ["AO1"], type: "mcq", marks: 1,
          stem: "In aerobic respiration, which stages release the carbon dioxide that enters the carbon cycle?",
          options: ["The link reaction and the Krebs cycle", "Glycolysis only", "Oxidative phosphorylation, when oxygen accepts electrons", "The light-independent reaction"], answer: 0,
          explanation: "Pyruvate (three carbons) is oxidised to acetate (two carbons) in the link reaction, and the Krebs cycle releases the rest of the carbon as carbon dioxide. Glycolysis releases none, and oxygen accepting electrons forms water." } },

      { id: "dig-cyc", from: "p-dig", to: "t5", label: "with assimilation, passes elements along food chains in",
        explanation: "Unit 2 principle: in the human digestive system, food is digested by enzymes and the products are absorbed across cell membranes. Applied to other consumers, such as herbivores, digestion and assimilation pass the elements in organic molecules, such as carbon and nitrogen, from producers to consumers (3.3.5.1); remains, faeces and urine go to the decomposers.",
        stmts: ["3.2.2.1.s2", "3.2.2.1.s3", "3.3.5.1.s1", "3.3.5.1.s2"],
        question: { id: "q-map-u3-11", ref: "3.3.5.1", stmts: ["3.3.5.1.s2", "3.3.5.2.s1"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "A herbivore eats plant starch. Which describes what happens to the carbon in the starch?",
          options: ["It is digested and absorbed; some is assimilated, some respired", "It is absorbed unchanged and stored in the herbivore's muscles", "All of it is egested in the faeces, because starch is not digested", "It is fixed again by the herbivore's cells, as it is in plants"], answer: 0,
          explanation: "Digestion and absorption pass the carbon into the herbivore; assimilation builds it into new molecules, and respiration returns some of it to the air as carbon dioxide." } },

      { id: "fert-pop", from: "t5", to: "t1", label: "leached fertiliser changes the abiotic conditions for populations in",
        explanation: "Leached nitrate can cause eutrophication (3.3.5.3): algae grow rapidly and block the light from plants below them, and when the algae die, the aerobic respiration of the decomposers lowers the dissolved oxygen. Light and oxygen are abiotic factors, so the populations of plants, fish and invertebrates change (3.3.1.2).",
        stmts: ["3.3.5.3.s3", "3.3.1.2.s1"],
        question: { id: "q-map-u3-12", ref: "3.3.1.2", stmts: ["3.3.1.2.s1", "3.3.5.3.s3"], ao: ["AO2"], type: "gap", marks: 2,
          stem: "Hypothetical survey. Before an algal bloom, a pond had 240 submerged plant shoots per m²; after it, 54.",
          text: "Percentage decrease in shoots = {{1}} %. The abiotic factor that the algae most directly reduced for the submerged plants is {{2}}.",
          answers: { 1: ["77.5", "78"], 2: ["light", "light intensity"] },
          explanation: "(240 − 54) ÷ 240 × 100 = 186 ÷ 240 × 100 = 77.5 %. The bloom at the surface blocks light from the plants below." } },

      { id: "web-pop", from: "t4", to: "t1", label: "feeding links in food webs change the population sizes in",
        explanation: "A food web shows the feeding relationships through which energy passes between trophic levels (3.3.4.1). Predation is one of the interactions that make population size vary, so a change in one population affects the others linked to it, including competitors that share a food source (3.3.1.2).",
        stmts: ["3.3.4.1.s1", "3.3.1.2.s2"],
        question: { id: "q-map-u3-13", ref: "3.3.1.2", stmts: ["3.3.1.2.s2", "3.3.4.1.s1"], ao: ["AO2"], type: "short", marks: 2,
          stem: "Hypothetical food web: foxes eat rabbits and voles; rabbits and voles both eat grass. A disease kills most of the rabbits. Suggest and explain one likely effect on the fox population and one on the vole population. (2 marks)",
          scheme: [
            { point: "Foxes: the population falls, because less food (energy) is available (accept: falls less than expected, because foxes eat more voles)", marks: 1 },
            { point: "Voles: fall, because foxes eat more of them (more predation); or rise, because there is less interspecific competition for grass", marks: 1 } ],
          alternatives: "Either vole answer earns the mark only with its reason.",
          model: "The fox population is likely to fall because less food is available, although foxes may eat more voles instead. The vole population may then fall because of increased predation, or rise because there is less interspecific competition with rabbits for grass." } },

      { id: "pop-rp9", from: "t1", to: "rp9", label: "intraspecific competition between seedlings is investigated in",
        explanation: "In required practical 9, seeds are sown at different densities on filter paper in Petri dishes with the same volume of water and kept in a dark cupboard, which removes competition for light. The seedlings compete for space and water, and their growth, for example root length, is compared between densities (3.3.1.2).",
        stmts: ["3.3.1.2.s2"],
        question: { id: "q-map-u3-14", ref: "3.3.1.2", stmts: ["3.3.1.2.s2"], ao: ["AO2"], type: "gap", marks: 2,
          stem: "Hypothetical RP9 results: the mean root length was 42 mm with 10 seeds per dish and 19 mm with 80 seeds per dish. Give the percentage to 1 decimal place.",
          text: "Percentage decrease in mean root length = {{1}} %. Apart from space, the seedlings in the dark competed for {{2}}.",
          answers: { 1: ["54.8"], 2: ["water"] },
          explanation: "(42 − 19) ÷ 42 × 100 = 23 ÷ 42 × 100 = 54.8 %. The dark cupboard removes competition for light, leaving space and water." } },

      { id: "corr-pop", from: "p-corr", to: "t1", label: "warns against reading cause from correlation in",
        explanation: "Unit 2 principle: a correlation between variables does not necessarily mean that there is a causal relationship. When data on the distribution and abundance of organisms show a correlation with a factor, another factor that varies with it may be the cause (3.3.1.2); a controlled experiment is needed to test a causal link.",
        stmts: ["3.2.1.2.s3", "3.3.1.2.s3"],
        question: { id: "q-map-u3-15", ref: "3.3.1.2", stmts: ["3.3.1.2.s3"], ao: ["AO3"], type: "mcq", marks: 1,
          stem: "Hypothetical transect. The number of plants of a moss species per quadrat rose as light intensity fell (a strong negative correlation). Which conclusion is best supported?",
          options: ["They are correlated, but another factor, such as moisture, may cause it", "Low light intensity causes the moss to grow faster in the shade", "The moss lowers the light intensity, so it causes the correlation", "There is no relationship, because a survey cannot show one"], answer: 0,
          explanation: "A survey can show a correlation, but not that light causes the change; shaded places may also be damper. An experiment controlling other variables would test cause." } },

      // ===== Selection, allele frequencies and speciation =====
      { id: "pop-sel", from: "t1", to: "t8", label: "competition, predation and disease cause the differential survival of",
        explanation: "Population size varies with competition and predation (3.3.1.2). The same interactions, together with disease, result in differential survival and reproduction: individuals whose phenotypes give a selective advantage are more likely to survive, reproduce and pass on their alleles to the next generation (3.3.8.1).",
        stmts: ["3.3.1.2.s2", "3.3.8.1.s3", "3.3.8.1.s4"],
        question: { id: "q-map-u3-16", ref: "3.3.8.1", stmts: ["3.3.8.1.s2", "3.3.8.1.s3", "3.3.8.1.s4"], ao: ["AO1"], type: "sequence", marks: 3,
          stem: "Put the steps of natural selection into the correct order. (Marks are given for steps in the correct position.)",
          steps: [
            "Individuals in the population vary in phenotype",
            "Some phenotypes are less likely to be caught by predators",
            "Individuals with those phenotypes are more likely to survive and reproduce",
            "They pass on the alleles for that phenotype to their offspring",
            "The frequency of those alleles in the gene pool increases over generations" ],
          explanation: "Variation, then a selection pressure, then differential survival and reproduction, then inheritance, then a change in allele frequency: evolution happens to the population, not to individuals." } },

      { id: "pop-bot", from: "t1", to: "t7", label: "a severe fall in population size is a bottleneck in",
        explanation: "Population size may fall because of abiotic factors and events, such as drought, fire or flood (3.3.1.2), or because of human activity, such as hunting or habitat loss. A severe reduction is a genetic bottleneck (3.3.7.1): the survivors carry only part of the gene pool, so its diversity is reduced, and it stays low even if numbers recover. A particular allele may or may not be lost; in the small population, genetic drift then has a larger effect.",
        stmts: ["3.3.1.2.s1", "3.3.7.1.s4", "3.3.7.1.s5"],
        question: { id: "q-map-u3-17", ref: "3.3.7.1", stmts: ["3.3.7.1.s4", "3.3.7.1.s2"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "Hypothetical. Before hunting, 60 different alleles of one highly variable gene were found in a seal population. Hunting left only 20 seals. What is the largest number of different alleles of this gene that the 20 survivors could carry?",
          options: ["40", "20", "60", "80"], answer: 0,
          explanation: "20 diploid seals carry 2 × 20 = 40 copies of the gene, so at most 40 different alleles: at least 20 alleles were lost. A bottleneck reduces diversity in the gene pool, and recovery in numbers does not bring the lost alleles back." } },

      { id: "inh-pool", from: "t6", to: "t7", label: "the two alleles in each individual together make up the gene pool in",
        explanation: "In a diploid organism each individual has two alleles at a locus, and may be homozygous or heterozygous (3.3.6.1). The gene pool is the complete set of alleles for a gene in a population, so N individuals carry 2N alleles of an autosomal gene; the allele frequency is the proportion of these that is a particular allele (3.3.7.1).",
        stmts: ["3.3.6.1.s3", "3.3.7.1.s2"],
        question: { id: "q-map-u3-18", ref: "3.3.7.1", stmts: ["3.3.7.1.s2", "3.3.6.1.s3"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "Hypothetical. Every individual in a population is heterozygous, Aa. What is the frequency of allele a in the gene pool?",
          options: ["0.5", "1.0", "0.25", "0.75"], answer: 0,
          explanation: "Each individual carries two alleles, one A and one a, so a makes up half of the 2N alleles: 0.5. A population of heterozygotes is not in Hardy-Weinberg proportions, but its allele frequencies can still be counted." } },

      { id: "inh-hw", from: "t6", to: "c-hw", label: "dominant and recessive phenotype frequencies are analysed with",
        explanation: "With a dominant and a recessive allele, only the homozygous recessive genotype shows the recessive phenotype, so its frequency is q². The dominant phenotype is p² + 2pq, because heterozygotes look like dominant homozygotes (3.3.6.1). So q is found as the square root of the recessive phenotype frequency, and then p = 1 − q (3.3.7.2).",
        stmts: ["3.3.6.1.s2", "3.3.7.2.s2"],
        question: { id: "q-map-u3-19", ref: "3.3.7.2", stmts: ["3.3.7.2.s2", "3.3.6.1.s2"], ao: ["AO2"], type: "gap", marks: 3,
          stem: "Hypothetical. In a population, the frequency of the dominant allele A is 0.9. Assume that the Hardy-Weinberg conditions apply.",
          text: "q = {{1}}. Frequency of individuals with the dominant phenotype = {{2}}. Frequency of heterozygotes = {{3}}.",
          answers: { 1: ["0.1", "0.10"], 2: ["0.99"], 3: ["0.18"] },
          explanation: "q = 1 − 0.9 = 0.1. The dominant phenotype is p² + 2pq = 0.81 + 0.18 = 0.99 (or 1 − q² = 1 − 0.01). Heterozygotes: 2pq = 2 × 0.9 × 0.1 = 0.18. Most copies of a rare recessive allele are carried by heterozygotes." } },

      { id: "pool-hw", from: "t7", to: "c-hw", label: "is predicted to stay constant, under five conditions, by",
        explanation: "The Hardy-Weinberg principle is a mathematical model that predicts that allele frequencies will not change from generation to generation if the population is large, mating is random, and there is no mutation, no migration into or out of the population and no selection (3.3.7.2).",
        stmts: ["3.3.7.2.s1"],
        question: { id: "q-map-u3-20", ref: "3.3.7.2", stmts: ["3.3.7.2.s1"], ao: ["AO2"], type: "match", marks: 3,
          stem: "Hypothetical situations in three bird populations. Match each one to the Hardy-Weinberg condition that it breaks.",
          pairs: [
            { left: "Birds from another island join the population every spring", right: "No migration into or out of the population" },
            { left: "Females mate only with the brightest males", right: "Random mating" },
            { left: "Only 30 birds are left after a storm", right: "A large population" } ],
          explanation: "Migration brings in alleles; mate choice makes mating non-random; a small population is open to genetic drift. In each case the model's prediction of constant allele frequencies may fail." } },

      { id: "hw-sel", from: "c-hw", to: "t8", label: "a change from its prediction suggests selection, as in",
        explanation: "If allele frequencies change between generations, at least one Hardy-Weinberg condition is not met (3.3.7.2). Selection is one possibility, so the change suggests, but does not prove, natural selection; genetic drift in a small population, migration or non-random mating could also be the cause. Evolution itself is a change in the allele frequencies of a population (3.3.8.1).",
        stmts: ["3.3.7.2.s1", "3.3.8.1.s1", "3.3.8.1.s5"],
        question: { id: "q-map-u3-21", ref: "3.3.7.2", stmts: ["3.3.7.2.s1", "3.3.8.1.s5"], ao: ["AO3"], type: "mcq", marks: 1,
          stem: "Hypothetical. In a large population, the frequency p of one allele rose from 0.60 to 0.75 in five generations. What does this show?",
          options: ["A Hardy-Weinberg condition is not met: selection is likely but not proven", "It proves selection, because p changed steadily in one direction", "The equation was used wrongly, because p must always stay at 0.5", "Nothing has changed, because the population is large and mates randomly"], answer: 0,
          explanation: "A change in allele frequency means the model's conditions are not all met. Selection is likely in a large population, but migration or non-random mating could also play a part." } },

      { id: "sel-pool", from: "t8", to: "t7", label: "natural selection changes the allele frequencies in",
        explanation: "Evolution is a change in the allele frequencies of a population. Individuals with phenotypes that give a selective advantage tend to produce more offspring and pass on their favourable alleles, so over generations those alleles become more frequent in the gene pool (3.3.8.1). Individuals do not evolve; populations do.",
        stmts: ["3.3.8.1.s1", "3.3.8.1.s4", "3.3.7.1.s2"],
        question: { id: "q-map-u3-22", ref: "3.3.8.1", stmts: ["3.3.8.1.s1"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "Hypothetical observations of a population of beetles. Which one shows that the population has evolved?",
          options: ["An allele's frequency in the gene pool changed over several generations", "The mean body mass rose over several years because food was plentiful", "One beetle grew darker during a cold spell and then survived it", "The population size doubled over several generations"], answer: 0,
          explanation: "Evolution is a change in allele frequencies. Changes in body mass caused by food, in one individual or in population size alone do not show a change in the gene pool." } },

      { id: "mut-pool", from: "p-mut", to: "t7", label: "is the source of new alleles that enter",
        explanation: "Unit 2 background: a change in the base sequence of a gene can produce a new allele. If it happens in a cell that gives rise to gametes, it can be inherited, and it enters the gene pool at a very low frequency (3.3.7.1). The Hardy-Weinberg principle assumes that there is no mutation (3.3.7.2).",
        stmts: ["3.2.11.1.s1", "3.3.7.1.s2", "3.3.7.2.s1"],
        question: { id: "q-map-u3-23", ref: "3.3.7.1", stmts: ["3.3.7.1.s2"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "A new allele arises by mutation. In which cell must the mutation happen for the new allele to become part of the gene pool?",
          options: ["A cell that gives rise to gametes, so it can be inherited", "A skin cell, because skin cells divide most often", "Any body cell, because all body cells pass on their DNA", "A muscle cell, because muscle cells respire the most"], answer: 0,
          explanation: "The gene pool is made of the alleles passed from generation to generation, so only a mutation in a cell that gives rise to gametes can add to it." } },

      { id: "meio-inh", from: "p-meio", to: "t6", label: "independent segregation of homologous chromosomes explains the ratios in",
        explanation: "Unit 1 principle: meiosis produces haploid gametes that are genetically different. Because homologous pairs segregate independently, an individual heterozygous for two genes on different chromosomes makes all four combinations of alleles in equal numbers, which gives the 9:3:3:1 ratio of a dihybrid cross between two such heterozygotes (3.3.6.2). Genes on the same chromosome (autosomal linkage) do not segregate independently, so the ratio differs.",
        stmts: ["3.1.9.1.s2", "3.1.9.1.s3", "3.3.6.2.s1"],
        question: { id: "q-map-u3-24", ref: "3.3.6.2", stmts: ["3.3.6.2.s1"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "An organism of genotype AaBb, with the two genes on different chromosomes, makes gametes. Which gametes does it make, and in which proportions?",
          options: ["AB, Ab, aB and ab in equal proportions", "AB and ab only, in equal proportions", "Aa and Bb in equal proportions", "AB, Ab, aB and ab in a 9:3:3:1 ratio"], answer: 0,
          explanation: "Each gamete gets one allele of each gene, and independent segregation makes all four combinations equally likely. 9:3:3:1 is the ratio of offspring phenotypes, not of gametes." } },

      { id: "meio-sel", from: "p-meio", to: "t8", label: "makes the genetic variation that selection acts on in",
        explanation: "Unit 1 principle: independent segregation, crossing over and random fertilisation give new combinations of alleles, so individuals within a population show a wide range of phenotypic variation (3.3.8.1). This matches a Unit 3 principle: genetic variation occurs within a species, and selection leads to the accumulation of genetic differences in populations.",
        stmts: ["3.1.9.1.s2", "3.1.9.1.s3", "3.1.9.1.s4", "3.3.8.1.s2"],
        question: { id: "q-map-u3-25", ref: "3.3.8.1", stmts: ["3.3.8.1.s2", "3.3.8.1.s4"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "Two populations of one plant species are the same size. One reproduces only asexually, by mitosis; the other reproduces sexually. When conditions change, which is more likely to adapt by natural selection?",
          options: ["The sexual one: meiosis and fertilisation give more genetic variation", "The asexual one: its offspring are copies of well-adapted parents", "Both equally, because natural selection does not depend on variation", "Neither, because plants cannot evolve by natural selection"], answer: 0,
          explanation: "Selection needs heritable variation. Sexual reproduction makes new combinations of alleles in every generation." } },

      { id: "sp-spec", from: "p-sp", to: "t8", label: "defines the new species formed in",
        explanation: "Unit 1 principle: a species may be defined in terms of the ability to interbreed and produce fertile offspring. A new species arises when genetic differences prevent members of separated populations from interbreeding to produce fertile offspring (3.3.8.2). The separation may be geographical (allopatric speciation) or happen within one area (sympatric speciation).",
        stmts: ["3.1.10.1.s2", "3.3.8.2.s3", "3.3.8.2.s4"],
        question: { id: "q-map-u3-26", ref: "3.3.8.2", stmts: ["3.3.8.2.s3", "3.3.8.2.s4"], ao: ["AO2"], type: "match", marks: 3,
          stem: "Hypothetical situations. Match each one to the best description.",
          pairs: [
            { left: "A mountain range separates two populations; many generations later, their hybrids are infertile", right: "Allopatric speciation" },
            { left: "In one lake, two forms breed at different times of year until their hybrids are infertile", right: "Sympatric speciation" },
            { left: "Two populations on separate islands still produce fertile hybrids when brought together", right: "Not yet separate species" } ],
          explanation: "Speciation is shown by the inability to produce fertile offspring. It is allopatric after geographical separation and sympatric within one area; separation alone, with fertile hybrids, is not speciation." } },

      { id: "inh-sel", from: "t6", to: "t8", label: "only the inherited part of phenotypic variation is acted on in",
        explanation: "Phenotype is the expression of the genotype and its interaction with the environment (3.3.6.1). Selection acts on phenotypes, but only alleles are passed on, so variation caused only by the environment cannot change allele frequencies (3.3.8.1).",
        stmts: ["3.3.6.1.s1", "3.3.8.1.s2", "3.3.8.1.s4"],
        question: { id: "q-map-u3-27", ref: "3.3.8.1", stmts: ["3.3.6.1.s1", "3.3.8.1.s4"], ao: ["AO2"], type: "mcq", marks: 1,
          stem: "Hypothetical. Some of the variation in body mass in a fish population is caused only by differences in food supply. Why can selection on this part of the variation not change allele frequencies?",
          options: ["Variation caused only by the environment is not inherited", "The environment never has any effect on an animal's phenotype", "Selection acts only on genotypes, never on phenotypes", "Variation in body mass is always too small to be selected"], answer: 0,
          explanation: "Well-fed fish may survive better, but their offspring inherit alleles, not their parents' food supply." } },
    ],
  };

  // Geometry check: returns a list of faults (empty when the layout is clean). Boxes 176 × 60 as drawn by
  // js/views/unit1-map.js; a line may not pass through any box it does not join or the key; every numbered circle
  // (radius 18) keeps at least 20 px from every box it does not join, 10 px from its own two boxes, and at least 42 px
  // between centres.
  M.checkGeometry = function () {
    const NW = 176, NH = 60, R = 18, out = [];
    const nodes = Object.fromEntries(this.nodes.map((n) => [n.id, n]));
    const box = (n, pad) => [n.x - NW / 2 - pad, n.y - NH / 2 - pad, n.x + NW / 2 + pad, n.y + NH / 2 + pad];
    const segHits = (p, q, r) => { let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
      for (const [pp, qq] of [[-dx, p[0] - r[0]], [dx, r[2] - p[0]], [-dy, p[1] - r[1]], [dy, r[3] - p[1]]]) { if (pp === 0) { if (qq < 0) return false; } else { const t = qq / pp; if (pp < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t); if (t0 > t1) return false; } } return true; };
    const ptBox = (c, r) => Math.hypot(Math.max(r[0] - c[0], 0, c[0] - r[2]), Math.max(r[1] - c[1], 0, c[1] - r[3]));
    const key = [930, 400, 1170, 660], mids = [];
    for (const n of this.nodes) { const b = box(n, 0); if (b[0] < 0 || b[1] < 0 || b[2] > 1170 || b[3] > 660) out.push("box outside viewBox " + n.id); if (ptBox([n.x, n.y], key) === 0) out.push("box in key " + n.id); }
    for (const l of this.links) { const a = nodes[l.from], b = nodes[l.to]; if (!a || !b) { out.push("missing node " + l.id); continue; }
      const p = [a.x, a.y], q = [b.x, b.y];
      for (const n of this.nodes) if (n !== a && n !== b && segHits(p, q, box(n, 4))) out.push(`line ${l.id} crosses ${n.id}`);
      if (segHits(p, q, key)) out.push(`line ${l.id} crosses the key`);
      const m = [(a.x + b.x) / 2, (a.y + b.y) / 2]; mids.push([m, l.id]);
      for (const n of this.nodes) { const d = ptBox(m, box(n, 0)) - R; if (n !== a && n !== b ? d < 20 : d < 10) out.push(`circle ${l.id} only ${d.toFixed(1)} px from ${n.id}`); } }
    for (let i = 0; i < mids.length; i++) for (let j = i + 1; j < mids.length; j++) if (Math.hypot(mids[i][0][0] - mids[j][0][0], mids[i][0][1] - mids[j][0][1]) < 2 * R + 6) out.push(`circles ${mids[i][1]} and ${mids[j][1]} too close`);
    return out;
  };
  window.BIO.unitMaps["3.3"] = M;
})();
