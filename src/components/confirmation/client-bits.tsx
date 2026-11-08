"use client";

import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTimeZone } from "@/components/booking/ui";
import { formatHourFr, formatHourInZone, zoneCity } from "@/lib/time";

/** Pluie de confettis aux couleurs OCD Live (une seule fois par réservation). */
export function Confetti({ id }: { id: string }) {
  useEffect(() => {
    const key = `ocd-confetti-${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const colors = ["#dc0c15", "#ffffff", "#d9ad4f", "#4a6a85"];
    const fire = (x: number, angle: number) =>
      confetti({
        particleCount: 70,
        angle,
        spread: 65,
        origin: { x, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
    fire(0, 60);
    fire(1, 120);
    const t = setTimeout(
      () =>
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.35 },
          colors,
          disableForReducedMotion: true,
        }),
      450,
    );
    return () => clearTimeout(t);
  }, [id]);
  return null;
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    j: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/** Compte à rebours jusqu'au live. */
export function Countdown({ to }: { to: string }) {
  const target = Date.parse(to);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'heure n'est connue qu'au navigateur
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const p = parts(now === null ? 0 : target - now);
  const live = now !== null && now >= target;
  if (live)
    return (
      <p className="font-display text-2xl font-bold text-white">
        C&apos;est l&apos;heure de ton live&nbsp;!
      </p>
    );
  const units = [
    ["j", p.j],
    ["h", p.h],
    ["min", p.min],
    ["s", p.s],
  ] as const;
  return (
    <div className="grid grid-cols-4 gap-2" aria-live="off">
      {units.map(([u, v]) => (
        <div key={u} className="rounded-2xl bg-white/10 py-3 text-center">
          <p className="font-display text-3xl font-extrabold text-white tabular-nums sm:text-4xl">
            {now === null ? "–" : String(v).padStart(2, "0")}
          </p>
          <p className="text-xs text-white/70">
            {u === "j" ? "jours" : u === "h" ? "heures" : u === "min" ? "minutes" : "secondes"}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Tant que la réservation n'est pas confirmée, la page se met à jour toute seule. */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}

/** Heure locale du client sous l'heure de Lomé. */
export function LocalTime({ start, end }: { start: string; end: string }) {
  const tz = useTimeZone();
  const s = new Date(start);
  if (formatHourInZone(s, tz) === formatHourFr(s)) return null;
  return (
    <span className="block text-sm font-normal text-white/70">
      {formatHourInZone(s, tz)}–{formatHourInZone(new Date(end), tz)} chez toi ({zoneCity(tz)})
    </span>
  );
}
