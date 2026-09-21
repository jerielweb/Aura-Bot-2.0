import { cooldownText } from "../../core/economyConfig.ts";
import { economyTarget, economyUser, formatCoins, saveEconomy } from "../../core/economyRuntime.ts";

export default {
  name: ["steal", "robar"],
  category: "economy",
  description: "Intenta robarle monedas a otro usuario del grupo.",
  groupOnly: true,
  async run(ctx: any) {
    const target = await economyTarget(ctx);
    if (target === ctx.sender) return ctx.reply("🧠 No puedes robarte a ti mismo.");
    const thief = economyUser(ctx);
    const victim = economyUser(ctx, target);
    const now = Date.now();
    const cooldown = 60 * 60 * 1000;
    if (thief.lastSteal && now - thief.lastSteal < cooldown) return ctx.reply(`⏳ Espera *${cooldownText(cooldown - (now - thief.lastSteal))}* para volver a intentarlo.`);
    if (victim.bolsillo < 500) return ctx.reply("🪵 La cartera de este usuario está vacía o tiene menos de ₡500.");
    thief.lastSteal = now;
    const success = Math.random() <= 0.4;
    let text = `╭〔 👤 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣\n┃ 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐃𝐄 𝐀𝐒𝐀𝐋𝐓𝐎𝐒\n╰━━━━━━━━━━━━⬣\n\n`;
    if (success) {
      const stolen = Math.floor(victim.bolsillo * (Math.random() * 0.25 + 0.1));
      victim.bolsillo -= stolen;
      thief.bolsillo += stolen;
      text += `┃ ⚔️ ¡Asalto exitoso!\n┃ 💰 Botín conseguido: +₡${formatCoins(stolen)}\n`;
    } else {
      const fine = Math.floor(Math.random() * 3001) + 2000;
      thief.bolsillo = Math.max(0, thief.bolsillo - fine);
      text += `┃ 🚨 ¡El plan falló!\n┃ 💸 Fianza de escape: -₡${formatCoins(fine)}\n`;
    }
    saveEconomy(ctx, ctx.sender, thief);
    saveEconomy(ctx, target, victim);
    text += `┃ 💵 Tu cartera: ₡${formatCoins(thief.bolsillo)}\n\n╰〔 ⚡ 𝐒𝐘𝐒𝐓𝐄𝐌 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender, target] });
  },
};