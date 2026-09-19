import { updateProfile } from "../../core/profileConfig.ts";

export default {
  name: ["setmyname", "minombre"],
  description: "Cambia tu nombre de perfil.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setname Tu nombre");
    updateProfile(ctx.sender, { name: ctx.text.slice(0, 40) });
    return ctx.reply("✅ Nombre global actualizado.");
  },
};