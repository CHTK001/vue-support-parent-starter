<template>
  <div class="image-compressor-container">
    <div class="tool-description">
      <el-alert type="info" show-icon :closable="false">
        <p>图片压缩工具可以帮助您快速压缩图片大小，支持多种图片格式，压缩效果清晰可见。</p>
        <p>上传图片后可以调整压缩质量，预览效果并下载压缩后的图片。</p>
      </el-alert>
    </div>

    <el-row :gutter="20" class="main-content">
      <el-col :span="12">
        <div class="upload-area">
          <div v-if="!originalImage.url" class="drop-area" @dragover.prevent @drop="handleDrop">
            <el-upload drag action="#" :auto-upload="false" :show-file-list="false" :on-change="handleFileChange" accept="image/jpeg,image/png,image/gif,image/webp">
              <IconifyIconOnline icon="ri:upload-cloud-2-line" class="upload-icon" />
              <div class="el-upload__text">拖拽图片到此处或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">支持 JPG、PNG、GIF、WebP 格式，单个文件不超过10MB</div>
              </template>
            </el-upload>
          </div>
          <div v-else class="image-preview original-preview">
            <div class="image-header">
              <h3>原始图片</h3>
              <div class="image-info">
                <span>{{ originalImage.size }}</span>
                <span>{{ originalImage.dimensions }}</span>
              </div>
            </div>
            <div class="image-container">
              <img :src="originalImage.url" alt="原始图片" />
            </div>
            <div class="preview-actions">
              <el-button type="danger" @click="resetImage" size="small">
                <IconifyIconOnline icon="ri:delete-bin-line" />
                移除图片
              </el-button>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="compression-area">
          <div v-if="compressedImage.url" class="image-preview compressed-preview">
            <div class="image-header">
              <h3>压缩图片</h3>
              <div class="image-info">
                <span>{{ compressedImage.size }}</span>
                <span>{{ compressedImage.dimensions }}</span>
                <span class="saving-info" v-if="savingPercent">节省 {{ savingPercent }}%</span>
              </div>
            </div>
            <div class="image-container">
              <img :src="compressedImage.url" alt="压缩图片" />
            </div>
            <div class="preview-actions">
              <el-button type="primary" @click="downloadImage" size="small">
                <IconifyIconOnline icon="ri:download-line" />
                下载图片
              </el-button>
            </div>
          </div>
          <div v-else-if="originalImage.url" class="compression-placeholder">
            <div class="compression-controls">
              <h3>压缩设置</h3>
              <div class="quality-slider">
                <span>压缩质量：{{ quality }}%</span>
                <el-slider v-model="quality" :min="1" :max="100" @change="compressImage" />
              </div>
              <div class="format-selector">
                <span>输出格式：</span>
                <el-radio-group v-model="outputFormat" @change="compressImage">
                  <el-radio label="jpeg">JPEG</el-radio>
                  <el-radio label="png">PNG</el-radio>
                  <el-radio label="webp">WebP</el-radio>
                </el-radio-group>
              </div>
              <div class="resize-control">
                <el-checkbox v-model="shouldResize" @change="compressImage">调整图片大小</el-checkbox>
                <div v-if="shouldResize" class="resize-inputs">
                  <el-input-number v-model="resizeWidth" :min="10" :max="5000" @change="compressImage" size="small" />
                  <span>×</span>
                  <el-input-number v-model="resizeHeight" :min="10" :max="5000" @change="compressImage" size="small" />
                  <el-checkbox v-model="keepAspectRatio" @change="handleAspectRatioChange">保持比例</el-checkbox>
                </div>
              </div>
              <el-button type="success" @click="compressImage" :loading="isCompressing" class="compress-btn">
                <IconifyIconOnline icon="ri:compress-line" />
                开始压缩
              </el-button>
            </div>
          </div>
          <div v-else class="empty-preview">
            <IconifyIconOnline icon="ri:image-edit-line" class="empty-icon" />
            <p>请先上传图片</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="compression-tips">
      <h3>图片压缩小贴士</h3>
      <ul>
        <li>对于照片和复杂图像，建议使用JPEG格式，质量设置为70-80%</li>
        <li>对于需要透明度的图像，建议使用PNG格式</li>
        <li>WebP格式提供更好的压缩比，但较老的浏览器可能不支持</li>
        <li>调整图片尺寸是减小文件大小的有效方法</li>
        <li>压缩是不可逆的过程，请确保保留原图的副本</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { message } from "@repo/utils";

// 图片数据
const originalImage = ref({
  file: null,
  url: "",
  size: "",
  dimensions: "",
  width: 0,
  height: 0,
});

const compressedImage = ref({
  url: "",
  blob: null,
  size: "",
  dimensions: "",
  width: 0,
  height: 0,
});

// 压缩设置
const quality = ref(80);
const outputFormat = ref("jpeg");
const shouldResize = ref(false);
const resizeWidth = ref(800);
const resizeHeight = ref(600);
const keepAspectRatio = ref(true);
const isCompressing = ref(false);

// 计算节省的百分比
const savingPercent = computed(() => {
  if (!originalImage.value.file || !compressedImage.value.blob) return null;

  const originalSize = originalImage.value.file.size;
  const compressedSize = compressedImage.value.blob.size;

  if (originalSize === 0) return 0;

  const saving = ((originalSize - compressedSize) / originalSize) * 100;
  return saving.toFixed(1);
});

