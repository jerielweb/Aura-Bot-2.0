import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { request } from "undici";

export default {
	name: ["slap", "bofetada"],
	description: "Envía una reacción de bofetada.",
	category: "interaction",

	async run({ args, reply, react, msg, from, sender, text, db }: any) {
		await react("💥");

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

			const baseUrl = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
			const apiUrl = `${baseUrl}/sfw/interaction?inter=slap&key=${DL_CONFIG.alya.API_KEY}`;

			const response = await request(apiUrl, {
				signal: AbortSignal.timeout(10000),
				headers: { "User-Agent": "AuraReedBot/2.0", Accept: "application/json" },
			});

			const bodyText = await response.body.text();
			if (response.statusCode !== 200) throw new Error(`HTTP ${response.statusCode}`);

			let data: any;
			try { data = JSON.parse(bodyText); }
			catch { throw new Error("Respuesta no es JSON"); }

			if (!data?.status || !data?.result) throw new Error("API no devolvió resultado válido");

			let caption = "";
			let mentions = [sender];

			if (targetJid) {
				const targetUser = db.getUser(targetJid);
				const targetName = targetUser?.pushName || targetUser?.username || targetJid.split("@")[0];
				caption = `\`${senderName}\` ${fytBold("abofeteó a")} \`${targetName}\` 💥`;
				mentions = [sender, targetJid];
			} else {
				caption = `\`${senderName}\` ${fytBold("quiere dar una bofetada")} 💥`;
			}

			await react("✅");
			await reply({
				video: { url: data.result },
				caption,
				mentions,
				gifPlayback: true,
				mimetype: "video/mp4",
			});
		} catch (error: any) {
			await react("❌");
			await reply({ text: `❌ Error: ${error?.message}` });
		}
	},
};