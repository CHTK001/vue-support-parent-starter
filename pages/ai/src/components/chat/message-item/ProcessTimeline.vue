<template>
  <!--
    步骤时间线：把「检索 / 思考 / 中间叙述 / 工具调用」按发生顺序交织成一条时间线。

    数据来自 flattenContentsForTimeline(contents)，顺序即原始发生顺序：
    search → think → content → tool（每个 content 块内部如此，块之间按时间先后拼接）。

    与旧渲染的区别：不再把 content 抽成正文、think/tool 收进折叠过程组，
    而是全部按序就地渲染，便于看清 Agent 每一步在做什么。
  -->
  <div class="process-timeline">
    <template v-for="item in items" :key="item.id">
      <!-- 在线检索 -->
      <div v-if="item.type === 'search' && showProcess" class="timeline-row">
        <span class="timeline-rail"><el-icon size="14"><Search16Filled /></el-icon></span>
        <div class="timeline-body">
          <MessageSearchSection :search-results="item.searchResults || []"
            :is-searching="item.source.state?.isSearching || false" :search-query="item.searchQuery" />
        </div>
      </div>

      <!-- 思考 -->
      <div v-else-if="item.type === 'think' && showProcess" class="timeline-row">
        <span class="timeline-rail"><el-icon size="14"><BrainCircuit20Regular /></el-icon></span>
        <div class="timeline-body">
          <MessageThinkingSection :reasoning-content="item.reasoningContent || ''"
            :is-thinking="item.source.state?.isThinking || false"
            :is-streaming="item.source.state?.isStreaming || false"
            :thinking-duration-ms="item.source.thinkingDurationMs ?? item.source.metadata?.thinkingDurationMs"
            :metadata="item.source.metadata" />
        </div>
      </div>

      <!--
        叙述文本（= AI 回复正文）。

        collapsible-content 开启时（会话页）：默认只占一行，折叠箭头就在时间线左侧的图标位，
        鼠标经过才浮出，点击箭头或整行都能展开全文（用户口径 2026-11-16）。
        流式期间默认展开，保证答案边生成边可读；用户手动点过之后以手动状态为准。
        SessionTracePage 不传该开关，轨迹页仍按原文全量渲染。
      -->
      <div v-else-if="item.type === 'content'" class="timeline-row timeline-row--content"
        :class="{ 'is-open': isContentOpen(item) }">
        <!-- 左侧图标位：平时是原来的正文图标，鼠标经过/聚焦/展开时换成折叠箭头
             （收起 → 右向，展开 → 旋转 90°，与工具行同一套「> → v」语义） -->
        <span v-if="collapsibleContent" class="timeline-rail timeline-rail--toggle" role="button" tabindex="0"
          :aria-expanded="isContentOpen(item)"
          :aria-label="isContentOpen(item) ? t('common.collapse') : t('common.expand')"
          :title="isContentOpen(item) ? t('common.collapse') : t('common.expand')"
          @click="toggleContent(item)"
          @keydown.enter.prevent="toggleContent(item)"
          @keydown.space.prevent="toggleContent(item)">
          <el-icon class="timeline-rail__glyph" size="13"><TextAlignLeft20Regular /></el-icon>
          <el-icon class="timeline-toggle" :class="{ 'is-open': isContentOpen(item) }" size="14">
            <ChevronRight12Regular />
          </el-icon>
        </span>
        <span v-else class="timeline-rail"><el-icon size="13"><TextAlignLeft20Regular /></el-icon></span>
        <div class="timeline-body">
          <!-- 收起态：单行预览。整行都可点（命中区远大于 14px 箭头） -->
          <div v-show="!isContentOpen(item)" class="timeline-content-line" @click="toggleContent(item)">
            <span class="timeline-content-line__preview">{{ contentPreview(item) }}</span>
          </div>
          <!-- 展开态：完整 Markdown；那一行预览已隐藏，不再和正文重复 -->
          <MarkdownContent v-show="isContentOpen(item)" class="message-item__text markdown-text timeline-text"
            :content="item.content || ''" @click="$emit('click', $event)" />
        </div>
      </div>

      <!-- 工具调用 -->
      <div v-else-if="item.type === 'tool' && showProcess" class="timeline-row">
        <span class="timeline-rail"><el-icon size="14"><Wrench24Filled /></el-icon></span>
        <div class="timeline-body">
          <MessageToolCalls :key="toolSignature(item)" :tool-calls="item.toolCalls || []" :tool-responses="item.toolResponses"
            :is-streaming="isStreaming" @abort="$emit('abort')" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElIcon } from 'element-plus';
import { Search16Filled, BrainCircuit20Regular, Wrench24Filled } from '@vicons/fluent';
import { TextAlignLeft20Regular, ChevronRight12Regular } from '@vicons/fluent';
import type { DisplayItem } from '@/utils/messageUtils';
import MessageThinkingSection from './MessageThinkingSection.vue';
import MessageToolCalls from './MessageToolCalls.vue';
import MessageSearchSection from './MessageSearchSection.vue';
import { MarkdownContent } from '@/components/ui';

const props = withDefaults(defineProps<{
  items: DisplayItem[];
  isStreaming?: boolean;
  /** 是否展示思考/工具/检索等过程行（叙述文本始终展示） */
  showProcess?: boolean;
  /**
   * 叙述文本是否默认收成一行（悬停出折叠箭头、点击展开）。
   * 默认关闭：轨迹页等只读视图要看全文，不能多一次点击。
   */
  collapsibleContent?: boolean;
}>(), {
  // 默认全展示，避免调用方忘传导致过程行整段消失（TurnItem 会显式传摘要条状态）
  showProcess: true,
  isStreaming: false,
  collapsibleContent: false,
});

