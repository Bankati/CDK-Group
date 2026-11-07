import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { site } from "@/config/site";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "OCD LIVE · Ton business en live sur TikTok",
    template: "%s · OCD LIVE",
  },
  description:
    "Réserve ton passage en live sur le compte TikTok de House of Challenge et présente ton business à toute l'Afrique. En présentiel à Lomé ou à distance.",
  applicationName: site.name,
  icons: { icon: "/brand/favicon.png", apple: "/brand/favicon.png" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: site.name,
    title: "OCD LIVE · Ton business en live devant toute l'Afrique",
    description: "Réserve ton passage en live TikTok avec House of Challenge.",
    images: ["/hero/hero-bg.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#020f3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
