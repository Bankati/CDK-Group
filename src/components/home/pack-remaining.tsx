import { connection } from "next/server";
import { getMonthAvailability } from "@/server/bookings";

/** Compteur de places restantes du Pack du mois (calculé à chaque visite). */
export async function PackRemaining({ monthKey }: { monthKey: string }) {
  await connection();
  const { packRemaining } = await getMonthAvailability(monthKey);
  if (packRemaining === null) return null;
  return (
    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-sm font-semibold">
      <span className="size-2 animate-pulse rounded-full bg-white" />
      {packRemaining === 0
        ? "Complet ce mois-ci"
        : `Plus que ${packRemaining} place${packRemaining > 1 ? "s" : ""} sur 10`}
    </p>
  );
}
