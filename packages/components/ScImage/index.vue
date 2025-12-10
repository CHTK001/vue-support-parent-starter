<template>
  <div class="sc-image-container" :class="{ 'sc-image-compare': compareMode }" :style="containerStyle">
    <!-- 图片比较模式 -->
    <div v-if="compareMode && compareImage" class="sc-image-compare-wrapper">
      <ScCompare v-if="useScCompare" :left-image="currentImage" :right-image="compareImage" :left-image-label="compareLeftLabel" :right-image-label="compareRightLabel" />
      <ImageCompare
        v-else
        v-model:compareValue="compareValue"
        :beforeSrc="currentImage"
        :afterSrc="compareImage"
        :width="width"
        :height="height"
        :direction="currentCompareDirection"
        @change="handleCompareChange"
      />
      <div v-if="!disabled" class="sc-image-actions compare-actions">
        <el-tooltip :content="useScCompare ? '切换为滑动比较' : '切换为并排比较'" placement="left">
          <div class="action-btn" @click="toggleCompareMode">
            <el-icon>
              <component :is="useRenderIcon('ep:grid')" />
            </el-icon>
          </div>
        </el-tooltip>
        <el-tooltip v-if="!useScCompare" content="切换比较方向" placement="left">
          <div class="action-btn" @click="toggleCompareDirection">
            <el-icon>
              <component :is="useRenderIcon(compareDirection === 'horizontal' ? 'ep:sort' : 'ep:menu')" />
            </el-icon>
          </div>
        </el-tooltip>
        <el-tooltip content="退出比较" placement="left">
          <div class="action-btn" @click="exitCompareMode">
            <el-icon>
              <component :is="useRenderIcon('ep:close')" />
            </el-icon>
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- 普通图片显示模式 -->
    <div v-else-if="currentImage" class="sc-image-wrapper">
      <el-image
        ref="imageRef"
        :src="currentImage"
        :fit="fit"
        :loading="loading"
        :scroll-container="scrollContainer"
        :preview-src-list="previewSrcList"
        :initial-index="initialIndex"
        :close-on-press-escape="closeOnPressEscape"
        :z-index="zIndex"
        :zoom-rate="zoomRate"
        :max-scale="maxScale"
        :min-scale="minScale"
        :hide-on-click-modal="hideOnClickModal"
        :preview-teleported="previewTeleported"
        :infinite="infinite"
        :lazy="lazy"
        class="sc-image"
        @load="handleLoad"
        @error="handleError"
        @switch="handleSwitch"
        @close="handleClose"
        @show="handleShow"
      >
        <template v-if="$slots.placeholder" #placeholder>
          <slot name="placeholder" />
        </template>
        <template v-else #placeholder>
          <div class="sc-image-placeholder">
            <el-icon class="is-loading">
              <component :is="useRenderIcon('ep:loading')" />
            </el-icon>
            <span>加载中...</span>
          </div>
        </template>

        <template v-if="$slots.error" #error>
          <slot name="error" />
        </template>
        <template v-else #error>
          <div class="sc-image-error">
            <el-icon>
              <component :is="useRenderIcon('ep:picture')" />
            </el-icon>
            <span>加载失败</span>
          </div>
        </template>

        <template v-if="$slots.viewer" #viewer>
          <slot name="viewer" />
        </template>
      </el-image>

      <!-- 操作按钮 -->
      <div v-if="!disabled && showActions" class="sc-image-actions">
        <el-tooltip content="查看" placement="left">
          <div class="action-btn" @click="handlePreview">
            <el-icon>
              <component :is="useRenderIcon('ep:zoom-in')" />
            </el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="编辑" placement="left">
          <div class="action-btn" @click="handleEdit">
            <el-icon>
              <component :is="useRenderIcon('ep:edit')" />
            </el-icon>
          </div>
        </el-tooltip>

        <el-tooltip v-if="enableCompare" content="图片比较" placement="left">
          <div class="action-btn" @click="handleStartCompare">
            <el-icon>
              <component :is="useRenderIcon('ep:picture')" />
            </el-icon>
          </div>
        </el-tooltip>

        <el-tooltip v-if="enableBackgroundRemoval" content="去除背景" placement="left">
          <div class="action-btn" @click="handleRemoveBackground">
            <el-icon>
              <component :is="useRenderIcon('ep:magic-stick')" />
            </el-icon>
          </div>
        </el-tooltip>

        <el-tooltip v-if="showDownload" content="下载" placement="left">
          <div class="action-btn" @click="handleDownload">
            <el-icon>
              <component :is="useRenderIcon('ep:download')" />
            </el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="删除" placement="left">
          <div class="action-btn delete" @click="handleRemove">
            <el-icon>
              <component :is="useRenderIcon('ep:delete')" />
            </el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- 处理进度 -->
      <div v-if="processing" class="sc-image-processing">
        <el-progress :percentage="processingProgress" :stroke-width="8" />
        <span class="processing-text">{{ processingText }}</span>
      </div>
    </div>

    <!-- 上传区域 -->
    <el-upload
      v-show="!currentImage || showUploadWhenHasImage"
      ref="uploadRef"
      class="sc-image-uploader"
      :disabled="disabled"
      :show-file-list="false"
      :auto-upload="false"
      :accept="accept"
      :limit="1"
      :on-change="handleChange"
      :before-upload="handleBeforeUpload"
      :drag="drag"
    >
      <slot name="upload">
        <div class="upload-content">
          <el-icon class="upload-icon">
            <component :is="useRenderIcon('ep:upload')" />
          </el-icon>
          <div class="upload-text">
            <p>
              拖拽图片到此处或
              <em>点击上传</em>
            </p>
            <p class="upload-tip">{{ uploadTip }}</p>
          </div>
        </div>
      </slot>
    </el-upload>

    <!-- 图片比较选择对话框 -->
    <el-dialog v-model="compareDialogVisible" title="选择对比图片" width="600px" :append-to-body="true" destroy-on-close>
      <el-upload ref="compareUploadRef" class="compare-upload" :show-file-list="false" :auto-upload="false" :accept="accept" :on-change="handleCompareImageChange" drag>
        <div v-if="!tempCompareImage" class="upload-content">
          <el-icon class="upload-icon">
            <component :is="useRenderIcon('ep:upload')" />
          </el-icon>
          <div class="upload-text">
            <p>上传要对比的图片</p>
          </div>
        </div>
        <div v-else class="compare-preview">
          <el-image :src="tempCompareImage" fit="contain" style="width: 100%; height: 300px" />
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="compareDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!tempCompareImage" @click="confirmCompare">开始比较</el-button>
      </template>
    </el-dialog>

    <!-- 图片编辑器 -->
    <ImageEditor 
      v-model="editorVisible" 
      :imageSrc="currentImage" 
      :imageBlob="originalImageBlob" 
      :show-upload="editorShowUpload"
      :show-crop="editorShowCrop"
      :show-rotate="editorShowRotate"
      :show-flip="editorShowFlip"
      :show-remove-background="editorShowRemoveBackground"
      :show-scale="editorShowScale"
      :show-background-tools="editorShowBackgroundTools"
      @confirm="handleEditorConfirm" 
      @cancel="handleEditorCancel" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { message } from "@repo/utils";
