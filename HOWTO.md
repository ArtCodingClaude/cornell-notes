# HOWTO — les commandes de ce projet

Toutes les commandes se tapent dans le **terminal**, dans le dossier du projet
(`C:\Users\Arthur\Projets Claude\Projet Site Web`).

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

---

## Le chat avec Claude (serveur Supabase)

Le chat passe par une *Edge Function* Supabase appelée `chat` (un petit programme qui
tourne sur les serveurs de Supabase, pas dans le navigateur). Elle garde la clé
Anthropic secrète, vérifie le code d'accès et le compte de la personne, et limite à
**30 messages par jour et par personne**.

**Ton projet :** `cornell-notes` (Project ref `hixvrgrdaazwthfrixgs`)
**Adresse de la fonction :** https://hixvrgrdaazwthfrixgs.supabase.co/functions/v1/chat

Il a été configuré via le site Supabase le 18/11/2026 : les étapes 1, 3 et 5
ci-dessous sont faites, ainsi que le point 2 de l'étape 6 (inscriptions coupées).
L'étape 2 n'est utile que pour redéployer depuis le terminal. Il reste : les deux
secrets (étape 4, ou directement sur le site dans Edge Functions → Secrets) et les
5 comptes (étape 6, point 1).

Les fichiers :

- `supabase/functions/chat/index.ts` — la fonction elle-même
- `supabase/migrations/…_create_usage.sql` — la table `usage` qui compte les messages
- `supabase/config.toml` — les réglages Supabase du projet

Toutes les commandes `npx supabase …` téléchargent l'outil Supabase la première fois
(rien à installer). Tape-les dans le terminal, dans le dossier du projet.

### 1. Créer le projet (une seule fois, à la main)

1. Va sur **https://supabase.com**, crée un compte, puis **New project**.
2. Choisis un mot de passe de base de données et **garde-le** (gestionnaire de mots de
   passe) : la commande `link` le demandera.
3. Région : la plus proche de toi (par ex. *Central EU (Frankfurt)*).
4. Une fois le projet créé, note sa **Project ref** : c'est le code dans l'adresse du
   tableau de bord, `supabase.com/dashboard/project/`**`abcdefghijklmnop`**.

### 2. Se connecter et relier le dossier au projet

```
npx supabase login
```

Ça ouvre le navigateur pour te connecter. Succès : `You are now logged in.`

```
npx supabase link --project-ref TA_PROJECT_REF
```

Remplace `TA_PROJECT_REF` par le code noté plus haut. Il demande le mot de passe de la
base de données. Succès : `Finished supabase link.`

### 3. Créer la table `usage`

```
npx supabase db push
```

Il liste la migration et demande confirmation (`Y`). Succès : `Finished supabase db push.`

### 4. Enregistrer les secrets

Les secrets ne doivent **jamais** être tapés directement dans une commande (PowerShell
garde l'historique de ce que tu tapes) ni enregistrés dans un fichier suivi par git.
La méthode propre :

1. Crée un fichier `supabase/.env` (il est ignoré par git, il ne partira pas sur GitHub)
   avec ces deux lignes :

   ```
   ANTHROPIC_API_KEY=colle-ici-ta-cle-anthropic
   ACCESS_CODE=choisis-un-code-d-acces
   ```

2. Envoie-les à Supabase :

   ```
   npx supabase secrets set --env-file supabase/.env
   ```

   Succès : `Finished supabase secrets set.`

3. **Supprime** `supabase/.env` ensuite : les secrets sont maintenant chez Supabase,
   plus besoin de les garder sur ton ordinateur.

Pour vérifier (ça affiche les noms, pas les valeurs) :

```
npx supabase secrets list
```

### 5. Publier la fonction

```
npx supabase functions deploy chat --no-verify-jwt
```

Succès : `Deployed Functions on project … : chat`. À relancer à chaque modification de
`index.ts`.

`--no-verify-jwt` laisse passer les requêtes `OPTIONS` du navigateur (le « pré-vol »
CORS, qui n'a jamais de jeton). La fonction vérifie quand même elle-même que la personne
est connectée.

### 6. Créer les comptes des 5 personnes (à la main)

Dans le tableau de bord Supabase :

1. **Authentication → Users → Add user → Create new user** : email + mot de passe,
   coche **Auto Confirm User**. Recommence pour chaque personne.
2. **Authentication → Sign In / Providers** : désactive **Allow new users to sign up**,
   pour que personne d'autre ne puisse se créer un compte.

### Où voir les erreurs du serveur

Tableau de bord Supabase → **Edge Functions → chat → Logs**. C'est un **troisième**
endroit, différent du terminal et de la console du navigateur.

### Ce que l'app devra envoyer

- `POST` vers `https://TA_PROJECT_REF.supabase.co/functions/v1/chat`
- en-têtes : `x-access-code` (le code d'accès) et `Authorization: Bearer <jeton de
  connexion de la personne>`
- corps : `{ "messages": [{ "role": "user", "content": "…" }] }`
- réponse en streaming : `meta` (messages restants), puis des `text`, puis `done`.
  Au-delà de 30 messages : erreur `429` avec `remaining: 0`.
