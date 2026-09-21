import { fytBold } from "../../core/socketText.ts";
import { downloadBuffer, requestJson } from "../../core/downloadUtils.ts";

const INSTAGRAM_URL =
  /(?:instagram\.com|instagr\.am)\/(?:reels?|p|tv|stories)\//i;

export default {
  name: ["ig", "instagram"],
  category: "download",
  description: "Descarga videos o imágenes de Instagram.",
  async run({ args, reply, react }: any) {
    const url = args.join(" ").trim();
    if (!url || !INSTAGRAM_URL.test(url))
      return reply("⚠️ Proporciona un enlace válido de Instagram.");
    await react("⏳");
    try {
      const response = await requestJson(
        `https://api.delirius.online/download/instagramv2?url=${encodeURIComponent(url)}`,
        60000,
      );
      const data = response?.data;
      const items = Array.isArray(data?.download) ? data.download : [];
      const video = items.find(
        (item: any) => item.type === "video" && item.url,
      );
      const images = items.filter(
        (item: any) => item.type === "image" && item.url,
      );
      const caption = `╭〔 📸 ${fytBold(video ? "INSTAGRAM VIDEO" : "INSTAGRAM POST")} 〕━⬣\n\n┃ ➥ ${fytBold(data?.caption || "Sin título")}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Total")} › ${video ? "1 video" : `${images.length} imágenes`}\n┃ > ${fytBold("Url")} › ${url}\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      if (video) {
        const file = await downloadBuffer(video.url, 120000);
        await reply({
          video: file,
          mimetype: "video/mp4",
          fileName: "instagram.mp4",
          caption,
        });
      } else if (images.length) {
        for (const [index, item] of images.entries()) {
          const file = await downloadBuffer(item.url, 120000);
          await reply({
            image: file,
            caption: index === 0 ? caption : undefined,
          });
        }
      } else throw new Error("No se encontró contenido multimedia.");
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar Instagram."}`,
      });
    }
  },
};
