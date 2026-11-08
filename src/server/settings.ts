import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isDemo, serverEnv } from "@/server/env";

/**
 * Réglages modifiables depuis l'Espace Bovann (sans toucher au code).
 * - MODE DÉMO : gardés en mémoire tant que le serveur tourne.
 * - Supabase : table `settings` (voir supabase/schema.sql).
 */
const KEY_EMAILS = "notification_emails";
const memory = globalThis as unknown as { __ocdSettings?: Record<string, unknown> };

function supabase() {
  return createClient(serverEnv.SUPABASE_URL!, serverEnv.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function readSetting<T>(key: string): Promise<T | undefined> {
  if (isDemo) return memory.__ocdSettings?.[key] as T | undefined;
  const { data, error } = await supabase()
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(`Supabase settings: ${error.message}`);
  return (data?.value as T | undefined) ?? undefined;
}

async function writeSetting(key: string, value: unknown) {
  if (isDemo) {
    memory.__ocdSettings = { ...memory.__ocdSettings, [key]: value };
    return;
  }
  const { error } = await supabase()
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Supabase settings: ${error.message}`);
}

/** Adresses qui reçoivent chaque nouvelle réservation (par défaut : NOTIFICATION_EMAIL). */
export async function getNotificationEmails(): Promise<string[]> {
  try {
    const saved = await readSetting<string[]>(KEY_EMAILS);
    if (saved?.length) return saved;
  } catch (e) {
    console.error(e);
  }
  return [serverEnv.NOTIFICATION_EMAIL];
}

export async function setNotificationEmails(emails: string[]) {
  await writeSetting(KEY_EMAILS, emails);
}
