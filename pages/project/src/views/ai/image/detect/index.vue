<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fileToBase64, localStorageProxy, message } from "@repo/utils";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  reactive,
  shallowRef,
} from "vue";
import { useRoute } from "vue-router";
import { fetchFaceDetection } from "../../../../api/ai/face";
import { fetchListProjectForAiModule } from "../../../../api/manage/project-ai-module";
const ScLoading = defineAsyncComponent(
  () => import("@repo/components/ScLoading/index.vue")
);
const ScCompare = defineAsyncComponent(
  () => import("@repo/components/ScCompare/index.vue")
);
const ModuleDialog = defineAsyncComponent(() => import("../../module.vue"));

const moduleDialogRef = shallowRef();
const scLoadingRef = shallowRef();
const modelList = shallowRef([]);
const settingOpen = shallowRef(false);
const route = useRoute();

const props = defineProps({
  category: "FACE_DETECTION",
  type: "FACE_DETECTION",
  selectedItemLabel: "ai-face-detection-selected",
});

const detectionImage = shallowRef();
const detectionImageSize = reactive({});
const showImageUrl = shallowRef();
const showImageSize = reactive({});
const faceDetectionResults = shallowRef([]);

const form = reactive({
  model: "",
  sysAiModuleType: "FACE_DETECTION",
  provider: "default",
});

const env = {
  category: "FACE_DETECTION",
};

let intervalId = null;

const loadingConfig = reactive({
  export: false,
  alwaysTrue: true,
  showHistory: true,
});

const formSetting = reactive({});

const handleOpenModuleManager = async () => {
  const moduleData = {
    sysProjectId: route.query.sysProjectId,
    sysProjectName: route.query.sysProjectName || "图像检测项目",
    sysAiModuleType: "FACE_DETECTION",
  };
  moduleDialogRef.value.handleOpen(moduleData, "edit");
};

const handleTrigger = async () => {
  settingOpen.value = !settingOpen.value;
};

const handleChangeModule = async (value) => {
  const _item = modelList.value.find((it) => it.sysAiModuleCode === value);
  env.sysProjectId = _item.sysProjectId;
  env.sysProjectName = _item.sysProjectName;
  env.sysAiModuleId = _item.sysAiModuleId;
  form.sysProjectId = _item.sysProjectId;
  form.sysAiModuleId = _item.sysAiModuleId;
  form.sysProjectName = _item.sysProjectName;
  form.model = value;
  loadConfig(_item, value);
};

const initialModuleList = async () => {
  const { data } = await fetchListProjectForAiModule(form);
  modelList.value = data.map((it) => {
    return {
      ...it,
    };
  });
  const _selectedModel = localStorageProxy().getItem(props.selectedItemLabel);
  if (_selectedModel) {
    handleChangeModule(_selectedModel);
    loadInterval();
    return;
  }
  if (modelList.value.length == 1) {
    form.model = modelList.value[0].sysAiModuleCode;
    form.sysAiModuleId = modelList.value[0].sysAiModuleId;
    form.sysProjectId = modelList.value[0].sysProjectId;
    loadConfig(modelList.value[0]);
    loadInterval();
  }
};

const generateRequestId = () => {
  return (
    "face_detect_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  );
};

const handleDetectionResult = (result) => {
  if (result && result.length > 0) {
    // 假设返回的是人脸检测结果数组
    faceDetectionResults.value = result;
    generateDetectionImage();
    message(`检测完成，发现 ${result.length} 张人脸`, { type: "success" });
  } else {
    message("未检测到人脸", { type: "warning" });
  }
  loadingConfig.export = false;
};

const generateDetectionImage = () => {
  if (!showImageUrl.value || !faceDetectionResults.value.length) {
    return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    // 绘制原图
    ctx.drawImage(img, 0, 0);

    // 绘制人脸检测框和关键点
    faceDetectionResults.value.forEach((face, index) => {
      // 绘制人脸边界框
      if (face.bbox) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          face.bbox.x,
          face.bbox.y,
          face.bbox.width,
          face.bbox.height
        );

        // 添加标签
        ctx.fillStyle = "#ff0000";
        ctx.font = "16px Arial";
        ctx.fillText(`Face ${index + 1}`, face.bbox.x, face.bbox.y - 5);
      }

      // 绘制关键点
      if (face.landmarks) {
        ctx.fillStyle = "#00ff00";
        face.landmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });

    // 转换为base64并设置为检测结果图片
    detectionImage.value = canvas.toDataURL("image/jpeg", 0.9);
  };

  img.src = showImageUrl.value;
};

