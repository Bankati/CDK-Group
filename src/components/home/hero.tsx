"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LiveBadge, OcdLiveLogo } from "@/components/brand";
import { cn } from "@/lib/utils";

/** Photos temporaires : à remplacer par de vraies photos de lives (dossier public/hero). */
const slides = [
  {
    image: "/hero/hero-bg.jpg",
    kicker: "Live TikTok",
    title: "Ton business en live devant toute l'Afrique",
    text: "Présente tes produits en direct sur le compte de House of Challenge, depuis Lomé ou depuis chez toi.",
  },
  {
    image: "/hero/working-2.jpg",
    kicker: "House of Challenge",
    title: "Passe en live sur le compte de House of Challenge",
    text: "La web-téléréalité panafricaine de l'entrepreneuriat t'ouvre son direct. Réserve en 3 minutes.",
  },
  {
    image: "/hero/about.jpg",
    kicker: "From Africa to the World",
    title: "Et si Bovann parlait de toi ?",
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
    <section className="relative isolate flex h-svh min-h-[620px] flex-col overflow-hidden bg-night-950 text-white">
      {/* Photos : fondu enchaîné + zoom lent */}
      {slides.map((s, i) => (
        <div
          key={s.image}
          aria-hidden
          className={cn(
            "absolute inset-0 -z-20 transition-opacity duration-[1400ms] ease-out",
            i === active ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={s.image}
            alt=""
            fill
            sizes="100vw"
            preload={i === 0}
            className={cn("object-cover", (i === active || i === prev) && "animate-kenburns")}
          />
        </div>
      ))}

      {/* Voile bleu nuit */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/95 via-night-900/80 to-night-800/55"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-night-950/35" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Link href="/" aria-label="OCD Live, accueil">
          <OcdLiveLogo layout="stacked" className="w-28 sm:w-36" />
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
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-10 sm:justify-center sm:px-8 sm:pb-16">
        <div key={active} className="max-w-3xl">
          <div className="flex animate-rise items-center gap-3">
            <LiveBadge />
            <span className="text-xs font-semibold tracking-[0.22em] text-white/85 uppercase sm:text-sm">
              {slide.kicker}
            </span>
          </div>
          <h1
            className="mt-5 animate-rise font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            {slide.title}
          </h1>
          <p
            className="mt-5 max-w-xl animate-rise text-base leading-relaxed text-white/85 sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {slide.text}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:max-w-xl sm:grid-cols-2">
          <Link
            href="/reserver?mode=presentiel"
            className="group relative flex min-h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-live px-6 text-lg font-bold shadow-xl shadow-live/30 transition hover:bg-live-700 active:scale-[0.98]"
          >
            <span aria-hidden className="text-2xl">
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
            className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-white/30 bg-white/10 px-6 text-lg font-bold backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98]"
          >
            <span aria-hidden className="text-2xl">
              🌍
            </span>
            À distance
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2" role="tablist" aria-label="Photos">
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
          <a
            href="#comment-ca-marche"
            className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:block"
          >
            Comment ça marche ↓
          </a>
        </div>
      </div>
    </section>
  );
}
