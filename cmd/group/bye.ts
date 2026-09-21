import { fytBold } from "../../core/socketText.ts";

const ON = ["on", "1", "true", "activar", "enable"];
const OFF = ["off", "0", "false", "desactivar", "disable"];

export default {
  name: ["bye", "saybye", "despedida"],
  category: "group",
  description: "Activa o desactiva las despedidas automáticas.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] || "").toLowerCase();
    const group = ctx.db.getGroup(ctx.from);
    if (!ON.includes(value) && !OFF.includes(value)) return ctx.reply({ text: `╭〔 👋 ${fytBold("AURA REED")} 〕⬣\n┃ ⚙️ ${fytBold("SISTEMA DE DESPEDIDA")}\n╰━━━━━━━━━━━━⬣\n\n┃ ℹ️ Estado actual: ${group.goodbye ? "✅ Activado" : "❌ Desactivado"}\n\n┣━━━━━━━━━━━━⬣\n\n┃ ➪ ${ctx.usedPrefix || "."}bye on\n┃ ✦ Activar despedida\n\n┃ ➪ ${ctx.usedPrefix || "."}bye off\n┃ ✦ Desactivar despedida\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    const enabled = ON.includes(value);
    ctx.db.setGroup(ctx.from, { goodbye: enabled ? 1 : 0 });
    return ctx.reply({ text: `╭〔 ${enabled ? "✅" : "❌"} ${fytBold("AURA REED")} 〕⬣\n┃ 👋 ${fytBold("SISTEMA DE DESPEDIDA")}\n╰━━━━━━━━━━━━⬣\n\n┃ > La despedida ha sido\n┃ > ${enabled ? "activada" : "desactivada"} con éxito.\n\n╰〔 ⚡ ${fytBold(enabled ? "SYSTEM INFO" : "SYSTEM ACTIVE")} 〕⬣` });
  },
};
