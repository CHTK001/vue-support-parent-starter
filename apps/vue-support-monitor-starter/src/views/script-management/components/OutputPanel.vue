<template>
  <div class="output-panel">
    <div class="output-toolbar">
      <div class="output-title">
        <IconifyIconOnline :icon="icon || defaultIcon" />
        <span>{{ title }}</span>
      </div>
      <div class="output-actions">
        <el-button size="small" @click="onCopy">
          <IconifyIconOnline icon="ri:file-copy-line" /> 复制
        </el-button>
        <el-button size="small" @click="onDownload">
          <IconifyIconOnline icon="ri:download-line" /> 下载
        </el-button>
      </div>
    </div>
    <div class="output-content" :class="{ error }" :style="{ maxHeight }">
      <template v-if="content">
        <pre>{{ content }}</pre>
      </template>
      <div v-else class="no-output">{{ emptyText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 输出面板（深色代码块风格）
 * Props:
 *  - title: 标题
 *  - content: 文本内容（字符串）
 *  - emptyText: 无内容时的提示
 *  - error: 是否为错误输出（影响配色）
 *  - icon: 标题图标（Iconify 名称）
 *  - filename: 下载文件名（可选）
 *  - maxHeight: 最大高度（CSS值，默认160px）
 */
import { ElMessage } from "element-plus";

interface Props {
  title: string;
  content?: string | null;
  emptyText?: string;
  error?: boolean;
  icon?: string;
  filename?: string;
  maxHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  emptyText: "暂无内容",
  error: false,
  icon: undefined,
  filename: undefined,
  maxHeight: "160px",
});

const defaultIcon = "ri:terminal-line";

async function onCopy() {
  try {
    if (!props.content) {
      ElMessage.warning("暂无内容可复制");
      return;
    }
    await navigator.clipboard.writeText(props.content);
    ElMessage.success("内容已复制到剪贴板");
  } catch (e) {
    ElMessage.error("复制失败");
  }
}

function onDownload() {
  try {
    if (!props.content) {
      ElMessage.warning("暂无内容可下载");
      return;
    }
    const blob = new Blob([props.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = props.filename || `${props.title}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    ElMessage.success("下载成功");
  } catch (e) {
    ElMessage.error("下载失败");
  }
}
</script>

<style scoped lang="scss">
.output-panel {
  .output-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .output-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #334155;
      font-weight: 600;
    }

    :deep(.el-button) {
      border-radius: 10px;
      font-weight: 500;
    }
  }

  .output-content {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    white-space: pre-wrap;
    background: #0b1220;
    color: #cbd5e1;
    border-radius: 12px;
    padding: 10px 12px;
    max-height: 160px;
    overflow: auto;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.15);

    &.error {
      background: #1a0b0b;
      color: #fecaca;
    }
  }

  .no-output {
    color: #94a3b8;
  }
}
</style>

