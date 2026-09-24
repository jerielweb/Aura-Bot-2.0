import { fytBold } from "../../core/socketText.ts";
import { requestJson } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";
import { sendAlbumMessage } from "../../core/mediaSendUtils.ts";

export default {
  name: ["pin", "pinterest"],
  category: "search",
  description: "Busca imágenes en Pinterest.",
  async run({ args, reply, react, sock, from, msg }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona una consulta para buscar en Pinterest.");
    await react("🔍");
    try {
      const api = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
      const response = await requestJson(`${api}/search/pinterest?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`);
      const results = Array.isArray(response?.data) ? response.data.slice(0, 6) : [];
      const urls = results.map((item: any) => typeof item === "string" ? item : item.hd || item.mini || item.image).filter((url: unknown): url is string => typeof url === "string" && /^https?:\/\//.test(url));
      if (!response?.status || !urls.length) throw new Error("Sin imágenes válidas.");
      const caption = `╭━━〔 ${fytBold("PINTEREST SEARCH")} 〕━━⬣\n┃ 🔍 Pin: ${query}\n┃ ⚙️ Motor: › Alya Core\n╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
      const album = urls.map((url, index) => ({ image: { url }, caption: index === 0 ? caption : "" }));
      if (album.length === 1) await reply(album[0]);
      else await sendAlbumMessage(sock, from, album, msg);
      await react("✅");
    } catch (error: any) { await react("❌"); return reply({ text: `❌ Error: ${error?.message || "No se encontraron imágenes."}` }); }
  },
};
