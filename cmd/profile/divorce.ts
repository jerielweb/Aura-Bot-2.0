import { getProfile, updateProfile } from "../../core/profileConfig.ts";

export default {
  name: ["divorce", "divorcio"],
  description: "Termina tu matrimonio.",
  category: "profile",
  async run(ctx: any) {
    const spouse = getProfile(ctx.sender).marriedTo;
    if (!spouse) return ctx.reply("❌ No tienes pareja registrada.");
    updateProfile(ctx.sender, { marriedTo: null });
    updateProfile(spouse, { marriedTo: null });
    return ctx.reply("💔 El matrimonio global ha terminado.");
  },
};