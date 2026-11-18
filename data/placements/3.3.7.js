// Placement of every diagram and interactive model inside the 3.3.7.1 and 3.3.7.2 notes (Phase 5 Batch 4, author C1).
// "n>phrase": straight after the first block in notes section n whose text contains the phrase (js/views/library.js).
// 3.3.7.1: int:0 Gene Pool Explorer, int:1 Selective Breeding Explorer, int:2 oil-content checkpoint,
//          int:3 Genetic Drift Simulator, int:4 Bottleneck Challenge.
// 3.3.7.2: d-3.3.7.2-1 gamete-pool square; int:0 Hardy-Weinberg Calculator, int:1 Problem Generator,
//          int:2 Conditions Explorer, int:3 cystic fibrosis checkpoint.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.7.1": {
    "int:0": "2>Practise with the herds in the explorer",
    "int:1": "4>Try the explorer: breed from the top 10",
    "int:2": "4>Check your understanding with the oil-content data",
    "int:3": "5>Run the simulator with 10 individuals",
    "int:4": "6>Take the bottleneck challenge",
  },
  "3.3.7.2": {
    "d-3.3.7.2-1": "2>The square shows this for p = 0.7",
    "int:0": "3>Use the calculator to check your own working",
    "int:1": "4>Each problem is different",
    "int:2": "5>Use the explorer to break one condition",
    "int:3": "6>Check your understanding with real figures",
  },
});
