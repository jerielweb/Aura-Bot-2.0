import { fytBold } from "../../core/socketText.ts";
import { requestJson } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

export default {
  name: ["spsearch", "spotifysearch", "sps"],
  category: "search",
  description: "Busca canciones en Spotify.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona el nombre de una canción o artista.");
    await react("🔍");
    try {
      const api = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
      const data = await requestJson(`${api}/search/spotify?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`);
      const tracks = Array.isArray(data?.data) ? data.data.slice(0, 10) : Array.isArray(data?.result) ? data.result.slice(0, 10) : [];
      if (!tracks.length) throw new Error("No se encontraron resultados en Spotify.");
      let text = `╭━━〔 ${fytBold("SPOTIFY SEARCH")} 〕━━⬣\n┃ 🔍 ${fytBold("Búsqueda")} › ${query}\n┃ ⚙️ ${fytBold("Motor")} › Alya Core\n╰━━━━━━━━━━━━━━━━⬣\n\n`;
      for (const [index, track] of tracks.entries()) text += `┃ ${index + 1}. ${fytBold(track.title || "Sin título")}\n┃ ├ 👤 Artista › ${track.artist || "Desconocido"}\n┃ ├ 💿 Álbum › ${track.album || "Desconocido"}\n┃ ├ ⏱️ Duración › ${track.duration || "N/A"}\n┃ └ 🔗 Enlace › ${track.url || "No disponible"}\n\n`;
      text += `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
      const cover = tracks[0].image || tracks[0].cover || tracks[0].coverHd;
      if (cover) await reply({ image: { url: cover }, caption: text }); else await reply({ text });
      await react("✅");
    } catch (error: any) { await react("❌"); return reply({ text: `❌ Error: ${error?.message || "No se pudo buscar en Spotify."}` }); }
  },
};
