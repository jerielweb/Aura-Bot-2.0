import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { request } from "undici";

export default {
	name: ["poke", "picar"],
	description: "Envía una reacción de picar (nekos.best).",
	category: "interaction",

	async run({ args, reply, react, msg, from, sender, text, db }: any) {
		await react("👉");

		try {
			let targetJid = null;

			const mentionedJid = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
			if (mentionedJid && mentionedJid.length > 0) {
				targetJid = mentionedJid[0];
			} else if (msg?.message?.extendedTextMessage?.contextInfo?.participant) {
				targetJid = msg.message.extendedTextMessage.contextInfo.participant;
			} else if (text) {
				const mentionMatch = text.match(/@(\d+)/);
				if (mentionMatch) targetJid = `${mentionMatch[1]}@s.whatsapp.net`;
			}

			const senderUser = db.getUser(sender);
			const senderName = senderUser?.pushName || senderUser?.username || msg.pushName || sender.split("@")[0];

			// nekos.best: /api/v2/poke — sin API key
			const apiUrl = `${DL_CONFIG.nekosBest.BASE_URL}/poke`;

			const response = await request(apiUrl, {
				signal: AbortSignal.timeout(10000),
				headers: { "User-Agent": "AuraReedBot/2.0", Accept: "application/json" },
			});

			const bodyText = await response.body.text();
			if (response.statusCode !== 200) throw new Error(`HTTP ${response.statusCode}`);

			let data: any;
			try { data = JSON.parse(bodyText); }
			catch { throw new Error("Respuesta no es JSON"); }

			// nekos.best devuelve: { results: [ { url: "....gif" } ] }
			const gifUrl = data?.results?.[0]?.url;
			if (!gifUrl) throw new Error("nekos.best no devolvió resultado");

			let caption = "";
			let mentions = [sender];

			if (targetJid) {
				const targetUser = db.getUser(targetJid);
				const targetName = targetUser?.pushName || targetUser?.username || targetJid.split("@")[0];
				caption = `\`${senderName}\` ${fytBold("picó a")} \`${targetName}\` 👉`;
				mentions = [sender, targetJid];
			} else {
				caption = `\`${senderName}\` ${fytBold("quiere picar con el dedo")} 👉`;
			}

			await react("✅");

			// ️ GIF directo: SIN gifPlayback ni mimetype (ya es .gif)
			await reply({
				video: { url: gifUrl },
				caption,
				mentions,
			});
		} catch (error: any) {
			await react("❌");
			await reply({ text: `❌ Error: ${error?.message}` });
		}
	},
};