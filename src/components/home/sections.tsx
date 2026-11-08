import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { booking, packages, schedule, site } from "@/config/site";
import { WhatsAppIcon } from "@/components/icons";
import { PackageCard } from "@/components/package-card";
import { fcfa } from "@/lib/format";
import { monthlyPackSubtitle, monthlyPackage } from "@/lib/packages";
import { cn } from "@/lib/utils";
import { teamWaLink } from "@/lib/whatsapp";
import { PackRemaining } from "./pack-remaining";

function SectionTitle({
  kicker,
  title,
  light,
}: {
  kicker: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div data-gsap="title" className="max-w-2xl">
      <p
        className={cn(
          "text-xs font-bold tracking-[0.22em] uppercase",
          light ? "text-live" : "text-live-600",
        )}
      >
        {kicker}
      </p>
      <h2
        className={cn(
          "mt-3 font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl",
          light ? "text-white" : "text-night-900",
        )}
      >
        {title}
      </h2>
    </div>
  );
}

const steps = [
  {
    title: "Choisis ton live",
    text: "En présentiel à Lomé ou à distance, puis ta date, ton package et ton heure.",
  },
  {
    title: "On te confirme sur WhatsApp",
    text: "Ton créneau t'est réservé. L'équipe Bovann Group te contacte pour finaliser et confirmer ton live.",
  },
  {
    title: "Passe en live",
    text: "Tu présentes ton business en direct sur le TikTok de House of Challenge, devant toute l'Afrique.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="comment-ca-marche"
      className="mx-auto w-full max-w-6xl scroll-mt-6 px-5 py-20 sm:px-8 sm:py-28"
    >
      <SectionTitle kicker="Comment ça marche" title="3 étapes, et tu es en direct" />
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-gsap="step"
            className="relative rounded-3xl border border-line bg-white p-7"
          >
            <span
              data-gsap="step-num"
              className="inline-block font-display text-6xl leading-none font-extrabold text-live"
            >
              {i + 1}
            </span>
            <h3 className="mt-5 font-display text-xl font-bold text-night-900">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const firstMonth = schedule.firstDay.slice(0, 7);

export function Packages() {
  const lives = packages.filter((p) => p.tier === "live");
  const bovann = packages.filter((p) => p.tier === "bovann" || p.tier === "vip");
  const cta = (id: string, dark?: boolean) => (
    <Link
      href={`/reserver?package=${id}`}
      className={cn(
        "flex min-h-12 items-center justify-center rounded-xl font-bold transition active:scale-[0.98]",
        dark
          ? "bg-white text-night-950 hover:bg-white/90"
          : "bg-night-900 text-white hover:bg-night-800",
      )}
    >
      Choisir
    </Link>
  );

  return (
    <section id="packages" className="scroll-mt-6 bg-night-900 text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionTitle kicker="Packages" title="Choisis la durée de ton live" light />
        <p className="mt-4 max-w-xl text-white/70">Même prix en présentiel et à distance.</p>

        <div data-gsap="cards" className="mt-12 grid gap-6 md:grid-cols-3 md:items-center">
          {lives.map((p) => (
            <PackageCard key={p.id} pkg={p} footer={cta(p.id, false)} />
          ))}
        </div>

        <h3 className="mt-16 font-display text-2xl font-bold">Avec Bovann</h3>
        <p className="mt-1 text-white/70">Bovann présente lui-même ton business à sa communauté.</p>
        <div data-gsap="cards" className="mt-6 grid gap-6 md:grid-cols-2">
          {bovann.map((p) => (
            <PackageCard key={p.id} pkg={p} footer={cta(p.id, true)} />
          ))}
        </div>

        {monthlyPackage && (
          <div
            data-gsap="banner"
            className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-live to-live-600 p-6 sm:p-8"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">
                  {monthlyPackage.name}
                </p>
                <h3 className="mt-2 font-display text-3xl font-extrabold">
                  {monthlyPackSubtitle(firstMonth)}
                </h3>
                <p className="mt-2 text-white/90">
                  {monthlyPackage.features.join(" + ")} ·{" "}
                  <strong>{fcfa(monthlyPackage.price)}</strong>
                </p>
                <Suspense
                  fallback={
                    <p className="mt-4 inline-flex rounded-full bg-black/20 px-3 py-1 text-sm font-semibold">
                      {monthlyPackage.monthlyQuota} places par mois
                    </p>
                  }
                >
                  <PackRemaining monthKey={firstMonth} />
                </Suspense>
              </div>
              <Link
                href={`/reserver?package=${monthlyPackage.id}`}
                className="flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-white px-8 text-lg font-extrabold text-live-600 transition hover:bg-white/90 active:scale-[0.98]"
              >
                J&apos;en profite
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const faq = [
  {
    q: "Comment se passe un live à distance ?",
    a: "Tu rejoins le live de House of Challenge depuis ton téléphone grâce à l'invitation TikTok (multi-invités). Notre équipe te contacte sur WhatsApp avant le live pour faire un test de connexion.",
  },
  {
    q: "Que se passe-t-il après ma réservation ?",
    a: `Ton créneau t'est réservé pendant ${booking.holdHours} h. L'équipe Bovann Group te contacte sur WhatsApp pour finaliser, puis confirme ton live : tu reçois alors ta confirmation par email avec ton billet.`,
  },
  {
    q: "Que dois-je préparer pour mon live ?",
    a: "Tes produits, quelques phrases pour présenter ton business, tes prix et un moyen de te contacter (WhatsApp, page TikTok). Une bonne lumière et une connexion stable si tu es à distance.",
  },
  {
    q: "Comment se passe le règlement ?",
    a: "Rien à payer sur le site. Après ta réservation, l'équipe Bovann Group t'indique sur WhatsApp comment régler, que tu sois au Togo ou à l'étranger.",
  },
  {
    q: "Puis-je changer la date de mon live ?",
    a: "Oui, jusqu'à 48 h avant ton live, selon les créneaux disponibles. Écris-nous sur WhatsApp avec ton code de réservation.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-6 px-5 py-20 sm:px-8 sm:py-28">
      <SectionTitle kicker="Questions fréquentes" title="Tout ce que tu dois savoir" />
      <div className="mt-10 space-y-3">
        {faq.map((f) => (
          <details
            key={f.q}
            data-gsap="faq"
            className="group rounded-2xl border border-line bg-white open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-night-900 [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown
                className="size-5 shrink-0 text-live transition group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-5 pb-5 leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-2 md:items-center">
        <div>
          <SectionTitle kicker="Contact" title="Une question ? On te répond sur WhatsApp" />
          <a
            href={teamWaLink("Bonjour Bovann Group, j'ai une question sur OCD Live.")}
            target="_blank"
            rel="noopener"
            className="mt-8 inline-flex min-h-14 items-center gap-3 rounded-2xl bg-[#1fa855] px-6 text-lg font-bold text-white transition hover:bg-[#178a45]"
          >
            <WhatsAppIcon className="size-6" />
            Écrire sur WhatsApp
          </a>
        </div>
        <ul data-gsap="list" className="space-y-4 text-night-900">
          <li className="flex items-start gap-3">
            <Phone className="mt-0.5 size-5 shrink-0 text-live" aria-hidden />
            <span>
              {site.company.phones.map((p, i) => (
                <span key={p}>
                  {i > 0 && " / "}
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="font-semibold hover:underline">
                    {p}
                  </a>
                </span>
              ))}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 shrink-0 text-live" aria-hidden />
            <a href={`mailto:${site.company.email}`} className="font-semibold hover:underline">
              {site.company.email}
            </a>
          </li>
          <li className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-live" aria-hidden />
            <span className="font-semibold">
              {site.company.name}, {site.company.address}
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
