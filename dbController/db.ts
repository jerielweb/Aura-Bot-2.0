import DataBase from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import "../config.ts";

const DATA_BASE_DIR = globalThis.DATA_BASE_DIR;
if (!existsSync(DATA_BASE_DIR)) {
  mkdirSync(DATA_BASE_DIR, { recursive: true });
}

const db_instance = new DataBase(`${DATA_BASE_DIR}/Aura.db`, { verbose: console.log });
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
    isMain INTEGER DEFAULT 0,
    status TEXT DEFAULT 'offline',
    data TEXT DEFAULT '{}'
  );
`);

const hierarchy = ["user", "premium", "mod", "coowner", "owner"] as const;

const stmts = {
  getUser: db_instance.prepare("SELECT * FROM users WHERE jid = ?"),
  insertUser: db_instance.prepare(
    "INSERT INTO users (jid, lid, username, phone_number, role, is_banned, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ),
  updateUser: db_instance.prepare(
    "UPDATE users SET lid = ?, username = ?, phone_number = ?, role = ?, is_banned = ?, data = ? WHERE jid = ?",
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
    "INSERT INTO bots (jid, bot_id, bot_name, isMain, status, data) VALUES (?, ?, ?, ?, ?, ?)",
  ),
  updateBot: db_instance.prepare(
    "UPDATE bots SET bot_id = ?, bot_name = ?, isMain = ?, status = ?, data = ? WHERE jid = ?",
  ),
  getAllBots: db_instance.prepare("SELECT jid, bot_id, bot_name, isMain, status, data FROM bots"),
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

function getUser(input: string) {
  const rawInput = String(input || "").trim();
  const key = normalizeJid(rawInput);
  const row = (db_instance
    .prepare("SELECT * FROM users WHERE jid = ? OR lid = ? OR jid = ? OR lid = ?")
    .get(rawInput, rawInput, key, key) as any | undefined) ?? undefined;

  if (!row) {
    const defaultUser = {
      jid: key,
      lid: rawInput.endsWith("@lid") ? rawInput : null,
      username: null,
      phone_number: key,
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
    jid: row.jid ?? jsonData.jid ?? key,
    lid: row.lid ?? jsonData.lid ?? (rawInput.endsWith("@lid") ? rawInput : null),
    username: row.username ?? jsonData.username ?? null,
    phone_number: row.phone_number ?? jsonData.phone_number ?? key,
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
      isMain: 0,
      status: "offline",
      data: {},
    };

    stmts.insertBot.run(
      key,
      defaultBot.bot_id,
      defaultBot.bot_name,
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
    const rawJid = String(dataObject?.jid ?? jid ?? key).trim() || key;
    const rawLid = String(dataObject?.lid ?? currentData?.lid ?? (rawJid.endsWith("@lid") ? rawJid : "")).trim();
    const payload = {
      ...merged.data,
      ...merged,
      jid: rawJid,
      lid: rawLid || merged.lid || null,
    };

    delete payload.data;

    const row = (db_instance
      .prepare("SELECT * FROM users WHERE jid = ? OR lid = ? OR jid = ? OR lid = ?")
      .get(rawJid, rawJid, key, key) as any | undefined) ?? undefined;

    if (!row) {
      stmts.insertUser.run(
        rawJid,
        rawLid || merged.lid || null,
        merged.username ?? null,
        merged.phone_number ?? key,
        merged.role ?? "user",
        Number(Boolean(merged.is_banned ?? 0)),
        JSON.stringify(payload),
      );
      return;
    }

    stmts.updateUser.run(
      rawLid || row.lid || merged.lid || null,
      merged.username ?? row.username ?? null,
      merged.phone_number ?? row.phone_number ?? key,
      merged.role ?? row.role ?? "user",
      Number(Boolean(merged.is_banned ?? row.is_banned ?? 0)),
      JSON.stringify(payload),
      row.jid || key,
    );
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
        Number(Boolean(merged.isMain ?? 0)),
        merged.status ?? "offline",
        JSON.stringify(payload),
      );
      return;
    }

    stmts.updateBot.run(
      merged.bot_id ?? key,
      merged.bot_name ?? row.bot_name ?? null,
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
      phone_number: normalizeJid(jid),
    });
  },

  getPrimary(groupJid: string) {
    const group = getGroup(groupJid);
    return group.primaryBot ?? null;
  },

  setPrimary(groupJid: string, botJid: string) {
    this.setGroup(groupJid, { primaryBot: normalizeJid(botJid) });
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
        bot_id: row.bot_id ?? jsonData.bot_id ?? row.jid,
        bot_name: row.bot_name ?? jsonData.bot_name ?? null,
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
    this.setUser(jid, { role });
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

console.log("Database initialized successfully.");