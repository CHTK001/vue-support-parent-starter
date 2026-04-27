<template>
  <ScDialog
    v-model="visible"
    :title="`容器软件 — ${project?.projectName ?? ''}`"
    width="1180px"
    destroy-on-close
    layout="simple"
  >
    <div class="pcs-layout">
      <section class="pcs-panel">
        <div class="pcs-panel__head">
          <div>
            <h3>预设软件</h3>
            <p>从常用预设直接导入到当前项目</p>
          </div>
          <ScButton size="small" plain @click="reloadAll">刷新</ScButton>
        </div>
        <div class="pcs-list thin-scroller">
          <div
            v-for="item in presets"
            :key="item.sysProjectContainerSoftwarePresetId"
            class="pcs-item"
          >
            <div class="pcs-item__main">
              <strong>{{ item.softwareName || item.softwareCode }}</strong>
              <span>{{ item.softwareVersion || "-" }}</span>
              <small>{{ item.osType || "-" }} / {{ item.softwareArch || "-" }}</small>
            </div>
            <ScButton
              size="small"
              type="primary"
              plain
              :loading="importingPresetId === item.sysProjectContainerSoftwarePresetId"
              @click="handleImportPreset(item)"
            >
              导入
            </ScButton>
          </div>
        </div>
      </section>

      <section class="pcs-panel pcs-panel--wide">
        <div class="pcs-panel__head">
          <div>
            <h3>项目已关联软件</h3>
            <p>支持预设导入与自定义软件录入</p>
          </div>
          <div class="pcs-panel__actions">
            <ScButton size="small" plain @click="showCustomForm = !showCustomForm">
              {{ showCustomForm ? "收起自定义" : "新增自定义" }}
            </ScButton>
            <ScButton size="small" plain @click="reloadBindings">刷新列表</ScButton>
          </div>
        </div>

        <div v-if="showCustomForm" class="pcs-custom">
          <div class="pcs-form-grid">
            <ScInput v-model="customForm.softwareName" placeholder="软件名称" />
            <ScInput v-model="customForm.softwareCode" placeholder="软件编码" />
            <ScInput v-model="customForm.softwareVersion" placeholder="版本" />
            <ScSelect v-model="customForm.osType" placeholder="系统">
              <ScOption value="linux" label="Linux" />
              <ScOption value="windows" label="Windows" />
              <ScOption value="macos" label="macOS" />
            </ScSelect>
            <ScInput v-model="customForm.softwareArch" placeholder="架构，如 amd64" />
            <ScInput v-model="customForm.installPath" placeholder="安装路径" />
          </div>
          <div class="pcs-form-grid pcs-form-grid--scripts">
            <ScInput v-model="customForm.installScript" type="textarea" :rows="3" placeholder="安装脚本" />
            <ScInput v-model="customForm.startScript" type="textarea" :rows="3" placeholder="启动脚本" />
            <ScInput v-model="customForm.stopScript" type="textarea" :rows="3" placeholder="停止脚本" />
            <ScInput v-model="customForm.restartScript" type="textarea" :rows="3" placeholder="重启脚本" />
            <ScInput v-model="customForm.statusScript" type="textarea" :rows="3" placeholder="状态脚本" />
            <ScInput v-model="customForm.uninstallScript" type="textarea" :rows="3" placeholder="卸载脚本" />
          </div>
          <div class="pcs-custom__footer">
            <ScButton
              type="primary"
              :loading="savingCustom"
              @click="handleSaveCustom"
            >
              保存自定义软件
            </ScButton>
          </div>
        </div>

        <div class="pcs-list thin-scroller pcs-list--bindings">
          <div
            v-for="item in bindings"
            :key="item.sysProjectContainerSoftwareBindingId"
            class="pcs-item pcs-item--binding"
          >
            <div class="pcs-item__main">
              <div class="pcs-item__title">
                <strong>{{ item.softwareName || item.softwareCode }}</strong>
                <el-tag size="small" :type="item.bindingCustom === 1 ? 'warning' : 'info'">
                  {{ item.bindingCustom === 1 ? "自定义" : "预设" }}
                </el-tag>
                <el-tag size="small" :type="resolveRuntimeTagType(item.runtimeStatus)">
                  {{ item.runtimeStatus || "UNKNOWN" }}
                </el-tag>
              </div>
              <span>{{ item.softwareVersion || "-" }}</span>
              <small>
                {{ item.osType || "-" }} / {{ item.softwareArch || "-" }}
                <template v-if="item.installPath"> · {{ item.installPath }}</template>
              </small>
            </div>
            <div class="pcs-item__actions">
              <ScButton size="small" plain @click="handleOperate(item, 'STATUS')">状态</ScButton>
              <ScButton size="small" type="success" plain @click="handleOperate(item, 'INSTALL')">安装</ScButton>
              <ScButton size="small" type="primary" plain @click="handleOperate(item, 'START')">启动</ScButton>
              <ScButton size="small" type="danger" plain @click="handleOperate(item, 'STOP')">停止</ScButton>
              <ScButton size="small" type="warning" plain @click="handleOperate(item, 'RESTART')">重启</ScButton>
              <ScButton size="small" plain @click="handleOperate(item, 'UNINSTALL')">卸载</ScButton>
              <ScButton size="small" plain @click="handleDeleteBinding(item)">删除</ScButton>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="pcs-log">
      <div class="pcs-log__head">
        <strong>实时日志</strong>
        <span>{{ streamStatusText }}</span>
      </div>
      <pre class="pcs-log__content thin-scroller">{{ logText || "暂无实时日志" }}</pre>
    </section>

    <ScTaskMessageDialog
      v-model:visible="taskDialogVisible"
      title="项目容器软件任务"
      :task="taskDialogModel"
      @refresh="refreshTaskDialog"
    />

    <template #footer>
      <ScButton @click="visible = false">关闭</ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { resolveRuntimeProviders, tryUseOverlayStack } from "@layout/default";
