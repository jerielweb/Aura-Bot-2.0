import { runActivity } from "../../core/economyCommands.ts";

export default { name: ["adventure", "aventura"], description: "Explora una aventura.", category: "economy", async run(ctx: any) { return runActivity(ctx, "adventure"); } };