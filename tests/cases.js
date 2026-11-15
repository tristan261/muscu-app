const results = []; let failed = 0;
const test = (name, fn) => { try { fn(); results.push("  ok   " + name); } catch (e) { failed++; results.push("  FAIL " + name + "\n       " + (e.message || e).split("\\n")[0]); } };
const fresh = () => { S = defaultState(); S.parks = [{ id: "p1", name: "Parc", equip: ["barre","paralleles","basse","espalier","banc","monkey"], photo: null }]; S.parkLast = "p1"; TODAY_OVERRIDE = "2026-11-18"; };
// Simule une séance : f(item, setIndex) donne les reps faites
let seq = 0;
function doSession(type, d, f, opt) {
  const items = buildSession(type, undefined, opt && opt.short);
  items.forEach((it) => it.sets.forEach((s, i) => { s.r = f(it, i); s.done = true; }));
  const sess = { id: "t" + (seq++), d, type, startedAt: 0, endedAt: 1, items: items.map((it) => ({ key: it.key, lad: it.lad, exId: it.exId, origId: it.origId, kg: it.kg, unit: it.unit, lo: it.lo, hi: it.hi, mu: it.mu, volume: it.volume, sets: it.sets.map((s) => ({ r: s.r, t: s.t, done: s.done })) })) };
  S.sessions.push(sess);
  return { sess, notes: evaluateSession(sess), items };
}
const item = (items, lad) => items.find((i) => i.lad === lad);
const top = (it) => it.hi, bottom = (it) => it.lo;

/* ---------- DOUBLE PROGRESSION ---------- */
test("séance 1 : le bloc muscle-up passe en premier, puis tractions, rowing, supination, gainage", () => {
  fresh(); const it = buildSession("S1");
  assert.deepStrictEqual(it.map((x) => x.exId), ["traction_explosive", "suspension", "traction", "rowing_australien", "traction_supi", "releve_genoux"]);
});
test("séance 2 : dips, pompes, squats, fentes, gainage ; séance 3 : technique, explosifs, L-sit, dips, tractions, mobilité", () => {
  fresh();
  assert.deepStrictEqual(buildSession("S2").map((x) => x.lad), ["dips", "push", "legs", "lunge", "core"]);
  const s3 = buildSession("S3").map((x) => x.exId);
  assert.deepStrictEqual(s3, ["traction_explosive", "suspension", "pompes_explosives", "lsit_groupe", "dips", "traction", "mobilite_epaules"]);
});
test("l'objectif de départ laisse 1-2 reps de réserve (niveau 8 tractions → 6)", () => {
  fresh(); const t = item(buildSession("S1"), "pullV");
  assert.strictEqual(t.sets[0].t, 6); assert(t.sets.every((s) => s.t <= t.hi));
});
test("à chaque séance l'objectif = +1 rep par série par rapport à la dernière fois", () => {
  fresh();
  doSession("S1", "2026-11-04", (it) => (it.lad === "pullV" ? 6 : it.lo));
  const t = item(buildSession("S1"), "pullV");
  assert.deepStrictEqual(t.sets.map((s) => s.t), [7, 7, 7]);
  doSession("S1", "2026-11-11", (it, i) => (it.lad === "pullV" ? 7 + (i === 0 ? 0 : 0) : it.lo));
  assert.deepStrictEqual(item(buildSession("S1"), "pullV").sets.map((s) => s.t), [8, 8, 8]);
});
test("l'objectif ne dépasse jamais le haut de la fourchette", () => {
  fresh();
  doSession("S1", "2026-11-04", (it) => (it.lad === "pullV" ? it.hi : it.lo));
  const t = item(buildSession("S1"), "pullV"); assert(t.sets.every((s) => s.t === t.hi));
});
test("haut de fourchette à toutes les séries, 2 séances de suite → variante suivante, au bas de la fourchette", () => {
  fresh();
  const a = doSession("S1", "2026-11-04", (it) => (it.lad ? it.hi : it.lo));
  assert.strictEqual(lp("pullV").r, 1, "une seule séance ne suffit pas");
  const b = doSession("S1", "2026-11-11", (it) => (it.lad ? it.hi : it.lo));
  assert.strictEqual(lp("pullV").r, 2); assert.strictEqual(LADDERS.pullV.rungs[2].ex, "traction_pause");
  const next = item(buildSession("S1"), "pullV");
  assert.strictEqual(next.exId, "traction_pause"); assert(next.sets.every((s) => s.t === next.lo));
  assert(b.notes.some((n) => /Variante suivante/.test(n.text)));
});
test("une séance réussie puis une séance moyenne ne fait PAS monter (il faut 2 de suite)", () => {
  fresh();
  doSession("S1", "2026-11-04", (it) => (it.lad ? it.hi : it.lo));
  doSession("S1", "2026-11-11", (it) => (it.lad ? it.hi - 1 : it.lo));
  assert.strictEqual(lp("pullV").r, 1);
  doSession("S1", "2026-11-18", (it) => (it.lad ? it.hi : it.lo));
  assert.strictEqual(lp("pullV").r, 1, "le compteur est reparti à 1");
});
test("bas de fourchette raté 2 séances de suite → redescend d'un cran, sans message culpabilisant", () => {
  fresh(); lp("pullV").r = 3; // tractions poitrine à la barre
  doSession("S1", "2026-11-04", (it) => (it.lad === "pullV" ? it.lo - 2 : it.lo));
  assert.strictEqual(lp("pullV").r, 3);
  const r = doSession("S1", "2026-11-11", (it) => (it.lad === "pullV" ? it.lo - 2 : it.lo));
  assert.strictEqual(lp("pullV").r, 2);
  const msg = r.notes.map((n) => n.text).join(" ");
  assert(/On revient sur Tractions avec pause/.test(msg));
  assert(!/échec|nul|raté|honte|décevant/i.test(msg));
});
test("au premier échelon, rater le bas de la fourchette ne fait pas descendre sous l'échelle", () => {
  fresh(); lp("pullV").r = 0;
  doSession("S1", "2026-11-04", (it) => 1); doSession("S1", "2026-11-11", (it) => 1);
  assert.strictEqual(lp("pullV").r, 0);
});
test("stagnation 3 séances de suite → pause (puis tempo) sans changer d'échelon", () => {
  fresh();
  const same = (it) => (it.lad === "pullV" ? 7 : it.lo);
  doSession("S1", "2026-11-04", same); doSession("S1", "2026-11-11", same);
  assert.strictEqual(lp("pullV").tweak, null);
  const r = doSession("S1", "2026-11-18", same); // 3e séance sans progrès… la 1re sert de référence
  doSession("S1", "2026-11-25", same);
  assert.strictEqual(lp("pullV").tweak, "pause"); assert.strictEqual(lp("pullV").r, 1);
  assert.strictEqual(item(buildSession("S1"), "pullV").tweak, "pause");
  ["2026-12-02", "2026-12-09", "2026-12-16"].forEach((d) => doSession("S1", d, same));
  assert.strictEqual(lp("pullV").tweak, "tempo");
});
test("échelon lesté : sac à dos +1,5 kg par montée, maximum 9 kg", () => {
  fresh(); const p = lp("pullV"); p.r = 4; p.kg = KG_STEP;
  const hi = (it) => (it.lad ? it.hi : it.lo);
  assert.strictEqual(item(buildSession("S1"), "pullV").kg, 1.5);
  for (let w = 0; w < 30; w++) doSession("S1", addDays("2026-01-05", w * 7), hi);
  assert.strictEqual(lp("pullV").kg, KG_MAX); assert.strictEqual(item(buildSession("S1"), "pullV").kg, 9);
});
test("jamais de série « jusqu'à l'échec » : toutes les cibles restent dans la fourchette", () => {
  fresh();
  ["S1", "S2", "S3"].forEach((t) => buildSession(t).forEach((it) => { if (!it.tries) it.sets.forEach((s) => assert(s.t >= Math.min(it.lo, it.hi) && s.t <= it.hi, it.exId)); }));
});
test("parc sans barre : l'exercice est remplacé, sans toucher à la progression", () => {
  fresh(); S.parks[0].equip = ["paralleles", "banc"];
  const t = item(buildSession("S1"), "pullV");
  assert.strictEqual(t.origId, "traction"); assert(canDo(t.exId, S.parks[0].equip));
  doSession("S1", "2026-11-04", (it) => (it.lad ? it.hi : it.lo)); doSession("S1", "2026-11-11", (it) => (it.lad ? it.hi : it.lo));
  assert.strictEqual(lp("pullV").r, 1);
  ["S1","S2","S3"].forEach((ty) => buildSession(ty).forEach((it) => assert(canDo(it.exId, S.parks[0].equip), it.exId)));
});
test("version 30 min : exercices principaux seulement", () => {
  fresh();
  ["S1","S2","S3"].forEach((t) => { const f = buildSession(t), s = buildSession(t, undefined, true); assert(s.length < f.length && s.length >= 3, t); assert(estMinutes(s) < estMinutes(f)); });
  assert(estMinutes(buildSession("S1", undefined, true)) <= 35);
});
test("chrono de repos : 90 s par défaut, 2 min pour le muscle-up et le lesté", () => {
  fresh(); const s1 = buildSession("S1");
  assert.strictEqual(restFor(s1.find((i) => i.lad === "pullH")), 90);
  assert.strictEqual(restFor(s1[0]), 120);
  S.prog.pullV = { r: 4, up: 0, down: 0, stag: 0, tweak: null, kg: 1.5 };
  assert.strictEqual(restFor(item(buildSession("S1"), "pullV")), 120);
});

