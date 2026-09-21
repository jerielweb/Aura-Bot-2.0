import { db } from "../dbController/db.ts";
import { fytBold } from "./socketText.ts";
import { economyUser } from "./economyRuntime.ts";
export type Profile = Record<string, any>;

type PendingProfileAction = {
  kind: "marry" | "divorce";
  from: string;
  to: string;
  expiresAt: number;
};

const pendingProfileActions = new Map<string, PendingProfileAction>();

export const DEFAULT_PFP =
  "https://i.pinimg.com/736x/af/a3/24/afa324dff15091f93624bb470d60a592.jpg";

const DEFAULT_PROFILE = {
  name: "Sin nombre",
  description: "Sin descripción",
  gender: "No definido",
  birthDate: null,
  marriedTo: null,
  bolsillo: 0,
  banco: 0,
  aura: 0,
  auraXp: 0,
};

export function getProfile(jid: string): Profile {
  const user: Profile = (db.getUser(jid) ?? {}) as Profile;
  const profile = { ...DEFAULT_PROFILE, ...user };

  if (profile.name === "Sin nombre" && user.username)
    profile.name = user.username;
  return profile;
}

export function updateProfile(jid: string, data: Profile) {
  db.setUser(jid, data);
  return getProfile(jid);
}

export function setPendingProfileAction(
  action: Omit<PendingProfileAction, "expiresAt">,
) {
  const key = `${action.kind}:${action.to}`;
  pendingProfileActions.set(key, {
    ...action,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

export function getPendingProfileAction(
  kind: PendingProfileAction["kind"],
  target: string,
) {
  const key = `${kind}:${target}`;
  const action = pendingProfileActions.get(key);
  if (!action) return null;
  if (action.expiresAt <= Date.now()) {
    pendingProfileActions.delete(key);
    return null;
  }
  return action;
}

export function clearPendingProfileAction(action: PendingProfileAction) {
  pendingProfileActions.delete(`${action.kind}:${action.to}`);
}

export async function getProfilePictureUrl(
  socket: any,
  jid: string,
): Promise<string> {
  try {
    return await socket.profilePictureUrl(jid, "image");
  } catch {
    return DEFAULT_PFP;
  }
}

export async function profileTarget(ctx: any): Promise<string> {
  const message = ctx.msg?.message ?? {};
  const contextInfos = Object.values(message)
    .map((value: any) => value?.contextInfo)
    .filter(Boolean) as any[];
  const mentioned = contextInfos.flatMap(
    (context) => context.mentionedJid ?? [],
  );
  const quotedParticipant = contextInfos.find(
    (context) => context.quotedMessage,
  )?.participant;
  const target = mentioned[0] ?? quotedParticipant ?? ctx.sender;

  if (target.endsWith("@lid") && typeof ctx.resolveLid === "function") {
    return (await ctx.resolveLid(target)) || target;
  }

  return target;
}

export function formatProfile(jid: string, profile = getProfile(jid)): string {
  const about = jid.split("@")[0];
  const spouse = profile.marriedTo
    ? `@${String(profile.marriedTo).split("@")[0]}`
    : "Soltero/a";
  const age = getAge(String(profile.birthDate ?? ""));
  const aura = Number(profile.aura ?? 0);
  const xp = Number(profile.auraXp ?? aura);
  const level = Math.max(
    1,
    Number(profile.level ?? Math.floor(aura / 100) + 1),
  );
  const wallet = Number(profile.bolsillo ?? 0);
  const bank = Number(profile.banco ?? profile.bank ?? 0);
  const userId = `WB${jid.split("@")[0]}`;

  return [
    `╭〔 👤 ${fytBold("PERFIL")} 〕⬣`,
    `┃ 📋 ${fytBold("SOBRE")} @${about}`,
    "╰━━━━━━━━━━━━⬣",
    "",
    `┏━━〔 ${fytBold("BIOGRAFIA")} 〕━━⬣`,
    `┃ ${profile.description}`,
    "┗━━━━━━━━━━━━⬣",
    "",
    `┏━━〔 ${fytBold("INFO BASICA")} 〕━━⬣`,
    `┃ 👤 ${fytBold("Nombre")} › ${profile.name}`,
    `┃ 🆔 ${fytBold("ID")} › ${userId}`,
    `┃ ⚧️ ${fytBold("Género")} › ${profile.gender}`,
    `┃ 🎂 ${fytBold("Cumpleaños")} › ${profile.birthDate ?? "No definido"}`,
    `┃ 🎈 ${fytBold("Edad")} › ${age ?? "No definida"}`,
    `┃ 💍 ${fytBold("Pareja")} › ${spouse}`,
    "┗━━━━━━━━━━━━⬣",
    "",
    `┏━━〔 ${fytBold("RANGO")} 〕━━⬣`,
    `┃ 📊 ${fytBold("Nivel Aura")} › ${level}`,
    `┃ ✨ ${fytBold("Puntos Aura")} › ${formatCompact(xp)}`,
    `┃ 💵 ${fytBold("Cartera")} › ₡${formatCompact(wallet)}`,
    `┃ 🏦 ${fytBold("Banco")} › ₡${formatCompact(bank)}`,
    "",
    `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`,
  ].join("\n");
}

export async function sendProfilePreview(ctx: any, target: string) {
  const profile = getProfile(target);
  const economy = economyUser(ctx, target);
  const text = formatProfile(target, {
    ...profile,
    bolsillo: economy.bolsillo,
    banco: economy.banco,
  });

  try {
    const profileUrl = await getProfilePictureUrl(ctx.sock, target);
    return ctx.sock.sendMessage(
      ctx.from,
      { image: { url: profileUrl }, caption: text, mentions: [target] },
      { quoted: ctx.msg },
    );
  } catch {
    return ctx.reply({ text, mentions: [target] });
  }
}

function getAge(value: string): number | null {
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;

  const birth = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
  );
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());
  if (!birthdayPassed) age -= 1;
  return Math.max(0, age);
}

function formatCompact(value: number): string {
  if (value >= 1000)
    return `${(value / 1000).toFixed(value >= 1000000 ? 0 : 1)}K`;
  return value.toLocaleString("es-ES");
}
