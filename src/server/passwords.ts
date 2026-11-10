import "server-only";
import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Mots de passe : jamais stockés tels quels.
 * On garde seulement une empreinte scrypt (lente à calculer, avec un sel unique),
 * au format « scrypt$N$r$p$sel$empreinte » : impossible de retrouver le mot de passe.
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function derive(password: string, salt: Buffer, n: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEYLEN,
      { N: n, r, p, maxmem: 64 * 1024 * 1024 },
      (e, k) => (e ? reject(e) : resolve(k)),
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await derive(password, Buffer.from(salt, "base64"), Number(n), Number(r), Number(p));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Code à 6 chiffres envoyé par email (OTP). */
export function newOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Empreinte du code : c'est elle qui est stockée, jamais le code. */
export function hashOtp(code: string, secret: string) {
  return createHmac("sha256", secret).update(`otp:${code}`).digest("hex");
}

export function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Règles minimales d'un mot de passe administrateur. */
export function passwordProblem(password: string) {
  if (password.length < 10) return "Le mot de passe doit faire au moins 10 caractères.";
  if (password.length > 200) return "Mot de passe trop long.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    return "Le mot de passe doit contenir des lettres et au moins un chiffre.";
  return null;
}
