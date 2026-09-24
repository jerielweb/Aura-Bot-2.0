import { fytBold } from "../../core/socketText.ts";
import { formatCount, requestJson } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

export default {
  name: ["ttsearch", "tiktoksearch", "tts"],
  category: "search",
  description: "Busca videos en TikTok.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona un término de búsqueda para TikTok.");
    await react("⏳");
    try {
      const api = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
      const response = await requestJson(`${api}/search/tiktok?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`);
      const results = Array.isArray(response?.data) ? response.data.slice(0, 5) : [];
      if (!response?.status || !results.length) throw new Error("No se encontraron resultados en TikTok.");
      let text = `╭━━〔 ${fytBold("TIKTOK SEARCH")} 〕━━⬣\n┃ 🔍 ${fytBold("Búsqueda")} › ${query}\n╰━━━━━━━━━━━━━━━━⬣\n\n`;
      for (const [index, video] of results.entries()) {
        text += `┃ ${index + 1}. ${fytBold(video.title || "Sin título")}\n┃ ├ 👤 @${video.author?.unique_id || "desconocido"} (${video.author?.nickname || "Sin nombre"})\n┃ ├ 👁️ ${formatCount(video.stats?.plays)}\n┃ ├ ❤️ ${formatCount(video.stats?.likes)}\n┃ ├ 🎵 ${String(video.music?.title || "Desconocido").slice(0, 40)}\n┃ └ 🎥 ${video.url || "No disponible"}\n\n`;
      }
      text += `╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      if (results[0].cover) await reply({ image: { url: results[0].cover }, caption: text });
      else await reply({ text });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({ text: `❌ Error: ${error?.message || "No se pudo buscar en TikTok."}` });
    }
  },
};
