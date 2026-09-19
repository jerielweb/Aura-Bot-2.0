import { profileTarget } from "../../core/profileConfig.ts";
import { getBolsillo, transferBolsillo } from "../../core/economyConfig.ts";

export default {
  name: ["pay", "pagar", "transferir"],
  description: "Transfiere dinero global a un usuario mencionado.",
  category: "economy",
  async run(ctx: any) {
    const target = await profileTarget(ctx);
    const amount = Number(ctx.args?.[0]);
    if (target === ctx.sender || !Number.isInteger(amount) || amount <= 0) return ctx.reply("Uso: .pay @usuario cantidad");
    if (getBolsillo(ctx.sender) < amount) return ctx.reply("❌ No tienes saldo suficiente.");
    if (!transferBolsillo(ctx.sender, target, amount)) return ctx.reply("❌ No se pudo completar la transferencia.");
    return ctx.reply({
      text: `✅ Transferiste $${amount.toLocaleString("es-ES")} a @${target.split("@")[0]}.`,
      mentions: [target],
    });
  },
};