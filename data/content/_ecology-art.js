// Shared models, data and artwork for 3.3.1 The effect of biotic and abiotic factors on populations (Phase 5 Batch 1,
// author U1). Loaded before data/content/3.3.1.1.js, 3.3.1.2.js, 3.3.1.3.js and js/views/interactives-ecology.js.
//
// Specification (OxfordAQA 9610 v5.1, printed p.28): 3.3.1.1 population, community, ecosystem; niche governed by adaptation
// to biotic and abiotic conditions. 3.3.1.2 population size varies with abiotic factors and with interspecific and
// intraspecific competition and predation; analyse and interpret data on the numbers and distribution of organisms,
// recognising correlations and causal relationships. 3.3.1.3 primary succession from pioneer species to climax community;
// each stage changes the environment; less hostile environment and changing biodiversity; conservation of habitats
// frequently involves management of succession. Sampling methods and mark-release-recapture are NOT in 9610 3.3.1 and are
// not taught here.
//
// Contents
//   B.ecologyModel  population model for the Population Dynamics Simulator (documented below; unit tested)
//   B.ecologyData   ecosystems for the Ecosystem Explorer, succession pathways, conservation scenarios, practice datasets
//   B.ecologyArt    SVG drawings: line chart, scatter chart, ecosystem diagram, barnacle zones, population-change
//                   diagram, succession and habitat scenes
// Every drawing is schematic SVG drawn in code; labels are our own text, at least 13 units, inside the drawing.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#5f6f7f", LINE = "#c9d4d8";
  const FONT = 'font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"';
  const r1 = (x) => Math.round(x * 10) / 10;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const T = (x, y, s, o = {}) => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.i ? ' font-style="italic"' : ""}${o.extra || ""}>${s}</text>`;
  // approximate width of a label in system-ui (used to size chips and boxes so text never spills out)
  const tw = (s, fs) => String(s).replace(/<[^>]+>/g, "").length * fs * 0.56;

  // =============================================== MODEL ===============================================
  // Population Dynamics Simulator. A SIMPLIFIED, deterministic model, integrated with 4th-order Runge-Kutta (step 0.02
  // time units) and recorded once per time unit. Students see only "Simplified model: model output, not real data".
  // The mathematics below is supporting background for teachers and is NOT examinable in 9610.
  //
  // (1) single: one species. Logistic growth dN/dt = r N (1 - N/K).
  //       r = 0.3 per week x a temperature factor (low 0.35, near the optimum 1, high 0.5): an abiotic factor that
  //       changes how fast the population grows (for example through enzyme-controlled reactions in an ectotherm).
  //       K (the carrying capacity set by the food supply) = 250 (low), 500 (medium), 1000 (high): intraspecific
  //       competition for food slows growth as N approaches K. N0 = 10. 100 weeks.
  // (2) compete: two species A and B that use some of the same resources (Lotka-Volterra competition).
  //       dA/dt = rA A (1 - (A + aAB B)/K), dB/dt = rB B (1 - (B + aBA A)/K), K = 500 for both,
  //       rA = 0.3, rB = 0.4 per week (B grows faster when alone), aAB = 0.7 x overlap, aBA = 1.3 x overlap, with
  //       overlap = 1 (same food), 0.6 (partly different food) or 0.2 (mostly different food). With overlap 1, A excludes
  //       B (aBA > 1 > aAB); with 0.6 or 0.2 both persist at lower numbers than alone. A0 = B0 = 10. 100 weeks.
  // (3) predprey: prey H and predator P (Rosenzweig-MacArthur), with the predator counted in units one tenth of the
  //       original so that predators are fewer than their prey (correction pass, RA-03; the dynamics are unchanged).
  //       With g = a H / (1 + a h H): dH/dt = r H (1 - H/K) - 10 g P, dP/dt = e g P - m P,
  //       r = 2 per year, a = 0.02, h = 0.25, e = 0.5, m = 1, K = 400 (prey food lower) or 800 (higher). The prey
  //       equilibrium H* = m / (a (e - m h)) = 200 and the cycles start where K > 2H* + 1/(a h) = 600, so K = 400 gives
  //       oscillations that die away and K = 800 gives repeated cycles (period about 9 years) in which each predator
  //       peak comes about 3 years after a prey peak. Predators peak at about 27 and stay well below the prey (K = 400 settles
  //       at 200 prey and 10 predators). Without predators the prey rise to K. H0 = 100, P0 = 0.5. 60 years.
  // Severe frost (all scenarios, optional): at week 40 (year 30 for predprey) 70 % of every population dies whatever its
  // density: an abiotic factor acting at the same time as the biotic ones.
  // Values are model output in arbitrary numbers of individuals; they are not measurements of any real population.
  const M = {};
  M.SCEN = {
    single: { unit: "weeks", T: 100, frostAt: 40 },
    compete: { unit: "weeks", T: 100, frostAt: 40 },
    predprey: { unit: "years", T: 60, frostAt: 30 },
  };
  M.TEMP = { low: 0.35, optimum: 1, high: 0.5 };
  M.FOOD = { low: 250, medium: 500, high: 1000 };
  M.OVERLAP = { high: 1, medium: 0.6, low: 0.2 };
  M.PREYK = { lower: 400, higher: 800 };
  const rk4 = (f, y, dt) => { const add = (a, b, k) => a.map((v, i) => v + k * b[i]); const k1 = f(y), k2 = f(add(y, k1, dt / 2)), k3 = f(add(y, k2, dt / 2)), k4 = f(add(y, k3, dt)); return y.map((v, i) => Math.max(0, v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))); };
  function integrate(f, y0, T, frostAt) {
    const dt = 0.02, steps = Math.round(1 / dt); let y = y0.slice(); const out = [y.slice()];
    for (let t = 0; t < T; t++) { for (let s = 0; s < steps; s++) y = rk4(f, y, dt); if (frostAt != null && t + 1 === frostAt) y = y.map((v) => v * 0.3); out.push(y.slice()); }
    return out;
  }
  M.run = function (scen, o = {}) {
    const S = M.SCEN[scen]; if (!S) throw new Error("unknown scenario " + scen); const frost = o.frost ? S.frostAt : null; let rows, series;
    if (scen === "single") {
      const r = 0.3 * M.TEMP[o.temp || "optimum"], K = M.FOOD[o.food || "medium"];
      rows = integrate(([N]) => [r * N * (1 - N / K)], [10], S.T, frost);
      series = [{ key: "N", name: "Population", values: rows.map((y) => y[0]) }];
      return { scen, unit: S.unit, T: S.T, K, r, frostAt: frost, t: rows.map((_, i) => i), series };
    }
    if (scen === "compete") {
      const ov = M.OVERLAP[o.overlap || "high"], K = 500, rA = 0.3, rB = 0.4, aAB = 0.7 * ov, aBA = 1.3 * ov;
      const grow = o.grow || "both"; const A0 = grow === "B" ? 0 : 10, B0 = grow === "A" ? 0 : 10;
      rows = integrate(([a, b]) => [rA * a * (1 - (a + aAB * b) / K), rB * b * (1 - (b + aBA * a) / K)], [A0, B0], S.T, frost);
      series = []; if (A0) series.push({ key: "A", name: "Species A", values: rows.map((y) => y[0]) }); if (B0) series.push({ key: "B", name: "Species B", values: rows.map((y) => y[1]) });
      return { scen, unit: S.unit, T: S.T, K, overlap: ov, aAB, aBA, frostAt: frost, t: rows.map((_, i) => i), series };
    }
    const K = M.PREYK[o.preyFood || "higher"], r = 2, a = 0.02, h = 0.25, e = 0.5, m = 1; const pred = o.predators !== false;
    rows = integrate(([H, P]) => { const g = (a * H) / (1 + a * h * H); return [r * H * (1 - H / K) - 10 * g * P, e * g * P - m * P]; }, [100, pred ? 0.5 : 0], S.T, frost);
    series = [{ key: "H", name: "Prey", values: rows.map((y) => y[0]) }]; if (pred) series.push({ key: "P", name: "Predators", values: rows.map((y) => y[1]) });
    return { scen, unit: S.unit, T: S.T, K, Hstar: m / (a * (e - m * h)), frostAt: frost, t: rows.map((_, i) => i), series };
  };
  // local maxima (peaks) of a series after time `from`, ignoring tiny wiggles
  M.peaks = (v, from = 5) => { const out = []; for (let i = Math.max(1, from); i < v.length - 1; i++) if (v[i] > v[i - 1] && v[i] >= v[i + 1] && v[i] > 1.05 * Math.min(...v.slice(Math.max(0, i - 6), i + 7))) out.push(i); return out; };
  // mean delay from each prey peak to the next predator peak
  M.lag = (prey, pred) => { const hp = M.peaks(prey), pp = M.peaks(pred); const d = []; hp.forEach((t) => { const n = pp.find((x) => x >= t); if (n !== undefined && n - t < 8) d.push(n - t); }); return d.length ? d.reduce((s, x) => s + x, 0) / d.length : null; };
  B.ecologyModel = M;

  // =============================================== DATA ===============================================
  // ---- Ecosystem Explorer: five real ecosystems from different regions (qualitative facts only, no regional numbers).
  // Sources (checked 16 November 2026) are listed in the notes of 3.3.1.1. Each population is one species.
  const D = {};
  D.ECOSYSTEMS = [
    { id: "shore", name: "Rocky shore", region: "North-east Atlantic coasts (for example western Scotland, Ireland and Norway)", tint: "#e6f1f6", edge: "#2f6f8f",
      abiotic: ["tides: exposure to air twice a day", "drying out at low tide", "wave action", "temperature changes", "salinity falls in heavy rain", "light"],
      biotic: ["grazing on seaweeds and algae", "predation by dog whelks, crabs and birds", "competition for space on the rock", "competition for food"],
      pops: [
        { id: "wrack", pl: "bladder wrack plants", name: "Bladder wrack", latin: "Fucus vesiculosus", col: "#7a8a2a", habitat: "Rocks on the middle shore.", role: "Producer: a seaweed (alga) that photosynthesises when the tide covers it. It is food for grazing snails and shelter for small animals.", abiotic: ["Air bladders hold the fronds up towards the light when the tide is in.", "A tough, flexible body and a strong holdfast resist waves.", "A slimy surface slows drying out at low tide."], biotic: ["Contains bitter chemicals (phlorotannins) that put off some grazers."] },
        { id: "limpet", pl: "common limpets", name: "Common limpet", latin: "Patella vulgata", col: "#9a7b4f", habitat: "Bare rock across most of the shore.", role: "Primary consumer: scrapes a film of tiny algae off the rock with a rasping tongue (radula), which keeps rock bare.", abiotic: ["A low, cone-shaped shell is hard for waves to dislodge.", "At low tide it clamps down on a 'home scar' that fits its shell, trapping water so it does not dry out."], biotic: ["Clamping tight to the rock makes it hard for birds and crabs to prise off."] },
        { id: "barnacle", pl: "acorn barnacles", name: "Acorn barnacle", latin: "Semibalanus balanoides", col: "#8a8f99", habitat: "Rock on the middle and lower shore.", role: "Primary consumer (filter feeder): sweeps plankton from the water with feathery legs when the tide is in.", abiotic: ["Cemented to the rock, so waves cannot move it.", "Closes the plates of its shell at low tide, keeping water inside."], biotic: ["Its larvae settle where adults of their own species already live, a sign that the place suits them."] },
        { id: "whelk", pl: "dog whelks", name: "Dog whelk", latin: "Nucella lapillus", col: "#b4504f", habitat: "Rocks and crevices among barnacles and mussels.", role: "Secondary consumer (predator): bores a hole through the shell of a barnacle or mussel and eats the soft body.", abiotic: ["Shelters in damp crevices at low tide.", "On wave-beaten shores it has a shorter shell with a wider opening, for a larger, better-gripping foot."], biotic: ["Grows a thicker shell where crabs, which crush whelks, are common."] },
        { id: "crab", pl: "shore crabs", name: "Shore crab", latin: "Carcinus maenas", col: "#2f7f5f", habitat: "Under rocks and seaweed, and in rock pools.", role: "Consumer: a predator and scavenger that eats small molluscs, worms and dead animals.", abiotic: ["Hides under damp seaweed and rocks at low tide, where it stays cool and moist.", "Survives a wide range of salinity."], biotic: ["Strong claws crack the shells of its prey.", "Hides from gulls at low tide."] },
      ] },
    { id: "desert", name: "Hot desert", region: "Sonoran Desert (south-western USA and north-western Mexico)", tint: "#f8efdc", edge: "#a0662a",
      abiotic: ["little, unpredictable rain", "very hot days in summer", "large fall in temperature at night", "intense sunlight", "soils with few nutrients"],
      biotic: ["pollination of cactus flowers", "predation by snakes and owls", "competition for seeds and water", "nesting in cacti"],
      pops: [
        { id: "saguaro", pl: "saguaro cacti", name: "Saguaro cactus", latin: "Carnegiea gigantea", col: "#3f7f3a", habitat: "Rocky slopes and plains of the desert.", role: "Producer: photosynthesises; its flowers give nectar to bats, birds and insects, and its fruit feeds many animals.", abiotic: ["A pleated stem swells to store water after rain.", "Leaves reduced to spines, and a thick waxy cuticle, cut water loss.", "Shallow, widespread roots absorb rain quickly."], biotic: ["Spines deter animals that would eat the stem.", "Seedlings survive best in the shade of a 'nurse' tree such as a palo verde."] },
        { id: "krat", pl: "Merriam's kangaroo rats", name: "Merriam's kangaroo rat", latin: "Dipodomys merriami", col: "#b07a3a", habitat: "Burrows in sandy soil.", role: "Primary consumer: eats seeds, and is prey for snakes, owls and foxes.", abiotic: ["Can live without drinking: gets water from its own respiration of the food in the seeds it eats.", "Its kidneys make very concentrated urine.", "Stays in its cool, humid burrow by day and comes out at night."], biotic: ["Leaps away on long back legs when attacked.", "Very sensitive hearing detects owls and snakes."] },
        { id: "bat", pl: "lesser long-nosed bats", name: "Lesser long-nosed bat", latin: "Leptonycteris yerbabuenae", col: "#6a5a8a", habitat: "Roosts in caves; feeds among cacti.", role: "Consumer and pollinator: feeds on nectar and pollen of saguaro flowers at night and carries pollen between them.", abiotic: ["Feeds at night, when it is cooler."], biotic: ["Migrates, arriving when the cacti flower and food is plentiful.", "A long snout and long tongue reach nectar deep in the flower."] },
        { id: "woodpecker", pl: "Gila woodpeckers", name: "Gila woodpecker", latin: "Melanerpes uropygialis", col: "#c0392b", habitat: "Nest holes it digs in saguaro stems.", role: "Consumer: eats insects, cactus fruit and seeds. Its old holes are used by other birds.", abiotic: ["Its nest inside the thick cactus stem is shaded from the hot sun."], biotic: ["A strong chisel-like bill digs nest holes and finds insects."] },
        { id: "snake", pl: "western diamondback rattlesnakes", name: "Diamondback rattlesnake", latin: "Crotalus atrox", col: "#7d6a4a", habitat: "Among rocks and in burrows.", role: "Secondary consumer (predator): eats rodents such as kangaroo rats.", abiotic: ["Hunts at night in the hottest months and shelters in burrows by day."], biotic: ["Heat-sensing pits on its head detect warm prey in the dark.", "Venom kills prey quickly; the rattle warns off larger animals."] },
      ] },
    { id: "reef", name: "Coral reef", region: "Great Barrier Reef (off north-eastern Australia)", tint: "#e3f3f4", edge: "#1f8a8a",
      abiotic: ["warm water", "clear, shallow water lets light reach the corals", "salinity", "wave action", "very high sea temperatures cause bleaching"],
      biotic: ["algae living inside coral tissue", "grazing on algae", "predation on coral polyps", "competition for space and light"],
      pops: [
        { id: "coral", pl: "staghorn corals", name: "Staghorn coral", latin: "Acropora muricata", col: "#d07a5a", habitat: "Shallow parts of the reef.", role: "Each colony is made of many small animals (polyps). Algae in their tissues photosynthesise and give the polyps much of their food; the polyps also catch plankton.", abiotic: ["Lives in shallow, clear water where enough light reaches its algae.", "Builds a hard skeleton of calcium carbonate that resists waves."], biotic: ["Stinging tentacles catch plankton.", "Its partnership with algae supplies sugars from photosynthesis."] },
        { id: "parrot", pl: "bullethead parrotfish", name: "Bullethead parrotfish", latin: "Chlorurus spilurus", col: "#2f6db5", habitat: "Reef slopes and lagoons.", role: "Primary consumer: bites and scrapes algae from dead coral and rock, stopping algae from smothering live coral.", abiotic: [], biotic: ["Strong teeth, fused into a beak, scrape algae from hard coral rock.", "At night it wraps itself in a cocoon of mucus that protects it from small blood-feeding parasites."] },
        { id: "cots", pl: "crown-of-thorns starfish", name: "Crown-of-thorns starfish", latin: "Acanthaster sp.", col: "#7b3f98", habitat: "Live coral.", role: "Predator of coral: pushes its stomach out over the coral and digests the living polyps. Outbreaks are thought to be linked to extra nutrients washing off the land, which increase the plankton its larvae eat.", abiotic: [], biotic: ["Sharp, venomous spines deter most predators."] },
        { id: "anemone", pl: "magnificent sea anemones", name: "Magnificent sea anemone", latin: "Heteractis magnifica", col: "#c97a9a", habitat: "Exposed parts of the reef.", role: "Predator: catches small animals with stinging tentacles; shelters clownfish.", abiotic: ["Like corals, it has algae in its tissues, so it lives where there is plenty of light."], biotic: ["Stinging cells (nematocysts) catch prey and deter predators."] },
        { id: "clown", pl: "orange clownfish", name: "Orange clownfish", latin: "Amphiprion percula", col: "#e07b1a", habitat: "Among the tentacles of one anemone.", role: "Consumer: eats plankton and algae; chases off fish that eat anemones.", abiotic: [], biotic: ["A mucus coat protects it from the anemone's stings, so it can shelter among them, safe from predators."] },
      ] },
    { id: "mangrove", name: "Mangrove forest", region: "Sundarbans (Ganges–Brahmaputra delta, Bangladesh and India)", tint: "#e8f0e2", edge: "#4f7a3a",
      abiotic: ["tides flood the forest twice a day", "salty water, varying with place and season", "waterlogged mud with little oxygen", "high temperatures", "cyclones"],
      biotic: ["predation by tigers", "grazing by deer", "competition for space on the mud", "pollination by insects"],
      pops: [
        { id: "avicennia", pl: "grey mangrove trees", name: "Grey mangrove", latin: "Avicennia marina", col: "#5f7f3a", habitat: "Mud flats along tidal creeks.", role: "Producer: a tree whose roots and fallen leaves give food and shelter to crabs, fish and snails.", abiotic: ["Pencil-like roots (pneumatophores) grow up out of the mud and take in oxygen for the roots below.", "Salt glands on its leaves get rid of excess salt."], biotic: ["Its flowers are pollinated by insects such as bees."] },
        { id: "tiger", pl: "Bengal tigers", name: "Bengal tiger", latin: "Panthera tigris tigris", col: "#e0862a", habitat: "Forest islands between tidal channels.", role: "Top predator: hunts deer, wild boar and fish.", abiotic: ["A strong swimmer that crosses tidal channels between islands."], biotic: ["Stripes break up its outline in the vegetation, so it can stalk prey."] },
        { id: "chital", pl: "chital", name: "Chital (spotted deer)", latin: "Axis axis", col: "#a0704a", habitat: "Open forest and the forest edge.", role: "Primary consumer: eats leaves, fruit and shoots; prey for tigers.", abiotic: [], biotic: ["Lives in herds and gives alarm calls when it detects a predator."] },
        { id: "mudskipper", pl: "mudskippers of one species", name: "Mudskipper", latin: "Periophthalmus sp.", col: "#6f7f8a", habitat: "Mud between the mangrove roots.", role: "Consumer: a fish that feeds on small animals on the mud at low tide.", abiotic: ["Breathes air through its skin and the lining of its mouth when out of water, and keeps water in its gill chambers.", "Digs a burrow to shelter when the tide is in."], biotic: ["Eyes on top of its head watch for wading birds."] },
        { id: "fiddler", pl: "fiddler crabs of one species", name: "Fiddler crab", latin: "Austruca sp.", col: "#b8452f", habitat: "Burrows in the mud.", role: "Detritivore: eats dead organic material from the mud, recycling nutrients.", abiotic: ["Retreats into its burrow when the tide comes in."], biotic: ["Males wave one very large claw to attract females and in fights with other males."] },
      ] },
    { id: "tundra", name: "Arctic tundra", region: "High Arctic (for example north-east Greenland and northern Canada)", tint: "#eef2f7", edge: "#4a6a8a",
      abiotic: ["very low temperatures most of the year", "permafrost (frozen ground)", "short summer growing season with long days", "little rain or snow", "strong, drying winds"],
      biotic: ["grazing by lemmings and musk oxen", "predation by stoats, foxes and owls", "competition for food in winter", "pollination by insects"],
      pops: [
        { id: "willow", pl: "Arctic willow plants", name: "Arctic willow", latin: "Salix arctica", col: "#5f8f45", habitat: "Low ground with some shelter.", role: "Producer: food for lemmings, hares and musk oxen.", abiotic: ["Grows flat along the ground, out of the wind and under the snow in winter.", "Fine hairs on its leaves and catkins reduce heat loss."], biotic: ["Can regrow after being grazed."] },
        { id: "lemming", pl: "collared lemmings", name: "Collared lemming", latin: "Dicrostonyx groenlandicus", col: "#9a8a6a", habitat: "Tunnels in the snow in winter; burrows in summer.", role: "Primary consumer: eats plants; the main prey of stoats, foxes and snowy owls.", abiotic: ["Stays active all winter in tunnels beneath the snow, which insulates it from the cold air.", "Grows a thicker coat in winter, which reduces heat loss."], biotic: ["Breeds quickly, so numbers can rise fast when predators are few."] },
        { id: "stoat", pl: "stoats", name: "Stoat", latin: "Mustela erminea", col: "#8a6a4a", habitat: "Follows lemmings through their snow tunnels.", role: "Secondary consumer (predator): a specialist predator of lemmings.", abiotic: ["Thick winter fur reduces heat loss."], biotic: ["White winter coat camouflages it against the snow when hunting.", "A long, thin body fits into lemming tunnels under the snow."] },
        { id: "fox", pl: "Arctic foxes", name: "Arctic fox", latin: "Vulpes lagopus", col: "#7f8fa0", habitat: "Dens on raised, dry ground.", role: "Predator and scavenger: eats lemmings, birds and eggs.", abiotic: ["Thick fur, even on the soles of its feet; small ears and a short snout reduce heat loss."], biotic: ["White winter coat camouflages it when hunting.", "Hears lemmings under the snow and pounces through it.", "Stores spare food in summer."] },
        { id: "owl", pl: "snowy owls", name: "Snowy owl", latin: "Bubo scandiacus", col: "#5a6a7a", habitat: "Open tundra; nests on the ground.", role: "Predator: eats mainly lemmings.", abiotic: ["Feathers cover its legs and toes, reducing heat loss."], biotic: ["Breeds more in years when lemmings are plentiful."] },
      ] },
  ];

  // ---- Succession Timeline: two pathways of primary succession, five stages each. Readings are RELATIVE (0 to 4),
  // illustrative only, from the qualitative descriptions in standard ecology texts; they are not measurements.
  // keys: soil (depth), humus (organic matter), water (water held), minerals (mineral ions, including nitrate), shelter
  // (shelter and shade), species (number of species: biodiversity).
  D.SUCCESSION = {
    rock: { name: "Bare rock", where: "for example new lava, or rock left behind by a retreating glacier", ground: "rock",
      stages: [
        { id: "r1", name: "Bare rock: colonisation", short: "Bare rock", plants: { lichen: 9 }, read: { soil: 0, humus: 0, water: 0, minerals: 0, shelter: 0, species: 1 },
          who: "Pioneer species: lichens (a fungus living with an alga or a cyanobacterium) and cyanobacteria.",
          adapt: ["survive drying out completely and extremes of temperature", "need no soil: they cling to the rock surface", "spores are tiny and carried long distances by the wind", "some contain cyanobacteria that fix nitrogen"],
          change: "Lichens release acids that weather the rock surface. Weathered particles mix with the remains of dead lichens: the first, very thin soil." },
        { id: "r2", name: "Mosses", short: "Mosses", plants: { lichen: 5, moss: 8 }, read: { soil: 1, humus: 1, water: 1, minerals: 1, shelter: 0, species: 2 },
          who: "Mosses grow in cracks where the thin soil has collected.",
          adapt: ["tolerate drying out and recover when wetted", "need only a thin layer of soil"],
          change: "Moss cushions trap more rock particles and hold water. Dead moss adds organic matter (humus). The thicker, damper soil suits plants with roots; lichens are overgrown and shaded." },
        { id: "r3", name: "Grasses, ferns and small flowering plants", short: "Grasses and herbs", plants: { moss: 4, grass: 9, herb: 4 }, read: { soil: 2, humus: 2, water: 2, minerals: 2, shelter: 1, species: 3 },
          who: "Grasses, ferns and small flowering plants, including some, such as lupins, with nitrogen-fixing bacteria in their roots.",
          adapt: ["seeds spread by wind or animals", "grow quickly in shallow soil", "nitrogen-fixing partners add nitrate to the poor soil"],
          change: "Roots break up rock and bind soil; dead leaves and roots add humus, so the soil deepens and holds more water and mineral ions. The plants shade the mosses." },
        { id: "r4", name: "Shrubs", short: "Shrubs", plants: { grass: 5, herb: 3, shrub: 6 }, read: { soil: 3, humus: 3, water: 3, minerals: 3, shelter: 3, species: 4 },
          who: "Shrubs such as willow and alder (alder has nitrogen-fixing bacteria in root nodules).",
          adapt: ["taller, so they shade smaller plants", "deeper roots reach water and mineral ions"],
          change: "Leaf litter builds deep, fertile soil; the shrubs give shelter and shade. Many low-growing, light-demanding species are shaded out." },
        { id: "r5", name: "Climax community: woodland", short: "Climax woodland", plants: { herb: 2, shrub: 2, tree: 6, conifer: 3 }, read: { soil: 4, humus: 4, water: 4, minerals: 3, shelter: 4, species: 3 },
          who: "Trees dominate (for example spruce and hemlock forest at Glacier Bay in Alaska). The climax depends mainly on the climate.",
          adapt: ["tall, so they win the competition for light", "long-lived, so the community changes little"],
          change: "A stable community that stays much the same unless it is disturbed. A few dominant trees shade the ground, so the number of species may be a little lower than in the shrub stage." },
      ] },
    dunes: { name: "Sand dunes", where: "coasts of north-west Europe", ground: "sand",
      stages: [
        { id: "d1", name: "Embryo dunes: colonisation", short: "Embryo dunes", plants: { couch: 6 }, read: { soil: 0, humus: 0, water: 0, minerals: 0, shelter: 0, species: 1 },
          who: "Pioneer species: sand couch grass and, along the strandline, sea rocket.",
          adapt: ["tolerate salt spray and short floods of sea water", "long roots reach water in dry sand", "underground stems (rhizomes) spread and trap blowing sand"],
          change: "The grass slows the wind, so blown sand piles up around it into small (embryo) dunes, raised above the reach of most tides." },
        { id: "d2", name: "Mobile (yellow) dunes", short: "Mobile dunes", plants: { couch: 2, marram: 9 }, read: { soil: 0, humus: 1, water: 1, minerals: 0, shelter: 1, species: 2 },
          who: "Marram grass dominates.",
          adapt: ["grows up through fresh sand when it is buried", "rolled leaves, with stomata in pits and hairs inside the roll, reduce water loss", "very long roots and rhizomes"],
          change: "Marram binds the sand and stabilises the dune. Its dead leaves add the first organic matter, and the dune is less affected by salt spray. Marram grows less well once the sand stops moving: the dune it made becomes less suitable for it." },
        { id: "d3", name: "Fixed (grey) dunes", short: "Fixed dunes", plants: { marram: 3, moss: 5, grass: 4, herb: 5 }, read: { soil: 1, humus: 2, water: 2, minerals: 2, shelter: 1, species: 4 },
          who: "Mosses, lichens, low grasses and small flowering plants, including legumes with nitrogen-fixing bacteria in their roots.",
          adapt: ["need a stable surface", "nitrogen-fixers add nitrate to the soil"],
          change: "Humus turns the sand grey and the soil holds more water and mineral ions. Many species can now live here, and marram declines." },
        { id: "d4", name: "Dune heath and scrub", short: "Heath and scrub", plants: { heather: 6, grass: 3, shrub: 5 }, read: { soil: 2, humus: 3, water: 3, minerals: 2, shelter: 3, species: 4 },
          who: "Heather, gorse and shrubs such as sea buckthorn (which fixes nitrogen) and hawthorn.",
          adapt: ["taller, woody plants shade those below", "tolerate the more acidic soil that develops as rain washes out shell fragments and humus builds up"],
          change: "Shrubs add leaf litter and shade; low plants of the open dune are shaded out." },
        { id: "d5", name: "Climax community: woodland", short: "Climax woodland", plants: { shrub: 3, tree: 7 }, read: { soil: 4, humus: 4, water: 4, minerals: 3, shelter: 4, species: 3 },
          who: "Woodland (for example birch and oak) where the dunes are old enough and left undisturbed.",
          adapt: ["tall trees win the competition for light"],
          change: "A stable climax community. Shade from a few dominant trees means fewer light-demanding species." },
      ] },
  };
  D.READKEYS = [["soil", "Soil depth"], ["humus", "Humus (organic matter)"], ["water", "Water held in the soil"], ["minerals", "Mineral ions (e.g. nitrate)"], ["shelter", "Shelter and shade"], ["species", "Number of species"]];

  // ---- Conservation Decision Challenge: four habitats that are kept at a stage BEFORE the climax by management.
  // Outcomes are qualitative and follow the published management guidance cited on the 3.3.1.3 page; "after" shows the
  // likely state after about 20 to 30 years. scene keys are drawn by B.ecologyArt.habitat.
  D.CONSERVE = [
    { id: "heath", name: "Lowland heathland", where: "Western Europe", goal: "Keep open heather heath for the insects, reptiles and birds that need it.", now: "heath",
      problem: "Birch and pine seedlings are spreading across the heath. Grazing animals were removed some years ago.",
      options: [
        { id: "none", text: "Do nothing", after: "woodland", ok: false, why: "Succession continues: birch and pine grow into scrub and then woodland, which shades out the heather. The heath species lose their habitat." },
        { id: "graze", text: "Graze with ponies or cattle and cut or pull out tree seedlings", after: "heath", ok: true, why: "Grazing, trampling and removing seedlings stop the shrubs and trees taking over, so succession is held at the heath stage (a plagioclimax). This needs to continue every year." },
        { id: "burn", text: "Burn or cut small patches of old heather in rotation", after: "heathmix", ok: true, why: "Removing old heather in small patches kills tree seedlings and lets young heather regrow, so the heath stays open and has heather of different ages. Fires must be small, controlled and done in the right season." },
        { id: "fert", text: "Spread fertiliser to help the heather grow", after: "grass", ok: false, why: "Heather is adapted to soils with few nutrients. Extra nitrate and phosphate favour fast-growing grasses and trees, which outcompete the heather." },
      ] },
    { id: "prairie", name: "Tallgrass prairie", where: "Kansas, USA", goal: "Keep a grassland with many grasses and wild flowers.", now: "prairie",
      problem: "Fires used to sweep across the prairie every few years. Where fire is kept out, shrubs and trees invade.",
      options: [
        { id: "none", text: "Prevent all fires", after: "shrubland", ok: false, why: "Without fire, shrubs and trees such as dogwood and eastern red cedar spread and shade the grasses: the grassland turns into shrubland and then woodland." },
        { id: "burn", text: "Carry out planned (prescribed) burns every 1 to 3 years", after: "prairie", ok: true, why: "Frequent fire kills the shoots of young shrubs and trees, while the grasses regrow from buds at or below the ground. Succession is held at the grassland stage." },
        { id: "rare", text: "Burn once every 20 years", after: "shrubland", ok: false, why: "Between fires the shrubs grow large enough to survive the next fire, so shrubland develops anyway." },
        { id: "plant", text: "Plant trees to make the area more natural", after: "woodland", ok: false, why: "Planting trees speeds succession towards woodland and removes the grassland habitat." },
      ] },
    { id: "dune", name: "Coastal sand dunes", where: "North-west Europe", goal: "Restore a dune system that has been damaged by heavy trampling.", now: "blowout",
      problem: "Thousands of visitors walk over the dunes. The marram grass has been trampled, and the wind is blowing out large hollows of bare sand.",
      options: [
        { id: "none", text: "Do nothing", after: "blowout", ok: false, why: "Trampling keeps killing marram, so the sand stays loose and blow-outs grow. The early stages of succession cannot become established." },
        { id: "fence", text: "Fence the worst areas, lay boardwalks and replant marram grass", after: "dunes", ok: true, why: "Marram, the species that stabilises mobile dunes, can re-establish. It traps sand and binds it, so succession can restart and fixed dunes develop behind it." },
        { id: "pines", text: "Plant pine trees over the whole dune system", after: "pines", ok: false, why: "Pines stabilise the sand but shade out the dune plants, dry and acidify the soil, and remove the open habitats that dune species depend on." },
        { id: "remove", text: "Remove the remaining marram so visitors have open sand", after: "blowout", ok: false, why: "Without marram the sand is unstable. The dunes erode further and the dune community is lost." },
      ] },
    { id: "reed", name: "Reed bed", where: "Wetlands of Europe and Asia", goal: "Keep a wet reed bed for the birds and insects that breed only in reeds.", now: "reeds",
      problem: "Dead reeds and silt are building up, the ground is getting drier, and willow scrub is spreading in.",
      options: [
        { id: "none", text: "Do nothing", after: "carr", ok: false, why: "As litter builds up the reed bed dries and becomes wet woodland of willow and alder (carr). The reed bed species lose their habitat." },
        { id: "cut", text: "Cut reeds in rotation, remove the cut material and clear willow scrub", after: "reeds", ok: true, why: "Removing litter and scrub stops the build-up of organic matter and the invasion of shrubs, so succession is held at the reed bed stage." },
        { id: "water", text: "Raise water levels and remove some built-up mud", after: "reeds", ok: true, why: "Wetter conditions suit reeds but not willow, and removing silt resets the reed bed to an earlier stage." },
        { id: "drain", text: "Drain the reed bed", after: "dry", ok: false, why: "Drying the ground speeds up succession to scrub and grassland; reeds need waterlogged ground." },
      ] },
  ];

  // ---- Population Data Challenge datasets. ALL NUMBERS ARE HYPOTHETICAL (made up for practice); the context of each set
  // is a real study or a real situation, named on the page. Answers are computed here so the questions cannot drift.
  D.DATA = {
    // (1) distribution on a rocky shore: mean number of limpets per quadrat at six heights above low tide
    limpets: { x: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0], y: [21, 24, 18, 12, 6, 1], xLabel: "Height above low-tide level / m", yLabel: "Mean limpets per quadrat" },
    // (2) red and grey squirrels in one forest (counts along fixed routes each autumn), years 0 to 20
    squirrels: { t: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20], red: [48, 46, 41, 37, 30, 22, 15, 10, 6, 3, 2], grey: [0, 2, 5, 9, 15, 22, 30, 37, 42, 45, 47] },
    // (3) predator and prey numbers (thousands) in one region over 30 years, in the style of trapping records
    cycle: { t: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30], prey: [30, 70, 120, 60, 20, 15, 45, 110, 75, 25, 12, 40, 105, 80, 30, 14], pred: [4, 5, 9, 14, 9, 4, 3, 6, 12, 11, 5, 3, 5, 11, 10, 5] },
    // (4) a laboratory experiment in the style of Gause (1934): two species of Paramecium grown separately and together
    //     (individuals per cm3 of culture) on days 0 to 16
    gause: { t: [0, 2, 4, 6, 8, 10, 12, 14, 16], aAlone: [2, 20, 95, 170, 195, 200, 198, 200, 199], bAlone: [2, 18, 60, 105, 125, 130, 128, 130, 129], aMixed: [2, 15, 60, 115, 150, 170, 180, 185, 188], bMixed: [2, 14, 40, 55, 45, 30, 18, 9, 4] },
  };
  B.ecologyData = D;

  // =============================================== ART ===============================================
  const A = {};
  let cnt = 0; const uid = () => "-ec" + (++cnt);
  A.esc = esc;
  // Line chart. o: { t: [x], series: [{name, values, color, dash, marker}], xLabel, yLabel, w, h, yMax, xTicks, vline,
  // aria, legend: true, y2: { max, label } }. Axis labels 15 units, ticks 14 units; the legend sits above the plot so it
  // never covers a line. With o.y2, series marked axis: 2 are read on a right-hand scale (0 to y2.max) whose ticks line
  // up with the left-hand gridlines, so each line can be read off the graph at its true value.
  A.lineChart = function (o) {
    const W = o.w || 640, H = o.h || 340, L = 70, R = W - (o.y2 ? 70 : 18), top = o.legend === false ? 18 : 48, bot = H - 54;
    const xs = o.t, xMin = xs[0], xMax = xs[xs.length - 1];
    const all = o.series.filter((s) => s.axis !== 2).flatMap((s) => s.values); const yMax = o.yMax || niceMax(Math.max(1, ...all));
    const X = (x) => L + ((R - L) * (x - xMin)) / (xMax - xMin || 1), Y0 = (y) => bot - ((bot - top) * y) / yMax;
    const y2f = o.y2 ? yMax / o.y2.max : 1; let Y = Y0;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(o.aria || "line graph")}" style="max-width:100%;height:auto;display:block" ${FONT}><rect width="${W}" height="${H}" fill="#fff"/>`;
    const yStep = niceStep(yMax);
    for (let y = 0; y <= yMax + 1e-9; y += yStep) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${R}" y2="${r1(Y(y))}" stroke="#e6ecef"/>` + T(L - 8, Y(y) + 5, fmt(y), { a: "end", s: 14, c: GREY }) + (o.y2 ? T(R + 8, Y(y) + 5, fmt(y / y2f), { a: "start", s: 14, c: GREY }) : "");
    if (o.y2) s += `<line x1="${R}" y1="${top}" x2="${R}" y2="${bot}" stroke="${INK}" stroke-width="1.4"/><text transform="translate(${W - 14} ${r1((top + bot) / 2)}) rotate(90)" text-anchor="middle" font-size="15" font-weight="700" fill="${INK}">${o.y2.label || ""}</text>`;
    const xt = o.xTicks || ticks(xMin, xMax);
    xt.forEach((x) => { s += `<line x1="${r1(X(x))}" y1="${bot}" x2="${r1(X(x))}" y2="${bot + 5}" stroke="${GREY}"/>` + T(X(x), bot + 21, fmt(x), { s: 14, c: GREY }); });
    s += `<line x1="${L}" y1="${bot}" x2="${R}" y2="${bot}" stroke="${INK}" stroke-width="1.4"/><line x1="${L}" y1="${top}" x2="${L}" y2="${bot}" stroke="${INK}" stroke-width="1.4"/>`;
    s += T((L + R) / 2, H - 10, o.xLabel || "", { s: 15, w: 700 }) + `<text transform="translate(18 ${r1((top + bot) / 2)}) rotate(-90)" text-anchor="middle" font-size="15" font-weight="700" fill="${INK}">${o.yLabel || ""}</text>`;
    if (o.vline != null) s += `<line x1="${r1(X(o.vline.x))}" y1="${top}" x2="${r1(X(o.vline.x))}" y2="${bot}" stroke="#7a8794" stroke-width="1.5" stroke-dasharray="5 4"/>` + T(X(o.vline.x) + 6, top + 16, o.vline.label, { a: "start", s: 13, c: "#46525e" });
    o.series.forEach((se) => { Y = se.axis === 2 ? (y) => Y0(y * y2f) : Y0; const pts = se.values.map((v, i) => `${i ? "L" : "M"}${r1(X(xs[i]))} ${r1(Y(Math.min(v, se.axis === 2 ? o.y2.max : yMax)))}`).join(" ");
      s += `<path d="${pts}" fill="none" stroke="${se.color}" stroke-width="3"${se.dash ? ` stroke-dasharray="${se.dash}"` : ""} stroke-linejoin="round"/>`;
      if (se.marker) se.values.forEach((v, i) => { s += se.marker === "square" ? `<rect x="${r1(X(xs[i]) - 4)}" y="${r1(Y(v) - 4)}" width="8" height="8" fill="${se.color}"/>` : `<circle cx="${r1(X(xs[i]))}" cy="${r1(Y(v))}" r="4" fill="${se.color}"/>`; }); }); Y = Y0;
    if (o.legend !== false) { let x = L; o.series.forEach((se) => { s += `<line x1="${x}" y1="22" x2="${x + 30}" y2="22" stroke="${se.color}" stroke-width="3"${se.dash ? ` stroke-dasharray="${se.dash}"` : ""}/>` + T(x + 38, 27, esc(se.name), { a: "start", s: 14 }); x += 38 + tw(se.name, 14) + 28; }); }
    return s + "</svg>";
  };
  // Scatter chart with optional line of best fit omitted (students judge the pattern themselves).
  A.scatter = function (o) {
    const W = o.w || 600, H = o.h || 330, L = 70, R = W - 22, top = 18, bot = H - 54;
    const xMax = o.xMax || niceMax(Math.max(...o.x)), yMax = o.yMax || niceMax(Math.max(...o.y));
    const X = (x) => L + ((R - L) * x) / xMax, Y = (y) => bot - ((bot - top) * y) / yMax;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(o.aria || "scatter graph")}" style="max-width:100%;height:auto;display:block" ${FONT}><rect width="${W}" height="${H}" fill="#fff"/>`;
    const ys = niceStep(yMax), xs = o.xStep || niceStep(xMax);
    for (let y = 0; y <= yMax + 1e-9; y += ys) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${R}" y2="${r1(Y(y))}" stroke="#e6ecef"/>` + T(L - 8, Y(y) + 5, fmt(y), { a: "end", s: 14, c: GREY });
    for (let x = 0; x <= xMax + 1e-9; x += xs) s += `<line x1="${r1(X(x))}" y1="${bot}" x2="${r1(X(x))}" y2="${bot + 5}" stroke="${GREY}"/>` + T(X(x), bot + 21, fmt(x), { s: 14, c: GREY });
    s += `<line x1="${L}" y1="${bot}" x2="${R}" y2="${bot}" stroke="${INK}" stroke-width="1.4"/><line x1="${L}" y1="${top}" x2="${L}" y2="${bot}" stroke="${INK}" stroke-width="1.4"/>`;
    s += T((L + R) / 2, H - 10, o.xLabel, { s: 15, w: 700 }) + `<text transform="translate(18 ${r1((top + bot) / 2)}) rotate(-90)" text-anchor="middle" font-size="15" font-weight="700" fill="${INK}">${o.yLabel}</text>`;
    o.x.forEach((x, i) => { s += `<circle cx="${r1(X(x))}" cy="${r1(Y(o.y[i]))}" r="6" fill="${o.color || "#1f66b0"}" stroke="#fff" stroke-width="1.5"/>`; });
    return s + "</svg>";
  };
  function niceStep(max) { const raw = max / 5; const p = 10 ** Math.floor(Math.log10(raw)); const m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function niceMax(max) { const st = niceStep(max); return Math.ceil(max / st) * st; }
  function ticks(a, b) { const st = niceStep(b - a); const out = []; for (let x = Math.ceil(a / st) * st; x <= b + 1e-9; x += st) out.push(Math.round(x * 1000) / 1000); return out; }
  function fmt(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 10) / 10); }

  // Ecosystem diagram for the Ecosystem Explorer. o: { level: "population" | "community" | "ecosystem", sel: population id }
  // The ecosystem box holds the non-living part (chips) and the community (five populations, each a cell of dots: one dot
  // = one individual, numbers not to scale). Population cells carry data-pop for clicking.
  A.ecosystem = function (eco, o = {}) {
    const W = 560, H = 520, lev = o.level || "community", hl = "#e0a21a";
    const abX = 24, abY = 50, abW = W - 48; let chips = "", cx = abX + 12, cy = abY + 40; const fs = 14.5;
    // chip width from a narrower estimate than tw() (0.5 em per character suits these lower-case labels); the Ecosystem
    // Explorer then measures each label in the browser and evens out the padding (fitChips in interactives-ecology.js)
    eco.abiotic.forEach((a) => { const w = String(a).length * fs * 0.5 + 20; if (cx + w > abX + abW - 10) { cx = abX + 12; cy += 29; } chips += `<rect data-chip x="${r1(cx)}" y="${r1(cy - 15)}" width="${r1(w)}" height="23" rx="11.5" fill="#fff" stroke="${eco.edge}" stroke-opacity=".55"/>` + T(cx + w / 2, cy + 1, esc(a), { s: fs, c: "#2a3a4a" }); cx += w + 8; });
    const abH = cy - abY + 18;
    const cmY = abY + abH + 14, cmH = H - cmY - 14;
    const onEco = lev === "ecosystem", onCom = lev === "community" || onEco, onPop = lev === "population";
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(`Diagram of a ${eco.name.toLowerCase().replace(/^arctic/, "Arctic")} ecosystem: the non-living part and a community of five populations`)}" style="max-width:100%;height:auto;display:block" ${FONT}>`;
    s += `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="18" fill="${eco.tint}" stroke="${onEco ? hl : eco.edge}" stroke-width="${onEco ? 5 : 2}"/>`;
    const nm = esc(eco.name.toLowerCase().replace(/^arctic/, "Arctic")); // "Arctic" is a proper adjective
    s += T(22, 34, onEco ? `Ecosystem: ${nm}` : onPop ? `One population in the ${nm}` : `Community: ${nm}`, { a: "start", s: 18, w: 700 });
    // the non-living part is shown faintly unless the whole ecosystem is chosen (the community is living organisms only)
    s += `<g style="opacity:${onEco ? 1 : 0.35}"><rect x="${abX}" y="${abY}" width="${abW}" height="${r1(abH)}" rx="12" fill="#ffffff" fill-opacity=".55" stroke="${onEco ? hl : "#9fb1b8"}" stroke-width="${onEco ? 3 : 1.2}" stroke-dasharray="${onEco ? "" : "5 4"}"/>` + T(abX + 12, abY + 17, "Non-living (abiotic) part of the environment", { a: "start", s: 14.5, w: 700, c: "#2a3a4a" }) + chips + `</g>`;
    s += `<rect x="${abX}" y="${r1(cmY)}" width="${abW}" height="${r1(cmH)}" rx="12" fill="#fff" fill-opacity=".7" stroke="${onCom ? hl : "#9fb1b8"}" stroke-width="${onCom ? 4 : 1.2}"/>` + T(abX + 12, cmY + 20, "Community: populations of different species", { a: "start", s: 15, w: 700 });
    const cw = (abW - 24 - 8) / 2, ch = (cmH - 36) / 3 - 6; const pos = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 2]];
    eco.pops.forEach((p, i) => { const [c, rr] = pos[i]; const x = abX + 12 + c * (cw + 8), y = cmY + 30 + rr * (ch + 6); const sel = onPop && o.sel === p.id; const dim = onPop && o.sel !== p.id;
      let dots = ""; for (let k = 0; k < 7; k++) dots += `<circle cx="${r1(x + 18 + k * 19)}" cy="${r1(y + 16)}" r="7" fill="${p.col}" stroke="#fff" stroke-width="1.2"/>`;
      s += `<g data-pop="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}: show its population and niche" style="cursor:pointer;opacity:${dim ? 0.55 : 1}"><title>${esc(p.name)}</title><rect x="${r1(x)}" y="${r1(y)}" width="${r1(cw)}" height="${r1(ch)}" rx="10" fill="#fff" stroke="${sel ? hl : "#b9c6cc"}" stroke-width="${sel ? 4 : 1.2}"/>${dots}` +
        T(x + 10, y + ch - 27, esc(p.name), { a: "start", s: 15, w: 700 }) + T(x + 10, y + ch - 9, esc(p.latin), { a: "start", s: 14.5, i: true, c: GREY }) + `</g>`; });
    return s + "</svg>";
  };
  const nameFs = (s, w) => Math.max(14, Math.min(15, w / (String(s).length * 0.56)));

  // Barnacle zones on a rocky shore (Connell 1961, Isle of Cumbrae, Scotland): where adults of each species live, and
  // where Chthamalus larvae settle. Schematic heights, not to scale.
  A.barnacles = function () {
    const W = 720, H = 400; const yHT = 92, yLT = 330; const u = uid();
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Schematic rocky shore from high tide down to low tide. Chthamalus adults live in a band at the top; their larvae settle lower too. Semibalanus adults live in the band below, down to low tide." style="max-width:100%;height:auto;display:block" ${FONT}>
      <defs><marker id="ah${u}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker></defs><rect width="${W}" height="${H}" fill="#fff"/>`;
    // the shore (rock) behind the three bars
    s += `<rect x="270" y="40" width="250" height="${yLT + 20 - 40}" rx="8" fill="#eee8dc"/>`;
    s += `<line x1="20" y1="${yHT}" x2="${W - 10}" y2="${yHT}" stroke="#2f6db5" stroke-width="1.6" stroke-dasharray="7 5"/>` + T(W - 10, yHT - 8, "high-tide level", { a: "end", s: 14, c: "#2f6db5" });
    s += `<line x1="20" y1="${yLT}" x2="${W - 10}" y2="${yLT}" stroke="#2f6db5" stroke-width="1.6" stroke-dasharray="7 5"/>` + T(W - 10, yLT + 22, "low-tide level", { a: "end", s: 14, c: "#2f6db5" });
    const zC = [yHT - 22, yHT + 70], zS = [yHT + 70, yLT];
    const col = (x, y0, y1, fill, dash) => `<rect x="${x}" y="${y0}" width="46" height="${y1 - y0}" rx="6" fill="${fill}" ${dash ? `fill-opacity=".25" stroke="${fill}" stroke-width="2" stroke-dasharray="6 4"` : ""}/>`;
    const lab = (x, l1, l2) => T(x + 23, yLT + 46, l1, { s: 14, w: 700 }) + T(x + 23, yLT + 63, l2, { s: 13, c: GREY });
    s += col(290, zC[0], zC[1], "#c0702a", false) + col(385, zC[0], yLT, "#c0702a", true) + col(480, zS[0], zS[1], "#4f6fa8", false);
    s += lab(290, "Chthamalus", "adults") + lab(385, "Chthamalus", "larvae settle") + lab(480, "Semibalanus", "adults");
    // left: the lower limit of adult Chthamalus (biotic)
    s += `<line x1="254" y1="${zC[1]}" x2="288" y2="${zC[1]}" stroke="${INK}" stroke-width="1.4" marker-end="url(#ah${u})"/>`;
    ["Lower limit of adult", "Chthamalus: young ones", "are smothered, crushed", "or prised off by the", "faster-growing Semibalanus"].forEach((l, i) => { s += T(248, zC[1] - 28 + i * 18, l, { a: "end", s: 13.5, w: i < 2 ? 700 : 500 }); });
    s += T(248, zC[1] - 28 + 5 * 18, "competition (biotic)", { a: "end", s: 13.5, w: 700, c: "#b4504f" });
    // right: the upper limit of Semibalanus (abiotic)
    s += `<line x1="566" y1="${zS[0]}" x2="530" y2="${zS[0]}" stroke="${INK}" stroke-width="1.4" marker-end="url(#ah${u})"/>`;
    ["Upper limit of", "Semibalanus: it dies", "if it dries out for", "too long at low tide"].forEach((l, i) => { s += T(572, zS[0] - 22 + i * 18, l, { a: "start", s: 13.5, w: i < 2 ? 700 : 500 }); });
    s += T(572, zS[0] - 22 + 4 * 18, "drying out (abiotic)", { a: "start", s: 13.5, w: 700, c: "#2f6db5" });
    s += T(20, H - 8, "Heights are schematic, not to scale.", { a: "start", s: 13, c: GREY });
    return s + "</svg>";
  };

  // What changes the size of a population (supporting diagram): births and immigration add individuals, deaths and
  // emigration remove them; abiotic factors, competition and predation act on these.
  A.popChange = function () {
    const W = 680, H = 316; const u = uid();
    const box = (x, y, w, h, fill, stroke, lines, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` + lines.map((l, i) => T(x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 18 + 5, l, { s: i === 0 ? 15 : 13.5, w: i === 0 ? 700 : 500, c: i === 0 ? INK : "#2a3a4a" })).join("");
    const arr = (x1, y1, x2, y2, c = INK) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2.4" marker-end="url(#pa${u})"/>`;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Diagram: births and immigration increase a population; deaths and emigration decrease it. Abiotic factors, competition within and between species, and predation act on births and deaths." style="max-width:100%;height:auto;display:block" ${FONT}><defs><marker id="pa${u}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker></defs><rect width="${W}" height="${H}" fill="#fff"/>`;
    s += box(250, 70, 180, 70, "#d6efec", "#1f8a8a", ["Population size", "(one species)"]);
    s += box(40, 30, 150, 46, "#e6f2e2", "#4f8a3a", ["Births"]) + box(40, 136, 150, 46, "#e6f2e2", "#4f8a3a", ["Immigration"]);
    s += box(490, 30, 150, 46, "#fbe8e6", "#b4504f", ["Deaths"]) + box(490, 136, 150, 46, "#fbe8e6", "#b4504f", ["Emigration"]);
    s += arr(190, 53, 248, 90) + arr(190, 159, 248, 122) + arr(432, 90, 488, 53) + arr(432, 122, 488, 159);
    s += T(205, 100, "add", { s: 13, c: "#4f8a3a", w: 700 }) + T(475, 100, "remove", { s: 13, c: "#b4504f", w: 700 });
    s += box(30, 242, 196, 62, "#f3f6f8", "#7a8794", ["Abiotic factors", "temperature, light, water, pH"]) + box(242, 242, 196, 62, "#f3f6f8", "#7a8794", ["Competition", "intraspecific, interspecific"]) + box(454, 242, 196, 62, "#f3f6f8", "#7a8794", ["Predation", "predators kill and eat prey"]);
    s += `<line x1="128" y1="230" x2="552" y2="230" stroke="#7a8794" stroke-width="1.6"/><line x1="128" y1="230" x2="128" y2="241" stroke="#7a8794" stroke-width="1.6"/><line x1="552" y1="230" x2="552" y2="241" stroke="#7a8794" stroke-width="1.6"/><line x1="340" y1="241" x2="340" y2="144" stroke="#7a8794" stroke-width="1.8" marker-end="url(#pa${u})"/>`;
    s += T(60, 202, "These change population size", { a: "start", s: 13.5, w: 700, c: "#46525e" }) + T(60, 220, "by acting on births and deaths", { a: "start", s: 13.5, w: 700, c: "#46525e" });
    return s + "</svg>";
  };

  // ---------------- landscape scenes (succession and habitat management) ----------------
  // Plant icons drawn at (x, groundY) with a size factor; positions are deterministic so a stage always looks the same.
  const P = {
    lichen: (x, y, k) => `<ellipse cx="${r1(x)}" cy="${r1(y - 2)}" rx="${r1(9 * k)}" ry="${r1(4 * k)}" fill="#d9a43a"/><ellipse cx="${r1(x + 9 * k)}" cy="${r1(y - 3)}" rx="${r1(6 * k)}" ry="${r1(3 * k)}" fill="#9fae86"/>`,
    moss: (x, y, k) => `<path d="M${r1(x - 13 * k)} ${r1(y)} Q ${r1(x)} ${r1(y - 18 * k)} ${r1(x + 13 * k)} ${r1(y)} Z" fill="#5f8f2f"/><path d="M${r1(x - 8 * k)} ${r1(y)} Q ${r1(x - 2 * k)} ${r1(y - 11 * k)} ${r1(x + 4 * k)} ${r1(y)}" fill="#7fab3f"/>`,
    grass: (x, y, k) => [-7, -3, 0, 3, 7].map((d) => `<path d="M${r1(x + d * k * 0.6)} ${r1(y)} Q ${r1(x + d * k)} ${r1(y - 18 * k)} ${r1(x + d * k * 1.9)} ${r1(y - 30 * k)}" fill="none" stroke="#5f9a3a" stroke-width="2.2" stroke-linecap="round"/>`).join(""),
    couch: (x, y, k) => [-5, 0, 5].map((d) => `<path d="M${r1(x + d * k * 0.6)} ${r1(y)} Q ${r1(x + d * k)} ${r1(y - 12 * k)} ${r1(x + d * k * 2)} ${r1(y - 20 * k)}" fill="none" stroke="#6f9a8a" stroke-width="2.2" stroke-linecap="round"/>`).join(""),
    marram: (x, y, k) => [-9, -5, -2, 2, 5, 9].map((d) => `<path d="M${r1(x + d * k * 0.4)} ${r1(y)} L ${r1(x + d * k * 1.7)} ${r1(y - 44 * k + Math.abs(d) * 2 * k)}" fill="none" stroke="#7fa08a" stroke-width="2.6" stroke-linecap="round"/>`).join(""),
    herb: (x, y, k) => P.grass(x, y, k * 0.7) + `<circle cx="${r1(x + 4 * k)}" cy="${r1(y - 24 * k)}" r="${r1(4 * k)}" fill="#e0b21a"/><circle cx="${r1(x - 5 * k)}" cy="${r1(y - 19 * k)}" r="${r1(3.5 * k)}" fill="#c97a9a"/>`,
    heather: (x, y, k) => `<path d="M${r1(x - 18 * k)} ${r1(y)} Q ${r1(x)} ${r1(y - 26 * k)} ${r1(x + 18 * k)} ${r1(y)} Z" fill="#6a7f4a"/>` + [-9, -3, 3, 9].map((d, i) => `<circle cx="${r1(x + d * k)}" cy="${r1(y - (10 + (i % 2) * 6) * k)}" r="${r1(2.8 * k)}" fill="#a0528f"/>`).join(""),
    shrub: (x, y, k) => `<rect x="${r1(x - 2 * k)}" y="${r1(y - 14 * k)}" width="${r1(4 * k)}" height="${r1(14 * k)}" fill="#6b4f33"/><ellipse cx="${r1(x)}" cy="${r1(y - 26 * k)}" rx="${r1(22 * k)}" ry="${r1(17 * k)}" fill="#3f6f35"/>`,
    tree: (x, y, k) => `<rect x="${r1(x - 4 * k)}" y="${r1(y - 52 * k)}" width="${r1(8 * k)}" height="${r1(52 * k)}" fill="#6b4f33"/><ellipse cx="${r1(x)}" cy="${r1(y - 74 * k)}" rx="${r1(34 * k)}" ry="${r1(30 * k)}" fill="#2f5f2a"/><ellipse cx="${r1(x - 12 * k)}" cy="${r1(y - 82 * k)}" rx="${r1(16 * k)}" ry="${r1(13 * k)}" fill="#3f7a35"/>`,
    conifer: (x, y, k) => `<rect x="${r1(x - 3 * k)}" y="${r1(y - 16 * k)}" width="${r1(6 * k)}" height="${r1(16 * k)}" fill="#6b4f33"/><path d="M${r1(x)} ${r1(y - 100 * k)} L ${r1(x + 24 * k)} ${r1(y - 16 * k)} L ${r1(x - 24 * k)} ${r1(y - 16 * k)} Z" fill="#244f3a"/>`,
    // common reed (Phragmites): tall stems ending in a loose, drooping, feathery purplish plume
    reed: (x, y, k) => [-6, 0, 6].map((d) => { const tx = x + d * k * 1.4, ty = y - 70 * k; return `<line x1="${r1(x + d * k)}" y1="${r1(y)}" x2="${r1(tx)}" y2="${r1(ty)}" stroke="#8a9a4a" stroke-width="2.2"/>` + `<path d="M${r1(tx)} ${r1(ty)} c ${r1(5 * k)} ${r1(-5 * k)} ${r1(11 * k)} ${r1(-1 * k)} ${r1(10 * k)} ${r1(16 * k)} c ${r1(-4 * k)} ${r1(-6 * k)} ${r1(-8 * k)} ${r1(-11 * k)} ${r1(-10 * k)} ${r1(-16 * k)} z" fill="#a98aa9" opacity=".75"/>` + [0, 1, 2, 3, 4].map((i) => `<path d="M${r1(tx)} ${r1(ty)} q ${r1((4 + i) * k)} ${r1((-5 + i) * k)} ${r1((5 + i * 1.6) * k)} ${r1((8 + i * 2.4) * k)}" fill="none" stroke="#7a5a7a" stroke-width="1.1" stroke-linecap="round"/>`).join(""); }).join(""),
    willow: (x, y, k) => `<rect x="${r1(x - 3 * k)}" y="${r1(y - 26 * k)}" width="${r1(6 * k)}" height="${r1(26 * k)}" fill="#6b4f33"/><ellipse cx="${r1(x)}" cy="${r1(y - 42 * k)}" rx="${r1(28 * k)}" ry="${r1(22 * k)}" fill="#6f9a4a"/>`,
  };
  const NAMES = { lichen: "lichens", moss: "mosses", grass: "grasses", couch: "sand couch grass", marram: "marram grass", herb: "small flowering plants", heather: "heather", shrub: "shrubs", tree: "broadleaved trees", conifer: "conifers", reed: "reeds", willow: "willow scrub" };
  // pseudo-random but fixed positions
  const spread = (n, salt, x0, x1) => Array.from({ length: n }, (_, i) => { const f = (Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453) % 1; return x0 + ((i + 0.5 + (Math.abs(f) - 0.5) * 0.7) / n) * (x1 - x0); });
  // order in which plants are drawn (short ones in front)
  const ORDER = ["conifer", "tree", "willow", "reed", "shrub", "marram", "heather", "grass", "couch", "herb", "moss", "lichen"];
  // scene: { ground: "rock" | "sand" | "soil" | "wet", soil: 0..4 (soil depth), humus: 0..4, plants: {type: n}, legend: true }
  A.scene = function (o) {
    const W = 640, H = o.legend === false ? 200 : 240, gY = 140; const salt = o.salt || 1;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(o.aria || "landscape")}" style="max-width:100%;height:auto;display:block" ${FONT}><rect width="${W}" height="${H}" fill="#fff"/><rect width="${W}" height="${gY}" fill="#eaf3f8"/>`;
    const base = { rock: "#a8a196", sand: "#ecd9a0", soil: "#a8875a", wet: "#8f8a6a" }[o.ground || "soil"];
    if (o.ground === "sand" && o.sea) s += `<rect x="0" y="${gY - 4}" width="70" height="${H - gY}" fill="#9cc8e0"/>`;
    s += `<rect x="${o.ground === "sand" && o.sea ? 70 : 0}" y="${gY}" width="${W}" height="${(o.legend === false ? H : H - 40) - gY}" fill="${base}"/>`;
    if (o.ground === "wet") s += `<rect x="0" y="${gY - 6}" width="${W}" height="10" fill="#8fb8d0" fill-opacity=".8"/>`;
    const soilH = [0, 5, 11, 18, 26][Math.max(0, Math.min(4, o.soil || 0))];
    if (soilH) s += `<rect x="0" y="${gY}" width="${W}" height="${soilH}" fill="${(o.humus || 0) >= 2 ? "#5a4330" : "#7a6248"}"/>`;
    if (o.ground === "rock") for (let i = 0; i < 9; i++) s += `<path d="M${40 + i * 70} ${gY + soilH + 8} l 14 18 l -6 14" fill="none" stroke="#7d766b" stroke-width="1.5"/>`;
    const types = ORDER.filter((k) => (o.plants || {})[k]);
    types.forEach((k, ti) => { const n = o.plants[k]; const k0 = { tree: 1, conifer: 0.9, willow: 0.9, shrub: 0.95, reed: 1, marram: 1, heather: 1 }[k] || 1; spread(n, salt + ti * 3.1, o.ground === "sand" && o.sea ? 90 : 18, W - 18).forEach((x, i) => { s += P[k](x, gY + 1, 1.15 * k0 * (0.85 + ((i * 37) % 10) / 30)); }); });
    if (o.legend !== false && types.length) { let x = 12; const y = H - 14; s += `<rect x="0" y="${H - 40}" width="${W}" height="40" fill="#fff"/>`;
      types.slice().reverse().forEach((k) => { const label = NAMES[k]; const w = tw(label, 14.5) + 30; s += `<rect x="${x}" y="${y - 12}" width="14" height="14" rx="3" fill="${legendCol(k)}"/>` + T(x + 20, y, label, { a: "start", s: 14.5 }); x += w + 10; }); }
    return s + "</svg>";
  };
  const legendCol = (k) => ({ lichen: "#d9a43a", moss: "#5f8f2f", grass: "#5f9a3a", couch: "#6f9a8a", marram: "#7fa08a", herb: "#e0b21a", heather: "#a0528f", shrub: "#3f6f35", tree: "#2f5f2a", conifer: "#244f3a", reed: "#8a6a8a", willow: "#6f9a4a" })[k];
  // Habitat states for the Conservation Decision Challenge
  A.HABITATS = {
    heath: { ground: "soil", soil: 2, humus: 1, plants: { heather: 12, grass: 3, tree: 1, conifer: 1 }, label: "Open heather heath, with young birch and pine" },
    heathmix: { ground: "soil", soil: 2, humus: 1, plants: { heather: 10, grass: 6 }, label: "Open heath with heather of different ages" },
    woodland: { ground: "soil", soil: 3, humus: 3, plants: { shrub: 3, tree: 6, conifer: 2 }, label: "Woodland: the heath or grassland has gone" },
    grass: { ground: "soil", soil: 3, humus: 2, plants: { grass: 14, shrub: 2, heather: 2 }, label: "Coarse grassland with little heather" },
    prairie: { ground: "soil", soil: 4, humus: 3, plants: { grass: 14, herb: 8 }, label: "Tallgrass prairie with grasses and wild flowers" },
    shrubland: { ground: "soil", soil: 4, humus: 3, plants: { grass: 6, shrub: 8, conifer: 2 }, label: "Shrubland: shrubs and young trees shade the grasses" },
    blowout: { ground: "sand", sea: true, soil: 0, plants: { marram: 2 }, label: "Trampled dunes with bare, blowing sand" },
    dunes: { ground: "sand", sea: true, soil: 1, humus: 1, plants: { marram: 9, moss: 3, herb: 3 }, label: "Marram re-established; fixed dune forming behind" },
    pines: { ground: "sand", sea: true, soil: 2, humus: 2, plants: { conifer: 8 }, label: "Pine plantation: open dune habitats lost" },
    reeds: { ground: "wet", soil: 1, humus: 2, plants: { reed: 16 }, label: "Wet reed bed" },
    carr: { ground: "soil", soil: 3, humus: 4, plants: { reed: 4, willow: 7, tree: 2 }, label: "Wet woodland (carr) of willow and alder" },
    dry: { ground: "soil", soil: 3, humus: 3, plants: { grass: 10, willow: 4, shrub: 2 }, label: "Dry grassland and scrub: the reeds have gone" },
  };
  A.habitat = (key, o = {}) => { const h = A.HABITATS[key]; return A.scene(Object.assign({ salt: key.length, aria: h.label }, h, o)); };
  // =============================================== PHOTOGRAPHS WITH LABEL OVERLAYS ===============================================
  // Phase 5 Batch 1 photo pass (author P1), following the pattern of data/content/_cvd-art.js: an openly licensed photograph is
  // drawn as an <image> inside a fixed viewBox (pImg: source rectangle, offset, scale) and every label is our own SVG overlay
  // (text with a white halo; leader line with a white casing ending in a dot ON the structure). Coordinates are the picture's
  // own pixels times the scale plus the offset, so labels stay aligned at any width. Licences: IMAGE_ASSET_REGISTER.md.
  //  assets/img/lichen-lava-commons.jpg  incidencematrix, "Lichen on Lava (23847106014)", CC BY 2.0 (1280 x 853). Cropped to
  //        x 0-1100, y 40-853 (the out-of-focus rock on the far right and the top strip removed), scale 0.7. Points checked at
  //        full size: fruticose lichen on the left mound (200, 450) and at the base of the central rock (470, 620); bare,
  //        porous lava with almost no lichen on the face of the central rock (800, 430).
  //  assets/img/dune-succession-par-geograph.jpg  Tony Atkin, "Par Sands Dune Succession", geograph.org.uk 558780, CC BY-SA 2.0
  //        (640 x 428). Cropped to x 0-525, y 105-330 (the china clay works, houses, road, pond and the pasture in the
  //        foreground removed), scale 2, below a 150-unit label band. Zones read from the photo at full size: bare beach sand
  //        (100, 198); a low hummock with sparse grass on loose sand at the top of the beach (228, 204; moved from 165, 186, which was bare sand just above a grass patch); older dunes where plants cover
  //        most of the sand (300, 240); dark shrubs on the dune ridge further inland (385, 195). The grasses cannot be
  //        identified at this distance, so no species is named on the photo.
  const PIMGS = { lichen: ["assets/img/lichen-lava-commons.jpg", 1280, 853], dunes: ["assets/img/dune-succession-par-geograph.jpg", 640, 428] };
  const PF = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", SUB = "#46566a";
  const pOpen = (W, H, label) => `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(label)}" font-family="${PF}" style="max-width:100%;height:auto"><rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
  const pImg = (key, sx, sy, sw, sh, dx, dy, k = 1) => { const [href, w, h] = PIMGS[key]; return `<svg x="${dx}" y="${dy}" width="${r1(sw * k)}" height="${r1(sh * k)}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none" overflow="hidden"><image href="${href}" x="0" y="0" width="${w}" height="${h}"/></svg>`; };
  const pLead = (pts, o = {}) => { const d = "M" + pts.map((p) => p.map(r1).join(" ")).join(" L"); const [ex, ey] = pts[pts.length - 1].map(r1); const c = o.c || INK;
    return `<g pointer-events="none"><path d="${d}" fill="none" stroke="#fff" stroke-width="${o.cw || 8}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${o.w || 3}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${ex}" cy="${ey}" r="${o.r || 6}" fill="${c}" stroke="#fff" stroke-width="2"/></g>`; };
  // lines: first = term in bold, others secondary
  const pLab = (x, y, lines, o = {}) => { const s = o.s || 30, s2 = o.s2 || Math.round(s * 0.87), lh = o.lh || Math.round(s * 1.17);
    return `<g pointer-events="none">` + lines.map((t, i) => `<text x="${x}" y="${y + i * lh}" text-anchor="${o.a || "start"}" font-size="${i ? s2 : s}" font-weight="${i ? 500 : 800}" fill="${i ? SUB : INK}" stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${t}</text>`).join("") + "</g>"; };
  const flat = (s) => s.replace(/\s*\n\s*/g, " ");

  // d-3.3.1.3-p1: lichens (pioneer species) on bare volcanic rock. Figure x = 330 + 0.7 sx, y = 0.7 (sy - 40).
  A.lichenPhoto = () => {
    const LW = 330, k = 0.7, X = (sx) => LW + k * sx, Y = (sy) => k * (sy - 40); const W = LW + 1100 * k + 330, H = Math.round(813 * k);
    let s = pOpen(W, H, "Photograph of lava rocks with lichens. A dark grey, porous rock full of small holes rises in the centre; most of its face is bare. White, finely branched lichens cover a mound of rock on the left and grow up the base of the central rock. Labels: lichens, pioneer species, the first organisms to colonise bare rock; bare volcanic rock (lava) with no soil.");
    s += pImg("lichen", 0, 40, 1100, 813, LW, 0, k);
    s += pLead([[LW - 14, 242], [X(200), Y(450)]]) + pLead([[LW - 14, 256], [X(470), Y(620)]]);
    s += pLab(LW - 24, 250, ["Lichens", "pioneer species:", "the first organisms", "to colonise the", "bare rock"], { a: "end" });
    s += pLead([[X(1100) + 12, 262], [X(800), Y(430)]]);
    s += pLab(X(1100) + 24, 250, ["Bare rock", "volcanic rock", "(lava):", "no soil yet"]);
    return flat(s + "</svg>");
  };

  // d-3.3.1.3-p2: zones of a sand dune system from the beach inland. Figure x = 2 sx, y = 150 + 2 (sy - 105).
  A.dunePhoto = () => {
    const TB = 150, k = 2, X = (sx) => k * sx, Y = (sy) => TB + k * (sy - 105); const W = 525 * k, H = TB + 225 * k;
    let s = pOpen(W, H, "Photograph looking down on Par Sands in Cornwall from a hill inland. On the left the sea and a wide, pale sandy beach. At the top of the beach, low patches of grass grow on loose sand. Behind them the dunes are covered by grass and low plants, with sandy paths. Further inland are dark green shrubs. Labels, numbered from the sea inland: 1 bare sand, beach with no plants; 2 young dunes, scattered grasses on loose sand; 3 fixed dunes, older, plants cover most of the sand; 4 scrub, shrubs on older, stable ground.");
    s += pImg("dunes", 0, 105, 525, 225, 0, TB, k);
    const lab = [[16, "1 Bare sand", "beach: no plants", [100, 198], 60], [276, "2 Young dunes", "scattered grasses", [228, 204], 340], [536, "3 Fixed dunes", "older: plants cover", [300, 240], 600], [796, "4 Scrub", "shrubs on older,", [385, 195], 850]];
    const third = { "2 Young dunes": "on loose sand", "3 Fixed dunes": "most of the sand", "4 Scrub": "stable ground" };
    lab.forEach(([x, t, sub, [sx, sy], lx]) => { s += pLead([[lx, 118], [X(sx), Y(sy)]]); s += pLab(x, 34, [t, sub].concat(third[t] ? [third[t]] : []), { s: 28, s2: 25, lh: 30 }); });
    // shown at most 760 px wide, so the figure stays under about 60 % of an 800 px laptop screen
    return flat(s.replace('style="max-width:100%;height:auto"', 'style="max-width:min(100%,760px);height:auto"') + "</svg>");
  };

  B.ecologyArt = A;
})(window.BIO);
