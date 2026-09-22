import { fytBold } from "../../core/socketText.ts";
import { aiError, askAlya, getPrompt } from "./aiUtils.ts";

export default {
  name: ["chatgpt", "ia", "gpt"],
  category: "AI",
  description: "Habla con ChatGPT.",

  async run({ args, reply, react }: any) {
    const prompt = getPrompt(args);
    if (!prompt) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA MENSAJE")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Debes escribir un mensaje para\n┃ > que ChatGPT pueda responderte.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }

    await react("🤖");
    try {
      const response = await askAlya("/ai/chatgpt", prompt);
      await reply({
        text: `╭〔 🤖 ${fytBold("CHATGPT AI")} 〕⬣\n\n${response}\n\n╰〔 ⚡ ${fytBold("SYSTEM AI")} 〕⬣`,
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
