<template>
  <component
    :key="`badge-${currentSkin}`"
    :is="currentComponent || ElBadge"
    class="sc-badge-root"
    :class="resolvedSkin ? `skin--${resolvedSkin}` : ''"
    :data-skin="resolvedSkin || undefined"
    :value="value"
    :max="max"
    :is-dot="isDot"
    :dot="isDot"
    :hidden="hidden"
    :type="type"
    :show-zero="showZero"
    :color="color"
    :offset="offset"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.content" #content>
      <slot name="content" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScBadge 徽章组件
 * 封装 Element Plus Badge
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed, useAttrs, type PropType } from "vue";
import { ElBadge } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  value: {
    type: [String, Number],
    default: ""
  },
  skin: {
    type: String,
    default: "auto"
  },
  max: {
    type: Number,
    default: 99
  },
  isDot: {
    type: Boolean,
    default: false
  },
  hidden: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as PropType<"primary" | "success" | "warning" | "danger" | "info">,
    default: "danger"
  },
  showZero: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: ""
  },
  offset: {
    type: Array as unknown as PropType<[number, number]>,
    default: undefined
  }
});

const attrs = useAttrs();
const { currentComponent, currentSkin } = useThemeComponent("ElBadge");

const normalizeSkin = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const resolvedSkin = computed(() => {
  const propSkin = normalizeSkin(props.skin);
  if (propSkin && propSkin !== "auto") return propSkin;

  const attrSkin = normalizeSkin(attrs["data-skin"]);
  if (attrSkin && attrSkin !== "auto") return attrSkin;

  if (typeof document !== "undefined") {
    const htmlSkin = normalizeSkin(
      document.documentElement?.getAttribute("data-skin"),
    );
    if (htmlSkin && htmlSkin !== "auto") return htmlSkin;

    const bodySkin = normalizeSkin(document.body?.getAttribute("data-skin"));
    if (bodySkin && bodySkin !== "auto") return bodySkin;
  }

  return "";
});
</script>

<style scoped>
</style>
