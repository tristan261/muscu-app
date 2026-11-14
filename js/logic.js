/* FORGE — logique : programme, progression, repas, courses, XP, badges */
"use strict";

/* ================= PROGRAMME & PROGRESSION ================= */
const KG_STEP = 1.5, KG_MAX = 9;

function findSlot(key) {
  for (const t of Object.keys(PROGRAM)) for (const s of PROGRAM[t].slots) if (s.key === key) return s;
  return null;
}
function getProg(slot) {
  if (!S.prog[slot.key]) S.prog[slot.key] = { lvl: slot.lvl, kg: 0, bonus: 0, up: 0, down: 0 };
  const p = S.prog[slot.key];
  p.lvl = clamp(p.lvl, 0, slot.chain.length - 1);
  return p;
}
function equipOf(parkId) {
  const p = S.parks.find((x) => x.id === parkId);
  return p ? p.equip : null; // null = tout le matériel
}
function canDo(exId, equip) {
  const ex = EXERCISES[exId];
  if (!ex || !ex.needs || !equip) return true;
  return ex.needs.some((group) => group.every((e) => equip.includes(e)));
}
// Cherche le premier remplaçant faisable (en largeur, à travers les remplaçants des remplaçants)
function findSub(exId, equip) {
  const seen = new Set([exId]);
  let queue = [...(EXERCISES[exId].subs || [])];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id) || !EXERCISES[id]) continue;
    seen.add(id);
    if (canDo(id, equip)) return id;
    queue = queue.concat(EXERCISES[id].subs || []);
  }
  return null;
}

function buildItem(slot, equip) {
  const p = getProg(slot);
  const wanted = slot.chain[p.lvl];
  let exId = wanted, origId = null;
  if (!canDo(wanted, equip)) {
    const sub = findSub(wanted, equip);
    if (sub) { exId = sub; origId = wanted; }
  }
  const ex = EXERCISES[exId];
  const it = {
    key: slot.key, exId, origId, kg: origId ? 0 : p.kg,
    mode: slot.mode, unit: slot.unit || ex.unit || "reps",
    lo: slot.lo ? Math.max(1, slot.lo + p.bonus) : 0, hi: slot.hi ? Math.max(1, slot.hi + p.bonus) : 0,
    cap: slot.cap || 0, rir: slot.rir || "", perSide: !!ex.perSide, sets: [],
  };
  if (origId) {
    if (ex.spec) Object.assign(it, ex.spec);
    else if (it.unit === "AR" && ex.unit !== "AR") Object.assign(it, { mode: "time", lo: 20, hi: 30, unit: "s" });
  }
  const last = lastItem(slot.key, exId, it.kg);
  for (let i = 0; i < slot.sets; i++) {
    let r;
    const prev = last && last.sets[i] && last.sets[i].done ? last.sets[i].r : null;
    if (it.mode === "max") r = prev != null ? prev : Math.max(1, (slot.def || 8) - i);
    else if (prev != null) r = clamp(prev + (prev < it.hi ? (it.unit === "s" ? 5 : 1) : 0), Math.min(it.lo, prev), it.hi);
    else r = it.lo;
    it.sets.push({ r, done: false });
  }
  it.last = last ? last.sets.filter((s) => s.done).map((s) => s.r) : null;
  return it;
}

function buildSession(type, parkId) {
  const equip = equipOf(parkId);
  return PROGRAM[type].slots.map((slot) => buildItem(slot, equip));
}

function lastItem(key, exId, kg) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const it = S.sessions[i].items.find((x) => x.key === key && x.exId === exId && (kg == null || (x.kg || 0) === kg));
    if (it && it.sets.some((s) => s.done)) return it;
  }
  return null;
}

