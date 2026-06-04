<template>
  <div class="settings-page">
    <!-- 令牌管理 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>令牌管理</span>
          <span class="panel-badge">{{ tokens.length }}</span>
        </div>
        <button class="btn-ghost" :disabled="tokenLoading" @click="showCreateToken = true">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          创建令牌
        </button>
      </div>

      <!-- 新建令牌弹窗 -->
      <el-dialog v-model="showCreateToken" title="创建令牌" width="420" class="dl-dialog">
        <el-form label-position="top" size="small">
          <el-form-item label="用途描述">
            <el-input v-model="newTokenDesc" placeholder="输入令牌用途描述" @keyup.enter="handleCreateToken" class="dl-input" />
          </el-form-item>
        </el-form>
        <template #footer>
          <button class="btn-ghost" @click="showCreateToken = false; newTokenDesc = ''">取消</button>
          <button class="btn-primary" :class="{ loading: tokenLoading }" :disabled="tokenLoading" @click="handleCreateToken">确认</button>
        </template>
      </el-dialog>

      <div class="token-list">
        <div v-for="t in tokens" :key="t.token" class="token-row">
          <div class="token-info">
            <span class="token-value mono">{{ t.token }}</span>
            <span class="token-desc">{{ t.description || '无描述' }}</span>
            <span class="token-time">{{ new Date(t.createdAt).toLocaleString() }}</span>
          </div>
          <div class="token-actions">
            <button class="btn-action copy" @click="handleCopyToken(t.token)">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              复制
            </button>
            <button class="btn-action delete" @click="handleDeleteToken(t.token)">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              吊销
            </button>
          </div>
        </div>
        <div v-if="tokens.length === 0" class="empty-row">暂无令牌，点击"创建令牌"生成</div>
      </div>
    </div>

    <!-- 采集管线校验器 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span>采集校验</span>
        </div>
        <button class="btn-ghost" :class="{ loading: validatorLoading }" :disabled="validatorLoading" @click="loadValidator">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>

      <div class="section-body">
        <div class="toggle-row">
          <div class="toggle-info">
            <span class="toggle-label">校验器状态</span>
            <span class="toggle-hint">关闭后所有采集请求将直接进入管线，不做校验</span>
          </div>
          <el-switch v-model="validatorEnabled" :loading="toggleLoading" @change="handleToggleValidator" class="dl-switch" />
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <span class="toggle-label">pipelineId 必填</span>
            <span class="toggle-hint">开启后必须携带 pipelineId 参数，否则采集请求将被拦截</span>
          </div>
          <el-switch v-model="requirePipelineId" :loading="toggleLoading" @change="handleToggleValidator" class="dl-switch" />
        </div>

        <div class="whitelist-section">
          <div class="wl-header">
            <span class="wl-title">IP 白名单</span>
            <span v-if="whitelist.length === 0" class="wl-hint">白名单为空，不限制 IP 访问</span>
          </div>
          <div class="wl-input-row">
            <input v-model="newWhitelistItem" placeholder="输入 IP 地址" class="form-input wl-input" @keyup.enter="handleAddWhitelist" />
            <button class="btn-ghost" :class="{ loading: wlLoading }" :disabled="wlLoading" @click="handleAddWhitelist">添加</button>
          </div>
          <div v-if="whitelist.length > 0" class="wl-tags">
            <span v-for="item in whitelist" :key="item" class="wl-tag">
              <span>{{ item }}</span>
              <button class="wl-remove" @click="handleRemoveWhitelist(item)">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 端口配置 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span>端口配置</span>
          <span class="panel-badge warn">重启后生效</span>
        </div>
        <button class="btn-ghost" :class="{ loading: saving }" :disabled="saving" @click="handleSavePorts">保存</button>
      </div>
      <div class="port-grid">
        <div v-for="port in portFields" :key="port.key" class="port-item">
          <div class="port-header">
            <span class="port-protocol" :style="{ color: port.color }">{{ port.label }}</span>
            <span class="port-desc">{{ port.desc }}</span>
          </div>
          <div class="port-input-row">
            <span class="port-prefix">:</span>
            <input
              v-model.number="(settings as any)[port.key]"
              type="number"
              :min="port.min" :max="port.max"
              class="form-input port-input"
            />
            <span v-if="isModified(port.key)" class="modified-dot" title="已修改" />
          </div>
        </div>
      </div>
    </div>

    <!-- 系统开关 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>系统开关</span>
        </div>
        <button class="btn-ghost" :class="{ loading: saving }" :disabled="saving" @click="handleSaveSystem">保存</button>
      </div>

      <div class="section-body">
        <div class="toggle-row">
          <div class="toggle-info">
            <span class="toggle-label">Token 鉴权</span>
            <span class="toggle-hint">关闭后无需令牌即可调用采集/订阅 API</span>
          </div>
          <el-switch v-model="settings.authEnabled" class="dl-switch" />
        </div>

        <div class="sys-item">
          <div class="sys-label">
            <span>限流 (req/s)</span>
            <span class="sys-hint">{{ settings.rateLimit }}</span>
          </div>
          <input v-model.number="settings.rateLimit" type="range" min="10" max="1000" step="10" class="dl-range" />
          <div class="range-labels">
            <span>10</span><span>1000</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 端口说明 -->
    <div class="page-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>端口分配说明</span>
        </div>
      </div>
      <div class="info-table">
        <div v-for="row in portInfo" :key="row.port" class="info-row">
          <span class="info-port mono" :style="{ color: row.color }">{{ row.port }}</span>
          <span class="info-name">{{ row.name }}</span>
          <span class="info-desc">{{ row.desc }}</span>
        </div>
      </div>
    </div>

    <!-- 重启提示 -->
    <Transition name="fade">
      <div v-if="showRestartTip" class="restart-tip">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>端口配置已保存。修改端口后需要重启服务才能生效。</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { fetchSettings, updateSettings, type SystemSettings } from "../../api/settings";
