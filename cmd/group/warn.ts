import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["warn", "advertir", "aviso"],
  category: "group",
  description: "Añade una advertencia a un usuario.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;
    if (!target)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA OBJETIVO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Etiqueta o responde a un usuario para advertirlo.\n┃ > Ejemplo: ${ctx.usedPrefix || "."}warn @usuario [razón]\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    const reason = (ctx.args || [])
      .filter((arg: string) => !arg.includes("@"))
      .join(" ")
      .trim();
    if (!reason)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA MOTIVO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Debes especificar una razón.\n┃ > Ejemplo: ${ctx.usedPrefix || "."}warn @usuario Insultos\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    const group = ctx.db.getGroup(ctx.from);
    const warns =
      group.warns && typeof group.warns === "object" ? group.warns : {};
    const history = Array.isArray(warns[target]) ? [...warns[target]] : [];
    const date = new Date().toLocaleDateString("es-CR", {
      timeZone: "America/Costa_Rica",
    });
    history.push({ reason, date });
    ctx.db.setGroup(ctx.from, { warns: { ...warns, [target]: history } });
    const limit = group.warnLimit || 3;
    if (history.length >= limit) {
      await ctx.sock
        .groupParticipantsUpdate(ctx.from, [target], "remove")
        .catch(() => undefined);
      ctx.db.setGroup(ctx.from, { warns: { ...warns, [target]: [] } });
      return ctx.reply({
        text: `╭〔 🚨 ${fytBold("LÍMITE DE ADVERTENCIAS ALCANZADO")} 〕⬣\n\n┃ 👤 Usuario: @${target.split("@")[0]}\n┃ 📊 Warns: [ ${history.length}/${limit} ]\n┃ 🛡️ Acción: Expulsado por límite de advertencias\n┃ ⏰ Fecha: ${date}\n\n┣━━━━━━━━━━━━━━━━⬣\n\n┃ ⚠️ El usuario ha alcanzado el límite.\n\n╰〔 ${fytBold("WARN SYSTEM")} 〕⬣`,
        mentions: [target],
      });
    }
    return ctx.reply({
      text: `╭〔 ⚠️ ${fytBold("ADVERTENCIA")} 〕⬣\n\n┃ 👤 Usuario: @${target.split("@")[0]}\n┃ 🛡️ Admin: @${ctx.sender.split("@")[0]}\n┃ 📌 Acción: Advertencia agregada\n┃ 📊 Warns: [ ${history.length}/${limit} ]\n┃ 📝 Razón: ${reason}\n┃ ⏰ Fecha: ${date}\n\n┣━━━━━━━━━━━━━━━━⬣\n┃ ⚠️ Se ha añadido una advertencia.\n\n╰〔 ${fytBold("WARN SYSTEM")} 〕⬣`,
      mentions: [target, ctx.sender],
    });
  },
};