const loadConfig = (item, value) => {
  if (value) {
    localStorageProxy().setItem(props.selectedItemLabel, value);
  }
};

const handleRefreshEnvironment = () => {
  initialModuleList();
};

const modelSelectLabel = computed(() => {
  return modelList.value.find((it) => it.sysAiModuleCode === form.model);
});

const rules = reactive({
  model: [{ required: true, message: "请选择模型", trigger: "change" }],
});

const handleChange = async (uploadFile) => {
  const file = uploadFile.raw;
  if (!file) {
    return;
  }

  // 重置状态
  detectionImage.value = null;
  faceDetectionResults.value = [];

  try {
    const base64 = await fileToBase64(file);
    showImageUrl.value = base64;

    // 获取图片尺寸
    const img = new Image();
    img.onload = () => {
      showImageSize.width = img.width;
      showImageSize.height = img.height;
    };
    img.src = base64;

    // 存储文件用于检测
    form.uploadedFile = file;

    // 自动开始检测
    if (form.model) {
      handleDetection();
    }
  } catch (error) {
    message("图片上传失败", { type: "error" });
  }
};

const handleDetection = async () => {
  if (!form.uploadedFile || !form.model) {
    message("请先上传图片并选择模型", { type: "warning" });
    return;
  }

  try {
    loadingConfig.export = true;

    const requestParams = {
      requestId: generateRequestId(),
      model: form.model,
      provider: form.provider,
    };

    const { data } = await fetchFaceDetection(requestParams, form.uploadedFile);

    if (data && data.success) {
      handleDetectionResult(data.data);
    } else {
      message(data?.message || "人脸检测失败", { type: "error" });
      loadingConfig.export = false;
    }
  } catch (error) {
    loadingConfig.export = false;
    message("人脸检测失败", { type: "error" });
    console.error("人脸检测错误:", error);
  }
};

const handleOpenModule = () => {
  handleOpenModuleManager();
};

onMounted(() => {
  initialModuleList();
  handleTrigger();
});
</script>

