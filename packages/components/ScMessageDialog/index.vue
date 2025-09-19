<template>
  <div v-if="visible" class="sc-message-dialog" :class="[`position-${position}`, { collapsed: isCollapsed }, { 'auto-scroll': autoScroll }]" :style="dialogStyle">
    <!-- 头部控制栏 -->
    <div class="dialog-header" @click="toggleCollapse">
      <div class="header-content">
        <slot name="header">
          <span class="title">{{ title }}</span>
        </slot>
      </div>
      <div class="header-controls">
        <el-button type="text" size="small" class="clear-btn" @click.stop="clear" title="清除内容">
          <IconifyIconOnline icon="ep:delete" width="16" height="16" />
        </el-button>
        <el-button type="text" size="small" class="collapse-btn" @click.stop="toggleCollapse">
          <IconifyIconOnline :icon="isCollapsed ? 'ep:arrow-up' : 'ep:arrow-down'" width="16" height="16" />
        </el-button>
        <el-button type="text" size="small" class="close-btn" @click.stop="close">
          <IconifyIconOnline icon="ep:close" width="16" height="16" />
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div v-show="!isCollapsed" ref="contentRef" class="dialog-content thin-scroller" @scroll="handleScroll">
      <!-- 自定义模板插槽 -->
      <div v-if="$slots.default" class="custom-content">
        <slot />
      </div>

      <!-- 默认内容渲染 -->
      <div v-else class="default-content">
        <!-- Markdown 内容 -->
        <div v-if="markdownContent && enableMarkdown" class="markdown-content" v-html="renderedMarkdown" />

        <!-- 普通文本显示Markdown内容（未启用解析时） -->
        <div v-else-if="markdownContent && !enableMarkdown" class="text-content">
          {{ markdownContent }}
        </div>

        <!-- 普通文本内容 -->
        <div v-else-if="content" class="text-content">
          {{ content }}
        </div>

        <!-- 数据列表 -->
        <div v-if="data && data.length" class="data-list">
          <transition-group name="data-item" tag="div" class="data-list-container">
            <div v-for="(item, index) in data" :key="`item-${index}-${item.title || item.message || index}`" class="data-item thin-scroller">
              <div class="item-content">
                <div v-if="item.title" class="item-title">{{ item.title }}</div>
                <div v-if="item.message || item.content" class="item-message">
                  <template v-if="item.isHtml">
                    <div v-html="item.message || item.content" />
                  </template>
                  <template v-else-if="item.isMarkdown">
                    <div v-html="renderMarkdown(item.message || item.content)" />
                  </template>
                  <span v-else>{{ item.message || item.content }}</span>
                </div>

                <div v-if="item.time" class="item-time">{{ formatTime(item.time) }}</div>
              </div>

              <!-- 进度条（非唯一模式） -->
              <div v-if="!progressUnique && (item.progress !== undefined || item.step !== undefined)" class="item-progress">
                <el-progress v-if="item.progress !== undefined" :percentage="item.progress" :status="item.progress === 100 ? 'success' : undefined" :stroke-width="6" />
                <div v-else-if="item.step !== undefined" class="step-progress">
                  <span class="step-text">步骤 {{ item.step.current }} / {{ item.step.total }}</span>
                  <el-progress :percentage="(item.step.current / item.step.total) * 100" :stroke-width="6" />
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <!-- 唯一进度条（固定在底部） -->
    <div v-if="progressUnique && latestProgress && !isCollapsed" class="unique-progress-fixed">
      <div class="progress-title">{{ latestProgress.title || "进度" }}</div>
      <el-progress v-if="latestProgress.progress !== undefined" :percentage="latestProgress.progress" :status="latestProgress.progress === 100 ? 'success' : undefined" :stroke-width="8" />
      <div v-else-if="latestProgress.step" class="step-progress">
        <span class="step-text">步骤 {{ latestProgress.step.current }} / {{ latestProgress.step.total }}</span>
        <el-progress :percentage="(latestProgress.step.current / latestProgress.step.total) * 100" :stroke-width="8" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElProgress } from "element-plus";
