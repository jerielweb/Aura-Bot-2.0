import { inspect } from "node:util";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as {
	new (...args: string[]): (...values: any[]) => Promise<any>;
};

function formatResult(value: unknown): string {
	if (typeof value === "string") return value;
	return inspect(value, { depth: 6, maxArrayLength: 100, maxStringLength: 4000, colors: false });
}

function getMessageContext(message: any) {
	const contextInfo = Object.values(message?.message ?? {})
		.map((value: any) => value?.contextInfo)
		.find(Boolean) as any;
	const quotedMessage = contextInfo?.quotedMessage ?? null;

	return {
		...message,
		text: message?.body ?? "",
		quoted: quotedMessage
			? {
				message: quotedMessage,
				participant: contextInfo.participant ?? null,
				stanzaId: contextInfo.stanzaId ?? null,
				mentionedJid: contextInfo.mentionedJid ?? [],
			}
			: null,
	};
}

export default {
	name: ["eval", "ev", ">"],
	description: "Evalúa código con todo el contexto del handler.",
	category: "system",
	ownerOnly: true,
	async run(ctx: any) {
		const code = String(ctx.text || ctx.args?.join(" ") || "").trim();
		if (!code) return ctx.reply("⚠️ Escribe una expresión o bloque de código para evaluar.");
		const m = getMessageContext({ ...ctx.msg, body: ctx.body });

		const context = {
			...ctx,
			ctx,
			handler: ctx,
			m,
			metadata: {
				msg: ctx.msg,
				m,
				groupMeta: ctx.groupMeta,
				groupName: ctx.groupName,
				sender: ctx.sender,
				from: ctx.from,
				botJid: ctx.botJid,
				botLabel: ctx.botLabel,
				isGroup: ctx.isGroup,
				isAdmin: ctx.isAdmin,
				isBotAdmin: ctx.isBotAdmin,
				isOwner: ctx.isOwner,
				isMod: ctx.isMod,
				isPremium: ctx.isPremium,
        isSelf: ctx.isSelf,
			},
		};
		const names = Object.keys(context);
		const values = names.map((name) => context[name]);

		try {
			let result: unknown;
			try {
				const expression = new AsyncFunction(...names, `"use strict"; return await (${code});`);
				result = await expression(...values);
			} catch (expressionError) {
				const statements = new AsyncFunction(...names, `"use strict"; ${code}`);
				result = await statements(...values);
				if (result === undefined) result = expressionError;
			}

			const output = formatResult(result);
			return ctx.reply(`✅ Resultado:\n${output.slice(0, 6000)}`);
		} catch (error: any) {
			return ctx.reply(`❌ ${String(error?.stack || error?.message || error).slice(0, 6000)}`);
		}
	},
};
