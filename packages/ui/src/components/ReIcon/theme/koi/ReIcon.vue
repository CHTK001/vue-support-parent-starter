<script setup lang="ts">
/**
 * ReIcon koi 主题 —— 图标组件（KoiSvgIcon / KoiGlobalIcon 移植）
 *
 * 渲染规则（按优先级）：
 *  - name 以 `anim:` 开头：icons-animated 动画图标（`anim:<lib>:<icon>`，懒加载独立 chunk）
 *  - name 以 `koi-` 开头：本地 svg symbol（#icon-xxx use 引用）
 *  - name 以 `ep:` 开头：解包为 element-plus 图标组件（ep:menu -> Menu）
 *  - name 以 `ri:`/`mdi:`/`carbon:`/`humbleicons:` 等 iconify 前缀开头：
 *    使用全局注册的 Iconify 渲染器（createContextApp 注册到 window.__reIcon.iconify）
 *  - 其余：element-plus 图标组件（支持 PascalCase / kebab-case 兼容）
 * 样式走主题令牌（--theme-* 变量）。
 */
import { computed, markRaw, shallowRef, toRaw, watch, type Component } from "vue";
import { ElIcon } from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ANIMATED_ICON_PREFIX, isAnimatedIconName, loadAnimatedIcon } from "../../animated/registry";

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

/** 动画图标命名空间：`anim:<lib>:<icon>`（是否已注册另判断） */
const isAnimated = computed(() => safeName.value.startsWith(ANIMATED_ICON_PREFIX));

/** 该名字是否真的在注册表里（决定渲染动画组件还是走兜底） */
const hasAnimatedIcon = computed(() => isAnimatedIconName(safeName.value));

const isLocalSvg = computed(() => safeName.value.startsWith(SVG_PREFIX));

/** 本地 svg symbol 引用路径：svg sprite 的 id 为 icon-{文件名}（文件名已含 koi- 前缀） */
const localHref = computed(() => `#icon-${safeName.value}`);

/** 是否走 iconify 在线渲染（ri:/mdi:/carbon: 等，ep:/anim: 除外） */
const isIconify = computed(() => {
  if (isLocalSvg.value) return false;
  if (isAnimated.value) return false;
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
  // window.__reIcon 可能被 default 主题的 deep ref getter 接管（返回 reactive 代理）：
  // 需 toRaw 解回原始组件再 markRaw，否则渲染的是代理，Vue 会告警
  // 「Component that was made a reactive object」（顶栏天气图标实测触发过）。
  return reg?.iconify ? markRaw(toRaw(reg.iconify)) : null;
});

/** 动画组件缓存：同一图标只解析一次，切换回来不再重复请求 chunk */
const animatedCache = new Map<string, Component>();
const animatedComponent = shallowRef<Component | null>(null);

watch(
  () => (isAnimatedIconName(safeName.value) ? safeName.value : ""),
  async (name, _previous, onCleanup) => {
    if (!name) {
      animatedComponent.value = null;
      return;
    }
    const cached = animatedCache.get(name);
    if (cached) {
      animatedComponent.value = cached;
      return;
    }
    let alive = true;
    onCleanup(() => {
      alive = false;
    });
    const loader = loadAnimatedIcon(name);
    if (!loader) {
      animatedComponent.value = null;
      return;
    }
    const loaded = await loader();
    if (!alive) return;
    const component = markRaw(toRaw(loaded.default));
    animatedCache.set(name, component);
    animatedComponent.value = component;
  },
  { immediate: true },
);

/** 上游动画图标只接受数值尺寸（Number prop），字符串尺寸需解析 */
const animatedSize = computed(() => {
  const value = props.size;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 18;
});

/** 全局兜底图标：任何图标加载失败/不存在时，显示Menu图标，永远不空白 */
const fallbackIcon = computed(() => {
  if (isLocalSvg.value) return null;
  // 已注册的动画图标由动画分支负责（加载中留白，不闪 Menu）
  if (hasAnimatedIcon.value) return null;
  if (isIconify.value && iconifyRenderer.value) return null;
  if (elementIcon.value) return null;
  return (ElementPlusIconsVue as Record<string, unknown>).Menu as Component;
});
</script>

<template>
  <ElIcon :size="size" :color="color" v-bind="$attrs">
    <!-- icons-animated 动画图标：独立 chunk 懒加载，hover/focus 自动播放 -->
    <span
      v-if="isAnimated && hasAnimatedIcon"
      class="re-icon__anim"
      :style="{ width: `${animatedSize}px`, height: `${animatedSize}px` }"
    >
      <component v-if="animatedComponent" :is="animatedComponent" :size="animatedSize" />
    </span>
    <!-- 本地 svg sprite -->
    <svg
      v-else-if="isLocalSvg"
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

/* 动画图标容器：尺寸由 ReIcon 的 size 决定，内部 svg 跟随；居中避免基线偏移 */
.re-icon__anim {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
</style>
