import makeWASocket, {
  DisconnectReason,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
import readline from "readline";
import qrcodeTerminal from "qrcode-terminal";
import { Boom } from "@hapi/boom";
import { handleMessage } from "../handler.ts";
import { getPlugins } from "./cmdLoader.ts";
import { connectionLog, pairingLog } from "./logger.ts";

export const logger = pino({ level: "silent" });

const MAX_MAIN_RECONNECT_ATTEMPTS = 2;
let reconnectTimer: NodeJS.Timeout | null = null;
let isPairingChoiceMade = false;
let chosenPairingCode = false;
let chosenPhoneNumber = "";
let mainConnectionInProgress = false;
let mainReconnectAttempts = 0;

function resetMainReconnectAttempts() {
  mainReconnectAttempts = 0;
}

function registerMainReconnectAttempt() {
  mainReconnectAttempts += 1;
  return mainReconnectAttempts;
}

function scheduleMainReconnect(delayMs: number, sessionName: string, isSubBot: boolean) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectToWhatsApp(sessionName, isSubBot);
  }, delayMs);
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function connectToWhatsApp(sessionName: string, isSubBot: boolean = false) {
  if (mainConnectionInProgress) {
    return;
  }

  mainConnectionInProgress = true;

  let authState;

  try {
    const baseSessionDir = isSubBot
      ? (globalThis.subBotSession ?? "./sessions/subs")
      : (globalThis.mainBotSession ?? "./sessions");

    const sessionDir = path.join(baseSessionDir, sessionName);

    if (!fs.existsSync(sessionDir)) {
      await mkdir(sessionDir, { recursive: true });
    }

    authState = await useMultiFileAuthState(sessionDir);
  } catch (error) {
    mainConnectionInProgress = false;
    throw error;
  }

  const { state, saveCreds, close: closeAuthState } = authState;
  mainConnectionInProgress = false;

  const isRegistered = Boolean(state.creds && (state.creds.registered || state.creds.me));

  if (!isRegistered && !isPairingChoiceMade) {
    pairingLog("Selecciona el método de vinculación:");
    const option = await askQuestion("Seleccione una opción (1 o 2): ");
    isPairingChoiceMade = true;

    if (option === "2") {
      chosenPairingCode = true;
      pairingLog("Ingrese el número de teléfono con código de país");
      const num = await askQuestion("Ej: 50612345678: ");
      chosenPhoneNumber = num.replace(/\D/g, "");

      if (!chosenPhoneNumber) {
        chosenPairingCode = false;
        connectionLog("Número inválido. Se usará QR por defecto.");
      }
    }
  }

  let version: [number, number, number] | undefined;
  try {
    const fetched = await fetchLatestWaWebVersion();
    version = fetched.version as [number, number, number];
  } catch {
    connectionLog("No se pudo obtener la versión de WhatsApp Web; usando la interna de Baileys.", "warn");
  }

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    browser: ["Mac OS", "Chrome", "20.0.04"],
    logger,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 15000,
    syncFullHistory: false,
    markOnlineOnConnect: true,
  });

  globalThis.mainSocket = sock;
  sock.ev.on("creds.update", saveCreds);

  if (chosenPairingCode && !isRegistered) {
    void (async () => {
      try {
        pairingLog("Esperando estabilización del socket para generar el código");
        await sock.waitForSocketOpen();
        await new Promise((resolve) => setTimeout(resolve, 5000));

        if (!chosenPhoneNumber) {
          connectionLog("Falta el número telefónico para la solicitud de emparejamiento.", "warn");
          return;
        }

        pairingLog(`Solicitando código para: ${chosenPhoneNumber}`);
        let code = await sock.requestPairingCode(chosenPhoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;

        console.log(
          "\n" +
            "╭──────────────────────────────────────────╮\n" +
            "│ 🔑 CÓDIGO DE VINCULACIÓN PRINCIPAL:      │\n" +
            "│                                          │\n" +
            `│        ${code?.toUpperCase() ?? ""}        │\n` +
            "│                                          │\n" +
            "╰──────────────────────────────────────────╯\n",
        );
      } catch (err) {
        connectionLog(`Error al solicitar el código de emparejamiento: ${String(err)}`, "error");
      }
    })();
  }

  sock.ev.on("connection.update", async (u) => {
    if (u.qr && !chosenPairingCode) {
      connectionLog("Escanea este código QR con WhatsApp para vincular al bot.", "alert");
      qrcodeTerminal.generate(u.qr, { small: true });
    }

    if (u.connection === "open") {
      const mainNum = sock.user?.id ?? "desconocido";
      resetMainReconnectAttempts();
      connectionLog(`WhatsApp conectado correctamente. JID: ${mainNum}`, "alert");
      return;
    }

    if (u.connection !== "close") {
      return;
    }

    try {
      (sock.ev as any).removeAllListeners();
    } catch (error) {
      connectionLog(`Error al remover oyentes del socket: ${String(error)}`, "error");
    }

    const error = u.lastDisconnect?.error as any;
    const boomError = error ? new Boom(error) : null;
    const statusCode =
      boomError?.output?.statusCode ??
      error?.output?.statusCode ??
      error?.statusCode ??
      0;
    const errorMessage = error?.message || "Error desconocido";

    try {
      closeAuthState();
    } catch (closeError) {
      connectionLog(`Error al cerrar sesión: ${String(closeError)}`, "error");
    }

    connectionLog(`Conexión cerrada. Código: ${String(statusCode || "N/A")}. Motivo: ${errorMessage}`, statusCode === 0 ? "warn" : "error");

    const currentIsRegistered = Boolean(state.creds && (state.creds.registered || state.creds.me));
    const isNotRegistered = !currentIsRegistered;

    const transientDisconnectCodes = [
      DisconnectReason.connectionLost,
      DisconnectReason.connectionClosed,
      DisconnectReason.timedOut,
      DisconnectReason.restartRequired,
      DisconnectReason.connectionReplaced,
    ];

    const shouldResetSession = [
      DisconnectReason.loggedOut,
      DisconnectReason.badSession,
      DisconnectReason.forbidden,
      DisconnectReason.multideviceMismatch,
    ].includes(statusCode) || isNotRegistered;

    const isTransientDisconnect = transientDisconnectCodes.includes(statusCode) && !isNotRegistered;

    if (isTransientDisconnect) {
      const retryCount = registerMainReconnectAttempt();
      const delayMs = Math.min(5000 * retryCount, 20000);
      connectionLog(`Desconexión temporal detectada. Reintentando sin borrar la sesión actual...`, "warn");
      scheduleMainReconnect(delayMs, sessionName, isSubBot);
      return;
    }

    if (shouldResetSession) {
      if (isNotRegistered) {
        connectionLog("La vinculación fue interrumpida, expiró o la IP está bloqueada.", "alert");
      } else {
        connectionLog("La sesión no es válida o fue desvinculada por WhatsApp.", "alert");
      }

      connectionLog("Limpiando credenciales y reiniciando el proceso de vinculación...", "warn");
      const authFolder = path.join(globalThis.mainBotSession ?? "./sessions", sessionName);
      if (fs.existsSync(authFolder)) {
        try {
          fs.rmSync(authFolder, { recursive: true, force: true });
        } catch (error) {
          connectionLog(`Error al limpiar credenciales: ${String(error)}`, "error");
        }
      }

      isPairingChoiceMade = false;
      chosenPairingCode = false;
      chosenPhoneNumber = "";

      connectionLog("Iniciando nuevo proceso de vinculación en 3 segundos...", "warn");
      scheduleMainReconnect(3000, sessionName, isSubBot);
      return;
    }

    const retryCount = registerMainReconnectAttempt();
    if (retryCount >= MAX_MAIN_RECONNECT_ATTEMPTS) {
      connectionLog(`Se alcanzó el máximo de reintentos. Reiniciando emparejamiento...`, "alert");
      const authFolder = path.join(globalThis.mainBotSession ?? "./sessions", sessionName);
      if (fs.existsSync(authFolder)) {
        try {
          fs.rmSync(authFolder, { recursive: true, force: true });
        } catch (error) {
          connectionLog(`Error al limpiar la sesión principal: ${String(error)}`, "error");
        }
      }

      isPairingChoiceMade = false;
      chosenPairingCode = false;
      chosenPhoneNumber = "";
      resetMainReconnectAttempts();
      return;
    }

    connectionLog(`Conexión interrumpida. Reconectando en 5 segundos... intento ${retryCount}/${MAX_MAIN_RECONNECT_ATTEMPTS}`, "warn");
    scheduleMainReconnect(5000, sessionName, isSubBot);
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (!Array.isArray(messages) || messages.length === 0) return;

    for (const msg of messages) {
      if (!msg) continue;

      try {
        await handleMessage(sock, msg, "MAIN", sock.user?.id ?? null, [], {
          config: {
            prefix: globalThis.DEFAULT_PREFIXES ?? ["."],
          },
          getPlugins: () => getPlugins(),
          logger: {
            message: () => {},
            warn: (payload: any) => connectionLog(String(payload), "warn"),
            error: (payload: any) => connectionLog(String(payload), "error"),
            cmdExec: () => {},
          },
        });
      } catch (error) {
        connectionLog(`Error al procesar mensaje: ${String(error)}`, "error");
      }

      if (type === "notify" && msg.message) {
        const body =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          "";

        if (body && !msg.key?.fromMe) {
          connectionLog(`Mensaje recibido: ${body}`, "alert");
        }
      }
    }
  });

  return sock;
}