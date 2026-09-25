import { randomBytes } from "node:crypto";
import { fytBold } from "./socketText.ts";
import { getActiveSubBots } from "./subbotManager.ts";

export const REPORT_GROUP_JID = "120363410372126705@g.us";
const REPORT_MARKER = /\[AURA_REPORT:([A-Za-z0-9_-]+)\]/;

export type ReportData = {
  id: string;
  originJid: string;
  senderJid: string;
  botSession: string;
};

export function createReportId(): string {
  return randomBytes(6).toString("hex");
}

export function encodeReportData(data: ReportData): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

export function decodeReportData(text: unknown): ReportData | null {
  const marker = String(text || "").match(REPORT_MARKER)?.[1];
  if (!marker) return null;

  try {
    const data = JSON.parse(Buffer.from(marker, "base64url").toString("utf8"));
    if (!data?.originJid || !data?.senderJid || !data?.id) return null;
    return data as ReportData;
  } catch {
    return null;
  }
}

export function getQuotedText(message: any): string {
  const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return String(
    quoted?.conversation ||
      quoted?.extendedTextMessage?.text ||
      quoted?.imageMessage?.caption ||
      quoted?.videoMessage?.caption ||
      "",
  );
}

export function reportCaption(data: ReportData, reportText: string): string {
  return `╭〔 📢 ${fytBold("NUEVO REPORTE")} 〕━⬣

┃ 🆔 ${fytBold("ID")} › ${data.id}
┃ 👤 ${fytBold("Usuario")} › @${data.senderJid.split("@")[0]}
┃ 📍 ${fytBold("Chat")} › ${data.originJid}
┃ 🤖 ${fytBold("Bot")} › ${data.botSession || "actual"}
┃ 🕒 ${fytBold("Fecha")} › ${new Date().toLocaleString("es-CR")}

┣━━━━━━━━━━━━⬣

┃ 📝 ${fytBold("Mensaje")}
┃ > ${reportText.replace(/\n/g, "\n┃ > ")}

╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣
[AURA_REPORT:${encodeReportData(data)}]`;
}

export function replyCaption(text: string): string {
  return `╭〔 💬 ${fytBold("RESPUESTA DE SOPORTE")} 〕━⬣\n\n┃ > ${text.replace(/\n/g, "\n┃ > ")}\n\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
}

export function getSocketCandidates(current: any): any[] {
  const candidates = [current, globalThis.mainSocket, ...getActiveSubBots()];
  return candidates.filter(
    (socket, index) => socket?.sendMessage && candidates.indexOf(socket) === index,
  );
}

export async function sendWithAvailableBot(
  sockets: any[],
  jid: string,
  content: any,
  options?: any,
): Promise<any> {
  let lastError: unknown;
  for (const socket of sockets) {
    try {
      return await socket.sendMessage(jid, content, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Ningún bot pudo enviar el mensaje.");
}