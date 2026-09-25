import yts from "yt-search";
import { readFile } from "node:fs/promises";
import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
} from "@whiskeysockets/baileys";
import { fytBold } from "../../core/socketText.ts";
import { downloadToCache, formatCount } from "../../core/downloadUtils.ts";
import { createLinkPreviewWithoutChannel } from "../../core/LinkPreview.ts";

export default {
  name: ["ytsearch", "yts", "plays"],
  category: "search",
  description: "Busca videos en YouTube.",
  async run({ args, reply, react, sock, from, msg, sender }: any) {
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
      const thumbnailBuffer = await readFile(
        await downloadToCache(videos[0].thumbnail, 30000),
      );
      const prepared = await prepareWAMessageMedia(
        { image: thumbnailBuffer },
        {
          upload: sock.waUploadToServer,
          mediaTypeOverride: "thumbnail-link",
        },
      );
      const preview = createLinkPreviewWithoutChannel({
        textOriginal: text,
        link: videos[0].url,
        author: videos[0].author?.name || "YouTube",
        title: videos[0].title,
        banner: prepared.imageMessage,
        mentionedJid: sender ? [sender] : [],
        isForwarded: false,
        forwardingScore: 0,
      });
      const previewMessage = generateWAMessageFromContent(from, preview, {
        quoted: msg,
        userJid: sock.user?.id,
      });
      await sock.relayMessage(from, previewMessage.message, {
        messageId: previewMessage.key.id,
      });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({ text: `❌ Error: ${error?.message || "No se pudo buscar en YouTube."}` });
    }
  },
};
