<script setup>
import { reactive, ref, onMounted, nextTick } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际�?
const { t } = useI18n();

// 图片处理相关引用
const imageRef = ref(null);
const canvasRef = ref(null);
const resultCanvasRef = ref(null);

// 环境变量
const env = reactive({
  loading: false,
  sourceImage: null,
  resultImage: null,
  imageSize: {
    width: 0,
    height: 0
  }
});

/**
 * 处理图片上传
 * @param {Object} e - 上传事件对象
 */
const handleImageUpload = e => {
  const file = e.target.files[0];
  if (!file) return;

  // 验证文件类型
  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!validTypes.includes(file.type)) {
    message(t("message.fileTypeError"), { type: "error" });
    return;
  }

  // 验证文件大小 (最�?0MB)
  if (file.size > 10 * 1024 * 1024) {
    message(t("message.fileSizeError"), { type: "error" });
    return;
  }

  const reader = new FileReader();
  reader.onload = event => {
    env.sourceImage = event.target.result;

    // 加载图片以获取尺�?
    const img = new Image();
    img.onload = () => {
      env.imageSize.width = img.width;
      env.imageSize.height = img.height;

      // 等待DOM更新后处理图�?
      nextTick(() => {
        imageRef.value.src = env.sourceImage;
      });
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

/**
 * 处理图片拖放
 * @param {Object} e - 拖放事件对象
 */
const handleDrop = e => {
  e.preventDefault();
  e.stopPropagation();

  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0];

    // 创建一个新的事件对象模拟文件上�?
    const event = {
      target: {
        files: [file]
      }
    };

    handleImageUpload(event);
  }
};

/**
 * 阻止默认拖放行为
 * @param {Object} e - 事件对象
 */
const handleDragOver = e => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * 执行番茄混淆解析
 */
