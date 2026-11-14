/* FORGE — mode séance sans distraction */
"use strict";

let ssTick = null, wakeLock = null, audioCtx = null, doneInfo = null, beeped = false;

/* ---------- Écran allumé, son, vibration ---------- */
async function keepAwake() {
  try { if ("wakeLock" in navigator && !document.hidden) wakeLock = await navigator.wakeLock.request("screen"); } catch (e) { /* pas grave */ }
}
function releaseAwake() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* rien */ } wakeLock = null; }
document.addEventListener("visibilitychange", () => { if (!document.hidden && !$("#session").hidden) keepAwake(); });
function unlockAudio() {
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch (e) { /* pas de son */ }
}
function beep() {
  try { if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } catch (e) { /* rien */ }
  if (!audioCtx) return;
  try {
    [0, 0.25].forEach((dt) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + dt); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dt + 0.2);
      o.start(audioCtx.currentTime + dt); o.stop(audioCtx.currentTime + dt + 0.22);
    });
  } catch (e) { /* rien */ }
}
const mmss = (sec) => { sec = Math.max(0, Math.ceil(sec)); return `${Math.floor(sec / 60)}:${pad2(sec % 60)}`; };

/* ---------- Ouverture / fermeture ---------- */
function openSession() {
  $("#session").hidden = false; document.body.style.overflow = "hidden";
  keepAwake(); renderSession();
  clearInterval(ssTick); ssTick = setInterval(tickSession, 250);
}
function closeSession() {
  $("#session").hidden = true; $("#session").innerHTML = ""; document.body.style.overflow = "";
  clearInterval(ssTick); ssTick = null; releaseAwake(); doneInfo = null; render();
}
ACTIONS.start = (el) => {
  unlockAudio();
  if (!S.current) {
    S.current = { type: el.dataset.type, step: "park", d: today(), startedAt: Date.now(), parkId: null, idx: 0, sel: null, items: [], restEnd: 0, restTotal: 0, hold: 0, wu: [], wuEnd: 0 };
    saveState();
  }
  openSession();
};
ACTIONS.resume = () => { unlockAudio(); openSession(); };

/* ---------- Étapes ---------- */
function renderSession() {
  const C = S.current, box = $("#session");
  if (doneInfo) { box.innerHTML = `<div class="ss">${viewDone()}</div>`; return; }
  if (!C) return closeSession();
  box.innerHTML = `<div class="ss">${{ park: viewPark, warmup: viewWarmup, work: viewWork }[C.step]()}</div>`;
  hydratePhotos(); tickSession();
}
function ssTop(title, withInfo) {
  return `<div class="ss-top"><button class="icon-btn" data-a="ss-menu" aria-label="Menu de la séance">✕</button><b>${title}</b>${withInfo ? `<button class="icon-btn" data-a="fiche" data-ex="${withInfo}" aria-label="Fiche de l'exercice">ⓘ</button>` : `<span style="width:48px"></span>`}</div>`;
}

function viewPark() {
  const C = S.current;
  return `${ssTop(PROGRAM[C.type].n)}
  <div class="ss-mid" style="justify-content:flex-start;text-align:left">
    <h1>Où t'entraînes-tu ?</h1><p class="muted">L'app adapte les exercices au matériel du parc.</p>
    ${S.parks.map((pk) => `<button class="btn big" style="justify-content:flex-start;height:auto;padding:12px" data-a="ss-park" data-id="${pk.id}">
      ${pk.photo ? `<img class="thumb" data-photo="${pk.photo}" alt="">` : `<span class="thumb" style="display:grid;place-items:center;font-size:28px">🌳</span>`}
      <span style="text-align:left"><span style="display:block">${esc(pk.name)}${S.parkLast === pk.id ? " ⭐" : ""}</span><span class="muted small" style="font-weight:500">${pk.equip.length} équipement${pk.equip.length > 1 ? "s" : ""}</span></span></button>`).join("")}
    <button class="btn" data-a="ss-park" data-id="all">Autre endroit avec tout le matériel</button>
    <button class="btn" data-a="ss-park" data-id="none">Sans matériel (maison, vacances)</button>
  </div>`;
}
ACTIONS["ss-park"] = (el) => {
  const C = S.current, id = el.dataset.id;
  C.parkId = id; if (id !== "all" && id !== "none") S.parkLast = id;
  const equip = id === "all" ? null : id === "none" ? [] : (S.parks.find((p) => p.id === id) || { equip: null }).equip;
  C.items = PROGRAM[C.type].slots.map((slot) => buildItem(slot, equip));
  C.step = "warmup"; C.wu = WARMUP.map(() => false); C.wuEnd = Date.now() + 5 * 60000; C.startedAt = Date.now();
  saveState(); renderSession();
};

