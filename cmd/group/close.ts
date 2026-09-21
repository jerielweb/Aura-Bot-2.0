import { fytBold } from "../../core/socketText.ts";
export default {
  name: ["close", "cerrar"],
  category: "group",
  description: "Cierra el grupo.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    await ctx.sock.groupSettingUpdate(ctx.from, "announcement");
    return ctx.reply(
      `╭〔 🔒 ${fytBold("ADMIN SYSTEM")} 〕⬣\n┃ ✅ ${fytBold("GRUPO CERRADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Solo administradores pueden mensajear.\n╰〔 ⚡ AURA REED 〕⬣`,
    );
  },
};
