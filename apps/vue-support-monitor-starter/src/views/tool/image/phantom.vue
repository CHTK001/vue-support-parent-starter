<script setup>
// 导入API和响应式API
import { fetchToolPhantom } from "@/api/monitor/tools";
import { ref } from "vue";

// 响应式数据定�?
const leftFile = ref();
const rightFile = ref();
const sourceImage = ref();
const loading = ref(false);

/**
 * 处理左侧图片上传变更
 * @param {Object} file - 上传的文件对�?
 */
const handleLeftChange = async file => {
  leftFile.value = file.raw;
  sourceImage.value = null;
};

/**
 * 处理右侧图片上传变更
 * @param {Object} file - 上传的文件对�?
 */
const handleRightChange = async file => {
  rightFile.value = file.raw;
  sourceImage.value = null;
};

/**
 * 生成幻影图片
 */
const handleGenerate = async () => {
  if (!leftFile.value || !rightFile.value) {
    ElMessage.warning("请先上传两张图片");
    return;
  }

  loading.value = true;
  const form = new FormData();
  form.append("files", leftFile.value);
  form.append("files", rightFile.value);

  try {
    const res = await fetchToolPhantom(form);
    sourceImage.value = "data:image/png;base64," + res.data;
  } catch (error) {
    ElMessage.error("生成图片失败");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="phantom-container">
    <el-card class="phantom-card">
      <template #header>
        <div class="phantom-header">
          <h2 class="phantom-title">幻影图像生成工具</h2>
          <span class="phantom-subtitle">上传亮暗两张图片，生成幻影效�?/span>
        </div>
      </template>

      <div class="phantom-content">
        <el-row :gutter="24" class="phantom-row">
          <!-- 上传区域 -->
          <el-col :span="12" class="phantom-upload-col">
            <el-row class="phantom-upload-row">
              <!-- 左侧上传 -->
              <el-col :span="10" class="phantom-upload-item">
                <el-upload drag class="phantom-upload" :auto-upload="false" :limit="1" :on-change="handleLeftChange" accept=".jpeg,.jpg,.png">
                  <IconifyIconOnline icon="ep:upload" class="phantom-upload-icon" />
                  <div class="phantom-upload-text">上传亮色图片</div>
                  <div class="phantom-upload-tip">支持 JPG、PNG 格式</div>
                </el-upload>
              </el-col>

              <!-- 生成按钮 -->
              <el-col :span="4" class="phantom-generate-col">
                <el-button type="primary" class="phantom-generate-btn" :loading="loading" @click="handleGenerate">
                  <IconifyIconOnline icon="ri:magic-line" />
                  <span>生成</span>
                </el-button>
              </el-col>

              <!-- 右侧上传 -->
              <el-col :span="10" class="phantom-upload-item">
                <el-upload drag class="phantom-upload" :auto-upload="false" :limit="1" :on-change="handleRightChange" accept=".jpeg,.jpg,.png">
                  <IconifyIconOnline icon="ep:upload" class="phantom-upload-icon" />
                  <div class="phantom-upload-text">上传暗色图片</div>
                  <div class="phantom-upload-tip">支持 JPG、PNG 格式</div>
                </el-upload>
              </el-col>
            </el-row>
          </el-col>

          <!-- 预览区域 -->
          <el-col :span="12" class="phantom-preview-col">
            <div class="phantom-preview">
              <div class="phantom-preview-header">预览结果</div>
              <div class="phantom-preview-content">
                <el-image v-if="sourceImage" :src="sourceImage" class="phantom-result-image" fit="contain" :preview-src-list="sourceImage ? [sourceImage] : []" />
                <el-empty v-else description="请上传两张图片后点击生成" />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.phantom {
  &-container {
    padding: var(--el-padding-medium);
    background-color: var(--el-bg-color-page);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; // 防止出现滚动�?
  }

  &-card {
    width: 100%;
    height: 100%;
    max-height: calc(100vh - 2 * var(--el-padding-medium));
    box-shadow: var(--el-box-shadow-light);
    display: flex;
    flex-direction: column;
    overflow: hidden; // 防止卡片内容溢出
  }

  &-content {
    flex: 1;
    overflow: hidden; // 防止内容溢出
    padding: var(--el-padding-medium);
  }

  &-header {
    display: flex;
    flex-direction: column;
  }

  &-title {
    font-size: var(--el-font-size-large);
    font-weight: bold;
    color: var(--el-text-color-primary);
    margin: 0;
  }

  &-subtitle {
    font-size: var(--el-font-size-base);
    color: var(--el-text-color-secondary);
    margin-top: var(--el-margin-small);
  }

  &-row {
    height: 100%;
  }

  &-upload {
    &-col {
      height: 100%;
    }

    &-row {
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &-item {
      height: 100%;
      max-height: 300px;
    }

    & {
      height: 100%;
      border-radius: var(--el-border-radius-base);

      &:hover {
        border-color: var(--el-color-primary);
      }
    }

    &-icon {
      font-size: 32px;
      color: var(--el-text-color-placeholder);
      margin-bottom: var(--el-margin-small);
    }

    &-text {
      color: var(--el-text-color-regular);
      font-size: var(--el-font-size-medium);
      margin-bottom: var(--el-margin-small);
    }

    &-tip {
      color: var(--el-text-color-secondary);
      font-size: var(--el-font-size-small);
    }
  }

  &-generate {
    &-col {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    &-btn {
      width: 100%;
      height: 50px;
      font-size: var(--el-font-size-medium);
    }
  }

  &-preview {
    &-col {
      height: 100%;
    }

    & {
      height: 100%;
      padding: var(--el-padding-medium);
      background-color: var(--el-bg-color);
      border-radius: var(--el-border-radius-base);
      border: 1px solid var(--el-border-color-lighter);
      display: flex;
      flex-direction: column;
    }

    &-header {
      font-size: var(--el-font-size-medium);
      font-weight: bold;
      color: var(--el-text-color-primary);
      margin-bottom: var(--el-margin-medium);
      padding-bottom: var(--el-padding-small);
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    &-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden; // 防止内容溢出
    }

    &-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: var(--el-border-radius-base);
    }
  }
}
</style>