function viewWarmup() {
  const C = S.current, subs = C.items.filter((it) => it.origId);
  return `${ssTop("Échauffement")}
  <div class="center"><div class="timer" id="ss-timer">5:00</div><p class="muted">5 minutes pour préparer les articulations</p></div>
  <div class="card">${WARMUP.map((w, i) => `<div class="line">${check(C.wu[i], "ss-wu", `data-i="${i}"`)}<div class="grow"><div class="t ${C.wu[i] ? "done-txt" : ""}">${w.t}</div><div class="muted small">${w.d}</div></div></div>`).join("")}</div>
  ${subs.length ? `<div class="card soft"><b>🔁 Adapté à ton parc</b>${subs.map((it) => `<p class="small muted">${esc(EXERCISES[it.origId].n)} → <b style="color:var(--txt)">${esc(EXERCISES[it.exId].n)}</b></p>`).join("")}</div>` : ""}
  <button class="btn primary big" data-a="ss-go">Je suis chaud, on y va 🔥</button>`;
}
ACTIONS["ss-wu"] = (el) => { const C = S.current; C.wu[+el.dataset.i] = !C.wu[+el.dataset.i]; saveState(); renderSession(); };
ACTIONS["ss-go"] = () => { unlockAudio(); S.current.step = "work"; saveState(); renderSession(); };

const curSetIdx = (it, sel) => (sel != null && it.sets[sel] ? sel : it.sets.findIndex((s) => !s.done));
function viewWork() {
  const C = S.current, it = C.items[C.idx], ex = EXERCISES[it.exId], n = C.items.length;
  const si = curSetIdx(it, C.sel), resting = C.restEnd > Date.now(), isLast = C.idx === n - 1;
  const allDone = C.items.every((x) => x.sets.every((s) => s.done));
  const unit = it.unit === "s" ? "secondes" : it.unit === "AR" ? "allers-retours" : it.perSide ? "reps par jambe" : "reps";
  let mid;
  if (resting) {
    const nx = si >= 0 ? `Série ${si + 1} sur ${it.sets.length}` : "";
    mid = `<div class="ring" id="ss-ring" style="--p:100"><div><span class="eyebrow">Repos</span><div class="timer" id="ss-timer">0:00</div></div></div>
      <p class="muted">Ensuite : <b style="color:var(--txt)">${esc(ex.n)}</b>${nx ? ` · ${nx}` : ""}</p>
      <div class="grid2"><button class="btn" data-a="ss-rest-add">+15 s</button><button class="btn primary" data-a="ss-rest-skip">Passer le repos</button></div>`;
  } else if (C.hold) {
    mid = `<div class="ring" id="ss-ring" style="--p:0"><div><span class="eyebrow">Tiens bon</span><div class="timer" id="ss-timer">0</div><span class="muted small">objectif ${it.hi} s</span></div></div>
      <button class="btn primary big" data-a="ss-hold-stop">■ Stop : série faite</button>`;
  } else if (si < 0) {
    mid = `<div style="font-size:60px">✅</div><h2>Exercice terminé</h2>
      ${isLast || allDone ? `<button class="btn primary big" data-a="ss-finish">Terminer la séance 🏁</button>` : `<button class="btn primary big" data-a="ss-next">Exercice suivant →</button>`}`;
  } else {
    const st = it.sets[si];
    mid = `<p class="muted">Série ${si + 1} sur ${it.sets.length}${st.done ? " · correction" : ""} · <b>${unit}</b></p>
      <div class="stepper"><button data-a="ss-step" data-d="-1" aria-label="Moins">−</button><input type="number" id="ss-reps" inputmode="numeric" value="${st.r}" aria-label="Répétitions faites"><button data-a="ss-step" data-d="1" aria-label="Plus">+</button></div>
      ${it.unit === "s" && !st.done ? `<button class="btn" data-a="ss-hold">▶ Lancer le chrono de maintien</button>` : ""}
      <button class="btn primary big" data-a="ss-set">✓ Série faite</button>`;
  }
  return `${ssTop(`${PROGRAM[C.type].n} · ${C.idx + 1}/${n}`, it.exId)}
  <div class="dots">${C.items.map((x, i) => `<i class="${x.sets.every((s) => s.done) ? "on" : i === C.idx ? "cur" : ""}"></i>`).join("")}</div>
  <div class="ss-mid">
    <div><div class="ss-name">${esc(ex.n)}</div>
      ${it.origId ? `<p class="small" style="color:var(--blue)">remplace ${esc(EXERCISES[it.origId].n)} (matériel du parc)</p>` : ""}
      ${it.kg ? `<p><span class="pill acc">🎒 Sac à dos : +${fmtKg(it.kg)} kg</span></p>` : ""}</div>
    <div><div class="ss-target">${targetLabel(it)}</div><p class="muted small">${[targetHint(it), it.last ? `Dernière fois : ${it.last.join(" · ")}` : ""].filter(Boolean).join(" · ")}</p></div>
    <div class="sets">${it.sets.map((s, i) => `<button class="setdot ${s.done ? "done" : ""} ${i === si && !resting ? "cur" : ""}" data-a="ss-dot" data-i="${i}" aria-label="Série ${i + 1}${s.done ? " faite" : ""}">${s.done ? s.r : i + 1}</button>`).join("")}</div>
    ${mid}
  </div>
  <div class="ss-nav"><button class="btn ghost" data-a="ss-prev" ${C.idx === 0 ? "disabled style='opacity:.3'" : ""}>← Précédent</button>
    ${isLast ? `<button class="btn ghost" data-a="ss-finish">Terminer</button>` : `<button class="btn ghost" data-a="ss-next">Passer →</button>`}</div>`;
}

