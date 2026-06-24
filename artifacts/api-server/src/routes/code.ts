import { Router } from "express";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { exec } from "child_process";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const ROOT = resolve(".");

const EDITABLE_FILES: Record<string, string> = {
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

router.get("/code/files", (_req, res) => {
  const files = Object.entries(EDITABLE_FILES).map(([label, rel]) => {
    let content = "";
    try { content = readFileSync(resolve(ROOT, rel), "utf-8"); } catch {}
    return { label, path: rel, content };
  });
  res.json(files);
});

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

  const absPath = resolve(ROOT, filePath);
  let original = "";
  try {
    original = readFileSync(absPath, "utf-8");
  } catch {
    res.status(500).json({ success: false, message: "تعذّر قراءة الملف" });
    return;
  }

  let newContent = "";
  try {
    const chat = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_completion_tokens: 8000,
      messages: [
        {
          role: "system",
          content:
            "أنتَ محرر كود TypeScript محترف. عند استلام محتوى ملف وتعليمات التعديل، أعِد فقط محتوى الملف المعدّل الكامل. لا شرح، لا markdown، لا أي نص إضافي. فقط الكود النقي.",
        },
        {
          role: "user",
          content: `الملف: ${filePath}\n\nالمحتوى الحالي:\n${original}\n\nالتعديل المطلوب: ${instruction}\n\nأعِد الملف كاملاً بعد التعديل:`,
        },
      ],
    });

    newContent = chat.choices[0]?.message?.content?.trim() ?? "";

    if (newContent.startsWith("```")) {
      newContent = newContent.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }
  } catch (err) {
    logger.error({ err }, "Groq code-edit failed");
    res.status(500).json({ success: false, message: `خطأ في الذكاء الاصطناعي: ${String(err)}` });
    return;
  }

  if (!newContent) {
    res.status(500).json({ success: false, message: "الذكاء الاصطناعي أعاد ردًا فارغًا" });
    return;
  }

  writeFileSync(absPath, newContent, "utf-8");
  logger.info({ filePath }, "Code file updated by AI, starting rebuild...");

  exec(BUILD_CMD, { cwd: ROOT }, (err, _stdout, stderr) => {
    if (err) {
      writeFileSync(absPath, original, "utf-8");
      logger.error({ stderr }, "Rebuild failed — restored original");
      res.json({
        success: false,
        message: `فشل البناء، تمّ استعادة الكود الأصلي.\n\n${stderr.slice(0, 800)}`,
      });
      return;
    }

    res.json({ success: true, message: "✅ تم تطبيق التعديل وإعادة البناء. جاري إعادة التشغيل..." });
    logger.info("Rebuild succeeded — restarting process");
    setTimeout(() => process.exit(1), 400);
  });
});

export default router;
