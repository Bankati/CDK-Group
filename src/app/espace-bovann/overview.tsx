"use client";

import { ArrowUpRight, CalendarClock, Clock, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { packages } from "@/config/site";
import { fcfa, number } from "@/lib/format";
import { formatDayFr, formatRangeFr } from "@/lib/time";
import type { DisplayStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { AudienceMap } from "@/server/audience-map";
import {
  ActivityFeed,
  AudienceMapCard,
  inPeriod,
  PeriodBanner,
  periodLabel,
  type Period,
} from "./control-room";
import type { AdminBooking } from "./data";
import { mondayOf, WeekPicker, weekLabel } from "./week-picker";

/**
 * Couleurs des graphiques : palette catégorielle validée (daltonisme, contraste)
 * avec le script du guide dataviz. Ordre fixe, jamais recyclé.
 */
// Palette catégorielle validée (dataviz) : orange du logo en tête, puis teintes bien séparées.
const SERIES = ["#EE6B07", "#1f9e89", "#b8860b", "#c0397a", "#3d8b2f", "#8a5cc7"];
const CONFIRMED = SERIES[0]!;
const PENDING = SERIES[1]!;

export type GoTo = (tab: "liste" | "calendrier" | "stats", status?: DisplayStatus) => void;

const DAY = 86_400_000;
const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const isActive = (b: AdminBooking) => b.display === "confirmed" || b.display === "pending";

/** « 12K », « 1,2M » pour les axes. */
function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0).replace(".", ",")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

function Card({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-night-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ArrowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-night-900 transition hover:border-night-900 hover:bg-night-900 hover:text-white"
    >
      <ArrowUpRight className="size-4" aria-hidden />
    </button>
  );
}

/** Pastille d'évolution : texte en encre, flèche colorée (jamais la couleur seule). */
function Trend({
  children,
  tone = "good",
}: {
  children: React.ReactNode;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        tone === "good" && "bg-emerald-50 text-emerald-800",
        tone === "warn" && "bg-amber-50 text-amber-900",
        tone === "neutral" && "bg-paper text-muted",
      )}
    >
      {children}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  cents,
  trend,
  onOpen,
  openLabel,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  cents?: string;
  trend: React.ReactNode;
  onOpen: () => void;
  openLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-night-900">
          <Icon className="size-4 text-muted" aria-hidden />
          {label}
        </p>
        <ArrowButton label={openLabel} onClick={onOpen} />
      </div>
      <p className="mt-3 font-display text-[1.75rem] leading-none font-extrabold tracking-tight text-night-900">
        {value}
        {cents && <span className="text-muted/50">{cents}</span>}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">{trend}</div>
    </div>
  );
}