const { t } = useI18n();

// 展开正文时锁住滚动锚点：一段长回复展开会把视口顶走，用户找不到刚才看的那一行
const lockScrollAnchor = inject<() => void>('lockScrollAnchor', () => {});

// 折叠状态用两个集合表达「用户显式展开 / 显式收起」，
// 都没记过时再看是否正在流式（流式默认展开，结束后回到一行）。
const contentOpenIds = ref<Set<string>>(new Set());
const contentClosedIds = ref<Set<string>>(new Set());

const isContentOpen = (item: DisplayItem): boolean => {
  // 不走折叠口径时不参与任何显隐判断：正文永远全量显示
  if (!props.collapsibleContent) return true;
  const id = String(item.id);
  if (contentOpenIds.value.has(id)) return true;
  if (contentClosedIds.value.has(id)) return false;
  return props.isStreaming === true;
};

const toggleContent = (item: DisplayItem): void => {
  if (!props.collapsibleContent) return;
  const id = String(item.id);
  if (isContentOpen(item)) {
    contentOpenIds.value.delete(id);
    contentClosedIds.value.add(id);
    return;
  }
  contentClosedIds.value.delete(id);
  contentOpenIds.value.add(id);
  lockScrollAnchor();
};

/**
 * 单行预览：去掉 Markdown 记号后的第一段人话。
 *
 * <p>代码块整段丢掉——单行预览里塞代码没有信息量，还会把后面那句人话挤没；
 * 图片同理只留空位；链接只保留可读文字。</p>
 */
const contentPreview = (item: DisplayItem): string => {
  const raw = String(item.content || '').trim();
  if (!raw) return '';
  const plain = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain || raw.replace(/\s+/g, ' ').slice(0, 120);
};

// 父级只在收到新内容时重建 props，接收用到的字段拍平后作为子组件的刷新键：
// 流式期间工具行的 arguments / result / outcome 都是**就地增量修改**的，
// `item` 对象本身的引用不变，直接传 `item.toolCalls` 会让子组件插槽编译出的
// 判值缓存看不见变化——表现为「执行中输出一直停留在首帧」。
const toolSignature = (item: DisplayItem): string => {
  const rows = (item.toolCalls || []) as any[];
  let sig = '';
  for (const r of rows) {
    sig += `${r?.name || ''}|${(r?.arguments || '').length}|${(r?.result || '').length}|${r?.outcome || ''};`;
  }
  return sig;
};

defineEmits<{
  click: [event: MouseEvent];
  /** 终止本轮执行：运行中工具行展开后的「停止」按钮（需求 7/8） */
  abort: [];
}>();
</script>

<style scoped>
.process-timeline {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 2px 0;
}

.timeline-rail {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 24px;
  color: var(--el-text-color-secondary);
}

.timeline-body {
  flex: 1;
  min-width: 0;
}

/* 叙述文本：这是用户真正要读的 AI 回答正文，用主文字色（2026-11-12 用户报障：
   回答被当成「过程」弱化成 #94a3b8，太淡、发灰，看久了眼睛不舒服）。
   弱化色只留给检索 / 思考 / 工具这些过程行。 */
.timeline-text {
  color: var(--el-text-color-primary);
  line-height: 1.7;
}

/* ---- 回复正文的单行折叠（用户口径 2026-11-16） ----------------------------
   左侧图标位平时就是原来那个「正文」图标；鼠标经过该行（或键盘聚焦、或已展开）
   才换成折叠箭头。箭头收起时右向，展开后旋转 90°，与工具行「> → v」同一套语义。
   触屏没有 hover，箭头常驻，否则手机上找不到展开入口。 */
.timeline-rail--toggle {
  position: relative;
  cursor: pointer;
  border-radius: var(--el-radius-sm, 6px);
  outline: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.timeline-rail--toggle:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.timeline-rail--toggle:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 两个图标叠在同一个 18×24 的图标位里，靠 opacity 换脸，不改变行高与对齐 */
.timeline-rail--toggle .timeline-rail__glyph,
.timeline-rail--toggle .timeline-toggle {
  position: absolute;
  inset: 0;
  margin: auto;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}

.timeline-rail__glyph {
  opacity: 1;
}

.timeline-toggle {
  opacity: 0;
}

.timeline-row--content:hover .timeline-rail__glyph,
.timeline-row--content:focus-within .timeline-rail__glyph,
.timeline-rail--toggle[aria-expanded='true'] .timeline-rail__glyph {
  opacity: 0;
}

.timeline-row--content:hover .timeline-toggle,
.timeline-row--content:focus-within .timeline-toggle,
.timeline-toggle.is-open {
  opacity: 1;
}

.timeline-toggle.is-open {
  transform: rotate(90deg);
}

@media (hover: none) {
  .timeline-rail__glyph {
    opacity: 0;
  }

  .timeline-toggle {
    opacity: 1;
  }
}

/* 收起态的一行预览：不换行、超出省略。整行是点击区，所以给个手型。 */
.timeline-content-line {
  min-width: 0;
  cursor: pointer;
  user-select: none;
}

.timeline-content-line__preview {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.7;
}

@media (prefers-reduced-motion: reduce) {
  .timeline-rail__glyph,
  .timeline-toggle {
    transition: none;
  }
}
</style>
