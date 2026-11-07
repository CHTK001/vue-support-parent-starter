<template>
  <div class="process-section thinking-section">
    <!-- 标题行：状态词 + 思考内容首行摘要（用户需求 2026-11-07：过程行直接给出内容预览，
         与工具行的「动作名 + 命令摘要」同构，扫一眼就知道这轮思考在想什么） -->
    <div
      class="thinking-section__header flex items-center text-sm text-gray-700 dark:text-gray-400 cursor-pointer font-medium transition-colors duration-200"
      @click.stop="handleToggle">
      <!-- 不再重复画思考图标：外层 ProcessTimeline 的 timeline-rail 已经给了一个，
           组件内再画会导致同一块思考出现两个图标（用户反馈「思考的图标重复出现」） -->
      <span class="text-gray-600 dark:text-gray-400 shrink-0">{{ isThinking ? t('chat.turn.thinkingActive') : t('chat.turn.thinkingDone') }}</span>
      <span v-if="thinkingDuration" class="text-xs text-gray-400 ml-2 shrink-0">
        {{ formattedDuration }}
      </span>
      <!-- 折叠态的内容摘要：取推理首行，截断显示（展开后隐藏，正文自见） -->
      <span v-if="!isExpanded && contentPreview" class="thinking-section__preview">{{ contentPreview }}</span>
    </div>

    <!-- 内容区：极简展开态（用户要求 2026-10-24）——细左侧导轨 + 纯文本，
         不套填充卡片。折叠时显示最多3行 + 渐变遮罩，展开时全量显示 -->
    <div class="thinking-section__content-wrapper">
      <div class="thinking-content" :class="{ 'is-collapsed': !isExpanded && !isThinking }">
        <MarkdownContent @click.stop="$emit('click')" class="flex-1 markdown-text text-gray-500 dark:text-gray-400"
          :content="reasoningContent" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import MarkdownContent from '../../ui/MarkdownContent.vue';
import { formatDuration } from '../../../utils/messageUtils';

const { t } = useI18n();

const props = defineProps<{
  reasoningContent: string;
  isThinking: boolean;
  thinkingDurationMs: number | null | undefined;
  metadata?: Record<string, any>;
}>();

const emit = defineEmits<{
  click: [];
}>();

const isExpanded = ref(props.isThinking);

// 从 ChatPanel 注入锁定滚动方法，展开思考内容时调用
const lockScrollAnchor = inject<() => void>('lockScrollAnchor', () => {});

const handleToggle = () => {
  if (!isExpanded.value) {
    lockScrollAnchor();
  }
  isExpanded.value = !isExpanded.value;
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

watch(() => props.isThinking, (isThinking: boolean) => {
  if (isThinking) {
    isExpanded.value = true;
  } else {
    isExpanded.value = false;
  }
}, { immediate: true });
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
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 展开态：内容过长时给一个可滚动上限。此前展开后没有上限，
   超长思考会把整条消息撑得极长且页面无法定位（用户反馈「信息过多无法滚动」）。 */
.thinking-content:not(.is-collapsed) {
  max-height: 60vh;
  overflow-y: auto;
}

.thinking-content.is-collapsed {
  max-height: 4.5em;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom,
      black 0,
      black 2.5em,
      transparent 4.5em);
  mask-image: linear-gradient(to bottom,
      black 0,
      black 2.5em,
      transparent 4.5em);
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
   展开/折叠的高度变化不再补间。.is-collapsed 的 max-height 与渐变遮罩都是静态样式，
   停掉过渡后折叠态照样成立，内容不会因此多露出来。
   逐个列出，不写 `*` / `.process-section *` 通配，
   避免把 el-icon / MarkdownContent 内部 Element Plus 组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .thinking-section {
    animation: none;
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
