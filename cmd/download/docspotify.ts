import { fytBold } from "../../core/socketText.ts";
import { requestJson, safeFileName } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";
import { sendDownloadPreview } from "../../core/downloadPreview.ts";

export default {
  name: ["spotifydoc", "docsplay", "dsp", "dspdl"],
  category: "download",
  description: "Descarga Spotify como documento MP3.",
  async run({ args, reply, react, sock, from, msg, sender }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Ingresa una canción o enlace de Spotify.");
    await react("🎵");
    try {
      const api = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
      const isUrl = query.includes("open.spotify.com/");
      const endpoint = isUrl ? "/dl/spotify" : "/dl/spotifyplay";
      const param = isUrl
        ? `url=${encodeURIComponent(query.split("?")[0])}`
        : `query=${encodeURIComponent(query)}`;
      const response = await requestJson(
        `${api}${endpoint}?${param}&key=${DL_CONFIG.alya.API_KEY}`,
      );
      const song = response?.data;
      const download = typeof song?.dl === "string" ? song.dl : song?.dl?.mp3;
      if (!response?.status || !download)
        throw new Error("No se pudo obtener el audio.");
      const title = song.title || "Spotify";
      const originalUrl = song.url || (isUrl ? query.split("?")[0] : `https://open.spotify.com/search/${encodeURIComponent(title)}`);
      const caption = `╭〔 🎵 ${fytBold("SPOTIFY DOCUMENT")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Artista")} › ${song.artist || "Desconocido"}\n┃ > ${fytBold("Álbum")} › ${song.album || "Desconocido"}\n┃ > ${fytBold("Tipo")} › Documento MP3\n┃ > ${fytBold("Url")} › ${originalUrl}\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando documento...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      const cover = song.coverHd || song.cover;
      const hasPreview = cover
        ? await sendDownloadPreview({
            sock,
            from,
            msg,
            thumbnail: cover,
            caption,
            link: originalUrl,
            title,
            author: song.artist || "Spotify",
            sender,
          })
        : false;
      if (!hasPreview) await reply({ text: caption });
      await reply({
        document: { url: download },
        mimetype: "audio/mpeg",
        fileName: `${safeFileName(title, "spotify")}.mp3`,
      });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar Spotify."}`,
      });
    }
  },
};
