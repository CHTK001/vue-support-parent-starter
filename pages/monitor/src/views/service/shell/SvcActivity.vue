<script setup lang="ts">
/**
 * 服务管理 —— 最近活动
 *
 * <p>两种摆法：{@code list} 放进检查器里成段列出，{@code strip} 压成一条横向流
 * （控制台底部 / 台账页脚）。活动只记页面内动作，不落库——它是「刚才点了什么」的
 * 回路，不是审计台账，审计在操作日志里。</p>
 */
import ReIcon from '@repo/ui/re-icon'
import type { SvcShellProps } from './context'

const props = withDefaults(defineProps<SvcShellProps & { mode?: 'list' | 'strip'; limit?: number }>(), {
  mode: 'list',
  limit: 8,
})
</script>

<template>
  <div class="sac" :class="`is-${props.mode}`">
    <div v-if="props.mode === 'list'" class="sac-head">
      <span class="sac-title">最近活动</span>
      <button v-if="props.ctx.activities.length" type="button" class="sac-clear" @click="props.ctx.clearActivities()">
        清空
      </button>
    </div>

    <div v-if="props.ctx.activities.length" class="sac-list">
      <button
        v-for="it in props.ctx.activities.slice(0, props.limit)"
        :key="it.id"
        type="button"
        class="sac-item"
        :class="{ 'is-link': it.nodeId != null }"
        :title="it.text"
        @click="props.ctx.gotoActivity(it)"
      >
        <ReIcon :name="it.icon" :size="12" />
        <span class="sac-text sv-ellipsis">{{ it.text }}</span>
        <span class="sac-time sv-mono">{{ props.ctx.timeAgo(it.at) }}</span>
      </button>
    </div>
    <div v-else class="sac-empty">操作记录会显示在这里</div>
  </div>
</template>

<style scoped lang="scss">
.sac {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sac-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.sac-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}

.sac-clear {
  padding: 0;
  font: inherit;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.sac-clear:hover {
  color: var(--el-color-primary);
}

.sac-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.sac-item {
  display: flex;
  gap: 7px;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 5px 6px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: default;
}

.sac-item.is-link {
  cursor: pointer;
}

.sac-item.is-link:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.sac-item .re-icon,
.sac-item svg {
  flex: none;
  color: var(--el-text-color-secondary);
}

.sac-text {
  flex: 1;
  min-width: 0;
}

.sac-time {
  flex: none;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}

.sac-empty {
  padding: 8px 6px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

/* 横向流：控制台底部一条，超出横向滚动而不是撑高页面 */
.sac.is-strip {
  gap: 0;
}

.sac.is-strip .sac-list {
  flex-direction: row;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.sac.is-strip .sac-item {
  width: auto;
  max-width: 260px;
  flex: none;
  padding: 4px 9px;
  font-size: 11.5px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
}

.sac.is-strip .sac-empty {
  padding: 4px 2px;
}
</style>