/* ---------- PISTE MUSCLE-UP ---------- */
test("porte 0 : explosives + suspension ; porte 1 passée (10 tractions + 10 dips) : explosives 5×3-5", () => {
  fresh();
  assert.strictEqual(muStage(), 0);
  assert.deepStrictEqual(buildSession("S1").slice(0, 2).map((x) => x.exId), ["traction_explosive", "suspension"]);
  S.records.push({ d: "2026-11-01", type: "tractions", v: 10 });
  assert.strictEqual(muStage(), 0, "il faut aussi les dips");
  S.records.push({ d: "2026-11-01", type: "dips", v: 10 });
  assert.strictEqual(muStage(), 1);
  const e = buildSession("S1")[0]; assert.strictEqual(e.sets.length, 5); assert.strictEqual(e.hi, 5);
});
test("porte 2 (5 tractions explosives poitrine à la barre) → négatives, transition, dips à la barre droite", () => {
  fresh(); S.records.push({ d: "2026-11-01", type: "tractions", v: 10 }, { d: "2026-11-01", type: "dips", v: 12 });
  doSession("S1", "2026-11-04", (it) => (it.exId === "traction_explosive" ? 5 : it.lo));
  assert.strictEqual(muStage(), 2);
  assert.deepStrictEqual(buildSession("S1").slice(0, 3).map((x) => x.exId), ["mu_negative", "mu_transition", "dips_barre"]);
});
test("porte 3 (3 négatives contrôlées) → essais de muscle-up en début de séance, puis validation", () => {
  fresh(); S.records.push({ d: "2026-11-01", type: "tractions", v: 10 }, { d: "2026-11-01", type: "dips", v: 12 });
  doSession("S1", "2026-11-04", (it) => (it.exId === "traction_explosive" ? 5 : it.lo));
  doSession("S1", "2026-11-11", (it) => (it.exId === "mu_negative" ? 3 : it.lo));
  assert.strictEqual(muStage(), 3);
  const s = buildSession("S1"); assert.strictEqual(s[0].exId, "muscle_up"); assert(s[0].tries); assert(s[0].sets.length >= 5 && s[0].sets.length <= 8);
  assert.strictEqual(buildSession("S3")[0].exId, "muscle_up"); assert(buildSession("S3")[0].sets.length <= 4);
  S.muscleUp = "2026-11-18"; assert.strictEqual(muStage(), 4); assert(checkBadges().some((b) => b.id === "mu"));
});
test("les portes ne s'ouvrent pas dans le désordre", () => {
  fresh(); doSession("S1", "2026-11-04", (it) => (it.exId === "mu_negative" || it.exId === "traction_explosive" ? 5 : it.lo));
  assert.strictEqual(muStage(), 0);
});

