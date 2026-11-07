/** Pays proposés : toute l'Afrique francophone en tête, puis le reste de l'Afrique et la diaspora. */
export type Country = { code: string; name: string; dial: string };

export const countries: Country[] = [
  { code: "TG", name: "Togo", dial: "228" },
  { code: "BJ", name: "Bénin", dial: "229" },
  { code: "CI", name: "Côte d'Ivoire", dial: "225" },
  { code: "CM", name: "Cameroun", dial: "237" },
  { code: "SN", name: "Sénégal", dial: "221" },
  { code: "BF", name: "Burkina Faso", dial: "226" },
  { code: "ML", name: "Mali", dial: "223" },
  { code: "NE", name: "Niger", dial: "227" },
  { code: "GN", name: "Guinée", dial: "224" },
  { code: "GA", name: "Gabon", dial: "241" },
  { code: "CG", name: "Congo", dial: "242" },
  { code: "CD", name: "RD Congo", dial: "243" },
  { code: "TD", name: "Tchad", dial: "235" },
  { code: "CF", name: "Centrafrique", dial: "236" },
  { code: "GQ", name: "Guinée équatoriale", dial: "240" },
  { code: "MR", name: "Mauritanie", dial: "222" },
  { code: "MA", name: "Maroc", dial: "212" },
  { code: "DZ", name: "Algérie", dial: "213" },
  { code: "TN", name: "Tunisie", dial: "216" },
  { code: "MG", name: "Madagascar", dial: "261" },
  { code: "DJ", name: "Djibouti", dial: "253" },
  { code: "KM", name: "Comores", dial: "269" },
  { code: "BI", name: "Burundi", dial: "257" },
  { code: "RW", name: "Rwanda", dial: "250" },
  { code: "HT", name: "Haïti", dial: "509" },
  { code: "GH", name: "Ghana", dial: "233" },
  { code: "NG", name: "Nigeria", dial: "234" },
  { code: "CV", name: "Cap-Vert", dial: "238" },
  { code: "GW", name: "Guinée-Bissau", dial: "245" },
  { code: "LR", name: "Liberia", dial: "231" },
  { code: "SL", name: "Sierra Leone", dial: "232" },
  { code: "GM", name: "Gambie", dial: "220" },
  { code: "KE", name: "Kenya", dial: "254" },
  { code: "ZA", name: "Afrique du Sud", dial: "27" },
  { code: "EG", name: "Égypte", dial: "20" },
  { code: "FR", name: "France", dial: "33" },
  { code: "BE", name: "Belgique", dial: "32" },
  { code: "CH", name: "Suisse", dial: "41" },
  { code: "LU", name: "Luxembourg", dial: "352" },
  { code: "DE", name: "Allemagne", dial: "49" },
  { code: "IT", name: "Italie", dial: "39" },
  { code: "ES", name: "Espagne", dial: "34" },
  { code: "PT", name: "Portugal", dial: "351" },
  { code: "GB", name: "Royaume-Uni", dial: "44" },
  { code: "NL", name: "Pays-Bas", dial: "31" },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "US", name: "États-Unis", dial: "1" },
  { code: "AE", name: "Émirats arabes unis", dial: "971" },
  { code: "CN", name: "Chine", dial: "86" },
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