const unitLabel = (it, n) => it.unit === "s" ? " s" : it.unit === "AR" ? (n > 1 ? " allers-retours" : " aller-retour") : (it.perSide ? " par jambe" : "");
function targetLabel(it) {
  const n = it.sets.length;
  if (it.mode === "max") return `${n} × max`;
  const range = it.lo === it.hi ? `${it.hi}` : `${it.lo}-${it.hi}`;
  return `${n} × ${range}${unitLabel(it, it.hi)}`;
}
function targetHint(it) {
  if (it.mode === "max") return it.rir === "3" ? "Séance légère : arrête-toi 3 reps avant d'être à fond" : "Garde 1 ou 2 reps en réserve";
  if (it.unit === "s") return "Tiens la position, respire";
  return "";
}

// Analyse une séance terminée et prépare les propositions de progression
function evaluateSession(sess) {
  const out = [];
  for (const it of sess.items) {
    if (it.origId) continue; // exercice remplacé : on ne touche pas à la progression
    const slot = findSlot(it.key);
    if (!slot) continue;
    const p = getProg(slot);
    const vals = it.sets.filter((s) => s.done).map((s) => s.r);
    if (!vals.length) continue;
    const full = vals.length >= slot.sets;
    let success = false, struggle = false;
    if (it.mode === "max") {
      const mx = Math.max(...vals), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      success = full && mx >= it.cap && avg >= it.cap - 2;
      struggle = mx < 3;
    } else {
      success = full && vals.every((v) => v >= it.hi);
      struggle = vals.every((v) => v < it.lo);
    }
    p.up = success ? p.up + 1 : 0;
    p.down = struggle ? p.down + 1 : 0;
    if (S.pending.some((x) => x.key === slot.key)) continue;
    if (p.up >= 2) {
      const prop = makeProposal(slot, p, "up");
      if (prop) { S.pending.push(prop); out.push(prop); }
    } else if (p.down >= 2) {
      const prop = makeProposal(slot, p, "down");
      if (prop) { S.pending.push(prop); out.push(prop); }
    }
  }
  return out;
}

function makeProposal(slot, p, dir) {
  const cur = EXERCISES[slot.chain[p.lvl]].n;
  const step = slot.step || 2;
  if (dir === "up") {
    if (p.lvl < slot.chain.length - 1) {
      const nx = EXERCISES[slot.chain[p.lvl + 1]].n;
      return { key: slot.key, dir, kind: "variant", title: `${cur} : maîtrisé !`, text: `Tu as réussi toutes tes séries 2 fois de suite. On passe à une variante plus dure : ${nx}.` };
    }
    if (slot.weight && p.kg < KG_MAX) {
      const nk = p.kg + KG_STEP;
      return { key: slot.key, dir, kind: "weight", title: `${cur} : maîtrisé !`, text: `Tu as réussi toutes tes séries 2 fois de suite. On ajoute du poids : sac à dos avec ${Math.round(nk / 1.5)} bouteille${nk > 1.5 ? "s" : ""} d'eau de 1,5 L (${fmtKg(nk)} kg en tout).` };
    }
    if (slot.mode !== "max" && !slot.noBonus) {
      return { key: slot.key, dir, kind: "reps", title: `${cur} : maîtrisé !`, text: `On monte la cible : ${slot.lo + p.bonus + step === slot.hi + p.bonus + step ? slot.hi + p.bonus + step : `${slot.lo + p.bonus + step}-${slot.hi + p.bonus + step}`}${slot.unit === "s" ? " s" : " reps"} par série.` };
    }
    return null;
  }
  if (p.kg > 0) return { key: slot.key, dir, kind: "weight", title: `${cur} : on ajuste`, text: `On enlève une bouteille du sac pour retrouver de belles reps propres. C'est comme ça qu'on progresse le plus vite.` };
  if (p.lvl > 0) {
    const pv = EXERCISES[slot.chain[p.lvl - 1]].n;
    return { key: slot.key, dir, kind: "variant", title: `${cur} : on ajuste`, text: `On repasse sur ${pv} quelques séances pour construire la force, puis on y revient. Tout le monde passe par là.` };
  }
  if (slot.mode !== "max" && slot.lo + p.bonus - step >= 1) {
    return { key: slot.key, dir, kind: "reps", title: `${cur} : on ajuste`, text: `On baisse un peu la cible pour que chaque rep soit propre. Tu remonteras vite.` };
  }
  return null;
}

