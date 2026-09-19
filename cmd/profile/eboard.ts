import { getProfile } from "../../core/profileConfig.ts";
import { db } from "../../dbController/db.ts";

export default {
  name: ["eboard", "auratop"],
  description: "Clasificación global de Aura.",
  category: "profile",
  async run(ctx: any) {
    const rows = db.getAllUsers().map((user) => getProfile(user.jid)).sort((a, b) => Number(b.aura ?? 0) - Number(a.aura ?? 0)).slice(0, 10);
    return ctx.reply(["🏆 TOP GLOBAL DE AURA", ...rows.map((user, index) => `${index + 1}. ${user.name ?? user.username ?? user.jid}: ${Number(user.aura ?? 0)}`)].join("\n"));
  },
};