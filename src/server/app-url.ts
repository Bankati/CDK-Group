import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Adresse publique du site, utilisée dans les liens des emails.
 *
 * Elle vient de la configuration (NEXT_PUBLIC_APP_URL, ou le domaine de production
 * fourni par Vercel) et JAMAIS de l'en-tête « Host » de la requête en production :
 * un visiteur pourrait le falsifier et faire envoyer à l'équipe des emails dont
 * les liens pointent vers un faux site.
 * En développement seulement (pas d'adresse configurée), on reprend l'adresse
 * utilisée pour ouvrir le site (localhost ou l'IP du Wi-Fi).
 */
export async function appUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  if (process.env.NODE_ENV === "production") return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host");
  if (!host) return env.NEXT_PUBLIC_APP_URL;
  return `${host.startsWith("localhost") ? "http" : (h.get("x-forwarded-proto") ?? "http")}://${host}`;
}
