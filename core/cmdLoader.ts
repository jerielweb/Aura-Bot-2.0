import { readdirSync, watch, existsSync, statSync, type Dirent } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { logInfo, alertLog, errorLog } from "./logger.ts";

const plugins = new Map<string, any>();
const PLUGINS_DIR = path.resolve("./cmd");
const watchTimers = new Map<string, NodeJS.Timeout>();

function toFileName(value: string | Buffer | undefined | null): string {
  if (!value) return "";
  return typeof value === "string" ? value : value.toString();
}

function normalizePlugin(plugin: any) {
  if (!plugin || typeof plugin !== "object") return null;

  if (!plugin.name) return null;
  if (!plugin.run && typeof plugin.execute === "function") {
    plugin.run = plugin.execute.bind(plugin);
  }

  if (typeof plugin.run !== "function") return null;

  return plugin;
}

export async function loadPlugins() {
  plugins.clear();
  await loadDir(PLUGINS_DIR);

  const uniquePlugins = new Set(plugins.values());
  logInfo(`Plugins cargados: ${uniquePlugins.size} comandos (${plugins.size} alias)`);
}

async function loadDir(dir: string) {
  let entries: Dirent[] = [];

  try {
    entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
  } catch {
    return;
  }

  const tasks: Promise<void>[] = [];

  for (const entry of entries) {
    const entryName = toFileName(entry.name);
    const fullPath = path.join(dir, entryName);

    if (entry.isDirectory()) {
      tasks.push(loadDir(fullPath));
    } else if (entry.isFile() && entryName.endsWith(".ts")) {
      tasks.push(loadPlugin(fullPath));
    }
  }

  await Promise.all(tasks);
}

async function loadPlugin(filePath: string) {
  try {
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) return;

    const url = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
    const mod = await import(url);
    const plugin = normalizePlugin(mod.default);

    if (!plugin) {
      alertLog(`Plugin sin estructura válida: ${filePath}`);
      return;
    }

    for (const [key, value] of plugins.entries()) {
      if (value === plugin) {
        plugins.delete(key);
      }
    }

    const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name];

    for (const name of names) {
      if (typeof name === "string" && name.trim()) {
        plugins.set(name.toLowerCase(), plugin);
      }
    }
  } catch (error: any) {
    errorLog(`Error cargando plugin ${filePath}: ${error?.message ?? String(error)}`);
  }
}

export function watchPlugins() {
  if (!existsSync(PLUGINS_DIR)) return;

  watch(PLUGINS_DIR, { recursive: true }, (_eventType, filename) => {
    const fileName = toFileName(filename);
    if (!fileName || !fileName.endsWith(".ts")) return;

    const fullPath = path.resolve(PLUGINS_DIR, fileName);

    if (watchTimers.has(fullPath)) {
      const previousTimer = watchTimers.get(fullPath);
      if (previousTimer) clearTimeout(previousTimer);
    }

    const timer = setTimeout(async () => {
      watchTimers.delete(fullPath);

      if (!existsSync(fullPath)) {
        logInfo(`Plugin eliminado del disco: ${fileName}`);
        await loadPlugins();
        return;
      }

      logInfo(`Plugin actualizado detectado: ${fileName}`);
      await loadPlugin(fullPath);
    }, 150);

    watchTimers.set(fullPath, timer);
  });

  logInfo("Hot-reload de plugins activo con soporte anti-duplicados");
}

export function getPlugins() {
  return plugins;
}