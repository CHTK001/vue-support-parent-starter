<template>
  <article
    class="project-card"
    :class="[
      `is-${statusTone(project.runtimeStatus)}`,
      { 'is-selected': selectable && selected, 'is-dragover': dragOver },
    ]"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="onDrop"
  >
    <div v-if="dragOver" class="project-card__drop-mask">
      释放文件后按全局上传设置升级当前项目
    </div>
    <div v-if="isBusy" class="project-card__loading-mask">
      <span class="project-card__loading-spinner" />
      <div class="project-card__loading-copy">
        <strong>{{ busyActionLabel }}</strong>
        <span>请等待当前操作完成，避免重复点击</span>
      </div>
    </div>
    <div class="project-card__top-tools" @click.stop>
      <div
        v-if="!isServiceProject"
        class="project-card__group project-card__group--controls"
      >
        <el-tooltip
          v-if="!isRunning && !isStaticProject"
          :content="startActionTooltip"
          placement="top"
        >
          <ScButton
            circle
            size="small"
            type="success"
            plain
            :loading="loadingState?.start"
            :disabled="isBusy || startDisabled"
            @click.stop="$emit('start', project)"
          >
            <IconifyIconOnline icon="ep:video-play" />
          </ScButton>
        </el-tooltip>
        <el-tooltip
          v-else-if="!isStaticProject"
          :content="stopActionTooltip"
          placement="top"
        >
          <ScButton
            circle
            size="small"
            type="danger"
            plain
            :loading="loadingState?.stop"
            :disabled="isBusy || stopDisabled"
            @click.stop="$emit('stop', project)"
          >
            <IconifyIconOnline icon="ep:video-pause" />
          </ScButton>
        </el-tooltip>
        <el-tooltip
          v-if="!isStaticProject"
          :content="restartActionTooltip"
          placement="top"
        >
          <ScButton
            circle
            size="small"
            type="warning"
            plain
            :loading="loadingState?.restart"
            :disabled="isBusy || restartDisabled"
            @click.stop="$emit('restart', project)"
          >
            <IconifyIconOnline icon="ep:refresh-right" />
          </ScButton>
        </el-tooltip>
      </div>

      <div class="project-card__group project-card__group--toolbar">
        <div
          class="project-card__toolbar-strip"
          :class="{ 'is-service-toolbar': isServiceProject }"
          @click.stop="isServiceProject && $emit('service-panel', project)"
        >
          <el-tooltip
            v-if="!isServiceProject && canDownloadMainArtifact"
            :content="downloadActionTooltip"
            placement="top"
          >
            <span
              class="project-card__tool-icon"
              :class="{ 'is-disabled': isBusy }"
              @click.stop="!isBusy && $emit('download-main', project)"
            >
              <IconifyIconOnline icon="ep:download" />
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="!isServiceProject && hasLogConfig"
            content="查看日志"
            placement="top"
          >
            <span
              class="project-card__tool-icon"
              :class="{ 'is-disabled': isBusy }"
              @click.stop="!isBusy && $emit('logs', project)"
            >
              <IconifyIconOnline icon="ep:document" />
            </span>
          </el-tooltip>
          <el-tooltip v-if="!isServiceProject" content="部署升级" placement="top">
            <span
              class="project-card__tool-icon"
              :class="{
                'is-disabled': isBusy,
                'is-loading': loadingState?.deploy || loadingState?.batchDeploy,
              }"
              @click.stop="!isBusy && $emit('deploy', project)"
            >
              <IconifyIconOnline icon="ep:upload" />
            </span>
          </el-tooltip>
          <el-tooltip v-if="!isServiceProject" content="创建备份" placement="top">
            <span
              class="project-card__tool-icon"
              :class="{ 'is-disabled': isBusy }"
              @click.stop="!isBusy && $emit('backup', project)"
            >
              <IconifyIconOnline icon="ep:box" />
            </span>
          </el-tooltip>
          <el-tooltip v-if="!isServiceProject" content="回滚版本" placement="top">
            <span
              class="project-card__tool-icon"
              :class="{ 'is-disabled': isBusy }"
              @click.stop="!isBusy && $emit('rollback', project)"
            >
              <IconifyIconOnline icon="ep:back" />
            </span>
          </el-tooltip>
          <el-tooltip content="编辑项目" placement="top">
            <span
              class="project-card__tool-icon"
              :class="{ 'is-disabled': isBusy }"
              @click.stop="!isBusy && $emit('edit', project)"
            >
              <IconifyIconOnline icon="ep:edit" />
            </span>
          </el-tooltip>
          <el-tooltip content="删除项目" placement="top">
            <span
              class="project-card__tool-icon is-danger"
              :class="{ 'is-disabled': isBusy }"
              @click.stop="!isBusy && $emit('delete', project)"
            >
              <IconifyIconOnline icon="ep:delete" />
            </span>
          </el-tooltip>
        </div>
      </div>
    </div>

    <header class="project-card__head">
      <div class="project-card__identity">
        <div class="project-card__icon">
          <IconifyIconOnline :icon="projectIcon" />
        </div>
        <div class="project-card__titles">
          <div class="project-card__title-row">
            <p class="project-card__eyebrow">
              {{ projectTypeLabel(displayProjectType) }}
            </p>
            <span
              v-if="isServiceProject"
              class="project-card__service-entry"
              title="服务面板"
              @click.stop="$emit('service-panel', project)"
            >
              <IconifyIconOnline icon="ri:service-line" />
            </span>
          </div>
          <h3 class="project-card__name">{{ project.projectName }}</h3>
          <el-tooltip
            v-if="project.rootDirectory"
            :content="project.rootDirectory"
            placement="top-start"
          >
            <p class="project-card__path">{{ project.rootDirectory }}</p>
          </el-tooltip>
          <p v-else class="project-card__path">未配置根目录</p>
        </div>
      </div>

      <div class="project-card__badges">
        <span
          class="project-card__status"
          :class="`is-${statusTone(project.runtimeStatus)}`"
        >
          {{ statusLabel(project.runtimeStatus) }}
        </span>
        <el-tooltip placement="left-start" effect="light">
          <template #content>
            <div class="project-card__tooltip">
              <div class="project-card__tooltip-item">
                <span>部署入口</span>
                <strong>{{ project.mainArtifact || "未配置（升级上传后自动回填）" }}</strong>
              </div>
              <div
                v-if="project.mainArtifactMd5"
                class="project-card__tooltip-item"
              >
                <span>主包 MD5</span>
                <strong>{{ project.mainArtifactMd5 }}</strong>
              </div>
              <div class="project-card__tooltip-item">
                <span>配置目录</span>
                <strong>{{ project.configDirectory || "未指定" }}</strong>
              </div>
              <div class="project-card__tooltip-item">
                <span>日志目录</span>
                <strong>{{ project.logDirectory || "未指定" }}</strong>
              </div>
              <div class="project-card__tooltip-item">
                <span>运行命令</span>
                <strong>{{ startCommandPreview }}</strong>
              </div>
              <div class="project-card__tooltip-item">
                <span>启动方式</span>
                <strong>{{ lifecycleModeLabel }}</strong>
              </div>
              <div
                v-if="project.healthCheckUrl"
                class="project-card__tooltip-item"
              >
                <span>健康地址</span>
                <strong>{{ project.healthCheckUrl }}</strong>
              </div>
              <div class="project-card__tooltip-item">
                <span>脚本策略说明</span>
                <strong>{{ lifecycleHint }}</strong>
              </div>
              <div
                v-if="isResourceSplitProject"
                class="project-card__tooltip-item"
              >
                <span>资源分离部署策略</span>
                <strong
                  >部署时保留目录结构，默认执行配置/依赖核对并重启服务</strong
                >
              </div>
              <div
                v-if="project.description"
                class="project-card__tooltip-item"
              >
                <span>项目描述</span>
                <strong>{{ project.description }}</strong>
              </div>
            </div>
          </template>
          <span class="project-card__info">详情</span>
        </el-tooltip>
        <label v-if="selectable" class="project-card__selector" @click.stop>
          <input
            type="checkbox"
            :checked="selected"
            @change="
              emit(
                'select-change',
                project,
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <span>批量</span>
        </label>
        <span v-if="project.pid" class="project-card__pid"
          >PID {{ project.pid }}</span
        >
      </div>
    </header>

    <section class="project-card__summary">
      <div class="project-card__summary-item">
        <span>启动方式</span>
        <strong>{{ lifecycleModeLabel }}</strong>
      </div>
      <div class="project-card__summary-item">
        <span>最近操作</span>
        <strong>{{ project.lastOperationMessage || "暂无执行记录" }}</strong>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import type { RemoteProject } from "../../api/manage/remote";
import {
  hasRequiredLifecycleScripts,
  isSpringBootProjectType,
  isSpringBootResourceSplitType,
  isStaticProjectType,
  isTomcatProjectType,
  normalizeProjectType,
  projectTypeLabel,
  resolveLifecycleModeLabel,
  resolveLifecycleHint,
  resolveStartCommandPreview,
  statusLabel,
  statusTone,
} from "./projectPanelShared";

const emit = defineEmits<{
  (e: "backup", project: RemoteProject): void;
  (e: "delete", project: RemoteProject): void;
  (e: "deploy", project: RemoteProject): void;
  (e: "deploy-drop", project: RemoteProject, file: File): void;
  (e: "download-main", project: RemoteProject): void;
  (e: "edit", project: RemoteProject): void;
  (e: "logs", project: RemoteProject): void;
  (e: "restart", project: RemoteProject): void;
  (e: "rollback", project: RemoteProject): void;
  (e: "select-change", project: RemoteProject, selected: boolean): void;
  (e: "service-panel", project: RemoteProject): void;
  (e: "start", project: RemoteProject): void;
  (e: "stop", project: RemoteProject): void;
}>();

const props = defineProps<{
  project: RemoteProject;
  loadingState?: Record<string, boolean>;
  selected?: boolean;
  selectable?: boolean;
}>();

const dragOver = ref(false);
const runtimeStatus = computed(() =>
  String(props.project.runtimeStatus || "")
    .trim()
    .toLowerCase(),
);
const isStaticProject = computed(() =>
  isStaticProjectType(props.project.projectType),
);
const isTomcatProject = computed(() =>
  isTomcatProjectType(props.project.projectType),
);
const displayProjectType = computed(() => {
  const normalized = normalizeProjectType(props.project.projectType);
  if (normalized !== "springboot") {
    return normalized || props.project.projectType;
  }
  // 兼容历史数据：此前“容器服务”可能被按 springboot 保存，展示时回显为容器服务。
  const hasSpringBootRuntimeConfig =
    Boolean(String(props.project.mainArtifact || "").trim()) ||
    Boolean(String(props.project.jvmArgs || "").trim()) ||
    Boolean(String(props.project.springArgs || "").trim()) ||
    Boolean(String(props.project.healthCheckUrl || "").trim()) ||
    Boolean(String(props.project.configDirectory || "").trim()) ||
    Boolean(String(props.project.libDirectory || "").trim());
  return hasSpringBootRuntimeConfig ? normalized : "service";
});
const isServiceProject = computed(() => displayProjectType.value === "service");
const isRunning = computed(() => runtimeStatus.value === "running");
const hasLogConfig = computed(
  () => !isStaticProject.value && Boolean(props.project.projectId),
);
const mainArtifact = computed(() => String(props.project.mainArtifact || "").trim());
const isJarArtifact = computed(() => /\.jar$/i.test(mainArtifact.value));
const canDownloadMainArtifact = computed(
  () =>
    !isTomcatProject.value &&
    isSpringBootProjectType(props.project.projectType) &&
    isJarArtifact.value,
);
const hasLifecycleScripts = computed(() =>
  isStaticProject.value ? false : hasRequiredLifecycleScripts(props.project),
);
const lifecycleModeLabel = computed(() =>
  resolveLifecycleModeLabel(props.project),
);
const startCommandPreview = computed(() =>
  resolveStartCommandPreview(props.project),
);
const lifecycleHint = computed(() => resolveLifecycleHint(props.project));
const isResourceSplitProject = computed(() =>
  isSpringBootResourceSplitType(props.project.projectType),
);
const loadingStateValue = computed(() => props.loadingState || {});
const isBusy = computed(() =>
  Object.values(loadingStateValue.value).some(Boolean),
);
const busyActionLabel = computed(() => {
  if (loadingStateValue.value.deploy || loadingStateValue.value.batchDeploy) {
    return "部署处理中";
  }
  if (loadingStateValue.value.restart) {
    return "重启处理中";
  }
  if (loadingStateValue.value.stop) {
    return "停止处理中";
  }
  if (loadingStateValue.value.start) {
    return "启动处理中";
  }
  if (loadingStateValue.value.backup) {
    return "备份处理中";
  }
  if (loadingStateValue.value.rollback) {
    return "回滚处理中";
  }
  return "处理中";
});
const startDisabled = computed(
  () =>
    isStaticProject.value ||
    !hasLifecycleScripts.value ||
    isRunning.value ||
    Boolean(loadingStateValue.value.stop || loadingStateValue.value.restart),
);
const stopDisabled = computed(
  () =>
    isStaticProject.value ||
    !hasLifecycleScripts.value ||
    !isRunning.value ||
    Boolean(loadingStateValue.value.start || loadingStateValue.value.restart),
);
const restartDisabled = computed(
  () =>
    isStaticProject.value ||
    !hasLifecycleScripts.value ||
    Boolean(loadingStateValue.value.start || loadingStateValue.value.stop),
);
const startActionTooltip = computed(() =>
  hasLifecycleScripts.value
    ? isRunning.value
      ? "项目正在运行"
      : "启动"
    : "请先补齐启动脚本",
);
const stopActionTooltip = computed(() =>
  hasLifecycleScripts.value
    ? isRunning.value
      ? "停止"
      : "项目未运行"
    : "请先补齐启动脚本",
);
const restartActionTooltip = computed(() =>
  hasLifecycleScripts.value ? "重启" : "请先补齐启动脚本",
);
const downloadActionTooltip = computed(() =>
  canDownloadMainArtifact.value ? "下载主体文件（jar）" : "仅 SpringBoot 系列支持 jar 下载",
);

const onDragOver = (event: DragEvent) => {
  if (
    isBusy.value ||
    !event.dataTransfer?.files?.length ||
    (!isSpringBootProjectType(props.project.projectType) &&
      !isTomcatProject.value &&
      !isStaticProject.value)
  ) {
    return;
  }
  const file = event.dataTransfer.files[0];
  const lowerName = file?.name?.toLowerCase() || "";
  const isArchive =
    lowerName.endsWith(".zip") ||
    lowerName.endsWith(".tar.gz") ||
    lowerName.endsWith(".tgz");
  const isSingleSpringBoot =
    isSpringBootProjectType(props.project.projectType) &&
    !isSpringBootResourceSplitType(props.project.projectType);
  const isStaticArchive = isStaticProject.value && isArchive;
  const isTomcatPackage =
    isTomcatProject.value &&
    (lowerName.endsWith(".war") || lowerName.endsWith(".ear"));
  if (isTomcatProject.value && !isTomcatPackage) {
    return;
  }
  if (isSingleSpringBoot && !lowerName.endsWith(".jar")) {
    return;
  }
  if (
    !isSingleSpringBoot &&
    !isStaticArchive &&
    !isSpringBootResourceSplitType(props.project.projectType)
  ) {
    return;
  }
  if (
    isSpringBootResourceSplitType(props.project.projectType) &&
    !lowerName.includes(".")
  ) {
    return;
  }
  dragOver.value = true;
};

const onDrop = (event: DragEvent) => {
  dragOver.value = false;
  if (isBusy.value) return;
  const file = event.dataTransfer?.files?.[0];
  if (
    !file ||
    (!isSpringBootProjectType(props.project.projectType) &&
      !isTomcatProject.value &&
      !isStaticProject.value) ||
    (isTomcatProject.value &&
      !(
        file.name.toLowerCase().endsWith(".war") ||
        file.name.toLowerCase().endsWith(".ear")
      )) ||
    (isStaticProject.value &&
      !(
        file.name.toLowerCase().endsWith(".zip") ||
        file.name.toLowerCase().endsWith(".tar.gz") ||
        file.name.toLowerCase().endsWith(".tgz")
      )) ||
    (!isStaticProject.value &&
      !isSpringBootResourceSplitType(props.project.projectType) &&
      !file.name.toLowerCase().endsWith(".jar"))
  ) {
    return;
  }
  emit("deploy-drop", props.project, file);
};

const projectIcon = computed(() => {
  switch (normalizeProjectType(props.project.projectType)) {
    case "springboot":
    case "springboot_resource_isolation":
      return "simple-icons:springboot";
    case "docker":
      return "simple-icons:docker";
    case "nodejs":
      return "simple-icons:nodedotjs";
    case "python":
      return "simple-icons:python";
    case "static":
      return "ep:monitor";
    default:
      return "ep:folder-opened";
  }
});
</script>

<style scoped lang="scss">
.project-card {
  position: relative;
  display: grid;
  gap: 16px;
  min-height: 280px;
  padding: 22px;
  border-radius: 26px;
  background:
    radial-gradient(
      circle at top right,
      rgba(96, 165, 250, 0.18),
      transparent 26%
    ),
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.98),
      rgba(248, 250, 252, 0.96)
    );
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow:
      0 26px 54px rgba(15, 23, 42, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.92);
  }

  &.is-selected {
    border-color: rgba(37, 99, 235, 0.45);
    box-shadow:
      0 20px 46px rgba(37, 99, 235, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.92);
  }

  &.is-dragover {
    border-color: rgba(14, 116, 144, 0.7);
    box-shadow:
      0 0 0 3px rgba(14, 116, 144, 0.14),
      0 22px 48px rgba(15, 23, 42, 0.14);
  }
}

