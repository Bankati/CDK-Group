export type BookingMode = "presentiel" | "distance";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  /** Code lisible affiché sur le billet, ex. OCD-7K3P9. */
  code: string;
  createdAt: string;
  mode: BookingMode;
  packageId: string;
  /** Début du live en ISO UTC (= heure de Lomé). */
  startsAt: string;
  durationMinutes: number;
  amount: number;

  fullName: string;
  whatsapp: string;
  email: string;
  businessName: string;
  sector: string;
  products: string;
  tiktok?: string;
  country: string;
  city: string;
  photoUrl?: string;
  /** Fuseau horaire du client (pour lui afficher son heure locale). */
  clientTimezone?: string;

  status: BookingStatus;
  /** Le créneau reste bloqué jusqu'à cette date tant que l'équipe ne l'a pas confirmée. */
  holdExpiresAt: string;
  validatedAt?: string;
};

/** Statut affiché : une réservation en attente dont le délai est dépassé devient « expirée ». */
export type DisplayStatus = BookingStatus | "expired";

export function displayStatus(b: Pick<Booking, "status" | "holdExpiresAt">, now = Date.now()) {
  if (b.status === "pending" && Date.parse(b.holdExpiresAt) <= now) return "expired" as const;
  return b.status;
}

export const statusLabels: Record<DisplayStatus, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  expired: "Délai dépassé",
};
