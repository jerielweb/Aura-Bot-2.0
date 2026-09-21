import { fytBold } from "../../core/socketText.ts";
import {
  downloadBuffer,
  requestJson,
  safeFileName,
} from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const API = "https://api.lempi.lat";
const KEY = "OBOE-AERETHIX";
const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

function videoId(value: string): string | null {
  return value.match(YOUTUBE_ID)?.[1] || null;
}

async function searchVideo(query: string): Promise<string> {
  const data = await requestJson(
    `${DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "")}/search/yt?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`,
  );
  if (!data?.status || !data.result?.[0]?.url)
    throw new Error("No se encontró ningún video.");
  return data.result[0].url;
}

export default {
  name: ["ytmp4", "video", "playvideo", "mp4", "ytv", "play2"],
  category: "download",
  description: "Busca y descarga video de YouTube.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona el nombre o enlace de un video.");
    await react("⏳");
    try {
      const id = videoId(query);
      const url = id ? `https://youtu.be/${id}` : await searchVideo(query);
      const data = await requestJson(
        `${API}/dl/ytv?url=${encodeURIComponent(url)}&quality=1080&apikey=${KEY}`,
        60000,
      );
      if (!data?.status || !data?.datos?.url)
        throw new Error("La API no pudo procesar el video.");
      const title = data.titulo || "Video de YouTube";
      const caption = `╭〔 🎬 ${fytBold("YOUTUBE VIDEO")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Canal")} › ${data.canal || "Desconocido"}\n┃ > ${fytBold("Duración")} › ${data.duracion || "??"}\n┃ > ${fytBold("Tamaño")} › ${data.datos.tamaño || "??"}\n┃ > ${fytBold("Tipo")} › Video MP4\n┃ > ${fytBold("Url")} › ${url}\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Enviando video...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      if (data.miniatura)
        await reply({ image: { url: data.miniatura }, caption });
      const file = await downloadBuffer(data.datos.url);
      await reply({
        video: file,
        mimetype: "video/mp4",
        fileName: `${safeFileName(title, "youtube")}.mp4`,
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
