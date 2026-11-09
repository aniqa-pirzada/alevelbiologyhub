// Optional authorised question banks (Phase 4, 2026-11-05).
// The core platform never depends on a bank. If a folder `restricted/` containing `manifest.js` sits beside index.html,
// and that manifest records an explicit authorisation, its question sets are loaded and shown alongside the original
// questions through the existing past-paper views (js/views/exampro.js). If the folder is absent (the distributable build),
// nothing happens. Authorisation is never inferred from school access to Exampro: the manifest must say who authorised
// the use and its scope. The restricted folder is never packaged or published (see EXAMPRO_IMPORT.md).
//
// restricted/manifest.js:
//   window.BIO.restrictedManifest = { authorised: true, authorisedBy: "…", scope: "…", date: "YYYY-MM-DD",
//                                     sets: ["3.1.2.js"], assetsBase: "restricted/" };
window.BIO = window.BIO || {};
(function (B) {
  const banks = (B.banks = { ready: false, sets: [], base: "restricted/", note: "" });
  const load = (src) => new Promise((res) => { const s = document.createElement("script"); s.src = src; s.async = false; s.onload = () => res(true); s.onerror = () => { s.remove(); res(false); }; document.head.appendChild(s); });
  // Point figure paths inside a loaded set at the restricted folder instead of the public assets folder.
  const rebase = (v, base) => (typeof v === "string" ? v.split("assets/exampro/").join(base + "assets/exampro/") : Array.isArray(v) ? v.map((x) => rebase(x, base)) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rebase(x, base)])) : v);
  banks.load = async function () {
    const found = await load(banks.base + "manifest.js"); const m = found && B.restrictedManifest;
    if (!m) { banks.ready = true; return banks; }
    if (m.authorised !== true || !m.authorisedBy || !m.scope) { banks.note = "A restricted bank is present but its manifest records no authorisation; it was not loaded."; banks.ready = true; return banks; }
    const base = typeof m.assetsBase === "string" && /^[\w./-]*$/.test(m.assetsBase) ? m.assetsBase : banks.base;
    const before = new Set(Object.keys(B.exampro || {}));
    for (const f of m.sets || []) if (/^[\w.-]+\.js$/.test(f)) await load(banks.base + f);
    for (const k of Object.keys(B.exampro || {})) if (!before.has(k)) B.exampro[k] = rebase(B.exampro[k], base);
    banks.sets = Object.keys(B.exampro || {}); banks.note = `Licensed bank loaded (${m.scope}; authorised by ${m.authorisedBy}, ${m.date || "date not given"}).`; banks.ready = true;
    document.dispatchEvent(new CustomEvent("bio:banks-loaded", { detail: { sets: banks.sets } })); return banks;
  };
})(window.BIO);
