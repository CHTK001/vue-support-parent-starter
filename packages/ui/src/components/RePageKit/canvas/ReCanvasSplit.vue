<!--
  ReCanvasSplit —— 「档案柜」方向的左栏列表 + 右栏详情

  为什么不再用抽屉：一条记录往往有七八个字段，抽屉点开才知道等于把「它有这么多字段」
  这件事藏起来了；而且点一次只能看一条，比不了。常驻右栏把点击成本从
  「开抽屉 + 关抽屉」降到「换个焦点」。

  画布负责：布局、选中态、分组、窄屏堆叠、空态。
  页面负责：栏内一条长什么样（`rail-item`）、详情长什么样（`detail`）、底部操作（`detail-actions`）。

  分组交给页面而不是画布：不同页面分组依据完全不同（按状态 / 按类型 / 按到期档），
  画布不猜。
-->
<template>
  <div class="pk-split pk-grow">
    <div class="pk-rail" :style="railStyle">
      <div v-if="$slots['rail-head']" class="pk-rail__head">
        <slot name="rail-head" />
      </div>

      <div class="pk-rail__body">
        <template v-for="group in groups" :key="group.key">
          <div v-if="group.rows.length" class="pk-rail__group">
            <span>{{ group.label }}</span>
            <span class="pk-num">{{ group.rows.length }}</span>
          </div>
          <button
            v-for="row in group.rows"
            :key="rowKey(row)"
            type="button"
            class="pk-rail__item"
            :class="{ 'is-picked': rowKey(row) === activeKey }"
            :aria-current="rowKey(row) === activeKey ? 'true' : undefined"
            @click="emit('pick', rowKey(row))"
          >
            <slot name="rail-item" :row="row" :picked="rowKey(row) === activeKey" />
          </button>
        </template>

        <div v-if="!rows.length" class="pk-empty">
          <span>{{ loading ? '正在读取…' : emptyText }}</span>
        </div>
      </div>

      <div v-if="$slots['rail-foot']" class="pk-rail__foot">
        <slot name="rail-foot" />
      </div>
    </div>

    <div class="pk-detail">
      <template v-if="active">
        <div class="pk-detail__head">
          <slot name="detail-head" :row="active" />
        </div>
        <div class="pk-detail__body">
          <slot name="detail" :row="active" />
        </div>
        <div v-if="$slots['detail-actions']" class="pk-detail__foot">
          <slot name="detail-actions" :row="active" />
        </div>
      </template>

      <div v-else class="pk-empty" style="flex: 1">
        <span>{{ emptyText }}</span>
        <span v-if="emptyHint" class="pk-empty__hint">{{ emptyHint }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasGroup } from './types'

/** 行类型 */
type KeyedRow = Record<string, unknown>

const props = withDefaults(
  defineProps<{
    /** 全量行（用于判断选中项是否还在结果里） */
    rows: KeyedRow[]
    /** 已分好组的行 */
    groups: CanvasGroup[]
    /** 行唯一键 */
    rowKey: (row: KeyedRow) => string | number
    /** 当前选中键 */
    activeKey?: string | number | null
    /** 左栏宽度（px），默认 250 */
    railWidth?: number
    /** 加载态 */
    loading?: boolean
    /** 空态主文案 */
    emptyText?: string
    /** 空态引导文案 */
    emptyHint?: string
  }>(),
  { activeKey: null, railWidth: 250, loading: false, emptyText: '没有记录' },
)

const emit = defineEmits<{
  (e: 'pick', key: string | number): void
}>()

/**
 * 当前详情行。
 *
 * <p>用「键命中就取它」而不是由页面传整行对象：刷新后行对象是新的，
 * 传对象会拿到不再更新的旧值；传键则始终跟着最新数据走。</p>
 */
const active = computed<KeyedRow | null>(() => {
  if (props.activeKey === null || props.activeKey === undefined) return null
  return props.rows.find(r => props.rowKey(r) === props.activeKey) ?? null
})

const railStyle = computed(() => ({ '--pk-rail-w': `${props.railWidth}px` }))
</script>

<style scoped>
/* 栏底操作条 */
.pk-rail__foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
