<template>
  <section class="docker-install-page">
    <el-card shadow="never" class="install-card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>Docker 安装向导</strong>
            <p>为第一次使用者提供分步骤安装体验，支持镜像拉取和 Dockerfile 构建两种模式。</p>
          </div>
          <div class="header-actions">
            <el-button :loading="syncingImages" @click="runSync('images')">
              手动同步镜像
            </el-button>
            <el-button :loading="syncingContainers" @click="runSync('containers')">
              手动同步容器
            </el-button>
            <el-button link type="primary" @click="showGuide = true">
              查看首次安装说明
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        v-if="installHint"
        :closable="false"
        type="success"
        class="install-alert"
        :title="installHint"
      />

      <el-steps :active="activeStep" finish-status="success" simple class="install-steps">
        <el-step title="选择服务器" />
        <el-step title="仓库与镜像" />
        <el-step title="容器参数" />
        <el-step title="挂载与网络 / Dockerfile" />
        <el-step title="确认提交" />
      </el-steps>

      <div class="install-body">
        <section v-show="activeStep === 0" class="step-panel">
          <header class="step-panel__header">
            <strong>第一步：选择服务器</strong>
            <p>安装任务支持多选服务器，后端会为每个目标分别创建执行链路。</p>
          </header>
          <el-form label-width="120px">
            <el-form-item label="目标服务器">
              <el-select
                v-model="form.serverIds"
                multiple
                filterable
                clearable
                placeholder="请选择服务器（来源：@pages/server + docker后台）"
                style="width: 100%"
              >
                <el-option
                  v-for="item in mergedOptions"
                  :key="item.serverId"
                  :label="`${item.serverName} (${item.host || '-'})`"
                  :value="item.serverId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="同步任务">
              <div class="sync-box">
                <el-tag v-if="imageSync" type="info">
                  镜像同步: {{ syncText(imageSync) }}
                </el-tag>
                <el-tag v-if="containerSync" type="info">
                  容器同步: {{ syncText(containerSync) }}
                </el-tag>
                <el-button size="small" @click="refreshSyncSchedules">刷新同步任务状态</el-button>
              </div>
            </el-form-item>
          </el-form>
        </section>

        <section v-show="activeStep === 1" class="step-panel">
          <header class="step-panel__header">
            <strong>第二步：仓库与镜像</strong>
            <p>可直接拉取镜像，也可以切换到 Dockerfile 构建模式。</p>
          </header>
          <el-form label-width="120px">
            <el-form-item label="安装模式">
              <el-radio-group v-model="form.useDockerfile">
                <el-radio-button :label="false">镜像拉取</el-radio-button>
                <el-radio-button :label="true">Dockerfile 构建</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="仓库记录">
              <el-select v-model="form.registryId" clearable filterable style="width: 100%">
                <el-option
                  v-for="item in registries"
                  :key="item.dockerRegistryId"
                  :label="`${item.registryName}${item.namespace ? ` / ${item.namespace}` : ''}`"
                  :value="item.dockerRegistryId"
                />
              </el-select>
            </el-form-item>
            <template v-if="!form.useDockerfile">
              <el-form-item label="镜像名">
                <el-input v-model="form.imageName" placeholder="nginx 或 harbor.local/library/nginx" />
              </el-form-item>
              <el-form-item label="镜像标签">
                <el-input v-model="form.imageTag" placeholder="latest" />
              </el-form-item>
            </template>
            <template v-else>
              <el-form-item label="Dockerfile 路径">
                <el-input v-model="form.dockerfilePath" placeholder="如 springboot-demo/Dockerfile" />
              </el-form-item>
              <el-form-item label="构建上下文">
                <el-input v-model="form.buildContextPath" placeholder="如 /workspace/demo" />
              </el-form-item>
              <el-form-item label="Dockerfile 内容">
                <el-input
                  v-model="form.dockerfileContent"
                  type="textarea"
                  :rows="10"
                  placeholder="支持在线编辑 Dockerfile 内容"
                />
              </el-form-item>
            </template>
          </el-form>
        </section>

        <section v-show="activeStep === 2" class="step-panel">
          <header class="step-panel__header">
            <strong>第三步：容器参数</strong>
            <p>配置容器名称、环境变量和端口映射，提交后会进入安装任务请求快照。</p>
          </header>
          <el-form label-width="120px">
            <el-form-item label="容器名称">
              <el-input v-model="form.containerName" placeholder="如 nginx-web" />
            </el-form-item>
            <el-form-item label="环境变量">
              <el-input
                v-model="envText"
                type="textarea"
                :rows="8"
                placeholder="每行 KEY=VALUE"
              />
            </el-form-item>
            <el-form-item label="端口映射">
              <el-input
                v-model="portMappingsText"
                type="textarea"
                :rows="6"
                placeholder="每行一个映射，如 8080:80/tcp 或 127.0.0.1:8080:80/tcp"
              />
            </el-form-item>
          </el-form>
        </section>

        <section v-show="activeStep === 3" class="step-panel">
          <header class="step-panel__header">
            <strong>第四步：挂载与网络 / Dockerfile</strong>
            <p>可选择已有映射，也可手工补充并同步入挂载/网络表。</p>
          </header>

          <div class="dual-grid">
            <article class="config-block">
              <header>
                <strong>挂载配置</strong>
                <el-button size="small" @click="appendMount">新增挂载</el-button>
              </header>
              <div v-if="mountItems.length" class="config-list">
                <div v-for="(item, index) in mountItems" :key="`mount-${index}`" class="config-item">
                  <el-select v-model="item.mountId" clearable placeholder="选择已有挂载">
                    <el-option
                      v-for="mount in availableMounts"
                      :key="mount.dockerMountId"
                      :label="`${mount.mountName || mount.hostPath} -> ${mount.containerPath}`"
                      :value="mount.dockerMountId"
                    />
                  </el-select>
                  <el-input v-model="item.hostPath" placeholder="主机路径" />
                  <el-input v-model="item.containerPath" placeholder="容器路径" />
                  <el-switch v-model="item.readOnly" inline-prompt active-text="RO" inactive-text="RW" />
                  <el-button text type="danger" @click="removeMount(index)">删除</el-button>
                </div>
              </div>
              <el-empty v-else description="尚未配置挂载" />
              <el-switch v-model="form.syncInputMounts" active-text="同步到挂载表" inactive-text="不回写" />
            </article>

            <article class="config-block">
              <header>
                <strong>网络配置</strong>
                <el-button size="small" @click="appendNetwork">新增网络</el-button>
              </header>
              <div v-if="networkItems.length" class="config-list">
                <div v-for="(item, index) in networkItems" :key="`network-${index}`" class="config-item">
                  <el-select v-model="item.networkId" clearable placeholder="选择已有网络">
                    <el-option
                      v-for="network in availableNetworks"
                      :key="network.dockerNetworkId"
                      :label="`${network.networkName} (${network.driver || 'bridge'})`"
                      :value="network.dockerNetworkId"
                    />
                  </el-select>
                  <el-input v-model="item.networkName" placeholder="网络名称" />
                  <el-input v-model="item.subnetCidr" placeholder="子网 CIDR" />
                  <el-input v-model="item.gatewayIp" placeholder="网关 IP" />
                  <el-button text type="danger" @click="removeNetwork(index)">删除</el-button>
                </div>
              </div>
              <el-empty v-else description="尚未配置网络" />
              <el-switch v-model="form.syncInputNetworks" active-text="同步到网络表" inactive-text="不回写" />
            </article>
          </div>
        </section>

        <section v-show="activeStep === 4" class="step-panel">
          <header class="step-panel__header">
            <strong>第五步：确认提交</strong>
            <p>提交后会创建安装任务，并持续刷新步骤状态。</p>
          </header>

          <div class="confirm-grid">
            <article class="confirm-card">
              <small>服务器</small>
              <strong>{{ form.serverIds.length }}</strong>
              <p>{{ selectedServerLabels.join(" / ") || "未选择" }}</p>
            </article>
            <article class="confirm-card">
              <small>安装模式</small>
              <strong>{{ form.useDockerfile ? "Dockerfile" : "镜像拉取" }}</strong>
              <p>{{ form.useDockerfile ? form.dockerfilePath || "在线内容" : `${form.imageName || "-"}:${form.imageTag || "latest"}` }}</p>
            </article>
            <article class="confirm-card">
              <small>挂载 / 网络</small>
              <strong>{{ mountItems.length }} / {{ networkItems.length }}</strong>
              <p>支持手工输入并回写映射</p>
            </article>
            <article class="confirm-card">
              <small>端口映射</small>
              <strong>{{ normalizedPortMappings().length }}</strong>
              <p>端口映射会进入安装任务请求快照</p>
            </article>
          </div>

          <div class="submit-actions">
            <el-button type="primary" :loading="submitting" @click="submitInstallation">创建安装任务</el-button>
            <el-button v-if="taskDetail" @click="taskDialogVisible = true">查看任务详情</el-button>
          </div>
        </section>
      </div>

      <div class="wizard-footer">
        <el-button :disabled="activeStep === 0" @click="activeStep -= 1">上一步</el-button>
        <el-button v-if="activeStep < 4" type="primary" @click="goNextStep">下一步</el-button>
      </div>
    </el-card>

    <DockerInstallGuideDialog v-model:visible="showGuide" />
    <ScTaskMessageDialog
      v-model:visible="taskDialogVisible"
      title="Docker 安装任务"
      :task="taskDialogModel"
      :loading="loadingTask"
      @refresh="refreshTaskDetail"
      @retry="retryFromTaskDetail"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { DockerTopics, type WsMessage } from "@repo/core";