import { http, type ReturnResult } from "@repo/utils";

defineOptions({ name: "DatalakeSettingsPage" });

const saving = ref(false);
const showRestartTip = ref(false);

const defaults: SystemSettings = {
  httpPort: 58081, wsPort: 58082, tcpCollectPort: 58083,
  mqSubPort: 58085, tcpSubPort: 58086,
  authEnabled: true, rateLimit: 100, weatherInterval: 600,
};

const settings = reactive<SystemSettings>({ ...defaults });
const original = ref<SystemSettings>({ ...defaults });

// --- 令牌 ---
interface TokenInfo { token: string; description: string; createdAt: number; active: boolean }
const tokens = ref<TokenInfo[]>([]);
const tokenLoading = ref(false);
const showCreateToken = ref(false);
const newTokenDesc = ref("");

// --- 校验器 ---
const validatorEnabled = ref(true);
const requirePipelineId = ref(true);
const whitelist = ref<string[]>([]);
const newWhitelistItem = ref("");
const validatorLoading = ref(false);
const toggleLoading = ref(false);
const wlLoading = ref(false);

const portFields = [
  { key: "httpPort", label: "HTTP API", desc: "REST API + HTTP 采集/订阅", color: "#6366f1", min: 1024, max: 65535 },
  { key: "wsPort", label: "WebSocket", desc: "实时监控数据推送", color: "#22c55e", min: 1024, max: 65535 },
  { key: "tcpCollectPort", label: "TCP 采集", desc: "TCP socket 数据接入", color: "#3b82f6", min: 1024, max: 65535 },
  { key: "mqSubPort", label: "MQ 订阅", desc: "内存消息队列 PUB/SUB", color: "#f59e0b", min: 1024, max: 65535 },
  { key: "tcpSubPort", label: "TCP 订阅", desc: "长连接推送通道", color: "#10b981", min: 1024, max: 65535 },
] as const;

const portInfo = [
  { port: "58081", name: "HTTP API", desc: "REST 路由 + 静态文件 SPA + HTTP 采集/订阅共享", color: "#6366f1" },
  { port: "58082", name: "WebSocket", desc: "实时推送监控数据到前端仪表盘", color: "#22c55e" },
  { port: "58083", name: "TCP 采集", desc: "接收 TCP socket 客户端逐行上报数据", color: "#3b82f6" },
  { port: "58085", name: "MQ 订阅", desc: "简易内存消息队列，PUB/SUB/POLL 协议", color: "#f59e0b" },
  { port: "58086", name: "TCP 订阅", desc: "长连接通道，服务端主动 PUSH 数据到客户端", color: "#10b981" },
];

function isModified(key: string) { return (settings as any)[key] !== (original.value as any)[key]; }

