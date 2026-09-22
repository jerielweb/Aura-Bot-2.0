import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { downloadBuffer } from "../../core/downloadUtils.ts";
import {
  extractEmojis,
  isWebp,
  toSticker,
  applyStickerMetadata,
} from "../../core/stickerUtils.ts";

export default {
  name: ["emojivid", "emoji", "emoji-video", "emojivideo"],
  category: "sticker",
  description: "Genera un sticker animado a partir de un emoji.",
  async run({ args, db, sender, msg, usedPrefix, react, reply }: any) {
    const emoji = extractEmojis(args.join(" ").trim())[0];
    if (!emoji)
      return reply(`⚠️ Envía un emoji. Ejemplo: ${usedPrefix}emojivid ❤️`);
    await react("⏳");
    try {
      const url = `${DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "")}/whatsapp/emoji?emoji=${encodeURIComponent(emoji)}&key=${DL_CONFIG.alya.API_KEY}`;
      const raw = await downloadBuffer(url);
      // La API de Alya ya entrega un sticker webp animado listo para usar
      // (con chunks ANIM/ANMF). ffmpeg no sabe decodificar webp animado —
      // por eso fallaba "Decode error rate 1 exceeds maximum" — así que si
      // ya viene como webp lo usamos directo y solo pasamos por toSticker
      // cuando la API entregue otro formato (gif/mp4).
      const output = isWebp(raw) ? raw : await toSticker(raw, true, 10);
      const finalSticker = await applyStickerMetadata(
        output,
        db,
        sender,
        msg.pushName,
      );
      await react("✅");
      return reply({ sticker: finalSticker, mimetype: "image/webp" });
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ⚠️ ERROR AL CREAR STICKER\n╰━━━━━━━━━━━━⬣\n\n┃ > ${error?.message || "Intenta nuevamente."}\n╰〔 ⚡ SYSTEM 〕⬣`,
      });
    }
  },
};
