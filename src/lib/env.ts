import { z } from "zod";

/**
 * Variables d'environnement validées au démarrage.
 * Ajoute ici chaque nouvelle variable (et dans .env.example).
 * Les variables exposées au navigateur doivent commencer par NEXT_PUBLIC_.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const parsed = schema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  console.error("❌ Variables d'environnement invalides :", z.treeifyError(parsed.error));
  throw new Error("Variables d'environnement invalides");
}

export const env = parsed.data;