import { useRenderIcon } from "../ReIcon/src/hooks";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";
import ImageCompare from "./components/ImageCompare.vue";
import ImageEditor from "./components/ImageEditor.vue";
import ScCompare from "../ScCompare/index.vue";

// Props定义 - 完整支持 el-image 的所有属性
const props = defineProps({
  // 自定义属性
  modelValue: {
    type: String,
    default: ""
  },
  width: {
    type: String,
    default: "200px"
  },
  height: {
    type: String,
    default: "200px"
  },
  accept: {
    type: String,
    default: "image/jpeg,image/jpg,image/png,image/webp"
  },
  maxSize: {
    type: Number,
    default: 10 // MB
  },
  uploadTip: {
    type: String,
    default: "支持jpg、png、webp格式，大小不超过10MB"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showDownload: {
    type: Boolean,
    default: true
  },
  showUploadWhenHasImage: {
    type: Boolean,
    default: false
  },
  drag: {
    type: Boolean,
    default: true
  },

  // el-image 原生属性
  fit: {
    type: String,
    default: "cover",
    validator: value => ["fill", "contain", "cover", "none", "scale-down"].includes(value)
  },
  loading: {
    type: String,
    default: undefined
  },
  lazy: {
    type: Boolean,
    default: false
  },
  scrollContainer: {
    type: [String, Object],
    default: undefined
  },
  previewSrcList: {
    type: Array,
    default: undefined
  },
  zIndex: {
    type: Number,
    default: 9999
  },
  initialIndex: {
    type: Number,
    default: 0
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  zoomRate: {
    type: Number,
    default: 1.2
  },
  minScale: {
    type: Number,
    default: 0.2
  },
  maxScale: {
    type: Number,
    default: 7
  },
  hideOnClickModal: {
    type: Boolean,
    default: false
  },
  previewTeleported: {
    type: Boolean,
    default: false
  },
  infinite: {
    type: Boolean,
    default: true
  },

  // 增强功能
  enableBackgroundRemoval: {
    type: Boolean,
    default: true
  },
  enableCompare: {
    type: Boolean,
    default: true
  },
  compareDirection: {
    type: String,
    default: "horizontal", // horizontal | vertical
    validator: value => ["horizontal", "vertical"].includes(value)
  },
  backgroundRemovalConfig: {
    type: Object,
    default: () => ({
      model: "medium",
      output: {
        format: "image/png",
        quality: 0.8,
        type: "image/png"
      }
    })
  },

  // 编辑器工具栏自定义
  editorShowUpload: {
    type: Boolean,
    default: true
  },
  editorShowCrop: {
    type: Boolean,
    default: true
  },
  editorShowRotate: {
    type: Boolean,
    default: true
  },
  editorShowFlip: {
    type: Boolean,
    default: true
  },
  editorShowRemoveBackground: {
    type: Boolean,
    default: true
  },
  editorShowScale: {
    type: Boolean,
    default: true
  },
  editorShowBackgroundTools: {
    type: Boolean,
    default: true
  }
});

// Emits定义 - 完整支持 el-image 的所有事件
const emit = defineEmits(["update:modelValue", "change", "remove", "load", "error", "switch", "close", "show", "beforeUpload", "backgroundRemoved", "compareChange", "compareStart", "compareEnd"]);

// Refs
const imageRef = ref(null);
const uploadRef = ref(null);
const compareUploadRef = ref(null);
const viewerInstance = ref(null);

// State
const currentImage = ref("");
const processing = ref(false);
const processingProgress = ref(0);
const processingText = ref("");
const originalImageBlob = ref(null);

// 比较模式相关
const compareMode = ref(false);
const compareImage = ref("");
const compareValue = ref(50);
const compareDialogVisible = ref(false);
const tempCompareImage = ref("");
const currentCompareDirection = ref(props.compareDirection);
const useScCompare = ref(true); // 默认使用 ScCompare 组件
const compareLeftLabel = ref("原图");
const compareRightLabel = ref("对比图");

// 编辑器相关
const editorVisible = ref(false);

// Computed
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height
}));

