import { amountArg, economyUser, formatCoins, saveEconomy } from "../../core/economyRuntime.ts";

export default {
  name: ["withdraw", "retirar", "with"],
  category: "economy",
  description: "Retira monedas de tu cuenta de banco.",
  async run(ctx: any) {
    const user = economyUser(ctx);
    const raw = String(ctx.args?.[0] ?? "").toLowerCase();
    const amount = raw === "all" || raw === "todo" ? user.banco : amountArg(raw);
    if (amount <= 0) return ctx.reply("⚠️ Ingresa una cantidad válida. Ejemplo: *.with 100* o *.with all*");
    if (user.banco < amount) return ctx.reply(`❌ No tienes suficientes fondos. Tienes *₡${formatCoins(user.banco)}*.`);
    user.banco -= amount;
    user.bolsillo += amount;
    saveEconomy(ctx, ctx.sender, user);
    let text = `╭〔 🏦 𝐁𝐀𝐍𝐂𝐎 〕⬣\n┃ 📤 𝐑𝐄𝐓𝐈𝐑𝐎 𝐄𝐗𝐈𝐓𝐎𝐒𝐎\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 📤 Retiraste: ₡${formatCoins(amount)}\n┃ 💵 Cartera: ₡${formatCoins(user.bolsillo)}\n┃ 🏦 Fondos restantes: ₡${formatCoins(user.banco)}\n\n╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};