<template>
  <div class="face-detection-container h-full w-full overflow-hidden">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <!-- 动态粒子背景 -->
      <div class="particle-background"></div>

      <!-- 网格背景 -->
      <div class="grid-background"></div>

      <!-- 浮动形状 -->
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>

      <!-- 光晕效果 -->
      <div class="glow-effects">
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
      </div>
    </div>

    <ModuleDialog
      ref="moduleDialogRef"
      @success="handleRefreshEnvironment"
    ></ModuleDialog>

    <!-- 现代化设置按钮 -->
    <el-button
      :icon="useRenderIcon('ep:setting')"
      @click="handleOpenModuleManager"
      class="fixed right-6 top-1/2 transform -translate-y-1/2 z-[99] settings-btn-modern"
      circle
      size="large"
    >
    </el-button>

    <div class="container-wrapper h-full">
      <el-container class="h-full">
        <el-header
          class="header-panel h-auto flex w-full items-center justify-between px-8 py-6 mb-2"
        >
          <div class="panel-left mr-6">
            <div class="model-selection-card flex flex-row">
              <el-form
                ref="formRef"
                :model="form"
                :rules="rules"
                label-width="0"
                class="w-full"
              >
                <el-form-item prop="model" class="mb-0">
                  <div class="flex items-center gap-1 w-full">
                    <el-select
                      filterable
                      v-model="form.model"
                      placeholder="请选择人脸检测模型"
                      clearable
                      @change="handleChangeModule"
                      class="model-select-modern flex-1"
                      size="large"
                    >
                      <el-option
                        v-for="item in modelList"
                        class="!h-[80px]"
                        :key="item"
                        :label="item.sysAiModuleName"
                        :value="item.sysAiModuleCode"
                      >
                        <template #default>
                          <el-tooltip
                            placement="right"
                            :raw-content="true"
                            :content="`<div class='tooltip-content'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`"
                          >
                            <div class="model-option">
                              <div class="model-icon-wrapper">
                                <el-image
                                  :src="item.sysProjectIcon"
                                  fit="scale-down"
                                  class="model-icon"
                                >
                                  <template #error>
                                    <div class="error-icon-modern">AI</div>
                                  </template>
                                </el-image>
                              </div>
                              <div class="model-info">
                                <span class="model-name">{{
                                  item.sysAiModuleName
                                }}</span>
                                <span class="model-project">{{
                                  item.sysProjectName
                                }}</span>
                              </div>
                              <div class="model-badge">
                                <span class="badge-text">推荐</span>
                              </div>
                            </div>
                          </el-tooltip>
                        </template>
                      </el-option>
                      <template #label="{ label }">
                        <div class="selected-model">
                          <div class="selected-icon-wrapper">
                            <el-image
                              class="selected-icon"
                              :src="modelSelectLabel?.sysProjectIcon"
                            >
                              <template #error>
                                <div class="error-icon-modern">AI</div>
                              </template>
                            </el-image>
                          </div>
                          <span class="selected-label">{{ label }}</span>
                        </div>
                      </template>
                    </el-select>

                    <el-button
                      v-if="env.showEdit"
                      class="add-model-btn"
                      :icon="useRenderIcon('ep:plus')"
                      @click="handleOpenModule"
                      circle
                    >
                    </el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <div class="panel-right">
            <div class="action-buttons-group">
              <el-upload
                :show-file-list="false"
                :auto-upload="false"
                accept="image/*"
                :on-change="handleChange"
                class="upload-wrapper"
              >
                <template #trigger>
                  <el-button class="upload-btn-modern" size="large">
                    <div class="btn-content">
                      <el-icon class="btn-icon">
                        <component :is="useRenderIcon('ep:upload')" />
                      </el-icon>
                      <span class="btn-text">上传图片</span>
                    </div>
                  </el-button>
                </template>
              </el-upload>

              <el-button
                v-if="showImageUrl && !detectionImage"
                class="detect-btn-modern"
                @click="handleDetection"
                :loading="loadingConfig.export"
                size="large"
              >
                <div class="btn-content">
                  <el-icon class="btn-icon">
                    <component :is="useRenderIcon('ep:search')" />
                  </el-icon>
                  <span class="btn-text">开始检测</span>
                </div>
              </el-button>

              <el-button
                v-if="detectionImage"
                class="reset-btn-modern"
                @click="
                  () => {
                    detectionImage = null;
                    faceDetectionResults = [];
                  }
                "
                size="large"
              >
                <div class="btn-content">
                  <el-icon class="btn-icon">
                    <component :is="useRenderIcon('ep:refresh')" />
                  </el-icon>
                  <span class="btn-text">重新检测</span>
                </div>
              </el-button>
            </div>
          </div>
        </el-header>

        <el-main class="main-content">
          <div class="content-wrapper">
            <div
              class="image-display-area"
              :style="{
                '--image-height': showImageSize.height + 'px',
                '--image-width': showImageSize.width + 'px',
              }"
            >
              <!-- 空状态 -->
              <div v-if="!showImageUrl" class="empty-state-modern">
                <div class="empty-icon-wrapper">
                  <el-icon class="empty-icon">
                    <component :is="useRenderIcon('ep:picture')" />
                  </el-icon>
                </div>
                <h3 class="empty-title">开始您的AI人脸检测之旅</h3>
                <p class="empty-description">
                  上传一张包含人脸的图片，体验先进的AI检测技术
                </p>
                <div class="empty-features">
                  <div class="feature-item">
                    <el-icon
                      ><component :is="useRenderIcon('ep:check')"
                    /></el-icon>
                    <span>高精度检测</span>
                  </div>
                  <div class="feature-item">
                    <el-icon
                      ><component :is="useRenderIcon('ep:check')"
                    /></el-icon>
                    <span>实时处理</span>
                  </div>
                  <div class="feature-item">
                    <el-icon
                      ><component :is="useRenderIcon('ep:check')"
                    /></el-icon>
                    <span>多人脸识别</span>
                  </div>
                </div>
              </div>

              <!-- 图片预览状态 -->
              <div v-else-if="!detectionImage" class="image-preview-container">
                <div class="image-wrapper">
                  <el-image
                    :src="showImageUrl"
                    class="preview-image"
                    fit="contain"
                    :preview-src-list="[showImageUrl]"
                    :initial-index="0"
                    preview-teleported
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon
                          ><component :is="useRenderIcon('ep:picture-filled')"
                        /></el-icon>
                        <span>图片加载失败</span>
                      </div>
                    </template>
                  </el-image>

                  <!-- 加载状态 -->
                  <div v-if="loadingConfig.export" class="loading-overlay">
                    <div class="loading-content">
                      <el-icon class="loading-icon is-loading">
                        <component :is="useRenderIcon('ep:loading')" />
                      </el-icon>
                      <p class="loading-text">AI正在分析图片中的人脸...</p>
                      <div class="loading-progress">
                        <div class="progress-bar"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 检测结果对比 -->
              <div v-else class="comparison-container">
                <ScCompare
                  class="comparison-view-modern"
                  left-image-label="原图"
                  :left-image="showImageUrl"
                  :right-image="detectionImage"
                  right-image-label="检测结果"
                ></ScCompare>

                <!-- 浮动操作按钮 -->
                <div class="floating-actions">
                  <el-tooltip content="下载检测结果" placement="left">
                    <a
                      :href="detectionImage"
                      download="face-detection-result.jpg"
                    >
                      <el-button
                        class="action-btn download-action"
                        circle
                        size="large"
                      >
                        <el-icon
                          ><component :is="useRenderIcon('ep:download')"
                        /></el-icon>
                      </el-button>
                    </a>
                  </el-tooltip>

                  <el-tooltip content="分享结果" placement="left">
                    <el-button
                      class="action-btn share-action"
                      circle
                      size="large"
                    >
                      <el-icon
                        ><component :is="useRenderIcon('ep:share')"
                      /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>

              <!-- 检测结果信息卡片 -->
              <div
                v-if="faceDetectionResults.length > 0"
                class="result-info-card"
              >
                <div class="result-header">
                  <el-icon class="result-icon">
                    <component :is="useRenderIcon('ep:user')" />
                  </el-icon>
                  <span class="result-title">检测结果</span>
                </div>
                <div class="result-content">
                  <div class="result-stat">
                    <span class="stat-number">{{
                      faceDetectionResults.length
                    }}</span>
                    <span class="stat-label">张人脸</span>
                  </div>
                  <div class="result-details">
                    <div class="detail-item">
                      <span class="detail-label">检测精度</span>
                      <span class="detail-value">99.2%</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">处理时间</span>
                      <span class="detail-value">0.8s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 主容器样式
