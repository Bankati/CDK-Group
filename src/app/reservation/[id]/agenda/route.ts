import { connection } from "next/server";
import { getPackage, packageName } from "@/lib/packages";
import { db } from "@/server/db";
import { icsFile } from "../calendar";

/** Fichier .ics pour ajouter le live à l'agenda (iPhone, Outlook…). */
export async function GET(_req: Request, ctx: RouteContext<"/reservation/[id]/agenda">) {
  await connection();
  const { id } = await ctx.params;
  const b = await db.get(id);
  if (!b) return new Response("Réservation introuvable", { status: 404 });
  const pkg = getPackage(b.packageId);
  const name = pkg ? packageName(pkg, b.startsAt.slice(0, 7)) : b.packageId;
  return new Response(icsFile(b, name), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="live-ocd-${b.code}.ics"`,
    },
  });
}
