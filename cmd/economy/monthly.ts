import {
  cooldownText,
  formatCoins,
  getEconomyUser,
  setEconomyUser,
} from "../../core/economyConfig.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["monthly", "mensual"],
  category: "economy",
  description: "Reclama tu recompensa mensual con sistema de racha.",
  async run(ctx: any) {
    const user = getEconomyUser(ctx.from, ctx.sender, {
      lastMonthly: 0,
      monthlyStreak: 0,
    });
    const now = Date.now();
    const cooldown = 30 * 24 * 60 * 60 * 1000;
    const gracePeriod = 45 * 24 * 60 * 60 * 1000;

    if (user.lastMonthly && now - user.lastMonthly < cooldown) {
      return ctx.reply(
        `⏳ Ya reclamaste tu sueldo mensual.\nVuelve en *${cooldownText(cooldown - (now - user.lastMonthly))}*.`,
      );
    }

    user.monthlyStreak =
      user.lastMonthly && now - user.lastMonthly > gracePeriod
        ? 1
        : (user.monthlyStreak || 0) + 1;
    const baseReward = (Math.floor(Math.random() * 5000) + 10000) * 5;
    const streakBonus = Math.min(user.monthlyStreak - 1, 6) * 5000;
    const totalReward = baseReward + streakBonus;
    user.bolsillo = Number(user.bolsillo || 0) + totalReward;
    user.lastMonthly = now;
    setEconomyUser(ctx.from, ctx.sender, user);

    let text = `╭〔 🎁 ${fytBold("SUELDO MENSUAL")} 〕⬣\n`;
    text += `┃ 🔥 ${fytBold("RACHA")}: *${user.monthlyStreak} Meses*\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n`;
    text += `┃ 🎉 Base (x5): ₡${formatCoins(baseReward)}\n`;
    text += `┃ ✨ Bono de Racha: +₡${formatCoins(streakBonus)}\n`;
    text += `┃ 💰 Total Ganado: *₡${formatCoins(totalReward)}*\n`;
    text += `┃ 💵 Saldo actual: ₡${formatCoins(user.bolsillo)}\n\n`;
    text += `┃ ⏳ Próxima recompensa: En *30 días*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
