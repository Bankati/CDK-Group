"use client";

import { ArrowUpRight, CalendarClock, Clock, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { goals, packages, schedule } from "@/config/site";
import { fcfa, number } from "@/lib/format";
import { formatDayFr, formatRangeFr } from "@/lib/time";
import type { DisplayStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { AdminBooking } from "./data";

/**
 * Couleurs des graphiques : palette catégorielle validée (daltonisme, contraste)
 * avec le script du guide dataviz. Ordre fixe, jamais recyclé.
 */
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
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
      <div className="flex items-center justify-between gap-3">
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

/** Colonnes groupées : réservations reçues par jour (confirmé / en attente). */
function FlowChart({ rows, now }: { rows: AdminBooking[]; now: number }) {
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [hover, setHover] = useState<number | null>(null);
  const today = Date.parse(`${dayKey(now)}T00:00:00Z`);
  const days = Array.from({ length: range }, (_, i) => today - (range - 1 - i) * DAY);
  const data = days.map((d) => {
    const key = dayKey(d);
    const same = rows.filter((b) => b.createdAt.startsWith(key));
    return {
      d,
      confirmed: same.filter((b) => b.display === "confirmed").reduce((s, b) => s + b.amount, 0),
      pending: same.filter((b) => b.display === "pending").reduce((s, b) => s + b.amount, 0),
    };
  });
  const max = Math.max(1, ...data.flatMap((x) => [x.confirmed, x.pending]));
  const step = max <= 40_000 ? 10_000 : max <= 100_000 ? 25_000 : 50_000;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step).reverse();
  const label = (d: number) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(d);

  return (
    <Card
      title="Réservations reçues"
      action={
        <div className="flex items-center gap-4">
          <div
            className="hidden items-center gap-4 text-xs text-muted sm:flex"
            aria-label="Légende"
          >
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: CONFIRMED }} /> Confirmé
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: PENDING }} /> En attente
            </span>
          </div>
          <select
            aria-label="Période"
            value={range}
            onChange={(e) => setRange(Number(e.target.value) as 7 | 14 | 30)}
            className="h-8 rounded-full border border-line bg-white px-3 text-xs font-semibold text-night-900 outline-none"
          >
            <option value={7}>7 jours</option>
            <option value={14}>14 jours</option>
            <option value={30}>30 jours</option>
          </select>
        </div>
      }
    >
      <div className="mt-5 flex gap-3">
        {/* Axe Y (montants) */}
        <div className="flex h-64 flex-col justify-between pb-7 text-right text-[11px] text-muted tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {compact(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* Grille discrète */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
            {ticks.map((t) => (
              <span key={t} className="border-t border-dashed border-line" />
            ))}
          </div>
          <div className="relative flex h-64 items-end justify-between gap-1 pb-7">
            {data.map((x, i) => (
              <div
                key={x.d}
                className="relative flex h-full flex-1 flex-col items-center justify-end"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                {hover === i && (
                  <div className="absolute bottom-[calc(100%-1rem)] z-10 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] whitespace-nowrap text-night-900 shadow-lg">
                    <p className="font-semibold">{label(x.d)}</p>
                    <p className="flex items-center gap-1.5 text-muted">
                      <span className="size-2 rounded-full" style={{ background: CONFIRMED }} />
                      Confirmé <strong className="text-night-900">{fcfa(x.confirmed)}</strong>
                    </p>
                    <p className="flex items-center gap-1.5 text-muted">
                      <span className="size-2 rounded-full" style={{ background: PENDING }} />
                      En attente <strong className="text-night-900">{fcfa(x.pending)}</strong>
                    </p>
                  </div>
                )}
                <div
                  className={cn(
                    "flex h-full w-full items-end justify-center gap-[2px]",
                    hover !== null && hover !== i && "opacity-40",
                  )}
                >
                  {[
                    [x.confirmed, CONFIRMED],
                    [x.pending, PENDING],
                  ].map(([v, c], k) => (
                    <span
                      key={k}
                      className="block w-full max-w-3 rounded-t transition-[height] duration-500"
                      style={{
                        height: `${((v as number) / top) * 100}%`,
                        background: c as string,
                        minHeight: (v as number) > 0 ? 3 : 0,
                      }}
                    />
                  ))}
                </div>
                {(range <= 14 || i % 5 === 0) && (
                  <span className="absolute -bottom-6 text-[10px] whitespace-nowrap text-muted">
                    {range <= 7 || i % 2 === 0 ? label(x.d) : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only">
        {data
          .filter((x) => x.confirmed || x.pending)
          .map(
            (x) => `${label(x.d)} : ${fcfa(x.confirmed)} confirmés, ${fcfa(x.pending)} en attente`,
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

/** Objectifs : jauges (piste et remplissage de la même teinte). */
function Goals({ rows }: { rows: AdminBooking[] }) {
  const month = schedule.firstDay.slice(0, 7);
  const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(
    new Date(`${month}-15T00:00:00Z`),
  );
  const inMonth = rows.filter((b) => isActive(b) && b.startsAt.startsWith(month));
  const pack = packages.find((p) => p.monthlyQuota);
  const packSold = inMonth.filter((b) => b.packageId === pack?.id).length;
  const daysInMonth = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
  ).getUTCDate();
  const hoursOpen = daysInMonth * (schedule.closeHour - schedule.openHour);
  const hoursBooked = inMonth.reduce((s, b) => s + b.durationMinutes / 60, 0);
  const revenue = inMonth.reduce((s, b) => s + b.amount, 0);

  const items = [
    {
      label: `Chiffre d'affaires de ${monthName}`,
      value: revenue,
      max: goals.monthlyRevenue,
      fmt: fcfa,
    },
    pack
      ? {
          label: `Pack du mois · places vendues`,
          value: packSold,
          max: pack.monthlyQuota!,
          fmt: (n: number) => `${n} places`,
        }
      : null,
    {
      label: `Heures de live réservées en ${monthName}`,
      value: Math.round(hoursBooked),
      max: hoursOpen,
      fmt: (n: number) => `${n} h`,
    },
  ].filter(Boolean) as { label: string; value: number; max: number; fmt: (n: number) => string }[];

  return (
    <Card title="Objectifs">
      <ul className="mt-4 space-y-5">
        {items.map((g) => {
          const pct = Math.min(100, Math.round((g.value / g.max) * 100));
          return (
            <li key={g.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-night-900">{g.label}</span>
                <span className="text-xs whitespace-nowrap text-muted">
                  <strong className="text-night-900">{g.fmt(g.value)}</strong> / {g.fmt(g.max)}
                </span>
              </div>
              <div
                className="mt-2 h-5 overflow-hidden rounded-full bg-[#2a78d6]/15"
                role="meter"
                aria-label={g.label}
                aria-valuemin={0}
                aria-valuemax={g.max}
                aria-valuenow={g.value}
              >
                <div
                  className="flex h-full min-w-9 items-center justify-end rounded-full px-2 text-[10px] font-bold text-white"
                  style={{ width: `${Math.max(pct, 8)}%`, background: CONFIRMED }}
                >
                  {pct}%
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function Overview({ rows, now, go }: { rows: AdminBooking[]; now: number; go: GoTo }) {
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
        <FlowChart rows={rows} now={now} />
        <PackageSplit rows={rows} onOpen={() => go("stats")} />
      </div>

      <div className="grid gap-5 min-[1360px]:grid-cols-[1fr_22rem]">
        <RecentBookings rows={rows} onOpen={() => go("liste")} />
        <Goals rows={rows} />
      </div>
    </div>
  );
}
