// Enzyme interactives for 3.1.3 (loaded after interactives.js). Kinds: enzymeExplorer, lockKey, energyProfile,
// escAnimation, rateSim, graphChallenge, inhibitionCompare, denatureExplorer. All drawings are schematic and say so;
// all numbers come from B.enzymeModel (documented in data/content/_enzyme-art.js). Animations honour reduced motion.
window.BIO = window.BIO || {}; window.BIO.interactives = window.BIO.interactives || {};
(function (B) {
  const { h, raw, el, $, $$, esc } = B.util;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || (B.store.get().prefs || {}).reducedMotion;
  const head = (spec, badge = "schematic") => h`<div class="card-head"><h3>${spec.title}</h3><span class="badge amber">${badge}</span></div><p class="small muted">${spec.note || ""}</p>`;
  const A = () => B.enzymeArt, M = () => B.enzymeModel;
  const C = () => A().colours;
  // simple tween helper: calls fn(t) for t 0..1 over ms (instant when reduced motion)
  function tween(ms, fn, done) { if (reduced()) { fn(1); done && done(); return; } const t0 = performance.now(); const step = (now) => { const t = Math.min(1, (now - t0) / ms); fn(t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t); if (t < 1) requestAnimationFrame(step); else done && done(); }; requestAnimationFrame(step); }

  // ---------- A. Enzyme structure explorer ----------
  B.interactives.enzymeExplorer = function (spec, host) {
    const { TEAL, AMBER, ROSE, NAVY, GREY } = C();
    host.innerHTML = head(spec) + `
      <div class="explorer"><div class="exp-view" id="ev"></div><div class="exp-info" id="ei"></div></div>
      <div class="row mt" id="eb"><button class="btn primary" data-s="native">Native enzyme</button><button class="btn" data-s="residues">Show active-site amino acids</button><button class="btn" data-s="substrate">Add the substrate</button><button class="btn" data-s="wrong">Try a different molecule</button><button class="btn" data-s="mutant">Change one amino acid</button></div>`;
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
      if (s === "residues" || s === "substrate") extra += [[116, 62], [150, 98], [184, 62]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${[AMBER, ROSE, NAVY][i]}"/>`).join("") + `<text x="150" y="128" text-anchor="middle" font-size="11" fill="${GREY}">R groups lining the site</text>`;
      if (s === "substrate") extra += `<path d="${A().substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5" opacity=".92"/>`;
      if (s === "wrong") extra += `<path d="${A().wrongSubstratePath(150, 42)}" fill="#eee" stroke="${GREY}" stroke-width="2.5"/><text x="150" y="-6" text-anchor="middle" font-size="11" fill="${GREY}">does not fit</text>`;
      if (s === "mutant") extra += `<circle cx="150" cy="96" r="8" fill="${ROSE}"/><text x="150" y="128" text-anchor="middle" font-size="11" fill="${ROSE}">substituted residue: site distorted</text><path d="${A().substratePath(150, 36).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5" opacity=".6"/>`;
      $("#ev", host).innerHTML = A().enzymeSVG(`<g transform="translate(0,20)"><path d="${A().enzymePath(open)}" fill="#d6efec" stroke="${TEAL}" stroke-width="2.5"/>${extra}</g>`, 300, 260, "enzyme explorer");
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
      <div class="row"><label class="small"><input type="checkbox" id="ep-u" checked> uncatalysed pathway</label><label class="small"><input type="checkbox" id="ep-c" checked> catalysed pathway</label></div>
      <div id="ep-view" class="mt"></div>
      <div class="card mt" id="ep-q"><p class="small"><strong>Check:</strong> click the part of the diagram named below.</p><div class="row"><span class="badge navy" id="ep-ask"></span><span id="ep-fb" class="small"></span><button class="btn sm" id="ep-next">Next</button></div></div>`;
    const targets = [["reactants (substrate)", "reactants"], ["products", "products"], ["activation energy without the enzyme", "ea-u"], ["activation energy with the enzyme", "ea-c"], ["overall energy change", "dh"]];
    let k = 0;
    const draw = () => {
      $("#ep-view", host).innerHTML = A().energyProfile({ showUncat: $("#ep-u", host).checked, showCat: $("#ep-c", host).checked });
      const svg = $("svg", $("#ep-view", host));
      // invisible hit areas over the named features
      const hits = [["reactants", 60, 150, 110, 40], ["products", 440, 185, 90, 50], ...($("#ep-u", host).checked ? [["ea-u", 300, 46, 110, 64]] : []), ...($("#ep-c", host).checked ? [["ea-c", 236, 110, 60, 70]] : []), ["dh", 480, 125, 50, 60]];
      hits.forEach(([id, x, y, w, hh]) => svg.insertAdjacentHTML("beforeend", `<rect class="hit" data-id="${id}" x="${x}" y="${y}" width="${w}" height="${hh}" fill="transparent" style="cursor:pointer"/>`));
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
      (done) => { T.textContent = "1 substrate collides with the active site"; tween(700, (t) => subAt(-10 + 108 * t), done); },
      (done) => { T.textContent = "2 enzyme–substrate complex"; subAt(98); setTimeout(done, reduced() ? 0 : 500); },
      (done) => { T.textContent = "3 bonds broken: enzyme–product complex"; tween(600, (t) => subAt(98, 0.35 * t, t > 0.5), done); },
      (done) => { T.textContent = "4 products released, enzyme reused"; tween(700, (t) => subAt(98 - 110 * t, 0.35 + 1.2 * t, true), () => { count++; $("#esc-count", host).textContent = `reactions catalysed: ${count}`; S.innerHTML = ""; done(); }); },
    ];
    const run = (n, cb) => { if (running) return; running = true; let i = 0; const next = () => { if (i < stages.length) stages[i++](next); else { running = false; if (--n > 0) run(n, cb); else cb && cb(); } }; next(); };
    $("#esc-play", host).addEventListener("click", () => run(1)); $("#esc-loop", host).addEventListener("click", () => run(5));
    $("#esc-step", host).addEventListener("click", () => { if (running) return; running = true; stages[stage]((() => { running = false; stage = (stage + 1) % stages.length; })); });
    subAt(-10); T.textContent = "press Play";
  };

  // ---------- E. Enzyme activity simulator (3.1.3.2) ----------
  B.interactives.rateSim = function (spec, host) {
    const { TEAL, GREY, ROSE, AMBER } = C();
    host.innerHTML = head(spec, "model, not data") + `
      <div class="sim">
        <div class="controls">
          <label>Temperature: <span id="rs-tv">37</span> °C<input type="range" id="rs-t" min="0" max="70" value="37" step="1"></label>
          <label>pH: <span id="rs-pv">7.0</span><input type="range" id="rs-p" min="1" max="13" value="7" step="0.5"></label>
          <label>Substrate concentration: <span id="rs-sv">10</span> mmol dm⁻³<input type="range" id="rs-s" min="0" max="30" value="10" step="0.5"></label>
          <label>Enzyme concentration: ×<span id="rs-ev">1.0</span><input type="range" id="rs-e" min="0.25" max="3" value="1" step="0.25"></label>
          <label>Inhibitor: <select id="rs-i"><option value="none">none</option><option value="competitive">competitive</option><option value="noncompetitive">non-competitive</option></select></label>
          <label>Inhibitor concentration: <span id="rs-iv">0</span> mmol dm⁻³<input type="range" id="rs-ic" min="0" max="5" value="0" step="0.25"></label>
          <label>Plot rate against: <select id="rs-x"><option value="T">temperature</option><option value="pH">pH</option><option value="S">substrate concentration</option><option value="E">enzyme concentration</option><option value="I">inhibitor concentration</option></select></label>
          <div class="readout" id="rs-out"></div>
        </div>
        <div class="stage"><div id="rs-g"></div><div class="small mt" id="rs-fb"></div></div>
      </div>
      <details class="mt small"><summary>The model behind the numbers</summary><p>Rate = Vmax × [S] ÷ (Km + [S]) (Michaelis–Menten). Vmax is proportional to enzyme concentration, rises with temperature (Q10 = 2) and is multiplied by a steep loss-of-activity term above about 50 °C and by a bell curve around pH 7. A competitive inhibitor raises the apparent Km by (1 + [I]/Ki); a non-competitive inhibitor divides Vmax by the same factor. Km = 2 and Ki = 1 mmol dm⁻³ are illustrative constants, not measured values for any real enzyme, and denaturation is treated as instantaneous. Rate is in arbitrary units (100 = the model enzyme at 37 °C, pH 7, saturating substrate). The model enzyme is generic, with an optimum of about 50 °C like many plant and bacterial enzymes; most human enzymes have optima nearer 37 to 40 °C.</p></details>`;
    const get = () => ({ T: +$("#rs-t", host).value, pH: +$("#rs-p", host).value, S: +$("#rs-s", host).value, E: +$("#rs-e", host).value, inhibitor: $("#rs-i", host).value, I: +$("#rs-ic", host).value });
    const feedback = (p, v) => {
      const bits = [];
      if (p.T >= 45 && p.T < 55) bits.push("Near this model enzyme's optimum (about 50 °C) the gain from faster, more frequent collisions is being balanced by the start of denaturation, so the rate is close to its maximum and no longer doubling.");
      else if (p.T >= 55) bits.push("Above about 50 °C the model's loss-of-activity term dominates: hydrogen and ionic bonds holding the tertiary structure break, the active site is no longer complementary and the rate collapses, whatever the other settings.");
      else if (p.T < 20) bits.push("At low temperature molecules have little kinetic energy, so enzyme–substrate collisions are infrequent; the enzyme is not denatured, just slow.");
      else bits.push("Between about 20 and 45 °C the rate roughly doubles for every 10 °C rise (Q10 ≈ 2) because collisions are more frequent and more energetic.");
      if (Math.abs(p.pH - 7) >= 2.5) bits.push("Far from the optimum pH, H⁺ or OH⁻ ions alter the charges on amino-acid side chains, breaking ionic and hydrogen bonds; binding falls and, at extremes, the enzyme denatures.");
      if (p.S < M().Km * 2) bits.push("Substrate concentration is limiting: many active sites are empty, so adding substrate raises the rate almost proportionally.");
      else if (p.S > M().Km * 8) bits.push("The enzyme is close to saturation: nearly every active site is occupied, so extra substrate barely changes the rate; only more enzyme (or a change in conditions) would.");
      if (p.inhibitor === "competitive" && p.I > 0) bits.push("Competitive inhibitor: it occupies active sites, but raising substrate concentration out-competes it, so Vmax is unchanged.");
      if (p.inhibitor === "noncompetitive" && p.I > 0) bits.push("Non-competitive inhibitor: bound away from the active site, it distorts the enzyme, so a fraction of enzyme molecules is out of action; more substrate cannot restore Vmax.");
      return `<strong>Rate ≈ ${v.toFixed(1)} units.</strong> ` + bits.join(" ");
    };
    const draw = () => {
      const p = get(); const v = M().rate(p);
      $("#rs-tv", host).textContent = p.T; $("#rs-pv", host).textContent = p.pH.toFixed(1); $("#rs-sv", host).textContent = p.S; $("#rs-ev", host).textContent = p.E.toFixed(2); $("#rs-iv", host).textContent = p.I;
      $("#rs-out", host).textContent = `rate = ${v.toFixed(1)} arbitrary units`;
      const x = $("#rs-x", host).value; const axes = { T: ["temperature / °C", 0, 70], pH: ["pH", 1, 13], S: ["substrate concentration / mmol dm⁻³", 0, 30], E: ["enzyme concentration (relative)", 0, 3], I: ["inhibitor concentration / mmol dm⁻³", 0, 5] };
      const [xl, x0, x1] = axes[x]; const xs = M().range(x0, x1, 80);
      const pts = xs.map((xv) => ({ x: xv, y: M().rate({ ...p, [x]: xv }) })); const ymax = Math.max(20, Math.max(...pts.map((q) => q.y)) * 1.15);
      const cur = { T: p.T, pH: p.pH, S: p.S, E: p.E, I: p.I }[x];
      $("#rs-g", host).innerHTML = A().graph({ xLabel: xl, yLabel: "rate / arbitrary units", xmin: x0, xmax: x1, ymax, width: 560, height: 300, curves: [{ pts, color: TEAL }], marks: [{ x: cur, y: v, label: "current settings", color: ROSE }], xticks: x === "pH" ? 6 : x === "T" ? 7 : 5, aria: "rate against " + xl });
      $("#rs-fb", host).innerHTML = feedback(p, v);
    };
    $$("input, select", host).forEach((i) => i.addEventListener("input", draw)); draw();
  };

  // ---------- F. Graph interpretation challenge ----------
  // spec.items: [{ graph: "temp"|"substrate"|"enzyme"|"pH"|"inhibition", questions: [question objects for the engine] }]
  B.interactives.graphChallenge = function (spec, host) {
    const graphs = { temp: () => A().tempCurve(), substrate: () => A().substrateCurve(), enzyme: () => A().enzymeConcCurve(), pH: () => A().pHCurve(), inhibition: () => A().inhibitionCurves() };
    host.innerHTML = head(spec, "model graphs") + `<div class="tabs" role="tablist" id="gc-tabs">${spec.items.map((it, i) => `<button role="tab" aria-selected="${i === 0}" data-i="${i}">${esc(it.label)}</button>`).join("")}</div><div id="gc-view"></div><div id="gc-q"></div>`;
    const show = (i) => { const it = spec.items[i]; $$("#gc-tabs button", host).forEach((b) => b.setAttribute("aria-selected", b.dataset.i == i)); $("#gc-view", host).innerHTML = `<div class="figure"><div class="fig-view">${graphs[it.graph]()}</div></div>`; const q = $("#gc-q", host); q.innerHTML = ""; it.questions.forEach((qq) => q.append(B.questions.render(qq))); };
    $$("#gc-tabs button", host).forEach((b) => b.addEventListener("click", () => show(+b.dataset.i))); show(0);
  };

  // ---------- G. Inhibition comparison ----------
  B.interactives.inhibitionCompare = function (spec, host) {
    const { TEAL, AMBER, ROSE } = C();
    host.innerHTML = head(spec, "simplified model") + `
      <div class="row"><label class="small">Substrate concentration: <strong><span id="ic-sv">4</span> mmol dm⁻³</strong><input type="range" id="ic-s" min="0.5" max="30" value="4" step="0.5" style="width:220px;accent-color:var(--teal)"></label><label class="small">Inhibitor concentration: <strong><span id="ic-iv">1</span> mmol dm⁻³</strong><input type="range" id="ic-i" min="0" max="5" value="1" step="0.25" style="width:220px;accent-color:var(--teal)"></label></div>
      <div class="grid grid-2 mt"><div class="card"><h4 style="color:var(--amber-ink)">Competitive</h4><div id="ic-c"></div></div><div class="card"><h4 style="color:var(--rose-ink)">Non-competitive</h4><div id="ic-n"></div></div></div>
      <div id="ic-g" class="mt"></div>
      <p class="small muted mt"><strong>Assumptions.</strong> Classical reversible inhibition: the competitive inhibitor binds only the free active site and is displaced by substrate; the non-competitive inhibitor binds equally well whether or not substrate is bound and leaves Km unchanged. Real inhibitors are often "mixed" (they change both Km and Vmax) or irreversible; the specification only requires the two idealised cases.</p>`;
    const bar = (v, col) => `<div class="progress" style="height:14px"><span style="width:${Math.min(100, v)}%;background:${col}"></span></div>`;
    const draw = () => {
      const S = +$("#ic-s", host).value, I = +$("#ic-i", host).value; $("#ic-sv", host).textContent = S; $("#ic-iv", host).textContent = I;
      const v0 = M().rate({ S }), vc = M().rate({ S, inhibitor: "competitive", I }), vn = M().rate({ S, inhibitor: "noncompetitive", I });
      const occC = Math.round((100 * S) / (M().Km * (1 + I / M().Ki) + S)), occN = Math.round(100 / (1 + I / M().Ki));
      $("#ic-c", host).innerHTML = `<p class="small">Rate: <strong>${vc.toFixed(1)}</strong> (uninhibited ${v0.toFixed(1)}, ${Math.round((100 * vc) / v0)}%)</p>${bar(vc, AMBER)}<p class="tiny muted mt">Fraction of active sites occupied by substrate ≈ ${occC}%. Inhibitor and substrate compete for the same site; the balance depends on their concentrations.</p>`;
      $("#ic-n", host).innerHTML = `<p class="small">Rate: <strong>${vn.toFixed(1)}</strong> (uninhibited ${v0.toFixed(1)}, ${Math.round((100 * vn) / v0)}%)</p>${bar(vn, ROSE)}<p class="tiny muted mt">Fraction of enzyme molecules still functional ≈ ${occN}%, independent of substrate concentration. The rest have a distorted active site while the inhibitor is bound.</p>`;
      const xs = M().range(0, 30, 90);
      $("#ic-g", host).innerHTML = A().graph({ xLabel: "substrate concentration / mmol dm⁻³", yLabel: "initial rate / arbitrary units", xmax: 30, ymax: 120, width: 560, height: 280, curves: [{ pts: M().curve(xs, (s) => M().rate({ S: s })), color: TEAL, label: "no inhibitor", labelPos: { x: 14, y: 107, a: "start" } }, { pts: M().curve(xs, (s) => M().rate({ S: s, inhibitor: "competitive", I })), color: AMBER, label: "competitive", labelPos: { x: 29.5, y: Math.min(112, M().rate({ S: 29.5, inhibitor: "competitive", I }) - 9), a: "end" } }, { pts: M().curve(xs, (s) => M().rate({ S: s, inhibitor: "noncompetitive", I })), color: ROSE, label: "non-competitive", labelPos: { x: 29.5, y: Math.max(6, M().rate({ S: 29.5, inhibitor: "noncompetitive", I }) - 9), a: "end" } }], marks: [{ x: S, y: vc, color: AMBER }, { x: S, y: vn, color: ROSE }], hlines: [{ y: 100, label: "Vmax", la: "start" }], aria: "rate against substrate concentration with each inhibitor at the chosen concentration" });
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
      const body = d < 0.95 ? `<path d="${A().enzymePath(Math.min(1, d * 1.6))}" fill="${d > 0.5 ? "#eef4f2" : "#d6efec"}" stroke="${d > 0.5 ? ROSE : TEAL}" stroke-width="2.5" transform="rotate(${d * 6} 150 140)"/>` : `<path d="M 60 170 C 80 80, 150 70, 170 110 S 260 60, 262 130 S 210 220, 160 190 S 90 250, 60 170" fill="#eef4f2" stroke="${ROSE}" stroke-width="2.5"/>`;
      const bondSVG = bonds.map(([x, y], i) => `<line x1="${x}" y1="${y}" x2="${x + 24 + wob(i)}" y2="${y + 10 - wob(i) / 2}" stroke="${i < broken ? ROSE : NAVY}" stroke-width="2" stroke-dasharray="3 3" opacity="${i < broken ? 0.35 : 1}"/>${i < broken ? `<text x="${x + 10}" y="${y - 4}" font-size="10" fill="${ROSE}">✕</text>` : ""}`).join("");
      const sub = d < 0.5 ? `<path d="${A().substratePath(150, 98).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5"/>` : `<path d="${A().substratePath(150, 20).whole}" fill="#fbf0d8" stroke="${AMBER}" stroke-width="2.5" opacity=".7"/>`;
      $("#dn-v", host).innerHTML = A().enzymeSVG(`<g transform="translate(0,30)">${body}${d < 0.95 ? bondSVG : ""}${sub}<text x="150" y="-8" text-anchor="middle" font-size="11" fill="${GREY}">${d < 0.15 ? "native: substrate binds" : d < 0.5 ? "weak bonds strained; binding less efficient" : d < 0.95 ? "tertiary structure disrupted: substrate no longer complementary" : "unfolded chain: denatured"}</text></g>`, 300, 270, "denaturation explorer");
      const msg = d < 0.15 ? "At or near the optimum the hydrogen and ionic bonds (dashed) hold the tertiary structure, so the active site keeps its shape and the substrate binds." : d < 0.5 ? `${broken} of ${bonds.length} weak bonds are broken or strained. The active site is slightly distorted: fewer successful collisions, so the rate falls. For pH this can be <strong>reversible</strong>; small changes alter the charges on R groups without unfolding the protein.` : d < 0.95 ? "Most weak bonds are broken; the chain has partly unfolded and the active site has lost its shape. Note the site is not simply 'smaller': its whole geometry and charge pattern are different. Heat denaturation is usually irreversible." : "Fully denatured: the polypeptide is a random coil. Peptide bonds are intact (primary structure unchanged), but with no tertiary structure there is no active site.";
      $("#dn-i", host).innerHTML = `<h4>${T} °C, pH ${pH.toFixed(1)}</h4><p class="small">${msg}</p><p class="tiny muted">Model: the drawing links the fraction of broken bonds to how far the temperature is above about 46 °C (this generic model enzyme\'s optimum is about 50 °C, matching the rate simulator) or the pH is from 7; real enzymes differ (e.g. enzymes of thermophiles are stable at 80 °C, pepsin works at pH 2).</p>`;
    };
    $$("input", host).forEach((i) => i.addEventListener("input", draw)); draw();
  };
})(window.BIO);