/* ---------- RÈGLE DES JOURS ---------- */
const lunch = (d) => dayName(d);
test("3 jours espacés : S1, S2, S3 dans l'ordre", () => {
  fresh(); const wk = "2026-11-16"; // lundi
  const W = generateWeek(wk, ["2026-11-16", "2026-11-18", "2026-11-21"]);
  assert.deepStrictEqual(W.slots.map((s) => s.type), ["S1", "S2", "S3"]); assert.strictEqual(W.msg, "");
});
test("samedi + dimanche consécutifs : la 2e séance devient la séance légère, et l'app le dit", () => {
  fresh(); const wk = "2026-11-16";
  const W = generateWeek(wk, ["2026-11-18", "2026-11-21", "2026-11-22"]);
  const sat = W.slots.find((s) => s.d === "2026-11-21"), sun = W.slots.find((s) => s.d === "2026-11-22");
  assert(!(isHeavy(sat.type) && isHeavy(sun.type)));
  assert.strictEqual(sun.type, "S3"); assert(/dimanche/.test(W.msg) && /légère/.test(W.msg));
});
test("jamais 2 séances lourdes consécutives, quels que soient les 3 jours choisis", () => {
  fresh();
  const wk = "2026-11-16", all = Array.from({ length: 7 }, (_, i) => addDays(wk, i));
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) for (let c = b + 1; c < 7; c++) {
    const W = generateWeek(wk, [all[a], all[b], all[c]]);
    for (let i = 1; i < 3; i++) if (daysBetween(W.slots[i - 1].d, W.slots[i].d) === 1) assert(!(isHeavy(W.slots[i - 1].type) && isHeavy(W.slots[i].type)), all[a] + all[b] + all[c]);
    assert.deepStrictEqual(W.slots.map((s) => s.type).sort(), ["S1", "S2", "S3"]);
  }
});
test("3 jours d'affilée : S3 au milieu", () => {
  fresh(); const W = generateWeek("2026-11-16", ["2026-11-20", "2026-11-21", "2026-11-22"]);
  assert.deepStrictEqual(W.slots.map((s) => s.type), ["S1", "S3", "S2"]);
});
test("la veille d'une semaine commencée par une séance lourde : lundi suivant sans lourd", () => {
  fresh(); S.sessions.push({ id: "x", d: "2026-11-15", type: "S1", items: [] }); // dimanche lourd
  const W = generateWeek("2026-11-16", ["2026-11-16", "2026-11-18", "2026-11-21"]);
  assert.strictEqual(W.slots[0].type, "S3");
});
test("déplacer une séance : réaffecte les types et signale les jours consécutifs", () => {
  fresh(); const wk = "2026-11-16"; generateWeek(wk, ["2026-11-16", "2026-11-18", "2026-11-21"]);
  assert(moveSlot(wk, 2, "2026-11-19"));
  const W = S.weeks[wk]; assert(!(isHeavy(W.slots[1].type) && isHeavy(W.slots[2].type))); assert(/se suivent/.test(W.msg));
  assert(!moveSlot(wk, 0, "2026-11-18"), "jour déjà pris"); assert(!moveSlot(wk, 0, "2026-11-25"), "autre semaine");
});
test("une séance déjà faite ne se déplace pas", () => {
  fresh(); const wk = "2026-11-16"; generateWeek(wk, ["2026-11-16", "2026-11-18", "2026-11-21"]);
  S.weeks[wk].slots[0].done = "abc"; assert(!moveSlot(wk, 0, "2026-11-17"));
});
test("état d'Aujourd'hui : pas de semaine, jour de séance, repos, séance faite", () => {
  fresh(); assert.strictEqual(todayState().status, "noplan");
  generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]);
  let t = todayState(); assert.strictEqual(t.status, "train"); assert.strictEqual(t.n, 1);
  S.weeks["2026-11-16"].slots[0].done = "x"; assert.strictEqual(todayState().status, "done");
  TODAY_OVERRIDE = "2026-11-19"; assert.strictEqual(todayState().status, "rest");
});
test("série : semaines d'affilée avec 3 séances", () => {
  fresh();
  ["2026-11-02", "2026-11-09", "2026-11-16"].forEach((wk) => [0, 2, 5].forEach((o) => S.sessions.push({ id: wk + o, d: addDays(wk, o), type: "S1", items: [] })));
  assert.strictEqual(streakWeeks(), 3);
  S.sessions = S.sessions.filter((s) => !s.d.startsWith("2026-11-09")); assert.strictEqual(streakWeeks(), 1);
});

/* ---------- REPAS ---------- */
test("bibliothèque : au moins 50 repas, par moment, tous avec recette", () => {
  assert(MEALS.length >= 50, "repas : " + MEALS.length);
  ["matin", "midi", "gouter", "soir", "coll"].forEach((sl) => assert(MEALS.filter((m) => m.slot === sl).length >= 8, sl));
  MEALS.forEach((m) => { assert(m.how && m.how.length > 20, m.id); m.ing.forEach(([id]) => assert(ING[id], m.id + " " + id)); });
  assert.strictEqual(new Set(MEALS.map((m) => m.id)).size, MEALS.length, "ids uniques");
});
test("goûts : jamais de salade verte ni de crudités (sauf tomate)", () => {
  const txt = JSON.stringify(MEALS.map((m) => [m.n, m.how])) + JSON.stringify(Object.values(ING).map((i) => i.n));
  assert(!/salade|concombre|carotte(s)? râp|radis|crudit|chou|poivron cru|laitue|roquette/i.test(txt));
  assert(!/soda|coca/i.test(JSON.stringify(MEALS.map((m) => m.how)).replace(/pas de coca/gi, "")));
});
test("midi en semaine : uniquement du transportable sans frigo ni micro-ondes", () => {
  fresh(); const P = generateMeals("2026-11-16");
  for (let di = 0; di <= 4; di++) assert.strictEqual(mealById(P.days[di].midi).where, "any", "jour " + di);
});
test("semaine : aucun repas plus de 2 fois (hors shake), toutes les semaines testées", () => {
  fresh();
  for (let w = 0; w < 30; w++) { const wk = addDays("2026-11-16", w * 7), P = generateMeals(wk), c = planCount(wk); S.plans[wk] = P;
    Object.keys(c).forEach((id) => assert(c[id] <= 2, wk + " " + id + " x" + c[id])); }
});
test("le plan est différent de celui de la semaine précédente", () => {
  fresh();
  let prev = generateMeals("2026-11-09"); S.plans["2026-11-09"] = prev;
  for (let w = 0; w < 12; w++) {
    const wk = addDays("2026-11-16", w * 7), P = generateMeals(wk); S.plans[wk] = P;
    const pp = S.plans[addDays(wk, -7)]; let same = 0, n = 0;
    for (let di = 0; di < 7; di++) planSlots.forEach((sl) => { n++; if (P.days[di][sl] === pp.days[di][sl]) same++; });
    assert(same / n < 0.2, `semaine ${wk} : ${same}/${n} repas identiques`);
  }
});
test("« Plus jamais » : le repas disparaît des plans et n'est plus proposé", () => {
  fresh(); generateMeals("2026-11-16"); S.plans["2026-11-16"] = generateMeals("2026-11-16");
  const id = S.plans["2026-11-16"].days[0].matin;
  setLike(id, -1);
  Object.values(S.plans["2026-11-16"].days).forEach((d) => planSlots.forEach((sl) => assert.notStrictEqual(d[sl], id)));
  for (let w = 1; w < 8; w++) { const P = generateMeals(addDays("2026-11-16", w * 7)); Object.values(P.days).forEach((d) => planSlots.forEach((sl) => assert.notStrictEqual(d[sl], id))); }
  assert(!alternatives("2026-11-16", 0, "matin", 9).some((m) => m.id === id));
});
test("« J'aime » : le repas revient plus souvent", () => {
  fresh(); const target = "p9";
  const count = (flag) => { let n = 0; S.likes = flag ? { [target]: 1 } : {}; for (let w = 0; w < 10; w++) { const wk = addDays("2026-11-16", w * 7); S.plans = {}; S.plans[wk] = generateMeals(wk); n += planCount(wk)[target] || 0; } return n; };
  const a = count(false), b = count(true); assert(b > a, `sans: ${a}, avec: ${b}`);
});
test("« Changer » donne un autre repas du même moment", () => {
  fresh(); generateMeals("2026-11-16"); S.plans["2026-11-16"] = generateMeals("2026-11-16");
  const before = S.plans["2026-11-16"].days[2].soir; swapMeal("2026-11-16", 2, "soir");
  const after = S.plans["2026-11-16"].days[2].soir; assert.notStrictEqual(before, after); assert.strictEqual(mealById(after).slot, "soir");
});
test("Manger : 2 alternatives du même moment, différentes du repas prévu", () => {
  fresh(); S.plans["2026-11-16"] = generateMeals("2026-11-16");
  const alts = alternatives("2026-11-16", 1, "gouter"); assert.strictEqual(alts.length, 2);
  alts.forEach((m) => { assert.strictEqual(m.slot, "gouter"); assert.notStrictEqual(m.id, S.plans["2026-11-16"].days[1].gouter); });
});
test("cocher un repas (ou « autre chose ») met à jour Aujourd'hui", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-18"; ensurePlan("2026-11-16");
  toggleMeal("2026-11-18", "matin"); assert(checksOf("2026-11-18").matin); assert.strictEqual(mainChecks("2026-11-18"), 1);
  setEaten("2026-11-18", "midi", "other"); assert(checksOf("2026-11-18").midi);
  assert.strictEqual(weekMealChecks("2026-11-16"), 2);
  toggleMeal("2026-11-18", "matin"); assert(!checksOf("2026-11-18").matin);
});
test("portions : la cible de 3000 kcal ne donne aucun bonus, +250 donne une portion en plus", () => {
  fresh(); let P = generateMeals("2026-11-16"); assert.strictEqual(P.days[0].boost.length, 0);
  S.profile.kcal = 3250; S.plans["2026-11-16"] = P; updateBoosts("2026-11-16"); assert.strictEqual(S.plans["2026-11-16"].days[0].boost.length, 1);
  const k1 = dayTotals("2026-11-16").kcal; S.profile.kcal = 3500; updateBoosts("2026-11-16"); assert(dayTotals("2026-11-16").kcal > k1);
});
test("liste de courses : rayons, quantités, inclut shake et bonus", () => {
  fresh(); S.plans["2026-11-16"] = generateMeals("2026-11-16");
  const base = shoppingList("2026-11-16"), lait = base.flatMap((g) => g.items).find((i) => i.id === "lait");
  assert(lait && /L$/.test(lait.qty)); assert(base.every((g) => RAYONS.includes(g.rayon)));
  S.profile.kcal = 3500; updateBoosts("2026-11-16"); const more = shoppingList("2026-11-16").flatMap((g) => g.items).length; assert(more >= base.flatMap((g) => g.items).length);
  assert(/WHATSAPP|Liste de courses/i.test(shoppingText("2026-11-16")));
});

