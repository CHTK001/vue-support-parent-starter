<script setup lang="ts">
/**
 * 方向 C —— 控制台（Console）
 *
 * <p>先看态势，再看节点：顶部整条运行态势（运行 / 异常 / 停止 / 插件 / 页签），
 * 下面左树右工作区。树用单行紧凑行，一屏能装更多节点；工作区永远是主角，
 * 页签上方的摘要条提供当前节点上下文。</p>
 *
 * <p>与机架的区别不只是位置：机架把「筛选」压在左栏里、把检查器固定在右侧；
 * 控制台把「态势」提到顶部整条，右栏取消，把宽度让给详情与流水线，最近活动
 * 收成底部一条横向流——排障时不用在右侧面板与详情之间来回。</p>
 */
import ReIcon from '@repo/ui/re-icon'
import SvcStatBar from './SvcStatBar.vue'
import SvcNodeList from './SvcNodeList.vue'
import SvcWorkspace from './SvcWorkspace.vue'
import SvcActivity from './SvcActivity.vue'
import type { SvcShellProps } from './context'

const props = defineProps<SvcShellProps>()
</script>

<template>
  <div class="console">
    <SvcStatBar :ctx="props.ctx" layout="ribbon" />

    <div class="console-body">
      <!-- 左树：协议分组 + 紧凑节点行 -->
      <aside class="console-tree" :class="{ 'is-collapsed': props.ctx.railCollapsed }">
        <div v-if="props.ctx.railCollapsed" class="console-strip">
          <button type="button" title="展开节点树" @click="props.ctx.toggleRail()">
            <b class="sv-mono">{{ props.ctx.vm.visibleCards.length }}</b>
            <ReIcon name="ArrowRight" :size="13" />
          </button>
        </div>

        <template v-else>
          <div class="console-tree__head">
            <span>服务节点</span>
            <span class="sv-mono">{{ props.ctx.vm.visibleCards.length }}/{{ props.ctx.vm.cards.length }}</span>
            <button type="button" title="收起节点树" @click="props.ctx.toggleRail()">
              <ReIcon name="ArrowLeft" :size="12" />
            </button>
          </div>

          <div class="console-status">
            <button
              v-for="tab in props.ctx.statusTabs"
              :key="tab.value"
              type="button"
              :class="{ 'is-active': props.ctx.vm.status === tab.value }"
              @click="props.ctx.vm.status = tab.value"
            >
              <i class="sv-dot" :class="tab.dot" />
              <span>{{ tab.label }}</span>
              <b class="sv-mono">{{ tab.count }}</b>
            </button>
          </div>

          <div class="console-nodes">
            <SvcNodeList :ctx="props.ctx" mode="tree" />
          </div>
        </template>
      </aside>

      <SvcWorkspace :ctx="props.ctx" show-summary />
    </div>

    <footer class="console-foot">
      <SvcActivity :ctx="props.ctx" mode="strip" :limit="7" />
      <div class="console-quick">
        <button type="button" @click="props.ctx.vm.refresh()" :disabled="props.ctx.vm.loading">
          <ReIcon name="RefreshRight" :size="12" /><span>刷新</span>
        </button>
        <button type="button" @click="props.ctx.vm.openCreate()">
          <ReIcon name="Plus" :size="12" /><span>新增</span>
        </button>
        <button type="button" @click="props.ctx.openRoomEntrance()">
          <ReIcon name="Connection" :size="12" /><span>P2P 房间</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.console {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

.console-body {
  display: flex;
  flex: 1;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

/* ==================== 左树 ==================== */

.console-tree {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 248px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.console-tree.is-collapsed {
  width: 44px;
}

.console-strip {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.console-strip button {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 6px 2px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.console-strip button:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.console-strip b {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.console-tree__head {
  display: flex;
  gap: 6px;
  align-items: center;
  flex: none;
  padding: 8px 8px 6px 11px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.console-tree__head span:first-child {
  flex: 1;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.console-tree__head button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.console-tree__head button:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

/* 状态：2×2 方格，248px 的树栏装不下四个中文标签一行 */
.console-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: none;
  gap: 1px;
  padding: 0 8px 8px;
}

.console-status button {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 4px;
  font: inherit;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter, #fafafa);
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.console-status button.is-active {
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.console-status b {
  font-weight: 500;
  opacity: 0.75;
}

.console-nodes {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ==================== 底部 ==================== */

.console-foot {
  display: flex;
  flex: none;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  min-width: 0;
}

.console-quick {
  display: flex;
  flex: none;
  gap: 4px;
}

.console-quick button {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  cursor: pointer;
}

.console-quick button:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.console-quick button:disabled {
  cursor: progress;
  opacity: 0.5;
}

@media (width <= 1180px) {
  .console-tree {
    width: 210px;
  }
}
</style>
