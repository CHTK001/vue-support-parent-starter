<template>
  <aside class="dms-rail" :class="{ 'is-single': single }">
    <div class="dms-rail__summary">
      <span class="dms-rail__n-total">{{ total }}</span>
      <span class="dms-rail__n-label">个配置组 · {{ configured }} 配置</span>
    </div>

    <nav class="dms-rail__nav" aria-label="配置分组">
      <button
        v-for="g in groups"
        :key="g.group"
        type="button"
        class="dms-rail__item"
        :class="{ 'is-on': g.group === active }"
        @click="$emit('select', g.group)"
        :aria-current="g.group === active ? 'true' : undefined"
      >
        <span class="dms-rail__dot" :data-state="g.group === active ? 'active' : (g.configured ? 'on' : 'off')" />
        <span class="dms-rail__name">{{ g.groupName }}</span>
        <span v-if="g.count" class="dms-rail__count">{{ g.count }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
/**
 * Ledger 布局的左侧分组锚点导航。
 * 圆点语义：active=当前锚定项；on=已配置有值；off=未配置。
 * 点击即锚定到右边对应的分组卡片。
 */
defineOptions({ name: 'DmsGroupNavRail' })
defineProps<{
  groups: Array<{ group: string; groupName: string; configured: boolean; count?: number }>
  active: string
  /** 单分组模式（独立配置页）：只显示该组，不展示锚点列表 & 统计 */
  single?: boolean
  total?: number
  configured?: number
}>()
defineEmits<{ select: [group: string] }>()
</script>

<style scoped>
.dms-rail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: none;
  width: 172px;
}

.dms-rail__summary {
  padding: 9px 10px;
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.dms-rail__n-total { font-size: 17px; font-weight: 700; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.dms-rail__n-label { font-size: 11.5px; color: var(--el-text-color-secondary); }

.dms-rail__nav { display: flex; flex-direction: column; gap: 2px; }

.dms-rail__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  border-radius: var(--el-radius-lg, 12px);
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}
.dms-rail__item:hover { background: var(--el-fill-color, #f7f8fa); color: var(--el-text-color-primary); }
.dms-rail__item.is-on {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
}

.dms-rail__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.dms-rail__dot[data-state='on'] { background: var(--el-color-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent); }
.dms-rail__dot[data-state='off'] { background: var(--el-border-color); }
.dms-rail__dot[data-state='active'] { background: var(--el-color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent); }

.dms-rail__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dms-rail__count {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 820px) {
  .dms-rail.is-single { width: 100%; }
}
</style>
