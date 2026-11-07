import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon } from "@/components/icons";

const socials = [
  { href: site.company.socials.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: site.company.socials.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: site.company.socials.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
  { href: site.tiktokUrl, label: "TikTok House of Challenge", Icon: TikTokIcon },
];

export function SiteFooter() {
  return (
    <footer className="bg-coal-950 text-white/70">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Image
              src="/brand/bovann-group.png"
              alt="Bovann Group"
              width={180}
              height={36}
              className="h-8 w-auto"
            />
            <p className="mt-4 text-xs font-bold tracking-[0.25em] text-white">
              {site.company.slogan}
            </p>
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold text-white">{site.company.name}</p>
            <p>{site.company.address}</p>
            <p>
              {site.company.phones.map((p, i) => (
                <span key={p}>
                  {i > 0 && " / "}
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-white">
                    {p}
                  </a>
                </span>
              ))}
            </p>
            <p>
              <a href={`mailto:${site.company.email}`} className="hover:text-white">
                {site.company.email}
              </a>
            </p>
          </div>
          <ul className="flex gap-3">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:justify-between">
          <p>© 2026 {site.company.name}. OCD Live, en partenariat avec House of Challenge.</p>
          <Link href="/espace-bovann" className="hover:text-white">
            Espace Bovann
          </Link>
        </div>
      </div>
    </footer>
  );
}
