"use client";

import { packages } from "@/config/site";
import { PackageCard } from "@/components/package-card";
import { duration } from "@/lib/format";
import { packageName } from "@/lib/packages";
import { cn } from "@/lib/utils";
import { StepTitle } from "./ui";

export function StepPackage({
  dayLabel,
  monthKey,
  slots,
  packRemaining,
  selected,
  suggested,
  onPick,
}: {
  dayLabel: string;
  monthKey: string;
  slots: Record<string, string[]> | undefined;
  packRemaining: number | null;
  selected?: string;
  suggested?: string;
  onPick: (id: string) => void;
}) {
  const groups = [
    { title: "Les lives", items: packages.filter((p) => p.tier === "live") },
    {
      title: "Avec Bovann",
      items: packages.filter((p) => p.tier === "bovann" || p.tier === "vip"),
    },
    { title: "Offre limitée", items: packages.filter((p) => p.tier === "monthly") },
  ];

  return (
    <div>
      <StepTitle
        title="Choisis ton package"
        subtitle={<>Pour le {dayLabel}. Même prix en présentiel et à distance.</>}
      />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 text-xs font-bold tracking-[0.18em] text-muted uppercase">
              {g.title}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {g.items.map((p) => {
                const noSlot = slots ? (slots[p.id]?.length ?? 0) === 0 : false;
                const soldOut = p.tier === "monthly" && packRemaining === 0;
                const disabled = !slots || noSlot || soldOut;
                const isSel = selected === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(p.id)}
                    aria-pressed={isSel}
                    className={cn(
                      "group rounded-3xl text-left transition disabled:cursor-not-allowed",
                      !disabled && "hover:-translate-y-0.5",
                      !slots && "animate-pulse",
                    )}
                  >
                    <PackageCard
                      pkg={p}
                      compact
                      name={packageName(p, monthKey)}
                      selected={isSel}
                      disabled={disabled}
                      className={cn(
                        "border border-line md:my-0! md:py-5!",
                        p.tier === "live" && !p.badge && "ring-0",
                        suggested === p.id && !isSel && !disabled && "ring-2 ring-coal-700/40",
                      )}
                      note={
                        soldOut ? (
                          <span className="font-semibold text-live-600">Complet ce mois-ci</span>
                        ) : noSlot ? (
                          <span className="font-semibold">
                            Plus de créneau de {duration(p.durationMinutes)} ce jour-là
                          </span>
                        ) : p.tier === "monthly" && packRemaining !== null ? (
                          <span className="inline-flex rounded-full bg-live-600 px-2.5 py-0.5 text-xs font-bold text-white">
                            Plus que {packRemaining} place{packRemaining > 1 ? "s" : ""}
                          </span>
                        ) : null
                      }
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
