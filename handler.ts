import chalk from "chalk";
import { LRUCache } from "lru-cache";
import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { cmdLog, textLog } from "./core/logger.ts";
import { NOT_CMD_FOUND, ERROR_CMD, NOT_BOT_ADMIN, NOT_BOT_USER, NOT_PRIVATE, NOT_OWNER, NOT_GROUP, NOT_ADMIN, NOT_MOD, NOT_PREMIUM } from "./core/socketText.ts";
import {db} from "./dbController/db.ts";

export type ContactMetadata = {
  user?: string | null;
  jid?: string | null;
  lid?: string | null;
  phoneNumber?: string | null;
};

export type HandlerConfig = {
  prefix?: string | string[];
  ownerNumber?: string[];
  coOwners?: string[];
};

export type HandlerLogger = {
  message?: (...args: any[]) => void;
  warn?: (...args: any[]) => void;
  error?: (...args: any[]) => void;
  cmdExec?: (...args: any[]) => void;
};

export type HandlerOptions = {
  config?: HandlerConfig;
  db?: any;
  logger?: HandlerLogger;
  plugins?: Map<string, any>;
  getPlugins?: () => Map<string, any>;
  checkAntilink?: (args: any) => Promise<boolean>;
  handleChatXp?: (sender: string) => void;
  handleCommandXp?: (sender: string) => void;
};

const GROUP_METADATA_CACHE = new LRUCache<string, any>({
  max: 500,
  ttl: 10 * 60 * 1000,
});

const CONTACT_METADATA_CACHE = new LRUCache<string, ContactMetadata>({
  max: 2000,
  ttl: 5 * 60 * 1000,
});

const groupCache = new Map<string, any>();
const configuredLidCache = new Map<string, string | null>();

function stripDeviceSuffixFromJid(jid?: string | null): string | null {
  if (!jid || typeof jid !== "string") return null;

  const trimmed = jid.trim();
  if (!trimmed) return null;

  const [localPart] = trimmed.split("@");
  if (!localPart) return null;

  const cleanLocalPart = localPart.split(":")[0];
  if (!cleanLocalPart) return null;

  return cleanLocalPart;
}

function cleanJid(jid = "") {
  if (!jid) return "";

  const raw = String(jid).trim();
  const atIndex = raw.lastIndexOf("@");

  if (atIndex === -1) {
    return raw.split(":")[0];
  }

  const userPart = raw.slice(0, atIndex).split(":")[0];
  const domainPart = raw.slice(atIndex + 1);
  return `${userPart}@${domainPart}`;
}

function getPhoneNumberFromJid(jid?: string | null): string | null {
  const localPart = stripDeviceSuffixFromJid(jid);
  if (!localPart || !/^\d+$/.test(localPart)) return null;

  return `+${localPart}`;
}

function normalizeContactMetadata(input?: Partial<ContactMetadata> | any | null): ContactMetadata {
  const jid = input?.jid ?? input?.id ?? null;
  const lid = input?.lid ?? null;
  const user = input?.user ?? input?.username ?? input?.notify ?? null;

  const resolvedJid = jid ? jidNormalizedUser(jid) : null;
  const resolvedLid = lid ? jidNormalizedUser(lid) : null;

  const candidatePhoneNumber = input?.phoneNumber ?? getPhoneNumberFromJid(resolvedJid ?? null);

  return {
    user,
    jid: resolvedJid,
    lid: resolvedLid,
    phoneNumber:
      candidatePhoneNumber && candidatePhoneNumber !== "+undefined" ? candidatePhoneNumber : null,
  };
}

export function buildUserMetadataMap(users: Array<Partial<ContactMetadata> | any> = []): Map<string, ContactMetadata> {
  const map = new Map<string, ContactMetadata>();

  for (const user of users) {
    const meta = normalizeContactMetadata(user);

    if (meta.jid) map.set(meta.jid, meta);
    if (meta.lid) map.set(meta.lid, meta);
  }

  return map;
}

