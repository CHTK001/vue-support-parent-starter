<template>
  <el-dropdown ref="dropdownRef" v-bind="$attrs">
    <slot />
    <template v-if="$slots.dropdown" #dropdown>
      <slot name="dropdown" />
    </template>
  </el-dropdown>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { ElDropdown } from "element-plus";

defineOptions({ inheritAttrs: false });

const dropdownRef = ref<InstanceType<typeof ElDropdown>>();

defineExpose({
  handleClose: () => dropdownRef.value?.handleClose?.(),
  handleOpen: () => dropdownRef.value?.handleOpen?.(),
});
</script>
