import { exec } from "node:child_process";
import { promisify } from "node:util";
import { fytBold } from "../../core/socketText.ts";

const execAsync = promisify(exec);
const MAX_OUTPUT_LENGTH = 12000;

function limitOutput(value: unknown): string {
  const output = String(value || "").trim();
  if (!output) return "";
  if (output.length <= MAX_OUTPUT_LENGTH) return output;
  return `${output.slice(0, MAX_OUTPUT_LENGTH)}\n...[salida recortada]`;
}

export default {
  name: ["r", "run", "exec", "terminal"],
  category: "system",
  description: "Ejecuta comandos en la terminal del servidor.",
  ownerOnly: true,

  async run({ args, usedPrefix, reply, react }: any) {
    const command = args.join(" ").trim();
    if (!command) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ❌ ${fytBold("FALTA COMANDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Por favor, escribe el comando de terminal.\n┃ > Ejemplo: *${usedPrefix || "."}r pm2 restart all*\n\n╰〔 ⚡ ${fytBold("SYSTEM")} 〕⬣`,
      });
    }

    await react("💻");
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 120000,
        maxBuffer: 2 * 1024 * 1024,
        shell: "/bin/sh",
      });
      const output =
        [limitOutput(stdout), limitOutput(stderr && `[STDERR]\n${stderr}`)]
          .filter(Boolean)
          .join("\n") || "Comando ejecutado sin salida de texto.";

      await react("✅");
      return reply({
        text: `╭〔 🖥️ ${fytBold("TERMINAL EXEC")} 〕━⬣\n\n\`\`\`\n${output}\n\`\`\`\n\n╰━━〔 ⚡ ${fytBold("SYSTEM")} 〕━━⬣`,
      });
    } catch (error: any) {
      const output =
        [
          limitOutput(error?.stdout),
          limitOutput(error?.stderr && `[STDERR]\n${error.stderr}`),
          error?.message && `[ERROR CRÍTICO]\n${error.message}`,
        ]
          .filter(Boolean)
          .join("\n") || "Error desconocido.";

      await react("❌");
      return reply({
        text: `╭〔 ❌ ${fytBold("TERMINAL ERROR")} 〕━⬣\n\n\`\`\`\n${output}\n\`\`\`\n\n╰━━〔 ⚡ ${fytBold("SYSTEM")} 〕━━⬣`,
      });
    }
  },
};