import ScTaskMessageDialog from "@repo/components/ScTaskMessageDialog";
import type { TaskDialogModel } from "@repo/components/ScTaskMessageDialog/types";
import { resolveRuntimeProviders } from "@layout/default";
import {
  createDockerInstallation,
  getDockerInstallation,
  getDockerSyncSchedule,
  listDockerMounts,
  listDockerNetworks,
  listDockerRegistries,
  runDockerSync,
} from "../api";
import type {
  DockerInstallNetworkInput,
  DockerInstallPortMappingInput,
  DockerInstallRequest,
  DockerInstallTaskDetail,
  DockerInstallMountInput,
  DockerMount,
  DockerNetwork,
  DockerRealtimePayload,
  DockerRegistry,
  DockerSyncScheduleView,
} from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";
import DockerInstallGuideDialog from "./components/DockerInstallGuideDialog.vue";

const route = useRoute();
const { mergedOptions, loadServers } = useDockerServerSelection();
// 统一 provider 解析：lay-xx -> @repo/core -> 本地兜底。
const runtimeProviders = resolveRuntimeProviders({
  module: "docker.install",
  socketName: "docker-install",
});
const notify = runtimeProviders.message.provider;
const taskCenter = runtimeProviders.task.provider;

const activeStep = ref(0);
const showGuide = ref(false);
const installHint = ref("");
const imageSync = ref<DockerSyncScheduleView | null>(null);
const containerSync = ref<DockerSyncScheduleView | null>(null);
const syncingImages = ref(false);
const syncingContainers = ref(false);
const submitting = ref(false);
const loadingTask = ref(false);
const taskDetail = ref<DockerInstallTaskDetail | null>(null);
const taskPollingTimer = ref<number>();
const taskDialogVisible = ref(false);
const socketReconnectTimer = ref<number>();
const socketReconnectAttempt = ref(0);
const lastRealtimeAt = ref<number | null>(null);
const realtimeDedupKeys = new Set<string>();
const socketUnsubscribers: Array<() => void> = [];
const taskLogLines = ref<string[]>([]);
const activeTaskId = ref<string>();

