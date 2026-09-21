import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["say", "decir"],
  category: "funy",
  description: "Repite lo que dices.",

  async run(ctx: any) {
    const quotedContext = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = quotedContext?.quotedMessage;
    const customText = ctx.args.join(" ").trim();

    if (quotedMessage) {
      const type = Object.keys(quotedMessage)[0];
      if (
        [
          "imageMessage",
          "videoMessage",
          "stickerMessage",
          "audioMessage",
          "documentMessage",
        ].includes(type)
      ) {
        const media = quotedMessage[type];
        const stream = await downloadContentFromMessage(
          media,
          type.replace("Message", "") as any,
        );
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(Buffer.from(chunk));
        const buffer = Buffer.concat(chunks);
        const payload: any = {};

        if (type === "imageMessage") {
          payload.image = buffer;
          payload.caption = customText || media.caption || "";
        } else if (type === "videoMessage") {
          payload.video = buffer;
          payload.caption = customText || media.caption || "";
          payload.gifPlayback = media.gifPlayback || false;
        } else if (type === "stickerMessage") {
          payload.sticker = buffer;
        } else if (type === "audioMessage") {
          payload.audio = buffer;
          payload.mimetype = media.mimetype || "audio/mp4";
          payload.ptt = media.ptt || false;
        } else {
          payload.document = buffer;
          payload.mimetype = media.mimetype;
          payload.fileName = media.fileName || "documento";
          payload.caption = customText || media.caption || "";
        }

        return ctx.sock.sendMessage(ctx.from, payload);
      }
    }

    const quotedText =
      quotedMessage?.conversation ||
      quotedMessage?.extendedTextMessage?.text ||
      "";
    const finalText = customText || quotedText;
    if (!finalText) {
      let text = `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n`;
      text += `┃ ${fytBold("FALTA MENSAJE")}\n`;
      text += "╰━━━━━━━━━━━━⬣\n\n";
      text += "┃ > Debes escribir un mensaje o responder a uno existente.\n\n";
      text += `╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`;
      return ctx.reply({ text });
    }

    return ctx.sock.sendMessage(ctx.from, { text: finalText });
  },
};
