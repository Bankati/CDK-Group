"use client";

import { ArrowRight, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CI, CM, NG, SN, TG } from "country-flag-icons/react/3x2";
import { OcdLiveLogo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { AFRICA_VIEWBOX, AUDIENCE, LOME } from "./africa-points";
import { LiveModal } from "./live-modal";
import { LivePhone } from "./live-phone";

/**
 * Hero : la carte de l'Afrique, pays par pays, remplie des visages de commerçants,
 * et devant elle un téléphone posé qui diffuse un live.
 * - Carte : public/hero/afrique-mosaique.svg (vraies frontières, 6 régions = 6 photos),
 *   faisceaux du live depuis le studio de Lomé (africa-points.ts).
 * - Téléphone : LivePhone (le même que « Essaie avec ta caméra »), les lives défilent.
 */
const NAV = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#packages", label: "Packages" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

/** Les lives qui passent dans le téléphone : un commerçant, son produit. */
const LIVES = [
  {
    image: "/hero/live/commercante.jpg",
    position: "38% 30%",
    product: { name: "Poteries artisanales", price: "3 500 FCFA" },
  },
  {
    image: "/hero/live/vendeur.jpg",
    position: "50% 30%",
    product: { name: "Panier de mangues", price: "2 000 FCFA" },
  },
  {
    image: "/hero/live/couturiere.jpg",
    position: "50% 35%",
    product: { name: "Robe en wax sur mesure", price: "15 000 FCFA" },
  },
  {
    image: "/hero/live/marche.jpg",
    position: "45% 40%",
    product: { name: "Pastèques du jour", price: "1 500 FCFA" },
  },
];

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

/** Faisceau courbe de Lomé vers une capitale (bombé vers le haut). */
function beam(x: number, y: number) {
  const mx = (LOME.x + x) / 2;
  const my = (LOME.y + y) / 2 - Math.hypot(x - LOME.x, y - LOME.y) * 0.28;
  return `M${LOME.x} ${LOME.y} Q${mx} ${my} ${x} ${y}`;
}

/**
 * La carte de l'Afrique : chaque pays dessiné, chaque région remplie de commerçants,
 * et les faisceaux du live qui partent du studio de Lomé vers les capitales.
 */
function AfricaMap({ className }: { className?: string }) {
  const { w, h } = AFRICA_VIEWBOX;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute aspect-[600/640]", className)}>
      <div className="absolute inset-[6%] rounded-full bg-live/25 blur-3xl" />
      <Image
        src="/hero/afrique-mosaique.svg"
        alt=""
        fill
        unoptimized
        preload
        className="object-contain drop-shadow-[0_30px_40px_rgba(158,69,2,0.3)]"
      />
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 size-full overflow-visible">
        <g className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          {AUDIENCE.map((c, i) => (
            <g key={c.code}>
              <path
                d={beam(c.x, c.y)}
                fill="none"
                stroke="#fff"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeDasharray="2 6"
                className="motion-safe:animate-[dash-flow_1.2s_linear_infinite]"
              />
              <circle
                cx={c.x}
                cy={c.y}
                r={5}
                fill="#ee6b07"
                className="map-ping"
                style={{ animationDelay: `${(i % 6) * 0.4}s` }}
              />
              <circle cx={c.x} cy={c.y} r={4} fill="#ee6b07" stroke="#fff" strokeWidth={1.5} />
            </g>
          ))}
        </g>
        {/* Le studio, à Lomé */}
        <circle cx={LOME.x} cy={LOME.y} r={9} fill="#ee6b07" className="map-ping" />
        <circle cx={LOME.x} cy={LOME.y} r={7.5} fill="#232326" stroke="#fff" strokeWidth={3} />
      </svg>
    </div>
  );
}

/**
 * Le téléphone posé, légèrement incliné, avec son ombre au sol : il diffuse un live.
 * Il est dessiné à sa vraie taille (300 px) puis réduit d'un bloc selon l'écran,
 * pour que l'interface du live garde ses proportions.
 */
function StandingPhone({ active, running }: { active: number; running: boolean }) {
  const live = LIVES[active]!;
  return (
    <div className="absolute bottom-[3%] left-[5%] w-[300px] origin-bottom-left scale-[0.7] sm:left-[6%] sm:scale-[0.84] lg:bottom-[4%] lg:left-0 lg:scale-[0.88] xl:scale-[0.92]">
      {/* Ombre portée au sol */}
      <div className="absolute -bottom-5 left-[6%] h-10 w-[92%] rounded-[50%] bg-night-950/35 blur-lg" />
      <div className="-rotate-[5deg]">
        <LivePhone
          key={live.image}
          image={live.image}
          position={live.position}
          product={live.product}
          productKey={active}
          running={running}
          sizes="640px"
        />
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
    const id = setInterval(() => setActive((a) => (a + 1) % LIVES.length), 6000);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-[#fff7ee] text-night-950 lg:h-[min(100svh,46rem)] lg:min-h-[38rem]">
      {/* Lumière chaude, côté scène */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] -z-10 size-[46rem] rounded-full bg-[radial-gradient(closest-side,rgba(238,107,7,0.16),transparent)]"
      />
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

          <p className="mt-6 max-w-md text-base leading-relaxed text-night-800 sm:text-lg">
            Passe sur le TikTok de <strong>House of Challenge</strong> et montre tes produits à des
            milliers d&apos;acheteurs, au studio à Lomé ou depuis chez toi.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/reserver"
              className="group flex min-h-14 items-center gap-4 rounded-full bg-night-950 py-2 pr-2 pl-7 font-bold whitespace-nowrap text-white shadow-[0_18px_36px_-16px_rgba(35,35,38,0.7)] transition hover:-translate-y-0.5"
            >
              Réserver mon live
              <span className="flex size-10 items-center justify-center rounded-full bg-live text-night-950 transition group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setLiveOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-night-800 transition hover:text-live-600"
            >
              <Camera className="size-4 text-live-600" aria-hidden />
              <span className="underline decoration-live/40 underline-offset-4">
                Essaie avec ta caméra
              </span>
            </button>
          </div>

          {/* Toute l'Afrique : quelques drapeaux, puis les 54 pays */}
          <div className="mt-9 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[TG, CI, SN, CM, NG].map((F, i) => (
                <span
                  key={i}
                  className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-[#fff7ee]"
                >
                  <F aria-hidden className="h-8 w-12 max-w-none shrink-0" />
                </span>
              ))}
            </div>
            <p className="text-sm leading-tight text-night-800">
              <strong className="text-night-950">Ouvert aux 54 pays d&apos;Afrique</strong>
              <br />
              Rien à payer en ligne : tout se confirme sur WhatsApp.
            </p>
          </div>
        </div>

        {/* Scène : la carte, le téléphone posé devant */}
        <div className="[container-type:size] relative -mx-5 mt-10 h-[30rem] sm:mx-0 sm:mt-4 sm:h-[36rem] lg:mt-0 lg:h-auto">
          <AfricaMap className="top-0 right-[-4%] h-[100cqh] max-h-[118cqw] lg:top-[2%] lg:right-[-2%] lg:h-[min(98cqh,108cqw)]" />
          <StandingPhone active={active} running={!reduced} />
        </div>
      </div>

      {liveOpen && <LiveModal onClose={() => setLiveOpen(false)} />}
    </section>
  );
}
