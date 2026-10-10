<template>
  <div class="ai-page">
    <el-card shadow="never" class="ai-card">
      <div class="ai-toolbar">
        <div class="ai-title">
          <h3>提供商管理</h3>
          <span>维护 AI 上游供应商：地址 / 鉴权 / 密钥 / 启停（sys_ai_provider），配置全局可用</span>
        </div>
        <div class="ai-actions">
          <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增提供商</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="platform" label="平台" width="120" show-overflow-tooltip />
        <el-table-column prop="base_url" label="服务地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="auth_scheme" label="鉴权" width="90" />
        <el-table-column label="密钥" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.has_credentials" type="info" size="small">
              {{ row.api_key_mask || "****" }}<template v-if="(row.api_key_count || 0) > 1"> ×{{ row.api_key_count }}</template>
            </el-tag>
            <el-tag v-else type="warning" size="small">未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="模型" width="70" align="center">
          <template #default="{ row }">{{ (row.models || []).length }}</template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled !== false"
              @change="(v: boolean) => toggleEnabled(row, v)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="70" align="center" />
        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">{{ fmtTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openTest(row)">测试连通</el-button>
            <el-button link type="warning" @click="doTestKeys(row)">密钥测试</el-button>
            <el-button link type="warning" :loading="importingId === row.provider_id" @click="doImport(row)">导入模型</el-button>
            <el-button link type="danger" @click="doDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="还没有提供商，点右上角「新增提供商」接入第一个上游" :image-size="80" />
        </template>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing ? `编辑提供商：${editing.name}` : '新增提供商'"
      width="600px"
      destroy-on-close
    >
      <el-form :model="form" label-width="120px">
        <el-form-item v-if="!editing" label="提供商标识">
          <el-input v-model="form.provider_id" placeholder="留空自动生成（唯一 ID）" clearable />
        </el-form-item>
        <el-form-item label="平台" required>
          <el-select
            v-model="form.platform"
            filterable
            allow-create
            default-first-option
            placeholder="如 openai / deepseek / custom"
            style="width: 100%"
          >
            <el-option v-for="p in platformOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="展示名，如「OpenAI 官方」（与平台判重）" />
        </el-form-item>
        <el-form-item label="服务地址" required>
          <el-input v-model="form.base_url" placeholder="https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item label="鉴权方式">
          <el-select v-model="form.auth_scheme" style="width: 100%">
            <el-option v-for="a in AUTH_OPTIONS" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证头名称">
          <el-input v-model="form.auth_header" placeholder="留空用 Authorization（如 Dots 填 api-key）" clearable />
        </el-form-item>
        <el-form-item label="认证值前缀">
          <el-input v-model="form.auth_prefix" placeholder="留空不加前缀（如「Bearer 」）" clearable />
        </el-form-item>
        <el-form-item :label="editing ? 'API 密钥' : 'API 密钥'">
          <el-input
            v-model="form.api_key"
            type="password"
            show-password
            :placeholder="editing ? '留空则保持原密钥不变' : '可稍后在编辑里补填（多把用逗号分隔）'"
            clearable
          />
        </el-form-item>
        <el-form-item label="代理">
          <el-input v-model="form.proxy" placeholder="可选，如 http://127.0.0.1:7890" clearable />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="-9999" :max="99999" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 测试连通 -->
    <el-dialog v-model="testVisible" title="测试连通（拉取上游模型目录）" width="560px" destroy-on-close>
      <el-form :model="testForm" label-width="90px">
        <el-form-item label="地址">
          <el-input v-model="testForm.apiUrl" placeholder="https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item label="Key">
          <el-input v-model="testForm.apiKey" type="password" show-password placeholder="必填" />
        </el-form-item>
        <el-form-item label="协议">
          <el-input v-model="testForm.protocol" placeholder="默认 openai" clearable />
        </el-form-item>
        <el-form-item label="代理">
          <el-input v-model="testForm.proxy" placeholder="可选" clearable />
        </el-form-item>
      </el-form>
      <div v-if="testResult" class="test-result" :class="testResult.success ? 'ok' : 'bad'">
        <p>
          <el-tag :type="testResult.success ? 'success' : 'danger'" size="small">
            {{ testResult.success ? "连通" : "失败" }}
          </el-tag>
          <span class="test-msg">{{ testResult.message || (testResult.success ? "上游响应正常" : "无错误信息") }}</span>
        </p>
        <p v-if="testResult.latency != null" class="test-latency">延迟 {{ testResult.latency }} ms</p>
      </div>
      <template #footer>
        <el-button @click="testVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testing" @click="doTest">开始测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh } from "@element-plus/icons-vue";
