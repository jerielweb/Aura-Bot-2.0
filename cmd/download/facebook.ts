import { fytBold } from "../../core/socketText.ts";
import { downloadBuffer, requestJson } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");

export default {
  name: ["fb", "facebook", "fbdl", "facebookdl", "fbvideo", "fbv", "fbreels"],
  category: "download",
  description: "Descarga videos de Facebook y Reels.",
  async run({ args, reply, react }: any) {
    const url = args.join(" ").trim();
    if (!url)
      return reply("⚠️ Proporciona un enlace de Facebook o Facebook Reels.");
    await react("⏳");
    try {
      const data = await requestJson(
        `${API}/dl/facebook?url=${encodeURIComponent(url)}&key=${DL_CONFIG.alya.API_KEY}`,
        60000,
      );
      const item = data?.data?.[0] || data?.result?.[0] || data?.data;
      const videoUrl =
        typeof item === "string" ? item : item?.url || item?.hd || item?.sd;
      if (!data?.status || !videoUrl)
        throw new Error("La API no devolvió un video descargable.");
      const quality = item?.quality || "HD";
      const caption = `╭〔 🎥 ${fytBold("FACEBOOK VIDEO")} 〕━⬣\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Calidad")} › ${quality}\n┃ > ${fytBold("Tipo")} › Video MP4\n┃ > ${fytBold("Url")} › ${url}\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando video...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      const file = await downloadBuffer(videoUrl, 120000);
      await reply({
        video: file,
        mimetype: "video/mp4",
        fileName: "facebook.mp4",
        caption,
      });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar el video."}`,
      });
    }
  },
};
