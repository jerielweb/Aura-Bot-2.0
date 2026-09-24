import { request } from "undici";
import { fytBold } from "../../core/socketText.ts";

let cachedClientId: string | null = null;
let cachedAt = 0;

async function getClientId(): Promise<string> {
  if (cachedClientId && Date.now() - cachedAt < 3600000) return cachedClientId;
  const response = await request("https://soundcloud.com", { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) });
  const html = await response.body.text();
  const scripts = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"\s]+\.js)"/g)].map((match) => match[1]);
  for (const scriptUrl of scripts.slice(-5)) {
    const script = await request(scriptUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) }).then((res) => res.body.text()).catch(() => "");
    const match = script.match(/client_id\s*[:=]\s*["']([A-Za-z0-9_-]+)["']/) || script.match(/["']client_id["']\s*:\s*["']([A-Za-z0-9_-]+)["']/);
    if (match?.[1]) { cachedClientId = match[1]; cachedAt = Date.now(); return cachedClientId; }
  }
  throw new Error("No se pudo obtener el client_id de SoundCloud.");
}

function duration(milliseconds: unknown): string {
  const seconds = Math.floor(Number(milliseconds || 0) / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

export default {
  name: ["scsearch", "scbuscar", "scb", "scs"],
  category: "search",
  description: "Busca canciones de SoundCloud.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona palabras clave para SoundCloud.");
    await react("🔍");
    try {
      const id = await getClientId();
      const url = new URL("https://api-v2.soundcloud.com/search/tracks");
      url.searchParams.set("q", query); url.searchParams.set("client_id", id); url.searchParams.set("limit", "10");
      const response = await request(url).then((res) => res.body.json() as Promise<any>);
      if (!response.collection?.length) throw new Error("No se encontraron resultados.");
      let text = `╭━━〔 ${fytBold("SOUNDCLOUD SEARCH")} 〕━━⬣\n┃ 🔍 ${fytBold("Búsqueda")} › ${query}\n┃ ⚙️ ${fytBold("Motor")} › Api Interna\n╰━━━━━━━━━━━━━━━━⬣\n\n`;
      for (const [index, track] of response.collection.entries()) text += `┃ ${index + 1}. ${fytBold(track.title)}\n┃ ├ 👤 ${fytBold("Artista")} › ${track.user?.username || "Desconocido"}\n┃ ├ ⏱️ ${fytBold("Duración")} › ${duration(track.duration)}\n┃ └ 🔗 ${fytBold("Url")} › ${track.permalink_url || "No disponible"}\n\n`;
      text += `╰〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕⬣`;
      await reply({ text }); await react("✅");
    } catch (error: any) { await react("❌"); return reply({ text: `❌ Error: ${error?.message || "No se pudo buscar en SoundCloud."}` }); }
  },
};
