<script setup>
import { fetchListProjectForAiModule } from "@/api/manage/project-ai-module";
import { reactive, nextTick, defineAsyncComponent, onMounted, shallowRef, computed, ref } from "vue";
import { clearObject, fileToBase64, getRandomInt, localStorageProxy, message, urlImageInfo } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useRoute } from "vue-router";
import { fetchGetTaskForResolution, fetchSaveTaskForResolution } from "@/api/ai/image-resolution";
import { fetchGetTaskForColorization, fetchSaveTaskForColorization } from "@/api/ai/image-colorization";
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
  <div class="h-full w-full pt-4 px-4">
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="fixed right-4 top-1/2 sidebar-custom-v2 z-[99] bg-primary text-white hover:bg-primary-dark" circle size="large"> </el-button>
    <el-container>
      <el-header class="h-[60px] flex w-full items-center justify-between bg-white shadow-md rounded-md px-6">
        <div class="panel-left">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="10px" :inline="true">
            <el-form-item prop="model">
              <div class="flex justify-start w-full">
                <el-select filterable v-model="form.model" placeholder="请选择模型" clearable @change="handleChangeModule" class="w-full">
                  <el-option v-for="item in modelList" class="!h-[60px]" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                    <template #default>
                      <el-tooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                        <span class="flex justify-between py-2 items-center">
                          <el-image :src="item.sysProjectIcon" fit="scale-down" class="!h-[50px] !w-[50px] option-item rounded-md">
                            <template #error>
                              <img :src="Error" />
                            </template>
                          </el-image>
                          <span class="justify-start content-center pl-2 font-medium">{{ item.sysAiModuleName }}</span>
                          <span class="el-form-item-msg content-center text-gray-500">{{ item.sysProjectName }}</span>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-option>
                  <template #label="{ label }">
                    <div class="flex justify-start items-center">
                      <el-image class="!h-[24px] !w-[24px] rounded-md" :src="modelSelectLabel?.sysProjectIcon" />
                      <span class="pl-2 font-medium">{{ label }}</span>
                    </div>
                  </template>
                </el-select>
                <el-button v-if="env.showEdit" class="ml-2 btn-text bg-primary text-white hover:bg-primary-dark" :icon="useRenderIcon('ep:plus')" @click="handleOpenModule"></el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
        <div class="panel-right">
          <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="handleChange" class="w-[200px] upload-demo">
            <template #trigger>
              <el-button type="primary" class="bg-primary text-white hover:bg-primary-dark">上传图片</el-button>
            </template>
          </el-upload>
        </div>
      </el-header>
      <el-main class="pt-4">
        <div class="flex justify-center align-middle h-full">
          <div
            class="h-full relative w-full overflow-hidden compare-image rounded-md shadow-md"
            :style="{
              '--image-height': showImageSize.height + 'px',
              '--image-width': showImageSize.width + 'px',
            }"
          >
            <div v-if="!resolutionImage" class="h-full">
              <el-empty v-if="!showImageUrl" class="h-full"></el-empty>
              <el-image v-else :src="showImageUrl" class="h-full img rounded-md" transition="fade"></el-image>
            </div>
            <ScLoading ref="scLoadingRef" v-model="loadingConfig.export" transition="fade"></ScLoading>
            <ScCompare class="img rounded-md" v-if="resolutionImage" left-image-label="上色前" :left-image="showImageUrl" :right-image="resolutionImage" right-image-label="上色后" transition="fade"> </ScCompare>
            <div v-if="resolutionImage" class="absolute bottom-4 right-4">
              <a :href="resolutionImage" download> <el-button :icon="useRenderIcon('ep:download')" circle size="large" class="bg-primary text-white hover:bg-primary-dark"> </el-button></a>
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
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.bg-primary {
  background-color: #007bff;
}

.bg-primary-dark {
  background-color: #0056b3;
}

.text-white {
  color: white;
}

.hover:bg-primary-dark:hover {
  background-color: #0056b3;
}
</style>
