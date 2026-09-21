import {
  amountArg,
  economyUser,
  formatCoins,
  saveEconomy,
} from "../../core/economyRuntime.ts";

export default {
  name: ["deposit", "d", "dep"],
  category: "economy",
  description: "Deposita monedas en el banco.",
  async run(ctx: any) {
    const user = economyUser(ctx);
    const raw = String(ctx.args?.[0] ?? "").toLowerCase();
    const amount =
      raw === "all" || raw === "todo" ? user.bolsillo : amountArg(raw);
    if (amount <= 0)
      return ctx.reply(
        "⚠️ Ingresa una cantidad válida. Ejemplo: *.dep 100* o *.dep all*",
      );
    if (user.bolsillo < amount)
      return ctx.reply(
        `❌ No tienes suficientes monedas. Tu saldo es de *₡${formatCoins(user.bolsillo)}*.`,
      );
    user.bolsillo -= amount;
    user.banco += amount;
    saveEconomy(ctx, ctx.sender, user);
    let text = `╭〔 🏦 𝐁𝐀𝐍𝐂𝐎 〕⬣\n┃ 📥 𝐃𝐄𝐏𝐎́𝐒𝐈𝐓𝐎 𝐄𝐗𝐈𝐓𝐎𝐒𝐎\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 📥 Depositaste: ₡${formatCoins(amount)}\n┃ 🏦 Nuevo saldo banco: ₡${formatCoins(user.banco)}\n┃ 💵 Monedas restantes: ₡${formatCoins(user.bolsillo)}\n\n╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
