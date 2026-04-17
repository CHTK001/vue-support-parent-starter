<template>
  <ScDialog
    v-model="visible"
    title="上传文件"
    width="640px"
    destroy-on-close
    layout="simple"
  >
    <!-- 上传区域 -->
    <div
      class="upload-drop-zone"
      :class="{ 'is-drag': isDrag }"
      @dragover.prevent="isDrag = true"
      @dragleave.prevent="isDrag = false"
      @drop.prevent="onDrop"
      @click="fileInputRef?.click()"
    >
      <template v-if="file">
        <IconifyIconOnline icon="ep:document" class="file-icon" />
        <p class="file-name">{{ file.name }}</p>
        <p class="file-size">{{ formatSize(file.size) }}</p>
      </template>
      <template v-else>
        <IconifyIconOnline icon="ri:upload-cloud-2-line" class="upload-icon" />
        <p>拖拽文件到此处，或点击选择</p>
        <p class="hint">支持 .jar .war .zip .tar.gz</p>
      </template>
    </div>
    <input ref="fileInputRef" type="file" class="hidden-input" @change="onFileChange" />

    <!-- 上传配置 -->
    <div class="upload-options">
      <div class="options-title">
        <IconifyIconOnline icon="ri:settings-3-line" />
        <span>上传配置</span>
        <el-tag size="small" type="info" class="ml-2">继承全局设置</el-tag>
      </div>
      <div class="options-grid">
        <div class="option-item">
          <el-switch v-model="opts.autoExtract" />
          <span>自动解压</span>
        </div>
        <div class="option-item">
          <el-switch v-model="opts.clearLib" :disabled="opts.compareLib" />
          <span>清空依赖目录</span>
          <el-tooltip content="上传前清空 lib 目录，适合全量替换" placement="top">
            <IconifyIconOnline icon="ri:information-line" class="info-icon" />
          </el-tooltip>
        </div>
        <div class="option-item">
          <el-switch v-model="opts.compareLib" :disabled="opts.clearLib" />
          <span>对比依赖（仅替换变更）</span>
        </div>
        <div class="option-item">
          <el-switch v-model="opts.clearConfig" :disabled="opts.compareConfig" />
          <span>清空配置目录</span>
        </div>
        <div class="option-item">
          <el-switch v-model="opts.compareConfig" :disabled="opts.clearConfig" />
          <span>对比配置（仅替换变更）</span>
        </div>
        <div class="option-item">
          <el-switch v-model="opts.autoRestart" />
          <span>上传后自动重启</span>
        </div>
      </div>
    </div>

    <!-- 目标项目列表 -->
    <div class="target-projects">
      <div class="options-title">
        <IconifyIconOnline icon="ri:apps-line" />
        <span>目标项目（{{ targets.length }}）</span>
      </div>
      <div v-for="p in targets" :key="p.projectId" class="project-row">
        <span class="project-name">{{ p.projectName }}</span>
        <el-progress
          v-if="progressMap[p.projectId!] !== undefined"
          :percentage="progressMap[p.projectId!]"
          :status="progressMap[p.projectId!] === 100 ? 'success' : ''"
          class="progress"
        />
        <span v-else class="status-pending">等待上传</span>
      </div>
    </div>

    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton
        type="primary"
        :loading="uploading"
        :disabled="!file || !targets.length"
        @click="handleUpload"
      >
        开始上传
      </ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import { message } from "@repo/utils";
import type { SysProject, ProjectUploadOptions } from "../../api/manage/project";
import { fetchUploadProjectFile } from "../../api/manage/project";

const LS_KEY = "project_upload_settings";

const visible = ref(false);
const targets = ref<SysProject[]>([]);
const file = ref<File | null>(null);
const isDrag = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const progressMap = reactive<Record<number, number>>({});

const loadGlobalSettings = (): ProjectUploadOptions => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch { return {}; }
};

const opts = reactive<ProjectUploadOptions>({
  autoExtract: true,
  clearLib: false,
  compareLib: false,
  clearConfig: false,
  compareConfig: false,
  autoRestart: false,
  ...loadGlobalSettings(),
});

const open = (projects: SysProject[], preFile?: File) => {
  targets.value = projects;
  file.value = preFile ?? null;
  Object.assign(opts, { autoExtract: true, clearLib: false, compareLib: false, clearConfig: false, compareConfig: false, autoRestart: false, ...loadGlobalSettings() });
  Object.keys(progressMap).forEach((k) => delete progressMap[+k]);
  visible.value = true;
};

const onDrop = (e: DragEvent) => {
  isDrag.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) file.value = f;
};

const onFileChange = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) file.value = f;
};

const handleUpload = async () => {
  if (!file.value) return;
  uploading.value = true;
  let success = 0, fail = 0;
  for (const p of targets.value) {
    progressMap[p.projectId!] = 10;
    try {
      await fetchUploadProjectFile(p.projectId!, file.value, { ...opts });
      progressMap[p.projectId!] = 100;
      success++;
    } catch {
      progressMap[p.projectId!] = -1;
      fail++;
    }
  }
  uploading.value = false;
  message(`上传完成：成功 ${success}，失败 ${fail}`, { type: fail ? "warning" : "success" });
  if (!fail) setTimeout(() => { visible.value = false; }, 1500);
};

const formatSize = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.upload-drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
  &:hover, &.is-drag { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
}
.upload-icon { font-size: 40px; margin-bottom: 8px; }
.file-icon { font-size: 40px; color: var(--el-color-primary); }
.file-name { font-weight: 600; color: var(--el-text-color-primary); margin: 4px 0; }
.file-size { font-size: 12px; }
.hint { font-size: 12px; margin-top: 4px; }
.hidden-input { display: none; }
.upload-options, .target-projects { margin-bottom: 16px; }
.options-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; margin-bottom: 10px; color: var(--el-text-color-primary); }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.option-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.info-icon { font-size: 14px; color: var(--el-text-color-secondary); cursor: help; }
.project-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.project-name { flex: 0 0 140px; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.progress { flex: 1; }
.status-pending { font-size: 12px; color: var(--el-text-color-secondary); }
.ml-2 { margin-left: 8px; }
</style>
