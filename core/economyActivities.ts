import { addEconomyXp, economyUser, formatCoins, saveEconomy } from "./economyRuntime.ts";
import { cooldownText } from "./economyConfig.ts";
import { economyTexts } from "./economyTexts.ts";

type ActivityOptions = {
  names: string[];
  description: string;
  title: string;
  icon: string;
  cooldown: number;
  reward: [number, number];
  xp: [number, number];
  success: string[];
  fail: string[];
};

const randomBetween = ([min, max]: [number, number]) => Math.floor(Math.random() * (max - min + 1)) + min;

export function createEconomyActivity(options: ActivityOptions) {
  const key = options.names[0];
  const lastKey = `last${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  return {
    name: options.names,
    category: "economy",
    description: options.description,
    async run(ctx: any) {
      const user = economyUser(ctx);
      const now = Date.now();
      const last = Number(user[lastKey] ?? 0);
      if (last && now - last < options.cooldown) {
        return ctx.reply(`⏳ Estás cansado. Vuelve en *${cooldownText(options.cooldown - (now - last))}*.`);
      }

      const xp = randomBetween(options.xp);
      const success = Math.random() > 0.3;
      const reward = success ? randomBetween(options.reward) : 0;
      user[lastKey] = now;
      user.bolsillo += reward;
      saveEconomy(ctx, ctx.sender, user);
      addEconomyXp(ctx.sender, xp);

      const configuredTexts = (economyTexts as any)[key];
      const successTexts = Array.isArray(configuredTexts)
        ? configuredTexts
        : configuredTexts?.success;
      const failTexts = configuredTexts?.fail;
      const successMessage = successTexts?.length ? successTexts : options.success;
      const failMessage = failTexts?.length ? failTexts : options.fail;

      let text = `╭〔 ${options.icon} 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣\n┃ ${options.title}\n╰━━━━━━━━━━━━⬣\n\n`;
      text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n┃ ✨ XP Ganado: +${xp}\n`;
      text += success
        ? `┃ ${successMessage[Math.floor(Math.random() * successMessage.length)]} *₡${formatCoins(reward)}*\n`
        : `┃ ${failMessage[Math.floor(Math.random() * failMessage.length)]}\n`;
      text += `┃ 💵 Saldo actual: ₡${formatCoins(user.bolsillo)}\n\n╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
      return ctx.reply({ text, mentions: [ctx.sender] });
    },
  };
}