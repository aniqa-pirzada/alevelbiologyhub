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
      <svg id="anim" viewBox="0 0 600 180" style="width:100%;max-width:600px;display:block;margin:1rem auto" role="img" aria-label="animation of condensation and hydrolysis">
        <g id="mA"><rect x="60" y="60" width="130" height="60" rx="12" fill="#d6efec" stroke="#1f8a8a" stroke-width="2"/><text x="125" y="96" text-anchor="middle" font-size="14" font-weight="600" fill="#16263a">monomer</text><text x="197" y="96" font-size="14" font-weight="700" fill="#166f70" id="hA">H</text></g>
        <g id="mB"><text x="300" y="96" font-size="14" font-weight="700" fill="#166f70" id="ohB" text-anchor="end">OH</text><rect x="305" y="60" width="130" height="60" rx="12" fill="#e2efe6" stroke="#6b9a7f" stroke-width="2"/><text x="370" y="96" text-anchor="middle" font-size="14" font-weight="600" fill="#16263a">monomer</text></g>
        <g id="bond" opacity="0"><rect x="240" y="80" width="22" height="20" fill="#16263a"/><text x="251" y="140" text-anchor="middle" font-size="12" fill="#16263a">covalent bond</text></g>
        <g id="water" opacity="0"><circle cx="250" cy="30" r="14" fill="#e4ebf5" stroke="#1e3a5f" stroke-width="2"/><text x="250" y="35" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a5f">H₂O</text></g>
        <text id="label" x="300" y="170" text-anchor="middle" font-size="13" fill="#3c4f63">Two monomers, each with a reactive group facing the other.</text>
      </svg>`;
    const svg = $("#anim", host); const mA = $("#mA", svg), mB = $("#mB", svg), bond = $("#bond", svg), water = $("#water", svg), label = $("#label", svg), hA = $("#hA", svg), ohB = $("#ohB", svg);
    const set = (joined) => { const dx = joined ? 50 : 0; const r = reduced(); mA.style.transition = mB.style.transition = r ? "none" : "transform .8s ease"; mA.style.transform = `translate(${dx}px,0)`; mB.style.transform = `translate(${-dx}px,0)`; hA.style.opacity = ohB.style.opacity = joined ? 0 : 1; bond.style.transition = water.style.transition = r ? "none" : "opacity .6s ease .6s"; bond.style.opacity = joined ? 1 : 0; water.style.opacity = joined ? 1 : 0; label.textContent = joined ? "Condensation: a covalent bond forms and one molecule of water is released (H from one monomer, OH from the other)." : "Hydrolysis: a molecule of water is used to break the bond, restoring H and OH to the two monomers."; };
    $("#anim-cond", host).onclick = () => set(true); $("#anim-hyd", host).onclick = () => set(false);
  };

  // ---------- Ester bond: glycerol + fatty acid (3.1.1.3) ----------
  // ONE of the three esterifications in a triglyceride with real connectivity: glycerol C–O–H + HO–C(=O)–R → C–O–C(=O)–R + H2O.
  B.interactives.ester = function (spec, host) {
    const C = (x, y) => `<circle cx="${x}" cy="${y - 4}" r="9" fill="#fff"/>` + T(x, y, "C", { w: 700 });
    host.innerHTML = head(spec, "schematic, real connectivity") + `
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
          <path d="M340 66 l16 -9 l16 9 l16 -9 l16 9 l16 -9 l16 9 l16 -9 l16 9 l16 -9 l16 9 l16 -9" fill="none" stroke="#16263a" stroke-width="2"/>${T(552, 61, "CH₃", { w: 700 })}
          ${T(440, 95, "hydrocarbon tail (R)", { s: 11, c: "#6b7d8f" })}
        </g>
        <g id="ebond" opacity="0"><line x1="143" y1="66" x2="166" y2="66" stroke="#c8902a" stroke-width="3"/><rect x="122" y="30" width="66" height="54" rx="6" fill="none" stroke="#c8902a" stroke-width="2"/>${T(155, 100, "ester bond", { s: 12, w: 700, c: "#8a5f12" })}</g>
        <g id="ewater" opacity="0"><circle cx="330" cy="150" r="16" fill="#e4ebf5" stroke="#1e3a5f" stroke-width="2"/>${T(330, 155, "H₂O", { s: 12, w: 700, c: "#1e3a5f" })}</g>
        <text id="elabel" x="400" y="222" text-anchor="middle" font-size="12" fill="#3c4f63">Glycerol's –OH faces the fatty acid's –COOH.</text>
      </svg>
      <p class="tiny muted">Limitation: bond angles and the 3D shape are not shown; the hydrocarbon tail is drawn as a zigzag of CH₂ units and shortened. The connectivity (C–O–C(=O)–R) is correct.</p>`;
    const svg = $("#esvg", host); const fa = $("#fa", svg), gH = $("#gH", svg), fOH = $("#fOH", svg), eb = $("#ebond", svg), w = $("#ewater", svg), lbl = $("#elabel", svg);
    const set = (joined) => { const r = reduced(); fa.style.transition = r ? "none" : "transform .8s ease"; fa.style.transform = joined ? "translate(-138px,0)" : "translate(0,0)"; gH.style.opacity = fOH.style.opacity = joined ? 0 : 1; eb.style.transition = w.style.transition = r ? "none" : "opacity .5s ease .7s"; eb.style.opacity = w.style.opacity = joined ? 1 : 0; lbl.textContent = joined ? "Condensation: H (from glycerol –OH) and OH (from –COOH) leave as water; an ester bond forms." : "Hydrolysis: water is added across the ester bond, restoring –OH on glycerol and –COOH on the acid."; };
    $("#e-cond", host).onclick = () => set(true); $("#e-hyd", host).onclick = () => set(false);
  };

  // ---------- Phospholipid behaviour in water (3.1.1.3) ----------
  B.interactives.bilayer = function (spec, host) {
    host.innerHTML = head(spec) + `
      <div class="row"><label class="small">Environment: <select id="env"><option value="scatter">Phospholipids just added to water</option><option value="closed">Water all round: micelle and vesicle (self-assembled)</option><option value="water">Section through a cell membrane (bilayer)</option><option value="surface">Water below, air above (surface monolayer)</option></select></label><button class="btn sm" id="arrange">Arrange</button></div>
      <svg id="bsvg" viewBox="0 0 720 300" style="width:100%;max-width:720px;display:block;margin:1rem auto" role="img" aria-label="phospholipid arrangement in water">
        <rect id="top" x="0" y="0" width="720" height="150" fill="#e4ebf5"/><rect x="0" y="150" width="720" height="150" fill="#e4ebf5"/>
        <text id="topL" x="12" y="22" font-size="12" fill="#1e3a5f">water (aqueous, polar)</text><text x="12" y="292" font-size="12" fill="#1e3a5f">water (aqueous, polar)</text>
        <g id="lipids"></g>
        <g id="blabels" font-size="12" fill="#1e3a5f" text-anchor="middle" style="opacity:0;transition:opacity .4s ease .8s"><text x="160" y="76">micelle (one-tailed lipids,</text><text x="160" y="92" font-size="10" fill="#3c4f63">e.g. fatty acids)</text><text x="160" y="212" font-size="10" fill="#3c4f63">tails meet in the centre</text><text x="490" y="32">vesicle (liposome)</text><text x="490" y="272" font-size="10" fill="#3c4f63">closed bilayer: water inside and outside</text></g>
        <text id="note" x="360" y="290" text-anchor="middle" font-size="12" fill="#3c4f63"></text>
      </svg>
      <div class="small" id="bexpl"></div>`;
    const svg = $("#bsvg", host), g = $("#lipids", svg), note = $("#note", svg), expl = $("#bexpl", host), labels = $("#blabels", svg);
    const N = 21; const lip = (i) => { const grp = document.createElementNS("http://www.w3.org/2000/svg", "g"); grp.innerHTML = `<circle cx="0" cy="0" r="11" fill="#1f8a8a"/><path d="M-5 10 q-4 14 0 28 q-4 14 0 28" fill="none" stroke="#c8902a" stroke-width="3"/><path class="t2" d="M5 10 q4 14 0 28 q4 14 0 28" fill="none" stroke="#c8902a" stroke-width="3"/>`; grp.dataset.i = i; g.appendChild(grp); return grp; };
    // tails(list, n): show two tails (phospholipid) or one tail (fatty acid, used only for the micelle)
    const tails = (list, n) => list.forEach((it) => { const t = it.querySelector(".t2"); if (t) t.style.opacity = n === 1 ? 0 : 1; });
    const items = Array.from({ length: N * 2 }, (_, i) => lip(i));
    const place = (grp, x, y, rot, sc = 1) => { grp.style.transition = reduced() ? "none" : "transform .9s ease"; grp.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`; };
    const water = () => { $("#top", svg).setAttribute("fill", "#e4ebf5"); $("#topL", svg).textContent = "water (aqueous, polar)"; labels.style.opacity = 0; tails(items, 2); };
    // Head sits at the group origin and the tails extend along local +y (66 px at scale 1). To point the tails at a
    // centre from a head placed at angle a, rotate by a + 90°; to point them away, a − 90°.
    const ring = (list, cx, cy, R, inward, sc) => list.forEach((it, k) => { const a = (k / list.length) * 360; const rad = a * Math.PI / 180; it.style.opacity = 1; place(it, cx + R * Math.cos(rad), cy + R * Math.sin(rad), inward ? a + 90 : a - 90, sc); });
    const layouts = {
      closed() { water(); const sc = 0.55; tails(items.slice(0, 14), 1); ring(items.slice(0, 14), 160, 150, 36, true, sc); ring(items.slice(14, 32), 490, 150, 100, true, sc); ring(items.slice(32, 42), 490, 150, 28, false, sc); labels.style.opacity = 1; note.textContent = "Every tail is shielded from water; every head touches water."; expl.innerHTML = "<strong>Self-assembly.</strong> Lipids with a polar head added to water spontaneously form closed structures, not flat sheets, because a sheet would leave tails exposed at its edges. Phospholipids, with two tails, pack as a <strong>bilayer</strong> that closes on itself into a <strong>vesicle</strong> (liposome) with water inside and outside (right). A cell membrane is a vesicle on a cellular scale; the flat bilayer drawn in textbooks is a small section of it. For comparison, lipids with only <em>one</em> tail, such as fatty acids, pack into a <strong>micelle</strong> (left): a single layer curled into a ball with the tails meeting in the centre. Phospholipids do not usually form micelles."; },
      water() { water(); items.forEach((it, i) => { it.style.opacity = 1; const row = i < N ? 0 : 1; const x = 40 + (i % N) * 32; place(it, x, row === 0 ? 84 : 216, row === 0 ? 0 : 180); }); note.textContent = ""; expl.innerHTML = "<strong>Bilayer (a section through a membrane).</strong> With water on both sides, the hydrophilic phosphate heads face the water on each surface and the hydrophobic fatty acid tails point inwards, away from water. This is the arrangement in all cell membranes (see 3.1.4.1); in a real membrane the sheet continues and closes round the cell, so there are no exposed edges."; },
      surface() { tails(items, 2); items.forEach((it, i) => { if (i < N) { place(it, 40 + i * 32, 170, 180); it.style.opacity = 1; } else { it.style.opacity = 0; place(it, 40 + (i - N) * 32, 400, 0); } }); $("#top", svg).setAttribute("fill", "#f6f8f7"); $("#topL", svg).textContent = "air (non-polar)"; labels.style.opacity = 0; note.textContent = ""; expl.innerHTML = "<strong>Monolayer.</strong> At a water–air surface a single layer forms: heads in the water, tails pointing up into the air. This shows that it is the water, not the lipid, that drives the arrangement."; },
      scatter() { water(); items.forEach((it, i) => { it.style.opacity = 1; place(it, 40 + ((i * 97) % 640), 40 + ((i * 53) % 220), (i * 67) % 360); }); note.textContent = "Tails in contact with water: unstable."; expl.innerHTML = "<strong>Random.</strong> Hydrophobic tails are exposed to water. Press <em>Arrange</em> to see them spontaneously self-assemble into a closed bilayer (a vesicle), shown beside a micelle of one-tailed lipids for comparison. These are the lowest-energy arrangements because every tail is shielded from water and every head interacts with it."; },
    };
    $("#env", host).addEventListener("change", (e) => layouts[e.target.value]());
    $("#arrange", host).addEventListener("click", () => { $("#env", host).value = "closed"; layouts.closed(); });
    layouts.scatter();
  };

  // ---------- Peptide bond (3.1.1.4) ----------
  B.interactives.peptide = function (spec, host) {
    host.innerHTML = head(spec, "schematic, real connectivity") + `
      <div class="row"><button class="btn primary" id="p-cond">Condensation →</button><button class="btn" id="p-hyd">← Hydrolysis</button><label class="small"><input type="checkbox" id="p-step"> step by step (no animation)</label></div>
      <svg id="psvg" viewBox="0 0 760 210" style="width:100%;max-width:760px;display:block;margin:1rem auto" role="img" aria-label="animation of peptide bond formation between two amino acids">
        <g id="aa1">
          ${T(130, 30, "amino acid 1", { s: 12, c: "#6b7d8f" })}
          ${T(40, 100, "H₂N", { w: 700 })}<line x1="62" y1="96" x2="86" y2="96" stroke="#16263a" stroke-width="2"/>
          ${T(96, 100, "C", { w: 700 })}<line x1="96" y1="84" x2="96" y2="66" stroke="#16263a" stroke-width="2"/>${T(96, 62, "H", {})}<line x1="96" y1="106" x2="96" y2="124" stroke="#16263a" stroke-width="2"/>${T(96, 140, "R₁", { w: 700, c: "#6b9a7f" })}
          <line x1="106" y1="96" x2="130" y2="96" stroke="#16263a" stroke-width="2"/>${T(140, 100, "C", { w: 700 })}
          <line x1="137" y1="86" x2="137" y2="66" stroke="#16263a" stroke-width="2"/><line x1="143" y1="86" x2="143" y2="66" stroke="#16263a" stroke-width="2"/>${T(140, 62, "O", { w: 700 })}
          <g id="oh1"><line x1="150" y1="96" x2="170" y2="96" stroke="#166f70" stroke-width="2"/>${T(186, 100, "OH", { w: 700, c: "#166f70" })}</g>
        </g>
        <g id="aa2">
          ${T(470, 30, "amino acid 2", { s: 12, c: "#6b7d8f" })}
          <g id="h2">${T(342, 100, "H", { w: 700, c: "#166f70" })}<line x1="352" y1="96" x2="370" y2="96" stroke="#166f70" stroke-width="2"/></g>
          ${T(382, 100, "N", { w: 700 })}<line x1="382" y1="106" x2="382" y2="124" stroke="#16263a" stroke-width="2"/>${T(382, 140, "H", {})}
          <line x1="392" y1="96" x2="416" y2="96" stroke="#16263a" stroke-width="2"/>${T(426, 100, "C", { w: 700 })}<line x1="426" y1="84" x2="426" y2="66" stroke="#16263a" stroke-width="2"/>${T(426, 62, "H", {})}<line x1="426" y1="106" x2="426" y2="124" stroke="#16263a" stroke-width="2"/>${T(426, 140, "R₂", { w: 700, c: "#6b9a7f" })}
          <line x1="436" y1="96" x2="460" y2="96" stroke="#16263a" stroke-width="2"/>${T(470, 100, "C", { w: 700 })}
          <line x1="467" y1="86" x2="467" y2="66" stroke="#16263a" stroke-width="2"/><line x1="473" y1="86" x2="473" y2="66" stroke="#16263a" stroke-width="2"/>${T(470, 62, "O", { w: 700 })}
          <line x1="480" y1="96" x2="500" y2="96" stroke="#16263a" stroke-width="2"/>${T(516, 100, "OH", { w: 700 })}
        </g>
        <g id="pbond" opacity="0"><line x1="150" y1="96" x2="172" y2="96" stroke="#c8902a" stroke-width="3"/><rect x="124" y="50" width="70" height="62" rx="8" fill="none" stroke="#c8902a" stroke-width="2"/>${T(159, 128, "peptide bond", { s: 12, w: 700, c: "#8a5f12" })}</g>
        <g id="pwater" opacity="0"><circle cx="300" cy="170" r="16" fill="#e4ebf5" stroke="#1e3a5f" stroke-width="2"/>${T(300, 175, "H₂O", { s: 12, w: 700, c: "#1e3a5f" })}</g>
        <text id="plabel" x="380" y="202" text-anchor="middle" font-size="12" fill="#3c4f63">Carboxyl group of amino acid 1 faces the amino group of amino acid 2.</text>
      </svg>
      <p class="tiny muted">Limitation: the zwitterion forms, bond angles and the planar geometry of the peptide group are not shown. Connectivity C(=O)–N(H) is correct.</p>`;
    const svg = $("#psvg", host); const aa2 = $("#aa2", svg), oh1 = $("#oh1", svg), h2 = $("#h2", svg), pb = $("#pbond", svg), w = $("#pwater", svg), lbl = $("#plabel", svg);
    const set = (joined) => { const r = reduced() || $("#p-step", host).checked; aa2.style.transition = r ? "none" : "transform .9s ease"; aa2.style.transform = joined ? "translate(-200px,0)" : "translate(0,0)"; oh1.style.opacity = h2.style.opacity = joined ? 0 : 1; pb.style.transition = w.style.transition = r ? "none" : "opacity .5s ease .8s"; pb.style.opacity = w.style.opacity = joined ? 1 : 0; lbl.textContent = joined ? "Condensation: OH (carboxyl of 1) + H (amino of 2) leave as water; a C–N peptide bond forms: a dipeptide." : "Hydrolysis: water is added across the peptide bond, restoring –COOH and –NH₂."; };
    $("#p-cond", host).onclick = () => set(true); $("#p-hyd", host).onclick = () => set(false);
  };

  // ---------- Protein structure explorer (3.1.1.4) ----------
  B.interactives.proteinExplorer = function (spec, host) {
    // Side view of ONE chain coiled into a right-handed helix (same drawing as miniHelix in data/content/3.1.1.4.js):
    // front half of each turn bold, back half faint. Hydrogen bonds are drawn parallel to the axis between successive turns.
    const helixCoil = (cx, y0, r, pitch, turns, w, col) => {
      const pts = (from, to) => { const a = []; for (let t = from; t <= to + 1e-9; t += 0.1) a.push(`${(cx + r * Math.sin(t)).toFixed(1)} ${(y0 + pitch * t / (2 * Math.PI)).toFixed(1)}`); return "M" + a.join(" L"); };
      let s = "";
      for (let k = 0; k < turns; k++) { const t0 = k * 2 * Math.PI; s += `<path d="${pts(t0 + Math.PI, t0 + 2 * Math.PI)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity=".35"/><path d="${pts(t0, t0 + Math.PI)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; }
      return s;
    };
    const HX = 150, HY = 34, HR = 40, HP = 26; // helix centre x, top y, radius, pitch (one turn = 3.6 amino acids)
    const helixPanel = `<line x1="${HX}" y1="${HY - 4}" x2="${HX}" y2="${HY + 4 * HP + 4}" stroke="#6b7d8f" stroke-width="1" stroke-dasharray="2 4"/>${helixCoil(HX, HY, HR, HP, 4, 6, "#1f8a8a")}
        <g stroke="#c8902a" stroke-width="2" stroke-dasharray="4 3">${[0, 1, 2].map((k) => `<line x1="${HX + HR}" y1="${HY + HP / 4 + k * HP + 3}" x2="${HX + HR}" y2="${HY + HP / 4 + (k + 1) * HP - 3}"/><line x1="${HX - HR}" y1="${HY + 3 * HP / 4 + k * HP + 3}" x2="${HX - HR}" y2="${HY + 3 * HP / 4 + (k + 1) * HP - 3}"/>`).join("")}</g>
        ${T(HX + HR + 10, HY + HP / 4 + 4, "C=O", { s: 10, w: 600, a: "start" })}${T(HX + HR + 10, HY + HP / 4 + HP + 4, "N–H", { s: 10, w: 600, a: "start" })}
        ${T(250, 60, "one chain,", { s: 10, a: "start", c: "#6b7d8f" })}${T(250, 73, "coiled round", { s: 10, a: "start", c: "#6b7d8f" })}${T(250, 86, "an axis;", { s: 10, a: "start", c: "#6b7d8f" })}${T(250, 99, "3.6 amino acids", { s: 10, a: "start", c: "#6b7d8f" })}${T(250, 112, "per turn", { s: 10, a: "start", c: "#6b7d8f" })}
        ${T(180, 160, "hydrogen bonds (dashed) run along the axis, from the C=O", { s: 11, c: "#3c4f63" })}${T(180, 175, "of one amino acid to the N–H four amino acids further on", { s: 11, c: "#3c4f63" })}`;
    const beads = (seq, x0, y0, mutIdx = -1) => seq.map((r, i) => `<circle cx="${x0 + i * 30}" cy="${y0}" r="11" fill="${i === mutIdx ? "#c25f5f" : "#1f8a8a"}"/><text x="${x0 + i * 30}" y="${y0 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${r}</text>`).join("") + seq.slice(1).map((_, i) => `<line x1="${x0 + i * 30 + 11}" y1="${y0}" x2="${x0 + (i + 1) * 30 - 11}" y2="${y0}" stroke="#16263a" stroke-width="3"/>`).join("");
    const tertiarySVG = (denatured) => {
      const dy = denatured ? 60 : 0; const weak = denatured ? 0 : 1;
      return `<svg viewBox="0 0 720 250" width="720" role="img" aria-label="tertiary structure held by bonds between R groups${denatured ? ", denatured" : ""}">
        <path d="M60 40 q80 -16 160 0 t160 0 t160 0 t120 0" fill="none" stroke="#1f8a8a" stroke-width="6" stroke-linecap="round"/>
        <path d="M60 ${150 + dy} q80 16 160 0 t160 0 t160 0 t120 0" fill="none" stroke="#1f8a8a" stroke-width="6" stroke-linecap="round"/>
        <g opacity="${weak}"><line x1="150" y1="48" x2="150" y2="142" stroke="#c8902a" stroke-width="2" stroke-dasharray="4 3"/><rect x="132" y="75" width="36" height="14" fill="#fff"/><rect x="130" y="111" width="40" height="14" fill="#fff"/>${T(150, 86, "–OH", { s: 11, w: 700 })}${T(150, 122, "O=C–", { s: 11, w: 700 })}${T(150, 180, "hydrogen bond", { s: 11, c: "#8a5f12" })}</g>
        <g opacity="${weak}"><line x1="330" y1="48" x2="330" y2="142" stroke="#1e3a5f" stroke-width="2" stroke-dasharray="6 3"/><rect x="308" y="75" width="44" height="14" fill="#fff"/><rect x="308" y="111" width="44" height="14" fill="#fff"/>${T(330, 86, "–COO⁻", { s: 11, w: 700, c: "#1e3a5f" })}${T(330, 122, "⁺H₃N–", { s: 11, w: 700, c: "#1e3a5f" })}${T(330, 180, "ionic bond", { s: 11, c: "#1e3a5f" })}</g>
        <line x1="510" y1="48" x2="510" y2="${142 + dy}" stroke="#c25f5f" stroke-width="4"/><circle cx="510" cy="64" r="8" fill="#fff"/>${T(510, 68, "S", { s: 12, w: 700, c: "#c25f5f" })}<circle cx="510" cy="${126 + dy}" r="8" fill="#fff"/>${T(510, 130 + dy, "S", { s: 12, w: 700, c: "#c25f5f" })}${denatured ? T(530, 100, "disulfide bridge (covalent) remains", { s: 11, c: "#c25f5f", a: "start" }) : T(510, 180, "disulfide bridge (covalent)", { s: 11, c: "#c25f5f" })}
        <g opacity="${weak}"><ellipse cx="650" cy="96" rx="40" ry="18" fill="#e2efe6" stroke="#6b9a7f"/>${T(650, 100, "hydrophobic core", { s: 10, c: "#3c4f63" })}</g>
        ${T(360, denatured ? 240 : 212, denatured ? "Heated: hydrogen and ionic bonds broken, chain unfolds; the covalent disulfide bridge and peptide bonds remain." : "solid = covalent; dashed = weaker interactions between R groups (schematic: two stretches of one folded chain)", { s: 11, c: "#3c4f63" })}</svg>`;
    };
    const views = {
      1: { title: "Primary structure", svg: `<svg viewBox="0 0 720 120" width="720" role="img" aria-label="primary structure as a sequence of amino acids">${T(30, 30, "N", { a: "start", w: 700 })}${T(690, 30, "C", { a: "end", w: 700 })}${beads(["Gly", "Ala", "Ser", "Cys", "Leu", "Lys", "Glu", "Val", "His", "Cys", "Pro", "Phe", "Asp", "Arg", "Tyr", "Thr", "Met", "Ile", "Asn", "Gln", "Trp"], 50, 60)}${T(360, 105, "the sequence of amino acids, held by peptide bonds (covalent)", { s: 12, c: "#3c4f63" })}</svg>`,
        text: "The primary structure is the sequence of amino acids in the polypeptide, determined by the base sequence of the gene (3.1.8). The only bonds are covalent peptide bonds. Change one amino acid and every higher level can change." },
      2: { title: "Secondary structure", svg: `<svg viewBox="0 0 720 200" width="720" role="img" aria-label="alpha helix and beta pleated sheet held by hydrogen bonds">
        ${T(HX, 20, "α-helix", { w: 700 })}${helixPanel}
        ${T(540, 24, "β-pleated sheet", { w: 700 })}<path d="M420 55 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10" fill="none" stroke="#6b9a7f" stroke-width="6"/><path d="M420 95 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10" fill="none" stroke="#6b9a7f" stroke-width="6"/><path d="M420 135 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10 l30 -10 l30 10" fill="none" stroke="#6b9a7f" stroke-width="6"/>
        <g stroke="#c8902a" stroke-width="2" stroke-dasharray="4 3"><line x1="450" y1="48" x2="450" y2="102"/><line x1="510" y1="48" x2="510" y2="102"/><line x1="570" y1="48" x2="570" y2="102"/><line x1="630" y1="48" x2="630" y2="102"/><line x1="480" y1="100" x2="480" y2="128"/><line x1="540" y1="100" x2="540" y2="128"/><line x1="600" y1="100" x2="600" y2="128"/><line x1="660" y1="100" x2="660" y2="128"/></g>${T(540, 175, "hydrogen bonds (dashed) between neighbouring strands", { s: 11, c: "#3c4f63" })}</svg>`,
        text: "Hydrogen bonds between the C=O of one peptide bond and the N–H of another coil the chain into an α-helix or fold it into a β-pleated sheet. In the α-helix a single chain coils, and each C=O forms a hydrogen bond with the N–H four amino acids further along, so the bonds run parallel to the axis between one turn and the next. In a β-pleated sheet, neighbouring stretches of chain lie side by side and are hydrogen bonded to each other. These hydrogen bonds involve backbone groups, but the R groups along the sequence decide which regions form helices or sheets, so secondary structure still depends on primary structure." },
      3: { title: "Tertiary structure", svg: tertiarySVG(false),
        text: "Further folding gives the overall 3D shape. It is held by interactions between R groups: hydrogen bonds, ionic bonds between oppositely charged R groups, disulfide bridges (strong covalent S–S bonds between two cysteines) and hydrophobic interactions. The specification names hydrogen bonds and disulfide bridges. This shape creates the active site of an enzyme or the binding site of an antibody." },
      4: { title: "Quaternary structure", svg: `<svg viewBox="0 0 720 200" width="720" role="img" aria-label="quaternary structure: four polypeptide subunits of haemoglobin each with a haem group">
        ${[[250, 62, "α", "#d6efec", "#1f8a8a"], [340, 62, "β", "#e2efe6", "#6b9a7f"], [250, 142, "β", "#e2efe6", "#6b9a7f"], [340, 142, "α", "#d6efec", "#1f8a8a"]].map(([x, y, l, f, st]) => `<path d="M${x - 50} ${y} c0 -40 40 -45 60 -30 c30 -20 60 20 40 45 c10 30 -40 45 -60 25 c-30 15 -50 -10 -40 -40z" fill="${f}" stroke="${st}" stroke-width="3"/><circle cx="${x + 12}" cy="${y + 6}" r="8" fill="#c25f5f"/>${T(x - 18, y + 10, l, { w: 700, s: 15 })}`).join("")}
        ${T(540, 90, "● haem (prosthetic group with Fe²⁺)", { s: 11, c: "#c25f5f" })}${T(540, 110, "2 α + 2 β globin chains = 1 haemoglobin", { s: 11, c: "#3c4f63" })}${T(540, 128, "held by the same R-group interactions", { s: 11, c: "#3c4f63" })}</svg>`,
        text: "Some proteins consist of more than one polypeptide chain. Haemoglobin has four (two α and two β globins), each with a non-protein haem group (3.1.5.3). The chains are held by the same interactions as tertiary structure. Quaternary structure lets haemoglobin show cooperative binding, which the single-chain myoglobin cannot." },
    };
    host.innerHTML = head(spec) + `<div class="tabs" role="tablist" id="lvl">${[1, 2, 3, 4].map((n) => `<button role="tab" aria-selected="${n === 1}" data-l="${n}">${n}. ${views[n].title}</button>`).join("")}</div>
      <div class="figure"><div class="fig-view" id="pview"></div></div><div class="small" id="ptext"></div>
      <div class="card mt" style="background:var(--surface-2)"><div class="row"><strong class="small">What if…</strong><button class="btn sm" id="mut">one amino acid is substituted</button><button class="btn sm" id="heat">the protein is heated to 70 °C</button><button class="btn sm" id="reset">reset</button></div><div class="small mt" id="what"></div></div>`;
    const show = (n) => { $$("#lvl button", host).forEach((b) => b.setAttribute("aria-selected", b.dataset.l == n)); $("#pview", host).innerHTML = views[n].svg; $("#ptext", host).innerHTML = views[n].text; $("#what", host).innerHTML = ""; };
    $$("#lvl button", host).forEach((b) => b.addEventListener("click", () => show(+b.dataset.l)));
    $("#mut", host).onclick = () => { show(1); $("#pview", host).innerHTML = views[1].svg.replace(beads(["Gly", "Ala", "Ser", "Cys", "Leu", "Lys", "Glu", "Val", "His", "Cys", "Pro", "Phe", "Asp", "Arg", "Tyr", "Thr", "Met", "Ile", "Asn", "Gln", "Trp"], 50, 60), beads(["Gly", "Ala", "Ser", "Cys", "Leu", "Lys", "Val", "Val", "His", "Cys", "Pro", "Phe", "Asp", "Arg", "Tyr", "Thr", "Met", "Ile", "Asn", "Gln", "Trp"], 50, 60, 6)); $("#what", host).innerHTML = "<strong>Glu → Val in this example chain (red).</strong> A charged, hydrophilic R group is replaced by a non-polar, hydrophobic one, so the bonds that R group can form change. Inside the protein this could stop an ionic bond forming, so the chain folds differently; if the change is at an active or binding site, function is lost or altered. A change like this (glutamic acid to valine at position 6 of β-globin) causes sickle-cell anaemia. There the valine is on the <em>surface</em> of the molecule: the fold of each chain hardly changes, but the non-polar patch makes haemoglobin molecules stick to one another in low oxygen and form long fibres that distort red blood cells. (Mutations: 3.2.11.1.)"; };
    $("#heat", host).onclick = () => { show(3); $("#pview", host).innerHTML = tertiarySVG(true); $("#what", host).innerHTML = "<strong>Denaturation.</strong> Heat increases vibration, breaking hydrogen bonds and ionic bonds (not the covalent peptide bonds or disulfide bridges at this temperature). The tertiary structure unfolds, the active site loses its shape and the protein loses function. The primary structure is unchanged. (Enzymes: 3.1.3.2.)"; };
    $("#reset", host).onclick = () => show(1);
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
  B.interactives.cellExplorer = function (spec, host) {
    const art = B.cellArt; const data = spec.cell === "prokaryote" ? art.prokOrganelles : art.organelles;
    const svg = spec.cell === "animal" ? art.animalCell() : spec.cell === "plant" ? art.plantCell() : art.prokaryote();
    // only list structures that are actually drawn in this cell, so every button highlights something
    const present = data.filter((o) => (!o.only || o.only.includes(spec.cell)) && svg.includes(`data-org="${o.key}"`));
    host.innerHTML = head(spec, "click or tab to a structure") + `<div class="explorer"><div class="figure"><div class="fig-view">${svg}</div></div><div><div class="org-list">${present.map((o) => `<button class="btn sm" data-key="${esc(o.key)}" aria-pressed="false">${esc(o.name)}</button>`).join("")}</div><div class="card" id="orginfo" style="background:var(--surface-2)" aria-live="polite"><p class="muted small">Select a structure on the diagram or from the list.</p></div></div></div>`;
    const groups = $$("[data-org]", host); groups.forEach((g) => { g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); const o = present.find((x) => x.key === g.dataset.org); if (o) g.setAttribute("aria-label", o.name); });
    const show = (key) => { const o = present.find((x) => x.key === key); if (!o) return; groups.forEach((g) => g.classList.toggle("on", g.dataset.org === key)); $$(".org-list button", host).forEach((b) => b.setAttribute("aria-pressed", b.dataset.key === key)); $("#orginfo", host).innerHTML = h`<div class="row"><strong>${o.name}</strong><span class="badge ${o.membrane === "double" ? "navy" : o.membrane === "single" ? "teal" : ""}">${o.membrane === "double" ? "double membrane" : o.membrane === "single" ? "single membrane" : "no membrane"}</span>${o.size ? raw(h`<span class="badge">${o.size}</span>`) : ""}</div><p class="small mt"><strong>Structure.</strong> ${o.structure}</p><p class="small"><strong>Function.</strong> ${o.func}</p>${o.sf ? raw(h`<p class="small"><strong>Structure → function.</strong> ${o.sf}</p>`) : ""}${o.note ? raw(h`<p class="tiny muted">${o.note}</p>`) : ""}`; };
    groups.forEach((g) => { g.addEventListener("click", () => show(g.dataset.org)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(g.dataset.org); } }); });
    $$(".org-list button", host).forEach((b) => b.addEventListener("click", () => show(b.dataset.key)));
  };

  // ---------- Microscopy explorer ----------
  B.interactives.microscopy = function (spec, host) {
    const M = {
      light: { name: "Optical (light) microscope", how: "Visible light passes through the specimen and glass lenses magnify the image.", res: "about 0.2 µm (200 nm)", mag: "up to about ×1500 useful magnification", sees: ["whole cells", "nucleus", "cell wall", "chloroplasts (as green bodies)", "large vacuole"], notSees: ["ribosomes", "membrane detail", "cristae", "ER"], pros: ["living specimens can be viewed", "colour (natural or stained)", "cheap, portable, quick to prepare"], cons: ["low resolution: light's wavelength limits detail", "organelles mostly invisible or unclear"], colour: "#efe0d6" },
      tem: { name: "Transmission electron microscope (TEM)", how: "A beam of electrons passes through an ultra-thin, stained section; electromagnets focus it; denser parts absorb more electrons and appear darker.", res: "about 0.1 nm (0.0001 µm)", mag: "up to about ×1,000,000 or more", sees: ["all organelles in section", "double membranes", "cristae and thylakoids", "ribosomes"], notSees: ["living cells", "colour", "3D shape (one thin slice at a time)"], pros: ["highest resolution: electrons have a very short wavelength", "reveals ultrastructure"], cons: ["specimen must be dead, dehydrated, in a vacuum, very thin", "complex preparation can create artefacts", "image is black and white (colour is added afterwards)", "expensive"], colour: "#c4c4c4" },
      sem: { name: "Scanning electron microscope (SEM)", how: "Electrons are scanned across the surface of a coated specimen; electrons knocked off the surface are collected to build a 3D image.", res: "about 20 nm", mag: "up to about ×100,000", sees: ["3D surface of cells, tissues, organisms", "surface features such as flagella, cilia, pollen walls"], notSees: ["internal structures", "living cells", "colour"], pros: ["3D images", "thick specimens can be used (no sectioning)"], cons: ["lower resolution than TEM", "dead, coated specimens in a vacuum", "expensive"], colour: "#e9eeec" },
    };
    host.innerHTML = head(spec, "illustrative, not micrographs") + `<div class="tabs" role="tablist" id="mtabs">${Object.entries(M).map(([k, m], i) => `<button role="tab" aria-selected="${i === 0}" data-m="${k}">${m.name.replace(/ \(.*\)/, "")}</button>`).join("")}</div><div class="explorer"><div class="figure"><div class="fig-view" id="mview"></div></div><div id="minfo" class="card" style="background:var(--surface-2)" aria-live="polite"></div></div><div class="small mt" id="mphotos"></div>`;
    const panels = B.cellArt.microscopyPanels;
    const show = (k) => { const m = M[k]; $$("#mtabs button", host).forEach((b) => b.setAttribute("aria-selected", b.dataset.m === k)); const idx = { light: 0, tem: 1, sem: 2 }[k]; $("#mview", host).innerHTML = panels.replace(/<rect x="(20|267|514)" y="40"/g, (mm, x) => `<rect x="${x}" y="40" ${["20", "267", "514"][idx] === x ? 'stroke="#2b8dd6" stroke-width="4"' : ""}`); $("#minfo", host).innerHTML = h`<strong>${m.name}</strong><p class="small mt">${m.how}</p><p class="small"><strong>Resolution:</strong> ${m.res} · <strong>Magnification:</strong> ${m.mag}</p><p class="small"><strong>Can show:</strong> ${m.sees.join(", ")}.<br><strong>Cannot show:</strong> ${m.notSees.join(", ")}.</p><p class="small"><strong>Advantages:</strong> ${m.pros.join("; ")}.<br><strong>Limitations:</strong> ${m.cons.join("; ")}.</p>`; $("#mphotos", host).innerHTML = `<div class="grid grid-3">${B.views.photo(k === "light" ? "plant-cells-lm" : k === "tem" ? "mitochondrion-tem" : "bacteria-sem")}${B.views.photo(k === "light" ? "animal-cells-lm" : k === "tem" ? "chloroplast-tem" : "rbc-sem", {})}</div>`; };
    $$("#mtabs button", host).forEach((b) => b.addEventListener("click", () => show(b.dataset.m)));
    show("light");
  };

  // ---------- Differential centrifugation, step by step ----------
  B.interactives.centrifuge = function (spec, host) {
    const stages = [
      { t: "Homogenate", speed: "", pellet: null, sup: ["nuclei", "chloroplasts (plant tissue)", "mitochondria", "lysosomes", "ER fragments", "ribosomes"], info: "Tissue has been homogenised in a cold, isotonic, buffered solution and filtered. Everything smaller than a whole cell is suspended in the liquid." },
      { t: "Spin 1: low speed, short time", speed: "lowest", pellet: ["nuclei (the largest organelles)"], sup: ["chloroplasts (plant tissue)", "mitochondria", "lysosomes", "ER fragments", "ribosomes"], info: "How fast a component sediments depends mainly on its size (mass), and also on its density and shape, so the largest components, the nuclei, sediment first. The pellet is enriched in nuclei; the supernatant (liquid above) is poured into a fresh tube." },
      { t: "Spin 2: higher speed, longer", speed: "higher", pellet: ["chloroplasts (plant tissue only: these pellet first, at the lower end of this speed range)", "mitochondria"], sup: ["lysosomes", "ER fragments", "ribosomes"], info: "In plant tissue, chloroplasts sediment after the nuclei and before the mitochondria: they are larger than mitochondria, so they pellet at a slightly lower speed. Their size ranges overlap and broken chloroplasts are smaller, so in practice the chloroplast and mitochondrial fractions overlap. In animal tissue this pellet is enriched in mitochondria." },
      { t: "Spin 3: higher speed again", speed: "higher still", pellet: ["lysosomes", "then ER / membrane fragments (microsomes)"], sup: ["ribosomes"], info: "Lysosomes, then fragments of ER and other membranes, sediment. Separation of these is imperfect; each pellet is enriched in, not purely, one component." },
      { t: "Spin 4: highest speed, longest", speed: "highest", pellet: ["ribosomes"], sup: ["soluble cytoplasm (enzymes, small molecules)"], info: "Ribosomes, the smallest of the components listed, sediment last. What remains in solution is the soluble part of the cytoplasm." },
    ];
    host.innerHTML = head(spec, "schematic, order of magnitude only") + `<div class="frac-steps" id="fsteps">${stages.map((s, i) => `<button class="btn sm" data-i="${i}" aria-pressed="${i === 0}">${i}. ${esc(s.t.split(":")[0])}</button>`).join("")}</div>
      <div class="explorer mt"><div class="figure"><div class="fig-view"><svg id="fsvg" viewBox="0 0 420 260" width="420" role="img" aria-label="centrifuge tube showing pellet and supernatant"><path d="M150 20 l0 180 a60 60 0 0 0 120 0 l0 -180" fill="#fff" stroke="#16263a" stroke-width="3"/><path id="fsup" d="M154 60 l0 140 a56 56 0 0 0 112 0 l0 -140z" fill="#e6f6f1"/><path id="fpel" d="M166 230 a44 44 0 0 0 88 0z" fill="#1e3a5f" opacity="0"/><text id="fspeed" x="210" y="14" text-anchor="middle" font-size="12" fill="#3c4f63"></text></svg></div></div>
      <div class="card" style="background:var(--surface-2)" id="finfo" aria-live="polite"></div></div>
      <div class="card mt"><div class="row"><strong class="small">Check yourself:</strong><span class="small">after which spin is the pellet mainly mitochondria?</span><select id="fq"><option value="">choose…</option><option value="1">Spin 1</option><option value="2">Spin 2</option><option value="3">Spin 3</option><option value="4">Spin 4</option></select><span id="ffb" class="small"></span></div></div>`;
    const colours = [null, "#1e3a5f", "#c8902a", "#c25f5f", "#16263a"];
    const show = (i) => { const s = stages[i]; $$("#fsteps button", host).forEach((b) => b.setAttribute("aria-pressed", +b.dataset.i === i)); const pel = $("#fpel", host); pel.style.transition = matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "opacity .5s"; pel.style.opacity = s.pellet ? 1 : 0; if (colours[i]) pel.setAttribute("fill", colours[i]); $("#fsup", host).setAttribute("fill", ["#dfe8e3", "#e6f6f1", "#edf8f4", "#f3faf7", "#f8fcfa"][i]); $("#fspeed", host).textContent = s.speed ? `speed: ${s.speed}` : "before centrifugation"; $("#finfo", host).innerHTML = h`<strong>${s.t}</strong><p class="small mt">${s.info}</p>${s.pellet ? raw(h`<p class="small"><strong>Pellet enriched in:</strong> ${s.pellet.join("; ")}</p>`) : ""}<p class="small"><strong>Still in supernatant:</strong> ${s.sup.join(", ")}</p>`; };
    $$("#fsteps button", host).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    $("#fq", host).addEventListener("change", (e) => { const v = e.target.value; $("#ffb", host).innerHTML = !v ? "" : v === "2" ? '<span class="badge sage">Correct: nuclei first, then mitochondria (in plant tissue the chloroplasts pellet just before the mitochondria).</span>' : '<span class="badge rose">Not quite: nuclei pellet first (largest), mitochondria in the second spin.</span>'; });
    show(0);
  };

  // ---------- Prokaryote v eukaryote comparison toggle ----------
  B.interactives.prokEuk = function (spec, host) {
    const rows = [["Typical size", "0.5 to 5 µm", "10 to 100 µm"], ["Nucleus", "None: circular DNA free in the cytoplasm (nucleoid)", "DNA in a nucleus bounded by a double membrane (envelope)"], ["DNA", "Circular, not associated with proteins; often plasmids too", "Linear, associated with histone proteins, in chromosomes"], ["Membrane-bound organelles", "None", "Mitochondria, ER, Golgi, lysosomes, (chloroplasts, vacuole)"], ["Ribosomes", "Smaller: 70S", "Larger: 80S in cytoplasm (70S inside mitochondria and chloroplasts)"], ["Cell wall", "Always present; contains murein (peptidoglycan)", "Plants: cellulose; fungi: chitin; animals: none"], ["Other features", "Capsule, flagella and plasmids in some bacteria", "Cilia / flagella (with microtubules) in some cells"], ["Cell division", "Binary fission (3.2.10.3)", "Mitosis / meiosis (3.2.10.2, 3.1.9.1)"]];
    host.innerHTML = head(spec, "comparison") + `<div class="row mb"><button class="btn sm" id="pe-all" aria-pressed="true">Show all</button><button class="btn sm" id="pe-quiz" aria-pressed="false">Hide eukaryote column (self-test)</button></div><table id="petab"><thead><tr><th>Feature</th><th>Prokaryotic cell</th><th>Eukaryotic cell</th></tr></thead><tbody>${rows.map((r) => h`<tr><th>${r[0]}</th><td>${r[1]}</td><td class="euk">${r[2]}</td></tr>`).join("")}</tbody></table>`;
    const set = (quiz) => { $$("td.euk", host).forEach((td) => { td.style.color = quiz ? "transparent" : ""; td.style.background = quiz ? "var(--surface-2)" : ""; td.title = quiz ? "click to reveal" : ""; td.onclick = quiz ? () => { td.style.color = ""; } : null; }); $("#pe-all", host).setAttribute("aria-pressed", !quiz); $("#pe-quiz", host).setAttribute("aria-pressed", quiz); };
    $("#pe-all", host).onclick = () => set(false); $("#pe-quiz", host).onclick = () => set(true);
  };
})(window.BIO);