/** Nombre qui « compte » jusqu'à sa nouvelle valeur (0,7 s, ralenti à la fin). */
function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduce || start === target) {
      from.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (target - start) * eased);
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/** Colonnes groupées : lives programmés chaque jour d'une semaine (confirmé / en attente). */
function FlowChart({ rows, now, initial }: { rows: AdminBooking[]; now: number; initial: number }) {
  const [monday, setMondayState] = useState(() => mondayOf(initial));
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  const setMonday = (m: number) => {
    setDir(m > monday ? "next" : m < monday ? "prev" : null);
    setMondayState(m);
  };
  const [hover, setHover] = useState<number | null>(null);
  const todayKey = dayKey(now);
  const WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const marked = useMemo(() => new Set(rows.map((b) => b.startsAt.slice(0, 10))), [rows]);

  const data = Array.from({ length: 7 }, (_, i) => {
    const d = monday + i * DAY;
    const key = dayKey(d);
    const same = rows.filter((b) => b.startsAt.startsWith(key));
    const confirmed = same.filter((b) => b.display === "confirmed");
    const pending = same.filter((b) => b.display === "pending");
    return {
      d,
      key,
      weekday: WEEK[i]!,
      confirmed: confirmed.reduce((s, b) => s + b.amount, 0),
      pending: pending.reduce((s, b) => s + b.amount, 0),
      count: confirmed.length + pending.length,
    };
  });
  const totals = data.reduce(
    (t, x) => ({
      confirmed: t.confirmed + x.confirmed,
      pending: t.pending + x.pending,
      count: t.count + x.count,
    }),
    { confirmed: 0, pending: 0, count: 0 },
  );

  const confirmedShown = useCountUp(totals.confirmed);
  const pendingShown = useCountUp(totals.pending);

  const max = Math.max(1, ...data.flatMap((x) => [x.confirmed, x.pending]));
  const step = max <= 40_000 ? 10_000 : max <= 100_000 ? 25_000 : max <= 200_000 ? 50_000 : 100_000;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step).reverse();

  return (
    <Card
      title="Lives programmés"
      action={<WeekPicker value={monday} onChange={setMonday} today={now} marked={marked} />}
    >
      {/* Résumé de la semaine + légende */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <p className="leading-tight">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className="size-2.5 rounded-full" style={{ background: CONFIRMED }} /> Confirmé
            </span>
            <span className="font-display text-lg font-extrabold text-night-900 tabular-nums">
              {fcfa(confirmedShown)}
            </span>
          </p>
          <p className="leading-tight">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className="size-2.5 rounded-full" style={{ background: PENDING }} /> En attente
            </span>
            <span className="font-display text-lg font-extrabold text-night-900 tabular-nums">
              {fcfa(pendingShown)}
            </span>
          </p>
        </div>
        <p className="text-xs text-muted">
          <strong className="text-night-900">{totals.count}</strong> live{totals.count > 1 ? "s" : ""} programmé
          {totals.count > 1 ? "s" : ""} · semaine du{" "}
          {weekLabel(monday)}
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        {/* Axe Y (montants) : chaque valeur centrée sur sa ligne */}
        <div className="relative h-60 w-9 shrink-0 text-right text-[11px] text-muted tabular-nums">
          <div className="absolute inset-x-0 top-0 bottom-10">
            {ticks.map((t, i) => (
              <span
                key={t}
                className="absolute right-0 -translate-y-1/2 leading-none"
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              >
                {compact(t)}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex-1">
          {/* Grille discrète */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-10 flex flex-col justify-between">
            {ticks.map((t) => (
              <span
                key={t}
                className={cn("border-t", t === 0 ? "border-line" : "border-dashed border-line/80")}
              />
            ))}
          </div>
          <div
            key={monday}
            className="relative flex h-60 items-stretch"
            style={
              dir
                ? {
                    animation: `${dir === "next" ? "slide-from-right" : "slide-from-left"} 0.45s cubic-bezier(0.2,0.7,0.2,1) both`,
                  }
                : undefined
            }
          >
            {data.map((x, i) => {
              const isToday = x.key === todayKey;
              const future = x.d > now;
              return (
                <div
                  key={x.key}
                  className="relative flex flex-1 flex-col"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                >
                  {/* Zone des barres */}
                  <div
                    className={cn(
                      "relative mx-1 flex flex-1 items-end justify-center gap-[3px] rounded-t-lg transition-colors",
                      hover === i && "bg-paper",
                    )}
                  >
                    {hover === i && (x.confirmed > 0 || x.pending > 0) && (
                      <div
                        style={{ animation: "tip-in 0.18s ease-out both" }}
                        className="absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] whitespace-nowrap text-night-900 shadow-lg"
                      >
                        <p className="font-semibold first-letter:uppercase">
                          {new Intl.DateTimeFormat("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            timeZone: "UTC",
                          }).format(x.d)}
                        </p>
                        <p className="flex items-center gap-1.5 text-muted">
                          <span className="size-2 rounded-full" style={{ background: CONFIRMED }} />
                          Confirmé{" "}
                          <strong className="ml-auto pl-3 text-night-900">
                            {fcfa(x.confirmed)}
                          </strong>
                        </p>
                        <p className="flex items-center gap-1.5 text-muted">
                          <span className="size-2 rounded-full" style={{ background: PENDING }} />
                          En attente{" "}
                          <strong className="ml-auto pl-3 text-night-900">{fcfa(x.pending)}</strong>
                        </p>
                      </div>
                    )}
                    {[
                      [x.confirmed, CONFIRMED],
                      [x.pending, PENDING],
                    ].map(([v, c], k) => (
                      <span
                        key={k}
                        className={cn(
                          "block w-full max-w-6 origin-bottom rounded-t transition-[height,opacity] duration-500",
                          hover !== null && hover !== i && "opacity-40",
                        )}
                        style={{
                          height: `${((v as number) / top) * 100}%`,
                          background: c as string,
                          minHeight: (v as number) > 0 ? 3 : 0,
                          animation: `bar-grow 0.7s cubic-bezier(0.2,0.8,0.2,1) ${0.12 + i * 0.07 + k * 0.04}s both`,
                        }}
                      />
                    ))}
                  </div>
                  {/* Jour de la semaine */}
                  <div className="flex h-10 flex-col items-center justify-center leading-tight">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isToday ? "text-live-600" : future ? "text-muted/50" : "text-night-900",
                      )}
                    >
                      {x.weekday}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                        isToday
                          ? "animate-live-pulse bg-live-600 font-bold text-white"
                          : "text-muted",
                      )}
                    >
                      {new Date(x.d).getUTCDate()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {totals.count === 0 && (
        <p className="mt-2 text-center text-sm text-muted">
          Aucun live programmé cette semaine-là.
        </p>
      )}
      <p className="sr-only">
        {data
          .filter((x) => x.confirmed || x.pending)
          .map(
            (x) =>
              `${x.weekday} ${new Date(x.d).getUTCDate()} : ${fcfa(x.confirmed)} confirmés, ${fcfa(x.pending)} en attente`,
          )
          .join(". ")}
      </p>
    </Card>
  );
}

/** Répartition par package : barre segmentée fine + liste (pastille, nom, nombre, montant). */
function PackageSplit({ rows, onOpen }: { rows: AdminBooking[]; onOpen: () => void }) {
  const items = packages.map((p, i) => {
    const list = rows.filter((b) => isActive(b) && b.packageId === p.id);
    return {
      name: p.name,
      color: SERIES[i]!,
      count: list.length,
      amount: list.reduce((s, b) => s + b.amount, 0),
    };
  });
  const total = items.reduce((s, x) => s + x.amount, 0);
  return (
    <Card
      title="Ventes par package"
      action={<ArrowButton label="Voir les statistiques" onClick={onOpen} />}
    >
      <p className="mt-4 text-xs text-muted">Total réservé</p>
      <p className="font-display text-2xl font-extrabold text-night-900">{fcfa(total)}</p>
      <div className="mt-3 flex h-2.5 gap-[2px] overflow-hidden rounded-full" aria-hidden>
        {items
          .filter((x) => x.amount > 0)
          .map((x) => (
            <span
              key={x.name}
              style={{ width: `${(x.amount / total) * 100}%`, background: x.color }}
            />
          ))}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((x) => (
          <li key={x.name} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: x.color }} />
            <span className="flex-1 text-night-900">{x.name}</span>
            <span className="text-muted tabular-nums">{x.count}</span>
            <span className="w-24 text-right font-semibold text-night-900 tabular-nums">
              {fcfa(x.amount)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const shortStatus: Record<DisplayStatus, string> = {
  pending: "À confirmer",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  expired: "Expirée",
};

const statusChip: Record<DisplayStatus, string> = {
  pending: "bg-amber-50 text-amber-900",
  confirmed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-zinc-100 text-zinc-700",
  expired: "bg-red-50 text-red-800",
};

function RecentBookings({ rows, onOpen }: { rows: AdminBooking[]; onOpen: () => void }) {
  const recent = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  return (
    <Card
      title="Réservations récentes"
      className="overflow-hidden"
      action={
        <button
          type="button"
          onClick={onOpen}
          className="h-8 rounded-full border border-line px-3 text-xs font-semibold text-night-900 transition hover:bg-paper"
        >
          Voir tout ›
        </button>
      }
    >
      <div className="-mx-5 mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-3 [&_th]:px-3">
          <thead>
            <tr className="bg-paper text-[11px] font-semibold tracking-wide text-muted uppercase">
              <th className="py-2.5 !pl-5 font-semibold">Business</th>
              <th className="py-2.5 font-semibold">Live</th>
              <th className="py-2.5 font-semibold">Package</th>
              <th className="py-2.5 text-right font-semibold">Montant</th>
              <th className="py-2.5 !pr-5 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="py-3 !pl-5">
                  <span className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-night-900 text-[11px] font-bold text-white">
                      {b.businessName.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="leading-tight">
                      <span className="block font-semibold whitespace-nowrap text-night-900">
                        {b.businessName}
                      </span>
                      <span className="block text-xs text-muted">
                        {b.city}, {b.country}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="py-3 whitespace-nowrap text-night-900">
                  {formatDayFr(new Date(b.startsAt)).replace(/^\w+ /, "")} ·{" "}
                  {formatRangeFr(new Date(b.startsAt), b.durationMinutes).split("–")[0]}
                </td>
                <td className="py-3 text-night-900">{b.packageLabel}</td>
                <td className="py-3 text-right font-semibold whitespace-nowrap text-night-900 tabular-nums">
                  {fcfa(b.amount)}
                </td>
                <td className="py-3 !pr-5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                      statusChip[b.display],
                    )}
                  >
                    {shortStatus[b.display]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function Overview({
  rows: all,
  now,
  go,
  map,
}: {
  rows: AdminBooking[];
  now: number;
  go: GoTo;
  map: AudienceMap;
}) {
  // Par défaut : toute l'année en cours.
  const [period, setPeriod] = useState<Period>(() => ({
    year: new Date(now).getUTCFullYear(),
    month: null,
  }));
  const years = useMemo(() => {
    const set = new Set(all.map((b) => Number(b.startsAt.slice(0, 4))));
    set.add(new Date(now).getUTCFullYear());
    return [...set].sort();
  }, [all, now]);
  const rows = useMemo(() => all.filter((b) => inPeriod(b, period)), [all, period]);
  const ids = useMemo(() => new Set(rows.map((b) => b.id)), [rows]);
  // Semaine affichée au départ dans le graphique : celle du premier live de la période.
  const firstLive = rows
    .filter(isActive)
    .map((b) => Date.parse(b.startsAt))
    .sort((a, b) => a - b)[0];
  const initialWeek = firstLive ?? Date.UTC(period.year, (period.month ?? 1) - 1, 1);

  const stats = useMemo(() => {
    const weekAgo = now - 7 * DAY;
    const twoWeeksAgo = now - 14 * DAY;
    const created = (from: number, to: number) =>
      rows.filter(
        (b) => isActive(b) && Date.parse(b.createdAt) >= from && Date.parse(b.createdAt) < to,
      );
    const thisWeek = created(weekAgo, now + 1);
    const lastWeek = created(twoWeeksAgo, weekAgo);
    const confirmed = rows.filter((b) => b.display === "confirmed");
    const pending = rows.filter((b) => b.display === "pending");
    const upcoming = rows
      .filter((b) => isActive(b) && Date.parse(b.startsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return {
      collected: confirmed.reduce((s, b) => s + b.amount, 0),
      collectedWeek: confirmed
        .filter((b) => b.validatedAt && Date.parse(b.validatedAt) >= weekAgo)
        .reduce((s, b) => s + b.amount, 0),
      pendingAmount: pending.reduce((s, b) => s + b.amount, 0),
      pendingCount: pending.length,
      active: rows.filter(isActive).length,
      thisWeek: thisWeek.length,
      lastWeek: lastWeek.length,
      upcoming: upcoming.length,
      next: upcoming[0],
    };
  }, [rows, now]);

  const diff = stats.thisWeek - stats.lastWeek;

  return (
    <div className="space-y-5">
      <PeriodBanner
        period={period}
        onChange={setPeriod}
        years={years}
        count={rows.filter(isActive).length}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total confirmé"
          value={number(stats.collected)}
          cents=" FCFA"
          openLabel="Voir les réservations confirmées"
          onOpen={() => go("liste", "confirmed")}
          trend={
            <>
              <Trend tone={stats.collectedWeek ? "good" : "neutral"}>
                <TrendingUp className="size-3" aria-hidden /> +{fcfa(stats.collectedWeek)}
              </Trend>
              cette semaine
            </>
          }
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={number(stats.pendingAmount)}
          cents=" FCFA"
          openLabel="Voir les réservations à confirmer"
          onOpen={() => go("liste", "pending")}
          trend={
            <>
              <Trend tone={stats.pendingCount ? "warn" : "neutral"}>
                {stats.pendingCount} à confirmer
              </Trend>
              sur WhatsApp
            </>
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Réservations"
          value={number(stats.active)}
          openLabel="Voir toutes les réservations"
          onOpen={() => go("liste")}
          trend={
            <>
              <Trend tone={diff >= 0 ? "good" : "warn"}>
                {diff >= 0 ? "↑" : "↓"} {Math.abs(diff)}
              </Trend>
              vs semaine dernière ({stats.thisWeek} en 7 jours)
            </>
          }
        />
        <StatCard
          icon={CalendarClock}
          label="Lives à venir"
          value={number(stats.upcoming)}
          openLabel="Voir le calendrier"
          onOpen={() => go("calendrier")}
          trend={
            stats.next ? (
              <>
                <Trend tone="neutral">Prochain</Trend>
                {formatDayFr(new Date(stats.next.startsAt))} ·{" "}
                {
                  formatRangeFr(new Date(stats.next.startsAt), stats.next.durationMinutes).split(
                    "–",
                  )[0]
                }
              </>
            ) : (
              <Trend tone="neutral">Aucun live prévu</Trend>
            )
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <FlowChart key={periodLabel(period)} rows={rows} now={now} initial={initialWeek} />
        <PackageSplit rows={rows} onOpen={() => go("stats")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <AudienceMapCard map={map} ids={ids} />
        <ActivityFeed rows={rows} now={now} />
      </div>

      <RecentBookings rows={rows} onOpen={() => go("liste")} />
    </div>
  );
}