import {
  aiAdminApi,
  notifyFail,
  type AiProviderRow,
  type ProviderPayload,
  type TestConnectionResult,
} from "../api/aiAdminApi";

/** 平台预设（可输入任意值；与后端 PROTOCOL_PRESETS 常用项对齐） */
const PLATFORM_PRESETS = [
  "openai",
  "anthropic",
  "google",
  "zhipu",
  "deepseek",
  "qwen",
  "moonshot",
  "volcano",
  "mistral",
  "ollama",
  "openrouter",
  "new-api",
  "custom",
  "onnx",
];

/** auth_scheme 四值（见 UpstreamAuth：none 不发头；有 auth_header 发自定义头；否则 Bearer） */
const AUTH_OPTIONS = [
  { value: "api_key", label: "api_key —— 默认（Authorization: Bearer <key>）" },
  { value: "bearer", label: "bearer —— 显式 Bearer" },
  { value: "oauth", label: "oauth —— OAuth 流程" },
  { value: "none", label: "none —— 无认证（本地/内网）" },
];

const loading = ref(false);
const saving = ref(false);
const importingId = ref("");
const rows = ref<AiProviderRow[]>([]);

const platformOptions = computed(() => {
  const set = new Set(PLATFORM_PRESETS);
  if (form.platform) set.add(form.platform);
  return [...set];
});

async function load(): Promise<void> {
  loading.value = true;
  try {
    rows.value = await aiAdminApi.listProviders();
  } catch (e) {
    notifyFail(e);
  } finally {
    loading.value = false;
  }
}

function fmtTime(ts?: number): string {
  return ts ? new Date(ts).toLocaleString() : "-";
}

// ==================== 新增 / 编辑 ====================
const dialogVisible = ref(false);
const editing = ref<AiProviderRow | null>(null);
const form = reactive({
  provider_id: "",
  platform: "openai",
  name: "",
  base_url: "",
  auth_scheme: "api_key",
  auth_header: "",
  auth_prefix: "",
  api_key: "",
  proxy: "",
  enabled: true,
  sort_order: 0,
});

function resetForm(): void {
  Object.assign(form, {
    provider_id: "",
    platform: "openai",
    name: "",
    base_url: "",
    auth_scheme: "api_key",
    auth_header: "",
    auth_prefix: "",
    api_key: "",
    proxy: "",
    enabled: true,
    sort_order: rows.value.length,
  });
}

function openCreate(): void {
  editing.value = null;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: AiProviderRow): void {
  editing.value = row;
  const extra = (row.extra ?? {}) as Record<string, unknown>;
  Object.assign(form, {
    provider_id: row.provider_id,
    platform: row.platform,
    name: row.name,
    base_url: row.base_url,
    auth_scheme: row.auth_scheme || "api_key",
    auth_header: extra.auth_header == null ? "" : String(extra.auth_header),
    auth_prefix: extra.auth_prefix == null ? "" : String(extra.auth_prefix),
    // 明文 key 不回显（列表只有掩码），编辑留空即不改
    api_key: "",
    proxy: row.proxy ?? "",
    enabled: row.enabled !== false,
    sort_order: row.sort_order ?? 0,
  });
  dialogVisible.value = true;
}

function buildPayload(): ProviderPayload {
  const extra = {
    ...(editing.value?.extra ?? {}),
    auth_header: form.auth_header.trim() || null,
    auth_prefix: form.auth_prefix.trim() || null,
  };
  const payload: ProviderPayload = {
    platform: form.platform.trim(),
    name: form.name.trim(),
    base_url: form.base_url.trim(),
    auth_scheme: form.auth_scheme,
    extra,
    proxy: form.proxy.trim() || null,
    enabled: form.enabled,
    sort_order: form.sort_order,
  };
  if (form.api_key.trim()) {
    payload.credentials = { api_key: form.api_key.trim() };
  }
  if (!editing.value && form.provider_id.trim()) {
    payload.provider_id = form.provider_id.trim();
  }
  return payload;
}

