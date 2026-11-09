"use client";

import {
  BarChart3,
  Bell,
  ExternalLink,
  LayoutGrid,
  Search,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  LogOut,
  Send,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { Flag } from "@/components/booking/country-select";
import { WhatsAppIcon } from "@/components/icons";
import { packages } from "@/config/site";
import { countryByName } from "@/lib/countries";
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
import type { AudienceMap } from "@/server/audience-map";
import { Overview, type GoTo } from "./overview";
import { applyFilters, type AdminBooking, type Filters, type kpis as kpisFn } from "./data";

type Kpis = ReturnType<typeof kpisFn>;
type Tab = "apercu" | "liste" | "calendrier" | "stats" | "reglages";

const statusStyle: Record<DisplayStatus, string> = {
  pending: "bg-amber-50 text-amber-900",
  confirmed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-zinc-100 text-zinc-700",
  expired: "bg-red-50 text-red-800",
};

const selectClass =
  "border-line text-ink focus:border-night-700 min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none";

export function Dashboard({
  bookings,
  kpis,
  now,
  demo,
  emailsEnabled,
  notificationEmails,
  map,
}: {
  bookings: AdminBooking[];
  kpis: Kpis;
  now: number;
  demo: boolean;
  emailsEnabled: boolean;
  /** Adresses qui reçoivent les nouvelles réservations. */
  notificationEmails: string[];
  /** Carte de l'audience, calculée côté serveur. */
  map: AudienceMap;
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
            {tab === "apercu" && <Overview rows={bookings} now={now} go={go} map={map} />}

            {(tab === "liste" || tab === "calendrier") && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
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
                {tab === "calendrier" && (
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
                )}
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

            {tab === "liste" && (
              <>
                <div className="mt-4">
                  <StatusTabs
                    rows={bookings}
                    value={filters.status}
                    onChange={(st) => setFilters((f) => ({ ...f, status: st }))}
                  />
                </div>
                <BookingList rows={visible} />
              </>
            )}
            {tab === "calendrier" && <CalendarView rows={visible} now={now} />}
            {tab === "stats" && <Stats rows={bookings} />}
            {tab === "reglages" && (
              <SettingsPanel emails={notificationEmails} emailsEnabled={emailsEnabled} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const shortStatus: Record<DisplayStatus, string> = {
  pending: "À confirmer",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  expired: "Délai dépassé",
};

function StatusChip({ s }: { s: DisplayStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        statusStyle[s],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {shortStatus[s]}
    </span>
  );
}

const shortDay = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(d)
    .replace(/^\w/, (c) => c.toUpperCase());

/** Onglets de statut avec compteurs, au-dessus de la liste. */
function StatusTabs({
  rows,
  value,
  onChange,
}: {
  rows: AdminBooking[];
  value?: string;
  onChange: (s?: DisplayStatus) => void;
}) {
  const items: { id?: DisplayStatus; label: string }[] = [
    { label: "Toutes" },
    { id: "pending", label: "À confirmer" },
    { id: "confirmed", label: "Confirmées" },
    { id: "expired", label: "Délai dépassé" },
    { id: "cancelled", label: "Annulées" },
  ];
  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-full border border-line bg-white p-1"
      role="tablist"
      aria-label="Statut"
    >
      {items.map((it) => {
        const count = it.id ? rows.filter((b) => b.display === it.id).length : rows.length;
        const active = (value ?? undefined) === it.id;
        return (
          <button
            key={it.label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={cn(
              "flex min-h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
              active ? "bg-night-900 text-white" : "text-muted hover:text-night-900",
            )}
          >
            {it.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                active ? "bg-white/15" : "bg-paper",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BookingList({ rows }: { rows: AdminBooking[] }) {
  if (!rows.length)
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-night-900">Aucune réservation</p>
        <p className="mt-1 text-sm text-muted">Change les filtres ou la recherche pour en voir.</p>
      </div>
    );
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
      <div className="hidden grid-cols-[minmax(0,2.3fr)_1.2fr_1.3fr_1.3fr_8.5rem_7.5rem] gap-4 bg-paper px-5 py-2.5 text-[11px] font-semibold tracking-wide text-muted uppercase lg:grid">
        <span>Business</span>
        <span>Live</span>
        <span>Package</span>
        <span>Contact</span>
        <span>Statut</span>
        <span className="text-right">Actions</span>
      </div>
      <ul>
        {rows.map((b) => (
          <BookingRow key={b.id} b={b} />
        ))}
      </ul>
    </div>
  );
}

function BookingRow({ b }: { b: AdminBooking }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState(false);
  const startDate = new Date(b.startsAt);
  const canValidate = b.display === "pending" || b.display === "expired";
  const wa = waLink(
    b.whatsapp,
    `Bonjour ${b.fullName.split(" ")[0]}, ici l'équipe OCD Live (Bovann Group) au sujet de ta réservation ${b.code} du ${formatDayFr(startDate)} à ${formatRangeFr(startDate, b.durationMinutes)}.`,
  );
  const iconBtn =
    "flex size-9 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-50";

  return (
    <li className="border-b border-line last:border-0">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-4 lg:grid-cols-[minmax(0,2.3fr)_1.2fr_1.3fr_1.3fr_8.5rem_7.5rem]">
        {/* Business */}
        <div className="flex min-w-0 items-center gap-3">
          {b.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- photos de clients (URL externe ou démo)
            <img
              src={b.photoUrl}
              alt={`Produit de ${b.businessName}`}
              loading="lazy"
              className="size-11 shrink-0 rounded-xl bg-paper object-cover"
            />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-night-900 text-xs font-bold text-white">
              {b.businessName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-semibold text-night-900">{b.businessName}</span>
            <span className="block truncate text-xs text-muted">
              {b.fullName} · {b.city}, {b.country}
            </span>
          </span>
        </div>

        {/* Statut (mobile : à droite du nom) */}
        <div className="lg:hidden">
          <StatusChip s={b.display} />
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:col-span-3 lg:grid-cols-3 lg:gap-4">
          <div className="leading-tight">
            <span className="block font-semibold text-night-900">{shortDay(startDate)}</span>
            <span className="block text-xs text-muted">
              {formatRangeFr(startDate, b.durationMinutes)}
            </span>
          </div>
          <div className="leading-tight">
            <span className="block text-night-900">{b.packageLabel}</span>
            <span className="block text-xs font-semibold text-night-900 tabular-nums">
              {fcfa(b.amount)}
            </span>
          </div>
          <div className="col-span-2 leading-tight sm:col-span-1">
            <span className="block text-night-900 tabular-nums">{b.whatsapp}</span>
            <span className="block truncate text-xs text-muted">{b.email}</span>
          </div>
        </div>

        <div className="hidden lg:block">
          <StatusChip s={b.display} />
        </div>

        {/* Actions */}
        <div className="col-span-2 flex items-center justify-end gap-2 lg:col-span-1">
          {canValidate && (
            <button
              type="button"
              disabled={pending}
              aria-label="Confirmer la réservation"
              title="Confirmer la réservation"
              onClick={() =>
                start(async () => {
                  setError(undefined);
                  const res = await confirmReservation(b.id);
                  if (!res.ok) setError(res.message);
                })
              }
              className={cn(
                iconBtn,
                "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
              )}
            >
              {pending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Check className="size-4" />
              )}
            </button>
          )}
          <a
            href={wa}
            target="_blank"
            rel="noopener"
            aria-label="Contacter sur WhatsApp"
            title="Contacter sur WhatsApp"
            className={cn(
              iconBtn,
              "border-line text-[#1fa855] hover:border-[#1fa855] hover:bg-[#1fa855] hover:text-white",
            )}
          >
            <WhatsAppIcon className="size-4" />
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Voir le détail"
            title="Voir le détail"
            className={cn(iconBtn, "border-line text-night-900 hover:bg-paper")}
          >
            <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="grid gap-4 border-t border-dashed border-line bg-paper/60 px-5 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="text-xs text-muted">Produit(s) à présenter</p>
            <p className="mt-0.5 text-night-900">{b.products}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Secteur · mode</p>
            <p className="mt-0.5 text-night-900">
              {b.sector} · {b.mode === "presentiel" ? "Présentiel" : "À distance"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">TikTok · code</p>
            <p className="mt-0.5 text-night-900">
              {b.tiktok ?? "—"} · <span className="font-mono">{b.code}</span>
            </p>
          </div>
          {b.display !== "cancelled" && (
            <div className="sm:col-span-2 lg:col-span-4">
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
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-muted transition hover:border-danger hover:text-danger"
              >
                <X className="size-4" />
                Annuler la réservation
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p className="px-5 pb-3 text-sm font-semibold text-danger">{error}</p>}
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

/** Barres horizontales classées (une seule teinte), valeur au bout. */
function Bars({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: { label: React.ReactNode; key: string; value: number; sub?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-display text-base font-bold text-night-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      <ul className="mt-5 space-y-4">
        {items.map((it) => (
          <li key={it.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-night-900">{it.label}</span>
              <span className="shrink-0 text-xs text-muted tabular-nums">
                <strong className="text-sm text-night-900">{it.value}</strong>
                {it.sub ? ` · ${it.sub}` : ""}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-[#EE6B07]/12">
              <div
                className="h-full rounded-full bg-[#EE6B07] transition-[width] duration-700"
                style={{ width: `${(it.value / max) * 100}%`, minWidth: it.value ? 6 : 0 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm font-semibold text-night-900">{label}</p>
      <p className="mt-2 font-display text-[1.6rem] leading-none font-extrabold tracking-tight text-night-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Stats({ rows }: { rows: AdminBooking[] }) {
  const active = rows.filter((b) => b.display === "confirmed" || b.display === "pending");
  const decided = rows.filter((b) => b.display !== "pending");
  const confirmed = rows.filter((b) => b.display === "confirmed");
  const revenue = active.reduce((s, b) => s + b.amount, 0);
  const presentiel = active.filter((b) => b.mode === "presentiel").length;
  const distance = active.length - presentiel;
  const hours = active.reduce((s, b) => s + b.durationMinutes / 60, 0);

  const byPackage = packages
    .map((p) => {
      const list = active.filter((b) => b.packageId === p.id);
      return {
        key: p.id,
        label: p.name,
        value: list.length,
        sub: fcfa(list.reduce((s, b) => s + b.amount, 0)),
      };
    })
    .sort((a, b) => b.value - a.value);

  const countries = Object.entries(
    active.reduce<Record<string, number>>(
      (acc, b) => ((acc[b.country] = (acc[b.country] ?? 0) + 1), acc),
      {},
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => {
      const code = countryByName(name)?.code ?? "";
      return {
        key: name,
        value,
        label: (
          <>
            <Flag code={code} className="h-3.5 w-5 shrink-0" />
            <span className="truncate">{name}</span>
          </>
        ),
      };
    });

  const sectors = Object.entries(
    active.reduce<Record<string, number>>(
      (acc, b) => ((acc[b.sector] = (acc[b.sector] ?? 0) + 1), acc),
      {},
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ key: name, label: name, value }));

  const pct = active.length ? Math.round((presentiel / active.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Panier moyen"
          value={fcfa(active.length ? Math.round(revenue / active.length) : 0)}
          hint={`sur ${active.length} réservation${active.length > 1 ? "s" : ""} actives`}
        />
        <MiniStat
          label="Taux de confirmation"
          value={`${decided.length ? Math.round((confirmed.length / decided.length) * 100) : 0} %`}
          hint="réservations confirmées / traitées"
        />
        <MiniStat
          label="Heures de live"
          value={`${Math.round(hours)} h`}
          hint="réservées au total"
        />
        <MiniStat
          label="Pays touchés"
          value={String(countries.length)}
          hint={`${distance} live${distance > 1 ? "s" : ""} à distance`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Bars
          title="Packages les plus vendus"
          subtitle="Nombre de réservations · montant"
          items={byPackage}
        />
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-display text-base font-bold text-night-900">
              Présentiel ou à distance
            </h3>
            <div className="mt-5 flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
              <span style={{ width: `${pct}%`, background: "#EE6B07" }} />
              <span className="flex-1" style={{ background: "#1f9e89" }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#EE6B07]" />
                <span className="text-night-900">Présentiel</span>
                <strong className="ml-auto text-night-900 tabular-nums">
                  {presentiel} · {pct} %
                </strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#1f9e89]" />
                <span className="text-night-900">À distance</span>
                <strong className="ml-auto text-night-900 tabular-nums">
                  {distance} · {active.length ? 100 - pct : 0} %
                </strong>
              </p>
            </div>
          </section>
          <Bars title="Pays d'origine" items={countries} />
        </div>
      </div>
      <Bars title="Secteurs d'activité" subtitle="Les 6 plus représentés" items={sectors} />
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
          Mode démo : les emails ne partent pas encore (aucune clé Resend). Une fois Resend branché
          (étape 2), ils arriveront réellement à ces adresses.
        </p>
      )}
    </div>
  );
}