const processFanqie = async () => {
  if (!env.sourceImage) {
    message(t("message.noImageSelected"), { type: "warning" });
    return;
  }

  env.loading = true;

  try {
    // 获取图像数据
    const canvas = canvasRef.value;
    const ctx = canvas.getContext("2d");

    // 设置canvas尺寸与图像一�?
    canvas.width = env.imageSize.width;
    canvas.height = env.imageSize.height;

    // 绘制原始图像到canvas
    ctx.drawImage(imageRef.value, 0, 0, canvas.width, canvas.height);

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 番茄混淆解析算法
    // 这里实现番茄混淆的反解析逻辑
    for (let i = 0; i < data.length; i += 4) {
      // 反转RGB通道
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 番茄混淆解析算法 (示例算法，实际应根据具体混淆方式调整)
      data[i] = 255 - r; // R通道反转
      data[i + 1] = 255 - g; // G通道反转
      data[i + 2] = 255 - b; // B通道反转
      // Alpha通道保持不变
    }

    // 将处理后的图像数据绘制到结果canvas
    const resultCanvas = resultCanvasRef.value;
    const resultCtx = resultCanvas.getContext("2d");

    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    resultCtx.putImageData(imageData, 0, 0);

    // 将结果canvas转换为图像URL
    env.resultImage = resultCanvas.toDataURL("image/png");

    message(t("message.processSuccess"), { type: "success" });
  } catch (error) {
    console.error("番茄混淆处理错误:", error);
    message(t("message.processError"), { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 下载处理后的图片
 */
const downloadResult = () => {
  if (!env.resultImage) {
    message(t("message.noResultImage"), { type: "warning" });
    return;
  }

  const link = document.createElement("a");
  link.href = env.resultImage;
  link.download = "fanqie_decoded.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 重置处理
 */
const resetProcess = () => {
  env.sourceImage = null;
  env.resultImage = null;
  env.imageSize = {
    width: 0,
    height: 0
  };
};
</script>

<template>
  <div class="fanqie">
    <div class="fanqie__header">
      <div class="fanqie__title">
        <IconifyIconOnline icon="ri:image-edit-line" class="fanqie__title-icon" />
        <span>番茄混淆图片解析</span>
      </div>
      <div class="fanqie__subtitle">上传一张番茄混淆的图片，系统将自动反解析出原图</div>
    </div>

    <div class="fanqie__content">
      <el-row :gutter="20">
        <!-- 上传区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="fanqie__result-title">
            <IconifyIconOnline icon="ri:image-2-line" class="fanqie__result-icon" />
            <span>解析原图</span>
          </div>
          <div class="fanqie__upload-area" :class="{ 'fanqie__upload-area--active': env.sourceImage }" @drop="handleDrop" @dragover="handleDragOver">
            <div v-if="!env.sourceImage" class="fanqie__upload-placeholder">
              <IconifyIconOnline icon="ri:upload-cloud-2-line" class="fanqie__upload-icon" />
              <div class="fanqie__upload-text">拖放图片到此处或点击上传</div>
              <div class="fanqie__upload-tip">支持 JPG、PNG 格式，最�?10MB</div>
              <el-button type="primary" class="fanqie__upload-btn">
                <IconifyIconOnline icon="ri:image-add-line" />
                <span>选择图片</span>
                <input type="file" class="fanqie__upload-input" accept=".jpg,.jpeg,.png" @change="handleImageUpload" />
              </el-button>
            </div>

            <div v-else class="fanqie__image-preview">
              <img ref="imageRef" class="fanqie__source-image" alt="原始图片" />
              <div class="fanqie__image-info">
                <div class="fanqie__image-size">尺寸: {{ env.imageSize.width }} × {{ env.imageSize.height }} 像素</div>
              </div>
            </div>
          </div>

          <div class="fanqie__actions">
            <el-button type="primary" :loading="env.loading" :disabled="!env.sourceImage" class="fanqie__process-btn" @click="processFanqie">
              <IconifyIconOnline icon="ri:magic-line" />
              <span>解析图片</span>
            </el-button>

            <el-button :disabled="!env.sourceImage" class="fanqie__reset-btn" @click="resetProcess">
              <IconifyIconOnline icon="ri:refresh-line" />
              <span>重置</span>
            </el-button>
          </div>
        </el-col>

        <!-- 结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="fanqie__result-area">
            <div class="fanqie__result-title">
              <IconifyIconOnline icon="ri:image-2-line" class="fanqie__result-icon" />
              <span>解析结果</span>
            </div>

            <div class="fanqie__result-content">
              <el-empty v-if="!env.resultImage" description="请先上传并解析图�? class="fanqie__empty" />

              <div v-else class="fanqie__result-image-container">
                <img :src="env.resultImage" class="fanqie__result-image" alt="解析结果" />

                <div class="fanqie__result-actions">
                  <el-button type="success" class="fanqie__download-btn" @click="downloadResult">
                    <IconifyIconOnline icon="ri:download-line" />
                    <span>下载结果</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 隐藏的Canvas用于图像处理 -->
    <canvas ref="canvasRef" class="fanqie__hidden-canvas" />
    <canvas ref="resultCanvasRef" class="fanqie__hidden-canvas" />
  </div>
</template>

<style lang="scss" scoped>
.fanqie {
  padding: 20px;

  /* 头部样式 */
  &__header {
    margin-bottom: 24px;
    text-align: center;
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-color-primary);

    &-icon {
      font-size: 28px;
      margin-right: 8px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
  }

  &__subtitle {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
  }

  /* 内容区域样式 */
  &__content {
    background-color: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    padding: 20px;
  }

  /* 上传区域样式 */
  &__upload-area {
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s ease;
    background-color: var(--el-fill-color-lighter);
    min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background-color: var(--el-fill-color-light);
    }

    &--active {
      border-color: var(--el-color-success-light-5);
      background-color: var(--el-fill-color-blank);
    }
  }

  &__upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  &__upload-icon {
    font-size: 64px;
    color: var(--el-color-primary-light-5);
    margin-bottom: 16px;
    animation: float 3s ease-in-out infinite;
  }

  &__upload-text {
    font-size: 16px;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  &__upload-tip {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
  }

  &__upload-btn {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  &__upload-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  /* 图片预览区域样式 */
  &__image-preview {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__source-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
  }

  &__image-info {
    margin-top: 12px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    background-color: var(--el-fill-color-light);
    padding: 4px 12px;
    border-radius: 16px;
  }

  /* 操作按钮区域样式 */
  &__actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 20px;
  }

  &__process-btn,
  &__reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 结果区域样式 */
  &__result-area {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  }

  &__result-title {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(to right, var(--el-color-success-light-9), var(--el-bg-color));
    border-bottom: 1px solid var(--el-border-color-lighter);

    &-icon {
      font-size: 20px;
      color: var(--el-color-success);
      margin-right: 8px;
    }
  }

  &__result-content {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  &__result-image-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: fadeIn 0.5s ease;
  }

  &__result-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
  }

  &__result-actions {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  &__download-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition:
        width 0.4s ease,
        height 0.4s ease;
      z-index: 0;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      &::before {
        width: 150%;
        height: 150%;
      }
    }

    &:active {
      transform: translateY(0);
    }

    span,
    i {
      position: relative;
      z-index: 1;
    }
  }

  /* 隐藏的Canvas */
  &__hidden-canvas {
    display: none;
  }
}

/* 动画效果 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调�?*/
@media (max-width: 768px) {
  .fanqie {
    &__upload-area,
    &__result-area {
      margin-bottom: 20px;
    }

    &__actions {
      flex-direction: column;
      gap: 10px;
    }
  }
}
</style>
