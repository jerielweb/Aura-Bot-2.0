import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fytBold } from "../../core/socketText.ts";
import { downloadBuffer, formatCount, pickSearchResult, requestJson, safeFileName } from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";

const execFileAsync = promisify(execFile);
const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
const TIKTOK = /^(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com\//i;

export default {
  name: ["tta", "tka", "ttaudio", "tkmusic", "tiktokaudio"],
  category: "download",
  description: "Descarga audio de TikTok como Audio.",
  async run({ args, reply, react }: any) {
    const query = args.join(" ").trim();
    if (!query) return reply("⚠️ Proporciona una búsqueda o enlace de TikTok.");
    if (!ffmpegPath) return reply("❌ FFmpeg no está disponible.");
    const dir = process.env.TMPDIR || "./cache";
    const id = randomUUID();
    const input = `${dir}/tta-${id}.mp4`;
    const output = `${dir}/tta-${id}.mp3`;
    await react("⏳");
    try {
      await mkdir(dir, { recursive: true });
      let url = query;
      let searchResult: any = null;
      if (!TIKTOK.test(query)) {
        const search = await requestJson(`${API}/search/tiktok?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`);
        searchResult = pickSearchResult(search?.data, query);
        url = searchResult?.url || "";
      }
      if (!url) throw new Error("No se encontró ningún resultado para tu búsqueda.");
      const data = await requestJson(`${API}/dl/tiktokv2?url=${encodeURIComponent(url)}&key=${DL_CONFIG.alya.API_KEY}`, 60000);
      const video = (data?.data || []).find((item: any) => item?.url)?.url;
      if (!data?.status || !video) throw new Error("No se encontró audio descargable.");
      await writeFile(input, await downloadBuffer(video, 120000));
      await execFileAsync(ffmpegPath, ["-y", "-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", "320k", output], { timeout: 120000 });
      const title = data.title || "Audio de TikTok";
      const author = data.author?.nickname || data.author?.fullname || searchResult?.author?.nickname || "Desconocido";
      const caption = `╭〔 🎵 ${fytBold("TIKTOK AUDIO")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Autor")} › ${author}\n┃ > ${fytBold("Vistas")} › ${formatCount(data.stats?.views || data.play_count || searchResult?.views)}\n┃ > ${fytBold("Likes")} › ${formatCount(data.stats?.likes || data.digg_count || searchResult?.likes)}\n┃ > ${fytBold("Comentarios")} › ${formatCount(data.stats?.comment || data.comment_count || searchResult?.comments)}\n┃ > ${fytBold("Tipo")} › Audio MP3\n┃ > ${fytBold("Url")} › ${url}\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando audio...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      await reply({ text: caption });
      await reply({ audio: await readFile(output), mimetype: "audio/mpeg", fileName: `${safeFileName(title, "tiktok")}.mp3` });
      await react("✅");
    } catch (error: any) { await react("❌"); return reply({ text: `❌ Error: ${error?.message || "No se pudo convertir el audio."}` }); }
    finally { await unlink(input).catch(() => undefined); await unlink(output).catch(() => undefined); }
  },
};
