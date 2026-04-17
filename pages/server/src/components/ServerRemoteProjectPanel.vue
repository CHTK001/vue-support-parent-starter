<template>
  <div class="rpp">
    <!-- 顶部工具栏 -->
    <div class="rpp__toolbar">
      <div>
        <p class="rpp__eyebrow">Project Manager</p>
        <h3 class="rpp__title">{{ title }}</h3>
      </div>
      <ScButton type="primary" @click="openAddDialog">
        <IconifyIconOnline icon="ep:plus" /> 添加项目
      </ScButton>
    </div>

    <!-- 项目卡片列表 -->
    <div v-loading="listLoading" class="rpp__grid" @contextmenu.prevent="handleContextMenu">
      <div
        v-for="project in projects"
        :key="project.projectId"
        class="rpp__card"
      >
        <!-- 卡片头部 -->
        <div class="rpp__card-header">
          <div class="rpp__card-title-row">
            <span class="rpp__status-dot" :class="`is-${project.runtimeStatus || 'unknown'}`" />
            <h4 class="rpp__card-name">{{ project.projectName }}</h4>
          </div>
          <el-tag size="small" effect="plain" round class="rpp__type-tag">
            {{ projectTypeLabel(project.projectType) }}
          </el-tag>
        </div>

        <!-- 卡片信息 -->
        <div class="rpp__card-body">
          <div class="rpp__card-info">
            <span class="rpp__info-label">状态</span>
            <span class="rpp__info-value" :class="`is-${project.runtimeStatus || 'unknown'}`">
              {{ statusLabel(project.runtimeStatus) }}
            </span>
          </div>
          <div class="rpp__card-info">
            <span class="rpp__info-label">根目录</span>
            <span class="rpp__info-value rpp__info-path">{{ project.rootDirectory }}</span>
          </div>
          <div v-if="project.pid" class="rpp__card-info">
            <span class="rpp__info-label">PID</span>
            <span class="rpp__info-value">{{ project.pid }}</span>
          </div>
          <div v-if="project.lastOperationMessage" class="rpp__card-info">
            <span class="rpp__info-label">最后操作</span>
            <span class="rpp__info-value rpp__info-msg">{{ project.lastOperationMessage }}</span>
          </div>
        </div>

        <!-- 卡片操作 -->
        <div class="rpp__card-actions">
          <div class="rpp__action-group">
            <el-tooltip content="启动">
              <ScButton
                circle
                size="small"
                type="success"
                plain
                :loading="loadingMap[project.projectId!]?.start"
                :disabled="project.runtimeStatus === 'running'"
                @click="doStart(project)"
              >
                <IconifyIconOnline icon="ep:video-play" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="停止">
              <ScButton
                circle
                size="small"
                type="danger"
                plain
                :loading="loadingMap[project.projectId!]?.stop"
                :disabled="project.runtimeStatus === 'stopped'"
                @click="doStop(project)"
              >
                <IconifyIconOnline icon="ep:video-pause" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="重启">
              <ScButton
                circle
                size="small"
                type="warning"
                plain
                :loading="loadingMap[project.projectId!]?.restart"
                @click="doRestart(project)"
              >
                <IconifyIconOnline icon="ep:refresh-right" />
              </ScButton>
            </el-tooltip>
          </div>
          <div class="rpp__action-group">
            <el-tooltip content="查看日志">
              <ScButton circle size="small" plain @click="openLogs(project)">
                <IconifyIconOnline icon="ep:document" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="部署">
              <ScButton circle size="small" type="primary" plain @click="openDeploy(project)">
                <IconifyIconOnline icon="ep:upload" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="备份">
              <ScButton circle size="small" plain @click="doBackup(project)">
                <IconifyIconOnline icon="ep:box" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="回滚">
              <ScButton circle size="small" plain @click="openRollback(project)">
                <IconifyIconOnline icon="ep:back" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="编辑">
              <ScButton circle size="small" plain @click="openEditDialog(project)">
                <IconifyIconOnline icon="ep:edit" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="删除">
              <ScButton circle size="small" type="danger" plain @click="confirmDeleteProject(project)">
                <IconifyIconOnline icon="ep:delete" />
              </ScButton>
            </el-tooltip>
          </div>
        </div>
      </div>

      <el-empty v-if="!listLoading && !projects.length" description="暂无项目，点击右上角添加" />
    </div>

    <!-- 右键菜单 -->
    <ScContextMenu ref="contextMenuRef" :menus="contextMenuItems" />

    <!-- 添加/编辑项目对话框 -->
    <ScDialog
      v-model="showProjectDialog"
      :title="editingProject?.projectId ? '编辑项目' : '添加项目'"
      width="640px"
      append-to-body
      destroy-on-close
     layout="simple">
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        label-width="120px"
        label-position="left"
        class="rpp__form"
      >
        <el-form-item label="项目名称" required>
          <el-input v-model="projectForm.projectName" placeholder="my-app" />
        </el-form-item>
        <el-form-item label="项目类型" required>
          <ScSelect v-model="projectForm.projectType" style="width: 100%">
            <ScOption v-for="t in projectTypes" :key="t.value" :label="t.label" :value="t.value" />
          </ScSelect>
        </el-form-item>
        <el-form-item label="根目录" required>
          <el-input v-model="projectForm.rootDirectory" placeholder="/opt/app" />
        </el-form-item>
        <el-form-item label="依赖目录">
          <el-input v-model="projectForm.libDirectory" placeholder="/opt/app/lib（可选）" />
        </el-form-item>
        <el-form-item label="配置目录">
          <el-input v-model="projectForm.configDirectory" placeholder="/opt/app/conf（可选）" />
        </el-form-item>
        <el-form-item label="日志目录">
          <el-input v-model="projectForm.logDirectory" placeholder="/opt/app/logs（可选）" />
        </el-form-item>
        <template v-if="['springboot', 'tomcat'].includes(projectForm.projectType)">
          <el-form-item label="主 jar/war">
            <el-input v-model="projectForm.mainArtifact" placeholder="app.jar" />
          </el-form-item>
        </template>
        <template v-if="projectForm.projectType === 'springboot'">
          <el-form-item label="JVM 参数">
            <el-input v-model="projectForm.jvmArgs" placeholder="-Xms512m -Xmx1024m" />
          </el-form-item>
        </template>
        <el-form-item label="启动脚本">
          <el-input v-model="projectForm.startScript" type="textarea" :rows="3" placeholder="start.sh 内容或路径" />
        </el-form-item>
        <el-form-item label="停止脚本">
          <el-input v-model="projectForm.stopScript" type="textarea" :rows="3" placeholder="stop.sh 内容或路径" />
        </el-form-item>
        <el-form-item label="重启脚本">
          <el-input v-model="projectForm.restartScript" type="textarea" :rows="3" placeholder="restart.sh 内容或路径" />
        </el-form-item>
        <el-form-item label="状态检查">
          <el-input v-model="projectForm.statusScript" type="textarea" :rows="2" placeholder="status.sh 内容或路径" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="projectForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ScButton @click="showProjectDialog = false">取消</ScButton>
        <ScButton type="primary" :loading="projectSaving" @click="saveProject">保存</ScButton>
      </template>
    </ScDialog>

    <!-- 部署对话框 -->
    <ScDialog
      v-model="showDeployDialog"
      :title="`部署 · ${deployingProject?.projectName}`"
      width="520px"
      append-to-body
      destroy-on-close
     layout="simple">
      <div
        class="rpp__deploy-drop"
        :class="{ 'is-drag': deployDragOver }"
        @dragover.prevent="deployDragOver = true"
        @dragleave.prevent="deployDragOver = false"
        @drop.prevent="onDeployDrop"
        @click="deployInputRef?.click()"
      >
        <template v-if="deployFile">
          <IconifyIconOnline icon="ep:document" class="rpp__deploy-file-icon" />
          <p class="rpp__deploy-file-name">{{ deployFile.name }}</p>
          <p class="rpp__deploy-file-size">{{ formatSize(deployFile.size) }}</p>
        </template>
        <template v-else>
          <IconifyIconOnline icon="ep:upload" class="rpp__deploy-upload-icon" />
          <p>拖拽或点击上传部署包</p>
          <p class="rpp__deploy-hint">支持 .jar .war .zip .tar.gz</p>
        </template>
      </div>
      <input ref="deployInputRef" type="file" class="rpp__hidden-input" @change="onDeployFileChange" />

      <el-form label-width="130px" label-position="left" class="rpp__form rpp__deploy-form">
        <el-form-item label="部署前停止服务">
          <el-switch v-model="deployOptions.stopBeforeDeploy" />
        </el-form-item>
        <el-form-item label="部署后启动服务">
          <el-switch v-model="deployOptions.startAfterDeploy" />
        </el-form-item>
        <el-form-item label="部署前备份">
          <el-switch v-model="deployOptions.backupBefore" />
        </el-form-item>
        <el-form-item label="清空目标目录">
          <el-switch v-model="deployOptions.uploadOptions!.clearBefore" />
        </el-form-item>
        <el-form-item label="自动解压">
          <el-switch v-model="deployOptions.uploadOptions!.autoExtract" />
        </el-form-item>
        <el-form-item v-if="deployOptions.uploadOptions!.autoExtract" label="解压后删除包">
          <el-switch v-model="deployOptions.uploadOptions!.deleteArchiveAfterExtract" />
        </el-form-item>
      </el-form>

      <el-progress
        v-if="deploying"
        :percentage="deployProgress"
        :status="deployStatus"
        class="rpp__deploy-progress"
      />

      <template #footer>
        <ScButton @click="showDeployDialog = false">取消</ScButton>
        <ScButton type="primary" :loading="deploying" :disabled="!deployFile" @click="doDeploy">
          开始部署
        </ScButton>
      </template>
    </ScDialog>

    <!-- 日志抽屉 -->
    <ScDrawer
      v-model="showLogsDrawer"
      :title="`日志 · ${logsProject?.projectName}`"
      size="640px"
      append-to-body
      destroy-on-close
      layout="simple"
      @open="startLogPolling"
      @close="stopLogPolling"
    >
      <div class="rpp__logs-wrap">
        <div class="rpp__logs-toolbar">
          <ScButton size="small" plain @click="clearLogs">清空</ScButton>
          <ScButton size="small" plain :type="autoScroll ? 'primary' : ''" @click="autoScroll = !autoScroll">
            自动滚动
          </ScButton>
          <ScButton size="small" plain @click="fetchLogs">刷新</ScButton>
        </div>
        <pre ref="logsRef" class="rpp__logs thin-scroller">{{ logsContent || '暂无日志...' }}</pre>
      </div>
    </ScDrawer>

    <!-- 回滚对话框 -->
    <ScDialog
      v-model="showRollbackDialog"
      :title="`回滚 · ${rollbackProject?.projectName}`"
      width="560px"
      append-to-body
      destroy-on-close
     layout="simple">
      <div v-loading="backupsLoading" class="rpp__backup-list">
        <div
          v-for="backup in backups"
          :key="backup.backupId"
          class="rpp__backup-item"
        >
          <div class="rpp__backup-info">
            <span class="rpp__backup-time">{{ backup.backupTime }}</span>
            <span class="rpp__backup-size">{{ formatSize(backup.size) }}</span>
            <span v-if="backup.note" class="rpp__backup-note">{{ backup.note }}</span>
          </div>
          <ScButton size="small" type="warning" plain @click="doRollback(backup)">
            回滚到此版本
          </ScButton>
        </div>
        <el-empty v-if="!backupsLoading && !backups.length" description="暂无备份" :image-size="60" />
      </div>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconifyIconOnline } from "@repo/components";