const registries = ref<DockerRegistry[]>([]);
const availableMounts = ref<DockerMount[]>([]);
const availableNetworks = ref<DockerNetwork[]>([]);

const envText = ref("");
const portMappingsText = ref("");
const mountItems = ref<DockerInstallMountInput[]>([]);
const networkItems = ref<DockerInstallNetworkInput[]>([]);

const form = ref<DockerInstallRequest>({
  serverIds: [],
  registryId: undefined,
  imageName: "",
  imageTag: "latest",
  useDockerfile: false,
  dockerfileContent: "",
  dockerfilePath: "",
  buildContextPath: "",
  containerName: "",
  env: {},
  mounts: [],
  networks: [],
  syncInputMounts: true,
  syncInputNetworks: true,
});

const selectedServerLabels = computed(() =>
  mergedOptions.value
    .filter((item) => form.value.serverIds.includes(item.serverId))
    .map((item) => item.serverName),
);

const resolveTaskErrorSummary = (detail: DockerInstallTaskDetail | null) => {
  if (!detail || !["FAILED", "CANCELLED"].includes(detail.status)) {
    return undefined;
  }
  const failedStep = detail.steps.find((item) => item.status === "FAILED");
  return failedStep?.message || detail.message || "安装任务执行失败";
};

const taskDialogModel = computed<TaskDialogModel | null>(() => {
  if (!taskDetail.value) {
    return null;
  }
  const snapshot = taskDetail.value.requestSnapshot;
  return {
    taskId: taskDetail.value.taskId,
    status: taskDetail.value.status,
    message: taskDetail.value.message,
    serverIds: taskDetail.value.serverIds,
    imageName: taskDetail.value.imageName,
    imageTag: taskDetail.value.imageTag,
    createdAt: taskDetail.value.createdAt,
    updatedAt: taskDetail.value.updatedAt,
    steps: taskDetail.value.steps,
    errorSummary: resolveTaskErrorSummary(taskDetail.value),
    logs: taskLogLines.value,
    retryable: ["FAILED", "CANCELLED"].includes(taskDetail.value.status),
    retryLabel: "回到安装向导重试",
    summaryItems: [
      {
        label: "安装模式",
        value: taskDetail.value.useDockerfile ? "Dockerfile 构建" : "镜像拉取",
      },
      {
        label: "容器名称",
        value: snapshot?.containerName || "-",
      },
      {
        label: "环境变量",
        value: snapshot?.env ? `${Object.keys(snapshot.env).length} 项` : "0 项",
      },
      {
        label: "端口映射",
        value: snapshot?.portMappings?.length
          ? snapshot.portMappings
              .map((item) =>
                `${item.hostIp ? `${item.hostIp}:` : ""}${item.hostPort}:${item.containerPort}/${item.protocol || "tcp"}`,
              )
              .join(" / ")
          : "-",
      },
      {
        label: "挂载",
        value: snapshot?.mounts?.length
          ? snapshot.mounts
              .map((item) => `${item.hostPath || `#${item.mountId}`}:${item.containerPath || "-"}`)
              .join(" / ")
          : "-",
      },
      {
        label: "网络",
        value: snapshot?.networks?.length
          ? snapshot.networks
              .map((item) => item.networkName || (item.networkId ? `#${item.networkId}` : "-"))
              .join(" / ")
          : "-",
      },
    ],
  };
});

const refreshSyncSchedules = async () => {
  const [imageRes, containerRes] = await Promise.all([
    getDockerSyncSchedule("images"),
    getDockerSyncSchedule("containers"),
  ]);
  imageSync.value = imageRes.data;
  containerSync.value = containerRes.data;
};

const syncText = (item: DockerSyncScheduleView) => {
  if (item.syncMode === "scheduled") {
    return "定时同步";
  }
  if (item.syncMode === "disabled") {
    return "已禁用";
  }
  return "仅手动";
};

const resolveStepStatusFromRealtime = (status?: string, fallback = "PENDING") => {
  if (status === "SUCCESS") {
    return "SUCCESS";
  }
  if (status === "FAILED" || status === "CANCELLED") {
    return "FAILED";
  }
  if (status === "RUNNING" || status === "PARTIAL") {
    return "RUNNING";
  }
  if (status === "PENDING") {
    return "PENDING";
  }
  return fallback;
};

const resolveTaskCenterStatus = (status?: string) => {
  if (status === "SUCCESS") {
    return "success";
  }
  if (status === "FAILED" || status === "CANCELLED") {
    return "error";
  }
  if (status === "RUNNING" || status === "PENDING") {
    return "running";
  }
  return "pending";
};

const keepRecentDedupKey = (key: string) => {
  if (!key) {
    return false;
  }
  if (realtimeDedupKeys.has(key)) {
    return true;
  }
  realtimeDedupKeys.add(key);
  if (realtimeDedupKeys.size > 2000) {
    const oldest = realtimeDedupKeys.values().next().value;
    if (oldest) {
      realtimeDedupKeys.delete(oldest);
    }
  }
  return false;
};

const resolveRealtimeDedupKey = (eventName: string, payload: DockerRealtimePayload) => {
  if (payload.eventId) {
    return payload.eventId;
  }
  return [
    eventName,
    payload.taskId || "-",
    payload.stepKey || "-",
    payload.progressPercent ?? "-",
    payload.message || payload.line || "-",
  ].join("|");
};

const ensureTaskLogScope = (taskId?: string) => {
  if (!taskId) {
    return;
  }
  if (activeTaskId.value && activeTaskId.value !== taskId) {
    taskLogLines.value = [];
  }
  activeTaskId.value = taskId;
};

const appendTaskLog = (taskId: string, line?: string) => {
  const text = String(line || "").trim();
  if (!text) {
    return;
  }
  ensureTaskLogScope(taskId);
  const lastLine = taskLogLines.value[taskLogLines.value.length - 1];
  if (lastLine === text) {
    return;
  }
  taskLogLines.value.push(text);
  if (taskLogLines.value.length > 500) {
    taskLogLines.value = taskLogLines.value.slice(-500);
  }
};

const hydrateTaskLogsFromDetail = (detail: DockerInstallTaskDetail | null) => {
  if (!detail?.taskId) {
    return;
  }
  ensureTaskLogScope(detail.taskId);
  appendTaskLog(detail.taskId, detail.message);
  const lines = detail.steps
    ?.map((item) => String(item.message || "").trim())
    .filter(Boolean) || [];
  if (!lines.length) {
    return;
  }
  lines.forEach((item) => appendTaskLog(detail.taskId, item));
};

const patchTaskDetailFromRealtime = (payload: DockerRealtimePayload) => {
  if (!taskDetail.value || !payload.taskId || payload.taskId !== taskDetail.value.taskId) {
    return;
  }
  const now = Date.now();
  const nextSteps = payload.stepKey
    ? taskDetail.value.steps.map((item) => {
        if (item.stepKey !== payload.stepKey) {
          return item;
        }
        return {
          ...item,
          status: resolveStepStatusFromRealtime(payload.status, item.status),
          message: payload.message || payload.line || item.message,
          updatedAt: now,
        };
      })
    : taskDetail.value.steps;
  taskDetail.value = {
    ...taskDetail.value,
    status: payload.status || taskDetail.value.status,
    message: payload.message || payload.line || taskDetail.value.message,
    updatedAt: now,
    steps: nextSteps,
  };
};

const applyRealtimeEvent = (eventName: string, payload: DockerRealtimePayload) => {
  if (!payload || typeof payload !== "object") {
    return;
  }
  const dedupKey = resolveRealtimeDedupKey(eventName, payload);
  if (keepRecentDedupKey(dedupKey)) {
    return;
  }
  lastRealtimeAt.value = Date.now();
  const taskId = payload.taskId || taskDetail.value?.taskId;
  if (!taskId) {
    return;
  }
  if (taskDetail.value?.taskId && payload.taskId && payload.taskId !== taskDetail.value.taskId) {
    return;
  }
  taskCenter.updateTask(taskId, {
    title: taskDetail.value
      ? `Docker 安装 · ${taskDetail.value.imageName || "未命名镜像"}`
      : "Docker 安装任务",
    description: taskDetail.value?.serverIds?.length
      ? `服务器 ${taskDetail.value.serverIds.join(", ")}`
      : undefined,
    status: resolveTaskCenterStatus(payload.status),
    progress: payload.progressPercent,
    source: "socket",
    mode: "stream",
    message: payload.message || payload.line,
    stageLabel: payload.stepKey,
  });
  if (payload.message) {
    taskCenter.appendMessage(taskId, payload.message);
    appendTaskLog(taskId, payload.message);
  }
  if (payload.line) {
    taskCenter.appendMessage(taskId, payload.line);
    appendTaskLog(taskId, payload.line);
  }
  patchTaskDetailFromRealtime(payload);
  syncTaskCenterFromDetail(taskDetail.value);
  if (payload.finished) {
    stopTaskPolling();
    void refreshTaskDetail(taskId);
  }
};

// 将后端安装任务详情映射到全局任务中心，保证 lay-xx 与页面弹框同步。
const syncTaskCenterFromDetail = (detail: DockerInstallTaskDetail | null) => {
  if (!detail) {
    return;
  }
  const total = detail.steps?.length || 0;
  const successCount =
    detail.steps?.filter((item) => item.status === "SUCCESS").length || 0;
  const runningExists = detail.steps?.some((item) => item.status === "RUNNING");
  const progress = total > 0
    ? Math.round(((successCount + (runningExists ? 0.5 : 0)) / total) * 100)
    : undefined;
  const runningStepMessage = detail.steps?.find(
    (item) => item.status === "RUNNING",
  )?.message;

  taskCenter.updateTask(detail.taskId, {
    title: `Docker 安装 · ${detail.imageName || "未命名镜像"}`,
    description: `服务器 ${detail.serverIds?.join(", ") || "-"}`,
    status: resolveTaskCenterStatus(detail.status),
    progress,
    source: "system",
    mode: "stream",
    message: detail.message,
    stageLabel: runningStepMessage,
  });
  if (runningStepMessage) {
    taskCenter.appendMessage(detail.taskId, runningStepMessage);
  }
};

const clearSocketSubscriptions = () => {
  while (socketUnsubscribers.length) {
    socketUnsubscribers.pop()?.();
  }
};

const stopSocketReconnect = () => {
  if (socketReconnectTimer.value) {
    window.clearTimeout(socketReconnectTimer.value);
    socketReconnectTimer.value = undefined;
  }
};

const ensureSocketConnected = () => {
  const socket = runtimeProviders.socket.provider;
  if (!socket) {
    return;
  }
  if (socket.isConnected) {
    socketReconnectAttempt.value = 0;
    stopSocketReconnect();
    return;
  }
  socket.connect();
  if (!socket.isConnected) {
    stopSocketReconnect();
    const delay = Math.min(12000, 1000 * (2 ** socketReconnectAttempt.value));
    socketReconnectTimer.value = window.setTimeout(() => {
      socketReconnectAttempt.value += 1;
      ensureSocketConnected();
    }, delay);
  }
};

const bindRealtimeEvents = () => {
  const socket = runtimeProviders.socket.provider;
  if (!socket) {
    return;
  }
  clearSocketSubscriptions();
  [
    DockerTopics.EVENTS.INSTALL_PROGRESS,
    DockerTopics.EVENTS.INSTALL_LOG,
    DockerTopics.EVENTS.INSTALL_RESULT,
  ].forEach((eventName) => {
    socketUnsubscribers.push(
      socket.subscribe(DockerTopics.MODULE, eventName, (message: WsMessage) => {
        applyRealtimeEvent(eventName, (message?.data || {}) as DockerRealtimePayload);
      }),
    );
  });
  ensureSocketConnected();
};

const loadBaseOptions = async () => {
  const firstServerId = form.value.serverIds[0];
  const [registryRes, mountRes, networkRes] = await Promise.all([
    listDockerRegistries({ enabled: true }),
    firstServerId
      ? listDockerMounts({
          serverId: firstServerId,
          enabled: true,
        })
      : Promise.resolve({ data: [] }),
    firstServerId
      ? listDockerNetworks({
          serverId: firstServerId,
          enabled: true,
        })
      : Promise.resolve({ data: [] }),
  ]);
  registries.value = registryRes.data || [];
  availableMounts.value = mountRes.data || [];
  availableNetworks.value = networkRes.data || [];
};

const runSync = async (scope: "images" | "containers") => {
  const loadingRef = scope === "images" ? syncingImages : syncingContainers;
  loadingRef.value = true;
  try {
    const result = await runDockerSync(scope, {
      serverIds: form.value.serverIds.length ? form.value.serverIds : undefined,
      deleteAbsent: false,
    });
    notify.success(
      `${scope === "images" ? "镜像" : "容器"}同步完成，服务器 ${result.data.serverCount} 台，新增 ${result.data.createdCount}，更新 ${result.data.updatedCount}`,
    );
    await refreshSyncSchedules();
  } catch (error: any) {
    notify.error(error?.message || error?.msg || "同步失败");
  } finally {
    loadingRef.value = false;
  }
};

const appendMount = () => {
  mountItems.value.push({
    mountId: undefined,
    hostPath: "",
    containerPath: "",
    readOnly: false,
    mountName: "",
  });
};

const removeMount = (index: number) => {
  mountItems.value.splice(index, 1);
};

const appendNetwork = () => {
  networkItems.value.push({
    networkId: undefined,
    networkName: "",
    driver: "bridge",
    subnetCidr: "",
    gatewayIp: "",
  });
};

const removeNetwork = (index: number) => {
  networkItems.value.splice(index, 1);
};

const parseEnvText = () =>
  envText.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const idx = line.indexOf("=");
      if (idx > 0) {
        acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
      return acc;
    }, {});

