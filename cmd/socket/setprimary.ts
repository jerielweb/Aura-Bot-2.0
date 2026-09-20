import { fytBold } from "../../core/socketText.ts";

function normalize(value: unknown): string {
	return String(value || "").trim().replace(/:.*(?=@)/, "");
}

function getTargetFromMessage(message: any): string | null {
	const contextInfos = Object.values(message?.message ?? {})
		.map((value: any) => value?.contextInfo)
		.filter(Boolean) as any[];
	const mentioned = contextInfos.flatMap((context) => context.mentionedJid ?? []);
	const quotedParticipant = contextInfos.find((context) => context.quotedMessage)?.participant;

	return mentioned[0] || quotedParticipant || null;
}

export default {
	name: ["setprimary", "delprimary"],
	description: "Define qué bot responde en este grupo.",
	category: "socket",
	groupOnly: true,
	adminOnly: true,

	async run({ args, cmdName, db, from, msg, reply, sock, botJid }: any) {
		const requestedBot = normalize(getTargetFromMessage(msg) || args[0] || "");

		if (cmdName === "delprimary") {
			if (requestedBot) {
				const targetBot = db.getBotById?.(requestedBot);
				if (!targetBot) return reply({ text: "No encontré el bot mencionado o citado en la base de datos." });
				const currentPrimary = normalize(db.getPrimary(from));
				if (currentPrimary && normalize(targetBot.bot_id) !== currentPrimary) {
					return reply({ text: "Ese bot no es el primario actual de este grupo." });
				}
			}

			db.setPrimary(from, "");
			return reply({ text: `✅ ${fytBold("Bot primario eliminado")}. Todos los bots podrán responder.` });
		}

		const currentBot = normalize(sock.subBotId || db.getBot(botJid)?.bot_id || botJid);
		const targetBot = requestedBot ? db.getBotById?.(requestedBot)?.bot_id : currentBot;
		if (!targetBot) {
			return reply({ text: "No encontré ese bot. Usa su bot_id completo, por ejemplo: 123456@lid" });
		}

		db.setPrimary(from, targetBot);
		return reply({ text: `✅ ${fytBold("Bot primario configurado")}: ${targetBot}` });
	},
};