<template>
  <article class="server-service-panel">
    <header class="server-service-panel__header">
      <div>
        <h3>服务器服务</h3>
        <p>
          自动检测优先走 SPI(本机 / SSH / WinRM) 和系统能力；AI
          作为全局能力参与失败诊断与草稿生成。
        </p>
        <small
          v-if="!aiEnabled && aiUnavailableReason"
          class="server-service-panel__hint"
        >
          AI 未激活: {{ aiUnavailableReason }}
        </small>
      </div>
      <div class="server-service-panel__header-actions">
        <ScTag size="small" effect="plain" round>
          {{ services.length }} 项
        </ScTag>
        <ScTag size="small" effect="plain" round type="success">
          {{ runningCount }} 运行中
        </ScTag>
        <ScTag size="small" effect="plain" round type="warning">
          {{ issueCount }} 关注中
        </ScTag>
        <el-tooltip content="新增服务" placement="top">
          <el-button circle plain aria-label="新增服务" @click="emit('create')">
            <IconifyIconOnline icon="ri:add-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="canAutoDetect" content="自动检测服务" placement="top">
          <el-button
            circle
            plain
            aria-label="自动检测服务"
            :loading="detecting"
            @click="emit('detect')"
          >
            <IconifyIconOnline icon="ri:radar-line" />
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <template v-if="services.length">
      <div class="server-service-panel__toolbar">
        <el-radio-group
          v-model="activeFilter"
          size="small"
          class="server-service-panel__filters"
        >
          <el-radio-button value="all"
            >全部 {{ services.length }}</el-radio-button
          >
          <el-radio-button value="running"
            >运行中 {{ runningCount }}</el-radio-button
          >
          <el-radio-button value="issue">异常 {{ issueCount }}</el-radio-button>
          <el-radio-button value="ai"
            >AI 诊断 {{ aiFailureCount }}</el-radio-button
          >
        </el-radio-group>
        <ScInput
          v-model="keyword"
          clearable
          placeholder="搜索服务名、路径、类型"
          prefix-icon="ri:search-line"
          class="server-service-panel__search"
        />
      </div>

      <div
        v-if="filteredServices.length"
        class="server-service-panel__list thin-scroller overflow-y-auto"
      >
        <section
          v-for="item in filteredServices"
          :key="item.serverServiceId || item.serviceCode || item.serviceName"
          class="server-service-panel__item"
          role="button"
          tabindex="0"
          @click="emit('detail', item)"
          @keydown.enter.prevent="emit('detail', item)"
        >
          <div class="server-service-panel__item-top">
            <div>
              <strong>{{ item.serviceName }}</strong>
              <p>
                {{ item.serviceType || "SERVER_SERVICE" }} /
                {{ item.installPath || "未配置安装目录" }}
              </p>
            </div>
            <div class="server-service-panel__item-tags">
              <ScTag
                size="small"
                effect="plain"
                round
                :type="item.enabled !== false ? 'success' : 'info'"
              >
                {{ item.enabled !== false ? "已启用" : "未启用" }}
              </ScTag>
              <span
                class="server-service-panel__status"
                :class="runtimeStatusClass(item.runtimeStatus)"
              >
                {{ runtimeStatusLabel(item.runtimeStatus) }}
              </span>
            </div>
          </div>

          <div class="server-service-panel__meta">
            <ScTag
              v-for="chip in resolveMetaChips(item)"
              :key="chip"
              size="small"
              effect="plain"
              round
            >
              {{ chip }}
            </ScTag>
            <ScTag
              v-if="item.softInstallationId"
              size="small"
              effect="plain"
              round
            >
              安装实例 #{{ item.softInstallationId }}
            </ScTag>
          </div>

          <small class="server-service-panel__message">
            {{ item.lastOperationMessage || "暂无执行记录" }}
          </small>

          <div v-if="showAiFailure(item)" class="server-service-panel__ai">
            <div class="server-service-panel__ai-head">
              <strong>AI 失败诊断</strong>
              <span>{{ item.latestAiProvider || "AI" }}</span>
            </div>
            <p>
              <span>原因</span>
              {{ item.latestAiReason || "暂无原因说明" }}
            </p>
            <p>
              <span>方案</span>
              {{ item.latestAiSolution || "暂无处理方案" }}
            </p>
          </div>

          <div class="server-service-panel__actions">
            <el-tooltip content="查看启动日志">
              <el-button circle plain @click.stop="emit('logs', item)">
                <IconifyIconOnline icon="ri:file-list-3-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="编辑服务配置">
              <el-button circle plain @click.stop="emit('edit', item)">
                <IconifyIconOnline icon="ri:settings-4-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="查看详情">
              <el-button circle plain @click.stop="emit('detail', item)">
                <IconifyIconOnline icon="ri:article-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="状态检查">
              <el-button
                circle
                plain
                :loading="isActionLoading(item, 'status')"
                @click.stop="emit('action', item, 'status')"
              >
                <IconifyIconOnline icon="ri:pulse-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip :content="isRunning(item) ? '停止服务' : '启动服务'">
              <el-button
                circle
                plain
                :type="isRunning(item) ? 'danger' : 'success'"
                :loading="
                  isActionLoading(item, isRunning(item) ? 'stop' : 'start')
                "
                @click.stop="
                  emit('action', item, isRunning(item) ? 'stop' : 'start')
                "
              >
                <IconifyIconOnline
                  :icon="
                    isRunning(item)
                      ? 'ri:stop-circle-line'
                      : 'ri:play-circle-line'
                  "
                />
              </el-button>
            </el-tooltip>
            <el-tooltip content="重启服务">
              <el-button
                circle
                plain
                :loading="isActionLoading(item, 'restart')"
                @click.stop="emit('action', item, 'restart')"
              >
                <IconifyIconOnline icon="ri:restart-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="showAiFailure(item)"
              :content="
                aiEnabled
                  ? 'AI 修复启动'
                  : aiUnavailableReason || 'AI 能力未激活'
              "
            >
              <el-button
                circle
                type="warning"
                plain
                :disabled="!aiEnabled"
                :loading="isActionLoading(item, 'ai-fix')"
                @click.stop="emit('ai-fix', item)"
              >
                <IconifyIconOnline icon="ri:magic-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="Boolean(item.registerScript?.trim())"
              content="注册服务"
            >
              <el-button
                circle
                plain
                :loading="isActionLoading(item, 'register')"
                @click.stop="emit('action', item, 'register')"
              >
                <IconifyIconOnline icon="ri:shield-check-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="Boolean(item.unregisterScript?.trim())"
              content="取消注册"
            >
              <el-button
                circle
                plain
                type="warning"
                :loading="isActionLoading(item, 'unregister')"
                @click.stop="emit('action', item, 'unregister')"
              >
                <IconifyIconOnline icon="ri:shield-cross-line" />
              </el-button>
            </el-tooltip>
          </div>
        </section>
      </div>
      <div v-else class="server-service-panel__empty-state">
        <strong>当前筛选条件下没有服务器服务</strong>
        <span>可以切换筛选、清空搜索，或者直接执行自动检测同步最新服务。</span>
      </div>
    </template>
    <el-empty v-else description="当前服务器还没有服务器服务" />
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import type { ServerService } from "../api";

