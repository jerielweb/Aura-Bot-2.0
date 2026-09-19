import { cooldownText, formatCoins, getEconomyUser, setEconomyUser } from "../../core/economyConfig.ts";
import {fytBold} from "./../../core/socketText.ts";

export default {
  name: ["fortnightly", "quincenal", "quinsenal", "quincena"],
  category: "economy",
  description: "Reclama tu recompensa quincenal.",
  async run(ctx: any) {
    const user = getEconomyUser(ctx.from, ctx.sender, { lastFortnightly: 0, fortnightlyStreak: 0 });
    const now = Date.now();
    const cooldown = 15 * 24 * 60 * 60 * 1000;
    const gracePeriod = 22 * 24 * 60 * 60 * 1000;

    if (user.lastFortnightly && now - user.lastFortnightly < cooldown) {
      return ctx.reply(`⏳ Ya reclamaste tu recompensa quincenal.\nVuelve en *${cooldownText(cooldown - (now - user.lastFortnightly))}*.`);
    }

    user.fortnightlyStreak = user.lastFortnightly && now - user.lastFortnightly > gracePeriod ? 1 : (user.fortnightlyStreak || 0) + 1;
    const baseReward = Math.floor(Math.random() * 5001) + 10000;
    const streakBonus = Math.min(user.fortnightlyStreak - 1, 6) * 1500;
    const totalReward = baseReward + streakBonus;
    user.bolsillo += totalReward;
    user.lastFortnightly = now;
    setEconomyUser(ctx.from, ctx.sender, user);

    let text = `╭〔 🎁 ${fytBold("BONO QUINCENAL")} 〕⬣\n`;
    text += `┃ 🔥 𝐑𝐀𝐂𝐇𝐀: *${user.fortnightlyStreak} Quincenas*\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n`;
    text += `┃ 🎉 Base: ₡${formatCoins(baseReward)}\n`;
    text += `┃ ✨ Bono de Racha: +₡${formatCoins(streakBonus)}\n`;
    text += `┃ 💰 Total Ganado: *₡${formatCoins(totalReward)}*\n`;
    text += `┃ 💵 Saldo actual: ₡${formatCoins(user.bolsillo)}\n\n`;
    text += `╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};