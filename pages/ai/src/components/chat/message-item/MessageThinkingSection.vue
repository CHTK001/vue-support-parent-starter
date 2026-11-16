<template>
  <div class="process-section thinking-section">
    <!-- 标题行：状态词 + 思考内容首行摘要（用户需求 2026-11-07：过程行直接给出内容预览，
         与工具行的「动作名 + 命令摘要」同构，扫一眼就知道这轮思考在想什么） -->
    <div
      class="thinking-section__header flex items-center text-sm text-gray-700 dark:text-gray-400 cursor-pointer font-medium transition-colors duration-200"
      @click.stop="handleToggle"
      @keydown.enter.prevent="handleToggle"
      @keydown.space.prevent="handleToggle">
      <!-- 折叠箭头不画在这里：折叠入口就是外层时间线左侧的图标位（平时是思考图标，
           悬停换箭头），与回复正文行同一套逻辑（用户口径 2026-11-16） -->
      <span class="text-gray-600 dark:text-gray-400 shrink-0">{{ isThinking ? t('chat.turn.thinkingActive') : t('chat.turn.thinkingDone') }}</span>
      <span v-if="thinkingDuration" class="text-xs text-gray-400 ml-2 shrink-0">
        {{ formattedDuration }}
      </span>
      <!-- 折叠态的内容摘要：取推理正文首行，截断显示（展开后隐藏，正文自见） -->
      <span v-if="!isExpanded && contentPreview" class="thinking-section__preview">{{ contentPreview }}</span>
    </div>

    <!-- 内容区：极简展开态（用户要求 2026-10-24）——细左侧导轨 + 纯文本，
         不套填充卡片。只有「思考中 / 已展开」时渲染完整内容；
         折叠态只保留上方标题行的思考摘要（一行），不渲染内容区，
         避免折叠后多行正文露出。 -->
    <div v-if="isExpanded" class="thinking-section__content-wrapper">
      <div class="thinking-content">
        <MarkdownContent @click.stop="$emit('click')" class="flex-1 markdown-text text-gray-500 dark:text-gray-400"
          :content="reasoningContent" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MarkdownContent from '../../ui/MarkdownContent.vue';
import { formatDuration } from '../../../utils/messageUtils';

const { t } = useI18n();

const props = defineProps<{
  reasoningContent: string;
  isThinking: boolean;
  thinkingDurationMs: number | null | undefined;
  metadata?: Record<string, any>;
  /**
   * 展开态：由外层时间线统一持有。
   *
   * <p>折叠入口在时间线左侧图标位（思考图标 → 箭头），与回复正文行同一套逻辑，
   * 所以展开状态不能再留在组件内部，否则箭头与内容会各说各话。</p>
   */
  expanded?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  toggle: [];
}>();

const isExpanded = computed(() => props.expanded === true);

const handleToggle = () => {
  emit('toggle');
};

const thinkingDuration = computed(() => {
  if (props.isThinking) {
    return props.thinkingDurationMs;
  }
  return props.metadata?.thinkingDurationMs || props.thinkingDurationMs;
});

const formattedDuration = computed(() => {
  return formatDuration(thinkingDuration.value);
});

/**
 * 折叠态标题行的思考摘要：取推理正文的首段非空文本，去 Markdown 记号后截断。
 * 只做展示预览（约 80 字符），展开后隐藏——完整内容仍由下方内容区承载。
 */
const contentPreview = computed(() => {
  const raw = (props.reasoningContent || '').trim();
  if (!raw) return '';
  const plain = raw
    .replace(/[#*`>\-\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 80 ? plain.slice(0, 80) + '…' : plain;
});
</script>

<style scoped>
.thinking-section {
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.thinking-section__header {
  user-select: none;
}

.thinking-section__header:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 折叠态的思考摘要：弱化、单行截断，与工具行的目标摘要同一视觉档 */
.thinking-section__preview {
  margin-left: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* 极简展开态：一条细导轨 + 纯文本（与工具行 / 检索行同一套视觉口径）。
   只有展开态渲染内容区：折叠态只显示标题行的一行思考摘要（见模板 v-if）。
   原来用 Tailwind 的 border-gray-300 dark:border-gray-700，那是两套硬编码灰，
   换肤后不跟随；这里统一走 --el-border-color-lighter。 */
.thinking-section__content-wrapper {
  margin-left: 7px;
  padding-left: 16px;
  border-left: 2px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.thinking-content {
  max-height: 60vh;
  overflow-y: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 动效降级：系统开启「减少动态效果」时，思考块直接出现在终态、
   展开/折叠的高度变化不再补间。停掉过渡后折叠态照样成立，内容不会因此多露出来。
   逐个列出，不写 `*` / `.process-section *` 通配，
   避免把 el-icon / MarkdownContent 内部 Element Plus 组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .thinking-section {
    animation: none;
  }

  .thinking-section__header {
    transition: none;
  }

  .thinking-content {
    transition: none;
  }
}

/* 键盘焦点可见性：标题行是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式沿用模板里已有的 cursor-pointer，不重复声明。 */
.thinking-section__header {
  outline: none;
}

.thinking-section__header:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
