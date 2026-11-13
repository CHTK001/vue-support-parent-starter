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

      <!-- 叙述文本（始终可见，不随过程折叠） -->
      <div v-else-if="item.type === 'content'" class="timeline-row">
        <span class="timeline-rail"><el-icon size="13"><TextAlignLeft20Regular /></el-icon></span>
        <div class="timeline-body">
          <MarkdownContent class="message-item__text markdown-text timeline-text" :content="item.content || ''"
            @click="$emit('click', $event)" />
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
import { ElIcon } from 'element-plus';
import { Search16Filled, BrainCircuit20Regular, Wrench24Filled } from '@vicons/fluent';
import { TextAlignLeft20Regular } from '@vicons/fluent';
import type { DisplayItem } from '@/utils/messageUtils';
import MessageThinkingSection from './MessageThinkingSection.vue';
import MessageToolCalls from './MessageToolCalls.vue';
import MessageSearchSection from './MessageSearchSection.vue';
import { MarkdownContent } from '@/components/ui';

withDefaults(defineProps<{
  items: DisplayItem[];
  isStreaming?: boolean;
  /** 是否展示思考/工具/检索等过程行（叙述文本始终展示） */
  showProcess?: boolean;
}>(), {
  // 默认全展示，避免调用方忘传导致过程行整段消失（TurnItem 会显式传摘要条状态）
  showProcess: true,
  isStreaming: false,
});

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
</style>
