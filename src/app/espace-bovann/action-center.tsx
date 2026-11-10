"use client";

import { Check, Clock, PartyPopper, Radio } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Flag } from "@/components/booking/country-select";
import { WhatsAppIcon } from "@/components/icons";
import { countryByName } from "@/lib/countries";
import { fcfa } from "@/lib/format";
import { formatDayFr, formatRangeFr } from "@/lib/time";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import { confirmReservation } from "./actions";
import type { AdminBooking } from "./data";

/** Horloge partagée : part de l'heure du serveur, puis avance chaque seconde. */
function useNow(initial: number) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 3 j 04 h 12 min 09 s → les 3 unités les plus grandes. */
function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** « reste 18 h », « reste 42 min » : temps avant que le créneau ne soit libéré. */
function holdLeft(ms: number) {
  if (ms <= 0) return "délai dépassé";
  const h = Math.floor(ms / 3_600_000);
  return h >= 1 ? `reste ${h} h` : `reste ${Math.max(1, Math.round(ms / 60_000))} min`;
}

function waFor(b: AdminBooking) {
  const start = new Date(b.startsAt);
  return waLink(
    b.whatsapp,
    `Bonjour ${b.fullName.split(" ")[0]}, ici l'équipe OCD Live (Bovann Group) au sujet de ta réservation ${b.code} du ${formatDayFr(start)} à ${formatRangeFr(start, b.durationMinutes)}.`,
  );
}

function Avatar({ b, className }: { b: AdminBooking; className?: string }) {
  return b.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- photo du client (URL externe ou démo)
    <img
      src={b.photoUrl}
      alt=""
      loading="lazy"
      className={cn("shrink-0 rounded-2xl bg-paper object-cover", className)}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-night-900 font-bold text-white",
        className,
      )}
    >
      {b.businessName.slice(0, 2).toUpperCase()}
    </span>
  );
}

/** Une réservation à confirmer : qui, quand, combien, le délai, et les deux actions. */
function PendingItem({ b, now }: { b: AdminBooking; now: number }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  const startDate = new Date(b.startsAt);
  const left = Date.parse(b.holdExpiresAt) - now;
  const urgent = left < 6 * 3_600_000;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-1 last:pb-1">
      <Avatar b={b} className="size-12 text-sm" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="flex items-center gap-2 truncate font-semibold text-night-900">
          {b.businessName}
          <Flag code={countryByName(b.country)?.code ?? ""} className="h-3 w-[18px] shrink-0" />
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {b.fullName} · {b.packageLabel}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold text-night-900">
            {formatDayFr(startDate)} · {formatRangeFr(startDate, b.durationMinutes)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
              urgent ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800",
            )}
          >
            <Clock className="size-3" aria-hidden /> {holdLeft(left)}
          </span>
        </p>
        {error && <p className="mt-1.5 text-xs font-semibold text-red-700">{error}</p>}
      </div>
      {/* Mobile : montant et boutons sur leur propre ligne, sous le nom */}
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:gap-4">
        <p className="font-display text-lg font-extrabold text-night-950 tabular-nums">
          {fcfa(b.amount)}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={waFor(b)}
            target="_blank"
            rel="noopener"
            aria-label={`Écrire à ${b.fullName} sur WhatsApp`}
            title="Écrire sur WhatsApp"
            className="flex size-10 items-center justify-center rounded-full border border-line text-[#1fa855] transition hover:border-[#1fa855] hover:bg-[#1fa855] hover:text-white"
          >
            <WhatsAppIcon className="size-4" />
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              start(async () => {
                setError(undefined);
                const res = await confirmReservation(b.id);
                if (!res.ok) setError(res.message);
              })
            }
            className="flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-sm font-bold text-white shadow-[0_8px_20px_-10px] shadow-emerald-700 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            Confirmer
          </button>
        </div>
      </div>
    </li>
  );
}

