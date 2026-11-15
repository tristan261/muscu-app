/* FORGE V2 — moteur de règles : progression, semaine, muscle-up, poids, repas, courses
   Aucune part de hasard : mêmes données → même résultat. */
"use strict";

const KG_STEP = 1.5, KG_MAX = 9;

/* ================= MATÉRIEL ================= */
const currentPark = () => S.parks.find((p) => p.id === S.parkLast) || S.parks[0] || null;
const parkEquip = (parkId) => { const p = S.parks.find((x) => x.id === parkId); return p ? p.equip : null; }; // null = tout
function canDo(exId, equip) {
  const ex = EXERCISES[exId];
  if (!ex || !ex.needs || !equip) return true;
  return ex.needs.some((group) => group.every((e) => equip.includes(e)));
}
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

/* ================= RECORDS & MUSCLE-UP ================= */
const RECORD_TYPES = [
  { id: "tractions", n: "Tractions", ex: ["traction", "traction_pause", "traction_poitrine"] },
  { id: "dips", n: "Dips", ex: ["dips", "dips_tempo", "dips_barre"] },
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
function maxReps(exIds) {
  let m = 0;
  S.sessions.forEach((s) => s.items.forEach((it) => { if (exIds.includes(it.exId)) it.sets.forEach((st) => { if (st.done) m = Math.max(m, st.r); }); }));
  return m;
}
// Les 3 portes, dans l'ordre : chacune ne s'ouvre que si la précédente l'est
function muGates() {
  const g1 = bestRecord("tractions") >= 10 && bestRecord("dips") >= 10;
  const g2 = g1 && maxReps(["traction_explosive"]) >= 5;
  const g3 = g2 && maxReps(["mu_negative"]) >= 3;
  return [g1, g2, g3, !!S.muscleUp];
}
function muStage() { const g = muGates(); let st = 0; while (st < 4 && g[st]) st++; return st; } // 0 à 4

/* ================= PROGRESSION (double progression) ================= */
function lp(key) {
  const L = LADDERS[key];
  if (!S.prog[key]) S.prog[key] = { r: L.start, up: 0, down: 0, stag: 0, tweak: null, kg: 0, noSeed: false };
  const p = S.prog[key];
  p.r = clamp(p.r, 0, L.rungs.length - 1);
  return p;
}
const rungOf = (key) => LADDERS[key].rungs[lp(key).r];
const kgFor = (p, rung) => (rung.weighted ? p.kg || KG_STEP : 0);
const bottles = (kg) => Math.round(kg / KG_STEP);

function lastHist(key, exId, kg, exceptId) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const s = S.sessions[i]; if (s.id === exceptId) continue;
    const it = s.items.find((x) => x.lad === key && x.exId === exId && !x.origId && !x.volume && (x.kg || 0) === kg && x.sets.some((st) => st.done));
    if (it) return it;
  }
  return null;
}
// Reps de départ sur l'échelon d'origine : calées sur le niveau connu, avec 1-2 reps de réserve
function seedReps(key, rung, p) {
  const L = LADDERS[key];
  if (!L.rec || p.r !== L.start || p.noSeed) return rung.lo;
  const lvl = Math.max(S.profile.level[L.rec] || 0, bestRecord(L.rec));
  return clamp(lvl - 2, rung.lo, rung.hi);
}

