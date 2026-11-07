import { monthlyPackNames, packages, type LivePackage } from "@/config/site";
import { monthLabel } from "@/lib/time";

export function getPackage(id: string): LivePackage | undefined {
  return packages.find((p) => p.id === id);
}

/** Nom affiché d'un package (le Pack du mois prend le nom du mois, ex. « Spécial Fêtes »). */
export function packageName(pkg: LivePackage, monthKey?: string) {
  if (pkg.tier !== "monthly") return pkg.name;
  const special = monthKey ? monthlyPackNames[monthKey] : undefined;
  return special ? `${pkg.name} · ${special}` : pkg.name;
}

export function monthlyPackSubtitle(monthKey: string) {
  return monthlyPackNames[monthKey] ?? `Offre de ${monthLabel(monthKey).split(" ")[0]}`;
}

export const shortestPackageMinutes = Math.min(...packages.map((p) => p.durationMinutes));
export const monthlyPackage = packages.find((p) => p.tier === "monthly");
