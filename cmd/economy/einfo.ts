import { cooldownText, getEconomyUser } from "../../core/economyConfig.ts";

export default {
  name: ["einfo", "economia"],
  category: "economy",
  description: "Muestra información del sistema económico.",
  async run(ctx: any) {
    const user = getEconomyUser(ctx.from, ctx.sender);
    const now = Date.now();
    const remaining = (key: string, duration: number) => {
      const value = now - Number(user[key] ?? 0);
      return value < duration ? `⏳ _${cooldownText(duration - value)}_` : "✅ Disponible";
    };
    const prefix = ctx.usedPrefix ?? ".";
    let text = `╭〔 ₡ 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐄𝐂𝐎𝐍𝐎́𝐌𝐈𝐂𝐎 〕⬣\n┃ ℹ️ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂𝐈𝐎́𝐍\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ Bienvenido al sistema de *AuraCoins* (₡).\n┃ Gana, ahorra y gestiona tu fortuna.\n\n`;
    text += `┣━━〔 🛠️ 𝐂𝐎́𝐌𝐎 𝐆𝐀𝐍𝐀𝐑 〕━━⬣\n\n`;
    text += `┃ ➪ *${prefix}daily:* ${remaining("lastDaily", 86400000)}\n┃ ➪ *${prefix}quincenal:* ${remaining("lastFortnightly", 1296000000)}\n┃ ➪ *${prefix}cf:* ${remaining("lastCf", 60000)}\n┃ ➪ *${prefix}bal:* Consulta tu saldo.\n┃ ➪ *${prefix}dep / ${prefix}with:* Mueve fondos al banco.\n\n`;
    text += `╰━━〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕━━⬣`;
    return ctx.reply({ text });
  },
};