import {
  cooldownText,
  formatCoins,
  getEconomyUser,
  setEconomyUser,
} from "../../core/economyConfig.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["weekly", "semanal", "memanal"],
  category: "economy",
  description: "Reclama tu recompensa semanal con sistema de racha.",
  async run(ctx: any) {
    const user = getEconomyUser(ctx.from, ctx.sender, {
      lastWeekly: 0,
      weeklyStreak: 0,
    });
    const now = Date.now();
    const cooldown = 7 * 24 * 60 * 60 * 1000;
    const gracePeriod = 11 * 24 * 60 * 60 * 1000;

    if (user.lastWeekly && now - user.lastWeekly < cooldown) {
      return ctx.reply(
        `⏳ Ya reclamaste tu recompensa semanal.\nVuelve en *${cooldownText(cooldown - (now - user.lastWeekly))}*.`,
      );
    }

    user.weeklyStreak =
      user.lastWeekly && now - user.lastWeekly > gracePeriod
        ? 1
        : (user.weeklyStreak || 0) + 1;
    const baseReward = (Math.floor(Math.random() * 2000) + 3000) * 3;
    const streakBonus = Math.min(user.weeklyStreak - 1, 8) * 1500;
    const totalReward = baseReward + streakBonus;
    user.bolsillo = Number(user.bolsillo || 0) + totalReward;
    user.lastWeekly = now;
    setEconomyUser(ctx.from, ctx.sender, user);

    let text = `╭〔 🎁 ${fytBold("BONO SEMANAL")} 〕⬣\n`;
    text += `┃ 🔥 ${fytBold("RACHA")}: *${user.weeklyStreak} Semanas*\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n`;
    text += `┃ 🎉 Base (x3): ₡${formatCoins(baseReward)}\n`;
    text += `┃ ✨ Bono de Racha: +₡${formatCoins(streakBonus)}\n`;
    text += `┃ 💰 Total Ganado: *₡${formatCoins(totalReward)}*\n`;
    text += `┃ 💵 Saldo actual: ₡${formatCoins(user.bolsillo)}\n\n`;
    text += `┃ ⏳ Próxima recompensa: En *7 días*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
