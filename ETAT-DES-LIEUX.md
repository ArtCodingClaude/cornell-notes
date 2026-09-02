# État des lieux — reprise après /clear

Fichier de passation. À lire en premier dans une nouvelle session, avant de toucher au code.

**Dernière mise à jour :** 2 septembre 2026 (correction automatique)

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
- ⚠️ **Import Markdown : PAS fait, contrairement à ce que disait ce fichier.** Dans
  `markdownToNote()`, la variable `subject` est déclarée (`let subject = ''`) puis
  jamais remplie : seule la date est extraite de la ligne de métadonnées. Une note
  exportée en `.md` avec une matière la perd si on la réimporte. À corriger en même
  temps que l'interface des matières (section 4.3).
- `normalize()` (import JSON) remplit `subject: note.subject ?? ''`.
- `headings` couvre les trois langues ; `aliases` accepte déjà les orthographes
  anglaises (`cues`, `keywords`, `notes`, `summary`), donc un `.md` anglais se
  réimporte correctement.

### `src/context/AppContext.tsx`
- `createNote()` crée la note avec `subject: ''`.

### `src/i18n/translations.ts`
- **Tous les textes des cinq fonctionnalités sont déjà écrits, dans les trois langues**
  (anglais, français, néerlandais — les trois dictionnaires sont alignés).
  Préfixes : `subject.*`, `review.*`, `print.*`, `backup.*`, `pwa.*`, plus
  `shortcuts.review`, `shortcuts.print`, `guide.featReview*`, `guide.featPrint*`.
- Il ne reste **rien à traduire** : il suffit d'utiliser les clés existantes.

### `src/components/Icons.tsx`
- Icônes ajoutées, pas encore utilisées : `EyeIcon`, `EyeOffIcon`, `BrainIcon`,
  `PrinterIcon`, `TagIcon`, `ShieldIcon`.

---

## 4. Ce qu'il RESTE À FAIRE

### 4.1 — Mode révision (priorité 1) — ✅ FAIT ET TESTÉ

Implémenté dans `src/components/Editor.tsx`, conforme au plan, avec deux écarts notés
plus bas. Détail dans la section 5c.

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

- **Interface trilingue anglais + français + néerlandais**, bascule dans les réglages.
  **L'anglais est la langue par défaut** (`language: 'en'` dans `src/lib/storage.ts`) :
  c'est ce que voit un nouveau visiteur. Le cahier des charges d'origine demandait le
  néerlandais seul ; l'utilisateur a choisi les trois, anglais en tête.
  Les trois dictionnaires sont dans `src/i18n/translations.ts`. `fr` est la source de
  vérité du type `TranslationKey` ; `en` et `nl` sont typés
  `Record<TranslationKey, string>`, donc **une clé oubliée casse le build** — c'est
  voulu, ne pas relâcher ce typage.
  Deux endroits dépendent aussi de la langue et sont typés `Record<Language, …>` pour la
  même raison : les titres de sections Markdown (`headings` dans `src/lib/noteFile.ts`)
  et le format des dates (`dateLocales` dans `src/components/Home.tsx`).
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

## 5b. Puces automatiques et taille du texte (fait, testé)

Deux fonctionnalités hors des cinq de la section 2, demandées en cours de route.

- **Puces automatiques** — `src/lib/bullets.ts`. Entrée met un marqueur devant la ligne
  qu'on vient de finir et en démarre un sur la suivante ; Entrée sur une puce vide sort
  d'un niveau ; `Alt+→` / `Alt+←` changent de niveau (3 niveaux : `•` `◦` `▪`) ;
  `Maj+Entrée` donne une ligne sans puce. **Mots-clés et Notes seulement** — le Résumé
  est du texte rédigé, choix de l'utilisateur.
  Le style est un réglage (`settings.bulletStyle` : `off` / `dot` / `dash`), par défaut
  `dot`. Les marqueurs sont de **vrais caractères dans le texte** : ce qu'on voit est ce
  qui est sauvegardé. `bulletsToMarkdown()` les reconvertit en `- ` à l'export, en
  gardant l'indentation.
  ⚠️ `parseBullet` accepte aussi `-` et `*`, donc une note importée d'ailleurs se
  comporte correctement. En revanche l'import ne **normalise pas** vers le style choisi :
  un `.md` en tirets reste en tirets dans une note réglée sur `•`. Pas gênant, pas
  corrigé.

