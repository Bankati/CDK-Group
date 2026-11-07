"use client";

import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  LogOut,
  Mail,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { WhatsAppIcon } from "@/components/icons";
import { packages, payment } from "@/config/site";
import { fcfa, number } from "@/lib/format";
import { addMonths, daysInMonth, formatDayFr, formatRangeFr, monthLabel } from "@/lib/time";
import { statusLabels, type DisplayStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import { cancelReservation, logout, validatePayment } from "./actions";
import { applyFilters, type AdminBooking, type Filters, type kpis as kpisFn } from "./data";

type Kpis = ReturnType<typeof kpisFn>;
type EmailRow = {
  to: string;
  subject: string;
  text: string;
  at: string;
  delivered: boolean;
  error?: string;
};
type Tab = "liste" | "calendrier" | "stats" | "emails";

const statusStyle: Record<DisplayStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-700",
  expired: "bg-red-100 text-red-800",
};

const methodLabel = (m: string) =>
  m === "whatsapp" ? "WhatsApp" : (payment.operators.find((o) => o.id === m)?.label ?? m);

const selectClass =
  "border-line text-ink focus:border-night-700 min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none";

export function Dashboard({
  bookings,
  kpis,
  now,
  demo,
  emails,
  emailsEnabled,
}: {
  bookings: AdminBooking[];
  kpis: Kpis;
  now: number;
  demo: boolean;
  emails: EmailRow[];
  emailsEnabled: boolean;
}) {
  const [tab, setTab] = useState<Tab>("liste");
  const [filters, setFilters] = useState<Filters>({});
  const filtered = useMemo(() => applyFilters(bookings, filters), [bookings, filters]);
  const countries = useMemo(() => [...new Set(bookings.map((b) => b.country))].sort(), [bookings]);
  const exportHref = `/espace-bovann/export?${new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][],
  )}`;
  const hasFilters = Object.values(filters).some(Boolean);

  const tabs: { id: Tab; label: string; Icon: typeof List }[] = [
    { id: "liste", label: "Réservations", Icon: List },
    { id: "calendrier", label: "Calendrier", Icon: CalendarDays },
    { id: "stats", label: "Statistiques", Icon: BarChart3 },
    ...(!emailsEnabled ? [{ id: "emails" as const, label: "Emails", Icon: Mail }] : []),
  ];

  return (
    <div className="flex-1 bg-paper">
      <header className="bg-night-900 text-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Voir le site">
            <OcdLiveLogo className="text-xl" />
          </Link>
          <span className="hidden text-sm text-white/60 sm:inline">Espace Bovann</span>
          {demo && (
            <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-950">
              MODE DÉMO
            </span>
          )}
          <form action={logout} className="ml-auto">
            <button
              type="submit"
              className="flex min-h-10 items-center gap-2 rounded-full px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Indicateurs */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicateurs">
          <Kpi
            label="Total encaissé"
            value={fcfa(kpis.collected)}
            sub={
              kpis.pendingAmount ? `+ ${fcfa(kpis.pendingAmount)} en attente` : "paiements validés"
            }
            strong
          />
          <Kpi
            label="Réservations"
            value={number(kpis.bookings)}
            sub={`dont ${kpis.pending} en attente`}
          />
          <Kpi label="Lives aujourd'hui" value={number(kpis.today)} sub="heure de Lomé" />
          <Kpi label="Lives cette semaine" value={number(kpis.week)} sub="du lundi au dimanche" />
        </section>

        {kpis.next && (
          <p className="mt-3 text-sm text-muted">
            Prochain live : <strong className="text-night-900">{kpis.next.businessName}</strong>,{" "}
            {formatDayFr(new Date(kpis.next.startsAt))} ·{" "}
            {formatRangeFr(new Date(kpis.next.startsAt), kpis.next.durationMinutes)}
          </p>
        )}

        {kpis.pending > 0 && (
          <button
            type="button"
            onClick={() => {
              setTab("liste");
              setFilters({ status: "pending" });
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-amber-100 p-4 text-left text-sm font-semibold text-amber-950 transition hover:bg-amber-200"
          >
            <Wallet className="size-5 shrink-0" aria-hidden />
            {kpis.pending} paiement{kpis.pending > 1 ? "s" : ""} à valider
            <span className="ml-auto underline underline-offset-4">Voir</span>
          </button>
        )}

        {/* Onglets */}
        <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-line" aria-label="Vues">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "-mb-px flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition",
                tab === id
                  ? "border-live text-night-900"
                  : "border-transparent text-muted hover:text-night-900",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {id === "emails" && emails.length > 0 && (
                <span className="rounded-full bg-live-600 px-1.5 text-[10px] text-white">
                  {emails.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {(tab === "liste" || tab === "calendrier") && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <input
              type="date"
              aria-label="Filtrer par date"
              value={filters.date ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value || undefined }))}
              className={selectClass}
            />
            <select
              aria-label="Filtrer par package"
              value={filters.packageId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, packageId: e.target.value || undefined }))
              }
              className={selectClass}
            >
              <option value="">Tous les packages</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par statut"
              value={filters.status ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
              className={selectClass}
            >
              <option value="">Tous les statuts</option>
              {(Object.keys(statusLabels) as DisplayStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par pays"
              value={filters.country ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value || undefined }))}
              className={selectClass}
            >
              <option value="">Tous les pays</option>
              {countries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="col-span-2 flex gap-2 sm:col-span-1">
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => setFilters({})}
                  className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-muted hover:text-night-900"
                >
                  Effacer
                </button>
              )}
              <a
                href={exportHref}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-night-900 px-3 text-sm font-bold text-white hover:bg-night-800"
              >
                <Download className="size-4" aria-hidden />
                Excel / CSV
              </a>
            </div>
          </div>
        )}

        {tab === "liste" && <BookingList rows={filtered} />}
        {tab === "calendrier" && <CalendarView rows={filtered} now={now} />}
        {tab === "stats" && <Stats rows={bookings} />}
        {tab === "emails" && <Emails rows={emails} />}
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  strong,
}: {
  label: string;
  value: string;
  sub: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 sm:p-5",
        strong ? "bg-night-900 text-white" : "border border-line bg-white",
      )}
    >
      <p className={cn("text-xs font-semibold", strong ? "text-white/70" : "text-muted")}>
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl",
          !strong && "text-night-900",
        )}
      >
        {value}
      </p>
      <p className={cn("mt-0.5 text-xs", strong ? "text-white/60" : "text-muted")}>{sub}</p>
    </div>
  );
}

