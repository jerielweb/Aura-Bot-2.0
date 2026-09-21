import { fytBold } from "../../core/socketText.ts";

const ON = ["on", "activar", "enable", "1", "true"];
const OFF = ["off", "desactivar", "disable", "0", "false"];

export default {
  name: ["bot"],
  category: "group",
  description: "Enciende o apaga el bot en el grupo actual.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] || "").toLowerCase();
    const group = ctx.db.getGroup(ctx.from);
    if (!value) {
      const state = group.botOn === 0 ? "Desactivado" : "Activado";
      return ctx.reply({
        text: `╭〔 ⚡ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("ESTADO DEL BOT")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El bot está actualmente: *${state}*\n┃ > Para cambiar el estado, usa:\n┃ > *${ctx.usedPrefix || "."}bot on* (Para activar)\n┃ > *${ctx.usedPrefix || "."}bot off* (Para desactivar)\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }
    if (!ON.includes(value) && !OFF.includes(value))
      return ctx.reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PARÁMETRO INVÁLIDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Usa *${ctx.usedPrefix || "."}bot on* o *${ctx.usedPrefix || "."}bot off*.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    const enabled = ON.includes(value);
    ctx.db.setGroup(ctx.from, { botOn: enabled ? 1 : 0 });
    return ctx.reply({
      text: `╭〔 ${enabled ? "✅" : "💤"} ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold(enabled ? "BOT ACTIVADO" : "BOT DESACTIVADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El bot ha sido ${enabled ? "reactivado para este grupo" : "apagado para este grupo"}.\n┃ > ${enabled ? "Ya pueden usar mis comandos." : "Solo responderé para reactivarse."}\n\n╰〔 ⚡ ${fytBold(enabled ? "SYSTEM ACTIVE" : "SYSTEM SLEEP")} 〕⬣`,
    });
  },
};
