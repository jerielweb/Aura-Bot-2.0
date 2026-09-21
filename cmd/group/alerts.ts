import { fytBold } from "../../core/socketText.ts";

const ON = ["on", "1", "true", "activar", "enable"];
const OFF = ["off", "0", "false", "desactivar", "disable"];

export default {
  name: ["alerts", "alertas", "adminalerts"],
  category: "group",
  description: "Activa o desactiva las notificaciones de administración.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] || "").toLowerCase();
    const group = ctx.db.getGroup(ctx.from);
    if (!ON.includes(value) && !OFF.includes(value)) {
      return ctx.reply({ text: `╭〔 ⚙️ ${fytBold("AURA REED")} 〕⬣\n┃ 🔔 ${fytBold("SISTEMA DE ALERTAS")}\n╰━━━━━━━━━━━━⬣\n\n┃ ℹ️ Estado actual: ${group.alerts ? "✅ Activado" : "❌ Desactivado"}\n\n┣━━━━━━━━━━━━⬣\n\n┃ ➪ ${ctx.usedPrefix || "."}alerts on\n┃ ✦ Activar alertas globales\n\n┃ ➪ ${ctx.usedPrefix || "."}alerts off\n┃ ✦ Desactivar alertas globales\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    }
    const enabled = ON.includes(value);
    ctx.db.setGroup(ctx.from, { alerts: enabled ? 1 : 0 });
    return ctx.reply({ text: `╭〔 ${enabled ? "✅" : "❌"} ${fytBold("AURA REED")} 〕⬣\n┃ ⚙️ ${fytBold("ALERTAS DE ADMIN")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Las notificaciones de administración\n┃ > han sido ${enabled ? "activadas" : "desactivadas"} con éxito.\n\n╰〔 ⚡ ${fytBold(enabled ? "SYSTEM INFO" : "SYSTEM ACTIVE")} 〕⬣` });
  },
};
