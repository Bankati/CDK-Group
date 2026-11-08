import { z } from "zod";
import { packages } from "@/config/site";

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
  })
  .strict();

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
