import { fytBold } from "../../core/socketText.ts";

const ON = ["on", "1", "true", "activar", "enable"];
const OFF = ["off", "0", "false", "desactivar", "disable"];

export default {
  name: ["antilink", "antienlace", "antigp"],
  category: "group",
  description: "Bloquea enlaces de otros grupos y canales.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] || "").toLowerCase();
    const group = ctx.db.getGroup(ctx.from);
    if (!ON.includes(value) && !OFF.includes(value)) {
      return ctx.reply({ text: `╭〔 🛡️ ${fytBold("AURA REED")} 〕⬣\n┃ ⚙️ ${fytBold("SISTEMA ANTILINK")}\n╰━━━━━━━━━━━━⬣\n\n┃ ℹ️ Estado actual: ${group.antilink ? "✅ Activado" : "❌ Desactivado"}\n\n┣━━━━━━━━━━━━⬣\n\n┃ ➪ ${ctx.usedPrefix || "."}antilink on\n┃ ✦ Activar sistema antilink\n\n┃ ➪ ${ctx.usedPrefix || "."}antilink off\n┃ ✦ Desactivar sistema antilink\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    }
    const enabled = ON.includes(value);
    ctx.db.setGroup(ctx.from, { antilink: enabled ? 1 : 0 });
    return ctx.reply({ text: `╭〔 ${enabled ? "✅" : "❌"} ${fytBold("AURA REED")} 〕⬣\n┃ 🛡️ ${fytBold("SISTEMA ANTILINK")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El sistema Antilink ha\n┃ > sido ${enabled ? "activado" : "desactivado"} con éxito.\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣` });
  },
};
