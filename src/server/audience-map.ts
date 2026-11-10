import "server-only";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { countries, countryByName } from "@/lib/countries";
import type { Booking } from "@/lib/types";

/**
 * Carte de l'audience (Espace Bovann) : l'Afrique, calculée côté serveur.
 * Le navigateur ne reçoit que des chemins SVG prêts à dessiner.
 */
export const MAP_W = 640;
export const MAP_H = 600;

/** Code ISO alpha-2 → code numérique (identifiant des pays dans world-atlas). */
const NUMERIC: Record<string, number> = Object.fromEntries(
  countries.map((c) => [c.code, c.numeric]),
);

/** Position par défaut d'un pays : sa capitale [lon, lat]. */
const CAPITAL: Record<string, [number, number]> = Object.fromEntries(
  countries.map((c) => [c.code, c.capital]),
);

/** Grandes villes connues (sinon : capitale du pays). */
const CITIES: Record<string, [number, number]> = {
  lome: [1.22, 6.13],
  kara: [1.19, 9.55],
  abidjan: [-4.01, 5.36],
  douala: [9.7, 4.05],
  yaounde: [11.5, 3.87],
  dakar: [-17.47, 14.72],
  cotonou: [2.42, 6.37],
  "porto-novo": [2.63, 6.5],
  accra: [-0.19, 5.6],
  lagos: [3.38, 6.52],
  abuja: [7.49, 9.07],
  kinshasa: [15.31, -4.32],
  libreville: [9.45, 0.39],
  bamako: [-8, 12.64],
  ouagadougou: [-1.52, 12.37],
  niamey: [2.11, 13.51],
  conakry: [-13.58, 9.64],
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const LOME: [number, number] = [1.22, 6.13];

// Projection fixe, cadrée sur l'Afrique (du Cap-Vert à Maurice, de Tunis au Cap).
const projection = geoMercator().fitExtent(
  [
    [10, 10],
    [MAP_W - 10, MAP_H - 10],
  ],
  {
    type: "MultiPoint",
    coordinates: [
      [-26, -36],
      [60, -36],
      [-26, 38],
      [60, 38],
    ],
  },
);
const path = geoPath(projection);

type CountryShape = { id: number; d: string };

// Formes des pays, calculées une seule fois.
const shapes: CountryShape[] = (() => {
  const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
  const fc = feature(topo, topo.objects.countries);
  return fc.features
    .map((f) => {
      const [x, y] = path.centroid(f as GeoPermissibleObjects);
      // On ne garde que ce qui est (à peu près) dans le cadre.
      if (!Number.isFinite(x) || x < -200 || x > MAP_W + 200 || y < -200 || y > MAP_H + 200)
        return null;
      const d = path(f as GeoPermissibleObjects);
      return d ? { id: Number(f.id), d } : null;
    })
    .filter((s): s is CountryShape => s !== null);
})();

/** Code numérique → ISO alpha-2 (pour colorer les pays côté navigateur). */
const ALPHA2 = Object.fromEntries(Object.entries(NUMERIC).map(([a, n]) => [n, a])) as Record<
  number,
  string
>;

export type AudienceMap = {
  /** Formes des pays (code ISO si c'est un pays de la liste OCD Live). */
  shapes: { d: string; code?: string }[];
  /** Une position par réservation : le navigateur filtre selon la période choisie. */
  spots: {
    id: string;
    x: number;
    y: number;
    /** Faux si la ville est hors du cadre de la carte. */
    inside: boolean;
    city: string;
    country: string;
    code: string;
  }[];
  hub: { x: number; y: number };
  width: number;
  height: number;
};

export function audienceMap(bookings: Booking[]): AudienceMap {
  const spots: AudienceMap["spots"] = [];
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const code = countryByName(b.country)?.code;
    if (!code) continue;
    const lonlat = CITIES[norm(b.city)] ?? CAPITAL[code];
    if (!lonlat) continue;
    const [x, y] = projection(lonlat) ?? [-1, -1];
    spots.push({
      id: b.id,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      inside: x >= 0 && x <= MAP_W && y >= 0 && y <= MAP_H,
      city: b.city,
      country: b.country,
      code,
    });
  }
  const [hx, hy] = projection(LOME)!;
  return {
    shapes: shapes.map((sh) => ({ d: sh.d, code: ALPHA2[sh.id] })),
    spots,
    hub: { x: Math.round(hx * 10) / 10, y: Math.round(hy * 10) / 10 },
    width: MAP_W,
    height: MAP_H,
  };
}
