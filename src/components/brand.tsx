import { cn } from "@/lib/utils";

/** Logo OCD LIVE : wordmark + pastille rouge « LIVE » avec point qui pulse. */
export function OcdLiveLogo({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-display text-2xl leading-none font-extrabold tracking-tight",
        tone === "light" ? "text-white" : "text-night-900",
        className,
      )}
      aria-label="OCD LIVE"
    >
      <span aria-hidden>OCD</span>
      <span
        aria-hidden
        className="inline-flex items-center gap-1.5 rounded-md bg-live px-2 py-1 text-[0.72em] tracking-wide text-white"
      >
        <span className="size-[0.42em] animate-live-pulse rounded-full bg-white" />
        LIVE
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
        "inline-flex items-center gap-2 rounded-full bg-live px-3 py-1 text-xs font-bold tracking-[0.14em] text-white",
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
