import { fytBold } from "../../core/socketText.ts";
export default {
  name: ["open", "abrir"],
  category: "group",
  description: "Abre el grupo.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    await ctx.sock.groupSettingUpdate(ctx.from, "not_announcement");
    return ctx.reply(
      `╭〔 🔓 ${fytBold("ADMIN SYSTEM")} 〕⬣\n┃ ✅ ${fytBold("GRUPO ABIERTO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Todos pueden mensajear.\n╰〔 ⚡ AURA REED 〕⬣`,
    );
  },
};