function StatusChip({ s }: { s: DisplayStatus }) {
  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold", statusStyle[s])}
    >
      {statusLabels[s]}
    </span>
  );
}

function BookingList({ rows }: { rows: AdminBooking[] }) {
  if (!rows.length)
    return <p className="mt-10 text-center text-muted">Aucune réservation pour ces filtres.</p>;
  return (
    <ul className="mt-5 space-y-3">
      {rows.map((b) => (
        <BookingRow key={b.id} b={b} />
      ))}
    </ul>
  );
}

function BookingRow({ b }: { b: AdminBooking }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const startDate = new Date(b.startsAt);
  const canValidate = b.display === "pending" || b.display === "expired";
  const wa = waLink(
    b.whatsapp,
    `Bonjour ${b.fullName.split(" ")[0]}, ici l'équipe OCD Live (Bovann Group) au sujet de ta réservation ${b.code} du ${formatDayFr(startDate)} à ${formatRangeFr(startDate, b.durationMinutes)}.`,
  );

  return (
    <li className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex gap-4">
        {b.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- photos de clients (URL externe ou démo)
          <img
            src={b.photoUrl}
            alt={`Produit de ${b.businessName}`}
            loading="lazy"
            className="size-16 shrink-0 rounded-xl bg-paper object-cover sm:size-20"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-paper font-display text-xl font-bold text-night-700 sm:size-20">
            {b.businessName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg leading-tight font-bold text-night-900">
              {b.businessName}
            </p>
            <StatusChip s={b.display} />
          </div>
          <p className="text-sm text-muted">
            {b.fullName} · {b.sector}
          </p>
          <p className="mt-1 text-sm text-night-900">{b.products}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Live</dt>
          <dd className="font-semibold text-night-900 first-letter:uppercase">
            {formatDayFr(startDate)}
          </dd>
          <dd className="text-night-900">{formatRangeFr(startDate, b.durationMinutes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Package</dt>
          <dd className="font-semibold text-night-900">{b.packageLabel}</dd>
          <dd className="text-night-900">{fcfa(b.amount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Mode</dt>
          <dd className="font-semibold text-night-900">
            {b.mode === "presentiel" ? "Présentiel" : "À distance"}
          </dd>
          <dd className="text-night-900">
            {b.city}, {b.country}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Paiement</dt>
          <dd className="font-semibold text-night-900">{methodLabel(b.paymentMethod)}</dd>
          <dd className="font-mono text-xs break-all text-night-900">
            {b.paymentReference ?? "à régler sur WhatsApp"}
          </dd>
          {b.paymentPhone && <dd className="text-xs text-muted">depuis {b.paymentPhone}</dd>}
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canValidate && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(undefined);
                const res = await validatePayment(b.id);
                if (!res.ok) setError(res.message);
              })
            }
            className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Check className="size-4" />
            )}
            Valider le paiement
          </button>
        )}
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          className="flex min-h-11 items-center gap-2 rounded-xl bg-[#1fa855] px-4 text-sm font-bold text-white transition hover:bg-[#178a45]"
        >
          <WhatsAppIcon className="size-4" />
          Contacter sur WhatsApp
        </a>
        {b.display !== "cancelled" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Annuler la réservation de ${b.businessName} ?`)) return;
              start(async () => {
                const res = await cancelReservation(b.id);
                if (!res.ok) setError(res.message);
              });
            }}
            className="ml-auto flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted hover:text-danger"
          >
            <X className="size-4" />
            Annuler
          </button>
        )}
        <span className="w-full font-mono text-xs text-muted sm:w-auto">{b.code}</span>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </li>
  );
}

const WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function CalendarView({ rows, now }: { rows: AdminBooking[]; now: number }) {
  const firstLive = rows[0]?.startsAt.slice(0, 7);
  const current = new Date(now).toISOString().slice(0, 7);
  const [month, setMonth] = useState(firstLive && firstLive > current ? firstLive : current);
  const [day, setDay] = useState<string>();
  const [y, m] = month.split("-").map(Number) as [number, number];
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const byDay = useMemo(() => {
    const map: Record<string, AdminBooking[]> = {};
    for (const b of rows) (map[b.startsAt.slice(0, 10)] ??= []).push(b);
    return map;
  }, [rows]);
  const today = new Date(now).toISOString().slice(0, 10);

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          aria-label="Mois précédent"
          className="flex size-11 items-center justify-center rounded-full hover:bg-white"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-display text-lg font-bold text-night-900 capitalize">
          {monthLabel(month)}
        </p>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Mois suivant"
          className="flex size-11 items-center justify-center rounded-full hover:bg-white"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-line bg-white">
        {WEEK.map((d) => (
          <div
            key={d}
            className="border-b border-line py-2 text-center text-xs font-semibold text-muted"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`x${i}`} className="border-b border-line bg-paper/60" />
        ))}
        {Array.from({ length: daysInMonth(month) }, (_, i) => {
          const key = `${month}-${String(i + 1).padStart(2, "0")}`;
          const list = (byDay[key] ?? []).filter((b) => b.display !== "cancelled");
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDay(key === day ? undefined : key)}
              className={cn(
                "flex min-h-16 flex-col items-stretch gap-1 border-b border-line p-1 text-left transition hover:bg-paper sm:min-h-24 sm:p-1.5",
                key === day && "bg-night-800/[0.06] ring-2 ring-night-700 ring-inset",
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold",
                  key === today
                    ? "w-fit rounded-full bg-live-600 px-1.5 text-white"
                    : "text-night-900",
                )}
              >
                {i + 1}
              </span>
              <span className="flex flex-wrap gap-1 sm:hidden">
                {list.map((b) => (
                  <span
                    key={b.id}
                    className={cn(
                      "size-2 rounded-full",
                      b.display === "confirmed"
                        ? "bg-emerald-500"
                        : b.display === "pending"
                          ? "bg-amber-400"
                          : "bg-red-400",
                    )}
                  />
                ))}
              </span>
              <span className="hidden flex-col gap-1 sm:flex">
                {list.slice(0, 3).map((b) => (
                  <span
                    key={b.id}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[11px] font-semibold",
                      statusStyle[b.display],
                    )}
                  >
                    {b.startsAt.slice(11, 16)} {b.businessName}
                  </span>
                ))}
                {list.length > 3 && (
                  <span className="text-[11px] text-muted">+{list.length - 3}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {day && (
        <div className="mt-5">
          <p className="font-display text-lg font-bold text-night-900 first-letter:uppercase">
            {formatDayFr(new Date(`${day}T12:00:00Z`))}
          </p>
          <BookingList rows={byDay[day] ?? []} />
        </div>
      )}
      {!day && (
        <p className="mt-3 text-center text-sm text-muted">Touchez un jour pour voir le détail.</p>
      )}
    </div>
  );
}

function Bars({
  title,
  items,
  total,
}: {
  title: string;
  items: { label: string; value: number; sub?: string }[];
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-display font-bold text-night-900">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it.label}>
            <div className="flex justify-between gap-3 text-sm">
              <span className="font-semibold text-night-900">{it.label}</span>
              <span className="text-muted tabular-nums">
                {it.value}
                {it.sub ? ` · ${it.sub}` : ""}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full bg-night-700"
                style={{ width: `${total ? (it.value / total) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stats({ rows }: { rows: AdminBooking[] }) {
  const active = rows.filter((b) => b.display === "confirmed" || b.display === "pending");
  const byPackage = packages
    .map((p) => {
      const list = active.filter((b) => b.packageId === p.id);
      return {
        label: p.name,
        value: list.length,
        sub: fcfa(list.reduce((s, b) => s + b.amount, 0)),
      };
    })
    .sort((a, b) => b.value - a.value);
  const presentiel = active.filter((b) => b.mode === "presentiel").length;
  const countryCounts = Object.entries(
    active.reduce<Record<string, number>>(
      (acc, b) => ((acc[b.country] = (acc[b.country] ?? 0) + 1), acc),
      {},
    ),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const pct = active.length ? Math.round((presentiel / active.length) * 100) : 0;

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <Bars
        title="Packages les plus vendus"
        items={byPackage}
        total={Math.max(1, ...byPackage.map((b) => b.value))}
      />
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display font-bold text-night-900">Présentiel ou à distance</h3>
          <div className="mt-4 flex h-4 overflow-hidden rounded-full">
            <div className="bg-live" style={{ width: `${pct}%` }} />
            <div className="flex-1 bg-night-700" />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-live" />
              Présentiel <strong>{presentiel}</strong> ({pct}%)
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-night-700" />À distance{" "}
              <strong>{active.length - presentiel}</strong> ({active.length ? 100 - pct : 0}%)
            </span>
          </div>
        </div>
        <Bars
          title="Pays d'origine"
          items={countryCounts}
          total={Math.max(1, ...countryCounts.map((c) => c.value))}
        />
      </div>
    </div>
  );
}

function Emails({ rows }: { rows: EmailRow[] }) {
  return (
    <div className="mt-5">
      <p className="mb-4 rounded-2xl bg-white p-4 text-sm text-muted">
        Mode démo : aucune clé Resend n&apos;est configurée, les emails ne partent pas. Voici
        exactement ce qui serait envoyé à Bovann Group et aux clients.
      </p>
      {!rows.length && (
        <p className="text-center text-muted">
          Aucun email pour l&apos;instant. Faites une réservation pour en voir.
        </p>
      )}
      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.at + e.subject} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold text-night-900">{e.subject}</p>
            <p className="text-xs text-muted">
              À : {e.to} ·{" "}
              {new Date(e.at).toLocaleString("fr-FR", {
                timeZone: "Africa/Lome",
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-night-900">{e.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
