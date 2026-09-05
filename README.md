# ISSR SaaS

Version SaaS du calculateur ISSR : Next.js + Supabase + Vercel.

## Fonctions
- Authentification Supabase
- Sauvegarde cloud par utilisateur (RLS)
- Calcul ISSR + REP / REP+
- Géocodage BAN et itinéraire OSRM
- Saisie manuelle kilométrage ARIA
- Filtre mensuel et total général
- Export CSV, Excel XLSX et PDF propre
- Interface responsive : tableau desktop + cartes mobile

## Installation
1. `npm install`
2. Copier `.env.example` vers `.env.local`
3. Renseigner URL et clé publishable Supabase
4. Exécuter `supabase/migrations/001_issr_saas.sql` dans le projet Supabase
5. Dans Supabase Auth, ajouter `http://localhost:3000/auth/callback` et l'URL Vercel `/auth/callback` aux URLs autorisées.
6. `npm run dev`

## Projet Supabase connecté
Cette version est préconfigurée pour le projet **Quotidien** (`limyztrmsuapqaucpmdm`). Les données ISSR sont isolées dans les tables `issr_entries` et `issr_user_settings`, protégées par RLS.