/* ---------- POIDS ET CALORIES ---------- */
const W = (arr) => { S.weights = arr.map(([ago, kg]) => ({ d: addDays(TODAY_OVERRIDE, -ago), kg })); };
test("0,5 à 1,5 kg par mois → « C'est le bon rythme, continue » (sur des moyennes)", () => {
  fresh(); W([[27, 56.0], [21, 56.2], [6, 56.8], [0, 57.0]]);
  const a = weightAdvice(); assert.strictEqual(a.kind, "good"); assert(/bon rythme/.test(a.text)); assert(a.perMonth >= 0.5 && a.perMonth <= 1.5, a.perMonth);
});
test("moins de 0,5 kg par mois sur 3 semaines → +250 kcal automatiquement, et l'app le dit", () => {
  fresh(); W([[21, 56.0], [14, 56.1], [7, 56.0], [0, 56.1]]);
  assert.strictEqual(weightAdvice().kind, "low");
  const a = applyWeightRule(); assert(a.bumped); assert.strictEqual(S.profile.kcal, 3250); assert(/250 kcal/.test(a.text));
  const b = applyWeightRule(); assert(!b.bumped); assert.strictEqual(S.profile.kcal, 3250); assert.strictEqual(b.kind, "wait");
});
test("pas de prise sur 3 semaines mais le même plan reste en place 3 semaines avant un nouvel ajout", () => {
  fresh(); W([[21, 56.0], [0, 56.1]]); applyWeightRule(); assert.strictEqual(S.profile.kcal, 3250);
  TODAY_OVERRIDE = addDays(TODAY_OVERRIDE, 22); W([[21, 56.1], [0, 56.1]]); assert.strictEqual(weightAdvice().kind, "low");
  applyWeightRule(); assert.strictEqual(S.profile.kcal, 3500);
});
test("plus de 2 kg par mois → « Garde le même plan », les calories ne baissent jamais", () => {
  fresh(); W([[24, 56.0], [0, 58.5]]); const a = weightAdvice(); assert.strictEqual(a.kind, "fast"); assert(/même plan/.test(a.text));
  S.profile.kcal = 3250; applyWeightRule(); assert.strictEqual(S.profile.kcal, 3250);
});
test("perte de poids : encouragement, ajout de calories, jamais de baisse ni de reproche", () => {
  fresh(); W([[21, 57.0], [0, 56.4]]); const a = applyWeightRule(); assert(a.bumped); assert(S.profile.kcal > 3000);
  assert(!/faute|mauvais|honte|raté|échec|attention/i.test(a.text));
});
test("calories : plancher de 3000 (cible de départ), seulement des paliers de +250", () => {
  fresh(); S.profile.kcal = 2800; bumpKcal(); assert.strictEqual(S.profile.kcal, 3250); assert(typeof lowerKcal === "undefined");
});
test("pas assez de données : pas de calcul, pas d'ajout", () => {
  fresh(); W([[0, 56]]); assert.strictEqual(weightAdvice().kind, "start"); applyWeightRule(); assert.strictEqual(S.profile.kcal, 3000);
});
test("moins de 2 séances dans la semaine : jours espacés proposés pour la suivante", () => {
  fresh(); assert.deepStrictEqual(EASY_DAYS, [0, 2, 5]);
  const w = EASY_DAYS.map((i) => addDays("2026-11-23", i)); const W2 = generateWeek("2026-11-23", w);
  assert.strictEqual(W2.msg, "");
});

