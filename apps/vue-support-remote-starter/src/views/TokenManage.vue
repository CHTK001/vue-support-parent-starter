<template>
  <div class="token-page thin-scroller">
    <div class="tp-header">
      <div class="tp-header-left">
        <h3 class="tp-title">令牌管理</h3>
        <el-tag size="small" type="info" effect="plain">{{ tokens.length }} 个令牌</el-tag>
      </div>
      <div class="tp-header-right">
        <el-button size="small" @click="fetchTokens" :loading="loading">刷新</el-button>
        <el-button size="small" type="primary" @click="showCreateDialog">创建令牌</el-button>
      </div>
    </div>

    <div v-if="error" class="tp-error">{{ error }}</div>

    <!-- 令牌列表卡片 -->
    <div class="tp-content">
      <div v-if="!loading && tokens.length === 0" class="tp-empty">暂无令牌，点击"创建令牌"添加</div>
      <div v-else class="tp-list">
        <div v-for="row in tokens" :key="row.token" class="tp-card">
          <div class="tp-card-top">
            <div class="tp-card-info">
              <div class="tp-card-row">
                <code class="tp-token-text">{{ maskToken(row.token) }}</code>
                <el-tooltip content="复制令牌">
                  <el-button text size="small" @click="copyToken(row.token)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tag v-if="isExpired(row.expiresAt)" size="small" type="danger" effect="dark">已过期</el-tag>
              </div>
              <div class="tp-card-meta">
                <span><em>用户</em> {{ row.userId || '-' }}</span>
                <span v-if="row.displayName"><em>名称</em> {{ row.displayName }}</span>
                <span><em>过期</em> {{ formatExpires(row.expiresAt) || '永不过期' }}</span>
              </div>
              <div v-if="row.accessibleAgentIds?.length" class="tp-agent-tags">
                <el-tag v-for="aid in row.accessibleAgentIds" :key="aid" size="small" type="info" effect="plain">{{ aid }}</el-tag>
              </div>
              <div v-else class="tp-all-agents">允许访问全部被控端</div>
            </div>
            <div class="tp-card-actions">
              <el-button text size="small" type="primary" @click="showEditDialog(row)">编辑</el-button>
              <el-button text size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建令牌弹窗 -->
    <el-dialog v-model="createVisible" title="创建令牌" width="500px" append-to-body>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top" size="default">
        <el-form-item label="用户标识" prop="userId">
          <el-input v-model="createForm.userId" placeholder="admin" />
        </el-form-item>
        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="createForm.displayName" placeholder="可选，默认同用户标识" />
        </el-form-item>
        <el-form-item label="绑定被控端">
          <el-select v-model="createForm.accessibleAgentIds" multiple placeholder="不选则允许访问全部" style="width:100%">
            <el-option v-for="a in agentOptions" :key="a.agentId" :label="`${a.agentId} (${a.ipAddress || '?'})`" :value="a.agentId" />
          </el-select>
          <div class="tp-hint">不选择任何被控端 = 允许访问全部</div>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-select v-model="createForm.expiresIn" style="width:100%">
            <el-option label="永不过期" value="" />
            <el-option label="1 小时后" value="1h" />
            <el-option label="6 小时后" value="6h" />
            <el-option label="12 小时后" value="12h" />
            <el-option label="1 天后" value="1d" />
            <el-option label="7 天后" value="7d" />
            <el-option label="30 天后" value="30d" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑令牌弹窗 -->
    <el-dialog v-model="editVisible" title="编辑令牌" width="500px" append-to-body>
      <el-form v-if="editingToken" label-position="top" size="default">
        <el-form-item label="令牌">
          <el-input :model-value="maskToken(editingToken.token)" disabled />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="editForm.displayName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="绑定被控端">
          <el-select v-model="editForm.accessibleAgentIds" multiple placeholder="不选则允许访问全部" style="width:100%">
            <el-option v-for="a in agentOptions" :key="a.agentId" :label="`${a.agentId} (${a.ipAddress || '?'})`" :value="a.agentId" />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-select v-model="editForm.expiresIn" style="width:100%">
            <el-option label="永不过期" value="" />
            <el-option label="1 小时后" value="1h" />
            <el-option label="6 小时后" value="6h" />
            <el-option label="12 小时后" value="12h" />
            <el-option label="1 天后" value="1d" />
            <el-option label="7 天后" value="7d" />
            <el-option label="30 天后" value="30d" />
          </el-select>
          <div v-if="editingToken.expiresAt" class="tp-hint">
            当前过期: {{ formatExpires(editingToken.expiresAt) }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="handleEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 创建成功弹窗 -->
    <el-dialog v-model="resultVisible" title="令牌创建成功" width="480px" append-to-body>
      <div class="tp-result">
        <el-alert type="warning" title="请立即复制并保存此令牌，关闭后不再显示" :closable="false" show-icon />
        <div class="tp-result-token">
          <code>{{ createdToken }}</code>
          <el-button type="primary" size="small" @click="copyToken(createdToken)">复制</el-button>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="resultVisible = false; createdToken = ''">已保存，关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from "vue";
import type { Ref } from "vue";
import { CopyDocument } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");

const apiHost = ref(window.location.hostname || "127.0.0.1");
const savedGatewayPort = Number(localStorage.getItem("gateway-manage-port") || 8083);
const apiPort = ref(savedGatewayPort);
const loading = ref(false);
const creating = ref(false);
const error = ref("");
const tokens = ref<any[]>([]);
const createVisible = ref(false);
const resultVisible = ref(false);
const createdToken = ref("");
const agentOptions = ref<any[]>([]);
const editVisible = ref(false);
const editing = ref(false);
const editingToken = ref<any>(null);
const editForm = reactive({
  displayName: "",
  accessibleAgentIds: [] as string[],
  expiresIn: "",
});

function getToken(): string {
  return injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "";
}

function getBase(): string {
  return `/api`;
}

function maskToken(token: string): string {
  if (!token) return "-";
  if (token.length <= 12) return token;
  return token.slice(0, 6) + "..." + token.slice(-4);
}

async function copyToken(token: string) {
  if (!token) { ElMessage.warning("令牌为空"); return; }
  try {
    await navigator.clipboard.writeText(token);
    ElMessage.success("令牌已复制");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = token;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select(); document.execCommand("copy");
    document.body.removeChild(ta);
    ElMessage.success("令牌已复制");
  }
}

async function fetchTokens() {
  loading.value = true;
  error.value = "";
  const token = getToken();
  if (!token) { error.value = "请先在远控中心输入客户端令牌"; loading.value = false; return; }
  const qs = `?token=${token}`;
  try {
    const [tokensResp, agentsResp] = await Promise.all([
      fetch(`${getBase()}/tokens${qs}`),
      fetch(`${getBase()}/agents${qs}`),
    ]);
    if (tokensResp.ok) {
      tokens.value = await tokensResp.json();
    } else {
      const text = await tokensResp.text();
      error.value = `获取令牌列表失败: ${tokensResp.status} ${text}`;
    }
    if (agentsResp.ok) {
      agentOptions.value = await agentsResp.json();
    }
  } catch (e: any) {
    error.value = `请求失败: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

const createForm = reactive({
  userId: "",
  displayName: "",
  accessibleAgentIds: [] as string[],
  expiresIn: "",
});

const createRules = {
  userId: [{ required: true, message: "请输入用户标识", trigger: "blur" }],
};

function computeExpiresAt(expiresIn: string): string | undefined {
  if (!expiresIn) return undefined;
  const now = Date.now();
  const match = expiresIn.match(/^(\d+)([hd])$/);
  if (!match) return undefined;
  const num = parseInt(match[1]);
  const unit = match[2];
  const ms = unit === "h" ? num * 3600000 : num * 86400000;
  return new Date(now + ms).toISOString();
}

function isExpired(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function formatExpires(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const now = Date.now();
    const diff = d.getTime() - now;
    if (diff < 0) return "已过期";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 48) return `${Math.floor(hours / 24)}天后`;
    if (hours > 0) return `${hours}小时${minutes}分后`;
    return `${minutes}分钟后`;
  } catch { return iso; }
}

async function showCreateDialog() {
  createForm.userId = "";
  createForm.displayName = "";
  createForm.accessibleAgentIds = [];
  const token = getToken();
  if (token) {
    try {
      const resp = await fetch(`${getBase()}/agents?token=${token}`);
      if (resp.ok) agentOptions.value = await resp.json();
    } catch {}
  }
  createVisible.value = true;
}

async function handleCreate() {
  creating.value = true;
  try {
    const body: Record<string, any> = {
      userId: createForm.userId || "user",
      displayName: createForm.displayName || createForm.userId || "user",
    };
    if (createForm.accessibleAgentIds.length > 0) {
      body.accessibleAgentIds = createForm.accessibleAgentIds;
    }
    const expiresAt = computeExpiresAt(createForm.expiresIn);
    if (expiresAt) body.expiresAt = expiresAt;
    const token = getToken();
    const resp = await fetch(`${getBase()}/tokens?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      const data = await resp.json();
      createdToken.value = data.token || "";
      createVisible.value = false;
      resultVisible.value = true;
      await fetchTokens();
    } else {
      const text = await resp.text();
      ElMessage.error(`创建失败: ${resp.status} ${text}`);
    }
  } catch (e: any) {
    ElMessage.error(`创建异常: ${e.message}`);
  } finally {
    creating.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除令牌 ${maskToken(row.token)} 吗？`, "确认删除", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch { return; }
  try {
    const token = getToken();
    const url = `${getBase()}/tokens?token=${token}&target=${encodeURIComponent(row.token)}`;
    const resp = await fetch(url, { method: "DELETE" });
    if (resp.ok) {
      const data = await resp.json();
      if (data.deleted) {
        ElMessage.success("令牌已删除");
        await fetchTokens();
      } else {
        ElMessage.error("删除失败：令牌未找到");
      }
    } else {
      const text = await resp.text();
      ElMessage.error(`删除失败: ${resp.status} ${text}`);
    }
  } catch (e: any) {
    ElMessage.error(`删除异常: ${e.message}`);
  }
}

function showEditDialog(row: any) {
  editingToken.value = row;
  editForm.displayName = row.displayName || "";
  editForm.accessibleAgentIds = row.accessibleAgentIds ? [...row.accessibleAgentIds] : [];
  if (row.expiresAt) {
    const diff = new Date(row.expiresAt).getTime() - Date.now();
    if (diff <= 0) editForm.expiresIn = "1h";
    else {
      const hours = diff / 3600000;
      if (hours <= 1) editForm.expiresIn = "1h";
      else if (hours <= 6) editForm.expiresIn = "6h";
      else if (hours <= 12) editForm.expiresIn = "12h";
      else if (hours <= 24) editForm.expiresIn = "1d";
      else if (hours <= 168) editForm.expiresIn = "7d";
      else editForm.expiresIn = "30d";
    }
  } else editForm.expiresIn = "";
  editVisible.value = true;
}

async function handleEdit() {
  if (!editingToken.value) return;
  editing.value = true;
  try {
    const body: Record<string, any> = { displayName: editForm.displayName };
    if (editForm.accessibleAgentIds.length > 0) body.accessibleAgentIds = editForm.accessibleAgentIds;
    else body.accessibleAgentIds = null;
    const expiresAt = computeExpiresAt(editForm.expiresIn);
    body.expiresAt = expiresAt || null;
    const token = getToken();
    const resp = await fetch(`${getBase()}/tokens?token=${token}&target=${encodeURIComponent(editingToken.value.token)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      ElMessage.success("编辑成功");
      editVisible.value = false;
      await fetchTokens();
    } else {
      const text = await resp.text();
      ElMessage.error(`编辑失败: ${resp.status} ${text}`);
    }
  } catch (e: any) {
    ElMessage.error(`编辑异常: ${e.message}`);
  } finally {
    editing.value = false;
  }
}

