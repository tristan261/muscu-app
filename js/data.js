/* FORGE V2 — données : exercices, échelles de progression, séances, repas, badges */
"use strict";

const EQUIP = [
  { id: "barre", n: "Barre fixe (tractions)" },
  { id: "paralleles", n: "Barres parallèles" },
  { id: "basse", n: "Barre basse" },
  { id: "espalier", n: "Espalier" },
  { id: "banc", n: "Banc" },
  { id: "monkey", n: "Monkey bars (échelle horizontale)" },
];

/* needs : liste de possibilités (il suffit qu'UNE soit entièrement présente). subs : remplaçants, dans l'ordre. */
const EXERCISES = {
  // ---------- TIRAGE VERTICAL ----------
  neg_traction: { n: "Tractions négatives", needs: [["barre"], ["monkey"]], subs: ["rowing_australien", "superman"],
    how: "Monte menton au-dessus de la barre en sautant, puis descends le plus lentement possible (3 à 5 secondes) jusqu'aux bras tendus.",
    errs: "Se laisser tomber. Ne pas aller jusqu'aux bras tendus." },
  traction: { n: "Tractions", needs: [["barre"], ["monkey"]], subs: ["rowing_australien", "superman"],
    how: "Mains en pronation (paumes vers l'avant), un peu plus larges que les épaules. Pars bras tendus, épaules basses. Tire les coudes vers les hanches jusqu'à passer le menton au-dessus de la barre, puis redescends en contrôlant.",
    errs: "Se balancer ou donner des coups de jambes. Demi-reps (bras pas tendus en bas). Hausser les épaules vers les oreilles." },
  traction_pause: { n: "Tractions avec pause en haut", needs: [["barre"], ["monkey"]], subs: ["traction", "rowing_australien", "superman"],
    how: "Traction stricte, puis tiens 2 secondes menton au-dessus de la barre avant de redescendre lentement.",
    errs: "Raccourcir la pause. Tendre le cou pour passer le menton." },
  traction_poitrine: { n: "Tractions poitrine à la barre", needs: [["barre"]], subs: ["traction_pause", "traction", "rowing_australien", "superman"],
    how: "Tire jusqu'à ce que le haut de la poitrine touche la barre, coudes vers l'arrière, buste légèrement incliné. Descente contrôlée.",
    errs: "S'arrêter au menton. Donner un coup de reins." },
  traction_supi: { n: "Tractions supination", needs: [["barre"]], subs: ["traction", "rowing_supi", "superman"],
    how: "Paumes vers toi, mains largeur d'épaules. Tire la poitrine vers la barre, coudes près du corps. Descente en 2 secondes.",
    errs: "Lâcher la descente d'un coup. S'arrêter avant d'avoir les bras tendus." },
  traction_supi_pause: { n: "Tractions supination avec pause en haut", needs: [["barre"]], subs: ["traction_supi", "traction", "rowing_supi", "superman"],
    how: "Traction supination, puis 2 secondes de pause en haut, menton au-dessus de la barre.",
    errs: "Pause trop courte. Balancer." },
  // ---------- TIRAGE HORIZONTAL ----------
  rowing_plie: { n: "Rowing australien jambes pliées", needs: [["basse"], ["espalier"], ["paralleles"]], subs: ["superman"],
    how: "Sous une barre basse (ou un barreau de l'espalier, ou sous les parallèles), pieds à plat, genoux pliés. Tire la poitrine à la barre en serrant les omoplates.",
    errs: "Pousser avec les jambes. Ne pas aller jusqu'à la barre." },
  rowing_australien: { n: "Rowing australien jambes tendues", needs: [["basse"], ["espalier"], ["paralleles"]], subs: ["traction_lente", "superman"],
    how: "Sous la barre, corps gainé en planche, talons au sol. Tire la poitrine jusqu'à la barre en serrant les omoplates, puis redescends bras tendus.",
    errs: "Laisser tomber le bassin. Tirer avec la tête en avant." },
  rowing_sureleve: { n: "Rowing australien pieds surélevés", needs: [["basse", "banc"], ["espalier"], ["paralleles", "banc"]], subs: ["rowing_australien", "traction_lente", "superman"],
    how: "Même mouvement, pieds posés en hauteur (banc ou barreau) : le corps est à l'horizontale.",
    errs: "Casser le gainage. Raccourcir le mouvement." },
  rowing_archer: { n: "Rowing archer", needs: [["basse"], ["espalier"]], subs: ["rowing_sureleve", "rowing_australien", "traction_lente", "superman"],
    how: "Prise large. Tire vers une main pendant que l'autre bras reste presque tendu, change de côté à chaque rep. Compte le total.",
    errs: "Tourner le bassin. Plier le bras qui doit rester tendu." },
  rowing_supi: { n: "Rowing australien supination", needs: [["basse"], ["espalier"], ["paralleles"]], subs: ["superman"],
    how: "Rowing australien paumes vers toi, coudes près du corps.", errs: "Laisser tomber le bassin." },
  traction_lente: { n: "Tractions lentes (3 s à la descente)", needs: [["barre"], ["monkey"]], subs: ["superman"],
    how: "Traction normale à la montée, 3 secondes pour redescendre.", errs: "Accélérer la descente.", spec: { lo: 4, hi: 6, unit: "reps" } },
  superman: { n: "Superman tirage au sol", needs: null, subs: [],
    how: "Allongé sur le ventre, bras tendus devant. Décolle la poitrine et tire les coudes vers les hanches en serrant les omoplates, 2 secondes en haut.",
    errs: "Aller trop vite. Casser la nuque.", spec: { lo: 10, hi: 15, unit: "reps" } },
  // ---------- DIPS ----------
  dips_banc: { n: "Dips au banc", needs: [["banc"]], subs: ["pompes_diamant"],
    how: "Dos au banc, mains au bord, jambes tendues. Descends en pliant les coudes vers l'arrière jusqu'à 90°, puis repousse.",
    errs: "Éloigner les fesses du banc. Descendre trop bas." },
  dips: { n: "Dips", needs: [["paralleles"]], subs: ["dips_barre", "dips_banc", "pompes_diamant"],
    how: "En appui bras tendus sur les parallèles. Descends buste légèrement penché jusqu'à avoir les épaules au niveau des coudes, puis repousse jusqu'aux bras tendus.",
    errs: "Descendre trop bas en forçant sur les épaules. Hausser les épaules. Demi-reps." },
  dips_tempo: { n: "Dips tempo (3 s en descente)", needs: [["paralleles"]], subs: ["dips_banc", "pompes_diamant"],
    how: "Dips avec 3 secondes pour descendre, puis remontée dynamique.", errs: "Accélérer la descente quand ça devient dur." },
  dips_barre: { n: "Dips à la barre droite", needs: [["barre"], ["basse"]], subs: ["dips_tempo", "dips_banc", "pompes_diamant"],
    how: "En appui au-dessus de la barre, bras tendus. Descends jusqu'à ce que la barre touche le bas de la poitrine, buste penché, puis repousse. C'est la fin du muscle-up.",
    errs: "Descendre à moitié. Coudes qui partent sur les côtés." },
  // ---------- POMPES ----------
  pompes: { n: "Pompes", needs: null, subs: [],
    how: "Mains un peu plus larges que les épaules, corps gainé. Descends la poitrine jusqu'à frôler le sol, coudes à 45° du corps, puis repousse.",
    errs: "Bassin qui tombe ou fesses en l'air. Demi-reps. Coudes complètement écartés." },
  pompes_sureleves: { n: "Pompes pieds surélevés", needs: [["banc"], ["espalier"], ["basse"]], subs: ["pompes_diamant"],
    how: "Pieds sur le banc, mains au sol, corps gainé. Descends la poitrine au sol.", errs: "Cambrer. Tête qui plonge." },
  pompes_diamant: { n: "Pompes diamant", needs: null, subs: [],
    how: "Mains rapprochées sous la poitrine, coudes serrés le long du corps.", errs: "Écarter les coudes. Bassin qui tombe." },
  pompes_archer: { n: "Pompes archer", needs: null, subs: [],
    how: "Mains très écartées. Descends vers une main, l'autre bras reste tendu. Alterne. Compte le total.", errs: "Tourner le bassin." },
  pompes_pseudo: { n: "Pompes pseudo-planche", needs: null, subs: [],
    how: "Mains à hauteur des hanches, doigts vers l'extérieur, épaules en avant des mains. Descends en gardant les épaules penchées vers l'avant.",
    errs: "Reculer les épaules. Écarter les coudes. Y aller sans échauffer les poignets." },
  pompes_explosives: { n: "Pompes explosives", needs: null, subs: [],
    how: "Descends en contrôle puis pousse fort pour décoller les mains. Amortis la réception. Peu de reps, toutes rapides.",
    errs: "Réception bras tendus. Continuer quand la vitesse baisse." },
  // ---------- JAMBES ----------
  squats: { n: "Squats", needs: null, subs: [],
    how: "Pieds largeur d'épaules. Descends les fesses en arrière, cuisses au moins parallèles au sol, dos droit, talons au sol.",
    errs: "Genoux qui rentrent. Talons qui décollent. Dos rond." },
  squat_bulgare: { n: "Squat bulgare (pied arrière sur le banc)", needs: [["banc"], ["espalier"]], subs: ["fentes_arriere"], perSide: true,
    how: "Un pied posé derrière toi sur le banc. Descends sur la jambe avant, cuisse parallèle au sol, buste droit.",
    errs: "Genou avant vers l'intérieur. Pied avant trop près du banc." },
  pistol_assiste: { n: "Pistol squat assisté", needs: [["espalier"], ["paralleles"], ["barre"], ["basse"]], subs: ["squat_bulgare", "fentes_arriere"], perSide: true,
    how: "Sur une jambe, l'autre tendue devant, en te tenant à un poteau ou un barreau. Descends le plus bas possible et remonte en t'aidant le moins possible des bras.",
    errs: "Tirer fort avec les bras. Talon qui décolle." },
  pistol: { n: "Pistol squat", needs: null, subs: [], perSide: true,
    how: "Squat complet sur une jambe, l'autre tendue devant, bras devant pour l'équilibre.", errs: "Genou qui rentre. Tomber en bas sans contrôle." },
  fentes_arriere: { n: "Fentes arrière", needs: null, subs: [], perSide: true,
    how: "Un grand pas en arrière, genou arrière qui frôle le sol, puis reviens.", errs: "Buste penché. Pas trop petit." },
  fentes: { n: "Fentes", needs: null, subs: [], perSide: true,
    how: "Un grand pas en avant, descends jusqu'à ce que le genou arrière frôle le sol, buste droit. Repousse pour revenir.",
    errs: "Genou avant qui dépasse beaucoup la pointe du pied. Buste penché." },
  fentes_sautees: { n: "Fentes sautées", needs: null, subs: [], perSide: true,
    how: "En position de fente, saute et change de jambe en l'air. Amortis chaque réception.", errs: "Genou arrière qui tape le sol." },
  // ---------- GAINAGE ----------
  gainage: { n: "Planche", needs: null, subs: [], unit: "s",
    how: "Sur les avant-bras et les pointes de pieds, corps droit de la tête aux talons. Serre abdos et fesses, respire.",
    errs: "Fesses trop hautes ou bassin qui tombe. Bloquer sa respiration." },
  hollow: { n: "Hollow hold", needs: null, subs: [], unit: "s",
    how: "Sur le dos, bas du dos plaqué au sol, décolle les épaules et les jambes tendues, bras le long des oreilles. Forme de banane.",
    errs: "Bas du dos qui décolle : dans ce cas, plie un peu les genoux." },
  releve_genoux: { n: "Relevés de genoux suspendu", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["releve_paralleles", "releve_sol"],
    how: "Suspendu à la barre, monte les genoux vers la poitrine en enroulant le bassin, redescends lentement sans te balancer.",
    errs: "Prendre de l'élan. Laisser retomber les jambes." },
  releve_jambes: { n: "Relevés de jambes suspendu", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["releve_paralleles", "releve_sol"],
    how: "Suspendu, monte les jambes tendues jusqu'à l'horizontale en enroulant le bassin. Redescends en 2 secondes.",
    errs: "Se balancer. Monter avec l'élan." },
  releve_paralleles: { n: "Relevés de jambes aux parallèles", needs: [["paralleles"]], subs: ["releve_sol"],
    how: "En appui bras tendus sur les parallèles, monte les genoux ou les jambes à l'horizontale.", errs: "S'affaisser dans les épaules." },
  releve_sol: { n: "Relevés de jambes au sol", needs: null, subs: [],
    how: "Sur le dos, mains sous les fesses, monte les jambes tendues à la verticale puis redescends sans toucher le sol.", errs: "Creuser le bas du dos." },
  lsit_groupe: { n: "L-sit groupé (genoux pliés)", needs: [["paralleles"]], subs: ["lsit_sol"], unit: "s",
    how: "En appui bras tendus sur les parallèles, épaules basses, monte les genoux à hauteur des hanches et tiens.",
    errs: "S'enfoncer dans les épaules. Plier les bras." },
  lsit_une_jambe: { n: "L-sit une jambe tendue", needs: [["paralleles"]], subs: ["lsit_sol"], unit: "s",
    how: "Comme le L-sit groupé, avec une jambe tendue à l'horizontale. Change de jambe à chaque série.", errs: "Jambe tendue qui tombe." },
  lsit: { n: "L-sit", needs: [["paralleles"]], subs: ["lsit_suspendu", "lsit_sol"], unit: "s",
    how: "En appui bras tendus, pousse les épaules vers le bas et tiens les deux jambes tendues à l'horizontale.",
    errs: "Épaules qui remontent. Dos rond et jambes qui tombent." },
  lsit_suspendu: { n: "L-sit suspendu à la barre", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["lsit_sol"], unit: "s",
    how: "Suspendu, monte les jambes tendues à l'horizontale et tiens.", errs: "Se balancer." },
  lsit_sol: { n: "L-sit au sol (groupé)", needs: null, subs: [], unit: "s",
    how: "Assis, mains à plat à côté des hanches. Pousse fort dans le sol pour décoller les fesses, genoux pliés.", errs: "Hausser les épaules." },
  // ---------- MUSCLE-UP ----------
  traction_explosive: { n: "Tractions explosives", needs: [["barre"], ["monkey"]], subs: ["rowing_explosif", "pompes_explosives"],
    how: "Comme une traction, mais tire le plus VITE et le plus HAUT possible : vise la barre à la poitrine. Tire la barre « vers tes hanches ». Compte seulement les reps où la poitrine arrive à la barre.",
    errs: "Faire trop de reps et perdre la vitesse. Lâcher la descente." },
  rowing_explosif: { n: "Rowing australien explosif", needs: [["basse"], ["espalier"], ["paralleles"]], subs: ["pompes_explosives"],
    how: "Rowing australien en tirant le plus vite possible, poitrine à la barre.", errs: "Perdre le gainage." },
  suspension: { n: "Suspension active", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["gainage"], unit: "s",
    how: "Suspendu bras tendus, tire les épaules vers le bas (loin des oreilles) et tiens. Serre fort la barre, pouces autour.",
    errs: "Hausser les épaules. Plier les bras." },
  mu_negative: { n: "Négatives de muscle-up (5 s)", needs: [["barre"]], subs: ["dips_tempo", "dips_banc", "pompes_diamant"],
    how: "Monte en appui au-dessus de la barre (en sautant). Descends en 5 secondes : le dips, puis la transition poitrine collée à la barre, puis la traction.",
    errs: "Tomber d'un coup pendant la transition. Écarter la poitrine de la barre." },
  mu_transition: { n: "Transition de muscle-up sur barre basse", needs: [["basse"], ["paralleles"]], subs: ["dips_barre", "dips_tempo", "pompes_diamant"],
    how: "Sur une barre à hauteur de poitrine (ou une barre parallèle), pieds au sol : tire, passe les coudes au-dessus de la barre en roulant les poignets, puis pousse. Aide-toi des jambes le moins possible.",
    errs: "Passer un coude après l'autre. Sauter au lieu de tirer." },
  muscle_up: { n: "Essais de muscle-up", needs: [["barre"]], subs: ["traction_explosive", "pompes_explosives"],
    how: "Frais, un essai à la fois. Prise un peu plus large que les épaules, léger balancier, tire explosif en amenant la barre vers les hanches, passe le buste au-dessus, puis pousse. Repos complet entre les essais. Arrête dès que la technique se dégrade.",
    errs: "Passer un coude après l'autre (« aile de poulet »). Enchaîner les essais fatigué." },
  mobilite_epaules: { n: "Mobilité des épaules", needs: null, subs: [], unit: "s",
    how: "30 secondes : grands cercles de bras lents, puis suspension passive à la barre si tu en as une (épaules relâchées, respire). Rien ne doit faire mal.",
    errs: "Forcer sur une position douloureuse." },
};

