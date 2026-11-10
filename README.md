# OCD Live

Site de réservation de passages en live TikTok sur le compte de **House of Challenge**, pour **Bovann Group SAS** (Lomé, Togo).

Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript · Supabase · Resend · Vercel

---

## 1. Lancer le site (mode démo, sans aucun compte)

Ouvre un terminal dans ce dossier, puis :

```bash
pnpm install     # une seule fois : installe les dépendances
pnpm dev         # lance le site
```

Ouvre **http://localhost:3000**.

Sans fichier `.env.local`, le site démarre en **mode démo** : 8 réservations fictives sont déjà là (dont le 5 décembre complet), les emails ne partent pas (ils sont seulement notés dans la console du serveur). Redémarrer le serveur remet les données de départ.

Avec `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`, le site utilise la **vraie base** (les réservations sont conservées) ; avec `RESEND_API_KEY` et `RESEND_FROM`, les **emails partent vraiment**. Voir [docs/ETAPE-2.md](docs/ETAPE-2.md).

### Espace Bovann (tableau de bord)

**http://localhost:3000/espace-bovann** · mot de passe : celui de `ADMIN_PASSWORD` (en mode démo seulement : **`bovann2026`** ; avec la vraie base, ce mot de passe par défaut est refusé)
(lien discret aussi en bas de chaque page : « Espace Bovann »)

### Ouvrir le site sur ton téléphone

1. Le téléphone et l'ordinateur doivent être sur **le même Wi-Fi**.
2. Lance la version rapide :
   ```bash
   pnpm demo
   ```
   (construit le site puis le sert à tout le réseau ; attendre « Ready »)
3. Trouve l'adresse de l'ordinateur : `ipconfig` dans un terminal → ligne **Wi-Fi**, « Adresse IPv4 » (ex. `192.168.1.64`).
4. Sur le téléphone, ouvre **http://192.168.1.64:3000** (avec ton adresse).
5. Si ça ne charge pas : Windows demande parfois d'autoriser « Node.js » dans le pare-feu → accepter pour les **réseaux privés**.

### L'effet « Rejoins le live » (caméra)

Dans le hero, le lien **Essaie : passe en live avec ta caméra** ouvre une fenêtre où la caméra du visiteur s'affiche : il se voit en direct dans le live de Bovann, puis peut garder une **photo de live** au format story (partage WhatsApp sur téléphone, téléchargement sur ordinateur). Tout reste sur l'appareil : rien n'est envoyé ni enregistré.

Les navigateurs n'autorisent la caméra que sur un site **sécurisé (https)** ou sur `localhost` :

- sur l'ordinateur : `pnpm dev` puis http://localhost:3000, ça marche directement ;
- sur le téléphone avant la mise en ligne : `pnpm dev:https`, puis ouvrir **https**://ADRESSE-DU-PC:3000 et accepter l'avertissement de certificat (« Paramètres avancés » → « Continuer ») ;
- une fois en ligne sur Vercel (https), ça marche partout sans rien faire.

### Scénario de présentation (5 minutes)

1. **Accueil** : les photos qui défilent, les animations au défilement, les 2 boutons, les packages (« Le plus choisi », VIP doré, compteur du Pack du mois). Tourner l'écran vers le jury et cliquer sur « Essaie : passe en live avec ta caméra ».
2. **Réserver** « À distance » (on arrive directement sur la date) → le **5 décembre est grisé (complet)** → choisir le **1er décembre** → **Live Marathon** n'est proposé qu'à 18h00 (seul créneau de 4h libre) → choisir **Live Classique** → les créneaux 10h–11h30 et 14h–18h sont déjà pris, l'heure locale s'affiche.
3. Remplir ses informations → **Réserver mon live** (rien à payer sur le site) → **confettis, billet, compte à rebours, bouton TikTok**.
4. **Double réservation** : sur un 2e appareil, prendre le même créneau → refusé, « Ce créneau vient d'être pris ».
5. **Espace Bovann** : la réservation apparaît « En attente » → **Confirmer la réservation** (une fois le client recontacté sur WhatsApp) → le total confirmé augmente, l'email de confirmation apparaît dans l'onglet Emails, et la page du client passe à « Confirmée » toute seule.
6. **Tableau de bord** : la Régie (prochain live, compte à rebours, piste de la journée), la carte de l'audience (faisceaux vers Lomé), le graphique par semaine avec son calendrier, le fil d'activité. Puis réservations (onglets par statut), calendrier, statistiques, export Excel.
7. **Réglages** : l'adresse email qui reçoit chaque nouvelle réservation (avec toutes les réponses du formulaire) se change ici, sans toucher au code. Bouton « Envoyer un email de test ».

