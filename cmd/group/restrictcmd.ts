import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["restrictcmd", "cmdrestrict", "blockcmd"],
  category: "group",
  description: "Bloquea o desbloquea un comando del grupo.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    if (!ctx.isAdmin && !ctx.isMod && !ctx.isOwner)
      return ctx.reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PERMISO DENEGADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Solo los administradores pueden restringir comandos.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    const group = ctx.db.getGroup(ctx.from);
    const args = ctx.args || [];
    const action = [
      "on",
      "off",
      "add",
      "remove",
      "list",
      "ls",
      "show",
    ].includes(String(args[0]).toLowerCase())
      ? String(args[0]).toLowerCase()
      : "toggle";
    const target = (action === "toggle" ? args[0] : args[1] || "")
      .replace(/^\./, "")
      .toLowerCase();
    const current = Array.isArray(group.restrictedCommands)
      ? group.restrictedCommands
      : [];
    if (["list", "ls", "show"].includes(action))
      return ctx.reply({
        text: `╭〔 ⚙️ ${fytBold("RESTRICTCMD")} 〕⬣\n┃ ${fytBold("COMANDOS BLOQUEADOS")}\n╰━━━━━━━━━━━━⬣\n\n${current.join("\n") || "┃ > Ningún comando restringido"}\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    if (!target)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("COMANDO INVÁLIDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Uso: ${ctx.usedPrefix || "."}restrictcmd on|off comando\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    const enabled =
      ["on", "add"].includes(action) ||
      (action === "toggle" && !current.includes(target));
    ctx.db.setGroup(ctx.from, {
      restrictedCommands: enabled
        ? [...new Set([...current, target])]
        : current.filter((item: string) => item !== target),
    });
    return ctx.reply({
      text: `╭〔 ${enabled ? "🔒" : "🔓"} ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold(enabled ? "COMANDO BLOQUEADO" : "COMANDO HABILITADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El comando *${target}* ha sido ${enabled ? "restringido" : "habilitado"}.\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
    });
  },
};
