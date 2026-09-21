import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["kick", "sacar", "quitar", "expulsar", "limpiar"],
  category: "group",
  description: "Expulsa integrantes del grupo.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const targets = context?.mentionedJid?.length ? context.mentionedJid : context?.participant ? [context.participant] : [];
    if (!targets.length) return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("ACCIÓN INVÁLIDA")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Menciona a alguien o responde a su mensaje.\n┃ > Ejemplo: ${ctx.usedPrefix || "."}kick @usuario\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣` });
    await ctx.sock.groupParticipantsUpdate(ctx.from, targets, "remove");
    return ctx.reply({ text: `╭〔 👑 ${fytBold("ADMIN SYSTEM")} 〕⬣\n\n┃ ✅ ${fytBold("LIMPIEZA COMPLETADA")}\n┃ > Se expulsaron ${targets.length} usuarios.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`, mentions: targets });
  },
};
