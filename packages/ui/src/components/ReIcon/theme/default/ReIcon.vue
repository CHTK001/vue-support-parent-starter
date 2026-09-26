<template>
  <!-- HTTP 图床 -->
  <img
    v-if="isHttp"
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
import { computed, ref, onMounted, watch, h, markRaw, type Component } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ElIcon } from "element-plus";

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

const effectiveIcon = computed<string>(() => {
  const raw = effectiveName.value;
  if (!raw) return "";
  if (httpReg.test(raw)) return "";
  if (iconifyReg.test(raw)) return raw;
  return raw;
});

const isHttp = computed(() => httpReg.test(effectiveName.value));
const isIconify = computed(() => iconifyReg.test(effectiveName.value));

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
  if (custom) return markRaw(custom);
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
.re-icon__placeholder,
.re-icon__iconify-placeholder {
  display: inline-block;
  vertical-align: middle;
  width: 1em;
  height: 1em;
}
</style>