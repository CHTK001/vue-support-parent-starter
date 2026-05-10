<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>人工处理</strong>
        <span class="spider-task-badge" :class="statusBadgeClass">{{ task.spiderTaskStatus }}</span>
      </div>

      <!-- 已提交状态指示（只读时显示） -->
      <div v-if="task.spiderTaskStatus === 'SUCCESS'" class="spider-manual-status is-success">
        已提交成功
      </div>
      <div v-else-if="task.spiderTaskStatus === 'FAILED'" class="spider-manual-status is-failed">
        提交失败
      </div>

      <div class="spider-generic-config__item">
        <span>任务标题</span>
        <div class="spider-runtime-manual__text">{{ payload.taskTitle || task.spiderTaskType }}</div>
      </div>

      <div class="spider-generic-config__item">
        <span>处理说明</span>
        <div class="spider-runtime-manual__text">
          {{ payload.taskGuide || payload.taskPrompt || "请按要求填写并提交人工结果。" }}
        </div>
      </div>

      <!-- 页面截图：始终展示 -->
      <div class="spider-runtime-manual__section-label">页面截图</div>
      <div class="spider-runtime-manual__image-wrap">
        <img
          v-if="payload.imageUrl"
          :src="payload.imageUrl"
          class="spider-runtime-manual__image"
          alt="页面截图"
          @click="previewVisible = true"
        />
        <div v-else class="spider-runtime-manual__image-placeholder">
          <span class="spider-runtime-manual__placeholder-icon">🖼</span>
          <span>暂无截图，请查看页面后填写</span>
        </div>
        <Teleport to="body">
          <div v-if="previewVisible" class="spider-image-preview-overlay" @click.self="previewVisible = false">
            <button class="spider-image-preview-close" @click="previewVisible = false">&times;</button>
            <img :src="payload.imageUrl" class="spider-image-preview-full" alt="页面截图预览" />
          </div>
        </Teleport>
      </div>

      <!-- 登录方式选择（多方式登录时显示） -->
      <div v-if="loginMethodGroups.length" class="spider-login-methods">
        <div class="spider-runtime-manual__section-label">请选择登录方式</div>
        <div class="spider-login-methods__tabs">
          <button
            v-for="group in loginMethodGroups"
            :key="group.methodKey"
            type="button"
            class="spider-login-methods__tab"
            :class="{ 'is-active': activeLoginMethod === group.methodKey }"
            @click="activeLoginMethod = group.methodKey"
            :disabled="isReadOnly"
          >
            <span class="spider-login-methods__icon">{{ loginMethodIcon(group.methodKey) }}</span>
            <span>{{ group.methodLabel }}</span>
          </button>
        </div>
      </div>

      <!-- 扫码登录提示 -->
      <div v-if="activeLoginMethod === 'qr'" class="spider-qr-hint">
        <div class="spider-qr-hint__icon">📱</div>
        <div class="spider-qr-hint__text">
          <strong>请使用手机扫码</strong>
          <span>打开 GitHub/码云 手机客户端或扫码工具，扫描上方页面中的二维码完成登录。</span>
        </div>
      </div>

      <!-- 表单字段：根据选中的登录方式显示 -->
      <div class="spider-runtime-manual__section-label">
        {{ activeLoginMethod === 'password' ? '账号密码' : activeLoginMethod === 'sms' ? '短信验证' : '扫码确认' }}
      </div>
      <div class="spider-runtime-manual__fields">
        <label
          v-for="field in visibleFields"
          :key="field.fieldKey"
          class="spider-runtime-manual__field"
        >
          <span class="spider-runtime-manual__field-label">{{ field.label }}</span>
          <div class="spider-runtime-manual__field-input-wrap">
            <span class="spider-runtime-manual__field-icon">{{ fieldIcon(field.fieldKey) }}</span>
            <input
              :value="modelValue[field.fieldKey] || ''"
              :type="field.component === 'password' ? 'password' : 'text'"
              :placeholder="field.placeholder || ''"
              :disabled="isReadOnly"
              class="spider-runtime-manual__field-input"
              @input="emit('update-field', field.fieldKey, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </label>
      </div>
    </div>

    <div v-if="!isReadOnly" class="spider-manual-footer">
      <button type="button" class="spider-manual-btn is-cancel" @click="emit('submit', false)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span>提交</span>
      </button>
      <button type="button" class="spider-manual-btn is-primary" @click="emit('submit', true)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <span>提交并继续</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { SpiderManualTaskView } from "../../../types/orchestration";

