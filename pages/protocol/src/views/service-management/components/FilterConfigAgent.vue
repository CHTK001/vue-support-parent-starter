<template>
  <sc-dialog
    v-model="visibleInner"
    title="Agent 过滤器配置"
    width="980px"
    :close-on-click-modal="false"
    @close="handleClose"
    draggable
  >
    <div class="agent-config-container thin-scrollbar">
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="config-grid">
          <ScFormItem label="启用状态">
            <ScSwitch v-model="config.enabled" />
          </ScFormItem>
          <ScFormItem label="API 前缀">
            <ScInput v-model="config.apiPrefix" placeholder="/v1" />
          </ScFormItem>
          <ScFormItem label="自定义聊天路径">
            <ScInput v-model="config.customChatPath" placeholder="/agent/chat" />
          </ScFormItem>
          <ScFormItem label="默认厂商">
            <ScSelect v-model="config.defaultProvider" clearable placeholder="默认第一个启用厂商">
              <ScOption
                v-for="option in providerNameOptions"
                :key="`default-${option.value}`"
                :label="option.label"
                :value="option.value"
              />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="默认超时毫秒">
            <ScInputNumber v-model="config.defaultTimeoutMillis" :min="1000" :max="300000" />
          </ScFormItem>
          <ScFormItem label="上下文压缩">
            <ScSwitch v-model="config.contextCompressionEnabled" />
          </ScFormItem>
          <ScFormItem label="压缩阈值">
            <ScInputNumber
              v-model="config.contextCompressionThreshold"
              :min="1"
              :max="500"
              :disabled="!config.contextCompressionEnabled"
            />
          </ScFormItem>
          <ScFormItem label="压缩保留消息数">
            <ScInputNumber
              v-model="config.contextCompressionRetainMessages"
              :min="1"
              :max="100"
              :disabled="!config.contextCompressionEnabled"
            />
          </ScFormItem>
          <ScFormItem label="压缩厂商">
            <ScSelect
              v-model="config.compressionProvider"
              clearable
              placeholder="默认第一个启用厂商"
              :disabled="!config.contextCompressionEnabled"
            >
              <ScOption
                v-for="option in providerNameOptions"
                :key="`compress-${option.value}`"
                :label="option.label"
                :value="option.value"
              />
            </ScSelect>
          </ScFormItem>
        </div>
      </div>

      <div class="config-section">
        <div class="section-title section-title--split">
          <div class="section-title-main">
            <IconifyIconOnline icon="ri:robot-2-line" />
            厂商配置
          </div>
          <div class="section-actions">
            <ScButton type="primary" @click="addProvider">
              <IconifyIconOnline icon="ri:add-line" />
              新增厂商
            </ScButton>
          </div>
        </div>

        <div class="provider-list">
          <div
            v-for="(provider, index) in config.providers"
            :key="provider._key"
            class="provider-card"
            :class="{ disabled: !provider.enabled }"
          >
            <div class="provider-card__header">
              <div class="provider-card__title">
                <span class="provider-card__index">#{{ index + 1 }}</span>
                <ScInput v-model="provider.name" placeholder="展示名称，如 OpenAI 主账号" />
              </div>
              <div class="provider-card__actions">
                <ScSwitch v-model="provider.enabled" size="small" />
                <ScButton type="danger" circle @click="removeProvider(index)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </ScButton>
              </div>
            </div>

            <div class="provider-card__body">
              <div class="provider-grid">
                <ScFormItem label="厂商 SPI">
                  <ScInput v-model="provider.provider" placeholder="如 openai / zhipu / deepseek" />
                </ScFormItem>
                <ScFormItem label="OpenAI 兼容">
                  <ScSwitch v-model="provider.openAiCompatible" />
                </ScFormItem>
                <ScFormItem label="API Key">
                  <ScInput
                    v-model="provider.apiKey"
                    type="password"
                    show-password
                    placeholder="输入访问密钥"
                  />
                </ScFormItem>
                <ScFormItem label="Endpoint">
                  <ScInput
                    v-model="provider.endpoint"
                    placeholder="如 https://api.openai.com/v1"
                  />
                </ScFormItem>
                <ScFormItem label="默认模型">
                  <ScSelect
                    v-model="provider.defaultModel"
                    clearable
                    filterable
                    allow-create
                    default-first-option
                    placeholder="可手输，也可点击拉取模型"
                  >
                    <ScOption
                      v-for="option in providerModels[provider._key] || []"
                      :key="`${provider._key}-${option.value}`"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ScSelect>
                </ScFormItem>
              </div>

              <div class="provider-tools">
                <ScButton
                  size="small"
                  :loading="provider.fetching"
                  :disabled="!canFetchModels(provider)"
                  @click="fetchProviderModels(provider)"
                >
                  <IconifyIconOnline icon="ri:database-2-line" />
                  获取模型
                </ScButton>
                <span class="provider-tip">
                  {{
                    canFetchModels(provider)
                      ? "从当前协议服务读取 /models"
                      : "需先填写 endpoint，且服务处于运行状态"
                  }}
                </span>
              </div>
            </div>
          </div>

          <ScEmpty v-if="config.providers.length === 0" description="尚未配置任何厂商">
            <ScButton type="primary" @click="addProvider">
              <IconifyIconOnline icon="ri:add-line" />
              添加第一个厂商
            </ScButton>
          </ScEmpty>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">
          保存配置
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { message } from "@repo/utils";
import { ScEmpty } from "@repo/components/ScEmpty";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScOption } from "@repo/components/ScOption";
import {
  getServletFilterConfig,
  saveServletFilterConfig,
} from "@/api/system-server-setting";