function tickSession() {
  const C = S.current, tm = $("#ss-timer"); if (!C || !tm) return;
  const now = Date.now();
  if (C.step === "warmup") { tm.textContent = mmss((C.wuEnd - now) / 1000); return; }
  const ring = $("#ss-ring");
  if (C.hold) {
    const el = (now - C.hold) / 1000, it = C.items[C.idx];
    tm.textContent = Math.floor(el);
    if (ring) ring.style.setProperty("--p", clamp((el / it.hi) * 100, 0, 100));
    if (el >= it.hi && !beeped) { beeped = true; beep(); tm.classList.add("end"); }
    return;
  }
  if (C.restEnd) {
    const left = (C.restEnd - now) / 1000;
    if (left <= 0) { C.restEnd = 0; saveState(); beep(); renderSession(); return; }
    tm.textContent = mmss(left);
    if (ring) ring.style.setProperty("--p", clamp((left / C.restTotal) * 100, 0, 100));
  }
}
function startRest() { const C = S.current; C.restTotal = S.profile.rest; C.restEnd = Date.now() + C.restTotal * 1000; }
function readReps() { const v = Math.round(num($("#ss-reps") ? $("#ss-reps").value : NaN)); return isFinite(v) ? clamp(v, 0, 999) : null; }
function completeSet(value) {
  const C = S.current, it = C.items[C.idx], si = curSetIdx(it, C.sel); if (si < 0) return;
  const wasCorrection = it.sets[si].done;
  it.sets[si].r = value; it.sets[si].done = true; C.sel = null; C.hold = 0;
  if (!wasCorrection) {
    const left = it.sets.some((s) => !s.done), isLast = C.idx === C.items.length - 1;
    if (left) startRest();
    else if (!isLast) { C.idx++; startRest(); }
  }
  saveState(); renderSession();
}
ACTIONS["ss-step"] = (el) => { const inp = $("#ss-reps"), it = S.current.items[S.current.idx], st = it.unit === "s" ? 5 : 1; inp.value = Math.max(0, (Math.round(num(inp.value)) || 0) + +el.dataset.d * st); };
ACTIONS["ss-set"] = () => { unlockAudio(); const v = readReps(); if (v == null) return toast("Note le nombre que tu as fait"); completeSet(v); };
ACTIONS["ss-hold"] = () => { unlockAudio(); beeped = false; S.current.hold = Date.now(); saveState(); renderSession(); };
ACTIONS["ss-hold-stop"] = () => { const C = S.current; completeSet(Math.max(1, Math.round((Date.now() - C.hold) / 1000))); };
ACTIONS["ss-dot"] = (el) => {
  const C = S.current, it = C.items[C.idx], i = +el.dataset.i;
  C.restEnd = 0; C.hold = 0;
  if (it.sets[i].done) it.sets[i].done = false; // décocher pour corriger
  C.sel = i; saveState(); renderSession();
};
ACTIONS["ss-rest-add"] = () => { const C = S.current; C.restEnd += 15000; C.restTotal += 15; saveState(); tickSession(); };
ACTIONS["ss-rest-skip"] = () => { S.current.restEnd = 0; saveState(); renderSession(); };
function moveEx(d) { const C = S.current; C.idx = clamp(C.idx + d, 0, C.items.length - 1); C.sel = null; C.restEnd = 0; C.hold = 0; saveState(); renderSession(); }
ACTIONS["ss-next"] = () => moveEx(1);
ACTIONS["ss-prev"] = () => moveEx(-1);

