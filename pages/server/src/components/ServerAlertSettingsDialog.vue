<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="860px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-alert-dialog">
      <p v-if="description" class="server-alert-dialog__desc">
        {{ description }}
      </p>

      <div class="server-alert-dialog__toolbar">
        <div class="server-alert-dialog__toolbar-main">
          <el-checkbox
            v-if="showInherit"
            v-model="inheritGlobalModel"
            label="继承全局阈值"
          />
          <div class="server-alert-dialog__switches">
            <el-switch
              v-model="enabledModel"
              inline-prompt
              active-text="启用预警"
              inactive-text="关闭预警"
            />
            <el-switch
              v-model="messageEnabledModel"
              inline-prompt
              active-text="同步消息中心"
              inactive-text="仅页面显示"
            />
          </div>
        </div>

        <div class="server-alert-dialog__summary">
          <span
            class="server-alert-dialog__summary-tag"
            :class="form.enabled ? 'is-primary' : 'is-muted'"
          >
            {{ form.enabled ? "实时预警已开启" : "实时预警已关闭" }}
          </span>
          <span
            class="server-alert-dialog__summary-tag"
            :class="form.messageEnabled ? 'is-warning' : 'is-muted'"
          >
            {{
              form.messageEnabled ? "已联动 sys_message" : "未联动 sys_message"
            }}
          </span>
        </div>
      </div>

      <div class="server-alert-dialog__focus-grid">
        <article class="server-alert-dialog__focus-card">
          <small>核心阈值</small>
          <strong
            >CPU {{ props.form.cpuWarningPercent || 0 }}/{{
              props.form.cpuDangerPercent || 0
            }}%</strong
          >
          <span
            >内存 {{ props.form.memoryWarningPercent || 0 }}/{{
              props.form.memoryDangerPercent || 0
            }}% · 磁盘 {{ props.form.diskWarningPercent || 0 }}/{{
              props.form.diskDangerPercent || 0
            }}%</span
          >
        </article>
        <article class="server-alert-dialog__focus-card">
          <small>网络 / 延迟</small>
          <strong>{{ ioWarningModel }} / {{ ioDangerModel }} {{ ioUnit }}/s</strong>
          <span
            >延迟 {{ latencyWarningModel }} / {{ latencyDangerModel }}
            {{ latencyUnit }}</span
          >
        </article>
        <article class="server-alert-dialog__focus-card">
          <small>联动策略</small>
          <strong>{{ form.enabled ? "实时预警开启" : "预警关闭" }}</strong>
          <span>{{
            form.messageEnabled ? "告警会同步到消息中心" : "仅保留页内与 Socket 事件"
          }}</span>
        </article>
      </div>

      <div class="server-alert-dialog__grid">
        <section class="server-alert-dialog__group">
          <header>
            <strong>CPU / 内存 / 磁盘</strong>
            <span>单位：%</span>
          </header>
          <div class="server-alert-dialog__fields">
            <label>
              <span>CPU 预警</span>
              <ScInput
                v-model="cpuWarningPercentModel"
                type="number"
                layout="stepper"
                :min="0"
                :max="100"
                :step="1"
              />
            </label>
            <label>
              <span>CPU 危险</span>
              <ScInput
                v-model="cpuDangerPercentModel"
                type="number"
                layout="stepper"
                :min="0"
                :max="100"
                :step="1"
              />
            </label>
            <label>
              <span>内存预警</span>
              <ScInput
                v-model="memoryWarningPercentModel"
                type="number"
                layout="stepper"
                :min="0"
                :max="100"
                :step="1"
              />
            </label>
            <label>
              <span>内存危险</span>
              <ScInput
                v-model="memoryDangerPercentModel"
                type="number"
                layout="stepper"
                :min="0"
                :max="100"
                :step="1"
              />
            </label>
            <label>
              <span>磁盘预警</span>
              <ScInput
                v-model="diskWarningPercentModel"
                type="number"
                layout="stepper"
                :min="0"
                :max="100"
                :step="1"
              />
            </label>
            <label>
              <span>磁盘危险</span>
              <ScInput
                v-model="diskDangerPercentModel"
                type="number"
                layout="stepper"
                :min="0"
                :max="100"
                :step="1"
              />
            </label>
          </div>
        </section>

        <section class="server-alert-dialog__group">
          <header>
            <strong>网络 / 延迟</strong>
            <div class="server-alert-dialog__unit-switches">
              <ScSelect
                v-model="ioUnit"
                :options="ioUnitOptions"
                layout="pill"
                class="server-alert-dialog__unit-select"
              />
              <ScSelect
                v-model="latencyUnit"
                :options="latencyUnitOptions"
                layout="pill"
                class="server-alert-dialog__unit-select"
              />
            </div>
          </header>
          <div class="server-alert-dialog__fields">
            <label>
              <span>网络预警</span>
              <ScInput
                v-model="ioWarningModel"
                type="number"
                layout="stepper"
                :min="0"
                :step="ioStep"
              />
            </label>
            <label>
              <span>网络危险</span>
              <ScInput
                v-model="ioDangerModel"
                type="number"
                layout="stepper"
                :min="0"
                :step="ioStep"
              />
            </label>
            <label>
              <span>延迟预警</span>
              <ScInput
                v-model="latencyWarningModel"
                type="number"
                layout="stepper"
                :min="0"
                :step="latencyStep"
              />
            </label>
            <label>
              <span>延迟危险</span>
              <ScInput
                v-model="latencyDangerModel"
                type="number"
                layout="stepper"
                :min="0"
                :step="latencyStep"
              />
            </label>
          </div>
        </section>
      </div>

      <div class="server-alert-dialog__quick-summary">
        <span class="server-alert-dialog__summary-tag is-primary">
          CPU {{ props.form.cpuWarningPercent || 0 }}/{{
            props.form.cpuDangerPercent || 0
          }}%
        </span>
        <span class="server-alert-dialog__summary-tag is-primary">
          内存 {{ props.form.memoryWarningPercent || 0 }}/{{
            props.form.memoryDangerPercent || 0
          }}%
        </span>
        <span class="server-alert-dialog__summary-tag is-primary">
          磁盘 {{ props.form.diskWarningPercent || 0 }}/{{
            props.form.diskDangerPercent || 0
          }}%
        </span>
        <span class="server-alert-dialog__summary-tag is-warning">
          网络 {{ ioWarningModel }} / {{ ioDangerModel }} {{ ioUnit }}/s
        </span>
        <span class="server-alert-dialog__summary-tag is-muted">
          延迟 {{ latencyWarningModel }} / {{ latencyDangerModel }}
          {{ latencyUnit }}
        </span>
      </div>
    </div>

    <template #footer>
      <div class="server-alert-dialog__footer">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="saving" @click="emit('submit')"
          >保存</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import type { ServerAlertSettings } from "../api";

