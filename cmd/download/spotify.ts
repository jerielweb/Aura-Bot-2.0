import { fytBold } from "../../core/socketText.ts";
import { requestJson, safeFileName } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
const KEY = DL_CONFIG.alya.API_KEY;

export default {
  name: ["spotify", "splay", "sp", "spdl"],
  category: "download",
  description: "Descarga canciones de Spotify por enlace o búsqueda.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query)
      return reply(
        "⚠️ Ingresa el nombre de una canción o un enlace de Spotify.",
      );
    await react("🎵");
    try {
      const isUrl = query.includes("open.spotify.com/");
      const endpoint = isUrl ? "/dl/spotify" : "/dl/spotifyplay";
      const parameter = isUrl
        ? `url=${encodeURIComponent(query.split("?")[0])}`
        : `query=${encodeURIComponent(query)}`;
      const response = await requestJson(
        `${API}${endpoint}?${parameter}&key=${KEY}`,
      );
      const song = response?.data;
      const downloadUrl =
        typeof song?.dl === "string" ? song.dl : song?.dl?.mp3;
      if (!response?.status || !song || !downloadUrl)
        throw new Error("No se pudo obtener el audio.");
      const title = song.title || "Canción de Spotify";
      let caption = `╭〔 🎵 ${fytBold("SPOTIFY PLAY")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Artista")} › ${song.artist || "Desconocido"}\n┃ > ${fytBold("Álbum")} › ${song.album || "Desconocido"}\n┃ > ${fytBold("Duración")} › ${song.duration || "N/A"}\n┃ > ${fytBold("Tipo")} › Audio (MP3)\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando audio...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      if (song.coverHd || song.cover)
        await reply({ image: { url: song.coverHd || song.cover }, caption });
      else await reply({ text: caption });
      await reply({
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${safeFileName(title, "spotify")}.mp3`,
      });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar la canción."}`,
      });
    }
  },
};
