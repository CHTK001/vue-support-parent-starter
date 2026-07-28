<template>
  <section class="face-detection-workbench system-container modern-bg">
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
        <span class="chat-like-header__title">人脸检测</span>
        <span class="chat-like-header__subtitle">{{ activeModule?.sysAiModuleName || "选择模型后开始检测" }}</span>
      </div>
      <div class="chat-like-header__actions">
        <el-select
          v-model="selectedVendor"
          class="face-detection-workbench__vendor"
          placeholder="选择厂家"
          size="default"
          :disabled="submitting"
          @change="handleVendorChange"
        >
          <el-option label="全部厂家" value="" />
          <el-option
            v-for="item in vendorOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="form.sysAiModuleCode"
          class="face-detection-workbench__model"
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
            <div class="face-detection-workbench__model-option">
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
        <el-tooltip content="开始检测" placement="bottom">
          <el-button
            type="primary"
            size="small"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="submitTask"
          >
            <IconifyIconOnline icon="ri:magic-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <main class="face-detection-workbench__stage">
      <div
        v-if="!detectionResult"
        class="face-detection-workbench__dropzone"
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
          class="face-detection-workbench__file"
          type="file"
          accept="image/*"
          @change="handleFileChange"
        />

        <div v-if="sourcePreview" class="face-detection-workbench__preview">
          <img :src="sourcePreview" alt="原图" />
          <div v-if="submitting" class="face-detection-workbench__processing">
            <span class="face-detection-workbench__spinner" />
            <strong>{{ progressText }}</strong>
          </div>
        </div>

        <div v-else class="face-detection-workbench__empty">
          <span class="face-detection-workbench__upload-icon">+</span>
          <strong>点击或拖拽上传人脸图片</strong>
          <small>支持 PNG / JPG / WEBP，不支持文字描述</small>
        </div>
      </div>

      <div v-else class="face-detection-workbench__result">
        <div ref="imageWrapRef" class="face-detection-workbench__result-image-wrap">
          <img
            ref="resultImageRef"
            :src="sourcePreview"
            alt="检测结果"
            class="face-detection-workbench__result-img"
            @load="updateImageMetrics"
          />
          <div
            v-if="showFaceBoxes && detectionResult.faceCount > 0"
            class="face-detection-workbench__boxes-overlay"
          >
            <div
              v-for="(face, index) in detectionResult.faces"
              :key="index"
              class="face-detection-workbench__face-box"
              :style="getFaceBoxStyle(face)"
            >
              <span class="face-detection-workbench__face-box-label">{{ index + 1 }}</span>
            </div>
          </div>
          <div class="face-detection-workbench__badge">
            <span class="face-detection-workbench__badge-dot" :class="{ 'has-face': detectionResult.faceCount > 0 }" />
            检测到 {{ detectionResult.faceCount }} 个人脸
          </div>
        </div>
        <div class="face-detection-workbench__toolbar">
          <el-switch
            v-if="detectionResult.faceCount > 0"
            v-model="showFaceBoxes"
            active-text="标注框"
            inactive-text="原图"
          />
        </div>
        <details v-if="detectionResult.faceCount > 0" class="face-detection-workbench__details">
          <summary class="face-detection-workbench__details-summary">人脸详情 ({{ detectionResult.faceCount }})</summary>
          <div class="face-detection-workbench__details-list">
            <div
              v-for="(face, index) in detectionResult.faces"
              :key="index"
              class="face-detection-workbench__details-item"
            >
              <span class="face-detection-workbench__details-label">人脸 {{ index + 1 }}</span>
              <span class="face-detection-workbench__details-coords">
                位置: ({{ face.x }}, {{ face.y }}) - {{ face.width }}x{{ face.height }}
                <template v-if="face.confidence"> ({{ (face.confidence * 100).toFixed(1) }}%)</template>
              </span>
            </div>
          </div>
        </details>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElOption, ElSelect, ElSwitch, ElTooltip } from "element-plus";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { message } from "@repo/utils";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import { listAiManufacturers } from "../../../api/ai/manufacturer";
