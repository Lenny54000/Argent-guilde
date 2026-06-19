# Vanilla SMP — Trésorerie de guilde

Site statique (GitHub Pages) + Supabase (auth, base de données, sécurité)
pour suivre combien chaque membre est prêt à mettre dans la guilde du
serveur Minecraft, avec un tableau de bord public, un espace perso pour
chaque membre, et un panneau admin.

## Arborescence

```
vanilla-smp-tresorerie/
├── index.html          → tableau de bord public (coffre, graphique, membres)
├── login.html          → connexion / création de compte
├── compte.html         → modifier son pseudo et son montant
├── admin.html          → panneau admin (gérer tout le monde)
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── supabase-client.js   ← à éditer (URL + clé du projet)
│       ├── nav.js
│       ├── dashboard.js
│       ├── login.js
│       ├── compte.js
│       └── admin.js
└── supabase/
    └── schema.sql       → à exécuter une fois dans Supabase
```

Aucune étape de build : c'est du HTML/CSS/JS pur, donc GitHub Pages peut
servir le dossier directement.

## Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com), crée un compte si besoin,
   puis clique **New project**.
2. Choisis un nom, un mot de passe de base de données (garde-le, tu n'en
   auras pas besoin pour le site mais utile à connaître), une région
   proche de chez toi, et valide.
3. Attends une minute ou deux que le projet soit prêt.

## Étape 2 — Exécuter le schéma SQL

1. Dans le menu de gauche, ouvre **SQL Editor**.
2. Clique **New query**.
3. Copie tout le contenu de `supabase/schema.sql` (fourni dans ce dépôt)
   et colle-le dans l'éditeur.
4. Clique **Run**. Ça crée les deux tables (`profiles`, `historique`),
   active la sécurité au niveau des lignes (RLS), et met en place les
   triggers automatiques (création de profil à l'inscription,
   historique automatique à chaque changement de montant).

Si tout se passe bien tu verras "Success. No rows returned".

## Étape 3 — Connecter le site à ton projet

1. Dans Supabase, va dans **Project Settings > API**.
2. Récupère **Project URL** et la clé **anon / public** (pas la clé
   `service_role` — celle-là ne doit jamais apparaître dans le code du
   site, qui est public sur GitHub).
3. Ouvre `assets/js/supabase-client.js` et remplace les deux valeurs :

```js
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```

La clé `anon` est faite pour être publique : c'est normal qu'elle soit
visible dans le code. C'est la sécurité RLS côté base de données (déjà
configurée par le script SQL) qui empêche les abus, pas le secret de
cette clé.

## Étape 4 — Configurer l'authentification

1. Dans Supabase, va dans **Authentication > URL Configuration**.
2. Mets en **Site URL** l'adresse de ton futur site GitHub Pages, par
   exemple `https://ton-pseudo.github.io/vanilla-smp-tresorerie/`.
3. Ajoute la même adresse dans **Redirect URLs**.

Par défaut, Supabase exige une confirmation par email avant de pouvoir
se connecter après une inscription. Pour un petit groupe d'amis, tu
peux désactiver ça dans **Authentication > Providers > Email** en
décochant **Confirm email** — plus simple, mais ça veut dire que
n'importe qui peut créer un compte avec n'importe quel email sans le
vérifier. À toi de voir selon le niveau de confiance du groupe.

## Étape 5 — Te donner les droits admin

Une fois que tu t'es inscrit une première fois sur le site (avec
`login.html`), retourne dans **SQL Editor** et lance, en remplaçant
l'email :

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'ton-email@example.com');
```

Recharge la page : le lien **Admin** apparaît dans la navigation.

C'est volontairement la seule façon de devenir admin — le site ne
permet jamais de le faire depuis l'interface, pour éviter qu'un membre
se donne les droits lui-même.

## Étape 6 — Déployer sur GitHub Pages

1. Crée un nouveau dépôt GitHub, par exemple `vanilla-smp-tresorerie`.
2. Pousse tout le contenu de ce dossier à la racine du dépôt :

```bash
git init
git add .
git commit -m "Trésorerie de guilde"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/vanilla-smp-tresorerie.git
git push -u origin main
```

3. Sur GitHub, va dans **Settings > Pages**, choisis la branche `main`
   et le dossier `/ (root)`, puis sauvegarde.
4. Après une minute, ton site est en ligne à l'adresse indiquée
   (généralement `https://TON_PSEUDO.github.io/vanilla-smp-tresorerie/`).

Si l'adresse réelle diffère de celle mise à l'étape 4, retourne dans
**Authentication > URL Configuration** et corrige-la.

## Notes de sécurité

- Le dashboard est public en lecture (visible sans être connecté), mais
  toute écriture passe par la sécurité RLS de Postgres : un membre ne
  peut modifier que sa propre ligne, et seul un admin peut modifier ou
  supprimer celle des autres.
- La colonne `is_admin` n'est modifiable par personne depuis le site, ni
  par les membres ni même par les admins — uniquement depuis l'éditeur
  SQL de Supabase. C'est pour empêcher toute élévation de privilèges
  via le site.
- Ne mets jamais la clé `service_role` dans le code du site.

## Pistes d'évolution possibles

- Tri/recherche dans la liste des membres.
- Notifications (email/Discord webhook) quand le total franchit un
  palier.
- Export CSV de l'historique pour la compta de la guilde.
