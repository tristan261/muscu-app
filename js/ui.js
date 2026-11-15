/* FORGE V2 — interface : 4 onglets (Aujourd'hui · Séance · Bilan · Manger) + réglages */
"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const UI = { ready: null, stripNext: false, off: null, openSlot: null, fromStrip: false, selSlot: null, genWk: null, genDays: [], genEasy: false, mangerTab: "now", mealDate: null, mealSlot: null, weekOff: 0, weekDi: null, recType: "tractions", cmpA: null, cmpB: null, parkDraft: null, suppress: 0, nowOverride: null };
const ACTIONS = {};
const SUB = { horsapp: "seance", generer: "today", reglages: "today", fiches: "today", parcs: "today", badges: "today", rappels: "today", photos: "bilan" };

/* ---------- Outils d'interface ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3600);
}
function openSheet(html) { $("#sheet-box").innerHTML = html; $("#sheet").hidden = false; hydratePhotos(); }
function closeSheet() { $("#sheet").hidden = true; $("#sheet-box").innerHTML = ""; }
function announceBadges() {
  const fresh = checkBadges();
  if (fresh.length) toast(`${fresh[0].ic} Nouveau badge : ${fresh[0].n}`);
  return fresh;
}
function pickImage() {
  return new Promise((res) => {
    const inp = $("#file-img"); inp.value = "";
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return res(null);
      try { res(await fileToDataUrl(f)); } catch (e) { toast("Impossible de lire cette image"); res(null); }
    };
    inp.click();
  });
}
function hydratePhotos() {
  document.querySelectorAll("img[data-photo]").forEach((img) => {
    const id = img.dataset.photo; img.removeAttribute("data-photo");
    photoGet(id).then((data) => { if (data) img.src = data; }).catch(() => {});
  });
}
const route = () => { const r = (location.hash || "#/today").replace(/^#\//, ""); return r || "today"; };
const go = (r) => { if (route() === r) render(); else location.hash = "#/" + r; };
const tick = (on) => `<span class="check ${on ? "on" : ""}" aria-hidden="true">✓</span>`;
const checkBtn = (on, a, attrs = "") => `<button class="check ${on ? "on" : ""}" data-a="${a}" ${attrs} aria-pressed="${on}" aria-label="Cocher">✓</button>`;
const backLink = (to = "reglages", label = "Réglages") => `<a class="back" href="#/${to}">‹ ${label}</a>`;
const medWord = () => (S.profile.med && S.profile.medName ? esc(S.profile.medName) : "ton médicament");
const nowHM = () => UI.nowOverride || (() => { const n = new Date(); return pad2(n.getHours()) + ":" + pad2(n.getMinutes()); })();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const exName = (id) => EXERCISES[id].n;

/* ---------- Graphique en ligne (SVG) ---------- */
function lineChart(pts, opt = {}) {
  if (!pts.length) return `<p class="muted small center">Pas encore de données.</p>`;
  const W = 340, H = 200, L = 34, R = 16, T = 18, B = 26;
  const goals = opt.goals || [];
  const ts = pts.map((p) => parseYmd(p.d).getTime());
  const t0 = ts[0], t1 = Math.max(ts[ts.length - 1], t0 + 14 * 86400000);
  const vals = pts.map((p) => p.v).concat(goals.map((g) => g.v));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const padv = Math.max(1, (hi - lo) * 0.12); lo = Math.floor(lo - padv); hi = Math.ceil(hi + padv);
  if (opt.zero) lo = Math.max(0, lo);
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const v = lo + ((hi - lo) * i) / 4;
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#2a303b" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
  }
  goals.forEach((gl) => {
    g += `<line x1="${L}" x2="${W - R}" y1="${y(gl.v)}" y2="${y(gl.v)}" stroke="${gl.color}" stroke-width="2" stroke-dasharray="6 5"/>` +
      `<text x="${L + 6}" y="${y(gl.v) - 6}" style="fill:${gl.color};font-weight:700">${esc(gl.label)}</text>`;
  });
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(ts[i]).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  g += `<path d="${path}" fill="none" stroke="#b8ff2c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  pts.forEach((p, i) => {
    const lastPt = i === pts.length - 1;
    g += `<circle cx="${x(ts[i])}" cy="${y(p.v)}" r="${lastPt ? 6 : 3.5}" fill="#b8ff2c" stroke="#151920" stroke-width="2"><title>${frDate(p.d)} : ${fmtKg(p.v)}</title></circle>`;
    if (lastPt) g += `<text x="${x(ts[i]) > W - 60 ? W - 4 : x(ts[i])}" y="${y(p.v) - 12}" text-anchor="${x(ts[i]) > W - 60 ? "end" : "middle"}" style="fill:#f2f4f7;font-size:13px;font-weight:800">${fmtKg(p.v)}${opt.unit || ""}</text>`;
  });
  g += `<text x="${L}" y="${H - 6}">${frShort(pts[0].d)}</text>`;
  if (pts.length > 1) g += `<text x="${x(ts[ts.length - 1])}" y="${H - 6}" text-anchor="middle">${frShort(pts[pts.length - 1].d)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || "Graphique")}">${g}</svg>`;
}

/* ================= 1. AUJOURD'HUI ================= */
function sessionCard() {
  if (S.current) {
    return `<div class="card hl"><span class="eyebrow">Séance en cours</span><h2>${SESSIONS[S.current.type].n}</h2>
      <button class="btn primary big" data-a="resume">Reprendre la séance</button></div>`;
  }
  const t = todayState();
  if (t.status === "noplan") {
    const n = nextSession();
    if (n) {
      return `<div class="card hl"><span class="eyebrow">Ta semaine</span><h2>Prochaine séance : ${dayName(n.d)} – ${SESSIONS[n.type].n}</h2>
        <p class="muted">Pas de séance prévue aujourd'hui.</p>${extraButton()}<a class="btn" href="#/generer">Générer ma semaine</a></div>`;
    }
    return `<div class="card hl"><span class="eyebrow">Ta semaine</span><h2>Pas encore de semaine prévue</h2>
      <p class="muted">Tu choisis tes jours, je prépare tes séances, tes repas et ta liste de courses.</p>
      <a class="btn primary big" href="#/generer">Générer ma semaine</a>${extraButton()}</div>`;
  }
  if (t.status === "train") {
    const type = t.slot.type, items = buildSession(type), mins = estMinutes(items), short = estMinutes(buildSession(type, undefined, true));
    return `<div class="card hl"><span class="eyebrow">Séance ${t.n} sur ${t.W.slots.length} cette semaine</span><h2>${SESSIONS[type].n}</h2>
      <p class="muted">Environ ${mins} minutes, échauffement compris${SESSIONS[type].heavy ? "" : " · séance plus légère"}</p>
      <button class="btn primary big" data-a="start" data-wk="${t.wk}" data-slot="${t.idx}">Démarrer</button>
      <button class="link" data-a="start" data-wk="${t.wk}" data-slot="${t.idx}" data-short="1">Je n'ai que 30 min (version courte, ${short} min)</button></div>`;
  }
  if (t.status === "done") {
    const n = t.W.slots.filter((s) => s.done).length;
    return `<div class="card"><span class="eyebrow">Séance du jour</span><h2>✅ Séance faite</h2>
      <p class="muted">${n} sur ${t.W.slots.length} cette semaine. Maintenant mange bien et dors : c'est là que le muscle se construit.</p></div>`;
  }
  return `<div class="card"><span class="eyebrow">Aujourd'hui</span><h2>😴 Repos aujourd'hui : mange bien</h2>
    <p class="muted">Les muscles grandissent quand tu récupères.</p>${extraButton()}</div>`;
}
/* Bouton « Faire une séance aujourd'hui quand même » : seulement un jour non prévu, si une séance reste à faire */
function extraButton() {
  const r = extraSession(true);
  return r.ok ? `<button class="btn" data-a="extra-ask">💪 Faire une séance aujourd'hui quand même</button>` : "";
}
const STRIP_NAME = { S1: "Tirage", S2: "Poussée", S3: "Tech." };
function weekStrip() {
  const cur = weekKey(today()), nxt = addDays(cur, 7), hasNext = !!S.weeks[nxt], showNext = !!UI.stripNext && hasNext, wk = showNext ? nxt : cur;
  const L = ["L", "M", "M", "J", "V", "S", "D"], days = weekDays(wk);
  const cells = days.map((x) => {
    const cls = ["wd", x.slot ? "ses" : "", x.slot && x.slot.done ? "done" : "", x.d === today() ? "today" : ""].join(" ");
    const inner = `<span class="wl">${L[x.di]}</span><span class="wn">${parseYmd(x.d).getDate()}</span><span class="ws">${x.slot ? (x.slot.done ? "✓" : STRIP_NAME[x.slot.type]) : ""}</span>`;
    return x.slot ? `<button class="${cls}" data-a="strip-day" data-wk="${wk}" data-i="${x.idx}" aria-label="${cap(dayName(x.d))} : ${SESSIONS[x.slot.type].n}${x.slot.done ? " (faite)" : ""}">${inner}</button>` : `<div class="${cls}">${inner}</div>`;
  }).join("");
  let line = "";
  if (showNext) line = `Semaine du ${frDate(wk)} au ${frDate(addDays(wk, 6))}`;
  else if (!days.some((x) => x.d === today() && x.slot)) {
    const n = nextSession(), od = overdueSession();
    line = n ? `Prochaine séance : ${dayName(n.d)} – ${SESSIONS[n.type].n}` : od ? `Séance à rattraper : ${SESSIONS[od.type].n}` : "";
  }
  const tabs = hasNext ? `<div class="seg"><button class="${showNext ? "" : "on"}" data-a="strip-week" data-next="0">Cette semaine</button><button class="${showNext ? "on" : ""}" data-a="strip-week" data-next="1">Semaine prochaine</button></div>` : "";
  return `<div class="card" style="gap:8px"><span class="eyebrow">Ma semaine</span>${tabs}<div class="strip">${cells}</div>${line ? `<p class="small acc" style="font-weight:650">${line}</p>` : ""}</div>`;
}
ACTIONS["strip-week"] = (el) => { UI.stripNext = el.dataset.next === "1"; render(); };
ACTIONS["ready-close"] = () => { UI.ready = null; render(); };
ACTIONS["strip-day"] = (el) => { UI.openSlot = { wk: el.dataset.wk, i: +el.dataset.i }; UI.fromStrip = true; go("seance"); };
function mealsCard() {
  const d = today(), c = checksOf(d), ed = (S.eaten && S.eaten[d]) || {}, times = mealTimes(d), nx = currentSlotIdx(nowHM());
  const rows = dayMeals(d).map((x, i) => {
    const on = !!c[x.slot.id], eid = ed[x.slot.id], name = on && eid && eid !== x.meal.id ? eatenName(eid) : x.meal.n;
    return `<div class="line mrow ${i === nx && !on ? "next" : ""}" data-a="meal-check" data-slot="${x.slot.id}" data-hold="${x.slot.id}" role="button" tabindex="0">
      ${tick(on)}<div class="grow"><div class="small muted">${x.slot.n} · ${times[i]}</div><div class="t ${on ? "done-txt" : ""}">${esc(name)}</div></div></div>`;
  }).join("");
  return `<div class="card"><div class="row between"><span class="eyebrow">Mes repas</span><span class="pill">${mainChecks(d)}/4</span></div><div>${rows}</div>
    <p class="muted small center">Touche pour cocher · appui long pour voir le repas</p></div>`;
}
function viewToday() {
  const nm = S.profile.name ? `, ${esc(S.profile.name)}` : "", st = streakWeeks();
  ensurePlan(weekKey(today()));
  return `
  <div class="row between"><div><p class="muted small">${cap(frDateLong(today()))}</p><h1>Salut${nm}</h1></div>
    <a class="icon-btn gear" href="#/reglages" aria-label="Réglages">⚙️</a></div>
  ${UI.ready ? `<div class="card hl"><div class="row between"><b>✅ ${UI.ready}</b><button class="icon-btn" data-a="ready-close" aria-label="Fermer">✕</button></div></div>` : ""}
  ${weekStrip()}
  <div class="row"><span class="pill ${st ? "acc" : ""}">${st ? "🔥" : "✨"} ${st} semaine${st > 1 ? "s" : ""} d'affilée avec 3 séances</span></div>
  ${sessionCard()}${mealsCard()}${battantCard()}`;
}