/* Remplace un exercice impossible avec le matériel du parc ; adapte la fourchette si l'unité change (reps ↔ secondes). */
function substitute(base, equip) {
  let exId = base.ex, origId = null, { lo, hi } = base, unit = base.unit || EXERCISES[exId].unit || "reps";
  if (!canDo(exId, equip)) {
    const sub = findSub(exId, equip);
    if (sub) {
      origId = exId; exId = sub;
      const ex = EXERCISES[sub];
      const spec = ex.spec || (ex.unit === "s" && unit !== "s" ? { lo: 20, hi: 30, unit: "s" } : ex.unit !== "s" && unit === "s" ? { lo: 8, hi: 12, unit: "reps" } : null);
      if (spec) { lo = spec.lo; hi = spec.hi; unit = spec.unit; } else unit = ex.unit || unit;
    }
  }
  return { exId, origId, lo, hi, unit };
}
function buildLadderItem(slot, equip) {
  const key = slot.ladder, p = lp(key), rung = LADDERS[key].rungs[p.r];
  const { exId, origId, lo, hi, unit } = substitute({ ex: rung.ex, lo: rung.lo, hi: rung.hi, unit: rung.unit }, equip);
  const ex = EXERCISES[exId];
  const kg = origId ? 0 : kgFor(p, rung);
  const it = { key: slot.key || key, lad: key, exId, origId, kg, unit, lo, hi, perSide: !!ex.perSide, tweak: origId ? null : p.tweak, volume: !!slot.volume, sets: [] };
  const last = origId || slot.volume ? null : lastHist(key, exId, kg);
  const seed = seedReps(key, rung, p);
  for (let i = 0; i < slot.sets; i++) {
    let t;
    if (slot.volume) t = Math.floor((lo + hi) / 2);
    else if (last && last.sets[i] && last.sets[i].done) t = clamp(last.sets[i].r + 1, lo, hi);
    else if (last) { const d = last.sets.filter((s) => s.done).map((s) => s.r); t = clamp((d.length ? d[d.length - 1] : lo) + 1, lo, hi); }
    else t = seed;
    it.sets.push({ r: t, t, done: false });
  }
  it.last = last ? last.sets.filter((s) => s.done).map((s) => s.r) : null;
  return it;
}
function buildFixedItem(def, key, equip, maxSets) {
  const sb = substitute({ ex: def.ex || def.fixed, lo: def.lo, hi: def.hi, unit: def.unit }, equip), ex = EXERCISES[sb.exId];
  const tries = !!def.tries && !sb.origId;
  const it = { key: key || def.key, lad: null, exId: sb.exId, origId: sb.origId, kg: 0, unit: sb.unit, lo: sb.lo, hi: sb.hi, perSide: !!ex.perSide, volume: false, mu: !!def.mu, tries, sets: [] };
  const n = maxSets ? Math.min(def.sets, maxSets) : def.sets;
  for (let i = 0; i < n; i++) { const t = tries ? 0 : sb.lo; it.sets.push({ r: t, t, done: false }); }
  return it;
}
function buildMuItems(max, light, equip) {
  let items = MU_BLOCKS[Math.min(muStage(), 3)].map((d) => buildFixedItem(Object.assign({ mu: true }, d), null, equip));
  if (max) items = items.slice(0, max);
  return items.map((it) => {
    if (light && it.tries) it.sets = it.sets.slice(0, 4);
    return it;
  });
}
/* Construit une séance : type S1/S2/S3, équipement du parc, version courte (30 min) ou non */
function buildSession(type, parkId, short) {
  const equip = parkId === undefined ? (currentPark() ? currentPark().equip : null) : parkEquip(parkId);
  const items = [];
  SESSIONS[type].slots.forEach((slot) => {
    if (short && !slot.main) return;
    if (slot.mu) buildMuItems(short ? 1 : slot.max, !SESSIONS[type].heavy, equip).forEach((it) => items.push(it));
    else if (slot.ladder) items.push(buildLadderItem(short ? Object.assign({}, slot, { sets: Math.min(slot.sets, 3) }) : slot, equip));
    else if (slot.fixed) items.push(buildFixedItem(slot, slot.key, equip));
  });
  return items;
}
const restFor = (it) => ((it.mu && (it.exId === "muscle_up" || it.exId === "mu_negative" || it.exId === "mu_transition" || it.exId === "traction_explosive")) || it.kg > 0 || it.exId === "muscle_up" ? Math.max(120, S.profile.rest) : S.profile.rest);
const estMinutes = (items) => Math.round(5 + sum(items.map((it) => it.sets.length * (0.7 + restFor(it) / 60))));

const unitSuffix = (it, n) => (it.unit === "s" ? " s" : it.perSide ? " par jambe" : "");
function targetsLabel(it) {
  const t = it.sets.map((s) => s.t != null ? s.t : s.r), n = t.length;
  if (it.tries) return `${n} essais`;
  if (t.every((x) => x === t[0])) return `${n} × ${t[0]}${unitSuffix(it)}`;
  return `${n} séries : ${t.join(" · ")}${unitSuffix(it)}`;
}
function rangeLabel(it) { return it.lo === it.hi ? `${it.hi}` : `${it.lo}-${it.hi}`; }
const tweakText = (tw) => (tw === "pause" ? "Avec 2 s de pause en bas" : tw === "tempo" ? "Descente lente en 3 s" : "");