.project-card__drop-mask {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  border-radius: 26px;
  border: 2px dashed rgba(14, 116, 144, 0.8);
  background: rgba(236, 254, 255, 0.86);
  color: #0f5f7a;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  padding: 14px;
}

.project-card__loading-mask {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 18px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(8px);
}

.project-card__loading-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(59, 130, 246, 0.16);
  border-top-color: #2563eb;
  animation: project-card-spin 0.9s linear infinite;
}

.project-card__loading-copy {
  display: grid;
  gap: 4px;

  strong {
    color: #0f172a;
    font-size: 14px;
  }

  span {
    color: #475569;
    font-size: 12px;
  }
}

.project-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.project-card__identity {
  display: flex;
  gap: 14px;
  min-width: 0;
}

.project-card__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(
    145deg,
    rgba(37, 99, 235, 0.18),
    rgba(14, 165, 233, 0.08)
  );
  color: #2563eb;
  font-size: 24px;
  flex-shrink: 0;
}

.project-card__titles {
  min-width: 0;
}

.project-card__eyebrow {
  margin: 2px 0 6px;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #60a5fa;
}

.project-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.project-card__service-entry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.12);
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: #1e3a8a;
    background: rgba(37, 99, 235, 0.2);
  }
}

.project-card__name {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
  max-width: 50px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.project-card__path {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
  word-break: break-all;
}

.project-card__badges {
  display: grid;
  gap: 8px;
  justify-items: end;
}

.project-card__info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 11px;
  font-weight: 700;
  cursor: help;
}