/* ---------- Mode battant : défi 12 semaines ---------- */
function battantCard() {
  if (!battantOn()) {
    return `<div class="card soft"><div class="row between"><span class="eyebrow">🥊 Mode battant</span></div>
      <b>Défi 12 semaines</b><p class="muted small">Chaque jour : tes 4 repas, ta nuit de 9 h et ta séance quand elle est prévue. Un score de régularité te montre si tu tiens le rythme.</p>
      <button class="btn" data-a="bat-info">Voir le défi</button></div>`;
  }
  if (battantDone()) {
    const scores = Array.from({ length: 12 }, (_, i) => battantWeekScore(i + 1) || 0), avg = Math.round(sum(scores) / 12);
    return `<div class="card hl"><span class="eyebrow">🥊 Mode battant · terminé</span><h2>12 semaines bouclées : ${avg} % de régularité</h2>
      <p class="muted small">${battantGoodWeeks()} semaine${battantGoodWeeks() > 1 ? "s" : ""} à 80 % ou plus. Compare ta photo du mois avec celle du départ.</p>
      <button class="btn primary" data-a="bat-go">Relancer un défi de 12 semaines</button><button class="btn ghost" data-a="bat-stop">Masquer</button></div>`;
  }
  const d = today(), b = battantDay(d), n = battantDayNo(d), wn = battantWeekNo(d), ws = battantWeekScore(wn);
  const row = (on, label, sub, act) => act
    ? `<div class="line" data-a="${act}" role="button" tabindex="0">${tick(on)}<div class="grow"><div class="t ${on ? "done-txt" : ""}">${label}</div><div class="small muted">${sub}</div></div></div>`
    : `<div class="line">${tick(on)}<div class="grow"><div class="t ${on ? "done-txt" : ""}">${label}</div><div class="small muted">${sub}</div></div></div>`;
  const rows = [
    row(b.meals === 4, `Mes 4 repas (${b.meals}/4)`, "se coche tout seul avec « Mes repas »"),
    row(b.sleep, "Nuit de 9 h", "couché avant 23 h, téléphone loin du lit : touche pour cocher", "bat-sleep"),
    b.sDay ? row(b.done, "Ma séance du jour", b.done ? "faite 💪" : "se coche toute seule à la fin de la séance")
      : row(b.bonus, "Bonus repos : circuit 15 min (facultatif)", "léger, ne gêne pas ta récupération : touche pour cocher", "bat-bonus"),
  ].join("");
  return `<div class="card hl"><div class="row between"><span class="eyebrow">🥊 Mode battant · jour ${n}/${BATTANT_DAYS}</span><span class="pill ${b.pct >= 80 ? "acc" : ""}">${b.pct} %</span></div>
    <div class="row between"><b>Semaine ${wn}/12</b><span class="small muted">régularité ${ws != null ? ws : 0} %</span></div>
    <div class="bar"><i style="width:${Math.round((n / BATTANT_DAYS) * 100)}%"></i></div>
    <div>${rows}</div>
    ${!b.sDay ? `<button class="btn ghost" data-a="bat-circuit">Voir le circuit bonus</button>` : ""}
    <p class="muted small center">Objectif : 80 % chaque semaine. Une journée ratée ne casse rien : la suivante compte autant.</p></div>`;
}
ACTIONS["bat-info"] = () => openSheet(`<div class="row between"><h2>🥊 Mode battant</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
  <p>12 semaines pour être régulier sur ce qui fait vraiment changer ton physique. Chaque jour, tu marques des points :</p>
  <div class="card soft" style="gap:6px"><div>🍽️ <b>Tes 4 repas</b> : 1 point chacun (même le midi, même petit)</div>
    <div>😴 <b>Une nuit de 9 h</b> : 1 point (c'est la nuit que le muscle se construit)</div>
    <div>💪 <b>Ta séance</b>, les jours où elle est prévue : 2 points</div>
    <div>⚡ <b>Bonus</b> les jours de repos : circuit léger de 15 min, 1 point en plus (facultatif)</div></div>
  <p class="muted small">Objectif : 80 % de régularité chaque semaine. Badges à 4, 8 et 12 semaines. Pas de séance en plus les jours de repos : t'entraîner plus dur ne te ferait pas progresser plus vite, ça t'exposerait surtout aux blessures.</p>
  <button class="btn primary big" data-a="bat-go">Lancer le défi aujourd'hui</button><button class="btn ghost" data-a="close-sheet">Plus tard</button>`);
ACTIONS["bat-go"] = () => { battantStart(today()); closeSheet(); toast("🥊 Défi lancé : 12 semaines, c'est parti !"); render(); };
ACTIONS["bat-sleep"] = () => { battantToggle(today(), "sleep"); announceBadges(); render(); };
ACTIONS["bat-bonus"] = () => { battantToggle(today(), "bonus"); announceBadges(); render(); };
ACTIONS["bat-circuit"] = () => openSheet(`<div class="row between"><h2>⚡ Circuit bonus · 15 min</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
  <p class="muted small">3 tours, sans forcer, 1 min de pause entre les tours. Ça doit rester facile : c'est un jour de repos.</p>
  <div>${BONUS_CIRCUIT.map((x) => `<div class="line"><div class="grow"><div class="t">${x.t}</div><div class="small muted">${x.d}</div></div></div>`).join("")}</div>
  <button class="btn primary" data-a="bat-bonus-done">C'est fait ✓</button><button class="btn ghost" data-a="close-sheet">Fermer</button>`);
ACTIONS["bat-bonus-done"] = () => { if (!battantMark(today()).bonus) battantToggle(today(), "bonus"); closeSheet(); toast("⚡ Bonus validé"); render(); };
ACTIONS["bat-stop"] = () => { if (!confirm("Arrêter le mode battant ? Ton historique du défi sera effacé.")) return; battantStop(); render(); };
ACTIONS["meal-check"] = (el) => {
  if (UI.suppress > Date.now()) return;
  const d = today(), was = isFullDay(d);
  toggleMeal(d, el.dataset.slot);
  if (!was && isFullDay(d)) toast("🍽️ Les 4 repas du jour : bravo !");
  announceBadges(); render();
};

/* ================= 2. GÉNÉRER MA SEMAINE ================= */
function genState() {
  const cur = weekKey(today()), nxt = addDays(cur, 7), Wc = S.weeks[cur], oc = genOptions(cur);
  const wk = UI.genWk || ((!Wc || (Wc.slots.length < 3 && oc.max > 0)) && oc.days.some((d) => !d.disabled) ? cur : nxt);
  if (UI.genWk !== wk || !UI.genTouched) {
    UI.genWk = wk;
    if (!UI.genTouched) {
      const o = genOptions(wk), W = S.weeks[wk], ok = (d) => o.days.some((x) => x.d === d && !x.disabled);
      const base = wk === cur ? addDays(cur, -7) : cur;
      const easy = !!S.weeks[base] && distinctDaysInWeek(base) < 2 && wk !== cur;
      let days = easy ? EASY_DAYS.map((i) => addDays(wk, i)) : S.profile.days.map((wd) => addDays(wk, (wd + 6) % 7));
      if (W && wk === cur) { const pending = W.slots.filter((x) => !x.done).map((x) => x.d); if (pending.length) days = pending; }
      UI.genDays = days.filter(ok).sort().slice(0, o.max); UI.genEasy = easy;
    }
  }
  return wk;
}
function viewGenerer() {
  const wk = genState(), cur = weekKey(today()), o = genOptions(wk), sel = [...UI.genDays].sort();
  const isCur = wk === cur, full = o.max === 0;
  let preview = "";
  if (sel.length >= 1 && sel.length <= o.max) {
    try {
      const b = buildWeek(wk, sel);
      preview = `<div class="card soft"><span class="eyebrow">Ta semaine</span>${b.slots.map((x) => `<div class="line"><b style="min-width:90px">${cap(dayName(x.d))}</b><span>${SESSIONS[x.type].n}${x.done ? " ✓" : ""}</span></div>`).join("")}
        ${b.msg ? `<p class="small" style="color:var(--blue)">ℹ️ ${b.msg}</p>` : ""}</div>`;
    } catch (e) { preview = ""; }
  }
  const hint = full ? "" : o.max < 3 ? `Il te reste <b>${o.max} séance${o.max > 1 ? "s" : ""}</b> à placer cette semaine : choisis <b>1${o.max > 1 ? " à " + o.max : ""} jour${o.max > 1 ? "s" : ""}</b>. Je mets en priorité le tirage + muscle-up, puis la poussée, puis la technique.`
    : isCur ? "Choisis les jours qui te restent (1 à 3). Avec moins de 3 jours, je mets en priorité le tirage + muscle-up, puis la poussée." : "Choisis tes jours (3 de préférence, 1 ou 2 si la semaine est chargée).";
  return `${backLink("today", "Aujourd'hui")}<h1>Générer ma semaine</h1>
  <div class="seg"><button class="${isCur ? "on" : ""}" data-a="gen-week" data-wk="${cur}">Cette semaine</button><button class="${!isCur ? "on" : ""}" data-a="gen-week" data-wk="${addDays(cur, 7)}">Semaine prochaine</button></div>
  <p class="muted small center">Semaine du ${frDate(wk)} au ${frDate(addDays(wk, 6))}</p>
  ${full ? `<div class="card soft"><b>Les 3 séances de cette semaine sont faites 🎉</b><p class="muted small">Il n'y a plus rien à planifier : mange bien et récupère. Tu peux préparer la semaine prochaine.</p></div>` : `
  ${UI.genEasy ? `<div class="card soft"><p class="small">La semaine dernière a été chargée, ça arrive. Je te propose des jours bien espacés pour repartir tranquille : change-les si tu veux.</p></div>` : ""}
  <div class="card"><span class="eyebrow">1 · Touche tes jours</span><p class="small">${hint}</p>
    <div class="grid2">${o.days.map((x, i) => { const on = UI.genDays.includes(x.d);
      return `<button class="btn ${on ? "primary" : ""}" ${x.disabled ? 'disabled style="opacity:.35"' : ""} data-a="gen-day" data-d="${x.d}">${DAYS_FR[i]} ${parseYmd(x.d).getDate()}${x.done ? " ✓" : ""}</button>`; }).join("")}</div>
    <p class="muted small center">${sel.length}/${o.max} jour${o.max > 1 ? "s" : ""} choisi${sel.length > 1 ? "s" : ""}</p></div>
  ${preview}
  <div class="card"><span class="eyebrow">2 · C'est parti</span>
    <p class="muted small">Je prépare tes séances (calées sur ton niveau du moment), ton plan repas et ta liste de courses.${S.weeks[wk] ? " Cela remplace les séances pas encore faites de cette semaine." : ""}</p>
    <button class="btn primary big" data-a="gen-do" ${sel.length >= 1 && sel.length <= o.max ? "" : 'disabled style="opacity:.4"'}>Générer</button></div>`}`;
}
ACTIONS["gen-week"] = (el) => { UI.genWk = el.dataset.wk; UI.genDays = []; UI.genTouched = false; render(); };
ACTIONS["gen-day"] = (el) => {
  const d = el.dataset.d, i = UI.genDays.indexOf(d), o = genOptions(UI.genWk);
  if (i >= 0) UI.genDays.splice(i, 1); else if (UI.genDays.length < o.max) UI.genDays.push(d); else toast(`${o.max} jour${o.max > 1 ? "s" : ""} au maximum : retires-en un d'abord`);
  UI.genEasy = false; UI.genTouched = true; render();
};
ACTIONS["gen-do"] = () => {
  const wk = UI.genWk, cur = weekKey(today());
  try { generateWeek(wk, UI.genDays); } catch (e) { return toast(e.message); }
  UI.genWk = null; UI.genDays = []; UI.genTouched = false; UI.openSlot = null;
  UI.ready = `Semaine du ${frDate(wk)} au ${frDate(addDays(wk, 6))} prête`; UI.stripNext = wk !== cur;
  toast("✅ " + UI.ready); go("today");
};

