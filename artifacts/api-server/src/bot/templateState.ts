import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { randomUUID } from "crypto";

const FILE = resolve("data/templates.json");

export interface Template {
  id: string;
  name: string;
  content: string;
  channelId: string;
  createdAt: number;
  lastSentAt?: number;
}

function load(): Template[] {
  try {
    if (existsSync(FILE)) return JSON.parse(readFileSync(FILE, "utf-8")) as Template[];
  } catch {}
  return [];
}

function save(list: Template[]): void {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {}
}

export function listTemplates(): Template[] {
  return load();
}

export function createTemplate(name: string, content: string, channelId: string): Template {
  const list = load();
  const tpl: Template = { id: randomUUID(), name, content, channelId, createdAt: Date.now() };
  list.push(tpl);
  save(list);
  return tpl;
}

export function deleteTemplate(id: string): boolean {
  const list = load();
  const idx = list.findIndex(t => t.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  save(list);
  return true;
}

export function markSent(id: string): void {
  const list = load();
  const tpl = list.find(t => t.id === id);
  if (tpl) { tpl.lastSentAt = Date.now(); save(list); }
}

export function updateTemplate(id: string, fields: Partial<Pick<Template, "name" | "content" | "channelId">>): Template | null {
  const list = load();
  const tpl = list.find(t => t.id === id);
  if (!tpl) return null;
  Object.assign(tpl, fields);
  save(list);
  return tpl;
}
