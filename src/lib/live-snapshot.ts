/**
 * Fabrique, dans le navigateur, une « capture de live » au format story (1080×1920)
 * à partir de la caméra du visiteur. Rien n'est envoyé : tout se passe sur l'appareil.
 */
import { OCD_PATH } from "@/components/ocd-symbol-path";

const W = 1080;
const H = 1920;
const RED = "#dc0c15";
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bg: string,
  size = 40,
) {
  ctx.font = `800 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + size * 1.1;
  const h = size * 1.6;
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + size * 0.55, y + h / 2 + 2);
  return w;
}

/** Symbole OCD officiel (orange), à la largeur voulue. */
function ocdSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const scale = width / 3710;
  ctx.save();
  ctx.translate(x - 187 * scale, y - 176 * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#EE6B07";
  ctx.fill(new Path2D(OCD_PATH), "evenodd");
  ctx.restore();
}

export async function makeLiveSnapshot(
  video: HTMLVideoElement,
  opts: { viewers: string; comments: { who: string; text: string }[]; site: string },
): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  // 1. La vidéo, recadrée pour remplir l'écran, en miroir (comme un selfie).
  const vw = video.videoWidth || W;
  const vh = video.videoHeight || H;
  const scale = Math.max(W / vw, H / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();

  // 2. Dégradés pour la lisibilité.
  let g = ctx.createLinearGradient(0, 0, 0, 420);
  g.addColorStop(0, "rgba(0,0,0,0.6)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 420);
  g = ctx.createLinearGradient(0, H * 0.45, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.45, W, H * 0.55);

  // 3. En haut : LIVE + spectateurs, logo OCD Live.
  const x = 60;
  const w1 = pill(ctx, x, 90, "LIVE", RED, 44);
  pill(ctx, x + w1 + 16, 90, `👁 ${opts.viewers}`, "rgba(0,0,0,0.45)", 40);
  ocdSymbol(ctx, W - 60 - 230, 92, 230);
  ctx.font = `800 52px ${FONT}`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Live", W - 66, 92 + 88 + 50);
  ctx.textAlign = "left";

  // 4. Commentaires.
  let y = H - 820;
  for (const cm of opts.comments.slice(0, 3)) {
    ctx.font = `700 34px ${FONT}`;
    const t1 = cm.who;
    ctx.font = `500 40px ${FONT}`;
    const tw = Math.max(ctx.measureText(cm.text).width, 300);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    roundRect(ctx, x, y, Math.min(tw + 60, W - 2 * x), 128, 34);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText(t1, x + 30, y + 50);
    ctx.fillStyle = "#fff";
    ctx.font = `500 40px ${FONT}`;
    ctx.fillText(cm.text, x + 30, y + 100);
    y += 150;
  }

  // 5. Bandeau final : le message à partager.
  y = H - 350;
  ctx.fillStyle = RED;
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.18, 1, 0, 0);
  ctx.fillRect(20, 0, 760, 130);
  ctx.restore();
  ctx.fillStyle = "#fff";
  ctx.font = `italic 900 96px ${FONT}`;
  ctx.fillText("MOI, EN LIVE.", x + 40, y + 102);
  ctx.font = `600 42px ${FONT}`;
  ctx.fillText("Devant toute l'Afrique, avec Bovann.", x, y + 200);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText(`Réserve ton live sur ${opts.site}`, x, y + 260);

  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture impossible"))), "image/jpeg", 0.9),
  );
}