/* ================= 3. SÉANCE ================= */
function slotStatus(sl) {
  if (sl.done) return { t: "Faite ✓", c: "acc" };
  if (sl.d === today()) return { t: "Aujourd'hui", c: "acc" };
  if (sl.d < today()) return { t: "À rattraper", c: "" };
  return { t: "À venir", c: "" };
}
const muTip = (st) => [
  "Porte 1 : 10 tractions strictes + 10 dips propres. En attendant : tractions explosives (le plus haut possible) et suspension active.",
  "Porte 2 : 5 tractions explosives où la poitrine touche la barre.",
  "Porte 3 : 3 négatives de muscle-up contrôlées (5 secondes).",
  "Essais de muscle-up en début de séance, frais. On arrête dès que la technique se dégrade.",
  "Muscle-up validé 👑 Les essais restent en début de séance pour l'entretenir.",
][st];
const exLine = (it) => `<div class="exrow"><span>${esc(exName(it.exId))}${it.kg ? ` <span class="pill">🎒 +${fmtKg(it.kg)} kg</span>` : ""}</span><span class="muted small">${targetsLabel(it)}</span></div>`;
function slotCard(wk, i, sl) {
  const items = buildSession(sl.type), ss = slotStatus(sl);
  return `<div class="card slotcard ${sl.d === today() && !sl.done ? "hl" : ""}" data-a="open-slot" data-wk="${wk}" data-i="${i}" role="button" tabindex="0">
    <div class="row between"><div><span class="eyebrow">${cap(frDateLong(sl.d))}</span><h3>${SESSIONS[sl.type].n}</h3></div><span class="pill ${ss.c}">${ss.t}</span></div>
    <div>${items.map(exLine).join("")}</div>
    <div class="row between"><span class="muted small">Environ ${estMinutes(items)} min</span><span class="link">Ouvrir ›</span></div></div>`;
}
function viewSeance() {
  const cur = weekKey(today()), nxt = addDays(cur, 7), Wc = weekPlan(cur), Wn = weekPlan(nxt);
  const open = UI.openSlot && S.weeks[UI.openSlot.wk] && S.weeks[UI.openSlot.wk].slots[UI.openSlot.i] ? UI.openSlot : null;
  if (open) return viewSlotDetail(open.wk, open.i);
  const resume = S.current ? `<div class="card hl"><h3>Séance en cours : ${SESSIONS[S.current.type].n}</h3><button class="btn primary" data-a="resume">Reprendre</button></div>` : "";
  const block = (wk, W, label) => `<div class="row between"><h2>${label}</h2><span class="muted small">du ${frDate(wk)} au ${frDate(addDays(wk, 6))}</span></div>
    ${W.msg ? `<p class="small" style="color:var(--blue)">ℹ️ ${W.msg}</p>` : ""}${W.slots.map((sl, i) => slotCard(wk, i, sl)).join("")}`;
  const extra = !S.current && Wc ? extraButton() : "";
  return `<h1>Séance</h1>${resume}${extra}
  ${Wc ? block(cur, Wc, "Cette semaine") : `<div class="card hl"><h2>Pas encore de semaine prévue</h2><p class="muted">Choisis tes 3 jours : je prépare tout.</p><a class="btn primary big" href="#/generer">Générer ma semaine</a></div>`}
  ${Wn ? block(nxt, Wn, "Semaine prochaine") : (Wc ? `<a class="btn ghost" href="#/generer">Préparer la semaine prochaine</a>` : "")}
  <button class="btn" data-a="off-open">📝 J'ai fait une séance sans l'app</button>
  <p class="muted small center">Touche une séance pour voir son contenu en détail, même avant le jour J.</p>`;
}
function viewSlotDetail(wk, i) {
  const cur = weekKey(today()), W = S.weeks[wk], sl = W.slots[i], items = buildSession(sl.type), st = muStage(), ss = slotStatus(sl);
  const isCur = wk === cur, canStart = isCur && !S.current && !sl.done && sl.d <= today();
  let action = "";
  if (S.current) action = `<button class="btn primary big" data-a="resume">Reprendre la séance en cours</button>`;
  else if (sl.done) action = `<p class="center muted">✅ Séance déjà faite</p>`;
  else if (canStart) action = `<button class="btn primary big" data-a="start" data-wk="${wk}" data-slot="${i}">${sl.d === today() ? "Démarrer" : "Rattraper cette séance"}</button>
      <button class="link" data-a="start" data-wk="${wk}" data-slot="${i}" data-short="1">Je n'ai que 30 min (${estMinutes(buildSession(sl.type, undefined, true))} min)</button>`;
  else action = `<p class="muted small center">${isCur ? `Prévue ${dayName(sl.d)}.` : "Cette séance est prévue la semaine prochaine."} Tu peux la regarder en avance${isCur ? "" : " : les charges et les reps peuvent encore s'ajuster d'ici là"}.</p>`;
  return `<a class="back" href="#/seance" data-a="close-slot">‹ Toutes les séances</a>
  <div class="card"><div class="row between"><div><span class="eyebrow">${cap(frDateLong(sl.d))}</span><h2>${SESSIONS[sl.type].n}</h2></div><span class="pill ${ss.c}">${ss.t}</span></div>
    <p class="muted small">Environ ${estMinutes(items)} min · pas de série à l'échec : garde toujours 1 à 2 reps en réserve</p>
    <div>
      <div class="line"><span style="font-size:22px">🔥</span><div class="grow"><div class="t">Échauffement guidé</div><div class="muted small">5 minutes, au début de la séance</div></div></div>
      ${items.map((it) => `<div class="line" data-a="fiche" data-ex="${it.exId}" style="cursor:pointer"><div class="grow">
        <div class="t">${esc(exName(it.exId))}${it.kg ? ` <span class="pill">🎒 +${fmtKg(it.kg)} kg</span>` : ""}</div>
        <div class="muted small">${targetsLabel(it)}${it.tweak ? " · " + tweakText(it.tweak).toLowerCase() : ""}${it.origId ? ` · remplace ${esc(exName(it.origId))}` : ""}</div></div><span class="muted">ⓘ</span></div>`).join("")}
    </div>
    ${action}
    ${!sl.done ? `<button class="link" data-a="move-slot" data-wk="${wk}" data-i="${i}">📅 Déplacer cette séance</button>` : ""}</div>
  <div class="card soft"><span class="eyebrow">Piste muscle-up</span><p class="small">${muTip(st)}</p></div>`;
}
ACTIONS["open-slot"] = (el) => { UI.openSlot = { wk: el.dataset.wk, i: +el.dataset.i }; UI.fromStrip = true; render(); window.scrollTo(0, 0); };
ACTIONS["close-slot"] = (el, e) => { UI.openSlot = null; UI.fromStrip = false; render(); window.scrollTo(0, 0); };
ACTIONS["move-slot"] = (el) => {
  const wk = el.dataset.wk, W = weekPlan(wk), i = +el.dataset.i, sl = W.slots[i];
  const opts = Array.from({ length: 7 }, (_, k) => addDays(wk, k)).filter((d) => d >= today() && (d === sl.d || !W.slots.some((s) => s.d === d)));
  openSheet(`<div class="row between"><h2>Déplacer la séance</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <p class="muted small">Choisis le nouveau jour. Si deux séances se suivent, la plus légère passera en 2e.</p>
    <div class="grid2">${opts.map((d) => `<button class="btn ${d === sl.d ? "primary" : ""}" data-a="move-do" data-wk="${wk}" data-i="${i}" data-d="${d}">${cap(dayName(d))} ${parseYmd(d).getDate()}</button>`).join("")}</div>`);
};
ACTIONS["move-do"] = (el) => {
  const wk = el.dataset.wk;
  if (moveSlot(wk, +el.dataset.i, el.dataset.d)) { UI.openSlot = { wk, i: weekPlan(wk).slots.findIndex((s) => s.d === el.dataset.d) }; toast("Séance déplacée"); }
  closeSheet(); render();
};
ACTIONS["extra-ask"] = () => {
  const r = extraSession(true);
  if (!r.ok) return toast(r.reason === "full" ? "Tes 3 séances de la semaine sont faites : repos !" : "Pas de séance à avancer aujourd'hui");
  openSheet(`<div class="row between"><h2>Séance aujourd'hui</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <p>Je te propose : <b>${SESSIONS[r.type].n}</b>.</p>
    <p class="muted small">C'est la plus logique en respectant le repos entre deux séances lourdes. Le reste de ta semaine est réajusté :</p>
    <div class="card soft">${r.slots.map((x) => `<div class="line"><b style="min-width:90px">${cap(dayName(x.d))}</b><span>${SESSIONS[x.type].n}${x.done ? " ✓" : ""}${x.d === today() ? " · aujourd'hui" : ""}</span></div>`).join("")}</div>
    <button class="btn primary big" data-a="extra-go">C'est parti</button><button class="btn ghost" data-a="close-sheet">Annuler</button>`);
};
ACTIONS["extra-go"] = () => {
  const r = extraSession(false); closeSheet();
  if (!r.ok) return toast("Impossible pour aujourd'hui");
  toast("Semaine réajustée ✔");
  ACTIONS.start({ dataset: { wk: r.wk, slot: String(r.idx) } });
};
ACTIONS.fiche = (el) => {
  const ex = EXERCISES[el.dataset.ex];
  const needs = ex.needs ? ex.needs.map((g) => g.map((e) => EQUIP.find((q) => q.id === e).n.split(" (")[0]).join(" + ")).join(" ou ") : "Aucun matériel";
  openSheet(`<div class="row between"><h2>${esc(ex.n)}</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <div><span class="eyebrow">Bonne exécution</span><p>${esc(ex.how)}</p></div>
    <div><span class="eyebrow" style="color:var(--orange)">Erreurs à éviter</span><p>${esc(ex.errs)}</p></div>
    <p class="muted small">Matériel : ${esc(needs)}</p><button class="btn" data-a="close-sheet">Compris</button>`);
};
ACTIONS["close-sheet"] = closeSheet;

