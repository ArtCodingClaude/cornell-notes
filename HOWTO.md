# HOWTO — les commandes de ce projet

Toutes les commandes se tapent dans le **terminal**, dans le dossier du projet
(`C:\Users\Arthur\Desktop\Projet Site Web`).

---

## Voir le site sur ton ordinateur

```
npm run dev
```

Ça démarre le *dev server* (le petit programme qui affiche le site pendant que tu
travailles dessus). Quand ça marche, tu vois :

```
➜  Local:   http://localhost:5173/
```

Ctrl-clic sur ce lien pour ouvrir le site dans ton navigateur.

Le terminal a l'air **bloqué** après ça. Il ne l'est pas : le serveur tourne dedans.

- Pour l'arrêter : `Ctrl+C`
- Pour taper autre chose pendant qu'il tourne : ouvre un **deuxième onglet** de terminal

Si tu modifies un fichier, la page se met à jour toute seule.

---

## Fabriquer la version finale

```
npm run build
```

Ça vérifie le code et fabrique le site dans le dossier `dist/`. Si quelque chose ne va
pas, l'erreur s'affiche ici — c'est la commande à lancer en cas de doute.

Pour regarder le résultat final avant de le publier :

```
npm run preview
```

---

## Refabriquer les dictionnaires du correcteur

```
npm run wordlists
```

Ça télécharge les listes de mots (français, anglais, néerlandais) et réécrit les fichiers
dans `src/lib/words/`. **À ne lancer que si on veut changer les dictionnaires** — le
résultat est enregistré dans le projet, donc l'app n'a jamais besoin d'Internet pour
corriger. Ça prend une minute et il faut une connexion.

---

## Installer les dépendances

À faire une seule fois, ou si tu récupères le projet sur une autre machine :

```
npm install
```

Les *dépendances* sont les bibliothèques de code que le projet utilise. Elles
atterrissent dans `node_modules/`, un dossier qui n'est jamais envoyé sur GitHub.

---

## L'adresse publique du site

**https://artcodingclaude.github.io/cornell-notes/**

Cette adresse marche depuis n'importe quel ordinateur, sans rien installer. Attention :
les notes restent dans le navigateur de chaque machine (voir la dernière section), donc
un autre ordinateur démarre avec une liste vide.

---

## Publier une nouvelle version en ligne

Le site est publié automatiquement. Il suffit d'envoyer le code sur GitHub :

```
git add .
git commit -m "décris ce que tu as changé"
git push
```

GitHub reconstruit et republie le site tout seul, en une ou deux minutes.

Pour suivre l'avancement : onglet **Actions** sur la page GitHub du projet.

**Une seule branche est publiée : `main`.** Si tu travailles sur une autre *branch* (une
copie du code où on peut expérimenter sans casser la version qui marche), le site en
ligne ne bougera pas tant que ce travail n'est pas ramené sur `main` :

```
git checkout main
git merge nom-de-la-branche
git push
git checkout nom-de-la-branche
```

---

## Où sont les erreurs ?

Il y a **deux endroits différents**, et ce ne sont pas les mêmes erreurs :

| Où | Quoi |
|---|---|
| Le **terminal** | Le site ne compile pas, le serveur a planté |
| La **console du navigateur** (`F12`, onglet *Console*) | La page s'affiche mais quelque chose ne marche pas dedans |

---

## Problèmes courants

- **`command not found`** → tu n'es pas dans le bon dossier, ou `npm install` n'a jamais
  été lancé.
- **`port already in use`** → le serveur tourne déjà dans un autre onglet du terminal.
- **La page ne change pas** → recharge de force (`Ctrl+Shift+R`), ou regarde le terminal :
  le serveur a peut-être planté.

---

## Où sont enregistrées les notes ?

Dans le navigateur de chaque visiteur (`localStorage`), pas sur un serveur. Concrètement :

- Tes notes restent sur ta machine, personne d'autre ne les voit.
- Si tu vides les données de ton navigateur, elles disparaissent.
- Le bouton **Exporter** dans les réglages télécharge tout dans un fichier `.json` —
  c'est la sauvegarde.