/* Échelles de progression, de la variante la plus facile à la plus dure.
   lo-hi : fourchette de reps (ou de secondes). start : barreau de départ. rec : record associé. */
const LADDERS = {
  pullV: { n: "Tirage vertical", start: 1, rec: "tractions", rungs: [
    { ex: "neg_traction", lo: 3, hi: 5 }, { ex: "traction", lo: 6, hi: 10 }, { ex: "traction_pause", lo: 5, hi: 8 },
    { ex: "traction_poitrine", lo: 4, hi: 8 }, { ex: "traction", lo: 5, hi: 8, weighted: true }] },
  pullH: { n: "Tirage horizontal", start: 1, rungs: [
    { ex: "rowing_plie", lo: 8, hi: 12 }, { ex: "rowing_australien", lo: 8, hi: 12 }, { ex: "rowing_sureleve", lo: 8, hi: 12 }, { ex: "rowing_archer", lo: 6, hi: 10 }] },
  supi: { n: "Tractions supination", start: 0, rungs: [
    { ex: "traction_supi", lo: 5, hi: 8 }, { ex: "traction_supi_pause", lo: 4, hi: 8 }, { ex: "traction_supi", lo: 5, hi: 8, weighted: true }] },
  dips: { n: "Dips", start: 1, rec: "dips", rungs: [
    { ex: "dips_banc", lo: 8, hi: 12 }, { ex: "dips", lo: 6, hi: 10 }, { ex: "dips_tempo", lo: 5, hi: 8 },
    { ex: "dips_barre", lo: 5, hi: 8 }, { ex: "dips", lo: 5, hi: 8, weighted: true }] },
  push: { n: "Pompes", start: 0, rec: "pompes", rungs: [
    { ex: "pompes", lo: 10, hi: 15 }, { ex: "pompes_sureleves", lo: 8, hi: 12 }, { ex: "pompes_diamant", lo: 8, hi: 12 },
    { ex: "pompes_archer", lo: 6, hi: 10 }, { ex: "pompes_pseudo", lo: 5, hi: 8 }] },
  legs: { n: "Squats", start: 0, rungs: [
    { ex: "squats", lo: 15, hi: 20 }, { ex: "squat_bulgare", lo: 8, hi: 12 }, { ex: "pistol_assiste", lo: 5, hi: 8 }, { ex: "pistol", lo: 3, hi: 6 }] },
  lunge: { n: "Fentes", start: 0, rungs: [{ ex: "fentes", lo: 10, hi: 12 }, { ex: "fentes_sautees", lo: 8, hi: 12 }] },
  core: { n: "Gainage", start: 2, rungs: [
    { ex: "gainage", lo: 30, hi: 60, unit: "s" }, { ex: "hollow", lo: 20, hi: 40, unit: "s" }, { ex: "releve_genoux", lo: 8, hi: 12 },
    { ex: "releve_jambes", lo: 6, hi: 10 }, { ex: "lsit", lo: 10, hi: 20, unit: "s" }] },
  lsit: { n: "L-sit", start: 0, rungs: [
    { ex: "lsit_groupe", lo: 10, hi: 20, unit: "s" }, { ex: "lsit_une_jambe", lo: 8, hi: 15, unit: "s" }, { ex: "lsit", lo: 8, hi: 15, unit: "s" }] },
};

