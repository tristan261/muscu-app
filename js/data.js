/* FORGE — données : exercices, programme, repas, badges */
"use strict";

const EQUIP = [
  { id: "barre", n: "Barre fixe (tractions)" },
  { id: "paralleles", n: "Barres parallèles" },
  { id: "basse", n: "Barre basse" },
  { id: "espalier", n: "Espalier" },
  { id: "banc", n: "Banc" },
  { id: "monkey", n: "Monkey bars (échelle horizontale)" },
];

/* needs : liste de possibilités ; il suffit qu'UNE des possibilités soit entièrement présente.
   subs : exercices de remplacement, essayés dans l'ordre. spec : cible propre quand il sert de remplaçant. */
const EXERCISES = {
  // ---------- TIRAGE ----------
  traction: {
    n: "Tractions", needs: [["barre"], ["monkey"]], subs: ["rowing_australien", "rowing_sous_table"],
    how: "Mains en pronation (paumes vers l'avant), un peu plus larges que les épaules. Pars bras tendus, épaules basses. Tire les coudes vers les hanches jusqu'à passer le menton au-dessus de la barre, puis redescends en contrôlant.",
    errs: "Se balancer ou donner des coups de jambes. Faire des demi-reps (ne pas tendre les bras en bas). Hausser les épaules vers les oreilles.",
  },
  traction_supi: {
    n: "Tractions supination", needs: [["barre"]], subs: ["traction", "rowing_australien_supi", "rowing_sous_table"],
    how: "Paumes vers toi, mains largeur d'épaules. Tire la poitrine vers la barre en gardant les coudes près du corps. Descente lente (2 secondes).",
    errs: "Lâcher la descente d'un coup. S'arrêter avant d'avoir les bras tendus. Cambrer et balancer.",
  },
  traction_explosive: {
    n: "Tractions explosives (poitrine à la barre)", needs: [["barre"], ["monkey"]], subs: ["rowing_explosif", "pompes_explosives"],
    how: "Comme une traction, mais tire le plus VITE et le plus HAUT possible : vise la barre au niveau de la poitrine. Tire la barre « vers tes hanches ». Peu de reps, mais chacune à fond. Redescends en contrôlant.",
    errs: "Faire trop de reps et perdre la vitesse. Tirer seulement le menton. Lâcher la descente.",
  },
  traction_haute: {
    n: "Tractions hautes (barre au nombril)", needs: [["barre"]], subs: ["traction_explosive", "rowing_explosif", "pompes_explosives"],
    how: "Traction très explosive avec un léger balancier : tire la barre le plus bas possible sur ton torse (sternum, puis nombril). C'est la dernière étape avant le muscle-up.",
    errs: "Tirer droit vers le haut au lieu de tirer la barre vers les hanches. Plier les genoux pour tricher.",
  },
  muscle_up: {
    n: "Muscle-up", needs: [["barre"]], subs: ["traction_explosive", "rowing_explosif", "pompes_explosives"],
    how: "Prise un peu plus large que les épaules, pouces autour de la barre. Léger balancier, tire explosif en amenant la barre vers les hanches, passe le buste au-dessus de la barre, puis pousse comme un dips.",
    errs: "Passer un coude après l'autre (« aile de poulet ») : à éviter pour protéger les épaules. Enchaîner quand la technique se dégrade.",
  },
  mu_negative: {
    n: "Transitions négatives de muscle-up", needs: [["barre"]], subs: ["dips_lents", "dips_banc", "pompes_lentes"],
    how: "Monte en appui au-dessus de la barre (en sautant ou depuis un appui). Descends le PLUS LENTEMENT possible : d'abord le dips, puis la transition (poitrine collée à la barre), puis la traction. Vise 3 à 5 secondes.",
    errs: "Tomber d'un coup pendant la transition. Écarter la poitrine de la barre.",
  },
  dips_barre: {
    n: "Dips sur barre fixe", needs: [["barre"], ["basse"]], subs: ["dips_lents", "dips_banc", "pompes_lentes"],
    how: "En appui au-dessus de la barre, bras tendus. Descends jusqu'à ce que la barre touche le bas de la poitrine, buste penché vers l'avant, puis repousse. C'est la fin du muscle-up.",
    errs: "Descendre à moitié. Laisser les coudes partir sur les côtés.",
  },
  rowing_australien: {
    n: "Rowing australien", needs: [["basse"], ["espalier"], ["paralleles"]], subs: ["traction_lente", "rowing_sous_table"],
    how: "Sous une barre basse (ou un barreau de l'espalier, ou sous les barres parallèles), corps gainé en planche, talons au sol. Tire la poitrine jusqu'à la barre en serrant les omoplates, puis redescends bras tendus.",
    errs: "Laisser tomber le bassin. Tirer avec la tête en avant. Ne pas aller jusqu'à la barre.",
  },
  rowing_pieds_sureleves: {
    n: "Rowing australien pieds surélevés", needs: [["basse", "banc"], ["espalier"], ["paralleles", "banc"]], subs: ["rowing_australien", "traction_lente", "rowing_sous_table"],
    how: "Même mouvement que le rowing australien, mais les pieds posés en hauteur (banc ou barreau de l'espalier) : le corps est à l'horizontale, c'est plus dur.",
    errs: "Casser le gainage. Raccourcir le mouvement.",
  },
  rowing_archer: {
    n: "Rowing australien archer", needs: [["basse"], ["espalier"]], subs: ["rowing_pieds_sureleves", "rowing_australien", "traction_lente"],
    how: "Prise large. Tire vers une main pendant que l'autre bras reste presque tendu, puis change de côté à chaque rep. Compte le total des reps.",
    errs: "Tourner le bassin. Plier le bras qui doit rester tendu.",
  },
  rowing_australien_supi: {
    n: "Rowing australien supination", needs: [["basse"], ["espalier"], ["paralleles"]], subs: ["rowing_sous_table"],
    how: "Rowing australien, paumes vers toi. Garde les coudes près du corps et tire la barre vers le bas de la poitrine.",
    errs: "Laisser tomber le bassin. Mouvement trop court.",
  },
  rowing_explosif: {
    n: "Rowing australien explosif", needs: [["basse"], ["espalier"], ["paralleles"]], subs: ["pompes_explosives"],
    how: "Rowing australien en tirant le plus vite possible, poitrine jusqu'à la barre. Descente contrôlée.",
    errs: "Perdre le gainage en accélérant.",
  },
  rowing_sous_table: {
    n: "Tirage serviette / superman au sol", needs: null, subs: [],
    how: "Sans barre : allongé sur le ventre, bras tendus devant toi. Décolle la poitrine et tire les coudes vers les hanches en serrant fort les omoplates, 2 secondes en haut. Ou tirage avec une serviette autour d'un poteau solide.",
    errs: "Aller trop vite. Casser la nuque en regardant devant.",
  },
  traction_lente: {
    n: "Tractions lentes (3 s à la descente)", needs: [["barre"], ["monkey"]], subs: ["rowing_sous_table"],
    how: "Traction normale à la montée, puis 3 secondes pour redescendre. Moins de reps, plus de contrôle.",
    errs: "Accélérer la descente quand ça devient dur.",
    spec: { mode: "range", lo: 4, hi: 6, unit: "reps" },
  },
  traction_archer: {
    n: "Tractions archer", needs: [["barre"]], subs: ["traction", "rowing_archer", "rowing_australien"],
    how: "Prise large. Tire vers une main pendant que l'autre bras se tend le long de la barre. Alterne les côtés. Compte le total des reps.",
    errs: "Tourner le corps. Y aller sans être échauffé.",
  },
  monkey_bars: {
    n: "Monkey bars", needs: [["monkey"]], subs: ["deplacement_barre", "suspension"],
    how: "Traverse l'échelle horizontale d'une main à l'autre, aller puis retour. Garde les épaules actives (tirées vers le bas) et un léger balancier régulier.",
    errs: "Pendre « mou » sur les épaules. Lâcher une main avant d'avoir bien attrapé avec l'autre.",
    unit: "AR",
  },
  monkey_skip: {
    n: "Monkey bars (1 barreau sur 2)", needs: [["monkey"]], subs: ["monkey_bars", "deplacement_barre", "suspension"],
    how: "Traverse en sautant un barreau à chaque prise. Demande plus de tirage et de balancier.",
    errs: "Se jeter sans contrôle. Mains mouillées ou glissantes : essuie-les avant.",
    unit: "AR",
  },
  deplacement_barre: {
    n: "Déplacements latéraux à la barre", needs: [["barre"]], subs: ["suspension"],
    how: "Suspendu à la barre, déplace-toi d'un bout à l'autre en bougeant une main après l'autre, puis reviens. Épaules actives.",
    errs: "Pendre épaules relâchées. Aller trop vite.",
    unit: "AR",
  },
  suspension: {
    n: "Suspension active", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["gainage"],
    how: "Suspendu bras tendus, tire les épaules vers le bas (loin des oreilles) et tiens la position. Serre fort la barre.",
    errs: "Hausser les épaules. Plier les bras.",
    spec: { mode: "time", lo: 20, hi: 30, unit: "s" },
  },
  // ---------- ABDOS ----------
  releve_genoux: {
    n: "Relevés de genoux suspendu", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["releve_paralleles", "releve_sol"],
    how: "Suspendu à la barre, monte les genoux vers la poitrine en enroulant le bassin, puis redescends lentement sans te balancer.",
    errs: "Prendre de l'élan. Laisser retomber les jambes.",
  },
  releve_jambes: {
    n: "Relevés de jambes suspendu", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["releve_paralleles", "releve_sol"],
    how: "Suspendu à la barre (ou dos à l'espalier), monte les jambes tendues jusqu'à l'horizontale en enroulant le bassin. Redescends en 2 secondes, sans balancer.",
    errs: "Se balancer. Monter seulement avec l'élan. Si c'est trop dur jambes tendues, plie un peu les genoux.",
  },
  toes_to_bar: {
    n: "Pieds à la barre (toes to bar)", needs: [["barre"], ["monkey"]], subs: ["releve_jambes", "releve_paralleles", "releve_sol"],
    how: "Relevé de jambes complet : monte les pieds jusqu'à toucher la barre, en contrôlant la descente.",
    errs: "Gros balancier. Plier beaucoup les genoux.",
  },
  releve_paralleles: {
    n: "Relevés de jambes aux parallèles", needs: [["paralleles"]], subs: ["releve_sol"],
    how: "En appui bras tendus sur les barres parallèles, monte les genoux ou les jambes tendues à l'horizontale, puis redescends lentement.",
    errs: "S'affaisser dans les épaules. Se balancer.",
  },
  releve_sol: {
    n: "Relevés de jambes au sol", needs: null, subs: [],
    how: "Allongé sur le dos, mains sous les fesses, bas du dos plaqué au sol. Monte les jambes tendues à la verticale puis redescends sans toucher le sol.",
    errs: "Creuser le bas du dos. Aller trop vite.",
  },
  gainage: {
    n: "Gainage (planche)", needs: null, subs: [],
    how: "Sur les avant-bras et les pointes de pieds, corps bien droit de la tête aux talons. Serre les abdos et les fesses, respire normalement.",
    errs: "Fesses trop hautes ou bassin qui tombe. Bloquer sa respiration.",
  },
  gainage_epaules: {
    n: "Gainage bras tendus + touches d'épaules", needs: null, subs: [],
    how: "En position de pompe bras tendus, touche l'épaule opposée avec une main, en alternant, sans que le bassin bouge. Pieds un peu écartés.",
    errs: "Balancer les hanches d'un côté à l'autre. Aller trop vite.",
  },
  lsit_groupe: {
    n: "L-sit groupé (genoux pliés)", needs: [["paralleles"]], subs: ["lsit_sol", "releve_sol"],
    how: "En appui bras tendus sur les parallèles, épaules basses, monte les genoux à hauteur des hanches et tiens.",
    errs: "S'enfoncer dans les épaules. Plier les bras.",
  },
  lsit: {
    n: "L-sit aux parallèles", needs: [["paralleles"]], subs: ["lsit_suspendu", "lsit_sol", "releve_sol"],
    how: "En appui bras tendus sur les parallèles, pousse les épaules vers le bas et tiens les jambes tendues à l'horizontale. Si c'est trop dur : une jambe tendue, l'autre pliée.",
    errs: "Épaules qui remontent vers les oreilles. Dos rond et jambes qui tombent.",
  },
  lsit_suspendu: {
    n: "L-sit suspendu à la barre", needs: [["barre"], ["monkey"], ["espalier"]], subs: ["lsit_sol", "releve_sol"],
    how: "Suspendu à la barre, monte les jambes tendues à l'horizontale et tiens la position.",
    errs: "Se balancer. Plier les genoux.",
  },
  lsit_sol: {
    n: "L-sit au sol (groupé)", needs: null, subs: [],
    how: "Assis au sol, mains à plat à côté des hanches. Pousse fort dans le sol pour décoller les fesses, genoux pliés (puis jambes tendues quand tu progresses).",
    errs: "Hausser les épaules. Abandonner trop vite : même 5 secondes comptent.",
  },
  // ---------- POUSSÉE ----------
  dips: {
    n: "Dips", needs: [["paralleles"]], subs: ["dips_banc", "dips_barre", "pompes_diamant"],
    how: "En appui bras tendus sur les barres parallèles. Descends en penchant légèrement le buste jusqu'à avoir les épaules au niveau des coudes, puis repousse jusqu'aux bras tendus.",
    errs: "Descendre trop bas en forçant sur les épaules. Hausser les épaules. Demi-reps.",
  },
  dips_lents: {
    n: "Dips lents (3 s à la descente)", needs: [["paralleles"]], subs: ["dips_banc", "pompes_lentes"],
    how: "Dips avec 3 secondes pour descendre et une remontée dynamique.",
    errs: "Accélérer la descente. Perdre l'alignement.",
  },
  dips_banc: {
    n: "Dips sur banc", needs: [["banc"]], subs: ["pompes_diamant"],
    how: "Dos au banc, mains posées au bord, jambes tendues devant toi. Descends en pliant les coudes vers l'arrière jusqu'à 90°, puis repousse.",
    errs: "Éloigner les fesses du banc. Descendre trop bas (épaules).",
  },
  pompes: {
    n: "Pompes", needs: null, subs: [],
    how: "Mains un peu plus larges que les épaules, corps gainé comme une planche. Descends la poitrine jusqu'à frôler le sol, coudes à environ 45° du corps, puis repousse jusqu'aux bras tendus.",
    errs: "Bassin qui tombe ou fesses en l'air. Demi-reps. Coudes complètement écartés.",
  },
  pompes_lentes: {
    n: "Pompes lentes (3 s à la descente)", needs: null, subs: [],
    how: "Pompes classiques avec 3 secondes pour descendre, 1 seconde en bas, puis remontée dynamique.",
    errs: "Accélérer quand ça brûle.",
    spec: { mode: "range", lo: 8, hi: 12, unit: "reps" },
  },
  pompes_explosives: {
    n: "Pompes explosives", needs: null, subs: [],
    how: "Descends en contrôle puis pousse le plus fort possible pour décoller les mains du sol. Amortis la réception.",
    errs: "Réception bras tendus (amortis en pliant les coudes). Perdre le gainage.",
  },
  pompes_archer: {
    n: "Pompes archer", needs: null, subs: [],
    how: "Mains très écartées. Descends vers une main pendant que l'autre bras reste tendu, remonte, puis change de côté. Compte le total des reps.",
    errs: "Tourner le bassin. Plier le bras qui doit rester tendu.",
  },
  pompes_sureleves: {
    n: "Pompes pieds surélevés", needs: [["banc"], ["espalier"], ["basse"]], subs: ["pompes_pike", "pompes_lentes"],
    how: "Pieds posés sur le banc (ou un barreau bas), mains au sol. Corps bien gainé, descends la poitrine au sol. Travaille le haut des pectoraux et les épaules.",
    errs: "Cambrer le bas du dos. Tête qui plonge en avant.",
  },
  pompes_pike: {
    n: "Pompes pike (épaules)", needs: null, subs: [],
    how: "Fesses en l'air, corps en V inversé, mains au sol. Plie les coudes pour amener le haut de la tête vers le sol devant tes mains, puis repousse.",
    errs: "Écarter les coudes. Faire une pompe normale au lieu de garder les fesses hautes.",
  },
  pompes_pike_sureleves: {
    n: "Pompes pike pieds surélevés", needs: [["banc"], ["espalier"]], subs: ["pompes_pike"],
    how: "Pompes pike avec les pieds sur le banc : presque à la verticale. Excellent pour les épaules.",
    errs: "Descendre trop vite sur la tête. Cambrer.",
  },
  pompes_diamant: {
    n: "Pompes diamant", needs: null, subs: [],
    how: "Mains rapprochées sous la poitrine (pouces et index forment un losange). Coudes serrés le long du corps, descends la poitrine sur les mains.",
    errs: "Écarter les coudes. Laisser tomber le bassin.",
  },
  pompes_diamant_sureleves: {
    n: "Pompes diamant pieds surélevés", needs: [["banc"], ["espalier"]], subs: ["pompes_diamant"],
    how: "Pompes diamant avec les pieds sur le banc. Gainage serré.",
    errs: "Cambrer. Mouvement incomplet.",
  },
  // ---------- JAMBES ----------
  squats: {
    n: "Squats", needs: null, subs: [],
    how: "Pieds largeur d'épaules, pointes légèrement vers l'extérieur. Descends les fesses en arrière et vers le bas, cuisses au moins parallèles au sol, dos droit, talons au sol. Remonte en poussant dans les talons.",
    errs: "Genoux qui rentrent vers l'intérieur. Talons qui décollent. Dos rond.",
  },
  squats_sautes: {
    n: "Squats sautés", needs: null, subs: [],
    how: "Squat normal, puis saute le plus haut possible en remontant. Amortis la réception en repliant les jambes, sans bruit.",
    errs: "Réception jambes raides. Genoux qui rentrent.",
  },
  squat_bulgare: {
    n: "Squat bulgare (pied arrière sur le banc)", needs: [["banc"], ["espalier"]], subs: ["squats_sautes"],
    how: "Un pied posé derrière toi sur le banc. Descends sur la jambe avant jusqu'à avoir la cuisse parallèle au sol, buste droit, puis remonte. Fais toutes les reps d'un côté, puis l'autre.",
    errs: "Genou avant qui part vers l'intérieur. Pied avant trop près du banc.",
    perSide: true,
  },
  fentes: {
    n: "Fentes", needs: null, subs: [],
    how: "Fais un grand pas en avant et descends jusqu'à ce que le genou arrière frôle le sol, buste droit. Repousse pour revenir. Alterne ou fais un côté puis l'autre.",
    errs: "Genou avant qui dépasse beaucoup la pointe du pied. Pas trop petit. Buste penché.",
    perSide: true,
  },
  fentes_sautees: {
    n: "Fentes sautées", needs: null, subs: [],
    how: "En position de fente, saute et change de jambe en l'air. Amortis chaque réception.",
    errs: "Genou arrière qui tape le sol. Perdre l'équilibre en allant trop vite.",
    perSide: true,
  },
};

