<template>
  <ScDialog
    :model-value="modelValue"
    destroy-on-close
    width="760px"
    title="指标采集任务"
    @update:model-value="emit('update:modelValue', $event)"
   layout="simple">
    <div class="server-metrics-task-dialog">
      <header class="server-metrics-task-dialog__hero">
        <div>
          <strong>采集任务状态</strong>
          <p>
            运行时修改采集开关、采样间隔与缓存策略；启用 `job-starter`
            时会同步到任务表。单机模式下会在统一调度里按服务器自己的周期执行。
          </p>
        </div>
        <div class="server-metrics-task-dialog__chips">
          <span v-if="draft.serverName" class="server-metrics-task-dialog__chip">
            {{ draft.serverName }}
          </span>
          <span class="server-metrics-task-dialog__chip">
            {{ draft.status || "UNKNOWN" }}
          </span>
          <span class="server-metrics-task-dialog__chip">
            {{ draft.schedulerMode || "LOCAL_FALLBACK" }}
          </span>
          <span class="server-metrics-task-dialog__chip">
            历史上限 {{ draft.historyLimit || 0 }}
          </span>
        </div>
      </header>

      <el-form label-position="top" class="server-metrics-task-dialog__form">
        <div class="server-metrics-task-dialog__grid">
          <el-form-item
            v-if="draft.serverId"
            label="继承全局策略"
          >
            <ScSwitch v-model="draft.inheritGlobal" />
          </el-form-item>
          <el-form-item label="启用采集">
            <ScSwitch
              v-model="draft.enabled"
              :disabled="draft.inheritGlobal === true && Boolean(draft.serverId)"
            />
          </el-form-item>
          <el-form-item label="缓存快照">
            <ScSwitch
              v-model="draft.cacheEnabled"
              :disabled="draft.inheritGlobal === true && Boolean(draft.serverId)"
            />
          </el-form-item>
          <el-form-item label="刷新间隔(ms)">
            <ScInput
              v-model="draft.refreshIntervalMs"
              type="number"
              layout="stepper"
              :min="1000"
              :step="1000"
              :disabled="draft.inheritGlobal === true && Boolean(draft.serverId)"
            />
          </el-form-item>
          <el-form-item label="采集超时(ms)">
            <ScInput
              v-model="draft.timeoutMs"
              type="number"
              layout="stepper"
              :min="1000"
              :step="1000"
              :disabled="draft.inheritGlobal === true && Boolean(draft.serverId)"
            />
          </el-form-item>
          <el-form-item label="缓存 TTL(秒)">
            <ScInput
              v-model="draft.cacheTtlSeconds"
              type="number"
              layout="stepper"
              :min="60"
              :step="60"
              :disabled="draft.inheritGlobal === true && Boolean(draft.serverId)"
            />
          </el-form-item>
          <el-form-item label="下次执行">
            <ScInput
              :model-value="
                formatTime(draft.jobNextTriggerAt || draft.nextRefreshAt)
              "
              readonly
            />
          </el-form-item>
        </div>
        <p
          v-if="draft.serverId"
          class="server-metrics-task-dialog__hint"
        >
          {{
            draft.inheritGlobal
              ? "当前服务器跟随全局采集策略。关闭继承后，可为这台服务器单独设置采样周期。"
              : "当前服务器使用独立采集策略，统一任务会按这台服务器自己的周期判断是否采样。"
          }}
        </p>
      </el-form>

      <section class="server-metrics-task-dialog__preferences">
        <div class="server-metrics-task-dialog__preferences-head">
          <div>
            <strong>显示与查询配置</strong>
            <p>控制进程返回数量、服务展示数量、默认历史范围和图表横轴上限。</p>
          </div>
          <span class="server-metrics-task-dialog__chip">
            本地偏好
          </span>
        </div>
        <div class="server-metrics-task-dialog__grid">
          <el-form-item label="进程返回数量">
            <ScInput
              v-model="uiDraft.processQueryLimit"
              type="number"
              layout="stepper"
              :min="20"
              :step="10"
            />
          </el-form-item>
          <el-form-item label="服务返回数量">
            <ScInput
              v-model="uiDraft.serviceReturnLimit"
              type="number"
              layout="stepper"
              :min="1"
              :step="1"
            />
          </el-form-item>
          <el-form-item label="历史缓存上限">
            <ScInput
              v-model="uiDraft.metricHistoryLimit"
              type="number"
              layout="stepper"
              :min="60"
              :step="10"
            />
          </el-form-item>
          <el-form-item label="默认历史范围(分钟)">
            <ScInput
              v-model="uiDraft.metricHistoryMinutes"
              type="number"
              layout="stepper"
              :min="15"
              :step="15"
            />
          </el-form-item>
          <el-form-item label="详情 X 轴上限">
            <ScInput
              v-model="uiDraft.metricDetailXAxisLimit"
              type="number"
              layout="stepper"
              :min="12"
              :step="6"
            />
          </el-form-item>
        </div>
      </section>

      <div class="server-metrics-task-dialog__timeline">
        <article class="server-metrics-task-dialog__card">
          <small>最近执行</small>
          <strong>{{ formatTime(draft.lastRefreshAt) }}</strong>
          <span>刷新页面和实时 Socket 都会基于这次采样继续工作。</span>
        </article>
        <article class="server-metrics-task-dialog__card">
          <small>当前策略</small>
          <strong>{{
            draft.enabled ? "自动采集开启" : "自动采集已暂停"
          }}</strong>
          <span>
            {{
              draft.enabled
                ? `每 ${Math.max(Number(draft.refreshIntervalMs || 0) / 1000, 1)} 秒采样一次`
                : "仅保留手工刷新"
            }}
          </span>
        </article>
        <article class="server-metrics-task-dialog__card">
          <small>调度驱动</small>
          <strong>{{ draft.schedulerMode || "LOCAL_FALLBACK" }}</strong>
          <span>
            {{
              draft.jobEnabled
                ? `任务表已接管，执行器 ${draft.jobName || "--"}`
                : "当前使用本地安全回退调度"
            }}
          </span>
        </article>
        <article class="server-metrics-task-dialog__card">
          <small>Job 状态</small>
          <strong>{{ draft.jobStatus || "--" }}</strong>
          <span>
            {{
              draft.jobEnabled
                ? `${draft.jobScheduleType || "--"} / ${draft.jobScheduleTime || "--"}`
                : "未启用 job 表驱动"
            }}
          </span>
        </article>
      </div>
    </div>

    <template #footer>
      <div class="server-metrics-task-dialog__footer">
        <ScButton @click="emit('refresh-now')">
          <IconifyIconOnline icon="ri:refresh-line" />
          <span>立即采集</span>
        </ScButton>
        <ScButton @click="emit('update:modelValue', false)">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="submit">
          保存
        </ScButton>
      </div>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import type {
  ServerMetricsTaskSettings,
  ServerMetricsTaskSettingsRequest,
} from "../api";

