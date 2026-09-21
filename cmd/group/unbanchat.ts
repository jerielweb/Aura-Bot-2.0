import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["unbanchat", "desbanearchat", "unmutechat"],
  category: "group",
  description: "Reactiva las funciones del bot en el chat.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    if (!ctx.isAdmin && !ctx.isMod && !ctx.isOwner)
      return ctx.reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PERMISO DENEGADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Solo los administradores pueden reactivar este chat.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    ctx.db.setGroup(ctx.from, { chatBanned: 0 });
    return ctx.reply({
      text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("CHAT DESBANEADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ 🎉 El bot ha sido reactivado en este chat.\n┃ > Ya puedes volver a usar los comandos.\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
    });
  },
};