- **Taille du texte** — `src/hooks/useAutoFontSize.ts` a été **réécrit**. Il comptait les
  caractères contre des seuils fixes ; il **mesure maintenant le débordement réel**
  (`scrollHeight > clientHeight`) par recherche dichotomique entre min et max, avec un
  `ResizeObserver` pour recalculer quand la fenêtre change. L'export s'appelle
  `useFitFontSize(ref, value, settings)`.
  Deux points à ne pas casser : la transition CSS est **désactivée pendant la mesure**
  (sinon on lit la frappe d'animation en cours, pas la mise en page finale) ; et si
  `clientHeight === 0` (pas encore affiché) on renvoie `max` au lieu de conclure à un
  débordement imaginaire.
  Mesuré : ~10 ms par caractère dans une boîte pleine, pas de saccade.

- ⚠️ **Retrait suspendu : impossible dans un `textarea`, ne pas réessayer.** Aligner la
  deuxième ligne d'une puce longue sur le texte plutôt que sous le marqueur demande
  `text-indent` négatif — or un `textarea` est **un seul bloc**, donc `text-indent` ne
  tire que la toute première ligne et décale toutes les autres vers la droite. Essayé,
  constaté à l'écran, annulé. Ce sera en revanche possible dans les `div` d'impression
  de la fonctionnalité 4.2.

---

## 5c. Mode révision (fonctionnalité 1) — fait, testé

Tout est dans `src/components/Editor.tsx`, sauf le raccourci.

- États : `reviewing: boolean` et `revealed: { notes, summary }`. Remis à zéro en
  entrant **et** en sortant, et à chaque changement de `note.id` (sinon on rouvre une
  autre note en pleine révision).
- Les trois `textarea` passent en `readOnly` ; les puces automatiques sont désactivées
  avec elles (`bulletsOn` inclut `!readOnly`).
- Notes et Résumé sont recouverts d'un bouton plein cadre. Le `textarea` reste dans le
  flux en `visibility: hidden` — **vérifié : les hauteurs ne bougent pas** (384 / 384 /
  144 avant comme pendant).
- Le compteur de caractères de l'en-tête est remplacé par `review.hidden` quand la
  section est couverte : sinon il annonce la longueur de la réponse.
- `move()` (Tab entre sections) **saute les sections couvertes**, sinon le curseur
  atterrit dans un `textarea` invisible.

**Deux écarts par rapport au plan d'origine :**

1. **Pas de `BrainIcon`.** À 20px il se lit comme un rectangle barré — le tracé a une
   ligne verticale au centre. Remplacé par la paire `EyeOffIcon` (activer = masquer) /
   `EyeIcon` (quitter = tout remontrer), cohérente avec les boutons « Révéler ».
   `BrainIcon` reste dans `Icons.tsx`, inutilisé.
2. **Le raccourci passe par un compteur.** `App.tsx` ne connaît pas l'état de l'éditeur ;
   l'action `review` incrémente `reviewRequest`, et l'éditeur compare avec la dernière
   valeur traitée (`useRef`) pour ne pas se déclencher au montage. Même principe que
   `focusRequest`, qui existait déjà. **`view` a dû être ajouté aux dépendances** de
   l'effet des raccourcis dans `App.tsx`.

**Vérifié dans Edge** (masquage, révélation section par section, « Masquer à nouveau »,
`Ctrl+R` dans les deux sens, impossibilité d'éditer pendant la révision, réinitialisation
au changement de note, note sans mots-clés, affichage 390px) — 0 erreur console.
`Ctrl+R` : le `preventDefault` empêche bien le rechargement de Chromium.

⚠️ **Piège de test, pas un bug de l'app** : la `TopBar` est `sticky top-0 z-20`. Quand
Puppeteer fait défiler un bouton de la barre d'outils pour cliquer dessus, il le place
**sous** l'en-tête et le clic atterrit sur l'en-tête. Faire `window.scrollTo(0, 0)` avant
de cliquer, ou cliquer via `page.mouse.click()` sur une position vérifiée.

---

## 5d. Annulation et révision au clavier (fait, testé)

Deux ajouts de confort demandés après le mode révision, sur la base de mesures.

### Annulation par édition — `src/hooks/useUndoHistory.ts` (nouveau)

**Le problème mesuré :** un `textarea` contrôlé par React n'a pas d'annulation native
utilisable. React réécrit `value` à chaque frappe, le navigateur enregistre donc une
entrée par caractère, et `Ctrl+Z` sur « hello world » rendait « hello worl ». Onze
pressions pour effacer deux mots. **Ça existait depuis la v1**, ce n'est pas une
régression des puces.

**La solution :** un historique maison de `Snapshot` (`title`, `cues`, `notes`,
`summary`). Une capture est validée après **500 ms sans frappe** — c'est ce qui fait
qu'on annule une phrase et pas une lettre. `Ctrl+Z` / `Ctrl+Maj+Z`, tous deux
modifiables dans les réglages (`undo` / `redo` dans `ActionKey`). Pile bornée à 100.

Points à ne pas casser :
- Le drapeau `restoring` empêche une restauration d'être relue comme une nouvelle
  édition (sinon la pile se remplit d'elle-même).
- Toute nouvelle frappe vide la pile de rétablissement.
- `changedField()` sert à replacer le curseur dans la section modifiée. Sans ça, on
  annule une modification du résumé et le curseur reste dans les notes.
- L'historique repart de zéro à chaque changement de `note.id`.

### Révision au clavier

**Espace** (ou Entrée) fait tout le cycle : révèle les notes, puis le résumé, puis
remasque tout pour la question suivante. Non configurable — n'agit qu'en révision, où
tout est en lecture seule et où aucune autre touche ne réclame l'espace. Une ligne fixe
l'annonce dans l'overlay `?` et le bandeau l'affiche.

⚠️ **Deux pièges, tous deux corrigés, à ne pas réintroduire :**

1. **Le focus restait sur le bouton « Review ».** En entrant en révision à la souris, le
   focus reste sur le bouton cliqué ; Espace le réactivait donc et **sortait** du mode au
   lieu de révéler. Corrigé en déplaçant le focus sur la colonne des mots-clés à
   l'entrée. Le garde `event.target instanceof HTMLButtonElement` reste nécessaire pour
   les boutons « Révéler ».
2. **Pas de `setRevealed(updater)` ici.** L'état suivant est calculé à partir de la
   valeur du rendu courant, avec `revealed` dans les dépendances de l'effet. Une même
   pression arrivant deux fois recalcule alors la même chose, au lieu de sauter une
   étape en chaînant les mises à jour.

### Mesures de performance (pour ne pas réoptimiser à l'aveugle)

- Frappe : **16,7 ms médian** — soit une image à 60 i/s, le minimum physique. La mise à
  l'échelle automatique coûte **3 ms dans le pire cas**. Rien à optimiser.
- Recherche sur l'accueil avec **120 notes : 40 à 58 ms par lettre**, visible. Le
  `useMemo` de `Home.tsx` concatène titre + mots-clés + notes + résumé de chaque note à
  chaque frappe. À différer (150 ms) le jour où ça gêne — pas avant.
- `localStorage` : 417 kB pour 120 notes bien remplies. La limite est autour de 5 Mo.

**Restent proposés, non faits :** note suivante/précédente depuis l'éditeur, recherche
différée, fondu à la révélation.

---

## 5e. Correction automatique (fait, testé)

Demandée en cours de route, hors des cinq de la section 2.

- **`src/lib/autocorrect.ts` (nouveau)** — une **liste fixe** de fautes courantes par
  langue (294 entrées en français, 79 en anglais, 28 en néerlandais) : accents oubliés
  (`eleve` → `élève`), doubles lettres, faux amis (`example` → `exemple`), et quelques
  abréviations de cours développées (`bcp`, `pcq`, `tjrs`, `qqch`).
  Ce n'est **pas** un correcteur orthographique : un mot absent de la liste n'est jamais
  touché. La liste exclut délibérément tout ce qui est **ambigu** — `a`/`à`, `ou`/`où`,
  `sur`/`sûr`, `cote`/`côté` sont tous de vrais mots et seule la phrase tranche. Ne pas
  ajouter ce genre d'entrée : ça abîmerait des notes correctes.
  La langue utilisée est `settings.language`, celle de l'interface.
- **Un mot n'est composé que de lettres** (`\p{L}\p{M}`, pas d'apostrophe), pour que
  `l'eleve` propose bien `élève` au lieu de chercher `l'eleve`. Les majuscules du mot
  tapé sont reportées sur le remplacement (`Eleve` → `Élève`, `SIECLE` → `SIÈCLE`).
- **La correction s'applique en finissant le mot** — espace, Entrée ou ponctuation
  (`commitKeys`). **Pas** sur Tab, qui sert à changer de section ici.
  Elle est fondue **dans la même édition** que le caractère qui l'a déclenchée : une
  frappe, une seule annulation. Quand les puces sont actives, le texte corrigé est passé
  à `onEnter()` puis à `renumber()`, dans cet ordre.
- **Le mot proposé s'affiche en permanence** dans le bandeau de la section, à côté du
  titre — jamais au-dessus du curseur : positionner une bulle sur le caret d'un
  `textarea` demande un div miroir, et la taille de police variable de ce projet rendrait
  le calcul faux. Le bandeau a une **hauteur fixe** (`min-h-[2.15rem]`) pour que
  l'apparition de la pastille ne décale pas le texte d'un ou deux pixels.
  Le compteur de caractères s'efface pour lui laisser la place là où les deux se
  battraient : toujours dans la colonne étroite, et partout sur téléphone.
- **`Alt` (un appui seul, pas une combinaison) garde le mot tel quel**, et ce mot n'est
  plus proposé jusqu'à la fin de la visite (`kept`, un `Set` tenu dans `Editor`, non
  sauvegardé). Volontairement un appui seul : sous Windows, `Alt+Espace` est intercepté
  par le système pour ouvrir le menu de la fenêtre, donc la combinaison n'était pas
  fiable. Le `keydown` de `Alt` fait `preventDefault()`, ce qui empêche aussi le focus de
  partir dans la barre de menus.
- **Réglage `settings.autocorrect`**, activé par défaut, dans Réglages → Texte.
- Vérifié dans Edge (frappe à 0 ms de délai, 234 caractères, rien de perdu), en clair et
  en sombre, en 1280px et en 390px, et en mode révision (aucune proposition, le champ
  est en lecture seule).

**Numérotation : le compteur ne repart plus à zéro.** Dans `renumber()`, une ligne sans
marqueur ne remettait pas seulement le style en cause, elle relançait le comptage à 1.
Elle est maintenant simplement sautée : le compte court sur toute la section, donc une
ligne intercalée, un titre ou un sous-niveau est une **pause** dans la liste, pas sa fin.
`1. / 2. / une remarque / 3.` au lieu de `1. / 2. / une remarque / 1.`

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