.project-card__selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.24);
  background: rgba(239, 246, 255, 0.78);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;

  input {
    width: 14px;
    height: 14px;
    margin: 0;
    cursor: pointer;
  }
}

.project-card__status,
.project-card__pid {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  word-break: keep-all;
  width: max-content;
}

.project-card__status {
  &.is-running {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
    white-space: nowrap;
    word-break: keep-all;
    overflow-wrap: normal;
  }

  &.is-stopped,
  &.is-unknown {
    background: rgba(148, 163, 184, 0.14);
    color: #475569;
  }

  &.is-error {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
  }
}

.project-card__pid {
  background: rgba(15, 23, 42, 0.04);
  color: #334155;
}

.project-card__summary {
  display: grid;
  gap: 10px;
}

.project-card__summary-item {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.86);
  border: 1px solid rgba(226, 232, 240, 0.88);

  span {
    font-size: 12px;
    color: #94a3b8;
  }

  strong {
    font-size: 13px;
    color: #0f172a;
    word-break: break-word;
  }
}

.project-card__tooltip {
  display: grid;
  gap: 8px;
  max-width: 320px;
}

.project-card__tooltip-item {
  display: grid;
  gap: 4px;

  span {
    font-size: 11px;
    color: #64748b;
  }

  strong {
    color: #0f172a;
    font-size: 12px;
    font-weight: 600;
    word-break: break-word;
    line-height: 1.5;
  }
}

