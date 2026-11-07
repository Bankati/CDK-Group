import { cn } from "@/lib/utils";
import { OCD_PATH, OCD_VIEWBOX } from "./ocd-symbol-path";

/** Symbole OCD officiel (vectoriel, orange #EE6B07). */
export function OcdSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox={OCD_VIEWBOX} className={className} aria-hidden focusable="false">
      <path fill="#EE6B07" fillRule="evenodd" d={OCD_PATH} />
    </svg>
  );
}

/**
 * Logo OCD Live.
 * - layout « stacked » : version officielle (symbole, « Live » dessous aligné à droite).
 *   Sa taille se règle par la largeur, ex. className="w-32".
 * - layout « inline » : version compacte pour les barres d'en-tête.
 *   Sa taille se règle par la hauteur du texte, ex. className="text-2xl".
 * - tone : « light » sur fond sombre (Live en blanc), « dark » sur fond clair (Live en noir du logo).
 */
export function OcdLiveLogo({
  className,
  tone = "light",
  layout = "inline",
}: {
  className?: string;
  tone?: "light" | "dark";
  layout?: "inline" | "stacked";
}) {
  const ink = tone === "light" ? "text-white" : "text-logo-ink";

  if (layout === "stacked") {
    return (
      <span
        role="img"
        aria-label="OCD Live"
        className={cn("[container-type:inline-size] inline-flex flex-col items-end", className)}
      >
        <OcdSymbol className="block h-auto w-full" />
        <span
          aria-hidden
          className={cn(
            "block pr-[3cqw] font-display text-[24cqw] leading-[0.95] font-bold tracking-[-0.01em]",
            ink,
          )}
          style={{ marginTop: "1.5cqw" }}
        >
          Live
        </span>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="OCD Live"
      className={cn("inline-flex items-center gap-[0.35em] text-2xl leading-none", className)}
    >
      <OcdSymbol className="block h-[1.05em] w-auto" />
      <span aria-hidden className={cn("font-display text-[0.92em] font-bold", ink)}>
        Live
      </span>
    </span>
  );
}

/** Badge « EN DIRECT » qui pulse. */
export function LiveBadge({
  className,
  label = "EN DIRECT",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-live-600 px-3 py-1 text-xs font-bold tracking-[0.14em] text-white",
        className,
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      {label}
    </span>
  );
}
