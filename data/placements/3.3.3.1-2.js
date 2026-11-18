// Placement of every diagram and interactive model inside the 3.3.3.1 and 3.3.3.2 notes (Phase 5 Batch 2, author A1,
// 2026-11-17). "n>phrase": straight after the first block in notes section n whose text contains the phrase
// (js/views/library.js).
// 3.3.3.1: d-3.3.3.1-1 where glycolysis fits; int:0 Glycolysis Explorer; int:1 Check your understanding (fractionation).
// 3.3.3.2: d-3.3.3.2-1 the two pathways; int:0 NAD Regeneration Model; int:1 Check your understanding (extracts);
// int:2 Anaerobic Respiration Challenge.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.3.1": {
    "d-3.3.3.1-1": "1>The diagram shows where glycolysis fits",
    "int:0": "2>Use the explorer to step through glycolysis",
    "int:1": "4>Try the data questions below",
  },
  "3.3.3.2": {
    "d-3.3.3.2-1": "2>The figure compares the two pathways",
    "int:0": "3>Use the model to see what happens to the NAD",
    "int:1": "5>Try the data questions below",
    "int:2": "5>Then try the challenge",
  },
});
