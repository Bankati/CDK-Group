"use client";

import { CheckCircle2, Globe2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Flag } from "@/components/booking/country-select";
import { fcfa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AudienceMap } from "@/server/audience-map";
import type { AdminBooking } from "./data";

const BLUE = "#2a78d6";

/** Horloge partagée : avance toutes les `ms` (départ = l'heure du serveur, sans décalage d'hydratation). */
function useClock(start: number, ms: number) {
  const [t, setT] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

/* ─────────────────────── 1. BANNIÈRE DE PÉRIODE ─────────────────────── */

/** Période analysée : une année, et un mois (1-12) ou toute l'année (null). */
export type Period = { year: number; month: number | null };

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function periodLabel(p: Period) {
  return p.month ? `${MONTHS[p.month - 1]} ${p.year}` : `Année ${p.year}`;
}

/** La réservation a-t-elle son live dans la période ? */
export function inPeriod(b: { startsAt: string }, p: Period) {
  const prefix = p.month ? `${p.year}-${String(p.month).padStart(2, "0")}` : String(p.year);
  return b.startsAt.startsWith(prefix);
}

const selectClass =
  "h-12 cursor-pointer appearance-none rounded-xl border border-white/20 bg-white/10 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-10 pl-5 text-base font-semibold text-white backdrop-blur-md transition outline-none hover:bg-white/15 focus:ring-4 focus:ring-white/20 [&>option]:text-night-900";

/** Bannière simple : logo Bovann Group + filtres Mois / Année. Tout le tableau de bord suit. */
export function PeriodBanner({
  period,
  onChange,
  years,
  count,
}: {
  period: Period;
  onChange: (p: Period) => void;
  years: number[];
  count: number;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-night-950 text-white">
      {/* Photo provisoire (8e édition de House of Challenge) : à remplacer par une photo officielle */}
      <Image
        src="/brand/house-of-challenge-equipe.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 75vw, 100vw"
        className="-z-20 object-cover"
        style={{ objectPosition: "50% 30%" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-night-950/95 via-night-950/75 to-night-950/35"
      />

      <div className="flex min-h-72 flex-col justify-end gap-8 p-6 sm:min-h-80 sm:flex-row sm:items-end sm:justify-between sm:p-10">
        <div>
          <Image
            src="/brand/bovann-group.png"
            alt="Bovann Group"
            width={240}
            height={48}
            className="h-10 w-auto sm:h-12"
          />
          <p
            key={periodLabel(period)}
            className="mt-8 animate-rise font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            {periodLabel(period)}
          </p>
          <p className="mt-2 text-base text-white/75">
            {count} live{count > 1 ? "s" : ""} sur la période · statistiques mises à jour
          </p>
        </div>

        <div className="flex gap-2">
          <label className="sr-only" htmlFor="period-month">
            Mois
          </label>
          <select
            id="period-month"
            value={period.month ?? ""}
            onChange={(e) =>
              onChange({ ...period, month: e.target.value ? Number(e.target.value) : null })
            }
            className={selectClass}
          >
            <option value="">Toute l&apos;année</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="period-year">
            Année
          </label>
          <select
            id="period-year"
            value={period.year}
            onChange={(e) => onChange({ ...period, year: Number(e.target.value) })}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 2. CARTE DE L'AUDIENCE ─────────────────────── */

export function AudienceMapCard({ map, ids }: { map: AudienceMap; ids: Set<string> }) {
  const [hover, setHover] = useState<string | null>(null);
  const { countries, points, outside } = useMemo(() => {
    const byCountry = new Map<string, number>();
    const byCity = new Map<
      string,
      { x: number; y: number; city: string; country: string; code: string; count: number }
    >();
    const out = new Map<string, { country: string; code: string; count: number }>();
    for (const sp of map.spots) {
      if (!ids.has(sp.id)) continue;
      byCountry.set(sp.code, (byCountry.get(sp.code) ?? 0) + 1);
      if (!sp.inside) {
        const o = out.get(sp.code) ?? { country: sp.country, code: sp.code, count: 0 };
        o.count++;
        out.set(sp.code, o);
        continue;
      }
      const key = `${sp.code}-${sp.city.toLowerCase()}`;
      const c = byCity.get(key) ?? {
        x: sp.x,
        y: sp.y,
        city: sp.city,
        country: sp.country,
        code: sp.code,
        count: 0,
      };
      c.count++;
      byCity.set(key, c);
    }
    return {
      countries: map.shapes.map((sh) => ({
        d: sh.d,
        count: (sh.code && byCountry.get(sh.code)) || 0,
      })),
      points: [...byCity.values()].sort((a, b) => b.count - a.count),
      outside: [...out.values()],
    };
  }, [map, ids]);
  const max = Math.max(1, ...countries.map((c) => c.count));
  const ranking = [
    ...points.map((p) => ({
      key: `${p.code}-${p.city}`,
      label: p.city,
      country: p.country,
      code: p.code,
      count: p.count,
    })),
    ...outside.map((o) => ({
      key: o.code,
      label: o.country,
      country: o.country,
      code: o.code,
      count: o.count,
    })),
  ].sort((a, b) => b.count - a.count);
  const countryCount = new Set(ranking.map((r) => r.code)).size;
  // Faisceau courbé perpendiculairement au trajet (toujours bombé vers le haut).
  const arc = (x: number, y: number) => {
    const { x: hx, y: hy } = map.hub;
    const dx = hx - x;
    const dy = hy - y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    if (ny > 0 || (ny === 0 && nx > 0)) {
      nx = -nx;
      ny = -ny;
    }
    const bend = Math.max(18, len * 0.3);
    const cx = (x + hx) / 2 + nx * bend;
    const cy = (y + hy) / 2 + ny * bend;
    return `M${x},${y} Q${cx},${cy} ${hx},${hy}`;
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-night-950 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-0">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <Globe2 className="size-4 text-[#7fb2ef]" aria-hidden /> Carte de l&apos;audience
          </h2>
          <p className="mt-0.5 text-xs text-white/60">
            D&apos;où viennent les entrepreneurs qui passent en live
          </p>
        </div>
        <p className="text-right text-xs text-white/60">
          <span className="font-display text-2xl font-extrabold text-white">{countryCount}</span>{" "}
          pays ·{" "}
          <span className="font-display text-2xl font-extrabold text-white">{ranking.length}</span>{" "}
          villes
        </p>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_13rem]">
        <svg
          viewBox={`0 0 ${map.width} ${map.height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Carte des pays d'origine des clients, reliés au studio de Lomé"
        >
          <defs>
            <radialGradient id="hub-glow">
              <stop offset="0" stopColor="#ee6b07" stopOpacity="0.6" />
              <stop offset="1" stopColor="#ee6b07" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="arc-grad" x1="0" x2="1">
              <stop offset="0" stopColor="#7fb2ef" stopOpacity="0.15" />
              <stop offset="1" stopColor="#ee6b07" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {countries.map((c, i) => (
            <path
              key={i}
              d={c.d}
              fill={c.count ? BLUE : "#1b2b37"}
              fillOpacity={c.count ? 0.35 + 0.55 * (c.count / max) : 1}
              stroke="#0a1620"
              strokeWidth={0.6}
            />
          ))}
          {/* Faisceaux vers le studio de Lomé */}
          {points.map((p, i) =>
            p.x === map.hub.x && p.y === map.hub.y ? null : (
              <path
                key={`arc-${i}`}
                d={arc(p.x, p.y)}
                fill="none"
                stroke="url(#arc-grad)"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeDasharray="5 7"
                style={{ animation: `dash-flow 1.6s linear ${i * 0.2}s infinite` }}
                opacity={hover && hover !== `${p.code}-${p.city}` ? 0.25 : 1}
              />
            ),
          )}
          {/* Villes */}
          {points.map((p, i) => {
            const key = `${p.code}-${p.city}`;
            const r = 3.5 + Math.min(6, p.count * 1.5);
            return (
              <g
                key={key}
                onPointerEnter={() => setHover(key)}
                onPointerLeave={() => setHover(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill="#7fb2ef"
                  className="map-ping"
                  style={{ animationDelay: `${i * 0.35}s` }}
                />
                <circle cx={p.x} cy={p.y} r={r} fill="#7fb2ef" stroke="#0a1620" strokeWidth={2} />
                {hover === key && (
                  <g>
                    <rect x={p.x + 10} y={p.y - 26} width={130} height={36} rx={8} fill="#fff" />
                    <text x={p.x + 20} y={p.y - 11} fontSize={12} fontWeight={700} fill="#15222b">
                      {p.city}
                    </text>
                    <text x={p.x + 20} y={p.y + 3} fontSize={11} fill="#5f6b76">
                      {p.count} réservation{p.count > 1 ? "s" : ""}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {/* Le studio */}
          <circle
            cx={map.hub.x}
            cy={map.hub.y}
            r={34}
            fill="url(#hub-glow)"
            className="map-breathe"
          />
          <circle
            cx={map.hub.x}
            cy={map.hub.y}
            r={6}
            fill="#ee6b07"
            stroke="#fff"
            strokeWidth={2}
          />
          <g transform={`translate(${map.hub.x + 12} ${map.hub.y + 26})`}>
            <rect width={104} height={24} rx={12} fill="#ee6b07" />
            <text x={52} y={16} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
              STUDIO · LOMÉ
            </text>
          </g>
        </svg>

        <ul className="space-y-1 p-5 pt-0 lg:pt-5 lg:pl-0">
          {ranking.slice(0, 7).map((r, i) => (
            <li
              key={r.key}
              onPointerEnter={() => setHover(r.key)}
              onPointerLeave={() => setHover(null)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition",
                hover === r.key ? "bg-white/10" : "hover:bg-white/5",
              )}
              style={{ animation: `rise 0.5s cubic-bezier(0.2,0.7,0.2,1) ${0.1 + i * 0.07}s both` }}
            >
              <Flag code={r.code} className="h-3.5 w-5 shrink-0" />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-semibold">{r.label}</span>
                <span className="block truncate text-[11px] text-white/50">{r.country}</span>
              </span>
              <span className="font-display font-extrabold tabular-nums">{r.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ────────────────────────── 3. FIL D'ACTIVITÉ ────────────────────────── */

function ago(ms: number) {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} jour${d > 1 ? "s" : ""}`;
}

export function ActivityFeed({ rows, now }: { rows: AdminBooking[]; now: number }) {
  const t = useClock(now, 30_000);
  const events = rows
    .flatMap((b) => [
      { b, at: Date.parse(b.createdAt), kind: "new" as const },
      ...(b.validatedAt ? [{ b, at: Date.parse(b.validatedAt), kind: "ok" as const }] : []),
    ])
    .sort((a, b) => b.at - a.at)
    .slice(0, 7);

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-night-900">Fil d&apos;activité</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-live-50 px-2.5 py-1 text-[11px] font-bold text-live-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-live" />
          </span>
          EN DIRECT
        </span>
      </div>
      <ol className="relative mt-5 space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-line">
        {events.map((e, i) => (
          <li
            key={`${e.b.id}-${e.kind}`}
            className="relative flex gap-3"
            style={{ animation: `rise 0.5s cubic-bezier(0.2,0.7,0.2,1) ${0.1 + i * 0.08}s both` }}
          >
            <span className="relative">
              {e.b.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- photo produit
                <img
                  src={e.b.photoUrl}
                  alt=""
                  className="size-10 rounded-full object-cover ring-4 ring-white"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-night-900 text-[11px] font-bold text-white ring-4 ring-white">
                  {e.b.businessName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span
                className={cn(
                  "absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2 ring-white",
                  e.kind === "ok" ? "bg-emerald-600" : "bg-[#2a78d6]",
                )}
              >
                {e.kind === "ok" ? (
                  <CheckCircle2 className="size-3 text-white" aria-hidden />
                ) : (
                  <Sparkles className="size-3 text-white" aria-hidden />
                )}
              </span>
            </span>
            <p className="min-w-0 flex-1 pt-0.5 text-sm leading-snug text-night-900">
              <strong>{e.b.businessName}</strong>{" "}
              {e.kind === "ok" ? (
                <>
                  est confirmé pour le live du {new Date(e.b.startsAt).getUTCDate()}/
                  {new Date(e.b.startsAt).getUTCMonth() + 1}
                </>
              ) : (
                <>
                  a réservé un <span className="font-semibold">{e.b.packageLabel}</span> depuis{" "}
                  {e.b.city}
                </>
              )}
              <span className="mt-0.5 block text-xs text-muted">
                {ago(t - e.at)} · {fcfa(e.b.amount)}
              </span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
