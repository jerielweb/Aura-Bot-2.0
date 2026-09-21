import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["listwarn", "warns", "verwarn", "viewwarn"],
  category: "group",
  description: "Muestra las advertencias de un usuario.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant || (ctx.args?.[0] ? `${ctx.args[0].replace(/\D/g, "")}@s.whatsapp.net` : null);
    if (!target) return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA OBJETIVO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Menciona o responde a un usuario.\n┃ > Ejemplo: ${ctx.usedPrefix || "."}listwarn @usuario\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    const history = ctx.db.getGroup(ctx.from).warns?.[target] || [];
    if (!Array.isArray(history) || history.length === 0) return ctx.reply({ text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("SIN ADVERTENCIAS")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El usuario @${target.split("@")[0]} no tiene advertencias registradas.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`, mentions: [target] });
    const content = history.map((warn: any, index: number) => `┃ ${index + 1}. ${warn.reason || "Sin motivo"} • ${warn.date || "Sin fecha"}`).join("\n");
    return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("ADVERTENCIAS")} 〕⬣\n┃ 👤 Usuario: @${target.split("@")[0]}\n┃ 📊 Total: ${history.length}\n╰━━━━━━━━━━━━⬣\n\n${content}\n\n╰〔 ⚡ ${fytBold("WARN SYSTEM")} 〕⬣`, mentions: [target] });
  },
};