.project-card__top-tools {
  position: static;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  min-height: 0;
}

.project-card__group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-card__group--controls {
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}

.project-card__group--toolbar {
  display: flex;
  position: absolute;
  top: auto;
  right: 0;
  bottom: 0;
  justify-content: flex-end;
  align-content: flex-end;
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  max-width: calc(100% - 36px);
}

.project-card__toolbar-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 300px;
  row-gap: 8px;
  column-gap: 8px;
  padding: 6px 8px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(248, 250, 252, 0.88);
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  position: relative;
  z-index: 6;
}

.project-card__toolbar-strip.is-service-toolbar {
  cursor: pointer;
}

.project-card__tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.1);
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    color: #1e3a8a;
    background: rgba(37, 99, 235, 0.18);
  }

  &.is-danger {
    color: #dc2626;
    background: rgba(220, 38, 38, 0.12);
  }

  &.is-danger:hover {
    color: #991b1b;
    background: rgba(220, 38, 38, 0.2);
  }

  &.is-disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.is-loading {
    animation: project-card-spin 0.9s linear infinite;
  }
}

.project-card:hover .project-card__group--toolbar,
.project-card:focus-within .project-card__group--toolbar {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

@media (max-width: 768px) {
  .project-card__head,
  .project-card__top-tools {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-card__badges {
    justify-items: start;
  }

  .project-card__group--toolbar {
    position: static;
    opacity: 1;
    transform: none;
    pointer-events: auto;
    justify-content: flex-end;
    max-width: none;
  }
}

@keyframes project-card-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