import { message } from "@repo/utils";
import ScTaskMessageDialog from "@repo/components/ScTaskMessageDialog";
import type { TaskDialogModel } from "@repo/components/ScTaskMessageDialog/types";
import type { SysProject } from "../../api/manage/project";
import {
  type ProjectContainerSoftwareBinding,
  type ProjectContainerSoftwareOperationTicket,
  type ProjectContainerSoftwarePreset,
  fetchDeleteProjectContainerSoftwareBinding,
  fetchImportProjectContainerSoftwarePreset,
  fetchOperateProjectContainerSoftwareBinding,
  fetchProjectContainerSoftwareBindingList,
  fetchProjectContainerSoftwarePresetList,
  fetchSaveProjectContainerSoftwareBinding,
} from "../../api/manage/project-container-software";
import { useProjectContainerSoftwareStream } from "../../composables/useProjectContainerSoftwareStream";

const props = defineProps<{
  modelValue: boolean;
  project: SysProject | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const runtimeProviders = resolveRuntimeProviders({
  module: "project.container.software",
  socketName: "project-container-software",
});
const runtimeMessage = runtimeProviders.message.provider;
const runtimeTask = runtimeProviders.task.provider;
const overlayStack = tryUseOverlayStack();
const stream = useProjectContainerSoftwareStream(runtimeProviders.socket.provider);

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});
const project = computed(() => props.project);
const presets = ref<ProjectContainerSoftwarePreset[]>([]);
const bindings = ref<ProjectContainerSoftwareBinding[]>([]);
const importingPresetId = ref<number | null>(null);
const savingCustom = ref(false);
const showCustomForm = ref(false);
const activeOverlayId = ref("");
const taskDialogVisible = ref(false);
const taskDialogModel = ref<TaskDialogModel | null>(null);
const customForm = reactive({
  softwareName: "",
  softwareCode: "",
  softwareVersion: "",
  osType: "linux",
  softwareArch: "amd64",
  installPath: "",
  installScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  uninstallScript: "",
});