/* Évalue une séance terminée (déjà ajoutée à S.sessions) et applique les règles. Retourne les notes « La prochaine fois ». */
function evaluateSession(sess) {
  const notes = [];
  sess.items.forEach((it) => {
    const name = EXERCISES[it.exId].n;
    if (it.mu) { notes.push(muNote(it, name)); return; }
    if (!it.lad || it.origId || it.volume) {
      if (it.origId) notes.push({ exId: it.exId, kind: "same", text: `${name} : exercice adapté au parc, la progression n'est pas modifiée.` });
      return;
    }
    const vals = it.sets.filter((s) => s.done).map((s) => s.r);
    if (!vals.length) return;
    const key = it.lad, L = LADDERS[key], p = lp(key), rung = L.rungs[p.r];
    if (rung.ex !== it.exId) return;
    const total = sum(vals), prev = lastHist(key, it.exId, it.kg || 0, sess.id);
    const prevTotal = prev ? sum(prev.sets.filter((s) => s.done).map((s) => s.r)) : -1;
    const top = vals.length >= it.sets.length && it.sets.every((s) => s.done && s.r >= it.hi);
    const miss = total / vals.length < it.lo;
    p.up = top ? p.up + 1 : 0;
    p.down = miss ? p.down + 1 : 0;
    p.stag = top || miss || total > prevTotal ? 0 : p.stag + 1;
    let kind = "same", text;
    if (p.up >= 2) {
      if (rung.weighted && p.kg < KG_MAX) {
        p.kg = Math.min(KG_MAX, (p.kg || KG_STEP) + KG_STEP); p.up = p.down = p.stag = 0; kind = "up";
        text = `On ajoute du poids : sac à dos avec ${bottles(p.kg)} bouteille${bottles(p.kg) > 1 ? "s" : ""} d'eau de 1,5 L (${fmtKg(p.kg)} kg).`;
      } else if (p.r < L.rungs.length - 1) {
        p.r++; p.up = p.down = p.stag = 0; p.tweak = null; p.noSeed = true;
        if (L.rungs[p.r].weighted) p.kg = KG_STEP;
        kind = "up"; text = `Variante suivante : ${EXERCISES[L.rungs[p.r].ex].n}, on repart au bas de la fourchette.`;
      } else { p.up = 0; text = "Tu es tout en haut de cette échelle : continue à gagner des reps proprement."; }
    } else if (p.down >= 2 && p.r > 0) {
      p.r--; p.up = p.down = p.stag = 0; p.tweak = null; p.noSeed = true; if (!L.rungs[p.r].weighted) p.kg = 0;
      kind = "down"; text = `On revient sur ${EXERCISES[L.rungs[p.r].ex].n} le temps de consolider. C'est normal, tu y retourneras vite.`;
    } else if (p.stag >= 3) {
      p.tweak = p.tweak === "pause" ? "tempo" : p.tweak === "tempo" ? null : "pause"; p.stag = 0; kind = "tweak";
      text = p.tweak ? `On change un détail pour relancer la progression : ${tweakText(p.tweak).toLowerCase()}.` : "On retire la consigne de tempo pour varier.";
    }
    const next = buildLadderItem({ ladder: key, sets: it.sets.length, key: it.key }, null);
    notes.push({ exId: next.exId, kind, text: `${EXERCISES[next.exId].n} : ${targetsLabel(next)}${next.kg ? ` (+${fmtKg(next.kg)} kg)` : ""}.${text ? " " + text : ""}` });
  });
  return notes;
}
function muNote(it, name) {
  const st = muStage(), g = muGates();
  if (it.origId) return { exId: it.exId, kind: "same", text: `${name} : exercice adapté au matériel du parc, la piste muscle-up n'est pas modifiée.` };
  if (it.tries) return { exId: it.exId, kind: "same", text: S.muscleUp ? "Muscle-up validé : garde 4 à 6 essais frais en début de séance pour l'entretenir." : "Essais de muscle-up : frais, en début de séance, 5 à 8 essais seuls. On arrête dès que la technique se dégrade." };
  if (it.exId === "traction_explosive") return { exId: it.exId, kind: "same", text: g[1] ? "Tractions explosives : porte 2 passée." : st >= 1 ? "Tractions explosives : vise 5 reps où la poitrine touche la barre (porte 2)." : "Tractions explosives : le plus haut possible, 3 reps rapides par série (porte 1 d'abord : 10 tractions + 10 dips)." };
  if (it.exId === "mu_negative") return { exId: it.exId, kind: "same", text: g[2] ? "Négatives de muscle-up : porte 3 passée, place aux essais !" : "Négatives de muscle-up : vise 3 négatives contrôlées sur 5 secondes (porte 3)." };
  return { exId: it.exId, kind: "same", text: `${name} : même objectif la prochaine fois.` };
}