export function resolveUserMetadata(input?: Partial<ContactMetadata> | any | null): ContactMetadata | null {
  if (!input) return null;

  const key = input.jid ?? input.lid ?? input.id ?? null;
  if (!key) return normalizeContactMetadata(input);

  const cached = CONTACT_METADATA_CACHE.get(key);
  if (cached) return cached;

  const resolved = normalizeContactMetadata(input);
  CONTACT_METADATA_CACHE.set(key, resolved);
  return resolved;
}

export async function getGroupMetadata(jid: string, sock: any) {
  const normalizedJid = jidNormalizedUser(jid);
  if (GROUP_METADATA_CACHE.has(normalizedJid)) {
    return GROUP_METADATA_CACHE.get(normalizedJid);
  }

  try {
    const metadata = await sock.groupMetadata(normalizedJid);
    GROUP_METADATA_CACHE.set(normalizedJid, metadata);
    return metadata;
  } catch (error) {
    console.error(
      chalk.red(`Error al obtener metadata del grupo ${normalizedJid}: ${String(error)}`),
    );
    return null;
  }
}

export function invalidateGroupCache(groupJid: string) {
  groupCache.delete(groupJid);
}

async function resolveLid(lidJid: string | null | undefined, groupMeta: any, sock: any) {
  if (!lidJid || !lidJid.endsWith("@lid")) return lidJid;

  const match = groupMeta?.participants?.find((p: any) => cleanJid(p.id || "") === lidJid);
  if (match?.phoneNumber) {
    return cleanJid(match.phoneNumber);
  }

  try {
    const resolved = await sock.signalRepository?.lidMapping?.getPNForLID(lidJid);
    if (resolved) return cleanJid(resolved);
  } catch {
    // Ignoramos errores de resolución de LID y devolvemos el valor original.
  }

  return lidJid;
}

async function matchesConfiguredNumber(
  numberList: Array<string | number | null | undefined>,
  senderNum: string,
  rawLid: string,
  sock: any,
) {
  if (!Array.isArray(numberList)) return false;

  if (numberList.some((num) => cleanJid(String(num ?? "")) === senderNum || String(num ?? "") === senderNum)) {
    return true;
  }

  if (rawLid && rawLid.endsWith("@lid")) {
    for (const num of numberList) {
      const normalizedNum = String(num ?? "").trim();
      if (!normalizedNum) continue;

      let lid = configuredLidCache.get(normalizedNum);
      if (lid === undefined) {
        try {
          const resolved = await sock.signalRepository?.lidMapping?.getLIDForPN(`${normalizedNum}@s.whatsapp.net`);
          lid = resolved ? cleanJid(resolved) : null;
        } catch {
          lid = null;
        }
        configuredLidCache.set(normalizedNum, lid);
      }

      if (lid && lid === rawLid) return true;
    }
  }

  return false;
}

