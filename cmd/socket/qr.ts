import qr from "qr-image";
import { requestSubBotLink } from "../../core/subbotManager.ts";
import { IS_SUBBOT_ONLINE } from "../../core/socketText.ts";

export default {
  name: ["qr", "vincularqr"],
  description: "Vincula un subbot mediante código QR.",
  category: "socket",
  ownerOnly: true,

  async run({ sender, reply }: any) {
    await reply({ text: "⏳ Preparando el código QR de vinculación..." });
    await requestSubBotLink({
      requester: sender,
      method: "qr",
      onQr: (value) =>
        reply({
          image: qr.imageSync(value, { type: "png" }),
          caption: "📱 Escanea este QR para vincular el subbot.",
        }),
      onConnected: () =>
        reply({ text: IS_SUBBOT_ONLINE({prefix: "."}) }),
    });
  },
};
