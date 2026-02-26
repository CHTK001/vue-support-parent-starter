<template>
  <component
    :is="currentComponent || ElTooltip"
    :content="content"
    :placement="placement"
    :disabled="disabled"
    :offset="offset"
    :show-arrow="showArrow"
    :popper-options="popperOptions"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :auto-close="autoClose"
    :popper-class="popperClass"
    :enterable="enterable"
    :teleported="teleported"
    :trigger="trigger"
    :virtual-triggering="virtualTriggering"
    :virtual-ref="virtualRef"
    :trigger-keys="triggerKeys"
    :persistent="persistent"
    :aria-label="ariaLabel"
    :effect="effect"
    @before-show="handleBeforeShow"
    @before-hide="handleBeforeHide"
    @show="handleShow"
    @hide="handleHide"
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
 * ScTooltip 文字提示组件
 * 封装 Element Plus Tooltip 与 PixelUI PxTooltip
 * 在 data-skin 为 8bit 时自动切换为像素风提示
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElTooltip } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  content: {
    type: String,
    default: ""
  },
  placement: {
    type: String,
    default: "bottom"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  offset: {
    type: Number,
    default: 12
  },
  showArrow: {
    type: Boolean,
    default: true
  },
  popperOptions: {
    type: Object,
    default: () => ({})
  },
  showAfter: {
    type: Number,
    default: 0
  },
  hideAfter: {
    type: Number,
    default: 200
  },
  autoClose: {
    type: Number,
    default: 0
  },
  popperClass: {
    type: String,
    default: ""
  },
  enterable: {
    type: Boolean,
    default: true
  },
  teleported: {
    type: Boolean,
    default: true
  },
  trigger: {
    type: [String, Array] as PropType<"hover" | "click" | "focus" | "contextmenu" | string[]>,
    default: "hover"
  },
  virtualTriggering: {
    type: Boolean,
    default: false
  },
  virtualRef: {
    type: Object,
    default: undefined
  },
  triggerKeys: {
    type: Array as PropType<string[]>,
    default: () => ["Enter", "Space"]
  },
  persistent: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: ""
  },
  effect: {
    type: String as PropType<"dark" | "light">,
    default: "dark"
  }
});

const emit = defineEmits(["before-show", "before-hide", "show", "hide"]);

const { currentComponent } = useThemeComponent("ElTooltip");



const handleBeforeShow = () => {
  emit("before-show");
};

const handleBeforeHide = () => {
  emit("before-hide");
};

const handleShow = () => {
  emit("show");
};

const handleHide = () => {
  emit("hide");
};
</script>
