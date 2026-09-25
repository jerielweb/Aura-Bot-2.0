import { fytBold } from "../../core/socketText.ts";
import {
  REPORT_GROUP_JID,
  createReportId,
  getSocketCandidates,
  reportCaption,
  sendWithAvailableBot,
} from "../../core/reportUtils.ts";

export default {
  name: ["report", "bug", "sugerencia", "reportar", "sugerir"],
  category: "system",
  description: "Envía un bug o sugerencia al grupo de soporte.",
  async run(ctx: any) {
    const reportText = ctx.args.join(" ").trim();
    if (!reportText) {
      return ctx.reply(
        `⚠️ ${fytBold("FALTA TEXTO")}\n\n┃ > Escribe tu reporte.\n┃ > Ejemplo: ${ctx.usedPrefix || "."}report El sticker no funciona.`,
      );
    }

    const data = {
      id: createReportId(),
      originJid: ctx.from,
      originName: ctx.groupName || undefined,
      senderJid: ctx.sender,
      botSession: String(ctx.sock?.sessionName || ctx.sock?.subBotId || "main"),
      sourceMessage:
        ctx.msg?.key && ctx.msg?.message
          ? { key: ctx.msg.key, message: ctx.msg.message }
          : undefined,
    };

    await ctx.react("📨");
    try {
      await sendWithAvailableBot(
        getSocketCandidates(ctx.sock),
        REPORT_GROUP_JID,
        {
          text: reportCaption(data, reportText),
          mentions: [ctx.sender],
        },
      );
      await ctx.react("✅");
      return ctx.reply(`✅ ${fytBold("REPORTE ENVIADO")}\n\n┃ > ID: ${data.id}`);
    } catch (error) {
      console.error("[report] No se pudo enviar el reporte:", error);
      await ctx.react("❌");
      return ctx.reply("❌ No se pudo enviar el reporte. Inténtalo más tarde.");
    }
  },
};