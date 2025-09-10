<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fileToBase64, localStorageProxy, message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, reactive, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { fetchFaceDetection } from "../../../../api/ai/face";
import { fetchListProjectForAiModule } from "../../../../api/manage/project-ai-module";
const ScLoading = defineAsyncComponent(() => import("@repo/components/ScLoading/index.vue"));
const ScCompare = defineAsyncComponent(() => import("@repo/components/ScCompare/index.vue"));
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
  moduleDialogRef.value.handleOpen(form, "add");
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
  return "face_detect_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
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
        ctx.strokeRect(face.bbox.x, face.bbox.y, face.bbox.width, face.bbox.height);

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
  <div class="face-detection-container h-full w-full pt-4 px-4 overflow-hidden">
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="fixed right-4 top-1/2 sidebar-custom-v2 z-[99] bg-primary text-white hover:bg-primary-dark settings-btn" circle size="large"></el-button>

    <el-container class="h-full">
      <el-header class="header-panel h-auto flex w-full items-center justify-between px-6 py-3 mb-2">
        <div class="panel-left flex-1 mr-4">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="10px" :inline="true" class="w-full">
            <el-form-item prop="model" class="w-full mb-0">
              <div class="flex justify-start w-full">
                <el-select filterable v-model="form.model" placeholder="请选择人脸检测模型" clearable @change="handleChangeModule" class="model-select !w-[200px]">
                  <el-option v-for="item in modelList" class="!h-[70px]" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                    <template #default>
                      <el-tooltip placement="right" :raw-content="true" :content="`<div class='tooltip-content'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                        <div class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-primary-50 transition-all duration-300">
                          <el-image :src="item.sysProjectIcon" fit="scale-down" class="!w-[50px] !h-[50px] rounded-lg shadow-sm">
                            <template #error>
                              <div class="error-icon">AI</div>
                            </template>
                          </el-image>
                          <div class="flex flex-col">
                            <span class="text-[15px] font-medium">{{ item.sysAiModuleName }}</span>
                            <span class="text-gray-500 text-[13px]">{{ item.sysProjectName }}</span>
                          </div>
                        </div>
                      </el-tooltip>
                    </template>
                  </el-option>
                  <template #label="{ label }">
                    <div class="flex items-center gap-3">
                      <el-image class="!w-[32px] !h-[32px] rounded-lg" :src="modelSelectLabel?.sysProjectIcon">
                        <template #error>
                          <div class="error-icon">AI</div>
                        </template>
                      </el-image>
                      <span>{{ label }}</span>
                    </div>
                  </template>
                </el-select>
                <el-button v-if="env.showEdit" class="ml-2 btn-text bg-primary text-white hover:bg-primary-dark add-btn" :icon="useRenderIcon('ep:plus')" @click="handleOpenModule"></el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div class="panel-right">
          <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleChange" class="upload-demo">
            <template #trigger>
              <el-button type="primary" class="bg-primary text-white hover:bg-primary-dark upload-btn">
                <span class="flex items-center">
                  <el-icon class="mr-1 upload-icon">
                    <component :is="useRenderIcon('ep:upload')" />
                  </el-icon>
                  上传图片
                </span>
              </el-button>
            </template>
          </el-upload>

          <el-button v-if="showImageUrl && !detectionImage" type="success" class="ml-2 bg-green-500 text-white hover:bg-green-600" @click="handleDetection" :loading="loadingConfig.export">
            <span class="flex items-center">
              <el-icon class="mr-1">
                <component :is="useRenderIcon('ep:search')" />
              </el-icon>
              开始检测
            </span>
          </el-button>
        </div>
      </el-header>

      <el-main class="pt-0 pb-4 px-0 overflow-hidden">
        <div class="flex justify-center align-middle h-full relative">
          <div
            class="h-full relative overflow-hidden compare-image rounded-lg shadow-lg flex justify-center flex-1"
            :style="{
              '--image-height': showImageSize.height + 'px',
              '--image-width': showImageSize.width + 'px',
            }"
          >
            <div class="w-full h-full relative flex justify-center items-center">
              <div v-if="!detectionImage" class="h-full image-container">
                <el-empty v-if="!showImageUrl" class="h-full empty-state">
                  <template #description>
                    <p class="empty-text">请上传一张需要进行人脸检测的图片</p>
                  </template>
                </el-empty>
                <el-image v-else :src="showImageUrl" class="h-full img rounded-lg image-preview" fit="contain" transition="fade"></el-image>
                <ScLoading ref="scLoadingRef" v-model="loadingConfig.export" transition="fade"></ScLoading>
              </div>

              <ScCompare class="img rounded-lg comparison-view" v-if="detectionImage" left-image-label="原图" :left-image="showImageUrl" :right-image="detectionImage" right-image-label="检测结果" transition="fade"></ScCompare>

              <div v-if="detectionImage" class="absolute bottom-4 right-4 action-buttons">
                <a :href="detectionImage" download="face-detection-result.jpg">
                  <el-button :icon="useRenderIcon('ep:download')" circle size="large" class="bg-primary text-white hover:bg-primary-dark download-btn"></el-button>
                </a>
              </div>

              <!-- 检测结果信息 -->
              <div v-if="faceDetectionResults.length > 0" class="absolute top-4 left-4 detection-info">
                <el-card class="bg-white/90 backdrop-blur-sm">
                  <div class="text-sm">
                    <div class="font-medium text-gray-800 mb-2">检测结果</div>
                    <div class="text-gray-600">
                      检测到 <span class="font-bold text-primary">{{ faceDetectionResults.length }}</span> 张人脸
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.comparison-view,
.compare-image,
.image-container {
  position: relative;
}

.empty-state,
.comparison-view {
  width: min(var(--image-width), 672px);
  height: min(var(--image-height), 672px);
}

.face-detection-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

  .header-panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .model-select {
    .el-select__wrapper {
      border-radius: 8px;
      border: 2px solid #e1e5e9;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .upload-btn,
  .add-btn {
    border-radius: 8px;
    padding: 12px 20px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
  }

  .compare-image {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.8);
    border: 2px dashed #d1d5db;
    border-radius: 12px;

    .empty-text {
      color: #6b7280;
      font-size: 16px;
      font-weight: 500;
    }
  }

  .image-preview {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .action-buttons {
    .download-btn {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .detection-info {
    .el-card {
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
  }

  .settings-btn {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
    }
  }

  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
    border-radius: 8px;
  }
}

.tooltip-content {
  max-width: 300px;
  padding: 8px;
  line-height: 1.5;
}
</style>
