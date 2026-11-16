// Interactive explanations and animations. Each kind is a function (spec, host) that renders into host.
// Content files reference them with { kind: "...", title, note }. All animations respect prefers-reduced-motion
// (transitions are disabled, the end state is shown immediately) and every one has a "pause / step" control
// where it animates automatically. Every diagram here is schematic and says so.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, raw, el, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || (B.store.get().prefs || {}).reducedMotion;
  const head = (spec, badge = "schematic") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 13}" font-weight="${o.w || 500}" fill="${o.c || "#16263a"}">${s}</text>`;

  // ---------- Generic condensation / hydrolysis (used by 3.1.1.1 and 3.1.1.2) ----------
  B.interactives.condensation = function (spec, host) {
    host.innerHTML = head(spec) + `
      <div class="row"><button class="btn primary" id="anim-cond">Condensation →</button><button class="btn" id="anim-hyd">← Hydrolysis</button></div>
      <svg id="anim" viewBox="0 0 600 200" style="width:100%;max-width:600px;display:block;margin:1rem auto" role="img" aria-label="animation of condensation and hydrolysis">
        <g id="mA"><rect x="60" y="60" width="130" height="60" rx="12" fill="#d6efec" stroke="#1f8a8a" stroke-width="2"/><text x="125" y="96" text-anchor="middle" font-size="14" font-weight="600" fill="#16263a">monomer</text><text x="197" y="96" font-size="14" font-weight="700" fill="#166f70" id="hA">H</text></g>
        <g id="mB"><text x="300" y="96" font-size="14" font-weight="700" fill="#166f70" id="ohB" text-anchor="end">OH</text><rect x="305" y="60" width="130" height="60" rx="12" fill="#e2efe6" stroke="#6b9a7f" stroke-width="2"/><text x="370" y="96" text-anchor="middle" font-size="14" font-weight="600" fill="#16263a">monomer</text></g>
        <g id="bond" opacity="0"><rect x="240" y="80" width="22" height="20" fill="#16263a"/><text x="251" y="140" text-anchor="middle" font-size="12" fill="#16263a">covalent bond</text></g>
        <g id="water" opacity="0"><circle cx="250" cy="30" r="14" fill="#e4ebf5" stroke="#1e3a5f" stroke-width="2"/><text x="250" y="35" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a5f">H₂O</text></g>
        <text id="label" text-anchor="middle" font-size="13" fill="#3c4f63"><tspan id="label1" x="300" y="168">Two monomers, each with a reactive group facing the other.</tspan><tspan id="label2" x="300" y="186"></tspan></text>
      </svg>`;
    const svg = $("#anim", host); const mA = $("#mA", svg), mB = $("#mB", svg), bond = $("#bond", svg), water = $("#water", svg), label1 = $("#label1", svg), label2 = $("#label2", svg), hA = $("#hA", svg), ohB = $("#ohB", svg);
    const set = (joined) => { const dx = joined ? 50 : 0; const r = reduced(); mA.style.transition = mB.style.transition = r ? "none" : "transform .8s ease"; mA.style.transform = `translate(${dx}px,0)`; mB.style.transform = `translate(${-dx}px,0)`; hA.style.opacity = ohB.style.opacity = joined ? 0 : 1; bond.style.transition = water.style.transition = r ? "none" : "opacity .6s ease .6s"; bond.style.opacity = joined ? 1 : 0; water.style.opacity = joined ? 1 : 0; label1.textContent = joined ? "Condensation: a covalent bond forms and one water molecule is released" : "Hydrolysis: a molecule of water is used to break the bond,"; label2.textContent = joined ? "(H from one monomer, OH from the other)." : "restoring H and OH to the two monomers."; };
    $("#anim-cond", host).onclick = () => set(true); $("#anim-hyd", host).onclick = () => set(false);
  };

  // ---------- Ester bond: glycerol + fatty acid (3.1.1.3) ----------
  // ONE of the three esterifications in a triglyceride with real connectivity: glycerol C–O–H + HO–C(=O)–R → C–O–C(=O)–R + H2O.
  B.interactives.ester = function (spec, host) {
    const C = (x, y) => `<circle cx="${x}" cy="${y - 4}" r="9" fill="#fff"/>` + T(x, y, "C", { w: 700 });
    host.innerHTML = head(spec) + `
      <div class="row"><button class="btn primary" id="e-cond">Condensation →</button><button class="btn" id="e-hyd">← Hydrolysis</button><span class="small muted">Shown for one of the three fatty acids; the other two react in the same way.</span></div>
      <svg id="esvg" viewBox="0 0 720 230" style="width:100%;max-width:720px;display:block;margin:1rem auto" role="img" aria-label="animation of ester bond formation between glycerol and a fatty acid">
        <g id="gly">
          ${T(90, 22, "glycerol", { s: 12, c: "#6b7d8f" })}
          <line x1="90" y1="50" x2="90" y2="190" stroke="#16263a" stroke-width="2"/>
          ${C(90, 70)}${C(90, 125)}${C(90, 180)}
          <line x1="80" y1="66" x2="62" y2="66" stroke="#16263a" stroke-width="2"/>${T(52, 70, "H", {})}<line x1="80" y1="121" x2="62" y2="121" stroke="#16263a" stroke-width="2"/>${T(52, 125, "H", {})}<line x1="80" y1="176" x2="62" y2="176" stroke="#16263a" stroke-width="2"/>${T(52, 180, "H", {})}
          ${T(90, 42, "H", {})}${T(90, 208, "H", {})}
          <line x1="100" y1="121" x2="124" y2="121" stroke="#16263a" stroke-width="2"/>${T(140, 125, "OH", { w: 700, c: "#166f70" })}
          <line x1="100" y1="176" x2="124" y2="176" stroke="#16263a" stroke-width="2"/>${T(140, 180, "OH", { w: 700, c: "#166f70" })}
          <line x1="100" y1="66" x2="124" y2="66" stroke="#16263a" stroke-width="2"/>${T(134, 70, "O", { w: 700 })}
          <g id="gH"><line x1="143" y1="66" x2="152" y2="66" stroke="#166f70" stroke-width="2"/>${T(162, 70, "H", { w: 700, c: "#166f70" })}</g>
        </g>
        <g id="fa">
          ${T(470, 22, "fatty acid", { s: 12, c: "#6b7d8f" })}
          <g id="fOH">${T(262, 70, "HO", { w: 700, c: "#166f70" })}<line x1="280" y1="66" x2="294" y2="66" stroke="#166f70" stroke-width="2"/></g>
          ${C(304, 70)}
          <line x1="301" y1="56" x2="301" y2="38" stroke="#16263a" stroke-width="2"/><line x1="307" y1="56" x2="307" y2="38" stroke="#16263a" stroke-width="2"/>${T(304, 34, "O", { w: 700 })}
          <line x1="314" y1="66" x2="340" y2="66" stroke="#16263a" stroke-width="2"/>
          <path d="M340 66 l16 -9 l16 9 l16 -9 l16 9 l16 -9 l16 9 l16 -9 l16 9 l16 -9 l16 9 l7.2 -4" fill="none" stroke="#16263a" stroke-width="2"/>${T(525, 62, "CH₃", { w: 700, a: "start" })}
          ${T(440, 95, "hydrocarbon tail (R)", { s: 11, c: "#6b7d8f" })}
        </g>
        <g id="ebond" opacity="0"><line x1="144" y1="66" x2="157" y2="66" stroke="#c8902a" stroke-width="3"/><rect x="121" y="16" width="70" height="70" rx="6" fill="none" stroke="#c8902a" stroke-width="2"/>${T(156, 102, "ester bond", { s: 12, w: 700, c: "#8a5f12" })}</g>
        <g id="ewater" opacity="0"><circle cx="330" cy="150" r="16" fill="#e4ebf5" stroke="#1e3a5f" stroke-width="2"/>${T(330, 155, "H₂O", { s: 12, w: 700, c: "#1e3a5f" })}</g>
        <text id="elabel" x="400" y="222" text-anchor="middle" font-size="12" fill="#3c4f63">Glycerol's –OH faces the fatty acid's –COOH.</text>
      </svg>`;
    const svg = $("#esvg", host); const fa = $("#fa", svg), gH = $("#gH", svg), fOH = $("#fOH", svg), eb = $("#ebond", svg), w = $("#ewater", svg), lbl = $("#elabel", svg);
    const set = (joined) => { const r = reduced(); fa.style.transition = r ? "none" : "transform .8s ease"; fa.style.transform = joined ? "translate(-138px,0)" : "translate(0,0)"; gH.style.opacity = fOH.style.opacity = joined ? 0 : 1; eb.style.transition = w.style.transition = r ? "none" : "opacity .5s ease .7s"; eb.style.opacity = w.style.opacity = joined ? 1 : 0; lbl.textContent = joined ? "Condensation: H (from glycerol –OH) and OH (from –COOH) leave as water; an ester bond forms." : "Hydrolysis: water is added across the ester bond, restoring –OH on glycerol and –COOH on the acid."; };
    $("#e-cond", host).onclick = () => set(true); $("#e-hyd", host).onclick = () => set(false);
  };

  // ---------- Phospholipid behaviour in water (3.1.1.3) ----------
  // Two states only: phospholipids just added to water (random) and, after "Arrange", the bilayer. Positions in the
  // random state come from a fixed jittered grid, so every head and tail stays inside the drawing.
  B.interactives.bilayer = function (spec, host) {
    host.innerHTML = head(spec) + `
      <div class="row"><button class="btn primary" id="arrange" aria-pressed="false">Arrange</button><button class="btn" id="mixup" aria-pressed="true">Just added to water</button></div>
      <svg id="bsvg" viewBox="0 0 720 300" style="width:100%;max-width:720px;display:block;margin:1rem auto" role="img" aria-label="phospholipids in water: at random, or arranged as a bilayer">
        <rect x="0" y="0" width="720" height="300" fill="#e4ebf5"/>
        <text x="12" y="22" font-size="13" font-weight="600" fill="#1e3a5f">water</text><text x="12" y="290" font-size="13" font-weight="600" fill="#1e3a5f">water</text>
        <g id="lipids"></g>
        <g id="blabels" font-size="13" font-weight="600" style="opacity:0;transition:opacity .4s ease .8s">
          <path d="M556 69 h12 M556 231 h12 M562 69 V231" stroke="#16263a" stroke-width="1.5" fill="none"/>
          <text x="578" y="85" fill="#166f70">hydrophilic heads</text><text x="578" y="146" fill="#8a5f12">hydrophobic tails</text><text x="578" y="164" font-weight="500" fill="#3c4f63">bilayer ≈ 7 nm</text><text x="578" y="225" fill="#166f70">hydrophilic heads</text>
        </g>
      </svg>
      <p class="small" id="bexpl" aria-live="polite"></p>`;
    const svg = $("#bsvg", host), g = $("#lipids", svg), expl = $("#bexpl", host), labels = $("#blabels", svg);
    const N = 16; // per layer
    const lip = () => { const grp = document.createElementNS("http://www.w3.org/2000/svg", "g"); grp.innerHTML = `<circle cx="0" cy="0" r="11" fill="#1f8a8a"/><path d="M-5 10 q-4 14 0 28 q-4 14 0 28" fill="none" stroke="#c8902a" stroke-width="3"/><path d="M5 10 q4 14 0 28 q4 14 0 28" fill="none" stroke="#c8902a" stroke-width="3"/>`; g.appendChild(grp); return grp; };
    const items = Array.from({ length: N * 2 }, lip);
    // Head at the group origin; tails extend along local +y (about 66 units), so a head at least 70 units from every edge
    // keeps the whole molecule inside the drawing whatever its rotation.
    const place = (grp, x, y, rot, sc = 1) => { grp.style.transition = reduced() ? "none" : "transform .9s ease"; grp.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`; };
    const btnA = $("#arrange", host), btnM = $("#mixup", host);
    const layouts = {
      bilayer() { items.forEach((it, i) => { const top = i < N; place(it, 50 + (i % N) * 32, top ? 80 : 220, top ? 0 : 180); }); labels.style.opacity = 1; expl.innerHTML = "<strong>Bilayer.</strong> With water on both sides, the hydrophilic phosphate heads face the water on each surface and the hydrophobic fatty acid tails point inwards, away from the water. This happens spontaneously. The bilayer, about 7 nm thick, is the basis of every cell membrane (3.1.4.1)."; },
      random() { items.forEach((it, i) => { const c = i % 8, r = Math.floor(i / 8); place(it, 80 + c * 80 + ((i * 29) % 21) - 10, 74 + r * 51 + ((i * 17) % 13) - 6, (i * 67) % 360, 0.85); }); labels.style.opacity = 0; expl.innerHTML = "<strong>Just added to water.</strong> The phospholipids are mixed at random, so many hydrophobic tails are in contact with water. This arrangement is unstable. Press <em>Arrange</em>."; },
    };
    const set = (k) => { layouts[k](); btnA.setAttribute("aria-pressed", k === "bilayer"); btnM.setAttribute("aria-pressed", k === "random"); btnA.classList.toggle("primary", k === "random"); btnM.classList.toggle("primary", k === "bilayer"); };
    btnA.addEventListener("click", () => set("bilayer")); btnM.addEventListener("click", () => set("random"));
    set("random");
  };

  // ---------- Peptide bond (3.1.1.4) ----------
  B.interactives.peptide = function (spec, host) {
    host.innerHTML = head(spec) + `
      <div class="row"><button class="btn primary" id="p-cond">Condensation →</button><button class="btn" id="p-hyd">← Hydrolysis</button></div>
      <svg id="psvg" viewBox="0 0 760 210" style="width:100%;max-width:760px;display:block;margin:1rem auto" role="img" aria-label="animation of peptide bond formation between two amino acids">
        <g id="aa1">
          ${T(130, 24, "amino acid 1", { s: 12, c: "#6b7d8f" })}
          ${T(40, 100, "H₂N", { w: 700 })}<line x1="62" y1="96" x2="86" y2="96" stroke="#16263a" stroke-width="2"/>
          ${T(96, 100, "C", { w: 700 })}<line x1="96" y1="84" x2="96" y2="66" stroke="#16263a" stroke-width="2"/>${T(96, 62, "H", {})}<line x1="96" y1="106" x2="96" y2="124" stroke="#16263a" stroke-width="2"/>${T(96, 140, "R₁", { w: 700, c: "#6b9a7f" })}
          <line x1="106" y1="96" x2="130" y2="96" stroke="#16263a" stroke-width="2"/>${T(140, 100, "C", { w: 700 })}
          <line x1="137" y1="86" x2="137" y2="66" stroke="#16263a" stroke-width="2"/><line x1="143" y1="86" x2="143" y2="66" stroke="#16263a" stroke-width="2"/>${T(140, 62, "O", { w: 700 })}
          <g id="oh1"><line x1="150" y1="96" x2="170" y2="96" stroke="#166f70" stroke-width="2"/>${T(186, 100, "OH", { w: 700, c: "#166f70" })}</g>
        </g>
        <g id="aa2">
          ${T(470, 24, "amino acid 2", { s: 12, c: "#6b7d8f" })}
          <g id="h2">${T(342, 100, "H", { w: 700, c: "#166f70" })}<line x1="352" y1="96" x2="370" y2="96" stroke="#166f70" stroke-width="2"/></g>
          ${T(382, 100, "N", { w: 700 })}<line x1="382" y1="106" x2="382" y2="124" stroke="#16263a" stroke-width="2"/>${T(382, 140, "H", {})}
          <line x1="392" y1="96" x2="416" y2="96" stroke="#16263a" stroke-width="2"/>${T(426, 100, "C", { w: 700 })}<line x1="426" y1="84" x2="426" y2="66" stroke="#16263a" stroke-width="2"/>${T(426, 62, "H", {})}<line x1="426" y1="106" x2="426" y2="124" stroke="#16263a" stroke-width="2"/>${T(426, 140, "R₂", { w: 700, c: "#6b9a7f" })}
          <line x1="436" y1="96" x2="460" y2="96" stroke="#16263a" stroke-width="2"/>${T(470, 100, "C", { w: 700 })}
          <line x1="467" y1="86" x2="467" y2="66" stroke="#16263a" stroke-width="2"/><line x1="473" y1="86" x2="473" y2="66" stroke="#16263a" stroke-width="2"/>${T(470, 62, "O", { w: 700 })}
          <line x1="480" y1="96" x2="500" y2="96" stroke="#16263a" stroke-width="2"/>${T(516, 100, "OH", { w: 700 })}
        </g>
        <g id="pbond" opacity="0"><line x1="150" y1="96" x2="173" y2="96" stroke="#c8902a" stroke-width="3"/><rect x="124" y="46" width="72" height="100" rx="8" fill="none" stroke="#c8902a" stroke-width="2"/>${T(160, 164, "peptide bond", { s: 12, w: 700, c: "#8a5f12" })}</g>
        <g id="pwater" opacity="0"><circle cx="300" cy="170" r="16" fill="#e4ebf5" stroke="#1e3a5f" stroke-width="2"/>${T(300, 175, "H₂O", { s: 12, w: 700, c: "#1e3a5f" })}</g>
        <text id="plabel" x="380" y="202" text-anchor="middle" font-size="12" fill="#3c4f63">Carboxyl group of amino acid 1 faces the amino group of amino acid 2.</text>
      </svg>`;
    const svg = $("#psvg", host); const aa2 = $("#aa2", svg), oh1 = $("#oh1", svg), h2 = $("#h2", svg), pb = $("#pbond", svg), w = $("#pwater", svg), lbl = $("#plabel", svg);
    const set = (joined) => { const r = reduced(); aa2.style.transition = r ? "none" : "transform .9s ease"; aa2.style.transform = joined ? "translate(-200px,0)" : "translate(0,0)"; oh1.style.opacity = h2.style.opacity = joined ? 0 : 1; pb.style.transition = w.style.transition = r ? "none" : "opacity .5s ease .8s"; pb.style.opacity = w.style.opacity = joined ? 1 : 0; lbl.textContent = joined ? "Condensation: OH (carboxyl of 1) + H (amino of 2) leave as water; a C–N peptide bond forms: a dipeptide." : "Hydrolysis: water is added across the peptide bond, restoring –COOH and –NH₂."; };
    $("#p-cond", host).onclick = () => set(true); $("#p-hyd", host).onclick = () => set(false);
  };

  // ---------- Protein structure explorer (3.1.1.4) ----------
  // One picture and one short text at a time. The four level tabs and the two "What if" buttons share the row above the
  // picture, so a result is always shown in the same place as the picture it changes.
  B.interactives.proteinExplorer = function (spec, host) {
    // Side view of ONE chain coiled into a right-handed helix (same drawing as miniHelix in data/content/3.1.1.4.js):
    // front half of each turn bold, back half faint. Hydrogen bonds are drawn parallel to the axis between successive turns.
    const helixCoil = (cx, y0, r, pitch, turns, w, col) => {
      const pts = (from, to) => { const a = []; for (let t = from; t <= to + 1e-9; t += 0.1) a.push(`${(cx + r * Math.sin(t)).toFixed(1)} ${(y0 + pitch * t / (2 * Math.PI)).toFixed(1)}`); return "M" + a.join(" L"); };
      let s = "";
      for (let k = 0; k < turns; k++) { const t0 = k * 2 * Math.PI; s += `<path d="${pts(t0 + Math.PI, t0 + 2 * Math.PI)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity=".35"/><path d="${pts(t0, t0 + Math.PI)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; }
      return s;
    };
    // Smooth curve through the given points (Catmull-Rom converted to cubic Bezier): the chain passes exactly through
    // every point, so bonds drawn to a point end on the chain.
    const smooth = (P) => { let d = `M${P[0][0]} ${P[0][1]}`; for (let i = 0; i < P.length - 1; i++) { const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2; const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]; d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`; } return d; };
    const chain = (P) => `<path d="${smooth(P)}" fill="none" stroke="#1f8a8a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    const tag = (x, y, s, c, w = 700) => { const wd = s.length * 7 + 8; return `<rect x="${x - wd / 2}" y="${y - 11}" width="${wd}" height="15" rx="3" fill="#fff"/>` + T(x, y, s, { s: 12, w, c }); };
    const HX = 150, HY = 34, HR = 40, HP = 26; // helix centre x, top y, radius, pitch (one turn = 3.6 amino acids)
    const helixPanel = `<line x1="${HX}" y1="${HY - 4}" x2="${HX}" y2="${HY + 4 * HP + 4}" stroke="#6b7d8f" stroke-width="1" stroke-dasharray="2 4"/>${helixCoil(HX, HY, HR, HP, 4, 6, "#1f8a8a")}
        <g stroke="#c8902a" stroke-width="2" stroke-dasharray="4 3">${[0, 1, 2].map((k) => `<line x1="${HX + HR}" y1="${HY + HP / 4 + k * HP + 3}" x2="${HX + HR}" y2="${HY + HP / 4 + (k + 1) * HP - 3}"/><line x1="${HX - HR}" y1="${HY + 3 * HP / 4 + k * HP + 3}" x2="${HX - HR}" y2="${HY + 3 * HP / 4 + (k + 1) * HP - 3}"/>`).join("")}</g>
        ${T(HX + HR + 10, HY + HP / 4 + 4, "C=O", { s: 12, w: 600, a: "start" })}${T(HX + HR + 10, HY + HP / 4 + HP + 4, "N–H", { s: 12, w: 600, a: "start" })}
        ${T(262, 82, "one chain coiled", { s: 12, a: "start", c: "#3c4f63" })}${T(262, 98, "round an axis;", { s: 12, a: "start", c: "#3c4f63" })}${T(262, 114, "3.6 amino acids", { s: 12, a: "start", c: "#3c4f63" })}${T(262, 130, "per turn", { s: 12, a: "start", c: "#3c4f63" })}`;
    const SEQ = ["Gly", "Ala", "Ser", "Cys", "Leu", "Lys", "Glu", "Val", "His", "Cys", "Pro", "Phe", "Asp", "Arg", "Tyr", "Thr", "Met", "Ile", "Asn", "Gln", "Trp"];
    const beads = (seq, x0, y0, mutIdx = -1) => seq.slice(1).map((_, i) => `<line x1="${x0 + i * 31 + 13}" y1="${y0}" x2="${x0 + (i + 1) * 31 - 13}" y2="${y0}" stroke="#16263a" stroke-width="3"/>`).join("") + seq.map((r, i) => `<circle cx="${x0 + i * 31}" cy="${y0}" r="13" fill="${i === mutIdx ? "#c25f5f" : "#1f8a8a"}"/><text x="${x0 + i * 31}" y="${y0 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${r}</text>`).join("");
    const primarySVG = (mut) => `<svg viewBox="0 0 720 130" width="720" role="img" aria-label="primary structure as a sequence of amino acids${mut ? ", with one amino acid substituted" : ""}">${T(26, 30, "N-terminus", { a: "start", s: 12, w: 600, c: "#3c4f63" })}${T(694, 30, "C-terminus", { a: "end", s: 12, w: 600, c: "#3c4f63" })}${beads(mut ? SEQ.map((r, i) => (i === 6 ? "Val" : r)) : SEQ, 50, 64, mut ? 6 : -1)}${mut ? T(236, 100, "Glu → Val", { s: 12, c: "#c25f5f" }) : ""}${T(360, 122, "the sequence of amino acids, joined by peptide bonds (covalent)", { s: 12, c: "#3c4f63" })}</svg>`;
    // Tertiary structure: ONE continuous folded chain. Upper and lower stretches are held together by a hydrogen bond, an
    // ionic bond, a cluster of non-polar R groups (hydrophobic interactions) and a disulfide bridge between two cysteines.
    const FOLD = [[70, 60], [115, 40], [160, 70], [230, 40], [300, 70], [370, 40], [440, 70], [510, 40], [580, 70], [640, 58], [682, 110], [640, 162], [580, 150], [510, 180], [440, 150], [370, 180], [300, 150], [230, 180], [160, 150], [115, 180], [70, 165]];
    const bond = (x, y1, y2, col, dash, w = 2) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${col}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
    const tertiarySVG = `<svg viewBox="0 0 720 236" width="720" role="img" aria-label="tertiary structure: one folded chain held by a hydrogen bond, an ionic bond, hydrophobic interactions and a disulfide bridge">
        ${chain(FOLD)}${T(58, 64, "N", { a: "end", s: 13 })}${T(58, 170, "C", { a: "end", s: 13 })}
        ${bond(160, 76, 144, "#c8902a", "4 3")}${tag(160, 92, "–OH", "#16263a")}${tag(160, 136, "O=C–", "#16263a")}${tag(160, 114, "hydrogen bond", "#8a5f12", 600)}
        ${bond(300, 76, 144, "#1e3a5f", "6 3")}${tag(300, 92, "–COO⁻", "#1e3a5f")}${tag(300, 136, "⁺H₃N–", "#1e3a5f")}${tag(300, 114, "ionic bond", "#1e3a5f", 600)}
        <g stroke="#6b7d8f" stroke-width="2"><line x1="425" y1="72" x2="428" y2="86"/><line x1="455" y1="72" x2="452" y2="86"/><line x1="425" y1="148" x2="428" y2="134"/><line x1="455" y1="148" x2="452" y2="134"/></g>
        <ellipse cx="440" cy="110" rx="50" ry="25" fill="#e2efe6" stroke="#6b9a7f" stroke-width="2"/>${T(440, 107, "hydrophobic", { s: 11, w: 600, c: "#3c4f63" })}${T(440, 121, "interactions", { s: 11, w: 600, c: "#3c4f63" })}
        ${bond(580, 76, 144, "#c25f5f", "", 4)}${tag(580, 92, "S", "#c25f5f")}${tag(580, 136, "S", "#c25f5f")}${tag(580, 114, "disulfide bridge", "#c25f5f", 600)}
        <line x1="150" y1="216" x2="190" y2="216" stroke="#c25f5f" stroke-width="4"/>${T(198, 220, "covalent (strong)", { a: "start", s: 12, w: 500, c: "#3c4f63" })}
        <line x1="380" y1="216" x2="420" y2="216" stroke="#c8902a" stroke-width="2" stroke-dasharray="4 3"/>${T(428, 220, "weaker interactions between R groups", { a: "start", s: 12, w: 500, c: "#3c4f63" })}</svg>`;
    // Denatured: the same chain as a loose random coil. The weak bonds are gone; the two cysteines are still joined by a
    // disulfide bridge of normal length, and the peptide bonds are intact.
    const COIL = [[50, 110], [100, 50], [150, 100], [200, 45], [250, 125], [200, 185], [290, 196], [330, 110], [380, 175], [420, 60], [470, 82], [540, 50], [640, 90], [600, 170], [470, 150], [560, 206]];
    const denaturedSVG = `<svg viewBox="0 0 720 236" width="720" role="img" aria-label="denatured protein: the chain is a loose random coil; only the covalent disulfide bridge remains">
        ${chain(COIL)}${T(38, 114, "N", { a: "end", s: 13 })}${T(574, 214, "C", { a: "start", s: 13 })}
        ${bond(470, 88, 144, "#c25f5f", "", 4)}${tag(470, 92, "S", "#c25f5f")}${tag(470, 150, "S", "#c25f5f")}${T(484, 124, "disulfide bridge remains", { a: "start", s: 12, w: 600, c: "#c25f5f" })}</svg>`;
    const views = {
      1: { title: "Primary", svg: primarySVG(false),
        text: "<strong>Primary structure:</strong> the sequence of amino acids in the polypeptide, set by the base sequence of the gene. The only bonds are covalent peptide bonds." },
      2: { title: "Secondary", svg: `<svg viewBox="0 0 720 200" width="720" role="img" aria-label="alpha helix and beta pleated sheet held by hydrogen bonds">
        ${T(HX, 20, "α-helix", { w: 700, s: 14 })}${helixPanel}
        ${T(560, 24, "β-pleated sheet", { w: 700, s: 14 })}<path d="M440 55 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10" fill="none" stroke="#6b9a7f" stroke-width="6"/><path d="M440 95 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10" fill="none" stroke="#6b9a7f" stroke-width="6"/><path d="M440 135 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10" fill="none" stroke="#6b9a7f" stroke-width="6"/>
        <g stroke="#c8902a" stroke-width="2" stroke-dasharray="4 3"><line x1="470" y1="48" x2="470" y2="102"/><line x1="530" y1="48" x2="530" y2="102"/><line x1="590" y1="48" x2="590" y2="102"/><line x1="650" y1="48" x2="650" y2="102"/><line x1="500" y1="100" x2="500" y2="128"/><line x1="560" y1="100" x2="560" y2="128"/><line x1="620" y1="100" x2="620" y2="128"/><line x1="680" y1="100" x2="680" y2="128"/></g>
        ${T(360, 186, "dashed lines: hydrogen bonds between the C=O and N–H groups of the backbone", { s: 12, c: "#3c4f63" })}</svg>`,
        text: "<strong>Secondary structure:</strong> hydrogen bonds between the C=O of one peptide bond and the N–H of another coil the chain into an α-helix or fold it into a β-pleated sheet. R groups are not involved." },
      3: { title: "Tertiary", svg: tertiarySVG,
        text: "<strong>Tertiary structure:</strong> the whole chain folds into a precise 3D shape, held by bonds between R groups: hydrogen bonds, ionic bonds, disulfide bridges and hydrophobic interactions. The covalent disulfide bridge (solid line) is strong and is not broken by moderate heat; the weaker interactions (dashed) are broken by heat and changes in pH. This shape forms the active site of an enzyme." },
      4: { title: "Quaternary", svg: `<svg viewBox="0 0 720 200" width="720" role="img" aria-label="quaternary structure: four polypeptide subunits of haemoglobin each with a haem group">
        ${[[250, 62, "α", "#d6efec", "#1f8a8a"], [340, 62, "β", "#e2efe6", "#6b9a7f"], [250, 142, "β", "#e2efe6", "#6b9a7f"], [340, 142, "α", "#d6efec", "#1f8a8a"]].map(([x, y, l, f, st]) => `<path d="M${x - 50} ${y} c0 -40 40 -45 60 -30 c30 -20 60 20 40 45 c10 30 -40 45 -60 25 c-30 15 -50 -10 -40 -40z" fill="${f}" stroke="${st}" stroke-width="3"/><circle cx="${x + 12}" cy="${y + 6}" r="8" fill="#c25f5f"/>${T(x - 18, y + 10, l, { w: 700, s: 15 })}`).join("")}
        ${T(430, 86, "● haem group (contains Fe²⁺)", { s: 12, c: "#c25f5f", a: "start" })}${T(430, 108, "2 α + 2 β chains = 1 haemoglobin", { s: 12, c: "#3c4f63", a: "start" })}${T(430, 128, "held by the same R-group interactions", { s: 12, c: "#3c4f63", a: "start" })}</svg>`,
        text: "<strong>Quaternary structure:</strong> two or more polypeptide chains in one protein. Haemoglobin has four (two α and two β), each with a haem group (3.1.5.3), held by the same interactions as tertiary structure." },
    };
    host.innerHTML = head(spec) + `<div class="row" style="justify-content:space-between;align-items:center;gap:.5rem 1rem;flex-wrap:wrap;margin-bottom:.4rem"><div class="tabs" role="tablist" id="lvl" aria-label="levels of protein structure" style="margin:0">${[1, 2, 3, 4].map((n) => `<button role="tab" aria-selected="${n === 1}" data-l="${n}">${n}. ${views[n].title}</button>`).join("")}</div><div class="row" style="gap:.35rem;margin:0" role="group" aria-label="what if"><strong class="small">What if…</strong><button class="btn sm" id="mut" aria-pressed="false">one amino acid changes</button><button class="btn sm" id="heat" aria-pressed="false">it is heated to 70 °C</button></div></div>
      <div class="figure" style="margin:0"><div class="fig-view" id="pview"></div></div><div class="small mt" id="ptext" aria-live="polite"></div>`;
    const tabs = $$("#lvl button", host), mutB = $("#mut", host), heatB = $("#heat", host);
    const show = (n, svg, text, which) => { tabs.forEach((b) => b.setAttribute("aria-selected", b.dataset.l == n)); mutB.setAttribute("aria-pressed", which === "mut"); heatB.setAttribute("aria-pressed", which === "heat"); mutB.classList.toggle("primary", which === "mut"); heatB.classList.toggle("primary", which === "heat"); $("#pview", host).innerHTML = svg || views[n].svg; $("#ptext", host).innerHTML = text || views[n].text; };
    tabs.forEach((b) => b.addEventListener("click", () => show(+b.dataset.l)));
    mutB.onclick = () => show(1, primarySVG(true), "<strong>One amino acid changes (Glu → Val, red).</strong> A charged R group is replaced by a non-polar one, so the bonds that R group can form change. The chain may fold differently, and if the active site or binding site changes shape the protein loses its function. Glutamic acid to valine at position 6 of β-globin causes sickle-cell anaemia (3.2.11.1).", "mut");
    heatB.onclick = () => show(3, denaturedSVG, "<strong>Heated to 70 °C: denaturation.</strong> Hydrogen bonds and ionic bonds break and the chain unfolds, so the active site loses its shape and the protein loses its function. The peptide bonds (primary structure) and the covalent disulfide bridge are not broken.", "heat");
    show(1);
  };

  // Router used by the topic page: supports legacy c.interactive and the new c.interactives array
  B.views = B.views || {};
  // Clickable diagram parts get an accessible name from their data attribute when the interactive did not give one
  // (learning audit 2026-11-08), so screen readers announce e.g. "guard cell" rather than just "button".
  const nameParts = (host) => host.querySelectorAll("[data-part], [data-org], [data-zone]").forEach((e) => { if (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby")) return; const ttl = e.querySelector(":scope > title"); const v = (ttl && ttl.textContent) || e.dataset.part || e.dataset.org || e.dataset.zone; if (!v) return; const interactive = e.hasAttribute("tabindex") || e.getAttribute("role") === "button" || e.tagName === "BUTTON" || e.tagName === "A"; if (interactive || getComputedStyle(e).cursor === "pointer") { e.setAttribute("aria-label", v.replace(/[-_]/g, " ")); if (!interactive) { e.setAttribute("role", "button"); e.setAttribute("tabindex", "0"); e.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); e.dispatchEvent(new MouseEvent("click", { bubbles: true })); } }); } } });
  B.views.interactive = function (spec, host) { const fn = B.interactives[spec.kind]; if (fn) { fn(spec, host); try { nameParts(host); } catch (e) {} } else host.innerHTML = `<p class="muted">Animation "${esc(spec.kind)}" not implemented.</p>`; };
})(window.BIO);

// ===================== 3.1.2 Cells =====================
(function (B) {
  const { h, raw, el, $, $$, esc } = B.util;
  const head = (spec, badge = "schematic") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;

  // ---------- Clickable cell explorer (animal / plant / prokaryote) ----------
  // spec.cell: one cell; spec.cells: several cells with a switch above the drawing (3.1.2.1 shows animal and plant in one
  // explorer). "Show all labels" swaps in the labelled drawing (same structures, labels in the margins) and shows it at
  // the full card width, all labels at one size (14 units, at least 12 px on a laptop; the automatic label enlarger is
  // switched off for it). On phones the labelled drawing keeps a readable width and scrolls sideways, with a cue.
  B.interactives.cellExplorer = function (spec, host) {
    const art = B.cellArt; const cells = spec.cells || [spec.cell]; const NAMES = { animal: "Animal cell", plant: "Plant cell", prokaryote: "Bacterial cell" };
    const draw = (cell, labels) => (cell === "animal" ? art.animalCell({ labels }) : cell === "plant" ? art.plantCell({ labels }) : art.prokaryote({ big: true, labels }));
    const presentOf = (cell) => { const data = cell === "prokaryote" ? art.prokOrganelles : art.organelles; const svg = draw(cell, false); return data.filter((o) => (!o.only || o.only.includes(cell)) && svg.includes(`data-org="${o.key}"`)); };
    const sw = cells.length > 1 ? `<div class="row mb" role="group" aria-label="choose a cell">${cells.map((c, i) => `<button class="btn sm${i ? "" : " primary"}" data-cell="${c}" aria-pressed="${!i}">${NAMES[c]}</button>`).join("")}</div>` : "";
    host.innerHTML = head(spec, "click or tab to a structure") + sw + `<div class="explorer"><div class="figure"><div class="fig-view" id="cview"></div></div><div><div class="row mb"><button class="btn sm" id="clabels" aria-pressed="false">Show all labels</button></div><div class="org-list"></div><div class="card" id="orginfo" style="background:var(--surface-2)" aria-live="polite"></div></div></div>`;
    let cell = cells[0], labels = false, cur = null, groups = [], present = [];
    const show = (key) => { const o = present.find((x) => x.key === key); if (!o) return; cur = key; groups.forEach((g) => g.classList.toggle("on", g.dataset.org === key)); $$(".org-list button", host).forEach((b) => b.setAttribute("aria-pressed", b.dataset.key === key)); $("#orginfo", host).innerHTML = h`<div class="row"><strong>${o.name}</strong><span class="badge ${o.membrane === "double" ? "navy" : o.membrane === "single" ? "teal" : ""}">${o.membrane === "double" ? "double membrane" : o.membrane === "single" ? "single membrane" : "no membrane"}</span>${o.size ? raw(h`<span class="badge">${o.size}</span>`) : ""}</div><p class="small mt"><strong>Structure.</strong> ${o.structure}</p><p class="small"><strong>Function.</strong> ${o.func}</p>${o.sf ? raw(h`<p class="small"><strong>Structure → function.</strong> ${o.sf}</p>`) : ""}${o.note ? raw(h`<p class="tiny muted">${o.note}</p>`) : ""}`; };
    const render = () => {
      const view = $("#cview", host), phone = matchMedia("(max-width: 599.98px)").matches;
      $(".explorer", host).classList.toggle("ix-explorer-stack", labels);
      view.classList.toggle("ix-read-off", labels);
      view.innerHTML = labels ? `<div class="ix-hscroll">${draw(cell, true).replace("<svg ", `<svg style="${phone ? "width:800px;min-width:800px" : "width:100%"};height:auto;display:block" `)}</div><p class="ix-swipe tiny muted" aria-hidden="true">↔ Swipe sideways to see the whole drawing</p>` : draw(cell, false);
      // the automatic phone layout (js/core/ix-layout.js) adds its own scroll box and cue for the unlabelled drawing only
      if (labels) { view.classList.remove("ix-hscroll"); view.parentElement.querySelectorAll(":scope > .ix-swipe").forEach((e) => e.remove()); }
      groups = $$("[data-org]", view);
      groups.forEach((g) => { g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); const o = present.find((x) => x.key === g.dataset.org); if (o) g.setAttribute("aria-label", o.name); g.addEventListener("click", () => show(g.dataset.org)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(g.dataset.org); } }); });
      if (cur && present.some((o) => o.key === cur)) show(cur);
    };
    const setCell = (c) => {
      cell = c; present = presentOf(c);
      $$("[data-cell]", host).forEach((b) => { const on = b.dataset.cell === c; b.setAttribute("aria-pressed", on); b.classList.toggle("primary", on); });
      $(".org-list", host).innerHTML = present.map((o) => `<button class="btn sm" data-key="${esc(o.key)}" aria-pressed="false">${esc(o.name)}</button>`).join("");
      $$(".org-list button", host).forEach((b) => b.addEventListener("click", () => show(b.dataset.key)));
      if (!present.some((o) => o.key === cur)) { cur = null; $("#orginfo", host).innerHTML = '<p class="muted small">Select a structure on the diagram or from the list.</p>'; }
      render();
    };
    const lb = $("#clabels", host);
    lb.addEventListener("click", () => { labels = !labels; lb.setAttribute("aria-pressed", labels); lb.textContent = labels ? "Hide labels" : "Show all labels"; render(); });
    $$("[data-cell]", host).forEach((b) => b.addEventListener("click", () => setCell(b.dataset.cell)));
    setCell(cell);
  };

  // ---------- Prokaryote v eukaryote comparison toggle ----------
  B.interactives.prokEuk = function (spec, host) {
    const rows = [["Typical size", "0.5 to 5 µm", "10 to 100 µm"], ["Nucleus", "None: circular DNA free in the cytoplasm (nucleoid)", "DNA in a nucleus bounded by a double membrane (envelope)"], ["DNA", "Circular, not associated with proteins; often plasmids too", "Linear, associated with histone proteins, in chromosomes"], ["Membrane-bound organelles", "None", "Mitochondria, ER, Golgi, lysosomes, (chloroplasts, vacuole)"], ["Ribosomes", "Smaller: 70S", "Larger: 80S in cytoplasm (70S inside mitochondria and chloroplasts)"], ["Cell wall", "Always present; contains murein (peptidoglycan)", "Plants: cellulose; fungi: chitin; animals: none"], ["Other features", "Capsule, flagella and plasmids in some bacteria", "Capsules and plasmids rare; flagella (different structure) in some cells"], ["Cell division", "Binary fission (3.2.10.3)", "Mitosis / meiosis (3.2.10.2, 3.1.9.1)"]];
    host.innerHTML = head(spec, "comparison") + `<div class="row mb"><button class="btn sm" id="pe-all" aria-pressed="true">Show all</button><button class="btn sm" id="pe-quiz" aria-pressed="false">Hide eukaryote column (self-test)</button></div><table id="petab"><thead><tr><th>Feature</th><th>Prokaryotic cell</th><th>Eukaryotic cell</th></tr></thead><tbody>${rows.map((r) => h`<tr><th>${r[0]}</th><td>${r[1]}</td><td class="euk">${r[2]}</td></tr>`).join("")}</tbody></table>`;
    const set = (quiz) => { $$("td.euk", host).forEach((td) => { td.style.color = quiz ? "transparent" : ""; td.style.background = quiz ? "var(--surface-2)" : ""; td.title = quiz ? "click to reveal" : ""; td.onclick = quiz ? () => { td.style.color = ""; } : null; }); $("#pe-all", host).setAttribute("aria-pressed", !quiz); $("#pe-quiz", host).setAttribute("aria-pressed", quiz); };
    $("#pe-all", host).onclick = () => set(false); $("#pe-quiz", host).onclick = () => set(true);
  };
})(window.BIO);