/* Programme : chaque « slot » a une chaîne de variantes (de la plus facile à la plus dure).
   mode : max | range | time.  cap : seuil pour proposer plus dur en mode max.  def : valeur de départ. */
const PROGRAM = {
  A: {
    n: "Séance A", sub: "Tirage + abdos",
    slots: [
      { key: "A1", chain: ["traction", "traction_archer"], lvl: 0, sets: 4, mode: "max", cap: 12, def: 8, rir: "1-2", weight: true },
      { key: "A2", chain: ["rowing_australien", "rowing_pieds_sureleves", "rowing_archer"], lvl: 0, sets: 3, mode: "range", lo: 10, hi: 12, weight: true },
      { key: "A3", chain: ["traction_supi"], lvl: 0, sets: 3, mode: "range", lo: 6, hi: 8, weight: true },
      { key: "A4", chain: ["monkey_bars", "monkey_skip"], lvl: 0, sets: 3, mode: "range", lo: 1, hi: 1, unit: "AR", step: 1 },
      { key: "A5", chain: ["releve_genoux", "releve_jambes", "toes_to_bar"], lvl: 1, sets: 3, mode: "range", lo: 10, hi: 10 },
    ],
  },
  B: {
    n: "Séance B", sub: "Poussée + jambes",
    slots: [
      { key: "B1", chain: ["dips"], lvl: 0, sets: 4, mode: "range", lo: 8, hi: 12, weight: true },
      { key: "B2", chain: ["pompes", "pompes_archer"], lvl: 0, sets: 3, mode: "max", cap: 20, def: 12, rir: "1-2", weight: true },
      { key: "B3", chain: ["pompes_sureleves", "pompes_pike", "pompes_pike_sureleves"], lvl: 0, sets: 3, mode: "range", lo: 10, hi: 15 },
      { key: "B4", chain: ["squats", "squats_sautes", "squat_bulgare"], lvl: 0, sets: 4, mode: "range", lo: 20, hi: 20, weight: true },
      { key: "B5", chain: ["fentes", "fentes_sautees"], lvl: 0, sets: 3, mode: "range", lo: 12, hi: 12, weight: true },
      { key: "B6", chain: ["gainage", "gainage_epaules"], lvl: 0, sets: 3, mode: "time", lo: 40, hi: 40, unit: "s", step: 10 },
    ],
  },
  C: {
    n: "Séance C", sub: "Figures + muscle-up (séance légère)",
    light: true,
    slots: [
      { key: "C1", chain: ["traction_explosive", "traction_haute", "muscle_up"], lvl: 0, sets: 5, mode: "range", lo: 3, hi: 5, step: 1, noBonus: true },
      { key: "C2", chain: ["mu_negative", "dips_barre"], lvl: 0, sets: 3, mode: "range", lo: 3, hi: 3, step: 1 },
      { key: "C3", chain: ["dips"], lvl: 0, sets: 3, mode: "max", cap: 15, def: 7, rir: "3", weight: false },
      { key: "C4", chain: ["traction"], lvl: 0, sets: 3, mode: "max", cap: 12, def: 6, rir: "3", weight: false },
      { key: "C5", chain: ["pompes_diamant", "pompes_diamant_sureleves"], lvl: 0, sets: 3, mode: "range", lo: 10, hi: 10 },
      { key: "C6", chain: ["lsit_groupe", "lsit"], lvl: 1, sets: 4, mode: "time", lo: 10, hi: 15, unit: "s", step: 5 },
    ],
  },
};

