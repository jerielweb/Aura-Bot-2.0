import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["setmeta", "metasticker", "sticker-meta"],
  category: "sticker",
  description: "Configura el pack y autor de tus stickers.",
  async run({ args, db, sender, usedPrefix, reply }: any) {
    const user = db.getUser(sender);
    const currentPack = user.stickerPackName || user.data?.stickerPackName || "Aura Reed";
    const currentAuthor =
      user.stickerPackAuthor || user.data?.stickerPackAuthor || "Aura Reed";
    const raw = args.join(" ").trim();
    if (!raw) {
      return reply({
        text: `╭〔 ⚙️ ${fytBold("AURA REED")} 〕⬣\n┃ 🏷️ ${fytBold("STICKER METADATA")}\n╰━━━━━━━━━━━━⬣\n\n┃ 📦 Pack: ${currentPack}\n┃ ✍️ Autor: ${currentAuthor}\n\n┣━━━━━━━━━━━━⬣\n\n┃ ➪ ${usedPrefix || "."}setmeta Pack | Autor\n┃ ✦ Configura tus metadatos\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
      });
    }

    const [pack, author] = raw.split("|").map((value) => value.trim());
    if (!pack || !author) {
      return reply({
        text: `❌ Usa el formato: ${usedPrefix || "."}setmeta Pack | Autor`,
      });
    }

    db.setUser(sender, {
      stickerPackName: pack,
      stickerPackAuthor: author,
    });
    return reply({
      text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ 🏷️ ${fytBold("METADATOS ACTUALIZADOS")}\n╰━━━━━━━━━━━━⬣\n\n┃ 📦 Pack: ${pack}\n┃ ✍️ Autor: ${author}\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
    });
  },
};