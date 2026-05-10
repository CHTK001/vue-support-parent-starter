<template>
  <section class="face-compare-workbench system-container modern-bg">
    <!-- Header -->
    <div class="chat-like-header">
      <ScButton circle type="default" class="chat-like-header__back" @click="handleBackPage">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">人脸对比</span>
        <span class="chat-like-header__subtitle">{{ activeModule?.sysAiModuleName || "选择模型后开始比对" }}</span>
      </div>
      <div class="chat-like-header__actions">
        <el-select
          v-model="form.sysAiModuleCode"
          class="face-compare-workbench__model"
          placeholder="人脸检测模型"
          size="default"
          :disabled="submitting"
        >
          <el-option
            v-for="item in modules"
            :key="item.sysAiModuleCode"
            :label="item.sysAiModuleName || item.sysAiModuleCode"
            :value="item.sysAiModuleCode"
          >
            <div class="face-compare-workbench__model-option">
              <span>{{ item.sysAiModuleName || item.sysAiModuleCode }}</span>
              <small>{{ item.sysAiModuleCode }}</small>
            </div>
          </el-option>
        </el-select>
        <el-select
          v-model="form.faceFeatureModel"
          class="face-compare-workbench__model"
          placeholder="特征提取模型"
          size="default"
          :disabled="submitting"
        >
          <el-option
            v-for="item in featureModules"
            :key="item.sysAiModuleCode"
            :label="item.sysAiModuleName || item.sysAiModuleCode"
            :value="item.sysAiModuleCode"
          />
        </el-select>
        <el-switch
          v-model="form.faceEnhanceEnabled"
          active-text="增强"
          :disabled="submitting"
        />
        <el-select
          v-if="form.faceEnhanceEnabled"
          v-model="form.faceEnhanceModuleCode"
          class="face-compare-workbench__model"
          placeholder="增强模型"
          size="default"
          :disabled="submitting"
        >
          <el-option
            v-for="item in enhanceModules"
            :key="item.sysAiModuleCode"
            :label="item.sysAiModuleName || item.sysAiModuleCode"
            :value="item.sysAiModuleCode"
          />
        </el-select>
        <el-tooltip content="重新选择" placement="bottom">
          <ScButton size="small" :disabled="(!leftPreview && !rightPreview) || submitting" @click="resetTask">
            <IconifyIconOnline icon="ri:refresh-line" />
          </ScButton>
        </el-tooltip>
        <el-tooltip content="开始比对" placement="bottom">
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

    <!-- Main dual-upload / result area -->
    <main class="face-compare-workbench__stage">
      <!-- Initial state: dual upload -->
      <div v-if="!compareResult" class="face-compare-workbench__dual">
        <!-- Left upload -->
        <div
          class="face-compare-workbench__upload"
          :class="{
            'is-dragging': draggingSide === 'left',
            'is-filled': !!leftPreview,
            'is-loading': submitting,
          }"
          @click="openFilePicker('left')"
          @dragenter.prevent="handleDragEnter('left')"
          @dragover.prevent="draggingSide = 'left'"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop($event, 'left')"
        >
          <input
            ref="leftFileInput"
            class="face-compare-workbench__file"
            type="file"
            accept="image/*"
            @change="handleFileChange($event, 'left')"
          />
          <div v-if="leftPreview" class="face-compare-workbench__preview">
            <img :src="leftPreview" alt="左图" />
          </div>
          <div v-else class="face-compare-workbench__empty">
            <span class="face-compare-workbench__upload-icon">+</span>
            <strong>点击上传左图</strong>
            <small>拖拽或点击上传</small>
          </div>
        </div>

        <!-- Center label -->
        <div class="face-compare-workbench__center-label">
          <span class="face-compare-workbench__vs">VS</span>
        </div>

        <!-- Right upload -->
        <div
          class="face-compare-workbench__upload"
          :class="{
            'is-dragging': draggingSide === 'right',
            'is-filled': !!rightPreview,
            'is-loading': submitting,
          }"
          @click="openFilePicker('right')"
          @dragenter.prevent="handleDragEnter('right')"
          @dragover.prevent="draggingSide = 'right'"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop($event, 'right')"
        >
          <input
            ref="rightFileInput"
            class="face-compare-workbench__file"
            type="file"
            accept="image/*"
            @change="handleFileChange($event, 'right')"
          />
          <div v-if="rightPreview" class="face-compare-workbench__preview">
            <img :src="rightPreview" alt="右图" />
          </div>
          <div v-else class="face-compare-workbench__empty">
            <span class="face-compare-workbench__upload-icon">+</span>
            <strong>点击上传右图</strong>
            <small>拖拽或点击上传</small>
          </div>
        </div>
      </div>

      <!-- Result state -->
      <div v-else class="face-compare-workbench__result-area">
        <!-- Single pair result (1 vs 1) -->
        <div v-if="isSingleMatch" class="face-compare-workbench__single-result">
          <div class="face-compare-workbench__result-images">
            <div class="face-compare-workbench__result-img-wrap">
              <img :src="leftPreview" alt="左图" />
              <div
                v-if="showFaceBoxes"
                v-for="(box, i) in compareResult.faceDetailsLeft"
                :key="'lb' + i"
                class="face-compare-workbench__face-box"
                :style="getFaceBoxStyle(box, 'left')"
              />
            </div>
            <div class="face-compare-workbench__similarity-gauge">
              <div class="face-compare-workbench__score-ring" :class="scoreColorClass">
                <span class="face-compare-workbench__score-value">{{ formattedSimilarity }}</span>
                <span class="face-compare-workbench__score-unit">%</span>
              </div>
              <span class="face-compare-workbench__score-label">相似度</span>
            </div>
            <div class="face-compare-workbench__result-img-wrap">
              <img :src="rightPreview" alt="右图" />
              <div
                v-if="showFaceBoxes"
                v-for="(box, i) in compareResult.faceDetailsRight"
                :key="'rb' + i"
                class="face-compare-workbench__face-box"
                :style="getFaceBoxStyle(box, 'right')"
              />
            </div>
          </div>
          <div class="face-compare-workbench__result-toolbar">
            <el-switch v-model="showFaceBoxes" active-text="标注框" inactive-text="原图" />
          </div>
          <div class="face-compare-workbench__result-summary">
            左图 {{ compareResult.faceCountLeft }} 个人脸 · 右图 {{ compareResult.faceCountRight }} 个人脸
          </div>
        </div>

        <!-- Multi match results (M vs N) -->
        <div v-else class="face-compare-workbench__multi-result">
          <div class="face-compare-workbench__multi-header">
            <span>左图 {{ compareResult.faceCountLeft }} 个人脸 · 右图 {{ compareResult.faceCountRight }} 个人脸</span>
            <el-switch v-model="showFaceBoxes" active-text="标注框" inactive-text="原图" />
          </div>
          <div class="face-compare-workbench__result-images">
            <div class="face-compare-workbench__result-img-wrap">
              <img :src="leftPreview" alt="左图" />
              <div
                v-if="showFaceBoxes"
                v-for="(box, i) in compareResult.faceDetailsLeft"
                :key="'lb' + i"
                class="face-compare-workbench__face-box"
                :style="getFaceBoxStyle(box, 'left')"
              >
                <span class="face-compare-workbench__face-box-label">{{ i + 1 }}</span>
              </div>
            </div>
            <div class="face-compare-workbench__result-img-wrap">
              <img :src="rightPreview" alt="右图" />
              <div
                v-if="showFaceBoxes"
                v-for="(box, i) in compareResult.faceDetailsRight"
                :key="'rb' + i"
                class="face-compare-workbench__face-box"
                :style="getFaceBoxStyle(box, 'right')"
              >
                <span class="face-compare-workbench__face-box-label">{{ i + 1 }}</span>
              </div>
            </div>
          </div>

          <!-- Match list -->
          <div class="face-compare-workbench__match-list">
            <div
              v-for="(match, idx) in compareResult.matches"
              :key="idx"
              class="face-compare-workbench__match-card"
            >
              <div class="face-compare-workbench__match-faces">
                <div class="face-compare-workbench__match-thumb-wrap">
                  <img :src="leftPreview" alt="左人脸" class="face-compare-workbench__match-thumb" />
                  <span class="face-compare-workbench__match-label">左{{ match.leftIndex + 1 }}</span>
                </div>
                <div class="face-compare-workbench__match-score" :class="getMatchScoreColor(match.similarity)">
                  {{ (match.similarity * 100).toFixed(1) }}%
                </div>
                <div class="face-compare-workbench__match-thumb-wrap">
                  <img :src="rightPreview" alt="右手脸" class="face-compare-workbench__match-thumb" />
                  <span class="face-compare-workbench__match-label">右{{ match.rightIndex + 1 }}</span>
                </div>
              </div>
              <div class="face-compare-workbench__match-bar">
                <div class="face-compare-workbench__match-bar-track">
                  <div
                    class="face-compare-workbench__match-bar-fill"
                    :style="{ width: (match.similarity * 100) + '%' }"
                    :class="getMatchScoreColor(match.similarity)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <details class="face-compare-workbench__raw-details">
          <summary class="face-compare-workbench__raw-summary">详细数据</summary>
          <pre class="face-compare-workbench__raw-json">{{ JSON.stringify(compareResult, null, 2) }}</pre>
        </details>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElOption, ElSelect, ElSwitch, ElTooltip } from "element-plus";
