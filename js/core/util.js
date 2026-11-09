// Small DOM and formatting helpers. All user-entered text goes through esc() before being rendered as HTML.
window.BIO = window.BIO || {};
(function (B) {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const h = (strings, ...vals) => strings.reduce((acc, s, i) => acc + s + (i < vals.length ? (vals[i] instanceof Raw ? vals[i].v : esc(vals[i])) : ""), "");
  class Raw { constructor(v) { this.v = v; } }
  const raw = (v) => new Raw(v);
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmtDate = (ts) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fmtDateTime = (ts) => new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const dayKey = (ts = Date.now()) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  let toastTimer;
  const toast = (msg) => { let t = $("#toast"); if (!t) { t = el('<div id="toast" class="toast" role="status" aria-live="polite"></div>'); document.body.appendChild(t); } t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600); };
  // Normalise free-text answers for gap-fill marking: trim, lower-case, collapse spaces, strip punctuation, unify hyphens.
  const normalise = (s) => String(s ?? "").toLowerCase().replace(/[‐‑‒–—]/g, "-").replace(/[^a-z0-9\s\-+]/g, "").replace(/\s+/g, " ").trim();
  const icons = {
    dashboard: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>',
    book: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 3v18M12 8h5M12 12h5"/></svg>',
    lab: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M8 15h8"/></svg>',
    maths: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V4M4 20h16"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
    cards: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 6V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/></svg>',
    synoptic: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5l-5.5 4.5M12 11.5l5.5 4.5"/></svg>',
    exam: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    planner: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    progress: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V10M10 19V5M16 19v-8M22 19H2"/></svg>',
    check: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
    search: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    menu: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    seed: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21V11"/><path d="M12 11c-5 0-7-3-7-7 4 0 7 2 7 7zM12 13c0-4 3-6 7-6 0 4-2 6-7 6z"/></svg>',
  };
  // Gap-fill marking (fixed 2026-11-04 after independent review): decimal points and signs are significant. Numeric
  // answers are compared as numbers (so "2.50" = "2.5", "1,000" = "1000", but "25" ≠ "2.5" and "1000" ≠ "1.000");
  // a trailing unit after a number is ignored. Text answers ignore case, punctuation, hyphen v space and Greek v
  // spelled-out letters (α = alpha, β = beta).
  // Standard form (added 2026-11-05): "1 × 10⁶", "1x10^6", "10⁶", "10^-3", "1.5e6" and "1.5 × 10⁻³ m" are read as numbers,
  // so "10⁶" is no longer misread as 10 and "1 × 10⁶" as 1.
  const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
  const stdForm = (s) => { const x = String(s).trim().replace(/[−–—]/g, "-").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => "^" + [...m].map((c) => SUP[c]).join(""));
    let m = x.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*[×x*·]\s*10\s*\^\s*([+-]?\d+)(?:\s*[^\d.\s^].*)?$/i); if (m) return parseFloat(m[1]) * Math.pow(10, +m[2]);
    m = x.match(/^([+-])?10\s*\^\s*([+-]?\d+)(?:\s*[^\d.\s^].*)?$/); if (m) return (m[1] === "-" ? -1 : 1) * Math.pow(10, +m[2]);
    m = x.match(/^([+-]?(?:\d+\.?\d*|\.\d+))e([+-]?\d+)(?:\s*[^\d.\s].*)?$/i); if (m) return parseFloat(m[1]) * Math.pow(10, +m[2]); return null; };
  const num0 = (s) => { const m = String(s).trim().replace(/[−–—]/g, "-").replace(/(\d)[,\u0020\u00a0\u2009\u202f](?=\d{3}(?!\d))/g, "$1").match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:\s*[^\d.\s].*)?$/); return m ? parseFloat(m[1]) : null; };
  const num = (s) => { const sf = stdForm(s); if (sf !== null) return sf; if (/\d\s*\^|[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(String(s))) return null; return num0(s); };
  const textKey = (s) => String(s ?? "").toLowerCase().replace(/α/g, "alpha").replace(/β/g, "beta").replace(/[‐‑‒–—-]/g, " ").replace(/[^\p{L}\p{N}\s+]/gu, "").replace(/\s+/g, " ").trim();
  const answerMatches = (given, expected) => { const ne = num(expected); if (ne !== null && /^\s*[+\-−]?[\d.]/.test(String(expected))) { const ng = num(given); return ng !== null && Math.abs(ng - ne) <= 1e-9 * Math.max(1, Math.abs(ne)); } return textKey(given) === textKey(expected) && textKey(given) !== ""; };
  B.util = { esc, h, raw, el, $, $$, fmtDate, fmtDateTime, pct, shuffle, uid, dayKey, toast, normalise, answerMatches, icons };
})(window.BIO);
