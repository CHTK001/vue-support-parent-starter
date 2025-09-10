<script setup>
import { computed, defineExpose, onMounted, shallowRef } from "vue";
import { fetchHistoryTaskForVincent } from "../../../../api/ai/text-generations";
import MediaDisplay from "./MediaDisplay.vue";

const emit = defineEmits(["redrawer"]);
const props = defineProps({
  form: {
    type: Object,
    default: () => {},
  },
  env: {
    type: Object,
    default: () => {},
  },
  full: {
    type: Boolean,
    default: false,
  },
  newGeneratedData: {
    type: Array,
    default: () => [],
  },
});

const historyData = shallowRef([]);

/**
 * 合并新生成的数据和历史数据，最新数据在最上方
 */
const displayData = computed(() => {
  const allData = [...historyData.value];

  // 如果有新生成的数据，添加到最前面
  if (props.newGeneratedData && props.newGeneratedData.length > 0) {
    const newItem = {
      id: `new_generated_${Date.now()}`,
      config: {
        input: {
          prompt: props.form.input?.prompt || "新生成的内容",
        },
        model: props.form.model,
        parameters: {
          size: props.form.parameters?.size,
          style: props.form.parameters?.style,
          number: props.form.parameters?.number,
          quality: props.form.parameters?.quality,
          fps: props.form.parameters?.fps,
        },
      },
      sysAiVincentTaskUrls: props.newGeneratedData.map((item) => item.url).filter((url) => url !== null),
      sysAiVincentTaskLocalUrls: props.newGeneratedData.map((item) => item.url).filter((url) => url !== null),
      // 添加占位符和进度信息
      isGenerating: props.newGeneratedData.some((item) => item.isPlaceholder),
      placeholderData: props.newGeneratedData.filter((item) => item.isPlaceholder),
      generatedData: props.newGeneratedData.filter((item) => !item.isPlaceholder),
    };
    allData.unshift(newItem); // 添加到数组开头
  }

  return allData;
});
/**
 * 加载历史数据(前十张)
 * @return {*}
 */
const loadHistoryData = async () => {
  fetchHistoryTaskForVincent({ sysAiVincentTaskType: props.env.category }).then(({ data }) => {
    historyData.value = data.map((it, index) => {
      return {
        ...it,
        id: it.id || `history_${index}_${Date.now()}`, // 确保每个项目都有唯一ID
        config: !it.sysAiVincentTaskCondition ? {} : JSON.parse(it.sysAiVincentTaskCondition),
        sysAiVincentTaskUrls: it?.sysAiVincentTaskUrl?.split(",") || [],
        sysAiVincentTaskLocalUrls: it?.sysAiVincentTaskLocalUrl?.split(",") || [],
      };
    });
  });
};

/**
 * 处理媒体预览事件
 */
const handleMediaPreview = (url, localUrl) => {
  console.log("媒体预览:", url, localUrl);
};

/**
 * 处理媒体下载事件
 */
const handleMediaDownload = (url, localUrl) => {
  console.log("媒体下载:", url, localUrl);
};
/**
 * 获取span
 * @param {*}
 * @return {*}
 */
const getSpan = (_item) => {
  const _n = _item.parameters?.number || 1;
  return 24 - _n * 4 - 5;
};

onMounted(async () => {
  loadHistoryData();
});

/**
 * 更新数据
 * @param {*}
 * @return {*}
 */
const updateData = async () => {
  loadHistoryData();
};

/**
 * 重绘
 * @param {*}
 * @return {*}
 */
const handleReDraw = async (prompt, type) => {
  emit("redrawer", prompt, type);
};

const refull = async (value) => {
  if (value === true) {
    historyLayout.style.setProperty("--show-history-top-height", 0);
    return;
  }
  historyLayout.style.setProperty("--show-history-top-height", "380px");
};
onMounted(() => {
  historyLayout.style.setProperty("--show-history-top-height", "380px");
});
defineExpose({
  updateData,
  refull,
});
</script>
<template>
  <div class="!overflow-auto history relative thin-scroller" id="historyLayout">
    <!-- 每一条结果一行显示 -->
    <div v-for="row in displayData" :key="row.id" class="history-row">
      <!-- 媒体展示区域 -->
      <div class="media-wrapper">
        <MediaDisplay
          :media-urls="row.sysAiVincentTaskUrls"
          :local-media-urls="row.sysAiVincentTaskLocalUrls"
          :media-type="props.form.sysAiModuleType"
          :media-count="row.config?.parameters?.number || 1"
          :row-id="row.id"
          :media-size="{ width: 261, height: 261 }"
          :placeholder-data="row.placeholderData || []"
          :is-generating="row.isGenerating || false"
          @preview="handleMediaPreview"
          @download="handleMediaDownload"
        />
      </div>

      <!-- 参数信息区域 -->
      <div class="params-section">
        <!-- 提示词区域 -->
        <div class="prompt-text" :title="row.config?.input?.prompt">
          <span class="prompt-content" @click="handleReDraw(row.config?.input?.prompt)">{{ row.config?.input?.prompt }}</span>
        </div>

        <!-- 标签式参数展示 -->
        <div class="param-tags">
          <div class="param-tag model-tag" @click="handleReDraw(row.config.model, 'model')">
            <span class="tag-icon">🤖</span>
            <span class="tag-text">{{ row.config.model }}</span>
          </div>

          <div class="param-tag" v-if="row.config?.parameters?.size">
            <span class="tag-icon">📐</span>
            <span class="tag-text">{{ row.config.parameters.size }}</span>
          </div>

          <div class="param-tag" v-if="row.config?.parameters?.number">
            <span class="tag-icon">🔢</span>
            <span class="tag-text">{{ row.config.parameters.number }}张</span>
          </div>

          <div class="param-tag" v-if="row.config?.parameters?.style">
            <span class="tag-icon">🎨</span>
            <span class="tag-text">{{ row.config.parameters.style }}</span>
          </div>

          <div class="param-tag" v-if="row.config?.parameters?.quality">
            <span class="tag-icon">⭐</span>
            <span class="tag-text">{{ row.config.parameters.quality }}</span>
          </div>

          <div class="param-tag" v-if="row.config?.parameters?.fps">
            <span class="tag-icon">🎬</span>
            <span class="tag-text">{{ row.config.parameters.fps }}FPS</span>
          </div>
        </div>

        <!-- 创建时间 -->
        <div class="creation-time">
          <span class="time-label">创建时间</span>
          <span class="time-value">{{ row.createTime }}</span>
        </div>

        <!-- 参考图像 -->
        <div class="ref-image-section" v-if="row?.input?.refImage">
          <span class="ref-label">参考图像</span>
          <el-image :src="row.input.refImage" class="ref-image" />
        </div>

        <!-- 反向提示词 -->
        <div class="negative-prompt-section" v-if="row.config?.input?.negativePrompt">
          <span class="negative-label">反向提示词</span>
          <span class="negative-content">{{ row.config.input.negativePrompt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.history {
  height: 100%;
  padding: 20px;
  background: #f5f7fa;
}

// 历史记录行布局 - 每个项目独立成行
.history-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
  min-height: 200px;

  &:hover {
    transform: translateY(-2px);
  }
}

// 媒体展示区域包装器 - 左侧区域，根据内容自适应宽度
.media-wrapper {
  flex-shrink: 0;
  display: flex;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  border-radius: 8px;
  min-width: fit-content;
}

// 参数信息区域 - 右侧固定参数块
.params-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 300px !important;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.prompt-text {
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 3px solid #409eff;

  .prompt-content {
    color: #495057;
    cursor: pointer;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    font-weight: 500;

    &:hover {
      color: #409eff;
    }
  }
}

.param-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
}

