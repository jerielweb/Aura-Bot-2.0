import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fetch } from "undici";

const execFileAsync = promisify(execFile);
const MAX_INPUT_BYTES = 60 * 1024 * 1024;

async function prepareClip(buffer: Buffer): Promise<Buffer> {
  if (!ffmpegPath) return buffer;
  const dir = path.resolve("./cache/shazam");
  const id = randomUUID();
  const input = path.join(dir, `${id}.input`);
  const output = path.join(dir, `${id}.mp3`);
  await mkdir(dir, { recursive: true });
  try {
    await writeFile(input, buffer);
    await execFileAsync(ffmpegPath, ["-y", "-i", input, "-t", "60", "-vn", "-c:a", "libmp3lame", "-ar", "44100", "-ac", "2", "-b:a", "128k", output], { timeout: 120000 });
    return await readFile(output);
  } catch {
    return buffer;
  } finally {
    await unlink(input).catch(() => undefined);
    await unlink(output).catch(() => undefined);
  }
}

export async function identifySong(buffer: Buffer): Promise<Record<string, string>> {
  if (!Buffer.isBuffer(buffer)) throw new Error("Se esperaba un Buffer");
  if (buffer.length > MAX_INPUT_BYTES) throw new Error("El archivo es demasiado grande");
  const clip = await prepareClip(buffer);
  const form = new FormData();
  form.append("files[]", new Blob([clip], { type: "audio/mpeg" }), `${randomUUID()}.mp3`);
  const upload = await fetch("https://uguu.se/upload", { method: "POST", body: form as any });
  const uploadData: any = await upload.json();
  const url = uploadData?.files?.[0]?.url;
  if (!url) throw new Error("No se pudo subir el audio para identificarlo.");
  const response = await fetch("https://songfinder.gg/api/recognize/url", { method: "POST", headers: { "content-type": "application/json", origin: "https://songfinder.gg", referer: "https://songfinder.gg/" }, body: JSON.stringify({ url, startTime: 0, recaptchaToken: randomUUID() }) });
  const data: any = await response.json();
  if (!response.ok || !data?.success || !data?.track) throw new Error(data?.message || "No se encontró coincidencia");
  return data.track;
}