/* ================= 3 bis. SÉANCE FAITE SANS L'APP ================= */
function offItems(type) {
  return buildSession(type, null).map((it) => ({ key: it.key, lad: it.lad, rg: it.rg, exId: it.exId, planned: it.planned || it.sets.length, mu: !!it.mu, tries: !!it.tries, unit: it.unit, perSide: it.perSide, kgIn: it.kg ? fmtKg(it.kg) : "", vals: it.sets.map(() => ""), t: it.sets.map((x) => x.t) }));
}
function offInit() {
  const d = today(), W = S.weeks[weekKey(d)], at = W && W.slots.find((x) => x.d === d && !x.done);
  const type = at ? at.type : (weekRemaining(weekKey(d))[0] || "S1");
  UI.off = { d, type, items: offItems(type) };
}
function offSync() {
  if (!UI.off) return;
  const dt = $("#off-d"); if (dt && dt.value) UI.off.d = dt.value;
  document.querySelectorAll("[data-off='v']").forEach((el) => { UI.off.items[+el.dataset.i].vals[+el.dataset.j] = el.value; });
  document.querySelectorAll("[data-off='kg']").forEach((el) => { UI.off.items[+el.dataset.i].kgIn = el.value; });
}
const offHasValues = () => UI.off.items.some((it) => it.vals.some((v) => String(v).trim() !== ""));
function viewHorsApp() {
  if (!UI.off) offInit();
  const o = UI.off;
  const item = (it, i) => {
    const ex = EXERCISES[it.exId], rung = it.lad ? LADDERS[it.lad].rungs[it.rg] : null, isTime = (rung ? rung.unit : it.unit) === "s";
    return `<div class="card"><div class="row between"><h3>${esc(ex.n)}</h3>${it.custom ? `<button class="btn sm ghost danger" data-a="off-rm" data-i="${i}" aria-label="Retirer">✕</button>` : `<button class="icon-btn" style="width:40px;height:40px" data-a="fiche" data-ex="${it.exId}" aria-label="Fiche">ⓘ</button>`}</div>
      ${it.lad ? `<div class="field"><label for="off-var${i}">Variante faite</label><select id="off-var${i}" data-c="off" data-k="var" data-i="${i}">${LADDERS[it.lad].rungs.map((r, k) => `<option value="${k}" ${k === it.rg ? "selected" : ""}>${esc(EXERCISES[r.ex].n)}${r.weighted ? " (lesté)" : ""}</option>`).join("")}</select></div>` : ""}
      ${rung && rung.weighted ? `<div class="field"><label for="off-kg${i}">Sac à dos (kg)</label><input type="text" inputmode="decimal" id="off-kg${i}" data-off="kg" data-i="${i}" value="${esc(it.kgIn)}" placeholder="1,5"></div>` : ""}
      <p class="muted small">${it.tries ? "Un essai par case : 1 = réussi, 0 = raté." : `Reps${isTime ? " (secondes)" : it.perSide ? " par jambe" : ""} de chaque série faite. Laisse vide une série non faite.`}</p>
      <div class="offgrid">${it.vals.map((v, j) => `<input type="text" inputmode="numeric" aria-label="Série ${j + 1}" data-off="v" data-i="${i}" data-j="${j}" value="${esc(v)}" placeholder="${it.t && it.t[j] != null ? it.t[j] : ""}">`).join("")}</div>
      <button class="btn sm" data-a="off-addset" data-i="${i}">+ une série</button></div>`;
  };
  const exOpts = Object.keys(EXERCISES).sort((a, b) => exName(a).localeCompare(exName(b), "fr")).map((id) => `<option value="${id}">${esc(exName(id))}</option>`).join("");
  return `${backLink("seance", "Séance")}<h1>Séance sans l'app</h1>
  <p class="muted">Note après coup ce que tu as fait : elle compte comme une séance normale (records, progression, semaine).</p>
  <div class="card"><div class="field"><label for="off-d">Date de la séance</label><input type="date" id="off-d" data-c="off" data-k="date" value="${o.d}" max="${today()}"></div>
    <span class="eyebrow">Quelle séance ?</span>
    <div class="seg">${ALL_TYPES.map((t) => `<button class="${o.type === t ? "on" : ""}" data-a="off-type" data-type="${t}">${SESSIONS[t].short}</button>`).join("")}</div>
    <p class="small">${SESSIONS[o.type].n}</p></div>
  ${o.items.map(item).join("")}
  <div class="card"><span class="eyebrow">Un autre exercice ?</span>
    <div class="field"><label for="off-ex">Exercice</label><select id="off-ex">${exOpts}</select></div>
    <button class="btn" data-a="off-addex">+ Ajouter cet exercice</button></div>
  <button class="btn primary big" data-a="off-save">Enregistrer la séance</button>`;
}
ACTIONS["off-open"] = () => { offInit(); go("horsapp"); };
ACTIONS["off-type"] = (el) => {
  offSync();
  if (UI.off.type === el.dataset.type) return;
  if (offHasValues() && !confirm("Changer de séance efface les reps déjà saisies. Continuer ?")) return;
  UI.off.type = el.dataset.type; UI.off.items = offItems(el.dataset.type); render();
};
ACTIONS["off-addset"] = (el) => { offSync(); UI.off.items[+el.dataset.i].vals.push(""); render(); };
ACTIONS["off-addex"] = () => {
  offSync(); const id = $("#off-ex").value, ex = EXERCISES[id];
  UI.off.items.push({ key: "x" + id, lad: null, rg: null, exId: id, planned: 0, mu: false, tries: false, unit: ex.unit || "reps", perSide: !!ex.perSide, kgIn: "", vals: ["", "", ""], t: [], custom: true });
  render();
};
ACTIONS["off-rm"] = (el) => { offSync(); UI.off.items.splice(+el.dataset.i, 1); render(); };
ACTIONS["off-save"] = () => {
  offSync(); const o = UI.off;
  if (!o.d || o.d > today()) return toast("Choisis une date qui n'est pas dans le futur");
  const items = [];
  o.items.forEach((it) => {
    const rung = it.lad ? LADDERS[it.lad].rungs[it.rg] : null, exId = rung ? rung.ex : it.exId;
    const sets = it.vals.map((v) => { const n = num(v); const has = String(v).trim() !== "" && isFinite(n) && n >= 0; return has && (it.tries || n > 0) ? { r: Math.min(999, Math.round(n)), t: null, done: true } : null; }).filter(Boolean);
    if (!sets.length) return;
    const kgIn = num(it.kgIn), kg = rung && rung.weighted ? (kgIn > 0 ? Math.min(KG_MAX, kgIn) : lp(it.lad).kg || KG_STEP) : 0;
    items.push({ key: it.key, lad: it.lad, rg: it.rg, exId, origId: null, kg, unit: rung ? rung.unit || "reps" : it.unit, lo: rung ? rung.lo : 0, hi: rung ? rung.hi : 0, mu: it.mu, tries: it.tries, volume: false, planned: it.planned, manual: true, sets });
  });
  if (!items.length) return toast("Note les reps d'au moins une série");
  const before = {}; RECORD_TYPES.forEach((r) => { before[r.id] = bestRecord(r.id); });
  const sess = { id: uid(), d: o.d, type: o.type, manual: true, offApp: true, items };
  const { notes, mu } = commitSession(sess, null);
  const prs = RECORD_TYPES.filter((r) => before[r.id] > 0 && bestRecord(r.id) > before[r.id]).map((r) => `${r.n} : ${bestRecord(r.id)}`);
  const badges = checkBadges();
  UI.off = null; UI.openSlot = null;
  openSheet(`<h2>${mu ? "👑 Muscle-up validé !" : "✅ Séance ajoutée"}</h2>
    <p class="muted small">${cap(frDateLong(o.d))} · ${SESSIONS[o.type].n}. Elle compte dans ta semaine, tes records et ta progression.</p>
    ${prs.length ? `<p>🏅 Nouveau record : <b>${prs.join(", ")}</b></p>` : ""}${badges.map((b) => `<p>${b.ic} Nouveau badge : <b>${b.n}</b></p>`).join("")}
    <div class="card soft"><span class="eyebrow">La prochaine fois</span>${notes.map((x) => `<div class="line"><span>${x.kind === "up" ? "📈" : x.kind === "down" ? "🔧" : x.kind === "tweak" ? "🎯" : "➡️"}</span><div class="grow small">${esc(x.text)}</div></div>`).join("") || `<p class="muted small">Même objectif.</p>`}</div>
    <button class="btn primary big" data-a="off-done">Terminé</button>`);
};
ACTIONS["off-done"] = () => { closeSheet(); go("seance"); };

