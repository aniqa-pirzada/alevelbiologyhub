// Placement of every diagram and interactive model inside the 3.3.8.1 and 3.3.8.2 notes (Phase 5 Batch 4, author C2).
// "n>phrase": straight after the first block in notes section n whose text contains the phrase (js/views/library.js).
// 3.3.8.1 interactives: int:0 Natural Selection Simulator, int:1 checkpoint "Peppered moths", int:2 checkpoint "Mice on
// lava rock". 3.3.8.2 interactives: int:0 Selection Curve Explorer, int:1 Speciation Explorer, int:2 checkpoint "Testing
// for new species", int:3 Speciation Sequence Challenge.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.8.1": {
    "d-3.3.8.1-1": "4>The flow chart shows the steps",
    "int:0": "4>Try the simulator",
    "int:1": "5>Use the table below to explain his results",
    "int:2": "5>A second example",
  },
  "3.3.8.2": {
    "int:0": "1>Use the explorer to see each type",
    "int:2": "3>Use the box below to apply the test",
    "int:1": "4>Step through one example of each",
    "int:3": "4>Then test yourself with two new examples",
  },
});
