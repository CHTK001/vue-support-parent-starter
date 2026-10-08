<template>
  <!--
    工具调用详情正文（调用参数 + 执行结果）。

    抽取自原弹窗内联模板，供两处复用：
      1. 行内展开（MessageToolCalls 点击折叠行）；
      2. 「详情」弹窗（保留原入口）。
    两处同源，避免格式/判据分叉。
  -->
  <div class="tool-call-detail">
    <!-- 调用参数 -->
    <div v-if="args" class="tool-call-detail__block">
      <div class="tool-call-detail__title">
        <el-icon size="14" class="mr-1">
          <SettingsOutlined />
        </el-icon>
        {{ t('chat.toolCalls.callParams') }}
      </div>
      <div class="tool-call-detail__card">
        <div v-if="isSimpleParams(args)" class="params-table">
          <div class="param-header py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="param-key text-sm font-semibold text-gray-800 dark:text-gray-200">{{
              t('chat.toolCalls.paramKey') }}</span>
            <span class="param-value text-sm font-semibold text-gray-800 dark:text-gray-200 ml-4">{{
              t('chat.toolCalls.paramValue') }}</span>
          </div>
          <div v-for="(value, key) in parseParams(args)" :key="key"
            class="param-row py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <span class="param-key text-sm font-medium text-gray-700 dark:text-gray-300">{{ key }}</span>
            <span class="param-value text-sm text-gray-600 dark:text-gray-400 ml-4">{{ formatParamValue(value) }}</span>
          </div>
        </div>
        <pre v-else
          class="text-sm overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all"><code>{{ formatToolArgs(args) }}</code></pre>
      </div>
    </div>

    <!-- 执行结果 -->
    <div v-if="response" class="tool-call-detail__block">
      <div class="tool-call-detail__title">
        <el-icon v-if="failed" size="14" class="mr-1" style="color:#f56c6c">
          <ErrorCircle16Regular />
        </el-icon>
        <el-icon v-else size="14" class="mr-1 text-green-500">
          <CheckCircleOutlined />
        </el-icon>
        <span v-if="failed">{{ t('chat.toolCalls.resultFailed') }}</span>
        <span v-else>{{ t('chat.toolCalls.resultSuccess') }}</span>
      </div>
      <div class="tool-call-detail__card">
        <!-- JSON 解码成功且为简单对象 → 表格展示 -->
        <div v-if="isSimpleResult(response)" class="params-table">
          <div class="param-header py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="param-key text-sm font-semibold text-gray-800 dark:text-gray-200">{{
              t('chat.toolCalls.fieldKey') }}</span>
            <span class="param-value text-sm font-semibold text-gray-800 dark:text-gray-200 ml-4">{{
              t('chat.toolCalls.paramValue') }}</span>
          </div>
          <div v-for="(value, key) in parseResult(response)" :key="key"
            class="param-row py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <span class="param-key text-sm font-medium text-gray-700 dark:text-gray-300">{{ key }}</span>
            <span class="param-value text-sm text-gray-600 dark:text-gray-400 ml-4">{{ formatParamValue(value) }}</span>
          </div>
        </div>
        <!-- JSON 解码失败或复杂对象 → pre 展示 -->
        <pre v-else
          class="text-sm overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">{{ formatToolResponse(response) }}</pre>
      </div>
    </div>

    <!-- 仍在执行且尚无结果：给出「执行中」而不是空白 -->
    <div v-if="executing && !response" class="tool-call-detail__executing">
      <el-icon size="14" class="animate-spin text-blue-500 mr-1">
        <Loading />
      </el-icon>
      <span>{{ t('chat.toolCalls.executing') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElIcon } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { SettingsOutlined, CheckCircleOutlined } from '@vicons/material';
import { ErrorCircle16Regular } from '@vicons/fluent';
// @ts-ignore - icons 组件尚未迁移到 TypeScript
import { Loading } from '@/components/icons';
import { parse as partialParse } from 'partial-json';
import { type ToolCall, getToolArgs } from '@/utils/toolDisplay';

const props = withDefaults(defineProps<{
  tool: ToolCall;
  /** 执行结果原始载荷（结构不限，内部自行解码/格式化） */
  response?: any;
  /** 是否仍在执行（无结果时展示「执行中」） */
  executing?: boolean;
}>(), {
  response: null,
  executing: false,
});

const { t } = useI18n();

/** 调用参数（沿用 toolDisplay 的解析口径） */
const args = computed(() => getToolArgs(props.tool));

/** 失败态：error / rejected 记为执行失败，其余记为执行结果 */
const failed = computed(() => props.tool?.outcome === 'error' || props.tool?.outcome === 'rejected');

// ── 参数 / 结果格式化 ──

const isSimpleParams = (value: any): boolean => {
  try {
    const parsed = typeof value === 'string' ? partialParse(value) : value;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
};

const parseParams = (value: any): Record<string, any> => {
  try {
    return typeof value === 'string' ? partialParse(value) : value;
  } catch {
    return {};
  }
};

const formatParamValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const formatToolArgs = (value: any): string => {
  if (!value) return '{}';
  try {
    const parsed = typeof value === 'string' ? partialParse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
};

const extractResultContent = (value: any): any => {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? partialParse(value) : value;
    if (parsed.content) {
      try {
        const parsedContent = typeof parsed.content === 'string' ? partialParse(parsed.content) : parsed.content;
        // partialParse 会将 "[ ] step1" 等非 JSON 文本误解析为空数组 []
        // 此时回退到原始字符串
        if (Array.isArray(parsedContent) && parsedContent.length === 0) {
          return parsed.content;
        }
        return parsedContent;
      } catch {
        return parsed.content;
      }
    }
    return parsed;
  } catch {
    return null;
  }
};

const formatToolResponse = (value: any): string => {
  if (!value) return t('chat.toolCalls.noResponse');
  const content = extractResultContent(value);
  if (content) {
    if (typeof content === 'string') return content;
    return JSON.stringify(content, null, 2);
  }
  return String(value);
};

const isSimpleResult = (value: any): boolean => {
  const content = extractResultContent(value);
  if (!content) return false;
  return typeof content === 'object' && content !== null && !Array.isArray(content) && Object.keys(content).length > 0;
};

const parseResult = (value: any): Record<string, any> => {
  const content = extractResultContent(value);
  return content && typeof content === 'object' ? content : {};
};
</script>

<style scoped>
.tool-call-detail {
  line-height: 1.6;
}

.tool-call-detail__block + .tool-call-detail__block {
  margin-top: 12px;
}

.tool-call-detail__title {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.tool-call-detail__card {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.tool-call-detail__executing {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tool-call-detail pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.tool-call-detail code {
  font-size: 13px;
}

.params-table {
  display: flex;
  flex-direction: column;
}

.param-header {
  display: flex;
  align-items: baseline;
}

.param-row {
  display: flex;
  align-items: baseline;
}

.param-key {
  min-width: 120px;
  flex-shrink: 0;
}

.param-value {
  flex: 1;
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