const logText = computed(() => stream.lines.value.join("\n"));
const streamStatusText = computed(() => {
  if (stream.state.value.error) return stream.state.value.error;
  if (stream.state.value.connecting) return "连接中…";
  if (stream.latest.value?.message) return String(stream.latest.value.message);
  return "等待操作";
});

const resetCustomForm = () => {
  Object.assign(customForm, {
    softwareName: "",
    softwareCode: "",
    softwareVersion: "",
    osType: "linux",
    softwareArch: "amd64",
    installPath: "",
    installScript: "",
    startScript: "",
    stopScript: "",
    restartScript: "",
    statusScript: "",
    uninstallScript: "",
  });
};

const reloadPresets = async () => {
  const res = await fetchProjectContainerSoftwarePresetList({ presetStatus: 1, presetDelete: 0 });
  if (res.code === "00000") {
    presets.value = res.data || [];
  }
};

const reloadBindings = async () => {
  if (!project.value?.projectId) return;
  const res = await fetchProjectContainerSoftwareBindingList(project.value.projectId);
  if (res.code === "00000") {
    bindings.value = res.data || [];
  }
};

const reloadAll = async () => {
  await Promise.all([reloadPresets(), reloadBindings()]);
};

const resolveRuntimeTagType = (status?: string) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "RUNNING") return "success";
  if (normalized === "STOPPED") return "info";
  if (normalized === "ERROR" || normalized === "FAILED") return "danger";
  return "warning";
};

const buildOverlayId = (ticket: ProjectContainerSoftwareOperationTicket) =>
  `project-container-software:${ticket.operationId}`;

const refreshTaskDialog = () => {
  if (!taskDialogModel.value) return;
  taskDialogModel.value = {
    ...taskDialogModel.value,
    updatedAt: Date.now(),
  };
};

const upsertOverlay = (ticket: ProjectContainerSoftwareOperationTicket, progress: number, tone: "info" | "success" | "warning" | "error", messageText: string) => {
  if (!overlayStack) return;
  const id = activeOverlayId.value || buildOverlayId(ticket);
  activeOverlayId.value = id;
  overlayStack.upsert({
    id,
    source: "project-container-software",
    title: `${ticket.action} · ${ticket.sysProjectContainerSoftwareBindingId}`,
    description: project.value?.projectName || "项目容器软件",
    tone,
    progress,
    latestMessage: messageText,
    progressLabel: ticket.action || "执行中",
    progressSecondary: project.value?.projectName || "",
    icon: tone === "success" ? "ep:success-filled" : tone === "error" ? "ep:circle-close-filled" : "ep:loading",
    autoClose: tone === "success",
    autoCloseDelay: 3000,
    closeable: true,
    timestamp: Date.now(),
    createdAt: Date.now(),
  });
};

const handleImportPreset = async (item: ProjectContainerSoftwarePreset) => {
  if (!project.value?.projectId || !item.sysProjectContainerSoftwarePresetId) return;
  importingPresetId.value = item.sysProjectContainerSoftwarePresetId;
  try {
    const res = await fetchImportProjectContainerSoftwarePreset({
      sysProjectId: project.value.projectId,
      sysProjectContainerSoftwarePresetId: item.sysProjectContainerSoftwarePresetId,
    });
    if (res.code === "00000") {
      runtimeMessage.success("预设软件已导入");
      await reloadBindings();
    } else {
      runtimeMessage.error(res.message || "导入失败");
    }
  } finally {
    importingPresetId.value = null;
  }
};

