import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getAdminAccount, saveAdminAccount, type AdminAccount } from "@/server/admin-account";
import { isDemo, serverEnv, usingDefaultPassword } from "@/server/env";
import { hashOtp, hashPassword, newOtp, sameHash, verifyPassword } from "@/server/passwords";

/**
 * Accès à l'Espace Bovann.
 * - Connexion : email + mot de passe du compte administrateur (empreinte scrypt en base).
 * - Mot de passe oublié : code à 6 chiffres envoyé par email (OTP), valable 10 minutes.
 * - Email oublié (ou première connexion) : la CLÉ DE SECOURS, gardée côté serveur dans
 *   la variable ADMIN_PASSWORD, permet de redéfinir l'email et le mot de passe.
 * Session : cookie signé (HMAC) valable 7 jours, qui porte le numéro de version du compte :
 * changer d'identifiants déconnecte toutes les autres sessions.
 */
const COOKIE = "ocd_admin";
const MAX_AGE = 7 * 24 * 3600;
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_S = 60;
const MAX_FAILED_LOGINS = 8;
const LOCK_MINUTES = 15;

const secret = () =>
  serverEnv.ADMIN_SECRET ??
  createHash("sha256").update(`ocd:${serverEnv.ADMIN_PASSWORD}`).digest("hex");

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const normEmail = (e: string) => e.trim().toLowerCase();
const slow = () => new Promise((r) => setTimeout(r, 500)); // freine les essais au hasard

/**
 * La clé de secours par défaut (« bovann2026 », publique dans le code) n'est acceptée
 * qu'en MODE DÉMO. Avec les vraies données (Supabase), il faut définir ADMIN_PASSWORD.
 */
export const loginLocked = !isDemo && usingDefaultPassword;

export function checkRecoveryKey(key: string) {
  if (loginLocked) return false;
  return safeEqual(key, serverEnv.ADMIN_PASSWORD);
}

/* ───────────────────────────── Session ───────────────────────────── */

async function startSession(version: number) {
  const exp = String(Date.now() + MAX_AGE * 1000);
  const payload = `${exp}.${version}`;
  // « secure » seulement en HTTPS (Vercel) : en démo locale sur le Wi-Fi, le site est en HTTP.
  const https = (await headers()).get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
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

/**
 * État d'accès en UNE lecture de la base : le compte (s'il existe) et si la session
 * du navigateur est valide pour ce compte.
 */
export async function adminAccess() {
  const value = (await cookies()).get(COOKIE)?.value;
  const [exp, version, sig] = value?.split(".") ?? [];
  const signed =
    Boolean(exp && version && sig) &&
    Number(exp) > Date.now() &&
    safeEqual(sig!, sign(`${exp}.${version}`));
  // Cookie absent ou falsifié : inutile d'interroger la base pour la session.
  const account = await getAdminAccount();
  return {
    account,
    signedIn: Boolean(signed && account && account.sessionVersion === Number(version)),
  };
}

export async function isAdmin() {
  return (await adminAccess()).signedIn;
}

/* ───────────────────────────── Connexion ───────────────────────────── */

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const account = await getAdminAccount();
  if (!account)
    return { ok: false, error: "Aucun compte : crée d'abord le compte administrateur." };
  if (account.lockedUntil && Date.parse(account.lockedUntil) > Date.now()) {
    const min = Math.ceil((Date.parse(account.lockedUntil) - Date.now()) / 60_000);
    return {
      ok: false,
      error: `Trop d'essais. Réessaie dans ${min} min, ou réinitialise ton mot de passe.`,
    };
  }
  const good =
    normEmail(email) === account.email && (await verifyPassword(password, account.passwordHash));
  if (!good) {
    const failed = account.failedLogins + 1;
    await saveAdminAccount({
      ...account,
      failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
      lockedUntil:
        failed >= MAX_FAILED_LOGINS
          ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
          : account.lockedUntil,
    });
    await slow();
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }
  await saveAdminAccount({ ...account, failedLogins: 0, lockedUntil: null });
  await startSession(account.sessionVersion);
  return { ok: true };
}

/* ─────────────────────── Mot de passe oublié (OTP) ─────────────────────── */