const normalizedMounts = () =>
  mountItems.value
    .map((item) => ({
      mountId: item.mountId,
      hostPath: item.hostPath?.trim() || undefined,
      containerPath: item.containerPath?.trim() || undefined,
      readOnly: item.readOnly,
      mountName: item.mountName?.trim() || undefined,
    }))
    .filter((item) => item.mountId || (item.hostPath && item.containerPath));

const normalizedNetworks = () =>
  networkItems.value
    .map((item) => ({
      networkId: item.networkId,
      networkName: item.networkName?.trim() || undefined,
      driver: item.driver?.trim() || undefined,
      subnetCidr: item.subnetCidr?.trim() || undefined,
      gatewayIp: item.gatewayIp?.trim() || undefined,
    }))
    .filter((item) => item.networkId || item.networkName);

const normalizedPortMappings = (): DockerInstallPortMappingInput[] =>
  portMappingsText.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const slashIndex = line.lastIndexOf("/");
      const hostAndContainer = slashIndex > 0 ? line.slice(0, slashIndex) : line;
      const protocol = slashIndex > 0 ? line.slice(slashIndex + 1).trim() || "tcp" : "tcp";
      const parts = hostAndContainer.split(":").map((item) => item.trim()).filter(Boolean);
      if (parts.length === 2) {
        return {
          hostPort: Number(parts[0]),
          containerPort: Number(parts[1]),
          protocol,
        };
      }
      if (parts.length === 3) {
        return {
          hostIp: parts[0],
          hostPort: Number(parts[1]),
          containerPort: Number(parts[2]),
          protocol,
        };
      }
      return {
        hostPort: undefined,
        containerPort: undefined,
        protocol,
      };
    })
    .filter((item) => item.hostPort && item.containerPort);