const WARMUP = [
  { t: "Cardio léger", d: "1 min de trottinement sur place ou de jumping jacks", s: 60 },
  { t: "Épaules et poignets", d: "Grands cercles de bras (10 dans chaque sens) + rotations des poignets", s: 60 },
  { t: "Omoplates", d: "Suspendu à la barre : 2 × 8 « tractions d'omoplates » (bras tendus, monte et descends juste les épaules)", s: 60 },
  { t: "Pompes faciles", d: "10 pompes lentes + 10 squats", s: 60 },
  { t: "Montée en puissance", d: "3 tractions faciles + 5 dips faciles, puis 20 s de gainage", s: 60 },
];

/* ---------- ALIMENTATION ---------- */
const RAYONS = ["Fruits & légumes", "Crèmerie", "Boulangerie", "Viandes & poissons", "Épicerie", "Surgelés", "Boissons"];

// u : unité de base (g, ml, pc). pk : phrase lisible pour l'unité « pièce ».
const ING = {
  lait: { n: "Lait entier", r: "Crèmerie", u: "ml" },
  oeufs: { n: "Œufs", r: "Crèmerie", u: "pc" },
  beurre: { n: "Beurre", r: "Crèmerie", u: "g" },
  emmental: { n: "Emmental (râpé ou en tranches)", r: "Crèmerie", u: "g" },
  yaourt: { n: "Yaourts au lait entier", r: "Crèmerie", u: "pc" },
  yaourt_grec: { n: "Yaourts à la grecque", r: "Crèmerie", u: "pc" },
  fromage_blanc: { n: "Fromage blanc entier", r: "Crèmerie", u: "g" },
  creme: { n: "Crème fraîche", r: "Crèmerie", u: "g" },
  pain: { n: "Pain / baguette", r: "Boulangerie", u: "g" },
  pain_mie: { n: "Pain de mie complet", r: "Boulangerie", u: "pc", pk: "tranches" },
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
  thon: { n: "Thon en boîte", r: "Épicerie", u: "pc", pk: "boîtes" },
  sauce_tomate: { n: "Sauce tomate", r: "Épicerie", u: "g" },
  ratatouille: { n: "Ratatouille en boîte", r: "Épicerie", u: "g" },
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
  { id: "pdj", n: "Petit-déjeuner", ic: "🌅" },
  { id: "midi", n: "Midi", ic: "🥪" },
  { id: "gouter", n: "Goûter", ic: "🍝" },
  { id: "diner", n: "Dîner", ic: "🍽️" },
  { id: "coll", n: "Collation du soir", ic: "🌙" },
];