/* ---------- MIGRATION V1 ---------- */
const V1 = () => ({ v: 1, onboarded: true,
  profile: { name: "Tristan", birth: "2011-11-26", height: 180, startKg: 56, goalKg: 70, goal3Kg: 61.5, goal3Date: "2027-02-15", goalDate: "2028-04-30", kcal: 3250, prot: 110, rest: 90, med: true, medName: "Quasym", holiday: false, days: { A: 3, B: 6, C: 0 } },
  weights: [{ d: "2026-11-14", kg: 56 }, { d: "2026-11-21", kg: 56.4 }], measures: [{ d: "2026-11-14", bras: 29, poit: 88 }],
  records: [{ d: "2026-11-14", type: "tractions", v: 11 }],
  sessions: [{ id: "s1", d: "2026-11-18", type: "A", startedAt: 1, endedAt: 2, items: [{ key: "A1", exId: "traction", kg: 0, unit: "reps", sets: [{ r: 9, done: true }, { r: 8, done: true }] }] },
             { id: "s2", d: "2026-11-21", type: "C", startedAt: 1, endedAt: 2, items: [{ key: "C1", exId: "traction_explosive", kg: 0, unit: "reps", sets: [{ r: 5, done: true }] }] }],
  prog: { A1: { lvl: 0 } }, pending: [{ key: "A1" }],
  parks: [{ id: "park1", name: "Parc du coin", equip: ["barre", "paralleles"], photo: "pk-123" }], parkLast: "park1",
  plans: { "2026-11-16": { 0: { pdj: "p1" } } }, mealChecks: { "2026-11-18": { pdj: true, midi: true, gouter: true, diner: true, coll: true, shake: true } }, shop: {},
  reminders: { week: ["07:00", "12:15", "16:30", "19:30", "22:00"], weekend: ["09:30", "12:30", "16:30", "19:30", "22:00"] },
  badges: { first: "2026-11-18", pull15: "2026-11-20", park: "2026-11-19", lsit15: "2026-11-21" }, photos: [{ id: "ph-1", ym: "2026-11", d: "2026-11-14" }], muscleUp: null, kcalBumps: ["2026-11-20"], current: null });
test("migration V1 : profil, poids, mensurations, records, parcs, photos conservés", () => {
  const s = migrateV1(V1());
  assert.strictEqual(s.v, 2); assert.strictEqual(s.profile.name, "Tristan"); assert.strictEqual(s.profile.medName, "Quasym");
  assert.strictEqual(s.profile.kcal, 3250); assert.strictEqual(s.profile.kcalBase, 3000); assert.strictEqual(s.profile.goalKg, 70);
  assert.deepStrictEqual(s.weights, [{ d: "2026-11-14", kg: 56 }, { d: "2026-11-21", kg: 56.4 }]);
  assert.strictEqual(s.measures.length, 1); assert.strictEqual(s.records[0].v, 11);
  assert.strictEqual(s.parks.length, 1); assert.strictEqual(s.parks[0].photo, "pk-123"); assert.strictEqual(s.parkLast, "park1");
  assert.strictEqual(s.photos[0].id, "ph-1"); assert.deepStrictEqual(s.kcalBumps, ["2026-11-20"]);
  assert.deepStrictEqual(s.profile.days, [3, 6, 0]); assert.strictEqual(s.profile.rest, 90);
});
test("migration V1 : séances A/B/C → S1/S2/S3, records et portes calculés depuis l'historique", () => {
  S = migrateV1(V1()); TODAY_OVERRIDE = "2026-11-22";
  assert.deepStrictEqual(S.sessions.map((x) => x.type), ["S1", "S3"]);
  assert.strictEqual(bestRecord("tractions"), 11); assert.strictEqual(maxReps(["traction_explosive"]), 5);
  assert.deepStrictEqual(S.prog, {}); assert.deepStrictEqual(S.weeks, {});
});
test("migration V1 : repas cochés, badges existants conservés, anciens badges retirés proprement", () => {
  const s = migrateV1(V1());
  assert.deepStrictEqual(s.mealChecks["2026-11-18"], { matin: true, midi: true, gouter: true, soir: true });
  assert(s.badges.first && s.badges.pull15 && !s.badges.park && !s.badges.lsit15);
});
test("migration V1 : fonctionne sur un état presque vide, et l'app démarre ensuite", () => {
  const s = migrateV1({ v: 1, profile: {}, weights: [], sessions: [] });
  assert.strictEqual(s.profile.kcal, 3000); assert.deepStrictEqual(s.profile.days, [3, 6, 0]);
  S = s; TODAY_OVERRIDE = "2026-11-18"; buildSession("S1"); ensurePlan(weekKey(today())); dayTotals(today());
});
test("chargement : V1 présent sans V2 → migre, écrit forge.v2 et garde forge.v1 intact", () => {
  Object.keys(mem).forEach((k) => delete mem[k]); mem["forge.v1"] = JSON.stringify(V1());
  assert.strictEqual(loadState(), "migrated"); assert(mem["forge.v2"]); assert.strictEqual(JSON.parse(mem["forge.v1"]).v, 1);
  assert.strictEqual(S.profile.name, "Tristan"); assert.strictEqual(loadState(), "v2");
  Object.keys(mem).forEach((k) => delete mem[k]); assert.strictEqual(loadState(), "new");
});
test("sauvegarde V1 importée : convertie en V2", () => {
  const s = stateFromBackup({ app: "forge", v: 1, state: V1(), photos: {} }); assert.strictEqual(s.v, 2); assert.strictEqual(s.parks[0].id, "park1");
  const s2 = stateFromBackup({ app: "forge", v: 2, state: mergeState(s), photos: {} }); assert.strictEqual(s2.profile.name, "Tristan");
});
test("pas de donnée personnelle écrite en dur dans le code", () => {
  assert(!/Tristan|Quasym|2011|dasilva/i.test(SRC.replace(/\/\*[\s\S]*?\*\//g, "")), "donnée perso trouvée");
});


/* ---------- BANDE « MA SEMAINE », PROCHAINE SÉANCE, SÉANCE « QUAND MÊME » ---------- */
test("bande Ma semaine : 7 jours, séances sur les bons jours, séance faite marquée", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-23"].slice(0, 2).concat("2026-11-22"));
  S.weeks["2026-11-16"].slots[0].done = "x";
  const d = weekDays("2026-11-16"); assert.strictEqual(d.length, 7);
  assert.deepStrictEqual(d.filter((x) => x.slot).map((x) => x.d), ["2026-11-18", "2026-11-21", "2026-11-22"]);
  assert.strictEqual(d[2].slot.done, "x"); assert.strictEqual(d[0].slot, null);
});
test("jour sans séance : prochaine séance (cette semaine, puis la semaine suivante)", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]);
  TODAY_OVERRIDE = "2026-11-19"; let n = nextSession(); assert.strictEqual(n.d, "2026-11-21"); assert.strictEqual(n.type, S.weeks["2026-11-16"].slots[1].type);
  S.weeks["2026-11-16"].slots.forEach((s) => { s.done = "x"; });
  assert.strictEqual(nextSession(), null);
  generateWeek("2026-11-23", ["2026-11-24", "2026-11-26", "2026-11-28"]);
  assert.strictEqual(nextSession().d, "2026-11-24");
});
test("séance en retard détectée", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]); TODAY_OVERRIDE = "2026-11-20";
  assert.strictEqual(overdueSession().d, "2026-11-18");
});
test("séance quand même : refusée un jour prévu ou semaine complète", () => {
  fresh();
  generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]);
  TODAY_OVERRIDE = "2026-11-18"; assert.strictEqual(extraSession(true).reason, "planned");
  S.weeks["2026-11-16"].slots.forEach((s) => { s.done = "x"; }); TODAY_OVERRIDE = "2026-11-19"; assert.strictEqual(extraSession(true).reason, "full");
});
test("séance quand même : la séance la plus proche est avancée à aujourd'hui, 3 séances toujours présentes", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-19", "2026-11-21", "2026-11-22"]); TODAY_OVERRIDE = "2026-11-17";
  const dry = extraSession(true); assert(dry.ok); assert.deepStrictEqual(S.weeks["2026-11-16"].slots.map((s) => s.d), ["2026-11-19", "2026-11-21", "2026-11-22"], "aperçu sans effet");
  const r = extraSession(false); assert(r.ok);
  const W = S.weeks["2026-11-16"]; assert.deepStrictEqual(W.slots.map((s) => s.d), ["2026-11-17", "2026-11-21", "2026-11-22"]);
  assert.deepStrictEqual(W.slots.map((s) => s.type).sort(), ["S1", "S2", "S3"]); assert(/réajusté/.test(W.msg));
  assert.strictEqual(W.slots[r.idx].d, "2026-11-17");
});
test("séance quand même : la plus logique = légère le lendemain d'une séance lourde", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]);
  S.weeks["2026-11-16"].slots[0].done = "x"; S.sessions.push({ id: "w", d: "2026-11-18", type: "S1", items: [] });
  TODAY_OVERRIDE = "2026-11-19"; const r = extraSession(false);
  assert.strictEqual(r.type, "S3", "jeudi, lendemain d'une séance de tirage : séance technique légère");
  const W = S.weeks["2026-11-16"]; assert.strictEqual(W.slots[0].type, "S1"); assert.strictEqual(W.slots[0].done, "x");
  for (let i = 1; i < 3; i++) if (daysBetween(W.slots[i - 1].d, W.slots[i].d) === 1) assert(!(isHeavy(W.slots[i - 1].type) && isHeavy(W.slots[i].type)));
});
test("séance quand même : la séance en retard passe avant les séances à venir", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-17", "2026-11-20", "2026-11-22"]); TODAY_OVERRIDE = "2026-11-19";
  const r = extraSession(false); assert(r.ok);
  assert.deepStrictEqual(S.weeks["2026-11-16"].slots.map((s) => s.d), ["2026-11-19", "2026-11-20", "2026-11-22"]);
});
test("séance quand même : les jours déjà faits ne bougent pas, jamais 2 lourdes de suite sur toutes les combinaisons", () => {
  const wk = "2026-11-16", all = Array.from({ length: 7 }, (_, i) => addDays(wk, i));
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) for (let c = b + 1; c < 7; c++) for (let t = 0; t < 7; t++) {
    if (t === a || t === b || t === c) continue;
    fresh(); generateWeek(wk, [all[a], all[b], all[c]]); TODAY_OVERRIDE = all[t];
    const r = extraSession(false); if (!r.ok) continue;
    const W = S.weeks[wk]; assert.strictEqual(W.slots.length, 3); assert.deepStrictEqual(W.slots.map((s) => s.type).sort(), ["S1", "S2", "S3"]);
    for (let i = 1; i < 3; i++) if (daysBetween(W.slots[i - 1].d, W.slots[i].d) === 1) assert(!(isHeavy(W.slots[i - 1].type) && isHeavy(W.slots[i].type)), [all[a], all[b], all[c], all[t]].join());
  }
});


