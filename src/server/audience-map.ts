import "server-only";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { countryByName } from "@/lib/countries";
import type { Booking } from "@/lib/types";

/**
 * Carte de l'audience (Espace Bovann) : Afrique + Europe, calculée côté serveur.
 * Le navigateur ne reçoit que des chemins SVG prêts à dessiner.
 */
export const MAP_W = 640;
export const MAP_H = 600;

/** Code ISO alpha-2 → code numérique (identifiant des pays dans world-atlas). */
const NUMERIC: Record<string, number> = {
  TG: 768,
  BJ: 204,
  CI: 384,
  CM: 120,
  SN: 686,
  BF: 854,
  ML: 466,
  NE: 562,
  GN: 324,
  GA: 266,
  CG: 178,
  CD: 180,
  TD: 148,
  CF: 140,
  GQ: 226,
  MR: 478,
  MA: 504,
  DZ: 12,
  TN: 788,
  MG: 450,
  DJ: 262,
  KM: 174,
  BI: 108,
  RW: 646,
  HT: 332,
  GH: 288,
  NG: 566,
  CV: 132,
  GW: 624,
  LR: 430,
  SL: 694,
  GM: 270,
  KE: 404,
  ZA: 710,
  EG: 818,
  FR: 250,
  BE: 56,
  CH: 756,
  LU: 442,
  DE: 276,
  IT: 380,
  ES: 724,
  PT: 620,
  GB: 826,
  NL: 528,
  CA: 124,
  US: 840,
  AE: 784,
  CN: 156,
};

/** Position par défaut d'un pays : sa capitale ou sa ville principale [lon, lat]. */
const CAPITAL: Record<string, [number, number]> = {
  TG: [1.22, 6.13],
  BJ: [2.42, 6.37],
  CI: [-4.01, 5.36],
  CM: [9.7, 4.05],
  SN: [-17.47, 14.72],
  BF: [-1.52, 12.37],
  ML: [-8, 12.64],
  NE: [2.11, 13.51],
  GN: [-13.58, 9.64],
  GA: [9.45, 0.39],
  CG: [15.27, -4.26],
  CD: [15.31, -4.32],
  TD: [15.04, 12.13],
  CF: [18.56, 4.39],
  GQ: [8.78, 3.75],
  MR: [-15.98, 18.09],
  MA: [-6.84, 34.02],
  DZ: [3.06, 36.75],
  TN: [10.18, 36.81],
  MG: [47.52, -18.88],
  DJ: [43.15, 11.59],
  KM: [43.26, -11.7],
  BI: [29.93, -3.43],
  RW: [30.06, -1.94],
  HT: [-72.3, 18.6],
  GH: [-0.19, 5.6],
  NG: [3.38, 6.52],
  CV: [-23.51, 14.93],
  GW: [-15.6, 11.86],
  LR: [-10.8, 6.3],
  SL: [-13.23, 8.48],
  GM: [-16.58, 13.45],
  KE: [36.82, -1.29],
  ZA: [28.05, -26.2],
  EG: [31.24, 30.04],
  FR: [2.35, 48.86],
  BE: [4.35, 50.85],
  CH: [6.14, 46.2],
  LU: [6.13, 49.61],
  DE: [13.4, 52.52],
  IT: [12.5, 41.9],
  ES: [-3.7, 40.42],
  PT: [-9.14, 38.72],
  GB: [-0.13, 51.51],
  NL: [4.9, 52.37],
  CA: [-73.57, 45.5],
  US: [-74, 40.7],
  AE: [55.27, 25.2],
  CN: [116.4, 39.9],
};

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
  paris: [2.35, 48.86],
  lyon: [4.84, 45.76],
  marseille: [5.37, 43.3],
  bruxelles: [4.35, 50.85],
  geneve: [6.14, 46.2],
  londres: [-0.13, 51.51],
  kinshasa: [15.31, -4.32],
  libreville: [9.45, 0.39],
  bamako: [-8, 12.64],
  ouagadougou: [-1.52, 12.37],
  niamey: [2.11, 13.51],
  conakry: [-13.58, 9.64],
  montreal: [-73.57, 45.5],
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const LOME: [number, number] = [1.22, 6.13];

// Projection fixe, cadrée sur l'Afrique et l'Europe.
const projection = geoMercator().fitExtent(
  [
    [10, 10],
    [MAP_W - 10, MAP_H - 10],
  ],
  {
    type: "MultiPoint",
    coordinates: [
      [-19, -35],
      [52, -35],
      [-19, 56],
      [52, 56],
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

export type AudienceMap = {
  countries: { d: string; count: number }[];
  points: { x: number; y: number; city: string; country: string; code: string; count: number }[];
  /** Pays hors du cadre (ex. Canada) : affichés seulement dans le classement. */
  outside: { country: string; code: string; count: number }[];
  hub: { x: number; y: number };
  width: number;
  height: number;
};

export function audienceMap(bookings: Booking[]): AudienceMap {
  const active = bookings.filter((b) => b.status !== "cancelled");
  const byCountry = new Map<number, number>();
  const byCity = new Map<
    string,
    { lonlat: [number, number]; city: string; country: string; code: string; count: number }
  >();
  const outside = new Map<string, { country: string; code: string; count: number }>();

  for (const b of active) {
    const code = countryByName(b.country)?.code;
    if (!code) continue;
    const num = NUMERIC[code];
    if (num) byCountry.set(num, (byCountry.get(num) ?? 0) + 1);
    const lonlat = CITIES[norm(b.city)] ?? CAPITAL[code];
    if (!lonlat) continue;
    const [x, y] = projection(lonlat) ?? [-1, -1];
    if (x < 0 || x > MAP_W || y < 0 || y > MAP_H) {
      const o = outside.get(code) ?? { country: b.country, code, count: 0 };
      o.count++;
      outside.set(code, o);
      continue;
    }
    const key = `${code}:${norm(b.city)}`;
    const c = byCity.get(key) ?? { lonlat, city: b.city, country: b.country, code, count: 0 };
    c.count++;
    byCity.set(key, c);
  }

  const [hx, hy] = projection(LOME)!;
  return {
    countries: shapes.map((s) => ({ d: s.d, count: byCountry.get(s.id) ?? 0 })),
    points: [...byCity.values()]
      .map((c) => {
        const [x, y] = projection(c.lonlat)!;
        return {
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          city: c.city,
          country: c.country,
          code: c.code,
          count: c.count,
        };
      })
      .sort((a, b) => b.count - a.count),
    outside: [...outside.values()],
    hub: { x: Math.round(hx * 10) / 10, y: Math.round(hy * 10) / 10 },
    width: MAP_W,
    height: MAP_H,
  };
}
