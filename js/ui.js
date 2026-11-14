/* FORGE — interface : écrans, navigation, actions */
"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const UI = { type: null, repasTab: "plan", weekOff: 0, mealDay: null, open: {}, suiviTab: "poids", recType: "tractions", calYm: null, cmpA: null, cmpB: null, parkDraft: null };
const ACTIONS = {};
const TABS = ["home", "seance", "repas", "suivi", "plus"];
const SUB = { parcs: "plus", calendrier: "plus", badges: "plus", rappels: "plus", exercices: "plus", reglages: "plus" };

/* ---------- Outils d'interface ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}
function openSheet(html) { $("#sheet-box").innerHTML = html; $("#sheet").hidden = false; hydratePhotos(); }
function closeSheet() { $("#sheet").hidden = true; $("#sheet-box").innerHTML = ""; }
function announceBadges() {
  const fresh = checkBadges();
  if (fresh.length) toast(`${fresh[0].ic} Nouveau badge : ${fresh[0].n} (+50 XP)`);
  return fresh;
}
function pickImage() {
  return new Promise((res) => {
    const inp = $("#file-img");
    inp.value = "";
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
const route = () => { const r = (location.hash || "#/home").replace(/^#\//, ""); return r || "home"; };
const go = (r) => { if (route() === r) render(); else location.hash = "#/" + r; };
const check = (on, a, attrs = "") => `<button class="check ${on ? "on" : ""}" data-a="${a}" ${attrs} aria-pressed="${on}" aria-label="Cocher">✓</button>`;
const backLink = (label = "Plus") => `<a class="back" href="#/plus">‹ ${label}</a>`;
const medWord = () => (S.profile.medName ? esc(S.profile.medName) : "ton médicament");

/* ---------- Graphique en ligne (SVG) ---------- */
function lineChart(pts, opt = {}) {
  if (!pts.length) return `<p class="muted small center">Pas encore de données : ajoute ta première valeur.</p>`;
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

/* ================= ONBOARDING ================= */
function viewOnboarding() {
  const p = S.profile;
  return `
  <div class="center" style="padding:18px 0 4px">
    <img src="icons/icon-192.png" alt="" width="84" height="84" style="border-radius:22px">
    <h1 style="margin-top:10px">FORGE</h1>
    <p class="muted">Street workout + alimentation. Tout reste sur ton téléphone.</p>
  </div>
  <div class="card">
    <h2>On règle ton profil</h2>
    <p class="muted small">30 secondes, et tu pourras tout modifier plus tard dans les réglages.</p>
    <div class="field"><label for="ob-name">Ton prénom</label><input type="text" id="ob-name" autocomplete="off" placeholder="Prénom"></div>
    <div class="field"><label for="ob-birth">Date de naissance</label><input type="date" id="ob-birth"></div>
    <div class="grid2">
      <div class="field"><label for="ob-height">Taille (cm)</label><input type="text" id="ob-height" inputmode="numeric" value="${p.height}"></div>
      <div class="field"><label for="ob-kg">Poids actuel (kg)</label><input type="text" id="ob-kg" inputmode="decimal" value="${p.startKg}"></div>
    </div>
    <div class="field"><label for="ob-goal">Poids objectif (kg)</label><input type="text" id="ob-goal" inputmode="decimal" value="${p.goalKg}"></div>
    <div class="row" style="align-items:flex-start">
      ${check(p.med, "ob-med")}
      <div class="grow"><b>Je prends un médicament le matin qui coupe l'appétit le midi</b>
      <p class="muted small">Le plan repas s'organise autour : gros petit-déj avant, midi léger, vrai goûter.</p></div>
    </div>
    ${p.med ? `<div class="field"><label for="ob-med">Nom du médicament (facultatif)</label><input type="text" id="ob-medname" autocomplete="off" value="${esc(p.medName)}"></div>` : ""}
    <button class="btn primary big" data-a="ob-save">C'est parti 💪</button>
    <p class="muted small center">Tu as déjà une sauvegarde ? <button class="link" data-a="import">Importer un fichier</button></p>
  </div>`;
}
ACTIONS["ob-med"] = () => { S.profile.name = $("#ob-name").value; S.profile.med = !S.profile.med; render(); $("#ob-name").value = S.profile.name; };
ACTIONS["ob-save"] = () => {
  const kg = num($("#ob-kg").value), h = num($("#ob-height").value), goal = num($("#ob-goal").value);
  if (!(kg > 25 && kg < 200)) return toast("Vérifie ton poids");
  if (!(goal >= kg)) return toast("L'objectif doit être au-dessus de ton poids actuel");
  const p = S.profile;
  p.name = $("#ob-name").value.trim(); p.birth = $("#ob-birth").value; p.height = h || 180;
  p.startKg = kg; p.goalKg = goal;
  if ($("#ob-medname")) p.medName = $("#ob-medname").value.trim();
  if (goal - kg < 6) p.goal3Kg = Math.round((kg + (goal - kg) / 2) * 2) / 2; else p.goal3Kg = kg + 5.5;
  S.weights.push({ d: today(), kg });
  if (!S.parks.length) { S.parks.push({ id: uid(), name: "Mon parc", equip: ["barre", "paralleles", "espalier", "banc", "monkey"], photo: null }); S.parkLast = S.parks[0].id; }
  S.onboarded = true; saveState();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  go("home");
};

/* ================= ACCUEIL ================= */
function sessionCard() {
  if (S.current) {
    return `<div class="card hl"><span class="eyebrow">Séance en cours</span><h2>${PROGRAM[S.current.type].n} — pas terminée</h2>
      <button class="btn primary big" data-a="resume">Reprendre la séance</button></div>`;
  }
  const tp = todayPlan();
  if (tp.status === "done") {
    return `<div class="card"><span class="eyebrow">Séance du jour</span><h2>✅ ${PROGRAM[tp.type].n} faite</h2>
      <p class="muted">Bien joué. Maintenant, mange et dors : c'est là que le muscle se construit.</p></div>`;
  }
  if (tp.status === "train") {
    const pr = PROGRAM[tp.type];
    return `<div class="card hl"><span class="eyebrow">Séance du jour</span><h2>${pr.n}</h2><p class="muted">${pr.sub} · ${pr.slots.length} exercices · environ 45 min</p>
      <button class="btn primary big" data-a="start" data-type="${tp.type}">Démarrer la séance</button>
      <a class="link" href="#/seance">Voir le détail</a></div>`;
  }
  return `<div class="card"><span class="eyebrow">Aujourd'hui</span><h2>😴 Repos</h2>
    <p class="muted">Les muscles grandissent quand tu récupères.${tp.next ? ` Prochaine séance : <b>${tp.next.day}</b> (${PROGRAM[tp.next.type].n}).` : ""}</p>
    <button class="link" data-a="start" data-type="${tp.type}">Envie de bouger ? Faire la ${PROGRAM[tp.type].n} quand même</button></div>`;
}
function mealsCard() {
  const d = today(), c = checksOf(d), times = mealTimes(d), nx = nextMealSlot();
  const lines = dayMeals(d).map((x, i) => `
    <div class="line ${i === nx ? "next" : ""}">
      ${check(c[x.slot.id], "meal-check", `data-slot="${x.slot.id}"`)}
      <div class="grow"><div class="small muted">${times[i]} · ${x.slot.n}${i === nx ? " · à venir" : ""}</div>
      <div class="t ${c[x.slot.id] ? "done-txt" : ""}">${esc(x.meal.n)}</div></div>
    </div>`).join("");
  const n = MEAL_SLOTS.filter((s) => c[s.id]).length;
  return `<div class="card"><div class="row between"><span class="eyebrow">Repas du jour</span><span class="pill">${n}/5</span></div>
    <div>${lines}
    <div class="line">${check(c.shake, "meal-check", `data-slot="shake"`)}<div class="grow"><div class="small muted">Quand tu veux</div><div class="t ${c.shake ? "done-txt" : ""}">🥤 Shake maison</div></div></div></div>
    <a class="link" href="#/repas">Voir les recettes et le plan de la semaine</a></div>`;
}
function weightCard() {
  const p = S.profile, cur = curKg(), pct = clamp(((cur - p.startKg) / (p.goalKg - p.startKg)) * 100, 0, 100);
  return `<div class="card"><span class="eyebrow">Poids</span>
    <div class="row between"><div><span class="big-num">${fmtKg(cur)}</span> <span class="muted">kg</span></div><div class="muted" style="text-align:right">Objectif<br><b style="color:var(--txt)">${fmtKg(p.goalKg)} kg</b></div></div>
    <div class="bar"><i style="width:${Math.max(3, pct)}%"></i></div>
    <p class="muted small">Départ ${fmtKg(p.startKg)} kg · premier palier ${fmtKg(p.goal3Kg)} kg pour le ${frDate(p.goal3Date)}</p>
    ${weighDue() ? `<a class="btn" href="#/suivi">⚖️ Noter mon poids de la semaine</a>` : ""}</div>`;
}
function streakCard() {
  const st = streakWeeks(), n = Math.min(3, distinctDaysInWeek(weekKey(today())));
  return `<div class="card"><span class="eyebrow">Régularité</span>
    <div class="row between"><div><span class="big-num">${st}</span> <span class="muted">semaine${st > 1 ? "s" : ""} de suite à 3 séances</span></div><span style="font-size:30px">${st ? "🔥" : "✨"}</span></div>
    <div class="row"><div class="dots">${[0, 1, 2].map((i) => `<i class="${i < n ? "on" : ""}" style="width:44px;height:8px"></i>`).join("")}</div><span class="muted small">Cette semaine : ${n}/3</span></div></div>`;
}
function tipsCards() {
  let out = "";
  const adv = weightAdvice();
  if (adv.kind === "stagnation") out += `<div class="card soft"><b>💡 Petit ajustement</b><p class="muted">${adv.text}</p><button class="btn" data-a="bump">Ajouter 250 kcal à ma cible</button></div>`;
  const ym = today().slice(0, 7);
  if (S.sessions.length && !S.photos.some((p) => p.ym === ym)) out += `<div class="card soft"><b>📸 Photo du mois</b><p class="muted">Pas encore de photo pour ${frMonth(ym)}. Dans quelques mois, tu seras content de voir la différence.</p><button class="btn" data-a="suivi-tab" data-tab="photos">Ajouter ma photo</button></div>`;
  if (S.weights.length >= 2 && measureDue()) out += `<div class="card soft"><b>📏 Pense aux mensurations</b><p class="muted">De temps en temps, mesure ton tour de bras et de poitrine : la balance ne dit pas tout.</p><button class="btn" data-a="suivi-tab" data-tab="poids">Noter mes mensurations</button></div>`;
  return out;
}
function viewHome() {
  const lv = levelInfo(), nm = S.profile.name ? `, ${esc(S.profile.name)}` : "";
  return `
  <div class="row between"><div><p class="muted small cap1">${frDateLong(today())}</p><h1>Salut${nm} 👋</h1></div>
    <a href="#/badges" class="pill acc" style="text-decoration:none">Niv. ${lv.lvl}</a></div>
  <div class="card" style="gap:8px"><div class="row between"><b>${lv.name}</b><span class="muted small">${lv.xp} XP · encore ${lv.next} pour le niveau ${lv.lvl + 1}</span></div><div class="bar"><i style="width:${Math.max(2, lv.pct)}%"></i></div></div>
  ${sessionCard()}${mealsCard()}${weightCard()}${streakCard()}${tipsCards()}`;
}
ACTIONS["meal-check"] = (el) => {
  const d = today(), was = isFullDay(d);
  toggleMeal(d, el.dataset.slot);
  if (!was && isFullDay(d)) toast("🍽️ Tous les repas du jour : +25 XP");
  announceBadges(); render();
};
ACTIONS.bump = () => { bumpKcal(); toast(`Cible passée à ${S.profile.kcal} kcal par jour`); render(); };
ACTIONS["suivi-tab"] = (el) => { UI.suiviTab = el.dataset.tab; go("suivi"); };

/* ================= SÉANCE ================= */
function proposalsHtml() {
  return S.pending.map((p) => `<div class="card hl"><span class="eyebrow">${p.dir === "up" ? "Progression" : "Ajustement"}</span><h3>${p.dir === "up" ? "📈" : "🔧"} ${esc(p.title)}</h3><p class="muted">${esc(p.text)}</p>
    <div class="grid2"><button class="btn primary" data-a="prop" data-key="${p.key}" data-ok="1">${p.dir === "up" ? "On monte 💪" : "D'accord"}</button><button class="btn ghost" data-a="prop" data-key="${p.key}" data-ok="0">Pas encore</button></div></div>`).join("");
}
function viewSeance() {
  const tp = todayPlan(), type = UI.type || tp.type, pr = PROGRAM[type];
  const items = buildSession(type, S.parkLast);
  const day = DAYS_JS_FR[S.profile.days[type]];
  return `
  <h1>Séance</h1>
  ${S.current ? `<div class="card hl"><h3>Séance en cours : ${PROGRAM[S.current.type].n}</h3><button class="btn primary" data-a="resume">Reprendre</button></div>` : ""}
  ${proposalsHtml()}
  <div class="seg">${["A", "B", "C"].map((t) => `<button class="${t === type ? "on" : ""}" data-a="type" data-type="${t}">Séance ${t}</button>`).join("")}</div>
  <div class="card">
    <div><h2>${pr.sub}</h2><p class="muted small">Jour prévu : ${day}${pr.light ? " · lendemain de la séance B, donc on y va léger et propre" : ""}</p></div>
    <div>
      <div class="line"><span style="font-size:22px">🔥</span><div class="grow"><div class="t">Échauffement</div><div class="muted small">5 minutes, guidé au début de la séance</div></div></div>
      ${items.map((it) => `<div class="line" data-a="fiche" data-ex="${it.exId}" style="cursor:pointer">
        <div class="grow"><div class="t">${esc(EXERCISES[it.exId].n)}${it.kg ? ` <span class="pill">+${fmtKg(it.kg)} kg</span>` : ""}</div>
        <div class="muted small">${targetLabel(it)}${it.origId ? ` · remplace ${esc(EXERCISES[it.origId].n)}` : ""}${it.last ? ` · dernière fois : ${it.last.join(" · ")}` : ""}</div></div><span class="muted">ⓘ</span></div>`).join("")}
    </div>
    ${S.current ? "" : `<button class="btn primary big" data-a="start" data-type="${type}">Démarrer la ${pr.n}</button>`}
  </div>
  <p class="muted small center">Le programme s'ajuste tout seul : note simplement tes reps, l'app s'occupe du reste.</p>
  <a class="btn ghost" href="#/calendrier">📅 Calendrier et stats</a>`;
}
ACTIONS.type = (el) => { UI.type = el.dataset.type; render(); };
ACTIONS.prop = (el) => {
  const ok = el.dataset.ok === "1";
  answerProposal(el.dataset.key, ok);
  toast(ok ? "C'est noté, le programme est mis à jour" : "Pas de souci, on garde comme ça");
  if (!$("#session").hidden && typeof renderSession === "function") renderSession(); else render();
};
ACTIONS.fiche = (el) => {
  const ex = EXERCISES[el.dataset.ex];
  const needs = ex.needs ? ex.needs.map((g) => g.map((e) => EQUIP.find((q) => q.id === e).n.split(" (")[0]).join(" + ")).join(" ou ") : "Aucun matériel";
  openSheet(`<div class="row between"><h2>${esc(ex.n)}</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <div><span class="eyebrow">Bonne exécution</span><p>${esc(ex.how)}</p></div>
    <div><span class="eyebrow" style="color:var(--orange)">Erreurs à éviter</span><p>${esc(ex.errs)}</p></div>
    <p class="muted small">Matériel : ${esc(needs)}</p>
    <button class="btn" data-a="close-sheet">Compris</button>`);
};
ACTIONS["close-sheet"] = closeSheet;

/* ================= REPAS ================= */
function slotTip(id) {
  const med = S.profile.med;
  return {
    pdj: med ? `À prendre AVANT ${medWord()} : c'est ton plus gros repas, profites-en tant que la faim est là.` : "Ton plus gros repas de la journée.",
    midi: med ? "Appétit faible ? Petit mais dense, ou à boire. Un soda ne remplace pas un repas." : "Petit mais dense si tu n'as pas très faim.",
    gouter: med ? "La faim revient en sortant des cours : fais-en un vrai repas." : "Un vrai repas, pas juste un biscuit.",
    diner: "Féculents + protéines + légumes cuits.",
    coll: "Une petite collation avant de dormir, ça compte.",
  }[id];
}
function mealCard(slot, meal, time, dateStr, isToday, wk, di) {
  const key = di + slot.id, open = UI.open[key], c = checksOf(dateStr);
  const ings = meal.ing.map(([id, q]) => `${ING[id].n} (${fmtQty(ING[id], q)})`).join(", ");
  return `<div class="card">
    <div class="row between"><span class="eyebrow">${slot.ic} ${slot.n} · ${time}</span>${isToday ? check(c[slot.id], "meal-check", `data-slot="${slot.id}"`) : ""}</div>
    <h3>${esc(meal.n)}</h3>
    <p class="muted small">≈ ${meal.kcal} kcal · ${meal.prot} g de protéines</p>
    ${open ? `<p>${esc(meal.how)}</p>${ings ? `<p class="muted small">Ingrédients : ${esc(ings)}</p>` : ""}<p class="small" style="color:var(--blue)">${slotTip(slot.id)}</p>` : ""}
    <div class="row"><button class="btn sm" data-a="meal-open" data-key="${key}">${open ? "Fermer" : "📖 Recette"}</button>
    ${slot.id !== "shake" ? `<button class="btn sm" data-a="meal-swap" data-di="${di}" data-slot="${slot.id}">🔄 Changer ce repas</button>` : ""}</div>
  </div>`;
}
function viewRepas() {
  const wk = addDays(weekKey(today()), UI.weekOff * 7);
  const head = `<h1>Repas</h1>
    <div class="seg"><button class="${UI.repasTab === "plan" ? "on" : ""}" data-a="repas-tab" data-tab="plan">Plan</button><button class="${UI.repasTab === "courses" ? "on" : ""}" data-a="repas-tab" data-tab="courses">Liste de courses</button></div>
    <div class="seg"><button class="${UI.weekOff === 0 ? "on" : ""}" data-a="week-off" data-off="0">Cette semaine</button><button class="${UI.weekOff === 1 ? "on" : ""}" data-a="week-off" data-off="1">Semaine prochaine</button></div>`;
  if (UI.repasTab === "courses") return head + viewCourses(wk);
  const todayDi = dayIdx(today());
  const di = UI.mealDay != null ? UI.mealDay : (UI.weekOff === 0 ? todayDi : 0);
  const dateStr = addDays(wk, di), isToday = dateStr === today();
  const times = mealTimes(dateStr), tot = dayTotals(dateStr), boost = dayBooster(dateStr);
  return head + `
  <div class="chips week">${DAYS_FR.map((n, i) => `<button class="chip ${i === di ? "on" : ""}" data-a="meal-day" data-di="${i}">${n.slice(0, 3)}${UI.weekOff === 0 && i === todayDi ? " •" : ""}</button>`).join("")}</div>
  <div class="card soft"><div class="row between"><b class="cap1">${frDateLong(dateStr)}</b><span class="pill">≈ ${tot.kcal} kcal · ${tot.prot} g prot.</span></div>
    <p class="muted small">Ta cible : environ ${S.profile.kcal} kcal et ${S.profile.prot} g de protéines par jour. Le plan vise exprès un peu au-dessus : le midi, tu mangeras souvent moins que prévu. Valeurs approximatives, pas besoin de peser.</p></div>
  ${dayMeals(dateStr).map((x, i) => mealCard(x.slot, x.meal, times[i], dateStr, isToday, wk, di)).join("")}
  ${mealCard({ id: "shake", n: "Shake du jour", ic: "🥤" }, SHAKE, "quand tu veux", dateStr, isToday, wk, di)}
  ${boost ? `<div class="card hl"><span class="eyebrow">Bonus du jour · +${boost.extra} kcal</span><p>Pour atteindre ta cible, ajoute par exemple :</p><ul style="margin:0;padding-left:20px">${boost.picks.map((b) => `<li>${b.n} (≈ ${b.kcal} kcal)</li>`).join("")}</ul></div>` : ""}
  <div class="card"><div class="row" style="align-items:flex-start">${check(S.profile.holiday, "holiday")}<div class="grow"><b>Mode vacances</b><p class="muted small">Coche quand tu n'as pas cours : le bouton « Changer ce repas » proposera aussi des midis à préparer à la maison.</p></div></div></div>`;
}
function viewCourses(wk) {
  const list = shoppingList(wk), checks = S.shop[wk] || {};
  const total = list.reduce((a, g) => a + g.items.length, 0), done = list.reduce((a, g) => a + g.items.filter((i) => checks[i.id]).length, 0);
  return `
  <div class="card soft"><div class="row between"><b>Semaine du ${frDate(wk)}</b><span class="pill">${done}/${total}</span></div>
    <p class="muted small">Calculée d'après ton plan (repas + shake quotidien), pour une personne. Regarde d'abord ce qu'il y a déjà dans les placards.</p>
    <button class="btn primary" data-a="share-list">📤 Partager la liste</button></div>
  ${list.map((g) => `<div class="card"><span class="eyebrow">${g.rayon}</span><div>${g.items.map((it) => `
    <div class="line">${check(checks[it.id], "shop-check", `data-id="${it.id}" data-wk="${wk}"`)}<div class="grow t ${checks[it.id] ? "done-txt" : ""}">${esc(it.n)}</div><span class="muted">${it.qty}</span></div>`).join("")}</div></div>`).join("")}
  <button class="btn ghost" data-a="shop-reset" data-wk="${wk}">Tout décocher</button>`;
}
ACTIONS["repas-tab"] = (el) => { UI.repasTab = el.dataset.tab; render(); };
ACTIONS["week-off"] = (el) => { UI.weekOff = +el.dataset.off; UI.mealDay = null; UI.open = {}; render(); };
ACTIONS["meal-day"] = (el) => { UI.mealDay = +el.dataset.di; UI.open = {}; render(); };
ACTIONS["meal-open"] = (el) => { UI.open[el.dataset.key] = !UI.open[el.dataset.key]; render(); };
ACTIONS["meal-swap"] = (el) => { swapMeal(addDays(weekKey(today()), UI.weekOff * 7), +el.dataset.di, el.dataset.slot); render(); };
ACTIONS.holiday = () => { S.profile.holiday = !S.profile.holiday; saveState(); render(); };
ACTIONS["shop-check"] = (el) => { const c = (S.shop[el.dataset.wk] = S.shop[el.dataset.wk] || {}); c[el.dataset.id] = !c[el.dataset.id]; saveState(); render(); };
ACTIONS["shop-reset"] = (el) => { delete S.shop[el.dataset.wk]; saveState(); render(); };
ACTIONS["share-list"] = async () => {
  const text = shoppingText(addDays(weekKey(today()), UI.weekOff * 7));
  if (navigator.share) { try { await navigator.share({ title: "Liste de courses", text }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(text); toast("Liste copiée : colle-la dans un message"); }
  catch (e) { openSheet(`<h2>Liste de courses</h2><p class="muted small">Sélectionne et copie le texte :</p><pre style="white-space:pre-wrap;margin:0">${esc(text)}</pre><button class="btn" data-a="close-sheet">Fermer</button>`); }
};

/* ================= SUIVI ================= */
function viewSuivi() {
  const tabs = [["poids", "Poids"], ["records", "Records"], ["photos", "Photos"], ["objectifs", "Objectifs"]];
  const body = { poids: viewPoids, records: viewRecords, photos: viewPhotos, objectifs: viewObjectifs }[UI.suiviTab]();
  return `<h1>Suivi</h1><div class="seg">${tabs.map(([id, n]) => `<button class="${UI.suiviTab === id ? "on" : ""}" data-a="suivi-tab" data-tab="${id}">${n}</button>`).join("")}</div>${body}`;
}
function viewPoids() {
  const p = S.profile, w = sortedWeights(), adv = weightAdvice();
  const ms = [...S.measures].sort((a, b) => (a.d < b.d ? 1 : -1));
  return `
  <div class="card"><span class="eyebrow">Noter mon poids</span>
    <p class="muted small">Une fois par semaine, le matin au réveil, après être passé aux toilettes. Pas besoin de plus.</p>
    <div class="grid2"><div class="field"><label for="w-kg">Poids (kg)</label><input type="text" id="w-kg" inputmode="decimal" placeholder="${fmtKg(curKg())}"></div>
    <div class="field"><label for="w-d">Date</label><input type="date" id="w-d" value="${today()}" max="${today()}"></div></div>
    <button class="btn primary" data-a="w-add">Enregistrer (+15 XP)</button></div>
  <div class="card"><div class="row between"><span class="eyebrow">Évolution</span><span class="pill">${fmtKg(curKg())} kg</span></div>
    ${lineChart(w.map((x) => ({ d: x.d, v: x.kg })), { unit: " kg", label: "Évolution du poids", goals: [{ v: p.goalKg, label: `Objectif ${fmtKg(p.goalKg)} kg`, color: "#5cc8ff" }, { v: p.goal3Kg, label: `Palier ${fmtKg(p.goal3Kg)} kg`, color: "#8f99a8" }] })}
    <p class="${adv.kind === "good" || adv.kind === "fast" ? "" : "muted"}">${adv.text}</p>
    ${adv.canBump ? `<button class="btn" data-a="bump">Ajouter 250 kcal à ma cible (${S.profile.kcal} → ${S.profile.kcal + 250})</button>` : ""}</div>
  ${w.length ? `<div class="card"><span class="eyebrow">Dernières pesées</span><div>${[...w].reverse().slice(0, 8).map((x) => `<div class="line"><div class="grow">${frDate(x.d)} ${x.d.slice(0, 4)}</div><b>${fmtKg(x.kg)} kg</b><button class="btn sm ghost danger" data-a="w-del" data-d="${x.d}" aria-label="Supprimer">✕</button></div>`).join("")}</div></div>` : ""}
  <div class="card"><span class="eyebrow">📏 Mensurations</span>
    <p class="muted small">Environ une fois par mois. Bras : contracté, au plus gros du biceps. Poitrine : au niveau des pectoraux, après avoir expiré.</p>
    <div class="grid2"><div class="field"><label for="m-bras">Tour de bras (cm)</label><input type="text" id="m-bras" inputmode="decimal"></div>
    <div class="field"><label for="m-poit">Tour de poitrine (cm)</label><input type="text" id="m-poit" inputmode="decimal"></div></div>
    <button class="btn" data-a="m-add">Enregistrer</button>
    ${ms.length ? `<div>${ms.slice(0, 6).map((m) => `<div class="line"><div class="grow">${frDate(m.d)} ${m.d.slice(0, 4)}</div><span>${m.bras ? `Bras <b>${fmtKg(m.bras)}</b>` : ""}${m.bras && m.poit ? " · " : ""}${m.poit ? `Poitrine <b>${fmtKg(m.poit)}</b>` : ""}</span></div>`).join("")}</div>` : ""}</div>`;
}
ACTIONS["w-add"] = () => {
  const kg = num($("#w-kg").value), d = $("#w-d").value || today();
  if (!(kg > 25 && kg < 200)) return toast("Entre ton poids en kg, par exemple 56,4");
  S.weights = S.weights.filter((x) => x.d !== d); S.weights.push({ d, kg }); saveState();
  toast("Poids enregistré ✔"); announceBadges(); render();
};
ACTIONS["w-del"] = (el) => { S.weights = S.weights.filter((x) => x.d !== el.dataset.d); saveState(); render(); };
ACTIONS["m-add"] = () => {
  const bras = num($("#m-bras").value), poit = num($("#m-poit").value);
  if (!(bras > 0) && !(poit > 0)) return toast("Entre au moins une mesure");
  S.measures = S.measures.filter((m) => m.d !== today());
  S.measures.push({ d: today(), bras: bras > 0 ? bras : null, poit: poit > 0 ? poit : null }); saveState();
  toast("Mensurations enregistrées ✔"); render();
};
function viewRecords() {
  const ser = recordSeries(UI.recType), rt = RECORD_TYPES.find((r) => r.id === UI.recType);
  return `
  <div class="grid3">${RECORD_TYPES.map((r) => `<div class="tile"><b>${bestRecord(r.id) || "–"}</b><span class="muted small">${r.n}</span></div>`).join("")}</div>
  <div class="card"><span class="eyebrow">Meilleure série par jour</span>
    <div class="seg">${RECORD_TYPES.map((r) => `<button class="${r.id === UI.recType ? "on" : ""}" data-a="rec-type" data-type="${r.id}">${r.n}</button>`).join("")}</div>
    ${lineChart(ser, { zero: true, label: `Records de ${rt.n}` })}
    <p class="muted small">Tes séances remplissent ce graphique toutes seules (séries sans poids ajouté).</p></div>
  <div class="card"><span class="eyebrow">Noter un test max</span>
    <p class="muted small">Tu as testé ton maximum en dehors d'une séance ? Note-le ici.</p>
    <div class="grid2"><div class="field"><label for="r-type">Exercice</label><select id="r-type">${RECORD_TYPES.map((r) => `<option value="${r.id}" ${r.id === UI.recType ? "selected" : ""}>${r.n}</option>`).join("")}</select></div>
    <div class="field"><label for="r-v">Répétitions</label><input type="number" id="r-v" inputmode="numeric"></div></div>
    <button class="btn primary" data-a="r-add">Enregistrer</button></div>`;
}
ACTIONS["rec-type"] = (el) => { UI.recType = el.dataset.type; render(); };
ACTIONS["r-add"] = () => {
  const v = Math.round(num($("#r-v").value)), type = $("#r-type").value;
  if (!(v > 0 && v < 200)) return toast("Entre un nombre de répétitions");
  const before = bestRecord(type);
  S.records.push({ d: today(), type, v }); saveState(); UI.recType = type;
  toast(v > before && before ? "🏅 Nouveau record !" : "Enregistré ✔"); announceBadges(); render();
};
function viewPhotos() {
  const ym = today().slice(0, 7), ph = [...S.photos].sort((a, b) => (a.ym < b.ym ? -1 : 1));
  const cur = ph.find((p) => p.ym === ym);
  const a = ph.find((p) => p.id === UI.cmpA) || ph[0], b = ph.find((p) => p.id === UI.cmpB) || ph[ph.length - 1];
  const opts = (sel) => ph.map((p) => `<option value="${p.id}" ${sel && p.id === sel.id ? "selected" : ""}>${frMonth(p.ym)}</option>`).join("");
  return `
  <div class="card"><span class="eyebrow">Photo de ${frMonth(ym)}</span>
    ${cur ? `<img class="photo" data-photo="${cur.id}" alt="Photo du mois">` : `<p class="muted">Une photo par mois, toujours au même endroit, même lumière, même pose. C'est le meilleur moyen de voir tes progrès.</p>`}
    <button class="btn ${cur ? "" : "primary"}" data-a="photo-add">${cur ? "Remplacer la photo de ce mois" : "📸 Choisir ma photo du mois (+20 XP)"}</button>
    <p class="muted small">🔒 Tes photos restent uniquement sur ce téléphone. Elles ne sont envoyées nulle part.</p></div>
  ${ph.length >= 2 ? `<div class="card"><span class="eyebrow">Avant / après</span>
    <div class="grid2"><select data-c="cmp" data-k="cmpA" aria-label="Photo avant">${opts(a)}</select><select data-c="cmp" data-k="cmpB" aria-label="Photo après">${opts(b)}</select></div>
    <div class="grid2"><img class="photo" data-photo="${a.id}" alt="Avant"><img class="photo" data-photo="${b.id}" alt="Après"></div></div>`
    : `<p class="muted small center">La comparaison avant / après apparaîtra dès que tu auras 2 photos.</p>`}
  ${ph.length ? `<div class="card"><span class="eyebrow">Toutes mes photos</span><div class="grid3">${ph.map((p) => `<div class="center"><img class="photo" data-photo="${p.id}" alt=""><span class="muted small">${frMonth(p.ym)}</span><br><button class="link small danger" style="color:var(--red)" data-a="photo-del" data-id="${p.id}">Supprimer</button></div>`).join("")}</div></div>` : ""}`;
}
ACTIONS["photo-add"] = async () => {
  const data = await pickImage(); if (!data) return;
  const ym = today().slice(0, 7), old = S.photos.find((p) => p.ym === ym);
  const id = "ph-" + uid();
  try { await photoPut(id, data); } catch (e) { return toast("Impossible d'enregistrer la photo"); }
  if (old) { await photoDel(old.id).catch(() => {}); S.photos = S.photos.filter((p) => p.id !== old.id); }
  S.photos.push({ id, ym, d: today() }); saveState();
  toast("Photo enregistrée ✔"); announceBadges(); render();
};
ACTIONS["photo-del"] = async (el) => {
  if (!confirm("Supprimer cette photo ?")) return;
  await photoDel(el.dataset.id).catch(() => {});
  S.photos = S.photos.filter((p) => p.id !== el.dataset.id); saveState(); render();
};
function viewObjectifs() {
  const p = S.profile, cur = curKg();
  const pct3 = clamp(((cur - p.startKg) / (p.goal3Kg - p.startKg)) * 100, 0, 100), pct = clamp(((cur - p.startKg) / (p.goalKg - p.startKg)) * 100, 0, 100);
  const left3 = daysBetween(today(), p.goal3Date);
  return `
  <div class="card hl"><span class="eyebrow">Objectif à 3 mois · ${frDate(p.goal3Date)} ${p.goal3Date.slice(0, 4)}</span>
    <h2>${fmtKg(p.goal3Kg - 0.5)}-${fmtKg(p.goal3Kg + 0.5)} kg + premier muscle-up</h2>
    <div class="row between small"><span>⚖️ ${fmtKg(cur)} kg</span><span class="muted">${left3 > 0 ? `encore ${left3} jours` : "date passée : on continue !"}</span></div>
    <div class="bar"><i style="width:${Math.max(3, pct3)}%"></i></div>
    <div class="line" style="border-top:0">${S.muscleUp ? `<span style="font-size:26px">👑</span><div class="grow"><b>Muscle-up réussi</b><div class="muted small">le ${frDate(S.muscleUp)} ${S.muscleUp.slice(0, 4)}</div></div>` : `<span style="font-size:26px">🎯</span><div class="grow"><b>Muscle-up : en préparation</b><div class="muted small">La séance C t'y amène étape par étape.</div></div>`}</div>
    ${S.muscleUp ? "" : `<button class="btn" data-a="mu-done">J'ai passé mon premier muscle-up !</button>`}</div>
  <div class="card"><span class="eyebrow">Objectif final · vers le printemps ${p.goalDate.slice(0, 4)}</span>
    <h2>${fmtKg(p.goalKg)} kg, musclé</h2>
    <div class="row between small"><span>${fmtKg(p.startKg)} kg</span><span class="muted">${fmtKg(Math.max(0, cur - p.startKg))} kg gagnés sur ${fmtKg(p.goalKg - p.startKg)}</span><span>${fmtKg(p.goalKg)} kg</span></div>
    <div class="bar"><i style="width:${Math.max(3, pct)}%"></i></div>
    <p class="muted small">Rythme visé : +0,5 à 1 kg par mois. C'est lent exprès : c'est comme ça qu'on prend du muscle et pas juste du poids.</p></div>`;
}
ACTIONS["mu-done"] = () => {
  if (!confirm("Tu as vraiment passé ton premier muscle-up ? 👑")) return;
  S.muscleUp = today(); saveState(); announceBadges(); toast("👑 ÉNORME ! Premier muscle-up validé");
  if (!$("#session").hidden && typeof renderSession === "function") renderSession(); else render();
};

/* ================= PLUS ================= */
function viewPlus() {
  return `<h1>Plus</h1><div class="menu">
    <a href="#/parcs"><span class="ic">🌳</span>Mes parcs</a>
    <a href="#/calendrier"><span class="ic">📅</span>Calendrier et stats</a>
    <a href="#/badges"><span class="ic">🏅</span>Niveau et badges</a>
    <a href="#/rappels"><span class="ic">⏰</span>Rappels pour manger</a>
    <a href="#/exercices"><span class="ic">📖</span>Fiches des exercices</a>
    <a href="#/reglages"><span class="ic">⚙️</span>Réglages et sauvegarde</a></div>`;
}
function viewParcs() {
  return `${backLink()}<h1>Mes parcs</h1>
  <p class="muted">Au début de chaque séance, tu choisis ton parc : l'app remplace toute seule les exercices impossibles avec le matériel présent.</p>
  ${S.parks.map((pk) => `<div class="card"><div class="row">${pk.photo ? `<img class="thumb" data-photo="${pk.photo}" alt="">` : `<div class="thumb" style="display:grid;place-items:center;font-size:28px">🌳</div>`}
    <div class="grow"><h3>${esc(pk.name)}</h3><p class="muted small">${pk.equip.length ? pk.equip.map((e) => EQUIP.find((q) => q.id === e).n.split(" (")[0]).join(" · ") : "Aucun matériel"}</p></div></div>
    <button class="btn sm" style="width:100%" data-a="park-edit" data-id="${pk.id}">Modifier</button></div>`).join("")}
  <button class="btn primary" data-a="park-edit" data-id="">+ Ajouter un parc</button>`;
}
function parkSheet() {
  const d = UI.parkDraft;
  openSheet(`<div class="row between"><h2>${d.isNew ? "Nouveau parc" : "Modifier le parc"}</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <div class="field"><label for="pk-name">Nom du parc</label><input type="text" id="pk-name" value="${esc(d.name)}" placeholder="Parc de la mairie" autocomplete="off"></div>
    ${d.photoData ? `<img class="photo wide" src="${d.photoData}" alt="">` : d.photo ? `<img class="photo wide" data-photo="${d.photo}" alt="">` : ""}
    <button class="btn" data-a="park-photo">📷 ${d.photo || d.photoData ? "Changer la photo" : "Ajouter une photo (galerie ou appareil photo)"}</button>
    <span class="eyebrow">Matériel disponible</span>
    <div>${EQUIP.map((e) => `<div class="line">${check(d.equip.includes(e.id), "park-eq", `data-id="${e.id}"`)}<div class="grow t">${e.n}</div></div>`).join("")}</div>
    <button class="btn primary" data-a="park-save">Enregistrer</button>
    ${d.isNew ? "" : `<button class="btn ghost danger" data-a="park-del">Supprimer ce parc</button>`}`);
}
ACTIONS["park-edit"] = (el) => {
  const pk = S.parks.find((p) => p.id === el.dataset.id);
  UI.parkDraft = pk ? { ...pk, equip: [...pk.equip], isNew: false } : { id: uid(), name: "", equip: [], photo: null, isNew: true };
  parkSheet();
};
const keepParkName = () => { UI.parkDraft.name = $("#pk-name").value; };
ACTIONS["park-eq"] = (el) => { keepParkName(); const d = UI.parkDraft, id = el.dataset.id; d.equip = d.equip.includes(id) ? d.equip.filter((e) => e !== id) : d.equip.concat(id); parkSheet(); };
ACTIONS["park-photo"] = async () => { keepParkName(); const data = await pickImage(); if (data) { UI.parkDraft.photoData = data; parkSheet(); } };
ACTIONS["park-save"] = async () => {
  keepParkName(); const d = UI.parkDraft;
  if (!d.name.trim()) return toast("Donne un nom au parc");
  let photo = d.photo;
  if (d.photoData) {
    const id = "pk-" + uid();
    try { await photoPut(id, d.photoData); if (photo) await photoDel(photo).catch(() => {}); photo = id; } catch (e) { toast("Photo non enregistrée"); }
  }
  const pk = { id: d.id, name: d.name.trim(), equip: EQUIP.map((e) => e.id).filter((e) => d.equip.includes(e)), photo };
  const i = S.parks.findIndex((p) => p.id === d.id);
  if (i >= 0) S.parks[i] = pk; else S.parks.push(pk);
  saveState(); closeSheet(); announceBadges(); render();
};
ACTIONS["park-del"] = async () => {
  if (!confirm("Supprimer ce parc ?")) return;
  const d = UI.parkDraft; if (d.photo) await photoDel(d.photo).catch(() => {});
  S.parks = S.parks.filter((p) => p.id !== d.id); if (S.parkLast === d.id) S.parkLast = null;
  saveState(); closeSheet(); render();
};

function viewCalendrier() {
  const ym = UI.calYm || today().slice(0, 7), [y, m] = ym.split("-").map(Number);
  const first = `${ym}-01`, offset = dayIdx(first), nDays = new Date(y, m, 0).getDate();
  const byDay = {}; S.sessions.forEach((s) => { if (s.d.startsWith(ym)) byDay[s.d] = s.type; });
  let cells = ["L", "M", "M", "J", "V", "S", "D"].map((d) => `<div class="hd">${d}</div>`).join("");
  for (let i = 0; i < offset; i++) cells += `<div class="d off"></div>`;
  for (let d = 1; d <= nDays; d++) { const ds = `${ym}-${pad2(d)}`; cells += `<div class="d ${byDay[ds] ? "s" : ""} ${ds === today() ? "today" : ""}">${byDay[ds] || d}</div>`; }
  const wk = weekKey(today()), ws = sessionsInWeek(wk);
  let sets = 0, reps = 0, mins = 0;
  ws.forEach((s) => { mins += Math.round(((s.endedAt || s.startedAt) - s.startedAt) / 60000); s.items.forEach((it) => it.sets.forEach((st) => { if (st.done) { sets++; if (it.unit !== "s" && it.unit !== "AR") reps += st.r; } })); });
  const monthCount = Object.keys(byDay).length;
  const recent = [...S.sessions].reverse().slice(0, 6);
  return `${backLink()}<h1>Calendrier</h1>
  <div class="card"><span class="eyebrow">Cette semaine</span>
    <div class="grid2"><div class="tile"><b>${distinctDaysInWeek(wk)}/3</b><span class="muted small">séances</span></div><div class="tile"><b>${mins}</b><span class="muted small">minutes</span></div>
    <div class="tile"><b>${sets}</b><span class="muted small">séries</span></div><div class="tile"><b>${reps}</b><span class="muted small">répétitions</span></div></div></div>
  <div class="card"><div class="row between"><button class="btn sm" data-a="cal" data-dir="-1" aria-label="Mois précédent">‹</button><b class="cap1">${frMonth(ym)}</b><button class="btn sm" data-a="cal" data-dir="1" aria-label="Mois suivant">›</button></div>
    <div class="cal">${cells}</div><p class="muted small center">${monthCount} séance${monthCount > 1 ? "s" : ""} ce mois-ci · la lettre indique la séance (A, B ou C)</p></div>
  ${recent.length ? `<div class="card"><span class="eyebrow">Dernières séances</span><div>${recent.map((s) => `<div class="line" data-a="sess-view" data-id="${s.id}" style="cursor:pointer"><span class="pill acc">${s.type}</span><div class="grow"><div class="t cap1">${frDateLong(s.d)}</div><div class="muted small">${s.items.reduce((a, it) => a + it.sets.filter((x) => x.done).length, 0)} séries</div></div><span class="muted">›</span></div>`).join("")}</div></div>` : ""}`;
}
ACTIONS.cal = (el) => {
  const [y, m] = (UI.calYm || today().slice(0, 7)).split("-").map(Number), d = new Date(y, m - 1 + +el.dataset.dir, 1);
  UI.calYm = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; render();
};
ACTIONS["sess-view"] = (el) => {
  const s = S.sessions.find((x) => x.id === el.dataset.id); if (!s) return;
  openSheet(`<div class="row between"><h2>${PROGRAM[s.type].n} · ${frDate(s.d)}</h2><button class="icon-btn" data-a="close-sheet" aria-label="Fermer">✕</button></div>
    <div>${s.items.map((it) => `<div class="line"><div class="grow"><div class="t">${esc(EXERCISES[it.exId] ? EXERCISES[it.exId].n : it.exId)}${it.kg ? ` (+${fmtKg(it.kg)} kg)` : ""}</div><div class="muted small">${it.sets.filter((x) => x.done).map((x) => x.r + (it.unit === "s" ? " s" : "")).join(" · ") || "non fait"}</div></div></div>`).join("")}</div>
    <button class="btn ghost danger" data-a="sess-del" data-id="${s.id}">Supprimer cette séance</button>`);
};
ACTIONS["sess-del"] = (el) => { if (!confirm("Supprimer cette séance ?")) return; S.sessions = S.sessions.filter((x) => x.id !== el.dataset.id); saveState(); closeSheet(); render(); };

function viewBadges() {
  const lv = levelInfo();
  return `${backLink()}<h1>Niveau et badges</h1>
  <div class="card hl"><div class="row between"><div><span class="eyebrow">Niveau ${lv.lvl}</span><h2>${lv.name}</h2></div><span class="big-num">${lv.xp}<span class="muted" style="font-size:16px"> XP</span></span></div>
    <div class="bar"><i style="width:${Math.max(2, lv.pct)}%"></i></div><p class="muted small">Encore ${lv.next} XP pour le niveau ${lv.lvl + 1}.</p></div>
  <div class="card"><span class="eyebrow">Comment gagner des XP</span>
    <p class="small">💪 Séance terminée : <b>100</b> · 🍽️ Repas coché : <b>5</b> · Journée complète : <b>+25</b><br>⚖️ Pesée : <b>15</b> · 📸 Photo du mois : <b>20</b> · 📏 Mensurations : <b>10</b> · 🏅 Badge : <b>50</b></p></div>
  <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? "on" : ""}" data-a="badge" data-id="${b.id}"><span class="ic">${b.ic}</span>${b.n}</div>`).join("")}</div>`;
}
ACTIONS.badge = (el) => { const b = BADGES.find((x) => x.id === el.dataset.id); toast(`${b.ic} ${b.d}${S.badges[b.id] ? ` — obtenu le ${frDate(S.badges[b.id])}` : " — pas encore obtenu"}`); };

function alarmList() {
  const labels = ["Petit-déj", "Midi", "Goûter", "Dîner", "Collation"], out = [];
  const med = S.profile.med ? ` AVANT ${S.profile.medName || "médicament"}` : "";
  const names = [`🍳 Petit-déj${med}`, "🥪 Midi : mange ou bois un truc", "🍝 Goûter = vrai repas", "🍽️ Dîner", "🥤 Collation + shake"];
  labels.forEach((l, i) => {
    const a = S.reminders.week[i], b = S.reminders.weekend[i];
    if (a === b) out.push({ t: a, days: "tous les jours", name: names[i] });
    else { out.push({ t: a, days: "lundi à vendredi", name: names[i] }); out.push({ t: b, days: "samedi et dimanche", name: names[i] }); }
  });
  return out;
}
function viewRappels() {
  const labels = ["Petit-déj", "Midi", "Goûter", "Dîner", "Collation"], al = alarmList();
  return `${backLink()}<h1>Rappels pour manger</h1>
  <div class="card soft"><b>🤝 Soyons honnêtes</b>
    <p class="muted">Une application web installée ne peut pas faire sonner un rappel de façon fiable quand elle est fermée sur Android. Plutôt que de te promettre des notifications qui arriveraient une fois sur deux, voici la méthode qui marche à 100 % : les alarmes de l'app Horloge de ton Samsung. À faire une seule fois (5 minutes).</p></div>
  <div class="card"><span class="eyebrow">1 · Tes horaires</span>
    <div class="remgrid small muted"><span></span><b>Semaine</b><b>Week-end</b></div>
    ${labels.map((l, i) => `<div class="remgrid"><b class="small">${l}</b><input type="time" data-c="rem" data-k="week" data-i="${i}" value="${S.reminders.week[i]}" aria-label="${l} semaine"><input type="time" data-c="rem" data-k="weekend" data-i="${i}" value="${S.reminders.weekend[i]}" aria-label="${l} week-end"></div>`).join("")}</div>
  <div class="card"><span class="eyebrow">2 · Crée ces ${al.length} alarmes dans l'app Horloge</span>
    <div>${al.map((a) => `<div class="line"><b style="font-size:20px;min-width:62px">${a.t}</b><div class="grow"><div class="t">${esc(a.name)}</div><div class="muted small">${a.days}</div></div></div>`).join("")}</div>
    <span class="eyebrow">Comment faire, pour chaque alarme</span>
    <ol class="steps"><li>Ouvre l'app <b>Horloge</b>, onglet <b>Alarme</b>.</li><li>Appuie sur le <b>+</b> en haut.</li><li>Règle l'heure.</li><li>Sous l'heure, appuie sur les jours pour choisir ceux de la répétition (L M M J V, ou S D).</li><li>Dans <b>Nom de l'alarme</b>, tape le nom indiqué ci-dessus.</li><li>Dans <b>Son de l'alarme</b>, choisis un son court, ou seulement le vibreur pour celle du midi au lycée.</li><li>Appuie sur <b>Enregistrer</b>.</li></ol>
    <button class="btn" data-a="alarms-copy">📋 Copier la liste des alarmes</button></div>
  <div class="card"><span class="eyebrow">Autre possibilité · l'agenda</span>
    <p class="muted small">Tu peux aussi ajouter les rappels à ton agenda (Samsung Calendar ou Google Agenda) : télécharge le fichier puis ouvre-le. Selon l'agenda, il faudra peut-être activer les notifications des événements. Les alarmes de l'Horloge restent la solution la plus sûre.</p>
    <button class="btn ghost" data-a="ics">📆 Télécharger les rappels pour l'agenda (.ics)</button></div>
  <p class="muted small center">Dans l'app, l'accueil met toujours en avant ton prochain repas.</p>`;
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

function viewExercices() {
  const ids = Object.keys(EXERCISES).sort((a, b) => EXERCISES[a].n.localeCompare(EXERCISES[b].n, "fr"));
  return `${backLink()}<h1>Fiches des exercices</h1><div class="card"><div>${ids.map((id) => `<div class="line" data-a="fiche" data-ex="${id}" style="cursor:pointer"><div class="grow t">${esc(EXERCISES[id].n)}</div><span class="muted">›</span></div>`).join("")}</div></div>`;
}

function viewReglages() {
  const p = S.profile, dayOpts = (v) => [1, 2, 3, 4, 5, 6, 0].map((d) => `<option value="${d}" ${d === v ? "selected" : ""}>${DAYS_JS_FR[d]}</option>`).join("");
  const age = p.birth ? Math.floor(daysBetween(p.birth, today()) / 365.25) : null;
  const f = (k, label, type = "number", extra = "") => `<div class="field"><label for="st-${k}">${label}</label><input type="${type === "number" ? "text" : type}" ${type === "number" ? 'data-num="1"' : ""} id="st-${k}" data-c="prof" data-k="${k}" value="${esc(type === "number" ? fmtKg(p[k]) : p[k])}" ${extra}></div>`;
  return `${backLink()}<h1>Réglages</h1>
  <div class="card"><span class="eyebrow">Mon profil</span>
    ${f("name", "Prénom", "text", 'autocomplete="off"')}
    ${f("birth", `Date de naissance${age != null ? ` (${age} ans)` : ""}`, "date")}
    <div class="grid2">${f("height", "Taille (cm)", "number", 'inputmode="numeric"')}${f("startKg", "Poids de départ (kg)", "number", 'inputmode="decimal" step="0.1"')}</div>
    <div class="grid2">${f("goal3Kg", "Palier 3 mois (kg)", "number", 'inputmode="decimal" step="0.5"')}${f("goalKg", "Objectif final (kg)", "number", 'inputmode="decimal" step="0.5"')}</div>
    <div class="row" style="align-items:flex-start">${check(p.med, "st-med")}<div class="grow"><b>Médicament le matin qui coupe l'appétit le midi</b><p class="muted small">Organise le plan repas autour.</p></div></div>
    ${p.med ? f("medName", "Nom du médicament (facultatif)", "text", 'autocomplete="off"') : ""}</div>
  <div class="card"><span class="eyebrow">Alimentation</span>
    <div class="grid2">${f("kcal", "Calories par jour", "number", 'inputmode="numeric" step="50" min="2800"')}${f("prot", "Protéines (g/jour)", "number", 'inputmode="numeric" step="5" min="80"')}</div>
    <p class="muted small">Cette app est faite pour prendre du poids : la cible de calories ne descend pas sous 2800 kcal et l'app ne proposera jamais de la baisser.</p></div>
  <div class="card"><span class="eyebrow">Entraînement</span>
    ${f("rest", "Repos entre les séries (secondes)", "number", 'inputmode="numeric" step="15" min="30" max="300"')}
    <div class="grid3">${["A", "B", "C"].map((t) => `<div class="field"><label for="st-day${t}">Séance ${t}</label><select id="st-day${t}" data-c="day" data-k="${t}">${dayOpts(p.days[t])}</select></div>`).join("")}</div></div>
  <div class="card"><span class="eyebrow">Sauvegarde</span>
    <p class="muted small">Tes données sont enregistrées sur ce téléphone uniquement. Fais une sauvegarde de temps en temps (par exemple une fois par mois) et garde le fichier dans Google Drive ou envoie-le-toi par mail.</p>
    <button class="btn primary" data-a="export">⬇️ Exporter une sauvegarde</button>
    <button class="btn" data-a="import">⬆️ Importer une sauvegarde</button></div>
  <div class="card soft"><span class="eyebrow">⚕️ Santé et sécurité</span>
    <p class="small">FORGE ne remplace pas l'avis de ton médecin. Si tu as une douleur qui dure, si tu perds du poids sans le vouloir ou si tu as une question sur ton traitement et l'alimentation, parles-en à ton médecin ou à tes parents.</p>
    <p class="small">Ici, on progresse avec de la vraie nourriture, de l'entraînement et du sommeil : l'app ne propose ni compléments alimentaires, ni brûleurs de graisse, ni produits dopants. Si une douleur aiguë apparaît pendant un exercice, arrête la séance.</p></div>
  <button class="btn ghost danger" data-a="reset">Effacer toutes mes données</button>
  <p class="muted small center">FORGE · version 1.0</p>`;
}
ACTIONS["st-med"] = () => { S.profile.med = !S.profile.med; saveState(); render(); };
ACTIONS.export = async () => { try { await exportData(); toast("Sauvegarde téléchargée ✔"); } catch (e) { toast("Export impossible"); } };
ACTIONS.import = () => {
  const inp = $("#file-json"); inp.value = "";
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    if (S.onboarded && !confirm("Importer cette sauvegarde va remplacer toutes les données actuelles. Continuer ?")) return;
    try { await importData(f); toast("Sauvegarde importée ✔"); go("home"); render(); } catch (e) { toast(e.message || "Fichier illisible"); }
  };
  inp.click();
};
ACTIONS.reset = async () => {
  if (!confirm("Effacer TOUTES tes données (séances, poids, photos) ? Pense à exporter une sauvegarde avant.")) return;
  if (!confirm("Vraiment tout effacer ? C'est définitif.")) return;
  localStorage.removeItem(STORE_KEY); await photoClear().catch(() => {}); loadState(); go("home"); render();
};

/* ---------- Champs modifiés (réglages, rappels, comparaison) ---------- */
const CHANGES = {
  prof(el) {
    const k = el.dataset.k, p = S.profile;
    if (el.dataset.num) {
      let v = num(el.value); if (!isFinite(v) || v <= 0) return render();
      if (k === "kcal") v = Math.max(2800, Math.round(v));
      if (k === "prot") v = clamp(Math.round(v), 80, 200);
      if (k === "rest") v = clamp(Math.round(v), 30, 300);
      p[k] = v;
    } else p[k] = el.value.trim();
    saveState(); announceBadges(); render();
  },
  day(el) { S.profile.days[el.dataset.k] = +el.value; saveState(); },
  rem(el) { if (el.value) { S.reminders[el.dataset.k][+el.dataset.i] = el.value; saveState(); render(); } },
  cmp(el) { UI[el.dataset.k] = el.value; render(); },
};

/* ================= RENDU & DÉMARRAGE ================= */
const VIEWS = { home: viewHome, seance: viewSeance, repas: viewRepas, suivi: viewSuivi, plus: viewPlus, parcs: viewParcs, calendrier: viewCalendrier, badges: viewBadges, rappels: viewRappels, exercices: viewExercices, reglages: viewReglages };
let lastRoute = null;
function render() {
  const view = $("#view"), tabs = $("#tabs");
  if (!S.onboarded) { tabs.hidden = true; view.innerHTML = viewOnboarding(); return; }
  let r = route(); if (!VIEWS[r]) r = "home";
  tabs.hidden = false;
  const active = SUB[r] || r;
  tabs.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.dataset.tab === active));
  view.innerHTML = VIEWS[r]();
  if (lastRoute !== r) { window.scrollTo(0, 0); lastRoute = r; }
  hydratePhotos();
}

function boot() {
  loadState();
  document.addEventListener("click", (e) => {
    if (e.target.id === "sheet") return closeSheet();
    const el = e.target.closest("[data-a]");
    if (el && ACTIONS[el.dataset.a]) { e.preventDefault(); ACTIONS[el.dataset.a](el, e); }
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-c]");
    if (el && CHANGES[el.dataset.c]) CHANGES[el.dataset.c](el);
  });
  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && $("#session").hidden && $("#sheet").hidden && !/INPUT|SELECT/.test(document.activeElement.tagName)) render(); });
  if (S.onboarded) announceBadges();
  render();
  if (S.current && typeof openSession === "function" && S.current.step !== "park") { /* séance interrompue : proposée sur l'accueil */ }
}
