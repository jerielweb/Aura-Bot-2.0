import { fytBold } from "../../core/socketText.ts";
import { requestJson, safeFileName } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
const YT_ID =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

export default {
  name: [
    "ytdmp3",
    "docplay",
    "docplayaudio",
    "dmp3",
    "dyta",
    "docaudio",
    "playdoc",
  ],
  category: "download",
  description: "Descarga audio de YouTube como documento.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query)
      return reply("⚠️ Proporciona una búsqueda o enlace de YouTube.");
    await react("⏳");
    try {
      let url = query;
      if (!YT_ID.test(query)) {
        const search = await requestJson(
          `${API}/search/yt?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`,
        );
        url = search?.result?.[0]?.url || "";
      } else url = `https://youtu.be/${query.match(YT_ID)?.[1]}`;
      if (!url) throw new Error("No se encontró ningún video.");
      const data = await requestJson(
        `${API}/dl/ytmp3v2?url=${encodeURIComponent(url)}&key=${DL_CONFIG.alya.API_KEY}`,
      );
      if (!data?.status || !data.data?.dl)
        throw new Error("No se pudo obtener el audio.");
      const info = data.data;
      const title = info.title || "Audio de YouTube";
      const caption = `╭〔 🎵 ${fytBold("YOUTUBE DOCUMENT")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Canal")} › ${info.author || "Desconocido"}\n┃ > ${fytBold("Duración")} › ${info.duration || "??"}\n┃ > ${fytBold("Calidad")} › ${info.quality || "128k"}\n┃ > ${fytBold("Tipo")} › Documento MP3\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando documento...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      await reply({ text: caption });
      await reply({
        document: { url: info.dl },
        mimetype: "audio/mpeg",
        fileName: `${safeFileName(title, "youtube")}.mp3`,
      });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar el audio."}`,
      });
    }
  },
};
