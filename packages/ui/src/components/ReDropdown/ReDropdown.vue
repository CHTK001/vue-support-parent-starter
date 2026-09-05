<script setup lang="ts">
/**
 * ReDropdown —— 下拉菜单（el-dropdown 封装）
 *
 * 用法与 el-dropdown 一致：
 *   <ReDropdown trigger="click">
 *     <ReButton>触发</ReButton>
 *     <template #dropdown>
 *       <ReDropdownMenu>
 *         <ReDropdownItem>选项</ReDropdownItem>
 *       </ReDropdownMenu>
 *     </template>
 *   </ReDropdown>
 */
import { ElDropdown } from "element-plus";

defineOptions({ name: "ReDropdown", inheritAttrs: true });

withDefaults(
  defineProps<{
    trigger?: "hover" | "click" | "contextmenu";
    splitButton?: boolean;
    type?: string;
    size?: "large" | "default" | "small";
    disabled?: boolean;
    hideOnClick?: boolean;
  }>(),
  {
    trigger: "hover",
    splitButton: false,
    type: "default",
    size: "default",
    disabled: false,
    hideOnClick: true,
  },
);
</script>

<template>
  <ElDropdown
    v-bind="$attrs"
    :trigger="trigger"
    :split-button="splitButton"
    :type="type"
    :size="size"
    :disabled="disabled"
    :hide-on-click="hideOnClick"
    popper-class="re-dropdown"
  >
    <slot />
    <template #dropdown>
      <slot name="dropdown" />
    </template>
  </ElDropdown>
</template>