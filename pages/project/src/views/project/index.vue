<template>
  <div
    class="project-workspace system-container"
    @contextmenu.prevent="handleContextMenu($event, undefined)"
  >
    <!-- 顶部工具栏 -->
    <ProjectToolbar
      :select-mode="selectMode"
      :selected-count="selectedIds.size"
      :batch-loading="batchLoading"
      @enter-select="handleEnterSelect"
      @exit-select="exitSelect"
      @batch-action="handleBatchAction"
      @upload-multi="handleUploadMulti"
    />

    <!-- 加载中 -->
    <div v-if="loading" v-loading="true" class="loading-mask" />

    <!-- 空状态 -->
    <el-empty
      v-else-if="!projects.length"
      description="暂无项目，右键新建"
      class="empty-state"
    />

    <!-- 卡片网格 -->
    <div v-else class="project-grid">
      <ProjectCard
        v-for="project in projects"
        :key="project.projectId"
        :project="project"
        :select-mode="selectMode"
        :selected="selectedIds.has(project.projectId!)"
        @click="handleCardClick"
        @contextmenu="handleContextMenu"
        @select-toggle="handleSelectToggle"
        @action="handleAction"
        @upload="(p) => handleUpload([p])"
        @upgrade="handleUpgrade"
        @drop-upload="handleDropUpload"
      />
    </div>

    <!-- 右键菜单 -->
    <ProjectContextMenu
      ref="contextMenuRef"
      @create="handleCreate"
      @secret="secretOverlayVisible = true"
      @toggle-server="handleToggleServer"
      @copy="handleCopy"
      @set-secret="handleSetSecret"
      @upload="(p) => handleUpload([p])"
      @view-log="(p) => logDialogRef?.open(p)"
      @view-config="(p) => configDialogRef?.open(p)"
    />

    <!-- 对话框 -->
    <ProjectSaveDialog ref="saveDialogRef" @refresh="loadProjects" />
    <ProjectSecretDialog ref="secretDialogRef" />
    <ProjectUploadDialog ref="uploadDialogRef" />
    <ProjectLogDialog ref="logDialogRef" />
    <ProjectConfigDialog ref="configDialogRef" />

    <!-- 密钥管理 OverlayPage -->
    <ScOverlayPage
      v-model="secretOverlayVisible"
      title="密钥管理"
      :show-close="true"
      :show-back="false"
      append-to-body
    >
      <SecretIndex />
    </ScOverlayPage>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { encodeScParam, message } from "@repo/utils";
import ScOverlayPage from "@repo/components/ScOverlayPage";
import type { SysProject } from "../../api/manage/project";
import {
  fetchListProject,
  fetchProjectServerInfo,
  fetchToggleProjectServer,
  fetchCopyProject,
  fetchProjectAction,
} from "../../api/manage/project";
import { getLocalActivated, setLocalActivated } from "./utils";
import ProjectCard from "./ProjectCard.vue";
import ProjectToolbar from "./ProjectToolbar.vue";
import ProjectContextMenu from "../../components/ProjectContextMenu.vue";
import ProjectSaveDialog from "./save.vue";
import ProjectSecretDialog from "./ProjectSecretDialog.vue";
import ProjectUploadDialog from "./ProjectUploadDialog.vue";
import ProjectLogDialog from "./ProjectLogDialog.vue";
import ProjectConfigDialog from "./ProjectConfigDialog.vue";

const SecretIndex = defineAsyncComponent(() => import("../secret/index.vue"));

// Props：Nginx 嵌入模式传入连接信息
const props = withDefaults(defineProps<{
  nginxHost?: string;
  nginxPort?: number;
  nginxUsername?: string;
  nginxPassword?: string;
  nginxPrivateKey?: string;
}>(), {});

const router = useRouter();
const projects = ref<SysProject[]>([]);
const loading = ref(false);
const contextMenuRef = ref();
const saveDialogRef = ref();
const secretDialogRef = ref();
const uploadDialogRef = ref();
const logDialogRef = ref();
const configDialogRef = ref();
const secretOverlayVisible = ref(false);

// 多选状态
const selectMode = ref(false);
const selectedIds = ref(new Set<number>());
const batchLoading = ref<string | null>(null);

/** 是否处于 Nginx 嵌入模式 */
const isNginxMode = () => !!(props.nginxHost || props.nginxUsername);

