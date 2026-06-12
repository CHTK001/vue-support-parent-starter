<template>
  <section class="newapi-page system-container modern-bg">
    <div class="chat-like-header">
      <ScButton circle type="default" class="chat-like-header__back" @click="handleBackPage">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">newapi 协议管理</span>
        <span class="chat-like-header__subtitle">独立协议端口配置、使用统计与临牌管理</span>
      </div>
      <div class="chat-like-header__actions">
        <el-button type="primary" size="small" :loading="saving" @click="saveConfig">
          <IconifyIconOnline icon="ri:save-line" />
          保存配置
        </el-button>
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="overview-card__icon overview-card__icon--enabled">
          <IconifyIconOnline icon="ri:server-line" />
        </div>
        <div class="overview-card__info">
          <span class="overview-card__label">服务状态</span>
          <span class="overview-card__value" :class="enabled ? 'is-running' : 'is-stopped'">
            {{ enabled ? "运行中" : "已停止" }}
          </span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-card__icon overview-card__icon--port">
          <IconifyIconOnline icon="ri:router-line" />
        </div>
        <div class="overview-card__info">
          <span class="overview-card__label">监听端口</span>
          <span class="overview-card__value">{{ port || "--" }}</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-card__icon overview-card__icon--calls">
          <IconifyIconOnline icon="ri:bar-chart-box-line" />
        </div>
        <div class="overview-card__info">
          <span class="overview-card__label">今日调用</span>
          <span class="overview-card__value">{{ statistics?.totalCount || 0 }}</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-card__icon overview-card__icon--cost">
          <IconifyIconOnline icon="ri:money-cny-circle-line" />
        </div>
        <div class="overview-card__info">
          <span class="overview-card__label">今日费用</span>
          <span class="overview-card__value cost">{{ todayFee.toFixed(2) }} 元</span>
        </div>
      </div>
    </div>

    <!-- 配置面板 -->
    <div class="newapi-config">
      <section class="config-panel">
        <div class="config-panel__head">
          <strong>基础配置</strong>
        </div>
        <div class="config-grid">
          <div class="config-field config-field--switch">
            <div>
              <label>启用 newapi 服务</label>
              <small>开启后会启动独立 ProtocolServer 端口</small>
            </div>
            <el-switch v-model="form.enabled" />
          </div>
          <div class="config-field">
            <label>监听地址</label>
            <el-input v-model="form.host" placeholder="0.0.0.0" />
          </div>
          <div class="config-field">
            <label>监听端口</label>
            <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" />
          </div>
          <div class="config-field config-field--full">
            <label>背压缓冲大小</label>
            <el-input-number v-model="form.bufferSize" :min="256" :max="65536" :step="256" controls-position="right" />
            <small>Usage 回调积压超过此值时丢弃最旧记录</small>
          </div>
        </div>
      </section>

      <section class="config-panel">
        <div class="config-panel__head">
          <strong>协议开关</strong>
        </div>
        <div class="config-protocols">
          <label v-for="item in protocolOptions" :key="item.key" class="config-protocol">
            <span>{{ item.label }}</span>
            <el-switch v-model="form[item.key]" />
          </label>
        </div>
      </section>

      <section class="config-panel">
        <div class="config-panel__head">
          <strong>暴露模型</strong>
          <small>来自模型管理中已启用且 API 暴露的 CHAT/LLM 模型</small>
        </div>
        <div class="config-models">
          <span v-for="item in visibleModels" :key="item.sysAiModuleCode" class="config-model">
            {{ item.sysAiModuleName || item.sysAiModuleCode }}
          </span>
          <span v-if="visibleModels.length === 0" class="config-empty">暂无可暴露模型</span>
        </div>
      </section>

      <section class="config-panel">
        <div class="config-panel__head">
          <strong>临牌管理</strong>
          <small>newapi 使用 sys_ai_app_key 临时令牌鉴权</small>
        </div>
        <el-table :data="appKeys" style="width: 100%" max-height="280">
          <el-table-column prop="sysAiAppKeyName" label="名称" min-width="100" />
          <el-table-column label="临牌" min-width="220">
            <template #default="{ row }">
              <div class="token-cell">
                <code v-if="row.showKey">{{ row.sysAiAppKeyAppKey }}</code>
                <code v-else>****{{ row.sysAiAppKeyAppKeyPrefix || "" }}</code>
                <el-button size="small" link @click="toggleKeyVisibility(row)">
                  <IconifyIconOnline icon="ri:eye-line" />
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="用户ID" width="80" align="center">
            <template #default="{ row }">{{ row.sysUserId || "--" }}</template>
          </el-table-column>
          <el-table-column label="使用次数" width="100" align="center">
            <template #default="{ row }">{{ row.sysAiAppKeyUseCount || 0 }}</template>
          </el-table-column>
          <el-table-column label="最后使用" width="170">
            <template #default="{ row }">{{ row.sysAiAppKeyLastUsedTime || "--" }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center">
            <template #default="{ row }">
              <el-button size="small" link type="danger" @click="handleDeleteAppKey(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="config-panel">
        <div class="config-panel__head">
          <strong>调用日志</strong>
          <small>最近调用记录</small>
        </div>
        <el-table :data="accessLogs" style="width: 100%" max-height="280">
          <el-table-column label="请求ID" width="140">
            <template #default="{ row }">{{ row.requestId || "--" }}</template>
          </el-table-column>
          <el-table-column label="模型" width="120">
            <template #default="{ row }">{{ row.requestModel || "--" }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                {{ row.status || "unknown" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Token" width="100" align="right">
            <template #default="{ row }">{{ row.totalTokens || 0 }}</template>
          </el-table-column>
          <el-table-column label="延迟" width="100" align="right">
            <template #default="{ row }">{{ row.latencyMs ? row.latencyMs + "ms" : "--" }}</template>
          </el-table-column>
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ row.requestTime || "--" }}</template>
          </el-table-column>
          <el-table-column label="错误" min-width="150">
            <template #default="{ row }">
              <span v-if="row.errorMessage" class="error-text">{{ row.errorMessage }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { message } from "@repo/utils";
import {
  listAiGlobalSettings,
  replaceAiGlobalSettings,
  type SysAiGlobalSetting,
} from "@pages/ai/api/ai/global-setting";
import { listAiModules, type AiModule } from "@pages/ai/api/ai/module";
import { listAppKeys, deleteAppKey, type SysAiAppKey } from "@pages/ai/api/ai/app-key";
import {
  getAiTokenStatistics,
  getAiAccessLogs,
  getAiTodayFee,
} from "@pages/ai/api/ai/token";

const router = useRouter();
const handleBackPage = () => router.push("/ai/home");

const saving = ref(false);
const enabled = ref(false);
const port = ref<number | null>(null);
const statistics = ref<Record<string, unknown> | null>(null);
const todayFee = ref<number>(0);
const appKeys = ref<(SysAiAppKey & { showKey?: boolean })[]>([]);
const accessLogs = ref<Record<string, unknown>[]>([]);
const models = ref<AiModule[]>([]);

type ProtocolKey =
  | "openaiEnabled"
  | "claudeEnabled"
  | "ccsEnabled"
  | "ccSwitchEnabled"
  | "geminiEnabled"
  | "sseEnabled";

const form = reactive<Record<ProtocolKey, boolean> & {
  enabled: boolean;
  host: string;
  port: number;
  bufferSize: number;
}>({
  enabled: false,
  host: "0.0.0.0",
  port: 58085,
  bufferSize: 4096,
  openaiEnabled: true,
  claudeEnabled: true,
  ccsEnabled: true,
  ccSwitchEnabled: true,
  geminiEnabled: true,
  sseEnabled: true,
});

const protocolOptions = [
  { key: "openaiEnabled" as ProtocolKey, label: "OpenAI" },
  { key: "claudeEnabled" as ProtocolKey, label: "Claude" },
  { key: "ccsEnabled" as ProtocolKey, label: "Claude Code /responses" },
  { key: "ccSwitchEnabled" as ProtocolKey, label: "CC Switch" },
  { key: "geminiEnabled" as ProtocolKey, label: "Gemini" },
  { key: "sseEnabled" as ProtocolKey, label: "SSE 流式" },
];

const isChatModule = (item?: Pick<AiModule, "sysAiModuleType">) =>
  item?.sysAiModuleType === "CHAT" || item?.sysAiModuleType === "LLM";

const visibleModels = computed(() =>
  models.value.filter(
    (item) =>
      isChatModule(item) &&
      item.sysAiModuleStatus === 1 &&
      item.sysAiModuleApiExpose !== 0,
  ),
);

const asBool = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined || value === "") return defaultValue;
  return value === "true";
};

