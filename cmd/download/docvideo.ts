import { fytBold } from "../../core/socketText.ts";
import { requestJson, safeFileName } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const API = "https://api.lempi.lat";
const ID =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

export default {
  name: ["dytmp4", "docvideo", "docplayvideo", "docmp4", "dytv", "docplay2"],
  category: "download",
  description: "Descarga videos de YouTube como documento.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona una búsqueda o enlace de video.");
    await react("⏳");
    try {
      let url = query;
      if (!ID.test(query)) {
        const search = await requestJson(
          `${DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "")}/search/yt?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`,
        );
        url = search?.result?.[0]?.url || "";
      } else url = `https://youtu.be/${query.match(ID)?.[1]}`;
      if (!url) throw new Error("No se encontró ningún video.");
      const data = await requestJson(
        `${API}/dl/ytv?url=${encodeURIComponent(url)}&quality=1080&apikey=OBOE-AERETHIX`,
        60000,
      );
      if (!data?.status || !data.datos?.url)
        throw new Error("No se pudo obtener el video.");
      const title = data.titulo || "Video de YouTube";
      const caption = `╭〔 🎬 ${fytBold("YOUTUBE DOCUMENT")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Canal")} › ${data.canal || "Desconocido"}\n┃ > ${fytBold("Duración")} › ${data.duracion || "??"}\n┃ > ${fytBold("Tipo")} › Documento MP4\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando documento...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      await reply({ text: caption });
      await reply({
        document: { url: data.datos.url },
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
