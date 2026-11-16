// Placement of every diagram and interactive model inside the 3.2.10.1 and 3.2.10.2 notes (Phase 4 Batch 4, owned by the
// 3.2.10.1–3.2.10.2 author). "n>phrase": straight after the first block in notes section n whose text contains the
// phrase (js/views/library.js).
// 3.2.10.1 interactives: int:0 Cell-Cycle Explorer.
// 3.2.10.2 interactives: int:0 Interactive Mitosis Animation, int:1 Virtual Root-Tip Microscope (RP4 author's
// js/views/bench-roottip.js).
window.BIO = window.BIO || {};
window.BIO.placements = Object.assign(window.BIO.placements || {}, {
  "3.2.10.1": {
    "d-3.2.10.1-1": "1>The ring diagram shows the phases",
    "d-3.2.10.1-2": "2>The drawings show a model cell growing",
    "int:0": "2>Use the explorer to move round the cycle",
    "d-3.2.10.1-3": "3>Follow one chromosome round the cycle",
    "d-3.2.10.1-4": "3>The graph shows the DNA content of one cell",
  },
  "3.2.10.2": {
    "d-3.2.10.2-1": "2>The drawing shows the model cell in G2",
    "d-3.2.10.2-2": "3>Early prophase: the chromosomes are visible as threads",
    "d-3.2.10.2-3": "3>Late prophase: the envelope is breaking down",
    "d-3.2.10.2-4": "4>Metaphase is the best stage for counting",
    "d-3.2.10.2-5": "4>The close-up shows how the fibres are attached",
    "d-3.2.10.2-6": "5>Early anaphase: the chromatids have just been pulled apart",
    "d-3.2.10.2-7": "6>The cell now contains two genetically identical nuclei",
    "d-3.2.10.2-8": "6>Each daughter cell then enters G1",
    "int:0": "7>Use it to check your understanding",
    "d-3.2.10.2-9": "7>Summary of the counts, frame by frame",
    "d-3.2.10.2-10": "8>These drawings show the same model in a plant cell",
    "int:1": "9>Try the virtual microscope",
    "d-3.2.10.2-11": "10>this comparison only helps you tell the two apart",
  },
});