const upsertRuntimeSetting = (
  rows: SysAiGlobalSetting[],
  field: string,
  value: string,
  valueType: SysAiGlobalSetting["sysAiGlobalSettingValueType"],
  description: string,
  sort: number,
) => {
  const existing = rows.find((item) => item.sysAiGlobalSettingField === field);
  if (existing) {
    existing.sysAiGlobalSettingValue = value;
    existing.sysAiGlobalSettingValueType = valueType;
    existing.sysAiGlobalSettingDescription = description;
    existing.sysAiGlobalSettingSort = existing.sysAiGlobalSettingSort ?? sort;
    return;
  }
  rows.push({
    sysAiGlobalSettingField: field,
    sysAiGlobalSettingValue: value,
    sysAiGlobalSettingValueType: valueType,
    sysAiGlobalSettingDescription: description,
    sysAiGlobalSettingSort: sort,
  });
};

const loadConfig = async () => {
  const res = await listAiGlobalSettings("runtime");
  const map = new Map(
    (res.data || []).map((item) => [item.sysAiGlobalSettingField, item.sysAiGlobalSettingValue || ""]),
  );
  form.enabled = asBool(map.get("newapi_enabled"), false);
  form.host = map.get("newapi_host") || "0.0.0.0";
  const rawPort = Number(map.get("newapi_port") || 58085);
  form.port = Number.isFinite(rawPort) ? rawPort : 58085;
  port.value = form.port;
  enabled.value = form.enabled;
  form.openaiEnabled = asBool(map.get("newapi_openai_enabled"), true);
  form.claudeEnabled = asBool(map.get("newapi_claude_enabled"), true);
  form.ccsEnabled = asBool(map.get("newapi_ccs_enabled"), true);
  form.ccSwitchEnabled = asBool(map.get("newapi_cc_switch_enabled"), true);
  form.geminiEnabled = asBool(map.get("newapi_gemini_enabled"), true);
  form.sseEnabled = asBool(map.get("newapi_sse_enabled"), true);
};

