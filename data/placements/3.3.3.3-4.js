// Placements for 3.3.3.3 and 3.3.3.4 (Phase 5 Batch 2, author A2). "n>phrase": straight after the first block in notes
// section n whose text contains the phrase (js/views/library.js).
// 3.3.3.3: int:0 Mitochondrion Explorer, int:1 Link Reaction and Krebs Cycle Stepper, int:2 Oxidative Phosphorylation
//          Model, int:3 checkpoint Cristae and energy demand, int:4 Disruption Challenge, int:5 checkpoint Sequencing
//          challenge. d-3.3.3.3-p1: a real electron micrograph (complements the drawn explorer), straight
//          before the explorer. No drawn static figures (each would repeat a model).
// 3.3.3.4: d-3.3.3.4-1 Where respiratory substrates enter (static flow chart; no interactive shows it), int:0 RQ Calculator,
//          int:1 checkpoint Respirometer data, int:2 checkpoint A germinating seed.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.3.3": {
    "d-3.3.3.3-p1": "1>A mitochondrion has two membranes",
    "int:0": "1>Use the explorer to find where each stage happens",
    "int:1": "5>Step through the stepper",
    "int:2": "7>Watch the model before you read on",
    "int:3": "7>so cells that use a lot of ATP",
    "int:4": "8>Try each change in the challenge",
    "int:5": "10>Put the steps in order",
  },
  "3.3.3.4": {
    "d-3.3.3.4-1": "1>The flow chart shows where each breakdown product enters",
    "int:0": "5>Work out the RQ for each data set",
    "int:1": "8>Use the readings in the box",
    "int:2": "9>Use the data in the box",
  },
});
