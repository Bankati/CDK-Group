"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDay, fetchMonth, submitBooking } from "@/app/reserver/actions";
import { OcdLiveLogo } from "@/components/brand";
import { payment } from "@/config/site";
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
import { StepPayment, type PaymentForm } from "./step-payment";
import { StepTime } from "./step-time";
import { PrimaryButton, StepTitle, useTimeZone } from "./ui";

const STEPS = ["Mode", "Date", "Package", "Heure", "Infos", "Paiement"] as const;
const STORAGE_KEY = "ocd-live-reservation";

type State = {
  step: number; // 0..5
  mode?: BookingMode;
  date?: string;
  packageId?: string;
  time?: string;
  details: Details;
  pay: PaymentForm;
};

const initialPay: PaymentForm = { method: payment.operators[0].id, reference: "", phone: "" };

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
}: {
  initialMode?: BookingMode;
  suggestedPackage?: string;
}) {
  const router = useRouter();
  const tz = useTimeZone();
  const topRef = useRef<HTMLDivElement>(null);

  const [s, setS] = useState<State>({
    step: initialMode ? 1 : 0,
    mode: initialMode,
    details: emptyDetails,
    pay: initialPay,
  });
  const [monthKey, setMonthKey] = useState(FIRST_MONTH);
  const [months, setMonths] = useState<Record<string, Record<string, DayState>>>({});
  const [day, setDay] = useState<{
    date: string;
    slots: Record<string, string[]>;
    packRemaining: number | null;
  }>();
  const [detailErrors, setDetailErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [payErrors, setPayErrors] = useState<Partial<Record<"reference" | "phone", string>>>({});
  const [notice, setNotice] = useState<string>();
  const [submitting, setSubmitting] = useState<"manual" | "whatsapp" | null>(null);
  const [formError, setFormError] = useState<string>();

  // Reprend une réservation commencée (si la page est rechargée), sans écraser le mode choisi depuis l'accueil.
  useEffect(() => {
    const saved = load();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique au montage
    setS((cur) => {
      if (initialMode && saved.mode && saved.mode !== initialMode) return cur;
      return {
        ...cur,
        ...saved,
        details: { ...emptyDetails, ...saved.details },
        pay: { ...initialPay, ...saved.pay },
      };
    });
    if (saved.date) setMonthKey(saved.date.slice(0, 7));
  }, [initialMode]);

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

  async function submit(method: "manual" | "whatsapp") {
    setFormError(undefined);
    if (method === "manual") {
      const errs: typeof payErrors = {};
      if (!/^\+?[0-9 ]{8,20}$/.test(s.pay.phone.trim())) errs.phone = "Saisis le numéro qui a payé";
      if (s.pay.reference.trim().length < 4) errs.reference = "Saisis la référence reçue par SMS";
      setPayErrors(errs);
      if (Object.keys(errs).length) return;
    }
    if (!s.mode || !s.date || !s.time || !pkg) return;
    setSubmitting(method);
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
        paymentMethod: method === "whatsapp" ? "whatsapp" : s.pay.method,
        paymentReference: method === "manual" ? s.pay.reference.trim() : undefined,
        paymentPhone: method === "manual" ? s.pay.phone.trim() : undefined,
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
    setSubmitting(null);
  }

  const step = s.step;

  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <header className="sticky top-0 z-20 bg-night-900 text-white shadow-lg">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-4">
          {step > 0 ? (
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
            Étape <strong className="text-white">{step + 1}</strong>/{STEPS.length} · {STEPS[step]}
          </p>
        </div>
        <div
          className="h-1 bg-white/10"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label="Progression de la réservation"
        >
          <div
            className="h-full bg-live transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <div ref={topRef} className="mx-auto w-full max-w-2xl scroll-mt-20 px-4 pt-5 pb-16">
        {summary.length > 0 && step > 0 && (
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
          {step === 0 && (
            <div>
              <StepTitle
                title="Comment veux-tu passer en live ?"
                subtitle="Même prix dans les deux cas."
              />
              <div className="grid gap-4">
                {(
                  [
                    [
                      "presentiel",
                      "🎥",
                      "En présentiel au Togo",
                      "Tu viens sur le plateau à Lomé, avec tes produits.",
                    ],
                    [
                      "distance",
                      "🌍",
                      "À distance",
                      "Tu rejoins le live depuis ton téléphone, où que tu sois.",
                    ],
                  ] as const
                ).map(([m, icon, title, text]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setS((cur) => ({ ...cur, mode: m }));
                      goTo(1);
                    }}
                    aria-pressed={s.mode === m}
                    className={cn(
                      "flex items-center gap-5 rounded-3xl border-2 bg-white p-6 text-left transition hover:-translate-y-0.5",
                      s.mode === m ? "border-live shadow-xl" : "border-line",
                    )}
                  >
                    <span
                      className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-paper text-3xl"
                      aria-hidden
                    >
                      {icon}
                    </span>
                    <span>
                      <span className="block font-display text-xl font-bold text-night-900">
                        {title}
                      </span>
                      <span className="mt-1 block text-muted">{text}</span>
                    </span>
                  </button>
                ))}
              </div>
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
                if (validateDetails()) goTo(5);
              }}
            >
              <StepDetails
                mode={s.mode ?? "presentiel"}
                value={s.details}
                errors={detailErrors}
                onChange={(patch) =>
                  setS((cur) => ({ ...cur, details: { ...cur.details, ...patch } }))
                }
              />
              <PrimaryButton type="submit" className="mt-8">
                Continuer vers le paiement
              </PrimaryButton>
            </form>
          )}

          {step === 5 && pkg && s.date && s.time && (
            <StepPayment
              amount={pkg.price}
              summary={`${packageName(pkg, s.date.slice(0, 7))} · ${dayLabel}, ${formatRangeFr(toDate(s.date, s.time), pkg.durationMinutes)} (heure de Lomé)`}
              value={s.pay}
              errors={payErrors}
              onChange={(p) => setS((cur) => ({ ...cur, pay: { ...cur.pay, ...p } }))}
              onSubmit={() => submit("manual")}
              onWhatsApp={() => submit("whatsapp")}
              showWhatsApp={s.mode === "distance" && s.details.country !== "Togo"}
              submitting={submitting}
              formError={formError}
            />
          )}

          {/* Étape incohérente (ex. données effacées) : retour au début du parcours */}
          {((step >= 2 && !s.date) || (step >= 3 && !pkg) || (step >= 5 && !s.time)) && (
            <div className="text-center">
              <p className="text-muted">Il manque une information.</p>
              <button
                type="button"
                className="mt-2 font-bold text-live-600 underline"
                onClick={() => goTo(s.mode ? 1 : 0)}
              >
                Reprendre la réservation
              </button>
            </div>
          )}
        </div>

        {step === 5 && pkg && (
          <p className="mt-6 text-center text-xs text-muted">
            Total : {fcfa(pkg.price)} · aucun frais caché
          </p>
        )}
      </div>
    </div>
  );
}
