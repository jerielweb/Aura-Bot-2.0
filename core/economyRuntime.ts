import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { addAura } from "./economyConfig.ts";
import { formatCoins, getEconomyUser, setEconomyUser } from "./economyConfig.ts";

export function economyTarget(ctx: any): string {
  const message = ctx.msg?.message ?? {};
  const infos = Object.values(message).map((value: any) => value?.contextInfo).filter(Boolean) as any[];
  const target = infos.flatMap((info) => info.mentionedJid ?? [])[0]
    ?? infos.find((info) => info.quotedMessage)?.participant
    ?? ctx.sender;
  return jidNormalizedUser(target);
}

export function economyUser(ctx: any, jid = ctx.sender) {
  return getEconomyUser(ctx.from, jid, { bolsillo: 0, banco: 0 });
}

export function saveEconomy(ctx: any, jid: string, user: Record<string, any>) {
  return setEconomyUser(ctx.from, jid, user);
}

export function addEconomyXp(jid: string, amount: number) {
  return addAura(jid, amount);
}

export function amountArg(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") return 0;
  const amount = Number.parseInt(String(value), 10);
  return Number.isFinite(amount) ? amount : 0;
}

export { formatCoins, getEconomyUser, setEconomyUser };