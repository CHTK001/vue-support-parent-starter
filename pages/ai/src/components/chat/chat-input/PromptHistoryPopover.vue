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

      <!-- 即时过滤：只筛当前已加载的条目（纯本地过滤，不发请求）；选中行高亮仍按原始序号对齐 -->
      <div class="ph-filter">
        <input v-model="filter" class="ph-filter__input" type="text" :placeholder="t('chat.input.historyFilter')"
          spellcheck="false">
        <button v-if="filter" type="button" class="ph-filter__clear" :title="t('chat.input.historyClearFilter')"
          @click="filter = ''">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </button>
      </div>

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
      <div v-else-if="!visibleItems.length" class="ph-empty">{{ t('chat.input.historyNoMatch') }}</div>
      <div v-else class="ph-list" role="listbox" :aria-label="t('chat.input.historyTitle')">
        <div v-for="row in visibleItems" :key="row.item.id" class="ph-item"
          :class="{ 'is-active': row.index === activeIndex }" role="option"
          :aria-selected="row.index === activeIndex" @click="$emit('pick', row.index)"
          @mouseenter="$emit('update:active-index', row.index)">
          <span class="ph-item__text">{{ row.item.text }}</span>
          <span v-if="row.item.createdAt" class="ph-item__time">{{ fmtTime(row.item.createdAt) }}</span>
          <!-- 单条删除只对本机历史开放：会话消息的删除走消息列表自己的入口 -->
          <button v-if="row.item.local" type="button" class="ph-item__del" :title="t('chat.input.historyDelete')"
            @click.stop="$emit('remove', row.item.id)">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" />
            </svg>
          </button>
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
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomPopover from '../../ui/CustomPopover.vue'

const { t } = useI18n()

/** 浮层条目：本机历史带写入时间与 local 标记（可单条删除）；会话消息只有文本 */
interface HistoryItem {
  id: string
  text: string
  createdAt?: number
  local?: boolean
}

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  /** 已加载的历史条目，最新在前 */
  items: HistoryItem[]
  /** 键盘高亮行（对应 items 的原始下标） */
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
  remove: [id: string]
}>()

/** 过滤词：只匹配当前已加载条目的文本，纯本地过滤（不发请求） */
const filter = ref('')

/** 浮层每次打开都清掉上次的过滤词，避免「上次搜的词还在悄悄筛」 */
watch(() => props.visible, (v) => {
  if (v) filter.value = ''
})

/**
 * 过滤后的可见条目。
 *
 * <p>每行携带 items 里的<b>原始下标</b>：pick / mouseenter 仍按原列表序号上报，
 * 父级的键盘导航（↑↓ 在 items 上移动）不因过滤而错位。</p>
 */
const visibleItems = computed(() => {
  const kw = filter.value.trim().toLowerCase()
  return props.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !kw || item.text.toLowerCase().includes(kw))
})

/**
 * 条目时间：当天只给时分，同年给「月-日 时:分」，更早带年份。
 *
 * @param ts 写入时间（毫秒）；缺失返回空串（不渲染）
 */
function fmtTime(ts?: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}-${md}`
}
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

/* 即时过滤：小输入框贴在标题下方，只筛当前已加载条目 */
.ph-filter {
  position: relative;
  margin: 0 4px 4px;
}

.ph-filter__input {
  width: 100%;
  height: 26px;
  padding: 0 24px 0 8px;
  border: 1px solid var(--border-default, var(--el-border-color));
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary, var(--el-text-color-primary));
  font-size: 12px;
  line-height: 18px;
  outline: none;
}

.ph-filter__input::placeholder {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}

.ph-filter__input:focus {
  border-color: var(--el-color-primary);
}

.ph-filter__clear {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  cursor: pointer;
}

.ph-filter__clear svg {
  width: 10px;
  height: 10px;
}

.ph-filter__clear:hover {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 6%, transparent);
  color: var(--text-primary, var(--el-text-color-primary));
}

/* 条目不换行：历史是「找回之前问过什么」，一条一行扫起来才快 */
.ph-list {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
}

.ph-item {
  display: flex;
  align-items: center;
  gap: 8px;
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
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 写入时间：弱化展示，当天时分 / 跨天月日 */
.ph-item__time {
  flex: none;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 10.5px;
  line-height: 14px;
  font-variant-numeric: tabular-nums;
}

/* 单条删除：悬停才显形，点击只删不选中 */
.ph-item__del {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease;
}

.ph-item__del svg {
  width: 10px;
  height: 10px;
}

.ph-item:hover .ph-item__del,
.ph-item__del:focus-visible {
  opacity: 1;
}

.ph-item__del:hover {
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 12%, transparent);
  color: var(--el-color-danger, #f56c6c);
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
