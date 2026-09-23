import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";

function normalizeNumber(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

function validNumber(value: string): boolean {
  return /^\d{7,15}$/.test(value);
}

function getNumber(msg: any, args: string[]): string {
  const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  return normalizeNumber(args.join("")) || normalizeNumber(mentioned?.split("@")[0]);
}

function formatResult(number: string, response: any): string {
  const result = response?.resultado?.data;
  if (!result || typeof result.isBanned !== "boolean") {
    throw new Error("La API devolvió una respuesta inválida.");
  }

  const status = result.isBanned ? "BANEADO" : "NO BANEADO";
  const icon = result.isBanned ? "🔴" : "🟢";
  const violation = result.violation_info?.description || "No especificada";
  const duration = result.violation_info?.duration || "No especificada";
  const risk = result.violation_info?.risk || "No especificado";
  const details = result.status_message || "Sin detalles adicionales";

  return [
    `╭〔 ${icon} ${fytBold("CHECK BAN")} 〕⬣`,
    `┃ 📱 ${fytBold("Número")} › ${number}`,
    `┃ 📌 ${fytBold("Estado")} › ${status}`,
    `┃ ⏱️ ${fytBold("Tipo")} › ${result.isPermanent ? "Permanente" : "Temporal o no confirmado"}`,
    `┃ ⚠️ ${fytBold("Motivo")} › ${violation}`,
    `┃ ⌛ ${fytBold("Duración")} › ${duration}`,
    `┃ 📊 ${fytBold("Riesgo")} › ${risk}`,
    `┃ 💬 ${fytBold("Detalles")} › ${details}`,
    `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`,
  ].join("\n");
}

export default {
  name: ["checkban", "checknum"],
  category: "utils",
  description: "Verifica si un número de WhatsApp está baneado.",
  async run({ msg, args, usedPrefix, reply, react }: any) {
    const number = getNumber(msg, args);
    if (!validNumber(number)) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("CHECK BAN")} 〕⬣\n┃ ❌ ${fytBold("NÚMERO INVÁLIDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Usa un número con código de país.\n┃ > Ejemplo: ${usedPrefix || "."}checkban 525530797879`,
      });
    }

    await react("🔎");
    try {
      const base = DL_CONFIG.lempi.BASE_URL.replace(/\/+$/, "");
      const url = `${base}/tools/wabancheck?lang=es&apikey=${encodeURIComponent(DL_CONFIG.lempi.API_KEY || "")}&number=${number}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: any = await response.json();
      await react(data?.resultado?.data?.isBanned ? "🔴" : "✅");
      return reply({ text: formatResult(number, data) });
    } catch (error: any) {
      console.error("[checkban] Error:", error?.message || error);
      await react("❌");
      return reply({ text: `❌ No se pudo consultar el estado de ${number}. Intenta nuevamente más tarde.` });
    }
  },
};
