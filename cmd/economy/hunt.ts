import { runActivity } from "../../core/economyCommands.ts";

export default { name: ["hunt", "cazar"], description: "Caza recompensas.", category: "economy", async run(ctx: any) { return runActivity(ctx, "hunt"); } };