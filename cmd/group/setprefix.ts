import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["setprefix", "prefix", "delprefix", "deleteprefix"],
  description: "Cambia el prefijo de este grupo.",
  category: "group",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    if (["delprefix", "deleteprefix"].includes(ctx.cmdName)) {
      ctx.db.setGroup(ctx.from, { prefix: null });
      return ctx.reply({
        text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PREFIJO ELIMINADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Se usarán los prefijos globales.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }

    const value = String(ctx.args?.[0] ?? "").trim();
    if (value && (value.length > 1 || /\s/.test(value))) {
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PREFIJO INVÁLIDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Por favor proporciona\n┃ > un prefijo valido.\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    }

    ctx.db.setGroup(ctx.from, { prefix: value || null });
    return ctx.reply(
      value
        ? `✅ Prefijo del grupo actualizado a: ${value}`
        : "✅ El grupo volverá a usar los prefijos globales.",
    );
  },
};
