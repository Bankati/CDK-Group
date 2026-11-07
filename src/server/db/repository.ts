import type { Booking } from "@/lib/types";

export type InsertResult = "ok" | "slot_taken" | "sold_out";

/**
 * Contrat d'accès aux données. Deux implémentations :
 * - memory.ts   : MODE DÉMO, sans aucun compte externe
 * - supabase.ts : production
 */
export interface BookingRepository {
  /** Réservations dont le live commence dans [from, to[ (ISO). Sans bornes : toutes. */
  list(range?: { from: string; to: string }): Promise<Booking[]>;
  get(id: string): Promise<Booking | null>;
  /**
   * Insère la réservation SEULEMENT si le créneau est libre (et s'il reste des places
   * pour un package limité). Doit être atomique : c'est la garantie anti double réservation.
   */
  insertIfFree(
    booking: Booking,
    opts: { now: number; monthlyQuota?: number },
  ): Promise<InsertResult>;
  update(id: string, patch: Partial<Booking>): Promise<Booking | null>;
  /** Stocke la photo produit et renvoie son URL. */
  savePhoto(bookingId: string, dataUrl: string): Promise<string>;
}