import ScButton from "@repo/components/ScButton";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { message } from "@repo/utils";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import { createAiTask, getAiTask, type AiTaskRequest } from "../../../api/ai/task";

// ── Types ──────────────────────────────────────
interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

interface FaceCompareMatch {
  leftIndex: number;
  rightIndex: number;
  leftFace: FaceBox;
  rightFace: FaceBox;
  similarity: number;
}

interface FaceCompareResult {
  faceCountLeft: number;
  faceCountRight: number;
  faceDetailsLeft: FaceBox[];
  faceDetailsRight: FaceBox[];
  matches: FaceCompareMatch[];
}

type TaskPayload = Record<string, any>;

// ── Reactive state ─────────────────────────────
const modules = ref<AiModule[]>([]);
const featureModules = ref<AiModule[]>([]);
const enhanceModules = ref<AiModule[]>([]);
const submitting = ref(false);
const taskStatus = ref("");
const progress = ref(0);
const compareResult = ref<FaceCompareResult | null>(null);
const showFaceBoxes = ref(true);
let pollTimer: number | undefined;

// Left / Right inputs
const leftFileInput = ref<HTMLInputElement | null>(null);
const rightFileInput = ref<HTMLInputElement | null>(null);
const leftPreview = ref("");
const rightPreview = ref("");
const draggingSide = ref<"left" | "right" | null>(null);
const dragDepth = ref(0);

