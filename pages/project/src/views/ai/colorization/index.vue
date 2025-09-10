<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { clearObject, fileToBase64, localStorageProxy, message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, reactive, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { fetchGetTaskForColorization, fetchSaveTaskForColorization } from "../../../api/ai/image-colorization";
import { fetchListProjectForAiModule } from "../../../api/manage/project-ai-module";
const ScLoading = defineAsyncComponent(() => import("@repo/components/ScLoading/index.vue"));
const ScCompare = defineAsyncComponent(() => import("@repo/components/ScCompare/index.vue"));
const ModuleDialog = defineAsyncComponent(() => import("../module.vue"));
const moduleDialogRef = shallowRef();
const scLoadingRef = shallowRef();
const modelList = shallowRef([]);
const settingOpen = shallowRef(false);
const route = useRoute();
const props = defineProps({
  category: "COLORIZATION",
  type: "COLORIZATION",
  selectedItemLabel: "ai-image-colorization-selected",
});
const resolutionImage = shallowRef();
const resolutionImageSize = reactive({});
const form = reactive({
  model: "",
  sysAiModuleType: "COLORIZATION",
  scaleFactor: 2,
  url: null,
});
const env = {
  category: "COLORIZATION",
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
    it.vincentSetting = {
      ...it.vincentSetting,
      sysAiVincentSupportedSizeList: it.vincentSetting?.sysAiVincentSupportedSize?.split(",") || [],
    };
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
const getKey = () => {
  return form.model.replace("/", "_");
};

/**
 * 获取key
 */
const requestId = () => {
  const _requestId = localStorageProxy().getItem("colorization-request-id:" + getKey());
  return _requestId;
};
const loadedRequestId = async (row) => {
  localStorageProxy().setItem("colorization-request-id:" + getKey(), row.taskId);
};
const loadInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (requestId()) {
    createInterval();
  }
};

const clearTask = async () => {
  clearInterval(intervalId);
  loadingConfig.export = false;
  intervalId = null;
  localStorageProxy().removeItem("colorization-request-id:" + getKey());
};

const createInterval = () => {
  if (!requestId()) {
    clearTask();
    return;
  }
  intervalId = setInterval(() => {
    fetchGetTaskForColorization({ taskId: requestId(), sysProjectId: form.sysProjectId, sysAiModuleType: form.sysAiModuleType, model: form.model })
      .then(({ data }) => {
        if (data?.taskStatus === "SUCCESS") {
          clearTask();
          if (data?.progress >= 100) {
            resolutionImage.value = data.image;
            scLoadingRef.value.close();
            return;
          }
          scLoadingRef.value.stepTo(data.progress);
        } else {
          scLoadingRef.value.stepTo(data.progress);
        }
      })
      .catch((e) => {
        clearTask();
      });
  }, 5000);
};
const loadModule = async () => {
  handleRefreshEnvironment();
};

const loadConfig = async (row, sysAiModuleCode) => {
  clearObject(formSetting);
  Object.assign(formSetting, row?.vincentSetting);
  localStorageProxy().setItem(props.selectedItemLabel, sysAiModuleCode);
};
const onAfterProperieSet = () => {
  const query = route.query;
  env.sysProjectId = query.sysProjectId;
  env.category = query.category || props.category || "COLORIZATION";
  env.sysProjectName = query.sysProjectName;
  form.sysAiModuleType = query.type || props.type || "COLORIZATION";
  form.sysProjectId = env.sysProjectId;
  form.sysProjectName = env.sysProjectName;
  if (requestId()) {
    loadConfig.export = true;
  }
};

const modelSelectLabel = computed(() => {
  return modelList.value.find((it) => it.sysAiModuleCode === form.model);
});
const handleRefreshEnvironment = async () => {
  await initialModuleList();
};

const handleExport = async () => {
  loadingConfig.export = true;
  fetchSaveTaskForColorization(form)
    .then(({ data }) => {
      if (data?.taskStatus === "FAILURE") {
        clearTask();
        message("创建任务失败!", { type: "error" });
        return;
      }
      loadedRequestId(data);
      createInterval();
    })
    .catch((e) => {
      clearTask();
    });
};
const showImageUrl = shallowRef();
const showImageSize = reactive({});
const handleChange = async (files) => {
  if (showImageUrl.value) {
    URL.revokeObjectURL(showImageUrl.value);
  }
  resolutionImage.value = null;
  fileToBase64(files.raw).then(({ base64, width, height }) => {
    form.url = base64;
    showImageSize.width = width;
    showImageSize.height = height;
    showImageUrl.value = URL.createObjectURL(files.raw);
    handleExport();
  });
};
onMounted(async () => {
  onAfterProperieSet();
  initialModuleList();
  handleTrigger();
});
</script>
<template>
  <div class="colorization-container h-full w-full pt-4 px-4 overflow-hidden">
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="fixed right-4 top-1/2 sidebar-custom-v2 z-[99] bg-primary text-white hover:bg-primary-dark settings-btn" circle size="large"> </el-button>
    <el-container class="h-full">
      <el-header class="header-panel h-auto flex w-full items-center justify-between px-6 py-3 mb-2">
        <div class="panel-left flex-1 mr-4">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="10px" :inline="true" class="w-full">
            <el-form-item prop="model" class="w-full mb-0">
              <div class="flex justify-start w-full">
                <el-select filterable v-model="form.model" placeholder="请选择模型" clearable @change="handleChangeModule" class="model-select !w-[200px]">
                  <el-option v-for="item in modelList" class="!h-[70px]" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                    <template #default>
                      <el-tooltip placement="right" :raw-content="true" :content="`<div class='tooltip-content'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                        <div class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-primary-50 transition-all duration-300">
                          <el-image :src="item.sysProjectIcon" fit="scale-down" class="!w-[50px] !h-[50px] rounded-lg shadow-sm"
                            ><template #error><div class="error-icon">AI</div></template></el-image
                          >
                          <div class="flex flex-col">
                            <span class="text-[15px] font-medium">{{ item.sysAiModuleName }}</span
                            ><span class="text-gray-500 text-[13px]">{{ item.sysProjectName }}</span>
                          </div>
                        </div>
                      </el-tooltip>
                    </template>
                  </el-option>
                  <template #label="{ label }">
                    <div class="flex items-center gap-3">
                      <el-image class="!w-[32px] !h-[32px] rounded-lg" :src="modelSelectLabel?.sysProjectIcon"
                        ><template #error><div class="error-icon">AI</div></template></el-image
                      ><span>{{ label }}</span>
                    </div>
                  </template>
                </el-select>
                <el-button v-if="env.showEdit" class="ml-2 btn-text bg-primary text-white hover:bg-primary-dark add-btn" :icon="useRenderIcon('ep:plus')" @click="handleOpenModule"> </el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
        <div class="panel-right">
          <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleChange" class="upload-demo">
            <template #trigger>
              <el-button type="primary" class="bg-primary text-white hover:bg-primary-dark upload-btn">
                <span class="flex items-center">
                  <el-icon class="mr-1 upload-icon"><component :is="useRenderIcon('ep:upload')" /></el-icon>
                  上传图片
                </span>
              </el-button>
            </template>
          </el-upload>
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
              <div v-if="!resolutionImage" class="h-full image-container">
                <el-empty v-if="!showImageUrl" class="h-full empty-state">
                  <template #description>
                    <p class="empty-text">请上传一张需要上色的图片</p>
                  </template>
                </el-empty>
                <el-image v-else :src="showImageUrl" class="h-full img rounded-lg image-preview" fit="contain" transition="fade"></el-image>
                <ScLoading ref="scLoadingRef" v-model="loadingConfig.export" transition="fade"></ScLoading>
              </div>
              <ScCompare class="img rounded-lg comparison-view" v-if="resolutionImage" left-image-label="上色前" :left-image="showImageUrl" :right-image="resolutionImage" right-image-label="上色后" transition="fade"> </ScCompare>
              <div v-if="resolutionImage" class="absolute bottom-4 right-4 action-buttons">
                <a :href="resolutionImage" download>
                  <el-button :icon="useRenderIcon('ep:download')" circle size="large" class="bg-primary text-white hover:bg-primary-dark download-btn"> </el-button>
                </a>
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
.colorization-container {
  --primary-color: #007bff;
  --primary-dark: #0056b3;
  --primary-light: #e6f2ff;
  --primary-rgb: 0, 123, 255;
  --transition-bezier: cubic-bezier(0.34, 1.56, 0.64, 1);
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --card-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.1);
  --border-radius: 12px;

  overflow: hidden;
  background-color: var(--el-bg-color);
  transition: all 0.3s var(--transition-bezier);

  .header-panel {
    border-radius: var(--border-radius);
    margin-bottom: 16px;
    box-shadow: var(--card-shadow);
    transition:
      box-shadow 0.3s ease,
      transform 0.3s ease;

    &:hover {
      box-shadow: var(--card-shadow-hover);
    }
  }

  .model-select {
    :deep(.el-input__wrapper) {
      @apply rounded-xl border border-gray-200;
      box-shadow: none !important;
      transition: all 0.3s var(--transition-bezier);

      &:hover,
      &.is-focus {
        @apply border-primary;
        transform: translateY(-1px);
        box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1) !important;
      }
    }
  }

  .option-content {
    transition: all 0.3s var(--transition-bezier);
    border-radius: 8px;
    padding: 6px;

    &:hover {
      transform: translateX(4px);
      background-color: rgba(var(--primary-rgb), 0.05);

      .option-icon {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.15);
      }

      .option-title {
        color: var(--primary-color);
      }

      .option-desc {
        opacity: 1;
      }
    }
  }

  .option-icon {
    border-radius: 10px;
    transition: all 0.3s var(--transition-bezier);
    box-shadow: var(--card-shadow);
  }

  .option-title {
    transition: color 0.3s ease;
  }

  .option-desc {
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }

  .upload-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.3s var(--transition-bezier);
    border-radius: 8px;
    padding: 10px 20px;

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.5s ease;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);

      &::before {
        opacity: 1;
        transform: scale(1);
        animation: ripple 1.5s infinite;
      }

      .upload-icon {
        transform: translateY(-2px) scale(1.1);
      }
    }

    .upload-icon {
      transition: all 0.3s var(--transition-bezier);
    }
  }

  .add-btn {
    transition: all 0.3s var(--transition-bezier);
    border-radius: 8px;

    &:hover {
      transform: rotate(90deg) scale(1.1);
    }
  }

  .settings-btn {
    transition: all 0.3s var(--transition-bezier);
    box-shadow: var(--card-shadow);
    opacity: 0.8;

    &:hover {
      transform: scale(1.1);
      opacity: 1;
      box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.4);
    }
  }

  .compare-image {
    transition: all 0.3s ease;
    box-shadow: var(--card-shadow);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  .image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    overflow: hidden;

    .empty-state {
      animation: fadeIn 0.5s ease;

      .empty-text {
        color: var(--el-text-color-secondary);
        font-size: 16px;
        margin-top: 8px;
        animation: float 3s ease-in-out infinite;
      }
    }

    .image-preview {
      animation: zoomIn 0.5s var(--transition-bezier);
    }
  }

  .comparison-view {
    animation: fadeIn 0.5s ease;
  }

  .action-buttons {
    .download-btn {
      transition: all 0.3s var(--transition-bezier);
      box-shadow: var(--card-shadow);
      animation: fadeInUp 0.5s var(--transition-bezier);

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.4);
      }
    }
  }
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 暗黑模式适配 */
.dark {
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  --card-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.3);

  .option-content {
    &:hover {
      background: rgba(var(--primary-rgb), 0.15);
    }
  }

  .option-icon {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .header-panel {
    background: rgba(30, 30, 30, 0.6);
  }

  .settings-btn,
  .download-btn {
    &:hover {
      box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.25);
    }
  }
}

/* 添加毛玻璃效果 */
@supports (backdrop-filter: blur(8px)) {
  .header-panel {
    background: rgba(var(--el-bg-color-rgb), 0.7);
    backdrop-filter: blur(10px);
  }

  .dark .header-panel {
    background: rgba(30, 30, 30, 0.5);
    backdrop-filter: blur(15px);
  }

  .settings-btn,
  .download-btn {
    backdrop-filter: blur(4px);
  }
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .colorization-container {
    .header-panel {
      flex-direction: column;
      align-items: stretch;

      .panel-left,
      .panel-right {
        width: 100%;
        margin: 8px 0;
      }
    }
  }
}
</style>
