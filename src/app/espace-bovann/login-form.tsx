"use client";

import { ArrowLeft, BarChart3, BellRing, CalendarDays, Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { inputClass } from "@/components/booking/ui";
import { cn } from "@/lib/utils";
import { login } from "./actions";

const FEATURES = [
  { Icon: BellRing, text: "Chaque réservation notifiée par email, avec tout le formulaire" },
  { Icon: CalendarDays, text: "Le planning des lives, jour par jour" },
  { Icon: BarChart3, text: "Chiffre d'affaires, packages et pays en un coup d'œil" },
];

/** Écran de connexion : visuel OCD Live à gauche, formulaire à droite. */
export function LoginForm({ demo }: { demo: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);

  return (
    <main className="grid flex-1 bg-white lg:grid-cols-[1.1fr_1fr]">
      {/* Panneau visuel (ordinateur) */}
      <div className="relative isolate hidden overflow-hidden bg-night-950 p-10 text-white lg:flex lg:flex-col">
        <Image
          src="/hero/ocd-live-studio.jpg"
          alt=""
          fill
          sizes="55vw"
          className="-z-20 object-cover opacity-60"
          style={{ objectPosition: "62% 50%" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950 via-night-950/70 to-night-950/30"
        />
        <OcdLiveLogo layout="stacked" className="w-28" />
        <div className="mt-auto max-w-md">
          <p className="text-xs font-semibold tracking-[0.25em] text-white/70 uppercase">
            Espace Bovann
          </p>
          <h2 className="mt-3 font-heading text-4xl leading-tight font-semibold">
            Tous les lives d&apos;OCD Live, au même endroit.
          </h2>
          <ul className="mt-8 space-y-3">
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden" aria-label="OCD Live, accueil">
            <OcdLiveLogo tone="dark" className="text-2xl" />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-night-900"
          >
            <ArrowLeft className="size-4" aria-hidden /> Retour au site
          </Link>
        </div>

        <form action={action} className="mx-auto my-auto w-full max-w-sm py-12">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-night-900 text-white">
            <Lock className="size-5" aria-hidden />
          </span>
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-night-900">
            Bon retour 👋
          </h1>
          <p className="mt-2 text-muted">Connecte-toi pour gérer les réservations OCD Live.</p>

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
            className="mt-8 mb-1.5 block text-sm font-semibold text-night-900"
          >
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              aria-invalid={state?.error ? true : undefined}
              aria-describedby={state?.error ? "password-error" : undefined}
              className={cn(inputClass, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute inset-y-0 right-1 flex w-11 items-center justify-center text-muted hover:text-night-900"
            >
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          {state?.error && (
            <p id="password-error" className="mt-2 text-sm font-semibold text-danger">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-night-900 px-6 font-bold text-white shadow-lg shadow-night-900/20 transition hover:bg-night-800 disabled:opacity-60"
          >
            {pending && (
              <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Entrer
          </button>

          {demo && (
            <p className="mt-6 rounded-xl border border-dashed border-line p-3 text-center text-xs text-muted">
              Mode démo : mot de passe{" "}
              <strong className="font-mono text-night-900">bovann2026</strong>
            </p>
          )}
        </form>

        <p className="text-center text-xs text-muted">© 2026 Bovann Group SAS · Lomé, Togo</p>
      </div>
    </main>
  );
}
