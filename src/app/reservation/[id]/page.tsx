import { CalendarPlus, Clock, Download, MapPin, Package, Ticket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LiveBadge, OcdLiveLogo } from "@/components/brand";
import { AutoRefresh, Confetti, Countdown, LocalTime } from "@/components/confirmation/client-bits";
import { TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { site } from "@/config/site";
import { fcfa } from "@/lib/format";
import { getPackage, packageName } from "@/lib/packages";
import { addMinutes, formatDayFr, formatRangeFr } from "@/lib/time";
import { displayStatus, statusLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { teamWaLink } from "@/lib/whatsapp";
import { db } from "@/server/db";
import { googleCalendarUrl } from "./calendar";

export const metadata: Metadata = { title: "Ta réservation", robots: { index: false } };

async function Confirmation({ params, searchParams }: PageProps<"/reservation/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await connection();
  const b = await db.get(id);
  if (!b) notFound();

  const status = displayStatus(b);
  const pkg = getPackage(b.packageId);
  const start = new Date(b.startsAt);
  const end = addMinutes(start, b.durationMinutes);
  const name = pkg ? packageName(pkg, b.startsAt.slice(0, 7)) : b.packageId;
  const isNew = sp.nouveau === "1";
  const waMessage = `Bonjour Bovann Group ! Je viens de réserver un live OCD Live (code ${b.code}) : ${name}, le ${formatDayFr(start)} ${formatRangeFr(start, b.durationMinutes)} (heure de Lomé). Montant : ${fcfa(b.amount)}. Je souhaite payer avec vous depuis ${b.country}.`;

  return (
    <main className="relative flex-1 overflow-hidden bg-night-950 text-white">
      {isNew && status !== "cancelled" && <Confetti id={b.id} />}
      {status === "pending" && <AutoRefresh />}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-live/15 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-xl px-4 pt-6 pb-16">
        <Link href="/" aria-label="OCD Live, accueil">
          <OcdLiveLogo className="text-xl" />
        </Link>

        <div className="mt-10 animate-rise text-center">
          {status === "cancelled" ? (
            <h1 className="font-display text-4xl font-extrabold">Réservation annulée</h1>
          ) : status === "expired" ? (
            <>
              <h1 className="font-display text-4xl font-extrabold">Délai de validation dépassé</h1>
              <p className="mt-3 text-white/75">
                Ton créneau n&apos;a pas pu être validé à temps. Écris-nous sur WhatsApp avec ton
                code, on règle ça ensemble.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[2.6rem] leading-tight font-extrabold sm:text-5xl">
                Ta place est réservée&nbsp;!
              </h1>
              <p className="mt-3 text-white/75">
                {status === "confirmed"
                  ? "Paiement validé. On a hâte de te voir en live."
                  : b.paymentMethod === "whatsapp"
                    ? "Dernière étape : écris à l'équipe sur WhatsApp pour régler ton paiement."
                    : "Bovann Group vérifie ton paiement. Tu reçois la confirmation par email dès la validation."}
              </p>
            </>
          )}
          <span
            className={cn(
              "mt-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold",
              status === "confirmed" && "bg-emerald-500 text-white",
              status === "pending" && "bg-amber-300 text-night-950",
              (status === "expired" || status === "cancelled") && "bg-white/15 text-white",
            )}
          >
            {status === "pending" && (
              <span className="size-2 animate-pulse rounded-full bg-night-950" />
            )}
            {statusLabels[status]}
          </span>
        </div>

        {/* Billet */}
        <div className="mt-8 animate-rise" style={{ animationDelay: "120ms" }}>
          <div className="relative overflow-hidden rounded-3xl bg-white text-ink">
            <div className="flex items-center justify-between bg-night-900 px-6 py-4 text-white">
              <OcdLiveLogo className="text-lg" />
              <LiveBadge label="BILLET" />
            </div>
            <div className="px-6 pt-5 pb-4">
              <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                Entrepreneur
              </p>
              <p className="font-display text-2xl font-extrabold text-night-900">
                {b.businessName}
              </p>
              <p className="text-muted">{b.fullName}</p>
            </div>
            <div className="relative px-6">
              <div className="border-t-2 border-dashed border-line" />
              <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-night-950" />
              <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-night-950" />
            </div>
            <dl className="grid gap-4 px-6 py-5 text-sm">
              <div className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-live" aria-hidden />
                <div>
                  <dt className="sr-only">Date et heure</dt>
                  <dd className="font-bold text-night-900 first-letter:uppercase">
                    {formatDayFr(start, { year: true })}
                  </dd>
                  <dd className="font-bold text-night-900">
                    {formatRangeFr(start, b.durationMinutes)}{" "}
                    <span className="font-normal text-muted">heure de Lomé</span>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Package className="mt-0.5 size-5 shrink-0 text-live" aria-hidden />
                <div>
                  <dt className="sr-only">Package</dt>
                  <dd className="font-bold text-night-900">{name}</dd>
                  <dd className="text-muted">{fcfa(b.amount)}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-live" aria-hidden />
                <div>
                  <dt className="sr-only">Mode</dt>
                  <dd className="font-bold text-night-900">
                    {b.mode === "presentiel"
                      ? "En présentiel à Lomé"
                      : `À distance · ${b.city}, ${b.country}`}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Ticket className="mt-0.5 size-5 shrink-0 text-live" aria-hidden />
                <div>
                  <dt className="sr-only">Code</dt>
                  <dd className="font-mono text-lg font-bold tracking-widest text-night-900">
                    {b.code}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href={`/reservation/${b.id}/billet`}
              download={`billet-ocd-live-${b.code}.png`}
              className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 text-sm font-bold transition hover:bg-white/20"
            >
              <Download className="size-5" aria-hidden />
              Mon billet
            </a>
            <details className="group relative">
              <summary className="flex min-h-13 list-none items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 text-sm font-bold transition hover:bg-white/20 [&::-webkit-details-marker]:hidden">
                <CalendarPlus className="size-5" aria-hidden />
                Ajouter à mon agenda
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-2xl bg-white text-ink shadow-2xl">
                <a
                  href={googleCalendarUrl(b, name)}
                  target="_blank"
                  rel="noopener"
                  className="block px-4 py-3 text-sm font-semibold hover:bg-paper"
                >
                  Google Agenda
                </a>
                <a
                  href={`/reservation/${b.id}/agenda`}
                  className="block border-t border-line px-4 py-3 text-sm font-semibold hover:bg-paper"
                >
                  iPhone, Outlook (.ics)
                </a>
              </div>
            </details>
          </div>
        </div>

        {b.paymentMethod === "whatsapp" && status === "pending" && (
          <a
            href={teamWaLink(waMessage)}
            target="_blank"
            rel="noopener"
            className="mt-6 flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#1fa855] px-5 text-lg font-bold transition hover:bg-[#178a45]"
          >
            <WhatsAppIcon className="size-6" />
            Payer avec l&apos;équipe sur WhatsApp
          </a>
        )}

        {status !== "cancelled" && status !== "expired" && (
          <section className="mt-10">
            <p className="mb-3 text-center text-sm font-semibold tracking-widest text-white/70 uppercase">
              Ton live commence dans
            </p>
            <Countdown to={b.startsAt} />
            <p className="mt-3 text-center text-sm text-white/80">
              {formatRangeFr(start, b.durationMinutes)} heure de Lomé
              <LocalTime start={b.startsAt} end={end.toISOString()} />
            </p>
          </section>
        )}

        {/* Gros bouton TikTok */}
        <section className="mt-12 text-center">
          <p className="font-display text-2xl font-extrabold">En attendant ton live…</p>
          <p className="mt-1 text-white/75">Rejoins la communauté qui va te découvrir.</p>
          <a
            href={site.tiktokUrl}
            target="_blank"
            rel="noopener"
            className="group relative mt-6 flex min-h-20 animate-wiggle items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#25f4ee] via-[#fe2c55] to-[#fe2c55] p-[3px] shadow-2xl shadow-[#fe2c55]/30"
          >
            <span className="flex size-full min-h-[4.6rem] items-center justify-center gap-4 rounded-[1.35rem] bg-black px-6">
              <TikTokIcon className="size-8" />
              <span className="text-left">
                <span className="block text-lg leading-tight font-extrabold">
                  Abonne-toi à House of Challenge
                </span>
                <span className="block text-sm text-white/70">{site.tiktokHandle} sur TikTok</span>
              </span>
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </a>
        </section>

        <p className="mt-12 text-center text-sm text-white/60">
          Une question ?{" "}
          <a
            href={teamWaLink(`Bonjour, j'ai une question sur ma réservation ${b.code}.`)}
            className="font-semibold text-white underline underline-offset-4"
          >
            Écris-nous sur WhatsApp
          </a>
        </p>
      </div>
    </main>
  );
}

export default function ReservationPage(props: PageProps<"/reservation/[id]">) {
  return (
    <Suspense fallback={<main className="flex-1 bg-night-950" />}>
      <Confirmation {...props} />
    </Suspense>
  );
}