const nginxDefaults = () => isNginxMode() ? {
  host: props.nginxHost,
  port: props.nginxPort,
  username: props.nginxUsername,
  password: props.nginxPassword,
  privateKey: props.nginxPrivateKey,
} : undefined;

const loadProjects = async () => {
  loading.value = true;
  try {
    const res = await fetchListProject();
    if (res.code === "00000") {
      projects.value = (res.data ?? []).map((p) => ({
        ...p,
        serverEnabled: p.serverEnabled ?? (getLocalActivated(p.projectId!) ? 1 : 0),
      }));
    }
  } finally {
    loading.value = false;
  }
};

const handleCardClick = async (project: SysProject) => {
  if (selectMode.value) { handleSelectToggle(project); return; }
  if (project.serverEnabled === 1) {
    const res = await fetchProjectServerInfo(project.projectId!);
    if (res.code === "00000" && res.data) {
      const salt = import.meta.env.VITE_SC_SALT ?? "default-salt";
      const sc = encodeScParam(res.data as any, salt);
      router.push({
        path: "/server/list",
        query: {
          _sc: encodeURIComponent(sc),
          nginxProjectStandalone: "1",
          nginxTab: "project",
        },
      });
    }
  } else {
    saveDialogRef.value?.open("edit", project, nginxDefaults());
  }
};

const handleContextMenu = (event: MouseEvent, project?: SysProject) => {
  contextMenuRef.value?.open(event, project);
};

const handleCreate = () => saveDialogRef.value?.open("add", undefined, nginxDefaults());
const handleToggleServer = async (project: SysProject) => {
  const res = await fetchToggleProjectServer(project.projectId!);
  if (res.code === "00000") {
    const enabled = res.data?.serverEnabled === 1;
    setLocalActivated(project.projectId!, enabled);
    const idx = projects.value.findIndex((p) => p.projectId === project.projectId);
    if (idx !== -1) projects.value[idx] = { ...projects.value[idx], serverEnabled: res.data?.serverEnabled };
    message(enabled ? "服务器信息已激活" : "服务器信息已取消", { type: "success" });
  }
};

const handleCopy = async (project: SysProject) => {
  const res = await fetchCopyProject(project.projectId!);
  if (res.code === "00000") {
    message(`已复制为「${res.data?.projectName ?? project.projectName + "_副本"}」`, { type: "success" });
    await loadProjects();
  }
};

const handleSetSecret = (project: SysProject) => secretDialogRef.value?.open(project);

const handleUpload = (targets: SysProject[], preFile?: File) => {
  uploadDialogRef.value?.open(targets, preFile);
};

const handleUploadMulti = () => {
  const targets = selectMode.value
    ? projects.value.filter((p) => selectedIds.value.has(p.projectId!))
    : projects.value;
  handleUpload(targets);
};

const handleUpgrade = (project: SysProject) => uploadDialogRef.value?.open([project]);
const handleDropUpload = (files: FileList, project: SysProject) => handleUpload([project], files[0]);
const handleAction = async () => { await loadProjects(); };

const handleEnterSelect = (action: string) => {
  selectMode.value = true;
  selectedIds.value.clear();
};

const exitSelect = () => {
  selectMode.value = false;
  selectedIds.value.clear();
  batchLoading.value = null;
};

const handleSelectToggle = (project: SysProject) => {
  const id = project.projectId!;
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

const handleBatchAction = async (action: string) => {
  const targets = projects.value.filter((p) => selectedIds.value.has(p.projectId!));
  if (!targets.length) { message("请先选择项目", { type: "warning" }); return; }
  batchLoading.value = action;
  let ok = 0, fail = 0;
  await Promise.allSettled(
    targets.map(async (p) => {
      try {
        if (action === "restart" && !p.restartScript) {
          await fetchProjectAction(p.projectId!, "stop");
          await fetchProjectAction(p.projectId!, "start");
        } else {
          await fetchProjectAction(p.projectId!, action as any);
        }
        ok++;
      } catch { fail++; }
    }),
  );
  batchLoading.value = null;
  message(`批量操作完成：成功 ${ok}，失败 ${fail}`, { type: fail ? "warning" : "success" });
  exitSelect();
  await loadProjects();
};

onMounted(loadProjects);
</script>

<style scoped lang="scss">
.project-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.loading-mask { height: 200px; flex: 1; }
.empty-state { margin-top: 80px; flex: 1; }
.project-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-content: start;
}
</style>
