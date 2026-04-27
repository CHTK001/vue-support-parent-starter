<template>
  <div class="rpp">
    <section class="rpp__toolbar">
      <header class="rpp__toolbar-head">
        <div>
          <p class="rpp__toolbar-eyebrow">Project Deploy</p>
          <h3>项目部署工具栏</h3>
        </div>
        <div class="rpp__toolbar-actions">
          <el-tooltip content="新增项目" placement="top">
            <ScButton class="rpp__toolbar-icon-btn" type="primary" plain @click="openAddDialog">
              <IconifyIconOnline icon="ep:plus" />
            </ScButton>
          </el-tooltip>
          <el-tooltip content="刷新项目列表" placement="top">
            <ScButton
              class="rpp__toolbar-icon-btn"
              plain
              :loading="listLoading"
              @click="() => void loadProjects()"
            >
              <IconifyIconOnline icon="ep:refresh" />
            </ScButton>
          </el-tooltip>
          <el-tooltip content="全局上传设置" placement="top">
            <ScButton
              class="rpp__toolbar-icon-btn"
              plain
              @click="showGlobalSettingsDialog = true"
            >
              <IconifyIconOnline icon="ep:setting" />
            </ScButton>
          </el-tooltip>
          <el-tooltip content="容器管理" placement="top">
            <ScButton
              class="rpp__toolbar-icon-btn"
              plain
              @click="openContainerSoftwareDialog"
            >
              <IconifyIconOnline icon="ri:apps-2-add-line" />
            </ScButton>
          </el-tooltip>
          <el-tooltip
            :content="
              batchSelectionMode ? '退出批量上传模式' : '进入批量上传模式'
            "
            placement="top"
          >
            <ScButton
              class="rpp__toolbar-icon-btn"
              type="primary"
              :plain="!batchSelectionMode"
              @click="toggleBatchSelectionMode"
            >
              <IconifyIconOnline icon="ep:upload-filled" />
            </ScButton>
          </el-tooltip>
        </div>
      </header>
    </section>

    <section v-if="batchSelectionMode" class="rpp__batch-panel">
      <div class="rpp__batch-panel-head">
        <strong>批量上传模式</strong>
        <span>点击卡片右上角“批量”勾选项目后执行升级</span>
      </div>
      <div class="rpp__batch-actions">
        <el-tooltip content="选择批量部署包" placement="top">
          <ScButton type="primary" plain @click="openBatchFilePicker">
            <IconifyIconOnline icon="ep:folder-opened" />
            选择部署包
          </ScButton>
        </el-tooltip>
        <el-tooltip content="全选或取消全选当前项目" placement="top">
          <ScButton plain @click="toggleSelectAllProjects">
            <IconifyIconOnline icon="ep:select" />
            {{
              selectedProjectCount > 0 &&
              selectedProjectCount === projects.length
                ? "取消全选"
                : "全选项目"
            }}
          </ScButton>
        </el-tooltip>
        <el-tooltip content="清空当前勾选" placement="top">
          <ScButton plain @click="clearSelectedProjects">
            <IconifyIconOnline icon="ep:close" />
            清空勾选
          </ScButton>
        </el-tooltip>
        <el-tooltip
          :content="selectedProjectCount ? '删除已勾选项目' : '请先勾选项目'"
          placement="top"
        >
          <ScButton
            type="danger"
            plain
            :disabled="selectedProjectCount === 0 || batchDeploying"
            @click="deleteSelectedProjects"
          >
            <IconifyIconOnline icon="ep:delete" />
            删除已选
          </ScButton>
        </el-tooltip>
        <el-tooltip
          :content="
            !batchDeployFile
              ? '请先选择部署包'
              : selectedProjectCount === 0
                ? '请先勾选项目'
                : '按全局设置批量升级已选项目'
          "
          placement="top"
        >
          <ScButton
            type="primary"
            :loading="batchDeploying"
            :disabled="!batchDeployFile || selectedProjectCount === 0"
            @click="batchDeploySelectedProjects"
          >
            <IconifyIconOnline icon="ep:upload-filled" />
            批量升级
          </ScButton>
        </el-tooltip>
      </div>
      <div class="rpp__batch-meta">
        <span>已选 {{ selectedProjectCount }} 个项目</span>
        <span>{{ batchDeployFile?.name || "未选择部署包" }}</span>
      </div>
      <div v-if="batchDeployResults.length" class="rpp__batch-results">
        <header class="rpp__batch-results-head">
          <strong>最近一次批量升级</strong>
          <span>
            总计 {{ batchDeployResults.length }}， 成功
            {{ batchDeploySuccessCount }}， 失败 {{ batchDeployFailedCount }}
          </span>
        </header>
        <div class="rpp__batch-results-list thin-scroller">
          <article
            v-for="item in batchDeployResults"
            :key="`${item.projectId}-${item.finishedAt}`"
            class="rpp__batch-result-item"
            :class="item.success ? 'is-success' : 'is-failed'"
          >
            <div class="rpp__batch-result-main">
              <strong>{{ item.projectName }}</strong>
              <p>{{ item.message }}</p>
            </div>
            <div class="rpp__batch-result-side">
              <span>{{ item.success ? "成功" : "失败" }}</span>
              <small>{{ item.costMs }} ms</small>
            </div>
          </article>
        </div>
      </div>
      <input
        ref="batchDeployInputRef"
        class="rpp__hidden-input"
        type="file"
        accept=".jar,.war,.zip,.tar.gz,.tgz"
        @change="onBatchFileChange"
      />
    </section>

    <div v-loading="listLoading" class="rpp__table-shell">
      <ProjectEmptyState
        v-if="!projects.length && !listLoading"
        :title="title"
      />
      <div v-else class="rpp__cards">
        <ProjectCard
          v-for="row in projects"
          :key="row.projectId"
          class="rpp__card-item"
          :project="row"
          :loading-state="loadingMap[row.projectId || '']"
          :selected="isProjectSelected(row)"
          :selectable="batchSelectionMode"
          @backup="doBackup"
          @delete="confirmDeleteProject"
          @deploy="openDeploy"
          @deploy-drop="handleCardDeployDrop"
          @download-main="downloadMainArtifact"
          @edit="openEditDialog"
          @logs="openLogs"
          @restart="doRestart"
          @rollback="openRollback"
          @select-change="onProjectSelectChange"
          @service-panel="openServicePanel"
          @start="doStart"
          @stop="doStop"
        />
      </div>
    </div>

    <ProjectEditorDialog
      v-model="showProjectDialog"
      :editing="Boolean(editingProject?.projectId)"
      :project="projectForm"
      :saving="projectSaving"
      @submit="saveProject"
    />

    <ProjectDeployDialog
      v-model="showDeployDialog"
      :deploy-file="deployFile"
      :deploying="deploying"
      :drag-over="deployDragOver"
      :options="deployOptions"
      :target-directory="deployTargetDirectory"
      :upload-targets="deployUploadTargets"
      :progress="deployProgress"
      :project="deployingProject"
      :status="deployStatus"
      @deploy="doDeploy"
      @file-change="handleDeployFileChange"
      @update:drag-over="deployDragOver = $event"
      @update:target-directory="deployTargetDirectory = $event"
    />

    <ProjectLogsDrawer
      v-model="showLogsDrawer"
      :auto-scroll="autoScroll"
      :content="logsContent"
      :loading="logsLoading"
      :log-type="logsType"
      :project="logsProject"
      @clear="clearLogs"
      @close="stopLogPolling"
      @open="startLogPolling"
      @refresh="fetchLogs"
      @update:auto-scroll="autoScroll = $event"
      @update:log-type="handleLogsTypeChange"
    />

    <ProjectRollbackDialog
      v-model="showRollbackDialog"
      :backups="backups"
      :loading="backupsLoading"
      :project="rollbackProject"
      @rollback="doRollback"
    />

    <ProjectContainerSoftwareDialog
      v-model="containerSoftwareVisible"
      :project="containerSoftwareProject"
    />

    <ScDialog
      v-model="showGlobalSettingsDialog"
      title="全局上传设置"
      width="680px"
      append-to-body
      destroy-on-close
      layout="simple"
    >
      <div class="rpp__settings-grid">
        <label class="rpp__settings-item">
          <span>部署前停止</span>
          <el-switch
            v-model="globalDeployOptions.stopBeforeDeploy"
            @change="persistGlobalDeployOptions"
          />
        </label>
        <label class="rpp__settings-item">
          <span>部署后启动</span>
          <el-switch
            v-model="globalDeployOptions.startAfterDeploy"
            @change="persistGlobalDeployOptions"
          />
        </label>
        <label class="rpp__settings-item">
          <span>部署前备份</span>
          <el-switch
            v-model="globalDeployOptions.backupBefore"
            @change="persistGlobalDeployOptions"
          />
        </label>
        <label class="rpp__settings-item">
          <span>清空目标目录</span>
          <el-switch
            v-model="globalDeployOptions.uploadOptions!.clearBefore"
            @change="persistGlobalDeployOptions"
          />
        </label>
        <label class="rpp__settings-item">
          <span>自动解压</span>
          <el-switch
            v-model="globalDeployOptions.uploadOptions!.autoExtract"
            @change="persistGlobalDeployOptions"
          />
        </label>
        <label class="rpp__settings-item">
          <span>解压后删除包</span>
          <el-switch
            v-model="
              globalDeployOptions.uploadOptions!.deleteArchiveAfterExtract
            "
            @change="persistGlobalDeployOptions"
          />
        </label>
        <label class="rpp__settings-item">
          <span>配置目录核对</span>
          <el-switch
            v-model="globalDeployOptions.configCheckBeforeDeploy"
            @change="persistGlobalDeployOptions"
          />
        </label>
        <label class="rpp__settings-item">
          <span>依赖目录核对</span>
          <el-switch
            v-model="globalDeployOptions.dependencyCheckBeforeDeploy"
            @change="persistGlobalDeployOptions"
          />
        </label>
      </div>
      <template #footer>
        <ScButton @click="showGlobalSettingsDialog = false">关闭</ScButton>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconifyIconOnline } from "@repo/components";
