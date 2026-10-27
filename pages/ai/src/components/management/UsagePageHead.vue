<template>
  <!--
    用量管理 · 页头（三个变体共享）

    <p>原 {@code UsagePage.vue} 的 RePageHead 段原样抽出（实时状态 + 时间胶囊 +
    自定义区间 + 导出/刷新 + 刷新流光），行为全部由 {@code board}（各变体
    {@code reactive(useUsageBoard())}）提供 —— 头部业务只有一份。</p>
  -->
  <RePageHead title="用量管理">
    <template #meta>
      <!-- 实时状态：微呼吸绿点 + 文案；有流量时补一枚速率胶囊 -->
      <div class="live-status" :class="`is-${board.liveState}`"
        :title="board.liveState === 'error' ? '实时连接失败，已退回手动刷新' : board.rangeLabel">
        <span class="live-dot" :class="{ 'is-pulsing': board.liveState === 'live' }" />
        <span class="live-text">{{ board.liveLabel }}</span>
        <span v-if="board.liveRate > 0" class="live-rate">{{ board.fmtToken(board.liveRate) }}/分</span>
        <!-- 暂停/恢复：图标开关，不占横向空间 -->
        <button type="button" class="live-toggle" :class="{ 'is-off': !board.liveEnabled }"
          :title="board.liveEnabled ? '暂停实时推送' : '恢复实时推送'" :aria-pressed="board.liveEnabled"
          @click="board.liveEnabled = !board.liveEnabled">
          <svg v-if="board.liveEnabled" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="7" y="5.5" width="3.4" height="13" rx="1.2" />
            <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8.5 5.6a1 1 0 0 1 1.52-.85l8.2 6.4a1 1 0 0 1 0 1.7l-8.2 6.4a1 1 0 0 1-1.52-.85V5.6Z" />
          </svg>
        </button>
      </div>
    </template>
    <template #actions>
      <!-- 胶囊时间切换 -->
      <div class="time-pills" role="tablist">
        <button v-for="f in board.quickFilters" :key="f.key" type="button" class="time-pill"
          role="tab" :class="{ active: board.activeFilter === f.key }"
          :aria-selected="board.activeFilter === f.key" @click="board.setQuickFilter(f.key)">
          {{ f.label }}
        </button>
      </div>
      <!-- 日历图标日期框 (已废弃，保留以兼容后续迁移) -->
      <el-date-picker
        v-model="board.customRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        class="date-picker"
        value-format="YYYY-MM-DD"
        @change="board.onCustomRange"
      />
      <!-- 导出 & 刷新图标按钮 -->
      <div class="action-buttons">
        <button type="button" class="icon-btn" title="导出当前区间用量" aria-label="导出" @click="board.handleExport">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3.5v11.2M7.6 10.4 12 14.8l4.4-4.4M4.5 19.5h15" />
          </svg>
        </button>
        <button type="button" class="icon-btn" title="刷新数据" aria-label="刷新" @click="board.refreshAll">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4.2v4.6h-4.6" />
          </svg>
        </button>
      </div>
    </template>
    <!-- 刷新进度条：贴页面头底边的一条 2px 流光。请求进行时才出现 -->
    <template #foot>
      <div class="refresh-bar" :class="{ 'is-on': board.refreshing }" aria-hidden="true"><i /></div>
    </template>
  </RePageHead>
</template>

<script setup lang="ts">
/**
 * 用量管理 · 页头（业务区块）。
 *
 * <p>props.board 由各变体 {@code reactive(useUsageBoard())} 注入。</p>
 */
import RePageHead from '@/components/re/RePageHead.vue';

defineProps<{ board: any }>();
</script>

<style scoped>
/* ============================================================================
   页头子元素样式 —— 原 UsagePage.vue 原样收敛，三个变体共用
   ============================================================================ */
/* 刷新流光：贴顶栏底边内侧，不占布局（absolute），只在请求期间出现 */
.refresh-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  overflow: hidden;
  opacity: 0;
  border-bottom-left-radius: var(--u-radius, 8px);
  border-bottom-right-radius: var(--u-radius, 8px);
  transition: opacity 0.2s var(--ease-out, ease);
  pointer-events: none;
}
.refresh-bar.is-on { opacity: 1; }
.refresh-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  width: 34%;
  background: linear-gradient(90deg, transparent 0%, var(--u-primary) 45%, var(--u-primary) 55%, transparent 100%);
  animation: refresh-slide 1.1s ease-in-out infinite;
}
@keyframes refresh-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(320%); }
}

/* 实时状态：绿点微呼吸 + 文案 + 速率胶囊 + 暂停/恢复按钮 */
.live-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.live-dot {
  width: 7px; height: 7px; flex-shrink: 0;
  border-radius: 999px;
  background: var(--el-text-color-placeholder);
}
.live-dot.is-pulsing {
  background: var(--u-success);
  animation: live-breathe 2.2s ease-in-out infinite;
}
@keyframes live-breathe {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--u-success) 42%, transparent); }
  50% { opacity: 0.68; box-shadow: 0 0 0 5px color-mix(in srgb, var(--u-success) 0%, transparent); }
}
.live-status.is-error { border-color: color-mix(in srgb, var(--u-warning) 48%, transparent); }
.live-status.is-error .live-dot { background: var(--u-warning); }
.live-status.is-paused { opacity: 0.75; }
.live-text { font-weight: 600; color: var(--el-text-color-primary); }
.live-rate {
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--u-primary) 12%, transparent);
  color: var(--u-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.live-toggle {
  appearance: none; border: 0; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; padding: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--el-text-color-secondary);
  transition: color var(--el-transition-duration-fast, 0.2s) ease, background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.live-toggle svg { width: 11px; height: 11px; }
.live-toggle:hover { color: var(--u-primary); background: color-mix(in srgb, var(--u-primary) 12%, transparent); }
.live-toggle.is-off { color: var(--u-warning); }

/* 胶囊时间切换：选中态为实底 + 白字 */
.time-pills {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}
.time-pill {
  appearance: none; border: 0; cursor: pointer;
  padding: 5px 13px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  background: transparent;
  transition: color var(--el-transition-duration-fast, 0.2s) ease, background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.time-pill:hover { color: var(--u-primary); background: color-mix(in srgb, var(--u-primary) 8%, transparent); }
.time-pill.active {
  background: var(--u-primary);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 6px var(--u-primary-shadow, rgba(22, 93, 255, 0.28));
}

/* 单个日期框：日历图标 + 区间文本合成一个输入框 */
.date-picker { width: 250px; }
.date-picker :deep(.el-range-editor.el-input__wrapper) {
  height: 32px;
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}
.date-picker :deep(.el-range-editor.el-input__wrapper.is-active) {
  box-shadow: 0 0 0 1px var(--u-primary) inset;
}
.date-picker :deep(.el-range-input) { font-size: 12.5px; }
.date-picker :deep(.el-range-separator) { font-size: 12px; color: var(--el-text-color-placeholder); }

/* 导出 / 刷新图标按钮 */
.action-buttons { display: inline-flex; align-items: center; gap: 6px; }
.icon-btn {
  appearance: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  transition: color var(--el-transition-duration-fast, 0.2s) ease, border-color var(--el-transition-duration-fast, 0.2s) ease, background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.icon-btn svg { width: 16px; height: 16px; }
.icon-btn:hover {
  color: var(--u-primary);
  border-color: color-mix(in srgb, var(--u-primary) 40%, transparent);
  background: color-mix(in srgb, var(--u-primary) 6%, var(--el-bg-color));
}
.icon-btn:active { transform: translateY(1px); }
</style>