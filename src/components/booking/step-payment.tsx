"use client";

import { Check, Copy, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { payment, type OperatorId } from "@/config/site";
import { WhatsAppIcon } from "@/components/icons";
import { fcfa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Field, inputClass, PrimaryButton, StepTitle } from "./ui";

export type PaymentForm = { method: OperatorId; reference: string; phone: string };

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text.replace(/\s/g, ""));
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* presse-papiers indisponible : le numéro reste lisible */
        }
      }}
      className="flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-coal-900 hover:bg-paper"
    >
      {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {done ? "Copié" : "Copier"}
    </button>
  );
}

export function StepPayment({
  amount,
  summary,
  value,
  errors,
  onChange,
  onSubmit,
  onWhatsApp,
  showWhatsApp,
  submitting,
  formError,
}: {
  amount: number;
  summary: string;
  value: PaymentForm;
  errors: Partial<Record<"reference" | "phone", string>>;
  onChange: (p: Partial<PaymentForm>) => void;
  onSubmit: () => void;
  onWhatsApp: () => void;
  showWhatsApp: boolean;
  submitting: "manual" | "whatsapp" | null;
  formError?: string;
}) {
  return (
    <div>
      <StepTitle title="Paiement" subtitle={summary} />

      <div className="rounded-3xl bg-coal-900 p-6 text-white">
        <p className="text-sm text-white/70">Montant à payer</p>
        <p className="mt-1 font-display text-4xl font-extrabold">{fcfa(amount)}</p>
        <p className="mt-4 text-sm text-white/80">
          Envoie ce montant depuis ton téléphone à l&apos;un de ces numéros Bovann Group :
        </p>
        <ul className="mt-4 space-y-3">
          {payment.operators.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 pl-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: o.color }}
                  aria-hidden
                />
                <div>
                  <p className="font-bold text-coal-900">
                    {o.label} <span className="text-xs font-normal text-muted">· {o.network}</span>
                  </p>
                  <p className="font-mono text-base tracking-wide text-coal-900">{o.number}</p>
                </div>
              </div>
              <CopyButton text={o.number} />
            </li>
          ))}
        </ul>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <p className="font-display text-lg font-bold text-coal-900">Après ton paiement</p>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-coal-900">
            Avec quel service as-tu payé ?
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {payment.operators.map((o) => (
              <label
                key={o.id}
                className={cn(
                  "flex min-h-13 cursor-pointer items-center justify-center rounded-xl border-2 bg-white px-3 font-bold transition",
                  value.method === o.id ? "border-live text-live-600" : "border-line text-coal-900",
                )}
              >
                <input
                  type="radio"
                  name="method"
                  value={o.id}
                  checked={value.method === o.id}
                  onChange={() => onChange({ method: o.id })}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Numéro qui a payé" htmlFor="payPhone" error={errors.phone}>
          <input
            id="payPhone"
            type="tel"
            inputMode="tel"
            placeholder="+228 90 00 00 00"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            aria-invalid={errors.phone ? true : undefined}
            className={inputClass}
          />
        </Field>

        <Field
          label="Référence de la transaction"
          htmlFor="payRef"
          error={errors.reference}
          hint="Tu la trouves dans le SMS de confirmation reçu après le paiement."
        >
          <input
            id="payRef"
            autoCapitalize="characters"
            autoCorrect="off"
            placeholder="Ex. MX2611184523"
            value={value.reference}
            onChange={(e) => onChange({ reference: e.target.value })}
            aria-invalid={errors.reference ? true : undefined}
            className={cn(inputClass, "font-mono uppercase")}
          />
        </Field>

        {formError && (
          <p role="alert" className="rounded-xl bg-danger-50 p-4 text-sm font-semibold text-danger">
            {formError}
          </p>
        )}

        <PrimaryButton
          type="submit"
          loading={submitting === "manual"}
          disabled={submitting !== null}
        >
          Confirmer ma réservation
        </PrimaryButton>
        <p className="flex items-start gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          Ton créneau est bloqué {payment.holdMinutes} minutes, le temps que Bovann Group vérifie
          ton paiement.
        </p>
      </form>

      {showWhatsApp && (
        <div className="mt-10 rounded-3xl border border-line bg-white p-6">
          <p className="font-display text-lg font-bold text-coal-900">Tu n&apos;es pas au Togo ?</p>
          <p className="mt-1 text-sm text-muted">
            Pas de Flooz ni de Mixx ? L&apos;équipe t&apos;aide à payer depuis ton pays, sur
            WhatsApp.
          </p>
          <button
            type="button"
            onClick={onWhatsApp}
            disabled={submitting !== null}
            className="mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1fa855] px-5 font-bold text-white transition hover:bg-[#178a45] disabled:opacity-60"
          >
            {submitting === "whatsapp" ? (
              <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <WhatsAppIcon className="size-6" />
            )}
            Payer avec l&apos;équipe sur WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