/* ================= SEMAINE D'ENTRAÎNEMENT ================= */
const isHeavy = (type) => !!(SESSIONS[type] && SESSIONS[type].heavy);
function permutations(a) { if (a.length <= 1) return [a]; return a.flatMap((x, i) => permutations([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])); }
/* Répartit S1/S2/S3 sur des jours triés. fixed[i] = type déjà imposé (séance déjà faite) ou null.
   Règle : jamais deux séances lourdes sur deux jours consécutifs (S3 = séance légère). */
function assignTypes(dates, fixed) {
  const used = fixed.filter(Boolean), free = ["S1", "S2", "S3"].filter((t) => !used.includes(t));
  const heavyBefore = S.sessions.some((s) => s.d === addDays(dates[0], -1) && isHeavy(s.type));
  let best = null, bs = Infinity;
  permutations(free).forEach((perm) => {
    let k = 0; const types = fixed.map((f) => f || perm[k++]);
    let viol = heavyBefore && isHeavy(types[0]) ? 1 : 0;
    for (let i = 1; i < dates.length; i++) if (daysBetween(dates[i - 1], dates[i]) === 1 && isHeavy(types[i - 1]) && isHeavy(types[i])) viol++;
    let inv = 0; for (let i = 0; i < types.length; i++) for (let j = i + 1; j < types.length; j++) if (types[i] > types[j]) inv++;
    const score = viol * 100 + inv;
    if (score < bs) { bs = score; best = types; }
  });
  return best;
}
function consecutiveNote(slots) {
  const sorted = [...slots].sort((a, b) => (a.d < b.d ? -1 : 1));
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1].d, sorted[i].d) === 1) {
      const light = [sorted[i - 1], sorted[i]].find((s) => s.type === "S3") || sorted[i];
      return `Tes deux jours se suivent : la séance du ${dayName(light.d)} est la séance technique, plus légère.`;
    }
  }
  return "";
}
const weekPlan = (wk) => S.weeks[wk] || null;
function generateWeek(wk, dates) {
  dates = [...new Set(dates)].sort();
  if (dates.length !== 3) throw new Error("Choisis exactement 3 jours.");
  if (dates.some((d) => weekKey(d) !== wk)) throw new Error("Les jours doivent être dans la même semaine.");
  const types = assignTypes(dates, [null, null, null]);
  const slots = dates.map((d, i) => ({ d, type: types[i], done: null }));
  S.weeks[wk] = { slots, msg: consecutiveNote(slots), at: today() };
  generateMeals(wk);
  S.shop[wk] = {};
  Object.keys(S.weeks).forEach((k) => { if (daysBetween(k, wk) > 56) delete S.weeks[k]; });
  saveState();
  return S.weeks[wk];
}
/* Déplace une séance dans la semaine W (sans enregistrer) : réaffecte les types des séances non faites. */
function applyMove(W, idx, newDate) {
  const sl = W.slots[idx];
  if (!sl || sl.done || weekKey(newDate) !== weekKey(sl.d) || W.slots.some((s, i) => i !== idx && s.d === newDate)) return false;
  sl.d = newDate;
  const sorted = [...W.slots].sort((a, b) => (a.d < b.d ? -1 : 1));
  const types = assignTypes(sorted.map((s) => s.d), sorted.map((s) => (s.done ? s.type : null)));
  sorted.forEach((s, i) => { if (!s.done) s.type = types[i]; });
  W.slots = sorted; W.msg = consecutiveNote(W.slots);
  return true;
}
function moveSlot(wk, idx, newDate) {
  const W = S.weeks[wk]; if (!W || !applyMove(W, idx, newDate)) return false;
  saveState(); return true;
}
/* « Faire une séance aujourd'hui quand même » (jour non prévu).
   On avance la séance en retard, sinon la plus proche ; les types des séances restantes sont réaffectés
   pour garder la règle des jours (pas 2 séances lourdes de suite), ce qui choisit la séance la plus logique. */
