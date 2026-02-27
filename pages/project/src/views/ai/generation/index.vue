<template>
  <div class="ai-generator-layout system-container modern-bg">
    <!-- 对话框组件 -->
    <ModuleUpdateDialog ref="moduleUpdateDialogRef" @success="handleRefreshEnvironment"></ModuleUpdateDialog>
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment" @handleRefreshEnvironmentTemplate="handleRefreshEnvironmentTemplate"></ModuleDialog>

    <!-- 模型配置管理面板 -->
    <ModuleDialog ref="modelConfigDialogRef" @success="handleRefreshEnvironment" @handleRefreshEnvironmentTemplate="handleRefreshEnvironmentTemplate" />

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 历史记录区域（包含新生成的内容） -->
      <div class="history-section">
        <HistoryLayout ref="historyLayoutRef" :form="form" :full="true" :env="env" :new-generated-data="generatedResults" @redrawer="handleReDraw"></HistoryLayout>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="bottom-input-area">
      <!-- 设置选项栏 -->
      <div class="settings-bar" v-if="showSettings">
        <el-scrollbar class="settings-scroll">
          <div class="settings-content">
            <!-- 模型选择 -->
            <div class="setting-item">
              <label class="setting-label">模型</label>
              <ScSelect v-model="form.model" placeholder="选择模型" size="small" @change="handleChangeModule" class="compact-select">
                <ScOption v-for="item in modelList" :key="item.sysAiModuleCode" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                  <div class="model-option">
                    <ScImage :src="item.sysProjectIcon" class="model-icon" />
                    <span>{{ item.sysAiModuleName }}</span>
                  </div>
                </ScOption>
              </ScSelect>
            </div>

            <!-- 比例选择 -->
            <div class="setting-item">
              <label class="setting-label">比例</label>
              <ScRadioGroup v-model="form.parameters.size" size="small" class="compact-radio-group">
                <el-radio-button v-for="size in formSetting.sysAiVincentSupportedSize?.split(',') || []" :key="size" :value="size" class="ratio-button">
                  <div class="ratio-content">
                    <i :style="{ 'aspect-ratio': getRatio(size) }" class="ratio-visual"></i>
                    <span class="ratio-text">{{ size }}</span>
                  </div>
                </el-radio-button>
              </ScRadioGroup>
            </div>

            <!-- 风格选择 -->
            <div class="setting-item" v-if="form.sysAiModuleType == 'VINCENT' && styleData.length > 0">
              <label class="setting-label">风格</label>
              <ScSelect v-model="form.parameters.style" placeholder="选择风格" size="small" class="compact-select">
                <ScOption v-for="item in styleData" :key="item.sysAiVincentStyleCode" :label="item.sysAiVincentStyleName" :value="item.sysAiVincentStyleCode">
                  <div class="style-option">
                    <ScImage :src="item.sysAiVincentStyleImage" class="style-icon" />
                    <span>{{ item.sysAiVincentStyleName }}</span>
                  </div>
                </ScOption>
              </ScSelect>
            </div>

            <!-- 输出数量 -->
            <div class="setting-item">
              <label class="setting-label">数量</label>
              <ScInputNumber v-model="form.parameters.number" :min="1" :max="formSetting.sysAiVincentSupportedNumber || 4" size="small" class="compact-number" controls-position="right" />
            </div>

            <!-- 质量选择（视频模式） -->
            <div class="setting-item" v-if="form.sysAiModuleType == 'VIDEO' && formSetting.sysAiVincentSupportedQuality">
              <label class="setting-label">质量</label>
              <ScRadioGroup v-model="form.parameters.quality" size="small" class="compact-radio-group">
                <el-radio-button v-for="item in formSetting.sysAiVincentSupportedQuality?.split(',') || []" :key="item" :value="item">
                  {{ getQuality(item)?.name || item }}
                </el-radio-button>
              </ScRadioGroup>
            </div>

            <!-- 帧率选择（视频模式） -->
            <div class="setting-item" v-if="form.sysAiModuleType == 'VIDEO' && formSetting.sysAiVincentSupportedFps">
              <label class="setting-label">帧率</label>
              <ScSelect v-model="form.parameters.fps" placeholder="选择帧率" size="small" class="compact-select">
                <ScOption v-for="fps in formSetting.sysAiVincentSupportedFps?.split(',') || []" :key="fps" :label="fps + ' FPS'" :value="fps" />
              </ScSelect>
            </div>

            <!-- AI音效（视频模式） -->
            <div class="setting-item" v-if="form.sysAiModuleType == 'VIDEO' && formSetting.sysAiVincentSupportAudio">
              <label class="setting-label">音效</label>
              <ScSwitch v-model="form.parameters.withAudio" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" size="small" />
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 主输入框 -->
      <div class="input-container">
        <div class="input-wrapper">
          <!-- 主输入区域 -->
          <div class="main-input">
            <EditorSender
              ref="editorSenderRef"
              v-model="currentMessage"
              placeholder="💌 描述你想要生成的图片或视频... 支持多模态输入，输入@选择风格标签"
              :max-length="2000"
              :loading="loadingConfig.export"
              :disabled="loadingConfig.export"
              :auto-focus="true"
              :clearable="true"
              :select-list="styleSelectList"
              @change="handleCurrentChangeValue"
              @select-tag="handleStyleTagSelect"
              variant="updown"
              submit-type="enter"
              :custom-style="{ maxHeight: '200px' }"
              @submit="handleGenerate"
              @clear="handleClearInput"
              class="editor-sender"
            >
              <!-- 自定义前缀 -->
              <template #prefix>
                <div class="input-prefix">
                  <ScTooltip content="高级设置" placement="top">
                    <ScButton circle @click="toggleAdvanced" :type="showAdvanced ? 'primary' : 'default'">
                      <IconifyIconOnline icon="mdi:tune-variant" />
                    </ScButton>
                  </ScTooltip>

                  <ScTooltip content="随机描述词" placement="top">
                    <ScButton circle @click="handleRandomPrompt" type="default">
                      <IconifyIconOnline icon="ep:refresh" />
                    </ScButton>
                  </ScTooltip>

                  <ScTooltip content="模型配置" placement="top">
                    <ScButton circle @click="toggleModelConfig" :type="showModelConfig ? 'primary' : 'default'">
                      <IconifyIconOnline icon="ri:settings-4-line" />
                    </ScButton>
                  </ScTooltip>
                </div>
              </template>

              <!-- 自定义操作列表 -->
              <template #action-list>
                <div class="action-buttons">
                  <!-- 模型选择按钮 -->
                  <ScSelect v-model="form.model" class="min-w-[200px]" :options="modelOptions" layout="dropdown" dropdown-icon="ri:cpu-line" dropdown-title="模型选择" dropdown-placeholder="选择模型" @change="handleModelSelect" height="600px"> </ScSelect>

                  <!-- 分辨率选择按钮 -->
                  <ScSelect v-model="form.parameters.size" :options="sizeOptions" layout="dropdown" dropdown-icon="ri:aspect-ratio-line" dropdown-title="比例" dropdown-placeholder="选择分辨率" @change="handleSizeSelect" v-if="sizeOptions && sizeOptions.length > 0" />

                  <!-- 风格选择按钮 (仅VINCENT类型显示) -->
                  <ScSelect
                    displayMode="large"
                    v-if="form.sysAiModuleType === 'VINCENT' && styleOptions.length > 0"
                    v-model="form.parameters.style"
                    :options="styleOptions"
                    layout="dropdown"
                    dropdown-direction="horizontal"
                    :dropdown-col="4"
                    display-mode="large"
                    width="100%"
                    height="600px"
                    dropdown-icon="ri:palette-line"
                    dropdown-title="风格"
                    dropdown-placeholder="选择风格"
                    @change="handleStyleSelect"
                  >
                    <template #header="{ item }">
                      {{ item }}
                    </template>
                  </ScSelect>

                  <!-- 数量选择按钮 -->
                  <ScSelect v-model="form.parameters.number" :options="numberOptions" layout="dropdown" class="min-w-[150px]" dropdown-icon="ri:hashtag" dropdown-title="数量" dropdown-placeholder="选择数量" @change="handleNumberSelect" />

                  <!-- 生成/停止按钮 -->
                  <ScButton v-if="loadingConfig.export" circle @click="stopGeneration" class="stop-btn">
                    <IconifyIconOnline icon="ri:stop-circle-line" />
                  </ScButton>
                  <ScButton v-else circle @click="handleGenerate" :disabled="!canGenerate" class="generate-btn" type="primary">
                    <IconifyIconOnline icon="ri:magic-line" />
                  </ScButton>
                </div>
              </template>

              <!-- 自定义底部 - 反向提示词 -->
              <template #footer v-if="form.sysAiModuleType == 'VINCENT' && showAdvanced">
                <div class="negative-prompt-section">
                  <div class="negative-prompt-label">
                    <IconifyIconOnline icon="ri:subtract-line" />
                    <span>反向提示词</span>
                  </div>
                  <ScInput v-model="form.input.negativePrompt" type="textarea" :rows="1" placeholder="不希望出现的内容..." class="negative-prompt-input"></ScInput>
                </div>
              </template>
            </EditorSender>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useUserStoreHook } from "@repo/core";
