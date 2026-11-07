import { connection } from "next/server";
import { payment } from "@/config/site";
import { statusLabels } from "@/lib/types";
import { isAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { applyFilters, toAdmin } from "../data";

/** Export CSV compatible Excel (séparateur « ; », accents conservés). */
export async function GET(req: Request) {
  await connection();
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });
  const url = new URL(req.url);
  const f = Object.fromEntries(
    ["date", "packageId", "status", "country"].map((k) => [
      k,
      url.searchParams.get(k) || undefined,
    ]),
  );
  const now = Date.now();
  const rows = applyFilters(
    (await db.list()).map((b) => toAdmin(b, now)),
    f,
  ).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const header = [
    "Code",
    "Date",
    "Début (Lomé)",
    "Fin (Lomé)",
    "Package",
    "Montant (FCFA)",
    "Statut",
    "Mode",
    "Pays",
    "Ville",
    "Nom",
    "WhatsApp",
    "Email",
    "Business",
    "Secteur",
    "Produits",
    "TikTok",
    "Paiement",
    "Référence",
    "Numéro payeur",
    "Créée le",
  ];
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((b) => {
    const start = new Date(b.startsAt);
    const end = new Date(start.getTime() + b.durationMinutes * 60_000);
    return [
      b.code,
      b.startsAt.slice(0, 10),
      start.toISOString().slice(11, 16),
      end.toISOString().slice(11, 16),
      b.packageLabel,
      b.amount,
      statusLabels[b.display],
      b.mode === "presentiel" ? "Présentiel" : "À distance",
      b.country,
      b.city,
      b.fullName,
      b.whatsapp,
      b.email,
      b.businessName,
      b.sector,
      b.products,
      b.tiktok,
      b.paymentMethod === "whatsapp"
        ? "WhatsApp"
        : payment.operators.find((o) => o.id === b.paymentMethod)?.label,
      b.paymentReference,
      b.paymentPhone,
      b.createdAt.slice(0, 16).replace("T", " "),
    ]
      .map(cell)
      .join(";");
  });
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ocd-live-reservations-${new Date(now).toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