function answerProposal(key, accept) {
  const i = S.pending.findIndex((x) => x.key === key);
  if (i < 0) return;
  const prop = S.pending[i];
  const slot = findSlot(key), p = getProg(slot), step = slot.step || 2, sign = prop.dir === "up" ? 1 : -1;
  if (accept) {
    if (prop.kind === "variant") { p.lvl = clamp(p.lvl + sign, 0, slot.chain.length - 1); p.bonus = 0; }
    else if (prop.kind === "weight") p.kg = clamp(p.kg + sign * KG_STEP, 0, KG_MAX);
    else p.bonus += sign * step;
    p.up = 0; p.down = 0;
  } else {
    p.up = Math.min(p.up, 1); p.down = Math.min(p.down, 1);
  }
  S.pending.splice(i, 1);
  saveState();
}

/* ================= PLANNING ================= */
const sessionsOn = (d) => S.sessions.filter((s) => s.d === d);
const sessionsInWeek = (wk) => S.sessions.filter((s) => weekKey(s.d) === wk);
function distinctDaysInWeek(wk) { return new Set(sessionsInWeek(wk).map((s) => s.d)).size; }

function nextFreeType() {
  const done = sessionsInWeek(weekKey(today())).map((s) => s.type);
  return ["A", "B", "C"].find((t) => !done.includes(t)) || "A";
}
function todayPlan() {
  const d = today(), wd = parseYmd(d).getDay();
  const done = sessionsOn(d);
  if (done.length) return { status: "done", type: done[done.length - 1].type };
  const type = Object.keys(S.profile.days).find((t) => S.profile.days[t] === wd);
  if (type) return { status: "train", type };
  // prochain jour d'entraînement
  let next = null;
  for (let i = 1; i <= 7 && !next; i++) {
    const w = (wd + i) % 7;
    const t = Object.keys(S.profile.days).find((k) => S.profile.days[k] === w);
    if (t) next = { type: t, in: i, day: DAYS_JS_FR[w] };
  }
  return { status: "rest", type: nextFreeType(), next };
}
function streakWeeks() {
  let wk = weekKey(today()), n = 0;
  if (distinctDaysInWeek(wk) >= 3) n++;
  wk = addDays(wk, -7);
  while (distinctDaysInWeek(wk) >= 3) { n++; wk = addDays(wk, -7); }
  return n;
}
function hasFullWeek() {
  const weeks = {};
  S.sessions.forEach((s) => { const k = weekKey(s.d); (weeks[k] = weeks[k] || new Set()).add(s.d); });
  return Object.values(weeks).some((set) => set.size >= 3);
}

/* ================= RECORDS ================= */
const RECORD_TYPES = [
  { id: "tractions", n: "Tractions", ex: ["traction"] },
  { id: "dips", n: "Dips", ex: ["dips"] },
  { id: "pompes", n: "Pompes", ex: ["pompes"] },
];
function recordSeries(type) {
  const rt = RECORD_TYPES.find((r) => r.id === type), by = {};
  S.sessions.forEach((s) => s.items.forEach((it) => {
    if (rt.ex.includes(it.exId) && !(it.kg > 0)) it.sets.forEach((st) => { if (st.done) by[s.d] = Math.max(by[s.d] || 0, st.r); });
  }));
  S.records.forEach((r) => { if (r.type === type) by[r.d] = Math.max(by[r.d] || 0, r.v); });
  return Object.keys(by).sort().map((d) => ({ d, v: by[d] }));
}
const bestRecord = (type) => recordSeries(type).reduce((m, p) => Math.max(m, p.v), 0);

