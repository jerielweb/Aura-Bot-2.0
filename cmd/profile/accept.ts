import {
  clearPendingProfileAction,
  getPendingProfileAction,
  getProfile,
  updateProfile,
} from "../../core/profileConfig.ts";

export default {
  name: ["accept", "aceptar", "acepto"],
  description: "Acepta una propuesta de matrimonio o divorcio.",
  category: "profile",
  async run(ctx: any) {
    const action = getPendingProfileAction("marry", ctx.sender)
      ?? getPendingProfileAction("divorce", ctx.sender);
    if (!action) return ctx.reply("❌ No tienes una propuesta pendiente o ya expiró.");

    if (action.kind === "marry") {
      if (getProfile(action.from).marriedTo || getProfile(action.to).marriedTo) {
        clearPendingProfileAction(action);
        return ctx.reply("❌ La propuesta ya no puede aceptarse porque uno de los dos tiene pareja.");
      }
      updateProfile(action.from, { marriedTo: action.to });
      updateProfile(action.to, { marriedTo: action.from });
      clearPendingProfileAction(action);
      return ctx.reply({
        text: `💍 Ahora están casados: @${action.from.split("@")[0]} y @${action.to.split("@")[0]}`,
        mentions: [action.from, action.to],
      });
    }

    const currentSpouse = getProfile(action.from).marriedTo;
    if (currentSpouse !== action.to && currentSpouse !== action.from) {
      clearPendingProfileAction(action);
      return ctx.reply("❌ El matrimonio ya no coincide con esta solicitud.");
    }

    updateProfile(action.from, { marriedTo: null });
    updateProfile(action.to, { marriedTo: null });
    clearPendingProfileAction(action);
    return ctx.reply("💔 El matrimonio ha terminado por acuerdo mutuo.");
  },
};
