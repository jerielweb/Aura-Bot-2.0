import { updateProfile } from "../../core/profileConfig.ts";
import { fytBold } from "./../../core/socketText.ts";
export default {
  name: ["setmyname", "minombre"],
  description: "Cambia tu nombre de perfil.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setname Tu nombre");
    updateProfile(ctx.sender, { name: ctx.text.slice(0, 40) });

    let text = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
    text += `┃ ✅ ${fytBold("NOMBRE ACTUALIZADO")}\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Ahora te llamaran:\n`;
    text += `┃ 📝 *${ctx.text.slice(0, 40)}*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")}〕⬣`;

    return ctx.reply(text);
  },
};
