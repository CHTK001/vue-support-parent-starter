<script setup lang="ts">
/**
 * ReIcon koi 主题 —— 图标组件（KoiSvgIcon / KoiGlobalIcon 移植）
 *
 * 渲染规则：
 *  - name 以 `koi-` 开头：本地 svg symbol（#icon-xxx use 引用）
 *  - 否则：element-plus 图标组件
 * 样式走主题令牌（--theme-* 变量）。
 */
import { computed } from "vue";
import { ElIcon } from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

defineOptions({ name: "ReIcon", inheritAttrs: true });

/** 本地 svg 前缀（与 koi 主题约定一致，koi- 开头的图标走 svg sprite） */
const SVG_PREFIX = "koi-";

const props = withDefaults(
  defineProps<{
    /** 图标名：`koi-xxx` 走本地 svg，其余走 element-plus 图标 */
    name?: string;
    /** 图标尺寸（px） */
    size?: number | string;
    /** 图标颜色 */
    color?: string;
  }>(),
  { name: "Sunny", size: 18, color: "" },
);

const isLocalSvg = computed(() => props.name.startsWith(SVG_PREFIX));

/** 本地 svg symbol 引用路径（去掉 koi- 前缀，拼 #icon-） */
const localHref = computed(() => `#icon-${props.name.slice(SVG_PREFIX.length)}`);

/** element-plus 图标组件 */
const elementIcon = computed(() => {
  const icons = ElementPlusIconsVue as Record<string, unknown>;
  return icons[props.name] ?? null;
});
</script>

<template>
  <ElIcon :size="size" :color="color" v-bind="$attrs">
    <!-- 本地 svg sprite -->
    <svg
      v-if="isLocalSvg"
      aria-hidden="true"
      class="re-icon__local"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <use :xlink:href="localHref" />
    </svg>
    <!-- element-plus 图标 -->
    <component :is="elementIcon" v-else />
  </ElIcon>
</template>

<style scoped lang="scss">
.re-icon__local {
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
  outline: none;
}
</style>