const handleSaveCustom = async () => {
  if (!project.value?.projectId) return;
  if (!customForm.softwareName.trim()) {
    message("请先填写软件名称", { type: "warning" });
    return;
  }
  savingCustom.value = true;
  try {
    const res = await fetchSaveProjectContainerSoftwareBinding({
      sysProjectId: project.value.projectId,
      softwareName: customForm.softwareName,
      softwareCode: customForm.softwareCode,
      softwareVersion: customForm.softwareVersion,
      osType: customForm.osType,
      softwareArch: customForm.softwareArch,
      installPath: customForm.installPath,
      installScript: customForm.installScript,
      startScript: customForm.startScript,
      stopScript: customForm.stopScript,
      restartScript: customForm.restartScript,
      statusScript: customForm.statusScript,
      uninstallScript: customForm.uninstallScript,
      bindingCustom: 1,
    });
    if (res.code === "00000") {
      runtimeMessage.success("自定义软件已保存");
      resetCustomForm();
      showCustomForm.value = false;
      await reloadBindings();
    } else {
      runtimeMessage.error(res.message || "保存失败");
    }
  } finally {
    savingCustom.value = false;
  }
};

const handleDeleteBinding = async (item: ProjectContainerSoftwareBinding) => {
  if (!item.sysProjectContainerSoftwareBindingId) return;
  await fetchDeleteProjectContainerSoftwareBinding(item.sysProjectContainerSoftwareBindingId);
  runtimeMessage.success("已删除容器软件关联");
  await reloadBindings();
};

const handleOperate = async (item: ProjectContainerSoftwareBinding, action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL") => {
  if (!item.sysProjectContainerSoftwareBindingId) return;
  const res = await fetchOperateProjectContainerSoftwareBinding({
    sysProjectContainerSoftwareBindingId: item.sysProjectContainerSoftwareBindingId,
    action,
  });
  if (res.code !== "00000" || !res.data?.operationId) {
    runtimeMessage.error(res.message || "操作提交失败");
    return;
  }
  activeOverlayId.value = "";
  stream.connect(String(res.data.operationId));
  runtimeTask.updateTask(String(res.data.operationId), {
    requestId: res.data.operationId,
    title: `${action} · ${item.softwareName || item.softwareCode || "未命名软件"}`,
    description: project.value?.projectName || "项目容器软件",
    status: "running",
    progress: Number(res.data.progressPercent || 10),
    source: "system",
    mode: "stream",
    message: res.data.message || "任务已提交",
    stageLabel: action,
  });
  taskDialogModel.value = {
    taskId: String(res.data.operationId),
    status: "RUNNING",
    message: res.data.message || "任务已提交",
    serverIds: project.value?.projectId ? [project.value.projectId] : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    summaryItems: [
      { label: "项目", value: project.value?.projectName || "-" },
      { label: "软件", value: item.softwareName || item.softwareCode || "-" },
      { label: "操作", value: action },
    ],
    steps: [
      {
        stepKey: "SUBMIT",
        title: "任务提交",
        status: "SUCCESS",
        message: res.data.message || "任务已提交",
        updatedAt: Date.now(),
      },
    ],
  };
  taskDialogVisible.value = true;
  upsertOverlay(res.data, Number(res.data.progressPercent || 10), "info", res.data.message || "任务已提交");
};

