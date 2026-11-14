# FORGE V2 — street workout + alimentation

Application web installable (PWA), faite pour une seule personne.
4 onglets : **Aujourd'hui · Séance · Bilan · Manger** (tout le reste est dans ⚙️ sur Aujourd'hui).

- Hors connexion une fois ouverte une première fois.
- Toutes les données et les photos restent **sur le téléphone**.
- Aucun compte, aucun serveur : HTML + CSS + JavaScript simple.
- Les données de la V1 sont reprises automatiquement (`forge.v1` → `forge.v2`, la copie V1 est conservée).

## Installer sur Android

1. Ouvre `https://tristan261.github.io/muscu-app/` dans **Chrome**.
2. 3 points en haut à droite → **Ajouter à l'écran d'accueil** → **Installer**.

## Les règles (tout est déterministe, rien d'aléatoire)

- **Double progression** : chaque exercice a une fourchette de reps ; objectif = +1 rep par série ;
  haut de fourchette partout 2 séances de suite → variante suivante ; bas de fourchette raté 2 séances de suite → un cran en dessous ;
  3 séances sans progrès → pause puis tempo. Jamais de série à l'échec.
- **Jours** : jamais 2 séances lourdes consécutives (la 2e devient la séance technique légère).
- **Muscle-up** : 3 portes (10 tractions + 10 dips → 5 tractions explosives poitrine à la barre → 3 négatives de 5 s), puis les essais.
- **Poids** : consigne calculée sur des moyennes de pesées ; moins de 0,5 kg/mois sur 3 semaines → +250 kcal/jour ; les calories ne baissent jamais.
- **Repas** : 53 repas, jamais plus de 2 fois le même dans la semaine, plan différent de la semaine précédente, midi de semaine transportable sans frigo.

## Tests automatiques

```bash
node tests/logic.test.js
```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `js/data.js` | Exercices, échelles de progression, séances, repas, badges |
| `js/logic.js` | Les règles (progression, semaine, muscle-up, poids, repas, courses) |
| `js/store.js` | Enregistrement sur le téléphone, migration V1 → V2, sauvegarde |
| `js/ui.js`, `js/session.js` | Les écrans et le mode séance |
| `sw.js`, `manifest.webmanifest` | Installation et fonctionnement hors connexion |

Après une modification du code, changer le numéro dans `sw.js` (`forge-v2` → `forge-v3`).

FORGE ne remplace pas l'avis d'un médecin.
