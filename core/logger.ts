import chalk from "chalk";

export type CmdLogInput = {
  numeroReal?: string | null;
  rango?: string | null;
  commandName?: string | null;
  isGroup?: boolean;
  text?: string | null;
  jidRemitente?: string | null;
  pushName?: string | null;
  groupMetadata?: {
    subject?: string | null;
  } | null;
  prefix?: string | null;
  sock?: {
    isSubBot?: boolean;
    subBotId?: string | number;
  } | null;
};

export async function displayBanner() {
  console.clear();
  const banner = `
    \t${chalk.hex("#e9d5ff").bold("  █████╗ ██╗   ██╗██████╗  █████╗ ")}
    \t${chalk.hex("#c084fc").bold(" ██╔══██╗██║   ██║██╔══██╗██╔══██╗")}
    \t${chalk.hex("#a855f7").bold(" ███████║██║   ██║██████╔╝███████║")}
    \t${chalk.hex("#8b5cf6").bold(" ██╔══██║██║   ██║██╔══██╗██╔══██║")}
    \t${chalk.hex("#6d28d9").bold(" ██║  ██║╚██████╔╝██║  ██║██║  ██║")}
    \t${chalk.hex("#4c1d95").bold(" ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝")}
    \t${chalk.hex("#6d28d9").italic("────── Powered By Jeriel B. ──────")}
`;
  console.log(banner);
}

function TimeZone() {
  return new Date().toLocaleString("es-US", { timeZone: "America/Costa_Rica" });
}

export function logInfo(message: string) {
  const timestamp = TimeZone();
  console.log(
    `${chalk.cyan("[INFO]")} ${chalk.gray(timestamp)} ${chalk.white(message)}`,
  );
}

export function alertLog(message: string) {
  const timestamp = TimeZone();
  console.warn(
    `${chalk.yellow("[ALERT]")} ${chalk.gray(timestamp)} ${chalk.white(message)}`,
  );
}

export function errorLog(message: string) {
  const timestamp = TimeZone();
  console.error(
    `${chalk.red("[ERROR]")} ${chalk.gray(timestamp)} ${chalk.white(message)}`,
  );
}

export function textLog(message: string) {
  const timestamp = TimeZone();
  console.log(
    `${chalk.gray("[TEXTO]")} ${chalk.gray(timestamp)} ${chalk.white(message)}`,
  );
}

export function cmdLog({
  numeroReal,
  rango,
  commandName,
  isGroup,
  text,
  jidRemitente,
  pushName,
  groupMetadata,
  sock,
}: CmdLogInput) {
  if (!commandName) return;

  const rawSender = jidRemitente
    ? jidRemitente.split("@")[0]
    : String(numeroReal ?? "");
  const senderNumber = rawSender ? rawSender.split(":")[0] : null;
  const nombreUsuario = pushName || "Usuario";
  const botType = sock?.isSubBot ? `subbot:${sock.subBotId}` : "main";
  const textoMensaje = text ? String(text).trim() : "";
  const grupo = groupMetadata?.subject ? ` | ${groupMetadata.subject}` : "";

  const resumen = [
    "[CMD]",
    botType,
    nombreUsuario,
    rango || "USER",
    isGroup ? "GROUP" : "DM",
    `+${String(senderNumber ?? "desconocido")}`,
    commandName,
    textoMensaje ? `| ${textoMensaje}` : "",
    grupo,
  ]
    .filter(Boolean)
    .join(" ");

  console.log(chalk.cyan(resumen));
}

export function connectionLog(message: string, level: "info" | "warn" | "error" | "alert" = "info") {
  const timestamp = TimeZone();
  const prefixMap = {
    info: chalk.cyan("[INFO]"),
    warn: chalk.yellow("[WARN]"),
    error: chalk.red("[ERROR]"),
    alert: chalk.magenta("[ALERT]"),
  };

  if (level === "info") {
    return;
  }

  console.log(
    `${prefixMap[level]} ${chalk.gray(timestamp)} ${chalk.white(message)}`,
  );
}

export function pairingLog(message: string) {
  const timestamp = TimeZone();
  const menu =
    chalk.blue.bold(`╭──────────── Vinculación de Aura Reed ───────────⬣\n`) +
    chalk.blue.bold(`│ \n`) +
    chalk.blue.bold(`│ Seleccione un método de vinculación:\n`) +
    chalk.blue.bold(`│ \n`) +
    chalk.blue.bold(`│ 1. Código QR (Terminal)\n`) +
    chalk.blue.bold(`│ 2. Código de emparejamiento\n`) +
    chalk.blue.bold(`│ \n`) +
    chalk.blue.bold(`╰─────────────────────────────────────────────────⬣\n`) +
    `${chalk.yellow("[PAIRING]")} ${chalk.gray(timestamp)} ${chalk.white(message)}`;
  console.log(menu);
}