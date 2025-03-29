<template>
  <div class="redis-string h-full relative">
    <div class="redis-string__toolbar">
      <el-radio-group v-model="config.formatType" size="small">
        <el-radio-button value="json">
          <IconifyIconOnline icon="ri:code-json" class="redis-string__icon" />
          JSON
        </el-radio-button>
        <el-radio-button value="string">
          <IconifyIconOnline icon="ri:text" class="redis-string__icon" />
          字符串
        </el-radio-button>
      </el-radio-group>

      <div class="redis-string__actions">
        <el-tooltip content="复制内容" placement="top">
          <el-button type="primary" size="small" link @click="copyContent">
            <IconifyIconOnline icon="ri:clipboard-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <div class="redis-string__content">
      <div v-if="config.formatType === 'json'" class="redis-string__json">
        <vue-json-pretty :data="parsedJson" :showLineNumber="true" :showIcon="true" :showLength="true" :deep="3" :showDoubleQuotes="false" class="redis-string__json-viewer" />
      </div>

      <div v-else class="redis-string__text">
        <el-input v-model="newData" readonly type="textarea" :rows="20" resize="none" class="redis-string__textarea" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { format } from "sql-formatter";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { defineProps, reactive, computed, ref } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

/**
 * 格式化JSON数据
 * 尝试将字符串解析为JSON对象
 * @param {String} data - 要解析的JSON字符串
 * @returns {Object} 解析后的JSON对象，解析失败则返回空对象
 */
const formatJson = data => {
  try {
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// 获取数据值
const newData = props.data && props.data[0] ? props.data[0].value : "";

// 配置选项
const config = reactive({
  formatType: "json"
});

/**
 * 计算属性：解析后的JSON数据
 */
const parsedJson = computed(() => {
  return formatJson(newData);
});

/**
 * 复制内容到剪贴板
 */
const copyContent = () => {
  const textToCopy = config.formatType === "json" ? JSON.stringify(parsedJson.value, null, 2) : newData;

  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      ElMessage.success("内容已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请手动复制");
    });
};
</script>

<style lang="scss" scoped>
.redis-string {
  display: flex;
  flex-direction: column;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: var(--el-bg-color-overlay);
    border-radius: var(--el-border-radius-base);
    margin-bottom: 16px;
  }

  &__icon {
    margin-right: 4px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__content {
    flex: 1;
    overflow: hidden;
    border-radius: var(--el-border-radius-base);
    border: 1px solid var(--el-border-color-lighter);
  }

  &__json {
    height: 100%;
    overflow: auto;
    padding: 8px;

    &-viewer {
      font-family: "Consolas", "Monaco", monospace;
      font-size: 14px;

      :deep(.vjs-tree) {
        padding: 8px;
      }

      :deep(.vjs-value) {
        color: var(--el-color-primary);
      }

      :deep(.vjs-key) {
        color: var(--el-color-success);
      }
    }
  }

  &__text {
    height: 100%;

    :deep(.el-textarea__inner) {
      height: 100%;
      font-family: "Consolas", "Monaco", monospace;
      font-size: 14px;
      line-height: 1.6;
      padding: 12px;
      color: var(--el-text-color-primary);
      background-color: var(--el-bg-color-page);
    }
  }
}
</style>