const router = useRouter();

const handleBackPage = () => {
  router.push("/ai/home");
};

interface FaceCompareForm extends AiTaskRequest {
  faceFeatureModel: string;
  faceEnhanceEnabled: boolean;
  faceEnhanceModuleCode: string;
}

const form = reactive<FaceCompareForm>({
  sysAiModuleCode: "",
  faceFeatureModel: "local-onnx-face-feature-arcface",
  faceEnhanceEnabled: false,
  faceEnhanceModuleCode: "local-onnx-face-enhance",
  prompt: "人脸对比",
  sourceUrl: "",
  sourceContent: "",
});

const activeModule = computed(() =>
  modules.value.find((item) => item.sysAiModuleCode === form.sysAiModuleCode),
);

const canSubmit = computed(
  () => !!form.sysAiModuleCode && !!leftPreview.value && !!rightPreview.value && !submitting.value,
);

// ── Single / Multi match helpers ───────────────
const isSingleMatch = computed(() => {
  if (!compareResult.value) return true;
  return compareResult.value.faceCountLeft <= 1 && compareResult.value.faceCountRight <= 1;
});

const formattedSimilarity = computed(() => {
  if (!compareResult.value?.matches?.length) return "0.0";
  const sim = compareResult.value.matches[0].similarity;
  return (sim * 100).toFixed(1);
});

