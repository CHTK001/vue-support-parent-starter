<template>
  <div class="ai-generator-layout system-container modern-bg">
    <!-- 对话框组件 -->
    <ModuleUpdateDialog
      ref="moduleUpdateDialogRef"
      @success="handleRefreshEnvironment"
    ></ModuleUpdateDialog>
    <ModuleDialog
      ref="moduleDialogRef"
      @success="handleRefreshEnvironment"
      @handleRefreshEnvironmentTemplate="handleRefreshEnvironmentTemplate"
    ></ModuleDialog>

    <div class="chat-like-header">
      <ScButton
        circle
        type="default"
        class="chat-like-header__back"
        @click="handleBackPage"
      >
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">AI 图像生成</span>
        <span class="chat-like-header__subtitle">支持模型、风格与分辨率快速切换</span>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 历史记录区域（包含新生成的内容） -->
      <div class="history-section">
        <HistoryLayout
          ref="historyLayoutRef"
          :form="form"
          :full="true"
          :env="env"
          :new-generated-data="generatedResults"
          @redrawer="handleReDraw"
        ></HistoryLayout>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="bottom-input-area">
      <!-- 设置选项栏 -->
      <div class="settings-bar" v-if="showSettings">
        <ScScrollbar class="settings-scroll">
          <div class="settings-content">
            <!-- 模型选择 -->
            <div class="setting-item">
              <label class="setting-label">模型</label>
              <ScSelect
                v-model="form.model"
                :options="modelOptions"
                layout="list"
                :list-borde="true"
                :list-select-button="true"
                list-select-icon="ri:cpu-line"
                :list-select-show-value="true"
                list-height="430px"
                :list-show-search="false"
                :list-show-batch-actions="false"
                @change="handleModelSelect"
                class="model-select-list-sc"
              </ScSelect>
            </div>

            <!-- 分辨率 / 比例（按截图样式） -->
            <div class="setting-item setting-item--ratio">
              <label class="setting-label">比例</label>
              <div class="ratio-panel">
                <div class="ratio-grid">
                  <button
                    v-for="item in ratioCandidates"
                    :key="item.key"
                    class="ratio-grid__item"
                    :class="{ 'is-active': item.size === form.parameters.size }"
                    type="button"
                    @click="handleSelectSize(item.size)"
                  >
                    <span
                      class="ratio-grid__box"
                      :style="{ aspectRatio: item.ratio }"
                    />
                    <span class="ratio-grid__label">{{ item.label }}</span>
                  </button>

                  <button
                    class="ratio-grid__item"
                    type="button"
                    @click="handleOpenFreeRatio"
                  >
                    <span class="ratio-grid__box ratio-grid__box--free">
                      <IconifyIconOnline icon="ri:fullscreen-line" />
                    </span>
                    <span class="ratio-grid__label">自由</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 风格选择 -->
            <div
              class="setting-item"
              v-if="form.sysAiModuleType == 'VINCENT' && styleData.length > 0"
            >
              <label class="setting-label">风格</label>
              <ScSelect
                v-model="form.parameters.style"
                placeholder="选择风格"
                size="small"
                class="compact-select"
              >
                <ScOption
                  v-for="item in styleData"
                  :key="item.sysAiVincentStyleCode"
                  :label="item.sysAiVincentStyleName"
                  :value="item.sysAiVincentStyleCode"
                >
                  <div class="style-option">
                    <ScImage
                      :src="item.sysAiVincentStyleImage"
                      class="style-icon"
                    />
                    <span>{{ item.sysAiVincentStyleName }}</span>
                  </div>
                </ScOption>
              </ScSelect>
            </div>

            <!-- 输出数量 -->
            <div class="setting-item">
              <label class="setting-label">数量</label>
              <ScInputNumber
                v-model="form.parameters.number"
                :min="1"
                :max="formSetting.sysAiVincentSupportedNumber || 4"
                size="small"
                class="compact-number"
                controls-position="right"
              />
            </div>

            <!-- 质量选择（视频模式） -->
            <div
              class="setting-item"
              v-if="
                form.sysAiModuleType == 'VIDEO' &&
                formSetting.sysAiVincentSupportedQuality
              "
            >
              <label class="setting-label">质量</label>
              <ScRadioGroup
                v-model="form.parameters.quality"
                size="small"
                class="compact-radio-group"
              >
                <el-radio-button
                  v-for="item in formSetting.sysAiVincentSupportedQuality?.split(
                    ',',
                  ) || []"
                  :key="item"
                  :value="item"
                >
                  {{ getQuality(item)?.name || item }}
                </el-radio-button>
              </ScRadioGroup>
            </div>

            <!-- 帧率选择（视频模式） -->
            <div
              class="setting-item"
              v-if="
                form.sysAiModuleType == 'VIDEO' &&
                formSetting.sysAiVincentSupportedFps
              "
            >
              <label class="setting-label">帧率</label>
              <ScSelect
                v-model="form.parameters.fps"
                placeholder="选择帧率"
                size="small"
                class="compact-select"
              >
                <ScOption
                  v-for="fps in formSetting.sysAiVincentSupportedFps?.split(
                    ',',
                  ) || []"
                  :key="fps"
                  :label="fps + ' FPS'"
                  :value="fps"
                />
              </ScSelect>
            </div>

            <!-- AI音效（视频模式） -->
            <div
              class="setting-item"
              v-if="
                form.sysAiModuleType == 'VIDEO' &&
                formSetting.sysAiVincentSupportAudio
              "
            >
              <label class="setting-label">音效</label>
              <ScSwitch
                v-model="form.parameters.withAudio"
                :active-value="1"
                :inactive-value="0"
                active-text="开启"
                inactive-text="关闭"
                size="small"
              />
            </div>
          </div>
        </ScScrollbar>
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
                    <ScButton
                      circle
                      @click="toggleAdvanced"
                      :type="showAdvanced ? 'primary' : 'default'"
                    >
                      <IconifyIconOnline icon="mdi:tune-variant" />
                    </ScButton>
                  </ScTooltip>

                  <el-popover
                    v-if="numberOptions.length > 0"
                    v-model:visible="showNumberPopover"
                    placement="top"
                    trigger="click"
                    popper-class="ai-number-popper"
                  >
                    <template #reference>
                      <div class="number-popover-trigger-wrap">
                        <ScButton
                          circle
                          type="default"
                          class="number-popover-trigger"
                          title="张数"
                        >
                          <IconifyIconOnline icon="ri:hashtag" />
                        </ScButton>
                        <el-text tag="span" class="number-popover-trigger-value">
                          {{ currentNumberLabel }}
                        </el-text>
                      </div>
                    </template>
                    <div class="ai-number-panel">
                      <button
                        v-for="item in numberOptions"
                        :key="item.value"
                        type="button"
                        class="ai-number-panel__item"
                        :class="{ 'is-active': item.value === form.parameters.number }"
                        @click="handleSelectNumberAndClose(item.value)"
                      >
                        <span class="ai-number-panel__meta">
                          <el-text tag="span" class="ai-number-panel__name">
                            {{ item.label }}
                          </el-text>
                          <el-text tag="span" class="ai-number-panel__desc">
                            {{ item.description }}
                          </el-text>
                        </span>
                        <span
                          v-if="item.value === form.parameters.number"
                          class="ai-number-panel__check"
                          aria-hidden="true"
                        >
                          <IconifyIconOnline icon="ri:check-line" />
                        </span>
                      </button>
                    </div>
                  </el-popover>

                  <div v-if="sizeOptions.length > 0" class="size-popover-trigger-wrap">
                    <ScSelect
                      v-model="form.parameters.size"
                      class="size-select-list-sc size-popover-trigger"
                      :options="sizeOptions"
                      layout="list"
                      :list-borde="true"
                      :list-select-button="true"
                      list-select-icon="ri:aspect-ratio-line"
                      :list-select-show-value="true"
                      list-height="360px"
                      :list-show-search="false"
                      :list-show-batch-actions="false"
                      @change="handleSizeSelect"
                    >
                      <template #icon="{ option }">
                        <span class="ratio-svg-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect
                              x="2"
                              y="2"
                              width="20"
                              height="20"
                              rx="4"
                              ry="4"
                              class="ratio-svg-icon__frame"
                            />
                            <rect
                              :x="getRatioSvgShape(option.label).x"
                              :y="getRatioSvgShape(option.label).y"
                              :width="getRatioSvgShape(option.label).width"
                              :height="getRatioSvgShape(option.label).height"
                              rx="2"
                              ry="2"
                              class="ratio-svg-icon__shape"
                            />
                          </svg>
                        </span>
                      </template>
                    </ScSelect>
                  </div>

                  <ScTooltip content="随机描述词" placement="top">
                    <ScButton circle @click="handleRandomPrompt" type="default">
                      <IconifyIconOnline icon="ep:refresh" />
                    </ScButton>
                  </ScTooltip>

                </div>
              </template>

              <!-- 自定义操作列表 -->
              <template #action-list>
                <div class="action-buttons">
                  <!-- 分辨率选择（按截图样式：宫格弹层） -->
                  <!-- 分辨率入口已移到输入框前缀图标 -->

                  <ScSelect
                    v-if="canUseStyle"
                    v-model="form.parameters.style"
                    class="style-select-list-item-sc"
                    :options="styleOptions"
                    layout="list-item"
                    :list-borde="true"
                    :list-select-button="true"
                    list-select-icon="ri:palette-line"
                    :list-select-show-value="true"
                    list-height="360px"
                    :list-show-search="false"
                    :list-show-batch-actions="false"
                    @change="handleStyleSelect"
                  />

                  <!-- 模型选择按钮 -->
                  <ScSelect
                    v-model="form.model"
                    class="model-select-list-sc"
                    :options="modelOptions"
                    layout="list"
                    :list-borde="true"
                    :list-select-button="true"
                    list-select-icon="ri:cpu-line"
                    :list-select-show-value="true"
                    list-height="430px"
                    :list-show-search="false"
                    :list-show-batch-actions="false"
                    @change="handleModelSelect"
                  />

                  <!-- 生成/停止按钮 -->
                  <ScButton
                    v-if="loadingConfig.export"
                    circle
                    @click="stopGeneration"
                    class="stop-btn"
                  >
                    <IconifyIconOnline icon="ri:stop-circle-line" />
                  </ScButton>
                  <ScButton
                    v-else
                    circle
                    @click="handleGenerate"
                    :disabled="!canGenerate"
                    class="generate-btn"
                    type="primary"
                  >
                    <IconifyIconOnline icon="ri:magic-line" />
                  </ScButton>
                </div>
              </template>

              <!-- 自定义底部 - 反向提示词 -->
              <template
                #footer
                v-if="form.sysAiModuleType == 'VINCENT' && showAdvanced"
              >
                <div class="negative-prompt-section">
                  <div class="negative-prompt-label">
                    <IconifyIconOnline icon="ri:subtract-line" />
                    <span>反向提示词</span>
                  </div>
                  <ScInput
                    v-model="form.input.negativePrompt"
                    type="textarea"
                    :rows="1"
                    placeholder="不希望出现的内容..."
                    class="negative-prompt-input"
                  ></ScInput>
                </div>
              </template>
            </EditorSender>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { useUserStoreHook } from "@repo/core";
