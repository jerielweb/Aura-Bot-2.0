import {
  clearPendingProfileAction,
  getPendingProfileAction,
} from "../../core/profileConfig.ts";

export default {
  name: ["reject", "rechazar", "decline", "no"],
  description: "Rechaza una propuesta pendiente.",
  category: "profile",
  async run(ctx: any) {
    const action =
      getPendingProfileAction("marry", ctx.sender) ??
      getPendingProfileAction("divorce", ctx.sender);
    if (!action)
      return ctx.reply("❌ No tienes una propuesta pendiente o ya expiró.");

    clearPendingProfileAction(action);
    return ctx.reply(
      action.kind === "marry"
        ? "❌ La propuesta de matrimonio fue rechazada."
        : "✅ La solicitud de divorcio fue cancelada.",
    );
  },
};
