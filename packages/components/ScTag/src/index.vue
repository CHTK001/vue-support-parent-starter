<template>
  <component
    :is="currentComponent || ElTag"
    class="sc-tag-root"
    :class="resolvedSkin ? `skin--${resolvedSkin}` : ''"
    :data-skin="resolvedSkin || undefined"
    :type="normalizedType"
    :theme="normalizedType"
    :closable="closable"
    :disable-transitions="disableTransitions"
    :hit="hit"
    :color="color"
    :size="normalizedSize"
    :effect="effect"
    :round="round"
    @close="handleClose"
    @click="handleClick"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScTag 标签组件
 * 封装 Element Plus Tag
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed, useAttrs } from "vue";
import type { PropType } from "vue";
import { ElTag } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  type: {
    type: String as PropType<
      "" | "primary" | "success" | "info" | "warning" | "danger"
    >,
    default: ""
  },
  skin: {
    type: String,
    default: "auto"
  },
  closable: {
    type: Boolean,
    default: false
  },
  disableTransitions: {
    type: Boolean,
    default: false
  },
  hit: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: ""
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  effect: {
    type: String as PropType<"dark" | "light" | "plain">,
    default: "light"
  },
  round: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["close", "click"]);
const attrs = useAttrs();

const { currentComponent } = useThemeComponent("ElTag");
const normalizedType = computed(() => props.type || undefined);
const normalizedSize = computed(() => props.size || undefined);

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

const handleClose = (event: MouseEvent) => {
  emit("close", event);
};

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped>
</style>
