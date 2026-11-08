"use client";

import {
  BE,
  BF,
  BJ,
  CA,
  CD,
  CI,
  CM,
  FR,
  GA,
  GN,
  ML,
  NE,
  SN,
  TG,
} from "country-flag-icons/react/3x2";
import { Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LiveBadge, OcdLiveLogo } from "@/components/brand";
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

/** Villes du bandeau et leur drapeau (SVG : les drapeaux emoji ne s'affichent pas sur Windows). */
const CITIES = [
  { name: "Lomé", Flag: TG },
  { name: "Abidjan", Flag: CI },
  { name: "Dakar", Flag: SN },
  { name: "Douala", Flag: CM },
  { name: "Cotonou", Flag: BJ },
  { name: "Kinshasa", Flag: CD },
  { name: "Bamako", Flag: ML },
  { name: "Libreville", Flag: GA },
  { name: "Ouagadougou", Flag: BF },
  { name: "Niamey", Flag: NE },
  { name: "Conakry", Flag: GN },
  { name: "Paris", Flag: FR },
  { name: "Bruxelles", Flag: BE },
  { name: "Montréal", Flag: CA },
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
      <header className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:h-22 sm:px-8">
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
        </div>

        {/* Texte : dans la forme sur ordinateur, dans un bloc sous la photo sur téléphone */}
        <div className="relative bg-night-800 md:absolute md:inset-y-0 md:left-0 md:flex md:w-[50%] md:items-center md:bg-transparent lg:w-[47%]">
          <div className="w-full px-5 py-9 sm:px-8 md:box-content md:max-w-[30rem] md:py-0 md:pr-4 lg:pl-[max(2rem,calc((100vw-72rem)/2+2rem))]">
            <div key={active}>
              <div className="flex animate-rise items-center gap-3">
                <LiveBadge />
                <span className="text-xs font-semibold tracking-[0.2em] text-white/80 uppercase">
                  {slide.kicker}
                </span>
              </div>
              <h1
                className="mt-5 animate-rise font-display text-[2.15rem] leading-[1.08] font-extrabold tracking-tight text-balance italic md:text-[2.3rem] lg:text-[2.75rem]"
                style={{ animationDelay: "80ms" }}
              >
                <span className="text-[#9fc2e3]">{slide.accent}</span> {slide.title}
              </h1>
            </div>

            <p className="mt-5 max-w-md leading-relaxed text-white/75">
              Réserve ton passage en live sur le TikTok de House of Challenge, en présentiel à Lomé
              ou à distance.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/reserver?mode=presentiel"
                className="group relative flex min-h-14 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-live px-5 text-[1.05rem] font-bold whitespace-nowrap shadow-xl shadow-live/30 transition hover:bg-live-700 active:scale-[0.98]"
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
                className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/10 px-5 text-[1.05rem] font-bold whitespace-nowrap transition hover:bg-white/20 active:scale-[0.98]"
              >
                <span aria-hidden className="text-xl">
                  🌍
                </span>
                À distance
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setLiveOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white decoration-live decoration-2 underline-offset-4 hover:underline"
              >
                <Camera className="size-4 text-live" aria-hidden />
                Essaie&nbsp;: rejoins le live avec ta caméra
              </button>
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
                        i === active ? "w-10 bg-white" : "w-4 bg-white/35 group-hover:bg-white/70",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bandeau des villes qui défile : « devant toute l'Afrique » */}
      <div className="border-t border-white/10 bg-night-950 py-4">
        <p className="sr-only">Des spectateurs dans toute l&apos;Afrique et la diaspora.</p>
        <div
          aria-hidden
          className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
        >
          <div className={cn("flex shrink-0 gap-8 pr-8", running && "animate-marquee")}>
            {[...CITIES, ...CITIES].map(({ name, Flag }, i) => (
              <span
                key={i}
                className="flex items-center gap-3 font-display text-sm font-bold tracking-[0.2em] whitespace-nowrap text-white/60 uppercase"
              >
                <Flag className="h-4 w-6 shrink-0 rounded-[3px] shadow-sm ring-1 ring-white/20" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {liveOpen && <LiveModal onClose={() => setLiveOpen(false)} />}
    </section>
  );
}
