<template>
  <div class="common-layout overflow-hidden pt-1 pb-1 pl-1">
    <ModuleUpdateDialog ref="moduleUpdateDialogRef" @success="handleRefreshEnvironment"></ModuleUpdateDialog>
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment" @handleRefreshEnvironmentTemplate="handleRefreshEnvironmentTemplate"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="floating-settings-btn" circle size="large" type="primary"></el-button>
    <Transition name="fade-slide">
      <el-container class="overflow-hidden modern-container">
        <el-aside style="height: 100%; width: var(--aside-width)" class="modern-aside" id="aside">
          <div>
            <div class="w-full flex justify-end mb-4 header-actions">
              <el-icon :size="35" @click="loadModule" class="action-icon" v-if="settingOpen">
                <component :is="useRenderIcon('mdi:refresh')" />
              </el-icon>
              <el-icon :size="35" @click="handleTrigger" class="action-icon toggle-icon" :class="{ 'left-2': !settingOpen }">
                <component :is="useRenderIcon('mdi:menu-open')" v-if="settingOpen" />
                <component :is="useRenderIcon('mdi:menu-close')" v-else />
              </el-icon>
            </div>

            <el-form ref="formRef" :model="form" :rules="rules" v-if="settingOpen" label-width="100px">
              <el-form-item label="模型名称" prop="model">
                <div class="flex justify-start w-full">
                  <el-select filterable v-model="form.model" placeholder="请选择模型" clearable @change="handleChangeModule">
                    <el-option v-for="item in modelList" class="!h-[60px]" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                      <template #default>
                        <el-tooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                          <span class="flex justify-between py-2">
                            <el-image :src="item.sysProjectIcon" fit="scale-down" class="!h-[50px] !w-[50px] option-item">
                              <template #error>
                                <img :src="Error" />
                              </template>
                            </el-image>
                            <span class="justify-start content-center pl-1">{{ item.sysAiModuleName }}</span>
                            <span class="el-form-item-msg content-center">{{ item.sysProjectName }}</span>
                          </span>
                        </el-tooltip>
                      </template>
                    </el-option>
                    <template #label="{ label }">
                      <div class="flex justify-start">
                        <el-image class="!h-[24px] !w-[24px]" :src="modelSelectLabel?.sysProjectIcon" />
                        <span class="pl-2">{{ label }}</span>
                      </div>
                    </template>
                  </el-select>
                  <el-button v-if="env.showEdit" class="ml-1 btn-text" :icon="useRenderIcon('ep:plus')" @click="handleOpenModule"></el-button>
                </div>
              </el-form-item>

              <el-form-item label="比例" prop="parameters.size" class="ration--GrtZmC3d">
                <el-radio-group v-model="form.parameters.size" class="flex justify-start items-start flex-wrap">
                  <el-radio-button class="!ml-0 mt-1 mr-[12px] item" round :key="item" :value="item" v-for="(item, index) in formSetting.sysAiVincentSupportedSize?.split(',') || []">
                    <template #default>
                      <div class="flex justify-center align-middle">
                        <div class="text-center flex">
                          <i :style="{ 'aspect-ratio': getRatio(item) }" class="ai-generator_apsect_ratio_vis2__IHeeP"></i>
                          <span class="ml-1 text-center size-center">{{ item }}</span>
                        </div>
                      </div>
                    </template>
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="风格" prop="parameters.style" v-if="form.sysAiModuleType == 'VINCENT' && styleData.length > 0">
                <el-select v-model="form.parameters.style" placeholder="请选择风格">
                  <el-option :key="item.sysAiVincentStyleCode" class="!h-[60px]" :label="item.sysAiVincentStyleName" :value="item.sysAiVincentStyleCode" v-for="item in styleData || []">
                    <template #default>
                      <el-tooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiVincentStyleName}</div>`">
                        <span class="flex justify-between py-2">
                          <el-image :src="item.sysAiVincentStyleImage" fit="scale-down" class="!h-[50px] !w-[50px] option-item">
                            <template #error>
                              <img :src="Error" />
                            </template>
                          </el-image>
                          <span class="justify-start content-center pl-1">{{ item.sysAiVincentStyleName }}</span>
                          <span class="el-form-item-msg content-center">{{ item.sysAiVincentStyleCode }}</span>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-option>
                  <template #label="{ label }">
                    <div class="flex justify-start">
                      <el-image class="!h-[24px] !w-[24px]" :src="modelSelectStyle" />
                      <span class="pl-2">{{ label }}</span>
                    </div>
                  </template>
                </el-select>
              </el-form-item>

              <el-form-item label="正向提示词" prop="input.prompt">
                <el-input v-model="form.input.prompt" :rows="5" type="textarea" placeholder="正向提示词，用来描述生成图像中期望包含的元素和视觉特点。支持中英文，长度不超过800个字符，每个汉字/字母占一个字符，超过部分会自动截断。示例值：一只坐着的橘黄色的猫，表情愉悦，活泼可爱，逼真准确。"></el-input>
                <span
                  class="item-parent-item"
                  @click="
                    () => {
                      form.input.prompt = randomPrompt;
                    }
                  "
                >
                  <span class="el-form-item-msg1" :title="randomPrompt">
                    {{ randomPrompt }}
                  </span>
                  <el-icon class="cursor-pointer">
                    <component :is="useRenderIcon('ep:refresh')" @click="handleRefreshRandom()" />
                  </el-icon>
                </span>
              </el-form-item>

              <el-form-item label="反向提示词" prop="negativePrompt" v-if="form.sysAiModuleType == 'VINCENT'">
                <el-input
                  v-model="form.input.negativePrompt"
                  :rows="4"
                  type="textarea"
                  placeholder="反向提示词，用来描述不希望在画面中看到的内容，可以对画面进行限制。支持中英文，长度不超过500个字符，超过部分会自动截断。示例值：低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良等。"
                ></el-input>
              </el-form-item>

              <template v-if="formSetting.sysAiVincentSupportRefImage">
                <el-form-item label="参考图像" prop="refImg" v-if="form.sysAiModuleType == 'VINCENT'">
                  <div class="flex w-full align-middle template">
                    <el-image readonly :src="form.input.refImg" class="align-middle w-[40px] h-[40px]">
                      <template #error>
                        <el-icon size="20">
                          <component :is="useRenderIcon('ep:plus')"></component>
                        </el-icon>
                      </template>
                    </el-image>
                    <div class="flex-1 text-center text-template cursor-pointer template" @click="showRefImage = !showRefImage">选择模板</div>
                    <div class="align-middle template">
                      <el-icon size="20" class="align-middle">
                        <component :is="useRenderIcon('ep:arrow-right')"></component>
                      </el-icon>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="参考图像" prop="refImg" v-if="form.sysAiModuleType == 'VIDEO'">
                  <div class="flex w-full align-middle template">
                    <el-select v-model="form.input.refImgType" clearable>
                      <el-option value="URL" label="远程地址" />
                      <el-option value="FILE" label="本地文件" />
                    </el-select>
                  </div>
                  <template v-if="form.input.refImgType == 'URL'">
                    <div class="flex justify-between gap-1 w-full">
                      <el-input type="textarea" style="width: calc(100% - 80px)" :rows="3" v-model="form.input.refImg" placeholder="请输入远程地址"></el-input>
                      <el-image fit="scale-down" class="block el-upload-list__item-thumbnail !h-[80px] !w-[80px] m-0" :src="form.input.refImg" alt="" />
                    </div>
                  </template>
                  <el-upload accept="image/*" ref="elUploadRef" :limit="1" class="avatar-uploader justify-start" :auto-upload="false" v-else-if="form.input.refImgType == 'FILE'" :on-change="handleAvatarSuccess">
                    <el-icon class="avatar-uploader-icon">
                      <component :is="useRenderIcon('ep:upload')" />
                    </el-icon>
                    <template #file="{ file }">
                      <div class="relative" @click="handlePictureCardPreview(file)">
                        <img class="el-upload-list__item-thumbnail h-full w-[180px] m-0" :src="form.input.refImg" alt="" />
                        <span class="el-upload-list__item-actions cursor-pointer">
                          <el-button circle size="small" class="btn-text-blur !h-[20px] !w-[20px]" @click.stop="handleRemove(file)" :icon="useRenderIcon('ep:close')"> </el-button>
                        </span>
                      </div>
                    </template>
                  </el-upload>
                </el-form-item>
              </template>

              <template v-if="form.sysAiModuleType == 'VIDEO' && formSetting.sysAiVincentSupportedQuality">
                <el-form-item label="生成模式" prop="parameters.quality" class="ration--GrtZmC3d">
                  <el-radio-group v-model="form.parameters.quality" class="flex justify-start items-start flex-wrap">
                    <el-radio-button class="!ml-0 mr-[12px] item" round :key="item" :value="item" v-for="(item, index) in formSetting.sysAiVincentSupportedQuality?.split(',') || []">
                      <template #default>
                        <el-tooltip :content="getQuality(item).title">
                          <div class="flex justify-center align-middle">
                            <div class="text-center flex">
                              <el-icon>
                                <component :is="useRenderIcon(getQuality(item).icon)" />
                              </el-icon>
                              <span class="ml-1 text-center size-center">{{ getQuality(item).name }}</span>
                            </div>
                          </div>
                        </el-tooltip>
                      </template>
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="帧率" prop="parameters.fps" v-if="formSetting.sysAiVincentSupportedFps">
                  <el-select v-model="form.parameters.fps">
                    <el-option v-for="item in formSetting.sysAiVincentSupportedFps?.split(',') || []" :key="item" :value="item"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="AI音效" prop="parameters.withAudio" v-if="formSetting.sysAiVincentSupportAudio">
                  <el-segmented
                    v-model="form.parameters.withAudio"
                    :options="[
                      {
                        label: '开启',
                        value: 1,
                      },
                      {
                        label: '关闭',
                        value: 0,
                      },
                    ]"
                  ></el-segmented>
                </el-form-item>
              </template>
              <el-form-item label="输出张数" prop="parameters.number"> <el-input-number :min="1" :max="formSetting.sysAiVincentSupportedNumber" :step="1" v-model="form.parameters.number" /> </el-form-item>

              <el-form-item class="flex justify-end">
                <el-button class="w-full" :loading="loadingConfig.export" @click="handleExport" :icon="useRenderIcon('ri:export-fill')" title="生成" type="primary"></el-button>
              </el-form-item>
            </el-form>
          </div>
          <div class="overflow-hidde absolute w-[500px] top-0 ref-image p-3 z-50" v-click-outside="closePopup" v-if="showRefImage && settingOpen">
            <div class="flex justify-end pb-5">
              <el-icon class="cursor-pointer" @click="showRefImage = false">
                <component :is="useRenderIcon('ep:close')"></component>
              </el-icon>
            </div>
            <el-row>
              <el-col
                :span="8"
                v-for="row in templateList"
                @click="
                  () => {
                    form.input.refImg = row.sysAiVincentTemplateAddress;
                    form.input.style = row.sysAiVincentTemplateModelName;
                  }
                "
                class="cursor-pointer"
              >
                <div class="flex flex-col gap-2 px-2 ref-image-item">
                  <el-image :src="row.sysAiVincentTemplateAddress" fit="cover" class="img"></el-image>
                  <div>
                    <h2 class="text">{{ row.sysAiVincentTemplateName }}</h2>
                  </div>
                  <div class="el-form-item-msg">{{ row.sysAiVincentTemplateRemark }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-aside>
        <el-main class="overflow-hidden main modern-main">
          <div class="pl-2 relative">
            <vincent ref="vincentRef" :form="form" :env="env" class="modern-content" v-if="loadingConfig.showHistory"></vincent>
            <el-tag
              @click="handleHistory"
              type="default"
              class="history-toggle"
              :class="{
                'history-toggle-visible': loadingConfig.showHistory,
                'history-toggle-hidden': !loadingConfig.showHistory,
              }"
              ><span class="el-form-item-msg">历史信息</span></el-tag
            >
            <HistoryLayout ref="historyLayoutRef" :form="form" :full="loadingConfig.showHistory" :env="env" class="overflow-hidden" @redrawer="handleReDraw"></HistoryLayout>
          </div>
        </el-main>
      </el-container>
    </Transition>
  </div>
</template>
<script setup>
import Error from "@repo/assets/images/error.png";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useUserStoreHook } from "@repo/core";
import { clearObject, getRandomInt, localStorageProxy, message } from "@repo/utils";
import { api as viewerApi } from "v-viewer";
import "viewerjs/dist/viewer.css";
import { computed, defineAsyncComponent, onMounted, reactive, ref, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { fetchGetTaskForVincent, fetchSaveTaskForVincent } from "../../../api/ai/text-generations";
import { fetchListForModelStyle } from "../../../api/ai/vincent-style";
import { fetchListForModelTemplate } from "../../../api/ai/vincent-template";
import { fetchListProjectForAiModule } from "../../../api/manage/project-ai-module";
import { getQuality, RANDOM_DATA } from "./hook";
const HistoryLayout = defineAsyncComponent(() => import("./history.vue"));
const vincent = defineAsyncComponent(() => import("./vincent.vue"));
const ModuleUpdateDialog = defineAsyncComponent(() => import("../module-update.vue"));
const ModuleDialog = defineAsyncComponent(() => import("../module.vue"));
const vincentRef = shallowRef();
const historyLayoutRef = shallowRef();
const elUploadRef = shallowRef();
const styleData = shallowRef([]);
const settingOpen = shallowRef(true);
const showRefImage = shallowRef(false);
const loadingConfig = reactive({
  export: false,
  showHistory: true,
});

const props = defineProps({
  category: "IMAGE",
  type: "VINCENT",
  selectedItemLabel: "ai-image-generations-selected",
});
const form = reactive({
  tokens: 2048,
  topK: 4,
  temperature: 0.5,
  sysProjectId: null,
  sysAiModuleType: "VINCENT",
  input: {
    prompt: "一只坐着的橘黄色的猫，表情愉悦，活泼可爱，逼真准确。",
    negativePrompt: null,
    refImg: null,
  },
  parameters: {
    style: "<auto>",
    size: "1024*1024",
    seed: null,
    number: 1,
    refStrength: null,
  },
});
const formSetting = reactive({});
const randomPrompt = shallowRef("");
const moduleUpdateDialogRef = shallowRef();
const moduleDialogRef = shallowRef();
const formRef = shallowRef();
const modelList = shallowRef([]);
const templateList = ref([]);
const env = {
  category: "IMAGE",
};
const rules = {
  model: [{ required: true, message: "请选择模型", trigger: "change" }],
  tokens: [{ required: true, message: "请输入tokens", trigger: "change" }],
  topK: [{ required: true, message: "请输入topK", trigger: "change" }],
  temperature: [{ required: true, message: "请输入temperature", trigger: "change" }],
  "parameters.size": [{ required: true, message: "请输入比例", trigger: "change" }],
  "parameters.style": [{ required: true, message: "请输入风格", trigger: "change" }],
  "parameters.number": [{ required: true, message: "请输入输出图片张数", trigger: "change" }],
};
const route = useRoute();
const handleAvatarSuccess = (response, uploadFile) => {
  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    form.input.refImg = e.target.result;
  };
  fileReader.readAsDataURL(uploadFile[0].raw);
};
/**
 * 预览
 * @param file
 */
const handlePictureCardPreview = async (file) => {
  viewerApi({
    images: [form.input.refImg],
    options: {
      backdrop: true,
      inline: true,
    },
  });
};

/**
 * 历史信息开关
 */
const handleHistory = async () => {
  loadingConfig.showHistory = !loadingConfig.showHistory;
  historyLayoutRef.value.refull(!loadingConfig.showHistory);
};

/**
 * 删除文件
 * @param file 文件
 */
const handleRemove = async (file) => {
  elUploadRef.value.abort();
  elUploadRef.value.handleRemove(file);
  elUploadRef.value.clearFiles();
};
/**
 * 关闭弹窗
 */
const closePopup = async (el) => {
  showRefImage.value = false;
};

const modelSelectStyle = computed(() => {
  return styleData.value.find((it) => it.sysAiVincentStyleCode === form.parameters.style)?.sysAiVincentStyleImage;
});
/**
 * 获取随机提示词
 */
const handleRefreshRandom = async () => {
  randomPrompt.value = RANDOM_DATA[getRandomInt(0, RANDOM_DATA.length - 1)];
};
const showRoleSetting = computed(() => {
  const item = modelList.value.filter((it) => (it.sysAiModuleCode = form.model));
  return item ? item?.[0]?.sysAiModuleRoleSetting : 0;
});

let intervalId = null;
/**
 * 获取比例
 */
const getRatio = (item) => {
  let _width = 1024;
  let _height = 1024;
  if (item.indexOf("*") > -1) {
    const _it = item.split("*");
    _width = ~~_it[0]?.trim();
    _height = ~~_it[1]?.trim();
  } else {
    const _it = item.split("x");
    _width = ~~_it[0]?.trim();
    _height = ~~_it[1]?.trim();
  }
  function gcd(a, b) {
    // 辗转相除法计算最大公约数
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  // 计算最大公约数
  const commonDivisor = gcd(_width, _height);

  // 简化宽高比
  const simplifiedWidth = _width / commonDivisor;
  const simplifiedHeight = _height / commonDivisor;

  return `${simplifiedWidth}/${simplifiedHeight}`;
};
/**
 * 获取key
 */
const requestId = () => {
  const _requestId = localStorageProxy().getItem("vincent-request-id:" + getKey());
  return _requestId;
};

const handleReDraw = async (value, type) => {
  if ("model" == type) {
    form.model = value;
    handleChangeModule(value);
    return;
  }
  form.input.prompt = value;
};
const loadedRequestId = async (row) => {
  localStorageProxy().setItem("vincent-request-id:" + getKey(), row.data?.output?.taskId);
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

const process = reactive({});
const initialImageIndex = async () => {
  for (let index = 0; index < form.parameters.number; index++) {
    process[index] = 10;
  }
};
const updateImageIndex = async (finished, progress) => {
  vincentRef.value?.updateImageIndex(progress);
};

const getKey = () => {
  return form.model.replace("/", "_");
};
const clearTask = () => {
  clearInterval(intervalId);
  intervalId = null;
  localStorageProxy().removeItem("vincent-request-id:" + getKey());
  updateImageIndex(true);
  loadingConfig.export = false;
  vincentRef.value?.finish();
};

const updateImage = async (images) => {
  vincentRef.value.updateImage(images);
};
const createInterval = () => {
  if (!requestId()) {
    loadingConfig.export = false;
    clearTask();
    vincentRef.value.clearImage();
    updateImage([]);
    return;
  }
  intervalId = setInterval(() => {
    fetchGetTaskForVincent({ taskId: requestId(), sysProjectId: form.sysProjectId, sysAiModuleType: form.sysAiModuleType, model: form.model })
      .then((res) => {
        if (res.data?.output?.taskStatus === "SUCCESS") {
          clearTask();
          updateImage(res.data?.output?.results?.map((it) => it.url));
          updateImageIndex(true, 100);
        } else {
          updateImageIndex(false, res.data.progress);
        }
      })
      .catch((e) => {
        loadingConfig.export = false;
        clearTask();
        vincentRef.value.clearImage();
        updateImage([]);
      });
  }, 5000);
};
const handleExport = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      loadingConfig.export = true;
      initialImageIndex();
      vincentRef.value.initialImageIndex();
      historyLayoutRef.value.updateData();
      fetchSaveTaskForVincent(form)
        .then((res) => {
          if (res.data?.output?.taskStatus === "FAILURE") {
            loadingConfig.export = false;
            clearTask();
            vincentRef.value.clearImage();
            updateImage([]);
            vincentRef.value.failure();
            message("创建任务失败!", { type: "error" });
            return;
          }

          if (res.data?.output?.images) {
            clearTask();
            updateImage(res.data.output.images);
            updateImageIndex(true, 100);
            return;
          }
          loadedRequestId(res);
          createInterval();
        })
        .catch((e) => {
          loadingConfig.export = false;
          clearTask();
          vincentRef.value.clearImage();
          updateImage([]);
          vincentRef.value.failure();
        });
    }
  });
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

const modelSelectLabel = computed(() => {
  return modelList.value.find((it) => it.sysAiModuleCode === form.model);
});

const handleTrigger = async () => {
  settingOpen.value = !settingOpen.value;
  window.aside.style.setProperty("--aside-width", settingOpen.value ? "400px" : "55px");
};
const onAfterProperieSet = () => {
  handleRefreshRandom();
  const query = route.query;
  env.sysProjectId = query.sysProjectId;
  env.category = query.category || props.category || "IMAGE";
  env.showEdit = !useUserStoreHook().tenantId;
  env.sysProjectName = query.sysProjectName;
  form.sysAiModuleType = query.type || props.type || "VINCENT";
  form.sysProjectId = env.sysProjectId;
  form.sysProjectName = env.sysProjectName;
  if (requestId) {
    loadConfig.export = true;
  }
};

const handleOpenModule = async () => {
  moduleUpdateDialogRef.value.handleOpen(form, "add");
};
const handleOpenModuleManager = async () => {
  moduleDialogRef.value.handleOpen(form, "add");
};
const handleRefreshEnvironment = async () => {
  await initialModuleList();
};

const handleRefreshEnvironmentTemplate = async () => {
  loadTemplate();
};

/**
 * 加载模板
 */
const loadTemplate = async () => {
  const { data } = await fetchListForModelTemplate({
    sysAiModuleId: form.sysAiModuleId,
  });
  templateList.value = data;
};
const loadModule = async () => {
  handleRefreshEnvironment();
};
const initialModuleList = async () => {
  const { data } = await fetchListProjectForAiModule(form);
  modelList.value = data;
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

const loadConfig = async (row, sysAiModuleCode) => {
  clearObject(formSetting);
  Object.assign(formSetting, row?.vincentSetting);
  localStorageProxy().setItem(props.selectedItemLabel, sysAiModuleCode);
  loadTemplate();
  loadStyle(row);
};
const loadStyle = async (row) => {
  loadingConfig.loading = true;
  try {
    const { data } = await fetchListForModelStyle({
      sysAiModuleId: form.sysAiModuleId,
    });
    styleData.value = data;
    form.parameters.style = styleData.value.length > 0 ? styleData.value[0]?.sysAiVincentStyleCode : "";
  } catch (error) {}
  loadingConfig.loading = false;
};
onMounted(async () => {
  onAfterProperieSet();
  initialModuleList();
  handleTrigger();
});
</script>
<style scoped lang="scss">
:deep(.el-main) {
  padding: 0;
}
:deep(.video-js .vjs-big-play-button) {
  top: calc(50% - 24px);
  left: calc(50% - 48px);
}

.common-layout {
  height: 100%;
}

/* 现代化容器样式 */
.modern-container {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: calc(100vh - 20px);
}

/* 侧边栏样式 */
.modern-aside {
  border-radius: 16px;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  background-color: var(--el-bg-color);
  padding: 20px;
  position: relative;
  overflow: hidden !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 主内容区样式 */
.modern-main {
  background-color: var(--el-bg-color-2);
  border-radius: 16px;
  transition: all 0.3s ease;
}

/* 内容卡片样式 */
.modern-content {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 浮动设置按钮 */
.floating-settings-btn {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 99;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-50%) scale(1.1) rotate(15deg);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

/* 头部操作按钮 */
.header-actions {
  padding: 8px 0;
}

.action-icon {
  margin-left: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
    transform: scale(1.1);
  }
}

.toggle-icon {
  color: var(--el-color-primary);
}

/* 历史记录切换按钮 */
.history-toggle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateX(-50%) translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &-visible {
    top: 250px;
  }

  &-hidden {
    top: 0;
  }
}

/* 表单元素美化 */
:deep(.el-form-item) {
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

:deep(.el-input),
:deep(.el-select),
:deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: all 0.3s ease;

  &:focus,
  &:hover {
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

:deep(.el-radio-button__inner) {
  transition: all 0.3s ease;
}

/* 动画效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 参考图像样式 */
.ref-image {
  left: var(--aside-width);
  z-index: 2;
  height: 100%;
  background-color: var(--el-bg-color);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.ref-image-item {
  transition: all 0.3s ease;
  margin-bottom: 16px;

  &:hover {
    transform: translateY(-5px);
  }

  .img {
    border-radius: 12px;
    padding-top: 4px;
    box-shadow:
      0px 2px 4px 0px rgba(0, 0, 0, 0.1),
      0px 7px 13px -3px rgba(0, 0, 0, 0.1),
      0px -3px 0px 0px rgba(0, 0, 0, 0.05) inset;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  .text {
    margin-top: 8px;
    font-weight: 500;
    text-shadow:
      1px 1px 0px #d7e8f9,
      2px 2px 0px #d7e8f9;
    transition: all 0.3s ease;
  }
}

/* 保留原有样式 */
.text-template {
  color: #8f91a8;
}

.layout-main {
  background-color: var(--el-bg-color-2);
}

.active {
  background: #eeedff;
}

:deep(.item .el-radio-button__inner) {
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.ration--GrtZmC3d .list--mF4x7otZ .item--jRS5LJnK {
  align-items: center;
  background: var(--wanx-v2-color4);
  border-radius: 100px;
  cursor: pointer;
  display: flex;
  padding: 11px 0;
  width: calc(33.33333% - 5.33333px);
}

#chat {
  height: calc(100vh - 150px);
}

.item-parent-item {
  align-items: center;
  display: flex;
  height: 20px;
  margin-top: 8px;
  color: #8f91a8;
}

.el-form-item-msg1 {
  width: 200px;
  display: inline-block;
  cursor: pointer;
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size-center {
  align-content: center;
}

.ai-generator_apsect_ratio_vis2__IHeeP {
  display: block;
  width: 12px;
  background: rgba(114, 46, 209, 0.7);
  border: 1px solid #3c3f44;
  border-radius: 1px;
  transition: 0.2s ease-in-out;
}

/* 上传组件样式 */
:deep(.avatar-uploader .el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);

  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

:deep(.el-upload-list) {
  margin: 0;
}

.avatar-uploader {
  display: flex;
  flex-direction: row;
  height: 180px;
  margin-top: 10px;
}

.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.el-upload-list__item-actions {
  display: flex;
  position: absolute;
  top: 10px;
  right: 10px;
}

/* 按钮动画 */
:deep(.el-button) {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
}

/* 选择器动画 */
:deep(.el-select-dropdown__item) {
  transition: all 0.2s ease;

  &.selected {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
  }

  &:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.05);
    transform: translateX(5px);
  }
}
</style>
