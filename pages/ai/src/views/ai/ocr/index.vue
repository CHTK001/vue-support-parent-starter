<template>
  <section class="ocr-workbench system-container modern-bg">
    <!-- Header -->
    <header class="ocr-workbench__header">
      <button class="ocr-workbench__back" @click="handleBackPage">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </button>
      <div class="ocr-workbench__header-body">
        <h2 class="ocr-workbench__header-title">文字识别</h2>
        <p class="ocr-workbench__header-desc">上传图片识别并提取文字内容</p>
      </div>
      <nav class="ocr-workbench__nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="ocr-workbench__nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <IconifyIconOnline :icon="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </header>

    <!-- ─── Tab: 文字识别 ─────────────────────────── -->
    <section v-if="activeTab === 'recognize'" class="ocr-workbench__panel">
      <div v-if="!result" class="ocr-workbench__upload-zone" :class="{ 'is-dragging': dragging, 'is-filled': !!sourcePreview }" @click="openFilePicker" @dragenter.prevent="handleDragEnter" @dragover.prevent="dragging = true" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
          <input ref="fileInputRef" class="ocr-workbench__file" type="file" accept="image/*" @change="handleFileChange" />

          <img v-if="sourcePreview" :src="sourcePreview" alt="原图" class="ocr-workbench__upload-preview" />
          <div v-else class="ocr-workbench__upload-hint">
            <div class="ocr-workbench__upload-plus">
              <IconifyIconOnline icon="ri:scan-line" />
            </div>
            <strong>点击或拖拽上传图片</strong>
            <small>支持 PNG / JPG / WEBP，提取图片中的文字</small>
          </div>

          <div v-if="submitting" class="ocr-workbench__processing">
            <span class="ocr-workbench__spinner" />
            <strong>识别中...</strong>
          </div>
      </div>

      <div v-else class="ocr-workbench__result-layout">
        <div class="ocr-workbench__result-canvas-wrap">
          <div class="ocr-workbench__canvas-container" ref="canvasContainerRef">
            <img ref="resultImageRef" :src="sourcePreview" alt="识别图" @load="drawResultBoxes" />
            <canvas ref="canvasRef" class="ocr-workbench__canvas" />
          </div>
          <div class="ocr-workbench__result-actions">
            <button class="ocr-workbench__btn" @click="resetTask">
              <IconifyIconOnline icon="ri:refresh-line" /> 重新识别
            </button>
            <button class="ocr-workbench__btn ocr-workbench__btn--primary" @click="copyResult">
              <IconifyIconOnline icon="ri:file-copy-line" /> 复制全文
            </button>
          </div>
        </div>

        <div class="ocr-workbench__result-list-panel">
          <div class="ocr-workbench__result-header">
            <strong>识别结果</strong>
            <small>{{ result.blocks.length }} 个文字块</small>
          </div>
          <div class="ocr-workbench__result-scroll">
            <div v-for="(block, idx) in result.blocks" :key="idx" class="ocr-workbench__block-item" @mouseenter="hoverBlockIdx = idx" @mouseleave="hoverBlockIdx = -1">
              <div class="ocr-workbench__block-index">{{ idx + 1 }}</div>
              <div class="ocr-workbench__block-content">
                <p>{{ block.text }}</p>
                <div class="ocr-workbench__block-meta">
                  <span>置信度: {{ (block.confidence * 100).toFixed(0) }}%</span>
                  <span>位置: ({{ Math.round(block.centerX) }}, {{ Math.round(block.centerY) }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Tab: OCR 设置 ─────────────────────────── -->
    <section v-if="activeTab === 'settings'" class="ocr-workbench__panel ocr-workbench__settings-panel">
      <div class="ocr-workbench__settings-head">
        <h3>OCR 全局设置</h3>
        <p>配置 OCR 识别参数与文字增强预处理策略</p>
      </div>

      <div class="ocr-workbench__settings-body">
        <div class="ocr-workbench__settings-group">
          <h4 class="ocr-workbench__settings-group-title">模型配置</h4>

          <label class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">默认OCR模型</span>
            <div class="ocr-workbench__settings-control">
              <select v-model="settingValues.default_ocr_model" class="ocr-workbench__settings-select" @change="updateSetting('default_ocr_model', $event.target.value)">
                <option v-for="m in moduleOptions" :key="m.sysAiModuleCode" :value="m.sysAiModuleCode">
                  {{ m.sysAiModuleName || m.sysAiModuleCode }}
                </option>
              </select>
            </div>
          </label>

          <label class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">识别语言</span>
            <div class="ocr-workbench__settings-control">
              <select v-model="settingValues.ocr_language" class="ocr-workbench__settings-select" @change="updateSetting('ocr_language', $event.target.value)">
                <option value="ch">中文</option>
                <option value="en">英文</option>
                <option value="jp">日文</option>
              </select>
            </div>
          </label>
        </div>

        <div class="ocr-workbench__settings-group">
          <h4 class="ocr-workbench__settings-group-title">识别参数</h4>

          <label class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">置信度阈值</span>
            <div class="ocr-workbench__settings-control">
              <el-input-number v-model="numSettings.ocr_confidence_threshold" :min="0" :max="1" :step="0.05" :precision="2" size="small" style="width:120px" @change="updateNumSetting('ocr_confidence_threshold')" />
            </div>
          </label>

          <label class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">图像最大边长</span>
            <div class="ocr-workbench__settings-control">
              <el-input-number v-model="numSettings.ocr_max_image_size" :min="512" :max="4096" :step="256" size="small" style="width:120px" @change="updateNumSetting('ocr_max_image_size')" />
            </div>
          </label>
        </div>

        <div class="ocr-workbench__settings-group">
          <h4 class="ocr-workbench__settings-group-title">文字增强</h4>

          <div class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">对比度增强</span>
            <div class="ocr-workbench__settings-control">
              <label class="ocr-workbench__settings-switch">
                <input v-model="boolSettings.enhance_contrast" type="checkbox" @change="updateBoolSetting('enhance_contrast')" />
                <span class="ocr-workbench__settings-switch-track">
                  <span class="ocr-workbench__settings-switch-thumb" />
                </span>
                <span>{{ boolSettings.enhance_contrast ? '已开启' : '已关闭' }}</span>
              </label>
            </div>
          </div>

          <div class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">亮度调整</span>
            <div class="ocr-workbench__settings-control">
              <el-input-number v-model="numSettings.enhance_brightness" :min="-100" :max="100" :step="5" size="small" style="width:120px" @change="updateNumSetting('enhance_brightness')" />
            </div>
          </div>

          <div class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">降噪处理</span>
            <div class="ocr-workbench__settings-control">
              <label class="ocr-workbench__settings-switch">
                <input v-model="boolSettings.enhance_denoise" type="checkbox" @change="updateBoolSetting('enhance_denoise')" />
                <span class="ocr-workbench__settings-switch-track">
                  <span class="ocr-workbench__settings-switch-thumb" />
                </span>
                <span>{{ boolSettings.enhance_denoise ? '已开启' : '已关闭' }}</span>
              </label>
            </div>
          </div>

          <div class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">二值化处理</span>
            <div class="ocr-workbench__settings-control">
              <label class="ocr-workbench__settings-switch">
                <input v-model="boolSettings.enhance_binarize" type="checkbox" @change="updateBoolSetting('enhance_binarize')" />
                <span class="ocr-workbench__settings-switch-track">
                  <span class="ocr-workbench__settings-switch-thumb" />
                </span>
                <span>{{ boolSettings.enhance_binarize ? '已开启' : '已关闭' }}</span>
              </label>
            </div>
          </div>

          <div class="ocr-workbench__settings-field">
            <span class="ocr-workbench__settings-label">倾斜校正</span>
            <div class="ocr-workbench__settings-control">
              <label class="ocr-workbench__settings-switch">
                <input v-model="boolSettings.enhance_deskew" type="checkbox" @change="updateBoolSetting('enhance_deskew')" />
                <span class="ocr-workbench__settings-switch-track">
                  <span class="ocr-workbench__settings-switch-thumb" />
                </span>
                <span>{{ boolSettings.enhance_deskew ? '已开启' : '已关闭' }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="ocr-workbench__settings-foot">
        <div class="ocr-workbench__settings-foot-info">
          <IconifyIconOnline icon="ri:information-line" />
          <span>设置自动保存至数据库，对所有用户生效</span>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElInputNumber } from "element-plus";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { message } from "@repo/utils";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import { ocrRecognize, type OcrResponse } from "../../../api/ai/ocr";
import { listAiGlobalSettings, replaceAiGlobalSettings, type SysAiGlobalSetting } from "../../../api/ai/global-setting";

// ── Tabs ────────────────────────────────────────
const tabs = [
  { key: "recognize", label: "文字识别", icon: "ri:scan-line" },
  { key: "settings", label: "OCR 设置", icon: "ri:settings-3-line" },
];
const activeTab = ref("recognize");

// ── Router ──────────────────────────────────────
const router = useRouter();
const handleBackPage = () => router.push("/ai/home");

// ── Upload ──────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const sourcePreview = ref("");
const submitting = ref(false);
const dragging = ref(false);
const dragDepth = ref(0);

const openFilePicker = () => fileInputRef.value?.click();

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) applyFile(file);
  (e.target as HTMLInputElement).value = "";
};