interface Props {
  visible: boolean;
  serverId: number;
  server?: Record<string, any>;
  filterSettingId: number;
}

interface ProviderRow {
  _key: string;
  name: string;
  provider: string;
  apiKey: string;
  endpoint: string;
  defaultModel: string;
  enabled: boolean;
  openAiCompatible: boolean;
  fetching?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [boolean];
  success: [];
}>();

const visibleInner = ref(false);
const loading = ref(false);
const providerModels = reactive<Record<string, Array<{ label: string; value: string }>>>({});
const config = reactive({
  enabled: true,
  apiPrefix: "/v1",
  customChatPath: "/agent/chat",
  defaultProvider: "",
  defaultTimeoutMillis: 30000,
  contextCompressionEnabled: false,
  contextCompressionThreshold: 24,
  contextCompressionRetainMessages: 8,
  compressionProvider: "",
  providers: [] as ProviderRow[],
});

const providerNameOptions = computed(() =>
  config.providers
    .filter((item) => item.enabled)
    .map((item) => ({
      label: item.name?.trim() || item.provider?.trim() || "未命名厂商",
      value: item.name?.trim() || item.provider?.trim() || "",
    }))
    .filter((item) => item.value),
);

const serverBaseUrl = computed(() => {
  const host = String(props.server?.systemServerHost || "127.0.0.1").trim();
  const normalizedHost = !host || host === "0.0.0.0" ? "127.0.0.1" : host;
  const port = Number(props.server?.systemServerPort || 0);
  if (!port) {
    return "";
  }
  return `http://${normalizedHost}:${port}`;
});

watch(
  () => props.visible,
  async (value) => {
    visibleInner.value = value;
    if (value) {
      await loadData();
    }
  },
  { immediate: true },
);

watch(visibleInner, (value) => {
  emit("update:visible", value);
});

function createProvider(): ProviderRow {
  return {
    _key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    provider: "",
    apiKey: "",
    endpoint: "",
    defaultModel: "",
    enabled: true,
    openAiCompatible: false,
    fetching: false,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    const data = (res?.data || {}) as Record<string, any>;
    config.enabled = toBoolean(data.enabled, true);
    config.apiPrefix = toString(data.apiPrefix, "/v1");
    config.customChatPath = toString(data.customChatPath, "/agent/chat");
    config.defaultProvider = toString(data.defaultProvider, "");
    config.defaultTimeoutMillis = toNumber(data.defaultTimeoutMillis, 30000);
    config.contextCompressionEnabled = toBoolean(data.contextCompressionEnabled, false);
    config.contextCompressionThreshold = toNumber(data.contextCompressionThreshold, 24);
    config.contextCompressionRetainMessages = toNumber(data.contextCompressionRetainMessages, 8);
    config.compressionProvider = toString(data.compressionProvider, "");
    config.providers = parseProviders(data.providersJson);
  } catch {
    config.providers = [];
  } finally {
    if (config.providers.length === 0) {
      config.providers.push(createProvider());
    }
    loading.value = false;
  }
}

