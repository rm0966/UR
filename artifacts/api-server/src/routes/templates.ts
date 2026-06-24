import { Router } from "express";
import {
  listTemplates, createTemplate, deleteTemplate,
  markSent, updateTemplate,
} from "../bot/templateState";
import { sendToChannel } from "../bot/botController";

const router = Router();

router.get("/templates", (_req, res) => {
  res.json(listTemplates());
});

router.post("/templates", (req, res) => {
  const { name, content, channelId } = req.body as Record<string, string>;
  if (!name?.trim() || !content?.trim() || !channelId?.trim()) {
    res.status(400).json({ success: false, message: "name و content و channelId مطلوبة" });
    return;
  }
  const tpl = createTemplate(name.trim(), content.trim(), channelId.trim());
  res.json({ success: true, template: tpl });
});

router.put("/templates/:id", (req, res) => {
  const { name, content, channelId } = req.body as Record<string, string>;
  const tpl = updateTemplate(req.params.id, {
    ...(name      ? { name }      : {}),
    ...(content   ? { content }   : {}),
    ...(channelId ? { channelId } : {}),
  });
  if (!tpl) { res.status(404).json({ success: false, message: "القالب غير موجود" }); return; }
  res.json({ success: true, template: tpl });
});

router.delete("/templates/:id", (req, res) => {
  const ok = deleteTemplate(req.params.id);
  if (!ok) { res.status(404).json({ success: false, message: "القالب غير موجود" }); return; }
  res.json({ success: true });
});

router.post("/templates/:id/send", async (req, res) => {
  const all = listTemplates();
  const tpl = all.find(t => t.id === req.params.id);
  if (!tpl) { res.status(404).json({ success: false, message: "القالب غير موجود" }); return; }

  try {
    await sendToChannel(tpl.channelId, tpl.content);
    markSent(tpl.id);
    res.json({ success: true, message: `✅ تم الإرسال إلى القناة ${tpl.channelId}` });
  } catch (err) {
    res.status(500).json({ success: false, message: String(err) });
  }
});

export default router;