const scoreColorClass = computed(() => {
  const val = parseFloat(formattedSimilarity.value);
  if (val >= 80) return "score-high";
  if (val >= 50) return "score-mid";
  return "score-low";
});

const getMatchScoreColor = (similarity: number) => {
  const pct = similarity * 100;
  if (pct >= 80) return "score-high";
  if (pct >= 50) return "score-mid";
  return "score-low";
};

// ── Face box positioning ───────────────────────
interface ImageMetrics {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
}

const leftMetrics = reactive<ImageMetrics>({ naturalWidth: 0, naturalHeight: 0, displayWidth: 0, displayHeight: 0, offsetX: 0, offsetY: 0 });
const rightMetrics = reactive<ImageMetrics>({ naturalWidth: 0, naturalHeight: 0, displayWidth: 0, displayHeight: 0, offsetX: 0, offsetY: 0 });

const updateMetrics = (img: HTMLImageElement | null, metrics: ImageMetrics) => {
  if (!img) return;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const dw = img.clientWidth;
  const dh = img.clientHeight;
  if (nw === 0 || nh === 0 || dw === 0 || dh === 0) return;
  metrics.naturalWidth = nw;
  metrics.naturalHeight = nh;
  const imgAspect = nw / nh;
  const containerAspect = dw / dh;
  if (imgAspect > containerAspect) {
    metrics.displayWidth = dw;
    metrics.displayHeight = dw / imgAspect;
    metrics.offsetX = 0;
    metrics.offsetY = (dh - metrics.displayHeight) / 2;
  } else {
    metrics.displayHeight = dh;
    metrics.displayWidth = dh * imgAspect;
    metrics.offsetX = (dw - metrics.displayWidth) / 2;
    metrics.offsetY = 0;
  }
};

const getFaceBoxStyle = (face: FaceBox, side: "left" | "right") => {
  const m = side === "left" ? leftMetrics : rightMetrics;
  if (m.naturalWidth === 0 || m.naturalHeight === 0) return { display: "none" };
  const scaleX = m.displayWidth / m.naturalWidth;
  const scaleY = m.displayHeight / m.naturalHeight;
  return {
    left: `${m.offsetX + face.x * scaleX}px`,
    top: `${m.offsetY + face.y * scaleY}px`,
    width: `${face.width * scaleX}px`,
    height: `${face.height * scaleY}px`,
  };
};

// ── Module / vendor loading ────────────────────
const loadModules = async () => {
  // Load face detection modules
  const detectRes = await listAiModules("FACE_DETECT");
  modules.value = (detectRes.data || []).filter((item) => item.sysAiModuleStatus !== 0);
  if (modules.value.length > 0 && !modules.value.some((m) => m.sysAiModuleCode === form.sysAiModuleCode)) {
    form.sysAiModuleCode = modules.value[0].sysAiModuleCode;
  }

  // Load face feature extraction modules
  const featureRes = await listAiModules("FACE_FEATURE");
  featureModules.value = (featureRes.data || []).filter((item) => item.sysAiModuleStatus !== 0);
  if (featureModules.value.length > 0 && !featureModules.value.some((m) => m.sysAiModuleCode === form.faceFeatureModel)) {
    form.faceFeatureModel = featureModules.value[0].sysAiModuleCode;
  }

  // Load face enhancement modules
  const enhanceRes = await listAiModules("FACE");
  enhanceModules.value = (enhanceRes.data || []).filter((item) => item.sysAiModuleStatus !== 0);
  if (enhanceModules.value.length > 0 && !enhanceModules.value.some((m) => m.sysAiModuleCode === form.faceEnhanceModuleCode)) {
    form.faceEnhanceModuleCode = enhanceModules.value[0].sysAiModuleCode;
  }
};