import {
  clearObject,
  getRandomInt,
  localStorageProxy,
  message,
} from "@repo/utils";

import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  reactive,
  ref,
  shallowRef,
} from "vue";
import { ElPopover } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import {
  fetchGetTaskForVincent,
  fetchSaveTaskForVincent,
} from "../../../api/ai/text-generations";
import { fetchGetForModelSetting } from "../../../api/ai/vincent-setting";
import { fetchListForModelStyle } from "../../../api/ai/vincent-style";
import { fetchListForModelTemplate } from "../../../api/ai/vincent-template";
import { fetchListProjectForAiModule } from "../../../api/manage/project-ai-module";
import { RANDOM_DATA } from "./hook";

const parseSize = (value: unknown) => {
  const raw = String(value || "").trim();
  const match = raw.match(/(\d+)\s*[*xX]\s*(\d+)/);
  if (!match) return null;
  return { w: Number(match[1]), h: Number(match[2]) };
};

const gcd = (a: number, b: number) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
};

const toRatioLabel = (w: number, h: number) => {
  const d = gcd(w, h);
  const rw = Math.max(1, Math.round(w / d));
  const rh = Math.max(1, Math.round(h / d));
  const key = `${rw}:${rh}`;
  const friendly = new Set(["1:1", "16:9", "9:16", "4:3", "3:4"]);
  return friendly.has(key) ? key : `${rw}:${rh}`;
};

