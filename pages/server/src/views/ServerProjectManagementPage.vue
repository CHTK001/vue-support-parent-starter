<template>
  <section class="server-project-page">
    <header class="hero">
      <div>
        <small>SERVER / PROJECT</small>
        <h1>项目管理工作台</h1>
        <p>
          复用 soft、server-service 和 AI
          能力，统一管理项目运行、日志、回滚与失败分析。
        </p>
      </div>
      <div class="chips">
        <span class="chip">serverId {{ serverId || "-" }}</span>
        <span class="chip">host {{ route.query.serverName || "未指定" }}</span>
        <span class="chip">AI {{ aiText }}</span>
      </div>
    </header>

    <div class="summary">
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('all')"
        @keydown.enter.prevent="focusSummary('all')"
      >
        <small>项目实例</small><strong>{{ cards.length }}</strong>
      </article>
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('running')"
        @keydown.enter.prevent="focusSummary('running')"
      >
        <small>运行中</small><strong>{{ runningCount }}</strong>
      </article>
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('issue')"
        @keydown.enter.prevent="focusSummary('issue')"
      >
        <small>异常</small><strong>{{ issueCount }}</strong>
      </article>
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('latest')"
        @keydown.enter.prevent="focusSummary('latest')"
      >
        <small>最近操作</small><strong>{{ latestOpTime || "--" }}</strong>
      </article>
    </div>

    <div class="toolbar">
      <ScInput v-model="keyword" clearable placeholder="搜索项目 / 服务 / 路径">
        <template #prefix><IconifyIconOnline icon="ri:search-line" /></template>
      </ScInput>
      <el-radio-group v-model="filter" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="running">运行中</el-radio-button>
        <el-radio-button value="issue">异常</el-radio-button>
        <el-radio-button value="ai">AI</el-radio-button>
      </el-radio-group>
      <el-button circle :loading="loading" @click="loadPage"
        ><IconifyIconOnline icon="ri:refresh-line"
      /></el-button>
    </div>

    <article
      v-if="aiDiagnosticChips.length"
      class="ai-status"
      :class="{ 'is-inactive': !capabilities?.aiEnabled }"
    >
      <div class="panel-head">
        <div>
          <h3>AI 能力诊断</h3>
          <p>
            {{
              capabilities?.aiEnabled
                ? "项目诊断、脚本生成和失败分析已接入当前 AI Provider。"
                : capabilities?.aiUnavailableReason ||
                  "当前未检测到可用 AI，请先完成 Provider 配置。"
            }}
          </p>
        </div>
        <div class="actions">
          <el-tooltip
            v-if="!capabilities?.aiEnabled"
            content="打开系统设置并配置 AI Provider"
          >
            <el-button circle plain type="primary" @click="openAiSettings">
              <IconifyIconOnline icon="ri:settings-4-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="chips">
        <span
          v-for="item in aiDiagnosticChips"
          :key="item.label"
          class="chip ai-status__chip"
          :class="`ai-status__chip--${item.tone}`"
        >
          {{ item.label }} · {{ item.value }}
        </span>
      </div>
    </article>

    <div v-loading="loading" class="grid">
      <article
        v-for="item in filteredCards"
        :key="item.installation.softInstallationId"
        class="card"
        :class="item.tone"
        role="button"
        tabindex="0"
        @click="openDetail(item)"
        @keydown.enter.prevent="openDetail(item)"
      >
        <header class="card-head">
          <div>
            <strong>{{ item.installation.installationName }}</strong>
            <p>
              {{ item.typeLabel }} /
              {{ item.installation.serviceName || "未绑定服务" }}
            </p>
          </div>
          <span class="chip">{{ item.runtimeLabel }}</span>
        </header>
        <div class="chips">
          <span class="chip">{{
            item.installation.installPath || "未配置安装目录"
          }}</span>
          <span class="chip">{{
            item.detail?.target?.targetType || "LOCAL"
          }}</span>
          <span class="chip">SPI {{ item.executionProviderLabel }}</span>
          <span class="chip"
            >快照 {{ item.detail?.snapshots?.length || 0 }}</span
          >
        </div>
        <p class="message">
          {{
            item.serverService?.latestAiReason ||
            item.installation.lastOperationMessage ||
            "支持启停、重启、状态、日志追尾和回滚"
          }}
        </p>
        <div
          v-if="
            item.serverService?.latestAiReason ||
            item.serverService?.latestAiSolution
          "
          class="ai-box"
        >
          <strong>AI 诊断</strong>
          <p>{{ item.serverService?.latestAiReason || "-" }}</p>
          <small>{{ item.serverService?.latestAiSolution || "-" }}</small>
        </div>
        <div class="actions">
          <el-button
            circle
            plain
            type="success"
            :loading="
              actionKey === `start:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'start')
            "
            ><IconifyIconOnline icon="ri:play-circle-line"
          /></el-button>
          <el-button
            circle
            plain
            type="warning"
            :loading="
              actionKey === `stop:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'stop')
            "
            ><IconifyIconOnline icon="ri:stop-circle-line"
          /></el-button>
          <el-button
            circle
            plain
            :loading="
              actionKey === `restart:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'restart')
            "
            ><IconifyIconOnline icon="ri:restart-line"
          /></el-button>
          <el-button
            circle
            plain
            :loading="
              actionKey === `status:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'status')
            "
            ><IconifyIconOnline icon="ri:pulse-line"
          /></el-button>
          <el-button circle plain @click.stop="openDetail(item)"
            ><IconifyIconOnline icon="ri:article-line"
          /></el-button>
        </div>
      </article>
      <el-empty
        v-if="!loading && !filteredCards.length"
        description="当前服务器还没有可管理的项目实例"
      />
    </div>

    <el-dialog
      v-model="detailVisible"
      width="1120px"
      destroy-on-close
      :title="
        selectedCard
          ? `${selectedCard.installation.installationName} · 项目详情`
          : '项目详情'
      "
      @closed="stopWatch"
    >
      <template v-if="selectedCard">
        <div class="detail-hero">
          <div>
            <h3>{{ selectedCard.installation.installationName }}</h3>
            <p>
              {{ selectedCard.installation.installPath || "未配置安装目录" }}
            </p>
          </div>
          <div class="actions">
            <el-button
              plain
              type="success"
              :loading="
                actionKey ===
                `start:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(
                  selectedCard.installation.softInstallationId!,
                  'start',
                )
              "
              >启动</el-button
            >
            <el-button
              plain
              type="warning"
              :loading="
                actionKey ===
                `stop:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(selectedCard.installation.softInstallationId!, 'stop')
              "
              >停止</el-button
            >
            <el-button
              plain
              :loading="
                actionKey ===
                `restart:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(
                  selectedCard.installation.softInstallationId!,
                  'restart',
                )
              "
              >重启</el-button
            >
            <el-button
              plain
              :loading="
                actionKey ===
                `status:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(
                  selectedCard.installation.softInstallationId!,
                  'status',
                )
              "
              >状态</el-button
            >
            <el-button
              plain
              @click="loadDetail(selectedCard.installation.softInstallationId!)"
              >刷新</el-button
            >
          </div>
        </div>

        <div class="summary">
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('meta')"
            @keydown.enter.prevent="scrollToDetailSection('meta')"
          >
            <small>运行态</small
            ><strong>{{ selectedCard.runtimeLabel }}</strong>
          </article>
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('meta')"
            @keydown.enter.prevent="scrollToDetailSection('meta')"
          >
            <small>类型</small><strong>{{ selectedCard.typeLabel }}</strong>
          </article>
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('service')"
            @keydown.enter.prevent="scrollToDetailSection('service')"
          >
            <small>绑定服务</small
            ><strong>{{
              selectedCard.serverService?.serviceName || "未绑定"
            }}</strong>
          </article>
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('snapshot')"
            @keydown.enter.prevent="scrollToDetailSection('snapshot')"
          >
            <small>配置快照</small
            ><strong>{{ selectedCard.detail?.snapshots?.length || 0 }}</strong>
          </article>
        </div>

        <div class="detail-grid">
          <article ref="metaPanelRef" class="panel">
            <h4>基础信息</h4>
            <dl class="meta">
              <div>
                <dt>目标</dt>
                <dd>{{ selectedCard.detail?.target?.targetName || "-" }}</dd>
              </div>
              <div>
                <dt>类型</dt>
                <dd>{{ selectedCard.detail?.target?.targetType || "-" }}</dd>
              </div>
              <div>
                <dt>版本</dt>
                <dd>{{ selectedCard.detail?.version?.versionName || "-" }}</dd>
              </div>
              <div>
                <dt>服务名</dt>
                <dd>{{ selectedCard.installation.serviceName || "-" }}</dd>
              </div>
              <div>
                <dt>SPI 通道</dt>
                <dd>{{ selectedCard.executionProviderLabel }}</dd>
              </div>
              <div>
                <dt>服务维护</dt>
                <dd>{{ selectedCard.serviceManageMode }}</dd>
              </div>
            </dl>
            <p class="hint">
              {{
                selectedCard.installation.lastOperationMessage ||
                "暂无最近操作说明"
              }}
            </p>
          </article>

          <article ref="progressPanelRef" class="panel">
            <h4>实时进度</h4>
            <el-progress
              :percentage="Number(operationLatest?.progressPercent || 0)"
            />
            <p class="hint">
              {{ operationLatest?.message || "执行操作后会在这里显示实时进度" }}
            </p>
            <div class="chips">
              <span
                v-for="stage in operationStages"
                :key="stage"
                class="chip"
                >{{ stage }}</span
              >
            </div>
          </article>

          <article ref="logPanelRef" class="panel panel-wide">
            <div class="panel-head">
              <h4>实时日志</h4>
              <div class="actions">
                <el-button plain @click="toggleWatch">{{
                  runtimeWatching ? "停止追尾" : "开始追尾"
                }}</el-button>
                <el-button plain @click="refreshLogTail">拉取尾部</el-button>
              </div>
            </div>
            <ScCodeEditor
              :model-value="runtimeLogText"
              :read-only="true"
              height="220px"
              mode="shell"
            />
          </article>

          <article ref="snapshotPanelRef" class="panel">
            <h4>配置快照</h4>
            <div class="list">
              <button
                v-for="snapshot in selectedCard.detail?.snapshots || []"
                :key="snapshot.softConfigSnapshotId"
                type="button"
                class="snapshot"
                @click="rollbackSnapshot(snapshot.softConfigSnapshotId)"
              >
                <strong>{{
                  snapshot.snapshotName ||
                  `快照 #${snapshot.softConfigSnapshotId}`
                }}</strong>
                <span>{{ snapshot.createTime || "-" }}</span>
              </button>
              <el-empty
                v-if="!(selectedCard.detail?.snapshots || []).length"
                description="当前还没有配置快照"
              />
            </div>
          </article>

          <article ref="aiPanelRef" class="panel">
            <h4>AI 失败分析</h4>
            <template
              v-if="
                selectedCard.serverService?.latestAiReason ||
                selectedCard.serverService?.latestAiSolution
              "
            >
              <p class="hint">
                {{ selectedCard.serverService?.latestAiReason || "-" }}
              </p>
              <p class="hint">
                {{ selectedCard.serverService?.latestAiSolution || "-" }}
              </p>
              <div class="chips">
                <span
                  v-if="selectedCard.serverService?.latestKnowledgeId"
                  class="chip"
                  >知识库 #{{
                    selectedCard.serverService?.latestKnowledgeId
                  }}</span
                >
              </div>
            </template>
            <template v-else-if="!capabilities?.aiEnabled">
              <p class="hint">
                {{
                  capabilities?.aiUnavailableReason ||
                  "当前未检测到可用 AI Provider"
                }}
              </p>
              <div class="chips">
                <span
                  v-for="item in aiDiagnosticChips"
                  :key="`detail-${item.label}`"
                  class="chip ai-status__chip"
                  :class="`ai-status__chip--${item.tone}`"
                >
                  {{ item.label }} · {{ item.value }}
                </span>
              </div>
              <div class="actions">
                <el-tooltip content="打开系统设置并配置 AI Provider">
                  <el-button
                    circle
                    plain
                    type="primary"
                    @click="openAiSettings"
                  >
                    <IconifyIconOnline icon="ri:settings-4-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </template>
            <el-empty v-else description="当前没有 AI 失败诊断记录" />
          </article>

          <article ref="servicePanelRef" class="panel panel-wide">
            <div class="panel-head">
              <h4>服务操作记录</h4>
              <el-button
                plain
                :disabled="!selectedCard.serverService?.serverServiceId"
                @click="
                  selectedCard.serverService?.serverServiceId &&
                  loadServiceLogs(selectedCard.serverService.serverServiceId)
                "
                >刷新</el-button
              >
            </div>
            <div class="list">
              <article
                v-for="item in selectedServiceLogs"
                :key="item.serverServiceOperationLogId"
                class="op"
              >
                <header>
                  <strong>{{ item.operationType || "OPERATION" }}</strong
                  ><span>{{ item.createTime || "-" }}</span>
                </header>
                <p>{{ item.operationMessage || "-" }}</p>
                <small>{{
                  item.aiReason ||
                  item.aiSolution ||
                  (item.expireAt ? `保留到 ${item.expireAt}` : "未写入 AI 分析")
                }}</small>
              </article>
              <el-empty
                v-if="!selectedServiceLogs.length"
                description="当前没有服务操作记录"
              />
            </div>
          </article>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { emitter } from "@repo/core";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import ScInput from "@repo/components/ScInput/index.vue";
