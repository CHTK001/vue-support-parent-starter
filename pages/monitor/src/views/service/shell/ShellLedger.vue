<script setup lang="ts">
/**
 * 方向 A —— 台账（Ledger）
 *
 * <p>把节点当台账看：一张带列头的表横扫名称、协议、监听、插件数、后端与状态；
 * 工作区放在表下方而不是右侧，双击行或点「查看详情」才把下半屏拉起来。
 * 适合「先找节点、再进详情」的日常巡检节奏，一屏能看到全部服务的对齐信息。</p>
 *
 * <p>右侧检查器在这个方向里让位：节点事实在表格列里已经读得到，省下的宽度
 * 全部给表格与工作区。快捷入口仍在行悬停、工具条与工作区摘要条上。</p>
 */
import SvcStatBar from './SvcStatBar.vue'
import SvcNodeList from './SvcNodeList.vue'
import SvcWorkspace from './SvcWorkspace.vue'
import SvcActivity from './SvcActivity.vue'
import type { SvcShellProps } from './context'

const props = defineProps<SvcShellProps>()
</script>

<template>
  <div class="ledger">
    <SvcStatBar :ctx="props.ctx" layout="inline" />

    <section class="ledger-list">
      <SvcNodeList :ctx="props.ctx" mode="table" />
    </section>

    <SvcWorkspace :ctx="props.ctx" show-summary empty-text="双击表中的服务打开详情；过滤器链与 P2P 房间都在这里开页签" />

    <footer class="ledger-foot">
      <SvcActivity :ctx="props.ctx" mode="strip" :limit="6" />
    </footer>
  </div>
</template>

<style scoped lang="scss">
.ledger {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

.ledger-list {
  flex: 1 1 34%;
  min-height: 132px;
  overflow: auto;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

/* 工作区在下半屏：比清单略高，详情/流水线才有地方铺开 */
.ledger :deep(.sw) {
  flex: 1.25 1 56%;
  min-height: 220px;
}

.ledger-foot {
  flex: none;
  padding: 2px 4px;
}
</style>
