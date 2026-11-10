"use client";

import { ArrowRight, Camera, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { TikTokLogo } from "@/components/icons";
import { cn } from "@/lib/utils";
import { LiveModal } from "./live-modal";

/**
 * Hero : un présentateur enthousiaste montre son téléphone et nous parle,
 * devant la carte de l'Afrique.
 * - Personne : photo réelle détourée (Pexels 19518397, licence libre), en buste jusqu'à
 *   l'ourlet du pull (public/hero/presentateur-buste.webp, 1500 × 1731).
 * - Écran : vitre découpée dans la photo ; l'interface de live passe dessous (pur CSS).
 * - Carte : continent en points noirs en toile de fond, Togo en orange (public/hero/afrique.svg).
 */
const NAV = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#packages", label: "Packages" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

const PHOTOS = [
  "/hero/live/commercante.jpg",
  "/hero/live/vendeur.jpg",
  "/hero/live/couturiere.jpg",
  "/hero/live/marche.jpg",
];

const REACTIONS = ["😍 Trop beau !", "🛒 Je commande", "🔥 Ça c'est du live"];

/**
 * Écran du téléphone, en pur CSS (aucun JavaScript, donc toujours affiché) :
 * la vitre est découpée dans la photo et l'interface passe dessous. Les coins de la
 * vitre ont été mesurés sur la photo puis ajustés en parallélogramme élargi de 3 %
 * (l'écart, ≤ 7 px source, reste caché sous la coque). Le cadre ayant un ratio fixe
 * (1500 × 1038), position et taille en % et rotation en matrix() suffisent.
 */
const SCREEN_STYLE = {
  left: "13.702%",
  top: "21.613%",
  width: "12.02%",
  height: "41.203%",
  transform: "matrix(0.9606, 0.2781, -0.2785, 0.9604, 0, 0)",
} as const;

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

/**
 * Interface de live. Les tailles sont en cqw (largeur de l'écran) : elle garde
 * ses proportions quelle que soit la taille de la photo.
 */
function PhoneLive({ active }: { active: number }) {
  return (
    <div
      aria-hidden
      className="[container-type:size] absolute origin-top-left"
      style={SCREEN_STYLE}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[9cqw] bg-night-950">
        {PHOTOS.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="160px"
            preload={i === 0}
            className={cn(
              "object-cover transition-opacity duration-700",
              i === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
        <div className="absolute inset-x-[6cqw] top-[8cqw] flex items-center justify-between">
          <span className="rounded-[3cqw] bg-[#fe2c55] px-[4cqw] py-[1cqw] text-[6.5cqw] leading-none font-extrabold tracking-wide text-white">
            LIVE
          </span>
          <TikTokLogo className="size-[16cqw]" />
        </div>
        <div className="absolute inset-x-[6cqw] bottom-[8cqw] flex items-center gap-[4cqw]">
          <span className="h-[17cqw] flex-1 rounded-full bg-white/25" />
          <span className="flex size-[17cqw] items-center justify-center rounded-full bg-[#fe2c55]">
            <Heart className="size-[9cqw] fill-white text-white" />
          </span>
        </div>
        {/* Reflet sur la vitre */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
      </div>
    </div>
  );
}

/** Cadre de la carte de l'Afrique (partagé par la carte et le repère du Togo). */
const MAP_BOX =
  "pointer-events-none absolute top-[26%] left-1/2 aspect-[600/640] w-[140%] -translate-x-1/2 sm:top-[18%] sm:w-[110%] lg:top-[52%] lg:left-[calc(50%+36px)] lg:w-[min(56%,660px)] lg:-translate-y-1/2";

/** Point orange sur le Togo (position dans afrique.svg) : le studio, à Lomé. */
function TogoPin({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute top-[41.3%] left-[28.7%] -translate-x-1/2 -translate-y-1/2",
        className,
      )}
    >
      <span className="absolute inset-0 m-auto size-4 animate-ping rounded-full bg-live/50" />
      <span className="relative block size-4 rounded-full bg-live ring-4 ring-[#fff7ee]" />
    </span>
  );
}

/** Haut de la photo d'origine (1500 × 1038) : repère de l'écran, de la bulle, des réactions. */
const FRAME = "absolute top-0 left-0 aspect-[1500/1038] w-full";

/** La scène : carte, présentateur, téléphone en perspective, bulle de parole. */
function Stage({ active }: { active: number }) {
  return (
    /*
     * La personne en buste, jusqu'à l'ourlet du pull (photo réelle 1500 × 1731).
     * Sur grand écran, elle est posée sur le bas du hero et sa taille suit la hauteur
     * de la scène (88cqh), plafonnée en largeur (108cqw).
     * Sur mobile et tablette, elle part du haut de la scène et le bas du hero la coupe.
     */
    <div className="absolute top-0 left-[-6%] aspect-[1500/1731] w-[145%] sm:top-[8%] sm:left-0 sm:w-full lg:top-auto lg:bottom-0 lg:w-[min(108cqw,88cqh)] lg:-translate-x-[4%]">
      {/*
       * Cadre de référence : le haut de la photo (1500 × 1038), où sont mesurés
       * les coins de l'écran, la bulle et les réactions.
       */}
      <div className={FRAME}>
        {/* L'écran du téléphone, sous la photo : il apparaît par la vitre découpée */}
        <PhoneLive active={active} />
      </div>

      <Image
        src="/hero/presentateur-buste.webp"
        alt="Un entrepreneur montre son téléphone : il est en live sur TikTok avec OCD Live"
        fill
        sizes="(min-width: 1024px) 50vw, 145vw"
        preload
        className="object-contain object-top"
      />

      <div className={FRAME}>
        {/* Bulle de parole, reliée à la bouche */}
        <div className="absolute top-[-6%] left-[28%] w-[40%] max-w-[19rem] sm:top-[18%] sm:left-[67%] sm:w-[31%] lg:top-[12%] lg:left-[63%] lg:w-[40%]">
          <div className="relative rounded-3xl bg-white px-4 py-3 shadow-[0_18px_40px_-18px_rgba(35,35,38,0.5)] sm:px-5 sm:py-4">
            <p className="font-display text-[clamp(0.85rem,1.25vw,1.1rem)] leading-tight font-extrabold text-night-950">
              L&apos;Afrique entière te regarde{" "}
              <span className="text-live-600">en live sur TikTok&nbsp;!</span>
            </p>
            <span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap text-muted">
              <span className="flex size-5 items-center justify-center rounded-full bg-night-950">
                <TikTokLogo className="size-3" />
              </span>
              House of Challenge
            </span>
            {/* Queue de la bulle, tournée vers la bouche (à droite sur mobile, à gauche ensuite) */}
            <svg
              aria-hidden
              viewBox="0 0 28 20"
              className="absolute right-6 -bottom-[18px] h-5 w-7 fill-white sm:hidden"
            >
              <path d="M0 0 H28 L24 20 Z" />
            </svg>
            <svg
              aria-hidden
              viewBox="0 0 28 20"
              className="absolute -bottom-[18px] left-3 hidden h-5 w-7 fill-white sm:block"
            >
              <path d="M0 0 H28 L2 20 Z" />
            </svg>
          </div>
        </div>

        {/* Réactions qui sortent du téléphone */}
        <ul
          aria-hidden
          className="absolute top-[12%] left-[26%] hidden flex-col items-start gap-2 sm:flex"
        >
          {REACTIONS.map((r, i) => (
            <li
              key={r}
              className="reaction rounded-full bg-white px-3 py-1.5 text-[clamp(0.65rem,1vw,0.85rem)] font-semibold whitespace-nowrap text-night-950 shadow-lg"
              style={{ animationDelay: `${i * 1.3}s` }}
            >
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [liveOpen, setLiveOpen] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActive((a) => (a + 1) % PHOTOS.length), 4500);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-[#fff7ee] text-night-950 lg:h-[min(100svh,46rem)] lg:min-h-[38rem]">
      {/* Toute la toile de fond : la carte de l'Afrique en points noirs */}
      <div aria-hidden className={cn(MAP_BOX, "-z-10")}>
        <Image
          src="/hero/afrique.svg"
          alt=""
          fill
          unoptimized
          preload
          className="object-contain opacity-[0.22]"
        />
        <TogoPin className="lg:hidden" />
      </div>
      {/* Sur grand écran, le point du Togo passe devant la photo pour rester visible */}
      <div aria-hidden className={cn(MAP_BOX, "z-10 hidden lg:block")}>
        <TogoPin />
      </div>
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
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

      <div className="mx-auto grid w-full max-w-7xl flex-1 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-6">
        {/* Texte */}
        <div className="relative z-10 pt-6 pb-4 lg:self-center lg:pt-0 lg:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-night-800 shadow-sm">
            <span className="size-2 animate-live-pulse rounded-full bg-live" />
            Live TikTok · House of Challenge
          </p>

          <h1 className="mt-6 font-display text-[2.8rem] leading-[1] font-extrabold tracking-[-0.035em] sm:text-6xl xl:text-[3.9rem]">
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

          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
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

        {/* Scène */}
        <div className="relative -mx-5 mt-14 h-[24rem] sm:mx-0 sm:mt-0 sm:h-[34rem] lg:[container-type:size] lg:h-auto">
          <Stage active={active} />
        </div>
      </div>

      {liveOpen && <LiveModal onClose={() => setLiveOpen(false)} />}
    </section>
  );
}
