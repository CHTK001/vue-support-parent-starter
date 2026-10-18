<!--
  抓包会话面板

  原实现里会话列表是常驻的 300px 侧栏，且没有搜索 —— 会话一多只能靠翻页肉眼找。
  这里改成工作台的一个标签页：卡片网格 + 搜索 + 状态筛选 + 分页。

  搜索与筛选都在「已拉取的全量会话」上做（后端 sessions 接口没有 keyword 参数），
  所以不存在「只搜到当前页」的问题，见 useTshark 的 SESSION_FETCH_SIZE 说明。
-->
<template>
  <div class="tshark-panel">
    <div class="tshark-panel__tools">
      <ReInput
        class="tshark-sessions-filter"
        :model-value="keyword"
        placeholder="搜索会话名 / 网卡"
        clearable
        @update:model-value="onKeyword"
      >
        <template #prefix><ReIcon name="Search" :size="13" /></template>
      </ReInput>

      <ReTab
        class="session-seg"
        variant="capsule"
        nav-only
        :tabs="filterTabs"
        :model-value="filter"
        @update:model-value="onFilter"
      />

      <span class="tshark-panel__spacer"></span>
      <span class="tshark-dim session-summary">{{ summaryText }}</span>
      <ReButton icon="Refresh" layout="square" tip="刷新会话列表" @click="emit('refresh')" />
    </div>

    <div class="tshark-panel__body">
      <ReSkeleton :loading="loading" :count="4" :rows="2" animated>
        <div class="session-grid">
          <div
            v-for="s in sessions"
            :key="s.id"
            class="session-card"
            :class="{ 'is-active': s.id === activeId }"
            tabindex="0"
            @click="emit('select', s.id)"
            @keydown.enter="emit('select', s.id)"
          >
            <div class="session-card__head">
              <span class="session-card__dot" :class="s.captureStatus === 1 ? 'is-run' : 'is-stop'"></span>
              <span class="session-card__name" :title="sessionName(s)">{{ sessionName(s) }}</span>
              <ReTag :type="s.captureStatus === 1 ? 'success' : 'info'" effect="plain">
                {{ s.captureStatus === 1 ? '抓包中' : '已停止' }}
              </ReTag>
            </div>

            <div class="session-card__meta">
              <span class="tshark-mono session-card__iface" :title="s.captureInterface || ''">{{ s.captureInterface || '—' }}</span>
              <span class="session-card__stat">{{ s.packetCount ?? 0 }} 包</span>
              <span class="tshark-dim">{{ fmtTime(s.startTime) }}</span>
            </div>

            <div class="session-card__acts">
              <ReButton
                icon="Download"
                layout="square"
                tip="下载原始 pcap（用 Wireshark 打开）"
                @click.stop="emit('download', s.id, sessionName(s))"
              />
              <ReButton
                v-if="s.captureStatus === 1"
                icon="VideoPause"
                layout="square"
                tip="停止抓包"
                @click.stop="emit('stop', s.id)"
              />
              <ReButton
                icon="Delete"
                layout="square"
                type="danger"
                tip="删除会话"
                @click.stop="emit('remove', s.id)"
              />
            </div>
          </div>
        </div>

        <ReEmpty v-if="!loading && sessions.length === 0" :description="emptyText" layout="modern" />
      </ReSkeleton>
    </div>

    <div class="tshark-panel__foot">
      <RePagination
        small
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="(p: number) => emit('page-change', p)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TsharkSession, TsharkSessionFilter } from './types'

const props = defineProps<{
  /** 当前页要显示的会话（已由父级完成筛选 + 分页） */
  sessions: TsharkSession[]
  loading: boolean
  keyword: string
  filter: TsharkSessionFilter
  page: number
  pageSize: number
  /** 筛选后的会话数（分页 total） */
  total: number
  /** 后端返回的会话总数，可能大于已拉取条数 */
  backendTotal: number
  /** 已拉取到本地的会话数 */
  loadedCount: number
  /** 其中正在抓包的数量 */
  runningCount: number
  activeId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:keyword', v: string): void
  (e: 'update:filter', v: TsharkSessionFilter): void
  (e: 'page-change', page: number): void
  (e: 'select', id: number): void
  (e: 'stop', id: number): void
  (e: 'download', id: number, name: string): void
  (e: 'remove', id: number): void
  (e: 'refresh'): void
}>()

const filterTabs = [
  { name: 'all', label: '全部' },
  { name: 'running', label: '抓包中' },
  { name: 'stopped', label: '已停止' },
]

/**
 * 计数文案。
 *
 * 后端总数大于已拉取条数时明说「已加载 N/M」—— 否则用户会以为「全部只有 200 条」，
 * 而不是「这里只装了 200 条，剩下的得靠搜索或者去看后端分页」。
 */
const summaryText = computed(() => {
  const filtered = props.total
  const all = props.loadedCount
  const capped = props.backendTotal > all ? `（已加载 ${all}/${props.backendTotal}）` : ''
  const running = props.runningCount > 0 ? `，${props.runningCount} 个抓包中` : ''
  if (filtered === all) return `共 ${all} 个会话${running}${capped}`
  return `筛选出 ${filtered} / ${all} 个${running}${capped}`
})

const emptyText = computed(() =>
  props.keyword || props.filter !== 'all' ? '没有匹配的会话' : '暂无抓包会话，先在上方选择网卡开始抓包')

function onKeyword(v: unknown) {
  emit('update:keyword', v === null || v === undefined ? '' : String(v))
}
function onFilter(v: string) {
  emit('update:filter', (v || 'all') as TsharkSessionFilter)
}

function sessionName(s: TsharkSession): string {
  return s.sessionName || s.captureInterface || `会话 ${s.id}`
}

function fmtTime(t?: string | null): string {
  if (!t) return ''
  const d = t.includes('T') ? new Date(t) : new Date(t.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return t
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
</script>

<style scoped>
.session-seg {
  width: 232px;
  flex: none;
}
.session-summary {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.session-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(292px, 1fr));
  gap: 10px;
  align-content: start;
  padding: 2px;
}

/* 会话卡：静止态只有一圈描边（容器不加投影），选中由左侧强调条 + 浅主色底表达 */
.session-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 11px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.session-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: var(--el-color-primary);
  opacity: 0;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}
.session-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  background: var(--el-fill-color-light);
}
.session-card:hover::before { opacity: 0.5; }
/* 原生可点行：去掉默认轮廓，改用自绘焦点环 */
.session-card:focus-visible {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.session-card.is-active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}
.session-card.is-active::before { opacity: 1; }

.session-card__head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.session-card__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.session-card__dot.is-run {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 20%, transparent);
  /* 本组件的 scoped 样式里自带关键帧，不引用全局表里的同名动画：
     scoped 编译会对动画名做改写，跨文件的引用容易落空 */
  animation: session-pulse 2s ease-in-out infinite;
}
@keyframes session-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.session-card__dot.is-stop { background: var(--el-text-color-placeholder); }
.session-card__name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  min-width: 0;
}
.session-card__iface {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 55%;
  color: var(--el-text-color-regular);
}
.session-card__stat { flex: none; }

.session-card__acts {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-top: 2px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 1px;
}
</style>
