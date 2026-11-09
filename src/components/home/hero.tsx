"use client";

import { ArrowRight, Camera } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { LiveModal } from "./live-modal";

/**
 * Hero « 8 000 000 » : un seul nombre.
 * Les chiffres tournent comme un compteur jusqu'au nombre d'abonnés, puis
 * l'intérieur des chiffres se remplit d'une photo de live qui bouge lentement.
 * Photo : une foule (Unsplash, licence libre, photo NRv8BsouFBQ).
 */
const PHOTO = "/hero/foule.jpg";

const NAV = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#packages", label: "Packages" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

const CHOICES = [
  { href: "/reserver?mode=presentiel", kicker: "En présentiel", label: "Au studio, à Lomé" },
  { href: "/reserver?mode=distance", kicker: "À distance", label: "Depuis chez toi" },
];

/** 8000000 → "8 000 000" (espaces simples : même largeur dans les deux calques). */
const NUMBER = site.liveAccount.followersCount
  .toString()
  .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const ROLL_MS = 1700;

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

/** Une colonne du compteur : 0→9 deux fois, puis le chiffre final. */
function Reel({ digit, rolling, delay }: { digit: number; rolling: boolean; delay: number }) {
  const stack = [...Array(20).keys()].map((n) => n % 10).concat(digit);
  return (
    <span className="inline-block h-[1em] overflow-hidden align-top">
      <span
        className="flex flex-col"
        style={{
          transform: `translateY(${rolling ? -(stack.length - 1) : 0}em)`,
          transition: `transform ${ROLL_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        }}
      >
        {stack.map((n, i) => (
          <span key={i} className="block h-[1em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const [rolling, setRolling] = useState(false);
  const [filled, setFilled] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);

  // Le compteur démarre juste après l'affichage, la photo arrive quand il s'arrête.
  useEffect(() => {
    const start = requestAnimationFrame(() => setRolling(true));
    const done = setTimeout(() => setFilled(true), ROLL_MS + 650);
    return () => {
      cancelAnimationFrame(start);
      clearTimeout(done);
    };
  }, []);

  const showPhoto = filled || reduced;

  return (
    <section className="relative flex min-h-svh flex-col bg-white text-night-950">
      {/* En-tête blanc, fin */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="OCD Live, accueil">
          <OcdLiveLogo tone="dark" className="text-xl sm:text-2xl" />
        </Link>
        <nav aria-label="Menu principal" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-night-800 transition hover:text-live"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <Link
          href="/reserver"
          className="rounded-full bg-live px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-live-700"
        >
          Réserver
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pt-6 pb-10 sm:px-8 lg:pb-14">
        <h1>
          <span className="sr-only">
            Demain, ta boutique devant {NUMBER} personnes, en live sur TikTok.
          </span>

          <span
            aria-hidden
            className="block font-display text-2xl font-semibold tracking-tight text-night-800 sm:text-4xl"
          >
            Demain, ta boutique devant
          </span>

          {/* Le nombre : calque compteur + calque photo, exactement superposés */}
          <span
            aria-hidden
            className="relative -ml-[0.04em] block font-display text-[19.5vw] leading-none font-extrabold tracking-[-0.045em] tabular-nums sm:text-[17vw] xl:text-[15.5rem]"
          >
            <span
              className={cn(
                "block text-night-950 transition-opacity duration-700",
                showPhoto && "opacity-0",
              )}
            >
              {NUMBER.split("").map((ch, i) =>
                ch === " " ? (
                  <span key={i}> </span>
                ) : (
                  <Reel
                    key={i}
                    digit={Number(ch)}
                    rolling={rolling || reduced}
                    delay={i * 60}
                  />
                ),
              )}
            </span>
            <span
              className={cn(
                "number-photo absolute inset-0 block bg-clip-text text-transparent transition-opacity duration-1000",
                showPhoto ? "opacity-100" : "opacity-0",
              )}
              style={{ backgroundImage: `url(${PHOTO})` }}
            >
              {NUMBER}
            </span>
          </span>

          <span
            aria-hidden
            className="mt-2 block font-display text-2xl font-semibold tracking-tight sm:text-4xl"
          >
            de personnes. <span className="text-live">En live sur TikTok.</span>
          </span>
        </h1>

        <div className="mt-10 grid gap-8 border-t border-line pt-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-xl">
            <p className="text-base leading-relaxed text-muted sm:text-lg">
              Réserve ton passage sur le TikTok de{" "}
              <strong className="font-semibold text-night-950">House of Challenge</strong> et
              présente tes produits à la communauté de Bovann. Rien à payer en ligne :
              l&apos;équipe Bovann Group te confirme tout sur WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => setLiveOpen(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-night-800 transition hover:text-live"
            >
              <Camera className="size-4 text-live" aria-hidden />
              <span className="underline decoration-line underline-offset-4">
                Essaie : passe en live avec ta caméra
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-1 lg:min-w-[26rem]">
            {CHOICES.map((c, i) => (
              <Link
                key={c.href}
                href={c.href}
                className={cn(
                  "group flex items-center justify-between gap-6 border-b-2 py-3 transition",
                  i === 0 ? "border-live" : "border-night-950",
                )}
              >
                <span>
                  <span className="block text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                    {c.kicker}
                  </span>
                  <span className="block font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {c.label}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full text-white transition group-hover:translate-x-1",
                    i === 0 ? "bg-live" : "bg-night-950",
                  )}
                >
                  <ArrowRight className="size-5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {liveOpen && <LiveModal onClose={() => setLiveOpen(false)} />}
    </section>
  );
}
