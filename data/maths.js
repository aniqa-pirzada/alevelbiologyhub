// Maths and Data Skills Hub. "verified" means the skill is explicitly in the specification text we retrieved
// (section 7 items 1 to 19, or a [M] statement in section 3). Section 7 was fully transcribed on 2026-11-01;
// only item 13 (logarithms) is A2-only.
// Tools with built: true have working interactive calculators in js/views/maths.js.
window.BIO = window.BIO || {};
window.BIO.maths = [
  { id: "M-sf", title: "Significant figures, decimals and standard form", level: "AS", status: "verified", built: true, source: "Section 7 item 1", summary: "Carry out calculations in decimal and standard form with an appropriate number of significant figures." },
  { id: "M-units", title: "Units and unit conversion", level: "AS", status: "verified", built: true, source: "Section 7 item 2", summary: "Recognise and use appropriate units; convert between mm, µm and nm, and between cm³ and dm³." },
  { id: "M-ratio", title: "Fractions, ratios and percentages", level: "AS", status: "verified", built: true, source: "Section 7 item 3", summary: "Percentages, percentage change and ratios in biological contexts." },
  { id: "M-mean", title: "Mean, median and mode", level: "AS", status: "verified", built: true, source: "Section 7 items 4 and 5", summary: "Understand the three averages and calculate arithmetic means." },
  { id: "M-mag", title: "Magnification and actual size", level: "AS", status: "verified", built: true, source: "3.1.2.1", summary: "magnification = image size ÷ actual size; rearrange and handle unit conversions." },
  { id: "M-sav", title: "Surface area to volume ratio", level: "AS", status: "verified", built: true, source: "3.1.5.1", summary: "Calculate SA:V for cubes and simple shapes and relate to exchange." },
  { id: "M-div", title: "Index of diversity", level: "AS", status: "verified", built: true, source: "3.1.11.2", summary: "d = N(N−1) ÷ Σn(n−1); recall and apply." },
  { id: "M-co", title: "Cardiac output", level: "AS", status: "verified", built: true, source: "3.2.6.2", summary: "Cardiac output = heart rate × stroke volume." },
  { id: "M-mi", title: "Mitotic index", level: "AS", status: "verified", built: true, source: "Required practical 4", summary: "Mitotic index = cells in mitosis ÷ total cells observed." },
  { id: "M-rate", title: "Rates, gradients and tangents", level: "AS", status: "verified", built: false, source: "Section 7 items 17 and 18", summary: "Rate from a gradient; drawing a tangent to a curve." },
  { id: "M-sd", title: "Standard deviation and normal distribution (interpretation)", level: "AS", status: "verified", built: false, source: "Section 7 item 9; 3.1.6; practical handbook", summary: "Interpret SD as spread; calculation not required in written papers." },
  { id: "M-rq", title: "Respiratory quotient", level: "A2", status: "verified", built: true, source: "3.3.3.4", summary: "RQ = CO₂ produced ÷ O₂ consumed; interpret substrate." },
  { id: "M-npp", title: "Productivity: NPP = GPP − R and N = I − (F + U + R)", level: "A2", status: "verified", built: true, source: "3.3.4.2", summary: "Energy transfer and efficiency calculations." },
  { id: "M-chi", title: "Chi-squared test (select, justify, interpret)", level: "A2", status: "verified", built: false, source: "Section 7 item 8; 3.3.6.2; practical handbook", summary: "Compare observed and expected ratios; interpret against critical value at p = 0.05." },
  { id: "M-hw", title: "Hardy–Weinberg equation", level: "A2", status: "verified", built: true, source: "3.3.7.2", summary: "p + q = 1; p² + 2pq + q² = 1; calculate allele, genotype and phenotype frequencies." },
  { id: "M-se", title: "Standard error and 95% confidence limits (interpretation)", level: "A2", status: "verified", built: false, source: "Section 7 item 8; practical handbook", summary: "Use error bars / overlap of 95% CI to judge significance of differences between means." },
  { id: "M-spear", title: "Spearman rank correlation (select, justify, interpret)", level: "A2", status: "verified", built: false, source: "Section 7 items 8 and 15; practical handbook", summary: "Correlation between two ranked variables; interpret rs against critical values." },
  { id: "M-prob", title: "Chance, probability and sampling", level: "AS", status: "verified", built: false, source: "Section 7 items 6 and 7", summary: "Use the terms chance and probability correctly; explain why random sampling and adequate sample size make data representative." },
  { id: "M-symbols", title: "Symbols and algebra", level: "AS", status: "verified", built: false, source: "Section 7 items 10 to 12", summary: "Use =, <, >, ∝ and ~; translate between graphical, numerical and algebraic forms; rearrange and solve equations with correct units." },
  { id: "M-log", title: "Logarithms and orders of magnitude", level: "A2", status: "verified", built: false, source: "Section 7 item 13 (A2 only)", summary: "Read and use log scales for quantities spanning several orders of magnitude, e.g. bacterial growth, serial dilutions." },
  { id: "M-graphs", title: "Tables, charts and graphs", level: "AS", status: "verified", built: false, source: "Section 7 items 14 to 16", summary: "Construct and interpret frequency tables, pie charts, bar charts, histograms, scatter diagrams and line graphs." },
  { id: "M-geom", title: "Circumference, area and volume", level: "AS", status: "verified", built: false, source: "Section 7 item 19", summary: "Circumferences of circles, perimeters of rectangles, volumes of spheres, cylinders and cuboids, as used in SA:V and cell size questions." },
];
