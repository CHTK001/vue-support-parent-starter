<template>
  <el-dialog v-model="visible" title="图片编辑" width="90%" :close-on-click-modal="false" :close-on-press-escape="false" destroy-on-close class="image-editor-dialog">
    <div class="image-editor-container">
      <!-- 工具栏 -->
      <div class="editor-toolbar">
        <!-- 基础工具 -->
        <div class="toolbar-section">
          <span class="section-title">基础工具</span>
          <el-button-group>
            <el-tooltip content="裁剪" placement="top">
              <el-button :type="currentTool === 'crop' ? 'primary' : 'default'" @click="selectTool('crop')">
                <el-icon>
                  <component :is="useRenderIcon('ep:crop')" />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="旋转" placement="top">
              <el-button @click="rotate(90)">
                <el-icon>
                  <component :is="useRenderIcon('ep:refresh-right')" />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="翻转" placement="top">
              <el-button @click="flip('horizontal')">
                <el-icon>
                  <component :is="useRenderIcon('ep:sort')" />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="去除背景" placement="top">
              <el-button :loading="removing" @click="removeBackground">
                <el-icon v-if="!removing">
                  <component :is="useRenderIcon('ep:magic-stick')" />
                </el-icon>
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>

        <!-- 裁剪形状 -->
        <div v-if="currentTool === 'crop'" class="toolbar-section">
          <span class="section-title">裁剪形状</span>
          <el-radio-group v-model="cropShape" size="small">
            <el-radio-button value="rect">矩形</el-radio-button>
            <el-radio-button value="square">正方形</el-radio-button>
            <el-radio-button value="circle">圆形</el-radio-button>
            <el-radio-button value="rounded">圆角矩形</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 背景替换 -->
        <div v-if="hasTransparentBackground" class="toolbar-section">
          <span class="section-title">背景</span>
          <el-button-group>
            <el-tooltip content="纯色背景" placement="top">
              <el-button @click="showBackgroundPicker = true">
                <el-icon>
                  <component :is="useRenderIcon('ep:brush')" />
                </el-icon>
                纯色
              </el-button>
            </el-tooltip>
            <el-tooltip content="图片背景" placement="top">
              <el-button @click="selectBackgroundImage">
                <el-icon>
                  <component :is="useRenderIcon('ep:picture')" />
                </el-icon>
                图片
              </el-button>
            </el-tooltip>
            <el-tooltip content="移除背景" placement="top">
              <el-button @click="clearBackground">
                <el-icon>
                  <component :is="useRenderIcon('ep:delete')" />
                </el-icon>
                清除
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>

        <!-- 缩放 -->
        <div class="toolbar-section">
          <span class="section-title">缩放</span>
          <el-slider v-model="scale" :min="10" :max="300" :step="10" style="width: 150px" @change="handleScaleChange" />
          <span class="scale-value">{{ scale }}%</span>
        </div>
      </div>

      <!-- 编辑区域 -->
      <div class="editor-canvas-wrapper">
        <!-- Cropper 模式 -->
        <div v-show="currentTool === 'crop'" class="cropper-container">
          <img ref="cropperImage" :src="currentImageSrc" class="cropper-image" />
        </div>

        <!-- Canvas 模式 -->
        <div v-show="currentTool !== 'crop'" ref="canvasContainer" class="canvas-container" :style="{ transform: `scale(${scale / 100})` }">
          <canvas ref="mainCanvas" class="main-canvas"></canvas>
        </div>

        <!-- 进度提示 -->
        <div v-if="processing" class="processing-overlay">
          <el-progress :percentage="processingProgress" :stroke-width="8" />
          <span class="processing-text">{{ processingText }}</span>
        </div>
      </div>

      <!-- 背景颜色选择器 -->
      <el-dialog v-model="showBackgroundPicker" title="选择背景颜色" width="300px" append-to-body>
        <div class="color-picker-content">
          <el-color-picker v-model="backgroundColor" show-alpha />
          <div class="preset-colors">
            <div v-for="color in presetColors" :key="color" class="preset-color" :style="{ backgroundColor: color }" @click="backgroundColor = color"></div>
          </div>
        </div>
        <template #footer>
          <el-button @click="showBackgroundPicker = false">取消</el-button>
          <el-button type="primary" @click="applyBackgroundColor">确定</el-button>
        </template>
      </el-dialog>

      <!-- 背景图片上传（隐藏） -->
      <input ref="backgroundImageInput" type="file" accept="image/*" style="display: none" @change="handleBackgroundImageChange" />
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { useRenderIcon } from "../../ReIcon/src/hooks";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    required: true
  },
  imageBlob: {
    type: Blob,
    default: null
  }
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