import {
  getServerCapabilities,
  getServerServiceByInstallation,
  getServerServiceOperationLogs,
  listServerSoftInstallations,
  listSoftBindingTargets,
  type ServerCapabilityView,
  type ServerService,
  type ServerServiceOperationLog,
  type ServerSoftBindingTarget,
  type ServerSoftInstallation,
} from "../api";
import {
  getSoftInstallationDetail,
  getSoftLogs,
  getSoftServiceStatus,
  listSoftOperationLogs,
  restartSoftService,
  rollbackSoftConfigSnapshot,
  startSoftLogWatch,
  startSoftService,
  stopSoftLogWatch,
  stopSoftService,
  type SoftInstallationDetail,
  type SoftLogWatchTicket,
  type SoftOperationLog,
  type SoftOperationTicket,
} from "../../../soft/src/api";
import { useSoftOperationStream } from "../../../soft/src/composables/useSoftOperationStream";
import { useSoftRuntimeLogStream } from "../../../soft/src/composables/useSoftRuntimeLogStream";

type Filter = "all" | "running" | "issue" | "ai";
type Action = "start" | "stop" | "restart" | "status";
type AiDiagnosticChipTone = "success" | "primary" | "warning" | "danger";
type AiDiagnosticChip = {
  label: string;
  value: string;
  tone: AiDiagnosticChipTone;
};
type Card = {
  installation: ServerSoftInstallation;
  detail: SoftInstallationDetail | null;
  target: ServerSoftBindingTarget | null;
  serverService: ServerService | null;
  typeLabel: string;
  runtimeLabel: string;
  tone: string;
  issue: boolean;
  executionProviderLabel: string;
  serviceManageMode: string;
};