const SHAKE = {
  id: "shake", n: "Shake maison prise de masse", kcal: 500, prot: 18,
  how: "Dans le mixeur : 250 ml de lait entier (un grand verre), 1 banane, 30 g de flocons d'avoine (3 cuillères à soupe), 1 cuillère à soupe de beurre de cacahuète, 1 cuillère à soupe de cacao. Mixe 30 secondes. À boire quand tu veux : au goûter, le soir, ou à siroter si rien d'autre ne passe.",
  ing: [["lait", 250], ["banane", 1], ["flocons", 30], ["pb", 15], ["cacao", 10]],
};

/* where : "any" = transportable (lycée, sans frigo ni micro-ondes) ; "maison" = à la maison seulement */
const MEALS = [
  // ----- PETIT-DÉJEUNER (toujours à la maison) -----
  { id: "p1", slot: "pdj", where: "maison", n: "Porridge banane-cacahuète", kcal: 690, prot: 27,
    how: "Dans un grand bol : 80 g de flocons d'avoine + 300 ml de lait entier. 2 min 30 au micro-ondes. Ajoute la banane en rondelles, 1 cuillère de beurre de cacahuète et un filet de miel.",
    ing: [["flocons", 80], ["lait", 300], ["banane", 1], ["pb", 15], ["miel", 10]] },
  { id: "p2", slot: "pdj", where: "maison", n: "Œufs brouillés, tartines et jus d'orange", kcal: 725, prot: 32,
    how: "3 œufs brouillés à la poêle avec un peu de beurre (3 min). 3 tranches de pain beurrées, un verre de jus d'orange et un yaourt.",
    ing: [["oeufs", 3], ["pain", 90], ["beurre", 15], ["jus", 200], ["yaourt", 1]] },
  { id: "p3", slot: "pdj", where: "maison", n: "Tartines beurre de cacahuète-banane + lait cacao", kcal: 705, prot: 26,
    how: "3 tranches de pain de mie grillées, beurre de cacahuète, rondelles de banane. Un grand verre de lait entier avec du cacao.",
    ing: [["pain_mie", 3], ["pb", 30], ["banane", 1], ["lait", 300], ["cacao", 10]] },
  { id: "p4", slot: "pdj", where: "maison", n: "Grand bol de granola, lait et banane", kcal: 745, prot: 22,
    how: "100 g de muesli ou granola, 300 ml de lait entier, une banane coupée dedans. Zéro cuisson.",
    ing: [["granola", 100], ["lait", 300], ["banane", 1]] },
  { id: "p5", slot: "pdj", where: "maison", n: "2 croque-monsieur + jus d'orange", kcal: 725, prot: 36,
    how: "Pain de mie beurré, jambon, emmental. 3 min à la poêle de chaque côté (ou 1 min 30 au micro-ondes). Un verre de jus d'orange.",
    ing: [["pain_mie", 4], ["jambon", 2], ["emmental", 60], ["beurre", 10], ["jus", 200]] },
  { id: "p6", slot: "pdj", where: "maison", n: "Omelette au fromage, pain et verre de lait", kcal: 720, prot: 38,
    how: "Bats 3 œufs, verse dans la poêle beurrée, ajoute l'emmental, plie en deux. Avec 3 tranches de pain et un verre de lait.",
    ing: [["oeufs", 3], ["emmental", 30], ["pain", 80], ["beurre", 5], ["lait", 200]] },

  // ----- MIDI : petit mais dense, ou à boire -----
  { id: "m1", slot: "midi", where: "any", n: "Sandwich beurre de cacahuète-banane + lait chocolaté", kcal: 550, prot: 17,
    how: "À préparer le matin : 2 tranches de pain de mie, beurre de cacahuète, banane écrasée. Avec une briquette de lait chocolaté. Tient sans frigo.",
    ing: [["pain_mie", 2], ["pb", 30], ["banane", 1], ["briquette", 1]] },
  { id: "m2", slot: "midi", where: "any", n: "Mélange de noix + lait chocolaté + compote", kcal: 470, prot: 11,
    how: "Rien à préparer : une grosse poignée de noix et fruits secs (50 g) à grignoter, une briquette de lait chocolaté et une compote à boire. Parfait quand tu n'as pas faim.",
    ing: [["noix", 50], ["briquette", 1], ["compote", 1]] },
  { id: "m3", slot: "midi", where: "any", n: "Cantine : le plus calorique d'abord", kcal: 500, prot: 25, noShop: true,
    how: "Commence par le féculent (pâtes, riz, purée, frites) et la viande ou le poisson, puis le laitage et le dessert. Même une demi-assiette, c'est gagné. Prends du pain.",
    ing: [] },
  { id: "m4", slot: "midi", where: "any", n: "Jambon-beurre-emmental", kcal: 515, prot: 26,
    how: "Un tiers de baguette, beurre, 2 tranches de jambon, emmental. À garder dans un sac isotherme jusqu'à midi.",
    ing: [["pain", 100], ["beurre", 10], ["jambon", 2], ["emmental", 30]] },
  { id: "m5", slot: "midi", where: "any", n: "2 barres de céréales + amandes + lait chocolaté", kcal: 510, prot: 13,
    how: "À manger en plusieurs fois pendant la pause si tu n'as pas faim : 2 barres de céréales, une poignée d'amandes ou de noix (30 g), une briquette de lait chocolaté.",
    ing: [["barres", 2], ["noix", 30], ["briquette", 1]] },
  { id: "m6", slot: "midi", where: "any", n: "Wrap beurre de cacahuète-miel + compote", kcal: 460, prot: 12,
    how: "Une tortilla tartinée de beurre de cacahuète et de miel, roulée. Avec une compote à boire. Tient sans frigo.",
    ing: [["tortillas", 1], ["pb", 30], ["miel", 10], ["compote", 1]] },
  { id: "m7", slot: "midi", where: "maison", n: "Pâtes jambon-fromage (petite assiette)", kcal: 595, prot: 28,
    how: "100 g de pâtes cuites (10 min), une noix de beurre, emmental râpé et 2 tranches de jambon coupées.",
    ing: [["pates", 100], ["beurre", 10], ["emmental", 30], ["jambon", 2]] },
  { id: "m8", slot: "midi", where: "maison", n: "Riz express au thon et à la tomate", kcal: 560, prot: 30,
    how: "Un sachet de riz 2 min au micro-ondes, une boîte de thon égouttée, une tomate coupée, un filet d'huile d'olive.",
    ing: [["riz_express", 1], ["thon", 1], ["tomate", 1], ["huile", 10]] },
  { id: "m9", slot: "midi", where: "maison", n: "Smoothie-repas à boire", kcal: 480, prot: 17,
    how: "Si rien ne passe : mixe 300 ml de lait entier, 1 banane, 30 g de flocons d'avoine et une cuillère de miel. À boire tranquillement.",
    ing: [["lait", 300], ["banane", 1], ["flocons", 30], ["miel", 15]] },

  // ----- GOÛTER : vrai repas -----
  { id: "g1", slot: "gouter", where: "maison", n: "Pâtes au thon et à la tomate", kcal: 585, prot: 36,
    how: "100 g de pâtes (10 min). Égoutte, ajoute une boîte de thon, 3 cuillères de sauce tomate et de l'emmental râpé. Mélange dans la casserole chaude.",
    ing: [["pates", 100], ["thon", 1], ["sauce_tomate", 100], ["emmental", 20]] },
  { id: "g2", slot: "gouter", where: "maison", n: "Omelette au fromage + pain", kcal: 590, prot: 33,
    how: "3 œufs battus, poêle beurrée, emmental au milieu, plie en deux. Avec 3 tranches de pain.",
    ing: [["oeufs", 3], ["emmental", 30], ["pain", 80], ["beurre", 5]] },
  { id: "g3", slot: "gouter", where: "maison", n: "Riz express + 2 œufs au plat", kcal: 570, prot: 20,
    how: "Un sachet de riz 2 min au micro-ondes. 2 œufs au plat à la poêle avec une noix de beurre, posés sur le riz. Sauce soja ou ketchup si tu veux.",
    ing: [["riz_express", 1], ["oeufs", 2], ["beurre", 5]] },
  { id: "g4", slot: "gouter", where: "maison", n: "2 croque-monsieur", kcal: 635, prot: 36,
    how: "Pain de mie beurré, jambon, emmental. 3 min à la poêle de chaque côté ou 1 min 30 au micro-ondes.",
    ing: [["pain_mie", 4], ["jambon", 2], ["emmental", 60], ["beurre", 10]] },
  { id: "g5", slot: "gouter", where: "maison", n: "2 wraps poulet-fromage-tomate", kcal: 640, prot: 40,
    how: "2 tortillas, 100 g de poulet cuit en morceaux, emmental, rondelles de tomate. Roule. 30 secondes au micro-ondes pour faire fondre le fromage.",
    ing: [["tortillas", 2], ["poulet", 100], ["emmental", 40], ["tomate", 1]] },
  { id: "g6", slot: "gouter", where: "maison", n: "Demi-pizza + fromage blanc", kcal: 600, prot: 28,
    how: "Pizza surgelée au four (10-12 min). Mange la moitié, garde l'autre pour demain. Un bol de fromage blanc en dessert.",
    ing: [["pizza", 0.5], ["fromage_blanc", 150]] },
  { id: "g7", slot: "gouter", where: "maison", n: "Bol de céréales + tartine beurre de cacahuète", kcal: 600, prot: 20,
    how: "Un bol de céréales avec 250 ml de lait entier, une banane et 2 tranches de pain de mie au beurre de cacahuète.",
    ing: [["cereales", 60], ["lait", 250], ["banane", 1], ["pain_mie", 2], ["pb", 20]] },

  // ----- DÎNER -----
  { id: "d1", slot: "diner", where: "maison", n: "Repas de famille : grosse assiette", kcal: 700, prot: 35, noShop: true,
    how: "Mange avec la famille et sers-toi bien : une grosse part de féculents (pâtes, riz, pommes de terre), la viande ou le poisson, les légumes cuits, puis un laitage. Ressers-toi si tu peux.",
    ing: [] },
  { id: "d2", slot: "diner", where: "maison", n: "Riz, steak haché et haricots verts", kcal: 720, prot: 38,
    how: "100 g de riz (10 min). Steak haché à la poêle 3 min par face. Haricots verts surgelés 4 min au micro-ondes avec une noix de beurre.",
    ing: [["riz", 100], ["steak", 1], ["haricots", 150], ["beurre", 10]] },
  { id: "d3", slot: "diner", where: "maison", n: "Pâtes bolognaise express", kcal: 700, prot: 40,
    how: "100 g de pâtes (10 min). Pendant ce temps, émiette un steak haché dans une poêle 5 min, ajoute la sauce tomate. Mélange, emmental râpé par-dessus.",
    ing: [["pates", 100], ["steak", 1], ["sauce_tomate", 150], ["emmental", 20]] },
  { id: "d4", slot: "diner", where: "maison", n: "3 œufs au plat, pommes de terre et légumes", kcal: 725, prot: 30,
    how: "Pommes de terre piquées à la fourchette : 8 min au micro-ondes. Poêlée de légumes surgelée 5 min à la poêle. 3 œufs au plat. Un yaourt.",
    ing: [["oeufs", 3], ["pdt", 300], ["poelee", 150], ["beurre", 10], ["yaourt", 1]] },
  { id: "d5", slot: "diner", where: "maison", n: "Poisson pané, riz et petits pois", kcal: 700, prot: 28,
    how: "4 bâtonnets de poisson pané au four (12 min) ou à la poêle. 100 g de riz. Petits pois surgelés 4 min au micro-ondes.",
    ing: [["poisson_pane", 4], ["riz", 100], ["petits_pois", 150]] },
  { id: "d6", slot: "diner", where: "maison", n: "Gratin de pâtes jambon-fromage", kcal: 710, prot: 33,
    how: "100 g de pâtes cuites, mélangées avec le jambon coupé, 2 cuillères de crème et l'emmental. 2 min au micro-ondes ou 10 min au four pour gratiner.",
    ing: [["pates", 100], ["jambon", 2], ["creme", 50], ["emmental", 40]] },
  { id: "d7", slot: "diner", where: "maison", n: "Poulet, semoule et ratatouille", kcal: 730, prot: 45,
    how: "Semoule : 100 g + le même volume d'eau bouillante, couvre 5 min. Poulet à la poêle (ou déjà cuit, réchauffé). Ratatouille en boîte 2 min au micro-ondes.",
    ing: [["semoule", 100], ["poulet", 150], ["ratatouille", 200]] },

  // ----- COLLATION -----
  { id: "c1", slot: "coll", where: "maison", n: "Fromage blanc, miel et flocons d'avoine", kcal: 240, prot: 12,
    how: "150 g de fromage blanc entier, une cuillère de miel, une cuillère de flocons d'avoine.",
    ing: [["fromage_blanc", 150], ["miel", 10], ["flocons", 10]] },
  { id: "c2", slot: "coll", where: "maison", n: "Verre de lait + 2 biscuits", kcal: 265, prot: 10,
    how: "Un verre de lait entier (250 ml) et 2 biscuits petit-déjeuner.",
    ing: [["lait", 250], ["biscuits", 2]] },
  { id: "c3", slot: "coll", where: "maison", n: "Yaourt grec + poignée de noix", kcal: 260, prot: 9,
    how: "Un yaourt à la grecque avec une petite poignée de noix (20 g).",
    ing: [["yaourt_grec", 1], ["noix", 20]] },
  { id: "c4", slot: "coll", where: "maison", n: "Tartine beurre de cacahuète + lait", kcal: 260, prot: 11,
    how: "Une tranche de pain de mie au beurre de cacahuète et un petit verre de lait entier (150 ml).",
    ing: [["pain_mie", 1], ["pb", 15], ["lait", 150]] },
  { id: "c5", slot: "coll", where: "maison", n: "Banane, chocolat noir et lait", kcal: 275, prot: 6,
    how: "Une banane, 2 carrés de chocolat noir, un petit verre de lait entier (100 ml).",
    ing: [["banane", 1], ["chocolat", 20], ["lait", 100]] },
  { id: "c6", slot: "coll", where: "maison", n: "Petit bol de céréales", kcal: 280, prot: 9,
    how: "40 g de céréales avec 200 ml de lait entier.",
    ing: [["cereales", 40], ["lait", 200]] },
];

