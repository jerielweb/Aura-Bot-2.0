export default {
  name: ["self", "setself"],
  description: "Activa o desactiva el modo self del grupo.",
  category: "socket",
  groupOnly: true,
  modOnly: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] ?? "").toLowerCase();
    if (!["on", "off", "true", "false", "1", "0"].includes(value)) {
      return ctx.reply(`⚠️ Uso: ${ctx.usedPrefix ?? "."}self on|off`);
    }

    const enabled = ["on", "true", "1"].includes(value);
    ctx.db.setGroup(ctx.from, {
      self: enabled ? 1 : 0,
      selfConfigured: true,
    });
    return ctx.reply(`✅ Modo self ${enabled ? "activado" : "desactivado"}.`);
  },
};
