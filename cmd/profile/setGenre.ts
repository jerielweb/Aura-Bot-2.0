import { updateProfile } from "../../core/profileConfig.ts";

export default {
  name: ["setgenre", "genero"],
  description: "Cambia tu género.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setgenre Género");
    updateProfile(ctx.sender, { gender: ctx.text.slice(0, 30) });
    return ctx.reply("✅ Género global actualizado.");
  },
};