defineOptions({ name: "SpiderRuntimeManualTaskPanel" });

const props = defineProps<{
  task: SpiderManualTaskView;
  modelValue: Record<string, string>;
}>();

const previewVisible = ref(false);
const activeLoginMethod = ref("password");
const emit = defineEmits<{
  (e: "update-field", fieldKey: string, value: string): void;
  (e: "submit", continueAfter: boolean): void;
}>();

interface LoginMethodGroup {
  methodKey: string;
  methodLabel: string;
  fields: Array<{
    fieldKey: string;
    label: string;
    component: string;
    placeholder: string;
    required: boolean;
  }>;
}

interface ManualPayload {
  taskTitle?: string;
  taskPrompt?: string;
  taskGuide?: string;
  imageUrl?: string;
  formFields?: Array<{
    fieldKey: string;
    label: string;
    component: string;
    placeholder?: string;
    required?: boolean;
  }>;
  loginMethodGroups?: LoginMethodGroup[];
  [key: string]: unknown;
}

const payload = computed<ManualPayload>(() => {
  try {
    const parsed = JSON.parse(props.task.spiderTaskPayload || "{}");
    return {
      ...parsed,
      formFields: Array.isArray(parsed.formFields) ? parsed.formFields : [],
      loginMethodGroups: Array.isArray(parsed.loginMethodGroups) ? parsed.loginMethodGroups : [],
    };
  } catch {
    return {
      taskTitle: props.task.spiderTaskType,
      taskPrompt: "",
      taskGuide: "",
      formFields: [],
      loginMethodGroups: [],
    };
  }
});

const isReadOnly = computed(() => props.task.spiderTaskStatus !== "WAIT_MANUAL");

const statusBadgeClass = computed(() => {
  switch (props.task.spiderTaskStatus) {
    case "SUCCESS": return "is-success";
    case "FAILED": return "is-failed";
    case "WAIT_MANUAL": return "is-warning";
    default: return "";
  }
});

const loginMethodGroups = computed<LoginMethodGroup[]>(() => payload.value.loginMethodGroups || []);

const visibleFields = computed(() => {
  if (loginMethodGroups.value.length) {
    const activeGroup = loginMethodGroups.value.find(g => g.methodKey === activeLoginMethod.value);
    if (activeGroup) return activeGroup.fields;
  }
  return payload.value.formFields || [];
});

function loginMethodIcon(methodKey: string): string {
  switch (methodKey) {
    case "password": return "🔑";
    case "sms": return "📱";
    case "qr": return "📷";
    default: return "🔐";
  }
}

function fieldIcon(fieldKey: string): string {
  switch (fieldKey) {
    case "username": return "👤";
    case "password": return "🔒";
    case "phone": return "📞";
    case "smsCode": return "✉";
    case "qrConfirmed": return "✅";
    default: return "📝";
  }
}
</script>

<style scoped lang="scss">
.spider-runtime-manual__text {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, #facc15 6%, var(--lay-bg));
  color: var(--lay-text-primary);
  line-height: 1.6;
}

/* ── Task badge ── */
.spider-task-badge {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: color-mix(in srgb, #eab308 14%, transparent);
  color: #a16207;
}

.spider-task-badge.is-success {
  background: color-mix(in srgb, #22c55e 14%, transparent);
  color: #15803d;
}

.spider-task-badge.is-failed {
  background: color-mix(in srgb, #ef4444 14%, transparent);
  color: #b91c1c;
}

.spider-task-badge.is-warning {
  background: color-mix(in srgb, #eab308 14%, transparent);
  color: #a16207;
}

/* ── Section label ── */
.spider-runtime-manual__section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--lay-text-secondary);
  letter-spacing: 0.03em;
  margin-bottom: 6px;
}

/* ── Screenshot ── */
.spider-runtime-manual__image-wrap {
  position: relative;
  margin-bottom: 12px;
}

.spider-runtime-manual__image {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--lay-border);
  cursor: zoom-in;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: block;
}
.spider-runtime-manual__image:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
}

.spider-runtime-manual__image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 140px;
  border-radius: 12px;
  border: 2px dashed var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 96%, transparent);
  color: var(--lay-text-placeholder);
  font-size: 12px;
}

.spider-runtime-manual__placeholder-icon {
  font-size: 28px;
}

/* ── Image preview overlay ── */
.spider-image-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.spider-image-preview-close {
  position: absolute;
  top: 20px;
  right: 28px;
  background: none;
  border: none;
  color: #fff;
  font-size: 40px;
  cursor: pointer;
  line-height: 1;
  z-index: 10;
}

