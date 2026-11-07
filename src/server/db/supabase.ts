import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Booking } from "@/lib/types";
import { serverEnv } from "@/server/env";
import type { BookingRepository, InsertResult } from "./repository";

/**
 * Implémentation Supabase. Le schéma SQL est dans supabase/schema.sql.
 * La clé « service_role » reste côté serveur : le navigateur ne parle jamais à la base.
 */
const PHOTO_BUCKET = "produits";

function client() {
  return createClient(serverEnv.SUPABASE_URL!, serverEnv.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

type Row = {
  id: string;
  code: string;
  created_at: string;
  mode: Booking["mode"];
  package_id: string;
  starts_at: string;
  duration_minutes: number;
  amount: number;
  full_name: string;
  whatsapp: string;
  email: string;
  business_name: string;
  sector: string;
  products: string;
  tiktok: string | null;
  country: string;
  city: string;
  photo_url: string | null;
  client_timezone: string | null;
  payment_method: Booking["paymentMethod"];
  payment_reference: string | null;
  payment_phone: string | null;
  status: Booking["status"];
  hold_expires_at: string;
  validated_at: string | null;
};

const toBooking = (r: Row): Booking => ({
  id: r.id,
  code: r.code,
  createdAt: new Date(r.created_at).toISOString(),
  mode: r.mode,
  packageId: r.package_id,
  startsAt: new Date(r.starts_at).toISOString(),
  durationMinutes: r.duration_minutes,
  amount: r.amount,
  fullName: r.full_name,
  whatsapp: r.whatsapp,
  email: r.email,
  businessName: r.business_name,
  sector: r.sector,
  products: r.products,
  tiktok: r.tiktok ?? undefined,
  country: r.country,
  city: r.city,
  photoUrl: r.photo_url ?? undefined,
  clientTimezone: r.client_timezone ?? undefined,
  paymentMethod: r.payment_method,
  paymentReference: r.payment_reference ?? undefined,
  paymentPhone: r.payment_phone ?? undefined,
  status: r.status,
  holdExpiresAt: new Date(r.hold_expires_at).toISOString(),
  validatedAt: r.validated_at ? new Date(r.validated_at).toISOString() : undefined,
});

const toRow = (b: Partial<Booking>): Partial<Row> => {
  const map: Record<string, keyof Row> = {
    id: "id",
    code: "code",
    createdAt: "created_at",
    mode: "mode",
    packageId: "package_id",
    startsAt: "starts_at",
    durationMinutes: "duration_minutes",
    amount: "amount",
    fullName: "full_name",
    whatsapp: "whatsapp",
    email: "email",
    businessName: "business_name",
    sector: "sector",
    products: "products",
    tiktok: "tiktok",
    country: "country",
    city: "city",
    photoUrl: "photo_url",
    clientTimezone: "client_timezone",
    paymentMethod: "payment_method",
    paymentReference: "payment_reference",
    paymentPhone: "payment_phone",
    status: "status",
    holdExpiresAt: "hold_expires_at",
    validatedAt: "validated_at",
  };
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) if (map[k]) row[map[k]] = v ?? null;
  return row as Partial<Row>;
};

export const supabaseRepository: BookingRepository = {
  async list(range) {
    let q = client().from("bookings").select("*").order("starts_at");
    if (range) q = q.gte("starts_at", range.from).lt("starts_at", range.to);
    const { data, error } = await q;
    if (error) throw new Error(`Supabase list: ${error.message}`);
    return (data as Row[]).map(toBooking);
  },

  async get(id) {
    const { data, error } = await client().from("bookings").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase get: ${error.message}`);
    return data ? toBooking(data as Row) : null;
  },

  // Fonction SQL avec verrou : la vérification et l'insertion sont atomiques.
  async insertIfFree(booking, { monthlyQuota }) {
    const { data, error } = await client().rpc("insert_booking_if_free", {
      payload: toRow(booking),
      monthly_quota: monthlyQuota ?? null,
    });
    if (error) throw new Error(`Supabase insert: ${error.message}`);
    return data as InsertResult;
  },

  async update(id, patch) {
    const { data, error } = await client()
      .from("bookings")
      .update(toRow(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Supabase update: ${error.message}`);
    return data ? toBooking(data as Row) : null;
  },

  async savePhoto(bookingId, dataUrl) {
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl);
    if (!match) throw new Error("Photo invalide");
    const [, type, b64] = match as unknown as [string, string, string];
    const path = `${bookingId}.${type.split("/")[1] === "png" ? "png" : "jpg"}`;
    const sb = client();
    const { error } = await sb.storage
      .from(PHOTO_BUCKET)
      .upload(path, Buffer.from(b64, "base64"), { contentType: type, upsert: true });
    if (error) throw new Error(`Supabase photo: ${error.message}`);
    return sb.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  },
};
