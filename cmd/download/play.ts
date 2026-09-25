import { request } from "undici";
import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
} from "@whiskeysockets/baileys";
import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { createLinkPreviewWithoutChannel } from "../../core/LinkPreview.ts";
import { downloadBuffer } from "../../core/downloadUtils.ts";

const API_KEY = DL_CONFIG.alya.API_KEY;
const BASE_URL = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");

function getYouTubeVideoId(value: string): string | null {
  const rawUrl = String(value || "").trim();
  if (!rawUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(
      /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`,
    );
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (
    !["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(
      hostname,
    )
  )
    return null;

  let videoId = "";
  if (hostname === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
  } else if (parsed.pathname === "/watch") {
    videoId = parsed.searchParams.get("v") || "";
  } else {
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (["embed", "v", "shorts", "live"].includes(parts[0] || "")) {
      videoId = parts[1] || "";
    }
  }

  return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
}

function isYouTubeUrl(value: string): boolean {
  return /^(?:https?:\/\/)?(?:www\.)?(?:m\.|music\.)?(?:youtube\.com|youtu\.be)\//i.test(
    value.trim(),
  );
}

async function queryYouTubeAudio(query: string): Promise<any> {
  const queryUrl = `${BASE_URL}/search/yt?query=${encodeURIComponent(query)}&key=${API_KEY}`;

  const response = await request(queryUrl, {
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "AuraReedBot/2.0" },
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`La búsqueda respondió HTTP ${response.statusCode}.`);
  }

  const data: any = await response.body.json();
  if (
    data?.status !== true ||
    !Array.isArray(data.result) ||
    !data.result.length
  ) {
    throw new Error("No se encontraron resultados en YouTube.");
  }

  return data.result[0];
}

async function downloadYouTubeAudio(url: string): Promise<any> {
  const downloadUrl = `${BASE_URL}/dl/ytmp3v2?url=${encodeURIComponent(url)}&key=${API_KEY}`;
  const response = await request(downloadUrl, {
    signal: AbortSignal.timeout(30000),
    headers: { "User-Agent": "AuraReedBot/2.0" },
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`La descarga respondió HTTP ${response.statusCode}.`);
  }

  const data: any = await response.body.json();
  if (data?.status !== true || !data.data?.dl) {
    throw new Error("La API no devolvió un audio descargable.");
  }

  return data.data;
}

function fomatViewers(valor) {
  if (valor === null || valor === undefined) return "0";

  const raw = String(valor).trim();
  const normalized = raw.replace(/[,.]/g, "");
  const numero = Number(normalized);

  if (!raw) return "0";
  if (/^[\d,.]+[kKmMbBtT]$/.test(raw)) {
    return raw.replace(/[,.]/g, "").toUpperCase();
  }
  if (!Number.isFinite(numero)) return raw;
  if (numero >= 1e12) {
    return `${(numero / 1e12).toFixed(1)}T`;
  }
  if (numero >= 1e9) {
    return `${(numero / 1e9).toFixed(1)}B`;
  }
  if (numero >= 1e6) {
    return `${(numero / 1e6).toFixed(1)}M`;
  }
  if (numero >= 1e3) {
    return `${(numero / 1e3).toFixed(1)}K`;
  }
  return numero.toString();
}

export default {
  name: ["play", "ytmp3", "ytaudio", "playaudio", "playmp3", "ytmusic", "yta"],
  description: "Busca y descarga audio de YouTube.",
  category: "download",
  async run({ args, reply, react, sock, from, msg, sender }: any) {
    const query = args.join(" ").trim();
    if (!query)
      return reply(
        "⚠️ Escribe el nombre de una canción o pega un enlace de YouTube.",
      );

    await react("🎵");
    try {
      let result: any = {};
      let finalUrl = query;

      if (!isYouTubeUrl(query)) {
        result = await queryYouTubeAudio(query);
        finalUrl = result.url;
      } else {
        const videoId = getYouTubeVideoId(query);
        if (!videoId) throw new Error("URL de YouTube no válida.");
        finalUrl = `https://youtu.be/${videoId}`;
      }

      const audio = await downloadYouTubeAudio(finalUrl);
      const title = String(audio.title || result.title || "audio").trim();
      const author = audio.author || result.autor || "Desconocido";
      const duration = audio.duration || result.duration || "??";
      const views = result.views || "0";
      const quality = audio.quality || "128k";
      const videoId = String(
        audio.videoId || getYouTubeVideoId(finalUrl) || "",
      ).trim();
      const youtubeUrl = videoId
        ? `https://youtu.be/${videoId}`
        : result.url || finalUrl;
      let caption = `╭〔 🎵 ${fytBold("YOUTUBE PLAY")} 〕━⬣\n\n`;
      caption += `┃ ➥ ${fytBold(title)}\n\n`;
      caption += `┣━━━━━━━━━━━━⬣\n`;
      caption += `┃ > ${fytBold("Canal")} › ${author}\n`;
      caption += `┃ > ${fytBold("Duración")} › ${duration}\n`;
      caption += `┃ > ${fytBold("Vistas")} › ${fomatViewers(views)}\n`;
      caption += `┃ > ${fytBold("Calidad")} › ${quality}\n`;
      caption += `┃ > ${fytBold("Url")} › ${youtubeUrl}\n`;
      caption += `┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando audio...\n`;
      caption += `╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;

      const thumbnail = videoId
        ? audio.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : audio.thumbnail || result.banner;
      if (thumbnail) {
        const thumbnailBuffer = await downloadBuffer(thumbnail, 30000);
        const prepared = await prepareWAMessageMedia(
          { image: thumbnailBuffer },
          {
            upload: sock.waUploadToServer,
            mediaTypeOverride: "thumbnail-link",
          },
        );
        const preview = createLinkPreviewWithoutChannel({
          textOriginal: caption,
          link: youtubeUrl,
          author,
          title,
          banner: prepared.imageMessage,
          mentionedJid: [sender],
          isForwarded: false,
          forwardingScore: 0,
        });
        const previewMessage = generateWAMessageFromContent(
          from,
          preview,
          { quoted: msg, userJid: sock.user?.id },
        );
        await sock.relayMessage(from, previewMessage.message, {
          messageId: previewMessage.key.id,
        });
      } else {
        await reply({ text: caption });
      }
      await react("✅");

      return reply({
        audio: { url: audio.dl },
        mimetype: "audio/mpeg",
        fileName: `${title.replace(/[<>:"/\\|?*]/g, "").slice(0, 100) || "youtube"}.mp3`,
      });
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `❌ Error: ${error?.message || "No se pudo descargar el audio."}`,
      });
    }
  },
};