const supportedSizes = computed(() => {
  return (
    formSetting.sysAiVincentSupportedSize
      ?.split(",")
      .map((it) => it.trim())
      .filter(Boolean) || []
  );
});

const ratioCandidates = computed(() => {
  const sizes = supportedSizes.value;
  const byLabel = new Map<
    string,
    { key: string; label: string; ratio: string; size: string }
  >();

  for (const s of sizes) {
    const p = parseSize(s);
    if (!p) continue;
    const label = toRatioLabel(p.w, p.h);
    const ratio = `${p.w}/${p.h}`;
    // 同一比例：优先保留像素更大的尺寸
    const existing = byLabel.get(label);
    if (!existing) {
      byLabel.set(label, { key: `${label}:${s}`, label, ratio, size: s });
      continue;
    }
    const cur = parseSize(existing.size);
    const curPx = cur ? cur.w * cur.h : 0;
    const nextPx = p.w * p.h;
    if (nextPx >= curPx) {
      byLabel.set(label, { key: `${label}:${s}`, label, ratio, size: s });
    }
  }

  return [...byLabel.values()]
    .sort((a, b) => a.label.localeCompare(b.label));
});

const handleSelectSize = (size: string) => {
  if (!size) return;
  form.parameters.size = size;
};

const handleOpenFreeRatio = () => {
  // 兜底：自由先切到支持列表里第一个未被当前宫格覆盖的尺寸
  const currentKeys = new Set(ratioCandidates.value.map((it) => it.size));
  const next = supportedSizes.value.find((s) => !currentKeys.has(s)) || supportedSizes.value[0];
  if (next) {
    handleSelectSize(next);
  }
};

