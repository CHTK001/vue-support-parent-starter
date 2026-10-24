<!--
  会话审计 · 方向「工单台」

  这个方向把页面当成一张工单台：活儿是「扫读并找到一条」，所以一屏行数就是效率。

  三个取舍：
    ① 统计不单独占一行卡片 —— 三个数字直接挂进状态分段控件。原来的三宫格统计卡
       占了 88px 高度只为说「128 / 2 / 126」，而分段控件本来就要显示这三个名字，
       两件事并成一件。
    ② 筛选不再需要点「查询」。原来 form / applied 两份状态，用户改了条件忘了点查询
       就会以为筛选坏了；这里是本地数组过滤，边打字边出结果，两份状态合一。
    ③ 表格用 grid 行而不是 ReTable：列宽、行高、行尾操作都要压到极限，
       el-table 的单元格内边距与固定行高会把 38px 的行撑到 44px 以上。
       代价是没有内置分页 —— 但审计列表的规模是「一天几百条」，滚动比翻页快。

  数据完整性：主机、协议、用户、客户端 IP、连接时间、关闭时间、状态、关闭原因
  八个字段一个不少。时长与关闭原因是新增的派生展示（后端一直有，界面没给）。
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
    <span class="pk-bar__count">
      {{ appliedText }}
    </span>
    <ReButton icon="Refresh" layout="square" tip="刷新会话记录" :loading="loading" @click="emit('refresh')" />
  </div>

  <div class="pk-table pk-grow">
    <div class="pk-cells pk-hd" :style="cols">
      <span>主机 / 用户</span>
      <span>协议</span>
      <span>连接时间</span>
      <span>时长</span>
      <span>状态</span>
      <span style="text-align: right">操作</span>
    </div>

    <div class="pk-table__scroll">
      <div
        v-for="row in rows"
        :key="row.id"
        class="pk-cells pk-tr is-clickable"
        :style="cols"
        tabindex="0"
        role="button"
        :aria-label="`查看 ${row.host} 的会话详情`"
        @click="emit('detail', row)"
        @keydown.enter.prevent="emit('detail', row)"
        @keydown.space.prevent="emit('detail', row)"
      >
        <div style="min-width: 0">
          <div class="pk-strong pk-ellipsis">{{ row.host }}</div>
          <div class="pk-sub pk-ellipsis">{{ row.user }} · {{ row.ip }}</div>
        </div>
        <div>
          <span class="pk-proto" :class="`is-${row.protocolTone}`">{{ row.protocol }}</span>
        </div>
        <div class="pk-num pk-dim">{{ row.connectText }}</div>
        <div class="pk-num" :class="{ 'pk-live': row.isOpen }">{{ row.durationText }}</div>
        <div>
          <span class="pk-state">
            <i class="pk-dot" :class="row.isOpen ? 'pk-dot--live' : ''" />
            {{ row.statusText }}
          </span>
        </div>
        <div class="pk-ops" @click.stop>
          <button type="button" class="pk-link" @click="emit('detail', row)">详情</button>
          <button
            v-if="row.isOpen"
            type="button"
            class="pk-link pk-link--danger"
            @click="emit('close', row)"
          >强制关闭</button>
        </div>
      </div>

      <div v-if="!rows.length" class="pk-empty">
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
  /** 全量统计，用于分段控件上的计数 */
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

/** 列定义只写一次，表头与数据行共用，避免两处漂移 */
const cols = {
  '--pk-cols': 'minmax(0, 1.5fr) 56px minmax(0, 1fr) 64px 86px 112px',
  '--pk-min-w': '660px',
}

/** 分段选项：名字与计数成对出现，所以不需要额外的统计卡 */
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

/** 四个控件的双向绑定统一走 filter 事件，页面只持有单一状态源 */
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

/** 右侧口径：说明「看到的行数」与「总数」的关系，避免用户以为丢了数据 */
const appliedText = computed(() => {
  const shown = props.rows.length
  const total = props.stats.total
  return shown === total ? `共 ${total} 条` : `筛选出 ${shown} / ${total} 条`
})
</script>

<style scoped>
/* 本画布没有自有样式：协议色块与「进行中」高亮已收进 RePageKit 的
   .pk-proto / .pk-live，四个画布共用一份，不在这里重复定义。 */
</style>