const computedPreviewSrcList = computed(() => {
  if (props.previewSrcList) {
    return props.previewSrcList;
  }
  return currentImage.value ? [currentImage.value] : [];
});

// Watch
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      currentImage.value = newValue;
    } else {
      currentImage.value = "";
    }
  },
  { immediate: true }
);

watch(currentImage, newValue => {
  emit("update:modelValue", newValue);
  emit("change", newValue);
});

watch(
  () => props.compareDirection,
  newVal => {
    currentCompareDirection.value = newVal;
  }
);

// Methods
const handleChange = file => {
  const isValidType = props.accept.split(",").some(type => file.raw.type === type.trim());

  if (!isValidType) {
    message("请上传正确格式的图片", { type: "warning" });
    return;
  }

  const isValidSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isValidSize) {
    message(`图片大小不能超过 ${props.maxSize}MB`, { type: "warning" });
    return;
  }

  const url = URL.createObjectURL(file.raw);
  currentImage.value = url;
  originalImageBlob.value = file.raw;
};

const handleBeforeUpload = file => {
  const result = emit("beforeUpload", file);
  return result !== false;
};

const handleLoad = e => {
  emit("load", e);
};

const handleError = e => {
  emit("error", e);
  message("图片加载失败", { type: "error" });
};

const handleSwitch = index => {
  emit("switch", index);
};

const handleClose = () => {
  emit("close");
};

const handleShow = () => {
  emit("show");
};