/* Les 3 séances. mu : bloc muscle-up (dépend de la porte). main : gardé dans la version 30 min.
   volume : séries modérées, sans progression. fixed : exercice fixe, sans échelle. */
const SESSIONS = {
  S1: { n: "Tirage + muscle-up", short: "Tirage", heavy: true, slots: [
    { mu: true, main: true }, { ladder: "pullV", sets: 3, main: true }, { ladder: "pullH", sets: 3, main: true }, { ladder: "supi", sets: 3 }, { ladder: "core", sets: 3 }] },
  S2: { n: "Poussée + jambes", short: "Poussée", heavy: true, slots: [
    { ladder: "dips", sets: 4, main: true }, { ladder: "push", sets: 4, main: true }, { ladder: "legs", sets: 4, main: true }, { ladder: "lunge", sets: 3 }, { ladder: "core", sets: 3 }] },
  S3: { n: "Technique + volume", short: "Technique", heavy: false, slots: [
    { mu: true, main: true, max: 2 }, { fixed: "pompes_explosives", key: "explo", sets: 3, lo: 5, hi: 5 }, { ladder: "lsit", sets: 3, main: true },
    { ladder: "dips", sets: 2, volume: true, main: true }, { ladder: "pullV", sets: 2, volume: true }, { fixed: "mobilite_epaules", key: "mob", sets: 2, lo: 30, hi: 30, unit: "s" }] },
};

