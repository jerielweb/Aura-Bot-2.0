import DataBase from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import "../config.ts";

const DATA_BASE_DIR = globalThis.DATA_BASE_DIR;
if (!existsSync(DATA_BASE_DIR)) {
  mkdirSync(DATA_BASE_DIR, { recursive: true });
}

const db_instance = new DataBase(`${DATA_BASE_DIR}/Aura.db`);
db_instance.pragma("journal_mode = WAL");
db_instance.pragma("synchronous = NORMAL");
db_instance.pragma("foreign_keys = ON");
db_instance.pragma("wal_checkpoint = 1000");
db_instance.pragma("busy_timeout = 2000");

db_instance.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    lid TEXT,
    username TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'user',
    is_banned INTEGER DEFAULT 0,
    data TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    group_id TEXT,
    group_name TEXT,
    antilink INTEGER DEFAULT 0,
    antiCalls INTEGER DEFAULT 0,
    antiToxic INTEGER DEFAULT 0,
    antiSpam INTEGER DEFAULT 0,
    antiStatus INTEGER DEFAULT 0,
    data TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS bots (
    jid TEXT PRIMARY KEY,
    bot_id TEXT,
    bot_name TEXT,
    phone_number TEXT,
    lid TEXT,
    groups TEXT DEFAULT '[]',
    isMain INTEGER DEFAULT 0,
    status TEXT DEFAULT 'offline',
    data TEXT DEFAULT '{}'
  );