type ServerViewSettings = {
  processQueryLimit: number;
  serviceReturnLimit: number;
  metricHistoryLimit: number;
  metricHistoryMinutes: number;
  metricDetailXAxisLimit: number;
};

type ServerMetricsTaskDialogSubmitPayload = {
  taskSettings: ServerMetricsTaskSettingsRequest;
  uiSettings: ServerViewSettings;
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    saving?: boolean;
    form?: ServerMetricsTaskSettings | null;
    uiSettings?: Partial<ServerViewSettings> | null;
  }>(),
  {
    saving: false,
    form: null,
    uiSettings: null,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [value: ServerMetricsTaskDialogSubmitPayload];
  "refresh-now": [];
}>();

const draft = reactive<ServerMetricsTaskSettings>({
  enabled: true,
  inheritGlobal: true,
  refreshIntervalMs: 5000,
  timeoutMs: 8000,
  cacheEnabled: true,
  cacheTtlSeconds: 3600,
  schedulerMode: "LOCAL_FALLBACK",
  jobEnabled: false,
  lastRefreshAt: undefined,
  nextRefreshAt: undefined,
  historyLimit: 0,
  status: "UNKNOWN",
  jobId: undefined,
  jobNo: undefined,
  jobName: undefined,
  jobScheduleType: undefined,
  jobScheduleTime: undefined,
  jobStatus: undefined,
  jobLastTriggerAt: undefined,
  jobNextTriggerAt: undefined,
  manualTriggerSupported: true,
});
const uiDraft = reactive<ServerViewSettings>({
  processQueryLimit: 120,
  serviceReturnLimit: 10,
  metricHistoryLimit: 240,
  metricHistoryMinutes: 120,
  metricDetailXAxisLimit: 48,
});