const goNextStep = async () => {
  if (activeStep.value === 0 && !form.value.serverIds.length) {
    notify.warning("至少选择一台服务器");
    return;
  }
  if (activeStep.value === 1) {
    if (form.value.useDockerfile) {
      if (!form.value.dockerfileContent?.trim() && !form.value.dockerfilePath?.trim()) {
        notify.warning("Dockerfile 模式下至少填写内容或路径");
        return;
      }
    } else if (!form.value.imageName?.trim()) {
      notify.warning("镜像模式下必须填写镜像名");
      return;
    }
  }
  if (activeStep.value === 0) {
    await loadBaseOptions();
  }
  activeStep.value += 1;
};

const buildInstallRequest = (): DockerInstallRequest => ({
  serverIds: form.value.serverIds,
  registryId: form.value.registryId,
  imageName: form.value.imageName?.trim() || undefined,
  imageTag: form.value.imageTag?.trim() || undefined,
  useDockerfile: form.value.useDockerfile,
  dockerfileContent: form.value.dockerfileContent?.trim() || undefined,
  dockerfilePath: form.value.dockerfilePath?.trim() || undefined,
  buildContextPath: form.value.buildContextPath?.trim() || undefined,
  containerName: form.value.containerName?.trim() || undefined,
  env: parseEnvText(),
  portMappings: normalizedPortMappings(),
  mounts: normalizedMounts(),
  networks: normalizedNetworks(),
  syncInputMounts: form.value.syncInputMounts,
  syncInputNetworks: form.value.syncInputNetworks,
});

