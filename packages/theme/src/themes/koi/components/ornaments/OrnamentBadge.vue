<script setup lang="ts">
/**
 * 头像挂件
 *
 * <p>放在任何 {@code position: relative} 的头像容器里，渲染当前佩戴的 avatar 槽饰品。
 * 未佩戴时什么都不输出（不占位、不触发请求）。</p>
 */
import { computed } from "vue";
import { ornamentWear } from "./store";

const props = withDefaults(
  defineProps<{
    /** 字号（px），决定挂件大小 */
    size?: number;
    /** 相对头像右上角的外扩距离（px） */
    offset?: number;
  }>(),
  { size: 14, offset: 2 },
);

const item = computed(() => ornamentWear.avatar);

const badgeStyle = computed<Record<string, string>>(() => ({
  fontSize: `${props.size}px`,
  color: item.value?.color || "#fff",
  top: `${-props.offset}px`,
  right: `${-props.offset}px`,
}));
</script>

<template>
  <span v-if="item" class="orn-badge" :style="badgeStyle" :title="item.name" aria-hidden="true">
    <img v-if="item.image" :src="item.image" alt="" />
    <template v-else>{{ item.glyph || "★" }}</template>
  </span>
</template>

<style scoped>
.orn-badge {
  position: absolute;
  z-index: 3;
  line-height: 1;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  user-select: none;
}

.orn-badge img {
  display: block;
  width: 1em;
  height: 1em;
  object-fit: contain;
}
</style>
