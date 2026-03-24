<template>
  <component
    :is="currentComponent || ElPopconfirm"
    :title="title"
    :confirm-button-text="confirmButtonText"
    :cancel-button-text="cancelButtonText"
    :confirm-button-type="confirmButtonType"
    :cancel-button-type="cancelButtonType"
    :icon="icon"
    :icon-color="iconColor"
    :hide-icon="hideIcon"
    :hide-after="hideAfter"
    :teleported="teleported"
    :persistent="persistent"
    :width="width"
    @confirm="handleConfirm"
    @cancel="handleCancel"
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
 * ScPopconfirm 气泡确认框组件
 * 封装 Element Plus Popconfirm 与 PixelUI PxPopconfirm
 * 在 data-skin 为 8bit 时自动切换为像素风确认框
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElPopconfirm } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  title: {
    type: String,
    default: ""
  },
  confirmButtonText: {
    type: String,
    default: ""
  },
  cancelButtonText: {
    type: String,
    default: ""
  },
  confirmButtonType: {
    type: String as PropType<"" | "primary" | "success" | "warning" | "danger" | "info" | "text">,
    default: "primary"
  },
  cancelButtonType: {
    type: String as PropType<"" | "primary" | "success" | "warning" | "danger" | "info" | "text">,
    default: "text"
  },
  icon: {
    type: [String, Object],
    default: ""
  },
  iconColor: {
    type: String,
    default: "#f90"
  },
  hideIcon: {
    type: Boolean,
    default: false
  },
  hideAfter: {
    type: Number,
    default: 200
  },
  teleported: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  },
  width: {
    type: [String, Number],
    default: 150
  }
});

const emit = defineEmits(["confirm", "cancel"]);

const { currentComponent } = useThemeComponent("ElPopconfirm");



const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
};
</script>
