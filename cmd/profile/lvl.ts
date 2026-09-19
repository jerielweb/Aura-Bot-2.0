import { getProfile, profileTarget } from "../../core/profileConfig.ts";

export default {
  name: ["lvl", "level", "nivel", "rango"],
  description: "Muestra tu rango Aura.",
  category: "profile",
  async run(ctx: any) {
    const target = await profileTarget(ctx);
    const aura = Number(getProfile(target).aura ?? 0);
    return ctx.reply({
      text: `✨ Aura: ${aura}\n📈 Nivel Aura: ${Math.floor(aura / 100) + 1}`,
      mentions: [target],
    });
  },
};