/* Bloc muscle-up selon l'étape (0 : avant la porte 1 … 3 : essais). */
const MU_BLOCKS = [
  [{ key: "mu_exp", ex: "traction_explosive", sets: 4, lo: 3, hi: 3 }, { key: "mu_hang", ex: "suspension", sets: 3, lo: 20, hi: 30, unit: "s" }],
  [{ key: "mu_exp", ex: "traction_explosive", sets: 5, lo: 3, hi: 5 }, { key: "mu_hang", ex: "suspension", sets: 2, lo: 30, hi: 30, unit: "s" }],
  [{ key: "mu_neg", ex: "mu_negative", sets: 3, lo: 2, hi: 3 }, { key: "mu_tr", ex: "mu_transition", sets: 3, lo: 3, hi: 5 }, { key: "mu_dipsb", ex: "dips_barre", sets: 3, lo: 5, hi: 8 }],
  [{ key: "mu_try", ex: "muscle_up", sets: 6, lo: 1, hi: 1, tries: true }, { key: "mu_neg", ex: "mu_negative", sets: 3, lo: 2, hi: 3 }],
];
const MU_GATES = [
  { n: "Porte 1", d: "10 tractions strictes + 10 dips propres" },
  { n: "Porte 2", d: "5 tractions explosives poitrine à la barre" },
  { n: "Porte 3", d: "3 négatives de muscle-up contrôlées (5 s)" },
  { n: "Muscle-up", d: "Premier muscle-up validé" },
];

const WARMUP = [
  { t: "Épaules", d: "Grands cercles de bras : 10 dans chaque sens" },
  { t: "Poignets", d: "Rotations des poignets, puis mains au sol, penche-toi doucement vers l'avant 10 fois" },
  { t: "Scapula pull-ups", d: "Suspendu bras tendus : 2 × 8, monte et descends juste les épaules" },
  { t: "Reps faciles", d: "5 tractions faciles, 5 dips faciles, 10 pompes lentes, 10 squats" },
  { t: "Gainage", d: "20 secondes de planche pour finir" },
];

