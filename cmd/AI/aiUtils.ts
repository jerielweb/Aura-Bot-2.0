import { DL_CONFIG } from "../../config.ts";
import { requestJson } from "../../core/downloadUtils.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");

export function getPrompt(args: unknown): string {
  return Array.isArray(args) ? args.join(" ").trim() : String(args || "").trim();
}

export function extractText(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (typeof data !== "object") return null;

  const fields = ["result", "text", "response", "message", "reply", "answer"];
  for (const field of fields) {
    if (typeof data[field] === "string" && data[field].trim()) {
      return data[field].trim();
    }
  }

  if (data.data && typeof data.data === "object") {
    return extractText(data.data);
  }
  if (typeof data.data === "string" && data.data.trim()) {
    return data.data.trim();
  }
  return null;
}

export async function askAlya(path: string, prompt: string): Promise<string> {
  const url = `${API}${path}?text=${encodeURIComponent(prompt)}&key=${DL_CONFIG.alya.API_KEY}`;
  const response = await requestJson(url, 20000);
  const text = extractText(response);
  if (!text) throw new Error("La API no devolvió una respuesta válida.");
  return text;
}

export function aiError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
