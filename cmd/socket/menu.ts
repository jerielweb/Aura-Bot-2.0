import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "@whiskeysockets/baileys";
import { getPlugins } from "../../core/cmdLoader.ts";
import { fytBold } from "../../core/socketText.ts";

const mediaCacheMap = new Map<string, any>();

function getCommandCategories() {
  const dirs = readdirSync(path.resolve("./cmd"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name.toLowerCase());

  const pluginCategories = [...getPlugins().values()]
    .map((plugin) => String(plugin?.category || "general").toLowerCase())
    .filter(Boolean);

  return [...new Set([...dirs, ...pluginCategories])].sort();
}

export default {
  name: ["menu", "help", "h", "menú"],
  description: "Catalogo de Comandos",
  category: "socket",
  ownerOnly: false,
  modOnly: false,
  adminOnly: false,
  premiumOnly: false,
  groupOnly: false,
  privateOnly: false,
  botUserOnly: false,

  async run({ sock, from, msg, args, prefix, usedPrefix, db: runtimeDb }) {
    const activePrefix = prefix ?? usedPrefix ?? globalThis.DEFAULT_PREFIXES?.[0] ?? ".";
    const remoteJid = from;
    const pushName = msg?.pushName || "Usuario";
    const botName = runtimeDb?.getBot?.(sock.user?.id)?.bot_name || "Aura Reed";
    const botType = sock.isSubBot ? "Sub-Bot" : "Principal";
    const tituloEstilizado = fytBold(`${String(botName).toUpperCase()}`);
    const chanellink = "https://aetheryx.xyz/";
    const requested = args && args[0] ? args[0].toLowerCase() : null;
    const AutorBot = globalThis.DEFAULT_BOT_AUTHOR

    const categories = getCommandCategories();
    const categoryAliases: Record<string, string> = {
      ayuda: "system",
      comandos: "system",
      general: "system",
      socket: "socket",
      soporte: "system",
    };

    let requestedCategory: string | null = null;
    if (requested) {
      requestedCategory = categoryAliases[requested] || requested;
    }

    let textoMenu = `╭━━〔 ${tituloEstilizado} 〕━━⬣\n`;
    textoMenu += `┃ > ${fytBold("Usuario:")} ${pushName}\n`;
    textoMenu += `┃ > ${fytBold("Bot:")} ${botType}\n`;
    textoMenu += `┃ > ${fytBold("Version:")} 2.0.0\n`;
    textoMenu += `┃ > ${fytBold("Owner:")} Jeriel B.\n`;
    textoMenu += `┃ > ${fytBold("Prefix:")} [ ${activePrefix} ]\n`;
    textoMenu += `┃ > ${fytBold("Fecha:")} ${new Date().toLocaleDateString("es-CR")}\n`;
    textoMenu += `┃ > ${fytBold("Url:")} ${chanellink}\n`;
    textoMenu += `╰━━━━━━━━━━━━━⬣\n\n`;

    const pluginMap = getPlugins();
    const plugins = [...new Map(
      [...pluginMap.values()].map((plugin) => [plugin, plugin]),
    ).values()].filter((plugin) => plugin && typeof plugin.run === "function");

    const pluginsByCategory = new Map<string, any[]>();
    for (const plugin of plugins) {
      const categoryKey = String(plugin.category || "general").toLowerCase();
      const entry = pluginsByCategory.get(categoryKey) || [];
      entry.push(plugin);
      pluginsByCategory.set(categoryKey, entry);
    }

    const catsToShow = requestedCategory ? [requestedCategory] : categories;

    if (requestedCategory && !categories.includes(requestedCategory)) {
      let textErr = `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n`;
      textErr += `┃ ❌ ${fytBold("CATEGORÍA NO ENCONTRADA")}\n`;
      textErr += `╰━━━━━━━━━━━━⬣\n\n`;
      textErr += `> Categorías disponibles:\n`;
      textErr += `${categories.join("\n")}\n\n`;
      textErr += `╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`;
      return await sock.sendMessage(remoteJid, { text: textErr }, { quoted: msg });
    }

    for (const cat of catsToShow) {
      const group = pluginsByCategory.get(cat) || [];
      if (!group.length) continue;

      textoMenu += `┏━━〔 ${fytBold(String(cat).charAt(0).toUpperCase() + String(cat).slice(1))} 〕━━⬣\n`;

      for (const cmd of group.sort((a, b) => String(a.name?.[0] ?? "").localeCompare(String(b.name?.[0] ?? "")))) {
        const names = Array.isArray(cmd.name) ? cmd.name : [cmd.name];

        for (const alias of names.slice(0, 1)) {
          textoMenu += `┃ ➪ ${fytBold(`${activePrefix}${String(alias)}`)}\n`;
        }

        if (cmd.description) {
          textoMenu += `┃ ✦ ${cmd.description}\n\n`;
        }
      }
    }

    if (!requestedCategory) {
      textoMenu += `┏━━〔 ${fytBold("OTROS COMANDOS")} 〕━━⬣\n`;
      textoMenu += `┃ ➪ ${fytBold(`${activePrefix}menu <categoría>`)}\n`;
      textoMenu += `┃ ✦ Muestra el menú de una categoría específica.\n\n`;
    }

    textoMenu += `╰〔 ⚡ ${fytBold(String(botName).toUpperCase() + " BOT")} 〕⬣`;

    let bannerPath = path.resolve("./assets/img/BotBanner.jpg");
    let isGif = false;

    const customBanner = runtimeDb?.getBot?.(sock.user?.id)?.data?.customBanner ?? runtimeDb?.customBanner ?? null;
    if (customBanner?.path && existsSync(customBanner.path)) {
      bannerPath = customBanner.path;
      isGif = Boolean(customBanner.mimetype?.includes("gif") || bannerPath.endsWith(".gif"));
    }

    let imgBanner: any = mediaCacheMap.get(bannerPath);
    if (!imgBanner && existsSync(bannerPath)) {
      try {
        const mediaType = isGif
          ? { video: readFileSync(bannerPath) }
          : { image: readFileSync(bannerPath) };

        const prepared = await prepareWAMessageMedia(mediaType, {
          upload: sock.waUploadToServer,
          mediaTypeOverride: "thumbnail-link",
        });

        imgBanner = isGif ? prepared.videoMessage : prepared.imageMessage;
        if (imgBanner) mediaCacheMap.set(bannerPath, imgBanner);
      } catch (error) {
        console.error("[menu] Error al preparar media del banner:", error);
      }
    }

    const getTs = (ts: any) =>
      typeof ts === "object" ? Number(ts.low || ts) : Number(ts || 0);

    const content = {
      extendedTextMessage: {
        text: textoMenu,
        matchedText: chanellink,
        canonicalUrl: chanellink,
        description: AutorBot,
        title: `${String(botName).toUpperCase()}`,
        previewType: 1,
        jpegThumbnail: imgBanner?.jpegThumbnail,
        thumbnailDirectPath: imgBanner?.directPath,
        thumbnailSha256: imgBanner?.fileSha256,
        thumbnailEncSha256: imgBanner?.fileEncSha256,
        mediaKey: imgBanner?.mediaKey,
        mediaKeyTimestamp: imgBanner ? getTs(imgBanner.mediaKeyTimestamp) : 0,
        thumbnailHeight: imgBanner?.height || 1080,
        thumbnailWidth: imgBanner?.width || 1920,
        inviteLinkGroupTypeV2: 0,
        contextInfo: {
          mentionedJid: [msg?.key?.participant || remoteJid],
          isForwarded: true,
          forwardingScore: 1,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363424808187278@newsletter",
            newsletterName: "⋆ Aura Reed Channel Official ⋆",
            serverMessageId: -1,
          },
        },
      },
    } as any;

    const waMsg = generateWAMessageFromContent(remoteJid, content, {
      userJid: sock.user?.id,
      quoted: msg,
    });

    await sock.relayMessage(remoteJid, waMsg.message, {
      messageId: waMsg.key.id,
    });
  },
};

