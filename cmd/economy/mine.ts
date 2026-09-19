import { runActivity } from "../../core/economyCommands.ts";

export default { name: ["mine", "minar"], description: "Mina recursos.", category: "economy", async run(ctx: any) { return runActivity(ctx, "mine"); } };