// Refs
const mainCanvas = ref(null);
const cropperImage = ref(null);
const canvasContainer = ref(null);
const backgroundImageInput = ref(null);

// State
const visible = ref(props.modelValue);
const currentTool = ref(null);
const scale = ref(100);
const cropShape = ref("rect");
const removing = ref(false);
const processing = ref(false);
const processingProgress = ref(0);
const processingText = ref("");

// Image state
const originalImage = ref(null);
const currentImage = ref(null);
const canvasContext = ref(null);
const imageData = ref(null);
const hasTransparentBackground = ref(false);

// Cropper instance
let cropperInstance = null;
const currentImageSrc = ref("");

// Background
const showBackgroundPicker = ref(false);
const backgroundColor = ref("#ffffff");
const backgroundImage = ref(null);
const presetColors = ["#ffffff", "#000000", "#f5f5f5", "#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399"];

// Cropper 宽高比配置
const aspectRatioOptions = computed(() => {
  switch (cropShape.value) {
    case "square":
    case "circle":
      return 1;
    default:
      return NaN; // 自由比例
  }
});

// Watch
watch(
  () => props.modelValue,
  val => {
    visible.value = val;
    if (val) {
      nextTick(() => {
        initCanvas();
      });
    }
  }
);

watch(visible, val => {
  emit("update:modelValue", val);
  if (!val) {
    destroyCropper();
  }
});

watch(cropShape, () => {
  if (currentTool.value === "crop" && cropperInstance) {
    cropperInstance.setAspectRatio(aspectRatioOptions.value);
  }
});

// Methods
const initCanvas = async () => {
  if (!mainCanvas.value) return;

  const canvas = mainCanvas.value;
  const ctx = canvas.getContext("2d");
  canvasContext.value = ctx;

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Store original and current image
    originalImage.value = img;
    currentImage.value = img;
    currentImageSrc.value = props.imageSrc;

    // Check for transparency
    checkTransparency();
  };

  img.onerror = () => {
    ElMessage.error("图片加载失败");
  };

  img.src = props.imageSrc;
};

/**
 * 初始化 Cropper
 */
const initCropper = () => {
  if (!cropperImage.value) return;

  // 先更新图片源
  currentImageSrc.value = mainCanvas.value?.toDataURL("image/png") || props.imageSrc;

  nextTick(() => {
    if (cropperInstance) {
      cropperInstance.destroy();
    }

    cropperInstance = new Cropper(cropperImage.value, {
      aspectRatio: aspectRatioOptions.value,
      viewMode: 1,
      dragMode: "crop",
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready() {
        // Cropper 准备就绪
      }
    });
  });
};

/**
 * 销毁 Cropper
 */
const destroyCropper = () => {
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
};

const checkTransparency = () => {
  if (!canvasContext.value || !mainCanvas.value) return;

  const ctx = canvasContext.value;
  const imageData = ctx.getImageData(0, 0, mainCanvas.value.width, mainCanvas.value.height);
  const data = imageData.data;

  // Check if any pixel has alpha < 255
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      hasTransparentBackground.value = true;
      return;
    }
  }

  hasTransparentBackground.value = false;
};

const selectTool = tool => {
  if (currentTool.value === tool) {
    // 退出裁剪模式时应用裁剪
    if (tool === "crop" && cropperInstance) {
      applyCrop();
    }
    currentTool.value = null;
    destroyCropper();
  } else {
    // 进入裁剪模式
    if (currentTool.value === "crop" && cropperInstance) {
      applyCrop();
    }
    currentTool.value = tool;
    if (tool === "crop") {
      initCropper();
    }
  }
};

