// Lightweight inline-SVG charts. No dependencies.
window.BIO = window.BIO || {};
(function (B) {
  const { esc } = B.util;
  function bar(items, { width = 600, height = 220, max = 100, unit = "%", color = "var(--teal)" } = {}) {
    const padL = 36, padB = 46, padT = 14, w = width - padL - 10, hgt = height - padB - padT; const bw = Math.min(56, w / items.length - 10);
    let s = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="bar chart">`;
    for (let g = 0; g <= 4; g++) { const y = padT + hgt - (hgt * g) / 4; s += `<line x1="${padL}" x2="${width - 10}" y1="${y}" y2="${y}" stroke="#e3ecea"/><text x="${padL - 6}" y="${y + 4}" font-size="10" text-anchor="end" fill="#6b7d8f">${(max * g) / 4}${unit}</text>`; }
    items.forEach((it, i) => {
      const x = padL + (w / items.length) * i + (w / items.length - bw) / 2; const v = it.value == null ? 0 : it.value; const bh = (hgt * v) / max;
      s += `<rect x="${x}" y="${padT + hgt - bh}" width="${bw}" height="${bh}" rx="6" fill="${it.value == null ? "#e3ecea" : color}"><title>${esc(it.label)}: ${it.value == null ? "no data" : v + unit}</title></rect>`;
      s += `<text x="${x + bw / 2}" y="${padT + hgt + 16}" font-size="11" text-anchor="middle" fill="#3c4f63">${esc(it.label)}</text>`;
      if (it.value != null) s += `<text x="${x + bw / 2}" y="${padT + hgt - bh - 5}" font-size="11" text-anchor="middle" fill="#16263a" font-weight="600">${v}${unit}</text>`;
    });
    return s + "</svg>";
  }
  function line(series, { width = 600, height = 220, xLabel = "", yLabel = "", color = "var(--teal)", points = true } = {}) {
    const padL = 44, padB = 40, padT = 14, padR = 14; const w = width - padL - padR, hgt = height - padB - padT;
    const xs = series.map((p) => p.x), ys = series.map((p) => p.y);
    if (!xs.length) return `<svg class="chart" viewBox="0 0 ${width} ${height}"><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#98a7b5" font-size="13">No data yet</text></svg>`;
    const xmin = Math.min(...xs), xmax = Math.max(...xs) || 1, ymin = 0, ymax = Math.max(...ys, 1) * 1.1;
    const X = (x) => padL + ((x - xmin) / (xmax - xmin || 1)) * w, Y = (y) => padT + hgt - ((y - ymin) / (ymax - ymin)) * hgt;
    let s = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="line graph">`;
    for (let g = 0; g <= 4; g++) { const yv = ymin + ((ymax - ymin) * g) / 4; s += `<line x1="${padL}" x2="${width - padR}" y1="${Y(yv)}" y2="${Y(yv)}" stroke="#e3ecea"/><text x="${padL - 6}" y="${Y(yv) + 4}" font-size="10" text-anchor="end" fill="#6b7d8f">${yv.toFixed(yv >= 10 ? 0 : 1)}</text>`; }
    for (let g = 0; g <= 4; g++) { const xv = xmin + ((xmax - xmin) * g) / 4; s += `<text x="${X(xv)}" y="${padT + hgt + 16}" font-size="10" text-anchor="middle" fill="#6b7d8f">${xv.toFixed(xv >= 10 ? 0 : 1)}</text>`; }
    s += `<path d="${series.map((p, i) => (i ? "L" : "M") + X(p.x) + " " + Y(p.y)).join(" ")}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;
    if (points) series.forEach((p) => (s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" fill="#fff" stroke="${color}" stroke-width="2"><title>${p.x}, ${p.y}</title></circle>`));
    if (xLabel) s += `<text x="${padL + w / 2}" y="${height - 4}" font-size="11" text-anchor="middle" fill="#3c4f63">${esc(xLabel)}</text>`;
    if (yLabel) s += `<text transform="translate(12 ${padT + hgt / 2}) rotate(-90)" font-size="11" text-anchor="middle" fill="#3c4f63">${esc(yLabel)}</text>`;
    return s + "</svg>";
  }
  function donut(pct, { size = 120, label = "" } = {}) {
    const r = 46, c = 2 * Math.PI * r; const v = pct == null ? 0 : pct;
    return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${esc(label)} ${v}%"><circle cx="60" cy="60" r="${r}" fill="none" stroke="#e3ecea" stroke-width="12"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--teal)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(c * v) / 100} ${c}" transform="rotate(-90 60 60)"/><text x="60" y="66" text-anchor="middle" font-size="22" font-weight="700" fill="#16263a">${pct == null ? "–" : v + "%"}</text></svg>`;
  }
  B.charts = { bar, line, donut };
})(window.BIO);
