import crypto from "node:crypto";
import {
  generateWAMessage,
  generateWAMessageFromContent,
  jidNormalizedUser,
} from "@whiskeysockets/baileys";

type AlbumItem = {
  image?: unknown;
  video?: unknown;
  [key: string]: unknown;
};

const ALBUM_DELAY = Number(process.env.ALBUM_ITEM_DELAY_MS || 900);
const MAX_ITEMS = Number(process.env.MAX_ALBUM_ITEMS || 6);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimitError(error: any): boolean {
  const status = error?.status || error?.statusCode || error?.output?.statusCode;
  if (status === 429) return true;

  const text = String(error?.message || error?.data?.message || "").toLowerCase();
  return (
    text.includes("429") ||
    text.includes("rate") ||
    text.includes("too many") ||
    text.includes("overlimit")
  );
}

export async function sendMessageWithRateLimit(
  socket: any,
  jid: string,
  content: any,
  options?: any,
) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await socket.sendMessage(jid, content, options);
    } catch (error) {
      if (attempt === 3 || !isRateLimitError(error)) throw error;

      const retryAfter = Number(
        error?.response?.headers?.["retry-after"] ||
          error?.headers?.["retry-after"] ||
          0,
      );
      await sleep(Math.max(retryAfter * 1000, 2000 * 2 ** (attempt - 1)));
    }
  }
}

async function relayWithRateLimit(
  socket: any,
  jid: string,
  message: any,
  messageId?: string,
) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await socket.relayMessage(jid, message, { messageId });
    } catch (error) {
      if (attempt === 3 || !isRateLimitError(error)) throw error;

      const retryAfter = Number(
        error?.response?.headers?.["retry-after"] ||
          error?.headers?.["retry-after"] ||
          0,
      );
      await sleep(Math.max(retryAfter * 1000, 1500 * 2 ** (attempt - 1)));
    }
  }
}

export async function sendAlbumMessage(
  socket: any,
  jid: string,
  items: AlbumItem[],
  quoted?: any,
) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const albumItems = items.slice(0, MAX_ITEMS);
  const userJid = jidNormalizedUser(socket.user?.id || "");
  const expectedImageCount = albumItems.filter((item) => item.image).length;
  const expectedVideoCount = albumItems.filter((item) => item.video).length;

  if (expectedImageCount === 0 && expectedVideoCount === 0) return null;

  const album = await generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: { messageSecret: crypto.randomBytes(32) },
      albumMessage: { expectedImageCount, expectedVideoCount },
    },
    { quoted, userJid },
  );

  await relayWithRateLimit(socket, jid, album.message, album.key.id);

  for (let index = 0; index < albumItems.length; index += 1) {
    if (index > 0) await sleep(ALBUM_DELAY);

    try {
      const mediaMessage = await generateWAMessage(jid, albumItems[index] as any, {
        upload: socket.waUploadToServer,
        userJid,
      });
      mediaMessage.message!.messageContextInfo = {
        messageSecret: crypto.randomBytes(32),
        messageAssociation: {
          associationType: 1,
          parentMessageKey: album.key,
        },
      };
      await relayWithRateLimit(socket, jid, mediaMessage.message, mediaMessage.key.id);
    } catch (error) {
      console.error("[album] No se pudo enviar un elemento:", error);
    }
  }

  return album;
}
