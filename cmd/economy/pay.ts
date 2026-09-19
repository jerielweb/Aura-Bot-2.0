import { amountArg, economyTarget, economyUser, formatCoins, saveEconomy } from "../../core/economyRuntime.ts";

export default {
  name: ["transfer", "pagar", "pay"],
  category: "economy",
  description: "Transfiere monedas a otro usuario del grupo.",
  groupOnly: true,
  async run(ctx: any) {
    const target = economyTarget(ctx);
    const amount = amountArg(ctx.args?.[0]);
    const sender = economyUser(ctx);
    if (target === ctx.sender) return ctx.reply("❌ No puedes transferirte dinero a ti mismo.");
    if (amount <= 0) return ctx.reply("⚠️ Cantidad inválida. Ejemplo: *.pay 100 @usuario*");
    if (sender.bolsillo < amount) return ctx.reply(`❌ No tienes suficientes monedas. Tienes *₡${formatCoins(sender.bolsillo)}*.`);
    const receiver = economyUser(ctx, target);
    sender.bolsillo -= amount;
    receiver.bolsillo += amount;
    saveEconomy(ctx, ctx.sender, sender);
    saveEconomy(ctx, target, receiver);
    let text = `╭〔 💸 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑𝐄𝐍𝐂𝐈𝐀 〕⬣\n┃ ✅ 𝐏𝐀𝐆𝐎 𝐑𝐄𝐀𝐋𝐈𝐙𝐀𝐃𝐎\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 📤 De: *@${ctx.sender.split("@")[0]}*\n┃ 📥 Para: @${target.split("@")[0]}\n┃ 💰 Monto: ₡${formatCoins(amount)}\n\n╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender, target] });
  },
};