import { clearObject, getRandomInt, localStorageProxy, message } from "@repo/utils";

import ScSelect from "@repo/components/ScSelect/index.vue";
import { computed, defineAsyncComponent, onMounted, reactive, ref, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { fetchGetTaskForVincent, fetchSaveTaskForVincent } from "../../../api/ai/text-generations";
import { fetchListForModelStyle } from "../../../api/ai/vincent-style";
import { fetchListForModelTemplate } from "../../../api/ai/vincent-template";
import { fetchListProjectForAiModule } from "../../../api/manage/project-ai-module";
import { RANDOM_DATA } from "./hook";
const HistoryLayout = defineAsyncComponent(() => import("./module/HistoryLayout.vue"));
const ModuleUpdateDialog = defineAsyncComponent(() => import("./module/ModuleUpdateDialog.vue"));
const ModuleDialog = defineAsyncComponent(() => import("./module/ModuleDialog.vue"));
const historyLayoutRef = shallowRef();
const styleData = shallowRef([]);
const loadingConfig = reactive({
  export: false,
});

// 新的响应式变量
const showSettings = ref(false);
const showAdvanced = ref(false);
const generatedResults = ref([]);

// EditorSender 相关变量
const currentMessage = ref("");
const editorSenderRef = ref(null);

// 模型配置管理面板相关变量
const modelConfigDialogRef = ref(null);

// 初始化currentMessage的值
currentMessage.value = "一只坐着的橘黄色的猫，表情愉悦，活泼可爱，逼真准确。";

// 监听form.input.prompt的变化，同步到currentMessage
// watch(
//   () => form.input.prompt,
//   (newVal) => {
//     if (newVal !== currentMessage.value) {
//       currentMessage.value = newVal;
//     }
//   },
//   { immediate: true }
// );

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

// 新的切换方法
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value;
};