type ServerServiceAction =
  | "register"
  | "unregister"
  | "start"
  | "stop"
  | "restart"
  | "status"
  | "ai-fix";

type ServerServiceFilter = "all" | "running" | "issue" | "ai";

const props = withDefaults(
  defineProps<{
    services?: ServerService[];
    aiEnabled?: boolean;
    aiUnavailableReason?: string;
    detecting?: boolean;
    canAutoDetect?: boolean;
    actionLoadingKey?: string;
  }>(),
  {
    services: () => [],
    aiEnabled: false,
    aiUnavailableReason: "",
    detecting: false,
    canAutoDetect: false,
    actionLoadingKey: "",
  },
);

const emit = defineEmits<{
  create: [];
  detect: [];
  logs: [service: ServerService];
  edit: [service: ServerService];
  detail: [service: ServerService];
  "ai-fix": [service: ServerService];
  action: [
    service: ServerService,
    action: Exclude<ServerServiceAction, "ai-fix">,
  ];
}>();

const keyword = ref("");
const activeFilter = ref<ServerServiceFilter>("all");

const runtimeStatusLabel = (value?: string | null) =>
  value === "RUNNING"
    ? "运行中"
    : value === "STOPPED"
      ? "已停止"
      : value === "ERROR"
        ? "异常"
        : value === "UNKNOWN"
          ? "未知"
          : value || "未知";

