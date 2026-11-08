import { site } from "@/config/site";
import { fcfa } from "@/lib/format";
import { getPackage, packageName } from "@/lib/packages";
import { formatDayFr, formatHourInZone, formatRangeFr, zoneCity } from "@/lib/time";
import type { Booking } from "@/lib/types";

/** `to` : une adresse, ou plusieurs (notifications envoyées à toute l'équipe). */
export type Email = { to: string | string[]; subject: string; text: string; html: string };

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
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f4fa;font-family:Arial,Helvetica,sans-serif;color:#444444">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#15222b;padding:18px 24px"><img src="${appUrl}/brand/ocd-live-blanc.png" width="104" height="64" alt="OCD Live" style="display:block;border:0"></td></tr>
<tr><td style="padding:24px"><h1 style="font-size:20px;margin:0 0 16px">${title}</h1>${body}</td></tr>
<tr><td style="padding:16px 24px;background:#f1f4fa;font-size:12px;color:#5f6b76">${site.company.name} · ${site.company.address}<br>${site.company.phones.join(" / ")} · ${site.company.email}<br><a href="${appUrl}" style="color:#5f6b76">${appUrl.replace(/^https?:\/\//, "")}</a></td></tr>
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
        `<tr><td style="padding:6px 0;color:#5f6b76;width:40%">${k}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Tout ce que le client a saisi dans le formulaire, ligne par ligne. */
function formRows(b: Booking): [string, string][] {
  const d = describe(b);
  const start = new Date(b.startsAt);
  return [
    ["Code de réservation", b.code],
    ["Nom complet", b.fullName],
    ["WhatsApp", b.whatsapp],
    ["Email", b.email],
    ["Business", b.businessName],
    ["Secteur", b.sector],
    ["Produit(s) à présenter", b.products],
    ["Compte TikTok", b.tiktok ?? "—"],
    ["Mode", b.mode === "presentiel" ? "En présentiel à Lomé" : "À distance"],
    ["Pays / ville", `${b.country}, ${b.city}`],
    ["Date du live", formatDayFr(start, { year: true })],
    ["Heure (Lomé)", d.range + clientTimeNote(b)],
    ["Package", d.pkg],
    ["Montant", fcfa(b.amount)],
    [
      "Photo du produit",
      b.photoUrl?.startsWith("http")
        ? b.photoUrl
        : b.photoUrl
          ? "Jointe (voir l'Espace Bovann)"
          : "—",
    ],
  ];
}

/** Notification à Bovann Group, au format demandé + toutes les réponses du formulaire. */
export function adminNewBookingEmail(b: Booking, to: string | string[], appUrl: string): Email {
  const d = describe(b);
  const summary = `🔔 Nouvelle réservation OCD Live : ${b.fullName} (${b.businessName}, ${b.sector.toLowerCase()}) a réservé le ${d.day}, ${d.range}, package ${d.pkg}, ${d.where}. Montant : ${fcfa(b.amount)}. Statut : en attente de confirmation, à contacter sur WhatsApp au ${b.whatsapp}.`;
  const text = `${summary}\n\n${formRows(b)
    .map(([k, v]) => `${k} : ${v}`)
    .join("\n")}\n\nConfirmer dans l'Espace Bovann : ${appUrl}/espace-bovann`;
  const html = layout(
    "🔔 Nouvelle réservation OCD Live",
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px">${esc(summary.replace(/^🔔 Nouvelle réservation OCD Live : /, ""))}</p>
     <p style="font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:#5f6b76;margin:0 0 6px">Formulaire du client</p>
     ${rows(formRows(b))}
     <p style="margin:24px 0 0"><a href="${appUrl}/espace-bovann" style="background:#dc0c15;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block;margin:0 8px 8px 0">Confirmer dans l'Espace Bovann</a><a href="https://wa.me/${b.whatsapp.replace(/\D/g, "")}" style="background:#1fa855;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block;margin:0 8px 8px 0">Écrire sur WhatsApp</a></p>`,
    appUrl,
  );
  return {
    to,
    subject: `🔔 Nouvelle réservation : ${b.businessName} · ${d.day} ${d.range}`,
    text,
    html,
  };
}

/** Email de test envoyé depuis l'onglet Réglages. */
export function testEmail(to: string[], appUrl: string): Email {
  const text = `Ceci est un email de test OCD Live. Les nouvelles réservations arriveront à ${to.join(", ")}.`;
  return {
    to,
    subject: "✅ Test OCD Live : les notifications fonctionnent",
    text,
    html: layout(
      "✅ Les notifications fonctionnent",
      `<p style="font-size:15px;line-height:1.6">${esc(text)}</p>`,
      appUrl,
    ),
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
  const text = `Bonjour ${b.fullName}, nous avons bien reçu ta réservation OCD Live (${b.code}) pour le ${d.day}, ${d.range} heure de Lomé${clientTimeNote(b)}, package ${d.pkg}. Notre équipe te contacte très vite sur WhatsApp pour finaliser (règlement de ${fcfa(b.amount)}) et confirmer ton live. Suivre ta réservation : ${link}`;
  const html = layout(
    "Ta place est réservée ⏳",
    `<p style="font-size:15px;line-height:1.6">Bonjour ${esc(b.fullName)},<br>nous avons bien reçu ta demande. Notre équipe te contacte très vite sur WhatsApp pour finaliser et confirmer ton live.</p>
     ${rows([
       ["Code", b.code],
       ["Date", d.day],
       ["Heure (Lomé)", d.range + clientTimeNote(b)],
       ["Package", d.pkg],
       ["Mode", d.where],
       ["Montant", fcfa(b.amount)],
     ])}
     <p style="margin:24px 0 0"><a href="${link}" style="background:#15222b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Suivre ma réservation</a></p>`,
    appUrl,
  );
  return { to: b.email, subject: `Réservation reçue · ${b.code}`, text, html };
}

/** Email au client quand Bovann Group a confirmé la réservation. */
export function clientConfirmedEmail(b: Booking, appUrl: string): Email {
  const d = describe(b);
  const link = `${appUrl}/reservation/${b.id}`;
  const text = `Félicitations ${b.fullName} ! Ton live OCD Live (${b.code}) est confirmé le ${d.day}, ${d.range} heure de Lomé${clientTimeNote(b)}, package ${d.pkg}. Ton billet et le rappel agenda : ${link}. Abonne-toi à House of Challenge sur TikTok : ${site.tiktokUrl}`;
  const html = layout(
    "🎉 C'est confirmé, tu passes en live !",
    `<p style="font-size:15px;line-height:1.6">Félicitations ${esc(b.fullName)} ! Ton live est confirmé.</p>
     ${rows([
       ["Code", b.code],
       ["Date", d.day],
       ["Heure (Lomé)", d.range + clientTimeNote(b)],
       ["Package", d.pkg],
       ["Mode", d.where],
     ])}
     <p style="margin:24px 0 0"><a href="${link}" style="background:#dc0c15;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Voir mon billet</a></p>
     <p style="font-size:14px;margin-top:20px">En attendant ton live, abonne-toi à <a href="${site.tiktokUrl}">House of Challenge sur TikTok</a>.</p>`,
    appUrl,
  );
  return { to: b.email, subject: `🎉 Live confirmé · ${d.day} ${d.range}`, text, html };
}