const resolveEnhanceModelId = (): string => {
  const selected = enhanceModules.value.find((m) => m.sysAiModuleCode === form.faceEnhanceModuleCode);
  return selected?.sysAiModuleModelId || form.faceEnhanceModuleCode;
};

// ── File handling ──────────────────────────────
const openFilePicker = (side: "left" | "right") => {
  if (submitting.value) return;
  if (side === "left") leftFileInput.value?.click();
  else rightFileInput.value?.click();
};

const handleFileChange = async (event: Event, side: "left" | "right") => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) await applyFile(file, side);
  target.value = "";
};

const handleDragEnter = (side: "left" | "right") => {
  dragDepth.value += 1;
  draggingSide.value = side;
};

const handleDragLeave = () => {
  dragDepth.value = Math.max(0, dragDepth.value - 1);
  draggingSide.value = dragDepth.value > 0 ? draggingSide.value : null;
};

const handleDrop = async (event: DragEvent, side: "left" | "right") => {
  draggingSide.value = null;
  dragDepth.value = 0;
  if (submitting.value) return;
  const file = event.dataTransfer?.files?.[0];
  if (file) await applyFile(file, side);
};

const applyFile = async (file: File, side: "left" | "right") => {
  if (!file.type.startsWith("image/")) {
    message("请选择图片文件", { type: "warning" });
    return;
  }
  compareResult.value = null;
  const dataUrl = await readFileAsDataUrl(file);
  if (side === "left") {
    leftPreview.value = dataUrl;
  } else {
    rightPreview.value = dataUrl;
  }
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Task submission ────────────────────────────
const submitTask = async () => {
  if (!form.sysAiModuleCode) {
    message("请先选择模型", { type: "warning" });
    return;
  }
  if (!leftPreview.value || !rightPreview.value) {
    message("请上传两张图片", { type: "warning" });
    return;
  }

  submitting.value = true;
  compareResult.value = null;
  taskStatus.value = "PENDING";
  progress.value = 5;
  clearPollTimer();

  try {
    // Send both images as comma-separated base64 in sourceContent
    const sourceContent = leftPreview.value + "," + rightPreview.value;
    const res = await createAiTask("FACE_COMPARE", {
      ...form,
      sourceContent,
      prompt: "人脸对比",
      input: {
        faceDetectModel: form.sysAiModuleCode,
        faceFeatureModel: form.faceFeatureModel,
        faceEnhanceEnabled: form.faceEnhanceEnabled,
        faceEnhanceModel: resolveEnhanceModelId(),
      },
    });
    const task = res.data as TaskPayload;
    const result = resolveCompareResult(task);
    if (result) {
      finishTask(result);
      return;
    }
    const taskId = Number(task?.sysAiTaskId || task?.taskId);
    if (!taskId) {
      throw new Error("任务创建失败");
    }
    startPolling(taskId);
  } catch (error: any) {
    submitting.value = false;
    message(error?.message || "人脸比对失败", { type: "error" });
  }
};

const startPolling = (taskId: number) => {
  void pollTask(taskId);
  pollTimer = window.setInterval(() => {
    void pollTask(taskId);
  }, 1800);
};

const pollTask = async (taskId: number) => {
  try {
    const res = await getAiTask(taskId);
    const task = res.data as TaskPayload;
    taskStatus.value = String(task?.taskStatus || task?.output?.taskStatus || "");
    progress.value = Number(task?.progress || 0);
    const result = resolveCompareResult(task);
    if (result) {
      finishTask(result);
      return;
    }
    if (["FAILED", "ERROR"].includes(taskStatus.value.toUpperCase())) {
      clearPollTimer();
      submitting.value = false;
      message(String(task?.message || "人脸比对失败"), { type: "error" });
    }
  } catch {
    // poll will retry
  }
};

const finishTask = (result: FaceCompareResult) => {
  compareResult.value = result;
  taskStatus.value = "SUCCESS";
  progress.value = 100;
  submitting.value = false;
  clearPollTimer();
  nextTick(() => {
    const leftImg = document.querySelector(".face-compare-workbench__result-img-wrap:first-child img") as HTMLImageElement | null;
    const rightImg = document.querySelector(".face-compare-workbench__result-img-wrap:last-child img") as HTMLImageElement | null;
    if (leftImg) leftImg.addEventListener("load", () => updateMetrics(leftImg, leftMetrics));
    if (rightImg) rightImg.addEventListener("load", () => updateMetrics(rightImg, rightMetrics));
    if (leftImg) updateMetrics(leftImg, leftMetrics);
    if (rightImg) updateMetrics(rightImg, rightMetrics);
  });
  message("人脸比对完成", { type: "success" });
};

const resolveCompareResult = (task: TaskPayload): FaceCompareResult | null => {
  const taskResult = task?.sysAiTaskResult || task?.result;
  let parsed: TaskPayload = {};
  if (typeof taskResult === "string") {
    try { parsed = JSON.parse(taskResult); } catch { return null; }
  } else if (taskResult && typeof taskResult === "object") {
    parsed = taskResult as TaskPayload;
  }
  // Check from parsed result first
  if (parsed?.faceCountLeft !== undefined && parsed?.matches) {
    return parsed as unknown as FaceCompareResult;
  }
  // Fallback: check from task.output
  const output = task?.output as TaskPayload | undefined;
  if (output?.faceCountLeft !== undefined && output?.matches) {
    return output as unknown as FaceCompareResult;
  }
  return null;
};

const resetTask = () => {
  clearPollTimer();
  leftPreview.value = "";
  rightPreview.value = "";
  compareResult.value = null;
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
  await loadModules();
});
onBeforeUnmount(() => {
  clearPollTimer();
});
</script>

