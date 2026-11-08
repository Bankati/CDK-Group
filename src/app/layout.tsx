import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Poppins, Raleway } from "next/font/google";
import { site } from "@/config/site";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Seulement pour les codes de réservation : pas besoin de la charger en priorité.
  preload: false,
});
/** Titres du site. */
const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});
/** Poppins Bold : uniquement le mot « Live » du logo officiel. */
const logo = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: "700" });
/** Raleway : titres du hero, comme sur le site bovanngroup.com. */
const heading = Raleway({ variable: "--font-raleway", subsets: ["latin"], weight: "600" });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "OCD Live · Ton business en live sur TikTok",
    template: "%s · OCD Live",
  },
  description:
    "Réserve ton passage en live sur le compte TikTok de House of Challenge et présente ton business à toute l'Afrique. En présentiel à Lomé ou à distance.",
  applicationName: site.name,
  icons: {
    icon: [
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: site.name,
    title: "OCD Live · Ton business en live devant toute l'Afrique",
    description: "Réserve ton passage en live TikTok avec House of Challenge.",
    images: [{ url: "/brand/ocd-live-afrique.jpg", width: 1920, height: 1080, alt: "OCD Live" }],
  },
  twitter: { card: "summary_large_image", images: ["/brand/ocd-live-afrique.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#15222b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${logo.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
