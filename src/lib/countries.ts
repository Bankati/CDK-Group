/**
 * Pays proposés : les 54 pays d'Afrique, et seulement eux.
 * L'Afrique francophone en tête, puis le reste du continent par ordre alphabétique.
 */
export type Country = {
  /** Code ISO 3166 alpha-2 (drapeau, carte). */
  code: string;
  name: string;
  /** Indicatif téléphonique, sans le « + ». */
  dial: string;
  /** Code ISO 3166 numérique : identifiant du pays dans world-atlas (carte de l'audience). */
  numeric: number;
  /** Capitale [longitude, latitude] : position par défaut sur la carte. */
  capital: [number, number];
};

export const countries: Country[] = [
  // Afrique francophone
  { code: "TG", name: "Togo", dial: "228", numeric: 768, capital: [1.22, 6.13] },
  { code: "BJ", name: "Bénin", dial: "229", numeric: 204, capital: [2.42, 6.37] },
  { code: "CI", name: "Côte d'Ivoire", dial: "225", numeric: 384, capital: [-4.01, 5.36] },
  { code: "CM", name: "Cameroun", dial: "237", numeric: 120, capital: [9.7, 4.05] },
  { code: "SN", name: "Sénégal", dial: "221", numeric: 686, capital: [-17.47, 14.72] },
  { code: "BF", name: "Burkina Faso", dial: "226", numeric: 854, capital: [-1.52, 12.37] },
  { code: "ML", name: "Mali", dial: "223", numeric: 466, capital: [-8, 12.64] },
  { code: "NE", name: "Niger", dial: "227", numeric: 562, capital: [2.11, 13.51] },
  { code: "GN", name: "Guinée", dial: "224", numeric: 324, capital: [-13.58, 9.64] },
  { code: "GA", name: "Gabon", dial: "241", numeric: 266, capital: [9.45, 0.39] },
  { code: "CG", name: "Congo", dial: "242", numeric: 178, capital: [15.27, -4.26] },
  { code: "CD", name: "RD Congo", dial: "243", numeric: 180, capital: [15.31, -4.32] },
  { code: "TD", name: "Tchad", dial: "235", numeric: 148, capital: [15.04, 12.13] },
  { code: "CF", name: "Centrafrique", dial: "236", numeric: 140, capital: [18.56, 4.39] },
  { code: "GQ", name: "Guinée équatoriale", dial: "240", numeric: 226, capital: [8.78, 3.75] },
  { code: "MR", name: "Mauritanie", dial: "222", numeric: 478, capital: [-15.98, 18.09] },
  { code: "MA", name: "Maroc", dial: "212", numeric: 504, capital: [-6.84, 34.02] },
  { code: "DZ", name: "Algérie", dial: "213", numeric: 12, capital: [3.06, 36.75] },
  { code: "TN", name: "Tunisie", dial: "216", numeric: 788, capital: [10.18, 36.81] },
  { code: "MG", name: "Madagascar", dial: "261", numeric: 450, capital: [47.52, -18.88] },
  { code: "DJ", name: "Djibouti", dial: "253", numeric: 262, capital: [43.15, 11.59] },
  { code: "KM", name: "Comores", dial: "269", numeric: 174, capital: [43.26, -11.7] },
  { code: "BI", name: "Burundi", dial: "257", numeric: 108, capital: [29.93, -3.43] },
  { code: "RW", name: "Rwanda", dial: "250", numeric: 646, capital: [30.06, -1.94] },
  { code: "SC", name: "Seychelles", dial: "248", numeric: 690, capital: [55.45, -4.62] },
  // Reste de l'Afrique
  { code: "ZA", name: "Afrique du Sud", dial: "27", numeric: 710, capital: [28.05, -26.2] },
  { code: "AO", name: "Angola", dial: "244", numeric: 24, capital: [13.23, -8.84] },
  { code: "BW", name: "Botswana", dial: "267", numeric: 72, capital: [25.91, -24.65] },
  { code: "CV", name: "Cap-Vert", dial: "238", numeric: 132, capital: [-23.51, 14.93] },
  { code: "EG", name: "Égypte", dial: "20", numeric: 818, capital: [31.24, 30.04] },
  { code: "ER", name: "Érythrée", dial: "291", numeric: 232, capital: [38.93, 15.32] },
  { code: "SZ", name: "Eswatini", dial: "268", numeric: 748, capital: [31.13, -26.31] },
  { code: "ET", name: "Éthiopie", dial: "251", numeric: 231, capital: [38.75, 9.03] },
  { code: "GM", name: "Gambie", dial: "220", numeric: 270, capital: [-16.58, 13.45] },
  { code: "GH", name: "Ghana", dial: "233", numeric: 288, capital: [-0.19, 5.6] },
  { code: "GW", name: "Guinée-Bissau", dial: "245", numeric: 624, capital: [-15.6, 11.86] },
  { code: "KE", name: "Kenya", dial: "254", numeric: 404, capital: [36.82, -1.29] },
  { code: "LS", name: "Lesotho", dial: "266", numeric: 426, capital: [27.48, -29.31] },
  { code: "LR", name: "Liberia", dial: "231", numeric: 430, capital: [-10.8, 6.3] },
  { code: "LY", name: "Libye", dial: "218", numeric: 434, capital: [13.19, 32.89] },
  { code: "MW", name: "Malawi", dial: "265", numeric: 454, capital: [33.79, -13.97] },
  { code: "MU", name: "Maurice", dial: "230", numeric: 480, capital: [57.5, -20.16] },
  { code: "MZ", name: "Mozambique", dial: "258", numeric: 508, capital: [32.57, -25.97] },
  { code: "NA", name: "Namibie", dial: "264", numeric: 516, capital: [17.08, -22.56] },
  { code: "NG", name: "Nigeria", dial: "234", numeric: 566, capital: [3.38, 6.52] },
  { code: "UG", name: "Ouganda", dial: "256", numeric: 800, capital: [32.58, 0.35] },
  { code: "ST", name: "Sao Tomé-et-Principe", dial: "239", numeric: 678, capital: [6.73, 0.34] },
  { code: "SL", name: "Sierra Leone", dial: "232", numeric: 694, capital: [-13.23, 8.48] },
  { code: "SO", name: "Somalie", dial: "252", numeric: 706, capital: [45.34, 2.05] },
  { code: "SD", name: "Soudan", dial: "249", numeric: 729, capital: [32.53, 15.5] },
  { code: "SS", name: "Soudan du Sud", dial: "211", numeric: 728, capital: [31.58, 4.85] },
  { code: "TZ", name: "Tanzanie", dial: "255", numeric: 834, capital: [39.28, -6.79] },
  { code: "ZM", name: "Zambie", dial: "260", numeric: 894, capital: [28.32, -15.39] },
  { code: "ZW", name: "Zimbabwe", dial: "263", numeric: 716, capital: [31.05, -17.83] },
];

export function countryByCode(code: string) {
  return countries.find((c) => c.code === code);
}

export function countryByName(name: string) {
  return countries.find((c) => c.name === name);
}

export const sectors = [
  "Beauté & cosmétiques",
  "Mode & textile",
  "Bijoux & accessoires",
  "Alimentation & boissons",
  "Restauration",
  "Agriculture & agrobusiness",
  "Artisanat & décoration",
  "Santé & bien-être",
  "Tech & digital",
  "Éducation & formation",
  "Immobilier & BTP",
  "Services",
  "Autre",
];
