// Enzyme interactives for 3.1.3 (loaded after interactives.js). Kinds: enzymeExplorer, lockKey, energyProfile,
// escAnimation, inhibitionCompare, denatureExplorer (rateSim and graphChallenge removed in the release review, 2026-11-15). All drawings are schematic and say so;
// all numbers come from B.enzymeModel (documented in data/content/_enzyme-art.js). Animations honour reduced motion.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, raw, el, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || (B.store.get().prefs || {}).reducedMotion;
  // Release review 2026-11-15: no developer badges ("documented model", "illustrative model") for students; the badge
  // argument is kept so existing calls do not change, but it is no longer shown.
  const head = (spec) => h`<div class="card-head"><h3>${spec.title}</h3></div>` + (spec.note ? h`<p class="small muted">${spec.note}</p>` : "");
  const A = () => B.enzymeArt, M = () => B.enzymeModel;
  const C = () => A().colours;
  // simple tween helper: calls fn(t) for t 0..1 over ms (instant when reduced motion)
  function tween(ms, fn, done) { if (reduced()) { fn(1); done && done(); return; } const t0 = performance.now(); const step = (now) => { const t = Math.min(1, Math.max(0, now - t0) / ms); fn(t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t); if (t < 1) requestAnimationFrame(step); else done && done(); }; requestAnimationFrame(step); }

  // ---------- A. Enzyme structure explorer ----------
  B.interactives.enzymeExplorer = function (spec, host) {
    const { TEAL, AMBER, ROSE, NAVY, GREY } = C();
    host.innerHTML = head(spec) + `
      ${B.ix.split(`<div class="figure"><div class="fig-view" id="ev"></div></div>`, `<div class="row wrap" id="eb"><button class="btn sm primary" data-s="native">Native enzyme</button><button class="btn sm" data-s="residues">Show active-site amino acids</button><button class="btn sm" data-s="substrate">Add the substrate</button><button class="btn sm" data-s="wrong">Try a different molecule</button><button class="btn sm" data-s="mutant">Change one amino acid</button></div><div class="card" id="ei"></div>`, { label: "Enzyme explorer controls" })}`;
    const info = {
      native: ["Tertiary structure makes the active site", "The polypeptide folds into a precise 3D shape held by hydrogen bonds, ionic bonds, disulfide bridges and hydrophobic interactions. A small cleft on the surface, the <strong>active site</strong>, has a shape and chemistry determined by that folding."],
      residues: ["A few amino acids do the work", "Typically 3 to 12 amino-acid side chains line the active site. They come from different places in the primary sequence and are brought together only by folding, so the whole tertiary structure matters even though most of the protein never touches the substrate."],
      substrate: ["Complementary shape and charge", "The substrate fits the active site because the two are <strong>complementary</strong>: shape, and the position of charged and polar groups that can form temporary bonds. The enzyme–substrate complex forms."],
      wrong: ["Specificity", "A molecule with a different shape cannot form the complex, however many collisions occur. This is why each enzyme catalyses one reaction or one type of reaction: specificity is a consequence of the tertiary structure."],
      mutant: ["Structure decides function", "Replacing a single amino acid that lines the active site (or one that holds the fold together) changes the site's shape or charge. The substrate no longer binds properly and activity falls or is lost, even though 99% of the sequence is unchanged."],
    };
    const draw = (s) => {
      const open = s === "mutant" ? 0.9 : 0;
      let extra = "";
      if (s === "residues" || s === "substrate") extra += [[116, 62], [150, 98], [184, 62]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${[AMBER, ROSE, NAVY][i]}"/>`).join("") + `<text x="150" y="134" text-anchor="middle" font-size="13" fill="${GREY}">R groups lining the site</text>`;
      if (s === "substrate") extra += `<path d="${A().substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5" opacity=".92"/>`;
      if (s === "wrong") extra += `<path d="${A().wrongSubstratePath(150, 42)}" fill="#eee" stroke="${GREY}" stroke-width="2.5"/><text x="190" y="-14" text-anchor="start" font-size="13" fill="${GREY}">does not fit</text>`;
      if (s === "mutant") extra += `<circle cx="150" cy="96" r="8" fill="${ROSE}"/><text x="150" y="134" text-anchor="middle" font-size="13" fill="${ROSE}">substituted residue:</text><text x="150" y="150" text-anchor="middle" font-size="13" fill="${ROSE}">site distorted</text><path d="${A().substratePath(150, 36).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5" opacity=".6"/>`;
      // one fixed viewBox for every state (release review 2026-11-15), so the drawing never changes size and the raised
      // substrate of the "change one amino acid" state stays inside it
      $("#ev", host).innerHTML = `<svg viewBox="0 -44 300 290" width="320" role="img" aria-label="enzyme explorer"><g transform="translate(0,10)"><path d="${A().enzymePath(open)}" fill="#d6efec" stroke="${TEAL}" stroke-width="2.5"/>${extra}</g></svg>`;
      $("#ei", host).innerHTML = `<h4>${info[s][0]}</h4><p class="small">${info[s][1]}</p>`;
      $$("#eb button", host).forEach((b) => b.classList.toggle("primary", b.dataset.s === s));
    };
    $$("#eb button", host).forEach((b) => b.addEventListener("click", () => draw(b.dataset.s)));
    draw("native");
  };

  // ---------- B. Lock-and-key v induced fit ----------
  B.interactives.lockKey = function (spec, host) {
    const { TEAL, AMBER, GREY } = C();
    host.innerHTML = head(spec) + `
      <div class="row"><label class="small"><input type="radio" name="lkm" value="lock" checked> Lock and key</label><label class="small"><input type="radio" name="lkm" value="induced"> Induced fit</label><button class="btn primary" id="lk-play">Bind substrate</button><button class="btn" id="lk-reset">Reset</button></div>
      <div class="explorer mt"><div class="exp-view"><svg id="lk" viewBox="0 -85 300 325" width="300" role="img" aria-label="substrate binding animation"><path id="lk-e" d="" fill="#d6efec" stroke="${TEAL}" stroke-width="2.5"/><path id="lk-s" d="" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5"/><text id="lk-t" x="150" y="-70" text-anchor="middle" font-size="11" fill="${GREY}"></text></svg></div><div class="exp-info" id="lk-i"></div></div>`;
    const mode = () => $('input[name="lkm"]:checked', host).value;
    const E = $("#lk-e", host), S = $("#lk-s", host), T = $("#lk-t", host), I = $("#lk-i", host);
    let bound = false;
    const render = (open, sy) => { E.setAttribute("d", A().enzymePath(open)); S.setAttribute("d", A().substratePath(150, sy).whole); };
    const reset = () => { bound = false; const open = mode() === "induced" ? 1 : 0; render(open, 10); T.textContent = mode() === "induced" ? "resting enzyme: site only roughly complementary" : "resting enzyme: site exactly complementary"; I.innerHTML = mode() === "induced" ? `<h4>Induced fit</h4><p class="small">Before binding, the active site is not a perfect match. As the substrate enters, the enzyme's tertiary structure shifts slightly so the site <strong>moulds around</strong> it. This also puts strain on the substrate's bonds, which helps lower the activation energy. Proposed by Koshland (1958) from biochemical evidence; X-ray structures with and without substrate later confirmed that many enzymes change shape on binding.</p>` : `<h4>Lock and key</h4><p class="small">The active site is a rigid shape exactly complementary to the substrate, like a lock and its key (Fischer, 1894). It explains specificity well but treats the enzyme as rigid, which later evidence (X-ray structures with and without substrate) showed is not the case for many enzymes.</p>`; };
    $$('input[name="lkm"]', host).forEach((r) => r.addEventListener("change", reset)); $("#lk-reset", host).addEventListener("click", reset);
    $("#lk-play", host).addEventListener("click", () => { if (bound) return; bound = true; const ind = mode() === "induced"; T.textContent = "substrate approaching…"; tween(900, (t) => { render(ind ? 1 - t * 0.9 : 0, 10 + t * 88); }, () => { tween(ind ? 500 : 1, (t) => render(ind ? 0.1 - t * 0.1 : 0, 98), () => { T.textContent = "enzyme–substrate complex formed"; I.innerHTML += `<p class="small"><strong>What you saw:</strong> ${ind ? "the site changed shape as the substrate bound (the drawing exaggerates the movement; real changes are usually small and differ between enzymes)." : "the substrate dropped into an unchanging site. Note that this model cannot explain how binding strains the substrate."}</p>`; }); }); });
    reset();
  };

  // ---------- C. Activation energy graph ----------
  B.interactives.energyProfile = function (spec, host) {
    host.innerHTML = head(spec, "model diagram") + `
      ${B.ix.split(`<div id="ep-view"></div>`, `
      <div class="row"><label class="small"><input type="checkbox" id="ep-u" checked> uncatalysed pathway</label><label class="small"><input type="checkbox" id="ep-c" checked> catalysed pathway</label></div>
      <div class="card" id="ep-q"><p class="small"><strong>Check:</strong> click the part of the diagram named below.</p><div class="row"><span class="badge navy" id="ep-ask"></span><span id="ep-fb" class="small"></span><button class="btn sm" id="ep-next">Next</button></div></div>`)}`;
    const targets = [["reactants (substrate)", "reactants"], ["products", "products"], ["activation energy without the enzyme", "ea-u"], ["activation energy with the enzyme", "ea-c"], ["overall energy change", "dh"]];
    let k = 0;
    const draw = () => {
      // invisible hit areas over the named features are drawn by the art function itself (hits: true)
      $("#ep-view", host).innerHTML = A().energyProfile({ showUncat: $("#ep-u", host).checked, showCat: $("#ep-c", host).checked, hits: true });
      const svg = $("svg", $("#ep-view", host));
      $$(".hit", svg).forEach((r) => r.addEventListener("click", () => { const ok = r.dataset.id === targets[k][1]; $("#ep-fb", host).innerHTML = ok ? `<span style="color:var(--sage-ink)">✓ Correct.</span>` : `<span style="color:var(--rose-ink)">✗ Not that one: try again.</span>`; r.setAttribute("fill", ok ? "rgba(107,154,127,.25)" : "rgba(180,80,79,.2)"); setTimeout(() => r.setAttribute("fill", "transparent"), 700); }));
    };
    const ask = () => { $("#ep-ask", host).textContent = targets[k][0]; $("#ep-fb", host).textContent = ""; };
    $("#ep-next", host).addEventListener("click", () => { k = (k + 1) % targets.length; ask(); });
    $$("#ep-u, #ep-c", host).forEach((c) => c.addEventListener("change", draw));
    draw(); ask();
  };

  // ---------- D. Enzyme-substrate complex animation ----------
  B.interactives.escAnimation = function (spec, host) {
    const { TEAL, AMBER, SAGE, GREY } = C();
    host.innerHTML = head(spec) + `
      <div class="row"><button class="btn primary" id="esc-play">Play cycle</button><button class="btn" id="esc-step">Step</button><button class="btn" id="esc-loop">Loop ×5</button><span class="badge teal" id="esc-count">reactions catalysed: 0</span></div>
      <div class="explorer mt"><div class="exp-view"><svg viewBox="0 -105 300 335" width="300" role="img" aria-label="enzyme substrate complex cycle"><path id="esc-e" d="${A().enzymePath(0)}" fill="#d6efec" stroke="${TEAL}" stroke-width="2.5"/><g id="esc-s"></g><text id="esc-t" x="150" y="-90" text-anchor="middle" font-size="11.5" font-weight="600" fill="${GREY}"></text></svg></div><div class="exp-info" id="esc-i"><h4>One catalytic cycle</h4><ol class="small"><li>Substrate collides with the active site in the right orientation.</li><li>Enzyme–substrate complex: the substrate is held by temporary bonds; its own bonds are strained.</li><li>Reaction occurs; enzyme–product complex.</li><li>Products no longer fit and leave; the enzyme is unchanged and immediately available again.</li></ol><p class="tiny muted">Because the enzyme is not used up, a small amount catalyses many reactions. In the animation the splitting reaction is a hydrolysis-type example; the same cycle applies to synthesis reactions, where two substrates join.</p></div></div>`;
    const S = $("#esc-s", host), T = $("#esc-t", host); let count = 0, running = false, stage = 0;
    const subAt = (y, split = 0, product = false) => { const p = A().substratePath(150, y, split); const f = product ? "#e2efe6" : "#fbf0d8", st = product ? SAGE : AMBER; S.innerHTML = `<path d="${p.left}" fill="${f}" stroke="${st}" stroke-width="2.5"/><path d="${p.right}" fill="${f}" stroke="${st}" stroke-width="2.5"/>`; };
    const stages = [
      (done) => { T.textContent = "Stage 1: substrate collides with the active site"; tween(700, (t) => subAt(-10 + 108 * t), done); },
      (done) => { T.textContent = "Stage 2: enzyme–substrate complex"; subAt(98); setTimeout(done, reduced() ? 0 : 500); },
      (done) => { T.textContent = "Stage 3: bonds broken; enzyme–product complex"; tween(600, (t) => subAt(98, 0.35 * t, t > 0.5), done); },
      (done) => { T.textContent = "Stage 4: products released; enzyme reused"; tween(700, (t) => subAt(98 - 110 * t, 0.35 + 1.2 * t, true), () => { count++; $("#esc-count", host).textContent = `reactions catalysed: ${count}`; S.innerHTML = ""; done(); }); },
    ];
    const run = (n, cb) => { if (running) return; running = true; let i = 0; const next = () => { if (i < stages.length) stages[i++](next); else { running = false; if (--n > 0) run(n, cb); else cb && cb(); } }; next(); };
    $("#esc-play", host).addEventListener("click", () => run(1)); $("#esc-loop", host).addEventListener("click", () => run(5));
    $("#esc-step", host).addEventListener("click", () => { if (running) return; running = true; stages[stage]((() => { running = false; stage = (stage + 1) % stages.length; })); });
    subAt(-10); T.textContent = "press Play";
  };

  // ---------- G. Inhibition comparison ----------
  B.interactives.inhibitionCompare = function (spec, host) {
    const { TEAL, AMBER, ROSE } = C();
    host.innerHTML = head(spec, "simplified model") + `
      ${B.ix.split(`<div id="ic-g"></div>`, `
      <div class="ix-group"><label class="small">Substrate concentration: <strong><span id="ic-sv">4</span> mmol dm⁻³</strong><input type="range" id="ic-s" min="0.5" max="30" value="4" step="0.5" style="width:220px;accent-color:var(--teal)"></label><label class="small">Inhibitor concentration: <strong><span id="ic-iv">1</span> mmol dm⁻³</strong><input type="range" id="ic-i" min="0" max="5" value="1" step="0.25" style="width:220px;accent-color:var(--teal)"></label></div>
      <div class="ix-group"><div class="card"><div id="ic-c"></div></div><div class="card"><div id="ic-n"></div></div></div>`)}
      <p class="tiny muted mt">This is a simplified model of the two idealised types of inhibition in the specification.</p>`;
    const bar = (v, col) => `<div class="progress" style="height:14px"><span style="width:${Math.min(100, v)}%;background:${col}"></span></div>`;
    const draw = () => {
      const S = +$("#ic-s", host).value, I = +$("#ic-i", host).value; $("#ic-sv", host).textContent = S; $("#ic-iv", host).textContent = I;
      const v0 = M().rate({ S }), vc = M().rate({ S, inhibitor: "competitive", I }), vn = M().rate({ S, inhibitor: "noncompetitive", I });
            // one plain line per inhibitor (release review 2026-11-15)
      $("#ic-c", host).innerHTML = `<p class="small" style="margin:0"><strong style="color:var(--amber-ink)">Competitive:</strong> rate ${Math.round((100 * vc) / v0)} % of the rate without inhibitor. Raise the substrate concentration and the gap closes: substrate out-competes the inhibitor.</p>${bar((100 * vc) / v0, AMBER)}`;
      $("#ic-n", host).innerHTML = `<p class="small" style="margin:0"><strong style="color:var(--rose-ink)">Non-competitive:</strong> rate ${Math.round((100 * vn) / v0)} % of the rate without inhibitor, at any substrate concentration: inhibited enzyme molecules have a distorted active site.</p>${bar((100 * vn) / v0, ROSE)}`;
      const xs = M().range(0, 30, 90);
      $("#ic-g", host).innerHTML = A().graph({ xLabel: "substrate concentration / mmol dm⁻³", yLabel: "initial rate / arbitrary units", xmax: 30, ymax: 120, width: 560, height: 280, curves: [{ pts: M().curve(xs, (s) => M().rate({ S: s })), color: TEAL, label: "no inhibitor", labelPos: { x: 14, y: 107, a: "start" } }, { pts: M().curve(xs, (s) => M().rate({ S: s, inhibitor: "competitive", I })), color: AMBER, label: "competitive", labelPos: { x: 29.5, y: Math.min(112, M().rate({ S: 29.5, inhibitor: "competitive", I }) - 9), a: "end" } }, { pts: M().curve(xs, (s) => M().rate({ S: s, inhibitor: "noncompetitive", I })), color: ROSE, label: "non-competitive", labelPos: { x: 29.5, y: Math.max(6, M().rate({ S: 29.5, inhibitor: "noncompetitive", I }) - 9), a: "end" } }], marks: [{ x: S, y: vc, color: AMBER }, { x: S, y: vn, color: ROSE }], fs: 12, hlines: [{ y: 100, label: "maximum rate without inhibitor", la: "start" }], aria: "rate against substrate concentration with each inhibitor at the chosen concentration" });
    };
    $$("input", host).forEach((i) => i.addEventListener("input", draw)); draw();
  };

  // ---------- H. Denaturation explorer ----------
  B.interactives.denatureExplorer = function (spec, host) {
    const { TEAL, AMBER, NAVY, ROSE, GREY } = C();
    host.innerHTML = head(spec) + `
      <div class="row"><label class="small">Temperature: <strong><span id="dn-tv">37</span> °C</strong><input type="range" id="dn-t" min="20" max="80" value="37" step="1" style="width:220px;accent-color:var(--teal)"></label><label class="small">pH: <strong><span id="dn-pv">7</span></strong><input type="range" id="dn-p" min="1" max="13" value="7" step="0.5" style="width:220px;accent-color:var(--teal)"></label></div>
      <div class="explorer mt"><div class="exp-view" id="dn-v"></div><div class="exp-info" id="dn-i"></div></div>`;
    const draw = () => {
      const T = +$("#dn-t", host).value, pH = +$("#dn-p", host).value; $("#dn-tv", host).textContent = T; $("#dn-pv", host).textContent = pH.toFixed(1);
      const heat = Math.max(0, Math.min(1, (T - 46) / 16)), acid = Math.min(1, Math.abs(pH - 7) / 5); const d = Math.max(heat, acid * 0.9); // 0 native .. 1 fully denatured
      const bonds = [[70, 120], [205, 110], [110, 200], [185, 205], [150, 60], [95, 165]];
      const broken = Math.round(d * bonds.length);
      const wob = (i) => (d > 0.15 ? Math.sin(i * 1.7) * 14 * d : 0);
      const body = d < 0.95 ? `<path d="${A().enzymePath(Math.min(1, d * 1.6))}" fill="${d > 0.5 ? "#eef4f2" : "#d6efec"}" stroke="${d > 0.5 ? ROSE : TEAL}" stroke-width="2.5" transform="rotate(${d * 6} 150 140)"/>` : `<path d="M 30 150 C 50 110, 70 190, 95 150 S 135 100, 160 145 S 200 200, 220 150 S 255 105, 275 160" fill="none" stroke="${ROSE}" stroke-width="5" stroke-linecap="round"/>`; // fully denatured: an open, unfolded chain
      const bondSVG = bonds.map(([x, y], i) => `<line x1="${x}" y1="${y}" x2="${x + 24 + wob(i)}" y2="${y + 10 - wob(i) / 2}" stroke="${i < broken ? ROSE : NAVY}" stroke-width="2" stroke-dasharray="3 3" opacity="${i < broken ? 0.35 : 1}"/>${i < broken ? `<text x="${x + 10}" y="${y - 4}" font-size="10" fill="${ROSE}">✕</text>` : ""}`).join("");
      const sub = d < 0.5 ? `<path d="${A().substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5"/>` : `<path d="${A().substratePath(150, 38).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5" opacity=".7"/>`;
      $("#dn-v", host).innerHTML = A().enzymeSVG(`<g transform="translate(0,30)">${body}${d < 0.95 ? bondSVG : ""}${sub}${(d < 0.15 ? ["native: substrate binds"] : d < 0.5 ? ["weak bonds strained;", "binding less efficient"] : d < 0.95 ? ["tertiary structure disrupted:", "substrate no longer complementary"] : ["unfolded chain: denatured"]).map((l, k) => `<text x="150" y="${262 + k * 14}" text-anchor="middle" font-size="11" fill="${GREY}">${l}</text>`).join("")}</g>`, 300, 310, "denaturation explorer");
      const msg = d < 0.15 ? (T < 45 ? "Below the optimum: the hydrogen and ionic bonds (dashed) hold the tertiary structure, so the active site keeps its shape and the substrate binds." : "Near the optimum: the bonds (dashed) still hold the tertiary structure, so the active site keeps its shape and the substrate binds.") : d < 0.5 ? `${broken} of ${bonds.length} weak bonds are broken or strained. The active site is slightly distorted in some molecules, so fewer collisions lead to an enzyme–substrate complex.${heat >= acid * 0.9 ? " Near the optimum the faster collisions still outweigh this; above the optimum the rate falls." : ""} For pH this can be <strong>reversible</strong>; small changes alter the charges on R groups without unfolding the protein.` : d < 0.95 ? "Most weak bonds are broken; the chain has partly unfolded and the active site has lost its shape. Note the site is not simply 'smaller': its whole geometry and charge pattern are different. Heat denaturation is usually irreversible." : "Fully denatured: the polypeptide is a random coil. Peptide bonds are intact (primary structure unchanged), but with no tertiary structure there is no active site.";
      $("#dn-i", host).innerHTML = `<h4>${T} °C, pH ${pH.toFixed(1)}</h4><p class="small">${msg}</p><p class="tiny muted">Simplified drawing of an enzyme with an optimum near 50 °C and pH 7; real enzymes differ.</p>`;
    };
    $$("input", host).forEach((i) => i.addEventListener("input", draw)); draw();
  };
})(window.BIO);
