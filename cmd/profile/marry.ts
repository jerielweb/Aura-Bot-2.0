import {
  profileTarget,
  getProfile,
  setPendingProfileAction,
} from "../../core/profileConfig.ts";

export default {
  name: ["marry", "casarse", "matrimonio"],
  description: "Propone matrimonio a un usuario mencionado.",
  category: "profile",
  async run(ctx: any) {
    const target = await profileTarget(ctx);
    if (target === ctx.sender)
      return ctx.reply("❌ Debes mencionar a otra persona.");
    if (getProfile(ctx.sender).marriedTo || getProfile(target).marriedTo)
      return ctx.reply("❌ Uno de los dos ya tiene pareja.");
    setPendingProfileAction({ kind: "marry", from: ctx.sender, to: target });
    return ctx.reply({
      text: `💍 @${ctx.sender.split("@")[0]} te propone matrimonio. Responde con *${ctx.usedPrefix ?? "."}accept* para aceptar o *${ctx.usedPrefix ?? "."}reject* para rechazar.`,
      mentions: [ctx.sender, target],
    });
  },
};
