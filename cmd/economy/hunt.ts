import { createEconomyActivity } from "../../core/economyActivities.ts";

export default createEconomyActivity({
  names: ["hunt", "cazar", "caza"],
  description: "Entra en combate para obtener monedas y experiencia.",
  title: "🏹 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐃𝐄 𝐂𝐎𝐌𝐁𝐀𝐓𝐄",
  icon: "🏹",
  cooldown: 30 * 60 * 1000,
  reward: [5000, 10000],
  xp: [20, 50],
  success: [
    "Derrotaste a un Warden y el gremio te pagó",
    "Superaste la arena y cobraste",
    "Cazaste una criatura legendaria y obtuviste",
  ],
  fail: [
    "Un Creeper apareció detrás de ti y tuviste que huir.",
    "La criatura esquivó tu ataque y perdiste el rastro.",
  ],
});
