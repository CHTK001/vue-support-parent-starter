<template>
  <!-- 彩色品牌图标：离线 body 原色内联（fill 自带，不能走 currentColor）；body 未到时留白 -->
  <svg
    v-if="isColorful"
    aria-hidden="true"
    class="re-icon re-icon__colorful"
    :viewBox="colorfulBody?.viewBox"
    :style="{ width: `${colorfulSize}px`, height: `${colorfulSize}px` }"
    v-html="colorfulBody?.body ?? ''"
    v-bind="$attrs"
  />

  <!-- icons-animated 动画图标：独立 chunk 懒加载，hover/focus 自动播放 -->
  <span
    v-else-if="isAnimated && hasAnimatedIcon"
    class="re-icon re-icon__anim"
    :style="{
      width: `${animatedSize}px`,
      height: `${animatedSize}px`,
      color: color || undefined,
    }"
    v-bind="$attrs"
  >
    <component v-if="animatedComponent" :is="animatedComponent" :size="animatedSize" />
  </span>

  <!-- HTTP 图床 -->
  <img
    v-else-if="isHttp"
    :src="effectiveName"
    alt="icon"
    class="re-icon re-icon--http"
    :style="{
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      color: color || undefined,
    }"
    v-bind="$attrs"
  />

  <!-- iconfont svg symbol -->
  <svg
    v-else-if="iconType === 'svg' && effectiveIcon"
    class="icon-svg re-icon"
    aria-hidden="true"
    :style="{
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      color: color || undefined,
    }"
    v-bind="$attrs"
  >
    <use :xlink:href="`#${effectiveIcon}`" />
  </svg>

  <!-- iconfont Unicode -->
  <i
    v-else-if="iconType === 'uni' && effectiveIcon"
    class="re-icon iconfont"
    :style="{
      fontSize: typeof size === 'number' ? `${size}px` : size,
      color: color || undefined,
    }"
    v-bind="$attrs"
  >{{ uniGlyph }}</i>

  <!-- iconfont class -->
  <i
    v-else-if="iconType === 'iconfont' && effectiveIcon"
    :class="['re-icon', 'iconfont', `icon-${effectiveIcon}`]"
    :style="{
      fontSize: typeof size === 'number' ? `${size}px` : size,
      color: color || undefined,
    }"
    v-bind="$attrs"
  />

  <!-- Element Plus 图标 -->
  <ElIcon
    v-else-if="elementIcon"
    v-bind="$attrs"
    :size="size"
    :color="color"
  >
    <component :is="elementIcon" />
  </ElIcon>

  <!-- Iconify 在线渲染器（业务可注册 IconifyIconOnline） -->
  <ElIcon
    v-else-if="isIconify"
    v-bind="$attrs"
    :size="size"
    :color="color"
  >
    <component :is="iconifyRenderer" :icon="effectiveIcon" />
  </ElIcon>

  <!-- 全局兜底图标：任何图标不存在时显示Menu，永不空白 -->
  <ElIcon
    v-else
    v-bind="$attrs"
    :size="size"
    :color="color"
  >
    <component :is="fallbackMenuIcon" />
  </ElIcon>
</template>

<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
/**
 * ReIcon —— 通用图标组件（v-model + 多源 + 可扩展）
 *
 * 支持的图标源（自动识别）：
 *   0) 彩色品牌图标（name 为内置的 `logos:mysql` 等，见 colorful/names）→ 离线 body 原色渲染
 *   1) Element Plus：name="Search" 等 PascalCase（自动）
 *   2) ep:xxx          → 强制走 Element Plus（兼容未注册前缀）
 *   3) ri:xxx / mdi:xxx / carbon:xxx 等 → Iconify 三方库
 *      业务可注入 `IconifyIconOnline` 组件接管渲染（自动查找）
 *   4) HTTP URL         → name="https://..."
 *   5) iconfont class  → icon-type="iconfont" + iconfontUrl
 *   6) iconfont svg    → icon-type="svg" + iconfontUrl
 *   7) iconfont unicode → icon-type="uni" + iconfontUrl + 图标字典（注册 unicode）
 *
 * v-model:
 *   <ReIcon v-model="icon" />
 *
 * 扩展（通过 globalThis.__reIcon）：
 *   1) globalThis.__reIcon.iconify = Component    // 注册 Iconify 渲染组件（必填 props: { icon }）
 *   2) globalThis.__reIcon.iconfontUrls = string[] // 注册 iconfont CSS url 列表
 *   3) globalThis.__reIcon.iconfontDict = { [name]: unicode } // iconfont Unicode 字典
 *
 *   业务可在 main.ts：
 *     app.config.globalProperties.$reIcon = {
 *       iconify: IconifyIconOnline,
 *       iconfontUrls: ['//at.alicdn.com/t/c/font_xxx.css'],
 *       iconfontDict: { 'home': '&#xe600;' }
 *     }
 */
