import { Hero } from "@/components/home/hero";
import { Launch } from "@/components/home/launch";
import { Contact, Faq, HowItWorks, Packages } from "@/components/home/sections";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <Launch />
        <HowItWorks />
        <Packages />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
