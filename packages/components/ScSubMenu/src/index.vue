<template>
  <el-sub-menu
    class="sc-sub-menu"
    :index="index"
    :disabled="disabled"
    :show-timeout="showTimeout"
    :hide-timeout="hideTimeout"
    :popper-append-to-body="popperAppendToBody"
    :popper-class="popperClass"
    :popper-offset="popperOffset"
    :teleported="teleported"
    v-bind="$attrs"
  >
    <template #title>
      <slot name="title" />
    </template>
    <slot />
  </el-sub-menu>
</template>

<script setup lang="ts">
defineProps({
  index: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  showTimeout: { type: Number, default: 0 },
  hideTimeout: { type: Number, default: 0 },
  popperAppendToBody: { type: Boolean, default: true },
  popperClass: { type: String, default: "" },
  popperOffset: { type: Number, default: 0 },
  teleported: { type: Boolean, default: true },
});
</script>

<style scoped>
.sc-sub-menu {
  width: 100%;
}
</style>
