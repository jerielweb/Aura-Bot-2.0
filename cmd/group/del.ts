import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["del", "delete", "borrar", "eliminar"],
  category: "group",
  description: "Elimina mensajes respondiendo a ellos.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    if (!context?.stanzaId)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA OBJETIVO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Responde al mensaje que deseas eliminar.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    return ctx.sock.sendMessage(ctx.from, {
      delete: {
        remoteJid: ctx.from,
        fromMe: false,
        id: context.stanzaId,
        participant: context.participant,
      },
    });
  },
};