import { syncLocalStorageProxy } from "@repo/utils";
import {
  closeNamedSocketService,
  createNamedSocketService,
  useUserStoreHook,
  type SocketTemplate,
} from "@repo/core";
import type {
  RemoteApi,
  RemoteDeployOptions,
  RemoteProject,
  RemoteProjectBackup,
} from "../api/manage/remote";
import { tryUseOverlayStack } from "../../../../layout/default/src/components/lay-overlay-stack/provider";
import ProjectCard from "./project-panel/ProjectCard.vue";
import ProjectDeployDialog from "./project-panel/ProjectDeployDialog.vue";
import ProjectEditorDialog from "./project-panel/ProjectEditorDialog.vue";
import ProjectEmptyState from "./project-panel/ProjectEmptyState.vue";
import ProjectLogsDrawer from "./project-panel/ProjectLogsDrawer.vue";
import ProjectRollbackDialog from "./project-panel/ProjectRollbackDialog.vue";
import ProjectContainerSoftwareDialog from "../views/project/ProjectContainerSoftwareDialog.vue";
import {
  applyProjectTypeDefaults,
  buildDefaultProject,
  hasRequiredLifecycleScripts,
  hasStartScript,
  isSpringBootProjectType,
  isSpringBootResourceSplitType,
  isStaticProjectType,
  isTomcatProjectType,
  projectTypeLabel,
  validateProjectTypeRequiredFields,
} from "./project-panel/projectPanelShared";

const props = withDefaults(
  defineProps<{
    api: RemoteApi;
    title?: string;
  }>(),
  { title: "项目管理" },
);

const GLOBAL_DEPLOY_OPTIONS_STORAGE_KEY =
  "server-project-global-deploy-options";

const createDefaultDeployOptions = (): RemoteDeployOptions => ({
  stopBeforeDeploy: true,
  startAfterDeploy: true,
  backupBefore: true,
  configCheckBeforeDeploy: false,
  dependencyCheckBeforeDeploy: false,
  uploadOptions: {
    clearBefore: false,
    autoExtract: true,
    deleteArchiveAfterExtract: true,
  },
});

const normalizeDeployOptions = (
  value?: Partial<RemoteDeployOptions> | null,
): RemoteDeployOptions => {
  const defaults = createDefaultDeployOptions();
  const uploadOptions = {
    ...defaults.uploadOptions,
    ...(value?.uploadOptions || {}),
  };
  return {
    ...defaults,
    ...(value || {}),
    uploadOptions,
  };
};

const applyProjectDeployDefaults = (
  project: RemoteProject | null | undefined,
  value?: Partial<RemoteDeployOptions> | null,
): RemoteDeployOptions => {
  const options = normalizeDeployOptions(value);
  if (isStaticProjectType(project?.projectType)) {
    return {
      ...options,
      stopBeforeDeploy: false,
      startAfterDeploy: false,
      uploadOptions: {
        ...options.uploadOptions,
        clearBefore: true,
        autoExtract: true,
      },
    };
  }
  if (isTomcatProjectType(project?.projectType)) {
    return {
      ...options,
      uploadOptions: {
        ...options.uploadOptions,
        autoExtract: false,
        deleteArchiveAfterExtract: false,
      },
    };
  }
  if (isSpringBootResourceSplitType(project?.projectType)) {
    return {
      ...options,
      stopBeforeDeploy: true,
      startAfterDeploy: true,
      configCheckBeforeDeploy: true,
      dependencyCheckBeforeDeploy: true,
      uploadOptions: {
        ...options.uploadOptions,
        clearBefore: false,
        autoExtract: true,
      },
    };
  }
  return options;
};