function extraSession(dry) {
  const wk = weekKey(today()), W = S.weeks[wk];
  if (!W) return { ok: false, reason: "noplan" };
  if (W.slots.some((s) => s.d === today())) return { ok: false, reason: "planned" };
  const undone = W.slots.map((s, i) => ({ s, i })).filter((x) => !x.s.done).sort((a, b) => (a.s.d < b.s.d ? -1 : 1));
  if (!undone.length) return { ok: false, reason: "full" };
  const pick = undone.find((x) => x.s.d < today()) || undone[0];
  const W2 = JSON.parse(JSON.stringify(W));
  if (!applyMove(W2, pick.i, today())) return { ok: false, reason: "impossible" };
  const idx = W2.slots.findIndex((s) => s.d === today()), note = consecutiveNote(W2.slots);
  W2.msg = "Tu as ajouté une séance aujourd'hui : le reste de ta semaine est réajusté." + (note ? " " + note : "");
  const res = { ok: true, wk, idx, type: W2.slots[idx].type, slots: W2.slots.map((s) => ({ d: s.d, type: s.type, done: !!s.done })) };
  if (!dry) { S.weeks[wk] = W2; saveState(); }
  return res;
}
/* Les 7 jours d'une semaine avec leur séance éventuelle (bande « Ma semaine ») */
function weekDays(wk) {
  const W = S.weeks[wk];
  return Array.from({ length: 7 }, (_, di) => {
    const d = addDays(wk, di), idx = W ? W.slots.findIndex((s) => s.d === d) : -1;
    return { d, di, idx, slot: idx >= 0 ? W.slots[idx] : null };
  });
}
function nextSession() { // prochaine séance non faite après aujourd'hui (cette semaine ou la suivante)
  const cur = weekKey(today()), c = [];
  [cur, addDays(cur, 7)].forEach((wk) => { const W = S.weeks[wk]; if (W) W.slots.forEach((s, i) => { if (!s.done && s.d > today()) c.push({ wk, i, d: s.d, type: s.type }); }); });
  c.sort((a, b) => (a.d < b.d ? -1 : 1));
  return c[0] || null;
}
function overdueSession() { // séance de cette semaine prévue avant aujourd'hui et pas faite
  const wk = weekKey(today()), W = S.weeks[wk]; if (!W) return null;
  const i = W.slots.findIndex((s) => !s.done && s.d < today());
  return i >= 0 ? { wk, i, d: W.slots[i].d, type: W.slots[i].type } : null;
}
function todayState() {
  const wk = weekKey(today()), W = S.weeks[wk];
  if (!W) return { status: "noplan", wk };
  const idx = W.slots.findIndex((s) => s.d === today());
  if (idx < 0) return { status: "rest", wk, W };
  const sl = W.slots[idx];
  return { status: sl.done ? "done" : "train", wk, W, slot: sl, idx, n: idx + 1 };
}
const sessionsInWeek = (wk) => S.sessions.filter((s) => weekKey(s.d) === wk);
const distinctDaysInWeek = (wk) => new Set(sessionsInWeek(wk).map((s) => s.d)).size;
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
/* Jours proposés pour la semaine suivante quand la semaine a été chargée (moins de 2 séances) : jours bien espacés */
const EASY_DAYS = [0, 2, 5]; // lundi, mercredi, samedi