const isRunning = (service?: ServerService | null) =>
  ["RUNNING", "ACTIVE"].includes(
    String(service?.runtimeStatus || "").toUpperCase(),
  );

const showAiFailure = (service?: ServerService | null) =>
  service?.latestOperationSuccess === false &&
  Boolean(service.latestAiReason || service.latestAiSolution);

const runtimeStatusClass = (value?: string | null) => {
  const status = String(value || "").toUpperCase();
  if (["RUNNING", "ACTIVE"].includes(status)) {
    return "is-success";
  }
  if (status === "ERROR") {
    return "is-danger";
  }
  if (status === "STOPPED") {
    return "is-warning";
  }
  return "is-muted";
};

const isIssueService = (service?: ServerService | null) => {
  const status = String(service?.runtimeStatus || "").toUpperCase();
  return status === "ERROR" || service?.latestOperationSuccess === false;
};

const parseJsonArray = (value?: string | null) => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const parseMetadata = (value?: string | null) => {
  if (!value) {
    return {} as Record<string, unknown>;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const providerLabel = (value?: unknown) => {
  const normalized = String(value || "")
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
  return normalized || "";
};

const detectSourceLabel = (value?: unknown) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "systemd") {
    return "systemd";
  }
  if (normalized === "windows-service") {
    return "Windows 服务";
  }
  if (normalized === "manual") {
    return "手工维护";
  }
  return normalized || "";
};

const resolveMetaChips = (service: ServerService) => {
  const configCount = parseJsonArray(service.configPathsJson).length;
  const logCount = parseJsonArray(service.logPathsJson).length;
  const metadata = parseMetadata(service.metadataJson);
  const executionProvider = providerLabel(
    metadata.executionProvider || metadata.spiChannel,
  );
  const detected = Boolean(metadata.detected);
  const detectedSource = detectSourceLabel(metadata.detectedSource);
  return [
    detected ? "自动检测" : "手工维护",
    executionProvider ? `SPI ${executionProvider}` : "",
    detectedSource ? `来源 ${detectedSource}` : "",
    configCount ? `配置 ${configCount} 项` : "",
    logCount ? `日志 ${logCount} 项` : "",
    service.registerScript?.trim() ? "支持注册" : "",
    service.statusScript?.trim() ? "支持状态检查" : "",
  ].filter(Boolean);
};

const resolveActionKey = (
  service: ServerService,
  action: ServerServiceAction,
) =>
  `${service.serverServiceId || service.serviceCode || service.serviceName}:${action}`;

const isActionLoading = (service: ServerService, action: ServerServiceAction) =>
  props.actionLoadingKey === resolveActionKey(service, action);

const runningCount = computed(
  () => props.services.filter((item) => isRunning(item)).length,
);
const issueCount = computed(
  () => props.services.filter((item) => isIssueService(item)).length,
);
const aiFailureCount = computed(
  () => props.services.filter((item) => showAiFailure(item)).length,
);