// --- 令牌 CRUD ---
async function loadTokens() {
  tokenLoading.value = true;
  try {
    const res = await http.request<ReturnResult<TokenInfo[]>>("get", "/v2/datalake/auth/token");
    tokens.value = res?.data || [];
  } catch { /* ignore */ }
  finally { tokenLoading.value = false; }
}

async function handleCreateToken() {
  if (!newTokenDesc.value.trim()) { ElMessage.warning("请输入令牌描述"); return; }
  tokenLoading.value = true;
  try {
    await http.request("post", "/v2/datalake/auth/token", { data: { description: newTokenDesc.value } });
    ElMessage.success("令牌创建成功");
    showCreateToken.value = false;
    newTokenDesc.value = "";
    await loadTokens();
  } catch (e: any) { ElMessage.error(e?.msg || "创建失败"); }
  finally { tokenLoading.value = false; }
}

async function handleDeleteToken(token: string) {
  try {
    await ElMessageBox.confirm("确定吊销此令牌？吊销后使用该令牌的客户端将无法访问。", "确认吊销", {
      confirmButtonText: "吊销", cancelButtonText: "取消", type: "warning",
    });
    await http.request("delete", `/v2/datalake/auth/token?token=${token}`);
    ElMessage.success("令牌已吊销");
    await loadTokens();
  } catch { /* 取消 */ }
}

async function handleCopyToken(token: string) {
  try {
    await navigator.clipboard.writeText(token);
    ElMessage.success("令牌已复制到剪贴板");
  } catch {
    ElMessage.info(`令牌: ${token}`);
  }
}

// --- 校验器 ---
async function loadValidator() {
  validatorLoading.value = true;
  try {
    const res = await http.request<ReturnResult<any>>("get", "/v2/datalake/validator/status");
    const d = res?.data || res;
    if (d) {
      validatorEnabled.value = d.enabled ?? true;
      requirePipelineId.value = d.requirePipelineId ?? true;
      whitelist.value = d.whitelist || [];
    }
  } catch {}
  finally { validatorLoading.value = false; }
}

async function handleToggleValidator() {
  toggleLoading.value = true;
  try {
    await http.request("post", "/v2/datalake/validator/toggle", {
      data: { enabled: validatorEnabled.value, requirePipelineId: requirePipelineId.value },
    });
    ElMessage.success("校验器配置已更新");
  } catch { ElMessage.error("更新失败"); }
  finally { toggleLoading.value = false; }
}

async function handleAddWhitelist() {
  const item = newWhitelistItem.value.trim();
  if (!item) { ElMessage.warning("请输入 IP 地址"); return; }
  wlLoading.value = true;
  try {
    await http.request("post", "/v2/datalake/validator/whitelist/add", { data: { item } });
    whitelist.value.push(item);
    newWhitelistItem.value = "";
    ElMessage.success("已添加到白名单");
  } catch { ElMessage.error("添加失败"); }
  finally { wlLoading.value = false; }
}

async function handleRemoveWhitelist(item: string) {
  wlLoading.value = true;
  try {
    await http.request("post", "/v2/datalake/validator/whitelist/remove", { data: { item } });
    whitelist.value = whitelist.value.filter(w => w !== item);
    ElMessage.success("已从白名单移除");
  } catch { ElMessage.error("移除失败"); }
  finally { wlLoading.value = false; }
}

// --- 端口 ---
async function handleSavePorts() {
  saving.value = true;
  try {
    const payload: any = {};
    for (const f of portFields) { if (isModified(f.key)) payload[f.key] = (settings as any)[f.key]; }
    if (Object.keys(payload).length === 0) { ElMessage.info("无修改"); return; }
    await updateSettings(payload);
    original.value = { ...settings };
    showRestartTip.value = true;
    ElMessage.success("端口配置已保存");
    setTimeout(() => { showRestartTip.value = false; }, 8000);
  } catch (e: any) { ElMessage.error(e?.msg || "保存失败"); }
  finally { saving.value = false; }
}

async function handleSaveSystem() {
  saving.value = true;
  try {
    const payload: any = {};
    if (settings.authEnabled !== original.value.authEnabled) payload.authEnabled = settings.authEnabled;
    if (settings.rateLimit !== original.value.rateLimit) payload.rateLimit = settings.rateLimit;
    if (Object.keys(payload).length === 0) { ElMessage.info("无修改"); return; }
    await updateSettings(payload);
    original.value = { ...settings };
    ElMessage.success("系统配置已保存");
  } catch (e: any) { ElMessage.error(e?.msg || "保存失败"); }
  finally { saving.value = false; }
}

