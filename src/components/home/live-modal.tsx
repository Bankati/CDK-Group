"use client";

import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { makeLiveSnapshot } from "@/lib/live-snapshot";
import { GUEST_COMMENTS, LivePhone } from "./live-phone";

type CamState =
  { status: "asking" | "denied" | "unavailable" } | { status: "on"; stream: MediaStream };

/**
 * « Rejoins le live » : fenêtre plein écran où la caméra frontale du visiteur
 * s'affiche dans le live de Bovann. Rien n'est envoyé ni enregistré.
 */
export function LiveModal({ onClose }: { onClose: () => void }) {
  const [cam, setCam] = useState<CamState>({ status: "asking" });
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Ouverture de la caméra dès l'affichage de la fenêtre.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        setCam({ status: "unavailable" });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        setCam({ status: "on", stream });
      } catch (e) {
        const denied = e instanceof DOMException && e.name === "NotAllowedError";
        if (!cancelled) setCam({ status: denied ? "denied" : "unavailable" });
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Branche la caméra sur la vidéo du téléphone.
  const stream = cam.status === "on" ? cam.stream : null;
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) void v.play().catch(() => {});
  }, [stream]);

  // Échap pour fermer, page figée derrière la fenêtre, caméra coupée si l'onglet est caché.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onHide = () => document.visibilityState === "hidden" && onClose();
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  async function savePhoto() {
    const video = videoRef.current;
    if (!video) return;
    setSaving(true);
    try {
      const blob = await makeLiveSnapshot(video, {
        viewers: document.getElementById("live-viewers")?.textContent ?? "10 000",
        comments: GUEST_COMMENTS.slice(0, 3).map((c) => ({
          who: `${c.name} · ${c.city}`,
          text: c.text,
        })),
        site: window.location.host,
      });
      const file = new File([blob], "moi-en-live-ocd.jpg", { type: "image/jpeg" });
      // Sur téléphone : feuille de partage (WhatsApp, statut…). Sur ordinateur : téléchargement.
      const touch = window.matchMedia("(pointer: coarse)").matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Moi, en live sur OCD Live",
          text: `Moi, en live devant toute l'Afrique 🔥 Réserve ton live : ${window.location.origin}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch {
      /* partage annulé : rien à faire */
    } finally {
      setSaving(false);
    }
  }

  const message =
    cam.status === "asking"
      ? "Autorise la caméra pour rejoindre le live…"
      : cam.status === "denied"
        ? "Caméra refusée. Pas de souci : réserve ton vrai live 😉"
        : cam.status === "unavailable"
          ? "La caméra n'est pas disponible ici (elle s'active sur le site en ligne, en https)."
          : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rejoins le live"
      className="fixed inset-0 z-50 flex animate-rise items-center justify-center overflow-y-auto bg-night-950/95 px-4 py-6 backdrop-blur-md"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Quitter le live"
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      <div className="flex w-full max-w-[19rem] flex-col items-center sm:max-w-[20rem]">
        <p className="mb-4 text-center font-display text-2xl font-extrabold text-white">
          {cam.status === "on" ? "C'est toi, en live !" : "Rejoins le live"}
        </p>
        <div
          className="max-h-[70svh] w-full"
          style={{ aspectRatio: "9 / 19", maxWidth: "calc(70svh * 9 / 19)" }}
        >
          <LivePhone
            image="/hero/ocd-live-studio.jpg"
            position="62% 50%"
            product={{ name: "Sérum éclat", price: "8 500 FCFA" }}
            productKey={0}
            running
            stream={stream}
            videoRef={videoRef}
          />
        </div>

        {message && (
          <p role="status" className="mt-5 text-center text-sm text-white/80">
            {message}
          </p>
        )}

        {cam.status === "on" && (
          <button
            type="button"
            onClick={savePhoto}
            disabled={saving}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 font-bold whitespace-nowrap text-night-900 shadow-xl transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-70"
          >
            <Download className="size-5 text-live" aria-hidden />
            {saving ? "Préparation…" : "Ma photo de live"}
          </button>
        )}
        <p className="mt-3 text-center text-[11px] text-white/50">
          Ta caméra reste sur ton appareil : rien n&apos;est enregistré ni envoyé.
        </p>
      </div>
    </div>
  );
}