const props = defineProps<{
  modelValue: boolean;
  title: string;
  description?: string;
  form: ServerAlertSettings;
  saving?: boolean;
  showInherit?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:form": [value: ServerAlertSettings];
  submit: [];
}>();

const ioUnitOptions = [
  { label: "KB/s", value: "KB" },
  { label: "MB/s", value: "MB" },
  { label: "GB/s", value: "GB" },
];

const latencyUnitOptions = [
  { label: "ms", value: "ms" },
  { label: "秒", value: "s" },
];

const ioUnit = ref<"KB" | "MB" | "GB">("MB");
const latencyUnit = ref<"ms" | "s">("ms");

const updateForm = (patch: Partial<ServerAlertSettings>) => {
  emit("update:form", {
    ...props.form,
    ...patch,
  });
};

const inheritGlobalModel = computed({
  get: () => Boolean(props.form.inheritGlobal),
  set: (value: boolean) => {
    updateForm({ inheritGlobal: value });
  },
});

const enabledModel = computed({
  get: () => props.form.enabled !== false,
  set: (value: boolean) => {
    updateForm({ enabled: value });
  },
});

const messageEnabledModel = computed({
  get: () => Boolean(props.form.messageEnabled),
  set: (value: boolean) => {
    updateForm({ messageEnabled: value });
  },
});

const resolveIoFactor = (unit: "KB" | "MB" | "GB") =>
  unit === "GB" ? 1024 * 1024 * 1024 : unit === "MB" ? 1024 * 1024 : 1024;

const resolveLatencyFactor = (unit: "ms" | "s") => (unit === "s" ? 1000 : 1);

const syncUnits = (settings?: ServerAlertSettings) => {
  const ioValue = Math.max(
    Number(settings?.ioDangerBytesPerSecond || 0),
    Number(settings?.ioWarningBytesPerSecond || 0),
  );
  ioUnit.value =
    ioValue >= 1024 * 1024 * 1024 ? "GB" : ioValue >= 1024 * 1024 ? "MB" : "KB";
  const latencyValue = Math.max(
    Number(settings?.latencyDangerMs || 0),
    Number(settings?.latencyWarningMs || 0),
  );
  latencyUnit.value = latencyValue >= 1000 ? "s" : "ms";
};

watch(
  () => [
    props.modelValue,
    props.form.ioWarningBytesPerSecond,
    props.form.ioDangerBytesPerSecond,
    props.form.latencyWarningMs,
    props.form.latencyDangerMs,
  ],
  () => {
    if (props.modelValue) {
      syncUnits(props.form);
    }
  },
  { immediate: true },
);

const ioWarningModel = computed({
  get: () =>
    Number(
      (
        (props.form.ioWarningBytesPerSecond || 0) /
        resolveIoFactor(ioUnit.value)
      ).toFixed(2),
    ),
  set: (value: number) => {
    updateForm({
      ioWarningBytesPerSecond: Math.round(
        (Number(value || 0) || 0) * resolveIoFactor(ioUnit.value),
      ),
    });
  },
});