const globalDeployOptions = ref<RemoteDeployOptions>(
  createDefaultDeployOptions(),
);
const overlayStack = tryUseOverlayStack();
const userStore = useUserStoreHook();
const PROJECT_OVERLAY_SOURCE = "project-remote-panel";
const PROJECT_UPLOAD_SOCKET_NAME = "project-remote-upload-progress";
const FILE_UPLOAD_PROGRESS_TOPIC = "service:file:upload:progress";
let projectUploadSocket: SocketTemplate | null = null;
const activeUploadOverlayIds = reactive(new Set<string>());

const persistGlobalDeployOptions = () => {
  globalDeployOptions.value = normalizeDeployOptions(globalDeployOptions.value);
  syncLocalStorageProxy().setItem(GLOBAL_DEPLOY_OPTIONS_STORAGE_KEY, {
    ...globalDeployOptions.value,
    uploadOptions: {
      ...globalDeployOptions.value.uploadOptions,
    },
  });
};

const loadGlobalDeployOptions = () => {
  const cache =
    syncLocalStorageProxy().getItem<Partial<RemoteDeployOptions>>(
      GLOBAL_DEPLOY_OPTIONS_STORAGE_KEY,
    ) || {};
  globalDeployOptions.value = normalizeDeployOptions(cache);
};

const createOverlayMessage = (
  content: string,
  level: "info" | "success" | "warning" | "error" = "info",
) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  content,
  level,
  timestamp: Date.now(),
});

const buildOverlayId = (action: string, projectId: string) =>
  `${PROJECT_OVERLAY_SOURCE}:${action}:${projectId}`;

const upsertProjectOverlay = ({
  action,
  project,
  title,
  description,
  tone = "info",
  progress = 0,
  latestMessage,
  progressLabel,
  progressSecondary,
  autoClose = false,
}: {
  action: string;
  project: RemoteProject;
  title: string;
  description?: string;
  tone?: "default" | "info" | "success" | "warning" | "error";
  progress?: number | null;
  latestMessage?: string;
  progressLabel?: string;
  progressSecondary?: string;
  autoClose?: boolean;
}) => {
  const projectId = String(project.projectId || "");
  if (!projectId) {
    return "";
  }
  const itemId = buildOverlayId(action, projectId);
  overlayStack?.upsert({
    id: itemId,
    source: PROJECT_OVERLAY_SOURCE,
    title,
    description: description || project.projectName,
    tone,
    progress,
    latestMessage,
    progressLabel,
    progressSecondary,
    icon: action === "deploy" ? "ep:upload-filled" : "ep:loading",
    autoClose,
    autoCloseDelay: 3000,
    closeable: true,
    timestamp: Date.now(),
    createdAt: Date.now(),
    messages: latestMessage ? [createOverlayMessage(latestMessage)] : [],
  });
  return itemId;
};

const updateProjectOverlay = (
  itemId: string,
  patch: Partial<{
    title: string;
    description: string;
    tone: "default" | "info" | "success" | "warning" | "error";
    progress: number | null;
    latestMessage: string;
    progressLabel: string;
    progressSecondary: string;
    autoClose: boolean;
    icon: string;
  }>,
) => {
  const existing = overlayStack?.get(itemId);
  if (!existing) {
    return;
  }
  overlayStack?.upsert({
    ...existing,
    ...patch,
    autoCloseDelay: patch.autoClose ? 3000 : existing.autoCloseDelay,
    timestamp: Date.now(),
    messages: patch.latestMessage
      ? [
          ...(existing.messages || []),
          createOverlayMessage(
            patch.latestMessage,
            patch.tone === "success"
              ? "success"
              : patch.tone === "error"
                ? "error"
                : patch.tone === "warning"
                  ? "warning"
                  : "info",
          ),
        ].slice(-6)
      : existing.messages,
  });
};

const finishProjectOverlay = (
  itemId: string,
  message: string,
  tone: "success" | "warning" | "error" = "success",
) => {
  updateProjectOverlay(itemId, {
    tone,
    progress: tone === "error" ? 100 : 100,
    latestMessage: message,
    autoClose: tone !== "error",
    icon:
      tone === "success"
        ? "ep:success-filled"
        : tone === "warning"
          ? "ep:warning-filled"
          : "ep:circle-close-filled",
  });
};

const ensureProjectUploadSocket = () => {
  if (projectUploadSocket) {
    return projectUploadSocket;
  }
  projectUploadSocket = createNamedSocketService(PROJECT_UPLOAD_SOCKET_NAME);
  const handler = (payload: unknown) => {
    const data = payload as Record<string, any>;
    const progress = Number(data.progress ?? 0);
    const status = String(data.status || "uploading");
    activeUploadOverlayIds.forEach((overlayId) => {
      updateProjectOverlay(overlayId, {
        progress: Number.isFinite(progress) ? progress : 0,
        progressLabel:
          status === "completed"
            ? "上传完成"
            : status === "merging"
              ? "文件合并中"
              : "文件上传中",
        progressSecondary:
          typeof data.currentChunk === "number" && typeof data.totalChunks === "number"
            ? `${data.currentChunk}/${data.totalChunks}`
            : "",
        latestMessage:
          status === "completed"
            ? `上传完成：${data.fileName || "部署包"}`
            : status === "error"
              ? data.message || "上传失败"
              : `进度 ${Number.isFinite(progress) ? progress : 0}%`,
        tone: status === "error" ? "error" : "info",
      });
      if (status === "completed" || status === "error") {
        activeUploadOverlayIds.delete(overlayId);
      }
    });
  };
  const userId = String(userStore.sysUserId || "0");
  projectUploadSocket.on(`${FILE_UPLOAD_PROGRESS_TOPIC}@${userId}`, handler);
  if (userId !== "0") {
    projectUploadSocket.on(`${FILE_UPLOAD_PROGRESS_TOPIC}@0`, handler);
  }
  projectUploadSocket.connect();
  return projectUploadSocket;
};

const projects = ref<RemoteProject[]>([]);
const listLoading = ref(false);
const loadingMap = reactive<Record<string, Record<string, boolean>>>({});
const runtimeStatusOverrides = reactive<
  Record<
    string,
    {
      runtimeStatus: NonNullable<RemoteProject["runtimeStatus"]>;
      message: string;
      timestamp: number;
    }
  >
