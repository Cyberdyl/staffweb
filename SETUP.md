# 🛠️ Guide d'installation — Recrutement Staff FiveM

Ce guide te fait passer de zéro à un site en ligne. Compte ~20 minutes.

> **Ordre conseillé :** Supabase → SQL → Discord → Local → te désigner Propriétaire → GitHub Pages.

---

## 1. Prérequis

- [Node.js](https://nodejs.org) 18 ou plus (`node --version`)
- Un compte [GitHub](https://github.com)
- Un compte [Supabase](https://supabase.com) (gratuit)
- Ton serveur **Discord** + accès au [portail développeur Discord](https://discord.com/developers/applications)

---

## 2. Créer le projet Supabase

1. [supabase.com](https://supabase.com) → **New project**.
2. Choisis un nom, un mot de passe de base de données (garde-le), une région **proche de tes joueurs** (ex. *West EU*).
3. Une fois le projet prêt : **Project Settings → API**.
   - Copie **Project URL** → ce sera `VITE_SUPABASE_URL`.
   - Copie la clé **anon public** → ce sera `VITE_SUPABASE_ANON_KEY`.

> 🔒 La clé *anon* est **publique**, c'est normal. La sécurité est assurée par les règles RLS installées à l'étape suivante.

---

## 3. Installer la base de données

1. Dans Supabase : **SQL Editor → New query**.
2. Copie **tout** le contenu de [`supabase/migrations/0001_schema.sql`](supabase/migrations/0001_schema.sql), colle, clique **Run**.
3. Nouvelle requête : copie [`supabase/migrations/0002_seed.sql`](supabase/migrations/0002_seed.sql), colle, **Run**.

Tu dois voir les tables `profiles`, `applications`, `appointments`, `grades`, `ig_permissions`, `staff_members`, `staff_reviews` dans **Table Editor**, et 18 grades dans `grades`.

---

## 4. Créer l'application Discord (connexion)

1. [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** → donne-lui un nom.
2. Menu **OAuth2** :
   - Note le **Client ID**.
   - Clique **Reset Secret** → copie le **Client Secret**.
3. Toujours dans **OAuth2 → Redirects**, ajoute l'URL de callback Supabase :

   ```
   https://<TON-REF>.supabase.co/auth/v1/callback
   ```

   > Tu trouves l'URL exacte dans Supabase → **Authentication → Providers → Discord** (champ « Callback URL » / « Redirect URL »). Copie-la telle quelle.
4. **Save Changes**.

---

## 5. Brancher Discord dans Supabase

1. Supabase → **Authentication → Providers → Discord**.
2. Active **Enable Sign in with Discord**.
3. Colle le **Client ID** et le **Client Secret** de l'étape 4.
4. **Save**.

Puis **Authentication → URL Configuration** :
- **Site URL** : pour l'instant `http://localhost:5173`
- **Redirect URLs** : ajoute ces deux lignes (tu ajouteras l'URL GitHub Pages à l'étape 8) :
  ```
  http://localhost:5173
  http://localhost:5173/**
  ```

---

## 6. Lancer en local

```bash
# à la racine du projet
cp .env.example .env      # (Windows PowerShell : copy .env.example .env)
```

Édite `.env` et remplis avec tes valeurs de l'étape 2 :

```
VITE_SUPABASE_URL=https://<TON-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SERVER_NAME=BlueStark
```

Puis :

```bash
npm install
npm run dev
```

Ouvre **http://localhost:5173** → clique **Se connecter avec Discord** → autorise. Tu reviens connecté. 🎉

---

## 7. Te désigner Propriétaire

Au premier login tu es « Candidat ». Pour devenir **Propriétaire** (accès total + gestion des Gérants) :

1. Supabase → **SQL Editor → New query**.
2. Exécute (remplace par **ton** e-mail Discord) :

   ```sql
   update public.profiles set role = 'owner'
   where email = 'ton-email@exemple.com';
   ```

   > Tu ne connais pas l'e-mail utilisé ? Liste les comptes : `select id, username, email from public.profiles;` puis cible par `username`.
3. Recharge le site. Tu vois maintenant les sections **Staff** et **Direction** dans le menu.

Ensuite, tu attribues le rôle **Gérant staff** à n'importe qui depuis la page **Gérants** (plus besoin de SQL).

---

## 8. Mettre en ligne sur GitHub Pages

1. Crée un dépôt GitHub et pousse le code :

   ```bash
   git init
   git add .
   git commit -m "Site recrutement staff"
   git branch -M main
   git remote add origin https://github.com/<toi>/<repo>.git
   git push -u origin main
   ```

2. Sur GitHub : **Settings → Secrets and variables → Actions** :
   - Onglet **Secrets** → **New repository secret** :
     - `VITE_SUPABASE_URL` = ton URL Supabase
     - `VITE_SUPABASE_ANON_KEY` = ta clé anon
   - Onglet **Variables** (facultatif) → `VITE_SERVER_NAME` = nom de ta communauté

3. **Settings → Pages → Build and deployment → Source = GitHub Actions**.

4. Le workflow se lance à chaque `push` sur `main`. À la fin, ton URL ressemble à :
   ```
   https://<toi>.github.io/<repo>/
   ```

5. **Important** — retourne dans Supabase → **Authentication → URL Configuration** et ajoute cette URL :
   - **Site URL** : `https://<toi>.github.io/<repo>/`
   - **Redirect URLs** : ajoute `https://<toi>.github.io/<repo>/**`

   (Garde aussi les lignes localhost pour continuer à développer.)

C'est en ligne ! 🚀

---

## 9. Notifications Discord (MP automatiques)

Le site envoie des **MP Discord** automatiques : aux **gérants** quand une
candidature arrive, et au **candidat** quand elle est acceptée/refusée.
Il faut un **bot** Discord (2 min) :

1. [Portail développeur](https://discord.com/developers/applications) → ton application → menu **Bot**.
2. **Reset Token** → copie le **token** (c'est un secret !).
3. Invite le bot sur ton serveur : menu **OAuth2 → URL Generator** → coche
   le scope **bot** (aucune permission nécessaire) → ouvre l'URL générée →
   ajoute-le à ton serveur. *(Le bot doit partager un serveur avec la
   personne pour pouvoir lui écrire en MP.)*
4. Enregistre le token dans la base — Supabase → **SQL Editor** :

   ```sql
   insert into public.app_secrets (key, value) values ('discord_bot_token', 'TON_TOKEN')
   on conflict (key) do update set value = excluded.value;
   ```

> Les membres qui désactivent les MP venant du serveur ne recevront pas les
> notifications (limitation Discord).

---

## Dépannage

| Problème | Solution |
|---|---|
| Écran « Configuration requise » | Le `.env` est manquant ou mal rempli (en local) / secrets GitHub absents (en ligne). |
| « redirect_uri is not supported » à la connexion | L'URL de callback Supabase n'est pas dans **OAuth2 → Redirects** côté Discord (étape 4). |
| Connexion qui boucle / ne revient pas | L'URL du site n'est pas dans **Redirect URLs** de Supabase (étapes 5 et 8). |
| « Accès réservé » alors que tu es admin | Tu n'as pas encore exécuté le SQL de l'étape 7, ou il faut recharger la page. |
| Modifs SQL non prises en compte | Ré-exécute la migration ; le seed est idempotent (pas de doublon). |
