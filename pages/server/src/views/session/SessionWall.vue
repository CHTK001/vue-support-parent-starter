<!--
  会话审计 · 方向「卡片墙」

  这个方向认为：一条会话的信息量是「8 个短字段」，摊平成一行的多列反而最难读 ——
  列一多，眼睛要在同一行上左右跳；而一张卡片里字段是纵向排的，读起来是一条线。

  所以卡片不是「表格的缩略图」，而是**完整的**一条会话：8 个字段全在卡上，
  不点开也知道关闭原因是什么。这是与「工单台」最大的分工差异 ——
  工单台为了行数牺牲字段（详情要点开），卡片墙为了字段牺牲行数。

  取舍：
    ① 卡片高度不统一（关闭原因可能很长），用 grid 的 auto 行高，
       同排卡片自动对齐到最高那张，不做等高压缩（压缩就要截断）。
    ② 关闭原因用两行截断 + title：卡片里最长的字段是它，放任它撑开会让网格跳动。
-->
<template>
  <div class="pk-bar">
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

    <span class="pk-bar__sep" />

    <ReInput
      v-model="keyword"
      placeholder="搜索主机 / 用户 / IP"
      prefix-icon="Search"
      clearable
      style="width: 200px"
    />
    <ReSelect v-model="protocol" :options="protocolOptions" placeholder="协议" style="width: 104px" />
    <ReInput v-model="ip" placeholder="客户端 IP" clearable style="width: 132px" />

    <span class="pk-bar__spacer" />
    <span class="pk-bar__count">{{ appliedText }}</span>
    <ReButton icon="Refresh" layout="square" tip="刷新会话记录" :loading="loading" @click="emit('refresh')" />
  </div>

  <div class="pk-grow wall">
    <div v-if="rows.length" class="pk-cards">
      <article
        v-for="row in rows"
        :key="row.id"
        class="pk-card"
        tabindex="0"
        role="button"
        :aria-label="`查看 ${row.host} 的会话详情`"
        @click="emit('detail', row)"
        @keydown.enter.prevent="emit('detail', row)"
        @keydown.space.prevent="emit('detail', row)"
      >
        <header class="pk-card__head">
          <span class="pk-card__title">{{ row.host }}</span>
          <span class="pk-proto" :class="`is-${row.protocolTone}`">{{ row.protocol }}</span>
        </header>

        <div class="card__fields">
          <span class="card__k">用户</span>
          <span class="card__v">{{ row.user }}</span>

          <span class="card__k">客户端</span>
          <span class="card__v pk-mono">{{ row.ip }}</span>

          <span class="card__k">连接</span>
          <span class="card__v pk-num">{{ row.connectText }}</span>

          <span class="card__k">关闭</span>
          <span class="card__v pk-num">{{ row.isOpen ? '— 仍在' : row.closeText }}</span>

          <span class="card__k">时长</span>
          <span class="card__v pk-num" :class="{ 'pk-live': row.isOpen }">{{ row.durationText }}</span>

          <span class="card__k">原因</span>
          <span class="card__v card__reason" :title="row.closeReason || undefined">
            {{ row.closeReason || (row.isOpen ? '—' : '未记录') }}
          </span>
        </div>

        <footer class="pk-card__foot">
          <span class="pk-state">
            <i class="pk-dot" :class="row.isOpen ? 'pk-dot--live' : ''" />
            {{ row.statusText }}
          </span>
          <button
            v-if="row.isOpen"
            type="button"
            class="pk-link pk-link--danger"
            @click.stop="emit('close', row)"
          >强制关闭</button>
          <span v-else class="pk-faint">编号 {{ row.id }}</span>
        </footer>
      </article>
    </div>

    <div v-else class="wall__empty">
      <div class="pk-empty">
        <span>{{ loading ? '正在读取会话记录…' : '没有符合条件的会话' }}</span>
        <span v-if="!loading" class="pk-empty__hint">
          换个关键字，或者把状态切回「全部」试试。
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SessionFilters, SessionStats, SessionStatusFilter, SessionView } from './sessionView'

const props = defineProps<{
  /** 已筛选的会话（展示行） */
  rows: SessionView[]
  /** 全量统计 */
  stats: SessionStats
  /** 加载态 */
  loading: boolean
  /** 当前筛选条件 */
  filters: SessionFilters
}>()

const emit = defineEmits<{
  (e: 'filter', patch: Partial<SessionFilters>): void
  (e: 'refresh'): void
  (e: 'detail', row: SessionView): void
  (e: 'close', row: SessionView): void
}>()

const tabs = computed<Array<{ label: string; value: SessionStatusFilter; count: number }>>(() => [
  { label: '全部', value: '', count: props.stats.total },
  { label: '进行中', value: 'OPEN', count: props.stats.open },
  { label: '已结束', value: 'CLOSED', count: props.stats.closed },
])

const protocolOptions = [
  { label: '全部协议', value: '' },
  { label: 'SSH', value: 'SSH' },
  { label: 'RDP', value: 'RDP' },
  { label: 'VNC', value: 'VNC' },
]

const keyword = computed({
  get: () => props.filters.keyword,
  set: (v: string) => emit('filter', { keyword: v }),
})
const protocol = computed({
  get: () => props.filters.protocol,
  set: (v: string) => emit('filter', { protocol: v }),
})
const ip = computed({
  get: () => props.filters.ip,
  set: (v: string) => emit('filter', { ip: v }),
})

const appliedText = computed(() => {
  const shown = props.rows.length
  const total = props.stats.total
  return shown === total ? `共 ${total} 条` : `筛选出 ${shown} / ${total} 条`
})
</script>

<style scoped>
/* 网格容器自己滚动：卡片数量可能远超一屏，页面本身不该跟着长 */
.wall {
  overflow: auto;
  padding-right: 2px;
}

.wall__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* 卡片里的字段表：两列，左列窄右列吃掉剩余宽度 */
.card__fields {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 5px 10px;
  font-size: 12px;
  align-items: baseline;
}

.card__k {
  color: var(--el-text-color-placeholder);
}

.card__v {
  min-width: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 关闭原因是卡片里唯一可能很长的字段：允许两行，但不超过两行 */
.card__reason {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
  line-height: 1.45;
}

</style>