const loadStats = async () => {
  try {
    const statsRes = await getAiTokenStatistics();
    statistics.value = statsRes.data || null;
  } catch {
    statistics.value = null;
  }
  try {
    const feeRes = await getAiTodayFee();
    const fee = feeRes.data;
    todayFee.value = fee?.todayFee != null ? Number(fee.todayFee) : 0;
  } catch {
    todayFee.value = 0;
  }
};

const loadAppKeys = async () => {
  try {
    const res = await listAppKeys();
    appKeys.value = (res.data || []).map((k) => ({ ...k, showKey: false }));
  } catch {
    appKeys.value = [];
  }
};

const loadAccessLogs = async () => {
  try {
    const res = await getAiAccessLogs(1, 50);
    accessLogs.value = res.data || [];
  } catch {
    accessLogs.value = [];
  }
};

const saveConfig = async () => {
  saving.value = true;
  try {
    const res = await listAiGlobalSettings("runtime");
    const rows = [...(res.data || [])];
    const safePort = Number.isFinite(form.port) ? form.port : 58085;
    upsertRuntimeSetting(rows, "newapi_enabled", String(form.enabled), "BOOLEAN", "是否启用 newapi 兼容协议服务", 80);
    upsertRuntimeSetting(rows, "newapi_host", form.host.trim() || "0.0.0.0", "STRING", "newapi 监听地址", 81);
    upsertRuntimeSetting(rows, "newapi_port", String(safePort), "NUMBER", "newapi 监听端口", 82);
    upsertRuntimeSetting(rows, "newapi_openai_enabled", String(form.openaiEnabled), "BOOLEAN", "newapi 是否启用 OpenAI 协议", 83);
    upsertRuntimeSetting(rows, "newapi_claude_enabled", String(form.claudeEnabled), "BOOLEAN", "newapi 是否启用 Claude 协议", 84);
    upsertRuntimeSetting(rows, "newapi_ccs_enabled", String(form.ccsEnabled), "BOOLEAN", "newapi 是否启用 CCS 协议", 85);
    upsertRuntimeSetting(rows, "newapi_cc_switch_enabled", String(form.ccSwitchEnabled), "BOOLEAN", "newapi 是否启用 CC Switch 协议", 86);
    upsertRuntimeSetting(rows, "newapi_gemini_enabled", String(form.geminiEnabled), "BOOLEAN", "newapi 是否启用 Gemini 协议", 87);
    upsertRuntimeSetting(rows, "newapi_sse_enabled", String(form.sseEnabled), "BOOLEAN", "newapi 是否启用流式 SSE", 88);
    await replaceAiGlobalSettings(rows, "runtime");
    message("newapi 配置已保存", { type: "success" });
    enabled.value = form.enabled;
    port.value = form.port;
  } finally {
    saving.value = false;
  }
};

