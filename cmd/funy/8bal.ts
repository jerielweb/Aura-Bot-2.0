import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["8bal", "8ball", "8bola"],
  category: "funy",
  description: "Responde una pregunta estilo bola 8.",

  async run(ctx: any) {
    const question = ctx.args.join(" ").trim();
    if (!question) {
      const usage = `${ctx.usedPrefix || "."}8bal <pregunta>`;
      let text = `╭〔 ⚠️ ${fytBold("FALTA PREGUNTA")} 〕⬣\n\n`;
      text +=
        "┃ > Debes escribir una pregunta para que la bola 8 pueda responder.\n";
      text += `┃ > Uso: *${usage}*\n\n`;
      text += `╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`;
      return ctx.reply({ text });
    }

    const answers = [
      "Definitivamente sí.",
      "Sin duda.",
      "Puedes confiar en ello.",
      "Es probable.",
      "Pregunta de nuevo más tarde.",
      "Mejor no decirte ahora.",
      "No puedo predecirlo ahora.",
      "Concéntrate y pregunta otra vez.",
      "No cuentes con ello.",
      "Mi respuesta es no.",
      "Muy dudoso.",
      "Las señales apuntan a que sí.",
      "Las probabilidades son buenas.",
      "Respuesta confusa, inténtalo otra vez.",
      "¡Por supuesto!",
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];

    let text = `╭〔 🎱 ${fytBold("BOLA 8")} 〕⬣\n\n`;
    text += `┃ ${fytBold("Pregunta:")} ${question}\n`;
    text += `┃ ${fytBold("Respuesta:")} ${answer}\n\n`;
    text += `╰〔 ⚡ ${fytBold("FUN")} 〕⬣`;
    return ctx.reply({ text });
  },
};