/* ================= 4. BILAN ================= */
function viewBilan() {
  const wk = weekKey(today()), W = weekPlan(wk), p = S.profile, adv = applyWeightRule();
  const done = Math.max(W ? W.slots.filter((s) => s.done).length : 0, distinctDaysInWeek(wk)), meals = weekMealChecks(wk);
  const w = sortedWeights(), cur = curKg();
  const stage = muStage(), gates = muGates();
  const ser = recordSeries(UI.recType), rt = RECORD_TYPES.find((r) => r.id === UI.recType);
  const mon = [];
  if (photoDue()) mon.push(`<button class="btn" data-a="go-photos">📸 Photo du mois</button>`);
  if (measureDue() && S.weights.length) mon.push(`<button class="btn" data-a="m-open">📏 Mensurations</button>`);
  return `<h1>Bilan</h1>
  <div class="card"><span class="eyebrow">⚖️ Mon poids (le matin au réveil)</span>
    <div class="grid2"><div class="field"><label for="w-kg">Poids (kg)</label><input type="text" id="w-kg" inputmode="decimal" placeholder="${cur != null ? fmtKg(cur) : "56,0"}" autocomplete="off"></div>
    <div class="field"><label for="w-d">Date</label><input type="date" id="w-d" value="${today()}" max="${today()}"></div></div>
    <button class="btn primary" data-a="w-add">Enregistrer</button></div>
  <div class="card"><div class="row between"><span class="eyebrow">Évolution</span><span class="pill">${cur != null ? fmtKg(cur) + " kg" : "–"}</span></div>
    ${lineChart(w.map((x) => ({ d: x.d, v: x.kg })), { unit: " kg", label: "Évolution du poids", goals: [{ v: p.goalKg, label: `Objectif ${fmtKg(p.goalKg)} kg`, color: "#5cc8ff" }, { v: p.goal3Kg, label: `3 mois (${frDate(p.goal3Date)}) : ${fmtKg(p.goal3Kg - 0.5)}-${fmtKg(p.goal3Kg + 0.5)} kg`, color: "#8f99a8" }] })}
    <div class="card soft" style="gap:4px"><b>${adv.kind === "good" || adv.kind === "fast" ? "👍 " : "💡 "}Ma consigne</b><p>${adv.text}</p></div></div>
  <div class="card"><span class="eyebrow">Ma semaine</span>
    <div class="row between"><b>Séances</b><span class="pill ${done >= 3 ? "acc" : ""}">${done}/3</span></div>
    <div class="bar"><i style="width:${Math.min(100, (done / 3) * 100)}%"></i></div>
    <div class="row between"><b>Repas cochés</b><span class="pill">${meals}/28</span></div>
    <div class="bar"><i style="width:${(meals / 28) * 100}%"></i></div>
    ${done < 2 ? `<p class="small" style="color:var(--blue)">Semaine chargée ? Ça arrive. Pour la semaine prochaine, je te proposerai des jours bien espacés et faciles à tenir.</p>` : ""}</div>
  <div class="card"><span class="eyebrow">🏅 Mes records</span>
    <div class="grid3">${RECORD_TYPES.map((r) => `<div class="tile"><b>${bestRecord(r.id) || "–"}</b><span class="muted small">${r.n}</span></div>`).join("")}</div>
    <div class="seg">${RECORD_TYPES.map((r) => `<button class="${r.id === UI.recType ? "on" : ""}" data-a="rec-type" data-type="${r.id}">${r.n}</button>`).join("")}</div>
    ${lineChart(ser, { zero: true, label: `Records de ${rt.n}` })}</div>
  <div class="card"><span class="eyebrow">👑 Piste muscle-up</span>
    <div>${MU_GATES.map((g, i) => `<div class="line"><span style="font-size:22px">${gates[i] ? "✅" : i === stage ? "➡️" : "🔒"}</span><div class="grow"><div class="t ${gates[i] ? "" : i === stage ? "acc" : "muted"}">${g.n}</div><div class="muted small">${g.d}</div></div></div>`).join("")}</div>
    <p class="small muted">${stage >= 4 ? "Muscle-up validé 🎉" : `Tu en es à la ${stage === 0 ? "porte 1" : stage === 1 ? "porte 2" : stage === 2 ? "porte 3" : "dernière étape : les essais"}.`}</p></div>
  ${mon.length ? `<div class="card soft"><b>Une fois par mois</b><p class="muted small">Photo et mensurations : la balance ne dit pas tout.</p><div class="stack">${mon.join("")}</div></div>` : ""}
  <a class="btn primary big" href="#/generer">Générer ma semaine</a>`;
}
ACTIONS["w-add"] = () => {
  const kg = num($("#w-kg").value), d = $("#w-d").value || today();
  if (!(kg > 25 && kg < 200)) return toast("Entre ton poids en kg, par exemple 56,4");
  S.weights = S.weights.filter((x) => x.d !== d); S.weights.push({ d, kg }); saveState();
  const a = applyWeightRule();
  toast(a.bumped ? `✔ Noté. Portions augmentées : ${S.profile.kcal} kcal par jour` : "Poids enregistré ✔");
  announceBadges(); render();
};
ACTIONS["rec-type"] = (el) => { UI.recType = el.dataset.type; render(); };
ACTIONS["go-photos"] = () => go("photos");
ACTIONS["m-open"] = () => openSheet(`<div class="row between"><h2>📏 Mensurations</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
  <p class="muted small">Bras : contracté, au plus gros du biceps. Poitrine : au niveau des pectoraux, après avoir expiré.</p>
  <div class="grid2"><div class="field"><label for="m-bras">Tour de bras (cm)</label><input type="text" id="m-bras" inputmode="decimal"></div>
  <div class="field"><label for="m-poit">Tour de poitrine (cm)</label><input type="text" id="m-poit" inputmode="decimal"></div></div>
  <button class="btn primary" data-a="m-add">Enregistrer</button>`);
ACTIONS["m-add"] = () => {
  const bras = num($("#m-bras").value), poit = num($("#m-poit").value);
  if (!(bras > 0) && !(poit > 0)) return toast("Entre au moins une mesure");
  S.measures = S.measures.filter((m) => m.d !== today());
  S.measures.push({ d: today(), bras: bras > 0 ? bras : null, poit: poit > 0 ? poit : null }); saveState();
  closeSheet(); toast("Mensurations enregistrées ✔"); render();
};

function viewPhotos() {
  const ym = today().slice(0, 7), ph = [...S.photos].sort((a, b) => (a.ym < b.ym ? -1 : 1)), cur = ph.find((p) => p.ym === ym);
  const a = ph.find((p) => p.id === UI.cmpA) || ph[0], b = ph.find((p) => p.id === UI.cmpB) || ph[ph.length - 1];
  const opts = (sel) => ph.map((p) => `<option value="${p.id}" ${sel && p.id === sel.id ? "selected" : ""}>${frMonth(p.ym)}</option>`).join("");
  return `${backLink("bilan", "Bilan")}<h1>Photo du mois</h1>
  <div class="card"><span class="eyebrow">${cap(frMonth(ym))}</span>
    ${cur ? `<img class="photo" data-photo="${cur.id}" alt="Photo du mois">` : `<p class="muted">Une photo par mois, au même endroit, avec la même lumière et la même pose.</p>`}
    <button class="btn ${cur ? "" : "primary"}" data-a="photo-add">${cur ? "Remplacer la photo de ce mois" : "📸 Choisir ma photo du mois"}</button>
    <p class="muted small">🔒 Tes photos restent uniquement sur ce téléphone.</p></div>
  ${ph.length >= 2 ? `<div class="card"><span class="eyebrow">Avant / après</span>
    <div class="grid2"><select data-c="cmp" data-k="cmpA" aria-label="Photo avant">${opts(a)}</select><select data-c="cmp" data-k="cmpB" aria-label="Photo après">${opts(b)}</select></div>
    <div class="grid2"><img class="photo" data-photo="${a.id}" alt="Avant"><img class="photo" data-photo="${b.id}" alt="Après"></div></div>` : `<p class="muted small center">La comparaison avant / après apparaît dès 2 photos.</p>`}
  ${ph.length ? `<div class="card"><span class="eyebrow">Toutes mes photos</span><div class="grid3">${ph.map((p) => `<div class="center"><img class="photo" data-photo="${p.id}" alt=""><span class="muted small">${frMonth(p.ym)}</span><br><button class="link small" style="color:var(--red)" data-a="photo-del" data-id="${p.id}">Supprimer</button></div>`).join("")}</div></div>` : ""}`;
}
ACTIONS["photo-add"] = async () => {
  const data = await pickImage(); if (!data) return;
  const ym = today().slice(0, 7), old = S.photos.find((p) => p.ym === ym), id = "ph-" + uid();
  try { await photoPut(id, data); } catch (e) { return toast("Impossible d'enregistrer la photo"); }
  if (old) { await photoDel(old.id).catch(() => {}); S.photos = S.photos.filter((p) => p.id !== old.id); }
  S.photos.push({ id, ym, d: today() }); saveState(); toast("Photo enregistrée ✔"); announceBadges(); render();
};
ACTIONS["photo-del"] = async (el) => {
  if (!confirm("Supprimer cette photo ?")) return;
  await photoDel(el.dataset.id).catch(() => {}); S.photos = S.photos.filter((p) => p.id !== el.dataset.id); saveState(); render();
};

