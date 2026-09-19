import { updateProfile } from "../../core/profileConfig.ts";

export default {
  name: ["setbirt", "setbirth", "cumple"],
  description: "Guarda tu cumpleaños.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setbirt DD/MM/AAAA");
    updateProfile(ctx.sender, { birthDate: ctx.text.slice(0, 20) });
    return ctx.reply("✅ Cumpleaños global actualizado.");
  },
};