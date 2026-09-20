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
			const apiUrl = `${DL_CONFIG.alya.BASE_URL}/sfw/interaction?inter=kiss&key=${DL_CONFIG.alya.API_KEY}`;
			const response = await request(apiUrl, { signal: AbortSignal.timeout(10000) });
			const data = await response.body.json();

			if (!data?.status || !data?.result) {
				throw new Error("Respuesta inválida");
			}

			await react("✅");
			await reply({
				video: { url: data.result },
				caption: `╭〔 💋 ${fytBold("KISS")} 〕━⬣\n\n┃ > Beso enviado con amor\n╰━━〔 ⚡ ${fytBold("SYSTEM")} 〕━━⬣`,
				gifPlayback: true,
				mimetype: "video/mp4",
			});
		} catch (error: any) {
			await react("❌");
			await reply({ text: `❌ Error: ${error?.message || "No se pudo obtener el beso."}` });
		}
	},
};