const handleDragEnter = () => {
  dragDepth.value++;
  dragging.value = true;
};

const handleDragLeave = () => {
  dragDepth.value--;
  if (dragDepth.value <= 0) {
    dragging.value = false;
    dragDepth.value = 0;
  }
};

const handleDrop = (e: DragEvent) => {
  dragging.value = false;
  dragDepth.value = 0;
  const file = e.dataTransfer?.files?.[0];
  if (file) applyFile(file);
};

const applyFile = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    message("请选择图片文件", { type: "warning" });
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  sourcePreview.value = dataUrl;
  result.value = null;
  submitTask(dataUrl);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Recognize ───────────────────────────────────
const result = ref<OcrResponse | null>(null);
const hoverBlockIdx = ref(-1);

const submitTask = async (imageDataUrl: string) => {
  const base64 = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : imageDataUrl;
  submitting.value = true;
  try {
    const res = await ocrRecognize({ image: base64 });
    result.value = res.data;
  } catch (e: any) {
    message(e?.message || "识别失败", { type: "error" });
  } finally {
    submitting.value = false;
  }
};

const resetTask = () => {
  result.value = null;
  sourcePreview.value = "";
  hoverBlockIdx.value = -1;
};

// ── Canvas drawing ──────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null);
const resultImageRef = ref<HTMLImageElement | null>(null);
const canvasContainerRef = ref<HTMLDivElement | null>(null);

