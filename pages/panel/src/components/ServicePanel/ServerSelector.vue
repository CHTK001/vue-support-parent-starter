<template>
  <section class="server-selector">
    <!-- Animated background orbs -->
    <div class="sel-bg">
      <div class="sel-bg-orb sel-bg-orb--1" />
      <div class="sel-bg-orb sel-bg-orb--2" />
      <div class="sel-bg-orb sel-bg-orb--3" />
    </div>

    <div class="sel-card">
      <!-- Logo -->
      <div class="sel-logo">
        <div class="sel-logo-icon">
          <IconifyIconOnline icon="ep:connection" />
        </div>
        <div class="sel-logo-ring sel-logo-ring--1" />
        <div class="sel-logo-ring sel-logo-ring--2" />
        <div class="sel-logo-ring sel-logo-ring--3" />
      </div>

      <div class="sel-header">
        <h3 class="sel-title">连接服务器</h3>
        <p class="sel-subtitle">SSH Secure Shell</p>
      </div>

      <!-- Connection method toggle -->
      <div class="sel-methods">
        <ElRadioGroup v-model="connectionMethod" class="sel-tabs" :disabled="connecting">
          <ElRadioButton value="saved">已保存</ElRadioButton>
          <ElRadioButton value="quick">快速连接</ElRadioButton>
        </ElRadioGroup>
      </div>

      <div class="sel-form">
        <!-- ── Saved sources ── -->
        <template v-if="connectionMethod === 'saved'">
          <div v-if="sources.length === 0" class="sel-empty">
            <IconifyIconOnline icon="ep:folder-opened" class="sel-empty-icon" />
            <span>暂无已保存的服务器</span>
            <span class="sel-empty-hint">切换到"快速连接"直接访问</span>
          </div>
          <ElSelect
            v-else
            v-model="selectedSourceId"
            placeholder="选择服务器..."
            :disabled="connecting"
            class="sel-select"
          >
            <ElOption
              v-for="s in sources"
              :key="s.sourceId"
              :label="sourceLabel(s)"
              :value="s.sourceId"
            />
          </ElSelect>
        </template>

        <!-- ── Quick connect ── -->
        <template v-else>
          <div class="sel-row">
            <div class="sel-field">
              <span class="sel-field-label">主机地址</span>
              <ElInput v-model="quickHost" placeholder="8.139.4.229" :disabled="connecting" class="sel-input" />
            </div>
            <div class="sel-field sel-field--narrow">
              <span class="sel-field-label">端口</span>
              <ElInputNumber v-model="quickPort" :min="1" :max="65535" :controls="false" :disabled="connecting" placeholder="22" class="sel-input" />
            </div>
          </div>
          <div class="sel-field">
            <span class="sel-field-label">用户名</span>
            <ElInput v-model="quickUsername" placeholder="root" :disabled="connecting" class="sel-input" />
          </div>
          <div class="sel-field">
            <span class="sel-field-label">密码</span>
            <ElInput v-model="quickPassword" type="password" show-password placeholder="可选" :disabled="connecting" class="sel-input" />
          </div>
        </template>
      </div>

      <!-- Error -->
      <div v-if="error" class="sel-error">
        <IconifyIconOnline icon="ep:warning-filled" class="sel-error-icon" />
        <span>{{ error }}</span>
      </div>

      <!-- Connect button -->
      <button class="sel-connect" :disabled="!canConnect || connecting" @click="handleConnect">
        <span v-if="connecting" class="sel-connect-spinner" />
        <IconifyIconOnline v-else icon="ep:connection" />
        <span>{{ connecting ? '正在连接...' : '连接服务器' }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
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

const STORAGE_KEY_SOURCE = "server-selector-source-id";
const STORAGE_KEY_METHOD = "server-selector-method";

const connectionMethod = ref<"saved" | "quick">(
  (localStorage.getItem(STORAGE_KEY_METHOD) as "saved" | "quick") || "saved",
);
watch(connectionMethod, (val) => localStorage.setItem(STORAGE_KEY_METHOD, val));

// ─── Saved sources ──────────────────────────────────────

const selectedSourceId = ref(localStorage.getItem(STORAGE_KEY_SOURCE) || "");
watch(selectedSourceId, (val) => {
  if (val) localStorage.setItem(STORAGE_KEY_SOURCE, val);
});

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

<style scoped lang="scss">
.server-selector {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  position: relative;
  overflow: hidden;
}

/* ─── Animated background orbs ──────────────────────────── */

.sel-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.sel-bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  animation: orbFloat 12s ease-in-out infinite;
}
.sel-bg-orb--1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #6366f1, transparent);
  top: -10%;
  left: -5%;
  animation-delay: 0s;
}
.sel-bg-orb--2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #3b82f6, transparent);
  bottom: -8%;
  right: -5%;
  animation-delay: -4s;
}
.sel-bg-orb--3 {
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, #22c55e, transparent);
  bottom: 30%;
  right: 20%;
  animation-delay: -8s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -20px) scale(1.1); }
  50% { transform: translate(-10px, 30px) scale(0.95); }
  75% { transform: translate(20px, 10px) scale(1.05); }
}

