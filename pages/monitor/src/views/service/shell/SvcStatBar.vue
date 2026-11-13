<script setup lang="ts">
/**
 * 服务管理 —— 统计与筛选条
 *
 * <p>三档摆法：{@code inline} 贴着清单顶部一行装下（台账）、{@code rail} 压在左栏里
 * （机架）、{@code ribbon} 铺成整条运行态势（控制台）。三档读的是同一份
 * {@code vm.statusCounts / vm.stats}，不各自再算一遍。</p>
 */
import ReIcon from '@repo/ui/re-icon'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import ReButton from '@repo/ui/re-button'
import type { SvcShellProps } from './context'

const props = withDefaults(defineProps<SvcShellProps & { layout?: 'inline' | 'rail' | 'ribbon' }>(), {
  layout: 'inline',
})

/** 左轨排序选项：排障时最常用「异常优先」，默认仍按名称 */
const sortOptions = [
  { label: '按名称', value: 'name' },
  { label: '按端口', value: 'port' },
  { label: '异常优先', value: 'status' },
]
</script>

<template>
  <div class="ssb" :class="`is-${props.layout}`">
    <!-- 运行态势：大数字只在 inline / ribbon 出现，rail 用胶囊计数 -->
    <div class="ssb-nums">
      <div class="ssb-big">
        <b class="sv-mono">{{ props.ctx.vm.statusCounts.running }}</b>
        <span class="sv-mono">/ {{ props.ctx.vm.stats.total }}</span>
        <em>运行中</em>
      </div>
      <div v-if="props.layout === 'ribbon'" class="ssb-tiles">
        <div class="ssb-tile">
          <span>异常</span>
          <b class="sv-mono" :class="{ 'is-err': props.ctx.vm.statusCounts.error }">{{ props.ctx.vm.statusCounts.error }}</b>
        </div>
        <div class="ssb-tile">
          <span>已停止</span>
          <b class="sv-mono">{{ props.ctx.vm.statusCounts.stopped }}</b>
        </div>
        <div class="ssb-tile">
          <span>已挂插件</span>
          <b class="sv-mono">{{ props.ctx.vm.stats.plugins }}</b>
        </div>
        <div class="ssb-tile">
          <span>页签</span>
          <b class="sv-mono">{{ props.ctx.tabCount }}</b>
        </div>
      </div>
    </div>

    <!-- 分布条：宽度就是占比；为 0 的一段不渲染，避免留下一条 2px 细线 -->
    <div class="ssb-dist" :title="props.ctx.distTitle">
      <span v-if="props.ctx.vm.statusCounts.running" class="ssb-seg is-run" :style="{ flex: props.ctx.vm.statusCounts.running }" />
      <span v-if="props.ctx.vm.statusCounts.error" class="ssb-seg is-err" :style="{ flex: props.ctx.vm.statusCounts.error }" />
      <span v-if="props.ctx.vm.statusCounts.stopped" class="ssb-seg is-stop" :style="{ flex: props.ctx.vm.statusCounts.stopped }" />
      <span v-if="!props.ctx.vm.stats.total" class="ssb-seg is-none" />
    </div>

    <!-- 筛选：空关键字/空协议就是「不筛」，故 clearable 而不是加一个「全部」选项 -->
    <div class="ssb-search">
      <ReInput
        v-model="props.ctx.vm.keyword"
        aria-label="搜索服务"
        placeholder="名称 / 端口 / 报错关键字"
        clearable
        prefix-icon="Search"
      />
    </div>
    <div class="ssb-proto">
      <ReSelect
        v-model="props.ctx.vm.protocol"
        aria-label="按协议筛选"
        :data="props.ctx.vm.protocolOptions"
        placeholder="全部协议"
        clearable
      />
    </div>

    <!-- 左轨专用：排序。清单只有一列，排序放这里比再开一条工具条省地方 -->
    <div v-if="props.layout === 'rail'" class="ssb-sort">
      <ReSelect
        :model-value="props.ctx.sortBy"
        aria-label="节点排序"
        :data="sortOptions"
        @update:model-value="(v: any) => props.ctx.setSort(v as any)"
      />
    </div>

    <div class="ssb-ops">
      <ReButton icon="Connection" show-text tip="打开 P2P 房间工作台" @click="props.ctx.openRoomEntrance()">P2P 房间</ReButton>
      <ReButton icon="Plus" layout="square" type="primary" tip="新增服务" @click="props.ctx.vm.openCreate()" />
      <ReButton icon="Refresh" layout="square" tip="刷新" :loading="props.ctx.vm.loading" @click="props.ctx.vm.refresh()" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.ssb {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 9px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.ssb-nums {
  display: flex;
  gap: 14px;
  align-items: center;
  flex: none;
}

.ssb-big {
  display: flex;
  gap: 5px;
  align-items: baseline;
  white-space: nowrap;
}

.ssb-big b {
  font-size: 19px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.ssb-big span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ssb-big em {
  font-size: 11px;
  font-style: normal;
  color: var(--el-text-color-secondary);
}

.ssb-dist {
  display: flex;
  gap: 2px;
  flex: 1 1 90px;
  min-width: 60px;
  max-width: 220px;
  height: 6px;
  overflow: hidden;
  background: var(--el-fill-color);
  border-radius: 999px;
}

.ssb-seg {
  min-width: 3px;
  border-radius: 999px;
}

.ssb-seg.is-run {
  background: var(--status-success, var(--el-color-success));
}

.ssb-seg.is-err {
  background: var(--status-error, var(--el-color-danger));
}

.ssb-seg.is-stop {
  background: var(--el-text-color-disabled);
}

.ssb-seg.is-none {
  flex: 1;
  background: var(--el-border-color-lighter);
}

.ssb-search {
  flex: 1 1 180px;
  min-width: 120px;
  max-width: 320px;
}

.ssb-proto {
  flex: none;
  width: 148px;
}

.ssb-sort {
  flex: 1 1 100%;
  order: 7;
  min-width: 0;
}

.ssb-ops {
  display: flex;
  gap: 6px;
  align-items: center;
  flex: none;
  margin-left: auto;
}

.ssb-tiles {
  display: flex;
  gap: 0;
  align-items: stretch;
}

.ssb-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 14px;
  border-left: 1px solid var(--el-border-color-lighter);
}

.ssb-tile span {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.ssb-tile b {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.ssb-tile b.is-err {
  color: var(--el-color-danger);
}

/* ==================== 左栏（机架） ==================== */

.ssb.is-rail {
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border: 0;
  border-radius: 0;
}

.ssb.is-rail .ssb-nums {
  width: 100%;
  justify-content: space-between;
}

.ssb.is-rail .ssb-big b {
  font-size: 16px;
}

.ssb.is-rail .ssb-dist {
  flex: 1 1 100%;
  max-width: none;
  order: 3;
}

.ssb.is-rail .ssb-search {
  flex: 1 1 100%;
  max-width: none;
  order: 4;
}

.ssb.is-rail .ssb-proto {
  flex: 1 1 100%;
  width: auto;
  order: 5;
}

.ssb.is-rail .ssb-ops {
  order: 6;
  margin-left: 0;
}

/* ==================== 态势条（控制台） ==================== */

.ssb.is-ribbon {
  padding: 12px 14px;
}

.ssb.is-ribbon .ssb-big b {
  font-size: 24px;
}

/* 窄屏：任何一档都退化成两行，搜索框独占一行 */
@media (width <= 1400px) {
  .ssb.is-inline {
    flex-wrap: wrap;
  }

  .ssb.is-inline .ssb-search {
    flex: 1 1 100%;
    max-width: none;
    order: 9;
  }
}
</style>
