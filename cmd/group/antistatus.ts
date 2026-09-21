import { fytBold } from "../../core/socketText.ts";

const ON = ["on", "1", "true", "activar", "enable"];
const OFF = ["off", "0", "false", "desactivar", "disable"];

export default {
  name: ["antistatus", "antiestado", "statusblock", "antistat"],
  category: "group",
  description: "Bloquea estados que mencionen grupos.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] || "").toLowerCase();
    const group = ctx.db.getGroup(ctx.from);
    if (!ON.includes(value) && !OFF.includes(value)) {
      return ctx.reply({ text: `╭〔 🚫 ${fytBold("AURA REED")} 〕⬣\n┃ ⚙️ ${fytBold("ANTI-ESTADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ ℹ️ Estado actual: ${group.antiStatus ? "✅ Activado" : "❌ Desactivado"}\n\n┣━━━━━━━━━━━━⬣\n\n┃ ➪ ${ctx.usedPrefix || "."}antistatus on\n┃ ✦ Activar bloqueo de estados\n\n┃ ➪ ${ctx.usedPrefix || "."}antistatus off\n┃ ✦ Desactivar bloqueo de estados\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    }
    const enabled = ON.includes(value);
    ctx.db.setGroup(ctx.from, { antiStatus: enabled ? 1 : 0 });
    return ctx.reply({ text: `╭〔 ${enabled ? "✅" : "❌"} ${fytBold("AURA REED")} 〕⬣\n┃ 🚫 ${fytBold("SISTEMA ANTI-ESTADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El bloqueo de estados ha\n┃ > sido ${enabled ? "activado" : "desactivado"} con éxito.\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣` });
  },
};
