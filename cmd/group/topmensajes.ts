import { fytBold } from "../../core/socketText.ts";

function getMessageWeek(date = new Date()): string {
  const current = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${current.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default {
  name: ["topmensajes", "topmsg", "mensajes"],
  category: "group",
  description: "Muestra quién ha enviado más mensajes en el grupo.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const pageSize = 10;
    const requestedPage = Number.parseInt(String(ctx.args?.[0] || "1"), 10);
    if (!Number.isInteger(requestedPage) || requestedPage < 1)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("PÁGINA INVÁLIDA")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Ejemplo: ${ctx.usedPrefix || "."}topmensajes 1\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    const currentWeek = getMessageWeek();
    const users = (
      Array.isArray(ctx.db.getGroup(ctx.from).topMsgUsers)
        ? ctx.db.getGroup(ctx.from).topMsgUsers
        : []
    )
      .map((user: any) => ({
        id: user.jid,
        lid: user.lid,
        pushName: user.pushName || "Usuario",
        week: user.week,
        count: Number(user.count || 0),
      }))
      .filter((user: any) => user.week === currentWeek)
      .filter((user: any) => user.id && user.count > 0)
      .sort((left: any, right: any) => right.count - left.count);
    if (!users.length)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("SIN MENSAJES REGISTRADOS")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Todavía no hay actividad para mostrar.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    const totalPages = Math.ceil(users.length / pageSize);
    if (requestedPage > totalPages)
      return ctx.reply(
        `⚠️ Esa página no existe. Hay ${totalPages} página${totalPages === 1 ? "" : "s"}.`,
      );
    const page = users.slice(
      (requestedPage - 1) * pageSize,
      requestedPage * pageSize,
    );
    let text = `╭〔 💬 ${fytBold("MENSAJES TOP")} 💬 〕⬣\n┃ 🏆 ${fytBold("RANKING DE MENSAJES")}\n┃ 📄 Página ${requestedPage}/${totalPages}\n╰━━━━━━━━━━━━⬣\n\n`;
    page.forEach((user: any, index: number) => {
      const position = (requestedPage - 1) * pageSize + index;
      const medal = position < 3 ? ["🥇", "🥈", "🥉"][position] : "🎖️";
      text += `┃ ${medal} ${user.pushName}\n┃ 💬 ${user.count} mensajes\n\n`;
    });
    text += `╰〔 ⚡ ${fytBold("AURA GROUP")} ⚡ 〕⬣`;
    return ctx.reply({ text });
  },
};
