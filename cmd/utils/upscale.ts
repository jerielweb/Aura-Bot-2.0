import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: ["hd", "remini", "upscale", "enhance"],
  category: "utils",
  description: "Mejora la calidad de una imagen.",
  async run({ msg, args, reply, react }: any) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const source = msg.message?.imageMessage || quoted?.imageMessage;
    if (!source) return reply({ text: "❌ Responde a una imagen o envía una imagen con .hd [2 o 4]." });
    const scale = Number(args[0]) === 4 ? 4 : 2;
    await react("⏳");
    try {
      const mediaMessage = quoted?.imageMessage ? { key: msg.key, message: { imageMessage: quoted.imageMessage } } : msg;
      const buffer = await downloadMediaMessage(mediaMessage, "buffer", {}, { logger: console } as any);
      const form = new FormData();
      form.append("method", "local");
      form.append("scale", String(scale));
      form.append("file", new Blob([buffer], { type: "image/jpeg" }), "image.jpg");
      const response = await fetch("https://api.alyacore.xyz/tools/upscale?key=oboe", { method: "POST", body: form, signal: AbortSignal.timeout(60000) });
      const result = Buffer.from(await response.arrayBuffer());
      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) throw new Error("La API no pudo procesar la imagen.");
      await reply({ image: result, caption: `╭━━━━〔 ✨ 𝐈𝐌𝐀𝐆𝐄𝐍 𝐇𝐃 〕━━━⬣\n\n┃ ➥ 𝐄𝐬𝐜𝐚𝐥𝐚 › ${scale}x\n\n╰━━〔 ⚡ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐀𝐂𝐓𝐈𝐕𝐄 〕━━⬣` });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({ text: `❌ No se pudo procesar la imagen: ${error?.message || "error desconocido"}` });
    }
  },
};