const drawResultBoxes = () => {
  const canvas = canvasRef.value;
  const img = resultImageRef.value;
  const container = canvasContainerRef.value;
  if (!canvas || !img || !container || !result.value) return;

  const rect = container.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();
  const scaleX = img.naturalWidth > 0 ? imgRect.width / img.naturalWidth : 1;
  const scaleY = img.naturalHeight > 0 ? imgRect.height / img.naturalHeight : 1;

  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  for (let i = 0; i < result.value.blocks.length; i++) {
    const block = result.value.blocks[i];
    const isHover = hoverBlockIdx.value === i;
    const box = block.box;

    ctx.strokeStyle = isHover ? "#10b981" : "#3b82f6";
    ctx.lineWidth = isHover ? 2.5 : 1.5;
    ctx.setLineDash(isHover ? [] : [4, 3]);

    if (box && box.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(box[0][0] * scaleX, box[0][1] * scaleY);
      for (let j = 1; j < box.length; j++) {
        ctx.lineTo(box[j][0] * scaleX, box[j][1] * scaleY);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      const x = (block.centerX - block.width / 2) * scaleX;
      const y = (block.centerY - block.height / 2) * scaleY;
      const w = block.width * scaleX;
      const h = block.height * scaleY;
      ctx.strokeRect(x, y, w, h);
    }

    // label
    if (isHover) {
      const label = `${block.text} (${(block.confidence * 100).toFixed(0)}%)`;
      ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
      ctx.font = "12px sans-serif";
      const tw = ctx.measureText(label).width;
      const lx = box ? box[0][0] * scaleX : (block.centerX - block.width / 2) * scaleX;
      const ly = box ? box[0][1] * scaleY - 4 : (block.centerY - block.height / 2) * scaleY - 4;
      ctx.fillRect(lx, ly - 16, tw + 8, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, lx + 4, ly - 2);
    }
  }
};

// ── Copy ────────────────────────────────────────
const copyResult = async () => {
  if (!result.value?.text) return;
  try {
    await navigator.clipboard.writeText(result.value.text);
    message("已复制", { type: "success" });
  } catch {
    message("复制失败", { type: "error" });
  }
};

// ── Modules ─────────────────────────────────────
const moduleOptions = ref<AiModule[]>([]);
const loadModules = async () => {
  try {
    const res = await listAiModules("OCR");
    moduleOptions.value = (res.data || []).filter((m: AiModule) => m.sysAiModuleStatus !== 0);
  } catch { /* ignore */ }
};

// ── Settings ────────────────────────────────────
const settingValues = reactive<Record<string, string>>({});
const boolSettings = reactive<Record<string, boolean>>({});
const numSettings = reactive<Record<string, number>>({});

const loadSettings = async () => {
  try {
    const res = await listAiGlobalSettings("ocr");
    const list: SysAiGlobalSetting[] = res.data || [];
    for (const item of list) {
      const field = item.sysAiGlobalSettingField;
      settingValues[field] = item.sysAiGlobalSettingValue;
      if (item.sysAiGlobalSettingValueType === "BOOLEAN") {
        boolSettings[field] = item.sysAiGlobalSettingValue === "true";
      } else if (item.sysAiGlobalSettingValueType === "INT" || item.sysAiGlobalSettingValueType === "FLOAT") {
        numSettings[field] = parseFloat(item.sysAiGlobalSettingValue) || 0;
      }
    }
  } catch { /* ignore */ }
};

const updateSetting = async (field: string, value: string) => {
  try {
    await replaceAiGlobalSettings([{ sysAiGlobalSettingField: field, sysAiGlobalSettingValue: value, sysAiGlobalSettingValueType: "STRING" }], "ocr");
    message("已更新", { type: "success" });
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
  }
};

const updateBoolSetting = async (field: string) => {
  try {
    await replaceAiGlobalSettings([{ sysAiGlobalSettingField: field, sysAiGlobalSettingValue: String(boolSettings[field]), sysAiGlobalSettingValueType: "BOOLEAN" }], "ocr");
    message("已更新", { type: "success" });
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
  }
};

const updateNumSetting = async (field: string) => {
  try {
    const type = field.includes("threshold") || field.includes("brightness") ? "FLOAT" : "INT";
    await replaceAiGlobalSettings([{ sysAiGlobalSettingField: field, sysAiGlobalSettingValue: String(numSettings[field]), sysAiGlobalSettingValueType: type }], "ocr");
    message("已更新", { type: "success" });
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
  }
};

// ── Init ────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([loadModules(), loadSettings()]);
});
</script>

