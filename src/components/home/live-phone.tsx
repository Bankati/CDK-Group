"use client";

import { Eye, Heart, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { OcdSymbol } from "@/components/brand";
import { number } from "@/lib/format";
import { cn } from "@/lib/utils";

export type LiveSlide = {
  image: string;
  /** Cadrage de la photo dans l'écran vertical du téléphone. */
  position: string;
  product: { name: string; price: string };
};

/** Commentaires fictifs : des spectateurs de toute l'Afrique et de la diaspora. */
const COMMENTS = [
  { name: "Aminata", city: "Dakar", text: "Je prends 2 pots 🔥" },
  { name: "Kossi", city: "Lomé", text: "Vous livrez à Kara ?" },
  { name: "Grâce", city: "Cotonou", text: "Trop beau ce produit 😍" },
  { name: "Moussa", city: "Bamako", text: "C'est combien le coffret ?" },
  { name: "Nadège", city: "Douala", text: "Commande passée ✅" },
  { name: "Yannick", city: "Paris", text: "Vous livrez en France ?" },
  { name: "Fatou", city: "Abidjan", text: "Bravo Bovann 👏👏" },
  { name: "Christelle", city: "Libreville", text: "Je partage à mes amies !" },
  { name: "Serge", city: "Kinshasa", text: "Lien de la boutique svp" },
];

const HEART_COLORS = ["#dc0c15", "#ff4d6d", "#ffffff", "#ff8fa3"];

/** Le compteur de spectateurs grimpe doucement. */
function Viewers({ running }: { running: boolean }) {
  const [count, setCount] = useState(8412);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setCount((c) => c + 3 + Math.floor(Math.random() * 38)), 1200);
    return () => clearInterval(id);
  }, [running]);
  return <span className="tabular-nums">{number(count)}</span>;
}

/** Les commentaires arrivent un par un, les plus anciens s'effacent. */
function Comments({ running }: { running: boolean }) {
  const [start, setStart] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setStart((s) => s + 1), 2100);
    return () => clearInterval(id);
  }, [running]);
  const visible = [0, 1, 2].map((i) => ({
    n: start + i,
    c: COMMENTS[(start + i) % COMMENTS.length]!,
  }));
  return (
    <ul className="space-y-1.5">
      {visible.map(({ n, c }, i) => (
        <li
          key={n}
          className={cn(
            "w-fit max-w-full animate-rise rounded-2xl bg-black/35 px-2.5 py-1.5 text-[11px] leading-snug text-white backdrop-blur-sm",
            i === 0 && "opacity-60",
          )}
        >
          <span className="font-semibold text-white/75">
            {c.name} · {c.city}
          </span>
          <br />
          {c.text}
        </li>
      ))}
    </ul>
  );
}

/** Pluie de cœurs (12 maximum à l'écran). */
function Hearts({ running }: { running: boolean }) {
  const [hearts, setHearts] = useState<{ id: number; x: number; color: string; ms: number }[]>([]);
  const next = useRef(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setHearts((h) => [
        ...h.slice(-11),
        {
          id: next.current++,
          x: Math.round(Math.random() * 46 - 30),
          color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]!,
          ms: 2200 + Math.round(Math.random() * 1400),
        },
      ]);
    }, 420);
    return () => clearInterval(id);
  }, [running]);
  return (
    <div className="pointer-events-none absolute right-3 bottom-16 h-0 w-8">
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="absolute bottom-0 left-1 size-6 drop-shadow"
          style={
            {
              color: h.color,
              fill: h.color,
              "--x": `${h.x}px`,
              animation: `heart-float ${h.ms}ms ease-out forwards`,
            } as React.CSSProperties
          }
          onAnimationEnd={() => setHearts((all) => all.filter((x) => x.id !== h.id))}
        />
      ))}
    </div>
  );
}

/** Téléphone qui diffuse un live : photos en fondu dans l'écran + interface du direct. */
export function LivePhone({
  slides,
  active,
  prev,
  running,
}: {
  slides: LiveSlide[];
  active: number;
  prev: number | null;
  running: boolean;
}) {
  const product = slides[active]!.product;
  return (
    <div
      aria-hidden
      className="relative aspect-[9/19] w-full rounded-[2.6rem] bg-black p-[9px] shadow-2xl ring-1 shadow-black/60 ring-white/15"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-night-950">
        {slides.map((s, i) => (
          <div
            key={s.image}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1200ms]",
              i === active ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={s.image}
              alt=""
              fill
              // Photo paysage dans un écran vertical : elle est agrandie ~3,5×, il faut donc une image plus large que le téléphone.
              sizes="(min-width: 1024px) 1080px, 750px"
              preload={i === 0}
              style={{ objectPosition: s.position }}
              className={cn("object-cover", (i === active || i === prev) && "animate-kenburns")}
            />
          </div>
        ))}
        {/* Dégradés pour la lisibilité de l'interface */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {/* Encoche */}
        <div className="absolute top-2 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

        {/* Haut : compte + LIVE + spectateurs */}
        <div className="absolute inset-x-3 top-10 flex items-center justify-between gap-2 text-white">
          <div className="flex min-w-0 items-center gap-1.5 rounded-full bg-black/35 py-1 pr-1 pl-1 backdrop-blur-sm">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-night-900 ring-1 ring-white/30">
              <OcdSymbol className="w-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[10px] font-bold">houseofchallenge</span>
              <span className="block text-[9px] text-white/75">OCD Live</span>
            </span>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-live">
              <Plus className="size-3" strokeWidth={3} />
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide">
              LIVE
            </span>
            <span className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
              <Eye className="size-3" />
              <Viewers running={running} />
            </span>
          </div>
        </div>

        {/* Bas : commentaires, produit, barre de saisie */}
        <div className="absolute inset-x-3 bottom-3 text-white">
          <div className="w-[78%]">
            <Comments running={running} />
          </div>
          <div
            key={active}
            className="mt-2.5 flex animate-rise items-center gap-2 rounded-xl bg-white p-1.5 pr-2 text-night-900 shadow-lg"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-live/10 text-live">
              <ShoppingBag className="size-4" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[11px] font-bold">{product.name}</span>
              <span className="block text-[10px] text-muted">{product.price}</span>
            </span>
            <span className="rounded-md bg-live px-2 py-1 text-[10px] font-bold text-white">
              Acheter
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 rounded-full bg-white/15 px-3 py-1.5 text-[10px] text-white/70 backdrop-blur-sm">
              Ajoute un commentaire…
            </span>
            <Heart className="size-5 fill-live text-live" />
          </div>
        </div>

        <Hearts running={running} />
      </div>
    </div>
  );
}