/* ================= POINT 3 : SÉANCE NON PRÉVUE (selon ce qui est déjà fait et le repos) ================= */
const sessOn = (d, type, items) => ({ id: "s" + d + type, d, type, items: items || [] });
test("3 · sans semaine générée : le bouton crée une séance du jour, tirage + muscle-up en priorité", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-18";
  const r = extraSession(false); assert(r.ok); assert.strictEqual(r.type, "S1");
  const W = S.weeks["2026-11-16"]; assert.strictEqual(W.slots.length, 1); assert.strictEqual(W.slots[0].d, "2026-11-18");
  assert.strictEqual(todayState().status, "train");
});
test("3 · sans semaine : tient compte de ce qui est déjà fait cette semaine (tirage fait → poussée)", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-19"; S.sessions.push(sessOn("2026-11-16", "S1"));
  assert.strictEqual(extraSession(false).type, "S2");
});
test("3 · sans semaine : le lendemain d'une séance lourde, séance légère (repos)", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-19"; S.sessions.push(sessOn("2026-11-18", "S1"));
  assert.strictEqual(extraSession(false).type, "S3");
});
test("3 · lourde + légère déjà faites : il reste la poussée", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-21"; S.sessions.push(sessOn("2026-11-16", "S1"), sessOn("2026-11-18", "S3"));
  assert.strictEqual(extraSession(false).type, "S2");
});
test("3 · les 3 types faits dans la semaine : refusé", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-22"; ["S1", "S2", "S3"].forEach((t, i) => S.sessions.push(sessOn(addDays("2026-11-16", i * 2), t)));
  assert.strictEqual(extraSession(true).ok, false);
});
test("3 · planning incomplet dont les séances sont faites : ajoute une séance du jour qui manque", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-17"]); S.weeks["2026-11-16"].slots[0].done = "x"; S.sessions.push(sessOn("2026-11-17", "S1"));
  TODAY_OVERRIDE = "2026-11-20"; const r = extraSession(false); assert(r.ok); assert.strictEqual(r.type, "S2");
  assert.strictEqual(S.weeks["2026-11-16"].slots.length, 2); assert.strictEqual(S.weeks["2026-11-16"].slots[0].done, "x");
});
test("3 · avec une semaine : la séance avancée respecte les jours consécutifs sur toutes les combinaisons", () => {
  const wk = "2026-11-16", all = Array.from({ length: 7 }, (_, i) => addDays(wk, i));
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) for (let t = 0; t < 7; t++) {
    if (t === a || t === b) continue;
    fresh(); generateWeek(wk, [all[a], all[b]]); TODAY_OVERRIDE = all[t];
    const r = extraSession(false); if (!r.ok) continue;
    const W = S.weeks[wk]; for (let i = 1; i < W.slots.length; i++) if (daysBetween(W.slots[i - 1].d, W.slots[i].d) === 1) assert(!(isHeavy(W.slots[i - 1].type) && isHeavy(W.slots[i].type)), [all[a], all[b], all[t]].join());
  }
});