onMounted(async () => {
  try {
    const { data } = await fetchSettings();
    const s = data?.data;
    if (s) { Object.assign(settings, s); original.value = { ...settings }; }
  } catch { /* 使用默认值 */ }
  await Promise.all([loadTokens(), loadValidator()]);
});
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.35s ease;
  font-family: "Space Mono", "Courier New", monospace;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ===== 面板 ===== */
.page-panel {
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
}
.panel-badge {
  font-size: 10px;
  color: #5a6478;
  background: rgba(0, 180, 255, 0.06);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 10px;
  padding: 0 8px;
  font-family: "Space Mono", monospace;
}
.panel-badge.warn {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
}

/* ===== 幽灵按钮 ===== */
.btn-ghost {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-ghost:hover {
  border-color: rgba(0, 180, 255, 0.25);
  color: #38bdf8;
}
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-ghost.loading svg {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 主按钮（弹窗） ===== */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 11px;
  color: #38bdf8;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.35);
}
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-primary.loading svg {
  animation: spin 1s linear infinite;
}

/* ===== 表单输入框 ===== */
.form-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #e2e8f0;
  font-family: "Space Mono", monospace;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: rgba(0, 180, 255, 0.25); }
.form-input::placeholder { color: rgba(255, 255, 255, 0.2); }

/* ===== 令牌 ===== */
.token-list { display: flex; flex-direction: column; }
.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.04);
  transition: background 0.2s;
}
.token-row:hover { background: rgba(0, 180, 255, 0.03); }
.token-row:last-child { border-bottom: none; }
.token-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.token-value {
  font-size: 11px;
  color: #38bdf8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.token-desc { font-size: 11px; color: #94a3b8; }
.token-time { font-size: 10px; color: #5a6478; }
.token-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 12px;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border-radius: 5px;
  border: 1px solid;
  padding: 4px 9px;
  font-size: 10px;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-action.copy { color: #22c55e; border-color: rgba(34, 197, 94, 0.2); }
.btn-action.copy:hover { border-color: rgba(34, 197, 94, 0.4); background: rgba(34, 197, 94, 0.06); }
.btn-action.delete { color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
.btn-action.delete:hover { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.06); }

.empty-row {
  text-align: center;
  color: rgba(255, 255, 255, 0.15);
  padding: 24px 18px;
  font-size: 12px;
}

/* ===== 校验器 ===== */
.section-body {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(0, 180, 255, 0.04);
}
.toggle-info { display: flex; flex-direction: column; gap: 3px; }
.toggle-label {
  font-size: 12px;
  color: #e2e8f0;
  font-weight: 500;
}
.toggle-hint {
  font-size: 10px;
  color: #5a6478;
}

.whitelist-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wl-header { display: flex; align-items: center; gap: 10px; }
.wl-title {
  font-size: 12px;
  color: #e2e8f0;
  font-weight: 500;
}
.wl-hint { font-size: 10px; color: #5a6478; }
.wl-input-row { display: flex; gap: 8px; }
.wl-input { flex: 1; max-width: 260px; }

.wl-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.wl-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  padding: 3px 8px;
  background: rgba(0, 180, 255, 0.06);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 4px;
  color: #94a3b8;
}
.wl-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #5a6478;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}
.wl-remove:hover { color: #ef4444; }

/* ===== 端口 ===== */
.port-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px 18px;
}
.port-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 180, 255, 0.06);
  border-radius: 6px;
  padding: 14px;
  transition: border-color 0.2s;
}
.port-item:hover {
  border-color: rgba(0, 180, 255, 0.18);
}
.port-header {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 12px;
}
.port-protocol {
  font-size: 13px;
  font-weight: 700;
  font-family: "Space Mono", "Courier New", monospace;
}
.port-desc { font-size: 10px; color: #5a6478; }
.port-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.port-prefix {
  font-size: 14px;
  color: #5a6478;
  font-family: "Space Mono", monospace;
}
.port-input {
  width: 130px;
  -moz-appearance: textfield;
}
.port-input::-webkit-inner-spin-button,
.port-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.modified-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
  flex-shrink: 0;
}

/* ===== 系统开关 ===== */
.sys-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(0, 180, 255, 0.04);
}
.sys-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #e2e8f0;
}
.sys-hint {
  font-size: 11px;
  color: #38bdf8;
  font-family: "Space Mono", monospace;
}

