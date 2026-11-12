<!--
  输入框的「历史提示」浮层。

  <p>会话页里按 ↑ 打开：列出本会话已经问过的消息（最新在前），↑↓ 在当前已加载的
  范围内切换，Enter 把选中的那条填回输入框当草稿（不直接发送）。</p>

  <p>分页在数据这一侧：列表底部（截图口径是列表上方）的「加载更多提示」向父级要更早
  一页消息，加载完条目追加到列表尾部。<b>方向键只在已加载的范围内切换</b>，到顶不
  自动翻页——翻页是一次网络请求，按键过程中静默发请求会让人以为按键失灵。</p>

  <p>键盘事件由 ChatInput 的编辑器统一接管（焦点始终在编辑器里，浮层只负责显示），
  所以这个组件没有 tabindex / keydown，避免两处抢焦点。</p>
-->
<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :anchor-el="anchorEl"
    match-anchor-width align="start" :max-height="380" popper-class="ph-popover">
    <div class="ph-panel">
      <div class="ph-caption">{{ t('chat.input.historyTitle') }}</div>

      <!-- 「加载更多提示」：还有更早的消息时出现在列表上方（与产品截图同一位置），
           点击后由父级拉上一页，条目追加到列表尾部。 -->
      <button v-if="hasMore" type="button" class="ph-more" :disabled="loading" @click="$emit('load-more')">
        <svg class="ph-more__chev" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <span>{{ loading ? t('chat.input.historyLoading') : t('chat.input.historyLoadMore') }}</span>
      </button>

      <div v-if="!items.length" class="ph-empty">{{ t('chat.input.historyEmpty') }}</div>
      <div v-else class="ph-list" role="listbox" :aria-label="t('chat.input.historyTitle')">
        <div v-for="(item, i) in items" :key="item.id" class="ph-item" :class="{ 'is-active': i === activeIndex }"
          role="option" :aria-selected="i === activeIndex" @click="$emit('pick', i)"
          @mouseenter="$emit('update:active-index', i)">
          <span class="ph-item__text">{{ item.text }}</span>
        </div>
      </div>

      <div class="ph-foot">
        <span>{{ t('chat.input.hintNavigate') }}</span>
        <span>{{ t('chat.input.hintSelect') }}</span>
        <span>{{ t('chat.input.hintClose') }}</span>
      </div>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CustomPopover from '../../ui/CustomPopover.vue'

const { t } = useI18n()

defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  /** 已加载的历史条目，最新在前 */
  items: Array<{ id: string; text: string }>
  /** 键盘高亮行 */
  activeIndex: number
  /** 还有更早的消息可加载 */
  hasMore: boolean
  /** 正在加载上一页 */
  loading: boolean
}>()

defineEmits<{
  'update:visible': [value: boolean]
  'update:active-index': [value: number]
  pick: [index: number]
  'load-more': []
}>()
</script>

<style scoped>
.ph-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 4px 2px 2px;
}

.ph-caption {
  padding: 4px 8px 6px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
}

/* 加载更多：整行可点，字号比条目小一号，位置在列表上方（与产品截图一致） */
.ph-more {
  display: flex;
  align-items: center;
  gap: 4px;
  width: calc(100% - 8px);
  margin: 0 4px 2px;
  padding: 4px 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11.5px;
  line-height: 18px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.ph-more:hover:not(:disabled) {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
  color: var(--text-secondary, var(--color-text));
}

.ph-more:disabled {
  cursor: default;
  opacity: 0.7;
}

.ph-more__chev {
  flex: none;
  width: 12px;
  height: 12px;
}

.ph-empty {
  padding: 10px 8px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 18px;
}

/* 条目不换行：历史是「找回之前问过什么」，一条一行扫起来才快 */
.ph-list {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
}

.ph-item {
  display: block;
  padding: 5px 8px;
  border-radius: 6px;
  color: var(--text-primary, var(--el-text-color-primary));
  font-size: 12.5px;
  line-height: 18px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.12s ease;
}

.ph-item.is-active {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 6%, transparent);
}

.ph-item__text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ph-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding: 6px 8px 2px;
  border-top: 1px solid var(--border-default, var(--el-border-color-lighter));
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-size: 11px;
  line-height: 16px;
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .ph-item,
  .ph-more {
    transition: none;
  }
}
</style>