/* ================= POIDS ================= */
const sortedWeights = () => [...S.weights].sort((a, b) => (a.d < b.d ? -1 : 1));
function curKg() { const w = sortedWeights(); return w.length ? w[w.length - 1].kg : S.profile.startKg; }
const startKg = () => (S.profile.startKg != null ? S.profile.startKg : (sortedWeights()[0] || { kg: null }).kg);
const weighDue = () => { const w = sortedWeights(); return !w.length || daysBetween(w[w.length - 1].d, today()) >= 6; };
function windowMean(from, to) { // pesées dont l'âge (en jours) est entre from et to : moyenne du poids et de l'âge
  const ws = S.weights.filter((x) => { const a = daysBetween(x.d, today()); return a >= from && a <= to; });
  return ws.length ? { kg: sum(ws.map((x) => x.kg)) / ws.length, age: sum(ws.map((x) => daysBetween(x.d, today()))) / ws.length, n: ws.length } : null;
}
const lastBumpAge = () => (S.kcalBumps.length ? daysBetween(S.kcalBumps[S.kcalBumps.length - 1], today()) : Infinity);
/* Rythme mensuel calculé sur des MOYENNES de pesées : les 10 derniers jours contre les jours 18 à 27. */
function weightAdvice() {
  if (!S.weights.length) return { kind: "start", text: "Pèse-toi le dimanche matin au réveil. Une fois par semaine suffit." };
  const R = windowMean(0, 9), B = windowMean(18, 27);
  if (!R) return { kind: "weigh", text: "Pèse-toi ce matin au réveil pour faire le point de la semaine." };
  if (!B || B.age - R.age < 10) return { kind: "start", text: "Continue à te peser chaque dimanche : après 3 semaines, je pourrai calculer ton rythme." };
  const perMonth = ((R.kg - B.kg) / (B.age - R.age)) * 30;
  const r = { perMonth };
  if (perMonth < 0.5) {
    if (lastBumpAge() < 21) return Object.assign(r, { kind: "wait", text: `Je viens d'augmenter tes portions (${S.profile.kcal} kcal par jour). Laisse 3 semaines au corps pour répondre : continue comme ça.` });
    return Object.assign(r, { kind: "low", text: "Ton poids avance doucement. Rien de grave : j'ajoute environ 250 kcal par jour à tes repas (un shake ou une collation en plus)." });
  }
  if (perMonth <= 1.5) return Object.assign(r, { kind: "good", text: "C'est le bon rythme, continue." });
  if (perMonth <= 2) return Object.assign(r, { kind: "good", text: "C'est un peu au-dessus du rythme visé, mais bien. Continue comme ça." });
  return Object.assign(r, { kind: "fast", text: "Ça monte vite, bravo. Garde le même plan." });
}
function bumpKcal() {
  S.profile.kcal = Math.max(S.profile.kcalBase, S.profile.kcal) + KCAL_STEP;
  S.kcalBumps.push(today());
  Object.keys(S.plans).forEach((wk) => { if (wk >= weekKey(today())) updateBoosts(wk); });
  saveState();
}
/* À appeler à chaque pesée : applique la règle et retourne la consigne. Jamais de baisse des calories. */
function applyWeightRule() {
  let a = weightAdvice();
  if (a.kind === "low") { bumpKcal(); a = Object.assign({}, a, { bumped: true }); }
  return a;
}
const lastMeasure = () => [...S.measures].sort((a, b) => (a.d < b.d ? -1 : 1)).pop();
const measureDue = () => { const m = lastMeasure(); return !m || daysBetween(m.d, today()) >= 30; };
const photoDue = () => S.sessions.length > 0 && !S.photos.some((p) => p.ym === today().slice(0, 7));