import ScContextMenu from "@repo/components/ScContextMenu/index.vue";
import type {
  RemoteApi,
  RemoteProject,
  RemoteProjectBackup,
  RemoteDeployOptions,
  ProjectType,
} from "../api/remote";

const props = withDefaults(
  defineProps<{
    api: RemoteApi;
    title?: string;
  }>(),
  { title: "项目管理" }
);

// ── 右键菜单 ─────────────────────────────────────────────────────────────────

const contextMenuRef = ref<{ open?: (e: MouseEvent, d: null, n: null) => void } | null>(null);

const MENU_WIDTH = 200;
const MENU_HEIGHT = 60;

const contextMenuItems = [
  {
    name: "添加项目",
    icon: "ep:plus",
    handle: () => openAddDialog(),
  },
];

const handleContextMenu = (event: MouseEvent) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = Math.min(event.clientX, vw - MENU_WIDTH - 8);
  const y = Math.min(event.clientY, vh - MENU_HEIGHT - 8);
  const e = new MouseEvent(event.type, {
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    clientX: x,
    clientY: y,
    screenX: event.screenX,
    screenY: event.screenY,
    button: event.button,
    buttons: event.buttons,
  });
  contextMenuRef.value?.open?.(e, null, null);
};

// ── 项目列表 ────────────────────────────────────────────────────────────────

