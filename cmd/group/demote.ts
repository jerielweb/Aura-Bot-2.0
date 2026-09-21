import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["demote", "descender", "quitardadmin"],
  category: "group",
  description: "Quita el administrador a un usuario.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;
    if (!target)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA USUARIO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Etiqueta o responde al administrador para quitarle el admin.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    await ctx.sock.groupParticipantsUpdate(ctx.from, [target], "demote");
    return ctx.reply({
      text: `╭〔 👑 ${fytBold("ADMIN SYSTEM")} 〕⬣\n\n┃ > El usuario @${target.split("@")[0]}\n┃ > ya no es administrador del grupo.\n\n╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`,
      mentions: [target],
    });
  },
};