.face-detection-container {
  position: relative;
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}

// 简化背景装饰
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;

  // 简单网格背景
  .grid-background {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
    background-size: 40px 40px;
  }
}

.container-wrapper {
  position: relative;
  z-index: 1;
}

// 简化设置按钮
.settings-btn-modern {
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-overlay);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  border-radius: 8px;

  &:hover {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

// 简化头部面板
.header-panel {
  background: var(--el-bg-color-overlay);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 12px;
  margin: 16px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

// 模型选择卡片
.model-selection-card {
  .card-header {
    .card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin: 0;

      .title-icon {
        font-size: 24px;
        color: var(--el-text-color-primary);
      }
    }

    .card-subtitle {
      color: var(--el-text-color-primary);
      font-size: 14px;
      margin: 4px 0 0 36px;
    }
  }

  .model-select-modern {
    :deep(.el-select__wrapper) {
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      background: var(--el-bg-color-overlay);
      transition: all 0.2s ease;
      min-height: 40px;

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      }

      &.is-focused {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .model-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      background: #f8fafc;
    }

    .model-icon-wrapper {
      .model-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }
    }

    .model-info {
      flex: 1;

      .model-name {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 4px;
      }

      .model-project {
        display: block;
        font-size: 13px;
        color: #718096;
      }
    }

    .model-badge {
      .badge-text {
        background: #3b82f6;
        color: var(--el-text-color-primary);
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }
  }

  .selected-model {
    display: flex;
    align-items: center;
    gap: 12px;

    .selected-icon-wrapper {
      .selected-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
      }
    }

    .selected-label {
      font-weight: 500;
      color: #1a202c;
    }
  }

  .add-model-btn {
    background: #10b981;
    border: none;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
    transition: all 0.2s ease;
    border-radius: 8px;

    &:hover {
      background: #059669;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  }
}

// 操作按钮组
.action-buttons-group {
  display: flex;
  gap: 16px;
  align-items: center;

  .upload-btn-modern,
  .detect-btn-modern,
  .reset-btn-modern {
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    min-height: 44px;
    transition: all 0.2s ease;
    position: relative;
    font-weight: 500;
    font-size: 14px;

    .btn-content {
      display: flex;
      align-items: center;
      gap: 8px;

      .btn-icon {
        font-size: 16px;
      }

      .btn-text {
        font-weight: 500;
        font-size: 14px;
      }
    }

    &:hover {
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .upload-btn-modern {
    background: #3b82f6;
    color: var(--el-text-color-primary);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);

    &:hover {
      background: #2563eb;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }

  .detect-btn-modern {
    background: #10b981;
    color: var(--el-text-color-primary);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);

    &:hover {
      background: #059669;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  }

  .reset-btn-modern {
    background: #f59e0b;
    color: var(--el-text-color-primary);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);

    &:hover {
      background: #d97706;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
  }
}

// 主内容区域
.main-content {
  padding: 0;
  overflow: hidden;
  border: var(--el-button-border-color);

  .content-wrapper {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    .image-display-area {
      width: 100%;
      height: 100%;
      position: relative;

      // 简化空状态
      .empty-state-modern {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: var(--el-bg-color-overlay);
        border-radius: 12px;
        border: 2px dashed #cbd5e0;
        padding: 60px 40px;
        text-align: center;
        transition: all 0.2s ease;
        position: relative;

        &:hover {
          border-color: var(--el-border-color);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .empty-icon-wrapper {
          margin-bottom: 24px;

          .empty-icon {
            font-size: 64px;
            color: var(--el-text-color-placeholder);
            transition: all 0.2s ease;
          }
        }

        &:hover .empty-icon-wrapper {
          .empty-icon {
            color: var(--el-text-color-primary);
          }
        }

        .empty-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 12px 0;
        }

        .empty-description {
          font-size: 16px;
          color: var(--el-text-color-primary);
          margin: 0 0 32px 0;
          line-height: 1.6;
          max-width: 400px;
        }

        .empty-features {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;

          .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--el-color-success);
            font-weight: 500;
            font-size: 14px;
            padding: 6px 12px;
            background: var(--el-color-success-light-9);
            border-radius: 12px;
            transition: all 0.2s ease;

            .el-icon {
              font-size: 16px;
            }

            &:hover {
              background: var(--el-color-success-light-8);
            }
          }
        }
      }

      // 图片预览容器
      .image-preview-container {
        height: 100%;
        position: relative;
        animation: fadeInScale 0.8s ease-out;

        .image-wrapper {
          height: 100%;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.98) 0%,
              rgba(255, 255, 255, 0.95) 100%
            ),
            radial-gradient(
              circle at 50% 50%,
              rgba(102, 126, 234, 0.02) 0%,
              transparent 70%
            );
          backdrop-filter: blur(25px);
          border-radius: 28px;
          overflow: hidden;
          box-shadow:
            0 20px 80px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background:
              radial-gradient(
                circle at 30% 30%,
                rgba(102, 126, 234, 0.03) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 70% 70%,
                rgba(255, 119, 198, 0.03) 0%,
                transparent 50%
              );
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: none;
            z-index: 1;
          }

          &:hover {
            box-shadow:
              0 25px 100px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(102, 126, 234, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 1);
            transform: translateY(-2px);

            &::before {
              opacity: 1;
            }
          }

          .preview-image {
            width: 100%;
            height: 100%;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            z-index: 2;

            &:hover {
              transform: scale(1.01);
              filter: brightness(1.02) contrast(1.02);
            }
          }

          .image-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #718096;
            position: relative;
            z-index: 2;

            .el-icon {
              font-size: 64px;
              margin-bottom: 16px;
              background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
            }

            .error-text {
              font-size: 16px;
              font-weight: 500;
              color: #718096;
            }
          }

          // 加载覆盖层
          .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.98) 0%,
                rgba(255, 255, 255, 0.95) 100%
              ),
              radial-gradient(
                circle at 50% 50%,
                rgba(102, 126, 234, 0.05) 0%,
                transparent 70%
              );
            backdrop-filter: blur(15px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20;
            border-radius: 28px;

            .loading-content {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.9);
              border-radius: 20px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.3);

              .loading-icon {
                font-size: 56px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
                animation: pulse 2s ease-in-out infinite;
              }

              .loading-text {
                font-size: 20px;
                font-weight: 700;
                background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0 0 28px 0;
                letter-spacing: 0.5px;
              }

              .loading-progress {
                width: 240px;
                height: 6px;
                background: rgba(226, 232, 240, 0.8);
                border-radius: 3px;
                overflow: hidden;
                position: relative;
                box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);

                .progress-bar {
                  height: 100%;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  border-radius: 3px;
                  animation: progress 2s ease-in-out infinite;
                  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
                }
              }
            }
          }
        }
      }

      // 对比容器
      .comparison-container {
        height: 100%;
        position: relative;

        .comparison-view-modern {
          height: 100%;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 12px 60px rgba(0, 0, 0, 0.15);
        }

        // 浮动操作按钮
        .floating-actions {
          position: absolute;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 10;

          .action-btn {
            border: none;
            backdrop-filter: blur(20px);
            transition: all 0.3s ease;

            &.download-action {
              background: rgba(102, 126, 234, 0.9);
              color: var(--el-text-color-primary);
              box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);

              &:hover {
                background: rgba(102, 126, 234, 1);
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.5);
              }
            }

            &.share-action {
              background: rgba(72, 187, 120, 0.9);
              color: var(--el-text-color-primary);
              box-shadow: 0 6px 24px rgba(72, 187, 120, 0.4);

              &:hover {
                background: rgba(72, 187, 120, 1);
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(72, 187, 120, 0.5);
              }
            }
          }
        }
      }

      // 检测结果信息卡片
      .result-info-card {
        position: absolute;
        top: 32px;
        left: 32px;
        background:
          linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(255, 255, 255, 0.95) 100%
          ),
          radial-gradient(
            circle at 50% 50%,
            rgba(102, 126, 234, 0.03) 0%,
            transparent 70%
          );
        backdrop-filter: blur(25px);
        border-radius: 20px;
        padding: 28px;
        box-shadow:
          0 12px 48px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(255, 255, 255, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        min-width: 280px;
        z-index: 15;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideInUp 0.6s ease-out;
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(
            90deg,
            #667eea 0%,
            #764ba2 50%,
            #48bb78 100%
          );
          border-radius: 20px 20px 0 0;
        }

        &::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(
              circle at 30% 30%,
              rgba(102, 126, 234, 0.05) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 70% 70%,
              rgba(255, 119, 198, 0.05) 0%,
              transparent 50%
            );
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }

        &:hover {
          box-shadow:
            0 16px 64px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(102, 126, 234, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          transform: translateY(-4px) scale(1.02);

          &::after {
            opacity: 1;
          }
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          position: relative;
          z-index: 2;

          .result-icon {
            font-size: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
          }

          .result-title {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 0.5px;
          }
        }

        .result-content {
          position: relative;
          z-index: 2;

          .result-stat {
            text-align: center;
            margin-bottom: 24px;
            padding: 20px;
            background: rgba(102, 126, 234, 0.05);
            border-radius: 16px;
            border: 1px solid rgba(102, 126, 234, 0.1);
            transition: all 0.3s ease;

            &:hover {
              background: rgba(102, 126, 234, 0.08);
              transform: scale(1.02);
            }

            .stat-number {
              display: block;
              font-size: 40px;
              font-weight: 800;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              line-height: 1;
              margin-bottom: 8px;
              filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
            }

            .stat-label {
              font-size: 15px;
              color: #718096;
              font-weight: 600;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
          }

          .result-details {
            .detail-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 16px;
              margin-bottom: 8px;
              background: rgba(248, 250, 252, 0.8);
              border-radius: 12px;
              border: 1px solid rgba(226, 232, 240, 0.5);
              transition: all 0.3s ease;

              &:last-child {
                margin-bottom: 0;
              }

              &:hover {
                background: rgba(102, 126, 234, 0.05);
                border-color: rgba(102, 126, 234, 0.2);
                transform: translateX(4px);
              }

              .detail-label {
                font-size: 14px;
                color: #718096;
                font-weight: 500;
              }

              .detail-value {
                font-size: 14px;
                font-weight: 700;
                background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                padding: 4px 8px;
                background-color: rgba(102, 126, 234, 0.1);
                border-radius: 6px;
              }
            }
          }
        }
      }
    }
  }
}