// Petits « plus » quand la cible de calories dépasse le plan
const BOOSTERS = [
  { n: "Un grand verre de lait entier au cacao", kcal: 230 },
  { n: "Une tartine de beurre de cacahuète", kcal: 190 },
  { n: "Une poignée de noix (30 g)", kcal: 190 },
  { n: "Un demi-shake maison en plus", kcal: 300 },
  { n: "Une banane + 2 carrés de chocolat", kcal: 210 },
];

const BADGES = [
  { id: "first", ic: "🔥", n: "Premier pas", d: "Première séance terminée" },
  { id: "week3", ic: "📅", n: "Semaine pleine", d: "3 séances dans la même semaine" },
  { id: "streak4", ic: "⚡", n: "Régulier", d: "4 semaines de suite à 3 séances" },
  { id: "s10", ic: "🥉", n: "10 séances", d: "10 séances au compteur" },
  { id: "s25", ic: "🥈", n: "25 séances", d: "25 séances au compteur" },
  { id: "s50", ic: "🥇", n: "50 séances", d: "50 séances au compteur" },
  { id: "pull15", ic: "🦍", n: "15 tractions", d: "Une série de 15 tractions strictes" },
  { id: "dips20", ic: "💥", n: "20 dips", d: "Une série de 20 dips" },
  { id: "push30", ic: "🚀", n: "30 pompes", d: "Une série de 30 pompes" },
  { id: "lsit15", ic: "🧱", n: "L-sit 15 s", d: "Un L-sit tenu 15 secondes" },
  { id: "mu", ic: "👑", n: "Premier muscle-up", d: "Tu es passé au-dessus de la barre !" },
  { id: "kg1", ic: "🌱", n: "+1 kg", d: "Premier kilo gagné" },
  { id: "kg5", ic: "💪", n: "+5 kg", d: "5 kilos gagnés depuis le départ" },
  { id: "goal3", ic: "🎯", n: "Objectif 3 mois", d: "Le premier palier de poids est atteint" },
  { id: "goal", ic: "🏆", n: "Objectif final", d: "Ton poids objectif est atteint" },
  { id: "meals7", ic: "🍽️", n: "7 jours bien nourri", d: "7 journées avec tous les repas cochés" },
  { id: "photo", ic: "📸", n: "Première photo", d: "Première photo du mois enregistrée" },
  { id: "park", ic: "🌳", n: "Explorateur", d: "2 parcs enregistrés" },
];

const LEVEL_NAMES = ["Recrue", "Apprenti", "Barreur", "Athlète", "Costaud", "Machine", "Bête de parc", "Titan", "Légende"];
