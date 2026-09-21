import { cooldownText } from "../../core/economyConfig.ts";
import {
  economyUser,
  formatCoins,
  saveEconomy,
} from "../../core/economyRuntime.ts";

const options = ["piedra", "papel", "tijera"];
const emojis: Record<string, string> = {
  piedra: "🪨",
  papel: "📄",
  tijera: "✂️",
};

export default {
  name: ["ppt", "juego", "rps", "desafio", "retar"],
  category: "economy",
  description: "Juega Piedra, Papel o Tijera contra Aura Reed.",
  async run(ctx: any) {
    const user = economyUser(ctx, ctx.sender);
    const choice = String(ctx.args?.[0] ?? "").toLowerCase();
    const now = Date.now();
    const cooldown = 10 * 60 * 1000;
    if (user.lastPpt && now - user.lastPpt < cooldown)
      return ctx.reply(
        `⏳ Espera *${cooldownText(cooldown - (now - user.lastPpt))}* para jugar de nuevo.`,
      );
    if (!options.includes(choice))
      return ctx.reply(
        `⚠️ Usa: *${ctx.usedPrefix ?? "."}ppt piedra|papel|tijera*`,
      );
    const bot = options[Math.floor(Math.random() * options.length)];
    const won =
      (choice === "piedra" && bot === "tijera") ||
      (choice === "papel" && bot === "piedra") ||
      (choice === "tijera" && bot === "papel");
    const reward = won ? Math.floor(Math.random() * 1401) + 100 : 0;
    user.lastPpt = now;
    user.bolsillo += reward;
    saveEconomy(ctx, ctx.sender, user);
    const result =
      choice === bot
        ? "🤝 ¡Empate!"
        : won
          ? `🎉 ¡Ganaste! +₡${formatCoins(reward)}`
          : "❌ ¡Perdiste!";
    let text = `╭〔 🎮 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣\n┃ 𝐏𝐈𝐄𝐃𝐑𝐀, 𝐏𝐀𝐏𝐄𝐋 𝐎 𝐓𝐈𝐉𝐄𝐑𝐀\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👤 Tu elección: ${emojis[choice]} *${choice.toUpperCase()}*\n┃ 🤖 Aura Reed: ${emojis[bot]} *${bot.toUpperCase()}*\n\n┃ ${result}\n┃ 💵 Cartera: ₡${formatCoins(user.bolsillo)}\n\n╰〔 ⚡ 𝐒𝐘𝐒𝐓𝐄𝐌 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
