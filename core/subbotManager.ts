import { connectToWhatsApp, type ConnectionOptions } from "./conection.ts";
import { db } from "../dbController/db.ts";

type LinkRequest = {
  requester: string;
  method: "qr" | "code";
  phoneNumber?: string;
  onQr?: (qr: string) => Promise<void> | void;
  onPairingCode?: (code: string) => Promise<void> | void;
  onConnected?: () => Promise<void> | void;
  onPairingError?: (error: Error) => Promise<void> | void;
  onPairingExpired?: () => Promise<void> | void;
};

const activeSubBots = new Map<string, any>();

function normalizePhone(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

function sessionNameFor(requester: string): string {
  return `sub-${String(requester).split("@")[0].replace(/\D/g, "") || "bot"}`;
}

export function getActiveSubBots() {
  return [...activeSubBots.values()];
}

export function forgetActiveSubBot(sessionName: string) {
  activeSubBots.delete(sessionName);
}

export async function requestSubBotLink(request: LinkRequest) {
  const storedUser = db.getUser(request.requester);
  const storedPhone = normalizePhone(storedUser?.phone_number);
  const manualPhone = normalizePhone(request.phoneNumber);

  if (request.method === "code" && !storedPhone && !manualPhone) {
    throw new Error(
      "No tienes un teléfono guardado. Usa .code <número con código de país>.",
    );
  }

  const sessionName = sessionNameFor(request.requester);
  if (activeSubBots.has(sessionName)) {
    throw new Error(
      "Ya hay una vinculación de subbot en curso para este usuario.",
    );
  }

  const options: ConnectionOptions = {
    pairingMethod: request.method,
    allowPairing: true,
    pairingPhone: storedPhone || manualPhone,
    pairingTimeoutMs: 60_000,
    onQr: request.onQr,
    onPairingCode: request.onPairingCode,
    onConnected: request.onConnected,
    onPairingError: async (error) => {
      activeSubBots.delete(sessionName);
      db.deleteBot(sessionName);
      await request.onPairingError?.(error);
    },
    onPairingExpired: () => {
      activeSubBots.delete(sessionName);
      db.deleteBot(sessionName);
      return request.onPairingExpired?.();
    },
  };

  const connection = await connectToWhatsApp(sessionName, true, options);
  if (connection) activeSubBots.set(sessionName, connection);

  return sessionName;
}

export async function startSavedSubBots() {
  for (const bot of db.getAllBots() as Array<any>) {
    if (String(bot.jid || "").startsWith("sub-")) {
      db.deleteBot(bot.jid);
      continue;
    }

    const sessionName = bot.data?.sessionName;
    if (bot.isMain || !sessionName || bot.status !== "active") continue;
    if (activeSubBots.has(sessionName)) continue;

    const connection = await connectToWhatsApp(sessionName, true, {
      allowPairing: false,
    });
    if (connection) activeSubBots.set(sessionName, connection);
  }
}
