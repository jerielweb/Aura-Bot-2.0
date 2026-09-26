export default {
  name: ["setbotname", "setname", "botname"],
  category: "socket",
  description: "Cambia el nombre del bot en el menú.",
  botUserOnly: true,
  async run(ctx: any) {
    const name = ctx.args.join(" ").trim();
    if (!name || name.length > 60) {
      return ctx.reply(`⚠️ Uso: ${ctx.usedPrefix ?? "."}setbotname <nombre>`);
    }

    ctx.db.setBot(ctx.botJid, { bot_name: name });
    return ctx.reply(`✅ Nombre del bot actualizado a: ${name}`);
  },
};
