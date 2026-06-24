import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const STATE_FILE = resolve("data/commands-state.json");

export const COMMAND_DEFS = [
  { name: "chat",      description: "كلم البوت وهو يرد عليك",           emoji: "💬" },
  { name: "private",   description: "كلم البوت بشكل خاص",              emoji: "🔒" },
  { name: "summarize", description: "لخّص نصاً أو موضوعاً",            emoji: "📄" },
  { name: "remind",    description: "تذكير بوقت معين",                   emoji: "⏰" },
  { name: "note",      description: "احفظ ملاحظات",                      emoji: "📝" },
  { name: "history",   description: "عرض سجل المحادثة",                  emoji: "📜" },
  { name: "clear",     description: "مسح سجل المحادثة",                  emoji: "🗑️" },
  { name: "help",      description: "قائمة الأوامر",                     emoji: "📋" },
  { name: "nickname",  description: "ألقاب تنشّط البوت",                emoji: "🏷️" },
  { name: "game",      description: "ألعاب مع البوت",                    emoji: "🎮" },
  { name: "image",     description: "توليد صور بالذكاء الاصطناعي",     emoji: "🎨" },
  { name: "mod",       description: "أوامر الإدارة والتحكم",             emoji: "🔨" },
  { name: "ping",      description: "تحقق إذا البوت شغّال",             emoji: "📡" },
] as const;

function loadState(): Record<string, boolean> {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as Record<string, boolean>;
    }
  } catch {}
  return {};
}

function saveState(state: Record<string, boolean>): void {
  try {
    mkdirSync(dirname(STATE_FILE), { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {}
}

export function getCommandStates() {
  const state = loadState();
  return COMMAND_DEFS.map(cmd => ({
    ...cmd,
    enabled: state[cmd.name] !== false,
  }));
}

export function toggleCommand(name: string): boolean {
  const state = loadState();
  const nowEnabled = !(state[name] !== false);
  state[name] = nowEnabled;
  saveState(state);
  return nowEnabled;
}

export function isCommandEnabled(name: string): boolean {
  return loadState()[name] !== false;
}
