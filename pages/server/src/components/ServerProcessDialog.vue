<template>
  <el-dialog
    v-model="dialogVisible"
    destroy-on-close
    width="94vw"
    class="server-process-dialog"
    :title="host ? `${host.serverName} · 进程管理` : '进程管理'"
  >
    <template #header>
      <div class="server-process-dialog__header">
        <div>
          <h3>{{ host ? `${host.serverName} · 进程管理` : "进程管理" }}</h3>
          <p>
            支持实时刷新、进程结束和 AI 风险分析，作为服务器任务管理器入口。
          </p>
          <small
            v-if="!aiEnabled && aiUnavailableReason"
            class="server-process-dialog__hint"
          >
            AI 未激活: {{ aiUnavailableReason }}
          </small>
        </div>
        <div class="server-process-dialog__summary">
          <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
            总数 {{ processes.length }}
          </ScTag>
          <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
            SPI {{ processProviderText }}
          </ScTag>
          <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
            高负载 {{ highRiskCount }}
          </ScTag>
          <ScTag
            size="small"
            effect="plain"
            round
            class="server-process-dialog__chip"
            :type="streamConnected ? 'success' : 'info'"
            :class="streamConnected ? 'is-success' : 'is-muted'"
          >
            {{
              streamConnected
                ? `Socket ${streamLastEventAt ? `· ${formatDateTime(streamLastEventAt)}` : "在线"}`
                : "Socket 未接管"
            }}
          </ScTag>
          <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
            {{
              refreshedAt
                ? `刷新于 ${formatDateTime(refreshedAt)}`
                : "尚未拉取进程"
            }}
          </ScTag>
        </div>
      </div>
    </template>

    <div class="server-process-dialog__toolbar">
      <ScInput
        :model-value="keyword"
        clearable
        placeholder="搜索进程名 / PID / 命令行"
        @update:model-value="emit('update:keyword', String($event || ''))"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </ScInput>
      <div class="server-process-dialog__toolbar-actions">
        <span class="server-process-dialog__switch-label">实时刷新</span>
        <el-switch
          :model-value="autoRefresh"
          @update:model-value="emit('update:autoRefresh', Boolean($event))"
        />
        <el-button circle :loading="loading" @click="emit('refresh')">
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </div>
    </div>

    <div class="server-process-dialog__stage">
      <div v-loading="loading" class="server-process-dialog__list thin-scroller">
        <article
          v-for="item in processes"
          :key="item.pid"
          class="server-process-dialog__item"
          role="button"
          tabindex="0"
          :class="{
            'is-active': item.pid === selectedProcess?.pid,
            'is-warning':
              toPercent(item.cpuPercent) >= 40 ||
              toPercent(item.memoryPercent) >= 15,
            'is-danger':
              toPercent(item.cpuPercent) >= 80 ||
              toPercent(item.memoryPercent) >= 30,
          }"
          @click="emit('select-process', item)"
          @dblclick="openDetail(item)"
          @keydown.enter.prevent="emit('select-process', item)"
        >
          <div class="server-process-dialog__item-top">
            <div>
              <strong>{{ item.name || item.command || "未命名进程" }}</strong>
              <p>
                PID {{ item.pid || "--" }}
                <template v-if="item.parentPid">
                  · PPID {{ item.parentPid }}</template
                >
                <template v-if="item.user"> · {{ item.user }}</template>
              </p>
            </div>
            <span class="server-process-dialog__state">
              {{ item.state || "RUNNING" }}
            </span>
          </div>
          <div class="server-process-dialog__metric-row">
            <span>CPU {{ formatPercent(item.cpuPercent) }}</span>
            <span>内存 {{ formatPercent(item.memoryPercent) }}</span>
            <span>{{ formatBytes(item.memoryBytes) }}</span>
            <span>SPI {{ processProviderLabel(item) }}</span>
          </div>
          <p class="server-process-dialog__command">
            {{ item.commandLine || item.command || "-" }}
          </p>
          <div class="server-process-dialog__item-bottom">
            <div class="server-process-dialog__metric-row">
              <span>线程 {{ item.threadCount || "--" }}</span>
              <span>{{ item.elapsed || "刚启动" }}</span>
            </div>
            <el-tooltip content="查看进程详情">
              <el-button circle plain @click.stop="openDetail(item)">
                <IconifyIconOnline icon="ri:article-line" />
              </el-button>
            </el-tooltip>
          </div>
        </article>
        <el-empty
          v-if="!loading && !processes.length"
          description="当前没有匹配的进程"
        />
      </div>

      <div class="server-process-dialog__detail thin-scroller">
        <template v-if="selectedProcess">
          <div class="server-process-dialog__detail-hero">
            <div>
              <h4>
                {{
                  selectedProcess.name ||
                  selectedProcess.command ||
                  "未命名进程"
                }}
              </h4>
              <p>
                {{
                  selectedProcess.commandLine || selectedProcess.command || "-"
                }}
              </p>
              <div class="server-process-dialog__detail-pills">
                <ScTag size="small" effect="plain" round>
                  PID {{ selectedProcess.pid || "--" }}
                </ScTag>
                <ScTag size="small" effect="plain" round>
                  {{ selectedProcess.state || "RUNNING" }}
                </ScTag>
                <ScTag size="small" effect="plain" round>
                  SPI {{ processProviderLabel(selectedProcess) }}
                </ScTag>
              </div>
            </div>
            <div class="server-process-dialog__detail-actions">
              <el-tooltip
                :content="
                  aiEnabled ? 'AI 分析' : aiUnavailableReason || 'AI 能力未激活'
                "
              >
                <el-button
                  circle
                  plain
                  :disabled="!aiEnabled"
                  :loading="aiAnalyzing"
                  @click="emit('analyze-process', selectedProcess)"
                >
                  <IconifyIconOnline icon="ri:ai-generate-2" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="结束进程">
                <el-button
                  circle
                  type="warning"
                  plain
                  :loading="
                    actionLoadingKey === `terminate:${selectedProcess.pid}`
                  "
                  @click="
                    emit('terminate-process', {
                      process: selectedProcess,
                      force: false,
                    })
                  "
                >
                  <IconifyIconOnline icon="ri:stop-circle-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="强制结束">
                <el-button
                  circle
                  type="danger"
                  plain
                  :loading="actionLoadingKey === `force:${selectedProcess.pid}`"
                  @click="
                    emit('terminate-process', {
                      process: selectedProcess,
                      force: true,
                    })
                  "
                >
                  <IconifyIconOnline icon="ri:close-circle-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="弹框查看详情">
                <el-button circle plain @click="openDetail(selectedProcess)">
                  <IconifyIconOnline icon="ri:article-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <div class="server-process-dialog__stats">
            <div class="server-process-dialog__stat">
              <small>CPU</small>
              <strong>{{ formatPercent(selectedProcess.cpuPercent) }}</strong>
              <div class="server-process-dialog__stat-bar">
                <span :style="{ width: `${toPercent(selectedProcess.cpuPercent)}%` }" />
              </div>
              <span>当前热点排序依据</span>
            </div>
            <div class="server-process-dialog__stat">
              <small>内存</small>
              <strong>{{
                formatPercent(selectedProcess.memoryPercent)
              }}</strong>
              <div class="server-process-dialog__stat-bar is-memory">
                <span
                  :style="{ width: `${toPercent(selectedProcess.memoryPercent)}%` }"
                />
              </div>
              <span>{{ formatBytes(selectedProcess.memoryBytes) }}</span>
            </div>
            <div class="server-process-dialog__stat">
              <small>线程</small>
              <strong>{{ selectedProcess.threadCount || "--" }}</strong>
              <span>
                状态 {{ selectedProcess.state || "RUNNING" }} · SPI
                {{ processProviderLabel(selectedProcess) }}
              </span>
            </div>
            <div class="server-process-dialog__stat">
              <small>运行时长</small>
              <strong>{{ selectedProcess.elapsed || "--" }}</strong>
              <span>{{ selectedProcess.startTime || "启动时间未知" }}</span>
            </div>
          </div>

          <div class="server-process-dialog__detail-card">
            <div class="server-process-dialog__detail-grid">
              <div>
                <small>PID</small>
                <strong>{{ selectedProcess.pid || "--" }}</strong>
              </div>
              <div>
                <small>父进程</small>
                <strong>{{ selectedProcess.parentPid || "--" }}</strong>
              </div>
              <div>
                <small>所属用户</small>
                <strong>{{ selectedProcess.user || "--" }}</strong>
              </div>
              <div>
                <small>命令</small>
                <strong>{{
                  selectedProcess.command || selectedProcess.name || "--"
                }}</strong>
              </div>
              <div>
                <small>执行通道</small>
                <strong>{{ processProviderLabel(selectedProcess) }}</strong>
              </div>
            </div>
            <div class="server-process-dialog__detail-block">
              <small>命令行</small>
              <p>{{ selectedProcess.commandLine || "-" }}</p>
            </div>
          </div>

          <article
            v-if="aiAdvice?.summary || aiAdvice?.suggestion"
            class="server-process-dialog__ai-card"
          >
            <div class="server-process-dialog__ai-top">
              <strong>AI / 诊断结论</strong>
              <div class="server-process-dialog__summary">
                <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
                  {{ aiAdvice?.riskLevel || "UNKNOWN" }}
                </ScTag>
                <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
                  {{ aiAdvice?.provider || "LOCAL_HEURISTIC" }}
                </ScTag>
              </div>
            </div>
            <p>{{ aiAdvice?.summary }}</p>
            <small>{{ aiAdvice?.suggestion }}</small>
          </article>
          <el-empty
            v-else
            description="选择 AI 分析后，这里会展示进程风险判断和处理建议"
          />
        </template>
        <el-empty v-else description="从左侧选择一个进程查看详情" />
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      destroy-on-close
      width="960px"
      append-to-body
      class="server-process-detail-dialog"
      :title="
        detailProcess
          ? `${detailProcess.name || detailProcess.command || '未命名进程'} · 进程详情`
          : '进程详情'
      "
    >
      <template v-if="detailProcess">
        <div class="server-process-detail-dialog__hero">
          <div>
            <h4>
              {{ detailProcess.name || detailProcess.command || "未命名进程" }}
            </h4>
            <p>
              {{ detailProcess.commandLine || detailProcess.command || "-" }}
            </p>
          </div>
          <div class="server-process-detail-dialog__actions">
            <el-tooltip
              :content="
                aiEnabled ? 'AI 分析' : aiUnavailableReason || 'AI 能力未激活'
              "
            >
              <el-button
                circle
                plain
                :disabled="!aiEnabled"
                :loading="
                  aiAnalyzing && detailProcess.pid === selectedProcess?.pid
                "
                @click="emit('analyze-process', detailProcess)"
              >
                <IconifyIconOnline icon="ri:ai-generate-2" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="结束进程">
              <el-button
                circle
                type="warning"
                plain
                :loading="actionLoadingKey === `terminate:${detailProcess.pid}`"
                @click="
                  emit('terminate-process', {
                    process: detailProcess,
                    force: false,
                  })
                "
              >
                <IconifyIconOnline icon="ri:stop-circle-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="强制结束">
              <el-button
                circle
                type="danger"
                plain
                :loading="actionLoadingKey === `force:${detailProcess.pid}`"
                @click="
                  emit('terminate-process', {
                    process: detailProcess,
                    force: true,
                  })
                "
              >
                <IconifyIconOnline icon="ri:close-circle-line" />
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <div class="server-process-detail-dialog__stats">
          <div class="server-process-detail-dialog__stat">
            <small>PID</small>
            <strong>{{ detailProcess.pid || "--" }}</strong>
            <span>父进程 {{ detailProcess.parentPid || "--" }}</span>
          </div>
          <div class="server-process-detail-dialog__stat">
            <small>CPU</small>
            <strong>{{ formatPercent(detailProcess.cpuPercent) }}</strong>
            <span>
              线程 {{ detailProcess.threadCount || "--" }} · SPI
              {{ processProviderLabel(detailProcess) }}
            </span>
          </div>
          <div class="server-process-detail-dialog__stat">
            <small>内存</small>
            <strong>{{ formatPercent(detailProcess.memoryPercent) }}</strong>
            <span>{{ formatBytes(detailProcess.memoryBytes) }}</span>
          </div>
          <div class="server-process-detail-dialog__stat">
            <small>运行状态</small>
            <strong>{{ detailProcess.state || "RUNNING" }}</strong>
            <span>{{ detailProcess.elapsed || "刚启动" }}</span>
          </div>
        </div>

        <div class="server-process-detail-dialog__grid">
          <article class="server-process-detail-dialog__card">
            <h5>基础字段</h5>
            <dl class="server-process-detail-dialog__meta">
              <div>
                <dt>所属用户</dt>
                <dd>{{ detailProcess.user || "--" }}</dd>
              </div>
              <div>
                <dt>启动时间</dt>
                <dd>{{ detailProcess.startTime || "--" }}</dd>
              </div>
              <div>
                <dt>命令</dt>
                <dd>
                  {{ detailProcess.command || detailProcess.name || "--" }}
                </dd>
              </div>
              <div>
                <dt>是否存活</dt>
                <dd>{{ detailProcess.alive === false ? "否" : "是" }}</dd>
              </div>
            </dl>
          </article>

          <article class="server-process-detail-dialog__card">
            <h5>命令行</h5>
            <p class="server-process-detail-dialog__command">
              {{ detailProcess.commandLine || "-" }}
            </p>
          </article>

          <article
            class="server-process-detail-dialog__card server-process-detail-dialog__card--wide"
          >
            <div class="server-process-detail-dialog__ai-top">
              <h5>AI 分析</h5>
              <span class="server-process-dialog__chip">
                {{
                  aiAdvice && detailProcess.pid === selectedProcess?.pid
                    ? aiAdvice.provider || aiAdvice.riskLevel || "AI"
                    : "等待分析"
                }}
              </span>
            </div>
            <template
              v-if="aiAdvice && detailProcess.pid === selectedProcess?.pid"
            >
              <p class="server-process-detail-dialog__command">
                {{ aiAdvice.summary || "暂无摘要" }}
              </p>
              <p class="server-process-detail-dialog__command">
                {{ aiAdvice.suggestion || "暂无建议" }}
              </p>
            </template>
            <el-empty
              v-else
              description="触发 AI 分析后，会在这里展示风险等级与处理建议"
            />
          </article>
        </div>
      </template>
      <el-empty v-else description="未选择进程" />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import type {
  ServerHost,
  ServerProcessAiAdvice,
  ServerProcessView,
} from "../api";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    host?: ServerHost | null;
    processes?: ServerProcessView[];
    selectedProcess?: ServerProcessView | null;
    loading?: boolean;
    keyword?: string;
    autoRefresh?: boolean;
    refreshedAt?: number | null;
    streamConnected?: boolean;
    streamLastEventAt?: number | null;
    aiEnabled?: boolean;
    aiUnavailableReason?: string;
    aiAnalyzing?: boolean;
    aiAdvice?: ServerProcessAiAdvice | null;
    actionLoadingKey?: string;
  }>(),
  {
    host: null,
    processes: () => [],
    selectedProcess: null,
    loading: false,
    keyword: "",
    autoRefresh: true,
    refreshedAt: null,
    streamConnected: false,
    streamLastEventAt: null,
    aiEnabled: false,
    aiUnavailableReason: "",
    aiAnalyzing: false,
    aiAdvice: null,
    actionLoadingKey: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:keyword": [value: string];
  "update:autoRefresh": [value: boolean];
  refresh: [];
  "select-process": [process: ServerProcessView];
  "analyze-process": [process: ServerProcessView];
  "terminate-process": [
    payload: { process: ServerProcessView; force: boolean },
  ];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});
