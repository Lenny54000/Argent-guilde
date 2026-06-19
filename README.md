# Wolfmen — Trésorerie de guilde

Site de suivi de la trésorerie commune de la guilde **Wolfmen**, sur notre
serveur Minecraft. Chaque membre indique combien il est prêt à mettre dans
le coffre commun, et tout le monde peut voir où en est la cagnotte.

## Ce que fait le site

**Le tableau de bord (page d'accueil)** est public : pas besoin de compte
pour le consulter. Il affiche :
- le **total actuel** du coffre de la guilde,
- la **barre d'ingots**, un repère visuel qui montre la part de chaque
  membre dans le total (au survol, le pseudo et son montant s'affichent),
- un **graphique d'évolution** du total dans le temps,
- la **liste des membres** classés par montant.

**Mon compte** (réservé aux membres connectés) permet à chacun de fixer son
propre pseudo public et son montant, modifiable à tout moment — avec des
raccourcis (+5 €, +10 €, +20 €, −10 €) pour ajuster vite. Chaque membre voit
aussi son propre historique de changements.

**Admin** (réservé aux admins de la guilde) permet de modifier le pseudo et
le montant de n'importe quel membre, ou de retirer quelqu'un de la
trésorerie si besoin.

## Comment ça marche techniquement

Le site est en HTML/CSS/JS pur, hébergé sur GitHub Pages, sans aucune
étape de build. Toutes les données (comptes, pseudos, montants,
historique) sont stockées sur **Supabase** (base Postgres + authentification).

La sécurité ne repose pas sur le secret du code (qui est public sur
GitHub, comme tout site statique) mais sur des règles strictes côté base
de données (Row Level Security) :
- chaque membre ne peut modifier que sa propre ligne,
- seul un compte marqué admin peut modifier ou supprimer celle des autres,
- personne, même un admin, ne peut se donner les droits admin depuis le
  site — ça passe uniquement par une intervention manuelle dans Supabase,
- chaque changement de montant est journalisé automatiquement dans un
  historique, sans intervention du code du site (un trigger Postgres s'en
  charge), ce qui garantit que l'historique ne peut pas être falsifié
  depuis le navigateur.

## Arborescence du projet

```
├── index.html          → tableau de bord public
├── login.html          → connexion / création de compte
├── compte.html         → gérer son pseudo et son montant
├── admin.html          → panneau admin
├── assets/
│   ├── css/style.css
│   └── js/              → logique de chaque page + client Supabase
└── supabase/
    └── schema.sql       → schéma de la base (tables, sécurité, triggers)
```
