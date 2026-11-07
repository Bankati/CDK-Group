import { payment, site } from "@/config/site";
import { fcfa } from "@/lib/format";
import { getPackage, packageName } from "@/lib/packages";
import { formatDayFr, formatHourInZone, formatRangeFr, zoneCity } from "@/lib/time";
import type { Booking } from "@/lib/types";

export type Email = { to: string; subject: string; text: string; html: string };

function methodLabel(b: Booking) {
  if (b.paymentMethod === "whatsapp") return "WhatsApp (avec l'équipe)";
  return payment.operators.find((o) => o.id === b.paymentMethod)?.label ?? b.paymentMethod;
}

function describe(b: Booking) {
  const start = new Date(b.startsAt);
  const pkg = getPackage(b.packageId);
  return {
    day: formatDayFr(start),
    range: formatRangeFr(start, b.durationMinutes),
    pkg: pkg ? packageName(pkg, b.startsAt.slice(0, 7)) : b.packageId,
    where:
      b.mode === "presentiel"
        ? "en présentiel à Lomé"
        : `à distance depuis ${b.city} (${b.country})`,
  };
}

function layout(title: string, body: string, appUrl: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f4ef;font-family:Arial,Helvetica,sans-serif;color:#1c1b1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#18181a;padding:18px 24px"><img src="${appUrl}/brand/ocd-live-blanc.png" width="104" height="64" alt="OCD Live" style="display:block;border:0"></td></tr>
<tr><td style="padding:24px"><h1 style="font-size:20px;margin:0 0 16px">${title}</h1>${body}</td></tr>
<tr><td style="padding:16px 24px;background:#f7f4ef;font-size:12px;color:#6b655c">${site.company.name} · ${site.company.address}<br>${site.company.phones.join(" / ")} · ${site.company.email}<br><a href="${appUrl}" style="color:#6b655c">${appUrl.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

function rows(items: [string, string][]) {
  return `<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px">${items
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#6b655c;width:40%">${k}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Notification à Bovann Group, au format demandé. */
export function adminNewBookingEmail(b: Booking, to: string, appUrl: string): Email {
  const d = describe(b);
  const ref = b.paymentReference ? `, réf. ${b.paymentReference}` : "";
  const text = `🔔 Nouvelle réservation OCD Live : ${b.fullName} (${b.businessName}, ${b.sector.toLowerCase()}) a réservé le ${d.day}, ${d.range}, package ${d.pkg}, ${d.where}. Montant : ${fcfa(b.amount)} via ${methodLabel(b)}${ref}. Statut : en attente de validation.`;
  const html = layout(
    "🔔 Nouvelle réservation OCD Live",
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px">${esc(text.replace(/^🔔 Nouvelle réservation OCD Live : /, ""))}</p>
     ${rows([
       ["Code", b.code],
       ["WhatsApp", b.whatsapp],
       ["Email", b.email],
       ["Produits", b.products],
     ])}
     <p style="margin:24px 0 0"><a href="${appUrl}/espace-bovann" style="background:#c2560a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Valider dans l'Espace Bovann</a></p>`,
    appUrl,
  );
  return {
    to,
    subject: `🔔 Nouvelle réservation : ${b.businessName} · ${d.day} ${d.range}`,
    text,
    html,
  };
}

function clientTimeNote(b: Booking) {
  if (b.mode !== "distance" || !b.clientTimezone || b.clientTimezone === "Africa/Lome") return "";
  const start = new Date(b.startsAt);
  return ` (soit ${formatHourInZone(start, b.clientTimezone)} heure de ${zoneCity(b.clientTimezone)})`;
}

/** Email au client juste après sa demande. */
export function clientPendingEmail(b: Booking, appUrl: string): Email {
  const d = describe(b);
  const link = `${appUrl}/reservation/${b.id}`;
  const text = `Bonjour ${b.fullName}, nous avons bien reçu ta réservation OCD Live (${b.code}) pour le ${d.day}, ${d.range} heure de Lomé${clientTimeNote(b)}, package ${d.pkg}. Notre équipe vérifie ton paiement de ${fcfa(b.amount)} et te confirme très vite. Suivre ta réservation : ${link}`;
  const html = layout(
    "Ta place est réservée ⏳",
    `<p style="font-size:15px;line-height:1.6">Bonjour ${esc(b.fullName)},<br>nous avons bien reçu ta demande. Notre équipe vérifie ton paiement et te confirme très vite.</p>
     ${rows([
       ["Code", b.code],
       ["Date", d.day],
       ["Heure (Lomé)", d.range + clientTimeNote(b)],
       ["Package", d.pkg],
       ["Mode", d.where],
       ["Montant", fcfa(b.amount)],
     ])}
     <p style="margin:24px 0 0"><a href="${link}" style="background:#18181a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Suivre ma réservation</a></p>`,
    appUrl,
  );
  return { to: b.email, subject: `Réservation reçue · ${b.code}`, text, html };
}

/** Email au client quand Bovann Group a validé le paiement. */
export function clientConfirmedEmail(b: Booking, appUrl: string): Email {
  const d = describe(b);
  const link = `${appUrl}/reservation/${b.id}`;
  const text = `Félicitations ${b.fullName} ! Ton paiement est validé : ton live OCD Live (${b.code}) est confirmé le ${d.day}, ${d.range} heure de Lomé${clientTimeNote(b)}, package ${d.pkg}. Ton billet et le rappel agenda : ${link}. Abonne-toi à House of Challenge sur TikTok : ${site.tiktokUrl}`;
  const html = layout(
    "🎉 C'est confirmé, tu passes en live !",
    `<p style="font-size:15px;line-height:1.6">Félicitations ${esc(b.fullName)} ! Ton paiement est validé.</p>
     ${rows([
       ["Code", b.code],
       ["Date", d.day],
       ["Heure (Lomé)", d.range + clientTimeNote(b)],
       ["Package", d.pkg],
       ["Mode", d.where],
     ])}
     <p style="margin:24px 0 0"><a href="${link}" style="background:#c2560a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Voir mon billet</a></p>
     <p style="font-size:14px;margin-top:20px">En attendant ton live, abonne-toi à <a href="${site.tiktokUrl}">House of Challenge sur TikTok</a>.</p>`,
    appUrl,
  );
  return { to: b.email, subject: `🎉 Live confirmé · ${d.day} ${d.range}`, text, html };
}
