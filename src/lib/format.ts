const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

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
