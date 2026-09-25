import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
} from "@whiskeysockets/baileys";
import { readFile } from "node:fs/promises";
import { downloadToCache } from "./downloadUtils.ts";
import { createLinkPreviewWithoutChannel } from "./LinkPreview.ts";

type DownloadPreviewOptions = {
  sock: any;
  from: string;
  msg: any;
  thumbnail: string;
  caption: string;
  link: string;
  title: string;
  author?: string;
  sender?: string;
  mentions?: string[];
};

export async function sendDownloadPreview({
  sock,
  from,
  msg,
  thumbnail,
  caption,
  link,
  title,
  author = "",
  sender,
  mentions = [],
}: DownloadPreviewOptions): Promise<boolean> {
  try {
    const thumbnailBuffer = await readFile(
      await downloadToCache(thumbnail, 30000),
    );
    const prepared = await prepareWAMessageMedia(
      { image: thumbnailBuffer },
      {
        upload: sock.waUploadToServer,
        mediaTypeOverride: "thumbnail-link",
      },
    );

    const allMentions = Array.from(
      new Set([...(sender ? [sender] : []), ...mentions]),
    );

    const preview = createLinkPreviewWithoutChannel({
      textOriginal: caption,
      link,
      author,
      title,
      banner: prepared.imageMessage,
      mentionedJid: allMentions,
      isForwarded: false,
      forwardingScore: 0,
    });
    const previewMessage = generateWAMessageFromContent(from, preview, {
      quoted: msg,
      userJid: sock.user?.id,
    });
    await sock.relayMessage(from, previewMessage.message, {
      messageId: previewMessage.key.id,
    });
    return true;
  } catch (error) {
    console.error("[download-preview] No se pudo preparar el preview:", error);
    return false;
  }
}
