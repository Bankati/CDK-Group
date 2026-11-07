"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { schedule } from "@/config/site";
import type { DayState } from "@/lib/availability";
import { addMonths, daysInMonth, monthLabel } from "@/lib/time";
import { cn } from "@/lib/utils";
import { StepTitle } from "./ui";

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];
export const FIRST_MONTH = schedule.firstDay.slice(0, 7);
export const LAST_MONTH = addMonths(FIRST_MONTH, schedule.monthsAhead - 1);

export function StepDate({
  monthKey,
  days,
  selected,
  onMonth,
  onPick,
}: {
  monthKey: string;
  days: Record<string, DayState> | undefined;
  selected?: string;
  onMonth: (m: string) => void;
  onPick: (dateKey: string) => void;
}) {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // lundi = 0
  const total = daysInMonth(monthKey);
  const canPrev = monthKey > FIRST_MONTH;
  const canNext = monthKey < LAST_MONTH;

  return (
    <div>
      <StepTitle
        title="Choisis ta date"
        subtitle="Les jours grisés sont complets ou indisponibles."
      />

      <div className="rounded-3xl border border-line bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onMonth(addMonths(monthKey, -1))}
            disabled={!canPrev}
            aria-label="Mois précédent"
            className="flex size-11 items-center justify-center rounded-full transition hover:bg-paper disabled:opacity-25"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p
            className="font-display text-lg font-bold text-night-900 capitalize"
            aria-live="polite"
          >
            {monthLabel(monthKey)}
          </p>
          <button
            type="button"
            onClick={() => onMonth(addMonths(monthKey, 1))}
            disabled={!canNext}
            aria-label="Mois suivant"
            className="flex size-11 items-center justify-center rounded-full transition hover:bg-paper disabled:opacity-25"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
          {WEEK.map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => (
            <span key={`x${i}`} />
          ))}
          {Array.from({ length: total }, (_, i) => {
            const key = `${monthKey}-${String(i + 1).padStart(2, "0")}`;
            const state = days?.[key];
            const open = state === "open";
            const isSel = key === selected;
            return (
              <button
                key={key}
                type="button"
                disabled={!open}
                onClick={() => onPick(key)}
                aria-pressed={isSel}
                aria-label={`${i + 1} ${monthLabel(monthKey)}${state === "full" ? ", complet" : !open ? ", indisponible" : ""}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-base font-semibold transition",
                  !days && "animate-pulse bg-paper text-transparent",
                  open && !isSel && "bg-night-800/[0.06] text-night-900 hover:bg-night-800/15",
                  isSel && "bg-live-600 text-white shadow-lg",
                  state === "unavailable" && "text-muted/35",
                  state === "full" && "text-muted/50 line-through",
                )}
              >
                {i + 1}
                {state === "full" && (
                  <span className="absolute bottom-1 text-[9px] font-bold text-live-600 no-underline">
                    complet
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-night-800/10" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-live" /> Ton choix
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-line" /> Complet / indisponible
          </span>
        </div>
      </div>
    </div>
  );
}
