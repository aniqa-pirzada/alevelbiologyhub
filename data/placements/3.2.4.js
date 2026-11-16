// Placement of every 3.2.4 diagram and interactive in the integrated notes (Phase 4 Batch 2, 3.2.4 author).
// Format: { "<diagram id>" | "int:<index>": n | "n.k" | "n>phrase" } (see js/views/library.js integratedHTML).
// Diagrams that the notes already draw inline are swapped in place for the full figure; their entries name the same
// section and paragraph. Interactives sit straight after the paragraph that introduces them.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.2.4.1": {
    "d-3.2.4.1-1": "4>section through one particle",
    "d-3.2.4.1-2": "4>where does the envelope come from",
    "int:0": "6>test yourself with the challenge in the explorer",
  },
  "3.2.4.2": {
    "d-3.2.4.2-1": "3>reverse transcription and integration",
    "d-3.2.4.2-2": "5>the replication cycle of hiv",
    "d-3.2.4.2-3": "6>cd4 count and viral load",
    "d-3.2.4.2-4": "7>where drugs that inhibit viral enzymes act",
    "int:0": "5>follow the cycle one step at a time",
    "int:1": "6>use the model to compare",
    "int:2": "7>try predicting the effects",
  },
});
