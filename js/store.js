/* FORGE V2 — stockage (localStorage + IndexedDB pour les photos), migration V1 → V2, utilitaires */
"use strict";

var STORE_KEY = "forge.v2";
var STORE_KEY_V1 = "forge.v1";

function defaultState() {
  return {
    v: 2,
    profile: {
      name: "", birth: "", height: 180, startKg: null, goalKg: 70,
      goal3Kg: 61.5, goal3Date: "2027-02-15", goalDate: "2028-04-30",
      kcalBase: 3000, kcal: 3000, prot: 110, rest: 90,
      level: { tractions: 8, dips: 8, pompes: 10 }, // niveau de départ (modifiable), remplacé par tes vrais records
      med: true, medName: "", days: [3, 6, 0], // jours habituels (0 = dimanche)
    },
    weights: [], measures: [], records: [], sessions: [],
    prog: {},            // progression par échelle
    mu: { last: {}, g2: null, g3: null }, // piste muscle-up
    muscleUp: null,
    weeks: {},           // semaines planifiées : { lundi: { slots: [{ d, type, light, done }], msg } }
    parks: [], parkLast: null,
    plans: {}, mealChecks: {}, shop: {}, likes: {},
    reminders: {
      week: ["07:00", "12:15", "16:30", "19:30", "22:00"],
      weekend: ["09:30", "12:30", "16:30", "19:30", "22:00"],
    },
    badges: {}, photos: [], kcalBumps: [],
    current: null,
  };
}

let S = defaultState();

function mergeState(raw) {
  const d = defaultState(), out = Object.assign(defaultState(), raw || {});
  out.profile = Object.assign(d.profile, (raw && raw.profile) || {});
  out.profile.level = Object.assign(defaultState().profile.level, (raw && raw.profile && raw.profile.level) || {});
  out.reminders = Object.assign(d.reminders, (raw && raw.reminders) || {});
  out.mu = Object.assign(d.mu, (raw && raw.mu) || {});
  out.v = 2;
  return out;
}

/* ---------- Migration V1 → V2 : on garde profil, poids, parcs, photos, records, séances, badges ---------- */
function migrateV1(v1) {
  const s = defaultState(), p1 = v1.profile || {};
  ["name", "birth", "height", "startKg", "goalKg", "goal3Kg", "goal3Date", "goalDate", "prot", "rest", "med", "medName"].forEach((k) => {
    if (p1[k] !== undefined && p1[k] !== null && p1[k] !== "") s.profile[k] = p1[k];
  });
  const kcal = Number(p1.kcal) || 3000;
  s.profile.kcalBase = Math.min(kcal, 3000); // la cible de départ : on ne descendra jamais dessous
  s.profile.kcal = kcal;
  if (p1.days) s.profile.days = ["A", "B", "C"].map((t) => p1.days[t]).filter((d) => d !== undefined);
  if (s.profile.days.length !== 3) s.profile.days = [3, 6, 0];
  s.weights = (v1.weights || []).filter((w) => w && w.d && w.kg > 0).map((w) => ({ d: w.d, kg: w.kg }));
  s.measures = v1.measures || [];
  s.records = v1.records || [];
  s.parks = v1.parks || [];
  s.parkLast = v1.parkLast || null;
  s.photos = v1.photos || [];
  s.muscleUp = v1.muscleUp || null;
  s.kcalBumps = v1.kcalBumps || [];
  if (v1.reminders && v1.reminders.week && v1.reminders.week.length === 5) s.reminders = v1.reminders;
  // badges : on garde ceux qui existent encore
  Object.keys(v1.badges || {}).forEach((id) => { if (BADGES.some((b) => b.id === id)) s.badges[id] = v1.badges[id]; });
  // séances : A/B/C deviennent S1/S2/S3, les séries sont conservées (records, calendrier)
  const map = { A: "S1", B: "S2", C: "S3" };
  s.sessions = (v1.sessions || []).map((x) => ({
    id: x.id, d: x.d, type: map[x.type] || x.type, v1: true, startedAt: x.startedAt, endedAt: x.endedAt,
    items: (x.items || []).map((it) => ({ exId: it.exId, kg: it.kg || 0, unit: it.unit || "reps", sets: (it.sets || []).map((st) => ({ r: st.r, done: !!st.done })) })),
  }));
  // repas cochés : anciens noms → nouveaux (matin, midi, goûter, soir)
  const slotMap = { pdj: "matin", midi: "midi", gouter: "gouter", diner: "soir" };
  Object.keys(v1.mealChecks || {}).forEach((d) => {
    const c = {};
    Object.keys(v1.mealChecks[d]).forEach((k) => { if (slotMap[k] && v1.mealChecks[d][k]) c[slotMap[k]] = true; });
    if (Object.keys(c).length) s.mealChecks[d] = c;
  });
  return s;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { S = mergeState(JSON.parse(raw)); return "v2"; }
    const old = localStorage.getItem(STORE_KEY_V1);
    if (old) {
      S = migrateV1(JSON.parse(old));
      saveState(); // forge.v1 est laissé intact, comme copie de secours
      return "migrated";
    }
  } catch (e) {
    console.error("Lecture des données impossible", e);
  }
  S = defaultState();
  return "new";
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
  } catch (e) {
    console.error("Sauvegarde impossible", e);
    if (typeof toast === "function") toast("⚠️ Sauvegarde impossible : mémoire pleine ?");
  }
}

