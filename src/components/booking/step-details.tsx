"use client";

import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { countries, countryByName, sectors } from "@/lib/countries";
import type { BookingMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CountrySelect } from "./country-select";
import { Field, inputClass, StepTitle } from "./ui";

export type Details = {
  fullName: string;
  dial: string;
  phone: string;
  email: string;
  businessName: string;
  sector: string;
  products: string;
  tiktok: string;
  country: string;
  city: string;
  photo?: string;
};

export const emptyDetails: Details = {
  fullName: "",
  dial: "228",
  phone: "",
  email: "",
  businessName: "",
  sector: "",
  products: "",
  tiktok: "",
  country: "",
  city: "",
};

/** Réduit la photo dans le navigateur (max 1200 px, JPEG) : rapide à envoyer même en 3G. */
async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function StepDetails({
  mode,
  value,
  errors,
  onChange,
}: {
  mode: BookingMode;
  value: Details;
  errors: Partial<Record<keyof Details, string>>;
  onChange: (patch: Partial<Details>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [photoBusy, setPhotoBusy] = useState(false);

  const input = (key: keyof Details, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => ({
    id: key,
    name: key,
    value: (value[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ [key]: e.target.value }),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    className: inputClass,
    ...props,
  });

  async function onPhoto(file?: File) {
    setPhotoError(undefined);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoError("Choisis une image (JPG, PNG…)");
    setPhotoBusy(true);
    try {
      onChange({ photo: await compressImage(file) });
    } catch {
      setPhotoError("Impossible de lire cette image, essaie une autre photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div>
      <StepTitle
        title="Parle-nous de toi"
        subtitle="Ces informations servent à préparer ton live."
      />

      <div className="space-y-5">
        <Field label="Nom complet" htmlFor="fullName" error={errors.fullName}>
          <input {...input("fullName", { autoComplete: "name", placeholder: "Ex. Afi Mensah" })} />
        </Field>

        <Field
          label="Numéro WhatsApp"
          htmlFor="phone"
          error={errors.phone}
          hint="On te contacte ici pour préparer ton live."
        >
          <div className="flex gap-2">
            <select
              aria-label="Indicatif"
              value={value.dial}
              onChange={(e) => onChange({ dial: e.target.value })}
              className={cn(inputClass, "w-[6.5rem] shrink-0 px-2")}
            >
              {[...new Set(countries.map((c) => c.dial))].map((d) => (
                <option key={d} value={d}>
                  +{d}
                </option>
              ))}
            </select>
            <input
              {...input("phone", {
                type: "tel",
                inputMode: "tel",
                autoComplete: "tel-national",
                placeholder: "90 00 00 00",
              })}
            />
          </div>
        </Field>

        <Field
          label="Email"
          htmlFor="email"
          error={errors.email}
          hint="Tu y recevras ta confirmation."
        >
          <input
            {...input("email", {
              type: "email",
              inputMode: "email",
              autoComplete: "email",
              placeholder: "toi@exemple.com",
            })}
          />
        </Field>

        <Field label="Nom de ton business" htmlFor="businessName" error={errors.businessName}>
          <input
            {...input("businessName", {
              autoComplete: "organization",
              placeholder: "Ex. Afi Cosmétiques",
            })}
          />
        </Field>

        <Field label="Secteur d'activité" htmlFor="sector" error={errors.sector}>
          <select
            {...(input("sector") as unknown as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            <option value="" disabled>
              Choisis ton secteur
            </option>
            {sectors.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Produit(s) à présenter" htmlFor="products" error={errors.products}>
          <textarea
            {...(input("products") as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            rows={3}
            placeholder="Ex. beurre de karité, savon noir, huiles capillaires"
            className={cn(inputClass, "py-3")}
          />
        </Field>

        <Field label="Compte TikTok" htmlFor="tiktok" optional>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
              @
            </span>
            <input
              {...input("tiktok", {
                autoCapitalize: "none",
                autoCorrect: "off",
                placeholder: "tonbusiness",
              })}
              className={cn(inputClass, "pl-9")}
            />
          </div>
        </Field>

        {mode === "distance" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Pays" htmlFor="country" error={errors.country}>
              <CountrySelect
                id="country"
                value={value.country}
                invalid={Boolean(errors.country)}
                onChange={(name) => {
                  const c = countryByName(name);
                  onChange({ country: name, ...(c ? { dial: c.dial } : {}) });
                }}
              />
            </Field>
            <Field label="Ville" htmlFor="city" error={errors.city}>
              <input
                {...input("city", { autoComplete: "address-level2", placeholder: "Ex. Abidjan" })}
              />
            </Field>
          </div>
        )}

        <Field label="Photo de ton produit" htmlFor="photo" optional error={photoError}>
          <input
            ref={fileRef}
            id="photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onPhoto(e.target.files?.[0])}
          />
          {value.photo ? (
            <div className="flex items-center gap-4 rounded-xl border border-line bg-white p-3">
              <Image
                src={value.photo}
                alt="Aperçu de ton produit"
                width={64}
                height={64}
                unoptimized
                className="size-16 rounded-lg object-cover"
              />
              <p className="flex-1 text-sm font-semibold text-night-900">Photo ajoutée</p>
              <button
                type="button"
                onClick={() => {
                  onChange({ photo: undefined });
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label="Retirer la photo"
                className="flex size-10 items-center justify-center rounded-full hover:bg-paper"
              >
                <X className="size-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-20 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-white text-muted transition hover:border-night-700 hover:text-night-900"
            >
              {photoBusy ? (
                <span className="size-5 animate-spin rounded-full border-2 border-line border-t-night-700" />
              ) : (
                <Camera className="size-5" />
              )}
              <span className="font-semibold">Ajouter une photo</span>
            </button>
          )}
        </Field>
      </div>
    </div>
  );
}