/* ================= 5. MANGER ================= */
function slotTip(id) {
  const med = S.profile.med;
  return {
    matin: med ? `À prendre AVANT ${medWord()} : c'est ton plus gros repas, profites-en tant que la faim est là.` : "Ton plus gros repas de la journée.",
    midi: med ? "Appétit faible ? Petit mais dense en calories, ou à boire. Pas de soda avant le repas." : "Petit mais dense si tu n'as pas très faim.",
    gouter: med ? "La faim revient en sortant des cours : fais-en un vrai repas." : "Un vrai repas, pas juste un biscuit.",
    soir: "Gros dîner : féculents, protéines et légumes cuits. Puis une petite collation avant de dormir.",
  }[id];
}
function viewManger() {
  const tabs = [["now", "Maintenant"], ["week", "Semaine"], ["shop", "Courses"]];
  const body = { now: mangerNow, week: mangerWeek, shop: mangerShop }[UI.mangerTab]();
  return `<div class="row between"><h1>Manger</h1><button class="btn sm" data-a="details">Détails</button></div>
    <div class="seg">${tabs.map(([id, n]) => `<button class="${UI.mangerTab === id ? "on" : ""}" data-a="manger-tab" data-tab="${id}">${n}</button>`).join("")}</div>${body}`;
}
ACTIONS["manger-tab"] = (el) => { UI.mangerTab = el.dataset.tab; render(); };
function mangerNow() {
  const date = UI.mealDate || today(), wk = weekKey(date), di = dayIdx(date), P = ensurePlan(wk).days[di];
  const si = UI.mealSlot != null ? UI.mealSlot : currentSlotIdx(nowHM()), slot = MEAL_SLOTS[si];
  const meal = mealById(P[slot.id]), c = checksOf(date), ed = (S.eaten && S.eaten[date]) || {}, eatenId = ed[slot.id], can = date <= today();
  const alts = alternatives(wk, di, slot.id, 2), like = S.likes[meal.id] || 0;
  const ings = meal.ing.map(([id, q]) => `${ING[id].n} (${fmtQty(ING[id], q)})`).join(", ");
  const boosts = dayBoosts(date), times = mealTimes(date);
  return `
  ${date !== today() ? `<div class="row between"><b>${cap(frDateLong(date))}</b><button class="link" data-a="meal-today">Revenir à aujourd'hui</button></div>` : ""}
  <div class="chips">${MEAL_SLOTS.map((s, i) => `<button class="chip ${i === si ? "on" : ""}" data-a="meal-slot" data-i="${i}">${c[s.id] ? "✓ " : ""}${s.n}</button>`).join("")}</div>
  <p class="small" style="color:var(--blue)">${slotTip(slot.id)}</p>
  <div class="card hl"><span class="eyebrow">${slot.ic} ${slot.n} · ${times[si]}${c[slot.id] ? " · mangé ✓" : ""}</span>
    <h2>${esc(meal.n)}</h2><p>${esc(meal.how)}</p>${ings ? `<p class="muted small">Ingrédients : ${esc(ings)}</p>` : ""}
    <div class="grid3"><button class="btn sm ${like === 1 ? "primary" : ""}" data-a="like" data-id="${meal.id}" data-v="1" aria-pressed="${like === 1}">👍 J'aime</button>
      <button class="btn sm" data-a="like" data-id="${meal.id}" data-v="-1">👎 Plus jamais</button>
      <button class="btn sm" data-a="meal-swap" data-di="${di}" data-slot="${slot.id}">🔄 Changer</button></div>
    ${can ? `<button class="btn primary big" data-a="eat" data-slot="${slot.id}" data-id="${meal.id}">${c[slot.id] && eatenId === meal.id ? "✓ Mangé (décocher)" : "J'ai mangé ça"}</button>` : ""}</div>
  <span class="eyebrow">2 autres idées pour ce moment</span>
  ${alts.map((m) => `<div class="card"><h3>${esc(m.n)}</h3><p class="muted small">${esc(m.how.split(". ")[0])}.</p>
    <div class="row"><button class="btn sm" data-a="meal-pick" data-slot="${slot.id}" data-id="${m.id}">Choisir ce repas</button>
    ${can ? `<button class="btn sm ${c[slot.id] && eatenId === m.id ? "primary" : ""}" data-a="eat" data-slot="${slot.id}" data-id="${m.id}">${c[slot.id] && eatenId === m.id ? "✓ Mangé" : "J'ai mangé ça"}</button>` : ""}</div></div>`).join("")}
  ${can ? `<button class="btn ${c[slot.id] && eatenId === "other" ? "primary" : ""}" data-a="eat" data-slot="${slot.id}" data-id="other">${c[slot.id] && eatenId === "other" ? "✓ Autre chose (mangé)" : "J'ai mangé autre chose"}</button>` : ""}
  ${slot.id === "soir" ? `<div class="card"><span class="eyebrow">🌙 Avant de dormir</span><h3>${esc(dayColl(date).n)}</h3><p class="muted small">${esc(dayColl(date).how)}</p></div>` : ""}
  <div class="card"><span class="eyebrow">🥤 Shake maison du jour</span><p class="small">${esc(SHAKE.how)}</p>
    ${can ? `<button class="btn ${c.shake ? "primary" : ""}" data-a="shake" data-d="${date}">${c.shake ? "✓ Bu" : "J'ai bu mon shake"}</button>` : ""}</div>
  ${boosts.length ? `<div class="card hl"><span class="eyebrow">Portions en plus aujourd'hui</span><p class="small muted">J'ai augmenté tes portions (${S.profile.kcal} kcal par jour) :</p><ul style="margin:0;padding-left:20px">${boosts.map((b) => `<li>${b.n}</li>`).join("")}</ul></div>` : ""}`;
}
ACTIONS["meal-slot"] = (el) => { UI.mealSlot = +el.dataset.i; render(); };
ACTIONS["meal-today"] = () => { UI.mealDate = null; render(); };
ACTIONS.eat = (el) => {
  const d = UI.mealDate || today(), slot = el.dataset.slot, id = el.dataset.id, ed = (S.eaten && S.eaten[d]) || {};
  if (checksOf(d)[slot] && ed[slot] === id) setEaten(d, slot, null);
  else { const was = isFullDay(d); setEaten(d, slot, id); if (!was && isFullDay(d)) toast("🍽️ Les 4 repas du jour : bravo !"); }
  announceBadges(); render();
};
ACTIONS.shake = (el) => { const c = (S.mealChecks[el.dataset.d] = S.mealChecks[el.dataset.d] || {}); c.shake = !c.shake; saveState(); render(); };
ACTIONS.like = (el) => {
  const id = el.dataset.id, v = +el.dataset.v;
  if (v === -1 && !confirm("Ce repas ne sera plus jamais proposé. OK ?")) return;
  setLike(id, v); toast(v === 1 ? "👍 Noté : il reviendra plus souvent" : "👎 Il ne reviendra plus"); render();
};
ACTIONS["meal-swap"] = (el) => { const date = UI.mealDate || today(); swapMeal(weekKey(date), +el.dataset.di, el.dataset.slot); render(); };
ACTIONS["meal-pick"] = (el) => {
  const date = UI.mealDate || today(), P = ensurePlan(weekKey(date)).days[dayIdx(date)];
  P[el.dataset.slot] = el.dataset.id; saveState(); render();
};
ACTIONS.details = () => {
  const date = UI.mealDate || today(), t = dayTotals(date), kgNow = curKg();
  openSheet(`<div class="row between"><h2>Détails nutrition</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <div class="grid2"><div class="tile"><b>${t.kcal}</b><span class="muted small">kcal prévues ce jour</span></div><div class="tile"><b>${t.prot} g</b><span class="muted small">protéines prévues</span></div>
    <div class="tile"><b>${S.profile.kcal}</b><span class="muted small">cible kcal / jour</span></div><div class="tile"><b>${S.profile.prot} g</b><span class="muted small">cible protéines</span></div></div>
    <p class="small">Principes : léger surplus de calories (environ +300 à 500 par jour au-dessus de tes besoins), protéines autour de 1,5 g par kg${kgNow ? ` (soit environ ${Math.round(kgNow * 1.5)} g pour ${fmtKg(kgNow)} kg)` : ""} réparties sur 4 à 5 prises, et une prise de poids lente : 0,5 à 1,5 kg par mois.</p>
    <p class="small muted">Les valeurs sont approximatives : pas besoin de peser. La cible ne baisse jamais ; elle monte de 250 kcal si ton poids stagne 3 semaines.</p>
    <button class="btn" data-a="close-sheet">Fermer</button>`);
};
function mangerWeek() {
  const cur = weekKey(today()), wk = addDays(cur, UI.weekOff * 7), P = ensurePlan(wk), di = UI.weekDi != null ? UI.weekDi : (UI.weekOff === 0 ? dayIdx(today()) : 0);
  const date = addDays(wk, di), times = mealTimes(date), c = checksOf(date);
  return `<div class="seg"><button class="${UI.weekOff === 0 ? "on" : ""}" data-a="week-off" data-off="0">Cette semaine</button><button class="${UI.weekOff === 1 ? "on" : ""}" data-a="week-off" data-off="1">Semaine prochaine</button></div>
  <div class="chips week">${DAYS_FR.map((n, i) => `<button class="chip ${i === di ? "on" : ""}" data-a="week-day" data-di="${i}">${n.slice(0, 3)}</button>`).join("")}</div>
  <div class="card"><b>${cap(frDateLong(date))}</b><div>${MEAL_SLOTS.map((s, i) => `<div class="line" data-a="open-meal" data-date="${date}" data-i="${i}" style="cursor:pointer">${tick(c[s.id])}<div class="grow"><div class="small muted">${s.n} · ${times[i]}</div><div class="t">${esc(mealById(P.days[di][s.id]).n)}</div></div><span class="muted">›</span></div>`).join("")}
    <div class="line"><span style="width:34px;text-align:center">🌙</span><div class="grow"><div class="small muted">Avant de dormir</div><div class="t">${esc(mealById(P.days[di].coll).n)}</div></div></div>
    <div class="line"><span style="width:34px;text-align:center">🥤</span><div class="grow"><div class="small muted">Chaque jour</div><div class="t">Shake maison</div></div></div></div></div>`;
}
ACTIONS["week-off"] = (el) => { UI.weekOff = +el.dataset.off; UI.weekDi = null; render(); };
ACTIONS["week-day"] = (el) => { UI.weekDi = +el.dataset.di; render(); };
ACTIONS["open-meal"] = (el) => { UI.mealDate = el.dataset.date === today() ? null : el.dataset.date; UI.mealSlot = +el.dataset.i; UI.mangerTab = "now"; render(); };
function mangerShop() {
  const wk = addDays(weekKey(today()), UI.weekOff * 7), list = shoppingList(wk), checks = S.shop[wk] || {};
  const total = sum(list.map((g) => g.items.length)), done = sum(list.map((g) => g.items.filter((i) => checks[i.id]).length));
  return `<div class="seg"><button class="${UI.weekOff === 0 ? "on" : ""}" data-a="week-off" data-off="0">Cette semaine</button><button class="${UI.weekOff === 1 ? "on" : ""}" data-a="week-off" data-off="1">Semaine prochaine</button></div>
  <div class="card soft"><div class="row between"><b>Semaine du ${frDate(wk)}</b><span class="pill">${done}/${total}</span></div>
    <p class="muted small">Faite d'après ton plan repas. Regarde d'abord ce qu'il y a déjà dans les placards.</p>
    <button class="btn primary" data-a="share-list" data-wk="${wk}">📤 Partager (WhatsApp)</button></div>
  ${list.map((g) => `<div class="card"><span class="eyebrow">${g.rayon}</span><div>${g.items.map((it) => `<div class="line" data-a="shop-check" data-id="${it.id}" data-wk="${wk}" style="cursor:pointer">${tick(checks[it.id])}<div class="grow t ${checks[it.id] ? "done-txt" : ""}">${esc(it.n)}</div><span class="muted">${it.qty}</span></div>`).join("")}</div></div>`).join("")}
  <button class="btn ghost" data-a="shop-reset" data-wk="${wk}">Tout décocher</button>`;
}
ACTIONS["shop-check"] = (el) => { const c = (S.shop[el.dataset.wk] = S.shop[el.dataset.wk] || {}); c[el.dataset.id] = !c[el.dataset.id]; saveState(); render(); };
ACTIONS["shop-reset"] = (el) => { delete S.shop[el.dataset.wk]; saveState(); render(); };
ACTIONS["share-list"] = async (el) => {
  const text = shoppingText(el.dataset.wk);
  if (navigator.share) { try { await navigator.share({ title: "Liste de courses", text }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  const w = window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  if (!w) { try { await navigator.clipboard.writeText(text); toast("Liste copiée : colle-la dans WhatsApp"); } catch (e) { openSheet(`<h2>Liste de courses</h2><pre style="white-space:pre-wrap;margin:0">${esc(text)}</pre><button class="btn" data-a="close-sheet">Fermer</button>`); } }
};

/* ================= RÉGLAGES (icône ⚙️ sur Aujourd'hui) ================= */
function viewReglages() {
  const p = S.profile, dayOpts = (v) => [1, 2, 3, 4, 5, 6, 0].map((d) => `<option value="${d}" ${d === v ? "selected" : ""}>${DAYS_FR[(d + 6) % 7]}</option>`).join("");
  const age = p.birth ? Math.floor(daysBetween(p.birth, today()) / 365.25) : null;
  const f = (k, label, type = "text", extra = "", obj = "prof") => `<div class="field"><label for="st-${k}">${label}</label>${type === "date"
    ? `<input type="date" id="st-${k}" data-c="${obj}" data-k="${k}" value="${esc(p[k])}">`
    : `<input type="text" ${type === "num" ? 'inputmode="decimal" data-num="1"' : 'autocomplete="off"'} id="st-${k}" data-c="${obj}" data-k="${k}" value="${esc(type === "num" ? fmtKg(obj === "lvl" ? p.level[k] : p[k]) : p[k])}" ${extra}>`}</div>`;
  return `${backLink("today", "Aujourd'hui")}<h1>Réglages</h1>
  <div class="menu">
    <a href="#/fiches"><span class="ic">📖</span>Fiches des exercices</a>
    <a href="#/parcs"><span class="ic">🌳</span>Mes parcs</a>
    <a href="#/badges"><span class="ic">🏅</span>Badges</a>
    <a href="#/rappels"><span class="ic">⏰</span>Guide des alarmes (Horloge)</a>
    <a href="#/photos"><span class="ic">📸</span>Photo du mois</a></div>
  <div class="card"><span class="eyebrow">Mon profil</span>
    ${f("name", "Prénom")}
    ${f("birth", `Date de naissance${age != null ? ` (${age} ans)` : ""}`, "date")}
    <div class="grid2">${f("height", "Taille (cm)", "num")}${f("goalKg", "Objectif final (kg)", "num")}</div>
    <div class="grid2">${f("goal3Kg", "Palier 3 mois (kg)", "num")}${f("rest", "Repos entre séries (s)", "num")}</div>
    <div class="row" style="align-items:flex-start">${checkBtn(p.med, "st-med")}<div class="grow"><b>Médicament le matin qui coupe l'appétit le midi</b><p class="muted small">Organise le plan repas autour.</p></div></div>
    ${p.med ? f("medName", "Nom du médicament (facultatif)") : ""}
    <div class="grid3">${[0, 1, 2].map((i) => `<div class="field"><label for="st-day${i}">Jour ${i + 1}</label><select id="st-day${i}" data-c="day" data-k="${i}">${dayOpts(p.days[i])}</select></div>`).join("")}</div>
    <p class="muted small">Tes jours habituels : ils sont proposés d'office quand tu génères ta semaine.</p></div>
  <div class="card"><span class="eyebrow">Alimentation</span>
    ${f("kcal", "Calories par jour", "num", 'inputmode="numeric"')}
    <p class="muted small">Cible de départ : ${p.kcalBase} kcal. L'app est faite pour prendre du poids : la cible ne descend jamais sous cette valeur et monte de 250 kcal si ton poids stagne.</p></div>
  <div class="card"><span class="eyebrow">Mon niveau de départ</span>
    <p class="muted small">Utilisé seulement avant ta première séance sur chaque exercice. Ensuite, l'app se cale sur tes vraies reps.</p>
    <div class="grid3">${f("tractions", "Tractions", "num", "", "lvl")}${f("dips", "Dips", "num", "", "lvl")}${f("pompes", "Pompes", "num", "", "lvl")}</div></div>
  <div class="card"><span class="eyebrow">🥊 Mode battant</span>
    ${battantOn() ? `<p class="muted small">Défi lancé le ${frDate(S.battant.start)} · jour ${Math.min(battantDayNo(), BATTANT_DAYS)}/${BATTANT_DAYS}.</p><button class="btn ghost" data-a="bat-stop">Arrêter le défi</button>`
      : `<p class="muted small">Défi de 12 semaines : repas, sommeil et séances, avec un score de régularité.</p><button class="btn" data-a="bat-info">Voir le défi</button>`}</div>
  <div class="card"><span class="eyebrow">Sauvegarde</span>
    <p class="muted small">Tes données restent sur ce téléphone. Fais une sauvegarde de temps en temps et garde le fichier dans Google Drive ou envoie-le-toi par mail.</p>
    <button class="btn primary" data-a="export">⬇️ Exporter une sauvegarde</button>
    <button class="btn" data-a="import">⬆️ Importer une sauvegarde</button></div>
  <div class="card soft"><span class="eyebrow">⚕️ Santé et sécurité</span>
    <p class="small">FORGE ne remplace pas l'avis de ton médecin, qui suit ta courbe de croissance. Si tu as une douleur qui dure ou une question sur ton traitement et l'alimentation, parles-en à ton médecin ou à tes parents.</p>
    <p class="small">Ici, on progresse avec de la vraie nourriture, de l'entraînement et du sommeil : pas de compléments alimentaires, pas de brûleurs de graisse, pas de produits dopants. Si une douleur aiguë apparaît pendant un exercice, arrête la séance.</p></div>
  <button class="btn ghost danger" data-a="reset">Effacer toutes mes données</button>
  <p class="muted small center">FORGE · version 2.0</p>`;
}
ACTIONS["st-med"] = () => { S.profile.med = !S.profile.med; saveState(); render(); };
ACTIONS.export = async () => { try { await exportData(); toast("Sauvegarde téléchargée ✔"); } catch (e) { toast("Export impossible"); } };
ACTIONS.import = () => {
  const inp = $("#file-json"); inp.value = "";
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    if (!confirm("Importer cette sauvegarde va remplacer toutes les données actuelles. Continuer ?")) return;
    try { await importData(f); toast("Sauvegarde importée ✔"); go("today"); render(); } catch (e) { toast(e.message || "Fichier illisible"); }
  };
  inp.click();
};
ACTIONS.reset = async () => {
  if (!confirm("Effacer TOUTES tes données (séances, poids, photos) ? Pense à exporter une sauvegarde avant.")) return;
  if (!confirm("Vraiment tout effacer ? C'est définitif.")) return;
  localStorage.removeItem(STORE_KEY); localStorage.removeItem(STORE_KEY_V1); await photoClear().catch(() => {}); S = defaultState(); go("today"); render();
};
function viewFiches() {
  const ids = Object.keys(EXERCISES).sort((a, b) => exName(a).localeCompare(exName(b), "fr"));
  return `${backLink()}<h1>Fiches des exercices</h1><div class="card"><div>${ids.map((id) => `<div class="line" data-a="fiche" data-ex="${id}" style="cursor:pointer"><div class="grow t">${esc(exName(id))}</div><span class="muted">›</span></div>`).join("")}</div></div>`;
}
function viewBadges() {
  return `${backLink()}<h1>Badges</h1>
  <p class="muted small">${Object.keys(S.badges).length} sur ${BADGES.length} obtenus. Touche un badge pour voir comment l'avoir.</p>
  <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? "on" : ""}" data-a="badge" data-id="${b.id}"><span class="ic">${b.ic}</span>${b.n}</div>`).join("")}</div>`;
}
ACTIONS.badge = (el) => { const b = BADGES.find((x) => x.id === el.dataset.id); toast(`${b.ic} ${b.d}${S.badges[b.id] ? ` — obtenu le ${frDate(S.badges[b.id])}` : " — pas encore obtenu"}`); };
function viewParcs() {
  return `${backLink()}<h1>Mes parcs</h1>
  <p class="muted">Le matériel coché sert à remplacer automatiquement les exercices impossibles. Parc utilisé pour tes séances : ${currentPark() ? esc(currentPark().name) : "aucun (tout le matériel)"}.</p>
  ${S.parks.map((pk) => `<div class="card"><div class="row">${pk.photo ? `<img class="thumb" data-photo="${pk.photo}" alt="">` : `<div class="thumb" style="display:grid;place-items:center;font-size:28px">🌳</div>`}
    <div class="grow"><h3>${esc(pk.name)}${currentPark() && currentPark().id === pk.id ? " ⭐" : ""}</h3><p class="muted small">${pk.equip.length ? pk.equip.map((e) => EQUIP.find((q) => q.id === e).n.split(" (")[0]).join(" · ") : "Aucun matériel"}</p></div></div>
    <div class="grid2"><button class="btn sm" style="width:100%" data-a="park-use" data-id="${pk.id}">Utiliser ce parc</button><button class="btn sm" style="width:100%" data-a="park-edit" data-id="${pk.id}">Modifier</button></div></div>`).join("")}
  <button class="btn primary" data-a="park-edit" data-id="">+ Ajouter un parc</button>`;
}
function parkSheet() {
  const d = UI.parkDraft;
  openSheet(`<div class="row between"><h2>${d.isNew ? "Nouveau parc" : "Modifier le parc"}</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <div class="field"><label for="pk-name">Nom du parc</label><input type="text" id="pk-name" value="${esc(d.name)}" placeholder="Parc de la mairie" autocomplete="off"></div>
    ${d.photoData ? `<img class="photo wide" src="${d.photoData}" alt="">` : d.photo ? `<img class="photo wide" data-photo="${d.photo}" alt="">` : ""}
    <button class="btn" data-a="park-photo">📷 ${d.photo || d.photoData ? "Changer la photo" : "Ajouter une photo (galerie ou appareil photo)"}</button>
    <span class="eyebrow">Matériel disponible</span>
    <div>${EQUIP.map((e) => `<div class="line" data-a="park-eq" data-id="${e.id}" style="cursor:pointer">${tick(d.equip.includes(e.id))}<div class="grow t">${e.n}</div></div>`).join("")}</div>
    <button class="btn primary" data-a="park-save">Enregistrer</button>
    ${d.isNew ? "" : `<button class="btn ghost danger" data-a="park-del">Supprimer ce parc</button>`}`);
}
ACTIONS["park-use"] = (el) => { S.parkLast = el.dataset.id; saveState(); toast("Parc choisi : les séances s'adaptent"); render(); };
ACTIONS["park-edit"] = (el) => {
  const pk = S.parks.find((p) => p.id === el.dataset.id);
  UI.parkDraft = pk ? { ...pk, equip: [...pk.equip], isNew: false } : { id: uid(), name: "", equip: [], photo: null, isNew: true };
  parkSheet();
};
const keepParkName = () => { if ($("#pk-name")) UI.parkDraft.name = $("#pk-name").value; };
ACTIONS["park-eq"] = (el) => { keepParkName(); const d = UI.parkDraft, id = el.dataset.id; d.equip = d.equip.includes(id) ? d.equip.filter((e) => e !== id) : d.equip.concat(id); parkSheet(); };
ACTIONS["park-photo"] = async () => { keepParkName(); const data = await pickImage(); if (data) { UI.parkDraft.photoData = data; parkSheet(); } };
ACTIONS["park-save"] = async () => {
  keepParkName(); const d = UI.parkDraft;
  if (!d.name.trim()) return toast("Donne un nom au parc");
  let photo = d.photo;
  if (d.photoData) { const id = "pk-" + uid(); try { await photoPut(id, d.photoData); if (photo) await photoDel(photo).catch(() => {}); photo = id; } catch (e) { toast("Photo non enregistrée"); } }
  const pk = { id: d.id, name: d.name.trim(), equip: EQUIP.map((e) => e.id).filter((e) => d.equip.includes(e)), photo };
  const i = S.parks.findIndex((p) => p.id === d.id);
  if (i >= 0) S.parks[i] = pk; else { S.parks.push(pk); if (!S.parkLast) S.parkLast = pk.id; }
  saveState(); closeSheet(); render();
};
ACTIONS["park-del"] = async () => {
  if (!confirm("Supprimer ce parc ?")) return;
  const d = UI.parkDraft; if (d.photo) await photoDel(d.photo).catch(() => {});
  S.parks = S.parks.filter((p) => p.id !== d.id); if (S.parkLast === d.id) S.parkLast = null;
  saveState(); closeSheet(); render();
};
function alarmList() {
  const labels = ["Matin", "Midi", "Goûter", "Soir", "Collation"], out = [];
  const med = S.profile.med ? ` AVANT ${S.profile.medName || "médicament"}` : "";
  const names = [`🍳 Matin${med}`, "🥪 Midi : mange ou bois un truc", "🍝 Goûter = vrai repas", "🍽️ Dîner", "🥤 Collation + shake"];
  labels.forEach((l, i) => {
    const a = S.reminders.week[i], b = S.reminders.weekend[i];
    if (a === b) out.push({ t: a, days: "tous les jours", name: names[i] });
    else { out.push({ t: a, days: "lundi à vendredi", name: names[i] }); out.push({ t: b, days: "samedi et dimanche", name: names[i] }); }
  });
  return out;
}
function viewRappels() {
  const labels = ["Matin", "Midi", "Goûter", "Soir", "Collation"], al = alarmList();
  return `${backLink()}<h1>Guide des alarmes</h1>
  <div class="card soft"><b>🤝 Soyons honnêtes</b>
    <p class="muted">Une application web installée ne peut pas faire sonner un rappel de façon fiable quand elle est fermée sur Android. Plutôt que de te promettre des notifications qui arriveraient une fois sur deux, voici la méthode qui marche à 100 % : les alarmes de l'app Horloge de ton Samsung. À faire une seule fois (5 minutes).</p></div>
  <div class="card"><span class="eyebrow">1 · Tes horaires</span>
    <div class="remgrid small muted"><span></span><b>Semaine</b><b>Week-end</b></div>
    ${labels.map((l, i) => `<div class="remgrid"><b class="small">${l}</b><input type="time" data-c="rem" data-k="week" data-i="${i}" value="${S.reminders.week[i]}" aria-label="${l} semaine"><input type="time" data-c="rem" data-k="weekend" data-i="${i}" value="${S.reminders.weekend[i]}" aria-label="${l} week-end"></div>`).join("")}</div>
  <div class="card"><span class="eyebrow">2 · Crée ces ${al.length} alarmes dans l'app Horloge</span>
    <div>${al.map((a) => `<div class="line"><b style="font-size:20px;min-width:62px">${a.t}</b><div class="grow"><div class="t">${esc(a.name)}</div><div class="muted small">${a.days}</div></div></div>`).join("")}</div>
    <span class="eyebrow">Pour chaque alarme</span>
    <ol class="steps"><li>Ouvre l'app <b>Horloge</b>, onglet <b>Alarme</b>.</li><li>Appuie sur le <b>+</b> en haut.</li><li>Règle l'heure.</li><li>Choisis les jours de répétition (L M M J V, ou S D).</li><li>Dans <b>Nom de l'alarme</b>, tape le nom indiqué ci-dessus.</li><li>Choisis un son court, ou seulement le vibreur pour celle du midi au lycée.</li><li>Appuie sur <b>Enregistrer</b>.</li></ol>
    <button class="btn" data-a="alarms-copy">📋 Copier la liste des alarmes</button></div>
  <div class="card"><span class="eyebrow">Autre possibilité · l'agenda</span>
    <p class="muted small">Tu peux aussi ajouter les rappels à ton agenda (Samsung Calendar ou Google Agenda). Les alarmes de l'Horloge restent la solution la plus sûre.</p>
    <button class="btn ghost" data-a="ics">📆 Télécharger les rappels pour l'agenda (.ics)</button></div>`;
}
ACTIONS["alarms-copy"] = async () => {
  const text = alarmList().map((a) => `${a.t} — ${a.name} (${a.days})`).join("\n");
  try { await navigator.clipboard.writeText(text); toast("Liste copiée ✔"); } catch (e) { toast("Copie impossible sur ce navigateur"); }
};
ACTIONS.ics = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([remindersIcs()], { type: "text/calendar" })); a.download = "forge-rappels-repas.ics";
  document.body.appendChild(a); a.click(); a.remove();
};