const toPortMappingLine = (item: DockerInstallPortMappingInput) => {
  const hostPort = Number(item.hostPort);
  const containerPort = Number(item.containerPort);
  if (!hostPort || !containerPort) {
    return "";
  }
  const protocol = (item.protocol || "tcp").trim().toLowerCase();
  if (item.hostIp?.trim()) {
    return `${item.hostIp.trim()}:${hostPort}:${containerPort}/${protocol}`;
  }
  return `${hostPort}:${containerPort}/${protocol}`;
};

const applySnapshotToForm = (snapshot?: DockerInstallRequest) => {
  if (!snapshot) {
    return;
  }
  form.value.serverIds = snapshot.serverIds || [];
  form.value.registryId = snapshot.registryId;
  form.value.imageName = snapshot.imageName || "";
  form.value.imageTag = snapshot.imageTag || "latest";
  form.value.useDockerfile = Boolean(snapshot.useDockerfile);
  form.value.dockerfileContent = snapshot.dockerfileContent || "";
  form.value.dockerfilePath = snapshot.dockerfilePath || "";
  form.value.buildContextPath = snapshot.buildContextPath || "";
  form.value.containerName = snapshot.containerName || "";
  form.value.syncInputMounts = snapshot.syncInputMounts !== false;
  form.value.syncInputNetworks = snapshot.syncInputNetworks !== false;

  envText.value = Object.entries(snapshot.env || {})
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  portMappingsText.value = (snapshot.portMappings || [])
    .map(toPortMappingLine)
    .filter(Boolean)
    .join("\n");
  mountItems.value = (snapshot.mounts || []).map((item) => ({
    mountId: item.mountId,
    hostPath: item.hostPath || "",
    containerPath: item.containerPath || "",
    readOnly: Boolean(item.readOnly),
    mountName: item.mountName || "",
  }));
  networkItems.value = (snapshot.networks || []).map((item) => ({
    networkId: item.networkId,
    networkName: item.networkName || "",
    driver: item.driver || "bridge",
    subnetCidr: item.subnetCidr || "",
    gatewayIp: item.gatewayIp || "",
  }));
};

