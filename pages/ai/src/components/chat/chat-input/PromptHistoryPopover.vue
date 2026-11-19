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
      <div class="ph-caption-row">
        <div class="ph-caption">{{ t('chat.input.historyTitle') }}</div>
        <!-- 批量删除入口：只有存在可删的本机历史时出现；进入选择模式后行点击变为勾选 -->
        <button v-if="localCount" type="button" class="ph-select-toggle" :class="{ 'is-on': selecting }"
          @click="toggleSelectMode">
          {{ selecting ? t('chat.input.historySelectExit') : t('chat.input.historySelectEnter') }}
        </button>
      </div>

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
          :class="{ 'is-active': row.index === activeIndex, 'is-selecting': selecting }" role="option"
          :aria-selected="row.index === activeIndex" @click="onRowClick(row)"
          @mouseenter="$emit('update:active-index', row.index)">
          <!-- 选择模式：本机条目给勾选框；会话消息（非 local）不可选，仍走键盘选中 -->
          <span v-if="selecting && row.item.local" class="ph-item__ck"
            :class="{ 'is-on': selectedIds.has(row.item.id) }" role="checkbox"
            :aria-checked="selectedIds.has(row.item.id)" @click.stop="toggleRow(row.item.id)" />
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

      <!-- 批量操作条：仅选择模式出现；删除确认与实际删除由父级处理 -->
      <div v-if="selecting" class="ph-batch">
        <button type="button" class="ph-batch__ghost" :disabled="!localCount || selectedIds.size === localCount"
          @click="selectAllLocal">{{ t('chat.input.historySelectAll') }}</button>
        <span class="ph-batch__count">{{ t('chat.input.historySelectedCount', { n: selectedIds.size }) }}</span>
        <span class="ph-batch__spacer" />
        <button type="button" class="ph-batch__danger" :disabled="!selectedIds.size" @click="removeSelected">
          {{ t('chat.input.historyDeleteSelected') }}
        </button>
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

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:active-index': [value: number]
  pick: [index: number]
  'load-more': []
  remove: [id: string]
  /** 批量删除本机历史：确认与实际删除由父级处理 */
  'remove-many': [ids: string[]]
}>()

/** 过滤词：只匹配当前已加载条目的文本，纯本地过滤（不发请求） */
const filter = ref('')

/** 批量删除的选择模式：开启后行点击变为勾选（仅本机条目可选） */
const selecting = ref(false)
/** 已勾选的本机历史记录主键 */
const selectedIds = ref<Set<string>>(new Set())

/** 可删除的本机条目数（会话消息不带 local 标记，不参与批量删除） */
const localCount = computed(() => props.items.filter((item) => item.local).length)

/** 浮层每次打开都清掉上次的过滤词与选择状态，避免「上次的操作还悄悄生效」 */
watch(() => props.visible, (v) => {
  if (v) {
    filter.value = ''
    selecting.value = false
    selectedIds.value = new Set()
  }
})

/** 条目刷新（如批量删除完成）后，把已不存在的记录从勾选集合里剔除 */
watch(() => props.items, () => {
  if (!selectedIds.value.size) return
  const alive = new Set(props.items.filter((item) => item.local).map((item) => item.id))
  const next = new Set([...selectedIds.value].filter((id) => alive.has(id)))
  if (next.size !== selectedIds.value.size) selectedIds.value = next
})

function toggleSelectMode(): void {
  selecting.value = !selecting.value
  selectedIds.value = new Set()
}

/** 行点击：选择模式下勾选本机条目，否则维持原有的「选中填回草稿」 */
function onRowClick(row: { item: HistoryItem; index: number }): void {
  if (selecting.value && row.item.local) {
    toggleRow(row.item.id)
    return
  }
  emit('pick', row.index)
}

function toggleRow(id: string): void {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

/** 全选已加载的本机条目 */
function selectAllLocal(): void {
  selectedIds.value = new Set(props.items.filter((item) => item.local).map((item) => item.id))
}

/** 把勾选集合交给父级删除；确认通过前条目不动，勾选保持 */
function removeSelected(): void {
  if (!selectedIds.value.size) return
  emit('remove-many', [...selectedIds.value])
}

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

/* 标题行：标题 + 右侧「批量删除 / 退出选择」入口 */
.ph-caption-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 6px;
}

.ph-select-toggle {
  flex: none;
  padding: 3px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.ph-select-toggle:hover {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
  color: var(--text-secondary, var(--color-text));
}

.ph-select-toggle.is-on {
  color: var(--el-color-primary);
}

/* 选择模式的勾选框：本机条目才有；勾中填充主色并画对勾 */
.ph-item__ck {
  flex: none;
  position: relative;
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-default, var(--el-border-color));
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}

.ph-item__ck:hover {
  border-color: var(--el-color-primary);
}

.ph-item__ck.is-on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}

.ph-item__ck.is-on::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 3px;
  height: 7px;
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

/* 批量操作条：全选 / 已选计数 / 删除所选，贴在列表与快捷键说明之间 */
.ph-batch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 6px 8px 2px;
  border-top: 1px solid var(--border-default, var(--el-border-color-lighter));
}

.ph-batch__ghost {
  padding: 2px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary, var(--el-text-color-primary));
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.ph-batch__ghost:hover:not(:disabled) {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
}

.ph-batch__count {
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

.ph-batch__spacer {
  flex: 1 1 auto;
}

.ph-batch__danger {
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--el-color-danger, #f56c6c);
  font-size: 11.5px;
  line-height: 16px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.ph-batch__danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 12%, transparent);
}

.ph-batch__danger:disabled {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  cursor: default;
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
  .ph-more,
  .ph-select-toggle,
  .ph-item__ck,
  .ph-batch__ghost,
  .ph-batch__danger {
    transition: none;
  }
}
</style>