const handlePreview = () => {
  if (!currentImage.value) return;

  // 销毁之前的实例
  if (viewerInstance.value) {
    viewerInstance.value.destroy();
    viewerInstance.value = null;
  }

  // 创建临时容器存放图片
  const container = document.createElement("div");
  container.style.display = "none";
  document.body.appendChild(container);

  // 添加图片元素
  computedPreviewSrcList.value.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    container.appendChild(img);
  });

  // 获取当前图片索引
  const currentIndex = computedPreviewSrcList.value.indexOf(currentImage.value);

  // 创建 Viewer 实例
  viewerInstance.value = new Viewer(container, {
    initialViewIndex: currentIndex >= 0 ? currentIndex : 0,
    inline: false,
    button: true,
    navbar: computedPreviewSrcList.value.length > 1,
    title: false,
    toolbar: {
      zoomIn: true,
      zoomOut: true,
      oneToOne: true,
      reset: true,
      prev: computedPreviewSrcList.value.length > 1,
      play: false,
      next: computedPreviewSrcList.value.length > 1,
      rotateLeft: true,
      rotateRight: true,
      flipHorizontal: true,
      flipVertical: true
    },
    tooltip: true,
    movable: true,
    zoomable: true,
    rotatable: true,
    scalable: true,
    keyboard: true,
    fullscreen: true,
    zoomRatio: 0.1,
    minZoomRatio: 0.1,
    maxZoomRatio: 10,
    hidden: () => {
      // 销毁实例并移除临时容器
      viewerInstance.value?.destroy();
      viewerInstance.value = null;
      container.remove();
    }
  });

  // 显示查看器
  viewerInstance.value.show();
};

const handleRemoveBackground = async () => {
  if (!currentImage.value || processing.value) return;

  try {
    processing.value = true;
    processingProgress.value = 0;
    processingText.value = "正在初始化...";

    const { removeBackground } = await import("@imgly/background-removal");

    processingProgress.value = 20;
    processingText.value = "正在分析图片...";

    let imageBlob = originalImageBlob.value;
    if (!imageBlob) {
      const response = await fetch(currentImage.value);
      imageBlob = await response.blob();
    }

    processingProgress.value = 40;
    processingText.value = "正在去除背景...";

    const config = {
      ...props.backgroundRemovalConfig,
      progress: (key, current, total) => {
        const progressPercent = 40 + Math.floor((current / total) * 50);
        processingProgress.value = progressPercent;
        processingText.value = `正在处理: ${key}`;
      }
    };

    const blob = await removeBackground(imageBlob, config);

    processingProgress.value = 95;
    processingText.value = "正在生成预览...";

    const newUrl = URL.createObjectURL(blob);

    if (currentImage.value.startsWith("blob:")) {
      URL.revokeObjectURL(currentImage.value);
    }

    currentImage.value = newUrl;
    originalImageBlob.value = blob;

    processingProgress.value = 100;
    processingText.value = "处理完成";

    emit("backgroundRemoved", blob, newUrl);
    message("背景去除成功", { type: "success" });

    setTimeout(() => {
      processing.value = false;
      processingProgress.value = 0;
      processingText.value = "";
    }, 500);
  } catch (error) {
    console.error("Background removal error:", error);
    message("背景去除失败: " + error.message, { type: "error" });
    processing.value = false;
    processingProgress.value = 0;
    processingText.value = "";
  }
};

