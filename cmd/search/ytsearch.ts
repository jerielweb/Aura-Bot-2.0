import yts from "yt-search";
import { fytBold } from "../../core/socketText.ts";
import { formatCount } from "../../core/downloadUtils.ts";

export default {
  name: ["ytsearch", "yts", "plays"],
  category: "search",
  description: "Busca videos en YouTube.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Debes especificar qué buscar.");
    await react("🔍");
    try {
      const result = await yts(query);
      const videos = result.videos.slice(0, 5);
      if (!videos.length) throw new Error("No se encontraron resultados.");
      let text = `╭━━〔 ${fytBold("YOUTUBE SEARCH")} 〕━━⬣\n`;
      text += `┃ 🔍 ${fytBold("Por")} › yt-search\n┃ 🎬 ${fytBold("Búsqueda")} › ${query}\n╰━━━━━━━━━━━━━━━━⬣\n\n`;
      for (const [index, video] of videos.entries()) {
        text += `┃ ${index + 1}. ${fytBold(video.title)}\n┃ ├ 👤 ${video.author.name}\n┃ ├ ⏱️ ${video.timestamp}\n┃ ├ 👁️ ${formatCount(video.views)}\n┃ └ 🔗 ${video.url}\n\n`;
      }
      text += `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
      await reply({ image: { url: videos[0].thumbnail }, caption: text });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({ text: `❌ Error: ${error?.message || "No se pudo buscar en YouTube."}` });
    }
  },
};
