import { getBolsillo } from "../../core/economyConfig.ts";

export default { name: ["bal", "balance", "saldo"], description: "Muestra tu saldo.", category: "economy", async run(ctx: any) { return ctx.reply(`💰 Tu saldo global es: $${getBolsillo(ctx.sender).toLocaleString("es-ES")}`); } };