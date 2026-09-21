import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["link", "linkgroup", "grupo"],
  category: "group",
  description: "Obtiene el enlace del grupo.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    try {
      const code = await ctx.sock.groupInviteCode(ctx.from);
      return ctx.reply({ text: `╭〔 🔗 ${fytBold("LINK DEL GRUPO")} 〕⬣\n\n┃ 👥 Grupo: ${ctx.groupName || "Grupo"}\n┃ 🔗 Enlace: https://chat.whatsapp.com/${code}\n\n╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣` });
    } catch {
      return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("ERROR DE LINK")}\n╰━━━━━━━━━━━━⬣\n\n┃ > No pude obtener el link.\n┃ > Asegúrate de que soy admin.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣` });
    }
  },
};
