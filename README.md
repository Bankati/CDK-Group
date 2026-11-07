# OCD LIVE

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

Le site démarre en **mode démo** : 8 réservations fictives sont déjà là (dont le 5 décembre complet), les emails ne partent pas mais s'affichent dans l'Espace Bovann (onglet « Emails »).
Redémarrer le serveur remet les données de départ.

### Espace Bovann (tableau de bord)

**http://localhost:3000/espace-bovann** · mot de passe démo : **`bovann2026`**
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

### Scénario de présentation (5 minutes)

1. **Accueil** : le slider, les 2 boutons, les packages (« Le plus choisi », VIP doré, compteur du Pack du mois).
2. **Réserver** « À distance » → le **5 décembre est grisé (complet)** → choisir le **1er décembre** → **Live Marathon** n'est proposé qu'à 18h00 (seul créneau de 4h libre) → choisir **Live Classique** → les créneaux 10h–11h30 et 14h–18h sont déjà pris, l'heure locale s'affiche.
3. Remplir, payer (référence fictive, ex. `MX123456`) → **confettis, billet, compte à rebours, bouton TikTok**.
4. **Double réservation** : sur un 2e appareil, prendre le même créneau → refusé, « Ce créneau vient d'être pris ».
5. **Espace Bovann** : la réservation apparaît « En attente » → **Valider le paiement** → le total encaissé augmente, l'email de confirmation apparaît dans l'onglet Emails, et la page du client passe à « Confirmée » toute seule.
6. Calendrier, statistiques, export Excel.

---

## 2. Tout modifier au même endroit

**[`src/config/site.ts`](src/config/site.ts)** : prix des packages, numéros Flooz / Mixx, WhatsApp, lien TikTok, horaires (10h–22h), premier jour (1er décembre), nom du Pack du mois, délai de blocage (30 min).

Les photos du slider sont dans `public/hero/` (remplacer les fichiers en gardant les mêmes noms).

---

## 3. Commandes

| Commande     | Rôle                                                   |
| ------------ | ------------------------------------------------------ |
| `pnpm dev`   | Site en développement (http://localhost:3000)          |
| `pnpm demo`  | Version rapide, accessible depuis le téléphone (Wi-Fi) |
| `pnpm build` | Construit la version de production                     |
| `pnpm check` | Vérifie le code (lint + types + mise en forme)         |

---

## 4. Organisation du code

```
src/
  config/site.ts        ← le fichier à modifier (prix, numéros, horaires…)
  app/
    page.tsx            Accueil
    reserver/           Parcours de réservation (6 étapes)
    reservation/[id]/   Confirmation, billet PNG, fichier agenda
    espace-bovann/      Tableau de bord protégé, export CSV
  components/           Interface (hero, packages, étapes…)
  lib/availability.ts   Calcul des créneaux libres (anti double réservation)
  server/
    bookings.ts         Règles métier (créer, valider, annuler)
    db/                 Données : memory.ts (démo) / supabase.ts (production)
    notifications/      Emails (Resend) — SMS / WhatsApp en phase 2
    payments/           Paiement manuel — prêt pour FedaPay / PayGate
supabase/schema.sql     Base de données à créer dans Supabase
```

**Anti double réservation** : la vérification du créneau et l'enregistrement se font en une seule opération (en démo, de façon synchrone ; dans Supabase, via une fonction SQL avec verrou). Le serveur revérifie toujours le créneau et recalcule le prix : rien n'est pris sur parole depuis le navigateur.

**Brancher un agrégateur plus tard** : créer `src/server/payments/fedapay.ts` qui implémente `PaymentProvider`, puis le choisir dans `getProvider()`. Le parcours et l'Espace Bovann ne changent pas.

---

## 5. Mise en ligne

Voir **[docs/ETAPE-2.md](docs/ETAPE-2.md)** : Supabase, Resend et Vercel, pas à pas.
