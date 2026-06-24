import { Router, type IRouter } from "express";
import { getBotStatus, startBot, stopBot, setBotActivity, setBotNickname } from "../bot/botController";
import { db } from "../bot/db";
import { getCommandStates, toggleCommand } from "../bot/commandState";

const router: IRouter = Router();

router.get("/bot/status", (_req, res) => {
  res.json(getBotStatus());
});

router.post("/bot/start", async (_req, res) => {
  try {
    await startBot();
    res.json({ success: true, message: "Bot is starting..." });
  } catch (err) {
    res.status(500).json({ success: false, message: String(err) });
  }
});

router.post("/bot/stop", (_req, res) => {
  try {
    stopBot();
    res.json({ success: true, message: "Bot stopped." });
  } catch (err) {
    res.status(500).json({ success: false, message: String(err) });
  }
});

router.get("/bot/history-stats", (_req, res) => {
  res.json(db.getHistoryStats());
});

router.delete("/bot/history", (_req, res) => {
  try {
    db.clearAllHistory();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: String(err) });
  }
});

router.get("/bot/commands", (_req, res) => {
  res.json(getCommandStates());
});

router.post("/bot/commands/:name/toggle", (req, res) => {
  const { name } = req.params;
  const enabled = toggleCommand(name);
  res.json({ success: true, name, enabled });
});

router.post("/bot/set-activity", async (req, res) => {
  const { type, text } = req.body as { type?: string; text?: string };
  if (!type || !text?.trim()) {
    res.status(400).json({ success: false, message: "type و text مطلوبان" }); return;
  }
  try {
    await setBotActivity(type, text.trim());
    res.json({ success: true, message: `✅ تم تغيير الحالة إلى: ${text}` });
  } catch (err) {
    res.status(500).json({ success: false, message: String(err) });
  }
});

router.post("/bot/set-nickname", async (req, res) => {
  const { guildId, nickname } = req.body as { guildId?: string; nickname?: string };
  if (!guildId?.trim()) {
    res.status(400).json({ success: false, message: "guildId مطلوب" }); return;
  }
  try {
    await setBotNickname(guildId.trim(), nickname?.trim() ?? "");
    res.json({ success: true, message: nickname?.trim() ? `✅ تم تغيير الاسم إلى: ${nickname}` : "✅ تم إزالة الاسم المستعار" });
  } catch (err) {
    res.status(500).json({ success: false, message: String(err) });
  }
});

export default router;