const projects = ref<RemoteProject[]>([]);
const listLoading = ref(false);

const loadProjects = async () => {
  listLoading.value = true;
  try {
    const res = await props.api.listProjects();
    if (res.data) projects.value = res.data;
  } catch (err: any) {
    ElMessage.error(err.message || "加载项目列表失败");
  } finally {
    listLoading.value = false;
  }
};

// 操作 loading map
const loadingMap = reactive<Record<string, Record<string, boolean>>>({});
const setLoading = (id: string, key: string, val: boolean) => {
  if (!loadingMap[id]) loadingMap[id] = {};
  loadingMap[id][key] = val;
};

// ── 项目类型 ────────────────────────────────────────────────────────────────

const projectTypes: { label: string; value: ProjectType }[] = [
  { label: "Spring Boot", value: "springboot" },
  { label: "Tomcat", value: "tomcat" },
  { label: "Node.js", value: "nodejs" },
  { label: "Python", value: "python" },
  { label: "静态站点", value: "static" },
  { label: "Docker", value: "docker" },
  { label: "自定义", value: "custom" },
];

const projectTypeLabel = (type?: ProjectType) =>
  projectTypes.find((t) => t.value === type)?.label ?? type ?? "未知";

const statusLabel = (status?: string) => {
  const map: Record<string, string> = {
    running: "运行中",
    stopped: "已停止",
    error: "异常",
    unknown: "未知",
  };
  return map[status || "unknown"] ?? "未知";
};

