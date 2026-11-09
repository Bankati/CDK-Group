"use client";

import { Globe2 } from "lucide-react";
import type { BookingMode } from "@/lib/types";
import {
  addMinutes,
  dateKeyOf,
  dayInZone,
  formatHourFr,
  formatHourInZone,
  toDate,
  zoneCity,
  zoneOffsetMinutes,
} from "@/lib/time";
import { cn } from "@/lib/utils";
import { StepTitle, useTimeZone } from "./ui";

function gmtLabel(offset: number) {
  if (offset === 0) return "GMT";
  const h = Math.floor(Math.abs(offset) / 60);
  const m = Math.abs(offset) % 60;
  return `GMT${offset > 0 ? "+" : "−"}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

export function StepTime({
  date,
  dayLabel,
  durationMinutes,
  starts,
  mode,
  selected,
  onPick,
  onChangeDate,
}: {
  date: string;
  dayLabel: string;
  durationMinutes: number;
  starts: string[] | undefined;
  mode: BookingMode;
  selected?: string;
  onPick: (t: string) => void;
  onChangeDate: () => void;
}) {
  const tz = useTimeZone();
  const sample = toDate(date, "12:00");
  const offset = zoneOffsetMinutes(sample, tz);
  const showLocal = mode === "distance" && offset !== 0;

  return (
    <div>
      <StepTitle
        title="À quelle heure ?"
        subtitle={<>Le {dayLabel}. Seuls les créneaux où toute la durée est libre sont proposés.</>}
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-night-900 p-4 text-sm text-white">
        <Globe2 className="mt-0.5 size-5 shrink-0 text-white/70" aria-hidden />
        <p>
          Heures de <strong>Lomé (GMT)</strong>.
          {showLocal && (
            <>
              {" "}
              Ton heure locale ({zoneCity(tz)}, {gmtLabel(offset)}) est indiquée en dessous.
            </>
          )}
        </p>
      </div>

      {starts && starts.length === 0 && (
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <p className="font-semibold text-night-900">
            Plus aucun créneau libre pour ce package ce jour-là.
          </p>
          <button
            type="button"
            onClick={onChangeDate}
            className="mt-3 font-bold text-live-600 underline underline-offset-4"
          >
            Choisir une autre date
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(starts ?? Array.from({ length: 6 }, () => "")).map((t, i) => {
          if (!t) return <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-paper" />;
          const start = toDate(date, t);
          const end = addMinutes(start, durationMinutes);
          const isSel = selected === t;
          const localDayShift = showLocal && dayInZone(start, tz) !== dateKeyOf(start);
          return (
            <button
              key={t}
              type="button"
              onClick={() => onPick(t)}
              aria-pressed={isSel}
              className={cn(
                "flex min-h-[4.5rem] flex-col items-center justify-center rounded-2xl border px-2 py-2 transition active:scale-[0.98]",
                isSel
                  ? "border-live bg-live text-night-950 shadow-lg"
                  : "border-line bg-white text-night-900 hover:border-night-700",
              )}
            >
              <span className="font-display text-xl font-bold">{formatHourFr(start)}</span>
              <span className={cn("text-xs", isSel ? "text-white/85" : "text-muted")}>
                jusqu&apos;à {formatHourFr(end)}
              </span>
              {showLocal && (
                <span
                  className={cn(
                    "mt-1 text-xs font-semibold",
                    isSel ? "text-white" : "text-night-700",
                  )}
                >
                  {formatHourInZone(start, tz)} chez toi{localDayShift ? " (+1 j)" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
