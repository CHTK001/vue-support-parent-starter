<script setup>
import { fetchListProjectForAiModule } from "@/api/manage/project-ai-module";
import { reactive, nextTick, defineAsyncComponent, onMounted, shallowRef, computed, ref } from "vue";
import { clearObject, fileToBase64, getRandomInt, localStorageProxy, message, urlImageInfo } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useRoute } from "vue-router";
import { fetchGetTaskForResolution, fetchSaveTaskForResolution } from "@/api/ai/image-resolution";
const ScLoading = defineAsyncComponent(() => import("@repo/components/ScLoading/index.vue"));
const ScCompare = defineAsyncComponent(() => import("@repo/components/ScCompare/index.vue"));
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

const scaleFactorLabel = computed(() => {
  return form.scaleFactor == 1 ? "原始尺寸" : `${form.scaleFactor}倍`;
});
/**
 * 获取key
 */
const requestId = () => {
  const _requestId = localStorageProxy().getItem("resolution-request-id:" + getKey());
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
    fetchGetTaskForResolution({ taskId: requestId(), sysProjectId: form.sysProjectId, sysAiModuleType: form.sysAiModuleType, model: form.model })
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
  loadingConfig.export = true;
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
const showImageSize = reactive({});
const handleChange = async (files) => {
  if (showImageUrl.value) {
    URL.revokeObjectURL(showImageUrl.value);
  }
  resolutionImage.value = null;
  fileToBase64(files.raw).then(({ base64, width, height }) => {
    if (width * form.scaleFactor > formSetting.sysAiVincentSupportedMaxSize) {
      message(`图片${width}尺寸超过最大值${formSetting.sysAiVincentSupportedMaxSize}, 请重新选择`, { type: "error" });
      return;
    }
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
  <div class="resolution-container h-full w-full overflow-hidden">
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="fixed right-8 top-1/2 settings-btn z-[99]" circle size="large"></el-button>
    <el-container class="h-full">
      <el-header class="header-panel flex w-full items-center px-6">
        <div class="panel-content flex items-center justify-between w-full gap-4">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="0" :inline="true" class="flex-1 flex items-center gap-4">
            <el-form-item prop="model" class="flex-1 mb-0">
              <el-select filterable v-model="form.model" placeholder="请选择模型" clearable @change="handleChangeModule" class="!w-full model-select">
                <el-option v-for="item in modelList" class="!h-[70px]" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                  <template #default>
                    <el-tooltip placement="right" :raw-content="true" :content="`<div class='tooltip-content'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                      <div class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-primary-50 transition-all duration-300">
                        <el-image :src="item.sysProjectIcon" fit="cover" class="!w-[50px] !h-[50px] rounded-lg shadow-sm"
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
            </el-form-item>
            <el-form-item v-if="formSetting?.sysAiVincentSupportedSizeList?.length" class="mb-0">
              <el-dropdown trigger="click" class="scale-dropdown">
                <button class="scale-btn flex items-center gap-2 px-4 py-2 rounded-lg border hover:border-primary transition-all duration-300">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M4 14h6v6M4 4h16v16H4V4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  <span>{{ scaleFactorLabel }}</span>
                  <el-icon><component :is="useRenderIcon('ep:arrow-down')" /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu class="!p-2"
                    ><el-dropdown-item @click="() => (form.scaleFactor = 1)" class="!rounded !my-1">原始尺寸</el-dropdown-item
                    ><el-dropdown-item v-for="item in formSetting.sysAiVincentSupportedSizeList" :key="item" @click="() => (form.scaleFactor = item)" class="!rounded !my-1">{{ item }}倍</el-dropdown-item></el-dropdown-menu
                  >
                </template>
              </el-dropdown>
            </el-form-item>
          </el-form>
          <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleChange">
            <el-button type="primary" class="upload-btn flex items-center gap-2 !px-6"
              ><el-icon><component :is="useRenderIcon('ep:upload')" /></el-icon>上传图片</el-button
            >
          </el-upload>
          <el-button v-if="env.showEdit" class="add-btn !p-3" :icon="useRenderIcon('ep:plus')" @click="handleOpenModule" circle></el-button>
        </div>
      </el-header>
      <el-main class="main-content">
        <div class="flex justify-center align-middle h-full w-full">
          <div
            class="h-full relative w-full overflow-hidden compare-image"
            :style="{
              '--image-height': showImageSize.height + 'px',
              '--image-width': showImageSize.width + 'px',
            }"
          >
            <div v-if="!resolutionImage" class="h-full w-full image-container">
              <el-empty v-if="!showImageUrl" class="h-full w-full empty-state">
                <template #description>
                  <p class="empty-text">请上传一张需要提升分辨率的图片</p>
                </template>
              </el-empty>
              <el-image v-else :src="showImageUrl" class="h-full img image-preview" fit="contain" transition="fade"> </el-image>
            </div>
            <ScLoading ref="scLoadingRef" v-model="loadingConfig.export" transition="fade"></ScLoading>
            <ScCompare
              class="img comparison-view"
              v-if="resolutionImage"
              :left-image-label="`原图:${showImageSize.width}x${showImageSize.height}`"
              :left-image="showImageUrl"
              :right-image="resolutionImage"
              :right-image-label="`修复后:${resolutionImageSize.width}x${resolutionImageSize.height}`"
              transition="fade"
            >
            </ScCompare>
            <div v-if="resolutionImage" class="absolute bottom-6 right-6 action-buttons">
              <a :href="resolutionImage" download>
                <el-button :icon="useRenderIcon('ep:download')" circle size="large" class="download-btn"> </el-button>
              </a>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.resolution-container {
  --primary-color: #7c3aed;
  --primary-dark: #6d28d9;
  --primary-50: rgba(124, 58, 237, 0.05);
  --primary-rgb: 124, 58, 237;

  .header-panel {
    @apply bg-white/80 backdrop-blur-md border border-gray-100;
    height: auto;
    margin: 1rem 1.5rem;
    border-radius: 16px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }
  }

  .model-select {
    :deep(.el-input__wrapper) {
      @apply rounded-lg border-gray-200;
      box-shadow: none !important;
      transition: all 0.3s ease;

      &:hover {
        @apply border-primary;
        transform: translateY(-1px);
      }
    }
  }

  .scale-btn {
    @apply bg-white border-gray-200;
    transition: all 0.3s ease;

    &:hover {
      @apply border-primary bg-primary-50;
      transform: translateY(-1px);
    }
  }

  .upload-btn {
    @apply bg-primary hover:bg-primary-dark;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
    }
  }

  .add-btn {
    @apply bg-primary text-white hover:bg-primary-dark;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: rotate(90deg) scale(1.1);
      box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
    }
  }

  :deep(.el-dropdown-menu) {
    @apply rounded-xl border-gray-100 shadow-lg;

    .el-dropdown-item {
      @apply rounded-lg mx-1;
      transition: all 0.2s ease;

      &:hover {
        @apply bg-primary-50 text-primary;
        transform: translateX(4px);
      }
    }
  }
}

// 暗黑模式适配
.dark {
  .header-panel {
    @apply bg-gray-800/80 border-gray-700;
  }

  .model-select {
    :deep(.el-input__wrapper) {
      @apply bg-gray-800 border-gray-700;
    }
  }

  .scale-btn {
    @apply bg-gray-800 border-gray-700 text-gray-300;
  }
}
</style>
