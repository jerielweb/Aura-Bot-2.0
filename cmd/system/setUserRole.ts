import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { db } from "../../dbController/db.ts";
import { fytBold } from "../../core/socketText.ts";

const roles = ["user", "mod", "coowner", "owner"];

function getTarget(ctx: any): string | null {
  const message = ctx.msg?.message ?? {};
  const infos = Object.values(message)
    .map((value: any) => value?.contextInfo)
    .filter(Boolean) as any[];
  const target =
    infos.flatMap((info) => info.mentionedJid ?? [])[0] ??
    infos.find((info) => info.quotedMessage)?.participant;
  return target ? jidNormalizedUser(target) : null;
}

export default {
  name: ["setuserrole", "setrole", "userrole", "rol"],
  category: "system",
  description: "Asigna un rol persistente a un usuario.",
  ownerOnly: true,

  async run(ctx: any) {
    const role = String(ctx.args?.[0] ?? "").toLowerCase();
    const target = getTarget(ctx);

    if (!roles.includes(role) || !target) {
      return ctx.reply(
        `⚠️ Uso: *${ctx.usedPrefix ?? "."}setrole [user|mod|coowner|owner] @usuario*`,
      );
    }

    db.setRole(target, role);
    const targetUser = db.getUser(target);
    const roleName = role === "coowner" ? "co-owner" : role;
    let text = `╭〔 🛡️ ${fytBold("GESTIÓN DE ROLES")} 〕⬣\n`;
    text += `┃ ✅ ${fytBold("ROL ACTUALIZADO")}\n`;
    text += "╰━━━━━━━━━━━━⬣\n\n";
    text += `┃ 👤 Usuario: @${target.split("@")[0]}\n`;
    text += `┃ 🛡️ Rol: *${roleName}*\n`;
    text += `┃ 💾 Persistencia: ${targetUser.role === role ? "guardado en DB" : "pendiente"}\n\n`;
    text += "╰〔 ⚡ SYSTEM 〕⬣";
    return ctx.reply({ text, mentions: [target] });
  },
};
