import { updateProfile } from "../../core/profileConfig.ts";
import {fytBold} from "./../../core/socketText.ts"
export default {
  name: ["setgenre", "genero"],
  description: "Cambia tu género.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setgenre Género");
    updateProfile(ctx.sender, { gender: ctx.text.slice(0, 30) });

    let text = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
    text += `┃ ✅ ${fytBold("GENERO ACTUALIZADO")}\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Tu genero es:\n`;
    text += `┃ 📝 *${ctx.text.slice(0, 30)}*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")}〕⬣`;

    return ctx.reply(text);
  },
};