const handleRefImage = () => {
  // 处理参考图片选择
  console.log("选择参考图片");
};

const handleRandomPrompt = async () => {
  // 获取随机描述词
  await handleRefreshRandom();
  // 将随机描述词设置到输入框
  currentMessage.value = randomPrompt.value;
  form.input.prompt = randomPrompt.value;
  // 如果EditorSender组件有setValue方法，也同步设置
  if (editorSenderRef.value && editorSenderRef.value.setText) {
    editorSenderRef.value.clear();
    editorSenderRef.value.setText(randomPrompt.value);
  }
};

const handleGenerate = async () => {
  // 同步EditorSender的内容到form.input.prompt
  if (currentMessage.value.trim()) {
    form.input.prompt = currentMessage.value.trim();
  }
  // 处理生成请求
  await handleExport();
};

// EditorSender 相关方法
const handleCurrentChangeValue = async () => {
  if (editorSenderRef.value) {
    const result = editorSenderRef.value.getCurrentValue();
    currentMessage.value = result.text;
    form.input.prompt = result.text;
  }
};

const handleClearInput = () => {
  currentMessage.value = "";
  form.input.prompt = "";
  if (editorSenderRef.value) {
    editorSenderRef.value.clear();
  }
};

// 下拉选择处理方法
const handleModelSelect = (modelValue) => {
  form.model = modelValue;
  handleChangeModule(modelValue);
};

