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


// Directorio de sesiones de bots
globalThis.mainBotSession = "./sessions";
globalThis.subBotSession = "./sessions/subs";

globalThis.mainSocket = null;