const route = useRoute();
const serverId = computed(() => {
  const value = Number(route.query.serverId || 0);
  return Number.isFinite(value) && value > 0 ? value : null;
});
const loading = ref(false);
const actionKey = ref("");
const keyword = ref("");
const filter = ref<Filter>("all");
const capabilities = ref<ServerCapabilityView | null>(null);
const targets = ref<ServerSoftBindingTarget[]>([]);
const installations = ref<ServerSoftInstallation[]>([]);
const operationLogs = ref<SoftOperationLog[]>([]);
const detailMap = ref<Record<number, SoftInstallationDetail>>({});
const serviceMap = ref<Record<number, ServerService | null>>({});
const serviceLogMap = ref<Record<number, ServerServiceOperationLog[]>>({});
const detailVisible = ref(false);
const selectedInstallationId = ref<number | null>(null);
const metaPanelRef = ref<HTMLElement | null>(null);
const progressPanelRef = ref<HTMLElement | null>(null);
const logPanelRef = ref<HTMLElement | null>(null);
const snapshotPanelRef = ref<HTMLElement | null>(null);
const aiPanelRef = ref<HTMLElement | null>(null);
const servicePanelRef = ref<HTMLElement | null>(null);
const runtimeWatchTicket = ref<SoftLogWatchTicket | null>(null);
const runtimeWatching = ref(false);
const runtimeLines = ref<string[]>([]);
let runtimeLogPollTimer: number | undefined;
const {
  latest: operationLatestRef,
  stages: operationStagesRef,
  connect: connectOperation,
  disconnect: disconnectOperation,
} = useSoftOperationStream();
const {
  latest: runtimeLatestRef,
  connect: connectRuntime,
  disconnect: disconnectRuntime,
} = useSoftRuntimeLogStream();