ACTIONS["ss-menu"] = () => {
  const C = S.current;
  if (doneInfo || !C) return closeSession();
  const any = C.items.some((it) => it.sets.some((s) => s.done));
  openSheet(`<h2>Séance en cours</h2>
    <button class="btn primary" data-a="close-sheet">Continuer la séance</button>
    <button class="btn" data-a="ss-pause">⏸ Mettre en pause (reprendre plus tard)</button>
    ${any ? `<button class="btn" data-a="ss-finish">🏁 Terminer maintenant et enregistrer</button>` : ""}
    <button class="btn ghost danger" data-a="ss-abort">Abandonner sans enregistrer</button>`);
};
ACTIONS["ss-pause"] = () => { closeSheet(); closeSession(); };
ACTIONS["ss-abort"] = () => { if (!confirm("Abandonner cette séance sans l'enregistrer ?")) return; S.current = null; saveState(); closeSheet(); closeSession(); };

/* ---------- Fin de séance ---------- */
ACTIONS["ss-finish"] = () => {
  const C = S.current; closeSheet();
  const setsDone = C.items.reduce((a, it) => a + it.sets.filter((s) => s.done).length, 0);
  if (!setsDone) { if (confirm("Aucune série notée. Quitter la séance sans l'enregistrer ?")) { S.current = null; saveState(); closeSession(); } return; }
  const total = C.items.reduce((a, it) => a + it.sets.length, 0);
  if (setsDone < total && !confirm(`Il reste ${total - setsDone} série${total - setsDone > 1 ? "s" : ""} non faite${total - setsDone > 1 ? "s" : ""}. Terminer quand même ?`)) return;
  const before = {}; RECORD_TYPES.forEach((r) => { before[r.id] = bestRecord(r.id); });
  const lvBefore = levelInfo().lvl;
  const sess = {
    id: uid(), d: C.d, type: C.type, parkId: C.parkId, startedAt: C.startedAt, endedAt: Date.now(),
    items: C.items.map((it) => ({ key: it.key, exId: it.exId, origId: it.origId, kg: it.kg, mode: it.mode, unit: it.unit, lo: it.lo, hi: it.hi, cap: it.cap, sets: it.sets.map((s) => ({ r: s.r, done: s.done })) })),
  };
  S.sessions.push(sess); S.current = null;
  const proposals = evaluateSession(sess);
  saveState();
  const prs = RECORD_TYPES.filter((r) => before[r.id] > 0 && bestRecord(r.id) > before[r.id]).map((r) => ({ n: r.n, v: bestRecord(r.id) }));
  const badges = checkBadges();
  let reps = 0; sess.items.forEach((it) => it.sets.forEach((s) => { if (s.done && it.unit === "reps") reps += s.r; }));
  doneInfo = { sess, proposals, prs, badges, setsDone, reps, mins: Math.max(1, Math.round((sess.endedAt - sess.startedAt) / 60000)), lvlUp: levelInfo().lvl > lvBefore };
  beep(); renderSession();
};
function viewDone() {
  const D = doneInfo, lv = levelInfo();
  return `<div class="ss-mid" style="justify-content:flex-start;padding-top:10px">
    <div style="font-size:64px">🔥</div><h1>Séance terminée !</h1>
    <p class="muted">${D.sess.type === "C" ? "Belle séance technique. Chaque essai te rapproche du muscle-up." : "Bien joué. Va manger : c'est maintenant que ça se construit."}</p>
    <div class="grid3"><div class="tile"><b>${D.setsDone}</b><span class="muted small">séries</span></div><div class="tile"><b>${D.reps}</b><span class="muted small">reps</span></div><div class="tile"><b>${D.mins}</b><span class="muted small">min</span></div></div>
    <div class="card" style="text-align:left"><div class="row between"><b>+100 XP${D.badges.length ? ` · +${D.badges.length * 50} XP de badges` : ""}</b><span class="pill acc">Niv. ${lv.lvl}${D.lvlUp ? " ⬆" : ""}</span></div><div class="bar"><i style="width:${Math.max(2, lv.pct)}%"></i></div>
      ${D.prs.map((p) => `<p>🏅 Nouveau record de ${p.n.toLowerCase()} : <b>${p.v}</b></p>`).join("")}
      ${D.badges.map((b) => `<p>${b.ic} Nouveau badge : <b>${b.n}</b></p>`).join("")}</div>
    <div style="text-align:left" class="stack">${proposalsHtml()}</div>
    ${D.sess.type === "C" && !S.muscleUp ? `<button class="btn" data-a="mu-done">👑 J'ai passé un muscle-up aujourd'hui !</button>` : ""}
    <button class="btn primary big" data-a="ss-close">Retour à l'accueil</button></div>`;
}
ACTIONS["ss-close"] = () => { closeSession(); go("home"); };
