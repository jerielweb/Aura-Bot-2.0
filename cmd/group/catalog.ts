import { fytBold } from "../../core/socketText.ts";

function getCategories(ctx: any): string[] {
  return [...new Set<string>((ctx.getPluginCategories?.() ?? []).map((category: string) => category.toLowerCase()))].sort();
}

export default {
  name: ["disable", "enable"],
  category: "group",
  description: "Activa o desactiva un catálogo de comandos para este grupo.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: any) {
    const action = String(ctx.cmdName || "").toLowerCase();
    const target = String(ctx.args?.[0] ?? "").trim().toLowerCase();
    const categories = getCategories(ctx);
    const group = ctx.db.getGroup(ctx.from);
    const disabled = Array.isArray(group.catBlocked)
      ? group.catBlocked.map((category: string) => category.toLowerCase())
      : [];
    const enabled = categories.filter((category) => !disabled.includes(category));

    if (!target) {
      return ctx.reply({ text: `╭〔 ⚙️ ${fytBold("CATÁLOGO DE COMANDOS")} 〕⬣
┃ ${fytBold("USO")}
╰━━━━━━━━━━━━⬣

┃ ➪ ${ctx.usedPrefix || "."}disable funy
┃ ➪ ${ctx.usedPrefix || "."}enable funy
┃
┃ Catálogos disponibles:
┃ ${categories.join(", ") || "Ninguno"}
┃
┃ ✅ Activados:
┃ ${enabled.join(", ") || "Ninguno"}
┃
┃ ❌ Desactivados:
┃ ${disabled.join(", ") || "Ninguno"}

╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣` });
    }

    if (!categories.includes(target)) {
      return ctx.reply({ text: `❌ El catálogo *${target}* no existe. Usa ${ctx.usedPrefix || "."}disable para ver los disponibles.` });
    }

    const shouldDisable = action === "disable";
    const nextDisabled = shouldDisable
      ? [...new Set([...disabled, target])]
      : disabled.filter((category: string) => category !== target);

    ctx.db.setGroup(ctx.from, { catBlocked: nextDisabled });
    return ctx.reply({ text: `${shouldDisable ? "❌" : "✅"} El catálogo *${target}* ha sido ${shouldDisable ? "desactivado" : "activado"} para este grupo.` });
  },
};