<style scoped lang="scss">
.face-compare-workbench {
  min-height: 100%;
  height: 100%;
  display: grid;
  padding: 0px;
  grid-template-rows: auto 1fr;
  gap: 18px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color-page)) 0%,
    color-mix(in srgb, var(--el-color-info) 3%, var(--el-bg-color-page)) 52%,
    var(--el-bg-color-page) 100%
  );
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
  backdrop-filter: blur(8px);
}

.chat-like-header__back { flex-shrink: 0; }

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
}

.chat-like-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.face-compare-workbench__model { width: 240px; }

.face-compare-workbench__model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  small { color: var(--el-text-color-placeholder); font-size: 12px; }
}

// ── Stage ───────────────────────────────────────
.face-compare-workbench__stage {
  min-height: 0;
  height: 100%;
  display: flex;
}

// ── Dual upload ─────────────────────────────────
.face-compare-workbench__dual {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  width: 100%;
  height: 100%;
  align-items: center;
}

.face-compare-workbench__upload {
  position: relative;
  height: 100%;
  min-height: 300px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: 1px dashed color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 14%, transparent), 0 24px 60px rgba(15, 23, 42, 0.08);
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;

  &.is-dragging {
    border-color: var(--el-color-primary);
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--el-bg-color) 86%, var(--el-color-primary));
  }

  &.is-filled {
    border-style: solid;
    background: #0f172a;
  }

  &.is-loading { cursor: wait; }
}

.face-compare-workbench__file { display: none; }

.face-compare-workbench__empty {
  display: grid;
  place-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
  strong { font-size: 18px; }
  small { color: var(--el-text-color-secondary); font-size: 13px; }
}

.face-compare-workbench__upload-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #e8f3ff;
  font-size: 36px;
  font-weight: 300;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 85%, #0f172a),
    color-mix(in srgb, var(--el-color-info) 82%, #0f172a)
  );
  box-shadow: 0 16px 32px color-mix(in srgb, var(--el-color-primary) 24%, transparent);
}

