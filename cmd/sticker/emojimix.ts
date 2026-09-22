import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { toSticker, extractEmojis, applyStickerMetadata } from "../../core/stickerUtils.ts";
import { request } from "undici";

export default {
  name: ["emojimix", "ekitchen", "emojikitchen"],
  category: "sticker",
  description: "Combina dos emojis en un sticker.",
  async run({ args, db, sender, msg, react, reply }: any) {
    const emojis = extractEmojis(args.join(" "));
    if (emojis.length < 2) return reply("⚠️ Envía dos emojis. Ejemplo: .emojimix 🥺🔥");
    await react("⏳");
    try {
      const url = new URL("tools/emojimix", DL_CONFIG.alya.BASE_URL);
      url.searchParams.set("emoji1", emojis[0]);
      url.searchParams.set("emoji2", emojis[1]);
      url.searchParams.set("key", DL_CONFIG.alya.API_KEY);
      const response = await request(url, { signal: AbortSignal.timeout(60000) });
      if (response.statusCode < 200 || response.statusCode >= 300)
        throw new Error(`HTTP ${response.statusCode}`);
      const output = await toSticker(Buffer.from(await response.body.arrayBuffer()), false);
      const finalSticker = await applyStickerMetadata(output, db, sender, msg.pushName);
      await react("✅");
      return reply({ sticker: finalSticker, mimetype: "image/webp" });
    } catch (error: any) {
      await react("❌");
      return reply({ text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ⚠️ ERROR AL CREAR STICKER\n╰━━━━━━━━━━━━⬣\n\n┃ > ${error?.message || "No se pudo combinar esos emojis."}\n╰〔 ⚡ SYSTEM 〕⬣` });
    }
  },
};