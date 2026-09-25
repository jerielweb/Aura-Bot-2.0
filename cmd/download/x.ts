import { fytBold } from "../../core/socketText.ts";
import { downloadToCache, requestJson } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
const KEY = DL_CONFIG.alya.API_KEY;
const SOCIAL_URL = /^(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\//i;

function getMediaUrl(value: any): string {
  if (typeof value === "string") return value;
  return value?.url || "";
}

function getBestVideo(result: unknown): string {
  if (!Array.isArray(result)) return getMediaUrl(result);

  return [...result]
    .filter((item) => getMediaUrl(item))
    .sort((left, right) => {
      const leftQuality = parseInt(String(left?.quality || ""), 10) || 0;
      const rightQuality = parseInt(String(right?.quality || ""), 10) || 0;
      return rightQuality - leftQuality;
    })
    .map(getMediaUrl)[0] || "";
}

export default {
  name: ["x", "twitter", "xdl"],
  category: "download",
  description: "Descarga videos o imágenes de Twitter / X.",
  async run({ args, reply, react }: any) {
    const url = args.join(" ").trim();

    if (!url || !SOCIAL_URL.test(url)) {
      return reply("⚠️ Proporciona un enlace válido de Twitter/X.");
    }

    await react("⏳");

    try {
      const response = await requestJson(
        `${API}/dl/twitter?url=${encodeURIComponent(url)}&key=${KEY}`,
        60000,
      );
      const data = response?.data;
      const type = String(data?.type || "").toLowerCase();
      const result = data?.result;
      const mediaUrl =
        type === "video"
          ? getBestVideo(result)
          : getMediaUrl(Array.isArray(result) ? result[0] : result) ||
            getMediaUrl(data?.thumbnail);

      if (!response?.status || !mediaUrl) {
        throw new Error("La API no devolvió contenido descargable.");
      }

      const file = await downloadToCache(mediaUrl, 180000);
      const isVideo = type === "video" || /\.mp4(?:$|\?)/i.test(mediaUrl);
      const caption = `⬣〔 ${fytBold("TWITTER DOWNLOAD")} 〕⬣`;

      if (isVideo) {
        await reply({
          video: { url: file },
          mimetype: "video/mp4",
          fileName: "twitter.mp4",
          caption,
        });
      } else {
        await reply({ image: { url: file }, caption });
      }

      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar Twitter/X."}`,
      });
    }
  },
};