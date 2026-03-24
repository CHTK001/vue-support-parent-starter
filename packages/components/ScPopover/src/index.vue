<template>
  <component
    :is="currentComponent || ElPopover"
    :trigger="trigger"
    :title="title"
    :content="content"
    :width="width"
    :placement="placement"
    :disabled="disabled"
    :visible="visible"
    :offset="offset"
    :show-arrow="showArrow"
    :popper-options="popperOptions"
    :popper-class="popperClass"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :auto-close="autoClose"
    :tabindex="tabindex"
    :teleported="teleported"
    :persistent="persistent"
    @update:visible="handleUpdateVisible"
    @before-enter="handleBeforeEnter"
    @before-leave="handleBeforeLeave"
    @after-enter="handleAfterEnter"
    @after-leave="handleAfterLeave"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.reference" #reference>
      <slot name="reference" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScPopover 弹出框组件
 * 封装 Element Plus Popover 与 PixelUI PxPopover
 * 在 data-skin 为 8bit 时自动切换为像素风弹出框
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElPopover } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  trigger: {
    type: String as PropType<"click" | "hover" | "focus" | "contextmenu">,
    default: "click"
  },
  title: {
    type: String,
    default: ""
  },
  content: {
    type: String,
    default: ""
  },
  width: {
    type: [String, Number],
    default: 150
  },
  placement: {
    type: String,
    default: "bottom"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: undefined
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
  popperClass: {
    type: String,
    default: ""
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
  tabindex: {
    type: [String, Number],
    default: 0
  },
  teleported: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible", "before-enter", "before-leave", "after-enter", "after-leave"]);

const { currentComponent } = useThemeComponent("ElPopover");



const handleUpdateVisible = (visible: boolean) => {
  emit("update:visible", visible);
};

const handleBeforeEnter = () => {
  emit("before-enter");
};

const handleBeforeLeave = () => {
  emit("before-leave");
};

const handleAfterEnter = () => {
  emit("after-enter");
};

const handleAfterLeave = () => {
  emit("after-leave");
};
</script>
