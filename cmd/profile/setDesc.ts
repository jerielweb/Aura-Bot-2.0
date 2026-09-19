import { updateProfile } from "../../core/profileConfig.ts";

export default {
  name: ["setdesc", "descripcion", "bio"],
  description: "Cambia tu descripción.",
  category: "profile",
  async run(ctx: any) {
    if (!ctx.text) return ctx.reply("Uso: .setdesc Tu descripción");
    updateProfile(ctx.sender, { description: ctx.text.slice(0, 120) });
    return ctx.reply("✅ Descripción global actualizada.");
  },
};