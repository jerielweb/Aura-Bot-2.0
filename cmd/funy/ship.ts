import { createCanvas, loadImage } from "@napi-rs/canvas";
import { fytBold } from "../../core/socketText.ts";

async function getProfilePic(sock: any, jid: string) {
  try {
    const url = await sock.profilePictureUrl(jid, "image");
    const response = await fetch(url);
    if (!response.ok) return null;
    return await loadImage(Buffer.from(await response.arrayBuffer()));
  } catch {
    return null;
  }
}

function drawCircleAvatar(context: any, image: any, x: number, y: number, size: number) {
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.closePath();
  if (image) {
    context.clip();
    context.drawImage(image, x, y, size, size);
  } else {
    context.fillStyle = "#6be368";
    context.fill();
  }
  context.restore();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.lineWidth = 14;
  context.strokeStyle = "#ffffff";
  context.stroke();
}

function drawHeart(context: any, centerX: number, centerY: number, size: number, fill: string, stroke: string, lineWidth: number) {
  const top = centerY - size * 0.45;
  const bottom = centerY + size * 0.55;
  const lobe = size * 0.42;
  context.save();
  context.beginPath();
  context.moveTo(centerX, centerY - size * 0.08);
  context.bezierCurveTo(centerX - size * 0.16, centerY - size * 0.36, centerX - lobe, top, centerX - lobe, centerY - size * 0.05);
  context.bezierCurveTo(centerX - lobe, centerY + size * 0.28, centerX - size * 0.2, centerY + size * 0.42, centerX, bottom);
  context.bezierCurveTo(centerX + size * 0.2, centerY + size * 0.42, centerX + lobe, centerY + size * 0.28, centerX + lobe, centerY - size * 0.05);
  context.bezierCurveTo(centerX + lobe, top, centerX + size * 0.16, centerY - size * 0.36, centerX, centerY - size * 0.08);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = lineWidth;
  context.strokeStyle = stroke;
  context.stroke();
  context.restore();
}

function drawProgressBar(context: any, x: number, y: number, width: number, height: number, percent: number) {
  const radius = height / 2;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = "#ffffff";
  context.fill();
  const fillWidth = Math.max(0, ((width - 20) * percent) / 100);
  if (fillWidth > 0) {
    context.beginPath();
    context.roundRect(x + 10, y + 10, fillWidth, height - 20, radius - 5);
    context.fillStyle = "#ff0505";
    context.fill();
  }
  drawHeart(context, x + 10 + fillWidth - 10, y + height / 2 - 8, 100, "#ff1010", "#050505", 5);
}

export default {
  name: ["ship"],
  category: "funy",
  description: "Genera una tarjeta de compatibilidad entre dos usuarios.",
  groupOnly: true,

  async run(ctx: any) {
    const messageContext = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const mentioned = Array.isArray(messageContext?.mentionedJid) ? messageContext.mentionedJid : [];
    const quotedParticipant = messageContext?.participant;
    let userA = ctx.sender;
    let userB = mentioned.length >= 2 ? mentioned[1] : mentioned[0] || quotedParticipant;
    if (mentioned.length >= 2) userA = mentioned[0];

    if (!userA || !userB) return ctx.reply({ text: "『💘』No pude identificar a los usuarios. Mencioná a alguien (o respondé su mensaje) para hacer el ship.\n\n*Uso:* .ship @usuario" });
    if (userA === userB) return ctx.reply({ text: "『💘』No podés hacerte ship con vos mismo, xd." });

    userA = await ctx.resolveLid(userA);
    userB = await ctx.resolveLid(userB);
    const mentions = [userA, userB].filter((jid) => typeof jid === "string" && jid.includes("@"));
    if (mentions.length !== 2) return ctx.reply({ text: "『💘』No pude identificar correctamente a los dos usuarios." });

    const width = 1024;
    const height = 740;
    const canvas = createCanvas(width, height);
    const canvasContext = canvas.getContext("2d");
    canvasContext.fillStyle = "#b542e8";
    canvasContext.fillRect(0, 0, width, height);
    const avatarSize = 310;
    const avatarY = 85;
    const avatarX = 85;
    const [imageA, imageB] = await Promise.all([getProfilePic(ctx.sock, userA), getProfilePic(ctx.sock, userB)]);
    drawCircleAvatar(canvasContext, imageA, avatarX, avatarY, avatarSize);
    drawCircleAvatar(canvasContext, imageB, width - avatarX - avatarSize, avatarY, avatarSize);

    const percent = Math.floor(Math.random() * 101);
    const heartCenterX = 512;
    const heartCenterY = 400;
    drawHeart(canvasContext, heartCenterX, heartCenterY, 180, "#ff007f", "#050505", 5);
    canvasContext.font = "bold 45px sans-serif";
    canvasContext.textAlign = "center";
    canvasContext.textBaseline = "middle";
    canvasContext.fillStyle = "#050505";
    canvasContext.fillText(`${percent}%`, heartCenterX, heartCenterY + 20);
    drawProgressBar(canvasContext, 85, 580, 854, 78, percent);

    let result = "Cero compatibilidad, lo siento.";
    if (percent >= 90) result = "¡Ya casense y tengan hijos!";
    else if (percent >= 85) result = "¡Son el uno para el otro!";
    else if (percent >= 70) result = "¡Sus miradas se cruzan!";
    else if (percent >= 50) result = "¡Lo pulsean!";
    else if (percent >= 30) result = "Mejor quedan como amigos.";

    const caption = `╭〔 💘 ${fytBold("¿HAY SHIP?")} 〕⬣\n\n┃ @${userA.split("@")[0]} 💞 @${userB.split("@")[0]}\n┃ ${fytBold("Porcentaje:")} ${percent}%\n┃ ${result}\n\n╰〔 ⚡ ${fytBold("FUN")} 〕⬣`;
    return ctx.sock.sendMessage(ctx.from, { image: canvas.toBuffer("image/png"), caption, mentions }, { quoted: ctx.msg });
  },
};