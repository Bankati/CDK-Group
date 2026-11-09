import { Hero } from "@/components/home/hero";
import { HomeAnimations } from "@/components/home/home-animations";
import { Launch } from "@/components/home/launch";
import { Contact, Faq, HowItWorks, Packages } from "@/components/home/sections";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <main className="flex-1 overflow-x-clip">
        <Hero />
        <Launch />
        <HowItWorks />
        <Packages />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
      <HomeAnimations />
    </>
  );
}