/* ---------- ALIMENTATION ---------- */
const RAYONS = ["Fruits & légumes", "Crèmerie", "Boulangerie", "Viandes & poissons", "Épicerie", "Surgelés", "Boissons"];
const ING = {
  lait: { n: "Lait entier", r: "Crèmerie", u: "ml" },
  oeufs: { n: "Œufs", r: "Crèmerie", u: "pc" },
  beurre: { n: "Beurre", r: "Crèmerie", u: "g" },
  emmental: { n: "Emmental (râpé ou en tranches)", r: "Crèmerie", u: "g" },
  yaourt: { n: "Yaourts au lait entier", r: "Crèmerie", u: "pc" },
  yaourt_grec: { n: "Yaourts à la grecque", r: "Crèmerie", u: "pc" },
  fromage_blanc: { n: "Fromage blanc entier", r: "Crèmerie", u: "g" },
  creme: { n: "Crème fraîche", r: "Crèmerie", u: "g" },
  riz_au_lait: { n: "Riz au lait (pots)", r: "Crèmerie", u: "pc", pk: "pots" },
  pain: { n: "Pain / baguette", r: "Boulangerie", u: "g" },
  pain_mie: { n: "Pain de mie complet", r: "Boulangerie", u: "pc", pk: "tranches" },
  pain_lait: { n: "Pains au lait", r: "Boulangerie", u: "pc" },
  tortillas: { n: "Tortillas de blé (wraps)", r: "Boulangerie", u: "pc" },
  flocons: { n: "Flocons d'avoine", r: "Épicerie", u: "g" },
  pb: { n: "Beurre de cacahuète", r: "Épicerie", u: "g" },
  cacao: { n: "Cacao en poudre non sucré", r: "Épicerie", u: "g" },
  miel: { n: "Miel", r: "Épicerie", u: "g" },
  granola: { n: "Muesli / granola", r: "Épicerie", u: "g" },
  pates: { n: "Pâtes", r: "Épicerie", u: "g" },
  riz: { n: "Riz", r: "Épicerie", u: "g" },
  riz_express: { n: "Riz micro-ondes (sachets 2 min)", r: "Épicerie", u: "pc", pk: "sachets" },
  semoule: { n: "Semoule (couscous)", r: "Épicerie", u: "g" },
  puree: { n: "Purée en flocons", r: "Épicerie", u: "g" },
  thon: { n: "Thon en boîte", r: "Épicerie", u: "pc", pk: "boîtes" },
  sauce_tomate: { n: "Sauce tomate", r: "Épicerie", u: "g" },
  pesto: { n: "Pesto", r: "Épicerie", u: "g" },
  ratatouille: { n: "Ratatouille en boîte", r: "Épicerie", u: "g" },
  haricots_rouges: { n: "Haricots rouges en boîte", r: "Épicerie", u: "g" },
  noix: { n: "Mélange noix / amandes / fruits secs", r: "Épicerie", u: "g" },
  barres: { n: "Barres de céréales", r: "Épicerie", u: "pc" },
  compote: { n: "Compotes à boire (gourdes)", r: "Épicerie", u: "pc" },
  biscuits: { n: "Biscuits petit-déjeuner", r: "Épicerie", u: "pc" },
  chocolat: { n: "Chocolat noir", r: "Épicerie", u: "g" },
  huile: { n: "Huile d'olive", r: "Épicerie", u: "ml" },
  cereales: { n: "Céréales", r: "Épicerie", u: "g" },
  banane: { n: "Bananes", r: "Fruits & légumes", u: "pc" },
  tomate: { n: "Tomates", r: "Fruits & légumes", u: "pc" },
  pdt: { n: "Pommes de terre", r: "Fruits & légumes", u: "g" },
  jambon: { n: "Jambon blanc", r: "Viandes & poissons", u: "pc", pk: "tranches" },
  lardons: { n: "Lardons", r: "Viandes & poissons", u: "g" },
  steak: { n: "Steaks hachés", r: "Viandes & poissons", u: "pc" },
  poulet: { n: "Poulet (escalopes ou émincés cuits)", r: "Viandes & poissons", u: "g" },
  haricots: { n: "Haricots verts surgelés", r: "Surgelés", u: "g" },
  petits_pois: { n: "Petits pois surgelés", r: "Surgelés", u: "g" },
  poelee: { n: "Poêlée de légumes surgelée", r: "Surgelés", u: "g" },
  poisson_pane: { n: "Poisson pané", r: "Surgelés", u: "pc", pk: "bâtonnets" },
  pizza: { n: "Pizza surgelée", r: "Surgelés", u: "pc" },
  jus: { n: "Jus d'orange", r: "Boissons", u: "ml" },
  briquette: { n: "Lait chocolaté en briquettes (UHT)", r: "Boissons", u: "pc", pk: "briquettes" },
};

const MEAL_SLOTS = [
  { id: "matin", n: "Matin", ic: "🌅" },
  { id: "midi", n: "Midi", ic: "🥪" },
  { id: "gouter", n: "Goûter", ic: "🍝" },
  { id: "soir", n: "Soir", ic: "🍽️" },
];

const SHAKE = {
  id: "shake", n: "Shake maison", kcal: 500, prot: 18,
  how: "Dans le mixeur : 250 ml de lait entier (un grand verre), 1 banane, 30 g de flocons d'avoine (3 cuillères à soupe), 1 cuillère à soupe de beurre de cacahuète, 1 cuillère à soupe de cacao. Mixe 30 secondes.",
  ing: [["lait", 250], ["banane", 1], ["flocons", 30], ["pb", 15], ["cacao", 10]],
};

