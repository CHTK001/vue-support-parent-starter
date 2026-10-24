<!--
  会话审计 · 方向「档案柜」

  这个方向认为：一条会话有 8 个字段，把它们藏在抽屉里等于没给 —— 用户点开才知道
  「关闭原因」写了什么，点一次只能看一条，比不了。

  所以左栏常驻列表、右栏常驻详情，一次点击的成本从「开抽屉 + 关抽屉」降到「换个焦点」。

  三个取舍：
    ① 列表压到两行（主机 / 用户 · 连接时刻），把宽度让给右栏。
       原来列表有 7 列，其中 5 列在右栏里读得更舒服。
    ② 右栏加一条「会话时长带」：起点是连接时刻、终点是关闭时刻（进行中则为现在）。
       时长这个数字本来就在，但 2h36m 是抽象量；一条带子能看出「这个会话横跨了整段早高峰」。
    ③ 不再有「详情」按钮 —— 选中即详情。键盘上下键可在栏内移动焦点（按钮原生行为）。
-->
<template>
  <div class="pk-split pk-grow">
    <!-- 左栏：列表 -->
    <div class="pk-rail">
      <div class="pk-rail__head">
        <ReInput v-model="keyword" placeholder="搜索主机 / 用户 / IP" prefix-icon="Search" clearable style="width: 100%" />
      </div>

      <div class="rail__filters">
        <div class="pk-seg" role="group" aria-label="按状态筛选">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="pk-seg__btn"
            :class="{ 'is-active': filters.status === tab.value }"
            :aria-pressed="filters.status === tab.value"
            @click="emit('filter', { status: tab.value })"
          >
            {{ tab.label }}<span class="pk-seg__count">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <div class="pk-rail__body">
        <div v-for="group in groups" :key="group.key">
          <div v-if="group.rows.length" class="pk-rail__group">
            <span>{{ group.label }}</span>
            <span class="pk-num">{{ group.rows.length }}</span>
          </div>
          <button
            v-for="row in group.rows"
            :key="row.id"
            type="button"
            class="pk-rail__item"
            :class="{ 'is-picked': row.id === active?.id }"
            :aria-current="row.id === active?.id ? 'true' : undefined"
            @click="pick(row.id)"
          >
            <span class="pk-rail__title">
              <i class="pk-dot" :class="row.isOpen ? 'pk-dot--live' : ''" />
              <span class="pk-ellipsis">{{ row.host }}</span>
            </span>
            <span class="pk-rail__meta">
              <span class="pk-ellipsis">{{ row.user }}</span>
              <span aria-hidden="true">·</span>
              <span class="pk-num">{{ row.connectText.slice(11, 16) }}</span>
              <span class="rail__dur pk-num">{{ row.durationText }}</span>
            </span>
          </button>
        </div>

        <div v-if="!rows.length" class="pk-empty">
          <span>{{ loading ? '正在读取…' : '没有符合条件的会话' }}</span>
        </div>
      </div>

      <div class="rail__foot">
        <button type="button" class="pk-link" :disabled="loading" @click="emit('refresh')">刷新</button>
        <span class="pk-bar__count">{{ appliedText }}</span>
      </div>
    </div>

    <!-- 右栏：详情 -->
    <div class="pk-detail">
      <template v-if="active">
        <div class="pk-detail__head">
          <div style="min-width: 0">
            <div class="detail__title pk-ellipsis">{{ active.host }}</div>
            <div class="pk-sub">{{ active.protocol }} · {{ active.user }} · {{ active.ip }}</div>
          </div>
          <span class="pk-state" style="margin-left: auto">
            <i class="pk-dot" :class="active.isOpen ? 'pk-dot--live' : ''" />
            {{ active.statusText }}
          </span>
        </div>

        <div class="pk-detail__body">
          <div class="pk-kv">
            <span class="pk-kv__label">连接时间</span>
            <span class="pk-kv__value pk-num">{{ active.connectText }}</span>

            <span class="pk-kv__label">关闭时间</span>
            <span class="pk-kv__value pk-num">{{ active.isOpen ? '— 会话仍在' : active.closeText }}</span>

            <span class="pk-kv__label">已持续</span>
            <span class="pk-kv__value pk-num detail__dur">{{ active.durationText }}</span>

            <span class="pk-kv__label">客户端</span>
            <span class="pk-kv__value pk-mono">{{ active.ip }}</span>

            <span class="pk-kv__label">关闭原因</span>
            <span class="pk-kv__value">{{ active.closeReason || (active.isOpen ? '—' : '未记录') }}</span>
          </div>

          <!-- 时长带：把这 2 小时 36 分放回当天的时间轴里 -->
          <div class="detail__band">
            <div class="detail__band-label">
              <span>会话在当天的时间位置</span>
              <span class="pk-num">{{ active.connectText.slice(11, 16) }} → {{ active.isOpen ? '现在' : active.closeText.slice(11, 16) }}</span>
            </div>
            <div v-if="activeGeometry" class="pk-band__axis detail__axis">
              <span
                class="pk-band__bar"
                :style="{
                  left: `${activeGeometry.leftPercent}%`,
                  width: `${activeGeometry.widthPercent}%`,
                  top: '6px',
                }"
              />
              <span v-if="nowPercent !== null" class="pk-band__now" :style="{ left: `${nowPercent}%` }" />
            </div>
            <div v-else class="detail__band-empty">
              连接时刻无法解析，这一条画不到时间轴上。
            </div>
            <div v-if="activeGeometry" class="pk-band__ticks">
              <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
            </div>
          </div>
        </div>

        <div class="pk-detail__foot">
          <ReButton v-if="active.isOpen" type="danger" @click="emit('close', active)">强制关闭</ReButton>
          <ReButton v-else disabled>已结束</ReButton>
        </div>
      </template>

      <div v-else class="pk-empty" style="flex: 1">
        <span>左侧选中一条会话</span>
        <span class="pk-empty__hint">
          筛选后如果当前这条不在结果里，会自动跳到第一条，不会留一块空白。
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  bandGeometry,
  hourOfDay,
  type SessionFilters,
  type SessionStats,
  type SessionStatusFilter,
  type SessionView,
} from './sessionView'