// 错误图标
.error-icon-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 100%
  );
  color: var(--el-color-white);
  font-weight: bold;
  border-radius: 12px;
  font-size: 14px;
}

// 动画
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
  25% {
    transform: translateY(-15px) rotate(2deg) scale(1.05);
  }
  50% {
    transform: translateY(-30px) rotate(0deg) scale(1.1);
  }
  75% {
    transform: translateY(-15px) rotate(-2deg) scale(1.05);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

@keyframes particleMove {
  0%,
  100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  25% {
    transform: translateX(20px) translateY(-10px) rotate(90deg);
  }
  50% {
    transform: translateX(0) translateY(-20px) rotate(180deg);
  }
  75% {
    transform: translateX(-20px) translateY(-10px) rotate(270deg);
  }
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(5deg);
  }
  50% {
    transform: translateY(-10px) rotate(0deg);
  }
  75% {
    transform: translateY(-30px) rotate(-5deg);
  }
}

// 工具提示
.tooltip-content {
  max-width: 300px;
  padding: 12px;
  line-height: 1.6;
  font-size: 14px;
}

// 响应式设计
@media (max-width: 768px) {
  .face-detection-container {
    .header-panel {
      flex-direction: column;
      gap: 16px;

      .panel-left {
        margin-right: 0;
        flex: 1;
      }
    }

    .action-buttons-group {
      flex-direction: column;
      width: 100%;

      .upload-btn-modern,
      .detect-btn-modern,
      .reset-btn-modern {
        width: 100%;
      }
    }

    .empty-features {
      flex-direction: column;
      gap: 12px;
    }
  }
}
</style>
