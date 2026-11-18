// Drawings for 3.3.6 Inheritance (Phase 5 Batch 3, author B3). B.geneticsArt.
// diagram(res, opts)  fully labelled genetic diagram in HTML (rows: parental phenotypes, parental genotypes, gametes in
//                     circles, Punnett square, offspring genotypes, offspring phenotypes, ratio) from a
//                     B.geneticsModel.cross() result, so every worked diagram on the page is computed, not typed.
// vocab(on)           homologous pair with three loci for the Vocabulary Explorer (parts highlighted by data-part).
// linkage()           linked genes and crossing over (figure d-3.3.6.2-1).
// epistasis()         the three epistasis pathways (figure d-3.3.6.2-2).
// pedigree()          the haemophilia family used by the Probability Challenge.
// seed, coat, redCell, rabbit   pictures for the Genotype to Phenotype Explorer.
// Labels are at least 13 user units in drawings rendered at about their viewBox width (>= 12 px at 1280 px wide).
window.BIO = window.BIO || {};
(function (B) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  let styled = false;
  const ensureStyle = () => { if (styled || typeof document === "undefined" || !document.head) return; styled = true; const s = document.createElement("style");
    s.textContent = `.gd{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:.6rem .75rem;color:var(--ink);font-size:.9rem;line-height:1.35;max-width:100%;overflow-x:auto}
.gd .gd-key{font-size:.8rem;color:var(--ink-2);margin:0 0 .4rem}
.gd table{border-collapse:collapse;width:auto;margin:0}
.gd .gd-rows th{font-weight:600;text-align:left;padding:.25rem .7rem .25rem 0;white-space:nowrap;color:var(--ink-2);font-size:.82rem;vertical-align:middle}
.gd .gd-rows td{padding:.25rem .45rem;text-align:left;vertical-align:middle}
.gd .gd-pair{display:flex;flex-wrap:wrap;align-items:center;gap:.2rem .8rem}.gd .gd-p{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.1rem}
.gd .gd-x{color:var(--ink-3)}
.gd .gm{display:inline-flex;align-items:center;justify-content:center;min-width:2.1em;height:2.1em;padding:0 .35em;margin:.1em;border:1.5px solid var(--ink-3);border-radius:999px;background:var(--surface-2);font-weight:600}
.gd .gm small{font-weight:400;font-size:max(12px,.75rem);margin-left:.2em;color:var(--ink-2)}
.gd .gd-ps{margin:.45rem 0 .2rem}
.gd .gd-ps th,.gd .gd-ps td{border:1px solid var(--line-strong);padding:.3rem .45rem;text-align:center;min-width:4.2em}
.gd .gd-ps td{background:var(--surface)}
.gd .gd-ps td .ph{display:block;font-size:max(12px,.75rem);color:var(--ink-2);line-height:1.15}
.gd .gd-ps thead th,.gd .gd-ps tbody th{background:var(--surface-2)}
.gd .gd-ps .corner{font-size:max(12px,.75rem);color:var(--ink-2);font-weight:400}
.gd .gd-out{margin:.35rem 0 0;display:grid;grid-template-columns:max-content 1fr;gap:.2rem .7rem;font-size:.86rem}
.gd .gd-out dt{font-weight:600;color:var(--ink-2);font-size:.82rem}
.gd .gd-out dd{margin:0}
.gd .gd-hide{color:var(--ink-4);font-style:italic}
.gd .gd-bars{display:inline-block;vertical-align:middle;margin-left:.35em}
.gd sup{font-size:max(12px,.85em);line-height:0}
@media (max-width:599px){.gd{font-size:.84rem}.gd .gd-ps th,.gd .gd-ps td{min-width:3.4em;padding:.25rem .3rem}}`;
    document.head.appendChild(s); };

  // two short chromosome bars for a linked genotype (hap = array of allele symbols)
  function bars(hA, hB) { const one = (h, y, col) => `<rect x="2" y="${y}" width="58" height="14" rx="7" fill="${col}" stroke="#2f4d45" stroke-width=".8"/>` + h.map((sym, k) => `<text x="${18 + k * 26}" y="${y + 11.5}" font-size="12" font-weight="700" text-anchor="middle" fill="#061814">${esc(sym)}</text>`).join("");
    return `<svg class="gd-bars" width="62" height="34" viewBox="0 0 62 34" aria-hidden="true">${one(hA, 1, "#cfe3dc")}${one(hB, 19, "#f1e3c4")}</svg>`; }

  // opts.stage: "parents" (parents only), "gametes" (+ gametes and an empty grid), "full" (everything)
  // opts.title: optional heading; opts.freq: show gamete frequencies (linkage with crossing over)
  function diagram(res, opts = {}) {
    ensureStyle(); const s = res.s; const st = opts.stage || "full"; const linked = s.pairs.some((p) => p.loci.length === 2);
    const sexed = s.pairs.some((p) => p.type === "X");
    const keyTxt = s.key.map(([k, v]) => `${esc(k)} = ${esc(v)}`).join("; ");
    const pg = (html, g) => html + (linked ? bars(g.pairs[0][0], g.pairs[0][1]) : "");
    const totW = (gl) => gl.reduce((t, x) => t + x.w, 0);
    const gmHTML = (gl) => gl.map((x) => `<span class="gm"><span>${x.html}</span>${opts.freq || (res.rf && gl.length > 2) ? `<small>${Math.round((x.w / totW(gl)) * 100)} %</small>` : ""}</span>`).join(" ");
    const lab = (who, ph) => (sexed ? `${who === 1 ? "female" : "male"}: ${esc(ph.replace(/^(female|male) /, ""))}` : esc(ph));
    const cell = (a, b, gm) => `<div class="gd-pair"><span class="gd-p">${a}</span>${gm ? `<span class="gd-x" style="min-width:1.2rem" aria-hidden="true"></span>` : `<span class="gd-x">×</span>`}<span class="gd-p">${b}</span></div>`;
    let h = `<div class="gd paper-panel no-gloss">${opts.title ? `<p style="margin:0 0 .3rem;font-weight:600">${esc(opts.title)}</p>` : ""}<p class="gd-key">Key: ${keyTxt}</p>
<table class="gd-rows"><tbody>
<tr><th scope="row">Parental phenotypes</th><td>${cell(lab(1, res.p1ph), lab(2, res.p2ph))}</td></tr>
<tr><th scope="row">Parental genotypes</th><td>${cell(pg(res.p1html, res.p1), pg(res.p2html, res.p2))}</td></tr>`;
    if (st !== "parents") h += `<tr><th scope="row">Gametes</th><td>${cell(gmHTML(res.g1), gmHTML(res.g2), true)}</td></tr>`;
    h += `</tbody></table>`;
    if (st !== "parents") {
      const full = st === "full";
      h += `<div class="gd-pswrap" style="overflow-x:auto"><table class="gd-ps" aria-label="Punnett square"><thead><tr><th class="corner" scope="col">Gametes</th>${res.g2.map((x) => `<th scope="col"><span class="gm"><span>${x.html}</span></span></th>`).join("")}</tr></thead><tbody>
${res.grid.map((row, i) => `<tr><th scope="row"><span class="gm"><span>${res.g1[i].html}</span></span></th>${row.map((c) => `<td>${full ? `${c.html}<span class="ph">${esc(s.classes[c.cls])}</span>` : `<span class="gd-hide">?</span>`}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      if (res.rf && res.g1.length * res.g2.length > 1 && (res.g1.length > 2 || res.g2.length > 2)) h += `<p class="tiny" style="margin:.1rem 0 .2rem;color:var(--ink-2)">The squares are not equally likely: each is the product of the two gamete percentages.</p>`;
      if (full) {
        const genos = res.genotypes.map((x) => `${x.html}${x.carrier ? " (carrier)" : ""}`);
        const showCls = s.classes.map((c, i) => [c, res.ratio[i]]).filter((x) => x[1] > 0);
        h += `<dl class="gd-out"><dt>Offspring genotypes</dt><dd>${genos.join(", ")}</dd><dt>Genotype ratio</dt><dd>${res.genotypes.map((x) => x.r).join(" : ")}</dd>
<dt>Offspring phenotypes</dt><dd>${showCls.map((x) => esc(x[0])).join(", ")}</dd><dt>Phenotype ratio</dt><dd>${showCls.map((x) => x[1]).join(" : ")}</dd></dl>`;
      }
    }
    return h + `</div>`;
  }

  // ---------------------------------------------------------------- Vocabulary Explorer drawing
  // parts: pair, mat, pat, lA, lB, lD (locus markers), A1 A2 B1 B2 D1 D2 (allele bands)
  function vocab(on = []) {
    const hi = (p) => on.indexOf(p) >= 0; const any = on.length > 0;
    const op = (p) => (!any || hi(p) ? 1 : 0.28);
    const chrom = (x, col, part, al) => { const ys = [60, 150, 236];
      return `<g data-part="${part}" opacity="${op(part) === 1 || al.some((q) => hi(q.p)) ? 1 : 0.35}"><path d="M${x - 17} 34 q0 -14 17 -14 q17 0 17 14 v68 q0 8 -6 12 q6 4 6 12 v128 q0 14 -17 14 q-17 0 -17 -14 v-128 q0 -8 6 -12 q-6 -4 -6 -12 z" fill="${col}" stroke="#2f4d45" stroke-width="1.5"/>
${al.map((q, k) => `<g data-part="${q.p}" opacity="${op(q.p)}"><rect x="${x - 17}" y="${ys[k] - 9}" width="34" height="18" fill="${q.dom ? "#0f2e27" : "#ffffff"}" stroke="${hi(q.p) ? "#b0802f" : "#2f4d45"}" stroke-width="${hi(q.p) ? 3 : 1.2}"/><text x="${x}" y="${ys[k] + 5}" font-size="15" font-weight="700" text-anchor="middle" fill="${q.dom ? "#ffffff" : "#061814"}">${q.t}</text></g>`).join("")}</g>`; };
    const marker = (y, part, label) => `<g data-part="${part}" opacity="${op(part)}"><line x1="112" y1="${y}" x2="306" y2="${y}" stroke="${hi(part) ? "#b0802f" : "#6d8a82"}" stroke-width="${hi(part) ? 2.5 : 1}" stroke-dasharray="4 3"/><text x="312" y="${y + 5}" font-size="14" fill="#061814">${label}</text></g>`;
    return `<svg viewBox="0 0 470 330" width="470" role="img" aria-label="A homologous pair of chromosomes in a diploid cell with three loci: alleles A and A, B and b, d and d">
<text x="10" y="18" font-size="13" fill="#2f4d45">Nucleus of a diploid cell (one homologous pair shown)</text>
<g transform="translate(0,28)"><ellipse cx="208" cy="145" rx="158" ry="137" fill="#f6f9f8" stroke="#9fb6af" stroke-width="2" data-part="nucleus" opacity="${op("nucleus")}"/>
${marker(60, "lA", "locus of gene A")}${marker(150, "lB", "locus of gene B")}${marker(236, "lD", "locus of gene D")}
${chrom(150, "#cfe3dc", "mat", [{ t: "A", p: "A1", dom: true }, { t: "B", p: "B1", dom: true }, { t: "d", p: "D1" }])}
${chrom(262, "#f1e3c4", "pat", [{ t: "A", p: "A2", dom: true }, { t: "b", p: "B2" }, { t: "d", p: "D2" }])}
<text x="150" y="292" font-size="13" text-anchor="middle" fill="#2f4d45">from mother</text><text x="262" y="292" font-size="13" text-anchor="middle" fill="#2f4d45">from father</text></g>
</svg>`;
  }

  // ---------------------------------------------------------------- d-3.3.6.2-1 linkage and crossing over
  function linkage() {
    const T = "#cfe3dc", Am = "#f1e3c4", S = "#2f4d45";
    const chrom = (x, top, bot, labs) => `<path d="M${x} 48 a8 8 0 0 1 16 0 V130 H${x} Z" fill="${top}" stroke="${S}" stroke-width="1.2"/><path d="M${x} 130 H${x + 16} V232 a8 8 0 0 1 -16 0 Z" fill="${bot}" stroke="${S}" stroke-width="1.2"/>` +
      `<text x="${x + 8}" y="93" font-size="14" font-weight="700" text-anchor="middle" fill="#061814">${labs[0]}</text><text x="${x + 8}" y="195" font-size="14" font-weight="700" text-anchor="middle" fill="#061814">${labs[1]}</text>`;
    // left: a bivalent (two chromatids D R, two chromatids d r); the inner two non-sister chromatids cross between the loci
    const left = `${chrom(40, T, T, ["D", "R"])}${chrom(60, T, T, ["D", "R"])}${chrom(90, Am, Am, ["d", "r"])}${chrom(110, Am, Am, ["d", "r"])}
<path d="M70 112 L96 148 M96 112 L70 148" stroke="#b0802f" stroke-width="4" stroke-linecap="round"/>
<line x1="102" y1="130" x2="150" y2="130" stroke="#b0802f" stroke-width="1.4"/><text x="156" y="118" font-size="13" fill="#061814">chiasma: crossing</text><text x="156" y="134" font-size="13" fill="#061814">over between the</text><text x="156" y="150" font-size="13" fill="#061814">two loci</text>
<text x="20" y="28" font-size="13" fill="${S}">Prophase I: a homologous pair</text>
<text x="58" y="258" font-size="13" text-anchor="middle" fill="${S}">DR</text><text x="108" y="258" font-size="13" text-anchor="middle" fill="${S}">dr</text><text x="83" y="278" font-size="13" text-anchor="middle" fill="${S}">two chromatids each</text>`;
    const xs = [380, 450, 520, 590]; const out = [["D", "R", T, T], ["D", "r", T, Am], ["d", "R", Am, T], ["d", "r", Am, Am]];
    const right = out.map((o, i) => `${chrom(xs[i], o[2], o[3], [o[0], o[1]])}<text x="${xs[i] + 8}" y="258" font-size="13" text-anchor="middle" fill="#061814">${o[0]}${o[1]}</text>`).join("") +
      `<text x="${xs[0] + 8}" y="278" font-size="13" text-anchor="middle" fill="${S}">parental</text><text x="${xs[3] + 8}" y="278" font-size="13" text-anchor="middle" fill="${S}">parental</text>
<path d="M${xs[1] + 2} 266 v6 H${xs[2] + 14} v-6" stroke="#7a5512" stroke-width="1.4" fill="none"/><text x="${(xs[1] + xs[2]) / 2 + 8}" y="288" font-size="13" font-weight="700" text-anchor="middle" fill="#7a5512">recombinant</text>`;
    return `<svg viewBox="0 0 640 296" width="640" role="img" aria-label="Crossing over between two linked loci gives two parental and two recombinant chromatids">
<defs><marker id="gaArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${S}"/></marker></defs><path d="M300 130 h50" stroke="${S}" stroke-width="2" marker-end="url(#gaArr)"/>
${left}<text x="493" y="28" font-size="13" text-anchor="middle" fill="${S}">The four chromatids that go into gametes</text>${right}</svg>`;
  }

  // ---------------------------------------------------------------- d-3.3.6.2-2 epistasis as pathways
  function epistasis() {
    const S = "#2f4d45"; let id = 0;
    const box = (x, y, w, t, fill) => `<rect x="${x}" y="${y}" width="${w}" height="30" rx="7" fill="${fill || "#f6f9f8"}" stroke="${S}" stroke-width="1.2"/><text x="${x + w / 2}" y="${y + 20}" font-size="13" text-anchor="middle" fill="#061814">${t}</text>`;
    const arr = (x1, x2, y, lab, block) => `<line x1="${x1}" y1="${y}" x2="${x2 - 4}" y2="${y}" stroke="${S}" stroke-width="1.6" marker-end="url(#gaEp)"/><text x="${(x1 + x2) / 2}" y="${y - 7}" font-size="13" text-anchor="middle" fill="#061814">${lab}</text>${block ? `<text x="${(x1 + x2) / 2}" y="${y + 21}" font-size="13" text-anchor="middle" fill="#8f3a30" font-weight="700">${block}</text><path d="M${(x1 + x2) / 2 - 7} ${y - 5} l14 10 M${(x1 + x2) / 2 + 7} ${y - 5} l-14 10" stroke="#b4544a" stroke-width="2"/>` : ""}`;
    id++;
    const row = (y, title, body, note) => `<text x="10" y="${y}" font-size="14" font-weight="700" fill="#061814">${title}</text>${body}<text x="10" y="${y + 74}" font-size="13" fill="${S}">${note}</text>`;
    return `<svg viewBox="0 0 640 330" width="640" role="img" aria-label="Three pathways explaining recessive epistasis, dominant epistasis and complementary genes">
<defs><marker id="gaEp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${S}"/></marker></defs>
${row(20, "Recessive epistasis (mouse coat): 9 : 3 : 4", box(10, 34, 130, "colourless") + arr(140, 250, 49, "enzyme from C", "cc: blocked") + box(250, 34, 100, "pigment") + arr(350, 450, 49, "A: banded") + box(450, 34, 180, "agouti (aa: black)"), "cc mice make no pigment, so they are albino whatever their A alleles.")}
${row(128, "Dominant epistasis (squash fruit): 12 : 3 : 1", box(10, 142, 130, "precursor") + arr(140, 250, 157, "step 1", "W stops it") + box(250, 142, 110, "green", "#e3efe0") + arr(360, 470, 157, "enzyme from Y") + box(470, 142, 120, "yellow", "#f6eec7"), "Any W_ fruit is white; in ww fruit, Y_ is yellow and yy stays green.")}
${row(236, "Complementary genes (sweet pea flower): 9 : 7", box(10, 250, 130, "colourless") + arr(140, 250, 265, "enzyme 1 (C)", "cc") + box(250, 250, 110, "colourless") + arr(360, 470, 265, "enzyme 2 (P)", "pp") + box(470, 250, 120, "purple", "#e7dcef"), "Only C_P_ flowers are purple; cc or pp blocks a step, so the flower is white.")}
</svg>`;
  }

  // ---------------------------------------------------------------- pedigree (haemophilia family)
  function pedigree() {
    const S = "#061814"; const sq = (x, y, aff, lab) => `<rect x="${x - 15}" y="${y - 15}" width="30" height="30" fill="${aff ? "#2f4d45" : "#ffffff"}" stroke="${S}" stroke-width="2"/><text x="${x}" y="${y + 33}" font-size="13" text-anchor="middle" fill="${S}">${lab}</text>`;
    const ci = (x, y, aff, lab) => `<circle cx="${x}" cy="${y}" r="15" fill="${aff ? "#2f4d45" : "#ffffff"}" stroke="${S}" stroke-width="2"/><text x="${x}" y="${y + 33}" font-size="13" text-anchor="middle" fill="${S}">${lab}</text>`;
    const di = (x, y, lab) => `<path d="M${x} ${y - 16} L${x + 16} ${y} L${x} ${y + 16} L${x - 16} ${y} Z" fill="#ffffff" stroke="${S}" stroke-width="2"/><text x="${x}" y="${y + 5}" font-size="14" font-weight="700" text-anchor="middle" fill="${S}">?</text><text x="${x}" y="${y + 33}" font-size="13" text-anchor="middle" fill="${S}">${lab}</text>`;
    return `<svg viewBox="0 0 390 352" width="390" role="img" aria-label="Pedigree: unaffected parents I-1 and I-2 have an affected son II-1, an unaffected son II-2 and an unaffected daughter II-3 (Sara). Sara and her unaffected partner II-4 are expecting a child.">
<text x="14" y="45" font-size="14" font-weight="700" fill="${S}">I</text><text x="14" y="145" font-size="14" font-weight="700" fill="${S}">II</text><text x="14" y="245" font-size="14" font-weight="700" fill="${S}">III</text>
<line x1="135" y1="40" x2="185" y2="40" stroke="${S}" stroke-width="2"/><line x1="160" y1="40" x2="160" y2="95" stroke="${S}" stroke-width="2"/><line x1="80" y1="95" x2="220" y2="95" stroke="${S}" stroke-width="2"/>
<line x1="80" y1="95" x2="80" y2="125" stroke="${S}" stroke-width="2"/><line x1="150" y1="95" x2="150" y2="125" stroke="${S}" stroke-width="2"/><line x1="220" y1="95" x2="220" y2="125" stroke="${S}" stroke-width="2"/>
<line x1="235" y1="140" x2="285" y2="140" stroke="${S}" stroke-width="2"/><line x1="260" y1="140" x2="260" y2="224" stroke="${S}" stroke-width="2"/>
${sq(120, 40, false, "I-1")}${ci(200, 40, false, "I-2")}${sq(80, 140, true, "II-1")}${sq(150, 140, false, "II-2")}${ci(220, 140, false, "II-3 (Sara)")}${sq(300, 140, false, "II-4")}${di(260, 240, "III-1")}
<g font-size="13" fill="${S}"><rect x="20" y="290" width="16" height="16" fill="#fff" stroke="${S}" stroke-width="1.5"/><text x="44" y="303">unaffected male</text>
<circle cx="228" cy="298" r="8" fill="#fff" stroke="${S}" stroke-width="1.5"/><text x="244" y="303">unaffected female</text>
<rect x="20" y="318" width="16" height="16" fill="#2f4d45" stroke="${S}" stroke-width="1.5"/><text x="44" y="331">male with haemophilia</text>
<path d="M228 317 L237 326 L228 335 L219 326 Z" fill="#fff" stroke="${S}" stroke-width="1.5"/><text x="244" y="331">child not yet born</text></g>
</svg>`;
  }

  // ---------------------------------------------------------------- explorer pictures
  function seed(shape) { const round = shape === "round"; const path = round ? `<circle cx="80" cy="70" r="46" fill="#c9cf6a" stroke="#5c6326" stroke-width="2.5"/><ellipse cx="64" cy="52" rx="12" ry="7" fill="#e6eaa8" opacity=".8"/>`
      : `<path d="${Array.from({ length: 24 }, (_, i) => { const t = (i / 24) * Math.PI * 2; const r = 44 + (i % 2 ? -5 : 3); return `${i ? "L" : "M"}${(80 + r * Math.cos(t)).toFixed(1)} ${(70 + r * Math.sin(t)).toFixed(1)}`; }).join(" ")} Z" fill="#b7bb5e" stroke="#5c6326" stroke-width="2.5" stroke-linejoin="round"/><path d="M52 60 q12 10 26 0 M60 86 q14 -8 30 2 M88 50 q8 12 18 6" stroke="#5c6326" stroke-width="1.6" fill="none"/>`;
    return `<svg viewBox="0 0 160 140" width="160" role="img" aria-label="${round ? "A round, smooth pea seed" : "A wrinkled pea seed"}">${path}</svg>`; }
  // coat swatch: individual hairs, so roan shows red AND white hairs side by side (codominance, not blending)
  function coat(kind) { const red = "#9c3d22", white = "#f4f1ea"; let h = "";
    for (let i = 0; i < 46; i++) { const x = 12 + i * 3.1; const col = kind === "red" ? red : kind === "white" ? white : (i * 7) % 3 === 0 ? white : red; h += `<path d="M${x} 118 q${(i % 5) - 2} -50 ${((i % 3) - 1) * 5} -96" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; }
    return `<svg viewBox="0 0 170 130" width="170" role="img" aria-label="Close-up of the coat: ${kind === "roan" ? "red hairs and white hairs mixed together" : kind + " hairs"}"><rect x="4" y="6" width="162" height="118" rx="8" fill="#d9d2c4"/>${h}</svg>`; }
  function redCell(group) { const A = group === "A" || group === "AB", Bb = group === "B" || group === "AB"; let m = "";
    for (let i = 0; i < 12; i++) { const t = (i / 12) * Math.PI * 2; const x = 85 + 52 * Math.cos(t), y = 70 + 52 * Math.sin(t); const isA = i % 2 === 0; if (isA && A) m += `<path d="M${(x - 6).toFixed(1)} ${(y + 5).toFixed(1)} L${x.toFixed(1)} ${(y - 6).toFixed(1)} L${(x + 6).toFixed(1)} ${(y + 5).toFixed(1)} Z" fill="#0f2e27"/>`; if (!isA && Bb) m += `<rect x="${(x - 5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="10" height="10" fill="#b0802f"/>`; }
    return `<svg viewBox="0 0 230 140" width="230" role="img" aria-label="Red blood cell, group ${group}: ${A && Bb ? "antigen A and antigen B" : A ? "antigen A" : Bb ? "antigen B" : "neither antigen A nor antigen B"} on its surface">
<circle cx="85" cy="70" r="50" fill="#e7a39a" stroke="#8f3a30" stroke-width="2"/><circle cx="85" cy="70" r="26" fill="#efbcb4"/>${m}
<path d="M170 30 l6 -11 l6 11 z" fill="#0f2e27"/><text x="188" y="31" font-size="13" fill="#061814">A</text><rect x="171" y="46" width="10" height="10" fill="#b0802f"/><text x="188" y="56" font-size="13" fill="#061814">B</text><text x="168" y="80" font-size="12" fill="#2f4d45">antigens</text></svg>`; }
  // rabbit: kind "full" | "him" | "albino"; cold: a cooled patch on the back
  function rabbit(kind, cold) { const body = kind === "full" ? "#7a6a58" : "#fbfaf7", point = kind === "full" ? "#5d4f41" : kind === "him" ? "#2b2622" : "#fbfaf7", eye = kind === "albino" ? "#d25a6a" : "#1c1c1c";
    const patch = kind === "him" && cold ? `<ellipse cx="120" cy="84" rx="26" ry="14" fill="#2b2622"/>` : "";
    const ring = cold ? `<ellipse cx="120" cy="84" rx="30" ry="18" fill="none" stroke="#4d8ab0" stroke-width="2" stroke-dasharray="4 3"/>` : "";
    return `<svg viewBox="0 0 240 170" width="240" role="img" aria-label="${kind === "full" ? "Full-colour rabbit" : kind === "him" ? "Himalayan rabbit: white body with dark ears, nose, feet and tail" + (cold ? "; dark fur has grown on the cooled patch" : "") : "Albino rabbit: white fur and pink eyes"}">
<ellipse cx="112" cy="104" rx="70" ry="44" fill="${body}" stroke="#6d8a82" stroke-width="1.5"/>${patch}${ring}
<circle cx="46" cy="132" r="11" fill="${point}" stroke="#6d8a82" stroke-width="1"/><ellipse cx="80" cy="146" rx="18" ry="7" fill="${point}" stroke="#6d8a82"/><ellipse cx="150" cy="146" rx="22" ry="8" fill="${point}" stroke="#6d8a82"/>
<circle cx="186" cy="82" r="30" fill="${body}" stroke="#6d8a82" stroke-width="1.5"/>
<path d="M176 56 q-10 -46 4 -50 q12 2 8 50 z" fill="${point}" stroke="#6d8a82"/><path d="M194 56 q4 -46 18 -46 q10 6 -6 50 z" fill="${point}" stroke="#6d8a82"/>
<ellipse cx="214" cy="90" rx="9" ry="7" fill="${point}" stroke="#6d8a82"/><circle cx="196" cy="76" r="4.5" fill="${eye}"/></svg>`; }

  B.geneticsArt = { diagram, bars, vocab, linkage, epistasis, pedigree, seed, coat, redCell, rabbit, ensureStyle };
})(window.BIO);
