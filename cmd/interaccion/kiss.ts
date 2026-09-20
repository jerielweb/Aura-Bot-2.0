import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { request } from "undici";

export default {
	name: ["kiss", "besar"],
	description: "Envía una reacción de beso con mención.",
	category: "interaction",

	async run({ args, reply, react, msg, from, sender, text }: any) {
		await react("💋");

		try {
			// Detectar menciones del mensaje
			let targetJid = sender; // Por defecto se menciona a sí mismo
			
			// 1. Intentar obtener menciones del contexto de WhatsApp
			const mentionedJid = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
			if (mentionedJid && mentionedJid.length > 0) {
				targetJid = mentionedJid[0];
			}
			// 2. O si hay quoted (mensaje citado)
			else if (msg?.message?.extendedTextMessage?.contextInfo?.participant) {
				targetJid = msg.message.extendedTextMessage.contextInfo.participant;
			}
			// 3. O parsear @numero del texto
			else if (text) {
				const mentionMatch = text.match(/@(\d+)/);
				if (mentionMatch) {
					targetJid = `${mentionMatch[1]}@s.whatsapp.net`;
				}
			}

			// Obtener nombres (pushName)
			const senderName = msg.pushName || sender.split("@")[0];
			const targetName = targetJid === sender ? senderName : (targetJid.split("@")[0]);

			// Limpiar y construir URL
			const baseUrl = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
			const apiUrl = `${baseUrl}/sfw/interaction?inter=kiss&key=${DL_CONFIG.alya.API_KEY}`;

			const response = await request(apiUrl, {
				signal: AbortSignal.timeout(10000),
				headers: {
					"User-Agent": "AuraReedBot/2.0",
					Accept: "application/json",
				},
			});

			const bodyText = await response.body.text();

			if (response.statusCode !== 200) {
				throw new Error(`HTTP ${response.statusCode}`);
			}

			let data: any;
			try {
				data = JSON.parse(bodyText);
			} catch {
				throw new Error(`Respuesta no es JSON`);
			}

			if (!data?.status || !data?.result) {
				throw new Error("API no devolvió resultado válido");
			}

			// Caption con menciones
			const caption = `╭〔 💋 ${fytBold("KISS")} 〕━⬣\n\n┃ @${senderName} 𝐛𝐞𝐬ó 𝐚 @${targetName} con amor 💕\n╰━━〔 ⚡ ${fytBold("SYSTEM")} 〕━━⬣`;

			await react("✅");
			await reply({
				video: { url: data.result },
				caption,
				mentions: [sender, targetJid], // ← Menciones clickeables
				gifPlayback: true,
				mimetype: "video/mp4",
			});
		} catch (error: any) {
			await react("❌");
			await reply({ text: `❌ Error: ${error?.message}` });
		}
	},
};