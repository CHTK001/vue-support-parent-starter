<template>
  <section class="colorization-workbench system-container modern-bg">
    <div class="chat-like-header">
      <ScButton
        circle
        type="default"
        class="chat-like-header__back"
        @click="handleBackPage"
      >
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">图像上色</span>
        <span class="chat-like-header__subtitle">{{ activeModule?.sysAiModuleName || "选择模型后开始处理" }}</span>
      </div>
      <div class="chat-like-header__actions">
        <el-select
          v-model="form.sysAiModuleCode"
          class="chat-like-header__model"
          placeholder="选择模型"
          size="default"
          :disabled="submitting"
        >
          <el-option
            v-for="item in modules"
            :key="item.sysAiModuleCode"
            :label="item.sysAiModuleName || item.sysAiModuleCode"
            :value="item.sysAiModuleCode"
          >
            <div class="colorization-workbench__model-option">
              <span>{{ item.sysAiModuleName || item.sysAiModuleCode }}</span>
              <small>{{ item.sysAiModuleCode }}</small>
            </div>
          </el-option>
        </el-select>
        <el-tooltip content="重新选择" placement="bottom">
          <ScButton size="small" :disabled="!sourcePreview || submitting" @click="resetTask">
            <IconifyIconOnline icon="ri:refresh-line" />
          </ScButton>
        </el-tooltip>
        <el-tooltip content="开始上色" placement="bottom">
          <el-button
            type="primary"
            size="small"
            :loading="submitting && !resultImage"
            :disabled="!canSubmit"
            @click="submitTask"
          >
            <IconifyIconOnline icon="ri:magic-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <main class="colorization-workbench__stage">
      <div
        v-if="!resultImage && !blurredResultImage"
        class="colorization-workbench__dropzone"
        :class="{
          'is-dragging': dragging,
          'is-filled': !!sourcePreview,
          'is-loading': submitting,
        }"
        @click="openFilePicker"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInputRef"
          class="colorization-workbench__file"
          type="file"
          accept="image/*"
          @change="handleFileChange"
        />

        <div v-if="sourcePreview" class="colorization-workbench__preview">
          <img :src="sourcePreview" alt="原图" />
          <div v-if="submitting" class="colorization-workbench__processing">
            <span class="colorization-workbench__spinner" />
            <strong>{{ progressText }}</strong>
          </div>
        </div>

        <div v-else class="colorization-workbench__empty">
          <span class="colorization-workbench__upload-icon">+</span>
          <strong>点击或拖拽上传黑白图片</strong>
          <small>支持 PNG / JPG / WEBP，不支持文字描述</small>
        </div>
      </div>

      <div
        v-else-if="blurredResultImage && submitting"
        class="colorization-workbench__dropzone is-filled is-loading"
      >
        <div class="colorization-workbench__preview">
          <img :src="blurredResultImage" alt="上色结果" :style="{ filter: `blur(${blurAmount}px)` }" />
          <div class="colorization-workbench__processing">
            <span class="colorization-workbench__spinner" />
            <strong>{{ progressText }}</strong>
          </div>
        </div>
      </div>

      <div v-else class="colorization-workbench__compare">
        <ScCompare
          :left-image="sourcePreview"
          left-image-label="原图"
          :right-image="resultImage"
          right-image-label="上色图"
          :style="{ width: '100%', height: '100%' }"
        />
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElOption, ElSelect, ElTooltip } from "element-plus";
import ScButton from "@repo/components/ScButton";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import ScCompare from "@repo/components/ScCompare";
import { message } from "@repo/utils";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import { createAiTask, getAiTask, type AiTaskRequest } from "../../../api/ai/task";

type TaskPayload = Record<string, any>;

const modules = ref<AiModule[]>([]);
const sourceFile = ref<File | null>(null);
const sourcePreview = ref("");
const resultImage = ref("");
const blurredResultImage = ref("");
const submitting = ref(false);
const dragging = ref(false);
const dragDepth = ref(0);
const taskStatus = ref("");
const progress = ref(0);
const fileInputRef = ref<HTMLInputElement | null>(null);
let pollTimer: number | undefined;

const router = useRouter();

const handleBackPage = () => {
  router.push("/ai/home");
};

