import { addAura, addBolsillo, checkCooldown, formTime, setCooldown } from "./economyConfig.ts";
import { economyTexts } from "./economyTexts.ts";

const random = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export async function runActivity(ctx: any, kind: keyof typeof economyTexts) {
  const cooldown = checkCooldown(ctx.sender, kind as any);
  if (!cooldown.ready) return ctx.reply(`⏳ Espera ${formTime(cooldown.remaining ?? 0)} para volver a usar este comando.`);
  setCooldown(ctx.sender, kind as any);

  const success = Math.random() < 0.75;
  const data: any = economyTexts[kind];
  const amount = Math.floor(Math.random() * 400) + 100;

  if (success) {
    addBolsillo(ctx.sender, amount);
    addAura(ctx.sender, 10);
    return ctx.reply(`✅ ${random(Array.isArray(data) ? data : data.success)} $${amount}.\n✨ Aura +10`);
  }

  const loss = Math.min(Math.floor(Math.random() * 150) + 25, amount);
  addBolsillo(ctx.sender, -loss);
  addAura(ctx.sender, -5);
  const failText = Array.isArray(data) ? "Tuviste un mal día y perdiste" : random(data.fail);
  return ctx.reply(`❌ ${failText} $${loss}.\n💨 Aura -5`);
}