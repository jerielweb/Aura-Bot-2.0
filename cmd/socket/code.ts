import { requestSubBotLink } from "../../core/subbotManager.ts";

export default {
  name: ["code", "pairingcode", "vincularcode"],
  description: "Vincula un subbot mediante código.",
  category: "socket",
  ownerOnly: false,

  async run({ args, sender, reply }: any) {
    await reply({ text: "⏳ Preparando el código de vinculación..." });
    await requestSubBotLink({
      requester: sender,
      method: "code",
      phoneNumber: args[0],
      onPairingCode: (code) =>
        reply({ text: `🔑 Código de vinculación del subbot: *${code}*` }),
      onPairingError: (error) =>
        reply({
          text: `❌ WhatsApp rechazó la solicitud del código: ${error.message}`,
        }),
      onPairingExpired: () =>
        reply({
          text: "⌛ El código expiró después de 1 minuto. El subbot quedó offline; solicita otro código para volver a intentarlo.",
        }),
    });
  },
};