const formatSize = (size?: number) => {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// ── 添加/编辑项目 ────────────────────────────────────────────────────────────

const showProjectDialog = ref(false);
const editingProject = ref<RemoteProject | null>(null);
const projectSaving = ref(false);
const projectFormRef = ref();

const defaultForm = (): RemoteProject => ({
  projectName: "",
  projectType: "springboot",
  rootDirectory: "",
  libDirectory: "",
  configDirectory: "",
  logDirectory: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  mainArtifact: "",
  jvmArgs: "",
  description: "",
});

const projectForm = ref<RemoteProject>(defaultForm());

const openAddDialog = () => {
  editingProject.value = null;
  projectForm.value = defaultForm();
  showProjectDialog.value = true;
};

const openEditDialog = (project: RemoteProject) => {
  editingProject.value = project;
  projectForm.value = { ...project };
  showProjectDialog.value = true;
};

const saveProject = async () => {
  projectSaving.value = true;
  try {
    if (editingProject.value?.projectId) {
      await props.api.updateProject(editingProject.value.projectId, projectForm.value);
      ElMessage.success("更新成功");
    } else {
      await props.api.createProject(projectForm.value);
      ElMessage.success("创建成功");
    }
    showProjectDialog.value = false;
    loadProjects();
  } catch (err: any) {
    ElMessage.error(err.message || "保存失败");
  } finally {
    projectSaving.value = false;
  }
};

const confirmDeleteProject = async (project: RemoteProject) => {
  try {
    await ElMessageBox.confirm(`确定删除项目 "${project.projectName}" 吗？`, "删除确认", { type: "warning" });
    await props.api.deleteProject(project.projectId!);
    ElMessage.success("删除成功");
    loadProjects();
  } catch {
    // 取消
  }
};

// ── 启动/停止/重启 ────────────────────────────────────────────────────────────

const doStart = async (project: RemoteProject) => {
  const id = project.projectId!;
  setLoading(id, "start", true);
  try {
    const res = await props.api.startProject(id);
    ElMessage.success(res.data?.message || "启动成功");
    loadProjects();
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
    ElMessage.success(res.data?.message || "停止成功");
    loadProjects();
  } catch (err: any) {
    ElMessage.error(err.message || "停止失败");
  } finally {
    setLoading(id, "stop", false);
  }
};

const doRestart = async (project: RemoteProject) => {
  const id = project.projectId!;
  setLoading(id, "restart", true);
  try {
    const res = await props.api.restartProject(id);
    ElMessage.success(res.data?.message || "重启成功");
    loadProjects();
  } catch (err: any) {
    ElMessage.error(err.message || "重启失败");
  } finally {
    setLoading(id, "restart", false);
  }
};

// ── 备份 ────────────────────────────────────────────────────────────────────

const doBackup = async (project: RemoteProject) => {
  try {
    const res = await props.api.backupProject(project.projectId!);
    ElMessage.success(res.data?.message || "备份成功");
  } catch (err: any) {
    ElMessage.error(err.message || "备份失败");
  }
};

// ── 回滚 ────────────────────────────────────────────────────────────────────

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
    if (res.data) backups.value = res.data;
  } catch (err: any) {
    ElMessage.error(err.message || "加载备份失败");
  } finally {
    backupsLoading.value = false;
  }
};

