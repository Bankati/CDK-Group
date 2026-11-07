import { site } from "@/config/site";
import { addMinutes } from "@/lib/time";
import type { Booking } from "@/lib/types";

const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

function texts(b: Booking, packageName: string) {
  return {
    title: `🎥 Mon live OCD Live · ${b.businessName}`,
    details: `${packageName} sur le TikTok de House of Challenge (${site.tiktokUrl}). Code : ${b.code}.`,
    location:
      b.mode === "presentiel"
        ? `Bovann Group, ${site.company.address}`
        : "En ligne · TikTok House of Challenge",
  };
}

export function googleCalendarUrl(b: Booking, packageName: string) {
  const start = new Date(b.startsAt);
  const t = texts(b, packageName);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: t.title,
    dates: `${stamp(start)}/${stamp(addMinutes(start, b.durationMinutes))}`,
    details: t.details,
    location: t.location,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/[,;]/g, (c) => `\\${c}`)
    .replace(/\n/g, "\\n");

export function icsFile(b: Booking, packageName: string) {
  const start = new Date(b.startsAt);
  const t = texts(b, packageName);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bovann Group//OCD Live//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@ocdlive`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(addMinutes(start, b.durationMinutes))}`,
    `SUMMARY:${esc(t.title)}`,
    `DESCRIPTION:${esc(t.details)}`,
    `LOCATION:${esc(t.location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Ton live OCD Live commence dans 1 heure",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
