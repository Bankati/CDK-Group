"use client";

import {
  BarChart3,
  Bell,
  ExternalLink,
  LayoutGrid,
  Search,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  LogOut,
  Mail,
  Send,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { WhatsAppIcon } from "@/components/icons";
import { packages } from "@/config/site";
import { fcfa } from "@/lib/format";
import { addMonths, daysInMonth, formatDayFr, formatRangeFr, monthLabel } from "@/lib/time";
import { statusLabels, type DisplayStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import {
  cancelReservation,
  confirmReservation,
  logout,
  saveNotificationEmails,
  sendTestNotification,
} from "./actions";
import { Overview, type GoTo } from "./overview";
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
type Tab = "apercu" | "liste" | "calendrier" | "stats" | "emails" | "reglages";

const statusStyle: Record<DisplayStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-700",
  expired: "bg-red-100 text-red-800",
};

const selectClass =
  "border-line text-ink focus:border-night-700 min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none";

export function Dashboard({
  bookings,
  kpis,
  now,
  demo,
  emails,
  emailsEnabled,
  notificationEmails,
}: {
  bookings: AdminBooking[];
  kpis: Kpis;
  now: number;
  demo: boolean;
  emails: EmailRow[];
  emailsEnabled: boolean;
  /** Adresses qui reçoivent les nouvelles réservations. */
  notificationEmails: string[];
}) {
  const [tab, setTab] = useState<Tab>("apercu");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const filtered = useMemo(() => applyFilters(bookings, filters), [bookings, filters]);
  const countries = useMemo(() => [...new Set(bookings.map((b) => b.country))].sort(), [bookings]);
  const exportHref = `/espace-bovann/export?${new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][],
  )}`;
  const hasFilters = Object.values(filters).some(Boolean);

  const tabs: { id: Tab; label: string; Icon: typeof List }[] = [
    { id: "apercu", label: "Tableau de bord", Icon: LayoutGrid },
    { id: "liste", label: "Réservations", Icon: List },
    { id: "calendrier", label: "Calendrier", Icon: CalendarDays },
    { id: "stats", label: "Statistiques", Icon: BarChart3 },
    ...(!emailsEnabled ? [{ id: "emails" as const, label: "Emails", Icon: Mail }] : []),
    { id: "reglages", label: "Réglages", Icon: Settings },
  ];

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((b) =>
      [b.fullName, b.businessName, b.code, b.whatsapp, b.email, b.city, b.country]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [filtered, search]);

  const go: GoTo = (t, status) => {
    setTab(t);
    setFilters(status ? { status } : {});
  };

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lome",
  }).format(now);

  const titles: Record<Tab, string> = {
    apercu: "Bonjour, l'équipe Bovann 👋",
    liste: "Réservations",
    calendrier: "Calendrier des lives",
    stats: "Statistiques",
    emails: "Emails envoyés",
    reglages: "Réglages",
  };

  return (
    <div className="flex min-h-svh flex-1 bg-paper">
      {/* Menu latéral (ordinateur) */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <Link href="/" aria-label="Voir le site" className="px-2">
          <OcdLiveLogo tone="dark" className="text-2xl" />
        </Link>
        <p className="mt-1 px-2 text-xs text-muted">Espace Bovann</p>
        <nav aria-label="Espace Bovann" className="mt-8 space-y-1">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                tab === id
                  ? "bg-night-900 text-white shadow-md shadow-night-900/20"
                  : "text-muted hover:bg-paper hover:text-night-900",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {label}
              {id === "liste" && kpis.pending > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
                    tab === id ? "bg-white/15 text-white" : "bg-live-50 text-live-700",
                  )}
                >
                  {kpis.pending}
                </span>
              )}
              {id === "emails" && emails.length > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
                    tab === id ? "bg-white/15 text-white" : "bg-paper text-muted",
                  )}
                >
                  {emails.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-paper hover:text-night-900"
          >
            <ExternalLink className="size-[18px]" aria-hidden /> Voir le site
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-paper hover:text-night-900"
            >
              <LogOut className="size-[18px]" aria-hidden /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Barre du haut (téléphone) */}
        <div className="sticky top-0 z-20 border-b border-line bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <OcdLiveLogo tone="dark" className="text-xl" />
            <form action={logout}>
              <button
                type="submit"
                aria-label="Déconnexion"
                className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-paper"
              >
                <LogOut className="size-5" />
              </button>
            </form>
          </div>
          <nav aria-label="Espace Bovann" className="flex gap-1 overflow-x-auto px-3 pb-2">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={cn(
                  "min-h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold",
                  tab === id ? "bg-night-900 text-white" : "text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* En-tête : titre, recherche, notifications, profil */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-night-900 sm:text-[1.7rem]">
                {titles[tab]}
              </h1>
              <p className="mt-0.5 text-sm text-muted first-letter:uppercase">
                {today} · heure de Lomé
                {demo && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    MODE DÉMO
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative min-w-0 flex-1 xl:w-72 xl:flex-none">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value && tab !== "liste" && tab !== "calendrier") setTab("liste");
                  }}
                  placeholder="Rechercher un client, un business…"
                  aria-label="Rechercher une réservation"
                  className="h-11 w-full rounded-full border border-line bg-white pr-4 pl-10 text-sm text-ink outline-none focus:border-night-700 focus:ring-4 focus:ring-night-700/10"
                />
              </div>
              <button
                type="button"
                onClick={() => go("liste", "pending")}
                aria-label={`${kpis.pending} réservation(s) à confirmer`}
                className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-night-900 transition hover:bg-paper"
              >
                <Bell className="size-[18px]" aria-hidden />
                {kpis.pending > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-live-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {kpis.pending}
                  </span>
                )}
              </button>
              <div className="hidden shrink-0 items-center gap-2.5 rounded-full border border-line bg-white py-1 pr-4 pl-1 sm:flex">
                {/* eslint-disable-next-line @next/next/no-img-element -- petite image locale */}
                <img
                  src="/brand/bovann-avatar.jpg"
                  alt=""
                  className="size-9 rounded-full object-cover"
                />
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-night-900">Bovann Group</span>
                  <span className="block max-w-40 truncate text-xs text-muted">
                    {notificationEmails[0]}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {tab === "apercu" && <Overview rows={bookings} now={now} go={go} />}

            {(tab === "liste" || tab === "calendrier") && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-3 sm:grid-cols-5">
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
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value || undefined }))
                  }
                  className={selectClass}
                >
                  <option value="">Tous les statuts</option>
                  {(Object.keys(statusLabels) as DisplayStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {statusLabels[st]}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtrer par pays"
                  value={filters.country ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, country: e.target.value || undefined }))
                  }
                  className={selectClass}
                >
                  <option value="">Tous les pays</option>
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <div className="col-span-2 flex gap-2 sm:col-span-1">
                  {(hasFilters || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilters({});
                        setSearch("");
                      }}
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

            {tab === "liste" && <BookingList rows={visible} />}
            {tab === "calendrier" && <CalendarView rows={visible} now={now} />}
            {tab === "stats" && <Stats rows={bookings} />}
            {tab === "emails" && <Emails rows={emails} />}
            {tab === "reglages" && (
              <SettingsPanel emails={notificationEmails} emailsEnabled={emailsEnabled} />
            )}
          </div>
        </main>
      </div>
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
          <dt className="text-xs text-muted">Contact</dt>
          <dd className="font-semibold text-night-900">{b.whatsapp}</dd>
          <dd className="text-xs break-all text-night-900">{b.email}</dd>
          {b.tiktok && <dd className="text-xs text-muted">{b.tiktok}</dd>}
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
                const res = await confirmReservation(b.id);
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
            Confirmer la réservation
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