import {
  createAiTask,
  getAiTask,
  type AiTaskRequest,
} from "../../../api/ai/task";

interface FaceDetectionResult {
  faceCount: number;
  faces: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
  }>;
  imageWithBoxes?: string;
}

type TaskPayload = Record<string, any>;
type VendorOption = { label: string; value: string };
const LOCAL_ONNX_VENDOR = "local-onnx";

const modules = ref<AiModule[]>([]);
const vendorOptions = ref<VendorOption[]>([]);
const selectedVendor = ref("");
const sourceFile = ref<File | null>(null);
const sourcePreview = ref("");
const detectionResult = ref<FaceDetectionResult | null>(null);
const submitting = ref(false);
const dragging = ref(false);
const dragDepth = ref(0);
const taskStatus = ref("");
const progress = ref(0);
const fileInputRef = ref<HTMLInputElement | null>(null);
let pollTimer: number | undefined;

const showFaceBoxes = ref(true);
const resultImageRef = ref<HTMLImageElement | null>(null);
const imageWrapRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
const imgMetrics = reactive({
  naturalWidth: 0,
  naturalHeight: 0,
  displayWidth: 0,
  displayHeight: 0,
  offsetX: 0,
  offsetY: 0,
  elementOffsetX: 0,
  elementOffsetY: 0,
});

const updateImageMetrics = () => {
  const img = resultImageRef.value;
  if (!img) return;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const dw = img.clientWidth;
  const dh = img.clientHeight;
  if (nw === 0 || nh === 0 || dw === 0 || dh === 0) return;
  imgMetrics.naturalWidth = nw;
  imgMetrics.naturalHeight = nh;
  imgMetrics.elementOffsetX = img.offsetLeft;
  imgMetrics.elementOffsetY = img.offsetTop;
  const imgAspect = nw / nh;
  const containerAspect = dw / dh;
  if (imgAspect > containerAspect) {
    imgMetrics.displayWidth = dw;
    imgMetrics.displayHeight = dw / imgAspect;
    imgMetrics.offsetX = 0;
    imgMetrics.offsetY = (dh - imgMetrics.displayHeight) / 2;
  } else {
    imgMetrics.displayHeight = dh;
    imgMetrics.displayWidth = dh * imgAspect;
    imgMetrics.offsetX = (dw - imgMetrics.displayWidth) / 2;
    imgMetrics.offsetY = 0;
  }
};

const getFaceBoxStyle = (face: { x: number; y: number; width: number; height: number }) => {
  const scaleX = imgMetrics.displayWidth / (imgMetrics.naturalWidth || 1);
  const scaleY = imgMetrics.displayHeight / (imgMetrics.naturalHeight || 1);
  return {
    left: `${imgMetrics.offsetX + imgMetrics.elementOffsetX + face.x * scaleX}px`,
    top: `${imgMetrics.offsetY + imgMetrics.elementOffsetY + face.y * scaleY}px`,
    width: `${face.width * scaleX}px`,
    height: `${face.height * scaleY}px`,
  };
};

const router = useRouter();

const handleBackPage = () => {
  router.push("/ai/home");
};

const form = reactive<AiTaskRequest>({
  sysAiModuleCode: "",
  prompt: "人脸检测",
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
    return `检测中 ${progress.value}%`;
  }
  return taskStatus.value ? `检测中 ${taskStatus.value}` : "检测中";
});

const loadModules = async () => {
  const res = await listAiModules("FACE_DETECT", selectedVendor.value || undefined);
  const apiModules = (res.data || []).filter(
    (item) => item.sysAiModuleStatus !== 0,
  );
  modules.value = apiModules.filter((item) => {
    if (!selectedVendor.value) {
      return true;
    }
    const vendorCode = item.sysAiModuleVendor || item.sysAiModuleManufacturers || "";
    return vendorCode === selectedVendor.value;
  });
  const preferredModule = modules.value.find(
    (item) => item.sysAiModuleCode === form.sysAiModuleCode,
  );
  if (preferredModule) {
    form.sysAiModuleCode = preferredModule.sysAiModuleCode;
  } else if (modules.value.length > 0) {
    form.sysAiModuleCode = modules.value[0].sysAiModuleCode;
  }
};

