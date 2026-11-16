// First-visit onboarding and profile editing (2026-11-09).
// Shows automatically only when B.profile.missing() is not empty (no saved first name). Existing saves with a name never
// see it; their AS/A2 level becomes the course. Edit mode opens from the dashboard, the sidebar profile button or About.
// Nothing here leaves the browser: the name and course are written to the existing local store.
window.BIO = window.BIO || {};
(function (B) {
  const { h, raw } = B.util;
  let openEl = null;

  function open({ mode = "first" } = {}) {
    if (openEl) return;
    const P = B.profile; const need = mode === "first" ? P.missing() : ["name", "course"];
    if (mode === "first" && !need.length) return;
    const askName = need.includes("name"), askCourse = need.includes("course") || mode === "edit";
    const cur = P.course(); const prevFocus = document.activeElement;
    const opts = Object.entries(P.COURSES).map(([k, c]) => h`<label class="ob-opt"><input type="radio" name="ob-course" value="${k}" ${k === cur ? "checked" : ""}><span><strong>${c.title}</strong><span class="small muted">${c.desc}</span></span></label>`).join("");
    const wrap = document.createElement("div"); wrap.className = "ob-backdrop";
    wrap.innerHTML = h`<div class="ob-dialog card" role="dialog" aria-modal="true" aria-labelledby="ob-title" aria-describedby="ob-desc">
      <form id="ob-form" novalidate>
        <div class="eyebrow">${mode === "first" ? "OxfordAQA International Biology (9610)" : "Your profile"}</div>
        <h2 id="ob-title">${mode === "first" ? "Welcome to Biology Lab" : "Change your name or course"}</h2>
        <p id="ob-desc" class="lede">${mode === "first" ? raw("Your personalised OxfordAQA Biology revision space.<br>Before we begin, tell us a little about yourself.") : "Your progress stays exactly as it is."}</p>
        ${askName || mode === "edit" ? raw(h`<div class="ob-field"><label for="ob-name">What should we call you?</label><input id="ob-name" name="name" type="text" autocomplete="given-name" maxlength="40" value="${P.name()}" aria-describedby="ob-name-help ob-name-err" required><p id="ob-name-help" class="tiny muted">First name only. It is stored in this browser and never sent anywhere.</p><p id="ob-name-err" class="ob-err small" role="alert" hidden>Please enter the name you would like us to use.</p></div>`) : ""}
        ${askCourse ? raw(h`<fieldset class="ob-field"><legend>What are you studying?</legend><div class="ob-opts">${raw(opts)}</div><p class="tiny muted">This sets what you see first. You can still open any unit, and you can change it at any time.</p></fieldset>`) : ""}
        <div class="row ob-actions">${mode === "edit" ? raw('<button type="button" class="btn" id="ob-cancel">Cancel</button>') : ""}<button type="submit" class="btn primary" id="ob-save">${mode === "first" ? "Start revising" : "Save"}</button></div>
      </form></div>`;
    document.body.appendChild(wrap); openEl = wrap;
    document.querySelector(".app")?.setAttribute("aria-hidden", "true");
    const dlg = wrap.querySelector(".ob-dialog"); const form = wrap.querySelector("#ob-form");
    const focusables = () => Array.from(dlg.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])')).filter((e) => !e.disabled && e.offsetParent !== null);
    const first = wrap.querySelector("#ob-name") || wrap.querySelector('input[name="ob-course"]:checked') || wrap.querySelector("#ob-save");
    setTimeout(() => first && first.focus(), 30);
    const close = () => { wrap.remove(); openEl = null; document.querySelector(".app")?.removeAttribute("aria-hidden"); if (prevFocus && document.body.contains(prevFocus)) prevFocus.focus(); else document.getElementById("content")?.focus(); };
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { const f = focusables(); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
      if (e.key === "Escape" && mode === "edit") { e.preventDefault(); close(); }
    });
    wrap.querySelector("#ob-cancel")?.addEventListener("click", close);
    form.addEventListener("submit", (e) => {
      e.preventDefault(); const nameEl = wrap.querySelector("#ob-name"); const err = wrap.querySelector("#ob-name-err");
      const name = nameEl ? nameEl.value.trim() : P.name();
      if (nameEl && !name) { err.hidden = false; nameEl.setAttribute("aria-invalid", "true"); nameEl.focus(); return; }
      const c = wrap.querySelector('input[name="ob-course"]:checked'); P.save({ name, course: c ? c.value : undefined });
      close(); if (B.app.rebuildNav) B.app.rebuildNav(); B.app.navigate(); if (B.util.toast) B.util.toast(mode === "first" ? `Welcome, ${name}.` : "Profile saved.");
    });
  }

  B.onboarding = { open, maybeShow: () => { if (B.profile.missing().length) open({ mode: "first" }); } };
})(window.BIO);
