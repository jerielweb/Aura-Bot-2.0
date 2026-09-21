import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["unmute", "desilenciar"],
  category: "group",
  description: "Quita el silencio a un usuario.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;
    if (!target) return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ❌ ${fytBold("FALTA USUARIO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Etiqueta o responde al usuario que deseas desilenciar.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣` });
    const group = ctx.db.getGroup(ctx.from);
    const mutedUsers = Array.isArray(group.mutedUsers) ? group.mutedUsers : [];
    if (!mutedUsers.includes(target)) return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ℹ️ El usuario @${target.split("@")[0]} no está silenciado.\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`, mentions: [target] });
    ctx.db.setGroup(ctx.from, { mutedUsers: mutedUsers.filter((jid: string) => jid !== target) });
    return ctx.reply({ text: `╭〔 🔊 ${fytBold("AURA REED")} 〕⬣\n┃ ✅ ${fytBold("DESILENCIADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El usuario @${target.split("@")[0]} ya puede hablar.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`, mentions: [target] });
  },
};
