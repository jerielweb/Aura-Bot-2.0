import { createCanvas } from "@napi-rs/canvas";
import { sendMessageWithRateLimit } from "../../core/mediaSendUtils.ts";
import { HANGMAN_WORDS } from "../../core/gameData.ts";
import { addAura } from "../../core/economyConfig.ts";

type HangmanGame = {
  word: string;
  guessedLetters: Set<string>;
  mistakes: number;
  maxMistakes: number;
  lastMessageId?: string;
  timeout?: NodeJS.Timeout;
};

const games = new Map<string, HangmanGame>();
const GAME_TIMEOUT = 5 * 60 * 1000;

function gameKey(botJid: string, from: string): string {
  return `${botJid}:${from}`;
}

function clearGame(key: string) {
  const game = games.get(key);
  if (game?.timeout) clearTimeout(game.timeout);
  games.delete(key);
}

function scheduleExpiry(ctx: any, key: string, game: HangmanGame) {
  if (game.timeout) clearTimeout(game.timeout);
  game.timeout = setTimeout(async () => {
    if (games.get(key) !== game) return;
    clearGame(key);
    await ctx.reply(`⏰ El juego expiró por inactividad. La palabra era: *${game.word.toUpperCase()}*`);
  }, GAME_TIMEOUT);
}

function renderGame(game: HangmanGame, happy = false): Buffer {
  const size = 900;
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.strokeStyle = "#111827";
  context.lineWidth = 16;
  context.lineCap = "round";

  context.beginPath();
  context.moveTo(180, 760);
  context.lineTo(700, 760);
  context.moveTo(570, 760);
  context.lineTo(570, 120);
  context.lineTo(300, 120);
  context.lineTo(300, 190);
  context.stroke();

  if (game.mistakes >= 1) {
    context.beginPath();
    context.arc(300, 290, 90, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "#111827";
    context.beginPath();
    context.arc(270, 275, 10, 0, Math.PI * 2);
    context.arc(330, 275, 10, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.arc(300, 330, 28, happy ? 0 : Math.PI, happy ? Math.PI : 0);
    context.stroke();
  }
  if (game.mistakes >= 2) {
    context.beginPath();
    context.moveTo(300, 380);
    context.lineTo(300, 570);
    context.stroke();
  }
  if (game.mistakes >= 3) {
    context.beginPath();
    context.moveTo(300, 420);
    context.lineTo(180, 520);
    context.stroke();
  }
  if (game.mistakes >= 4) {
    context.beginPath();
    context.moveTo(300, 420);
    context.lineTo(420, 520);
    context.stroke();
  }
  if (game.mistakes >= 5) {
    context.beginPath();
    context.moveTo(300, 570);
    context.lineTo(210, 710);
    context.stroke();
  }
  if (game.mistakes >= 6) {
    context.beginPath();
    context.moveTo(300, 570);
    context.lineTo(390, 710);
    context.stroke();
  }

  const displayWord = game.word
    .split("")
    .map((letter) => (game.guessedLetters.has(letter) ? letter.toUpperCase() : "_"))
    .join(" ");
  context.fillStyle = "#111827";
  context.font = "bold 48px DejaVu Sans";
  context.textAlign = "center";
  context.fillText(displayWord, size / 2, 850);
  return canvas.toBuffer("image/png");
}

async function sendGame(ctx: any, game: HangmanGame, status: string, ended = false) {
  const key = gameKey(ctx.botJid, ctx.from);
  const lives = game.maxMistakes - game.mistakes;
  const used = [...game.guessedLetters].map((letter) => letter.toUpperCase()).join(", ");
  const text = [
    "╭〔 🎮 𝐀𝐇𝐎𝐑𝐂𝐀𝐃𝐎 〕⬣",
    `┃ ${status}`,
    `┃ 🩸 Vidas: ${"❤️".repeat(lives)}${"🖤".repeat(game.mistakes)}`,
    used && !ended ? `┃ 🔤 Usadas: ${used}` : "",
    !ended ? "┃ > Escribe una letra o la palabra completa." : "",
    "╰〔 ⚡ 𝐒𝐘𝐒𝐓𝐄𝐌 〕⬣",
  ].filter(Boolean).join("\n");

  const buttons = ended
    ? []
    : [{ buttonId: `${ctx.usedPrefix || "."}ahorcado rendirse`, buttonText: { displayText: "🏳️ Rendirse" }, type: 1 }];
  const sentMessage = await sendMessageWithRateLimit(
    ctx.sock,
    ctx.from,
    { image: renderGame(game, ended && status.includes("Ganaste")), caption: text, buttons, headerType: 4 },
    { quoted: ctx.msg },
  );
  if (!ended) game.lastMessageId = sentMessage?.key?.id;
  if (ended) clearGame(key);
}

export async function handleReply(ctx: any): Promise<boolean> {
  const key = gameKey(ctx.botJid, ctx.from);
  const game = games.get(key);
  const stanzaId =
    ctx.msg?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
    ctx.msg?.message?.imageMessage?.contextInfo?.stanzaId;

  if (!game || !stanzaId || stanzaId !== game.lastMessageId) return false;
  await defaultCommand.run({ ...ctx, args: [ctx.body.trim()] });
  return true;
}

const defaultCommand = {
  name: ["ahorcado", "hangman"],
  category: "games",
  description: "Juega al ahorcado.",
  handleReply,
  async run(ctx: any) {
    const key = gameKey(ctx.botJid, ctx.from);
    const input = ctx.args.join(" ").toLowerCase().trim();
    let game = games.get(key);

    if (!game) {
      game = {
        word: HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)].toLowerCase(),
        guessedLetters: new Set(),
        mistakes: 0,
        maxMistakes: 6,
      };
      games.set(key, game);
      scheduleExpiry(ctx, key, game);
      if (!input || input === "iniciar") {
        return sendGame(ctx, game, "¡Juego iniciado!");
      }
    }

    if (input === "rendirse" || input === "salir") {
      const word = game.word;
      clearGame(key);
      return ctx.reply(`🏳️ Te has rendido. La palabra era: *${word.toUpperCase()}*`);
    }

    if (!input) return sendGame(ctx, game, "⚠️ Ya hay un juego en curso.");
    if (input.length === 1) {
      if (!/^[a-záéíóúüñ]$/u.test(input)) return ctx.reply("⚠️ Escribe una letra válida.");
      if (game.guessedLetters.has(input)) return ctx.reply("⚠️ Ya intentaste esa letra.");
      game.guessedLetters.add(input);
      if (!game.word.includes(input)) game.mistakes += 1;
    } else if (input === game.word) {
      for (const letter of game.word) game.guessedLetters.add(letter);
    } else {
      game.mistakes += 1;
    }

    scheduleExpiry(ctx, key, game);
    const won = [...game.word].every((letter) => game.guessedLetters.has(letter));
    if (won) {
      addAura(ctx.sender, 500);
      return sendGame(ctx, game, "🎉 ¡Ganaste! Recompensa: +500 Aura Points", true);
    }
    if (game.mistakes >= 6) {
      return sendGame(ctx, game, `💀 ¡Perdiste! La palabra era: ${game.word.toUpperCase()}`, true);
    }
    return sendGame(ctx, game, "¡Sigue intentando!");
  },
};

export default defaultCommand;