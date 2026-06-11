# 🤖 Bot Discord BlueStark — synchronisation staff

Bot autonome (dossier indépendant du site) à héberger en **Docker** sur un NAS.

## Ce qu'il fait

**Site → Discord** (temps réel via Supabase Realtime) :
- Ajout/modif d'un staff dans l'effectif → attribue les rôles Discord :
  **Staff BlueStark (base) + grade + pôle + perm IG** (la perm seulement si
  « autorisé à jouer la perm » est coché).
- Staff retiré/viré/parti → retire ces rôles.
- ⛔ Membre avec le rôle **Blacklisté Staff** → aucun rôle attribué + note
  automatique sur son dossier.
- Nouveau recrutement → **annonce** dans le salon configuré :
  UUID + @mention + grade + perm couleur.
- Resynchronisation complète au démarrage puis toutes les 10 minutes
  (filet de sécurité).

**Discord → Site** :
- Rôle **Avertissement 1/2/3** ajouté à un membre du staff → avertissement
  automatique sur son dossier (visible dans Réunion et l'Effectif).

Le bot ne touche **que** les rôles mappés dans la base (grades, perms, pôles,
rôle de base). Il ne retire jamais un rôle hors de son périmètre, et ne touche
jamais aux rôles Avertissement/Blacklist.

## Prérequis Discord

1. **Inviter le bot** sur le serveur :
   ```
   https://discord.com/oauth2/authorize?client_id=1508777654457864412&scope=bot&permissions=268454912
   ```
   (permissions : Gérer les rôles, Voir les salons, Envoyer des messages, Liens intégrés)
2. ⚠️ **Hiérarchie des rôles** : dans Paramètres du serveur → Rôles, place le
   rôle du bot **AU-DESSUS** de tous les rôles qu'il doit gérer (grades, perms,
   pôles, Staff BlueStark), sinon Discord lui refusera l'attribution.
3. Active l'intent membres : Portail développeur → ton app → **Bot** →
   **Server Members Intent** → ON (nécessaire pour détecter les avertissements
   et chercher les membres).

## Configuration côté site

Les IDs des rôles (grades, perms, pôles, base, blacklist, avertissements) et le
salon d'annonces se gèrent dans le site : **Hiérarchie → Configuration Discord**
(visible par le Propriétaire). Le bot relit cette config en continu.

## Lancer sur le NAS (Docker)

```bash
cd bot
cp .env.example .env     # puis remplis les 4 valeurs
docker compose up -d --build
docker compose logs -f   # vérifier le démarrage
```

Variables du `.env` :

| Variable | Où la trouver |
|---|---|
| `DISCORD_BOT_TOKEN` | Portail dev Discord → ton app → Bot → Reset Token |
| `GUILD_ID` | Clic droit sur ton serveur → Copier l'identifiant (mode développeur activé) |
| `SUPABASE_URL` | Déjà prérempli |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |

> ⚠️ La clé `service_role` contourne toutes les règles de sécurité : elle ne
> doit vivre **que** dans le `.env` du NAS (jamais dans le code, jamais commitée).

## Sans Docker (test rapide)

```bash
cd bot
npm install
cp .env.example .env   # remplir
npm start
```
