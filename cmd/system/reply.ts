import { fytBold } from "../../core/socketText.ts";
import {
  REPORT_GROUP_JID,
  decodeReportData,
  getQuotedText,
  getSocketCandidates,
  replyCaption,
  sendWithAvailableBot,
} from "../../core/reportUtils.ts";

export default {
  name: ["reply", "replyreport", "responderreport"],
  category: "system",
  description: "Responde un reporte y devuelve la respuesta a su chat original.",
  groupOnly: true,
  async run(ctx: any) {
    if (ctx.from !== REPORT_GROUP_JID)
      return ctx.reply("⚠️ Este comando solo funciona en el grupo de soporte.");

    const response = ctx.args.join(" ").trim();
    const report = decodeReportData(getQuotedText(ctx.msg));
    if (!report)
      return ctx.reply(
        `⚠️ ${fytBold("REPORTE NO ENCONTRADO")}\n\n┃ > Responde directamente al mensaje del reporte y escribe tu respuesta.`,
      );
    if (!response) return ctx.reply("⚠️ Escribe la respuesta después de .repli.");

    try {
      await sendWithAvailableBot(
        getSocketCandidates(ctx.sock),
        report.originJid,
        { text: replyCaption(response), mentions: [report.senderJid] },
        report.sourceMessage ? { quoted: report.sourceMessage } : undefined,
      );
      return ctx.reply(`✅ ${fytBold("RESPUESTA ENVIADA")} › ${report.id}`);
    } catch (error) {
      console.error("[repli] No se pudo devolver la respuesta:", error);
      return ctx.reply("❌ Ningún bot pudo enviar la respuesta al chat original.");
    }
  },
};