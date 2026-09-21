import { fytBold } from "../../core/socketText.ts";
import { downloadBuffer, requestJson, safeFileName, formatCount } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
const KEY = DL_CONFIG.alya.API_KEY;
const TIKTOK_URL = /^(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com\//i;

export default {
  name: ["tk", "tt", "ttv", "tiktok", "tkmp4"],
  category: "download",
  description: "Busca y descarga videos de TikTok.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona una búsqueda o un enlace válido de TikTok.");
    await react("⏳");
    try {
      let url = query;
      if (!TIKTOK_URL.test(query)) {
        const search = await requestJson(`${API}/search/tiktok?query=${encodeURIComponent(query)}&key=${KEY}`);
        url = search?.data?.[0]?.url || "";
      }
      if (!url) throw new Error("No se encontró ningún enlace válido.");
      const data = await requestJson(`${API}/dl/tiktokv2?url=${encodeURIComponent(url)}&key=${KEY}`, 60000);
      const entries = Array.isArray(data?.data) ? data.data : [];
      const videoUrl = entries.find((item: any) => item?.type === "nowatermark_hd")?.url || entries.find((item: any) => item?.url)?.url;
      if (!data?.status || !videoUrl) throw new Error("La API no devolvió un video descargable.");
      const author = data.author?.nickname || data.author?.fullname || "Desconocido";
      const title = data.title || "Video de TikTok";
      const caption = `╭〔 🎥 ${fytBold("TIKTOK VIDEO")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Autor")} › ${author}\n┃ > ${fytBold("Vistas")} › ${formatCount(data.stats?.views || data.play_count)}\n┃ > ${fytBold("Likes")} › ${formatCount(data.stats?.likes || data.digg_count)}\n┃ > ${fytBold("Comentarios")} › ${formatCount(data.stats?.comment || data.comment_count)}\n┃ > ${fytBold("Compartidos")} › ${formatCount(data.stats?.share || data.share_count)}\n┃ > ${fytBold("Url")} › ${url}\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando video...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      const file = await downloadBuffer(videoUrl, 120000);
      await reply({ video: file, mimetype: "video/mp4", fileName: `${safeFileName(title, "tiktok")}.mp4`, caption });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({ text: `❌ Error: ${error?.message || "No se pudo descargar el video."}` });
    }
  },
};
