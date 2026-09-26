import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function unwrapMedia(message: any): any {
  if (!message) return null;
  if (message.imageMessage || message.videoMessage || message.documentMessage) return message;
  if (message.viewOnceMessageV2?.message) return unwrapMedia(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage?.message) return unwrapMedia(message.viewOnceMessage.message);
  if (message.documentWithCaptionMessage?.message) return unwrapMedia(message.documentWithCaptionMessage.message);
  return null;
}

export default {
  name: ["setbanner", "setmenuimage", "setmenubanner"],
  category: "socket",
  description: "Cambia el banner que usa el menú.",
  botUserOnly: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = context?.quotedMessage;
    const target = unwrapMedia(quotedMessage) || unwrapMedia(ctx.msg?.message);
    if (!target) {
      return ctx.reply("⚠️ Responde a una imagen o video para establecerlo como banner.");
    }

    try {
      const buffer = await downloadMediaMessage(
        { key: ctx.msg.key, message: target },
        "buffer",
        {},
        { logger: console } as any,
      );
      if (!buffer?.length) throw new Error("No se pudo descargar el banner.");

      const mimetype =
        target.imageMessage?.mimetype ||
        target.videoMessage?.mimetype ||
        target.documentMessage?.mimetype ||
        "image/jpeg";
      const databaseDir = path.resolve("./database");
      await mkdir(databaseDir, { recursive: true });
      const extension = mimetype.includes("gif")
        ? "gif"
        : mimetype.includes("video")
          ? "mp4"
          : mimetype.includes("png")
            ? "png"
            : "jpg";
      const filePath = path.join(databaseDir, `banner-${randomUUID()}.${extension}`);
      await writeFile(filePath, buffer);

      const bot = ctx.db.getBot(ctx.botJid);
      const previousPath = bot?.data?.customBanner?.path;
      if (previousPath && previousPath !== filePath) {
        await unlink(previousPath).catch(() => undefined);
      }
      ctx.db.setBot(ctx.botJid, {
        data: { customBanner: { path: filePath, mimetype } },
      });
      return ctx.reply("✅ Banner del menú actualizado.");
    } catch (error: any) {
      return ctx.reply({ text: `❌ No se pudo guardar el banner: ${error?.message || "error desconocido"}` });
    }
  },
};