/**
 * Prépare un code pour l'email donné. Renvoie le code à envoyer, ou null si l'email ne
 * correspond pas au compte (la page affiche le même message dans les deux cas, pour ne
 * jamais révéler quelle adresse est la bonne).
 */
export async function createResetCode(
  email: string,
): Promise<{ code: string; to: string } | { wait: number } | null> {
  const account = await getAdminAccount();
  if (!account || normEmail(email) !== account.email) {
    await slow();
    return null;
  }
  if (account.otpSentAt) {
    const since = (Date.now() - Date.parse(account.otpSentAt)) / 1000;
    if (since < OTP_COOLDOWN_S) return { wait: Math.ceil(OTP_COOLDOWN_S - since) };
  }
  const code = newOtp();
  await saveAdminAccount({
    ...account,
    otpHash: hashOtp(code, secret()),
    otpExpiresAt: new Date(Date.now() + OTP_MINUTES * 60_000).toISOString(),
    otpAttempts: 0,
    otpSentAt: new Date().toISOString(),
  });
  return { code, to: account.email };
}

export async function resetWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<AuthResult> {
  const account = await getAdminAccount();
  const invalid = {
    ok: false as const,
    error: "Code incorrect ou expiré. Demande un nouveau code.",
  };
  if (!account || normEmail(email) !== account.email || !account.otpHash || !account.otpExpiresAt) {
    await slow();
    return invalid;
  }
  if (Date.parse(account.otpExpiresAt) < Date.now() || account.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await saveAdminAccount({ ...account, otpHash: null, otpExpiresAt: null });
    return invalid;
  }
  if (!sameHash(hashOtp(code.replace(/\s/g, ""), secret()), account.otpHash)) {
    const attempts = account.otpAttempts + 1;
    await saveAdminAccount({ ...account, otpAttempts: attempts });
    await slow();
    const left = OTP_MAX_ATTEMPTS - attempts;
    return left > 0
      ? {
          ok: false,
          error: `Code incorrect. ${left} essai${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}.`,
        }
      : invalid;
  }
  const next: AdminAccount = {
    ...account,
    passwordHash: await hashPassword(newPassword),
    sessionVersion: account.sessionVersion + 1,
    failedLogins: 0,
    lockedUntil: null,
    otpHash: null,
    otpExpiresAt: null,
    otpAttempts: 0,
  };
  await saveAdminAccount(next);
  await startSession(next.sessionVersion);
  return { ok: true };
}

/* ─────────────── Email oublié / première connexion (clé de secours) ─────────────── */

export async function recoverWithKey(
  key: string,
  email: string,
  newPassword: string,
): Promise<AuthResult & { previousEmail?: string }> {
  if (!checkRecoveryKey(key)) {
    await slow();
    return { ok: false, error: "Clé de secours incorrecte." };
  }
  const account = await getAdminAccount();
  const next: AdminAccount = {
    email: normEmail(email),
    passwordHash: await hashPassword(newPassword),
    sessionVersion: (account?.sessionVersion ?? 0) + 1,
    failedLogins: 0,
    lockedUntil: null,
    otpHash: null,
    otpExpiresAt: null,
    otpAttempts: 0,
    otpSentAt: null,
  };
  await saveAdminAccount(next);
  await startSession(next.sessionVersion);
  return { ok: true, previousEmail: account?.email };
}

/* ───────────────────────── Réglages : changer ses identifiants ───────────────────────── */

export async function changeCredentials(
  currentPassword: string,
  email: string,
  newPassword: string | null,
): Promise<AuthResult & { previousEmail?: string }> {
  const account = await getAdminAccount();
  if (!account || !(await isAdmin()))
    return { ok: false, error: "Session expirée, reconnecte-toi." };
  if (!(await verifyPassword(currentPassword, account.passwordHash))) {
    await slow();
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }
  const next: AdminAccount = {
    ...account,
    email: normEmail(email),
    passwordHash: newPassword ? await hashPassword(newPassword) : account.passwordHash,
    sessionVersion: account.sessionVersion + 1,
  };
  await saveAdminAccount(next);
  await startSession(next.sessionVersion); // cette session reste ouverte, les autres sont fermées
  return { ok: true, previousEmail: account.email !== next.email ? account.email : undefined };
}
