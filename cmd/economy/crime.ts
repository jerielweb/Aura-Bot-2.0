import { runActivity } from "../../core/economyCommands.ts";

export default { name: ["crime", "crimen"], description: "Comete un crimen.", category: "economy", async run(ctx: any) { return runActivity(ctx, "crime"); } };