async function save(): Promise<void> {
  if (!form.platform.trim() || !form.name.trim() || !form.base_url.trim()) {
    ElMessage.warning("平台 / 名称 / 服务地址为必填");
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await aiAdminApi.updateProvider(editing.value.provider_id, buildPayload());
      ElMessage.success("提供商已更新");
    } else {
      await aiAdminApi.createProvider(buildPayload());
      ElMessage.success("提供商已创建");
    }
    dialogVisible.value = false;
    await load();
  } catch (e) {
    notifyFail(e);
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(row: AiProviderRow, val: boolean): Promise<void> {
  try {
    const updated = await aiAdminApi.updateProvider(row.provider_id, { enabled: val });
    const i = rows.value.findIndex((r) => r.provider_id === row.provider_id);
    if (i >= 0) rows.value[i] = updated;
    ElMessage.success(val ? "已启用" : "已停用");
  } catch (e) {
    notifyFail(e);
  }
}

// ==================== 测试连通 ====================
const testVisible = ref(false);
const testing = ref(false);
const testForm = reactive({ provider_id: "", apiUrl: "", apiKey: "", protocol: "", proxy: "" });
const testResult = ref<TestConnectionResult | null>(null);
/** 鉴权三件套随请求体带给后端（见 UpstreamAuth.ofBody），与该提供商实际出站口径一致 */
const testAuth = ref<{ auth_scheme?: string; auth_header?: string; auth_prefix?: string }>({});

function openTest(row: AiProviderRow): void {
  const extra = (row.extra ?? {}) as Record<string, unknown>;
  Object.assign(testForm, {
    provider_id: row.provider_id,
    apiUrl: row.base_url,
    apiKey: (row.api_keys && row.api_keys[0]) || "",
    protocol: row.platform,
    proxy: row.proxy ?? "",
  });
  testAuth.value = {
    auth_scheme: row.auth_scheme || undefined,
    auth_header: extra.auth_header == null ? undefined : String(extra.auth_header),
    auth_prefix: extra.auth_prefix == null ? undefined : String(extra.auth_prefix),
  };
  testResult.value = null;
  testVisible.value = true;
}

async function doTest(): Promise<void> {
  if (!testForm.apiUrl.trim() || !testForm.apiKey.trim()) {
    ElMessage.warning("地址与 Key 均为必填");
    return;
  }
  testing.value = true;
  try {
    testResult.value = await aiAdminApi.testConnection({
      apiUrl: testForm.apiUrl.trim(),
      apiKey: testForm.apiKey.trim(),
      protocol: testForm.protocol.trim() || undefined,
      proxy: testForm.proxy.trim() || null,
      ...testAuth.value,
    });
  } catch (e) {
    notifyFail(e);
  } finally {
    testing.value = false;
  }
}

// ==================== 密钥测试 / 导入 / 删除 ====================
async function doTestKeys(row: AiProviderRow): Promise<void> {
  try {
    const r = await aiAdminApi.testKeys(row.provider_id);
    const lines = (r.results || []).map((x) => {
      const mask = String(x.key_mask ?? `#${Number(x.index ?? 0) + 1}`);
      const state = x.ok ? `可用（上游 ${x.model_count ?? 0} 个模型）` : String(x.error || "不可用");
      return `${mask}：${state}`;
    });
    void ElMessageBox.alert(
      h(
        "div",
        { style: "white-space: pre-wrap; line-height: 1.8" },
        `有效 ${r.ok_count}/${r.total}\n\n${lines.join("\n") || "（无已保存的密钥）"}`,
      ),
      "密钥测试",
      { type: r.ok_count ? "success" : "warning" },
    ).catch(() => {});
  } catch (e) {
    notifyFail(e);
  }
}

async function doImport(row: AiProviderRow): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `从「${row.name}」上游拉取模型目录并批量补录？已存在的模型会跳过（不会覆盖你改过的参数）。`,
      "导入模型",
      { type: "info", confirmButtonText: "开始导入" },
    );
  } catch {
    return;
  }
  importingId.value = row.provider_id;
  try {
    const r = await aiAdminApi.importAllModels(row.provider_id);
    ElMessage.success(
      `导入完成：新增 ${r.imported ?? 0} / 跳过 ${r.skipped ?? 0}（上游共 ${r.total ?? 0}）`,
    );
    await load();
  } catch (e) {
    notifyFail(e);
  } finally {
    importingId.value = "";
  }
}

async function doDelete(row: AiProviderRow): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `删除提供商「${row.name}」？其下 ${(row.models || []).length} 个模型与全部连接会一并删除。`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", confirmButtonClass: "el-button--danger" },
    );
  } catch {
    return;
  }
  try {
    await aiAdminApi.deleteProvider(row.provider_id);
    ElMessage.success("已删除");
    await load();
  } catch (e) {
    notifyFail(e);
  }
}

onMounted(load);
</script>

<style scoped>
.ai-page {
  padding: 16px;
}
.ai-card {
  margin-bottom: 16px;
}
.ai-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.ai-title h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
}
.ai-title span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ai-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.test-result {
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}
.test-result.ok {
  box-shadow: inset 3px 0 0 var(--el-color-success);
}
.test-result.bad {
  box-shadow: inset 3px 0 0 var(--el-color-danger);
}
.test-msg {
  margin-left: 8px;
}
.test-latency {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
