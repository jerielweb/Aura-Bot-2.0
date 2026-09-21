import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { request } from "undici";

const execFileAsync = promisify(execFile);

async function convertGifToMp4(gifUrl: string): Promise<Buffer> {
	if (!ffmpegPath) throw new Error("FFmpeg no está disponible en este entorno");

	const cacheDir = process.env.TMPDIR || path.resolve("./cache");
	await mkdir(cacheDir, { recursive: true });
	const id = randomUUID();
	const inputPath = path.join(cacheDir, `${id}.gif`);
	const outputPath = path.join(cacheDir, `${id}.mp4`);

	try {
		const mediaResponse = await request(gifUrl, {
			signal: AbortSignal.timeout(20000),
			headers: { "User-Agent": "AuraReedBot/2.0" },
		});
		if (mediaResponse.statusCode < 200 || mediaResponse.statusCode >= 300) {
			throw new Error(`GIF HTTP ${mediaResponse.statusCode}`);
		}

		await writeFile(inputPath, Buffer.from(await mediaResponse.body.arrayBuffer()));
		await execFileAsync(ffmpegPath, [
			"-y",
			"-i", inputPath,
			"-movflags", "+faststart",
			"-pix_fmt", "yuv420p",
			"-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
			"-an",
			outputPath,
		], { timeout: 30000 });

		return await readFile(outputPath);
	} finally {
		await Promise.all([
			unlink(inputPath).catch(() => undefined),
			unlink(outputPath).catch(() => undefined),
		]);
	}
}

export default {
	name: ["poke", "picar"],
	description: "Envía una reacción de picar (nekos.best).",
	category: "interaction",

	async run({ reply, react, msg, sender, text, db }: any) {
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
			const apiUrl = `${DL_CONFIG.nekosApi.BASE_URL}/poke`;

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

		

			const video = await convertGifToMp4(gifUrl);
			await reply({
				video,
				caption,
				mimetype: "video/mp4",
        gifPlayback: true,
				mentions,
			});
		} catch (error: any) {
			await react("❌");
			await reply({ text: `❌ Error: ${error?.message}` });
		}
	},
};