const handleSizeSelect = (sizeValue) => {
  form.parameters.size = sizeValue;
};

const handleStyleSelect = (styleValue) => {
  form.parameters.style = styleValue;
};

const handleNumberSelect = (numberValue) => {
  form.parameters.number = numberValue;
};

// 处理风格标签选择
const handleStyleTagSelect = (tagData) => {
  // tagData 包含选择的标签信息
  if (tagData && tagData.key === "style") {
    // 更新风格选择
    form.parameters.style = tagData.selectedId;

    // 找到对应的风格名称
    const selectedStyle = styleData.value.find((style) => style.sysAiVincentStyleCode === tagData.selectedId);
    if (selectedStyle) {
      console.log("选择了风格标签:", selectedStyle.sysAiVincentStyleName);
      // 可以在这里添加一些用户反馈，比如消息提示
      message.success(`已选择风格: ${selectedStyle.sysAiVincentStyleName}`);
    }
  }
};

// 手动触发风格标签选择对话框
const openStyleTagDialog = () => {
  if (editorSenderRef.value && styleData.value.length > 0) {
    // 获取当前光标位置的元素
    const editorElement = editorSenderRef.value.$el?.querySelector(".editor-content");
    if (editorElement) {
      editorSenderRef.value.openSelectDialog({
        key: "style",
        elm: editorElement,
        beforeText: "",
        afterText: "",
      });
    }
  }
};

// 选项数据
const sizeOptions = computed(() => {
  const sizes = formSetting.sysAiVincentSupportedSize?.split(",") || [];
  return sizes.map((size) => ({
    value: size,
    label: size,
    description: getRatio(size),
  }));
});

const styleOptions = computed(() => {
  return styleData.value.map((style) => ({
    value: style.sysAiVincentStyleCode,
    label: style.sysAiVincentStyleName,
    preview: style.sysAiVincentStyleImage,
  }));
});

// EditorSender 风格标签选择列表配置
const styleSelectList = computed(() => {
  if (!styleData.value || styleData.value.length === 0) {
    return [];
  }

  return [
    {
      dialogTitle: "选择风格标签",
      key: "style",
      options: styleData.value.map((style) => ({
        id: style.sysAiVincentStyleCode,
        name: style.sysAiVincentStyleName,
        preview: style.sysAiVincentStyleImage,
      })),
    },
  ];
});

const numberOptions = computed(() => {
  const maxNumber = formSetting.sysAiVincentSupportedNumber || 4;
  const options = [];
  for (let i = 1; i <= maxNumber; i++) {
    options.push({
      value: i,
      label: `${i}张`,
      description: i === 1 ? "单张生成" : `生成${i}张图片`,
    });
  }
  return options;
});

const modelOptions = computed(() => {
  return modelList.value.map((model) => ({
    value: model.sysAiModuleCode,
    label: model.sysAiModuleName,
    description: model.sysAiModuleRemark || model.sysAiModuleName,
    icon: model.sysProjectIcon,
  }));
});

const stopGeneration = () => {
  // 停止生成
  loadingConfig.export = false;
  console.log("停止生成");
};

