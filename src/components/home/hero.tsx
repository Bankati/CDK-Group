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
import { CalendarClock, Camera, Crown, Download, ShoppingBag, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OcdLiveLogo } from "@/components/brand";
import { packages, schedule, site } from "@/config/site";
import { number } from "@/lib/format";
import { makeLiveSnapshot } from "@/lib/live-snapshot";
import { cn } from "@/lib/utils";
import { GUEST_COMMENTS, LivePhone, type LiveProduct } from "./live-phone";

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

type CamState =
  { status: "off" | "asking" | "denied" | "unavailable" } | { status: "on"; stream: MediaStream };

/**
 * « Rejoins le live » : la caméra frontale du visiteur s'affiche dans le téléphone.
 * Le flux reste sur l'appareil : rien n'est envoyé ni enregistré.
 */
function useGuestCamera() {
  const [cam, setCam] = useState<CamState>({ status: "off" });
  const streamRef = useRef<MediaStream | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCam({ status: "off" });
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      setCam({ status: "unavailable" });
      return;
    }
    setCam({ status: "asking" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCam({ status: "on", stream });
    } catch (e) {
      const denied = e instanceof DOMException && e.name === "NotAllowedError";
      setCam({ status: denied ? "denied" : "unavailable" });
    }
  };

  // La caméra s'éteint si on quitte la page ou si l'onglet passe en arrière-plan.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && streamRef.current) stop();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { cam, start, stop };
}

/** Notification flottante : commandes, ou Bovann qui rejoint le live du visiteur. */
function Toast({ running, guest }: { running: boolean; guest: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setI((x) => x + 1), 3400);
    return () => clearInterval(id);
  }, [running]);
  return (
    <div
      key={`${guest}-${i}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 text-night-900 shadow-2xl shadow-black/40",
        running && "animate-toast",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl",
          guest ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
        )}
      >
        {guest ? <Crown className="size-4.5" /> : <ShoppingBag className="size-4.5" />}
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-bold whitespace-nowrap">
          {guest ? `${site.liveAccount.handle} a rejoint ton live` : "Nouvelle commande"}
        </span>
        <span className="block text-xs whitespace-nowrap text-muted">
          {guest
            ? "8M followers te découvrent"
            : `depuis ${ORDERS[i % ORDERS.length]} · à l'instant`}
        </span>
      </span>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const running = useLiveRunning(sectionRef);
  const days = useDaysToLaunch();
  const { cam, start, stop } = useGuestCamera();
  const guest = cam.status === "on";
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);

  // Produit suivant toutes les 6,5 s (en pause pendant que le visiteur est en live).
  useEffect(() => {
    if (!running || guest) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slides.length), INTERVAL);
    return () => clearInterval(id);
  }, [active, running, guest]);

  // Branche la caméra du visiteur sur la vidéo du téléphone.
  const stream = cam.status === "on" ? cam.stream : null;
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) void v.play().catch(() => {});
  }, [stream]);

  const slide = slides[active]!;

  async function joinLive() {
    await start();
    // Sur téléphone, le live est sous le texte : on y descend.
    document.getElementById("ton-live")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /** Photo de live au format story, partagée sur WhatsApp (mobile) ou téléchargée. */
  async function savePhoto() {
    const video = videoRef.current;
    if (!video) return;
    setSaving(true);
    try {
      const blob = await makeLiveSnapshot(video, {
        viewers: document.getElementById("live-viewers")?.textContent ?? "10 000",
        comments: GUEST_COMMENTS.slice(0, 3).map((c) => ({
          who: `${c.name} · ${c.city}`,
          text: c.text,
        })),
        site: window.location.host,
      });
      const file = new File([blob], "moi-en-live-ocd.jpg", { type: "image/jpeg" });
      // Sur téléphone : feuille de partage (WhatsApp, statut…). Sur ordinateur : téléchargement.
      const touch = window.matchMedia("(pointer: coarse)").matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Moi, en live sur OCD Live",
          text: `Moi, en live devant toute l'Afrique 🔥 Réserve ton live : ${window.location.origin}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch {
      /* partage annulé par le visiteur : rien à faire */
    } finally {
      setSaving(false);
    }
  }

  const camMessage =
    cam.status === "denied"
      ? "Caméra refusée. Pas de souci : réserve ton vrai live 😉"
      : cam.status === "unavailable"
        ? "La caméra n'est pas disponible ici (elle s'active sur le site en ligne, en https)."
        : null;

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
              key={guest ? "toi" : slide.word}
              className="block animate-rise text-[2.7rem] leading-none sm:text-6xl lg:text-7xl"
            >
              {guest ? "C'est toi" : slide.word}
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

          {!guest && (
            <button
              type="button"
              onClick={joinLive}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white decoration-live decoration-2 underline-offset-4 hover:underline"
            >
              <Camera className="size-4 text-live" aria-hidden />
              Ou essaie maintenant&nbsp;: rejoins le live avec ta caméra
            </button>
          )}
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
            <div className={cn(running && !guest && "animate-phone-float")}>
              <div className="relative">
                <LivePhone
                  image={LIVE_IMAGE.src}
                  position={LIVE_IMAGE.position}
                  product={slide.product}
                  productKey={active}
                  running={running}
                  stream={guest ? cam.stream : null}
                  videoRef={videoRef}
                />
                {/* Le bouton qui surprend : rejoindre le live avec sa propre caméra */}
                {!guest && (
                  <div className="absolute inset-x-0 top-[44%] flex justify-center">
                    <button
                      type="button"
                      onClick={joinLive}
                      disabled={cam.status === "asking"}
                      className="group relative flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-night-900 shadow-2xl shadow-black/50 transition hover:scale-105 active:scale-95 disabled:opacity-80"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 -z-10 animate-ping rounded-full bg-white/50"
                      />
                      <Camera className="size-5 text-live" aria-hidden />
                      {cam.status === "asking" ? "Ouverture…" : "Rejoins le live"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div aria-hidden className="absolute top-[22%] -left-[62%] hidden sm:block">
            <Toast running={running} guest={guest} />
          </div>
          <div
            aria-hidden
            className="absolute -right-[18%] bottom-[24%] hidden rounded-2xl bg-night-900/90 px-4 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-md sm:block"
          >
            <p className="font-display text-2xl leading-none font-extrabold">+2 314</p>
            <p className="mt-1 text-xs text-white/70">abonnés gagnés</p>
          </div>

          {/* Sous le téléphone : choix des produits, ou actions du mode « en live » */}
          {guest ? (
            <div className="mt-6 flex animate-rise flex-col items-center gap-2">
              <button
                type="button"
                onClick={savePhoto}
                disabled={saving}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 font-bold whitespace-nowrap text-night-900 shadow-xl transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-70"
              >
                <Download className="size-5 text-live" aria-hidden />
                {saving ? "Préparation…" : "Ma photo de live"}
              </button>
              <button
                type="button"
                onClick={stop}
                className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
              >
                <X className="size-4" aria-hidden /> Quitter le live
              </button>
              <p className="text-center text-[11px] text-white/45">
                Ta caméra reste sur ton appareil : rien n&apos;est enregistré ni envoyé.
              </p>
            </div>
          ) : (
            <>
              {camMessage && (
                <p role="status" className="mt-5 text-center text-sm text-white/75">
                  {camMessage}
                </p>
              )}
              <div
                className="mt-6 flex justify-center gap-2"
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
            </>
          )}
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
