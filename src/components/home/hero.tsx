"use client";

import { CalendarClock, ShoppingBag, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { packages, schedule } from "@/config/site";
import { number } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LivePhone, type LiveSlide } from "./live-phone";

/**
 * Les 3 « lives » qui défilent dans le téléphone (dossier public/hero).
 * Les 2e et 3e photos sont temporaires : à remplacer par des visuels OCD Live.
 */
const slides: (LiveSlide & { word: string })[] = [
  {
    word: "Ton business",
    image: "/hero/ocd-live-studio.jpg",
    position: "84% 50%",
    product: { name: "Sérum éclat", price: "8 500 FCFA" },
  },
  {
    word: "Tes produits",
    image: "/hero/hero-bg.jpg",
    position: "66% 30%",
    product: { name: "Coffret karité", price: "12 000 FCFA" },
  },
  {
    word: "Ta marque",
    image: "/hero/working-2.jpg",
    position: "50% 35%",
    product: { name: "Pagne wax premium", price: "15 000 FCFA" },
  },
];

const CITIES = [
  "Lomé",
  "Abidjan",
  "Dakar",
  "Douala",
  "Cotonou",
  "Kinshasa",
  "Bamako",
  "Libreville",
  "Ouagadougou",
  "Niamey",
  "Conakry",
  "Paris",
  "Bruxelles",
  "Montréal",
];

const ORDERS = ["Abidjan", "Lomé", "Dakar", "Douala", "Paris", "Cotonou"];
const INTERVAL = 6500;
const minPrice = Math.min(...packages.map((p) => p.price));

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

/** Jours restants avant le lancement (calculé dans le navigateur uniquement). */
function useDaysToLaunch() {
  return useSyncExternalStore(
    () => () => {},
    () => Math.ceil((Date.parse(`${schedule.firstDay}T10:00:00Z`) - Date.now()) / 86_400_000),
    () => null,
  );
}

/** Notification flottante « Nouvelle commande ». */
function OrderToast({ running }: { running: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setI((x) => x + 1), 3400);
    return () => clearInterval(id);
  }, [running]);
  return (
    <div
      key={i}
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 text-night-900 shadow-2xl shadow-black/40",
        running && "animate-toast",
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <ShoppingBag className="size-4.5" />
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-bold">Nouvelle commande</span>
        <span className="block text-xs whitespace-nowrap text-muted">
          depuis {ORDERS[i % ORDERS.length]} · à l&apos;instant
        </span>
      </span>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const running = useLiveRunning(sectionRef);
  const days = useDaysToLaunch();
  const [{ active, prev }, setState] = useState<{ active: number; prev: number | null }>({
    active: 0,
    prev: null,
  });

  const go = (i: number) => setState((s) => (s.active === i ? s : { active: i, prev: s.active }));

  // Changement de « live » toutes les 6,5 s (redémarre après un clic sur un point).
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
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-night-950 text-white">
      {/* Fond : photo minuscule floutée (540 octets) + voile + trame de points */}
      <Image
        src="/hero/studio-ambiance.jpg"
        alt=""
        aria-hidden
        fill
        unoptimized
        className="-z-30 scale-110 object-cover opacity-40 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-night-950/60 via-night-950/75 to-night-950"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 opacity-60"
        style={{
          backgroundImage: "radial-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

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

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-4 pb-12 sm:px-8 lg:min-h-[620px] lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-4 lg:pt-6 lg:pb-16">
        {/* Texte */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <CalendarClock className="size-4 text-live" aria-hidden />
            Lancement le 1er décembre
            {days !== null && days > 0 && (
              <span className="rounded-full bg-live px-2 py-0.5 text-[11px] font-bold text-white">
                J-{days}
              </span>
            )}
          </p>

          <h1 className="mt-6 font-display font-extrabold tracking-tight">
            <span
              key={slide.word}
              className="block animate-rise text-[2.7rem] leading-none sm:text-6xl lg:text-7xl"
            >
              {slide.word}
            </span>
            <span className="mt-3 inline-block -skew-x-[10deg] bg-live px-4 pt-1 pb-2 shadow-2xl shadow-live/30 sm:px-6">
              <span className="inline-block skew-x-[10deg] text-[3.7rem] leading-none italic sm:text-8xl lg:text-[8rem]">
                EN LIVE.
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
            <strong className="font-semibold text-white">Devant toute l&apos;Afrique</strong>, sur
            le TikTok de House of Challenge. En présentiel à Lomé ou depuis chez toi.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
              className="flex min-h-15 items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/10 px-6 text-[1.05rem] font-bold whitespace-nowrap backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.98]"
            >
              <span aria-hidden className="text-xl">
                🌍
              </span>
              À distance
            </Link>
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/65">
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-gold" aria-hidden />
              Réservation en 3 minutes
            </span>
            <span>Dès {number(minPrice)} FCFA</span>
            <span>Présentiel ou à distance</span>
          </p>
        </div>

        {/* Téléphone en direct */}
        <div className="relative mx-auto w-[min(66vw,250px)] sm:w-[270px] lg:w-[300px]">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -z-10 size-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-live/30 blur-3xl"
          />
          <div className="lg:rotate-[4deg]">
            <div className={cn(running && "animate-phone-float")}>
              <LivePhone slides={slides} active={active} prev={prev} running={running} />
            </div>
          </div>

          <div aria-hidden className="absolute top-[22%] -left-[62%] hidden sm:block">
            <OrderToast running={running} />
          </div>
          <div
            aria-hidden
            className="absolute -right-[18%] bottom-[24%] hidden rounded-2xl bg-night-900/90 px-4 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-md sm:block"
          >
            <p className="font-display text-2xl leading-none font-extrabold">+2 314</p>
            <p className="mt-1 text-xs text-white/70">abonnés gagnés</p>
          </div>

          <div
            className="mt-8 flex justify-center gap-2"
            role="tablist"
            aria-label="Lives en démonstration"
          >
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Live ${i + 1} : ${s.word}`}
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

      {/* Bandeau des villes qui défile : « devant toute l'Afrique » */}
      <div className="border-t border-white/10 bg-night-950/60 py-4">
        <p className="sr-only">Des spectateurs dans toute l&apos;Afrique et la diaspora.</p>
        <div
          aria-hidden
          className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
        >
          <div className={cn("flex shrink-0 gap-8 pr-8", running && "animate-marquee")}>
            {[...CITIES, ...CITIES].map((c, i) => (
              <span
                key={i}
                className="flex items-center gap-8 font-display text-sm font-bold tracking-[0.2em] whitespace-nowrap text-white/55 uppercase"
              >
                {c}
                <span className="size-1.5 rounded-full bg-live" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
