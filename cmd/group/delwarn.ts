import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["delwarn", "unwarn"],
  category: "group",
  description: "Quita una advertencia.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;
    if (!target)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA USUARIO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Etiqueta o responde a un usuario\n┃ > para quitarle una advertencia.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    const group = ctx.db.getGroup(ctx.from);
    const warns =
      group.warns && typeof group.warns === "object" ? group.warns : {};
    const history = Array.isArray(warns[target]) ? [...warns[target]] : [];
    if (!history.length)
      return ctx.reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("SIN ADVERTENCIAS")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El usuario @${target.split("@")[0]} no tiene advertencias para quitar.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
        mentions: [target],
      });
    history.pop();
    ctx.db.setGroup(ctx.from, { warns: { ...warns, [target]: history } });
    return ctx.reply({
      text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("ADVERTENCIA ELIMINADA")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Se le ha quitado una advertencia a @${target.split("@")[0]}\n┃ > Warns restantes: [ ${history.length}/${group.warnLimit || 3} ]\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      mentions: [target],
    });
  },
};