import { computed, ref, onMounted, shallowRef, watch, h, markRaw, toRaw, type Component } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ElIcon } from "element-plus";
import { ANIMATED_ICON_PREFIX, isAnimatedIconName, loadAnimatedIcon } from "../../animated/registry";
import { isColorfulIconName } from "../../colorful/names";
import { loadColorfulIcon, peekColorfulIcon } from "../../colorful/load";
import type { ColorfulIconBody } from "../../colorful/types";

defineOptions({ name: "ReIcon", inheritAttrs: true });

interface IconReg {
  iconify?: Component;
  iconfontUrls?: string[];
  iconfontDict?: Record<string, string>;
}

const props = withDefaults(
  defineProps<{
    /** 图标名：ep:xxx / ri:xxx / mdi:xxx / http(s) / PascalCase / class 名 */
    name?: string;
    /** 图标尺寸（px） */
    size?: number | string;
    /** 图标颜色 */
    color?: string;
    /** iconfont 渲染方式 */
    iconType?: "iconfont" | "uni" | "svg" | "iconify" | "";
    /** iconfont 字体地址（覆盖全局） */
    iconfontUrl?: string;
    /** 强制走 Element Plus 图标库 */
    forceElement?: boolean;
  }>(),
  {
    name: "",
    size: 16,
    color: "",
    iconType: "",
    iconfontUrl: "",
    forceElement: false,
  },
);

const emit = defineEmits<{
  (e: "update:name", val: string): void;
  (e: "change", val: string): void;
}>();

/** 全局注册表（业务可挂载） */
function readIconReg(): IconReg {
  const w = (typeof window !== "undefined" ? window : (globalThis as unknown as Window)) as unknown as {
    __reIcon?: IconReg;
  };
  return w.__reIcon ?? {};
}
const iconReg = ref<IconReg>(readIconReg());
/** 全局兜底Menu图标 */
const fallbackMenuIcon = computed(() => (ElementPlusIconsVue as Record<string, unknown>).Menu as Component);

/** v-model 双向 */
const localName = computed<string>({
  get: () => props.name,
  set: (val) => {
    emit("update:name", val);
    emit("change", val);
  },
});
const effectiveName = computed(() => {
  const raw = localName.value;
  return typeof raw === "string" ? raw : "";
});

const httpReg = /^https?:\/\//;
const iconifyReg = /^[a-z]{2,}:/;
const epReg = /^[A-Z][a-zA-Z0-9]*$/;

/** 彩色品牌图标（选择器「彩色」页签）：离线 SVG body，保留品牌原色 */
const isColorful = computed(() => isColorfulIconName(effectiveName.value));

/** 动画图标命名空间：`anim:<lib>:<icon>`（是否已注册另判断） */
const isAnimated = computed(() => effectiveName.value.startsWith(ANIMATED_ICON_PREFIX));

/** 该名字是否真的在注册表里（决定渲染动画组件还是走兜底） */
const hasAnimatedIcon = computed(() => isAnimatedIconName(effectiveName.value));

const effectiveIcon = computed<string>(() => {
  const raw = effectiveName.value;
  if (!raw) return "";
  if (httpReg.test(raw)) return "";
  if (iconifyReg.test(raw)) return raw;
  return raw;
});

const isHttp = computed(() => httpReg.test(effectiveName.value));
const isIconify = computed(
  () => !isAnimated.value && !isColorful.value && iconifyReg.test(effectiveName.value),
);

/** Element Plus 图标解析 */
const elementIcon = computed(() => {
  const raw = effectiveName.value;
  if (!raw) return null;
  if (httpReg.test(raw)) return null;
  if (props.forceElement) {
    return resolveElement(unwrapPrefix(raw));
  }
  if (raw.startsWith("ep:")) return resolveElement(raw.slice(3));
  if (iconifyReg.test(raw)) return null;
  if (epReg.test(raw)) return resolveElement(raw);
  return null;
});

