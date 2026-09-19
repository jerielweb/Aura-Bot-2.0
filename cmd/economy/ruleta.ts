import { amountArg, economyUser, formatCoins, saveEconomy } from "../../core/economyRuntime.ts";

export default {
  name: ["ruleta", "roulette", "rt"],
  category: "economy",
  description: "Juega a la ruleta.",
  async run(ctx: any) {
    const user = economyUser(ctx);
    const amount = amountArg(ctx.args?.[0]);
    const color = String(ctx.args?.[1] ?? "").toLowerCase();
    if (amount <= 0 || !["red", "black", "green"].includes(color)) return ctx.reply("⚠️ Usa: *.ruleta [cantidad] [red|black|green]*");
    if (user.bolsillo < amount) return ctx.reply(`❌ No tienes suficientes monedas. Tienes *₡${formatCoins(user.bolsillo)}*.`);
    const roll = Math.random() * 100;
    const result = roll < 40 ? "red" : roll < 80 ? "black" : "green";
    const winnings = result === color ? amount * (color === "green" ? 20 : 2) : 0;
    user.bolsillo += winnings - amount;
    saveEconomy(ctx, ctx.sender, user);
    const labels: Record<string, string> = { red: "🔴 RED", black: "⚫ BLACK", green: "🟢 GREEN" };
    let text = `╭〔 🎡 𝐑𝐔𝐋𝐄𝐓𝐀 〕⬣\n┃ 🎰 𝐑𝐄𝐒𝐔𝐋𝐓𝐀𝐃𝐎\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 🎡 Resultado: ${labels[result]}\n┃ 🎯 Apostaste: ${labels[color]}\n┃ ${winnings ? `✅ Ganancia: ₡${formatCoins(winnings)}` : `❌ Pérdida: ₡${formatCoins(amount)}`}\n┃ 💵 Cartera: ₡${formatCoins(user.bolsillo)}\n\n╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};