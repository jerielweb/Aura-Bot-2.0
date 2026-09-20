import { forgetActiveSubBot } from "../../core/subbotManager.ts";

export default {
	name: ["logout", "cerrar", "cerrarsesion", "desconectar"],
	description: "Cierra la sesión del bot desde su propio número.",
	category: "socket",
	botUserOnly: true,
	privateOnly: true,

	async run({ reply, sock, db }: any) {
		await reply({ text: "⏳ Cerrando la sesión de este bot..." });
		(sock as any).manualLogout = true;
		forgetActiveSubBot(String((sock as any).sessionName || ""));

		try {
			await sock.logout();
		} catch (error: any) {
			(sock as any).manualLogout = false;
			db.setBot(String(sock.user?.id || (sock as any).sessionName || ""), { status: "offline" });
			await reply({ text: `❌ No se pudo cerrar la sesión: ${error?.message || "Error desconocido"}` });
		}
	},
};