const doRollback = async (backup: RemoteProjectBackup) => {
  try {
    await ElMessageBox.confirm(`确定回滚到 ${backup.backupTime} 的版本吗？`, "回滚确认", { type: "warning" });
    const res = await props.api.rollbackProject(rollbackProject.value!.projectId!, backup.backupId!);
    ElMessage.success(res.data?.message || "回滚成功");
    showRollbackDialog.value = false;
    loadProjects();
  } catch {
    // 取消
  }
};

// ── 日志 ────────────────────────────────────────────────────────────────────

const showLogsDrawer = ref(false);
const logsProject = ref<RemoteProject | null>(null);
const logsContent = ref("");
const logsRef = ref<HTMLPreElement | null>(null);
const autoScroll = ref(true);
let logTimer: ReturnType<typeof setInterval> | null = null;

const openLogs = (project: RemoteProject) => {
  logsProject.value = project;
  logsContent.value = "";
  showLogsDrawer.value = true;
};

const fetchLogs = async () => {
  if (!logsProject.value?.projectId) return;
  try {
    const res = await props.api.getProjectLogs(logsProject.value.projectId, 200);
    if (res.data) {
      logsContent.value = res.data;
      if (autoScroll.value) {
        nextTick(() => {
          if (logsRef.value) logsRef.value.scrollTop = logsRef.value.scrollHeight;
        });
      }
    }
  } catch {
    // 忽略轮询错误
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
  logsContent.value = "";
};

// ── 部署 ────────────────────────────────────────────────────────────────────

const showDeployDialog = ref(false);
const deployingProject = ref<RemoteProject | null>(null);
const deployFile = ref<File | null>(null);
const deployDragOver = ref(false);
const deployInputRef = ref<HTMLInputElement | null>(null);
const deploying = ref(false);
const deployProgress = ref(0);
const deployStatus = ref<"" | "success" | "exception">("");

const deployOptions = ref<RemoteDeployOptions>({
  stopBeforeDeploy: true,
  startAfterDeploy: true,
  backupBefore: true,
  uploadOptions: {
    clearBefore: false,
    autoExtract: true,
    deleteArchiveAfterExtract: true,
  },
});

const openDeploy = (project: RemoteProject) => {
  deployingProject.value = project;
  deployFile.value = null;
  deployProgress.value = 0;
  deployStatus.value = "";
  showDeployDialog.value = true;
};

const onDeployFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) deployFile.value = file;
};

