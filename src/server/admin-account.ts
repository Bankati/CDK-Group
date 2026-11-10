import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isDemo, serverEnv } from "@/server/env";

/**
 * Le compte administrateur de l'Espace Bovann (un seul compte).
 * Stocké sans aucune donnée en clair : empreinte du mot de passe (scrypt),
 * empreinte du code de réinitialisation (HMAC), jamais les valeurs elles-mêmes.
 * - MODE DÉMO : en mémoire tant que le serveur tourne.
 * - Supabase : table `admin_account` (voir supabase/schema.sql), fermée au public (RLS).
 */
export type AdminAccount = {
  email: string;
  passwordHash: string;
  /** Augmente à chaque changement d'identifiants : les anciennes sessions deviennent invalides. */
  sessionVersion: number;
  failedLogins: number;
  lockedUntil: string | null;
  otpHash: string | null;
  otpExpiresAt: string | null;
  otpAttempts: number;
  otpSentAt: string | null;
};

type Row = {
  email: string;
  password_hash: string;
  session_version: number;
  failed_logins: number;
  locked_until: string | null;
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  otp_sent_at: string | null;
};

const toAccount = (r: Row): AdminAccount => ({
  email: r.email,
  passwordHash: r.password_hash,
  sessionVersion: r.session_version,
  failedLogins: r.failed_logins,
  lockedUntil: r.locked_until,
  otpHash: r.otp_hash,
  otpExpiresAt: r.otp_expires_at,
  otpAttempts: r.otp_attempts,
  otpSentAt: r.otp_sent_at,
});

const toRow = (a: AdminAccount): Row => ({
  email: a.email,
  password_hash: a.passwordHash,
  session_version: a.sessionVersion,
  failed_logins: a.failedLogins,
  locked_until: a.lockedUntil,
  otp_hash: a.otpHash,
  otp_expires_at: a.otpExpiresAt,
  otp_attempts: a.otpAttempts,
  otp_sent_at: a.otpSentAt,
});

const memory = globalThis as unknown as { __ocdAdmin?: AdminAccount | null };

function supabase() {
  return createClient(serverEnv.SUPABASE_URL!, serverEnv.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export async function getAdminAccount(): Promise<AdminAccount | null> {
  if (isDemo) return memory.__ocdAdmin ? structuredClone(memory.__ocdAdmin) : null;
  const { data, error } = await supabase()
    .from("admin_account")
    .select("*")
    .eq("id", "main")
    .maybeSingle();
  if (error) throw new Error(`Supabase admin_account: ${error.message}`);
  return data ? toAccount(data as Row) : null;
}

export async function saveAdminAccount(account: AdminAccount) {
  if (isDemo) {
    memory.__ocdAdmin = structuredClone(account);
    return;
  }
  const { error } = await supabase()
    .from("admin_account")
    .upsert({ id: "main", ...toRow(account), updated_at: new Date().toISOString() });
  if (error) throw new Error(`Supabase admin_account: ${error.message}`);
}