const showNumberPopover = ref(false);

const handleSelectNumberAndClose = (value: number) => {
  handleNumberSelect(value);
  showNumberPopover.value = false;
};





const currentNumberLabel = computed(() => {
  const num = Number(form.parameters.number || 1);
  return `${num}张`;
});

const getRatioSvgShape = (ratioLabel: string) => {
  const fallback = { x: 6, y: 6, width: 12, height: 12 };
  const parts = String(ratioLabel || "1/1")
    .split("/")
    .map((item) => Number(item));
  const ratioW = Number.isFinite(parts[0]) && parts[0] > 0 ? parts[0] : 1;
  const ratioH = Number.isFinite(parts[1]) && parts[1] > 0 ? parts[1] : 1;

  const maxEdge = 13;
  const width = Math.max(6, Math.round((maxEdge * ratioW) / Math.max(ratioW, ratioH)));
  const height = Math.max(6, Math.round((maxEdge * ratioH) / Math.max(ratioW, ratioH)));

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return fallback;
  }

  return {
    x: Math.round((24 - width) / 2),
    y: Math.round((24 - height) / 2),
    width,
    height
  };
};

const createRatioSvgIconData = (ratioLabel: string) => {
  const shape = getRatioSvgShape(ratioLabel);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="4" ry="4" fill="rgba(148,163,184,0.14)" stroke="rgba(148,163,184,0.45)" stroke-width="1.2"/>
    <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="2" ry="2" fill="rgba(64,158,255,0.25)" stroke="rgba(64,158,255,1)" stroke-width="1.2"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const HistoryLayout = defineAsyncComponent(
  () => import("./module/HistoryLayout.vue"),
);
const ModuleUpdateDialog = defineAsyncComponent(
  () => import("./module/ModuleUpdateDialog.vue"),
);
const ModuleDialog = defineAsyncComponent(
  () => import("./module/ModuleDialog.vue"),
);
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
  model: "",
  tokens: 2048,
  topK: 4,
  temperature: 0.5,
  sysProjectId: null,
  sysProjectName: "",
  sysAiModuleId: null,
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
  temperature: [
    { required: true, message: "请输入temperature", trigger: "change" },
  ],
  "parameters.size": [
    { required: true, message: "请输入比例", trigger: "change" },
  ],
  "parameters.style": [
    { required: true, message: "请输入风格", trigger: "change" },
  ],
  "parameters.number": [
    { required: true, message: "请输入输出图片张数", trigger: "change" },
  ],
};
const route = useRoute();
const router = useRouter();