onMounted(() => {
  fetchTokens();
});
</script>

<style scoped>
.token-page {
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}
.tp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  position: sticky;
  top: 0;
  z-index: 5;
}

html.dark .tp-header {
  background: rgba(30,41,59,0.85);
  border-bottom-color: rgba(255,255,255,0.08);
}
.tp-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tp-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.tp-header-right {
  display: flex;
  gap: 8px;
}
.tp-error {
  color: var(--el-color-danger);
  margin: 12px 24px 0;
  font-size: 13px;
}
.tp-content {
  padding: 16px 24px;
}
.tp-empty {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 60px 0;
  font-size: 14px;
}
.tp-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tp-card {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 14px 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.tp-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

html.dark .tp-card {
  background: rgba(30,41,59,0.75);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
}

html.dark .tp-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.tp-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.tp-card-info {
  flex: 1;
  min-width: 0;
}
.tp-card-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.tp-token-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: var(--el-text-color-regular);
  user-select: all;
}
.tp-card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.tp-card-meta em {
  font-style: normal;
  color: var(--el-text-color-placeholder);
  margin-right: 4px;
}
.tp-agent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tp-all-agents {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}
.tp-card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.tp-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}
.tp-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tp-result-token {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--el-fill-color-light);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
}
.tp-result-token code {
  flex: 1;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  word-break: break-all;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.thin-scroller::-webkit-scrollbar { width: 5px; height: 5px; }
.thin-scroller::-webkit-scrollbar-track { background: transparent; }
.thin-scroller::-webkit-scrollbar-thumb { background: var(--el-border-color-darker); border-radius: 3px; }
.thin-scroller::-webkit-scrollbar-thumb:hover { background: var(--el-text-color-secondary); }
</style>
