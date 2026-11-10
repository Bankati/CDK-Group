"use client";

import {
  ArrowLeft,
  BarChart3,
  BellRing,
  CalendarDays,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { inputClass } from "@/components/booking/ui";
import { cn } from "@/lib/utils";
import { login, recoverAccount, requestResetCode, resetPassword, type AuthState } from "./actions";

const FEATURES = [
  { Icon: BellRing, text: "Chaque réservation notifiée par email, avec tout le formulaire" },
  { Icon: CalendarDays, text: "Le planning des lives, jour par jour" },
  { Icon: BarChart3, text: "Chiffre d'affaires, packages et pays en un coup d'œil" },
];

type Mode = "login" | "forgot" | "recover";

const PASSWORD_HINT = "Au moins 10 caractères, avec des lettres et au moins un chiffre.";

/** Champ de mot de passe avec bouton « afficher ». */
function PasswordField({
  id,
  name,
  label,
  autoComplete,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-night-900">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className={cn(inputClass, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Masquer" : "Afficher"}
          className="absolute inset-y-0 right-1 flex w-11 items-center justify-center text-muted hover:text-night-900"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function EmailField({
  defaultValue,
  label = "Adresse email",
}: {
  defaultValue?: string;
  label?: string;
}) {
  return (
    <div className="mt-6">
      <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-night-900">
        {label}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        defaultValue={defaultValue}
        className={inputClass}
      />
    </div>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-night-900 px-6 font-bold text-white shadow-lg shadow-night-900/20 transition hover:bg-night-800 disabled:opacity-60"
    >
      {pending && (
        <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}

function Messages({ state }: { state: AuthState }) {
  return (
    <>
      {state?.info && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          {state.info}
        </p>
      )}
      {state?.error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
    </>
  );
}

function Heading({
  Icon,
  title,
  text,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-night-900 text-white">
        <Icon className="size-5" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-night-900">
        {title}
      </h1>
      <p className="mt-2 text-muted">{text}</p>
    </>
  );
}

function BackLink({ onMode }: { onMode: (m: Mode) => void }) {
  return (
    <button
      type="button"
      onClick={() => onMode("login")}
      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-night-900"
    >
      <ArrowLeft className="size-4" aria-hidden /> Retour à la connexion
    </button>
  );
}

/** Connexion : email + mot de passe. */
function LoginPanel({ onMode }: { onMode: (m: Mode) => void }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action}>
      <Heading
        Icon={Lock}
        title="Bon retour 👋"
        text="Connecte-toi pour gérer les réservations OCD Live."
      />
      <EmailField defaultValue={state?.email} />
      <PasswordField
        id="password"
        name="password"
        label="Mot de passe"
        autoComplete="current-password"
      />
      <Messages state={state} />
      <Submit pending={pending}>Entrer</Submit>
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={() => onMode("forgot")}
          className="font-semibold text-live-600 hover:underline"
        >
          Mot de passe oublié ?
        </button>
        <button
          type="button"
          onClick={() => onMode("recover")}
          className="font-semibold text-muted hover:text-night-900 hover:underline"
        >
          Email oublié ?
        </button>
      </div>
    </form>
  );
}

/** Mot de passe oublié : 1) l'email, 2) le code reçu + le nouveau mot de passe. */
function ForgotPanel({ onMode }: { onMode: (m: Mode) => void }) {
  const [asked, askAction, asking] = useActionState(requestResetCode, undefined);
  const [reset, resetAction, resetting] = useActionState(resetPassword, undefined);
  const email = reset?.email ?? asked?.email;

  if (asked?.step !== "code")
    return (
      <form action={askAction}>
        <Heading
          Icon={KeyRound}
          title="Mot de passe oublié"
          text="Indique l'adresse email du compte : on t'envoie un code à 6 chiffres."
        />
        <EmailField defaultValue={email} />
        <Messages state={asked} />
        <Submit pending={asking}>Recevoir le code</Submit>
        <BackLink onMode={onMode} />
      </form>
    );

  return (
    <div>
      <form action={resetAction}>
        <Heading
          Icon={MailCheck}
          title="Vérifie tes emails"
          text={`Saisis le code reçu à ${email} et choisis ton nouveau mot de passe.`}
        />
        <Messages state={reset ?? asked} />
        <input type="hidden" name="email" value={email ?? ""} />
        <div className="mt-6">
          <label htmlFor="code" className="mb-1.5 block text-sm font-semibold text-night-900">
            Code à 6 chiffres
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="••••••"
            className={cn(inputClass, "text-center font-mono text-2xl tracking-[0.5em]")}
          />
        </div>
        <PasswordField
          id="password"
          name="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
        />
        <PasswordField
          id="confirm"
          name="confirm"
          label="Confirme le mot de passe"
          autoComplete="new-password"
        />
        <Submit pending={resetting}>Changer le mot de passe</Submit>
      </form>
      <form action={askAction} className="mt-4 text-center">
        <input type="hidden" name="email" value={email ?? ""} />
        <button
          type="submit"
          disabled={asking}
          className="text-sm font-semibold text-live-600 hover:underline disabled:opacity-60"
        >
          Renvoyer un code
        </button>
      </form>
      <BackLink onMode={onMode} />
    </div>
  );
}

/** Email oublié ou première connexion : la clé de secours redéfinit l'email et le mot de passe. */
function RecoverPanel({ onMode, setup }: { onMode: (m: Mode) => void; setup: boolean }) {
  const [state, action, pending] = useActionState(recoverAccount, undefined);
  return (
    <form action={action}>
      <Heading
        Icon={ShieldCheck}
        title={setup ? "Crée le compte administrateur" : "Email oublié"}
        text={
          setup
            ? "Première connexion : saisis la clé de secours, puis choisis l'email et le mot de passe de l'Espace Bovann."
            : "Avec la clé de secours, choisis une nouvelle adresse email et un nouveau mot de passe."
        }
      />
      <PasswordField
        id="key"
        name="key"
        label="Clé de secours"
        autoComplete="off"
        hint="La valeur de ADMIN_PASSWORD, réglée sur le serveur (Vercel ou .env.local)."
      />
      <EmailField defaultValue={state?.email} label="Adresse email du compte" />
      <PasswordField
        id="password"
        name="password"
        label="Mot de passe"
        autoComplete="new-password"
        hint={PASSWORD_HINT}
      />
      <PasswordField
        id="confirm"
        name="confirm"
        label="Confirme le mot de passe"
        autoComplete="new-password"
      />
      <Messages state={state} />
      <Submit pending={pending}>{setup ? "Créer le compte" : "Enregistrer et entrer"}</Submit>
      {!setup && <BackLink onMode={onMode} />}
    </form>
  );
}

/** Écran de connexion : visuel OCD Live à gauche, formulaire à droite. */
export function LoginForm({ demo, setup }: { demo: boolean; setup: boolean }) {
  const [mode, setMode] = useState<Mode>(setup ? "recover" : "login");

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

        <div className="mx-auto my-auto w-full max-w-sm py-12">
          {mode === "login" && <LoginPanel onMode={setMode} />}
          {mode === "forgot" && <ForgotPanel onMode={setMode} />}
          {mode === "recover" && <RecoverPanel onMode={setMode} setup={setup} />}

          {demo && (
            <p className="mt-6 rounded-xl border border-dashed border-line p-3 text-center text-xs text-muted">
              Mode démo : clé de secours{" "}
              <strong className="font-mono text-night-900">bovann2026</strong>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted">© 2026 Bovann Group SAS · Lomé, Togo</p>
      </div>
    </main>
  );
}