// 文件大小格式化
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 处理文件变化
const handleFileChange = (file) => {
  if (!file) return;

  const isImage = file.raw.type.startsWith("image/");
  const isLt10M = file.raw.size / 1024 / 1024 < 10;

  if (!isImage) {
    message("只能上传图片文件!", { type: "error" });
    return;
  }

  if (!isLt10M) {
    message("图片大小不能超过10MB!", { type: "error" });
    return;
  }

  resetImage();
  originalImage.value.file = file.raw;
  originalImage.value.url = URL.createObjectURL(file.raw);
  originalImage.value.size = formatFileSize(file.raw.size);

  const img = new Image();
  img.onload = () => {
    originalImage.value.width = img.width;
    originalImage.value.height = img.height;
    originalImage.value.dimensions = `${img.width} × ${img.height}`;

    // 设置默认的调整大小值
    resizeWidth.value = img.width;
    resizeHeight.value = img.height;

    // 自动压缩图片
    compressImage();
  };
  img.src = originalImage.value.url;
};

// 处理拖放上传
const handleDrop = (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;

  if (files.length === 0) return;

  const file = files[0];
  handleFileChange({ raw: file });
};

// 压缩图片
const compressImage = async () => {
  if (!originalImage.value.file) return;

  isCompressing.value = true;

  try {
    // 创建一个新的 canvas 元素
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 加载图片
    const img = new Image();
    img.src = originalImage.value.url;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // 设置 canvas 大小
    let targetWidth = img.width;
    let targetHeight = img.height;

    if (shouldResize.value) {
      targetWidth = resizeWidth.value;
      targetHeight = resizeHeight.value;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 绘制图片到 canvas
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // 将 canvas 转换为 blob
    const mimeType = outputFormat.value === "jpeg" ? "image/jpeg" : outputFormat.value === "png" ? "image/png" : "image/webp";

    canvas.toBlob(
      (blob) => {
        if (blob) {
          // 释放之前的URL
          if (compressedImage.value.url) {
            URL.revokeObjectURL(compressedImage.value.url);
          }

          compressedImage.value.blob = blob;
          compressedImage.value.url = URL.createObjectURL(blob);
          compressedImage.value.size = formatFileSize(blob.size);
          compressedImage.value.width = targetWidth;
          compressedImage.value.height = targetHeight;
          compressedImage.value.dimensions = `${targetWidth} × ${targetHeight}`;

          isCompressing.value = false;
        }
      },
      mimeType,
      quality.value / 100
    );
  } catch (error) {
    console.error("压缩图片失败:", error);
    message("压缩图片失败，请重试", { type: "error" });
    isCompressing.value = false;
  }
};

// 下载压缩后的图片
const downloadImage = () => {
  if (!compressedImage.value.url) return;

  const a = document.createElement("a");
  a.href = compressedImage.value.url;

  // 设置文件名
  const originalName = originalImage.value.file.name;
  const extension = outputFormat.value === "jpeg" ? ".jpg" : outputFormat.value === "png" ? ".png" : ".webp";

  const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
  a.download = `${baseName}_compressed${extension}`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 重置图片
const resetImage = () => {
  if (originalImage.value.url) {
    URL.revokeObjectURL(originalImage.value.url);
  }

  if (compressedImage.value.url) {
    URL.revokeObjectURL(compressedImage.value.url);
  }

  originalImage.value = {
    file: null,
    url: "",
    size: "",
    dimensions: "",
    width: 0,
    height: 0,
  };

  compressedImage.value = {
    url: "",
    blob: null,
    size: "",
    dimensions: "",
    width: 0,
    height: 0,
  };
};

// 处理宽高比例
const handleAspectRatioChange = () => {
  if (keepAspectRatio.value && originalImage.value.width > 0) {
    const ratio = originalImage.value.width / originalImage.value.height;

    // 宽度变化时，调整高度
    watch(resizeWidth, (newWidth) => {
      if (keepAspectRatio.value) {
        resizeHeight.value = Math.round(newWidth / ratio);
      }
    });

    // 高度变化时，调整宽度
    watch(resizeHeight, (newHeight) => {
      if (keepAspectRatio.value) {
        resizeWidth.value = Math.round(newHeight * ratio);
      }
    });
  }
};

// 组件卸载前清理资源
onBeforeUnmount(() => {
  resetImage();
});
</script>

<style scoped>
.image-compressor-container {
  padding: 20px;
}

.tool-description {
  margin-bottom: 20px;
}

.main-content {
  margin-bottom: 30px;
}

.upload-area,
.compression-area {
  height: 100%;
  min-height: 400px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.drop-area {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 10px;
}

.image-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: var(--el-background-color-base);
  border-bottom: 1px solid var(--el-border-color-light);
}

.image-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.image-info {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.saving-info {
  color: var(--el-color-success);
  font-weight: bold;
}

.image-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  background-color: #f5f7fa;
}

.image-container img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.preview-actions {
  padding: 10px 15px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: flex-end;
}

.compression-placeholder,
.empty-preview {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 20px;
}

.empty-icon {
  font-size: 60px;
  color: var(--el-text-color-secondary);
  margin-bottom: 15px;
}

.compression-controls {
  width: 100%;
  max-width: 400px;
}

.compression-controls h3 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
}

.quality-slider,
.format-selector,
.resize-control {
  margin-bottom: 20px;
}

.resize-inputs {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.compress-btn {
  width: 100%;
  margin-top: 10px;
}

.compression-tips {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 15px 20px;
}

.compression-tips h3 {
  margin-top: 0;
  font-size: 16px;
  margin-bottom: 10px;
}

.compression-tips ul {
  margin: 0;
  padding-left: 20px;
}

.compression-tips li {
  margin-bottom: 5px;
  line-height: 1.5;
}
</style>
