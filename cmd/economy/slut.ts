import { runActivity } from "../../core/economyCommands.ts";

export default { name: ["slut", "compania"], description: "Realiza un trabajo de compañía.", category: "economy", async run(ctx: any) { return runActivity(ctx, "slut"); } };