import { downloadMediaMessage } from "@whiskeysockets/baileys";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import WebP from "node-webpmux";

const execFileAsync = promisify(execFile);

export function unwrapMediaMessage(message: any): any | null {
  if (!message) return null;
  if (
    message.imageMessage ||
    message.videoMessage ||
    message.documentMessage ||
    message.stickerMessage
  )
    return message;
  if (message.viewOnceMessageV2?.message)
    return unwrapMediaMessage(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage?.message)
    return unwrapMediaMessage(message.viewOnceMessage.message);
  if (message.documentWithCaptionMessage?.message)
    return unwrapMediaMessage(message.documentWithCaptionMessage.message);
  return null;
}

export async function downloadTargetMedia(
  sock: any,
  message: any,
  quotedMessage: any,
  remoteJid: string,
): Promise<Buffer> {
  const quotedInfo = message.message?.extendedTextMessage?.contextInfo;
  const target = quotedMessage
    ? {
        key: {
          remoteJid: quotedInfo?.remoteJid || remoteJid,
          id: quotedInfo?.stanzaId,
          participant: quotedInfo?.participant,
        },
        message: quotedMessage,
      }
    : message;
  return Buffer.from(
    await downloadMediaMessage(target, "buffer", {}, {
      logger: console as any,
      reuploadRequest: async (mediaMessage: any) =>
        sock?.updateMediaMessage?.(mediaMessage) || mediaMessage,
    }),
  );
}

export function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  );
}

/**
 * Detecta si un buffer WebP es animado, revisando el bit de animación del
 * chunk VP8X y/o la presencia de los chunks ANIM/ANMF. Es más confiable que
 * fiarse únicamente del flag que reporta una API externa.
 */
export function isAnimatedWebp(buffer: Buffer): boolean {
  if (!isWebp(buffer)) return false;
  let offset = 12;
  while (offset < buffer.length - 8) {
    const tag = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (tag === "VP8X" && (buffer[offset + 8] & 0x02) !== 0) return true;
    if (tag === "ANIM" || tag === "ANMF") return true;
    offset += 8 + size + (size % 2);
  }
  return false;
}

export async function toSticker(
  input: Buffer,
  animated: boolean,
  maxDuration = 20,
): Promise<Buffer> {
  if (!ffmpegPath) throw new Error("FFmpeg no está disponible.");
  const directory = process.env.TMPDIR || path.resolve("./cache");
  await mkdir(directory, { recursive: true });
  const id = randomUUID();
  const inputPath = path.join(directory, `aura-sticker-${id}.input`);
  const outputPath = path.join(directory, `aura-sticker-${id}.webp`);

  try {
    await writeFile(inputPath, input);

    // Filtro robusto que maneja tanto imágenes estáticas como webps/videos animados asegurando canales de color visibles
    const filter = animated
      ? `scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=20`
      : `scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0`;

    const args = ["-y", "-i", inputPath, "-vf", filter, "-c:v", "libwebp", "-lossless", "0", "-q:v", "80", "-an"];
    if (animated) args.push("-loop", "0", "-t", String(maxDuration));

    args.push(outputPath);
    await execFileAsync(ffmpegPath, args, { timeout: 120000 });
    return await readFile(outputPath);
  } finally {
    await Promise.all([
      unlink(inputPath).catch(() => undefined),
      unlink(outputPath).catch(() => undefined),
    ]);
  }
}

export async function imageToWebp(buffer: Buffer, animated = false): Promise<Buffer> {
  try {
    // WebP animado: ffmpeg NO puede decodificar los chunks ANIM/ANMF (su decoder
    // nativo de webp es de un solo frame), pero sharp/libvips sí puede, así que
    // para ese caso concreto lo forzamos por sharp y evitamos el fallback a ffmpeg.
    if (animated && isAnimatedWebp(buffer)) {
      return await sharp(buffer, { animated: true, limitInputPixels: false })
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80, lossless: false, alphaQuality: 100, loop: 0 })
        .toBuffer();
    }
    // Si falla sharp por metadatos o formato corrupto, lo derivamos de forma segura a toSticker con ffmpeg
    return await sharp(buffer, animated ? { animated: true, limitInputPixels: false } : { limitInputPixels: false })
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80, lossless: false, alphaQuality: 100, loop: animated ? 0 : undefined })
      .toBuffer();
  } catch {
    return await toSticker(buffer, animated);
  }
}

export function extractEmojis(text: string): string[] {
  return text.match(/\p{Extended_Pictographic}/gu) || [];
}

export async function applyStickerMetadata(
  buffer: Buffer,
  db: any,
  sender: string,
  fallbackAuthor?: string,
): Promise<Buffer> {
  const user = db?.getUser?.(sender) || {};
  const packName = String(
    user.stickerPackName || user.data?.stickerPackName || "Aura Reed",
  ).trim();
  const author = String(
    user.stickerPackAuthor ||
      user.data?.stickerPackAuthor ||
      fallbackAuthor ||
      "Aura Reed",
  ).trim();

  const img = new WebP.Image();
  await img.load(buffer);

  const jsonBuff = Buffer.from(
    JSON.stringify({
      "sticker-pack-id": "com.aurareed.tech.aura",
      "sticker-pack-name": packName,
      "sticker-pack-publisher": author,
      emojis: ["✨"],
    }),
    "utf-8",
  );

  const exifHeader = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);

  const exifBuffer = Buffer.concat([exifHeader, jsonBuff]);

  // CRÍTICO: los bytes 14-17 del header traen un tamaño "placeholder" (22)
  // que NO coincide con el tamaño real del JSON. Si no se sobrescribe con el
  // largo real, WhatsApp descarta el chunk EXIF por corrupto y el sticker se
  // muestra en blanco/roto (el cuadro gris con la esquina doblada). Este era
  // el bug que afectaba a TODOS los comandos, ya que todos pasan por aquí.
  exifBuffer.writeUInt32LE(jsonBuff.length, 14);

  img.exif = exifBuffer;

  return (await img.save(null)) as Buffer;
}
