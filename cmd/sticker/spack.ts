import { crc32 } from "node:zlib";
import sharp from "sharp";
import {
  MEDIA_PATH_MAP,
  MEDIA_HKDF_KEY_MAPPING,
  encryptedStream,
  generateWAMessageFromContent,
  generateMessageIDV2,
  unixTimestampSeconds,
  sha256,
  proto,
} from "@whiskeysockets/baileys";
import { fytBold } from "../../core/socketText.ts";
import { DL_CONFIG } from "../../config.ts";
import { readFile } from "node:fs/promises";
import { downloadToCache, requestJson } from "../../core/downloadUtils.ts";
import {
  imageToWebp,
  isWebp,
  isAnimatedWebp,
} from "../../core/stickerUtils.ts";

// Configuración de endpoints MMS nativos de WhatsApp (igual que spack.js)
MEDIA_PATH_MAP["sticker-pack"] = "/mms/document";
MEDIA_HKDF_KEY_MAPPING["sticker-pack"] = "Sticker Pack";

function makeZip(files: Record<string, Buffer>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, data] of Object.entries(files)) {
    const n = Buffer.from(name, "utf8");
    const crc = crc32(data) as unknown as number;
    const local = Buffer.alloc(30 + n.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(n.length, 26);
    n.copy(local, 30);
    locals.push(local, data);

    const central = Buffer.alloc(46 + n.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(offset, 42);
    n.copy(central, 46);
    centrals.push(central);

    offset += local.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centrals.length, 8);
  end.writeUInt16LE(centrals.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

async function sendStickerPack(
  sock: any,
  remoteJid: string,
  { name, publisher, description, stickers, cover, quoted }: any,
) {
  if (!stickers.length) throw new Error("Pack vacío.");
  if (stickers.length > 60) throw new Error("Máximo 60 stickers por pack.");

  const packId = generateMessageIDV2();
  const files: Record<string, Buffer> = {};

  const meta = stickers.map((s: any) => {
    if (s.sticker.length > 1024 * 1024)
      throw new Error("Un sticker supera 1MB.");
    const fileName =
      sha256(s.sticker).toString("base64").replace(/\//g, "-") + ".webp";
    files[fileName] = s.sticker;
    return {
      fileName,
      mimetype: "image/webp",
      isAnimated: !!s.isAnimated,
      emojis: s.emojis?.length ? s.emojis : ["🎭"],
      accessibilityLabel: "",
    };
  });

  const trayIconFileName = `${packId}.webp`;
  files[trayIconFileName] = cover;

  const zipBuffer = makeZip(files);

  const up = await encryptedStream(zipBuffer, "sticker-pack", {
    logger: sock.logger,
  });
  const { directPath } = await sock.waUploadToServer(up.encFilePath, {
    fileEncSha256B64: up.fileEncSha256.toString("base64"),
    mediaType: "sticker-pack",
  });

  const content = {
    stickerPackMessage: {
      name,
      publisher,
      packDescription: description,
      stickerPackId: packId,
      stickerPackOrigin:
        proto.Message.StickerPackMessage.StickerPackOrigin.THIRD_PARTY,
      stickerPackSize: zipBuffer.length,
      stickers: meta,
      fileSha256: up.fileSha256,
      fileEncSha256: up.fileEncSha256,
      mediaKey: up.mediaKey,
      directPath,
      fileLength: up.fileLength,
      mediaKeyTimestamp: unixTimestampSeconds(),
      trayIconFileName,
    },
  };

  const userJid = sock.user?.id || sock.user?.jid;
  const m = generateWAMessageFromContent(remoteJid, content as any, {
    quoted,
    userJid,
  });
  await sock.relayMessage(remoteJid, m.message, { messageId: m.key.id });
  return m;
}

export default {
  name: ["stickersearch", "buscars", "spack"],
  category: "sticker",
  description:
    "Busca un pack de stickers y lo envía como paquete nativo de WhatsApp.",
  async run({
    sock,
    msg,
    from,
    args,
    db,
    sender,
    usedPrefix,
    react,
    reply,
  }: any) {
    const query = args.join(" ").trim();
    if (!query)
      return reply(
        `⚠️ Usa el comando con un nombre. Ejemplo: ${usedPrefix}spack gatos`,
      );
    await react("⏳");
    try {
      const api = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
      const search = await requestJson(
        `${api}/stickerly/search?query=${encodeURIComponent(query)}&key=${DL_CONFIG.alya.API_KEY}`,
      );
      const packs = (search?.resultados || search?.result || []).filter(
        (pack: any) => pack?.url && !pack.isPaid,
      );
      if (!packs.length) throw new Error("No se encontraron packs gratuitos.");

      const detail = await requestJson(
        `${api}/stickerly/detail?url=${encodeURIComponent(packs[0].url)}&key=${DL_CONFIG.alya.API_KEY}`,
      );
      const packInfo = detail?.detalles || detail;
      const rawStickers = (packInfo?.stickers || []).slice(0, 60);
      if (!rawStickers.length)
        throw new Error("El pack no contiene stickers disponibles.");

      await reply({
        text: `╭〔 📦 ${fytBold("AURA REED")} 〕⬣\n┃ 🏷️ ${fytBold("PROCESANDO PACK")}\n╰━━━━━━━━━━━━⬣\n\n┃ 📌 Pack: ${packInfo?.name || query}\n┃ 🖼️ Stickers: ${rawStickers.length}\n┃ ⏳ Empaquetando como sticker pack nativo...\n╰〔 ⚡ SYSTEM 〕⬣`,
      });

      const results = await Promise.allSettled(
        rawStickers.map(async (sticker: any) => {
          const url = sticker.imageUrl || sticker.url || sticker.image;
          if (!url) throw new Error("Sticker sin url.");
          const buffer = await readFile(await downloadToCache(url));
          const animated =
            Boolean(sticker.isAnimated || sticker.animated) ||
            isAnimatedWebp(buffer);
          const webp = isWebp(buffer)
            ? buffer
            : await imageToWebp(buffer, animated);
          return { sticker: webp, isAnimated: animated, emojis: ["🎭"] };
        }),
      );
      const stickers = results
        .filter(
          (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled",
        )
        .map((r) => r.value);
      if (!stickers.length)
        throw new Error("No se pudo convertir ningún sticker del paquete.");

      const user = db?.getUser?.(sender) || {};
      const packName = String(
        user.stickerPackName || user.data?.stickerPackName || "Aura Reed",
      ).trim();
      const authorName = String(
        user.stickerPackAuthor ||
          user.data?.stickerPackAuthor ||
          msg.pushName ||
          "Aura Reed",
      ).trim();

      const thumbUrl = packInfo?.thumbnailUrl || packInfo?.thumbnail;
      const cover = thumbUrl
        ? await sharp(await readFile(await downloadToCache(thumbUrl)))
            .resize(96, 96, { fit: "cover" })
            .webp({ quality: 80 })
            .toBuffer()
        : await sharp(stickers[0].sticker)
            .resize(96, 96, { fit: "cover" })
            .webp({ quality: 80 })
            .toBuffer();

      await sendStickerPack(sock, from, {
        name: packName,
        publisher: authorName,
        description: `${packInfo?.name || query} • Aura Reed Bot`,
        stickers,
        cover,
        quoted: msg,
      });

      await react("✅");
    } catch (error: any) {
      await react("❌");
      return reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ⚠️ ERROR AL OBTENER PACK\n╰━━━━━━━━━━━━⬣\n\n┃ > ${error?.message || "Intenta nuevamente."}\n╰〔 ⚡ SYSTEM 〕⬣`,
      });
    }
  },
};
