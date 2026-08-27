<script setup lang="ts">
/**
 * BaseNode —— 所有 X6 Vue 节点的共享视觉外壳
 *
 * 每个图形（start / llm / knowledge / ...）都是一个独立 SFC，组合本组件并传入
 * 自己的 icon / color / subtitle，实现「不同图形不同属性配置」。
 */
import { computed } from "vue";
import { resolveNodeType } from "../nodeTypes";

const props = defineProps<{
  /** 节点类型 */
  type?: string;
  /** 主标题 */
  text?: string;
  /** 副标题 / 描述（各图形自定义字段） */
  subtitle?: string;
  /** 颜色覆盖 */
  color?: string;
  /** 图标覆盖 */
  icon?: string;
  /** 是否高亮（选中 / 命中搜索） */
  active?: boolean;
}>();

const def = computed(() => resolveNodeType(props.type as never));
const color = computed(() => props.color ?? def.value.color);
const icon = computed(() => props.icon ?? def.value.icon);
</script>

<template>
  <div
    class="gn"
    :class="{ 'gn--active': active }"
    :style="{ '--gn-color': color }"
  >
    <div class="gn__badge">{{ icon }}</div>
    <div class="gn__body">
      <div class="gn__title">{{ text || def.label }}</div>
      <div v-if="subtitle" class="gn__sub">{{ subtitle }}</div>
    </div>
  </div>
</template>

<style scoped>
.gn {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 8px;
  background: color-mix(in srgb, var(--gn-color) 10%, #fff);
  border: 1.5px solid var(--gn-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.gn--active {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--gn-color) 35%, transparent);
}
.gn__badge {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #fff;
  background: var(--gn-color);
}
.gn__body {
  min-width: 0;
  flex: 1;
}
.gn__title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gn__sub {
  margin-top: 2px;
  font-size: 11px;
  color: #8a8f99;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
