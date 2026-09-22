import { fytBold } from "../../core/socketText.ts";

export default {
	name: ["nsfw"],
	description: "Activa o desactiva el modo NSFW del grupo.",
	category: "system",
	adminOnly: true,
	groupOnly: true,

	async run({ args, reply, react, from, db }: any) {
		const action = args[0]?.toLowerCase();

		if (action === "on") {
			db.setGroup(from, { nsfwMode: true });
			await react("🔞");
			return reply({ text: `🔞 ${fytBold("NSFW ACTIVADO")} en este grupo.\n┃ > Los comandos +18 ahora funcionarán aquí.` });
		}

		if (action === "off") {
			db.setGroup(from, { nsfwMode: false });
			await react("🔒");
			return reply({ text: `🔒 ${fytBold("NSFW DESACTIVADO")} en este grupo.` });
		}

		const current = db.getGroup(from)?.nsfwMode ? "ACTIVADO 🔞" : "DESACTIVADO 🔒";
		return reply({ text: `╭〔  ${fytBold("MODO NSFW")} 〕⬣\n > Uso: .nsfw on | .nsfw off\n┃ > Estado actual: ${current}\n╰━━━━━━━━━━━━` });
	},
};