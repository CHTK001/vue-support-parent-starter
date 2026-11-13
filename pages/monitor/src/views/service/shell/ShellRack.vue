<script setup lang="ts">
/**
 * 服务管理 —— 三栏工作台（左栏清单 / 中间工作区 / 右侧检查器）
 *
 * <p>左栏自己带统计与筛选（不再横跨顶部一条工具条），节点行两行信息，工作区页签上方
 * 常驻节点摘要条，右栏从「固定快捷面板」改成「跟着选中节点走的检查器」。</p>
 *
 * <p>三栏都能收：左栏收起只剩计数条，右栏收起只剩一条竖边。窄屏时右栏自动让位，
 * 保证工作区不低于可读宽度。</p>
 */
import ReIcon from '@repo/ui/re-icon'
import SvcStatBar from './SvcStatBar.vue'
import SvcNodeList from './SvcNodeList.vue'
import SvcWorkspace from './SvcWorkspace.vue'
import SvcInspector from './SvcInspector.vue'
import type { SvcShellProps } from './context'

const props = defineProps<SvcShellProps>()
</script>

<template>
  <div class="rack" :class="{ 'is-rail-folded': props.ctx.railCollapsed }">
    <!-- 左栏：统计 + 状态页签 + 协议分组清单 -->
    <aside class="rack-rail" :class="{ 'is-collapsed': props.ctx.railCollapsed }">
      <template v-if="props.ctx.railCollapsed">
        <div class="rack-strip">
          <button type="button" class="rack-strip__count" title="展开服务列表" @click="props.ctx.toggleRail()">
            <b>{{ props.ctx.vm.visibleCards.length }}</b>
            <span>/{{ props.ctx.vm.cards.length }}</span>
          </button>
          <span class="rack-strip__dots">
            <i class="is-run" :title="`运行中 ${props.ctx.vm.statusCounts.running}`" />
            <i class="is-err" :title="`异常 ${props.ctx.vm.statusCounts.error}`" />
          </span>
          <span class="rack-strip__gap" />
          <button type="button" class="rack-strip__toggle" title="展开服务列表" @click="props.ctx.toggleRail()">
            <ReIcon name="ArrowRight" :size="13" />
          </button>
        </div>
      </template>

      <template v-else>
        <SvcStatBar :ctx="props.ctx" layout="rail" />

        <div class="rack-tabs">
          <button
            v-for="tab in props.ctx.statusTabs"
            :key="tab.value"
            type="button"
            class="rack-tab"
            :class="{ 'is-active': props.ctx.vm.status === tab.value }"
            :aria-pressed="props.ctx.vm.status === tab.value"
            @click="props.ctx.vm.status = tab.value"
          >
            <i class="sv-dot" :class="tab.dot" />
            <span>{{ tab.label }}</span>
            <b class="sv-mono">{{ tab.count }}</b>
          </button>
        </div>

        <div class="rack-groups">
          <SvcNodeList :ctx="props.ctx" mode="list" />
        </div>

        <button type="button" class="rack-foot" title="收起服务列表" @click="props.ctx.toggleRail()">
          <ReIcon name="ArrowLeft" :size="12" />
          <span>收起</span>
        </button>
      </template>
    </aside>

    <!-- 中间：工作区 -->
    <SvcWorkspace :ctx="props.ctx" show-summary />

    <!-- 右栏：检查器 -->
    <SvcInspector v-if="props.ctx.dockOpen" :ctx="props.ctx" />
    <button v-else type="button" class="rack-dock-fold" title="展开检查器" @click="props.ctx.toggleDock()">
      <ReIcon name="ArrowLeft" :size="13" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.rack {
  display: flex;
  flex: 1;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

/* ==================== 左栏 ==================== */

.rack-rail {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 268px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.rack-rail.is-collapsed {
  width: 46px;
}

.rack-strip {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  height: 100%;
}

.rack-strip__count {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  font: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.rack-strip__count b {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.rack-strip__count span {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.rack-strip__dots {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}

.rack-strip__dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-disabled);
}

.rack-strip__dots i.is-run {
  background: var(--status-success, var(--el-color-success));
}

.rack-strip__dots i.is-err {
  background: var(--status-error, var(--el-color-danger));
}

.rack-strip__gap {
  flex: 1;
}

.rack-strip__toggle,
.rack-foot {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.rack-strip__toggle {
  width: 26px;
  height: 26px;
  border-radius: var(--el-radius-md, 8px);
}

.rack-strip__toggle:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.rack-foot {
  flex: none;
  height: 30px;
  font: inherit;
  font-size: 11.5px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.rack-foot:hover {
  color: var(--el-color-primary);
}

/* 状态页签：2×2 方格（268px 的栏宽装不下四个中文标签一行） */
.rack-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: none;
  gap: 2px;
  padding: 4px 8px 8px;
}

.rack-tab {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 6px;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.rack-tab:hover {
  background: var(--el-fill-color-light);
}

.rack-tab.is-active {
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.rack-tab b {
  font-weight: 500;
  color: inherit;
  opacity: 0.75;
}

.rack-groups {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ==================== 右栏收起态 ==================== */

.rack-dock-fold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
}

.rack-dock-fold:hover {
  color: var(--el-color-primary);
}

/* 窄屏：右栏让位给工作区，检查器改由工具条入口打开 */
@media (width <= 1360px) {
  .rack > :deep(.sin) {
    display: none;
  }
}
</style>