/* ─── Glass card ──────────────────────────────────────── */

.sel-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  max-width: 380px;
  width: 100%;
  padding: 36px 32px 28px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: selCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

html.dark .sel-card {
  background: rgba(18, 24, 40, 0.85);
  backdrop-filter: blur(24px);
  border-color: rgba(148, 163, 184, 0.12);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

@keyframes selCardIn {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ─── Logo ──────────────────────────────────────────────── */

.sel-logo {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.sel-logo-icon {
  position: relative;
  z-index: 2;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: #fff;
  font-size: 28px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  animation: logoBounce 3s ease-in-out infinite;
}
@keyframes logoBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.sel-logo-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid;
  animation: ringExpand 3s ease-out infinite;
}
.sel-logo-ring--1 {
  inset: -6px;
  border-color: rgba(99, 102, 241, 0.2);
  animation-delay: 0s;
}
.sel-logo-ring--2 {
  inset: -14px;
  border-color: rgba(99, 102, 241, 0.12);
  animation-delay: 0.6s;
}
.sel-logo-ring--3 {
  inset: -22px;
  border-color: rgba(99, 102, 241, 0.06);
  animation-delay: 1.2s;
}

html.dark .sel-logo-ring--1 { border-color: rgba(99, 102, 241, 0.3); }
html.dark .sel-logo-ring--2 { border-color: rgba(99, 102, 241, 0.18); }
html.dark .sel-logo-ring--3 { border-color: rgba(99, 102, 241, 0.1); }

@keyframes ringExpand {
  0% { transform: scale(0.92); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 0.4; }
  100% { transform: scale(0.92); opacity: 0.8; }
}

/* ─── Header ────────────────────────────────────────────── */

.sel-header {
  text-align: center;
  margin-bottom: 20px;
}
.sel-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.01em;
}
.sel-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
}

/* ─── Method tabs ───────────────────────────────────────── */

.sel-methods {
  width: 100%;
  margin-bottom: 16px;
}
.sel-tabs {
  display: flex;
  width: 100%;
  background: var(--dt-hover-bg);
  border-radius: 12px;
  padding: 3px;
}
.sel-tabs :deep(.el-radio-button) {
  flex: 1;
}
.sel-tabs :deep(.el-radio-button__inner) {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  color: var(--el-text-color-secondary);
  box-shadow: none !important;
  transition: all 0.25s ease;
  letter-spacing: 0.02em;
}
.sel-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #fff;
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}

html.dark .sel-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(30, 35, 55, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
}

/* ─── Form ──────────────────────────────────────────────── */

.sel-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sel-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.sel-field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.03em;
  padding-left: 2px;
}

.sel-row {
  display: flex;
  gap: 12px;
}
.sel-row .sel-field {
  flex: 1;
}
.sel-field--narrow {
  flex: 0 0 100px !important;
}

.sel-input :deep(.el-input__wrapper),
.sel-input :deep(.el-input-number .el-input__wrapper) {
  border-radius: 12px;
  min-height: 42px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}
.sel-input :deep(.el-input__wrapper):focus-within,
.sel-input :deep(.el-input-number .el-input__wrapper):focus-within {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

html.dark .sel-input :deep(.el-input__wrapper),
html.dark .sel-input :deep(.el-input-number .el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.1);
  background: rgba(20, 25, 45, 0.6);
}

.sel-select :deep(.el-select__wrapper) {
  border-radius: 12px;
  min-height: 42px;
}
.sel-select :deep(.el-select__wrapper):focus-within {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

html.dark .sel-select :deep(.el-select__wrapper) {
  background: rgba(20, 25, 45, 0.6);
}

.sel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  padding: 18px;
}
.sel-empty-icon {
  font-size: 28px;
  opacity: 0.3;
  margin-bottom: 4px;
}
.sel-empty-hint {
  font-size: 11px;
  opacity: 0.5;
}

/* ─── Error ─────────────────────────────────────────────── */

.sel-error {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: #dc2626;
  font-size: 13px;
  line-height: 1.4;
  animation: errIn 0.3s ease-out;
}
.sel-error-icon {
  font-size: 18px;
  flex-shrink: 0;
}
@keyframes errIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

html.dark .sel-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

/* ─── Connect button ────────────────────────────────────── */

.sel-connect {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #3b82f6, #6366f1);
  background-size: 200% 100%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
  position: relative;
  overflow: hidden;
}
.sel-connect::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #2563eb);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.sel-connect:hover:not(:disabled)::before {
  opacity: 1;
}
.sel-connect:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(99, 102, 241, 0.45);
}
.sel-connect:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);
}
.sel-connect:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
.sel-connect > * {
  position: relative;
  z-index: 1;
}
.sel-connect .iconify {
  font-size: 20px;
}

/* ─── Spinner ──────────────────────────────────────────── */

.sel-connect-spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Responsive ────────────────────────────────────────── */

@media (max-width: 480px) {
  .sel-card {
    padding: 28px 20px 24px;
    border-radius: 20px;
    margin: 0 12px;
  }
  .sel-row {
    flex-direction: column;
  }
  .sel-field--narrow {
    flex: 1 !important;
  }
}
</style>
