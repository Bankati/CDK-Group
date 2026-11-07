import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { serverEnv } from "@/server/env";

/** Session de l'Espace Bovann : cookie signé, valable 7 jours. */
const COOKIE = "ocd_admin";
const MAX_AGE = 7 * 24 * 3600;

const secret = () =>
  serverEnv.ADMIN_SECRET ??
  createHash("sha256").update(`ocd:${serverEnv.ADMIN_PASSWORD}`).digest("hex");

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(password: string) {
  return safeEqual(password, serverEnv.ADMIN_PASSWORD);
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  // « secure » seulement en HTTPS (Vercel) : en démo locale sur le Wi-Fi, le site est en HTTP.
  const https = (await headers()).get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}
