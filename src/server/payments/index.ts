import "server-only";
import { payment } from "@/config/site";
import type { BookingInput } from "@/lib/booking-schema";
import type { Booking } from "@/lib/types";

/**
 * Couche paiement.
 *
 * Aujourd'hui : paiement MANUEL (le client envoie l'argent par Flooz / Mixx,
 * puis saisit la référence ; Bovann Group valide dans son espace).
 *
 * Demain : pour brancher FedaPay ou PayGate Global, créer un fichier
 * `fedapay.ts` qui implémente `PaymentProvider` (création de transaction +
 * webhook qui appelle `confirmBooking`), puis le sélectionner dans `getProvider`.
 * Le parcours de réservation et l'Espace Bovann n'ont pas à changer.
 */
export type PaymentStart =
  | { kind: "manual" } // le client a déjà payé et donné sa référence
  | { kind: "redirect"; url: string }; // agrégateur : page de paiement externe

export interface PaymentProvider {
  id: string;
  /** Prépare les champs de paiement à enregistrer avec la réservation. */
  fields(input: BookingInput): Pick<Booking, "paymentMethod" | "paymentReference" | "paymentPhone">;
  /** Démarre le paiement après création de la réservation. */
  start(booking: Booking): Promise<PaymentStart>;
}

const manualProvider: PaymentProvider = {
  id: "manual",
  fields(input) {
    if (input.paymentMethod === "whatsapp") return { paymentMethod: "whatsapp" };
    const op = payment.operators.find((o) => o.id === input.paymentMethod);
    if (!op) throw new Error("Moyen de paiement inconnu");
    return {
      paymentMethod: op.id,
      paymentReference: input.paymentReference?.toUpperCase(),
      paymentPhone: input.paymentPhone,
    };
  },
  async start() {
    return { kind: "manual" };
  },
};

export function getProvider(): PaymentProvider {
  return manualProvider;
}
