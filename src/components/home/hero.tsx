"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { LiveModal } from "./live-modal";

/**
 * Hero sur le modèle du site bovanngroup.com : photo plein écran assombrie,
 * menu transparent, grand titre centré en majuscules, boutons rouges.
 * Les photos défilent en fond (dossier public/hero) avec leur titre.
 * Photos 2 à 4 : Unsplash (licence libre) — Ahmed Nasiru, Ali Mkumbwa.
 */
const slides: { image: string; position: string; kicker: string; title: string }[] = [
  {
    image: "/hero/ocd-live-studio.jpg",
    position: "60% 50%",
    kicker: "Live TikTok · House of Challenge",
    title: "Ton business. En live.",
  },
  {
    image: "/hero/live-entrepreneure.jpg",
    position: "50% 30%",
    kicker: "Un téléphone, un live",
    title: "Toute l'Afrique devient ta clientèle.",
  },
  {
    image: "/hero/live-couturier.jpg",
    position: "50% 40%",
    kicker: "Artisans & créateurs",
    title: "De ton atelier à des millions d'écrans.",
  },
  {
    image: "/hero/live-commercante.jpg",
    position: "50% 35%",
    kicker: "Commerçants",
    title: "Du marché d'Adawlato à Paris.",
  },
];

const NAV = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#packages", label: "Packages" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
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
    <section
      ref={sectionRef}
      className="relative isolate flex h-svh min-h-[600px] flex-col overflow-hidden bg-night-950 text-white"
    >
      {/* Photos plein écran : fondu enchaîné + zoom lent */}
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
            style={{ objectPosition: s.position }}
            className={cn("object-cover", (i === active || i === prev) && "animate-kenburns")}
          />
        </div>
      ))}
      {/* Voile sombre du site Bovann Group (#000910) */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-night-950/65" />

      {/* Menu transparent, comme sur bovanngroup.com */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Link href="/" aria-label="OCD Live, accueil">
          <OcdLiveLogo layout="stacked" className="w-20 sm:w-24" />
        </Link>
        <nav aria-label="Menu principal" className="hidden items-center gap-8 lg:flex">
          <Link
            href="/"
            className="border-b-2 border-live pb-1.5 text-sm font-semibold tracking-wide uppercase"
          >
            Accueil
          </Link>
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="border-b-2 border-transparent pb-1.5 text-sm font-semibold tracking-wide text-white/85 uppercase transition hover:border-live hover:text-white"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <Link
          href="/reserver"
          className="rounded bg-live px-4 py-2 text-xs font-semibold tracking-wider uppercase transition hover:bg-live-700 lg:hidden"
        >
          Réserver
        </Link>
      </header>

      {/* Contenu centré */}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 text-center sm:px-8">
        <div key={active} className="flex flex-col items-center">
          <p className="flex animate-rise items-center gap-2.5 text-xs font-semibold tracking-[0.25em] text-white/80 uppercase sm:text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-live" />
            </span>
            {slide.kicker}
          </p>
          <h1
            className="mt-5 animate-rise font-heading text-[2.1rem] leading-[1.1] font-semibold tracking-tight text-balance uppercase sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            {slide.title}
          </h1>
        </div>

        <p className="mt-5 max-w-3xl text-base leading-relaxed text-pretty text-white/85 sm:text-xl">
          Réserve ton passage en live sur le TikTok de{" "}
          <strong className="font-bold text-white">House of Challenge</strong> et présente tes
          produits à toute l&apos;Afrique. En présentiel à Lomé ou à distance.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/reserver?mode=presentiel"
            className="flex min-h-12 w-full items-center justify-center rounded bg-live px-7 text-sm font-semibold tracking-wider uppercase shadow-lg shadow-black/20 transition hover:bg-live-700 sm:w-auto"
          >
            🎥&nbsp;&nbsp;En présentiel au Togo
          </Link>
          <Link
            href="/reserver?mode=distance"
            className="flex min-h-12 w-full items-center justify-center rounded border border-white/70 px-7 text-sm font-semibold tracking-wider uppercase transition hover:border-white hover:bg-white hover:text-night-900 sm:w-auto"
          >
            🌍&nbsp;&nbsp;À distance
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setLiveOpen(true)}
          className="mt-6 inline-flex items-center gap-2 text-sm text-white/75 transition hover:text-white"
        >
          <Camera className="size-4 text-live" aria-hidden />
          <span className="underline decoration-white/30 underline-offset-4 hover:decoration-live">
            Essaie : passe en live avec ta caméra
          </span>
        </button>
      </div>

      {/* Points du slider */}
      <div className="mx-auto mb-8 flex items-center gap-2" role="tablist" aria-label="Photos">
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
                i === active ? "w-10 bg-white" : "w-4 bg-white/40 group-hover:bg-white/80",
              )}
            />
          </button>
        ))}
      </div>

      {liveOpen && <LiveModal onClose={() => setLiveOpen(false)} />}
    </section>
  );
}
