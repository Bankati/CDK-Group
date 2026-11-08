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
import { CalendarClock, ShoppingBag, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { packages, schedule } from "@/config/site";
import { number } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LivePhone, type LiveProduct } from "./live-phone";

/** Visuel du live affiché dans le téléphone (dossier public/hero) et son cadrage. */
const LIVE_IMAGE = { src: "/hero/ocd-live-studio.jpg", position: "62% 50%" };

/** Pendant le live, les produits présentés défilent, et le mot du titre change avec eux. */
const slides: { word: string; product: LiveProduct }[] = [
  { word: "Ton business", product: { name: "Sérum éclat", price: "8 500 FCFA" } },
  { word: "Tes produits", product: { name: "Crème au karité", price: "6 000 FCFA" } },
  { word: "Ta marque", product: { name: "Coffret soin visage", price: "15 000 FCFA" } },
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
function OrderToast({ running, brand }: { running: boolean; brand: string }) {
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
        <span className="block max-w-56 truncate text-[13px] font-bold">
          {brand ? `Nouvelle commande pour ${brand}` : "Nouvelle commande"}
        </span>
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
  const [active, setActive] = useState(0);
  // Le visiteur écrit le nom de son business : il passe « en live » dans le hero.
  const [brand, setBrand] = useState("");
  const [liveBrand, setLiveBrand] = useState("");
  const typed = brand.trim();

  // Produit suivant toutes les 6,5 s (en pause quand le visiteur a écrit son business).
  useEffect(() => {
    if (!running || typed) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slides.length), INTERVAL);
    return () => clearInterval(id);
  }, [active, running, typed]);

  // Le live réagit (cœurs, spectateurs, commentaires) quand le visiteur s'arrête de taper.
  useEffect(() => {
    const t = setTimeout(() => setLiveBrand(typed), 450);
    return () => clearTimeout(t);
  }, [typed]);

  const slide = slides[active]!;
  const headline = typed || slide.word;
  const headlineSize =
    headline.length <= 14
      ? "text-[2.7rem] sm:text-6xl lg:text-7xl"
      : headline.length <= 24
        ? "text-[2.1rem] sm:text-5xl lg:text-6xl"
        : "text-[1.7rem] sm:text-4xl lg:text-5xl";
  const business = typed ? `&business=${encodeURIComponent(typed)}` : "";

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
              key={typed ? "brand" : slide.word}
              className={cn("block animate-rise leading-[1.05] break-words", headlineSize)}
            >
              {headline}
            </span>
            <span className="mt-3 inline-block -skew-x-[10deg] bg-live px-4 pt-1 pb-2 shadow-2xl shadow-live/30 sm:px-6">
              <span className="inline-block skew-x-[10deg] text-[3.7rem] leading-none italic sm:text-8xl lg:text-[8rem]">
                EN LIVE.
              </span>
            </span>
          </h1>

          {/* L'effet « waouh » : le visiteur voit son propre business passer en live */}
          <div className="mt-7 max-w-md">
            <label htmlFor="hero-business" className="text-sm font-semibold text-white/80">
              Essaie&nbsp;: écris le nom de ton business
            </label>
            <div className="relative mt-2">
              <Sparkles
                className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-gold"
                aria-hidden
              />
              <input
                id="hero-business"
                value={brand}
                onChange={(e) => setBrand(e.target.value.slice(0, 40))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                    document
                      .getElementById("ton-live")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                placeholder="Ex. Afi Cosmétiques"
                autoComplete="organization"
                enterKeyHint="go"
                className="min-h-14 w-full rounded-2xl border border-white/20 bg-white/10 pr-4 pl-12 text-lg font-semibold text-white backdrop-blur-sm transition outline-none placeholder:font-normal placeholder:text-white/45 focus:border-live focus:bg-white/15 focus:ring-4 focus:ring-live/25"
              />
            </div>
            <p className="mt-2 min-h-5 text-sm text-white/65" aria-live="polite">
              {liveBrand ? (
                <>
                  <strong className="text-white">{liveBrand}</strong> est en direct devant toute
                  l&apos;Afrique.{" "}
                  <a
                    href="#ton-live"
                    className="font-semibold text-white underline underline-offset-4 lg:hidden"
                  >
                    Regarde ton live ↓
                  </a>
                </>
              ) : (
                <>Devant toute l&apos;Afrique, sur le TikTok de House of Challenge.</>
              )}
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/reserver?mode=presentiel${business}`}
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
              href={`/reserver?mode=distance${business}`}
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
        <div
          id="ton-live"
          className="relative mx-auto w-[min(66vw,250px)] scroll-mt-6 sm:w-[270px] lg:w-[300px]"
        >
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -z-10 size-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-live/30 blur-3xl"
          />
          <div className="lg:rotate-[4deg]">
            <div className={cn(running && "animate-phone-float")}>
              <LivePhone
                image={LIVE_IMAGE.src}
                position={LIVE_IMAGE.position}
                product={slide.product}
                productKey={active}
                running={running}
                brand={liveBrand}
              />
            </div>
          </div>

          <div aria-hidden className="absolute top-[22%] -left-[62%] hidden sm:block">
            <OrderToast running={running} brand={liveBrand} />
          </div>
          <div
            aria-hidden
            className="absolute -right-[18%] bottom-[24%] hidden rounded-2xl bg-night-900/90 px-4 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-md sm:block"
          >
            <p className="font-display text-2xl leading-none font-extrabold">+2 314</p>
            <p className="mt-1 text-xs text-white/70">abonnés gagnés</p>
          </div>

          <div
            className={cn(
              "mt-8 flex justify-center gap-2 transition-opacity",
              typed && "invisible opacity-0",
            )}
            role="tablist"
            aria-label="Produits présentés dans le live"
          >
            {slides.map((s, i) => (
              <button
                key={s.word}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Produit ${i + 1} : ${s.product.name}`}
                onClick={() => setActive(i)}
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
    </section>
  );
}