const handleDownload = () => {
  if (!currentImage.value) return;

  const link = document.createElement("a");
  link.href = currentImage.value;
  link.download = `image_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  message("开始下载", { type: "success" });
};

const handleRemove = () => {
  if (currentImage.value.startsWith("blob:")) {
    URL.revokeObjectURL(currentImage.value);
  }
  currentImage.value = "";
  originalImageBlob.value = null;

  // 退出比较模式
  if (compareMode.value) {
    exitCompareMode();
  }

  emit("remove");

  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

// 图片比较相关方法
const handleStartCompare = () => {
  if (!currentImage.value) {
    message("请先上传图片", { type: "warning" });
    return;
  }
  compareDialogVisible.value = true;
  tempCompareImage.value = "";
};

const handleCompareImageChange = file => {
  const isValidType = props.accept.split(",").some(type => file.raw.type === type.trim());

  if (!isValidType) {
    message("请上传正确格式的图片", { type: "warning" });
    return;
  }

  const url = URL.createObjectURL(file.raw);
  tempCompareImage.value = url;
};

const confirmCompare = () => {
  if (!tempCompareImage.value) return;

  compareImage.value = tempCompareImage.value;
  compareMode.value = true;
  compareDialogVisible.value = false;

  emit("compareStart", currentImage.value, compareImage.value);
  message("已进入比较模式", { type: "success" });
};

const exitCompareMode = () => {
  if (compareImage.value && compareImage.value.startsWith("blob:")) {
    URL.revokeObjectURL(compareImage.value);
  }

  compareMode.value = false;
  compareImage.value = "";
  compareValue.value = 50;

  emit("compareEnd");
};

const toggleCompareDirection = () => {
  currentCompareDirection.value = currentCompareDirection.value === "horizontal" ? "vertical" : "horizontal";
};

const toggleCompareMode = () => {
  useScCompare.value = !useScCompare.value;
};

const handleCompareChange = value => {
  compareValue.value = value;
  emit("compareChange", value);
};

// 编辑器相关方法
const handleEdit = () => {
  if (!currentImage.value) {
    message("请先上传图片", { type: "warning" });
    return;
  }
  editorVisible.value = true;
};

const handleEditorConfirm = (blob, url) => {
  // 更新图片
  if (currentImage.value.startsWith("blob:")) {
    URL.revokeObjectURL(currentImage.value);
  }

  currentImage.value = url;
  originalImageBlob.value = blob;

  emit("change", url);
  emit("update:modelValue", url);
  message("图片编辑成功", { type: "success" });
};

const handleEditorCancel = () => {
  // 用户取消编辑，不做任何处理
};

// 清理函数
const cleanup = () => {
  if (viewerInstance.value) {
    viewerInstance.value.destroy();
    viewerInstance.value = null;
  }

  if (currentImage.value && currentImage.value.startsWith("blob:")) {
    URL.revokeObjectURL(currentImage.value);
  }

  if (compareImage.value && compareImage.value.startsWith("blob:")) {
    URL.revokeObjectURL(compareImage.value);
  }
};

// Lifecycle
onBeforeUnmount(() => {
  cleanup();
});

// Expose methods
defineExpose({
  handleRemoveBackground,
  handlePreview,
  handleDownload,
  handleRemove,
  handleStartCompare,
  exitCompareMode,
  toggleCompareDirection,
  toggleCompareMode,
  handleEdit,
  cleanup
});
</script>

<style scoped>
.sc-image-container {
  position: relative;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.sc-image-container:hover {
  border-color: var(--el-color-primary);
}

.sc-image-container.sc-image-compare {
  border-color: var(--el-color-success);
}

.sc-image-wrapper,
.sc-image-compare-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.sc-image {
  width: 100%;
  height: 100%;
}

.sc-image :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
}

.sc-image-placeholder,
.sc-image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.sc-image-placeholder .el-icon,
.sc-image-error .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.sc-image-placeholder span,
.sc-image-error span {
  font-size: 14px;
}

/* 操作按钮 */
.sc-image-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
  border-radius: 0 6px 0 0;
  z-index: 10;
}

.sc-image-actions.compare-actions {
  display: flex;
  flex-direction: row;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
}

.sc-image-wrapper:hover .sc-image-actions {
  display: flex;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  background-color: var(--el-color-primary);
  color: white;
  transform: scale(1.1);
}

.action-btn.delete:hover {
  background-color: var(--el-color-danger);
}

.action-btn .el-icon {
  font-size: 18px;
}

/* 处理进度 */
.sc-image-processing {
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
  z-index: 20;
  padding: 20px;
}

.sc-image-processing .el-progress {
  width: 80%;
}

.processing-text {
  margin-top: 16px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

/* 上传区域 */
.sc-image-uploader {
  width: 100%;
  height: 100%;
}

.sc-image-uploader :deep(.el-upload) {
  width: 100%;
  height: 100%;
}

.sc-image-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: none;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
  transition: all 0.3s;
}

.sc-image-uploader :deep(.el-upload-dragger:hover) {
  background-color: var(--el-fill-color-light);
  border-color: var(--el-color-primary);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 48px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.upload-text {
  text-align: center;
}

.upload-text p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.upload-text em {
  font-style: normal;
  color: var(--el-color-primary);
  font-weight: 500;
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

/* 比较对话框 */
.compare-upload {
  width: 100%;
}

.compare-upload :deep(.el-upload) {
  width: 100%;
}

.compare-upload :deep(.el-upload-dragger) {
  width: 100%;
  min-height: 300px;
}

.compare-preview {
  width: 100%;
  padding: 10px;
}

/* 禁用状态 */
.sc-image-container.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 响应式 */
@media (max-width: 768px) {
  .action-btn {
    width: 28px;
    height: 28px;
  }

  .action-btn .el-icon {
    font-size: 16px;
  }

  .upload-icon {
    font-size: 36px;
  }

  .upload-text p {
    font-size: 12px;
  }

  .upload-tip {
    font-size: 11px;
  }
}
</style>