const onDeployDrop = (e: DragEvent) => {
  deployDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) deployFile.value = file;
};

const doDeploy = async () => {
  if (!deployFile.value || !deployingProject.value?.projectId) return;
  deploying.value = true;
  deployProgress.value = 10;
  deployStatus.value = "";
  try {
    deployProgress.value = 40;
    const res = await props.api.deployProject(
      deployingProject.value.projectId,
      deployFile.value,
      deployOptions.value
    );
    deployProgress.value = 100;
    deployStatus.value = "success";
    ElMessage.success(res.data?.message || "部署成功");
    setTimeout(() => {
      showDeployDialog.value = false;
      loadProjects();
    }, 1200);
  } catch (err: any) {
    deployProgress.value = 100;
    deployStatus.value = "exception";
    ElMessage.error(err.message || "部署失败");
  } finally {
    deploying.value = false;
  }
};

// ── 初始化 ────────────────────────────────────────────────────────────────────

loadProjects();

onUnmounted(() => {
  stopLogPolling();
});
</script>

<style scoped lang="scss">
.rpp {
  display: grid;
  gap: 20px;
  padding: 20px;
}

.rpp__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 20px 24px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
}

.rpp__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0284c7;
}

.rpp__title {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.rpp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.rpp__card {
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.1);
    transform: translateY(-2px);
  }
}

.rpp__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.rpp__card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rpp__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  &.is-running {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }

  &.is-stopped,
  &.is-unknown {
    background: #94a3b8;
  }

  &.is-error {
    background: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  }
}

.rpp__card-name {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
  font-weight: 600;
}

.rpp__type-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.2);
  --el-tag-bg-color: rgba(248, 250, 252, 0.9);
  --el-tag-text-color: #475569;
  font-size: 11px;
}

.rpp__card-body {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.8);
}

.rpp__card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.rpp__info-label {
  color: #94a3b8;
  flex-shrink: 0;
}

.rpp__info-value {
  color: #334155;
  font-weight: 500;
  text-align: right;

  &.is-running { color: #16a34a; }
  &.is-stopped, &.is-unknown { color: #64748b; }
  &.is-error { color: #dc2626; }
}

.rpp__info-path {
  font-family: monospace;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.rpp__info-msg {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rpp__card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.rpp__action-group {
  display: flex;
  gap: 6px;
}

.rpp__form {
  .el-form-item {
    margin-bottom: 16px;
  }
}

.rpp__deploy-drop {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 32px 20px;
  border: 2px dashed rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.8);
  cursor: pointer;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:hover,
  &.is-drag {
    border-color: #0ea5e9;
    background: rgba(14, 165, 233, 0.06);
    color: #0284c7;
  }
}

.rpp__deploy-upload-icon {
  font-size: 36px;
  color: #94a3b8;
}

.rpp__deploy-file-icon {
  font-size: 36px;
  color: #0ea5e9;
}

.rpp__deploy-file-name {
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.rpp__deploy-file-size {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.rpp__deploy-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.rpp__deploy-form {
  margin-top: 4px;
}

.rpp__deploy-progress {
  margin-top: 16px;
}

.rpp__hidden-input {
  display: none;
}

.rpp__logs-wrap {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  height: 100%;
}

.rpp__logs-toolbar {
  display: flex;
  gap: 8px;
}

.rpp__logs {
  background: #0f172a;
  color: #e2e8f0;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 16px;
  border-radius: 12px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  white-space: pre-wrap;
  word-break: break-all;
}

.rpp__backup-list {
  display: grid;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.rpp__backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.rpp__backup-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rpp__backup-time {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.rpp__backup-size {
  font-size: 12px;
  color: #94a3b8;
}

.rpp__backup-note {
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 768px) {
  .rpp__grid {
    grid-template-columns: 1fr;
  }
}
</style>
