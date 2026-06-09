# 🛡️ Recrutement & Gestion Staff — FiveM

Site de **recrutement et de gestion du staff** pour un serveur FiveM.
Connexion **Discord**, formulaire de candidature dédié, panel d'administration,
calendrier d'entretiens partagé, effectif staff avec grades & permissions IG, et
préparation des réunions staff.

Front statique **React + Vite** déployable sur **GitHub Pages**, back-end
**Supabase** (Postgres + Auth Discord + sécurité RLS). Aucun serveur à maintenir.

> 👉 Installation pas-à-pas dans **[SETUP.md](SETUP.md)**.

---

## ✨ Fonctionnalités

**Espace candidat (public)**
- Page d'accueil de recrutement
- Connexion **Discord** en un clic
- Formulaire de candidature staff dédié FiveM
- Suivi de sa candidature (statut + rendez-vous + message du staff)

**Espace staff** *(rôle Gérant staff)*
- **Candidatures** : examiner, accepter / refuser / mettre en entretien, noter
- **Calendrier** partagé : rendez-vous vocaux — qui gère qui et quand
- **Effectif** : liste des staffs avec **ID Unique**, grade, pôle, permission IG et
  drapeau « autorisé à jouer la perm » ; retrait, **reset des permissions**
  (individuel ou global pour un contrôle)
- **Réunion** : préparation — avertissements ⚠️, montées ⬆️, descentes ⬇️, renvois ❌
- **Hiérarchie** : grades, permissions IG et règles

**Direction** *(Propriétaire)*
- **Gérants** : attribuer / retirer le rôle Gérant staff

---

## 🔐 Rôles & sécurité

| Rôle | Accès |
|------|-------|
| `applicant` | postuler, suivre sa candidature |
| `manager` (**Gérant staff**) | + candidatures, calendrier, effectif, réunion, hiérarchie |
| `owner` (**Propriétaire**) | + gestion des Gérants |

Le front étant public, **toute la sécurité est appliquée par la base** via les
*Row Level Security policies* de Supabase (voir
[`0001_schema.sql`](supabase/migrations/0001_schema.sql)). La clé `anon` est
publique par conception. L'attribution de rôle passe par une fonction
`security definer` réservée au Propriétaire.

---

## 🧰 Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS**
- **react-router-dom** (HashRouter — compatible GitHub Pages)
- **@supabase/supabase-js** (auth Discord + Postgres + RLS)
- **date-fns**, **lucide-react**

## 📜 Scripts

```bash
npm run dev        # serveur de dev (http://localhost:5173)
npm run build      # build de production -> dist/
npm run preview    # prévisualise le build
npm run typecheck  # vérification TypeScript
```

## 🗂️ Structure

```
src/
  lib/            config, client Supabase, types, auth, helpers
  components/     UI partagée (Layout, modales, badges…)
  pages/          Accueil, Postuler, Ma candidature
  pages/admin/    Candidatures, Calendrier, Effectif, Réunion, Hiérarchie, Gérants
supabase/migrations/
  0001_schema.sql   tables + fonctions + RLS
  0002_seed.sql     permissions IG + 18 grades
.github/workflows/
  deploy.yml        déploiement automatique GitHub Pages
```

## 🎨 Personnalisation rapide

- **Nom du serveur** : variable `VITE_SERVER_NAME` (ou secret/variable GitHub).
- **Grades / permissions / couleurs** : `supabase/migrations/0002_seed.sql`
  (ou directement dans le Table Editor de Supabase).
- **Pôles I / L / E** : `src/lib/config.ts` (`POLES`).
- **Questions du formulaire** : `src/pages/Apply.tsx` (+ colonnes dans
  `applications` si tu ajoutes des champs).
