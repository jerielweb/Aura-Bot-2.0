import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["antitoxic", "antitoxicos", "antitx"],
  category: "group",
  description: "Activa el sistema anti-toxicidad.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: any) {
    const value = String(ctx.args?.[0] || "").toLowerCase();
    const validValues = [
      "on",
      "off",
      "1",
      "0",
      "true",
      "false",
      "activar",
      "desactivar",
      "enable",
      "disable",
    ];
    if (!validValues.includes(value)) {
      return ctx.reply({
        text: `╭〔 ⚙️ ${fytBold("AURA REED")} 〕⬣\n┃ 🛡️ ${fytBold("SISTEMA ANTITOXIC")}\n╰━━━━━━━━━━━━⬣\n\n┃ ℹ️ Usa: ${ctx.usedPrefix || "."}antitoxic on\n┃ ℹ️ O: ${ctx.usedPrefix || "."}antitoxic off\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }

    const enabled = ["on", "true", "1", "activar", "enable"].includes(value);
    ctx.db.setGroup(ctx.from, { antiToxic: enabled ? 1 : 0 });
    return ctx.reply({
      text: `╭〔 ${enabled ? "✅" : "❌"} ${fytBold("AURA REED")} 〕⬣\n┃ 🛡️ ${fytBold("SISTEMA ANTITOXIC")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El sistema Anti-Toxic ha sido\n┃ > ${enabled ? "activado" : "desactivado"} con éxito.\n\n╰〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕⬣`,
    });
  },
};
