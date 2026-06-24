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

app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(DASHBOARD_HTML);
});

app.get("/editor", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(EDITOR_HTML);
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

    <a href="/editor" style="display:block;margin-top:18px;text-align:center;font-size:13px;color:#58a6ff;text-decoration:none;letter-spacing:0.3px;">
      ✏️ محرر الكود الذكي ←
    </a>
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
  <title>〆 𝐔𝐑 — محرر الكود</title>
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

    .header-title {
      font-size: 16px;
      font-weight: 700;
      color: #f0f6fc;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .back-link {
      font-size: 13px;
      color: #58a6ff;
      text-decoration: none;
    }

    .back-link:hover { text-decoration: underline; }

    .layout {
      display: flex;
      flex: 1;
      overflow: hidden;
      height: calc(100vh - 53px);
    }

    /* ── Sidebar ─────────────────────────── */
    .sidebar {
      width: 200px;
      background: #161b22;
      border-left: 1px solid #30363d;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-title {
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #21262d;
    }

    .file-item {
      padding: 10px 16px;
      font-size: 13px;
      color: #8b949e;
      cursor: pointer;
      border-bottom: 1px solid #21262d;
      transition: background 0.15s, color 0.15s;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
    }

    .file-item:hover { background: #21262d; color: #e6edf3; }
    .file-item.active { background: #1f3558; color: #58a6ff; border-right: 2px solid #58a6ff; }

    /* ── Main ────────────────────────────── */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .code-area {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    textarea#code-view {
      width: 100%;
      height: 100%;
      background: #0d1117;
      color: #c9d1d9;
      border: none;
      outline: none;
      padding: 16px 20px;
      font-family: 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      direction: ltr;
      text-align: left;
    }

    /* ── Bottom Panel ─────────────────────── */
    .bottom-panel {
      background: #161b22;
      border-top: 1px solid #30363d;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-shrink: 0;
    }

    .instruction-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }

    .instruction-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .instruction-label {
      font-size: 12px;
      color: #8b949e;
      font-weight: 600;
    }

    textarea#instruction {
      width: 100%;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #e6edf3;
      padding: 10px 14px;
      font-size: 14px;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      resize: none;
      outline: none;
      height: 64px;
      transition: border-color 0.2s;
    }

    textarea#instruction:focus { border-color: #58a6ff; }

    .apply-btn {
      background: #1f6feb;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0 24px;
      height: 64px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .apply-btn:hover:not(:disabled) { background: #388bfd; transform: translateY(-1px); }
    .apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Status bar ───────────────────────── */
    .status-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      min-height: 20px;
    }

    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #30363d;
      flex-shrink: 0;
    }

    .status-dot.ok   { background: #3fb950; box-shadow: 0 0 6px #3fb95088; }
    .status-dot.err  { background: #f85149; box-shadow: 0 0 6px #f8514988; }
    .status-dot.busy { background: #d29922; animation: pulse 1s infinite; }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    .status-msg { color: #8b949e; flex: 1; }
    .status-msg.ok  { color: #3fb950; }
    .status-msg.err { color: #f85149; white-space: pre-wrap; }

    .no-file {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #30363d;
      font-size: 15px;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-title">✏️ محرر الكود الذكي — 〆 𝐔𝐑</div>
    <a class="back-link" href="/">→ لوحة التحكم</a>
  </header>

  <div class="layout">
    <div class="main">
      <div class="code-area" id="code-area">
        <div class="no-file" id="no-file">اختر ملفاً من القائمة لعرضه</div>
        <textarea id="code-view" spellcheck="false" style="display:none"></textarea>
      </div>

      <div class="bottom-panel">
        <div class="status-bar">
          <div class="status-dot" id="sdot"></div>
          <span class="status-msg" id="smsg">اختر ملفاً ثم اكتب التعديل المطلوب</span>
        </div>
        <div class="instruction-row">
          <div class="instruction-wrap">
            <div class="instruction-label">التعديل المطلوب (بالعربي أو الإنجليزي)</div>
            <textarea id="instruction" placeholder="مثال: أضف رسالة ترحيب جديدة عند تشغيل البوت..." disabled></textarea>
          </div>
          <button class="apply-btn" id="apply-btn" onclick="applyEdit()" disabled>
            ⚡ طبّق
          </button>
        </div>
      </div>
    </div>

    <div class="sidebar">
      <div class="sidebar-title">الملفات</div>
      <div id="file-list"><div style="padding:12px 16px;font-size:12px;color:#8b949e;">جاري التحميل...</div></div>
    </div>
  </div>

  <script>
    let files = [];
    let selectedPath = null;
    let busy = false;

    function setStatus(type, msg) {
      const dot = document.getElementById('sdot');
      const sm  = document.getElementById('smsg');
      dot.className = 'status-dot ' + (type || '');
      sm.className  = 'status-msg '  + (type || '');
      sm.textContent = msg;
    }

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
      } catch {
        document.getElementById('file-list').innerHTML =
          '<div style="padding:12px 16px;font-size:12px;color:#f85149;">تعذّر تحميل الملفات</div>';
      }
    }

    function selectFile(path) {
      selectedPath = path;
      const f = files.find(x => x.path === path);
      if (!f) return;

      document.querySelectorAll('.file-item').forEach(el => {
        el.classList.toggle('active', el.dataset.path === path);
      });

      document.getElementById('no-file').style.display = 'none';
      const tv = document.getElementById('code-view');
      tv.style.display = 'block';
      tv.value = f.content;

      document.getElementById('instruction').disabled = false;
      document.getElementById('apply-btn').disabled = false;
      setStatus('', 'جاهز — اكتب التعديل واضغط "طبّق"');
    }

    async function applyEdit() {
      if (busy || !selectedPath) return;
      const instruction = document.getElementById('instruction').value.trim();
      if (!instruction) {
        setStatus('err', 'يرجى كتابة التعديل المطلوب أولاً');
        return;
      }

      busy = true;
      const btn = document.getElementById('apply-btn');
      btn.disabled = true;
      btn.textContent = '⏳ جاري...';
      document.getElementById('instruction').disabled = true;
      setStatus('busy', 'يتم إرسال الطلب إلى الذكاء الاصطناعي...');

      try {
        const res = await fetch('/api/code/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: selectedPath, instruction }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus('busy', 'تم التعديل — جاري إعادة بناء البوت...');
          document.getElementById('code-view').value = '⏳ جاري إعادة التشغيل...';
          pollRestart();
        } else {
          setStatus('err', data.message || 'حدث خطأ غير معروف');
          resetBtn();
        }
      } catch {
        setStatus('err', 'تعذّر الاتصال بالخادم');
        resetBtn();
      }
    }

    function resetBtn() {
      busy = false;
      const btn = document.getElementById('apply-btn');
      btn.disabled = false;
      btn.textContent = '⚡ طبّق';
      document.getElementById('instruction').disabled = false;
    }

    async function pollRestart() {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch('/api/bot/status');
          if (res.ok) {
            clearInterval(interval);
            setStatus('ok', '✅ تم تطبيق التعديل وإعادة تشغيل البوت بنجاح!');
            document.getElementById('instruction').value = '';
            await loadFiles();
            if (selectedPath) selectFile(selectedPath);
            resetBtn();
          }
        } catch { /* server still restarting */ }
        if (attempts > 60) {
          clearInterval(interval);
          setStatus('err', 'انتهت مهلة الانتظار — يرجى التحقق يدوياً');
          resetBtn();
        }
      }, 2000);
    }

    loadFiles();
  </script>
</body>
</html>`;