>({});
const RUNTIME_OVERRIDE_TTL_MS = 3 * 60 * 1000;
type ProjectOperationLog = {
  timestamp: string;
  action: string;
  message: string;
  projectId: string;
  projectName: string;
};
const operationLogsMap = reactive<Record<string, ProjectOperationLog[]>>({});
const selectedProjectIds = ref<string[]>([]);
const selectedProjectCount = computed(() => selectedProjectIds.value.length);
const batchDeployFile = ref<File | null>(null);
const batchDeployInputRef = ref<HTMLInputElement | null>(null);
const batchDeploying = ref(false);
const batchSelectionMode = ref(false);
const showGlobalSettingsDialog = ref(false);
type BatchDeployResultItem = {
  projectId: string;
  projectName: string;
  success: boolean;
  message: string;
  costMs: number;
  finishedAt: number;
};
const batchDeployResults = ref<BatchDeployResultItem[]>([]);
const batchDeploySuccessCount = computed(
  () => batchDeployResults.value.filter((item) => item.success).length,
);
const batchDeployFailedCount = computed(
  () => batchDeployResults.value.length - batchDeploySuccessCount.value,
);
const containerSoftwareVisible = ref(false);
const containerSoftwareProject = ref<{ projectId?: number; projectName?: string } | null>(null);

const setLoading = (id: string, key: string, value: boolean) => {
  if (!loadingMap[id]) {
    loadingMap[id] = {};
  }
  loadingMap[id][key] = value;
};

const updateProjectRuntimeState = (
  projectId: string,
  runtimeStatus: RemoteProject["runtimeStatus"],
  message: string,
) => {
  if (runtimeStatus) {
    runtimeStatusOverrides[String(projectId)] = {
      runtimeStatus: runtimeStatus as NonNullable<RemoteProject["runtimeStatus"]>,
      message,
      timestamp: Date.now(),
    };
  }
  const target = projects.value.find(
    (item) => String(item.projectId || "") === String(projectId || ""),
  );
  if (!target) {
    return;
  }
  target.runtimeStatus = runtimeStatus;
  target.lastOperationMessage = message;
  target.lastOperationTime = new Date().toISOString();
};

const loadProjects = async () => {
  listLoading.value = true;
  try {
    const res = await props.api.listProjects();
    const now = Date.now();
    const rows = (res.data || []).map((item) => {
      const id = String(item.projectId || "");
      const override = runtimeStatusOverrides[id];
      if (!override) {
        return item;
      }
      if (now - override.timestamp > RUNTIME_OVERRIDE_TTL_MS) {
        delete runtimeStatusOverrides[id];
        return item;
      }
      return {
        ...item,
        runtimeStatus: override.runtimeStatus,
        lastOperationMessage:
          override.message || item.lastOperationMessage || "",
      };
    });
    projects.value = rows;
    const idSet = new Set(
      projects.value
        .map((item) => String(item.projectId || ""))
        .filter(Boolean),
    );
    selectedProjectIds.value = selectedProjectIds.value.filter((id) =>
      idSet.has(id),
    );
  } catch (err: any) {
    ElMessage.error(err.message || "加载项目列表失败");
  } finally {
    listLoading.value = false;
  }
};

const appendOperationLog = (
  project: Pick<RemoteProject, "projectId" | "projectName"> | null | undefined,
  action: string,
  message: string,
) => {
  const projectId = String(project?.projectId || "").trim();
  if (!projectId) {
    return;
  }
  if (!operationLogsMap[projectId]) {
    operationLogsMap[projectId] = [];
  }
  operationLogsMap[projectId].unshift({
    timestamp: new Date().toLocaleString(),
    action,
    message,
    projectId,
    projectName: String(project?.projectName || "未命名项目"),
  });
};

const formatOperationLogs = (projectId: string) => {
  const logs = operationLogsMap[projectId] || [];
  if (!logs.length) {
    return "暂无操作日志...";
  }
  return logs
    .map(
      (item) =>
        `[${item.timestamp}] [${item.action}] ${item.projectName}(${item.projectId}) ${item.message}`,
    )
    .join("\n");
};

const showProjectDialog = ref(false);
const editingProject = ref<RemoteProject | null>(null);
const projectSaving = ref(false);
const projectForm = ref<RemoteProject>(buildDefaultProject());
const openAddDialog = () => {
  editingProject.value = null;
  projectForm.value = buildDefaultProject();
  showProjectDialog.value = true;
};

const openEditDialog = (project: RemoteProject) => {
  editingProject.value = project;
  projectForm.value = {
    ...buildDefaultProject(),
    ...project,
  };
  showProjectDialog.value = true;
};

