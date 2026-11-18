// Placements for 3.3.2.3 (Phase 5 Batch 1, author U3). "n>phrase": straight after the first block in notes section n
// whose text contains the phrase (js/views/library.js). The page has no static diagrams: the Photosynthesis Rate
// Simulator draws the light, carbon dioxide and temperature curves, so a static figure of them would duplicate it.
// int:0 Photosynthesis Rate Simulator; int:1 to int:2 and int:4 "Check your understanding" boxes; int:3 Experimental
// Data Challenge (both interactive kinds are registered in js/views/bench-photo.js).
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.2.3": {
    "int:1": "1>Reading a graph.",
    "int:0": "5>Simplified model: the simulator follows",
    "int:2": "5>Use the table below to check your understanding",
    "int:3": "6>Try the six challenges below",
    "int:4": "7>Check your understanding with the grower",
  },
});