/* ---------- Champs modifiés ---------- */
const CHANGES = {
  prof(el) {
    const k = el.dataset.k, p = S.profile;
    if (el.dataset.num) {
      let v = num(el.value); if (!isFinite(v) || v <= 0) return render();
      if (k === "kcal") v = Math.max(p.kcalBase, Math.round(v));
      if (k === "rest") v = clamp(Math.round(v), 30, 300);
      p[k] = v;
      if (k === "kcal") Object.keys(S.plans).forEach((wk) => updateBoosts(wk));
    } else p[k] = el.value.trim();
    saveState(); announceBadges(); render();
  },
  lvl(el) { const v = Math.round(num(el.value)); if (v > 0 && v < 100) S.profile.level[el.dataset.k] = v; saveState(); render(); },
  day(el) { S.profile.days[+el.dataset.k] = +el.value; saveState(); },
  rem(el) { if (el.value) { S.reminders[el.dataset.k][+el.dataset.i] = el.value; saveState(); render(); } },
  cmp(el) { UI[el.dataset.k] = el.value; render(); },
  off(el) {
    offSync();
    if (el.dataset.k === "var") { const it = UI.off.items[+el.dataset.i], rung = LADDERS[it.lad].rungs[+el.value]; it.rg = +el.value; it.exId = rung.ex; if (rung.weighted && !it.kgIn) it.kgIn = fmtKg(lp(it.lad).kg || KG_STEP); render(); }
    else if (el.dataset.k === "date") { if (UI.off.d > today()) { UI.off.d = today(); toast("La date ne peut pas être dans le futur"); } render(); }
  },
  spark(el) { if (typeof changeSessionPark === "function") changeSessionPark(el.value); },
};

