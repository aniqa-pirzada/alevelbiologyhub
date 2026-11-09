// Photo component. B.views.photo(slotId, opts) returns HTML for a <figure class="photo"> that shows the registered
// image (lazy-loaded, responsive) when available and NOTHING when it is not (no placeholders, no "to follow" text;
// IMAGE_REQUIREMENTS.md lists the wanted slots for developers). Nothing here ever emits a broken <img>.
window.BIO = window.BIO || {}; window.BIO.views = window.BIO.views || {};
(function (B) {
  const { h, raw, esc } = B.util;
  const ratioPad = { "3:1": 33.33, "4:3": 75, "16:9": 56.25, "1:1": 100, "2:1": 50 };
  function placeholderSVG(label) {
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="ph-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="1.6" fill="#b9c9c4"/></pattern><linearGradient id="ph-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef4f2"/><stop offset="1" stop-color="#d6efec"/></linearGradient></defs><rect width="400" height="300" fill="url(#ph-g)"/><rect width="400" height="300" fill="url(#ph-dots)"/><circle cx="200" cy="140" r="58" fill="none" stroke="#9ed9c8" stroke-width="3"/><circle cx="200" cy="140" r="24" fill="#9ed9c8" opacity=".5"/><circle cx="246" cy="112" r="9" fill="#6b9a7f" opacity=".5"/><circle cx="160" cy="170" r="7" fill="#1f8a8a" opacity=".4"/></svg>`;
  }
  B.views.photo = function (slotId, opts = {}) {
    const s = (B.images && B.images.get(slotId)) || null;
    const ratio = (opts.ratio || (s && s.ratio) || "4:3");
    const pad = ratioPad[ratio] || 75;
    const cls = "photo" + (opts.cls ? " " + opts.cls : "");
    if (s && s.status === "available" && s.src) {
      const cap = opts.caption || s.caption; const credit = s.credit ? `<span class="credit">${s.page ? `<a href="${esc(s.page)}" target="_blank" rel="noopener">Image</a>: ` : ""}${esc(s.credit)}${s.licence ? " · " + esc(s.licence) : ""}</span>` : "";
      return `<figure class="${cls}" data-slot="${esc(slotId)}"><div class="photo-frame${s.fit === "contain" ? " contain" : ""}" style="padding-top:${pad}%"><img src="${esc(s.src)}"${s.pos ? ` style="object-position:${esc(s.pos)}"` : ""} alt="${esc(s.alt || "")}" loading="lazy" decoding="async" sizes="(max-width: 700px) 100vw, 700px"></div>${cap || credit ? `<figcaption>${cap ? esc(cap) : ""} ${credit}</figcaption>` : ""}</figure>`;
    }
    return ""; // no placeholder: a missing photograph is simply not shown (policy changed 2026-11-01)
  };
  // Biology in Focus card: a real image (slot) + caption + explanation + spec link + one question (through the engine)
  B.views.focusCard = function (f, host) {
    const { el, $ } = B.util;
    const img = B.views.photo(f.slot, { caption: f.caption });
    const node = el(`<section class="focus card"><div class="${img ? "focus-grid" : ""}">${img ? `<div>${img}</div>` : ""}<div><div class="eyebrow">Biology in Focus</div><h3>${esc(f.title)}</h3><div class="notes small">${typeof f.explanation === "function" ? f.explanation() : f.explanation}</div><p class="tiny muted">Specification link: <a href="#/topic/${esc(f.ref)}">${esc(f.ref)}</a></p></div></div><div class="focus-q"></div></section>`);
    $(".focus-q", node).append(B.questions.render(f.question));
    host.append(node);
  };
})(window.BIO);
