<template>
  <ScDialog
    v-model="visible"
    :title="`部署 · ${project?.projectName || ''}`"
    width="760px"
    append-to-body
    destroy-on-close
  >
    <div
      class="deploy-drop"
      :class="{ 'is-drag': dragOver }"
      @click="openFilePicker"
      @dragover.prevent="$emit('update:dragOver', true)"
      @dragleave.prevent="$emit('update:dragOver', false)"
      @drop.prevent="onDrop"
    >
      <template v-if="deployFile">
        <IconifyIconOnline icon="ep:document" class="deploy-drop__icon" />
        <p class="deploy-drop__name">{{ deployFile.name }}</p>
        <p class="deploy-drop__size">{{ formatSize(deployFile.size) }}</p>
      </template>
      <template v-else>
        <IconifyIconOnline icon="ep:upload" class="deploy-drop__icon" />
        <p>拖拽或点击上传部署包</p>
        <p class="deploy-drop__hint">{{ deployHint }}</p>
      </template>
    </div>

    <input
      ref="fileInputRef"
      class="deploy-hidden-input"
      type="file"
      :accept="fileAccept"
      @change="onFileChange"
    />

    <div v-if="uploadTargets.length" class="deploy-targets">
      <button
        v-for="target in uploadTargets"
        :key="target.key"
        class="deploy-target-card"
        :class="{ 'is-active': target.directory === targetDirectory }"
        type="button"
        @click="$emit('update:targetDirectory', target.directory)"
      >
        <strong>{{ target.label }}</strong>
        <span>{{ target.directory }}</span>
      </button>
    </div>

    <div class="deploy-options">
      <div v-if="!isStaticProject" class="deploy-option">
        <span>部署前停止服务</span>
        <el-switch v-model="options.stopBeforeDeploy" />
      </div>
      <div v-if="!isStaticProject" class="deploy-option">
        <span>部署后自动启动</span>
        <el-switch v-model="options.startAfterDeploy" />
      </div>
      <div class="deploy-option">
        <span>部署前先备份</span>
        <el-switch v-model="options.backupBefore" />
      </div>
      <div class="deploy-option">
        <span>清空目标目录</span>
        <el-switch v-model="options.uploadOptions!.clearBefore" />
      </div>
      <div class="deploy-option">
        <span>自动解压部署包</span>
        <el-switch v-model="options.uploadOptions!.autoExtract" />
      </div>
      <div class="deploy-option">
        <span>解压后删除压缩包</span>
        <el-switch v-model="options.uploadOptions!.deleteArchiveAfterExtract" />
      </div>
      <div class="deploy-option">
        <span>部署前配置核对</span>
        <el-switch v-model="options.configCheckBeforeDeploy" />
      </div>
      <div class="deploy-option">
        <span>部署前依赖核对</span>
        <el-switch v-model="options.dependencyCheckBeforeDeploy" />
      </div>
    </div>
    <div class="deploy-static-tip">
      所有项目统一走脚本化流程：建议始终维护启动脚本与停止脚本，部署策略按当前开关执行。
    </div>

    <el-progress v-if="deploying" :percentage="progress" :status="status" class="deploy-progress" />

    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton type="primary" :loading="deploying" :disabled="!deployFile" @click="$emit('deploy')">
        开始部署
      </ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import type {
  RemoteDeployOptions,
  RemoteProject,
} from "../../api/manage/remote";
import {
  formatSize,
  isSpringBootResourceSplitType,
  isStaticProjectType,
  isTomcatProjectType,
} from "./projectPanelShared";

type UploadTarget = {
  key: string;
  label: string;
  directory: string;
};

const props = defineProps<{
  modelValue: boolean;
  project: RemoteProject | null;
  deployFile: File | null;
  dragOver: boolean;
  targetDirectory?: string;
  uploadTargets?: UploadTarget[];
  deploying: boolean;
  progress: number;
  status: "" | "success" | "exception";
  options: RemoteDeployOptions;
}>();

const emit = defineEmits<{
  (e: "deploy"): void;
  (e: "file-change", file: File | null): void;
  (e: "update:dragOver", value: boolean): void;
  (e: "update:targetDirectory", value: string): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
});
const uploadTargets = computed(() => props.uploadTargets || []);
const targetDirectory = computed(() => props.targetDirectory || "");
const deployHint = computed(() =>
  isTomcatProjectType(props.project?.projectType)
    ? "仅支持 .war、.ear 部署包"
    : isStaticProjectType(props.project?.projectType)
      ? "仅支持 zip、tar.gz、tgz 压缩包并解压到目录"
      : uploadTargets.value.length
    ? "支持单文件或 zip、tar.gz 等压缩包，可切换目标目录上传"
    : "仅支持 .jar 部署包",
);
const isStaticProject = computed(() =>
  isStaticProjectType(props.project?.projectType),
);
const fileAccept = computed(() => {
  if (isTomcatProjectType(props.project?.projectType)) {
    return ".war,.ear";
  }
  if (isStaticProjectType(props.project?.projectType)) {
    return ".zip,.tar.gz,.tgz";
  }
  if (isSpringBootResourceSplitType(props.project?.projectType)) {
    return ".jar,.war,.zip,.tar.gz,.tgz";
  }
  return ".jar";
});

const fileInputRef = ref<HTMLInputElement | null>(null);

const openFilePicker = () => {
  fileInputRef.value?.click();
};

const onFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] || null;
  emit("file-change", file);
};

const onDrop = (event: DragEvent) => {
  emit("update:dragOver", false);
  emit("file-change", event.dataTransfer?.files?.[0] || null);
};
</script>

<style scoped lang="scss">
.deploy-drop {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 34px 20px;
  border-radius: 24px;
  border: 2px dashed rgba(148, 163, 184, 0.3);
  background: linear-gradient(145deg, rgba(248, 250, 252, 0.96), rgba(239, 246, 255, 0.72));
  color: #475569;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &.is-drag,
  &:hover {
    border-color: #38bdf8;
    transform: translateY(-1px);
  }
}

.deploy-drop__icon {
  font-size: 34px;
  color: #2563eb;
}

.deploy-drop__name,
.deploy-drop__size,
.deploy-drop__hint {
  margin: 0;
}

.deploy-drop__name {
  font-weight: 700;
  color: #0f172a;
}

.deploy-drop__hint,
.deploy-drop__size {
  font-size: 12px;
  color: #64748b;
}

.deploy-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin-top: 18px;
}

.deploy-targets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.deploy-target-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(248, 250, 252, 0.92);
  text-align: left;
  transition: all 0.2s ease;

  strong {
    color: #0f172a;
    font-size: 13px;
  }

  span {
    color: #64748b;
    font-size: 12px;
    word-break: break-all;
  }

  &.is-active {
    border-color: rgba(59, 130, 246, 0.28);
    background: rgba(239, 246, 255, 0.9);
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
  }
}

.deploy-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.92);
  color: #334155;
  font-size: 14px;
}

.deploy-progress {
  margin-top: 16px;
}

.deploy-static-tip {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(14, 116, 144, 0.2);
  background: rgba(236, 254, 255, 0.8);
  color: #0f4c5c;
  font-size: 12px;
  line-height: 1.6;
}

.deploy-hidden-input {
  display: none;
}

@media (max-width: 900px) {
  .deploy-options {
    grid-template-columns: 1fr;
  }
}
</style>
