// Placements for 3.3.4.1 and 3.3.4.2 (Phase 5 Batch 2, author A3). "n>phrase": straight after the first block in notes
// section n whose text contains the phrase (js/views/library.js). No static figures: each would repeat a model.
// 3.3.4.1: int:0 Food Web Explorer, int:1 Pyramid Builder, int:2 Transfer Efficiency Calculator.
// 3.3.4.2: int:0 Production Calculator, int:1 Farming Practices Evaluator, int:2 checkpoint A pest-control trial (data).
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.4.1": {
    "int:0": "1>Use the explorer to find what each organism eats",
    "int:1": "4>Predict the shape of each pyramid",
    "int:2": "3>Use the calculator to check your own answers",
  },
  "3.3.4.2": {
    "int:0": "3>Try both hypothetical bullocks in the calculator",
    "int:1": "4>Use the evaluator to match each practice",
    "int:2": "5>Check your understanding with the pest-control trial",
  },
});
