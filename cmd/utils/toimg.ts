import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { sendMessageWithRateLimit } from "../../core/mediaSendUtils.ts";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function convertWebpToGif(buffer: Buffer): Promise<Buffer> {
  if (!ffmpegPath) throw new Error("FFmpeg no está disponible.");
  const directory = process.env.TMPDIR || path.resolve("./cache");
  const id = randomUUID();
  const input = path.join(directory, `aura-toimg-${id}.webp`);
  const output = path.join(directory, `aura-toimg-${id}.gif`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(input, buffer);
    await execFileAsync(ffmpegPath, ["-y", "-i", input, "-filter_complex", "fps=15", "-loop", "0", "-f", "gif", output], { timeout: 60000 });
    return await readFile(output);
  } finally {
    await Promise.all([unlink(input).catch(() => undefined), unlink(output).catch(() => undefined)]);
  }
}

function unwrapMessage(message: any): any {
  if (!message) return null;
  if (message.stickerMessage || message.imageMessage || message.documentMessage) return message;
  if (message.viewOnceMessageV2?.message) return unwrapMessage(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage?.message) return unwrapMessage(message.viewOnceMessage.message);
  if (message.documentWithCaptionMessage?.message) return unwrapMessage(message.documentWithCaptionMessage.message);
  return null;
}

function getMediaCaption(message: any): string {
  return (
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    message?.documentMessage?.caption ||
    ""
  );
}

export default {
  name: ["toimg", "img", "toimage"],
  category: "utils",
  description: "Convierte un sticker o GIF en imagen.",
  async run({ sock, msg, from, reply, react }: any) {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = context?.quotedMessage;
    const target = unwrapMessage(quotedMessage);
    if (!target || (!target.stickerMessage && !target.imageMessage && !target.documentMessage)) {
      return reply({ text: "❌ Responde a un sticker, GIF o imagen de visualización única." });
    }
    await react("⏳");
    try {
      const buffer = await downloadMediaMessage({ key: msg.key, message: target }, "buffer", {}, { logger: console } as any);
      if (!buffer?.length) throw new Error("No se pudo descargar el contenido multimedia.");
      const quoted = { key: { remoteJid: from, id: context?.stanzaId || msg.key.id, participant: context?.participant }, message: quotedMessage };
      const caption = getMediaCaption(target) || "Aquí tienes la imagen";
      if (target.stickerMessage || target.documentMessage?.mimetype === "image/webp") {
        const animated = Boolean(target.stickerMessage?.isAnimated) || target.documentMessage?.url?.includes("animated");
        const image = animated ? await convertWebpToGif(buffer) : await sharp(buffer).png().toBuffer();
        await sendMessageWithRateLimit(sock, from, { image, mimetype: animated ? "image/gif" : "image/png", caption }, { quoted });
      } else if (target.imageMessage) {
        await sendMessageWithRateLimit(sock, from, { image: buffer, caption }, { quoted });
      } else if (target.documentMessage?.mimetype === "image/gif") {
        await sendMessageWithRateLimit(sock, from, { image: buffer, mimetype: "image/gif", caption }, { quoted });
      } else {
        throw new Error("Tipo de medio no soportado.");
      }
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({ text: `❌ No se pudo convertir el medio: ${error?.message || "error desconocido"}` });
    }
  },
};