/* slot : matin | midi | gouter | soir | coll.  where (midi) : "any" = transportable sans frigo ; "maison" = week-end. */
const M = (id, slot, n, kcal, prot, how, ing, extra) => Object.assign({ id, slot, n, kcal, prot, how, ing }, extra || {});
const MEALS = [
  // ----- MATIN (10) -----
  M("p1", "matin", "Porridge banane-cacahuète", 690, 27, "Dans un grand bol : 80 g de flocons d'avoine + 300 ml de lait entier. 2 min 30 au micro-ondes. Ajoute la banane en rondelles, 1 cuillère de beurre de cacahuète et un filet de miel.", [["flocons", 80], ["lait", 300], ["banane", 1], ["pb", 15], ["miel", 10]]),
  M("p2", "matin", "Œufs brouillés, tartines et jus d'orange", 725, 32, "3 œufs brouillés à la poêle avec un peu de beurre (3 min). 3 tranches de pain beurrées, un verre de jus d'orange et un yaourt.", [["oeufs", 3], ["pain", 90], ["beurre", 15], ["jus", 200], ["yaourt", 1]]),
  M("p3", "matin", "Tartines beurre de cacahuète-banane + lait cacao", 705, 26, "3 tranches de pain de mie grillées, beurre de cacahuète, rondelles de banane. Un grand verre de lait entier avec du cacao.", [["pain_mie", 3], ["pb", 30], ["banane", 1], ["lait", 300], ["cacao", 10]]),
  M("p4", "matin", "Grand bol de granola, lait et banane", 745, 22, "100 g de muesli ou granola, 300 ml de lait entier, une banane coupée dedans. Zéro cuisson.", [["granola", 100], ["lait", 300], ["banane", 1]]),
  M("p5", "matin", "2 croque-monsieur + jus d'orange", 725, 36, "Pain de mie beurré, jambon, emmental. 3 min à la poêle de chaque côté (ou 1 min 30 au micro-ondes). Un verre de jus d'orange.", [["pain_mie", 4], ["jambon", 2], ["emmental", 60], ["beurre", 10], ["jus", 200]]),
  M("p6", "matin", "Omelette au fromage, pain et verre de lait", 720, 38, "Bats 3 œufs, verse dans la poêle beurrée, ajoute l'emmental, plie en deux. Avec 3 tranches de pain et un verre de lait.", [["oeufs", 3], ["emmental", 30], ["pain", 80], ["beurre", 5], ["lait", 200]]),
  M("p7", "matin", "Pancakes express à la banane + verre de lait", 640, 26, "Écrase 1 banane, mélange avec 2 œufs et 40 g de flocons d'avoine. Fais 3 petits pancakes à la poêle beurrée (2 min par face). Miel dessus, un verre de lait à côté.", [["banane", 1], ["oeufs", 2], ["flocons", 40], ["beurre", 5], ["miel", 10], ["lait", 250]]),
  M("p8", "matin", "Bol fromage blanc, granola, banane et miel + tartine", 750, 26, "200 g de fromage blanc entier, 60 g de granola, une banane, un filet de miel. Une tartine beurrée à côté.", [["fromage_blanc", 200], ["granola", 60], ["banane", 1], ["miel", 10], ["pain", 30], ["beurre", 5]]),
  M("p9", "matin", "Sandwich chaud œufs-jambon-fromage + jus", 690, 35, "2 œufs au plat, une tranche de jambon et de l'emmental dans un morceau de baguette beurré. Un verre de jus d'orange.", [["oeufs", 2], ["jambon", 1], ["emmental", 30], ["pain", 100], ["beurre", 5], ["jus", 200]]),
  M("p10", "matin", "Semoule au lait cacao, banane et noix", 715, 22, "60 g de semoule + 300 ml de lait entier + 1 cuillère de cacao : 2 min au micro-ondes, remue, encore 1 min. Ajoute du miel, la banane et une poignée de noix.", [["semoule", 60], ["lait", 300], ["cacao", 10], ["miel", 15], ["banane", 1], ["noix", 20]]),

  // ----- MIDI transportable sans frigo (9) -----
  M("m1", "midi", "Sandwich beurre de cacahuète-banane + lait chocolaté", 550, 17, "À préparer le matin : 2 tranches de pain de mie, beurre de cacahuète, banane écrasée. Avec une briquette de lait chocolaté. Tient sans frigo.", [["pain_mie", 2], ["pb", 30], ["banane", 1], ["briquette", 1]], { where: "any" }),
  M("m2", "midi", "Mélange de noix + lait chocolaté + compote", 470, 11, "Rien à préparer : une grosse poignée de noix et fruits secs (50 g), une briquette de lait chocolaté et une compote à boire. Parfait quand tu n'as pas faim.", [["noix", 50], ["briquette", 1], ["compote", 1]], { where: "any" }),
  M("m3", "midi", "Cantine : le plus calorique d'abord", 500, 25, "Commence par le féculent (pâtes, riz, purée, frites) et la viande ou le poisson, puis le laitage et le dessert. Même une demi-assiette, c'est gagné. Prends du pain.", [], { where: "any" }),
  M("m4", "midi", "Jambon-beurre-emmental", 515, 26, "Un tiers de baguette, beurre, 2 tranches de jambon, emmental. À garder dans un sac isotherme jusqu'à midi.", [["pain", 100], ["beurre", 10], ["jambon", 2], ["emmental", 30]], { where: "any" }),
  M("m5", "midi", "2 barres de céréales + amandes + lait chocolaté", 510, 13, "À manger en plusieurs fois pendant la pause : 2 barres de céréales, une poignée d'amandes ou de noix (30 g), une briquette de lait chocolaté.", [["barres", 2], ["noix", 30], ["briquette", 1]], { where: "any" }),
  M("m6", "midi", "Wrap beurre de cacahuète-miel + compote", 460, 12, "Une tortilla tartinée de beurre de cacahuète et de miel, roulée. Avec une compote à boire. Tient sans frigo.", [["tortillas", 1], ["pb", 30], ["miel", 10], ["compote", 1]], { where: "any" }),
  M("m10", "midi", "Pain, emmental, noix et compote", 560, 20, "Un morceau de baguette, un bon morceau d'emmental (40 g), une petite poignée de noix et une compote à boire. Le fromage à pâte dure tient jusqu'à midi.", [["pain", 80], ["emmental", 40], ["noix", 20], ["compote", 1]], { where: "any" }),
  M("m11", "midi", "Wrap banane-beurre de cacahuète + lait chocolaté", 590, 16, "Une tortilla tartinée de beurre de cacahuète, une banane entière posée dessus, roule. Avec une briquette de lait chocolaté.", [["tortillas", 1], ["pb", 30], ["banane", 1], ["briquette", 1]], { where: "any" }),
  M("m12", "midi", "3 pains au lait, chocolat et lait chocolaté", 610, 14, "3 pains au lait avec 2 carrés de chocolat noir dedans, une briquette de lait chocolaté. Se mange par petits bouts, même sans faim.", [["pain_lait", 3], ["chocolat", 20], ["briquette", 1]], { where: "any" }),
  // ----- MIDI à la maison (4) -----
  M("m7", "midi", "Pâtes jambon-fromage (petite assiette)", 595, 28, "100 g de pâtes cuites (10 min), une noix de beurre, emmental râpé et 2 tranches de jambon coupées.", [["pates", 100], ["beurre", 10], ["emmental", 30], ["jambon", 2]], { where: "maison" }),
  M("m8", "midi", "Riz express au thon et à la tomate", 560, 30, "Un sachet de riz 2 min au micro-ondes, une boîte de thon égouttée, une tomate coupée, un filet d'huile d'olive.", [["riz_express", 1], ["thon", 1], ["tomate", 1], ["huile", 10]], { where: "maison" }),
  M("m9", "midi", "Smoothie-repas à boire", 480, 17, "Si rien ne passe : mixe 300 ml de lait entier, 1 banane, 30 g de flocons d'avoine et une cuillère de miel. À boire tranquillement.", [["lait", 300], ["banane", 1], ["flocons", 30], ["miel", 15]], { where: "maison" }),
  M("m13", "midi", "Croque-monsieur + verre de lait", 485, 24, "Un croque-monsieur (pain de mie, jambon, emmental) à la poêle ou au micro-ondes, et un grand verre de lait entier.", [["pain_mie", 2], ["jambon", 1], ["emmental", 30], ["beurre", 5], ["lait", 250]], { where: "maison" }),

  // ----- GOÛTER : vrai repas (10) -----
  M("g1", "gouter", "Pâtes au thon et à la tomate", 585, 36, "100 g de pâtes (10 min). Égoutte, ajoute une boîte de thon, 3 cuillères de sauce tomate et de l'emmental râpé.", [["pates", 100], ["thon", 1], ["sauce_tomate", 100], ["emmental", 20]]),
  M("g2", "gouter", "Omelette au fromage + pain", 590, 33, "3 œufs battus, poêle beurrée, emmental au milieu, plie en deux. Avec 3 tranches de pain.", [["oeufs", 3], ["emmental", 30], ["pain", 80], ["beurre", 5]]),
  M("g3", "gouter", "Riz express + 2 œufs au plat", 570, 20, "Un sachet de riz 2 min au micro-ondes. 2 œufs au plat avec une noix de beurre, posés sur le riz. Sauce soja ou ketchup si tu veux.", [["riz_express", 1], ["oeufs", 2], ["beurre", 5]]),
  M("g4", "gouter", "2 croque-monsieur", 635, 36, "Pain de mie beurré, jambon, emmental. 3 min à la poêle de chaque côté ou 1 min 30 au micro-ondes.", [["pain_mie", 4], ["jambon", 2], ["emmental", 60], ["beurre", 10]]),
  M("g5", "gouter", "2 wraps poulet-fromage-tomate", 640, 40, "2 tortillas, 100 g de poulet cuit en morceaux, emmental, rondelles de tomate. Roule. 30 secondes au micro-ondes pour faire fondre le fromage.", [["tortillas", 2], ["poulet", 100], ["emmental", 40], ["tomate", 1]]),
  M("g6", "gouter", "Demi-pizza + fromage blanc", 600, 28, "Pizza surgelée au four (10-12 min). Mange la moitié, garde l'autre pour demain. Un bol de fromage blanc en dessert.", [["pizza", 0.5], ["fromage_blanc", 150]]),
  M("g7", "gouter", "Bol de céréales + tartine beurre de cacahuète", 600, 20, "Un bol de céréales avec 250 ml de lait entier, une banane et 2 tranches de pain de mie au beurre de cacahuète.", [["cereales", 60], ["lait", 250], ["banane", 1], ["pain_mie", 2], ["pb", 20]]),
  M("g8", "gouter", "Quesadilla jambon-fromage", 640, 34, "Une tortilla dans la poêle, jambon et emmental dessus, une deuxième tortilla par-dessus. 2 min de chaque côté, coupe en quatre.", [["tortillas", 2], ["jambon", 2], ["emmental", 60]]),
  M("g9", "gouter", "Pâtes au pesto et poulet", 615, 34, "100 g de pâtes (10 min). Mélange avec une cuillère de pesto, 80 g de poulet cuit en morceaux et de l'emmental râpé.", [["pates", 100], ["pesto", 20], ["poulet", 80], ["emmental", 20]]),
  M("g10", "gouter", "Tartines chaudes thon-tomate-fromage", 590, 38, "Sur un morceau de baguette coupé en deux : sauce tomate, thon émietté, emmental. 5 min au four ou 1 min au micro-ondes.", [["pain", 100], ["thon", 1], ["sauce_tomate", 50], ["emmental", 50]]),

  // ----- SOIR (12) -----
  M("d1", "soir", "Repas de famille : grosse assiette", 700, 35, "Mange avec la famille et sers-toi bien : une grosse part de féculents (pâtes, riz, pommes de terre), la viande ou le poisson, les légumes cuits, puis un laitage. Ressers-toi si tu peux.", []),
  M("d2", "soir", "Riz, steak haché et haricots verts", 720, 38, "100 g de riz (10 min). Steak haché à la poêle 3 min par face. Haricots verts surgelés 4 min au micro-ondes avec une noix de beurre.", [["riz", 100], ["steak", 1], ["haricots", 150], ["beurre", 10]]),
  M("d3", "soir", "Pâtes bolognaise express", 700, 40, "100 g de pâtes (10 min). Émiette un steak haché dans une poêle 5 min, ajoute la sauce tomate. Mélange, emmental râpé par-dessus.", [["pates", 100], ["steak", 1], ["sauce_tomate", 150], ["emmental", 20]]),
  M("d4", "soir", "3 œufs au plat, pommes de terre et légumes", 725, 30, "Pommes de terre piquées à la fourchette : 8 min au micro-ondes. Poêlée de légumes surgelée 5 min à la poêle. 3 œufs au plat. Un yaourt.", [["oeufs", 3], ["pdt", 300], ["poelee", 150], ["beurre", 10], ["yaourt", 1]]),
  M("d5", "soir", "Poisson pané, riz et petits pois", 700, 28, "4 bâtonnets de poisson pané au four (12 min) ou à la poêle. 100 g de riz. Petits pois surgelés 4 min au micro-ondes.", [["poisson_pane", 4], ["riz", 100], ["petits_pois", 150]]),
  M("d6", "soir", "Gratin de pâtes jambon-fromage", 710, 33, "100 g de pâtes cuites, mélangées avec le jambon coupé, 2 cuillères de crème et l'emmental. 2 min au micro-ondes ou 10 min au four pour gratiner.", [["pates", 100], ["jambon", 2], ["creme", 50], ["emmental", 40]]),
  M("d7", "soir", "Poulet, semoule et ratatouille", 730, 45, "Semoule : 100 g + le même volume d'eau bouillante, couvre 5 min. Poulet à la poêle (ou déjà cuit, réchauffé). Ratatouille en boîte 2 min au micro-ondes.", [["semoule", 100], ["poulet", 150], ["ratatouille", 200]]),
  M("d8", "soir", "Hachis express : purée, steak haché et fromage", 740, 40, "Purée en flocons (60 g + 200 ml de lait chaud + beurre). Steak haché émietté à la poêle 5 min. Purée par-dessus, emmental, 1 min au micro-ondes.", [["puree", 60], ["lait", 200], ["beurre", 10], ["steak", 1], ["emmental", 20]]),
  M("d9", "soir", "Riz cantonais express", 725, 33, "Dans une poêle avec un peu d'huile : un sachet de riz micro-ondes, 2 œufs brouillés dedans, 2 tranches de jambon en dés et des petits pois. 5 min.", [["riz_express", 1], ["oeufs", 2], ["jambon", 2], ["petits_pois", 100], ["huile", 10]]),
  M("d10", "soir", "Chili express : riz, steak haché et haricots rouges", 690, 42, "80 g de riz (10 min). Dans une poêle : steak haché émietté 5 min, haricots rouges égouttés et sauce tomate, 3 min. Verse sur le riz.", [["riz", 80], ["steak", 1], ["haricots_rouges", 100], ["sauce_tomate", 100]]),
  M("d11", "soir", "Pâtes carbonara simples", 730, 32, "100 g de pâtes (10 min). Lardons 4 min à la poêle. Hors du feu, mélange les pâtes avec les lardons, 1 œuf battu avec un peu de crème, et l'emmental.", [["pates", 100], ["lardons", 50], ["oeufs", 1], ["creme", 30], ["emmental", 20]]),
  M("d12", "soir", "Fajitas poulet et légumes cuits", 725, 50, "Poêlée de légumes surgelée 5 min à la poêle avec 150 g de poulet en morceaux. Garnis 2 tortillas, emmental dessus, roule.", [["tortillas", 2], ["poulet", 150], ["poelee", 150], ["emmental", 30]]),

  // ----- COLLATION avant de dormir (8) -----
  M("c1", "coll", "Fromage blanc, miel et flocons d'avoine", 240, 12, "150 g de fromage blanc entier, une cuillère de miel, une cuillère de flocons d'avoine.", [["fromage_blanc", 150], ["miel", 10], ["flocons", 10]]),
  M("c2", "coll", "Verre de lait + 2 biscuits", 265, 10, "Un verre de lait entier (250 ml) et 2 biscuits petit-déjeuner.", [["lait", 250], ["biscuits", 2]]),
  M("c3", "coll", "Yaourt grec + poignée de noix", 260, 9, "Un yaourt à la grecque avec une petite poignée de noix (20 g).", [["yaourt_grec", 1], ["noix", 20]]),
  M("c4", "coll", "Tartine beurre de cacahuète + lait", 260, 11, "Une tranche de pain de mie au beurre de cacahuète et un petit verre de lait entier (150 ml).", [["pain_mie", 1], ["pb", 15], ["lait", 150]]),
  M("c5", "coll", "Banane, chocolat noir et lait", 275, 6, "Une banane, 2 carrés de chocolat noir, un petit verre de lait entier (100 ml).", [["banane", 1], ["chocolat", 20], ["lait", 100]]),
  M("c6", "coll", "Petit bol de céréales", 280, 9, "40 g de céréales avec 200 ml de lait entier.", [["cereales", 40], ["lait", 200]]),
  M("c7", "coll", "Riz au lait + noix", 280, 7, "Un pot de riz au lait et une petite poignée de noix (20 g).", [["riz_au_lait", 1], ["noix", 20]]),
  M("c8", "coll", "Lait chaud au miel + pain au lait", 290, 9, "200 ml de lait entier chaud (1 min 30 au micro-ondes) avec une cuillère de miel, et un pain au lait.", [["lait", 200], ["miel", 10], ["pain_lait", 1]]),
];