const retryFromTaskDetail = async () => {
  if (!taskDetail.value?.requestSnapshot) {
    notify.warning("当前任务缺少可回填参数，无法重试");
    return;
  }
  applySnapshotToForm(taskDetail.value.requestSnapshot);
  await loadBaseOptions();
  taskDialogVisible.value = false;
  activeStep.value = 4;
  installHint.value = `已回填任务 ${taskDetail.value.taskId} 参数，请确认后重新提交`;
  notify.success("已回填失败任务参数，可直接修改后重试");
};

const submitInstallation = async () => {
  submitting.value = true;
  try {
    const request = buildInstallRequest();
    taskLogLines.value = [];
    activeTaskId.value = undefined;
    const result = await createDockerInstallation(request);
    ensureTaskLogScope(result.data.taskId);
    ensureSocketConnected();
    taskCenter.updateTask(result.data.taskId, {
      title: `Docker 安装 · ${request.imageName || "Dockerfile 构建"}`,
      description: `服务器 ${request.serverIds.join(", ")}`,
      status: "pending",
      progress: 0,
      source: "system",
      mode: "stream",
      message: result.data.message || "安装任务已创建",
    });
    appendTaskLog(result.data.taskId, result.data.message || "安装任务已创建");
    notify.success(result.data.message || "安装任务已创建");
    await refreshTaskDetail(result.data.taskId);
    startTaskPolling(result.data.taskId);
    taskDialogVisible.value = true;
  } catch (error: any) {
    notify.error(error?.message || error?.msg || "创建安装任务失败");
  } finally {
    submitting.value = false;
  }
};