/* ================= POINT 4 : SEMAINE EN COURS INCOMPLÈTE ================= */
const types = (wk) => S.weeks[wk].slots.map((x) => x.type);
test("4 · un seul jour (dimanche seul) : une séance, tirage + muscle-up d'abord", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-22"; const W = generateWeek("2026-11-16", ["2026-11-22"]);
  assert.strictEqual(W.slots.length, 1); assert.strictEqual(W.slots[0].type, "S1"); assert(/priorité/.test(W.msg) && /tirage/.test(W.msg));
  assert.strictEqual(todayState().status, "train");
});
test("4 · deux jours espacés : tirage puis poussée (priorité), pas la technique", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-19"; generateWeek("2026-11-16", ["2026-11-19", "2026-11-22"]);
  assert.deepStrictEqual(types("2026-11-16"), ["S1", "S2"]);
});
test("4 · deux jours consécutifs (samedi + dimanche) : tirage + technique légère, règle des jours respectée", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-21"; const W = generateWeek("2026-11-16", ["2026-11-21", "2026-11-22"]);
  assert.deepStrictEqual(types("2026-11-16"), ["S1", "S3"]); assert(/se suivent/.test(W.msg));
});
test("4 · une séance de tirage déjà faite dans l'app ou hors planning : on place poussée puis technique", () => {
  fresh(); S.sessions.push(sessOn("2026-11-16", "S1")); TODAY_OVERRIDE = "2026-11-19";
  generateWeek("2026-11-16", ["2026-11-19", "2026-11-22"]); assert.deepStrictEqual(types("2026-11-16"), ["S2", "S3"]);
  fresh(); S.sessions.push(sessOn("2026-11-16", "S1")); TODAY_OVERRIDE = "2026-11-22";
  generateWeek("2026-11-16", ["2026-11-22"]); assert.deepStrictEqual(types("2026-11-16"), ["S2"]);
});
test("4 · tirage et poussée faits : il reste la technique", () => {
  fresh(); S.sessions.push(sessOn("2026-11-16", "S1"), sessOn("2026-11-18", "S2")); TODAY_OVERRIDE = "2026-11-22";
  generateWeek("2026-11-16", ["2026-11-22"]); assert.deepStrictEqual(types("2026-11-16"), ["S3"]);
});
test("4 · le lendemain d'une séance lourde, seul jour restant : séance légère plutôt que lourde", () => {
  fresh(); S.sessions.push(sessOn("2026-11-21", "S2")); TODAY_OVERRIDE = "2026-11-22";
  generateWeek("2026-11-16", ["2026-11-22"]); assert.deepStrictEqual(types("2026-11-16"), ["S3"]);
});
test("4 · refuse trop de jours pour ce qui reste, ou un jour déjà fait, ou aucun jour", () => {
  fresh(); S.sessions.push(sessOn("2026-11-16", "S1"), sessOn("2026-11-17", "S3")); TODAY_OVERRIDE = "2026-11-19";
  assert.throws(() => generateWeek("2026-11-16", ["2026-11-19", "2026-11-21"]), /Il ne reste que 1 séance/);
  assert.throws(() => generateWeek("2026-11-16", []), /au moins 1 jour/);
  fresh(); generateWeek("2026-11-16", ["2026-11-17", "2026-11-20", "2026-11-22"]); S.weeks["2026-11-16"].slots[0].done = "x";
  assert.throws(() => generateWeek("2026-11-16", ["2026-11-17"]), /déjà une séance faite/);
  assert.throws(() => generateWeek("2026-11-16", ["2026-11-23"]), /même semaine/);
});
test("4 · régénérer la semaine en cours garde les séances faites et les repas déjà passés (plan déterministe)", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-19"; generateWeek("2026-11-16", ["2026-11-17", "2026-11-20", "2026-11-22"]);
  S.weeks["2026-11-16"].slots[0].done = "x"; S.sessions.push(sessOn("2026-11-17", S.weeks["2026-11-16"].slots[0].type));
  const past = JSON.stringify([0, 1, 2, 3].map((i) => S.plans["2026-11-16"].days[i])), later = JSON.stringify([4, 5, 6].map((i) => S.plans["2026-11-16"].days[i]));
  generateWeek("2026-11-16", ["2026-11-22"]);
  const W = S.weeks["2026-11-16"]; assert.strictEqual(W.slots.length, 2); assert.strictEqual(W.slots[0].done, "x"); assert.strictEqual(W.slots[1].d, "2026-11-22");
  assert.strictEqual(JSON.stringify([0, 1, 2, 3].map((i) => S.plans["2026-11-16"].days[i])), past, "repas passés intacts");
  assert.strictEqual(JSON.stringify([4, 5, 6].map((i) => S.plans["2026-11-16"].days[i])), later, "mêmes règles → même plan pour la suite");
  const c = planCount("2026-11-16"); Object.keys(c).forEach((id) => assert(c[id] <= 2, id));
});
test("4 · options du générateur : jours passés grisés, nombre de séances restantes", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-20"; S.sessions.push(sessOn("2026-11-17", "S1"));
  const o = genOptions("2026-11-16"); assert.strictEqual(o.max, 2); assert.deepStrictEqual(o.days.filter((x) => x.disabled).map((x) => x.d), ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"]);
  assert.strictEqual(genOptions("2026-11-23").max, 3); assert(genOptions("2026-11-23").days.every((x) => !x.disabled));
});
test("4 · semaine prochaine : 3 séances comme avant, et 1 ou 2 jours possibles aussi", () => {
  fresh(); assert.deepStrictEqual(types((generateWeek("2026-11-23", ["2026-11-24", "2026-11-26", "2026-11-28"]), "2026-11-23")), ["S1", "S2", "S3"]);
  fresh(); generateWeek("2026-11-23", ["2026-11-25"]); assert.deepStrictEqual(types("2026-11-23"), ["S1"]);
});