const detailVisible = ref(false);
const detailPid = ref<number | null>(null);

const detailProcess = computed(() => {
  if (detailPid.value === null) {
    return props.selectedProcess || null;
  }
  return (
    props.processes.find((item) => item.pid === detailPid.value) ||
    props.selectedProcess ||
    null
  );
});

const openDetail = (process?: ServerProcessView | null) => {
  detailPid.value = Number(process?.pid || 0) || null;
  detailVisible.value = Boolean(process);
};

const highRiskCount = computed(
  () =>
    props.processes.filter(
      (item) =>
        toPercent(item.cpuPercent) >= 80 || toPercent(item.memoryPercent) >= 30,
    ).length,
);

const processProviderLabel = (process?: ServerProcessView | null) => {
  const normalized = String(
    process?.executionProvider || process?.spiChannel || props.host?.serverType,
  )
    .trim()
    .toUpperCase();
  if (normalized === "LOCAL") {
    return "本机";
  }
  if (normalized === "SSH") {
    return "SSH";
  }
  if (normalized === "WINRM") {
    return "WinRM";
  }
  return normalized || "未记录";
};

const processProviderText = computed(() =>
  processProviderLabel(props.selectedProcess || props.processes[0] || null),
);

const toPercent = (value?: number | null) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const formatPercent = (value?: number | null) =>
  Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)}%` : "--";

const formatBytes = (value?: number | null) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "内存未知";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = numeric;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDateTime = (value?: number | null) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "--";

watch(
  () => props.selectedProcess?.pid,
  (value) => {
    if (!detailVisible.value || !value) {
      return;
    }
    detailPid.value = value;
  },
);

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      return;
    }
    detailVisible.value = false;
    detailPid.value = null;
  },
);
</script>

<style scoped lang="scss">
.server-process-dialog :deep(.el-dialog) {
  max-width: 1460px;
  border-radius: 28px;
  overflow: hidden;
}

.server-process-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.server-process-dialog__header,
.server-process-dialog__summary,
.server-process-dialog__toolbar,
.server-process-dialog__toolbar-actions,
.server-process-dialog__item-top,
.server-process-dialog__item-bottom,
.server-process-dialog__metric-row,
.server-process-dialog__detail-hero,
.server-process-dialog__detail-actions,
.server-process-dialog__ai-top,
.server-process-detail-dialog__hero,
.server-process-detail-dialog__actions,
.server-process-detail-dialog__ai-top {
  display: flex;
  align-items: center;
}

.server-process-dialog__header,
.server-process-dialog__toolbar,
.server-process-dialog__detail-hero,
.server-process-dialog__ai-top {
  justify-content: space-between;
}

.server-process-dialog__header {
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.server-process-dialog__header h3 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.server-process-dialog__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__hint {
  display: block;
  margin-top: 6px;
  color: #b45309;
  font-size: 12px;
}

.server-process-dialog__summary {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-process-dialog__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  color: #334155;
  background: rgba(15, 23, 42, 0.06);
}

.server-process-dialog__chip.is-success {
  color: #047857;
  background: rgba(16, 185, 129, 0.12);
}

.server-process-dialog__chip.is-muted {
  color: #64748b;
  background: rgba(148, 163, 184, 0.12);
}

.server-process-dialog__toolbar {
  gap: 14px;
  margin-bottom: 16px;
  align-items: stretch;
  padding: 15px 16px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-process-dialog__toolbar-actions {
  gap: 10px;
  flex-shrink: 0;
}

.server-process-dialog__switch-label {
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__stage {
  display: grid;
  grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.22fr);
  gap: 18px;
  min-height: 620px;
  align-items: stretch;
}

.server-process-dialog__list,
.server-process-dialog__detail {
  min-height: 0;
  min-width: 0;
  padding: 18px;
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 22%),
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 30%),
    rgba(248, 250, 252, 0.94);
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-process-dialog__list {
  display: grid;
  gap: 10px;
  align-content: start;
  overflow: auto;
  max-height: 620px;
  overflow-x: hidden;
}

.server-process-dialog__detail {
  display: grid;
  gap: 14px;
  align-content: start;
  overflow: auto;
  max-height: 620px;
  overflow-x: hidden;
}

.server-process-dialog__item {
  width: 100%;
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.server-process-dialog__item:hover,
.server-process-dialog__item.is-active {
  transform: translateY(-2px);
  border-color: rgba(14, 165, 233, 0.3);
  box-shadow:
    0 18px 28px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-process-dialog__item.is-warning {
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.16);
}

.server-process-dialog__item.is-danger {
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.18);
}

.server-process-dialog__item-top {
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.server-process-dialog__item-bottom {
  justify-content: space-between;
  gap: 10px;
}

.server-process-dialog__item-top strong,
.server-process-dialog__detail-hero h4 {
  color: #0f172a;
}

.server-process-dialog__item-top strong {
  font-size: 15px;
}

.server-process-dialog__item-top p,
.server-process-dialog__command,
.server-process-dialog__detail-hero p,
.server-process-dialog__detail-block p,
.server-process-dialog__ai-card p,
.server-process-dialog__ai-card small {
  margin: 0;
  color: #64748b;
  line-height: 1.65;
}

.server-process-dialog__command {
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.server-process-dialog__metric-row {
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  color: #475569;
  font-size: 12px;
}

.server-process-dialog__state {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
  font-size: 12px;
  font-weight: 600;
}

.server-process-dialog__detail-hero {
  gap: 14px;
  align-items: flex-start;
  padding: 20px 22px;
  min-height: 112px;
  border-radius: 26px;
  background:
    radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.08), transparent 24%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.94));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 18px 32px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.server-process-dialog__detail-hero h4 {
  margin: 0;
  font-size: 22px;
}

.server-process-dialog__detail-actions {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex-shrink: 0;
}

.server-process-dialog__detail-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.server-process-dialog__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.server-process-dialog__stat,
.server-process-dialog__detail-card,
.server-process-dialog__ai-card {
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  box-shadow:
    0 10px 18px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-process-dialog__stat {
  display: grid;
  gap: 6px;
  padding: 14px;
}

.server-process-dialog__stat-bar {
  width: 100%;
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(14, 165, 233, 0.12);
}

.server-process-dialog__stat-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
}

.server-process-dialog__stat-bar.is-memory {
  background: rgba(99, 102, 241, 0.12);
}

.server-process-dialog__stat-bar.is-memory span {
  background: linear-gradient(90deg, #6366f1, #4338ca);
}

.server-process-dialog__stat small,
.server-process-dialog__detail-grid small,
.server-process-dialog__detail-block small {
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__stat strong {
  font-size: 18px;
  color: #0f172a;
}

.server-process-dialog__stat span {
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__detail-card {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.server-process-dialog__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.server-process-dialog__detail-grid strong,
.server-process-dialog__detail-block p {
  word-break: break-word;
}

.server-process-dialog__detail-grid strong {
  color: #0f172a;
}

.server-process-dialog__detail-block {
  display: grid;
  gap: 6px;
}

.server-process-dialog__ai-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.08),
    rgba(255, 255, 255, 0.98)
  );
}

.server-process-dialog__ai-top strong {
  color: #0f172a;
}

.server-process-detail-dialog__hero,
.server-process-detail-dialog__ai-top {
  justify-content: space-between;
}

.server-process-detail-dialog__hero {
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.server-process-detail-dialog__hero h4,
.server-process-detail-dialog__card h5 {
  margin: 0;
  color: #0f172a;
}

.server-process-detail-dialog__hero p,
.server-process-detail-dialog__command,
.server-process-detail-dialog__meta dd {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
  word-break: break-word;
}

.server-process-detail-dialog__actions {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-process-detail-dialog__stats,
.server-process-detail-dialog__grid,
.server-process-detail-dialog__meta {
  display: grid;
  gap: 12px;
}

.server-process-detail-dialog__stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
}

.server-process-detail-dialog__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-process-detail-dialog__card,
.server-process-detail-dialog__stat {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(248, 250, 252, 0.92);
}

.server-process-detail-dialog__card--wide {
  grid-column: 1 / -1;
}

.server-process-detail-dialog__stat small,
.server-process-detail-dialog__meta dt {
  color: #64748b;
  font-size: 12px;
}

.server-process-detail-dialog__stat strong,
.server-process-detail-dialog__meta dd {
  color: #0f172a;
}

.server-process-detail-dialog__stat strong {
  font-size: 18px;
}

.server-process-detail-dialog__stat span {
  color: #64748b;
  font-size: 12px;
}

.server-process-detail-dialog__meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1080px) {
  .server-process-dialog__stage {
    grid-template-columns: 1fr;
  }

  .server-process-dialog__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-process-detail-dialog__stats,
  .server-process-detail-dialog__grid,
  .server-process-detail-dialog__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .server-process-dialog__toolbar {
    display: grid;
  }

  .server-process-dialog__toolbar-actions,
  .server-process-dialog__detail-actions,
  .server-process-dialog__summary {
    justify-content: flex-start;
  }

  .server-process-dialog__stats,
  .server-process-dialog__detail-grid,
  .server-process-detail-dialog__stats,
  .server-process-detail-dialog__grid,
  .server-process-detail-dialog__meta {
    grid-template-columns: 1fr;
  }
}
</style>