<style scoped lang="scss">
// ── Layout ────────────────────────────────────────
.ocr-workbench {
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
}

// ── Header ────────────────────────────────────────
.ocr-workbench__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color));
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.ocr-workbench__back {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    color: var(--el-color-primary);
  }
}

.ocr-workbench__header-body {
  min-width: 0;
}

.ocr-workbench__header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.3;
}

.ocr-workbench__header-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.3;
}

// ── Nav ────────────────────────────────────────────
.ocr-workbench__nav {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.ocr-workbench__nav-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color));
    color: var(--el-color-primary);
    box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  }

  :deep(svg) { font-size: 16px; }
}

// ── Panel ──────────────────────────────────────────
.ocr-workbench__panel {
  flex: 1;
  min-height: 0;
  background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary));
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 14%, var(--el-border-color));
  padding: 18px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

// ── Upload zone ────────────────────────────────────
.ocr-workbench__upload-zone {
  position: relative;
  flex: 1;
  min-height: 220px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: 1px dashed color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  transition: border-color 0.18s, background 0.18s;
  overflow: hidden;

  &.is-dragging {
    border-color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-bg-color) 84%, var(--el-color-primary));
  }

  &.is-filled {
    border-style: solid;
    background: #0f172a;
  }
}

.ocr-workbench__file { display: none; }

