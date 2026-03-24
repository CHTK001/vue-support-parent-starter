<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import {
  clearObject,
  fileToBase64,
  localStorageProxy,
  message,
  urlImageInfo,
} from "@repo/utils";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  reactive,
  shallowRef,
} from "vue";
import { useRoute } from "vue-router";
import {
  fetchGetTaskForResolution,
  fetchSaveTaskForResolution,
} from "../../../api/ai/image-resolution";
import { fetchListProjectForAiModule } from "../../../api/manage/project-ai-module";
const ScLoading = defineAsyncComponent(
  () => import("@repo/components/ScLoading/index.vue")
);
const ScCompare = defineAsyncComponent(
  () => import("@repo/components/ScCompare/index.vue")
);
const ModuleDialog = defineAsyncComponent(() => import("../module.vue"));
const moduleDialogRef = shallowRef();
const scLoadingRef = shallowRef();
const modelList = shallowRef([]);
const settingOpen = shallowRef(false);
const route = useRoute();
const props = defineProps({
  category: "RESOLUTION",
  type: "RESOLUTION",
  selectedItemLabel: "ai-image-resolution-selected",
});
const resolutionImage = shallowRef();
const resolutionImageSize = reactive({});
const form = reactive({
  model: "",
  sysAiModuleType: "RESOLUTION",
  scaleFactor: 2,
  url: null,
});
const env = {
  category: "RESOLUTION",
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
      sysAiVincentSupportedSizeList:
        it.vincentSetting?.sysAiVincentSupportedSize?.split(",") || [],
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

const scaleFactorLabel = computed(() => {
  return form.scaleFactor == 1 ? "原始尺寸" : `${form.scaleFactor}倍`;
});
/**
 * 获取key
 */
const requestId = () => {
  const _requestId = localStorageProxy().getItem(
    "resolution-request-id:" + getKey()
  );
  return _requestId;
};
const loadedRequestId = async (row) => {
  localStorageProxy().setItem("resolution-request-id:" + getKey(), row.taskId);
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
  localStorageProxy().removeItem("resolution-request-id:" + getKey());
};

const createInterval = () => {
  if (!requestId()) {
    clearTask();
    return;
  }
  intervalId = setInterval(() => {
    fetchGetTaskForResolution({
      taskId: requestId(),
      sysProjectId: form.sysProjectId,
      sysAiModuleType: form.sysAiModuleType,
      model: form.model,
    })
      .then(({ data }) => {
        if (data?.taskStatus === "SUCCESS") {
          clearTask();
          if (data?.progress >= 100) {
            resolutionImage.value = data.image;
            urlImageInfo(data.image).then(({ width, height }) => {
              resolutionImageSize.width = width;
              resolutionImageSize.height = height;
            });
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
  env.category = query.category || props.category || "RESOLUTION";
  env.sysProjectName = query.sysProjectName;
  form.sysAiModuleType = query.type || props.type || "RESOLUTION";
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
  fetchSaveTaskForResolution(form)
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
const showImageSize = reactive({
  width: 1024,
  height: 1024,
});
const handleChange = async (files) => {
  if (showImageUrl.value) {
    URL.revokeObjectURL(showImageUrl.value);
  }
  resolutionImage.value = null;
  fileToBase64(files.raw).then(({ base64, width, height }) => {
    if (width * form.scaleFactor > formSetting.sysAiVincentSupportedMaxSize) {
      message(
        `图片${width}尺寸超过最大值${formSetting.sysAiVincentSupportedMaxSize}, 请重新选择`,
        { type: "error" }
      );
      return;
    }
    form.url = base64;
    showImageSize.width = width;
    showImageSize.height = height;
    showImageUrl.value = URL.createObjectURL(files.raw);
    loadingConfig.export = true;
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
  <div class="resolution-container h-full w-full overflow-hidden system-container modern-bg">
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment" />
    <ScButton 
      :icon="useRenderIcon('ep:setting')"
      class="fixed right-8 top-1/2 settings-btn z-[99]"
      circle
      size="large"
      @click="handleOpenModuleManager"
    />
    <el-container class="h-full">
      <el-header class="header-panel flex w-full items-center px-6">
        <div class="panel-content flex items-center justify-between gap-4">
          <ScForm 
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="0"
            :inline="true"
            class="flex-1 flex items-center gap-4"
          >
            <ScFormItem prop="model" class="flex-1 mb-0">
              <ScSelect 
                v-model="form.model"
                filterable
                placeholder="请选择模型"
                clearable
                class="!w-full model-select"
                @change="handleChangeModule"
              >
                <ScOption 
                  v-for="item in modelList"
                  :key="item"
                  class="!h-[70px]"
                  :label="item.sysAiModuleName"
                  :value="item.sysAiModuleCode"
                >
                  <template #default>
                    <ScTooltip 
                      placement="right"
                      :raw-content="true"
                      :content="`<div class='tooltip-content'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`"
                    >
                      <div
                        class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-primary-50 transition-all duration-300"
                      >
                        <ScImage 
                          :src="item.sysProjectIcon"
                          fit="scale-down"
                          class="!w-[50px] !h-[50px] rounded-lg shadow-sm"
                        >
                          <template #error
                            ><div class="error-icon">AI</div></template
                          >
                        </ScImage>
                        <div class="flex flex-col">
                          <span class="text-[15px] font-medium">{{
                            item.sysAiModuleName
                          }}</span>
                          <span class="text-gray-500 text-[13px]">{{
                            item.sysProjectName
                          }}</span>
                        </div>
                      </div>
                    </ScTooltip>
                  </template>
                </ScOption>
                <template #label="{ label }">
                  <div class="flex items-center gap-3">
                    <ScImage 
                      class="!w-[32px] !h-[32px] rounded-lg"
                      :src="modelSelectLabel?.sysProjectIcon"
                    >
                      <template #error
                        ><div class="error-icon">AI</div></template
                      >
                    </ScImage>
                    <span>{{ label }}</span>
                  </div>
                </template>
              </ScSelect>
            </ScFormItem>
            <ScFormItem 
              v-if="formSetting?.sysAiVincentSupportedSizeList?.length"
              class="mb-0"
            >
              <el-dropdown trigger="click" class="scale-dropdown">
                <button
                  class="scale-btn flex items-center gap-2 px-4 py-2 rounded-lg border hover:border-primary transition-all duration-300"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 14h6v6M4 4h16v16H4V4z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>{{ scaleFactorLabel }}</span>
                  <ScIcon 
                    ><component :is="useRenderIcon('ep:arrow-down')"
                  /></ScIcon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu class="!p-2">
                    <el-dropdown-item
                      class="!rounded !my-1"
                      @click="() => (form.scaleFactor = 1)"
                      >原始尺寸</el-dropdown-item
                    >
                    <el-dropdown-item
                      v-for="item in formSetting.sysAiVincentSupportedSizeList"
                      :key="item"
                      class="!rounded !my-1"
                      @click="() => (form.scaleFactor = item)"
                    >
                      {{ item }}倍
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </ScFormItem>
            <ScFormItem>
              <ScUpload 
                :show-file-list="false"
                :auto-upload="false"
                accept="image/*"
                :on-change="handleChange"
              >
                <ScButton 
                  type="primary"
                  class="upload-btn flex items-center gap-2 !px-6"
                >
                  <ScIcon 
                    ><component :is="useRenderIcon('ep:upload')"
                  /></ScIcon>
                  上传图片
                </ScButton>
              </ScUpload>
              <ScButton 
                v-if="env.showEdit"
                class="add-btn !p-3"
                :icon="useRenderIcon('ep:plus')"
                circle
                @click="handleOpenModule"
              />
            </ScFormItem>
          </ScForm>
        </div>
      </el-header>
      <el-main class="main-content">
        <div class="flex justify-center align-middle h-full">
          <div
            class="h-full relativeoverflow-hidden compare-image"
            :style="{
              '--image-height': showImageSize.height + 'px',
              '--image-width': showImageSize.width + 'px',
            }"
          >
            <div
              v-if="!resolutionImage"
              class="flex justify-center h-full w-full image-container"
            >
              <ScEmpty v-if="!showImageUrl" class="h-full w-full empty-state">
                <template #description>
                  <p class="empty-text">请上传一张需要提升分辨率的图片</p>
                </template>
              </ScEmpty>
              <ScImage 
                v-else
                :src="showImageUrl"
                class="h-full img image-preview"
                fit="contain"
                transition="fade"
              />
              <ScLoading
                ref="scLoadingRef"
                v-model="loadingConfig.export"
                transition="fade"
              />
            </div>
            <ScCompare
              v-if="resolutionImage"
              class="img comparison-view"
              :left-image-label="`原图:${showImageSize.width}x${showImageSize.height}`"
              :left-image="showImageUrl"
              :right-image="resolutionImage"
              :right-image-label="`修复后:${resolutionImageSize.width}x${resolutionImageSize.height}`"
              transition="fade"
            />
            <div
              v-if="resolutionImage"
              class="absolute bottom-6 right-6 action-buttons"
            >
              <a :href="resolutionImage" download>
                <ScButton 
                  :icon="useRenderIcon('ep:download')"
                  circle
                  size="large"
                  class="download-btn"
                />
              </a>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
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
.panel-content {
  margin-top: 20px;
}
.resolution-container {
  --primary-color: var(--el-color-primary);
  --primary-dark: var(--el-color-primary-dark-2);
  --primary-light: var(--el-color-primary-light-9);
  --primary-50: var(--el-bg-color);
  --primary-rgb: var(--el-color-primary-rgb);
  --transition-bezier: cubic-bezier(0.4, 0, 0.2, 1);

  @apply p-6;

  .header-panel {
    @apply backdrop-blur-lg border;
    margin-bottom: 1.5rem;
    border-radius: 16px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: all 0.4s var(--transition-bezier);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.08);
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

  .scale-btn {
    @apply bg-white border-gray-200;
    transition: all 0.3s var(--transition-bezier);

    &:hover {
      @apply border-primary bg-primary-50;
      transform: translateY(-1px);
      box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
    }
  }

  .upload-btn {
    transition: all 0.3s var(--transition-bezier);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(var(--primary-rgb), 0.25);
    }

    .upload-icon {
      transition: transform 0.3s var(--transition-bezier);
    }

    &:hover .upload-icon {
      transform: translateY(-2px);
    }
  }

  .add-btn {
    @apply bg-primary text-white;
    transition: all 0.4s var(--transition-bezier);

    &:hover {
      transform: rotate(180deg) scale(1.1);
      box-shadow: 0 8px 16px rgba(var(--primary-rgb), 0.25);
    }
  }

  :deep(.el-dropdown-menu) {
    @apply rounded-xl border-0 overflow-hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    background: rgba(var(--el-bg-color-rgb), 0.95);
    transform-origin: top;
    animation: dropdownIn 0.3s var(--transition-bezier);

    .el-dropdown-item {
      @apply rounded-lg mx-1 my-1;
      transition: all 0.3s var(--transition-bezier);

      &:hover {
        @apply bg-primary-50 text-primary;
        transform: translateX(6px);
      }
    }
  }

  .compare-image {
    @apply rounded-2xl;
    transition: all 0.4s var(--transition-bezier);
  }

  .empty-state {
    animation: fadeIn 0.5s ease;

    .empty-text {
      @apply text-gray-500 text-lg mt-4;
      animation: float 3s ease-in-out infinite;
    }
  }

  .download-btn {
    @apply bg-primary text-white;
    transition: all 0.4s var(--transition-bezier);
    animation: slideUp 0.5s var(--transition-bezier);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.3);
    }
  }
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

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
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
