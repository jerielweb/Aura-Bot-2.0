import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { downloadBuffer, requestJson } from "../../core/downloadUtils.ts";
import { applyStickerMetadata, imageToWebp, isWebp } from "../../core/stickerUtils.ts";

function isAnimated(sticker: any): boolean {
  return Boolean(sticker?.isAnimated || sticker?.animated);
}

export default {
  name: ["stickersearch", "buscars", "spack"],
  category: "sticker",
  description: "Busca un pack de stickers y lo envía al chat.",
  async run({ args, db, sender, msg, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply(`⚠️ Usa el comando con un nombre. Ejemplo: .spack gatos`);
    await react("⏳");
    try {
      const api = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
      const search = await requestJson(`${api}/stickerly/search?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`);
      const packs = (search?.resultados || search?.result || []).filter((pack: any) => pack?.url && !pack.isPaid);
      if (!packs.length) throw new Error("No se encontraron packs gratuitos.");
      const detail = await requestJson(`${api}/stickerly/detail?url=${encodeURIComponent(packs[0].url)}&key=${DL_CONFIG.alya.API_KEY}`);
      const rawStickers = (detail?.detalles?.stickers || detail?.stickers || []).slice(0, 60);
      if (!rawStickers.length) throw new Error("El pack no contiene stickers disponibles.");
      await reply({ text: `╭〔 📦 ${fytBold("AURA REED")} 〕⬣\n┃ 🏷️ ${fytBold("PROCESANDO PACK")}\n╰━━━━━━━━━━━━⬣\n\n┃ 📌 Pack: ${detail?.detalles?.name || query}\n┃ 🖼️ Stickers: ${rawStickers.length}\n┃ ⏳ Descargando...\n╰〔 ⚡ SYSTEM 〕⬣` });
      let sent = 0;
      for (const sticker of rawStickers) {
        const url = sticker.imageUrl || sticker.url || sticker.image;
        if (!url) continue;
        const buffer = await downloadBuffer(url);
        const webp = isWebp(buffer) ? buffer : await imageToWebp(buffer, isAnimated(sticker));
        const finalSticker = await applyStickerMetadata(webp, db, sender, msg.pushName);
        await reply({ sticker: finalSticker, mimetype: "image/webp" });
        sent++;
      }
      if (!sent) throw new Error("No se pudo descargar ningún sticker.");
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({ text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ⚠️ ERROR AL OBTENER PACK\n╰━━━━━━━━━━━━⬣\n\n┃ > ${error?.message || "Intenta nuevamente."}\n╰〔 ⚡ SYSTEM 〕⬣` });
    }
  },
};