import { marked } from "marked";
import { computed, defineEmits, nextTick, onMounted, ref, watch } from "vue";

/**
 * ScMessageDialog 消息对话框组件
 * @author CH
 * @version 1.0.0
 * @since 2024-01-20
 */

// 位置类型
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// 数据项接口
interface DataItem {
  title?: string;
  message?: string;
  content?: string;
  isHtml?: boolean;
  isMarkdown?: boolean;
  time?: string | Date;
  progress?: number; // 0-100
  step?: {
    current: number;
    total: number;
  };
}

// 组件属性
interface Props {
  /** 是否显示 */
  visible?: boolean;
  /** 标题 */
  title?: string;
  /** 文本内容 */
  content?: string;
  /** Markdown 内容 */
  markdownContent?: string;
  /** 数据列表 */
  data?: DataItem[];
  /** 位置 */
  position?: Position;
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 透明度 */
  opacity?: number;
  /** 是否默认收缩 */
  defaultCollapsed?: boolean;
  /** 有数据时是否自动展开 */
  autoExpandOnData?: boolean;
  /** 是否自动滚动到底部 */
  autoScroll?: boolean;
  /** 手动滚动时是否停止自动滚动 */
  stopAutoScrollOnManual?: boolean;
  /** 进度条是否唯一显示（仅在底部显示一条进度） */
  progressUnique?: boolean;
  /** 是否启用Markdown解析 */
  enableMarkdown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  title: "消息",
  position: "bottom-right",
  width: "400px",
  height: "300px",
  opacity: 0.95,
  defaultCollapsed: false,
  autoExpandOnData: true,
  autoScroll: true,
  stopAutoScrollOnManual: true,
  progressUnique: true,
  enableMarkdown: false
});

// 组件事件
const emit = defineEmits(["close", "collapse", "scroll", "clear"]);

// 响应式数据
const isCollapsed = ref(props.defaultCollapsed);
const autoScrollEnabled = ref(props.autoScroll);
const contentRef = ref<HTMLElement>();

// 计算属性
const dialogStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
  opacity: props.opacity
}));

const renderMarkdown = (markdown: string): string => {
  if (!markdown || !props.enableMarkdown) return "";
  return marked(markdown);
};
const renderedMarkdown = computed(() => {
  if (!props.markdownContent || !props.enableMarkdown) return "";
  return marked(props.markdownContent);
});

/**
 * 获取最新的进度信息（用于唯一进度条显示）
 */
const latestProgress = computed(() => {
  if (!props.data || props.data.length === 0) return null;

  // 从后往前查找最新的有进度信息的数据项
  for (let i = props.data.length - 1; i >= 0; i--) {
    const item = props.data[i];
    if (item.progress !== undefined || item.step !== undefined) {
      return item;
    }
  }

  return null;
});

// 方法
/**
 * 切换收缩状态
 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit("collapse", isCollapsed.value);
};

/**
 * 关闭对话框
 */
const close = () => {
  emit("close");
};

/**
 * 清除内容
 * @description 清除所有数据和内容，触发清除事件供父组件处理
 */
const clear = () => {
  emit("clear");
};

/**
 * 格式化时间
 * @param time 时间
 * @returns 格式化后的时间字符串
 */
const formatTime = (time: string | Date): string => {
  const date = typeof time === "string" ? new Date(time) : time;
  return date.toLocaleTimeString();
};

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  if (!contentRef.value || !autoScrollEnabled.value) return;

  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight;
    }
  });
};

/**
 * 处理滚动事件
 * @param event 滚动事件
 */
const handleScroll = (event: Event) => {
  emit("scroll", event);

  if (props.stopAutoScrollOnManual) {
    const target = event.target as HTMLElement;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 5;

    // 如果不在底部，停止自动滚动
    if (!isAtBottom) {
      autoScrollEnabled.value = false;
    } else {
      // 如果滚动到底部，恢复自动滚动
      autoScrollEnabled.value = props.autoScroll;
    }
  }
};