// 计算属性：是否可以生成
const canGenerate = computed(() => {
  return currentMessage.value.trim().length > 0 && !loadingConfig.export;
});

const previewMedia = (result) => {
  // 预览媒体文件
  console.log("预览媒体:", result);
};

// 模型配置相关方法
const toggleModelConfig = () => {
  // 打开模型配置管理面板
  if (modelConfigDialogRef.value) {
    const params = {
      sysAiModuleType: "VINCENT", // 图像生成模型类型
    };

    // 只有当sysProjectId存在时才传递该参数
    if (env.sysProjectId) {
      params.sysProjectId = env.sysProjectId;
      params.sysProjectName = env.sysProjectName;
    }

    modelConfigDialogRef.value.handleOpen(params, "edit");
  }
};

const handleGenerateSeed = () => {
  // 生成新的随机种子
  form.parameters.seed = Math.floor(Math.random() * 1000000);
  message.success(`已生成新的随机种子: ${form.parameters.seed}`);
};

// 历史记录相关方法已移除，现在HistoryLayout始终显示

const modelSelectStyle = computed(() => {
  return styleData.value.find((it) => it.sysAiVincentStyleCode === form.parameters.style)?.sysAiVincentStyleImage;
});

// 当前选择的模型名称
const currentModelName = computed(() => {
  const model = modelList.value.find((it) => it.sysAiModuleCode === form.model);
  return model?.sysAiModuleName || "选择模型";
});

// 当前选择的分辨率
const currentSizeName = computed(() => {
  return form.parameters.size || "选择分辨率";
});

