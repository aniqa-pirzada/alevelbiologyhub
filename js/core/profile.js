// Student profile (first-visit onboarding, 2026-11-09). Stored only in this browser, inside the existing store
// (prefs.name, prefs.course). Courses: "y12" International AS (Units 1–2), "y13" International A-level (Units 1–5),
// "full" everything. Older saves have prefs.level "AS" | "A2" and no course: the course is derived from the level and
// nothing is overwritten.
window.BIO = window.BIO || {};
(function (B) {
  const COURSES = {
    y12: { title: "Year 12", desc: "International AS Biology (Units 1–2)", label: "Year 12: International AS Biology (Units 1–2)", short: "Year 12 (AS)", units: ["3.1", "3.2"], level: "AS" },
    y13: { title: "Year 13", desc: "International A-level Biology (Units 1–4 and Unit 5)", label: "Year 13: International A-level Biology (Units 1–4 and Unit 5)", short: "Year 13 (A-level)", units: ["3.1", "3.2", "3.3", "3.4", "3.5"], level: "A2" },
    full: { title: "Full course", desc: "Access everything", label: "Full course: access everything", short: "Full course", units: null, level: "A2" },
  };
  const prefs = () => (B.store.get().prefs = B.store.get().prefs || {});
  function course() { const p = prefs(); if (COURSES[p.course]) return p.course; return p.level === "A2" ? "y13" : "y12"; }
  function hasCourse() { return !!COURSES[prefs().course] || prefs().level === "A2" || !!prefs().levelChosen; }
  function name() { return String(prefs().name || "").trim(); }
  // What onboarding still needs: an empty list means the profile is complete and the popup never shows.
  // A saved first name counts as an existing profile; its level (AS/A2) is kept as the course.
  function missing() { const m = []; if (!name()) m.push("name"); if (!name() && !COURSES[prefs().course]) m.push("course"); return m; }
  function save({ name: n, course: c }) { const p = prefs(); if (typeof n === "string") p.name = n.trim().slice(0, 40); if (c && COURSES[c]) p.course = c; if (COURSES[p.course]) p.level = COURSES[p.course].level; B.store.save(); }
  function unitRefs() { const c = COURSES[course()]; const all = B.spec.units.map((u) => u.ref); return c.units ? all.filter((r) => c.units.includes(r)) : all; }
  function inScope(ref) { const u = unitRefs(); return u.some((x) => String(ref).startsWith(x)); }
  B.profile = { COURSES, course, hasCourse, name, missing, save, unitRefs, inScope };
})(window.BIO);
