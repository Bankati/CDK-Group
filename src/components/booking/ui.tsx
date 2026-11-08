"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "border-line text-ink placeholder:text-muted/70 focus:border-night-700 focus:ring-night-700/15 block min-h-13 w-full rounded-xl border bg-white px-4 text-base outline-none transition focus:ring-4 aria-invalid:border-live aria-invalid:ring-live/10";

export function Field({
  label,
  hint,
  error,
  optional,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-night-900"
      >
        {label}
        {optional && <span className="text-xs font-normal text-muted">facultatif</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export function StepTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[1.75rem] leading-tight font-extrabold tracking-tight text-night-900 sm:text-3xl">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-live px-6 text-lg font-bold text-white shadow-lg shadow-live/25 transition hover:bg-live-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {loading && (
        <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}

const noop = () => () => {};

/** Fuseau horaire du visiteur (Lomé pendant le rendu serveur). */
export function useTimeZone() {
  return useSyncExternalStore(
    noop,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lome",
    () => "Africa/Lome",
  );
}
