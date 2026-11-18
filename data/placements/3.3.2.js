// Placements for 3.3.2.1 and 3.3.2.2 (Phase 5 Batch 1, author U2). "n>phrase": straight after the first block in notes
// section n whose text contains the phrase (js/views/library.js). 3.3.2.3 has its own file (data/placements/3.3.2.3.js).
// 3.3.2.1: int:0 Chloroplast Explorer, int:1 Light-Dependent Reaction model, int:2 checkpoint Photolysis,
//          int:3 checkpoint Making ATP, int:4 Electron Transfer Challenge. No drawn static figures (each would repeat a model); one
//          photograph, d-3.3.2.1-p1 (a real electron micrograph that complements the drawn Chloroplast Explorer), straight
//          after the list of chloroplast parts.
// 3.3.2.2: int:0 Calvin Cycle Explorer, int:1 Photosynthesis Integration Explorer, int:2 checkpoint Switching the light off (data),
//          int:3 checkpoint Sequencing challenge.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.2.1": {
    "d-3.3.2.1-p1": "2>a double membrane (outer and inner membranes)",
    "int:0": "2>Use the explorer to find each structure",
    "int:1": "3>Step through the model before you read on",
    "int:2": "5>So the oxygen given out in photosynthesis comes from",
    "int:3": "7>ATP is not made directly by light",
    "int:4": "9>Try each change in the challenge",
  },
  "3.3.2.2": {
    "int:0": "5>Use the explorer to count the carbon atoms",
    "int:1": "7>Use the explorer to follow energy, carbon",
    "int:2": "7>Use the explorer to follow energy, carbon",
    "int:3": "8>Put the steps in order",
  },
});