function parseProviders(raw: unknown): ProviderRow[] {
  let parsed: any[] = [];
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }
  } else if (Array.isArray(raw)) {
    parsed = raw;
  }
  return parsed.map((item) => ({
    _key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: toString(item?.name, ""),
    provider: toString(item?.provider, ""),
    apiKey: toString(item?.apiKey, ""),
    endpoint: toString(item?.endpoint, ""),
    defaultModel: toString(item?.defaultModel, ""),
    enabled: toBoolean(item?.enabled, true),
    openAiCompatible: toBoolean(item?.openAiCompatible, false),
    fetching: false,
  }));
}

function addProvider() {
  config.providers.push(createProvider());
}

function removeProvider(index: number) {
  config.providers.splice(index, 1);
}

function canFetchModels(provider: ProviderRow) {
  return !!serverBaseUrl.value && !!provider.endpoint?.trim();
}

async function fetchProviderModels(provider: ProviderRow) {
  if (!canFetchModels(provider)) {
    message("请先填写 endpoint，并确保当前服务可访问", { type: "warning" });
    return;
  }
  provider.fetching = true;
  try {
    const providerName = provider.name?.trim() || provider.provider?.trim();
    const query = providerName ? `?provider=${encodeURIComponent(providerName)}` : "";
    const url = `${serverBaseUrl.value}${normalizePath(config.apiPrefix)}/models${query}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const data = await response.json();
    const models = Array.isArray(data?.data) ? data.data : [];
    providerModels[provider._key] = models
      .map((item: any) => ({
        label: String(item?.id || item?.name || ""),
        value: String(item?.id || item?.name || ""),
      }))
      .filter((item: { value: string }) => item.value);
    if (!provider.defaultModel && providerModels[provider._key]?.length) {
      provider.defaultModel = providerModels[provider._key][0].value;
    }
    message("模型列表已刷新", { type: "success" });
  } catch (error: any) {
    message(error?.message || "获取模型失败", { type: "error" });
  } finally {
    provider.fetching = false;
  }
}

async function handleSave() {
  const providers = config.providers
    .map((item) => ({
      name: item.name.trim(),
      provider: item.provider.trim(),
      apiKey: item.apiKey,
      endpoint: item.endpoint.trim(),
      defaultModel: item.defaultModel.trim(),
      enabled: !!item.enabled,
      openAiCompatible: !!item.openAiCompatible,
    }))
    .filter((item) => item.name || item.provider || item.endpoint || item.apiKey);

  const payload = {
    enabled: !!config.enabled,
    apiPrefix: normalizePath(config.apiPrefix || "/v1"),
    customChatPath: normalizePath(config.customChatPath || "/agent/chat"),
    defaultProvider: config.defaultProvider || "",
    defaultTimeoutMillis: Number(config.defaultTimeoutMillis) || 30000,
    contextCompressionEnabled: !!config.contextCompressionEnabled,
    contextCompressionThreshold: Number(config.contextCompressionThreshold) || 24,
    contextCompressionRetainMessages: Number(config.contextCompressionRetainMessages) || 8,
    compressionProvider: config.compressionProvider || "",
    providersJson: JSON.stringify(providers),
  };

  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, payload);
    if (res?.success) {
      message("保存成功，已热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
      return;
    }
    message(res?.msg || "保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}

function normalizePath(path: string) {
  const value = String(path || "").trim() || "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function toString(value: unknown, fallback = "") {
  if (value == null) {
    return fallback;
  }
  const text = String(value);
  return text.trim() ? text : fallback;
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value == null) {
    return fallback;
  }
  return String(value) === "true";
}

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}
</script>

<style scoped lang="scss">
.agent-config-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 72vh;
  overflow: auto;
  padding-right: 4px;
}

.config-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.section-title--split {
  justify-content: space-between;
}

.section-title-main,
.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 18px;
}

.provider-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.provider-card {
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fbff 0%, #ffffff 58%, #f8fafc 100%);
  overflow: hidden;
}

.provider-card.disabled {
  opacity: 0.72;
}

.provider-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: rgba(59, 130, 246, 0.06);
  border-bottom: 1px solid #e2e8f0;
}

.provider-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.provider-card__index {
  min-width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.provider-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-card__body {
  padding: 16px;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.provider-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #dbe4f0;
}

.provider-tip {
  font-size: 12px;
  color: #64748b;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 900px) {
  .config-grid,
  .provider-grid {
    grid-template-columns: 1fr;
  }

  .provider-card__header {
    flex-direction: column;
    align-items: stretch;
  }

  .provider-tools {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
