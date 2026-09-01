# État des lieux — reprise après /clear

Fichier de passation. À lire en premier dans une nouvelle session, avant de toucher au code.

**Dernière mise à jour :** 1er septembre 2026

---

## 1. Où on en est

| | |
|---|---|
| Site en ligne | https://artcodingclaude.github.io/cornell-notes/ |
| Repo | https://github.com/ArtCodingClaude/cornell-notes |
| Branch `main` | Version 1 **terminée, testée, déployée**. Ne rien casser dessus. |
| Branch `revision-impression-pwa` | **Travail en cours.** C'est ici que ça se passe. |

La v1 (tout le cahier des charges d'origine) est finie : accueil, éditeur Cornell,
réglages, guide, navigation clavier, mise à l'échelle du texte, sauvegarde auto,
import/export, thèmes clair/sombre, français + néerlandais.

Le déploiement est automatique : tout `git push` sur `main` republie le site via
GitHub Actions (`.github/workflows/deploy.yml`), en une à deux minutes.

---

## 2. Ce qui a été demandé

Cinq ajouts, dans cet ordre de priorité (l'ordre est de l'utilisateur, le respecter) :

1. **Mode révision** (« overhoren ») — masquer les notes, ne laisser que les mots-clés,
   répondre de tête, révéler. **Le plus important.**
2. **Impression / export PDF** — feuille de style d'impression, `Ctrl+P` sort une vraie
   page Cornell en trois zones, sans les boutons.
3. **Matière par note** (« vak ») — champ « Biologie », « Histoire », et un filtre sur
   l'accueil.
4. **Installable sur téléphone (PWA)** — `manifest.json`, icônes, hors ligne.
   **L'utilisateur a un iPhone** — voir la section décisions.
5. **Rappel de sauvegarde** — un discret « tu n'as rien exporté depuis 3 semaines ».

**Explicitement écarté pour l'instant :** la synchronisation entre appareils (serveur,
comptes, base de données — autre projet).

---

## 3. Ce qui est DÉJÀ FAIT sur cette branch

Tout ce qui suit compile (`npm run build` passe) et les tests de non-régression passent
sans erreur. C'est la **couche de données et les textes**, pas encore l'interface.

### `src/types.ts`
- `Note` a un nouveau champ **`subject: string`** (chaîne vide si pas de matière).
- `Settings` a **`lastExportAt: number`** (0 = jamais exporté) et
  **`backupSnoozedUntil: number`** — pour le rappel de sauvegarde (fonctionnalité 5).
- `ActionKey` a deux nouvelles actions : **`'review'`** et **`'print'`**.

### `src/lib/storage.ts`
- Valeurs par défaut ajoutées : `lastExportAt: 0`, `backupSnoozedUntil: 0`.
- Raccourcis par défaut ajoutés : `review: 'mod+r'`, `print: 'mod+p'`.
- `loadNotes()` migre les anciennes notes en leur ajoutant `subject: ''`. **Important :**
  les notes déjà enregistrées chez l'utilisateur n'ont pas ce champ, ne pas casser ça.

### `src/lib/shortcuts.ts`
- `actionOrder` contient `review` et `print` (ils apparaîtront donc automatiquement dans
  les réglages et dans l'overlay `?`).

### `src/lib/noteFile.ts`
- Export Markdown : la ligne de métadonnées devient `*Biologie — 2026-09-01*` quand une
  matière est renseignée, et reste `*2026-09-01*` sinon.
- Import Markdown : cette ligne est relue et la matière récupérée.
- `normalize()` (import JSON) remplit `subject: note.subject ?? ''`.

### `src/context/AppContext.tsx`
- `createNote()` crée la note avec `subject: ''`.

### `src/i18n/translations.ts`
- **Tous les textes des cinq fonctionnalités sont déjà écrits, en français ET en
  néerlandais** (134 clés de chaque côté, les deux dictionnaires sont alignés).
  Préfixes : `subject.*`, `review.*`, `print.*`, `backup.*`, `pwa.*`, plus
  `shortcuts.review`, `shortcuts.print`, `guide.featReview*`, `guide.featPrint*`.
- Il ne reste **rien à traduire** : il suffit d'utiliser les clés existantes.

### `src/components/Icons.tsx`
- Icônes ajoutées, pas encore utilisées : `EyeIcon`, `EyeOffIcon`, `BrainIcon`,
  `PrinterIcon`, `TagIcon`, `ShieldIcon`.

---

## 4. Ce qu'il RESTE À FAIRE

### 4.1 — Mode révision (priorité 1)

Dans `src/components/Editor.tsx` :

- Deux états : `reviewing: boolean` et `revealed: { notes: boolean; summary: boolean }`.
- Bouton **Réviser** dans la barre d'outils (`review.start` / `review.exit`,
  icône `BrainIcon`).
