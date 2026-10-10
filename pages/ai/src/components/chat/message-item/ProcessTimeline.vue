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
          <MessageToolCalls :tool-calls="item.toolCalls || []" :tool-responses="item.toolResponses"
            :is-streaming="isStreaming" />
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

defineEmits<{
  click: [event: MouseEvent];
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

/* 中间叙述文本：比最终回答弱化一档，强调它是过程而非结论 */
.timeline-text {
  color: var(--el-text-color-secondary);
}
</style>
