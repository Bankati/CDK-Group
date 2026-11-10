"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDay, fetchMonth, submitBooking } from "@/app/reserver/actions";
import { OcdLiveLogo } from "@/components/brand";
import { booking } from "@/config/site";
import type { DayState } from "@/lib/availability";
import { detailsSchema } from "@/lib/booking-schema";
import { duration, fcfa } from "@/lib/format";
import { getPackage, packageName } from "@/lib/packages";
import { formatDayFr, formatRangeFr, toDate } from "@/lib/time";
import type { BookingMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { emptyDetails, StepDetails, type Details } from "./step-details";
import { FIRST_MONTH, StepDate } from "./step-date";
import { StepPackage } from "./step-package";
import { StepTime } from "./step-time";
import { PrimaryButton, useTimeZone } from "./ui";

const STEPS = ["Date", "Package", "Heure", "Infos"] as const;
const LAST = STEPS.length; // dernière étape interne (Infos = 4)
const STORAGE_KEY = "ocd-live-reservation";

type State = {
  step: number; // 0..4
  mode?: BookingMode;
  date?: string;
  packageId?: string;
  time?: string;
  details: Details;
};

function load(): Partial<State> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<State>) : null;
  } catch {
    return null;
  }
}

export function BookingWizard({
  initialMode,
  suggestedPackage,
  initialBusiness,
}: {
  initialMode?: BookingMode;
  suggestedPackage?: string;
  /** Nom du business tapé dans le hero de l'accueil. */
  initialBusiness?: string;
}) {
  const router = useRouter();
  const tz = useTimeZone();
  const topRef = useRef<HTMLDivElement>(null);
  const prefill = initialBusiness ? { businessName: initialBusiness } : {};

  const [s, setS] = useState<State>({
    step: 1,
    mode: initialMode ?? "presentiel",
    details: { ...emptyDetails, ...prefill },
  });
  const [monthKey, setMonthKey] = useState(FIRST_MONTH);
  const [months, setMonths] = useState<Record<string, Record<string, DayState>>>({});
  const [day, setDay] = useState<{
    date: string;
    slots: Record<string, string[]>;
    packRemaining: number | null;
  }>();
  const [detailErrors, setDetailErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [notice, setNotice] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  // Reprend une réservation commencée (si la page est rechargée), sans écraser le mode choisi depuis l'accueil.
  useEffect(() => {
    const saved = load();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique au montage
    setS((cur) => {
      if (initialMode && saved.mode && saved.mode !== initialMode) return cur;
      // Le mode choisi sur l'accueil est déjà connu : on ne repasse jamais par l'étape « Mode ».
      return {
        ...cur,
        ...saved,
        mode: initialMode ?? saved.mode ?? "presentiel",
        step: Math.max(1, Math.min(saved.step ?? cur.step, LAST)),
        // Le nom tapé dans le hero est prioritaire sur une réservation commencée avant.
        details: {
          ...emptyDetails,
          ...saved.details,
          ...(initialBusiness ? { businessName: initialBusiness } : {}),
        },
      };
    });
    if (saved.date) setMonthKey(saved.date.slice(0, 7));
  }, [initialMode, initialBusiness]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* stockage indisponible (navigation privée) : on continue sans */
    }
  }, [s]);

  const loadMonth = useCallback(async (m: string) => {
    const res = await fetchMonth(m);
    setMonths((cur) => ({ ...cur, [m]: res.days }));
  }, []);

  const loadDay = useCallback(async (date: string) => {
    const res = await fetchDay(date);
    setDay({ date, slots: res.slots, packRemaining: res.packRemaining });
    return res;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement des disponibilités du mois affiché
    if (!months[monthKey]) void loadMonth(monthKey);
  }, [monthKey, months, loadMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- disponibilités du jour choisi
    if (s.date && day?.date !== s.date) void loadDay(s.date);
  }, [s.date, day?.date, loadDay]);

  const goTo = (step: number) => {
    setNotice(undefined);
    setFormError(undefined);
    setS((cur) => ({ ...cur, step }));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };

  const pkg = s.packageId ? getPackage(s.packageId) : undefined;
  const dayLabel = s.date ? formatDayFr(toDate(s.date, "12:00")) : "";

  const summary = [
    s.mode && (s.mode === "presentiel" ? "🎥 Présentiel" : "🌍 À distance"),
    s.date && dayLabel,
    pkg && `${pkg.name} · ${duration(pkg.durationMinutes)}`,
    s.date && s.time && pkg && formatRangeFr(toDate(s.date, s.time), pkg.durationMinutes),
  ].filter(Boolean) as string[];

  function validateDetails() {
    const d = s.details;
    const res = detailsSchema.safeParse({
      ...d,
      whatsapp: `+${d.dial} ${d.phone}`,
      country: s.mode === "presentiel" ? "Togo" : d.country,
      city: s.mode === "presentiel" ? "Lomé" : d.city,
    });
    if (res.success) {
      setDetailErrors({});
      return true;
    }
    const errs: Partial<Record<keyof Details, string>> = {};
    for (const issue of res.error.issues) {
      const k = (issue.path[0] === "whatsapp" ? "phone" : issue.path[0]) as keyof Details;
      errs[k] ??= issue.message;
    }
    setDetailErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) document.getElementById(first)?.focus();
    return false;
  }

  async function submit() {
    setFormError(undefined);
    if (!validateDetails()) return;
    if (!s.mode || !s.date || !s.time || !pkg) return;
    setSubmitting(true);
    const d = s.details;
    try {
      const res = await submitBooking({
        mode: s.mode,
        date: s.date,
        time: s.time,
        packageId: pkg.id,
        fullName: d.fullName,
        whatsapp: `+${d.dial} ${d.phone.trim()}`,
        email: d.email,
        businessName: d.businessName,
        sector: d.sector,
        products: d.products,
        tiktok: d.tiktok || undefined,
        country: s.mode === "presentiel" ? "Togo" : d.country,
        city: s.mode === "presentiel" ? "Lomé" : d.city,
        photo: d.photo,
        clientTimezone: tz,
      });
      if (res.ok) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}
        router.push(`/reservation/${res.id}?nouveau=1`);
        return;
      }
      if (res.reason === "slot_taken") {
        await loadDay(s.date);
        setMonths((cur) => {
          const next = { ...cur };
          delete next[s.date!.slice(0, 7)];
          return next;
        });
        setS((cur) => ({ ...cur, time: undefined, step: 3 }));
        setNotice(res.message);
      } else if (res.reason === "sold_out") {
        await loadDay(s.date);
        setS((cur) => ({ ...cur, packageId: undefined, time: undefined, step: 2 }));
        setNotice(res.message);
      } else {
        setFormError(res.message);
      }
    } catch {
      setFormError("Connexion impossible. Vérifie ton réseau et réessaie.");
    }
    setSubmitting(false);
  }

  const step = s.step;

  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <header className="sticky top-0 z-20 overflow-hidden bg-night-900 text-white shadow-lg">
        {/* Photo d'un marché africain en fond, assombrie pour garder le texte lisible */}
        <Image
          src="/hero/live/marche.jpg"
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-10 object-cover object-[50%_45%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-night-950/90 via-night-950/70 to-night-950/80"
        />
        <div
          aria-hidden
          className="absolute -top-16 left-1/3 -z-10 h-32 w-72 rounded-full bg-live/30 blur-3xl"
        />
        <div className="relative mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              aria-label="Étape précédente"
              className="-ml-2 flex size-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              className="-ml-2 flex size-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <Link href="/" aria-label="OCD Live, accueil">
            <OcdLiveLogo className="text-xl" />
          </Link>
          <p className="ml-auto text-sm text-white/75">
            Étape <strong className="text-white">{step}</strong>/{STEPS.length} · {STEPS[step - 1]}
          </p>
        </div>
        <div
          className="relative h-1 bg-white/10"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step}
          aria-label="Progression de la réservation"
        >
          <div
            className="h-full bg-live transition-all duration-500"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <div ref={topRef} className="mx-auto w-full max-w-2xl scroll-mt-20 px-4 pt-5 pb-16">
        {summary.length > 0 && step > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {summary.map((t) => (
              <span
                key={t}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-night-900"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {notice && (
          <p
            role="alert"
            className="mb-6 rounded-2xl bg-danger-50 p-4 text-sm font-semibold text-danger"
          >
            {notice}
          </p>
        )}

        <div key={step} className="animate-rise">
          {step === 1 && (
            <div
              role="radiogroup"
              aria-label="Mode de passage"
              className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-1"
            >
              {(
                [
                  ["presentiel", "🎥", "En présentiel au Togo"],
                  ["distance", "🌍", "À distance"],
                ] as const
              ).map(([m, icon, label]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={s.mode === m}
                  onClick={() => setS((cur) => ({ ...cur, mode: m }))}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold transition",
                    s.mode === m
                      ? "bg-night-900 text-white shadow"
                      : "text-muted hover:text-night-900",
                  )}
                >
                  <span aria-hidden>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <StepDate
              monthKey={monthKey}
              days={months[monthKey]}
              selected={s.date}
              onMonth={setMonthKey}
              onPick={(date) => {
                setS((cur) => ({ ...cur, date, time: cur.date === date ? cur.time : undefined }));
                goTo(2);
              }}
            />
          )}

          {step === 2 && s.date && (
            <StepPackage
              dayLabel={dayLabel}
              monthKey={s.date.slice(0, 7)}
              slots={day?.date === s.date ? day.slots : undefined}
              packRemaining={day?.date === s.date ? day.packRemaining : null}
              selected={s.packageId}
              suggested={suggestedPackage}
              onPick={(packageId) => {
                setS((cur) => ({
                  ...cur,
                  packageId,
                  time: cur.packageId === packageId ? cur.time : undefined,
                }));
                goTo(3);
              }}
            />
          )}

          {step === 3 && s.date && pkg && (
            <StepTime
              date={s.date}
              dayLabel={dayLabel}
              durationMinutes={pkg.durationMinutes}
              starts={day?.date === s.date ? (day.slots[pkg.id] ?? []) : undefined}
              mode={s.mode ?? "presentiel"}
              selected={s.time}
              onPick={(time) => {
                setS((cur) => ({ ...cur, time }));
                goTo(4);
              }}
              onChangeDate={() => goTo(1)}
            />
          )}

          {step === 4 && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <StepDetails
                mode={s.mode ?? "presentiel"}
                value={s.details}
                errors={detailErrors}
                onChange={(patch) => {
                  setS((cur) => ({ ...cur, details: { ...cur.details, ...patch } }));
                  // L'erreur d'un champ disparaît dès qu'on le corrige.
                  setDetailErrors((errs) => {
                    const next = { ...errs };
                    for (const k of Object.keys(patch) as (keyof Details)[]) delete next[k];
                    if ("dial" in patch) delete next.phone;
                    return next;
                  });
                }}
              />
              {pkg && s.date && s.time && (
                <div className="mt-8 rounded-2xl bg-night-900 p-5 text-white">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm text-white/75">
                      {packageName(pkg, s.date.slice(0, 7))} · {dayLabel},{" "}
                      {formatRangeFr(toDate(s.date, s.time), pkg.durationMinutes)}
                    </p>
                    <p className="shrink-0 font-display text-xl font-bold">{fcfa(pkg.price)}</p>
                  </div>
                  <p className="mt-3 border-t border-white/10 pt-3 text-sm text-white/75">
                    Rien à payer maintenant. L&apos;équipe Bovann Group te contacte sur WhatsApp
                    pour finaliser et confirmer ton live. Ton créneau t&apos;est réservé pendant{" "}
                    {booking.holdHours}&nbsp;h.
                  </p>
                </div>
              )}
              {formError && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-danger-50 p-4 text-sm font-semibold text-danger"
                >
                  {formError}
                </p>
              )}
              <PrimaryButton type="submit" loading={submitting} className="mt-5">
                Réserver mon live
              </PrimaryButton>
            </form>
          )}

          {/* Étape incohérente (ex. données effacées) : retour au début du parcours */}
          {((step >= 2 && !s.date) || (step >= 3 && !pkg) || (step >= 4 && !s.time)) && (
            <div className="text-center">
              <p className="text-muted">Il manque une information.</p>
              <button
                type="button"
                className="mt-2 font-bold text-live-600 underline"
                onClick={() => goTo(1)}
              >
                Reprendre la réservation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
