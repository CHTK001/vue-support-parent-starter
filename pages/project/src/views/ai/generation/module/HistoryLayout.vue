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
      sysAiVincentTaskUrls: props.newGeneratedData.map((item) => item.url),
      sysAiVincentTaskLocalUrls: props.newGeneratedData.map((item) => item.url),
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
          :media-size="{ width: 150, height: 150 }"
          @preview="handleMediaPreview"
          @download="handleMediaDownload"
        />
      </div>

      <!-- 参数信息区域 -->
      <div class="params-section">
        <div class="prompt-text" :title="row.config?.input?.prompt">
          <span class="prompt-label">提示词：</span>
          <span class="prompt-content" @click="handleReDraw(row.config?.input?.prompt)">{{ row.config?.input?.prompt }}</span>
        </div>

        <div class="model-params">
          <div class="param-item">
            <span class="param-label">模型：</span>
            <span class="param-value model-name" @click="handleReDraw(row.config.model, 'model')">{{ row.config.model }}</span>
          </div>

          <div class="param-item" v-if="row.config?.parameters?.size">
            <span class="param-label">尺寸：</span>
            <span class="param-value">{{ row.config.parameters.size }}</span>
          </div>

          <div class="param-item" v-if="row.config?.parameters?.style">
            <span class="param-label">风格：</span>
            <span class="param-value">{{ row.config.parameters.style }}</span>
          </div>

          <div class="param-item" v-if="row.config?.parameters?.number">
            <span class="param-label">数量：</span>
            <span class="param-value">{{ row.config.parameters.number }}</span>
          </div>

          <div class="param-item" v-if="row.config?.parameters?.quality">
            <span class="param-label">质量：</span>
            <span class="param-value">{{ row.config.parameters.quality }}</span>
          </div>

          <div class="param-item" v-if="row.config?.parameters?.fps">
            <span class="param-label">帧率：</span>
            <span class="param-value">{{ row.config.parameters.fps }} FPS</span>
          </div>

          <div class="param-item" v-if="row.config?.input?.negativePrompt">
            <span class="param-label">反向提示词：</span>
            <span class="param-value negative-prompt">{{ row.config.input.negativePrompt }}</span>
          </div>
        </div>

        <!-- 参考图像 -->
        <div class="ref-image-section" v-if="row?.input?.refImage">
          <span class="param-label">参考图像：</span>
          <el-image :src="row.input.refImage" class="ref-image" />
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
  gap: 20px;
  margin-bottom: 20px;
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
  padding: 15px;
  min-width: fit-content;
}

// 参数信息区域 - 右侧固定参数块
.params-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 300px !important;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.prompt-text {
  margin-bottom: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;

  .prompt-label {
    font-weight: 600;
    color: #303133;
    margin-right: 8px;
    font-size: 14px;
  }

  .prompt-content {
    color: #606266;
    cursor: pointer;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;

    &:hover {
      color: #409eff;
      text-decoration: underline;
    }
  }
}

.model-params {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.param-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .param-label {
    font-weight: 500;
    color: #909399;
    margin-right: 8px;
    min-width: 80px;
    font-size: 13px;
  }

  .param-value {
    color: #606266;
    font-size: 13px;
    flex: 1;
    text-align: right;

    &.model-name {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }
    }

    &.negative-prompt {
      color: #f56c6c;
      font-style: italic;
    }
  }
}

.ref-image-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #67c23a;

  .param-label {
    font-weight: 500;
    color: #909399;
    font-size: 13px;
  }

  .ref-image {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    border: 2px solid #e4e7ed;
    object-fit: cover;
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