/* ================= POIDS ================= */
const sortedWeights = () => [...S.weights].sort((a, b) => (a.d < b.d ? -1 : 1));
function curKg() { const w = sortedWeights(); return w.length ? w[w.length - 1].kg : S.profile.startKg; }
function weightBefore(dateStr) { // dernière pesée à cette date ou avant
  const w = sortedWeights().filter((x) => x.d <= dateStr);
  return w.length ? w[w.length - 1] : null;
}
function weightAdvice() {
  const w = sortedWeights();
  if (!w.length) return { kind: "start", text: "Pèse-toi une fois par semaine, le matin au réveil. C'est tout ce qu'il faut pour suivre ta progression." };
  const last = w[w.length - 1];
  const sinceLast = daysBetween(last.d, today());
  const ref21 = weightBefore(addDays(last.d, -21));
  const lastBump = S.kcalBumps.length ? S.kcalBumps[S.kcalBumps.length - 1] : null;
  const bumpedRecently = lastBump && daysBetween(lastBump, today()) < 21;
  if (ref21 && last.kg - ref21.kg < 0.2 && sinceLast <= 14) {
    if (bumpedRecently) return { kind: "wait", text: "Ton poids est stable, mais tu viens d'ajouter des calories : laisse 3 semaines au corps pour répondre. Continue comme ça." };
    return { kind: "stagnation", canBump: true, text: "Ton poids n'a pas bougé depuis 3 semaines. Rien de grave, ça arrive à tout le monde : il suffit d'ajouter 200 à 300 kcal par jour, par exemple un shake de plus ou un grand verre de lait au cacao." };
  }
  const ref28 = weightBefore(addDays(last.d, -28));
  if (ref28) {
    const span = daysBetween(ref28.d, last.d), perMonth = ((last.kg - ref28.kg) / span) * 30;
    if (perMonth < 0.5) return { kind: "slow", canBump: !bumpedRecently, text: `Environ +${fmtKg(Math.max(0, perMonth))} kg sur le dernier mois. Tu avances ! Pour accélérer un peu, le plus simple : ne saute pas le petit-déj et bois ton shake tous les jours.` };
    if (perMonth <= 1.2) return { kind: "good", text: `Environ +${fmtKg(perMonth)} kg sur le dernier mois : c'est exactement le bon rythme. Ne change rien.` };
    return { kind: "fast", text: `Environ +${fmtKg(perMonth)} kg sur le dernier mois : ça monte vite, bravo. Garde le même plan, pas besoin d'ajouter.` };
  }
  return { kind: "start", text: "Rythme visé : +0,5 à 1 kg par mois. Continue de te peser une fois par semaine, le matin au réveil." };
}
function bumpKcal() {
  S.profile.kcal += 250;
  S.kcalBumps.push(today());
  saveState();
}
function measureDue() {
  if (!S.measures.length) return true;
  const last = [...S.measures].sort((a, b) => (a.d < b.d ? -1 : 1)).pop();
  return daysBetween(last.d, today()) >= 30;
}
const weighDue = () => { const w = sortedWeights(); return !w.length || daysBetween(w[w.length - 1].d, today()) >= 7; };

