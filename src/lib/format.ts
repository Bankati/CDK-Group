const intl = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
/**
 * Séparateur des milliers : espace insécable classique (U+00A0) au lieu de l'espace
 * fine (U+202F) d'Intl, trop étroite ou absente dans certaines polices (« 33125 »).
 */
const nf = { format: (n: number) => intl.format(n).replace(/\u202f/g, "\u00a0") };

/** 12000 → "12 000 FCFA" */
export function fcfa(amount: number) {
  return `${nf.format(amount)} FCFA`;
}

export function number(n: number) {
  return nf.format(n);
}

/** 90 → "1h30", 60 → "1h", 240 → "4h" */
export function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function hourlyRate(price: number, minutes: number) {
  return Math.round((price / minutes) * 60);
}
