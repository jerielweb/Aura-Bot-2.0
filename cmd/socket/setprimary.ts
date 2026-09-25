import { fytBold } from "../../core/socketText.ts";

function normalize(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/:.*(?=@)/, "");
}

function isPhoneJid(value: unknown): boolean {
  return /^\d+@s\.whatsapp\.net$/.test(normalize(value));
}

async function getBotMention(
  bot: any,
  participants: any[],
  resolveLid?: (jid: string) => Promise<string>,
): Promise<string> {
  const directJid = [bot.jid, bot.data?.jid, bot.phone_number].find(isPhoneJid);
  if (directJid) return normalize(directJid);

  const identities = [bot.bot_id, bot.lid, bot.jid].map(normalize);
  const participant = participants.find((entry: any) =>
    [entry?.id, entry?.lid, entry?.jid, entry?.phoneNumber]
      .map(normalize)
      .some((jid: string) => jid && identities.includes(jid)),
  );
  const participantJid = [
    participant?.phoneNumber,
    participant?.jid,
    participant?.id,
  ].find(isPhoneJid);
  if (participantJid) return normalize(participantJid);

  const lid = [bot.lid, bot.bot_id].find((jid) =>
    String(jid || "").endsWith("@lid"),
  );
  if (lid && resolveLid) {
    const resolved = await resolveLid(normalize(lid));
    if (isPhoneJid(resolved)) return normalize(resolved);
  }

  return "";
}

function getTargetFromMessage(message: any): string | null {
  const contextInfos = Object.values(message?.message ?? {})
    .map((value: any) => value?.contextInfo)
    .filter(Boolean) as any[];
  const mentioned = contextInfos.flatMap(
    (context) => context.mentionedJid ?? [],
  );
  const quotedParticipant = contextInfos.find(
    (context) => context.quotedMessage,
  )?.participant;

  return mentioned[0] || quotedParticipant || null;
}

export default {
  name: ["setprimary", "delprimary"],
  description: "Define qué bot responde en este grupo.",
  category: "socket",
  groupOnly: true,
  adminOnly: true,

  async run({
    args,
    cmdName,
    db,
    from,
    msg,
    reply,
    sock,
    botJid,
    groupMeta,
    resolveLid,
  }: any) {
    const requestedBot = normalize(getTargetFromMessage(msg) || args[0] || "");

    if (cmdName === "delprimary") {
      if (requestedBot) {
        const targetBot = db.getBotById?.(requestedBot);
        if (!targetBot)
          return reply({
            text: "No encontré el bot mencionado o citado en la base de datos.",
          });
        const currentPrimary = normalize(db.getPrimary(from));
        if (currentPrimary && normalize(targetBot.bot_id) !== currentPrimary) {
          return reply({
            text: "Ese bot no es el primario actual de este grupo.",
          });
        }
      }

      db.setPrimary(from, "");
      return reply({
        text: `✅ ${fytBold("Bot primario eliminado")}. Todos los bots podrán responder.`,
      });
    }

    const currentBot = normalize(
      sock.subBotId || db.getBot(botJid)?.bot_id || botJid,
    );
    const selectedBot = requestedBot
      ? db.getBotById?.(requestedBot)
      : db.getBot(botJid);
    if (requestedBot && !selectedBot) {
      return reply({
        text: "No encontré ese bot. Usa su bot_id completo, por ejemplo: 123456@lid",
      });
    }
    if (selectedBot?.status !== "active") {
      return reply({
        text: "Ese bot no está activo actualmente y no puede ser el primario.",
      });
    }
    const targetBot = selectedBot?.bot_id || currentBot;
    if (!targetBot) {
      return reply({
        text: "No encontré ese bot. Usa su bot_id completo, por ejemplo: 123456@lid",
      });
    }

    db.setPrimary(from, targetBot);
    const mentionJid = await getBotMention(
      selectedBot || db.getBotById?.(targetBot),
      groupMeta?.participants || [],
      resolveLid,
    );
    const targetName = String(selectedBot?.bot_name || "Bot seleccionado").trim();
    return reply({
      text: mentionJid
        ? `✅ ${fytBold("Bot primario configurado")}: @${mentionJid.split("@")[0]}`
        : `✅ ${fytBold("Bot primario configurado")}: ${targetName}`,
      mentions: mentionJid ? [mentionJid] : [],
    });
  }
};
