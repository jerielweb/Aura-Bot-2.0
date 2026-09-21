export function cleanJid(value: unknown): string {
  return String(value || "")
    .trim()
    .split(":")[0];
}

export function getTargetJids(ctx: any): string[] {
  const context = Object.values(ctx.msg?.message ?? {})
    .map((value: any) => value?.contextInfo)
    .find(Boolean) as any;
  const mentioned = Array.isArray(context?.mentionedJid)
    ? context.mentionedJid
    : [];
  const quoted = context?.participant ? [context.participant] : [];
  return [...new Set([...mentioned, ...quoted].filter(Boolean))] as string[];
}

export function groupStatus(value: unknown): string {
  return value ? "✅ Activado" : "❌ Desactivado";
}

export function parseToggle(value: unknown): boolean | null {
  const normalized = String(value || "").toLowerCase();
  if (["on", "1", "true", "activar", "enable"].includes(normalized))
    return true;
  if (["off", "0", "false", "desactivar", "disable"].includes(normalized))
    return false;
  return null;
}

export function getGroupData(ctx: any): any {
  return ctx.db.getGroup(ctx.from);
}

export function saveGroupData(ctx: any, data: Record<string, any>): any {
  ctx.db.setGroup(ctx.from, data);
  return ctx.db.getGroup(ctx.from);
}

export function groupFrame(title: string, icon = "⚙️"): string {
  return `╭〔 ${icon} ${title} 〕⬣\n╰━━━━━━━━━━━━⬣\n\n`;
}

export function groupFooter(label = "SYSTEM INFO"): string {
  return `\n╰〔 ⚡ ${label} 〕⬣`;
}
