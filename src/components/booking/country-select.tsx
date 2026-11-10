"use client";

import {
  AO,
  BF,
  BI,
  BJ,
  BW,
  CD,
  CF,
  CG,
  CI,
  CM,
  CV,
  DJ,
  DZ,
  EG,
  ER,
  ET,
  GA,
  GH,
  GM,
  GN,
  GQ,
  GW,
  KE,
  KM,
  LR,
  LS,
  LY,
  MA,
  MG,
  ML,
  MR,
  MU,
  MW,
  MZ,
  NA,
  NE,
  NG,
  RW,
  SC,
  SD,
  SL,
  SN,
  SO,
  SS,
  ST,
  SZ,
  TD,
  TG,
  TN,
  TZ,
  UG,
  ZA,
  ZM,
  ZW,
} from "country-flag-icons/react/3x2";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { inputClass } from "./ui";

/**
 * Drapeaux en SVG (les drapeaux emoji ne s'affichent pas sur Windows).
 * Seuls les pays de la liste sont importés : le site reste léger.
 */
const FLAGS: Record<string, React.ComponentType<{ className?: string; title?: string }>> = {
  AO,
  BF,
  BI,
  BJ,
  BW,
  CD,
  CF,
  CG,
  CI,
  CM,
  CV,
  DJ,
  DZ,
  EG,
  ER,
  ET,
  GA,
  GH,
  GM,
  GN,
  GQ,
  GW,
  KE,
  KM,
  LR,
  LS,
  LY,
  MA,
  MG,
  ML,
  MR,
  MU,
  MW,
  MZ,
  NA,
  NE,
  NG,
  RW,
  SC,
  SD,
  SL,
  SN,
  SO,
  SS,
  ST,
  SZ,
  TD,
  TG,
  TN,
  TZ,
  UG,
  ZA,
  ZM,
  ZW,
};

export function Flag({ code, className }: { code: string; className?: string }) {
  const F = FLAGS[code];
  if (!F) return <span className={cn("inline-block rounded-sm bg-line", className)} />;
  return <F className={cn("rounded-[3px] shadow-sm ring-1 ring-black/10", className)} />;
}

/** Comparaison sans accents ni majuscules : « cote » trouve « Côte d'Ivoire ». */
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Liste de pays avec drapeaux et recherche (remplace le <select> natif). */
export function CountrySelect({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  /** Nom du pays sélectionné (ex. « Côte d'Ivoire »). */
  value: string;
  onChange: (name: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = countries.find((c) => c.name === value);
  const results = useMemo(
    () => countries.filter((c) => norm(c.name).includes(norm(query.trim()))),
    [query],
  );

  // Fermeture au clic en dehors.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // L'option surlignée reste visible pendant la navigation au clavier.
  useEffect(() => {
    listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  function openList() {
    setQuery("");
    setHighlight(
      Math.max(
        0,
        countries.findIndex((c) => c.name === value),
      ),
    );
    setOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function choose(name: string) {
    onChange(name);
    setOpen(false);
    document.getElementById(id)?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = results[highlight];
      if (c) choose(c.name);
    } else if (e.key === "Escape") {
      setOpen(false);
      document.getElementById(id)?.focus();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openList();
          }
        }}
        className={cn(inputClass, "flex items-center gap-3 text-left")}
      >
        {selected ? (
          <>
            <Flag code={selected.code} className="h-4 w-6 shrink-0" />
            <span className="flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-muted/70">Choisis ton pays</span>
        )}
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted transition", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-2xl">
          <div className="relative border-b border-line">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Rechercher un pays…"
              aria-label="Rechercher un pays"
              aria-controls={listId}
              aria-activedescendant={
                results[highlight] ? `${listId}-${results[highlight].code}` : undefined
              }
              autoComplete="off"
              className="h-12 w-full bg-transparent pr-3 pl-9 text-base text-ink outline-none placeholder:text-muted/70"
            />
          </div>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Pays"
            className="max-h-64 overflow-y-auto py-1"
          >
            {results.map((c, i) => (
              <li
                key={c.code}
                id={`${listId}-${c.code}`}
                role="option"
                aria-selected={c.name === value}
                onPointerEnter={() => setHighlight(i)}
                onClick={() => choose(c.name)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm text-ink",
                  i === highlight && "bg-paper",
                  c.name === value && "font-semibold",
                )}
              >
                <Flag code={c.code} className="h-4 w-6 shrink-0" />
                <span className="flex-1">{c.name}</span>
                {c.name === value && <Check className="size-4 text-live-600" aria-hidden />}
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted">Aucun pays trouvé.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
