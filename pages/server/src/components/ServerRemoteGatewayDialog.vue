<template>
  <el-dialog
    :model-value="modelValue"
    width="860px"
    destroy-on-close
    :title="title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-remote-dialog">
      <div class="server-remote-dialog__hero">
        <div>
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
        </div>
        <div class="server-remote-dialog__hero-meta">
          <span class="server-remote-dialog__chip">
            {{ form.provider || "guacamole" }}
          </span>
          <span class="server-remote-dialog__chip is-muted">
            {{ form.protocol || "auto" }}
          </span>
        </div>
      </div>

      <div class="server-remote-dialog__focus-grid">
        <article class="server-remote-dialog__focus-card">
          <small>配置来源</small>
          <strong>{{
            showInherit
              ? form.inheritGlobal
                ? "继承全局"
                : "单机覆盖"
              : "全局主档"
          }}</strong>
          <span>{{ previewMessage }}</span>
        </article>
        <article class="server-remote-dialog__focus-card">
          <small>代理实现</small>
          <strong>{{ form.provider || "guacamole" }}</strong>
          <span>{{ form.protocol || "auto" }} / {{ resolvedLaunchPath }}</span>
        </article>
        <article class="server-remote-dialog__focus-card">
          <small>有效入口</small>
          <strong>{{ resolvedGatewayUrl || "待填写网关地址" }}</strong>
          <span>{{ form.connectionId || "保存后自动生成连接编号" }}</span>
        </article>
      </div>

      <el-form label-position="top" class="server-remote-dialog__form">
        <div class="server-remote-dialog__grid">
          <el-form-item
            v-if="showInherit"
            label="配置来源"
            class="server-remote-dialog__span-2"
          >
            <ScSelect
              v-model="inheritMode"
              :options="inheritOptions"
              layout="icon"
              class="server-remote-dialog__inherit"
            />
          </el-form-item>

          <el-form-item label="启用状态">
            <el-switch
              v-model="enabledValue"
              :disabled="inheritDisabled"
              inline-prompt
              active-text="开启"
              inactive-text="关闭"
            />
          </el-form-item>

          <el-form-item label="代理实现">
            <ScSelect
              v-model="providerValue"
              :options="normalizedProviderOptions"
              layout="icon"
              :disabled="inheritDisabled"
              class="server-remote-dialog__compact-select"
            />
          </el-form-item>

          <el-form-item label="网关地址" class="server-remote-dialog__span-2">
            <ScInput
              v-model="gatewayUrlValue"
              :disabled="inheritDisabled"
              :placeholder="
                inheritDisabled && resolvedGatewayUrl
                  ? resolvedGatewayUrl
                  : '如 http://127.0.0.1:8080/guacamole'
              "
            />
          </el-form-item>

          <el-form-item label="协议">
            <ScSelect
              v-model="protocolValue"
              :options="normalizedProtocolOptions"
              layout="icon"
              clearable
              :disabled="inheritDisabled"
              class="server-remote-dialog__compact-select"
            />
          </el-form-item>

          <el-form-item label="入口路径">
            <ScInput
              v-model="launchPathValue"
              :disabled="inheritDisabled"
              placeholder="默认 /#/client/"
            />
          </el-form-item>

          <el-form-item label="连接编号" class="server-remote-dialog__span-2">
            <ScInput
              v-model="connectionIdValue"
              :disabled="inheritDisabled"
              placeholder="留空则按服务器编码生成"
            />
          </el-form-item>
        </div>
      </el-form>

      <div class="server-remote-dialog__preview">
        <strong>远程控制预览</strong>
        <span>{{ previewMessage }}</span>
        <small>{{ resolvedGatewayUrl || "请先填写网关地址" }}</small>
        <div class="server-remote-dialog__preview-tags">
          <span class="server-remote-dialog__chip is-muted">
            {{
              form.connectionId || "保存后按服务器编码/连接信息自动生成连接编号"
            }}
          </span>
          <span class="server-remote-dialog__chip is-muted">
            入口 {{ form.launchPath || "/#/client/" }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="emit('submit')">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import type { RemoteGatewayFormModel, SelectOption } from "./server-types";

const props = defineProps<{
  modelValue: boolean;
  title: string;
  description: string;
  saving?: boolean;
  form: RemoteGatewayFormModel;
  providerOptions: SelectOption[];
  protocolOptions: SelectOption[];
  showInherit?: boolean;
  resolvedGatewayUrl?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:form": [value: RemoteGatewayFormModel];
  submit: [];
}>();

const inheritOptions: SelectOption[] = [
  {
    label: "继承全局",
    value: "global",
    icon: "ri:global-line",
    description: "当前服务器跟随全局远程代理",
  },
  {
    label: "单独覆盖",
    value: "local",
    icon: "ri:settings-3-line",
    description: "当前服务器单独配置远程代理",
  },
];

const updateForm = (patch: Partial<RemoteGatewayFormModel>) => {
  emit("update:form", {
    ...props.form,
    ...patch,
  });
};

const inheritDisabled = computed(() =>
  Boolean(props.showInherit && props.form.inheritGlobal),
);

const enabledValue = computed({
  get: () => Boolean(props.form.enabled),
  set: (value: boolean) => {
    updateForm({ enabled: value });
  },
});

const providerValue = computed({
  get: () => props.form.provider || "guacamole",
  set: (value: string | number) => {
    updateForm({ provider: String(value || "guacamole") });
  },
});

const gatewayUrlValue = computed({
  get: () => props.form.gatewayUrl || props.resolvedGatewayUrl || "",
  set: (value: string | number) => {
    updateForm({ gatewayUrl: String(value || "") });
  },
});

const protocolValue = computed({
  get: () => props.form.protocol || "",
  set: (value: string | number) => {
    updateForm({ protocol: String(value || "") });
  },
});

const launchPathValue = computed({
  get: () => props.form.launchPath || "",
  set: (value: string | number) => {
    updateForm({ launchPath: String(value || "") });
  },
});

const connectionIdValue = computed({
  get: () => props.form.connectionId || "",
  set: (value: string | number) => {
    updateForm({ connectionId: String(value || "") });
  },
});

const resolvedLaunchPath = computed(() => props.form.launchPath || "/#/client/");

const previewMessage = computed(() =>
  props.form.enabled
    ? props.form.inheritGlobal && props.resolvedGatewayUrl
      ? "当前继承全局远程代理，保存后将生成入口按钮"
      : "保存后将生成远程入口按钮"
    : "当前未启用远程代理",
);

const normalizedProviderOptions = computed(() =>
  props.providerOptions.map((item) => ({
    ...item,
    icon:
      item.icon ||
      (String(item.value || "").toLowerCase() === "guacamole"
        ? "ri:terminal-window-line"
        : "ri:route-line"),
  })),
);

const normalizedProtocolOptions = computed(() =>
  props.protocolOptions.map((item) => ({
    ...item,
    icon:
      item.icon ||
      ({
        rdp: "ri:windows-line",
        ssh: "ri:terminal-box-line",
        vnc: "ri:device-line",
        telnet: "ri:exchange-box-line",
      }[String(item.value || "").toLowerCase()] || "ri:computer-line"),
  })),
);

const inheritMode = computed({
  get: () => (props.form.inheritGlobal ? "global" : "local"),
  set: (value: string | number) => {
    updateForm({ inheritGlobal: value === "global" });
  },
});
</script>

<style scoped lang="scss">
.server-remote-dialog {
  display: grid;
  gap: 18px;
}

.server-remote-dialog__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 28px;
  margin-bottom: 18px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 12%, white),
    rgba(248, 250, 252, 0.96) 56%,
    rgba(239, 246, 255, 0.94)
  );
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, rgba(148, 163, 184, 0.2));
  box-shadow:
    0 20px 36px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-remote-dialog__hero h3 {
  margin: 0;
  font-size: 18px;
}

