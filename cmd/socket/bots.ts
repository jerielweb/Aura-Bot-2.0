import { fytBold } from "../../core/socketText.ts";

function normalizeNumber(value: unknown): string {
	return String(value || "")
		.split("@")[0]
		.split(":")[0]
		.replace(/\D/g, "");
}

function normalizeGroup(value: unknown): string {
	return String(value || "").trim().replace(/:.+@/, "@");
}

function getBotNumber(bot: any): string {
	return normalizeNumber(bot.bot_id || bot.jid || bot.phone_number);
}

function getBotStatus(bot: any): string {
	return String(bot.status || "offline").toLowerCase() === "active"
		? "🟢 ONLINE"
		: "🔴 OFFLINE";
}

export default {
	name: ["bots", "btos", "subbots", "lista-bots"],
	category: "socket",
	description: "Muestra los bots registrados y su estado de conexión.",
	ownerOnly: false,

	async run({ from, db, usedPrefix, reply }: any) {
		const bots = (db.getAllBots?.() || []).filter((bot: any) =>
			getBotNumber(bot),
		);
		const isGroup = String(from || "").endsWith("@g.us");
		const currentGroup = normalizeGroup(from);
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
		text += `┃ 🤖 ${fytBold(isGroup ? "BOTS EN EL GRUPO" : "SUB-BOTS REGISTRADOS")}\n`;
		text += `┣━━━━━━━━━━━━⬣\n`;
		text += `┃ 📊 ${fytBold("Registrados")}: *${bots.length}*\n`;
		if (isGroup) {
			text += `┃ ⚡ ${fytBold("En este grupo")}: *${visibleBots.length}*\n`;
		}
		text += `\n`;

		if (!visibleBots.length) {
			text += isGroup
				? `┃ > No hay bots registrados en este grupo.\n`
				: `┃ > No hay bots registrados.\n`;
		} else {
			visibleBots.forEach((bot: any, index: number) => {
				const number = getBotNumber(bot);
				const name = String(bot.bot_name || "Sub-Bot").trim();
				text += `┃ ${index + 1}. ${fytBold(name)}\n`;
				text += `┃    @${number} ${getBotStatus(bot)}\n`;
				mentions.push(`${number}@s.whatsapp.net`);
			});
		}

		text += `\n┣━━━━━━━━━━━━⬣\n`;
		text += `┃ 💡 Usa ${usedPrefix || "."}bots para consultar nuevamente\n`;
		text += `╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`;

		return reply({ text, mentions });
	},
};