/* ---------- Dates ---------- */
var TODAY_OVERRIDE = null; // pour les tests automatiques
const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => TODAY_OVERRIDE || ymd(new Date());
const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
const weekKey = (s) => { const d = parseYmd(s); const wd = (d.getDay() + 6) % 7; return addDays(s, -wd); }; // lundi
const dayIdx = (s) => (parseYmd(s).getDay() + 6) % 7; // 0 = lundi
const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dayName = (s) => DAYS_FR[dayIdx(s)].toLowerCase();
const frDate = (s) => { const d = parseYmd(s); return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`; };
const frDateLong = (s) => `${dayName(s)} ${frDate(s)}`;
const frShort = (s) => { const d = parseYmd(s); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; };
const frMonth = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS_FR[m - 1]} ${y}`; };

/* ---------- Divers ---------- */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtKg = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : NaN; };
const sum = (a) => a.reduce((x, y) => x + y, 0);

/* ---------- IndexedDB : photos (restent sur le téléphone) ---------- */
let _db = null;
function idb() {
  if (_db) return Promise.resolve(_db);
  return new Promise((res, rej) => {
    const rq = indexedDB.open("forge-photos", 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore("photos");
    rq.onsuccess = () => { _db = rq.result; res(_db); };
    rq.onerror = () => rej(rq.error);
  });
}
function idbOp(mode, fn) {
  return idb().then((db) => new Promise((res, rej) => {
    const tx = db.transaction("photos", mode);
    const rq = fn(tx.objectStore("photos"));
    tx.oncomplete = () => res(rq && rq.result);
    tx.onerror = () => rej(tx.error);
  }));
}
const photoPut = (id, data) => idbOp("readwrite", (st) => st.put(data, id));
const photoGet = (id) => idbOp("readonly", (st) => st.get(id));
const photoDel = (id) => idbOp("readwrite", (st) => st.delete(id));
function photoAll() {
  return idb().then((db) => new Promise((res, rej) => {
    const out = {};
    const rq = db.transaction("photos", "readonly").objectStore("photos").openCursor();
    rq.onsuccess = () => { const c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
    rq.onerror = () => rej(rq.error);
  }));
}
const photoClear = () => idbOp("readwrite", (st) => st.clear());

function fileToDataUrl(file, max = 1280) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Image illisible")); };
    img.src = url;
  });
}

/* ---------- Export / import (accepte aussi les sauvegardes V1) ---------- */
async function exportData() {
  const photos = await photoAll().catch(() => ({}));
  const data = { app: "forge", v: 2, exportedAt: new Date().toISOString(), state: S, photos };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `forge-sauvegarde-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function stateFromBackup(data) {
  if (!data || data.app !== "forge" || !data.state) throw new Error("Ce fichier n'est pas une sauvegarde FORGE.");
  return data.state.v === 2 ? mergeState(data.state) : migrateV1(data.state);
}
async function importData(file) {
  const data = JSON.parse(await file.text());
  S = stateFromBackup(data);
  S.current = null;
  saveState();
  await photoClear();
  for (const id of Object.keys(data.photos || {})) await photoPut(id, data.photos[id]);
}
