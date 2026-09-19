import { runActivity } from "../../core/economyCommands.ts";

export default { name: ["work", "trabajar"], description: "Trabaja y gana dinero.", category: "economy", async run(ctx: any) { return runActivity(ctx, "work"); } };