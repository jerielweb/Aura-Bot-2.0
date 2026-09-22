import { fytBold } from "../../core/socketText.ts";
import { aiError, askAlya, getPrompt } from "./aiUtils.ts";

export default {
  name: ["copilot", "copi", "cpt"],
  category: "AI",
  description: "Habla con Copilot.",

  async run({ args, reply, react }: any) {
    const prompt = getPrompt(args);
    if (!prompt) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA MENSAJE")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Debes escribir un mensaje para\n┃ > que Copilot pueda responderte.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }

    await react("🤖");
    try {
      const response = await askAlya("/ai/copilot", prompt);
      await reply({
        text: `╭〔 🤖 ${fytBold("COPILOT AI")} 〕⬣\n\n${response}\n\n╰〔 ⚡ ${fytBold("SYSTEM AI")} 〕⬣`,
      });
      await react("✅");
    } catch (error) {
      await react("❌");
      return reply({
        text: `❌ ${fytBold("ERROR AL OBTENER RESPUESTA")} ❌\n\n> ${aiError(error)}`,
      });
    }
  },
};
