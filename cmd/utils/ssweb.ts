import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["ssweb", "ss", "webss"],
  category: "utils",
  description: "Toma una captura de una página web.",
  async run({ args, reply, react }: any) {
    let url = args[0];
    if (!url) return reply({ text: "❌ Ingresa una URL válida. Ejemplo: .ssweb sitio.com" });
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    await react("🌐");
    try {
      const apiUrl = `https://api.alyacore.xyz/tools/ssweb?url=${encodeURIComponent(url)}&device=pc&key=oboe`;
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const image = Buffer.from(await response.arrayBuffer());
      const caption = `╭〔 🌐 ${fytBold("SCREENSHOT WEB")} 〕⬣\n┃ ➥ ${fytBold("URL")} › ${url}\n╰〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕⬣`;
      await react("✅");
      return reply({ image, caption });
    } catch (error: any) {
      await react("❌");
      return reply({ text: `❌ No se pudo obtener la captura: ${error?.message || "error desconocido"}` });
    }
  },
};
