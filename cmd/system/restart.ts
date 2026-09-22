export default {
  name: ["restart", "reiniciar"],
  category: "system",
  description: "Reinicia el bot.",
  ownerOnly: true,

  async run({ reply }: any) {
    await reply({
      text: `╭〔 🔄 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣\n┃ ⚙️ 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐑𝐄𝐒𝐓𝐀𝐑𝐓\n╰━━━━━━━━━━━━⬣\n\n┃ > El bot se está reiniciando\n┃ > espere un momento...\n\n╰〔 ⚡ 𝐒𝐘𝐒𝐓𝐄𝐌 〕⬣`,
    });

    setTimeout(() => {
      process.exit(1);
    }, 1000);
  },
};
