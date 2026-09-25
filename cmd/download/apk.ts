import { fytBold } from "../../core/socketText.ts";
import {
  downloadToCache,
  requestJson,
  safeFileName,
} from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";
import { sendDownloadPreview } from "../../core/downloadPreview.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");

export default {
  name: ["apk", "apkdl", "apkd", "apks", "apkdownload", "androidapp", "app"],
  category: "download",
  description: "Descarga archivos APK de Android.",
  async run({ args, reply, react, sock, from, msg, sender }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona el nombre de la aplicación APK.");
    await react("⏳");
    try {
      const response = await requestJson(
        `${API}/search/apk?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`,
      );
      const data = response?.data;
      if (!response?.status || !data?.dl)
        throw new Error("No se encontró una aplicación descargable.");
      const name = String(data.name || "Aplicación Android");
      const caption = `╭〔 🤖 ${fytBold("APK DOWNLOADER")} 〕━⬣\n\n┃ ➥ ${fytBold(name)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("ID App")} › ${data.package || "N/A"}\n┃ > ${fytBold("Tamaño")} › ${data.size || "N/A"}\n┃ > ${fytBold("Versión")} › ${data.lastUpdated || "N/A"}\n┃ > ${fytBold("Tipo")} › Aplicación (APK)\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando APK...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      const hasPreview = data.banner
        ? await sendDownloadPreview({
            sock,
            from,
            msg,
            thumbnail: data.banner,
            caption,
            link: data.dl,
            title: name,
            author: data.package || "Android APK",
            sender,
          })
        : false;
      if (!hasPreview) await reply({ text: caption });
      const file = await downloadToCache(data.dl);
      await reply({
        document: { url: file },
        mimetype: "application/vnd.android.package-archive",
        fileName: `${safeFileName(name, "application")}.apk`,
      });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar el APK."}`,
      });
    }
  },
};