const toggleKeyVisibility = (row: SysAiAppKey & { showKey?: boolean }) => {
  row.showKey = !row.showKey;
};

const handleDeleteAppKey = async (row: SysAiAppKey) => {
  try {
    await deleteAppKey(row.sysAiAppKeyId!);
    message("删除成功", { type: "success" });
    await loadAppKeys();
  } catch {
    message("删除失败", { type: "error" });
  }
};

onMounted(async () => {
  await Promise.all([loadConfig(), loadStats(), loadAppKeys(), loadAccessLogs()]);
  try {
    const modsRes = await listAiModules();
    models.value = modsRes.data || [];
  } catch {
    models.value = [];
  }
});
</script>

<style scoped lang="scss">
.newapi-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-fill-color-lighter);
}

.overview-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 20px;
  flex-shrink: 0;
}

.overview-card__icon--enabled {
  color: #10b981;
  background: color-mix(in srgb, #10b981 12%, transparent);
}

.overview-card__icon--port {
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 12%, transparent);
}

.overview-card__icon--calls {
  color: #f59e0b;
  background: color-mix(in srgb, #f59e0b 12%, transparent);
}

.overview-card__icon--cost {
  color: #ef4444;
  background: color-mix(in srgb, #ef4444 12%, transparent);
}

.overview-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.overview-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.overview-card__value {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.overview-card__value.is-running {
  color: #10b981;
}

.overview-card__value.is-stopped {
  color: #94a3b8;
}

.overview-card__value.cost {
  color: #ef4444;
}

.newapi-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-panel {
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--el-fill-color-lighter);
}

.config-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
}

.config-panel__head strong {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.config-panel__head small {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.config-field {
  display: grid;
  gap: 6px;

  label {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 700;
  }

  small {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.config-field--full {
  grid-column: 1 / -1;
}

.config-field--switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.config-protocols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.config-protocol {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.config-models {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.config-model {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #1d4ed8;
  background: color-mix(in srgb, #2563eb 12%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, #2563eb 24%, transparent);
}

.config-empty {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

.token-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  code {
    font-size: 12px;
    color: var(--el-text-color-regular);
  }
}

.error-text {
  font-size: 12px;
  color: #ef4444;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
</style>
