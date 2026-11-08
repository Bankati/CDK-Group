/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  OCD Live — FICHIER DE CONFIGURATION UNIQUE                      ║
 * ║  Prix, numéros, horaires, liens : tout se modifie ici.           ║
 * ║  Les lignes marquées « À CONFIRMER » sont à vérifier par         ║
 * ║  Bovann Group avant la mise en ligne.                            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const site = {
  name: "OCD Live",
  tagline: "Réserve ton passage en live sur TikTok avec House of Challenge",

  /** Lien TikTok de House of Challenge — À CONFIRMER */
  tiktokUrl: "https://www.tiktok.com/@houseofchallenge",
  tiktokHandle: "@houseofchallenge",

  company: {
    name: "Bovann Group SAS",
    slogan: "EXPERTISE. INNOVATION. RÉSULTATS.",
    address: "Hédzranawoé, Lomé, Togo",
    phones: ["+228 70 25 65 65", "+228 79 79 02 29"],
    email: "contact@bovanngroup.com",
    website: "https://bovanngroup.com",
    /** Numéro WhatsApp de l'équipe (format international, chiffres seulement) — À CONFIRMER */
    whatsapp: "22870256565",
    socials: {
      facebook: "https://www.facebook.com/share/171jBzirQJ/",
      instagram: "https://www.instagram.com/bovanngroup",
      linkedin: "https://www.linkedin.com/company/bovann-group-sas/",
    },
  },
} as const;

/**
 * Réservations. Pas de paiement en ligne pour l'instant : l'équipe contacte le client
 * sur WhatsApp pour le règlement, puis confirme la réservation dans l'Espace Bovann.
 */
export const booking = {
  /** Durée pendant laquelle une réservation non confirmée bloque le créneau (en heures). */
  holdHours: 24,
} as const;

/** Planning des lives. Toutes les heures sont celles de Lomé (GMT, pas d'heure d'été). */
export const schedule = {
  timezone: "Africa/Lome",
  /** Premier jour réservable (AAAA-MM-JJ). */
  firstDay: "2026-12-01",
  /** Nombre de mois affichés dans le calendrier à partir du premier mois. */
  monthsAhead: 6,
  /** Heure d'ouverture et de fermeture (format 24h). */
  openHour: 10,
  closeHour: 22,
  /** Pas entre deux heures de début proposées (minutes). */
  slotStepMinutes: 30,
  /** Pause minimale entre deux lives (minutes). */
  bufferMinutes: 0,
  /** Délai minimum entre maintenant et le début d'un live (minutes). */
  minLeadMinutes: 120,
  /** Jours fermés (AAAA-MM-JJ), ex. ["2026-12-25"]. */
  closedDates: [] as string[],
} as const;

export type PackageTier = "live" | "bovann" | "vip" | "monthly";

export type LivePackage = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  /** Prix barré (facultatif). */
  compareAtPrice?: number;
  tier: PackageTier;
  badge?: string;
  /** Affiche « soit X FCFA/h ». */
  showHourlyRate?: boolean;
  /** Places par mois (Pack du mois). */
  monthlyQuota?: number;
  pitch: string;
  features: string[];
};

/** Les 6 packages. Même prix en présentiel et à distance. */
export const packages: LivePackage[] = [
  {
    id: "express",
    name: "Live Express",
    durationMinutes: 60,
    price: 12_000,
    tier: "live",
    showHourlyRate: true,
    pitch: "Pour une première présentation rapide.",
    features: ["1 heure de live", "Présentation de ton business", "Questions du public"],
  },
  {
    id: "classique",
    name: "Live Classique",
    durationMinutes: 90,
    price: 15_000,
    tier: "live",
    badge: "Le plus choisi",
    showHourlyRate: true,
    pitch: "Le bon temps pour convaincre et vendre.",
    features: ["1h30 de live", "Démonstration de tes produits", "Questions du public"],
  },
  {
    id: "marathon",
    name: "Live Marathon",
    durationMinutes: 240,
    price: 35_000,
    compareAtPrice: 40_000,
    tier: "live",
    showHourlyRate: true,
    pitch: "Une demi-journée pour tout montrer.",
    features: ["4 heures de live", "Toute ta gamme présentée", "Le meilleur prix à l'heure"],
  },
  {
    id: "boost",
    name: "Boost Bovann",
    durationMinutes: 90,
    price: 30_000,
    tier: "bovann",
    pitch: "Bovann te présente à sa communauté.",
    features: ["Live 1h30", "Bovann parle de toi en live", "Il publie ton compte"],
  },
  {
    id: "vip",
    name: "VIP Bovann",
    durationMinutes: 240,
    price: 75_000,
    tier: "vip",
    badge: "VIP",
    pitch: "L'expérience complète, en priorité.",
    features: ["Live 4 heures", "Tout le Boost Bovann", "Passage prioritaire"],
  },
  {
    id: "pack-du-mois",
    name: "Pack du mois",
    durationMinutes: 90,
    price: 20_000,
    tier: "monthly",
    monthlyQuota: 10,
    pitch: "L'offre limitée du mois.",
    features: ["Live 1h30", "Mention par Bovann"],
  },
];

/** Nom du Pack du mois selon le mois (clé AAAA-MM). */
export const monthlyPackNames: Record<string, string> = {
  "2026-12": "Spécial Fêtes",
};
