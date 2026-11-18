// Placements for 3.3.5.1 and 3.3.5.2 (Phase 5 Batch 3, author B1). "n>phrase": straight after the first block in notes
// section n whose text contains the phrase (js/views/library.js). No static figures: each would repeat a model.
// 3.3.5.1: int:0 Decomposer Challenge, int:1 Nutrient Recycling Explorer.
// 3.3.5.2: int:0 Carbon Cycle Explorer, int:1 CO2 Data Explorer, int:2 checkpoint Woodland CO2 over 24 hours (data),
//          int:3 Greenhouse Gas Explorer, int:4 Climate, Crop and Pest Data Investigator.
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.3.5.1": {
    "int:0": "2>Use the challenge to find out",
    "int:1": "4>Follow one atom round the woodland",
  },
  "3.3.5.2": {
    "int:0": "1>Sort the stores and fluxes",
    "int:1": "2>Read the real Mauna Loa data",
    "int:2": "2>Check your understanding with the woodland data",
    "int:3": "4>Step through the explorer",
    "int:4": "5>Use the investigator",
  },
});
