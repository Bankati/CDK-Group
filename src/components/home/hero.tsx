"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LiveBadge, OcdLiveLogo } from "@/components/brand";
import { cn } from "@/lib/utils";

/**
 * Images du hero (dossier public/hero). Les deux dernières sont temporaires :
 * à remplacer par des visuels OCD Live dans le même style que la première.
 * `position` règle le cadrage (le sujet doit rester visible à droite de la forme).
 */
const slides = [
  {
    image: "/hero/ocd-live-studio.jpg",
    position: "68% 50%",
    kicker: "Live TikTok",
    accent: "Ton business en live",
    title: "devant toute l'Afrique",
    text: "Présente tes produits en direct sur le compte de House of Challenge, depuis Lomé ou depuis chez toi.",
  },
  {
    image: "/hero/working-2.jpg",
    position: "62% 30%",
    kicker: "House of Challenge",
    accent: "Passe en live",
    title: "sur le compte de House of Challenge",
    text: "La web-téléréalité panafricaine de l'entrepreneuriat t'ouvre son direct. Réserve en 3 minutes.",
  },
  {
    image: "/hero/hero-bg.jpg",
    position: "72% 30%",
    kicker: "From Africa to the World",
    accent: "Et si Bovann",
    title: "parlait de toi ?",
    text: "Avec les packages Boost et VIP, Bovann présente lui-même ton business à sa communauté.",
  },
];

const INTERVAL = 6500;

export function Hero() {
  const [{ active, prev }, setState] = useState<{ active: number; prev: number | null }>({
    active: 0,
    prev: null,
  });

  const go = (i: number) => setState((s) => (s.active === i ? s : { active: i, prev: s.active }));

  // Défilement automatique (redémarre après un clic sur un point).
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setState((s) => ({ active: (s.active + 1) % slides.length, prev: s.active }));
    }, INTERVAL);
    return () => clearInterval(id);
  }, [active]);

  const slide = slides[active]!;

  return (
    <section className="bg-night-900 text-white">
      {/* Barre d'en-tête : logo OCD Live officiel à gauche, Bovann Group à droite */}
      <header className="relative z-20 bg-night-900">
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:h-22 sm:px-8">
          <Link href="/" aria-label="OCD Live, accueil">
            <OcdLiveLogo layout="stacked" className="w-[5.5rem] sm:w-28" />
          </Link>
          <a
            href="https://bovanngroup.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/70 transition hover:text-white"
          >
            <span className="hidden sm:inline">une initiative</span>
            <Image
              src="/brand/bovann-group.png"
              alt="Bovann Group"
              width={120}
              height={24}
              className="h-5 w-auto sm:h-6"
            />
          </a>
        </div>
      </header>

      <div className="relative isolate">
        {/* Zone photo : fondu enchaîné + zoom lent */}
        <div className="relative h-[52svh] min-h-[300px] overflow-hidden bg-night-950 md:h-[600px] lg:h-[640px]">
          {slides.map((s, i) => (
            <div
              key={s.image}
              aria-hidden
              className={cn(
                "absolute inset-0 transition-opacity duration-[1400ms] ease-out",
                i === active ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={s.image}
                alt=""
                fill
                sizes="100vw"
                preload={i === 0}
                style={{ objectPosition: s.position }}
                className={cn("object-cover", (i === active || i === prev) && "animate-kenburns")}
              />
            </div>
          ))}

          {/* Grande forme arrondie à gauche (+ écho bleu translucide), comme sur la page carrière de Yas */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-y-0 left-0 h-full w-[30%] md:w-[56%]"
          >
            <path d="M0 0 H70 C99 20 99 80 70 100 H0 Z" className="fill-night-600/45" />
            <path d="M0 0 H61 C88 22 88 78 61 100 H0 Z" className="fill-night-900/95" />
          </svg>

          {/* Pastille en dôme, en bas à droite */}
          <div
            aria-hidden
            className="absolute right-4 bottom-0 flex h-24 w-36 items-end justify-center sm:right-10 md:right-16 md:h-36 md:w-52"
          >
            <svg
              viewBox="0 0 100 70"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <path d="M0 70 C10 22 28 0 50 0 C72 0 90 22 100 70 Z" className="fill-live" />
            </svg>
            <p className="relative pb-3 text-center font-display leading-none md:pb-5">
              <span className="block text-sm font-semibold text-white/85 md:text-lg">Passe en</span>
              <span className="block text-2xl font-extrabold md:text-4xl">live&nbsp;!</span>
            </p>
          </div>
        </div>

        {/* Texte : dans la forme sur ordinateur, dans un bloc sous la photo sur téléphone */}
        <div className="relative bg-night-900 md:absolute md:inset-y-0 md:left-0 md:flex md:w-[50%] md:items-center md:bg-transparent lg:w-[46%]">
          <div className="w-full px-5 py-8 sm:px-8 md:py-0 md:pr-6 lg:pl-[max(2rem,calc((100vw-72rem)/2+2rem))]">
            <div key={active}>
              <div className="flex animate-rise items-center gap-3">
                <LiveBadge />
                <span className="text-xs font-semibold tracking-[0.2em] text-white/85 uppercase">
                  {slide.kicker}
                </span>
              </div>
              <h1
                className="mt-4 animate-rise font-display text-[2.2rem] leading-[1.05] font-extrabold tracking-tight text-balance md:text-[2.6rem] lg:text-[3.4rem]"
                style={{ animationDelay: "80ms" }}
              >
                <span className="text-live">{slide.accent}</span> {slide.title}
              </h1>
              <p
                className="mt-4 max-w-md animate-rise leading-relaxed text-white/80 lg:text-lg"
                style={{ animationDelay: "160ms" }}
              >
                {slide.text}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/reserver?mode=presentiel"
                className="group relative flex min-h-15 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-live px-6 text-[1.05rem] font-bold whitespace-nowrap shadow-xl shadow-live/30 transition hover:bg-live-700 active:scale-[0.98]"
              >
                <span aria-hidden className="text-xl">
                  🎥
                </span>
                En présentiel au Togo
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
              </Link>
              <Link
                href="/reserver?mode=distance"
                className="flex min-h-15 items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-white/10 px-6 text-[1.05rem] font-bold whitespace-nowrap transition hover:bg-white/20 active:scale-[0.98]"
              >
                <span aria-hidden className="text-xl">
                  🌍
                </span>
                À distance
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Photos">
              {slides.map((s, i) => (
                <button
                  key={s.image}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Photo ${i + 1} : ${s.kicker}`}
                  onClick={() => go(i)}
                  className="group flex h-8 items-center"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-500",
                      i === active ? "w-10 bg-white" : "w-4 bg-white/40 group-hover:bg-white/70",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
