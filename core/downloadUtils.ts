import { fetch } from "undici";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraReedBot/2.0",
  Accept: "application/json, text/plain, */*",
};

export async function requestJson(url: string, timeout = 30000): Promise<any> {
  const response = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(timeout),
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function downloadBuffer(url: string, timeout = 120000): Promise<Buffer> {
  const response = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(timeout),
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Descarga HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export function safeFileName(value: unknown, fallback: string): string {
  return String(value || fallback).replace(/[<>:"/\\|?*\r\n]/g, "").trim().slice(0, 100) || fallback;
}

export function pickSearchResult(results: unknown, query: string): any | null {
  if (!Array.isArray(results)) return null;

  const terms = String(query || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  return results
    .filter((result: any) => result?.url)
    .map((result: any, index: number) => {
      const searchable = [result.title, result.desc, result.description, result.author?.nickname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
      return { result, index, score };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.result || null;
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
