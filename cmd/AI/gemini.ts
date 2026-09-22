import { fytBold } from "../../core/socketText.ts";
import { aiError, askAlya, getPrompt } from "./aiUtils.ts";

export default {
  name: ["gemini", "gia", "gai", "genai"],
  category: "AI",
  description: "Habla con Gemini.",

  async run({ args, reply, react }: any) {
    const prompt = getPrompt(args);
    if (!prompt) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA MENSAJE")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Debes escribir un mensaje para\n┃ > que Gemini pueda responderte.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }

    await react("🤖");
    try {
      const response = await askAlya("/ai/gemini", prompt);
      await reply({
        text: `╭〔 🤖 ${fytBold("GEMINI AI")} 〕⬣\n\n${response}\n\n╰〔 ⚡ ${fytBold("SYSTEM AI")} 〕⬣`,
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
