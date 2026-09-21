import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["onlyadmin", "adminonly"],
  description: "Permite comandos solamente a administradores del grupo.",
  category: "group",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] ?? "").toLowerCase();
    if (!["on", "off", "true", "false", "1", "0"].includes(value)) {
      return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("USO INCORRECTO")}\n╰━━━━━━━━━━━━⬣\n\n┃ ➪ ${ctx.usedPrefix ?? "."}onlyadmin on\n┃ ➪ ${ctx.usedPrefix ?? "."}onlyadmin off\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    }

    const enabled = ["on", "true", "1"].includes(value);
    ctx.db.setGroup(ctx.from, { onlyAdmin: enabled ? 1 : 0 });
    return ctx.reply({ text: `╭〔 ${enabled ? "✅" : "❌"} ${fytBold("AURA REED")} 〕⬣\n┃ 🛡️ ${fytBold("MODO SOLO ADMINS")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El modo Solo Admins ha sido\n┃ > ${enabled ? "activado" : "desactivado"} con éxito.\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣` });
  },
};