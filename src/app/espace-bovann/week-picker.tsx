"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/** Lundi (00:00 UTC = heure de Lomé) de la semaine contenant `t`. */
export function mondayOf(t: number) {
  const d = new Date(t);
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return midnight - ((d.getUTCDay() + 6) % 7) * DAY;
}

const fmt = (t: number, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...o }).format(t);

/** « 2 – 8 nov. 2026 » ou « 30 nov. – 6 déc. 2026 ». */
export function weekLabel(monday: number) {
  const sunday = monday + 6 * DAY;
  const sameMonth = new Date(monday).getUTCMonth() === new Date(sunday).getUTCMonth();
  return sameMonth
    ? `${fmt(monday, { day: "numeric" })} – ${fmt(sunday, { day: "numeric", month: "short", year: "numeric" })}`
    : `${fmt(monday, { day: "numeric", month: "short" })} – ${fmt(sunday, { day: "numeric", month: "short", year: "numeric" })}`;
}

/**
 * Sélecteur de semaine : flèches semaine précédente / suivante + calendrier.
 * Un clic sur n'importe quel jour sélectionne sa semaine (lundi → dimanche).
 */
export function WeekPicker({
  value,
  onChange,
  today,
  marked,
}: {
  /** Lundi de la semaine sélectionnée (timestamp UTC). */
  value: number;
  onChange: (monday: number) => void;
  today: number;
  /** Jours (AAAA-MM-JJ) qui ont des réservations : un point s'affiche dessous. */
  marked?: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date(value);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  });
  const [hoverWeek, setHoverWeek] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const thisWeek = mondayOf(today);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openCalendar() {
    const d = new Date(value);
    setMonth(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    setOpen((o) => !o);
  }

  function shiftMonth(n: number) {
    const d = new Date(month);
    setMonth(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  }

  // 6 semaines affichées, à partir du lundi qui précède le 1er du mois.
  const gridStart = mondayOf(month);
  const weeks = Array.from({ length: 6 }, (_, w) => gridStart + w * 7 * DAY);
  const currentMonth = new Date(month).getUTCMonth();

  const navBtn =
    "flex size-8 items-center justify-center rounded-full text-night-900 transition hover:bg-paper disabled:opacity-30";

  return (
    <div ref={rootRef} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(value - 7 * DAY)}
        aria-label="Semaine précédente"
        className={navBtn}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={openCalendar}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-xs font-semibold whitespace-nowrap text-night-900 transition hover:border-night-700"
      >
        <CalendarDays className="size-4 text-muted" aria-hidden />
        {value === thisWeek ? "Cette semaine" : weekLabel(value)}
      </button>
      <button
        type="button"
        onClick={() => onChange(value + 7 * DAY)}
        aria-label="Semaine suivante"
        className={navBtn}
      >
        <ChevronRight className="size-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choisir une semaine"
          className="absolute top-full right-0 z-30 mt-2 w-[19.5rem] rounded-2xl border border-line bg-white p-4 shadow-2xl"
          style={{ animation: "pop-in 0.18s ease-out both", transformOrigin: "top right" }}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Mois précédent"
              className={navBtn}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-bold text-night-900 first-letter:uppercase">
              {fmt(month, { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Mois suivant"
              className={navBtn}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-1 space-y-1" onPointerLeave={() => setHoverWeek(null)}>
            {weeks.map((w) => {
              const selected = w === value;
              const hovered = w === hoverWeek && !selected;
              return (
                <div
                  key={w}
                  onPointerEnter={() => setHoverWeek(w)}
                  className={cn(
                    "grid grid-cols-7 rounded-xl transition-colors duration-200",
                    selected && "bg-night-900 text-white",
                    hovered && "bg-paper",
                  )}
                >
                  {Array.from({ length: 7 }, (_, i) => {
                    const t = w + i * DAY;
                    const d = new Date(t);
                    const key = d.toISOString().slice(0, 10);
                    const out = d.getUTCMonth() !== currentMonth;
                    const isToday = key === new Date(today).toISOString().slice(0, 10);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          onChange(w);
                          setOpen(false);
                        }}
                        aria-label={`Semaine du ${weekLabel(w)}`}
                        className={cn(
                          "relative flex h-9 flex-col items-center justify-center text-sm tabular-nums",
                          !selected && (out ? "text-muted/50" : "text-night-900"),
                          isToday && !selected && "font-bold text-live-600",
                        )}
                      >
                        {d.getUTCDate()}
                        {marked?.has(key) && (
                          <span
                            className={cn(
                              "absolute bottom-1 size-1 rounded-full",
                              selected ? "bg-white" : "bg-[#2a78d6]",
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="size-1.5 rounded-full bg-[#2a78d6]" /> jour avec réservations
            </span>
            <button
              type="button"
              onClick={() => {
                onChange(thisWeek);
                setOpen(false);
              }}
              className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-night-900 transition hover:bg-line"
            >
              Cette semaine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