const handleBackPage = () => {
  router.push("/ai/home");
};

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

const syncPromptEditorText = (text) => {
  const nextText = typeof text === "string" ? text : "";
  currentMessage.value = nextText;
  form.input.prompt = nextText;
  nextTick(() => {
    if (editorSenderRef.value?.setText) {
      editorSenderRef.value.clear?.();
      editorSenderRef.value.setText(nextText);
      return;
    }
    const editor = document.querySelector(
      ".bottom-input-area .chat-rich-text[contenteditable='true']",
    );
    if (!editor) {
      return;
    }
    editor.innerHTML = "";
    editor.textContent = nextText;
    editor.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: nextText,
        inputType: "insertText",
      }),
    );
  });
};

const handleRandomPrompt = async () => {
  // 获取随机描述词
  await handleRefreshRandom();
  syncPromptEditorText(randomPrompt.value);
};

const handleGenerate = async () => {
  readEditorText();
  // 同步EditorSender的内容到form.input.prompt
  if (currentMessage.value.trim()) {
    form.input.prompt = currentMessage.value.trim();
  }
  // 处理生成请求
  await handleExport();
};

// EditorSender 相关方法
const readEditorText = () => {
  if (editorSenderRef.value?.getCurrentValue) {
    const result = editorSenderRef.value.getCurrentValue();
    if (result && typeof result.text === "string" && result.text.trim()) {
      currentMessage.value = result.text;
      form.input.prompt = result.text;
      return result.text;
    }
  }
  const editor = document.querySelector(
    ".bottom-input-area .chat-rich-text[contenteditable='true']",
  );
  const text = (editor?.innerText || "").replace(/\uFEFF/g, "").trim();
  if (text) {
    currentMessage.value = text;
    form.input.prompt = text;
    return text;
  }
  const fallback = (currentMessage.value || form.input.prompt || "").trim();
  currentMessage.value = fallback;
  form.input.prompt = fallback;
  return fallback;
};

const handleCurrentChangeValue = async () => {
  if (editorSenderRef.value) {
    readEditorText();
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
    const selectedStyle = styleData.value.find(
      (style) => style.sysAiVincentStyleCode === tagData.selectedId,
    );
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
    const editorElement =
      editorSenderRef.value.$el?.querySelector(".editor-content");
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
    label: getRatio(size),
    description: size,
    icon: createRatioSvgIconData(getRatio(size)),
  }));
});

const styleOptions = computed(() => {
  const options = styleData.value.map((style) => ({
    value: style.sysAiVincentStyleCode,
    label: style.sysAiVincentStyleName,
    icon: style.sysAiVincentStyleImage || "ri:palette-line",
    preview: style.sysAiVincentStyleImage,
    description: `${style.sysAiVincentStyleName}风格`,
  }));
  return [
    {
      value: "<auto>",
      label: "无",
      icon: "ri:close-circle-line",
      description: "不使用风格"
    },
    ...options
  ];
});

const canUseStyle = computed(() => {
  return form.sysAiModuleType === "VINCENT" && styleOptions.value.length > 0;
});

const canUseRefImage = computed(() => {
  return Number(formSetting.sysAiVincentSupportRefImage || 0) === 1;
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
  const maxNumber = Math.max(1, Number(formSetting.sysAiVincentSupportedNumber || 1));
  const options: Array<{ value: number; label: string; description: string }> = [];
  for (let i = 1; i <= maxNumber; i++) {
    options.push({
      value: i,
      label: `${i}张`,
      description: i === 1 ? "单张生成" : `生成${i}张图片`,
    });
  }
  return options;
});

const applySettingDefaults = () => {
  const supportedSizes =
    formSetting.sysAiVincentSupportedSize?.split(",").map((it) => it.trim()).filter(Boolean) || [];
  if (supportedSizes.length > 0) {
    if (!form.parameters.size || !supportedSizes.includes(form.parameters.size)) {
      form.parameters.size = supportedSizes[0];
    }
  } else {
    form.parameters.size = "";
  }

  const maxNumber = Number(formSetting.sysAiVincentSupportedNumber || 1);
  if (!form.parameters.number || form.parameters.number < 1) {
    form.parameters.number = 1;
  }
  if (form.parameters.number > maxNumber) {
    form.parameters.number = maxNumber;
  }
};

