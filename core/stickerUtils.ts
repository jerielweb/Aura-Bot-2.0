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
    const filter = animated
      ? `format=rgba,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x000000@0,fps=20`
      : "format=rgba,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x000000@0";
    const args = ["-y", "-i", inputPath, "-vf", filter, "-c:v", "libwebp", "-an"];
    if (animated) args.push("-loop", "0", "-t", String(maxDuration), "-q:v", "45");
    else args.push("-q:v", "80");
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
  return sharp(buffer, animated ? { animated: true } : {})
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp(animated ? { quality: 80, loop: 0 } : { quality: 80 })
    .toBuffer();
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
  const image = new WebP.Image();
  await image.load(buffer);
  const exifHeader = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const metadata = Buffer.from(
    JSON.stringify({
      "sticker-pack-id": "com.aurareed.sticker",
      "sticker-pack-name": packName,
      "sticker-pack-publisher": author,
      emojis: ["✨"],
    }),
    "utf8",
  );
  image.exif = Buffer.concat([exifHeader, metadata]);
  return (await image.save(null)) as Buffer;
}