// Portions « en plus » quand la cible de calories monte (+250 kcal chacune environ)
const BOOSTERS = [
  { n: "Un grand verre de lait entier au cacao", kcal: 230, ing: [["lait", 300], ["cacao", 10]] },
  { n: "Une tartine de beurre de cacahuète et une banane", kcal: 290, ing: [["pain_mie", 1], ["pb", 20], ["banane", 1]] },
  { n: "Une poignée de noix (40 g)", kcal: 250, ing: [["noix", 40]] },
  { n: "Un demi-shake maison en plus", kcal: 250, ing: [["lait", 125], ["banane", 0.5], ["flocons", 15], ["pb", 8], ["cacao", 5]] },
];
const KCAL_BASE_PLAN = 3000, KCAL_STEP = 250;

const BADGES = [
  { id: "first", ic: "🔥", n: "Premier pas", d: "Première séance terminée" },
  { id: "week3", ic: "📅", n: "Semaine pleine", d: "3 séances dans la même semaine" },
  { id: "streak4", ic: "⚡", n: "Régulier", d: "4 semaines de suite à 3 séances" },
  { id: "s10", ic: "🥉", n: "10 séances", d: "10 séances au compteur" },
  { id: "s25", ic: "🥈", n: "25 séances", d: "25 séances au compteur" },
  { id: "s50", ic: "🥇", n: "50 séances", d: "50 séances au compteur" },
  { id: "g1", ic: "🚪", n: "Porte 1", d: "10 tractions strictes + 10 dips" },
  { id: "g2", ic: "⚡", n: "Porte 2", d: "5 tractions explosives poitrine à la barre" },
  { id: "g3", ic: "🧗", n: "Porte 3", d: "Négatives de muscle-up contrôlées" },
  { id: "mu", ic: "👑", n: "Premier muscle-up", d: "Tu es passé au-dessus de la barre !" },
  { id: "pull15", ic: "🦍", n: "15 tractions", d: "Une série de 15 tractions strictes" },
  { id: "dips20", ic: "💥", n: "20 dips", d: "Une série de 20 dips" },
  { id: "push30", ic: "🚀", n: "30 pompes", d: "Une série de 30 pompes" },
  { id: "kg1", ic: "🌱", n: "+1 kg", d: "Premier kilo gagné" },
  { id: "kg5", ic: "💪", n: "+5 kg", d: "5 kilos gagnés depuis le départ" },
  { id: "goal3", ic: "🎯", n: "Objectif 3 mois", d: "Le premier palier de poids est atteint" },
  { id: "goal", ic: "🏆", n: "Objectif final", d: "Ton poids objectif est atteint" },
  { id: "meals7", ic: "🍽️", n: "7 jours bien nourri", d: "7 journées avec les 4 repas cochés" },
  { id: "photo", ic: "📸", n: "Première photo", d: "Première photo du mois enregistrée" },
];
