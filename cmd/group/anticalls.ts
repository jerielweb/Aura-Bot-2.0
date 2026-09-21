import { fytBold } from "../../core/socketText.ts";

const ON = ["on", "1", "true", "activar", "enable"];
const OFF = ["off", "0", "false", "desactivar", "disable"];

export default {
  name: ["anticalls", "antillamadas", "antillamada", "callblock"],
  category: "group",
  description: "Bloquea llamadas entrantes en grupos.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] || "").toLowerCase();
    const group = ctx.db.getGroup(ctx.from);
    if (!ON.includes(value) && !OFF.includes(value)) {
      return ctx.reply({ text: `╭〔 📵 ${fytBold("AURA REED")} 〕⬣\n┃ ⚙️ ${fytBold("ANTI-CALL")}\n╰━━━━━━━━━━━━⬣\n\n┃ ℹ️ Estado actual: ${group.antiCalls ? "✅ Activado" : "❌ Desactivado"}\n\n┣━━━━━━━━━━━━⬣\n\n┃ ➪ ${ctx.usedPrefix || "."}anticalls on\n┃ ✦ Activar bloqueo de llamadas\n\n┃ ➪ ${ctx.usedPrefix || "."}anticalls off\n┃ ✦ Desactivar bloqueo de llamadas\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    }
    const enabled = ON.includes(value);
    ctx.db.setGroup(ctx.from, { antiCalls: enabled ? 1 : 0 });
    return ctx.reply({ text: `╭〔 ${enabled ? "✅" : "❌"} ${fytBold("AURA REED")} 〕⬣\n┃ 📵 ${fytBold("SISTEMA ANTI-CALL")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El bloqueo de llamadas ha\n┃ > sido ${enabled ? "activado" : "desactivado"} con éxito.\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣` });
  },
};