const resolveSysProjectId = () => {
  const basePath = String(props.api?.basePath || "");
  const matched = basePath.match(/\/v2\/project\/(\d+)\/remote/i);
  if (!matched) {
    return null;
  }
  const id = Number(matched[1] || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const openContainerSoftwareDialog = () => {
  const sysProjectId = resolveSysProjectId();
  if (!sysProjectId) {
    ElMessage.warning("未解析到当前项目ID，暂时无法打开容器管理");
    return;
  }
  containerSoftwareProject.value = {
    projectId: sysProjectId,
    projectName: props.title || "容器管理",
  };
  containerSoftwareVisible.value = true;
};

const openServicePanel = (project: RemoteProject) => {
  const sysProjectId = resolveSysProjectId();
  if (!sysProjectId) {
    ElMessage.warning("未解析到当前项目ID，暂时无法打开容器管理");
    return;
  }
  containerSoftwareProject.value = {
    projectId: sysProjectId,
    projectName: project.projectName || "容器管理",
  };
  containerSoftwareVisible.value = true;
};

const saveProject = async () => {
  applyProjectTypeDefaults(projectForm.value);
  const requiredMisses = validateProjectTypeRequiredFields(projectForm.value);
  if (requiredMisses.length) {
    ElMessage.warning(
      `${projectTypeLabel(projectForm.value.projectType)} 缺少必填：${requiredMisses.join("、")}`,
    );
    return;
  }
  if (!hasRequiredLifecycleScripts(projectForm.value)) {
    ElMessage.warning("自定义项目请至少配置启动脚本后再保存");
    return;
  }
  projectSaving.value = true;
  const submitProject = {
    ...projectForm.value,
  };
  try {
    if (editingProject.value?.projectId) {
      await props.api.updateProject(
        editingProject.value.projectId,
        submitProject,
      );
      ElMessage.success("更新成功");
      appendOperationLog(editingProject.value, "更新项目", "更新成功");
    } else {
      const created = await props.api.createProject(submitProject);
      ElMessage.success("创建成功");
      appendOperationLog(
        created.data || submitProject,
        "新增项目",
        "创建成功",
      );
    }
    showProjectDialog.value = false;
    await loadProjects();
  } catch (err: any) {
    ElMessage.error(err.message || "保存失败");
  } finally {
    projectSaving.value = false;
  }
};

const confirmDeleteProject = async (project: RemoteProject) => {
  try {
    await ElMessageBox.confirm(
      `确定删除项目 "${project.projectName}" 吗？`,
      "删除确认",
      {
        type: "warning",
      },
    );
    await props.api.deleteProject(project.projectId!);
    ElMessage.success("删除成功");
    appendOperationLog(project, "删除项目", "删除成功");
    await loadProjects();
  } catch {
    // ignore
  }
};

const runProjectActionWithOverlay = async <T>({
  action,
  project,
  loadingKey,
  title,
  initialMessage,
  execute,
  successMessage,
  appendLogLabel,
  runtimeStatus,
}: {
  action: string;
  project: RemoteProject;
  loadingKey: string;
  title: string;
  initialMessage: string;
  execute: () => Promise<T>;
  successMessage: (result: T) => string;
  appendLogLabel: string;
  runtimeStatus?: (result: T) => RemoteProject["runtimeStatus"] | undefined;
}) => {
  const id = String(project.projectId || "");
  const overlayId = upsertProjectOverlay({
    action,
    project,
    title,
    latestMessage: initialMessage,
    progress: 20,
    progressLabel: "执行中",
  });
  setLoading(id, loadingKey, true);
  try {
    const result = await execute();
    const message = successMessage(result);
    finishProjectOverlay(overlayId, message, "success");
    ElMessage.success(message);
    appendOperationLog(project, appendLogLabel, message);
    const nextRuntimeStatus = runtimeStatus?.(result);
    if (nextRuntimeStatus) {
      updateProjectRuntimeState(id, nextRuntimeStatus, message);
    }
    return result;
  } catch (err: any) {
    const message = err?.message || `${title}失败`;
    finishProjectOverlay(overlayId, message, "error");
    ElMessage.error(message);
    throw err;
  } finally {
    setLoading(id, loadingKey, false);
  }
};

const doStart = async (project: RemoteProject) => {
  if (!hasStartScript(project)) {
    ElMessage.warning("缺少启动脚本，无法启动");
    return;
  }
  try {
    const res = await runProjectActionWithOverlay({
      action: "start",
      project,
      loadingKey: "start",
      title: "启动项目",
      initialMessage: "正在发送启动命令…",
      execute: () => props.api.startProject(String(project.projectId || "")),
      successMessage: (result) => result.data?.message || "启动成功",
      appendLogLabel: "启动",
      runtimeStatus: (result) =>
        (result.data?.runtimeStatus as RemoteProject["runtimeStatus"]) ||
        "running",
    });
    // 后端状态可能有延迟，异步刷新避免成功提示后按钮状态抖动。
    setTimeout(() => {
      void loadProjects();
    }, 1500);
  } catch (err: any) {
    // handled in overlay helper
  }
};

const doStop = async (project: RemoteProject) => {
  try {
    await runProjectActionWithOverlay({
      action: "stop",
      project,
      loadingKey: "stop",
      title: "停止项目",
      initialMessage: "正在停止服务…",
      execute: () => props.api.stopProject(String(project.projectId || "")),
      successMessage: (result) => result.data?.message || "停止成功",
      appendLogLabel: "停止",
      runtimeStatus: (result) =>
        (result.data?.runtimeStatus as RemoteProject["runtimeStatus"]) ||
        "stopped",
    });
    setTimeout(() => {
      void loadProjects();
    }, 1500);
  } catch (err: any) {
    // handled in overlay helper
  }
};

const doRestart = async (project: RemoteProject) => {
  if (!hasStartScript(project)) {
    ElMessage.warning("缺少启动脚本，无法重启");
    return;
  }
  try {
    await runProjectActionWithOverlay({
      action: "restart",
      project,
      loadingKey: "restart",
      title: "重启项目",
      initialMessage: "正在重启服务…",
      execute: () => props.api.restartProject(String(project.projectId || "")),
      successMessage: (result) => result.data?.message || "重启成功",
      appendLogLabel: "重启",
      runtimeStatus: (result) =>
        (result.data?.runtimeStatus as RemoteProject["runtimeStatus"]) ||
        "running",
    });
    setTimeout(() => {
      void loadProjects();
    }, 1500);
  } catch (err: any) {
    // handled in overlay helper
  }
};

const doBackup = async (project: RemoteProject) => {
  try {
    await runProjectActionWithOverlay({
      action: "backup",
      project,
      loadingKey: "backup",
      title: "创建备份",
      initialMessage: "正在生成备份…",
      execute: () => props.api.backupProject(String(project.projectId || "")),
      successMessage: (result) => result.data?.message || "备份成功",
      appendLogLabel: "备份",
    });
  } catch (err: any) {
    // handled in overlay helper
  }
};

const resolveMainArtifactPath = (project: RemoteProject) => {
  const artifact = String(project.mainArtifact || "").trim();
  if (!artifact) {
    return "";
  }
  if (/^(\/|[a-zA-Z]:[\\/])/.test(artifact)) {
    return artifact;
  }
  const root = String(project.rootDirectory || "").trim();
  if (!root) {
    return artifact;
  }
  const normalizedRoot = root.replace(/[\\/]+$/, "");
  const normalizedArtifact = artifact.replace(/^[\\/]+/, "");
  const separator = normalizedRoot.includes("\\") ? "\\" : "/";
  return `${normalizedRoot}${separator}${normalizedArtifact}`;
};

const downloadMainArtifact = (project: RemoteProject) => {
  if (!isSpringBootProjectType(project.projectType)) {
    ElMessage.warning("仅 SpringBoot 系列项目支持主体文件下载");
    return;
  }
  const artifact = String(project.mainArtifact || "").trim();
  if (!/\.jar$/i.test(artifact)) {
    ElMessage.warning("当前项目未配置可下载的 jar 主包");
    return;
  }
  const artifactPath = resolveMainArtifactPath(project);
  if (!artifactPath) {
    ElMessage.warning("未配置主包路径");
    return;
  }
  const url = props.api.downloadFile(artifactPath);
  window.open(url, "_blank", "noopener");
  appendOperationLog(project, "下载主包", `已触发下载：${artifact}`);
};

const showRollbackDialog = ref(false);
const rollbackProject = ref<RemoteProject | null>(null);
const backups = ref<RemoteProjectBackup[]>([]);
const backupsLoading = ref(false);

const openRollback = async (project: RemoteProject) => {
  rollbackProject.value = project;
  showRollbackDialog.value = true;
  backupsLoading.value = true;
  try {
    const res = await props.api.listProjectBackups(project.projectId!);
    backups.value = res.data || [];
  } catch (err: any) {
    ElMessage.error(err.message || "加载备份失败");
  } finally {
    backupsLoading.value = false;
  }
};

const doRollback = async (backup: RemoteProjectBackup) => {
  try {
    await ElMessageBox.confirm(
      `确定回滚到 ${backup.backupTime} 的版本吗？`,
      "回滚确认",
      {
        type: "warning",
      },
    );
    const project = rollbackProject.value!;
    await runProjectActionWithOverlay({
      action: "rollback",
      project,
      loadingKey: "rollback",
      title: "回滚项目",
      initialMessage: `正在回滚到 ${backup.backupTime} …`,
      execute: () =>
        props.api.rollbackProject(
          String(project.projectId || ""),
          String(backup.backupId || ""),
        ),
      successMessage: (result) => result.data?.message || "回滚成功",
      appendLogLabel: "回滚",
    });
    showRollbackDialog.value = false;
    await loadProjects();
  } catch {
    // ignore
  }
};

const showLogsDrawer = ref(false);
const logsProject = ref<RemoteProject | null>(null);
const logsContent = ref("");
const logsType = ref<"runtime" | "deploy" | "operation">("runtime");
const autoScroll = ref(true);
const logsLoading = ref(false);
let logsRequestSerial = 0;
let logTimer: ReturnType<typeof setInterval> | null = null;

const openLogs = (project: RemoteProject) => {
  logsRequestSerial += 1;
  logsLoading.value = false;
  logsProject.value = project;
  logsType.value = "runtime";
  logsContent.value = "";
  showLogsDrawer.value = true;
};

const fetchLogs = async (options?: { showLoading?: boolean }) => {
  if (!logsProject.value?.projectId) {
    return;
  }
  const shouldShowLoading = options?.showLoading ?? !logsContent.value;
  const currentSerial = ++logsRequestSerial;
  const projectId = logsProject.value.projectId;
  const currentType = logsType.value;
  if (shouldShowLoading) {
    logsLoading.value = true;
  }
  if (logsType.value === "operation") {
    logsContent.value = formatOperationLogs(projectId);
    logsLoading.value = false;
    return;
  }
  try {
    const res =
      currentType === "deploy"
        ? await props.api.getProjectDeployLogs(projectId, 300)
        : await props.api.getProjectLogs(projectId, 200);
    if (currentSerial !== logsRequestSerial) {
      return;
    }
    if (res.data !== undefined) {
      logsContent.value = res.data;
    }
  } catch {
    // ignore polling errors
  } finally {
    if (shouldShowLoading && currentSerial === logsRequestSerial) {
      logsLoading.value = false;
    }
  }
};

const startLogPolling = () => {
  stopLogPolling();
  fetchLogs({ showLoading: true });
  logTimer = setInterval(() => {
    void fetchLogs({ showLoading: false });
  }, 3000);
};

const stopLogPolling = () => {
  if (logTimer) {
    clearInterval(logTimer);
    logTimer = null;
  }
  logsLoading.value = false;
};

const clearLogs = () => {
  if (logsType.value === "operation" && logsProject.value?.projectId) {
    operationLogsMap[logsProject.value.projectId] = [];
    logsContent.value = "暂无操作日志...";
    return;
  }
  logsContent.value = "";
};

const handleLogsTypeChange = (value: "runtime" | "deploy" | "operation") => {
  logsRequestSerial += 1;
  logsType.value = value;
  void fetchLogs({ showLoading: true });
};

const isProjectSelected = (project: RemoteProject) =>
  selectedProjectIds.value.includes(String(project.projectId || ""));

const onProjectSelectChange = (project: RemoteProject, selected: boolean) => {
  const projectId = String(project.projectId || "");
  if (!projectId) {
    return;
  }
  const set = new Set(selectedProjectIds.value);
  if (selected) {
    set.add(projectId);
  } else {
    set.delete(projectId);
  }
  selectedProjectIds.value = [...set];
};

const clearSelectedProjects = () => {
  selectedProjectIds.value = [];
};

const deleteSelectedProjects = async () => {
  const selectedSet = new Set(selectedProjectIds.value);
  const targets = projects.value.filter((item) =>
    selectedSet.has(String(item.projectId || "")),
  );
  if (!targets.length) {
    ElMessage.warning("请先勾选项目");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除已勾选的 ${targets.length} 个项目吗？`,
      "批量删除确认",
      { type: "warning" },
    );
  } catch {
    return;
  }
  let success = 0;
  let failed = 0;
  for (const item of targets) {
    try {
      await props.api.deleteProject(String(item.projectId || ""));
      success += 1;
    } catch {
      failed += 1;
    }
  }
  clearSelectedProjects();
  await loadProjects();
  if (failed > 0) {
    ElMessage.warning(`批量删除完成：成功 ${success}，失败 ${failed}`);
    return;
  }
  ElMessage.success(`已删除 ${success} 个项目`);
};

const toggleBatchSelectionMode = () => {
  batchSelectionMode.value = !batchSelectionMode.value;
  if (!batchSelectionMode.value) {
    clearSelectedProjects();
    batchDeployFile.value = null;
  }
};

const toggleSelectAllProjects = () => {
  const allIds = projects.value
    .map((item) => String(item.projectId || ""))
    .filter(Boolean);
  if (selectedProjectIds.value.length === allIds.length && allIds.length > 0) {
    selectedProjectIds.value = [];
    return;
  }
  selectedProjectIds.value = allIds;
};

const openBatchFilePicker = () => {
  batchDeployInputRef.value?.click();
};

const onBatchFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  batchDeployFile.value = input.files?.[0] || null;
  input.value = "";
};

const showDeployDialog = ref(false);
const deployingProject = ref<RemoteProject | null>(null);
const deployFile = ref<File | null>(null);
const deployDragOver = ref(false);
const deployTargetDirectory = ref("");
const deploying = ref(false);
const deployProgress = ref(0);
const deployStatus = ref<"" | "success" | "exception">("");
const deployOptions = ref<RemoteDeployOptions>(createDefaultDeployOptions());
const deployUploadTargets = computed(() => {
  const project = deployingProject.value;
  if (!project || !isSpringBootResourceSplitType(project.projectType)) {
    return [];
  }
  const targets = [
    {
      key: "root",
      label: "根目录",
      directory: String(project.rootDirectory || "").trim(),
    },
    {
      key: "config",
      label: "配置目录",
      directory: String(project.configDirectory || "").trim(),
    },
    {
      key: "lib",
      label: "依赖目录",
      directory: String(project.libDirectory || "").trim(),
    },
    {
      key: "logs",
      label: "日志目录",
      directory: String(project.logDirectory || "").trim(),
    },
  ].filter((item) => item.directory);
  return targets;
});

const isArchiveFileName = (name?: string) => {
  const lower = String(name || "").toLowerCase();
  return (
    lower.endsWith(".zip") ||
    lower.endsWith(".tar.gz") ||
    lower.endsWith(".tgz")
  );
};

const isResourceSplitDirectUpload = (
  project: RemoteProject,
  targetDirectory: string,
) =>
  isSpringBootResourceSplitType(project.projectType) &&
  Boolean(targetDirectory) &&
  targetDirectory !== String(project.rootDirectory || "").trim();

const isTomcatPackage = (name?: string) => {
  const lower = String(name || "").toLowerCase();
  return lower.endsWith(".war") || lower.endsWith(".ear");
};

const openDeploy = (project: RemoteProject) => {
  deployingProject.value = project;
  deployFile.value = null;
  deployProgress.value = 0;
  deployStatus.value = "";
  deployTargetDirectory.value = String(project.rootDirectory || "").trim();
  deployOptions.value = applyProjectDeployDefaults(
    project,
    globalDeployOptions.value,
  );
  showDeployDialog.value = true;
};

const handleDeployFileChange = (file: File | null) => {
  if (
    file &&
    isTomcatProjectType(deployingProject.value?.projectType) &&
    !isTomcatPackage(file.name)
  ) {
    ElMessage.warning("Tomcat 项目仅支持上传 .war / .ear 部署包");
    deployFile.value = null;
    return;
  }
  if (
    file &&
    isStaticProjectType(deployingProject.value?.projectType) &&
    !isArchiveFileName(file.name)
  ) {
    ElMessage.warning("静态站点仅支持上传 zip / tar.gz / tgz 压缩包");
    deployFile.value = null;
    return;
  }
  deployFile.value = file;
};

const uploadProjectAssetToDirectory = async (
  project: RemoteProject,
  file: File,
  targetDirectory: string,
  loadingKey = "deploy",
) => {
  const projectId = String(project.projectId || "");
  if (!projectId || !targetDirectory) {
    return {
      success: false,
      message: "上传目录缺失",
    };
  }
  const overlayId = upsertProjectOverlay({
    action: `${loadingKey}-directory`,
    project,
    title: "目录上传",
    latestMessage: `正在上传到 ${targetDirectory}`,
    progress: 10,
    progressLabel: "上传中",
  });
  activeUploadOverlayIds.add(overlayId);
  ensureProjectUploadSocket();
  setLoading(projectId, loadingKey, true);
  try {
    const res = await props.api.uploadFile(file, {
      directory: targetDirectory,
      clearBefore: isStaticProjectType(project.projectType),
      autoExtract: isArchiveFileName(file.name),
      deleteArchiveAfterExtract: isArchiveFileName(file.name),
    });
    const message = res.data?.message || "上传成功";
    finishProjectOverlay(overlayId, message, "success");
    appendOperationLog(project, "目录上传", `${message} -> ${targetDirectory}`);
    return {
      success: res.data?.success !== false,
      message,
    };
  } catch (error: any) {
    finishProjectOverlay(overlayId, error?.message || "上传失败", "error");
    return {
      success: false,
      message: error?.message || "上传失败",
    };
  } finally {
    activeUploadOverlayIds.delete(overlayId);
    setLoading(projectId, loadingKey, false);
  }
};

const doDeploy = async () => {
  if (!deployFile.value || !deployingProject.value?.projectId) {
    return;
  }
  const currentProject = deployingProject.value;
  if (isStaticProjectType(currentProject.projectType)) {
    deploying.value = true;
    try {
      const result = await uploadProjectAssetToDirectory(
        currentProject,
        deployFile.value,
        deployTargetDirectory.value || String(currentProject.rootDirectory || "").trim(),
      );
      if (result.success) {
        ElMessage.success(result.message);
        showDeployDialog.value = false;
        await loadProjects();
      } else {
        ElMessage.error(result.message);
      }
    } finally {
      deploying.value = false;
    }
    return;
  }
  if (
    isResourceSplitDirectUpload(
      currentProject,
      deployTargetDirectory.value,
    )
  ) {
    deploying.value = true;
    try {
      const result = await uploadProjectAssetToDirectory(
        currentProject,
        deployFile.value,
        deployTargetDirectory.value,
      );
      if (result.success) {
        ElMessage.success(result.message);
        showDeployDialog.value = false;
        await loadProjects();
      } else {
        ElMessage.error(result.message);
      }
    } finally {
      deploying.value = false;
    }
    return;
  }
  const deployPayloadOptions = applyProjectDeployDefaults(
    currentProject,
    deployOptions.value,
  );
  deployPayloadOptions.targetDirectory = deployTargetDirectory.value;
  globalDeployOptions.value = normalizeDeployOptions(deployOptions.value);
  persistGlobalDeployOptions();
  deploying.value = true;
  deployProgress.value = 10;
  deployStatus.value = "";
  const overlayId = upsertProjectOverlay({
    action: "deploy",
    project: currentProject,
    title: "部署升级",
    latestMessage: "正在准备部署包…",
    progress: 8,
    progressLabel: "准备上传",
  });
  activeUploadOverlayIds.add(overlayId);
  ensureProjectUploadSocket();
  try {
    deployProgress.value = 40;
    updateProjectOverlay(overlayId, {
      progress: 28,
      latestMessage: `正在上传 ${deployFile.value.name}`,
      progressLabel: "上传中",
    });
    const res = await props.api.deployProject(
      currentProject.projectId,
      deployFile.value,
      deployPayloadOptions,
    );
    deployProgress.value = 100;
    deployStatus.value = "success";
    const message = res.data?.message || "部署成功";
    finishProjectOverlay(overlayId, message, "success");
    ElMessage.success(message);
    appendOperationLog(currentProject, "升级部署", message);
    setTimeout(async () => {
      showDeployDialog.value = false;
      await loadProjects();
    }, 1200);
  } catch (err: any) {
    deployProgress.value = 100;
    deployStatus.value = "exception";
    finishProjectOverlay(overlayId, err.message || "部署失败", "error");
    ElMessage.error(err.message || "部署失败");
  } finally {
    activeUploadOverlayIds.delete(overlayId);
    deploying.value = false;
  }
};

const deployProjectWithGlobalOptions = async (
  project: RemoteProject,
  file: File,
  loadingKey: string,
) => {
  const projectId = String(project.projectId || "");
  if (!projectId) {
    return {
      success: false,
      message: "项目 ID 缺失",
    };
  }
  setLoading(projectId, loadingKey, true);
  const overlayId = upsertProjectOverlay({
    action: loadingKey,
    project,
    title: "部署升级",
    latestMessage: `正在上传 ${file.name}`,
    progress: 8,
    progressLabel: "上传中",
  });
  activeUploadOverlayIds.add(overlayId);
  ensureProjectUploadSocket();
  try {
    const res = await props.api.deployProject(
      projectId,
      file,
      applyProjectDeployDefaults(project, globalDeployOptions.value),
    );
    finishProjectOverlay(
      overlayId,
      res.data?.message || "部署成功",
      res.data?.success === false ? "warning" : "success",
    );
    return {
      success: res.data?.success !== false,
      message: res.data?.message || "部署成功",
    };
  } catch (error: any) {
    finishProjectOverlay(overlayId, error?.message || "部署失败", "error");
    return {
      success: false,
      message: error?.message || "部署失败",
    };
  } finally {
    activeUploadOverlayIds.delete(overlayId);
    setLoading(projectId, loadingKey, false);
  }
};

const handleCardDeployDrop = async (project: RemoteProject, file: File) => {
  if (isSpringBootResourceSplitType(project.projectType)) {
    openDeploy(project);
    deployFile.value = file;
    return;
  }
  if (isStaticProjectType(project.projectType)) {
    const result = await uploadProjectAssetToDirectory(
      project,
      file,
      String(project.rootDirectory || "").trim(),
      "deploy",
    );
    if (result.success) {
      ElMessage.success(`${project.projectName}：${result.message}`);
      await loadProjects();
    } else {
      ElMessage.error(`${project.projectName}：${result.message}`);
    }
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认使用全局设置将 ${file.name} 部署到「${project.projectName}」？`,
      "卡片拖拽升级",
      { type: "warning" },
    );
  } catch {
    return;
  }
  const result = await deployProjectWithGlobalOptions(project, file, "deploy");
  if (result.success) {
    ElMessage.success(`${project.projectName}：${result.message}`);
  } else {
    ElMessage.error(`${project.projectName}：${result.message}`);
  }
  await loadProjects();
};

const batchDeploySelectedProjects = async () => {
  if (!batchDeployFile.value || selectedProjectIds.value.length === 0) {
    return;
  }
  const selectedSet = new Set(selectedProjectIds.value);
  const targets = projects.value.filter((item) =>
    selectedSet.has(String(item.projectId || "")),
  );
  if (!targets.length) {
    ElMessage.warning("未找到可升级项目，请重新勾选");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认将 ${batchDeployFile.value.name} 批量部署到 ${targets.length} 个项目？`,
      "批量升级确认",
      { type: "warning" },
    );
  } catch {
    return;
  }
  batchDeploying.value = true;
  batchDeployResults.value = [];
  let successCount = 0;
  for (const project of targets) {
    const startedAt = Date.now();
    const result = await deployProjectWithGlobalOptions(
      project,
      batchDeployFile.value,
      "batchDeploy",
    );
    const finishedAt = Date.now();
    batchDeployResults.value.push({
      projectId: String(project.projectId || ""),
      projectName: project.projectName || "未命名项目",
      success: result.success,
      message: result.message,
      costMs: Math.max(finishedAt - startedAt, 0),
      finishedAt,
    });
    if (result.success) {
      successCount += 1;
      continue;
    }
  }
  batchDeploying.value = false;
  await loadProjects();
  if (batchDeployFailedCount.value > 0) {
    ElMessage.warning(
      `批量升级完成，成功 ${successCount}/${targets.length}，失败 ${batchDeployFailedCount.value}`,
    );
    return;
  }
  ElMessage.success(`批量升级完成，成功 ${successCount}/${targets.length}`);
};

loadGlobalDeployOptions();
deployOptions.value = normalizeDeployOptions(globalDeployOptions.value);
loadProjects();

onMounted(() => {
  overlayStack?.configure({
    width: 420,
    maxVisible: 6,
  });
});

onUnmounted(() => {
  stopLogPolling();
  activeUploadOverlayIds.clear();
  if (projectUploadSocket) {
    closeNamedSocketService(PROJECT_UPLOAD_SOCKET_NAME);
    projectUploadSocket = null;
  }
  overlayStack?.removeBySource(PROJECT_OVERLAY_SOURCE);
});
</script>

<style scoped lang="scss">
.rpp {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 18px;
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.08),
      transparent 26%
    ),
    radial-gradient(
      circle at top right,
      rgba(14, 165, 233, 0.08),
      transparent 22%
    ),
    linear-gradient(
      180deg,
      rgba(248, 250, 252, 0.98),
      rgba(241, 245, 249, 0.94)
    );
}

.rpp__toolbar {
  position: sticky;
  top: 12px;
  z-index: 20;
  display: grid;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(147, 197, 253, 0.35);
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.12),
      transparent 28%
    ),
    linear-gradient(
      140deg,
      rgba(255, 255, 255, 0.92),
      rgba(241, 245, 249, 0.86)
    );
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.rpp__toolbar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 17px;
    color: #0f172a;
  }

  p {
    margin: 6px 0 0;
    font-size: 12px;
    color: #64748b;
  }
}

.rpp__toolbar-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 700;
}

.rpp__toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.rpp__toolbar-icon-btn {
  width: 36px;
  min-width: 36px;
  padding: 0;
  justify-content: center;
}


.rpp__batch-panel {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(147, 197, 253, 0.42);
  background: rgba(255, 255, 255, 0.72);
}

.rpp__batch-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  strong {
    font-size: 14px;
    color: #0f172a;
  }

  span {
    font-size: 12px;
    color: #475569;
  }
}

.rpp__batch-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.rpp__batch-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(59, 130, 246, 0.24);
    background: rgba(239, 246, 255, 0.84);
    color: #1e3a8a;
    font-size: 12px;
    font-weight: 600;
  }
}

.rpp__batch-results {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(147, 197, 253, 0.5);
  background: rgba(255, 255, 255, 0.78);
}

.rpp__batch-results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  strong {
    color: #0f172a;
    font-size: 14px;
  }

  span {
    color: #1e3a8a;
    font-size: 12px;
    font-weight: 600;
  }
}

.rpp__batch-results-list {
  display: grid;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.rpp__batch-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(248, 250, 252, 0.92);

  &.is-success {
    border-color: rgba(34, 197, 94, 0.3);
    background: rgba(240, 253, 244, 0.9);
  }

  &.is-failed {
    border-color: rgba(248, 113, 113, 0.32);
    background: rgba(254, 242, 242, 0.94);
  }
}

.rpp__batch-result-main {
  min-width: 0;

  strong {
    color: #0f172a;
    font-size: 13px;
  }

  p {
    margin: 4px 0 0;
    color: #475569;
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
  }
}

.rpp__batch-result-side {
  display: grid;
  justify-items: end;
  gap: 2px;
  flex-shrink: 0;

  span {
    font-size: 12px;
    font-weight: 700;
    color: #1e3a8a;
  }

  small {
    color: #64748b;
    font-size: 11px;
  }
}

.rpp__hidden-input {
  display: none;
}

.rpp__settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.rpp__settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(191, 219, 254, 0.65);
  background: rgba(248, 250, 252, 0.9);
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 600;
}

.rpp__table-shell {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 4px 8px 0;
}

.rpp__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  align-content: start;
}

.rpp__card-item {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  min-width: 0;
}

@media (max-width: 860px) {
  .rpp {
    padding: 14px;
  }

  .rpp__toolbar-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .rpp__settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