export async function handleMessage(
  sock: any,
  rawMsg: any,
  botLabel = "MAIN",
  mainBotNum: string | null = null,
  activeBotsLive: any[] = [],
  runtimeOptions: HandlerOptions = {},
) {
  try {
    const config = {
      prefix: globalThis.DEFAULT_PREFIXES ?? ["."],
      ownerNumber: [],
      coOwners: [],
      ...runtimeOptions.config,
    };

    const logger = {
      message: () => {},
      warn: () => {},
      error: () => {},
      cmdExec: () => {},
      ...runtimeOptions.logger,
    };

    const runtimeDb = runtimeOptions.db ?? db;

    const plugins = runtimeOptions.plugins ?? runtimeOptions.getPlugins?.() ?? new Map();
    const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix];

    const msg = rawMsg;
    const from = msg.key?.remoteJid;
    if (!from) return;
    if (from === "status@broadcast") return;

    const isGroup = from.endsWith("@g.us");
    const participantRaw = isGroup ? msg.key?.participant || msg.participant || "" : "";
    const participantReal = isGroup ? msg.key?.participantAlt || "" : "";

    let senderJid;
    if (isGroup) {
      senderJid =
        participantRaw.endsWith("@lid") && participantReal && !participantReal.endsWith("@lid")
          ? participantReal
          : participantRaw;
    } else {
      const remoteAlt = msg.key?.remoteJidAlt || "";
      senderJid =
        from.endsWith("@lid") && remoteAlt && !remoteAlt.endsWith("@lid")
          ? remoteAlt
          : from;
    }

    const senderLidJid = senderJid.endsWith("@lid")
      ? senderJid
      : isGroup
        ? participantRaw
        : from.endsWith("@lid")
          ? from
          : "";

    let sender = cleanJid(senderJid);
    const senderLid = cleanJid(senderLidJid);
    const botJid = cleanJid(sock.user?.id || "");

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.message?.templateButtonReplyMessage?.selectedId ||
      "";

    const msgType = msg.message ? Object.keys(msg.message)[0] ?? "unknown" : "unknown";

    const msgTypeLabel =
      msgType === "conversation"
      ? "Texto"
      : msgType === "extendedTextMessage"
      ? "Texto"
      : msgType === "imageMessage"
      ? "🖼️ Imagen"
      : msgType === "videoMessage"
      ? "🎥 Video"
      : msgType === "audioMessage"
      ? "🎵 Audio"
      : msgType === "stickerMessage"
      ? "🎴 Sticker"
      : msgType === "documentMessage"
      ? "📄 Documento"
      : msgType === "ptvMessage"
      ? "📹 Nota de video"
      : msgType === "reactionMessage"
      ? "🔥 Reacción"
      : msgType === "contactMessage"
      ? "👤 Contacto"
      : msgType === "locationMessage"
      ? "📍 Ubicación"
      : msgType === "liveLocationMessage"
      ? "📍 Ubicación en vivo"
      : msgType === "pollCreationMessage"
      ? "📊 Encuesta"
      : msgType === "pollUpdateMessage"
      ? "📊 Actualización de encuesta"
      : msgType === "groupInviteMessage"
      ? "👥 Invitación a grupo"
      : msgType === "statusMentionMessage"
      ? "Mension De Estado"
      : "Otro";

    const usedPrefix = prefixes.find((p: string) => body.startsWith(p)) ?? null;
    const isCmd = !!usedPrefix;

    if (msg.key?.fromMe && !isCmd) return;

    const afterPrefix = isCmd ? body.slice(usedPrefix.length).trimStart() : "";
    const cmdName = isCmd ? afterPrefix.split(/\s+/)[0].toLowerCase() : "";
    const args = isCmd ? afterPrefix.slice(cmdName.length).trim().split(/\s+/).filter(Boolean) : [];
    const text = args.join(" ");

    let groupName = "";
    let groupMeta: any = null;

    if (isGroup) {
      if (groupCache.has(from)) {
        groupMeta = groupCache.get(from);
        groupName = groupMeta?.subject || from;
      } else {
        try {
          groupMeta = await sock.groupMetadata(from);
          groupName = groupMeta?.subject || from;
          groupCache.set(from, groupMeta);
          setTimeout(() => groupCache.delete(from), 10 * 60 * 1000);
        } catch {
          groupName = from;
        }
      }

      const storedGroup = runtimeDb.getGroup(from);
      if (groupName && storedGroup.group_name !== groupName) {
        runtimeDb.setGroup(from, { group_name: groupName });
      }

      const primaryBot = runtimeDb.getPrimary(from);
      if (primaryBot && cmdName !== "delprimary" && cmdName !== "setprimary") {
        const myId = cleanJid(botJid).split("@")[0];
        if (primaryBot !== myId) return;
      }
    }

    const rawSenderLid = sender.endsWith("@lid") ? sender : senderLid || "";

    if (sender.endsWith("@lid")) {
      sender = await resolveLid(sender, groupMeta, sock);
    }

    const senderNum = sender.split("@")[0];

    if (msg.pushName) {
      const currentUser = runtimeDb.getUser?.(sender) ?? {};
      const hasResolvedPhone = !sender.endsWith("@lid");
      const nextContact = {
        jid: hasResolvedPhone ? sender : null,
        lid: senderLid || rawSenderLid || sender,
        username: msg.pushName,
        pushName: msg.pushName,
        phone_number: hasResolvedPhone ? senderNum : null,
      };
      const contactChanged =
        currentUser.username !== nextContact.username ||
        currentUser.pushName !== nextContact.pushName ||
        currentUser.phone_number !== nextContact.phone_number ||
        currentUser.lid !== nextContact.lid;

      if (contactChanged) runtimeDb.setUser?.(sender, nextContact);
    }
    const botUserNum = cleanJid(sock.user?.id || "").split("@")[0];

    const isBotUser =
      (!!mainBotNum && senderNum === cleanJid(mainBotNum).split("@")[0]) ||
      senderNum === botUserNum ||
      sender === botJid;

    const configuredOwner = await matchesConfiguredNumber(
      config.ownerNumber ?? [],
      senderNum,
      rawSenderLid,
      sock,
    );
    const configuredCoOwner = await matchesConfiguredNumber(
      config.coOwners ?? [],
      senderNum,
      rawSenderLid,
      sock,
    );
    const isOwner = configuredOwner || runtimeDb.hasRole(sender, "owner");
    const isCoOwner = configuredCoOwner || runtimeDb.hasRole(sender, "coowner");
    const isMod = isOwner || isCoOwner || runtimeDb.hasRole(sender, "mod");
    const isPremium = isMod || runtimeDb.hasRole(senderNum, "premium");


    let isAdmin = false;
    let isBotAdmin = false;

    if (isGroup && groupMeta?.participants) {
      const botJidClean = cleanJid(botJid);
      let botLidClean = "";
      try {
        const resolvedBotLid = await sock.signalRepository?.lidMapping?.getLIDForPN(botJidClean);
        if (resolvedBotLid) botLidClean = cleanJid(resolvedBotLid);
      } catch {
        // Sin LID resoluble, se mantiene sin botLidClean.
      }

      const senderJidClean = cleanJid(sender);

      const matchesParticipant = (p: any, targetJid: string, targetLid: string) => {
        const pId = cleanJid(p.id);
        const pLid = cleanJid(p.lid || "");
        return (
          pId === targetJid ||
          (targetLid && pId === targetLid) ||
          (targetLid && pLid === targetLid) ||
          pLid === targetJid
        );
      };

      const botParticipant = groupMeta.participants.find((p: any) =>
        matchesParticipant(p, botJidClean, botLidClean),
      );
      const senderParticipant = groupMeta.participants.find((p: any) =>
        matchesParticipant(p, senderJidClean, senderLid),
      );

      isAdmin = senderParticipant?.admin === "admin" || senderParticipant?.admin === "superadmin";
      isBotAdmin = botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin";
    }

    if (isGroup) {
      const groupData = runtimeDb.getGroup(from);

      if (groupData?.privateMode && !isOwner && !isCoOwner) {
        return;
      }

      if (groupData?.adminMode && !isAdmin && !isMod) {
        return;
      }

      if (groupData?.antilink && body && !isAdmin && !isMod && !isCmd) {
        const checkFn = runtimeOptions.checkAntilink;
        if (checkFn) {
          const handled = await checkFn({ sock, msg, from, sender, body, isBotAdmin, botLabel });
          if (handled) return;
        }
      }

      if (!isCmd && body) {
        runtimeOptions.handleChatXp?.(sender);
      }
    }

    const logPayload = { from, sender, isGroup, groupName, body, isCmd, cmdName, botLabel, msgTypeLabel };

    if (isCmd) {
      cmdLog({
        numeroReal: senderNum,
        rango: isOwner ? "OWNER" : isCoOwner ? "CO-OWNER" : isMod ? "MOD" : isAdmin ? "ADMIN" : "USUARIO",
        commandName: cmdName,
        isGroup,
        text: body,
        jidRemitente: sender,
        pushName: msg.pushName,
        groupMetadata: groupMeta ? { subject: groupName || undefined } : null,
        sock: { isSubBot: Boolean(sock?.isSubBot), subBotId: sock?.subBotId },
      });
    } else if (body && !msg.key?.fromMe) {
      textLog(`[${botLabel}] ${msgTypeLabel}: ${body}`);
    }

    logger.message?.(logPayload);

    if (!isCmd) return;

    const resolvePlugins = runtimeOptions.getPlugins ?? (() => plugins);
    const pluginMap = resolvePlugins();
    const plugin = pluginMap.get(cmdName);

    if (!plugin) { return await sock.sendMessage(from, { text: `${NOT_CMD_FOUND({ cmdName, prefix: usedPrefix ?? "." })}`}, { quoted: msg }); }

    const ctx = {
      sock,
      msg,
      from,
      sender,
      senderNum,
      botJid,
      botLabel,
      mainBotNum,
      activeBotsLive,
      isGroup,
      groupName,
      groupMeta,
      body,
      isCmd,
      cmdName,
      args,
      text,
      usedPrefix,
      isOwner,
      isCoOwner,
      isMod,
      isPremium,
      isAdmin,
      isBotAdmin,
      isBotUser,
      resolveLid: (lidJid: string) => resolveLid(lidJid, groupMeta, sock),
      clearGroupCache: () => groupCache.delete(from),
      reply: async (content: any) => {
        if (typeof content === "string") content = { text: content };
        if (content.text !== undefined) {
          const extra = content.mentions || [];
          content.mentions = [...new Set([sender, ...extra])];
        }
        try {
          return await sock.sendMessage(from, content, { quoted: msg });
        } catch (e1: any) {
          logger.warn?.(`[${botLabel}] reply con quoted falló (${e1.message}), reintentando sin quoted...`);
          try {
            return await sock.sendMessage(from, content);
          } catch (e2: any) {
            logger.error?.(`[${botLabel}] reply sin quoted también falló: ${e2.message} | from: ${from}`);
          }
        }
      },
      react: async (emoji: string) => {
        try {
          return await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
        } catch (e: any) {
          logger.warn?.(`[${botLabel}] react falló: ${e.message} | from: ${from}`);
        }
      },
    };

    if (plugin.ownerOnly && !isOwner) return ctx.reply({ text: NOT_OWNER() });
    if (plugin.modOnly && !isMod) return ctx.reply({ text: NOT_MOD() });
    if (plugin.botAdmin && isGroup && !isBotAdmin) return ctx.reply({ text: NOT_BOT_ADMIN() });
    if (plugin.adminOnly && isGroup && !isAdmin && !isMod) return ctx.reply({ text: NOT_ADMIN() });
    if (plugin.premiumOnly && !isPremium) return ctx.reply({ text: NOT_PREMIUM() });
    if (plugin.groupOnly && !isGroup) return ctx.reply({ text: NOT_GROUP() });
    if (plugin.privateOnly && isGroup) return ctx.reply({ text: NOT_PRIVATE() });
    if (plugin.botUserOnly && !isBotUser) return ctx.reply({ text: NOT_BOT_USER() });

    const start = Date.now();
    try {
      await plugin.run(ctx);
      logger.cmdExec?.({ cmdName, sender: senderNum, success: true, ms: Date.now() - start, botLabel });
      if (isGroup) runtimeOptions.handleCommandXp?.(sender);
    } catch (e: any) {
      logger.cmdExec?.({ cmdName, sender: senderNum, success: false, ms: Date.now() - start, botLabel });
      logger.error?.(`Comando ${cmdName}: ${e.message}`);
      await ctx.react("❌");

      if (e.message?.toLowerCase().includes("forbidden")) {
        await ctx.reply({ text: NOT_BOT_ADMIN() });
      } else {
        const errorDetails = e.stack || e.message || String(e);
        await ctx.reply({ text: ERROR_CMD({ cmdName, errorDetails })});
      }
    }
  } catch (e: any) {
    loggerError(runtimeOptions.logger, `handleMessage: ${e.message}`);
  }
}

function loggerError(log: HandlerLogger | undefined, message: string) {
  log?.error?.(message);
  if (!log?.error) {
    console.error(message);
  }
}