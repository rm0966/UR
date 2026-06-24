import { Router } from "express";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { exec } from "child_process";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const ROOT = resolve(".");

export const EDITABLE_FILES: Record<string, string> = {
  "yuri.ts":           "artifacts/api-server/src/bot/yuri.ts",
  "db.ts":             "artifacts/api-server/src/bot/db.ts",
  "botController.ts":  "artifacts/api-server/src/bot/botController.ts",
  "routes/bot.ts":     "artifacts/api-server/src/routes/bot.ts",
};

const BUILD_CMD =
  "pnpm --filter @workspace/api-zod run build && pnpm --filter @workspace/api-server run build";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? "",
  baseURL: "https://api.groq.com/openai/v1",
});

function readFile(rel: string): string {
  try { return readFileSync(resolve(ROOT, rel), "utf-8"); } catch { return ""; }
}

function stripFences(s: string): string {
  return s.startsWith("```")
    ? s.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim()
    : s;
}

function runBuild(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(BUILD_CMD, { cwd: ROOT }, (err, _out, stderr) => {
      if (err) reject(stderr);
      else resolve("ok");
    });
  });
}

// ── GET /api/code/files ───────────────────────────────────────────────────────

router.get("/code/files", (_req, res) => {
  const files = Object.entries(EDITABLE_FILES).map(([label, rel]) => ({
    label, path: rel, content: readFile(rel),
  }));
  res.json(files);
});

// ── POST /api/code/edit  (single file, manual) ───────────────────────────────

router.post("/code/edit", async (req, res) => {
  const { filePath, instruction } = req.body as { filePath?: string; instruction?: string };

  if (!filePath || !instruction?.trim()) {
    res.status(400).json({ success: false, message: "filePath و instruction مطلوبان" });
    return;
  }
  const validPaths = Object.values(EDITABLE_FILES);
  if (!validPaths.includes(filePath)) {
    res.status(400).json({ success: false, message: "مسار الملف غير مسموح به" });
    return;
  }

  const original = readFile(filePath);
  if (!original) { res.status(500).json({ success: false, message: "تعذّر قراءة الملف" }); return; }

  let newContent = "";
  try {
    const chat = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_completion_tokens: 8000,
      messages: [
        { role: "system", content: "أنتَ محرر كود TypeScript محترف. أعِد فقط محتوى الملف المعدّل الكامل. لا شرح، لا markdown، لا نص إضافي. فقط الكود النقي." },
        { role: "user",   content: `الملف: ${filePath}\n\nالمحتوى الحالي:\n${original}\n\nالتعديل المطلوب: ${instruction}\n\nأعِد الملف كاملاً:` },
      ],
    });
    newContent = stripFences(chat.choices[0]?.message?.content?.trim() ?? "");
  } catch (err) {
    res.status(500).json({ success: false, message: `خطأ في AI: ${String(err)}` }); return;
  }

  if (!newContent) { res.status(500).json({ success: false, message: "الـ AI أعاد ردًا فارغًا" }); return; }

  writeFileSync(resolve(ROOT, filePath), newContent, "utf-8");
  try {
    await runBuild();
    res.json({ success: true, message: "✅ تم التعديل وإعادة البناء. جاري إعادة التشغيل...", modified: [filePath] });
    setTimeout(() => process.exit(1), 400);
  } catch (stderr) {
    writeFileSync(resolve(ROOT, filePath), original, "utf-8");
    res.json({ success: false, message: `فشل البناء، تمّ استعادة الأصل.\n\n${String(stderr).slice(0, 600)}` });
  }
});

// ── POST /api/code/smart-edit  (AI picks files automatically) ────────────────

interface FileChange { file: string; content: string; }

router.post("/code/smart-edit", async (req, res) => {
  const { request } = req.body as { request?: string };
  if (!request?.trim()) {
    res.status(400).json({ success: false, message: "الرجاء إدخال الطلب" }); return;
  }

  const allFiles = Object.entries(EDITABLE_FILES).map(([label, rel]) => ({
    label, path: rel, content: readFile(rel),
  }));

  const filesBlock = allFiles
    .map(f => `=== ملف: ${f.path} ===\n${f.content}`)
    .join("\n\n");

  let raw = "";
  try {
    const chat = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_completion_tokens: 12000,
      messages: [
        {
          role: "system",
          content: `أنتَ مساعد برمجة ذكي لمشروع بوت Discord مكتوب بـ TypeScript.
ستستلم محتوى عدة ملفات وطلباً من المستخدم.
مهمتك: حدّد الملفات التي تحتاج تعديلاً وأعِد محتواها الكامل بعد التعديل.

أعِد فقط JSON صالح بهذا الشكل الدقيق (لا شرح، لا markdown، لا نص خارج الـ JSON):
[
  {
    "file": "المسار/الكامل/للملف.ts",
    "content": "محتوى الملف الكامل بعد التعديل"
  }
]

إذا لم يحتج أي ملف تعديلاً، أعِد مصفوفة فارغة: []
المسارات المسموح بها فقط: ${Object.values(EDITABLE_FILES).join(", ")}`,
        },
        {
          role: "user",
          content: `الملفات الحالية:\n\n${filesBlock}\n\n---\nالطلب: ${request}`,
        },
      ],
    });
    raw = chat.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    logger.error({ err }, "smart-edit AI call failed");
    res.status(500).json({ success: false, message: `خطأ في الذكاء الاصطناعي: ${String(err)}` }); return;
  }

  const jsonStr = stripFences(raw);
  let changes: FileChange[] = [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error("ليس مصفوفة");
    changes = parsed;
  } catch {
    logger.error({ raw }, "Failed to parse AI JSON response");
    res.status(500).json({ success: false, message: "الـ AI أعاد تنسيق غير صالح. حاول مرة أخرى.", raw: raw.slice(0, 400) }); return;
  }

  if (changes.length === 0) {
    res.json({ success: true, message: "الـ AI قرر أن الكود لا يحتاج أي تعديل لهذا الطلب.", modified: [] }); return;
  }

  const validPaths = Object.values(EDITABLE_FILES);
  const backups: Record<string, string> = {};

  for (const change of changes) {
    if (!validPaths.includes(change.file)) {
      res.status(400).json({ success: false, message: `مسار غير مسموح به: ${change.file}` }); return;
    }
    backups[change.file] = readFile(change.file);
    writeFileSync(resolve(ROOT, change.file), change.content, "utf-8");
    logger.info({ file: change.file }, "smart-edit: file written");
  }

  try {
    await runBuild();
    const modified = changes.map(c => c.file);
    res.json({ success: true, message: `✅ تم التعديل بنجاح. جاري إعادة التشغيل...`, modified });
    logger.info({ modified }, "smart-edit rebuild ok, restarting");
    setTimeout(() => process.exit(1), 400);
  } catch (stderr) {
    for (const [path, original] of Object.entries(backups)) {
      writeFileSync(resolve(ROOT, path), original, "utf-8");
    }
    logger.error({ stderr }, "smart-edit build failed — restored");
    res.json({ success: false, message: `فشل البناء، تمّ استعادة الكود الأصلي.\n\n${String(stderr).slice(0, 600)}` });
  }
});

export default router;
