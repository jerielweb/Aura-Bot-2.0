import { fytBold } from "../../core/socketText.ts";
import {
  downloadTargetMedia,
  applyStickerMetadata,
  isWebp,
  toSticker,
  unwrapMediaMessage,
} from "../../core/stickerUtils.ts";

export default {
  name: ["s", "sticker", "stiker"],
  category: "sticker",
  description: "Convierte imágenes, videos o GIFs en stickers.",
  async run({ sock, msg, from, sender, db, usedPrefix, react, reply }: any) {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = context?.quotedMessage;
    const target = quoted
      ? unwrapMediaMessage(quoted)
      : unwrapMediaMessage(msg.message);
    if (!target) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ❌ ${fytBold("FALTA MEDIO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Envía una imagen/video con ${usedPrefix}s\n┃ > o responde a un medio con ${usedPrefix}s.\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
      });
    }
    await react("⏳");
    try {
      const input = await downloadTargetMedia(sock, msg, quoted, from);
      const animated = Boolean(target.videoMessage);
      const output =
        isWebp(input) && !animated ? input : await toSticker(input, animated);
      const finalSticker = await applyStickerMetadata(
        output,
        db,
        sender,
        msg.pushName || "Aura Reed",
      );
      await react("✅");
      return reply({ sticker: finalSticker, mimetype: "image/webp" });
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ⚠️ ${fytBold("ERROR AL CREAR STICKER")}\n╰━━━━━━━━━━━━⬣\n\n┃ > ${error?.message || "No se pudo procesar el medio."}\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
      });
    }
  },
};
