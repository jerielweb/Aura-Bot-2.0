import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["setwarnlimit", "warnlimit"],
  category: "group",
  description: "Define el límite de advertencias.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    if (!ctx.isAdmin && !ctx.isMod && !ctx.isOwner)
      return ctx.reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PERMISO DENEGADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Solo los administradores pueden cambiar el límite.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    const limit = Number.parseInt(ctx.args?.[0] || "", 10);
    if (!Number.isInteger(limit) || limit < 1)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("USO INCORRECTO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Debes proporcionar un número mayor a 0.\n┃ ➪ Ejemplo: ${ctx.usedPrefix || "."}setwarnlimit 5\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
      });
    ctx.db.setGroup(ctx.from, { warnLimit: limit });
    return ctx.reply({
      text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ 🛡️ ${fytBold("CONFIGURACIÓN")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Límite de advertencias actualizado a: ${limit}\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
    });
  },
};