---

## 2. Tout modifier au même endroit

**[`src/config/site.ts`](src/config/site.ts)** : prix des packages, WhatsApp, lien TikTok, compte affiché dans le live (`liveAccount`), horaires (10h–22h), premier jour (1er décembre), nom du Pack du mois, durée de réservation d'un créneau non confirmé (24 h).

L'adresse qui reçoit les réservations se change dans **Espace Bovann → Réglages** (sans toucher au code).

Les images de l'accueil sont dans `public/hero/` :

- `afrique-mosaique.svg` : la carte du hero, pays par pays (frontières world-atlas), chaque région remplie d'une photo de commerçant ; les repères (Lomé, capitales) sont dans `src/components/home/africa-points.ts` ;
- `live/*.jpg` : les lives qui défilent dans le téléphone du hero (tableau `LIVES` de `src/components/home/hero.tsx`) ;
- `ocd-live-studio.jpg` (fenêtre « Essaie avec ta caméra »), `affiche-lancement.jpg` (section « Lancement ») ;
- `live-entrepreneure.jpg`, `live-couturier.jpg`, `live-commercante.jpg` : photos d'origine, incrustées dans `afrique-mosaique.svg` (gardées pour pouvoir régénérer la carte).

**Crédit photo du Grand Marché** (`public/booking/grand-marche-lome.webp` : bandeau de la réservation et section Packages) : « Lomé Grand Market in full swing », [Francisco Anzola](https://commons.wikimedia.org/wiki/File:Lom%C3%A9_Grand_Market_in_full_swing.jpg), licence [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) (recadrée).

**Crédits photos des commerçants** (carte et téléphone du hero ; licence Unsplash : usage commercial gratuit, sans obligation de crédit) : [Ahmed Nasiru](https://unsplash.com/@ahmed_nasiru), [Ali Mkumbwa](https://unsplash.com/@mkumbwajr) ; `ocd-live-studio.jpg` est le visuel officiel OCD Live.

---

## 3. Commandes

| Commande         | Rôle                                                   |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | Site en développement (http://localhost:3000)          |
| `pnpm demo`      | Version rapide, accessible depuis le téléphone (Wi-Fi) |
| `pnpm dev:https` | Comme `dev`, en https : caméra du hero sur téléphone   |
| `pnpm build`     | Construit la version de production                     |
| `pnpm check`     | Vérifie le code (lint + types + mise en forme)         |

---

## 4. Organisation du code

```
src/
  config/site.ts        ← le fichier à modifier (prix, numéros, horaires…)
  app/
    page.tsx            Accueil
    reserver/           Parcours de réservation (4 étapes : date, package, heure, infos)
    reservation/[id]/   Confirmation, billet PNG, fichier agenda
    espace-bovann/      Espace Bovann protégé : tableau de bord (régie, carte,
                        graphiques), réservations, calendrier, stats, emails,
                        réglages (email de notification), export CSV
  components/           Interface (hero, packages, étapes…) ;
                        home/home-animations.tsx = animations GSAP de l'accueil
  lib/availability.ts   Calcul des créneaux libres (anti double réservation)
  server/
    bookings.ts         Règles métier (créer, confirmer, annuler)
    db/                 Données : memory.ts (démo) / supabase.ts (production)
    notifications/      Emails (Resend) — SMS / WhatsApp en phase 2
    settings.ts         Réglages modifiables depuis l'Espace Bovann
    audience-map.ts     Carte de l'audience (calculée côté serveur)
supabase/schema.sql     Base de données à créer dans Supabase
```

**Anti double réservation** : la vérification du créneau et l'enregistrement se font en une seule opération (en démo, de façon synchrone ; dans Supabase, via une fonction SQL avec verrou). Le serveur revérifie toujours le créneau et recalcule le prix : rien n'est pris sur parole depuis le navigateur.

**Paiement** : pas de paiement en ligne pour l'instant. Le client réserve, l'équipe le contacte sur WhatsApp pour le règlement, puis confirme la réservation dans l'Espace Bovann. L'ancienne étape de paiement Mobile Money (Flooz / Mixx) est conservée dans l'historique git (commit `a46119d`) et pourra être reprise le jour où un agrégateur (FedaPay, PayGate Global) sera disponible.

---

## 5. Mise en ligne

Voir **[docs/ETAPE-2.md](docs/ETAPE-2.md)** : Supabase, Resend et Vercel, pas à pas.