const form = reactive<AiTaskRequest>({
  sysAiModuleCode: "",
  prompt: "图像上色",
  sourceUrl: "",
  sourceContent: "",
});

const activeModule = computed(() =>
  modules.value.find((item) => item.sysAiModuleCode === form.sysAiModuleCode),
);

const canSubmit = computed(
  () => !!form.sysAiModuleCode && !!sourcePreview.value && !submitting.value,
);

const progressText = computed(() => {
  if (progress.value > 0 && progress.value < 100) {
    return `上色中 ${progress.value}%`;
  }
  return taskStatus.value ? `上色中 ${taskStatus.value}` : "上色中";
});

const blurAmount = computed(() => {
  const p = progress.value;
  if (p >= 100) return 0;
  if (p >= 90) return 2;
  if (p >= 75) return 5;
  if (p >= 60) return 9;
  if (p >= 40) return 14;
  return 20;
});

const loadModules = async () => {
  const res = await listAiModules("COLORIZATION");
  modules.value = (res.data || []).filter((item) => item.sysAiModuleStatus !== 0);
  const localOnnxModule = modules.value.find(
    (item) => item.sysAiModuleCode === "local-onnx-colorization",
  );
  if (localOnnxModule) {
    form.sysAiModuleCode = localOnnxModule.sysAiModuleCode;
  } else if (!form.sysAiModuleCode && modules.value.length > 0) {
    form.sysAiModuleCode = modules.value[0].sysAiModuleCode;
  }
};

const openFilePicker = () => {
  if (!submitting.value) {
    fileInputRef.value?.click();
  }
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await applyFile(file);
  }
  target.value = "";
};

const handleDragEnter = () => {
  dragDepth.value += 1;
  dragging.value = true;
};

const handleDragLeave = () => {
  dragDepth.value = Math.max(0, dragDepth.value - 1);
  dragging.value = dragDepth.value > 0;
};

const handleDrop = async (event: DragEvent) => {
  dragging.value = false;
  dragDepth.value = 0;
  if (submitting.value) {
    return;
  }
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    await applyFile(file);
  }
};

const applyFile = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    message("请选择图片文件", { type: "warning" });
    return;
  }
  sourceFile.value = file;
  resultImage.value = "";
  blurredResultImage.value = "";
  const dataUrl = await readFileAsDataUrl(file);
  sourcePreview.value = dataUrl;
  form.sourceUrl = dataUrl;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const submitTask = async () => {
  if (!form.sysAiModuleCode) {
    message("请先选择模型", { type: "warning" });
    return;
  }
  if (!sourcePreview.value) {
    message("请先上传图片", { type: "warning" });
    return;
  }
  submitting.value = true;
  resultImage.value = "";
  blurredResultImage.value = "";
  taskStatus.value = "PENDING";
  progress.value = 5;
  clearPollTimer();
  try {
    const res = await createAiTask("COLORIZATION", {
      ...form,
      prompt: sourceFile.value?.name ? `图像上色：${sourceFile.value.name}` : "图像上色",
    });
    const task = res.data as TaskPayload;
    const image = resolveResultImage(task);
    if (image) {
      blurredResultImage.value = image;
      const taskId = Number(task?.sysAiTaskId || task?.taskId);
      if (taskId) {
        startPolling(taskId);
      }
      return;
    }
    const taskId = Number(task?.sysAiTaskId || task?.taskId);
    if (!taskId) {
      throw new Error("任务创建失败");
    }
    startPolling(taskId);
  } catch (error: any) {
    submitting.value = false;
    message(error?.message || "图像上色失败", { type: "error" });
  }
};

const startPolling = (taskId: number) => {
  void pollTask(taskId);
  pollTimer = window.setInterval(() => {
    void pollTask(taskId);
  }, 1800);
};

const pollTask = async (taskId: number) => {
  const res = await getAiTask(taskId);
  const task = res.data as TaskPayload;
  taskStatus.value = String(task?.taskStatus || task?.output?.taskStatus || "");
  progress.value = Number(task?.progress || 0);
  const image = resolveResultImage(task);
  if (image) {
    blurredResultImage.value = image;
    if (progress.value >= 100 || ["SUCCESS", "COMPLETED"].includes(taskStatus.value.toUpperCase())) {
      const finalImage = blurredResultImage.value;
      resultImage.value = finalImage;
      blurredResultImage.value = "";
      submitting.value = false;
      clearPollTimer();
      message("图像上色完成", { type: "success" });
    }
    return;
  }
  if (["FAILED", "ERROR"].includes(taskStatus.value.toUpperCase())) {
    clearPollTimer();
    submitting.value = false;
    blurredResultImage.value = "";
    message(String(task?.message || "图像上色失败"), { type: "error" });
  }
};

