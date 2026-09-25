import { db } from "../dbController/db.ts";

export type EconomyUser = Record<string, any>;

const DEFAULT_ECONOMY_USER: EconomyUser = {
  bolsillo: 0,
  banco: 0,
};

type CooldownRows = {
  daily: number;
  weekly: number;
  fortnightly: number;
  monthly: number;
  steal: number;
  work: number;
  cf: number;
  roulete: number;
  mine: number;
  hunt: number;
  ppt: number;
  slut: number;
  crime: number;
  adventure: number;
  aura: number;
};

const COOLDOWNS: CooldownRows = {
  roulete: 1 * 60 * 1000,
  cf: 1 * 60 * 1000,
  ppt: 1 * 60 * 1000,
  work: 3 * 60 * 1000,
  mine: 30 * 60 * 1000,
  hunt: 30 * 60 * 1000,
  crime: 60 * 60 * 1000,
  slut: 60 * 60 * 1000,
  steal: 60 * 60 * 1000,
  adventure: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  fortnightly: 15 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  aura: 3 * 60 * 1000,
};

export function formTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function checkCooldown(
  groupJid: string,
  userJid: string,
  key: keyof CooldownRows,
) {
  const user = getEconomyUser(groupJid, userJid);
  const lastKey = `last${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  const last = Number(user[lastKey] ?? 0);
  const cooldown = COOLDOWNS[key];
  const diff = Date.now() - last;

  if (!cooldown) {
    return { ready: true };
  }

  if (diff < cooldown) {
    return { ready: false, remaining: cooldown - diff };
  }

  return { ready: true };
}

export function setCooldown(
  groupJid: string,
  userJid: string,
  key: keyof CooldownRows,
) {
  const lastKey = `last${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  setEconomyUser(groupJid, userJid, { [lastKey]: Date.now() });
}

export function addBolsillo(groupJid: string, userJid: string, amount: number) {
  const user = getEconomyUser(groupJid, userJid);
  const current = Number(user.bolsillo ?? 0);
  setEconomyUser(groupJid, userJid, { bolsillo: current + amount });
}

export function getAuraLevel(points: number): number {
  const aura = Math.max(0, Number(points) || 0);
  if (aura < 100) return 1;
  if (aura < 200) return 2;
  if (aura < 400) return 3;
  return 4;
}

export function getBolsillo(groupJid: string, userJid: string): number {
  const user = getEconomyUser(groupJid, userJid);
  return Number(user.bolsillo ?? 0);
}

export function addAura(jid: string, amount: number) {
  const user: Record<string, any> = db.getUser(jid) ?? {};
  const aura = Math.max(0, Number(user.aura ?? 0) + amount);
  db.setUser(jid, { aura, auraXp: aura, level: getAuraLevel(aura) });
  return aura;
}

export function transferBolsillo(
  groupJid: string,
  from: string,
  to: string,
  amount: number,
): boolean {
  const value = Math.floor(Number(amount));
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    from === to ||
    getBolsillo(groupJid, from) < value
  )
    return false;

  addBolsillo(groupJid, from, -value);
  addBolsillo(groupJid, to, value);
  return true;
}

function getEconomyStore(groupJid: string): Record<string, EconomyUser> {
  const group = db.getGroup(groupJid) as Record<string, any>;
  if (!group.economy || typeof group.economy !== "object") group.economy = {};
  if (!group.economy.users || typeof group.economy.users !== "object")
    group.economy.users = {};
  return group.economy.users;
}

export function getEconomyUser(
  groupJid: string,
  userJid: string,
  defaults: EconomyUser = {},
): EconomyUser {
  const users = getEconomyStore(groupJid);
  return { ...DEFAULT_ECONOMY_USER, ...defaults, ...(users[userJid] ?? {}) };
}

export function setEconomyUser(
  groupJid: string,
  userJid: string,
  data: EconomyUser,
): EconomyUser {
  const group = db.getGroup(groupJid) as Record<string, any>;
  const users = getEconomyStore(groupJid);
  users[userJid] = { ...getEconomyUser(groupJid, userJid), ...data };
  db.setGroup(groupJid, {
    ...group,
    economy: { ...(group.economy ?? {}), users },
  });
  return users[userJid];
}

export function getGroupEconomyUsers(
  groupJid: string,
): Record<string, EconomyUser> {
  return getEconomyStore(groupJid);
}

export function formatCoins(value: number): string {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("es-ES");
}

export function cooldownText(remaining: number): string {
  return formTime(Math.max(0, remaining));
}
