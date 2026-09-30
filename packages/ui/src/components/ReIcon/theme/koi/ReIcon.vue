<script setup lang="ts">
/**
 * ReIcon koi 主题 —— 图标组件（KoiSvgIcon / KoiGlobalIcon 移植）
 *
 * 渲染规则（按优先级）：
 *  - name 以 `koi-` 开头：本地 svg symbol（#icon-xxx use 引用）
 *  - name 以 `ep:` 开头：解包为 element-plus 图标组件（ep:menu -> Menu）
 *  - name 以 `ri:`/`mdi:`/`carbon:`/`humbleicons:` 等 iconify 前缀开头：
 *    使用全局注册的 Iconify 渲染器（createContextApp 注册到 window.__reIcon.iconify）
 *  - 其余：element-plus 图标组件（支持 PascalCase / kebab-case 兼容）
 * 样式走主题令牌（--theme-* 变量）。
 */
import { computed, markRaw, type Component } from "vue";
import { ElIcon } from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

defineOptions({ name: "ReIcon", inheritAttrs: true });

/** 本地 svg 前缀（与 koi 主题约定一致，koi- 开头的图标走 svg sprite） */
const SVG_PREFIX = "koi-";

/** iconify 前缀正则：ep 单独走 EI，其余走 Iconify */
const iconifyReg = /^[a-z]{2,}:/;

const props = withDefaults(
  defineProps<{
    /** 图标名：`koi-xxx` 走本地 svg，`ep:xxx`/PascalCase 走 element-plus，其余前缀走 Iconify */
    name?: string;
    /** 图标尺寸（px） */
    size?: number | string;
    /** 图标颜色 */
    color?: string;
  }>(),
  { name: "Sunny", size: 18, color: "" },
);

const safeName = computed(() => (typeof props.name === "string" ? props.name : ""));

const isLocalSvg = computed(() => safeName.value.startsWith(SVG_PREFIX));

/** 本地 svg symbol 引用路径：svg sprite 的 id 为 icon-{文件名}（文件名已含 koi- 前缀） */
const localHref = computed(() => `#icon-${safeName.value}`);

/** 是否走 iconify 在线渲染（ri:/mdi:/carbon: 等，ep: 除外） */
const isIconify = computed(() => {
  if (isLocalSvg.value) return false;
  if (safeName.value.startsWith("ep:")) return false;
  return iconifyReg.test(safeName.value);
});

/** element-plus 图标组件：ep:xxx 解包 + PascalCase/kebab 兼容 */
const elementIcon = computed(() => {
  const icons = ElementPlusIconsVue as Record<string, unknown>;
  const raw = isLocalSvg.value ? "" : safeName.value;
  if (!raw) return null;
  let name = raw.startsWith("ep:") ? raw.slice(3) : raw;
  if (iconifyReg.test(name)) return null;
  if (icons[name]) return icons[name];
  // kebab-case -> PascalCase 兼容（ep:alarm-clock -> AlarmClock）
  const pascal = name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return icons[pascal] ?? null;
});

/** Iconify 渲染器（未注册时用占位，避免空白） */
const iconifyRenderer = computed<Component | null>(() => {
  if (!isIconify.value) return null;
  const w = typeof window !== "undefined" ? window : undefined;
  const reg = (w as unknown as { __reIcon?: { iconify?: Component } })?.__reIcon;
  return reg?.iconify ? markRaw(reg.iconify) : null;
});

/** 全局兜底图标：任何图标加载失败/不存在时，显示Menu图标，永远不空白 */
const fallbackIcon = computed(() => {
  if (isLocalSvg.value) return null;
  if (isIconify.value && iconifyRenderer.value) return null;
  if (elementIcon.value) return null;
  return (ElementPlusIconsVue as Record<string, unknown>).Menu as Component;
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
    <!-- iconify 在线渲染器（ri:/mdi:/carbon: 等前缀） -->
    <component :is="iconifyRenderer" :icon="props.name" v-else-if="isIconify && iconifyRenderer" />
    <!-- element-plus 图标 / 全局兜底图标 -->
    <component :is="elementIcon || fallbackIcon" v-else />
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
