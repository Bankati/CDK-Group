"use client";

import { CheckCircle2, Clapperboard, Globe2, Radio, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Flag } from "@/components/booking/country-select";
import { schedule } from "@/config/site";
import { fcfa } from "@/lib/format";
import { formatDayFr, formatRangeFr } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { AudienceMap } from "@/server/audience-map";
import type { AdminBooking } from "./data";

const BLUE = "#2a78d6";
const ORANGE = "#eb6834";
const isActive = (b: AdminBooking) => b.display === "confirmed" || b.display === "pending";

/** Horloge partagée : avance toutes les `ms` (départ = l'heure du serveur, sans décalage d'hydratation). */
function useClock(start: number, ms: number) {
  const [t, setT] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

function Avatar({ b, size = "size-12" }: { b: AdminBooking; size?: string }) {
  return b.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- photo produit (URL externe ou démo)
    <img
      src={b.photoUrl}
      alt=""
      className={cn(size, "shrink-0 rounded-2xl object-cover ring-2 ring-white/20")}
    />
  ) : (
    <span
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-2xl bg-white/10 font-display text-sm font-bold text-white ring-2 ring-white/20",
      )}
    >
      {b.businessName.slice(0, 2).toUpperCase()}
    </span>
  );
}

/* ────────────────────────────── 1. LA RÉGIE ────────────────────────────── */

function Countdown({ ms }: { ms: number }) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const parts = [
    [Math.floor(s / 86400), "jours"],
    [Math.floor((s % 86400) / 3600), "h"],
    [Math.floor((s % 3600) / 60), "min"],
    [s % 60, "s"],
  ] as const;
  return (
    <div className="flex gap-2" aria-label="Compte à rebours">
      {parts.map(([v, u]) => (
        <div
          key={u}
          className="min-w-14 rounded-xl bg-white/10 px-2 py-2 text-center ring-1 ring-white/10 backdrop-blur-sm"
        >
          <p className="font-display text-2xl leading-none font-extrabold tabular-nums sm:text-3xl">
            {String(v).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] tracking-wider text-white/60 uppercase">{u}</p>
        </div>
      ))}
    </div>
  );
}