/* ================= REPAS ================= */
const mealById = (id) => (id === "shake" ? SHAKE : MEALS.find((m) => m.id === id));
const eatenName = (id) => (id === "other" ? "Autre chose" : (mealById(id) || { n: "" }).n);
function eligibleMeals(slot, di) {
  let list = MEALS.filter((m) => m.slot === slot && S.likes[m.id] !== -1);
  if (slot === "midi" && di <= 4) list = list.filter((m) => m.where === "any"); // lycée : ni frigo ni micro-ondes
  return list.length ? list : MEALS.filter((m) => m.slot === slot);
}
function pickMeal(slot, di, cnt, prevWeekId, yesterdayId, usedLastWeek, wn, exclude) {
  let list = eligibleMeals(slot, di).filter((m) => !exclude.includes(m.id));
  if (!list.length) list = eligibleMeals(slot, di);
  const ok = list.filter((m) => (cnt[m.id] || 0) < 2);
  if (ok.length) list = ok;
  let best = null, bs = Infinity;
  list.forEach((m, i) => {
    const s = (cnt[m.id] || 0) * 10 + (prevWeekId === m.id ? 8 : 0) + (yesterdayId === m.id ? 6 : 0) + (usedLastWeek.has(m.id) ? 3 : 0) +
      (S.likes[m.id] === 1 ? -4 : 0) + ((i + wn * 3 + di * 2) % list.length) / list.length;
    if (s < bs) { bs = s; best = m; }
  });
  return best;
}
function boostsFor(di) {
  const n = clamp(Math.round((S.profile.kcal - KCAL_BASE_PLAN) / KCAL_STEP), 0, 3);
  return Array.from({ length: n }, (_, k) => (di + k) % BOOSTERS.length);
}
function updateBoosts(wk) { const P = S.plans[wk]; if (P) for (let di = 0; di < 7; di++) P.days[di].boost = boostsFor(di); }
const planSlots = ["matin", "midi", "gouter", "soir", "coll"];
function generateMeals(wk) {
  const prev = S.plans[addDays(wk, -7)], wn = Math.round(daysBetween("2026-01-05", wk) / 7);
  const usedLastWeek = new Set(); if (prev) for (let di = 0; di < 7; di++) planSlots.forEach((sl) => usedLastWeek.add(prev.days[di][sl]));
  const cnt = {}, days = {};
  for (let di = 0; di < 7; di++) {
    days[di] = {};
    planSlots.forEach((sl) => {
      const m = pickMeal(sl, di, cnt, prev ? prev.days[di][sl] : null, di ? days[di - 1][sl] : null, usedLastWeek, wn, []);
      days[di][sl] = m.id; cnt[m.id] = (cnt[m.id] || 0) + 1;
    });
    days[di].boost = boostsFor(di);
  }
  S.plans[wk] = { days, at: today() };
  Object.keys(S.plans).forEach((k) => { if (daysBetween(k, wk) > 28) { delete S.plans[k]; delete S.shop[k]; } });
  return S.plans[wk];
}
function ensurePlan(wk) { if (!S.plans[wk]) { generateMeals(wk); saveState(); } return S.plans[wk]; }
const planCount = (wk) => { const c = {}; const P = S.plans[wk]; for (let di = 0; di < 7; di++) planSlots.forEach((sl) => { c[P.days[di][sl]] = (c[P.days[di][sl]] || 0) + 1; }); return c; };
function replaceMeal(wk, di, slot, exclude) {
  const P = ensurePlan(wk), cnt = planCount(wk), cur = P.days[di][slot];
  cnt[cur]--;
  const wn = Math.round(daysBetween("2026-01-05", wk) / 7);
  const m = pickMeal(slot, di, cnt, null, null, new Set(), wn + 1, (exclude || []).concat(cur));
  P.days[di][slot] = m.id; saveState(); return m;
}
const swapMeal = (wk, di, slot) => replaceMeal(wk, di, slot, []);
function setLike(id, v) {
  S.likes[id] = S.likes[id] === v ? 0 : v;
  if (S.likes[id] === -1) { // « Plus jamais » : disparaît des plans en cours et à venir
    Object.keys(S.plans).forEach((wk) => {
      if (wk < weekKey(today())) return;
      for (let di = 0; di < 7; di++) planSlots.forEach((sl) => { if (S.plans[wk].days[di][sl] === id) replaceMeal(wk, di, sl, [id]); });
    });
  }
  saveState();
}
function alternatives(wk, di, slot, n = 2) {
  const P = ensurePlan(wk), cur = P.days[di][slot], cnt = planCount(wk);
  return eligibleMeals(slot, di).filter((m) => m.id !== cur)
    .map((m, i) => ({ m, s: (cnt[m.id] || 0) * 3 - (S.likes[m.id] === 1 ? 4 : 0) + ((i * 7 + di) % 5) / 10 }))
    .sort((a, b) => a.s - b.s).slice(0, n).map((x) => x.m);
}
function dayMeals(dateStr) {
  const P = ensurePlan(weekKey(dateStr)).days[dayIdx(dateStr)];
  return MEAL_SLOTS.map((sl) => ({ slot: sl, meal: mealById(P[sl.id]) }));
}
const dayColl = (dateStr) => mealById(ensurePlan(weekKey(dateStr)).days[dayIdx(dateStr)].coll);
const dayBoosts = (dateStr) => ensurePlan(weekKey(dateStr)).days[dayIdx(dateStr)].boost.map((i) => BOOSTERS[i]);
function dayTotals(dateStr) {
  const ms = dayMeals(dateStr).map((x) => x.meal).concat([dayColl(dateStr), SHAKE], dayBoosts(dateStr));
  return { kcal: sum(ms.map((m) => m.kcal)), prot: sum(ms.map((m) => m.prot)) };
}
const checksOf = (d) => S.mealChecks[d] || {};
function setEaten(d, slot, mealId) { // mealId : id de repas, "other", ou null pour décocher
  const c = (S.mealChecks[d] = S.mealChecks[d] || {}), e = (S.eaten = S.eaten || {}), ed = (e[d] = e[d] || {});
  if (mealId) { c[slot] = true; ed[slot] = mealId; } else { delete c[slot]; delete ed[slot]; }
  saveState();
}
function toggleMeal(d, slot) {
  if (checksOf(d)[slot]) setEaten(d, slot, null);
  else { const m = dayMeals(d).find((x) => x.slot.id === slot); setEaten(d, slot, m ? m.meal.id : "other"); }
}
const mainChecks = (d) => MEAL_SLOTS.filter((sl) => checksOf(d)[sl.id]).length;
const isFullDay = (d) => mainChecks(d) === MEAL_SLOTS.length;
const fullDaysCount = () => Object.keys(S.mealChecks).filter(isFullDay).length;
const weekMealChecks = (wk) => sum(Array.from({ length: 7 }, (_, i) => mainChecks(addDays(wk, i))));
function mealTimes(dateStr) {
  const t = dayIdx(dateStr) >= 5 ? S.reminders.weekend : S.reminders.week;
  return [t[0], t[1], t[2], t[3]];
}
function currentSlotIdx(nowHM) { // moment de la journée : premier repas non coché dont l'heure n'est pas dépassée de plus de 90 min
  const d = today(), c = checksOf(d), times = mealTimes(d);
  const cut = (hm) => { const [h, m] = hm.split(":").map(Number); const t = clamp(h * 60 + m - 90, 0, 1439); return pad2(Math.floor(t / 60)) + ":" + pad2(t % 60); };
  const idx = MEAL_SLOTS.findIndex((sl, i) => !c[sl.id] && times[i] >= cut(nowHM));
  return idx < 0 ? MEAL_SLOTS.length - 1 : idx;
}

