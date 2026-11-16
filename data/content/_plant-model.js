// Shared plant water model (Phase 4 Batch 3, integrator). Used by the 3.2.8.1 transpiration simulator and the RP6
// potometer laboratory so both give the same, documented behaviour. ILLUSTRATIVE MODEL, NOT MEASUREMENT: it reproduces
// the direction and approximate size of the effects of light, temperature, humidity and air movement, including the
// ways they interact, for one leafy shoot. Every page that uses it must say so.
//
// Basis (standard leaf gas-exchange physics, simplified; e.g. Jones, Plants and Microclimate, 3rd ed. 2014; Nobel,
// Physicochemical and Environmental Plant Physiology):
//   transpiration E = g × D / P       (mol m⁻² s⁻¹; D = leaf-to-air vapour pressure deficit, P = 101.3 kPa)
//   g  = 1 / (1/gs + 1/gb)            stomatal and boundary-layer conductances in series
//   gs = [gmin + (gmax − gmin) × I/(I + K)] × 1/(1 + D/D0)   stomata open with light; partly close in dry air
//   gb = 0.147 × √(u/d)  (u ≥ 0.05 m s⁻¹ still-air floor; d = leaf width 0.05 m)
//   D  = es(T) × (1 − RH);  es(T) = 0.6108 × exp(17.27 T / (T + 237.3)) kPa (Tetens); leaf temperature = air temperature
// Parameters: gmin 0.02, gmax 0.40 mol m⁻² s⁻¹ (gmin = cuticle and nearly closed stomata), K = 200 µmol m⁻² s⁻¹ of
// light, D0 = 1.5 kPa. Assumptions (stated to students): leaf at air temperature; well-watered plant (no wilting);
// steady state; no effect of temperature on stomata other than through D; stomata respond instantly.
// Interactions this gives (not independent effects): wind matters most when stomata are open (gb then limits); no
// transpiration at 100 % humidity whatever the light; in the dark gs ≈ gmin so warming or wind change little; very dry
// air partly closes stomata so the rise in E slows.
//
// Potometer (RP6): the shoot's water UPTAKE is modelled as transpiration × leaf area, less a small fraction retained in
// growing or rehydrating tissue (storeFrac, default 0.03), plus optional leak and measurement noise. A potometer
// measures uptake, not transpiration directly. Meniscus speed = uptake volume per minute ÷ capillary bore area.
window.BIO = window.BIO || {};
(function (B) {
  const P = 101.3, D0 = 1.5, K = 200, GMIN = 0.02, GMAX = 0.40, LEAF_D = 0.05;
  const es = (T) => 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // conditions: light I (µmol m⁻² s⁻¹, 0–1500), T (°C, 5–40), RH (0–1), u (m s⁻¹, 0–4)
  function leaf({ light = 300, temp = 20, rh = 0.5, wind = 0.1 } = {}) {
    const I = clamp(light, 0, 2000), T = clamp(temp, 0, 45), RH = clamp(rh, 0, 1), u = Math.max(0.05, wind);
    const D = es(T) * (1 - RH);
    const gsOpen = GMIN + (GMAX - GMIN) * (I / (I + K));
    const gs = gsOpen / (1 + D / D0);
    const gb = 0.147 * Math.sqrt(u / LEAF_D);
    const g = 1 / (1 / gs + 1 / gb);
    const E = (g * D) / P; // mol m⁻² s⁻¹
    return { D, es: es(T), gs, gb, g, E, Emmol: E * 1000, limiting: gs < gb ? "stomata" : "boundary layer" };
  }
  // uptake of a shoot in a potometer. leafArea m², bore mm (internal diameter of capillary)
  function potometer({ light = 150, temp = 20, rh = 0.5, wind = 0.1, leafArea = 0.008, bore = 1.0, storeFrac = 0.03, leak = 0 } = {}) {
    const L = leaf({ light, temp, rh, wind });
    const transpMol = L.E * leafArea; // mol s⁻¹
    const transpMm3min = transpMol * 18.02 * 1000 * 60; // 1 mol water ≈ 18.02 cm³ = 18 020 mm³ ... per minute
    const uptakeMm3min = transpMm3min * (1 - storeFrac) + leak;
    const area = Math.PI * (bore / 2) ** 2; // mm²
    return { ...L, transpMm3min, uptakeMm3min, cmPerMin: uptakeMm3min / area / 10, boreArea: area };
  }
  // meniscus readings every `step` minutes for `total` minutes (cumulative distance in cm from the start mark)
  function readings(cond = {}, { step = 3, total = 12, noise = 0, seed = 1 } = {}) {
    let s = seed >>> 0; const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const r = potometer(cond).cmPerMin; const out = [];
    for (let t = 0; t <= total + 1e-9; t += step) { const e = t === 0 ? 0 : noise * (rnd() * 2 - 1); out.push({ t, cm: Math.max(0, +(r * t + e).toFixed(2)) }); }
    return { rate: r, points: out };
  }
  B.plantModel = { es, leaf, potometer, readings, params: { P, D0, K, GMIN, GMAX, LEAF_D } };
})(window.BIO);
