// Search index: topics, subsections, learning statements, practicals, maths skills, authored keywords.
window.BIO = window.BIO || {};
(function (B) {
  let index = null;
  function build() {
    index = [];
    for (const u of B.spec.units) {
      index.push({ kind: "Unit", ref: u.ref, title: u.title, text: u.short, href: `#/library/${u.ref}` });
      for (const t of u.topics) {
        index.push({ kind: "Topic", ref: t.ref, title: t.title, text: "", href: `#/library/${u.ref}/${t.ref}` });
        for (const s of t.subsections) {
          const c = (B.content || {})[s.ref]; const kw = c ? (c.keywords || []).join(" ") : "";
          index.push({ kind: "Subsection", ref: s.ref, title: s.title, text: s.statements.map((x) => x.text).join(" ") + " " + kw, href: `#/topic/${s.ref}` });
        }
      }
    }
    for (const p of B.spec.practicals) index.push({ kind: "Required practical", ref: `RP${p.n}`, title: p.title, text: "practical experiment " + p.title, href: `#/lab/${p.n}` });
    for (const m of (B.maths || [])) index.push({ kind: "Maths skill", ref: m.id, title: m.title, text: m.summary || "", href: `#/maths/${m.id}` });
  }
  function query(qs, limit = 12) {
    if (!index) build(); const q = qs.trim().toLowerCase(); if (!q) return [];
    const terms = q.split(/\s+/);
    return index.map((it) => {
      const hay = (it.ref + " " + it.title + " " + it.text).toLowerCase(); let score = 0;
      if (it.ref.toLowerCase() === q) score += 100; if (it.title.toLowerCase().includes(q)) score += 30;
      for (const t of terms) { if (it.ref.toLowerCase().startsWith(t)) score += 20; if (it.title.toLowerCase().includes(t)) score += 8; if (hay.includes(t)) score += 2; }
      return { ...it, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  }
  B.search = { build, query };
})(window.BIO);
