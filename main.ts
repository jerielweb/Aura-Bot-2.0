
import fs from "fs";
import path from "path";
import "./config.ts";
import { connectToWhatsApp } from "./core/conection.ts";
import { loadPlugins, watchPlugins } from "./core/cmdLoader.ts";
import { displayBanner, logInfo, connectionLog } from "./core/logger.ts";

const TMP_DIR = path.resolve("./cache");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
process.env.TMPDIR = TMP_DIR;

for (const file of fs.readdirSync(TMP_DIR)) {
  try {
    fs.unlinkSync(path.join(TMP_DIR, file));
  } catch {}
}

setInterval(() => {
  if (!fs.existsSync(TMP_DIR)) return;
  for (const file of fs.readdirSync(TMP_DIR)) {
    try {
      const filePath = path.join(TMP_DIR, file);
      const stat = fs.statSync(filePath);
      if (Date.now() - stat.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
  if (global.gc) global.gc();
}, 6 * 60 * 60 * 1000);

async function mainBot() {
  await displayBanner();
  logInfo("Inicializando bot principal...");
  await loadPlugins();
  watchPlugins();
  connectionLog("Conectando a WhatsApp...");
  await connectToWhatsApp("main", false);
}

void mainBot();