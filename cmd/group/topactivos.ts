export default { name: ["topactivos", "activos"], category: "group", description: "Muestra los usuarios más activos.", groupOnly: true, adminOnly: true, async run(ctx: any) {
	const activity = ctx.db.getGroup(ctx.from).activity || {};
	const users = (ctx.groupMeta?.participants || []).map((participant: any) => ({ id: participant.id, count: Number(activity[participant.id] || 0) })).sort((a: any, b: any) => b.count - a.count).slice(0, 10);
	return ctx.reply({ text: `🔥 Usuarios activos:\n${users.map((user: any, index: number) => `${index + 1}. @${user.id.split("@")[0]} › ${user.count}`).join("\n")}`, mentions: users.map((user: any) => user.id) });
} };
