"use client";

import { Check, Eye, Heart, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { number } from "@/lib/format";
import { cn } from "@/lib/utils";

export type LiveProduct = { name: string; price: string };

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

/** Quand le visiteur écrit le nom de son business, les spectateurs parlent de lui. */
const brandComments = (b: string) => [
  { name: "Aminata", city: "Dakar", text: `${b}, je prends 2 🔥` },
  { name: "Fatou", city: "Abidjan", text: `Bravo ${b} 👏👏` },
  { name: "Kossi", city: "Lomé", text: `C'est où ${b} ? Je passe ce soir` },
  { name: "Yannick", city: "Paris", text: `${b} livre en France ?` },
  { name: "Nadège", city: "Douala", text: `Commande passée chez ${b} ✅` },
  { name: "Serge", city: "Kinshasa", text: `Abonné à ${b} ! 🙌` },
];

const HEART_COLORS = ["#dc0c15", "#ff4d6d", "#ffffff", "#ff8fa3"];

/** Le compteur de spectateurs grimpe doucement, et bondit quand un business passe en live. */
function Viewers({ running, boost }: { running: boolean; boost: string }) {
  const [count, setCount] = useState(8412);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setCount((c) => c + 3 + Math.floor(Math.random() * 38)), 1200);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (!boost) return;
    const t = setTimeout(() => setCount((c) => c + 900 + Math.floor(Math.random() * 700)), 200);
    return () => clearTimeout(t);
  }, [boost]);
  return <span className="tabular-nums">{number(count)}</span>;
}

/** Les commentaires arrivent un par un, les plus anciens s'effacent. */
function Comments({ running, brand }: { running: boolean; brand: string }) {
  const [start, setStart] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setStart((s) => s + 1), 2100);
    return () => clearInterval(id);
  }, [running]);
  const list = brand ? brandComments(brand) : COMMENTS;
  const visible = [0, 1, 2].map((i) => ({
    n: start + i,
    c: list[(start + i) % list.length]!,
  }));
  return (
    <ul className="space-y-1.5">
      {visible.map(({ n, c }, i) => (
        <li
          key={`${brand}-${n}`}
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

/** Pluie de cœurs (12 à l'écran), qui explose quand un business passe en live (`burst`). */
function Hearts({ running, burst }: { running: boolean; burst: string }) {
  const [hearts, setHearts] = useState<{ id: number; x: number; color: string; ms: number }[]>([]);
  const next = useRef(0);
  const add = (max: number) =>
    setHearts((h) => [
      ...h.slice(-(max - 1)),
      {
        id: next.current++,
        x: Math.round(Math.random() * 56 - 38),
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]!,
        ms: 2000 + Math.round(Math.random() * 1600),
      },
    ]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => add(12), 420);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (!burst || !running) return;
    const id = setInterval(() => add(32), 70);
    const stop = setTimeout(() => clearInterval(id), 2200);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [burst, running]);
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
  image,
  position,
  product,
  productKey,
  running,
  brand = "",
}: {
  /** Visuel du live (une seule image : c'est un seul direct). */
  image: string;
  /** Cadrage de la photo dans l'écran vertical du téléphone. */
  position: string;
  /** Produit présenté en ce moment (change pendant le live). */
  product: LiveProduct;
  productKey: number;
  running: boolean;
  /** Nom du business tapé par le visiteur : il passe « en live » dans le téléphone. */
  brand?: string;
}) {
  const account = site.liveAccount;
  return (
    <div
      aria-hidden
      className="relative aspect-[9/19] w-full rounded-[2.6rem] bg-black p-[9px] shadow-2xl ring-1 shadow-black/60 ring-white/15"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-night-950">
        <Image
          src={image}
          alt=""
          fill
          // Photo paysage dans un écran vertical : elle est agrandie ~3,5×, il faut donc une image plus large que le téléphone.
          sizes="(min-width: 1024px) 1080px, 750px"
          preload
          style={{
            objectPosition: position,
            // Zoom lent et continu, comme une caméra qui respire ; en pause si le hero n'est pas visible.
            animation: "kenburns 14s ease-in-out infinite alternate",
            animationPlayState: running ? "running" : "paused",
          }}
          className="object-cover"
        />
        {/* Dégradés pour la lisibilité de l'interface */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {/* Encoche */}
        <div className="absolute top-2 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

        {/* Haut : compte + LIVE + spectateurs */}
        <div className="absolute inset-x-3 top-10 flex items-center justify-between gap-2 text-white">
          <div className="flex min-w-0 items-center gap-1.5 rounded-full bg-black/35 py-1 pr-1 pl-1 backdrop-blur-sm">
            <Image
              src={account.avatar}
              alt=""
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-full object-cover ring-1 ring-white/40"
            />
            <span className="min-w-0 leading-tight">
              <span className="flex items-center gap-1 text-[10px] font-bold">
                <span className="truncate">{account.handle}</span>
                {/* Badge « compte certifié » */}
                <span className="flex size-3 shrink-0 items-center justify-center rounded-full bg-[#20d5ec]">
                  <Check className="size-2 text-white" strokeWidth={4} />
                </span>
              </span>
              <span className="block text-[9px] whitespace-nowrap text-white/75">
                {account.followers} followers
              </span>
            </span>
            <span className="hidden size-5 shrink-0 items-center justify-center rounded-full bg-live sm:flex">
              <Plus className="size-3" strokeWidth={3} />
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide">
              LIVE
            </span>
            <span className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
              <Eye className="size-3" />
              <Viewers running={running} boost={brand} />
            </span>
          </div>
        </div>

        {/* Bas : commentaires, produit, barre de saisie */}
        <div className="absolute inset-x-3 bottom-3 text-white">
          <div className="w-[78%]">
            <Comments running={running} brand={brand} />
          </div>
          <div
            key={brand || productKey}
            className="mt-2.5 flex animate-rise items-center gap-2 rounded-xl bg-white p-1.5 pr-2 text-night-900 shadow-lg"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-live/10 text-live">
              <ShoppingBag className="size-4" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[11px] font-bold">{brand || product.name}</span>
              <span className="block text-[10px] text-muted">
                {brand ? "En direct maintenant" : product.price}
              </span>
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

        <Hearts running={running} burst={brand} />
      </div>
    </div>
  );
}
