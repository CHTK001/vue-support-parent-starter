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
            <ScButton type="primary" plain @click="openAddDialog">
              <IconifyIconOnline icon="ep:plus" />
              新增项目
            </ScButton>
          </el-tooltip>
          <el-tooltip content="刷新项目列表" placement="top">
            <ScButton
              plain
              :loading="listLoading"
              @click="() => void loadProjects()"
            >
              <IconifyIconOnline icon="ep:refresh" />
              刷新
            </ScButton>
          </el-tooltip>
          <el-tooltip content="全局上传设置" placement="top">
            <ScButton plain @click="showGlobalSettingsDialog = true">
              <IconifyIconOnline icon="ep:setting" />
              设置
            </ScButton>
          </el-tooltip>
          <el-tooltip
            :content="
              batchSelectionMode ? '退出批量上传模式' : '进入批量上传模式'
            "
            placement="top"
          >
            <ScButton
              type="primary"
              :plain="!batchSelectionMode"
              @click="toggleBatchSelectionMode"
            >
              <IconifyIconOnline icon="ep:upload-filled" />
              上传
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
      :progress="deployProgress"
      :project="deployingProject"
      :status="deployStatus"
      @deploy="doDeploy"
      @file-change="handleDeployFileChange"
      @update:drag-over="deployDragOver = $event"
    />

    <ProjectLogsDrawer
      v-model="showLogsDrawer"
      :auto-scroll="autoScroll"
      :content="logsContent"
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
import { computed, onUnmounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconifyIconOnline } from "@repo/components";
import { syncLocalStorageProxy } from "@repo/utils";
import type {
  RemoteApi,
  RemoteDeployOptions,
  RemoteProject,
  RemoteProjectBackup,
} from "../api/manage/remote";
import ProjectCard from "./project-panel/ProjectCard.vue";
import ProjectDeployDialog from "./project-panel/ProjectDeployDialog.vue";
import ProjectEditorDialog from "./project-panel/ProjectEditorDialog.vue";
import ProjectEmptyState from "./project-panel/ProjectEmptyState.vue";
import ProjectLogsDrawer from "./project-panel/ProjectLogsDrawer.vue";
import ProjectRollbackDialog from "./project-panel/ProjectRollbackDialog.vue";
import {
  applyProjectTypeDefaults,
  buildDefaultProject,
  hasRequiredLifecycleScripts,
  hasStartScript,
  isSpringBootProjectType,
  isSpringBootResourceSplitType,
  isStaticProjectType,
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
      uploadOptions: {
        ...options.uploadOptions,
        clearBefore: true,
        autoExtract: true,
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
  try {
    if (editingProject.value?.projectId) {
      await props.api.updateProject(
        editingProject.value.projectId,
        projectForm.value,
      );
      ElMessage.success("更新成功");
      appendOperationLog(editingProject.value, "更新项目", "更新成功");
    } else {
      const created = await props.api.createProject(projectForm.value);
      ElMessage.success("创建成功");
      appendOperationLog(
        created.data || projectForm.value,
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

const doStart = async (project: RemoteProject) => {
  if (!hasStartScript(project)) {
    ElMessage.warning("缺少启动脚本，无法启动");
    return;
  }
  const id = project.projectId!;
  setLoading(id, "start", true);
  try {
    const res = await props.api.startProject(id);
    const message = res.data?.message || "启动成功";
    ElMessage.success(message);
    appendOperationLog(project, "启动", message);
    updateProjectRuntimeState(
      id,
      (res.data?.runtimeStatus as RemoteProject["runtimeStatus"]) || "running",
      message,
    );
    // 后端状态可能有延迟，异步刷新避免成功提示后按钮状态抖动。
    setTimeout(() => {
      void loadProjects();
    }, 1500);
  } catch (err: any) {
    ElMessage.error(err.message || "启动失败");
  } finally {
    setLoading(id, "start", false);
  }
};

const doStop = async (project: RemoteProject) => {
  const id = project.projectId!;
  setLoading(id, "stop", true);
  try {
    const res = await props.api.stopProject(id);
    const message = res.data?.message || "停止成功";
    ElMessage.success(message);
    appendOperationLog(project, "停止", message);
    updateProjectRuntimeState(
      id,
      (res.data?.runtimeStatus as RemoteProject["runtimeStatus"]) || "stopped",
      message,
    );
    setTimeout(() => {
      void loadProjects();
    }, 1500);
  } catch (err: any) {
    ElMessage.error(err.message || "停止失败");
  } finally {
    setLoading(id, "stop", false);
  }
};

const doRestart = async (project: RemoteProject) => {
  if (!hasStartScript(project)) {
    ElMessage.warning("缺少启动脚本，无法重启");
    return;
  }
  const id = project.projectId!;
  setLoading(id, "restart", true);
  try {
    const res = await props.api.restartProject(id);
    const message = res.data?.message || "重启成功";
    ElMessage.success(message);
    appendOperationLog(project, "重启", message);
    updateProjectRuntimeState(
      id,
      (res.data?.runtimeStatus as RemoteProject["runtimeStatus"]) || "running",
      message,
    );
    setTimeout(() => {
      void loadProjects();
    }, 1500);
  } catch (err: any) {
    ElMessage.error(err.message || "重启失败");
  } finally {
    setLoading(id, "restart", false);
  }
};

const doBackup = async (project: RemoteProject) => {
  try {
    const res = await props.api.backupProject(project.projectId!);
    ElMessage.success(res.data?.message || "备份成功");
    appendOperationLog(project, "备份", res.data?.message || "备份成功");
  } catch (err: any) {
    ElMessage.error(err.message || "备份失败");
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
    const res = await props.api.rollbackProject(
      rollbackProject.value!.projectId!,
      backup.backupId!,
    );
    ElMessage.success(res.data?.message || "回滚成功");
    appendOperationLog(
      rollbackProject.value,
      "回滚",
      res.data?.message || "回滚成功",
    );
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
let logTimer: ReturnType<typeof setInterval> | null = null;

const openLogs = (project: RemoteProject) => {
  logsProject.value = project;
  logsType.value = "runtime";
  logsContent.value = "";
  showLogsDrawer.value = true;
};

const fetchLogs = async () => {
  if (!logsProject.value?.projectId) {
    return;
  }
  if (logsType.value === "operation") {
    logsContent.value = formatOperationLogs(logsProject.value.projectId);
    return;
  }
  try {
    const res =
      logsType.value === "deploy"
        ? await props.api.getProjectDeployLogs(logsProject.value.projectId, 300)
        : await props.api.getProjectLogs(logsProject.value.projectId, 200);
    if (res.data) {
      logsContent.value = res.data;
    }
  } catch {
    // ignore polling errors
  }
};

const startLogPolling = () => {
  fetchLogs();
  logTimer = setInterval(fetchLogs, 3000);
};

const stopLogPolling = () => {
  if (logTimer) {
    clearInterval(logTimer);
    logTimer = null;
  }
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
  logsType.value = value;
  void fetchLogs();
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
const deploying = ref(false);
const deployProgress = ref(0);
const deployStatus = ref<"" | "success" | "exception">("");
const deployOptions = ref<RemoteDeployOptions>(createDefaultDeployOptions());

const openDeploy = (project: RemoteProject) => {
  deployingProject.value = project;
  deployFile.value = null;
  deployProgress.value = 0;
  deployStatus.value = "";
  deployOptions.value = applyProjectDeployDefaults(
    project,
    globalDeployOptions.value,
  );
  showDeployDialog.value = true;
};

const handleDeployFileChange = (file: File | null) => {
  deployFile.value = file;
};

const doDeploy = async () => {
  if (!deployFile.value || !deployingProject.value?.projectId) {
    return;
  }
  const currentProject = deployingProject.value;
  const deployPayloadOptions = applyProjectDeployDefaults(
    currentProject,
    deployOptions.value,
  );
  globalDeployOptions.value = normalizeDeployOptions(deployOptions.value);
  persistGlobalDeployOptions();
  deploying.value = true;
  deployProgress.value = 10;
  deployStatus.value = "";
  try {
    deployProgress.value = 40;
    const res = await props.api.deployProject(
      currentProject.projectId,
      deployFile.value,
      deployPayloadOptions,
    );
    deployProgress.value = 100;
    deployStatus.value = "success";
    ElMessage.success(res.data?.message || "部署成功");
    appendOperationLog(
      currentProject,
      "升级部署",
      res.data?.message || "部署成功",
    );
    setTimeout(async () => {
      showDeployDialog.value = false;
      await loadProjects();
    }, 1200);
  } catch (err: any) {
    deployProgress.value = 100;
    deployStatus.value = "exception";
    ElMessage.error(err.message || "部署失败");
  } finally {
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
  try {
    const res = await props.api.deployProject(
      projectId,
      file,
      applyProjectDeployDefaults(project, globalDeployOptions.value),
    );
    return {
      success: res.data?.success !== false,
      message: res.data?.message || "部署成功",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "部署失败",
    };
  } finally {
    setLoading(projectId, loadingKey, false);
  }
};

const handleCardDeployDrop = async (project: RemoteProject, file: File) => {
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

onUnmounted(() => {
  stopLogPolling();
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  align-content: start;
}

.rpp__card-item {
  min-width: 0;
}

@media (max-width: 1300px) {
  .rpp__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1000px) {
  .rpp__cards {
    grid-template-columns: 1fr;
  }
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

  .rpp__cards {
    grid-template-columns: 1fr;
  }
}
</style>
