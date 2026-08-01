<script setup lang="ts">
/**
 * ReIcon —— 通用图标组件
 *
 * 支持的图标源（自动识别）：
 *   1) Element Plus Icons：传入 `name="Search"` 等 PascalCase 名
 *   2) Iconify 三方库：传入 `name="ri:home-line"` / `"ep:edit"` / `"mdi:account"`
 *      含 `:` 的字符串走 Iconify 模式（需业务保证图标可访问，
 *      业务可通过 app.component 注册 `IconifyIconOnline` 后接管渲染）
 *   3) HTTP 图床：`name="https://..."` 直接渲染为 <img>
 *   4) iconfont：`name="icon-search"` 渲染为 `<i class="iconfont icon-search">`
 *
 * 用法：
 *   <ReIcon name="Search" />                              <!-- Element Plus 图标 -->
 *   <ReIcon name="ri:home-line" :size="20" />             <!-- Remix Icon -->
 *   <ReIcon name="https://example.com/x.svg" />           <!-- HTTP 图床 -->
 *   <ReIcon name="icon-home" icon-type="iconfont" />      <!-- iconfont class -->
 *   <ReIcon name="home" icon-type="uni" />                <!-- iconfont unicode -->
 */
import { computed } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ElIcon } from "element-plus";

defineOptions({ name: "ReIcon", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 图标名 / Iconify 字符串 / HTTP URL / iconfont 类名 */
    name: string;
    /** 图标尺寸（px） */
    size?: number | string;
    /** 图标颜色 */
    color?: string;
    /**
     * 名称为 iconfont 类名时，iconType 决定渲染方式：
     *   - "iconfont" 或不传：class 引用
     *   - "uni"：unicode 引用
     *   - "svg"：symbol 引用（配合 svg sprite）
     */
    iconType?: "iconfont" | "uni" | "svg" | "";
    /** 强制走 Element Plus 图标库（即使含 `:`） */
    forceElement?: boolean;
  }>(),
  {
    size: 16,
    color: "",
    iconType: "",
    forceElement: false,
  },
);

/** HTTP 远程图标 */
const httpReg = /^https?:\/\//;

/** 是否为 Iconify 三方图标（含 `:` 且未指定 iconType） */
const isIconify = computed<boolean>(() => {
  if (props.forceElement) return false;
  if (props.iconType) return false;
  if (httpReg.test(props.name)) return false;
  return props.name.includes(":");
});

/** 是否为 HTTP 图床 */
const isHttp = computed<boolean>(() => !props.forceElement && httpReg.test(props.name));

/** Element Plus 图标组件解析 */
const elementIcon = computed(() => {
  if (props.forceElement) return resolveElement(props.name);
  if (httpReg.test(props.name)) return null;
  if (props.iconType) return null;
  if (props.name.includes(":")) return null;
  return resolveElement(props.name);
});

function resolveElement(name: string) {
  const icons = ElementPlusIconsVue as Record<string, unknown>;
  return icons[name] ?? null;
}
</script>

<template>
  <!-- HTTP 图床 -->
  <img
    v-if="isHttp"
    :src="name"
    alt="icon"
    class="re-icon re-icon--http"
    :style="{
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
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

  <!-- iconfont unicode -->
  <i
    v-else-if="iconType === 'uni'"
    class="iconfont"
    :style="{
      fontSize: typeof size === 'number' ? `${size}px` : size,
      color: color || undefined,
    }"
    v-bind="$attrs"
  >{{ name }}</i>

  <!-- iconfont svg symbol -->
  <svg
    v-else-if="iconType === 'svg'"
    class="icon-svg re-icon"
    aria-hidden="true"
    :style="{
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      color: color || undefined,
    }"
    v-bind="$attrs"
  >
    <use :xlink:href="`#${name}`" />
  </svg>

  <!-- iconfont class / Iconify 三方库占位（业务可通过同名 slot / app.component 接管 Iconify） -->
  <ElIcon
    v-else
    v-bind="$attrs"
    :size="size"
    :color="color"
  >
    <span
      v-if="isIconify"
      class="re-icon__iconify-placeholder"
      :data-icon="name"
    />
    <i
      v-else
      :class="`iconfont ${name}`"
    />
  </ElIcon>
</template>

<style scoped>
.re-icon {
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
  outline: none;
}
.re-icon__iconify-placeholder {
  display: inline-block;
  vertical-align: middle;
  width: 1em;
  height: 1em;
  /* 业务可通过 css 注入：使用 [data-icon]::before { content: ... } 或挂载 IconifyIconOnline 替换 */
}
</style>