const resolveResultImage = (task: TaskPayload) => {
  const candidates = [
    task?.previewUrl,
    task?.output?.previewUrl,
    firstImage(task?.images),
    firstImage(task?.output?.images),
    firstResultUrl(task?.results),
    firstResultUrl(task?.output?.results),
  ];
  if (typeof task?.sysAiTaskResult === "string") {
    try {
      const result = JSON.parse(task.sysAiTaskResult);
      candidates.push(
        result?.previewUrl,
        firstImage(result?.images),
        firstResultUrl(result?.results),
      );
    } catch {
    }
  }
  return candidates.find((item) => typeof item === "string" && item.trim()) || "";
};

const firstImage = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return "";
};

const firstResultUrl = (value: unknown) => {
  if (!Array.isArray(value)) {
    return "";
  }
  const first = value[0];
  if (typeof first === "string") {
    return first;
  }
  if (first && typeof first === "object") {
    return String((first as Record<string, unknown>).url || "");
  }
  return "";
};

const resetTask = () => {
  clearPollTimer();
  sourceFile.value = null;
  sourcePreview.value = "";
  resultImage.value = "";
  blurredResultImage.value = "";
  form.sourceUrl = "";
  form.sourceContent = "";
  submitting.value = false;
  taskStatus.value = "";
  progress.value = 0;
};

const clearPollTimer = () => {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
};

onMounted(loadModules);
onBeforeUnmount(clearPollTimer);
</script>

<style scoped lang="scss">
.colorization-workbench {
  height: 100%;
  display: grid;
  padding: 0px;
  grid-template-rows: auto 1fr;
  gap: 18px;
  background: var(--el-bg-color-page);
}

.colorization-workbench {
  background: var(--el-bg-color-page);
}

.chat-like-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
  margin-bottom: 6px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
}

.chat-like-header {
  background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
}


.chat-like-header__back {
  flex-shrink: 0;
}

.chat-like-header__title-wrap {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.chat-like-header__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.chat-like-header__subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-like-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-like-header__model {
  width: 200px;
}

.colorization-workbench__model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  small {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}

.colorization-workbench__stage {
  min-height: 0;
  height: 100%;
}

.colorization-workbench__dropzone,
.colorization-workbench__compare {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 8px;
}

.colorization-workbench__dropzone {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: 1px dashed color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 14%, transparent),
    0 24px 60px rgba(15, 23, 42, 0.08);
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;

  &.is-dragging {
    border-color: var(--el-color-primary);
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--el-bg-color) 86%, var(--el-color-primary));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 28%, transparent),
      0 30px 70px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  }

  &.is-filled {
    border-style: solid;
    background: #0f172a;
  }

  &.is-loading {
    cursor: wait;
  }
}

.colorization-workbench__file {
  display: none;
}

.colorization-workbench__empty {
  display: grid;
  place-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);

  strong {
    font-size: 22px;
  }

  small {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.colorization-workbench__upload-icon {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #e8f3ff;
  font-size: 44px;
  font-weight: 300;
  background: var(--el-color-primary);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--el-color-primary) 24%, transparent);
}

.colorization-workbench__preview {
  position: absolute;
  inset: 0;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    background: #0f172a;
  }
}

.colorization-workbench__processing {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.62);

  strong {
    font-size: 18px;
    font-weight: 700;
  }
}

.colorization-workbench__spinner {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.34);
  border-top-color: #34d399;
  animation: colorization-spin 0.86s linear infinite;
}

.colorization-workbench__compare {
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 26px 64px rgba(15, 23, 42, 0.14);
}

@keyframes colorization-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .colorization-workbench {
    padding: 0 12px 12px;
  }

  .colorization-workbench__bar,
  .colorization-workbench__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .colorization-workbench__model {
    width: 100%;
  }

  .colorization-workbench__dropzone,
  .colorization-workbench__compare {
    height: 100%;
    min-height: 0;
  }
}
</style>
