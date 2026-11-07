import { z } from "zod";
import { packages, payment } from "@/config/site";

const operatorIds = payment.operators.map((o) => o.id) as [string, ...string[]];
const packageIds = packages.map((p) => p.id) as [string, ...string[]];

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{8,20}$/, "Numéro invalide (chiffres uniquement, avec l'indicatif)");

/** Données envoyées par le parcours de réservation. Le prix est TOUJOURS recalculé côté serveur. */
export const bookingInputSchema = z
  .object({
    mode: z.enum(["presentiel", "distance"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    packageId: z.enum(packageIds),

    fullName: z.string().trim().min(3, "Indique ton nom complet").max(80),
    whatsapp: phone,
    email: z.email("Adresse email invalide").max(120),
    businessName: z.string().trim().min(2, "Indique le nom de ton business").max(80),
    sector: z.string().trim().min(2, "Choisis un secteur").max(60),
    products: z.string().trim().min(3, "Dis-nous ce que tu vas présenter").max(500),
    tiktok: z.string().trim().max(60).optional(),
    country: z.string().trim().min(2, "Choisis ton pays").max(60),
    city: z.string().trim().min(2, "Indique ta ville").max(60),
    photo: z.string().startsWith("data:image/").max(1_400_000, "Photo trop lourde").optional(),
    clientTimezone: z.string().max(60).optional(),

    paymentMethod: z.enum([...operatorIds, "whatsapp"]),
    paymentReference: z.string().trim().max(60).optional(),
    paymentPhone: z.string().trim().max(25).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod !== "whatsapp") {
      if (!v.paymentReference || v.paymentReference.length < 4)
        ctx.addIssue({
          code: "custom",
          path: ["paymentReference"],
          message: "Saisis la référence reçue par SMS",
        });
      if (!v.paymentPhone || !/^\+?[0-9 ]{8,20}$/.test(v.paymentPhone))
        ctx.addIssue({
          code: "custom",
          path: ["paymentPhone"],
          message: "Saisis le numéro qui a payé",
        });
    }
  });

export type BookingInput = z.infer<typeof bookingInputSchema>;

/** Champs de l'étape « Informations » (validation côté client). */
export const detailsSchema = z.object({
  fullName: z.string().trim().min(3, "Indique ton nom complet"),
  whatsapp: phone,
  email: z.email("Adresse email invalide"),
  businessName: z.string().trim().min(2, "Indique le nom de ton business"),
  sector: z.string().trim().min(2, "Choisis un secteur"),
  products: z.string().trim().min(3, "Dis-nous ce que tu vas présenter"),
  country: z.string().trim().min(2, "Choisis ton pays"),
  city: z.string().trim().min(2, "Indique ta ville"),
});
