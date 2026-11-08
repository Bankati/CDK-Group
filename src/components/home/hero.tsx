"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { LiveModal } from "./live-modal";

/**
 * Les 4 photos du hero (dossier public/hero) et leurs textes.
 * La 1re est le visuel officiel OCD Live ; les 3 autres sont des photos Unsplash (licence libre, usage commercial autorisé) : Ahmed Nasiru, Ali Mkumbwa.
 * `position` : cadrage du sujet ; `flip` : photo retournée en miroir ; `accent` s'affiche en bleu clair, `title` en blanc.
 */
const slides: {
  image: string;
  position: string;
  flip?: boolean;
  kicker: string;
  accent: string;
  title: string;
}[] = [
  {
    image: "/hero/ocd-live-studio.jpg",
    position: "78% 50%",
    kicker: "OCD Live",
    accent: "Le live qui vend,",
    title: "devant toute l'Afrique.",
  },
  {
    image: "/hero/live-entrepreneure.jpg",
    position: "50% 30%",
    // Photo retournée : le téléphone se retrouve du côté visible, hors de la forme bleue.
    flip: true,
    kicker: "Live TikTok",
    accent: "Un téléphone, un live,",
    title: "et toute l'Afrique devient ta clientèle.",
  },
  {
    image: "/hero/live-couturier.jpg",
    position: "55% 40%",
    kicker: "Artisans & créateurs",
    accent: "De ton atelier",
    title: "à des millions d'écrans, en un seul live.",
  },
  {
    image: "/hero/live-commercante.jpg",
    position: "50% 35%",
    kicker: "Commerçants",
    accent: "Du marché d'Adawlato",
    title: "jusqu'à Paris, Dakar et Abidjan.",
  },
];

const INTERVAL = 6500;

/** Les animations ne tournent que si le hero est visible et si l'utilisateur accepte les animations. */
function useLiveRunning(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const reduced = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(Boolean(e?.isIntersecting)));
    io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref]);
  return inView && pageVisible && !reduced;
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const running = useLiveRunning(sectionRef);
  const [{ active, prev }, setState] = useState<{ active: number; prev: number | null }>({
    active: 0,
    prev: null,
  });
  const [liveOpen, setLiveOpen] = useState(false);

  const go = (i: number) => setState((s) => (s.active === i ? s : { active: i, prev: s.active }));

  // Photo suivante toutes les 6,5 s (redémarre après un clic sur un point).
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setState((s) => ({ active: (s.active + 1) % slides.length, prev: s.active })),
      INTERVAL,
    );
    return () => clearInterval(id);
  }, [active, running]);

  const slide = slides[active]!;

  return (
    <section ref={sectionRef} className="bg-night-900 text-white">
      {/* Barre d'en-tête : fine, sur fond blanc, logos en version « fond clair » */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:h-16 sm:px-8">
          <Link href="/" aria-label="OCD Live, accueil">
            <OcdLiveLogo layout="stacked" tone="dark" className="w-16 sm:w-[4.5rem]" />
          </Link>
          <a
            href="https://bovanngroup.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted transition hover:text-night-900"
          >
            <span className="hidden sm:inline">une initiative</span>
            <Image
              src="/brand/bovann-group-sombre.png"
              alt="Bovann Group"
              width={120}
              height={24}
              className="h-4 w-auto sm:h-5"
            />
          </a>
        </div>
      </header>

      <div className="relative isolate">
        {/* Photos : fondu enchaîné + zoom lent. Sur ordinateur, elles commencent sous la forme. */}
        <div className="relative h-[48svh] min-h-[300px] overflow-hidden bg-night-950 md:h-[600px] lg:h-[660px]">
          <div className="absolute inset-0 md:left-[32%]">
            {slides.map((s, i) => (
              <div
                key={s.image}
                aria-hidden
                className={cn(
                  "absolute inset-0 transition-opacity duration-[1400ms] ease-out",
                  i === active ? "opacity-100" : "opacity-0",
                  s.flip && "-scale-x-100",
                )}
              >
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 72vw, 100vw"
                  preload={i === 0}
                  style={{ objectPosition: s.position }}
                  className={cn("object-cover", (i === active || i === prev) && "animate-kenburns")}
                />
              </div>
            ))}
          </div>

          {/* Grande forme arrondie à gauche, avec deux échos translucides (comme sur Yas) */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-y-0 left-0 h-full w-[34%] md:w-[64%]"
          >
            <path d="M0 0 H64 C100 6 100 86 68 100 H0 Z" className="fill-night-600/35" />
            <path d="M0 0 H57 C96 7 98 85 61 100 H0 Z" className="fill-night-700/55" />
            <path d="M0 0 H50 C88 8 92 84 54 100 H0 Z" className="fill-night-800" />
          </svg>

          {/* Points du slider : en bas à droite de la photo, loin du texte */}
          <div
            className="absolute right-5 bottom-5 z-10 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 backdrop-blur-sm md:right-8 md:bottom-6"
            role="tablist"
            aria-label="Photos"
          >
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Photo ${i + 1} : ${s.kicker}`}
                onClick={() => go(i)}
                className="group flex h-7 items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-500",
                    i === active ? "w-8 bg-white" : "w-3 bg-white/45 group-hover:bg-white/80",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Texte : dans la forme sur ordinateur, dans un bloc sous la photo sur téléphone */}
        <div className="relative bg-night-800 md:absolute md:inset-y-0 md:left-0 md:flex md:w-[48%] md:items-center md:bg-transparent lg:w-[46%]">
          <div className="w-full px-6 py-10 sm:px-10 md:py-0 md:pr-10 md:pl-[max(2.75rem,calc((100vw-72rem)/2+2rem))]">
            <div className="max-w-[28rem]">
              <div key={active}>
                <p className="flex animate-rise items-center gap-2.5 text-xs font-bold tracking-[0.22em] text-[#9fc2e3] uppercase">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-live" />
                  </span>
                  En direct
                  <span aria-hidden className="h-3 w-px bg-white/25" />
                  {slide.kicker}
                </p>
                <h1
                  className="mt-4 animate-rise font-display text-[2.35rem] leading-[1.04] font-extrabold tracking-tight text-balance md:text-[2.45rem] lg:text-[3.1rem]"
                  style={{ animationDelay: "80ms" }}
                >
                  <span className="block text-[#9fc2e3]">{slide.accent}</span>
                  <span className="block">{slide.title}</span>
                </h1>
              </div>

              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
                Passe en live sur le TikTok de House of Challenge, à Lomé ou depuis chez toi.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/reserver?mode=presentiel"
                  className="group relative flex min-h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-live px-4 font-bold whitespace-nowrap shadow-lg shadow-live/25 transition hover:bg-live-700 active:scale-[0.98]"
                >
                  <span aria-hidden>🎥</span>
                  En présentiel au Togo
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                </Link>
                <Link
                  href="/reserver?mode=distance"
                  className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 font-bold whitespace-nowrap transition hover:bg-white/15 active:scale-[0.98]"
                >
                  <span aria-hidden>🌍</span>À distance
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setLiveOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-2 pr-4 pl-2 text-sm font-semibold text-white/90 transition hover:bg-white/15"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-live">
                  <Camera className="size-4 text-white" aria-hidden />
                </span>
                Essaie&nbsp;: rejoins le live avec ta caméra
              </button>
            </div>
          </div>
        </div>
      </div>

      {liveOpen && <LiveModal onClose={() => setLiveOpen(false)} />}
    </section>
  );
}