const filteredServices = computed(() => {
  const keywordValue = keyword.value.trim().toLowerCase();
  return props.services.filter((item) => {
    if (activeFilter.value === "running" && !isRunning(item)) {
      return false;
    }
    if (activeFilter.value === "issue" && !isIssueService(item)) {
      return false;
    }
    if (activeFilter.value === "ai" && !showAiFailure(item)) {
      return false;
    }
    if (!keywordValue) {
      return true;
    }
    return [
      item.serviceName,
      item.serviceType,
      item.installPath,
      item.description,
      item.lastOperationMessage,
      providerLabel(
        parseMetadata(item.metadataJson).executionProvider ||
          parseMetadata(item.metadataJson).spiChannel,
      ),
      detectSourceLabel(parseMetadata(item.metadataJson).detectedSource),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keywordValue));
  });
});
</script>

<style scoped lang="scss">
.server-service-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
  min-height: 0;
  padding: 2px 0;
}

.server-service-panel__hint {
  display: block;
  margin-top: 6px;
  color: #b45309;
  font-size: 12px;
}

.server-service-panel__header,
.server-service-panel__header-actions,
.server-service-panel__toolbar,
.server-service-panel__item-top,
.server-service-panel__actions,
.server-service-panel__ai-head,
.server-service-panel__meta {
  display: flex;
  align-items: center;
}

.server-service-panel__header {
  justify-content: space-between;
  gap: 14px;
  padding: 2px 2px 0;
}

.server-service-panel__header h3 {
  margin: 0;
  font-size: 17px;
}

.server-service-panel__header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-service-panel__header-actions {
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-service-panel__toolbar {
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
}

.server-service-panel__filters {
  flex-wrap: wrap;
}

.server-service-panel__search {
  width: min(280px, 100%);
}

.server-service-panel__list {
  display: grid;
  gap: 12px;
  flex: 1;
  min-height: 356px;
  max-height: 404px;
  overflow: auto;
  padding-right: 4px;
  padding-top: 6px;
}

.server-service-panel__item {
  display: grid;
  gap: 10px;
  padding: 16px 16px 15px;
  border-radius: 24px;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 7%, transparent),
      transparent 54%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 84%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.server-service-panel__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
  border-color: color-mix(
    in srgb,
    var(--el-color-primary) 26%,
    var(--el-border-color)
  );
}

.server-service-panel__item-top {
  justify-content: space-between;
  gap: 12px;
}

.server-service-panel__item-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-service-panel__item-top strong {
  display: block;
  color: var(--el-text-color-primary);
}

.server-service-panel__item-top p,
.server-service-panel__message {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.server-service-panel__status,
.server-service-panel__chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.server-service-panel__status.is-success,
.server-service-panel__chip.is-success {
  color: #15803d;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.server-service-panel__status.is-warning,
.server-service-panel__chip.is-warning {
  color: #b45309;
  background: rgba(251, 191, 36, 0.16);
  border: 1px solid rgba(245, 158, 11, 0.24);
}

.server-service-panel__status.is-danger,
.server-service-panel__chip.is-danger {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.22);
}

.server-service-panel__status.is-muted,
.server-service-panel__chip.is-muted {
  color: var(--el-text-color-secondary);
}

.server-service-panel__meta {
  gap: 8px;
  flex-wrap: wrap;
}

.server-service-panel__ai {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-warning) 14%, white),
      transparent 68%
    ),
    color-mix(in srgb, var(--el-bg-color) 92%, white);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 24%, transparent);
}

.server-service-panel__ai-head {
  justify-content: space-between;
  gap: 12px;
}

.server-service-panel__ai-head span {
  color: var(--el-color-warning-dark-2);
  font-size: 12px;
}

.server-service-panel__ai p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.65;
  font-size: 13px;
}

.server-service-panel__ai p span {
  display: inline-flex;
  min-width: 40px;
  color: var(--el-text-color-secondary);
}

.server-service-panel__actions {
  gap: 8px;
  flex-wrap: wrap;
}

.server-service-panel__empty-state {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 90%, white);
}

.server-service-panel__empty-state strong {
  color: var(--el-text-color-primary);
}

.server-service-panel__empty-state span {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
