/**
 * Repères de la carte du hero (public/hero/afrique-continent.svg, viewBox 600 × 640).
 * Généré à partir de world-atlas (projection de Mercator) : ne pas modifier à la main.
 */
export const AFRICA_VIEWBOX = { w: 600, h: 640 } as const;

/** Lomé, où se trouve le studio. */
export const LOME = { x: 172.4, y: 282.6 } as const;

/** Capitales reliées au studio par les faisceaux du live. */
export const AUDIENCE = [
  { code: "SN", name: "Sénégal", x: 20.3, y: 211.5 },
  { code: "CI", name: "Côte d'Ivoire", x: 129.8, y: 288.9 },
  { code: "NG", name: "Nigeria", x: 190, y: 279.4 },
  { code: "CD", name: "RD Congo", x: 287.1, y: 367.8 },
  { code: "KE", name: "Kenya", x: 462.1, y: 343.1 },
  { code: "ZA", name: "Afrique du Sud", x: 390.7, y: 553.7 },
  { code: "EG", name: "Égypte", x: 416.7, y: 76.1 },
  { code: "MA", name: "Maroc", x: 106.8, y: 37.9 },
  { code: "ET", name: "Éthiopie", x: 477.8, y: 258.8 },
  { code: "MG", name: "Madagascar", x: 549.2, y: 489.1 },
  { code: "CM", name: "Cameroun", x: 241.4, y: 299.6 },
  { code: "AO", name: "Angola", x: 270.1, y: 404.8 },
] as const;