- En mode révision :
  - les trois `textarea` passent en `readOnly` (éviter les modifications accidentelles) ;
  - les sections **Notes** et **Résumé** sont masquées, chacune recouverte d'un bouton
    plein cadre « Révéler » (`review.revealNotes`, `review.revealSummary`, `EyeIcon`) ;
  - la colonne **Mots-clés** reste visible ;
  - un bouton « Masquer à nouveau » (`review.hideAgain`) remet tout en place.
- Technique du masque : garder le `textarea` dans le DOM avec
  `style={{ visibility: 'hidden' }}` et poser un bouton en `absolute inset-0` par-dessus
  — ça garde les hauteurs stables.
- Si la note n'a pas de mots-clés, afficher `review.emptyCues` plutôt qu'un écran vide.
- Câbler l'action `review` dans le `switch` des raccourcis de `src/App.tsx`.

### 4.2 — Impression / PDF (priorité 2)

- Bouton **Imprimer** dans la barre d'outils de l'éditeur (`print.action`,
  `PrinterIcon`), qui appelle `window.print()`. Câbler aussi l'action `print` dans
  `src/App.tsx`.
- **Piège connu** : un `textarea` dont le contenu dépasse sa boîte est **coupé à
  l'impression**. Solution retenue : à côté de chaque `textarea`, rendre un
  `<div className="print-only whitespace-pre-wrap">{value}</div>`, et en `@media print`
  cacher le `textarea` et afficher le div.
- **Deuxième piège** : la page imprimée fait environ 816px de large, donc **sous le
  seuil `lg:` (1024px) de Tailwind** — les colonnes se retrouveraient empilées. Il faut
  forcer la mise en page en `@media print` avec des classes dédiées
  (`print-columns`, `print-cues`, `print-notes`) et `display: flex !important`.
- Feuille de style à écrire dans `src/index.css`, dans un bloc `@media print` :
  fond blanc, texte noir, `@page { margin: 1.5cm }`, masquer tout ce qui porte
  `.no-print` (barre du haut, boutons, indicateur « enregistré »).
- Ajouter la classe `no-print` sur l'en-tête (`TopBar`) et sur la barre d'outils.

### 4.3 — Matière par note (priorité 3)

La couche de données est faite ; il reste l'interface.

- `src/components/Editor.tsx` : un champ matière dans l'en-tête de la note, à côté du
  titre et de la date (`subject.placeholder`, icône `TagIcon`). Le brancher sur un
  `<datalist>` alimenté par les matières déjà utilisées, pour éviter les fautes de
  frappe et les doublons.
- `src/components/Home.tsx` : une rangée de puces de filtre au-dessus de la grille —
  « Toutes » (`subject.all`), une puce par matière existante, et « Sans matière »
  (`subject.none`) s'il y a des notes sans matière. N'afficher la rangée que s'il existe
  au moins une matière.
- Afficher la matière sur la carte de chaque note dans la grille.

### 4.4 — PWA installable (priorité 4)

- Ajouter la dépendance **`vite-plugin-pwa`** (c'est l'outil standard ; il génère le
  service worker en connaissant les noms de fichiers hachés du build, ce qu'un service
  worker écrit à la main ne peut pas faire proprement).
