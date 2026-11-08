import { Check, Crown, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { LivePackage } from "@/config/site";
import { duration, fcfa, hourlyRate, number } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  pkg: LivePackage;
  /** Nom à afficher (ex. « Pack du mois · Spécial Fêtes »). */
  name?: string;
  selected?: boolean;
  disabled?: boolean;
  note?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function PackageCard({
  pkg,
  name,
  selected,
  disabled,
  note,
  footer,
  compact,
  className,
}: Props) {
  const vip = pkg.tier === "vip";
  const bovann = pkg.tier === "bovann";
  const dark = vip || bovann;
  const featured = Boolean(pkg.badge) && pkg.tier === "live";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl p-6 text-left transition",
        dark ? "text-white" : "bg-white text-ink",
        bovann && "bg-night-700",
        vip && "bg-night-950 ring-1 ring-gold/70",
        featured && "ring-2 ring-live md:-my-3 md:py-9",
        selected && "shadow-2xl ring-4! shadow-live/20 ring-live!",
        disabled && "opacity-45 grayscale",
        compact && "p-5",
        className,
      )}
    >
      {pkg.badge && (
        <span
          className={cn(
            "absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wide",
            vip
              ? "bg-gradient-to-r from-gold-300 to-gold text-night-950"
              : "bg-live-600 text-white",
          )}
        >
          {vip ? (
            <Crown className="size-3.5" aria-hidden />
          ) : (
            <Sparkles className="size-3.5" aria-hidden />
          )}
          {pkg.badge}
        </span>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={cn(
            "font-display text-xl font-bold",
            vip && "bg-gradient-to-r from-gold-300 to-gold bg-clip-text text-transparent",
          )}
        >
          {name ?? pkg.name}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            dark ? "bg-white/10 text-white/90" : "bg-paper text-night-800",
          )}
        >
          {duration(pkg.durationMinutes)}
        </span>
      </div>
      <p className={cn("mt-1 text-sm", dark ? "text-white/70" : "text-muted")}>{pkg.pitch}</p>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-4xl font-extrabold tracking-tight">
          {number(pkg.price)}
        </span>
        <span className={cn("text-sm font-semibold", dark ? "text-white/70" : "text-muted")}>
          FCFA
        </span>
        {pkg.compareAtPrice && (
          <s className={cn("text-base", dark ? "text-white/50" : "text-muted")}>
            {fcfa(pkg.compareAtPrice)}
          </s>
        )}
      </div>
      {pkg.showHourlyRate && (
        <p
          className={cn(
            "mt-1 text-sm font-semibold",
            featured || pkg.compareAtPrice ? "text-live-600" : "text-muted",
          )}
        >
          soit {fcfa(hourlyRate(pkg.price, pkg.durationMinutes))}/h
        </p>
      )}

      {!compact && (
        <ul className="mt-5 space-y-2.5 text-sm">
          {pkg.features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <Check
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  vip ? "text-gold" : dark ? "text-white" : "text-live",
                )}
                aria-hidden
              />
              {f}
            </li>
          ))}
        </ul>
      )}
      {compact && (
        <p className={cn("mt-3 text-sm", dark ? "text-white/80" : "text-muted")}>
          {pkg.features.join(" · ")}
        </p>
      )}

      {note && <div className="mt-4 text-sm">{note}</div>}
      {footer && <div className="mt-auto pt-6">{footer}</div>}
    </div>
  );
}
