// Shared models and artwork for 3.1.5 (gas exchange and the transport of oxygen). Loaded before the 3.1.5 content
// files, the consolidation page and js/views/interactives-gasx.js. Every drawing is schematic SVG drawn in code; every
// number comes from the models below, which are documented here, in KNOWN_LIMITATIONS.md (6e–6g) and in
// SCIENTIFIC_ACCURACY_AUDIT.md. Nothing here is measured data unless the comment says where it comes from.
window.BIO = window.BIO || {};
(function (B) {
  const INK = "#16263a", GREY = "#6b7d8f", TEAL = "#1f8a8a", SAGE = "#6b9a7f", NAVY = "#1e3a5f", AMBER = "#c8902a", ROSE = "#b4504f", MINT = "#d6efec", SKY = "#bfe0f5";
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 500}" fill="${o.c || INK}"${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ""}>${s}</text>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 1.5}"${o.d ? ` stroke-dasharray="${o.d}"` : ""}${o.m ? ` marker-end="url(#${o.m}${U})"` : ""}/>`;
  // Marker ids are suffixed per drawing so that several copies of one diagram on a page (notes, diagram tab, a
  // labelling question) never share an id: a shared id resolves to the first copy, which may be in a hidden pane.
  let cnt = 0, U = ""; const uid = () => (U = "-u" + (++cnt));
  const marker = (id, col, big = false) => big ? `<marker id="${id}${U}" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="12" refY="8" orient="auto"><path d="M0 0 L16 8 L0 16z" fill="${col}"/></marker>` : `<marker id="${id}${U}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="${col}"/></marker>`;

  // ================= MODELS =================
  // ---- Surface area and volume (exact geometry; validated in tests/run.js) ----
  const shapes = {
    cube: (L) => ({ sa: 6 * L * L, vol: L ** 3, name: "cube", dims: `side ${L}` }),
    cuboid: (a, b, c) => ({ sa: 2 * (a * b + b * c + a * c), vol: a * b * c, name: "cuboid", dims: `${a} × ${b} × ${c}` }),
    sphere: (r) => ({ sa: 4 * Math.PI * r * r, vol: (4 / 3) * Math.PI * r ** 3, name: "sphere", dims: `radius ${r}` }),
    cylinder: (r, h) => ({ sa: 2 * Math.PI * r * r + 2 * Math.PI * r * h, vol: Math.PI * r * r * h, name: "cylinder", dims: `radius ${r}, length ${h}` }),
  };
  const ratio = (s) => s.sa / s.vol;

  // ---- Oxygen–haemoglobin dissociation: Hill equation S = p^n / (P50^n + p^n) ----
  // Parameters are approximate literature values at the organism's normal body temperature and pH (sources in
  // SCIENTIFIC_ACCURACY_AUDIT.md: Severinghaus 1979 for adult human; standard physiology texts for the rest). Each
  // haemoglobin has its own P50 AND its own Hill coefficient: variants are not a fixed horizontal shift of one curve.
  const KPA = 7.50; // mmHg per kPa
  const hb = {
    adult: { label: "Human adult haemoglobin", P50: 26.8 / KPA, n: 2.7, note: "P50 ≈ 3.6 kPa (26.8 mmHg) at pH 7.4, 37 °C; n ≈ 2.7 (Severinghaus 1979)." },
    fetal: { label: "Human fetal haemoglobin (HbF)", P50: 19.5 / KPA, n: 2.7, note: "P50 ≈ 2.6 kPa (about 19–21 mmHg): higher affinity than adult Hb, so it loads oxygen from maternal blood in the placenta." },
    myoglobin: { label: "Myoglobin (muscle; one haem, not a haemoglobin)", P50: 2.6 / KPA, n: 1, bohr: false, note: "P50 ≈ 0.35 kPa (2.4–2.8 mmHg); hyperbolic (n = 1) because a single haem cannot show cooperative binding. Myoglobin shows almost no Bohr effect, so the pCO₂ slider does not move its curve. Shown for comparison; myoglobin is extension material." },
    llama: { label: "Llama haemoglobin (high altitude)", P50: 22 / KPA, n: 2.6, note: "P50 ≈ 2.9 kPa (about 22 mmHg): left-shifted relative to human, loads well at low atmospheric pO₂." },
    mouse: { label: "Mouse haemoglobin (small mammal)", P50: 40 / KPA, n: 2.6, note: "P50 ≈ 5.3 kPa (about 40 mmHg): right-shifted, unloads readily to tissues with a high metabolic rate (Schmidt-Nielsen 1958 size series; approximate)." },
    lugworm: { label: "Lugworm (Arenicola) haemoglobin", P50: 1.9 / KPA, n: 2.2, note: "P50 ≈ 0.25 kPa (about 1.9 mmHg at 10 °C, Weber & Vinogradov 2001): very high affinity for an animal living in low-oxygen burrows. The pCO₂ slider applies the human Bohr coefficient to this curve for illustration only." },
  };
  const hill = (p, P50, n) => { if (p <= 0) return 0; const a = Math.pow(p, n); return a / (Math.pow(P50, n) + a); };
  // P50 at a given pCO2: the Bohr shift is applied to every curve except those flagged bohr: false (myoglobin).
  const p50At = (v, pco2 = 5.3) => hb[v].bohr === false ? hb[v].P50 : bohrP50(hb[v].P50, pco2);
  const sat = (p, v = "adult", pco2 = 5.3) => hill(p, p50At(v, pco2), hb[v].n);
  // Bohr effect (illustrative model). Carbon dioxide lowers blood pH (carbonic acid), and P50 rises with falling pH with a
  // Bohr coefficient Δlog10(P50)/ΔpH ≈ −0.48 for human blood (standard value). pH is linked to pCO2 by an in-vivo
  // approximation of about −0.008 pH units per mmHg rise in pCO2 from the reference 5.3 kPa (40 mmHg). The direct
  // carbamino effect of CO2 on haemoglobin is folded into the same shift. Valid range used: pCO2 2–12 kPa.
  const bohrP50 = (P50ref, pco2 = 5.3) => { const dpH = -0.008 * (pco2 - 5.3) * KPA; return P50ref * Math.pow(10, -0.48 * dpH); };
  // ---- Ventilation (illustrative model of a quiet breath at rest) ----
  // Tidal volume 0.5 dm3 on a resting lung volume of 2.4 dm3 (functional residual capacity); thoracic volume follows a
  // raised cosine over a 4 s cycle (2 s inspiration, 2 s expiration). Alveolar pressure relative to atmosphere is
  // proportional to −(rate of volume change) (airway resistance), peaking near −0.1 kPa during inspiration and +0.1 kPa
  // during expiration; at the instants of zero flow the pressure equals atmospheric. Values follow West's textbook ranges.
  const breath = (t, { period = 4, tidal = 0.5, frc = 2.4 } = {}) => { const ph = ((t % period) + period) % period / period; const vol = frc + tidal * (1 - Math.cos(2 * Math.PI * ph)) / 2; const flow = tidal * Math.PI * Math.sin(2 * Math.PI * ph) / period; const dP = -0.1 * flow / (tidal * Math.PI / period); return { phase: ph < 0.5 ? "inspiration" : "expiration", vol: +vol.toFixed(3), flow: +flow.toFixed(3), dP: +dP.toFixed(3) }; };
  // ---- Fick's law for comparison tasks: rate ∝ area × difference / thickness (relative units) ----
  const fick = (area, diff, thick) => (area * diff) / thick;
  B.gasxModel = { shapes, ratio, hb, hill, sat, bohrP50, p50At, breath, fick, KPA, range: (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n) };

  // ================= ARTWORK =================
  // ---- Isometric cube for SA:V (edge length in model units, drawn at scale px per unit) ----
  const isoCube = (cx, cy, L, scale, col = MINT, stroke = TEAL, label = "") => { const s = L * scale, dx = s * 0.866, dy = s * 0.5; const top = `M${cx} ${cy - s} l${dx} ${dy} l${-dx} ${dy} l${-dx} ${-dy}z`; const left = `M${cx - dx} ${cy - s + dy} l${dx} ${dy} v${s} l${-dx} ${-dy}z`; const right = `M${cx + dx} ${cy - s + dy} l${-dx} ${dy} v${s} l${dx} ${-dy}z`; return `<g><path d="${left}" fill="${col}" stroke="${stroke}" stroke-width="1.5"/><path d="${right}" fill="${col}" opacity=".75" stroke="${stroke}" stroke-width="1.5"/><path d="${top}" fill="#fff" stroke="${stroke}" stroke-width="1.5"/>${label ? T(cx, cy + dy + s + 16, label, { s: 11, w: 600 }) : ""}</g>`; };
  const savSeries = () => { let s = `<svg viewBox="0 0 760 300" width="760" role="img" aria-label="three cubes of side 1, 2 and 4 units with their surface area, volume and surface area to volume ratio">`; [[1, 120], [2, 330], [4, 600]].forEach(([Lc, x]) => { const sh = shapes.cube(Lc); s += isoCube(x, 196 - Lc * 20, Lc, 20, MINT, TEAL) + T(x, 210, `side ${Lc}`, { s: 12, w: 700 }) + T(x, 228, `surface area ${sh.sa} units²`, { s: 12.5, c: GREY }) + T(x, 244, `volume ${sh.vol} ${sh.vol === 1 ? "unit³" : "units³"}`, { s: 12.5, c: GREY }) + T(x, 264, `SA : V = ${ratio(sh).toFixed(1)} : 1`, { s: 12, w: 700, c: NAVY }); }); s += T(380, 24, "Doubling the side multiplies surface area by 4 but volume by 8, so SA : V halves", { s: 12, w: 600 }) + T(380, 290, "Model cubes. The same rule applies to any shape that grows without changing shape: SA ∝ L², V ∝ L³, SA : V ∝ 1/L.", { s: 12, c: GREY }); return s + "</svg>"; };
  const shapeEffect = () => { let s = `<svg viewBox="0 0 760 290" width="760" role="img" aria-label="a cube and a flat sheet of the same volume, showing the sheet has a much larger surface area">`; const cube = shapes.cube(4), sheet = shapes.cuboid(16, 8, 0.5); s += isoCube(150, 130, 4, 24, MINT, TEAL) + T(150, 248, "cube 4 × 4 × 4", { s: 12, w: 700 }) + T(150, 264, `SA ${cube.sa} · V ${cube.vol} · SA : V ${ratio(cube).toFixed(2)}`, { s: 12.5, c: GREY }); const sx = 420, sy = 120; s += `<path d="M${sx} ${sy} l160 0 l80 40 l-160 0z" fill="${MINT}" stroke="${TEAL}" stroke-width="1.5"/><path d="M${sx} ${sy} l0 6 l160 0 l0 -6z" fill="${TEAL}" opacity=".5"/><path d="M${sx + 160} ${sy} l0 6 l80 40 l0 -6z" fill="${TEAL}" opacity=".35"/>` + T(540, 248, "sheet 16 × 8 × 0.5 (same volume, 64)", { s: 12, w: 700 }) + T(540, 264, `SA ${sheet.sa} · V ${sheet.vol} · SA : V ${ratio(sheet).toFixed(2)}`, { s: 12.5, c: GREY }); s += T(380, 24, "Same volume, different shape: flattening or folding raises SA : V", { s: 12, w: 600 }) + T(380, 284, "This is why flatworms are flat, leaves are thin, and gills, lungs and intestines are folded.", { s: 12, c: GREY }); return s + "</svg>"; };

  // ---- Single-celled organism: exchange across the whole body surface ----
  const singleCell = () => { uid(); let s = `<svg viewBox="0 0 760 260" width="760" role="img" aria-label="a single-celled organism exchanging oxygen and carbon dioxide across its whole surface"><defs>${marker("sc-in", NAVY)}${marker("sc-out", ROSE)}</defs>`; s += `<rect x="0" y="0" width="760" height="260" fill="#eef6fb"/>` + T(80, 24, "water", { s: 11, c: GREY }); s += `<path d="M300 130 c-10 -60 60 -90 120 -70 c60 20 90 70 60 110 c-30 40 -110 50 -150 20 c-25 -18 -35 -35 -30 -60z" fill="#f3e6b8" stroke="#9c7b3a" stroke-width="2.5"/><circle cx="390" cy="135" r="22" fill="#e4ebf5" stroke="${NAVY}" stroke-width="1.5"/><circle cx="340" cy="160" r="8" fill="#fff" stroke="${GREY}"/><circle cx="440" cy="110" r="6" fill="#fff" stroke="${GREY}"/>` + T(390, 139, "nucleus", { s: 9, c: NAVY }); [[250, 90, 300, 112], [250, 170, 300, 160], [470, 60, 440, 90], [520, 200, 470, 180]].forEach(([x1, y1, x2, y2]) => { s += L(x1, y1, x2, y2, { c: NAVY, w: 2.5, m: "sc-in" }); }); s += T(228, 86, "O₂", { s: 12, w: 700, c: NAVY }) + T(228, 174, "O₂", { s: 12, w: 700, c: NAVY }) + T(480, 54, "O₂", { s: 12, w: 700, c: NAVY }) + T(532, 206, "O₂", { s: 12, w: 700, c: NAVY }); [[330, 90, 290, 50], [460, 170, 520, 130]].forEach(([x1, y1, x2, y2]) => { s += L(x1, y1, x2, y2, { c: ROSE, w: 2.5, m: "sc-out" }); }); s += T(282, 42, "CO₂", { s: 12, w: 700, c: ROSE }) + T(534, 126, "CO₂", { s: 12, w: 700, c: ROSE }); s += T(380, 232, "Large SA : V, every part of the cytoplasm close to the surface: diffusion alone is fast enough.", { s: 11, c: GREY }) + T(380, 248, "No specialised exchange surface, no transport system. Schematic cell; the surface is the cell-surface membrane.", { s: 10, c: GREY }); return s + "</svg>"; };

  // ---- Insect tracheal system ----
  const insectTracheal = () => { uid(); let s = `<svg viewBox="-22 0 782 330" width="782" role="img" aria-label="section through an insect showing spiracles, tracheae, tracheoles and a muscle fibre"><defs>${marker("it-o2", NAVY)}${marker("it-co2", ROSE)}</defs>`; s += `<rect x="60" y="60" width="640" height="220" rx="60" fill="#f6efd9" stroke="#9c7b3a" stroke-width="3"/>` + T(380, 48, "insect body (section through the abdomen)", { s: 12, c: GREY }) + T(380, 302, "air outside", { s: 12, c: GREY }); // spiracles on the left body wall
    [[60, 120], [60, 200]].forEach(([x, y], i) => { s += `<g data-part="spiracle"><rect x="${x - 8}" y="${y - 12}" width="16" height="24" rx="4" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M${x - 4} ${y - 8} l8 16 M${x + 4} ${y - 8} l-8 16" stroke="${INK}" stroke-width="1.2"/></g>`; }); s += T(16, 160, "spiracles", { s: 12, w: 700 }) + T(16, 176, "(valves)", { s: 12, c: GREY });
    // longitudinal trachea + branches with chitin rings
    const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#8a97a3" stroke-width="1"/>`;
    s += `<g data-part="trachea"><path d="M68 120 h40 q20 0 30 20 v60 q0 20 -20 20 h-30" fill="none" stroke="#5a7d96" stroke-width="12" stroke-linecap="round"/><path d="M68 120 h40 q20 0 30 20 v60 q0 20 -20 20 h-30" fill="none" stroke="#dbe9f3" stroke-width="7" stroke-linecap="round"/><path d="M138 160 h180" stroke="#5a7d96" stroke-width="12" stroke-linecap="round"/><path d="M138 160 h180" stroke="#dbe9f3" stroke-width="7" stroke-linecap="round"/>${[150, 175, 200, 225, 250, 275, 300].map((x) => `<line x1="${x}" y1="154" x2="${x}" y2="166" stroke="#5a7d96" stroke-width="1.5"/>`).join("")}</g>`;
    s += T(196, 186, "trachea (chitin rings", { s: 12, w: 700, a: "start" }) + T(196, 201, "keep it open)", { s: 12, w: 700, a: "start" });
    // muscle fibres, then the tracheoles drawn over them (release review 2026-11-15): one tracheole runs to every fibre and
    // continues between and into the fibres, ending in fluid (pale blue tips), so they reach every cell as the label says.
    s += `<g data-part="muscle">${[0, 1, 2, 3, 4].map((i) => `<rect x="505" y="${96 + i * 26}" width="165" height="18" rx="6" fill="#efc9c9" stroke="${ROSE}" stroke-width="1.5"/><path d="M515 ${105 + i * 26} h145" stroke="${ROSE}" stroke-width=".8" stroke-dasharray="6 4"/>`).join("")}</g>` + T(588, 246, "muscle fibres (respiring cells)", { s: 12, w: 700, c: ROSE });
    s += `<g data-part="tracheole">${[0, 1, 2, 3, 4].map((i) => { const y = 105 + i * 26, x2 = 500; const d = `M318 160 C ${400} 160, ${430} ${y}, ${x2} ${y}`; return `<path d="${d}" fill="none" stroke="#5a7d96" stroke-width="3.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#dbe9f3" stroke-width="1.6" stroke-linecap="round"/><path d="M${x2} ${y} H${560 + (i % 2) * 24}" stroke="#5a7d96" stroke-width="2" stroke-linecap="round"/><path d="M${560 + (i % 2) * 24} ${y} h18" stroke="#4fa3d9" stroke-width="3.2" stroke-linecap="round"/>`; }).join("")}</g>`;
    s += T(380, 82, "tracheoles: very fine, no chitin, ending in fluid (blue); they reach every cell", { s: 12, w: 700 });
    s += T(588, 264, "O₂ in, CO₂ out by diffusion", { s: 12, c: NAVY });
    s += T(380, 322, "Gases diffuse along the tubes straight to the cells; blood is not involved. Not to scale.", { s: 12, c: GREY }); return s + "</svg>"; };

  // ---- Dicot leaf section ----
  const leafSection = ({ stomaOpen = true, width = 760 } = {}) => { uid(); let s = `<svg viewBox="0 0 760 340" width="${width}" role="img" aria-label="transverse section of a dicotyledonous leaf"><defs>${marker("lf-co2", NAVY)}${marker("lf-o2", ROSE)}${marker("lf-h2o", "#5a7d96")}</defs>`; const cell = (x, y, w, h, fill, stroke = SAGE, rx = 6, part = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"${part ? ` data-part="${part}"` : ""}/>`; s += T(380, 22, "upper surface", { s: 12, c: GREY });
    s += `<g data-part="cuticle"><rect x="80" y="40" width="600" height="6" fill="#e9d49a" stroke="#b89a4c"/></g><g data-part="upper-epidermis">${Array.from({ length: 12 }, (_, i) => cell(80 + i * 50, 46, 50, 22, "#eef5f1", SAGE, 4)).join("")}</g>`;
    s += `<g data-part="palisade">${Array.from({ length: 11 }, (_, i) => cell(84 + i * 54, 72, 32, 90, "#bfe0c9", SAGE, 8) + Array.from({ length: 6 }, (_, k) => `<ellipse cx="${92 + i * 54 + (k % 2) * 14}" cy="${84 + k * 13}" rx="5" ry="3.5" fill="#4f8f5a"/>`).join("")).join("")}</g>`;
    const spongy = [[90, 172, 42, 30], [150, 178, 46, 28], [215, 170, 40, 34], [280, 180, 48, 26], [350, 172, 42, 32], [420, 178, 44, 28], [490, 170, 40, 32], [560, 180, 46, 26], [625, 172, 42, 30], [110, 215, 44, 28], [200, 222, 46, 26], [300, 218, 42, 30], [400, 224, 44, 26], [520, 218, 42, 30], [610, 222, 46, 26]];
    s += `<g data-part="spongy">${spongy.map(([x, y, w, h]) => cell(x, y, w, h, "#d6efd9", SAGE, 12) + `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="6" ry="4" fill="#4f8f5a"/>`).join("")}</g><g data-part="air-space">${[[482, 236]].map(([x, y]) => T(x, y, "air space", { s: 12, c: GREY })).join("")}</g>`;
    // vascular bundle (xylem above phloem in a dicot leaf)
    s += `<g data-part="vascular"><ellipse cx="380" cy="208" rx="46" ry="34" fill="#fbf0d8" stroke="${AMBER}" stroke-width="1.5"/><g>${[366, 380, 394].map((x) => `<circle cx="${x}" cy="196" r="7" fill="#f6d3c6" stroke="${ROSE}"/>`).join("")}</g><g>${[362, 374, 386, 398].map((x) => `<circle cx="${x}" cy="222" r="5" fill="#d6efec" stroke="${TEAL}"/>`).join("")}</g>${T(380, 185, "xylem", { s: 11.5, c: ROSE, w: 700 })}${T(380, 239.5, "phloem", { s: 11.5, c: TEAL, w: 700 })}</g>`;
    // two stomata, each centred in a gap left by one missing epidermal cell (cells 3 and 8), below a gap in the spongy
    // mesophyll so that each pore opens into a sub-stomatal air space
    const stomaX = [255, 505];
    s += `<g data-part="air-space">${stomaX.map((x) => `<path d="M${x - 9} 262 C${x - 22} 256 ${x - 18} 244 ${x - 6} 242 L${x + 8} 242 C${x + 20} 244 ${x + 22} 256 ${x + 9} 262z" fill="#eef6fb" stroke="#9fb9cc" stroke-width="1" stroke-dasharray="3 2"/>`).join("")}</g>`;
    s += `<g data-part="lower-epidermis">${Array.from({ length: 12 }, (_, i) => (i === 3 || i === 8) ? "" : cell(80 + i * 50, 262, 50, 22, "#eef5f1", SAGE, 4)).join("")}</g>`;
    s += `<rect x="80" y="284" width="600" height="4" fill="#e9d49a" stroke="#b89a4c"/>` + T(150, 304, "lower surface", { s: 12, c: GREY });
    stomaX.forEach((x) => { const gap = stomaOpen ? 12 : 2; s += `<g data-part="stoma"><rect x="${x - gap / 2 - 2}" y="262" width="${gap + 4}" height="27" fill="#fff" stroke="none"/></g><g data-part="guard-cell"><ellipse cx="${x - 10 - gap / 2}" cy="273" rx="10" ry="11" fill="#bfe0c9" stroke="#2f6f3f" stroke-width="2"/><ellipse cx="${x + 10 + gap / 2}" cy="273" rx="10" ry="11" fill="#bfe0c9" stroke="#2f6f3f" stroke-width="2"/><ellipse cx="${x - 10 - gap / 2}" cy="273" rx="4" ry="3" fill="#4f8f5a"/><ellipse cx="${x + 10 + gap / 2}" cy="273" rx="4" ry="3" fill="#4f8f5a"/></g>`; });
    if (stomaOpen) { s += L(255, 320, 255, 250, { c: NAVY, w: 2.5, m: "lf-co2" }) + T(240, 322, "CO₂ in", { s: 12, w: 700, c: NAVY, a: "end" }) + L(513, 292, 513, 320, { c: ROSE, w: 2.5, m: "lf-o2" }) + T(522, 322, "O₂ out", { s: 12, w: 700, c: ROSE, a: "start" }) + L(497, 292, 497, 320, { c: "#5a7d96", w: 2, m: "lf-h2o" }) + T(488, 322, "H₂O vapour out", { s: 12, c: "#5a7d96", a: "end" }) + T(298, 256, "sub-stomatal air space", { s: 10.5, c: GREY, a: "start" }); }
    // tissue names right-aligned against the tissue they name (readability pass: they can then be drawn larger into the
    // free margin on the left without running into the cells)
    const tl = (y, w) => T(76, y, w, { s: 12, c: GREY, a: "end" });
    s += tl(43, "cuticle") + tl(59, "upper") + tl(71, "epidermis") + tl(117, "palisade") + tl(129, "mesophyll") + tl(205, "spongy") + tl(217, "mesophyll") + tl(275, "lower") + tl(287, "epidermis") + L(519, 272, 676, 280, { c: GREY, w: 1 }) + `<circle cx="519" cy="272" r="2.4" fill="${INK}"/>` + T(680, 276, "guard cells", { s: 12, c: "#2f6f3f", a: "start", w: 700 }) + T(680, 291, "and stoma", { s: 12, c: "#2f6f3f", a: "start", w: 700 });
    s += T(380, 336, "Not to scale. Gases diffuse through the stomata and air spaces to the moist mesophyll cell walls.", { s: 12, c: GREY }); return s + "</svg>"; };

  // ---- Xerophytic leaf: marram grass (Ammophila) in transverse section ----
  // Release review 2026-11-15: redrawn as a standard marram section: the leaf is rolled with its upper surface inside;
  // that inner surface has ridges and grooves, with stomata sunk in the grooves among hairs and hinge cells at the base of
  // the grooves; the outer (lower) surface has a thick waxy cuticle and no stomata. Every label has a leader line.
  const xerophyteLeaf = () => { uid(); const cx = 250, cy = 195; const P = (r, d) => [cx + r * Math.cos(d * Math.PI / 180), cy + r * Math.sin(d * Math.PI / 180)];
    const t0 = 280, t1 = 620, rOut = 150, rIn = (d) => 88 - 22 * Math.cos(((d - t0) / 40) * 2 * Math.PI); const f = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
    const N = 160, inner = Array.from({ length: N + 1 }, (_, k) => t0 + ((t1 - t0) * k) / N);
    let s = `<svg viewBox="0 0 760 390" width="760" role="img" aria-label="transverse section of a rolled marram grass leaf with a thick cuticle outside, ridges and grooves inside, sunken stomata, hairs and hinge cells">`;
    // leaf tissue: outer arc then the ridged inner surface back again
    s += `<path d="M${f(P(rOut, t0))} A${rOut} ${rOut} 0 1 1 ${f(P(rOut, t1))} ${inner.slice().reverse().map((d) => "L" + f(P(rIn(d), d))).join(" ")} Z" fill="#d6efd9" stroke="${SAGE}" stroke-width="2"/>`;
    s += `<path d="M${f(P(rOut + 4, t0 + 1))} A${rOut + 4} ${rOut + 4} 0 1 1 ${f(P(rOut + 4, t1 - 1))}" fill="none" stroke="#d4b25a" stroke-width="8"/>`; // thick cuticle
    const grooves = [300, 340, 380, 420, 460, 500, 540, 580];
    grooves.forEach((g, i) => { // hinge cells at the base of each groove, stomata on the groove walls, hairs into the groove
      [-5, 0, 5].forEach((dd) => { const [x, y] = P(rIn(g) + 9, g + dd); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="#f4fbf4" stroke="${SAGE}" stroke-width="1.2"/>`; });
      [-11, 11].forEach((dd) => { const [x, y] = P(rIn(g + dd) + 2, g + dd); s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="2.4" fill="#2f6f3f" transform="rotate(${g + dd} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; });
      [-15, -7, 7, 15].forEach((dd) => { const a1 = P(rIn(g + dd) - 1, g + dd), a2 = P(rIn(g + dd) - 13, g + dd * 0.55); s += `<line x1="${a1[0].toFixed(1)}" y1="${a1[1].toFixed(1)}" x2="${a2[0].toFixed(1)}" y2="${a2[1].toFixed(1)}" stroke="#4f7a61" stroke-width="1.4" stroke-linecap="round"/>`; }); });
    // vascular bundles in the ridges
    [320, 360, 400, 440, 480, 520, 560, 600].forEach((d) => { const [x, y] = P(118, d); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#fbf0d8" stroke="${AMBER}" stroke-width="1.2"/>`; });
    s += T(cx, cy - 4, "humid air trapped", { s: 13, c: "#2f78a8", w: 600 }) + T(cx, cy + 13, "inside the rolled leaf", { s: 13, c: "#2f78a8", w: 600 });
    const lab = (pt, tx, ty, lines, col = INK) => `<line x1="${pt[0].toFixed(1)}" y1="${pt[1].toFixed(1)}" x2="${tx - 4}" y2="${ty - 4}" stroke="${GREY}" stroke-width="1"/><circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="2.4" fill="${INK}"/>` + lines.map((l, k) => T(tx, ty + k * 16, l, { s: 13, w: k ? 400 : 700, a: "start", c: k ? GREY : col })).join("");
    s += lab(P(rOut + 6, 318), 470, 40, ["thick waxy cuticle", "on the outer (lower) surface;", "no stomata here"], "#9a7a20");
    s += lab(P(rIn(329) + 2, 329), 470, 112, ["stoma sunk in a groove", "on the inner (upper) surface"], "#2f6f3f");
    s += lab(P(rIn(347) - 8, 344), 470, 164, ["hairs trap still,", "moist air in the groove"], "#4f7a61");
    s += lab(P(rIn(360) + 1, 360), 470, 214, ["ridge"], INK);
    s += lab(P(rIn(380) + 9, 380), 470, 252, ["hinge cells: lose turgor in", "dry air and roll the leaf tighter"], SAGE);
    s += T(cx, 378, "Rolled marram grass leaf in section, not to scale.", { s: 12, c: GREY });
    return s + "</svg>"; };

  // ---- Human gas exchange system (gross structure limited to the specification list) ----
  const humanSystem = () => { let s = `<svg viewBox="0 30 760 382" width="760" role="img" aria-label="gross structure of the human gas exchange system: trachea, bronchi, bronchioles, lungs and alveoli">`; // lungs
    s += `<g data-part="lungs"><path d="M330 150 c-60 10 -120 80 -120 170 c0 60 30 80 70 80 c50 0 80 -30 80 -80 v-150 c0 -20 -10 -22 -30 -20z" fill="#f6d3c6" stroke="${ROSE}" stroke-width="2.5"/><path d="M430 150 c60 10 120 80 120 170 c0 60 -30 80 -70 80 c-50 0 -80 -30 -80 -80 v-150 c0 -20 10 -22 30 -20z" fill="#f6d3c6" stroke="${ROSE}" stroke-width="2.5"/></g>`;
    // trachea with C-shaped cartilage rings
    s += `<g data-part="trachea"><rect x="368" y="40" width="24" height="120" rx="6" fill="#fff" stroke="${INK}" stroke-width="2"/>${[50, 64, 78, 92, 106, 120, 134, 148].map((y) => `<path d="M370 ${y} a12 6 0 0 0 20 0" fill="none" stroke="${GREY}" stroke-width="2"/>`).join("")}</g>`;
    // bronchi
    s += `<g data-part="bronchi"><path d="M372 160 q-15 40 -67 65" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M372 160 q-15 40 -67 65" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M388 160 q15 40 67 65" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M388 160 q15 40 67 65" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>`;
    // bronchioles: branching
    const br = (x, y, dir) => [[0, 40, -28, 70], [0, 40, 28, 70], [-28, 70, -46, 100], [-28, 70, -18, 110], [28, 70, 46, 100], [28, 70, 18, 110]].map(([ax, ay, bx, by]) => `<line x1="${x + ax * dir}" y1="${y + ay}" x2="${x + bx * dir}" y2="${y + by}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`).join("") + `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 40}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    s += `<g data-part="bronchioles">${br(305, 225, 1)}${br(455, 225, -1)}</g>`;
    // alveoli clusters at the ends
    const cluster = (x, y) => `<g>${[[0, 0], [10, -8], [-10, -8], [8, 9], [-8, 9]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="6" fill="#fff" stroke="${TEAL}" stroke-width="1.5"/>`).join("")}</g>`;
    s += `<g data-part="alveoli">${[[259, 334], [287, 344], [351, 334], [323, 344], [501, 334], [473, 344], [409, 334], [437, 344]].map(([x, y]) => cluster(x, y)).join("")}</g>`;
    // labels
    const lab = (x, y, tx, ty, t, part, a = "start") => `<g data-label="${part}">${L(x, y, tx, ty, { c: GREY, w: 1 })}${T(tx + (a === "start" ? 4 : -4), ty + 4, t, { s: 11.5, w: 700, a })}</g>`;
    s += lab(392, 90, 470, 70, "trachea (C-shaped cartilage rings)", "trachea") + lab(412, 196, 500, 160, "bronchus (one per lung; cartilage)", "bronchi") + lab(483, 295, 570, 270, "bronchioles (no cartilage)", "bronchioles") + lab(507, 340, 590, 360, "alveoli (air sacs)", "alveoli") + lab(250, 230, 150, 210, "lung", "lungs", "end");
    return s + "</svg>"; };

  // ---- One alveolus with its capillary ----
  // Release review 2026-11-15: the capillary wall (endothelium) is drawn as a thin layer that touches the alveolar wall;
  // the two-cell diffusion pathway is marked at the contact point and named with a leader line; blood flow has an arrow;
  // gas labels sit in clear space; text 12 to 13 px.
  const alveolus = () => { uid(); const xl = (y) => 426 + 0.0021 * (y - 180) * (y - 180), TW = 34; const ys = Array.from({ length: 31 }, (_, k) => 30 + k * 10);
    const left = ys.map((y) => [xl(y), y]), right = ys.map((y) => [xl(y) + TW, y]); const pl = (pts) => pts.map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y}`).join(" ");
    let s = `<svg viewBox="0 0 760 360" width="760" role="img" aria-label="an alveolus with its wall of squamous epithelium, a capillary whose thin wall touches it, red blood cells and the directions of diffusion of oxygen and carbon dioxide"><defs>${marker("al-o2", NAVY)}${marker("al-co2", ROSE)}${marker("al-bf", "#9a3b3a")}</defs>`;
    s += `<g data-part="air-space"><circle cx="300" cy="180" r="120" fill="#f7fbff"/></g><g data-part="epithelium"><circle cx="300" cy="180" r="120" fill="none" stroke="#e9d49a" stroke-width="9"/><circle cx="300" cy="180" r="115.5" fill="none" stroke="#b89a4c" stroke-width="1"/><circle cx="300" cy="180" r="124.5" fill="none" stroke="#b89a4c" stroke-width="1"/>${[200, 110, 290, 20].map((a) => `<ellipse cx="${300 + 120 * Math.cos(a * Math.PI / 180)}" cy="${180 + 120 * Math.sin(a * Math.PI / 180)}" rx="7" ry="3.5" fill="#9c7b3a" transform="rotate(${a + 90} ${300 + 120 * Math.cos(a * Math.PI / 180)} ${180 + 120 * Math.sin(a * Math.PI / 180)})"/>`).join("")}</g>`;
    s += T(290, 140, "alveolar air space", { s: 13, w: 700 }) + T(290, 162, "pO₂ high (about 13 kPa)", { s: 12, c: NAVY }) + T(290, 180, "pCO₂ low (about 5 kPa)", { s: 12, c: ROSE }) + T(252, 280, "moist lining", { s: 12, c: GREY, a: "start" }) + L(248, 276, 220, 259, { c: GREY, w: 1 }) + `<circle cx="220" cy="259" r="2.2" fill="${INK}"/>`;
    // capillary: plasma between two thin endothelial walls; the left wall touches the alveolar wall at y = 180
    s += `<g data-part="capillary"><path d="${pl(left)} ${pl(right.slice().reverse()).replace("M", "L")} Z" fill="#f6dada"/><path d="${pl(left)}" fill="none" stroke="${ROSE}" stroke-width="3.5"/><path d="${pl(right)}" fill="none" stroke="${ROSE}" stroke-width="3.5"/></g>`;
    s += `<g data-part="rbc">${[62, 118, 180, 242, 298].map((y) => `<g transform="translate(${(xl(y) + TW / 2).toFixed(1)} ${y})"><ellipse rx="10" ry="13" fill="#e06d6d" stroke="#b4504f" stroke-width="1.2"/><ellipse rx="4.5" ry="6.5" fill="#ec8e8e"/></g>`).join("")}</g>`;
    // gas movements across the contact region
    s += L(368, 150, 452, 150, { c: NAVY, w: 3, m: "al-o2" }) + T(392, 136, "O₂", { s: 13, w: 700, c: NAVY }) + L(452, 210, 368, 210, { c: ROSE, w: 3, m: "al-co2" }) + T(356, 232, "CO₂", { s: 13, w: 700, c: ROSE });
    // the diffusion pathway: two thin cells at the contact point
    s += `<g data-part="pathway"><rect x="413" y="170" width="20" height="20" rx="3" fill="none" stroke="${NAVY}" stroke-width="2"/><polyline points="423,190 470,204 560,204" fill="none" stroke="${NAVY}" stroke-width="1" pointer-events="none"/>${T(566, 200, "diffusion pathway: two thin cells,", { s: 12, c: NAVY, a: "start", w: 700 })}${T(566, 216, "alveolar epithelium + capillary", { s: 12, c: NAVY, a: "start" })}${T(566, 231, "endothelium (about 0.5–1 µm)", { s: 12, c: NAVY, a: "start" })}</g>`;
    // labels with leaders
    s += L(214, 96, 160, 64, { c: GREY, w: 1 }) + `<circle cx="214" cy="96" r="2.4" fill="${INK}"/>` + T(156, 54, "squamous epithelium", { s: 12.5, w: 700, c: "#9c7b3a", a: "end" }) + T(156, 70, "(one flattened cell thick)", { s: 12, c: GREY, a: "end" });
    s += L(xl(90) + TW, 90, 560, 90, { c: GREY, w: 1 }) + `<circle cx="${(xl(90) + TW).toFixed(1)}" cy="90" r="2.4" fill="${INK}"/>` + T(566, 86, "capillary wall: endothelium", { s: 12.5, w: 700, c: ROSE, a: "start" }) + T(566, 102, "(one cell thick)", { s: 12, c: GREY, a: "start" });
    s += L(xl(298) + TW / 2 + 10, 298, 560, 290, { c: GREY, w: 1 }) + T(566, 294, "red blood cells in single file", { s: 12.5, w: 700, c: ROSE, a: "start" });
    // blood flow
    s += L(536, 226, 536, 270, { c: "#9a3b3a", w: 2.5, m: "al-bf" }) + T(544, 244, "blood", { s: 12, c: "#9a3b3a", a: "start", w: 600 }) + T(544, 259, "flow", { s: 12, c: "#9a3b3a", a: "start", w: 600 });
    s += T(xl(30) + TW / 2, 22, "from pulmonary artery: low O₂", { s: 12, c: GREY }) + T(xl(330) + TW / 2, 350, "to pulmonary vein: high O₂", { s: 12, c: GREY });
    return s + "</svg>"; };

  // ---- Thorax for breathing (release review 2026-11-15: redrawn as a standard front section) ----
  // thorax(f, opts): f is the expansion of the thorax: 1 = end of inspiration, 0 = end of a quiet expiration (resting
  // volume), negative (down to about -0.6) = during or after a forced expiration. opts.move: "in" | "out" | null draws the
  // movement arrows of inspiration or expiration (ribs, diaphragm, air); opts.forced labels the internal intercostals and
  // abdominal muscles as active. The drawing is a coronal (front) section: ribs cut across on each side with intercostal
  // muscles between them, lungs filling the thoracic cavity and the diaphragm as a dome below. intercostalInset() draws two
  // ribs with the external and internal intercostal muscles, whose fibres run in opposite directions.
  const smooth = (pts, closed = false) => { // Catmull-Rom spline through the points, as cubic Bezier segments
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]]; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < P.length - 2; i++) { const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]]; d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; }
    return d + (closed ? "Z" : ""); };
  const thorax = (f = 0, { move = null, forced = false, labels = true } = {}) => { uid();
    const cx = 250, lift = (i) => 9 * f * (0.5 + i / 6), out = 14 * f; // ribs rise (more at the bottom) and move outwards
    const ribY = [128, 166, 204, 240, 274, 306].map((y, i) => y - lift(i)), off = [46, 26, 13, 6, 3, 3];
    const ribs = ribY.map((y, i) => ({ L: [cx - 128 + off[i] - out, y], R: [cx + 128 - off[i] + out, y] }));
    const base = ribY[5] + 22, peak = 262 + 38 * f; // dome peak: lower and flatter on inspiration, higher in forced expiration
    const dL = [ribs[5].L[0] + 6, base], dR = [ribs[5].R[0] - 6, base], cy = (4 * peak - base) / 3; // cubic control height giving that peak
    const dia = (t) => { const c1 = [dL[0] + 50, cy], c2 = [dR[0] - 50, cy]; const u = 1 - t; return [u * u * u * dL[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * dR[0], u * u * u * dL[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * dR[1]]; };
    const diaPts = Array.from({ length: 41 }, (_, k) => dia(k / 40));
    // Each lung: apex, down the inside of the ribs, along the top of the diaphragm (outer to inner), up the mediastinum.
    // The patient's left lung (drawn on the right) has a cardiac notch where the heart sits.
    const lung = (side) => { const s = side === "L" ? -1 : 1; const outer = ribs.slice(1).map((r) => [r[side][0] - s * 15, r[side][1]]);
      const innerBase = side === "L" ? cx - 26 : cx + 74; const along = diaPts.filter(([x]) => side === "L" ? x > outer[4][0] + 4 && x < innerBase : x < outer[4][0] - 4 && x > innerBase).map(([x, y]) => [x, y - 4]);
      const baseP = side === "L" ? along : along.reverse(); const hb = diaPts[22][1] - 4, yEnd = baseP.length ? baseP[baseP.length - 1][1] : hb;
      const med = side === "L" ? [[cx - 25, Math.min(yEnd - 14, ribY[4])], [cx - 22, ribY[2]], [cx - 24, ribY[1] - 6]] : [[cx + 64, Math.min(yEnd - 14, hb - 26)], [cx + 40, hb - 62], [cx + 26, Math.min(ribY[2], hb - 80)], [cx + 24, ribY[1] - 6]];
      const pts = [[cx + s * 50, 92 - 4 * f], [cx + s * 82, 108 - 5 * f], ...outer, ...baseP, ...med, [cx + s * 30, 108 - 4 * f]];
      return smooth(pts, true); };
    let s = `<svg viewBox="-45 14 560 376" width="560" role="img" aria-label="front section through the thorax showing the trachea, lungs, ribs with intercostal muscles and the diaphragm${move === "in" ? " during inspiration" : move === "out" ? " during expiration" : ""}"><defs>${marker("th-a", NAVY)}${marker("th-r", ROSE)}${marker("th-t", TEAL)}${marker("th-k", "#5a7d96")}</defs>`;
    // body wall (skin and muscle) around the rib cage, and the abdomen below the diaphragm
    const wall = (side) => { const s2 = side === "L" ? -1 : 1; return ribs.map((r) => [r[side][0] + s2 * 16, r[side][1]]); };
    s += `<path d="${smooth([[cx - 40, 30], [cx - 62, 70], ...wall("L"), [ribs[5].L[0] - 12, 386], [ribs[5].R[0] + 12, 386], ...wall("R").reverse(), [cx + 62, 70], [cx + 40, 30]])}" fill="#fbf4ef" stroke="#c9b7a8" stroke-width="2"/>`;
    s += `<path d="M${dL[0]} ${base} ${diaPts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} L${ribs[5].R[0] + 10} 384 L${ribs[5].L[0] - 10} 384Z" fill="#f2e8dc"/>`;
    s += T(cx, 380, "abdomen", { s: 15, c: GREY });
    // lungs (fill the thoracic cavity) and the heart between them
    // round 2 (V1-N5): the lungs are clipped to the space above the diaphragm, so their bases always sit on the dome
    const clipId = "th-clip" + U; const above = `M-45 0 H515 V${dR[1]} ${diaPts.slice().reverse().map(([x, y2]) => `L${x.toFixed(1)} ${(y2 - 4).toFixed(1)}`).join(" ")} L${dL[0]} ${dL[1]} H-45 Z`;
    s += `<defs><clipPath id="${clipId}"><path d="${above}"/></clipPath></defs><g data-part="lungs" clip-path="url(#${clipId})"><path d="${lung("L")}" fill="#f6d3c6" stroke="${ROSE}" stroke-width="2"/><path d="${lung("R")}" fill="#f6d3c6" stroke="${ROSE}" stroke-width="2"/></g>`;
    { const hb = diaPts[22][1] - 4; s += `<path d="M${cx - 20} ${hb} C${cx - 30} ${hb - 30} ${cx - 16} ${hb - 66} ${cx + 10} ${hb - 66} C${cx + 40} ${hb - 66} ${cx + 70} ${hb - 30} ${cx + 66} ${hb - 4} Z" fill="#f1b9b9" stroke="#c97c7c" stroke-width="1.5"/>`; }
    // trachea with cartilage rings, and the two bronchi
    s += `<g data-part="trachea"><rect x="${cx - 9}" y="20" width="18" height="84" rx="5" fill="#fff" stroke="${INK}" stroke-width="2"/>${[30, 42, 54, 66, 78, 90].map((y) => `<line x1="${cx - 8}" y1="${y}" x2="${cx + 8}" y2="${y}" stroke="#9aa5ad" stroke-width="2"/>`).join("")}<path d="M${cx - 5} 102 q-12 22 -52 ${48 - 3 * f} M${cx + 5} 102 q12 22 52 ${48 - 3 * f}" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M${cx - 5} 102 q-12 22 -52 ${48 - 3 * f} M${cx + 5} 102 q12 22 52 ${48 - 3 * f}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g>`;
    // intercostal muscles between neighbouring ribs, then the ribs (cut across) on top
    s += `<g data-part="intercostal">${["L", "R"].map((sd) => ribs.slice(0, 5).map((r, i) => `<path d="M${r[sd][0]} ${r[sd][1] + 6} L${ribs[i + 1][sd][0]} ${ribs[i + 1][sd][1] - 6}" stroke="${move === "in" ? ROSE : forced && move === "out" ? AMBER : "#cfa9a4"}" stroke-width="9" stroke-linecap="round" opacity=".85"/>`).join("")).join("")}</g>`;
    s += `<g data-part="ribs">${ribs.map((r) => ["L", "R"].map((sd) => `<ellipse cx="${r[sd][0]}" cy="${r[sd][1]}" rx="9" ry="7" fill="#efe9dc" stroke="#7d7465" stroke-width="2"/>`).join("")).join("")}</g>`;
    // diaphragm
    s += `<g data-part="diaphragm"><path d="${smooth(diaPts.filter((_, k) => k % 4 === 0))}" fill="none" stroke="${TEAL}" stroke-width="7" stroke-linecap="round"/></g>`;
    // movement arrows
    if (move) { const inn = move === "in";
      s += L(cx - 30, inn ? 22 : 66, cx - 30, inn ? 64 : 24, { c: "#5a7d96", w: 3, m: "th-k" }) + T(cx - 48, 46, inn ? "air in" : "air out", { s: 15, w: 700, c: "#5a7d96", a: "end" });
      [1, 4].forEach((i) => ["L", "R"].forEach((sd) => { const [x, y] = ribs[i][sd], sg = sd === "L" ? -1 : 1; s += inn ? L(x + sg * 14, y + 6, x + sg * 36, y - 18, { c: ROSE, w: 2.5, m: "th-r" }) : L(x + sg * 36, y - 14, x + sg * 16, y + 8, { c: ROSE, w: 2.5, m: "th-r" }); }));
      const dy = diaPts[20][1]; s += inn ? L(cx, dy + 6, cx, dy + 34, { c: TEAL, w: 3, m: "th-t" }) : L(cx, dy + 36, cx, dy + 8, { c: TEAL, w: 3, m: "th-t" }); }
    if (labels) { // leader lines end on the structure they name; text at 13 px
      const lab = (x, y, tx, ty, t, a) => `${L(x, y, tx, ty, { c: GREY, w: 1 })}<circle cx="${x}" cy="${y}" r="2.4" fill="${INK}"/>${T(tx + (a === "end" ? -4 : 4), ty + 4, t, { s: 15, w: 600, a })}`;
      s += lab(cx + 9, 40, cx + 110, 40, "trachea", "start");
      s += lab(ribs[0].L[0] - 8, ribs[0].L[1] - 3, 88, 96, "rib (cut across)", "end");
      s += lab((ribs[2].L[0] + ribs[3].L[0]) / 2 - 5, (ribs[2].L[1] + ribs[3].L[1]) / 2, 88, 214, "intercostal", "end") + T(84, 234, "muscles", { s: 15, w: 600, a: "end" });
      s += lab(cx - 70, ribY[2] + 10, 88, 300, "lung", "end");
      s += lab(dR[0] - 40, dia(0.85)[1], cx + 178, 352, "diaphragm", "start");
      s += lab(cx + 30, diaPts[22][1] - 30, cx + 178, 290, "heart", "start"); }
    return s + "</svg>"; };

  const intercostalInset = () => { let s = `<svg viewBox="0 0 560 128" width="560" role="img" aria-label="two ribs with the external intercostal muscles in the outer layer and the internal intercostal muscles in the inner layer, their fibres running in opposite directions">`;
    s += `<rect x="12" y="10" width="160" height="15" rx="7" fill="#efe9dc" stroke="#7d7465" stroke-width="2"/><rect x="12" y="102" width="160" height="15" rx="7" fill="#efe9dc" stroke="#7d7465" stroke-width="2"/>`;
    for (let k = 0; k < 6; k++) { const x0 = 26 + k * 26; s += `<line x1="${x0 + 9}" y1="28" x2="${x0 - 7}" y2="99" stroke="${AMBER}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`; }
    for (let k = 0; k < 6; k++) { const x0 = 26 + k * 26; s += `<line x1="${x0 - 7}" y1="28" x2="${x0 + 9}" y2="99" stroke="${ROSE}" stroke-width="4" stroke-linecap="round"/>`; }
    s += T(186, 20, "Between two ribs: two layers of muscle", { s: 15, w: 700, a: "start" });
    s += T(186, 46, "External intercostals (outer layer):", { s: 15, w: 700, c: ROSE, a: "start" }) + T(186, 63, "contract in inspiration; ribs up and out.", { s: 15, c: ROSE, a: "start" });
    s += T(186, 92, "Internal intercostals (inner layer):", { s: 15, w: 700, c: "#9a6f1e", a: "start" }) + T(186, 109, "contract in forced expiration; ribs down and in.", { s: 15, c: "#9a6f1e", a: "start" });
    return s + "</svg>"; };

  // ---- Dissociation curve graph ----
  const odc = ({ variants = ["adult"], pco2 = 5.3, marks = true, width = 560, height = 320, extraCurves = [] } = {}) => { const xs = B.gasxModel.range(0, 2, 100).concat(B.gasxModel.range(2, 14, 60).slice(1)); const cols = { adult: TEAL, fetal: ROSE, myoglobin: AMBER, llama: SAGE, mouse: NAVY, lugworm: "#7a5aa6" }; const many = variants.length > 1; const curves = variants.map((v, i) => ({ pts: xs.map((x) => ({ x, y: 100 * sat(x, v, pco2) })), color: cols[v] || TEAL, label: hb[v].label.replace(/ \(.*\)/, ""), labelPos: many ? { x: 8.6, y: 46 - i * 8, a: "start" } : { x: 7.5, y: 55, a: "start" } })).concat(extraCurves); const mk = marks ? [{ x: 13, y: 100 * sat(13, variants[0], pco2), label: "lungs (about 13 kPa): loading", dx: -4, dy: 44, a: "end", color: NAVY }, { x: 5, y: 100 * sat(5, variants[0], pco2), label: "respiring tissue (about 5 kPa): unloading", dx: 10, dy: 16, color: ROSE }] : []; return B.enzymeArt.graph({ fs: 12, fixed: true, width, height, xLabel: "partial pressure of oxygen, pO₂ / kPa", yLabel: "saturation of haemoglobin with O₂ / %", xmax: 14, ymax: 100, xticks: 7, yticks: 5, curves, marks: mk, aria: "oxygen haemoglobin dissociation curve: percentage saturation against partial pressure of oxygen", extra: many ? ({ X, Y }) => variants.map((v, i) => `<line x1="${X(8.0)}" x2="${X(8.4)}" y1="${Y(46 - i * 8) - 4}" y2="${Y(46 - i * 8) - 4}" stroke="${cols[v] || TEAL}" stroke-width="3"/>`).join("") : null }); };

  // ---- Haemoglobin molecule (schematic: four globin chains, each with a haem) ----
  // Release review 2026-11-15: the four globin chains are packed together into one molecule (quaternary structure), each
  // holding a haem disc with its Fe²⁺ (text 12 px); labels have leader lines.
  const hbMolecule = () => { const cx = 300, cy = 165; let s = `<svg viewBox="0 0 760 330" width="760" role="img" aria-label="schematic haemoglobin molecule: two alpha and two beta globin chains packed together, each holding a haem group with an iron ion that binds one oxygen molecule">`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="150" ry="132" fill="#f3f7f6" stroke="#9fb3ad" stroke-width="1.5" stroke-dasharray="6 4"/>`;
    const q = [[-62, -52, "#cfe9e4", -20, true], [62, -52, "#dcebdc", 20, true], [-62, 56, "#dcebdc", 20, false], [62, 56, "#cfe9e4", -20, false]];
    q.forEach(([dx, dy, col, rot]) => { s += `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="78" ry="62" fill="${col}" stroke="${INK}" stroke-width="1.5" transform="rotate(${rot} ${cx + dx} ${cy + dy})"/><path d="M${cx + dx - 52} ${cy + dy + 18} q16 -22 32 0 t32 0 t32 0" fill="none" stroke="${INK}" stroke-width="1" opacity=".35"/>`; });
    q.forEach(([dx, dy, , , o2]) => { const hx = cx + dx * 1.18, hy = cy + dy * 0.95; s += `<rect x="${hx - 22}" y="${hy - 14}" width="44" height="28" rx="6" fill="#fbe9d0" stroke="${AMBER}" stroke-width="1.5"/><circle cx="${hx}" cy="${hy}" r="11" fill="${ROSE}"/>${T(hx, hy + 4, "Fe", { s: 12, c: "#fff", w: 700 })}${o2 ? `<circle cx="${hx + (dx > 0 ? 18 : -18)}" cy="${hy - 22}" r="6.5" fill="${NAVY}"/><circle cx="${hx + (dx > 0 ? 30 : -30)}" cy="${hy - 22}" r="6.5" fill="${NAVY}"/>` : ""}`; });
    s += T(cx - 62, cy - 52 + 40, "α", { s: 16, w: 700 }) + T(cx + 62, cy - 52 + 40, "β", { s: 16, w: 700 }) + T(cx - 62, cy + 56 + 40, "β", { s: 16, w: 700 }) + T(cx + 62, cy + 56 + 40, "α", { s: 16, w: 700 });
    const lab = (x, y, tx, ty, lines, col = INK) => `${L(x, y, tx - 4, ty - 4, { c: GREY, w: 1 })}<circle cx="${x}" cy="${y}" r="2.4" fill="${INK}"/>` + lines.map((l, k) => T(tx, ty + k * 16, l, { s: 13, w: k ? 400 : 700, a: "start", c: k ? GREY : col })).join("");
    s += lab(cx + 73 + 30, cy - 49 - 22, 500, 52, ["oxygen molecule bound", "to the iron (one per haem)"], NAVY);
    s += lab(cx + 73 + 22, cy - 49, 500, 118, ["haem group containing", "an iron ion, Fe²⁺"], "#9a6f1e");
    s += lab(cx + 122, cy - 38, 500, 196, ["β globin chain", "(a polypeptide)"]);
    s += lab(cx + 122, cy + 70, 500, 252, ["α globin chain"]);
    s += T(380, 318, "Four polypeptide chains (2 α, 2 β) make one molecule; up to four O₂ per molecule. Shapes schematic.", { s: 12.5, c: GREY });
    return s + "</svg>"; };

  // ---- Red blood cell ----
  const rbc = () => `<svg viewBox="0 0 760 200" width="760" role="img" aria-label="red blood cell seen face on and in section, showing the biconcave shape"><g><circle cx="200" cy="100" r="60" fill="#e06d6d" stroke="#b4504f" stroke-width="2"/><ellipse cx="200" cy="100" rx="28" ry="24" fill="#ec8e8e"/>${T(200, 180, "face on: about 7–8 µm across", { s: 12.5, c: GREY })}</g><g><path d="M400 100 c0 -30 40 -34 60 -22 c20 10 40 10 60 0 c20 -12 60 -8 60 22 c0 30 -40 34 -60 22 c-20 -10 -40 -10 -60 0 c-20 12 -60 8 -60 -22z" fill="#e06d6d" stroke="#b4504f" stroke-width="2"/>${T(490, 180, "in section: biconcave disc, about 2 µm thick", { s: 12.5, c: GREY })}</g>${T(380, 18, "No nucleus (or mitochondria): more room for haemoglobin.", { s: 12.5, c: INK, w: 700 })}${T(380, 34, "Biconcave shape: a large surface area to volume ratio and a short diffusion distance to every Hb molecule.", { s: 12, c: GREY })}</svg>`;

  // ---- Mammalian circulation (double circulation; vessel names limited to the specification list) ----
  // Release review 2026-11-15: redrawn so that vessels do not run side by side. Organs of the systemic circuit sit in one
  // column below the heart: each receives an arterial branch from the aorta on the right and drains on the left into the
  // vena cava (the gut drains to the liver through the hepatic portal vein). Only the pulmonary artery crosses another
  // vessel (one hop over the vena cava). No text boxes or footnotes inside the drawing; vessel labels carry class "vlab"
  // so that the labelling question can remove them. Chambers are separate parts for the trace.
  const circulation = () => { uid(); let s = `<svg viewBox="80 8 680 472" width="640" role="img" aria-label="general pattern of mammalian circulation with the heart, lungs, liver, gut, kidneys and body tissues, showing the named vessels"><defs>${marker("ci-ox", ROSE, true)}${marker("ci-de", NAVY, true)}</defs>`;
    const box = (x, y, w, h, t, fill, stroke, part) => `<g data-part="${part}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${T(x + w / 2, y + h / 2 + 5, t, { s: 13.5, w: 700 })}</g>`;
    const vessel = (d, ox, part) => `<g data-part="${part}"><path d="${d}" fill="none" stroke="${ox ? ROSE : NAVY}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${ox ? "ci-ox" : "ci-de"}${U})"/></g>`;
    const lab = (x, y, t, ox, a = "middle", grey = false) => `<text class="vlab" x="${x}" y="${y}" text-anchor="${a}" font-size="13.5" font-weight="700" fill="${grey ? GREY : ox ? ROSE : NAVY}">${t}</text>`;
    s += box(300, 16, 160, 44, "lungs", "#f6d3c6", ROSE, "lungs");
    // heart: outline and septum, then the four chambers as separate parts
    const ch = (x, y, t, part, col) => { const [a1, a2] = t.split(" "); return `<g data-part="${part}"><rect x="${x}" y="${y}" width="90" height="45" fill="#fde7e7" stroke="none"/>${T(x + 45, y + 19, a1, { s: 14.5, c: col, w: 700 })}${T(x + 45, y + 36, a2, { s: 14.5, c: col, w: 700 })}</g>`; };
    s += `<g data-part="heart"><rect x="290" y="108" width="180" height="90" rx="22" fill="#fde7e7" stroke="${ROSE}" stroke-width="2.5"/></g>${ch(292, 110, "right atrium", "right-atrium", NAVY)}${ch(292, 152, "right ventricle", "right-ventricle", NAVY)}${ch(378, 110, "left atrium", "left-atrium", ROSE)}${ch(378, 152, "left ventricle", "left-ventricle", ROSE)}${L(380, 110, 380, 196, { c: ROSE, w: 2 })}${L(292, 153, 468, 153, { c: ROSE, w: 1.2, d: "4 3" })}`;
    // organs of the systemic circuit, in one column
    s += box(300, 232, 160, 40, "liver", "#fbf0d8", AMBER, "liver") + box(300, 300, 160, 40, "gut (intestines)", "#fbf0d8", AMBER, "gut") + box(300, 364, 160, 40, "kidneys", "#fbf0d8", AMBER, "kidneys") + box(300, 428, 160, 40, "body tissues", "#e2efe6", SAGE, "body");
    // vena cava: trunk on the left, entering the right atrium from the left
    s += vessel("M170 448 V132 H286", false, "vena-cava") + lab(162, 300, "vena cava", false, "end");
    s += vessel("M300 252 H176", false, "hepatic-vein") + lab(238, 245, "hepatic vein", false) + vessel("M300 384 H176", false, "renal-vein") + lab(238, 377, "renal vein", false, "middle", true) + vessel("M300 448 H176", false, "vena-cava");
    s += vessel("M380 300 V278", false, "hepatic-portal-vein") + lab(392, 290, "hepatic portal vein", false, "start");
    // pulmonary circuit: artery from the right ventricle (hop over the vena cava) to the lungs; vein from the lungs to the left atrium
    // round 2 (V1-N2): the pulmonary artery crosses the vena cava with a clear hop and a white gap, well away from the atrium
    s += `<path d="M250 152 V116" stroke="#fff" stroke-width="15"/>` + vessel("M290 180 H250 V148 a14 14 0 0 0 0 -28 V38 H294", false, "pulmonary-artery") + lab(242, 84, "pulmonary artery", false, "end");
    s += vessel("M430 60 V104", true, "pulmonary-vein") + lab(440, 88, "pulmonary vein", true, "start");
    // systemic: aorta from the left ventricle down the right-hand side, with a branch to each organ
    s += vessel("M470 180 H590 V440 H466", true, "aorta") + lab(598, 300, "aorta", true, "start");
    // round 2 (V1-N3): the coronary arteries start at the aorta just after it leaves the left ventricle and run back over the
    // heart wall
    s += `<g data-part="coronary"><circle cx="494" cy="180" r="4" fill="${ROSE}"/><path d="M494 180 C 500 214, 462 220, 440 194" fill="none" stroke="${ROSE}" stroke-width="3.5" stroke-dasharray="5 3"/></g>` + lab(434, 224, "coronary arteries", true, "end");
    s += vessel("M590 252 H466", true, "hepatic-artery") + lab(532, 243, "hepatic artery", true) + vessel("M590 320 H466", true, "gut-artery") + lab(532, 311, "artery to gut", true, "middle", true) + vessel("M590 384 H466", true, "renal-artery") + lab(532, 375, "renal artery", true, "middle", true);
    s += `<g>${L(586, 32, 612, 32, { c: ROSE, w: 6 })}${T(618, 37, "oxygenated blood", { s: 12.5, a: "start" })}${L(586, 56, 612, 56, { c: NAVY, w: 6 })}${T(618, 61, "deoxygenated blood", { s: 12.5, a: "start" })}</g>`;
    return s + "</svg>"; };
  B.gasxArt = { T, L, marker, isoCube, savSeries, shapeEffect, singleCell, insectTracheal, leafSection, xerophyteLeaf, humanSystem, alveolus, thorax, intercostalInset, odc, hbMolecule, rbc, circulation, colours: { INK, GREY, TEAL, SAGE, NAVY, AMBER, ROSE, MINT, SKY } };
})(window.BIO);