.server-remote-dialog__hero p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.server-remote-dialog__hero-meta,
.server-remote-dialog__preview-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.server-remote-dialog__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, transparent);
}

.server-remote-dialog__chip.is-muted {
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 92%, white);
}

.server-remote-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.server-remote-dialog__focus-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.server-remote-dialog__focus-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, rgba(148, 163, 184, 0.18));
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 8%, transparent),
      transparent 58%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 92%, white);
  box-shadow:
    0 14px 24px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-remote-dialog__focus-card small,
.server-remote-dialog__focus-card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.server-remote-dialog__focus-card strong {
  color: var(--el-text-color-primary);
  font-size: 16px;
  line-height: 1.3;
  word-break: break-word;
}

.server-remote-dialog__span-2 {
  grid-column: span 2;
}

.server-remote-dialog__inherit {
  width: 100%;
}

.server-remote-dialog__inherit :deep(.sc-select) {
  width: 100%;
}

.server-remote-dialog__inherit :deep(.icon-selector-flex) {
  justify-content: flex-start;
  gap: 8px;
}

.server-remote-dialog__preview {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 16px 18px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, rgba(148, 163, 184, 0.18));
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-remote-dialog__preview span,
.server-remote-dialog__preview small {
  color: var(--el-text-color-secondary);
}

.server-remote-dialog__compact-select {
  width: 100%;
}

.server-remote-dialog__compact-select :deep(.sc-select) {
  width: 100%;
}

.server-remote-dialog__compact-select :deep(.icon-selector-flex) {
  justify-content: flex-start;
  gap: 8px;
}

.server-remote-dialog__inherit :deep(.icon-selector-item),
.server-remote-dialog__compact-select :deep(.icon-selector-item) {
  width: 46px;
  height: 46px;
}

:deep(.el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding-bottom: 4px;
}

:deep(.el-dialog__body) {
  overflow: visible;
}

.server-remote-dialog__form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.server-remote-dialog__form :deep(.el-form-item__label) {
  padding-bottom: 6px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .server-remote-dialog__focus-grid,
  .server-remote-dialog__grid {
    grid-template-columns: 1fr;
  }

  .server-remote-dialog__span-2 {
    grid-column: span 1;
  }
}
</style>
