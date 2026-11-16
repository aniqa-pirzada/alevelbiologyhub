// Placement of every diagram and interactive model inside the 3.2.6 notes (Phase 4 Batch 2, owned by the 3.2.6 author).
// "n>phrase": straight after the first block in notes section n whose text contains the phrase (js/views/library.js).
// 3.2.6.1 interactives: int:0 Blood Vessel Comparison, int:1 Tissue Fluid Formation Simulator.
// 3.2.6.2 interactives: int:0 Interactive Mammalian Heart, int:1 Animated Cardiac Cycle, int:2 Cardiac Pressure and Volume
// Explorer, int:3 Cardiac Output Calculator.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.2.6.1": {
    "d-3.2.6.1-2": "3>Pocket-shaped flaps",
    "int:0": "4>Check your understanding with the comparison model",
    "d-3.2.6.1-3": "5>very numerous and highly branched",
    "int:1": "6>The simulator lets you change the pressures",
    "d-3.2.6.1-5": "7>lymph vessels empty into",
  },
  "3.2.6.2": {
    "int:0": "3>Use the interactive heart to trace the blood",
    "int:1": "5>The cycle then repeats",
    "int:2": "6>Use the explorer to move through the cycle",
    "int:3": "7>Practise with the calculator",
  },
});