- **Spécifique iPhone — c'est le point important, l'utilisateur est sur iOS :**
  - iOS **ignore** `manifest.json` pour l'icône d'accueil : il faut une balise
    `<link rel="apple-touch-icon" href="...-180.png">` dans `index.html` ;
  - ajouter `<meta name="apple-mobile-web-app-capable" content="yes">` et
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` ;
  - ajouter `viewport-fit=cover` au viewport et prévoir les marges
    `env(safe-area-inset-*)` (l'encoche) ;
  - **il n'y a pas de bouton « Installer » sur iPhone.** L'installation passe par
    Safari → bouton Partager → « Sur l'écran d'accueil ». Les textes `pwa.ios` et
    `pwa.other` sont **déjà écrits** : les afficher dans les réglages ou le guide.
- Icônes à produire : 192px, 512px, et 180px pour Apple. `public/favicon.svg` existe déjà
  et sert de base. **Astuce déjà validée dans ce projet** : pas besoin d'installer une
  bibliothèque d'images — on peut ouvrir le SVG dans Edge en mode headless via
  `puppeteer-core` et prendre une capture aux bonnes dimensions.

### 4.5 — Rappel de sauvegarde (priorité 5)

- Enregistrer `lastExportAt: Date.now()` à chaque export, dans `SettingsView.exportAll()`
  **et** dans l'export Markdown de l'éditeur.
- Une bannière discrète sur l'accueil, à afficher si :
  il y a au moins une note **et** `Date.now() > backupSnoozedUntil` **et**
  (`lastExportAt === 0` **ou** plus de 21 jours écoulés).
- Textes déjà écrits : `backup.title`, `backup.bodyNever`, `backup.bodyStale`
  (contient `{days}`, à remplacer), `backup.export`, `backup.snooze`.
- « Plus tard » repousse `backupSnoozedUntil` de 7 jours. Ne jamais bloquer l'écran :
  c'est une bannière, pas une fenêtre modale.
- Afficher aussi la date du dernier export dans les réglages
  (`backup.lastExport` / `backup.lastExportNever`).

### 4.6 — Finitions

- `src/components/GuideView.tsx` : ajouter `featReview` et `featPrint` au tableau
  `features` (les textes existent déjà).
- Mettre à jour `README.md` et `HOWTO.md`.
- `npm run build`, tester, puis **fusionner dans `main`** pour déclencher le déploiement.

---

## 5. Décisions déjà prises — ne pas les rouvrir

- **Interface bilingue français + néerlandais**, bascule dans les réglages. Le cahier
  des charges d'origine demandait le néerlandais seul ; l'utilisateur a choisi les deux.
- **Hébergement : GitHub Pages**, déploiement automatique par GitHub Actions.
- **Pas de serveur, pas de comptes.** Les notes vivent dans le `localStorage` du
  navigateur. C'est assumé, et c'est la raison d'être de la fonctionnalité 5.
- **`Ctrl+B` pour « nouvelle note »**, pas `Ctrl+N` : le navigateur intercepte `Ctrl+N`
  pour ouvrir une fenêtre, on ne peut pas le récupérer.
- **`Ctrl+R` pour la révision, `Ctrl+P` pour l'impression.** Tous les raccourcis sont
  modifiables dans les réglages, donc ces choix ne sont pas définitifs pour l'utilisateur.
- **Les couleurs de section sont fixes** (violet = mots-clés, bleu = notes, vert =
  résumé) et indépendantes de la couleur d'accent choisie, pour que la division en trois
  reste toujours lisible.
- **Le code, les noms de variables et les messages de commit sont en anglais.** C'est une
  convention, pas une préférence. Seuls les textes affichés à l'utilisateur et les
  fichiers de documentation (`HOWTO.md`, ce fichier) sont en français.

---

## 6. Piège déjà rencontré — ne pas le réintroduire

En v1, l'indicateur « enregistré » était mis à jour depuis un `useEffect` déclenché à
chaque frappe. React compte ça comme une mise à jour imbriquée et **coupe au bout de 50**
(`Maximum update depth exceeded`) dès qu'on tape vite. C'est corrigé : la sauvegarde
différée est maintenant pilotée par `scheduleSave()`, appelé **depuis les mutateurs**
(`updateNote`, `createNote`…), pas depuis un effet. Voir le commentaire dans
`src/context/AppContext.tsx`. **Ne pas remettre un effet sur `notes`.**

---

## 7. Comment vérifier son travail

`npm run build` ne prouve rien d'autre que « ça compile ». Pour vérifier qu'une
fonctionnalité marche vraiment, piloter un vrai navigateur :

- Edge est installé ici :
  `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
- Installer `puppeteer-core` **dans un dossier temporaire, pas dans le projet**, et
  lancer Edge en mode headless sur `http://localhost:5173/`.
- Écouter `pageerror` et `console` de type `error` — c'est comme ça que le bug de la
  section 6 a été trouvé. Une capture d'écran seule ne l'aurait pas montré.

À tester en particulier pour ces cinq fonctionnalités :

- révéler puis remasquer en mode révision, et vérifier qu'on ne peut pas modifier le
  texte pendant la révision ;
- l'impression : utiliser `page.pdf()` ou l'émulation du média `print` de Chrome pour
  vérifier que **tout le texte des notes longues apparaît** (c'est le piège du
  `textarea` coupé) ;
- le filtre par matière avec des notes sans matière ;
- sur iPhone, l'installation ne peut se tester qu'à la main, sur l'appareil.

---

## 8. Commandes utiles

```
npm run dev      # serveur local, http://localhost:5173/
npm run build    # vérifie et fabrique le site
git push         # sur main : republie le site tout seul
```

Le reste est dans `HOWTO.md`.