.face-compare-workbench__preview {
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

// ── Center VS label ────────────────────────────
.face-compare-workbench__center-label {
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.face-compare-workbench__vs {
  font-size: 28px;
  font-weight: 800;
  color: var(--el-color-primary);
  opacity: 0.7;
  letter-spacing: 2px;
}

// ── Result area ─────────────────────────────────
.face-compare-workbench__result-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  background: #0f172a;
  border-radius: 12px;
  padding: 20px;
}

// ── Single match ────────────────────────────────
.face-compare-workbench__single-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.face-compare-workbench__result-images {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  width: 100%;
  align-items: center;
}

.face-compare-workbench__result-img-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  background: #0a0f1a;
  border-radius: 8px;
  overflow: hidden;

  img {
    max-width: 100%;
    max-height: 50vh;
    object-fit: contain;
    display: block;
  }
}

// ── Similarity gauge ────────────────────────────
.face-compare-workbench__similarity-gauge {
  display: grid;
  place-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.face-compare-workbench__score-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(
    var(--el-color-success) 0%,
    var(--el-color-warning) 50%,
    var(--el-color-danger) 100%
  );
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    background: #0f172a;
  }

  &.score-high { background: conic-gradient(#34d399 0%, #10b981 100%); }
  &.score-mid { background: conic-gradient(#fbbf24 0%, #f59e0b 100%); }
  &.score-low { background: conic-gradient(#f87171 0%, #ef4444 100%); }
}

.face-compare-workbench__score-value {
  position: relative;
  z-index: 1;
  font-size: 28px;
  font-weight: 800;
  color: #f1f5f9;
}

.face-compare-workbench__score-unit {
  position: relative;
  z-index: 1;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
}

.face-compare-workbench__score-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

// ── Toolbar ─────────────────────────────────────
.face-compare-workbench__result-toolbar {
  display: flex;
  justify-content: center;
}

.face-compare-workbench__result-summary {
  font-size: 13px;
  color: #94a3b8;
}

// ── Multi match ─────────────────────────────────
.face-compare-workbench__multi-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.face-compare-workbench__multi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 600;
}

.face-compare-workbench__match-list {
  display: grid;
  gap: 12px;
}

.face-compare-workbench__match-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  gap: 10px;
}

.face-compare-workbench__match-faces {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}

.face-compare-workbench__match-thumb-wrap {
  position: relative;
  text-align: center;
}

.face-compare-workbench__match-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
  background: #0a0f1a;
}

.face-compare-workbench__match-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  text-align: center;
}

.face-compare-workbench__match-score {
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;

  &.score-high { color: #34d399; }
  &.score-mid { color: #fbbf24; }
  &.score-low { color: #f87171; }
}

.face-compare-workbench__match-bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.face-compare-workbench__match-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;

  &.score-high { background: #34d399; }
  &.score-mid { background: #fbbf24; }
  &.score-low { background: #f87171; }
}

// ── Face boxes ─────────────────────────────────
.face-compare-workbench__face-box {
  position: absolute;
  border: 2px solid #34d399;
  border-radius: 4px;
  box-sizing: border-box;
  pointer-events: none;
}

.face-compare-workbench__face-box-label {
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

// ── Raw details ────────────────────────────────
.face-compare-workbench__raw-details {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.face-compare-workbench__raw-summary {
  padding: 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  user-select: none;
  &:hover { color: #e2e8f0; }
}

.face-compare-workbench__raw-json {
  font-size: 11px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 12px;
  overflow: auto;
  max-height: 300px;
  font-family: monospace;
  white-space: pre;
}

// ── Responsive ─────────────────────────────────
@media (max-width: 760px) {
  .face-compare-workbench__dual {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto 1fr;
  }

  .face-compare-workbench__result-images {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .face-compare-workbench__match-faces {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .face-compare-workbench__model { width: 100%; }
}
</style>
