# Étape 2 : Supabase, Resend, puis Vercel

Le code est déjà prêt : il suffit de créer les comptes et de coller les clés.
Dès que les clés Supabase sont présentes, le site quitte automatiquement le mode démo.

---

## A. Supabase (base de données + photos) · 10 min

1. Crée un compte sur **https://supabase.com** → **New project**.
   - Nom : `ocd-live` · Région : **West EU (Paris)** ou **Frankfurt** (les plus proches de Lomé)
   - Note bien le mot de passe de la base.
2. Dans le projet : menu **SQL Editor** → **New query** → colle tout le contenu de [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
   Tu dois voir « Success ». Cela crée la table des réservations, la fonction anti double réservation et l'espace de stockage des photos.
3. Menu **Project Settings → API** (ou **API Keys**), copie :
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (clé secrète) → `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ Cette clé ne doit jamais être partagée ni mise dans le code : uniquement dans `.env.local` et dans Vercel.

## B. Resend (emails) · 5 min

1. Crée un compte sur **https://resend.com** → **API Keys** → **Create API Key** → copie la clé (`re_…`) → `RESEND_API_KEY`.
2. **Important** : tant qu'aucun domaine n'est vérifié, Resend n'envoie qu'à l'adresse du compte Resend.
   Pour envoyer aux clients : **Domains** → **Add domain** → `bovanngroup.com` → ajouter les enregistrements DNS indiqués chez l'hébergeur du domaine.
   Ensuite : `RESEND_FROM=OCD Live <reservations@bovanngroup.com>`.

## C. Tester en local avec les vraies clés

Dans le fichier `.env.local` (à la racine du projet), remplis :

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL=contact@bovanngroup.com
ADMIN_PASSWORD=un-mot-de-passe-solide
ADMIN_SECRET=une-longue-phrase-au-hasard-de-32-caracteres-minimum
```

Puis `pnpm dev`. Le badge « MODE DÉMO » disparaît de l'Espace Bovann, la base est vide au départ.
Fais une réservation test, puis vérifie dans Supabase → **Table Editor → bookings**.

## D. Mise en ligne sur Vercel (gratuit) · 10 min

1. Mets le projet sur GitHub (dépôt privé conseillé).
2. Crée un compte sur **https://vercel.com** avec GitHub → **Add New → Project** → choisis le dépôt.
3. Avant de cliquer sur **Deploy**, ouvre **Environment Variables** et ajoute **toutes** les variables du point C, plus :
   `NEXT_PUBLIC_APP_URL=https://<ton-projet>.vercel.app`
4. **Deploy**. Au bout de 1 à 2 minutes, le site est en ligne à l'adresse donnée par Vercel.
5. (Facultatif) Domaine personnalisé, ex. `live.bovanngroup.com` : Vercel → **Settings → Domains**.

⚠️ Sur Vercel, n'utilise **pas** le mode démo pour de vraies réservations : les données en mémoire ne sont pas conservées entre deux visites. Supabase est obligatoire en production.

---

## À confirmer par Bovann Group avant l'ouverture

Tout se modifie dans [`src/config/site.ts`](../src/config/site.ts) :

- Numéros **Flooz** et **Mixx by Yas** qui reçoivent les paiements (provisoirement : les numéros de contact)
- Numéro **WhatsApp** de l'équipe
- Lien du compte **TikTok** de House of Challenge
- Réponses de la **FAQ** (ex. délai de 48 h pour changer de date) : `src/components/home/sections.tsx`
- Vraies **photos de lives** dans `public/hero/`