const refreshTaskDetail = async (taskId?: string) => {
  const currentTaskId = taskId || taskDetail.value?.taskId;
  if (!currentTaskId) {
    return;
  }
  loadingTask.value = true;
  try {
    const result = await getDockerInstallation(currentTaskId);
    taskDetail.value = result.data || null;
    hydrateTaskLogsFromDetail(taskDetail.value);
    syncTaskCenterFromDetail(taskDetail.value);
  } catch (error: any) {
    notify.error(error?.message || error?.msg || "加载任务详情失败");
  } finally {
    loadingTask.value = false;
  }
};

const startTaskPolling = (taskId: string) => {
  stopTaskPolling();
  const pollIntervalMs = runtimeProviders.socket.provider ? 5000 : 3000;
  taskPollingTimer.value = window.setInterval(async () => {
    // 有 socket 时优先实时消息，仅在静默一段时间后才兜底轮询。
    if (runtimeProviders.socket.provider) {
      ensureSocketConnected();
      const lastAt = lastRealtimeAt.value || 0;
      if (Date.now() - lastAt < 4000) {
        return;
      }
    }
    await refreshTaskDetail(taskId);
    if (taskDetail.value?.status && ["SUCCESS", "FAILED", "CANCELLED"].includes(taskDetail.value.status)) {
      stopTaskPolling();
    }
  }, pollIntervalMs);
};

const stopTaskPolling = () => {
  if (taskPollingTimer.value) {
    window.clearInterval(taskPollingTimer.value);
    taskPollingTimer.value = undefined;
  }
};

const applyRoutePrefill = () => {
  if (route.query.serverId) {
    form.value.serverIds = [Number(route.query.serverId)];
  }
  if (route.query.registryId) {
    form.value.registryId = Number(route.query.registryId);
  }
  if (route.query.imageName) {
    form.value.imageName = String(route.query.imageName);
  }
  if (route.query.imageTag) {
    form.value.imageTag = String(route.query.imageTag);
  }
  if (route.query.imageName || route.query.imageTag || route.query.registryId) {
    installHint.value = [
      route.query.registryId ? `仓库ID=${route.query.registryId}` : "",
      route.query.imageName ? `镜像=${route.query.imageName}` : "",
      route.query.imageTag ? `标签=${route.query.imageTag}` : "",
    ]
      .filter(Boolean)
      .join(" / ");
  }
};

onMounted(async () => {
  await loadServers();
  bindRealtimeEvents();
  applyRoutePrefill();
  await refreshSyncSchedules();
  await loadBaseOptions();
});

watch(
  () => form.value.serverIds[0],
  async (value, oldValue) => {
    if (value === oldValue) {
      return;
    }
    await loadBaseOptions();
  },
);

onUnmounted(() => {
  stopTaskPolling();
  stopSocketReconnect();
  clearSocketSubscriptions();
});
</script>

<style scoped lang="scss">
.docker-install-page {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.install-card,
.task-card {
  border-radius: 18px;
}

.card-header,
.header-actions,
.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.card-header p,
.step-panel__header p,
.confirm-card p {
  margin: 0;
  color: #64748b;
}

.install-alert {
  margin-bottom: 16px;
}

.install-steps {
  margin-bottom: 20px;
}

.install-body {
  min-height: 520px;
}

.step-panel {
  display: grid;
  gap: 18px;
}

.step-panel__header strong,
.confirm-card strong {
  color: #0f172a;
}

.sync-box,
.submit-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.dual-grid,
.confirm-grid {
  display: grid;
  gap: 16px;
}

.dual-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.confirm-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.config-block,
.confirm-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(248, 250, 252, 0.88);
}

.config-block header,
.config-item {
  display: grid;
  gap: 10px;
}

.config-list {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.config-item {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

@media (max-width: 960px) {
  .dual-grid,
  .confirm-grid {
    grid-template-columns: 1fr;
  }
}
</style>