const loadVendors = async () => {
  const res = await listAiManufacturers();
  const list = (res.data || []).filter((item) => item.sysAiManufacturerStatus !== 0);
  const options = list.map((item) => ({
    label: item.sysAiManufacturerName || item.sysAiManufacturerCode,
    value: item.sysAiManufacturerCode,
  }));
  if (!options.some((item) => item.value === LOCAL_ONNX_VENDOR)) {
    options.unshift({ label: "本地 ONNX", value: LOCAL_ONNX_VENDOR });
  }
  vendorOptions.value = options;
};

const handleVendorChange = async () => {
  form.sysAiModuleCode = "";
  await loadModules();
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
  detectionResult.value = null;
  const dataUrl = await readFileAsDataUrl(file);
  sourcePreview.value = dataUrl;
  form.sourceUrl = dataUrl;
  form.sourceContent = dataUrl;
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
  detectionResult.value = null;
  taskStatus.value = "PENDING";
  progress.value = 5;
  clearPollTimer();
  try {
    const res = await createAiTask("FACE_DETECT", {
      ...form,
      prompt: sourceFile.value?.name
        ? `人脸检测：${sourceFile.value.name}`
        : "人脸检测",
    });
    const task = res.data as TaskPayload;
    const result = resolveDetectionResult(task);
    if (result) {
      finishTask(result, task);
      return;
    }
    const taskId = Number(task?.sysAiTaskId || task?.taskId);
    if (!taskId) {
      throw new Error("任务创建失败");
    }
    startPolling(taskId);
  } catch (error: any) {
    submitting.value = false;
    message(error?.message || "人脸检测失败", { type: "error" });
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
  taskStatus.value = String(
    task?.taskStatus || task?.output?.taskStatus || "",
  );
  progress.value = Number(task?.progress || 0);
  const result = resolveDetectionResult(task);
  if (result) {
    finishTask(result, task);
    return;
  }
  if (["FAILED", "ERROR"].includes(taskStatus.value.toUpperCase())) {
    clearPollTimer();
    submitting.value = false;
    message(String(task?.message || "人脸检测失败"), { type: "error" });
  }
};

const finishTask = (result: FaceDetectionResult, task: TaskPayload) => {
  detectionResult.value = result;
  showFaceBoxes.value = true;
  taskStatus.value = String(
    task?.taskStatus || task?.output?.taskStatus || "SUCCESS",
  );
  progress.value = 100;
  submitting.value = false;
  clearPollTimer();
  nextTick(() => {
    updateImageMetrics();
    setupResizeObserver();
  });
  message("人脸检测完成", { type: "success" });
};

const resolveDetectionResult = (
  task: TaskPayload,
): FaceDetectionResult | null => {
  const taskResult = task?.sysAiTaskResult || task?.result;
  let parsed: TaskPayload = {};
  if (typeof taskResult === "string") {
    try {
      parsed = JSON.parse(taskResult);
    } catch {
      return null;
    }
  } else if (taskResult && typeof taskResult === "object") {
    parsed = taskResult as TaskPayload;
  }

  const faceCount =
    parsed?.faceCount ||
    parsed?.face_count ||
    parsed?.faces?.length ||
    0;
  const faces =
    parsed?.faces || parsed?.faceBoxes || parsed?.landmarks || [];
  const imageWithBoxes =
    parsed?.imageWithBoxes ||
    parsed?.image_with_boxes ||
    parsed?.previewUrl ||
    parsed?.resultImage ||
    "";

  if (faceCount > 0 || faces.length > 0) {
    return {
      faceCount,
      faces: Array.isArray(faces) ? faces : [],
      imageWithBoxes:
        typeof imageWithBoxes === "string" ? imageWithBoxes : "",
    };
  }

  if (task?.output) {
    const output = task.output as TaskPayload;
    const outFaceCount =
      output?.faceCount ||
      output?.face_count ||
      output?.faces?.length ||
      0;
    const outFaces =
      output?.faces || output?.faceBoxes || output?.landmarks || [];
    const outImageWithBoxes =
      output?.imageWithBoxes ||
      output?.image_with_boxes ||
      output?.previewUrl ||
      output?.resultImage ||
      "";
    if (outFaceCount > 0 || outFaces.length > 0) {
      return {
        faceCount: outFaceCount,
        faces: Array.isArray(outFaces) ? outFaces : [],
        imageWithBoxes:
          typeof outImageWithBoxes === "string" ? outImageWithBoxes : "",
      };
    }
  }

  return null;
};

const resetTask = () => {
  clearPollTimer();
  sourceFile.value = null;
  sourcePreview.value = "";
  detectionResult.value = null;
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

onMounted(async () => {
  await loadVendors();
  await loadModules();
});
onBeforeUnmount(() => {
  clearPollTimer();
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

const setupResizeObserver = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  const wrap = imageWrapRef.value;
  if (!wrap) return;
  resizeObserver = new ResizeObserver(() => {
    updateImageMetrics();
  });
  resizeObserver.observe(wrap);
};
</script>

<style scoped lang="scss">
.face-detection-workbench {
  min-height: 100%;
  height: 100%;
  display: grid;
  padding: 0px;
  grid-template-rows: auto 1fr;
  gap: 18px;
  background: var(--el-bg-color-page);
}

.face-detection-workbench {
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

.face-detection-workbench__model {
  width: 200px;
}

.face-detection-workbench__vendor {
  width: 180px;
}

.face-detection-workbench__model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  small {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}

.face-detection-workbench__stage {
  min-height: 0;
  height: 100%;
}

.face-detection-workbench__dropzone,
.face-detection-workbench__result {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 8px;
}

.face-detection-workbench__dropzone {
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
  transition: border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

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

.face-detection-workbench__file {
  display: none;
}

.face-detection-workbench__empty {
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

.face-detection-workbench__upload-icon {
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

.face-detection-workbench__preview {
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

.face-detection-workbench__processing {
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

.face-detection-workbench__spinner {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.34);
  border-top-color: #f59e0b;
  animation: face-detection-spin 0.86s linear infinite;
}

.face-detection-workbench__result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  background: #0f172a;
  border-radius: 8px;
  box-shadow: 0 26px 64px rgba(15, 23, 42, 0.14);
}

.face-detection-workbench__result-image-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}

.face-detection-workbench__result-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Face box overlay */
.face-detection-workbench__boxes-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.face-detection-workbench__face-box {
  position: absolute;
  border: 2px solid #34d399;
  border-radius: 4px;
  box-sizing: border-box;
}

.face-detection-workbench__face-box-label {
  position: absolute;
  top: -20px;
  left: -1px;
  background: #34d399;
  color: #0f172a;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px 3px 0 0;
  line-height: 1.5;
  white-space: nowrap;
}

/* Top-right badge */
.face-detection-workbench__badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(15, 23, 42, 0.7);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: none;
}

.face-detection-workbench__badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;

  &.has-face {
    background: #34d399;
  }
}

/* Toolbar */
.face-detection-workbench__toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px 10px;
  flex-shrink: 0;
}

/* Face details (collapsible) */
.face-detection-workbench__details {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.face-detection-workbench__details-summary {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: #e2e8f0;
  }
}

.face-detection-workbench__details-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 14px 12px;
}

.face-detection-workbench__details-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.face-detection-workbench__details-label {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.face-detection-workbench__details-coords {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

@keyframes face-detection-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .face-detection-workbench {
    padding: 0 12px 12px;
  }

  .face-detection-workbench__bar,
  .face-detection-workbench__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .face-detection-workbench__model {
    width: 100%;
  }

  .face-detection-workbench__vendor {
    width: 100%;
  }

  .face-detection-workbench__dropzone,
  .face-detection-workbench__result {
    height: 100%;
    min-height: 0;
  }

  .face-detection-workbench__result {
    height: auto;
    min-height: 0;
  }

  .face-detection-workbench__result-image-wrap {
    min-height: 300px;
  }
}
</style>