const modelOptions = computed(() => {
  return modelList.value.map((model) => ({
    value: model.sysAiModuleCode,
    label: model.sysAiModuleName,
    description: (model.sysAiModuleRemark && String(model.sysAiModuleRemark).trim()) ? String(model.sysAiModuleRemark).trim() : "暂无说明",
    icon: model.sysProjectIcon,
    preview: model.sysProjectIcon,
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

const handleGenerateSeed = () => {
  // 生成新的随机种子
  form.parameters.seed = Math.floor(Math.random() * 1000000);
  message.success(`已生成新的随机种子: ${form.parameters.seed}`);
};

// 历史记录相关方法已移除，现在HistoryLayout始终显示

const modelSelectStyle = computed(() => {
  return styleData.value.find(
    (it) => it.sysAiVincentStyleCode === form.parameters.style,
  )?.sysAiVincentStyleImage;
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

/**
 * 获取随机提示词
 */
const handleRefreshRandom = async () => {
  randomPrompt.value = RANDOM_DATA[getRandomInt(0, RANDOM_DATA.length - 1)];
};
const showRoleSetting = computed(() => {
  const item = modelList.value.filter(
    (it) => (it.sysAiModuleCode = form.model),
  );
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
  const _requestId = localStorageProxy().getItem(
    "vincent-request-id:" + getKey(),
  );
  return _requestId;
};

const handleReDraw = async (value, type) => {
  if ("model" == type) {
    form.model = value;
    handleChangeModule(value);
    return;
  }
  syncPromptEditorText(value);
};
const loadedRequestId = async (row) => {
  localStorageProxy().setItem(
    "vincent-request-id:" + getKey(),
    row.data?.output?.taskId,
  );
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
const latestSubmittedPrompt = ref("");
const initialImageIndex = async () => {
  // 创建占位符数据
  const placeholders = [];
  const promptText = (latestSubmittedPrompt.value || form.input?.prompt || currentMessage.value || "").trim();
  for (let index = 0; index < form.parameters.number; index++) {
    process[index] = 10;
    placeholders.push({
      id: `placeholder_${Date.now()}_${index}`,
      type: form.sysAiModuleType === "VIDEO" ? "video" : "image",
      url: null, // 占位符没有实际URL
      prompt: promptText,
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
    const promptText = (latestSubmittedPrompt.value || form.input?.prompt || currentMessage.value || "").trim();
    const newResults = images.map((url, index) => ({
      id: Date.now() + index,
      type: form.sysAiModuleType === "VIDEO" ? "video" : "image",
      url: url,
      prompt: promptText,
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
  const pollTask = () => {
    fetchGetTaskForVincent({
      taskId: requestId(),
      sysProjectId: form.sysProjectId,
      sysAiModuleType: form.sysAiModuleType,
      model: form.model,
    })
      .then((res) => {
        const _status =
          res.data?.output?.taskStatus || res.data?.output?.task_status;
        if (_status === "SUCCESS") {
          clearTask();
          updateImage(res.data?.output?.results?.map((it) => it.url));
          updateImageIndex(true, 100);
        } else if (_status === "FAILURE") {
          loadingConfig.export = false;
          clearTask();
          updateImage([]);
          historyLayoutRef.value?.updateData?.();
          message("生成失败!", { type: "error" });
        } else {
          updateImageIndex(false, res.data.progress);
        }
      })
      .catch((e) => {
        loadingConfig.export = false;
        clearTask();
        updateImage([]);
      });
  };
  pollTask();
  intervalId = setInterval(pollTask, 2000);
};
const handleExport = async () => {
  // 如果没有formRef，直接执行生成逻辑
  const executeGeneration = async () => {
    loadingConfig.export = true;
    const requestPayload = JSON.parse(JSON.stringify(form));
    latestSubmittedPrompt.value = String(requestPayload?.input?.prompt || "").trim();
    initialImageIndex();
    handleClearInput();

    try {
      const res = await fetchSaveTaskForVincent(requestPayload);
      const immediateImages = res.data?.output?.images || [];
      const immediateResults = res.data?.output?.results || [];

      if (res.data?.output?.taskStatus === "FAILURE") {
        loadingConfig.export = false;
        clearTask();
        updateImage([]);
        message("创建任务失败!", { type: "error" });
        return;
      }

      if (Array.isArray(immediateImages) && immediateImages.length > 0) {
        clearTask();
        updateImage(immediateImages);
        updateImageIndex(true, 100);
        return;
      }

      if (Array.isArray(immediateResults) && immediateResults.length > 0) {
        clearTask();
        updateImage(immediateResults.map((it) => it.url));
        updateImageIndex(true, 100);
        return;
      }

      loadedRequestId(res);
      createInterval();
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
  if (!_item) {
    return;
  }
  env.sysProjectId = _item.sysProjectId;
  env.sysProjectName = _item.sysProjectName;
  env.sysAiModuleId = _item.sysAiModuleId;
  form.sysProjectId = _item.sysProjectId;
  form.sysAiModuleId = _item.sysAiModuleId;
  form.sysProjectName = _item.sysProjectName;
  form.model = value;
  await loadConfig(_item, value);
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
    const selected = modelList.value.find(
      (it) => it.sysAiModuleCode === _selectedModel,
    );
    if (selected) {
      await handleChangeModule(_selectedModel);
      loadInterval();
      return;
    }
    localStorageProxy().removeItem(props.selectedItemLabel);
  }
  if (modelList.value.length > 0) {
    const first = modelList.value[0];
    await handleChangeModule(first.sysAiModuleCode);
    loadInterval();
  }
};

const loadConfig = async (row, sysAiModuleCode) => {
  clearObject(formSetting);
  Object.assign(formSetting, row?.vincentSetting || {});
  try {
    const { data } = await fetchGetForModelSetting({
      sysAiModuleId: row?.sysAiModuleId,
    });
    Object.assign(formSetting, data || {});
  } catch (error) {
    console.error("加载模型配置失败:", error);
  }
  localStorageProxy().setItem(props.selectedItemLabel, sysAiModuleCode);
  applySettingDefaults();
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
    if (styleData.value.length > 0) {
      const currentExists = styleData.value.some(
        (it) => it.sysAiVincentStyleCode === form.parameters.style,
      );
      if (!currentExists) {
        form.parameters.style = styleData.value[0]?.sysAiVincentStyleCode || "";
      }
    } else {
      form.parameters.style = "";
    }
  } catch (error) {}
  loadingConfig.loading = false;
};
onMounted(async () => {
  onAfterProperieSet();
  await initialModuleList();
  if (!form.model) {
    setTimeout(() => {
      initialModuleList();
    }, 600);
  }
  syncPromptEditorText(form.input.prompt || currentMessage.value);
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

.chat-like-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
  margin-bottom: 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(8px);
}

.chat-like-header__back {
  flex-shrink: 0;
}

.chat-like-header__title-wrap {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.chat-like-header__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.chat-like-header__subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.setting-item--ratio {
  align-items: flex-start;
}

.ratio-panel {
  display: grid;
  gap: 10px;
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(6, 56px);
  gap: 10px;
}

/* 分辨率弹层（截图样式） */
:deep(.ai-size-popper) {
  width: max-content;
  max-width: min(90vw, 420px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 24, 29, 0.92);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.92);
}

.ai-size-panel {
  display: grid;
  gap: 10px;
  padding: 6px 4px;
  width: fit-content;
  max-width: 100%;
}

.ai-size-panel__footer {
  margin-top: 4px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.88);
  display: grid;
  gap: 2px;
  justify-items: start;
  width: fit-content;
}

.ai-size-panel__grid {
  display: grid;
  grid-template-columns: max-content;
  justify-content: start;
  gap: 12px;
  height: auto;
  justify-items: start;
  width: max-content;
}

.ai-size-panel__ratio {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0 2px;
  width: max-content;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 8px;
  min-height: 56px;
  cursor: pointer;
  color: rgba(31, 41, 55, 0.92);
}

.ai-size-panel__ratio-box {
  border-radius: 4px;
  border: 2px solid rgba(71, 85, 105, 0.78);
  background: rgba(148, 163, 184, 0.12);
  display: inline-block;
  box-sizing: border-box;
  flex-shrink: 0;
}

.ai-size-panel__ratio-label {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: 0.01em;
}

.ai-size-panel__ratio-size {
  font-size: 10px;
  opacity: 0.72;
}

.ai-size-panel__ratio.is-active .ai-size-panel__ratio-box {
  border-color: var(--el-color-primary);
  background: rgba(64, 158, 255, 0.18);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.ai-size-panel__ratio.is-active .ai-size-panel__ratio-label {
  color: var(--el-color-primary);
}

.size-popover-trigger {
  opacity: 0.95;
  position: relative;
  overflow: visible;
}

.number-popover-trigger {
  opacity: 0.95;
}

.number-popover-trigger-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: auto;
  height: 32px;
  padding-right: 34px;
  overflow: visible;
  order: 98;
}

.number-popover-trigger-value {
  position: absolute;
  top: 50%;
  left: calc(100% - 28px);
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  pointer-events: none;
}


.size-popover-trigger-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: auto;
  height: 32px;
  padding-right: 36px;
  overflow: visible;
  order: 99;
}

.size-popover-trigger-icon {
  width: 16px;
  border-radius: 3px;
  border: 2px solid rgba(71, 85, 105, 0.88);
  background: rgba(148, 163, 184, 0.16);
  display: inline-block;
  box-sizing: border-box;
}

.ratio-svg-icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
}

.ratio-svg-icon svg {
  width: 18px;
  height: 18px;
  display: block;
}

.ratio-svg-icon__frame {
  fill: rgba(148, 163, 184, 0.14);
  stroke: rgba(148, 163, 184, 0.45);
  stroke-width: 1.2;
}

.ratio-svg-icon__shape {
  fill: rgba(var(--el-color-primary-rgb), 0.25);
  stroke: var(--el-color-primary);
  stroke-width: 1.2;
}

.size-popover-trigger-value {
  position: absolute;
  top: 50%;
  left: calc(100% - 30px);
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  pointer-events: none;
}

:deep(.ai-style-popper) {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(22, 24, 29, 0.94);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.26);
}

:deep(.ai-number-popper) {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(22, 24, 29, 0.94);
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.26);
  width: 200px;
  max-width: min(90vw, 220px);
  box-sizing: border-box;
  overflow: hidden;
}

.ai-number-panel {
  display: grid;
  gap: 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.ai-number-panel__item {
  appearance: none;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  padding: 8px 10px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.ai-number-panel__item.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.18);
  background: rgba(64, 158, 255, 0.14);
}

.ai-number-panel__name {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.ai-number-panel__meta {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.ai-number-panel__desc {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.ai-number-panel__check {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--el-color-primary-rgb), 0.2);
  color: var(--el-color-primary);
  font-size: 12px;
}

:deep(.ai-number-popper .el-popper__arrow) {
  display: none;
}

.style-popover-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  max-width: 136px;
}

.style-popover-trigger span {
  max-width: 86px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-style-panel {
  display: grid;
  gap: 8px;
  max-height: 280px;
  overflow: auto;
  padding-right: 2px;
}

.ai-style-panel__item {
  appearance: none;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.08);
  padding: 8px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  cursor: pointer;
  text-align: left;
}

.ai-style-panel__item.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.18);
}

.ai-style-panel__thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}

.ai-style-panel__thumb--empty {
  background: rgba(148, 163, 184, 0.2);
}

.ai-style-panel__meta {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.ai-style-panel__name {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-style-panel__desc {
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ratio-grid__item {
  appearance: none;
  border: 0;
  padding: 0;
  background: transparent;
  display: grid;
  justify-items: center;
  gap: 6px;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.75);
}

.ratio-grid__box {
  width: 18px;
  border-radius: 4px;
  border: 2px solid rgba(15, 23, 42, 0.55);
  background: transparent;
}

.ratio-grid__box--free {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(15, 23, 42, 0.55);
  color: rgba(15, 23, 42, 0.7);
}

.ratio-grid__label {
  font-size: 11px;
}

.ratio-grid__item.is-active .ratio-grid__box,
.ratio-grid__item.is-active .ratio-grid__box--free {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

@media (max-width: 960px) {
  .ratio-grid {
    grid-template-columns: repeat(6, 52px);
  }
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

.model-select-list-sc {
  width: 218px;
}

.size-select-list-sc {
  width: auto;
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
  overflow: visible;

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
