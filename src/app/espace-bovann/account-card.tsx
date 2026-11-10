"use client";

import { ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { inputClass } from "@/components/booking/ui";
import { cn } from "@/lib/utils";
import { updateCredentials } from "./actions";

function Field({
  id,
  label,
  type = "password",
  autoComplete,
  defaultValue,
  required,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={`acc-${id}`} className="mb-1.5 block text-sm font-semibold text-night-900">
        {label}
      </label>
      <input
        id={`acc-${id}`}
        name={id}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/**
 * Réglages → Compte administrateur : changer l'email de connexion et/ou le mot de passe.
 * Le mot de passe actuel est toujours demandé ; changer d'identifiants déconnecte les
 * autres appareils, et l'ancienne adresse reçoit une alerte si l'email change.
 */
export function AccountCard({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updateCredentials, undefined);
  return (
    <form action={action} className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-night-900">
        <ShieldCheck className="size-5 text-live-600" aria-hidden /> Compte administrateur
      </h3>
      <p className="mt-1 text-sm text-muted">
        Adresse et mot de passe de connexion à l&apos;Espace Bovann. Le mot de passe n&apos;est
        jamais conservé tel quel : seule son empreinte chiffrée est enregistrée.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            id="email"
            label="Adresse email de connexion"
            type="email"
            autoComplete="username"
            defaultValue={email}
            required
            hint="Elle reçoit les codes de réinitialisation du mot de passe."
          />
        </div>
        <Field
          id="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          hint="Laisse vide pour le garder. 10 caractères min., lettres et chiffres."
        />
        <Field id="confirm" label="Confirme le nouveau" autoComplete="new-password" />
        <div className="sm:col-span-2">
          <Field
            id="current"
            label="Mot de passe actuel (obligatoire)"
            autoComplete="current-password"
            required
          />
        </div>
      </div>
      {(state?.error || state?.info) && (
        <p
          role="status"
          className={cn(
            "mt-3 text-sm font-semibold",
            state.error ? "text-danger" : "text-emerald-700",
          )}
        >
          {state.error ?? state.info}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex min-h-11 items-center gap-2 rounded-xl bg-night-900 px-5 text-sm font-bold text-white transition hover:bg-night-800 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Mettre à jour"}
      </button>
    </form>
  );
}
