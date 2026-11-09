import { siFacebook, siInstagram, siTiktok, siWhatsapp } from "simple-icons";

type P = { className?: string };

function Brand({ path, className }: P & { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={path} />
    </svg>
  );
}

export const TikTokIcon = (p: P) => <Brand path={siTiktok.path} {...p} />;
export const WhatsAppIcon = (p: P) => <Brand path={siWhatsapp.path} {...p} />;
export const FacebookIcon = (p: P) => <Brand path={siFacebook.path} {...p} />;
export const InstagramIcon = (p: P) => <Brand path={siInstagram.path} {...p} />;
export const LinkedInIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={p.className}>
    <circle cx="4.5" cy="4.5" r="2.5" />
    <rect x="2.3" y="8.6" width="4.4" height="13" rx="0.6" />
    <path d="M9.4 8.6h4.2v1.9c.7-1.2 2.2-2.2 4.4-2.2 4.2 0 4.7 2.8 4.7 6.3v7h-4.4v-6.2c0-1.6-.1-3.4-2.2-3.4s-2.4 1.6-2.4 3.3v6.3H9.4z" />
  </svg>
);

/** Logo TikTok officiel en couleurs : la note blanche avec ses deux ombres cyan et rose. */
export function TikTokLogo({ className }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className ?? ""}`} role="img" aria-label="TikTok">
      <TikTokIcon className="absolute inset-0 size-full -translate-x-[6%] -translate-y-[4%] text-[#25f4ee]" />
      <TikTokIcon className="absolute inset-0 size-full translate-x-[6%] translate-y-[4%] text-[#fe2c55]" />
      <TikTokIcon className="relative size-full text-white" />
    </span>
  );
}
