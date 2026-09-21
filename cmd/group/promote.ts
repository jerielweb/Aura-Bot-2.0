import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["promote", "ascender", "haceradmin"],
  category: "group",
  description: "Da administrador a un usuario.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;
    if (!target)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA USUARIO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Etiqueta o responde al usuario para darle admin.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    await ctx.sock.groupParticipantsUpdate(ctx.from, [target], "promote");
    return ctx.reply({
      text: `╭〔 👑 ${fytBold("ADMIN SYSTEM")} 〕⬣\n\n┃ > El usuario @${target.split("@")[0]}\n┃ > ahora es administrador del grupo.\n\n╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`,
      mentions: [target],
    });
  },
};