/* ================= REPAS ================= */
const mealById = (id) => (id === "shake" ? SHAKE : MEALS.find((m) => m.id === id));
const isHomeDay = (di) => di >= 5 || S.profile.holiday;
function eligibleMeals(slot, di) {
  const all = MEALS.filter((m) => m.slot === slot);
  if (slot !== "midi") return all;
  return isHomeDay(di) ? all.filter((m) => m.where === "maison").concat(all.filter((m) => m.where === "any")) : all.filter((m) => m.where === "any");
}
function ensurePlan(wk) {
  if (S.plans[wk]) return S.plans[wk];
  const wn = Math.round(daysBetween("2026-01-05", wk) / 7);
  const plan = {};
  for (let di = 0; di < 7; di++) {
    plan[di] = {};
    MEAL_SLOTS.forEach((sl, si) => {
      let list = eligibleMeals(sl.id, di);
      if (sl.id === "midi" && isHomeDay(di)) list = list.filter((m) => m.where === "maison");
      plan[di][sl.id] = list[(((wn * 2 + di + si) % list.length) + list.length) % list.length].id;
    });
  }
  S.plans[wk] = plan;
  // ménage : on ne garde que les plans récents
  Object.keys(S.plans).forEach((k) => { if (daysBetween(k, wk) > 21) { delete S.plans[k]; delete S.shop[k]; } });
  saveState();
  return plan;
}
function swapMeal(wk, di, slot) {
  const plan = ensurePlan(wk), list = eligibleMeals(slot, di);
  const i = list.findIndex((m) => m.id === plan[di][slot]);
  plan[di][slot] = list[(i + 1) % list.length].id;
  saveState();
}
function dayMeals(dateStr) {
  const plan = ensurePlan(weekKey(dateStr))[dayIdx(dateStr)];
  return MEAL_SLOTS.map((sl) => ({ slot: sl, meal: mealById(plan[sl.id]) }));
}
function dayTotals(dateStr) {
  const ms = dayMeals(dateStr).map((x) => x.meal).concat([SHAKE]);
  return { kcal: ms.reduce((a, m) => a + m.kcal, 0), prot: ms.reduce((a, m) => a + m.prot, 0) };
}
function dayBooster(dateStr) {
  // le plan de base est construit pour environ 3000 kcal : tout ce qui est au-dessus devient un « bonus »
  const extra = S.profile.kcal - 3000;
  if (extra < 120) return null;
  const picks = []; let left = extra, i = (dayIdx(dateStr) + 1) % BOOSTERS.length, guard = 0;
  while (left >= 120 && guard++ < 4) { const b = BOOSTERS[i % BOOSTERS.length]; picks.push(b); left -= b.kcal; i++; }
  return { extra, picks };
}
function mealTimes(dateStr) {
  const t = dayIdx(dateStr) >= 5 ? S.reminders.weekend : S.reminders.week;
  return MEAL_SLOTS.map((sl, i) => t[i]);
}
const checksOf = (d) => S.mealChecks[d] || {};
function toggleMeal(d, slotId) {
  const c = (S.mealChecks[d] = S.mealChecks[d] || {});
  if (c[slotId]) delete c[slotId]; else c[slotId] = true;
  saveState();
}
const isFullDay = (d) => MEAL_SLOTS.every((sl) => checksOf(d)[sl.id]);
const fullDaysCount = () => Object.keys(S.mealChecks).filter(isFullDay).length;
function nextMealSlot() {
  const d = today(), c = checksOf(d), times = mealTimes(d), now = new Date();
  const cur = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
  let pick = -1;
  MEAL_SLOTS.forEach((sl, i) => { if (!c[sl.id] && pick < 0 && times[i] >= shiftTime(cur, -90)) pick = i; });
  return pick;
}
function shiftTime(hm, min) {
  const [h, m] = hm.split(":").map(Number); const t = clamp(h * 60 + m + min, 0, 1439);
  return pad2(Math.floor(t / 60)) + ":" + pad2(t % 60);
}

/* ================= COURSES ================= */
function fmtQty(ing, q) {
  if (ing.u === "g") return q >= 1000 ? `${fmtKg(q / 1000)} kg` : `${Math.ceil(q / 10) * 10} g`;
  if (ing.u === "ml") return q >= 1000 ? `${fmtKg(q / 1000)} L` : `${Math.ceil(q / 10) * 10} ml`;
  const n = Math.ceil(q);
  return ing.pk ? `${n} ${ing.pk}` : `${n}`;
}
function shoppingList(wk) {
  const plan = ensurePlan(wk), tot = {};
  const add = (ing) => ing.forEach(([id, q]) => { tot[id] = (tot[id] || 0) + q; });
  for (let di = 0; di < 7; di++) {
    MEAL_SLOTS.forEach((sl) => { const m = mealById(plan[di][sl.id]); if (m) add(m.ing); });
    add(SHAKE.ing);
  }
  return RAYONS.map((r) => ({
    rayon: r,
    items: Object.keys(tot).filter((id) => ING[id].r === r).map((id) => ({ id, n: ING[id].n, qty: fmtQty(ING[id], tot[id]) }))
      .sort((a, b) => a.n.localeCompare(b.n, "fr")),
  })).filter((g) => g.items.length);
}
function shoppingText(wk) {
  const checks = S.shop[wk] || {};
  let t = `🛒 Liste de courses — semaine du ${frDate(wk)}\n`;
  shoppingList(wk).forEach((g) => {
    t += `\n${g.rayon.toUpperCase()}\n`;
    g.items.forEach((it) => { t += `${checks[it.id] ? "☑" : "☐"} ${it.n} — ${it.qty}\n`; });
  });
  return t;
}

