"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { inputClass, PrimaryButton } from "@/components/booking/ui";
import { login } from "./actions";

export function LoginForm({ demo }: { demo: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <main className="flex flex-1 items-center justify-center bg-coal-950 px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <OcdLiveLogo layout="stacked" className="w-44" />
        </Link>
        <form action={action} className="rounded-3xl bg-white p-7">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-coal-900 text-white">
            <Lock className="size-5" aria-hidden />
          </div>
          <h1 className="mt-4 text-center font-display text-2xl font-extrabold text-coal-900">
            Espace Bovann
          </h1>
          <p className="mt-1 text-center text-sm text-muted">
            Réservé à l&apos;équipe Bovann Group.
          </p>
          {/* Identifiant fixe, caché : aide les gestionnaires de mots de passe */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value="bovann"
            readOnly
            hidden
          />
          <label
            htmlFor="password"
            className="mt-6 mb-1.5 block text-sm font-semibold text-coal-900"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={state?.error ? true : undefined}
            className={inputClass}
          />
          {state?.error && <p className="mt-2 text-sm font-semibold text-danger">{state.error}</p>}
          <PrimaryButton type="submit" loading={pending} className="mt-5">
            Entrer
          </PrimaryButton>
          {demo && (
            <p className="mt-5 rounded-xl bg-paper p-3 text-center text-xs text-muted">
              Mode démo : mot de passe{" "}
              <strong className="font-mono text-coal-900">bovann2026</strong>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
