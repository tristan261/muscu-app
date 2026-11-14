/* FORGE — stockage (localStorage + IndexedDB pour les photos) et utilitaires */
"use strict";

const STORE_KEY = "forge.v1";

function defaultState() {
  return {
    v: 1,
    onboarded: false,
    profile: {
      name: "", birth: "", height: 180, startKg: 56, goalKg: 70,
      goal3Kg: 61.5, goal3Date: "2027-02-15", goalDate: "2028-04-30",
      kcal: 3000, prot: 110, rest: 90,
      med: true, medName: "", holiday: false,
      days: { A: 3, B: 6, C: 0 }, // 0 = dimanche … 6 = samedi
    },
    weights: [], measures: [], records: [], sessions: [],
    prog: {}, pending: [],
    parks: [], parkLast: null,
    plans: {}, mealChecks: {}, shop: {},
    reminders: {
      week: ["07:00", "12:15", "16:30", "19:30", "22:00"],
      weekend: ["09:30", "12:30", "16:30", "19:30", "22:00"],
    },
    badges: {}, photos: [], muscleUp: null, kcalBumps: [],
    current: null,
  };
}

let S = defaultState();

function mergeState(raw) {
  const d = defaultState();
  const out = Object.assign(d, raw || {});
  out.profile = Object.assign(defaultState().profile, (raw && raw.profile) || {});
  out.profile.days = Object.assign({ A: 3, B: 6, C: 0 }, (raw && raw.profile && raw.profile.days) || {});
  out.reminders = Object.assign(defaultState().reminders, (raw && raw.reminders) || {});
  return out;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    S = mergeState(raw ? JSON.parse(raw) : null);
  } catch (e) {
    console.error("Lecture des données impossible", e);
    S = defaultState();
  }
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
const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => ymd(new Date());
const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
const weekKey = (s) => { const d = parseYmd(s); const wd = (d.getDay() + 6) % 7; return addDays(s, -wd); }; // lundi
const dayIdx = (s) => (parseYmd(s).getDay() + 6) % 7; // 0 = lundi
const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAYS_JS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const frDate = (s) => { const d = parseYmd(s); return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`; };
const frDateLong = (s) => { const d = parseYmd(s); return `${DAYS_JS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`; };
const frShort = (s) => { const d = parseYmd(s); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; };
const frMonth = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS_FR[m - 1]} ${y}`; };

/* ---------- Divers ---------- */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtKg = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : NaN; };

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

// Réduit une photo (max 1280 px) et la convertit en JPEG
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

/* ---------- Export / import ---------- */
async function exportData() {
  const photos = await photoAll().catch(() => ({}));
  const data = { app: "forge", v: 1, exportedAt: new Date().toISOString(), state: S, photos };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `forge-sauvegarde-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importData(file) {
  const txt = await file.text();
  const data = JSON.parse(txt);
  if (!data || data.app !== "forge" || !data.state) throw new Error("Ce fichier n'est pas une sauvegarde FORGE.");
  S = mergeState(data.state);
  S.current = null;
  saveState();
  await photoClear();
  for (const id of Object.keys(data.photos || {})) await photoPut(id, data.photos[id]);
}
