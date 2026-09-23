import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["setwelcome", "setbienvenida"],
  category: "group",
  description: "Personaliza el mensaje de bienvenida.",
  groupOnly: true,
  adminOnly: false,
  async run(ctx: any) {
    const value =
      typeof ctx.rawText === "string" ? ctx.rawText : ctx.args.join(" ");
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      const currentMessage =
        ctx.db.getGroup(ctx.from).welcomeMessage || "Mensaje por defecto";
      return ctx.reply({
        text: `╭〔 ⚙️ ${fytBold("SETWELCOME - AURA REED")} 〕⬣\n┃ 💬 ${fytBold("Mensaje personalizado actual:")}\n┃ > ${currentMessage}\n╰━━━━━━━━━━━━⬣\n\n💡 ${fytBold("Uso del comando:")}\n┃ • ${ctx.usedPrefix || "."}setwelcome [texto] - Establece un nuevo mensaje.\n┃ • ${ctx.usedPrefix || "."}setwelcome reset - Restablece al mensaje por defecto.\n\n🏷️ ${fytBold("Etiquetas disponibles:")}\n┃ • @user - Menciona al nuevo usuario\n┃ • @group - Nombre del grupo\n┃ • @desc - Descripción del grupo\n┃ • @count - Total de integrantes\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }
    if (["reset", "default"].includes(normalizedValue.toLowerCase())) {
      ctx.db.setGroup(ctx.from, { welcomeMessage: null });
      return ctx.reply({
        text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("MENSAJE RESTABLECIDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Se usará la bienvenida por defecto.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }
    ctx.db.setGroup(ctx.from, { welcomeMessage: value });
    return ctx.reply({
      text: `╭〔 ✅ ${fytBold("AURA REED")} 〕⬣\n┃ 👋 ${fytBold("BIENVENIDA PERSONALIZADA")}\n╰━━━━━━━━━━━━⬣\n\n┃ 📌 ${fytBold("Nueva plantilla:")}\n${value}\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
    });
  },
};