const syncDraft = () => {
  Object.assign(
    draft,
    {
      enabled: true,
      inheritGlobal: true,
      refreshIntervalMs: 5000,
      timeoutMs: 8000,
      cacheEnabled: true,
      cacheTtlSeconds: 3600,
      schedulerMode: "LOCAL_FALLBACK",
      jobEnabled: false,
      lastRefreshAt: undefined,
      nextRefreshAt: undefined,
      historyLimit: 0,
      status: "UNKNOWN",
      jobId: undefined,
      jobNo: undefined,
      jobName: undefined,
      jobScheduleType: undefined,
      jobScheduleTime: undefined,
      jobStatus: undefined,
      jobLastTriggerAt: undefined,
      jobNextTriggerAt: undefined,
      manualTriggerSupported: true,
    },
    props.form || {},
  );
  Object.assign(
    uiDraft,
    {
      processQueryLimit: 120,
      serviceReturnLimit: 10,
      metricHistoryLimit: 240,
      metricHistoryMinutes: 120,
      metricDetailXAxisLimit: 48,
    },
    props.uiSettings || {},
  );
};

watch(
  () => [props.form, props.modelValue, props.uiSettings],
  () => syncDraft(),
  { immediate: true, deep: true },
);

const submit = () => {
  emit("submit", {
    taskSettings: {
      inheritGlobal: Boolean(draft.serverId) ? Boolean(draft.inheritGlobal) : undefined,
      enabled: Boolean(draft.enabled),
      refreshIntervalMs: Math.max(Number(draft.refreshIntervalMs || 0), 1000),
      timeoutMs: Math.max(Number(draft.timeoutMs || 0), 1000),
      cacheEnabled: Boolean(draft.cacheEnabled),
      cacheTtlSeconds: Math.max(Number(draft.cacheTtlSeconds || 0), 60),
    },
    uiSettings: {
      processQueryLimit: Math.max(Number(uiDraft.processQueryLimit || 0), 20),
      serviceReturnLimit: Math.max(Number(uiDraft.serviceReturnLimit || 0), 1),
      metricHistoryLimit: Math.max(Number(uiDraft.metricHistoryLimit || 0), 60),
      metricHistoryMinutes: Math.max(Number(uiDraft.metricHistoryMinutes || 0), 15),
      metricDetailXAxisLimit: Math.max(Number(uiDraft.metricDetailXAxisLimit || 0), 12),
    },
  });
};

const formatTime = (value?: number | null) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "--";
</script>

<style scoped lang="scss">
.server-metrics-task-dialog {
  display: grid;
  gap: 16px;
}

.server-metrics-task-dialog__hero,
.server-metrics-task-dialog__chips,
.server-metrics-task-dialog__footer {
  display: flex;
  align-items: center;
}

.server-metrics-task-dialog__hero {
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 12%, transparent),
      transparent 56%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 84%, white);
}

.server-metrics-task-dialog__hero strong {
  display: block;
  font-size: 16px;
}

.server-metrics-task-dialog__hero p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.server-metrics-task-dialog__chips {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-metrics-task-dialog__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-metrics-task-dialog__preferences {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 90%, white);
}

.server-metrics-task-dialog__preferences-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.server-metrics-task-dialog__preferences-head strong {
  display: block;
  font-size: 15px;
}

.server-metrics-task-dialog__preferences-head p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-metrics-task-dialog__grid,
.server-metrics-task-dialog__timeline {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-metrics-task-dialog__card {
  display: grid;
  gap: 6px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 88%, white);
}

.server-metrics-task-dialog__card small,
.server-metrics-task-dialog__card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-metrics-task-dialog__card strong {
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.server-metrics-task-dialog__hint {
  margin: 2px 2px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
}

.server-metrics-task-dialog__footer {
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 900px) {
  .server-metrics-task-dialog__grid,
  .server-metrics-task-dialog__timeline {
    grid-template-columns: 1fr;
  }
}
</style>
