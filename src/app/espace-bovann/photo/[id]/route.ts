import { connection } from "next/server";
import { isAdmin } from "@/server/auth";
import { db } from "@/server/db";

/** MODE DÉMO : sert les photos produits stockées en mémoire (réservé à l'Espace Bovann). */
export async function GET(_req: Request, ctx: RouteContext<"/espace-bovann/photo/[id]">) {
  await connection();
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });
  const b = await db.get((await ctx.params).id);
  const m = b?.photoUrl && /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(b.photoUrl);
  if (!m) return new Response("Introuvable", { status: 404 });
  return new Response(Buffer.from(m[2]!, "base64"), {
    headers: {
      "Content-Type": `image/${m[1]}`,
      "Cache-Control": "private, max-age=3600",
      // Le navigateur ne doit jamais l'interpréter autrement qu'en image.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