// 当前选择的风格名称
const currentStyleName = computed(() => {
  const style = styleData.value.find((it) => it.sysAiVincentStyleCode === form.parameters.style);
  return style?.sysAiVincentStyleName || "选择风格";
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
 * 获取质量配置
 */
const getQuality = (quality) => {
  const qualityMap = {
    HD: { name: "高清", value: "HD" },
    FHD: { name: "全高清", value: "FHD" },
    "4K": { name: "超高清", value: "4K" },
    low: { name: "标清", value: "low" },
    medium: { name: "中等", value: "medium" },
    high: { name: "高质量", value: "high" },
  };
  return qualityMap[quality] || { name: quality, value: quality };
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
  // 创建占位符数据
  const placeholders = [];
  for (let index = 0; index < form.parameters.number; index++) {
    process[index] = 10;
    placeholders.push({
      id: `placeholder_${Date.now()}_${index}`,
      type: form.sysAiModuleType === "VIDEO" ? "video" : "image",
      url: null, // 占位符没有实际URL
      isPlaceholder: true,
      progress: 10,
      timestamp: new Date().toISOString(),
    });
  }
  // 设置占位符到生成结果中
  generatedResults.value = placeholders;
};
const updateImageIndex = async (finished, progress) => {
  if (finished) {
    // 生成完成，清除进度显示
    generatedResults.value.forEach((item) => {
      if (item.isPlaceholder) {
        item.progress = 100;
      }
    });
  } else if (progress && generatedResults.value.length > 0) {
    // 更新占位符的进度
    generatedResults.value.forEach((item) => {
      if (item.isPlaceholder) {
        item.progress = Math.max(progress, 10);
      }
    });
  }
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
};

const updateImage = async (images) => {
  // 更新生成结果到新的展示区域
  if (images && images.length > 0) {
    const newResults = images.map((url, index) => ({
      id: Date.now() + index,
      type: form.sysAiModuleType === "VIDEO" ? "video" : "image",
      url: url,
      timestamp: new Date().toISOString(),
    }));
    generatedResults.value = newResults;
  } else {
    generatedResults.value = [];
  }

  // 图片更新已移至新的展示区域
};
const createInterval = () => {
  if (!requestId()) {
    loadingConfig.export = false;
    clearTask();
    updateImage([]);
    return;
  }
  intervalId = setInterval(() => {
    fetchGetTaskForVincent({ taskId: requestId(), sysProjectId: form.sysProjectId, sysAiModuleType: form.sysAiModuleType, model: form.model })
      .then((res) => {
        const _status = res.data?.output?.taskStatus || res.data?.output?.task_status;
        if (_status === "SUCCESS") {
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
        updateImage([]);
      });
  }, 5000);
};
const handleExport = async () => {
  // 如果没有formRef，直接执行生成逻辑
  const executeGeneration = async () => {
    loadingConfig.export = true;
    initialImageIndex();
    if (historyLayoutRef.value) {
      historyLayoutRef.value.updateData();
    }

    try {
      const res = await fetchSaveTaskForVincent(form);

      if (res.data?.output?.taskStatus === "FAILURE") {
        loadingConfig.export = false;
        clearTask();
        updateImage([]);
        message("创建任务失败!", { type: "error" });
        return;
      }

      if (res.data?.output?.images) {
        clearTask();
        updateImage(res.data.output.images);
        updateImageIndex(true, 100);
        return;
      }

      // 获取当前选中模型的异步支持配置
      const currentModel = modelList.value.find((it) => it.sysAiModuleCode === form.model);
      const supportAsync = currentModel?.sysAiVincentSupportAsync || 0;

      loadedRequestId(res);

      // 根据模型是否支持异步来决定处理方式
      if (supportAsync === 1) {
        // 支持异步，使用定时查询
        createInterval();
      } else {
        // 不支持异步，直接处理同步结果
        if (res.data?.output?.results) {
          clearTask();
          updateImage(res.data.output.results.map((it) => it.url));
          updateImageIndex(true, 100);
        } else {
          // 如果没有直接结果，仍然需要等待
          loadingConfig.export = false;
          clearTask();
          updateImage([]);
          message("生成完成，但未获取到结果", { type: "warning" });
        }
      }
    } catch (e) {
      loadingConfig.export = false;
      clearTask();
      updateImage([]);
      message("生成失败!", { type: "error" });
    }
  };

  if (formRef.value) {
    formRef.value.validate(async (valid) => {
      if (valid) {
        await executeGeneration();
      }
    });
  } else {
    // 简单验证必要字段
    if (!form.model) {
      message("请选择模型", { type: "warning" });
      return;
    }
    if (!form.input.prompt) {
      message("请输入提示词", { type: "warning" });
      return;
    }
    await executeGeneration();
  }
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
  box-shadow: 0 8px 24px var(--el-box-shadow);
  transition: all 0.3s ease;
  height: calc(100vh - 20px);
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
  box-shadow: 0 4px 16px var(--el-box-shadow);
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

/* 新的AI生成器布局样式 */
.ai-generator-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--el-bg-color-2) 0%, #c3cfe2 100%);
  overflow: hidden;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
}

/* 媒体展示区域样式已移至 HistoryLayout 和 MediaDisplay 组件 */

/* 历史记录区域 */
.history-section {
  height: 100%;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 5px;
  overflow: hidden;
}

/* 底部输入区域 */
.bottom-input-area {
  background: var(--el-bg-color-overlay);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

/* 设置选项栏 */
.settings-bar {
  margin-bottom: 16px;
  max-height: 120px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 16px;
}

.settings-scroll {
  height: 100%;
}

.settings-content {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-direction: row;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  flex-wrap: wrap;
  min-width: 120px;
}

.setting-label {
  font-size: 12px;
  color: var(--el-text-color-primary);
  min-width: 40px;
  white-space: nowrap;
  font-weight: 500;
}

.compact-select {
  min-width: 120px;
}

.compact-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ratio-button {
  margin: 0 !important;
}

.ratio-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ratio-visual {
  width: 12px;
  height: 12px;
  background: rgba(64, 158, 255, 0.3);
  border: 1px solid #409eff;
  border-radius: 2px;
  display: inline-block;
}

.ratio-text {
  font-size: 11px;
}

.compact-number {
  width: 80px;
}

.model-option,
.style-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-icon,
.style-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

/* 输入容器 */
.input-container {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 16px;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.main-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-input,
.negative-prompt-input {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.prompt-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
}

.prompt-input :deep(.el-textarea__inner:focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.negative-prompt-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.input-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }

  .settings-content {
    flex-direction: column;
    align-items: stretch;
  }

  .setting-item {
    min-width: auto;
    justify-content: space-between;
  }

  .input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .input-tools,
  .input-actions {
    flex-direction: row;
    justify-content: center;
  }

  .media-grid {
    grid-template-columns: 1fr;
  }
}

/* 动画效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
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

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-regular);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  min-width: auto;
  white-space: nowrap;
}

.action-btn:hover {
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--el-box-shadow-light);
}

.action-btn .btn-text {
  font-size: 12px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.generate-btn {
  background: var(--el-color-primary);
  border: none;
  color: var(--el-color-white);
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--el-box-shadow);
  background: var(--el-color-primary-light-3);
}

.stop-btn {
  background: var(--el-color-danger);
  border: none;
  color: var(--el-color-white);
  transition: all 0.3s ease;
}

.stop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--el-box-shadow);
  background: var(--el-color-danger-light-3);
}

/* 下拉菜单样式 */
:deep(.model-dropdown),
:deep(.size-dropdown),
:deep(.style-dropdown) {
  .el-dropdown-menu {
    border-radius: var(--el-border-radius-base);
    box-shadow: var(--el-box-shadow-dark);
    border: 1px solid var(--el-border-color-lighter);
    backdrop-filter: blur(20px);
    background: var(--el-bg-color-overlay);
  }

  .el-dropdown-menu__item {
    padding: 12px 16px;
    border-radius: var(--el-border-radius-small);
    margin: 4px 8px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    &.is-active {
      background: var(--el-color-primary);
      color: var(--el-color-white);
    }
  }
}

.model-item,
.size-item {
  .model-name,
  .size-name {
    font-weight: 500;
    font-size: var(--el-font-size-base);
    margin-bottom: 2px;
    color: var(--el-text-color-primary);
  }

  .model-desc,
  .size-desc {
    font-size: var(--el-font-size-small);
    color: var(--el-text-color-regular);
  }
}

.style-item {
  display: flex;
  align-items: center;
  gap: 12px;

  .style-name {
    font-weight: 500;
    font-size: var(--el-font-size-base);
    flex: 1;
    color: var(--el-text-color-primary);
  }

  .style-preview {
    width: 32px;
    height: 32px;
    border-radius: var(--el-border-radius-small);
    background-size: cover;
    background-position: center;
    border: 2px solid var(--el-border-color-light);
    box-shadow: var(--el-box-shadow-light);
  }
}

/* 反向提示词区域样式 */
.negative-prompt-section {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-color-danger-light-9);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-color-danger-light-8);
}

.negative-prompt-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: var(--el-font-size-small);
  color: var(--el-color-danger);
  font-weight: 500;
}

/* EditorSender 风格标签样式 */
:deep(.editor-sender) {
  .select-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: var(--el-border-radius-small);
    color: var(--el-color-primary);
    font-size: var(--el-font-size-small);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-6);
    }
  }

  .select-dialog {
    .style-option-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: var(--el-border-radius-base);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--el-fill-color-light);
      }

      .style-preview-img {
        width: 40px;
        height: 40px;
        border-radius: var(--el-border-radius-small);
        object-fit: cover;
        border: 1px solid var(--el-border-color-light);
      }

      .style-name {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }
  }
}

.input-prefix {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;

  .model-config-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--el-border-radius-small);
    background: var(--el-color-info-light-9);
    border: 1px solid var(--el-color-info-light-7);
    color: var(--el-color-info);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;

    &:hover {
      background: var(--el-color-info-light-8);
      border-color: var(--el-color-info-light-6);
      color: var(--el-color-info-dark-2);
    }

    &.active {
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
      color: var(--el-text-color-primary);
    }
  }
}
</style>
