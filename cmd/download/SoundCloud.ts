import { request } from "undici";
import { fytBold } from "../../core/socketText.ts";

let cachedClientId: string | null = null;
let cachedAt = 0;

const SOUNDCloud_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  Origin: "https://soundcloud.com",
  Referer: "https://soundcloud.com/",
};

class SoundCloudHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, body = "") {
    super(
      `SoundCloud respondió HTTP ${statusCode}${body ? `: ${body.slice(0, 160)}` : ""}`,
    );
    this.name = "SoundCloudHttpError";
    this.statusCode = statusCode;
  }
}

async function fetchText(url: string, init: any = {}): Promise<string> {
  const response = await request(url, {
    headers: { ...SOUNDCloud_HEADERS, ...init.headers },
    signal: AbortSignal.timeout(10000),
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new SoundCloudHttpError(
      response.statusCode,
      await response.body.text(),
    );
  }
  return response.body.text();
}

async function requestJson(url: URL | string, timeout = 10000): Promise<any> {
  const response = await request(url, {
    headers: SOUNDCloud_HEADERS,
    signal: AbortSignal.timeout(timeout),
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new SoundCloudHttpError(
      response.statusCode,
      await response.body.text(),
    );
  }
  return response.body.json();
}

async function getClientId(): Promise<string> {
  if (cachedClientId && Date.now() - cachedAt < 60 * 60 * 1000)
    return cachedClientId;

  const html = await fetchText("https://soundcloud.com", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const scripts = [
    ...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g),
  ].map((match) => match[1]);

  for (const scriptUrl of scripts.slice(-5)) {
    try {
      const script = await fetchText(scriptUrl);
      const matches = [
        script.match(/client_id\s*[:=]\s*["']([a-zA-Z0-9_-]+)["']/),
        script.match(/["']client_id["']\s*:\s*["']([a-zA-Z0-9_-]+)["']/),
        script.match(/client_id=([a-zA-Z0-9_-]+)/),
      ].filter(Boolean) as RegExpMatchArray[];
      if (matches[0]?.[1]) {
        cachedClientId = matches[0][1];
        cachedAt = Date.now();
        return cachedClientId;
      }
    } catch {
      // Prueba el siguiente bundle de SoundCloud.
    }
  }

  throw new Error("No se pudo obtener el client_id de SoundCloud.");
}

async function resolveTrack(query: string, clientId: string): Promise<any> {
  let url = query;
  if (!query.includes("soundcloud.com/")) {
    const searchUrl = new URL("https://api-v2.soundcloud.com/search/tracks");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("client_id", clientId);
    searchUrl.searchParams.set("limit", "1");
    const searchData = await requestJson(searchUrl);
    const result = searchData.collection?.[0];
    if (!result)
      throw new Error("No se encontraron resultados para tu búsqueda.");
    url = result.permalink_url || result.uri;
  }

  const resolveUrl = new URL("https://api-v2.soundcloud.com/resolve");
  resolveUrl.searchParams.set("url", url);
  resolveUrl.searchParams.set("client_id", clientId);
  const track = await requestJson(resolveUrl);
  if (!track || track.kind !== "track")
    throw new Error("No se encontró un track válido.");
  return track;
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(Number(milliseconds || 0) / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

function formatNumber(value: unknown): string {
  return Number(value || 0).toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export default {
  name: ["scplay", "scdl", "sc", "soundcloud"],
  description: "Descarga canciones de SoundCloud.",
  category: "download",

  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ❌ ${fytBold("FALTA BÚSQUEDA")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Indica un enlace o nombre de SoundCloud.\n\n╰〔 ⚡ SYSTEM 〕⬣`,
      });
    }

    await react("🎵");
    try {
      let clientId = await getClientId();
      let track: any;
      try {
        track = await resolveTrack(query, clientId);
      } catch (error: any) {
        if (error?.statusCode !== 401) throw error;
        cachedClientId = null;
        cachedAt = 0;
        clientId = await getClientId();
        track = await resolveTrack(query, clientId);
      }
      const transcoding = track.media?.transcodings?.find(
        (item: any) =>
          item.format?.mime_type === "audio/mpeg" &&
          item.format?.protocol === "progressive",
      );
      if (!transcoding)
        throw new Error("Este track no tiene un stream MP3 descargable.");

      const streamUrl = new URL(transcoding.url);
      streamUrl.searchParams.set("client_id", clientId);
      const safeTitle =
        String(track.title || "soundcloud")
          .replace(/[<>:"/\\|?*]/g, "")
          .slice(0, 100) || "soundcloud";
      const streamData = await requestJson(streamUrl, 30000);
      const audioUrl = streamData?.url;
      if (!audioUrl)
        throw new Error("SoundCloud no devolvió una URL de audio válida.");

      let caption = `╭〔 ${fytBold("SOUNDCLOUD PLAY")} 〕━⬣\n\n`;
      caption += `┃ ➥ ${fytBold(track.title || "Sin título")}\n\n`;
      caption += `┣━━━━━━━━━━━━⬣\n`;
      caption += `┃ > ${fytBold("Artista")} › ${track.user?.username || "N/A"}\n`;
      caption += `┃ > ${fytBold("Duración")} › ${formatDuration(track.duration)}\n`;
      caption += `┃ > ${fytBold("Vistas")} › ${formatNumber(track.playback_count)}\n`;
      caption += `┃ > ${fytBold("Likes")} › ${formatNumber(track.likes_count)}\n`;
      caption += `┃ > ${fytBold("Tipo")} › Audio MP3\n`;
      caption += `┃ > ${fytBold("URL")} › ${track.permalink_url || query}\n`;
      caption += `┣━━━━━━━━━━━━⬣\n┃ ✅ Audio listo.\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;

      const thumbnail = track.artwork_url?.replace("large", "t500x500");
      if (thumbnail) await reply({ image: { url: thumbnail }, caption });
      else await reply({ text: caption });

      await reply({
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${safeTitle}.mp3`,
      });
      await react("✅");
    } catch (error: any) {
      await react("❌");
      await reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar el audio."}`,
      });
    }
  },
};
