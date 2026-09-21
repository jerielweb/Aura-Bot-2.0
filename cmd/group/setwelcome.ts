import { fytBold } from "../../core/socketText.ts";

export default { name: ["setwelcome", "setbienvenida"], category: "group", description: "Personaliza el mensaje de bienvenida.", groupOnly: true, adminOnly: true, async run(ctx: any) {
	if (!ctx.isAdmin && !ctx.isMod && !ctx.isOwner) return ctx.reply({ text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PERMISO DENEGADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Solo los administradores pueden cambiar la bienvenida.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣` });
	const value = ctx.args.join(" ").trim();
	if (!value || ["reset", "default"].includes(value.toLowerCase())) {
		ctx.db.setGroup(ctx.from, { welcomeMessage: null });
		return ctx.reply({ text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("MENSAJE RESTABLECIDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Se usará la bienvenida por defecto.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
	}
	ctx.db.setGroup(ctx.from, { welcomeMessage: value });
	return ctx.reply({ text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ 👋 ${fytBold("BIENVENIDA PERSONALIZADA")}\n╰━━━━━━━━━━━━⬣\n\n┃ 📌 ${fytBold("Nueva plantilla:")}\n${value}\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
} };