const aiText = computed(() =>
  capabilities.value?.aiEnabled
    ? [
        capabilities.value?.aiProvider || capabilities.value?.aiDefaultProvider,
        capabilities.value?.aiProviderCount
          ? `${capabilities.value.aiProviderCount}P`
          : "",
      ]
        .filter(Boolean)
        .join(" · ") || "已激活"
    : [
        capabilities.value?.aiUnavailableReason || "未激活",
        capabilities.value?.aiConfigReady ? "配置就绪" : "配置未就绪",
        capabilities.value?.aiChatClientReady
          ? "ChatClient 已装配"
          : "ChatClient 未装配",
      ]
        .filter(Boolean)
        .join(" · "),
);
const buildAiDiagnosticChip = (
  label: string,
  value: unknown,
  tone: AiDiagnosticChipTone,
) => {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }
  return {
    label,
    value: text,
    tone,
  } satisfies AiDiagnosticChip;
};
const aiDiagnosticChips = computed(() =>
  [
    buildAiDiagnosticChip(
      "默认 Provider",
      capabilities.value?.aiDefaultProvider || capabilities.value?.aiProvider,
      "primary",
    ),
    buildAiDiagnosticChip(
      "当前 Provider",
      capabilities.value?.aiProvider,
      capabilities.value?.aiEnabled ? "success" : "warning",
    ),
    buildAiDiagnosticChip(
      "Provider 数量",
      capabilities.value?.aiProviderCount,
      Number(capabilities.value?.aiProviderCount || 0) > 0
        ? "success"
        : "warning",
    ),
    buildAiDiagnosticChip(
      "配置状态",
      capabilities.value?.aiConfigReady ? "已就绪" : "未就绪",
      capabilities.value?.aiConfigReady ? "success" : "warning",
    ),
    buildAiDiagnosticChip(
      "ChatClient",
      capabilities.value?.aiChatClientReady ? "已装配" : "未装配",
      capabilities.value?.aiChatClientReady ? "success" : "danger",
    ),
    buildAiDiagnosticChip(
      "原因代码",
      capabilities.value?.aiUnavailableCode,
      "danger",
    ),
    buildAiDiagnosticChip(
      "Provider 解析",
      capabilities.value?.aiProviderResolvedFrom,
      "primary",
    ),
  ].filter((item): item is AiDiagnosticChip => Boolean(item)),
);
const operationLatest = computed(() => operationLatestRef.value);
const operationStages = computed(() => operationStagesRef.value);
const runtimeLogText = computed(() => runtimeLines.value.join("\n"));
const latestOpTime = computed(() => operationLogs.value[0]?.startTime || "");
const latestOperationCard = computed(() => {
  const ranked = [...cards.value];
  ranked.sort((left, right) => {
    const leftTime = Date.parse(
      String(
        left.installation.lastOperationTime ||
          left.installation.updateTime ||
          "",
      ),
    );
    const rightTime = Date.parse(
      String(
        right.installation.lastOperationTime ||
          right.installation.updateTime ||
          "",
      ),
    );
    return (
      (Number.isFinite(rightTime) ? rightTime : 0) -
      (Number.isFinite(leftTime) ? leftTime : 0)
    );
  });
  return ranked[0] || null;
});