/** Onglet « Réglages » : adresse(s) qui reçoivent chaque nouvelle réservation. */
function SettingsPanel({ emails, emailsEnabled }: { emails: string[]; emailsEnabled: boolean }) {
  const [state, save, saving] = useActionState(saveNotificationEmails, undefined);
  const [testing, startTest] = useTransition();
  const [testMsg, setTestMsg] = useState<{ ok: boolean; message: string }>();
  const current = state?.emails ?? emails;

  return (
    <div className="mt-6 max-w-2xl">
      <form action={save} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold text-night-900">Email de notification</h3>
        <p className="mt-1 text-sm text-muted">
          À chaque nouvelle réservation, toutes les réponses du formulaire (nom, WhatsApp, email,
          business, secteur, produits, TikTok, pays, date, heure, package, montant, photo) sont
          envoyées à cette adresse. Plusieurs adresses possibles, séparées par des virgules.
        </p>
        <label htmlFor="emails" className="mt-5 mb-1.5 block text-sm font-semibold text-night-900">
          Adresse(s) email
        </label>
        <input
          id="emails"
          name="emails"
          type="text"
          inputMode="email"
          autoComplete="email"
          defaultValue={current.join(", ")}
          placeholder="contact@bovanngroup.com"
          aria-invalid={state?.ok === false || undefined}
          className="block min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none focus:border-night-700 focus:ring-4 focus:ring-night-700/15 aria-invalid:border-danger"
        />
        {state?.message && (
          <p
            role="status"
            className={cn(
              "mt-2 text-sm font-semibold",
              state.ok ? "text-emerald-700" : "text-danger",
            )}
          >
            {state.message}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-night-900 px-5 text-sm font-bold text-white transition hover:bg-night-800 disabled:opacity-60"
          >
            <Check className="size-4" aria-hidden />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            disabled={testing}
            onClick={() =>
              startTest(async () => {
                setTestMsg(await sendTestNotification());
              })
            }
            className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-bold text-night-900 transition hover:bg-paper disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden />
            {testing ? "Envoi…" : "Envoyer un email de test"}
          </button>
        </div>
        {testMsg && (
          <p
            role="status"
            className={cn("mt-3 text-sm", testMsg.ok ? "text-emerald-700" : "text-danger")}
          >
            {testMsg.message}
          </p>
        )}
      </form>
      {!emailsEnabled && (
        <p className="mt-4 rounded-2xl bg-amber-100 p-4 text-sm text-amber-950">
          Mode démo : les emails ne partent pas encore (aucune clé Resend). Ils s&apos;affichent
          dans l&apos;onglet « Emails ». Une fois Resend branché (étape 2), ils arriveront
          réellement à ces adresses.
        </p>
      )}
    </div>
  );
}
