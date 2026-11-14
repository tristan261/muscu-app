# FORGE — street workout + alimentation

Application web installable (PWA) : programme de street workout qui s'adapte tout seul,
plan repas et liste de courses, suivi du poids, records, photos, badges.

- Fonctionne **hors connexion** une fois ouverte une première fois.
- Toutes les données (et les photos) restent **sur le téléphone**. Rien n'est envoyé sur Internet.
- Aucun compte, aucun serveur : HTML + CSS + JavaScript simple.

## L'installer sur un téléphone Android

1. Ouvre le lien de l'app dans **Chrome** : `https://tristan261.github.io/muscu-app/`
2. Appuie sur les **3 points** en haut à droite.
3. Appuie sur **« Ajouter à l'écran d'accueil »** puis **« Installer »**.
4. L'icône FORGE apparaît sur l'écran d'accueil : ouvre l'app depuis là.

## Sauvegarde

Dans l'app : **Plus → Réglages et sauvegarde → Exporter une sauvegarde**.
Garde le fichier `.json` (Google Drive, mail). Pour le remettre : **Importer une sauvegarde**.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html`, `style.css` | La page et son apparence |
| `js/data.js` | Exercices, programme A/B/C, repas, badges |
| `js/logic.js` | Progression automatique, plan repas, courses, XP |
| `js/ui.js` | Les écrans |
| `js/session.js` | Le mode séance (chrono, séries) |
| `js/store.js` | Enregistrement des données sur le téléphone |
| `sw.js`, `manifest.webmanifest` | Installation et fonctionnement hors connexion |

Après une modification du code, augmenter le numéro dans `sw.js` (`forge-v1` → `forge-v2`).

FORGE ne remplace pas l'avis d'un médecin.