.param-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 16px;
  font-size: 12px;
  color: #495057;
  transition: all 0.2s ease;
  cursor: default;

  &:hover {
    background: #e9ecef;
    transform: translateY(-1px);
  }

  &.model-tag {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      transform: translateY(-1px) scale(1.02);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }

  .tag-icon {
    font-size: 14px;
  }

  .tag-text {
    font-weight: 500;
  }
}

.creation-time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 3px solid #17a2b8;

  .time-label {
    font-size: 12px;
    color: #6c757d;
    font-weight: 500;
  }

  .time-value {
    font-size: 12px;
    color: #495057;
    font-weight: 600;
  }
}

.ref-image-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 3px solid #28a745;

  .ref-label {
    font-size: 12px;
    color: #6c757d;
    font-weight: 500;
  }

  .ref-image {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    border: 2px solid #dee2e6;
    object-fit: cover;
  }
}

.negative-prompt-section {
  padding: 8px 12px;
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border-radius: 8px;
  border-left: 3px solid #e53e3e;

  .negative-label {
    display: block;
    font-size: 11px;
    color: #a0aec0;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .negative-content {
    font-size: 12px;
    color: #e53e3e;
    font-style: italic;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .history-row {
    flex-direction: column;
    gap: 15px;
  }

  .media-wrapper {
    width: 100%;
    justify-content: center;
  }

  .params-section {
    min-width: auto;
  }
}
.btnLine--kz2jqeAV.active--SBaVjOyL {
  justify-content: space-between;
}
.btnLine--kz2jqeAV {
  align-items: center;
  display: flex;
}
.popoverLine--Zm22xWTH {
  align-items: center;
  display: flex;
}
.textLine3--Mzcb_C92 {
  -webkit-line-clamp: 3;
}
.help--DsIM8RLY {
  flex: 1;
}
.text--gF1ZsVLO {
  -webkit-box-orient: vertical;
  cursor: pointer;
  display: inline-block;
  display: -webkit-box;
  overflow: hidden;
  padding: 2px 4px;
  text-overflow: ellipsis;
}
.prompt--Kll06NyU {
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--wanx-v2-color10);
  display: -webkit-box;
  font-size: 13px;
  margin: 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}
.otherTypeCou--QIGeNEET {
  display: flex;
  .otherType--fqMcYymU {
    background: var(--wanx-v2-color5);
    border-radius: 100px;
    color: var(--wanx-v2-color1);
    font-size: 13px;
    font-weight: var(--wanx-v2-font500);
    margin-right: 8px;
    padding: 4px 12px;
    padding-left: 0px;
    text-align: center;
  }
}

.ribbon-3 {
  position: absolute;
  top: 0px;
  right: -8px;
  overflow: hidden;

  &::before,
  &::after {
    content: "";
    position: absolute;
  }

  &::before {
    left: 8px;
    width: 40px;
    height: 8px;
    border-radius: 8px 8px 0px 0px;
    background-color: var(--ribbon-primary-color);
    opacity: 0.6;
  }

  &::after {
    border-radius: 0px 8px 8px 0px;
    width: 8px;
    height: 40px;
    right: 0px;
    bottom: 8px;
    background-color: #615ced;
    opacity: 0.6;
  }

  & > span {
    position: absolute;
    top: 20%;
    right: -40%;
    z-index: 2;
    width: 150%;
    height: 40px;
    overflow: hidden;
    transform: rotate(45deg);
    border: 1px dashed;
    box-shadow:
      0 0 0 3px #615ced,
      0px 21px 5px -18px rgba(0, 0, 0, 0.6);
    background: #615ced;

    /* 文本居中 */
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
  }
}
</style>