const props = defineProps<{
  /** 已筛选的会话（展示行） */
  rows: SessionView[]
  /** 全量统计 */
  stats: SessionStats
  /** 加载态 */
  loading: boolean
  /** 当前筛选条件 */
  filters: SessionFilters
  /** 当前时刻 */
  now: Date
}>()

const emit = defineEmits<{
  (e: 'filter', patch: Partial<SessionFilters>): void
  (e: 'refresh'): void
  (e: 'close', row: SessionView): void
}>()

const ticks = ['00', '04', '08', '12', '16', '20', '24']

const tabs = computed<Array<{ label: string; value: SessionStatusFilter; count: number }>>(() => [
  { label: '全部', value: '', count: props.stats.total },
  { label: '进行中', value: 'OPEN', count: props.stats.open },
  { label: '已结束', value: 'CLOSED', count: props.stats.closed },
])

const keyword = computed({
  get: () => props.filters.keyword,
  set: (v: string) => emit('filter', { keyword: v }),
})

/** 分组：进行中在前 —— 这是唯一需要立刻处理的一组 */
const groups = computed(() => [
  { key: 'open', label: '进行中', rows: props.rows.filter(r => r.isOpen) },
  { key: 'closed', label: '已结束', rows: props.rows.filter(r => !r.isOpen) },
])

/** 当前选中 id；为 null 时取第一条 */
const pickedId = ref<number | null>(null)

/**
 * 当前详情。
 *
 * <p>用「id 命中就取它，否则取第一条」而不是把整行对象存下来：刷新后行对象是新的，
 * 存对象会拿到永远不再更新的旧值；存 id 则能跟着新数据走。</p>
 */
const active = computed<SessionView | null>(() => {
  if (!props.rows.length) return null
  return props.rows.find(r => r.id === pickedId.value) ?? props.rows[0]!
})

/**
 * 选中一条。
 *
 * @param id 会话 id
 */
function pick(id: number): void {
  pickedId.value = id
}

/**
 * 筛选变化后，若当前选中的行已不在结果里，把 pickedId 同步到兜底的那一条。
 *
 * <p>不做这一步的话会出现「右栏显示 A、左栏没有 A」的状态 —— 用户以为自己选中了
 * 一个不存在的东西。只在确实不在结果里时才改，避免每次刷新都重置用户的选中。</p>
 */
watch(
  () => props.rows,
  rows => {
    if (!rows.length) {
      pickedId.value = null
      return
    }
    if (!rows.some(r => r.id === pickedId.value)) pickedId.value = rows[0]!.id
  },
  { immediate: true },
)

const activeGeometry = computed(() => (active.value ? bandGeometry(active.value) : null))

const nowPercent = computed(() => {
  const hour = hourOfDay(props.now)
  return hour === null ? null : (hour / 24) * 100
})

const appliedText = computed(() => {
  const shown = props.rows.length
  const total = props.stats.total
  return shown === total ? `${total} 条` : `${shown} / ${total} 条`
})
</script>

<style scoped>
.rail__filters {
  flex: none;
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 栏内的状态分段要能横向放下三项，故按容器宽度均分 */
.rail__filters .pk-seg {
  display: flex;
  width: 100%;
}

.rail__filters .pk-seg__btn {
  flex: 1 1 0;
  justify-content: center;
  padding: 0 4px;
}

.rail__dur {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
}

.rail__foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail__dur {
  font-weight: 600;
}

.detail__band {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail__band-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.detail__axis {
  height: 22px;
}

.detail__band-empty {
  padding: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
