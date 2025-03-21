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
  <div class="h-full w-full pt-6 px-8 bg-gray-100">
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="fixed right-8 top-1/2 sidebar-custom-v2 z-[99] bg-purple-600 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 shadow-lg rounded-full p-3" circle size="large">
    </el-button>
    <el-container>
      <el-header class="h-[80px] flex w-full items-center justify-between bg-white shadow-md rounded-lg px-6">
        <div class="panel-left">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="10px" :inline="true">
            <el-form-item prop="model">
              <div class="flex justify-start w-full">
                <el-select filterable v-model="form.model" placeholder="请选择模型" clearable @change="handleChangeModule" class="w-full border border-gray-300 rounded-md focus:border-purple-500 focus:ring-purple-500">
                  <el-option v-for="item in modelList" class="!h-[70px] flex items-center" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                    <template #default>
                      <el-tooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                        <span class="flex justify-between py-2 items-center w-full">
                          <el-image :src="item.sysProjectIcon" fit="scale-down" class="!h-[60px] !w-[60px] option-item border-gray-200">
                            <template #error>
                              <img :src="Error" />
                            </template>
                          </el-image>
                          <span class="justify-start content-center pl-3 font-medium text-gray-700">{{ item.sysAiModuleName }}</span>
                          <span class="el-form-item-msg content-center text-gray-500">{{ item.sysProjectName }}</span>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-option>
                  <template #label="{ label }">
                    <div class="flex justify-start items-center">
                      <el-image class="!h-[30px] !w-[30px] border-gray-200" :src="modelSelectLabel?.sysProjectIcon" />
                      <span class="pl-3 font-medium text-gray-700">{{ label }}</span>
                    </div>
                  </template>
                </el-select>
                <el-button v-if="env.showEdit" class="ml-3 btn-text bg-purple-600 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 rounded-md" :icon="useRenderIcon('ep:plus')" @click="handleOpenModule"></el-button>
              </div>
            </el-form-item>
            <el-form-item v-if="formSetting && formSetting.sysAiVincentSupportedSizeList">
              <el-dropdown trigger="click" class="rounded-md">
                <span class="el-dropdown-link flex items-center text-gray-700 font-medium">
                  <svg class="inline-block mr-2" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      clip-rule="evenodd"
                      d="M7.574 3h12.852A4.574 4.574 0 0 1 25 7.574v12.852A4.574 4.574 0 0 1 20.426 25H7.574A4.574 4.574 0 0 1 3 20.426V7.574A4.574 4.574 0 0 1 7.574 3Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray="1 4"
                    ></path>
                    <path d="M3 15h9a2 2 0 0 1 2 2v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  {{ scaleFactorLabel }}
                  <el-icon class="el-icon--right">
                    <component :is="useRenderIcon('ep:arrow-down')" />
                  </el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu class="rounded-md shadow-lg">
                    <!-- 选择原始尺寸的下拉项 -->
                    <el-dropdown-item @click="() => (form.scaleFactor = 1)" class="hover:bg-purple-100 rounded-md flex items-center px-4 py-2">
                      <span class="mr-2">原始尺寸</span>
                    </el-dropdown-item>
                    <!-- 根据支持的尺寸列表生成下拉项 -->
                    <el-dropdown-item @click="() => (form.scaleFactor = item)" v-for="item in formSetting.sysAiVincentSupportedSizeList" :key="item" class="hover:bg-purple-100 rounded-md flex items-center px-4 py-2">
                      <span class="mr-2">{{ item }}倍</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-form-item>
          </el-form>
        </div>
        <div class="panel-right">
          <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleChange" class="w-[200px] upload-demo">
            <template #trigger>
              <el-button type="primary" class="bg-purple-600 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 rounded-md"> 上传图片 </el-button>
            </template>
          </el-upload>
        </div>
      </el-header>
      <el-main class="pt-8">
        <div class="flex justify-center align-middle h-full">
          <div
            class="h-full relative w-full overflow-hidden compare-image rounded-lg bg-white"
            :style="{
              '--image-height': showImageSize.height + 'px',
              '--image-width': showImageSize.width + 'px',
            }"
          >
            <div v-if="!resolutionImage" class="h-full w-full min-w-[670px]">
              <el-empty v-if="!showImageUrl" class="h-full w-full"></el-empty>
              <el-image v-else :src="showImageUrl" class="h-full img object-cover" transition="fade"></el-image>
            </div>
            <ScLoading ref="scLoadingRef" v-model="loadingConfig.export" transition="fade"></ScLoading>
            <ScCompare class="img" v-if="resolutionImage" :left-image-label="`原图:${showImageSize.width}x${showImageSize.height}`" :left-image="showImageUrl" :right-image="resolutionImage" :right-image-label="`修复后:${resolutionImageSize.width}x${resolutionImageSize.height}`" transition="fade">
            </ScCompare>
            <div v-if="resolutionImage" class="absolute bottom-6 right-6">
              <a :href="resolutionImage" download>
                <el-button :icon="useRenderIcon('ep:download')" circle size="large" class="bg-purple-600 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"> </el-button>
              </a>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.compare-image {
  height: min(var(--image-height, calc(100vh - 300px)), calc(100vh - 300px));
  width: min(var(--image-width, calc(100vh - 300px)), calc(100vh - 300px));
}

:deep(.vci--container),
.img {
  --show-level-one-shadown: 1;
  height: 100% !important;
  width: 100%;
  border-radius: 10px;
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, calc(var(--show-level-one-shadown) - 0.6)),
    0px 7px 13px -3px rgba(0, 0, 0, calc(var(--show-level-one-shadown) - 0.7)),
    0px -3px 0px 0px rgba(0, 0, 0, calc(var(--show-level-one-shadown) - 0.8)) inset;
  &:has(.img2) {
    --show-level-one-shadown: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.bg-purple-600 {
  background-color: #7c3aed;
}

.bg-purple-700 {
  background-color: #6d28d9;
}

.bg-purple-100 {
  background-color: #ede9fe;
}

.text-white {
  color: white;
}

.hover:bg-purple-700:hover {
  background-color: #6d28d9;
}

.focus:ring-4 {
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
}

.focus:ring-purple-300 {
  --tw-ring-color: #d8b4fe;
}

.dark:focus:ring-purple-800 {
  --tw-ring-color: #5b21b6;
}

.rounded-full {
  border-radius: 9999px;
}

.rounded-md {
  border-radius: 0.375rem;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.shadow-lg {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-md {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.border {
  border-width: 1px;
}

.border-gray-300 {
  border-color: #d1d5db;
}

.border-gray-200 {
  border-color: #e5e7eb;
}

.object-cover {
  object-fit: cover;
}
</style>