/** Les réservations qui attendent l'équipe, les plus urgentes d'abord. */
function PendingPanel({
  rows,
  now,
  onSeeAll,
}: {
  rows: AdminBooking[];
  now: number;
  onSeeAll: () => void;
}) {
  const pending = rows
    .filter((b) => b.display === "pending")
    .sort((a, b) => a.holdExpiresAt.localeCompare(b.holdExpiresAt));
  const total = pending.reduce((s, b) => s + b.amount, 0);
  return (
    <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-night-950">
            À confirmer
            {pending.length > 0 && (
              <span className="rounded-full bg-live px-2 py-0.5 text-xs text-white">
                {pending.length}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {pending.length
              ? `${fcfa(total)} en jeu · le créneau est libéré si le délai est dépassé`
              : "Tout est à jour."}
          </p>
        </div>
        {pending.length > 3 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="rounded-full border border-line px-3.5 py-1.5 text-xs font-bold text-night-900 transition hover:bg-paper"
          >
            Voir les {pending.length} ›
          </button>
        )}
      </div>

      {pending.length ? (
        <ul className="mt-3 divide-y divide-line">
          {pending.slice(0, 3).map((b) => (
            <PendingItem key={b.id} b={b} now={now} />
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-5 text-sm text-emerald-900">
          <PartyPopper className="size-5 shrink-0" aria-hidden />
          Aucune réservation en attente : chaque demande a reçu sa réponse.
        </div>
      )}
    </section>
  );
}

/** Le prochain live, avec un compte à rebours qui tourne à la seconde. */
function NextLive({ rows, now }: { rows: AdminBooking[]; now: number }) {
  const live = rows.find(
    (b) =>
      (b.display === "confirmed" || b.display === "pending") &&
      Date.parse(b.startsAt) <= now &&
      Date.parse(b.startsAt) + b.durationMinutes * 60_000 > now,
  );
  const next =
    live ??
    rows
      .filter(
        (b) =>
          (b.display === "confirmed" || b.display === "pending") && Date.parse(b.startsAt) > now,
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-night-950 p-5 text-white sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-live/40 blur-3xl"
      />
      <p className="relative flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-white/70 uppercase">
        <Radio className={cn("size-4 text-live", live && "animate-pulse")} aria-hidden />
        {live ? "En direct maintenant" : "Prochain live"}
      </p>

      {next ? (
        <div className="relative mt-4">
          <div className="flex items-center gap-3">
            <Avatar b={next} className="size-14 text-base ring-2 ring-white/15" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-xl font-extrabold">{next.businessName}</p>
              <p className="mt-0.5 truncate text-sm text-white/65">
                {next.city}, {next.country} ·{" "}
                {next.mode === "presentiel" ? "au studio" : "à distance"}
              </p>
            </div>
          </div>

          {live ? (
            <p className="mt-6 font-display text-3xl font-extrabold text-live">
              Jusqu&apos;à{" "}
              {formatRangeFr(new Date(next.startsAt), next.durationMinutes).split("–")[1]}
            </p>
          ) : (
            <Countdown target={Date.parse(next.startsAt)} now={now} />
          )}

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
            <span className="leading-tight">
              <span className="block font-semibold">{formatDayFr(new Date(next.startsAt))}</span>
              <span className="block text-white/60">
                {formatRangeFr(new Date(next.startsAt), next.durationMinutes)} · {next.packageLabel}
              </span>
            </span>
            <a
              href={waFor(next)}
              target="_blank"
              rel="noopener"
              aria-label={`Écrire à ${next.fullName} sur WhatsApp`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1fa855] transition hover:bg-[#178a45]"
            >
              <WhatsAppIcon className="size-4" />
            </a>
          </div>
        </div>
      ) : (
        <p className="relative mt-6 text-white/70">
          Aucun live prévu pour le moment. Les nouvelles réservations apparaîtront ici.
        </p>
      )}
    </section>
  );
}

function Countdown({ target, now }: { target: number; now: number }) {
  const t = split(target - now);
  const units: [number, string][] = t.days
    ? [
        [t.days, "jours"],
        [t.hours, "heures"],
        [t.minutes, "min"],
      ]
    : [
        [t.hours, "heures"],
        [t.minutes, "min"],
        [t.seconds, "sec"],
      ];
  return (
    <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Temps avant le début du live">
      {units.map(([v, label]) => (
        <div
          key={label}
          className="rounded-2xl bg-white/[0.07] px-2 py-3 text-center ring-1 ring-white/10"
        >
          <span className="block font-display text-3xl leading-none font-extrabold tabular-nums">
            {pad(v)}
          </span>
          <span className="mt-1 block text-[11px] tracking-wide text-white/55 uppercase">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Centre d'actions du tableau de bord : ce que l'équipe doit faire maintenant.
 * Toujours sur TOUTES les réservations (pas seulement la période choisie) :
 * une demande en attente reste urgente quel que soit le filtre.
 */
export function ActionCenter({
  rows,
  now: serverNow,
  onSeePending,
}: {
  rows: AdminBooking[];
  now: number;
  onSeePending: () => void;
}) {
  const now = useNow(serverNow);
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <PendingPanel rows={rows} now={now} onSeeAll={onSeePending} />
      <NextLive rows={rows} now={now} />
    </div>
  );
}
