import { downloadMediaMessage } from "@whiskeysockets/baileys";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);

function unwrapAudio(message: any): any {
  if (!message) return null;
  if (message.audioMessage || message.documentMessage) return message;
  if (message.viewOnceMessageV2?.message) return unwrapAudio(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage?.message) return unwrapAudio(message.viewOnceMessage.message);
  if (message.documentWithCaptionMessage?.message) return unwrapAudio(message.documentWithCaptionMessage.message);
  return null;
}

export default {
  name: ["setaudio", "setmenuaudio", "menuaudio"],
  category: "socket",
  description: "Cambia el audio que se envía al abrir el menú.",
  botUserOnly: true,
  async run(ctx: any) {
    if (!ffmpegPath) return ctx.reply("❌ FFmpeg no está disponible.");

    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = context?.quotedMessage;
    const target = unwrapAudio(quotedMessage) || unwrapAudio(ctx.msg?.message);
    if (!target) return ctx.reply("⚠️ Responde a un audio para establecerlo en el menú.");
    try {
      const buffer = await downloadMediaMessage(
        { key: ctx.msg.key, message: target },
        "buffer",
        {},
        { logger: console } as any,
      );
      if (!buffer?.length) throw new Error("No se pudo descargar el audio.");

      await ctx.react("⏳");
      const dir = path.resolve("./database");
      await mkdir(dir, { recursive: true });
      const id = randomUUID();
      const input = path.join(dir, `audio-${id}.input`);
      const output = path.join(dir, `audio-${id}.ogg`);
      await writeFile(input, buffer);
      await execFileAsync(
        ffmpegPath,
        ["-y", "-i", input, "-vn", "-c:a", "libopus", "-b:a", "96k", "-ar", "48000", output],
        { timeout: 120000 },
      );
      await unlink(input).catch(() => undefined);

      const bot = ctx.db.getBot(ctx.botJid);
      const previousPath = bot?.data?.customAudio?.path;
      if (previousPath && previousPath !== output) await unlink(previousPath).catch(() => undefined);
      ctx.db.setBot(ctx.botJid, {
        data: {
          ...(bot?.data || {}),
          customAudio: { path: output, mimetype: "audio/ogg; codecs=opus", ptt: true, seconds: 99999, },
        },
      });
      await ctx.react("✅");
      return ctx.reply("✅ Audio del menú actualizado como nota de voz OGG/Opus.");
    } catch (error: any) {
      return ctx.reply({ text: `❌ No se pudo guardar el audio: ${error?.message || "error desconocido"}` });
    }
  },
};
