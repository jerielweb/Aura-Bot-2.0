import { request } from "undici";
import { fytBold } from "../../core/socketText.ts";
import { downloadToCache, safeFileName } from "../../core/downloadUtils.ts";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraReedBot/2.0",
};

async function resolveMediaFire(
  url: string,
): Promise<{ download: string; name: string; size: string }> {
  if (!/mediafire\.com\/file\//i.test(url))
    throw new Error("URL de MediaFire inválida.");
  const response = await request(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(30000),
  });
  if (response.statusCode < 200 || response.statusCode >= 300)
    throw new Error(`MediaFire HTTP ${response.statusCode}`);
  const html = await response.body.text();
  const link =
    html.match(/id=["']downloadButton["'][^>]+href=["']([^"']+)/i)?.[1] ||
    html.match(/href=["']([^"']+)["'][^>]*id=["']downloadButton/i)?.[1];
  if (!link)
    throw new Error("No se encontró el enlace de descarga de MediaFire.");
  const name =
    html
      .match(/class=["'][^"']*filename[^"']*["'][^>]*>([^<]+)/i)?.[1]
      ?.trim() || "archivo";
  const size = html.match(/File size:\s*([^<]+)/i)?.[1]?.trim() || "N/A";
  return { download: link, name, size };
}

export default {
  name: ["md", "mf", "mediafire"],
  category: "download",
  description: "Descarga archivos de MediaFire.",
  async run({ args, reply, react }: any) {
    const url = args.join(" ").trim();
    if (!url) return reply("⚠️ Proporciona un enlace de MediaFire.");
    await react("⏳");
    try {
      const data = await resolveMediaFire(url);
      const file = await downloadToCache(data.download, 180000);
      const name = safeFileName(data.name, "mediafire");
      const extension =
        name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || "bin";
      const mime =
        extension === "apk"
          ? "application/vnd.android.package-archive"
          : "application/octet-stream";
      const caption = `╭〔 📦 ${fytBold("MEDIAFIRE DL")} 〕━⬣\n\n┃ ➥ ${fytBold(name)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Tamaño")} › ${data.size}\n┃ > ${fytBold("Extensión")} › .${extension.toUpperCase()}\n┃ > ${fytBold("Link")} › ${url}\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando archivo...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      await reply({ text: caption });
      await reply({ document: { url: file }, mimetype: mime, fileName: name });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar el archivo."}`,
      });
    }
  },
};
