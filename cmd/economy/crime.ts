import { createEconomyActivity } from "../../core/economyActivities.ts";

export default createEconomyActivity({
  names: ["crime", "crimen"],
  description: "Comete un crimen para ganar monedas, pero cuidado con la policía.",
  title: "🥷 𝐂𝐑𝐈𝐌𝐄𝐍 𝐄𝐗𝐈𝐓𝐎𝐒𝐎",
  icon: "🥷",
  cooldown: 60 * 60 * 1000,
  reward: [2000, 10000],
  xp: [10, 25],
  success: ["Hackeaste una cuenta y escapaste con", "Robaste una joyería y huiste con", "Vendiste información y ganaste"],
  fail: ["La policía te atrapó y pagaste una fianza.", "El golpe salió mal y perdiste la oportunidad."],
});