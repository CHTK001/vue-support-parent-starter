<template>
  <div class="sl" :class="{ 'is-inline': inline }" role="status" aria-live="polite">
    <span v-for="it in items" :key="it.key" class="sl-item" :title="it.title || it.label">
      <i class="sl-dot" :class="`is-${it.state}`"></i>
      <span class="sl-label">{{ it.label }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * 发布管理状态灯。
 *
 * <p>只显示「有能力数据」的项：没装、探测不到、或从没拿到过结果的一律不渲染，
 * 避免一排灰灯看起来像全挂了。绿=最近一次探测正常，黄=超周期没更新或已知异常。</p>
 *
 * <p>{@code inline} 用于并进底部指标条：去掉 fixed 定位与浮层阴影，
 * 变成一行普通的小灯，不再浮在右下角盖住内容。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
withDefaults(
  defineProps<{
    items: Array<{ key: string; label: string; state: 'ok' | 'warn'; title?: string }>;
    /** 并进指标条时使用（非浮层） */
    inline?: boolean;
  }>(),
  { inline: false },
);
</script>

<style scoped>
.sl {
  position: fixed;
  right: 18px;
  bottom: 16px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  font-size: 12px;
  color: var(--el-text-color-regular);
  user-select: none;
}
/* 并进底部指标条：跟着条内基线走，不占额外高度 */
.sl.is-inline {
  position: static;
  z-index: auto;
  flex: none;
  gap: 9px;
  padding: 0;
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  white-space: nowrap;
}
.sl-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.sl-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.sl-dot.is-ok {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.18);
}
.sl-dot.is-warn {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 3px rgba(230, 162, 60, 0.18);
}
.sl-label {
  line-height: 1;
}
</style>
