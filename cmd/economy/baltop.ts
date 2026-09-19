import { getGroupEconomyUsers, formatCoins } from "../../core/economyConfig.ts";

export default {
  name: ["baltop", "topbal", "topcoins"],
  category: "economy",
  description: "Muestra quién tiene más monedas en el grupo.",
  groupOnly: true,
  async run(ctx: any) {
    const rows = Object.entries(getGroupEconomyUsers(ctx.from))
      .map(([jid, user]: [string, any]) => ({ jid, total: Number(user.bolsillo ?? 0) + Number(user.banco ?? 0) }))
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    if (!rows.length) return ctx.reply("⚠️ No hay usuarios con saldo para mostrar.");
    const mentions = rows.map((row) => row.jid);
    let text = `╭━━〔 💎 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 𝐓𝐎𝐏 💎 〕━━⬣\n┃ 🏆 𝐑𝐀𝐍𝐊𝐈𝐍𝐆 𝐃𝐄 𝐌𝐎𝐍𝐄𝐃𝐀𝐒\n╰━━━━━━━━━━━━━━━━⬣\n\n`;
    rows.forEach((row, index) => { text += `┃ ${index < 3 ? ["🥇", "🥈", "🥉"][index] : "🎖️"} @${row.jid.split("@")[0]}\n┃ ₡ ${formatCoins(row.total)} AuraCoins\n\n`; });
    text += `╰━━〔 ⚡ 𝐀𝐔𝐑𝐀 𝐄𝐂𝐎𝐍𝐎𝐌𝐘 ⚡ 〕━━⬣`;
    return ctx.reply({ text, mentions });
  },
};