import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { request } from "undici";

export default {
	name: ["kiss", "besar"],
	description: "Envía una reacción de beso.",
	category: "interaction",

	async run({ reply, react }: any) {
		await react("💋");

		try {
			// Limpiar barra al final de la URL
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
				throw new Error(`Respuesta no es JSON: ${bodyText.slice(0, 100)}`);
			}

			if (!data?.status || !data?.result) {
				throw new Error("API no devolvió resultado válido");
			}

			await react("✅");
			await reply({
				video: { url: data.result },
				caption: `╭〔 💋 ${fytBold("KISS")} 〕━⬣\n\n┃ > Beso enviado\n╰━━〔 ⚡ ${fytBold("SYSTEM")} 〕━━⬣`,
				gifPlayback: true,
				mimetype: "video/mp4",
			});
		} catch (error: any) {
			await react("❌");
			await reply({ text: `❌ Error: ${error?.message}` });
		}
	},
};