watch(stream.latest, async (payload) => {
  if (!payload) return;
  const ticket: ProjectContainerSoftwareOperationTicket = {
    operationId: String(payload.operationId || stream.state.value.operationId || ""),
    sysProjectContainerSoftwareBindingId: payload.sysProjectContainerSoftwareBindingId,
    action: payload.action,
    progressPercent: payload.progressPercent,
    message: payload.message,
    operationStatus: payload.status,
  };
  const normalized = String(payload.status || "").toUpperCase();
  const tone =
    normalized === "SUCCESS" ? "success" : normalized === "FAILED" ? "error" : "info";
  upsertOverlay(ticket, Number(payload.progressPercent || (normalized === "SUCCESS" ? 100 : 50)), tone, String(payload.message || payload.line || "执行中"));
  runtimeTask.updateTask(ticket.operationId, {
    requestId: ticket.operationId,
    title: `${ticket.action || "操作"} · ${payload.softwareName || payload.softwareCode || "未命名软件"}`,
    description: project.value?.projectName || "项目容器软件",
    status: normalized === "SUCCESS" ? "success" : normalized === "FAILED" ? "error" : "running",
    progress: Number(payload.progressPercent || (normalized === "SUCCESS" ? 100 : 50)),
    source: "system",
    mode: "stream",
    message: String(payload.message || payload.line || "执行中"),
    stageLabel: String(ticket.action || "执行中"),
  });
  if (taskDialogModel.value && taskDialogModel.value.taskId === ticket.operationId) {
    const nextLogs = taskDialogModel.value.logs ? [...taskDialogModel.value.logs] : [];
    if (payload.line) {
      nextLogs.push(String(payload.line));
    }
    const nextSteps = taskDialogModel.value.steps ? [...taskDialogModel.value.steps] : [];
    const stepKey = String(payload.action || "RUN");
    const existing = nextSteps.find((item) => item.stepKey === stepKey);
    if (existing) {
      existing.status = normalized === "SUCCESS" ? "SUCCESS" : normalized === "FAILED" ? "FAILED" : "RUNNING";
      existing.message = String(payload.message || payload.line || "执行中");
      existing.updatedAt = Date.now();
    } else {
      nextSteps.push({
        stepKey,
        title: String(payload.action || "执行中"),
        status: normalized === "SUCCESS" ? "SUCCESS" : normalized === "FAILED" ? "FAILED" : "RUNNING",
        message: String(payload.message || payload.line || "执行中"),
        updatedAt: Date.now(),
      });
    }
    taskDialogModel.value = {
      ...taskDialogModel.value,
      status: normalized === "SUCCESS" ? "SUCCESS" : normalized === "FAILED" ? "FAILED" : "RUNNING",
      message: String(payload.message || payload.line || "执行中"),
      errorSummary: normalized === "FAILED" ? String(payload.message || payload.output || "执行失败") : undefined,
      logs: nextLogs,
      updatedAt: Date.now(),
      steps: nextSteps,
    };
  }
  if (normalized === "SUCCESS" || normalized === "FAILED") {
    await reloadBindings();
    if (normalized === "SUCCESS") {
      runtimeMessage.success(String(payload.message || "操作成功"));
    } else {
      runtimeMessage.error(String(payload.message || "操作失败"));
    }
  }
});

watch(
  () => [props.modelValue, props.project?.projectId],
  async ([opened, projectId], previous) => {
    const [prevOpened, prevProjectId] = previous || [];
    if (!opened || !projectId) {
      return;
    }
    if (!prevOpened || projectId !== prevProjectId) {
      resetCustomForm();
      showCustomForm.value = false;
      await reloadAll();
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.pcs-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  min-height: 420px;
}
.pcs-panel {
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.pcs-panel--wide {
  min-width: 0;
}
.pcs-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pcs-panel__head h3 {
  margin: 0;
  font-size: 15px;
}
.pcs-panel__head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pcs-panel__actions {
  display: flex;
  gap: 8px;
}
.pcs-list {
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pcs-list--bindings {
  max-height: 360px;
}
.pcs-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.pcs-item--binding {
  align-items: flex-start;
}
.pcs-item__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.pcs-item__main strong,
.pcs-item__main span,
.pcs-item__main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pcs-item__title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pcs-item__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.pcs-custom {
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pcs-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.pcs-form-grid--scripts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.pcs-custom__footer {
  display: flex;
  justify-content: flex-end;
}
.pcs-log {
  margin-top: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 12px;
}
.pcs-log__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.pcs-log__content {
  min-height: 180px;
  max-height: 240px;
  overflow-y: auto;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
