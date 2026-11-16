<script setup lang="ts">
/**
 * ReIcon koi 主题 —— 图标组件（KoiSvgIcon / KoiGlobalIcon 移植）
 *
 * 渲染规则（按优先级）：
 *  - name 是彩色品牌图标（`logos:mysql` 等，见 colorful/names）：离线 SVG body 原色渲染
 *    （按组懒加载独立 chunk）
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
import { isColorfulIconName } from "../../colorful/names";
import { loadColorfulIcon, peekColorfulIcon } from "../../colorful/load";
import type { ColorfulIconBody } from "../../colorful/types";

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

/** 彩色品牌图标（选择器「彩色」页签）：离线 SVG body，保留品牌原色 */
const isColorful = computed(() => isColorfulIconName(safeName.value));

/** 动画图标命名空间：`anim:<lib>:<icon>`（是否已注册另判断） */
const isAnimated = computed(() => safeName.value.startsWith(ANIMATED_ICON_PREFIX));

/** 该名字是否真的在注册表里（决定渲染动画组件还是走兜底） */
const hasAnimatedIcon = computed(() => isAnimatedIconName(safeName.value));

const isLocalSvg = computed(() => safeName.value.startsWith(SVG_PREFIX));

/** 本地 svg symbol 引用路径：svg sprite 的 id 为 icon-{文件名}（文件名已含 koi- 前缀） */
const localHref = computed(() => `#icon-${safeName.value}`);

/** 是否走 iconify 在线渲染（ri:/mdi:/carbon: 等，ep:/anim:/彩色品牌 除外） */
const isIconify = computed(() => {
  if (isLocalSvg.value) return false;
  if (isAnimated.value) return false;
  if (isColorful.value) return false;
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

/** 彩色品牌图标 body（按组懒加载，切回来命中缓存） */
const colorfulBody = shallowRef<ColorfulIconBody | null>(null);

watch(
  () => (isColorfulIconName(safeName.value) ? safeName.value : ""),
  async (name, _previous, onCleanup) => {
    if (!name) {
      colorfulBody.value = null;
      return;
    }
    // 同组切换时 body 已在缓存里，先同步换掉，别让上一张图多显示一帧
    const cached = peekColorfulIcon(name);
    if (cached) {
      colorfulBody.value = cached;
      return;
    }
    let alive = true;
    onCleanup(() => {
      alive = false;
    });
    const body = await loadColorfulIcon(name);
    // 加载中留白，不闪 Menu；切走（alive=false）就别再覆盖别人的 body
    if (alive) colorfulBody.value = body;
  },
  { immediate: true },
);

/** 尺寸归一：字符串（"18px"/"1.2em"）要解析成数值，动画/彩色图标只接受 px 数值 */
function toPixelSize(value: number | string): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 18;
}

/** 上游动画图标只接受数值尺寸（Number prop），字符串尺寸需解析 */
const animatedSize = computed(() => toPixelSize(props.size));

/** 彩色品牌图标：svg 宽高与 viewBox 无关，按 size 给正方形即可 */
const colorfulSize = computed(() => toPixelSize(props.size));

/** 全局兜底图标：任何图标加载失败/不存在时，显示Menu图标，永远不空白 */
const fallbackIcon = computed(() => {
  if (isLocalSvg.value) return null;
  // 已注册的动画/彩色图标由各自分支负责（加载中留白，不闪 Menu）
  if (hasAnimatedIcon.value) return null;
  if (isColorful.value) return null;
  if (isIconify.value && iconifyRenderer.value) return null;
  if (elementIcon.value) return null;
  return (ElementPlusIconsVue as Record<string, unknown>).Menu as Component;
});
</script>

<template>
  <ElIcon :size="size" :color="color" v-bind="$attrs">
    <!-- 彩色品牌图标：离线 body 原色内联（fill 自带，不能走 currentColor）；body 未到时留白 -->
    <svg
      v-if="isColorful"
      aria-hidden="true"
      class="re-icon__colorful"
      :viewBox="colorfulBody?.viewBox"
      :style="{ width: `${colorfulSize}px`, height: `${colorfulSize}px` }"
      v-html="colorfulBody?.body ?? ''"
    />
    <!-- icons-animated 动画图标：独立 chunk 懒加载，hover/focus 自动播放 -->
    <span
      v-else-if="isAnimated && hasAnimatedIcon"
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

/* 彩色品牌图标：保留 body 自带 fill，不继承 currentColor */
.re-icon__colorful {
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
  outline: none;
  flex-shrink: 0;
  overflow: visible;
}
</style>
