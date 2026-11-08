import { CalendarDays, Clock, Globe2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { duration, fcfa } from "@/lib/format";
import { getPackage } from "@/lib/packages";

/** Section « image + texte » : l'affiche de lancement à gauche, le message à droite. */
export function Launch() {
  const classique = getPackage("classique")!;
  return (
    <section className="bg-white">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-14 md:py-24">
        <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-md">
          <div
            aria-hidden
            className="absolute -inset-3 -rotate-3 rounded-[2rem] bg-night-900 md:-inset-4"
          />
          <Image
            src="/hero/affiche-lancement.jpg"
            alt="Affiche OCD Live : ton business en live, lancement le mardi 1er décembre 2026, 1h30 de live pour 15 000 FCFA, en présentiel au Togo ou à distance"
            width={1080}
            height={1350}
            sizes="(min-width: 768px) 28rem, 100vw"
            className="relative h-auto w-full rounded-3xl shadow-2xl"
          />
        </div>

        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-live-600 uppercase">
            Réservations ouvertes
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-night-900 sm:text-4xl">
            <span className="text-live">Lancement</span> le 1er&nbsp;décembre
          </h2>
          <p className="mt-4 max-w-lg leading-relaxed text-muted">
            Les premiers lives OCD Live passent sur la page TikTok de House of Challenge dès le
            mardi 1er décembre 2026. Réserve ta place maintenant, les créneaux partent vite.
          </p>
          <ul className="mt-6 space-y-3 text-night-900">
            <li className="flex items-center gap-3">
              <CalendarDays className="size-5 shrink-0 text-live" aria-hidden />
              <span>
                Premier live le <strong>mardi 1er décembre 2026</strong>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="size-5 shrink-0 text-live" aria-hidden />
              <span>
                <strong>{duration(classique.durationMinutes)} de live</strong> pour{" "}
                {fcfa(classique.price)}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Globe2 className="size-5 shrink-0 text-live" aria-hidden />
              <span>En présentiel au Togo ou à distance</span>
            </li>
          </ul>
          <Link
            href="/reserver"
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-live px-8 text-lg font-bold text-white shadow-lg shadow-live/25 transition hover:bg-live-700 active:scale-[0.98]"
          >
            Réserver ma place
          </Link>
        </div>
      </div>
    </section>
  );
}
