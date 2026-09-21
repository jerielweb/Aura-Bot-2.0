import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["infogroup", "infogp", "ingp", "gp"],
  category: "group",
  description: "Muestra la información detallada del grupo.",
  groupOnly: true,
  async run(ctx: any) {
    const metadata = ctx.groupMeta || {};
    const participants = Array.isArray(metadata.participants) ? metadata.participants : [];
    const admins = participants.filter((participant: any) => participant.admin).map((participant: any) => participant.id).filter(Boolean);
    const description = metadata.desc || "Sin descripción.";
    const date = metadata.creation ? new Date(metadata.creation * 1000).toLocaleString("es-ES") : "Desconocida";
    let text = `╭〔 🏰 ${fytBold("GROUP INFO")} 〕⬣\n┃ 🛡️ ${fytBold("DETALLES DEL GRUPO")}\n╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 📛 ${fytBold("Nombre")} › ${metadata.subject || ctx.groupName || "Grupo"}\n┃ 🆔 ${fytBold("ID")} › ${ctx.from.split("@")[0]}\n┃ 📅 ${fytBold("Creación")} › ${date}\n┃ 👑 ${fytBold("Creador")} › @${String(metadata.owner || "").split("@")[0]}\n\n`;
    text += `┣━━━━〔 👥 ${fytBold("ESTADÍSTICAS")} 〕━⬣\n\n┃ 👥 ${fytBold("Miembros")} › ${participants.length}\n┃ 🛡️ ${fytBold("Admins")} › ${admins.length}\n\n`;
    text += `┣━━━━〔 📝 ${fytBold("DESCRIPCIÓN")} 〕━⬣\n\n┃ ${description}\n\n`;
    text += `┣━━━━〔 🛡️ ${fytBold("ADMINISTRADORES")} 〕━⬣\n\n${admins.map((jid: string) => `┃ ➪ @${jid.split("@")[0]}`).join("\n")}\n\n╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
    return ctx.reply({ text, mentions: [metadata.owner, ...admins].filter(Boolean) });
  },
};