`);

for (const column of [
  ["phone_number", "TEXT"],
  ["lid", "TEXT"],
  ["groups", "TEXT DEFAULT '[]'"],
] as const) {
  const exists = db_instance
    .prepare("SELECT 1 FROM pragma_table_info('bots') WHERE name = ?")
    .get(column[0]);
  if (!exists) db_instance.exec(`ALTER TABLE bots ADD COLUMN ${column[0]} ${column[1]}`);
}

const hierarchy = ["user", "premium", "mod", "coowner", "owner"] as const;
type UserRole = typeof hierarchy[number];

const stmts = {
  getUser: db_instance.prepare("SELECT * FROM users WHERE jid = ?"),
  insertUser: db_instance.prepare(
    "INSERT INTO users (jid, lid, username, phone_number, role, is_banned, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ),
  updateUser: db_instance.prepare(
    "UPDATE users SET lid = ?, username = ?, phone_number = ?, role = ?, is_banned = ?, data = ? WHERE jid = ?",
  ),
  updateUserByLid: db_instance.prepare(
    "UPDATE users SET username = ?, phone_number = ?, role = ?, is_banned = ?, data = ? WHERE lid = ?",
  ),
  getAllUsers: db_instance.prepare("SELECT jid, lid, username, phone_number, role, is_banned, data FROM users"),

  getGroup: db_instance.prepare("SELECT * FROM groups WHERE jid = ?"),
  insertGroup: db_instance.prepare(
    "INSERT INTO groups (jid, group_id, group_name, antilink, antiCalls, antiToxic, antiSpam, antiStatus, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ),
  updateGroup: db_instance.prepare(
    "UPDATE groups SET group_id = ?, group_name = ?, antilink = ?, antiCalls = ?, antiToxic = ?, antiSpam = ?, antiStatus = ?, data = ? WHERE jid = ?",
  ),
  getAllGroups: db_instance.prepare("SELECT jid, group_id, group_name, antilink, antiCalls, antiToxic, antiSpam, antiStatus, data FROM groups"),

  getBot: db_instance.prepare("SELECT * FROM bots WHERE jid = ?"),
  insertBot: db_instance.prepare(
    "INSERT INTO bots (jid, bot_id, bot_name, phone_number, lid, groups, isMain, status, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ),
  updateBot: db_instance.prepare(
    "UPDATE bots SET bot_id = ?, bot_name = ?, phone_number = ?, lid = ?, groups = ?, isMain = ?, status = ?, data = ? WHERE jid = ?",
  ),
  getAllBots: db_instance.prepare("SELECT jid, bot_id, bot_name, phone_number, lid, groups, isMain, status, data FROM bots"),
  deleteBot: db_instance.prepare("DELETE FROM bots WHERE jid = ?"),
};

function normalizeJid(input: string) {
  return String(input || "")
    .trim()
    .replace(/@.*$/, "")
    .replace(/:.*/, "");
}

function safeJson<T = Record<string, any>>(value: string | null | undefined): T {
  if (!value) return {} as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

function safeJsonArray(value: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function getUserRow(input: string, lid?: string | null) {
  const rawInput = String(input || "").trim();
  const key = normalizeJid(rawInput);
  const candidates = [
    rawInput,
    key,
    key ? `${key}@s.whatsapp.net` : "",
  ].filter(Boolean);
  const conditions = candidates.flatMap(() => ["jid = ?", "lid = ?"]);
  const values = candidates.flatMap((candidate) => [candidate, candidate]);

  if (lid) {
    conditions.push("lid = ?");
    values.push(lid);
  }

  return db_instance
    .prepare(`SELECT * FROM users WHERE ${conditions.join(" OR ")} LIMIT 1`)
    .get(...values) as any | undefined;
}

function getUser(input: string) {
  const rawInput = String(input || "").trim();
  const key = normalizeJid(rawInput);
  const row = getUserRow(rawInput);

  if (!row) {
    const defaultUser = {
      jid: rawInput.endsWith("@lid") ? null : `${key}@s.whatsapp.net`,
      lid: rawInput.endsWith("@lid") ? rawInput : null,
      username: null,
      phone_number: rawInput.endsWith("@lid") ? null : key,
      role: "user",
      is_banned: 0,
      data: {},
    };

    stmts.insertUser.run(
      defaultUser.jid,
      defaultUser.lid,
      defaultUser.username,
      defaultUser.phone_number,
      defaultUser.role,
      defaultUser.is_banned,
      JSON.stringify(defaultUser.data),
    );

    return defaultUser;
  }

  const jsonData = safeJson<Record<string, any>>(row.data);
  return {
    ...jsonData,
    jid: row.jid !== undefined ? row.jid : (jsonData.jid ?? key),
    lid: row.lid ?? jsonData.lid ?? (rawInput.endsWith("@lid") ? rawInput : null),
    username: row.username ?? jsonData.username ?? null,
    phone_number: row.phone_number !== undefined ? row.phone_number : (jsonData.phone_number ?? key),
    role: row.role ?? jsonData.role ?? "user",
    is_banned: Number(row.is_banned ?? jsonData.is_banned ?? 0),
    data: jsonData,
  };
}

function getGroup(jid: string) {
  const key = normalizeJid(jid);
  const row = stmts.getGroup.get(key) as any | undefined;

  if (!row) {
    const defaultGroup = {
      group_id: key,
      group_name: null,
      antilink: 0,
      antiCalls: 0,
      antiToxic: 0,
      antiSpam: 0,
      antiStatus: 0,
      privateMode: false,
      adminMode: false,
      primaryBot: null,
      welcome: false,
      goodbye: false,
      welcomeMessage: null,
      goodbyeMessage: null,
      data: {},
    };

    stmts.insertGroup.run(
      key,
      defaultGroup.group_id,
      defaultGroup.group_name,
      defaultGroup.antilink,
      defaultGroup.antiCalls,
      defaultGroup.antiToxic,
      defaultGroup.antiSpam,
      defaultGroup.antiStatus,
      JSON.stringify(defaultGroup.data),
    );

    return defaultGroup;
  }

  const jsonData = safeJson<Record<string, any>>(row.data);
  return {
    ...jsonData,
    group_id: row.group_id ?? jsonData.group_id ?? key,
    group_name: row.group_name ?? jsonData.group_name ?? null,
    antilink: Number(row.antilink ?? jsonData.antilink ?? 0),
    antiCalls: Number(row.antiCalls ?? jsonData.antiCalls ?? 0),
    antiToxic: Number(row.antiToxic ?? jsonData.antiToxic ?? 0),
    antiSpam: Number(row.antiSpam ?? jsonData.antiSpam ?? 0),
    antiStatus: Number(row.antiStatus ?? jsonData.antiStatus ?? 0),
    privateMode: Boolean(row.privateMode ?? jsonData.privateMode ?? false),
    adminMode: Boolean(row.adminMode ?? jsonData.adminMode ?? false),
    primaryBot: row.primaryBot ?? jsonData.primaryBot ?? null,
    welcome: Boolean(row.welcome ?? jsonData.welcome ?? false),
    goodbye: Boolean(row.goodbye ?? jsonData.goodbye ?? false),
    welcomeMessage: row.welcomeMessage ?? jsonData.welcomeMessage ?? null,
    goodbyeMessage: row.goodbyeMessage ?? jsonData.goodbyeMessage ?? null,
    data: jsonData,
  };
}

function getBot(jid: string) {
  const key = normalizeJid(jid);
  const row = stmts.getBot.get(key) as any | undefined;

  if (!row) {
    const defaultBot = {
      bot_id: key,
      bot_name: null,
      phone_number: null,
      lid: null,
      groups: [],
      isMain: 0,
      status: "offline",
      data: {},
    };

    stmts.insertBot.run(
      key,
      defaultBot.bot_id,
      defaultBot.bot_name,
      defaultBot.phone_number,
      defaultBot.lid,
      JSON.stringify(defaultBot.groups),
      defaultBot.isMain,
      defaultBot.status,
      JSON.stringify(defaultBot.data),
    );

    return defaultBot;
  }

  const jsonData = safeJson<Record<string, any>>(row.data);
  return {
    ...jsonData,
    bot_id: row.bot_id ?? jsonData.bot_id ?? key,
    bot_name: row.bot_name ?? jsonData.bot_name ?? null,
    phone_number: row.phone_number ?? jsonData.phone_number ?? null,
    lid: row.lid ?? jsonData.lid ?? null,
    groups: safeJsonArray(row.groups ?? jsonData.groups),
    isMain: Number(row.isMain ?? jsonData.isMain ?? 0),
    status: row.status ?? jsonData.status ?? "offline",
    data: jsonData,
  };
}

export const db = {
  getUser,
  getGroup,
  getBot,

  setUser(jid: string, dataObject: Record<string, any>) {
    const key = normalizeJid(jid);
    const currentData = getUser(jid);
    const merged = { ...currentData, ...dataObject };
    const isLidOnly = String(jid).endsWith("@lid") && !dataObject?.jid;
    const rawJid = isLidOnly
      ? null
      : String(dataObject?.jid ?? jid ?? key).trim() || key;
    const rawLid = String(dataObject?.lid ?? currentData?.lid ?? (isLidOnly ? jid : "")).trim() || null;
    const payload = {
      ...merged.data,
      ...merged,
      jid: rawJid,
      lid: rawLid || merged.lid || null,
    };

    delete payload.data;

    const row = getUserRow(rawJid ?? key, rawLid);

    if (!row) {
      stmts.insertUser.run(
        rawJid,
        rawLid || merged.lid || null,
        merged.username ?? null,
        isLidOnly ? null : (merged.phone_number ?? key),
        merged.role ?? "user",
        Number(Boolean(merged.is_banned ?? 0)),
        JSON.stringify(payload),
      );
      return;
    }

    const storedLid = rawLid || row.lid || merged.lid || null;
    const phoneNumber = isLidOnly ? null : (merged.phone_number ?? row.phone_number ?? key);
    if (row.jid === null && storedLid) {
      stmts.updateUserByLid.run(
        merged.username ?? row.username ?? null,
        phoneNumber,
        merged.role ?? row.role ?? "user",
        Number(Boolean(merged.is_banned ?? row.is_banned ?? 0)),
        JSON.stringify(payload),
        storedLid,
      );
    } else {
      stmts.updateUser.run(
        storedLid,
        merged.username ?? row.username ?? null,
        phoneNumber,
        merged.role ?? row.role ?? "user",
        Number(Boolean(merged.is_banned ?? row.is_banned ?? 0)),
        JSON.stringify(payload),
        row.jid ?? key,
      );
    }
  },

  setGroup(jid: string, dataObject: Record<string, any>) {
    const key = normalizeJid(jid);
    const currentData = getGroup(key);
    const merged = { ...currentData, ...dataObject };
    const payload = {
      ...merged.data,
      ...merged,
    };

    delete payload.data;

    const row = stmts.getGroup.get(key) as any | undefined;
    if (!row) {
      stmts.insertGroup.run(
        key,
        merged.group_id ?? key,
        merged.group_name ?? null,
        Number(Boolean(merged.antilink ?? 0)),
        Number(Boolean(merged.antiCalls ?? 0)),
        Number(Boolean(merged.antiToxic ?? 0)),
        Number(Boolean(merged.antiSpam ?? 0)),
        Number(Boolean(merged.antiStatus ?? 0)),
        JSON.stringify(payload),
      );
      return;
    }

    stmts.updateGroup.run(
      merged.group_id ?? key,
      merged.group_name ?? row.group_name ?? null,
      Number(Boolean(merged.antilink ?? row.antilink ?? 0)),
      Number(Boolean(merged.antiCalls ?? row.antiCalls ?? 0)),
      Number(Boolean(merged.antiToxic ?? row.antiToxic ?? 0)),
      Number(Boolean(merged.antiSpam ?? row.antiSpam ?? 0)),
      Number(Boolean(merged.antiStatus ?? row.antiStatus ?? 0)),
      JSON.stringify(payload),
      key,
    );
  },

  setBot(jid: string, dataObject: Record<string, any>) {
    const key = normalizeJid(jid);
    const currentData = getBot(key);
    const merged = { ...currentData, ...dataObject };
    const payload = {
      ...merged.data,
      ...merged,
    };

    delete payload.data;

    const row = stmts.getBot.get(key) as any | undefined;
    if (!row) {
      stmts.insertBot.run(
        key,
        merged.bot_id ?? key,
        merged.bot_name ?? null,
        merged.phone_number ?? null,
        merged.lid ?? null,
        JSON.stringify(Array.isArray(merged.groups) ? merged.groups : []),
        Number(Boolean(merged.isMain ?? 0)),
        merged.status ?? "offline",
        JSON.stringify(payload),
      );
      return;
    }

    stmts.updateBot.run(
      merged.bot_id ?? key,
      merged.bot_name ?? row.bot_name ?? null,
      merged.phone_number ?? row.phone_number ?? null,
      merged.lid ?? row.lid ?? null,
      JSON.stringify(Array.isArray(merged.groups) ? merged.groups : safeJsonArray(row.groups)),
      Number(Boolean(merged.isMain ?? row.isMain ?? 0)),
      merged.status ?? row.status ?? "offline",
      JSON.stringify(payload),
      key,
    );
  },

  setPushName(jid: string, pushName: string) {
    if (!pushName) return;
    const existing = getUser(jid);
    this.setUser(jid, {
      jid,
      lid: existing?.lid || (jid.endsWith("@lid") ? jid : null),
      username: pushName,
      pushName,
      phone_number: jid.endsWith("@lid") ? null : normalizeJid(jid),
    });
  },

  getPrimary(groupJid: string) {
    const group = getGroup(groupJid);
    return group.primaryBot ?? null;
  },

  setPrimary(groupJid: string, botJid: string) {
    this.setGroup(groupJid, { primaryBot: String(botJid || "").trim() || null });
  },

  addBotGroup(botJid: string, groupJid: string) {
    const group = String(groupJid || "").trim();
    if (!group.endsWith("@g.us")) return;

    const bot = getBot(botJid);
    const groups = Array.isArray(bot.groups) ? bot.groups : [];
    if (!groups.includes(group)) this.setBot(botJid, { groups: [...groups, group] });
  },

  getBotById(botId: string) {
    const normalized = String(botId || "").trim();
    if (!normalized) return null;

    return this.getAllBots().find((bot) =>
      bot.bot_id === normalized ||
      normalizeJid(bot.bot_id) === normalizeJid(normalized) ||
      normalizeJid(bot.jid) === normalizeJid(normalized),
    ) ?? null;
  },

  deleteBot(jid: string) {
    stmts.deleteBot.run(normalizeJid(jid));
  },

  getAllUsers() {
    const rows = stmts.getAllUsers.all() as Array<Record<string, any>>;
    return rows.map((row) => {
      const jsonData = safeJson<Record<string, any>>(row.data);
      return {
        jid: row.jid ?? jsonData.jid ?? null,
        ...jsonData,
        lid: row.lid ?? jsonData.lid ?? null,
        username: row.username ?? jsonData.username ?? null,
        phone_number: row.phone_number ?? jsonData.phone_number ?? row.jid,
        role: row.role ?? jsonData.role ?? "user",
        is_banned: Number(row.is_banned ?? jsonData.is_banned ?? 0),
      };
    });
  },

  getAllBots() {
    const rows = stmts.getAllBots.all() as Array<Record<string, any>>;
    return rows.map((row) => {
      const jsonData = safeJson<Record<string, any>>(row.data);
      return {
        jid: row.jid,
        ...jsonData,
        data: jsonData,
        bot_id: row.bot_id ?? jsonData.bot_id ?? row.jid,
        bot_name: row.bot_name ?? jsonData.bot_name ?? null,
        phone_number: row.phone_number ?? jsonData.phone_number ?? null,
        lid: row.lid ?? jsonData.lid ?? null,
        groups: safeJsonArray(row.groups ?? jsonData.groups),
        isMain: Number(row.isMain ?? jsonData.isMain ?? 0),
        status: row.status ?? jsonData.status ?? "offline",
      };
    });
  },

  hasRole(jid: string, role: string) {
    const user = getUser(jid);
    const currentIndex = hierarchy.indexOf((user?.role ?? "user") as typeof hierarchy[number]);
    const targetIndex = hierarchy.indexOf(role as typeof hierarchy[number]);

    return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
  },

  setRole(jid: string, role: string) {
    const normalizedRole = hierarchy.includes(role as UserRole) ? role : "user";
    this.setUser(jid, { role: normalizedRole });
  },

  syncDefaultUserRoles() {
    const configuredRoles = Array.isArray(globalThis.DEFAULT_USER_ROLES)
      ? globalThis.DEFAULT_USER_ROLES
      : [];

    for (const configured of configuredRoles) {
      const role = hierarchy.includes(configured?.role as UserRole)
        ? configured.role
        : "user";
      const configuredJid = String(configured?.jid ?? "").trim();
      const configuredLid = String(configured?.lid ?? "").trim();
      if (!configuredJid && !configuredLid) continue;

      const lookup = configuredJid || configuredLid;
      const current = getUserRow(lookup, configuredLid || null);
      const jid = configuredJid || current?.jid || null;
      const lid = configuredLid || current?.lid || null;
      const canonicalJid = jid && !jid.endsWith("@lid")
        ? (jid.includes("@") ? jid : `${jid}@s.whatsapp.net`)
        : null;

      if (!current) {
        const phone = canonicalJid ? normalizeJid(canonicalJid) : null;
        stmts.insertUser.run(
          canonicalJid,
          lid,
          null,
          phone,
          role,
          0,
          JSON.stringify({ jid: canonicalJid, lid, role }),
        );
        continue;
      }

      const currentData = safeJson<Record<string, any>>(current.data);
      const changed =
        current.jid !== canonicalJid ||
        current.lid !== lid ||
        current.role !== role ||
        currentData.jid !== canonicalJid ||
        currentData.lid !== lid ||
        currentData.role !== role;

      if (!changed) continue;

      const payload = {
        ...currentData,
        jid: canonicalJid,
        lid,
        role,
      };
      if (current.jid === null && lid) {
        stmts.updateUserByLid.run(
          current.username ?? null,
          canonicalJid ? normalizeJid(canonicalJid) : null,
          role,
          Number(current.is_banned ?? 0),
          JSON.stringify(payload),
          lid,
        );
      } else if (current.jid) {
        stmts.updateUser.run(
          lid,
          current.username ?? null,
          canonicalJid ? normalizeJid(canonicalJid) : null,
          role,
          Number(current.is_banned ?? 0),
          JSON.stringify(payload),
          current.jid,
        );
      }
    }
  },

  isBanned(jid: string) {
    return Number(getUser(jid).is_banned ?? 0) === 1;
  },

  ban(jid: string) {
    this.setUser(jid, { is_banned: 1, banned: true });
  },

  unban(jid: string) {
    this.setUser(jid, { is_banned: 0, banned: false });
  },
};

db.syncDefaultUserRoles();

console.log("Database initialized successfully.");