/* ================= RENDU & DÉMARRAGE ================= */
const VIEWS = { horsapp: viewHorsApp, today: viewToday, seance: viewSeance, bilan: viewBilan, manger: viewManger, generer: viewGenerer, reglages: viewReglages, fiches: viewFiches, parcs: viewParcs, badges: viewBadges, rappels: viewRappels, photos: viewPhotos };
let lastRoute = null;
function render() {
  const view = $("#view"), tabs = $("#tabs");
  let r = route(); if (!VIEWS[r]) r = "today";
  tabs.hidden = false;
  const active = SUB[r] || r;
  tabs.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.dataset.tab === active));
  if (r === "manger" && lastRoute !== "manger") { if (!UI.fromToday) { UI.mealDate = null; UI.mealSlot = null; } UI.fromToday = false; }
  if (r === "seance" && lastRoute !== "seance") { if (!UI.fromStrip) UI.openSlot = null; UI.fromStrip = false; }
  if (r !== "today") UI.ready = null;
  if (r !== "horsapp") UI.off = null;
  if (r !== "generer") { UI.genWk = null; UI.genDays = []; UI.genTouched = false; UI.genEasy = false; }
  view.innerHTML = VIEWS[r]();
  if (lastRoute !== r) { window.scrollTo(0, 0); lastRoute = r; }
  hydratePhotos();
}

/* Appui long sur un repas d'Aujourd'hui : ouvre Manger sur ce repas */
function setupLongPress() {
  let timer = null;
  const clear = () => { clearTimeout(timer); timer = null; };
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest("[data-hold]"); if (!el) return;
    clear();
    timer = setTimeout(() => {
      UI.suppress = Date.now() + 700;
      UI.mealDate = null; UI.mealSlot = MEAL_SLOTS.findIndex((s) => s.id === el.dataset.hold); UI.mangerTab = "now"; UI.fromToday = true;
      if (navigator.vibrate) { try { navigator.vibrate(30); } catch (x) { /* rien */ } }
      go("manger");
    }, 550);
  });
  ["pointerup", "pointercancel", "scroll"].forEach((ev) => document.addEventListener(ev, clear, true));
  document.addEventListener("pointermove", (e) => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clear(); }, true);
  document.addEventListener("contextmenu", (e) => { if (e.target.closest("[data-hold]")) e.preventDefault(); });
}

function boot() {
  const how = loadState();
  document.addEventListener("click", (e) => {
    if (e.target.id === "sheet") return closeSheet();
    const el = e.target.closest("[data-a]");
    if (el && ACTIONS[el.dataset.a]) { e.preventDefault(); ACTIONS[el.dataset.a](el, e); }
  });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches('[role="button"][data-a]')) { e.preventDefault(); e.target.click(); } });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-c]");
    if (el && CHANGES[el.dataset.c]) CHANGES[el.dataset.c](el);
  });
  setupLongPress();
  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && $("#session").hidden && $("#sheet").hidden && !/INPUT|SELECT/.test(document.activeElement.tagName)) render(); });
  announceBadges();
  render();
  if (how === "migrated") toast("✅ FORGE V2 : tes données ont été reprises");
}