/* ================= XP, NIVEAUX, BADGES ================= */
function xpTotal() {
  let checks = 0;
  Object.values(S.mealChecks).forEach((c) => { checks += Object.keys(c).length; });
  return S.sessions.length * 100 + checks * 5 + fullDaysCount() * 25 + S.weights.length * 15 +
    S.measures.length * 10 + S.photos.length * 20 + Object.keys(S.badges).length * 50;
}
const xpFor = (lvl) => 150 * lvl * (lvl - 1);
function levelInfo() {
  const xp = xpTotal(); let lvl = 1;
  while (xpFor(lvl + 1) <= xp) lvl++;
  const a = xpFor(lvl), b = xpFor(lvl + 1);
  return { xp, lvl, name: LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.floor((lvl - 1) / 2))], pct: Math.round(((xp - a) / (b - a)) * 100), next: b - xp };
}
function checkBadges() {
  const gain = curKg() - S.profile.startKg;
  const anySet = (exIds, min) => S.sessions.some((s) => s.items.some((it) => exIds.includes(it.exId) && it.sets.some((st) => st.done && st.r >= min)));
  const cond = {
    first: S.sessions.length >= 1,
    week3: hasFullWeek(),
    streak4: streakWeeks() >= 4,
    s10: S.sessions.length >= 10, s25: S.sessions.length >= 25, s50: S.sessions.length >= 50,
    pull15: bestRecord("tractions") >= 15, dips20: bestRecord("dips") >= 20, push30: bestRecord("pompes") >= 30,
    lsit15: anySet(["lsit"], 15),
    mu: !!S.muscleUp,
    kg1: S.weights.length > 0 && gain >= 1, kg5: S.weights.length > 0 && gain >= 5,
    goal3: S.weights.length > 0 && curKg() >= S.profile.goal3Kg - 0.5,
    goal: S.weights.length > 0 && curKg() >= S.profile.goalKg,
    meals7: fullDaysCount() >= 7,
    photo: S.photos.length >= 1,
    park: S.parks.length >= 2,
  };
  const fresh = [];
  BADGES.forEach((b) => { if (cond[b.id] && !S.badges[b.id]) { S.badges[b.id] = today(); fresh.push(b); } });
  if (fresh.length) saveState();
  return fresh;
}

/* ================= RAPPELS (.ics) ================= */
function reminderLabels() {
  const med = S.profile.med ? ` (avant ${S.profile.medName ? "ton " + S.profile.medName : "ton médicament"})` : "";
  return [`Petit-déj${med} — le plus gros possible`, "Midi — même petit, mange ou bois quelque chose", "Goûter — vrai repas", "Dîner", "Collation avant de dormir"];
}
function remindersIcs() {
  const labels = reminderLabels();
  const nextDow = (dow) => { let d = today(); while (parseYmd(d).getDay() !== dow) d = addDays(d, 1); return d.replace(/-/g, ""); };
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  let out = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//FORGE//Rappels repas//FR\r\nCALSCALE:GREGORIAN\r\n";
  const ev = (label, time, date, byday, k) => {
    out += `BEGIN:VEVENT\r\nUID:forge-${k}@forge.app\r\nDTSTAMP:${stamp}\r\nDTSTART:${date}T${time.replace(":", "")}00\r\nDURATION:PT10M\r\n` +
      `RRULE:FREQ=WEEKLY;BYDAY=${byday}\r\nSUMMARY:🍽 ${label}\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${label}\r\nTRIGGER:PT0M\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
  };
  labels.forEach((l, i) => {
    ev(l, S.reminders.week[i], nextDow(1), "MO,TU,WE,TH,FR", "w" + i);
    ev(l, S.reminders.weekend[i], nextDow(6), "SA,SU", "we" + i);
  });
  return out + "END:VCALENDAR\r\n";
}