.spider-image-preview-full {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

/* ── Login method tabs ── */
.spider-login-methods {
  margin-bottom: 14px;
}

.spider-login-methods__tabs {
  display: flex;
  gap: 8px;
}

.spider-login-methods__tab {
  flex: 1;
  height: 42px;
  border: 1.5px solid var(--lay-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  color: var(--lay-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.spider-login-methods__tab:hover {
  border-color: color-mix(in srgb, var(--lay-accent) 24%, transparent);
  color: var(--lay-text-primary);
  background: color-mix(in srgb, var(--lay-accent) 4%, transparent);
  transform: translateY(-1px);
}

.spider-login-methods__tab.is-active {
  border-color: var(--lay-accent);
  background: color-mix(in srgb, var(--lay-accent) 10%, transparent);
  color: var(--lay-accent);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--lay-accent) 12%, transparent);
}

.spider-login-methods__icon {
  font-size: 16px;
  line-height: 1;
}

/* ── QR login hint ── */
.spider-qr-hint {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: color-mix(in srgb, #3b82f6 6%, var(--lay-bg));
  border: 1px solid color-mix(in srgb, #3b82f6 16%, transparent);
  margin-bottom: 14px;
}

.spider-qr-hint__icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}

.spider-qr-hint__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--lay-text-secondary);
  line-height: 1.5;
}

.spider-qr-hint__text strong {
  color: var(--lay-text-primary);
}

/* ── Form fields ── */
.spider-runtime-manual__fields {
  display: grid;
  gap: 10px;
}

.spider-runtime-manual__field {
  display: grid;
  gap: 6px;
}

.spider-runtime-manual__field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--lay-text-secondary);
  padding-left: 2px;
}

.spider-runtime-manual__field-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.spider-runtime-manual__field-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  line-height: 1;
  pointer-events: none;
  z-index: 1;
}

.spider-runtime-manual__field-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 38px;
  border-radius: 10px;
  border: 1.5px solid color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, var(--lay-bg) 96%, transparent);
  color: var(--lay-text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-sizing: border-box;
}

.spider-runtime-manual__field-input:focus {
  border-color: color-mix(in srgb, var(--lay-accent) 36%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--lay-accent) 10%, transparent);
  background: var(--lay-bg);
}

.spider-runtime-manual__field-input::placeholder {
  color: var(--lay-text-placeholder);
  font-size: 12px;
}

/* ── Status banner ── */
.spider-manual-status {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.03em;
  margin-bottom: 12px;
}

.spider-manual-status.is-success {
  background: color-mix(in srgb, #22c55e 12%, transparent);
  color: #15803d;
  border: 1px solid color-mix(in srgb, #22c55e 20%, transparent);
}

.spider-manual-status.is-failed {
  background: color-mix(in srgb, #ef4444 12%, transparent);
  color: #b91c1c;
  border: 1px solid color-mix(in srgb, #ef4444 20%, transparent);
}

/* ── Disabled input ── */
.spider-runtime-manual__field-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: color-mix(in srgb, var(--lay-bg) 90%, transparent);
}

.spider-runtime-manual__field-input:disabled:focus {
  border-color: color-mix(in srgb, var(--lay-border) 86%, transparent);
  box-shadow: none;
  background: color-mix(in srgb, var(--lay-bg) 90%, transparent);
}

.spider-login-methods__tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* ── Footer / Action buttons ── */
.spider-manual-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 4px;
}

.spider-manual-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  border: 1.5px solid transparent;
  letter-spacing: 0.02em;
  line-height: 1;
  white-space: nowrap;
}

.spider-manual-btn.is-cancel {
  border-color: color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, var(--lay-bg) 94%, transparent);
  color: var(--lay-text-secondary);
}

.spider-manual-btn.is-cancel:hover {
  border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
  background: color-mix(in srgb, var(--lay-accent) 4%, transparent);
  color: var(--lay-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--lay-accent) 8%, transparent);
}

.spider-manual-btn.is-primary {
  background: linear-gradient(135deg, var(--lay-accent), color-mix(in srgb, var(--lay-accent) 80%, #000));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 10px color-mix(in srgb, var(--lay-accent) 20%, transparent);
}

.spider-manual-btn.is-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--lay-accent) 35%, transparent);
  filter: brightness(1.08);
}

.spider-manual-btn.is-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px color-mix(in srgb, var(--lay-accent) 20%, transparent);
  filter: brightness(0.95);
}

.spider-manual-btn svg {
  flex-shrink: 0;
}
</style>
