import { updateProfile } from "../../core/profileConfig.ts";
import { fytBold } from "./../../core/socketText.ts";

export default {
  name: ["setbirt", "setbirth", "cumple"],
  description: "Guarda tu cumpleaños.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setbirt DD/MM/AAAA");
    updateProfile(ctx.sender, { birthDate: ctx.text.slice(0, 20) });

    let text = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
    text += `┃ ✅ ${fytBold("CUMPLE ACTUALIZADO")}\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 🎂TU Cumple es el:\n`;
    text += `┃ 📝 *${ctx.text.slice(0, 40)}*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")}〕⬣`;

    return ctx.reply(text);
  },
};
