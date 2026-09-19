import { profileTarget, getProfile, updateProfile } from "../../core/profileConfig.ts";

export default {
  name: ["marry", "casarse", "matrimonio"],
  description: "Propone matrimonio a un usuario mencionado.",
  category: "profile",
  async run(ctx: any) {
    const target = await profileTarget(ctx);
    if (target === ctx.sender) return ctx.reply("❌ Debes mencionar a otra persona.");
    if (getProfile(ctx.sender).marriedTo || getProfile(target).marriedTo) return ctx.reply("❌ Uno de los dos ya tiene pareja.");
    updateProfile(ctx.sender, { marriedTo: target });
    updateProfile(target, { marriedTo: ctx.sender });
    return ctx.reply({
      text: `💍 Ahora están casados: @${ctx.sender.split("@")[0]} y @${target.split("@")[0]}`,
      mentions: [ctx.sender, target],
    });
  },
};