import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { identifySong } from "../../core/shazamScraper.ts";
import { fytBold } from "../../core/socketText.ts";
import { sendDownloadPreview } from "../../core/downloadPreview.ts";

function unwrap(message: any): any {
  if (!message) return null;
  if (message.audioMessage || message.videoMessage || message.documentMessage) return message;
  if (message.viewOnceMessageV2?.message) return unwrap(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage?.message) return unwrap(message.viewOnceMessage.message);
  return null;
}

export default {
  name: ["shazam", "whatsong", "findsong", "find"],
  category: "search",
  description: "Identifica una canción desde un audio o video citado.",
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const quoted = context?.quotedMessage;
    const target = unwrap(quoted);
    if (!target) return ctx.reply(`❗ Responde a un audio/video con ${ctx.usedPrefix ?? "."}shazam.`);
    await ctx.react("⏳");
    try {
      const buffer = await downloadMediaMessage({ key: ctx.msg.key, message: target }, "buffer", {}, { logger: console } as any);
      const track = await identifySong(buffer);
      let text = `╭〔 🔍 ${fytBold("SHAZAM RESULT")} 〕━⬣\n\n┃ ➥ ${track.title || "Desconocido"}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Artista")} › ${track.artist || "Desconocido"}\n┃ > ${fytBold("Álbum")} › ${track.album || "Desconocido"}\n┃ > ${fytBold("Género")} › ${track.genre || "Desconocido"}\n┃ > ${fytBold("Fecha")} › ${track.releaseDate || "Desconocida"}\n┃ > ${fytBold("Sello")} › ${track.label || "Desconocida"}\n\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      const title = track.title || "Canción identificada";
      const link = track.url || `https://www.google.com/search?q=${encodeURIComponent(`${title} ${track.artist || ""}`)}`;
      const hasPreview = track.coverArt
        ? await sendDownloadPreview({
            sock: ctx.sock,
            from: ctx.from,
            msg: ctx.msg,
            thumbnail: track.coverArt,
            caption: text,
            link,
            title,
            author: track.artist || "Shazam",
            sender: ctx.sender,
          })
        : false;
      if (!hasPreview) await ctx.reply({ text });
      await ctx.react("✅");
    } catch (error: any) { await ctx.react("❌"); return ctx.reply({ text: `❌ Error al identificar: ${error?.message || "Sin coincidencias."}` }); }
  },
};
