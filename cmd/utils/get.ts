import { downloadBuffer, safeFileName } from "../../core/downloadUtils.ts";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_CODE_MESSAGE_SIZE = 12000;
const CODE_EXTENSIONS = new Set(["c", "cpp", "cs", "css", "go", "html", "java", "js", "json", "jsx", "kt", "md", "php", "py", "rb", "rs", "sh", "sql", "ts", "tsx", "txt", "xml", "yaml", "yml"]);

function extensionFromMime(mime: string): string {
  return ({ "application/pdf": "pdf", "application/zip": "zip", "application/json": "json", "text/plain": "txt", "text/html": "html" } as Record<string, string>)[mime] || mime.split("/")[1] || "bin";
}

function mimeFromExtension(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  return ({ avif: "image/avif", gif: "image/gif", jpeg: "image/jpeg", jpg: "image/jpeg", m4a: "audio/mp4", mp3: "audio/mpeg", mp4: "video/mp4", ogg: "audio/ogg", opus: "audio/ogg", png: "image/png", wav: "audio/wav", webm: "video/webm", webp: "image/webp", zip: "application/zip" } as Record<string, string>)[ext || ""] || "application/octet-stream";
}

function fileNameFromResponse(url: string, disposition: string | null, extension: string): string {
  const headerName = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)?.[1];
  if (headerName) return safeFileName(decodeURIComponent(headerName), `archivo.${extension}`);
  try {
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    if (name.includes(".")) return safeFileName(name, `archivo.${extension}`);
  } catch {
    return `archivo.${extension}`;
  }
  return `archivo.${extension}`;
}

function isCode(mime: string, name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase();
  return (mime.startsWith("text/") && mime !== "text/html") || mime.includes("json") || mime.includes("javascript") || mime.includes("xml") || CODE_EXTENSIONS.has(ext || "");
}

export default {
  name: ["get", "fetch", "download"],
  category: "utils",
  description: "Descarga y envía contenido desde una URL.",
  async run({ args, reply, react }: any) {
    const url = args.join(" ").trim();
    if (!/^https?:\/\//i.test(url)) return reply({ text: "❌ Proporciona una URL válida. Ejemplo: .get https://sitio.com/archivo" });
    await react("⬇️");
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { "User-Agent": "Mozilla/5.0 AuraReedBot" } });
      const length = Number(response.headers.get("content-length") || 0);
      if (!response.ok || length > MAX_FILE_SIZE) throw new Error("No se pudo descargar el archivo o supera 50 MB.");
      const buffer = await downloadBuffer(url, 60000);
      if (buffer.length > MAX_FILE_SIZE) throw new Error("El archivo supera 50 MB.");
      const headerMime = (response.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
      const fileName = fileNameFromResponse(url, response.headers.get("content-disposition"), extensionFromMime(headerMime));
      const mimeType = headerMime && headerMime !== "application/octet-stream" ? headerMime : mimeFromExtension(fileName);
      let payload: any;
      if (isCode(mimeType, fileName) && buffer.length <= MAX_CODE_MESSAGE_SIZE) {
        payload = { text: `*${fileName}*\n\n\`\`\`\n${buffer.toString("utf8")}\n\`\`\`` };
      } else if (mimeType.startsWith("image/") && mimeType !== "image/gif") payload = { image: buffer, mimetype: mimeType, caption: fileName };
      else if (mimeType.startsWith("video/")) payload = { video: buffer, mimetype: mimeType, fileName };
      else if (mimeType.startsWith("audio/")) payload = { audio: buffer, mimetype: mimeType, fileName };
      else payload = { document: buffer, mimetype: mimeType, fileName };
      await reply(payload);
      await react("✅");
    } catch (error: any) {
      console.error("[get] Error:", error?.message || error);
      await react("❌");
      return reply({ text: `❌ No se pudo descargar el contenido: ${error?.message || "respuesta inválida"}` });
    }
  },
};