.dl-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(0, 180, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.dl-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #38bdf8;
  border: 2px solid rgba(8, 12, 24, 0.8);
  cursor: pointer;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.3);
}
.dl-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #38bdf8;
  border: 2px solid rgba(8, 12, 24, 0.8);
  cursor: pointer;
}
.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #5a6478;
}

/* ===== 端口说明 ===== */
.info-table {
  padding: 8px 18px 14px;
  display: flex;
  flex-direction: column;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(0, 180, 255, 0.03);
  font-size: 11px;
}
.info-row:last-child { border-bottom: none; }
.info-port { min-width: 50px; font-weight: 600; font-family: "Space Mono", monospace; }
.info-name {
  min-width: 90px;
  color: #e2e8f0;
}
.info-desc {
  color: #5a6478;
  flex: 1;
}

/* ===== 重启提示 ===== */
.restart-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 6px;
  padding: 12px 18px;
  font-size: 12px;
  color: #f59e0b;
  font-family: "Space Mono", monospace;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.mono { font-family: "Space Mono", monospace; }

/* ===== Element Plus 组件重写 ===== */

/* Dialog */
:deep(.el-dialog) {
  background: #0b1020 !important;
  border: 1px solid rgba(0, 180, 255, 0.15) !important;
  border-radius: 8px !important;
  box-shadow: 0 0 40px rgba(0, 180, 255, 0.08) !important;
}
:deep(.el-dialog__title) {
  color: #e2e8f0 !important;
  font-family: "Space Mono", monospace !important;
  font-size: 13px !important;
}
:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(0, 180, 255, 0.06) !important;
  padding: 14px 18px !important;
}
:deep(.el-dialog__body) { padding: 18px !important; }
:deep(.el-dialog__footer) {
  border-top: 1px solid rgba(0, 180, 255, 0.06) !important;
  padding: 12px 18px !important;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
:deep(.el-dialog__headerbtn) { display: none; }
:deep(.el-overlay) { background: rgba(0, 0, 0, 0.6) !important; }

/* Form */
:deep(.el-form-item__label) {
  color: #94a3b8 !important;
  font-family: "Space Mono", monospace !important;
  font-size: 10px !important;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Input */
:deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(0, 180, 255, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}
:deep(.el-input__inner) {
  color: #e2e8f0 !important;
  font-family: "Space Mono", monospace !important;
  font-size: 12px !important;
}
:deep(.el-input__inner::placeholder) { color: rgba(255, 255, 255, 0.2) !important; }

/* Switch */
:deep(.el-switch__core) {
  background: rgba(0, 180, 255, 0.08) !important;
  border-color: rgba(0, 180, 255, 0.1) !important;
}
:deep(.el-switch.is-checked .el-switch__core) {
  background: rgba(56, 189, 248, 0.25) !important;
  border-color: rgba(56, 189, 248, 0.3) !important;
}
:deep(.el-switch__core::after) { background: #5a6478 !important; }
:deep(.el-switch.is-checked .el-switch__core::after) { background: #38bdf8 !important; }

/* Message box */
:deep(.el-message-box) {
  background: #0b1020 !important;
  border: 1px solid rgba(0, 180, 255, 0.15) !important;
  border-radius: 8px !important;
}
:deep(.el-message-box__title) {
  color: #e2e8f0 !important;
  font-family: "Space Mono", monospace !important;
}
:deep(.el-message-box__message) { color: #94a3b8 !important; font-size: 12px !important; }
:deep(.el-message-box__btns) { gap: 8px; }
:deep(.el-message-box__btns .el-button) {
  background: transparent !important;
  border: 1px solid rgba(0, 180, 255, 0.1) !important;
  border-radius: 6px !important;
  color: #94a3b8 !important;
  font-family: "Space Mono", monospace !important;
  font-size: 11px !important;
}
:deep(.el-message-box__btns .el-button--primary) {
  background: rgba(56, 189, 248, 0.1) !important;
  border-color: rgba(56, 189, 248, 0.2) !important;
  color: #38bdf8 !important;
}
</style>
