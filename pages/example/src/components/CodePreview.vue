<template>
  <div class="code-preview">
    <div class="code-header">
      <div class="code-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="code-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <IconifyIconOnline :icon="tab.icon" />
          {{ tab.label }}
        </button>
      </div>
      <div class="code-actions">
        <el-tooltip content="复制代码" placement="top">
          <button class="action-btn" @click="copyCode">
            <IconifyIconOnline
              :icon="copied ? 'ri:check-line' : 'ri:file-copy-line'"
            />
          </button>
        </el-tooltip>
        <el-tooltip content="展开/收起" placement="top">
          <button class="action-btn" @click="expanded = !expanded">
            <IconifyIconOnline
              :icon="
                expanded ? 'ri:contract-up-down-line' : 'ri:expand-up-down-line'
              "
            />
          </button>
        </el-tooltip>
      </div>
    </div>
    <div class="code-content" :class="{ expanded }">
      <pre><code :class="`language-${currentLanguage}`" v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";

/**
 * 代码预览组件
 * 支持多标签页、代码高亮、复制功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

interface CodeTab {
  key: string;
  label: string;
  icon: string;
  code: string;
  language: string;
}

interface Props {
  /** 代码标签页配置 */
  tabs?: CodeTab[];
  /** 单个代码内容 */
  code?: string;
  /** 代码语言 */
  language?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  code: "",
  language: "vue",
});

const activeTab = ref(props.tabs.length > 0 ? props.tabs[0].key : "default");
const expanded = ref(false);
const copied = ref(false);

// 当前代码内容
const currentCode = computed(() => {
  if (props.tabs.length > 0) {
    const tab = props.tabs.find((t) => t.key === activeTab.value);
    return tab?.code || "";
  }
  return props.code;
});

// 当前语言
const currentLanguage = computed(() => {
  if (props.tabs.length > 0) {
    const tab = props.tabs.find((t) => t.key === activeTab.value);
    return tab?.language || "vue";
  }
  return props.language;
});

// 简单的代码高亮（不使用复杂的正则，避免冲突）
const highlightedCode = computed(() => {
  const code = currentCode.value;

  // 直接转义并返回纯文本，不做高亮处理
  // 避免正则冲突导致的显示问题
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
});

// 复制代码
async function copyCode() {
  try {
    await navigator.clipboard.writeText(currentCode.value);
    copied.value = true;
    message("代码已复制到剪贴板", { type: "success" });
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    message("复制失败", { type: "error" });
  }
}

// 监听 tabs 变化
watch(
  () => props.tabs,
  (newTabs) => {
    if (newTabs.length > 0 && !newTabs.find((t) => t.key === activeTab.value)) {
      activeTab.value = newTabs[0].key;
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.code-preview {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.code-tabs {
  display: flex;
  gap: 4px;
}

.code-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
}

.code-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }
}

.code-content {
  max-height: 300px;
  overflow: auto;
  transition: max-height 0.3s ease;

  // 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) transparent;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
  }

  &.expanded {
    max-height: none;
  }

  pre {
    margin: 0;
    padding: 16px;
    background: #1e1e1e;
    font-family: "Fira Code", "Monaco", "Consolas", monospace;
    font-size: 13px;
    line-height: 1.6;
    overflow-x: auto;
  }

  code {
    color: #d4d4d4;
  }
}

// 代码高亮样式
:deep(.hl-tag) {
  color: #e06c75;
}

:deep(.hl-attr) {
  color: #d19a66;
}

:deep(.hl-string) {
  color: #98c379;
}

:deep(.hl-keyword) {
  color: #c678dd;
}

:deep(.hl-comment) {
  color: #5c6370;
  font-style: italic;
}

// 暗色主题适配
:root.dark {
  .code-preview {
    border-color: var(--el-border-color-darker);
  }

  .code-header {
    background: var(--el-fill-color-darker);
  }
}
</style>