/* ================= POINT 5 : SÉANCE FAITE SANS L'APP ================= */
function offSession(d, type, f, manualOpts) {
  const items = buildSession(type, null);
  items.forEach((it) => { it.manual = true; it.sets = it.sets.map((x, i) => ({ r: f(it, i), t: x.t, done: true })); });
  const sess = { id: "m" + (seq++), d, type, manual: true, items: items.map((it) => ({ key: it.key, lad: it.lad, rg: it.rg, exId: it.exId, origId: null, kg: it.kg, unit: it.unit, lo: it.lo, hi: it.hi, mu: it.mu, tries: it.tries, volume: it.volume, planned: it.planned, manual: true, sets: it.sets })) };
  return { sess, res: commitSession(sess, null) };
}
test("5 · une séance saisie après coup est triée par date et rattachée au planning", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-20"; generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]);
  doSession("S1", "2026-11-19", (it) => it.lo);
  const { sess } = offSession("2026-11-17", "S1", (it) => it.lo);
  assert.deepStrictEqual(S.sessions.map((x) => x.d), ["2026-11-17", "2026-11-19"]);
  const W = S.weeks["2026-11-16"]; const sl = W.slots.find((x) => x.done === sess.id); assert(sl && sl.d === "2026-11-17" && sl.type === "S1");
  assert.strictEqual(W.slots.length, 3); assert.deepStrictEqual(W.slots.map((x) => x.type).sort(), ["S1", "S2", "S3"]);
});
test("5 · séance hors app d'un autre type que celle prévue ce jour-là : le planning se réajuste", () => {
  fresh(); generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]); TODAY_OVERRIDE = "2026-11-19";
  offSession("2026-11-18", "S2", (it) => it.lo);
  const W = S.weeks["2026-11-16"], sl = W.slots.find((x) => x.d === "2026-11-18"); assert(sl.done && sl.type === "S2");
  assert.deepStrictEqual(W.slots.filter((x) => !x.done).map((x) => x.type).sort(), ["S1", "S3"]);
  for (let i = 1; i < 3; i++) if (daysBetween(W.slots[i - 1].d, W.slots[i].d) === 1) assert(!(isHeavy(W.slots[i - 1].type) && isHeavy(W.slots[i].type)));
});
test("5 · sans semaine générée : la séance compte dans l'historique et les records", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-20"; offSession("2026-11-18", "S1", (it) => (it.lad === "pullV" ? 9 : it.lo));
  assert.strictEqual(S.sessions.length, 1); assert.strictEqual(bestRecord("tractions"), 9); assert.strictEqual(distinctDaysInWeek("2026-11-16"), 1);
});
test("5 · la progression en tient compte : 2 séances saisies au haut de la fourchette → variante suivante", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-25";
  const hi = (it) => (it.lad ? it.hi : it.lo);
  offSession("2026-11-11", "S1", hi); assert.strictEqual(lp("pullV").r, 1);
  const { res } = offSession("2026-11-18", "S1", hi); assert.strictEqual(lp("pullV").r, 2); assert(res.latest); assert(res.notes.some((n) => /Variante suivante/.test(n.text)));
  assert.strictEqual(item(buildSession("S1"), "pullV").exId, "traction_pause");
});
test("5 · la cible suivante part de ce qui a été saisi (+1 rep par série)", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-25"; offSession("2026-11-18", "S1", (it) => (it.lad === "pullV" ? 7 : it.lo));
  assert.deepStrictEqual(item(buildSession("S1"), "pullV").sets.map((x) => x.t), [8, 8, 8]);
});
test("5 · une seule série saisie au haut de la fourchette ne fait pas monter (séries prévues non faites)", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-25";
  const mk = (d) => { const items = buildSession("S1", null); const it = item(items, "pullV"); it.manual = true; it.sets = [{ r: it.hi, t: it.hi, done: true }];
    return { id: "p" + d, d, type: "S1", manual: true, items: [{ key: it.key, lad: "pullV", rg: it.rg, exId: it.exId, kg: 0, unit: "reps", lo: it.lo, hi: it.hi, planned: it.planned, manual: true, sets: it.sets }] }; };
  commitSession(mk("2026-11-11"), null); commitSession(mk("2026-11-18"), null); assert.strictEqual(lp("pullV").r, 1);
});
test("5 · variante différente saisie (déjà sur l'échelon supérieur) : la progression s'y cale", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-25"; assert.strictEqual(lp("pullV").r, 1);
  const items = buildSession("S1", null), it = item(items, "pullV"); it.manual = true; it.rg = 3; it.exId = "traction_poitrine"; it.lo = 4; it.hi = 8; it.sets = it.sets.map(() => ({ r: 6, t: 6, done: true }));
  commitSession({ id: "q1", d: "2026-11-18", type: "S1", manual: true, items: [{ key: it.key, lad: "pullV", rg: 3, exId: "traction_poitrine", kg: 0, unit: "reps", lo: 4, hi: 8, planned: 3, manual: true, sets: it.sets }] }, null);
  assert.strictEqual(lp("pullV").r, 3); assert.deepStrictEqual(item(buildSession("S1"), "pullV").sets.map((x) => x.t), [7, 7, 7]);
});
test("5 · séance plus ancienne que les dernières : historique et records, progression non recalculée", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-25"; doSession("S1", "2026-11-20", (it) => (it.lad ? it.hi : it.lo)); const before = JSON.stringify(S.prog);
  const { res } = offSession("2026-11-10", "S1", (it) => (it.lad ? it.hi : it.lo)); assert(!res.latest); assert.strictEqual(JSON.stringify(S.prog), before);
  assert.deepStrictEqual(S.sessions.map((x) => x.d), ["2026-11-10", "2026-11-20"]);
});
test("5 · muscle-up réussi saisi après coup : porte et badge", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-25"; S.records.push({ d: "2026-11-01", type: "tractions", v: 10 }, { d: "2026-11-01", type: "dips", v: 12 });
  S.sessions.push({ id: "z1", d: "2026-11-02", type: "S1", items: [{ exId: "traction_explosive", kg: 0, unit: "reps", sets: [{ r: 5, done: true }] }, { exId: "mu_negative", kg: 0, unit: "reps", sets: [{ r: 3, done: true }] }] });
  const { res } = offSession("2026-11-20", "S1", (it) => (it.tries ? 1 : it.lo)); assert(res.mu); assert.strictEqual(S.muscleUp, "2026-11-20"); assert(checkBadges().some((b) => b.id === "mu"));
});
test("5 · l'exercice ajouté librement compte dans les records", () => {
  fresh(); commitSession({ id: "f1", d: "2026-11-18", type: "S2", manual: true, items: [{ key: "x", lad: null, exId: "pompes", kg: 0, unit: "reps", lo: 0, hi: 0, manual: true, sets: [{ r: 24, done: true }, { r: 20, done: true }] }] }, null);
  assert.strictEqual(bestRecord("pompes"), 24);
});
test("5 · rattacher sans planning ou sans place ne casse rien", () => {
  fresh(); assert.strictEqual(attachSession({ id: "n", d: "2026-11-18", type: "S1" }), false);
  generateWeek("2026-11-16", ["2026-11-18", "2026-11-21", "2026-11-22"]); S.weeks["2026-11-16"].slots.forEach((x) => { x.done = "x"; });
  assert.strictEqual(attachSession({ id: "n2", d: "2026-11-19", type: "S1" }), false);
});

/* ================= POINT 1 : SEMAINE PROCHAINE SEULE → PROCHAINE SÉANCE ================= */
test("1 · semaine en cours non générée mais semaine prochaine prête : la prochaine séance existe", () => {
  fresh(); TODAY_OVERRIDE = "2026-11-22"; generateWeek("2026-11-23", ["2026-11-24", "2026-11-26", "2026-11-28"]);
  assert.strictEqual(todayState().status, "noplan"); const n = nextSession(); assert.strictEqual(n.d, "2026-11-24"); assert.strictEqual(n.type, "S1");
});