const rotate = angle => {
  if (!mainCanvas.value || !currentImage.value) return;

  const canvas = mainCanvas.value;
  const ctx = canvasContext.value;

  // For 90 or 270 degree rotation, swap width and height
  if (angle === 90 || angle === -90 || angle === 270) {
    const temp = canvas.width;
    canvas.width = canvas.height;
    canvas.height = temp;
  }

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Translate to center
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Rotate
  ctx.rotate((angle * Math.PI) / 180);

  // Draw image
  if (angle === 90 || angle === -90 || angle === 270) {
    ctx.drawImage(currentImage.value, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
  } else {
    ctx.drawImage(currentImage.value, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
  }

  ctx.restore();

  // Update current image from canvas
  updateCurrentImage();
  ElMessage.success("旋转成功");
};

const flip = direction => {
  if (!mainCanvas.value || !currentImage.value) return;

  const canvas = mainCanvas.value;
  const ctx = canvasContext.value;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (direction === "horizontal") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }

  ctx.drawImage(currentImage.value, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  updateCurrentImage();
  ElMessage.success("翻转成功");
};

const removeBackground = async () => {
  if (removing.value) return;

  try {
    removing.value = true;
    processing.value = true;
    processingProgress.value = 0;
    processingText.value = "正在初始化...";

    const { removeBackground: removeBg } = await import("@imgly/background-removal");

    processingProgress.value = 20;
    processingText.value = "正在分析图片...";

    // Get blob from canvas
    const blob = await new Promise(resolve => mainCanvas.value.toBlob(resolve, "image/png"));

    processingProgress.value = 40;
    processingText.value = "正在去除背景...";

    const config = {
      progress: (key, current, total) => {
        const progressPercent = 40 + Math.floor((current / total) * 50);
        processingProgress.value = progressPercent;
        processingText.value = `正在处理: ${key}`;
      }
    };

    const resultBlob = await removeBg(blob, config);

    processingProgress.value = 95;
    processingText.value = "正在生成预览...";

    // Load result back to canvas
    const img = new Image();
    img.onload = () => {
      const canvas = mainCanvas.value;
      const ctx = canvasContext.value;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      currentImage.value = img;
      hasTransparentBackground.value = true;

      processingProgress.value = 100;
      processingText.value = "处理完成";

      ElMessage.success("背景去除成功");

      setTimeout(() => {
        processing.value = false;
        removing.value = false;
        processingProgress.value = 0;
        processingText.value = "";
      }, 500);
    };

    img.src = URL.createObjectURL(resultBlob);
  } catch (error) {
    console.error("Background removal error:", error);
    ElMessage.error("背景去除失败: " + error.message);
    processing.value = false;
    removing.value = false;
    processingProgress.value = 0;
    processingText.value = "";
  }
};

const selectBackgroundImage = () => {
  backgroundImageInput.value?.click();
};

const handleBackgroundImageChange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    const img = new Image();
    img.onload = () => {
      backgroundImage.value = img;
      applyBackgroundImage();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

const applyBackgroundColor = () => {
  if (!mainCanvas.value || !currentImage.value) return;

  const canvas = mainCanvas.value;
  const ctx = canvasContext.value;

  // Create a temporary canvas to preserve the current image
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(canvas, 0, 0);

  // Fill background
  ctx.fillStyle = backgroundColor.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image on top
  ctx.drawImage(tempCanvas, 0, 0);

  updateCurrentImage();
  showBackgroundPicker.value = false;
  ElMessage.success("背景颜色已应用");
};

const applyBackgroundImage = () => {
  if (!mainCanvas.value || !currentImage.value || !backgroundImage.value) return;

  const canvas = mainCanvas.value;
  const ctx = canvasContext.value;

  // Create a temporary canvas to preserve the current image
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(canvas, 0, 0);

  // Draw background image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage.value, 0, 0, canvas.width, canvas.height);

  // Draw current image on top
  ctx.drawImage(tempCanvas, 0, 0);

  updateCurrentImage();
  ElMessage.success("背景图片已应用");
};

const clearBackground = () => {
  // This would require re-removing the background or resetting to the version with transparent background
  ElMessage.info("请先去除背景后再应用新背景");
};

const handleScaleChange = () => {
  // Scale is handled by CSS transform
};

const updateCurrentImage = () => {
  if (!mainCanvas.value) return;

  const img = new Image();
  img.onload = () => {
    currentImage.value = img;
    checkTransparency();
  };
  img.src = mainCanvas.value.toDataURL("image/png");
};

const applyCrop = () => {
  if (!cropperInstance || !mainCanvas.value) return;

  // 从 cropper 获取裁剪后的 canvas
  const croppedCanvas = cropperInstance.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high"
  });

  if (!croppedCanvas) {
    ElMessage.warning("请先选择裁剪区域");
    return;
  }

  const canvas = mainCanvas.value;
  const ctx = canvasContext.value;

  // 获取裁剪后的尺寸
  const width = croppedCanvas.width;
  const height = croppedCanvas.height;

  // 处理不同的裁剪形状
  if (cropShape.value === "circle") {
    // 创建圆形裁剪
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.beginPath();
    tempCtx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();
    tempCtx.drawImage(croppedCanvas, 0, 0);

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
  } else if (cropShape.value === "rounded") {
    // 创建圆角矩形裁剪
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    const radius = Math.min(width, height) * 0.1;
    tempCtx.beginPath();
    tempCtx.moveTo(radius, 0);
    tempCtx.lineTo(width - radius, 0);
    tempCtx.arcTo(width, 0, width, radius, radius);
    tempCtx.lineTo(width, height - radius);
    tempCtx.arcTo(width, height, width - radius, height, radius);
    tempCtx.lineTo(radius, height);
    tempCtx.arcTo(0, height, 0, height - radius, radius);
    tempCtx.lineTo(0, radius);
    tempCtx.arcTo(0, 0, radius, 0, radius);
    tempCtx.closePath();
    tempCtx.clip();
    tempCtx.drawImage(croppedCanvas, 0, 0);

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
  } else {
    // 矩形或正方形直接使用
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(croppedCanvas, 0, 0);
  }

  // 销毁 cropper
  destroyCropper();
  currentTool.value = null;

  updateCurrentImage();
  ElMessage.success("裁剪成功");
};

const handleReset = () => {
  // 先销毁 cropper
  destroyCropper();

  if (originalImage.value) {
    const canvas = mainCanvas.value;
    const ctx = canvasContext.value;

    canvas.width = originalImage.value.width;
    canvas.height = originalImage.value.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage.value, 0, 0);

    currentImage.value = originalImage.value;
    currentImageSrc.value = props.imageSrc;
    currentTool.value = null;
    scale.value = 100;
    hasTransparentBackground.value = false;

    checkTransparency();
    ElMessage.success("已重置");
  }
};