/* ================= COURSES ================= */
function fmtQty(ing, q) {
  if (ing.u === "g") return q >= 1000 ? `${fmtKg(q / 1000)} kg` : `${Math.ceil(q / 10) * 10} g`;
  if (ing.u === "ml") return q >= 1000 ? `${fmtKg(q / 1000)} L` : `${Math.ceil(q / 10) * 10} ml`;
  const n = Math.ceil(q - 1e-9);
  return ing.pk ? `${n} ${ing.pk}` : `${n}`;
}
function shoppingList(wk) {
  const P = ensurePlan(wk), tot = {};
  const add = (ing) => ing.forEach(([id, q]) => { tot[id] = (tot[id] || 0) + q; });
  for (let di = 0; di < 7; di++) {
    planSlots.forEach((sl) => add(mealById(P.days[di][sl]).ing));
    add(SHAKE.ing);
    P.days[di].boost.forEach((i) => add(BOOSTERS[i].ing));
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

/* ================= BADGES ================= */
function checkBadges() {
  const gain = S.weights.length && startKg() != null ? curKg() - startKg() : 0, g = muGates();
  const cond = {
    first: S.sessions.length >= 1, week3: hasFullWeek(), streak4: streakWeeks() >= 4,
    s10: S.sessions.length >= 10, s25: S.sessions.length >= 25, s50: S.sessions.length >= 50,
    g1: g[0], g2: g[1], g3: g[2], mu: g[3],
    pull15: bestRecord("tractions") >= 15, dips20: bestRecord("dips") >= 20, push30: bestRecord("pompes") >= 30,
    kg1: gain >= 1, kg5: gain >= 5,
    goal3: S.weights.length > 0 && curKg() >= S.profile.goal3Kg - 0.5, goal: S.weights.length > 0 && curKg() >= S.profile.goalKg,
    meals7: fullDaysCount() >= 7, photo: S.photos.length >= 1,
  };
  const fresh = [];
  BADGES.forEach((b) => { if (cond[b.id] && !S.badges[b.id]) { S.badges[b.id] = today(); fresh.push(b); } });
  if (fresh.length) saveState();
  return fresh;
}

/* ================= RAPPELS (.ics) ================= */
function reminderLabels() {
  const med = S.profile.med ? ` (avant ${S.profile.medName ? "ton " + S.profile.medName : "ton médicament"})` : "";
  return [`Matin${med} — le plus gros repas possible`, "Midi — même petit, mange ou bois quelque chose", "Goûter — vrai repas", "Soir — gros dîner", "Collation avant de dormir"];
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