function unwrapPrefix(name: string) {
  if (name.startsWith("ep:")) return name.slice(3);
  return name;
}

function resolveElement(name: string) {
  if (!name) return null;
  const icons = ElementPlusIconsVue as Record<string, unknown>;
  if (icons[name]) return icons[name];
  // ep:menu → Menu；ep:alarm-clock → AlarmClock（Element Plus 图标名为 PascalCase）
  const pascal = name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return icons[pascal] ?? null;
}

/** Iconify 自定义渲染器（未注册时用占位组件） */
const iconifyRenderer = computed<Component>(() => {
  const custom = iconReg.value.iconify;
  // iconReg 是 deep ref：首次读 .iconify 会把组件包成 reactive proxy，markRaw(proxy)
  // 只给 target 打标记、返回的仍是 proxy —— 直接渲染会告警「Component that was
  // made a reactive object」。先 toRaw 解回原始组件再 markRaw，让后续读取不再产生代理。
  if (custom) return markRaw(toRaw(custom));
  // 占位子组件：渲染为 <span data-icon />
  return {
    name: "ReIconifyPlaceholder",
    props: { icon: { type: String, default: "" } },
    setup(props: { icon: string }) {
      return () =>
        // @ts-expect-error runtime jsx
        h("span", { class: "re-icon__iconify-placeholder", "data-icon": props.icon || "" });
    },
  };
});

/** 动画组件缓存：同一图标只解析一次，切换回来不再重复请求 chunk */
const animatedCache = new Map<string, Component>();
const animatedComponent = shallowRef<Component | null>(null);

watch(
  () => (isAnimatedIconName(effectiveName.value) ? effectiveName.value : ""),
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
  () => (isColorfulIconName(effectiveName.value) ? effectiveName.value : ""),
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

/* ==================== 动画图标常驻播放 ==================== */

// 引入 h 以支持占位组件

/** iconfont css 自动注入 */
const linkInjected = ref<Set<string>>(new Set());
function injectCss(url: string) {
  if (!url || linkInjected.value.has(url)) return;
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[data-re-iconfont="${url}"]`)) {
    linkInjected.value.add(url);
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-re-iconfont", url);
  document.head.appendChild(link);
  linkInjected.value.add(url);
}
function collectIconfontUrls(): string[] {
  const list: string[] = [];
  if (props.iconfontUrl) list.push(props.iconfontUrl);
  const all = (iconReg.value.iconfontUrls ?? []).slice();
  list.push(...all);
  return Array.from(new Set(list));
}
watch(
  () => collectIconfontUrls().join("|"),
  () => {
    for (const url of collectIconfontUrls()) injectCss(url);
  },
  { immediate: true },
);
onMounted(() => {
  for (const url of collectIconfontUrls()) injectCss(url);
});

/** iconfont Unicode 渲染 */
const uniGlyph = computed<string>(() => {
  if (props.iconType !== "uni") return "";
  const raw = effectiveIcon.value || effectiveName.value;
  // name 是 unicode 字面
  if (/^&#x[0-9a-f]+;$/i.test(raw)) return raw;
  if (/^0x[0-9a-f]+$/i.test(raw)) return String.fromCharCode(parseInt(raw, 16));
  if (/^&#\d+;$/.test(raw)) return raw;
  // 业务可注入字典：globalThis.__reIcon.iconfontDict
  const dict = iconReg.value.iconfontDict ?? {};
  if (dict[raw]) return dict[raw];
  return raw;
});

/** 监听全局注册表变化（业务动态注入） */
if (typeof window !== "undefined") {
  Object.defineProperty(window, "__reIcon", {
    configurable: true,
    get: () => iconReg.value,
    set: (val) => {
      iconReg.value = val ?? {};
      // 重新触发 iconfont 注入
      for (const url of collectIconfontUrls()) injectCss(url);
    },
  });
}
</script>

<style scoped>
.re-icon {
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
.re-icon__placeholder,
.re-icon__iconify-placeholder {
  display: inline-block;
  vertical-align: middle;
  width: 1em;
  height: 1em;
}
</style>