const handleConfirm = async () => {
  // 如果正在裁剪模式，先应用裁剪
  if (currentTool.value === "crop" && cropperInstance) {
    applyCrop();
    await nextTick();
  }

  // Convert canvas to blob
  mainCanvas.value.toBlob(
    blob => {
      const url = URL.createObjectURL(blob);
      emit("confirm", blob, url);
      visible.value = false;
    },
    "image/png",
    1.0
  );
};

const handleCancel = () => {
  destroyCropper();
  emit("cancel");
  visible.value = false;
};

// Cleanup
onBeforeUnmount(() => {
  destroyCropper();
});
</script>

<style scoped>
.image-editor-dialog :deep(.el-dialog__body) {
  padding: 10px 20px;
  max-height: 70vh;
  overflow: hidden;
}

.image-editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
  align-items: center;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin-right: 8px;
}

.scale-value {
  min-width: 45px;
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

/* 编辑区域 */
.editor-canvas-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#f5f5f5 0% 25%, transparent 0% 50%) 50% / 20px 20px;
  border-radius: 6px;
  overflow: auto;
  min-height: 400px;
  max-height: 500px;
}

.canvas-container {
  position: relative;
  display: inline-block;
  transform-origin: center center;
  transition: transform 0.3s ease;
}

.main-canvas {
  display: block;
  max-width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

/* Cropper 容器 */
.cropper-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cropper-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

/* 处理进度 */
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 100;
  border-radius: 6px;
}

.processing-overlay .el-progress {
  width: 60%;
}

.processing-text {
  margin-top: 16px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

/* 颜色选择器 */
.color-picker-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
}

.preset-color {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid var(--el-border-color);
  transition: all 0.3s;
}

.preset-color:hover {
  transform: scale(1.1);
  border-color: var(--el-color-primary);
}

/* 响应式 */
@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-section {
    flex-direction: column;
    align-items: stretch;
  }

  .editor-canvas-wrapper {
    min-height: 300px;
  }
}
</style>