export function ControlRoom({ rows, now }: { rows: AdminBooking[]; now: number }) {
  const t = useClock(now, 1000);
  const lives = useMemo(
    () => rows.filter(isActive).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [rows],
  );
  const end = (b: AdminBooking) => Date.parse(b.startsAt) + b.durationMinutes * 60_000;
  const onAir = lives.find((b) => Date.parse(b.startsAt) <= t && t < end(b));
  const upcoming = lives.filter((b) => Date.parse(b.startsAt) > t);
  const featured = onAir ?? upcoming[0];

  if (!featured) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-night-950 p-8 text-white">
        <p className="font-display text-xl font-bold">Aucun live programmé pour l&apos;instant.</p>
      </section>
    );
  }

  const day = featured.startsAt.slice(0, 10);
  const dayLives = lives.filter((b) => b.startsAt.startsWith(day));
  const next = upcoming.filter((b) => b.id !== featured.id).slice(0, 3);
  const open = Date.parse(`${day}T${String(schedule.openHour).padStart(2, "0")}:00:00Z`);
  const span = (schedule.closeHour - schedule.openHour) * 3_600_000;
  const pos = (ms: number) => Math.min(100, Math.max(0, ((ms - open) / span) * 100));
  const isToday = new Date(t).toISOString().slice(0, 10) === day;
  const progress = onAir
    ? ((t - Date.parse(onAir.startsAt)) / (onAir.durationMinutes * 60_000)) * 100
    : 0;

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-night-950 text-white">
      <Image
        src="/hero/ocd-live-studio.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="-z-20 object-cover opacity-50"
        style={{ objectPosition: "70% 40%" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-night-950 via-night-950/85 to-night-950/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 3px)",
        }}
      />

      <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.25em] text-white/70 uppercase">
            <Clapperboard className="size-4" aria-hidden /> Régie OCD Live
            {onAir ? (
              <span className="ml-1 inline-flex animate-live-pulse items-center gap-1.5 rounded-md bg-live px-2 py-0.5 text-[11px] tracking-[0.15em] text-white">
                <Radio className="size-3" aria-hidden /> ON AIR
              </span>
            ) : (
              <span className="ml-1 rounded-md bg-white/15 px-2 py-0.5 text-[11px] tracking-[0.15em] text-white">
                PROCHAIN LIVE
              </span>
            )}
          </p>

          <div className="mt-5 flex items-center gap-4">
            <Avatar b={featured} size="size-16" />
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {featured.businessName}
              </h2>
              <p className="mt-0.5 text-sm text-white/70">
                <span className="first-letter:uppercase">
                  {formatDayFr(new Date(featured.startsAt))}
                </span>{" "}
                · {formatRangeFr(new Date(featured.startsAt), featured.durationMinutes)} ·{" "}
                {featured.packageLabel} ·{" "}
                {featured.mode === "presentiel" ? "en studio" : `depuis ${featured.city}`}
              </p>
            </div>
          </div>
        </div>

        {onAir ? (
          <div className="w-full max-w-xs">
            <p className="text-sm text-white/70">En direct depuis</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">
              {Math.floor((t - Date.parse(onAir.startsAt)) / 60_000)} min
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-live" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <Countdown ms={Date.parse(featured.startsAt) - t} />
        )}
      </div>

      {/* Piste de la journée : table de montage 10h → 22h */}
      <div className="border-t border-white/10 bg-black/25 px-6 py-5 backdrop-blur-sm sm:px-8">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="font-semibold text-white/80 first-letter:uppercase">
            Piste du {formatDayFr(new Date(featured.startsAt))}
          </span>
          <span>
            {dayLives.length} live{dayLives.length > 1 ? "s" : ""} ·{" "}
            {fcfa(dayLives.reduce((s, b) => s + b.amount, 0))}
          </span>
        </div>
        <div className="relative mt-3 h-12">
          {/* graduations */}
          {Array.from({ length: schedule.closeHour - schedule.openHour + 1 }, (_, i) => (
            <span
              key={i}
              className="absolute top-0 bottom-0 border-l border-white/10"
              style={{ left: `${(i / (schedule.closeHour - schedule.openHour)) * 100}%` }}
            >
              {i % 2 === 0 && (
                <span className="absolute -bottom-5 -translate-x-1/2 text-[10px] text-white/45 tabular-nums">
                  {schedule.openHour + i}h
                </span>
              )}
            </span>
          ))}
          {dayLives.map((b, i) => {
            const s = Date.parse(b.startsAt);
            const live = onAir?.id === b.id;
            return (
              <div
                key={b.id}
                title={`${b.businessName} · ${formatRangeFr(new Date(b.startsAt), b.durationMinutes)}`}
                className={cn(
                  "absolute top-1 bottom-1 flex items-center gap-1.5 overflow-hidden rounded-lg px-2 text-[11px] font-semibold whitespace-nowrap text-white shadow-lg",
                  live && "ring-2 ring-white",
                )}
                style={{
                  left: `${pos(s)}%`,
                  width: `calc(${pos(end(b)) - pos(s)}% - 2px)`,
                  background: live ? "#dc0c15" : b.display === "confirmed" ? BLUE : ORANGE,
                  animation: `bar-grow-x 0.6s cubic-bezier(0.2,0.8,0.2,1) ${0.2 + i * 0.12}s both`,
                  transformOrigin: "left",
                }}
              >
                {b.businessName}
              </div>
            );
          })}
          {isToday && t >= open && t <= open + span && (
            <span
              className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-live shadow-[0_0_12px_#dc0c15]"
              style={{ left: `${pos(t)}%` }}
            >
              <span className="absolute -top-1.5 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-live" />
            </span>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: BLUE }} /> Confirmé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: ORANGE }} /> À confirmer
          </span>
          {next.length > 0 && (
            <span className="ml-auto flex min-w-0 items-center gap-2">
              Ensuite :
              {next.map((b) => (
                <span
                  key={b.id}
                  className="truncate rounded-full bg-white/10 px-2 py-0.5 text-white/85"
                >
                  {b.businessName} · {new Date(b.startsAt).getUTCDate()}/
                  {new Date(b.startsAt).getUTCMonth() + 1}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 2. CARTE DE L'AUDIENCE ─────────────────────── */

export function AudienceMapCard({ map }: { map: AudienceMap }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...map.countries.map((c) => c.count));
  const ranking = [
    ...map.points.map((p) => ({
      key: `${p.code}-${p.city}`,
      label: p.city,
      country: p.country,
      code: p.code,
      count: p.count,
    })),
    ...map.outside.map((o) => ({
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
          {map.countries.map((c, i) => (
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
          {map.points.map((p, i) =>
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
          {map.points.map((p, i) => {
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
