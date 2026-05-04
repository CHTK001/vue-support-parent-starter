<template>
  <section class="server-selector">
    <div class="server-selector-card">
      <div class="server-selector-icon">
        <IconifyIconOnline icon="ep:server" :style="{ fontSize: '48px', color: 'var(--el-color-primary)' }" />
      </div>
      <h3>选择服务器</h3>
      <p class="server-selector-desc">选择一个 SSH 服务器来管理软件。连接后将可浏览和安装软件。</p>

      <!-- Connection method toggle -->
      <ElRadioGroup v-model="connectionMethod" class="method-tabs" :disabled="connecting">
        <ElRadioButton value="saved">已保存的服务器</ElRadioButton>
        <ElRadioButton value="quick">快速连接</ElRadioButton>
      </ElRadioGroup>

      <!-- ── Saved sources ── -->
      <div v-if="connectionMethod === 'saved'" class="server-selector-form">
        <div v-if="sources.length === 0" class="server-selector-empty">
          <ElEmpty description="未找到 SSH 服务器">
            <p class="server-selector-hint">
              请先在数据源中添加一个 SSH 或 NGINX 类型的连接，或切换到"快速连接"直接输入服务器信息。
            </p>
          </ElEmpty>
        </div>

        <ElSelect
          v-else
          v-model="selectedSourceId"
          placeholder="选择已保存的服务器..."
          style="width: 100%"
          size="large"
          :disabled="connecting"
        >
          <ElOption
            v-for="s in sources"
            :key="s.sourceId"
            :label="sourceLabel(s)"
            :value="s.sourceId"
          >
            <div class="source-option">
              <span class="source-name">{{ s.connectionName }}</span>
              <span class="source-addr">{{ s.host }}:{{ s.port }}</span>
            </div>
          </ElOption>
        </ElSelect>
      </div>

      <!-- ── Quick connect ── -->
      <div v-else class="quick-connect-form">
        <div class="form-row">
          <ElInput
            v-model="quickHost"
            placeholder="服务器地址"
            size="large"
            :disabled="connecting"
            class="form-row__host"
          />
          <ElInputNumber
            v-model="quickPort"
            :min="1"
            :max="65535"
            :controls="false"
            size="large"
            :disabled="connecting"
            class="form-row__port"
            placeholder="端口"
          />
        </div>
        <ElInput
          v-model="quickUsername"
          placeholder="用户名（默认 root）"
          size="large"
          :disabled="connecting"
        />
        <ElInput
          v-model="quickPassword"
          type="password"
          show-password
          placeholder="密码（可选）"
          size="large"
          :disabled="connecting"
        />
        <div class="form-field">
          <span class="form-field__label">SSH 私钥（可选）</span>
          <ElInput
            v-model="quickPrivateKey"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
            :disabled="connecting"
          />
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="server-error">
        <ElAlert :title="error" type="error" show-icon closable @close="$emit('update:error', null)" />
      </div>

      <!-- Actions -->
      <div class="server-actions">
        <ElButton
          type="primary"
          size="large"
          :loading="connecting"
          :disabled="!canConnect"
          @click="handleConnect"
        >
          <IconifyIconOnline icon="ep:connection" style="margin-right: 4px" />
          {{ connecting ? '连接中...' : '连接服务器' }}
        </ElButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
} from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { PanelSavedSource } from "../../panel";

const props = defineProps<{
  sources: PanelSavedSource[];
  connecting: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  connect: [source: PanelSavedSource];
  disconnect: [];
  "update:error": [error: string | null];
}>();

// ─── Connection method ──────────────────────────────────

const connectionMethod = ref<"saved" | "quick">("saved");

// ─── Saved sources ──────────────────────────────────────

const selectedSourceId = ref("");

const selectedSource = computed(() => {
  return props.sources.find((s) => s.sourceId === selectedSourceId.value) || null;
});

const sourceLabel = (s: PanelSavedSource) => {
  return `${s.connectionName} (${s.host}:${s.port})`;
};

// ─── Quick connect form ─────────────────────────────────

const quickHost = ref("");
const quickPort = ref(22);
const quickUsername = ref("root");
const quickPassword = ref("");
const quickPrivateKey = ref("");

// ─── Can connect ────────────────────────────────────────

const canConnect = computed(() => {
  if (connectionMethod.value === "saved") {
    return !!selectedSourceId.value;
  }
  return quickHost.value.trim().length > 0 && quickPort.value > 0;
});

// ─── Connect ────────────────────────────────────────────

const handleConnect = () => {
  if (connectionMethod.value === "saved") {
    const source = selectedSource.value;
    if (source) {
      emit("connect", source);
    }
  } else {
    // Build a pseudo-source from the form fields
    const pseudoSource: PanelSavedSource = {
      sourceId: "",
      connectionId: "",
      sourceType: "SSH",
      jdbcDialectType: "",
      connectionName: quickHost.value,
      host: quickHost.value.trim(),
      port: quickPort.value,
      databaseName: "",
      username: quickUsername.value.trim() || "root",
      password: quickPassword.value,
      driverClassName: "",
      driverJarName: "",
      driverJarPath: "",
      protocol: quickPrivateKey.value ? "privateKey" : "password",
      environment: "dev",
      owner: "",
      readOnly: false,
      sslEnabled: false,
      connectTimeoutMillis: 5000,
      socketTimeoutMillis: 10000,
      charset: "",
      attributes: quickPrivateKey.value
        ? { privateKey: quickPrivateKey.value }
        : {},
      note: "",
      favorite: false,
      updatedAt: "",
    };
    emit("connect", pseudoSource);
  }
};
</script>

<style scoped>
.server-selector {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
.server-selector-card {
  max-width: 480px;
  width: 100%;
  text-align: center;
  padding: 40px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.server-selector-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 50%;
}
.server-selector-card h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.server-selector-desc {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.method-tabs {
  margin-bottom: 4px;
}
.server-selector-empty {
  width: 100%;
  padding: 12px 0;
}
.server-selector-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 8px 0 0;
}
.server-selector-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.quick-connect-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-row {
  display: flex;
  gap: 8px;
}
.form-row__host {
  flex: 1;
}
.form-row__port {
  width: 120px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}
.form-field__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.server-error {
  width: 100%;
  text-align: left;
}
.server-actions {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}
.source-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.source-name {
  font-weight: 500;
}
.source-addr {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
