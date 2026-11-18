// Placements for 3.3.6.1 and 3.3.6.2 (Phase 5 Batch 3, author B3). "n>phrase": straight after the first block in notes
// section n whose text contains the phrase (js/views/library.js).
// 3.3.6.1: int:0 Vocabulary Explorer, int:1 Genotype to Phenotype Explorer. No static figures (each would repeat a model).
// 3.3.6.2: int:0 Genetic Cross Builder, int:1 Probability Challenge, int:2 Genetics Challenge Centre, int:3 Chi-squared
// Calculator and int:4 Genetic Data Challenge (author B4, js/views/interactives-chi.js), int:5 checkpoint "A tomato test
// cross"; d-3.3.6.2-1 linked genes and crossing over, d-3.3.6.2-2 epistasis pathways. The worked genetic diagrams are part
// of the notes text (computed by B.geneticsModel), not separate figures.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.6.1": {
    "int:0": "1>Use the explorer to see where each term applies",
    "int:1": "5>Try the cold patch in the explorer",
  },
  "3.3.6.2": {
    "d-3.3.6.2-1": "6>The drawing shows crossing over between two linked loci",
    "d-3.3.6.2-2": "7>The pathways explain where each ratio comes from",
    "int:0": "8>Use the Cross Builder for every type of cross",
    "int:1": "9>Try the Probability Challenge",
    "int:3": "10>Use the calculator and the data challenge",
    "int:4": "10>Use the calculator and the data challenge",
    "int:5": "10>Check your understanding with the tomato test cross",
    "int:2": "11>The Challenge Centre has foundation",
  },
});
