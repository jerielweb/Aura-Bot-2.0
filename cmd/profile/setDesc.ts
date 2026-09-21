import { updateProfile } from "../../core/profileConfig.ts";
import { fytBold } from "./../../core/socketText.ts";
export default {
  name: ["setdesc", "descripcion", "bio"],
  description: "Cambia tu descripción.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setdesc Tu descripción");
    updateProfile(ctx.sender, { description: ctx.text.slice(0, 120) });

    let text = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
    text += `┃ ✅ ${fytBold("BIO ACTUALIZADO")}\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Nueva Biografia:\n`;
    text += `┃ 📝 *${ctx.text.slice(0, 40)}*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")}〕⬣`;

    return ctx.reply(text);
  },
};
