import {
  getProfile,
  setPendingProfileAction,
} from "../../core/profileConfig.ts";

export default {
  name: ["divorce", "divorcio"],
  description: "Termina tu matrimonio.",
  category: "profile",
  async run(ctx: any) {
    const spouse = getProfile(ctx.sender).marriedTo;
    if (!spouse) return ctx.reply("❌ No tienes pareja registrada.");
    setPendingProfileAction({ kind: "divorce", from: ctx.sender, to: spouse });
    return ctx.reply({
      text: `💔 @${ctx.sender.split("@")[0]} solicita el divorcio. Responde con *${ctx.usedPrefix ?? "."}accept* para confirmar o *${ctx.usedPrefix ?? "."}reject* para cancelar.`,
      mentions: [ctx.sender, spouse],
    });
  },
};
