import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["all", "todos", "invocar"],
  category: "group",
  description: "Menciona a todos los integrantes.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const participants = Array.isArray(ctx.groupMeta?.participants) ? ctx.groupMeta.participants : [];
    const memberJids = Array.from(new Set<string>(participants.map((participant: any) => participant?.id).filter(Boolean).map((jid: string) => String(jidNormalizedUser(jid))) as string[]));
    if (!memberJids.length) return ctx.reply({ text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("SIN MIEMBROS VÁLIDOS")}\n╰━━━━━━━━━━━━⬣\n\n┃ > No se han encontrado participantes válidos.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣` });
    const quotedMessage = ctx.msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text || "𝐀𝐜𝐭𝐢́𝐯𝐞𝐧𝐬𝐞";
    const customMessage = ctx.args.join(" ") || quotedText;
    let text = `╭〔 📢 ${fytBold("AURA REED")} 〕⬣\n┃ 🔔 ${fytBold("INVOCANDO AL GRUPO")}\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ ✨ ${customMessage}\n┃ 👥 ${fytBold("N° de Miembros:")} ${memberJids.length}\n\n┣━━━━━━━━━━━━⬣\n\n`;
    text += memberJids.map((jid) => `┃ ➪ @${jid.split("@")[0]}`).join("\n");
    text += `\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`;
    return ctx.reply({ text, mentions: memberJids });
  },
};