.ocr-workbench__upload-preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0f172a;
}

.ocr-workbench__upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  pointer-events: none;
}

.ocr-workbench__upload-plus {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 28px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--el-color-primary) 80%, #0f172a),
    color-mix(in srgb, var(--el-color-info) 78%, #0f172a));
  color: #e8f3ff;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.ocr-workbench__processing {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: color-mix(in srgb, #0f172a 70%, transparent);
  color: #e8f3ff;
  font-size: 15px;
}

.ocr-workbench__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #e8f3ff;
  border-radius: 50%;
  animation: ocrSpin 0.7s linear infinite;
}

@keyframes ocrSpin {
  to { transform: rotate(360deg); }
}

// ── Result layout ──────────────────────────────────
.ocr-workbench__result-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  flex: 1;
  min-height: 0;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.ocr-workbench__result-canvas-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.ocr-workbench__canvas-container {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: 8px;
  background: #0f172a;
  display: flex;
  align-items: flex-start;
  justify-content: center;

  img {
    max-width: 100%;
    display: block;
  }
}

.ocr-workbench__canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
}

.ocr-workbench__result-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

// ── Result list ────────────────────────────────────
.ocr-workbench__result-list-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
}

.ocr-workbench__result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  flex-shrink: 0;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  small {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.ocr-workbench__result-scroll {
  flex: 1;
  overflow: auto;
  padding: 4px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ocr-workbench__block-item {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: default;
  transition: background 0.12s;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

.ocr-workbench__block-index {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.ocr-workbench__block-content {
  flex: 1;
  min-width: 0;

  p {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.4;
    word-break: break-all;
  }
}

.ocr-workbench__block-meta {
  display: flex;
  gap: 10px;
  margin-top: 3px;

  span {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

// ── Buttons ────────────────────────────────────────
.ocr-workbench__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: #fff;
    &:hover { background: var(--el-color-primary-light-3); }
  }
}

// ── Settings panel ─────────────────────────────────
.ocr-workbench__settings-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ocr-workbench__settings-head {
  flex-shrink: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  margin-bottom: 18px;

  h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.ocr-workbench__settings-body {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ocr-workbench__settings-group {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  border-radius: 10px;
  padding: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary));
}

.ocr-workbench__settings-group-title {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
}

.ocr-workbench__settings-field {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  }
}

.ocr-workbench__settings-label {
  min-width: 110px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding-top: 6px;
  flex-shrink: 0;
}

.ocr-workbench__settings-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ocr-workbench__settings-select {
  height: 36px;
  padding: 0 30px 0 12px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239399b4'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 18px;
  max-width: 360px;
  transition: border-color 0.15s;

  &:focus { border-color: var(--el-color-primary); }
}

.ocr-workbench__settings-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  input { display: none; }

  .ocr-workbench__settings-switch-track {
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: color-mix(in srgb, var(--el-border-color) 60%, transparent);
    position: relative;
    transition: background 0.2s;
  }

  .ocr-workbench__settings-switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }

  input:checked + .ocr-workbench__settings-switch-track {
    background: var(--el-color-primary);
    .ocr-workbench__settings-switch-thumb { transform: translateX(18px); }
  }
}

.ocr-workbench__settings-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 14px;
  margin-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
}

.ocr-workbench__settings-foot-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  :deep(svg) { font-size: 15px; }
}

// ── Responsive ─────────────────────────────────────
@media (max-width: 640px) {
  .ocr-workbench__nav-item span { display: none; }
  .ocr-workbench__result-layout { grid-template-columns: 1fr; }
}
</style>
