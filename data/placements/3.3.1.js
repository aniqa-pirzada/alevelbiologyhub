// Placement of every diagram and interactive model inside the 3.3.1 notes (Phase 5 Batch 1, author U1).
// "n>phrase": straight after the first block in notes section n whose text contains the phrase (js/views/library.js).
// 3.3.1.1: int:0 Ecosystem Explorer, int:1 checkpoint "Barnacles on a rocky shore", int:2 checkpoint "Habitat or niche?".
// 3.3.1.2: int:0 Population Dynamics Simulator, int:1 Population Data Challenge, int:2 checkpoint "Abiotic factors",
//          int:3 checkpoint "Several factors at once".
// 3.3.1.3: int:0 Succession Timeline, int:1 Conservation Decision Challenge, int:2 checkpoint "Pioneer species";
//          photographs d-3.3.1.3-p1 (lichens on lava, after the examples of pioneers) and d-3.3.1.3-p2 (dune zones, after the
//          examples of species making conditions less suitable for themselves, just before the timeline).
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.1.1": {
    "int:0": "1>Use the explorer to see the three levels",
    "d-3.3.1.1-1": "3>The drawing shows the two zones",
    "int:1": "3>Use the drawing and the removal experiment",
    "int:2": "5>Test yourself on these differences",
  },
  "3.3.1.2": {
    "d-3.3.1.2-1": "1>The diagram summarises this",
    "int:2": "2>Check that you can apply this",
    "int:0": "3>Explore this in the simulator",
    "int:3": "6>So a change in population size rarely has a single cause",
    "int:1": "7>Work through the four data sets",
  },
  "3.3.1.3": {
    "d-3.3.1.3-p1": "2>On bare rock the pioneers are often",
    "int:2": "2>Check that you can explain what makes a pioneer",
    "d-3.3.1.3-p2": "3>marram grass stabilises the sand that it needs",
    "int:0": "3>Use the timeline to follow these changes",
    "int:1": "6>Try the decisions for four real kinds of habitat",
  },
});