const ioDangerModel = computed({
  get: () =>
    Number(
      (
        (props.form.ioDangerBytesPerSecond || 0) / resolveIoFactor(ioUnit.value)
      ).toFixed(2),
    ),
  set: (value: number) => {
    updateForm({
      ioDangerBytesPerSecond: Math.round(
        (Number(value || 0) || 0) * resolveIoFactor(ioUnit.value),
      ),
    });
  },
});

const latencyWarningModel = computed({
  get: () =>
    Number(
      (
        (props.form.latencyWarningMs || 0) /
        resolveLatencyFactor(latencyUnit.value)
      ).toFixed(2),
    ),
  set: (value: number) => {
    updateForm({
      latencyWarningMs: Math.round(
        (Number(value || 0) || 0) * resolveLatencyFactor(latencyUnit.value),
      ),
    });
  },
});

const latencyDangerModel = computed({
  get: () =>
    Number(
      (
        (props.form.latencyDangerMs || 0) /
        resolveLatencyFactor(latencyUnit.value)
      ).toFixed(2),
    ),
  set: (value: number) => {
    updateForm({
      latencyDangerMs: Math.round(
        (Number(value || 0) || 0) * resolveLatencyFactor(latencyUnit.value),
      ),
    });
  },
});

const ioStep = computed(() =>
  ioUnit.value === "GB" ? 0.1 : ioUnit.value === "MB" ? 1 : 128,
);
const latencyStep = computed(() => (latencyUnit.value === "s" ? 0.1 : 10));

const createNumberProxy = (key: keyof ServerAlertSettings) =>
  computed({
    get: () => Number(props.form[key] || 0),
    set: (value: number | string) => {
      updateForm({ [key]: Number(value || 0) || 0 });
    },
  });

const cpuWarningPercentModel = createNumberProxy("cpuWarningPercent");
const cpuDangerPercentModel = createNumberProxy("cpuDangerPercent");
const memoryWarningPercentModel = createNumberProxy("memoryWarningPercent");
const memoryDangerPercentModel = createNumberProxy("memoryDangerPercent");
const diskWarningPercentModel = createNumberProxy("diskWarningPercent");
const diskDangerPercentModel = createNumberProxy("diskDangerPercent");
</script>

<style scoped lang="scss">
.server-alert-dialog {
  display: grid;
  gap: 18px;
}

:deep(.el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding-bottom: 4px;
}

.server-alert-dialog__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.server-alert-dialog__toolbar {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-fill-color-light) 82%, white);
}

.server-alert-dialog__focus-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.server-alert-dialog__focus-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 8%, transparent),
      transparent 58%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 90%, white);
}

.server-alert-dialog__focus-card small,
.server-alert-dialog__focus-card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.server-alert-dialog__focus-card strong {
  color: var(--el-text-color-primary);
  font-size: 16px;
  line-height: 1.3;
}

.server-alert-dialog__toolbar-main,
.server-alert-dialog__switches,
.server-alert-dialog__summary,
.server-alert-dialog__unit-switches {
  display: flex;
  align-items: center;
}

.server-alert-dialog__toolbar-main,
.server-alert-dialog__summary,
.server-alert-dialog__group header,
.server-alert-dialog__footer {
  justify-content: space-between;
  gap: 12px;
}

.server-alert-dialog__switches,
.server-alert-dialog__summary,
.server-alert-dialog__unit-switches {
  gap: 10px;
}

.server-alert-dialog__summary {
  flex-wrap: wrap;
}

.server-alert-dialog__summary-tag {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 92%, white);
}

.server-alert-dialog__summary-tag.is-primary {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
}

.server-alert-dialog__summary-tag.is-warning {
  color: #b45309;
  background: rgba(251, 191, 36, 0.16);
}

.server-alert-dialog__summary-tag.is-muted {
  color: var(--el-text-color-secondary);
}

.server-alert-dialog__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-alert-dialog__group {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 7%, transparent),
      transparent 54%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 90%, white);
}

.server-alert-dialog__group header span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-alert-dialog__fields {
  display: grid;
  gap: 10px 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-alert-dialog__fields label {
  display: grid;
  gap: 8px;
}

.server-alert-dialog__fields span {
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.server-alert-dialog :deep(.el-form-item__label) {
  padding-bottom: 6px;
  font-weight: 600;
}

.server-alert-dialog__unit-select {
  min-width: 150px;
}

.server-alert-dialog__quick-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.server-alert-dialog :deep(.sc-number-stepper) {
  min-height: 32px;
}

@media (max-width: 900px) {
  .server-alert-dialog__focus-grid,
  .server-alert-dialog__grid,
  .server-alert-dialog__fields {
    grid-template-columns: 1fr;
  }

  .server-alert-dialog__toolbar-main,
  .server-alert-dialog__switches,
  .server-alert-dialog__group header {
    align-items: flex-start;
    flex-direction: column;
  }
}

.server-alert-dialog__unit-select :deep(.pill-selector-flex) {
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .server-alert-dialog__grid {
    grid-template-columns: 1fr;
  }

  .server-alert-dialog__toolbar-main,
  .server-alert-dialog__group header {
    display: grid;
  }
}
</style>
