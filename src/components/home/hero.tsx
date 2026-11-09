"use client";

import { ArrowRight, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { LiveModal } from "./live-modal";

/**
 * Hero « grande photo + titre », joyeux.
 * À gauche : le titre et les deux choix. À droite : une grande photo d'entrepreneur
 * (elle change doucement), un badge EN DIRECT et des réactions qui montent comme
 * dans un live TikTok. Photos : Unsplash (licence libre).
 */
const NAV = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#packages", label: "Packages" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

const PHOTOS = [
  { src: "/hero/live/commercante.jpg", label: "Commerce" },
  { src: "/hero/live/vendeur.jpg", label: "Fruits & légumes" },
  { src: "/hero/live/couturiere.jpg", label: "Mode & pagne" },
  { src: "/hero/live/marche.jpg", label: "Marché" },
];

/** Réactions qui montent sur la photo, l'une après l'autre. */
const REACTIONS = ["😍 Trop beau !", "🛒 Je commande", "🔥 Ça c'est du live", "❤️ ❤️ ❤️"];

const SWITCH_MS = 5000;

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [liveOpen, setLiveOpen] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActive((a) => (a + 1) % PHOTOS.length), SWITCH_MS);
    return () => clearInterval(id);
  }, [reduced, active]);

  return (
    <section className="relative isolate overflow-hidden bg-[#fff7ee] text-night-950">
      {/* Soleil orange, très doux */}
      <div
        aria-hidden
        className="absolute -top-48 -left-48 -z-10 size-[40rem] rounded-full bg-live/12 blur-3xl"
      />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="OCD Live, accueil">
          <OcdLiveLogo tone="dark" className="text-xl sm:text-2xl" />
        </Link>
        <nav aria-label="Menu principal" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-night-800 transition hover:text-live-600"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <Link
          href="/reserver"
          className="rounded-full bg-night-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-live hover:text-night-950"
        >
          Réserver
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pt-8 pb-16 sm:px-8 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-4 lg:pb-12">
        {/* Texte */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-night-800 shadow-sm">
            <span className="size-2 animate-live-pulse rounded-full bg-live" />
            Live TikTok · House of Challenge
          </p>

          <h1 className="mt-6 font-display text-[2.8rem] leading-[1] font-extrabold tracking-[-0.035em] sm:text-6xl xl:text-[4.6rem]">
            Ton business{" "}
            <span className="relative inline-block whitespace-nowrap text-live">
              en live
              <svg
                aria-hidden
                viewBox="0 0 300 24"
                preserveAspectRatio="none"
                className="squiggle absolute -bottom-2 left-0 h-[0.22em] w-full"
              >
                <path
                  d="M4 16 C 60 4, 110 22, 160 12 S 250 6, 296 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  pathLength={1}
                />
              </svg>
            </span>
            , devant toute{" "}
            <span className="whitespace-nowrap">
              l&apos;Afrique
              <span
                className="ml-[0.12em] inline-block origin-bottom animate-wiggle text-[0.8em]"
                aria-hidden
              >
                🌍
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-night-800 sm:text-lg">
            Réserve ton passage sur le TikTok de <strong>House of Challenge</strong> et montre tes
            produits à des milliers d&apos;acheteurs. Rien à payer en ligne : l&apos;équipe Bovann
            Group te confirme tout sur WhatsApp.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/reserver?mode=presentiel"
              className="group flex min-h-14 items-center justify-between gap-4 rounded-full bg-live py-2 pr-2 pl-6 font-bold whitespace-nowrap text-night-950 shadow-[0_12px_30px_-12px] shadow-live transition hover:-translate-y-0.5"
            >
              🎥 Au studio, à Lomé
              <span className="flex size-10 items-center justify-center rounded-full bg-night-950 text-white transition group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
            <Link
              href="/reserver?mode=distance"
              className="group flex min-h-14 items-center justify-between gap-4 rounded-full bg-night-950 py-2 pr-2 pl-6 font-bold whitespace-nowrap text-white transition hover:-translate-y-0.5"
            >
              🌍 Depuis chez toi
              <span className="flex size-10 items-center justify-center rounded-full bg-live text-night-950 transition group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setLiveOpen(true)}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-night-800 transition hover:text-live-600"
          >
            <Camera className="size-4 text-live-600" aria-hidden />
            <span className="underline decoration-live/40 underline-offset-4">
              Essaie : passe en live avec ta caméra
            </span>
          </button>
        </div>

        {/* Grande photo */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative">
            {/* Bloc orange décalé derrière la photo */}
            <div
              aria-hidden
              className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2.5rem] bg-live sm:translate-x-6 sm:translate-y-6"
            />
            <div className="relative aspect-[5/6] overflow-hidden rounded-[2.5rem] bg-night-900 lg:aspect-auto lg:h-[min(70svh,40rem)]">
              {PHOTOS.map((p, i) => (
                <Image
                  key={p.src}
                  src={p.src}
                  alt={i === active ? `Entrepreneur en live · ${p.label}` : ""}
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  preload={i === 0}
                  className={cn(
                    "object-cover transition-opacity duration-1000",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10"
              />

              {/* Badge EN DIRECT */}
              <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-live-600 px-3 py-1.5 text-xs font-bold tracking-wider text-white shadow-lg">
                <span className="size-2 animate-pulse rounded-full bg-white" />
                EN DIRECT
              </span>

              {/* Secteur de la photo en cours */}
              <span
                key={active}
                className="absolute top-5 right-5 animate-rise rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-night-900"
              >
                {PHOTOS[active]!.label}
              </span>

              {/* Réactions qui montent */}
              <ul aria-hidden className="absolute bottom-5 left-5 flex flex-col items-start gap-2">
                {REACTIONS.map((r, i) => (
                  <li
                    key={r}
                    className="reaction rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-night-950 shadow-lg"
                    style={{ animationDelay: `${i * 1.1}s` }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Points de la galerie */}
          <div
            className="mt-8 flex justify-center gap-2 sm:mt-10"
            role="tablist"
            aria-label="Photos"
          >
            {PHOTOS.map((p, i) => (
              <button
                key={p.src}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Photo ${i + 1} : ${p.label}`}
                onClick={() => setActive(i)}
                className="flex h-8 items-center"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-all duration-500",
                    i === active ? "w-8 bg-night-950" : "w-2 bg-night-950/25",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {liveOpen && <LiveModal onClose={() => setLiveOpen(false)} />}
    </section>
  );
}