// 监听数据变化
watch(
  () => props.data,
  newData => {
    if (newData && newData.length > 0) {
      // 有数据时自动展开
      if (props.autoExpandOnData && isCollapsed.value) {
        isCollapsed.value = false;
        emit("collapse", false);
      }

      // 滚动到底部
      scrollToBottom();
    }
  },
  { deep: true }
);

// 监听内容变化
watch([() => props.content, () => props.markdownContent], () => {
  scrollToBottom();
});

// 组件挂载
onMounted(() => {
  scrollToBottom();
});

// 暴露方法给外部调用
defineExpose({
  clear,
  close,
  toggleCollapse,
  scrollToBottom
});
</script>

<style scoped>
.sc-message-dialog {
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 2000;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 位置样式 */
.position-top-left {
  top: 20px;
  left: 20px;
}

.position-top-right {
  top: 20px;
  right: 20px;
}

.position-bottom-left {
  bottom: 20px;
  left: 20px;
}

.position-bottom-right {
  bottom: 20px;
  right: 20px;
}

/* 收缩状态 */
.collapsed {
  height: auto !important;
}

/* 头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(64, 158, 255, 0.1);
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  user-select: none;
}

.header-content {
  flex: 1;
}

.title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.header-controls {
  display: flex;
  gap: 4px;
}

.clear-btn,
.collapse-btn,
.close-btn {
  padding: 4px;
  color: #909399;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #f56c6c;
}

.collapse-btn:hover,
.close-btn:hover {
  color: #409eff;
}

/* 内容区域 */
.dialog-content {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100% - 60px);
}

/* 当有唯一进度条时，为内容区域添加底部间距 */
.sc-message-dialog:has(.unique-progress-fixed) .dialog-content {
  padding-bottom: 80px;
}

.custom-content,
.default-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

/* Markdown 内容 */
.markdown-content {
  word-wrap: break-word;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 16px 0 8px 0;
  color: #303133;
}

.markdown-content :deep(p) {
  margin: 8px 0;
}

.markdown-content :deep(code) {
  background: #f5f7fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
}

.markdown-content :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

/* 数据列表 */
.data-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  transition: all 0.3s ease;
}

/* 数据项动画效果 */
.data-item-enter-active {
  transition: all 0.4s ease;
}

.data-item-leave-active {
  transition: all 0.3s ease;
}

.data-item-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.data-item-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.data-item-move {
  transition: transform 0.3s ease;
}

.item-content {
  margin-bottom: 8px;
}

.item-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.item-message {
  color: #606266;
  margin-bottom: 4px;
}

.item-time {
  font-size: 12px;
  color: #909399;
}

.item-progress {
  margin-top: 8px;
  transition: all 0.3s ease;
}

.step-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-text {
  font-size: 12px;
  color: #909399;
  transition: color 0.3s ease;
}

/* 进度条动画效果 */
.item-progress :deep(.el-progress-bar__outer) {
  transition: all 0.4s ease;
}

.item-progress :deep(.el-progress-bar__inner) {
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 唯一进度条样式（固定在底部） */
.unique-progress-fixed {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: #f0f9ff;
  border-top: 1px solid #e1f5fe;
  border-radius: 0 0 8px 8px;
  z-index: 10;
  transition: all 0.3s ease;
  animation: slideInUp 0.4s ease-out;
}

.progress-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
  transition: color 0.3s ease;
}

/* 唯一进度条进入动画 */
@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 唯一进度条内的进度条动画 */
.unique-progress-fixed :deep(.el-progress-bar__outer) {
  transition: all 0.4s ease;
}

.unique-progress-fixed :deep(.el-progress-bar__inner) {
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-message-dialog {
    width: calc(100vw - 40px) !important;
    max-width: 400px;
  }

  .position-top-left,
  .position-top-right {
    top: 10px;
    left: 20px;
    right: 20px;
  }

  .position-bottom-left,
  .position-bottom-right {
    bottom: 10px;
    left: 20px;
    right: 20px;
  }
}
</style>
