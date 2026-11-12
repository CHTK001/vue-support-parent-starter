<script setup lang="ts">
/**
 * 服务管理 —— 工作区（ReTabs 页签 + 节点上下文条）
 *
 * <p>页签本身是三种外壳的唯一共识：详情、过滤器链、P2P 房间都住在这里，
 * 关闭页签等于卸载内容（房间因此能自己 leave 并断开 WebSocket）。外壳只决定
 * 它占多大地方、要不要在页签上方常驻一条节点摘要。</p>
 *
 * <p>摘要条解决的问题：页签标题只有一个名字，切到「过滤器链」后排障看不到
 * 状态与监听地址，只能切回详情确认。把这几项提到页签上方，切换时上下文不丢。</p>
 */
import { computed } from 'vue'
import ReIcon from '@repo/ui/re-icon'
import ReTabs from '@repo/ui/re-tabs'
import { RoomView } from '@pages/room'
import ScServerDetailDrawer from '../../../components/ScServerDetailDrawer.vue'
import type { ServiceNodeCard } from '../serviceView'
import type { SvcShellProps } from './context'

const props = withDefaults(
  defineProps<
    SvcShellProps & {
      /** 是否在页签上方常驻节点摘要条 */
      showSummary?: boolean
      /** 无页签时的引导文案 */
      emptyText?: string
    }
  >(),
  {
    showSummary: true,
    emptyText: '从左侧选择服务：单击选中，双击或右键打开详情；P2P 房间在 ROOM 节点行点连接图标打开',
  },
)

/** 当前激活的工作页签（页面状态里存的是 name，这里回查一次拿到节点上下文） */
const activeWorkTab = computed(() => props.ctx.openTabs.find(tab => tab.name === props.ctx.activeTab))

/** 摘要条指向的节点卡片 */
const summaryCard = computed<ServiceNodeCard | undefined>(() => {
  const id = activeWorkTab.value?.nodeId
  return id == null ? undefined : props.ctx.vm.cards.find((card: ServiceNodeCard) => card.id === id)
})
</script>

<template>
  <section class="sw">
    <!-- 节点上下文条：状态、监听、插件数、主操作，一眼可读 -->
    <div v-if="props.showSummary && summaryCard" class="sw-sum">
      <i class="sv-dot" :class="props.ctx.stateClassOf(summaryCard)" aria-hidden="true" />
      <b class="sw-sum__name sv-ellipsis">{{ summaryCard.name }}</b>
      <span class="sw-sum__status" :class="{ 'is-err': summaryCard.status === 'ERROR' }">
        {{ summaryCard.statusText }}
      </span>
      <span class="sw-sum__meta sv-mono sv-ellipsis">{{ summaryCard.listenText }}</span>
      <span class="sw-sum__meta sv-ellipsis">{{ summaryCard.protocolText }}</span>
      <span class="sw-sum__meta">
        <ReIcon name="Filter" :size="12" />
        {{ summaryCard.activeFilterCount }}/{{ summaryCard.filterCount }}
      </span>
      <span v-if="summaryCard.backendText" class="sw-sum__meta sv-ellipsis">{{ summaryCard.backendText }}</span>

      <span class="sw-sum__ops">
        <button
          type="button"
          :title="props.ctx.primaryLabel(summaryCard)"
          :disabled="props.ctx.vm.actingId === summaryCard.id"
          @click="props.ctx.runPrimary(summaryCard)"
        >
          <ReIcon :name="props.ctx.primaryIcon(summaryCard)" :size="13" />
          <span>{{ props.ctx.primaryLabel(summaryCard) }}</span>
        </button>
        <button type="button" title="过滤器链" @click="props.ctx.openTab(summaryCard, 'filter')">
          <ReIcon name="Filter" :size="13" />
        </button>
        <button type="button" title="操作日志" @click="props.ctx.openOperLog(summaryCard)">
          <ReIcon name="Document" :size="13" />
        </button>
        <button type="button" title="更多操作" @click="props.ctx.openCtxMenuFromButton($event, summaryCard)">
          <ReIcon name="MoreFilled" :size="13" />
        </button>
      </span>
    </div>

    <ReTabs
      :model-value="props.ctx.activeTab"
      class="sw-tabs"
      :tabs="props.ctx.openTabs"
      :context-menu="props.ctx.tabContextMenu"
      :empty-text="props.emptyText"
      @update:model-value="props.ctx.setActiveTab"
      @close="props.ctx.closeTab"
      @context-command="props.ctx.onTabCommand"
    >
      <template #default="{ tab }">
        <!-- 房间工作台：关闭页签即卸载，RoomView 自己 leave + 断开 WebSocket -->
        <RoomView
          v-if="props.ctx.kindOf(tab) === 'room'"
          :key="`${tab.name}:${props.ctx.reloadSeqOf(tab.name)}`"
          :room-id="props.ctx.roomIdOf(tab)"
          :server-url="props.ctx.serverUrlOf(tab)"
          @leave="props.ctx.closeTab(tab.name)"
        />
        <!-- 每个页签独立实例 + key 代次：刷新/重开页签时重建内容 -->
        <ScServerDetailDrawer
          v-else
          :key="`${tab.name}:${props.ctx.reloadSeqOf(tab.name)}`"
          embedded
          :initial-view="props.ctx.kindOf(tab) === 'filter' ? 'filter' : 'detail'"
          :node-id="props.ctx.nodeIdOf(tab)"
          :filter-types="props.ctx.vm.filterTypes"
          @changed="props.ctx.vm.refresh()"
          @open-detail-page="props.ctx.vm.openDetailPage"
        />
      </template>
    </ReTabs>
  </section>
</template>

<style scoped lang="scss">
.sw {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.sw-sum {
  display: flex;
  gap: 9px;
  align-items: center;
  flex: none;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sw-sum__name {
  max-width: 220px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sw-sum__status {
  flex: none;
  padding: 1px 7px;
  font-size: 11px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-radius: 999px;
}

.sw-sum__status.is-err {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.sw-sum__meta {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  max-width: 200px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.sw-sum__ops {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-left: auto;
}

.sw-sum__ops button {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  height: 26px;
  padding: 0 8px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.sw-sum__ops button:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.sw-sum__ops button:disabled {
  cursor: progress;
  opacity: 0.5;
}

.sw-tabs {
  flex: 1;
  min-height: 0;
}
</style>
