import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(DASHBOARD_HTML);
});

app.get("/editor", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(EDITOR_HTML);
});

app.get("/commands", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(COMMANDS_HTML);
});

app.use("/api", router);

export default app;

const DASHBOARD_HTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>〆 𝐔𝐑 — لوحة التحكم</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 32px 16px;
    }

    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 20px;
      padding: 48px 56px;
      text-align: center;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }

    .bot-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #5865f2, #7289da);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 20px;
      border: 3px solid #30363d;
    }

    h1 {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 6px;
      color: #f0f6fc;
    }

    .subtitle {
      color: #8b949e;
      font-size: 13px;
      margin-bottom: 32px;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #30363d;
      transition: background 0.4s, box-shadow 0.4s;
      flex-shrink: 0;
    }

    .dot.online {
      background: #3fb950;
      box-shadow: 0 0 8px #3fb950aa;
    }

    .dot.offline {
      background: #f85149;
      box-shadow: 0 0 8px #f85149aa;
    }

    .dot.loading {
      background: #d29922;
      box-shadow: 0 0 8px #d29922aa;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .status-text {
      font-size: 16px;
      font-weight: 600;
      color: #e6edf3;
    }

    .uptime {
      color: #8b949e;
      font-size: 13px;
      margin-bottom: 36px;
      min-height: 20px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 44px;
      border-radius: 12px;
      border: none;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      letter-spacing: 0.5px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-start {
      background: #238636;
      color: #fff;
    }

    .btn-start:hover:not(:disabled) {
      background: #2ea043;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px #23863655;
    }

    .btn-stop {
      background: #da3633;
      color: #fff;
    }

    .btn-stop:hover:not(:disabled) {
      background: #f85149;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px #da363355;
    }

    .btn-loading {
      background: #21262d;
      color: #8b949e;
    }

    .btn-danger {
      background: transparent;
      color: #f85149;
      border: 1px solid #f8514955;
      font-size: 13px;
      padding: 9px 0;
      font-weight: 600;
    }

    .btn-danger:hover:not(:disabled) {
      background: #f8514915;
      border-color: #f85149;
    }

    .divider {
      border: none;
      border-top: 1px solid #21262d;
      margin: 24px 0 20px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #8b949e;
    }

    .tokens-section {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0 0;
      text-align: right;
    }

    .tokens-title {
      font-size: 12px;
      font-weight: 700;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tokens-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }

    .token-stat {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
    }

    .token-stat .val {
      font-size: 22px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .token-stat .lbl {
      font-size: 11px;
      color: #8b949e;
    }

    .val-used   { color: #f85149; }
    .val-free   { color: #3fb950; }
    .val-users  { color: #58a6ff; }
    .val-max    { color: #8b949e; }

    .bar-wrap {
      background: #21262d;
      border-radius: 6px;
      height: 6px;
      overflow: hidden;
      margin-bottom: 14px;
    }

    .bar-fill {
      height: 100%;
      border-radius: 6px;
      background: linear-gradient(90deg, #3fb950, #f85149);
      transition: width 0.5s ease;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: #21262d;
      border: 1px solid #30363d;
      color: #e6edf3;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      opacity: 0;
      transition: all 0.3s;
      pointer-events: none;
      white-space: nowrap;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="bot-icon">🤖</div>
    <h1>〆 𝐔𝐑</h1>
    <p class="subtitle">Arabic AI Discord Bot</p>

    <div class="status-row">
      <div class="dot loading" id="dot"></div>
      <span class="status-text" id="status-text">جاري التحقق...</span>
    </div>
    <p class="uptime" id="uptime"></p>

    <button class="btn btn-loading" id="toggle-btn" disabled onclick="toggle()">
      ...</button>

    <div class="tokens-section">
      <div class="tokens-title">💬 ذاكرة المحادثات</div>
      <div class="tokens-grid">
        <div class="token-stat">
          <div class="val val-used" id="tok-used">—</div>
          <div class="lbl">رسائل مستخدمة</div>
        </div>
        <div class="token-stat">
          <div class="val val-free" id="tok-free">—</div>
          <div class="lbl">رسائل متاحة</div>
        </div>
        <div class="token-stat">
          <div class="val val-users" id="tok-users">—</div>
          <div class="lbl">مستخدمين نشطين</div>
        </div>
        <div class="token-stat">
          <div class="val val-max" id="tok-max">—</div>
          <div class="lbl">سعة كاملة</div>
        </div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill" id="tok-bar" style="width:0%"></div>
      </div>
      <button class="btn btn-danger" id="clear-btn" onclick="clearHistory()">
        🗑️ حذف كل المحادثات المحفوظة
      </button>
    </div>

    <hr class="divider" />
    <div class="info-row">
      <span id="bot-tag">—</span>
      <span id="last-check">—</span>
    </div>

    <div style="display:flex;gap:10px;margin-top:18px;">
      <a href="/commands" style="flex:1;display:block;text-align:center;font-size:13px;color:#58a6ff;text-decoration:none;background:#161b22;border:1px solid #30363d;border-radius:8px;padding:9px 0;">
        ⚡ الأوامر
      </a>
      <a href="/editor" style="flex:1;display:block;text-align:center;font-size:13px;color:#58a6ff;text-decoration:none;background:#161b22;border:1px solid #30363d;border-radius:8px;padding:9px 0;">
        ✏️ محرر الكود
      </a>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let currentRunning = null;
    let busy = false;

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function formatUptime(ms) {
      if (!ms) return '';
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      if (d > 0) return 'وقت التشغيل: ' + d + ' يوم ' + (h % 24) + ' ساعة';
      if (h > 0) return 'وقت التشغيل: ' + h + ' ساعة ' + (m % 60) + ' دقيقة';
      if (m > 0) return 'وقت التشغيل: ' + m + ' دقيقة ' + (s % 60) + ' ثانية';
      return 'وقت التشغيل: ' + s + ' ثانية';
    }

    function updateUI(data) {
      const dot = document.getElementById('dot');
      const statusText = document.getElementById('status-text');
      const uptime = document.getElementById('uptime');
      const btn = document.getElementById('toggle-btn');
      const botTag = document.getElementById('bot-tag');
      const lastCheck = document.getElementById('last-check');

      dot.className = 'dot ' + (data.running ? 'online' : 'offline');
      statusText.textContent = data.running ? 'شغال ✓' : 'متوقف';
      uptime.textContent = data.running ? formatUptime(data.uptimeMs) : '';
      botTag.textContent = data.tag || '—';
      lastCheck.textContent = 'آخر تحقق: ' + new Date().toLocaleTimeString('ar');

      currentRunning = data.running;

      if (!busy) {
        if (data.running) {
          btn.className = 'btn btn-stop';
          btn.textContent = '⏹ إيقاف البوت';
          btn.disabled = false;
        } else {
          btn.className = 'btn btn-start';
          btn.textContent = '▶ تشغيل البوت';
          btn.disabled = false;
        }
      }
    }

    function updateTokenStats(s) {
      document.getElementById('tok-used').textContent  = s.usedSlots;
      document.getElementById('tok-free').textContent  = s.freeSlots;
      document.getElementById('tok-users').textContent = s.users;
      document.getElementById('tok-max').textContent   = s.maxSlots || '—';
      const pct = s.maxSlots > 0 ? Math.round((s.usedSlots / s.maxSlots) * 100) : 0;
      document.getElementById('tok-bar').style.width = pct + '%';
    }

    async function fetchStatus() {
      try {
        const [statusRes, statsRes] = await Promise.all([
          fetch('/api/bot/status'),
          fetch('/api/bot/history-stats'),
        ]);
        const data  = await statusRes.json();
        const stats = await statsRes.json();
        updateUI(data);
        updateTokenStats(stats);
      } catch {
        document.getElementById('dot').className = 'dot loading';
        document.getElementById('status-text').textContent = 'تعذّر الاتصال';
      }
    }

    async function toggle() {
      if (busy) return;
      busy = true;

      const btn = document.getElementById('toggle-btn');
      btn.disabled = true;
      btn.className = 'btn btn-loading';

      if (currentRunning) {
        btn.textContent = '⏳ جاري الإيقاف...';
        try {
          await fetch('/api/bot/stop', { method: 'POST' });
          showToast('✅ تم إيقاف البوت');
        } catch {
          showToast('❌ حدث خطأ أثناء الإيقاف');
        }
      } else {
        btn.textContent = '⏳ جاري التشغيل...';
        try {
          await fetch('/api/bot/start', { method: 'POST' });
          showToast('✅ البوت بدأ التشغيل...');
        } catch {
          showToast('❌ حدث خطأ أثناء التشغيل');
        }
      }

      setTimeout(() => {
        busy = false;
        fetchStatus();
      }, 2500);
    }

    async function clearHistory() {
      if (!confirm('تأكيد: سيتم حذف جميع المحادثات المحفوظة لكل المستخدمين. هل تريد المتابعة؟')) return;
      const btn = document.getElementById('clear-btn');
      btn.disabled = true;
      btn.textContent = '⏳ جاري الحذف...';
      try {
        await fetch('/api/bot/history', { method: 'DELETE' });
        showToast('🗑️ تم حذف جميع المحادثات بنجاح');
        await fetchStatus();
      } catch {
        showToast('❌ حدث خطأ أثناء الحذف');
      } finally {
        btn.disabled = false;
        btn.textContent = '🗑️ حذف كل المحادثات المحفوظة';
      }
    }

    fetchStatus();
    setInterval(fetchStatus, 5000);
  </script>
</body>
</html>`;

const EDITOR_HTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>〆 𝐔𝐑 — مطوّر الكود</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: #161b22;
      border-bottom: 1px solid #30363d;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .header-title { font-size: 16px; font-weight: 700; color: #f0f6fc; }
    .back-link { font-size: 13px; color: #58a6ff; text-decoration: none; }
    .back-link:hover { text-decoration: underline; }

    /* ── Layout ───────────────────────────── */
    .layout {
      display: flex;
      flex: 1;
      overflow: hidden;
      height: calc(100vh - 53px);
    }

    /* ── Sidebar (file viewer) ────────────── */
    .sidebar {
      width: 220px;
      background: #161b22;
      border-left: 1px solid #30363d;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-title {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 700;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: .5px;
      border-bottom: 1px solid #21262d;
    }
    .file-item {
      padding: 9px 14px;
      font-size: 12px;
      color: #8b949e;
      cursor: pointer;
      border-bottom: 1px solid #21262d;
      font-family: 'Fira Code', monospace;
      transition: background .15s, color .15s;
    }
    .file-item:hover  { background: #21262d; color: #e6edf3; }
    .file-item.active { background: #1f3558; color: #58a6ff; border-right: 2px solid #58a6ff; }

    .code-preview {
      flex: 1;
      overflow: auto;
      background: #0d1117;
    }
    .code-preview pre {
      padding: 14px 16px;
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 11.5px;
      line-height: 1.65;
      color: #c9d1d9;
      direction: ltr;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .no-file-hint {
      padding: 24px 14px;
      font-size: 12px;
      color: #30363d;
      text-align: center;
    }

    /* ── Main chat area ───────────────────── */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Steps log ───────────────────────── */
    .steps-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      animation: fadeIn .3s ease;
    }

    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

    .step-icon {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .step-icon.thinking { background: #21262d; color: #d29922; animation: pulse 1s infinite; }
    .step-icon.ok       { background: #0d2818; color: #3fb950; }
    .step-icon.err      { background: #2d0f0e; color: #f85149; }
    .step-icon.info     { background: #1a2332; color: #58a6ff; }
    .step-icon.build    { background: #1e1b2e; color: #a371f7; }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

    .step-body { flex: 1; }
    .step-label { font-size: 12px; color: #8b949e; margin-bottom: 3px; }
    .step-text  { font-size: 14px; color: #e6edf3; line-height: 1.5; white-space: pre-wrap; }
    .step-text.mono {
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      color: #f85149;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 8px 12px;
      margin-top: 4px;
    }

    .modified-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .chip {
      background: #0d2818;
      border: 1px solid #3fb95055;
      color: #3fb950;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 20px;
      font-family: 'Fira Code', monospace;
      cursor: pointer;
    }
    .chip:hover { background: #1a3d28; }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: #30363d;
    }
    .empty-icon { font-size: 48px; }
    .empty-text { font-size: 15px; }
    .example-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      max-width: 480px;
    }
    .example-chip {
      background: #161b22;
      border: 1px solid #30363d;
      color: #8b949e;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      transition: border-color .2s, color .2s;
    }
    .example-chip:hover { border-color: #58a6ff; color: #58a6ff; }

    /* ── Input bar ────────────────────────── */
    .input-bar {
      background: #161b22;
      border-top: 1px solid #30363d;
      padding: 16px 20px;
      display: flex;
      gap: 10px;
      align-items: flex-end;
      flex-shrink: 0;
    }

    textarea#request {
      flex: 1;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 10px;
      color: #e6edf3;
      padding: 11px 14px;
      font-size: 14px;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      resize: none;
      outline: none;
      min-height: 48px;
      max-height: 120px;
      line-height: 1.5;
      transition: border-color .2s;
    }
    textarea#request:focus { border-color: #58a6ff; }

    .send-btn {
      background: #1f6feb;
      color: #fff;
      border: none;
      border-radius: 10px;
      width: 48px; height: 48px;
      font-size: 18px;
      cursor: pointer;
      transition: background .2s, transform .1s;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .send-btn:hover:not(:disabled) { background: #388bfd; transform: translateY(-1px); }
    .send-btn:disabled { opacity: .45; cursor: not-allowed; }

    @media (max-width: 640px) {
      .sidebar { display: none; }
      .layout { height: calc(100vh - 49px); }
      header { padding: 12px 16px; }
      .header-title { font-size: 14px; }
      .steps-area { padding: 14px 14px; }
      .input-bar { padding: 10px 12px; gap: 8px; }
      textarea#request { font-size: 14px; }
      .send-btn { width: 42px; height: 42px; font-size: 16px; }
      .step-text { font-size: 13px; }
      .empty-icon { font-size: 36px; }
      .empty-text { font-size: 13px; }
      .example-chip { font-size: 11px; padding: 5px 11px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-title">🤖 مطوّر الكود الذكي — 〆 𝐔𝐑</div>
    <a class="back-link" href="/">→ لوحة التحكم</a>
  </header>

  <div class="layout">

    <!-- ── Main ── -->
    <div class="main">
      <div class="steps-area" id="steps-area">
        <div class="empty-state" id="empty-state">
          <div class="empty-icon">✨</div>
          <div class="empty-text">اكتب ما تريد تغييره في البوت</div>
          <div class="example-chips">
            <div class="example-chip" onclick="useExample(this)">أضف أمر /help يعرض قائمة الأوامر</div>
            <div class="example-chip" onclick="useExample(this)">غيّر رسالة الترحيب عند تشغيل البوت</div>
            <div class="example-chip" onclick="useExample(this)">زد الـ cooldown لـ 10 ثواني</div>
            <div class="example-chip" onclick="useExample(this)">اجعل البوت يرد بالإنجليزي على الرسائل الإنجليزية</div>
          </div>
        </div>
      </div>

      <div class="input-bar">
        <textarea id="request" rows="1" placeholder="اكتب ما تريد تغييره في البوت..." onkeydown="handleKey(event)"></textarea>
        <button class="send-btn" id="send-btn" onclick="sendRequest()" title="إرسال">⚡</button>
      </div>
    </div>

    <!-- ── Sidebar (file viewer) ── -->
    <div class="sidebar">
      <div class="sidebar-title">عرض الملفات</div>
      <div id="file-list"><div style="padding:12px 14px;font-size:12px;color:#8b949e;">جاري التحميل...</div></div>
      <div class="code-preview" id="code-preview">
        <div class="no-file-hint">اضغط على ملف لعرضه</div>
      </div>
    </div>
  </div>

  <script>
    let files = [];
    let busy = false;

    /* ── auto-resize textarea ── */
    const reqTA = document.getElementById('request');
    reqTA.addEventListener('input', () => {
      reqTA.style.height = 'auto';
      reqTA.style.height = Math.min(reqTA.scrollHeight, 120) + 'px';
    });

    function handleKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRequest(); }
    }

    function useExample(el) {
      reqTA.value = el.textContent;
      reqTA.focus();
    }

    /* ── Steps log ── */
    function addStep(type, label, text, mono = false) {
      const icons = { thinking:'⏳', ok:'✅', err:'❌', info:'ℹ️', build:'🔨' };
      document.getElementById('empty-state')?.remove();

      const div = document.createElement('div');
      div.className = 'step';
      div.innerHTML =
        '<div class="step-icon ' + type + '">' + icons[type] + '</div>' +
        '<div class="step-body">' +
          '<div class="step-label">' + label + '</div>' +
          (text ? '<div class="step-text' + (mono ? ' mono' : '') + '">' + escHtml(text) + '</div>' : '') +
        '</div>';
      document.getElementById('steps-area').appendChild(div);
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return div;
    }

    function addModifiedChips(files) {
      const area = document.getElementById('steps-area');
      const last = area.lastElementChild?.querySelector('.step-body');
      if (!last) return;
      const chips = document.createElement('div');
      chips.className = 'modified-chips';
      files.forEach(f => {
        const c = document.createElement('div');
        c.className = 'chip';
        c.textContent = f.split('/').pop();
        c.title = f;
        c.onclick = () => selectFile(f);
        chips.appendChild(c);
      });
      last.appendChild(chips);
    }

    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /* ── File sidebar ── */
    async function loadFiles() {
      try {
        const res = await fetch('/api/code/files');
        files = await res.json();
        const list = document.getElementById('file-list');
        list.innerHTML = '';
        files.forEach(f => {
          const el = document.createElement('div');
          el.className = 'file-item';
          el.textContent = f.label;
          el.dataset.path = f.path;
          el.onclick = () => selectFile(f.path);
          list.appendChild(el);
        });
      } catch {}
    }

    function selectFile(path) {
      const f = files.find(x => x.path === path);
      if (!f) return;
      document.querySelectorAll('.file-item').forEach(el =>
        el.classList.toggle('active', el.dataset.path === path));
      const preview = document.getElementById('code-preview');
      preview.innerHTML = '<pre>' + escHtml(f.content) + '</pre>';
    }

    /* ── Send request ── */
    async function sendRequest() {
      if (busy) return;
      const request = reqTA.value.trim();
      if (!request) return;

      busy = true;
      reqTA.disabled = true;
      document.getElementById('send-btn').disabled = true;

      addStep('info', 'طلبك', request);
      const thinkStep = addStep('thinking', 'الذكاء الاصطناعي', 'يقرأ الكود ويحدد التعديلات المطلوبة...');

      let data;
      try {
        const res = await fetch('/api/code/smart-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request }),
        });
        data = await res.json();
      } catch {
        thinkStep.querySelector('.step-icon').className = 'step-icon err';
        thinkStep.querySelector('.step-icon').textContent = '❌';
        thinkStep.querySelector('.step-text').textContent = 'تعذّر الاتصال بالخادم';
        resetInput(); return;
      }

      thinkStep.remove();

      if (!data.success) {
        addStep('err', 'حدث خطأ', data.message, data.message?.includes('\n'));
        resetInput(); return;
      }

      if (data.modified?.length === 0) {
        addStep('ok', 'نتيجة', data.message);
        resetInput(); return;
      }

      const buildStep = addStep('build', 'البناء وإعادة التشغيل', 'تم التعديل — جاري البناء...');
      addModifiedChips(data.modified ?? []);

      pollRestart(buildStep, data.modified ?? []);
      reqTA.value = '';
      reqTA.style.height = 'auto';
    }

    function resetInput() {
      busy = false;
      reqTA.disabled = false;
      document.getElementById('send-btn').disabled = false;
      reqTA.focus();
    }

    async function pollRestart(stepEl, modified) {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch('/api/bot/status');
          if (res.ok) {
            clearInterval(interval);
            stepEl.querySelector('.step-icon').className = 'step-icon ok';
            stepEl.querySelector('.step-icon').textContent = '✅';
            stepEl.querySelector('.step-label').textContent = 'اكتمل بنجاح';
            stepEl.querySelector('.step-text').textContent = 'تم تطبيق التعديل وإعادة تشغيل البوت! 🎉';
            await loadFiles();
            if (modified.length > 0) selectFile(modified[0]);
            resetInput();
          }
        } catch {}
        if (attempts > 90) {
          clearInterval(interval);
          stepEl.querySelector('.step-icon').className = 'step-icon err';
          stepEl.querySelector('.step-icon').textContent = '❌';
          stepEl.querySelector('.step-text').textContent = 'انتهت مهلة الانتظار — تحقق يدوياً';
          resetInput();
        }
      }, 2000);
    }

    loadFiles();
  </script>
</body>
</html>`;

const COMMANDS_HTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>〆 𝐔𝐑 — الأوامر</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #0d1117; color: #e6edf3;
      min-height: 100vh; padding: 24px 16px;
    }
    header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; max-width: 560px; margin-inline: auto;
    }
    .header-title { font-size: 18px; font-weight: 700; color: #f0f6fc; }
    .back-link { font-size: 13px; color: #58a6ff; text-decoration: none; }
    .back-link:hover { text-decoration: underline; }
    .card {
      background: #161b22; border: 1px solid #30363d;
      border-radius: 14px; max-width: 560px; margin: 0 auto;
      overflow: hidden;
    }
    .cmd-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px; border-bottom: 1px solid #21262d;
      transition: background .15s;
    }
    .cmd-row:last-child { border-bottom: none; }
    .cmd-emoji { font-size: 20px; flex-shrink: 0; }
    .cmd-info { flex: 1; min-width: 0; }
    .cmd-name { font-size: 14px; font-weight: 700; color: #e6edf3; font-family: monospace; }
    .cmd-desc { font-size: 12px; color: #8b949e; margin-top: 2px; }
    /* toggle switch */
    .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; inset: 0; background: #30363d;
      border-radius: 24px; cursor: pointer; transition: .3s;
    }
    .slider::before {
      content: ''; position: absolute;
      width: 18px; height: 18px; left: 3px; top: 3px;
      background: #8b949e; border-radius: 50%; transition: .3s;
    }
    .toggle input:checked + .slider { background: #238636; }
    .toggle input:checked + .slider::before { transform: translateX(20px); background: #fff; }
    .loading-text { padding: 24px; text-align: center; color: #8b949e; font-size: 14px; }
    .toast {
      position: fixed; bottom: 20px; left: 50%;
      transform: translateX(-50%) translateY(60px);
      background: #21262d; border: 1px solid #30363d;
      color: #e6edf3; padding: 10px 20px;
      border-radius: 8px; font-size: 13px;
      opacity: 0; transition: all .3s; pointer-events: none;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>
  <header>
    <div class="header-title">⚡ إدارة الأوامر</div>
    <a class="back-link" href="/">→ لوحة التحكم</a>
  </header>

  <div class="card" id="cmd-list">
    <div class="loading-text">جاري التحميل...</div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
    }

    async function loadCommands() {
      const res = await fetch('/api/bot/commands');
      const cmds = await res.json();
      const list = document.getElementById('cmd-list');
      list.innerHTML = '';
      cmds.forEach(cmd => {
        const row = document.createElement('div');
        row.className = 'cmd-row';
        row.innerHTML =
          '<div class="cmd-emoji">' + cmd.emoji + '</div>' +
          '<div class="cmd-info">' +
            '<div class="cmd-name">/' + cmd.name + '</div>' +
            '<div class="cmd-desc">' + cmd.description + '</div>' +
          '</div>' +
          '<label class="toggle">' +
            '<input type="checkbox" ' + (cmd.enabled ? 'checked' : '') + ' onchange="toggle(\'' + cmd.name + '\', this)" />' +
            '<span class="slider"></span>' +
          '</label>';
        list.appendChild(row);
      });
    }

    async function toggle(name, el) {
      el.disabled = true;
      try {
        const res = await fetch('/api/bot/commands/' + name + '/toggle', { method: 'POST' });
        const data = await res.json();
        el.checked = data.enabled;
        showToast((data.enabled ? '✅ تم تفعيل' : '⛔ تم تعطيل') + ' /' + name);
      } catch {
        showToast('❌ حدث خطأ');
        el.checked = !el.checked;
      }
      el.disabled = false;
    }

    loadCommands();
  </script>
</body>
</html>`;
