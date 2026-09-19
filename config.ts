// Configuracion de las apis externas
globalThis.apis = {
  alya: {
    BASE_URL: "https://api.alyacore.xyz/",
    API_KEY: "oboe",
  },
  lempi: {
    BASE_URL: "https://api.lempi.lat/",
    API_KEY: "OBOE-AERETHIX",
  },
  deliriusApi: {
    BASE_URL: "https://api.delirius.online/",
    API_KEY: null,
  },
};

// Configuracion de fabrica de los bots
globalThis.DEFAULT_PREFIXES = [".", "#", "/", "!", "-", "%", "$"];
globalThis.DEFAULT_BOT_NAME = "AURA REED";
globalThis.DEFAULT_BOT_VERSION = "2.0.0";
globalThis.DEFAULT_BOT_AUTHOR = "𝘗𝘰𝘸𝘦𝘳𝘦𝘥 𝘉𝘺: 𝕵𝖊𝖗𝖎𝖊𝖑 𝕭.";
globalThis.DEFAULT_BOT_DESCRIPTION = "";
globalThis.DEFAULT_BOT_OWNER = "𝕵𝖊𝖗𝖎𝖊𝖑 𝕭.";
globalThis.DEFAULT_OWNER_NUMBER = ["50672373785", "50578391933", "524183357841"];

// Directorio de sesiones de bots
globalThis.mainBotSession = "./sessions";
globalThis.subBotSession = "./sessions/subs";
globalThis.DATA_BASE_DIR = "./database";

globalThis.mainSocket = null;

