import { createHash, randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fetch } from "undici";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraReedBot/2.0",
  Accept: "application/json, text/plain, */*",
};

export async function requestJson(url: string, timeout = 30000): Promise<any> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(timeout),
        redirect: "follow",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Solicitud fallida.");
}

const CACHE_DIR = path.resolve(process.env.GLOBAL_CUSTOM_TMP || "./cache");

export async function downloadToCache(
  url: string,
  timeout = 180000,
): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const cacheKey = createHash("sha256").update(url).digest("hex").slice(0, 32);
  const filePath = path.join(CACHE_DIR, `download-${cacheKey}.bin`);

  try {
    const cached = await stat(filePath);
    if (cached.size > 0) return filePath;
  } catch {
    // El archivo aún no existe o quedó incompleto.
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const partialPath = path.join(
      CACHE_DIR,
      `.download-${cacheKey}-${process.pid}-${randomBytes(4).toString("hex")}.part`,
    );
    try {
      const response = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(timeout),
        redirect: "follow",
      });
      if (!response.ok) throw new Error(`Descarga HTTP ${response.status}`);
      if (!response.body) throw new Error("La descarga no devolvió contenido.");
      await pipeline(
        Readable.fromWeb(response.body as any),
        createWriteStream(partialPath),
      );
      await rename(partialPath, filePath);
      return filePath;
    } catch (error) {
      lastError = error;
      await rm(partialPath, { force: true }).catch(() => {});
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Descarga fallida.");
}

export function safeFileName(value: unknown, fallback: string): string {
  return (
    String(value || fallback)
      .replace(/[<>:"/\\|?*\r\n]/g, "")
      .trim()
      .slice(0, 100) || fallback
  );
}

export function pickSearchResult(results: unknown, query: string): any | null {
  if (!Array.isArray(results)) return null;

  const terms = String(query || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  return (
    results
      .filter((result: any) => result?.url)
      .map((result: any, index: number) => {
        const searchable = [
          result.title,
          result.desc,
          result.description,
          result.author?.nickname,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const score = terms.reduce(
          (total, term) => total + (searchable.includes(term) ? 1 : 0),
          0,
        );
        return { result, index, score };
      })
      .sort(
        (left, right) => right.score - left.score || left.index - right.index,
      )[0]?.result || null
  );
}

export function formatCount(value: unknown): string {
  if (value === null || value === undefined) return "0";

  const raw = String(value).trim();
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
