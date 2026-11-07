# OCD Projets

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · pnpm

## Démarrer

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Ouvre http://localhost:3000.

## Scripts

| Commande         | Rôle                                         |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Serveur de dev (Turbopack)                   |
| `pnpm build`     | Build de production                          |
| `pnpm start`     | Lance le build de production                 |
| `pnpm lint`      | ESLint (`lint:fix` pour corriger)            |
| `pnpm format`    | Prettier (+ tri des classes Tailwind)        |
| `pnpm typecheck` | Vérification TypeScript                      |
| `pnpm check`     | lint + typecheck + format:check (avant push) |

## Structure

```
src/
  app/              Routes (App Router), layout, pages d'erreur
  components/ui/    Composants UI réutilisables
  hooks/            Hooks React
  lib/              Utilitaires (cn, env…)
  server/           Code serveur uniquement (accès BDD, services)
  types/            Types partagés
```

## Variables d'environnement

Validées au démarrage par Zod dans [src/lib/env.ts](src/lib/env.ts). Toute nouvelle
variable doit être ajoutée au schéma **et** à `.env.example`.
