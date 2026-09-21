import { economyTarget, economyUser, formatCoins } from "../../core/economyRuntime.ts";

export default {
  name: ["bank", "bal", "balance", "coins"],
  category: "economy",
  description: "Muestra tu saldo actual o el de otro usuario.",
  async run(ctx: any) {
    const target = await economyTarget(ctx);
    const user = economyUser(ctx, target);
    const total = Number(user.bolsillo) + Number(user.banco);
    let text = `╭〔 💰 𝐄𝐂𝐎𝐍𝐎𝐌𝐈́𝐀 〕⬣\n`;
    text += `┃ 🏦 𝐄𝐒𝐓𝐀𝐃𝐎 𝐃𝐄 𝐂𝐔𝐄𝐍𝐓𝐀\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 𝐔𝐬𝐮𝐚𝐫𝐢𝐨: *@${target.split("@")[0]}*\n\n`;
    text += `┃ 💵 𝐂𝐚𝐫𝐭𝐞𝐫𝐚 › ₡${formatCoins(user.bolsillo)}\n`;
    text += `┃ 🏦 𝐁𝐚𝐧𝐜𝐨 › ₡${formatCoins(user.banco)}\n`;
    text += `┃ 💎 𝐓𝐨𝐭𝐚𝐥 › ₡${formatCoins(total)}\n\n`;
    text += `╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [target] });
  },
};