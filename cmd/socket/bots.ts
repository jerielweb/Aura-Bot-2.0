import { fytBold } from "../../core/socketText.ts";

function normalizeNumber(value: unknown): string {
  return String(value || "")
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
}

function normalizeGroup(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/:.+@/, "@");
}

function cleanJid(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/:\d+(?=@)/, "");
}

function isPhoneJid(value: unknown): boolean {
  return /^\d+@s\.whatsapp\.net$/.test(cleanJid(value));
}

function getBotNumber(bot: any, fallback?: string): string {
  const jid = [
    bot.jid,
    bot.phone_number,
    bot.data?.jid,
    fallback,
    bot.bot_id,
  ].find((value) => isPhoneJid(value));
  return normalizeNumber(jid);
}

function matchesIdentity(value: unknown, identities: unknown[]): boolean {
  const normalized = cleanJid(value);
  if (!normalized) return false;
  return identities.some((identity) => {
    const candidate = cleanJid(identity);
    return candidate && candidate === normalized;
  });
}

async function resolveBotJid(
  bot: any,
  participants: any[],
  resolveLid?: (jid: string) => Promise<string>,
): Promise<string> {
  const identities = [bot.bot_id, bot.lid, bot.jid, bot.phone_number].filter(
    Boolean,
  );
  const participant = participants.find(
    (entry: any) =>
      matchesIdentity(entry?.id, identities) ||
      matchesIdentity(entry?.lid, identities) ||
      matchesIdentity(entry?.jid, identities) ||
      matchesIdentity(entry?.phoneNumber, identities),
  );

  const participantJid = [
    participant?.phoneNumber,
    participant?.jid,
    participant?.id,
  ].find((value) => isPhoneJid(value));
  if (participantJid) return cleanJid(participantJid);

  const directJid = [bot.jid, bot.phone_number, bot.data?.jid].find((value) =>
    isPhoneJid(value),
  );
  if (directJid) return cleanJid(directJid);

  const lid = [bot.lid, bot.bot_id].find((value) =>
    String(value || "").endsWith("@lid"),
  );
  if (lid && resolveLid) {
    const resolved = await resolveLid(cleanJid(lid));
    if (isPhoneJid(resolved)) return cleanJid(resolved);
  }

  return "";
}

function getBotType(bot: any): string {
  return Number(bot.isMain) === 1 ? "Main" : "SuB-Bot";
}

export default {
  name: ["bots", "btos", "subbots", "lista-bots"],
  category: "socket",
  description: "Muestra los bots activos y su tipo.",
  ownerOnly: false,

  async run({ from, db, groupMeta, resolveLid, usedPrefix, reply }: any) {
    const bots = (db.getAllBots?.() || []).filter(
      (bot: any) =>
        String(bot.status || "offline").toLowerCase() === "active" &&
        (getBotNumber(bot) || bot.bot_id || bot.lid),
    );
    const isGroup = String(from || "").endsWith("@g.us");
    const currentGroup = normalizeGroup(from);
    const participants = isGroup ? groupMeta?.participants || [] : [];
    const mentions: string[] = [];

    let visibleBots = bots;
    if (isGroup) {
      visibleBots = bots.filter((bot: any) =>
        (Array.isArray(bot.groups) ? bot.groups : []).some(
          (group: string) => normalizeGroup(group) === currentGroup,
        ),
      );
    }

    let text = `╭〔 🔌 ${fytBold("AURA REED")} 〕⬣\n`;
    text += `┃ 🤖 ${fytBold(isGroup ? "BOTS ACTIVOS EN EL GRUPO" : "BOTS ACTIVOS")}\n`;
    text += `┣━━━━━━━━━━━━⬣\n`;
    text += `┃ 📊 ${fytBold("Activos")}: *${bots.length}*\n`;
    if (isGroup) {
      text += `┃ ⚡ ${fytBold("En este grupo")}: *${visibleBots.length}*\n`;
      text += `┣━━━━━━━━━━━━⬣\n`;
    }
    text += `\n`;

    if (!visibleBots.length) {
      text += isGroup
        ? `┃ > No hay bots registrados en este grupo.\n`
        : `┃ > No hay bots registrados.\n`;
    } else {
      for (const bot of visibleBots) {
        const jid = await resolveBotJid(bot, participants, resolveLid);
        const number = getBotNumber(bot, jid);
        const name = String(bot.bot_name || "Sub-Bot").trim();

        text += `┏━${getBotType(bot)}\n`;
        text += `┃ > @${number}\n`;
        text += `┃ ➪ ${fytBold(name)}\n\n`;
        if (jid) {
          mentions.push(jid);
        }
      }
    }

    text += `\n┣━━━━━━━━━━━━⬣\n`;
    text += `┃ 💡 Usa ${usedPrefix || "."}bots para consultar nuevamente\n`;
    text += `╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`;

    return reply({ text, mentions });
  },
};