const parseMetadata = (value?: string | null) => {
  try {
    return value ? (JSON.parse(value) as Record<string, unknown>) : {};
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
  return normalized || "未记录";
};

const manageModeLabel = (value?: unknown, detected?: unknown) => {
  if (String(value || "").trim()) {
    return String(value);
  }
  return detected ? "自动检测" : "手工维护";
};
const visibleTargetIds = computed(
  () =>
    new Set(
      targets.value
        .filter((item) => {
          if (!serverId.value) return true;
          const metadata = parseMetadata(item.metadataJson);
          return (
            Number(
              metadata.serverId ??
                metadata.monitorServerId ??
                metadata.hostId ??
                0,
            ) === serverId.value ||
            item.targetCode === `server-${serverId.value}`
          );
        })
        .map((item) => item.softTargetId)
        .filter((item): item is number => Number.isFinite(Number(item))),
    ),
);

const cards = computed<Card[]>(() =>
  installations.value
    .filter((item) =>
      visibleTargetIds.value.has(Number(item.softTargetId || 0)),
    )
    .map((installation) => {
      const detail =
        detailMap.value[Number(installation.softInstallationId || 0)] || null;
      const serverService =
        serviceMap.value[Number(installation.softInstallationId || 0)] || null;
      const runtimeStatus = String(
        serverService?.runtimeStatus ||
          installation.runtimeStatus ||
          installation.installStatus ||
          "UNKNOWN",
      ).toUpperCase();
      const runtimeLabel =
        runtimeStatus === "RUNNING"
          ? "运行中"
          : runtimeStatus === "STOPPED"
            ? "已停止"
            : ["FAILED", "ERROR"].includes(runtimeStatus)
              ? "异常"
              : runtimeStatus;
      const issue =
        ["FAILED", "ERROR", "STOPPED"].includes(runtimeStatus) ||
        serverService?.latestOperationSuccess === false;
      const packageCode = String(
        detail?.package?.packageCode || "",
      ).toLowerCase();
      const serviceMetadata = parseMetadata(serverService?.metadataJson);
      return {
        installation,
        detail,
        target:
          targets.value.find(
            (item) => item.softTargetId === installation.softTargetId,
          ) || null,
        serverService,
        typeLabel: packageCode.includes("nginx")
          ? "Nginx / 静态页"
          : packageCode.includes("spring")
            ? "Spring Boot"
            : "资源分离 / 通用项目",
        runtimeLabel,
        tone:
          runtimeLabel === "运行中"
            ? "is-success"
            : issue
              ? "is-danger"
              : "is-muted",
        issue,
        executionProviderLabel: providerLabel(
          serviceMetadata.executionProvider ||
            serviceMetadata.spiChannel ||
            detail?.target?.targetType,
        ),
        serviceManageMode: manageModeLabel(
          serviceMetadata.manageMode,
          serviceMetadata.detected,
        ),
      };
    }),
);
const filteredCards = computed(() =>
  cards.value.filter((item) => {
    if (filter.value === "running" && item.runtimeLabel !== "运行中")
      return false;
    if (filter.value === "issue" && !item.issue) return false;
    if (
      filter.value === "ai" &&
      !(
        item.serverService?.latestAiReason ||
        item.serverService?.latestAiSolution
      )
    )
      return false;
    const text = keyword.value.trim().toLowerCase();
    if (!text) return true;
    return [
      item.installation.installationName,
      item.installation.installPath,
      item.installation.serviceName,
      item.typeLabel,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(text));
  }),
);
const selectedCard = computed(
  () =>
    cards.value.find(
      (item) =>
        item.installation.softInstallationId === selectedInstallationId.value,
    ) || null,
);
const selectedServiceLogs = computed(() =>
  selectedInstallationId.value
    ? serviceLogMap.value[selectedInstallationId.value] || []
    : [],
);
const runningCount = computed(
  () => cards.value.filter((item) => item.runtimeLabel === "运行中").length,
);
const issueCount = computed(
  () => cards.value.filter((item) => item.issue).length,
);
const scrollToElement = async (target?: HTMLElement | null) => {
  await nextTick();
  target?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};
const scrollToDetailSection = async (
  section: "meta" | "progress" | "log" | "snapshot" | "ai" | "service",
) => {
  const element =
    section === "meta"
      ? metaPanelRef.value
      : section === "progress"
        ? progressPanelRef.value
        : section === "log"
          ? logPanelRef.value
          : section === "snapshot"
            ? snapshotPanelRef.value
            : section === "ai"
              ? aiPanelRef.value
              : servicePanelRef.value;
  await scrollToElement(element);
};
const focusSummary = async (target: "all" | "running" | "issue" | "latest") => {
  if (target === "all") {
    filter.value = "all";
    keyword.value = "";
    if (cards.value.length === 1) {
      await openDetail(cards.value[0]);
    }
    return;
  }
  if (target === "running") {
    filter.value = "running";
    keyword.value = "";
    if (runningCount.value === 1) {
      const nextCard = cards.value.find(
        (item) => item.runtimeLabel === "运行中",
      );
      if (nextCard) {
        await openDetail(nextCard);
      }
    }
    return;
  }
  if (target === "issue") {
    filter.value = "issue";
    keyword.value = "";
    if (issueCount.value === 1) {
      const nextCard = cards.value.find((item) => item.issue);
      if (nextCard) {
        await openDetail(nextCard);
      }
    }
    return;
  }
  if (latestOperationCard.value) {
    await openDetail(latestOperationCard.value);
  }
};
const openAiSettings = () => {
  emitter.emit("openPanel");
};

const mergeLines = (current: string[], incoming: string[]) =>
  [...current, ...incoming.filter(Boolean)]
    .filter((line, index, array) => index === 0 || line !== array[index - 1])
    .slice(-400);
const clearPoller = () => {
  if (runtimeLogPollTimer) {
    window.clearInterval(runtimeLogPollTimer);
    runtimeLogPollTimer = undefined;
  }
};
const refreshLogTail = async () => {
  if (!selectedInstallationId.value) return;
  const result = await getSoftLogs(selectedInstallationId.value, {
    lines: 200,
  }).catch(() => null);
  runtimeLines.value = mergeLines(
    runtimeLines.value,
    result?.data?.lines || [],
  );
};
const stopWatch = async () => {
  try {
    if (selectedInstallationId.value && runtimeWatchTicket.value?.watchId)
      await stopSoftLogWatch(
        selectedInstallationId.value,
        runtimeWatchTicket.value.watchId,
      ).catch(() => false);
  } finally {
    clearPoller();
    runtimeWatchTicket.value = null;
    runtimeWatching.value = false;
    disconnectRuntime();
  }
};
const toggleWatch = async () => {
  if (!selectedInstallationId.value) return;
  if (runtimeWatching.value) {
    await stopWatch();
    return;
  }
  const result = await startSoftLogWatch(selectedInstallationId.value).catch(
    () => null,
  );
  runtimeWatchTicket.value = result?.data || null;
  runtimeWatching.value = Boolean(runtimeWatchTicket.value?.watchId);
  connectRuntime(selectedInstallationId.value);
  await refreshLogTail();
  clearPoller();
  runtimeLogPollTimer = window.setInterval(() => {
    if (detailVisible.value && runtimeWatching.value && !document.hidden)
      void refreshLogTail();
  }, 3000);
};
const loadServiceLogs = async (serverServiceId: number) => {
  const result = await getServerServiceOperationLogs(serverServiceId, 12).catch(
    () => null,
  );
  if (selectedInstallationId.value)
    serviceLogMap.value = {
      ...serviceLogMap.value,
      [selectedInstallationId.value]: result?.data || [],
    };
};
const loadDetail = async (installationId: number) => {
  const [detailResult, serviceResult] = await Promise.all([
    getSoftInstallationDetail(installationId).catch(() => null),
    getServerServiceByInstallation(installationId).catch(() => null),
  ]);
  detailMap.value = {
    ...detailMap.value,
    [installationId]: detailResult?.data || null,
  };
  serviceMap.value = {
    ...serviceMap.value,
    [installationId]: serviceResult?.data || null,
  };
  if (serviceResult?.data?.serverServiceId)
    await loadServiceLogs(serviceResult.data.serverServiceId);
};
const loadPage = async () => {
  loading.value = true;
  try {
    const [
      capabilityResult,
      targetResult,
      installationResult,
      operationResult,
    ] = await Promise.all([
      getServerCapabilities().catch(() => null),
      listSoftBindingTargets().catch(() => null),
      listServerSoftInstallations().catch(() => null),
      listSoftOperationLogs().catch(() => null),
    ]);
    capabilities.value = capabilityResult?.data || null;
    targets.value = targetResult?.data || [];
    installations.value = installationResult?.data || [];
    operationLogs.value = operationResult?.data || [];
    await Promise.all(
      installations.value
        .filter((item) =>
          visibleTargetIds.value.has(Number(item.softTargetId || 0)),
        )
        .map((item) => loadDetail(Number(item.softInstallationId || 0))),
    );
  } finally {
    loading.value = false;
  }
};
const openDetail = async (card: Card) => {
  selectedInstallationId.value =
    Number(card.installation.softInstallationId || 0) || null;
  runtimeLines.value = [];
  disconnectOperation();
  await stopWatch();
  if (selectedInstallationId.value) {
    await loadDetail(selectedInstallationId.value);
    await refreshLogTail();
  }
  detailVisible.value = true;
};
const runAction = async (installationId: number, action: Action) => {
  actionKey.value = `${action}:${installationId}`;
  try {
    const executor =
      action === "start"
        ? startSoftService
        : action === "stop"
          ? stopSoftService
          : action === "restart"
            ? restartSoftService
            : getSoftServiceStatus;
    const result = await executor(installationId);
    if (result.data?.operationId) connectOperation(result.data.operationId);
    ElMessage.success("已提交项目操作");
    await loadPage();
    if (selectedInstallationId.value === installationId)
      await loadDetail(installationId);
  } catch (error) {
    console.error(error);
    ElMessage.error("项目操作提交失败");
  } finally {
    actionKey.value = "";
  }
};
const rollbackSnapshot = async (snapshotId?: number) => {
  if (!selectedInstallationId.value || !snapshotId) return;
  await ElMessageBox.confirm("确认回滚到该配置快照？", "回滚配置", {
    type: "warning",
  });
  try {
    const result = await rollbackSoftConfigSnapshot(
      selectedInstallationId.value,
      snapshotId,
    );
    if (result.data?.operationId) connectOperation(result.data.operationId);
    ElMessage.success("已提交配置回滚任务");
    await loadDetail(selectedInstallationId.value);
  } catch (error) {
    console.error(error);
    ElMessage.error("配置回滚失败");
  }
};

watch(
  () => runtimeLatestRef.value?.line,
  (line) => {
    if (line) runtimeLines.value = mergeLines(runtimeLines.value, [line]);
  },
);
watch(
  () => route.query.serverId,
  () => {
    void loadPage();
  },
);
onMounted(() => {
  void loadPage();
});
onUnmounted(() => {
  disconnectOperation();
  void stopWatch();
});
</script>

<style scoped lang="scss">
.server-project-page {
  display: grid;
  gap: 18px;
  min-height: calc(100vh - 140px);
  padding: 18px;
  color: #dbeafe;
  background:
    radial-gradient(
      circle at top left,
      rgba(14, 165, 233, 0.14),
      transparent 30%
    ),
    linear-gradient(160deg, #08111b 0%, #102131 48%, #17304a 100%);
}
.hero,
.summary-card,
.card,
.panel {
  border-radius: 24px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  background: rgba(8, 24, 36, 0.78);
}
.hero,
.toolbar,
.card-head,
.actions,
.detail-hero,
.panel-head {
  display: flex;
  align-items: center;
}
.hero,
.toolbar,
.card-head,
.detail-hero,
.panel-head {
  justify-content: space-between;
}
.hero {
  gap: 16px;
  padding: 22px 24px;
}
.hero h1 {
  margin: 8px 0 10px;
  font-size: 32px;
  color: #f8fafc;
}
.hero p,
.chip,
.message,
.hint,
.card p,
.ai-status p,
.ai-box p,
.ai-box small,
.op p,
.op small {
  color: rgba(191, 219, 254, 0.88);
}
.chips,
.actions,
.summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(8, 47, 73, 0.72);
  font-size: 12px;
}
.summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.summary-card {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
}
.summary-card strong {
  font-size: 24px;
  line-height: 1;
  color: #f8fafc;
}
.toolbar {
  gap: 14px;
}
.toolbar :deep(.el-input) {
  max-width: 380px;
}
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  align-content: start;
}
.ai-status {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
}
.ai-status.is-inactive {
  border-color: rgba(251, 191, 36, 0.24);
  background: rgba(120, 53, 15, 0.18);
}
.ai-status h3 {
  margin: 0 0 6px;
  color: #f8fafc;
}
.ai-status__chip--success {
  background: rgba(20, 83, 45, 0.56);
}
.ai-status__chip--primary {
  background: rgba(8, 47, 73, 0.9);
}
.ai-status__chip--warning {
  background: rgba(120, 53, 15, 0.56);
}
.ai-status__chip--danger {
  background: rgba(127, 29, 29, 0.58);
}
.card {
  display: grid;
  gap: 14px;
  padding: 18px 20px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(96, 165, 250, 0.35);
  box-shadow: 0 18px 28px rgba(2, 6, 23, 0.28);
}
.card.is-success {
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.18);
}
.card.is-danger {
  box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.22);
}
.card strong,
.detail-hero h3,
.panel h4 {
  color: #f8fafc;
}
.ai-box {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(146, 64, 14, 0.18);
  border: 1px solid rgba(251, 191, 36, 0.2);
}
.detail-hero {
  gap: 16px;
  margin-bottom: 14px;
}
.detail-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.panel {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
}
.panel-wide {
  grid-column: 1/-1;
}
.meta {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}
.meta dt {
  color: rgba(148, 163, 184, 0.92);
  font-size: 12px;
}
.list {
  display: grid;
  gap: 10px;
}
.snapshot,
.op {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.34);
  color: inherit;
  text-align: left;
}
.snapshot {
  cursor: pointer;
}
.op header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #f8fafc;
}
@media (max-width: 1080px) {
  .summary,
  .detail-grid,
  .meta {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 760px) {
  .hero,
  .toolbar,
  .detail-hero,
  .summary,
  .detail-grid,
  .meta {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
