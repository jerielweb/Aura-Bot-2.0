import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fytBold } from "../../core/socketText.ts";

const execFileAsync = promisify(execFile);

export default {
	name: ["update", "actualizar", "fix"],
	category: "system",
	description: "Actualiza el bot desde los cambios disponibles en Git.",
	ownerOnly: true,

	async run({ sock, from, msg }: any) {
		let initText = `╭〔 🚀 ${fytBold("AURA REED")} 〕⬣\n`;
		initText += `┃ ⚙️ ${fytBold("SISTEMA UPDATE")}\n`;
		initText += `╰━━━━━━━━━━━━⬣\n\n`;
		initText += "┃ > Buscando cambios en el repositorio...\n\n";
		initText += "╰〔 ⚡ SYSTEM 〕⬣";

		const sent = await sock.sendMessage(from, { text: initText }, { quoted: msg });

		try {
			const { stdout, stderr } = await execFileAsync("git", ["pull", "--ff-only"], {
				cwd: process.cwd(),
				maxBuffer: 1024 * 1024,
			});
			const output = `${stdout}\n${stderr}`.trim();
			const alreadyUpdated = /Already up[- ]to[- ]date|Already up to date/i.test(output);

			let text = `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n`;
			text += `┃ ${alreadyUpdated ? "✨" : "🚀"} ${fytBold(alreadyUpdated ? "SISTEMA ACTUALIZADO" : "UPDATE COMPLETO")}\n`;
			text += "╰━━━━━━━━━━━━⬣\n\n";
			text += alreadyUpdated
				? "┃ > El bot ya tiene los últimos cambios.\n"
				: "┃ > Cambios descargados correctamente.\n┃ > Reinicia el bot para aplicarlos.\n";
			text += `\n┣ 📝 ${fytBold("SALIDA DE GIT")}\n`;
			text += `\`\`\`\n${output || "Sin salida de Git."}\n\`\`\`\n\n`;
			text += "╰〔 ⚡ SYSTEM 〕⬣";
			return await sock.sendMessage(from, { text, edit: sent.key }, { quoted: msg });
		} catch (error: any) {
			const details = [error?.stdout, error?.stderr, error?.message]
				.filter(Boolean)
				.join("\n")
				.trim();
			let text = `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n`;
			text += `┃ ⚠️ ${fytBold("ERROR DE UPDATE")}\n`;
			text += "╰━━━━━━━━━━━━⬣\n\n";
			text += "┃ > Git no pudo actualizar el repositorio.\n";
			text += "┃ > Se conservaron los cambios locales.\n\n";
			text += `\`\`\`\n${details || "Error desconocido."}\n\`\`\`\n\n`;
			text += "╰〔 ⚡ SYSTEM 〕⬣";

			try {
				return await sock.sendMessage(from, { text, edit: sent.key }, { quoted: msg });
			} catch {
				return sock.sendMessage(from, { text }, { quoted: msg });
			}
		}
	},
};
