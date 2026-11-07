import { site } from "@/config/site";

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function teamWaLink(text: string) {
  return waLink(site.company.whatsapp, text);
}
