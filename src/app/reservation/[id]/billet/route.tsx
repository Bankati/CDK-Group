import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { site } from "@/config/site";
import { fcfa } from "@/lib/format";
import { getPackage, packageName } from "@/lib/packages";
import { formatDayFr, formatRangeFr } from "@/lib/time";
import { displayStatus, statusLabels } from "@/lib/types";
import { db } from "@/server/db";

const NIGHT = "#020f3a";
const RED = "#e3141b";

/** Billet récapitulatif en image PNG (format portrait, idéal pour WhatsApp et les stories). */
export async function GET(_req: Request, ctx: RouteContext<"/reservation/[id]/billet">) {
  await connection();
  const { id } = await ctx.params;
  const b = await db.get(id);
  if (!b) return new Response("Réservation introuvable", { status: 404 });

  const pkg = getPackage(b.packageId);
  const start = new Date(b.startsAt);
  const status = displayStatus(b);
  const rows: [string, string][] = [
    ["DATE", formatDayFr(start, { year: true })],
    ["HEURE (LOMÉ)", formatRangeFr(start, b.durationMinutes)],
    ["PACKAGE", pkg ? packageName(pkg, b.startsAt.slice(0, 7)) : b.packageId],
    [
      "MODE",
      b.mode === "presentiel" ? "En présentiel à Lomé" : `À distance · ${b.city}, ${b.country}`,
    ],
    ["MONTANT", fcfa(b.amount)],
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: NIGHT,
        padding: 64,
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          OCD
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: 16,
              background: RED,
              borderRadius: 12,
              padding: "6px 18px",
              fontSize: 46,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: "white",
                marginRight: 12,
              }}
            />
            LIVE
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.7)" }}>
          House of Challenge
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 56,
          background: "white",
          color: NIGHT,
          borderRadius: 40,
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "48px 56px 36px" }}>
          <div style={{ display: "flex", fontSize: 26, color: "#545e7e", letterSpacing: 4 }}>
            TA PLACE EST RÉSERVÉE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              marginTop: 10,
              lineHeight: 1.05,
            }}
          >
            {b.businessName}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#545e7e", marginTop: 8 }}>
            {b.fullName}
          </div>
        </div>
        <div style={{ display: "flex", borderTop: "4px dashed #e3e7f1", margin: "0 56px" }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "28px 56px" }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
              <div style={{ display: "flex", fontSize: 22, color: "#545e7e", letterSpacing: 3 }}>
                {k}
              </div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700, marginTop: 2 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f5f7fc",
            padding: "32px 56px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, color: "#545e7e", letterSpacing: 3 }}>
              CODE
            </div>
            <div style={{ display: "flex", fontSize: 48, fontWeight: 800, letterSpacing: 6 }}>
              {b.code}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              padding: "12px 24px",
              borderRadius: 999,
              background:
                status === "confirmed" ? "#10b981" : status === "pending" ? "#fcd34d" : "#e3e7f1",
              color: status === "confirmed" ? "white" : NIGHT,
            }}
          >
            {statusLabels[status]}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 36,
          fontSize: 24,
          color: "rgba(255,255,255,0.7)",
        }}
      >
        <div style={{ display: "flex" }}>{site.company.name} · Lomé</div>
        <div style={{ display: "flex" }}>{site.company.slogan}</div>
      </div>
    </div>,
    {
      width: 1080,
      height: 1350,
      headers: {
        "Content-Disposition": `inline; filename="billet-ocd-live-${b.code}.png"`,
        "Cache-Control": "no-store",
      },
    },
  );
}
